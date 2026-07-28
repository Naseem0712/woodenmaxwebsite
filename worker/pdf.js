/**
 * Server-side PDF rendering.
 *
 * Prefer the Workers Browser binding (`env.BROWSER.quickAction`) — no API token
 * needed once Browser Rendering is enabled on the account. Fall back to the
 * REST `/browser-rendering/pdf` endpoint when the binding is unavailable
 * (needs CF_ACCOUNT_ID + CF_BROWSER_TOKEN with Browser Rendering Edit).
 *
 * Empty HTTP 400 bodies usually mean: wrong/missing CF_ACCOUNT_ID, wrong token
 * permission, Browser Rendering not enabled, or invalid pdfOptions
 * (format must be lowercase e.g. "a4" — "A4" yields empty 400).
 */
import { workerErr } from './http.js';

const ENDPOINT = 'https://api.cloudflare.com/client/v4/accounts/{account}/browser-rendering/pdf';
const TIMEOUT_MS = 45000;

function pdfEndpoint (accountId) {
  return ENDPOINT.replace('{account}', encodeURIComponent(accountId));
}

function buildPayloads (html) {
  // Prefer the full options first; on 400 retry with the minimal body CF docs
  // accept (html only). format MUST be lowercase — "A4" yields empty HTTP 400.
  return [
    {
      html,
      pdfOptions: {
        format: 'a4',
        printBackground: true,
        margin: { top: '12mm', right: '10mm', bottom: '14mm', left: '10mm' },
      },
    },
    {
      html,
      pdfOptions: {
        format: 'a4',
        printBackground: true,
      },
    },
    { html },
  ];
}

async function readErrorDetail (res) {
  const bits = [];
  try {
    const ct = res.headers.get('content-type');
    if (ct) bits.push('ct=' + ct);
  } catch (e) { /* ignore */ }
  try {
    const ray = res.headers.get('cf-ray');
    if (ray) bits.push('cf-ray=' + ray);
  } catch (e) { /* ignore */ }
  try {
    const cl = res.headers.get('content-length');
    if (cl != null) bits.push('content-length=' + cl);
  } catch (e) { /* ignore */ }

  let raw = '';
  try { raw = await res.text(); } catch (e) { bits.push('unreadable body'); }

  if (raw) {
    try {
      const body = JSON.parse(raw);
      const err0 = body && body.errors && body.errors[0];
      const msg = (err0 && (err0.message || (err0.code != null ? 'code ' + err0.code : '')))
        || (body && body.message)
        || raw.slice(0, 400);
      bits.push(msg);
      if (err0 && err0.code != null) bits.push('err_code=' + err0.code);
    } catch (e2) {
      bits.push(raw.slice(0, 400));
    }
  } else {
    bits.push('empty body');
  }

  if (res.status === 400 || res.status === 401 || res.status === 403) {
    bits.push(
      'hint=Prefer Workers [browser] binding (no token). Or create API token with ' +
      'Account → Browser Rendering → Edit; CF_ACCOUNT_ID must be hex account id from wrangler whoami'
    );
  }

  return bits.join(' | ');
}

function isPdfBytes (buf) {
  return buf && buf.length >= 1000 && buf[0] === 0x25 /* % */ && buf[1] === 0x50 /* P */;
}

async function bytesFromBindingResult (result) {
  if (!result) return null;
  if (result instanceof Uint8Array) return result;
  if (result instanceof ArrayBuffer) return new Uint8Array(result);
  if (typeof Response !== 'undefined' && result instanceof Response) {
    return new Uint8Array(await result.arrayBuffer());
  }
  if (typeof result.arrayBuffer === 'function') {
    return new Uint8Array(await result.arrayBuffer());
  }
  if (result.body && typeof result.body.getReader === 'function') {
    const res = new Response(result.body);
    return new Uint8Array(await res.arrayBuffer());
  }
  return null;
}

/**
 * Workers Browser binding — no CF_BROWSER_TOKEN required.
 * Needs wrangler `[browser] binding = "BROWSER"` and compatibility_date >= 2026-03-24.
 */
async function renderViaBinding (env, html) {
  const browser = env && env.BROWSER;
  if (!browser || typeof browser.quickAction !== 'function') {
    return null;
  }

  const attempts = [
    {
      html,
      pdfOptions: {
        format: 'a4',
        printBackground: true,
        margin: { top: '12mm', right: '10mm', bottom: '14mm', left: '10mm' },
      },
    },
    { html, pdfOptions: { format: 'a4', printBackground: true } },
    { html },
  ];

  let lastErr = '';
  for (const payload of attempts) {
    try {
      const result = await browser.quickAction('pdf', payload);
      const buf = await bytesFromBindingResult(result);
      if (isPdfBytes(buf)) return buf;
      lastErr = 'binding returned non-PDF bytes=' + (buf ? buf.length : 0);
    } catch (e) {
      lastErr = String((e && e.message) || e).slice(0, 300);
    }
  }
  throw workerErr('Browser binding PDF failed: ' + lastErr, 'PDF');
}

async function postPdf (accountId, token, payload, signal) {
  return fetch(pdfEndpoint(accountId), {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Accept: 'application/pdf, application/json',
    },
    signal,
    body: JSON.stringify(payload),
  });
}

async function renderViaRest (env, html) {
  const accountId = String(env.CF_ACCOUNT_ID || '').trim();
  const token = String(env.CF_BROWSER_TOKEN || '').trim();
  if (!accountId || !token) {
    throw workerErr('Browser Rendering REST is not configured (CF_ACCOUNT_ID / CF_BROWSER_TOKEN).', 'CONFIG');
  }
  if (!/^[a-f0-9]{32}$/i.test(accountId)) {
    throw workerErr(
      'CF_ACCOUNT_ID looks invalid (expected 32-char hex from `wrangler whoami`). Got prefix=' +
        accountId.slice(0, 8),
      'CONFIG'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const payloads = buildPayloads(String(html));
  let lastDetail = '';

  try {
    for (let i = 0; i < payloads.length; i++) {
      let res;
      try {
        res = await postPdf(accountId, token, payloads[i], controller.signal);
      } catch (e) {
        if (e && e.name === 'AbortError') throw workerErr('PDF rendering timed out', 'PDF_TIMEOUT');
        throw workerErr('PDF rendering request failed: ' + ((e && e.message) || e), 'PDF');
      }

      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        if (!isPdfBytes(buf)) {
          let preview = '';
          try {
            preview = new TextDecoder().decode(buf.slice(0, 300));
          } catch (e2) { /* ignore */ }
          throw workerErr(
            'Browser Rendering returned something that is not a PDF' +
              (preview ? (' | ' + preview) : '') +
              ' | bytes=' + buf.length,
            'PDF'
          );
        }
        return buf;
      }

      lastDetail = await readErrorDetail(res);
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        throw workerErr('Browser Rendering returned ' + res.status + ': ' + lastDetail, 'PDF');
      }
      if (res.status !== 400 && res.status !== 422) {
        throw workerErr('Browser Rendering returned ' + res.status + ': ' + lastDetail, 'PDF');
      }
    }
  } finally {
    clearTimeout(timer);
  }

  throw workerErr('Browser Rendering returned 400: ' + lastDetail, 'PDF');
}

export async function renderQuotePdf (env, html) {
  if (!html || String(html).length < 32) {
    throw workerErr('PDF html payload is empty', 'PDF');
  }

  // Prefer binding (no token) — REST is fallback for older deploys / misconfig.
  try {
    const viaBind = await renderViaBinding(env, String(html));
    if (viaBind) return viaBind;
  } catch (e) {
    // If binding exists but failed, still try REST before giving up.
    const accountId = String(env.CF_ACCOUNT_ID || '').trim();
    const token = String(env.CF_BROWSER_TOKEN || '').trim();
    if (!accountId || !token) throw e;
    console.error('browser binding PDF failed, trying REST', e && e.message);
  }

  return renderViaRest(env, String(html));
}

/** Optional deep health probe — tiny HTML render, does not store anything. */
export async function probeBrowserRendering (env) {
  const html = '<!DOCTYPE html><html><body><h1>WoodenMax PDF probe</h1></body></html>';
  const hasBinding = Boolean(env && env.BROWSER && typeof env.BROWSER.quickAction === 'function');
  try {
    const pdf = await renderQuotePdf(env, html);
    return { ok: true, bytes: pdf.length, via: hasBinding ? 'binding_or_rest' : 'rest' };
  } catch (e) {
    return {
      ok: false,
      error: String((e && e.message) || e).slice(0, 500),
      browser_binding: hasBinding,
      cf_account_id_ok: /^[a-f0-9]{32}$/i.test(String(env.CF_ACCOUNT_ID || '').trim()),
    };
  }
}

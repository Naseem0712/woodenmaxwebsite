/**
 * Server-side PDF rendering via the Cloudflare Browser Rendering REST API.
 *
 * The REST `/pdf` quick action is used instead of the Puppeteer binding so the
 * Worker stays dependency-free. It needs two secrets:
 *
 *   CF_ACCOUNT_ID      Cloudflare account id
 *   CF_BROWSER_TOKEN   API token with the "Browser Rendering: Edit" permission
 *
 * Returns raw PDF bytes (Uint8Array), which D1 stores as a BLOB.
 */
import { workerErr } from './http.js';

const ENDPOINT = 'https://api.cloudflare.com/client/v4/accounts/{account}/browser-rendering/pdf';
const TIMEOUT_MS = 45000;

export async function renderQuotePdf (env, html) {
  const accountId = String(env.CF_ACCOUNT_ID || '').trim();
  const token = String(env.CF_BROWSER_TOKEN || '').trim();
  if (!accountId || !token) {
    throw workerErr('Browser Rendering is not configured (CF_ACCOUNT_ID / CF_BROWSER_TOKEN).', 'CONFIG');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(ENDPOINT.replace('{account}', accountId), {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        html,
        // Do not pass gotoOptions with inline html — Cloudflare returns 400.
        pdfOptions: {
          format: 'A4',
          printBackground: true,
          margin: { top: '12mm', right: '10mm', bottom: '14mm', left: '10mm' },
        },
      }),
    });
  } catch (e) {
    clearTimeout(timer);
    if (e && e.name === 'AbortError') throw workerErr('PDF rendering timed out', 'PDF_TIMEOUT');
    throw workerErr('PDF rendering request failed: ' + ((e && e.message) || e), 'PDF');
  }
  clearTimeout(timer);

  if (!res.ok) {
    let detail = '';
    try {
      const raw = await res.text();
      if (raw) {
        try {
          const body = JSON.parse(raw);
          detail = (body && body.errors && body.errors[0] && body.errors[0].message)
            || (body && body.message)
            || raw.slice(0, 400);
        } catch (e2) {
          detail = raw.slice(0, 400);
        }
      } else {
        detail = 'empty body';
      }
    } catch (e) {
      detail = 'unreadable body';
    }
    throw workerErr('Browser Rendering returned ' + res.status + ': ' + detail, 'PDF');
  }

  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length < 1000 || buf[0] !== 0x25 /* % */ || buf[1] !== 0x50 /* P */) {
    throw workerErr('Browser Rendering returned something that is not a PDF', 'PDF');
  }
  return buf;
}

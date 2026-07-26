-- WoodenMax order system — initial schema.
--
--   npx wrangler d1 migrations apply woodenmax --local
--   npx wrangler d1 migrations apply woodenmax --remote
--
-- Money is stored in whole rupees (INR) as INTEGER. Paise-level amounts coming
-- from Razorpay are kept separately where they matter, so nothing is ever
-- rounded twice.

CREATE TABLE IF NOT EXISTS quotes (
  id              TEXT PRIMARY KEY,
  quote_no        TEXT NOT NULL UNIQUE,
  version         INTEGER NOT NULL DEFAULT 1,
  customer_json   TEXT NOT NULL,
  items_json      TEXT NOT NULL,
  subtotal_inr    INTEGER NOT NULL DEFAULT 0,
  gst_inr         INTEGER NOT NULL DEFAULT 0,
  total_inr       INTEGER NOT NULL DEFAULT 0,
  source_url      TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- Every save of a quote is kept, so "the customer changed the products after
-- I sent the estimate" is answerable instead of a guess.
CREATE TABLE IF NOT EXISTS quote_versions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id        TEXT NOT NULL,
  version         INTEGER NOT NULL,
  customer_json   TEXT NOT NULL,
  items_json      TEXT NOT NULL,
  total_inr       INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  UNIQUE (quote_id, version)
);

CREATE TABLE IF NOT EXISTS orders (
  id                 TEXT PRIMARY KEY,
  order_no           TEXT NOT NULL UNIQUE,
  quote_id           TEXT NOT NULL,
  quote_version      INTEGER NOT NULL DEFAULT 1,
  razorpay_order_id  TEXT,
  -- Idempotency key: verify-payment and the webhook both race to fulfil the
  -- same payment, and exactly one of them must win.
  payment_id         TEXT UNIQUE,
  payment_mode       TEXT,
  amount_paid_inr    INTEGER NOT NULL DEFAULT 0,
  order_total_inr    INTEGER NOT NULL DEFAULT 0,
  balance_due_inr    INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'created',
  customer_json      TEXT,
  items_json         TEXT,
  pdf_blob           BLOB,
  pdf_bytes          INTEGER NOT NULL DEFAULT 0,
  pdf_status         TEXT NOT NULL DEFAULT 'pending',
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_quote   ON orders (quote_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders (status);

-- Append-only audit log. Every step of the paid-order pipeline lands here, so a
-- missing PDF or email can be traced without reproducing the order.
CREATE TABLE IF NOT EXISTS order_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no    TEXT,
  quote_id    TEXT,
  type        TEXT NOT NULL,
  detail_json TEXT,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_order ON order_events (order_no, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type  ON order_events (type, created_at DESC);

-- Outbound mail is queued rather than fire-and-forget, so a provider blip
-- retries instead of silently losing a paid order's confirmation.
CREATE TABLE IF NOT EXISTS email_queue (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no        TEXT,
  kind            TEXT NOT NULL,
  to_email        TEXT NOT NULL,
  subject         TEXT NOT NULL,
  body_text       TEXT NOT NULL,
  attach_pdf      INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending',
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  next_attempt_at INTEGER NOT NULL,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_queue_due ON email_queue (status, next_attempt_at);

-- Human-readable running numbers (WM-Q-2026-0001 / WM-O-2026-0001).
CREATE TABLE IF NOT EXISTS counters (
  name  TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

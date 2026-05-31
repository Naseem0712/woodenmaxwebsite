/**
 * Local Razorpay API (dev). Production: Cloudflare Worker (worker.js).
 *   node server/index.mjs
 *   POST http://localhost:8787/api/create-order
 *   POST http://localhost:8787/api/verify-payment
 */
import 'dotenv/config';
import express from 'express';
import {
  handleCreateOrderRequest,
  handleVerifyPaymentRequest,
  corsHeaders,
} from '../lib/razorpay-handlers.mjs';

const PORT = Number(process.env.PORT) || 8787;

const env = {
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
};

const app = express();
app.use(express.json());

app.use(function (req, res, next) {
  Object.entries(corsHeaders()).forEach(function ([k, v]) {
    res.setHeader(k, v);
  });
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.post('/api/create-order', async function (req, res) {
  const fakeReq = {
    json: async () => req.body,
  };
  const response = await handleCreateOrderRequest(fakeReq, env);
  const data = await response.json();
  res.status(response.status).json(data);
});

app.post('/api/verify-payment', async function (req, res) {
  const fakeReq = {
    json: async () => req.body,
  };
  const response = await handleVerifyPaymentRequest(fakeReq, env);
  const data = await response.json();
  res.status(response.status).json(data);
});

app.get('/health', function (_req, res) {
  res.json({
    ok: true,
    razorpay: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
  });
});

app.listen(PORT, function () {
  console.log('WoodenMax payments API → http://localhost:' + PORT);
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    console.warn('Warning: copy .env.example to .env and set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET');
  }
});

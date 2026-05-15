import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectDB } from './db.js';
import { warmup as warmupEmbeddings } from './lib/embeddings.js';

import searchRouter from './routes/search.js';
import productsRouter from './routes/products.js';
import adminRouter from './routes/admin.js';

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/image-search';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, '../frontend/dist');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin === 'https://admin.shopify.com') return true;
  if (/^https:\/\/[a-z0-9-]+\.myshopify\.com$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(origin)) return true;
  return false;
}

const app = express();
app.use(
  cors({
    origin(origin, cb) {
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, hfConfigured: Boolean(process.env.HUGGINGFACE_API_TOKEN) })
);

app.use('/api/products', productsRouter);
app.use('/api/search', searchRouter);
app.use('/api/admin', adminRouter);

app.get('/admin', (_req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors https://*.myshopify.com https://admin.shopify.com"
  );
  res.sendFile(join(__dirname, 'views/admin.html'));
});

app.use(express.static(distPath));

app.get('/', (_req, res) =>
  res.type('text/plain').send('Image Search Widget backend. Use /api/* endpoints.')
);

async function start() {
  app.listen(PORT, () => console.log(`API listening on port ${PORT}`));

  try {
    await connectDB(MONGODB_URI);
    console.log('Mongo connected.');
  } catch (err) {
    console.error('Mongo connection failed:', err);
  }

  try {
    await warmupEmbeddings();
  } catch (err) {
    console.error('Embeddings warmup failed:', err);
  }
}

start();

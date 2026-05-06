import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectDB } from './db.js';
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

const app = express();
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
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

  if (!process.env.HUGGINGFACE_API_TOKEN) {
    console.warn('HUGGINGFACE_API_TOKEN not set — /api/search will fail');
  }
}

start();

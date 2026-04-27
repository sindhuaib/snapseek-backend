import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectDB } from './db.js';
import { warmup } from './lib/embeddings.js';
import searchRouter from './routes/search.js';
import productsRouter from './routes/products.js';

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

let modelReady = false;

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, modelReady })
);

app.use('/api/search', (req, res, next) => {
  if (!modelReady) {
    return res
      .status(503)
      .json({ error: 'Model is still loading. Please retry in a few seconds.' });
  }
  next();
});

app.use('/api/products', productsRouter);
app.use('/api/search', searchRouter);

app.use(express.static(distPath));

app.get('/', (_req, res) =>
  res.type('text/plain').send('Image Search Widget backend. Use /api/* endpoints.')
);

async function start() {
  app.listen(PORT, () => console.log(`API listening on port ${PORT}`));

  try {
    await connectDB(MONGODB_URI);
    console.log('Mongo connected. Loading CLIP model (first run downloads ~150MB)...');
    await warmup();
    modelReady = true;
    console.log('CLIP model ready');
  } catch (err) {
    console.error('Startup task failed:', err);
  }
}

start();

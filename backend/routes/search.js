import express from 'express';
import multer from 'multer';
import Product from '../models/Product.js';
import { embedImageFromBuffer } from '../lib/embeddings.js';
import { cosineSimilarity } from '../lib/similarity.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image uploads are supported'));
  },
});

const TOP_N = Number(process.env.TOP_N || 5);
const THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD || 0.7);

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    const queryEmbedding = await embedImageFromBuffer(req.file.buffer);
    const products = await Product.find({}, 'title link imageUrl embedding').lean();

    const scored = products
      .map((p) => ({
        _id: p._id,
        title: p.title,
        link: p.link,
        imageUrl: p.imageUrl,
        score: cosineSimilarity(queryEmbedding, p.embedding),
      }))
      .filter((p) => p.score >= THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);

    res.json({ results: scored });
  } catch (err) {
    console.error('Search failed:', err);
    res.status(500).json({ error: 'Search failed', detail: err.message });
  }
});

export default router;

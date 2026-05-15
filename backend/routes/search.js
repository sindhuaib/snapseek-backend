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
const THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD || 0.15);
const MIN_TOP_SCORE = Number(process.env.MIN_TOP_SCORE || 0.20);

async function searchWithEmbedding(queryEmbedding) {
  const products = await Product.find({}, 'title link imageUrl embedding price').lean();

  const ranked = products
    .map((p) => ({
      _id: p._id,
      title: p.title,
      link: p.link,
      imageUrl: p.imageUrl,
      price: p.price,
      score: cosineSimilarity(queryEmbedding, p.embedding),
    }))
    .sort((a, b) => b.score - a.score);

  const topScores = ranked.slice(0, TOP_N).map((p) => p.score.toFixed(3));
  console.log(`Search top ${TOP_N} scores:`, topScores.join(', '));

  const topScore = ranked[0]?.score ?? 0;
  if (topScore < MIN_TOP_SCORE) {
    console.log(`Top score ${topScore.toFixed(3)} < ${MIN_TOP_SCORE}, returning no results`);
    return [];
  }

  return ranked.filter((p) => p.score >= THRESHOLD).slice(0, TOP_N);
}

router.post('/by-vector', async (req, res) => {
  const { embedding } = req.body || {};
  if (!Array.isArray(embedding) || embedding.length === 0) {
    return res.status(400).json({ error: 'embedding must be a non-empty array of numbers' });
  }
  if (typeof embedding[0] !== 'number') {
    return res.status(400).json({ error: 'embedding values must be numbers' });
  }

  try {
    const results = await searchWithEmbedding(embedding);
    res.json({ results });
  } catch (err) {
    console.error('Vector search failed:', err);
    res.status(500).json({ error: 'Search failed', detail: err.message });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    const queryEmbedding = await embedImageFromBuffer(req.file.buffer);
    const results = await searchWithEmbedding(queryEmbedding);
    res.json({ results });
  } catch (err) {
    console.error('Search failed:', err);
    res.status(500).json({ error: 'Search failed', detail: err.message });
  }
});

export default router;

import express from 'express';
import Product from '../models/Product.js';
import { syncProducts } from '../syncProducts.js';

const router = express.Router();

let syncState = {
  running: false,
  lastFinishedAt: null,
  lastResult: null,
};

router.get('/status', async (_req, res) => {
  try {
    const productCount = await Product.estimatedDocumentCount();
    res.json({
      healthy: true,
      productCount,
      syncRunning: syncState.running,
      lastSyncFinished: syncState.lastFinishedAt,
      lastSyncResult: syncState.lastResult,
    });
  } catch (err) {
    res.status(500).json({ healthy: false, error: err.message });
  }
});

router.put('/embeddings/:id', async (req, res) => {
  const { embedding } = req.body || {};
  if (!Array.isArray(embedding) || embedding.length === 0 || typeof embedding[0] !== 'number') {
    return res.status(400).json({ error: 'embedding must be a non-empty array of numbers' });
  }
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { embedding },
      { new: true, projection: '_id title' }
    );
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true, id: updated._id, title: updated.title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sync', async (_req, res) => {
  if (syncState.running) {
    return res.status(409).json({ error: 'Sync already in progress' });
  }
  syncState = { running: true, lastFinishedAt: null, lastResult: null };
  res.json({ status: 'started' });

  syncProducts()
    .then((result) => {
      syncState = {
        running: false,
        lastFinishedAt: new Date().toISOString(),
        lastResult: result,
      };
    })
    .catch((err) => {
      syncState = {
        running: false,
        lastFinishedAt: new Date().toISOString(),
        lastResult: { error: err.message },
      };
    });
});

export default router;

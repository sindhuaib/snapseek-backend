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

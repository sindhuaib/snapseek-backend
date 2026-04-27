import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const products = await Product.find({}, 'title link imageUrl').lean();
  res.json({ products });
});

export default router;

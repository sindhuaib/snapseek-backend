import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import Product from './models/Product.js';
import { embedImageFromUrl, warmup } from './lib/embeddings.js';

const SAMPLE_PRODUCTS = [
  {
    title: 'Red Running Shoes',
    link: 'https://example.com/p/red-running-shoes',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
  },
  {
    title: 'Leather Wallet',
    link: 'https://example.com/p/leather-wallet',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
  },
  {
    title: 'White T-Shirt',
    link: 'https://example.com/p/white-tshirt',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
  },
  {
    title: 'Coffee Mug',
    link: 'https://example.com/p/coffee-mug',
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
  },
  {
    title: 'Wooden Chair',
    link: 'https://example.com/p/wooden-chair',
    imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400',
  },
  {
    title: 'Sunglasses',
    link: 'https://example.com/p/sunglasses',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
  },
  {
    title: 'Backpack',
    link: 'https://example.com/p/backpack',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
  },
  {
    title: 'Wristwatch',
    link: 'https://example.com/p/wristwatch',
    imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400',
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/image-search';
  await connectDB(uri);

  console.log('Loading CLIP model...');
  await warmup();

  console.log('Clearing existing products...');
  await Product.deleteMany({});

  let ok = 0;
  for (const p of SAMPLE_PRODUCTS) {
    try {
      console.log(`Embedding: ${p.title}`);
      const embedding = await embedImageFromUrl(p.imageUrl);
      await Product.create({ ...p, embedding });
      ok++;
    } catch (err) {
      console.error(`  Failed (${p.title}): ${err.message}`);
    }
  }

  console.log(`Seeded ${ok}/${SAMPLE_PRODUCTS.length} products`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

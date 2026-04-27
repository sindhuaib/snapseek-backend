import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import Product from './models/Product.js';
import { embedImageFromUrl, warmup } from './lib/embeddings.js';
import { getAllProducts } from './lib/shopify.js';

async function syncProducts() {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

  if (!storeDomain || !accessToken) {
    throw new Error(
      'SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN must be set in .env'
    );
  }

  await connectDB(
    process.env.MONGODB_URI ||
      'mongodb://localhost:27017/image-search'
  );

  console.log('Loading CLIP model...');
  await warmup();

  console.log('Fetching products from Shopify...');
  const shopifyProducts = await getAllProducts(storeDomain, accessToken);
  console.log(`Found ${shopifyProducts.length} products`);

  console.log('Clearing existing products...');
  await Product.deleteMany({});

  let success = 0;
  for (const p of shopifyProducts) {
    try {
      console.log(`Embedding: ${p.title}`);
      const embedding = await embedImageFromUrl(p.imageUrl);
      await Product.create({
        shopifyProductId: p.shopifyId,
        title: p.title,
        handle: p.handle,
        link: `https://${storeDomain}/products/${p.handle}`,
        imageUrl: p.imageUrl,
        embedding,
      });
      success++;
    } catch (err) {
      console.error(`  Failed (${p.title}): ${err.message}`);
    }
  }

  console.log(`\nSeeded ${success}/${shopifyProducts.length} products`);
  await mongoose.disconnect();
}

syncProducts().catch((err) => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});

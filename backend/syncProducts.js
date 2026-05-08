import 'dotenv/config';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import Product from './models/Product.js';
import { embedImageFromUrl, warmup } from './lib/embeddings.js';
import { getAllProducts } from './lib/shopify.js';

export async function syncProducts({ ensureConnection = false } = {}) {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

  if (!storeDomain || !accessToken) {
    throw new Error(
      'SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN must be set in .env'
    );
  }

  if (ensureConnection && mongoose.connection.readyState === 0) {
    await connectDB(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/image-search'
    );
  }

  await warmup();

  console.log('Fetching products from Shopify...');
  const shopifyProducts = await getAllProducts(storeDomain, accessToken);
  console.log(`Found ${shopifyProducts.length} products`);

  console.log('Clearing existing products...');
  await Product.deleteMany({});

  let success = 0;
  for (const p of shopifyProducts) {
     console.log('SYNC PRODUCT:', p);
    try {
      console.log(`Embedding: ${p.title}`);
      const embedding = await embedImageFromUrl(p.imageUrl);
      await Product.create({
        shopifyProductId: p.shopifyId,
        title: p.title,
        handle: p.handle,
        link: `https://${storeDomain}/products/${p.handle}`,
        imageUrl: p.imageUrl,
        price: p.price, 
        embedding,
      });
      success++;
    } catch (err) {
      console.error(`  Failed (${p.title}): ${err.message}`);
    }
  }

  console.log(`\nSeeded ${success}/${shopifyProducts.length} products`);
  return { success, total: shopifyProducts.length };
}

const __filename = fileURLToPath(import.meta.url);
const isCLI = process.argv[1] && process.argv[1].endsWith('syncProducts.js');

if (isCLI) {
  syncProducts({ ensureConnection: true })
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error('Sync failed:', err.message);
      process.exit(1);
    });
}

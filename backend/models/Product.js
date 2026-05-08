import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    shopifyProductId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true },
    handle: { type: String },
    link: { type: String, required: true },
    imageUrl: { type: String, required: true },
     price: { type: String, default: '' },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);

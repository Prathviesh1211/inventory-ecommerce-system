import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '', trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: ['active', 'disabled'], default: 'active', index: true },
  },
  { timestamps: true },
);

productSchema.virtual('inventoryStatus').get(function inventoryStatus() {
  if (this.stock === 0) return 'Out of Stock';
  if (this.stock <= 5) return 'Low Stock';
  return 'In Stock';
});

productSchema.set('toJSON', { virtuals: true });

export const Product = mongoose.model('Product', productSchema);

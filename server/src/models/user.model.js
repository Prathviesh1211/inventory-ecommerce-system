import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    cart: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    delete returnedObject.passwordHash;
    return returnedObject;
  },
});

export const User = mongoose.model('User', userSchema);

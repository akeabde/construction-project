const mongoose = require("mongoose");

// Product catalogue shown in frontend and managed by admin.
const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    stock: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "piece", trim: true },
    featured: { type: Boolean, default: false },
    specs: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

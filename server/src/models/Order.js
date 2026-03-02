const mongoose = require("mongoose");
const { ORDER_STATUSES } = require("../constants/orderStatus");

// One line in an order snapshot (copied product info at purchase time).
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Customer order with delivery details and status.
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], validate: [(items) => items.length > 0, "items required"] },
    totalAmount: { type: Number, required: true, min: 0 },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: ORDER_STATUSES[0],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

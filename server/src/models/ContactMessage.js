const mongoose = require("mongoose");

// Message sent by a logged-in user to the admin.
const contactMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["new", "replied"], default: "new" },
    adminReply: { type: String, trim: true },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);

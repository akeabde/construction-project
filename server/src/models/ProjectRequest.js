const mongoose = require("mongoose");
const { PROJECT_REQUEST_STATUSES } = require("../constants/projectRequestStatus");

// Custom project help request sent from the public form.
const projectRequestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    serviceType: { type: String, required: true, trim: true },
    budget: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: PROJECT_REQUEST_STATUSES,
      default: PROJECT_REQUEST_STATUSES[0],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectRequest", projectRequestSchema);

const mongoose = require("mongoose");
const { PROJECT_REQUEST_STATUSES } = require("../constants/projectRequestStatus");

// ============================================================
// MODELE : PROJECT REQUEST (Demande de projet)
// Role : Gère les demandes de devis ou d'aide pour un projet.
// ============================================================
const projectRequestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    // Type de service demandé (ex: 'Construction d'une villa').
    serviceType: { type: String, required: true, trim: true },
    budget: { type: String, trim: true },
    notes: { type: String, trim: true },
    // État de la demande (ex: 'pending', 'contacted', 'completed').
    status: {
      type: String,
      enum: PROJECT_REQUEST_STATUSES,
      default: PROJECT_REQUEST_STATUSES[0],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectRequest", projectRequestSchema);

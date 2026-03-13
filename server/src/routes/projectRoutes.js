const express = require("express");

const ProjectRequest = require("../models/ProjectRequest");
const { checkAuth, checkAdmin } = require("../middleware/auth");
const { PROJECT_REQUEST_STATUSES } = require("../constants/projectRequestStatus");

const router = express.Router();

// Nettoyer une valeur texte.
const cleanText = (value) => String(value || "").trim();

// Lire les champs d une demande projet.
const readProjectPayload = (body) => {
  return {
    fullName: cleanText(body.fullName),
    phone: cleanText(body.phone),
    city: cleanText(body.city),
    serviceType: cleanText(body.serviceType),
    budget: cleanText(body.budget),
    notes: cleanText(body.notes),
  };
};

// Verifier les champs obligatoires.
const isProjectPayloadValid = (payload) => {
  if (!payload.fullName) return false;
  if (!payload.phone) return false;
  if (!payload.city) return false;
  if (!payload.serviceType) return false;
  return true;
};

// POST /api/projects
// Creer une nouvelle demande de projet.
router.post("/", checkAuth, async (req, res) => {
  try {
    // 1) Lire et nettoyer les champs.
    const payload = readProjectPayload(req.body);

    // 2) Verifier les champs obligatoires.
    if (!isProjectPayloadValid(payload)) {
      return res.status(400).json({ message: "fullName, phone, city and serviceType are required" });
    }

    // 3) Sauvegarder la demande.
    const request = await ProjectRequest.create(payload);
    return res.status(201).json(request);
  } catch (error) {
    return res.status(500).json({ message: "Could not create project request" });
  }
});

// GET /api/projects
// Retourner toutes les demandes (admin).
router.get("/", checkAuth, checkAdmin, async (_req, res) => {
  try {
    const requests = await ProjectRequest.find().sort({ createdAt: -1 });
    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: "Could not load project requests" });
  }
});

// PATCH /api/projects/:id/status
// Changer le statut d une demande (admin).
router.patch("/:id/status", checkAuth, checkAdmin, async (req, res) => {
  try {
    // 1) Lire le nouveau statut.
    const status = req.body.status;

    // 2) Verifier que le statut est autorise.
    if (!PROJECT_REQUEST_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // 3) Mettre a jour la demande.
    const request = await ProjectRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    return res.json(request);
  } catch (error) {
    return res.status(500).json({ message: "Could not update request status" });
  }
});

module.exports = router;

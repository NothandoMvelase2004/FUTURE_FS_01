// ==========================================
// THANDOLEADS - LEAD ROUTES
// ==========================================

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getAllLeads,
    getLeadById,
    createLead,
    updateLead,
    deleteLead,
    getLeadStats
} = require("../controllers/leadController");

// Protect all lead routes
router.use(authMiddleware);

// Dashboard statistics
router.get("/stats", getLeadStats);

// Get all leads
router.get("/", getAllLeads);

// Get single lead
router.get("/:id", getLeadById);

// Add new lead
router.post("/", createLead);

// Update lead
router.put("/:id", updateLead);

// Delete lead
router.delete("/:id", deleteLead);

module.exports = router;
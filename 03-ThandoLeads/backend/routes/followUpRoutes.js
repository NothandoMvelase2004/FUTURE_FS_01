// ==========================================
// THANDOLEADS - FOLLOW-UP ROUTES
// ==========================================

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getAllFollowUps,
    createFollowUp,
    updateFollowUp,
    completeFollowUp,
    deleteFollowUp,
    getUpcomingFollowUps,
    getOverdueFollowUps
} = require("../controllers/followUpController");


// Protect all follow-up routes
router.use(authMiddleware);


// GET ALL FOLLOW-UPS
router.get("/", getAllFollowUps);


// GET UPCOMING FOLLOW-UPS
router.get("/upcoming", getUpcomingFollowUps);


// GET OVERDUE FOLLOW-UPS
router.get("/overdue", getOverdueFollowUps);


// CREATE FOLLOW-UP
router.post("/", createFollowUp);


// UPDATE FOLLOW-UP
router.put("/:id", updateFollowUp);


// MARK FOLLOW-UP AS COMPLETED
router.patch("/:id/complete", completeFollowUp);


// DELETE FOLLOW-UP
router.delete("/:id", deleteFollowUp);


module.exports = router;
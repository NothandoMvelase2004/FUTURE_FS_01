const db = require("../config/db");

exports.getAllFollowUps = async (req, res) => {
    try {
        const [followUps] = await db.execute(`
            SELECT
                f.id,
                f.lead_id,
                l.name AS lead_name,
                l.email AS lead_email,
                l.phone AS lead_phone,
                f.follow_up_date,
                f.description,
                f.status,
                f.created_at
            FROM follow_ups f
            INNER JOIN leads l ON f.lead_id = l.id
            ORDER BY f.follow_up_date ASC
        `);

        res.status(200).json({
            success: true,
            count: followUps.length,
            followUps
        });

    } catch (error) {
        console.error("Get follow-ups error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve follow-ups"
        });
    }
};


exports.createFollowUp = async (req, res) => {

    try {
        console.log("Content-Type:", req.headers["content-type"]);
console.log("Request body:", req.body);

        const { lead_id, follow_up_date, description } = req.body || {};

        if (!lead_id || !follow_up_date) {
            return res.status(400).json({
                success: false,
                message: "Lead and follow-up date are required"
            });
        }

        if (
            !Number.isInteger(Number(lead_id)) ||
            Number(lead_id) <= 0 ||
            typeof follow_up_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(follow_up_date)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid lead or follow-up date format"
            });
        }

        const scheduledDate = new Date(
            follow_up_date.replace(" ", "T")
        );

        if (
            Number.isNaN(scheduledDate.getTime()) ||
            scheduledDate <= new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "Follow-up date must be in the future"
            });
        }

        const [leads] = await db.execute(
            "SELECT id FROM leads WHERE id = ?",
            [lead_id]
        );

        if (leads.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Selected lead does not exist"
            });
        }

        const [result] = await db.execute(
            `INSERT INTO follow_ups
             (lead_id, follow_up_date, description, status)
             VALUES (?, ?, ?, 'pending')`,
            [
                lead_id,
                follow_up_date.replace("T", " "),
                description || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Follow-up scheduled successfully",
            followUpId: result.insertId
        });

    } catch (error) {
        console.error("Create follow-up error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create follow-up"
        });
    }
};

exports.updateFollowUp = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            follow_up_date,
            description,
            status
        } = req.body;

        const [existing] = await db.execute(
            "SELECT * FROM follow_ups WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Follow-up not found"
            });
        }

        const current = existing[0];

        const updatedDate =
            follow_up_date ?? current.follow_up_date;

        const updatedDescription =
            description !== undefined
                ? description
                : current.description;

        const updatedStatus =
            status ?? current.status;

        if (!["pending", "completed"].includes(updatedStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid follow-up status"
            });
        }

        let formattedDate = updatedDate;

        if (typeof updatedDate === "string") {
            if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(updatedDate)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid follow-up date format"
                });
            }

            formattedDate = updatedDate.replace("T", " ");
        }

        await db.execute(
            `UPDATE follow_ups
             SET follow_up_date = ?,
                 description = ?,
                 status = ?
             WHERE id = ?`,
            [
                formattedDate,
                updatedDescription,
                updatedStatus,
                id
            ]
        );

        res.status(200).json({
            success: true,
            message: "Follow-up updated successfully"
        });

    } catch (error) {
        console.error("Update follow-up error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update follow-up"
        });
    }
};


exports.completeFollowUp = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            `UPDATE follow_ups
             SET status = 'completed'
             WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Follow-up not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Follow-up marked as completed"
        });

    } catch (error) {
        console.error("Complete follow-up error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to complete follow-up"
        });
    }
};


exports.deleteFollowUp = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            "DELETE FROM follow_ups WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Follow-up not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Follow-up deleted successfully"
        });

    } catch (error) {
        console.error("Delete follow-up error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete follow-up"
        });
    }
};


exports.getUpcomingFollowUps = async (req, res) => {
    try {
        const [followUps] = await db.execute(`
            SELECT
                f.*,
                l.name AS lead_name,
                l.email AS lead_email
            FROM follow_ups f
            INNER JOIN leads l ON f.lead_id = l.id
            WHERE f.status = 'pending'
              AND f.follow_up_date >= NOW()
            ORDER BY f.follow_up_date ASC
            LIMIT 10
        `);

        res.status(200).json({
            success: true,
            count: followUps.length,
            followUps
        });

    } catch (error) {
        console.error("Upcoming follow-ups error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve upcoming follow-ups"
        });
    }
};


exports.getOverdueFollowUps = async (req, res) => {
    try {
        const [followUps] = await db.execute(`
            SELECT
                f.*,
                l.name AS lead_name,
                l.email AS lead_email
            FROM follow_ups f
            INNER JOIN leads l ON f.lead_id = l.id
            WHERE f.status = 'pending'
              AND f.follow_up_date < NOW()
            ORDER BY f.follow_up_date ASC
        `);

        res.status(200).json({
            success: true,
            count: followUps.length,
            followUps
        });

    } catch (error) {
        console.error("Overdue follow-ups error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve overdue follow-ups"
        });
    }
};
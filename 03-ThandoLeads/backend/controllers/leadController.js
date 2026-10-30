// ==========================================
// THANDOLEADS - LEAD CONTROLLER
// ==========================================

const db = require("../config/db");

const VALID_STATUSES = ["new", "contacted", "converted"];

// ==========================================
// GET ALL LEADS
// ==========================================

exports.getAllLeads = async (req, res) => {
    try {
        const { search, status, source } = req.query;

        let sql = `
            SELECT *
            FROM leads
            WHERE 1 = 1
        `;

        const params = [];

        if (search) {
            sql += " AND (name LIKE ? OR email LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        if (status) {
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid lead status"
                });
            }

            sql += " AND status = ?";
            params.push(status);
        }

        if (source) {
            sql += " AND source = ?";
            params.push(source);
        }

        sql += " ORDER BY created_at DESC, id DESC";

        const [leads] = await db.query(sql, params);

        res.status(200).json({
            success: true,
            count: leads.length,
            leads
        });

    } catch (error) {
        console.error("Get leads error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve leads"
        });
    }
};

// ==========================================
// GET SINGLE LEAD
// ==========================================

exports.getLeadById = async (req, res) => {
    try {
        const [leads] = await db.execute(
            "SELECT * FROM leads WHERE id = ?",
            [req.params.id]
        );

        if (leads.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        res.status(200).json({
            success: true,
            lead: leads[0]
        });

    } catch (error) {
        console.error("Get lead error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve lead"
        });
    }
};

// ==========================================
// ADD NEW LEAD
// ==========================================

exports.createLead = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            source,
            status = "new",
            notes
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lead status"
            });
        }

        const [result] = await db.execute(
            `INSERT INTO leads
             (name, email, phone, source, status, notes, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                email,
                phone || null,
                source || null,
                status,
                notes || null,
                req.user.id
            ]
        );

        res.status(201).json({
            success: true,
            message: "Lead added successfully",
            leadId: result.insertId
        });

    } catch (error) {
        console.error("Create lead error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to add lead"
        });
    }
};

// ==========================================
// UPDATE LEAD
// ==========================================

exports.updateLead = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute(
            "SELECT * FROM leads WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        const current = existing[0];

        const name = req.body.name ?? current.name;
        const email = req.body.email ?? current.email;
        const phone = req.body.phone ?? current.phone;
        const source = req.body.source ?? current.source;
        const status = req.body.status ?? current.status;
        const notes = req.body.notes ?? current.notes;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid name and email are required"
            });
        }

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lead status"
            });
        }

        await db.execute(
            `UPDATE leads
             SET name = ?,
                 email = ?,
                 phone = ?,
                 source = ?,
                 status = ?,
                 notes = ?
             WHERE id = ?`,
            [
                name,
                email,
                phone,
                source,
                status,
                notes,
                id
            ]
        );

        res.status(200).json({
            success: true,
            message: "Lead updated successfully"
        });

    } catch (error) {
        console.error("Update lead error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update lead"
        });
    }
};

// ==========================================
// DELETE LEAD
// ==========================================

exports.deleteLead = async (req, res) => {
    try {
        const [result] = await db.execute(
            "DELETE FROM leads WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Lead deleted successfully"
        });

    } catch (error) {
        console.error("Delete lead error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete lead"
        });
    }
};

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

exports.getLeadStats = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS totalLeads,

                SUM(CASE WHEN status = 'new'
                    THEN 1 ELSE 0 END) AS newLeads,

                SUM(CASE WHEN status = 'contacted'
                    THEN 1 ELSE 0 END) AS contactedLeads,

                SUM(CASE WHEN status = 'converted'
                    THEN 1 ELSE 0 END) AS convertedLeads

            FROM leads
        `);

        const stats = rows[0];

        const total = Number(stats.totalLeads || 0);
        const converted = Number(stats.convertedLeads || 0);

        res.status(200).json({
            success: true,
            stats: {
                totalLeads: total,
                newLeads: Number(stats.newLeads || 0),
                contactedLeads: Number(stats.contactedLeads || 0),
                convertedLeads: converted,
                conversionRate: total > 0
                    ? Number(((converted / total) * 100).toFixed(2))
                    : 0
            }
        });

    } catch (error) {
        console.error("Statistics error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve statistics"
        });
    }
};
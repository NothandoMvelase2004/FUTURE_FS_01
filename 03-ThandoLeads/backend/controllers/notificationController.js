const db = require("../config/db");

// ==========================================
// GET AUTHENTICATED ADMIN ID
// ==========================================

const getAdminId = (req) => {
    const id = Number(req.user?.id ?? req.user?.user_id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        const error = new Error("Invalid administrator identity");
        error.status = 401;
        throw error;
    }

    return id;
};

// ==========================================
// AUTOMATICALLY GENERATE REMINDER ALERTS
// ==========================================

const generateNotifications = async (userId) => {
    // Generate upcoming alerts for pending follow-ups
    // due within the next 24 hours.
    await db.execute(
        `
        INSERT INTO notifications
            (user_id, follow_up_id, title, message, type)
        SELECT
            ?,
            f.id,
            'Upcoming Follow-Up',
            CONCAT(
                'Follow up with ',
                l.name,
                ' on ',
                DATE_FORMAT(f.follow_up_date, '%d %b %Y %H:%i')
            ),
            'upcoming'
        FROM follow_ups f
        INNER JOIN leads l ON l.id = f.lead_id
        WHERE f.status = 'pending'
          AND f.follow_up_date >= NOW()
          AND f.follow_up_date <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
          AND NOT EXISTS (
              SELECT 1
              FROM notifications n
              WHERE n.user_id = ?
                AND n.follow_up_id = f.id
                AND n.type = 'upcoming'
          )
        `,
        [userId, userId]
    );

    // Generate overdue alerts for pending follow-ups.
    await db.execute(
        `
        INSERT INTO notifications
            (user_id, follow_up_id, title, message, type)
        SELECT
            ?,
            f.id,
            'Overdue Follow-Up',
            CONCAT(
                'Follow-up overdue for ',
                l.name,
                '. Scheduled for ',
                DATE_FORMAT(f.follow_up_date, '%d %b %Y %H:%i')
            ),
            'overdue'
        FROM follow_ups f
        INNER JOIN leads l ON l.id = f.lead_id
        WHERE f.status = 'pending'
          AND f.follow_up_date < NOW()
          AND NOT EXISTS (
              SELECT 1
              FROM notifications n
              WHERE n.user_id = ?
                AND n.follow_up_id = f.id
                AND n.type = 'overdue'
          )
        `,
        [userId, userId]
    );
};

// ==========================================
// GET ALL NOTIFICATIONS
// ==========================================

exports.getNotifications = async (req, res) => {
    try {
        const userId = getAdminId(req);

        await generateNotifications(userId);

        const [notifications] = await db.execute(
            `
            SELECT
                n.id,
                n.user_id,
                n.follow_up_id,
                n.title,
                n.message,
                n.type,
                n.is_read,
                n.created_at,
                n.read_at,
                l.name AS lead_name,
                f.follow_up_date,
                f.status AS follow_up_status
            FROM notifications n
            LEFT JOIN follow_ups f
                ON n.follow_up_id = f.id
            LEFT JOIN leads l
                ON f.lead_id = l.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC, n.id DESC
            LIMIT 100
            `,
            [userId]
        );

        const [counts] = await db.execute(
            `
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END)
                    AS unread
            FROM notifications
            WHERE user_id = ?
            `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            notifications,
            total: Number(counts[0].total),
            unreadCount: Number(counts[0].unread || 0)
        });

    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(error.status || 500).json({
            success: false,
            message: error.status
                ? error.message
                : "Failed to retrieve notifications"
        });
    }
};

// ==========================================
// GET UNREAD NOTIFICATION COUNT
// ==========================================

exports.getUnreadCount = async (req, res) => {
    try {
        const userId = getAdminId(req);

        await generateNotifications(userId);

        const [rows] = await db.execute(
            `
            SELECT COUNT(*) AS unreadCount
            FROM notifications
            WHERE user_id = ?
              AND is_read = 0
            `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            unreadCount: Number(rows[0].unreadCount)
        });

    } catch (error) {
        console.error("Unread count error:", error);

        return res.status(error.status || 500).json({
            success: false,
            message: error.status
                ? error.message
                : "Failed to retrieve unread count"
        });
    }
};

// ==========================================
// MARK ONE NOTIFICATION AS READ
// ==========================================

exports.markAsRead = async (req, res) => {
    try {
        const userId = getAdminId(req);
        const { id } = req.params;

        const [result] = await db.execute(
            `
            UPDATE notifications
            SET is_read = 1,
                read_at = COALESCE(read_at, NOW())
            WHERE id = ?
              AND user_id = ?
            `,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });

    } catch (error) {
        console.error("Mark notification error:", error);

        return res.status(error.status || 500).json({
            success: false,
            message: error.status
                ? error.message
                : "Failed to mark notification as read"
        });
    }
};

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = getAdminId(req);

        await db.execute(
            `
            UPDATE notifications
            SET is_read = 1,
                read_at = COALESCE(read_at, NOW())
            WHERE user_id = ?
              AND is_read = 0
            `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });

    } catch (error) {
        console.error("Mark all notifications error:", error);

        return res.status(error.status || 500).json({
            success: false,
            message: error.status
                ? error.message
                : "Failed to mark notifications as read"
        });
    }
};

// ==========================================
// DELETE NOTIFICATION
// ==========================================

exports.deleteNotification = async (req, res) => {
    try {
        const userId = getAdminId(req);
        const { id } = req.params;

        const [result] = await db.execute(
            `
            DELETE FROM notifications
            WHERE id = ?
              AND user_id = ?
            `,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });

    } catch (error) {
        console.error("Delete notification error:", error);

        return res.status(error.status || 500).json({
            success: false,
            message: error.status
                ? error.message
                : "Failed to delete notification"
        });
    }
};
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    );
};

exports.register = async (req, res) => {
    try {
        const { username, email, password, registrationKey } = req.body;

        if (!username || !email || !password || !registrationKey) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (
            !process.env.REGISTRATION_KEY ||
            registrationKey !== process.env.REGISTRATION_KEY
        ) {
            return res.status(403).json({
                success: false,
                message: "Invalid administrator registration code"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        const [existingUsers] = await db.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username or email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.execute(
            `INSERT INTO users (username, email, password, role)
             VALUES (?, ?, ?, 'admin')`,
            [username, email, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: "Administrator registered successfully",
            userId: result.insertId
        });

    } catch (error) {
        console.error("Registration error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Username or email already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [users] = await db.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};


// ==========================================
// GET ADMINISTRATOR PROFILE
// ==========================================

exports.getProfile = async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT id, username, email, role, created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Administrator not found"
            });
        }

        res.status(200).json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error("Get profile error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve profile"
        });
    }
};


// ==========================================
// UPDATE ADMINISTRATOR PROFILE
// ==========================================

exports.updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;

        if (
            typeof username !== "string" ||
            typeof email !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Username and email are required"
            });
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (
            !cleanUsername ||
            cleanUsername.length > 100 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
            cleanEmail.length > 150
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid username and email address"
            });
        }

        const [existingUsers] = await db.execute(
            `SELECT id FROM users
             WHERE (username = ? OR email = ?)
             AND id != ?`,
            [cleanUsername, cleanEmail, req.user.id]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username or email already exists"
            });
        }

        const [result] = await db.execute(
            `UPDATE users
             SET username = ?, email = ?
             WHERE id = ?`,
            [cleanUsername, cleanEmail, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Administrator not found"
            });
        }

        const [users] = await db.execute(
            `SELECT id, username, email, role, created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: users[0]
        });

    } catch (error) {
        console.error("Update profile error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Username or email already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });
    }
};


// ==========================================
// CHANGE ADMINISTRATOR PASSWORD
// ==========================================

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Current and new passwords are required"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least 8 characters"
            });
        }

        if (newPassword.length > 72) {
            return res.status(400).json({
                success: false,
                message: "New password must not exceed 72 characters"
            });
        }

        const [users] = await db.execute(
            "SELECT id, password FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Administrator not found"
            });
        }

        const user = users[0];

        const isValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password"
            });
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            12
        );

        await db.execute(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, req.user.id]
        );

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change password error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to change password"
        });
    }
};
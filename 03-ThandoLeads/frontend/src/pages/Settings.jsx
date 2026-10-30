import { useEffect, useState } from "react";
import {
    User,
    Mail,
    Shield,
    Lock,
    Save,
    Eye,
    EyeOff,
    CalendarDays
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

function Settings() {
    const [profile, setProfile] = useState({
        username: "",
        email: "",
        role: "",
        created_at: ""
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");

    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/auth/profile");

                setProfile(response.data.user);
            } catch (error) {
                setProfileError(
                    error.response?.data?.message ||
                    "Unable to load administrator profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleProfileChange = (event) => {
        const { name, value } = event.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;

        setPasswordForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();

        setSavingProfile(true);
        setProfileMessage("");
        setProfileError("");

        try {
            const response = await api.put("/auth/profile", {
                username: profile.username,
                email: profile.email
            });

            setProfile(response.data.user);

            // Keep the logged-in user information updated.
            sessionStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            setProfileMessage("Profile updated successfully!");

        } catch (error) {
            setProfileError(
                error.response?.data?.message ||
                "Failed to update profile."
            );
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSavePassword = async (event) => {
        event.preventDefault();

        setPasswordMessage("");
        setPasswordError("");

        if (
            passwordForm.newPassword !==
            passwordForm.confirmPassword
        ) {
            setPasswordError("New passwords do not match.");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setPasswordError(
                "Password must contain at least 8 characters."
            );
            return;
        }

        setSavingPassword(true);

        try {
            const response = await api.put(
                "/auth/change-password",
                {
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                }
            );

            setPasswordMessage(response.data.message);

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

        } catch (error) {
            setPasswordError(
                error.response?.data?.message ||
                "Failed to change password."
            );
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <p>Loading settings...</p>
                </main>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">

                <header className="dashboard-header">
                    <div>
                        <p className="page-label">
                            ACCOUNT MANAGEMENT
                        </p>

                        <h1>Settings</h1>

                        <p className="page-description">
                            Manage your administrator profile and security.
                        </p>
                    </div>
                </header>

                <div className="settings-container">

                    {/* PROFILE INFORMATION */}

                    <section className="settings-card">

                        <div className="settings-card-header">
                            <div className="settings-icon">
                                <User size={22} />
                            </div>

                            <div>
                                <h2>Administrator Profile</h2>
                                <p>Update your personal information.</p>
                            </div>
                        </div>

                        {profileMessage && (
                            <div className="success-message">
                                {profileMessage}
                            </div>
                        )}

                        {profileError && (
                            <div className="error-message">
                                {profileError}
                            </div>
                        )}

                        <form onSubmit={handleSaveProfile}>

                            <div className="settings-form-group">
                                <label htmlFor="username">
                                    <User size={16} />
                                    Username
                                </label>

                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={profile.username || ""}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>

                            <div className="settings-form-group">
                                <label htmlFor="email">
                                    <Mail size={16} />
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={profile.email || ""}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>

                            <div className="settings-form-group">
                                <label>
                                    <Shield size={16} />
                                    Account Role
                                </label>

                                <input
                                    type="text"
                                    value={profile.role || "admin"}
                                    disabled
                                />
                            </div>

                            <button
                                type="submit"
                                className="add-lead-button"
                                disabled={savingProfile}
                            >
                                <Save size={17} />

                                {savingProfile
                                    ? "Saving..."
                                    : "Save Profile Changes"}
                            </button>
                        </form>
                    </section>

                    {/* PASSWORD SECURITY */}

                    <section className="settings-card">

                        <div className="settings-card-header">
                            <div className="settings-icon">
                                <Lock size={22} />
                            </div>

                            <div>
                                <h2>Change Password</h2>
                                <p>
                                    Update your password to keep your
                                    account secure.
                                </p>
                            </div>
                        </div>

                        {passwordMessage && (
                            <div className="success-message">
                                {passwordMessage}
                            </div>
                        )}

                        {passwordError && (
                            <div className="error-message">
                                {passwordError}
                            </div>
                        )}

                        <form onSubmit={handleSavePassword}>

                            <div className="settings-form-group">
                                <label htmlFor="currentPassword">
                                    Current Password
                                </label>

                                <input
                                    id="currentPassword"
                                    type={showPassword ? "text" : "password"}
                                    name="currentPassword"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>

                            <div className="settings-form-group">
                                <label htmlFor="newPassword">
                                    New Password
                                </label>

                                <input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    name="newPassword"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    minLength={8}
                                    required
                                />
                            </div>

                            <div className="settings-form-group">
                                <label htmlFor="confirmPassword">
                                    Confirm New Password
                                </label>

                                <input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                            >
                                {showPassword ? (
                                    <EyeOff size={17} />
                                ) : (
                                    <Eye size={17} />
                                )}

                                {showPassword
                                    ? "Hide Passwords"
                                    : "Show Passwords"}
                            </button>

                            <button
                                type="submit"
                                className="add-lead-button"
                                disabled={savingPassword}
                            >
                                <Lock size={17} />

                                {savingPassword
                                    ? "Updating..."
                                    : "Update Password"}
                            </button>
                        </form>
                    </section>

                    {/* ACCOUNT INFORMATION */}

                    <section className="settings-card">

                        <div className="settings-card-header">
                            <div className="settings-icon">
                                <CalendarDays size={22} />
                            </div>

                            <div>
                                <h2>Account Information</h2>
                                <p>
                                    Details about your administrator account.
                                </p>
                            </div>
                        </div>

                        <div className="account-info">
                            <div>
                                <span>Account Type</span>
                                <strong>Administrator</strong>
                            </div>

                            <div>
                                <span>Account Created</span>

                                <strong>
                                    {profile.created_at
                                        ? new Date(
                                            profile.created_at
                                        ).toLocaleDateString()
                                        : "Not available"}
                                </strong>
                            </div>

                            <div>
                                <span>Account Status</span>
                                <strong className="account-active">
                                    Active
                                </strong>
                            </div>
                        </div>

                    </section>
                </div>
            </main>
        </div>
    );
}

export default Settings;
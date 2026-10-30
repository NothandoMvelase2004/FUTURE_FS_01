import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    User,
    Mail,
    LockKeyhole,
    KeyRound,
    ArrowRight
} from "lucide-react";

function Register() {

    const navigate = useNavigate();
    const { register } = useAuth();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        registrationKey: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            await register(
                form.username,
                form.email,
                form.password,
                form.registrationKey
            );

            navigate("/login", {
                replace: true,
                state: {
                    message: "Account created successfully. Please sign in."
                }
            });

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">

            <div className="auth-card">

                <div className="brand">
                    <div className="brand-icon">T</div>
                    <h1>ThandoLeads</h1>
                </div>

                <p className="brand-subtitle">
                    Client Lead Management System
                </p>

                <h2>Create an account</h2>

                <p className="auth-description">
                    Register as an administrator to manage your leads.
                </p>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Username</label>

                        <div className="input-wrapper">
                            <User size={18} />

                            <input
                                name="username"
                                placeholder="Enter username"
                                value={form.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>

                        <div className="input-wrapper">
                            <Mail size={18} />

                            <input
                                name="email"
                                type="email"
                                placeholder="Enter email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <div className="input-wrapper">
                            <LockKeyhole size={18} />

                            <input
                                name="password"
                                type="password"
                                placeholder="Minimum 8 characters"
                                value={form.password}
                                onChange={handleChange}
                                minLength={8}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Administrator Registration Key</label>

                        <div className="input-wrapper">
                            <KeyRound size={18} />

                            <input
                                name="registrationKey"
                                type="password"
                                placeholder="Enter your invitation code"
                                value={form.registrationKey}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create Account"}
                        {!loading && <ArrowRight size={18} />}
                    </button>

                </form>

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/login">Sign in</Link>
                </p>

            </div>

        </div>
    );
}

export default Register;
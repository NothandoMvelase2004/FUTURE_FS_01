import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LockKeyhole, Mail, ArrowRight } from "lucide-react";

function Login() {

    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            await login(email, password);
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to log in. Please try again."
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

                <h2>Welcome back</h2>

                <p className="auth-description">
                    Sign in to manage your clients and track your leads.
                </p>

                {location.state?.message && (
                    <div className="success-message">
                        {location.state.message}
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Email Address</label>

                        <div className="input-wrapper">
                            <Mail size={18} />

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <div className="input-wrapper">
                            <LockKeyhole size={18} />

                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                        {!loading && <ArrowRight size={18} />}
                    </button>

                </form>

                <p className="auth-footer">
                    Need an administrator account?{" "}
                    <Link to="/register">
                        Register here
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Login;
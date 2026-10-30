import {
    LayoutDashboard,
    Users,
    BarChart3,
    Settings,
    LogOut
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CalendarClock } from "lucide-react";

function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">T</div>

                <div>
                    <h2>ThandoLeads</h2>
                    <span>MINI CRM</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/dashboard" className="nav-item">
                    <LayoutDashboard size={19} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/leads" className="nav-item">
                    <Users size={19} />
                    <span>Lead Management</span>
                </NavLink>

                <NavLink to="/reports" className="nav-item">
                    <BarChart3 size={19} />
                    <span>Reports</span>
                </NavLink>

                <NavLink to="/settings" className="nav-item">
                    <Settings size={19} />
                    <span>Settings</span>
                </NavLink>

                <NavLink to="/follow-ups" className="sidebar-link">
                    <CalendarClock size={20} />
                    <span>Follow-Ups</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="user-avatar">
                        {user?.username?.charAt(0).toUpperCase() || "A"}
                    </div>

                    <div>
                        <strong>{user?.username || "Admin"}</strong>
                        <span>Administrator</span>
                    </div>
                </div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
import { useCallback, useEffect, useState } from "react";

import {
    Users,
    UserPlus,
    PhoneCall,
    UserCheck,
    TrendingUp,
    ArrowRight,
    CalendarClock,
    Clock3,
    AlertTriangle,
    CheckCircle2,
    RefreshCw
} from "lucide-react";

import { Link } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";

function Dashboard() {
    const { user } = useAuth();

    const [stats, setStats] = useState({
        totalLeads: 0,
        newLeads: 0,
        contactedLeads: 0,
        convertedLeads: 0,
        conversionRate: 0
    });

    const [leads, setLeads] = useState([]);
    const [followUps, setFollowUps] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchDashboard = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const [
                statsResponse,
                leadsResponse,
                followUpsResponse
            ] = await Promise.all([
                api.get("/leads/stats"),
                api.get("/leads"),
                api.get("/follow-ups")
            ]);

            setStats(statsResponse.data.stats);

            setLeads(
                (leadsResponse.data.leads || []).slice(0, 5)
            );

            setFollowUps(
                followUpsResponse.data.followUps || []
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load dashboard data."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);


    const statCards = [
        {
            title: "Total Leads",
            value: stats.totalLeads,
            icon: Users,
            color: "purple"
        },
        {
            title: "New Leads",
            value: stats.newLeads,
            icon: UserPlus,
            color: "blue"
        },
        {
            title: "Contacted",
            value: stats.contactedLeads,
            icon: PhoneCall,
            color: "orange"
        },
        {
            title: "Converted",
            value: stats.convertedLeads,
            icon: UserCheck,
            color: "green"
        }
    ];

    // ==========================================
    // FOLLOW-UP HELPERS
    // ==========================================

    const getFollowUpStatus = (followUp) => {
        if (followUp.status === "completed") {
            return "completed";
        }

        const scheduledDate = new Date(followUp.follow_up_date);

        if (scheduledDate.getTime() < Date.now()) {
            return "overdue";
        }

        return "upcoming";
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "Not scheduled";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Invalid date";
        }

        return date.toLocaleString("en-ZA", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getClientName = (followUp) => {
        return (
            followUp.lead_name ||
            followUp.name ||
            "Unknown Client"
        );
    };

    // ==========================================
    // FOLLOW-UP STATISTICS
    // ==========================================

    const upcomingFollowUps = followUps
        .filter((item) => getFollowUpStatus(item) === "upcoming")
        .sort(
            (a, b) =>
                new Date(a.follow_up_date) -
                new Date(b.follow_up_date)
        );

    const overdueFollowUps = followUps
        .filter((item) => getFollowUpStatus(item) === "overdue")
        .sort(
            (a, b) =>
                new Date(a.follow_up_date) -
                new Date(b.follow_up_date)
        );

    const completedFollowUps = followUps.filter(
        (item) => getFollowUpStatus(item) === "completed"
    );

    const followUpStats = [
        {
            title: "Total Follow-Ups",
            value: followUps.length,
            icon: CalendarClock,
            color: "purple"
        },
        {
            title: "Upcoming",
            value: upcomingFollowUps.length,
            icon: Clock3,
            color: "blue"
        },
        {
            title: "Overdue",
            value: overdueFollowUps.length,
            icon: AlertTriangle,
            color: "orange"
        },
        {
            title: "Completed",
            value: completedFollowUps.length,
            icon: CheckCircle2,
            color: "green"
        }
    ];

    // Show overdue reminders first, followed by upcoming reminders.
    const priorityFollowUps = [
        ...overdueFollowUps,
        ...upcomingFollowUps
    ].slice(0, 5);

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">

                {/* DASHBOARD HEADER */}

                <header className="dashboard-header">
                    <div>
                        <p className="page-label">OVERVIEW</p>

                        <h1>Dashboard</h1>

                        <p className="page-description">
                            Welcome back, {user?.username}!
                            Here's your lead overview.
                        </p>
                    </div>

                    <div className="dashboard-header-actions">
                        <NotificationBell />

                        <button
                            type="button"
                            className="dashboard-refresh-button"
                            onClick={() => fetchDashboard(true)}
                            disabled={loading || refreshing}
                        >

                            <RefreshCw
                                size={18}
                                className={
                                    refreshing ? "refresh-spinning" : ""
                                }
                            />

                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>

                        <Link
                            to="/leads"
                            className="add-lead-button"
                        >
                            <UserPlus size={18} />
                            Add New Lead
                        </Link>

                    </div>
                </header>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {loading ? (
                    <p>Loading dashboard...</p>
                ) : (
                    <>

                        {/* ============================= */}
                        {/* LEAD STATISTICS */}
                        {/* ============================= */}

                        <section className="stats-grid">
                            {statCards.map((card) => {
                                const Icon = card.icon;

                                return (
                                    <div
                                        className="stat-card"
                                        key={card.title}
                                    >
                                        <div className="stat-card-top">
                                            <span>{card.title}</span>

                                            <div
                                                className={`stat-icon ${card.color}`}
                                            >
                                                <Icon size={20} />
                                            </div>
                                        </div>

                                        <h2>{card.value}</h2>

                                        <p>Current lead count</p>
                                    </div>
                                );
                            })}
                        </section>

                        {/* ============================= */}
                        {/* CONVERSION RATE */}
                        {/* ============================= */}

                        <section className="conversion-card">
                            <div className="conversion-icon">
                                <TrendingUp size={24} />
                            </div>

                            <div>
                                <p>Lead Conversion Rate</p>

                                <h2>{stats.conversionRate}%</h2>

                                <span>
                                    Percentage of leads successfully converted
                                </span>
                            </div>
                        </section>

                        {/* ============================= */}
                        {/* FOLLOW-UP SECTION HEADER */}
                        {/* ============================= */}

                        <div className="dashboard-followups-heading">
                            <div>
                                <p className="page-label">
                                    CLIENT REMINDERS
                                </p>

                                <h2>Follow-Up Overview</h2>

                                <p>
                                    Track scheduled client interactions
                                    and outstanding reminders.
                                </p>
                            </div>

                            <Link
                                to="/follow-ups"
                                className="dashboard-followups-link"
                            >
                                Manage Follow-Ups
                                <ArrowRight size={17} />
                            </Link>
                        </div>

                        {/* ============================= */}
                        {/* FOLLOW-UP STATISTICS */}
                        {/* ============================= */}

                        <section className="stats-grid">
                            {followUpStats.map((card) => {
                                const Icon = card.icon;

                                return (
                                    <div
                                        className="stat-card"
                                        key={card.title}
                                    >
                                        <div className="stat-card-top">
                                            <span>{card.title}</span>

                                            <div
                                                className={`stat-icon ${card.color}`}
                                            >
                                                <Icon size={20} />
                                            </div>
                                        </div>

                                        <h2>{card.value}</h2>

                                        <p>Follow-up reminders</p>
                                    </div>
                                );
                            })}
                        </section>

                        {/* ============================= */}
                        {/* OVERDUE ALERT */}
                        {/* ============================= */}

                        {overdueFollowUps.length > 0 && (
                            <section className="dashboard-overdue-alert">
                                <div className="dashboard-alert-icon">
                                    <AlertTriangle size={23} />
                                </div>

                                <div>
                                    <h3>
                                        {overdueFollowUps.length} Overdue
                                        {overdueFollowUps.length === 1
                                            ? " Follow-Up"
                                            : " Follow-Ups"}
                                    </h3>

                                    <p>
                                        You have pending reminders that
                                        require your attention.
                                    </p>
                                </div>

                                <Link to="/follow-ups">
                                    View Reminders
                                    <ArrowRight size={16} />
                                </Link>
                            </section>
                        )}

                        {/* ============================= */}
                        {/* PRIORITY REMINDERS */}
                        {/* ============================= */}

                        <section className="recent-leads-card dashboard-reminders-card">

                            <div className="section-header">
                                <div>
                                    <h2>Priority Reminders</h2>

                                    <p>
                                        Overdue and upcoming client follow-ups
                                    </p>
                                </div>

                                <Link
                                    to="/follow-ups"
                                    className="view-all-link"
                                >
                                    View All
                                    <ArrowRight size={16} />
                                </Link>
                            </div>

                            <div className="table-wrapper">
                                <table className="leads-table">

                                    <thead>
                                        <tr>
                                            <th>Client</th>
                                            <th>Follow-Up Date</th>
                                            <th>Description</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {priorityFollowUps.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="empty-state"
                                                >
                                                    No pending reminders.
                                                    You're all caught up!
                                                </td>
                                            </tr>
                                        ) : (
                                            priorityFollowUps.map((item) => {
                                                const status =
                                                    getFollowUpStatus(item);

                                                return (
                                                    <tr key={item.id}>

                                                        <td>
                                                            {getClientName(item)}
                                                        </td>

                                                        <td>
                                                            {formatDate(
                                                                item.follow_up_date
                                                            )}
                                                        </td>

                                                        <td>
                                                            {item.description ||
                                                                "No description"}
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={
                                                                    `dashboard-reminder-badge ${status}`
                                                                }
                                                            >
                                                                {status}
                                                            </span>
                                                        </td>

                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>

                                </table>
                            </div>
                        </section>

                        {/* ============================= */}
                        {/* RECENT LEADS - EXISTING */}
                        {/* ============================= */}

                        <section className="recent-leads-card">
                            <div className="section-header">
                                <div>
                                    <h2>Recent Leads</h2>

                                    <p>Your latest client enquiries</p>
                                </div>

                                <Link
                                    to="/leads"
                                    className="view-all-link"
                                >
                                    View All
                                    <ArrowRight size={16} />
                                </Link>
                            </div>

                            <div className="table-wrapper">
                                <table className="leads-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Source</th>
                                            <th>Status</th>
                                            <th>Date Added</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {leads.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="empty-state"
                                                >
                                                    No leads available yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            leads.map((lead) => (
                                                <tr key={lead.id}>
                                                    <td>{lead.name}</td>

                                                    <td>{lead.email}</td>

                                                    <td>
                                                        {lead.source || "—"}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                `status-badge ${lead.status}`
                                                            }
                                                        >
                                                            {lead.status}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {new Date(
                                                            lead.created_at
                                                        ).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                    </>
                )}

            </main>
        </div>
    );
}

export default Dashboard;
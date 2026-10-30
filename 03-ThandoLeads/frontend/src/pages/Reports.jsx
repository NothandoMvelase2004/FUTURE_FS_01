import { useEffect, useState } from "react";

import {
    Users,
    UserPlus,
    PhoneCall,
    UserCheck,
    TrendingUp,
    RefreshCw
} from "lucide-react";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

const STATUS_COLORS = ["#60a5fa", "#fb923c", "#4ade80"];

const initialStats = {
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    convertedLeads: 0,
    conversionRate: 0
};

function Reports() {
    const [stats, setStats] = useState(initialStats);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError("");

            const [statsResponse, leadsResponse] =
                await Promise.all([
                    api.get("/leads/stats"),
                    api.get("/leads")
                ]);

            const allLeads = leadsResponse.data.leads || [];

            setLeads(allLeads);
            setStats(statsResponse.data.stats || initialStats);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load analytics."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Calculate status distribution directly from lead records.
    const statusData = [
        {
            name: "New",
            value: leads.filter(
                (lead) => lead.status === "new"
            ).length
        },
        {
            name: "Contacted",
            value: leads.filter(
                (lead) => lead.status === "contacted"
            ).length
        },
        {
            name: "Converted",
            value: leads.filter(
                (lead) => lead.status === "converted"
            ).length
        }
    ];

    // Count how many leads came from each source.
    const sourceCounts = leads.reduce((accumulator, lead) => {
        const source = lead.source?.trim() || "Unknown";

        accumulator[source] = (accumulator[source] || 0) + 1;

        return accumulator;
    }, {});

    const sourceData = Object.entries(sourceCounts)
        .map(([name, total]) => ({
            name,
            total
        }))
        .sort((a, b) => b.total - a.total);

    const hasLeads = leads.length > 0;

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
            title: "Contacted Leads",
            value: stats.contactedLeads,
            icon: PhoneCall,
            color: "orange"
        },
        {
            title: "Converted Leads",
            value: stats.convertedLeads,
            icon: UserCheck,
            color: "green"
        }
    ];

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">

                <header className="dashboard-header">
                    <div>
                        <p className="page-label">
                            BUSINESS INTELLIGENCE
                        </p>

                        <h1>Reports & Analytics</h1>

                        <p className="page-description">
                            Monitor lead performance and business growth.
                        </p>
                    </div>

                    <button
                        className="add-lead-button"
                        onClick={fetchReports}
                        disabled={loading}
                    >
                        <RefreshCw size={18} />
                        Refresh Reports
                    </button>
                </header>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="reports-loading">
                        Loading analytics...
                    </div>
                ) : (
                    <>
                        {/* STATISTICS CARDS */}

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

                        {/* CONVERSION RATE */}

                        <section className="conversion-card">
                            <div className="conversion-icon">
                                <TrendingUp size={24} />
                            </div>

                            <div>
                                <p>Lead Conversion Rate</p>

                                <h2>
                                    {Number(
                                        stats.conversionRate || 0
                                    ).toFixed(1)}%
                                </h2>

                                <span>
                                    Percentage of leads converted into clients
                                </span>
                            </div>
                        </section>

                        {/* ANALYTICS CHARTS */}

                        <section className="reports-grid">

                            {/* PIE CHART */}

                            <div className="report-chart-card">
                                <div className="report-chart-header">
                                    <h2>Lead Status Distribution</h2>

                                    <p>
                                        Breakdown of leads by current status
                                    </p>
                                </div>

                                {hasLeads ? (
                                    <div className="chart-container">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="45%"
                                                    outerRadius={100}
                                                    label
                                                >
                                                    {statusData.map(
                                                        (entry, index) => (
                                                            <Cell
                                                                key={entry.name}
                                                                fill={
                                                                    STATUS_COLORS[index]
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </Pie>

                                                <Tooltip />

                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="chart-empty">
                                        No lead data available yet.
                                    </div>
                                )}
                            </div>

                            {/* BAR CHART */}

                            <div className="report-chart-card">
                                <div className="report-chart-header">
                                    <h2>Lead Sources</h2>

                                    <p>
                                        Where your potential clients come from
                                    </p>
                                </div>

                                {hasLeads ? (
                                    <div className="chart-container">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart
                                                data={sourceData}
                                                margin={{
                                                    top: 15,
                                                    right: 15,
                                                    left: 0,
                                                    bottom: 20
                                                }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#263044"
                                                />

                                                <XAxis
                                                    dataKey="name"
                                                    stroke="#94a3b8"
                                                    tick={{ fontSize: 11 }}
                                                    interval={0}
                                                    angle={-20}
                                                    textAnchor="end"
                                                />

                                                <YAxis
                                                    stroke="#94a3b8"
                                                    allowDecimals={false}
                                                />

                                                <Tooltip
                                                    cursor={{
                                                        fill: "#1e293b"
                                                    }}
                                                />

                                                <Bar
                                                    dataKey="total"
                                                    name="Leads"
                                                    fill="#8b5cf6"
                                                    radius={[6, 6, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="chart-empty">
                                        No lead sources available yet.
                                    </div>
                                )}
                            </div>

                        </section>

                        {/* PERFORMANCE SUMMARY */}

                        <section className="performance-card">
                            <h2>Performance Summary</h2>

                            <p>
                                Overview of your current lead management
                                performance.
                            </p>

                            <div className="performance-grid">
                                <div className="performance-item">
                                    <span>Total Leads</span>

                                    <strong>
                                        {stats.totalLeads}
                                    </strong>
                                </div>

                                <div className="performance-item">
                                    <span>Successfully Converted</span>

                                    <strong>
                                        {stats.convertedLeads}
                                    </strong>
                                </div>

                                <div className="performance-item">
                                    <span>Conversion Rate</span>

                                    <strong>
                                        {Number(
                                            stats.conversionRate || 0
                                        ).toFixed(1)}%
                                    </strong>
                                </div>

                                <div className="performance-item">
                                    <span>Lead Sources</span>

                                    <strong>
                                        {sourceData.length}
                                    </strong>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

export default Reports;
import { useCallback, useEffect, useState } from "react";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    RefreshCw
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

const emptyForm = {
    name: "",
    email: "",
    phone: "",
    source: "",
    status: "new",
    notes: ""
};

const statusOptions = ["new", "contacted", "converted"];

function Leads() {
    const [leads, setLeads] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/leads");

            setLeads(response.data.leads || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load leads."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const filteredLeads = leads.filter((lead) => {
        const query = search.toLowerCase();

        const matchesSearch =
            lead.name?.toLowerCase().includes(query) ||
            lead.email?.toLowerCase().includes(query) ||
            (lead.phone || "").includes(search);

        const matchesStatus =
            !statusFilter || lead.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const openAddModal = () => {
        setEditingId(null);
        setForm({ ...emptyForm });
        setError("");
        setShowModal(true);
    };

    const openEditModal = (lead) => {
        setEditingId(lead.id);

        setForm({
            name: lead.name || "",
            email: lead.email || "",
            phone: lead.phone || "",
            source: lead.source || "",
            status: lead.status || "new",
            notes: lead.notes || ""
        });

        setError("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingId(null);
        setForm({ ...emptyForm });
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            if (editingId !== null) {
                await api.put(`/leads/${editingId}`, form);
                setSuccess("Lead updated successfully.");
            } else {
                await api.post("/leads", form);
                setSuccess("Lead added successfully.");
            }

            setShowModal(false);
            setEditingId(null);
            setForm({ ...emptyForm });

            await fetchLeads();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save lead."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (lead) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${lead.name}?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await api.delete(`/leads/${lead.id}`);

            setSuccess("Lead deleted successfully.");
            await fetchLeads();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete lead."
            );
        }
    };

    const handleStatusChange = async (lead, newStatus) => {
        try {
            setError("");
            setSuccess("");

            await api.put(`/leads/${lead.id}`, {
                status: newStatus
            });

            setSuccess("Lead status updated successfully.");
            await fetchLeads();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update status."
            );
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <header className="dashboard-header">
                    <div>
                        <p className="page-label">CLIENT MANAGEMENT</p>
                        <h1>Lead Management</h1>
                        <p className="page-description">
                            Organise, manage and track your client leads.
                        </p>
                    </div>

                    <button
                        className="add-lead-button"
                        onClick={openAddModal}
                    >
                        <Plus size={18} />
                        Add New Lead
                    </button>
                </header>

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <section className="recent-leads-card">
                    <div className="leads-toolbar">
                        <div className="leads-search">
                            <Search size={18} />

                            <input
                                type="search"
                                placeholder="Search name, email or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <select
                            className="filter-select"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                        >
                            <option value="">All Statuses</option>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                        </select>

                        <button
                            className="refresh-button"
                            onClick={fetchLeads}
                            title="Refresh leads"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>

                    <div className="table-wrapper">
                        <table className="leads-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Source</th>
                                    <th>Status</th>
                                    <th>Date Added</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="empty-state"
                                        >
                                            Loading leads...
                                        </td>
                                    </tr>
                                ) : filteredLeads.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="empty-state"
                                        >
                                            No matching leads found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <tr key={lead.id}>
                                            <td>{lead.name}</td>
                                            <td>{lead.email}</td>
                                            <td>{lead.phone || "—"}</td>
                                            <td>{lead.source || "—"}</td>

                                            <td>
                                                <select
                                                    className={`status-select ${lead.status}`}
                                                    value={lead.status}
                                                    onChange={(e) =>
                                                        handleStatusChange(
                                                            lead,
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    {statusOptions.map(
                                                        (status) => (
                                                            <option
                                                                key={status}
                                                                value={status}
                                                            >
                                                                {status.charAt(0).toUpperCase() +
                                                                    status.slice(1)}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </td>

                                            <td>
                                                {new Date(
                                                    lead.created_at
                                                ).toLocaleDateString()}
                                            </td>

                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        className="icon-button edit"
                                                        title="Edit lead"
                                                        onClick={() =>
                                                            openEditModal(lead)
                                                        }
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    <button
                                                        className="icon-button delete"
                                                        title="Delete lead"
                                                        onClick={() =>
                                                            handleDelete(lead)
                                                        }
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <p className="leads-count">
                        Showing {filteredLeads.length} of {leads.length} leads
                    </p>
                </section>
            </main>

            {showModal && (
                <div className="modal-overlay">
                    <div
                        className="lead-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="lead-modal-title"
                    >
                        <div className="modal-header">
                            <div>
                                <h2 id="lead-modal-title">
                                    {editingId !== null
                                        ? "Edit Lead"
                                        : "Add New Lead"}
                                </h2>

                                <p>
                                    Enter the client's information below.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={closeModal}
                                disabled={saving}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-form-grid">
                                <div className="form-group">
                                    <label htmlFor="lead-name">
                                        Full Name *
                                    </label>

                                    <input
                                        id="lead-name"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        maxLength={100}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lead-email">
                                        Email Address *
                                    </label>

                                    <input
                                        id="lead-email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        maxLength={150}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lead-phone">
                                        Phone Number
                                    </label>

                                    <input
                                        id="lead-phone"
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={handleChange}
                                        maxLength={20}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lead-source">
                                        Lead Source
                                    </label>

                                    <select
                                        id="lead-source"
                                        name="source"
                                        value={form.source}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select source</option>
                                        <option value="Website">Website</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Email">Email</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lead-status">
                                        Status
                                    </label>

                                    <select
                                        id="lead-status"
                                        name="status"
                                        value={form.status}
                                        onChange={handleChange}
                                    >
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="converted">Converted</option>
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="lead-notes">
                                        Notes
                                    </label>

                                    <textarea
                                        id="lead-notes"
                                        name="notes"
                                        rows={4}
                                        value={form.notes}
                                        onChange={handleChange}
                                        placeholder="Add additional client information..."
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="add-lead-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId !== null
                                            ? "Save Changes"
                                            : "Add Lead"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Leads;
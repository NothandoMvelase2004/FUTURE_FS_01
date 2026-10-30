import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import "../followups.css";

const API = "http://localhost:5000/api";

const getHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
});

const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
};

const formatDate = (value) => {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getReminderStatus = (reminder) => {
  if (reminder.status === "completed") return "completed";

  const date = new Date(reminder.follow_up_date);

  if (date.getTime() < Date.now()) return "overdue";

  return "upcoming";
};

function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [leads, setLeads] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    lead_id: "",
    follow_up_date: "",
    description: "",
    status: "pending",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [followUpResponse, leadsResponse] = await Promise.all([
        axios.get(`${API}/follow-ups`, {
          headers: getHeaders(),
        }),
        axios.get(`${API}/leads`, {
          headers: getHeaders(),
        }),
      ]);

      setFollowUps(followUpResponse.data.followUps || []);
      setLeads(leadsResponse.data.leads || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load follow-up reminders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    return {
      total: followUps.length,
      upcoming: followUps.filter(
        (item) => getReminderStatus(item) === "upcoming"
      ).length,
      overdue: followUps.filter(
        (item) => getReminderStatus(item) === "overdue"
      ).length,
      completed: followUps.filter(
        (item) => getReminderStatus(item) === "completed"
      ).length,
    };
  }, [followUps]);

  const filteredFollowUps = useMemo(() => {
    return followUps.filter((item) => {
      const lead = leads.find(
        (leadItem) => Number(leadItem.id) === Number(item.lead_id)
      );

      const clientName =
        item.lead_name ||
        item.name ||
        lead?.name ||
        "Unknown client";

      const query = search.toLowerCase();

      const matchesSearch =
        clientName.toLowerCase().includes(query) ||
        (item.description || "").toLowerCase().includes(query);

      const reminderStatus = getReminderStatus(item);

      const matchesFilter =
        filter === "all" || reminderStatus === filter;

      return matchesSearch && matchesFilter;
    });
  }, [followUps, leads, search, filter]);

  const resetForm = () => {
    setForm({
      lead_id: "",
      follow_up_date: "",
      description: "",
      status: "pending",
    });

    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setError("");
    setShowModal(true);
  };

  const openEditModal = (reminder) => {
    setEditingId(reminder.id);

    setForm({
      lead_id: reminder.lead_id,
      follow_up_date: toDateTimeLocal(reminder.follow_up_date),
      description: reminder.description || "",
      status: reminder.status,
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.lead_id || !form.follow_up_date) {
      setError("Please select a client and follow-up date.");
      return;
    }

    const selectedDate = new Date(form.follow_up_date);

    if (Number.isNaN(selectedDate.getTime())) {
      setError("Please enter a valid follow-up date.");
      return;
    }

    if (!editingId && selectedDate <= new Date()) {
      setError("New follow-ups must be scheduled in the future.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await axios.put(
          `${API}/follow-ups/${editingId}`,
          {
            follow_up_date: form.follow_up_date.replace("T", " ") + ":00",
            description: form.description,
            status: form.status,
          },
          {
            headers: getHeaders(),
          }
        );

        setMessage("Follow-up updated successfully.");
      } else {
        await axios.post(
          `${API}/follow-ups`,
          {
            lead_id: Number(form.lead_id),
            follow_up_date: form.follow_up_date.replace("T", " ") + ":00",
            description: form.description,
          },
          {
            headers: getHeaders(),
          }
        );

        setMessage("Follow-up scheduled successfully.");
      }

      closeModal();
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save the follow-up."
      );
    } finally {
      setSaving(false);
    }
  };

  const markCompleted = async (id) => {
    try {
      setError("");
      setMessage("");

      await axios.patch(
        `${API}/follow-ups/${id}/complete`,
        {},
        {
          headers: getHeaders(),
        }
      );

      setMessage("Follow-up marked as completed.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to complete follow-up."
      );
    }
  };

  const deleteFollowUp = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this follow-up?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await axios.delete(`${API}/follow-ups/${id}`, {
        headers: getHeaders(),
      });

      setMessage("Follow-up deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete follow-up."
      );
    }
  };

  const getClientName = (reminder) => {
    const lead = leads.find(
      (item) => Number(item.id) === Number(reminder.lead_id)
    );

    return (
      reminder.lead_name ||
      reminder.name ||
      lead?.name ||
      "Unknown client"
    );
  };

  return (
    <div className="followups-layout">
      <Sidebar />

      <main className="followups-main">
        <div className="followups-header">
          <div>
            <p className="followups-eyebrow">CLIENT RELATIONSHIPS</p>
            <h1>Follow-Up Management</h1>
            <p>
              Schedule reminders and stay connected with your leads.
            </p>
          </div>

          <button
            className="followups-add-btn"
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Schedule Follow-Up
          </button>
        </div>

        {message && (
          <div className="followups-success">{message}</div>
        )}

        {error && (
          <div className="followups-error">{error}</div>
        )}

        <section className="followups-stats">
          <div className="followups-stat-card">
            <div className="followups-stat-icon total">
              <CalendarClock size={22} />
            </div>

            <p>Total Follow-Ups</p>
            <h2>{stats.total}</h2>
          </div>

          <div className="followups-stat-card">
            <div className="followups-stat-icon upcoming">
              <Clock3 size={22} />
            </div>

            <p>Upcoming</p>
            <h2>{stats.upcoming}</h2>
          </div>

          <div className="followups-stat-card">
            <div className="followups-stat-icon overdue">
              <AlertTriangle size={22} />
            </div>

            <p>Overdue</p>
            <h2>{stats.overdue}</h2>
          </div>

          <div className="followups-stat-card">
            <div className="followups-stat-icon completed">
              <CheckCircle2 size={22} />
            </div>

            <p>Completed</p>
            <h2>{stats.completed}</h2>
          </div>
        </section>

        <section className="followups-panel">
          <div className="followups-toolbar">
            <div className="followups-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search clients or reminders..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All Follow-Ups</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>

            <button
              className="followups-refresh-btn"
              onClick={loadData}
              title="Refresh reminders"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="followups-table-wrapper">
            <table className="followups-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Scheduled Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="followups-empty">
                      Loading reminders...
                    </td>
                  </tr>
                ) : filteredFollowUps.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="followups-empty">
                      No follow-ups found.
                    </td>
                  </tr>
                ) : (
                  filteredFollowUps.map((reminder) => {
                    const status = getReminderStatus(reminder);

                    return (
                      <tr key={reminder.id}>
                        <td className="followups-client">
                          {getClientName(reminder)}
                        </td>

                        <td>
                          {formatDate(reminder.follow_up_date)}
                        </td>

                        <td className="followups-description">
                          {reminder.description || "No description"}
                        </td>

                        <td>
                          <span
                            className={`followups-badge ${status}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td>
                          <div className="followups-actions">
                            {reminder.status !== "completed" && (
                              <button
                                title="Mark completed"
                                className="complete"
                                onClick={() =>
                                  markCompleted(reminder.id)
                                }
                              >
                                <CheckCircle2 size={17} />
                              </button>
                            )}

                            <button
                              title="Edit reminder"
                              onClick={() =>
                                openEditModal(reminder)
                              }
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              title="Delete reminder"
                              className="delete"
                              onClick={() =>
                                deleteFollowUp(reminder.id)
                              }
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showModal && (
          <div className="followups-modal-overlay">
            <div className="followups-modal">
              <div className="followups-modal-header">
                <h2>
                  {editingId
                    ? "Edit Follow-Up"
                    : "Schedule Follow-Up"}
                </h2>

                <button onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <label>Client</label>

                <select
                  name="lead_id"
                  value={form.lead_id}
                  onChange={handleChange}
                  disabled={Boolean(editingId)}
                  required
                >
                  <option value="">Select a client</option>

                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name}
                    </option>
                  ))}
                </select>

                <label>Follow-Up Date and Time</label>

                <input
                  type="datetime-local"
                  name="follow_up_date"
                  value={form.follow_up_date}
                  onChange={handleChange}
                  required
                />

                <label>Description</label>

                <textarea
                  name="description"
                  rows="4"
                  placeholder="What needs to be discussed?"
                  value={form.description}
                  onChange={handleChange}
                />

                {editingId && (
                  <>
                    <label>Status</label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </>
                )}

                <div className="followups-modal-actions">
                  <button
                    type="button"
                    className="followups-cancel"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="followups-save"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Save Changes"
                      : "Schedule Reminder"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default FollowUps;
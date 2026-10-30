import { useCallback, useEffect, useRef, useState } from "react";

import {
    Bell,
    AlertTriangle,
    Clock3,
    ArrowRight,
    X,
    Check,
    CheckCheck,
    RefreshCw
} from "lucide-react";

import { Link } from "react-router-dom";
import api from "../services/api";

import "../notification.css";

const REFRESH_INTERVAL = 60000;

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [markingAll, setMarkingAll] = useState(false);
    const [error, setError] = useState("");

    const containerRef = useRef(null);

    // ==========================================
    // FETCH NOTIFICATIONS
    // ==========================================

    const fetchNotifications = useCallback(async (silent = false) => {
        try {
            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await api.get("/notifications");

            setNotifications(response.data.notifications || []);
            setUnreadCount(Number(response.data.unreadCount || 0));

            setError("");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load notifications."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // ==========================================
    // AUTOMATIC REFRESH
    // ==========================================

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications(true);
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // ==========================================
    // REFRESH WHEN DROPDOWN OPENS
    // ==========================================

    useEffect(() => {
        if (isOpen) {
            fetchNotifications(true);
        }
    }, [isOpen, fetchNotifications]);

    // ==========================================
    // CLOSE DROPDOWN
    // ==========================================

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, []);

    // ==========================================
    // MARK ONE AS READ
    // ==========================================

    const markAsRead = async (id) => {
        try {
            setProcessingId(id);
            setError("");

            await api.patch(`/notifications/${id}/read`);

            await fetchNotifications(true);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to mark notification as read."
            );
        } finally {
            setProcessingId(null);
        }
    };

    // ==========================================
    // MARK ALL AS READ
    // ==========================================

    const markAllAsRead = async () => {
        try {
            setMarkingAll(true);
            setError("");

            await api.patch("/notifications/read-all");

            await fetchNotifications(true);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to mark all notifications as read."
            );
        } finally {
            setMarkingAll(false);
        }
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (value) => {
        if (!value) return "No date available";

        const date = new Date(value);

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

    // ==========================================
    // NOTIFICATION STATISTICS
    // ==========================================

    const overdueCount = notifications.filter(
        (notification) =>
            notification.type === "overdue" &&
            !Number(notification.is_read)
    ).length;

    const upcomingCount = notifications.filter(
        (notification) =>
            notification.type === "upcoming" &&
            !Number(notification.is_read)
    ).length;

    const sortedNotifications = [...notifications].sort((a, b) => {
        const aRead = Number(a.is_read);
        const bRead = Number(b.is_read);

        if (aRead !== bRead) {
            return aRead - bRead;
        }

        return (
            new Date(b.created_at) -
            new Date(a.created_at)
        );
    });

    // ==========================================
    // COMPONENT
    // ==========================================

    return (
        <div
            className="notification-container"
            ref={containerRef}
        >

            {/* NOTIFICATION BELL */}

            <button
                type="button"
                className="notification-bell-button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`${unreadCount} unread notifications`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Bell size={21} />

                {unreadCount > 0 && (
                    <span className="notification-count">
                        {unreadCount > 99
                            ? "99+"
                            : unreadCount}
                    </span>
                )}
            </button>

            {/* NOTIFICATION DROPDOWN */}

            {isOpen && (
                <div className="notification-dropdown">

                    {/* HEADER */}

                    <div className="notification-dropdown-header">

                        <div>
                            <h3>Notifications</h3>

                            <p>
                                {unreadCount} unread notification
                                {unreadCount !== 1 ? "s" : ""}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="notification-close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close notifications"
                        >
                            <X size={18} />
                        </button>

                    </div>

                    {/* ACTION BAR */}

                    <div className="notification-action-bar">

                        <button
                            type="button"
                            className="notification-action-button"
                            onClick={() => fetchNotifications(true)}
                            disabled={refreshing || loading}
                        >
                            <RefreshCw size={15} />

                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                        <button
                            type="button"
                            className="notification-action-button mark-all"
                            onClick={markAllAsRead}
                            disabled={
                                unreadCount === 0 ||
                                markingAll ||
                                loading
                            }
                        >
                            <CheckCheck size={16} />

                            {markingAll
                                ? "Updating..."
                                : "Mark All Read"}
                        </button>

                    </div>

                    {/* SUMMARY */}

                    <div className="notification-summary">

                        <span className="notification-summary-overdue">
                            <AlertTriangle size={15} />
                            {overdueCount} Overdue
                        </span>

                        <span className="notification-summary-upcoming">
                            <Clock3 size={15} />
                            {upcomingCount} Upcoming
                        </span>

                    </div>

                    {/* ERROR MESSAGE */}

                    {error && (
                        <div className="notification-error">
                            {error}
                        </div>
                    )}

                    {/* NOTIFICATION LIST */}

                    <div className="notification-list">

                        {loading ? (

                            <div className="notification-empty">
                                Loading notifications...
                            </div>

                        ) : sortedNotifications.length === 0 ? (

                            <div className="notification-empty">

                                <Bell size={30} />

                                <h4>No Notifications</h4>

                                <p>
                                    Your notification history is empty.
                                </p>

                            </div>

                        ) : (

                            sortedNotifications.map((notification) => {
                                const isRead =
                                    Number(notification.is_read) === 1;

                                const isOverdue =
                                    notification.type === "overdue";

                                return (
                                    <div
                                        key={notification.id}
                                        className={
                                            `notification-item ${notification.type} ${
                                                isRead ? "read" : "unread"
                                            }`
                                        }
                                    >

                                        {/* ICON */}

                                        <div className="notification-item-icon">
                                            {isOverdue ? (
                                                <AlertTriangle size={19} />
                                            ) : (
                                                <Clock3 size={19} />
                                            )}
                                        </div>

                                        {/* CONTENT */}

                                        <div className="notification-item-content">

                                            <div className="notification-item-top">

                                                <h4>
                                                    {notification.title}
                                                </h4>

                                                {!isRead && (
                                                    <span className="notification-unread-dot" />
                                                )}

                                            </div>

                                            <p>
                                                {notification.message}
                                            </p>

                                            {notification.lead_name && (
                                                <small className="notification-client">
                                                    Client: {notification.lead_name}
                                                </small>
                                            )}

                                            <small>
                                                {formatDate(
                                                    notification.created_at
                                                )}
                                            </small>

                                            {/* ACTIONS */}

                                            <div className="notification-item-actions">

                                                {!isRead && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            markAsRead(
                                                                notification.id
                                                            )
                                                        }
                                                        disabled={
                                                            processingId ===
                                                            notification.id
                                                        }
                                                    >
                                                        <Check size={14} />

                                                        {processingId ===
                                                        notification.id
                                                            ? "Updating..."
                                                            : "Mark Read"}
                                                    </button>
                                                )}

                                                {isRead && (
                                                    <span className="notification-read-label">
                                                        <CheckCheck size={14} />
                                                        Read
                                                    </span>
                                                )}

                                                {notification.follow_up_id &&
                                                    notification.follow_up_status ===
                                                        "pending" && (
                                                        <Link
                                                            to="/follow-ups"
                                                            onClick={() =>
                                                                setIsOpen(false)
                                                            }
                                                        >
                                                            View Follow-Up
                                                            <ArrowRight size={14} />
                                                        </Link>
                                                    )}

                                            </div>

                                        </div>

                                    </div>
                                );
                            })

                        )}

                    </div>

                    {/* FOOTER */}

                    <Link
                        to="/follow-ups"
                        className="notification-footer"
                        onClick={() => setIsOpen(false)}
                    >
                        Manage Follow-Ups
                        <ArrowRight size={16} />
                    </Link>

                </div>
            )}

        </div>
    );
}

export default NotificationBell;
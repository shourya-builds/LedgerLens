"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageFrame from "@/components/PageFrame";
import {
  getStoredUsers,
  getStoredActivities,
  addUser,
  resetPassword,
  getCurrentSession,
  recordActivity,
  type UserAccount,
  type UserActivity,
  type UserRole,
} from "@/lib/auth";

export default function AdminPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("User");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [resetModalUser, setResetModalUser] = useState<string | null>(null);
  const [modalNewPassword, setModalNewPassword] = useState("");
  const [filterUser, setFilterUser] = useState<string>("All");
  const [currentSession, setCurrentSession] = useState<{ username: string; role: UserRole } | null>(null);

  useEffect(() => {
    const refresh = () => {
      setUsers(getStoredUsers());
      setActivity(getStoredActivities());
      setCurrentSession(getCurrentSession());
    };

    const timer = window.setTimeout(refresh, 0);
    window.addEventListener("storage", refresh);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const result = addUser({
      username: newUsername,
      role: newRole,
      password: newPassword || "welcome123",
    });

    if (!result.success) {
      setMessage({ text: result.error || "Failed to create user.", type: "error" });
      return;
    }

    setUsers(getStoredUsers());
    setActivity(getStoredActivities());
    setMessage({
      text: `User "${newUsername}" created successfully as ${newRole}. Default password: "${newPassword || "welcome123"}"`,
      type: "success",
    });
    setNewUsername("");
    setNewPassword("");
  }

  function handleResetSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetModalUser || !modalNewPassword) return;

    const res = resetPassword(resetModalUser, modalNewPassword);
    if (res.success) {
      setMessage({
        text: `Password for "${resetModalUser}" has been successfully reset to "${modalNewPassword}".`,
        type: "success",
      });
      setUsers(getStoredUsers());
      setActivity(getStoredActivities());
      setResetModalUser(null);
      setModalNewPassword("");
    } else {
      setMessage({ text: res.error || "Failed to reset password.", type: "error" });
    }
  }

  function handleClearActivity() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ledgerlens-activity");
      recordActivity("Cleared workspace activity log");
      setActivity(getStoredActivities());
    }
  }

  const filteredActivity = filterUser === "All"
    ? activity
    : activity.filter((item) => item.user.toLowerCase() === filterUser.toLowerCase());

  return (
    <PageFrame
      title="Admin & User Activity"
      eyebrow="WORKSPACE ADMINISTRATION"
      description="Manage analyst credentials, provision workspace roles, and inspect real-time reconciliation audits."
    >
      {/* Session indicator */}
      {currentSession && (
        <div className="admin-session-bar">
          <span>
            Signed in as: <b>{currentSession.username}</b> ({currentSession.role})
          </span>
          {currentSession.role !== "Admin" ? (
            <Link className="switch-role-link" href="/login">
              Switch to Admin account →
            </Link>
          ) : (
            <span className="admin-status-badge">Full administrator privileges</span>
          )}
        </div>
      )}

      {message && (
        <div className={`notification-banner ${message.type}`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)}>
            ×
          </button>
        </div>
      )}

      <div className="admin-layout-grid">
        {/* Left Column: User Management */}
        <div className="admin-col">
          {/* Add User Card */}
          <section className="card admin-card">
            <div className="card-heading">
              <div>
                <h3>Provision New User</h3>
                <p>Create credentials for team members joining your reconciliation team.</p>
              </div>
            </div>

            <form className="admin-form-vertical" onSubmit={handleAddUser}>
              <div className="form-group-row">
                <label>
                  Username
                  <input
                    type="text"
                    placeholder="e.g. jdoe"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Workspace Role
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                  >
                    <option value="User">User (Analyst)</option>
                    <option value="Admin">Admin (Operations)</option>
                  </select>
                </label>
              </div>

              <label>
                Initial Password
                <input
                  type="text"
                  placeholder="Defaults to welcome123 if blank"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              <button type="submit" className="primary-button admin-submit-btn">
                ＋ Add User Account
              </button>
            </form>
          </section>

          {/* User List Card */}
          <section className="card admin-card">
            <div className="card-heading">
              <div>
                <h3>Workspace Users ({users.length})</h3>
                <p>Registered accounts with access to LedgerLens modules.</p>
              </div>
            </div>

            <div className="user-list">
              {users.map((user) => (
                <div className="admin-user-row" key={user.username}>
                  <div className="user-meta">
                    <span className="user-avatar-small">
                      {user.username.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <b>{user.username}</b>
                      <small>
                        <span className={`role-badge ${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>{" "}
                        • Added {user.createdAt}
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="secondary-button reset-pwd-btn"
                    onClick={() => {
                      setResetModalUser(user.username);
                      setModalNewPassword("");
                    }}
                  >
                    Reset Password
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: User Activity Audit */}
        <div className="admin-col">
          <section className="card admin-card">
            <div className="card-heading" style={{ alignItems: "center" }}>
              <div>
                <h3>Team Activity Log</h3>
                <p>Chronological audit of reconciliations, logins, and credential changes.</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Users</option>
                  {users.map((u) => (
                    <option key={u.username} value={u.username}>
                      {u.username}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="text-btn"
                  onClick={handleClearActivity}
                  title="Clear activity log"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="activity-timeline">
              {filteredActivity.length ? (
                filteredActivity.map((item, idx) => (
                  <div className="activity-timeline-item" key={`${item.time}-${idx}`}>
                    <span className="activity-dot-timeline" />
                    <div className="activity-details">
                      <div className="activity-header">
                        <span className="activity-user-tag">{item.user}</span>
                        <time className="activity-time">{item.time}</time>
                      </div>
                      <p className="activity-action-text">{item.action}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-activity-box">
                  <p>No activity recorded yet for selected filter.</p>
                  <small>Actions performed by analysts will appear here automatically.</small>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Reset Password Modal / Dialog */}
      {resetModalUser && (
        <div className="modal-backdrop" onClick={() => setResetModalUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="hero-kicker">ADMIN SECURITY OVERRIDE</span>
            <h2>Reset password for {resetModalUser}</h2>
            <p className="modal-copy">
              Provide a new temporary password for <b>{resetModalUser}</b>. The user will be able to sign in immediately with this credential.
            </p>

            <form onSubmit={handleResetSubmit}>
              <label>
                New Password
                <input
                  type="text"
                  placeholder="Enter new password (min. 4 characters)"
                  value={modalNewPassword}
                  onChange={(e) => setModalNewPassword(e.target.value)}
                  required
                  autoFocus
                />
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="submit" className="primary-button modal-button">
                  Save New Password
                </button>
                <button
                  type="button"
                  className="secondary-button modal-button"
                  onClick={() => setResetModalUser(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFrame>
  );
}

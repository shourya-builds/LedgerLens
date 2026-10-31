"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword, getStoredUsers } from "@/lib/auth";

export default function ResetPasswordPage() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please provide your username.");
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setError("New password must be at least 4 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setLoading(true);

    const res = resetPassword(username.trim(), newPassword);
    if (!res.success) {
      const available = getStoredUsers().map((u) => u.username).join(", ");
      setError(
        res.error ||
          `Account not found. Available workspace accounts: ${available || "admin, analyst"}`
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand login-brand">
          <span className="brand-mark">L</span>
          <span>LedgerLens</span>
        </div>

        <p className="eyebrow accent">ACCOUNT SECURITY</p>
        <h1>Reset your password</h1>
        <p className="login-copy">
          Enter your account username and set a new password for your LedgerLens workspace.
        </p>

        {success ? (
          <div className="reset-success-box">
            <span className="success-icon">✓</span>
            <h3>Password updated</h3>
            <p>
              Your password for <b>{username}</b> has been updated successfully. You can now sign in with your new credentials.
            </p>
            <Link className="primary-button login-submit" href="/login">
              Continue to Sign In →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset}>
            <label>
              Account Username
              <input
                type="text"
                name="username"
                autoComplete="username"
                placeholder="e.g. analyst or admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                name="newPassword"
                autoComplete="new-password"
                placeholder="Enter new password (min. 4 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="primary-button login-submit"
              disabled={loading}
            >
              {loading ? "Updating password…" : "Reset password"}
            </button>
          </form>
        )}

        <div className="login-footer-links">
          <Link className="reset-link" href="/login">
            ← Back to sign in
          </Link>
        </div>

        <div className="login-hint">
          <span>Tip: Workspace administrators can also reset user credentials directly from the </span>
          <Link className="text-link" href="/admin">
            Admin Portal
          </Link>
          .
        </div>
      </section>
    </main>
  );
}

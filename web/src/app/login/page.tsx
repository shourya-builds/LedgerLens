"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authenticateUser, saveSession, recordActivity, type UserRole } from "@/lib/auth";

export default function LoginPage() {
  const [role, setRole] = useState<UserRole>("User");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleRoleChange(newRole: UserRole) {
    setRole(newRole);
    setError("");
  }

  function fillDemoCredentials() {
    if (role === "Admin") {
      setUsername("admin");
      setPassword("admin123");
    } else {
      setUsername("analyst");
      setPassword("user123");
    }
    setError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError("");

    const result = authenticateUser(username, password, role);
    if (!result.success) {
      setError(result.error || "Authentication failed. Please verify your credentials.");
      setLoading(false);
      return;
    }

    // Save session
    saveSession({
      username: username.trim(),
      role,
      loggedInAt: new Date().toISOString(),
    });

    recordActivity(`Signed in to workspace as ${role}`, username.trim());

    // Redirect based on role
    if (role === "Admin") {
      router.push("/admin");
    } else {
      router.push("/reconcile");
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand login-brand">
          <span className="brand-mark">L</span>
          <span>LedgerLens</span>
        </div>

        <p className="eyebrow accent">SECURE ACCESS</p>
        <h1>Sign in to workspace</h1>
        <p className="login-copy">
          Explainable financial reconciliation powered by Exasol analytics. Select your portal role to continue.
        </p>

        <div className="role-select" role="tablist" aria-label="Select role">
          <button
            type="button"
            className={role === "User" ? "chosen" : ""}
            onClick={() => handleRoleChange("User")}
          >
            User (Finance Analyst)
          </button>
          <button
            type="button"
            className={role === "Admin" ? "chosen" : ""}
            onClick={() => handleRoleChange("Admin")}
          >
            Admin (Operations)
          </button>
        </div>

        <div className="role-hint-card">
          <span className="hint-pill">{role}</span>
          <p>
            {role === "User"
              ? "Reconcile CSV exports, review exceptions, and investigate transaction exposures."
              : "Manage workspace user accounts, perform security resets, and monitor team reconciliation activity."}
          </p>
          <button
            type="button"
            className="demo-autofill-btn"
            onClick={fillDemoCredentials}
            title="Pre-populate demo credentials"
          >
            ⚡ Quick fill demo {role.toLowerCase()}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input
              name="username"
              type="text"
              autoComplete="username"
              placeholder={role === "Admin" ? "e.g. admin" : "e.g. analyst"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label>
            <span style={{ display: "flex", justifyContent: "space-between" }}>
              Password
              <button
                type="button"
                className="toggle-pwd-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="primary-button login-submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : `Sign in as ${role}`}
          </button>
        </form>

        <div className="login-footer-links">
          <Link className="reset-link" href="/reset-password">
            Forgot or reset password?
          </Link>
          <span className="divider-dot">•</span>
          <Link className="guest-link" href="/">
            Enter as guest
          </Link>
        </div>

        <p className="login-hint">
          {role === "User"
            ? "First time? Click 'Quick fill' or ask your administrator to provision your account."
            : "Default admin credentials: admin / admin123."}
        </p>
      </section>
    </main>
  );
}

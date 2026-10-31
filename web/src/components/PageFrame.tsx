"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentSession, saveSession, type UserSession } from "@/lib/auth";

export default function PageFrame({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const checkSession = () => {
      setSession(getCurrentSession());
    };
    const timer = window.setTimeout(checkSession, 0);
    window.addEventListener("storage", checkSession);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", checkSession);
    };
  }, []);

  function handleSignOut() {
    saveSession(null);
    router.push("/login");
  }

  const links = [
    ["/", "◈", "Home"],
    ["/reconcile", "＋", "Reconciliation"],
    ["/queue", "◒", "Investigation queue"],
    ["/root-causes", "⌁", "Root causes"],
    ["/admin", "♙", "User & Activity"],
  ];

  const displayName = session?.username ?? "Shourya Singh";
  const displayRole = session?.role ?? "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">L</span>
          <span>LedgerLens</span>
        </div>

        <div className="workspace-switcher">
          <span className="workspace-avatar">AC</span>
          <span>
            <b>Acme Finance</b>
            <small>Operations workspace</small>
          </span>
          <span className="chevron">⌄</span>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {links.map(([href, icon, label]) => (
            <Link
              className={`nav-item ${pathname === href ? "active" : ""}`}
              href={href}
              key={href}
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link className="nav-item" href="/login">
            <span>⎋</span> Switch / Sign in
          </Link>

          <div className="profile">
            <span className="profile-avatar">{initials}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayName}
              </b>
              <small>{displayRole}</small>
            </div>
            {session ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="signout-link-btn"
                title="Sign out"
              >
                Sign out
              </button>
            ) : (
              <Link href="/login" className="signout-link-btn" title="Sign in">
                Login
              </Link>
            )}
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">LEDGERLENS WORKSPACE</div>
            <h1>{title}</h1>
          </div>

          <div className="top-actions">
            <span className="live-pill">
              <span className="live-dot" /> Exasol connected
            </span>
            <span className={`role-header-pill ${displayRole.toLowerCase()}`}>
              {displayRole}
            </span>
            <Link href="/login" className="portal-switch-pill" title="Switch Portal">
              Portal ▾
            </Link>
            <button type="button" className="help-button" aria-label="Help">
              ?
            </button>
          </div>
        </header>

        <div className="page-intro route-intro">
          <div>
            <p className="eyebrow accent">{eyebrow}</p>
            <h2>{description}</h2>
          </div>
        </div>

        {children}

        <footer className="footer">
          <span>
            <span className="footer-dot" /> All systems operational
          </span>
          <span>Data refreshed 2 minutes ago · Powered by Exasol</span>
        </footer>
      </section>
    </main>
  );
}

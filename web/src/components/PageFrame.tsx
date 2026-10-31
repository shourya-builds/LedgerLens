"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

export default function PageFrame({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children: ReactNode }) {
  const pathname = usePathname();
  const links = [
    ["/", "◈", "Home"],
    ["/reconcile", "＋", "New reconciliation"],
    ["/queue", "◒", "Investigation queue"],
    ["/root-causes", "⌁", "Root causes"],
  ];
  return <main className="shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">L</span><span>LedgerLens</span></div><div className="workspace-switcher"><span className="workspace-avatar">AC</span><span><b>Acme Finance</b><small>Operations workspace</small></span><span className="chevron">⌄</span></div><nav className="nav-list" aria-label="Main navigation">{links.map(([href, icon, label]) => <Link className={`nav-item ${pathname === href ? "active" : ""}`} href={href} key={href}><span>{icon}</span>{label}{href === "/queue" && <span className="nav-count">3</span>}</Link>)}</nav><div className="sidebar-bottom"><Link className="nav-item" href="/"><span>⊞</span> Data sources</Link><div className="profile"><span className="profile-avatar">SS</span><span><b>Shourya Singh</b><small>Admin</small></span><span className="chevron">⌄</span></div></div></aside><section className="content"><header className="topbar"><div><div className="eyebrow">LEDGERLENS WORKSPACE</div><h1>{title}</h1></div><div className="top-actions"><span className="live-pill"><span className="live-dot" /> Exasol connected</span><button className="help-button">?</button></div></header><div className="page-intro route-intro"><div><p className="eyebrow accent">{eyebrow}</p><h2>{description}</h2></div></div>{children}<footer className="footer"><span><span className="footer-dot" /> All systems operational</span><span>Data refreshed 2 minutes ago · Powered by Exasol</span></footer></section></main>;
}

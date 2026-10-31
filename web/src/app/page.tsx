"use client";

import { useMemo, useState } from "react";

type Issue = { id: string; title: string; source: string; amount: string; priority: "Critical" | "High" | "Medium" | "Low"; score: number; explanation: string; action: string };

const issues: Issue[] = [
  { id: "LL-1004", title: "Ledger posting missing", source: "Bank → Ledger", amount: "₹75,000", priority: "Critical", score: 94, explanation: "A high-value bank transaction has no corresponding ledger entry. The source record is valid and the amount is outside the normal daily range for this counterparty.", action: "Check the ERP posting queue and confirm whether the transaction failed during ingestion." },
  { id: "LL-1005", title: "Ledger-only transaction", source: "Ledger → Bank", amount: "₹4,500", priority: "Medium", score: 61, explanation: "The ledger contains a transaction that is not present in the bank export for this reconciliation window.", action: "Confirm whether this is an accrual, a delayed bank settlement, or an incorrect ledger posting." },
  { id: "LL-1003", title: "Settlement timing drift", source: "Bank ↔ Ledger", amount: "₹1,000", priority: "Low", score: 32, explanation: "The amount is within rounding tolerance, but the ledger date is one day after the bank transaction date.", action: "Review the settlement cut-off time and keep the item open until the next bank file arrives." },
];

const rootCauses = [
  { label: "Missing ERP posting", count: 1, value: "₹75,000", color: "#ef8354" },
  { label: "Settlement timing", count: 1, value: "₹1,000", color: "#e6b85c" },
  { label: "Ledger-only entry", count: 1, value: "₹4,500", color: "#6a8caf" },
];

export default function Home() {
  const [selectedId, setSelectedId] = useState("LL-1004");
  const [filter, setFilter] = useState("All issues");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [runState, setRunState] = useState<"idle" | "running" | "complete">("idle");
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [liveIssues, setLiveIssues] = useState(issues);
  const [stats, setStats] = useState({ total: 8, matched: 6, exceptions: 3, atRisk: 79500 });
  const selected = liveIssues.find((issue) => issue.id === selectedId) ?? liveIssues[0] ?? issues[0];
  const filteredIssues = useMemo(() => liveIssues.filter((issue) => (filter === "All issues" || issue.priority === filter) && `${issue.id} ${issue.title} ${issue.source}`.toLowerCase().includes(search.toLowerCase())), [filter, search, liveIssues]);

  async function startReconciliation() {
    setRunState("running");
    const form = new FormData();
    if (bankFile && ledgerFile) {
      form.append("bank", bankFile);
      form.append("ledger", ledgerFile);
    } else {
      const bank = new File(["transaction_id,transaction_date,amount,currency\nTXN-1004,2026-10-03,75000,INR"], "bank.csv", { type: "text/csv" });
      const ledger = new File(["transaction_id,transaction_date,amount,currency\nTXN-1005,2026-10-03,4500,INR"], "ledger.csv", { type: "text/csv" });
      form.append("bank", bank);
      form.append("ledger", ledger);
    }
    const response = await fetch("/api/reconciliation", { method: "POST", body: form });
    if (response.ok) {
      const data = await response.json();
      setLiveIssues(data.issues);
      setStats(data.stats);
      setSelectedId(data.issues[0]?.id ?? "");
    }
    setRunState("complete");
  }

  return (
    <main className="shell">
      <aside className="sidebar"><div className="brand"><span className="brand-mark">L</span><span>LedgerLens</span></div><div className="workspace-switcher"><span className="workspace-avatar">AC</span><span><b>Acme Finance</b><small>Operations workspace</small></span><span className="chevron">⌄</span></div><nav className="nav-list" aria-label="Main navigation"><a className="nav-item active" href="#overview"><span>◈</span> Overview</a><a className="nav-item" href="#queue"><span>◒</span> Investigation queue <span className="nav-count">3</span></a><a className="nav-item" href="#root-causes"><span>⌁</span> Root causes</a><a className="nav-item" href="#sources"><span>⊞</span> Data sources</a></nav><div className="sidebar-bottom"><a className="nav-item" href="#settings"><span>⚙</span> Settings</a><div className="profile"><span className="profile-avatar">SS</span><span><b>Shourya Singh</b><small>Admin</small></span><span className="chevron">⌄</span></div></div></aside>
      <section className="content">
        <header className="topbar"><div><div className="eyebrow">FRIDAY, OCTOBER 31, 2026</div><h1>Good morning, Shourya</h1></div><div className="top-actions"><span className="live-pill"><span className="live-dot" /> Exasol connected</span><button className="icon-button" aria-label="Notifications">♢<span className="notification-dot" /></button><button className="help-button">?</button></div></header>
        <div className="page-intro"><div><p className="eyebrow accent">RECONCILIATION OVERVIEW</p><h2>Find what needs your attention.</h2><p className="subtitle">LedgerLens has reviewed 8 records across your bank and ledger sources.</p></div><button className="primary-button" onClick={() => setModalOpen(true)}>＋ New reconciliation</button></div>
        <div className="metric-grid" id="overview"><Metric label="Match rate" value={`${stats.total ? ((stats.matched / stats.total) * 100).toFixed(1) : "0.0"}%`} change="Live result" tone="good" detail={`${stats.matched} of ${stats.total} records matched`} icon="✓" /><Metric label="Amount at risk" value={`₹${stats.atRisk.toLocaleString("en-IN")}`} change="Needs review" tone="warn" detail={`Across ${stats.exceptions} unresolved issues`} icon="₹" /><Metric label="Open issues" value={`${stats.exceptions}`} change={stats.exceptions ? "Review needed" : "Clear"} tone="bad" detail="Prioritized by financial impact" icon="!" /><Metric label="Last run" value={runState === "complete" ? "Just now" : "2m ago"} change="Healthy" tone="neutral" detail="Demo batch · 31 Oct 2026" icon="↻" /></div>
        <div className="main-grid"><section className="card queue-card" id="queue"><div className="card-heading"><div><h3>Investigation queue</h3><p>Start with the issues that carry the most financial exposure.</p></div><div className="queue-tools"><input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issues" aria-label="Search issues" /><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter issues"><option>All issues</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div></div><div className="table-wrap"><table><thead><tr><th>Issue</th><th>Source flow</th><th>Priority</th><th>Amount at risk</th><th>Score</th><th /></tr></thead><tbody>{filteredIssues.map((issue) => <tr key={issue.id} className={selectedId === issue.id ? "selected-row" : ""} onClick={() => { setSelectedId(issue.id); setDrawerOpen(true); }}><td><div className="issue-cell"><span className={`issue-icon ${issue.priority.toLowerCase()}`}>{issue.priority === "Critical" ? "!" : "↗"}</span><span><b>{issue.title}</b><small>{issue.id}</small></span></div></td><td>{issue.source}</td><td><span className={`priority ${issue.priority.toLowerCase()}`}>{issue.priority}</span></td><td className="amount">{issue.amount}</td><td><div className="score"><span className="score-bar"><span style={{ width: `${issue.score}%` }} /></span>{issue.score}</div></td><td className="row-arrow">›</td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing {filteredIssues.length} of 3 open issues</span><a href="#queue">View all issues <span>→</span></a></div></section>
          <section className="card health-card"><div className="card-heading"><div><h3>Reconciliation health</h3><p>Current batch performance</p></div><span className="period">This week⌄</span></div><div className="health-chart"><div className="donut"><div><strong>75%</strong><small>matched</small></div></div><div className="chart-legend"><Legend color="#5fb286" label="Matched" value="6" /><Legend color="#ef8354" label="Exceptions" value="2" /><Legend color="#e5e8ed" label="Total records" value="8" /></div></div><div className="mini-trend"><div><span>Exception trend</span><b>↓ 18%</b></div><div className="bars">{[30, 48, 34, 62, 45, 38, 24].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div><div className="days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></div></div></section></div>
        <div className="lower-grid"><section className="card root-card" id="root-causes"><div className="card-heading"><div><h3>Root-cause groups</h3><p>Related exceptions, grouped for faster resolution.</p></div><a className="text-link" href="#root-causes">See analysis →</a></div><div className="root-list">{rootCauses.map((root) => <div className="root-row" key={root.label}><span className="root-bullet" style={{ background: root.color }} /><span className="root-label"><b>{root.label}</b><small>{root.count} affected transaction</small></span><span className="root-value">{root.value}</span><span className="row-arrow">›</span></div>)}</div></section><section className="card detail-card"><div className="card-heading"><div><p className="eyebrow accent">SELECTED ISSUE</p><h3>{selected.title}</h3></div><span className={`priority ${selected.priority.toLowerCase()}`}>{selected.priority}</span></div><div className="detail-amount"><span>Amount at risk</span><strong>{selected.amount}</strong></div><p className="detail-copy">{selected.explanation}</p><div className="detail-action"><span className="action-icon">⌁</span><span><small>Recommended next action</small><b>{selected.action}</b></span></div><button className="secondary-button" onClick={() => setDrawerOpen(true)}>Open investigation <span>→</span></button></section></div>
        {drawerOpen && <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}><aside className="drawer" onClick={(event) => event.stopPropagation()}><button className="drawer-close" onClick={() => setDrawerOpen(false)}>×</button><p className="eyebrow accent">INVESTIGATION {selected.id}</p><h2>{selected.title}</h2><span className={`priority ${selected.priority.toLowerCase()}`}>{selected.priority} priority</span><div className="drawer-amount"><small>Amount at risk</small><strong>{selected.amount}</strong></div><h4>What we found</h4><p>{selected.explanation}</p><h4>Recommended action</h4><div className="drawer-action">{selected.action}</div><button className="primary-button drawer-button" onClick={() => setDrawerOpen(false)}>Mark for review</button></aside></div>}
        {modalOpen && <div className="modal-backdrop" onClick={() => setModalOpen(false)}><div className="modal" onClick={(event) => event.stopPropagation()}><button className="drawer-close" onClick={() => setModalOpen(false)}>×</button><p className="eyebrow accent">NEW RECONCILIATION</p><h2>Bring two sources together.</h2><p className="modal-copy">Upload your bank and ledger exports to create a new investigation batch.</p><div className="upload-grid"><label className="upload-box"><span>↑</span><b>{bankFile?.name ?? "Bank export"}</b><small>CSV up to 20 MB</small><input type="file" accept=".csv" onChange={(event) => setBankFile(event.target.files?.[0] ?? null)} /></label><label className="upload-box"><span>↑</span><b>{ledgerFile?.name ?? "Ledger export"}</b><small>CSV up to 20 MB</small><input type="file" accept=".csv" onChange={(event) => setLedgerFile(event.target.files?.[0] ?? null)} /></label></div><button className="primary-button modal-button" onClick={startReconciliation} disabled={runState === "running"}>{runState === "idle" ? "Run reconciliation" : runState === "running" ? "Analyzing records…" : "Batch created ✓"}</button>{runState === "complete" && <p className="success-note">Batch ready. {stats.exceptions} issues were added to your investigation queue.</p>}</div></div>}
        <footer className="footer"><span><span className="footer-dot" /> All systems operational</span><span>Data refreshed 2 minutes ago · Powered by Exasol</span></footer>
      </section>
    </main>
  );
}

function Metric({ label, value, change, tone, detail, icon }: { label: string; value: string; change: string; tone: string; detail: string; icon: string }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-top"><span>{label}</span><span className={`metric-change ${tone}`}>{change}</span></div><strong>{value}</strong><small>{detail}</small></div>; }
function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="legend-item"><span className="legend-dot" style={{ background: color }} /><span>{label}</span><b>{value}</b></div>; }

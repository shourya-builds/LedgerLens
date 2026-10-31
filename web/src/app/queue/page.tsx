"use client";

import { useEffect, useMemo, useState } from "react";
import PageFrame from "@/components/PageFrame";
import { demoResult, loadLatestResult } from "@/lib/reconciliation";

export default function QueuePage() {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("All");
  const [latest, setLatest] = useState(demoResult);
  useEffect(() => {
    const refresh = () => setLatest(loadLatestResult());
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const issues = latest.issues;

  const filtered = useMemo(() => issues.filter((issue) => (priority === "All" || issue.priority === priority) && `${issue.id} ${issue.title} ${issue.source}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.risk - a.risk), [issues, priority, query]);

  return <PageFrame title="Investigation queue" eyebrow="INVESTIGATE WITH CONFIDENCE" description="Every exception, ranked by the financial impact it carries."><section className="card route-card"><div className="card-heading"><div><h3>Open issues</h3><p>Review the highest-exposure problems first.</p></div><div className="queue-tools"><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issues" /><select value={priority} onChange={(event) => setPriority(event.target.value)}><option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div></div><div className="table-wrap"><table><thead><tr><th>Issue</th><th>Source flow</th><th>Priority</th><th>Amount at risk</th><th>Score</th><th /></tr></thead><tbody>{filtered.map((issue) => <tr key={issue.id}><td><div className="issue-cell"><span className={`issue-icon ${issue.priority.toLowerCase()}`}>{issue.priority === "Critical" ? "!" : "↗"}</span><span><b>{issue.title}</b><small>{issue.id}</small></span></div></td><td>{issue.source}</td><td><span className={`priority ${issue.priority.toLowerCase()}`}>{issue.priority}</span></td><td className="amount">{issue.amount}</td><td><div className="score"><span className="score-bar"><span style={{ width: `${issue.score}%` }} /></span>{issue.score}</div></td><td className="row-arrow">›</td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing {filtered.length} of {issues.length} open issues</span><span>Sorted by amount at risk</span></div></section></PageFrame>;
}

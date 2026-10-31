"use client";

import { useMemo, useState } from "react";
import PageFrame from "@/components/PageFrame";

const issues = [
  ["LL-1004", "Ledger posting missing", "Bank → Ledger", "₹75,000", "Critical", "94"],
  ["LL-1005", "Ledger-only transaction", "Ledger → Bank", "₹4,500", "Medium", "61"],
  ["LL-1003", "Settlement timing drift", "Bank ↔ Ledger", "₹1,000", "Low", "32"],
];

export default function QueuePage() {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("All");
  const filtered = useMemo(() => issues.filter((issue) => (priority === "All" || issue[4] === priority) && issue.join(" ").toLowerCase().includes(query.toLowerCase())), [priority, query]);
  return <PageFrame title="Investigation queue" eyebrow="INVESTIGATE WITH CONFIDENCE" description="Every exception, ranked by the financial impact it carries."><section className="card route-card"><div className="card-heading"><div><h3>Open issues</h3><p>Review the highest-exposure problems first.</p></div><div className="queue-tools"><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issues" /><select value={priority} onChange={(event) => setPriority(event.target.value)}><option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div></div><div className="table-wrap"><table><thead><tr><th>Issue</th><th>Source flow</th><th>Priority</th><th>Amount at risk</th><th>Score</th><th /></tr></thead><tbody>{filtered.map((issue) => <tr key={issue[0]}><td><div className="issue-cell"><span className={`issue-icon ${issue[4].toLowerCase()}`}>{issue[4] === "Critical" ? "!" : "↗"}</span><span><b>{issue[1]}</b><small>{issue[0]}</small></span></div></td><td>{issue[2]}</td><td><span className={`priority ${issue[4].toLowerCase()}`}>{issue[4]}</span></td><td className="amount">{issue[3]}</td><td><div className="score"><span className="score-bar"><span style={{ width: `${issue[5]}%` }} /></span>{issue[5]}</div></td><td className="row-arrow">›</td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing {filtered.length} of {issues.length} open issues</span><span>Sorted by amount at risk</span></div></section></PageFrame>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import PageFrame from "@/components/PageFrame";
import { demoResult, loadLatestResult } from "@/lib/reconciliation";

const colors = ["#ef8354", "#e6b85c", "#6a8caf", "#8d79a8"];

export default function RootCausesPage() {
  const [result, setResult] = useState(demoResult);
  useEffect(() => {
    const refresh = () => setResult(loadLatestResult());
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const groups = useMemo(() => result.issues.slice().sort((a, b) => b.risk - a.risk).map((issue, index) => ({ ...issue, color: colors[index % colors.length] })), [result]);
  const topCause = groups[0];

  return <PageFrame title="Root-cause groups" eyebrow="SEE THE PATTERN" description="Turn individual exceptions into operational fixes."><div className="root-summary"><div className="card root-stat"><small>Groups found</small><strong>{groups.length}</strong><span>Across {result.stats.exceptions} open issues</span></div><div className="card root-stat"><small>Exposure explained</small><strong>₹{result.stats.atRisk.toLocaleString("en-IN")}</strong><span>Grouped financial impact</span></div><div className="card root-stat"><small>Top cause</small><strong>{topCause?.title ?? "None"}</strong><span>{topCause ? `${Math.round((topCause.risk / Math.max(result.stats.atRisk, 1)) * 100)}% of exposed value` : "No active issues"}</span></div></div><section className="cause-grid">{groups.map((group) => <article className="card cause-card" key={group.id}><span className="cause-dot" style={{ background: group.color }} /><div className="cause-top"><span className="eyebrow accent">ROOT CAUSE</span><span className="row-arrow">›</span></div><h3>{group.title}</h3><p>{group.explanation}</p><div className="cause-meta"><span>{group.id}</span><strong>{group.amount}</strong></div><div className="cause-action"><small>Recommended next action</small><b>{group.action}</b></div></article>)}</section></PageFrame>;
}

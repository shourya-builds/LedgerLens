import PageFrame from "@/components/PageFrame";

const groups = [
  { title: "Missing ERP posting", description: "A bank record has no corresponding accounting entry.", count: "1 transaction", value: "₹75,000", color: "#ef8354", action: "Check the ERP posting queue and ingestion logs." },
  { title: "Settlement timing", description: "A ledger date trails the source settlement date.", count: "1 transaction", value: "₹1,000", color: "#e6b85c", action: "Review the settlement cut-off and next bank file." },
  { title: "Ledger-only entry", description: "An accounting record has no matching bank transaction.", count: "1 transaction", value: "₹4,500", color: "#6a8caf", action: "Confirm whether this is an accrual or incorrect posting." },
];

export default function RootCausesPage() {
  return <PageFrame title="Root-cause groups" eyebrow="SEE THE PATTERN" description="Turn individual exceptions into operational fixes."><div className="root-summary"><div className="card root-stat"><small>Groups found</small><strong>3</strong><span>Across 3 open issues</span></div><div className="card root-stat"><small>Exposure explained</small><strong>₹80,500</strong><span>Grouped financial impact</span></div><div className="card root-stat"><small>Top cause</small><strong>ERP posting</strong><span>93% of exposed value</span></div></div><section className="cause-grid">{groups.map((group) => <article className="card cause-card" key={group.title}><span className="cause-dot" style={{ background: group.color }} /><div className="cause-top"><span className="eyebrow accent">ROOT CAUSE</span><span className="row-arrow">›</span></div><h3>{group.title}</h3><p>{group.description}</p><div className="cause-meta"><span>{group.count}</span><strong>{group.value}</strong></div><div className="cause-action"><small>Recommended next action</small><b>{group.action}</b></div></article>)}</section></PageFrame>;
}

import Link from "next/link";
import PageFrame from "@/components/PageFrame";

const actions = [
  { icon: "＋", label: "Start reconciliation", description: "Upload two exports and compare them in seconds.", href: "/reconcile", tone: "teal" },
  { icon: "◒", label: "Review investigation queue", description: "Open exceptions ranked by financial exposure.", href: "/queue", tone: "orange" },
  { icon: "⌁", label: "Explore root causes", description: "See the operational patterns behind the issues.", href: "/root-causes", tone: "blue" },
];

export default function Home() {
  return <PageFrame title="Command center" eyebrow="LEDGERLENS HOME" description="Keep the next financial decision moving.">
    <section className="home-hero card"><div><span className="hero-kicker">READY FOR YOUR NEXT BATCH</span><h3>Turn financial noise into your next clear action.</h3><p>Upload your bank and ledger exports, then let LedgerLens surface the exceptions that deserve attention first.</p><Link className="primary-button hero-button" href="/reconcile">Start a reconciliation <span>→</span></Link></div><div className="hero-illustration"><span className="hero-orbit orbit-one" /><span className="hero-orbit orbit-two" /><span className="hero-core">L</span></div></section>
    <section className="home-section"><div className="section-heading"><div><p className="eyebrow accent">WORKFLOWS</p><h3>What do you want to do?</h3></div><span className="muted-note">Choose a starting point</span></div><div className="action-grid">{actions.map((action) => <Link className="action-card" href={action.href} key={action.label}><span className={`action-tile ${action.tone}`}>{action.icon}</span><span className="action-copy"><b>{action.label}</b><small>{action.description}</small></span><span className="action-arrow">→</span></Link>)}</div></section>
    <div className="home-bottom"><section className="card status-card"><div className="section-heading"><div><p className="eyebrow accent">SYSTEM STATUS</p><h3>Everything is ready.</h3></div><span className="status-ready"><span className="live-dot" /> Healthy</span></div><div className="status-list"><div><span>Analytical database</span><b>Exasol connected</b></div><div><span>Reconciliation API</span><b>Ready for uploads</b></div><div><span>Last processed batch</span><b>Demo batch · 2 minutes ago</b></div></div></section><section className="card activity-card"><div className="section-heading"><div><p className="eyebrow accent">RECENT ACTIVITY</p><h3>What happened recently</h3></div><Link className="text-link" href="/queue">Open queue →</Link></div><div className="activity-list"><div><span className="activity-dot orange" /><span><b>3 issues added to investigation queue</b><small>From the latest uploaded batch</small></span><time>2m</time></div><div><span className="activity-dot green" /><span><b>8 records processed successfully</b><small>Bank and ledger sources completed</small></span><time>2m</time></div></div></section></div>
  </PageFrame>;
}

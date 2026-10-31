"use client";

import Link from "next/link";
import { useState } from "react";
import PageFrame from "@/components/PageFrame";

type ReconciliationResult = {
  issues: Array<{ id: string; title: string; amount: string; priority: string; explanation: string }>;
  stats: { total: number; matched: number; exceptions: number; atRisk: number };
};

export default function ReconcilePage() {
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  async function runReconciliation() {
    if (!bankFile || !ledgerFile) {
      setError("Choose both a bank CSV and a ledger CSV before running reconciliation.");
      return;
    }
    setError("");
    setRunning(true);
    const form = new FormData();
    form.append("bank", bankFile);
    form.append("ledger", ledgerFile);
    const response = await fetch("/api/reconciliation", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Reconciliation could not be completed.");
    else setResult(data);
    setRunning(false);
  }

  const matchRate = result ? ((result.stats.matched / result.stats.total) * 100).toFixed(1) : "—";

  return <PageFrame title="New reconciliation" eyebrow="UPLOAD AND COMPARE" description="Bring two financial sources together in one investigation batch.">
    <section className="card upload-workspace"><div className="upload-intro"><span className="upload-badge">1</span><div><h3>Choose your exports</h3><p>Upload a CSV from your bank and a corresponding ledger CSV. LedgerLens matches transaction IDs and highlights the records that need attention.</p></div></div><div className="upload-grid reconcile-upload-grid"><label className={`upload-box file-ready-${Boolean(bankFile)}`}><span>↑</span><b>{bankFile?.name ?? "Bank export"}</b><small>{bankFile ? "Ready to reconcile" : "CSV up to 20 MB"}</small><input type="file" accept=".csv" onChange={(event) => setBankFile(event.target.files?.[0] ?? null)} /></label><label className={`upload-box file-ready-${Boolean(ledgerFile)}`}><span>↑</span><b>{ledgerFile?.name ?? "Ledger export"}</b><small>{ledgerFile ? "Ready to reconcile" : "CSV up to 20 MB"}</small><input type="file" accept=".csv" onChange={(event) => setLedgerFile(event.target.files?.[0] ?? null)} /></label></div>{error && <p className="form-error">{error}</p>}<button className="primary-button run-button" onClick={runReconciliation} disabled={running}>{running ? "Analyzing records…" : "Run reconciliation"}<span>→</span></button></section>
    {result && <section className="result-section"><div className="section-heading"><div><p className="eyebrow accent">BATCH COMPLETE</p><h3>Your reconciliation result</h3></div><Link className="text-link" href="/queue">Open investigation queue →</Link></div><div className="result-metrics"><div className="card"><small>Match rate</small><strong>{matchRate}%</strong><span>{result.stats.matched} of {result.stats.total} records matched</span></div><div className="card"><small>Open issues</small><strong>{result.stats.exceptions}</strong><span>Ready for investigation</span></div><div className="card"><small>Amount at risk</small><strong>₹{result.stats.atRisk.toLocaleString("en-IN")}</strong><span>Across unresolved records</span></div></div><section className="card result-issues"><h3>Issues found</h3>{result.issues.length ? result.issues.map((issue) => <div className="result-row" key={issue.id}><span><b>{issue.title}</b><small>{issue.id} · {issue.explanation}</small></span><span className="amount">{issue.amount}</span><span className={`priority ${issue.priority.toLowerCase()}`}>{issue.priority}</span></div>) : <p className="all-clear">No exceptions found. Your sources are reconciled.</p>}</section></section>}
  </PageFrame>;
}

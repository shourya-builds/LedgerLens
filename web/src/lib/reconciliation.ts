export type LedgerIssue = {
  id: string;
  title: string;
  source: string;
  amount: string;
  risk: number;
  priority: "Critical" | "High" | "Medium" | "Low";
  score: number;
  explanation: string;
  action: string;
};

export type ReconciliationResult = {
  issues: LedgerIssue[];
  stats: { total: number; matched: number; exceptions: number; atRisk: number };
};

export const reconciliationStorageKey = "ledgerlens-latest-result";

export const demoIssues: LedgerIssue[] = [
  { id: "LL-1004", title: "Ledger posting missing", source: "Bank → Ledger", amount: "₹75,000", risk: 75000, priority: "Critical", score: 94, explanation: "A high-value bank transaction has no corresponding ledger entry.", action: "Check the ERP posting queue and confirm whether the transaction failed during ingestion." },
  { id: "LL-1005", title: "Ledger-only transaction", source: "Ledger → Bank", amount: "₹4,500", risk: 4500, priority: "Medium", score: 61, explanation: "The ledger contains a transaction that is not present in the bank export.", action: "Confirm whether this is an accrual, a delayed bank settlement, or an incorrect ledger posting." },
  { id: "LL-1003", title: "Settlement timing drift", source: "Bank ↔ Ledger", amount: "₹1,000", risk: 1000, priority: "Low", score: 32, explanation: "The amount is within tolerance, but dates differ between source systems.", action: "Review the settlement cut-off time and keep the item open until the next bank file arrives." },
];

export const demoResult: ReconciliationResult = { issues: demoIssues, stats: { total: 8, matched: 5, exceptions: 3, atRisk: 80500 } };

let cachedSerializedResult: string | null = null;
let cachedResult: ReconciliationResult = demoResult;

export function loadLatestResult(): ReconciliationResult {
  if (typeof window === "undefined") return demoResult;
  try {
    const stored = window.localStorage.getItem(reconciliationStorageKey);
    if (!stored) return demoResult;
    if (stored === cachedSerializedResult) return cachedResult;
    const parsed = JSON.parse(stored) as ReconciliationResult;
    if (!Array.isArray(parsed.issues) || !parsed.stats) return demoResult;
    cachedSerializedResult = stored;
    cachedResult = parsed;
    return cachedResult;
  } catch {
    return demoResult;
  }
}

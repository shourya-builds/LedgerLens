import { NextResponse } from "next/server";

type CsvRow = Record<string, string>;
type ResultIssue = {
  id: string;
  title: string;
  source: string;
  amount: string;
  risk: number;
  priority: "Critical" | "High" | "Medium";
  score: number;
  explanation: string;
  action: string;
};

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function field(row: CsvRow, keys: string[]) {
  const key = keys.find((candidate) => row[candidate] !== undefined);
  return key ? row[key] : "";
}

function transactionId(row: CsvRow) {
  return field(row, ["transaction_id", "id", "txn_id", "reference"]);
}

function amount(row: CsvRow) {
  return Number(field(row, ["amount", "value", "transaction_amount"]).replace(/[^0-9.-]/g, "")) || 0;
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const bank = form.get("bank");
  const ledger = form.get("ledger");
  if (!(bank instanceof File) || !(ledger instanceof File)) return NextResponse.json({ error: "Upload both a bank and ledger CSV." }, { status: 400 });

  const [bankText, ledgerText] = await Promise.all([bank.text(), ledger.text()]);
  const primary = parseCsv(bankText);
  const comparison = parseCsv(ledgerText);
  const comparisonById = new Map(comparison.map((row) => [transactionId(row), row]));
  const primaryIds = new Set(primary.map(transactionId));
  const issues: ResultIssue[] = [];

  for (const row of primary) {
    const id = transactionId(row);
    const match = comparisonById.get(id);
    if (!match) {
      const risk = amount(row);
      issues.push({ id: `LL-${id || "MISSING"}`, title: "Ledger posting missing", source: "Bank → Ledger", amount: money(risk), risk, priority: risk >= 50000 ? "Critical" : "High", score: risk >= 50000 ? 94 : 78, explanation: `The bank export contains ${id || "an unidentified transaction"}, but the ledger has no matching record.`, action: "Check the ERP posting queue and confirm whether the transaction failed during ingestion." });
      continue;
    }
    const difference = Math.abs(amount(row) - amount(match));
    if (difference > 0.01) {
      issues.push({ id: `LL-${id}`, title: "Amount mismatch", source: "Bank ↔ Ledger", amount: money(difference), risk: difference, priority: difference >= 1000 ? "High" : "Medium", score: difference >= 1000 ? 82 : 55, explanation: `The records share transaction ID ${id}, but their amounts differ by ${money(difference)}.`, action: "Review fees, rounding, or currency conversion applied between the two systems." });
    }
  }

  for (const row of comparison) {
    const id = transactionId(row);
    if (!primaryIds.has(id)) {
      const risk = amount(row);
      issues.push({ id: `LL-${id || "LEDGER"}`, title: "Ledger-only transaction", source: "Ledger → Bank", amount: money(risk), risk, priority: "Medium", score: 61, explanation: `The ledger contains ${id || "a transaction"}, but the bank export has no matching record for this window.`, action: "Confirm whether this is an accrual, delayed bank settlement, or incorrect ledger posting." });
    }
  }

  const total = primary.length + comparison.length;
  const atRisk = issues.reduce((sum, issue) => sum + issue.risk, 0);
  return NextResponse.json({ issues, stats: { total, matched: Math.max(0, total - issues.length), exceptions: issues.length, atRisk } });
}

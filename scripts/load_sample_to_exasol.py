from __future__ import annotations

import sys
from pathlib import Path
from uuid import uuid4

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from ledgerlens.exasol import connect, initialize_schema, load_reconciliation
from ledgerlens.reconcile import normalize_frame, prioritize, reconcile


def main() -> None:
    sample_dir = ROOT / "data" / "sample"
    bank = normalize_frame(pd.read_csv(sample_dir / "bank.csv"), "bank")
    ledger = normalize_frame(pd.read_csv(sample_dir / "ledger.csv"), "ledger")
    results = prioritize(reconcile(bank, ledger))
    batch_id = uuid4().hex[:12]
    connection = connect()
    try:
        initialize_schema(connection)
        load_reconciliation(connection, pd.concat([bank, ledger], ignore_index=True), results, batch_id)
    finally:
        connection.close()
    print(f"Loaded batch {batch_id}: {len(bank) + len(ledger)} normalized records, {len(results)} reconciliation results")


if __name__ == "__main__":
    main()


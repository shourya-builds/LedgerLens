from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import pandas as pd


REQUIRED_COLUMNS = {"transaction_id", "transaction_date", "amount", "currency"}


@dataclass(frozen=True)
class ReconciliationConfig:
    amount_tolerance: float = 0.01
    date_tolerance_days: int = 2


def normalize_frame(frame: pd.DataFrame, source_system: str) -> pd.DataFrame:
    """Normalize a source export into the LedgerLens transaction contract."""
    aliases = {
        "id": "transaction_id",
        "txn_id": "transaction_id",
        "reference": "reference_id",
        "date": "transaction_date",
        "value_date": "settlement_date",
        "merchant": "counterparty",
    }
    result = frame.rename(columns={c: aliases.get(c.lower().strip(), c.lower().strip()) for c in frame.columns}).copy()
    missing = REQUIRED_COLUMNS - set(result.columns)
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")
    result["source_system"] = source_system
    result["transaction_date"] = pd.to_datetime(result["transaction_date"], errors="coerce")
    if "settlement_date" in result:
        result["settlement_date"] = pd.to_datetime(result["settlement_date"], errors="coerce")
    result["amount"] = pd.to_numeric(result["amount"], errors="coerce")
    result["currency"] = result["currency"].astype(str).str.upper()
    result["row_id"] = range(1, len(result) + 1)
    return result


def reconcile(left: pd.DataFrame, right: pd.DataFrame, config: ReconciliationConfig | None = None) -> pd.DataFrame:
    """Perform explainable exact and tolerance matching between two normalized frames."""
    config = config or ReconciliationConfig()
    left = left.reset_index(drop=True).copy()
    right = right.reset_index(drop=True).copy()
    right_by_id = {str(v): i for i, v in enumerate(right["transaction_id"])}
    used: set[int] = set()
    rows: list[dict] = []

    for left_idx, record in left.iterrows():
        tx_id = str(record["transaction_id"])
        match_idx = right_by_id.get(tx_id)
        rule = "exact_transaction_id" if match_idx is not None else None

        if match_idx is None:
            candidates = right[(right["currency"] == record["currency"]) & (~right.index.isin(used))]
            if not candidates.empty:
                deltas = (candidates["amount"] - record["amount"]).abs()
                date_deltas = (candidates["transaction_date"] - record["transaction_date"]).abs().dt.days
                valid = candidates[(deltas <= config.amount_tolerance) & (date_deltas <= config.date_tolerance_days)]
                if not valid.empty:
                    match_idx = int(valid.index[0])
                    rule = "composite_amount_currency_date"

        if match_idx is None:
            status = "missing_from_right"
            right_record = None
            explanation = "No compatible record found in the comparison source."
            amount_difference = None
            date_difference = None
        else:
            right_record = right.loc[match_idx]
            used.add(match_idx)
            amount_difference = round(float(record["amount"] - right_record["amount"]), 2)
            date_difference = int((record["transaction_date"] - right_record["transaction_date"]).days)
            if abs(amount_difference) > config.amount_tolerance:
                status = "amount_mismatch"
                explanation = f"Matched by {rule}, but amount differs by {amount_difference:.2f}."
            elif abs(date_difference) > config.date_tolerance_days:
                status = "timing_mismatch"
                explanation = f"Matched by {rule}, but transaction dates differ by {date_difference} days."
            else:
                status = "matched"
                explanation = f"Matched using {rule}."

        rows.append({
            "left_transaction_id": tx_id,
            "right_transaction_id": None if right_record is None else str(right_record["transaction_id"]),
            "status": status,
            "matching_rule": rule,
            "amount_difference": amount_difference,
            "date_difference_days": date_difference,
            "amount_at_risk": abs(float(record["amount"])) if status != "matched" else 0.0,
            "explanation": explanation,
        })

    for _, record in right.loc[~right.index.isin(used)].iterrows():
        rows.append({
            "left_transaction_id": None,
            "right_transaction_id": str(record["transaction_id"]),
            "status": "missing_from_left",
            "matching_rule": None,
            "amount_difference": None,
            "date_difference_days": None,
            "amount_at_risk": abs(float(record["amount"])),
            "explanation": "Record exists in the comparison source but not in the primary source.",
        })
    return pd.DataFrame(rows)


def prioritize(results: pd.DataFrame) -> pd.DataFrame:
    """Assign a deterministic investigation priority from status and financial impact."""
    result = results.copy()
    result["priority_score"] = result["amount_at_risk"].fillna(0).astype(float)
    result.loc[result["status"].eq("amount_mismatch"), "priority_score"] *= 1.5
    result.loc[result["status"].eq("missing_from_left"), "priority_score"] *= 1.25
    result["priority"] = pd.cut(
        result["priority_score"],
        bins=[-float("inf"), 1000, 10000, 50000, float("inf")],
        labels=["Low", "Medium", "High", "Critical"],
    ).astype(str)
    return result.sort_values(["priority_score", "amount_at_risk"], ascending=False).reset_index(drop=True)


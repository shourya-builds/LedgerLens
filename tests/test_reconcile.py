import pandas as pd

from ledgerlens.reconcile import normalize_frame, prioritize, reconcile


def frame(rows):
    return pd.DataFrame(rows)


def test_exact_match_and_missing_record():
    bank = normalize_frame(frame([
        {"id": "A-1", "date": "2026-10-01", "amount": 100, "currency": "INR"},
        {"id": "A-2", "date": "2026-10-01", "amount": 2500, "currency": "INR"},
    ]), "bank")
    ledger = normalize_frame(frame([
        {"id": "A-1", "date": "2026-10-01", "amount": 100, "currency": "INR"},
    ]), "ledger")
    result = reconcile(bank, ledger)
    assert result["status"].tolist() == ["matched", "missing_from_right"]
    assert result.loc[1, "amount_at_risk"] == 2500


def test_tolerance_match_and_priority():
    left = normalize_frame(frame([{"id": "BANK-9", "date": "2026-10-03", "amount": 999.99, "currency": "INR"}]), "bank")
    right = normalize_frame(frame([{"id": "SETTLE-9", "date": "2026-10-04", "amount": 1000.00, "currency": "INR"}]), "gateway")
    result = prioritize(reconcile(left, right))
    assert result.loc[0, "status"] == "matched"
    assert result.loc[0, "matching_rule"] == "composite_amount_currency_date"


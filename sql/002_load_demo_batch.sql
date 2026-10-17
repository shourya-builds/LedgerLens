INSERT INTO LEDGERLENS.NORMALIZED_TRANSACTIONS
    (TRANSACTION_ID, SOURCE_SYSTEM, TRANSACTION_DATE, AMOUNT, CURRENCY, COUNTERPARTY, DESCRIPTION, INGESTION_BATCH_ID, SOURCE_ROW_ID)
VALUES
    ('TXN-1001', 'bank', DATE '2026-10-01', 12500.00, 'INR', 'Acme Retail', 'Invoice settlement', 'demo-20261017', 'bank-1'),
    ('TXN-1002', 'bank', DATE '2026-10-01', 2500.00, 'INR', 'Northwind', 'Invoice settlement', 'demo-20261017', 'bank-2'),
    ('TXN-1003', 'bank', DATE '2026-10-02', 999.99, 'INR', 'Contoso', 'Card settlement', 'demo-20261017', 'bank-3'),
    ('TXN-1004', 'bank', DATE '2026-10-03', 75000.00, 'INR', 'Globex', 'Large transfer', 'demo-20261017', 'bank-4'),
    ('TXN-1001', 'ledger', DATE '2026-10-01', 12500.00, 'INR', 'Acme Retail', 'Posted invoice', 'demo-20261017', 'ledger-1'),
    ('TXN-1002', 'ledger', DATE '2026-10-01', 2500.00, 'INR', 'Northwind', 'Posted invoice', 'demo-20261017', 'ledger-2'),
    ('TXN-1003', 'ledger', DATE '2026-10-03', 1000.00, 'INR', 'Contoso', 'Settlement with rounding', 'demo-20261017', 'ledger-3'),
    ('TXN-1005', 'ledger', DATE '2026-10-03', 4500.00, 'INR', 'Initech', 'Ledger-only posting', 'demo-20261017', 'ledger-4');

INSERT INTO LEDGERLENS.RECONCILIATION_RESULTS
    (LEFT_TRANSACTION_ID, RIGHT_TRANSACTION_ID, STATUS, MATCHING_RULE, AMOUNT_DIFFERENCE, DATE_DIFFERENCE_DAYS, AMOUNT_AT_RISK, EXPLANATION)
VALUES
    ('TXN-1001', 'TXN-1001', 'matched', 'exact_transaction_id', 0.00, 0, 0.00, 'Matched using exact transaction ID.'),
    ('TXN-1002', 'TXN-1002', 'matched', 'exact_transaction_id', 0.00, 0, 0.00, 'Matched using exact transaction ID.'),
    ('TXN-1003', 'TXN-1003', 'matched', 'composite_amount_currency_date', -0.01, -1, 0.00, 'Matched within amount and date tolerances.'),
    ('TXN-1004', NULL, 'missing_from_right', NULL, NULL, NULL, 75000.00, 'No compatible record found in the comparison source.'),
    (NULL, 'TXN-1005', 'missing_from_left', NULL, NULL, NULL, 4500.00, 'Record exists in the comparison source but not in the primary source.');


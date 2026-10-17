# LedgerLens

Explainable financial reconciliation and anomaly investigation powered by Exasol.

## MVP currently included

- Normalized transaction contract for bank, gateway, ledger, and ERP-style CSV exports
- Exact transaction-ID matching
- Composite amount/currency/date tolerance matching
- Explainable reconciliation statuses and evidence text
- Financial-impact-based investigation prioritization
- Exasol schema for raw, normalized, reconciliation, and investigation data
- Streamlit dashboard with sample data and CSV upload
- Unit tests for the reconciliation engine

## Run locally

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -e ".[dev]"
pytest
streamlit run app.py
```

The dashboard runs with the included sample data even before Exasol is connected. Exasol is the intended analytical source of truth; use `sql/001_schema.sql` to create the MVP schema after the local deployment is available.

To load the included sample batch into Exasol:

```powershell
Copy-Item .env.example .env
# Set EXASOL_PASSWORD in .env, then:
python scripts/load_sample_to_exasol.py
```

## Exasol connection

Copy `.env.example` to `.env` and set the local DSN, user, and password. The next implementation slice will add the loader that writes normalized records and reconciliation results into Exasol.

## Project structure

```text
app.py                         Streamlit dashboard
src/ledgerlens/reconcile.py    Core matching and prioritization logic
src/ledgerlens/exasol.py       Exasol connection and result loader
scripts/load_sample_to_exasol.py  Sample batch loader
sql/001_schema.sql             Exasol tables
data/sample/                   Demo bank and ledger exports
tests/                         Unit tests
```

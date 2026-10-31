# LedgerLens

Explainable financial reconciliation and anomaly investigation powered by Exasol.

## MVP currently included

- Normalized transaction contract for bank, gateway, ledger, and ERP-style CSV exports
- Exact transaction-ID matching
- Composite amount/currency/date tolerance matching
- Explainable reconciliation statuses and evidence text
- Financial-impact-based investigation prioritization
- Exasol schema for raw, normalized, reconciliation, and investigation data
- Next.js web dashboard designed for Vercel deployment
- Unit tests for the reconciliation engine

## Run locally

```powershell
cd web
npm install
npm run dev
```

The web dashboard is available at `http://localhost:3000`.

The dashboard runs with the included sample data even before Exasol is connected. Exasol is the intended analytical source of truth; use `sql/001_schema.sql` to create the MVP schema after the local deployment is available.

To load the included sample batch into Exasol:

```powershell
Copy-Item .env.example .env
# Set EXASOL_PASSWORD in .env, then:
python scripts/load_sample_to_exasol.py
```

For a dependency-free database smoke test, the same demo batch can be loaded with:

```powershell
wsl.exe -d Ubuntu -- bash -lc "exasol connect -k -f /mnt/c/Users/Shourya/Desktop/LedgerLens/sql/002_load_demo_batch.sql"
```

## Exasol connection

Copy `.env.example` to `.env` and set the local DSN, user, and password. The next implementation slice will add the loader that writes normalized records and reconciliation results into Exasol.

## Project structure

```text
web/                           Next.js + TypeScript dashboard for Vercel
src/ledgerlens/reconcile.py    Core matching and prioritization logic
src/ledgerlens/exasol.py       Exasol connection and result loader
scripts/load_sample_to_exasol.py  Sample batch loader
sql/001_schema.sql             Exasol tables
data/sample/                   Demo bank and ledger exports
tests/                         Unit tests
```

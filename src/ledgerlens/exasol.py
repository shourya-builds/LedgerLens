from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

import pandas as pd


@dataclass(frozen=True)
class ExasolConfig:
    dsn: str = "127.0.0.1:8563"
    user: str = "sys"
    password: str = ""
    schema: str = "LEDGERLENS"

    @classmethod
    def from_env(cls) -> "ExasolConfig":
        return cls(
            dsn=os.getenv("EXASOL_DSN", cls.dsn),
            user=os.getenv("EXASOL_USER", cls.user),
            password=os.getenv("EXASOL_PASSWORD", cls.password),
            schema=os.getenv("EXASOL_SCHEMA", cls.schema).upper(),
        )


def connect(config: ExasolConfig | None = None):
    """Open an Exasol connection lazily so local dashboard fallback still works."""
    try:
        import exasol  # type: ignore
    except ImportError as exc:
        raise RuntimeError("Install exa-py before connecting to Exasol.") from exc
    config = config or ExasolConfig.from_env()
    if not config.password:
        raise RuntimeError("EXASOL_PASSWORD is not configured.")
    return exasol.connect(config.dsn, config.user, config.password, encryption=True)


def initialize_schema(connection, schema_file: str | Path | None = None) -> None:
    schema_file = Path(schema_file or Path(__file__).parents[2] / "sql" / "001_schema.sql")
    statements = [statement.strip() for statement in schema_file.read_text().split(";") if statement.strip()]
    for statement in statements:
        connection.execute(statement)


def _sql_literal(value) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "NULL"
    if isinstance(value, pd.Timestamp):
        value = value.strftime("%Y-%m-%d")
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def load_reconciliation(connection, normalized: pd.DataFrame, results: pd.DataFrame, batch_id: str) -> None:
    """Load the normalized source and reconciliation output for a demo batch."""
    connection.execute("TRUNCATE SCHEMA LEDGERLENS CASCADE")
    for _, row in normalized.iterrows():
        values = [
            row.get("transaction_id"), row.get("source_system"), row.get("reference_id"),
            row.get("transaction_date"), row.get("settlement_date"), row.get("amount"),
            row.get("currency"), row.get("counterparty"), row.get("description"),
            batch_id, row.get("row_id"),
        ]
        connection.execute("INSERT INTO LEDGERLENS.NORMALIZED_TRANSACTIONS VALUES (" + ", ".join(_sql_literal(v) for v in values) + ")")
    for _, row in results.iterrows():
        values = [
            row.get("left_transaction_id"), row.get("right_transaction_id"), row.get("status"),
            row.get("matching_rule"), row.get("amount_difference"), row.get("date_difference_days"),
            row.get("amount_at_risk"), row.get("explanation"),
        ]
        connection.execute("INSERT INTO LEDGERLENS.RECONCILIATION_RESULTS (LEFT_TRANSACTION_ID, RIGHT_TRANSACTION_ID, STATUS, MATCHING_RULE, AMOUNT_DIFFERENCE, DATE_DIFFERENCE_DAYS, AMOUNT_AT_RISK, EXPLANATION) VALUES (" + ", ".join(_sql_literal(v) for v in values) + ")")
    connection.commit()


def fetch_summary(connection) -> pd.DataFrame:
    result = connection.execute("SELECT STATUS, COUNT(*) AS ISSUE_COUNT, SUM(AMOUNT_AT_RISK) AS AMOUNT_AT_RISK FROM LEDGERLENS.RECONCILIATION_RESULTS GROUP BY STATUS ORDER BY ISSUE_COUNT DESC")
    return pd.DataFrame(result.fetchall(), columns=[column[0].lower() for column in result.description])


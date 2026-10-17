from pathlib import Path

import pandas as pd
import streamlit as st

from ledgerlens.reconcile import normalize_frame, prioritize, reconcile


st.set_page_config(page_title="LedgerLens", page_icon="🔍", layout="wide")
st.title("🔍 LedgerLens")
st.caption("Explainable financial reconciliation powered by Exasol")

sample_dir = Path(__file__).parent / "data" / "sample"
left_upload = st.sidebar.file_uploader("Primary source (bank)", type="csv")
right_upload = st.sidebar.file_uploader("Comparison source (ledger)", type="csv")

left = pd.read_csv(left_upload) if left_upload else pd.read_csv(sample_dir / "bank.csv")
right = pd.read_csv(right_upload) if right_upload else pd.read_csv(sample_dir / "ledger.csv")

try:
    normalized_left = normalize_frame(left, "primary_source")
    normalized_right = normalize_frame(right, "comparison_source")
    results = prioritize(reconcile(normalized_left, normalized_right))
except ValueError as exc:
    st.error(str(exc))
    st.stop()

matched = int(results["status"].eq("matched").sum())
exceptions = int(len(results) - matched)
at_risk = float(results.loc[results["status"] != "matched", "amount_at_risk"].sum())

metric_a, metric_b, metric_c, metric_d = st.columns(4)
metric_a.metric("Records reviewed", len(results))
metric_b.metric("Match rate", f"{matched / len(results):.0%}" if len(results) else "0%")
metric_c.metric("Exceptions", exceptions)
metric_d.metric("Amount at risk", f"₹{at_risk:,.2f}")

st.subheader("Investigation queue")
st.dataframe(results, use_container_width=True, hide_index=True)

st.subheader("Exception breakdown")
breakdown = results[results["status"] != "matched"]["status"].value_counts().rename_axis("status").reset_index(name="count")
if breakdown.empty:
    st.success("No exceptions found.")
else:
    st.bar_chart(breakdown.set_index("status"))

with st.expander("How LedgerLens explains an issue"):
    example = results[results["status"] != "matched"].head(1)
    if example.empty:
        st.write("All records are currently reconciled.")
    else:
        row = example.iloc[0]
        st.write(f"**{row['priority']} priority** — {row['explanation']}")
        st.write("The queue is ranked by financial exposure, with additional weighting for amount mismatches and missing records.")


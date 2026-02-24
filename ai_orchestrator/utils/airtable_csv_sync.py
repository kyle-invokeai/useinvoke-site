import pandas as pd
from datetime import datetime
import os
import sys
from pyairtable import Table
from dotenv import load_dotenv

def chunked(iterable, size):
    for i in range(0, len(iterable), size):
        yield iterable[i:i + size]

def main():
    load_dotenv()
    AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY") or os.getenv("AIRTABLE_API_TOKEN")
    BASE_ID = os.getenv("AIRTABLE_BASE_ID")

    if not AIRTABLE_API_KEY or not BASE_ID:
        print("❌ Missing AIRTABLE_API_KEY (or AIRTABLE_API_TOKEN) or AIRTABLE_BASE_ID in .env")
        sys.exit(1)

    if len(sys.argv) < 3:
        print("Usage: python -m ai_orchestrator.utils.airtable_csv_sync <TABLE_NAME> <CSV_FILE>")
        sys.exit(1)

    TABLE_NAME = sys.argv[1]
    file_path = sys.argv[2]

    if not os.path.exists(file_path):
        print(f"❌ CSV file not found: {file_path}")
        sys.exit(1)

    df = pd.read_csv(file_path)
    table = Table(AIRTABLE_API_KEY, BASE_ID, TABLE_NAME)

    # Prepare records for batching
    records = []
    unique_field = "Company Name" if "Company Name" in df.columns else df.columns[0]
    for _, row in df.iterrows():
        record_data = {col: row[col] for col in df.columns if pd.notnull(row[col])}
        record_data["_unique_value"] = row[unique_field]
        records.append(record_data)

    batch_size = 10
    total_batches = (len(records) + batch_size - 1) // batch_size

    for idx, batch in enumerate(chunked(records, batch_size), 1):
        to_create = []
        for rec in batch:
            rec_data = rec.copy()
            rec_data.pop("_unique_value", None)
            to_create.append({"fields": rec_data})
        print(f"[INFO] Ingesting batch {idx} of {total_batches}...")
        try:
            if to_create:
                table.api.request(
                    method="POST",
                    endpoint=table.url,
                    json={"records": to_create}
                )
            print(f"[INFO] Batch {idx} of {total_batches} synced successfully.")
        except Exception as e:
            print(f"[ERROR] Batch {idx} of {total_batches} failed: {e}")

if __name__ == "__main__":
    main()

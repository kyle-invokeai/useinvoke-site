import os
import time
import requests
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_TOKEN = os.getenv('AIRTABLE_API_TOKEN')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')
HEADERS = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

DATA_EXPORTS_DIR = 'data_exports'


def get_all_table_names(base_id):
    """Fetch all table names from the Airtable Metadata API."""
    url = f'https://api.airtable.com/v0/meta/bases/{base_id}/tables'
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    tables = response.json().get('tables', [])
    return [(table['id'], table['name']) for table in tables]


def get_all_records_for_table(base_id, table_id):
    """Fetch all records for a table using the standard Airtable API, handling pagination."""
    url = f'https://api.airtable.com/v0/{base_id}/{table_id}'
    all_records = []
    params = {}
    while True:
        response = requests.get(url, headers=HEADERS, params=params)
        response.raise_for_status()
        data = response.json()
        all_records.extend(data.get('records', []))
        offset = data.get('offset')
        if not offset:
            break
        params['offset'] = offset
        time.sleep(0.2)  # Rate limiting
    return all_records


def save_table_to_csv(table_name, records):
    """Save records to a CSV file in the data_exports directory."""
    if not os.path.exists(DATA_EXPORTS_DIR):
        os.makedirs(DATA_EXPORTS_DIR)
    # Flatten records to a list of dicts
    rows = [rec['fields'] for rec in records]
    df = pd.DataFrame(rows)
    csv_path = os.path.join(DATA_EXPORTS_DIR, f"{table_name}.csv")
    df.to_csv(csv_path, index=False)
    return csv_path

def save_table_metadata_csv(base_id, tables, output_dir=DATA_EXPORTS_DIR):
    """Save a CSV with base id, table id, and table name."""
    rows = [
        {
            'base_id': base_id,
            'table_id': table_id,
            'table_name': table_name
        }
        for table_id, table_name in tables
    ]
    df = pd.DataFrame(rows)
    csv_path = os.path.join(output_dir, 'table_metadata.csv')
    df.to_csv(csv_path, index=False)
    return csv_path

def save_field_metadata_csv(tables, output_dir=DATA_EXPORTS_DIR):
    """Save a CSV with table id, table name, field id, and field name for all fields in all tables."""
    rows = []
    for table in tables:
        table_id = table['id']
        table_name = table['name']
        for field in table.get('fields', []):
            rows.append({
                'table_id': table_id,
                'table_name': table_name,
                'field_id': field['id'],
                'field_name': field['name']
            })
    df = pd.DataFrame(rows)
    csv_path = os.path.join(output_dir, 'field_metadata.csv')
    df.to_csv(csv_path, index=False)
    return csv_path


if __name__ == "__main__":
    print("Fetching all table names...")
    # Fetch full table objects for field metadata
    url = f'https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables'
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    tables_full = response.json().get('tables', [])
    tables = [(table['id'], table['name']) for table in tables_full]
    print(f"Found {len(tables)} tables.")
    summary = []
    for table_id, table_name in tables:
        print(f"Exporting table: {table_name} (ID: {table_id})")
        records = get_all_records_for_table(BASE_ID, table_id)
        csv_path = save_table_to_csv(table_name, records)
        print(f"  Saved {len(records)} records to {csv_path}")
        summary.append((table_name, len(records), csv_path))
    
    # After exporting all tables, save metadata
    metadata_csv = save_table_metadata_csv(BASE_ID, tables)
    print(f"\nTable metadata exported to {metadata_csv}")
    field_metadata_csv = save_field_metadata_csv(tables_full)
    print(f"Field metadata exported to {field_metadata_csv}")

    print("\nSummary Report:")
    for table_name, count, path in summary:
        print(f"- {table_name}: {count} records exported to {path}")

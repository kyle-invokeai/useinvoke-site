import os
import time
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

API_TOKEN = os.getenv('AIRTABLE_API_TOKEN')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')
HEADERS = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

DATA_EXPORTS_DIR = 'data_exports'

def get_all_table_objects(base_id):
    """Fetch all table objects from the Airtable Metadata API."""
    url = f'https://api.airtable.com/v0/meta/bases/{base_id}/tables'
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    return response.json().get('tables', [])

def get_all_table_names(base_id):
    """Fetch all table names from the Airtable Metadata API."""
    tables = get_all_table_objects(base_id)
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

def save_table_to_csv(table_name, records, output_dir=DATA_EXPORTS_DIR):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    rows = [rec['fields'] for rec in records]
    df = pd.DataFrame(rows)
    csv_path = os.path.join(output_dir, f"{table_name}.csv")
    df.to_csv(csv_path, index=False)
    return csv_path

def save_table_metadata_csv(base_id, tables, output_dir=DATA_EXPORTS_DIR):
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

def export_all_tables_and_metadata():
    tables_full = get_all_table_objects(BASE_ID)
    tables = [(table['id'], table['name']) for table in tables_full]
    summary = []
    for table_id, table_name in tables:
        records = get_all_records_for_table(BASE_ID, table_id)
        csv_path = save_table_to_csv(table_name, records)
        summary.append((table_name, len(records), csv_path))
    metadata_csv = save_table_metadata_csv(BASE_ID, tables)
    field_metadata_csv = save_field_metadata_csv(tables_full)
    return summary, metadata_csv, field_metadata_csv

def load_field_name_lookup(field_metadata_path):
    """
    Loads field_metadata.csv and returns a dict:
    { table_name: [field_name, ...], ... }
    """
    df = pd.read_csv(field_metadata_path)
    lookup = {}
    for table_name, group in df.groupby('table_name'):
        lookup[table_name] = group['field_name'].tolist()
    return lookup

def load_field_id_lookup(field_metadata_path):
    """
    Loads field_metadata.csv and returns a dict:
    { table_name: [field_id, ...], ... }
    """
    df = pd.read_csv(field_metadata_path)
    lookup = {}
    for table_name, group in df.groupby('table_name'):
        lookup[table_name] = group['field_id'].tolist()
    return lookup

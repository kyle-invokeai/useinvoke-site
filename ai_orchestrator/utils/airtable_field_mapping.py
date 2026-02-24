import json
import os
from pyairtable import Api
import requests
import re

MAPPING_FILE = os.path.join(os.path.dirname(__file__), 'field_mappings.json')

VALID_AIRTABLE_TYPES = [
    "singleLineText", "email", "url", "multilineText", "number", "percent", "currency", "singleSelect", "multipleSelects", "singleCollaborator", "multipleCollaborators", "multipleRecordLinks", "date", "dateTime", "phoneNumber", "multipleAttachments", "checkbox", "formula", "createdTime", "rollup", "count", "lookup", "multipleLookupValues", "autoNumber", "barcode", "rating", "richText", "duration", "lastModifiedTime", "button", "createdBy", "lastModifiedBy", "externalSyncSource", "aiText"
]

def load_field_mapping(table_name):
    if not os.path.exists(MAPPING_FILE):
        return None
    with open(MAPPING_FILE, 'r', encoding='utf-8') as f:
        all_mappings = json.load(f)
    return all_mappings.get(table_name)

def save_field_mapping(table_name, mapping):
    if os.path.exists(MAPPING_FILE):
        with open(MAPPING_FILE, 'r', encoding='utf-8') as f:
            all_mappings = json.load(f)
    else:
        all_mappings = {}
    all_mappings[table_name] = mapping
    with open(MAPPING_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_mappings, f, indent=2)

def get_airtable_fields(api_key, base_id, table_name):
    url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
    headers = {"Authorization": f"Bearer {api_key}"}
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    tables = resp.json().get("tables", [])
    table = next((t for t in tables if t["name"] == table_name), None)
    if not table:
        return []
    return [f["name"] for f in table["fields"]]

def get_airtable_fields_and_types(api_key, base_id, table_name):
    url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
    headers = {"Authorization": f"Bearer {api_key}"}
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    tables = resp.json().get("tables", [])
    table = next((t for t in tables if t["name"] == table_name), None)
    if not table:
        return [], {}
    fields = [f["name"] for f in table["fields"]]
    types = {f["name"]: f["type"] for f in table["fields"]}
    return fields, types

def infer_field_type_from_csv(col, df):
    # Try to infer type from the first non-null value in the column
    sample = df[col].dropna().astype(str)
    if sample.empty:
        return "singleLineText"
    value = sample.iloc[0]
    # Simple heuristics
    if re.match(r"^\d+$", value):
        return "number"
    if re.match(r"^\d{4}-\d{2}-\d{2}", value):
        return "date"
    if value.lower() in ["true", "false", "yes", "no"]:
        return "checkbox"
    return "singleLineText"

def create_airtable_field(api_key, base_id, table_name, field_name, field_type=None, df=None, options=None):
    """
    Create a new field in an Airtable table using the Metadata API (beta, requires special access).
    This function assumes the API supports PATCHing the table schema.
    """
    url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    # Fetch current schema
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    tables = resp.json().get("tables", [])
    table = next((t for t in tables if t["name"] == table_name), None)
    if not table:
        raise Exception(f"Table '{table_name}' not found in base.")
    table_id = table["id"]
    # Infer type if not provided
    if not field_type:
        if df is not None:
            field_type = infer_field_type_from_csv(field_name, df)
        else:
            field_type = "singleLineText"
    if field_type not in VALID_AIRTABLE_TYPES:
        raise Exception(f"Invalid Airtable field type: {field_type}")
    # Add new field to fields list
    field_def = {"name": field_name, "type": field_type}
    if options and field_type in ("singleSelect", "multipleSelects"):
        field_def["options"] = options
    fields = table["fields"] + [field_def]
    patch_url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables/{table_id}"
    patch_data = {"fields": fields}
    try:
        patch_resp = requests.patch(patch_url, headers=headers, json=patch_data)
        patch_resp.raise_for_status()
        return patch_resp.json()
    except requests.HTTPError as e:
        if patch_resp.status_code == 422:
            msg = patch_resp.json().get('error', {}).get('message', '')
            if 'type' in msg:
                raise Exception(f"422 Unprocessable Entity: Field type missing or invalid. Please check the type for '{field_name}'.")
            if 'name' in msg:
                raise Exception(f"422 Unprocessable Entity: Field name missing or invalid. Please check the name '{field_name}'.")
            raise Exception(f"422 Unprocessable Entity: {msg} (Possible API mismatch or schema error.)")
        raise

# Fetch Airtable base/schema details
from typing import List, Dict
import requests

def get_fields(api_key: str, base_id: str, table: str) -> List[str]:
    url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
    headers = {"Authorization": f"Bearer {api_key}"}
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    tables = resp.json().get("tables", [])
    for t in tables:
        if t["name"] == table:
            return [f["name"] for f in t["fields"]]
    return []

def get_field_types(api_key: str, base_id: str, table: str) -> Dict[str, str]:
    url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
    headers = {"Authorization": f"Bearer {api_key}"}
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    tables = resp.json().get("tables", [])
    for t in tables:
        if t["name"] == table:
            return {f["name"]: f["type"] for f in t["fields"]}
    return {}

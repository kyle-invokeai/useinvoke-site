# Match CSV headers to Airtable fields
from typing import List, Dict

def map_fields(csv_columns: List[str], airtable_fields: List[str]) -> Dict[str, str]:
    mapping = {}
    for col in csv_columns:
        match = next((f for f in airtable_fields if f.lower() == col.lower()), None)
        if match:
            mapping[col] = match
    return mapping

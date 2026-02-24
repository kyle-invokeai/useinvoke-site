# Build Airtable API payloads and execute sync
from typing import Dict, Any
import requests

def validate_record_payload(record_dict, schema_dict):
    errors = []
    for field, props in schema_dict.items():
        # Computed fields
        if props.get("computed", False) and field in record_dict:
            errors.append(f"Field '{field}' is computed and cannot be written.")
        # Required fields
        if props.get("required", False) and (field not in record_dict or record_dict[field] in [None, ""]):
            errors.append(f"Field '{field}' is required but empty.")
        # Select fields
        if props.get("type") == "singleSelect":
            options = props.get("options", [])
            if field in record_dict and record_dict[field] not in options:
                errors.append(f"Field '{field}' value '{record_dict[field]}' is not a valid option.")
    return errors

def validate_records(records, schema_dict):
    valid = []
    skipped = []
    errors = []
    for idx, rec in enumerate(records):
        err = validate_record_payload(rec, schema_dict)
        if err:
            skipped.append((idx, "; ".join(err)))
            errors.append((idx, err))
        else:
            valid.append(rec)
    return valid, skipped, errors

def push_to_airtable(state, api_key: str, records=None) -> Dict[str, Any]:
    # state: SyncState
    url = f"https://api.airtable.com/v0/{state.base_id}/{state.selected_table}"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    all_records = records if records is not None else state.records
    batch_size = 10
    results = []
    total_batches = (len(all_records) + batch_size - 1) // batch_size
    for idx in range(0, len(all_records), batch_size):
        batch = all_records[idx:idx+batch_size]
        payload = {"records": [{"fields": r} for r in batch]}
        try:
            resp = requests.post(url, headers=headers, json=payload)
            resp_json = resp.json()
            results.append({
                "batch": idx // batch_size + 1,
                "status_code": resp.status_code,
                "response": resp_json
            })
            if resp.status_code == 200:
                print(f"[INFO] Batch {idx // batch_size + 1} of {total_batches} synced successfully.")
            else:
                print(f"[ERROR] Batch {idx // batch_size + 1} of {total_batches} failed: {resp_json}")
        except Exception as e:
            print(f"[ERROR] Batch {idx // batch_size + 1} of {total_batches} failed: {e}")
            results.append({
                "batch": idx // batch_size + 1,
                "status_code": None,
                "response": str(e)
            })
    return {"results": results}

import requests
from datetime import datetime, timezone

def log_revision(base_id, airtable_token, file_name, function_name, description, status, updated_by):
    url = f"https://api.airtable.com/v0/{base_id}/Revision Log"
    headers = {
        'Authorization': f'Bearer {airtable_token}',
        'Content-Type': 'application/json'
    }
    now_iso = datetime.now(timezone.utc).isoformat()
    fields = {
        'Date': now_iso,
        'File Name': file_name,
        'Function/Feature': function_name,
        'Description': description,
        'Status': status,
        'Updated By': updated_by
    }
    data = {"fields": fields}
    resp = requests.post(url, headers=headers, json=data)
    resp.raise_for_status()
    return True

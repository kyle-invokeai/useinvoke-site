import os
import requests
import datetime

# You may want to load these from environment variables or a config file
AIRTABLE_API_KEY = os.getenv('AIRTABLE_API_KEY')
AIRTABLE_BASE_ID = os.getenv('AIRTABLE_BASE_ID')
AGENT_ACTIVITY_TABLE = 'Agent Activity'

# Airtable API endpoint
AIRTABLE_API_URL = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AGENT_ACTIVITY_TABLE.replace(' ', '%20')}"

HEADERS = {
    'Authorization': f'Bearer {AIRTABLE_API_KEY}',
    'Content-Type': 'application/json'
}

def log_agent_activity(agent_name, category, status, result):
    """
    Log or update agent activity in the Agent Activity Airtable table.
    If agent_name exists, update. Otherwise, create new.
    """
    try:
        # 1. Search for existing record by Agent Name
        params = {
            'filterByFormula': f"{{Agent Name}} = '{agent_name}'"
        }
        resp = requests.get(AIRTABLE_API_URL, headers=HEADERS, params=params)
        resp.raise_for_status()
        records = resp.json().get('records', [])
        now = datetime.datetime.utcnow().isoformat()
        fields = {
            'Agent Name': agent_name,
            'Category': category or 'General',
            'Last Run': now,
            'Status': status,
            'Result': (result or '')[:300]
        }
        if records:
            # Update the first matching record
            record_id = records[0]['id']
            update_url = f"{AIRTABLE_API_URL}/{record_id}"
            update_resp = requests.patch(update_url, headers=HEADERS, json={'fields': fields})
            update_resp.raise_for_status()
        else:
            # Create new record
            create_resp = requests.post(AIRTABLE_API_URL, headers=HEADERS, json={'fields': fields})
            create_resp.raise_for_status()
    except Exception as e:
        print(f"[⚠️ Agent Activity Logging Error]: {e}")

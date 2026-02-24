import os
import requests
from agents.airtable_logger.utils.milestone_updater import get_airtable_field_names
from datetime import datetime, timezone

BASE_ID = os.getenv('AIRTABLE_BASE_ID')
API_TOKEN = os.getenv('AIRTABLE_API_TOKEN')

PRIMARY_FIELDS = {
    "Milestones": "Milestone",
    "Team Members": "Name",
    "Project Updates": "Name",
    "Revision Log": "File Name",
}

def find_record_id(base_id, table_name, primary_field, value, airtable_token):
    url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
    headers = {'Authorization': f'Bearer {airtable_token}'}
    params = {'filterByFormula': f"{{{primary_field}}} = '{value}'"}
    resp = requests.get(url, headers=headers, params=params)
    resp.raise_for_status()
    records = resp.json().get('records', [])
    return records[0]['id'] if records else None

def create_record(base_id, table_name, fields, airtable_token):
    url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
    headers = {'Authorization': f'Bearer {airtable_token}', 'Content-Type': 'application/json'}
    resp = requests.post(url, headers=headers, json={"fields": fields})
    resp.raise_for_status()
    return resp.json()['id']

def test_table_entry_and_edit(table_name, test_name):
    field_names = get_airtable_field_names(BASE_ID, table_name, API_TOKEN)
    updated_fields = {}
    primary_field = PRIMARY_FIELDS.get(table_name, "Name")
    for field in field_names:
        if field == primary_field:
            updated_fields[field] = test_name
        elif "status" in field.lower():
            updated_fields[field] = "Complete"
        elif "date" in field.lower():
            updated_fields[field] = datetime(2025, 4, 17, tzinfo=timezone.utc).isoformat()
        elif "done" in field.lower():
            updated_fields[field] = True
        elif "id" in field.lower():
            continue
        elif "team" in field.lower() and "member" in field.lower():
            updated_fields[field] = []
        elif "agent" in field.lower():
            updated_fields[field] = []
        elif "description" in field.lower():
            updated_fields[field] = f"Test description for {test_name}"
        elif "log" in field.lower():
            updated_fields[field] = f"Test log for {test_name}"
        elif "feature" in field.lower():
            updated_fields[field] = f"Test feature for {test_name}"
        elif "update" in field.lower():
            updated_fields[field] = f"Test update for {test_name}"
        else:
            updated_fields[field] = f"Test {field}"
    print(f"Testing {table_name} with fields: {updated_fields}")
    try:
        record_id = find_record_id(BASE_ID, table_name, primary_field, test_name, API_TOKEN)
        if not record_id:
            print(f"Creating new record in {table_name}...")
            record_id = create_record(BASE_ID, table_name, updated_fields, API_TOKEN)
        from agents.airtable_logger.utils.milestone_updater import update_milestone_record
        result = update_milestone_record(BASE_ID, table_name, test_name, updated_fields, API_TOKEN)
        print(f"Test for {table_name}: {'Success' if result else 'Failed'}")
    except Exception as e:
        print(f"Test for {table_name} failed: {e}")

if __name__ == "__main__":
    tables = ["Milestones", "Revision Log", "Team Members"]
    for table in tables:
        test_table_entry_and_edit(table, f"Test Entry {table}")

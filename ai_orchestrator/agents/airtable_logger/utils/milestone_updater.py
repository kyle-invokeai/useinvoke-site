import os
import requests
from datetime import datetime, timezone
import csv
from dotenv import load_dotenv

load_dotenv()

API_TOKEN = os.getenv('AIRTABLE_API_TOKEN')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')
HEADERS = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

def get_airtable_field_names(base_id, table_name, airtable_token):
    url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
    headers = {
        'Authorization': f'Bearer {airtable_token}',
        'Content-Type': 'application/json'
    }
    try:
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        tables = resp.json().get('tables', [])
        for table in tables:
            if table['name'] == table_name:
                return [field['name'] for field in table['fields']]
    except Exception:
        pass
    return []

def update_milestone_record(base_id, table_name, milestone_name, updated_fields, airtable_token):
    """
    Dynamically updates milestone record fields in Airtable, handling schema changes.
    - Detects record by the table's primary field.
    - Updates 'Last Updated' to today.
    - If 'Status' is 'Complete', sets 'Date Completed' to today.
    - Only updates fields present in schema.
    - Handles Team Members (linked) field if present.
    """
    headers = {
        'Authorization': f'Bearer {airtable_token}',
        'Content-Type': 'application/json'
    }
    # Get schema
    field_names = get_airtable_field_names(base_id, table_name, airtable_token)
    # Determine primary field
    PRIMARY_FIELDS = {
        "Milestones": "Milestone",
        "Team Members": "Name",
        "Project Updates": "Name",
        "Revision Log": "File Name",
    }
    primary_field = PRIMARY_FIELDS.get(table_name, "Name")
    # Find record by primary field
    url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
    params = {'filterByFormula': f"{{{primary_field}}} = '{milestone_name}'"}
    resp = requests.get(url, headers=headers, params=params)
    resp.raise_for_status()
    records = resp.json().get('records', [])
    if not records:
        return False
    record = records[0]
    record_id = record['id']
    patch_fields = {}
    now_iso = datetime.now(timezone.utc).isoformat()
    # Always update Last Updated
    if 'Last Updated' in field_names:
        patch_fields['Last Updated'] = now_iso
    # If Status is Complete, update Date Completed
    status = updated_fields.get('Status')
    if status and status.lower() == 'complete' and 'Date Completed' in field_names:
        patch_fields['Date Completed'] = now_iso
    # Update Team Members if present
    if 'Team Members' in field_names and 'Team Members' in updated_fields:
        patch_fields['Team Members'] = updated_fields['Team Members']
    # Add all other fields that exist in schema
    for k, v in updated_fields.items():
        if k in field_names and k not in patch_fields:
            patch_fields[k] = v
    patch_url = f"https://api.airtable.com/v0/{base_id}/{table_name}/{record_id}"
    data = {"fields": patch_fields}
    patch_resp = requests.patch(patch_url, headers=headers, json=data)
    patch_resp.raise_for_status()
    # Log revision
    from agents.airtable_logger.utils.revision_logger import log_revision
    log_revision(
        base_id=base_id,
        airtable_token=airtable_token,
        file_name='milestone_updater.py',
        function_name='update_milestone_record',
        description=f"Updated {table_name} '{milestone_name}' fields: {list(patch_fields.keys())}",
        status='Implemented',
        updated_by='AI Coder Agent'
    )
    return True

def update_milestone_status(milestone_name: str, status: str, done: bool):
    """
    Update the status and done checkbox for a milestone in Airtable.
    """
    # Search for the milestone record
    url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"
    params = {'filterByFormula': f"{{Milestone}} = '{milestone_name}'"}
    try:
        resp = requests.get(url, headers=HEADERS, params=params)
        resp.raise_for_status()
        records = resp.json().get('records', [])
        if not records:
            print(f"[MilestoneUpdater] Milestone not found: {milestone_name}")
            return False
        record_id = records[0]['id']
        patch_url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}/{record_id}"
        data = {
            "fields": {
                "Status": status,
                "Done": done
            }
        }
        patch_resp = requests.patch(patch_url, headers=HEADERS, json=data)
        patch_resp.raise_for_status()
        print(f"[MilestoneUpdater] Updated milestone '{milestone_name}' to status '{status}', done={done}")
        return True
    except Exception as e:
        print(f"[MilestoneUpdater] Error updating milestone: {e}")
        return False

def get_team_member_record_id(agent_name: str):
    """
    Returns the record ID for a team member given their name, or None if not found.
    """
    url = f"https://api.airtable.com/v0/{BASE_ID}/Team Members"
    params = {'filterByFormula': f"{{Name}} = '{agent_name}'"}
    try:
        resp = requests.get(url, headers=HEADERS, params=params)
        resp.raise_for_status()
        records = resp.json().get('records', [])
        if records:
            return records[0]['id']
    except Exception as e:
        print(f"[MilestoneUpdater] Error finding team member record for '{agent_name}': {e}")
    return None

def update_agent_milestone(milestone_name: str, agent_name: str, begin: bool = False, complete: bool = False):
    """
    Ensures the agent is in the Team Members (linked) field, updates status and done fields for a milestone.
    If begin=True, sets status to 'In Progress'.
    If complete=True, sets status to 'Done' and Done=True.
    Also updates a 'Last Updated' field if present.
    """
    url = f"https://api.airtable.com/v0/{BASE_ID}/Milestones"
    params = {'filterByFormula': f"{{Milestone}} = '{milestone_name}'"}
    try:
        resp = requests.get(url, headers=HEADERS, params=params)
        resp.raise_for_status()
        records = resp.json().get('records', [])
        if not records:
            print(f"[MilestoneUpdater] Milestone not found: {milestone_name}")
            return False
        record = records[0]
        record_id = record['id']
        fields = record.get('fields', {})
        patch_fields = {}
        # Set Team Members (linked) if agent not already present
        agent_id = get_team_member_record_id(agent_name)
        if not agent_id:
            print(f"[MilestoneUpdater] Could not find Team Member record for '{agent_name}'")
            return False
        current_team_members = fields.get('Team Members (linked)', [])
        if agent_id not in current_team_members:
            patch_fields['Team Members (linked)'] = current_team_members + [agent_id]
        # Set status if beginning work
        if begin and fields.get('Status') != 'In Progress':
            patch_fields['Status'] = 'In Progress'
        # Set status and done if completing
        if complete:
            if fields.get('Status') != 'Done':
                patch_fields['Status'] = 'Done'
            if not fields.get('Done', False):
                patch_fields['Done'] = True
        # Optionally update Last Updated or Date Completed if present
        now_iso = datetime.now(timezone.utc).isoformat()
        if 'Last Updated' in fields or 'Last Updated' in get_milestone_field_names():
            patch_fields['Last Updated'] = now_iso
        if complete and ('Date Completed' in fields or 'Date Completed' in get_milestone_field_names()):
            patch_fields['Date Completed'] = now_iso
        if not patch_fields:
            print(f"[MilestoneUpdater] No update needed for milestone: {milestone_name}")
            return True
        patch_url = f"https://api.airtable.com/v0/{BASE_ID}/Milestones/{record_id}"
        data = {"fields": patch_fields}
        print(f"[MilestoneUpdater] PATCH fields for '{milestone_name}': {patch_fields}")
        patch_resp = requests.patch(patch_url, headers=HEADERS, json=data)
        patch_resp.raise_for_status()
        print(f"[MilestoneUpdater] Updated milestone '{milestone_name}' fields: {patch_fields}")
        return True
    except Exception as e:
        print(f"[MilestoneUpdater] Error updating milestone: {e}")
        return False

def get_milestone_field_names():
    """
    Returns a list of field names for the Milestones table from field_metadata.csv.
    """
    import csv
    field_names = []
    try:
        with open('data_exports/field_metadata.csv', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                if row['table_name'] == 'Milestones':
                    field_names.append(row['field_name'])
    except Exception as e:
        print(f"[MilestoneUpdater] Error reading field_metadata.csv: {e}")
    return field_names

def mark_milestone_complete(milestone_name: str, agent_name: str):
    """
    Marks a milestone as complete (status=Done, Done=True, sets owner).
    """
    return update_agent_milestone(milestone_name, agent_name, complete=True)

def log_project_update(agent_name: str, update: str, milestone_name: str = None):
    """
    Logs a project update to the Project Updates table, linking to a milestone if provided.
    Uses correct Airtable field names and record IDs for linked fields.
    """
    url = f"https://api.airtable.com/v0/{BASE_ID}/Project Updates"
    timestamp = datetime.now(timezone.utc).isoformat()
    agent_id = get_team_member_record_id(agent_name)
    if not agent_id:
        print(f"[ProjectUpdateLogger] Could not find Team Member record for '{agent_name}'")
        return False
    fields = {
        "Team Member Responsible": [agent_id],
        "Update Description": update,
        "Update Date": timestamp
    }
    # Link to milestone if provided (as Related Tasks)
    if milestone_name:
        ms_url = f"https://api.airtable.com/v0/{BASE_ID}/Milestones"
        params = {'filterByFormula': f"{{Milestone}} = '{milestone_name}'"}
        try:
            ms_resp = requests.get(ms_url, headers=HEADERS, params=params)
            ms_resp.raise_for_status()
            ms_records = ms_resp.json().get('records', [])
            if ms_records:
                fields['Related Tasks'] = [ms_records[0]['id']]
        except Exception as e:
            print(f"[ProjectUpdateLogger] Error finding milestone for update: {e}")
    data = {"fields": fields}
    print(f"[ProjectUpdateLogger] POST fields: {fields}")
    try:
        resp = requests.post(url, headers=HEADERS, json=data)
        resp.raise_for_status()
        print(f"[ProjectUpdateLogger] Logged project update for agent '{agent_name}'")
        return True
    except Exception as e:
        print(f"[ProjectUpdateLogger] Error logging project update: {e}")
        return False
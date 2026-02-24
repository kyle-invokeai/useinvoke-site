import os
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

API_TOKEN = os.getenv('AIRTABLE_API_TOKEN')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')
TABLE_NAME = os.getenv('AIRTABLE_TABLE_LOGS')
HEADERS = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

def log_to_airtable(user_prompt, agent_name, response_text):
    timestamp = datetime.now(timezone.utc).isoformat()
    data = {
        "fields": {
            "Prompt": user_prompt,
            "Agent": agent_name,
            "Response": response_text,
            "Timestamp": timestamp
        }
    }
    url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"
    print(f"[Airtable Debug] URL: {url}")
    print(f"[Airtable Debug] Payload: {data}")
    print(f"[Airtable Debug] Headers: {HEADERS}")
    resp = requests.post(url, json=data, headers=HEADERS)
    print(f"[Airtable Debug] Status: {resp.status_code}")
    print(f"[Airtable Debug] Response: {resp.text}")
    if resp.status_code == 200 or resp.status_code == 201:
        return True
    else:
        print(f"Airtable log error: {resp.status_code} {resp.text}")
        return False

def find_feature_record_id(prompt, features_table_name="Features"): 
    """Searches the Features table for a feature whose name is a keyword in the prompt. Returns the first matching record ID or None."""
    url = f"https://api.airtable.com/v0/{BASE_ID}/{features_table_name}"
    params = {"fields[]": ["Name"]}
    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code != 200:
        print(f"[Airtable Debug] Failed to fetch features: {resp.status_code} {resp.text}")
        return None
    features = resp.json().get("records", [])
    prompt_lower = prompt.lower()
    for feature in features:
        name = feature["fields"].get("Name", "").lower()
        if name and name in prompt_lower:
            return feature["id"]
    return None

def log_to_airtable_with_feature_link(user_prompt, agent_name, response_text):
    """Logs to Airtable Logs table and links to a Feature if a keyword matches."""
    timestamp = datetime.now(timezone.utc).isoformat()
    feature_id = find_feature_record_id(user_prompt)
    data = {
        "fields": {
            "Prompt": user_prompt,
            "Agent": agent_name,
            "Response": response_text,
            "Timestamp": timestamp
        }
    }
    if feature_id:
        data["fields"]["Feature"] = [feature_id]  # Linked record expects a list of record IDs
    url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"
    print(f"[Airtable Debug] URL: {url}")
    print(f"[Airtable Debug] Payload: {data}")
    print(f"[Airtable Debug] Headers: {HEADERS}")
    resp = requests.post(url, json=data, headers=HEADERS)
    print(f"[Airtable Debug] Status: {resp.status_code}")
    print(f"[Airtable Debug] Response: {resp.text}")
    if resp.status_code == 200 or resp.status_code == 201:
        return True
    else:
        print(f"Airtable log error: {resp.status_code} {resp.text}")
        return False

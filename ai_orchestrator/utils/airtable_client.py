# Airtable API client

import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_TOKEN = os.getenv('AIRTABLE_API_TOKEN')
BASE_ID = os.getenv('AIRTABLE_BASE_ID')
HEADERS = {'Authorization': f'Bearer {API_TOKEN}'}

class AirtableClient:
    def __init__(self, api_key, base_id, table_name):
        self.api_key = api_key
        self.base_id = base_id
        self.table_name = table_name
        self.endpoint = f"https://api.airtable.com/v0/{base_id}/{table_name}"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def get_records(self, filter_formula=None, max_records=1):
        params = {"maxRecords": max_records}
        if filter_formula:
            params["filterByFormula"] = filter_formula
        resp = requests.get(self.endpoint, headers=self.headers, params=params)
        resp.raise_for_status()
        return resp.json().get("records", [])

    def update_record(self, record_id, fields):
        url = f"{self.endpoint}/{record_id}"
        data = {"fields": fields}
        resp = requests.patch(url, headers=self.headers, json=data)
        resp.raise_for_status()
        return resp.json()

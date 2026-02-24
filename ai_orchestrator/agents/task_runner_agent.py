import os
import json
import time
import traceback
import argparse
from dotenv import load_dotenv
import requests
from utils.airtable_client import AirtableClient
from devbox_config import get_config
from openai import OpenAI
from utils.agent_router import run_summarizer, run_extractor, route_task
from ai_orchestrator.life_bootstrap import LIFE_THINK_TANK_INSTRUCTIONS

# Load environment variables
load_dotenv()

AIRTABLE_API_TOKEN = os.getenv('AIRTABLE_API_TOKEN')
AIRTABLE_BASE_ID = os.getenv('AIRTABLE_BASE_ID')
AIRTABLE_TABLE_TASKS = os.getenv('AIRTABLE_TABLE_TASKS', 'Tasks')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL = 'gpt-3.5-turbo'


class AirtableClient:
    def __init__(self, api_token, base_id, table_name):
        self.api_token = api_token
        self.base_id = base_id
        self.table_name = table_name
        self.endpoint = f"https://api.airtable.com/v0/{base_id}/{table_name}"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

    def get_next_task(self):
        params = {
            "filterByFormula": "{Status}='Queued'",
            "maxRecords": 1
        }
        resp = requests.get(self.endpoint, headers=self.headers, params=params)
        resp.raise_for_status()
        records = resp.json().get("records", [])
        return records[0] if records else None

    def update_task(self, record_id, fields):
        url = f"{self.endpoint}/{record_id}"
        data = {"fields": fields}
        resp = requests.patch(url, headers=self.headers, json=data)
        resp.raise_for_status()
        return resp.json()


def call_openai_model(prompt: str) -> str:
    client = OpenAI(api_key=OPENAI_API_KEY)
    try:
        # Prepend LIFE_THINK_TANK_INSTRUCTIONS to the prompt
        full_prompt = f"{LIFE_THINK_TANK_INSTRUCTIONS}\n\n{prompt}"
        print(f"[INFO] Sending prompt to OpenAI: {full_prompt[:60]}...")
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": full_prompt}],
            max_tokens=1024,
            temperature=0.7
        )
        result = response.choices[0].message.content.strip()
        return result
    except Exception as e:
        print(f"[ERROR] OpenAI API call failed: {e}")
        traceback.print_exc()
        return ""


class TaskRunnerAgent:
    def __init__(self, dry_run=False):
        self.config = get_config()
        self.airtable = AirtableClient(
            api_token=AIRTABLE_API_TOKEN,
            base_id=AIRTABLE_BASE_ID,
            table_name=AIRTABLE_TABLE_TASKS
        )
        self.dry_run = dry_run

    def run_task(self, task):
        record_id = task['id']
        fields = task['fields']
        instructions = fields.get('Instructions', '')
        agent_type = fields.get('Type', 'default').lower()

        try:
            print(f"[INFO] Marking task {record_id} as In Progress.")
            self.airtable.update_task(record_id, {"Status": "In Progress"})

            print(f"[INFO] Running task: {instructions}")
            print(f"[INFO] Agent type: {agent_type}")

            result = route_task(task, dry_run=self.dry_run)

            if result is None:
                # Default to OpenAI model if route_task returns None (for 'default' type)
                if self.dry_run:
                    result = f"[Dry Run] Would run agent type 'default' with instructions: {instructions}"
                else:
                    result = call_openai_model(instructions)

            if result and result.startswith("Unrecognized agent type"):
                print(f"[WARNING] {result}")
                self.airtable.update_task(record_id, {"Status": "Failed", "Result": result})
                return

            print(f"[INFO] Marking task {record_id} as Completed.")
            self.airtable.update_task(record_id, {"Status": "Completed", "Result": result})
            print(f"[INFO] Task completed. Result: {result}")
        except Exception as e:
            tb = traceback.format_exc()
            print(f"[ERROR] Marking task {record_id} as Error.")
            self.airtable.update_task(record_id, {"Status": "Error", "Result": tb})
            print(f"[ERROR] Exception occurred: {tb}")

    def run(self):
        print("[INFO] Fetching next queued task from Airtable...")
        task = self.airtable.get_next_task()
        if not task:
            print("[INFO] No queued tasks found.")
            return
        self.run_task(task)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the Task Runner Agent.")
    parser.add_argument("--watch", action="store_true", help="Enable watch mode (continuous task polling).")
    parser.add_argument("--sleep", type=int, default=10, help="Seconds to wait between polling loops.")
    parser.add_argument("--dry-run", action="store_true", help="Simulate task execution without GPT call.")
    args = parser.parse_args()

    agent = TaskRunnerAgent(dry_run=args.dry_run)

    try:
        if args.watch:
            print("[INFO] Watch mode enabled.")
            while True:
                agent.run()
                print(f"[INFO] Sleeping {args.sleep} seconds...")
                time.sleep(args.sleep)
        else:
            agent.run()
    except KeyboardInterrupt:
        print("[INFO] Watch mode terminated by user.")

import os
import json
from typing import List, Dict
# from openai import OpenAI # Uncomment if using OpenAI API

from agents.airtable_logger.utils.milestone_updater import update_milestone_status

class TabSummarizerAgent:
    def __init__(self, llm=None):
        self.llm = llm  # Optionally inject LLM client

    def summarize_tab(self, tab: Dict) -> Dict:
        title = tab.get("title", "")
        url = tab.get("url", "")
        domain = tab.get("domain", "")
        tags = tab.get("tags", "")
        notes = tab.get("notes", "")
        # --- LLM or heuristic summary ---
        # For MVP, use a simple template. Replace with LLM call for production.
        summary = f"'{title}' ({domain or url}) is a web page about {tags or 'various topics'}."
        value = f"This link may be useful for research or sharing."
        next_action = "Save to Notion or share with your team."
        return {"summary": summary, "value": value, "next_action": next_action}

    def summarize_tabs(self, tabs: List[Dict]) -> List[Dict]:
        return [self.summarize_tab(tab) for tab in tabs]

    def run(self, payload: Dict) -> List[Dict]:
        tabs = payload.get("tabs", [])
        results = self.summarize_tabs(tabs)
        # Log to summaries.json
        log_path = os.path.expanduser("~/.agent_orchestrator/summaries.json")
        try:
            os.makedirs(os.path.dirname(log_path), exist_ok=True)
            with open(log_path, "a", encoding="utf-8") as f:
                for tab, summary in zip(tabs, results):
                    f.write(json.dumps({"tab": tab, "summary": summary}) + "\n")
        except Exception as e:
            print(f"[TabSummarizerAgent] Log error: {e}")
        return results

# AgentSpace trigger
AGENT = TabSummarizerAgent()
def agent_entry(payload):
    return AGENT.run(payload)

def summarize_agent(prompt):
    if "summarize project milestones" in prompt.lower():
        update_milestone_status("Summarize project milestones", status="Done", done=True)
        return f"Summary agent completed: {prompt}"
    return f"Summary agent responding to: {prompt}"
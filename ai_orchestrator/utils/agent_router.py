import os
import json
from agents.summary.summarize_agent import TabSummarizerAgent
from ai_orchestrator.life_bootstrap import LIFE_THINK_TANK_INSTRUCTIONS

# Stub agent router for task type routing

def run_summarizer(task, dry_run=False):
    """Run the tab summarizer agent, loading tabs from cache."""
    if dry_run:
        return "[Dry Run] Tab summarizer would generate summaries for cached tabs."
    tabs_path = os.path.expanduser("~/.agent_orchestrator/tabs.json")
    try:
        if not os.path.exists(tabs_path):
            raise FileNotFoundError("No tabs cache found.")
        with open(tabs_path, "r", encoding="utf-8") as f:
            tabs = json.load(f)
        if not tabs:
            raise ValueError("No tabs found in cache.")
        agent = TabSummarizerAgent()
        summaries = agent.summarize_tabs(tabs)
        if not summaries:
            raise RuntimeError("Summarization returned no results.")
        # Return summaries as a string for now (could be improved to structured output)
        return json.dumps(summaries, ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Tab summarization failed: No tabs found or agent error. ({e})"

def run_extractor(task, dry_run=False):
    if dry_run:
        return "[Dry Run] Extractor would process the task."
    return "[Stub] Extracted info"

def route_task(task, dry_run=False):
    agent_type = task.get('fields', {}).get('Type', 'default').lower()
    # Prepend LIFE_THINK_TANK_INSTRUCTIONS to any prompt dispatched to an agent or OpenAI
    if agent_type == "summarizer":
        # If run_summarizer uses a prompt, ensure it prepends the instructions (update in that agent if needed)
        return run_summarizer(task, dry_run=dry_run)
    elif agent_type == "extractor":
        return run_extractor(task, dry_run=dry_run)
    elif agent_type == "default":
        # The default handler should be called from the main agent, not here
        return None
    else:
        return f"Unrecognized agent type: {agent_type}"

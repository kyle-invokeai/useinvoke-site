import json
from pathlib import Path
TABS_PATH = Path.home() / ".agent_orchestrator" / "tabs_snapshot.json"

def save_tabs(tabs):
    TABS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(TABS_PATH, "w", encoding="utf-8") as f:
        json.dump(tabs, f, indent=2)

def load_recent_tabs():
    if TABS_PATH.exists():
        with open(TABS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

import os
import time
from dotenv import load_dotenv
from utils.airtable_exporter import export_all_tables_and_metadata
from utils.retry import try_agent_with_retry

# === Load ENV Vars ===
load_dotenv()

# === Import Agent Entry Points ===
from agents.travel.travel_agent import travel_agent
from agents.airtable_logger.airtable_logger_agent import airtable_logger_agent
from agents.summary.summarize_agent import summarize_agent
from agents.pm.pm_agent import pm_agent
from agents.pm_director.pm_director_agent import pm_director_agent
from agents.ideas.ideas_agent import ideas_agent
from agents.ai_dev.ai_dev_agent import ai_dev_agent
from agents.orchestrator.orchestrator_agent import orchestrator_agent
from agents.ai_dev.ai_infra_agent import ai_infra_agent
from agents.airtable_logger.airtable_logger import log_to_airtable
from agents.logging.agent_activity_logger import log_agent_activity
from agents.classifier_agent import classifier_agent  # <-- Import the classifier agent

# === Routing Logic ===
AGENT_ROUTING = {
    "trip": travel_agent,
    "log": airtable_logger_agent,
    "summarize": summarize_agent,
    "pm": pm_agent,
    "director": pm_director_agent,
    "idea": ideas_agent,
    "infra": ai_infra_agent,
    "developer": ai_dev_agent,
    "orchestrate": orchestrator_agent,
}

# === Debug: Print agent types at startup ===
print("[DEBUG] AGENT_ROUTING content:")
for keyword, agent in AGENT_ROUTING.items():
    print(f"Keyword: {keyword}, Agent: {agent}, Type: {type(agent)}")

def route_prompt(prompt: str):
    prompt_lower = prompt.lower()
    for keyword, agent in AGENT_ROUTING.items():
        if keyword in prompt_lower:
            try:
                if keyword == "orchestrate":
                    print("✅ Route matched 'orchestrate'")
                if callable(agent):
                    agent_name = agent.__name__
                    category = keyword.capitalize() if keyword else "General"
                    # --- Retry logic ---
                    success, response = try_agent_with_retry(agent, prompt, retries=2, agent_name=agent_name, category=category)
                    # --- Agent Activity Logging ---
                    status = "Success" if success else "Failed"
                    result_summary = str(response)
                    if len(result_summary) > 300:
                        result_summary = result_summary[:297] + '...'
                    try:
                        log_agent_activity(agent_name, category, status, result_summary)
                    except Exception as log_err:
                        print(f"[⚠️ Agent Activity Logging Error]: {log_err}")
                    return agent_name, response
                else:
                    return None, f"⚠️ The agent '{keyword}' is not callable."
            except Exception as e:
                # Log error status to Agent Activity
                try:
                    log_agent_activity(agent.__name__, keyword.capitalize(), "Error", str(e))
                except Exception as log_err:
                    print(f"[⚠️ Agent Activity Logging Error]: {log_err}")
                return None, f"⚠️ An error occurred while processing your request: {e}"
    # Fallback: capture and log unrouted prompts for later analysis and classification
    fallback_response = "🤖 I don't recognize that request. Try again with a clearer instruction."
    try:
        log_to_airtable(prompt, "unrouted_agent", fallback_response)
    except Exception as error:
        print(f"[⚠️ Airtable Logging Error]: {error}")
    # --- Classifier integration ---
    try:
        suggested_agent = classifier_agent(prompt)
        if suggested_agent != "unclassified":
            print(f"[Classifier Suggestion] Route to: {suggested_agent}")
            return suggested_agent, f"[Classifier Suggestion] Route to: {suggested_agent}"
    except Exception as clf_err:
        print(f"[⚠️ Classifier Agent Error]: {clf_err}")
    return None, fallback_response

# === Orchestration Loop ===
EXIT_COMMANDS = {"exit", "quit"}  # Configurable exit commands

def run_orchestrator():
    print("[🧠 Orchestrator Ready]")

    while True:
        user_prompt = input("\n⚡ Prompt me:\n> ").strip()

        if user_prompt.lower() in EXIT_COMMANDS:
            print("👋 Exiting.")
            break

        agent_name, result = route_prompt(user_prompt)
        print(f"\n🎯 Result:\n{result}")
        if agent_name:
            log_to_airtable(user_prompt, agent_name, result)

def ensure_fresh_airtable_metadata(max_age_hours=6):
    """
    Checks if table_metadata.csv and field_metadata.csv exist and are fresh.
    If not, triggers an update via export_all_tables_and_metadata().
    """
    exports_dir = 'data_exports'
    table_meta = os.path.join(exports_dir, 'table_metadata.csv')
    field_meta = os.path.join(exports_dir, 'field_metadata.csv')
    now = time.time()
    for path in [table_meta, field_meta]:
        if not os.path.exists(path):
            print(f"[Airtable] {os.path.basename(path)} missing. Updating metadata...")
            export_all_tables_and_metadata()
            return
        mtime = os.path.getmtime(path)
        age_hours = (now - mtime) / 3600
        if age_hours > max_age_hours:
            print(f"[Airtable] {os.path.basename(path)} older than {max_age_hours}h. Updating metadata...")
            export_all_tables_and_metadata()
            return
    print("[Airtable] Metadata is fresh.")

def test_agent_logging():
    from agents.airtable_logger.utils.milestone_updater import update_agent_milestone, log_project_update
    agent_name = "AI Dev"  # Use a real Team Member name from your Team Members table
    milestone_name = "Build orchestration router"  # Use a real milestone name from your Milestones table

    # Simulate starting work
    update_agent_milestone(milestone_name, agent_name, begin=True)
    log_project_update(agent_name, "Started work on orchestration router logic.", milestone_name)

    # Simulate completion
    update_agent_milestone(milestone_name, agent_name, complete=True)
    log_project_update(agent_name, "Milestone completed.", milestone_name)

if __name__ == "__main__":
    ensure_fresh_airtable_metadata()
    # test_agent_logging()  # Uncomment to test logging, then comment out after running once
    run_orchestrator()

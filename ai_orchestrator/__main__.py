import os
import sys
import time
import argparse
from dotenv import load_dotenv
from ai_orchestrator.utils.airtable_exporter import export_all_tables_and_metadata
from ai_orchestrator.utils.retry import try_agent_with_retry
from ai_orchestrator.agents.travel.travel_agent import travel_agent
from ai_orchestrator.agents.airtable_logger.airtable_logger_agent import airtable_logger_agent
from ai_orchestrator.agents.summary.summarize_agent import summarize_agent
from ai_orchestrator.agents.pm.pm_agent import pm_agent
from ai_orchestrator.agents.pm_director.pm_director_agent import pm_director_agent
from ai_orchestrator.agents.ideas.ideas_agent import ideas_agent
from ai_orchestrator.agents.ai_dev.ai_dev_agent import ai_dev_agent
from ai_orchestrator.agents.orchestrator.orchestrator_agent import orchestrator_agent
from ai_orchestrator.agents.ai_dev.ai_infra_agent import ai_infra_agent
from ai_orchestrator.agents.airtable_logger.airtable_logger import log_to_airtable
from ai_orchestrator.agents.logging.agent_activity_logger import log_agent_activity
from ai_orchestrator.agents.classifier_agent import classifier_agent

try:
    from colorama import Fore, Style, init as colorama_init
    colorama_init(autoreset=True)
    COLORAMA_AVAILABLE = True
except ImportError:
    COLORAMA_AVAILABLE = False

REQUIRED_ENV_VARS = ["AIRTABLE_API_KEY", "AIRTABLE_BASE_ID", "OPENAI_API_KEY"]

def validate_env():
    missing = [k for k in REQUIRED_ENV_VARS if not os.getenv(k)]
    if missing:
        msg = f"Missing required environment variables: {', '.join(missing)}"
        if COLORAMA_AVAILABLE:
            print(Fore.RED + "❌ " + msg)
        else:
            print("❌ " + msg)
        print("Please add them to your .env file.")
        print("Tip: Generate a .env.example template for your team!")
        sys.exit(1)
    else:
        if COLORAMA_AVAILABLE:
            print(Fore.GREEN + "✅ All required environment variables are set!")
        else:
            print("✅ All required environment variables are set!")

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

def route_prompt(prompt: str):
    # ...existing code...
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

EXIT_COMMANDS = {"exit", "quit"}

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

def run_cli(agent_name, prompt):
    agent_func = AGENT_ROUTING.get(agent_name)
    if not agent_func:
        print(f"❌ Unknown agent: {agent_name}")
        sys.exit(1)
    _, result = route_prompt(prompt)
    print(result)

def ensure_fresh_airtable_metadata(max_age_hours=6):
    # ...existing code...
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

def run():
    load_dotenv()
    validate_env()
    ensure_fresh_airtable_metadata()
    parser = argparse.ArgumentParser(description="AI Orchestrator CLI")
    parser.add_argument("--agent", type=str, help="Agent to use (e.g. travel_agent)")
    parser.add_argument("--prompt", type=str, help="Prompt to send to the agent")
    args = parser.parse_args()
    if args.agent and args.prompt:
        run_cli(args.agent, args.prompt)
    else:
        run_orchestrator()

if __name__ == "__main__":
    run()
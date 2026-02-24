import time
from agents.logging.agent_activity_logger import log_agent_activity

def try_agent_with_retry(agent_fn, prompt, retries=2, agent_name=None, category=None):
    """
    Tries to execute agent_fn(prompt) up to retries+1 times.
    Logs each attempt's success/failure to the console.
    If all fail, logs 'Failed' status to Agent Activity in Airtable.
    Returns (success, result).
    """
    last_exception = None
    for attempt in range(1, retries + 2):
        try:
            print(f"[Retry] Attempt {attempt} for agent '{agent_fn.__name__}'...")
            result = agent_fn(prompt)
            # Define what a 'bad result' is (customize as needed)
            if result is None or (isinstance(result, str) and result.strip() == ""):
                print(f"[Retry] Attempt {attempt} failed: Empty result.")
                raise ValueError("Empty result")
            print(f"[Retry] Attempt {attempt} succeeded.")
            return True, result
        except Exception as e:
            print(f"[Retry] Attempt {attempt} failed: {e}")
            last_exception = e
            time.sleep(1)  # Optional: backoff
    # All retries failed
    print(f"[Retry] All {retries+1} attempts failed for agent '{agent_fn.__name__}'. Logging failure.")
    if agent_name and category:
        try:
            log_agent_activity(agent_name, category, "Failed", str(last_exception))
        except Exception as log_err:
            print(f"[Retry] Error logging failure to Airtable: {log_err}")
    return False, f"All attempts failed: {last_exception}"
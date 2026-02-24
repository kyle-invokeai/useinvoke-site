from .airtable_logger import log_to_airtable

def airtable_logger_agent(prompt, agent_name="airtable_logger_agent", response_text=None):
    if response_text is None:
        response_text = f"Airtable Logger agent responding to: {prompt}"
    log_to_airtable(prompt, agent_name, response_text)
    return response_text
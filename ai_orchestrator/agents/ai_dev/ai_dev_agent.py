from agents.airtable_logger.utils.milestone_updater import update_milestone_status

def ai_dev_agent(prompt):
    if "implement retry button" in prompt.lower():
        update_milestone_status("Implement Retry button", status="Done", done=True)
        return f"AI Dev agent completed: {prompt}"
    return f"AI Dev agent responding to: {prompt}"
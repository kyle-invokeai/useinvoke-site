from agents.airtable_logger.utils.milestone_updater import update_milestone_status

def ai_infra_agent(prompt):
    if "deploy infrastructure" in prompt.lower():
        update_milestone_status("Deploy infrastructure", status="Done", done=True)
        return f"AI Infra agent completed: {prompt}"
    return f"AI Infra agent responding to: {prompt}"
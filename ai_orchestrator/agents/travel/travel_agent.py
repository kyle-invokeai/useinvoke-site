from agents.airtable_logger.utils.milestone_updater import update_milestone_status

def travel_agent(prompt):
    if "plan trip to tokyo" in prompt.lower():
        update_milestone_status("Plan trip to Tokyo", status="Done", done=True)
        return f"Travel agent completed: {prompt}"
    return f"Travel agent responding to: {prompt}"
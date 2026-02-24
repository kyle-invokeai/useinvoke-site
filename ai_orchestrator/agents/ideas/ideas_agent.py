from agents.airtable_logger.utils.milestone_updater import update_milestone_status

def ideas_agent(prompt):
    # Add logic to process the prompt and generate ideas
    if "design classifier agent" in prompt.lower():
        update_milestone_status("Design classifier agent", status="Done", done=True)
        return f"Ideas agent completed: {prompt}"
    return f"Ideas agent responding to: {prompt}"
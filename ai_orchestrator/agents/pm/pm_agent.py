import logging
from agents.airtable_logger.utils.milestone_updater import update_milestone_status

# Initialize logger
logger = logging.getLogger(__name__)

def pm_agent(prompt):
    if not prompt or not isinstance(prompt, str):
        logger.error("Invalid prompt provided to pm_agent")
        return "Error: Invalid prompt. Please provide a valid string."

    logger.info(f"PM agent received prompt: {prompt}")

    if "finalize mvp feature list" in prompt.lower():
        update_milestone_status("Finalize MVP feature list", status="Done", done=True)
        return f"PM agent completed: {prompt}"

    # Placeholder for future logic
    response = f"PM agent responding to: {prompt}"

    return response
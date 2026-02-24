import logging
from agents.airtable_logger.utils.milestone_updater import update_milestone_status

# Initialize logger
logger = logging.getLogger(__name__)

def pm_director_agent(prompt):
    if not prompt or not isinstance(prompt, str):
        logger.error("Invalid prompt provided to pm_director_agent")
        return "Error: Invalid prompt. Please provide a valid string."

    logger.info(f"PM Director agent received prompt: {prompt}")

    if "oversee project delivery" in prompt.lower():
        update_milestone_status("Oversee project delivery", status="Done", done=True)
        return f"PM Director agent completed: {prompt}"

    response = f"PM Director agent responding to: {prompt}"

    return response
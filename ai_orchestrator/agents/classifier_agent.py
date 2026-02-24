"""
Classifier Agent: Classifies prompts into agent categories using keyword and semantic matching.
"""
import re
from typing import Tuple
from agents.airtable_logger.airtable_logger import log_to_airtable

# List of known agent names (update as needed)
AGENT_CATEGORIES = [
    "travel_agent",
    "pm_agent",
    "ideas_agent",
    "summary_agent",
    "orchestrator_agent",
    "pm_director_agent",
    "airtable_logger_agent",
    "ai_dev_agent",
    "ai_infra_agent",
]

# Simple keyword mapping for each agent
AGENT_KEYWORDS = {
    "travel_agent": ["trip", "travel", "flight", "hotel", "itinerary"],
    "pm_agent": ["pm", "project", "task", "manage"],
    "ideas_agent": ["idea", "brainstorm", "suggestion"],
    "summary_agent": ["summarize", "summary", "recap"],
    "orchestrator_agent": ["orchestrate", "coordinate", "route"],
    "pm_director_agent": ["director", "lead", "oversee"],
    "airtable_logger_agent": ["log", "airtable", "record"],
    "ai_dev_agent": ["developer", "dev", "code", "build"],
    "ai_infra_agent": ["infra", "infrastructure", "deploy", "ops"],
}

CONFIDENCE_THRESHOLD = 0.5  # Adjust as needed

def classify_prompt(prompt: str) -> Tuple[str, float]:
    prompt_lower = prompt.lower()
    scores = {}
    for agent, keywords in AGENT_KEYWORDS.items():
        match_count = sum(1 for kw in keywords if re.search(rf"\\b{re.escape(kw)}\\b", prompt_lower))
        scores[agent] = match_count / len(keywords)
    best_agent = max(scores, key=scores.get)
    best_score = scores[best_agent]
    if best_score >= CONFIDENCE_THRESHOLD:
        return best_agent, best_score
    return "unclassified", best_score

def classifier_agent(prompt: str) -> str:
    agent, score = classify_prompt(prompt)
    # Log to Airtable Classifier Log
    try:
        log_to_airtable(prompt, "classifier_agent", f"Classified as: {agent} (score={score:.2f})")
    except Exception as e:
        print(f"[Classifier Log Error]: {e}")
    return agent

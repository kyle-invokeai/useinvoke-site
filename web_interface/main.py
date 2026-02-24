"""
Web interface for AI Agent Orchestrator
"""
import sys
import os
from pathlib import Path

# Add parent directory to path to allow imports from ai_orchestrator
parent_dir = str(Path(__file__).resolve().parent.parent)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from fastapi import FastAPI, Request, Form, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn
from typing import Optional
from pydantic import BaseModel
import logging

# Import from ai_orchestrator for agent routing
try:
    print("Attempting to import from ai_orchestrator...")
    from ai_orchestrator.agents.classifier_agent import classifier_agent
    from ai_orchestrator.__main__ import route_prompt
    print("Successfully imported from ai_orchestrator")
except Exception as e:
    print(f"ERROR importing from ai_orchestrator: {e}")
    print("This is likely the reason the server is shutting down")
    # Create placeholder functions for testing
    def classifier_agent(prompt):
        return "classifier_placeholder"
    
    def route_prompt(prompt):
        return "test_agent", f"Test response for: {prompt}"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="AI Agent Orchestrator")

# Mount static files
app.mount("/static", StaticFiles(directory="web_interface/static"), name="static")

# Setup Jinja2 templates
templates = Jinja2Templates(directory="web_interface/templates")

# Pydantic models for API requests/responses
class PromptRequest(BaseModel):
    prompt: str
    agent: Optional[str] = None

class PromptResponse(BaseModel):
    agent: Optional[str]
    response: str
    status: str

@app.get("/", response_class=HTMLResponse)
async def get_home(request: Request):
    """Render the home page with the agent interface"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/prompt", response_model=PromptResponse)
async def process_prompt(prompt_request: PromptRequest):
    """Process a prompt using the AI agent orchestrator"""
    try:
        # If specific agent is requested, use it directly
        if prompt_request.agent:
            logger.info(f"Routing to specific agent: {prompt_request.agent}")
            # This would need to be implemented in your main system
            agent_name, result = prompt_request.agent, f"Direct routing to {prompt_request.agent} not implemented yet"
        else:
            # Use the existing route_prompt function
            logger.info(f"Auto-routing prompt: {prompt_request.prompt}")
            agent_name, result = route_prompt(prompt_request.prompt)
        
        return PromptResponse(
            agent=agent_name,
            response=result,
            status="success"
        )
    except Exception as e:
        logger.error(f"Error processing prompt: {e}")
        return PromptResponse(
            agent=None,
            response=f"Error processing your request: {str(e)}",
            status="error"
        )

@app.get("/api/agents")
async def get_agents():
    """Get the list of available agents"""
    # Import the agent routing dictionary from your main module
    from ai_orchestrator.__main__ import AGENT_ROUTING
    
    agents = []
    for keyword, agent_func in AGENT_ROUTING.items():
        agent_name = agent_func.__name__ if callable(agent_func) else str(agent_func)
        agents.append({
            "keyword": keyword,
            "name": agent_name
        })
    
    return {"agents": agents}

def start():
    """Start the web server"""
    uvicorn.run("web_interface.main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    start()

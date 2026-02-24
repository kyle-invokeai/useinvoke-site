"""
Simplified web interface for AI Agent Orchestrator
"""
import os
import sys
from fastapi import FastAPI, Request, Form, Depends, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
from pathlib import Path
from pydantic import BaseModel
from typing import Optional

# Create FastAPI app
app = FastAPI(title="AI Agent Orchestrator")

# Get the directory of this file
BASE_DIR = Path(__file__).resolve().parent

# Set up templates and static files with absolute paths
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Models for API
class PromptRequest(BaseModel):
    prompt: str
    agent: Optional[str] = None

class PromptResponse(BaseModel):
    agent: Optional[str] = None
    response: str
    status: str

# Mock agent data for testing
MOCK_AGENTS = [
    {"keyword": "travel", "name": "Travel Agent"},
    {"keyword": "pm", "name": "Project Management Agent"},
    {"keyword": "summary", "name": "Summary Agent"},
    {"keyword": "ideas", "name": "Ideas Agent"},
]

# Routes
@app.get("/", response_class=HTMLResponse)
async def get_home(request: Request):
    """Render the home page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/prompt", response_model=PromptResponse)
async def process_prompt(prompt_request: PromptRequest):
    """Process a prompt (mock implementation)"""
    # This is a simplified version just to get the UI working
    agent_name = prompt_request.agent if prompt_request.agent else "test_agent"
    
    return PromptResponse(
        agent=agent_name,
        response=f"This is a test response for: '{prompt_request.prompt}'",
        status="success"
    )

@app.get("/api/agents")
async def get_agents():
    """Return list of available agents"""
    return {"agents": MOCK_AGENTS}

if __name__ == "__main__":
    print(f"Starting simplified web interface...")
    print(f"Base directory: {BASE_DIR}")
    print(f"Templates directory: {BASE_DIR / 'templates'}")
    print(f"Static directory: {BASE_DIR / 'static'}")
    
    # Start the server
    uvicorn.run(
        "simple_app:app", 
        host="127.0.0.1",
        port=8000, 
        reload=True,
        reload_dirs=[str(BASE_DIR)]
    )

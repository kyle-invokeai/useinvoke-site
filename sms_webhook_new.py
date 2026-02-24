from fastapi import FastAPI, Request, Form
from fastapi.responses import Response, JSONResponse
from twilio.twiml.messaging_response import MessagingResponse
import os
import json
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Parse allowlist from environment
ALLOWED_NUMBERS_STR = os.getenv("ALLOWED_NUMBERS", "")
ALLOWED_NUMBERS = set(num.strip() for num in ALLOWED_NUMBERS_STR.split(",") if num.strip())

# Load agent registry relative to script location
AGENTS_PATH = Path(__file__).with_name("agents.json")
with AGENTS_PATH.open("r", encoding="utf-8") as f:
    AGENTS_DATA = json.load(f)
    AGENT_NAMES = {agent["name"].lower() for agent in AGENTS_DATA["agents"]}
    AGENT_CONFIGS = {agent["name"].lower(): agent for agent in AGENTS_DATA["agents"]}

# In-memory event ring buffer (max 50 events)
MAX_EVENTS = 50
events = []

def log_event(from_number, authorized, raw_body, triggered, agent, prompt, reply_text, error):
    """Log an event to the ring buffer."""
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "from": from_number,
        "authorized": authorized,
        "raw_body": raw_body,
        "triggered": triggered,
        "agent": agent,
        "prompt": prompt,
        "reply_text": reply_text,
        "error": error
    }
    events.append(event)
    # Trim to max size (ring buffer)
    while len(events) > MAX_EVENTS:
        events.pop(0)

app = FastAPI()


@app.post("/sms")
async def sms_webhook(From: str = Form(...), Body: str = Form(...)):
    """Handle incoming SMS messages with authorization and agent routing."""
    
    # Authorization check: only allowlisted numbers can proceed
    authorized = From in ALLOWED_NUMBERS
    if not authorized:
        # Log unauthorized attempt
        log_event(From, False, Body, False, "", "", "", "")
        response = MessagingResponse()
        return Response(content=str(response), media_type="application/xml")
    
    # Check if message starts with // (case insensitive, ignore whitespace)
    stripped_body = Body.strip()
    triggered = stripped_body.lower().startswith("//")
    
    if not triggered:
        # Non-// messages ignored (empty TwiML)
        log_event(From, True, Body, False, "", "", "", "")
        response = MessagingResponse()
        return Response(content=str(response), media_type="application/xml")
    
    # Strip // trigger and whitespace
    remainder = stripped_body[2:].strip()
    
    # If empty after //, return help message
    if not remainder:
        help_text = "Usage: // <message> or //agent <message>"
        log_event(From, True, Body, True, "", "", help_text, "")
        response = MessagingResponse()
        response.message(help_text)
        return Response(content=str(response), media_type="application/xml")
    
    # Split on first space only
    parts = remainder.split(" ", 1)
    first_token = parts[0].lower().strip()
    rest = parts[1].strip() if len(parts) > 1 else ""
    
    # If first_token matches an agent name, route to that agent
    if first_token in AGENT_NAMES:
        agent_name = first_token
        prompt = rest if rest else "Help"
    else:
        # Route to default agent with full remainder as prompt
        agent_name = "default"
        prompt = remainder
    
    # Generate LLM response
    response = MessagingResponse()
    reply_text = ""
    error_text = ""
    
    # Check if OpenAI client is configured
    if client is None:
        reply_text = "Invoke not configured: OPENAI_API_KEY missing."
        log_event(From, True, Body, True, agent_name, prompt, reply_text, "")
        response.message(reply_text)
        return Response(content=str(response), media_type="application/xml")
    
    try:
        agent_config = AGENT_CONFIGS.get(agent_name, AGENT_CONFIGS.get("default"))
        system_prompt = agent_config.get("system_prompt", "You are a helpful assistant.")
        model = agent_config.get("model", "gpt-4o-mini")
        
        # Add SMS formatting constraint to system prompt
        sms_constraint = " Respond in <= 600 characters. Be direct. No markdown."
        
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt + sms_constraint},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        reply_text = completion.choices[0].message.content.strip()
        # Hard trim to prevent SMS overrun
        reply_text = reply_text[:600]
        response.message(reply_text)
    except Exception as e:
        error_text = str(e)
        reply_text = "Invoke error. Try again."
        response.message(reply_text)
    
    # Log the event
    log_event(From, True, Body, True, agent_name, prompt, reply_text, error_text)
    
    return Response(content=str(response), media_type="application/xml")


@app.get("/debug/events")
async def get_debug_events():
    """Return events as JSON (most recent first)."""
    return JSONResponse(content={"events": list(reversed(events))})


@app.get("/ui")
async def get_ui():
    """Serve the debug UI HTML page."""
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoke Debug UI</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f7;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            gap: 20px;
        }
        .phone-frame {
            width: 375px;
            background: #1c1c1e;
            border-radius: 50px;
            padding: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .screen {
            background: #fff;
            border-radius: 30px;
            height: 667px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .status-bar {
            background: #f2f2f7;
            padding: 10px 20px;
            text-align: center;
            font-size: 14px;
            font-weight: 600;
            border-bottom: 1px solid #e5e5ea;
        }
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            background: #fff;
        }
        .bubble {
            max-width: 75%;
            padding: 10px 14px;
            margin-bottom: 10px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
            word-wrap: break-word;
        }
        .bubble-user {
            background: #007aff;
            color: white;
            margin-left: auto;
            border-bottom-right-radius: 4px;
        }
        .bubble-assistant {
            background: #e5e5ea;
            color: #000;
            margin-right: auto;
            border-bottom-left-radius: 4px;
        }
        .debug-panel {
            flex: 1;
            background: #fff;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-height: 727px;
            overflow-y: auto;
        }
        .debug-panel h2 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #1c1c1e;
        }
        .event-card {
            background: #f9f9fb;
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 12px;
            border-left: 4px solid #007aff;
        }
        .event-card.unauthorized {
            border-left-color: #ff3b30;
            opacity: 0.7;
        }
        .event-card.not-triggered {
            border-left-color: #8e8e93;
            opacity: 0.7;
        }
        .event-header {
            font-size: 12px;
            color: #8e8e93;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }
        .event-row {
            display: flex;
            margin-bottom: 6px;
            font-size: 13px;
        }
        .event-label {
            font-weight: 600;
            color: #3a3a3c;
            width: 80px;
            flex-shrink: 0;
        }
        .event-value {
            color: #1c1c1e;
            word-break: break-all;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge-ok { background: #34c759; color: white; }
        .badge-fail { background: #ff3b30; color: white; }
        .badge-neutral { background: #8e8e93; color: white; }
        .empty-state {
            text-align: center;
            color: #8e8e93;
            padding: 40px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="phone-frame">
            <div class="screen">
                <div class="status-bar">Invoke Debug</div>
                <div class="chat-container" id="chatContainer">
                    <div class="empty-state">No messages yet...</div>
                </div>
            </div>
        </div>
        <div class="debug-panel">
            <h2>Debug Events (Last 50)</h2>
            <div id="eventsContainer">
                <div class="empty-state">Waiting for events...</div>
            </div>
        </div>
    </div>
    <script>
        let lastEvents = [];
        
        function renderChat(events) {
            const container = document.getElementById('chatContainer');
            if (events.length === 0) {
                container.innerHTML = '<div class="empty-state">No messages yet...</div>';
                return;
            }
            
            let html = '';
            // Show events in chronological order for chat
            const chronological = [...events].reverse();
            
            chronological.forEach(event => {
                // User message bubble
                html += `<div class="bubble bubble-user">${escapeHtml(event.raw_body)}</div>`;
                
                // Assistant reply if triggered and has reply
                if (event.triggered && event.reply_text) {
                    html += `<div class="bubble bubble-assistant">${escapeHtml(event.reply_text)}</div>`;
                }
            });
            
            container.innerHTML = html;
            container.scrollTop = container.scrollHeight;
        }
        
        function renderEvents(events) {
            const container = document.getElementById('eventsContainer');
            if (events.length === 0) {
                container.innerHTML = '<div class="empty-state">Waiting for events...</div>';
                return;
            }
            
            let html = '';
            events.forEach(event => {
                let cardClass = 'event-card';
                if (!event.authorized) cardClass += ' unauthorized';
                else if (!event.triggered) cardClass += ' not-triggered';
                
                const authBadge = event.authorized 
                    ? '<span class="badge badge-ok">Authorized</span>' 
                    : '<span class="badge badge-fail">Unauthorized</span>';
                const triggerBadge = event.triggered 
                    ? '<span class="badge badge-ok">Triggered</span>' 
                    : '<span class="badge badge-neutral">Not Triggered</span>';
                
                html += `<div class="${cardClass}">
                    <div class="event-header">
                        <span>${new Date(event.timestamp).toLocaleTimeString()}</span>
                        <span>${authBadge} ${triggerBadge}</span>
                    </div>
                    <div class="event-row">
                        <div class="event-label">From:</div>
                        <div class="event-value">${escapeHtml(event.from)}</div>
                    </div>
                    <div class="event-row">
                        <div class="event-label">Raw Body:</div>
                        <div class="event-value">${escapeHtml(event.raw_body)}</div>
                    </div>`;
                
                if (event.triggered) {
                    html += `
                    <div class="event-row">
                        <div class="event-label">Agent:</div>
                        <div class="event-value">${escapeHtml(event.agent || 'default')}</div>
                    </div>
                    <div class="event-row">
                        <div class="event-label">Prompt:</div>
                        <div class="event-value">${escapeHtml(event.prompt)}</div>
                    </div>
                    <div class="event-row">
                        <div class="event-label">Reply:</div>
                        <div class="event-value">${escapeHtml(event.reply_text)}</div>
                    </div>`;
                }
                
                if (event.error) {
                    html += `
                    <div class="event-row">
                        <div class="event-label">Error:</div>
                        <div class="event-value" style="color: #ff3b30;">${escapeHtml(event.error)}</div>
                    </div>`;
                }
                
                html += '</div>';
            });
            
            container.innerHTML = html;
        }
        
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        async function pollEvents() {
            try {
                const response = await fetch('/debug/events');
                const data = await response.json();
                
                if (JSON.stringify(data.events) !== JSON.stringify(lastEvents)) {
                    lastEvents = data.events;
                    renderChat(data.events);
                    renderEvents(data.events);
                }
            } catch (e) {
                console.error('Poll error:', e);
            }
        }
        
        // Initial load and polling
        pollEvents();
        setInterval(pollEvents, 1500);
    </script>
</body>
</html>"""
    return Response(content=html, media_type="text/html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

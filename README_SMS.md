# Invoke V1 - Chapter 9 (LLM Integration)

A minimal FastAPI Twilio SMS webhook with phone number allowlist authorization and OpenAI LLM integration.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

## Environment Variables

Set these in your `.env` file:

```
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here

# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Authorization - comma-separated list of allowed phone numbers
ALLOWED_NUMBERS=+15551234567,+15557654321
```

- Get OpenAI API key from https://platform.openai.com/api-keys
- Phone numbers must include country code (+1 for US)
- Whitespace around numbers is stripped automatically

## Running the Server

```bash
python sms_webhook.py
```

The server will start on `http://localhost:8000`

## Ngrok Setup (for local development)

1. **Start ngrok:**
   ```bash
   ngrok http 8000
   ```

2. **Copy the HTTPS URL** from ngrok output (e.g., `https://abc123.ngrok.io`)

## Twilio Configuration

1. **Log in to Twilio Console** (https://console.twilio.com)

2. **Navigate to Messaging > Senders > Phone Numbers**
   - Select your Twilio phone number
   - Scroll down to "Messaging"
   - In "A MESSAGE COMES IN" webhook field, enter:
     ```
     https://your-ngrok-url.ngrok.io/sms
     ```
   - Set HTTP method to `POST`
   - Click "Save"

## Debug UI (Local Development)

View live message logs and iPhone-style chat mockup:

- **Debug UI**: http://127.0.0.1:8000/ui
- **Events API**: http://127.0.0.1:8000/debug/events

The UI auto-refreshes every 1.5 seconds and shows:
- Left: iPhone chat bubbles (user messages + assistant replies)
- Right: Debug event details (authorization, agent, prompt, reply, errors)

## Testing

### LLM Response Tests (Authorized Numbers)

1. **Send `//hello` from authorized number** → LLM response from default agent (concise, <=600 chars)
2. **Send `//commish settle this` from authorized number** → Commissioner-style LLM response
3. **Send `//` from authorized number** → Help message: "Usage: // <message> or //agent <message>"
4. **Send `//unknown hi` from authorized number** → Treated as default agent (unknown = not special)
5. **Send `hello` from authorized number** → No response (200 OK with empty TwiML)

### Unauthorized Number Tests

1. **Send `//hello` from unauthorized number** → Empty TwiML (silently ignored)
2. **Send any message from unauthorized number** → Empty TwiML (silently ignored)

### Quick curl tests:
```bash
# Authorized: default agent LLM response
curl -X POST http://localhost:8000/sms \
  -d "From=+15551234567" \
  -d "Body=//explain quantum computing"

# Authorized: commish agent LLM response
curl -X POST http://localhost:8000/sms \
  -d "From=+15551234567" \
  -d "Body=//commish settle this dispute"

# Authorized: help message
curl -X POST http://localhost:8000/sms \
  -d "From=+15551234567" \
  -d "Body=//"

# Authorized: unknown agent → default
curl -X POST http://localhost:8000/sms \
  -d "From=+15551234567" \
  -d "Body=//unknown hi"

# Unauthorized: empty TwiML
curl -X POST http://localhost:8000/sms \
  -d "From=+19999999999" \
  -d "Body=//hello"
```

## File Structure

- `sms_webhook.py` - Main FastAPI application with SMS webhook, authorization, and LLM integration
- `agents.json` - Agent registry (default, commish) with system prompts and model configs
- `.env.example` - Environment variables template
- `requirements.txt` - Python dependencies
- `README_SMS.md` - This documentation

## Expected Behavior

- Only allowlisted phone numbers can trigger LLM responses
- Non-allowlisted numbers receive empty TwiML (silently ignored)
- `// <prompt>` → OpenAI LLM response via default agent (concise, <=600 chars, no markdown)
- `//commish <prompt>` → OpenAI LLM response via commissioner agent
- `//` → Help message
- Unknown agent names treated as default agent
- OpenAI errors return: "Invoke error. Try again."
- All other messages return empty TwiML (200 OK)

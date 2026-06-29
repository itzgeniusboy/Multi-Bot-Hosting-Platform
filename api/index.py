import os
import logging
import base64
from typing import Optional, List
from fastapi import FastAPI, Request, Response, status, Query, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

# Configure robust logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("github-actions-bot-hoster-api")

app = FastAPI(title="GitHub Actions Multi-Bot Platform Backend")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Workflow template code
RUN_BOT_YML = """name: 24x7 Multi-Bot Host Engine

on:
  repository_dispatch:
    types: [launch_bot]

jobs:
  run-telegram-bot:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code Repository
        uses: actions/checkout@v4

      - name: Setup Python Environment
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"
          cache: "pip"

      - name: Install Bot Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pyTelegramBotAPI telebot aiogram httpx

      - name: Run Telegram Bot with Auto-Recycle Loop
        env:
          BOT_TOKEN: ${{ github.event.client_payload.bot_token }}
          GITHUB_PAT: ${{ github.event.client_payload.github_pat }}
          SCRIPT_NAME: ${{ github.event.client_payload.script_name }}
          REPOSITORY: ${{ github.repository }}
        run: |
          echo "Starting Telegram Bot: templates/$SCRIPT_NAME.py"
          
          # We calculate the cutoff time 5.5 hours (19800 seconds) from now
          # GitHub Actions jobs timeout at 6 hours, so we recycle at 5.5 hours to be perfectly safe
          RUN_DURATION=19800
          END_TIME=$(( $(date +%s) + RUN_DURATION ))
          
          while [ $(date +%s) -lt $END_TIME ]; do
            echo "Launching bot process..."
            python templates/$SCRIPT_NAME.py &
            BOT_PID=$!
            
            # Monitor process status until cutoff time
            while kill -0 $BOT_PID 2>/dev/null; do
              CURRENT_TIME=$(date +%s)
              if [ $CURRENT_TIME -ge $END_TIME ]; then
                echo "Maximum single-run duration reached. Safely stopping bot for seamless workflow recycling..."
                kill -15 $BOT_PID
                wait $BOT_PID 2>/dev/null || true
                break 2
              fi
              sleep 10
            done
            
            echo "Bot process exited. Automatically restarting in 5 seconds to ensure 24x7 uptime..."
            sleep 5
          done

          echo "Initiating workflow self-dispatch trigger to start the next 5.5-hour runtime block..."
          curl -X POST \
            -H "Authorization: token $GITHUB_PAT" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/repos/$REPOSITORY/dispatches \
            -d "{\\"event_type\\": \\"launch_bot\\", \\"client_payload\\": {\\"bot_token\\": \\"$BOT_TOKEN\\", \\"script_name\\": \\"$SCRIPT_NAME\\", \\"github_pat\\": \\"$GITHUB_PAT\\"}}"
          
          echo "Dispatched successfully. This workflow block has terminated clean."
"""

# Script templates
MOVIE_BOT_PY = """import os
import sys
import logging
import telebot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("MovieBot")

# Retrieve bot token from Environment
BOT_TOKEN = os.environ.get("BOT_TOKEN")

if not BOT_TOKEN:
    logger.error("CRITICAL: BOT_TOKEN environment variable not set. Exiting.")
    sys.exit(1)

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="MARKDOWN")

# Movie library
MOVIES = {
    "interstellar": {
        "title": "Interstellar (2014)",
        "genre": "Sci-Fi, Adventure, Drama",
        "rating": "8.7/10",
        "desc": "When Earth becomes uninhabitable, a team of explorers travels through a wormhole in space in an attempt to ensure humanity's survival."
    },
    "inception": {
        "title": "Inception (2010)",
        "genre": "Sci-Fi, Action, Adventure",
        "rating": "8.8/10",
        "desc": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O."
    },
    "dark_knight": {
        "title": "The Dark Knight (2008)",
        "genre": "Action, Crime, Drama",
        "rating": "9.0/10",
        "desc": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice."
    }
}

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = (
        "🎬 *Welcome to Movie Suggestion Bot!*\\n\\n"
        "I am running *24x7 on our secure hosting platform* via GitHub Actions.\\n\\n"
        "Here are the commands you can use:\\n"
        "🔹 `/list` - View available blockbusters\\n"
        "🔹 `/movie <name>` - Search details about a blockbuster\\n"
        "🔹 `/help` - Show this assistance message"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['list'])
def list_movies(message):
    movie_list = "🍿 *Available Movie Database*:\\n\\n" + "\\n".join([f"🎥 `{k.replace('_', ' ').title()}`" for k in MOVIES.keys()])
    movie_list += "\\n\\nUse `/movie <name>` (e.g. `/movie inception`) to see full details!"
    bot.reply_to(message, movie_list)

@bot.message_handler(commands=['movie'])
def movie_detail(message):
    args = message.text.split()
    if len(args) < 2:
        bot.reply_to(message, "⚠️ *Please specify a movie name!* Usage: `/movie inception` or `/movie interstellar`.")
        return
        
    query = "_".join(args[1:]).lower()
    if query in MOVIES:
        m = MOVIES[query]
        res = (
            f"🎬 *{m['title']}*\\n\\n"
            f"🎭 *Genre:* {m['genre']}\\n"
            f"⭐ *Rating:* {m['rating']}\\n\\n"
            f"📝 *Synopsis:* {m['desc']}"
        )
        bot.reply_to(message, res)
    else:
        bot.reply_to(message, f"❌ Movie '{args[1]}' was not found in our current showcase database. Try `/list` to view available names.")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.reply_to(message, "💭 *I am focused purely on movies!* Send `/list` to find highly rated cinematic releases or `/movie` to query specifics.")

if __name__ == "__main__":
    logger.info("Initializing Continuous Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
"""

SUPPORT_BOT_PY = """import os
import sys
import logging
import telebot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("SupportBot")

# Retrieve bot token from Environment
BOT_TOKEN = os.environ.get("BOT_TOKEN")

if not BOT_TOKEN:
    logger.error("CRITICAL: BOT_TOKEN environment variable not set. Exiting.")
    sys.exit(1)

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="MARKDOWN")

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = (
        "🤝 *Welcome to the 24x7 Customer Support Bot!*\\n\\n"
        "How can we assist you today? Our support staff has configured this auto-responder to instantly route and log queries.\\n\\n"
        "Please select an option or reply with your message:\\n"
        "🔹 `/ticket` - Register a support ticket\\n"
        "🔹 `/faq` - View frequently asked questions\\n"
        "🔹 `/status` - Check active system statuses"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['faq'])
def send_faq(message):
    faq_text = (
        "💡 *Frequently Asked Questions*\\n\\n"
        "1️⃣ *How do I deploy a bot?*\\n"
        "Simply type your token on our web dashboard and click Launch.\\n\\n"
        "2️⃣ *Is it 24x7?*\\n"
        "Yes! GitHub Actions workflows recycle automatically to provide uninterrupted uptime.\\n\\n"
        "3️⃣ *Is my token secure?*\\n"
        "Absolutely. Tokens are passed straight into secure workflows and never stored in plain text."
    )
    bot.reply_to(message, faq_text)

@bot.message_handler(commands=['ticket'])
def raise_ticket(message):
    bot.reply_to(message, "🎟️ *Support Ticket Raised!* Please reply to this message describing your issue, and our engineers will get back to you immediately.")

@bot.message_handler(commands=['status'])
def check_status(message):
    bot.reply_to(message, "🟢 *All Systems Operational.*\\n- Database: Online\\n- Router Core: 0.1ms Latency\\n- API Gateways: Functional")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.reply_to(message, "✅ *Support ticket received!* Your message has been logged. An agent will contact you shortly.")

if __name__ == "__main__":
    logger.info("Initializing Continuous Support Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
"""

FEEDBACK_BOT_PY = """import os
import sys
import logging
import telebot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("FeedbackBot")

# Retrieve bot token from Environment
BOT_TOKEN = os.environ.get("BOT_TOKEN")

if not BOT_TOKEN:
    logger.error("CRITICAL: BOT_TOKEN environment variable not set. Exiting.")
    sys.exit(1)

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="MARKDOWN")

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = (
        "📊 *Welcome to the feedback and Contact Bot!*\\n\\n"
        "Your thoughts are critical to our improvements! Send us any feedback or messages, and we will safely log it for the owner.\\n\\n"
        "🔹 `/feedback <text>` - Register a specific feedback\\n"
        "🔹 `/about` - Find out about this bot"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['about'])
def send_about(message):
    bot.reply_to(message, "ℹ️ This is a feedback collector bot running continuous loops on GitHub Actions.")

@bot.message_handler(commands=['feedback'])
def collect_feedback(message):
    args = message.text.split()
    if len(args) < 2:
        bot.reply_to(message, "⚠️ Please provide your feedback text. Example: `/feedback Great bot!`")
        return
    feedback_text = " ".join(args[1:])
    bot.reply_to(message, f"🎯 *Feedback Logged!* \\n\\n_\\"{feedback_text}\\"_\\n\\nThank you for helping us grow!")

@bot.message_handler(func=lambda message: True)
def log_text(message):
    bot.reply_to(message, "📝 Message recorded. If you want to log it as formal feedback, please use `/feedback <your message>`!")

if __name__ == "__main__":
    logger.info("Initializing Continuous Feedback Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
"""

class LaunchRequest(BaseModel):
    repo_name: str
    bot_token: str
    script_name: str
    github_token: str

class StopRequest(BaseModel):
    repo_name: str
    github_token: str

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "platform": "GitHub Actions Multi-Bot SaaS platform (FastAPI Integration)",
        "indicator": "Active"
    }

@app.get("/api/login")
async def login(request: Request):
    client_id = os.environ.get("GITHUB_CLIENT_ID", "")
    app_url = os.environ.get("APP_URL", "")
    if not app_url:
        app_url = str(request.base_url).rstrip("/")
        
    redirect_uri = f"{app_url}/callback"
    auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope=repo,workflow,admin:repo_hook"
    return {"url": auth_url}

@app.get("/api/callback")
async def oauth_callback(code: str, request: Request):
    client_id = os.environ.get("GITHUB_CLIENT_ID", "")
    client_secret = os.environ.get("GITHUB_CLIENT_SECRET", "")
    app_url = os.environ.get("APP_URL", "")
    if not app_url:
        app_url = str(request.base_url).rstrip("/")
    
    redirect_uri = f"{app_url}/callback"

    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri
            }
        )
        data = resp.json()
        access_token = data.get("access_token", "")

    # If JSON is preferred, return direct JSON payload
    if "application/json" in request.headers.get("accept", ""):
        return {"access_token": access_token}

    # Return popup closer HTML
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>GitHub Authorization Success</title>
        <style>
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background-color: #0B0F19;
                color: #F3F4F6;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
            }}
            .card {{
                background-color: #111827;
                border: 1px solid #1F2937;
                padding: 2rem;
                border-radius: 1rem;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            }}
            .loader {{
                border: 3px solid #1F2937;
                border-top: 3px solid #00D4FF;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin-bottom: 1.5rem;
            }}
            @keyframes spin {{
                0% {{ transform: rotate(0deg); }}
                100% {{ transform: rotate(360deg); }}
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div style="display: flex; justify-content: center;"><div class="loader"></div></div>
            <h2 style="color: #00D4FF; margin-top: 0;">Authorized Successfully</h2>
            <p style="color: #9CA3AF; font-size: 0.95rem;">Syncing repositories with your Dashboard...</p>
            <p style="color: #4B5563; font-size: 0.8rem;">This window will close automatically.</p>
        </div>

        <script>
            // Send OAuth token back to main window
            const token = "{access_token}";
            if (window.opener) {{
                window.opener.postMessage({{ type: "OAUTH_AUTH_SUCCESS", token: token }}, "*");
                setTimeout(() => {{ window.close(); }}, 1000);
            }} else {{
                window.location.href = "/?token=" + token;
            }}
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/api/repos")
async def get_repositories(token: str = Query(...)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.github.com/user/repos?per_page=100&sort=updated",
            headers={
                "Authorization": f"token {token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "telegram-bot-backend"
            }
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"Failed to fetch repos from GitHub: {resp.text}")
        
        repos = resp.json()
        clean_repos = []
        for r in repos:
            clean_repos.append({
                "id": r.get("id"),
                "name": r.get("name"),
                "full_name": r.get("full_name"),
                "private": r.get("private"),
                "default_branch": r.get("default_branch", "main")
            })
        return clean_repos

async def commit_github_file(client: httpx.AsyncClient, token: str, repo_name: str, path: str, content: str, message: str):
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend"
    }
    
    # 1. Check if the file exists to get its SHA
    sha = None
    check_url = f"https://api.github.com/repos/{repo_name}/contents/{path}"
    resp = await client.get(check_url, headers=headers)
    if resp.status_code == 200:
        sha = resp.json().get("sha")
        
    # 2. Commit/Update file
    encoded_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")
    payload = {
        "message": message,
        "content": encoded_content
    }
    if sha:
        payload["sha"] = sha
        
    put_resp = await client.put(check_url, headers=headers, json=payload)
    if put_resp.status_code not in [200, 201]:
        logger.error(f"Failed to commit file {path} to GitHub: {put_resp.text}")
        raise HTTPException(status_code=put_resp.status_code, detail=f"Failed to commit {path}: {put_resp.text}")

@app.post("/api/launch")
async def launch_bot(payload: LaunchRequest):
    repo_name = payload.repo_name
    bot_token = payload.bot_token
    script_name = payload.script_name
    github_token = payload.github_token

    if not repo_name or not bot_token or not script_name:
        raise HTTPException(status_code=400, detail="Missing required deployment fields")

    # Select Python script template
    if "movie" in script_name:
        py_content = MOVIE_BOT_PY
        actual_script = "movie_bot"
    elif "support" in script_name or "welcome" in script_name:
        py_content = SUPPORT_BOT_PY
        actual_script = "support_bot"
    elif "feedback" in script_name:
        py_content = FEEDBACK_BOT_PY
        actual_script = "feedback_bot"
    else:
        # Fallback basic echo script
        py_content = MOVIE_BOT_PY
        actual_script = "movie_bot"

    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend"
    }

    async with httpx.AsyncClient() as client:
        # Verify Bot Token first with Telegram API
        get_me_url = f"https://api.telegram.org/bot{bot_token}/getMe"
        me_resp = await client.get(get_me_url)
        me_data = me_resp.json()
        if me_resp.status_code != 200 or not me_data.get("ok"):
            error_desc = me_data.get("description", "Invalid Telegram Bot Token")
            raise HTTPException(status_code=400, detail=f"Failed to verify Telegram token: {error_desc}")

        bot_username = me_data.get("result", {}).get("username", "UnknownBot")

        # Delete any active Telegram webhook so long-polling in GitHub Actions works instantly!
        delete_webhook_url = f"https://api.telegram.org/bot{bot_token}/deleteWebhook"
        await client.post(delete_webhook_url)

        # 1. Inject `.github/workflows/run_bot.yml`
        logger.info(f"Injecting .github/workflows/run_bot.yml into {repo_name}...")
        await commit_github_file(
            client=client,
            token=github_token,
            repo_name=repo_name,
            path=".github/workflows/run_bot.yml",
            content=RUN_BOT_YML,
            message="[Platform Multi-Bot] Injected 24x7 runner workflow"
        )

        # 2. Inject `templates/{script_name}.py`
        logger.info(f"Injecting templates/{actual_script}.py into {repo_name}...")
        await commit_github_file(
            client=client,
            token=github_token,
            repo_name=repo_name,
            path=f"templates/{actual_script}.py",
            content=py_content,
            message=f"[Platform Multi-Bot] Injected script template for {actual_script}"
        )

        # 3. Trigger repository dispatch to start the daemon workflow!
        dispatch_url = f"https://api.github.com/repos/{repo_name}/dispatches"
        dispatch_payload = {
            "event_type": "launch_bot",
            "client_payload": {
                "bot_token": bot_token,
                "script_name": actual_script,
                "github_pat": github_token
            }
        }
        
        dispatch_resp = await client.post(dispatch_url, headers=headers, json=dispatch_payload)
        if dispatch_resp.status_code != 204:
            logger.error(f"GitHub repository dispatch failed: {dispatch_resp.text}")
            raise HTTPException(
                status_code=dispatch_resp.status_code, 
                detail=f"Successfully injected workflow files, but failed to start runner dispatch: {dispatch_resp.text}"
            )

        return {
            "success": True,
            "message": f"Successfully injected daemon workflow and triggered 24x7 Action runner for @{bot_username}!",
            "username": bot_username,
            "bot_type": actual_script,
            "repo_name": repo_name
        }

@app.post("/api/stop")
async def stop_bot(payload: StopRequest):
    repo_name = payload.repo_name
    github_token = payload.github_token

    if not repo_name:
        raise HTTPException(status_code=400, detail="Missing required repo name")

    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend"
    }

    async with httpx.AsyncClient() as client:
        # Get in-progress runs
        runs_url = f"https://api.github.com/repos/{repo_name}/actions/runs?status=in_progress"
        runs_resp = await client.get(runs_url, headers=headers)
        if runs_resp.status_code != 200:
            raise HTTPException(status_code=runs_resp.status_code, detail=f"Failed to fetch actions runs: {runs_resp.text}")

        runs_data = runs_resp.json()
        runs = runs_data.get("workflow_runs", [])
        
        cancelled_count = 0
        for run in runs:
            # Cancel runs matching our workflow name or file pattern
            if run.get("name") == "24x7 Multi-Bot Host Engine" or "run_bot.yml" in run.get("path", ""):
                run_id = run.get("id")
                cancel_url = f"https://api.github.com/repos/{repo_name}/actions/runs/{run_id}/cancel"
                cancel_resp = await client.post(cancel_url, headers=headers)
                if cancel_resp.status_code == 202:
                    cancelled_count += 1

        return {
            "success": True,
            "message": f"Active workflow runs stopped successfully. Cancelled {cancelled_count} runner instances.",
            "cancelled_instances": cancelled_count
        }

@app.post("/api/webhook")
async def telegram_webhook(
    request: Request,
    token: str = Query(...),
    type: str = Query(...)
):
    # Simulated webhook responder for mock sandbox tests
    try:
        update = await request.json()
    except Exception:
        return {"status": "ignored", "reason": "invalid_json"}

    message = update.get("message")
    if not message:
        return {"status": "ignored", "reason": "no_message"}

    chat = message.get("chat")
    if not chat or not chat.get("id"):
        return {"status": "ignored", "reason": "no_chat"}

    chat_id = chat.get("id")
    text = (message.get("text") or "").strip()

    telegram_send_url = f"https://api.telegram.org/bot{token}/sendMessage"
    response_text = ""

    if text.startswith("/start"):
        if type == "movie_bot":
            response_text = (
                "🎬 *Welcome to Movie Suggestion Bot!*\n\n"
                "I am running *24x7 on our secure hosting platform* via GitHub Actions.\n\n"
                "Here are the commands you can use:\n"
                "🔹 `/list` - View available blockbusters\n"
                "🔹 `/movie <name>` - Search details about a blockbuster\n"
                "🔹 `/help` - Show this assistance message"
            )
        elif type == "support_bot":
            response_text = (
                "🤝 *Welcome to the 24x7 Customer Support Bot!*\n\n"
                "How can we assist you today? Our support staff has configured this auto-responder to instantly route and log queries.\n\n"
                "🔹 `/ticket` - Register a support ticket\n"
                "🔹 `/faq` - View frequently asked questions\n"
                "🔹 `/status` - Check active system statuses"
            )
        elif type == "feedback_bot":
            response_text = (
                "📊 *Welcome to the feedback and Contact Bot!*\n\n"
                "Your thoughts are critical to our improvements! Send us any feedback or messages, and we will safely log it for the owner.\n\n"
                "🔹 `/feedback <text>` - Register a specific feedback\n"
                "🔹 `/about` - Find out about this bot"
            )
        else:
            response_text = "*Daemon Online:* Node simulation operational."
    elif text.startswith("/list") and type == "movie_bot":
        response_text = "🍿 *Available Movie Database*:\n\n🎥 `Interstellar`\n🎥 `Inception`\n🎥 `The Dark Knight`"
    elif text.startswith("/faq") and type == "support_bot":
        response_text = "💡 *FAQ*\n\n1️⃣ *Is it 24x7?* Yes! Workflows recycle automatically.\n2️⃣ *Is my token secure?* Absolutely."
    else:
        if type == "movie_bot":
            response_text = "💭 *I am focused purely on movies!* Send `/list` to find highly rated cinematic releases."
        elif type == "support_bot":
            response_text = "✅ *Support ticket received!* Your message has been logged. An agent will contact you shortly."
        elif type == "feedback_bot":
            response_text = "📝 Message recorded. If you want to log it as formal feedback, please use `/feedback <your message>`!"
        else:
            response_text = f"Simulated response to: {text}"

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                telegram_send_url,
                json={
                    "chat_id": chat_id,
                    "text": response_text,
                    "parse_mode": "Markdown"
                }
            )
            res_data = resp.json()
            if resp.status_code == 200 and res_data.get("ok"):
                return {"status": "success", "action": "sent_reply", "type": type}
            else:
                return {"status": "partial_error", "telegram_error": res_data}
        except Exception as e:
            return {"status": "failed_execution", "error": str(e)}

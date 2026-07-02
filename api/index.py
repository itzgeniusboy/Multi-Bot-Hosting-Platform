import os
import logging
import base64
import json
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
          BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          GITHUB_PAT: ${{ github.event.client_payload.github_pat }}
          SCRIPT_NAME: ${{ github.event.client_payload.script_name }}
          REPOSITORY: ${{ github.repository }}
        run: |
          echo "Starting Telegram Bot: $SCRIPT_NAME"
          
          # We calculate the cutoff time 5.5 hours (19800 seconds) from now
          # GitHub Actions jobs timeout at 6 hours, so we recycle at 5.5 hours to be perfectly safe
          RUN_DURATION=19800
          END_TIME=$(( $(date +%s) + RUN_DURATION ))
          
          while [ $(date +%s) -lt $END_TIME ]; do
            echo "Launching bot process..."
            python $SCRIPT_NAME &
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
            -d "{\\"event_type\\": \\"launch_bot\\", \\"client_payload\\": {\\"script_name\\": \\"$SCRIPT_NAME\\", \\"github_pat\\": \\"$GITHUB_PAT\\"}}"
          
          echo "Dispatched successfully. This workflow block has terminated clean."
"""

# Preset script templates
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

# Retrieve bot token securely from Env
BOT_TOKEN = os.environ.get("BOT_TOKEN")

if not BOT_TOKEN:
    logger.error("CRITICAL: BOT_TOKEN environment variable not set. Exiting.")
    sys.exit(1)

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="MARKDOWN")

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
        "desc": "When the menace known as the Joker wreaks havoc and chaos on Gotham, Batman must accept one of the greatest physical and psychological tests."
    }
}

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = (
        "🍿 *Welcome to Movie Suggestion Bot!*\\n\\n"
        "I am running 24x7 on our secure hosting platform via GitHub Actions.\\n\\n"
        "Commands available:\\n"
        "• /list - View available blockbusters\\n"
        "• /movie <name> - Search details about a film\\n"
        "• /help - Show this assistance message"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['list'])
def list_movies(message):
    movie_list = "*Available Blockbusters:*\\n" + "\\n".join([f"- *{m['title']}* (Type `/movie {k}`)" for k, m in MOVIES.items()])
    bot.reply_to(message, movie_list)

@bot.message_handler(commands=['movie'])
def search_movie(message):
    args = message.text.split()
    if len(args) < 2:
        bot.reply_to(message, "Please specify a movie key. Example: `/movie inception`")
        return
    query = args[1].lower()
    if query in MOVIES:
        m = MOVIES[query]
        info = f"🎬 *{m['title']}*\\n\\n*Genre:* {m['genre']}\\n*Rating:* ⭐ {m['rating']}\\n\\n{m['desc']}"
        bot.reply_to(message, info)
    else:
        bot.reply_to(message, "Movie not found. Try `/movie interstellar`, `/movie inception` or `/movie dark_knight`!")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.reply_to(message, "Send /list to find blockbuster movies or /movie <name> to check stats.")

if __name__ == "__main__":
    logger.info("Initializing Continuous Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
"""

SUPPORT_BOT_PY = """import os
import sys
import logging
import telebot

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("SupportBot")

BOT_TOKEN = os.environ.get("BOT_TOKEN")

if not BOT_TOKEN:
    logger.error("CRITICAL: BOT_TOKEN environment variable not set. Exiting.")
    sys.exit(1)

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="MARKDOWN")

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = (
        "🛠️ *24x7 Customer Support Bot*\\n\\n"
        "How can we assist you today? Instant routing is online.\\n\\n"
        "• /ticket - Register a support ticket\\n"
        "• /faq - View frequently asked questions\\n"
        "• /status - Check active system statuses"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['faq'])
def send_faq(message):
    faq_text = (
        "💡 *Frequently Asked Questions*\\n\\n"
        "*Q: How do I deploy a bot?*\\n"
        "Simply type your token on our web dashboard and click Launch.\\n\\n"
        "*Q: Is it really 24x7?*\\n"
        "Yes! GitHub Actions workflows recycle automatically to provide continuous runtime.\\n\\n"
        "*Q: Is my token secure?*\\n"
        "Absolutely. Tokens are saved securely to repository secrets."
    )
    bot.reply_to(message, faq_text)

@bot.message_handler(commands=['ticket'])
def raise_ticket(message):
    bot.reply_to(message, "✅ *Support Ticket Created!* Describe your issue right here and our support staff will contact you.")

@bot.message_handler(commands=['status'])
def check_status(message):
    bot.reply_to(message, "🟢 *All Systems Operational*\\n\\n- Database: Operational\\n- Runner Loop: Active\\n- API Gateway: 0.2ms latency")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.reply_to(message, "Thank you for your message. It has been securely logged on our server support desk.")

if __name__ == "__main__":
    logger.info("Initializing Continuous Support Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
"""

FEEDBACK_BOT_PY = """import os
import sys
import logging
import telebot

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("FeedbackBot")

BOT_TOKEN = os.environ.get("BOT_TOKEN")

if not BOT_TOKEN:
    logger.error("CRITICAL: BOT_TOKEN environment variable not set. Exiting.")
    sys.exit(1)

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="MARKDOWN")

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = (
        "📮 *Feedback & Contact Hub Bot*\\n\\n"
        "Your thoughts are highly valuable. Send me any feedback or recommendations.\\n\\n"
        "• /feedback <text> - Register a feedback ticket\\n"
        "• /about - Learn about this service"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['about'])
def send_about(message):
    bot.reply_to(message, "ℹ️ This bot is hosted on the Multi-Bot continuous 24x7 serverless hosting platform.")

@bot.message_handler(commands=['feedback'])
def collect_feedback(message):
    args = message.text.split()
    if len(args) < 2:
        bot.reply_to(message, "⚠️ Please provide your feedback text. Example: `/feedback Great interface!`")
        return
    feedback_text = " ".join(args[1:])
    bot.reply_to(message, f"⭐ *Feedback Logged!*\\n\\n_\\"{feedback_text}\\"_\\n\\nThank you for helping us grow!")

@bot.message_handler(func=lambda message: True)
def log_text(message):
    bot.reply_to(message, "I recorded that message. To log it as a structured feedback, please use `/feedback <your message>`.")

if __name__ == "__main__":
    logger.info("Initializing Continuous Feedback Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
"""

STARTER_BOT_PY = """import os
import sys
import logging
import telebot

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("StarterBot")

BOT_TOKEN = os.environ.get("BOT_TOKEN")

if not BOT_TOKEN:
    logger.error("CRITICAL: BOT_TOKEN environment variable not set. Exiting.")
    sys.exit(1)

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="MARKDOWN")

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.reply_to(message, "✨ *Welcome to your Custom Starter Bot!*\\n\\nI'm running 24x7 on our multi-bot Actions daemon loop.")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.reply_to(message, f"🤖 *Echo:* {message.text}")

if __name__ == "__main__":
    logger.info("Initializing Continuous Custom Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
"""

class LaunchRequest(BaseModel):
    repo_name: str
    bot_name: str
    bot_token: str
    script_name: str
    github_token: Optional[str] = None

class StopRequest(BaseModel):
    repo_name: str
    github_token: Optional[str] = None

# In-memory registry of active bot configurations
ACTIVE_DAEMONS = {}

# Sleek, premium dark cyberpunk single-page Vercel-like dashboard (absolutely NO simulated demo modes)
DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Bot Daemon Engine — Import & Deploy</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    },
                    colors: {
                        cyber: {
                            bg: '#030712',
                            card: '#0B111E',
                            border: '#1E293B',
                            accent: '#00D4FF',
                            purple: '#7C3AED',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #030712;
            color: #F8FAFC;
        }
        .neon-border {
            box-shadow: 0 0 15px rgba(0, 212, 255, 0.08);
        }
        .glow-button {
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.25);
        }
        .scroll-custom::-webkit-scrollbar {
            width: 6px;
        }
        .scroll-custom::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
        }
        .scroll-custom::-webkit-scrollbar-thumb {
            background: #1E293B;
            border-radius: 3px;
        }
        .scroll-custom::-webkit-scrollbar-thumb:hover {
            background: #00D4FF;
        }
    </style>
</head>
<body class="font-sans antialiased min-h-screen flex flex-col justify-between">

    <!-- Top Grid and Ambient Light Effects -->
    <div class="absolute inset-x-0 top-0 h-[450px] bg-gradient-to-b from-[#00D4FF]/10 to-transparent pointer-events-none z-0"></div>
    <div class="absolute top-[-100px] left-[50%] translate-x-[-50%] w-[600px] h-[250px] bg-[#7C3AED]/12 blur-[120px] pointer-events-none z-0"></div>

    <!-- Header / Navigation Bar -->
    <header class="w-full border-b border-slate-800/60 bg-cyber-bg/85 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyber-accent to-cyber-purple flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                    <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <div>
                    <span class="font-extrabold tracking-wider text-sm bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">MULTI-BOT</span>
                    <span class="text-[9px] block font-mono tracking-widest text-cyber-accent -mt-0.5">DEPLOYMENT ENGINE</span>
                </div>
            </div>

            <!-- Header Actions / Authenticated User Display -->
            <div id="user-header-section" class="flex items-center gap-4">
                <!-- Will be dynamically populated -->
            </div>
        </div>
    </header>

    <!-- Main Content Container -->
    <main class="max-w-4xl w-full mx-auto px-4 py-12 relative z-10 flex-grow flex flex-col justify-center">

        <!-- 1. UNAUTHENTICATED STATE: LANDING & LOGIN -->
        <div id="state-unauthenticated" class="hidden text-center py-8">
            <div class="inline-flex items-center gap-2.5 px-4 py-1.5 bg-cyber-card border border-slate-800 rounded-full text-xs text-cyber-accent font-mono mb-6 neon-border">
                <span class="w-2 h-2 rounded-full bg-cyber-accent animate-pulse"></span>
                ACTIVE PIPELINE GATEWAY
            </div>
            
            <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
                Host Your Bots <br>
                <span class="bg-clip-text text-transparent bg-gradient-to-r from-cyber-accent via-cyan-400 to-cyber-purple">Endlessly 24x7</span>
            </h1>

            <p class="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-10 leading-relaxed">
                Connect your GitHub account to instantly import and deploy interactive Telegram bots. Powered by secure repository secrets and continuous Actions container orchestration.
            </p>

            <button onclick="handleConnectGitHub()" class="px-8 py-4 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl text-sm tracking-wide transition-all duration-200 inline-flex items-center gap-3 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]">
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                Connect with GitHub
            </button>

            <!-- Feature highlights bento-like grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20 text-left">
                <div class="bg-cyber-card border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/60 transition-all">
                    <div class="w-10 h-10 rounded-xl bg-cyber-accent/10 border border-cyber-accent/20 flex items-center justify-center text-cyber-accent mb-4">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H15M15 15h6v-6"/></svg>
                    </div>
                    <h3 class="text-sm font-semibold text-white mb-2 font-mono uppercase tracking-wider">Endless Auto-Recycling</h3>
                    <p class="text-xs text-slate-400 leading-relaxed">Workflows auto-dispatch every 5.5 hours, bypassing standard runner limits to keep your agents live indefinitely.</p>
                </div>
                <div class="bg-cyber-card border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/60 transition-all">
                    <div class="w-10 h-10 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7] mb-4">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h3 class="text-sm font-semibold text-white mb-2 font-mono uppercase tracking-wider">Zero Config Launch</h3>
                    <p class="text-xs text-slate-400 leading-relaxed">No local server needed. The platform generates code, handles secrets encryption via PyNaCl, and configures runner environments.</p>
                </div>
                <div class="bg-cyber-card border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/60 transition-all">
                    <div class="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] mb-4">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    </div>
                    <h3 class="text-sm font-semibold text-white mb-2 font-mono uppercase tracking-wider">Secure Token Secrets</h3>
                    <p class="text-xs text-slate-400 leading-relaxed">Your tokens are securely sealed using standard public-key cryptography and stored inside repository secrets under 'TELEGRAM_BOT_TOKEN'.</p>
                </div>
            </div>
        </div>

        <!-- 2. AUTHENTICATED STATE: DASHBOARD VIEW (ACTIVE PROJECTS & CREATE BUTTON) -->
        <div id="state-authenticated-dashboard" class="hidden space-y-8">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/50">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Your Daemon Projects</h1>
                    <p class="text-xs sm:text-sm text-slate-400 mt-1">Deploy, orchestrate, and trace active continuous workflow executions.</p>
                </div>
                <button onclick="goToImportRepo()" class="px-5 py-3 bg-cyber-accent text-slate-950 font-bold rounded-xl text-xs tracking-wider uppercase glow-button hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                    Create New Project
                </button>
            </div>

            <!-- Projects Grid -->
            <div id="projects-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Dynamically populated project cards -->
            </div>

            <!-- Empty Projects State -->
            <div id="projects-empty-state" class="hidden bg-cyber-card border border-slate-800 rounded-2xl p-12 text-center">
                <div class="w-12 h-12 rounded-xl bg-cyber-accent/10 border border-cyber-accent/20 flex items-center justify-center text-cyber-accent mx-auto mb-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                </div>
                <h3 class="text-base font-bold text-white mb-1">No Active Projects</h3>
                <p class="text-xs text-slate-400 max-w-sm mx-auto mb-6">Create a project to commit continuous daemon workflows and monitor console logs live.</p>
                <button onclick="goToImportRepo()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white font-mono font-bold rounded-lg uppercase cursor-pointer transition-all">Import Repository</button>
            </div>
        </div>

        <!-- 3. CREATE NEW PROJECT: REPOSITORY IMPORT LIST -->
        <div id="state-step1-repos" class="hidden">
            <!-- Back navigation button -->
            <button onclick="goToDashboard()" class="mb-6 text-xs text-slate-400 hover:text-white transition-all inline-flex items-center gap-2 font-mono uppercase font-bold cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Back to Projects
            </button>

            <div class="mb-8">
                <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">Import Repository</h2>
                <p class="text-xs sm:text-sm text-slate-400">Select a GitHub repository to inject secure workflow parameters and deploy.</p>
            </div>

            <!-- Repo Search Bar -->
            <div class="mb-6 relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <input type="text" id="repo-search-input" oninput="filterRepositories()" placeholder="Search repositories..." class="w-full bg-cyber-card border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent font-mono transition-all">
            </div>

            <!-- Repository Scrollable Container -->
            <div class="bg-cyber-card border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div id="repos-container" class="max-h-[380px] overflow-y-auto scroll-custom divide-y divide-slate-800/60">
                    <!-- Skeletons fetched asynchronously -->
                </div>
            </div>
        </div>

        <!-- 4. CONFIGURATION PANEL — STEP 2 -->
        <div id="state-step2-config" class="hidden">
            <!-- Back navigation button -->
            <button onclick="goToImportRepo()" class="mb-6 text-xs text-slate-400 hover:text-white transition-all inline-flex items-center gap-2 font-mono uppercase font-bold cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Back to Repositories
            </button>

            <div class="mb-8">
                <span class="text-[10px] font-mono tracking-widest text-cyber-accent uppercase font-bold bg-cyber-accent/10 px-2.5 py-1 rounded border border-cyber-accent/15">Configure Settings</span>
                <h2 id="selected-repo-title" class="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-4 font-mono truncate">owner / repo-name</h2>
                <p class="text-xs text-slate-400 mt-1">Customize variables and provide credentials securely before launching.</p>
            </div>

            <!-- Main Config Form -->
            <div class="bg-cyber-card border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
                
                <!-- Project Name -->
                <div>
                    <label class="block text-xs font-mono text-slate-300 font-semibold tracking-wider uppercase mb-1.5">Project / Bot Name</label>
                    <input type="text" id="project-name-input" placeholder="My Telegram Bot" class="w-full bg-cyber-bg border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent font-sans">
                </div>

                <!-- Token input -->
                <div>
                    <label class="block text-xs font-mono text-slate-300 font-semibold tracking-wider uppercase mb-1.5">Telegram Bot Token</label>
                    <input type="password" id="bot-token-input" placeholder="123456789:ABCdef_GhIjkLmNoPqRs" class="w-full bg-cyber-bg border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent font-mono">
                    <p class="text-[10px] text-slate-500 mt-1.5 font-sans leading-relaxed">
                        Generated by <a href="https://t.me/BotFather" target="_blank" class="text-cyber-accent hover:underline font-mono">@BotFather</a>. This token is securely encrypted using Libsodium and saved directly to your repository's actions secrets.
                    </p>
                </div>

                <!-- Script selection -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-mono text-slate-300 font-semibold tracking-wider uppercase mb-1.5">Bot Script Template</label>
                        <select id="bot-script-select" onchange="toggleCustomScriptInput()" class="w-full bg-cyber-bg border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent font-mono">
                            <option value="movie_bot.py">Movie Library Suggestion Bot</option>
                            <option value="support_bot.py">Customer Support Ticket Desk Bot</option>
                            <option value="feedback_bot.py">Secure Feedback & Contact Bot</option>
                            <option value="starter_bot.py">Minimal Python Echo Starter Bot</option>
                            <option value="custom">-- Custom Filename --</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-mono text-slate-300 font-semibold tracking-wider uppercase mb-1.5">Script Path/Filename</label>
                        <input type="text" id="script-filename-input" value="bot.py" class="w-full bg-cyber-bg border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent font-mono">
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-800/60">
                    <button onclick="handleDeployAndGoLive()" class="w-full py-4 bg-gradient-to-r from-cyber-accent to-cyber-purple hover:scale-[1.01] active:scale-[0.99] text-white font-extrabold rounded-xl text-sm transition-all tracking-wider glow-button cursor-pointer flex items-center justify-center gap-2">
                        <svg class="w-4 h-4 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
                        DEPLOY & GO LIVE
                    </button>
                </div>
            </div>
        </div>

        <!-- 5. DEPLOYMENT PIPELINE RUNNING TERMINAL STATE — STEP 3 -->
        <div id="state-step3-terminal" class="hidden">
            <div class="mb-6">
                <span class="text-[10px] font-mono tracking-widest text-[#22C55E] uppercase font-bold bg-[#22C55E]/10 px-2.5 py-1 rounded border border-[#22C55E]/15 animate-pulse">DEPLOYING PIPELINE</span>
                <h2 id="pipeline-repo-title" class="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-4 font-mono">owner / repo-name</h2>
                <p id="pipeline-subtitle" class="text-xs text-slate-400 mt-1">Encrypting secrets and provisioning GitHub Actions container...</p>
            </div>

            <!-- Terminal log box -->
            <div class="bg-black/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
                <div class="bg-cyber-card px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
                        <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
                        <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                        <span class="text-[11px] text-slate-400 font-mono ml-1">deployment-logs.sh</span>
                    </div>
                    <div class="text-[10px] text-cyber-accent animate-pulse font-semibold uppercase">Provisioning</div>
                </div>
                <div id="terminal-logs-body" class="p-5 h-64 overflow-y-auto scroll-custom space-y-2 text-slate-300 leading-relaxed">
                    <!-- Logs stream in dynamically -->
                </div>
            </div>
        </div>

    </main>

    <!-- Footer Area -->
    <footer class="border-t border-slate-900/80 bg-cyber-bg/40 py-5 text-center font-mono text-[10px] text-slate-600 relative z-10">
        DAEMON ORCHESTRATION ENGINE • SECURED VIA REPOSITORY DISPATCH
    </footer>

    <!-- Client-Side Dashboard Javascript Controller -->
    <script>
        let githubToken = "";
        let repositoriesList = [];
        let selectedRepository = null;
        let activeProjects = [];
        let pollingIntervals = {};

        // On DOM Content Loaded
        document.addEventListener('DOMContentLoaded', () => {
            initSession();
        });

        // Initialize session and authentication status
        function initSession() {
            // Load saved projects from localStorage
            try {
                const saved = localStorage.getItem('multi_bot_active_projects');
                if (saved) activeProjects = JSON.parse(saved);
            } catch(e) {
                console.error("Failed to read active projects:", e);
            }

            const urlParams = new URLSearchParams(window.location.search);
            let token = urlParams.get('token');
            if (token) {
                localStorage.setItem('github_token', token);
                document.cookie = "gh_token=" + token + "; max-age=31536000; path=/; SameSite=Lax; Secure";
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                token = localStorage.getItem('github_token');
            }

            // Fallback: check cookie as well
            if (!token) {
                const cookieMatch = document.cookie.match(new RegExp('(^| )gh_token=([^;]+)'));
                if (cookieMatch) {
                    token = cookieMatch[2];
                    localStorage.setItem('github_token', token);
                }
            }

            if (token && token.trim() !== "") {
                githubToken = token;
                showDashboard();
            } else {
                showLogin();
            }
        }

        // Show Landing / Login screen
        function showLogin() {
            document.getElementById('state-unauthenticated').classList.remove('hidden');
            document.getElementById('state-authenticated-dashboard').classList.add('hidden');
            document.getElementById('state-step1-repos').classList.add('hidden');
            document.getElementById('state-step2-config').classList.add('hidden');
            document.getElementById('state-step3-terminal').classList.add('hidden');
            
            // Clear header display
            document.getElementById('user-header-section').innerHTML = '';
        }

        // Connect with GitHub Trigger
        function handleConnectGitHub() {
            window.location.href = "/api/login";
        }

        // Show main Dashboard and retrieve list of real repositories
        function showDashboard() {
            document.getElementById('state-unauthenticated').classList.add('hidden');
            document.getElementById('state-authenticated-dashboard').classList.remove('hidden');
            document.getElementById('state-step1-repos').classList.add('hidden');
            document.getElementById('state-step2-config').classList.add('hidden');
            document.getElementById('state-step3-terminal').classList.add('hidden');

            // Render Header user stats and disconnect action
            document.getElementById('user-header-section').innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="px-3 py-1 bg-[#10B981]/8 border border-[#10B981]/15 rounded-full text-[10px] font-mono tracking-wider text-[#10B981] flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.06)]">
                        <span class="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                        AUTHENTICATED
                    </div>
                    <button onclick="handleLogout()" class="px-3.5 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 font-mono text-[11px] transition-all cursor-pointer">
                        Sign Out
                    </button>
                </div>
            `;

            renderProjectsList();
        }

        // Log out clean
        function handleLogout() {
            // Stop any polling logs
            Object.values(pollingIntervals).forEach(clearInterval);
            pollingIntervals = {};

            localStorage.removeItem('github_token');
            document.cookie = "gh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            githubToken = "";
            showLogin();
        }

        // Go to dashboard
        function goToDashboard() {
            // Clean active logs loops
            Object.values(pollingIntervals).forEach(clearInterval);
            pollingIntervals = {};
            showDashboard();
        }

        // Transition to repository import list
        function goToImportRepo() {
            document.getElementById('state-authenticated-dashboard').classList.add('hidden');
            document.getElementById('state-step1-repos').classList.remove('hidden');
            document.getElementById('state-step2-config').classList.add('hidden');
            document.getElementById('state-step3-terminal').classList.add('hidden');
            fetchRepositories();
        }

        // Render Local project list
        function renderProjectsList() {
            const grid = document.getElementById('projects-grid');
            const emptyState = document.getElementById('projects-empty-state');

            if (activeProjects.length === 0) {
                grid.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }

            grid.classList.remove('hidden');
            emptyState.classList.add('hidden');

            grid.innerHTML = activeProjects.map((project, idx) => `
                <div class="bg-cyber-card border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all flex flex-col justify-between">
                    <div class="p-5 sm:p-6">
                        <div class="flex items-center justify-between gap-3 mb-4">
                            <div class="min-w-0">
                                <h3 class="text-sm font-extrabold text-white font-mono uppercase tracking-wider truncate">${project.name}</h3>
                                <a href="https://github.com/${project.repo_name}" target="_blank" class="text-xs text-slate-500 hover:text-cyber-accent font-mono transition-all inline-flex items-center gap-1 mt-0.5">
                                    ${project.repo_name}
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
                                </a>
                            </div>
                            <span class="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded border border-[#10B981]/20 bg-[#10B981]/5 text-[#10B981] flex items-center gap-1 shrink-0">
                                <span class="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                                LIVE
                            </span>
                        </div>

                        <div class="space-y-2 bg-black/30 border border-slate-900/50 rounded-xl p-3.5 font-mono text-xs">
                            <div class="flex justify-between"><span class="text-slate-500">SCRIPT ENGINE:</span><span class="text-cyber-accent font-bold">${project.script_name}</span></div>
                            <div class="flex justify-between"><span class="text-slate-500">BOT USERNAME:</span><span class="text-slate-300">@${project.bot_username || 'Pending'}</span></div>
                        </div>
                    </div>

                    <!-- Actions Bar -->
                    <div class="px-5 py-4 border-t border-slate-800/60 bg-slate-900/10 flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <a href="https://t.me/${project.bot_username}" target="_blank" class="px-3 py-1.5 bg-[#10B981] hover:bg-[#10B981]/90 text-slate-950 font-extrabold text-[11px] rounded-lg transition-all uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.92 9.12c-.14.65-.53.81-1.08.5l-2.93-2.16-1.41 1.36c-.16.16-.29.29-.6.29l.21-2.98 5.43-4.9c.24-.21-.05-.33-.37-.11L10.13 13.1l-2.89-.9c-.63-.2-.64-.63.13-.93l11.27-4.34c.52-.19.98.12.82.72z"/></svg>
                                Telegram
                            </a>
                            <button onclick="toggleLogs(${idx}, '${project.repo_name}')" class="px-3 py-1.5 border border-slate-800 hover:border-slate-700 bg-black/20 text-slate-300 font-bold font-mono text-[11px] rounded-lg transition-all uppercase tracking-wider cursor-pointer">
                                Runtime Logs
                            </button>
                        </div>
                        <button onclick="stopProject(${idx})" class="text-rose-500 hover:text-rose-400 font-mono text-[11px] font-bold uppercase transition-all cursor-pointer">
                            Remove
                        </button>
                    </div>

                    <!-- Collapsible live logs section -->
                    <div id="logs-container-${idx}" class="hidden border-t border-slate-800/80 bg-black/90 font-mono text-[11px]">
                        <div class="px-5 py-2.5 border-b border-slate-900 bg-slate-950/80 flex items-center justify-between text-slate-400">
                            <span>RUNNING TERMINAL</span>
                            <span class="flex items-center gap-1.5 text-cyber-accent text-[9px] font-semibold tracking-widest animate-pulse">
                                <span class="w-1.5 h-1.5 rounded-full bg-cyber-accent animate-ping"></span>
                                POLLING LIVE 5S
                            </span>
                        </div>
                        <div id="logs-terminal-body-${idx}" class="p-4 h-56 overflow-y-auto scroll-custom space-y-1.5 text-slate-300 leading-normal">
                            Loading runner logs stream...
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Toggle Live Log views
        function toggleLogs(idx, repoName) {
            const container = document.getElementById(`logs-container-${idx}`);
            const body = document.getElementById(`logs-terminal-body-${idx}`);

            if (container.classList.contains('hidden')) {
                container.classList.remove('hidden');
                body.innerHTML = `<div class="text-slate-500 animate-pulse font-mono">Syncing active workflow logs from GitHub runner...</div>`;
                fetchRuntimeLogs(idx, repoName);
                
                // Clear any existing poll
                if (pollingIntervals[idx]) clearInterval(pollingIntervals[idx]);
                // Set 5s log poll
                pollingIntervals[idx] = setInterval(() => {
                    fetchRuntimeLogs(idx, repoName);
                }, 5000);
            } else {
                container.classList.add('hidden');
                if (pollingIntervals[idx]) {
                    clearInterval(pollingIntervals[idx]);
                    delete pollingIntervals[idx];
                }
            }
        }

        // Fetch logs asynchronously
        async function fetchRuntimeLogs(idx, repoName) {
            const body = document.getElementById(`logs-terminal-body-${idx}`);
            try {
                const res = await fetch(`/api/logs?repo=${encodeURIComponent(repoName)}&token=${encodeURIComponent(githubToken)}`);
                if (!res.ok) {
                    throw new Error("Failed to trace logs");
                }
                const data = await res.json();
                
                let content = "";
                if (data.status) {
                    content += `<div class="text-cyber-accent border-b border-slate-900/60 pb-1.5 mb-2 font-semibold">CONTAINER RUN: #${data.job_name || 'Workflow'} [${data.status.toUpperCase()}]</div>`;
                }

                // Render console logs cleanly
                if (data.logs) {
                    const cleanLogs = data.logs
                        .replace(/\\r\\n/g, '\\n')
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                    content += `<pre class="whitespace-pre-wrap font-mono text-slate-300 leading-relaxed">${cleanLogs}</pre>`;
                } else {
                    content += `<div class="text-slate-500">Daemon is in queued status. Initializing runner container...</div>`;
                }
                
                body.innerHTML = content;
                body.scrollTop = body.scrollHeight;
            } catch(err) {
                body.innerHTML = `<div class="text-rose-400 font-semibold font-mono">Connection trace to runner timed out. Verify repository token actions secrets configuration.</div>`;
            }
        }

        // Remove Project locally (or invoke cancel on runner if requested)
        async function stopProject(idx) {
            const project = activeProjects[idx];
            if (!confirm(`Are you sure you want to stop the workflow loop and remove Project '${project.name}' from your dashboard?`)) {
                return;
            }

            // Stop any log poll
            if (pollingIntervals[idx]) {
                clearInterval(pollingIntervals[idx]);
                delete pollingIntervals[idx];
            }

            try {
                // Inform user we are cancelling workflows on GitHub too
                const res = await fetch('/api/stop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        repo_name: project.repo_name,
                        github_token: githubToken
                    })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    alert(data.message || "Active workflows terminated clean.");
                }
            } catch(e) {
                console.warn("Failed to stop github actions run directly:", e);
            }

            // Remove from array and update state
            activeProjects.splice(idx, 1);
            localStorage.setItem('multi_bot_active_projects', JSON.stringify(activeProjects));
            renderProjectsList();
        }

        // Fetch repositories via FastAPI endpoint asynchronously
        async function fetchRepositories() {
            const container = document.getElementById('repos-container');
            container.innerHTML = `
                <div class="p-12 text-center text-slate-500 font-mono text-sm flex flex-col items-center justify-center gap-3">
                    <div class="w-6 h-6 border-2 border-t-transparent border-cyber-accent rounded-full animate-spin"></div>
                    Fetching active GitHub repositories...
                </div>
            `;

            try {
                const response = await fetch(`/api/repos?token=${encodeURIComponent(githubToken)}`);
                if (!response.ok) {
                    throw new Error("Failed to retrieve repositories");
                }
                const data = await response.json();
                repositoriesList = data || [];
                renderRepositories(repositoriesList);
            } catch (error) {
                container.innerHTML = `
                    <div class="p-8 text-center space-y-4">
                        <div class="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        </div>
                        <p class="text-xs font-mono text-slate-400 leading-relaxed">Error syncing repositories from GitHub.<br>Your access token may have expired or lacks 'repo' scopes.</p>
                        <button onclick="handleLogout()" class="px-5 py-2 rounded-lg bg-cyber-accent text-slate-950 font-bold text-xs hover:bg-cyber-accent/80 transition-all font-sans cursor-pointer">Reconnect Account</button>
                    </div>
                `;
            }
        }

        // Render repositories list to container
        function renderRepositories(repos) {
            const container = document.getElementById('repos-container');
            if (repos.length === 0) {
                container.innerHTML = `
                    <div class="p-12 text-center text-slate-500 font-mono text-sm leading-relaxed">
                        No repositories found.<br>Create a repository in GitHub first to launch a bot.
                    </div>
                `;
                return;
            }

            container.innerHTML = repos.map(repo => `
                <div class="repo-item-row p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-900/30 transition-all" data-name="${repo.full_name.toLowerCase()}">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-9 h-9 rounded-xl bg-cyber-accent/5 border border-cyber-accent/15 flex items-center justify-center text-cyber-accent shrink-0">
                            <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                        </div>
                        <div class="min-w-0">
                            <h4 class="text-sm font-bold text-white font-mono truncate leading-normal">${repo.full_name}</h4>
                            <div class="flex items-center gap-3.5 mt-0.5">
                                <span class="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                    <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7a3 3 0 100-6 3 3 0 000 6zM8 7V17M8 17a3 3 0 100 6 3 3 0 000-6zM8 12h8a3 3 0 100 6 3 3 0 000-6z"/></svg>
                                    ${repo.default_branch || 'main'}
                                </span>
                                <span class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-slate-800 bg-black/30 ${repo.private ? 'text-amber-400 border-amber-500/10' : 'text-slate-400'}">
                                    ${repo.private ? 'Private' : 'Public'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onclick="selectRepository(${JSON.stringify(repo).replace(/"/g, '&quot;')})" class="px-5 py-2 bg-cyber-accent/10 border border-cyber-accent/25 text-cyber-accent hover:bg-cyber-accent hover:text-slate-950 font-extrabold font-mono text-xs rounded-xl transition-all tracking-wider cursor-pointer shadow-sm">
                        IMPORT
                    </button>
                </div>
            `).join('');
        }

        // Filter Repositories in list in real-time
        function filterRepositories() {
            const query = document.getElementById('repo-search-input').value.toLowerCase();
            const rows = document.querySelectorAll('.repo-item-row');
            rows.forEach(row => {
                const name = row.getAttribute('data-name');
                if (name && name.includes(query)) {
                    row.classList.remove('hidden');
                    row.classList.add('flex');
                } else {
                    row.classList.remove('flex');
                    row.classList.add('hidden');
                }
            });
        }

        // Transition to STEP 2 with selected repository
        function selectRepository(repo) {
            selectedRepository = repo;
            document.getElementById('state-step1-repos').classList.add('hidden');
            document.getElementById('state-step2-config').classList.remove('hidden');

            document.getElementById('selected-repo-title').textContent = repo.full_name;
            
            // Prefill Project Name with Repo Name
            document.getElementById('project-name-input').value = repo.name.replace(/[-_]/g, ' ').toUpperCase();
            document.getElementById('bot-token-input').value = "";
            document.getElementById('bot-script-select').value = "movie_bot.py";
            
            toggleCustomScriptInput();
        }

        // Toggle custom script inputs
        function toggleCustomScriptInput() {
            const selector = document.getElementById('bot-script-select');
            const fileInput = document.getElementById('script-filename-input');
            
            if (selector.value === "custom") {
                fileInput.value = "main.py";
                fileInput.disabled = false;
                fileInput.classList.remove('opacity-50');
            } else {
                fileInput.value = selector.value;
                fileInput.disabled = true;
                fileInput.classList.add('opacity-50');
            }
        }

        // Trigger active deployment pipeline
        async function handleDeployAndGoLive() {
            const projectName = document.getElementById('project-name-input').value.trim() || selectedRepository.name;
            const botToken = document.getElementById('bot-token-input').value.trim();
            const scriptSelectVal = document.getElementById('bot-script-select').value;
            const scriptName = document.getElementById('script-filename-input').value.trim();

            if (!botToken) {
                alert("Please enter a valid Telegram Bot Token first!");
                return;
            }
            if (!scriptName) {
                alert("Please specify a valid script file name (e.g. main.py)!");
                return;
            }

            // Move to Step 3 layout immediately
            document.getElementById('state-step2-config').classList.add('hidden');
            document.getElementById('state-step3-terminal').classList.remove('hidden');

            document.getElementById('pipeline-repo-title').textContent = selectedRepository.full_name;
            document.getElementById('pipeline-subtitle').textContent = `Spawning continuous workflow pipeline for script: ${scriptName}`;

            const terminalLogs = document.getElementById('terminal-logs-body');
            terminalLogs.innerHTML = "";

            function log(text, isError = false, isSuccess = false) {
                const timestamp = new Date().toLocaleTimeString();
                const div = document.createElement('div');
                div.className = isError ? 'text-rose-400 font-semibold' : (isSuccess ? 'text-emerald-400 font-bold' : 'text-slate-300');
                div.innerHTML = `<span class="text-slate-500 font-mono text-[10px] mr-2">[${timestamp}]</span> ${text}`;
                terminalLogs.appendChild(div);
                terminalLogs.scrollTop = terminalLogs.scrollHeight;
            }

            log(`Initializing automated multi-bot deployment sequence...`);
            await sleep(800);
            log(`Contacting Telegram API to verify Bot Token authenticity...`);
            await sleep(600);

            try {
                const response = await fetch('/api/launch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        repo_name: selectedRepository.full_name,
                        bot_name: projectName,
                        bot_token: botToken,
                        script_name: scriptName,
                        github_token: githubToken
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || "Automated deployment failed");
                }

                log(`Success! Verified Telegram bot identity: <span class="text-cyber-accent font-bold">@${data.username}</span>`);
                await sleep(700);
                log(`Synchronizing and checking with GitHub action runner environment...`);
                await sleep(500);
                log(`Encrypting Bot Token using <span class="text-[#A855F7]">PyNaCl Libsodium Sealed Box</span>...`);
                await sleep(600);
                log(`Setting up Repository Actions Secret: <span class="text-slate-100 bg-slate-900 px-1 py-0.5 rounded font-mono">TELEGRAM_BOT_TOKEN</span>...`);
                await sleep(750);
                log(`Committing loop-runner workflow: <span class="text-slate-100 font-mono text-[11px] bg-slate-900 px-1 py-0.5 rounded">.github/workflows/run_bot.yml</span>`);
                await sleep(600);
                log(`Committing optimized script engine template: <span class="text-slate-100 font-mono text-[11px] bg-slate-900 px-1 py-0.5 rounded">${data.bot_type}</span>`);
                await sleep(650);
                log(`Dispatching repository trigger event to initiate runner loop container...`);
                await sleep(800);
                log(`Continuous loop orchestrator activated! Deployment completed successfully!`, false, true);

                // Add to active projects array
                const newProject = {
                    name: projectName,
                    repo_name: selectedRepository.full_name,
                    script_name: data.bot_type,
                    bot_username: data.username
                };
                
                // Avoid duplicates
                activeProjects = activeProjects.filter(p => p.repo_name !== newProject.repo_name);
                activeProjects.unshift(newProject);
                
                // Save to localStorage
                localStorage.setItem('multi_bot_active_projects', JSON.stringify(activeProjects));

                await sleep(1500);
                goToDashboard();

            } catch (error) {
                log(`CRITICAL ERROR: ${error.message}`, true);
                log(`Deployment workflow terminated due to pipeline failure. Please verify your token and repository settings.`, true);
                
                // Display retry action button after log failure
                const retryBtn = document.createElement('button');
                retryBtn.className = "mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-white font-mono font-bold uppercase rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5";
                retryBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H15M15 15h6v-6"/></svg> Back to Config`;
                retryBtn.onclick = () => {
                    document.getElementById('state-step3-terminal').classList.add('hidden');
                    document.getElementById('state-step2-config').classList.remove('hidden');
                };
                terminalLogs.appendChild(retryBtn);
                terminalLogs.scrollTop = terminalLogs.scrollHeight;
            }
        }

        // Simple helper delay function
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    </script>
</body>
</html>
"""

# Try to determine the dynamic redirect URI based on the request host
def get_redirect_uri(request: Request) -> str:
    host = request.headers.get("host")
    if host:
        scheme = "https" if request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https" else "http"
        return f"{scheme}://{host}/api/callback"
    return "https://multi-bot-hosting-platform.vercel.app/api/callback"

GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET")

if not GITHUB_CLIENT_ID:
    logger.warning("GITHUB_CLIENT_ID environment variable is missing under AI Studio settings.")
if not GITHUB_CLIENT_SECRET:
    logger.warning("GITHUB_CLIENT_SECRET environment variable is missing under AI Studio settings.")

@app.get("/", response_class=HTMLResponse)
@app.get("/api", response_class=HTMLResponse)
async def root(request: Request):
    return HTMLResponse(content=DASHBOARD_HTML)

@app.get("/api/health")
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "platform": "GitHub Actions Multi-Bot SaaS platform (FastAPI)",
        "indicator": "Active"
    }

@app.get("/api/login")
@app.get("/login")
async def login(request: Request):
    try:
        # Re-fetch or check global config
        client_id = GITHUB_CLIENT_ID or os.environ.get("GITHUB_CLIENT_ID")
        if not client_id:
            logger.error("Environment variable GITHUB_CLIENT_ID is missing on the server")
            return JSONResponse(
                status_code=500,
                content={"error": "Environment variable GITHUB_CLIENT_ID is missing on the server"}
            )
        
        dynamic_redirect = get_redirect_uri(request)
        auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={dynamic_redirect}&scope=repo%20workflow"
        return JSONResponse(status_code=200, content={"url": auth_url})
    except Exception as e:
        logger.error(f"Error generating login URL: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Internal server error generating login URL: {str(e)}"}
        )

@app.get("/api/callback")
@app.get("/callback")
async def oauth_callback(request: Request, code: Optional[str] = Query(None)):
    client_id = GITHUB_CLIENT_ID or os.environ.get("GITHUB_CLIENT_ID")
    client_secret = GITHUB_CLIENT_SECRET or os.environ.get("GITHUB_CLIENT_SECRET")

    if not client_id or not client_secret:
        error_html = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Configuration Missing</title>
            <style>
                body {
                    font-family: 'Inter', -apple-system, sans-serif;
                    background-color: #030712;
                    color: #EF4444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                }
                .card {
                    text-align: center;
                    padding: 2.5rem;
                    background: #0B111E;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 1rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    max-width: 500px;
                }
                h1 { color: #EF4444; margin-bottom: 1rem; }
                p { color: #94A3B8; line-height: 1.5; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>GitHub OAuth Setup Required</h1>
                <p>GitHub Client ID or Secret is not configured on the server. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables under the Settings menu in AI Studio.</p>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html, status_code=400)

    dynamic_redirect = get_redirect_uri(request)
    access_token = ""
    exchange_error = None

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "code": code,
                    "redirect_uri": dynamic_redirect
                },
                timeout=15.0
            )
            
            if resp.status_code != 200:
                raise Exception(f"GitHub returned HTTP status {resp.status_code}. Response: {resp.text}")
            
            data = resp.json()
            if "error" in data:
                error_msg = data.get("error")
                error_desc = data.get("error_description", "No description available")
                raise Exception(f"GitHub Error: {error_msg} - {error_desc}")
                
            access_token = data.get("access_token", "")
            if not access_token:
                raise Exception(f"Exchange succeeded but access_token was missing in the JSON response: {data}")
    except Exception as e:
        exchange_error = str(e)
        logger.error(f"GitHub OAuth Callback Exchange Failure: {exchange_error}")

    if exchange_error:
        error_html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Authentication Failed</title>
            <style>
                body {{
                    font-family: 'Inter', -apple-system, sans-serif;
                    background-color: #030712;
                    color: #EF4444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                }}
                .card {{
                    padding: 2.5rem;
                    background: #0B111E;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 1rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    max-width: 600px;
                    width: 90%;
                    text-align: left;
                }}
                h1 {{ color: #EF4444; margin-top: 0; margin-bottom: 1rem; text-align: center; }}
                p {{ color: #94A3B8; line-height: 1.5; font-size: 0.95rem; }}
                pre {{
                    background: #030712;
                    color: #F8FAFC;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    font-family: monospace;
                    font-size: 0.85rem;
                    border: 1px solid #1E293B;
                }}
                .back-btn {{
                    display: block;
                    text-align: center;
                    margin-top: 1.5rem;
                    color: #00D4FF;
                    text-decoration: none;
                    font-weight: bold;
                }}
                .back-btn:hover {{
                    text-decoration: underline;
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <h1>GitHub Exchange Failed</h1>
                <p>The authorization code exchange with GitHub failed. Here are the details of the response received from GitHub's API:</p>
                <pre>{exchange_error}</pre>
                <a href="/" class="back-btn">← Return to Dashboard</a>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html, status_code=500)

    if "application/json" in request.headers.get("accept", ""):
        return {"access_token": access_token}

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>GitHub Authorization Success</title>
        <style>
            body {{
                font-family: 'Inter', -apple-system, sans-serif;
                background-color: #030712;
                color: #F8FAFC;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
            }}
            .card {{
                background-color: #0B111E;
                border: 1px solid #1E293B;
                padding: 2.5rem;
                border-radius: 1.25rem;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
            }}
            .loader {{
                border: 3px solid #1E293B;
                border-top: 3px solid #00D4FF;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1.5rem auto;
            }}
            @keyframes spin {{
                0% {{ transform: rotate(0deg); }}
                100% {{ transform: rotate(360deg); }}
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="loader"></div>
            <h2 style="color: #00D4FF; margin-top: 0; font-weight: 800;">Authorized Successfully</h2>
            <p style="color: #94A3B8; font-size: 0.95rem;">Syncing repositories with your Dashboard...</p>
            <p style="color: #475569; font-size: 0.8rem;">This window will update and close automatically.</p>
        </div>

        <script>
            const token = "{access_token}";
            if (window.opener) {{
                window.opener.postMessage({{ type: "OAUTH_AUTH_SUCCESS", token: token }}, "*");
                setTimeout(() => {{ window.close(); }}, 1000);
                setTimeout(() => {{
                    window.location.href = "/?token=" + token;
                }}, 1800);
            }} else {{
                window.location.href = "/?token=" + token;
            }}
        </script>
    </body>
    </html>
    """
    response = HTMLResponse(content=html_content)
    if access_token:
        response.set_cookie(
            key="gh_token",
            value=access_token,
            httponly=False,
            secure=True,
            samesite="lax",
            max_age=31536000
        )
    return response

@app.get("/api/repos")
@app.get("/repos")
async def get_repositories(request: Request, token: Optional[str] = Query(None)):
    # Retrieve from query parameters or securely stored cookie
    gh_token = token or request.cookies.get("gh_token") or request.cookies.get("github_token")
    if not gh_token:
        raise HTTPException(status_code=401, detail="Unauthorized: GitHub access token is missing.")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.github.com/user/repos?per_page=100&sort=updated",
            headers={
                "Authorization": f"token {gh_token}",
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
    
    sha = None
    check_url = f"https://api.github.com/repos/{repo_name}/contents/{path}"
    resp = await client.get(check_url, headers=headers)
    if resp.status_code == 200:
        sha = resp.json().get("sha")
        
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

async def set_github_secret(client: httpx.AsyncClient, token: str, repo_name: str, secret_name: str, secret_value: str):
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend"
    }
    
    # 1. Get repo public key
    pk_url = f"https://api.github.com/repos/{repo_name}/actions/secrets/public-key"
    resp = await client.get(pk_url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code, 
            detail=f"Failed to retrieve GitHub Actions public key for encrypting secrets: {resp.text}"
        )
    
    pk_data = resp.json()
    key_id = pk_data.get("key_id")
    public_key_b64 = pk_data.get("key")
    
    # 2. Encrypt using PyNaCl
    try:
        from nacl import public
        public_key_bytes = base64.b64decode(public_key_b64)
        public_key = public.PublicKey(public_key_bytes)
        sealed_box = public.SealedBox(public_key)
        encrypted_bytes = sealed_box.encrypt(secret_value.encode("utf-8"))
        encrypted_value_b64 = base64.b64encode(encrypted_bytes).decode("utf-8")
    except Exception as e:
        logger.error(f"PyNaCl Encryption Failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to encrypt secret using PyNaCl Sealed Box: {str(e)}"
        )
        
    # 3. PUT the secret to GitHub
    secret_url = f"https://api.github.com/repos/{repo_name}/actions/secrets/{secret_name}"
    payload = {
        "encrypted_value": encrypted_value_b64,
        "key_id": key_id
    }
    
    put_resp = await client.put(secret_url, headers=headers, json=payload)
    if put_resp.status_code not in [201, 204]:
        logger.error(f"Failed to write secret to GitHub: {put_resp.text}")
        raise HTTPException(status_code=put_resp.status_code, detail=f"Failed to write Actions secret: {put_resp.text}")

@app.post("/api/launch")
@app.post("/launch")
async def launch_bot(payload: LaunchRequest, request: Request):
    repo_name = payload.repo_name
    bot_token = payload.bot_token
    script_name = payload.script_name
    github_token = payload.github_token or request.cookies.get("gh_token") or request.cookies.get("github_token")

    if not repo_name or not bot_token or not script_name:
        raise HTTPException(status_code=400, detail="Missing required deployment variables.")

    if not github_token:
        raise HTTPException(status_code=401, detail="Unauthorized: GitHub access token is missing.")

    # Match selection template content
    clean_script_name = script_name.replace(".py", "")
    if clean_script_name == "movie_bot":
        py_content = MOVIE_BOT_PY
    elif clean_script_name == "support_bot":
        py_content = SUPPORT_BOT_PY
    elif clean_script_name == "feedback_bot":
        py_content = FEEDBACK_BOT_PY
    elif clean_script_name == "starter_bot":
        py_content = STARTER_BOT_PY
    else:
        # Fallback starter script
        py_content = STARTER_BOT_PY

    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend"
    }

    async with httpx.AsyncClient() as client:
        # 1. Verify Bot Token authenticity with Telegram API
        get_me_url = f"https://api.telegram.org/bot{bot_token}/getMe"
        me_resp = await client.get(get_me_url)
        me_data = me_resp.json()
        if me_resp.status_code != 200 or not me_data.get("ok"):
            error_desc = me_data.get("description", "Invalid Telegram Bot Token")
            raise HTTPException(status_code=400, detail=f"Failed to verify Telegram token: {error_desc}")

        bot_username = me_data.get("result", {}).get("username", "UnknownBot")

        # 2. Deactivate conflicting webhooks so long-polling is triggered clean
        delete_webhook_url = f"https://api.telegram.org/bot{bot_token}/deleteWebhook"
        await client.post(delete_webhook_url)

        # 3. Securely set GITHUB Actions Secrets for TELEGRAM_BOT_TOKEN
        logger.info(f"Setting GITHUB Secret 'TELEGRAM_BOT_TOKEN' in {repo_name}...")
        await set_github_secret(
            client=client,
            token=github_token,
            repo_name=repo_name,
            secret_name="TELEGRAM_BOT_TOKEN",
            secret_value=bot_token
        )

        # 4. Programmatically Commit Workflow runner `.github/workflows/run_bot.yml`
        logger.info(f"Injecting .github/workflows/run_bot.yml into {repo_name}...")
        await commit_github_file(
            client=client,
            token=github_token,
            repo_name=repo_name,
            path=".github/workflows/run_bot.yml",
            content=RUN_BOT_YML,
            message="[Platform Multi-Bot] Provisioned continuous Actions workflow runner"
        )

        # 5. Programmatically Commit User Python bot script
        logger.info(f"Injecting script {script_name} into {repo_name}...")
        await commit_github_file(
            client=client,
            token=github_token,
            repo_name=repo_name,
            path=script_name,
            content=py_content,
            message=f"[Platform Multi-Bot] Provisioned python daemon script {script_name}"
        )

        # 6. Dispatch Repository trigger event to start the loop actions container
        dispatch_url = f"https://api.github.com/repos/{repo_name}/dispatches"
        dispatch_payload = {
            "event_type": "launch_bot",
            "client_payload": {
                "script_name": script_name,
                "github_pat": github_token
            }
        }
        
        dispatch_resp = await client.post(dispatch_url, headers=headers, json=dispatch_payload)
        if dispatch_resp.status_code != 204:
            logger.error(f"GitHub repository dispatch event failed: {dispatch_resp.text}")
            raise HTTPException(
                status_code=dispatch_resp.status_code, 
                detail=f"Injected bot code files, but failed to activate runner dispatch event: {dispatch_resp.text}"
            )

        # Register active bot session
        ACTIVE_DAEMONS[repo_name] = {
            "repo_name": repo_name,
            "bot_username": bot_username,
            "script_name": script_name,
            "trigger_count": 0
        }

        return {
            "success": True,
            "message": f"Orchestrator provisioned daemon files successfully.",
            "username": bot_username,
            "bot_type": script_name,
            "repo_name": repo_name
        }

@app.get("/api/logs")
@app.get("/logs")
async def get_logs(repo: str = Query(...), token: Optional[str] = Query(None), request: Request = None):
    gh_token = token or request.cookies.get("gh_token") or request.cookies.get("github_token")
    if not gh_token:
        raise HTTPException(status_code=401, detail="Unauthorized: GitHub access token is missing.")
    
    headers = {
        "Authorization": f"token {gh_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend"
    }
    
    async with httpx.AsyncClient() as client:
        # 1. Fetch latest Actions runs
        runs_url = f"https://api.github.com/repos/{repo}/actions/runs?per_page=5"
        runs_resp = await client.get(runs_url, headers=headers)
        if runs_resp.status_code != 200:
            raise HTTPException(status_code=runs_resp.status_code, detail=f"Failed to fetch runs: {runs_resp.text}")
        
        runs_data = runs_resp.json()
        runs = runs_data.get("workflow_runs", [])
        if not runs:
            return {
                "status": "idle",
                "logs": "No active runner runs found in this repository. Trigger a fresh deployment..."
            }
        
        # 2. Match the first matching multi-bot actions runner
        target_run = None
        for run in runs:
            if run.get("name") == "24x7 Multi-Bot Host Engine" or "run_bot.yml" in run.get("path", ""):
                target_run = run
                break
        
        if not target_run:
            target_run = runs[0]
            
        run_id = target_run.get("id")
        run_status = target_run.get("status")
        run_conclusion = target_run.get("conclusion")
        
        # 3. Fetch jobs inside this run to read terminal logs
        jobs_url = f"https://api.github.com/repos/{repo}/actions/runs/{run_id}/jobs"
        jobs_resp = await client.get(jobs_url, headers=headers)
        if jobs_resp.status_code != 200:
            return {
                "status": run_status,
                "conclusion": run_conclusion,
                "logs": f"Workflow run {run_id} status is: {run_status}. Waiting to trace job initialization..."
            }
        
        jobs_data = jobs_resp.json()
        jobs = jobs_data.get("jobs", [])
        if not jobs:
            return {
                "status": run_status,
                "conclusion": run_conclusion,
                "logs": "Runner container allocation queued. Waiting on GitHub Actions availability..."
            }
            
        # 4. Fetch raw job logs
        job_id = jobs[0].get("id")
        job_name = jobs[0].get("name")
        job_status = jobs[0].get("status")
        
        logs_url = f"https://api.github.com/repos/{repo}/actions/jobs/{job_id}/logs"
        logs_resp = await client.get(logs_url, headers=headers)
        
        if logs_resp.status_code == 200:
            logs_text = logs_resp.text
            # Truncate to avoid payload overflow
            lines = logs_text.splitlines()
            if len(lines) > 150:
                truncated_logs = "\\n".join(lines[-150:])
            else:
                truncated_logs = "\\n".join(lines)
                
            return {
                "status": run_status,
                "conclusion": run_conclusion,
                "job_name": job_name,
                "job_status": job_status,
                "logs": truncated_logs
            }
        else:
            return {
                "status": run_status,
                "conclusion": run_conclusion,
                "job_name": job_name,
                "job_status": job_status,
                "logs": f"[{job_status.upper()}] Runner initialized. Waiting for log streaming from pipeline step..."
            }

@app.post("/api/stop")
@app.post("/stop")
async def stop_bot(payload: StopRequest, request: Request):
    repo_name = payload.repo_name
    github_token = payload.github_token or request.cookies.get("gh_token") or request.cookies.get("github_token")

    if not repo_name:
        raise HTTPException(status_code=400, detail="Missing required repository name.")

    if not github_token:
        raise HTTPException(status_code=401, detail="Unauthorized: GitHub access token is missing.")

    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend"
    }

    async with httpx.AsyncClient() as client:
        # Cancel any pending/running runs
        runs_url = f"https://api.github.com/repos/{repo_name}/actions/runs?status=in_progress"
        runs_resp = await client.get(runs_url, headers=headers)
        if runs_resp.status_code != 200:
            raise HTTPException(status_code=runs_resp.status_code, detail=f"Failed to query active runs: {runs_resp.text}")

        runs_data = runs_resp.json()
        runs = runs_data.get("workflow_runs", [])
        
        cancelled_count = 0
        for run in runs:
            if run.get("name") == "24x7 Multi-Bot Host Engine" or "run_bot.yml" in run.get("path", ""):
                run_id = run.get("id")
                cancel_url = f"https://api.github.com/repos/{repo_name}/actions/runs/{run_id}/cancel"
                cancel_resp = await client.post(cancel_url, headers=headers)
                if cancel_resp.status_code == 202:
                    cancelled_count += 1

        return {
            "success": True,
            "message": f"Successfully cancelled {cancelled_count} active workflow runner instances.",
            "cancelled_count": cancelled_count
        }

PROJECTS_FILE = os.path.join(os.getcwd(), "projects_store.json")

def load_projects_py():
    try:
        if os.path.exists(PROJECTS_FILE):
            with open(PROJECTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load projects: {e}")
    return []

def save_projects_py(p_list):
    try:
        with open(PROJECTS_FILE, "w", encoding="utf-8") as f:
            json.dump(p_list, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Failed to save projects: {e}")

class ProjectSetupRequest(BaseModel):
    repo_name: str
    github_token: str

class SecretsSetRequest(BaseModel):
    repo_name: str
    secret_name: str
    secret_value: str
    github_token: str

class RegisterProjectRequest(BaseModel):
    repo_name: str
    github_token: Optional[str] = None
    script_name: str
    username: str

class ProjectDeleteRequest(BaseModel):
    repo_name: str

class WorkflowStartRequest(BaseModel):
    repo_name: str
    github_token: str
    branch: Optional[str] = None

class WorkflowStopRequest(BaseModel):
    repo_name: str
    github_token: str

class WorkflowRestartRequest(BaseModel):
    repo_name: str
    github_token: str
    branch: Optional[str] = None

@app.get("/api/projects")
async def get_projects_py():
    return load_projects_py()

@app.post("/api/projects")
async def register_project_py(payload: RegisterProjectRequest):
    repo_name = payload.repo_name
    p_list = load_projects_py()
    existing_idx = next((i for i, p in enumerate(p_list) if p.get("repo_name") == repo_name), -1)
    
    from datetime import datetime
    created_at = datetime.utcnow().isoformat() + "Z"
    
    new_proj = {
        "id": repo_name.replace("/", "-"),
        "repo_name": repo_name,
        "bot_token": "",
        "script_name": payload.script_name or "mbhp_bot.yml",
        "username": payload.username,
        "status": "offline",
        "created_at": created_at,
        "request_count": 0,
        "health": "healthy"
    }

    if existing_idx == -1:
        p_list.append(new_proj)
    else:
        p_list[existing_idx]["script_name"] = payload.script_name or "mbhp_bot.yml"
        p_list[existing_idx]["username"] = payload.username
        new_proj = p_list[existing_idx]

    save_projects_py(p_list)
    return new_proj

@app.post("/api/projects/delete")
async def delete_project_py(payload: ProjectDeleteRequest):
    p_list = load_projects_py()
    p_list = [p for p in p_list if p.get("repo_name") != payload.repo_name]
    save_projects_py(p_list)
    return {"success": True, "message": "Project deleted from dashboard"}

@app.get("/api/repo/detect-entrypoint")
async def detect_entrypoint_py(repo_name: str, github_token: str):
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend",
    }
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"https://api.github.com/repos/{repo_name}/contents", headers=headers)
            if resp.status_code != 200:
                return {"default_command": "python bot.py"}
            items = resp.json()
            if isinstance(items, list):
                file_names = [item.get("name") for item in items]
                has_bot_py = "bot.py" in file_names
                has_main_py = "main.py" in file_names
                if has_bot_py:
                    return {"default_command": "python bot.py"}
                elif has_main_py:
                    return {"default_command": "python main.py"}
        except Exception as e:
            logger.error(f"Error auto-detecting entry point: {e}")
    return {"default_command": "python bot.py"}

@app.post("/api/workflow/setup")
async def workflow_setup_py(payload: ProjectSetupRequest):
    repo_name = payload.repo_name
    github_token = payload.github_token

    # 1. Pre-flight check
    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend",
    }
    async with httpx.AsyncClient() as client:
        try:
            rate_resp = await client.get("https://api.github.com/user", headers=headers)
            if rate_resp.status_code != 200:
                return JSONResponse(
                    status_code=rate_resp.status_code,
                    content={"error": f"Invalid GitHub Token pre-flight check failed: {rate_resp.text}"}
                )
            
            scopes_header = rate_resp.headers.get("X-OAuth-Scopes")
            if scopes_header is not None:
                scopes = [s.strip().lower() for s in scopes_header.split(",")]
                has_repo = "repo" in scopes
                has_workflow = "workflow" in scopes
                if not has_repo or not has_workflow:
                    return JSONResponse(
                        status_code=400,
                        content={"error": f"CRITICAL: Your GitHub Token is missing the mandatory 'workflow' or 'repo' permissions. Found scopes: {scopes_header}"}
                    )
        except Exception as err:
            return JSONResponse(
                status_code=500,
                content={"error": f"Failed to run token pre-flight validation: {str(err)}"}
            )

        workflow_yml = """name: 24x7 Bot Runner

on:
  schedule:
    - cron: '0 */4 * * *'
  workflow_dispatch:
  push:
    branches: [ main, master, dev ]

concurrency:
  group: bot-runner-${{ github.repository }}
  cancel-in-progress: true

jobs:
  run-bot:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          if [ -f requirements.txt ]; then
            pip install -r requirements.txt
          elif [ -f package.json ]; then
            sudo apt-get install -y nodejs npm
            npm install
          else
            pip install pyTelegramBotAPI telebot aiogram httpx
          fi

      - name: Run Bot Node
        env:
          BOT_TOKEN: ${{ secrets.BOT_TOKEN }}
        run: |
          RUN_COMMAND="${{ secrets.RUN_COMMAND }}"
          if [ -z "$RUN_COMMAND" ]; then
            if [ -f bot.py ]; then RUN_COMMAND="python bot.py"
            elif [ -f main.py ]; then RUN_COMMAND="python main.py"
            elif [ -f index.js ]; then RUN_COMMAND="node index.js"
            elif [ -f package.json ]; then RUN_COMMAND="npm start"
            else RUN_COMMAND="python bot.py"
            fi
          fi
          echo "Executing start command: $RUN_COMMAND"
          eval $RUN_COMMAND
"""

        try:
            await commit_github_file(
                client=client,
                token=github_token,
                repo_name=repo_name,
                path=".github/workflows/mbhp_bot.yml",
                content=workflow_yml,
                message="[Platform] Setup 24x7 Continuous Bot Runner Workflow"
            )

            p_list = load_projects_py()
            existing_idx = next((i for i, p in enumerate(p_list) if p.get("repo_name") == repo_name), -1)
            
            from datetime import datetime
            created_at = datetime.utcnow().isoformat() + "Z"
            
            new_proj = {
                "id": repo_name.replace("/", "-"),
                "repo_name": repo_name,
                "bot_token": "",
                "script_name": "mbhp_bot.yml",
                "username": repo_name.split("/")[1] if "/" in repo_name else repo_name,
                "status": "offline",
                "created_at": created_at,
                "request_count": 0,
                "health": "healthy"
            }

            if existing_idx == -1:
                p_list.append(new_proj)
            else:
                p_list[existing_idx]["status"] = "offline"
            
            save_projects_py(p_list)

            return {"success": True, "message": "Workflow .github/workflows/mbhp_bot.yml successfully committed!"}
        except Exception as err:
            err_msg = str(err)
            if "workflow scope" in err_msg or "workflow" in err_msg:
                return JSONResponse(
                    status_code=422,
                    content={"error": "Your Classic Personal Access Token is missing the 'workflow' scope. Please edit your token on GitHub and enable the 'workflow' checkbox under Developer Settings."}
                )
            if "Resource not accessible" in err_msg:
                return JSONResponse(
                    status_code=403,
                    content={"error": "Your Fine-grained Personal Access Token is missing the 'Workflows' permission. Please edit your token on GitHub, and under Repository Permissions, grant Read & Write access to 'Workflows'."}
                )
            if "403" in err_msg or "GITHUB_WRITE_FORBIDDEN" in err_msg:
                return JSONResponse(
                    status_code=403,
                    content={"error": "Access Denied (403): Your token does not have write access to this repository or lacks the 'workflow' permission. For Classic Tokens, check 'workflow' and 'repo'. For Fine-grained, check 'Workflows' (Read & Write)."}
                )
            if "404" in err_msg or "GITHUB_WRITE_NOT_FOUND" in err_msg:
                return JSONResponse(
                    status_code=404,
                    content={"error": "Repository Not Found (404): Please verify that your repository name is spelled correctly and that your token has access to this repository."}
                )
            return JSONResponse(status_code=500, content={"error": err_msg})

@app.post("/api/secrets/set")
async def secrets_set_py(payload: SecretsSetRequest):
    async with httpx.AsyncClient() as client:
        try:
            await set_github_secret(
                client=client,
                token=payload.github_token,
                repo_name=payload.repo_name,
                secret_name=payload.secret_name,
                secret_value=payload.secret_value
            )
            return {"success": True, "message": f"Secret {payload.secret_name} successfully set on GitHub!"}
        except Exception as err:
            logger.error(f"Failed to set GitHub secret: {err}")
            return JSONResponse(status_code=500, content={"error": str(err)})

@app.get("/api/workflow/status")
async def workflow_status_py(repo_name: str, github_token: str):
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend",
    }
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"https://api.github.com/repos/{repo_name}/actions/runs?per_page=10", headers=headers)
            if resp.status_code != 200:
                return JSONResponse(status_code=resp.status_code, content={"error": f"Failed to fetch runs: {resp.text}"})
            
            data = resp.json()
            runs = data.get("workflow_runs", [])
            bot_runs = [r for r in runs if r.get("name") == "24x7 Bot Runner" or "mbhp_bot.yml" in r.get("path", "") or "bot.yml" in r.get("path", "")]
            
            if not bot_runs:
                return {"status": "not_setup", "message": "No bot workflow run found. Setup is required."}
            
            latest_run = bot_runs[0]
            status = "Stopped"
            r_status = latest_run.get("status")
            r_conclusion = latest_run.get("conclusion")
            
            if r_status in ["queued", "requested", "waiting"]:
                status = "Queued"
            elif r_status == "in_progress":
                status = "Running"
            elif r_status == "completed":
                if r_conclusion == "success":
                    status = "Stopped"
                elif r_conclusion == "cancelled":
                    status = "Stopped"
                else:
                    status = "Failed"
            
            # Sync local state
            p_list = load_projects_py()
            idx = next((i for i, p in enumerate(p_list) if p.get("repo_name") == repo_name), -1)
            if idx != -1:
                p_list[idx]["status"] = "online" if status == "Running" else "offline"
                p_list[idx]["started_at"] = latest_run.get("created_at")
                save_projects_py(p_list)
                
            return {
                "status": status,
                "conclusion": r_conclusion,
                "run_id": latest_run.get("id"),
                "html_url": latest_run.get("html_url"),
                "created_at": latest_run.get("created_at"),
                "updated_at": latest_run.get("updated_at"),
                "trigger": latest_run.get("event")
            }
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/workflow/start")
async def workflow_start_py(payload: WorkflowStartRequest):
    repo_name = payload.repo_name
    github_token = payload.github_token
    default_branch = payload.branch or "main"
    
    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "telegram-bot-backend",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient() as client:
        try:
            url = f"https://api.github.com/repos/{repo_name}/actions/workflows/mbhp_bot.yml/dispatches"
            resp = await client.post(url, headers=headers, json={"ref": default_branch})
            if resp.status_code != 204:
                fallback_url = f"https://api.github.com/repos/{repo_name}/actions/workflows/bot.yml/dispatches"
                fallback_resp = await client.post(fallback_url, headers=headers, json={"ref": default_branch})
                if fallback_resp.status_code != 204:
                    return JSONResponse(status_code=fallback_resp.status_code, content={"error": f"Failed to dispatch: {fallback_resp.text}"})
            
            p_list = load_projects_py()
            idx = next((i for i, p in enumerate(p_list) if p.get("repo_name") == repo_name), -1)
            if idx != -1:
                p_list[idx]["status"] = "online"
                from datetime import datetime
                p_list[idx]["started_at"] = datetime.utcnow().isoformat() + "Z"
                save_projects_py(p_list)
                
            return {"success": True, "message": "Workflow dispatch triggered successfully."}
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/workflow/stop")
async def workflow_stop_py(payload: WorkflowStopRequest):
    repo_name = payload.repo_name
    github_token = payload.github_token
    
    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "telegram-bot-backend",
    }
    
    async with httpx.AsyncClient() as client:
        try:
            runs_resp = await client.get(f"https://api.github.com/repos/{repo_name}/actions/runs?status=in_progress", headers=headers)
            if runs_resp.status_code != 200:
                return JSONResponse(status_code=runs_resp.status_code, content={"error": f"GitHub error: {runs_resp.text}"})
            
            runs = runs_resp.json().get("workflow_runs", [])
            cancelled_count = 0
            for run in runs:
                path = run.get("path", "")
                name = run.get("name", "")
                if name == "24x7 Bot Runner" or "mbhp_bot.yml" in path or "bot.yml" in path:
                    cancel_resp = await client.post(f"https://api.github.com/repos/{repo_name}/actions/runs/{run.get('id')}/cancel", headers=headers)
                    if cancel_resp.status_code == 202:
                        cancelled_count += 1
                        
            p_list = load_projects_py()
            idx = next((i for i, p in enumerate(p_list) if p.get("repo_name") == repo_name), -1)
            if idx != -1:
                p_list[idx]["status"] = "offline"
                save_projects_py(p_list)
                
            return {"success": True, "cancelled_count": cancelled_count, "message": f"Cancelled {cancelled_count} running bot instances."}
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/workflow/restart")
async def workflow_restart_py(payload: WorkflowRestartRequest):
    repo_name = payload.repo_name
    github_token = payload.github_token
    branch = payload.branch or "main"
    
    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "telegram-bot-backend",
    }
    
    async with httpx.AsyncClient() as client:
        try:
            # 1. Cancel in-progress runs
            runs_resp = await client.get(f"https://api.github.com/repos/{repo_name}/actions/runs?status=in_progress", headers=headers)
            if runs_resp.status_code == 200:
                runs = runs_resp.json().get("workflow_runs", [])
                for run in runs:
                    path = run.get("path", "")
                    name = run.get("name", "")
                    if name == "24x7 Bot Runner" or "mbhp_bot.yml" in path or "bot.yml" in path:
                        await client.post(f"https://api.github.com/repos/{repo_name}/actions/runs/{run.get('id')}/cancel", headers=headers)
            
            import asyncio
            await asyncio.sleep(1.5)
            
            # 2. Start workflow
            url = f"https://api.github.com/repos/{repo_name}/actions/workflows/mbhp_bot.yml/dispatches"
            resp = await client.post(url, headers=headers, json={"ref": branch})
            if resp.status_code != 204:
                fallback_url = f"https://api.github.com/repos/{repo_name}/actions/workflows/bot.yml/dispatches"
                fallback_resp = await client.post(fallback_url, headers=headers, json={"ref": branch})
                if fallback_resp.status_code != 204:
                    return JSONResponse(status_code=fallback_resp.status_code, content={"error": f"Failed to trigger restart: {fallback_resp.text}"})
                    
            p_list = load_projects_py()
            idx = next((i for i, p in enumerate(p_list) if p.get("repo_name") == repo_name), -1)
            if idx != -1:
                p_list[idx]["status"] = "online"
                from datetime import datetime
                p_list[idx]["started_at"] = datetime.utcnow().isoformat() + "Z"
                save_projects_py(p_list)
                
            return {"success": True, "message": "Bot node restarted successfully."}
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/workflow/logs")
async def workflow_logs_py(repo_name: str, github_token: str, run_id: Optional[int] = None):
    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "telegram-bot-backend",
    }
    async with httpx.AsyncClient() as client:
        try:
            target_run_id = run_id
            if not target_run_id:
                runs_resp = await client.get(f"https://api.github.com/repos/{repo_name}/actions/runs?per_page=10", headers=headers)
                if runs_resp.status_code != 200:
                    return JSONResponse(status_code=runs_resp.status_code, content={"error": "Failed to fetch runs"})
                runs = runs_resp.json().get("workflow_runs", [])
                bot_runs = [r for r in runs if r.get("name") == "24x7 Bot Runner" or "mbhp_bot.yml" in r.get("path", "") or "bot.yml" in r.get("path", "")]
                if not bot_runs:
                    return {"logs": "No bot workflow runs found."}
                target_run_id = bot_runs[0].get("id")
                
            jobs_resp = await client.get(f"https://api.github.com/repos/{repo_name}/actions/runs/{target_run_id}/jobs", headers=headers)
            if jobs_resp.status_code != 200:
                return JSONResponse(status_code=jobs_resp.status_code, content={"error": "Failed to fetch jobs for run"})
            jobs = jobs_resp.json().get("jobs", [])
            if not jobs:
                return {"logs": "No jobs found for this run. Preparing logs..."}
                
            first_job = jobs[0]
            job_id = first_job.get("id")
            
            logs_resp = await client.get(f"https://api.github.com/repos/{repo_name}/actions/jobs/{job_id}/logs", headers=headers, follow_redirects=True)
            if logs_resp.status_code != 200:
                return {
                    "logs": f"[System Log] Job status is: {first_job.get('status')}. Logs will appear once it starts executing.",
                    "steps": first_job.get("steps", [])
                }
                
            logs_text = logs_resp.text
            lines = logs_text.split("\n")
            cropped_logs = "\n".join(lines[-300:])
            return {
                "logs": cropped_logs,
                "steps": first_job.get("steps", [])
            }
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/webhook")
@app.post("/webhook")
async def telegram_webhook(request: Request):
    return {"status": "ignored", "detail": "Daemon orchestrates bot instances via continuous Actions long-polling loops."}

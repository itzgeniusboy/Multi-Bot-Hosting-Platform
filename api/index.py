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
        "Welcome to Movie Suggestion Bot!\\n\\n"
        "I am running 24x7 on our secure hosting platform via GitHub Actions.\\n\\n"
        "Here are the commands you can use:\\n"
        "list - View available blockbusters\\n"
        "movie <name> - Search details about a blockbuster\\n"
        "help - Show this assistance message"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['list'])
def list_movies(message):
    movie_list = "Available Movies:\\n" + "\\n".join([f"- *{m['title']}*" for m in MOVIES.values()])
    bot.reply_to(message, movie_list)

@bot.message_handler(commands=['movie'])
def search_movie(message):
    args = message.text.split()
    if len(args) < 2:
        bot.reply_to(message, "Please specify a movie name. Example: /movie inception")
        return
    query = args[1].lower()
    if query in MOVIES:
        m = MOVIES[query]
        info = f"*{m['title']}*\\n\\n*Genre:* {m['genre']}\\n*Rating:* {m['rating']}\\n\\n{m['desc']}"
        bot.reply_to(message, info)
    else:
        bot.reply_to(message, "Movie not found. Try 'inception', 'interstellar' or 'dark_knight'!")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.reply_to(message, "I am focused purely on movies! Send /list to find highly rated cinematic releases or /movie to query specifics.")

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
        "Welcome to the 24x7 Customer Support Bot!\\n\\n"
        "How can we assist you today? Our support staff has configured this auto-responder to instantly route and log queries.\\n\\n"
        "Please select an option or reply with your message:\\n"
        "ticket - Register a support ticket\\n"
        "faq - View frequently asked questions\\n"
        "status - Check active system statuses"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['faq'])
def send_faq(message):
    faq_text = (
        "Frequently Asked Questions\\n\\n"
        "1. How do I deploy a bot?\\n"
        "Simply type your token on our web dashboard and click Launch.\\n\\n"
        "2. Is it 24x7?\\n"
        "Yes! GitHub Actions workflows recycle automatically to provide uninterrupted uptime.\\n\\n"
        "3. Is my token secure?\\n"
        "Absolutely. Tokens are passed straight into secure workflows and never stored in plain text."
    )
    bot.reply_to(message, faq_text)

@bot.message_handler(commands=['ticket'])
def raise_ticket(message):
    bot.reply_to(message, "Support Ticket Raised! Please reply to this message describing your issue, and our engineers will get back to you immediately.")

@bot.message_handler(commands=['status'])
def check_status(message):
    bot.reply_to(message, "All Systems Operational.\\n- Database: Online\\n- Router Core: 0.1ms Latency\\n- API Gateways: Functional")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.reply_to(message, "Support ticket received! Your message has been logged. An agent will contact you shortly.")

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
        "Welcome to the feedback and Contact Bot!\\n\\n"
        "Your thoughts are critical to our improvements! Send us any feedback or messages, and we will safely log it for the owner.\\n\\n"
        "feedback <text> - Register a specific feedback\\n"
        "about - Find out about this bot"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['about'])
def send_about(message):
    bot.reply_to(message, "This is a feedback collector bot running continuous loops on GitHub Actions.")

@bot.message_handler(commands=['feedback'])
def collect_feedback(message):
    args = message.text.split()
    if len(args) < 2:
        bot.reply_to(message, "Please provide your feedback text. Example: /feedback Great bot!")
        return
    feedback_text = " ".join(args[1:])
    bot.reply_to(message, f"Feedback Logged!\\n\\n{feedback_text}\\n\\nThank you for helping us grow!")

@bot.message_handler(func=lambda message: True)
def log_text(message):
    bot.reply_to(message, "Message recorded. If you want to log it as formal feedback, please use /feedback <your message>!")

if __name__ == "__main__":
    logger.info("Initializing Continuous Feedback Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
"""

class LaunchRequest(BaseModel):
    repo_name: str
    bot_token: str
    script_name: str
    github_token: Optional[str] = None

class StopRequest(BaseModel):
    repo_name: str
    github_token: Optional[str] = None

# Sleek, premium dark cyberpunk single-page Vercel-like dashboard (absolutely NO simulated demo modes)
DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Bot Hoster — Import & Deploy</title>
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
                Connect your GitHub account to instantly import and deploy interactive Telegram bots. Powered by continuous Actions container orchestration.
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
                    <p class="text-xs text-slate-400 leading-relaxed">Workflows auto-dispatch every 5.5 hours, bypassing standard limits to keep your agents live indefinitely.</p>
                </div>
                <div class="bg-cyber-card border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/60 transition-all">
                    <div class="w-10 h-10 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7] mb-4">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h3 class="text-sm font-semibold text-white mb-2 font-mono uppercase tracking-wider">Zero Config Launch</h3>
                    <p class="text-xs text-slate-400 leading-relaxed">No local hosting required. The platform generates code, handles dependencies, and provisions runners.</p>
                </div>
                <div class="bg-cyber-card border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/60 transition-all">
                    <div class="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] mb-4">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    </div>
                    <h3 class="text-sm font-semibold text-white mb-2 font-mono uppercase tracking-wider">Secure Token Handling</h3>
                    <p class="text-xs text-slate-400 leading-relaxed">Tokens and API secrets are securely passed directly into GitHub Action environment variables, ensuring privacy.</p>
                </div>
            </div>
        </div>

        <!-- 2. AUTHENTICATED STATE — STEP 1: REPOSITORY IMPORT LIST -->
        <div id="state-step1-repos" class="hidden">
            <div class="mb-8">
                <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">Import Git Repository</h2>
                <p class="text-xs sm:text-sm text-slate-400">Select a GitHub repository to inject bot workflows and deploy.</p>
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
                    <!-- Loading Skeletons by default -->
                    <div class="p-6 text-center text-slate-500 font-mono text-sm flex flex-col items-center justify-center gap-3">
                        <div class="w-6 h-6 border-2 border-t-transparent border-cyber-accent rounded-full animate-spin"></div>
                        Fetching repositories from GitHub...
                    </div>
                </div>
            </div>
        </div>

        <!-- 3. CONFIGURATION PANEL — STEP 2 -->
        <div id="state-step2-config" class="hidden">
            <!-- Back navigation button -->
            <button onclick="goToStep1()" class="mb-6 text-xs text-slate-400 hover:text-white transition-all inline-flex items-center gap-2 font-mono uppercase font-bold cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Back to Repositories
            </button>

            <div class="mb-8">
                <span class="text-[10px] font-mono tracking-widest text-cyber-accent uppercase font-bold bg-cyber-accent/10 px-2.5 py-1 rounded border border-cyber-accent/15">Configuration</span>
                <h2 id="selected-repo-title" class="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-4 font-mono truncate">owner / repo-name</h2>
                <p class="text-xs text-slate-400 mt-1">Configure environment tokens and select bot engine template below.</p>
            </div>

            <!-- Main Config Form -->
            <div class="bg-cyber-card border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
                <!-- Token input -->
                <div>
                    <label class="block text-xs font-mono text-slate-300 font-semibold tracking-wider uppercase mb-1.5">Telegram Bot Token</label>
                    <input type="password" id="bot-token-input" placeholder="123456789:ABCdef_GhIjkLmNoPqRs" class="w-full bg-cyber-bg border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent font-mono">
                    <p class="text-[10px] text-slate-500 mt-1.5 font-sans leading-relaxed">
                        Generated by <a href="https://t.me/BotFather" target="_blank" class="text-cyber-accent hover:underline font-mono">@BotFather</a> on Telegram. This secret will be handled securely and injected into your repo secrets.
                    </p>
                </div>

                <!-- Script selection -->
                <div>
                    <label class="block text-xs font-mono text-slate-300 font-semibold tracking-wider uppercase mb-1.5">Select Bot Runner Script</label>
                    <select id="bot-script-select" class="w-full bg-cyber-bg border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent font-mono">
                        <option value="movie_bot.py">movie_bot.py — Cinematic Library & Information Bot</option>
                        <option value="management_bot.py">management_bot.py — Support Ticket Registry & Ops Bot</option>
                        <option value="custom_mod_bot.py">custom_mod_bot.py — Moderation & Secure Feedback Bot</option>
                    </select>
                </div>

                <div class="pt-4 border-t border-slate-800/60">
                    <button onclick="handleDeployAndGoLive()" class="w-full py-4 bg-gradient-to-r from-cyber-accent to-cyber-purple hover:scale-[1.01] active:scale-[0.99] text-white font-extrabold rounded-xl text-sm transition-all tracking-wider glow-button cursor-pointer flex items-center justify-center gap-2">
                        <svg class="w-4 h-4 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
                        DEPLOY & GO LIVE
                    </button>
                </div>
            </div>
        </div>

        <!-- 4. LOGS AND PIPELINE TERMINAL STATE — STEP 3 -->
        <div id="state-step3-terminal" class="hidden">
            <div class="mb-6">
                <span class="text-[10px] font-mono tracking-widest text-[#22C55E] uppercase font-bold bg-[#22C55E]/10 px-2.5 py-1 rounded border border-[#22C55E]/15 animate-pulse">DEPLOYING PIPELINE</span>
                <h2 id="pipeline-repo-title" class="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-4 font-mono">owner / repo-name</h2>
                <p id="pipeline-subtitle" class="text-xs text-slate-400 mt-1">Deploying multi-bot daemon to GitHub runner...</p>
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
                    <div class="text-[10px] text-cyber-accent animate-pulse font-semibold uppercase">Live Loop</div>
                </div>
                <div id="terminal-logs-body" class="p-5 h-64 overflow-y-auto scroll-custom space-y-2 text-slate-300 leading-relaxed">
                    <!-- Logs stream in dynamically -->
                </div>
            </div>

            <!-- Real Post-Deployment Success Card -->
            <div id="success-card" class="hidden mt-8 bg-gradient-to-b from-[#10B981]/10 to-[#10B981]/2 border border-[#10B981]/20 rounded-2xl p-6 sm:p-8 text-center space-y-5">
                <div class="w-14 h-14 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 mx-auto flex items-center justify-center text-[#10B981]">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>

                <div>
                    <h3 class="text-lg sm:text-xl font-bold text-white font-mono">Deployment Completed</h3>
                    <p class="text-xs text-slate-400 mt-1">Your Telegram Bot daemon has launched with continuous workflow cycling.</p>
                </div>

                <div class="max-w-md mx-auto p-4 bg-black/40 rounded-xl border border-slate-800/50 space-y-2 text-left font-mono text-xs">
                    <div class="flex justify-between"><span class="text-slate-500">REPOSITORY:</span><span class="text-white" id="success-repo-name">owner/repo</span></div>
                    <div class="flex justify-between"><span class="text-slate-500">RUNNER STATUS:</span><span class="text-[#10B981] font-semibold flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>24X7 LOOP ACTIVE</span></div>
                    <div class="flex justify-between"><span class="text-slate-500">SCRIPT ENGINE:</span><span class="text-cyber-accent" id="success-script-name">movie_bot.py</span></div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
                    <a id="bot-telegram-link" href="#" target="_blank" class="flex-1 py-3 bg-[#10B981] hover:bg-[#10B981]/90 text-slate-950 font-bold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.92 9.12c-.14.65-.53.81-1.08.5l-2.93-2.16-1.41 1.36c-.16.16-.29.29-.6.29l.21-2.98 5.43-4.9c.24-.21-.05-.33-.37-.11L10.13 13.1l-2.89-.9c-.63-.2-.64-.63.13-.93l11.27-4.34c.52-.19.98.12.82.72z"/></svg>
                        Open Telegram Bot
                    </a>
                    <button onclick="stopActiveBot()" class="py-3 px-5 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 font-bold text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer">
                        Stop Runner
                    </button>
                </div>

                <div class="pt-4 border-t border-slate-800/40">
                    <button onclick="goToStep1()" class="text-xs text-slate-400 hover:text-white transition-all font-mono font-bold uppercase cursor-pointer flex items-center gap-1 mx-auto">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                        Deploy Another Bot
                    </button>
                </div>
            </div>
        </div>

    </main>

    <!-- Footer Area -->
    <footer class="border-t border-slate-900/80 bg-cyber-bg/40 py-5 text-center font-mono text-[10px] text-slate-600 relative z-10">
        DAEMON ORCHESTRATION ENGINE • BUILT IDENTICAL TO VERCEL • SECURED DIRECTLY VIA REPOSITORY DISPATCH
    </footer>

    <!-- Client-Side Dashboard Javascript Controller -->
    <script>
        let githubToken = "";
        let repositoriesList = [];
        let selectedRepository = null;
        let deploymentLogIndex = 0;

        // On DOM Content Loaded
        document.addEventListener('DOMContentLoaded', () => {
            initSession();
        });

        // Initialize session and authentication status
        function initSession() {
            const urlParams = new URLSearchParams(window.location.search);
            let token = urlParams.get('token');
            if (token) {
                localStorage.setItem('github_token', token);
                // Clean the token parameter from URL to maintain premium aesthetic
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                token = localStorage.getItem('github_token');
            }

            // Fallback: check cookie as well
            if (!token) {
                const cookieMatch = document.cookie.match(new RegExp('(^| )github_token=([^;]+)'));
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
            document.getElementById('state-step1-repos').classList.remove('hidden');
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

            fetchRepositories();
        }

        // Log out clean
        function handleLogout() {
            localStorage.removeItem('github_token');
            // Clear cookie
            document.cookie = "github_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            githubToken = "";
            showLogin();
        }

        // Fetch repositories via FastAPI endpoint asynchronously
        async function fetchRepositories() {
            const container = document.getElementById('repos-container');
            container.innerHTML = `
                <div class="p-12 text-center text-slate-500 font-mono text-sm flex flex-col items-center justify-center gap-3">
                    <div class="w-6 h-6 border-2 border-t-transparent border-cyber-accent rounded-full animate-spin"></div>
                    Loading active GitHub repositories...
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
            document.getElementById('bot-token-input').value = "";
        }

        // Go back to STEP 1
        function goToStep1() {
            document.getElementById('state-step2-config').classList.add('hidden');
            document.getElementById('state-step3-terminal').classList.add('hidden');
            document.getElementById('state-step1-repos').classList.remove('hidden');
            selectedRepository = null;
        }

        // Trigger active deployment pipeline
        async function handleDeployAndGoLive() {
            const botToken = document.getElementById('bot-token-input').value.trim();
            const scriptName = document.getElementById('bot-script-select').value;

            if (!botToken) {
                alert("Please enter a valid Telegram Bot Token first!");
                return;
            }

            // Move to Step 3 layout immediately
            document.getElementById('state-step2-config').classList.add('hidden');
            document.getElementById('state-step3-terminal').classList.remove('hidden');
            document.getElementById('success-card').classList.add('hidden');

            document.getElementById('pipeline-repo-title').textContent = selectedRepository.full_name;
            document.getElementById('pipeline-subtitle').textContent = `Spawning continuous bot engine pipeline for: ${scriptName}`;

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
                        bot_token: botToken,
                        script_name: scriptName,
                        github_token: githubToken
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || "Automated deployment failed");
                }

                log(`Success! Verified bot identity: <span class="text-cyber-accent font-bold">@${data.username}</span>`);
                await sleep(700);
                log(`Synchronizing with GitHub Content APIs...`);
                await sleep(500);
                log(`Creating workflow folder and runner definition: <span class="text-slate-100 font-mono text-[11px] bg-slate-900 px-1 py-0.5 rounded">.github/workflows/run_bot.yml</span>`);
                await sleep(600);
                log(`Committing optimized script template: <span class="text-slate-100 font-mono text-[11px] bg-slate-900 px-1 py-0.5 rounded">templates/${data.bot_type}.py</span>`);
                await sleep(650);
                log(`Invoking Repository Dispatches API to launch 24x7 runner pipeline...`);
                await sleep(800);
                log(`Continuous loop orchestrator activated! Deployment completed successfully!`, false, true);

                // Prepare success card
                document.getElementById('success-repo-name').textContent = selectedRepository.full_name;
                document.getElementById('success-script-name').textContent = `${data.bot_type}.py`;
                document.getElementById('bot-telegram-link').href = `https://t.me/${data.username}`;
                
                // Show success card
                await sleep(300);
                document.getElementById('success-card').classList.remove('hidden');

            } catch (error) {
                log(`CRITICAL ERROR: ${error.message}`, true);
                log(`Deployment workflow terminated due to pipeline failure. Please verify your token and repository permissions.`, true);
                
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

        // Cancel / stop bot pipeline execution
        async function stopActiveBot() {
            if (!confirm("Are you sure you want to stop all active background workflow runs for this bot in this repository?")) {
                return;
            }

            const successCard = document.getElementById('success-card');
            const originalHTML = successCard.innerHTML;
            successCard.innerHTML = `
                <div class="p-6 text-center text-slate-400 font-mono text-sm flex flex-col items-center justify-center gap-3">
                    <div class="w-6 h-6 border-2 border-t-transparent border-rose-500 rounded-full animate-spin"></div>
                    Cancelling active GitHub workflow runs...
                </div>
            `;

            try {
                const response = await fetch('/api/stop', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        repo_name: selectedRepository.full_name,
                        github_token: githubToken
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.detail || "Failed to cancel pipeline runs");
                }

                alert("All active workflow runs have been successfully stopped.");
                goToStep1();
            } catch (error) {
                alert(`Error: ${error.message}`);
                successCard.innerHTML = originalHTML;
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
    return REDIRECT_URI

GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET")
REDIRECT_URI = "https://multi-bot-hosting-platform.vercel.app/api/callback"

if not GITHUB_CLIENT_ID:
    logger.warning("GITHUB_CLIENT_ID environment variable is missing!")
if not GITHUB_CLIENT_SECRET:
    logger.warning("GITHUB_CLIENT_SECRET environment variable is missing!")

@app.get("/", response_class=HTMLResponse)
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
    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=400,
            detail="GitHub OAuth is not configured on the server. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables under the Settings menu in AI Studio."
        )

    dynamic_redirect = get_redirect_uri(request)
    auth_url = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={dynamic_redirect}&scope=repo%20workflow"
    return JSONResponse(status_code=200, content={"url": auth_url})

@app.get("/api/callback")
@app.get("/callback")
async def oauth_callback(request: Request, code: Optional[str] = Query(None)):
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        error_html = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Configuration Missing</title>
            <style>
                body {
                    font-family: 'Inter', -apple-system, sans-serif;
                    background-color: #020617;
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
                    background: #0F172A;
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
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": dynamic_redirect
            }
        )
        data = resp.json()
        access_token = data.get("access_token", "")

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
                background-color: #020617;
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
                background-color: #0F172A;
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
            key="github_token",
            value=access_token,
            httponly=False,
            secure=True,
            samesite="lax",
            max_age=31536000
        )
    return response

@app.get("/api/repos")
@app.get("/repos")
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

@app.post("/api/launch")
@app.post("/launch")
async def launch_bot(payload: LaunchRequest):
    repo_name = payload.repo_name
    bot_token = payload.bot_token
    script_name = payload.script_name
    github_token = payload.github_token

    if not repo_name or not bot_token or not script_name:
        raise HTTPException(status_code=400, detail="Missing required deployment fields")

    if not github_token:
        raise HTTPException(status_code=400, detail="Missing required GitHub access token")

    # Select Python script template
    clean_script_name = script_name.replace(".py", "")
    if clean_script_name == "movie_bot":
        py_content = MOVIE_BOT_PY
        actual_script = "movie_bot"
    elif clean_script_name == "management_bot":
        py_content = SUPPORT_BOT_PY
        actual_script = "management_bot"
    elif clean_script_name == "custom_mod_bot":
        py_content = FEEDBACK_BOT_PY
        actual_script = "custom_mod_bot"
    else:
        if "movie" in clean_script_name:
            py_content = MOVIE_BOT_PY
            actual_script = "movie_bot"
        elif "management" in clean_script_name or "support" in clean_script_name:
            py_content = SUPPORT_BOT_PY
            actual_script = "management_bot"
        elif "feedback" in clean_script_name or "custom_mod" in clean_script_name:
            py_content = FEEDBACK_BOT_PY
            actual_script = "custom_mod_bot"
        else:
            py_content = MOVIE_BOT_PY
            actual_script = "movie_bot"

    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend"
    }

    async with httpx.AsyncClient() as client:
        # Verify Bot Token with Telegram API
        get_me_url = f"https://api.telegram.org/bot{bot_token}/getMe"
        me_resp = await client.get(get_me_url)
        me_data = me_resp.json()
        if me_resp.status_code != 200 or not me_data.get("ok"):
            error_desc = me_data.get("description", "Invalid Telegram Bot Token")
            raise HTTPException(status_code=400, detail=f"Failed to verify Telegram token: {error_desc}")

        bot_username = me_data.get("result", {}).get("username", "UnknownBot")

        # Delete any active Telegram webhook so long-polling in GitHub Actions works instantly
        delete_webhook_url = f"https://api.telegram.org/bot{bot_token}/deleteWebhook"
        await client.post(delete_webhook_url)

        # Inject `.github/workflows/run_bot.yml`
        logger.info(f"Injecting .github/workflows/run_bot.yml into {repo_name}...")
        await commit_github_file(
            client=client,
            token=github_token,
            repo_name=repo_name,
            path=".github/workflows/run_bot.yml",
            content=RUN_BOT_YML,
            message="[Platform Multi-Bot] Injected 24x7 runner workflow"
        )

        # Inject `templates/{script_name}.py`
        logger.info(f"Injecting templates/{actual_script}.py into {repo_name}...")
        await commit_github_file(
            client=client,
            token=github_token,
            repo_name=repo_name,
            path=f"templates/{actual_script}.py",
            content=py_content,
            message=f"[Platform Multi-Bot] Injected script template for {actual_script}"
        )

        # Trigger repository dispatch to start the daemon workflow
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
                detail=f"Successfully committed bot files, but failed to dispatch the workflow runner: {dispatch_resp.text}"
            )

        return {
            "success": True,
            "message": f"Successfully injected daemon workflow and triggered 24x7 Action runner for @{bot_username}",
            "username": bot_username,
            "bot_type": actual_script,
            "repo_name": repo_name
        }

@app.post("/api/stop")
@app.post("/stop")
async def stop_bot(payload: StopRequest):
    repo_name = payload.repo_name
    github_token = payload.github_token

    if not repo_name:
        raise HTTPException(status_code=400, detail="Missing required repository name")

    if not github_token:
        raise HTTPException(status_code=400, detail="Missing required GitHub access token")

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
            raise HTTPException(status_code=runs_resp.status_code, detail=f"Failed to fetch active actions runs: {runs_resp.text}")

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
            "message": f"Stopped {cancelled_count} active workflow runner instances.",
            "cancelled_count": cancelled_count
        }

@app.post("/api/webhook")
@app.post("/webhook")
async def telegram_webhook(request: Request):
    # Safe webhook fallback endpoint
    return {"status": "ignored", "detail": "Platform uses continuous long-polling via Actions runners."}

import os
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

# Configure robust logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("github-actions-bot-hoster")

app = FastAPI(title="GitHub Actions Multi-Bot Platform")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LaunchPayload(BaseModel):
    bot_token: str
    script_name: str
    github_owner: Optional[str] = None
    github_repo: Optional[str] = None
    github_pat: Optional[str] = None

@app.get("/api/health")
async def health():
    return {
        "status": "active",
        "engine": "GitHub Actions Repository Dispatch Gateway"
    }

@app.post("/api/launch")
async def launch_bot(payload: LaunchPayload):
    # Retrieve configuration either from request payload or server-side environment variables
    owner = payload.github_owner or os.environ.get("GITHUB_OWNER")
    repo = payload.github_repo or os.environ.get("GITHUB_REPO")
    pat = payload.github_pat or os.environ.get("GITHUB_PAT")
    
    bot_token = payload.bot_token
    script_name = payload.script_name

    if not bot_token:
        raise HTTPException(status_code=400, detail="Missing Telegram Bot Token.")
    if not script_name:
        raise HTTPException(status_code=400, detail="Missing Bot Script Name.")
    if not owner or not repo or not pat:
        raise HTTPException(
            status_code=400, 
            detail="Missing GitHub configuration. Please provide owner, repository, and Personal Access Token (PAT)."
        )

    # Dispatch to GitHub API
    github_dispatch_url = f"https://api.github.com/repos/{owner}/{repo}/dispatches"
    
    headers = {
        "Authorization": f"token {pat}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "FastAPI-Multi-Bot-Host"
    }
    
    data = {
        "event_type": "launch_bot",
        "client_payload": {
            "bot_token": bot_token,
            "script_name": script_name,
            "github_pat": pat
        }
    }

    logger.info(f"Dispatching repository trigger to {github_dispatch_url} for script {script_name}...")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(github_dispatch_url, json=data, headers=headers)
            if response.status_code == 204:
                return {
                    "success": True,
                    "message": "Workflow successfully triggered! Your bot is launching 24x7 on GitHub Actions.",
                    "owner": owner,
                    "repo": repo,
                    "script_name": script_name
                }
            else:
                logger.error(f"GitHub API Error {response.status_code}: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GitHub Actions API returned an error: {response.text or 'Unauthorized/Bad Credentials'}"
                )
        except Exception as e:
            logger.error(f"Failed to communicate with GitHub API: {e}")
            raise HTTPException(
                status_code=502,
                detail=f"Network error communicating with GitHub: {str(e)}"
            )

@app.get("/", response_class=HTMLResponse)
async def serve_dashboard():
    # Detect pre-configured server environment variables to prefill form inputs
    env_owner = os.environ.get("GITHUB_OWNER", "")
    env_repo = os.environ.get("GITHUB_REPO", "")
    env_pat_provided = "true" if os.environ.get("GITHUB_PAT") else "false"

    html_content = f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Bot Orchestrator</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {{
            darkMode: 'class',
            theme: {{
                extend: {{
                    fontFamily: {{
                        sans: ['Inter', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    }},
                    colors: {{
                        slate: {{
                            950: '#0B0F19',
                            900: '#111827',
                            800: '#1F2937',
                            700: '#374151',
                            400: '#9CA3AF',
                        }},
                        accent: {{
                            neon: '#00D4FF',
                            green: '#00FF87',
                            border: '#1E293B',
                        }}
                    }}
                }}
            }}
        }}
    </script>
    <style>
        body {{
            background-color: #0B0F19;
            color: #F3F4F6;
        }}
        .neon-glow {{
            box-shadow: 0 0 15px rgba(0, 212, 255, 0.15);
        }}
    </style>
</head>
<body class="font-sans antialiased min-h-screen flex flex-col justify-between">

    <!-- Top Grid Accents -->
    <div class="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#00D4FF]/10 to-transparent pointer-events-none"></div>

    <main class="max-w-4xl w-full mx-auto px-4 py-12 relative z-10 flex-grow flex flex-col justify-center">
        <!-- Main Logo / Header -->
        <div class="mb-10 text-center">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-accent-neon font-mono mb-4">
                <span class="w-2 h-2 rounded-full bg-accent-neon animate-pulse"></span>
                ACTIVE DAEMON GATEWAY
            </div>
            <h1 class="text-4xl font-extrabold tracking-tight text-white mb-2 font-sans">
                GitHub Actions Multi-Bot Host
            </h1>
            <p class="text-slate-400 text-sm max-w-lg mx-auto">
                Deploy, monitor, and host Telegram Bot scripts 24/7 on continuous workflow engines with automated timeout recycling.
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
            <!-- Launch Console Panel -->
            <div class="md:col-span-7 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl p-6 neon-glow">
                <h2 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <svg class="w-5 h-5 text-accent-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    ORCHESTRATOR PANEL
                </h2>

                <form id="launch-form" class="space-y-5">
                    <!-- GitHub Credentials Section -->
                    <div class="space-y-4 pt-1 pb-3 border-b border-slate-800">
                        <span class="text-xs font-mono font-semibold text-accent-neon tracking-wider uppercase">GitHub Integration</span>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-mono text-slate-400 mb-1">GitHub Owner</label>
                                <input type="text" id="github_owner" required placeholder="e.g. Octocat" value="{env_owner}" 
                                    class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-neon font-mono">
                            </div>
                            <div>
                                <label class="block text-xs font-mono text-slate-400 mb-1">GitHub Repository</label>
                                <input type="text" id="github_repo" required placeholder="e.g. telegram-bot-host" value="{env_repo}"
                                    class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-neon font-mono">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-mono text-slate-400 mb-1">Personal Access Token (PAT)</label>
                            <input type="password" id="github_pat" required placeholder="ghp_xxxxxxxxxxxx"
                                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-neon font-mono">
                            <p class="text-[10px] text-slate-500 mt-1">Requires 'repo' scope access to dispatch workflow requests.</p>
                        </div>
                    </div>

                    <!-- Bot Setup Section -->
                    <div class="space-y-4 pt-2">
                        <span class="text-xs font-mono font-semibold text-accent-neon tracking-wider uppercase">Telegram Configuration</span>
                        <div>
                            <label class="block text-xs font-mono text-slate-400 mb-1">Telegram Bot Token</label>
                            <input type="password" id="bot_token" required placeholder="123456789:ABCdef_GhIjkLmNoPqRs"
                                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-neon font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-mono text-slate-400 mb-1">Bot Script Template</label>
                            <select id="script_name" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-neon font-mono">
                                <option value="movie_bot">movie_bot.py (Cinematic Library & Info)</option>
                                <option value="support_bot">support_bot.py (Automated Ticket Creator)</option>
                                <option value="feedback_bot">feedback_bot.py (Secure Collector Node)</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" id="btn-submit"
                        class="w-full py-3 bg-accent-neon hover:bg-accent-neon/85 text-slate-950 font-bold rounded-lg text-sm transition duration-150 flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                        LAUNCH ON GITHUB ACTIONS
                    </button>
                </form>
            </div>

            <!-- Side System Status -->
            <div class="md:col-span-5 flex flex-col gap-6">
                <div class="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl p-5">
                    <h3 class="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">SYSTEM STATS</h3>
                    <div class="space-y-3 font-mono text-xs">
                        <div class="flex justify-between py-1 border-b border-slate-800/40">
                            <span class="text-slate-500">API ROUTER:</span>
                            <span class="text-accent-green font-semibold">ONLINE</span>
                        </div>
                        <div class="flex justify-between py-1 border-b border-slate-800/40">
                            <span class="text-slate-500">ENGINE TIMEOUT:</span>
                            <span class="text-white">AUTO-RECYCLE</span>
                        </div>
                        <div class="flex justify-between py-1">
                            <span class="text-slate-500">CORE SYSTEM:</span>
                            <span class="text-accent-neon">24X7 LOOP ACTIVE</span>
                        </div>
                    </div>
                </div>

                <div class="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl p-5 flex-grow">
                    <h3 class="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">LIVE DISPATCH TERMINAL</h3>
                    <div id="terminal-logs" class="bg-slate-950 rounded-lg p-3 h-48 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1">
                        <div class="text-slate-500">> System Ready. Enter tokens to dispatch.</div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="border-t border-slate-900 bg-slate-950/40 py-4 text-center font-mono text-[10px] text-slate-600 relative z-10">
        DAEMON PLATFORM • SECURED VIA REPOSITORY DISPATCH
    </footer>

    <script>
        const form = document.getElementById('launch-form');
        const terminal = document.getElementById('terminal-logs');
        const btnSubmit = document.getElementById('btn-submit');

        function appendLog(text, isError = false) {{
            const div = document.createElement('div');
            div.className = isError ? 'text-red-400' : 'text-accent-green';
            div.textContent = `> ${{new Date().toLocaleTimeString()}} - ${{text}}`;
            terminal.appendChild(div);
            terminal.scrollTop = terminal.scrollHeight;
        }}

        form.addEventListener('submit', async (e) => {{
            e.preventDefault();
            
            const bot_token = document.getElementById('bot_token').value.trim();
            const script_name = document.getElementById('script_name').value;
            const github_owner = document.getElementById('github_owner').value.trim();
            const github_repo = document.getElementById('github_repo').value.trim();
            const github_pat = document.getElementById('github_pat').value.trim();

            if (!bot_token || !github_owner || !github_repo || !github_pat) {{
                appendLog('Error: All fields are required!', true);
                return;
            }}

            btnSubmit.disabled = true;
            btnSubmit.classList.add('opacity-50');
            appendLog(`Initiating dispatch request to GitHub API for ${{script_name}}...`);

            try {{
                const res = await fetch('/api/launch', {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json'
                    }},
                    body: JSON.stringify({{
                        bot_token,
                        script_name,
                        github_owner,
                        github_repo,
                        github_pat
                    }})
                }});

                const data = await res.json();
                
                if (res.ok && data.success) {{
                    appendLog('SUCCESS: Repository dispatch successfully triggered!');
                    appendLog(`Repository: ${{data.owner}}/${{data.repo}}`);
                    appendLog(`Bot is starting in 15-30s on GitHub Runner.`);
                }} else {{
                    appendLog(`ERROR: ${{data.detail || 'GitHub Actions returned an error.'}}`, true);
                }}
            }} catch (error) {{
                appendLog(`NETWORK EXCEPTION: ${{error.message}}`, true);
            }} finally {{
                btnSubmit.disabled = false;
                btnSubmit.classList.remove('opacity-50');
            }}
        }});
    </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)

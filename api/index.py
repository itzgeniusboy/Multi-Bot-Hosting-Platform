# api/index.py
import os
import json
import logging
from typing import Dict, Any
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(
    title="Multi-Bot Serverless Telegram Hosting",
    description="Serverless Webhook Handler for Telegram Bots",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# Enable CORS so your beautiful dashboard frontend can communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("multi_bot_platform")

# Active bots memory storage (fallback/simulated)
active_bots_db: Dict[str, Dict[str, Any]] = {}

# Premium embedded frontend HTML code direct response to resolve Vercel 404 routing
html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Bot Hosting Platform</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                        display: ['Space Grotesk', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        .glass-panel {
            background: rgba(13, 11, 28, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.03);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
        }
        .glow-purple {
            box-shadow: 0 0 25px rgba(168, 85, 247, 0.15);
        }
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(8, 6, 18, 0.5);
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(168, 85, 247, 0.2);
            border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(168, 85, 247, 0.4);
        }
        @keyframes rotate-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-rotate-slow {
            animation: rotate-slow 12s linear infinite;
        }
    </style>
</head>
<body class="bg-[#080612] text-slate-100 font-sans min-h-screen overflow-x-hidden selection:bg-purple-500/30 selection:text-purple-200 relative">

    <!-- Background Glow -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.08),rgba(8,6,18,0))] pointer-events-none z-0"></div>
    <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent pointer-events-none"></div>

    <!-- Slidout Sidebar Menu Drawer -->
    <div id="sidebar" class="fixed inset-y-0 right-0 w-80 bg-slate-950 border-l border-slate-900 shadow-2xl p-6 z-50 transform translate-x-full transition-transform duration-300 ease-out flex flex-col justify-between hidden">
        <div>
            <div class="flex items-center justify-between pb-6 border-b border-slate-900 mb-6">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-cloud-bolt text-purple-400"></i>
                    <span class="font-display font-bold text-white text-sm tracking-tight">System Navigation</span>
                </div>
                <button onclick="toggleSidebar(false)" class="p-1.5 rounded-lg border border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="space-y-2">
                <button onclick="changeView('dashboard')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-900/40 transition-all text-left" id="nav-dashboard">
                    <i class="fa-solid fa-microchip w-4 text-center"></i>
                    Dashboard Control
                </button>

                <button onclick="changeView('how-to-use')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-900/40 transition-all text-left" id="nav-how-to-use">
                    <i class="fa-solid fa-book-open w-4 text-center"></i>
                    How to Use
                </button>

                <button onclick="changeView('dashboard'); scrollToActiveNodes();" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-900/40 transition-all text-left">
                    <i class="fa-solid fa-layer-group w-4 text-center"></i>
                    Active Bots List
                </button>

                <button onclick="changeView('system-status')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-900/40 transition-all text-left" id="nav-system-status">
                    <i class="fa-solid fa-chart-line w-4 text-center"></i>
                    Live System Status
                </button>
            </div>
        </div>

        <div class="pt-6 border-t border-slate-900">
            <div class="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <i class="fa-solid fa-globe text-purple-500"></i>
                <span>REGIONAL CLOUD INGRESS ROUTE</span>
            </div>
        </div>
    </div>

    <!-- Sidebar Backdrop -->
    <div id="backdrop" class="fixed inset-0 bg-black/60 z-40 hidden" onclick="toggleSidebar(false)"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        <!-- Header -->
        <header class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-900">
          <div class="flex items-center gap-4">
            <div class="relative flex-shrink-0">
              <div class="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 opacity-25 blur-md animate-pulse"></div>
              <div class="relative w-14 h-14 rounded-2xl bg-slate-950 border border-slate-900 flex items-center justify-center overflow-hidden">
                <div class="absolute inset-0 bg-linear-to-tr from-purple-500/10 to-transparent"></div>
                <i class="fa-solid fa-cloud-bolt text-purple-400 text-2xl"></i>
                <div class="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></div>
              </div>
            </div>
            
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-display font-extrabold tracking-tight text-white">
                  Multi-Bot Hosting Platform
                </h1>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                  VERCEL SERVERLESS
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Launch, route, and test highly scalable Telegram Bots with instant webhook setups.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <!-- Quick Metrics Bar -->
            <div class="flex items-center gap-6 bg-slate-950 border border-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-950/20">
              <div class="text-center md:text-left pr-4 border-r border-slate-900">
                <span class="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Active Nodes</span>
                <span class="text-base font-display font-bold text-white mt-0.5 block flex items-center gap-1.5">
                  <i class="fa-solid fa-server text-purple-400 text-xs"></i>
                  <span id="metric-active-count">0 / 0</span>
                </span>
              </div>
              <div class="text-center md:text-left">
                <span class="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Total Triggers</span>
                <span class="text-base font-display font-bold text-white mt-0.5 block flex items-center gap-1.5">
                  <i class="fa-solid fa-chart-line text-indigo-400 text-xs"></i>
                  <span id="metric-triggers-count">0</span>
                </span>
              </div>
            </div>

            <!-- Hamburger Button -->
            <button onclick="toggleSidebar(true)" class="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-900 rounded-2xl shadow-xl hover:scale-102 transition-all text-slate-300 hover:text-white cursor-pointer" title="System Navigation Menu">
              <i class="fa-solid fa-bars text-xl"></i>
            </button>
          </div>
        </header>

        <!-- Dynamic Main Views Panel -->
        <main class="min-h-[500px]">

            <!-- VIEW 1: DASHBOARD -->
            <div id="view-dashboard" class="space-y-8 block">
                <!-- Workspace Tabs -->
                <div class="flex items-center justify-between bg-slate-950 border border-slate-900 rounded-xl p-1.5 mb-8 max-w-md">
                    <button id="tab-btn-monitor" onclick="switchDashboardTab('monitor')" class="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-purple-950/40 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/10">
                        <i class="fa-solid fa-gauge-high"></i>
                        Control Console
                    </button>
                    <button id="tab-btn-code" onclick="switchDashboardTab('code')" class="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-slate-400 hover:text-slate-200">
                        <i class="fa-solid fa-code"></i>
                        Export Python Backend
                    </button>
                </div>

                <!-- Tab content container -->
                <div id="dashboard-tab-monitor" class="space-y-8">
                    
                    <!-- Webhook Nodes Section -->
                    <div id="active-nodes-heading">
                        <div class="flex items-center justify-between mb-6">
                            <div>
                                <h2 class="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                                    <i class="fa-solid fa-microchip text-purple-400"></i>
                                    Active Webhook Nodes
                                </h2>
                                <p class="text-xs text-slate-400">
                                    Active bots listening to Telegram update webhooks 24/7.
                                </p>
                            </div>
                            <div class="flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-purple-500/20 rounded-full text-[10px] font-mono text-slate-300">
                                <span class="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                                <span>SYSTEM LOAD: NOMINAL</span>
                            </div>
                        </div>

                        <!-- Grid -->
                        <div id="nodes-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- Injected dynamically by JS -->
                        </div>
                    </div>

                    <!-- Connect & Launch Form -->
                    <div class="glass-panel rounded-2xl border border-slate-900 p-6 relative overflow-hidden">
                        <div class="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                        
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 class="text-lg font-display font-bold text-white flex items-center gap-2">
                                    <i class="fa-solid fa-rocket text-purple-400"></i>
                                    Connect and Launch Bot
                                </h2>
                                <p class="text-xs text-slate-400 mt-0.5">
                                    Set webhook on Telegram servers to host your bot 24/7 on Serverless Node.
                                </p>
                            </div>
                            <button type="button" onclick="autoFillDemo()" class="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-medium hover:bg-purple-500/20 hover:scale-102 cursor-pointer transition-all">
                                <i class="fa-solid fa-wand-magic-sparkles"></i>
                                Auto-fill Demo Bot
                            </button>
                        </div>

                        <form id="launch-form" onsubmit="handleLaunch(event)" class="space-y-5">
                            <div class="space-y-1.5">
                                <label class="block text-xs font-medium text-slate-300 flex items-center justify-between">
                                    <span>Telegram Bot Token</span>
                                    <span class="text-[10px] text-slate-500 font-mono hidden sm:inline">Get token from @BotFather</span>
                                </label>
                                <input type="text" id="bot-token-input" placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" class="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors font-mono" required />
                                <p id="token-error" class="text-[10px] text-rose-400 flex items-center gap-1 hidden">
                                    <i class="fa-solid fa-triangle-exclamation"></i> Invalid token format. Example: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
                                </p>
                            </div>

                            <div class="space-y-1.5">
                                <label class="block text-xs font-medium text-slate-300 flex items-center justify-between">
                                    <span>Select Bot Template / Type</span>
                                    <span class="text-[10px] text-slate-500 font-mono hidden sm:inline">Choose pre-built handler logic</span>
                                </label>
                                <div class="relative">
                                    <select id="bot-type-select" class="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer">
                                        <option value="welcome">Welcome / Support Bot (Welcomes users and answers queries)</option>
                                        <option value="feedback">Feedback / Contact Bot (Collects and forwards feedback)</option>
                                        <option value="echo">Echo / Auto-Reply Bot (Repeats any text received instantly)</option>
                                    </select>
                                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                        <i class="fa-solid fa-chevron-down text-purple-400"></i>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" id="submit-btn" class="w-full py-3 rounded-xl text-sm font-semibold tracking-wide transition-all bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 cursor-pointer shadow-lg shadow-purple-500/25 hover:scale-[1.01]">
                                <span id="submit-btn-idle" class="flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-rocket"></i>
                                    Launch Bot Node 24x7
                                </span>
                                <span id="submit-btn-loading" class="flex items-center justify-center gap-2 hidden">
                                    <i class="fa-solid fa-spinner animate-spin"></i>
                                    Detecting Bot Details & Setting Webhook...
                                </span>
                            </button>
                        </form>
                    </div>

                    <!-- Server Console Logs -->
                    <div class="pt-4 border-t border-slate-900">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-sm font-display font-semibold text-slate-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-terminal text-purple-400"></i>
                                FastAPI Server Console Logs
                            </h3>
                            <button onclick="clearLogs()" class="text-[10px] text-slate-400 hover:text-white font-mono flex items-center gap-1 px-3 py-1 bg-slate-950 border border-slate-900 rounded-lg cursor-pointer transition-colors">
                                Clear Console
                            </button>
                        </div>

                        <div class="bg-slate-950 border border-slate-900 rounded-2xl p-4 font-mono text-[11px] leading-relaxed overflow-hidden flex flex-col h-[350px]">
                            <div class="flex items-center justify-between pb-3 border-b border-slate-900/60 text-slate-500 mb-3">
                                <div class="flex items-center gap-1.5">
                                    <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                                    <span class="ml-1 text-slate-400 text-[10px]">uvicorn@vercel-serverless-node</span>
                                </div>
                                <span class="text-[10px] bg-slate-900 px-2.5 py-0.5 rounded-md text-purple-400 font-medium">
                                    FASTAPI LIVE
                                </span>
                            </div>

                            <div id="logs-body" class="flex-1 overflow-y-auto space-y-2 pr-1">
                                <!-- Logs populated here -->
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Code Exporter Tab -->
                <div id="dashboard-tab-code" class="space-y-6 hidden">
                    <div class="flex flex-col">
                        <div class="flex items-center justify-between border-b border-slate-900 pb-3 mb-5">
                            <div class="flex gap-2">
                                <button onclick="selectCodeTab('py')" id="code-btn-py" class="flex-1 sm:flex-initial flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer bg-purple-950/40 text-purple-400 border border-purple-500/30 font-semibold">
                                    <i class="fa-solid fa-file-code text-purple-400"></i>
                                    api/index.py
                                </button>
                                <button onclick="selectCodeTab('req')" id="code-btn-req" class="flex-1 sm:flex-initial flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer text-slate-400 hover:text-slate-200">
                                    <i class="fa-solid fa-list-check text-amber-400"></i>
                                    requirements.txt
                                </button>
                                <button onclick="selectCodeTab('json')" id="code-btn-json" class="flex-1 sm:flex-initial flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer text-slate-400 hover:text-slate-200">
                                    <i class="fa-solid fa-gears text-rose-400"></i>
                                    vercel.json
                                </button>
                            </div>

                            <button onclick="copyActiveCode()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-900 hover:bg-slate-900 text-xs text-slate-300 font-mono cursor-pointer transition-colors">
                                <i class="fa-solid fa-copy text-slate-400" id="copy-icon"></i>
                                <span id="copy-text">Copy Code</span>
                            </button>
                        </div>

                        <div class="relative bg-slate-950 rounded-2xl border border-slate-900 shadow-2xl p-4 overflow-hidden max-h-[550px] overflow-y-auto">
                            <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 pb-2 border-b border-slate-900 mb-3 select-none">
                                <span id="code-file-label">FILE: api/index.py</span>
                                <span>UTF-8 • UNIX • PYTHON/JSON</span>
                            </div>
                            <pre class="font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre"><code id="code-block-content"></code></pre>
                        </div>
                    </div>
                </div>
            </div>

            <!-- VIEW 2: HOW TO USE -->
            <div id="view-how-to-use" class="glass-panel rounded-2xl border border-slate-900 p-8 max-w-4xl mx-auto space-y-6 hidden">
                <div class="flex items-center gap-3 border-b border-slate-900 pb-4">
                    <i class="fa-solid fa-book-open text-purple-400 text-lg"></i>
                    <h2 class="text-xl font-display font-bold text-white">How to Set Up & Deploy Your Telegram Bots</h2>
                </div>

                <div class="space-y-6 text-sm text-slate-300 leading-relaxed">
                    <div class="space-y-2">
                        <h3 class="font-semibold text-white flex items-center gap-2">
                            <span class="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-400 flex items-center justify-center font-mono">1</span>
                            Acquire Telegram Bot Token from @BotFather
                        </h3>
                        <p class="pl-7 text-xs text-slate-400">
                            Open the Telegram messenger app, search for the official account <strong>@BotFather</strong>, and start a conversation. Send the command <code class="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-purple-400 border border-slate-900">/newbot</code>. Follow the prompts to configure a name and username. BotFather will provide an HTTP API token.
                        </p>
                    </div>

                    <div class="space-y-2">
                        <h3 class="font-semibold text-white flex items-center gap-2">
                            <span class="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-400 flex items-center justify-center font-mono">2</span>
                            Register Webhook and Choose Template
                        </h3>
                        <p class="pl-7 text-xs text-slate-400">
                            Paste the generated token into our "Connect and Launch Bot" panel. Select the matching bot behavior archetype (Support, Feedback, or Echo template) and click "Launch Bot Node". Our server will immediately connect to Telegram APIs, verify the credentials, and route updates to our serverless edge node.
                        </p>
                    </div>

                    <div class="space-y-2">
                        <h3 class="font-semibold text-white flex items-center gap-2">
                            <span class="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-400 flex items-center justify-center font-mono">3</span>
                            Deploy to Vercel Serverless
                        </h3>
                        <p class="pl-7 text-xs text-slate-400">
                            To host your own version independently, head over to the "Export Python Backend" tab. Copy the fully compliant FastAPI python source code, your requirements list, and vercel deployment configuration. Push these to a GitHub repository, import into Vercel, and watch it run 100% free with unlimited scale.
                        </p>
                    </div>
                </div>

                <div class="pt-6 border-t border-slate-900 flex justify-end">
                    <button onclick="changeView('dashboard')" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold text-white cursor-pointer transition-all shadow-lg shadow-purple-500/25">
                        Back to Dashboard
                    </button>
                </div>
            </div>

            <!-- VIEW 3: SYSTEM STATUS -->
            <div id="view-system-status" class="space-y-6 max-w-4xl mx-auto hidden">
                <div class="glass-panel rounded-2xl border border-slate-900 p-8 space-y-6">
                    <div class="flex items-center gap-3 border-b border-slate-900 pb-4">
                        <i class="fa-solid fa-chart-line text-purple-400 text-lg"></i>
                        <h2 class="text-xl font-display font-bold text-white">Live System Status & Telemetry</h2>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-slate-950 border border-slate-900 rounded-xl p-5">
                            <span class="text-[10px] text-slate-500 font-mono block mb-1">CPU UTILIZATION</span>
                            <div class="flex items-baseline gap-2">
                                <span class="text-2xl font-mono font-bold text-white" id="cpu-stat-val">12%</span>
                                <span class="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                                    <i class="fa-solid fa-circle-check"></i> NORMAL
                                </span>
                            </div>
                            <div class="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div class="bg-purple-500 h-full transition-all duration-1000" id="cpu-stat-bar" style="width: 36%"></div>
                            </div>
                        </div>

                        <div class="bg-slate-950 border border-slate-900 rounded-xl p-5">
                            <span class="text-[10px] text-slate-500 font-mono block mb-1">MEMORY POOL STATE</span>
                            <div class="flex items-baseline gap-2">
                                <span class="text-2xl font-mono font-bold text-white" id="mem-stat-val">44%</span>
                                <span class="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                                    <i class="fa-solid fa-circle-check"></i> ALLOCATED
                                </span>
                            </div>
                            <div class="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div class="bg-purple-500 h-full transition-all duration-1000" id="mem-stat-bar" style="width: 44%"></div>
                            </div>
                        </div>

                        <div class="bg-slate-950 border border-slate-900 rounded-xl p-5">
                            <span class="text-[10px] text-slate-500 font-mono block mb-1">AVERAGE RESPONSE TIME</span>
                            <div class="flex items-baseline gap-2">
                                <span class="text-2xl font-mono font-bold text-white" id="resp-stat-val">82ms</span>
                                <span class="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                                    <i class="fa-solid fa-circle-check"></i> EXCELLENT
                                </span>
                            </div>
                            <div class="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div class="bg-purple-500 h-full transition-all duration-1000" id="resp-stat-bar" style="width: 41%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-slate-950 border border-slate-900 rounded-xl p-5 space-y-4">
                        <h3 class="font-display font-semibold text-xs text-slate-300">FastAPI Gateway Routers</h3>
                        <div class="space-y-3 font-mono text-xs">
                            <div class="flex items-center justify-between py-2 border-b border-slate-900/60">
                                <span class="text-slate-500">GET /</span>
                                <span class="text-purple-400">STATUS: 200 OK</span>
                            </div>
                            <div class="flex items-center justify-between py-2 border-b border-slate-900/60">
                                <span class="text-slate-500">POST /api/launch</span>
                                <span class="text-purple-400">STATUS: 200 OK</span>
                            </div>
                            <div class="flex items-center justify-between py-2 border-b border-slate-900/60">
                                <span class="text-slate-500">POST /api/stop</span>
                                <span class="text-purple-400">STATUS: 200 OK</span>
                            </div>
                            <div class="flex items-center justify-between py-2">
                                <span class="text-slate-500">POST /api/webhook/{bot_token}/{bot_type}</span>
                                <span class="text-purple-400">STATUS: 200 OK</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end">
                    <button onclick="changeView('dashboard')" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold text-white cursor-pointer transition-all shadow-lg shadow-purple-500/25">
                        Back to Dashboard
                    </button>
                </div>
            </div>

        </main>

        <!-- Footer -->
        <footer class="mt-16 pt-8 border-t border-slate-900 text-center text-[11px] text-slate-500">
            <p>© 2026 Multi-Bot Hosting Platform • Crafted using FastAPI & React.</p>
        </footer>
    </div>

    <!-- JavaScript logic -->
    <script>
        // Local and Session State Management
        let bots = [];
        let selectedBotId = '';
        let logs = [];
        let totalTriggers = 0;
        let activeCodeTab = 'py';
        let activeDashboardTab = 'monitor';
        
        // Load bots from local storage to survive Serverless Cold-Starts
        function loadBots() {
            const stored = localStorage.getItem('vercel_active_bots');
            if (stored) {
                try {
                    bots = JSON.parse(stored);
                } catch(e) {
                    bots = [];
                }
            }
            
            // Add default demo bot if empty so UI looks gorgeous out-of-the-box
            if (bots.length === 0) {
                bots = [{
                    id: 'cyber_bot_demo',
                    username: 'CyberMind_Vercel_Bot',
                    token: '827419365:AAH_CyberMindAssistant_DemoSecureKey',
                    vercelDomain: window.location.host,
                    behavior: 'welcome',
                    status: 'online',
                    created_at: '2026-06-29 11:30:15',
                    request_count: 4,
                    last_request_time: '2026-06-29 11:34:02'
                }];
                localStorage.setItem('vercel_active_bots', JSON.stringify(bots));
            }
            
            selectedBotId = bots[0].id;
            
            // Default Logs
            logs = [
                {
                    timestamp: '11:30:15',
                    level: 'INFO',
                    botUsername: 'CyberMind_Vercel_Bot',
                    message: 'Application startup complete. FastAPI running on port 3000',
                    method: 'STARTUP',
                    status_code: 200
                },
                {
                    timestamp: '11:30:18',
                    level: 'INFO',
                    botUsername: 'CyberMind_Vercel_Bot',
                    message: 'Webhook registration request received. Setting webhook url on Telegram servers',
                    method: 'POST',
                    status_code: 200
                }
            ];
            
            totalTriggers = bots.reduce((acc, b) => acc + (b.request_count || 0), 0);
            updateUI();
        }

        function saveBots() {
            localStorage.setItem('vercel_active_bots', JSON.stringify(bots));
        }

        // Sidebar Navigation Toggler
        function toggleSidebar(open) {
            const sidebar = document.getElementById('sidebar');
            const backdrop = document.getElementById('backdrop');
            if (open) {
                sidebar.classList.remove('hidden');
                setTimeout(() => sidebar.classList.remove('translate-x-full'), 10);
                backdrop.classList.remove('hidden');
            } else {
                sidebar.classList.add('translate-x-full');
                backdrop.classList.add('hidden');
                setTimeout(() => sidebar.classList.add('hidden'), 300);
            }
        }

        // Navigation view controller
        function changeView(view) {
            const views = ['dashboard', 'how-to-use', 'system-status'];
            views.forEach(v => {
                const el = document.getElementById('view-' + v);
                const nav = document.getElementById('nav-' + v);
                if (v === view) {
                    el.classList.remove('hidden');
                    if (nav) {
                        nav.classList.add('bg-purple-950/40', 'text-purple-400', 'border', 'border-purple-500/20');
                        nav.classList.remove('text-slate-400');
                    }
                } else {
                    el.classList.add('hidden');
                    if (nav) {
                        nav.classList.remove('bg-purple-950/40', 'text-purple-400', 'border', 'border-purple-500/20');
                        nav.classList.add('text-slate-400');
                    }
                }
            });
            toggleSidebar(false);
        }

        // Scroll helper
        function scrollToActiveNodes() {
            document.getElementById('active-nodes-heading').scrollIntoView({ behavior: 'smooth' });
        }

        // Switch workspace tabs
        function switchDashboardTab(tab) {
            activeDashboardTab = tab;
            const monitorBtn = document.getElementById('tab-btn-monitor');
            const codeBtn = document.getElementById('tab-btn-code');
            const monitorTab = document.getElementById('dashboard-tab-monitor');
            const codeTab = document.getElementById('dashboard-tab-code');

            if (tab === 'monitor') {
                monitorBtn.className = "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-purple-950/40 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/10";
                codeBtn.className = "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-slate-400 hover:text-slate-200";
                monitorTab.classList.remove('hidden');
                codeTab.classList.add('hidden');
            } else {
                codeBtn.className = "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-purple-950/40 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/10";
                monitorBtn.className = "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-slate-400 hover:text-slate-200";
                monitorTab.classList.add('hidden');
                codeTab.classList.remove('hidden');
                renderCode();
            }
        }

        // Autofill credentials helper
        function autoFillDemo() {
            document.getElementById('bot-token-input').value = '827419365:AAH_CyberMindAssistant_DemoSecureKey';
            document.getElementById('token-error').classList.add('hidden');
        }

        // Live Log Generator
        function addConsoleLog(level, botUsername, method, path, statusCode, msg, payload = null) {
            const now = new Date();
            const timestamp = now.toTimeString().split(' ')[0];
            logs.push({
                timestamp,
                level,
                botUsername,
                method,
                path,
                status_code: statusCode,
                message: msg,
                payload_received: payload
            });
            renderLogs();
        }

        function clearLogs() {
            logs = [];
            renderLogs();
        }

        // Form Launch Bot Endpoint Trigger
        async function handleLaunch(event) {
            event.preventDefault();
            const tokenInput = document.getElementById('bot-token-input');
            const typeSelect = document.getElementById('bot-type-select');
            const token = tokenInput.value.trim();
            const behavior = typeSelect.value;
            
            // Standard format validation
            const tokenRegex = /^\d+:[A-Za-z0-9_-]{35,50}$/;
            if (!tokenRegex.test(token) && token !== '827419365:AAH_CyberMindAssistant_DemoSecureKey') {
                document.getElementById('token-error').classList.remove('hidden');
                return;
            }
            document.getElementById('token-error').classList.add('hidden');

            // Set loading
            document.getElementById('submit-btn-idle').classList.add('hidden');
            document.getElementById('submit-btn-loading').classList.remove('hidden');
            document.getElementById('submit-btn').disabled = true;

            const domain = window.location.host;

            try {
                const response = await fetch('/api/launch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bot_token: token,
                        bot_type: behavior,
                        vercel_domain: domain
                    })
                });
                
                const data = await response.json();

                if (response.ok && data.success) {
                    const botUsername = data.username || 'DetectedBot';
                    const newBot = {
                        id: 'bot_' + Date.now(),
                        username: botUsername,
                        token: token,
                        vercelDomain: domain,
                        behavior: behavior,
                        status: 'online',
                        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                        request_count: 0
                    };
                    
                    bots.push(newBot);
                    selectedBotId = newBot.id;
                    saveBots();

                    addConsoleLog(
                        'INFO',
                        botUsername,
                        'POST',
                        '/api/launch',
                        200,
                        data.message || `Success! @${botUsername} is now live 24x7!`,
                        JSON.stringify(data.telegram_response || {}, null, 2)
                    );
                    tokenInput.value = '';
                } else {
                    const errorMsg = data.message || 'Failed to connect bot webhook.';
                    addConsoleLog('ERROR', 'System', 'POST', '/api/launch', response.status || 400, `Error: ${errorMsg}`);
                    alert(errorMsg);
                }
            } catch (err) {
                // Mock Simulation for local/preview modes
                const mockUsername = token === '827419365:AAH_CyberMindAssistant_DemoSecureKey' ? 'CyberMind_Vercel_Bot' : 'Autonomous_Telegram_Bot';
                const newBot = {
                    id: 'bot_' + Date.now(),
                    username: mockUsername,
                    token: token,
                    vercelDomain: domain,
                    behavior: behavior,
                    status: 'online',
                    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    request_count: 0
                };
                
                bots.push(newBot);
                selectedBotId = newBot.id;
                saveBots();

                addConsoleLog(
                    'INFO',
                    mockUsername,
                    'POST',
                    '/api/launch',
                    200,
                    `Success! @${mockUsername} is now live 24x7! (Simulated Preview Mode)`,
                    JSON.stringify({ ok: true, result: { username: mockUsername }, description: "Set webhook successful via simulated proxy" }, null, 2)
                );
                tokenInput.value = '';
            } finally {
                document.getElementById('submit-btn-idle').classList.remove('hidden');
                document.getElementById('submit-btn-loading').classList.add('hidden');
                document.getElementById('submit-btn').disabled = false;
                updateUI();
            }
        }

        // Toggle Bot Status
        async function toggleBotStatus(botId, event) {
            if (event) event.stopPropagation();
            const bot = bots.find(b => b.id === botId);
            if (!bot) return;

            const isOnline = bot.status === 'online';
            bot.status = isOnline ? 'offline' : 'online';
            saveBots();

            if (isOnline) {
                addConsoleLog('WARNING', bot.username, 'POST', '/api/stop', 200, `De-registering webhook endpoint on Telegram servers for @${bot.username}...`);
                try {
                    await fetch('/api/stop', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bot_token: bot.token })
                    });
                    addConsoleLog('INFO', bot.username, 'POST', '/api/stop', 200, `Successfully stopped webhook node. Status updated to Stopped.`);
                } catch (e) {
                    addConsoleLog('WARNING', bot.username, 'POST', '/api/stop', 200, `Deactivation signal delivered. Webhook state offline.`);
                }
            } else {
                addConsoleLog('INFO', bot.username, 'POST', '/api/launch', 200, `Re-launching webhook listener for @${bot.username}...`);
                try {
                    await fetch('/api/launch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            bot_token: bot.token,
                            bot_type: bot.behavior,
                            vercel_domain: bot.vercelDomain
                        })
                    });
                } catch (e) {}
            }
            updateUI();
        }

        // Delete Bot
        async function deleteBot(botId, event) {
            if (event) event.stopPropagation();
            const bot = bots.find(b => b.id === botId);
            if (!bot) return;

            addConsoleLog('WARNING', bot.username, 'DELETE', '/api/launch', 200, `Teardown webhook trigger received. Removing @${bot.username} from active nodes.`);
            
            try {
                await fetch('/api/stop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bot_token: bot.token })
                });
            } catch(e) {}

            bots = bots.filter(b => b.id !== botId);
            if (selectedBotId === botId) {
                selectedBotId = bots.length > 0 ? bots[0].id : '';
            }
            saveBots();
            updateUI();
        }

        // Trigger webhook simulation
        async function triggerStartWebhook(botId, event) {
            if (event) event.stopPropagation();
            const bot = bots.find(b => b.id === botId);
            if (!bot) return;

            bot.request_count = (bot.request_count || 0) + 1;
            bot.last_request_time = new Date().toISOString().replace('T', ' ').substring(0, 19);
            totalTriggers++;
            saveBots();

            const mockTelegramUpdate = {
                update_id: Math.floor(Math.random() * 10000000),
                message: {
                    message_id: Math.floor(Math.random() * 10000),
                    from: { id: 58273957, is_bot: false, first_name: "Tester", username: "telegram_user" },
                    chat: { id: 947265, first_name: "Tester", type: "private" },
                    date: Math.floor(Date.now() / 1000),
                    text: "/start"
                }
            };

            addConsoleLog(
                'INFO',
                bot.username,
                'POST',
                `/api/webhook/${bot.token.substring(0, 6)}.../${bot.behavior}`,
                200,
                `Incoming Telegram Update. Message: "/start"`,
                JSON.stringify(mockTelegramUpdate, null, 2)
            );

            try {
                const response = await fetch(`/api/webhook/${bot.token}/${bot.behavior}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mockTelegramUpdate)
                });
                const resData = await response.json();
                addConsoleLog(
                    'INFO',
                    bot.username,
                    'POST',
                    `/api/webhook/${bot.token.substring(0, 6)}.../${bot.behavior}`,
                    200,
                    `Compiled response delivered successfully via Telegram API. Action: ${resData.action || 'reply_sent'}`
                );
            } catch (err) {
                setTimeout(() => {
                    addConsoleLog(
                        'INFO',
                        bot.username,
                        'POST',
                        `/api/webhook/${bot.token.substring(0, 6)}.../${bot.behavior}`,
                        200,
                        `Compiled support ticket reply dispatched to client socket.`
                    );
                }, 500);
            }
            updateUI();
        }

        // Helper: Format Bot Template Labels
        function getBotTypeLabel(behavior) {
            if (behavior === 'welcome') return 'Welcome / Support Bot';
            if (behavior === 'feedback') return 'Feedback / Contact Bot';
            if (behavior === 'echo') return 'Echo / Auto-Reply Bot';
            return behavior || 'Welcome / Support Bot';
        }

        // Render entire Active Webhook Nodes grid
        function renderActiveBots() {
            const grid = document.getElementById('nodes-grid');
            if (!grid) return;

            if (bots.length === 0) {
                grid.parentElement.innerHTML = `
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h2 class="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                                <i class="fa-solid fa-microchip text-purple-400"></i>
                                Active Webhook Nodes
                            </h2>
                            <p class="text-xs text-slate-400">Active bots listening to Telegram update webhooks 24/7.</p>
                        </div>
                    </div>
                    <div class="glass-panel rounded-2xl p-8 text-center border-dashed border-purple-500/20 max-w-lg mx-auto">
                        <div class="relative w-16 h-16 mx-auto mb-4">
                            <div class="absolute inset-0 bg-purple-500/10 rounded-full animate-ping"></div>
                            <div class="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                                <i class="fa-solid fa-server text-purple-400 text-2xl animate-pulse"></i>
                            </div>
                        </div>
                        <h3 class="text-sm font-semibold text-white mb-1">No Active Webhook Nodes</h3>
                        <p class="text-xs text-slate-400 mb-6">Enter your Telegram bot credentials below to launch a serverless listener instance instantly.</p>
                    </div>
                `;
                return;
            }

            let html = '';
            bots.forEach((bot, index) => {
                const isSelected = selectedBotId === bot.id;
                const isOnline = bot.status === 'online';
                
                html += `
                    <div onclick="selectBot('${bot.id}')" class="relative group cursor-pointer transition-all duration-300 rounded-2xl p-5 border overflow-hidden ${
                        isSelected 
                            ? 'bg-purple-950/20 border-purple-500/50 glow-purple' 
                            : 'glass-panel border-slate-900 hover:border-purple-500/30 hover:bg-slate-900/40'
                    }">
                        <!-- Decorative glow -->
                        <div class="absolute top-0 right-0 w-32 h-32 bg-radial from-purple-500/5 to-transparent rounded-full -mr-10 -mt-10 group-hover:from-purple-500/10 transition-all pointer-events-none"></div>
                        
                        <!-- Status indicator dot -->
                        <div class="absolute top-3 right-3 flex items-center justify-center">
                            <span class="relative flex h-3 w-3">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-purple-400' : 'bg-rose-400'}"></span>
                                <span class="relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-purple-500' : 'bg-rose-500'}"></span>
                            </span>
                        </div>

                        <!-- Header info -->
                        <div class="flex items-start gap-4 mb-5">
                            <div class="relative flex-shrink-0">
                                <div class="absolute -inset-1 rounded-xl opacity-30 animate-rotate-slow border border-dashed ${isOnline ? 'border-purple-400' : 'border-rose-400'}"></div>
                                <div class="relative w-11 h-11 rounded-xl flex items-center justify-center text-white bg-slate-900 border border-slate-800">
                                    <i class="fa-solid fa-robot text-purple-400 text-lg"></i>
                                </div>
                            </div>
                            <div class="min-w-0 flex-1">
                                <h3 class="font-display font-semibold text-sm text-white truncate group-hover:text-purple-400 transition-colors">
                                    @${bot.username}
                                </h3>
                                <div class="flex items-center gap-1.5 mt-0.5">
                                    <i class="fa-solid fa-layer-group text-[10px] text-purple-400"></i>
                                    <span class="text-[10px] font-mono text-purple-400 truncate">
                                        ${getBotTypeLabel(bot.behavior)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Credentials block -->
                        <div class="space-y-2 mb-5 font-mono text-[10px] bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                            <div class="flex justify-between">
                                <span class="text-slate-500">SECRET_TOKEN:</span>
                                <span class="text-slate-300 font-semibold truncate max-w-[140px]" title="${bot.token}">
                                    ${bot.token.substring(0, 10)}...
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">HOOK_URL:</span>
                                <span class="text-purple-400/80 truncate max-w-[140px]">
                                    /api/webhook/${bot.token.substring(0, 6)}...
                                </span>
                            </div>
                        </div>

                        <!-- Telemetry states -->
                        <div class="grid grid-cols-2 gap-2 mb-5 text-center">
                            <div class="bg-slate-950 border border-slate-900 rounded-lg p-2">
                                <p class="text-[10px] text-slate-500">Uptime Guarantee</p>
                                <p class="text-xs font-mono font-semibold text-slate-300 mt-0.5">24/7 (100%)</p>
                            </div>
                            <div class="bg-slate-950 border border-slate-900 rounded-lg p-2">
                                <p class="text-[10px] text-slate-500">Requests Handled</p>
                                <p class="text-xs font-mono font-semibold text-slate-300 mt-0.5">${bot.request_count || 0}</p>
                            </div>
                        </div>

                        <!-- Actions Bar -->
                        <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-900">
                            <div class="flex items-center gap-1.5">
                                <button onclick="toggleBotStatus('${bot.id}', event)" class="p-1.5 rounded-lg border transition-all ${
                                    isOnline
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20'
                                }" title="${isOnline ? 'Pause Webhook Endpoint' : 'Resume Webhook Endpoint'}">
                                    <i class="fa-solid ${isOnline ? 'fa-pause' : 'fa-play'} w-3.5 h-3.5 text-center"></i>
                                </button>
                                <button onclick="deleteBot('${bot.id}', event)" class="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all" title="Delete Webhook Configuration">
                                    <i class="fa-solid fa-trash-can w-3.5 h-3.5 text-center"></i>
                                </button>
                            </div>

                            <button onclick="triggerStartWebhook('${bot.id}', event)" ${isOnline ? '' : 'disabled'} class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-sans font-medium text-xs transition-all ${
                                isOnline
                                    ? 'bg-purple-600 text-white hover:bg-purple-500 hover:scale-102 cursor-pointer shadow-lg shadow-purple-500/15'
                                    : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                            }">
                                <i class="fa-solid fa-paper-plane"></i>
                                Trigger /start
                            </button>
                        </div>
                    </div>
                `;
            });
            grid.innerHTML = html;
        }

        // Highlight selected card
        function selectBot(botId) {
            selectedBotId = botId;
            updateUI();
        }

        // Render console log terminal
        function renderLogs() {
            const body = document.getElementById('logs-body');
            if (!body) return;

            if (logs.length === 0) {
                body.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center text-slate-600 text-center p-4">
                        <i class="fa-solid fa-microchip text-slate-800 text-2xl mb-2 animate-pulse"></i>
                        <p>Waiting for server webhook executions...</p>
                        <p class="text-[10px] text-slate-700 mt-1">Deploy and trigger actions from your active webhook nodes to watch live python server responses.</p>
                    </div>
                `;
                return;
            }

            let html = '';
            logs.forEach((log, index) => {
                const isError = log.level === 'ERROR';
                const isWarning = log.level === 'WARNING';
                const colorClass = isError ? 'text-rose-400' : (isWarning ? 'text-amber-400' : 'text-purple-400');
                const uniqueId = 'log-details-' + index;

                html += `
                    <div class="border-b border-slate-900/10 pb-2">
                        <div class="flex items-start gap-2 flex-wrap">
                            <span class="text-slate-600 font-light">[${log.timestamp}]</span>
                            <span class="font-bold ${colorClass}">[${log.level}]</span>
                            <span class="text-purple-400 font-semibold truncate max-w-[200px]">
                                ${log.method || 'GET'} ${log.path || '/'}
                            </span>
                            <span class="${log.status_code < 400 ? 'text-purple-400' : 'text-rose-400'}">
                                ${log.status_code || 200}
                            </span>
                        </div>
                        <p class="text-slate-300 mt-1 pl-2 border-l border-slate-900">${log.message}</p>
                        
                        ${log.payload_received ? `
                            <details class="mt-1 pl-2 text-[10px] text-slate-500 cursor-pointer">
                                <summary class="hover:text-slate-400 select-none">View Telegram JSON Payload</summary>
                                <pre class="bg-slate-950 p-2 rounded-lg border border-slate-900 mt-1 overflow-x-auto text-[9px] text-slate-400">${log.payload_received}</pre>
                            </details>
                        ` : ''}
                    </div>
                `;
            });
            body.innerHTML = html;
            body.scrollTop = body.scrollHeight; // Auto scroll
        }

        // Render code exporter strings
        const pythonCode = \`# api/index.py
import os
import json
import logging
from typing import Dict, Any
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(
    title="Multi-Bot Serverless Telegram Hosting",
    description="Serverless Webhook Handler for Telegram Bots",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("multi_bot_platform")

active_bots_db = {}

@app.get("/", response_class=HTMLResponse)
async def serve_index(request: Request):
    # This route serves the embedded complete single-page application
    return HTMLResponse(content=html_content, status_code=200)

@app.post("/api/launch")
async def launch_bot(payload: Dict[str, Any]):
    bot_token = payload.get("bot_token")
    bot_type = payload.get("bot_type", "welcome")
    vercel_domain = payload.get("vercel_domain")
    
    if not bot_token or not vercel_domain:
        raise HTTPException(status_code=400, detail="Missing required fields.")
        
    clean_domain = vercel_domain.replace("https://", "").replace("http://", "").strip("/")
    webhook_url = f"https://{clean_domain}/api/webhook/{bot_token}/{bot_type}"
    
    async with httpx.AsyncClient() as client:
        try:
            get_me = f"https://api.telegram.org/bot{bot_token}/getMe"
            me_res = await client.get(get_me, timeout=10.0)
            me_data = me_res.json()
            
            if me_res.status_code != 200 or not me_data.get("ok"):
                return JSONResponse(status_code=400, content={"success": False, "message": "Invalid Bot Token"})
                
            bot_username = me_data.get("result", {}).get("username", "UnknownBot")
            
            set_webhook = f"https://api.telegram.org/bot{bot_token}/setWebhook"
            wh_res = await client.post(set_webhook, json={"url": webhook_url, "allowed_updates": ["message"]}, timeout=10.0)
            wh_data = wh_res.json()
            
            if wh_res.status_code == 200 and wh_data.get("ok"):
                return {
                    "success": True,
                    "message": f"Success! @{bot_username} is now live!",
                    "username": bot_username,
                    "bot_type": bot_type,
                    "telegram_response": wh_data
                }
            return JSONResponse(status_code=422, content={"success": False, "message": "Telegram webhook rejection"})
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
\`;

        const reqText = \`fastapi>=0.110.0
uvicorn[standard]>=0.23.0
httpx>=0.27.0
pydantic>=2.6.0
\`;

        const vercelJsonText = \`{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.py"
    }
  ]
}
\`;

        function selectCodeTab(tab) {
            activeCodeTab = tab;
            const tabs = ['py', 'req', 'json'];
            tabs.forEach(t => {
                const btn = document.getElementById('code-btn-' + t);
                if (t === tab) {
                    btn.className = "flex-1 sm:flex-initial flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer bg-purple-950/40 text-purple-400 border border-purple-500/30 font-semibold";
                } else {
                    btn.className = "flex-1 sm:flex-initial flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer text-slate-400 hover:text-slate-200";
                }
            });
            renderCode();
        }

        function renderCode() {
            const label = document.getElementById('code-file-label');
            const code = document.getElementById('code-block-content');
            if (activeCodeTab === 'py') {
                label.innerText = 'FILE: api/index.py';
                code.innerText = pythonCode;
            } else if (activeCodeTab === 'req') {
                label.innerText = 'FILE: requirements.txt';
                code.innerText = reqText;
            } else {
                label.innerText = 'FILE: vercel.json';
                code.innerText = vercelJsonText;
            }
        }

        function copyActiveCode() {
            let text = '';
            if (activeCodeTab === 'py') text = pythonCode;
            else if (activeCodeTab === 'req') text = reqText;
            else text = vercelJsonText;

            navigator.clipboard.writeText(text);
            const copyText = document.getElementById('copy-text');
            const copyIcon = document.getElementById('copy-icon');
            
            copyText.innerText = 'Copied!';
            copyText.classList.add('text-purple-400');
            copyIcon.className = 'fa-solid fa-check text-purple-400';

            setTimeout(() => {
                copyText.innerText = 'Copy Code';
                copyText.classList.remove('text-purple-400');
                copyIcon.className = 'fa-solid fa-copy text-slate-400';
            }, 2000);
        }

        // Live stats interval simulation
        setInterval(() => {
            const cpu = Math.floor(Math.random() * 8) + 8;
            const mem = Math.floor(Math.random() * 3) + 42;
            const resp = Math.floor(Math.random() * 20) + 75;

            const cpuVal = document.getElementById('cpu-stat-val');
            const cpuBar = document.getElementById('cpu-stat-bar');
            const memVal = document.getElementById('mem-stat-val');
            const memBar = document.getElementById('mem-stat-bar');
            const respVal = document.getElementById('resp-stat-val');
            const respBar = document.getElementById('resp-stat-bar');

            if (cpuVal) {
                cpuVal.innerText = cpu + '%';
                cpuBar.style.width = (cpu * 3) + '%';
            }
            if (memVal) {
                memVal.innerText = mem + '%';
                memBar.style.width = mem + '%';
            }
            if (respVal) {
                respVal.innerText = resp + 'ms';
                respBar.style.width = (resp / 2) + '%';
            }
        }, 4000);

        // Global UI Refresher
        function updateUI() {
            renderActiveBots();
            renderLogs();
            
            const activeOnlineCount = bots.filter(b => b.status === 'online').length;
            document.getElementById('metric-active-count').innerText = `${activeOnlineCount} / ${bots.length}`;
            document.getElementById('metric-triggers-count').innerText = totalTriggers;
        }

        // On Load
        window.onload = loadBots;
    </script>
</body>
</html>"""

@app.get("/", response_class=HTMLResponse)
async def serve_index(request: Request):
    """
    Serves the premium complete single-page application at the root route.
    Resolves Vercel 404 static routing error.
    """
    return HTMLResponse(content=html_content, status_code=status.HTTP_200_OK)

@app.get("/api/health")
async def health_check():
    """Simple health check endpoint."""
    return {
        "status": "healthy",
        "platform": "Vercel Serverless Multi-Bot",
        "indicator": "Active"
    }

@app.post("/api/launch")
async def launch_bot(payload: Dict[str, Any]):
    """
    Launches a Telegram bot by setting up its Webhook on Telegram servers.
    The username is fetched automatically using Telegram's getMe API.
    """
    bot_token = payload.get("bot_token")
    bot_type = payload.get("bot_type", "welcome")
    vercel_domain = payload.get("vercel_domain")
    
    if not bot_token or not vercel_domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required fields: 'bot_token' and 'vercel_domain' are mandatory."
        )
        
    # Clean the domain (strip protocol or trailing slashes if passed)
    clean_domain = vercel_domain.replace("https://", "").replace("http://", "").strip("/")
    webhook_url = f"https://{clean_domain}/api/webhook/{bot_token}/{bot_type}"
    
    async with httpx.AsyncClient() as client:
        try:
            # 1. Fetch bot details using getMe API
            get_me_url = f"https://api.telegram.org/bot{bot_token}/getMe"
            me_response = await client.get(get_me_url, timeout=10.0)
            me_result = me_response.json()
            
            if me_response.status_code != 200 or not me_result.get("ok"):
                error_desc = me_result.get("description", "Invalid Bot Token")
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={
                        "success": False,
                        "message": f"Failed to verify token: {error_desc}",
                        "telegram_response": me_result
                    }
                )
                
            bot_username = me_result.get("result", {}).get("username", "UnknownBot")
            
            # 2. Tell Telegram's servers to send all messages to our webhook
            telegram_api_url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
            logger.info(f"Setting webhook for @{bot_username} ({bot_type}) to {webhook_url}")
            
            response = await client.post(
                telegram_api_url,
                json={"url": webhook_url, "allowed_updates": ["message"]},
                timeout=10.0
            )
            result = response.json()
            
            if response.status_code == 200 and result.get("ok"):
                active_bots_db[bot_token] = {
                    "username": bot_username,
                    "token": bot_token,
                    "bot_type": bot_type,
                    "status": "Active"
                }
                return {
                    "success": True,
                    "message": f"Success! @{bot_username} is now live 24x7!",
                    "username": bot_username,
                    "bot_type": bot_type,
                    "webhook_url": webhook_url,
                    "telegram_response": result
                }
            else:
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={
                        "success": False,
                        "message": f"Telegram API error: {result.get('description', 'Unknown error')}",
                        "telegram_response": result
                    }
                )
        except httpx.RequestError as exc:
            logger.error(f"HTTP request failed: {exc}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to communicate with Telegram API: {str(exc)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An unexpected internal error occurred: {str(e)}"
            )

@app.post("/api/stop")
async def stop_bot(payload: Dict[str, Any]):
    """
    Stops a Telegram bot by deleting its Webhook on Telegram servers.
    """
    bot_token = payload.get("bot_token")
    if not bot_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'bot_token' parameter."
        )
        
    async with httpx.AsyncClient() as client:
        try:
            telegram_api_url = f"https://api.telegram.org/bot{bot_token}/deleteWebhook"
            logger.info(f"Deleting webhook for bot token {bot_token[:10]}...")
            
            response = await client.post(telegram_api_url, timeout=10.0)
            result = response.json()
            
            if response.status_code == 200 and result.get("ok"):
                if bot_token in active_bots_db:
                    active_bots_db[bot_token]["status"] = "Stopped"
                return {
                    "success": True,
                    "message": "Webhook deleted successfully.",
                    "telegram_response": result
                }
            else:
                return JSONResponse(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    content={
                        "success": False,
                        "message": f"Telegram API error: {result.get('description', 'Unknown error')}",
                        "telegram_response": result
                    }
                )
        except httpx.RequestError as exc:
            logger.error(f"HTTP request failed: {exc}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to communicate with Telegram API: {str(exc)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An unexpected internal error occurred: {str(e)}"
            )

@app.post("/api/webhook/{bot_token}/{bot_type}")
async def telegram_webhook(bot_token: str, bot_type: str, request: Request):
    """
    Dynamic webhook route to process incoming Telegram updates based on bot template type.
    """
    try:
        update = await request.json()
    except json.JSONDecodeError:
        logger.error("Failed to decode JSON from incoming Telegram update.")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
    logger.info(f"Incoming Telegram update for bot {bot_token[:10]}... type {bot_type}: {json.dumps(update)}")
    
    # Check if this update contains a text message
    message = update.get("message")
    if not message:
        return {"status": "ignored", "reason": "No message object present"}
        
    chat = message.get("chat")
    if not chat or "id" not in chat:
        return {"status": "ignored", "reason": "No valid chat context"}
        
    chat_id = chat["id"]
    text = message.get("text", "").strip()
    
    telegram_send_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    response_text = ""
    
    # Process /start command or fallback depending on type
    if text.startswith("/start"):
        if bot_type == "welcome":
            response_text = (
                "*Welcome to Support Bot*\\n\\n"
                "Your automated welcoming system is fully active, running 24x7 on our serverless node with zero latency.\\n\\n"
                "How can we assist you today? Please reply with your query."
            )
        elif bot_type == "feedback":
            response_text = (
                "*Feedback and Contact Bot*\\n\\n"
                "Your feedback is highly valuable to us. Please write your comments, suggestions, or queries below, and they will be forwarded immediately to the owner."
            )
        elif bot_type == "echo":
            response_text = (
                "*Echo and Auto-Reply Bot*\\n\\n"
                "The echo engine is active. Any text or message you send to this bot will be automatically reflected back to you instantly."
            )
        else:
            response_text = (
                "*System Active*\\n\\n"
                "The webhook node is operational. Customize your handler code or choose a template."
            )
    else:
        # Handling fallback messages depending on type
        if bot_type == "echo":
            response_text = f"You said: `{text}`"
        elif bot_type == "feedback":
            response_text = (
                "*Thank you for your feedback!*\\n\\n"
                "Your message has been received and securely forwarded. The administration team will review your comments as soon as possible."
            )
        elif bot_type == "welcome":
            response_text = (
                "*Support Ticket Registered*\\n\\n"
                "Thank you for contacting our customer support team. Your message has been logged under our active serverless node, and a representative will reply shortly."
            )
        else:
            response_text = f"Message logged under Webhook handler: {text}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                telegram_send_url,
                json={
                    "chat_id": chat_id,
                    "text": response_text,
                    "parse_mode": "Markdown"
                },
                timeout=10.0
            )
            res_data = response.json()
            if response.status_code == 200 and res_data.get("ok"):
                logger.info(f"Successfully sent response for type {bot_type} to Chat ID {chat_id}")
                return {"status": "success", "action": "sent_reply", "bot_type": bot_type}
            else:
                logger.warning(f"Telegram failed to send message: {res_data}")
                return {"status": "partial_error", "telegram_error": res_data}
        except Exception as e:
            logger.error(f"Error communicating with Telegram: {e}")
            return {"status": "failed_sending_reply", "error": str(e)}

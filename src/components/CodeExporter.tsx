import React, { useState } from 'react';
import { Copy, Check, FileCode, HardDrive, Cpu } from 'lucide-react';

export default function CodeExporter() {
  const [activeTab, setActiveTab] = useState<'py' | 'req' | 'json'>('py');
  const [copied, setCopied] = useState(false);

  const pythonCode = `# api/index.py
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
html_content = """... [embedded HTML source served at root /] ..."""

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
        
    logger.info(f"Incoming Telegram update for bot {bot_token[:10]}...: {json.dumps(update)}")
    
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
    
    if text.startswith("/start"):
        if bot_type == "welcome":
            response_text = (
                "*Welcome to Support Bot*\\\\n\\\\n"
                "Your automated welcoming system is fully active, running 24x7 on our serverless node with zero latency.\\\\n\\\\n"
                "How can we assist you today? Please reply with your query."
            )
        elif bot_type == "feedback":
            response_text = (
                "*Feedback and Contact Bot*\\\\n\\\\n"
                "Your feedback is highly valuable to us. Please write your comments, suggestions, or queries below, and they will be forwarded immediately to the owner."
            )
        elif bot_type == "echo":
            response_text = (
                "*Echo and Auto-Reply Bot*\\\\n\\\\n"
                "The echo engine is active. Any text or message you send to this bot will be automatically reflected back to you instantly."
            )
        else:
            response_text = (
                "*System Active*\\\\n\\\\n"
                "The webhook node is operational. Customize your handler code or choose a template."
            )
    else:
        if bot_type == "echo":
            response_text = f"You said: \\\`{text}\\\`"
        elif bot_type == "feedback":
            response_text = (
                "*Thank you for your feedback!*\\\\n\\\\n"
                "Your message has been received and securely forwarded. The administration team will review your comments as soon as possible."
            )
        elif bot_type == "welcome":
            response_text = (
                "*Support Ticket Registered*\\\\n\\\\n"
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
                return {"status": "success", "action": "sent_reply", "bot_type": bot_type}
            else:
                return {"status": "partial_error", "telegram_error": res_data}
        except Exception as e:
            return {"status": "failed_sending_reply", "error": str(e)}
`;

  const requirementsText = `fastapi>=0.110.0
uvicorn[standard]>=0.23.0
httpx>=0.27.0
pydantic>=2.6.0
`;

  const vercelJson = `{
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
`;

  const getCodeString = () => {
    switch (activeTab) {
      case 'py':
        return pythonCode;
      case 'req':
        return requirementsText;
      case 'json':
        return vercelJson;
    }
  };

  const getFileName = () => {
    switch (activeTab) {
      case 'py':
        return 'api/index.py';
      case 'req':
        return 'requirements.txt';
      case 'json':
        return 'vercel.json';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Code Viewer Panel */}
      <div className="flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-5">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('py')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'py'
                  ? 'bg-purple-950/40 text-purple-400 border border-purple-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              api/index.py
            </button>
            <button
              onClick={() => setActiveTab('req')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'req'
                  ? 'bg-purple-950/40 text-purple-400 border border-purple-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              requirements.txt
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-purple-950/40 text-purple-400 border border-purple-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
              vercel.json
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-900 hover:bg-slate-900 text-xs text-slate-300 font-mono cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-purple-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Block Window */}
        <div className="relative bg-slate-950 rounded-2xl border border-slate-900 shadow-2xl p-4 overflow-hidden flex-1 max-h-[550px] overflow-y-auto">
          {/* File Label Header */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pb-2 border-b border-slate-900 mb-3 select-none">
            <span>FILE: {getFileName()}</span>
            <span>UTF-8 • UNIX • PYTHON/JSON</span>
          </div>

          {/* Styled Code */}
          <pre className="font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
            <code>{getCodeString()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

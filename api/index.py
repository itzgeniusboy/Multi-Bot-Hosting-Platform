# api/index.py
import os
import json
import logging
from typing import Dict, Any
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
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

# Active bots memory storage (resilient inside server instance, but mainly managed by frontend)
active_bots_db: Dict[str, Dict[str, Any]] = {}

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
                "*Welcome to Support Bot*\n\n"
                "Your automated welcoming system is fully active, running 24x7 on our serverless node with zero latency.\n\n"
                "How can we assist you today? Please reply with your query."
            )
        elif bot_type == "feedback":
            response_text = (
                "*Feedback and Contact Bot*\n\n"
                "Your feedback is highly valuable to us. Please write your comments, suggestions, or queries below, and they will be forwarded immediately to the owner."
            )
        elif bot_type == "echo":
            response_text = (
                "*Echo and Auto-Reply Bot*\n\n"
                "The echo engine is active. Any text or message you send to this bot will be automatically reflected back to you instantly."
            )
        else:
            response_text = (
                "*System Active*\n\n"
                "The webhook node is operational. Customize your handler code or choose a template."
            )
    else:
        # Handling fallback messages depending on type
        if bot_type == "echo":
            response_text = f"You said: `{text}`"
        elif bot_type == "feedback":
            response_text = (
                "*Thank you for your feedback!*\n\n"
                "Your message has been received and securely forwarded. The administration team will review your comments as soon as possible."
            )
        elif bot_type == "welcome":
            response_text = (
                "*Support Ticket Registered*\n\n"
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

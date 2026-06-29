import logging
from fastapi import FastAPI, Request, Response, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx

# Configure logging for guaranteed Vercel log visibility
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("telegram-bot-backend")

app = FastAPI()

# Add CORS support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LaunchRequest(BaseModel):
    bot_token: str
    bot_type: Optional[str] = "welcome"
    vercel_domain: str

class StopRequest(BaseModel):
    bot_token: str

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "platform": "Vercel Serverless Multi-Bot (Python FastAPI Integration)",
        "indicator": "Active"
    }

@app.post("/api/launch")
async def launch_bot(payload: LaunchRequest):
    bot_token = payload.bot_token
    bot_type = payload.bot_type or "welcome"
    vercel_domain = payload.vercel_domain

    if not bot_token or not vercel_domain:
        return Response(
            status_code=status.HTTP_400_BAD_REQUEST,
            content='{"success": false, "detail": "Missing bot_token or vercel_domain"}'
        )

    # Clean the domain
    clean_domain = vercel_domain.replace("https://", "").replace("http://", "").split("/")[0]
    
    # Secure query parameters mapping (avoids colons in URL paths)
    webhook_url = f"https://{clean_domain}/api/webhook?token={bot_token}&type={bot_type}"

    try:
        async with httpx.AsyncClient() as client:
            # 1. Fetch bot details using getMe API
            get_me_url = f"https://api.telegram.org/bot{bot_token}/getMe"
            me_resp = await client.get(get_me_url)
            me_data = me_resp.json()

            if me_resp.status_code != 200 or not me_data.get("ok"):
                error_desc = me_data.get("description", "Invalid Bot Token")
                return {
                    "success": False,
                    "message": f"Failed to verify token: {error_desc}",
                    "telegram_response": me_data
                }

            bot_username = me_data.get("result", {}).get("username", "UnknownBot")

            # 2. Register Webhook with Telegram's servers
            telegram_set_url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
            logger.info(f"Setting webhook for @{bot_username} ({bot_type}) to {webhook_url}")
            
            set_resp = await client.post(
                telegram_set_url,
                json={"url": webhook_url, "allowed_updates": ["message"]}
            )
            set_data = set_resp.json()

            if set_resp.status_code == 200 and set_data.get("ok"):
                return {
                    "success": True,
                    "message": f"Success! @{bot_username} is now live 24x7!",
                    "username": bot_username,
                    "bot_type": bot_type,
                    "webhook_url": webhook_url,
                    "telegram_response": set_data
                }
            else:
                return {
                    "success": False,
                    "message": f"Telegram API error: {set_data.get('description', 'Unknown error')}",
                    "telegram_response": set_data
                }

    except Exception as exc:
        logger.error(f"HTTP request failed: {exc}")
        return {
            "success": False,
            "message": f"Failed to communicate with Telegram API: {str(exc)}"
        }

@app.post("/api/stop")
async def stop_bot(payload: StopRequest):
    bot_token = payload.bot_token
    if not bot_token:
        return Response(
            status_code=status.HTTP_400_BAD_REQUEST,
            content='{"success": false, "detail": "Missing bot_token"}'
        )

    try:
        async with httpx.AsyncClient() as client:
            telegram_del_url = f"https://api.telegram.org/bot{bot_token}/deleteWebhook"
            logger.info(f"Deleting webhook for bot token {bot_token[:10]}...")
            
            resp = await client.post(telegram_del_url)
            data = resp.json()

            if resp.status_code == 200 and data.get("ok"):
                return {
                    "success": True,
                    "message": "Webhook deleted successfully.",
                    "telegram_response": data
                }
            else:
                return {
                    "success": False,
                    "message": f"Telegram API error: {data.get('description', 'Unknown error')}",
                    "telegram_response": data
                }
    except Exception as exc:
        logger.error(f"HTTP request failed: {exc}")
        return {
            "success": False,
            "message": f"Failed to communicate with Telegram API: {str(exc)}"
        }

@app.post("/api/webhook")
async def telegram_webhook(
    request: Request,
    token: str = Query(...),
    type: str = Query(...)
):
    # Guaranteed immediate terminal logging
    logger.info("==================================================")
    logger.info(">>> TELEGRAM WEBHOOK HIT SUCCESSFULLY <<<")
    logger.info(f"Parameters: Token_Prefix={token[:10]}... | Template_Type={type}")
    logger.info("==================================================")

    try:
        update = await request.json()
        logger.info(f"Raw Webhook Payload received: {update}")
    except Exception as e:
        logger.error(f"Failed to parse body JSON payload: {e}")
        # Return 200 OK to Telegram so it doesn't try to send bad formatting again
        return {"status": "ignored", "reason": "invalid_json"}

    # Wrap the entire logic in a global try-except to guarantee 200 OK back to Telegram
    try:
        message = update.get("message")
        if not message:
            logger.info("No message block present in Telegram update payload - skipping.")
            return {"status": "ignored", "reason": "no_message"}

        chat = message.get("chat")
        if not chat or not chat.get("id"):
            logger.info("No valid chat ID found in the message context - skipping.")
            return {"status": "ignored", "reason": "no_chat"}

        chat_id = chat.get("id")
        text = (message.get("text") or "").strip()

        telegram_send_url = f"https://api.telegram.org/bot{token}/sendMessage"
        response_text = ""

        # Handle Commands / Texts based on Bot Templates
        if text.startswith("/start"):
            if type == "welcome":
                response_text = (
                    "*Welcome to Support Bot*\n\n"
                    "Your automated welcoming system is fully active, running 24x7 on our serverless node with zero latency.\n\n"
                    "How can we assist you today? Please reply with your query."
                )
            elif type == "feedback":
                response_text = (
                    "*Feedback and Contact Bot*\n\n"
                    "Your feedback is highly valuable to us. Please write your comments, suggestions, or queries below, and they will be forwarded immediately to the owner."
                )
            elif type == "echo":
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
            if type == "echo":
                response_text = f"You said: `{text}`"
            elif type == "feedback":
                response_text = (
                    "*Thank you for your feedback!*\n\n"
                    "Your message has been received and securely forwarded. The administration team will review your comments as soon as possible."
                )
            elif type == "welcome":
                response_text = (
                    "*Support Ticket Registered*\n\n"
                    "Thank you for contacting our customer support team. Your message has been logged under our active serverless node, and a representative will reply shortly."
                )
            else:
                response_text = f"Message logged under Webhook handler: {text}"

        logger.info(f"Formulating response for Chat ID {chat_id}: {response_text[:30]}...")

        # Async POST back to Telegram Bot API
        async with httpx.AsyncClient() as client:
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
                logger.info("Telegram API dispatch succeeded.")
                return {"status": "success", "action": "sent_reply", "type": type}
            else:
                logger.warning(f"Telegram API dispatch partial failure: {res_data}")
                return {"status": "partial_error", "telegram_error": res_data}

    except Exception as e:
        logger.error(f"Global webhook handler exception: {e}", exc_info=True)
        # Always return 200 OK so Telegram stops retrying and flooding the serverless function
        return {"status": "failed_execution", "error": str(e)}

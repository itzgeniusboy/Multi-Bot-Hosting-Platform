import os
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
        "🤝 *Welcome to the 24x7 Customer Support Bot!*\n\n"
        "How can we assist you today? Our support staff has configured this auto-responder to instantly route and log queries.\n\n"
        "Please select an option or reply with your message:\n"
        "🔹 `/ticket` - Register a support ticket\n"
        "🔹 `/faq` - View frequently asked questions\n"
        "🔹 `/status` - Check active system statuses"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['faq'])
def send_faq(message):
    faq_text = (
        "💡 *Frequently Asked Questions*\n\n"
        "1️⃣ *How do I deploy a bot?*\n"
        "Simply type your token on our web dashboard and click Launch.\n\n"
        "2️⃣ *Is it 24x7?*\n"
        "Yes! GitHub Actions workflows recycle automatically to provide uninterrupted uptime.\n\n"
        "3️⃣ *Is my token secure?*\n"
        "Absolutely. Tokens are passed straight into secure workflows and never stored in plain text."
    )
    bot.reply_to(message, faq_text)

@bot.message_handler(commands=['ticket'])
def raise_ticket(message):
    bot.reply_to(message, "🎟️ *Support Ticket Raised!* Please reply to this message describing your issue, and our engineers will get back to you immediately.")

@bot.message_handler(commands=['status'])
def check_status(message):
    bot.reply_to(message, "🟢 *All Systems Operational.*\n- Database: Online\n- Router Core: 0.1ms Latency\n- API Gateways: Functional")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.reply_to(message, "✅ *Support ticket received!* Your message has been logged. An agent will contact you shortly.")

if __name__ == "__main__":
    logger.info("Initializing Continuous Support Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)

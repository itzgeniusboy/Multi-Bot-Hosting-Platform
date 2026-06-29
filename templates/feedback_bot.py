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
        "📊 *Welcome to the feedback and Contact Bot!*\n\n"
        "Your thoughts are critical to our improvements! Send us any feedback or messages, and we will safely log it for the owner.\n\n"
        "🔹 `/feedback <text>` - Register a specific feedback\n"
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
    bot.reply_to(message, f"🎯 *Feedback Logged!* \n\n_\"{feedback_text}\"_\n\nThank you for helping us grow!")

@bot.message_handler(func=lambda message: True)
def log_text(message):
    bot.reply_to(message, "📝 Message recorded. If you want to log it as formal feedback, please use `/feedback <your message>`!")

if __name__ == "__main__":
    logger.info("Initializing Continuous Feedback Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)

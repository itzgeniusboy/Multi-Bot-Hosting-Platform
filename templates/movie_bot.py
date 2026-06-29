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
        "🎬 *Welcome to Movie Suggestion Bot!*\n\n"
        "I am running *24x7 on our secure hosting platform* via GitHub Actions.\n\n"
        "Here are the commands you can use:\n"
        "🔹 `/list` - View available blockbusters\n"
        "🔹 `/movie <name>` - Search details about a blockbuster\n"
        "🔹 `/help` - Show this assistance message"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['list'])
def list_movies(message):
    movie_list = "🍿 *Available Movie Database*:\n\n" + "\n".join([f"🎥 `{k.replace('_', ' ').title()}`" for k in MOVIES.keys()])
    movie_list += "\n\nUse `/movie <name>` (e.g. `/movie inception`) to see full details!"
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
            f"🎬 *{m['title']}*\n\n"
            f"🎭 *Genre:* {m['genre']}\n"
            f"⭐ *Rating:* {m['rating']}\n\n"
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

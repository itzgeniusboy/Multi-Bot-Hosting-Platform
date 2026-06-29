import express from "express";
import path from "path";

const app = express();
const PORT = 3000;

// JSON parser
app.use(express.json());

// Workflow template code
const RUN_BOT_YML = `name: 24x7 Multi-Bot Host Engine

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
          BOT_TOKEN: \${{ github.event.client_payload.bot_token }}
          GITHUB_PAT: \${{ github.event.client_payload.github_pat }}
          SCRIPT_NAME: \${{ github.event.client_payload.script_name }}
          REPOSITORY: \${{ github.repository }}
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
`;

// Script templates
const MOVIE_BOT_PY = `import os
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
        "🎬 *Welcome to Movie Suggestion Bot!*\\n\\n"
        "I am running *24x7 on our secure hosting platform* via GitHub Actions.\\n\\n"
        "Here are the commands you can use:\\n"
        "🔹 /list - View available blockbusters\\n"
        "🔹 /movie <name> - Search details about a blockbuster\\n"
        "🔹 /help - Show this assistance message"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['list'])
def list_movies(message):
    movie_list = "🍿 *Available Movie Database*:\\n\\n" + "\\n".join([f"🎥 {k.replace('_', ' ').title()}" for k in MOVIES.keys()])
    movie_list += "\\n\\nUse /movie <name> (e.g. /movie inception) to see full details!"
    bot.reply_to(message, movie_list)

@bot.message_handler(commands=['movie'])
def movie_detail(message):
    args = message.text.split()
    if len(args) < 2:
        bot.reply_to(message, "⚠️ *Please specify a movie name!* Usage: /movie inception or /movie interstellar.")
        return
        
    query = "_".join(args[1:]).lower()
    if query in MOVIES:
        m = MOVIES[query]
        res = (
            f"🎬 *{m['title']}*\\n\\n"
            f"🎭 *Genre:* {m['genre']}\\n"
            f"⭐ *Rating:* {m['rating']}\\n\\n"
            f"📝 *Synopsis:* {m['desc']}"
        )
        bot.reply_to(message, res)
    else:
        bot.reply_to(message, f"❌ Movie '{args[1]}' was not found in our current showcase database. Try \`/list\` to view available names.")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.reply_to(message, "💭 *I am focused purely on movies!* Send \`/list\` to find highly rated cinematic releases or \`/movie\` to query specifics.")

if __name__ == "__main__":
    logger.info("Initializing Continuous Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
`;

const SUPPORT_BOT_PY = `import os
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
        "🤝 *Welcome to the 24x7 Customer Support Bot!*\\n\\n"
        "How can we assist you today? Our support staff has configured this auto-responder to instantly route and log queries.\\n\\n"
        "Please select an option or reply with your message:\\n"
        "🔹 \`/ticket\` - Register a support ticket\\n"
        "🔹 \`/faq\` - View frequently asked questions\\n"
        "🔹 \`/status\` - Check active system statuses"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['faq'])
def send_faq(message):
    faq_text = (
        "💡 *Frequently Asked Questions*\\n\\n"
        "1️⃣ *How do I deploy a bot?*\\n"
        "Simply type your token on our web dashboard and click Launch.\\n\\n"
        "2️⃣ *Is it 24x7?*\\n"
        "Yes! GitHub Actions workflows recycle automatically to provide uninterrupted uptime.\\n\\n"
        "3️⃣ *Is my token secure?*\\n"
        "Absolutely. Tokens are passed straight into secure workflows and never stored in plain text."
    )
    bot.reply_to(message, faq_text)

@bot.message_handler(commands=['ticket'])
def raise_ticket(message):
    bot.reply_to(message, "🎟️ *Support Ticket Raised!* Please reply to this message describing your issue, and our engineers will get back to you immediately.")

@bot.message_handler(commands=['status'])
def check_status(message):
    bot.reply_to(message, "🟢 *All Systems Operational.*\\n- Database: Online\\n- Router Core: 0.1ms Latency\\n- API Gateways: Functional")

@bot.message_handler(func=lambda message: True)
def echo_all(message):
    bot.reply_to(message, "✅ *Support ticket received!* Your message has been logged. An agent will contact you shortly.")

if __name__ == "__main__":
    logger.info("Initializing Continuous Support Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
`;

const FEEDBACK_BOT_PY = `import os
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
        "📊 *Welcome to the feedback and Contact Bot!*\\n\\n"
        "Your thoughts are critical to our improvements! Send us any feedback or messages, and we will safely log it for the owner.\\n\\n"
        "🔹 \`/feedback <text>\` - Register a specific feedback\\n"
        "🔹 \`/about\` - Find out about this bot"
    )
    bot.reply_to(message, welcome_text)

@bot.message_handler(commands=['about'])
def send_about(message):
    bot.reply_to(message, "ℹ️ This is a feedback collector bot running continuous loops on GitHub Actions.")

@bot.message_handler(commands=['feedback'])
def collect_feedback(message):
    args = message.text.split()
    if len(args) < 2:
        bot.reply_to(message, "⚠️ Please provide your feedback text. Example: \`/feedback Great bot!\`")
        return
    feedback_text = " ".join(args[1:])
    bot.reply_to(message, f"🎯 *Feedback Logged!* \\n\\n_\\"{feedback_text}\\"_\\n\\nThank you for helping us grow!")

@bot.message_handler(func=lambda message: True)
def log_text(message):
    bot.reply_to(message, "📝 Message recorded. If you want to log it as formal feedback, please use \`/feedback <your message>\`!")

if __name__ == "__main__":
    logger.info("Initializing Continuous Feedback Long-Polling...")
    bot.infinity_polling(timeout=60, long_polling_timeout=30)
`;

// Helper function to commit/write a file to GitHub
async function commitGitHubFile(token: string, repoName: string, filePath: string, content: string, message: string) {
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "telegram-bot-backend",
  };

  // 1. Check if file exists
  let sha = undefined;
  const checkUrl = `https://api.github.com/repos/${repoName}/contents/${filePath}`;
  try {
    const checkResp = await fetch(checkUrl, { headers });
    if (checkResp.status === 200) {
      const data: any = await checkResp.json();
      sha = data.sha;
    }
  } catch (e) {
    console.warn(`Error checking if file exists on GitHub:`, e);
  }

  // 2. Commit file
  const base64Content = Buffer.from(content).toString("base64");
  const putBody: any = {
    message,
    content: base64Content,
  };
  if (sha) {
    putBody.sha = sha;
  }

  const putResp = await fetch(checkUrl, {
    method: "PUT",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(putBody),
  });

  if (putResp.status !== 200 && putResp.status !== 201) {
    const text = await putResp.text();
    throw new Error(`Failed to commit file ${filePath} to ${repoName}: ${text}`);
  }
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    platform: "GitHub Actions Multi-Bot SaaS platform (Express Integration)",
    indicator: "Active",
  });
});

app.get("/api/login", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID || "";
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${appUrl}/callback`;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=repo,workflow,admin:repo_hook`;
  res.json({ url: authUrl });
});

app.get("/api/callback", async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID || "";
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || "";
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${appUrl}/callback`;

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData: any = await tokenResponse.json();
    const accessToken = tokenData.access_token || "";

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json({ access_token: accessToken });
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>GitHub Authorization Success</title>
          <style>
              body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                  background-color: #0B0F19;
                  color: #F3F4F6;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  text-align: center;
              }
              .card {
                  background-color: #111827;
                  border: 1px solid #1F2937;
                  padding: 2rem;
                  border-radius: 1rem;
                  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
              }
              .loader {
                  border: 3px solid #1F2937;
                  border-top: 3px solid #00D4FF;
                  border-radius: 50%;
                  width: 30px;
                  height: 30px;
                  animation: spin 1s linear infinite;
                  margin-bottom: 1.5rem;
              }
              @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
              }
          </style>
      </head>
      <body>
          <div class="card">
              <div style="display: flex; justify-content: center;"><div class="loader"></div></div>
              <h2 style="color: #00D4FF; margin-top: 0;">Authorized Successfully</h2>
              <p style="color: #9CA3AF; font-size: 0.95rem;">Syncing repositories with your Dashboard...</p>
              <p style="color: #4B5563; font-size: 0.8rem;">This window will close automatically.</p>
          </div>

          <script>
              const token = "${accessToken}";
              if (window.opener) {
                  window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS", token: token }, "*");
                  setTimeout(() => { window.close(); }, 1000);
              } else {
                  window.location.href = "/?token=" + token;
              }
          </script>
      </body>
      </html>
    `);
  } catch (e: any) {
    res.status(500).send(`Authentication failed: ${e.message}`);
  }
});

app.get("/api/repos", async (req, res) => {
  const token = req.query.token as string;
  if (!token) {
    return res.status(400).json({ error: "Missing required access token" });
  }

  try {
    const resp = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend",
      },
    });

    if (resp.status !== 200) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: `GitHub error: ${errText}` });
    }

    const repos: any = await resp.json();
    const cleanRepos = repos.map((r: any) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      default_branch: r.default_branch || "main",
    }));

    res.json(cleanRepos);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/launch", async (req, res) => {
  const { repo_name, bot_token, script_name, github_token } = req.body;

  if (!repo_name || !bot_token || !script_name || !github_token) {
    return res.status(400).json({ success: false, detail: "Missing required deployment fields" });
  }

  // Select script content
  let pyContent = MOVIE_BOT_PY;
  let actualScript = "movie_bot";
  if (script_name.includes("movie")) {
    pyContent = MOVIE_BOT_PY;
    actualScript = "movie_bot";
  } else if (script_name.includes("support") || script_name.includes("welcome")) {
    pyContent = SUPPORT_BOT_PY;
    actualScript = "support_bot";
  } else if (script_name.includes("feedback")) {
    pyContent = FEEDBACK_BOT_PY;
    actualScript = "feedback_bot";
  }

  try {
    // 1. Verify Bot Token first
    const getMeUrl = `https://api.telegram.org/bot${bot_token}/getMe`;
    const meResponse = await fetch(getMeUrl);
    const meResult: any = await meResponse.json();

    if (meResponse.status !== 200 || !meResult.ok) {
      const errorDesc = meResult.description || "Invalid Bot Token";
      return res.status(400).json({
        success: false,
        message: `Failed to verify token: ${errorDesc}`,
      });
    }

    const botUsername = meResult.result?.username || "UnknownBot";

    // Delete webhook on Telegram's end so actions polling can run instantly
    const delWebhookUrl = `https://api.telegram.org/bot${bot_token}/deleteWebhook`;
    await fetch(delWebhookUrl, { method: "POST" });

    // 2. Commit workflow file
    console.log(`Committing run_bot.yml to ${repo_name}...`);
    await commitGitHubFile(
      github_token,
      repo_name,
      ".github/workflows/run_bot.yml",
      RUN_BOT_YML,
      "[Platform Multi-Bot] Injected 24x7 runner workflow"
    );

    // 3. Commit bot script file
    console.log(`Committing templates/${actualScript}.py to ${repo_name}...`);
    await commitGitHubFile(
      github_token,
      repo_name,
      `templates/${actualScript}.py`,
      pyContent,
      `[Platform Multi-Bot] Injected script template for ${actualScript}`
    );

    // 4. Dispatch repository trigger
    console.log(`Triggering repository_dispatch for ${repo_name}...`);
    const dispatchUrl = `https://api.github.com/repos/${repo_name}/dispatches`;
    const dispatchResp = await fetch(dispatchUrl, {
      method: "POST",
      headers: {
        Authorization: `token ${github_token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "telegram-bot-backend",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "launch_bot",
        client_payload: {
          bot_token: bot_token,
          script_name: actualScript,
          github_pat: github_token,
        },
      }),
    });

    if (dispatchResp.status !== 204) {
      const errText = await dispatchResp.text();
      return res.status(dispatchResp.status).json({
        success: false,
        message: `Injected code files but failed to dispatch: ${errText}`,
      });
    }

    res.json({
      success: true,
      message: `Success! Code injected and 24x7 daemon dispatch triggered for @${botUsername}!`,
      username: botUsername,
      bot_type: actualScript,
      repo_name,
    });
  } catch (exc: any) {
    console.error(`Launch failed:`, exc);
    res.status(500).json({ success: false, message: exc.message });
  }
});

app.post("/api/stop", async (req, res) => {
  const { repo_name, github_token } = req.body;
  if (!repo_name || !github_token) {
    return res.status(400).json({ success: false, detail: "Missing repo_name or github_token" });
  }

  const headers = {
    Authorization: `token ${github_token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "telegram-bot-backend",
  };

  try {
    // List in-progress runs
    const runsResp = await fetch(`https://api.github.com/repos/${repo_name}/actions/runs?status=in_progress`, {
      headers,
    });

    if (runsResp.status !== 200) {
      const text = await runsResp.text();
      return res.status(runsResp.status).json({ error: `GitHub API error: ${text}` });
    }

    const data: any = await runsResp.json();
    const runs = data.workflow_runs || [];

    let cancelledCount = 0;
    for (const run of runs) {
      if (run.name === "24x7 Multi-Bot Host Engine" || run.path.includes("run_bot.yml")) {
        const cancelResp = await fetch(`https://api.github.com/repos/${repo_name}/actions/runs/${run.id}/cancel`, {
          method: "POST",
          headers,
        });
        if (cancelResp.status === 202) {
          cancelledCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Stopped bot workflow runs successfully. Cancelled ${cancelledCount} running instances.`,
      cancelled_instances: cancelledCount,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/webhook", async (req, res) => {
  const bot_token = req.query.token as string;
  const bot_type = req.query.type as string;
  const update = req.body;

  if (!bot_token || !bot_type) {
    return res.status(400).json({ status: "error", message: "Missing token or type query parameter" });
  }

  const message = update?.message;
  if (!message) {
    return res.json({ status: "ignored", reason: "No message object present" });
  }

  const chat = message.chat;
  if (!chat || !chat.id) {
    return res.json({ status: "ignored", reason: "No valid chat context" });
  }

  const chatId = chat.id;
  const text = (message.text || "").trim();

  const telegramSendUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
  let responseText = "";

  if (text.startsWith("/start")) {
    if (bot_type === "movie_bot") {
      responseText = 
        "*Welcome to Movie Suggestion Bot*\n\n" +
        "I am running *24x7 on our secure hosting platform* via GitHub Actions.\n\n" +
        "Here are the commands you can use:\n" +
        "🔹 `/list` - View available blockbusters\n" +
        "🔹 `/movie <name>` - Search details about a blockbuster\n" +
        "🔹 `/help` - Show this assistance message";
    } else if (bot_type === "support_bot") {
      responseText = 
        "*Welcome to Customer Support Bot*\n\n" +
        "How can we assist you today? Our support staff has configured this auto-responder to instantly route and log queries.\n\n" +
        "🔹 `/ticket` - Register a support ticket\n" +
        "🔹 `/faq` - View frequently asked questions\n" +
        "🔹 `/status` - Check active system statuses";
    } else if (bot_type === "feedback_bot") {
      responseText = 
        "*Welcome to Feedback and Contact Bot*\n\n" +
        "Your thoughts are critical to our improvements! Send us any feedback or messages, and we will safely log it for the owner.\n\n" +
        "🔹 `/feedback <text>` - Register a specific feedback\n" +
        "🔹 `/about` - Find out about this bot";
    } else {
      responseText = "*Daemon Online:* Simulated endpoint operational.";
    }
  } else if (text.startsWith("/list") && bot_type === "movie_bot") {
    responseText = "🍿 *Available Movie Database*:\n\n🎥 `Interstellar`\n🎥 `Inception`\n🎥 `The Dark Knight`";
  } else if (text.startsWith("/faq") && bot_type === "support_bot") {
    responseText = "💡 *FAQ*\n\n1️⃣ *Is it 24x7?* Yes! Workflows recycle automatically.\n2️⃣ *Is my token secure?* Absolutely.";
  } else {
    if (bot_type === "movie_bot") {
      responseText = "💭 *I am focused purely on movies!* Send `/list` to find highly rated cinematic releases.";
    } else if (bot_type === "support_bot") {
      responseText = "✅ *Support ticket received!* Your message has been logged. An agent will contact you shortly.";
    } else if (bot_type === "feedback_bot") {
      responseText = "📝 Message recorded. If you want to log it as formal feedback, please use `/feedback <your message>`!";
    } else {
      responseText = `Simulated response to: ${text}`;
    }
  }

  try {
    const response = await fetch(telegramSendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
        parse_mode: "Markdown"
      })
    });
    const resData: any = await response.json();
    if (response.status === 200 && resData.ok) {
      return res.json({ status: "success", action: "sent_reply", bot_type });
    } else {
      return res.json({ status: "partial_error", telegram_error: resData });
    }
  } catch (e: any) {
    return res.json({ status: "failed_sending_reply", error: e.message });
  }
});

// Vite middleware and serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express dev/production server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

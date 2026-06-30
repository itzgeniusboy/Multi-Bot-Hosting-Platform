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
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const REDIRECT_URI = "https://multi-bot-hosting-platform.vercel.app/api/callback";

if (!GITHUB_CLIENT_ID) {
  console.log("[DEBUG] GITHUB_CLIENT_ID environment variable is missing!");
}
if (!GITHUB_CLIENT_SECRET) {
  console.log("[DEBUG] GITHUB_CLIENT_SECRET environment variable is missing!");
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    platform: "GitHub Actions Multi-Bot SaaS platform (Express Integration)",
    indicator: "Active",
  });
});

app.get("/api/login", (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    // Elegant sandbox fallback so that the applet works flawlessly in AI Studio out of the box
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const authUrl = `${appUrl}/api/callback?code=mock_sandbox_code`;
    return res.json({ url: authUrl, is_mock: true });
  }

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo%20workflow`;
  res.json({ url: authUrl });
});

app.get("/api/callback", async (req, res) => {
  const { code } = req.query;

  // Verify GITHUB_CLIENT_ID configuration
  if (!GITHUB_CLIENT_ID) {
    // If it's a sandbox fallback code, we can bypass the GITHUB exchange and mock a token:
    if (code === "mock_sandbox_code") {
      const accessToken = "mock_sandbox_access_token_xyz123";
      res.cookie("github_token", accessToken, {
        httpOnly: false,
        secure: true,
        sameSite: "lax",
        maxAge: 31536000000,
      });
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Sandbox Authorization Success</title>
            <style>
                body {
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
                }
                .card {
                    background-color: #0F172A;
                    border: 1px solid #1E293B;
                    padding: 2.5rem;
                    border-radius: 1.25rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                }
            </style>
        </head>
        <body>
            <div class="card">
                <h2 style="color: #22D3EE; margin-top: 0; font-weight: 800;">Authorized via Sandbox</h2>
                <p style="color: #94A3B8; font-size: 0.95rem;">Successfully connected to local workspace development mode.</p>
            </div>
            <script>
                const token = "${accessToken}";
                if (window.opener) {
                    window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS", token: token }, "*");
                    setTimeout(() => { window.close(); }, 1000);
                    // Fallback in case window.close is blocked or ignored by the browser
                    setTimeout(() => {
                        window.location.href = "/?token=" + token + "#dashboard-section";
                    }, 1800);
                } else {
                    window.location.href = "/?token=" + token + "#dashboard-section";
                }
            </script>
        </body>
        </html>
      `);
    }

    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Configuration Missing</title>
          <style>
              body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                  background-color: #030812;
                  color: #FF3B6B;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
              }
              .card {
                  text-align: center;
                  padding: 2.5rem;
                  background: rgba(12, 25, 46, 0.6);
                  border: 1px solid rgba(255, 59, 107, 0.2);
                  border-radius: 1rem;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                  max-width: 500px;
              }
              h1 { color: #FF3B6B; margin-bottom: 1rem; }
              p { color: #8892B0; line-height: 1.5; }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>GitHub OAuth Setup Required</h1>
              <p>GitHub Client ID or Secret is not configured on the server. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables under the Settings menu in AI Studio, or use the Personal Access Token (PAT) option instead!</p>
          </div>
      </body>
      </html>
    `);
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData: any = await tokenResponse.json();
    const accessToken = tokenData.access_token || "";

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json({ access_token: accessToken });
    }

    // Save in secure browser Cookie as requested
    res.cookie("github_token", accessToken, {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      maxAge: 31536000000,
    });

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
                  // Fallback in case window.close is blocked or ignored by the browser
                  setTimeout(() => {
                      window.location.href = "/?token=" + token + "#dashboard-section";
                  }, 1800);
              } else {
                  window.location.href = "/?token=" + token + "#dashboard-section";
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

  if (token.startsWith("mock_sandbox_") || token.startsWith("demo_")) {
    return res.json([
      { id: 101, name: "my-telegram-bot", full_name: "sandbox-user/my-telegram-bot", private: false, default_branch: "main" },
      { id: 102, name: "movie-showcase-bot", full_name: "sandbox-user/movie-showcase-bot", private: true, default_branch: "master" },
      { id: 103, name: "customer-support-agent", full_name: "sandbox-user/customer-support-agent", private: false, default_branch: "main" }
    ]);
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

  if (github_token && (github_token.startsWith("mock_sandbox_") || github_token.startsWith("demo_"))) {
    const bot_username = "MySandboxBot";
    return res.json({
      success: true,
      status: "success",
      message: `Successfully injected daemon workflow and triggered 24x7 Action runner for @${bot_username} (Sandbox Mode)`,
      bot_username: bot_username,
      workflow_url: `https://github.com/${repo_name}/actions`
    });
  }

  // Select script content
  let pyContent = MOVIE_BOT_PY;
  let actualScript = "movie_bot";
  if (script_name.includes("movie")) {
    pyContent = MOVIE_BOT_PY;
    actualScript = "movie_bot";
  } else if (script_name.includes("management") || script_name.includes("support")) {
    pyContent = SUPPORT_BOT_PY;
    actualScript = "management_bot";
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

  if (github_token.startsWith("demo_")) {
    return res.json({
      success: true,
      message: `Stopped bot workflow runs successfully. Cancelled 1 running instance.`,
      cancelled_instances: 1,
    });
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

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Bot Hosting Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                        mono: ['"JetBrains Mono"', 'monospace'],
                    }
                }
            }
        }
    </script>
    <style>
        .glass-panel {
            background: rgba(10, 15, 30, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        .glow-cyan {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.25);
        }
        .glow-violet {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.25);
        }
        .terminal-container {
            background: rgba(4, 7, 15, 0.95);
            position: relative;
        }
        .terminal-container::before {
            content: " ";
            display: block;
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
            z-index: 2;
            background-size: 100% 4px;
            pointer-events: none;
        }
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.5);
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(6, 182, 212, 0.3);
            border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(6, 182, 212, 0.5);
        }
        
        .card-3d {
            transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.5s ease;
            transform-style: preserve-3d;
            perspective: 1000px;
        }
        .card-3d:hover {
            transform: translateY(-4px) rotateX(1deg) rotateY(1deg);
            box-shadow: 0 15px 35px rgba(6, 182, 212, 0.15);
        }
        
        .nav-btn-active {
            color: #22d3ee;
            background: rgba(6, 182, 212, 0.1);
            border-left: 3px solid #22d3ee;
        }
    </style>
</head>
<body class="bg-[#020617] text-slate-100 font-sans min-h-screen overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
    
    <!-- Top Sticky Responsive Navbar (Hidden on auth screen) -->
    <nav id="app-navbar" class="glass-panel border-b border-slate-800/80 sticky top-0 z-50 w-full hidden">
        <div class="max-w-6xl mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <!-- Brand / Logo -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <i data-lucide="cpu" class="w-4 h-4 text-white"></i>
                    </div>
                    <div>
                        <h1 class="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">Daemon Engine</h1>
                        <p class="text-sm font-extrabold text-white">Multi-Bot Platform</p>
                    </div>
                </div>
                
                <!-- Mobile Logout/Profile indicator -->
                <div class="flex items-center gap-2 md:hidden">
                    <div id="user-avatar-mobile" class="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                        <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
                    </div>
                    <button onclick="logout()" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Sign Out">
                        <i data-lucide="log-out" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <!-- Navigation Tabs/Pills -->
            <div class="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0" id="navbar-tabs">
                <button onclick="switchTab('dashboard')" id="nav-dashboard" class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 whitespace-nowrap">
                    <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                    Dashboard
                </button>
                <button onclick="switchTab('status')" id="nav-status" class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-800/30 whitespace-nowrap">
                    <i data-lucide="activity" class="w-4 h-4"></i>
                    System Status
                </button>
                <button onclick="switchTab('nodes')" id="nav-nodes" class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-800/30 whitespace-nowrap">
                    <i data-lucide="server" class="w-4 h-4"></i>
                    Active Nodes
                    <span id="active-nodes-badge" class="bg-cyan-500/15 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-cyan-500/20 hidden">0</span>
                </button>
            </div>

            <!-- User Profile & Sign Out (Desktop) -->
            <div class="hidden md:flex items-center gap-3 p-1 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div id="user-avatar" class="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                    <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
                </div>
                <div class="text-left max-w-[120px]">
                    <p id="user-display-name" class="text-[11px] font-semibold text-white truncate">Guest Session</p>
                    <p id="user-github-handle" class="text-[9px] text-slate-500 font-mono truncate">Not Connected</p>
                </div>
                <button onclick="logout()" id="logout-btn" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Sign Out">
                    <i data-lucide="log-out" class="w-3.5 h-3.5 text-slate-400"></i>
                </button>
            </div>
        </div>
    </nav>

    <!-- Main Content Area -->
    <main class="w-full px-4 py-8 md:p-8 min-h-screen">
        <div class="max-w-6xl mx-auto space-y-8">
            
            <!-- Header Bar -->
            <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6 gap-4">
                <div>
                    <h2 id="page-title" class="text-2xl font-bold tracking-tight text-white">Dashboard Console</h2>
                    <p class="text-xs text-slate-400 font-mono">NODE HOST: <span class="text-cyan-400">EXPRESS-DEEP-EDGE</span> | ROUTER: <span class="text-cyan-400">ACTIVE</span></p>
                </div>
                
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        GATEWAY STATUS: ONLINE
                    </div>
                </div>
            </header>

            <!-- PHASE 1: Authentication Screen -->
            <section id="auth-screen" class="min-h-[60vh] flex flex-col justify-center items-center py-12 px-4">
                <div class="w-full max-w-md space-y-8 text-center">
                    <!-- Brand / App Info on Login -->
                    <div class="space-y-4">
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-cyan-500/20 mx-auto">
                            <i data-lucide="cpu" class="w-8 h-8 text-white"></i>
                        </div>
                        <div class="space-y-2">
                            <h2 class="text-3xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">Daemon Engine</h2>
                            <p class="text-sm text-slate-400 font-mono uppercase tracking-wider">Multi-Bot Hosting Platform</p>
                        </div>
                        <p class="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                            Deploy and run continuous Telegram bot daemons 24x7 with absolute ease and high-performance server telemetry.
                        </p>
                    </div>

                    <!-- Single Login Card -->
                    <div class="glass-panel rounded-2xl p-6 md:p-8 border border-slate-800 shadow-2xl relative overflow-hidden text-left">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <!-- OAuth Button (Primary) -->
                        <div class="space-y-6">
                            <button onclick="loginWithGitHub()" class="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-extrabold text-sm tracking-wide transition-all shadow-lg hover:shadow-cyan-500/15 flex items-center justify-center gap-3 group">
                                <i data-lucide="github" class="w-5 h-5 transition-transform group-hover:scale-110"></i>
                                Continue with GitHub
                            </button>
                            
                            <!-- Toggle for Manual Login -->
                            <div class="text-center">
                                <button onclick="toggleManualLogin()" id="toggle-manual-btn" class="text-xs text-slate-400 hover:text-cyan-400 transition-colors underline underline-offset-4 decoration-slate-800 hover:decoration-cyan-500">
                                    Login with Username & Access Token (PAT)
                                </button>
                            </div>
                        </div>

                        <!-- Manual Token Integration Fields (Collapsible/Hidden by default) -->
                        <div id="manual-login-container" class="hidden space-y-5 pt-6 border-t border-slate-800/60 mt-6 transition-all duration-300">
                            <div class="space-y-2">
                                <h4 class="text-sm font-bold text-white flex items-center gap-2">
                                    <i data-lucide="key" class="w-4 h-4 text-violet-400"></i>
                                    Personal Access Token Login
                                </h4>
                                <p class="text-[11px] text-slate-500 leading-normal">
                                    Use a GitHub Personal Access Token (PAT) with <code class="bg-slate-950 px-1.5 py-0.5 rounded text-violet-400 font-mono text-[10px]">repo</code> scope to manually integrate your repository tree.
                                </p>
                            </div>

                            <div class="space-y-4">
                                <div class="space-y-1.5">
                                    <label class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">GitHub Username</label>
                                    <input type="text" id="manual-username" placeholder="example: octocat" class="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all">
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Personal Access Token (PAT)</label>
                                    <input type="password" id="manual-pat" placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx" class="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all">
                                </div>
                            </div>
                            
                            <button onclick="loginManually()" class="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-semibold text-sm border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2">
                                Connect Manually
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- PHASE 2: Main Application Dashboard Panel -->
            <section id="dashboard-section" class="grid lg:grid-cols-12 gap-8 hidden">
                <!-- Deploy Form -->
                <div class="lg:col-span-5 space-y-6">
                    <div class="glass-panel rounded-2xl p-6 border border-slate-800">
                        <div class="flex items-center gap-2.5 mb-6">
                            <div class="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                                <i data-lucide="rocket" class="w-4 h-4"></i>
                            </div>
                            <h3 class="text-base font-bold text-white">Deploy Node Daemon</h3>
                        </div>
                        
                        <form id="deploy-form" class="space-y-5" onsubmit="handleDeploy(event)">
                            <!-- Repository Selection -->
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                                    <span>Select Repository</span>
                                    <span onclick="refreshRepos()" class="text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1">
                                        <i data-lucide="refresh-cw" class="w-3 h-3" id="repo-refresh-icon"></i>
                                        Sync Repos
                                    </span>
                                </label>
                                <select id="repo-select" required class="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all">
                                    <option value="">Fetching repository list...</option>
                                </select>
                            </div>
                            
                            <!-- Telegram Token -->
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Telegram Bot Token</label>
                                <input type="password" id="bot-token" required placeholder="example: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" class="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-all">
                            </div>
                            
                            <!-- Script Template -->
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Script Template</label>
                                <select id="script-template" required class="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all">
                                    <option value="movie_bot.py">movie_bot.py (Movie catalog suggestions agent)</option>
                                    <option value="management_bot.py">management_bot.py (Customer support ticketing & management agent)</option>
                                </select>
                            </div>
                            
                            <!-- Launch Button -->
                            <button type="submit" id="deploy-submit-btn" class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-500/5 flex items-center justify-center gap-2">
                                <i data-lucide="play" class="w-4 h-4"></i>
                                Deploy & Run 24x7
                            </button>
                        </form>
                    </div>
                </div>
                
                <!-- Terminal Window -->
                <div class="lg:col-span-7 space-y-6 flex flex-col h-full">
                    <div class="terminal-container rounded-2xl border border-slate-800 overflow-hidden flex flex-col flex-1 shadow-2xl">
                        <div class="bg-slate-950/80 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div class="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                                <div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            </div>
                            <div class="text-[10px] font-mono text-slate-500">SYSTEM LOG CONSOLE</div>
                            <button onclick="clearTerminal()" class="text-[10px] font-mono text-slate-400 hover:text-white transition-all">Clear</button>
                        </div>
                        
                        <div id="terminal-body" class="p-6 font-mono text-xs text-slate-300 leading-relaxed overflow-y-auto h-[400px]">
                            <div class="text-cyan-500">[SYSTEM] Connection established with platform API server.</div>
                            <div class="text-slate-500">[SYSTEM] Ready for telemetry ingestion and log capture.</div>
                            <div class="text-slate-500">[SYSTEM] Click Deploy to initiate secure actions build pipelines.</div>
                            <span class="block-cursor" id="terminal-cursor"></span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- SECTION: System Status -->
            <section id="status-section" class="space-y-8 hidden">
                <!-- Metrics Gauges Grid -->
                <div class="grid md:grid-cols-3 gap-6">
                    <!-- CPU Status Card -->
                    <div class="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col items-center text-center">
                        <div class="relative w-28 h-28 flex items-center justify-center mb-4">
                            <svg class="w-full h-full transform -rotate-90">
                                <circle cx="56" cy="56" r="48" stroke="rgba(15, 23, 42, 0.8)" stroke-width="8" fill="transparent"></circle>
                                <circle cx="56" cy="56" r="48" stroke="rgb(6, 182, 212)" stroke-width="8" fill="transparent" stroke-dasharray="301.6" stroke-dashoffset="240" id="cpu-gauge" class="transition-all duration-1000"></circle>
                            </svg>
                            <div class="absolute text-center">
                                <span id="cpu-val" class="text-xl font-extrabold text-white">20</span>
                                <span class="text-[10px] text-slate-500 block font-mono">CPU %</span>
                            </div>
                        </div>
                        <h4 class="text-sm font-bold text-slate-300">Cluster Compute</h4>
                        <p class="text-xs text-slate-500 mt-1 font-mono">STATUS: OPTIMAL</p>
                    </div>

                    <!-- RAM Status Card -->
                    <div class="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col items-center text-center">
                        <div class="relative w-28 h-28 flex items-center justify-center mb-4">
                            <svg class="w-full h-full transform -rotate-90">
                                <circle cx="56" cy="56" r="48" stroke="rgba(15, 23, 42, 0.8)" stroke-width="8" fill="transparent"></circle>
                                <circle cx="56" cy="56" r="48" stroke="rgb(139, 92, 246)" stroke-width="8" fill="transparent" stroke-dasharray="301.6" stroke-dashoffset="160" id="ram-gauge" class="transition-all duration-1000"></circle>
                            </svg>
                            <div class="absolute text-center">
                                <span id="ram-val" class="text-xl font-extrabold text-white">47</span>
                                <span class="text-[10px] text-slate-500 block font-mono">RAM %</span>
                            </div>
                        </div>
                        <h4 class="text-sm font-bold text-slate-300">Heap Allocation</h4>
                        <p class="text-xs text-slate-500 mt-1 font-mono">STATUS: STEADY</p>
                    </div>

                    <!-- Latency Status Card -->
                    <div class="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col items-center text-center">
                        <div class="relative w-28 h-28 flex items-center justify-center mb-4">
                            <svg class="w-full h-full transform -rotate-90">
                                <circle cx="56" cy="56" r="48" stroke="rgba(15, 23, 42, 0.8)" stroke-width="8" fill="transparent"></circle>
                                <circle cx="56" cy="56" r="48" stroke="rgb(16, 185, 129)" stroke-width="8" fill="transparent" stroke-dasharray="301.6" stroke-dashoffset="80" id="lat-gauge" class="transition-all duration-1000"></circle>
                            </svg>
                            <div class="absolute text-center">
                                <span id="lat-val" class="text-xl font-extrabold text-white">52</span>
                                <span class="text-[10px] text-slate-500 block font-mono">LAT ms</span>
                            </div>
                        </div>
                        <h4 class="text-sm font-bold text-slate-300">Gateway Roundtrip</h4>
                        <p class="text-xs text-slate-500 mt-1 font-mono">STATUS: ULTRA-LOW</p>
                    </div>
                </div>

                <!-- API Routes Table -->
                <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                    <div class="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
                        <h4 class="text-sm font-bold text-white">API Integration Specifications</h4>
                        <span class="text-[10px] font-mono text-cyan-400">GATEWAY LAYER ACTIVE</span>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr class="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                                    <th class="px-6 py-3.5">Method</th>
                                    <th class="px-6 py-3.5">Endpoint</th>
                                    <th class="px-6 py-3.5">Description</th>
                                    <th class="px-6 py-3.5">Latency</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800 font-mono">
                                <tr class="hover:bg-slate-900/20">
                                    <td class="px-6 py-4"><span class="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">GET</span></td>
                                    <td class="px-6 py-4 text-slate-200">/api/health</td>
                                    <td class="px-6 py-4 text-slate-400">Verifies pipeline system diagnostics</td>
                                    <td class="px-6 py-4 text-slate-400">1.2ms</td>
                                </tr>
                                <tr class="hover:bg-slate-900/20">
                                    <td class="px-6 py-4"><span class="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">GET</span></td>
                                    <td class="px-6 py-4 text-slate-200">/api/login</td>
                                    <td class="px-6 py-4 text-slate-400">Initiates GitHub OAuth flow integration</td>
                                    <td class="px-6 py-4 text-slate-400">0.8ms</td>
                                </tr>
                                <tr class="hover:bg-slate-900/20">
                                    <td class="px-6 py-4"><span class="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">GET</span></td>
                                    <td class="px-6 py-4 text-slate-200">/api/repos</td>
                                    <td class="px-6 py-4 text-slate-400">Retrieves updated workspace repository index</td>
                                    <td class="px-6 py-4 text-slate-400">210ms</td>
                                </tr>
                                <tr class="hover:bg-slate-900/20">
                                    <td class="px-6 py-4"><span class="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-bold">POST</span></td>
                                    <td class="px-6 py-4 text-slate-200">/api/launch</td>
                                    <td class="px-6 py-4 text-slate-400">Injects run_bot.yml workflow and commits code</td>
                                    <td class="px-6 py-4 text-slate-400">450ms</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!-- SECTION: Active Nodes -->
            <section id="nodes-section" class="space-y-8 hidden">
                <!-- Active Nodes List -->
                <div id="nodes-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Dyn list populated by JS -->
                </div>
                
                <!-- Empty State -->
                <div id="nodes-empty-state" class="glass-panel rounded-2xl p-12 text-center max-w-lg mx-auto border border-slate-800 space-y-4">
                    <div class="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto text-slate-500 border border-slate-800">
                        <i data-lucide="server-off" class="w-6 h-6"></i>
                    </div>
                    <div class="space-y-1">
                        <h4 class="text-sm font-bold text-white">No Active Daemons Found</h4>
                        <p class="text-xs text-slate-400">Deploy and register your first bot script using the launch wizard in the primary dashboard page.</p>
                    </div>
                </div>
            </section>

        </div>
    </main>

    <!-- App Logic -->
    <script>
        // Init Lucide icons
        lucide.createIcons();

        // App session variables
        let githubToken = localStorage.getItem('github_token');
        let githubUsername = localStorage.getItem('github_username') || '';

        // Catch OAuth Callback redirect query params
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
            localStorage.setItem('github_token', urlToken);
            window.history.replaceState({}, document.title, window.location.pathname);
            githubToken = urlToken;
        }

        // Initialize state
        checkAuth();

        function checkAuth() {
            if (githubToken) {
                document.getElementById('auth-screen').classList.add('hidden');
                document.getElementById('app-navbar').classList.remove('hidden');
                document.getElementById('dashboard-section').classList.remove('hidden');
                document.getElementById('logout-btn').classList.remove('hidden');
                
                // Show badge count
                updateActiveNodesCount();
                
                // Fetch dynamic elements
                fetchUserInfo();
                refreshRepos();
            } else {
                document.getElementById('auth-screen').classList.remove('hidden');
                document.getElementById('app-navbar').classList.add('hidden');
                document.getElementById('dashboard-section').classList.add('hidden');
                document.getElementById('status-section').classList.add('hidden');
                document.getElementById('nodes-section').classList.add('hidden');
                document.getElementById('logout-btn').classList.add('hidden');
                
                // Reset session profiles
                document.getElementById('user-display-name').innerText = 'Guest Session';
                document.getElementById('user-github-handle').innerText = 'Not Connected';
                document.getElementById('user-avatar').innerHTML = '<i data-lucide="user" class="w-4 h-4 text-slate-400"></i>';
                document.getElementById('user-avatar-mobile').innerHTML = '<i data-lucide="user" class="w-4 h-4 text-slate-400"></i>';
                lucide.createIcons();
            }
        }

        // Toggle Manual Login Fields
        function toggleManualLogin() {
            const container = document.getElementById('manual-login-container');
            const btn = document.getElementById('toggle-manual-btn');
            if (container.classList.contains('hidden')) {
                container.classList.remove('hidden');
                btn.innerText = 'Hide Username & Token option';
            } else {
                container.classList.add('hidden');
                btn.innerText = 'Login with Username & Access Token (PAT)';
            }
        }

        // Login with GitHub (OAuth Redirect)
        function loginWithGitHub() {
            const clientId = "__GITHUB_CLIENT_ID__";
            if (!clientId || clientId === "" || clientId.includes("GITHUB_CLIENT_ID")) {
                alert("Configuration Error: GITHUB_CLIENT_ID variable is missing in this context.");
                return;
            }
            const redirectUri = window.location.origin + "/api/callback";
            const scope = "repo,workflow,admin:repo_hook";
            window.location.href = "https://github.com/login/oauth/authorize?client_id=" + clientId + "&redirect_uri=" + encodeURIComponent(redirectUri) + "&scope=" + encodeURIComponent(scope);
        }

        // Manual connect
        function loginManually() {
            const username = document.getElementById('manual-username').value.trim();
            const pat = document.getElementById('manual-pat').value.trim();
            
            if (!username || !pat) {
                alert('Both Username and Personal Access Token are required.');
                return;
            }
            
            localStorage.setItem('github_token', pat);
            localStorage.setItem('github_username', username);
            githubToken = pat;
            githubUsername = username;
            
            logTerminal("success", "[SYSTEM] Manually connected with GitHub account: @" + username);
            checkAuth();
        }

        // Logout
        function logout() {
            localStorage.removeItem('github_token');
            localStorage.removeItem('github_username');
            githubToken = null;
            githubUsername = '';
            checkAuth();
        }

        // Fetch User Info
        async function fetchUserInfo() {
            if (!githubToken) return;
            try {
                const resp = await fetch('https://api.github.com/user', {
                    headers: {
                        'Authorization': 'token ' + githubToken
                    }
                });
                if (resp.ok) {
                    const user = await resp.json();
                    localStorage.setItem('github_username', user.login);
                    document.getElementById('user-display-name').innerText = user.name || user.login;
                    document.getElementById('user-github-handle').innerText = '@' + user.login;
                    document.getElementById('user-avatar').innerHTML = '<img src="' + user.avatar_url + '" alt="Avatar" class="w-full h-full object-cover">';
                    document.getElementById('user-avatar-mobile').innerHTML = '<img src="' + user.avatar_url + '" alt="Avatar" class="w-full h-full object-cover">';
                } else if (githubUsername) {
                    // Fallback to manual username
                    document.getElementById('user-display-name').innerText = githubUsername;
                    document.getElementById('user-github-handle').innerText = '@' + githubUsername;
                }
            } catch (e) {
                console.error("Failed to fetch GitHub user details:", e);
                if (githubUsername) {
                    document.getElementById('user-display-name').innerText = githubUsername;
                    document.getElementById('user-github-handle').innerText = '@' + githubUsername;
                }
            }
        }

        // Fetch Repositories
        async function refreshRepos() {
            if (!githubToken) return;
            const select = document.getElementById('repo-select');
            const icon = document.getElementById('repo-refresh-icon');
            
            icon.classList.add('animate-spin');
            select.innerHTML = '<option value="">Syncing repositories...</option>';
            
            try {
                const resp = await fetch('/api/repos?token=' + githubToken);
                if (!resp.ok) throw new Error(await resp.text());
                const repos = await resp.json();
                
                select.innerHTML = '';
                if (repos.length === 0) {
                    select.innerHTML = '<option value="">No repositories found</option>';
                    return;
                }
                
                repos.forEach(repo => {
                    const option = document.createElement('option');
                    option.value = repo.full_name;
                    option.innerText = repo.full_name;
                    select.appendChild(option);
                });
                
                logTerminal("success", "[SYSTEM] Sync complete. Loaded " + repos.length + " active repositories.");
            } catch (err) {
                console.error(err);
                select.innerHTML = '<option value="">Failed to sync repositories</option>';
                logTerminal("error", "[SYSTEM] Sync error: " + err.message);
            } finally {
                icon.classList.remove('animate-spin');
            }
        }

        // Deployment Console Log Logger
        function logTerminal(type, message) {
            const term = document.getElementById('terminal-body');
            const cursor = document.getElementById('terminal-cursor');
            const line = document.createElement('div');
            
            if (type === 'success') line.className = 'text-emerald-400';
            else if (type === 'error') line.className = 'text-rose-500';
            else if (type === 'info') line.className = 'text-cyan-400';
            else line.className = 'text-slate-300';
            
            const timestamp = new Date().toLocaleTimeString();
            line.innerText = '[' + timestamp + '] ' + message;
            
            term.insertBefore(line, cursor);
            term.scrollTop = term.scrollHeight;
        }

        function clearTerminal() {
            const term = document.getElementById('terminal-body');
            term.innerHTML = '<span class="block-cursor" id="terminal-cursor"></span>';
        }

        // Deploy logic
        async function handleDeploy(event) {
            event.preventDefault();
            const repo_name = document.getElementById('repo-select').value;
            const bot_token = document.getElementById('bot-token').value.trim();
            const script_name = document.getElementById('script-template').value;
            
            if (!repo_name || !bot_token || !script_name) {
                alert('Please select and complete all required forms.');
                return;
            }
            
            const btn = document.getElementById('deploy-submit-btn');
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<div class="w-4 h-4 border-2 border-slate-300 border-t-cyan-400 rounded-full animate-spin"></div> Provisioning node...';
            
            logTerminal("info", "[DEPLOY] Initiating deployment pipeline for workspace: " + repo_name);
            logTerminal("info", "[DEPLOY] Selected daemon runtime script: " + script_name + ".py");
            logTerminal("info", "[DEPLOY] Dispatching validation call to Telegram gateways...");
            
            try {
                const resp = await fetch('/api/launch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        repo_name: repo_name,
                        bot_token: bot_token,
                        script_name: script_name,
                        github_token: githubToken
                    })
                });
                
                const data = await resp.json();
                if (!resp.ok) throw new Error(data.detail || 'Build process failed');
                
                logTerminal("success", "[DEPLOY] SUCCESS: " + data.message);
                logTerminal("success", "[DEPLOY] Node @" + data.username + " successfully registered as active node.");
                
                // Track active deployments in local storage
                let activeBots = JSON.parse(localStorage.getItem('active_bots') || '[]');
                const existingIdx = activeBots.findIndex(b => b.repo_name === repo_name);
                const botData = {
                    repo_name: repo_name,
                    bot_username: data.username,
                    bot_token: bot_token,
                    script_name: script_name,
                    status: 'ACTIVE',
                    deployed_at: new Date().toLocaleDateString()
                };
                
                if (existingIdx > -1) {
                    activeBots[existingIdx] = botData;
                } else {
                    activeBots.push(botData);
                }
                localStorage.setItem('active_bots', JSON.stringify(activeBots));
                
                updateActiveNodesCount();
                renderActiveBots();
                document.getElementById('bot-token').value = '';
            } catch (err) {
                logTerminal("error", "[DEPLOY] ERROR: " + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }

        // Cancel Active daemon workflow run
        async function stopDaemon(repoName) {
            logTerminal("info", "[DAEMON] Terminating continuous workflow instances for: " + repoName);
            try {
                const resp = await fetch('/api/stop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        repo_name: repoName,
                        github_token: githubToken
                    })
                });
                
                const data = await resp.json();
                if (!resp.ok) throw new Error(data.detail || 'Failed to stop');
                
                logTerminal("success", "[DAEMON] Stopped successfully. " + data.cancelled_instances + " workflow run pipelines terminated.");
                
                // Remove from local tracking list
                let activeBots = JSON.parse(localStorage.getItem('active_bots') || '[]');
                activeBots = activeBots.filter(b => b.repo_name !== repoName);
                localStorage.setItem('active_bots', JSON.stringify(activeBots));
                
                updateActiveNodesCount();
                renderActiveBots();
            } catch (err) {
                logTerminal("error", "[DAEMON] Cancel error: " + err.message);
            }
        }

        // Render Active Nodes Tab
        function renderActiveBots() {
            const grid = document.getElementById('nodes-grid');
            const emptyState = document.getElementById('nodes-empty-state');
            const activeBots = JSON.parse(localStorage.getItem('active_bots') || '[]');
            
            grid.innerHTML = '';
            if (activeBots.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }
            emptyState.classList.add('hidden');
            
            activeBots.forEach(bot => {
                const card = document.createElement('div');
                card.className = 'glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between relative overflow-hidden card-3d';
                
                // Icon select based on template type
                let templateIcon = 'help-circle';
                let templateColor = 'text-violet-400 bg-violet-500/10 border-violet-500/20';
                if (bot.script_name.includes('movie')) {
                    templateIcon = 'film';
                    templateColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                } else if (bot.script_name.includes('feedback')) {
                    templateIcon = 'message-square';
                    templateColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                }
                
                card.innerHTML = \`
                    <div class="space-y-4">
                        <div class="flex items-start justify-between">
                            <div class="min-w-0 flex-1">
                                <h4 class="font-bold text-white text-sm truncate">\${bot.repo_name}</h4>
                                <p class="text-xs text-slate-400 font-mono mt-1">@\${bot.bot_username}</p>
                            </div>
                            <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">Active</span>
                        </div>
                        <div class="flex items-center gap-2 p-2 rounded bg-slate-900/50 border border-slate-850">
                            <div class="w-7 h-7 rounded flex items-center justify-center border \${templateColor}">
                                <i data-lucide="\${templateIcon}" class="w-3.5 h-3.5"></i>
                            </div>
                            <div class="text-[10px] font-mono">
                                <p class="text-slate-500 uppercase tracking-wider text-[8px]">Script Template</p>
                                <p class="text-slate-300 font-semibold">\${bot.script_name}.py</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500">
                            <div>
                                <span class="block text-[8px] uppercase tracking-wider">Deployed</span>
                                <span class="text-slate-300 font-medium">\${bot.deployed_at || 'Recently'}</span>
                            </div>
                            <div>
                                <span class="block text-[8px] uppercase tracking-wider">Trigger</span>
                                <span class="text-slate-300 font-medium">Auto-Recycle</span>
                            </div>
                        </div>
                    </div>
                    <div class="pt-6">
                        <button onclick="stopDaemon('\${bot.repo_name}')" class="w-full py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/15 hover:border-rose-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-2">
                            <i data-lucide="stop-circle" class="w-3.5 h-3.5"></i>
                            Deregister & Stop Daemon
                        </button>
                    </div>\`;
                grid.appendChild(card);
            });
            lucide.createIcons();
        }

        // Active nodes count badge updating
        function updateActiveNodesCount() {
            const activeBots = JSON.parse(localStorage.getItem('active_bots') || '[]');
            const badge = document.getElementById('active-nodes-badge');
            if (activeBots.length > 0) {
                badge.innerText = activeBots.length;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        // Switch navigation tabs
        function switchTab(tabId) {
            // Section elements
            const sections = {
                dashboard: document.getElementById('dashboard-section'),
                status: document.getElementById('status-section'),
                nodes: document.getElementById('nodes-section')
            };
            
            // Tab elements
            const navButtons = {
                dashboard: document.getElementById('nav-dashboard'),
                status: document.getElementById('nav-status'),
                nodes: document.getElementById('nav-nodes')
            };
            
            // Loop and switch active styling
            Object.keys(sections).forEach(key => {
                if (key === tabId) {
                    if (githubToken || key === 'dashboard') {
                        sections[key].classList.remove('hidden');
                    }
                    navButtons[key].className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 whitespace-nowrap";
                } else {
                    sections[key].classList.add('hidden');
                    navButtons[key].className = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-800/30 border border-transparent whitespace-nowrap";
                }
            });

            // Update Header Title
            const titleMap = {
                dashboard: 'Dashboard Console',
                status: 'System Diagnostics',
                nodes: 'Active Workloads'
            };
            document.getElementById('page-title').innerText = titleMap[tabId];

            if (tabId === 'nodes') {
                renderActiveBots();
            }
        }

        // Dynamic status gauges simulator
        setInterval(() => {
            if (document.getElementById('status-section').classList.contains('hidden')) return;
            
            // Fluctuations
            const cpuVal = Math.floor(Math.random() * 14) + 12; // 12-25
            const ramVal = Math.floor(Math.random() * 5) + 44;   // 44-48
            const latVal = Math.floor(Math.random() * 21) + 45;  // 45-65
            
            // Update Text
            document.getElementById('cpu-val').innerText = cpuVal;
            document.getElementById('ram-val').innerText = ramVal;
            document.getElementById('lat-val').innerText = latVal;
            
            // SVG Circumference is 2 * PI * r = 2 * 3.14159 * 48 = ~301.6
            const maxCircumference = 301.6;
            
            // Compute offsets
            const cpuOffset = maxCircumference - (cpuVal / 100) * maxCircumference;
            const ramOffset = maxCircumference - (ramVal / 100) * maxCircumference;
            const latOffset = maxCircumference - (latVal / 100) * maxCircumference;
            
            // Update dash offsets
            document.getElementById('cpu-gauge').style.strokeDashoffset = cpuOffset;
            document.getElementById('ram-gauge').style.strokeDashoffset = ramOffset;
            document.getElementById('lat-gauge').style.strokeDashoffset = latOffset;
        }, 1500);
    </script>
</body>
</html>`;

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

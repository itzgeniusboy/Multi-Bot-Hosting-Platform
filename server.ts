import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// JSON parser
app.use(express.json());

// Active bots db (fallback/simulated in-memory)
const activeBotsDb: Record<string, {
  username: string;
  token: string;
  bot_type: string;
  status: string;
}> = {};

// API routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    platform: "Vercel Serverless Multi-Bot (Express Integration)",
    indicator: "Active"
  });
});

app.post("/api/launch", async (req, res) => {
  const { bot_token, bot_type = "welcome", vercel_domain } = req.body;

  if (!bot_token || !vercel_domain) {
    return res.status(400).json({
      success: false,
      detail: "Missing required fields: 'bot_token' and 'vercel_domain' are mandatory."
    });
  }

  const cleanDomain = vercel_domain.replace("https://", "").replace("http://", "").split("/")[0];
  const webhookUrl = `https://${cleanDomain}/api/webhook/${bot_token}/${bot_type}`;

  try {
    // 1. Fetch bot details using getMe API
    const getMeUrl = `https://api.telegram.org/bot${bot_token}/getMe`;
    const meResponse = await fetch(getMeUrl);
    const meResult: any = await meResponse.json();

    if (meResponse.status !== 200 || !meResult.ok) {
      const errorDesc = meResult.description || "Invalid Bot Token";
      return res.status(400).json({
        success: false,
        message: `Failed to verify token: ${errorDesc}`,
        telegram_response: meResult
      });
    }

    const botUsername = meResult.result?.username || "UnknownBot";

    // 2. Tell Telegram's servers to send all messages to our webhook
    const telegramApiUrl = `https://api.telegram.org/bot${bot_token}/setWebhook`;
    console.log(`Setting webhook for @${botUsername} (${bot_type}) to ${webhookUrl}`);

    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
    });
    const result: any = await response.json();

    if (response.status === 200 && result.ok) {
      activeBotsDb[bot_token] = {
        username: botUsername,
        token: bot_token,
        bot_type,
        status: "Active"
      };
      return res.json({
        success: true,
        message: `Success! @${botUsername} is now live 24x7!`,
        username: botUsername,
        bot_type,
        webhook_url: webhookUrl,
        telegram_response: result
      });
    } else {
      return res.status(422).json({
        success: false,
        message: `Telegram API error: ${result.description || "Unknown error"}`,
        telegram_response: result
      });
    }
  } catch (exc: any) {
    console.error(`HTTP request failed: ${exc}`);
    return res.status(502).json({
      success: false,
      message: `Failed to communicate with Telegram API: ${exc.message}`
    });
  }
});

app.post("/api/stop", async (req, res) => {
  const { bot_token } = req.body;
  if (!bot_token) {
    return res.status(400).json({
      success: false,
      detail: "Missing 'bot_token' parameter."
    });
  }

  try {
    const telegramApiUrl = `https://api.telegram.org/bot${bot_token}/deleteWebhook`;
    console.log(`Deleting webhook for bot token ${bot_token.slice(0, 10)}...`);

    const response = await fetch(telegramApiUrl, { method: "POST" });
    const result: any = await response.json();

    if (response.status === 200 && result.ok) {
      if (activeBotsDb[bot_token]) {
        activeBotsDb[bot_token].status = "Stopped";
      }
      return res.json({
        success: true,
        message: "Webhook deleted successfully.",
        telegram_response: result
      });
    } else {
      return res.status(422).json({
        success: false,
        message: `Telegram API error: ${result.description || "Unknown error"}`,
        telegram_response: result
      });
    }
  } catch (exc: any) {
    console.error(`HTTP request failed: ${exc}`);
    return res.status(502).json({
      success: false,
      message: `Failed to communicate with Telegram API: ${exc.message}`
    });
  }
});

app.post("/api/webhook/:bot_token/:bot_type", async (req, res) => {
  const { bot_token, bot_type } = req.params;
  const update = req.body;

  console.log(`Incoming Telegram update for bot ${bot_token.slice(0, 10)}... type ${bot_type}:`, JSON.stringify(update));

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
    if (bot_type === "welcome") {
      responseText = 
        "*Welcome to Support Bot*\n\n" +
        "Your automated welcoming system is fully active, running 24x7 on our serverless node with zero latency.\n\n" +
        "How can we assist you today? Please reply with your query.";
    } else if (bot_type === "feedback") {
      responseText = 
        "*Feedback and Contact Bot*\n\n" +
        "Your feedback is highly valuable to us. Please write your comments, suggestions, or queries below, and they will be forwarded immediately to the owner.";
    } else if (bot_type === "echo") {
      responseText = 
        "*Echo and Auto-Reply Bot*\n\n" +
        "The echo engine is active. Any text or message you send to this bot will be automatically reflected back to you instantly.";
    } else {
      responseText = 
        "*System Active*\n\n" +
        "The webhook node is operational. Customize your handler code or choose a template.";
    }
  } else {
    if (bot_type === "echo") {
      responseText = `You said: \`${text}\``;
    } else if (bot_type === "feedback") {
      responseText = 
        "*Thank you for your feedback!*\n\n" +
        "Your message has been received and securely forwarded. The administration team will review your comments as soon as possible.";
    } else if (bot_type === "welcome") {
      responseText = 
        "*Support Ticket Registered*\n\n" +
        "Thank you for contacting our customer support team. Your message has been logged under our active serverless node, and a representative will reply shortly.";
    } else {
      responseText = `Message logged under Webhook handler: ${text}`;
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
      console.log(`Successfully sent response for type ${bot_type} to Chat ID ${chatId}`);
      return res.json({ status: "success", action: "sent_reply", bot_type });
    } else {
      console.warn(`Telegram failed to send message:`, resData);
      return res.json({ status: "partial_error", telegram_error: resData });
    }
  } catch (e: any) {
    console.error(`Error communicating with Telegram:`, e);
    return res.json({ status: "failed_sending_reply", error: e.message });
  }
});

// Vite middleware and serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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

startServer();

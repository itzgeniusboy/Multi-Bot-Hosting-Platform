# 🚀 VPS Deployment Guide: GitHub Actions Multi-Bot Platform

Follow these step-by-step commands on your dedicated Linux VPS to host and run this dashboard.

---

## 📋 Prerequisites

Ensure your VPS has **Python 3.10+** and **Git** installed.

```bash
# Update package list and install system dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv git curl -y
```

---

## 🛠️ Installation & Setup

### 1. Clone your Repository on the VPS
If you haven't already, push these files (`app.py`, `.github/`, `templates/`) to your GitHub repository, then clone it onto your VPS:

```bash
git clone https://github.com/<YOUR_GITHUB_OWNER>/<YOUR_GITHUB_REPO>.git
cd <YOUR_GITHUB_REPO>
```

### 2. Set Up Virtual Environment
Create a clean isolated virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Requirements
Install FastAPI, Uvicorn, Httpx, and other needed dependencies:

```bash
pip install fastapi uvicorn httpx pyTelegramBotAPI
```

---

## ⚡ Running the Control Dashboard

### Option A: Run directly via Uvicorn (For testing)
Run the server on port `8000` (or choose any port):

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```
Open your browser and navigate to `http://<YOUR_VPS_IP>:8000` to access the console!

### Option B: Run 24x7 in the background using `systemd` (Recommended)
To keep the dashboard active even after you close your SSH terminal, configure a systemd service:

Create a service file:
```bash
sudo nano /etc/systemd/system/bot-orchestrator.service
```

Paste the following configuration (replace `/path/to/your/repo` with actual paths):
```ini
[Unit]
Description=FastAPI Multi-Bot Orchestrator
After=network.target

[Service]
User=root
WorkingDirectory=/path/to/your/repo
ExecStart=/path/to/your/repo/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable bot-orchestrator
sudo systemctl start bot-orchestrator
```

To view live logs on your VPS:
```bash
sudo journalctl -u bot-orchestrator -f
```

---

## 🔑 How to Get a GitHub Personal Access Token (PAT)

Your FastAPI dashboard triggers the GitHub API using a Personal Access Token. 
1. Go to **GitHub Settings** -> **Developer Settings** -> **Personal Access Tokens** -> **Tokens (classic)**.
2. Click **Generate new token**.
3. Select the **`repo`** scope (this is required to trigger repository dispatch events).
4. Click **Generate Token** and copy it safely.

---

## ⚙️ How GitHub Actions Keep the Bot Active 24x7

The workflow configuration `.github/workflows/run_bot.yml` has a built-in safety cutoff at **5.5 hours**. Just before the GitHub 6-hour execution timeout limit:
1. It automatically stops the running python bot process.
2. It sends a secure webhook request back to GitHub API using your Personal Access Token (PAT).
3. GitHub starts a fresh workflow, instantly resuming polling for your Telegram bot.

This provides completely free, unlimited, and uninterrupted **24/7 hosting**!

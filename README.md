# 🤖 Daily Learning Agent (GitHub Actions)

Sends a daily push notification every morning at 8AM IST.
**100% free — no server, no maintenance.**

---

## 🚀 Setup (5 minutes)

### 1. Create a GitHub repo
- Go to https://github.com/new
- Create a new **private** repository (e.g. `daily-learning-agent`)
- Push these files to it:
```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/daily-learning-agent.git
git push -u origin main
```

### 2. Add Secrets to GitHub
Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these two secrets:

| Name | Value |
|---|---|
| `GROQ_API_KEY` | Your key from console.groq.com |
| `NTFY_TOPIC` | Your unique topic e.g. `yourname-learn-x7k2` |

### 3. Get free Groq API key
- Go to https://console.groq.com/keys
- Sign up and click **Create API Key** → Copy it

### 4. Subscribe on your phone
- Download **ntfy** app (Android / iPhone)
- Tap **+** → enter your topic name (same as `NTFY_TOPIC` secret)

### 5. Test it manually
- Go to your repo → **Actions** tab
- Click **Daily Learning Notification** → **Run workflow**
- Check your phone for the notification!

---

## ⏰ Schedule
Runs automatically every day at **8:00 AM IST** (2:30 UTC).

## 📅 Topic Rotation
Rotates daily through Interview Preparation topics:
1. ☕ Java Concepts
2. 🏗️ System Design (LLD & HLD)
3. 🤖 AI Interview Prep
4. 🧠 Machine Learning

---

## 🛠 Customize
- Change time in `.github/workflows/daily-agent.yml`:
  - 9AM IST → `30 3 * * *`
  - 7AM IST → `30 1 * * *`
- Add more topics in `agent.js` → `topics` array

# 🚀 Deploying Luca System to Vercel
### Step-by-step guide for beginners

---

## What you need (all free)
- A **GitHub account** → https://github.com
- A **Vercel account** → https://vercel.com (sign up with GitHub)
- **Node.js** installed → https://nodejs.org (download the LTS version)
- **Git** installed → https://git-scm.com

---

## STEP 1 — Install Vercel CLI
Open your terminal (Command Prompt or PowerShell on Windows, Terminal on Mac):

```bash
npm install -g vercel
```

---

## STEP 2 — Set up your project folder
Make sure your project folder has ALL these files:
```
luca-system/
├── api/
│   ├── login.js
│   ├── register.js
│   └── verify.js
├── index.html
├── login.html
├── register.html
├── styles.css
├── auth.css
├── script.js
├── canvas.js
├── logo.png         ← your logo image
├── luca.png         ← your luca image
├── package.json
└── vercel.json
```

---

## STEP 3 — Install dependencies
In your terminal, navigate to your project folder:

```bash
cd path/to/luca-system
npm install
```

This installs bcryptjs, jose, and @vercel/kv.

---

## STEP 4 — Push your project to GitHub

1. Go to https://github.com/new and create a **new repository** called `luca-system`
2. In your terminal, run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/luca-system.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## STEP 5 — Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New Project"**
3. Click **"Import Git Repository"** → select your `luca-system` repo
4. Leave all settings as default — Vercel will detect `vercel.json` automatically
5. Click **"Deploy"**

Wait ~1 minute. Vercel will give you a URL like:
`https://luca-system-yourusername.vercel.app`

---

## STEP 6 — Set up Vercel KV (the database for user accounts)

This is the important part for storing user accounts.

1. In your **Vercel Dashboard**, click on your `luca-system` project
2. Click the **"Storage"** tab at the top
3. Click **"Create Database"** → choose **"KV"** → click **"Create"**
4. Give it a name like `luca-kv` → click **"Create"**
5. Vercel will automatically add the KV environment variables to your project

Then **redeploy** so the new environment variables take effect:
- Go to your project → **"Deployments"** tab → click the **3 dots** on the latest deployment → **"Redeploy"**

---

## STEP 7 — Set your JWT secret

Your JWT secret is used to sign login tokens securely. Set it as an environment variable:

1. In your Vercel project → **"Settings"** tab → **"Environment Variables"**
2. Click **"Add New"**
3. Name: `JWT_SECRET`
4. Value: any long random string, e.g. `MyLucaSystem$ecretKey2025!@#xyz`
5. Click **"Save"**
6. **Redeploy** again (same steps as Step 6)

---

## STEP 8 — Test your app

Visit your Vercel URL (e.g. `https://luca-system-yourusername.vercel.app`):
- You should be redirected to the **login page**
- Click **"Create one"** to register a new account
- After registering, you'll be taken to the ledger automatically

---

## Updating your app in the future

Whenever you make changes to your files, just run:

```bash
git add .
git commit -m "describe your changes"
git push
```

Vercel will **automatically redeploy** within ~30 seconds. 🎉

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot find module '@vercel/kv'" | Run `npm install` then redeploy |
| "Invalid token" on login | Make sure `JWT_SECRET` is set in Vercel env vars and you redeployed |
| Login works but redirects loop | Clear your browser's localStorage: F12 → Application → Local Storage → Clear |
| KV errors in logs | Make sure you created the KV database AND redeployed after creating it |
| Changes not showing | Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) |

---

## Viewing your Vercel logs (for debugging)

1. Vercel Dashboard → your project → **"Functions"** tab
2. Click on any function to see its logs and error messages

---

*Luca System © 2025 — Happy deploying! 🚀*
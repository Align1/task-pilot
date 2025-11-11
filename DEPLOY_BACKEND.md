# 🚀 Deploy Backend API

## The Problem

Your app has **two separate servers**:
- **Frontend** (React/Vite) → ✅ Deployed to Vercel
- **Backend** (Express API) → ❌ Not deployed yet

Vercel deployed the frontend, but the API endpoints (like `/api/auth/login`) don't exist because `server.js` isn't running.

---

## ✅ Solution: Deploy Backend to Railway (Easiest)

### **Why Railway?**
- ✅ Free tier (500 hours/month)
- ✅ Supports Node.js + PostgreSQL
- ✅ Easy deployment
- ✅ Auto-detects server.js
- ✅ Environment variables
- ✅ HTTPS automatic

---

## 🚂 Railway Deployment (10 minutes)

### Step 1: Create Railway Account
1. Go to: https://railway.app
2. Click "Start a New Project"
3. Sign in with GitHub

### Step 2: Deploy from GitHub

**Option A: Connect GitHub Repo** (If you have GitHub)
```bash
# 1. Push your code to GitHub
git init
git add .
git commit -m "Task Pilot initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/task-pilot.git
git push -u origin main

# 2. In Railway:
# - Click "New Project"
# - Click "Deploy from GitHub repo"
# - Select task-pilot repo
# - Click "Deploy Now"
```

**Option B: Deploy from Local** (No GitHub needed)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### Step 3: Add Environment Variables

In Railway Dashboard:
1. Click your project
2. Click "Variables"
3. Add:
   ```
   JWT_SECRET=<your-secret-from-local-.env>
   PORT=3001
   ```
4. Click "Deploy"

### Step 4: Get Backend URL

Railway will give you a URL like:
```
https://task-pilot-production-abc123.up.railway.app
```

**Save this URL!** You need it for the frontend.

---

## 🔗 Connect Frontend to Backend

### Update Vercel Environment Variable

1. Go to Vercel Dashboard
2. Select "task-pilot" project
3. Settings → Environment Variables
4. Add:
   ```
   Name: VITE_API_URL
   Value: https://your-railway-url.railway.app
   ```
5. Redeploy frontend

### Update Code (for production API URL)

**vite.config.ts** already has proxy for local dev.

For production, update:

```typescript
// App.tsx - Update API_URL
const API_URL = import.meta.env.VITE_API_URL || '/api';
```

---


## 🎯 Simplest Solution (For Testing APK)

### Use Railway - Complete Steps:

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project
railway init

# 4. Link to Railway project (creates new one)
# Follow prompts - press Enter for defaults

# 5. Deploy backend
railway up

# 6. Add environment variables
railway variables set JWT_SECRET=<your-secret-from-.env>

# 7. Get URL
railway domain

# You'll get: https://task-pilot-production.up.railway.app
```

---

## 🔧 Update Frontend After Backend Deploy

### In Vercel Dashboard:

1. **Add Backend URL**:
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app
   ```

2. **Update CORS on Backend**:
   Add to `server.js`:
   ```javascript
   const allowedOrigins = [
     'http://localhost:3000',
     'https://task-pilot-gv434yjb6-aligndivine1-2188s-projects.vercel.app',
     process.env.FRONTEND_URL
   ];
   
   app.use(cors({
     origin: function (origin, callback) {
       if (!origin || allowedOrigins.includes(origin)) {
         callback(null, true);
       } else {
         callback(new Error('Not allowed by CORS'));
       }
     },
     credentials: true
   }));
   ```

3. **Redeploy Both**:
   - Redeploy backend on Railway
   - Redeploy frontend on Vercel

---

## ✅ Verification Steps

### After deploying backend:

1. **Test Backend Direct**:
   ```
   Visit: https://your-backend-url.railway.app/api
   Should see: "Hello from the API!"
   ```

2. **Test Frontend**:
   ```
   Visit: https://your-frontend-url.vercel.app
   Try to sign up/login
   Should work! ✅
   ```

3. **Generate APK**:
   ```
   Go to: https://www.pwabuilder.com
   Enter: https://your-frontend-url.vercel.app
   Generate APK!
   ```

---

## 💡 Recommended Architecture

```
┌──────────────────────┐
│   User's Phone       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Frontend (Vercel)   │
│  React + Vite        │
└──────────┬───────────┘
           │ API calls
           ▼
┌──────────────────────┐
│  Backend (Railway)   │
│  Express + Prisma    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Database (Railway)  │
│  PostgreSQL          │
└──────────────────────┘
```

---

## 🚀 Quick Commands Reference

### Deploy Backend to Railway:
```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway variables set JWT_SECRET=<your-secret>
```

### Get Backend URL:
```bash
railway domain
```

### Add to Vercel:
```
Vercel Dashboard → Settings → Environment Variables
Add: VITE_API_URL=<railway-url>
```

---

## 📋 Complete Deployment Checklist

- [ ] Install Railway CLI
- [ ] Deploy backend to Railway
- [ ] Set JWT_SECRET on Railway
- [ ] Get Railway backend URL
- [ ] Add VITE_API_URL to Vercel
- [ ] Update CORS in server.js
- [ ] Redeploy backend
- [ ] Redeploy frontend
- [ ] Test login/signup
- [ ] Generate APK with PWABuilder

---

## 🎯 Next Steps

**Right now, do this**:

1. **Cancel the current Vercel deployment** (Ctrl+C if still running)

2. **Deploy backend to Railway first**:
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

3. **Get Railway URL** and come back
   - I'll help you connect frontend to backend
   - Then redeploy to Vercel
   - Then generate APK!

---

**Want me to create a step-by-step guide for Railway deployment?**


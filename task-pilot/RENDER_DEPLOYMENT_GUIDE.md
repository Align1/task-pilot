 # 🚀 Deploy Task Pilot Backend to Render

## Complete Step-by-Step Guide

---

## 📋 Prerequisites

- [x] ✅ Backend code ready (server.js)
- [x] ✅ JWT_SECRET generated
- [x] ✅ App working locally

---

## 🎯 Method 1: Deploy from GitHub (Recommended - 15 min)

### **Step 1: Push Code to GitHub**

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Task Pilot backend"

# Create repo on GitHub:
# Go to: https://github.com/new
# Name: task-pilot
# Make it Public or Private
# Click "Create repository"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/task-pilot.git
git branch -M main
git push -u origin main
```

---

### **Step 2: Sign Up on Render**

1. Go to: https://render.com
2. Click "Get Started for Free"
3. Sign up with:
   - GitHub (recommended)
   - GitLab
   - Email

---

### **Step 3: Create New Web Service**

1. Click "New +" button (top right)
2. Select "Web Service"
3. Click "Connect a repository"
4. Authorize GitHub access
5. Select "task-pilot" repository

---

### **Step 4: Configure Service**

**Fill in the form**:

```
Name: task-pilot-backend
(or any name you want)

Region: Oregon (US West)
(or closest to you)

Branch: main

Runtime: Node

Build Command: npm install

Start Command: node server.js

Instance Type: Free
```

Click "Advanced" to see more options (optional)

---

### **Step 5: Add Environment Variables**

**CRITICAL STEP!**

Scroll down to "Environment Variables" section:

Click "Add Environment Variable" and add:

```
Key: JWT_SECRET
Value: 22160bce9622f5fb17a2e7c655d4ed67551254c5f0f767149a3206accfbe50f1fc50f84b2d14af109ead11d19df0511290a23ec42a5f9a895d6eb5a9270c4322

Key: PORT
Value: 3001

Key: NODE_ENV
Value: production
```

---

### **Step 6: Create Web Service**

1. Review settings
2. Click "Create Web Service"
3. Wait for deployment (2-5 minutes)

**Render will**:
- Clone your repo
- Run `npm install`
- Start `node server.js`
- Give you a URL

---

### **Step 7: Get Your Backend URL**

After deployment succeeds, you'll see:

```
Your service is live at:
https://task-pilot-backend.onrender.com
```

**Copy this URL!** You need it for the frontend.

---

## 🎯 Method 2: Manual Upload (No GitHub - 10 min)

### **Can't use GitHub?** No problem!

Unfortunately, Render requires GitHub/GitLab. But here are alternatives:

#### **Alternative A: Use Render with Public Repo**
- Make GitHub repo public
- No need to expose code
- Deploy from there

#### **Alternative B: Use Railway Instead**
Railway supports manual upload:
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

#### **Alternative C: Use Heroku**
Heroku supports Git push:
```bash
heroku create task-pilot-backend
git push heroku main
```

---

## 🔗 Connect Frontend to Render Backend

### **Step 1: Update Vite Config**

Edit `vite.config.ts`:

```typescript
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: mode === 'development' ? {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          }
        } : undefined
      },
      // ... rest
    };
});
```

---

### **Step 2: Update App.tsx**

```typescript
// At the top of App.tsx
const API_URL = import.meta.env.PROD 
  ? 'https://task-pilot-backend.onrender.com' 
  : '/api';
```

Or better yet, use environment variable:

```typescript
const API_URL = import.meta.env.VITE_API_URL || '/api';
```

---

### **Step 3: Add URL to Vercel**

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add:
   ```
   Name: VITE_API_URL
   Value: https://task-pilot-backend.onrender.com
   ```
5. Click "Save"
6. Go to Deployments
7. Click "..." → "Redeploy"

---

### **Step 4: Update CORS on Backend**

**IMPORTANT**: Backend must allow requests from Vercel

Add to `server.js` (before routes):

```javascript
// Update CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://task-pilot-gv434yjb6-aligndivine1-2188s-projects.vercel.app',
  'https://your-custom-domain.com' // if you have one
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

**Push changes**:
```bash
git add server.js
git commit -m "Update CORS for Vercel frontend"
git push
```

Render will auto-redeploy!

---

## ✅ Verification

### Test Backend:
```bash
# Visit directly
https://task-pilot-backend.onrender.com/api

# Should see:
"Hello from the API!"
```

### Test Frontend:
```bash
# Visit Vercel URL
https://your-frontend.vercel.app

# Try to sign up/login
# Should work! ✅
```

---

## 🐌 Render Free Tier Notes

### **Important Limitations**:

1. **Cold Starts** (~30 seconds)
   - Service sleeps after 15 min of inactivity
   - First request after sleep takes 30s to wake up
   - Subsequent requests are fast

2. **750 hours/month free**
   - Enough for testing
   - For production, consider paid tier ($7/month)

3. **Spin Down**
   - Unpaid services spin down after inactivity
   - Automatically wake up on request

---

## 💡 Pro Tips

### Keep Backend Awake:
Use a cron job or UptimeRobot to ping every 10 minutes:
```
https://uptimerobot.com
Add monitor: https://task-pilot-backend.onrender.com/api
Check interval: 10 minutes
```

### Use PostgreSQL:
Render offers free PostgreSQL database:
1. In Render Dashboard → New → PostgreSQL
2. Get connection string
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Add DATABASE_URL to environment variables

---

## 🔧 Troubleshooting

### Error: "Build failed"
**Check**:
- Is `package.json` committed?
- Is `server.js` in root?
- Are dependencies correct?

**Solution**: Check Render logs for specific error

---

### Error: "Application failed to respond"
**Check**:
- Is PORT environment variable set?
- Is server listening on process.env.PORT?

**Solution**:
```javascript
// server.js - Make sure you use PORT from env
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### Error: "JWT_SECRET not set"
**Check**:
- Did you add JWT_SECRET environment variable?
- Is it at least 32 characters?

**Solution**: Add in Render Dashboard → Environment

---

### Error: "CORS policy error"
**Check**:
- Is Vercel URL in allowedOrigins?

**Solution**: Update CORS config (see Step 4 above)

---

## 📱 After Backend Deploy - Generate APK

Once backend is deployed and working:

1. **Go to**: https://www.pwabuilder.com
2. **Enter**: Your Vercel frontend URL
3. **Generate**: Android package
4. **Download**: APK file
5. **Install**: On your phone
6. ✅ **Done!**

---

## 🎯 Quick Summary

### **Deploy Backend to Render**:
```
1. Push code to GitHub
2. Sign up on Render.com
3. New Web Service → Connect repo
4. Configure: Node, npm install, node server.js
5. Add JWT_SECRET environment variable
6. Deploy
7. Get backend URL
8. Add to Vercel as VITE_API_URL
9. Redeploy Vercel
10. Test login - should work!
```

**Total Time**: 15 minutes

---

## 🚀 Start Now

**Ready to deploy?**

1. **First**: Push to GitHub (if not already)
2. **Then**: Go to render.com
3. **Follow**: Steps above
4. **Get**: Backend URL
5. **Update**: Vercel frontend
6. **Test**: Everything works
7. **Generate**: APK!

---

**Created**: Complete deployment guide  
**Time Required**: 15 minutes  
**Difficulty**: Easy  
**Cost**: Free

**Let me know when you have your Render backend URL and I'll help connect it to Vercel!** 🎯


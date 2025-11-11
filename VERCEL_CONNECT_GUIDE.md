# 🔗 Connect Vercel Frontend to Backend

## ✅ Current Status

This guide helps you connect your deployed Vercel frontend to a backend API.

---

## 🔧 Update Vercel Environment Variables

### **Follow These Steps:**

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Select Your Project**
   - Click on "task-pilot" project

3. **Open Settings**
   - Click "Settings" in the top navigation bar

4. **Navigate to Environment Variables**
   - Click "Environment Variables" in the left sidebar

5. **Add New Variable**
   - Click the "Add New" button

6. **Fill in the Variable** ⚠️ IMPORTANT
   ```
   Name:  VITE_API_URL
   Value: <your-backend-url>
   ```
   
   **Make sure there are NO extra spaces or trailing slashes!**

7. **Save the Variable**
   - Click "Save"

8. **Redeploy the Frontend**
   - Go to "Deployments" tab (top navigation)
   - Find the latest deployment
   - Click the "..." (three dots) menu button
   - Click "Redeploy"
   - Click "Redeploy" again to confirm

9. **Wait for Deployment**
   - Takes 1-2 minutes
   - You'll see "Building..." → "Ready"

---

## ✅ Testing

### **Step 1: Test Backend Directly**

Open in browser:
```
<your-backend-url>/api
```

**Expected Result:**
```json
"Hello from the API!"
```

✅ If you see this, backend is working!

---

### **Step 2: Test Frontend**

Open your Vercel URL:
```
https://task-pilot-isu9v8fkk-aligndivine1-2188s-projects.vercel.app
```

**Try to Sign Up:**
1. Enter username
2. Enter password
3. Click "Sign Up"

**Expected Result:**
```
✅ Account created successfully!
✅ Redirected to dashboard
```

---

### **Step 3: Test Login**

1. Logout (if logged in)
2. Click "Login"
3. Enter credentials
4. Click "Login"

**Expected Result:**
```
✅ Logged in successfully!
✅ Dashboard loads with tasks
```

---

## 🐛 Troubleshooting

### **Error: 404 Not Found**

**Possible Causes:**
1. Backend not deployed
2. Environment variable typo in Vercel
3. Forgot to redeploy Vercel

**Solution:**
- Check backend is deployed and running
- Check Vercel environment variable - exact spelling?
- Did you redeploy Vercel after adding variable?

---

### **Error: CORS Policy Error**

**Possible Causes:**
1. Backend hasn't updated CORS settings
2. Using a different Vercel URL

**Solution:**
- Check your actual Vercel URL matches what's in server.js allowedOrigins
- Update server.js and redeploy backend

---

### **Error: 500 Internal Server Error**

**Possible Causes:**
1. JWT_SECRET not set on backend
2. Database issue

**Solution:**
- Check backend environment variables
- Check backend logs for errors

---

## 🎯 Quick Checklist

Before testing, make sure:

- [ ] Backend deployed and running
- [ ] Backend URL accessible
- [ ] Vercel environment variable added: `VITE_API_URL`
- [ ] Vercel redeployed after adding variable
- [ ] Both deployments completed (no "Building..." status)

---

## 📱 After Everything Works

### **Generate APK:**

1. Go to: https://www.pwabuilder.com
2. Enter: Your Vercel URL
3. Select: "Package For Stores"
4. Choose: Android
5. Download: APK file
6. Install: On your phone

---

## 💡 Pro Tips

### **Custom Domain (Optional)**

In Vercel:
1. Settings → Domains
2. Add your custom domain
3. Add domain to `allowedOrigins` in server.js
4. Redeploy backend

---

## 🎉 Success Criteria

You'll know everything is working when:

✅ Backend URL shows: "Hello from the API!"  
✅ Frontend loads without errors  
✅ Can sign up new account  
✅ Can login with credentials  
✅ Can create tasks  
✅ Can start/stop timer  
✅ Can create projects  
✅ All features work on deployed site  

---

## 🆘 Still Having Issues?

1. Check backend logs for errors
2. Check browser console (F12) for frontend errors
3. Verify environment variables are correct
4. Make sure both deployments completed
5. Try clearing browser cache


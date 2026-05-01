# 🔧 Fix: StackOverflow API Network Error

## Problem
You're seeing a **Network Error** when accessing the StackOverflow API features. This happens because:
- The **backend server is not running** on port 5000
- The frontend can't connect to the API endpoints

---

## ✅ Solution: Start the Backend Server

### Step 1: Open a New Terminal

Open a **new terminal window** (keep the frontend running in another terminal).

### Step 2: Start the Backend

```bash
# Navigate to server directory
cd server

# Start the backend
npm run dev
```

Expected output:
```
Server is running on port 5000
```

---

## 🔄 Terminal Setup (Recommended)

You should have **2 terminal windows open**:

### Terminal 1: Frontend (port 3001)
```bash
cd stack
npm run dev
# Output: Ready in 1.2s, CTRL+C to stop
```

### Terminal 2: Backend (port 5000)  
```bash
cd server
npm run dev
# Output: Server is running on port 5000
```

Both should be running simultaneously!

---

## 🧪 Test After Starting Backend

After starting the backend:

1. **Go to:** http://localhost:3001/stackoverflow
2. **You should see:**
   - ✅ API Status panel loads
   - ✅ No "Network Error" toast
   - ✅ Total questions, users, quota show up
3. **Try the tabs:**
   - Click "Trending" → See real SO questions
   - Click "Hot" → See featured questions
   - Click "Popular Tags" → See trending tags

---

## ⚠️ Common Issues & Fixes

### Issue: "Backend server not reachable on port 5000"

**Cause:** Backend isn't running

**Fix:**
```bash
# Terminal 2
cd server
npm run dev
```

Then try the page again.

---

### Issue: "Request timeout - Backend may not be running"

**Cause:** Backend started but is slow or crashed

**Fix:**
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# If it shows a PID, kill it
taskkill /PID <PID> /F

# Then restart backend
cd server
npm run dev
```

---

### Issue: "ERR_CONNECTION_REFUSED"

**Cause:** Backend is definitely not running

**Fix:**
```bash
# In your server terminal, type:
npm run dev

# Or if that fails, try:
node server-index.js
```

---

## 📋 Quick Checklist

```
Before using SO API features, verify:

☑️ Frontend running on port 3001
☑️ Backend running on port 5000
☑️ No "Connection refused" errors
☑️ .env file has API key configured
☑️ MongoDB is running (for seeding)
☑️ Both npm packages installed (npm install in both folders)
```

---

## 🎯 What Each Feature Needs

### Tag Autocomplete (/ask page)
- ✅ Backend must be running
- ✅ Only used when user types in tag field
- ✅ If backend down, just silently fails (doesn't break form)

### StackOverflow Showcase (/stackoverflow page)
- ✅ Backend must be running
- ✅ Shows error messages if backend not available
- ✅ Lets you know to start backend

### Search Enhancement
- ✅ Backend must be running
- ✅ If down, local search still works (just no SO API fallback)

---

## 🚀 Starting Both Servers (Quick Script)

### Create `start-dev.bat` (Windows)

```batch
@echo off
echo Starting Frontend and Backend...

REM Start frontend in one terminal
start "Frontend" cmd /k "cd stack && npm run dev"

REM Start backend in another terminal  
start "Backend" cmd /k "cd server && npm run dev"

echo Both servers should be starting...
echo Frontend: http://localhost:3001
echo Backend: https://stackoverflow-clone-6cll.onrender.com
```

Then just double-click `start-dev.bat` to start both!

---

## 📊 Port Reference

```
Frontend:  http://localhost:3001
Backend:   https://stackoverflow-clone-6cll.onrender.com
MongoDB:   mongodb://localhost:27017
```

Make sure nothing else is using these ports!

---

## ✅ Verify Everything Works

```bash
# Test frontend is running
curl http://localhost:3001

# Test backend is running
curl https://stackoverflow-clone-6cll.onrender.com/stackoverflow/status

# Both should return responses (not "Connection refused")
```

---

## 🎊 After Backend Starts

1. **Try the StackOverflow page:** http://localhost:3001/stackoverflow
2. **Try asking a question:** http://localhost:3001/ask (type a tag, see suggestions!)
3. **Try searching:** http://localhost:3001 (search returns SO results too!)

---

## 📞 If Issues Persist

1. **Check backend logs** - Look at the terminal where backend is running
2. **Check browser console** - Open DevTools (F12) and look at errors
3. **Verify ports:**
   - Frontend: `netstat -ano | findstr :3001`
   - Backend: `netstat -ano | findstr :5000`
4. **Restart everything:**
   - Kill both terminals (CTRL+C)
   - Wait 2 seconds
   - Start backend first: `cd server && npm run dev`
   - Then start frontend: `cd stack && npm run dev`

---

## 🎯 Summary

| Component | Port | Command | Status |
|-----------|------|---------|--------|
| Frontend | 3001 | `npm run dev` (in /stack) | ✅ Running |
| Backend | 5000 | `npm run dev` (in /server) | ❌ **Start this!** |
| MongoDB | 27017 | (auto if running) | ✅ Optional |

**The Network Error will go away once you start the backend!**


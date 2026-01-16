# 🎯 START HERE - Get Your App Running in 5 Minutes!

## Quick Setup (Copy & Paste These Commands)

### Step 1: Backend (Terminal 1)

```bash
cd backend
npm install
```

Create `.env` file in backend directory with this content:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/safestay
JWT_SECRET=change_this_to_random_string_min_32_chars
FRONTEND_URL=http://localhost:3000
```

Then start backend:
```bash
npm start
```

✅ Backend running on http://localhost:5000

---

### Step 2: Frontend (Terminal 2 - NEW Terminal!)

```bash
cd frontend
npm install
```

Create `.env` file in frontend directory with this content:
```env
REACT_APP_API_URL=http://localhost:5000
```

Then start frontend:
```bash
npm start
```

✅ Frontend running on http://localhost:3000

---

### Step 3: Test It!

1. Open http://localhost:3000 in your browser
2. Click "Register"
3. Create a test account
4. You're in! 🎉

---

## That's It! You're Done! 

For detailed instructions, see: **`QUICK_START_GUIDE.md`**

For troubleshooting, see: **`QUICK_START_GUIDE.md`** (Troubleshooting section)


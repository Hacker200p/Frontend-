# MongoDB Setup Guide

## You Need MongoDB Running

The backend requires a MongoDB database. You have three options:

### Option 1: Install Local MongoDB (Recommended)

#### Windows:
1. Download MongoDB from: https://www.mongodb.com/try/download/community
2. Install it
3. Make sure MongoDB service is running

#### Mac (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux:
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 2: Use MongoDB Atlas (Cloud - Easiest!)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a free cluster
4. Get your connection string
5. Update `.env` file in backend:
```env
MONGO_URI=your_atlas_connection_string_here
```

### Option 3: Quick Test with Docker

If you have Docker installed:
```bash
docker run --name mongodb -d -p 27017:27017 mongo
```

---

## After MongoDB is Running

Restart your backend:
```bash
cd backend
npm start
```

You should see:
```
MongoDB Connected: localhost
Server running in development mode on port 5000
```

---

## Verify MongoDB is Running

### Check if MongoDB service is running:
```bash
# Windows
net start MongoDB

# Mac/Linux
brew services list | grep mongodb
```

### Test MongoDB connection:
```bash
mongo
# or
mongosh
```

If you can connect, MongoDB is running! ✅

---

## Need Help?

If you see "MongoDB connection error", make sure:
1. MongoDB service is running
2. The connection string in `.env` is correct
3. No firewall blocking port 27017


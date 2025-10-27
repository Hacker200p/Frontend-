# JWT Token Fix Summary

## Problem
Getting error when registering: `"expiresIn" should be a number of seconds or string representing a timespan`

## Root Cause
The `generateToken.js` file was trying to use `process.env.JWT_EXPIRE` which wasn't set in the `.env` file, causing it to be `undefined`.

## Solution Applied

### 1. Updated `backend/utils/generateToken.js`
Added a default value:
```javascript
// Before:
expiresIn: process.env.JWT_EXPIRE,

// After:
expiresIn: process.env.JWT_EXPIRE || '30d',
```

### 2. Added to `.env` file
```env
JWT_EXPIRE=30d
```

## Result
✅ JWT tokens will now have a 30-day expiration
✅ Registration and login should work without errors
✅ Default value prevents undefined errors

## Next Steps
1. **Restart the backend server** (if it's still running)
2. **Try registering again** from the frontend
3. It should work now! 🎉

## Token Expiration Options
You can change `JWT_EXPIRE` to any of these formats:
- `'30d'` - 30 days (current)
- `'7d'` - 7 days
- `'24h'` - 24 hours
- `'3600'` - 3600 seconds (1 hour)
- `'1h'` - 1 hour


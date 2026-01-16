# 🚀 Frontend Integration Guide

This guide will help you set up and run the complete SafeStay Hub application with both frontend and backend integrated.

## Project Structure

```
hackathon/
├── backend/              # Node.js/Express backend
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── ...
├── frontend/            # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
└── FRONTEND_INTEGRATION_GUIDE.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (locally or cloud instance)
- npm or yarn

## Quick Start

### Step 1: Set Up Backend

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:3000

# Optional: Configure these services
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

4. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Step 2: Set Up Frontend

1. Open a new terminal and navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000
```

4. Start the frontend development server:
```bash
npm start
```

The frontend will open automatically in your browser at `http://localhost:3000`

## Features

### 👤 Tenant Features
- Search hostels by location, type, and price range
- View hostel details with photos and amenities
- Track personal expenses
- View and manage contracts
- Order from canteen
- Real-time order updates with Socket.IO

### 🏢 Owner Features
- Create and manage hostels
- Add rooms with pricing
- Upload hostel photos and videos
- View hostel performance
- Manage room availability

### 🍽️ Canteen Provider Features
- Create and manage canteens
- Add/update menu items
- View and process orders
- Update order status in real-time
- Track order history

### 👨‍💼 Admin Features
- Manage all users
- Verify and approve hostels
- View system statistics
- Monitor platform activity
- Activate/deactivate users

## Testing the Integration

### 1. Health Check
- Backend API: `http://localhost:5000/api/health`
- Frontend should automatically connect to the backend

### 2. Create Test Accounts

You can create different role accounts through the registration page:

**Tenant:**
- Email: tenant@test.com
- Password: password123
- Role: Tenant

**Owner:**
- Email: owner@test.com
- Password: password123
- Role: Owner

**Canteen Provider:**
- Email: provider@test.com
- Password: password123
- Role: Canteen Provider

**Admin:**
- Email: admin@test.com
- Password: password123
- Role: Admin

### 3. Test the Features

1. **Login** with different role accounts
2. **Navigate** to role-specific dashboards
3. **Create** hostels (as owner)
4. **Search** hostels (as tenant)
5. **Process** orders (as canteen provider)
6. **Manage** users (as admin)

## API Endpoints

All API endpoints are configured in `frontend/src/services/api.js`:

- **Auth API**: `/api/auth/*`
- **Tenant API**: `/api/tenant/*`
- **Owner API**: `/api/owner/*`
- **Canteen API**: `/api/canteen/*`
- **Admin API**: `/api/admin/*`

## Troubleshooting

### Backend not starting?
- Check if MongoDB is running
- Verify `.env` file has correct values
- Ensure port 5000 is not in use

### Frontend not connecting to backend?
- Check if backend is running on port 5000
- Verify `REACT_APP_API_URL` in frontend `.env` file
- Check browser console for CORS errors (backend should handle this automatically)

### Build errors?
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (should be v14+)

## Development Tips

1. **Auto-reload**: Use `npm run dev` for backend auto-reload on file changes
2. **Hot reload**: React automatically reloads on frontend changes
3. **Console logs**: Check browser console and terminal for errors
4. **Network tab**: Use browser DevTools Network tab to debug API calls

## Production Build

### Backend
```bash
# No build needed, just start the server
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build

# Deploy the 'build' folder to your hosting service
```

## Architecture

- **Frontend**: React SPA with React Router, Context API, and Axios
- **Backend**: Express.js RESTful API with MongoDB
- **Real-time**: Socket.IO for order updates
- **Authentication**: JWT tokens stored in localStorage
- **Styling**: Tailwind CSS for responsive design

## Support

For issues or questions:
1. Check the README files in both backend and frontend directories
2. Review API documentation in `backend/API_TESTING_GUIDE.md`
3. Check browser console and terminal logs for errors

## Next Steps

1. Configure cloud storage (Cloudinary) for image uploads
2. Set up Razorpay for payment processing
3. Configure Twilio for SMS notifications
4. Add more features based on requirements
5. Deploy to production

Happy coding! 🎉


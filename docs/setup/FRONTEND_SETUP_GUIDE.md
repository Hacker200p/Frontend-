# SafeStay Hub - Frontend Setup Guide

## 🚀 Quick Start

This is a complete fresh frontend built with React + Vite according to the design specifications in `design.txt` and `css.txt`.

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend running on `http://localhost:5000`

### Installation Steps

#### 1. Install Dependencies

```bash
cd frontend
npm install
```

This installs:
- React 18
- Vite (Lightning-fast build tool)
- Tailwind CSS (Utility-first CSS framework)
- Zustand (State management)
- Framer Motion (Animations)
- Recharts (Charts/graphs)
- Axios (HTTP client)
- React Router (Routing)

#### 2. Create Environment File

```bash
cp .env.example .env.local
```

Edit `.env.local` to match your backend URL:
```
VITE_API_URL=http://localhost:5000
```

#### 3. Start Development Server

```bash
npm run dev
```

✅ Frontend will be available at `http://localhost:3000`

#### 4. Backend Connection

The frontend automatically proxies API calls to `http://localhost:5000/api` (configured in `vite.config.js`)

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html          # Main HTML file
├── src/
│   ├── pages/              # Page components
│   │   ├── Home.jsx        # Landing page (public)
│   │   ├── Login.jsx       # Login page (public)
│   │   ├── Register.jsx    # Registration with OTP (public)
│   │   ├── Dashboard.jsx   # Main dashboard (protected)
│   │   ├── tenant/
│   │   │   └── TenantDashboard.jsx
│   │   ├── owner/
│   │   │   └── OwnerDashboard.jsx
│   │   ├── canteen/
│   │   │   └── CanteenDashboard.jsx
│   │   └── admin/
│   │       └── AdminDashboard.jsx
│   ├── components/         # Reusable components
│   │   └── ProtectedRoute.jsx
│   ├── services/           # API integration
│   │   └── api.js
│   ├── store/              # State management
│   │   └── authStore.js
│   ├── App.jsx             # Main app component
│   ├── index.jsx           # Entry point
│   └── index.css           # Global styles
├── tailwind.config.js      # Tailwind CSS config
├── postcss.config.js       # PostCSS config
├── vite.config.js          # Vite config with proxy
├── package.json
├── .gitignore
├── .env.example
└── README.md
```

---

## 🎨 Design System

### Color Palette
From `css.txt`:
- **Primary**: `#2563EB` (Blue) - Main buttons, links
- **Accent**: `#F97316` (Orange) - Call-to-action buttons
- **Background**: `#F9FAFB` (Light gray) - Page background
- **Text Dark**: `#111827` - Headings, body text
- **Text Muted**: `#6B7280` - Secondary text
- **Success**: `#22C55E` (Green) - Positive actions
- **Danger**: `#EF4444` (Red) - Destructive actions

### Typography
- **Font Family**: Inter, Poppins, sans-serif
- **Headings**: 700 weight (bold)
- **Body**: 400 weight (regular)
- **Line Height**: 1.5

### Component Classes
Pre-built Tailwind classes available:
```css
.btn-primary    /* Blue button */
.btn-accent     /* Orange button */
.btn-secondary  /* Gray button */
.input          /* Form input field */
.card           /* White card with shadow */
.filter-bar     /* Filter controls container */
.hostel-card    /* Hostel listing card */
.amenity-badge  /* Small badge for amenities */
.booking-card   /* Booking information card */
.sos-button     /* Emergency button */
.stats-card     /* Statistics display card */
.chart          /* Chart container */
.orders-card    /* Order display card */
.menu-item      /* Menu item card */
.approve-btn    /* Green approval button */
.reject-btn     /* Red rejection button */
.upload-btn     /* File upload button */
```

---

## 📄 Pages Overview

### 🏠 Home Page (/)
- Header with navigation
- Hero section with search bar
- Features showcase (6 cards)
- AR/360° tour preview
- Testimonials section
- Call-to-action section
- Footer with links

### 🔐 Login Page (/login)
- Email input
- Password input
- Login button
- Link to register

### 📝 Register Page (/register)
**Two-step process:**
1. **Step 1**: Registration form
   - Full name
   - Email
   - Phone number
   - User role selector (Tenant/Owner/Provider)
   - Password & confirmation
   
2. **Step 2**: OTP Verification
   - 6-digit OTP input
   - Resend OTP button
   - Back button to form

### 📊 Tenant Dashboard (/tenant/*)
- **Sidebar Menu**: Dashboard, My Hostel, Canteen & Food, Contracts, Expenses, Feedback, Payments, Settings
- **Overview Tab**: Hostel info, expenses, ratings, quick actions, notifications, SOS button

### 🏢 Owner Dashboard (/owner/*)
- **Sidebar Menu**: Dashboard, My Hostels, Create Hostel, Tenant Management, Upload Media, Feedback, Profile
- **Overview Tab**: Active hostels, available rooms, pending verifications, quick actions

### 🍽️ Canteen Dashboard (/canteen/*)
- **Sidebar Menu**: Dashboard, Orders, Tenant Preferences, Delivery Coordination, Menu Management, Feedback, Settings
- **Overview Tab**: KPIs (orders, active tenants, ratings, pending deliveries), quick actions
- **Orders Tab**: Order management table with accept/reject actions
- **Menu Tab**: Menu item cards with edit buttons

### 👨‍💼 Admin Dashboard (/admin/*)
- **Sidebar Menu**: Dashboard, Users, Hostels, Verifications, Statistics, Reports, Settings
- **Overview Tab**: Total users, active hostels, pending verifications, revenue, quick actions
- **Users Tab**: User management table
- **Verifications Tab**: Pending hostel verifications with approve/reject actions

---

## 🔗 API Integration

### Authentication Flow

**1. Register with OTP**
```
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "password": "securepass123",
  "userRole": "tenant"
}
Response: { message: "OTP sent to phone" }
```

**2. Verify OTP**
```
POST /api/auth/verify-otp
{
  "email": "john@example.com",
  "otp": "123456"
}
Response: { token: "jwt_token", user: {...} }
```

**3. Login**
```
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepass123"
}
Response: { token: "jwt_token", user: {...} }
```

### State Management

The `authStore` (Zustand) handles:
- User authentication
- Token management
- Login/register/logout flows
- OTP verification
- Error handling

### Protected Routes

Routes automatically check authentication:
```jsx
<Route path="/tenant/*" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
```

Non-authenticated users redirect to `/login`

---

## 🛠️ Build & Deployment

### Development Build
```bash
npm run dev      # Start dev server (http://localhost:3000)
```

### Production Build
```bash
npm run build    # Create optimized build in dist/
npm run preview  # Preview production build locally
```

### Deploy to Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## 📝 Environment Variables

Create `.env.local`:
```
VITE_API_URL=http://localhost:5000
```

For production:
```
VITE_API_URL=https://api.safestay-hub.com
```

---

## 🧪 Testing the Frontend

### 1. Test Registration with OTP
1. Go to `http://localhost:3000/register`
2. Fill in all fields
3. Click "Continue to OTP"
4. Check backend console for OTP (formatted box output)
5. Enter OTP and verify

### 2. Test Login
1. Go to `http://localhost:3000/login`
2. Enter credentials
3. Should redirect to dashboard based on role

### 3. Test Dashboard Navigation
- Each role has unique sidebar menu
- Buttons are functional templates (content coming soon)

---

## 🐛 Common Issues

### Port 3000 Already in Use
```bash
# Kill process on port 3000
# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Or change port in vite.config.js:
server: { port: 3001 }
```

### Tailwind CSS Not Compiling
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run dev
```

### API Connection Refused
- Ensure backend running on port 5000
- Check `VITE_API_URL` in `.env.local`
- Verify CORS enabled in backend

### Token Not Persisting
- Token automatically stored in localStorage
- Clear browser cache if needed
- Check browser DevTools → Application → Local Storage

---

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Framer Motion Documentation](https://www.framer.com/motion)

---

## ✅ Checklist Before Production

- [ ] Environment variables configured
- [ ] Backend API running and accessible
- [ ] CORS enabled on backend
- [ ] Test all authentication flows
- [ ] Test all dashboard pages
- [ ] Run `npm run build` successfully
- [ ] Test production build locally with `npm run preview`
- [ ] Deploy to hosting platform
- [ ] Test in production environment

---

## 🎯 Next Steps

1. **Install dependencies**: `npm install`
2. **Start development server**: `npm run dev`
3. **Open browser**: `http://localhost:3000`
4. **Test registration**: Use home page "Register" button
5. **Customize**: Update colors, content, and features as needed

---

For more information, see `README.md` in the frontend directory.

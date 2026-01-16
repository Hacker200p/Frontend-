# 🎯 Frontend Directory Structure & File Guide

## Complete File Tree

```
frontend/
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitignore                   # Git ignore rules
├── 📄 package.json                 # Dependencies & scripts
├── 📄 vite.config.js               # Vite configuration with API proxy
├── 📄 tailwind.config.js           # Tailwind CSS design system
├── 📄 postcss.config.js            # PostCSS configuration
├── 📄 README.md                    # Frontend documentation
│
├── 📁 public/
│   └── 📄 index.html               # Main HTML file (app mount point)
│
└── 📁 src/
    ├── 📄 index.jsx                # React entry point (renders App in #root)
    ├── 📄 index.css                # Global styles + Tailwind directives
    ├── 📄 App.jsx                  # Main app component with routing
    │
    ├── 📁 pages/
    │   ├── 📄 Home.jsx             # Landing page (public)
    │   ├── 📄 Login.jsx            # Login page (public)
    │   ├── 📄 Register.jsx         # Registration with OTP (public)
    │   ├── 📄 Dashboard.jsx        # Role-based redirector (protected)
    │   │
    │   ├── 📁 tenant/
    │   │   └── 📄 TenantDashboard.jsx          # Tenant portal
    │   │
    │   ├── 📁 owner/
    │   │   └── 📄 OwnerDashboard.jsx           # Hostel owner portal
    │   │
    │   ├── 📁 canteen/
    │   │   └── 📄 CanteenDashboard.jsx         # Canteen provider portal
    │   │
    │   └── 📁 admin/
    │       └── 📄 AdminDashboard.jsx           # Admin portal
    │
    ├── 📁 components/
    │   └── 📄 ProtectedRoute.jsx   # Route authentication guard
    │
    ├── 📁 services/
    │   └── 📄 api.js               # Axios setup + all API endpoints
    │
    └── 📁 store/
        └── 📄 authStore.js         # Zustand authentication state management
```

---

## 📄 File Descriptions

### Configuration Files

#### `package.json`
- Project metadata and dependencies
- Scripts: `npm run dev`, `npm run build`, `npm run preview`
- All required packages: React, Vite, Tailwind, etc.

#### `vite.config.js`
- Vite build configuration
- API proxy: Frontend requests to `/api/*` are proxied to backend
- Dev server on port 3000

#### `tailwind.config.js`
- Design system colors (primary, accent, etc.)
- Custom spacing grid (8px system)
- Border radius configurations

#### `postcss.config.js`
- Tailwind CSS and Autoprefixer plugins

#### `.env.example`
```
VITE_API_URL=http://localhost:5000
```
Copy to `.env.local` and customize

#### `.gitignore`
Ignores: `node_modules/`, `dist/`, `.env.local`, etc.

---

### Core Application Files

#### `public/index.html`
```html
<div id="root"></div>  <!-- React mounts here -->
```
- Main HTML file
- Meta tags for responsive design
- Script tag loads src/index.jsx

#### `src/index.jsx`
```javascript
import App from './App'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```
- React entry point
- Mounts App component to #root

#### `src/App.jsx`
```javascript
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/tenant/*" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
  ...
</Routes>
```
- Main app component
- React Router setup
- Route definitions (public + protected)

#### `src/index.css`
- `@tailwind` directives (base, components, utilities)
- Custom CSS classes (`.btn-primary`, `.card`, etc.)
- Global styles and scrollbar styling

---

### Page Components (`src/pages/`)

#### `Home.jsx` (Public)
**Features:**
- Header with logo and navigation
- Hero section with title and search bar
- 6 feature cards (Police-verified, SOS, Contracts, AR Tours, Food, Support)
- AR/360° tour preview section
- 3 testimonial cards with ratings
- CTA section and footer

**Route:** `/`

#### `Login.jsx` (Public)
**Features:**
- Email input
- Password input
- Login button
- Error display
- Link to register page
- Loading state

**Route:** `/login`

#### `Register.jsx` (Public)
**Two-Step Registration:**

**Step 1:** Registration Form
- Name, Email, Phone, Role selector
- Password & confirm password
- Form validation
- Continue button

**Step 2:** OTP Verification
- 6-digit OTP input (numeric only)
- Error display
- Verify button
- Resend OTP button
- Back to form link

**Route:** `/register`

#### `Dashboard.jsx` (Protected)
**Features:**
- Welcome message with user info
- Redirect button to role-specific dashboard
- Logout button

**Route:** `/dashboard`

#### `tenant/TenantDashboard.jsx` (Protected)
**Sidebar Menu:**
- Dashboard, My Hostel, Canteen & Food, Contracts, Expenses, Feedback, Payments, Settings

**Overview Tab:**
- 3 stats cards (Hostel, Canteen Expenses, Rating)
- Quick actions (Order Food, View Contracts, Submit Feedback)
- Notifications section
- Emergency SOS button

**Route:** `/tenant/*`

#### `owner/OwnerDashboard.jsx` (Protected)
**Sidebar Menu:**
- Dashboard, My Hostels, Create Hostel, Tenant Management, Upload Media, Feedback, Profile

**Overview Tab:**
- 4 stats cards (Active Hostels, Available Rooms, Pending Verifications, Tenant Requests)
- Quick action buttons
- Activity chart area

**Create Hostel Tab:**
- Hostel name, location, number of rooms
- Price per month input
- Gender selector
- Contact number
- Description textarea

**Route:** `/owner/*`

#### `canteen/CanteenDashboard.jsx` (Protected)
**Sidebar Menu:**
- Dashboard, Orders, Tenant Preferences, Delivery, Menu, Feedback, Settings

**Overview Tab:**
- 4 KPI cards (Orders Today, Active Tenants, Rating, Pending Deliveries)
- Quick action buttons
- Sales chart area

**Orders Tab:**
- Table: Order ID, Tenant, Items, Status, Accept/Reject buttons

**Menu Tab:**
- Menu item cards (Name, Price, Edit button)
- Add New Item button

**Route:** `/canteen/*`

#### `admin/AdminDashboard.jsx` (Protected)
**Sidebar Menu:**
- Dashboard, Users, Hostels, Verifications, Statistics, Reports, Settings

**Overview Tab:**
- 4 KPI cards (Total Users, Active Hostels, Pending Verifications, Total Revenue)
- Quick action buttons
- System overview chart

**Users Tab:**
- Table: Name, Email, Role, Status, Actions

**Verifications Tab:**
- Hostel verification cards
- Approve/Reject buttons

**Route:** `/admin/*`

---

### Components (`src/components/`)

#### `ProtectedRoute.jsx`
```javascript
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}
```
- Guards protected routes
- Redirects unauthenticated users to `/login`
- Used for all dashboard routes

---

### Services (`src/services/`)

#### `api.js`
**Axios Setup:**
- Base URL: `/api` (proxied to backend)
- Request interceptor: Adds JWT token to headers
- Response interceptor: Handles 401 errors

**API Endpoints:**
```javascript
authAPI.register(data)
authAPI.verifyOTP(data)
authAPI.resendOTP(email)
authAPI.login(credentials)
hostelAPI.search(params)
hostelAPI.create(data)
canteenAPI.createOrder(data)
canteenAPI.verifyPayment(data)
contractAPI.getContracts()
expenseAPI.getExpenses()
```

---

### State Management (`src/store/`)

#### `authStore.js` (Zustand)
**State:**
- `user` - Current user object
- `token` - JWT token
- `isAuthenticated` - Auth status
- `loading` - Loading state
- `error` - Error messages

**Methods:**
```javascript
login(credentials)           // Email/password login
register(userData)           // Create account
verifyOTP(otpData)          // Verify OTP + get token
resendOTP(email)            // Request new OTP
logout()                    // Clear auth state
setUser(user)               // Update user
setToken(token)             // Update token
clearError()                // Clear error message
```

**Persistence:**
- Token & user automatically saved to localStorage
- Automatically restored on page reload

---

## 🔗 Navigation Flow

```
Landing Page (Home.jsx)
├─ [Login] → Login.jsx → Dashboard.jsx → Role Dashboard
├─ [Register] → Register.jsx (2-step) → Dashboard.jsx → Role Dashboard
│   └─ Step 1: Form → Step 2: OTP → Login Redirect
└─ [Already Member] → Login.jsx

Protected Dashboards:
├─ Tenant (/tenant) → TenantDashboard.jsx
├─ Owner (/owner) → OwnerDashboard.jsx
├─ Canteen (/canteen) → CanteenDashboard.jsx
└─ Admin (/admin) → AdminDashboard.jsx

Protected Routes:
└─ Any protected route → ProtectedRoute → Check auth → Redirect if needed
```

---

## 📊 Component Dependencies

```
App.jsx (Main)
├── Home.jsx (public)
├── Login.jsx (public)
│   └── useAuthStore (login)
├── Register.jsx (public)
│   └── useAuthStore (register, verifyOTP, resendOTP)
├── Dashboard.jsx (protected)
│   ├── useAuthStore (user, logout)
│   └── ProtectedRoute
├── ProtectedRoute
│   ├── useAuthStore (isAuthenticated)
│   └── Tenant/Owner/Canteen/AdminDashboard
└── All Dashboards
    ├── useAuthStore (user, logout)
    ├── useNavigate
    └── Zustand store for UI state
```

---

## 🎨 Styling Architecture

### `tailwind.config.js`
- Colors: `primary`, `accent`, `background`, `text-dark`, `text-muted`
- Spacing: 8px grid system
- Border radius: Predefined values

### `index.css`
- Tailwind directives (`@tailwind`)
- Component classes (`.btn-primary`, `.card`, etc.)
- Global styles (scrollbar, fonts)

### Usage in Components
```jsx
<button className="btn-primary">Click</button>
<div className="card">Content</div>
<input className="input" />
```

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.2.0 | UI framework |
| react-dom | 18.2.0 | React DOM rendering |
| react-router-dom | 6.20.0 | Routing |
| vite | 5.0.0 | Build tool |
| tailwindcss | 3.3.6 | CSS framework |
| zustand | 4.4.1 | State management |
| axios | 1.6.2 | HTTP client |
| framer-motion | 10.16.4 | Animations |
| recharts | 2.10.3 | Charts |

---

## 🚀 How to Use

### 1. Start Development
```bash
npm install          # Install all dependencies
npm run dev          # Start dev server (port 3000)
```

### 2. Build for Production
```bash
npm run build        # Create optimized dist/
npm run preview      # Preview production build
```

### 3. Deploy
```bash
# Vercel
vercel

# Netlify
netlify deploy --prod --dir=dist
```

---

## 💡 Tips

1. **Hot Module Replacement**: Changes auto-reflect without refresh
2. **Debug API**: Check Network tab in DevTools (F12)
3. **Check Auth**: Open DevTools → Application → Local Storage → token
4. **Custom CSS**: Add to `src/index.css`, use class names
5. **Add Pages**: Create in `src/pages/`, import in `App.jsx`
6. **Add Routes**: Define in `App.jsx` `<Routes>`
7. **State**: Use `useAuthStore()` to access user data

---

**Ready to develop! Happy coding! 🎉**

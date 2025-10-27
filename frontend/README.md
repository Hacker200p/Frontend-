# SafeStay Hub - Frontend

A modern React frontend application integrated with the SafeStay Hub backend API.

## Features

- 🔐 Authentication & Authorization (Login/Register)
- 🏠 Role-based dashboards (Tenant, Owner, Canteen Provider, Admin)
- 📱 Hostel search and management
- 💰 Expense tracking
- 📄 Contract management
- 🍽️ Canteen ordering system
- 👥 User administration
- 📊 Admin statistics dashboard

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Backend server running on port 5000

### Installation

1. Navigate to the frontend directory:
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

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Available Roles

### Tenant
- Search and browse hostels
- View hostel details
- Track expenses
- Manage contracts
- Order from canteen

### Owner
- Create and manage hostels
- Add rooms to hostels
- Upload hostel photos
- View and manage hostel listings

### Canteen Provider
- Create canteens
- Manage menu items
- View and process orders
- Update order status

### Admin
- Manage all users
- Verify hostels
- View system statistics
- Monitor platform activity

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout.js
│   │   └── ProtectedRoute.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Dashboard.js
│   │   ├── tenant/
│   │   │   ├── TenantDashboard.js
│   │   │   ├── SearchHostels.js
│   │   │   ├── MyExpenses.js
│   │   │   ├── MyContracts.js
│   │   │   └── MyOrders.js
│   │   ├── owner/
│   │   │   ├── OwnerDashboard.js
│   │   │   ├── MyHostels.js
│   │   │   └── CreateHostel.js
│   │   ├── provider/
│   │   │   ├── ProviderDashboard.js
│   │   │   ├── MyCanteens.js
│   │   │   └── Orders.js
│   │   └── admin/
│   │       ├── AdminDashboard.js
│   │       ├── Users.js
│   │       ├── Hostels.js
│   │       └── Stats.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── README.md
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Technologies Used

- React 18
- React Router DOM
- Axios
- Socket.IO Client
- React Icons
- React Hot Toast
- Tailwind CSS

## Backend Integration

The frontend integrates with the backend API running on `http://localhost:5000` by default. Ensure the backend is running before starting the frontend.

All API endpoints are configured in `src/services/api.js`:
- Authentication API
- Tenant API
- Owner API
- Canteen API
- Admin API

## Building for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files ready to be deployed.

## License

MIT


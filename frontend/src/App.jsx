import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import Loading from './components/common/Loading'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const TenantDashboard = lazy(() => import('./pages/tenant/TenantDashboard'))
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'))
const CanteenDashboard = lazy(() => import('./pages/canteen/CanteenDashboard'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<Loading fullScreen message="Loading page..." />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tenant/*" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
            <Route path="/owner/*" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/canteen/*" element={<ProtectedRoute><CanteenDashboard /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  )
}

export default App

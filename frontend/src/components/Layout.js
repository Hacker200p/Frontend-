import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'tenant': return 'bg-blue-100 text-blue-800';
      case 'owner': return 'bg-green-100 text-green-800';
      case 'canteen_provider': return 'bg-purple-100 text-purple-800';
      case 'master_admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'tenant': return 'Tenant';
      case 'owner': return 'Owner';
      case 'canteen_provider': return 'Canteen Provider';
      case 'master_admin': return 'Admin';
      default: return 'User';
    }
  };

  const getNavigationLinks = () => {
    switch (user?.role) {
      case 'tenant':
        return [
          { to: '/tenant/search', label: 'Search Hostels' },
          { to: '/tenant/expenses', label: 'My Expenses' },
          { to: '/tenant/contracts', label: 'My Contracts' },
          { to: '/tenant/orders', label: 'My Orders' },
        ];
      case 'owner':
        return [
          { to: '/owner/hostels', label: 'My Hostels' },
          { to: '/owner/create-hostel', label: 'Create Hostel' },
        ];
      case 'canteen_provider':
        return [
          { to: '/provider/canteens', label: 'My Canteens' },
          { to: '/provider/orders', label: 'Orders' },
        ];
      case 'master_admin':
        return [
          { to: '/admin/users', label: 'Users' },
          { to: '/admin/hostels', label: 'Hostels' },
          { to: '/admin/stats', label: 'Statistics' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-2xl font-bold text-blue-600">
                SafeStay Hub
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                {getNavigationLinks().map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FiUser className="text-gray-600" />
                <span className="text-gray-700 text-sm font-medium">{user?.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user?.role)}`}>
                  {getRoleName(user?.role)}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 rounded-md hover:bg-gray-100"
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;


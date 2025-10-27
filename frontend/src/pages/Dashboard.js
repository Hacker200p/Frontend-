import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiShoppingCart, FiBriefcase, FiShield } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user?.role === 'tenant') {
      navigate('/tenant', { replace: true });
    } else if (user?.role === 'owner') {
      navigate('/owner', { replace: true });
    } else if (user?.role === 'canteen_provider') {
      navigate('/provider', { replace: true });
    } else if (user?.role === 'master_admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const getRoleInfo = () => {
    switch (user?.role) {
      case 'tenant':
        return {
          title: 'Tenant Dashboard',
          icon: <FiHome className="text-blue-600" />,
          color: 'bg-blue-600',
          description: 'Search hostels, manage expenses, and more',
        };
      case 'owner':
        return {
          title: 'Owner Dashboard',
          icon: <FiBriefcase className="text-green-600" />,
          color: 'bg-green-600',
          description: 'Manage your hostels and rooms',
        };
      case 'canteen_provider':
        return {
          title: 'Canteen Provider Dashboard',
          icon: <FiShoppingCart className="text-purple-600" />,
          color: 'bg-purple-600',
          description: 'Manage canteens and orders',
        };
      case 'master_admin':
        return {
          title: 'Admin Dashboard',
          icon: <FiShield className="text-red-600" />,
          color: 'bg-red-600',
          description: 'Manage users and system',
        };
      default:
        return {
          title: 'Dashboard',
          icon: <FiHome />,
          color: 'bg-gray-600',
          description: 'Welcome to SafeStay Hub',
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className={`text-4xl ${roleInfo.color} text-white p-4 rounded-lg`}>
            {roleInfo.icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{roleInfo.title}</h1>
            <p className="text-gray-600">{roleInfo.description}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


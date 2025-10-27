import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FiUsers, FiHome, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <FiUsers className="text-4xl" />,
      color: 'bg-blue-600',
    },
    {
      title: 'Total Hostels',
      value: stats?.totalHostels || 0,
      icon: <FiHome className="text-4xl" />,
      color: 'bg-green-600',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: <FiShoppingBag className="text-4xl" />,
      color: 'bg-purple-600',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats?.totalRevenue || 0}`,
      icon: <FiDollarSign className="text-4xl" />,
      color: 'bg-yellow-600',
    },
  ];

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Statistics</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} text-white p-3 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-2">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-2">
              <p className="text-gray-600">Active Users: {stats.activeUsers || 0}</p>
              <p className="text-gray-600">Pending Hostels: {stats.pendingHostels || 0}</p>
              <p className="text-gray-600">Completed Orders: {stats.completedOrders || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-2">
              <p className="text-gray-600">Verified Hostels: {stats.verifiedHostels || 0}</p>
              <p className="text-gray-600">Pending Orders: {stats.pendingOrders || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;


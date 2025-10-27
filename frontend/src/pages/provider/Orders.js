import React, { useState, useEffect } from 'react';
import { canteenAPI } from '../../services/api';
import { FiShoppingBag, FiCheck, FiClock, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
  const response = await canteenAPI.getProviderOrders();
  // API returns { success: true, data: orders }
  // Ensure we set the actual array and fall back to an empty array
  // so `.map` is always called on an array.
  setOrders(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await canteenAPI.updateOrderStatus(orderId, status);
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      placed: { bg: 'bg-blue-100', text: 'text-blue-800' },
      prepared: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    };

    const colors = statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
      <span className={`px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-sm font-semibold`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FiShoppingBag className="mx-auto text-6xl text-gray-400 mb-4" />
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Order #{order._id.slice(-6)}</h3>
                  <p className="text-gray-600">{order.customerName}</p>
                  <p className="text-gray-600">Date: {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.status)}
                  <p className="text-2xl font-bold text-gray-800 mt-2">₹{order.totalAmount}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 mb-4">
                <h4 className="font-semibold mb-2">Items:</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span className="font-semibold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.status === 'placed' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateOrderStatus(order._id, 'prepared')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <FiCheck />
                    <span>Mark as Prepared</span>
                  </button>
                </div>
              )}

              {order.status === 'prepared' && (
                <button
                  onClick={() => updateOrderStatus(order._id, 'delivered')}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <FiCheck />
                  <span>Mark as Delivered</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;


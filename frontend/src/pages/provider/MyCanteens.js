import React, { useState, useEffect } from 'react';
import { canteenAPI } from '../../services/api';
import { FiShoppingBag, FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyCanteens = () => {
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCanteens();
  }, []);

  const fetchCanteens = async () => {
    setLoading(true);
    try {
  const response = await canteenAPI.getMyCanteens();
  // API returns { success: true, data: canteens }
  // Ensure we set the actual array and fall back to an empty array
  // so `.map` is always called on an array.
  setCanteens(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch canteens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">My Canteens</h1>
          <Link
            to="/provider/create-canteen"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <FiPlus />
            <span>Create Canteen</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Loading canteens...</p>
        </div>
      ) : canteens.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FiShoppingBag className="mx-auto text-6xl text-gray-400 mb-4" />
          <p className="text-gray-600">No canteens yet. Create your first canteen!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canteens.map((canteen) => (
            <div key={canteen._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{canteen.name}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Location:</strong> {canteen.location}</p>
                <p><strong>Hours:</strong> {canteen.operatingHours}</p>
                <p><strong>Status:</strong> {canteen.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <button className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                Manage Menu
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCanteens;


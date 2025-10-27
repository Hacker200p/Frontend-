import React, { useState, useEffect } from 'react';
import { ownerAPI } from '../../services/api';
import { FiHome, FiPlus, FiEdit, FiMapPin, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const MyHostels = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    setLoading(true);
    try {
  const response = await ownerAPI.getMyHostels();
  // API returns { success: true, data: hostels }
  // Ensure we set the actual array and fall back to an empty array
  // so `.map` is always called on an array.
  setHostels(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch hostels');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">My Hostels</h1>
          <Link
            to="/owner/create-hostel"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <FiPlus />
            <span>Create Hostel</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Loading hostels...</p>
        </div>
      ) : hostels.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FiHome className="mx-auto text-6xl text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No hostels yet. Create your first hostel!</p>
          <Link
            to="/owner/create-hostel"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Create Hostel
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hostels.map((hostel) => (
            <div key={hostel._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              {hostel.photos?.[0] && (
                <img
                  src={hostel.photos[0].url}
                  alt={hostel.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{hostel.name}</h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <FiMapPin />
                    <span>{hostel.address.city}, {hostel.address.state}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiHome />
                    <span>{hostel.hostelType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiDollarSign />
                    <span>₹{hostel.priceRange.min} - ₹{hostel.priceRange.max}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
                    <FiEdit />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyHostels;


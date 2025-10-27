import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FiHome, FiCheck, FiX, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Hostels = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    setLoading(true);
    try {
  const response = await adminAPI.getAllHostels();
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

  const handleVerify = async (hostelId, status) => {
    try {
      await adminAPI.verifyHostel(hostelId, { status });
      toast.success(`Hostel ${status === 'verified' ? 'verified' : 'rejected'}`);
      fetchHostels();
    } catch (error) {
      toast.error('Failed to update hostel status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Verified</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">Pending</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">{status}</span>;
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-3">
          <FiHome className="text-3xl text-red-600" />
          <h1 className="text-2xl font-bold text-gray-800">Hostels Management</h1>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Loading hostels...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hostels.map((hostel) => (
            <div key={hostel._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{hostel.name}</h3>
                  <p className="text-gray-600 mb-2">{hostel.description}</p>
                  <p className="text-gray-600 mb-2">{hostel.address.city}, {hostel.address.state}</p>
                  <div className="mt-4">{getStatusBadge(hostel.verificationStatus)}</div>
                </div>
                {hostel.verificationStatus === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVerify(hostel._id, 'verified')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <FiCheck />
                      <span>Verify</span>
                    </button>
                    <button
                      onClick={() => handleVerify(hostel._id, 'rejected')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                    >
                      <FiX />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Hostels;


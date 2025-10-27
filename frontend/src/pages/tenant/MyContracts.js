import React, { useState, useEffect } from 'react';
import { tenantAPI } from '../../services/api';
import { FiFileText, FiCheck, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MyContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await tenantAPI.getMyContracts();
      setContracts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch contracts');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Active</span>;
      case 'pending_signatures':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">Pending Signatures</span>;
      case 'expired':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">Expired</span>;
      case 'terminated':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">Terminated</span>;
      case 'draft':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">Draft</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">{status}</span>;
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Contracts</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Loading contracts...</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FiFileText className="mx-auto text-6xl text-gray-400 mb-4" />
          <p className="text-gray-600">No contracts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div key={contract._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                    <FiFileText className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {contract.hostel?.name || contract.contractNumber}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Start Date: {new Date(contract.startDate).toLocaleDateString()} - 
                      End Date: {new Date(contract.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">Monthly Rent: ₹{contract.monthlyRent || 0}</p>
                    <p className="text-gray-600">Room: {contract.room?.roomNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(contract.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyContracts;


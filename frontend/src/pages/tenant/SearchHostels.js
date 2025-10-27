import React, { useState, useEffect } from 'react';
import { tenantAPI } from '../../services/api';
import { FiSearch, FiMapPin, FiStar, FiHome, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SearchHostels = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    city: '',
    hostelType: '',
    minPrice: '',
    maxPrice: '',
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchParams.city) params.city = searchParams.city;
      if (searchParams.hostelType) params.hostelType = searchParams.hostelType;
      if (searchParams.minPrice) params.minPrice = searchParams.minPrice;
      if (searchParams.maxPrice) params.maxPrice = searchParams.maxPrice;

  const response = await tenantAPI.searchHostels(params);
  // Backend returns { success: true, data: hostels, pagination: { ... } }
  // Ensure we set the array of hostels (response.data.data) and
  // defensively fall back to an empty array so `.map` is safe.
  setHostels(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to search hostels');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Search Hostels</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="city"
            placeholder="City"
            value={searchParams.city}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            name="hostelType"
            value={searchParams.hostelType}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="boys">Boys</option>
            <option value="girls">Girls</option>
            <option value="co-ed">Co-ed</option>
          </select>
          
          <input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            value={searchParams.minPrice}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            value={searchParams.maxPrice}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={handleSearch}
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <FiSearch />
              <span>Search</span>
            </>
          )}
        </button>
      </div>

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
              <div className="space-y-2 text-sm text-gray-600">
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
                <div className="flex items-center space-x-2">
                  <FiStar className="text-yellow-500" />
                  <span>{hostel.rating} ({hostel.reviewCount} reviews)</span>
                </div>
              </div>
              <button
                onClick={() => window.location.href = `/tenant/hostels/${hostel._id}`}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && hostels.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">No hostels found. Try different search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default SearchHostels;


import React, { useState } from 'react';
import { canteenAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CreateCanteen = () => {
  const [form, setForm] = useState({ name: '', location: '', operatingHours: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await canteenAPI.createCanteen(form);
      if (response.data?.success) {
        toast.success('Canteen created');
        navigate('/provider/canteens');
      } else {
        toast.error(response.data?.message || 'Failed to create canteen');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create canteen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold mb-4">Create Canteen</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Operating Hours</label>
          <input
            name="operatingHours"
            value={form.operatingHours}
            onChange={handleChange}
            placeholder="e.g., 9:00 AM - 9:00 PM"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Canteen'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCanteen;

import React, { useState, useEffect } from 'react';
import { tenantAPI } from '../../services/api';
import { FiDollarSign, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MyExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await tenantAPI.getMyExpenses();
      setExpenses(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    try {
      await tenantAPI.addExpense(formData);
      toast.success('Expense added successfully');
      setShowAddModal(false);
      setFormData({ category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const totalExpenses = Array.isArray(expenses) && expenses.length > 0 
    ? expenses.reduce((sum, exp) => sum + (exp.totalExpense || 0), 0) 
    : 0;

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">My Expenses</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FiPlus />
            <span>Add Expense</span>
          </button>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 flex items-center space-x-4">
          <div className="bg-blue-600 text-white p-3 rounded-lg">
            <FiDollarSign className="text-2xl" />
          </div>
          <div>
            <p className="text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-blue-600">₹{totalExpenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">No expenses yet. Add your first expense!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month/Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.month}/{expense.year}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    Rent: ₹{expense.rent || 0}<br/>
                    Electricity: ₹{expense.electricity || 0}<br/>
                    Food: ₹{expense.food || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{expense.notes || '-'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{expense.totalExpense || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Expense</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows="3"
              />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mt-6 flex space-x-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyExpenses;


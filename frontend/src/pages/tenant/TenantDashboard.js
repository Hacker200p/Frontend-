import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SearchHostels from './SearchHostels';
import MyExpenses from './MyExpenses';
import MyContracts from './MyContracts';
import MyOrders from './MyOrders';

const TenantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && user.role !== 'tenant') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'tenant') {
    return null;
  }

  return (
    <Routes>
      <Route path="search" element={<SearchHostels />} />
      <Route path="expenses" element={<MyExpenses />} />
      <Route path="contracts" element={<MyContracts />} />
      <Route path="orders" element={<MyOrders />} />
      <Route path="/" element={<Navigate to="search" replace />} />
    </Routes>
  );
};

export default TenantDashboard;


import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MyCanteens from './MyCanteens';
import Orders from './Orders';
import CreateCanteen from './CreateCanteen';

const ProviderDashboard = () => {
  return (
    <Routes>
      <Route path="canteens" element={<MyCanteens />} />
  <Route path="orders" element={<Orders />} />
  <Route path="create-canteen" element={<CreateCanteen />} />
      <Route path="/" element={<Navigate to="canteens" replace />} />
    </Routes>
  );
};

export default ProviderDashboard;


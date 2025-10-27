import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Users from './Users';
import Hostels from './Hostels';
import Stats from './Stats';

const AdminDashboard = () => {
  return (
    <Routes>
      <Route path="users" element={<Users />} />
      <Route path="hostels" element={<Hostels />} />
      <Route path="stats" element={<Stats />} />
      <Route path="/" element={<Navigate to="stats" replace />} />
    </Routes>
  );
};

export default AdminDashboard;


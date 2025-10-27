import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MyHostels from './MyHostels';
import CreateHostel from './CreateHostel';

const OwnerDashboard = () => {
  return (
    <Routes>
      <Route path="hostels" element={<MyHostels />} />
      <Route path="create-hostel" element={<CreateHostel />} />
      <Route path="/" element={<Navigate to="hostels" replace />} />
    </Routes>
  );
};

export default OwnerDashboard;


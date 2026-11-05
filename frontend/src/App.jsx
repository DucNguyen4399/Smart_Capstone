import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage'; // Import trang cài đặt hệ thống vào đây

import './App.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  const handleLoginSuccess = (userRole) => {
    setToken(localStorage.getItem('token'));
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setToken(null);
    setRole(null);
  };

  return (
    <Router>
      <Routes>
        {/* Nếu chưa đăng nhập, trỏ về trang Login hoặc Register */}
        {!token ? (
          <>
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          /* Khi đã đăng nhập, cho phép định tuyến vào các trang quản trị ERP */
          <>
            <Route path="/" element={<Dashboard role={role} onLogout={handleLogout} />} />
            <Route path="/dashboard" element={<Dashboard role={role} onLogout={handleLogout} />} />
            <Route path="/settings" element={<SettingsPage />} /> 
            {/* Thêm các Route cho các trang khác tại đây nếu cần */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
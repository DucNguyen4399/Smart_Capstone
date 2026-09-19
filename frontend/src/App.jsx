import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import './App.css';
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [currentView, setCurrentView] = useState('login'); // 'login' hoặc 'register'

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
    setCurrentView('login');
  };

  // Nếu đã đăng nhập thành công, hiển thị Dashboard quản trị doanh nghiệp
  if (token) {
    return <Dashboard role={role} onLogout={handleLogout} />;
  }

  // Nếu chưa đăng nhập, cho phép linh hoạt chuyển đổi qua lại giữa Login và Register
  return (
    <div>
      {currentView === 'login' ? (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess} 
          onSwitchToRegister={() => setCurrentView('register')} 
        />
      ) : (
        <RegisterPage 
          onSwitchToLogin={() => setCurrentView('login')} 
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import '../App.css'; // Đảm bảo import CSS

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const bodyData = new URLSearchParams();
    bodyData.append('username', username);
    bodyData.append('password', password);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Đăng nhập thất bại.');

      // Lưu Token và Role, sau đó báo cho App.jsx biết để chuyển trang
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      onLoginSuccess(data.access_token, data.role);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">RetailSmart System</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Tên đăng nhập (Admin/Manager/Staff)</label>
            <input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary">Đăng nhập</button>
        </form>
      </div>
    </div>
  );
}
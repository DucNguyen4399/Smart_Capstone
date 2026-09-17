import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function MainLayout() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '220px', background: '#1e293b', color: '#fff', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>RetailSmart</h3>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '15px' }}>Vai trò: <b>{role}</b></span>
        <hr style={{ borderColor: '#334155', width: '100%', marginBottom: '15px' }} />
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/dashboard" style={{ color: '#f8fafc', textDecoration: 'none' }}>📊 Dashboard</Link>
          <Link to="/products" style={{ color: '#f8fafc', textDecoration: 'none' }}>📦 Sản phẩm</Link>
          <Link to="/inventory/import" style={{ color: '#f8fafc', textDecoration: 'none' }}>📥 Nhập tồn kho</Link>
        </nav>
        <button onClick={handleLogout} style={{ marginTop: 'auto', padding: '8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Đăng xuất</button>
      </aside>
      <main style={{ flex: 1, padding: '2rem', background: '#f8fafc', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
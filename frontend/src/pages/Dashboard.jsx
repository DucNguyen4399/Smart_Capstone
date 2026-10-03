import React, { useState, useEffect } from 'react';
import DashboardOverview from './DashboardOverview';
import ProductListPage from './ProductListPage';
import BatchManagementPage from './BatchManagementPage';
import StockImportPage from './StockImportPage';
import SettingsPage from './SettingsPage';

export default function Dashboard({ role, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Bổ sung State hiển thị thời gian thực (Real-time Clock) cập nhật từng giây
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuTitles = {
    dashboard: 'Dashboard Tổng quan',
    products: 'Quản lý Danh mục Sản phẩm',
    batches: 'Kiểm soát Lô hàng & Hạn sử dụng (FEFO)',
    import_stock: 'Import Lịch sử Sales & Nhập kho',
    ai_assistant: 'Trợ lý AI Phân tích & Dự báo Kho',
    settings: 'Cài đặt Hệ thống'
  };

  return (
    <div className="app-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* SIDEBAR TỐI GIẢN */}
      <div className="sidebar" style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', width: '250px', flexShrink: 0, boxSizing: 'border-box' }}>
        <div className="sidebar-header" style={{ color: '#1e293b', fontWeight: 'bold', padding: '24px 20px', borderBottom: '1px solid #e2e8f0', fontSize: '1.05rem' }}>
          Nhập Xuất Tồn
        </div>
        
        <ul className="sidebar-menu" style={{ listStyle: 'none', padding: '15px 12px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li 
            className={activeMenu === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveMenu('dashboard')}
            style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: '6px', fontWeight: activeMenu === 'dashboard' ? '6px' : '400', background: activeMenu === 'dashboard' ? '#f1f5f9' : 'transparent', color: activeMenu === 'dashboard' ? '#0f172a' : '#475569' }}
          >
            Dashboard
          </li>
          <li 
            className={activeMenu === 'products' ? 'active' : ''} 
            onClick={() => setActiveMenu('products')}
            style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: '6px', background: activeMenu === 'products' ? '#f1f5f9' : 'transparent', color: activeMenu === 'products' ? '#0f172a' : '#475569' }}
          >
            Sản phẩm
          </li>
          <li 
            className={activeMenu === 'batches' ? 'active' : ''} 
            onClick={() => setActiveMenu('batches')}
            style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: '6px', background: activeMenu === 'batches' ? '#f1f5f9' : 'transparent', color: activeMenu === 'batches' ? '#0f172a' : '#475569' }}
          >
            Lô hàng & Hạn sử dụng
          </li>
          <li 
            className={activeMenu === 'import_stock' ? 'active' : ''} 
            onClick={() => setActiveMenu('import_stock')}
            style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: '6px', background: activeMenu === 'import_stock' ? '#f1f5f9' : 'transparent', color: activeMenu === 'import_stock' ? '#0f172a' : '#475569' }}
          >
            Nhập kho
          </li>
          <li 
            className={activeMenu === 'ai_assistant' ? 'active' : ''} 
            onClick={() => setActiveMenu('ai_assistant')}
            style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: '6px', background: activeMenu === 'ai_assistant' ? '#f1f5f9' : 'transparent', color: activeMenu === 'ai_assistant' ? '#0f172a' : '#475569' }}
          >
            Trợ lý AI
          </li>
          <li 
            className={activeMenu === 'settings' ? 'active' : ''} 
            onClick={() => setActiveMenu('settings')}
            style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: '6px', background: activeMenu === 'settings' ? '#f1f5f9' : 'transparent', color: activeMenu === 'settings' ? '#0f172a' : '#475569' }}
          >
            Cài đặt
          </li>
        </ul>
      </div>

      {/* MAIN WRAPPER */}
      <div className="main-wrapper" style={{ backgroundColor: '#f8f9fa', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* TOP NAVBAR TÍCH HỢP REAL-TIME CLOCK */}
        <div className="top-navbar" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
          <div className="top-navbar-title" style={{ color: '#1e293b', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {menuTitles[activeMenu]}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Hiển thị đồng hồ thời gian thực trên thanh Navbar chung */}
            <span style={{ fontSize: '0.85rem', color: '#047857', background: '#ecfdf5', padding: '6px 12px', borderRadius: '6px', fontWeight: '500', border: '1px solid #a7f3d0' }}>
              ⏱ {currentTime}
            </span>

            <div className="user-profile" style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Xin chào, <b>{localStorage.getItem('username') || role || 'admin'}</b></span>
              <button onClick={onLogout} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT CONTAINER */}
        <div className="main-content" style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
          {activeMenu === 'dashboard' && <DashboardOverview />}
          {activeMenu === 'products' && <ProductListPage />}
          {activeMenu === 'batches' && <BatchManagementPage />}
          {activeMenu === 'import_stock' && <StockImportPage />}

          {activeMenu === 'ai_assistant' && (
            <div className="erp-panel" style={{ padding: '30px' }}>
              <div className="erp-panel-title">Trợ lý AI Phân tích Đa chiều & Dự báo Tồn kho</div>
              <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.9rem' }}>
                Hệ thống đánh giá chuỗi thời gian (Time-series) để đề xuất kế hoạch nhập hàng hoặc kích hoạt chương trình xả hàng tồn đọng.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input className="erp-input" style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Nhập tên mặt hàng cần phân tích..." />
                <button className="erp-btn-primary" style={{ padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Chạy Mô hình AI</button>
              </div>
            </div>
          )}

          {activeMenu === 'settings' && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}
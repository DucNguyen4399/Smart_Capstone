import React, { useState } from 'react';
import ProductListPage from './ProductListPage';
import StockImportPage from './StockImportPage';
import BatchManagementPage from './BatchManagementPage';

export default function Dashboard({ role, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('kpi');

  // Ánh xạ tên tiêu đề hiển thị trên thanh Navbar
  const menuTitles = {
    kpi: 'Tổng quan Hiệu suất & Chỉ số KPI',
    products: 'Quản lý Danh mục Sản phẩm (Catalog)',
    batches: 'Quản lý Lô hàng & Cảnh báo Hạn sử dụng',
    suppliers: 'Quản lý Mạng lưới Nhà cung cấp',
    import: 'Import Dữ liệu Lịch sử Giao dịch (CSV/Excel)',
    adjustments: 'Biên bản Kiểm kê & Điều chỉnh Kho'
  };

  return (
    <div className="app-layout">
      {/* 1. SIDEBAR ĐIỀU HƯỚNG */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>📦 RetailSmart</h2>
          <div className="sidebar-role">Phân quyền: {role}</div>
        </div>
        <ul className="sidebar-menu">
          <li className={activeMenu === 'kpi' ? 'active' : ''} onClick={() => setActiveMenu('kpi')}>
            📊 Dashboard Tổng quan
          </li>
          <li className={activeMenu === 'products' ? 'active' : ''} onClick={() => setActiveMenu('products')}>
            🏷️ Danh mục Sản phẩm
          </li>
          <li className={activeMenu === 'batches' ? 'active' : ''} onClick={() => setActiveMenu('batches')}>
            ⏳ Lô hàng & Hạn sử dụng
          </li>
          <li className={activeMenu === 'suppliers' ? 'active' : ''} onClick={() => setActiveMenu('suppliers')}>
            🏢 Quản lý Nhà cung cấp
          </li>
          <li className={activeMenu === 'import' ? 'active' : ''} onClick={() => setActiveMenu('import')}>
            📥 Import Lịch sử Sales
          </li>
          <li className={activeMenu === 'adjustments' ? 'active' : ''} onClick={() => setActiveMenu('adjustments')}>
            📋 Điều chỉnh kho
          </li>
        </ul>
        <div className="logout-btn" onClick={onLogout}>🚪 Đăng xuất hệ thống</div>
      </div>

      {/* 2. KHUNG NỘI DUNG CHÍNH BÊN PHẢI */}
      <div className="main-wrapper">
        {/* THANH NAVBAR PHÍA TRÊN */}
        <div className="top-navbar">
          <div className="top-navbar-title">{menuTitles[activeMenu]}</div>
          <div className="user-profile-badge">
            👤 Tài khoản: <span style={{ color: 'var(--primary)' }}>{localStorage.getItem('username') || role}</span>
          </div>
        </div>

        {/* KHU VỰC HIỂN THỊ COMPONENT ĐỘNG */}
        <div className="main-content">
          {activeMenu === 'kpi' && (
            <div>
              <div className="mini-kpi-row">
                <div className="mini-kpi-card" style={{ borderLeft: '4px solid #4f46e5' }}>
                  <div className="mini-kpi-label">Tỷ lệ lãng phí thực tế</div>
                  <div className="mini-kpi-value" style={{ color: '#4f46e5' }}>8.4%</div>
                </div>
                <div className="mini-kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="mini-kpi-label">Tỷ lệ hết hàng (Stockout)</div>
                  <div className="mini-kpi-value" style={{ color: '#d97706' }}>2.1%</div>
                </div>
                <div className="mini-kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
                  <div className="mini-kpi-label">Độ chính xác mô hình AI</div>
                  <div className="mini-kpi-value" style={{ color: '#059669' }}>94.2%</div>
                </div>
              </div>
              
              <div className="table-container" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3>🚀 Chào mừng bạn đến với hệ thống quản trị thông minh RetailSmart</h3>
                <p style={{ marginTop: '10px' }}>Sử dụng menu bên trái để truy cập các phân hệ quản lý sản phẩm, lô hàng và phân tích dữ liệu kho.</p>
              </div>
            </div>
          )}

          {activeMenu === 'products' && <ProductListPage />}
          {activeMenu === 'batches' && <BatchManagementPage />}
          {activeMenu === 'import' && <StockImportPage />}
          
          {activeMenu === 'suppliers' && (
            <div>
              <div className="content-header">Quản lý Nhà cung cấp</div>
              <div className="table-container" style={{ padding: '40px', textAlign: 'center' }}>
                Phân hệ đang được tích hợp dữ liệu từ hệ thống.
              </div>
            </div>
          )}

          {activeMenu === 'adjustments' && (
            <div>
              <div className="content-header">Biên bản Điều chỉnh kho</div>
              <div className="table-container" style={{ padding: '40px', textAlign: 'center' }}>
                Phân hệ đang được tích hợp dữ liệu từ hệ thống.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
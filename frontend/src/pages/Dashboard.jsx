import React, { useState } from 'react';
import DashboardOverview from './DashboardOverview';
import ProductListPage from './ProductListPage';
import BatchManagementPage from './BatchManagementPage';
import StockImportPage from './StockImportPage';

export default function Dashboard({ role, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const menuTitles = {
    dashboard: 'Dashboard Tổng quan',
    products: 'Quản lý Danh mục Sản phẩm',
    batches: 'Kiểm soát Lô hàng & Hạn sử dụng (FEFO)',
    import_stock: 'Import Lịch sử Sales & Nhập kho',
    ai_assistant: 'Trợ lý AI Phân tích & Dự báo Kho',
    settings: 'Cài đặt Hệ thống'
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR TỐI GIẢN - ĐÃ XÓA MỤC TỒN KHO */}
      <div className="sidebar" style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', width: '250px' }}>
        <div className="sidebar-header" style={{ color: '#1e293b', fontWeight: 'bold', padding: '24px 20px', borderBottom: '1px solid #e2e8f0', fontSize: '1.05rem' }}>
          Nhập Xuất Tồn
        </div>
        
        <ul className="sidebar-menu" style={{ listStyle: 'none', padding: '15px 12px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li className={activeMenu === 'dashboard' ? 'active' : ''} onClick={() => setActiveMenu('dashboard')}>
            Dashboard
          </li>
          <li className={activeMenu === 'products' ? 'active' : ''} onClick={() => setActiveMenu('products')}>
            Sản phẩm
          </li>
          <li className={activeMenu === 'batches' ? 'active' : ''} onClick={() => setActiveMenu('batches')}>
            Lô hàng & Hạn sử dụng
          </li>
          <li className={activeMenu === 'import_stock' ? 'active' : ''} onClick={() => setActiveMenu('import_stock')}>
            Nhập kho
          </li>
          <li className={activeMenu === 'ai_assistant' ? 'active' : ''} onClick={() => setActiveMenu('ai_assistant')}>
            Trợ lý AI
          </li>
          <li className={activeMenu === 'settings' ? 'active' : ''} onClick={() => setActiveMenu('settings')}>
            Cài đặt
          </li>
        </ul>
      </div>

      {/* MAIN WRAPPER */}
      <div className="main-wrapper" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="top-navbar" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div className="top-navbar-title" style={{ color: '#1e293b' }}>
            {menuTitles[activeMenu]}
          </div>
          <div className="user-profile" style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Xin chào, {localStorage.getItem('username') || role || 'admin'}</span>
            <button onClick={onLogout} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="main-content">
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
                <input className="erp-input" style={{ flex: 1 }} placeholder="Nhập tên mặt hàng cần phân tích..." />
                <button className="erp-btn-primary">Chạy Mô hình AI</button>
              </div>
            </div>
          )}

          {activeMenu === 'settings' && (
            <div className="erp-panel" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <h3 style={{ color: '#1e293b' }}>Cài đặt Hệ thống</h3>
              <p>Quản lý phân quyền, cấu hình thông báo và kết nối cơ sở dữ liệu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
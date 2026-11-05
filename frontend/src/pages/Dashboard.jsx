import React, { useState } from 'react';
import {
  CalendarClock,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

import InventoryManagementPage from './InventoryManagementPage';
import DashboardOverview from './DashboardOverview';
import SalesHistoryPage from './SalesHistoryPage';
import RecommendationPage from './RecommendationPage';
import StockTransactionsPage from './StockTransactionsPage';
import StockImportPage from './StockImportPage';
import './Dashboard.css';

// Đã loại bỏ icon khỏi danh sách menu
const menuItems = [
  { id: 'dashboard', title: 'Dashboard' },
  { id: 'inventory', title: 'Sản phẩm' },
  {
    id: 'stock_transactions',
    title: 'Nhập / Xuất kho',
    roles: ['Admin', 'Store Manager', 'Store Staff'],
  },
  { id: 'sales_history', title: 'Lịch sử bán hàng' },
  {
    id: 'ai_assistant',
    title: 'Trợ lý AI',
    roles: ['Admin', 'Store Manager'],
  },
  {
    id: 'recommendation',
    title: 'Đề xuất nhập hàng',
    roles: ['Admin', 'Store Manager'],
  },
  {
    id: 'settings',
    title: 'Cài đặt hệ thống',
    roles: ['Admin'],
  },
];

const menuTitles = {
  dashboard: 'Dashboard Tổng quan',
  inventory: 'Sản phẩm',
  stock_transactions: 'Quản lý nhập / xuất kho',
  import_stock: 'Quản lý lô hàng & Hạn dùng',
  sales_history: 'Lịch sử bán hàng',
  ai_assistant: 'Trợ lý AI Phân tích & Dự báo Kho',
  recommendation: 'Đề xuất nhập hàng',
  settings: 'Cài đặt Hệ thống',
};

export default function Dashboard({ role, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const normalizedRole = String(role || '').trim();

  const visibleMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(normalizedRole)
  );

  const visibleMenuIds = visibleMenuItems.map((item) => item.id);

  const safeActiveMenu = visibleMenuIds.includes(activeMenu)
    ? activeMenu
    : visibleMenuIds[0] || 'dashboard';

  const username =
    localStorage.getItem('username') || role || 'admin';

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          {/* Đã xóa icon logo, chỉ giữ tên thương hiệu */}
          <div className="brand-info">
            <span className="brand-name">Nhập Xuất Tồn</span>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-menu">
          {visibleMenuItems.map((item) => {
            const isActive = safeActiveMenu === item.id;

            return (
              <button
                type="button"
                key={item.id}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Đã xóa icon menu */}
                <span className="sidebar-item-title">{item.title}</span>

                {isActive && (
                  <ChevronRight className="sidebar-item-arrow" size={16} />
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="main-wrapper">
        <header className="top-navbar">
          <div className="navbar-heading">
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu"
            >
              <Menu size={22} />
            </button>

            <div className="navbar-page-info">
              <span className="navbar-eyebrow">NHẬP XUẤT TỒN</span>
              <h1 className="top-navbar-title">{menuTitles[safeActiveMenu]}</h1>
            </div>
          </div>

          <div className="user-profile">
            <div className="user-info">
              <span className="user-name">{username}</span>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={onLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        <main className="main-content">
          {safeActiveMenu === 'dashboard' && (
            <DashboardOverview role={role} />
          )}

          {safeActiveMenu === 'inventory' && <InventoryManagementPage />}
          {safeActiveMenu === 'stock_transactions' && (
            <StockTransactionsPage role={normalizedRole} />
          )}

          {safeActiveMenu === 'sales_history' && <SalesHistoryPage />}

          {safeActiveMenu === 'recommendation' && <StockImportPage />}

          {safeActiveMenu === 'import_stock' && (
            <div className="dashboard-placeholder">
              <div className="placeholder-icon">
                <CalendarClock size={28} />
              </div>
              <h2>Quản lý lô hàng & Hạn dùng</h2>
              <p>
                Chức năng quản lý lô hàng và hạn sử dụng sẽ hiển thị tại đây khi
                được kết nối với trang tương ứng.
              </p>
            </div>
          )}

          {safeActiveMenu === 'ai_assistant' && (
            <div className="erp-panel ai-assistant-panel">
              <div className="ai-panel-heading">
                <div>
                  <h2>Trợ lý AI</h2>
                  <p>Phân tích dữ liệu và hỗ trợ dự báo tồn kho.</p>
                </div>
              </div>

              <div className="ai-input-row">
                <input
                  className="erp-input"
                  placeholder="Nhập tên mặt hàng cần phân tích..."
                />
                <button type="button" className="erp-btn-primary">
                  Chạy mô hình AI
                </button>
              </div>
            </div>
          )}

          {safeActiveMenu === 'settings' && (
            <div className="dashboard-placeholder">
              <h2>Cài đặt hệ thống</h2>
              <p>
                Quản lý phân quyền, cấu hình thông báo và kết nối cơ sở dữ liệu.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

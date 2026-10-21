
import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  CalendarClock,
  ClipboardList,
  Bot,
  ShoppingCart,
  Settings,
  Boxes,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

import InventoryManagementPage from './InventoryManagementPage';
import DashboardOverview from './DashboardOverview';
import SalesHistoryPage from './SalesHistoryPage';
import RecommendationPage from './RecommendationPage';
import './Dashboard.css';

const menuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'inventory',
    title: 'Sản phẩm',
    icon: Package,
  },
  {
    id: 'sales_history',
    title: 'Lịch sử bán hàng',
    icon: ClipboardList,
  },
  {
    id: 'ai_assistant',
    title: 'Trợ lý AI',
    icon: Bot,
  },
  {
    id: 'recommendation',
    title: 'Đề xuất nhập hàng',
    icon: ShoppingCart,
  },
  {
    id: 'settings',
    title: 'Cài đặt hệ thống',
    icon: Settings,
  },
];

const menuTitles = {
  dashboard: 'Dashboard Tổng quan',
  inventory: 'Quản lý sản phẩm',
  import_stock: 'Quản lý lô hàng & Hạn dùng',
  sales_history: 'Lịch sử bán hàng',
  ai_assistant: 'Trợ lý AI Phân tích & Dự báo Kho',
  recommendation: 'Đề xuất nhập hàng',
  settings: 'Cài đặt Hệ thống',
};

export default function Dashboard({ role, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
      >
        <div className="sidebar-header">
          <div className="brand-logo">
            <Boxes size={23} strokeWidth={2.3} />
          </div>

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

        <div className="sidebar-section-label">
          MENU CHÍNH
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;

            return (
              <button
                type="button"
                key={item.id}
                className={`sidebar-item ${
                  isActive ? 'active' : ''
                }`}
                onClick={() => handleMenuClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="sidebar-item-icon">
                  <Icon size={19} strokeWidth={1.9} />
                </span>

                <span className="sidebar-item-title">
                  {item.title}
                </span>

                {isActive && (
                  <ChevronRight
                    className="sidebar-item-arrow"
                    size={16}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status-dot" />
          <span>Hệ thống đang hoạt động</span>
        </div>
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
              <span className="navbar-eyebrow">
                NHẬP XUẤT TỒN / QUẢN LÝ
              </span>
              <h1 className="top-navbar-title">
                {menuTitles[activeMenu]}
              </h1>
            </div>
          </div>

          <div className="user-profile">
            <div className="user-avatar">
              {String(username).charAt(0).toUpperCase()}
            </div>

            <div className="user-info">
              <span className="user-name">{username}</span>
              <span className="user-role">
                {role || 'Quản trị viên'}
              </span>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={onLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        <main className="main-content">
          {activeMenu === 'dashboard' && (
            <DashboardOverview />
          )}

          {activeMenu === 'inventory' && (
            <InventoryManagementPage />
          )}

          {activeMenu === 'sales_history' && (
            <SalesHistoryPage />
          )}

          {activeMenu === 'recommendation' && (
            <RecommendationPage />
          )}

          {activeMenu === 'import_stock' && (
            <div className="dashboard-placeholder">
              <div className="placeholder-icon">
                <CalendarClock size={28} />
              </div>
              <h2>Quản lý lô hàng & Hạn dùng</h2>
              <p>
                Chức năng quản lý lô hàng và hạn sử dụng sẽ hiển thị
                tại đây khi được kết nối với trang tương ứng.
              </p>
            </div>
          )}

          {activeMenu === 'ai_assistant' && (
            <div className="erp-panel ai-assistant-panel">
              <div className="ai-panel-heading">
                <div className="ai-panel-icon">
                  <Bot size={24} />
                </div>
                <div>
                  <h2>Trợ lý AI</h2>
                  <p>
                    Phân tích dữ liệu và hỗ trợ dự báo tồn kho.
                  </p>
                </div>
              </div>

              <div className="ai-input-row">
                <input
                  className="erp-input"
                  placeholder="Nhập tên mặt hàng cần phân tích..."
                />
                <button
                  type="button"
                  className="erp-btn-primary"
                >
                  Chạy mô hình AI
                </button>
              </div>
            </div>
          )}

          {activeMenu === 'settings' && (
            <div className="dashboard-placeholder">
              <div className="placeholder-icon">
                <Settings size={28} />
              </div>
              <h2>Cài đặt hệ thống</h2>
              <p>
                Quản lý phân quyền, cấu hình thông báo và kết nối
                cơ sở dữ liệu.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import ProductListPage from './ProductListPage';
import BatchManagementPage from './BatchManagementPage';

export default function InventoryManagementPage() {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { id: 'products', label: 'Danh mục sản phẩm' },
    { id: 'batches', label: 'Lô hàng & Hạn sử dụng' },
  ];

  return (
    <div className="inventory-management">
      <div className="inventory-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`inventory-tab ${
              activeTab === tab.id ? 'active' : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="inventory-tab-content">
        {activeTab === 'products' && <ProductListPage />}
        {activeTab === 'batches' && <BatchManagementPage />}
      </div>
    </div>
  );
}
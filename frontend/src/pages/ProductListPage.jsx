import React, { useState } from 'react';

export default function ProductListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  
  // State quản lý Modal (Thêm hoặc Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // Nếu null là Thêm mới, có dữ liệu là Sửa

  // Danh sách sản phẩm mẫu chuẩn ERP
  const [products, setProducts] = useState([
    { id: 'SP001', name: 'Sản phẩm 1', category: 'Đồ uống', unit: 'Chai', importPrice: '10.000 ₫', exportPrice: '13.000 ₫', stock: 6, minStock: 5, date: '09/08/2025', status: 'Đang bán' },
    { id: 'SP010', name: 'Sản phẩm 10', category: 'Thực phẩm khô', unit: 'Hộp', importPrice: '30.000 ₫', exportPrice: '39.000 ₫', stock: 4, minStock: 10, date: '10/08/2025', status: 'Đang bán' }
  ]);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: 'Thực phẩm',
    unit: 'Hộp',
    importPrice: '',
    exportPrice: '',
    stock: '',
    minStock: ''
  });

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({ id: '', name: '', category: 'Thực phẩm', unit: 'Hộp', importPrice: '', exportPrice: '', stock: '', minStock: '' });
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa với dữ liệu cũ
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      category: product.category || 'Thực phẩm',
      unit: product.unit,
      importPrice: product.importPrice.replace(/[^\d]/g, ''),
      exportPrice: product.exportPrice.replace(/[^\d]/g, ''),
      stock: product.stock,
      minStock: product.minStock || 5
    });
    setIsModalOpen(true);
  };

  // Xử lý Lưu (Thêm mới hoặc Cập nhật)
  const handleSaveProduct = (e) => {
    e.preventDefault();
    const formattedProduct = {
      ...formData,
      importPrice: Number(formData.importPrice).toLocaleString() + ' ₫',
      exportPrice: Number(formData.exportPrice).toLocaleString() + ' ₫',
      date: new Date().toLocaleDateString('vi-VN'),
      status: 'Đang bán'
    };

    if (editingProduct) {
      // Cập nhật sản phẩm cũ
      setProducts(products.map(p => p.id === editingProduct.id ? formattedProduct : p));
    } else {
      // Thêm sản phẩm mới
      setProducts([formattedProduct, ...products]);
    }

    setIsModalOpen(false);
  };

  // Xử lý Xóa sản phẩm
  const handleDeleteProduct = (id) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm ${id} không?`)) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div>
      <div className="erp-page-header">
        <div className="erp-filters-group">
          <input 
            type="text" 
            className="erp-input" 
            placeholder="🔍 Tìm kiếm mã, tên sản phẩm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="erp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>Tất cả trạng thái</option>
            <option>Đang bán</option>
            <option>Ngừng kinh doanh</option>
          </select>
        </div>
        
        <button className="erp-btn-primary" onClick={handleOpenAddModal}>
          + Thêm sản phẩm
        </button>
      </div>

      <div className="erp-table-container" style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table className="erp-table" style={{ minWidth: '1000px' }}>
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Đơn vị</th>
              <th style={{textAlign: 'right'}}>Giá nhập</th>
              <th style={{textAlign: 'right'}}>Giá xuất</th>
              <th style={{textAlign: 'right'}}>Tồn kho</th>
              <th style={{textAlign: 'right'}}>Tồn an toàn</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item, index) => (
              <tr key={index}>
                <td style={{ fontWeight: '600', color: '#475569' }}>{item.id}</td>
                <td style={{ color: '#3b82f6', fontWeight: '500' }}>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.unit}</td>
                <td style={{textAlign: 'right'}}>{item.importPrice}</td>
                <td style={{textAlign: 'right'}}>{item.exportPrice}</td>
                <td style={{textAlign: 'right', fontWeight: 'bold'}}>{item.stock}</td>
                <td style={{textAlign: 'right', color: '#64748b'}}>{item.minStock}</td>
                <td>{item.date}</td>
                <td>
                  <span className={`status-badge ${item.status === 'Đang bán' ? 'success' : 'danger'}`}>
                    {item.status}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* NÚT SỬA ĐÃ HOẠT ĐỘNG */}
                    <button className="erp-action-btn" title="Chỉnh sửa" onClick={() => handleOpenEditModal(item)}>✏️</button>
                    {/* NÚT XÓA ĐÃ HOẠT ĐỘNG */}
                    <button className="erp-action-btn delete" title="Xóa" onClick={() => handleDeleteProduct(item.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP MODAL THÊM / SẢN PHẨM CHUẨN GIAO DIỆN (ĐÃ FIX LỖI TRÀN Ô) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>
              {editingProduct ? 'Chỉnh sửa thông tin Sản phẩm' : 'Thêm Sản Phẩm Mới (Thị trường)'}
            </h3>
            
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Mã sản phẩm (SKU)</label>
                <input required disabled={editingProduct !== null} className="erp-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="VD: SP002" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Tên sản phẩm</label>
                <input required className="erp-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Nhập tên sản phẩm..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Danh mục</label>
                  <select className="erp-select" style={{ width: '100%', boxSizing: 'border-box' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="Thực phẩm">Thực phẩm</option>
                    <option value="Đồ uống">Đồ uống</option>
                    <option value="Thực phẩm khô">Thực phẩm khô</option>
                    <option value="Hàng tiêu dùng">Hàng tiêu dùng</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Đơn vị tính</label>
                  <select className="erp-select" style={{ width: '100%', boxSizing: 'border-box' }} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="Hộp">Hộp</option>
                    <option value="Chai">Chai</option>
                    <option value="Thùng">Thùng</option>
                    <option value="Kg">Kg</option>
                    <option value="Cái">Cái</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Giá nhập (₫)</label>
                  <input required className="erp-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="0" type="number" value={formData.importPrice} onChange={e => setFormData({...formData, importPrice: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Giá xuất (₫)</label>
                  <input required className="erp-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="0" type="number" value={formData.exportPrice} onChange={e => setFormData({...formData, exportPrice: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Số lượng tồn kho</label>
                  <input required className="erp-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="0" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Mức tồn an toàn</label>
                  <input required className="erp-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="5" type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="button" className="erp-btn-primary" style={{ flex: 1, background: '#e2e8f0', color: '#475569', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="erp-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Lưu Sản Phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
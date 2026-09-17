import React, { useState, useEffect } from 'react';

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // State quản lý dữ liệu nhập vào chuẩn ERD
  const [formData, setFormData] = useState({
    sku: '', name: '', category_id: 1, supplier_id: 1, cost_price: '', selling_price: '', safety_stock: ''
  });

  // Role hiện tại để xét quyền hiển thị nút Thêm
  const userRole = localStorage.getItem('role');

  const fetchProducts = () => {
    fetch('http://127.0.0.1:8000/api/v1/products', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => { if(Array.isArray(data)) setProducts(data); })
    .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sku: formData.sku,
          name: formData.name,
          category_id: parseInt(formData.category_id),
          supplier_id: parseInt(formData.supplier_id),
          cost_price: parseFloat(formData.cost_price),
          selling_price: parseFloat(formData.selling_price),
          safety_stock: parseInt(formData.safety_stock)
        })
      });
      
      if (!res.ok) throw new Error("Lỗi khi thêm sản phẩm");
      
      alert("Thêm sản phẩm thành công!");
      setShowForm(false);
      setFormData({ sku: '', name: '', category_id: 1, supplier_id: 1, cost_price: '', selling_price: '', safety_stock: '' });
      fetchProducts(); // Tải lại danh sách ngay lập tức
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div className="content-header">
        Danh mục Sản phẩm (Catalog)
      </div>

      {/* THANH CÔNG CỤ (TOOLBAR) */}
      <div className="action-toolbar">
        <input type="text" className="search-box" placeholder="🔍 Tìm kiếm theo SKU hoặc Tên..." />
        
        {/* Chỉ Admin hoặc Store Manager mới thấy nút này */}
        {(userRole === 'Admin' || userRole === 'Store Manager') && (
          <button className="btn-action btn-add" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✖ Đóng Form' : '+ Thêm Sản Phẩm Mới'}
          </button>
        )}
      </div>

      {/* FORM THÊM SẢN PHẨM (Mở ra khi bấm nút) */}
      {showForm && (
        <div className="form-card">
          <h3>📝 Nhập Thông Tin Sản Phẩm Mới</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Mã SKU</label>
                <input type="text" name="sku" className="form-control" value={formData.sku} onChange={handleChange} required placeholder="VD: MILK-001" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Tên Sản Phẩm</label>
                <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required placeholder="VD: Sữa tươi Vinamilk 1L" />
              </div>
              <div className="form-group">
                <label>ID Danh Mục</label>
                <input type="number" name="category_id" className="form-control" value={formData.category_id} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>ID Nhà Cung Cấp</label>
                <input type="number" name="supplier_id" className="form-control" value={formData.supplier_id} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Tồn Kho An Toàn (Safety Stock)</label>
                <input type="number" name="safety_stock" className="form-control" value={formData.safety_stock} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Giá Vốn (Cost Price)</label>
                <input type="number" name="cost_price" className="form-control" value={formData.cost_price} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Giá Bán (Selling Price)</label>
                <input type="number" name="selling_price" className="form-control" value={formData.selling_price} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Hủy bỏ</button>
              <button type="submit" className="btn-action btn-add">Lưu Sản Phẩm</button>
            </div>
          </form>
        </div>
      )}

      {/* BẢNG DỮ LIỆU */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá vốn</th>
              <th>Giá bán</th>
              <th>Tồn an toàn</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? <tr><td colSpan="7" style={{textAlign: 'center'}}>Chưa có dữ liệu sản phẩm. Hãy bấm "Thêm Sản Phẩm Mới".</td></tr> : null}
            {products.map(p => (
              <tr key={p.id}>
                <td><strong>{p.sku}</strong></td>
                <td>{p.name}</td>
                <td><span className="badge safe">{p.category_name || `CAT-${p.category_id}`}</span></td>
                <td>{Number(p.cost_price).toLocaleString('vi-VN')} ₫</td>
                <td>{Number(p.selling_price).toLocaleString('vi-VN')} ₫</td>
                <td><strong>{p.safety_stock}</strong></td>
                <td>
                  <button className="btn-action btn-edit">Sửa</button>
                  <button className="btn-action btn-delete">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
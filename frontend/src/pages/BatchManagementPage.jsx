import React, { useState } from 'react';

export default function BatchManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái Date');
  
  // State quản lý Modal (Thêm hoặc Sửa lô hàng)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  // Danh sách lô hàng mẫu chuẩn FEFO
  const [batches, setBatches] = useState([
    { batchId: 'LOT-001', productName: 'Sữa tươi Vinamilk 1L', importDate: '01/08/2026', expiryDate: '25/09/2026', stock: 15, status: 'Cận Date' },
    { batchId: 'LOT-002', productName: 'Bánh mì sandwich', importDate: '15/09/2026', expiryDate: '18/09/2026', stock: 0, status: 'Hết hạn' },
    { batchId: 'LOT-003', productName: 'Gạo thơm Jasmine 5kg', importDate: '10/06/2026', expiryDate: '10/06/2027', stock: 45, status: 'An toàn' },
  ]);

  // Form state đầy đủ tham khảo thị trường
  const [formData, setFormData] = useState({
    batchId: '',
    productName: '',
    importDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    stock: ''
  });

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingBatch(null);
    setFormData({
      batchId: '',
      productName: '',
      importDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      stock: ''
    });
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (batch) => {
    setEditingBatch(batch);
    setFormData({
      batchId: batch.batchId,
      productName: batch.productName,
      importDate: batch.importDate.split('/').reverse().join('-'), // Chuyển dd/mm/yyyy thành yyyy-mm-dd cho input date
      expiryDate: batch.expiryDate.split('/').reverse().join('-'),
      stock: batch.stock
    });
    setIsModalOpen(true);
  };

  // Xử lý Lưu (Thêm hoặc Cập nhật Lô)
  const handleSaveBatch = (e) => {
    e.preventDefault();
    
    // Format lại ngày tháng hiển thị đẹp mắt (DD/MM/YYYY)
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dateStr;
    };

    // Logic tự động đánh giá trạng thái Date (FEFO)
    const calculateStatus = (expiryStr) => {
      if (!expiryStr) return 'An toàn';
      const today = new Date();
      const expiry = new Date(expiryStr);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'Hết hạn';
      if (diffDays <= 7) return 'Cận Date';
      return 'An toàn';
    };

    const formattedBatch = {
      batchId: formData.batchId,
      productName: formData.productName,
      importDate: formatDate(formData.importDate),
      expiryDate: formatDate(formData.expiryDate),
      stock: Number(formData.stock),
      status: calculateStatus(formData.expiryDate)
    };

    if (editingBatch) {
      setBatches(batches.map(b => b.batchId === editingBatch.batchId ? formattedBatch : b));
    } else {
      setBatches([formattedBatch, ...batches]);
    }

    setIsModalOpen(false);
  };

  // Xử lý Xóa lô hàng
  const handleDeleteBatch = (batchId) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa lô hàng ${batchId} không?`)) {
      setBatches(batches.filter(b => b.batchId !== batchId));
    }
  };

  return (
    <div>
      {/* 3 THẺ KPI TỔNG QUAN */}
      <div className="erp-kpi-row" style={{ marginBottom: '24px' }}>
        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="erp-kpi-info">
            <h4 style={{ color: '#3b82f6', fontSize: '1.6rem', margin: 0 }}>{batches.length}</h4>
            <p style={{ color: '#64748b', margin: '5px 0 0 0', fontWeight: '600', fontSize: '0.8rem' }}>TỔNG SỐ LÔ HÀNG</p>
          </div>
        </div>
        
        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="erp-kpi-info">
            <h4 style={{ color: '#f59e0b', fontSize: '1.6rem', margin: 0 }}>{batches.filter(b => b.status === 'Cận Date').length}</h4>
            <p style={{ color: '#64748b', margin: '5px 0 0 0', fontWeight: '600', fontSize: '0.8rem' }}>LÔ HÀNG CẬN DATE (≤ 7 ngày)</p>
          </div>
        </div>

        <div className="erp-kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="erp-kpi-info">
            <h4 style={{ color: '#ef4444', fontSize: '1.6rem', margin: 0 }}>{batches.filter(b => b.status === 'Hết hạn').length}</h4>
            <p style={{ color: '#64748b', margin: '5px 0 0 0', fontWeight: '600', fontSize: '0.8rem' }}>LÔ HÀNG ĐÃ HẾT HẠN</p>
          </div>
        </div>
      </div>

      {/* THANH TÌM KIẾM & NÚT THÊM */}
      <div className="erp-page-header">
        <div className="erp-filters-group">
          <input 
            type="text" 
            className="erp-input" 
            placeholder="🔍 Tìm theo Mã lô hoặc Tên sản phẩm..." 
            style={{ width: '300px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="erp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>Tất cả trạng thái Date</option>
            <option>An toàn</option>
            <option>Cận Date</option>
            <option>Hết hạn</option>
          </select>
        </div>
        
        <button className="erp-btn-primary" onClick={handleOpenAddModal}>
          + Nhập Lô Hàng Mới
        </button>
      </div>

      {/* BẢNG LÔ HÀNG */}
      <div className="erp-table-container" style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table className="erp-table" style={{ minWidth: '850px' }}>
          <thead>
            <tr>
              <th>Mã Lô</th>
              <th>Sản phẩm</th>
              <th>Ngày nhập</th>
              <th>Hạn sử dụng</th>
              <th style={{ textAlign: 'right' }}>Tồn thực tế</th>
              <th>Trạng thái Date</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((item, index) => (
              <tr key={index}>
                <td style={{ fontWeight: '600', color: '#475569' }}>{item.batchId}</td>
                <td style={{ color: '#3b82f6', fontWeight: '500' }}>{item.productName}</td>
                <td>{item.importDate}</td>
                <td style={{ fontWeight: '600', color: item.status === 'Hết hạn' ? '#ef4444' : '#1e293b' }}>{item.expiryDate}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.stock}</td>
                <td>
                  <span className={`status-badge ${item.status === 'An toàn' ? 'success' : item.status === 'Cận Date' ? 'warning' : 'danger'}`}>
                    {item.status}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="erp-action-btn" title="Chỉnh sửa" onClick={() => handleOpenEditModal(item)}>✏️</button>
                    <button className="erp-action-btn delete" title="Xóa lô" onClick={() => handleDeleteBatch(item.batchId)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP MODAL ĐẦY ĐỦ THÔNG TIN (ĐÃ FIX LỖI THIẾU NGÀY NHẬP & KÍCH HOẠT NÚT SỬA/XÓA) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '450px', maxWidth: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>
              {editingBatch ? 'Chỉnh sửa thông tin Lô hàng' : 'Nhập Lô Hàng Mới (FEFO)'}
            </h3>
            
            <form onSubmit={handleSaveBatch} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Mã lô hàng</label>
                <input required disabled={editingBatch !== null} className="erp-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="VD: LOT-004" value={formData.batchId} onChange={e => setFormData({...formData, batchId: e.target.value})} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Tên sản phẩm</label>
                <input required className="erp-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Nhập tên sản phẩm..." value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Ngày nhập hàng</label>
                  <input required type="date" className="erp-input" style={{ width: '100%', boxSizing: 'border-box' }} value={formData.importDate} onChange={e => setFormData({...formData, importDate: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Hạn sử dụng</label>
                  <input required type="date" className="erp-input" style={{ width: '100%', boxSizing: 'border-box' }} value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>Số lượng tồn thực tế</label>
                <input required className="erp-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="0" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="erp-btn-primary" style={{ flex: 1, background: '#e2e8f0', color: '#475569', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="erp-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Lưu Lô Hàng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
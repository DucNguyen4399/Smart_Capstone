import React, { useState, useEffect } from 'react';

export default function BatchManagementPage() {
  const [batches, setBatches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [formData, setFormData] = useState({
    product_id: '', batch_number: '', import_date: '', expiry_date: '', original_qty: ''
  });

  const fetchBatches = () => {
    fetch('http://127.0.0.1:8000/api/v1/batches', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => { if(Array.isArray(data)) setBatches(data); })
    .catch(err => console.error(err));
  };

  useEffect(() => { fetchBatches(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/batches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          product_id: parseInt(formData.product_id),
          batch_number: formData.batch_number,
          import_date: formData.import_date,
          expiry_date: formData.expiry_date,
          original_qty: parseInt(formData.original_qty)
        })
      });
      if (!res.ok) throw new Error("Lỗi khi thêm lô hàng");
      alert("Nhập lô hàng thành công!");
      setIsModalOpen(false);
      setFormData({ product_id: '', batch_number: '', import_date: '', expiry_date: '', original_qty: '' });
      fetchBatches();
    } catch (error) { alert(error.message); }
  };

  const calculateDaysLeft = (expiryDate) => {
    if (!expiryDate) return 0;
    return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const filteredBatches = batches.filter(b => {
    const daysLeft = calculateDaysLeft(b.expiry_date);
    const safeBatchNumber = b.batch_number?.toLowerCase() || '';
    const safeProductName = b.product_name?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = safeBatchNumber.includes(searchLower) || safeProductName.includes(searchLower);
    
    if (filterStatus === 'EXPIRED') return matchesSearch && daysLeft < 0;
    if (filterStatus === 'WARNING') return matchesSearch && daysLeft >= 0 && daysLeft <= 7;
    if (filterStatus === 'SAFE') return matchesSearch && daysLeft > 7;
    return matchesSearch;
  });

  const kpiTotal = batches.length;
  const kpiWarning = batches.filter(b => {
    const d = calculateDaysLeft(b.expiry_date);
    return d >= 0 && d <= 7;
  }).length;
  const kpiExpired = batches.filter(b => calculateDaysLeft(b.expiry_date) < 0).length;

  return (
    <div>
      <div className="content-header">
        Quản lý Tồn kho & Lô hàng (Inventory Batches)
        <button className="btn-action btn-add" onClick={() => setIsModalOpen(true)}>+ Nhập Lô Hàng Mới</button>
      </div>

      <div className="mini-kpi-row">
        <div className="mini-kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="mini-kpi-label">Tổng số lô hàng</div>
          <div className="mini-kpi-value">{kpiTotal}</div>
        </div>
        <div className="mini-kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="mini-kpi-label">Lô hàng cận Date (≤ 7 ngày)</div>
          <div className="mini-kpi-value" style={{ color: '#d97706' }}>{kpiWarning}</div>
        </div>
        <div className="mini-kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="mini-kpi-label">Lô hàng đã hết hạn</div>
          <div className="mini-kpi-value" style={{ color: '#dc2626' }}>{kpiExpired}</div>
        </div>
      </div>

      <div className="filter-toolbar">
        <input 
          type="text" 
          className="search-box" 
          style={{ width: '400px' }}
          placeholder="🔍 Tìm theo Mã lô (Batch) hoặc Tên sản phẩm..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="ALL">Tất cả trạng thái Date</option>
          <option value="SAFE">🟢 An toàn (&gt; 7 ngày)</option>
          <option value="WARNING">🟠 Cận Date (≤ 7 ngày)</option>
          <option value="EXPIRED">🔴 Đã hết hạn</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã Lô</th>
              <th>Sản phẩm</th>
              <th>Ngày nhập</th>
              <th>Hạn sử dụng</th>
              <th>Tồn thực tế</th>
              <th>Trạng thái Date</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.length === 0 ? <tr><td colSpan="7" style={{textAlign: 'center', padding: '30px'}}>Không tìm thấy lô hàng nào phù hợp.</td></tr> : null}
            {filteredBatches.map(b => {
              const daysLeft = calculateDaysLeft(b.expiry_date);
              let badge = <span className="badge safe">🟢 Tốt</span>;
              if (daysLeft < 0) badge = <span className="badge danger">🔴 Hết hạn</span>;
              else if (daysLeft <= 7) badge = <span className="badge warning">🟠 Còn {daysLeft} ngày</span>;

              return (
                <tr key={b.id}>
                  <td><strong>{b.batch_number}</strong></td>
                  <td>{b.product_name}</td>
                  <td>{b.import_date}</td>
                  <td><strong>{b.expiry_date}</strong></td>
                  <td><strong style={{ color: b.current_qty === 0 ? '#ef4444' : '#10b981', fontSize: '1.1rem' }}>{b.current_qty}</strong> / {b.original_qty}</td>
                  <td>{badge}</td>
                  <td>
                    <button className="btn-action btn-edit">Sửa Qty</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📦 Phiếu Nhập Lô Hàng Mới</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>ID Sản Phẩm (Product ID)</label>
                    <input type="number" name="product_id" className="form-control" required value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Mã Lô (Batch Number)</label>
                    <input type="text" name="batch_number" className="form-control" placeholder="VD: BATCH-102026" required value={formData.batch_number} onChange={(e) => setFormData({...formData, batch_number: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Ngày Nhập</label>
                    <input type="date" name="import_date" className="form-control" required value={formData.import_date} onChange={(e) => setFormData({...formData, import_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Hạn Sử Dụng (Expiry Date)</label>
                    <input type="date" name="expiry_date" className="form-control" required value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Số Lượng Nhập (Original Qty)</label>
                    <input type="number" name="original_qty" className="form-control" required value={formData.original_qty} onChange={(e) => setFormData({...formData, original_qty: e.target.value})} />
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Hủy bỏ</button>
                  <button type="submit" className="btn-action btn-add">Xác nhận Nhập kho</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
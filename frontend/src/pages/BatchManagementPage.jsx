import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './BatchManagementPage.css';

export default function BatchManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái Date');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  // Danh sách lô hàng mẫu chuẩn FEFO
  const [batches, setBatches] = useState([]);

  const [products, setProducts] = useState([]);

  // 2. TỰ ĐỘNG LƯU VÀO localStorage MỖI KHI MẢNG `batches` CÓ THAY ĐỔI (Thêm, Sửa, Xóa)
  useEffect(() => {
    localStorage.setItem('batches_list', JSON.stringify(batches));
  }, [batches]);

  const [formData, setFormData] = useState({
    batchId: '',
    productId: '',
    productName: '',
    importDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    stock: '',
    warehouseLocation: 'Kho lạnh A',
  });
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  useEffect(() => {
    fetchBatches();
    fetchProducts();
  }, []);
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
  const filteredBatches = batches.filter((item) => {
    const keyword = searchTerm.toLowerCase().trim();

    const matchesSearch =
      item.batchId.toLowerCase().includes(keyword) ||
      item.productName.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === 'Tất cả trạng thái Date' ||
      item.status === statusFilter;

    const matchesWarehouse =
      warehouseFilter === 'all' ||
      item.location === warehouseFilter;

    return matchesSearch && matchesStatus && matchesWarehouse;
  });
  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://127.0.0.1:8000/api/v1/batches', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Không thể tải danh sách lô hàng (${response.status})`);
      }

      const data = await response.json();

      const formattedBatches = data.map((batch) => ({
        id: batch.id,
        batchId: batch.batch_number,
        productId: batch.product_id,
        productName: batch.product_name,
        importDate: batch.import_date,
        expiryDate: batch.expiry_date,
        stock: batch.current_qty,
        location: batch.warehouse_location || '',
        status: calculateStatus(batch.expiry_date),
      }));
      console.log('Dữ liệu batch từ backend:', data);
      console.log('Dữ liệu sau khi format:', formattedBatches);

      setBatches(formattedBatches);
    } catch (error) {
      console.error('Lỗi tải danh sách lô hàng:', error);
      console.error('Chi tiết lỗi:', error.message);

    }
  };
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://127.0.0.1:8000/api/v1/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Không thể tải danh sách sản phẩm (${response.status})`);
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Lỗi tải danh sách sản phẩm:', error);
    }
  };

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingBatch(null);

    setFormData({
      batchId: '',
      productId: '',
      productName: '',
      importDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      stock: '',
      warehouseLocation: 'Kho lạnh A'
    });

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (batch) => {
    setEditingBatch(batch);
    setFormData({
      batchId: batch.batchId,
      productId: String(batch.productId),
      importDate: batch.importDate.split('/').reverse().join('-'), // Chuyển dd/mm/yyyy thành yyyy-mm-dd cho input date
      expiryDate: batch.expiryDate.split('/').reverse().join('-'),
      stock: batch.stock,
      warehouseLocation: batch.location || ''
    });
    setIsModalOpen(true);
  };

  // Xử lý Lưu (Thêm hoặc Cập nhật Lô)
  const handleSaveBatch = async (e) => {
    e.preventDefault();

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dateStr;
    };

    try {
      const token = localStorage.getItem('token');

      if (editingBatch) {
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/batches/${editingBatch.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              batch_number: formData.batchId,
              expiry_date: formData.expiryDate,
              current_qty: Number(formData.stock),
              warehouse_location: formData.warehouseLocation,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Không thể cập nhật lô hàng');
        }

        alert('Cập nhật lô hàng thành công!');

        setIsModalOpen(false);
        setEditingBatch(null);

        fetchBatches();
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/v1/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: Number(formData.productId),
          batch_number: formData.batchId,
          import_date: formData.importDate,
          expiry_date: formData.expiryDate,
          original_qty: Number(formData.stock),
          warehouse_location: formData.warehouseLocation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Không thể thêm lô hàng');
      }

      alert('Nhập lô hàng thành công!');

      setIsModalOpen(false);

      // Tải lại danh sách từ database
      fetchBatches();

    } catch (error) {
      console.error('Lỗi thêm lô hàng:', error);
      alert(error.message);
    }
  };

  // Xử lý Xóa lô hàng
  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lô hàng ${batchId} không?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await axios.delete(
        `http://127.0.0.1:8000/api/v1/batches/${batchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Xóa lô hàng thành công');

      await fetchBatches();
    } catch (error) {
      console.error(
        'Lỗi xóa lô hàng:',
        error.response?.data || error
      );

      alert(
        error.response?.data?.detail ||
        'Xóa lô hàng thất bại'
      );
    }
  };

  const safeCount = batches.filter((b) => b.status === 'An toàn').length;
  const nearCount = batches.filter((b) => b.status === 'Cận Date').length;
  const expiredCount = batches.filter((b) => b.status === 'Hết hạn').length;
  const totalStock = batches.reduce((sum, b) => sum + (Number(b.stock) || 0), 0);
  return (
    <div className="batch-page">
      <div className="batch-page-header">
        <div className="batch-heading">
          <h1>Kiểm soát Lô hàng &amp; Hạn sử dụng</h1>
        </div>
        <div className="batch-header-actions">
          <button className="batch-export-btn" type="button" onClick={() => window.print()}>♧ <span>Xuất báo cáo<br />FEFO</span></button>
          <button className="batch-primary-btn" onClick={handleOpenAddModal}>＋ Nhập Lô Hàng Mới</button>
        </div>
      </div>

      <div className="batch-stats-grid">
        <div className="batch-stat-card stat-purple">
          <div className="batch-stat-top"><span>TỔNG SỐ LÔ HÀNG</span><small>↑ {batches.length} lô hiện có</small></div>
          <div className="batch-stat-value">{batches.length} <span>lô đang lưu kho</span></div>
          <div className="batch-stat-foot"><span>Số lượng tồn thực tế</span><b>{totalStock.toLocaleString('vi-VN')} đơn vị</b></div>
          
          
        </div>
        <div className="batch-stat-card stat-orange">
          <div className="batch-stat-top"><span>CẬN DATE (≤ 7 NGÀY)</span><small className="orange-tag">FEFO Ưu tiên</small></div>
          <div className="batch-stat-value">{nearCount} <span>lô cần thanh lý gấp</span></div>
          <p className="batch-stat-note">✓ Theo dõi và ưu tiên xuất trước</p>
          <div className="batch-stat-foot">Lô cần chú ý: <b>{nearCount}</b></div>
        </div>
        <div className="batch-stat-card stat-red">
          <div className="batch-stat-top"><span>LÔ ĐÃ HẾT HẠN</span><small className="red-tag">Tỷ lệ {batches.length ? ((expiredCount / batches.length) * 100).toFixed(1) : '0.0'}%</small></div>
          <div className="batch-stat-value">{expiredCount} <span>lô quá hạn sử dụng</span></div>
          <p className="batch-stat-note">✓ {expiredCount ? 'Cần kiểm tra và xử lý tồn đọng' : 'Không có thiệt hại tồn đọng'}</p>
          <div className="batch-stat-foot">Cần xử lý: <b>{expiredCount} lô</b></div>
        </div>
        <div className="batch-stat-card stat-green">
          <div className="batch-stat-top"><span>TỒN KHO AN TOÀN</span><small className="green-tag">Chỉ số FEFO</small></div>
          <div className="batch-stat-value green-value">{batches.length ? ((safeCount / batches.length) * 100).toFixed(1) : '0.0'}% <span>đạt chuẩn chất lượng</span></div>
          <div className="batch-progress green-progress"><i style={{ width: `${batches.length ? (safeCount / batches.length) * 100 : 0}%` }} /></div>
          <div className="batch-stat-foot">Lô an toàn: <b>{safeCount}/{batches.length}</b></div>
        </div>
      </div>

      <section className="batch-table-panel">
        <div className="batch-toolbar">
          <label className="batch-search">⌕ <input type="text" placeholder="Tìm theo Mã lô hoặc sản phẩm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></label>
          <select className="batch-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>Tất cả trạng thái Date</option><option>An toàn</option><option>Cận Date</option><option>Hết hạn</option>
          </select>
          <div className="batch-warehouse-pills">
            {[
              ['all', 'Tất cả kho'],
              ['Kho lạnh A', 'Kho lạnh A'],
              ['Kho lạnh B', 'Kho lạnh B'],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={warehouseFilter === value ? 'selected' : ''}
                onClick={() => setWarehouseFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="batch-count">Đang xem <b>{filteredBatches.length}/{batches.length}</b> lô</span>
        </div>

        <div className="batch-table-scroll">
          <table className="batch-data-table">
            <thead><tr>
              <th className="batch-check-col"><input type="checkbox" aria-label="Chọn tất cả" /></th>
              <th>MÃ LÔ</th><th>SẢN PHẨM</th><th>NGÀY NHẬP</th><th>HẠN SỬ DỤNG ↕</th>
              <th className="align-right">TỒN THỰC TẾ</th><th>VỊ TRÍ LƯU KHO</th><th>TRẠNG THÁI DATE</th><th>THAO TÁC</th>
            </tr></thead>
            <tbody>
              {filteredBatches.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" aria-label={`Chọn lô ${item.batchId}`} /></td>
                  <td><span className="batch-code"><i />{item.batchId}</span></td>
                  <td><div className="batch-product-cell"><div><b>{item.productName}</b><small>SKU: {products.find(p => p.id === Number(item.productId))?.sku || '—'}</small></div></div></td>
                  <td>{item.importDate}</td>
                  <td><div className={`batch-expiry ${item.status === 'Hết hạn' ? 'expired' : ''}`}><b>{item.expiryDate}</b><small className={item.status === 'An toàn' ? 'safe' : item.status === 'Cận Date' ? 'near' : 'expired-tag'}>{item.status}</small></div></td>
                  <td className="align-right"><b>{Number(item.stock).toLocaleString('vi-VN')}</b> <span className="batch-unit">đơn vị</span></td>
                  <td>
                    <span className="batch-location">
                      {item.location || 'Chưa gán vị trí'}
                    </span>
                  </td>
                  <td><span className={`batch-status ${item.status === 'An toàn' ? 'safe' : item.status === 'Cận Date' ? 'near' : 'expired'}`}><i />{item.status}</span></td>
                  <td><div className="batch-row-actions"><button type="button" className="batch-row-action" title="Chỉnh sửa" onClick={() => handleOpenEditModal(item)}>✎</button><button type="button" className="batch-row-action is-delete" title="Xóa" onClick={() => handleDeleteBatch(item.id)}>⌫</button></div></td>
                </tr>
              ))}
              {filteredBatches.length === 0 && <tr><td colSpan="9" className="batch-empty">Không tìm thấy lô hàng phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>
                  Tên sản phẩm
                </label>

                <select
                  required
                  className="erp-select"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={formData.productId}
                  onChange={(e) => {
                    const selectedProduct = products.find(
                      (product) => product.id === Number(e.target.value)
                    );

                    setFormData({
                      ...formData,
                      productId: e.target.value,
                      productName: selectedProduct ? selectedProduct.name : '',
                    });
                  }}
                >
                  <option value="">-- Chọn sản phẩm --</option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - SKU: {product.sku}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="warehouseLocation">Vị trí lưu kho</label>
                <select
                  id="warehouseLocation"
                  name="warehouseLocation"
                  value={formData.warehouseLocation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warehouseLocation: e.target.value,
                    })
                  }
                  required
                >
                  <option value="Kho lạnh A">Kho lạnh A</option>
                  <option value="Kho lạnh B">Kho lạnh B</option>
                </select>
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

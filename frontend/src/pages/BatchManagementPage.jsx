import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './BatchManagementPage.css';

export default function BatchManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái Date');
  
  // State quản lý Modal (Thêm hoặc Sửa lô hàng)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  // Danh sách lô hàng mẫu chuẩn FEFO
  const [batches, setBatches] = useState([]);

  const [products, setProducts] = useState([]);
  // Phân quyền quản lý lô hàng
  const role = localStorage.getItem('role');
  const canManageBatches = ['Admin', 'Store Manager'].includes(role);
  // Form state đầy đủ tham khảo thị trường
  const [formData, setFormData] = useState({
    batchId: '',
    productId: '',
    productName: '',
    importDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    stock: '',
    warehouseLocation: '',
  });
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

    return matchesSearch && matchesStatus;
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
      warehouseLocation: ''
    });

    setIsModalOpen(true);
  };

  const toInputDate = (value) => {
    if (!value) return '';
    const text = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
    const parts = text.split('/');
    return parts.length === 3 ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}` : '';
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (batch) => {
    setEditingBatch(batch);
    setFormData({
      batchId: batch.batchId,
      productId: String(batch.productId),
      importDate: toInputDate(batch.importDate),
      expiryDate: toInputDate(batch.expiryDate),
      stock: batch.stock,
      warehouseLocation: ''
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
          <button className="batch-export-btn" type="button" onClick={() => window.print()}>⇩ <span>Xuất báo cáo<br />FEFO</span></button>
          {canManageBatches && (
            <button
              className="batch-primary-btn"
              onClick={handleOpenAddModal}
            >
              ＋ Nhập Lô Hàng Mới
            </button>
          )}
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
          <label className="batch-search">⌕ <input type="text" placeholder="Tìm theo mã lô hoặc sản phẩm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></label>
          <select className="batch-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>Tất cả trạng thái Date</option><option>An toàn</option><option>Cận Date</option><option>Hết hạn</option>
          </select>
          <span className="batch-count">Đang xem <b>{filteredBatches.length}/{batches.length}</b> lô</span>
        </div>

        <div className="batch-table-scroll">
          <table className="batch-data-table">
            <thead><tr>
              <th className="batch-check-col"><input type="checkbox" aria-label="Chọn tất cả" /></th>
              <th>MÃ LÔ HÀNG</th><th>MÃ SKU / SẢN PHẨM</th><th>MÃ CỬA HÀNG</th><th>MÃ NHÀ CUNG CẤP</th><th>NGÀY NHẬP</th><th>NGÀY SẢN XUẤT</th><th>HẠN SỬ DỤNG</th>
              <th className="align-right">SỐ LƯỢNG TỒN</th><th>GIÁ NHẬP / ĐƠN VỊ</th><th>TỔNG GIÁ NHẬP LÔ</th><th>TRẠNG THÁI LÔ</th>{canManageBatches && (<th>THAO TÁC</th>)}
            </tr></thead>
            <tbody>
              {filteredBatches.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" aria-label={`Chọn lô ${item.batchId}`} /></td>
                  <td><span className="batch-code">{item.batchId}</span></td>
                  <td><div className="batch-product-cell"><div><b>{item.productName || '—'}</b><small>maSKU: {products.find(p => p.id === Number(item.productId))?.sku || item.maSKU || '—'}</small></div></div></td>
                  <td>{item.maCuaHang || '—'}</td>
                  <td>{item.maNhaCungCap || '—'}</td>
                  <td>{item.importDate || item.ngayNhap || '—'}</td>
                  <td>{item.ngaySanXuat || '—'}</td>
                  <td><div className={`batch-expiry ${item.status === 'Hết hạn' ? 'expired' : ''}`}><b>{item.expiryDate || item.hanSuDung || '—'}</b><small className={item.status === 'An toàn' ? 'safe' : item.status === 'Cận Date' ? 'near' : 'expired-tag'}>{item.status}</small></div></td>
                  <td className="align-right"><b>{Number(item.stock ?? item.soLuongTon ?? 0).toLocaleString('vi-VN')}</b> <span className="batch-unit">{item.maDonViBan || 'đơn vị'}</span></td>
                  <td>{item.giaNhapMoiDonVi != null ? Number(item.giaNhapMoiDonVi).toLocaleString('vi-VN') + ' ₫' : '—'}</td>
                  <td>{item.giaNhapTongLo != null ? Number(item.giaNhapTongLo).toLocaleString('vi-VN') + ' ₫' : '—'}</td>
                  <td><span className={`batch-status ${item.status === 'An toàn' ? 'safe' : item.status === 'Cận Date' ? 'near' : 'expired'}`}><i />{item.trangThaiLo || item.status}</span></td>
                  <td>
                    {canManageBatches && (
                      <div className="batch-row-actions">
                        <button
                          type="button"
                          className="batch-row-action"
                          title="Chỉnh sửa"
                          onClick={() => handleOpenEditModal(item)}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="batch-row-action is-delete"
                          title="Xóa"
                          onClick={() => handleDeleteBatch(item.id)}
                        >
                          ⌫
                        </button>
                      </div>
                    )}
                  </td>                </tr>
              ))}
              {filteredBatches.length === 0 && <tr><td colSpan="13" className="batch-empty">Không tìm thấy lô hàng phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="batch-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <section className="batch-modal" role="dialog" aria-modal="true" aria-labelledby="batch-modal-title">
            <div className="batch-modal-header">
              <div>
                <p className="batch-modal-eyebrow">QUẢN LÝ KHO HÀNG</p>
                <h2 id="batch-modal-title">{editingBatch ? 'Sửa thông tin lô hàng' : 'Nhập lô hàng mới'}</h2>
              </div>
              <button type="button" className="batch-modal-close" aria-label="Đóng" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSaveBatch} className="batch-form">
              <div className="batch-form-section-title">Thông tin cơ bản</div>
              <div className="batch-form-grid">
                <div className="batch-form-field">
                  <label htmlFor="batchId">Mã lô hàng <span>(maLoHang)</span></label>
                  <input id="batchId" required disabled={editingBatch !== null} className="erp-input" placeholder="VD: LH202610_0001" value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} />
                </div>

                <div className="batch-form-field">
                  <label htmlFor="productId">Sản phẩm / mã SKU <span>(maSKU)</span></label>
                  <select id="productId" required disabled={editingBatch !== null} className="erp-select" value={formData.productId} onChange={(e) => {
                    const selectedProduct = products.find((product) => product.id === Number(e.target.value));
                    setFormData({ ...formData, productId: e.target.value, productName: selectedProduct ? selectedProduct.name : '' });
                  }}>
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name} - SKU: {product.sku}</option>)}
                  </select>
                  {editingBatch && <small className="batch-field-hint">Không đổi sản phẩm của lô đã tạo.</small>}
                </div>

                {!editingBatch && <div className="batch-form-field">
                  <label htmlFor="importDate">Ngày nhập <span>(ngayNhap)</span></label>
                  <input id="importDate" required type="date" className="erp-input" value={formData.importDate} onChange={(e) => setFormData({ ...formData, importDate: e.target.value })} />
                </div>}

                <div className="batch-form-field">
                  <label htmlFor="expiryDate">Hạn sử dụng <span>(hanSuDung)</span></label>
                  <input id="expiryDate" required type="date" className="erp-input" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                </div>

                <div className="batch-form-field">
                  <label htmlFor="stock">{editingBatch ? 'Số lượng tồn' : 'Số lượng nhập ban đầu'} <span>({editingBatch ? 'soLuongTon' : 'soLuongNhap'})</span></label>
                  <input id="stock" required min="0" step="1" type="number" className="erp-input" placeholder="Nhập số lượng" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
                </div>
              </div>

              <div className="batch-form-actions">
                <button type="button" className="batch-modal-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="batch-modal-submit">{editingBatch ? 'Lưu thay đổi' : 'Tạo lô hàng'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';

export default function StockImportPage() {
  const [uploadMsg, setUploadMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFileName(e.target.files[0].name);
      setUploadMsg(''); // Reset thông báo khi chọn file mới
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const fileInput = e.target.csvFile;
    if (!fileInput.files[0]) {
      alert("Vui lòng chọn file trước khi tải lên!");
      return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/sales/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Lỗi tải file");
      
      setUploadMsg(data.message);
      setIsSuccess(true);
    } catch (err) {
      setUploadMsg(err.message);
      setIsSuccess(false);
    }
  };

  return (
    <div className="import-container">
      {/* CỘT TRÁI: KHUNG UPLOAD FILE */}
      <div className="upload-card">
        <h3>Tải lên dữ liệu giao dịch</h3>
        <p className="upload-desc">
          Hệ thống sẽ phân tích tệp lịch sử bán hàng để chạy mô hình AI Dự báo nhu cầu (Demand Forecasting) và tính toán bổ sung hàng tồn kho một cách tự động.
        </p>

        <form onSubmit={handleUpload}>
          <div className="upload-dropzone" onClick={() => document.getElementById('fileInput').click()}>
            <div className="upload-icon">📄</div>
            <p style={{ fontWeight: '700', color: '#1e293b', marginBottom: '8px', fontSize: '1.05rem' }}>
              {selectedFileName ? selectedFileName : 'Nhấp để chọn hoặc kéo thả file vào đây'}
            </p>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Hỗ trợ định dạng .csv, .xlsx (Tối đa 10MB)
            </span>
            
            <input 
              id="fileInput"
              type="file" 
              name="csvFile" 
              accept=".csv, .xlsx" 
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-action btn-add" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
              🚀 Tiến hành Import Hệ thống
            </button>
          </div>
        </form>

        {uploadMsg && (
          <div className={isSuccess ? "badge safe" : "badge danger"} style={{ marginTop: '20px', padding: '12px 16px', display: 'flex', width: '100%', fontSize: '0.9rem' }}>
            {isSuccess ? '✅ ' : '❌ '} {uploadMsg}
          </div>
        )}
      </div>

      {/* CỘT PHẢI: HƯỚNG DẪN CẤU TRÚC FILE MẪU */}
      <div className="file-template-card">
        <h4>📋 Quy chuẩn cấu trúc File dữ liệu</h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Để hệ thống đọc chính xác, file tải lên của bạn cần tuân thủ các tên cột tiêu chuẩn (Header) sau đây:
        </p>

        <table className="template-table">
          <thead>
            <tr>
              <th>Tên cột (Header)</th>
              <th>Kiểu dữ liệu</th>
              <th>Mô tả chi tiết</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>sku</code></td>
              <td>Text</td>
              <td>Mã định danh sản phẩm</td>
            </tr>
            <tr>
              <td><code>date</code></td>
              <td>YYYY-MM-DD</td>
              <td>Ngày phát sinh giao dịch bán</td>
            </tr>
            <tr>
              <td><code>quantity_sold</code></td>
              <td>Number</td>
              <td>Số lượng sản phẩm bán ra</td>
            </tr>
            <tr>
              <td><code>unit_price</code></td>
              <td>Float</td>
              <td>Giá bán thực tế tại thời điểm</td>
            </tr>
          </tbody>
        </table>
        
        <div className="tip-box">
          <span style={{ fontSize: '1.2rem' }}>💡</span>
          <div>
            <strong>Mẹo quan trọng:</strong> Đảm bảo dòng đầu tiên của file Excel/CSV là tên các cột chính xác như bảng trên (không viết hoa, không dấu cách) để tránh lỗi hệ thống từ chối dữ liệu.
          </div>
        </div>
      </div>
    </div>
  );
}
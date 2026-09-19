import React, { useState } from 'react';

export default function StockImportPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // Xử lý khi chọn file qua thẻ input ẩn
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadStatus(`Đã chọn file: ${file.name}`);
    }
  };

  // Xử lý nút Import hệ thống
  const handleImportSubmit = () => {
    if (!selectedFile) {
      alert('Vui lòng chọn tệp tin (.csv hoặc .xlsx) trước khi tiến hành Import!');
      return;
    }
    alert(`Thành công! Đang tải lên và xử lý tệp: ${selectedFile.name}`);
    // Sau này bạn sẽ viết logic gọi API Axios gửi file lên Backend FastAPI tại đây
  };

  return (
    <div className="erp-panel">
      <div className="erp-panel-title">Tải lên dữ liệu giao dịch</div>
      <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.95rem' }}>
        Hệ thống sẽ phân tích tệp lịch sử bán hàng để chạy mô hình AI Dự báo nhu cầu (Demand Forecasting) và tính toán bổ sung hàng tồn kho một cách tự động.
      </p>

      {/* KHU VỰC KÉO THẢ VÀ BẤM CHỌN FILE THỰC TẾ */}
      <label style={{ 
        display: 'block', 
        border: '2px dashed #cbd5e1', 
        padding: '50px 20px', 
        textAlign: 'center', 
        borderRadius: '12px', 
        backgroundColor: '#f8fafc', 
        marginBottom: '24px', 
        cursor: 'pointer' 
      }}>
        <input 
          type="file" 
          accept=".csv, .xlsx, .xls" 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
        <div style={{ fontSize: '2.5rem', marginBottom: '12px', color: '#94a3b8' }}>📄</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.2rem' }}>
          {selectedFile ? selectedFile.name : 'Nhấp để chọn hoặc kéo thả file vào đây'}
        </h3>
        <p style={{ color: selectedFile ? '#16a34a' : '#94a3b8', margin: 0, fontSize: '0.9rem', fontWeight: selectedFile ? '600' : 'normal' }}>
          {uploadStatus || 'Hỗ trợ định dạng .csv, .xlsx (Tối đa 10MB)'}
        </p>
      </label>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <button className="erp-btn-primary" onClick={handleImportSubmit}>
          Tiến hành Import Hệ thống
        </button>
      </div>

      {/* BẢNG QUY CHUẨN FILE */}
      <div className="erp-panel-title">Quy chuẩn cấu trúc File dữ liệu</div>
      <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '0.9rem' }}>
        Để hệ thống đọc chính xác, file tải lên của bạn cần tuân thủ các tên cột tiêu chuẩn (Header) sau đây:
      </p>
      
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Tên cột (Header)</th>
              <th>Kiểu dữ liệu</th>
              <th>Mô tả chi tiết</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#ef4444', fontWeight: 'bold' }}>sku</code></td>
              <td>Text</td>
              <td>Mã định danh sản phẩm (Ví dụ: SP001)</td>
            </tr>
            <tr>
              <td><code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#ef4444', fontWeight: 'bold' }}>date</code></td>
              <td>YYYY-MM-DD</td>
              <td>Ngày phát sinh giao dịch bán hàng</td>
            </tr>
            <tr>
              <td><code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#ef4444', fontWeight: 'bold' }}>quantity_sold</code></td>
              <td>Number</td>
              <td>Số lượng sản phẩm bán ra</td>
            </tr>
            <tr>
              <td><code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#ef4444', fontWeight: 'bold' }}>unit_price</code></td>
              <td>Float</td>
              <td>Giá bán thực tế tại thời điểm giao dịch</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
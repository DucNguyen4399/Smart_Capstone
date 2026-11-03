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
    
    // Lưu lịch sử import vào localStorage để đồng bộ với Dashboard
    const existingImports = JSON.parse(localStorage.getItem('import_history')) || [];
    const newImport = { fileName: selectedFile.name, date: new Date().toLocaleDateString('vi-VN') };
    localStorage.setItem('import_history', JSON.stringify([newImport, ...existingImports]));

    alert(`Thành công! Đang tải lên và xử lý tệp: ${selectedFile.name}`);
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
    </header>

    {notice && <div className="sd-notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}

    <section className="sd-metrics">
      <Metric label="Đề xuất bổ sung hàng" value="02" note="!　Ưu tiên cao SP001 (Sữa tươi)" icon="🛒" color="blue"/>
      <Metric label="Đề xuất giảm giá (Markdown)" value="01" note="▣　Hết hạn trong 72h tới" icon="％" color="orange"/>
      <Metric label="Dự kiến chi phí nhập" value="8.500.000" suffix=" đ" note="↗　Tối ưu ROI theo chu kỳ bán" icon="▣" color="blue"/>
      <Metric label="Dự kiến thu hồi vốn markdown" value="1.250.000" suffix=" đ" note="◉　Giảm thiểu 92% rủi ro hủy hàng" icon="♧" color="green"/>
    </section>

    <section className="sd-panel">
      <div className="sd-panel-head">
        <div className="sd-title-icon blue-bg">▣</div>
        <div><h2>Đề xuất bổ sung hàng (Restock)</h2><p>Được tạo tự động theo dữ liệu bán hàng 30 ngày qua và lượng tồn an toàn</p></div>
        <span className="sd-updated">Cập nhật: hôm nay, {updatedAt}</span>
      </div>
      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead><tr><th>SẢN PHẨM</th><th>TỒN KHO</th><th>NHU CẦU<br/>DỰ BÁO</th><th>SỐ LƯỢNG<br/>ĐỀ XUẤT</th><th>MỨC ƯU TIÊN</th><th>THAO TÁC</th></tr></thead>
          <tbody>{restockRows.map(row => <tr key={row.sku}>
            <td><div className="sd-product"><span className={`sd-sku ${row.tone}`}>{row.sku}</span><div><strong>{row.sku} - {row.name}</strong><small>Nhà cung cấp: {row.supplier}</small></div></div></td>
            <td><span className="sd-pill neutral">{row.stock}</span></td><td><span className="sd-pill neutral">{row.demand}</span></td><td><span className="sd-pill blue-pill">{row.qty}</span></td>
            <td><span className={`sd-priority ${row.tone}`}>● {row.priority}</span></td>
            <td><div className="sd-actions"><button className="sd-btn sd-btn-soft" onClick={() => setNotice(`Giải thích đề xuất ${row.sku}: nhu cầu dự báo cao hơn tồn kho hiện tại.`)}>ⓘ Vì sao đề xuất?</button><button className="sd-btn sd-btn-primary sd-create" onClick={() => createImport(row)}>＋ Tạo đơn nhập</button></div></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="sd-panel-foot"><span>✣　Công thức AI cân nhắc: Lead time nhà cung ứng + Xu hướng mua sắm theo mùa</span><span>Hiển thị 2/2 đề xuất</span></div>
    </section>

    <section className="sd-panel sd-markdown-panel">
      <div className="sd-panel-head">
        <div className="sd-title-icon red-bg">◇</div>
        <div><h2>Đề xuất giảm giá / Markdown</h2><p>Giải phóng kho cho các mặt hàng cận hạn sử dụng hoặc tốc độ lưu kho chậm</p></div>
        <span className="sd-alert">⚠ Cần xử lý trước 24h</span>
      </div>
      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead><tr><th>SẢN PHẨM</th><th>MÃ LÔ</th><th>TỒN KHO</th><th>CÒN HẠN</th><th>GIẢM GIÁ<br/>ĐỀ XUẤT</th><th>GIÁ SAU<br/>GIẢM</th><th>THAO TÁC</th></tr></thead>
          <tbody>{markdownRows.map(row => <tr key={row.sku}>
            <td><div className="sd-product"><span className="sd-sku pink">{row.sku}</span><div><strong>{row.sku} - {row.name}</strong><small>{row.supplier}</small></div></div></td>
            <td><span className="sd-pill neutral">{row.lot}</span></td><td>{row.stock}</td><td><span className="sd-priority high">◷ {row.expiry}</span></td><td><span className="sd-pill red-pill">{row.discount}</span></td>
            <td><strong>{row.price}</strong><small className="sd-old-price">{row.oldPrice}</small></td>
            <td><div className="sd-actions"><button className="sd-btn sd-btn-soft" onClick={() => setNotice(`Sản phẩm ${row.sku} còn ${row.expiry}; giảm ${row.discount} để hạn chế hàng hủy.`)}>ⓘ Vì sao đề xuất?</button><button className={`sd-btn ${applied ? "sd-btn-primary" : "sd-btn-danger"}`} onClick={() => applyMarkdown(row)}>{applied ? "✓ Đã chọn" : "◇ Áp dụng giảm giá"}</button></div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  </main>;
}

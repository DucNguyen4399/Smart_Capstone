
import React, { useState } from "react";
import {
  RefreshCw,
  ShoppingCart,
  Percent,
  Wallet,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  Info,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  ClipboardList,
} from "lucide-react";
import "./StockImportPage.css";

const initialRestockRows = [
  {
    sku: "SP001",
    name: "Sữa tươi thanh trùng 1L",
    supplier: "Vinamilk Mart",
    stock: "20 hộp",
    demand: "80 hộp",
    qty: 60,
    unit: "hộp",
    priority: "Cao",
    tone: "high",
  },
  {
    sku: "SP002",
    name: "Nước ngọt lon 330ml",
    supplier: "Coca-Cola VN",
    stock: "45 lon",
    demand: "60 lon",
    qty: 15,
    unit: "lon",
    priority: "Trung bình",
    tone: "medium",
  },
];

const markdownRows = [
  {
    sku: "SP003",
    name: "Sữa chua các vị đường 100g",
    supplier: "Khu vực: Kệ lạnh L02",
    lot: "LOT20260901",
    stock: "35 hũ",
    expiry: "3 ngày",
    discount: "-20%",
    price: "12.000 đ",
    oldPrice: "15.000 đ",
  },
];

function Metric({ label, value, suffix, note, icon: Icon, color = "blue" }) {
  return (
    <article className="sd-metric">
      <div className="sd-metric-copy">
        <div className="sd-label">{label}</div>
        <div className={`sd-value ${color === "green" ? "green" : ""}`}>
          {value}<small>{suffix}</small>
        </div>
      </div>
      <span className={`sd-icon sd-icon-${color}`}>
        <Icon size={20} strokeWidth={2} />
      </span>
      <div
        className={`sd-note ${
          color === "orange" ? "orange" : color === "green" ? "green" : ""
        }`}
      >
        {note}
      </div>
    </article>
  );
}

export default function StockImportPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [notice, setNotice] = useState('');
  const [applied, setApplied] = useState(false);

  // Mock data cho phần AI dự báo / đề xuất
  const updatedAt = "Hôm nay 09:30";
  const restockRows = [
    { sku: 'SP001', name: 'Sữa tươi tiệt trùng 1L', supplier: 'Vinamilk', stock: 15, demand: 80, qty: 65, priority: 'Cao', tone: 'high' },
    { sku: 'SP002', name: 'Bánh mì sandwich', supplier: 'Kinh Đô', stock: 5, demand: 30, qty: 25, priority: 'Trung bình', tone: 'medium' }
  ];

  const markdownRows = [
    { sku: 'SP005', name: 'Yến mạch trái cây', supplier: 'Quaker', lot: 'LOT-992', stock: 12, expiry: '3 ngày', discount: '30%', price: '45.000đ', oldPrice: '65.000đ' }
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadStatus(`Đã chọn file: ${file.name}`);
    }
  };

  const handleImportSubmit = () => {
    if (!selectedFile) {
      alert('Vui lòng chọn tệp tin (.csv hoặc .xlsx) trước khi tiến hành Import!');
      return;
    }
    
    const existingImports = JSON.parse(localStorage.getItem('import_history')) || [];
    const newImport = { fileName: selectedFile.name, date: new Date().toLocaleDateString('vi-VN') };
    localStorage.setItem('import_history', JSON.stringify([newImport, ...existingImports]));

    alert(`Thành công! Đang tải lên và xử lý tệp: ${selectedFile.name}`);
  };

  const createImport = (row) => {
    alert(`Đã tạo đơn nhập hàng cho sản phẩm: ${row.name}`);
  };

  const applyMarkdown = (row) => {
    setApplied(!applied);
    setNotice(`Đã áp dụng giảm giá cho ${row.sku}`);
  };

  return (
    <div className="erp-page" style={{ padding: '20px' }}>
      <div className="erp-panel">
        <div className="erp-panel-title">Tải lên dữ liệu giao dịch</div>
        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.95rem' }}>
          Hệ thống sẽ phân tích tệp lịch sử bán hàng để chạy mô hình AI Dự báo nhu cầu (Demand Forecasting) và tính toán bổ sung hàng tồn kho một cách tự động.
        </p>

        {/* KHU VỰC KÉO THẢ FILE */}
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
          <button className="erp-btn-primary" onClick={handleImportSubmit} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Tiến hành Import Hệ thống
          </button>
        </div>
      </div>

      {notice && (
        <div className="sd-notice" role="status" style={{ background: '#eff6ff', padding: '10px', margin: '15px 0', borderRadius: '6px' }}>
          {notice} <button onClick={() => setNotice("")} style={{ marginLeft: '10px', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* PHẦN HIỂN THỊ KẾT QUẢ AI & ĐỀ XUẤT */}
      <main style={{ marginTop: '20px' }}>
        <section className="sd-panel">
          <div className="sd-panel-head">
            <div><h2>Đề xuất bổ sung hàng (Restock)</h2><p>Được tạo tự động theo dữ liệu bán hàng 30 ngày qua và lượng tồn an toàn</p></div>
            <span className="sd-updated">Cập nhật: {updatedAt}</span>
          </div>
          <div className="sd-table-wrap">
            <table className="sd-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th>SẢN PHẨM</th><th>TỒN KHO</th><th>NHU CẦU DỰ BÁO</th><th>SL ĐỀ XUẤT</th><th>MỨC ƯU TIÊN</th><th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {restockRows.map(row => (
                  <tr key={row.sku} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td>
                      <div><strong>{row.sku} - {row.name}</strong><small style={{ display: 'block', color: '#64748b' }}>NCC: {row.supplier}</small></div>
                    </td>
                    <td>{row.stock}</td>
                    <td>{row.demand}</td>
                    <td>{row.qty}</td>
                    <td>{row.priority}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="sd-btn sd-btn-soft" onClick={() => setNotice(`Giải thích đề xuất ${row.sku}: nhu cầu dự báo cao hơn tồn kho.`)}>ⓘ Vì sao?</button>
                        <button className="sd-btn sd-btn-primary" onClick={() => createImport(row)}>＋ Tạo đơn</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sd-panel sd-markdown-panel" style={{ marginTop: '30px' }}>
          <div className="sd-panel-head">
            <div><h2>Đề xuất giảm giá / Markdown</h2><p>Giải phóng kho cho các mặt hàng cận hạn sử dụng</p></div>
          </div>
          <div className="sd-table-wrap">
            <table className="sd-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th>SẢN PHẨM</th><th>MÃ LÔ</th><th>TỒN KHO</th><th>CÒN HẠN</th><th>GIẢM GIÁ</th><th>GIÁ SAU GIẢM</th><th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {markdownRows.map(row => (
                  <tr key={row.sku} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td><div><strong>{row.sku} - {row.name}</strong><small style={{ display: 'block', color: '#64748b' }}>{row.supplier}</small></div></td>
                    <td>{row.lot}</td>
                    <td>{row.stock}</td>
                    <td>{row.expiry}</td>
                    <td>{row.discount}</td>
                    <td><strong>{row.price}</strong> <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{row.oldPrice}</span></td>
                    <td>
                      <button className="sd-btn sd-btn-danger" onClick={() => applyMarkdown(row)}>
                        {applied ? "✓ Đã chọn" : "◇ Áp dụng"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
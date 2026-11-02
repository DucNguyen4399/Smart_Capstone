import React, { useState } from "react";
import "./StockImportPage.css";

const restockRows = [
  { sku: "SP001", name: "Sữa tươi thanh trùng 1L", supplier: "Vinamilk Mart", stock: "20 hộp", demand: "80 hộp", qty: "+60 hộp", priority: "Cao", tone: "high" },
  { sku: "SP002", name: "Nước ngọt lon 330ml", supplier: "Coca-Cola VN", stock: "45 lon", demand: "60 lon", qty: "+15 lon", priority: "Trung bình", tone: "medium" },
];
const markdownRows = [
  { sku: "SP003", name: "Sữa chua các vị đường 100g", supplier: "Khu vực: Kệ lạnh L02", lot: "LOT20260901", stock: "35 hũ", expiry: "3 ngày", discount: "-20%", price: "12.000 đ", oldPrice: "15.000 đ" },
];

function Icon({ children, className = "" }) {
  return <span aria-hidden="true" className={`sd-icon ${className}`}>{children}</span>;
}
function Metric({ label, value, suffix, note, icon, color = "blue" }) {
  return <article className="sd-metric">
    <div className="sd-metric-copy"><div className="sd-label">{label}</div><div className={`sd-value ${color === "green" ? "green" : ""}`}>{value}<small>{suffix}</small></div></div>
    <Icon className={`sd-icon-${color}`}>{icon}</Icon>
    <div className={`sd-note ${color === "orange" ? "orange" : color === "green" ? "green" : ""}`}>{note}</div>
  </article>;
}

export default function StockDashboard() {
  const [notice, setNotice] = useState("");
  const [updatedAt, setUpdatedAt] = useState("08:30");
  const [applied, setApplied] = useState(false);

  const refresh = () => {
    const now = new Date();
    setUpdatedAt(now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
    setNotice("Đã làm mới phân tích (dữ liệu mẫu).");
  };
  const createImport = (row) => setNotice(`Đã chọn tạo đơn nhập cho ${row.sku} — ${row.name}. Hãy kết nối API để lưu đơn thực tế.`);
  const applyMarkdown = (row) => {
    setApplied(true);
    setNotice(`Đã chọn áp dụng giảm giá cho ${row.sku}. Hãy kết nối API/POS để cập nhật giá thực tế.`);
  };

  return <main className="stock-dashboard">
    <header className="sd-header">
      <div className="sd-header-actions">
        <button className="sd-btn sd-btn-light" onClick={refresh}>↻ <span>Làm mới<br/> phân tích</span></button>
        <button className="sd-btn sd-btn-primary" onClick={() => setNotice("Đã chọn duyệt & tạo đơn nhập tất cả. Cần kết nối API để thực hiện lưu dữ liệu.")}>☷ <span>Duyệt &amp; Tạo đơn<br/> nhập tất cả</span></button>
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

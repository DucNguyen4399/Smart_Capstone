
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
  const [notice, setNotice] = useState("");
  const [updatedAt, setUpdatedAt] = useState("08:30");
  const [restockRows, setRestockRows] = useState(initialRestockRows);
  const [expandedRestock, setExpandedRestock] = useState([]);
  const [expandedMarkdown, setExpandedMarkdown] = useState([]);
  const [appliedRows, setAppliedRows] = useState([]);
  const [confirmAll, setConfirmAll] = useState(false);

  const refresh = () => {
    const now = new Date();
    setUpdatedAt(
      now.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    setNotice("Đã làm mới phân tích (dữ liệu mẫu).");
  };

  const updateQty = (sku, value) => {
    setRestockRows((rows) =>
      rows.map((row) =>
        row.sku === sku
          ? { ...row, qty: Math.max(0, Number(value) || 0) }
          : row
      )
    );
  };

  const toggleExpanded = (sku, setter, current) => {
    setter(
      current.includes(sku)
        ? current.filter((item) => item !== sku)
        : [...current, sku]
    );
  };

  const createImport = (row) => {
    setNotice(
      `Đã chọn tạo đơn nhập cho ${row.sku} — ${row.name}, số lượng ${row.qty} ${row.unit}. Cần kết nối API để lưu đơn thực tế.`
    );
  };

  const applyMarkdown = (row) => {
    setAppliedRows((current) =>
      current.includes(row.sku) ? current : [...current, row.sku]
    );
    setNotice(
      `Đã chọn áp dụng giảm giá cho ${row.sku}. Cần kết nối API/POS để cập nhật giá thực tế.`
    );
  };

  const approveAll = () => {
    setConfirmAll(false);
    setNotice(
      `Đã xác nhận duyệt ${restockRows.length} đề xuất nhập hàng. Cần kết nối API để tạo đơn thực tế.`
    );
  };

  return (
    <section className="stock-dashboard">
      <header className="sd-header">
        <div className="sd-header-actions">
          <button className="sd-btn sd-btn-light" onClick={refresh}>
            <RefreshCw size={17} />
            Làm mới phân tích
          </button>
          <button
            className="sd-btn sd-btn-primary"
            onClick={() => setConfirmAll(true)}
          >
            <ClipboardList size={17} />
            Duyệt & tạo đơn nhập tất cả
          </button>
        </div>
      </header>

      {notice && (
        <div className="sd-notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Đóng thông báo"
            onClick={() => setNotice("")}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <section className="sd-metrics">
        <Metric
          label="Đề xuất bổ sung hàng"
          value="02"
          note="Ưu tiên cao: SP001 – Sữa tươi"
          icon={ShoppingCart}
          color="blue"
        />
        <Metric
          label="Đề xuất giảm giá (Markdown)"
          value="01"
          note="Hết hạn trong 72 giờ tới"
          icon={Percent}
          color="orange"
        />
        <Metric
          label="Dự kiến chi phí nhập"
          value="8.500.000"
          suffix=" đ"
          note="Tối ưu theo chu kỳ bán hàng"
          icon={Wallet}
          color="blue"
        />
        <Metric
          label="Dự kiến thu hồi vốn markdown"
          value="1.250.000"
          suffix=" đ"
          note="Giảm thiểu rủi ro hủy hàng"
          icon={TrendingUp}
          color="green"
        />
      </section>

      <section className="sd-panel">
        <div className="sd-panel-head">
          <div className="sd-title-icon blue-bg">
            <Package size={19} />
          </div>
          <div className="sd-panel-heading">
            <h2>Đề xuất bổ sung hàng (Restock)</h2>
            <p>
              Dựa trên dữ liệu bán hàng 30 ngày và lượng tồn kho an toàn
            </p>
          </div>
          <span className="sd-updated">
            Cập nhật: hôm nay, {updatedAt}
          </span>
        </div>

        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead>
              <tr>
                <th>SẢN PHẨM</th>
                <th>TỒN KHO</th>
                <th>NHU CẦU DỰ BÁO</th>
                <th>SỐ LƯỢNG ĐỀ XUẤT</th>
                <th>MỨC ƯU TIÊN</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {restockRows.map((row) => (
                <React.Fragment key={row.sku}>
                  <tr>
                    <td>
                      <div className="sd-product">
                        <div>
                          <strong>{row.name}</strong>
                          <small>
                            SKU: {row.sku} · Nhà cung cấp: {row.supplier}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sd-pill neutral">{row.stock}</span>
                    </td>
                    <td>
                      <span className="sd-pill neutral">{row.demand}</span>
                    </td>
                    <td>
                      <div className="sd-qty-control">
                        <input
                          type="number"
                          min="0"
                          aria-label={`Số lượng nhập đề xuất ${row.sku}`}
                          value={row.qty}
                          onChange={(e) => updateQty(row.sku, e.target.value)}
                        />
                        <span>{row.unit}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`sd-priority ${row.tone}`}>
                        <span className="sd-priority-dot" />
                        {row.priority}
                      </span>
                    </td>
                    <td>
                      <div className="sd-actions">
                        <button
                          className="sd-btn sd-btn-soft"
                          onClick={() =>
                            toggleExpanded(
                              row.sku,
                              setExpandedRestock,
                              expandedRestock
                            )
                          }
                        >
                          <Info size={15} />
                          Vì sao?
                          {expandedRestock.includes(row.sku) ? (
                            <ChevronUp size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                        </button>
                        <button
                          className="sd-btn sd-btn-primary sd-create"
                          onClick={() => createImport(row)}
                          disabled={row.qty <= 0}
                        >
                          <Plus size={16} />
                          Tạo đơn nhập
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRestock.includes(row.sku) && (
                    <tr className="sd-detail-row">
                      <td colSpan="6">
                        <div className="sd-detail-content">
                          <Info size={17} />
                          <div>
                            <strong>Lý do đề xuất nhập hàng</strong>
                            <p>
                              Nhu cầu dự báo ({row.demand}) cao hơn lượng tồn
                              hiện tại ({row.stock}). Đề xuất bổ sung {row.qty}{" "}
                              {row.unit} để đáp ứng nhu cầu bán hàng dự kiến.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sd-panel-foot">
          <span>
            <TrendingUp size={15} />
            AI cân nhắc thời gian cung ứng và xu hướng mua sắm theo mùa
          </span>
          <span>
            Hiển thị {restockRows.length}/{restockRows.length} đề xuất
          </span>
        </div>
      </section>

      <section className="sd-panel sd-markdown-panel">
        <div className="sd-panel-head">
          <div className="sd-title-icon red-bg">
            <AlertTriangle size={19} />
          </div>
          <div className="sd-panel-heading">
            <h2>Đề xuất giảm giá / Markdown</h2>
            <p>
              Giải phóng kho cho mặt hàng cận hạn hoặc có tốc độ lưu kho chậm
            </p>
          </div>
          <span className="sd-alert">
            <Clock size={15} />
            Cần xử lý trước 24h
          </span>
        </div>

        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead>
              <tr>
                <th>SẢN PHẨM</th>
                <th>MÃ LÔ</th>
                <th>TỒN KHO</th>
                <th>CÒN HẠN</th>
                <th>GIẢM GIÁ ĐỀ XUẤT</th>
                <th>GIÁ SAU GIẢM</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {markdownRows.map((row) => (
                <React.Fragment key={row.sku}>
                  <tr>
                    <td>
                      <div className="sd-product">
                        <div>
                          <strong>{row.name}</strong>
                          <small>
                            SKU: {row.sku} · {row.supplier}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sd-pill neutral">{row.lot}</span>
                    </td>
                    <td>{row.stock}</td>
                    <td>
                      <span className="sd-priority high">
                        <Clock size={14} />
                        {row.expiry}
                      </span>
                    </td>
                    <td>
                      <span className="sd-pill blue-pill">{row.discount}</span>
                    </td>
                    <td>
                      <strong>{row.price}</strong>
                      <small className="sd-old-price">{row.oldPrice}</small>
                    </td>
                    <td>
                      <div className="sd-actions">
                        <button
                          className="sd-btn sd-btn-soft"
                          onClick={() =>
                            toggleExpanded(
                              row.sku,
                              setExpandedMarkdown,
                              expandedMarkdown
                            )
                          }
                        >
                          <Info size={15} />
                          Vì sao?
                          {expandedMarkdown.includes(row.sku) ? (
                            <ChevronUp size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                        </button>
                        <button
                          className="sd-btn sd-btn-primary"
                          onClick={() => applyMarkdown(row)}
                        >
                          {appliedRows.includes(row.sku) ? (
                            <>
                              <Check size={16} /> Đã chọn
                            </>
                          ) : (
                            <>
                              <Percent size={16} /> Áp dụng giảm giá
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedMarkdown.includes(row.sku) && (
                    <tr className="sd-detail-row">
                      <td colSpan="7">
                        <div className="sd-detail-content">
                          <Info size={17} />
                          <div>
                            <strong>Lý do đề xuất giảm giá</strong>
                            <p>
                              Sản phẩm còn {row.expiry} trước hạn sử dụng.
                              Mức giảm {row.discount} giúp thúc đẩy tiêu thụ
                              và hạn chế hàng phải hủy.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {confirmAll && (
        <div
          className="sd-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmAll(false);
          }}
        >
          <div
            className="sd-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sd-modal-title"
          >
            <div className="sd-modal-icon">
              <ClipboardList size={23} />
            </div>
            <h2 id="sd-modal-title">Xác nhận duyệt tất cả?</h2>
            <p>
              Bạn đang chọn duyệt {restockRows.length} đề xuất nhập hàng.
              Hãy kiểm tra số lượng trước khi tiếp tục.
            </p>
            <div className="sd-modal-actions">
              <button
                className="sd-btn sd-btn-light"
                onClick={() => setConfirmAll(false)}
              >
                Hủy
              </button>
              <button
                className="sd-btn sd-btn-primary"
                onClick={approveAll}
              >
                Xác nhận duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

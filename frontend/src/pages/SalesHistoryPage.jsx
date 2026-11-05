import React, { useEffect, useMemo, useRef, useState } from 'react';
import './SalesHistoryPage.css';

const API_URL = 'http://127.0.0.1:8000';

const money = (value) =>
  `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('sv-SE');
};
const parseSaleDate = (value) => {
  if (!value) return null;

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const [, year, month, day] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
};

function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [period, setPeriod] = useState('today');

  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSales();
  }, []);

  // =========================
  // LẤY LỊCH SỬ BÁN HÀNG
  // =========================
  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/v1/sales`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        throw new Error(
          result.detail ||
          `Không thể tải dữ liệu bán hàng (${response.status})`
        );
      }

      const data = await response.json();

      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải lịch sử bán hàng:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CHỌN FILE IMPORT
  // =========================
  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setImportFile(file);
    setImportMessage('');
    setImportError('');
  };

  // =========================
  // IMPORT CSV / EXCEL
  // =========================
  const handleImportSales = async () => {
    if (!importFile) {
      setImportError('Vui lòng chọn file CSV hoặc Excel trước.');
      setImportMessage('');
      return;
    }

    const allowedExtensions = /\.(csv|xlsx|xls)$/i;

    if (!allowedExtensions.test(importFile.name)) {
      setImportError('Chỉ hỗ trợ file CSV, XLSX hoặc XLS.');
      setImportMessage('');
      return;
    }

    try {
      setImporting(true);
      setImportError('');
      setImportMessage('');

      const token = localStorage.getItem('token');
      const formData = new FormData();

      formData.append('file', importFile);

      const response = await fetch(
        `${API_URL}/api/v1/sales/import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.detail ||
          result.message ||
          `Import thất bại (${response.status}).`
        );
      }

      setImportMessage(
        result.message || 'Import dữ liệu bán hàng thành công!'
      );

      setImportFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Tải lại dữ liệu sau khi import thành công
      await fetchSales();
    } catch (err) {
      console.error('Lỗi import lịch sử bán hàng:', err);

      setImportError(
        err.message || 'Có lỗi xảy ra khi import dữ liệu.'
      );
    } finally {
      setImporting(false);
    }
  };

  // =========================
  // LỌC DỮ LIỆU
  // =========================
  const filteredSales = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const normalizedKeyword = keyword.trim().toLowerCase();

    return sales.filter((sale) => {
      const searchText = [
        sale.id,
        sale.sku,
        sale.product_name,
        sale.invoice_code,
        sale.transaction_code,
        sale.customer_name,
        sale.channel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchText.includes(normalizedKeyword)) {
        return false;
      }

      if (period === 'all') return true;

      const date = parseSaleDate(sale.sale_date);

      if (!date) return false;

      const start = new Date(now);

      if (period === 'today') {
        // Chỉ lấy giao dịch trong hôm nay
        return date.getTime() === now.getTime();
      }

      const days = Number(period);

      start.setDate(start.getDate() - (days - 1));

      return date >= start && date <= now;
    });
  }, [sales, keyword, period]);

  // =========================
  // THỐNG KÊ
  // =========================
  const totalQuantity = filteredSales.reduce(
    (sum, sale) =>
      sum + Number(sale.quantity_sold || 0),
    0
  );

  const totalRevenue = filteredSales.reduce(
    (sum, sale) =>
      sum +
      Number(sale.quantity_sold || 0) *
      Number(sale.selling_price || 0),
    0
  );

  const averagePrice = totalQuantity
    ? totalRevenue / totalQuantity
    : 0;

  const bestSeller = useMemo(() => {
    const products = {};

    filteredSales.forEach((sale) => {
      const name = sale.product_name || 'Chưa rõ sản phẩm';

      products[name] =
        (products[name] || 0) +
        Number(sale.quantity_sold || 0);
    });

    return Object.entries(products).sort(
      (a, b) => b[1] - a[1]
    )[0];
  }, [filteredSales]);

  // =========================
  // XUẤT CSV
  // =========================
  const exportCSV = () => {
    const headers = [
      'Ngày bán',
      'Mã giao dịch',
      'SKU',
      'Tên sản phẩm',
      'Số lượng',
      'Đơn giá',
      'Thành tiền',
    ];

    const rows = filteredSales.map((sale) => [
      formatDate(sale.sale_date),
      sale.invoice_code ||
        sale.transaction_code ||
        sale.id ||
        '',
      sale.sku || '',
      sale.product_name || '',
      sale.quantity_sold || 0,
      sale.selling_price || 0,
      Number(sale.quantity_sold || 0) *
        Number(sale.selling_price || 0),
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const csv =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(','))
        .join('\r\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'lich-su-ban-hang.csv';

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  // =========================
  // GIAO DIỆN
  // =========================
  return (
    <div className="sales-page">
      <header className="sales-header">

        <div className="sales-header-actions">
          <button
            type="button"
            className="sales-btn sales-btn-light"
            onClick={fetchSales}
            disabled={loading}
          >
            ↻ {loading ? 'Đang tải...' : 'Làm mới'}
          </button>

          <button
            type="button"
            className="sales-btn sales-btn-light"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importFile
              ? `📄 ${importFile.name}`
              : 'Chọn file CSV / Excel'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            hidden
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="sales-btn sales-btn-primary"
            onClick={handleImportSales}
            disabled={!importFile || importing}
          >
            {importing ? 'Đang nhập...' : 'Nhập dữ liệu'}
          </button>

          <button
            type="button"
            className="sales-btn sales-btn-primary"
            onClick={exportCSV}
            disabled={filteredSales.length === 0}
          >
            Xuất CSV
          </button>
        </div>
      </header>

      {importMessage && (
        <p className="sales-message" role="status">
          {importMessage}
        </p>
      )}

      {importError && (
        <p className="sales-error" role="alert">
          {importError}
        </p>
      )}

      <section className="sales-stats">
        <article className="sales-stat stat-purple">
          <span className="sales-stat-label">
            TỔNG SẢN LƯỢNG
          </span>

          <strong>
            {totalQuantity.toLocaleString('vi-VN')}
          </strong>

          <small>đơn vị</small>

          <div className="sales-stat-foot">
            Theo dữ liệu đã lọc
          </div>
        </article>

        <article className="sales-stat stat-green">
          <span className="sales-stat-label">
            DOANH THU BÁN HÀNG
          </span>

          <strong>{money(totalRevenue)}</strong>

          <div className="sales-stat-foot">
            Tổng số lượng × đơn giá
          </div>
        </article>

        <article className="sales-stat stat-orange">
          <span className="sales-stat-label">
            GIÁ BÁN TRUNG BÌNH
          </span>

          <strong>{money(averagePrice)}</strong>

          <div className="sales-stat-foot">
            Trung bình trên mỗi đơn vị
          </div>
        </article>

        <article className="sales-stat stat-pink">
          <span className="sales-stat-label">
            BÁN CHẠY NHẤT
          </span>

          <strong className="sales-best-name">
            {bestSeller?.[0] || '—'}
          </strong>

          <div className="sales-stat-foot">
            {bestSeller
              ? `${bestSeller[1].toLocaleString('vi-VN')} đơn vị`
              : 'Chưa có dữ liệu'}
          </div>
        </article>
      </section>

      <section className="sales-toolbar">
        <div className="sales-search">
          <span>⌕</span>

          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo mã giao dịch, SKU, sản phẩm..."
          />
        </div>

        <div className="sales-period">
          {[
            ['today', 'Hôm nay'],
            ['7', '7 ngày qua'],
            ['30', '30 ngày qua'],
            ['all', 'Tất cả'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={period === value ? 'active' : ''}
              onClick={() => setPeriod(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <p className="sales-message">
          Đang tải dữ liệu bán hàng...
        </p>
      )}

      {error && (
        <div className="sales-error" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="sales-btn sales-btn-light"
            onClick={fetchSales}
          >
            Thử tải lại
          </button>
        </div>
      )}

      {!loading && !error && (
        <section className="sales-table-panel">
          <div className="sales-table-scroll">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>NGÀY BÁN</th>
                  <th>MÃ GIAO DỊCH</th>
                  <th>SKU</th>
                  <th>TÊN SẢN PHẨM</th>
                  <th>ĐVT</th>
                  <th className="number-cell">SỐ LƯỢNG</th>
                  <th className="number-cell">ĐƠN GIÁ BÁN</th>
                  <th className="number-cell">TỔNG TIỀN</th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="sales-empty">
                      Không tìm thấy giao dịch phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        <span className="sales-date-dot" />
                        <strong>{formatDate(sale.sale_date)}</strong>
                      </td>

                      <td>
                        <span className="sales-code">
                          {sale.invoice_code ||
                            sale.transaction_code ||
                            `HD-${sale.id}`}
                        </span>
                      </td>

                      <td>
                        <span className="sales-sku">
                          {sale.sku || '—'}
                        </span>
                      </td>

                      <td>
                        <strong className="sales-product-name">
                          {sale.product_name || '—'}
                        </strong>
                      </td>

                      <td>{sale.unit || '—'}</td>

                      <td className="number-cell">
                        <strong>
                          {Number(
                            sale.quantity_sold || 0
                          ).toLocaleString('vi-VN')}
                        </strong>
                      </td>

                      <td className="number-cell">
                        {money(sale.selling_price)}
                      </td>

                      <td className="number-cell sales-total">
                        {money(
                          Number(sale.quantity_sold || 0) *
                            Number(sale.selling_price || 0)
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan="5">
                    TỔNG CỘNG ({filteredSales.length} GIAO DỊCH)
                  </td>

                  <td className="number-cell">
                    {totalQuantity.toLocaleString('vi-VN')}
                  </td>

                  <td />

                  <td className="number-cell sales-total">
                    {money(totalRevenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default SalesHistoryPage;
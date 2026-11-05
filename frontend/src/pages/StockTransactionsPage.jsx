import React, { useState, useEffect, useCallback } from 'react';
import './StockTransactionsPage.css';

const API = 'http://127.0.0.1:8000/api/v1';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Phiên đăng nhập không tồn tại. Hãy đăng nhập lại.');
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Phiên đăng nhập hết hạn hoặc token không hợp lệ.');
    }

    if (res.status === 403) {
      throw new Error('Tài khoản không có quyền thực hiện thao tác này.');
    }

    const detail = data?.detail;

    const errorMessage =
      typeof detail === 'string'
        ? detail
        : detail
          ? JSON.stringify(detail)
          : `Lỗi API (${res.status})`;

    throw new Error(errorMessage);
  }

  return data;
}

const today = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const newCode = (prefix) =>
  `${prefix}-${Date.now().toString().slice(-10)}`;

const money = (value) =>
  Number(value || 0).toLocaleString('vi-VN');

const dateText = (value) =>
  value ? String(value).slice(0, 10) : '—';

const statusText = (status) => {
  const map = {
    DRAFT: 'Nháp',
    CONFIRMED: 'Đã xác nhận',
    CANCELLED: 'Đã hủy',
  };
  return map[status] || status || '—';
};

export default function StockTransactionsPage({ role }) {
  const normalizedRole = String(role || '').trim();
  const canConfirmReceipt = ['Admin', 'Store Manager'].includes(normalizedRole);
  const canConfirmIssue = ['Admin', 'Store Manager', 'Store Staff'].includes(normalizedRole);
  const canReviewFefo = ['Admin', 'Store Manager'].includes(normalizedRole);
  const [activeTab, setActiveTab] = useState('receipt');
  const [receipts, setReceipts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [fefoExceptions, setFefoExceptions] = useState([]);
  const [loadingExceptions, setLoadingExceptions] = useState(false);
  const [reviewingException, setReviewingException] = useState(false);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [receiptForm, setReceiptForm] = useState({
    receipt_code: newCode('PN'),
    supplier_name: '',
    note: '',
    details: [{
      product_id: '',
      batch_number: '',
      import_date: today(),
      expiry_date: '',
      quantity: 1,
      unit_cost: 0,
    }],
  });

  const [issueForm, setIssueForm] = useState({
    issue_code: newCode('PX'),
    issue_date: today(),
    recipient: '',
    reason: '',
    note: '',
    details: [{
      product_id: '',
      quantity: 1,
      useException: false,
      requested_batch_id: '',
      requested_cost_lot_id: '',
      exception_reason: '',
      availableLots: [],
      loadingLots: false,
    }],
  });

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const [receiptData, issueData, productData, batchData] =
        await Promise.all([
          apiFetch('/receipts'),
          apiFetch('/issues'),
          apiFetch('/products'),
          apiFetch('/batches'),
        ]);

      setReceipts(Array.isArray(receiptData) ? receiptData : []);
      setIssues(Array.isArray(issueData) ? issueData : []);
      setProducts(Array.isArray(productData) ? productData : []);
      setBatches(Array.isArray(batchData) ? batchData : []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };
  const loadFefoExceptions = async () => {
    setLoadingExceptions(true);
    setErrorMsg('');

    try {
      const data = await apiFetch('/fefo-exceptions');
      console.log('FEFO exceptions:', data);

      setFefoExceptions(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingExceptions(false);
    }
  };
  const reviewFefoException = async (requestId, action) => {
    const actionText = action === 'approve' ? 'duyệt' : 'từ chối';

    if (!window.confirm(`Bạn có chắc muốn ${actionText} yêu cầu này?`)) {
      return;
    }

    setReviewingException(true);
    resetMessages();

    try {
      await apiFetch(`/fefo-exceptions/${requestId}/${action}`, {
        method: 'POST',
        body: JSON.stringify({
          review_note: action === 'approve'
            ? 'Đã duyệt yêu cầu ngoại lệ FEFO.'
            : 'Từ chối yêu cầu ngoại lệ FEFO.',
        }),
      });

      setSuccessMsg(
        action === 'approve'
          ? 'Đã duyệt yêu cầu ngoại lệ FEFO.'
          : 'Đã từ chối yêu cầu ngoại lệ FEFO.'
      );

      await loadFefoExceptions();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setReviewingException(false);
    }
  };
  const updateReceiptDetail = (index, field, value) => {
    setReceiptForm((prev) => ({
      ...prev,
      details: prev.details.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addReceiptDetail = () => {
    setReceiptForm((prev) => ({
      ...prev,
      details: [...prev.details, {
        product_id: '',
        batch_number: '',
        import_date: today(),
        expiry_date: '',
        quantity: 1,
        unit_cost: 0,
      }],
    }));
  };

  const removeReceiptDetail = (index) => {
    setReceiptForm((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const updateIssueDetail = (index, field, value) => {
    setIssueForm((prev) => ({
      ...prev,
      details: prev.details.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };
  const loadIssueableLots = async (index, productId) => {
  if (!productId) {
    setIssueForm((prev) => ({
      ...prev,
      details: prev.details.map((item, i) =>
        i === index
          ? {
              ...item,
              product_id: '',
              availableLots: [],
              loadingLots: false,
              requested_batch_id: '',
              requested_cost_lot_id: '',
              exception_reason: '',
            }
          : item
      ),
    }));
    return;
  }

  updateIssueDetail(index, 'product_id', productId);
  updateIssueDetail(index, 'loadingLots', true);
  updateIssueDetail(index, 'availableLots', []);
  updateIssueDetail(index, 'requested_batch_id', '');
  updateIssueDetail(index, 'requested_cost_lot_id', '');

  try {
    const data = await apiFetch(
      `/products/${productId}/issueable-cost-lots`
    );

    setIssueForm((prev) => ({
      ...prev,
      details: prev.details.map((item, i) =>
        i === index
          ? {
              ...item,
              availableLots: data.lots || [],
              loadingLots: false,
            }
          : item
      ),
    }));
  } catch (err) {
    setErrorMsg(err.message);
    updateIssueDetail(index, 'loadingLots', false);
  }
};

  const addIssueDetail = () => {
    setIssueForm((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        {
          product_id: '',
          quantity: 1,
          useException: false,
          requested_batch_id: '',
          requested_cost_lot_id: '',
          exception_reason: '',
          availableLots: [],
          loadingLots: false,
        },
      ],
    }));
  };

  const removeIssueDetail = (index) => {
    setIssueForm((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!receiptForm.details.length) {
      setErrorMsg('Phiếu nhập phải có ít nhất một sản phẩm.');
      return;
    }

    const details = receiptForm.details.map((item) => ({
      product_id: Number(item.product_id),
      batch_number: item.batch_number.trim(),
      import_date: item.import_date,
      expiry_date: item.expiry_date,
      quantity: Number(item.quantity),
      unit_cost: Number(item.unit_cost || 0),
    }));

    if (details.some((item) =>
      !item.product_id ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    )) {
      setErrorMsg('Vui lòng chọn sản phẩm và nhập số lượng nguyên dương.');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/receipts', {
        method: 'POST',
        body: JSON.stringify({
          receipt_code: receiptForm.receipt_code.trim(),
          supplier_name: receiptForm.supplier_name.trim() || null,
          note: receiptForm.note.trim() || null,
          details,
        }),
      });

      setSuccessMsg('Đã tạo phiếu nhập nháp. Xác nhận phiếu để cập nhật tồn kho.');
      setReceiptForm({
        receipt_code: newCode('PN'),
        supplier_name: '',
        note: '',
        details: [{
          product_id: '',
          batch_number: '',
          import_date: today(),
          expiry_date: '',
          quantity: 1,
          unit_cost: 0,
        }],
      });

      await loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!issueForm.details.length) {
      setErrorMsg('Phiếu xuất phải có ít nhất một sản phẩm.');
      return;
    }

    const details = issueForm.details.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      ...(item.useException
        ? {
            requested_batch_id: Number(item.requested_batch_id),
            requested_cost_lot_id: Number(item.requested_cost_lot_id),
            exception_reason: item.exception_reason.trim(),
          }
        : {}),
    }));

    if (details.some((item) =>
      !item.product_id ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    )) {
      setErrorMsg('Chọn sản phẩm và nhập số lượng xuất là số nguyên dương.');
      return;
    }
    if (issueForm.details.some((item) =>
      item.useException && (
        !item.requested_batch_id ||
        !item.requested_cost_lot_id ||
        !item.exception_reason.trim()
      )
    )) {
      setErrorMsg('Vui lòng chọn cost lot và nhập lý do ngoại lệ FEFO.');
      return;
    }

    setSaving(true);

    try {
      await apiFetch('/issues', {
        method: 'POST',
        body: JSON.stringify({
          issue_code: issueForm.issue_code.trim(),
          issue_date: issueForm.issue_date,
          recipient: issueForm.recipient.trim() || null,
          reason: issueForm.reason.trim() || null,
          note: issueForm.note.trim() || null,
          details,
        }),
      });

      setSuccessMsg('Đã tạo phiếu xuất nháp. Xác nhận phiếu để hệ thống tự chọn lô theo FEFO.');

      setIssueForm({
        issue_code: newCode('PX'),
        issue_date: today(),
        recipient: '',
        reason: '',
        note: '',
        details: [{
          product_id: '',
          quantity: 1,
          useException: false,
          requested_batch_id: '',
          requested_cost_lot_id: '',
          exception_reason: '',
          availableLots: [],
          loadingLots: false,
        }],
      });

      await loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const showReceiptDetail = async (item) => {
    resetMessages();
    try {
      const id = item.id ?? item.receipt_id;
      const data = await apiFetch(`/receipts/${id}`);
      setSelectedReceipt(data);
      setSelectedIssue(null);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const showIssueDetail = async (item) => {
    resetMessages();
    try {
      const id = item.id ?? item.issue_id;
      const data = await apiFetch(`/issues/${id}`);
      setSelectedIssue(data);
      setSelectedReceipt(null);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };
    const confirmTransaction = async (type, item) => {
    resetMessages();

    if (item.status !== 'DRAFT') {
      setErrorMsg('Chỉ có thể xác nhận phiếu đang ở trạng thái nháp.');
      return;
    }

    if (type === 'receipt' && !canConfirmReceipt) {
      setErrorMsg('Chỉ Admin hoặc Store Manager được xác nhận phiếu nhập.');
      return;
    }

    if (type === 'issue' && !canConfirmIssue) {
      setErrorMsg('Tài khoản không có quyền xác nhận phiếu xuất.');
      return;
    }

    const id = type === 'receipt'
      ? (item.id ?? item.receipt_id)
      : (item.id ?? item.issue_id);

    const code = item.receipt_code || item.issue_code || id;

    if (!window.confirm(
      `Xác nhận ${type === 'receipt' ? 'phiếu nhập' : 'phiếu xuất'} ${code}?`
    )) {
      return;
    }

    setSaving(true);

    try {
      await apiFetch(
        type === 'receipt'
          ? `/receipts/${id}/confirm`
          : `/issues/${id}/confirm`,
        { method: 'POST' }
      );

      setSuccessMsg('Xác nhận phiếu thành công.');
      setSelectedReceipt(null);
      setSelectedIssue(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const receiptDraftTotal = receiptForm.details.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_cost) || 0), 0
  );
  const issueableBatchCount = batches.filter((batch) => Number(batch.current_qty) > 0).length;
  const draftReceiptCount = receipts.filter((item) => item.status === 'DRAFT').length;
  const draftIssueCount = issues.filter((item) => item.status === 'DRAFT').length;

  const renderStatus = (item) => (
    <span className={`stock-status stock-status-${String(item.status || '').toLowerCase()}`}>
      {statusText(item.status)}
    </span>
  );

  const renderReceiptTable = (items) => (
  <div className="stock-table-wrap">
    <table className="stock-table">
      <thead>
        <tr>
          <th>Mã phiếu</th>
          <th>Nhà cung cấp</th>
          <th>Ngày tạo</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>

      <tbody>
        {items.length ? items.map((item) => {
          const itemId = item.id ?? item.receipt_id;
          const detailId = selectedReceipt?.id ?? selectedReceipt?.receipt_id;
          const isSelected = String(itemId) === String(detailId);

          return (
            <React.Fragment key={itemId}>
              <tr>
                <td>{item.receipt_code || '—'}</td>
                <td>{item.supplier_name || '—'}</td>
                <td>{dateText(item.created_at || item.receipt_date)}</td>
                <td>{renderStatus(item)}</td>
                <td className="stock-actions">
                  <button
                    type="button"
                    className="erp-btn"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedReceipt(null);
                      } else {
                        showReceiptDetail(item);
                      }
                    }}
                  >
                    {isSelected ? 'Ẩn chi tiết' : 'Chi tiết'}
                  </button>

                  {item.status === 'DRAFT' && canConfirmReceipt && (
                    <button
                      type="button"
                      className="erp-btn erp-btn-primary"
                      disabled={saving}
                      onClick={() => confirmTransaction('receipt', item)}
                    >
                      Xác nhận
                    </button>
                  )}
                </td>
              </tr>

              {isSelected && (
                <tr className="stock-inline-detail-row">
                  <td colSpan="5">
                    {renderDetails(selectedReceipt, 'receipt')}
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        }) : (
          <tr>
            <td colSpan="5">Chưa có phiếu nhập.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

  const renderIssueTable = (items) => (
  <div className="stock-table-wrap">
    <table className="stock-table">
      <thead>
        <tr>
          <th>Mã phiếu</th>
          <th>Người nhận</th>
          <th>Lý do</th>
          <th>Ngày xuất</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>

      <tbody>
        {items.length ? items.map((item) => {
          const itemId = item.id ?? item.issue_id;
          const detailId = selectedIssue?.id ?? selectedIssue?.issue_id;
          const isSelected = String(itemId) === String(detailId);

          return (
            <React.Fragment key={itemId}>
              <tr>
                <td>{item.issue_code || '—'}</td>
                <td>{item.recipient || '—'}</td>
                <td>{item.reason || '—'}</td>
                <td>{dateText(item.issue_date || item.created_at)}</td>
                <td>{renderStatus(item)}</td>
                <td className="stock-actions">
                  <button
                    type="button"
                    className="erp-btn"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedIssue(null);
                      } else {
                        showIssueDetail(item);
                      }
                    }}
                  >
                    {isSelected ? 'Ẩn chi tiết' : 'Chi tiết'}
                  </button>

                  {item.status === 'DRAFT' && canConfirmIssue && (
                    <button
                      type="button"
                      className="erp-btn erp-btn-primary"
                      disabled={saving}
                      onClick={() => confirmTransaction('issue', item)}
                    >
                      Xác nhận
                    </button>
                  )}
                </td>
              </tr>

              {isSelected && (
                <tr className="stock-inline-detail-row">
                  <td colSpan="6">
                    {renderDetails(selectedIssue, 'issue')}
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        }) : (
          <tr>
            <td colSpan="6">Chưa có phiếu xuất.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

  const renderDetails = (data, type) => {
    if (!data) return null;

    const details = data.details || data.items || [];
    return (
      <section className="stock-detail">
        <div className="stock-detail-heading">
          <h3>Chi tiết {type === 'receipt' ? 'phiếu nhập' : 'phiếu xuất'}</h3>
          <button
            type="button"
            className="erp-btn"
            onClick={() => {
              setSelectedReceipt(null);
              setSelectedIssue(null);
            }}
          >
            Đóng
          </button>
        </div>
        <p><strong>Mã phiếu:</strong> {data.receipt_code || data.issue_code || '—'}</p>
        <p><strong>Trạng thái:</strong> {statusText(data.status)}</p>
        {type === 'issue' && (
          <p><strong>Ngày xuất:</strong> {dateText(data.issue_date || data.created_at)}</p>
        )}
        <p><strong>Ghi chú:</strong> {data.note || '—'}</p>

        <div className="stock-table-wrap">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Sản phẩm / Lô thực tế</th>
                <th>Số lượng</th>
                {type === 'receipt' && <th>Đơn giá nhập</th>}
                {type === 'issue' && (
                  <>
                    <th>Đơn giá vốn</th>
                    <th>Thành tiền</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {details.length ? details.map((line, index) => (
                <tr key={line.detail_id ?? line.id ?? index}>
                  <td>
                    {line.product_name || line.product_sku || '—'}
                    {line.batch_number ? ` — ${line.batch_number}` : ''}
                    {line.batch_id ? ` — Lô ID ${line.batch_id}` : ''}
                  </td>

                  <td>{line.quantity ?? '—'}</td>

                  {type === 'receipt' && (
                    <td>{money(line.unit_cost)} ₫</td>
                  )}

                  {type === 'issue' && (
                    <>
                      <td>
                        {line.unit_cost != null
                          ? `${money(line.unit_cost)} ₫`
                          : '—'}
                      </td>
                      <td>
                        {line.total_cost != null
                          ? `${money(line.total_cost)} ₫`
                          : 'Chưa xác nhận'}
                      </td>
                    </>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={type === 'receipt' ? 3 : 4}>
                    API không trả về chi tiết phiếu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data.status === 'DRAFT' &&
          ((type === 'receipt' && canConfirmReceipt) ||
          (type === 'issue' && canConfirmIssue)) && (
          <button
            type="button"
            className="erp-btn erp-btn-primary"
            disabled={saving}
            onClick={() => confirmTransaction(type, data)}
          >
            Xác nhận phiếu
          </button>
        )}
      </section>
    );
  };

  return (
    <div className="erp-panel stock-page">
      <header className="stock-page-header">
        <button type="button" className="erp-btn stock-refresh" onClick={loadData} disabled={loading}>
          <span className={loading ? 'stock-spin' : ''}>↻</span> {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
        </button>
      </header>

      <div className="stock-summary-grid">
        <article className="stock-summary-card">
          <div><span className="stock-summary-label">Tổng phiếu nhập</span><strong>{receipts.length}</strong><small>{draftReceiptCount} phiếu đang nháp</small></div>
        </article>
        <article className="stock-summary-card">
          <div><span className="stock-summary-label">Tổng phiếu xuất</span><strong>{issues.length}</strong><small>{draftIssueCount} phiếu đang nháp</small></div>
        </article>
        <article className="stock-summary-card">
          <div><span className="stock-summary-label">Lô còn hàng</span><strong>{issueableBatchCount}</strong><small>Có tồn kho để hệ thống phân bổ FEFO</small></div>
        </article>
        <article className="stock-summary-card">
          <div><span className="stock-summary-label">Giá trị phiếu nhập hiện tại</span><strong>{money(receiptDraftTotal)} ₫</strong><small>Tính theo biểu mẫu đang nhập</small></div>
        </article>
      </div>

      <div className="stock-tabs" role="tablist" aria-label="Quản lý phiếu kho">
        <button
          type="button"
          className={`erp-btn ${activeTab === 'receipt' ? 'erp-btn-primary' : ''}`}
          onClick={() => { setActiveTab('receipt'); resetMessages(); }}
        >
          Phiếu nhập
        </button>
        <button
          type="button"
          className={`erp-btn ${activeTab === 'issue' ? 'erp-btn-primary' : ''}`}
          onClick={() => { setActiveTab('issue'); resetMessages(); }}
        >
          Phiếu xuất
        </button>
        <button
          type="button"
          className={`erp-btn ${activeTab === 'history' ? 'erp-btn-primary' : ''}`}
          onClick={() => { setActiveTab('history'); resetMessages(); }}
        >
          Lịch sử phiếu
        </button>
        {canReviewFefo && (
          <button
            type="button"
            className={`erp-btn ${activeTab === 'fefo' ? 'erp-btn-primary' : ''}`}
            onClick={() => {
              setActiveTab('fefo');
              resetMessages();
              loadFefoExceptions();
            }}
          >
            Duyệt ngoại lệ FEFO
          </button>
        )}
      </div>
      

      {errorMsg && <div className="stock-alert stock-alert-error">⚠️ {errorMsg}</div>}
      {successMsg && <div className="stock-alert stock-alert-success">✓ {successMsg}</div>}

      {activeTab === 'receipt' && (
        <section className="stock-section">
          <div className="stock-section-heading"><div><span className="stock-section-kicker">PHIẾU NHẬP</span><h2>Tạo phiếu nhập kho</h2></div><span className="stock-step-badge">01</span></div>
          <form onSubmit={handleCreateReceipt}>
            <div className="stock-form-grid">
              <label>
                Mã phiếu nhập *
                <input
                  required
                  value={receiptForm.receipt_code}
                  onChange={(e) => setReceiptForm({ ...receiptForm, receipt_code: e.target.value })}
                />
              </label>
              <label>
                Nhà cung cấp
                <input
                  value={receiptForm.supplier_name}
                  onChange={(e) => setReceiptForm({ ...receiptForm, supplier_name: e.target.value })}
                  placeholder="Tên nhà cung cấp"
                />
              </label>
              <label className="stock-full">
                Ghi chú
                <input
                  value={receiptForm.note}
                  onChange={(e) => setReceiptForm({ ...receiptForm, note: e.target.value })}
                />
              </label>
            </div>

            <h4>Danh sách sản phẩm nhập</h4>
            {receiptForm.details.map((line, index) => (
              <div className="stock-line-card" key={index}>
                <div className="stock-form-grid">
                  <label>
                    Sản phẩm *
                    <select
                      required
                      value={line.product_id}
                      onChange={(e) => updateReceiptDetail(index, 'product_id', e.target.value)}
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku ? `${product.sku} — ` : ''}
                          {product.name || product.product_name || `ID ${product.id}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Mã lô *
                    <input
                      required
                      value={line.batch_number}
                      onChange={(e) => updateReceiptDetail(index, 'batch_number', e.target.value)}
                      placeholder="LOT-001"
                    />
                  </label>
                  <label>
                    Ngày nhập *
                    <input
                      type="date"
                      required
                      value={line.import_date}
                      onChange={(e) => updateReceiptDetail(index, 'import_date', e.target.value)}
                    />
                  </label>
                  <label>
                    Hạn sử dụng *
                    <input
                      type="date"
                      required
                      min={line.import_date}
                      value={line.expiry_date}
                      onChange={(e) => updateReceiptDetail(index, 'expiry_date', e.target.value)}
                    />
                  </label>
                  <label>
                    Số lượng *
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={line.quantity}
                      onChange={(e) => updateReceiptDetail(index, 'quantity', e.target.value)}
                    />
                  </label>
                  <label>
                    Đơn giá
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={line.unit_cost}
                      onChange={(e) => updateReceiptDetail(index, 'unit_cost', e.target.value)}
                    />
                  </label>
                </div>
                {receiptForm.details.length > 1 && (
                  <button
                    type="button"
                    className="erp-btn"
                    onClick={() => removeReceiptDetail(index)}
                  >
                    Xóa dòng
                  </button>
                )}
              </div>
            ))}

            <div className="stock-form-actions">
              <button type="button" className="erp-btn" onClick={addReceiptDetail}>
                + Thêm sản phẩm
              </button>
              <button type="submit" className="erp-btn erp-btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Tạo phiếu nhập nháp'}
              </button>
            </div>
          </form>

          <h3>Danh sách phiếu nhập</h3>
          {renderReceiptTable(receipts)}
        </section>
      )}

      {activeTab === 'issue' && (
        <section className="stock-section">
          <div className="stock-section-heading"><div><span className="stock-section-kicker">PHIẾU XUẤT</span><h2>Tạo phiếu xuất kho</h2></div><span className="stock-step-badge">02</span></div>
          <form onSubmit={handleCreateIssue}>
            <div className="stock-form-grid">
              <label>
                Mã phiếu xuất *
                <input
                  required
                  value={issueForm.issue_code}
                  onChange={(e) => setIssueForm({ ...issueForm, issue_code: e.target.value })}
                />
              </label>
              <label>
                Ngày xuất
                <input
                  type="date"
                  value={issueForm.issue_date}
                  onChange={(e) =>
                    setIssueForm({
                      ...issueForm,
                      issue_date: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Người nhận
                <input
                  value={issueForm.recipient}
                  onChange={(e) => setIssueForm({ ...issueForm, recipient: e.target.value })}
                />
              </label>
              <label>
                Lý do xuất
                <input
                  value={issueForm.reason}
                  onChange={(e) => setIssueForm({ ...issueForm, reason: e.target.value })}
                  placeholder="Bán hàng, hư hỏng..."
                />
              </label>
              <label>
                Ghi chú
                <input
                  value={issueForm.note}
                  onChange={(e) => setIssueForm({ ...issueForm, note: e.target.value })}
                />
              </label>
            </div>

            <h4>Danh sách sản phẩm xuất</h4>

            {issueForm.details.map((line, index) => (
              <div className="stock-line-card" key={index}>
                <div className="stock-form-grid">
                  <label>
                    Sản phẩm *
                    <select
                      required
                      value={line.product_id}
                      onChange={(e) =>
                        loadIssueableLots(index, e.target.value)
                      }
                    >
                      <option value="">-- Chọn sản phẩm --</option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku ? `${product.sku} — ` : ''}
                          {product.name || product.product_name || `ID ${product.id}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Số lượng xuất *
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={line.quantity}
                      onChange={(e) =>
                        updateIssueDetail(index, 'quantity', e.target.value)
                      }
                    />
                  </label>
                  <label className="stock-full">
                    <input
                      type="checkbox"
                      checked={!!line.useException}
                      onChange={(e) => {
                        updateIssueDetail(index, 'useException', e.target.checked);
                        updateIssueDetail(index, 'requested_batch_id', '');
                        updateIssueDetail(index, 'requested_cost_lot_id', '');
                        updateIssueDetail(index, 'exception_reason', '');
                      }}
                    />
                    Chọn cost lot khác FEFO (cần Admin/Store Manager duyệt)
                  </label>

                  {line.useException && (
                    <>
                      <label className="stock-full">
                        Cost lot muốn xuất *
                        <select
                          required
                          value={line.requested_cost_lot_id}
                          disabled={line.loadingLots}
                          onChange={(e) => {
                            const lot = line.availableLots.find(
                              (item) => String(item.cost_lot_id) === e.target.value
                            );

                            updateIssueDetail(index, 'requested_cost_lot_id', e.target.value);
                            updateIssueDetail(
                              index,
                              'requested_batch_id',
                              lot ? String(lot.batch_id) : ''
                            );
                          }}
                        >
                          <option value="">
                            {line.loadingLots ? 'Đang tải cost lot...' : '-- Chọn cost lot --'}
                          </option>

                          {line.availableLots.map((lot) => (
                            <option
                              key={lot.cost_lot_id}
                              value={lot.cost_lot_id}
                              disabled={
                                Number(lot.remaining_qty) <= 0 ||
                                Number(lot.current_qty) <= 0
                              }
                            >
                              {lot.batch_number}
                              {' — HSD: '}{dateText(lot.expiry_date)}
                              {' — Giá vốn: '}{money(lot.unit_cost)} ₫
                              {' — Còn: '}{lot.remaining_qty}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="stock-full">
                        Lý do chọn cost lot khác FEFO *
                        <textarea
                          required
                          value={line.exception_reason}
                          onChange={(e) =>
                            updateIssueDetail(index, 'exception_reason', e.target.value)
                          }
                          placeholder="Nhập lý do cần xuất lô này..."
                        />
                      </label>
                    </>
                  )}
                </div>

                {issueForm.details.length > 1 && (
                  <button
                    type="button"
                    className="erp-btn"
                    onClick={() => removeIssueDetail(index)}
                  >
                    Xóa dòng
                  </button>
                )}
              </div>
            ))}

            <div className="stock-form-actions">
              <button type="button" className="erp-btn" onClick={addIssueDetail}>
                + Thêm sản phẩm
              </button>
              <button type="submit" className="erp-btn erp-btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Tạo phiếu xuất nháp'}
              </button>
            </div>
          </form>

          <h3>Danh sách phiếu xuất</h3>
          {renderIssueTable(issues)}
        </section>
      )}

      {activeTab === 'history' && (
        <section className="stock-section">
          <h3>Lịch sử phiếu nhập / xuất</h3>

          <h4>Phiếu nhập</h4>
          {renderReceiptTable(receipts)}

          <h4>Phiếu xuất</h4>
          {renderIssueTable(issues)}

        </section>
      )}
      {activeTab === 'fefo' && canReviewFefo && (
        <section className="stock-section">
          <div className="stock-section-heading">
            <div>
              <span className="stock-section-kicker">FEFO EXCEPTIONS</span>
              <h2>Duyệt yêu cầu xuất khác FEFO</h2>
            </div>

            <button
              type="button"
              className="erp-btn"
              onClick={loadFefoExceptions}
              disabled={loadingExceptions}
            >
              {loadingExceptions ? 'Đang tải...' : '↻ Làm mới'}
            </button>
          </div>

          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Mã phiếu xuất</th>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Lô FEFO</th>
                  <th>Lô yêu cầu</th>
                  <th>Cost lot ID</th>
                  <th>Lý do</th>
                  <th>Người yêu cầu</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loadingExceptions ? (
                  <tr>
                    <td colSpan="10">Đang tải danh sách yêu cầu...</td>
                  </tr>
                ) : fefoExceptions.length ? (
                  fefoExceptions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.issue_code || '—'}</td>

                      <td>
                        {item.product_name || '—'}
                        <br />
                        <small>SKU: {item.sku || '—'}</small>
                      </td>

                      <td>{item.requested_qty ?? '—'}</td>
                      <td>{item.suggested_batch_number || '—'}</td>
                      <td>{item.requested_batch_number || '—'}</td>
                      <td>{item.requested_cost_lot_id ?? '—'}</td>
                      <td>{item.reason || '—'}</td>
                      <td>{item.requested_by_name || '—'}</td>
                      <td>{item.status || '—'}</td>

                      <td className="stock-actions">
                        {item.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              className="erp-btn erp-btn-primary"
                              disabled={reviewingException}
                              onClick={() =>
                                reviewFefoException(item.id, 'approve')
                              }
                            >
                              Duyệt
                            </button>

                            <button
                              type="button"
                              className="erp-btn"
                              disabled={reviewingException}
                              onClick={() =>
                                reviewFefoException(item.id, 'reject')
                              }
                            >
                              Từ chối
                            </button>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10">Chưa có yêu cầu ngoại lệ FEFO.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

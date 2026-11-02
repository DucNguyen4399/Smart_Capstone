import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ProductListPage.css';
const toText = (value) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (value && typeof value === 'object') {
    return String(
      value.name ??
      value.tenDonVi ??
      value.tenThuongHieu ??
      value.label ??
      value.code ??
      value.maDonVi ??
      value.maThuongHieu ??
      ''
    );
  }

  return '';
};

const normalizeOptions = (data, type) => {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      const rawId =
        type === 'unit'
          ? item.id ?? item.code ?? item.unit_code ?? item.maDonVi
          : type === 'brand'
            ? item.id ?? item.code ?? item.brand_code ?? item.maThuongHieu
            : item.id ?? item.maDanhMuc;

      const name =
        type === 'unit'
          ? item.name ?? item.unit_name ?? item.tenDonVi ?? item.label
          : type === 'brand'
            ? item.name ?? item.brand_name ?? item.tenThuongHieu ?? item.label
            : item.name ?? item.tenDanhMuc ?? item.label;

      return {
        ...item,
        id: item.id,
        code: toText(rawId),
        name: toText(name),
      };
    })
    .filter((item) => item.name);
};
const formatCreatedDate = (value) => {
  if (!value) return '—';
  // Giữ nguyên ngày từ MySQL DATETIME, tránh lệch ngày do múi giờ.
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('vi-VN');
};

const mapProductsWithStock = (products, batches) => {
  const stockByProduct = {};
  const productsWithBatch = new Set();

  batches.forEach((batch) => {
    const sku = String(batch.product_sku ?? '').trim();

    if (!sku) return;

    productsWithBatch.add(sku);

    stockByProduct[sku] =
      (stockByProduct[sku] || 0) +
      Number(batch.current_qty || 0);
  });

  return products.map((product) => {
    const sku = String(product.sku ?? '').trim();

    return {
      id: product.sku,
      name: product.name,
      category: product.category_name,
      unit: product.unit || product.unit_name || '—',
      unitCode: product.unit_code || '',
      brand: product.brand_name || '',
      brandCode: product.brand_code || '',
      importPrice: `${Number(product.cost_price || 0).toLocaleString('vi-VN')} ₫`,
      importPriceValue: Number(product.cost_price) || 0,
      exportPrice: `${Number(product.selling_price || 0).toLocaleString('vi-VN')} ₫`,
      stock: stockByProduct[sku] || 0,
      hasReceivedStock: productsWithBatch.has(sku),
      minStock: product.safety_stock,
      date: product.created_at || '',
      status: product.status || 'Đang bán',
    };
  });
};


export default function ProductListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [categoryFilter, setCategoryFilter] = useState('Tất cả danh mục');

  // State quản lý Modal (Thêm hoặc Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // Nếu null là Thêm mới, có dữ liệu là Sửa

  // Danh sách sản phẩm mẫu chuẩn ERP
  const [products, setProducts] = useState([]);

  // Danh sách danh mục từ database
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [brands, setBrands] = useState([]);
  const role = localStorage.getItem('role');
  const canManageProducts = ['Admin', 'Store Manager'].includes(role);

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(
        'http://127.0.0.1:8000/api/v1/categories',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCategories(normalizeOptions(response.data, 'category'));
      const [unitsResponse, brandsResponse] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/v1/units', { headers }),
        axios.get('http://127.0.0.1:8000/api/v1/brands', { headers }),
      ]);

      setUnits(normalizeOptions(unitsResponse.data, 'unit'));
      setBrands(normalizeOptions(brandsResponse.data, 'brand'));
    } catch (error) {
      console.error(
        'Lỗi lấy danh mục:',
        error.response?.data || error
      );
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Gọi Products và Batches cùng lúc
        const [productsResponse, batchesResponse] = await Promise.all([
          axios.get(
            'http://127.0.0.1:8000/api/v1/products',
            { headers }
          ),
          axios.get(
            'http://127.0.0.1:8000/api/v1/batches',
            { headers }
          ),
        ]);

        console.log('Products từ API:', productsResponse.data);
        console.log('Batches từ API:', batchesResponse.data);

        setProducts(
          mapProductsWithStock(
            productsResponse.data,
            batchesResponse.data
          )
        );

      } catch (error) {
        console.error(
          'Lỗi lấy danh sách sản phẩm:',
          error.response?.data || error
        );
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    unit: '',
    brandCode: '',
    importPrice: '',
    exportPrice: '',
    stock: '',
    minStock: '',
    status: 'Đang bán',
  });

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingProduct(null);

    setFormData({
      id: '',
      name: '',
      category: '',
      unit: '',
      brandCode: '',
      importPrice: '',
      exportPrice: '',
      stock: '',
      minStock: '',
      status: 'Đang bán'
    });

    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = async (product) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const productsResponse = await axios.get('http://127.0.0.1:8000/api/v1/products', { headers });
      const existingProduct = productsResponse.data.find(item => item.sku === product.id);
      if (!existingProduct) throw new Error(`Không tìm thấy sản phẩm có SKU ${product.id}`);

      setEditingProduct(product);
      setFormData({
        id: product.id,
        name: product.name,
        category: String(existingProduct.category_id || ''),
        unit: existingProduct.unit_code || '',
        brandCode: existingProduct.brand_code || '',
        importPrice: String(existingProduct.cost_price ?? ''),
        exportPrice: String(existingProduct.selling_price ?? ''),
        stock: product.stock,
        minStock: existingProduct.safety_stock == null ? '' : String(existingProduct.safety_stock),
        status: existingProduct.status || (existingProduct.active ? 'Đang bán' : 'Ngừng kinh doanh'),
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Lỗi mở form sửa sản phẩm:', error.response?.data || error);
      alert(error.response?.data?.detail || error.message || 'Không thể mở thông tin sản phẩm');
    }
  };

  const refreshProducts = async () => {
    try {
      const token = localStorage.getItem('token');

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [productsResponse, batchesResponse] = await Promise.all([
        axios.get(
          'http://127.0.0.1:8000/api/v1/products',
          { headers }
        ),
        axios.get(
          'http://127.0.0.1:8000/api/v1/batches',
          { headers }
        ),
      ]);

      
    setProducts(
      mapProductsWithStock(
        productsResponse.data,
        batchesResponse.data
      )
    );


    } catch (error) {
      console.error(
        'Lỗi refresh danh sách sản phẩm:',
        error.response?.data || error
      );
    }
  };

  const handleDeleteProduct = async (sku) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa sản phẩm "${sku}" không?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Lấy danh sách product từ database
      const productsResponse = await axios.get(
        'http://127.0.0.1:8000/api/v1/products',
        { headers }
      );

      // Tìm product thật bằng SKU
      const existingProduct = productsResponse.data.find(
        item => item.sku === sku
      );

      if (!existingProduct) {
        throw new Error(
          `Không tìm thấy sản phẩm có SKU ${sku}`
        );
      }

      console.log('SKU cần xóa:', sku);
      console.log('Product ID thật:', existingProduct.id);

      // Xóa product
      await axios.delete(
        `http://127.0.0.1:8000/api/v1/products/${existingProduct.id}`,
        { headers }
      );

      console.log('Xóa sản phẩm thành công');
      alert('Xóa sản phẩm thành công!');

      // Load lại danh sách
      await refreshProducts();

    } catch (error) {
      console.error(
        'Lỗi xóa sản phẩm:',
        error.response?.data || error
      );

      alert(
        error.response?.data?.detail ||
        error.message ||
        'Xóa sản phẩm thất bại'
      );
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const selectedUnit = units.find(unit => unit.code === formData.unit);
      const selectedCategory = categories.find(
        (category) => String(category.id) === String(formData.category)
      );

      if (!selectedCategory || !Number.isInteger(Number(selectedCategory.id))) {
        alert('Danh mục không hợp lệ. Vui lòng tải lại danh mục và chọn lại.');
        return;
      }
      const payload = {
        sku: formData.id.trim(),
        name: formData.name.trim(),
        category_id: Number(selectedCategory.id),

        supplier_id: 1, // Tạm dùng ID 1 nếu nhà cung cấp này tồn tại

        cost_price: Number(formData.importPrice || 0),
        selling_price: Number(formData.exportPrice || 0),

        safety_stock:
          formData.minStock === "" ||
          formData.minStock == null
            ? 0
            : Number(formData.minStock),

        unit: selectedUnit?.name || formData.unit || "",
        status: formData.status,
      };
      console.log("Danh mục đang chọn:", formData.category);
      console.log("category_id gửi lên:", Number(formData.category));
      console.log("Payload:", payload);

      if (editingProduct) {
        const response = await axios.get('http://127.0.0.1:8000/api/v1/products', { headers });
        const existingProduct = response.data.find(item => item.sku === editingProduct.id);
        if (!existingProduct) throw new Error(`Không tìm thấy sản phẩm có SKU ${editingProduct.id}`);
        await axios.put(`http://127.0.0.1:8000/api/v1/products/${existingProduct.id}`, payload, { headers });
        alert('Cập nhật sản phẩm thành công');
      } else {
        await axios.post('http://127.0.0.1:8000/api/v1/products', payload, { headers });
        alert('Thêm sản phẩm thành công');
      }

      await refreshProducts();
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
        console.error("Lỗi lưu sản phẩm:", error);
        console.error("API URL:", error.config?.url);
        console.error("HTTP status:", error.response?.status);
        console.error("Response data:", error.response?.data);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        const message = error.response?.data?.detail
          ? JSON.stringify(error.response.data.detail)
          : error.response?.data?.message
            || (
              !error.response
                ? "Không nhận được phản hồi từ backend. Kiểm tra FastAPI, kết nối và CORS."
                : error.message
            );

        alert(`Lưu sản phẩm thất bại: ${message}`);
      }
  };

const filteredProducts = products.filter((item) => {
  const keyword = searchTerm.toLowerCase().trim();

  const matchesSearch =
    String(item.id || '').toLowerCase().includes(keyword) ||
    String(item.name || '').toLowerCase().includes(keyword) ||
    String(item.brand || '').toLowerCase().includes(keyword);

  const matchesStatus =
    statusFilter === 'Tất cả trạng thái' ||
    item.status === statusFilter;
  const matchesCategory =
    categoryFilter === 'Tất cả danh mục' || item.category === categoryFilter;

  return matchesSearch && matchesStatus && matchesCategory;
}).sort((a, b) =>
  String(a.id || '').localeCompare(String(b.id || ''), 'vi', {
    numeric: true,
    sensitivity: 'base',
  })
);
  const totalStock = products.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  const expiryTrackedCount = products.filter((item) => item.tracksExpiry).length;
  const inventoryValue = products.reduce((sum, item) => {
    const importPrice = Number(item.importPriceValue) || 0;
    const stock = Number(item.stock) || 0;

    return sum + importPrice * stock;
  }, 0);
  const lowStockProducts = products.filter((item) => {
    const stock = Number(item.stock ?? 0);

    if (!item.hasReceivedStock) return false;

    if (
      item.minStock === null ||
      item.minStock === undefined ||
      item.minStock === ''
    ) {
      return false;
    }

    const minStock = Number(item.minStock);

    if (!Number.isFinite(minStock) || minStock <= 0) {
      return false;
    }

    return stock <= minStock;
  });

  const lowStockCount = lowStockProducts.length;
  return (
    <div className="product-page">
      <section className="product-page-heading">
        <div>
          <h1>Quản lý sản phẩm</h1>
        </div>
        <div className="product-heading-actions">
          <button type="button" className="product-btn product-btn-light" onClick={() => alert('Chức năng nhập Excel sẽ được kết nối sau.')}>
            <span>Nhập Excel</span>
          </button>
          <button type="button" className="product-btn product-btn-light" onClick={() => window.print()}>
            <span>Xuất báo cáo</span>
          </button>
          {canManageProducts && (
            <button type="button" className="product-btn product-btn-primary" onClick={handleOpenAddModal}>
              ＋ Thêm sản phẩm
            </button>
          )}
        </div>
      </section>

      <section className="product-stats-grid">
        <div className="product-stat-card">
          <div className="product-stat-label">TỔNG MẶT HÀNG </div>
          <div className="product-stat-value">{products.length.toLocaleString('vi-VN')}</div>
          <div className="product-stat-note">Sản phẩm trong danh mục</div>
        </div>
        <div className="product-stat-card">
          <div className="product-stat-label">TỔNG ĐƠN VỊ TỒN KHO </div>
          <div className="product-stat-value">{totalStock.toLocaleString('vi-VN')}</div>
          <div className="product-stat-note">Tổng số lượng theo lô</div>
        </div>
        <div className="product-stat-card">
          <div className="product-stat-label">CẢNH BÁO TỒN KHO</div>
          <div className="product-stat-value product-stat-warning">
            {lowStockCount.toLocaleString('vi-VN')}
          </div>
          <div className="product-stat-note">
            Sản phẩm đã nhập kho có tồn ≤ mức tối thiểu
          </div>
        </div>
        <div className="product-stat-card">
          <div className="product-stat-label">GIÁ TRỊ TỒN KHO ƯỚC TÍNH </div>
          <div className="product-stat-value product-stat-money">{inventoryValue.toLocaleString('vi-VN')} ₫</div>
          <div className="product-stat-note">Tạm tính theo giá nhập</div>
        </div>
      </section>

      <section className="product-toolbar">
        <div className="product-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            type="text"
            className="product-search-input"
            placeholder="Tìm kiếm mã, tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="product-filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option>Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>{category.name}</option>
          ))}
        </select>
        <select
          className="product-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>Tất cả trạng thái</option>
          <option>Đang bán</option>
          <option>Ngừng kinh doanh</option>
        </select>
        <div className="list-count">
          Đang xem {filteredProducts.length}/{products.length} sản phẩm
        </div>
        
      </section>

      <div className="product-table-card">
        <div className="product-table-scroll">
          <table className="product-data-table">
            <thead>
              <tr>
                <th className="product-checkbox-cell"><input type="checkbox" aria-label="Chọn tất cả" /></th>
                <th>MÃ SP</th>
                <th>TÊN SẢN PHẨM</th>
                <th>DANH MỤC</th>
                <th>ĐƠN VỊ</th>
                <th className="number-cell">GIÁ NHẬP</th>
                <th className="number-cell">GIÁ XUẤT</th>
                <th className="number-cell">TỒN KHO</th>
                <th>THƯƠNG HIỆU</th>
                <th>NGÀY TẠO</th>
                <th>TRẠNG THÁI</th>
                {canManageProducts && (
                  <th>THAO TÁC</th>
                )}
              </tr>
            </thead>
            
            <tbody>
              {filteredProducts.map((item) => (
                <tr key={item.id}>
                  <td className="product-checkbox-cell">
                    <input
                      type="checkbox"
                      aria-label={`Chọn ${item.name}`}
                    />
                  </td>

                  <td className="product-sku">{item.id}</td>

                  <td className="product-name-cell">{item.name}</td>

                  <td>
                    <span className="product-category-text">
                      {toText(item.category) || 'Chưa phân loại'}
                    </span>
                  </td>

                  <td>
                    <span className="product-unit-pill">
                      {toText(item.unit) || '—'}
                    </span>
                  </td>

                  <td className="number-cell">{item.importPrice}</td>

                  <td className="number-cell product-price-strong">
                    {item.exportPrice}
                  </td>

                  <td
                    className={`number-cell product-stock ${
                      Number(item.stock) <= Number(item.minStock) ? 'is-low' : ''
                    }`}
                  >
                    {item.stock}
                  </td>

                  <td>{toText(item.brand) || '—'}</td>

                  <td>
                    {formatCreatedDate(item.date)}
                  </td>

                  <td>
                    <span
                      className={`product-status-pill ${
                        item.status === 'Đang bán' ? 'is-active' : 'is-inactive'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td>
                    <div className="product-row-actions">
                      {canManageProducts && (
                        <>

                        <button
                          type="button"
                          className="product-row-action"
                          title="Chỉnh sửa"
                          onClick={() => handleOpenEditModal(item)}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="product-row-action is-delete"
                          title="Xóa"
                          onClick={() => handleDeleteProduct(item.id)}
                        >
                          ⌫
                        </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={12} className="product-empty-state">
                    Không tìm thấy sản phẩm phù hợp.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* POPUP MODAL THÊM / SẢN PHẨM CHUẨN GIAO DIỆN */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              width: '500px',
              maxWidth: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: '20px',
                color: '#1e293b'
              }}
            >
              {editingProduct
                ? 'Chỉnh sửa thông tin Sản phẩm'
                : 'Thêm Sản Phẩm Mới (Thị trường)'}
            </h3>

            <form
              onSubmit={handleSaveProduct}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '5px',
                    color: '#475569'
                  }}
                >
                  Mã sản phẩm (SKU)
                </label>

                <input
                  required
                  disabled={editingProduct !== null}
                  className="erp-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  placeholder="VD: SP002"
                  value={formData.id}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      id: e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '5px',
                    color: '#475569'
                  }}
                >
                  Tên sản phẩm
                </label>

                <input
                  required
                  className="erp-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Nhập tên sản phẩm..."
                  value={formData.name}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      name: e.target.value
                    })
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '5px',
                    color: '#475569'
                  }}
                >
                  Trạng thái
                </label>

                <select
                  className="erp-select"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  value={formData.status}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      status: e.target.value
                    })
                  }
                >
                  <option value="Đang bán">Đang bán</option>
                  <option value="Ngừng kinh doanh">
                    Ngừng kinh doanh
                  </option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '5px',
                      color: '#475569'
                    }}
                  >
                    Danh mục
                  </label>

                  <select
                    required
                    className="product-category-select"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  >
                    <option value="">-- Chọn danh mục --</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '5px',
                      color: '#475569'
                    }}
                  >
                    Đơn vị tính
                  </label>

                  <select
                    className="erp-select"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={typeof formData.unit === 'string' ? formData.unit : ''}
                    onChange={e =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                  >
                    <option value="">-- Chọn đơn vị --</option>

                    {Array.isArray(units) &&
                      units.map(unit => (
                        <option
                          key={unit.code}
                          value={unit.code}
                        >
                          {typeof unit.name === 'string' ? unit.name : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '5px',
                      color: '#475569'
                    }}
                  >
                    Giá nhập (₫)
                  </label>

                  <input
                    required
                    className="erp-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    placeholder="0"
                    type="number"
                    value={formData.importPrice}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        importPrice: e.target.value
                      })
                    }
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '5px',
                      color: '#475569'
                    }}
                  >
                    Giá xuất (₫)
                  </label>

                  <input
                    required
                    className="erp-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    placeholder="0"
                    type="number"
                    value={formData.exportPrice}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        exportPrice: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '5px',
                    color: '#475569'
                  }}
                >
                  Thương hiệu
                </label>

                <select
                  className="erp-select"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={
                    typeof formData.brandCode === 'string'
                      ? formData.brandCode
                      : ''
                  }
                  onChange={e =>
                    setFormData({ ...formData, brandCode: e.target.value })
                  }
                >
                  <option value="">-- Chưa chọn thương hiệu --</option>

                  {Array.isArray(brands) &&
                    brands.map(brand => (
                      <option
                        key={brand.code}
                        value={brand.code}
                      >
                        {typeof brand.name === 'string' ? brand.name : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '5px',
                    color: '#475569',
                  }}
                >
                  Mức tồn kho tối thiểu
                </label>

                <input
                  className="erp-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  type="number"
                  min="0"
                  placeholder="Nhập mức tồn tối thiểu"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minStock: e.target.value,
                    }))
                  }
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '15px'
                }}
              >
                <button
                  type="button"
                  className="erp-btn-primary"
                  style={{
                    flex: 1,
                    background: '#e2e8f0',
                    color: '#475569',
                    justifyContent: 'center'
                  }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="erp-btn-primary"
                  style={{
                    flex: 1,
                    justifyContent: 'center'
                  }}
                >
                  Lưu Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
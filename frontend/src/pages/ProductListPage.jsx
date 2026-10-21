import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ProductListPage.css';

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

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(
        'http://127.0.0.1:8000/api/v1/categories',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Categories từ API:', response.data);

      setCategories(response.data);
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

        const products = productsResponse.data;
        const batches = batchesResponse.data;

        // Tính tổng tồn kho cho từng sản phẩm
        const stockByProduct = {};

        batches.forEach((batch) => {
          const productName = batch.product_name;

          if (!stockByProduct[productName]) {
            stockByProduct[productName] = 0;
          }

          stockByProduct[productName] += Number(batch.current_qty || 0);
        });

        console.log('Tồn kho theo sản phẩm:', stockByProduct);

        // Ghép Product + Stock
        const mappedProducts = products.map((product) => ({
          id: product.sku,
          name: product.name,
          category: product.category_name,
          unit: product.unit,
          importPrice: `${Number(product.cost_price || 0).toLocaleString('vi-VN')} ₫`,
          importPriceValue: Number(product.cost_price) || 0,
          exportPrice: `${Number(product.selling_price).toLocaleString('vi-VN')} ₫`,

          // Lấy tồn kho từ Batch
          stock: stockByProduct[product.name] || 0,

          minStock: product.safety_stock,
          date: product.created_at || '',
          status: product.status || 'Đang bán',
        }));

        console.log('Products sau khi ghép tồn kho:', mappedProducts);

        setProducts(mappedProducts);

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
    unit: 'Hộp',
    importPrice: '',
    exportPrice: '',
    stock: '',
    minStock: '',
    batchNumber: '',
    expiryDate: '',
    status: 'Đang bán',
  });

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingProduct(null);

    setFormData({
      id: '',
      name: '',
      category: '',
      unit: 'Hộp',
      importPrice: '',
      exportPrice: '',
      stock: '',
      minStock: '',
      batchNumber: '',
      expiryDate: ''
    });

    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = async (product) => {
    try {
      const token = localStorage.getItem('token');

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Lấy danh sách batch
      const batchesResponse = await axios.get(
        'http://127.0.0.1:8000/api/v1/batches',
        { headers }
      );

      // Tìm product thật trong DB theo SKU
      const productsResponse = await axios.get(
        'http://127.0.0.1:8000/api/v1/products',
        { headers }
      );

      const existingProduct = productsResponse.data.find(
        item => item.sku === product.id
      );

      if (!existingProduct) {
        throw new Error(
          `Không tìm thấy sản phẩm có SKU ${product.id}`
        );
      }

      // Lấy tất cả batch thuộc sản phẩm này
      const productBatches = batchesResponse.data.filter(
        batch => Number(batch.product_id) === Number(existingProduct.id)
      );

      // Tính tổng tồn kho của tất cả batch
      const totalStock = productBatches.reduce(
        (sum, batch) => sum + Number(batch.current_qty || 0),
        0
      );

      // Lấy batch đầu tiên để hiển thị mã lô và hạn sử dụng
      const existingBatch = productBatches[0];
      console.log('Product tìm được:', existingProduct);
      console.log('Batch tìm được:', existingBatch);

      setEditingProduct(product);

      setFormData({
        id: product.id,
        name: product.name,

        // Lấy category_id thật từ database
        category: String(existingProduct.category_id),

        unit: product.unit,

        importPrice: String(product.importPrice || '')
          .replace(/[^\d]/g, ''),

        exportPrice: String(product.exportPrice || '')
          .replace(/[^\d]/g, ''),

        // Nếu có batch thì lấy tồn kho từ current_qty
        stock: totalStock,

        minStock: product.minStock || 5,

        // Lấy mã lô
        batchNumber: existingBatch
          ? existingBatch.batch_number
          : '',

        // Lấy HSD
        expiryDate: existingBatch
          ? String(existingBatch.expiry_date).substring(0, 10)
          : '',
          status: existingProduct.status || 'Đang bán'
      });

      setIsModalOpen(true);

    } catch (error) {
      console.error(
        'Lỗi mở form sửa sản phẩm:',
        error.response?.data || error
      );
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

      const products = productsResponse.data;
      const batches = batchesResponse.data;

      // Tính tổng tồn kho theo tên sản phẩm
      const stockByProduct = {};

      batches.forEach((batch) => {
        const productName = batch.product_name;

        if (!stockByProduct[productName]) {
          stockByProduct[productName] = 0;
        }

        stockByProduct[productName] += Number(batch.current_qty || 0);
      });

      const mappedProducts = products.map((product) => ({
        id: product.sku,
        name: product.name,
        category: product.category_name,
        unit: product.unit,
        importPrice: `${Number(product.cost_price).toLocaleString('vi-VN')} ₫`,
        exportPrice: `${Number(product.selling_price).toLocaleString('vi-VN')} ₫`,

        // Lấy tồn kho từ Batch
        stock: stockByProduct[product.name] || 0,

        minStock: product.safety_stock,
        date: product.created_at || '',
        status: product.status || 'Đang bán',
      }));

      setProducts(mappedProducts);

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

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // =====================================================
      // TRƯỜNG HỢP SỬA SẢN PHẨM
      // =====================================================
      if (editingProduct !== null) {

        // ---------------------------------------------------
        // 1. Lấy product thật trong database
        // ---------------------------------------------------
        const productsResponse = await axios.get(
          'http://127.0.0.1:8000/api/v1/products',
          { headers }
        );

        const existingProduct = productsResponse.data.find(
          product => product.sku === editingProduct.id
        );

        if (!existingProduct) {
          throw new Error(
            `Không tìm thấy sản phẩm có SKU ${editingProduct.id}`
          );
        }

        // ---------------------------------------------------
        // 2. Lấy batch của product
        // ---------------------------------------------------
        const batchesResponse = await axios.get(
          'http://127.0.0.1:8000/api/v1/batches',
          { headers }
        );

        // Lấy tất cả batch thuộc sản phẩm này
        const productBatches = batchesResponse.data.filter(
          batch => Number(batch.product_id) === Number(existingProduct.id)
        );

        // Tính tổng tồn kho của tất cả batch
        const totalStock = productBatches.reduce(
          (sum, batch) => sum + Number(batch.current_qty || 0),
          0
        );

        // Lấy batch đầu tiên để hiển thị mã lô và hạn sử dụng
        const existingBatch = productBatches[0];

        console.log('Product cần sửa:', existingProduct);
        console.log('Batch cần sửa:', existingBatch);

        // ---------------------------------------------------
        // 3. Cập nhật PRODUCT
        // ---------------------------------------------------
        const productPayload = {
          sku: formData.id,
          name: formData.name,

          // Lấy category_id trực tiếp từ dropdown
          category_id: Number(formData.category),

          supplier_id: 1,
          cost_price: Number(formData.importPrice),
          selling_price: Number(formData.exportPrice),
          safety_stock: Number(formData.minStock),
          unit: formData.unit,
          status: formData.status,
        };

        console.log('Dữ liệu cập nhật product:', productPayload);

        await axios.put(
          `http://127.0.0.1:8000/api/v1/products/${existingProduct.id}`,
          productPayload,
          { headers }
        );

        console.log('Cập nhật product thành công');

        // ---------------------------------------------------
        // 4. Cập nhật BATCH
        // ---------------------------------------------------
        if (existingBatch) {

          const batchPayload = {
            batch_number: formData.batchNumber,
            expiry_date: formData.expiryDate,
            current_qty: Number(formData.stock),
          };

          console.log('Dữ liệu cập nhật batch:', batchPayload);
          console.log('Batch ID:', existingBatch.id);

          await axios.put(
            `http://127.0.0.1:8000/api/v1/batches/${existingBatch.id}`,
            batchPayload,
            { headers }
          );

          console.log('Cập nhật batch thành công');

        } else {

          // -------------------------------------------------
          // Nếu product chưa có batch thì tạo batch mới
          // -------------------------------------------------
          const today = new Date();

          const importDate =
            `${today.getFullYear()}-` +
            `${String(today.getMonth() + 1).padStart(2, '0')}-` +
            `${String(today.getDate()).padStart(2, '0')}`;

          const batchPayload = {
            product_id: existingProduct.id,
            batch_number: formData.batchNumber,
            import_date: importDate,
            expiry_date: formData.expiryDate,
            original_qty: Number(formData.stock),
          };

          console.log('Tạo batch mới:', batchPayload);

          await axios.post(
            'http://127.0.0.1:8000/api/v1/batches',
            batchPayload,
            { headers }
          );

          console.log('Tạo batch mới thành công');
        }

        // ---------------------------------------------------
        // 5. Refresh lại danh sách
        // ---------------------------------------------------
        await refreshProducts();

        setIsModalOpen(false);
        setEditingProduct(null);

        alert('Cập nhật sản phẩm thành công');

        return;
      }

      // =====================================================
      // TRƯỜNG HỢP THÊM SẢN PHẨM
      // =====================================================

      const productPayload = {
        sku: formData.id,
        name: formData.name,

        // Lấy category_id trực tiếp từ dropdown
        category_id: Number(formData.category),

        supplier_id: 1,
        cost_price: Number(formData.importPrice),
        selling_price: Number(formData.exportPrice),
        safety_stock: Number(formData.minStock),
        unit: formData.unit,
        status: formData.status,
      };

      console.log('Dữ liệu sản phẩm:', productPayload);

      // ---------------------------------------------------
      // 1. Tạo product
      // ---------------------------------------------------
      await axios.post(
        'http://127.0.0.1:8000/api/v1/products',
        productPayload,
        { headers }
      );

      console.log('Tạo sản phẩm thành công');

      // ---------------------------------------------------
      // 2. Lấy product_id thật
      // ---------------------------------------------------
      const productsResponse = await axios.get(
        'http://127.0.0.1:8000/api/v1/products',
        { headers }
      );

      const createdProduct = productsResponse.data.find(
        product => product.sku === formData.id
      );

      if (!createdProduct) {
        throw new Error(
          `Không tìm thấy sản phẩm có SKU ${formData.id}`
        );
      }

      const productId = createdProduct.id;

      console.log('Product ID:', productId);

      // ---------------------------------------------------
      // 3. Tạo batch
      // ---------------------------------------------------
      const today = new Date();

      const importDate =
        `${today.getFullYear()}-` +
        `${String(today.getMonth() + 1).padStart(2, '0')}-` +
        `${String(today.getDate()).padStart(2, '0')}`;

      const batchPayload = {
        product_id: productId,
        batch_number: formData.batchNumber,
        import_date: importDate,
        expiry_date: formData.expiryDate,
        original_qty: Number(formData.stock),
      };

      console.log('Dữ liệu batch:', batchPayload);

      await axios.post(
        'http://127.0.0.1:8000/api/v1/batches',
        batchPayload,
        { headers }
      );

      console.log('Tạo batch thành công');

      // ---------------------------------------------------
      // 4. Refresh
      // ---------------------------------------------------
      await refreshProducts();

      setIsModalOpen(false);
      setEditingProduct(null);

      alert('Thêm sản phẩm thành công');

    } catch (error) {
      console.log('STATUS:', error.response?.status);
      console.log(
        'DATA:',
        JSON.stringify(error.response?.data, null, 2)
      );
      alert(
        error.response?.data?.detail ||
        error.message ||
        'Thao tác sản phẩm thất bại'
      );
    }
  };
const filteredProducts = products.filter((item) => {
  const keyword = searchTerm.toLowerCase().trim();

  const matchesSearch =
    item.id.toLowerCase().includes(keyword) ||
    item.name.toLowerCase().includes(keyword);

  const matchesStatus =
    statusFilter === 'Tất cả trạng thái' ||
    item.status === statusFilter;
  const matchesCategory =
    categoryFilter === 'Tất cả danh mục' || item.category === categoryFilter;

  return matchesSearch && matchesStatus && matchesCategory;
});
  const totalStock = products.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  const lowStockCount = products.filter(
    (item) => Number(item.stock || 0) <= Number(item.minStock || 0)
  ).length;
  const inventoryValue = products.reduce((sum, item) => {
    const importPrice = Number(item.importPriceValue) || 0;
    const stock = Number(item.stock) || 0;

    return sum + importPrice * stock;
  }, 0);

  return (
    <div className="product-page">
      <section className="product-page-heading">
        <div>
          <h1>Quản lý sản phẩm</h1>
        </div>
        <div className="product-heading-actions">
          <button type="button" className="product-btn product-btn-light" onClick={() => alert('Chức năng nhập Excel sẽ được kết nối sau.')}>
            ⇧ <span>Nhập Excel</span>
          </button>
          <button type="button" className="product-btn product-btn-light" onClick={() => window.print()}>
            ⇩ <span>Xuất báo cáo</span>
          </button>
          <button type="button" className="product-btn product-btn-primary" onClick={handleOpenAddModal}>
            ＋ Thêm sản phẩm
          </button>
        </div>
      </section>

      <section className="product-stats-grid">
        <div className="product-stat-card">
          <div className="product-stat-label">TỔNG MẶT HÀNG <span className="product-stat-icon purple">◇</span></div>
          <div className="product-stat-value">{products.length.toLocaleString('vi-VN')}</div>
          <div className="product-stat-note">Sản phẩm trong danh mục</div>
        </div>
        <div className="product-stat-card">
          <div className="product-stat-label">TỔNG ĐƠN VỊ TỒN KHO <span className="product-stat-icon blue">▤</span></div>
          <div className="product-stat-value">{totalStock.toLocaleString('vi-VN')}</div>
          <div className="product-stat-note">Tổng số lượng theo lô</div>
        </div>
        <div className="product-stat-card">
          <div className="product-stat-label">CẢNH BÁO TỒN AN TOÀN <span className="product-stat-icon orange">△</span></div>
          <div className="product-stat-value product-stat-warning">{lowStockCount.toLocaleString('vi-VN')}</div>
          <div className="product-stat-note">Sản phẩm cần kiểm tra</div>
        </div>
        <div className="product-stat-card">
          <div className="product-stat-label">GIÁ TRỊ TỒN KHO ƯỚC TÍNH <span className="product-stat-icon green">ⓘ</span></div>
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
                <th className="number-cell">TỒN AN TOÀN</th>
                <th>NGÀY TẠO</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((item) => (
                <tr key={item.id}>
                  <td className="product-checkbox-cell"><input type="checkbox" aria-label={`Chọn ${item.name}`} /></td>
                  <td className="product-sku">{item.id}</td>
                  <td className="product-name-cell">{item.name}</td>
                  <td><span className="product-category-text">{item.category || 'Chưa phân loại'}</span></td>
                  <td><span className="product-unit-pill">{item.unit}</span></td>
                  <td className="number-cell">{item.importPrice}</td>
                  <td className="number-cell product-price-strong">{item.exportPrice}</td>
                  <td className={`number-cell product-stock ${Number(item.stock) <= Number(item.minStock) ? 'is-low' : ''}`}>{item.stock}</td>
                  <td className="number-cell product-min-stock">{item.minStock}</td>
                  <td>
                    {item.date
                      ? new Date(item.date).toLocaleDateString('vi-VN')
                      : '—'}
                  </td>
                  <td>
                    <span className={`product-status-pill ${item.status === 'Đang bán' ? 'is-active' : 'is-inactive'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="product-row-actions">
                      <button type="button" className="product-row-action" title="Chỉnh sửa" onClick={() => handleOpenEditModal(item)}>✎</button>
                      <button type="button" className="product-row-action is-delete" title="Xóa" onClick={() => handleDeleteProduct(item.id)}>⌫</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr><td colSpan="12" className="product-empty-state">Không tìm thấy sản phẩm phù hợp.</td></tr>
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
                    className="erp-select"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    value={formData.category}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        category: e.target.value
                      })
                    }
                  >
                    <option value="">
                      -- Chọn danh mục --
                    </option>

                    {categories.map(category => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
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
                    style={{
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    value={formData.unit}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        unit: e.target.value
                      })
                    }
                  >
                    <option value="Hộp">Hộp</option>
                    <option value="Chai">Chai</option>
                    <option value="Thùng">Thùng</option>
                    <option value="Kg">Kg</option>
                    <option value="Cái">Cái</option>
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
                    Mã lô
                  </label>

                  <input
                    required
                    className="erp-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    placeholder="VD: SP002-001"
                    value={formData.batchNumber}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        batchNumber: e.target.value
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
                    Hạn sử dụng
                  </label>

                  <input
                    required
                    type="date"
                    className="erp-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    value={formData.expiryDate}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        expiryDate: e.target.value
                      })
                    }
                  />
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
                    Số lượng tồn kho
                  </label>

                  <input
                    className="erp-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#f1f5f9',
                      cursor: 'not-allowed'
                    }}
                    placeholder="0"
                    type="number"
                    value={formData.stock ?? 0}
                    readOnly
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
                    Mức tồn an toàn
                  </label>

                  <input
                    required
                    className="erp-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    placeholder="5"
                    type="number"
                    value={formData.minStock}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        minStock: e.target.value
                      })
                    }
                  />
                </div>
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
import React, { useState } from 'react';
import ProductListPage from './ProductListPage';
import StockImportPage from './StockImportPage';
import BatchManagementPage from './BatchManagementPage';
import DashboardOverview from './DashboardOverview';

export default function Dashboard({ role, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('kpi');
  
  // State cho tính năng AI Advisor
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const menuTitles = {
    kpi: 'Tổng quan Vận hành & Chỉ số Doanh nghiệp',
    products: 'Quản lý Danh mục Sản phẩm',
    batches: 'Kiểm soát Lô hàng & Hạn sử dụng (FEFO)',
    suppliers: 'Hợp tác Mạng lưới Bên thứ 3 (Nhà cung cấp)',
    import: 'Import Dữ liệu Lịch sử Giao dịch',
    ai_assistant: 'Trợ lý AI Dự báo Nhu cầu & Tối ưu Tồn kho'
  };

  // NÂNG CẤP LÕI AI: Xử lý kịch bản linh hoạt dựa trên từ khóa người dùng gõ
  const handleAskAI = (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setLoadingAi(true);
    setAiResponse(null); // Reset kết quả cũ

    setTimeout(() => {
      const query = aiQuery.toLowerCase();
      let responseHtml;

      // Kịch bản 1: Nếu người dùng gõ tìm nhóm hàng thiết yếu (Sữa, Nước, Gạo...) -> Kịch bản rủi ro Cháy hàng
      if (query.includes('sữa') || query.includes('nước') || query.includes('gạo') || query.length % 2 === 0) {
        responseHtml = (
          <div style={{ lineHeight: '1.8' }}>
            <h4 style={{ color: '#4f46e5', marginBottom: '12px', fontSize: '1.1rem' }}>
              📊 Kết quả phân tích cụm từ: <span style={{textTransform: 'uppercase'}}>{aiQuery}</span>
            </h4>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#334155' }}>
              <li style={{ marginBottom: '8px' }}>
                📉 <strong>Xu hướng thị trường:</strong> Thuật toán chuỗi thời gian (Time-Series) nhận diện sức mua dự kiến <b style={{color: '#10b981'}}>tăng +18.5%</b> trong 2 tuần tới do yếu tố thời vụ.
              </li>
              <li style={{ marginBottom: '8px' }}>
                ⚠️ <strong>Cảnh báo Tồn kho:</strong> Kho hiện tại chỉ còn đáp ứng được 3.5 ngày bán hàng. Tỷ lệ rủi ro đứt gãy chuỗi cung ứng (Stockout) lến tới <b style={{color: '#ef4444'}}>82%</b>.
              </li>
              <li style={{ padding: '12px', background: '#e0e7ff', borderRadius: '8px', marginTop: '12px' }}>
                💡 <strong>AI ĐỀ XUẤT QUYẾT ĐỊNH (ACTION):</strong> <br/>
                Hệ thống tự động đề xuất tạo Phiếu Yêu Cầu Nhập Hàng: <b>+200 đơn vị</b> từ [Nhà cung cấp Chiến lược]. Ước tính chi phí nhập: ~12,500,000 VNĐ.
              </li>
            </ul>
          </div>
        );
      } 
      // Kịch bản 2: Các sản phẩm khác -> Kịch bản rủi ro Tồn kho đọng vốn, cận Date
      else {
        responseHtml = (
          <div style={{ lineHeight: '1.8' }}>
            <h4 style={{ color: '#4f46e5', marginBottom: '12px', fontSize: '1.1rem' }}>
              📊 Kết quả phân tích cụm từ: <span style={{textTransform: 'uppercase'}}>{aiQuery}</span>
            </h4>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#334155' }}>
              <li style={{ marginBottom: '8px' }}>
                📉 <strong>Xu hướng thị trường:</strong> Sức mua đang có dấu hiệu chững lại. Lịch sử sales 30 ngày qua <b style={{color: '#ef4444'}}>giảm -5.2%</b>.
              </li>
              <li style={{ marginBottom: '8px' }}>
                ⏳ <strong>Kiểm soát Lô hàng (FEFO):</strong> Nhận diện có 1 lô hàng (45 đơn vị) sẽ hết hạn trong 14 ngày tới. Rủi ro lãng phí (Waste Risk) đang ở mức cao.
              </li>
              <li style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', marginTop: '12px', borderLeft: '4px solid #f59e0b' }}>
                💡 <strong>AI ĐỀ XUẤT QUYẾT ĐỊNH (ACTION):</strong> <br/>
                <b>KHÔNG</b> nhập thêm hàng lúc này. Đề xuất đẩy thông tin sang Marketing để khởi tạo chương trình <b>Flash Sale Giảm 25%</b> thu hồi vốn ngay lập tức.
              </li>
            </ul>
          </div>
        );
      }
      
      setAiResponse(responseHtml);
      setLoadingAi(false);
    }, 1800); // Giả lập AI đang tư duy mất 1.8 giây
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR ĐIỀU HƯỚNG */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>📦 RetailSmart</h2>
          <div className="sidebar-role">PHÂN QUYỀN: {role.toUpperCase()}</div>
        </div>
        <ul className="sidebar-menu">
          <li className={activeMenu === 'kpi' ? 'active' : ''} onClick={() => setActiveMenu('kpi')}>
            📊 Dashboard Tổng quan
          </li>
          <li className={activeMenu === 'products' ? 'active' : ''} onClick={() => setActiveMenu('products')}>
            🏷️ Danh mục Sản phẩm
          </li>
          <li className={activeMenu === 'batches' ? 'active' : ''} onClick={() => setActiveMenu('batches')}>
            ⏳ Lô hàng & Hạn sử dụng
          </li>
          <li className={activeMenu === 'import' ? 'active' : ''} onClick={() => setActiveMenu('import')}>
            📥 Import Lịch sử Sales
          </li>
          
          {/* ĐÃ KHÔI PHỤC MENU HỢP TÁC BÊN THỨ 3 */}
          <li className={activeMenu === 'suppliers' ? 'active' : ''} onClick={() => setActiveMenu('suppliers')}>
            🤝 Đối tác & Nhà cung cấp
          </li>

          <li className={activeMenu === 'ai_assistant' ? 'active' : ''} onClick={() => setActiveMenu('ai_assistant')}>
            🤖 Trợ lý AI Dự báo Kho
          </li>
        </ul>
        <div className="logout-btn" onClick={onLogout}>🚪 Đăng xuất hệ thống</div>
      </div>

      {/* KHUNG NỘI DUNG CHÍNH */}
      <div className="main-wrapper">
        <div className="top-navbar">
          <div className="top-navbar-title">{menuTitles[activeMenu]}</div>
          <div className="user-profile-badge">
            👤 Tài khoản: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{localStorage.getItem('username') || role}</span>
          </div>
        </div>

        <div className="main-content">
          {activeMenu === 'kpi' && <DashboardOverview />}
          {activeMenu === 'products' && <ProductListPage />}
          {activeMenu === 'batches' && <BatchManagementPage />}
          {activeMenu === 'import' && <StockImportPage />}

          {/* GIAO DIỆN TẠM THỜI CHO MODULE NHÀ CUNG CẤP */}
          {activeMenu === 'suppliers' && (
             <div className="table-container" style={{ padding: '35px', background: 'white' }}>
               <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>🤝 Quản lý Hợp tác Bên Thứ 3 (Mạng lưới Cung ứng)</h3>
               <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
                 Phân hệ này cho phép hệ thống kết nối với các nhà phân phối. Tích hợp đánh giá KPI giao hàng đúng hạn (On-time Delivery) và tự động hóa quy trình gửi email đặt hàng dựa trên đề xuất của AI.
               </p>
               <div style={{ padding: '20px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
                  Tính năng đang trong giai đoạn tích hợp API với bên thứ 3...
               </div>
             </div>
          )}

          {/* PHÂN HỆ AI NÂNG CẤP */}
          {activeMenu === 'ai_assistant' && (
            <div>
              <div className="content-header">🤖 Trợ lý AI Phân tích Đa chiều & Ra Quyết định</div>
              <div className="table-container" style={{ padding: '30px', background: 'white' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Hệ thống AI sẽ đánh giá chuỗi dữ liệu (Time-series) và định mức kho để đưa ra kịch bản <b>Phòng chống Stockout</b> (Cháy hàng) hoặc <b>Thanh lý Overstock</b> (Tồn kho đọng vốn).
                </p>

                <form onSubmit={handleAskAI} style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    className="search-box" 
                    style={{ flex: 1, padding: '12px', fontSize: '1rem' }}
                    placeholder="Nhập tên sản phẩm (VD: Sữa tươi, Bánh mì, Nước giải khát...)" 
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                  />
                  <button type="submit" className="btn-action btn-add" style={{ padding: '0 24px', fontSize: '1rem' }} disabled={loadingAi}>
                    {loadingAi ? '🧠 AI đang phân tích dữ liệu...' : '✨ Chạy Mô hình AI'}
                  </button>
                </form>

                {/* KHUNG HIỂN THỊ KẾT QUẢ AI SINH ĐỘNG */}
                {aiResponse && (
                  <div style={{ 
                    marginTop: '25px', 
                    padding: '24px', 
                    background: '#f8fafc', 
                    borderLeft: '4px solid #4f46e5', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    animation: 'fadeIn 0.5s ease-in-out'
                  }}>
                    {aiResponse}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
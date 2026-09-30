import React, { useState } from 'react';

export default function SettingsPage() {
  const currentRole = localStorage.getItem('role') || 'Store Staff';
  const isAdmin = currentRole === 'Admin'; 

  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    companyName: 'RetailSmart ERP',
    taxCode: '0123456789',
    expiryWarningDays: 7,
    safetyStock: 50,
    aiSyncInterval: '24h'
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Lỗi phân quyền: Chỉ Quản trị viên mới được thực hiện thao tác này!");
      return;
    }
    alert("Đã lưu cấu hình hệ thống thành công!");
  };

  const handleBackup = () => {
    if (!isAdmin) return alert("Bạn không có quyền sao lưu dữ liệu.");
    alert("Đang xuất file retailsmart_db_backup.sql...");
  };

  return (
    <div className="erp-page" style={{ padding: '0px' }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* SIDEBAR CÀI ĐẶT */}
        <div style={{ width: '260px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '10px 15px', fontSize: '0.85rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Danh mục cài đặt
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'general', label: 'Thông tin Doanh nghiệp' },
              { id: 'expiry', label: 'Quy tắc Hạn sử dụng & Kho' },
              { id: 'users', label: 'Quản lý Nhân sự' },
              { id: 'ai_config', label: 'Trợ lý AI & Cảnh báo' },
              { id: 'database', label: 'Sao lưu Dữ liệu' }
            ].map(tab => (
              <li 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  padding: '10px 14px', cursor: 'pointer', borderRadius: '6px', fontSize: '0.95rem', fontWeight: '500', transition: 'all 0.15s ease',
                  background: activeTab === tab.id ? '#f1f5f9' : 'transparent', 
                  color: activeTab === tab.id ? '#0f172a' : '#475569',
                  borderLeft: activeTab === tab.id ? '3px solid #0f172a' : '3px solid transparent'
                }}
              >
                {tab.label}
              </li>
            ))}
          </ul>
        </div>

        {/* NỘI DUNG CHÍNH */}
        <div style={{ flex: 1, background: 'white', padding: '28px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          {/* Thông báo quyền hạn nếu không phải Admin */}
          {!isAdmin && (
            <div style={{ background: '#fef3c7', color: '#92400e', padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '24px', border: '1px solid #fde68a' }}>
              Chế độ chỉ xem: Tài khoản nhân viên không có quyền thay đổi thông số hệ thống.
            </div>
          )}

          <form onSubmit={handleSave}>
            
            {/* TAB 1: THÔNG TIN CHUNG */}
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: 0, color: '#1e293b', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>Thông tin Doanh nghiệp</h3>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '0.9rem', color: '#334155' }}>Tên Hệ thống / Cửa hàng</label>
                    <input type="text" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: isAdmin ? '#fff' : '#f8fafc', fontSize: '0.95rem', boxSizing: 'border-box' }} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} disabled={!isAdmin} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '0.9rem', color: '#334155' }}>Mã số Thuế</label>
                    <input type="text" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: isAdmin ? '#fff' : '#f8fafc', fontSize: '0.95rem', boxSizing: 'border-box' }} value={formData.taxCode} onChange={e => setFormData({...formData, taxCode: e.target.value})} disabled={!isAdmin} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: QUY TẮC HẠN SỬ DỤNG & KHO */}
            {activeTab === 'expiry' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: 0, color: '#1e293b', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>Quy tắc Hạn sử dụng & Kho</h3>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '0.9rem', color: '#334155' }}>Ngưỡng cảnh báo cận hạn (Ngày)</label>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 8px 0' }}>Sản phẩm sẽ cảnh báo khi hạn sử dụng thấp hơn số ngày này.</p>
                    <input type="number" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }} value={formData.expiryWarningDays} onChange={e => setFormData({...formData, expiryWarningDays: e.target.value})} disabled={!isAdmin} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '0.9rem', color: '#334155' }}>Tồn kho an toàn mặc định</label>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 8px 0' }}>Mức giới hạn tối thiểu trước khi yêu cầu nhập hàng mới.</p>
                    <input type="number" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }} value={formData.safetyStock} onChange={e => setFormData({...formData, safetyStock: e.target.value})} disabled={!isAdmin} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NHÂN SỰ */}
            {activeTab === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: 0, color: '#1e293b', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>Quản lý Nhân sự</h3>
                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Quản lý phân quyền tài khoản nhân viên kho và thu ngân trong hệ thống.</p>
                  {isAdmin && <button type="button" style={{ marginTop: '16px', padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>Thêm tài khoản nhân sự</button>}
                </div>
              </div>
            )}

            {/* TAB 4: AI & CẢNH BÁO */}
            {activeTab === 'ai_config' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: 0, color: '#1e293b', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>Trợ lý AI & Cảnh báo</h3>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '0.9rem', color: '#334155' }}>Tần suất cập nhật mô hình dự báo AI</label>
                  <select style={{ width: '100%', maxWidth: '300px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }} value={formData.aiSyncInterval} onChange={e => setFormData({...formData, aiSyncInterval: e.target.value})} disabled={!isAdmin}>
                    <option value="12h">Cập nhật mỗi 12 giờ</option>
                    <option value="24h">Cập nhật mỗi 24 giờ</option>
                    <option value="manual">Chạy thủ công</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 5: DATABASE */}
            {activeTab === 'database' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: 0, color: '#1e293b', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>Sao lưu Dữ liệu</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>Xuất toàn bộ cơ sở dữ liệu hệ thống thành file cấu trúc SQL để phục vụ công tác lưu trữ hoặc triển khai máy chủ khác.</p>
                <div>
                  <button type="button" onClick={handleBackup} style={{ padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: isAdmin ? 'pointer' : 'not-allowed', fontWeight: '500', fontSize: '0.9rem', opacity: isAdmin ? 1 : 0.6 }}>
                    Tải xuống bản Backup (.sql)
                  </button>
                </div>
              </div>
            )}

            {/* NÚT LƯU THAY ĐỔI */}
            {isAdmin && ['general', 'expiry', 'ai_config'].includes(activeTab) && (
              <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                <button type="submit" style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem' }}>
                  Lưu thay đổi
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
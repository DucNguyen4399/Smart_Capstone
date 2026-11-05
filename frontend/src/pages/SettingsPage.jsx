import React, { useState, useEffect } from 'react';
import emailjs from 'emailjs-com'; // 1. Import thư viện EmailJS

export default function SettingsPage() {
  const currentRole = localStorage.getItem('role') || 'Store Staff';
  const isAdmin = currentRole === 'Admin'; 

  const [activeTab, setActiveTab] = useState(isAdmin ? 'company' : 'profile'); 

  const [systemConfig, setSystemConfig] = useState(() => {
    const saved = localStorage.getItem('erp_system_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      companyName: 'RetailSmart ERP',
      address: '123 Nguyễn Văn Linh, Đà Nẵng',
      taxCode: '0123456789',
      allowNegativeStock: false,
      lowStockWarning: 20,
      invoiceFooter: 'Cảm ơn quý khách và hẹn gặp lại!',
      printerType: 'k80',
      zaloZnsToken: ''
    };
  });

  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem('erp_system_config', JSON.stringify(systemConfig));
    }
  }, [systemConfig, isAdmin]);

  const username = localStorage.getItem('username') || currentRole;
  const profileStorageKey = `erp_profile_${username}`;

  const [personalConfig, setPersonalConfig] = useState(() => {
    const saved = localStorage.getItem(profileStorageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      fullName: username,
      email: `${username}@retailsmart.vn`,
      phone: '0919198131',
      notifications: true,
      theme: 'light'
    };
  });

  useEffect(() => {
    localStorage.setItem(profileStorageKey, JSON.stringify(personalConfig));
  }, [personalConfig, profileStorageKey]);

  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });

  const handleSaveSystem = (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Bạn không có quyền thay đổi thiết lập hệ thống!");
    localStorage.setItem('erp_system_config', JSON.stringify(systemConfig));
    alert("Đã lưu và cập nhật cấu hình hệ thống thành công! Dữ liệu đã được ghi nhớ vĩnh viễn.");
  };

  const handleSavePersonal = (e) => {
    e.preventDefault();
    localStorage.setItem(profileStorageKey, JSON.stringify(personalConfig));
    alert("Đã cập nhật hồ sơ cá nhân thành công!");
  };

  // 2. Xử lý đổi mật khẩu tích hợp EmailJS gửi mail thực tế thời gian thực
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert("Mật khẩu xác nhận mới không khớp!");
      return;
    }
    if (!passwordForm.old) {
      alert("Vui lòng nhập mật khẩu hiện tại!");
      return;
    }

    const userEmail = personalConfig.email;
    const userName = personalConfig.fullName;

    const templateParams = {
      to_name: userName,
      email: userEmail, // Khớp với {{email}} trong template
      passcode: 'Mật khẩu tài khoản của bạn vừa được thay đổi thành công vào lúc ' + new Date().toLocaleString() // Khớp với biến hiển thị trong template OTP
    };

    // Thay 'service_1dfmokn', 'TEMPLATE_ID_OTP', 'YOUR_PUBLIC_KEY' bằng mã thực tế từ EmailJS của bạn
    emailjs.send('service_1dfmokn', 'TEMPLATE_ID_OTP', templateParams, 'YOUR_PUBLIC_KEY')
      .then((response) => {
         alert(`Đổi mật khẩu thành công! Email thông báo thời gian thực đã được gửi đến: ${userEmail}`);
      }, (err) => {
         console.error('Lỗi gửi mail thực tế:', err);
         alert("Đổi mật khẩu thành công nhưng gửi email thông báo thất bại.");
      });

    setPasswordForm({ old: '', new: '', confirm: '' });
  };

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', boxSizing: 'border-box' }}>
      
      <div style={{ width: '260px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', flexShrink: 0 }}>
        
        <div style={{ padding: '10px 15px', fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Cài đặt cá nhân ({currentRole})</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'profile', label: 'Hồ sơ cá nhân' },
            { id: 'preferences', label: 'Giao diện & Cảnh báo' },
            { id: 'security', label: 'Đổi mật khẩu' },
          ].map(tab => (
            <li key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ 
                padding: '10px 14px', cursor: 'pointer', borderRadius: '6px', fontSize: '0.95rem', fontWeight: '500',
                background: activeTab === tab.id ? '#f1f5f9' : 'transparent', color: activeTab === tab.id ? '#2563eb' : '#475569',
              }}
            >
              {tab.label}
            </li>
          ))}
        </ul>

        {isAdmin ? (
          <>
            <div style={{ padding: '10px 15px', fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>Thiết lập cửa hàng (Admin)</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { id: 'company', label: 'Thông tin Doanh nghiệp' },
                { id: 'operations', label: 'Quy tắc Kho & Tồn' },
                { id: 'invoice', label: 'Mẫu in Hóa đơn' },
                { id: 'integrations', label: 'Tích hợp Zalo ZNS / API' },
              ].map(tab => (
                <li key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ 
                    padding: '10px 14px', cursor: 'pointer', borderRadius: '6px', fontSize: '0.95rem', fontWeight: '500',
                    background: activeTab === tab.id ? '#f1f5f9' : 'transparent', color: activeTab === tab.id ? '#0f172a' : '#475569',
                  }}
                >
                  {tab.label}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '12px' }}>
            <div style={{ background: '#fef3c7', color: '#92400e', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', lineHeight: '1.4' }}>
              💡 <b>Lưu ý:</b> Tài khoản Nhân viên kho chỉ có quyền chỉnh sửa thông tin cá nhân. Các thiết lập hệ thống được quản lý bởi Quản trị viên (Admin).
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, background: 'white', padding: '28px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '500px' }}>
        
        {activeTab === 'profile' && (
          <form onSubmit={handleSavePersonal} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Hồ sơ cá nhân</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Thông tin định danh của tài khoản đang đăng nhập ({username}). Dữ liệu tự động lưu vào trình duyệt.</p>
            
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Họ và tên hiển thị</label>
              <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={personalConfig.fullName} onChange={e => setPersonalConfig({...personalConfig, fullName: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Email cá nhân</label>
              <input type="email" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={personalConfig.email} onChange={e => setPersonalConfig({...personalConfig, email: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Số điện thoại</label>
              <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={personalConfig.phone} onChange={e => setPersonalConfig({...personalConfig, phone: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Vai trò hệ thống (Role)</label>
              <input type="text" disabled style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#64748b' }} value={currentRole} />
            </div>
            <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', width: 'fit-content' }}>Lưu Thay Đổi Hồ Sơ</button>
          </form>
        )}

        {activeTab === 'preferences' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Tùy chọn Giao diện & Thông báo</h3>
            <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>Nhận thông báo Pop-up hàng tồn</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Hiển thị cảnh báo trực tiếp trên màn hình khi sản phẩm đạt ngưỡng tối thiểu.</div>
                </div>
                <input type="checkbox" checked={personalConfig.notifications} onChange={e => setPersonalConfig({...personalConfig, notifications: e.target.checked})} style={{ width: '18px', height: '18px' }}/>
              </label>
            </div>
            <button type="button" onClick={handleSavePersonal} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', width: 'fit-content' }}>Lưu Tùy Chọn</button>
          </div>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Đổi mật khẩu tài khoản</h3>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '0.9rem' }}>Mật khẩu hiện tại</label>
              <input type="password" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={passwordForm.old} onChange={e => setPasswordForm({...passwordForm, old: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '0.9rem' }}>Mật khẩu mới</label>
              <input type="password" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '0.9rem' }}>Xác nhận mật khẩu mới</label>
              <input type="password" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} />
            </div>
            <button type="submit" style={{ padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', width: 'fit-content' }}>Cập nhật Mật khẩu</button>
          </form>
        )}

        {isAdmin && (
          <form onSubmit={handleSaveSystem}>
            {activeTab === 'company' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Thông tin Doanh nghiệp (Lưu trữ hệ thống)</h3>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Tên Cửa hàng / Công ty</label>
                    <input type="text" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={systemConfig.companyName} onChange={e => setSystemConfig({...systemConfig, companyName: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Mã số Thuế</label>
                    <input type="text" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={systemConfig.taxCode} onChange={e => setSystemConfig({...systemConfig, taxCode: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Địa chỉ kho trung tâm</label>
                  <input type="text" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', maxWidth: '600px' }} value={systemConfig.address} onChange={e => setSystemConfig({...systemConfig, address: e.target.value})} />
                </div>
              </div>
            )}

            {activeTab === 'operations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Quy tắc Kho & Vận hành</h3>
                <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', maxWidth: '600px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>Cho phép bán âm kho</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Cho phép tạo phiếu xuất kho khi tồn kho thực tế bằng 0.</div>
                    </div>
                    <input type="checkbox" checked={systemConfig.allowNegativeStock} onChange={e => setSystemConfig({...systemConfig, allowNegativeStock: e.target.checked})} style={{ width: '20px', height: '20px' }}/>
                  </label>
                </div>
                <div style={{ maxWidth: '300px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Ngưỡng cảnh báo tồn tối thiểu</label>
                  <input type="number" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={systemConfig.lowStockWarning} onChange={e => setSystemConfig({...systemConfig, lowStockWarning: e.target.value})} />
                </div>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Mẫu in Phiếu xuất kho</h3>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Khổ giấy in mặc định</label>
                  <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={systemConfig.printerType} onChange={e => setSystemConfig({...systemConfig, printerType: e.target.value})}>
                    <option value="k80">Máy in bill nhiệt (K80 - 80mm)</option>
                    <option value="a4">Máy in văn phòng (Khổ A4/A5)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Lời cảm ơn chân trang (Footer)</label>
                  <textarea rows="3" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={systemConfig.invoiceFooter} onChange={e => setSystemConfig({...systemConfig, invoiceFooter: e.target.value})} />
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Tích hợp Zalo ZNS / API</h3>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px' }}>Mã Token Kết nối Zalo OA</label>
                  <input type="password" placeholder="Nhập API Token..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={systemConfig.zaloZnsToken} onChange={e => setSystemConfig({...systemConfig, zaloZnsToken: e.target.value})} />
                </div>
              </div>
            )}

            {['company', 'operations', 'invoice', 'integrations'].includes(activeTab) && (
              <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                <button type="submit" style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                  Lưu cấu hình hệ thống
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
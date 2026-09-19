import React, { useState } from 'react';

export default function RegisterPage({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role_id: '3' // Mặc định là Store Staff hoặc nhân viên kho
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      // Giả lập gọi API đăng ký (Bạn có thể trỏ tới API tương ứng ở Backend nếu đã viết)
      // Tạm thời hiển thị thông báo thành công chuyên nghiệp
      setTimeout(() => {
        setSuccessMsg("Đăng ký tài khoản thành công! Đang chuyển hướng về trang đăng nhập...");
        setTimeout(() => {
          onSwitchToLogin();
        }, 1500);
      }, 800);
    } catch (err) {
      setErrorMsg("Lỗi kết nối máy chủ đăng ký.");
    }
  };

  return (
    <div className="auth-wrapper">
      {/* CỘT TRÁI: BANNER THƯƠNG HIỆU */}
      <div className="auth-left-banner">
        <div>
          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            HỆ THỐNG MỞ
          </span>
          <h1 style={{ marginTop: '20px' }}>Tham gia RetailSmart</h1>
          <p style={{ marginTop: '15px' }}>
            Tạo tài khoản quản lý cửa hàng ngay hôm nay để trải nghiệm toàn bộ các tính năng phân tích tồn kho tự động hóa cao cấp.
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          © 2026 RetailSmart Capstone Project - C1SE.17.
        </div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG KÝ */}
      <div className="auth-right-container">
        <div className="auth-card">
          <div className="auth-title">Đăng ký tài khoản mới</div>
          <div className="auth-subtitle">Điền thông tin chi tiết để thiết lập hệ thống cửa hàng</div>

          {errorMsg && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', fontWeight: '600' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="auth-form-group">
              <label>Tên tài khoản (Username)</label>
              <input 
                type="text" 
                className="auth-input" 
                placeholder="VD: manager_store01" 
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            <div className="auth-form-group">
              <label>Thư điện tử (Email)</label>
              <input 
                type="email" 
                className="auth-input" 
                placeholder="store@retailsmart.vn" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="auth-form-group">
              <label>Mật khẩu</label>
              <input 
                type="password" 
                className="auth-input" 
                placeholder="••••••••" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div className="auth-form-group">
              <label>Xác nhận mật khẩu</label>
              <input 
                type="password" 
                className="auth-input" 
                placeholder="••••••••" 
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>

            <button type="submit" className="auth-btn" style={{ background: '#059669', marginTop: '10px' }}>
              Hoàn tất Đăng ký
            </button>
          </form>

          <div className="auth-switch-text">
            Đã có tài khoản hệ thống? <a onClick={onSwitchToLogin}>Đăng nhập ngay</a>
          </div>
        </div>
      </div>
    </div>
  );
}
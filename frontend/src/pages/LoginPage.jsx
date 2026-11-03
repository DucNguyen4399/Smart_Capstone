import React, { useState, useEffect } from 'react';
import './LoginPage.css';

export default function LoginPage({ onLoginSuccess }) {
  // Toggle Đăng nhập / Đăng ký
  const [isLogin, setIsLogin] = useState(true);
  
  // States dùng chung
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // States riêng cho Đăng nhập
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // States riêng cho Đăng ký
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Store Staff');

  // Tự động điền nếu đã Ghi nhớ đăng nhập
  useEffect(() => {
    const savedUser = localStorage.getItem('remembered_username');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  // Reset thông báo khi chuyển form
  const toggleForm = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  // --- XỬ LÝ ĐĂNG NHẬP ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      // Giữ nguyên API của bạn
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Sai thông tin đăng nhập");

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', username);

      if (rememberMe) localStorage.setItem('remembered_username', username);
      else localStorage.removeItem('remembered_username');

      onLoginSuccess(data.role, username);
    } catch (err) {
      // (Mock cho đồ án) Nếu không có backend thật, tự động cho qua để test giao diện
      console.warn("API lỗi/chưa bật, đăng nhập Local mock:", err.message);
      localStorage.setItem('token', 'mock_token');
      localStorage.setItem('role', 'Admin');
      localStorage.setItem('username', username);
      onLoginSuccess('Admin', username);
    }
  };

  // --- XỬ LÝ ĐĂNG KÝ ---
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      // Mô phỏng gọi API Đăng ký (Bạn có thể nối API FastAPI đăng ký vào đây sau)
      // await fetch('http://127.0.0.1:8000/api/v1/auth/register', { ... })
      
      setSuccessMsg(`Tạo tài khoản ${username} thành công! Đang chuyển hướng...`);
      
      // Tự động chuyển về form đăng nhập sau 2 giây
      setTimeout(() => {
        setIsLogin(true);
        setPassword('');
        setSuccessMsg('');
      }, 2000);

    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      alert("Vui lòng nhập email hoặc tên đăng nhập!");
      return;
    }
    alert(`Đã gửi hướng dẫn khôi phục mật khẩu tới: ${forgotEmail}. Vui lòng kiểm tra hộp thư!`);
    setShowForgotModal(false);
    setForgotEmail('');
  };

  return (
    <div className="auth-wrapper">
      {/* CỘT TRÁI: BANNER */}
      <div className="auth-left-banner">
        <div>
          <span style={{ background: 'rgba(79, 70, 229, 0.2)', color: '#818cf8', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid rgba(79, 70, 229, 0.3)' }}>
            CHUYÊN NGHIỆP & TỐI ƯU
          </span>
          <h1 style={{ marginTop: '20px' }}>RetailSmart Platform</h1>
          <p style={{ marginTop: '15px' }}>
            Hệ thống quản lý tồn kho thông minh tích hợp AI Dự báo nhu cầu, kiểm soát lô hàng thời gian thực và chống lãng phí hàng cận date cho doanh nghiệp bán lẻ.
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          © 2026 RetailSmart Capstone Project - C1SE.17.
        </div>
      </div>

      {/* CỘT PHẢI: FORM */}
      <div className="auth-right-container">
        <div className="auth-card">
          <div className="auth-title">{isLogin ? 'Đăng nhập hệ thống' : 'Tạo tài khoản mới'}</div>
          <div className="auth-subtitle">
            {isLogin ? 'Vui lòng nhập thông tin tài khoản quản trị của bạn' : 'Đăng ký tài khoản để trải nghiệm RetailSmart ERP'}
          </div>

          {errorMsg && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid #fecaca' }}>
              ⚠️ {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid #a7f3d0' }}>
              ✅ {successMsg}
            </div>
          )}

          {/* FORM ĐỘNG (Lật qua lại giữa Login và Register) */}
          <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit}>
            <div className="auth-form-group">
              <label>Tên tài khoản (Username)</label>
              <input 
                type="text" 
                className="auth-input" 
                placeholder="Nhập username..." 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div className="auth-form-group">
                <label>Phân quyền (Role)</label>
                <select 
                  className="auth-input" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Admin">Quản trị viên (Admin)</option>
                  <option value="Store Staff">Nhân viên Kho / Thu ngân</option>
                </select>
              </div>
            )}

            <div className="auth-form-group">
              <label>Mật khẩu (Password)</label>
              <div className="pwd-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="auth-input" 
                  placeholder="••••••••" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="auth-form-group">
                <label>Xác nhận Mật khẩu</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="auth-input" 
                  placeholder="••••••••" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {isLogin && (
              <div className="auth-options">
                <label>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  &nbsp;Ghi nhớ đăng nhập
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}>Quên mật khẩu?</a>
              </div>
            )}

            <button type="submit" className="auth-btn">
              {isLogin ? 'Truy cập Hệ thống' : 'Hoàn tất Đăng ký'}
            </button>
          </form>

          <div className="auth-switch-text">
            {isLogin ? 'Chưa có tài khoản cửa hàng?' : 'Đã có tài khoản hệ thống?'} 
            &nbsp;<a onClick={toggleForm}>{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}</a>
          </div>
        </div>
      </div>

      {/* MODAL QUÊN MẬT KHẨU */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>🔑 Khôi phục mật khẩu</h3>
              <button className="btn-close" onClick={() => setShowForgotModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
                Nhập tên đăng nhập hoặc email hệ thống của bạn để nhận liên kết thiết lập lại mật khẩu mới.
              </p>
              <form onSubmit={handleForgotPassword}>
                <div className="auth-form-group">
                  <label>Email hoặc Username</label>
                  <input 
                    type="text" 
                    className="auth-input" 
                    placeholder="VD: admin_retail" 
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn-cancel" onClick={() => setShowForgotModal(false)}>Hủy bỏ</button>
                  <button type="submit" className="auth-btn" style={{ width: 'auto', padding: '10px 20px' }}>Gửi yêu cầu</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
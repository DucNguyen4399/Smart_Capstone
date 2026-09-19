import React, { useState, useEffect } from 'react';
import './LoginPage.css';

export default function LoginPage({ onLoginSuccess, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Tự động điền tài khoản nếu trước đó đã bật "Ghi nhớ đăng nhập"
  useEffect(() => {
    const savedUser = localStorage.getItem('remembered_username');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Sai thông tin đăng nhập");

      // Lưu trữ Token và Phân quyền
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', username);

      // Xử lý tính năng Ghi nhớ đăng nhập
      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      onLoginSuccess(data.role);
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
      {/* CỘT TRÁI: BANNER GIỚI THIỆU DOANH NGHIỆP */}
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
          © 2026 RetailSmart Capstone Project - C1SE.17. All rights reserved.
        </div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG NHẬP */}
      <div className="auth-right-container">
        <div className="auth-card">
          <div className="auth-title">Đăng nhập hệ thống</div>
          <div className="auth-subtitle">Vui lòng nhập thông tin tài khoản quản trị của bạn</div>

          {errorMsg && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid #fecaca' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="auth-form-group">
              <label>Tên tài khoản (Username)</label>
              <input 
                type="text" 
                className="auth-input" 
                placeholder="Nhập username của bạn..." 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="auth-form-group">
              <label>Mật khẩu (Password)</label>
              <input 
                type="password" 
                className="auth-input" 
                placeholder="••••••••" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="auth-options">
              <label>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                Ghi nhớ đăng nhập
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}>Quên mật khẩu?</a>
            </div>

            <button type="submit" className="auth-btn">Truy cập Hệ thống</button>
          </form>

          <div className="auth-switch-text">
            Chưa có tài khoản cửa hàng? <a onClick={onSwitchToRegister}>Đăng ký ngay</a>
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
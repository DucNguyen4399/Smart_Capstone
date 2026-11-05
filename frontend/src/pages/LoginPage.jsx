import React, { useState, useEffect } from 'react';
import emailjs from 'emailjs-com'; // 1. Import thư viện EmailJS
import './LoginPage.css';

export default function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Store Staff');

  useEffect(() => {
    const savedUser = localStorage.getItem('remembered_username');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLoginSubmit = async (e) => {
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

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', username);

      if (rememberMe) localStorage.setItem('remembered_username', username);
      else localStorage.removeItem('remembered_username');

      onLoginSuccess(data.role, username);
    } catch (err) {
      console.warn("API lỗi/chưa bật, chạy chế độ Local mock:", err.message);
      
      let savedUsers = JSON.parse(localStorage.getItem('erp_users'));
      if (!savedUsers) {
        savedUsers = [
          { username: 'admin', password: '123456', role: 'Admin' },
          { username: 'staff', password: '123456', role: 'Store Staff' }
        ];
        localStorage.setItem('erp_users', JSON.stringify(savedUsers));
      }

      const foundUser = savedUsers.find(u => u.username === username && u.password === password);

      if (foundUser) {
        localStorage.setItem('token', 'mock_token');
        localStorage.setItem('role', foundUser.role);
        localStorage.setItem('username', username);
        onLoginSuccess(foundUser.role, username);
      } else {
        setErrorMsg("Tên đăng nhập hoặc mật khẩu không chính xác!");
      }
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      const savedUsers = JSON.parse(localStorage.getItem('erp_users')) || [];
      const duplicate = savedUsers.find(u => u.username === username);
      if (duplicate) {
        setErrorMsg("Tên đăng nhập này đã tồn tại!");
        return;
      }

      const newUser = {
        id: Date.now(),
        maNV: `NV-00${savedUsers.length + 1}`,
        username: username,
        password: password,
        role: 'Store Staff', 
        status: 'Hoạt động'
      };

      savedUsers.push(newUser);
      localStorage.setItem('erp_users', JSON.stringify(savedUsers));

      setSuccessMsg(`Tạo tài khoản ${username} thành công với quyền Nhân viên kho! Đang chuyển hướng...`);
      
      setTimeout(() => {
        setIsLogin(true);
        setPassword('');
        setSuccessMsg('');
      }, 2000);

    } catch (err) {
      setErrorMsg("Lỗi hệ thống khi đăng ký.");
    }
  };

  // 2. Xử lý Quên mật khẩu tích hợp EmailJS thực tế
  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      alert("Vui lòng nhập email hoặc tên đăng nhập!");
      return;
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000);

    const templateParams = {
      to_name: forgotEmail,
      email: forgotEmail, // Khớp với {{email}} trong template Password Reset
      link: `Mã xác thực khôi phục mật khẩu của bạn là: ${resetCode}` // Khớp với {{link}} trong template Password Reset
    };

    // Thay 'service_1dfmokn', 'TEMPLATE_ID_PASSWORD_RESET', 'YOUR_PUBLIC_KEY' bằng mã thực tế từ EmailJS của bạn
    emailjs.send('service_1dfmokn', 'TEMPLATE_ID_PASSWORD_RESET', templateParams, 'YOUR_PUBLIC_KEY')
      .then((response) => {
         alert(`Đã gửi mã khôi phục mật khẩu thực tế tới email: ${forgotEmail}. Vui lòng kiểm tra hộp thư!`);
         setShowForgotModal(false);
         setForgotEmail('');
      }, (err) => {
         console.error('Lỗi gửi mail thực tế:', err);
         alert("Không thể gửi email lúc này. Vui lòng kiểm tra lại cấu hình EmailJS.");
      });
  };

  return (
    <div className="auth-wrapper">
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

      <div className="auth-right-container">
        <div className="auth-card">
          <div className="auth-title">{isLogin ? 'Đăng nhập hệ thống' : 'Tạo tài khoản mới'}</div>
          <div className="auth-subtitle">
            {isLogin ? 'Vui lòng nhập thông tin tài khoản của bạn' : 'Đăng ký tài khoản nhân viên kho mới'}
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
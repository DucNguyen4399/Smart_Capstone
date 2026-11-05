import React, { useState, useEffect } from 'react';

export default function EmployeeManagementPage() {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('erp_users');
    return saved ? JSON.parse(saved) : [
      { id: 1, maNV: 'NV-001', username: 'admin', fullname: 'Quản trị viên', role: 'Admin', email: 'admin@system.com', phone: '0901234567', status: 'Hoạt động' },
      { id: 2, maNV: 'NV-002', username: 'staff_vy', fullname: 'Khánh Vy', role: 'Store Staff', email: 'vy@system.com', phone: '0919998888', status: 'Hoạt động' }
    ];
  });

  const [filters, setFilters] = useState({ maNV: '', tenNV: '', chucVu: '', email: '' });
  
  // State quản lý Modal Thêm/Sửa nhân viên
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    maNV: '',
    fullname: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'Store Staff'
  });

  useEffect(() => {
    localStorage.setItem('erp_users', JSON.stringify(users));
  }, [users]);

  // Xử lý Thêm / Sửa nhân viên tương tác thật
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      maNV: `NV-00${users.length + 1}`,
      fullname: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      role: 'Store Staff'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingUser(emp);
    setFormData({
      maNV: emp.maNV,
      fullname: emp.fullname,
      username: emp.username,
      password: '',
      email: emp.email,
      phone: emp.phone,
      role: emp.role
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingUser) {
      // Cập nhật
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
      alert("Cập nhật thông tin nhân viên thành công!");
    } else {
      // Thêm mới
      const newUser = { id: Date.now(), ...formData };
      setUsers([newUser, ...users]);
      alert("Thêm nhân viên mới thành công!");
    }
    setShowModal(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên ${name}?`)) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const filteredUsers = users.filter(u => {
    return (
      (u.maNV || '').toLowerCase().includes(filters.maNV.toLowerCase()) &&
      (u.fullname || u.username).toLowerCase().includes(filters.tenNV.toLowerCase()) &&
      (filters.chucVu === '' || u.role === filters.chucVu) &&
      (u.email || '').toLowerCase().includes(filters.email.toLowerCase())
    );
  });

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Quản lý nhân viên</h2>
        <button onClick={handleOpenAdd} style={{ background: '#7f1d1d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '24px', fontWeight: '600', cursor: 'pointer' }}>
          + Thêm nhân sự mới
        </button>
      </div>

      {/* BỘ LỌC TƯƠNG TÁC */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Mã NV</label>
          <input type="text" placeholder="VD: NV-001" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={filters.maNV} onChange={(e) => setFilters({...filters, maNV: e.target.value})} />
        </div>
        <div style={{ flex: 2, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Tên NV</label>
          <input type="text" placeholder="Tìm theo tên" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={filters.tenNV} onChange={(e) => setFilters({...filters, tenNV: e.target.value})} />
        </div>
        <div style={{ flex: 1.5, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Chức vụ</label>
          <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={filters.chucVu} onChange={(e) => setFilters({...filters, chucVu: e.target.value})}>
            <option value="">Tất cả</option>
            <option value="Admin">Admin</option>
            <option value="Store Manager">Quản lý</option>
            <option value="Store Staff">Nhân viên kho</option>
          </select>
        </div>
        <div style={{ flex: 2, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Email</label>
          <input type="text" placeholder="Tìm theo email" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={filters.email} onChange={(e) => setFilters({...filters, email: e.target.value})} />
        </div>
      </div>

      {/* BẢNG DỮ LIỆU THẬT */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#1e293b' }}>Danh sách nhân viên ({filteredUsers.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>Mã NV</th>
                <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>Họ tên</th>
                <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>Username</th>
                <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>SĐT</th>
                <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>Email</th>
                <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>Chức vụ</th>
                <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 8px', fontWeight: '600', color: '#991b1b' }}>{emp.maNV}</td>
                  <td style={{ padding: '16px 8px', fontWeight: '600', color: '#0f172a' }}>{emp.fullname}</td>
                  <td style={{ padding: '16px 8px', color: '#475569', fontSize: '0.9rem' }}>{emp.username}</td>
                  <td style={{ padding: '16px 8px', color: '#475569', fontSize: '0.9rem' }}>{emp.phone}</td>
                  <td style={{ padding: '16px 8px', color: '#475569', fontSize: '0.9rem' }}>{emp.email}</td>
                  <td style={{ padding: '16px 8px' }}><span style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8rem', color: '#475569' }}>{emp.role}</span></td>
                  <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenEdit(emp)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>✏️ Sửa</button>
                      <button onClick={() => handleDelete(emp.id, emp.fullname)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>🗑 Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM / SỬA NHÂN VIÊN */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '450px', maxWidth: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>{editingUser ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Họ và tên</label>
                <input required type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Tên đăng nhập (Username)</label>
                <input required type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Mật khẩu</label>
                <input required={!editingUser} type="password" placeholder={editingUser ? "Để trống nếu không đổi" : "••••••••"} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Email</label>
                <input required type="email" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Số điện thoại</label>
                <input required type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Chức vụ</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="Admin">Admin</option>
                  <option value="Store Manager">Quản lý cửa hàng</option>
                  <option value="Store Staff">Nhân viên kho</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
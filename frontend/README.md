# RetailSmart ERP - Hệ thống Tối ưu Tồn kho & Giảm lãng phí thực phẩm

Dự án Capstone thuộc chuyên ngành Kỹ thuật Phần mềm, tập trung giải quyết bài toán quản lý chuỗi cung ứng bán lẻ, tối ưu hóa hạn sử dụng theo chuẩn **FEFO (First Expired, First Out)** và ứng dụng mô hình dự báo AI.

---

## 🚀 Các Tính năng Đã Cập Nhật (Đợt này)
* **Real-time Synchronization (Đồng bộ thời gian thực)**: Tự động đồng bộ dữ liệu xuyên suốt giữa các phân hệ (Dashboard, Quản lý sản phẩm, Kiểm soát lô hàng) thông qua bộ nhớ cục bộ `localStorage` và cơ chế live stream ngầm.
* **Quản lý Danh mục Sản phẩm (`ProductListPage`)**: 
  * Thêm mới, chỉnh sửa thông tin sản phẩm và tự động tính toán giá trị tồn kho.
  * Bộ lọc tìm kiếm thông minh theo tên/SKU và trạng thái kinh doanh[cite: 6].
* **Kiểm soát Lô hàng & Hạn sử dụng - FEFO (`BatchManagementPage`)**: 
  * Tự động đánh giá trạng thái Date (An toàn, Cận Date $\le$ 7 ngày, Hết hạn)[cite: 10].
  * Lưu trữ bền vững dữ liệu sau khi thêm, sửa, xóa (Dữ liệu không bị mất khi F5 hoặc tắt trình duyệt).
* **Nhập kho & Import dữ liệu (`StockImportPage`)**: Hỗ trợ tải lên file giao dịch chuẩn hóa lịch sử bán hàng phục vụ mô hình dự báo[cite: 7].
* **Cài đặt Hệ thống & Phân quyền (`SettingsPage`)**: Phân quyền rõ ràng giữa Quản trị viên (`Admin`) và Nhân viên kho (`Store Staff`)[cite: 11].

---

## 📦 Các Thư viện Cần Tải (Dependencies)

Dự án sử dụng React (Vite) ở phía Frontend và Python FastAPI ở phía Backend. Các thư viện chính gồm:

### 1. Frontend (React + Vite)
* `react` & `react-dom` (v18+)
* `recharts` (Thư viện vẽ biểu đồ thống kê trực quan)

### 2. Backend (FastAPI & Python)
* `fastapi`
* `uvicorn`
* `pytest` (Dành cho kiểm thử tự động)
* `pymysql` hoặc `mysql-connector-python` (Kết nối cơ sở dữ liệu MySQL)

---

## ⚙️ Hướng dẫn Cài đặt & Chạy Dự án

### 1. Cài đặt phía Frontend
```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các gói thư viện
npm install

# Khởi động môi trường chạy thử
npm run dev
2. Cài đặt phía Backend
Bash
# Di chuyển vào thư mục backend
cd backend

# Kích hoạt môi trường ảo (nếu có) và cài đặt dependencies
pip install -r requirements.txt

# Chạy máy chủ FastAPI
python -m uvicorn main:app --reload
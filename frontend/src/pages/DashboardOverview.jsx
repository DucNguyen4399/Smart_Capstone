import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- DỮ LIỆU GIẢ LẬP ĐỂ DEMO (Mock Data) ---
const forecastData = [
  { name: 'T2', thucTe: 120, aiDuBao: 130 },
  { name: 'T3', thucTe: 150, aiDuBao: 145 },
  { name: 'T4', thucTe: 180, aiDuBao: 170 },
  { name: 'T5', thucTe: 110, aiDuBao: 115 },
  { name: 'T6', thucTe: 210, aiDuBao: 220 },
  { name: 'T7', thucTe: 250, aiDuBao: 240 },
  { name: 'CN', thucTe: 300, aiDuBao: 290 },
];

const stockStatusData = [
  { name: 'An toàn', value: 65 },
  { name: 'Cận Date', value: 25 },
  { name: 'Hết hạn', value: 10 },
];
const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function DashboardOverview() {
  return (
    <div className="dashboard-overview">
      {/* 1. TẦNG KPI: CÁC CHỈ SỐ CỐT LÕI */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">📉 Tỷ lệ lãng phí</div>
          <div className="kpi-value" style={{ color: '#ef4444' }}>1.2%</div>
          <div className="kpi-subtext positive">↓ Giảm 0.5% so với tháng trước</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">⚠️ Tỷ lệ cháy hàng (Stockout)</div>
          <div className="kpi-value" style={{ color: '#f59e0b' }}>0.8%</div>
          <div className="kpi-subtext positive">✓ Nằm trong ngưỡng an toàn</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">💰 Tồn kho đọng vốn</div>
          <div className="kpi-value" style={{ color: '#4f46e5' }}>125 Tr</div>
          <div className="kpi-subtext">Phân bổ rủi ro ở 45 sản phẩm</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">📈 DT Phục hồi nhờ AI</div>
          <div className="kpi-value" style={{ color: '#10b981' }}>12.5 Tr</div>
          <div className="kpi-subtext positive">↑ Tăng nhờ chiến lược giảm giá</div>
        </div>
      </div>

      {/* 2. TẦNG BIỂU ĐỒ: PHÂN TÍCH CHUYÊN SÂU */}
      <div className="charts-grid">
        {/* Biểu đồ Line Chart */}
        <div className="chart-box">
          <div className="chart-header">🤖 Hiệu suất AI: Dự báo Nhu cầu vs Thực tế (7 ngày qua)</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={forecastData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" />
                <Line type="monotone" name="Bán Thực Tế" dataKey="thucTe" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" name="AI Dự Báo" dataKey="aiDuBao" stroke="#ec4899" strokeWidth={3} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ Donut Chart */}
        <div className="chart-box">
          <div className="chart-header">🍩 Cơ cấu Trạng thái Tồn kho</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stockStatusData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {stockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. TẦNG HÀNH ĐỘNG: CẢNH BÁO KHẨN CẤP */}
      <div className="alerts-grid">
        {/* Box Cần nhập gấp */}
        <div className="alert-box">
          <div className="alert-header danger">🛒 CẦN NHẬP GẤP (Rủi ro Cháy hàng)</div>
          <ul className="alert-list">
            <li className="alert-item">
              <div className="alert-name"><span>1. Sữa tươi Vinamilk 1L</span> <span style={{ color: '#ef4444' }}>Còn 12 hộp</span></div>
              <div className="alert-recommendation">✨ AI Đề xuất: Nhập thêm 150 hộp ngay hôm nay</div>
            </li>
            <li className="alert-item">
              <div className="alert-name"><span>2. Nước suối Aquafina lốc 6</span> <span style={{ color: '#ef4444' }}>Còn 5 lốc</span></div>
              <div className="alert-recommendation">✨ AI Đề xuất: Nhập thêm 50 lốc</div>
            </li>
          </ul>
        </div>

        {/* Box Cần đẩy Sales */}
        <div className="alert-box">
          <div className="alert-header warning">⏳ CẦN ĐẨY SALES (Cận Date)</div>
          <ul className="alert-list">
            <li className="alert-item">
              <div className="alert-name"><span>1. Bánh mì Sandwich Kinh Đô</span> <span style={{ color: '#f59e0b' }}>Còn 2 ngày</span></div>
              <div className="alert-recommendation">⚡ Gợi ý: Tạo khuyến mãi giảm giá 30%</div>
            </li>
            <li className="alert-item">
              <div className="alert-name"><span>2. Xúc xích tiệt trùng Vissan</span> <span style={{ color: '#f59e0b' }}>Còn 5 ngày</span></div>
              <div className="alert-recommendation">⚡ Gợi ý: Tạo combo Mua 2 tặng 1</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
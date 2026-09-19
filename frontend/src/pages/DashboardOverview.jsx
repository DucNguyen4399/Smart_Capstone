import React from 'react';
import { BarChart, Bar, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';

export default function DashboardOverview() {
  // Dữ liệu giả lập khớp ảnh thiết kế
  const nxtData = [{ name: '04', nhap: 0, xuat: 0, ton: 0 }, { name: '08', nhap: 10, xuat: 14, ton: 119 }, { name: '09', nhap: 0, xuat: 0, ton: 115 }];
  const comboData = [{ name: '07', col: 0, line: 0 }, { name: '08', col: 17, line: 23 }, { name: '09', col: 24, line: 23 }];
  const trendData = [{ name: '06', value: 0 }, { name: '07', value: 0 }, { name: '08', value: 450000 }, { name: '09', value: 430000 }];
  const pieData = [{ name: 'SP 6', value: 30 }, { name: 'SP 2', value: 20 }, { name: 'SP 7', value: 25 }, { name: 'SP 12', value: 25 }];
  const progressData = [{ name: 'Đầu kỳ', value: 3400000, fill: '#10b981' }, { name: 'Nhập', value: 400000, fill: '#10b981' }, { name: 'Xuất', value: 1200000, fill: '#ef4444' }, { name: 'Cuối kỳ', value: 2600000, fill: '#10b981' }];
  const compareData = [{ name: 'SP005', val: 30 }, { name: 'SP009', val: 22 }, { name: 'SP001', val: 10 }, { name: 'SP004', val: 8 }, { name: 'SP010', val: 5 }];
  
  const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

  return (
    <div>
      {/* KHỐI 1: KPI CARDS */}
      <div className="erp-kpi-row">
        <div className="erp-kpi-card active-card">
          <div className="erp-kpi-info">
            <h4 style={{ color: '#2563eb' }}>455.000</h4>
            <p>Doanh thu tháng này</p>
            <span className="badge-up">+0.0% so với tháng trước</span>
          </div>
          <div className="erp-kpi-icon primary">~</div>
        </div>
        
        <div className="erp-kpi-card">
          <div className="erp-kpi-info">
            <h4>185.000</h4>
            <p>Lợi nhuận tháng này</p>
            <span className="badge-down">-55.4% so với tháng trước</span>
          </div>
          <div className="erp-kpi-icon">$</div>
        </div>

        <div className="erp-kpi-card">
          <div className="erp-kpi-info">
            <h4>6</h4>
            <p>Đơn hàng hôm nay</p>
            <span className="badge-up">+500.0% so với hôm qua</span>
          </div>
          <div className="erp-kpi-icon">📋</div>
        </div>

        <div className="erp-kpi-card">
          <div className="erp-kpi-info">
            <h4>3.020.000</h4>
            <p>Giá trị tồn kho</p>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>13 sản phẩm</span>
          </div>
          <div className="erp-kpi-icon">📦</div>
        </div>
      </div>

      {/* KHỐI 2: CHIA CỘT TRÁI (BIỂU ĐỒ) VÀ PHẢI (DANH SÁCH) */}
      <div className="dashboard-layout">
        
        {/* === CỘT TRÁI (BIỂU ĐỒ) === */}
        <div className="dashboard-main">
          
          <div className="chart-row">
            {/* Nhập Xuất Tồn */}
            <div className="erp-panel">
              <div className="erp-panel-title"><span>|</span> Nhập - Xuất - Tồn</div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={nxtData} barGap={0}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}}/>
                    <Bar dataKey="nhap" name="Nhập" fill="#10b981" barSize={14} />
                    <Bar dataKey="xuat" name="Xuất" fill="#ef4444" barSize={14} />
                    <Bar dataKey="ton" name="Tồn" fill="#3b82f6" barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Số lượng & Doanh thu */}
            <div className="erp-panel">
              <div className="erp-panel-title"><span>|</span> Số lượng & Doanh thu</div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <ComposedChart data={comboData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="col" fill="#a855f7" barSize={30} />
                    <Line yAxisId="left" type="monotone" dataKey="line" stroke="#10b981" strokeWidth={2} dot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="chart-row">
            {/* Xu hướng doanh thu */}
            <div className="erp-panel">
              <div className="erp-panel-title"><span>|</span> Xu hướng doanh thu</div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#eff6ff" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tỷ trọng sản phẩm */}
            <div className="erp-panel">
              <div className="erp-panel-title"><span>|</span> Tỷ trọng sản phẩm</div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" stroke="none">
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="chart-row">
            {/* Diễn biến tồn kho */}
            <div className="erp-panel">
              <div className="erp-panel-title"><span>|</span> Diễn biến tồn kho</div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val/1000000 + 'M'}/>
                    <Tooltip />
                    <Bar dataKey="value" barSize={40}>
                      <Cell fill="#10b981" />
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#10b981" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* So sánh tồn kho */}
            <div className="erp-panel">
              <div className="erp-panel-title"><span>|</span> So sánh tồn kho</div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={compareData} layout="vertical" margin={{top: 0, right: 15, left: -15, bottom: 0}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
                    <XAxis type="number" fontSize={11} tickLine={false} axisLine={false}/>
                    <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false}/>
                    <Tooltip />
                    <Bar dataKey="val" barSize={16}>
                      <Cell fill="#10b981" />
                      <Cell fill="#10b981" />
                      <Cell fill="#fcd34d" />
                      <Cell fill="#fcd34d" />
                      <Cell fill="#fcd34d" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

        {/* === CỘT PHẢI (DANH SÁCH HOẠT ĐỘNG & CẢNH BÁO) === */}
        <div className="dashboard-side">
          <div className="erp-panel">
            <div className="erp-panel-title"><span>|</span> Hoạt động gần đây</div>
            <ul className="activity-list">
              <li className="activity-item">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ color: '#10b981', background: '#ecfdf5', padding: '6px', borderRadius: '6px', fontWeight: 'bold' }}>↓</span>
                  <div>
                    <div style={{ color: '#334155', fontWeight: '600' }}>Nhập 2 Sản phẩm</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>10/9/2025</div>
                  </div>
                </div>
                <div style={{ fontWeight: '700', color: '#0f172a' }}>60.000 ₫</div>
              </li>
              
              <li className="activity-item">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ color: '#10b981', background: '#ecfdf5', padding: '6px', borderRadius: '6px', fontWeight: 'bold' }}>↓</span>
                  <div>
                    <div style={{ color: '#334155', fontWeight: '600' }}>Nhập 3 Sản phẩm</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>10/9/2025</div>
                  </div>
                </div>
                <div style={{ fontWeight: '700', color: '#0f172a' }}>60.000 ₫</div>
              </li>
              
              <li className="activity-item">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ color: '#ef4444', background: '#fef2f2', padding: '6px', borderRadius: '6px', fontWeight: 'bold' }}>↑</span>
                  <div>
                    <div style={{ color: '#334155', fontWeight: '600' }}>Xuất 3 Sản phẩm</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>10/9/2025</div>
                  </div>
                </div>
                <div style={{ fontWeight: '700', color: '#0f172a' }}>117.000 ₫</div>
              </li>
            </ul>
          </div>

          <div className="erp-panel">
            <div className="erp-panel-title"><span>|</span> Cảnh báo sản phẩm</div>
            <ul className="activity-list">
              <li className="warning-item">
                <div>
                  <div style={{ color: '#334155', fontWeight: '600' }}>Sản phẩm 6</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>SP006</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#ef4444', fontWeight: '700' }}>0</div>
                  <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>hết hàng</div>
                </div>
              </li>
              
              <li className="warning-item">
                <div>
                  <div style={{ color: '#334155', fontWeight: '600' }}>Sản phẩm 2</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>SP002</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#f59e0b', fontWeight: '700' }}>1</div>
                  <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>sắp hết</div>
                </div>
              </li>
              
              <li className="warning-item">
                <div>
                  <div style={{ color: '#334155', fontWeight: '600' }}>Sản phẩm 12</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>SP012</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#f59e0b', fontWeight: '700' }}>1</div>
                  <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>sắp hết</div>
                </div>
              </li>
              
              <li className="warning-item">
                <div>
                  <div style={{ color: '#334155', fontWeight: '600' }}>Sản phẩm 7</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>SP007</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#f59e0b', fontWeight: '700' }}>2</div>
                  <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>sắp hết</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
      </div>
    </div>
  );
}
import React, { useState } from 'react';

export default function RecommendationPage() {
      const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  return (
    <div className="erp-panel">
      <div className="erp-panel-title">
        Đề xuất tồn kho
      </div>

      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Hệ thống đề xuất bổ sung hàng và giảm giá dựa trên dữ liệu tồn kho,
        nhu cầu dự báo và tình trạng hạn sử dụng.
      </p>

      {/* ĐỀ XUẤT NHẬP HÀNG */}
      <div className="erp-panel-title">
        Đề xuất bổ sung hàng
      </div>

      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Tồn kho</th>
              <th>Nhu cầu dự báo</th>
              <th>Số lượng đề xuất</th>
              <th>Ưu tiên</th>
              <th>Giải thích</th>
            </tr>
          </thead>

          <tbody>
            <tr>
                <td>SP001 - Sữa tươi</td>
                <td>20</td>
                <td>80</td>
                <td>60</td>
                <td style={{ color: '#dc2626', fontWeight: '600' }}>
                Cao
                </td>
                <td>
                <button
                    className="erp-btn-primary"
                    onClick={() =>
                        setSelectedRecommendation({
                        type: 'replenishment',
                        product: 'SP001 - Sữa tươi',
                        reason: 'Tồn kho hiện tại thấp hơn nhu cầu dự báo. Hệ thống đề xuất bổ sung để hạn chế nguy cơ thiếu hàng.'
                        })
                    }
                    >
                    Vì sao đề xuất?
                </button>
                </td>
            </tr>

            <tr>
                <td>SP002 - Nước ngọt</td>
                <td>45</td>
                <td>60</td>
                <td>15</td>
                <td style={{ color: '#d97706', fontWeight: '600' }}>
                Trung bình
                </td>
                <td>
                <button
                    className="erp-btn-primary"
                    onClick={() =>
                        setSelectedRecommendation({
                        type: 'replenishment',
                        product: 'SP002 - Nước ngọt',
                        reason: 'Tồn kho hiện tại thấp hơn nhu cầu dự báo. Hệ thống đề xuất bổ sung một lượng vừa phải để duy trì mức tồn kho phù hợp.'
                        })
                    }
                    >
                    Vì sao đề xuất?
                </button>
                </td>
            </tr>
            </tbody>
        </table>
      </div>

      {/* ĐỀ XUẤT GIẢM GIÁ */}
      <div
        className="erp-panel-title"
        style={{ marginTop: '40px' }}
      >
        Đề xuất giảm giá / Markdown
      </div>

      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Mã lô</th>
              <th>Tồn kho</th>
              <th>Còn hạn</th>
              <th>Giảm giá đề xuất</th>
              <th>Giải thích</th>
            </tr>
          </thead>

          <tbody>
            <tr>
                <td>SP003 - Sữa chua</td>
                <td>LOT20260901</td>
                <td>35</td>
                <td>3 ngày</td>
                <td style={{ color: '#dc2626', fontWeight: '600' }}>
                20%
                </td>
                <td>
                <button
                    className="erp-btn-primary"
                    onClick={() =>
                    setSelectedRecommendation({
                        type: 'markdown',
                        product: 'SP003 - Sữa chua',
                        reason: 'Lô hàng còn 3 ngày trước hạn sử dụng và lượng tồn kho còn cao. Hệ thống đề xuất giảm giá 20% để thúc đẩy bán hàng và hạn chế hàng hết hạn.'
                    })
                    }
                >
                    Vì sao đề xuất?
                </button>
                </td>
            </tr>
        </tbody>
        </table>
            </div>

            {selectedRecommendation && (
                <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}
                >
                <div
                    className="erp-panel"
                    style={{
                    width: '500px',
                    padding: '30px',
                    backgroundColor: '#ffffff',
                    }}
                >
                    <div className="erp-panel-title">
                    Vì sao hệ thống đề xuất?
                    </div>

                    <p style={{ marginBottom: '12px' }}>
                    <strong>Sản phẩm:</strong>{' '}
                    {selectedRecommendation.product}
                    </p>

                    <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                    {selectedRecommendation.reason}
                    </p>

                    <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: '24px',
                    }}
                    >
                    <button
                        className="erp-btn-primary"
                        onClick={() => setSelectedRecommendation(null)}
                    >
                        Đóng
                    </button>
                    </div>
                </div>
                </div>
            )}

            </div>
        );
        }
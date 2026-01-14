import { useState } from 'react';
import { Button, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import BigTileButton from '../components/BigTileButton.jsx';

const Home = () => {
  const navigate = useNavigate();
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const handleCloseReportModal = () => setReportModalOpen(false);
  const handleReportNavigate = (path) => {
    setReportModalOpen(false);
    navigate(path);
  };

  return (
    <div className="page-card">
      <div className="page-title">Màn hình chính</div>
      <div className="home-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <BigTileButton
            to="/system"
            label="HỆ THỐNG"
            tone="linear-gradient(135deg, #0f6f75, #0d8f8a)"
          />
          <BigTileButton
            to="/catalog"
            label="DANH MỤC"
            tone="linear-gradient(135deg, #118d6c, #0dbf6a)"
          />
          <BigTileButton
            to="/sales"
            label="BÁN HÀNG"
            tone="linear-gradient(135deg, #0f8f8a, #14b36a)"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <BigTileButton
            to="/purchases"
            label="NHẬP HÀNG"
            tone="linear-gradient(135deg, #12a36e, #0bc26b)"
          />
          <BigTileButton
            to="/cashbook"
            label="THU CHI"
            tone="linear-gradient(135deg, #0f7f86, #0ea06d)"
          />
          <BigTileButton
            label="BÁO CÁO"
            tone="linear-gradient(135deg, #0c7c78, #0f9e8b)"
            onClick={() => setReportModalOpen(true)}
          />
        </div>
      </div>

      <Modal
        title="Chọn báo cáo"
        open={reportModalOpen}
        onCancel={handleCloseReportModal}
        footer={null}
        width={420}
        centered
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button
            size="large"
            type="primary"
            className="btn-primary"
            block
            style={{ height: 56, fontSize: 18 }}
            onClick={() => handleReportNavigate('/reports')}
          >
            Bán hàng
          </Button>
          <Button
            size="large"
            type="primary"
            className="btn-primary"
            block
            style={{ height: 56, fontSize: 18 }}
            onClick={() => handleReportNavigate('/report-purchase')}
          >
            Nhập hàng
          </Button>
          <Button
            size="large"
            type="primary"
            className="btn-primary"
            block
            style={{ height: 56, fontSize: 18 }}
            onClick={() => handleReportNavigate('/report-stock')}
          >
            Kho
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Home;

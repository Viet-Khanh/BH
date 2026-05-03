import { useState } from 'react';
import { Button, Form, Input, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import BigTileButton from '../components/BigTileButton.jsx';
import TodayDashboard from '../features/dashboard/components/TodayDashboard.jsx';
import { useSettingsStore } from '../store/settingsStore.js';
import { grantSystemAccess } from './System/systemAccess.js';
import { getSystemPasswordFromSettings } from './System/systemPassword.js';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [systemModalOpen, setSystemModalOpen] = useState(false);
  const [systemUnlocking, setSystemUnlocking] = useState(false);
  const [systemError, setSystemError] = useState('');
  const [systemForm] = Form.useForm();
  const { load: loadSettings } = useSettingsStore();

  const handleCloseReportModal = () => setReportModalOpen(false);
  const handleReportNavigate = (path) => {
    setReportModalOpen(false);
    navigate(path);
  };
  const handleOpenSystemModal = () => {
    setSystemError('');
    systemForm.resetFields();
    setSystemModalOpen(true);
  };
  const handleCloseSystemModal = () => {
    setSystemModalOpen(false);
    setSystemError('');
  };
  const handleSystemUnlock = async () => {
    const values = await systemForm.validateFields();
    setSystemUnlocking(true);
    try {
      await loadSettings();
      const currentSettings = useSettingsStore.getState().settings;
      const password = getSystemPasswordFromSettings(currentSettings);
      if (values.password !== password) {
        setSystemError('Mật khẩu không đúng.');
        return;
      }
      grantSystemAccess();
      setSystemModalOpen(false);
      setSystemError('');
      navigate('/system');
    } catch (error) {
      setSystemError(error?.message || 'Không thể kiểm tra mật khẩu.');
    } finally {
      setSystemUnlocking(false);
    }
  };

  return (
    <div className="page-card home-page">
      {/* <div className="page-title">Màn hình chính</div> */}
      {/* <TodayDashboard showShortcuts={false} /> */}

      <section className="home-actions-section">
        {/* <div className="home-actions-title">Thao tác nhanh</div> */}
        <div className="home-grid home-grid-large">
          <div className="home-button-column">
            <BigTileButton
              label="HỆ THỐNG"
              tone="linear-gradient(135deg, #0f6f75, #0d8f8a)"
              onClick={handleOpenSystemModal}
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
          <div className="home-button-column">
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
      </section>

      <Modal
        title="Chọn báo cáo"
        open={reportModalOpen}
        onCancel={handleCloseReportModal}
        footer={null}
        width={420}
        centered
      >
        <div className="home-report-modal-actions">
          {/* <Button
            size="large"
            type="primary"
            className="btn-primary home-report-button"
            block
            onClick={() => handleReportNavigate('/dashboard')}
          >
            Dashboard hôm nay
          </Button> */}
          <Button
            size="large"
            type="primary"
            className="btn-primary home-report-button"
            block
            onClick={() => handleReportNavigate('/reports')}
          >
            Bán hàng
          </Button>
          <Button
            size="large"
            type="primary"
            className="btn-primary home-report-button"
            block
            onClick={() => handleReportNavigate('/report-purchase')}
          >
            Nhập hàng
          </Button>
          <Button
            size="large"
            type="primary"
            className="btn-primary home-report-button"
            block
            onClick={() => handleReportNavigate('/report-stock')}
          >
            Kho
          </Button>
        </div>
      </Modal>

      <Modal
        title="Nhập mật khẩu hệ thống"
        open={systemModalOpen}
        onCancel={handleCloseSystemModal}
        onOk={handleSystemUnlock}
        okText="Vào hệ thống"
        cancelText="Hủy"
        confirmLoading={systemUnlocking}
        maskClosable={false}
        centered
      >
        <Form form={systemForm} layout="vertical" onFinish={handleSystemUnlock}>
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
          >
            <Input.Password size="large" autoFocus />
          </Form.Item>
        </Form>
        {systemError ? (
          <div style={{ color: '#ff4d4f' }}>{systemError}</div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Home;

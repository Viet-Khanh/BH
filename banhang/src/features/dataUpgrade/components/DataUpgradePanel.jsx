import { Alert, Button, Modal, Space, Tag, message } from 'antd';
import { useState } from 'react';
import { useDataUpgrade } from '../hooks/useDataUpgrade.js';
import DataReconcileModal from './DataReconcileModal.jsx';
import DataUpgradePreviewModal from './DataUpgradePreviewModal.jsx';

const DataUpgradePanel = ({ onCommitted }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const {
    status,
    preview,
    reconcile,
    loading,
    reconciling,
    committing,
    error,
    loadPreview,
    loadReconcile,
    commit,
    clearPreview,
    clearReconcile,
  } = useDataUpgrade();

  const snapshotReady = Boolean(status?.snapshotReady);

  const handlePreview = async () => {
    const data = await loadPreview();
    if (data) setModalOpen(true);
  };

  const handleReconcile = async () => {
    const data = await loadReconcile();
    if (data) setReconcileOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    clearPreview();
  };

  const handleCloseReconcile = () => {
    setReconcileOpen(false);
    clearReconcile();
  };

  const handleCommit = async () => {
    const data = await commit();
    if (!data) return;
    message.success('Đã đồng bộ tồn kho và công nợ khách.');
    await onCommitted?.();
    setModalOpen(false);
  };

  const handleResyncFromHistory = () => {
    Modal.confirm({
      title: 'Đồng bộ lại theo lịch sử?',
      content:
        'Hệ thống sẽ ghi đè tồn kho hiện tại và công nợ khách bằng số tính lại từ lịch sử chứng từ. Chỉ tiếp tục khi bạn chắc chắn lịch sử đang đúng.',
      okText: 'Đồng bộ lại',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        const data = await commit();
        if (!data) throw new Error('Không thể đồng bộ lại dữ liệu.');
        message.success('Đã đồng bộ lại snapshot theo lịch sử.');
        await onCommitted?.();
        await loadReconcile();
      },
    });
  };

  return (
    <div>
      {error ? (
        <Alert
          type="warning"
          showIcon
          message={error}
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <Space wrap>
        <Tag color={snapshotReady ? 'green' : 'orange'}>
          {snapshotReady ? 'Đã đồng bộ' : 'Chưa đồng bộ'}
        </Tag>
        <Button size="large" loading={loading} onClick={handlePreview}>
          Kiểm tra dữ liệu
        </Button>
        <Button size="large" loading={reconciling} onClick={handleReconcile}>
          Đối soát số liệu
        </Button>
      </Space>
      <div style={{ marginTop: 8, color: '#5b7471' }}>
        Đồng bộ giúp dashboard và tìm hàng đọc nhanh từ số tồn kho/công nợ hiện
        tại, không phải tính lại toàn bộ lịch sử.
      </div>
      <DataUpgradePreviewModal
        open={modalOpen}
        preview={preview}
        loading={loading}
        committing={committing}
        onCancel={handleClose}
        onCommit={handleCommit}
      />
      <DataReconcileModal
        open={reconcileOpen}
        report={reconcile}
        loading={reconciling}
        syncing={committing}
        onCancel={handleCloseReconcile}
        onResync={handleResyncFromHistory}
      />
    </div>
  );
};

export default DataUpgradePanel;

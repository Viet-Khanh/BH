import { Alert, Button, Modal, Space, Spin } from 'antd';
import { useState } from 'react';
import { CONTACT_URL, DEMO_SYSTEM_PASSWORD } from '../config.js';
import EditionGrid from './EditionGrid.jsx';
import { useDemoActions } from './useDemoActions.js';

const DemoBanner = ({ edition, notices = [] }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { busy, switchTo, restore } = useDemoActions(edition);

  const pick = (editionId) => {
    setPickerOpen(false);
    if (editionId !== edition.id) switchTo(editionId);
  };

  return (
    <>
      <div className="demo-banner" role="status">
        <span>
          <strong>Bản dùng thử</strong> · Dữ liệu chỉ lưu trên trình duyệt này ·
          Ngành: <strong>{edition.name}</strong> · Mật khẩu hệ thống:{' '}
          <code>{DEMO_SYSTEM_PASSWORD}</code>
        </span>
        <Space wrap size="small">
          <Button
            size="small"
            disabled={busy}
            onClick={() => setPickerOpen(true)}
          >
            Đổi ngành
          </Button>
          <Button size="small" disabled={busy} onClick={restore}>
            Khôi phục dữ liệu mẫu
          </Button>
          {CONTACT_URL && (
            <Button
              size="small"
              type="primary"
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Liên hệ mua
            </Button>
          )}
        </Space>
      </div>
      {notices.map((notice) => (
        <Alert key={notice} banner closable type="info" message={notice} />
      ))}
      <Modal
        open={pickerOpen}
        title="Đổi loại cửa hàng"
        footer={null}
        width={760}
        onCancel={() => setPickerOpen(false)}
      >
        <EditionGrid activeId={edition.id} onPick={pick} />
      </Modal>
      <Spin spinning={busy} fullscreen tip="Đang chuẩn bị dữ liệu mẫu..." />
    </>
  );
};

export default DemoBanner;

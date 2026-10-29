import { Button, Modal, message } from 'antd';
import { seedDemo } from '../../../db/seed.js';
import DataUpgradePanel from '../../../features/dataUpgrade/components/DataUpgradePanel.jsx';
import { useEditionFeature } from '../../../platform/useActiveModule.js';
import { useSystemReload } from '../useSystemReload.js';

// "Dữ liệu": data optimisation and sample data (flag `sampleData`).
const DataGroup = () => {
  const sampleDataEnabled = useEditionFeature('sampleData');
  const reloadAll = useSystemReload();

  const handleSeed = () => {
    Modal.confirm({
      title: 'Nạp dữ liệu mẫu?',
      content: 'Dữ liệu hiện tại sẽ bị thay thế.',
      okText: 'Nạp',
      cancelText: 'Hủy',
      onOk: async () => {
        await seedDemo();
        await reloadAll();
        message.success('Đã nạp dữ liệu mẫu.');
      },
    });
  };

  return (
    <>
      <div className="system-subtitle">Tối ưu dữ liệu</div>
      <DataUpgradePanel onCommitted={reloadAll} />

      {sampleDataEnabled && (
        <>
          <div className="system-subtitle">Dữ liệu mẫu</div>
          <div className="action-row">
            <Button size="large" onClick={handleSeed}>
              Nạp dữ liệu mẫu
            </Button>
          </div>
        </>
      )}
    </>
  );
};

export default DataGroup;

import { message } from 'antd';
import TemplateEditor from '../../../components/TemplateEditor.jsx';
import LabelPrintSettings from '../../../features/printing/components/LabelPrintSettings.jsx';
import ReceiptPrintSettings from '../../../features/printing/components/ReceiptPrintSettings.jsx';
import { usePrinters } from '../../../features/printing/usePrinters.js';
import { useEditionFeature } from '../../../platform/useActiveModule.js';
import { useCustomerStore } from '../../../store/customerStore.js';
import { useProductStore } from '../../../store/productStore.js';
import { useSettingsStore } from '../../../store/settingsStore.js';
// "In ấn": copies + receipt printer, labels (flag `labels`), invoice template.
const PrintingGroup = () => {
  const labelsEnabled = useEditionFeature('labels');
  const { printers, canChoose } = usePrinters();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.update);
  const products = useProductStore((state) => state.items);
  const customers = useCustomerStore((state) => state.items);

  const saveTemplate = async (values) => {
    await updateSettings(values);
    message.success('Đã lưu mẫu hóa đơn.');
  };

  return (
    <>
      <div className="system-subtitle">Hoá đơn</div>
      <ReceiptPrintSettings printers={printers} canChoose={canChoose} />

      {labelsEnabled && (
        <>
          <div className="system-subtitle">Tem</div>
          <LabelPrintSettings printers={printers} canChoose={canChoose} />
        </>
      )}

      <div className="system-subtitle">Mẫu hoá đơn</div>
      <TemplateEditor
        settings={settings}
        products={products}
        customers={customers}
        showShopFields={false}
        onSave={saveTemplate}
      />
    </>
  );
};

export default PrintingGroup;

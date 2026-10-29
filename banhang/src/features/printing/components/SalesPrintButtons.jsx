import { Button } from 'antd';
import { useSettingsStore } from '../../../store/settingsStore.js';
import { getSalesPrintButtons } from '../domain/salesPrintButtons.js';

// Sales invoice print buttons: "In" + "In A4" on roll paper, one button otherwise.
// `onPrint(format)` with format 'default' | 'a4' (printSalesInvoice); `primary`
// highlights the default button.
const SalesPrintButtons = ({ onPrint, labels, primary = false }) => {
  const settings = useSettingsStore((state) => state.settings);
  return getSalesPrintButtons(settings, labels).map(({ format, label }) => {
    const highlight = primary && format === 'default';
    return (
      <Button
        key={format}
        size="large"
        type={highlight ? 'primary' : 'default'}
        className={highlight ? 'btn-primary' : undefined}
        onClick={() => onPrint(format)}
      >
        {label}
      </Button>
    );
  });
};

export default SalesPrintButtons;

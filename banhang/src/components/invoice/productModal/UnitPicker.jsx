import { Radio } from 'antd';
import { getUnitOptions } from '../../../utils/productUnits.js';

// Base unit / packaging units of the chosen product; hidden when it has none.
const UnitPicker = ({ product, selection }) => {
  const options = getUnitOptions(product);
  if (!selection || options.length < 2) return null;
  return (
    <div>
      <div>Đơn vị</div>
      <Radio.Group
        optionType="button"
        value={selection.value}
        onChange={(event) => selection.onChange(event.target.value)}
        options={options.map(({ value, label }) => ({ value, label }))}
      />
    </div>
  );
};

export default UnitPicker;

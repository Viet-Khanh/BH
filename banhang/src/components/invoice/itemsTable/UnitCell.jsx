import { Select } from 'antd';
import {
  getItemUnitName,
  getUnitOptions,
} from '../../../utils/productUnits.js';

// ĐVT cell: a unit select for products with packaging units, plain text otherwise.
const UnitCell = ({ item, product, index, onChangeUnit, readOnly }) => {
  const options = getUnitOptions(product);
  if (!onChangeUnit || readOnly || options.length < 2) {
    return <td>{getItemUnitName(item, product)}</td>;
  }
  return (
    <td>
      <Select
        size="small"
        value={item.unitName || ''}
        options={options.map(({ value }) => ({
          value,
          label: value || product.unit,
        }))}
        onChange={(value) => onChangeUnit(index, value)}
        popupMatchSelectWidth={false}
      />
    </td>
  );
};

export default UnitCell;

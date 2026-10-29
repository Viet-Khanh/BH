import { useCallback, useState } from 'react';
import { findProductUnit } from '../../../utils/productUnits.js';

// Unit chosen in the product modal ('' = base unit). Callers reset it with
// setUnitName('') whenever they pick a new product.
export const usePendingUnit = ({
  pendingProduct,
  getUnitPrice,
  setPendingPrice,
}) => {
  const [unitName, setUnitName] = useState('');

  const onChange = useCallback(
    (nextUnitName = '') => {
      if (!pendingProduct) return;
      setUnitName(nextUnitName);
      setPendingPrice(getUnitPrice(pendingProduct, nextUnitName));
    },
    [getUnitPrice, pendingProduct, setPendingPrice]
  );

  const unit = findProductUnit(pendingProduct, unitName);
  return {
    setUnitName,
    selection: {
      value: unit ? unit.name : '',
      factor: unit ? Number(unit.factor) : 1,
      onChange,
    },
  };
};

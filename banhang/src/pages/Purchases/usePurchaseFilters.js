import { useMemo } from 'react';
import dayjs from 'dayjs';

const usePurchaseFilters = ({ purchases, filterSupplier, filterRange, suppliers, products }) => {
  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const matchSupplier = filterSupplier ? purchase.supplierId === filterSupplier : true;
      const matchRange = filterRange[0] && filterRange[1]
        ? !dayjs(purchase.date).isBefore(dayjs(filterRange[0]).startOf('day')) &&
          !dayjs(purchase.date).isAfter(dayjs(filterRange[1]).endOf('day'))
        : true;
      return matchSupplier && matchRange;
    });
  }, [purchases, filterSupplier, filterRange]);

  const exportRows = useMemo(() => {
    return filteredPurchases.flatMap((purchase) => {
      const supplierItem = suppliers.find((s) => s.id === purchase.supplierId);
      return (purchase.items || []).map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          Ma_phieu: purchase.code,
          Ngay: dayjs(purchase.date).format('DD/MM/YYYY'),
          Nha_cung_cap: supplierItem?.name || '',
          San_pham: product?.name || '',
          So_luong: item.qty,
          Don_gia: item.unitCost,
          Thanh_tien: item.lineTotal,
        };
      });
    });
  }, [filteredPurchases, suppliers, products]);

  return { filteredPurchases, exportRows };
};

export default usePurchaseFilters;

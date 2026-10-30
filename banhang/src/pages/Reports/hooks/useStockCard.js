import { message } from 'antd';
import { useEffect, useState } from 'react';
import { getStockCard } from '../../../features/reports/api/reportsApi.js';

export const useStockCard = ({ productId, range }) => {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCard(null);
    if (!productId) return;

    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getStockCard({ productId, range });
        if (active) setCard(data || null);
      } catch (error) {
        if (active) {
          message.error(
            `Không thể tải thẻ kho: ${error.message || 'Lỗi không xác định'}`
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [productId, range]);

  return { card, loading };
};

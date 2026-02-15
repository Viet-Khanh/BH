import dayjs from 'dayjs';

export const computeProfitByDay = (invoices = []) => {
  const map = {};
  invoices.forEach((invoice) => {
    const key = dayjs(invoice.date).format('YYYY-MM-DD');
    if (!map[key]) {
      map[key] = { date: key, revenue: 0, cost: 0, profit: 0 };
    }
    const revenue = Number(invoice.total || 0);
    const cost = (invoice.items || []).reduce((sum, item) => {
      const qty = Number(item.qty || 0);
      const unitCost = Number(item.costPriceSnapshot || 0);
      const length = Number(item.length || 0);
      const width = Number(item.width || 0);
      const area = length > 0 && width > 0 ? length * width : 1;
      return sum + qty * unitCost * area;
    }, 0);
    map[key].revenue += revenue;
    map[key].cost += cost;
    map[key].profit += revenue - cost;
  });

  return Object.values(map).sort((a, b) => (a.date > b.date ? 1 : -1));
};

import dayjs from 'dayjs';

export const computeProfitByDay = (invoices = []) => {
  const map = {};
  invoices.forEach((invoice) => {
    const key = dayjs(invoice.date).format('YYYY-MM-DD');
    if (!map[key]) {
      map[key] = { date: key, revenue: 0, cost: 0, profit: 0 };
    }
    const { revenue, cost } = (invoice.items || []).reduce(
      (acc, item) => {
        if (item.excludeFromProfitSnapshot) return acc;
        const qty = Number(item.qty || 0);
        const unitPrice = Number(item.unitPrice || 0);
        const lineTotalValue = item.lineTotal ?? qty * unitPrice;
        const lineTotal = Number(lineTotalValue || 0);
        const unitCost = Number(item.costPriceSnapshot || 0);
        const length = Number(item.length || 0);
        const width = Number(item.width || 0);
        const area = length > 0 && width > 0 ? length * width : 1;
        acc.revenue += lineTotal;
        acc.cost += qty * unitCost * area;
        return acc;
      },
      { revenue: 0, cost: 0 }
    );
    map[key].revenue += revenue;
    map[key].cost += cost;
    map[key].profit += revenue - cost;
  });

  return Object.values(map).sort((a, b) => (a.date > b.date ? 1 : -1));
};

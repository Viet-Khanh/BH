import * as SalesService from '../services/sales.service.js';

export const getProducts = async (req, res) => {
  const data = await SalesService.getProductsForSales(req.query);
  res.json(data);
};

export const getCustomerDebt = async (req, res) => {
  try {
    const data = await SalesService.getCustomerDebtForSales(req.query);
    res.json(data);
  } catch (err) {
    if (err.message === 'customerId is required')
      return res.status(400).json({ message: err.message });
    throw err;
  }
};

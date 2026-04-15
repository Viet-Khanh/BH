import * as ReportService from '../services/index.js';

export const getStockReport = async (req, res) => {
  const data = await ReportService.getStockReport();
  res.json(data);
};

export const getStockMovementReport = async (req, res) => {
  const data = await ReportService.getStockMovementReport(req.query);
  res.json(data);
};

export const getDebtReport = async (req, res) => {
  const data = await ReportService.getDebtReport();
  res.json(data);
};

export const getSupplierDebtReport = async (req, res) => {
  const data = await ReportService.getSupplierDebtReport();
  res.json(data);
};

export const getSupplierDebtDetails = async (req, res) => {
  try {
    const data = await ReportService.getSupplierDebtDetails(
      req.params.supplierId
    );
    res.json(data);
  } catch (err) {
    if (err.message === 'Supplier not found') {
      return res.status(404).json({ message: err.message });
    }
    throw err;
  }
};

export const getCustomerDebtDetails = async (req, res) => {
  try {
    const data = await ReportService.getCustomerDebtDetails(
      req.params.customerId
    );
    res.json(data);
  } catch (err) {
    if (err.message === 'Customer not found') {
      return res.status(404).json({ message: err.message });
    }
    throw err;
  }
};

export const getSalesInvoicesReport = async (req, res) => {
  const data = await ReportService.getSalesInvoicesReport(req.query);
  res.json(data);
};

export const getCustomerDebtTimelineReport = async (req, res) => {
  try {
    const data = await ReportService.getCustomerDebtTimelineReport(req.query);
    res.json(data);
  } catch (err) {
    if (err.message === 'Customer not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === 'customerId is required') {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
};

export const getSalesDetailsReport = async (req, res) => {
  const data = await ReportService.getSalesDetailsReport(req.query);
  res.json(data);
};

export const getInvoiceHistory = async (req, res) => {
  const data = await ReportService.getInvoiceHistory(req.query);
  res.json(data);
};

export const getInvoicePreview = async (req, res) => {
  try {
    const data = await ReportService.getInvoicePreview(req.params.id);
    res.json(data);
  } catch (err) {
    if (err.message === 'Invoice not found') {
      return res.status(404).json({ message: err.message });
    }
    throw err;
  }
};

export const getInvoiceDetail = async (req, res) => {
  try {
    const data = await ReportService.getInvoiceDetail(req.params.id);
    res.json(data);
  } catch (err) {
    if (err.message === 'Invoice not found') {
      return res.status(404).json({ message: err.message });
    }
    throw err;
  }
};

export const deleteInvoiceCascade = async (req, res) => {
  try {
    const data = await ReportService.deleteInvoiceCascade(req.params.id);
    res.json(data);
  } catch (err) {
    if (err.message === 'Invoice not found') {
      return res.status(404).json({ message: err.message });
    }
    throw err;
  }
};

export const getProfitReport = async (req, res) => {
  const data = await ReportService.getProfitReport(req.query);
  res.json(data);
};

export const getCashReport = async (req, res) => {
  const data = await ReportService.getCashReport(req.query);
  res.json(data);
};

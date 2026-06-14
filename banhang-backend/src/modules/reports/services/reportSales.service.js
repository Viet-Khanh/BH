import {
  aggregateSalesInvoices,
  aggregateSingleInvoice,
} from '../../../utils/reportAggregators.js';
import { deleteInvoiceItem } from '../../invoices/services/invoices.service.js';
import {
  buildCustomerDebtTimeline,
  buildCustomerDebtTimelineByInvoiceOrder,
  buildCustomerMap,
  buildInvoiceItems,
  buildInvoiceSummary,
  compareDatedRecordsNewestFirst,
  inRange,
  paginateRows,
  parsePagination,
  parseRange,
} from '../../../utils/reportHelpers.js';
import {
  findCustomers,
  findInvoices,
  findOneCustomer,
  findOneInvoice,
  findPayments,
} from '../repositories/reports.repository.js';

const buildSalesSummary = (rows = []) =>
  rows.reduce(
    (acc, row) => ({
      amount: acc.amount + Number(row.amount || 0),
      paid: acc.paid + Number(row.paid || 0),
      remain: acc.remain + Number(row.remain || 0),
      profit: acc.profit + Number(row.profit || 0),
    }),
    {
      amount: 0,
      paid: 0,
      remain: 0,
      profit: 0,
    }
  );

export const getSalesInvoicesReport = async (query) => {
  const { from, to } = parseRange(query);
  const customerId = query.customerId || '';
  const { page, pageSize } = parsePagination(query);

  const {
    filteredInvoices,
    customerMap,
    activeCustomers,
    paymentsByInvoice,
    oldDebtByInvoice,
    productMap,
  } = await aggregateSalesInvoices({ from, to, customerId });

  const allRows = filteredInvoices
    .sort(compareDatedRecordsNewestFirst)
    .map((invoice) =>
      buildInvoiceSummary(invoice, {
        customerMap,
        productMap,
        paymentsByInvoice,
        oldDebtByInvoice,
      })
    );

  const pagination = paginateRows(allRows, { page, pageSize });

  return {
    rows: pagination.rows,
    summary: buildSalesSummary(allRows),
    customers: activeCustomers.map((customer) => ({
      id: customer.id,
      name: customer.name,
    })),
    pagination: pagination.meta,
  };
};

export const getCustomerDebtTimelineReport = async (query) => {
  const customerId = String(query.customerId || '').trim();
  if (!customerId) throw new Error('customerId is required');

  const { from, to } = parseRange(query);
  const customer = await findOneCustomer({
    id: customerId,
    isDeleted: { $ne: true },
  });
  if (!customer) throw new Error('Customer not found');

  const invoices = await findInvoices({
    customerId,
    isDeleted: { $ne: true },
  });
  const invoiceIds = invoices.map((invoice) => invoice.id);
  const [invoicePayments, debtReceipts] = await Promise.all([
    invoiceIds.length
      ? findPayments({
          invoiceId: { $in: invoiceIds },
          isDeleted: { $ne: true },
        })
      : Promise.resolve([]),
    findPayments({
      customerId,
      paymentType: 'debt_receipt',
      isDeleted: { $ne: true },
    }),
  ]);

  const timelineMode = String(query.mode || '').trim();
  const timeline =
    timelineMode === 'invoice-order'
      ? buildCustomerDebtTimelineByInvoiceOrder({
          invoices,
          invoicePayments,
          debtReceipts,
          from,
          to,
        })
      : buildCustomerDebtTimeline({
          invoices,
          invoicePayments,
          debtReceipts,
          from,
          to,
        });

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    },
    from: from ? from.toISOString() : null,
    to: to ? to.toISOString() : null,
    ...timeline,
  };
};

export const getSalesDetailsReport = async (query) => {
  const { from, to } = parseRange(query);
  const customerId = query.customerId || '';
  const { page, pageSize } = parsePagination(query);

  const {
    filteredInvoices,
    activeCustomers,
    customerMap,
    paymentsByInvoice,
    oldDebtByInvoice,
    productMap,
  } = await aggregateSalesInvoices({ from, to, customerId });

  const allRows = filteredInvoices
    .sort(compareDatedRecordsNewestFirst)
    .map((invoice) => ({
      ...buildInvoiceSummary(invoice, {
        customerMap,
        productMap,
        paymentsByInvoice,
        oldDebtByInvoice,
      }),
      items: invoice.items,
    }))
    .map((row) => {
      const originalInvoice = filteredInvoices.find(
        (invoice) => invoice.id === row.id
      );
      return {
        ...row,
        items: originalInvoice
          ? buildInvoiceItems(originalInvoice, productMap)
          : [],
      };
    });

  const pagination = paginateRows(allRows, { page, pageSize });

  return {
    rows: pagination.rows,
    summary: buildSalesSummary(allRows),
    customers: activeCustomers.map((customer) => ({
      id: customer.id,
      name: customer.name,
    })),
    pagination: pagination.meta,
  };
};

export const getInvoiceHistory = async (query) => {
  const { from, to } = parseRange(query);
  const customerId = String(query.customerId || '').trim();

  const [customers, invoices] = await Promise.all([
    findCustomers({}),
    findInvoices({}),
  ]);

  const customerMap = buildCustomerMap(customers);
  const activeCustomers = customers.filter((customer) => !customer.isDeleted);
  const rows = [];

  invoices.forEach((invoice) => {
    if (customerId && invoice.customerId !== customerId) return;
    const customer = customerMap[invoice.customerId];
    const base = {
      invoiceId: invoice.id,
      code: invoice.code,
      invoiceDate: invoice.date,
      staff: invoice.staff || 'admin',
      total: Number(invoice.total || 0),
      customerName: customer?.name || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
    };

    const changeLogs = Array.isArray(invoice.changeLog)
      ? invoice.changeLog
      : [];
    changeLogs.forEach((log, index) => {
      if (!log?.date || !inRange(log.date, from, to)) return;
      if (
        log.note?.includes('Tạo hóa đơn') ||
        log.note?.includes('Xóa hóa đơn')
      ) {
        return;
      }
      rows.push({
        id: `${invoice.id}-edit-${index}`,
        action: 'edit',
        date: log.date,
        note: log.note || 'Cập nhật hóa đơn',
        ...base,
      });
    });

    if (
      invoice.isDeleted &&
      invoice.deletedAt &&
      inRange(invoice.deletedAt, from, to)
    ) {
      rows.push({
        id: `${invoice.id}-delete`,
        action: 'delete',
        date: invoice.deletedAt,
        note: 'Xóa hóa đơn',
        ...base,
      });
    }
  });

  rows.sort((left, right) => new Date(right.date) - new Date(left.date));

  return {
    rows,
    customers: activeCustomers.map((customer) => ({
      id: customer.id,
      name: customer.name,
    })),
  };
};

export const getInvoicePreview = async (id) => {
  const invoice = await findOneInvoice({ id });
  if (!invoice) throw new Error('Invoice not found');
  return aggregateSingleInvoice(invoice);
};

export const getInvoiceDetail = async (id) => {
  const invoice = await findOneInvoice({
    id,
    isDeleted: { $ne: true },
  });
  if (!invoice) throw new Error('Invoice not found');
  return aggregateSingleInvoice(invoice);
};

export const deleteInvoiceCascade = async (id) => {
  const invoice = await deleteInvoiceItem(id);
  if (!invoice) throw new Error('Invoice not found');
  return { ok: true };
};

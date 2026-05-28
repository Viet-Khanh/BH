import { buildPaymentsByInvoice } from '../../../utils/customerDebt.js';
import {
  buildDebtReceiptsByCustomer,
  buildPaymentsByPurchase,
  buildSupplierDebtPaymentsBySupplier,
  buildSupplierDebtTimeline,
} from '../../../utils/reportHelpers.js';
import {
  findCustomers,
  findInvoices,
  findOneCustomer,
  findOneSupplier,
  findPayments,
  findPurchases,
  findSuppliers,
} from '../repositories/reports.repository.js';

export const getDebtReport = async () => {
  const [customers, invoices, payments] = await Promise.all([
    findCustomers({ isDeleted: { $ne: true } }),
    findInvoices({ isDeleted: { $ne: true } }),
    findPayments({ isDeleted: { $ne: true } }),
  ]);

  const paymentsByInvoice = buildPaymentsByInvoice(payments);
  const debtReceiptsByCustomer = buildDebtReceiptsByCustomer(payments);

  const rows = customers.map((customer) => {
    const customerInvoices = invoices.filter(
      (invoice) => invoice.customerId === customer.id
    );
    const total = customerInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0
    );
    const invoicePaid = customerInvoices.reduce((sum, invoice) => {
      const invoicePaidValue = paymentsByInvoice[invoice.id] || 0;
      return sum + Number(invoicePaidValue || 0);
    }, 0);
    const debtReceiptPaid = Number(debtReceiptsByCustomer[customer.id] || 0);
    const paid = invoicePaid + debtReceiptPaid;
    const debt = total - paid;

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      },
      total,
      invoicePaid,
      debtReceiptPaid,
      paid,
      debt,
    };
  });

  return { rows };
};

export const getSupplierDebtReport = async () => {
  const [suppliers, purchases, payments] = await Promise.all([
    findSuppliers({ isDeleted: { $ne: true } }),
    findPurchases({ isDeleted: { $ne: true } }),
    findPayments({
      isDeleted: { $ne: true },
      $or: [
        { purchaseId: { $ne: null } },
        { paymentType: 'supplier_debt_payment' },
      ],
    }),
  ]);

  const paymentsByPurchase = buildPaymentsByPurchase(payments);
  const debtPaymentsBySupplier = buildSupplierDebtPaymentsBySupplier(payments);
  const purchaseMap = purchases.reduce((acc, purchase) => {
    if (!purchase.supplierId) return acc;
    if (!acc[purchase.supplierId]) acc[purchase.supplierId] = [];
    acc[purchase.supplierId].push(purchase);
    return acc;
  }, {});

  const rows = suppliers.map((supplier) => {
    const supplierPurchases = purchaseMap[supplier.id] || [];
    const total = supplierPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.total || 0),
      0
    );
    const purchasePaid = supplierPurchases.reduce(
      (sum, purchase) => sum + (paymentsByPurchase[purchase.id] || 0),
      0
    );
    const debtPaid = Number(debtPaymentsBySupplier[supplier.id] || 0);
    const paid = purchasePaid + debtPaid;

    return {
      supplier: {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        address: supplier.address,
      },
      total,
      purchasePaid,
      debtPaid,
      paid,
      debt: total - paid,
    };
  });

  return { rows };
};

export const getSupplierDebtDetails = async (supplierId) => {
  const supplier = await findOneSupplier({
    id: supplierId,
    isDeleted: { $ne: true },
  });
  if (!supplier) throw new Error('Supplier not found');

  const purchases = await findPurchases({
    supplierId: supplier.id,
    isDeleted: { $ne: true },
  });
  const purchaseIds = purchases.map((purchase) => purchase.id);

  const [payments, supplierDebtPayments, deletedSupplierDebtPayments] =
    await Promise.all([
      purchaseIds.length
        ? findPayments({
            purchaseId: { $in: purchaseIds },
            isDeleted: { $ne: true },
          })
        : Promise.resolve([]),
      findPayments({
        supplierId: supplier.id,
        paymentType: 'supplier_debt_payment',
        isDeleted: { $ne: true },
      }),
      findPayments({
        supplierId: supplier.id,
        paymentType: 'supplier_debt_payment',
        isDeleted: true,
      }),
    ]);

  const paymentsByPurchase = buildPaymentsByPurchase(payments);
  const openPurchases = purchases
    .map((purchase) => {
      const paid = paymentsByPurchase[purchase.id] || 0;
      const total = Number(purchase.total || 0);
      return {
        id: purchase.id,
        code: purchase.code,
        date: purchase.date,
        total,
        remain: total - paid,
      };
    })
    .filter((purchase) => purchase.remain > 0);

  const debtTimeline = buildSupplierDebtTimeline({
    purchases,
    purchasePayments: payments,
    debtPayments: supplierDebtPayments,
  });
  const debtPaymentTimelineById = debtTimeline.rows.reduce((acc, row) => {
    if (row.type === 'supplier_debt_payment') {
      acc[String(row.id).replace('supplier-debt-payment:', '')] = row;
    }
    return acc;
  }, {});

  const debtPaymentRows = supplierDebtPayments
    .map((payment) => ({
      id: payment.id,
      code: payment.code || '',
      date: payment.date,
      amount: Number(payment.amount || 0),
      method: payment.method || '',
      note: payment.note || '',
      oldDebt: Number(debtPaymentTimelineById[payment.id]?.oldDebt || 0),
      totalPay: Number(debtPaymentTimelineById[payment.id]?.totalPay || 0),
      remain: Number(debtPaymentTimelineById[payment.id]?.remain || 0),
    }))
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  const deletedDebtPaymentRows = deletedSupplierDebtPayments
    .map((payment) => ({
      id: payment.id,
      code: payment.code || '',
      date: payment.date,
      amount: Number(payment.amount || 0),
      method: payment.method || '',
      note: payment.note || '',
      deletedAt: payment.deletedAt || '',
    }))
    .sort(
      (left, right) =>
        new Date(right.deletedAt || right.date || 0) -
        new Date(left.deletedAt || left.date || 0)
    );

  const purchaseTotal = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.total || 0),
    0
  );
  const purchasePaid = purchases.reduce(
    (sum, purchase) => sum + Number(paymentsByPurchase[purchase.id] || 0),
    0
  );
  const debtPaid = debtPaymentRows.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );
  const totalPaid = purchasePaid + debtPaid;

  return {
    supplier: {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address,
    },
    purchases: openPurchases,
    debtPayments: debtPaymentRows,
    deletedDebtPayments: deletedDebtPaymentRows,
    summary: {
      purchaseTotal,
      purchasePaid,
      debtPaid,
      totalPaid,
      debt: purchaseTotal - totalPaid,
    },
  };
};

export const getCustomerDebtDetails = async (customerId) => {
  const customer = await findOneCustomer({
    id: customerId,
    isDeleted: { $ne: true },
  });
  if (!customer) throw new Error('Customer not found');

  const invoices = await findInvoices({
    customerId: customer.id,
    isDeleted: { $ne: true },
  });
  const invoiceIds = invoices.map((invoice) => invoice.id);

  const [invoicePayments, debtReceipts, deletedDebtReceipts] =
    await Promise.all([
      invoiceIds.length
        ? findPayments({
            invoiceId: { $in: invoiceIds },
            isDeleted: { $ne: true },
          })
        : Promise.resolve([]),
      findPayments({
        customerId: customer.id,
        paymentType: 'debt_receipt',
        isDeleted: { $ne: true },
      }),
      findPayments({
        customerId: customer.id,
        paymentType: 'debt_receipt',
        isDeleted: true,
      }),
    ]);

  const paymentsByInvoice = buildPaymentsByInvoice(invoicePayments);
  const openInvoices = invoices
    .map((invoice) => {
      const paid = Number(paymentsByInvoice[invoice.id] || 0);
      const total = Number(invoice.total || 0);
      return {
        id: invoice.id,
        code: invoice.code,
        date: invoice.date,
        total,
        remain: total - paid,
      };
    })
    .filter((invoice) => invoice.remain > 0);

  const debtReceiptRows = debtReceipts
    .map((payment) => ({
      id: payment.id,
      code: payment.code || '',
      date: payment.date,
      amount: Number(payment.amount || 0),
      method: payment.method || '',
      note: payment.note || '',
    }))
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  const deletedDebtReceiptRows = deletedDebtReceipts
    .map((payment) => ({
      id: payment.id,
      code: payment.code || '',
      date: payment.date,
      amount: Number(payment.amount || 0),
      method: payment.method || '',
      note: payment.note || '',
      deletedAt: payment.deletedAt || '',
    }))
    .sort(
      (left, right) =>
        new Date(right.deletedAt || right.date || 0) -
        new Date(left.deletedAt || left.date || 0)
    );

  const invoiceTotal = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0
  );
  const invoicePaid = invoices.reduce(
    (sum, invoice) => sum + Number(paymentsByInvoice[invoice.id] || 0),
    0
  );
  const debtReceiptPaid = debtReceiptRows.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );
  const totalPaid = invoicePaid + debtReceiptPaid;

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    },
    invoices: openInvoices,
    debtReceipts: debtReceiptRows,
    deletedDebtReceipts: deletedDebtReceiptRows,
    summary: {
      invoiceTotal,
      invoicePaid,
      debtReceiptPaid,
      totalPaid,
      debt: invoiceTotal - totalPaid,
    },
  };
};

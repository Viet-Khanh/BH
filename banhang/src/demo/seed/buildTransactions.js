import { SEED_DAYS } from '../config.js';
import { createStockTracker } from './stockTracker.js';
import { listSeedDays, spreadTimes } from './timeline.js';
import {
  makeDebtReceipt,
  makeExpense,
  makeInvoice,
  makePurchase,
} from './transactionFactories.js';

const PURCHASE_EVERY_DAYS = 3;
const DEBT_RECEIPT_EVERY_DAYS = 7;
const EXPENSE_EVERY_DAYS = 5;

const buildDayEvents = (context, offset) => {
  const { edition, master, random } = context;
  const events = [];
  if (offset % PURCHASE_EVERY_DAYS === 0) events.push(makePurchase(context));
  const invoiceCount = random.int(...edition.activity.invoicesPerDay);
  for (let index = 0; index < invoiceCount; index += 1) {
    const invoice = makeInvoice(context);
    if (invoice) events.push(invoice);
  }
  if (offset % DEBT_RECEIPT_EVERY_DAYS === 0) {
    master.debtorIds
      .filter(() => random.chance(0.5))
      .forEach((customerId) =>
        events.push(makeDebtReceipt(context, customerId))
      );
  }
  if (offset % EXPENSE_EVERY_DAYS === 0) events.push(makeExpense(context));
  return events;
};

// Chronological list of business events covering the last SEED_DAYS days.
export const buildTransactions = ({ edition, master, now, random }) => {
  const context = {
    edition,
    master,
    random,
    stock: createStockTracker(master.products),
  };
  return listSeedDays(now, SEED_DAYS).flatMap((day) => {
    const events = buildDayEvents(context, day.offset);
    const times = spreadTimes(day, events.length, random);
    return events.map((event, index) => ({
      ...event,
      date: times[index].toISOString(),
    }));
  });
};

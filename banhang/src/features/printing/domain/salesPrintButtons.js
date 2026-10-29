// Print buttons for a sales invoice: roll paper → the receipt ("In") plus a one-off
// A4 ("In A4", printSalesInvoice format 'a4'); A5/A4 paper → one button.
import { getReceiptPaper } from '../receipt/receiptPaper.js';

export const getSalesPrintButtons = (
  settings,
  { label = 'In', a4Label = 'In A4', singleLabel = label } = {}
) =>
  settings && getReceiptPaper(settings).roll
    ? [
        { format: 'default', label },
        { format: 'a4', label: a4Label },
      ]
    : [{ format: 'default', label: singleLabel }];

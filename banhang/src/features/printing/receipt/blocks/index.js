// Block key → renderer and zone. A dashed line separates consecutive visible blocks
// of different zones (head: logo + shop; info: title, code/date, customer).
import { renderBarcode } from './barcode.js';
import { renderCustomer } from './customer.js';
import { renderFooter } from './footer.js';
import { renderItems } from './items.js';
import { renderLogo } from './logo.js';
import { renderMeta } from './meta.js';
import { renderNote } from './note.js';
import { renderQr } from './qr.js';
import { renderShop } from './shop.js';
import { renderTitle } from './title.js';
import { renderTotals } from './totals.js';

export const RECEIPT_BLOCKS = {
  logo: { zone: 'head', render: renderLogo },
  shop: { zone: 'head', render: renderShop },
  title: { zone: 'info', render: renderTitle },
  meta: { zone: 'info', render: renderMeta },
  customer: { zone: 'info', render: renderCustomer },
  items: { zone: 'items', render: renderItems },
  totals: { zone: 'totals', render: renderTotals },
  note: { zone: 'note', render: renderNote },
  qr: { zone: 'qr', render: renderQr },
  barcode: { zone: 'barcode', render: renderBarcode },
  footer: { zone: 'footer', render: renderFooter },
};

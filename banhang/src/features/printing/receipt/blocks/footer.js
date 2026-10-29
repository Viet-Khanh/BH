import { getBlock } from '../receiptLayout.js';
import { text } from './html.js';

export const renderFooter = ({ layout }) =>
  `<div class="center">${text(getBlock(layout, 'footer')?.text)}</div>`;

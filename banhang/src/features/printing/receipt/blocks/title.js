import { getBlock } from '../receiptLayout.js';
import { text } from './html.js';

export const renderTitle = ({ layout }) =>
  `<div class="center"><b>${text(getBlock(layout, 'title')?.text)}</b></div>`;

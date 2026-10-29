import dayjs from 'dayjs';
import { row, text } from './html.js';

// Invoice code and date/time on one line.
export const renderMeta = ({ invoice }) =>
  row(
    text(invoice.code || ''),
    invoice.date ? dayjs(invoice.date).format('DD/MM/YYYY HH:mm') : ''
  );

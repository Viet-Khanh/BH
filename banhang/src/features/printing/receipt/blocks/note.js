import { text } from './html.js';

export const renderNote = ({ invoice }) => {
  const note = invoice.printNote || invoice.note || '';
  return note ? `<div>Ghi chú: ${text(note)}</div>` : '';
};

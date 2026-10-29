// Small HTML helpers shared by the receipt blocks (all text goes through `text`).
import { escapeHtml } from '../../../../utils/htmlEscape.js';

export const text = (value) => escapeHtml(value).replaceAll('\n', '<br />');

// Label left, value right (value never wraps).
export const row = (label, value, className = 'row') =>
  `<div class="${className}"><span>${label}</span><span>${value}</span></div>`;

export const center = (html) =>
  html ? `<div class="center">${html}</div>` : '';

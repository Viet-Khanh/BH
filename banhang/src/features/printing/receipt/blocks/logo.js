import { escapeHtml } from '../../../../utils/htmlEscape.js';

// Shop logo (PNG data URL from the designer), scaled down to the paper width.
export const renderLogo = ({ logo }) =>
  logo
    ? `<div class="center"><img src="${escapeHtml(logo)}" alt="" style="max-width: 100%; height: auto" /></div>`
    : '';

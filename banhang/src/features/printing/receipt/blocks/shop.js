import { center, text } from './html.js';

// Shop name, phone and address from System → Cửa hàng.
export const renderShop = ({ settings }) =>
  center(
    [
      settings.shopName && `<div class="shop">${text(settings.shopName)}</div>`,
      settings.shopPhone && `<div>ĐT: ${text(settings.shopPhone)}</div>`,
      settings.shopAddress &&
        `<div class="small">${text(settings.shopAddress)}</div>`,
    ]
      .filter(Boolean)
      .join('')
  );

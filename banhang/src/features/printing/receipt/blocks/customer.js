import { isWalkInCustomer } from '../../../../utils/customers.js';
import { text } from './html.js';

// Named customers only: a walk-in sale prints no customer.
export const renderCustomer = ({ customer }) => {
  if (isWalkInCustomer(customer)) return '';
  const phone = customer.phone ? `<div>ĐT: ${text(customer.phone)}</div>` : '';
  return `<div>Khách hàng: ${text(customer.name)}</div>${phone}`;
};

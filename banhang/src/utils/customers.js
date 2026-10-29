const WALK_IN_NAMES = new Set(['Khách lẻ', 'Khach le']);

export const isWalkInCustomer = (customer) =>
  !customer || WALK_IN_NAMES.has(customer.name);

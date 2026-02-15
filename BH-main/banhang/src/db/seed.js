import { apiRequest } from './repository.js';

export const seedDemo = async () => {
  await apiRequest('/seed', { method: 'POST' });
};

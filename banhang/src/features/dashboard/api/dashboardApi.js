import { apiRequest } from '../../../db/repository.js';

export const getTodayDashboard = () => apiRequest('/dashboard/today');

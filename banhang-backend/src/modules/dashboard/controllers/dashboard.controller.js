import * as DashboardService from '../services/dashboard.service.js';

export const getTodayDashboard = async (req, res) => {
  const data = await DashboardService.getTodayDashboard();
  res.json(data);
};

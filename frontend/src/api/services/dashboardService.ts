import axiosClient from '../axiosClient';
import type {
  CategorySpendResponse,
  DashboardSummaryResponse,
  RecentExpenseResponse,
  TrendResponse,
} from '../../types';

export const dashboardService = {
  getSummary: () =>
    axiosClient.get<DashboardSummaryResponse>('/dashboard/summary').then((r) => r.data),

  getTrends: () =>
    axiosClient.get<TrendResponse>('/dashboard/trends').then((r) => r.data),

  getByCategory: () =>
    axiosClient.get<CategorySpendResponse[]>('/dashboard/by-category').then((r) => r.data),

  getRecent: () =>
    axiosClient.get<RecentExpenseResponse[]>('/dashboard/recent').then((r) => r.data),
};

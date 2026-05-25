import axiosClient from '../axiosClient';
import type {
  CategorySpendResponse,
  DashboardSummaryResponse,
  RecentExpenseResponse,
  TrendResponse,
} from '../../types';

export interface DateRangeParams {
  /** ISO date string yyyy-MM-dd. Omit both bounds for the server default. */
  from?: string;
  to?: string;
}

export const dashboardService = {
  getSummary: () =>
    axiosClient.get<DashboardSummaryResponse>('/dashboard/summary').then((r) => r.data),

  getTrends: (params: DateRangeParams = {}) =>
    axiosClient
      .get<TrendResponse>('/dashboard/trends', { params })
      .then((r) => r.data),

  getByCategory: (params: DateRangeParams = {}) =>
    axiosClient
      .get<CategorySpendResponse[]>('/dashboard/by-category', { params })
      .then((r) => r.data),

  getRecent: () =>
    axiosClient.get<RecentExpenseResponse[]>('/dashboard/recent').then((r) => r.data),
};

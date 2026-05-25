import axiosClient from '../axiosClient';
import type {
  DayOfWeekSpendResponse,
  RecentExpenseResponse,
  ReportSummaryResponse,
} from '../../types';

export interface ReportDateRange {
  /** ISO yyyy-MM-dd, inclusive. */
  from: string;
  to: string;
}

export const reportsService = {
  getSummary: (range: ReportDateRange) =>
    axiosClient
      .get<ReportSummaryResponse>('/reports/summary', { params: range })
      .then((r) => r.data),

  getByDayOfWeek: (range: ReportDateRange) =>
    axiosClient
      .get<DayOfWeekSpendResponse[]>('/reports/by-day-of-week', { params: range })
      .then((r) => r.data),

  getTopExpenses: (range: ReportDateRange, limit = 10) =>
    axiosClient
      .get<RecentExpenseResponse[]>('/reports/top-expenses', {
        params: { ...range, limit },
      })
      .then((r) => r.data),
};

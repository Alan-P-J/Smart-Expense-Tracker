import axiosClient from '../axiosClient';
import type { BudgetRequest, BudgetResponse } from '../../types';

export const budgetService = {
  getBudgets: () =>
    axiosClient.get<BudgetResponse[]>('/budgets').then((r) => r.data),

  upsertBudget: (data: BudgetRequest) =>
    axiosClient.post<BudgetResponse>('/budgets', data).then((r) => r.data),
};

import axiosClient from '../axiosClient';
import type {
  ExpenseListParams,
  ExpenseRequest,
  ExpenseResponse,
  Page,
} from '../../types';

export const expenseService = {
  getExpenses: (params: ExpenseListParams = {}) =>
    axiosClient.get<Page<ExpenseResponse>>('/expenses', { params }).then((r) => r.data),

  getExpenseById: (id: number) =>
    axiosClient.get<ExpenseResponse>(`/expenses/${id}`).then((r) => r.data),

  createExpense: (data: ExpenseRequest) =>
    axiosClient.post<ExpenseResponse>('/expenses', data).then((r) => r.data),

  updateExpense: (id: number, data: ExpenseRequest) =>
    axiosClient.put<ExpenseResponse>(`/expenses/${id}`, data).then((r) => r.data),

  deleteExpense: (id: number) =>
    axiosClient.delete<void>(`/expenses/${id}`).then(() => undefined),
};

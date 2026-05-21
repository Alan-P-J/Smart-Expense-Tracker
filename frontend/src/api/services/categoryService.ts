import axiosClient from '../axiosClient';
import type { CategoryRequest, CategoryResponse } from '../../types';

export const categoryService = {
  getCategories: () =>
    axiosClient.get<CategoryResponse[]>('/categories').then((r) => r.data),

  createCategory: (data: CategoryRequest) =>
    axiosClient.post<CategoryResponse>('/categories', data).then((r) => r.data),

  updateCategory: (id: number, data: CategoryRequest) =>
    axiosClient.put<CategoryResponse>(`/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: number) =>
    axiosClient.delete<void>(`/categories/${id}`).then(() => undefined),
};

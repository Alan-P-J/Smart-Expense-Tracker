import axiosClient from '../axiosClient';
import type {
  CompanyResponse,
  CompanyStatsResponse,
  CreateCompanyRequest,
  CreateCompanyUserRequest,
  UserResponse,
} from '../../types';

// All endpoints are SUPER_ADMIN-only on the server (@PreAuthorize on the class).
// Calling them as a non-super user returns 403 from GlobalExceptionHandler.
export const companyService = {
  list: () =>
    axiosClient.get<CompanyResponse[]>('/companies').then((r) => r.data),

  getOne: (id: number) =>
    axiosClient.get<CompanyStatsResponse>(`/companies/${id}`).then((r) => r.data),

  create: (data: CreateCompanyRequest) =>
    axiosClient.post<CompanyResponse>('/companies', data).then((r) => r.data),

  deactivate: (id: number) =>
    axiosClient.put<void>(`/companies/${id}/deactivate`).then(() => undefined),

  addUser: (id: number, data: CreateCompanyUserRequest) =>
    axiosClient.post<UserResponse>(`/companies/${id}/users`, data).then((r) => r.data),

  listUsers: (id: number) =>
    axiosClient.get<UserResponse[]>(`/companies/${id}/users`).then((r) => r.data),
};

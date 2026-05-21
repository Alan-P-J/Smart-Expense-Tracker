import axiosClient from '../axiosClient';
import type { AuthResponse } from '../../types';

export const authService = {
  login: (email: string, password: string) =>
    axiosClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  logout: () =>
    axiosClient.post<void>('/auth/logout').then(() => undefined),

  refresh: () =>
    axiosClient.post<void>('/auth/refresh').then(() => undefined),

  me: () =>
    axiosClient.get<AuthResponse>('/auth/me').then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    axiosClient
      .put<void>('/auth/password', { currentPassword, newPassword })
      .then(() => undefined),
};

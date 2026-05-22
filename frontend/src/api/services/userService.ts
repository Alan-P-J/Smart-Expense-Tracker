import axiosClient from '../axiosClient';
import type { CreateUserRequest, Role, UserResponse } from '../../types';

export const userService = {
  getUsers: () =>
    axiosClient.get<UserResponse[]>('/users').then((r) => r.data),

  createUser: (data: CreateUserRequest) =>
    axiosClient.post<UserResponse>('/users', data).then((r) => r.data),

  // Backend expects { "role": "ADMIN" | "VIEWER" } as a Map<String,String>.
  changeRole: (id: number, role: Role) =>
    axiosClient.put<UserResponse>(`/users/${id}/role`, { role }).then((r) => r.data),

  // Returns 204 No Content; we just want the promise.
  deactivate: (id: number) =>
    axiosClient.put<void>(`/users/${id}/deactivate`).then(() => undefined),
};

import axiosClient from '../axiosClient';
import type { AuditLogResponse, Page } from '../../types';

export interface AuditLogListParams {
  entityType?: string;
  userId?: number;
  page?: number;
  size?: number;
}

export const auditLogService = {
  getAuditLog: (params: AuditLogListParams = {}) =>
    axiosClient
      .get<Page<AuditLogResponse>>('/audit-log', { params })
      .then((r) => r.data),
};

package com.expensetracker.dto.response;

import com.expensetracker.entity.AuditLog;

import java.time.OffsetDateTime;

public record AuditLogResponse(
        Long id,
        Long userId,
        String userEmail,
        String action,
        String entityType,
        Long entityId,
        String oldValue,
        String newValue,
        OffsetDateTime createdAt
) {
    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUser().getId(),
                log.getUser().getEmail(),
                log.getAction().name(),
                log.getEntityType(),
                log.getEntityId(),
                log.getOldValue(),
                log.getNewValue(),
                log.getCreatedAt()
        );
    }
}

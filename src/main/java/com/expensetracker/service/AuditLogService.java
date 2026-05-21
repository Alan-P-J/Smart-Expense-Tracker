package com.expensetracker.service;

import com.expensetracker.dto.response.AuditLogResponse;
import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.AuditLog;
import com.expensetracker.entity.AuditLog.Action;
import com.expensetracker.repository.AuditLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private static final String SERIALIZATION_FAILED_JSON = "{\"error\":\"serialization_failed\"}";

    private final AuditLogRepository repo;
    private final ObjectMapper mapper;

    /**
     * REQUIRES_NEW so the audit row commits independently of the caller's
     * transaction — if the business txn rolls back, we still know an attempt
     * was made.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(AdminUser actor,
                    Action action,
                    String entityType,
                    Long entityId,
                    Object oldValue,
                    Object newValue) {

        AuditLog entry = AuditLog.builder()
                .user(actor)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(toJson(oldValue, actor, entityType, entityId, "old"))
                .newValue(toJson(newValue, actor, entityType, entityId, "new"))
                .build();

        repo.save(entry);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> list(String entityType, Long userId, Pageable pageable) {
        Page<AuditLog> page;
        if (entityType != null && userId != null) {
            page = repo.findByEntityTypeAndUserIdOrderByCreatedAtDesc(entityType, userId, pageable);
        } else if (entityType != null) {
            page = repo.findByEntityTypeOrderByCreatedAtDesc(entityType, pageable);
        } else if (userId != null) {
            page = repo.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        } else {
            page = repo.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(AuditLogResponse::from);
    }

    private String toJson(Object value, AdminUser actor, String entityType, Long entityId, String which) {
        if (value == null) return null;
        try {
            return mapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            log.error("Failed to serialize audit {} value for actor={} entity={}/{}",
                    which, actor.getId(), entityType, entityId, ex);
            return SERIALIZATION_FAILED_JSON;
        }
    }
}

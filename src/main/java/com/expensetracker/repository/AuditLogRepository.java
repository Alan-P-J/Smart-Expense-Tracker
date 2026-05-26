package com.expensetracker.repository;

import com.expensetracker.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

/**
 * Tenant scoping uses the same {@code (:companyId IS NULL OR …)} pattern as
 * the other repos so SUPER_ADMIN (companyId=null) sees everything, while
 * everyone else is constrained to their own company's audit trail.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a " +
           "WHERE (:companyId IS NULL OR a.company.id = :companyId) " +
           "AND   (:entityType IS NULL OR a.entityType = :entityType) " +
           "AND   (:userId IS NULL OR a.user.id = :userId) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> search(@Nullable String entityType,
                          @Nullable Long userId,
                          @Nullable Long companyId,
                          Pageable pageable);
}

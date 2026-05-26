package com.expensetracker.repository;

import com.expensetracker.entity.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {

    Optional<AdminUser> findByEmail(String email);

    boolean existsByEmail(String email);

    java.util.List<AdminUser> findAllByCompanyId(Long companyId);

    @Modifying
    @Query("UPDATE AdminUser u SET u.lastLoginAt = :time WHERE u.id = :id")
    void updateLastLoginAt(Long id, OffsetDateTime time);
}

package com.expensetracker.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "admin_users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@ToString(exclude = {"expenses", "budgets"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AdminUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt;

    @Column(name = "last_login_at", columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime lastLoginAt;

    // Nullable: SUPER_ADMIN belongs to no single company. EAGER because
    // JwtAuthenticationFilter loads UserPrincipal once per request and then
    // TenantFilter reads company.id outside the JPA session.
    @ManyToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "is_super_admin", nullable = false)
    @Builder.Default
    private boolean isSuperAdmin = false;

    public enum Role {
        // ADMIN is the company-scoped admin (the spec's COMPANY_ADMIN).
        SUPER_ADMIN, ADMIN, VIEWER
    }
}

package com.expensetracker.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "categories")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    // Not globally unique any more (multi-tenancy): two companies may each
    // own a custom "Food" category. CategoryService enforces uniqueness
    // within (name, visible-to-company) at application level.
    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "colour_hex", nullable = false, length = 7)
    @Builder.Default
    private String colourHex = "#6B7280";

    @Column(name = "icon_name", length = 50)
    private String iconName;

    // TRUE = seeded/default category — protected from deletion
    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    // Nullable on purpose:
    //   NULL     = global default category (visible to every company)
    //   NOT NULL = company-specific custom category
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "company_id")
    private Company company;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt;
}

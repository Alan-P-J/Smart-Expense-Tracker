package com.expensetracker.repository;

import com.expensetracker.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * Categories visible to a tenant: globals ({@code company_id IS NULL})
     * plus the tenant's own custom categories. Passing {@code null} returns
     * every category across every tenant (SUPER_ADMIN view).
     */
    @Query("SELECT c FROM Category c " +
           "WHERE :companyId IS NULL " +
           "   OR c.company.id IS NULL " +
           "   OR c.company.id = :companyId " +
           "ORDER BY c.name ASC")
    List<Category> findVisibleForCompany(@Nullable Long companyId);

    /**
     * True when a category with this name is already visible to the tenant
     * — either as a global default or as one of their own customs. Used by
     * CategoryService.create / update to enforce in-tenant name uniqueness.
     */
    @Query("SELECT COUNT(c) > 0 FROM Category c " +
           "WHERE LOWER(c.name) = LOWER(:name) " +
           "AND (c.company.id IS NULL OR c.company.id = :companyId)")
    boolean existsByNameForCompany(String name, @Nullable Long companyId);

    /**
     * True when a category with this name exists for the tenant, EXCLUDING
     * the category with the given id — used by update() to allow renaming a
     * category without colliding with itself.
     */
    @Query("SELECT COUNT(c) > 0 FROM Category c " +
           "WHERE LOWER(c.name) = LOWER(:name) " +
           "AND c.id <> :excludeId " +
           "AND (c.company.id IS NULL OR c.company.id = :companyId)")
    boolean existsByNameForCompanyExcluding(String name, Long excludeId, @Nullable Long companyId);

    /**
     * Used by CategoryService to enforce 409 before delete (Decision D07).
     * Cross-tenant: any expense referencing this category — global category
     * deletion is already blocked by isDefault, so the rare custom-category
     * case stays correct even when expenses span tenants (they can't —
     * a custom category and its expenses share company_id).
     */
    @Query("SELECT COUNT(e) > 0 FROM Expense e WHERE e.category.id = :categoryId")
    boolean hasExpenses(Long categoryId);
}

package com.expensetracker.repository;

import com.expensetracker.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    Optional<Budget> findByCategoryIdAndCompanyId(Long categoryId, Long companyId);

    /**
     * All budgets visible to a tenant, ordered by category name. Passing
     * {@code null} returns every budget across every tenant (SUPER_ADMIN
     * view).
     */
    @Query("SELECT b FROM Budget b " +
           "WHERE (:companyId IS NULL OR b.company.id = :companyId) " +
           "ORDER BY b.category.name ASC")
    List<Budget> findAllForCompany(@Nullable Long companyId);
}

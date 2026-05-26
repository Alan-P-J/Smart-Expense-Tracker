package com.expensetracker.repository;

import com.expensetracker.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findBySlug(String slug);

    List<Company> findAllByIsActive(boolean isActive);

    boolean existsBySlug(String slug);

    // Used by CompanyService.getCompanyStats — one round-trip per stat.
    @Query("SELECT COUNT(u) FROM AdminUser u WHERE u.company.id = :companyId")
    long countUsers(Long companyId);

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.company.id = :companyId")
    long countExpenses(Long companyId);
}

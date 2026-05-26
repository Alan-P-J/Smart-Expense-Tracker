package com.expensetracker.security;

import com.expensetracker.entity.Expense;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic filter for {@code GET /api/expenses}. Tenant scoping is applied
 * unconditionally — services pass {@code companyId} from {@link TenantContext}
 * and only super admins (who provide {@code null}) see across companies.
 *
 * The other parameters are optional — nulls / blanks contribute no predicate
 * so the caller can mix and match (category + date range + search) freely.
 */
public final class ExpenseSpecification {

    private ExpenseSpecification() {}

    public static Specification<Expense> filter(Long companyId,
                                                Long categoryId,
                                                LocalDate startDate,
                                                LocalDate endDate,
                                                String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Tenant scope. Null means SUPER_ADMIN — no filter applied.
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("expenseDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("expenseDate"), endDate));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch  = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleMatch, descMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

package com.expensetracker.service;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.response.BudgetResponse;
import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.AuditLog.Action;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Category;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private static final String ENTITY_TYPE = "Budget";
    private static final BigDecimal NEAR_LIMIT_PCT = new BigDecimal("80");

    private final BudgetRepository budgetRepo;
    private final CategoryRepository categoryRepo;
    private final ExpenseRepository expenseRepo;
    private final AuditLogService auditLog;

    @Transactional(readOnly = true)
    public List<BudgetResponse> listWithProgress() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        // One round-trip for all category totals this month.
        Map<Long, BigDecimal> spentByCategoryId = new HashMap<>();
        for (Object[] row : expenseRepo.spentPerCategoryBetween(monthStart, today)) {
            spentByCategoryId.put((Long) row[0], (BigDecimal) row[1]);
        }

        return budgetRepo.findAllByOrderByCategoryNameAsc().stream()
                .map(b -> toResponse(b, spentByCategoryId.getOrDefault(b.getCategory().getId(), BigDecimal.ZERO)))
                .toList();
    }

    @Transactional
    public BudgetResponse upsert(BudgetRequest req) {
        Category category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", req.categoryId()));

        AdminUser actor = SecurityUtils.getCurrentUser();

        return budgetRepo.findByCategoryId(req.categoryId())
                .map(existing -> updateExisting(existing, req, actor))
                .orElseGet(() -> createNew(category, req, actor));
    }

    private BudgetResponse createNew(Category category, BudgetRequest req, AdminUser actor) {
        Budget budget = Budget.builder()
                .category(category)
                .monthlyLimit(req.monthlyLimit())
                .createdBy(actor)
                .build();

        Budget saved = budgetRepo.save(budget);

        auditLog.log(actor, Action.CREATE, ENTITY_TYPE, saved.getId(),
                null, snapshot(saved));

        return toResponse(saved, currentMonthSpend(saved.getCategory().getId()));
    }

    private BudgetResponse updateExisting(Budget existing, BudgetRequest req, AdminUser actor) {
        Map<String, Object> oldValue = snapshot(existing);

        existing.setMonthlyLimit(req.monthlyLimit());
        Budget saved = budgetRepo.save(existing);

        auditLog.log(actor, Action.UPDATE, ENTITY_TYPE, saved.getId(),
                oldValue, snapshot(saved));

        return toResponse(saved, currentMonthSpend(saved.getCategory().getId()));
    }

    private BigDecimal currentMonthSpend(Long categoryId) {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        for (Object[] row : expenseRepo.spentPerCategoryBetween(monthStart, today)) {
            if (categoryId.equals(row[0])) return (BigDecimal) row[1];
        }
        return BigDecimal.ZERO;
    }

    private BudgetResponse toResponse(Budget b, BigDecimal spent) {
        BigDecimal limit     = b.getMonthlyLimit();
        BigDecimal remaining = limit.subtract(spent);

        // (spent / limit) * 100 — rounded to 2dp, kept as a double for the wire.
        double pct = spent.multiply(BigDecimal.valueOf(100))
                .divide(limit, 2, RoundingMode.HALF_UP)
                .doubleValue();

        boolean over     = spent.compareTo(limit) > 0;
        boolean near     = !over && BigDecimal.valueOf(pct).compareTo(NEAR_LIMIT_PCT) >= 0;

        return new BudgetResponse(
                b.getId(),
                b.getCategory().getId(),
                b.getCategory().getName(),
                b.getCategory().getColourHex(),
                limit,
                spent,
                remaining,
                pct,
                over,
                near
        );
    }

    private Map<String, Object> snapshot(Budget b) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",            b.getId());
        m.put("categoryId",    b.getCategory().getId());
        m.put("monthlyLimit",  b.getMonthlyLimit());
        return m;
    }
}

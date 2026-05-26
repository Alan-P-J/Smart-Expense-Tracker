package com.expensetracker.service;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.response.BudgetResponse;
import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.AuditLog.Action;
import com.expensetracker.entity.Budget;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Company;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.CompanyRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.security.SecurityUtils;
import com.expensetracker.security.TenantSecurityService;
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
    private final CompanyRepository companyRepo;
    private final ExpenseRepository expenseRepo;
    private final AuditLogService auditLog;

    @Transactional(readOnly = true)
    public List<BudgetResponse> listWithProgress() {
        Long companyId = TenantSecurityService.currentCompanyIdOrNull();
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        Map<Long, BigDecimal> spentByCategoryId = new HashMap<>();
        for (Object[] row : expenseRepo.spentPerCategoryBetween(monthStart, today, companyId)) {
            spentByCategoryId.put((Long) row[0], (BigDecimal) row[1]);
        }

        return budgetRepo.findAllForCompany(companyId).stream()
                .map(b -> toResponse(b, spentByCategoryId.getOrDefault(b.getCategory().getId(), BigDecimal.ZERO)))
                .toList();
    }

    @Transactional
    public BudgetResponse upsert(BudgetRequest req) {
        Long companyId = TenantSecurityService.requireCompanyId();
        Company company = companyRepo.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        Category category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", req.categoryId()));
        verifyCategoryVisible(category, companyId);

        AdminUser actor = SecurityUtils.getCurrentUser();

        // Per-tenant uniqueness: (category, company). Two companies can both
        // own a budget for "Food".
        return budgetRepo.findByCategoryIdAndCompanyId(req.categoryId(), companyId)
                .map(existing -> updateExisting(existing, req, actor, companyId))
                .orElseGet(() -> createNew(category, company, req, actor, companyId));
    }

    private BudgetResponse createNew(Category category, Company company, BudgetRequest req,
                                     AdminUser actor, Long companyId) {
        Budget budget = Budget.builder()
                .category(category)
                .monthlyLimit(req.monthlyLimit())
                .createdBy(actor)
                .company(company)
                .build();

        Budget saved = budgetRepo.save(budget);

        auditLog.log(actor, Action.CREATE, ENTITY_TYPE, saved.getId(),
                null, snapshot(saved));

        return toResponse(saved, currentMonthSpend(saved.getCategory().getId(), companyId));
    }

    private BudgetResponse updateExisting(Budget existing, BudgetRequest req,
                                          AdminUser actor, Long companyId) {
        // Composite uniqueness already covers tenant isolation, but a paranoid
        // double-check costs nothing and traps any future regression.
        TenantSecurityService.verifyOwnership(existing.getCompany().getId(),
                ENTITY_TYPE, existing.getId());

        Map<String, Object> oldValue = snapshot(existing);

        existing.setMonthlyLimit(req.monthlyLimit());
        Budget saved = budgetRepo.save(existing);

        auditLog.log(actor, Action.UPDATE, ENTITY_TYPE, saved.getId(),
                oldValue, snapshot(saved));

        return toResponse(saved, currentMonthSpend(saved.getCategory().getId(), companyId));
    }

    private BigDecimal currentMonthSpend(Long categoryId, Long companyId) {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        for (Object[] row : expenseRepo.spentPerCategoryBetween(monthStart, today, companyId)) {
            if (categoryId.equals(row[0])) return (BigDecimal) row[1];
        }
        return BigDecimal.ZERO;
    }

    private void verifyCategoryVisible(Category category, Long tenantCompanyId) {
        Company owner = category.getCompany();
        if (owner == null) return;                          // global default
        if (owner.getId().equals(tenantCompanyId)) return;  // own custom
        throw new ResourceNotFoundException("Category", category.getId());
    }

    private BudgetResponse toResponse(Budget b, BigDecimal spent) {
        BigDecimal limit     = b.getMonthlyLimit();
        BigDecimal remaining = limit.subtract(spent);

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
        m.put("companyId",     b.getCompany().getId());
        return m;
    }
}

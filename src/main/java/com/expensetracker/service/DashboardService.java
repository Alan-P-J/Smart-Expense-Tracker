package com.expensetracker.service;

import com.expensetracker.dto.response.CategorySpendResponse;
import com.expensetracker.dto.response.DashboardSummaryResponse;
import com.expensetracker.dto.response.RecentExpenseResponse;
import com.expensetracker.dto.response.TrendResponse;
import com.expensetracker.dto.response.TrendResponse.MonthlyTotal;
import com.expensetracker.entity.Budget;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.security.TenantSecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Every read is scoped to {@link TenantSecurityService#currentCompanyIdOrNull()}.
 * SUPER_ADMIN (null companyId) sees cross-tenant aggregates — a sensible
 * top-level overview without an explicit company switch.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final BigDecimal ALERT_THRESHOLD_PCT = new BigDecimal("80");

    private final ExpenseRepository expenseRepo;
    private final BudgetRepository budgetRepo;

    public DashboardSummaryResponse getSummary() {
        LocalDate today = LocalDate.now();
        return getSummary(today.withDayOfMonth(1), today);
    }

    /**
     * Totals scoped to the (from, to) window. Budget-alert count is
     * intentionally always anchored to the CURRENT calendar month — alerts
     * are forward-looking ("you're 80 % through this month's budget"), so
     * they shouldn't change just because the caller asked for a 7-day view.
     */
    public DashboardSummaryResponse getSummary(LocalDate from, LocalDate to) {
        Long companyId = TenantSecurityService.currentCompanyIdOrNull();

        BigDecimal totalAmount = expenseRepo.sumAmountBetween(from, to, companyId);
        long totalCount        = expenseRepo.countBetween(from, to, companyId);

        List<Object[]> byCategory = expenseRepo.sumByCategoryBetween(from, to, companyId);
        String topName = null;
        BigDecimal topAmount = null;
        if (!byCategory.isEmpty()) {
            Object[] row = byCategory.get(0);
            topName   = (String) row[1];
            topAmount = (BigDecimal) row[3];
        }

        LocalDate today = LocalDate.now();
        long alertCount = countBudgetAlerts(today.withDayOfMonth(1), today, companyId);

        return new DashboardSummaryResponse(
                totalAmount == null ? BigDecimal.ZERO : totalAmount,
                totalCount,
                topName,
                topAmount,
                alertCount
        );
    }

    public TrendResponse getTrends() {
        LocalDate today = LocalDate.now();
        LocalDate since = today.minusMonths(5).withDayOfMonth(1);
        return getTrends(since, today);
    }

    public TrendResponse getTrends(LocalDate from, LocalDate to) {
        Long companyId = TenantSecurityService.currentCompanyIdOrNull();
        List<MonthlyTotal> months = expenseRepo.monthlyTotalsBetween(from, to, companyId).stream()
                .map(row -> new MonthlyTotal((String) row[0], (BigDecimal) row[1]))
                .toList();

        return new TrendResponse(months);
    }

    public List<CategorySpendResponse> getByCategory() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        return getByCategory(monthStart, today);
    }

    public List<CategorySpendResponse> getByCategory(LocalDate from, LocalDate to) {
        Long companyId = TenantSecurityService.currentCompanyIdOrNull();
        return expenseRepo.sumByCategoryBetween(from, to, companyId).stream()
                .map(row -> new CategorySpendResponse(
                        (Long) row[0],
                        (String) row[1],
                        (String) row[2],
                        (BigDecimal) row[3]))
                .toList();
    }

    public List<RecentExpenseResponse> getRecent() {
        Long companyId = TenantSecurityService.currentCompanyIdOrNull();
        return expenseRepo.findRecent(companyId, PageRequest.of(0, 5)).stream()
                .map(RecentExpenseResponse::from)
                .toList();
    }

    private long countBudgetAlerts(LocalDate monthStart, LocalDate today, Long companyId) {
        List<Budget> budgets = budgetRepo.findAllForCompany(companyId);
        if (budgets.isEmpty()) return 0;

        Map<Long, BigDecimal> spentByCategory = new HashMap<>();
        for (Object[] row : expenseRepo.spentPerCategoryBetween(monthStart, today, companyId)) {
            spentByCategory.put((Long) row[0], (BigDecimal) row[1]);
        }

        long count = 0;
        for (Budget b : budgets) {
            BigDecimal spent = spentByCategory.getOrDefault(b.getCategory().getId(), BigDecimal.ZERO);
            BigDecimal pct = spent.multiply(BigDecimal.valueOf(100))
                    .divide(b.getMonthlyLimit(), 2, RoundingMode.HALF_UP);
            if (pct.compareTo(ALERT_THRESHOLD_PCT) >= 0) count++;
        }
        return count;
    }
}

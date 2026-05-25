package com.expensetracker.service;

import com.expensetracker.dto.response.CategorySpendResponse;
import com.expensetracker.dto.response.DashboardSummaryResponse;
import com.expensetracker.dto.response.RecentExpenseResponse;
import com.expensetracker.dto.response.TrendResponse;
import com.expensetracker.dto.response.TrendResponse.MonthlyTotal;
import com.expensetracker.entity.Budget;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.ExpenseRepository;
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
@Transactional(readOnly = true)
public class DashboardService {

    private static final BigDecimal ALERT_THRESHOLD_PCT = new BigDecimal("80");

    private final ExpenseRepository expenseRepo;
    private final BudgetRepository budgetRepo;

    public DashboardSummaryResponse getSummary() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        BigDecimal totalAmount = expenseRepo.sumAmountBetween(monthStart, today);
        long totalCount        = expenseRepo.countBetween(monthStart, today);

        // sumByCategoryBetween already ORDER BY total DESC — first row is top.
        List<Object[]> byCategory = expenseRepo.sumByCategoryBetween(monthStart, today);
        String topName = null;
        BigDecimal topAmount = null;
        if (!byCategory.isEmpty()) {
            Object[] row = byCategory.get(0);
            topName   = (String) row[1];
            topAmount = (BigDecimal) row[3];
        }

        long alertCount = countBudgetAlerts(monthStart, today);

        return new DashboardSummaryResponse(
                totalAmount == null ? BigDecimal.ZERO : totalAmount,
                totalCount,
                topName,
                topAmount,
                alertCount
        );
    }

    public TrendResponse getTrends() {
        // Default: 6 months including current.
        LocalDate today = LocalDate.now();
        LocalDate since = today.minusMonths(5).withDayOfMonth(1);
        return getTrends(since, today);
    }

    public TrendResponse getTrends(LocalDate from, LocalDate to) {
        // Caller controls the window — used by the dashboard's period filter.
        // Both bounds are inclusive and aggregated at month granularity.
        List<MonthlyTotal> months = expenseRepo.monthlyTotalsBetween(from, to).stream()
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
        return expenseRepo.sumByCategoryBetween(from, to).stream()
                .map(row -> new CategorySpendResponse(
                        (Long) row[0],
                        (String) row[1],
                        (String) row[2],
                        (BigDecimal) row[3]))
                .toList();
    }

    public List<RecentExpenseResponse> getRecent() {
        return expenseRepo.findTop5ByOrderByExpenseDateDescCreatedAtDesc().stream()
                .map(RecentExpenseResponse::from)
                .toList();
    }

    private long countBudgetAlerts(LocalDate monthStart, LocalDate today) {
        List<Budget> budgets = budgetRepo.findAll();
        if (budgets.isEmpty()) return 0;

        Map<Long, BigDecimal> spentByCategory = new HashMap<>();
        for (Object[] row : expenseRepo.spentPerCategoryBetween(monthStart, today)) {
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

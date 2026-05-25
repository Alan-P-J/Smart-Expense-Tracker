package com.expensetracker.service;

import com.expensetracker.dto.response.DayOfWeekSpendResponse;
import com.expensetracker.dto.response.RecentExpenseResponse;
import com.expensetracker.dto.response.ReportSummaryResponse;
import com.expensetracker.entity.Expense;
import com.expensetracker.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportsService {

    private final ExpenseRepository expenseRepo;

    // Mon → Sun. Index 0 is unused — Postgres ISODOW is 1-based.
    private static final String[] WEEKDAY_SHORT = {
            "", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    };
    private static final String[] WEEKDAY_LONG = {
            "", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    };

    public ReportSummaryResponse getSummary(LocalDate from, LocalDate to) {
        BigDecimal totalAmount = expenseRepo.sumAmountBetween(from, to);
        if (totalAmount == null) totalAmount = BigDecimal.ZERO;
        long totalCount = expenseRepo.countBetween(from, to);

        // Days in window (inclusive). At least 1 to avoid divide-by-zero.
        long days = Math.max(ChronoUnit.DAYS.between(from, to) + 1, 1);
        BigDecimal avgPerDay = totalAmount.divide(
                BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
        BigDecimal avgPerExpense = totalCount == 0
                ? BigDecimal.ZERO
                : totalAmount.divide(BigDecimal.valueOf(totalCount), 2, RoundingMode.HALF_UP);

        RecentExpenseResponse largest = expenseRepo
                .findTopByAmountBetween(from, to, PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .map(RecentExpenseResponse::from)
                .orElse(null);

        // Most active day = weekday with the highest expense count (not amount).
        // Day-of-week stats sort by ISODOW (Mon..Sun) but here we pick the max-count row.
        String mostActiveDay = null;
        long bestCount = -1;
        for (Object[] row : expenseRepo.dayOfWeekStatsBetween(from, to)) {
            int idx = ((Number) row[0]).intValue();
            long count = ((Number) row[2]).longValue();
            if (count > bestCount && idx >= 1 && idx <= 7) {
                bestCount = count;
                mostActiveDay = WEEKDAY_LONG[idx];
            }
        }

        return new ReportSummaryResponse(
                totalAmount,
                totalCount,
                avgPerDay,
                avgPerExpense,
                largest,
                mostActiveDay
        );
    }

    public List<DayOfWeekSpendResponse> getDayOfWeek(LocalDate from, LocalDate to) {
        // Backfill missing weekdays with zero so the chart always has 7 bars.
        Map<Integer, Object[]> byIdx = new HashMap<>();
        for (Object[] row : expenseRepo.dayOfWeekStatsBetween(from, to)) {
            byIdx.put(((Number) row[0]).intValue(), row);
        }
        List<DayOfWeekSpendResponse> out = new ArrayList<>(7);
        for (int i = 1; i <= 7; i++) {
            Object[] row = byIdx.get(i);
            BigDecimal amount = row == null ? BigDecimal.ZERO : (BigDecimal) row[1];
            long count = row == null ? 0L : ((Number) row[2]).longValue();
            out.add(new DayOfWeekSpendResponse(WEEKDAY_SHORT[i], i, amount, count));
        }
        return out;
    }

    public List<RecentExpenseResponse> getTopExpenses(LocalDate from, LocalDate to, int limit) {
        // Clamp the limit so a hostile caller can't ask for the whole table.
        int safeLimit = Math.max(1, Math.min(limit, 100));
        Pageable page = PageRequest.of(0, safeLimit);
        List<Expense> top = expenseRepo.findTopByAmountBetween(from, to, page);
        return top.stream().map(RecentExpenseResponse::from).toList();
    }
}

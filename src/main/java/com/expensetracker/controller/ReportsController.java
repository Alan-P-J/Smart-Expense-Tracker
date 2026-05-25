package com.expensetracker.controller;

import com.expensetracker.dto.response.DayOfWeekSpendResponse;
import com.expensetracker.dto.response.RecentExpenseResponse;
import com.expensetracker.dto.response.ReportSummaryResponse;
import com.expensetracker.service.ReportsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Reports", description = "Aggregated spending analytics in a custom date window")
public class ReportsController {

    private final ReportsService service;

    @GetMapping("/summary")
    @Operation(summary = "Aggregated totals, averages, largest expense and most-active weekday")
    public ResponseEntity<ReportSummaryResponse> summary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getSummary(from, to));
    }

    @GetMapping("/by-day-of-week")
    @Operation(summary = "Spend + count grouped by weekday (Mon→Sun, always 7 rows)")
    public ResponseEntity<List<DayOfWeekSpendResponse>> byDayOfWeek(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getDayOfWeek(from, to));
    }

    @GetMapping("/top-expenses")
    @Operation(summary = "Highest individual expenses in the window, sorted by amount DESC")
    public ResponseEntity<List<RecentExpenseResponse>> topExpenses(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(service.getTopExpenses(from, to, limit));
    }
}

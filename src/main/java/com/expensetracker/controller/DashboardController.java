package com.expensetracker.controller;

import com.expensetracker.dto.response.CategorySpendResponse;
import com.expensetracker.dto.response.DashboardSummaryResponse;
import com.expensetracker.dto.response.RecentExpenseResponse;
import com.expensetracker.dto.response.TrendResponse;
import com.expensetracker.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard")
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/summary")
    @Operation(summary = "Current-month totals, top category, and budget-alert count")
    public ResponseEntity<DashboardSummaryResponse> summary() {
        return ResponseEntity.ok(service.getSummary());
    }

    @GetMapping("/trends")
    @Operation(summary = "Monthly totals between from/to (defaults to last 6 months when omitted)")
    public ResponseEntity<TrendResponse> trends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from != null && to != null) {
            return ResponseEntity.ok(service.getTrends(from, to));
        }
        return ResponseEntity.ok(service.getTrends());
    }

    @GetMapping("/by-category")
    @Operation(summary = "Spend grouped by category in from/to window (defaults to current month)")
    public ResponseEntity<List<CategorySpendResponse>> byCategory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from != null && to != null) {
            return ResponseEntity.ok(service.getByCategory(from, to));
        }
        return ResponseEntity.ok(service.getByCategory());
    }

    @GetMapping("/recent")
    @Operation(summary = "5 most recent expenses")
    public ResponseEntity<List<RecentExpenseResponse>> recent() {
        return ResponseEntity.ok(service.getRecent());
    }
}

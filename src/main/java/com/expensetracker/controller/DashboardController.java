package com.expensetracker.controller;

import com.expensetracker.dto.response.CategorySpendResponse;
import com.expensetracker.dto.response.DashboardSummaryResponse;
import com.expensetracker.dto.response.RecentExpenseResponse;
import com.expensetracker.dto.response.TrendResponse;
import com.expensetracker.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    @Operation(summary = "Monthly totals for the last 6 months (including current)")
    public ResponseEntity<TrendResponse> trends() {
        return ResponseEntity.ok(service.getTrends());
    }

    @GetMapping("/by-category")
    @Operation(summary = "Current-month spend grouped by category")
    public ResponseEntity<List<CategorySpendResponse>> byCategory() {
        return ResponseEntity.ok(service.getByCategory());
    }

    @GetMapping("/recent")
    @Operation(summary = "5 most recent expenses")
    public ResponseEntity<List<RecentExpenseResponse>> recent() {
        return ResponseEntity.ok(service.getRecent());
    }
}

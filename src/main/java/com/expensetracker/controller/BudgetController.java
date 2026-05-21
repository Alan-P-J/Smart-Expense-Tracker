package com.expensetracker.controller;

import com.expensetracker.dto.request.BudgetRequest;
import com.expensetracker.dto.response.BudgetResponse;
import com.expensetracker.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Per-category monthly budgets with live progress")
public class BudgetController {

    private final BudgetService service;

    @GetMapping
    @Operation(summary = "List all budgets with spent / remaining / percentageUsed for the current month")
    public ResponseEntity<List<BudgetResponse>> list() {
        return ResponseEntity.ok(service.listWithProgress());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Create or update the monthly budget for a category (one budget per category)")
    public ResponseEntity<BudgetResponse> upsert(@Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(service.upsert(request));
    }
}

package com.expensetracker.controller;

import com.expensetracker.dto.request.ExpenseRequest;
import com.expensetracker.dto.response.ExpenseResponse;
import com.expensetracker.service.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Validated
@Tag(name = "Expenses", description = "Expense CRUD with filtering. Admin-only writes.")
public class ExpenseController {

    private final ExpenseService service;

    @GetMapping
    @Operation(summary = "List expenses, filtered by category / date range / search.")
    public ResponseEntity<Page<ExpenseResponse>> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0")  @Min(0)            int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100)  int size) {

        Sort sort = Sort.by(Sort.Direction.DESC, "expenseDate").and(Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(
                service.list(categoryId, startDate, endDate, search, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single expense by id")
    public ResponseEntity<ExpenseResponse> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Create a new expense")
    public ResponseEntity<ExpenseResponse> create(@Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.status(201).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Update an expense")
    public ResponseEntity<ExpenseResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Delete an expense")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

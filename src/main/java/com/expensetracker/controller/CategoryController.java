package com.expensetracker.controller;

import com.expensetracker.dto.request.CategoryRequest;
import com.expensetracker.dto.response.CategoryResponse;
import com.expensetracker.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Expense categories. Admin-only writes, all-role reads.")
public class CategoryController {

    private final CategoryService service;

    @GetMapping
    @Operation(summary = "List all categories (read by any authenticated user)")
    public ResponseEntity<List<CategoryResponse>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Create a new category")
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(201).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Update a category")
    public ResponseEntity<CategoryResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Delete a category. 409 if default or in-use by an expense.")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

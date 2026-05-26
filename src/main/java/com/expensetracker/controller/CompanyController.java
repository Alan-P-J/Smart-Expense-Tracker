package com.expensetracker.controller;

import com.expensetracker.dto.request.CreateCompanyRequest;
import com.expensetracker.dto.request.CreateCompanyUserRequest;
import com.expensetracker.dto.response.CompanyResponse;
import com.expensetracker.dto.response.CompanyStatsResponse;
import com.expensetracker.dto.response.UserResponse;
import com.expensetracker.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Cross-tenant company management. Every endpoint is SUPER_ADMIN only —
 * company admins manage their own users via {@code /api/users} instead.
 */
@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('SUPER_ADMIN')")
@Tag(name = "Companies", description = "SUPER_ADMIN-only cross-tenant management")
public class CompanyController {

    private final CompanyService service;

    @GetMapping
    @Operation(summary = "List all companies with user counts")
    public ResponseEntity<List<CompanyResponse>> list() {
        return ResponseEntity.ok(service.listAll());
    }

    @PostMapping
    @Operation(summary = "Create a new company")
    public ResponseEntity<CompanyResponse> create(@Valid @RequestBody CreateCompanyRequest request) {
        return ResponseEntity.status(201).body(service.create(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one company with usage stats")
    public ResponseEntity<CompanyStatsResponse> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(service.getStats(id));
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "Mark a company as inactive (logical delete)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/users")
    @Operation(summary = "Create a new user inside the given company")
    public ResponseEntity<UserResponse> addUser(@PathVariable Long id,
                                                @Valid @RequestBody CreateCompanyUserRequest request) {
        return ResponseEntity.status(201).body(service.addUser(id, request));
    }

    @GetMapping("/{id}/users")
    @Operation(summary = "List the users in a company")
    public ResponseEntity<List<UserResponse>> listUsers(@PathVariable Long id) {
        return ResponseEntity.ok(service.listUsers(id));
    }
}

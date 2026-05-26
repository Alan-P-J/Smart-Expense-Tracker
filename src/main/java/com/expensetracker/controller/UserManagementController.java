package com.expensetracker.controller;

import com.expensetracker.dto.request.CreateUserRequest;
import com.expensetracker.dto.response.UserResponse;
import com.expensetracker.service.UserManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Validated
@Tag(name = "Users", description = "Admin-only user lifecycle endpoints")
public class UserManagementController {

    private final UserManagementService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "List all admin users")
    public ResponseEntity<List<UserResponse>> list() {
        return ResponseEntity.ok(service.listUsers());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Create a new admin user (defaults to VIEWER role)")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(201).body(service.createUser(request));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Change a user's role (ADMIN or VIEWER). Cannot target self.")
    public ResponseEntity<UserResponse> changeRole(@PathVariable Long id,
                                                   @RequestBody Map<String, @NotBlank String> body) {
        return ResponseEntity.ok(service.changeRole(id, body.get("role")));
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Deactivate a user and revoke their refresh tokens. Cannot target self.")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }
}

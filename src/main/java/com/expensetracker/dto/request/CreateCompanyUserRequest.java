package com.expensetracker.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * SUPER_ADMIN endpoint payload for creating a user inside a specific company.
 * The {@code companyId} comes from the path — never trusted from the body.
 *
 * Role values: {@code ADMIN} (company admin) or {@code VIEWER}. SUPER_ADMIN
 * cannot be assigned through this endpoint; that role is bootstrap-only.
 */
public record CreateCompanyUserRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 100) String fullName,
        @NotBlank String role
) {}

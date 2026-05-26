package com.expensetracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCompanyRequest(
        @NotBlank @Size(max = 255) String name,
        // URL-safe identifier: lowercase ASCII, digits, hyphens. Used in
        // links and lookups, so the format is locked down.
        @NotBlank @Pattern(regexp = "^[a-z0-9-]+$", message = "slug must contain only lowercase letters, digits, and hyphens")
        @Size(max = 100) String slug,
        @Size(max = 500) String logoUrl
) {}

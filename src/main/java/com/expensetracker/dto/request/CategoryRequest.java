package com.expensetracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank @Size(max = 100)
        String name,

        @NotBlank
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "colourHex must be a #RRGGBB hex code")
        String colourHex,

        @Size(max = 50)
        String iconName
) {}

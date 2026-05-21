package com.expensetracker.dto.response;

import com.expensetracker.entity.Category;

import java.time.OffsetDateTime;

public record CategoryResponse(
        Long id,
        String name,
        String colourHex,
        String iconName,
        boolean isDefault,
        OffsetDateTime createdAt
) {
    public static CategoryResponse from(Category c) {
        return new CategoryResponse(
                c.getId(),
                c.getName(),
                c.getColourHex(),
                c.getIconName(),
                c.isDefault(),
                c.getCreatedAt()
        );
    }
}

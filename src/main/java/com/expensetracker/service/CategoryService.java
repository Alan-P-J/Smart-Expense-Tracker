package com.expensetracker.service;

import com.expensetracker.dto.request.CategoryRequest;
import com.expensetracker.dto.response.CategoryResponse;
import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.AuditLog.Action;
import com.expensetracker.entity.Category;
import com.expensetracker.exception.ConflictException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private static final String ENTITY_TYPE = "Category";

    private final CategoryRepository categoryRepo;
    private final AuditLogService auditLog;

    @Transactional(readOnly = true)
    public List<CategoryResponse> listAll() {
        return categoryRepo.findAllByOrderByNameAsc().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        if (categoryRepo.existsByName(req.name())) {
            throw new ConflictException("Category already exists: " + req.name());
        }

        Category category = Category.builder()
                .name(req.name())
                .colourHex(req.colourHex())
                .iconName(req.iconName())
                .isDefault(false)   // only seeded categories are default
                .build();

        Category saved = categoryRepo.save(category);

        AdminUser actor = SecurityUtils.getCurrentUser();
        auditLog.log(actor, Action.CREATE, ENTITY_TYPE, saved.getId(),
                null, snapshot(saved));

        return CategoryResponse.from(saved);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        Category category = categoryRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_TYPE, id));

        Map<String, Object> oldValue = snapshot(category);

        // Name change must not collide with an existing category
        if (!category.getName().equals(req.name()) && categoryRepo.existsByName(req.name())) {
            throw new ConflictException("Category already exists: " + req.name());
        }

        category.setName(req.name());
        category.setColourHex(req.colourHex());
        category.setIconName(req.iconName());

        Category saved = categoryRepo.save(category);

        AdminUser actor = SecurityUtils.getCurrentUser();
        auditLog.log(actor, Action.UPDATE, ENTITY_TYPE, saved.getId(),
                oldValue, snapshot(saved));

        return CategoryResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Category category = categoryRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_TYPE, id));

        if (category.isDefault()) {
            throw new ConflictException("Default categories cannot be deleted");
        }
        if (categoryRepo.hasExpenses(id)) {
            throw new ConflictException("Category has expenses and cannot be deleted");
        }

        Map<String, Object> oldValue = snapshot(category);
        categoryRepo.delete(category);

        AdminUser actor = SecurityUtils.getCurrentUser();
        auditLog.log(actor, Action.DELETE, ENTITY_TYPE, id,
                oldValue, null);
    }

    private Map<String, Object> snapshot(Category c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",        c.getId());
        m.put("name",      c.getName());
        m.put("colourHex", c.getColourHex());
        m.put("iconName",  c.getIconName());
        m.put("isDefault", c.isDefault());
        return m;
    }
}

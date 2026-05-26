package com.expensetracker.service;

import com.expensetracker.dto.request.CategoryRequest;
import com.expensetracker.dto.response.CategoryResponse;
import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.AuditLog.Action;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Company;
import com.expensetracker.exception.ConflictException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.CompanyRepository;
import com.expensetracker.security.SecurityUtils;
import com.expensetracker.security.TenantSecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
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
    private final CompanyRepository companyRepo;
    private final AuditLogService auditLog;

    @Transactional(readOnly = true)
    public List<CategoryResponse> listAll() {
        Long companyId = TenantSecurityService.currentCompanyIdOrNull();
        return categoryRepo.findVisibleForCompany(companyId).stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        AdminUser actor = SecurityUtils.getCurrentUser();

        // SUPER_ADMIN creates a GLOBAL category (company_id = NULL, visible to
        // every tenant — same semantic as the seeded defaults). Company admins
        // create a tenant-scoped category that only their company sees.
        Company company;
        Long collisionScope;   // companyId used to check name collisions
        if (actor.isSuperAdmin()) {
            company = null;
            collisionScope = null;     // null → existsByNameForCompany checks globals only
        } else {
            Long companyId = TenantSecurityService.requireCompanyId();
            company = companyRepo.findById(companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));
            collisionScope = companyId;
        }

        // Collision check: super admin → among globals; company admin → globals + own customs.
        if (categoryRepo.existsByNameForCompany(req.name(), collisionScope)) {
            throw new ConflictException("Category already exists: " + req.name());
        }

        Category category = Category.builder()
                .name(req.name())
                .colourHex(req.colourHex())
                .iconName(req.iconName())
                .isDefault(false)   // only seeded categories are default
                .company(company)
                .build();

        Category saved = categoryRepo.save(category);

        auditLog.log(actor, Action.CREATE, ENTITY_TYPE, saved.getId(),
                null, snapshot(saved));

        return CategoryResponse.from(saved);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        Category category = categoryRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_TYPE, id));

        // Globals (company=null) can only be edited by SUPER_ADMIN, because a
        // tenant editing a global default would shift state for every other
        // tenant. verifyOwnership treats null owner as cross-tenant so we
        // need an explicit branch here.
        if (category.getCompany() == null) {
            ensureSuperAdmin();
        } else {
            TenantSecurityService.verifyOwnership(category.getCompany().getId(), ENTITY_TYPE, id);
        }

        Map<String, Object> oldValue = snapshot(category);

        // Name change must not collide with another category visible to this tenant.
        Long companyId = category.getCompany() == null
                ? null
                : category.getCompany().getId();
        if (!category.getName().equalsIgnoreCase(req.name())
                && categoryRepo.existsByNameForCompanyExcluding(req.name(), id, companyId)) {
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

        if (category.getCompany() == null) {
            ensureSuperAdmin();
        } else {
            TenantSecurityService.verifyOwnership(category.getCompany().getId(), ENTITY_TYPE, id);
        }

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

    private void ensureSuperAdmin() {
        if (!SecurityUtils.getCurrentUser().isSuperAdmin()) {
            throw new AccessDeniedException("Global categories can only be modified by SUPER_ADMIN");
        }
    }

    private Map<String, Object> snapshot(Category c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",        c.getId());
        m.put("name",      c.getName());
        m.put("colourHex", c.getColourHex());
        m.put("iconName",  c.getIconName());
        m.put("isDefault", c.isDefault());
        m.put("companyId", c.getCompany() == null ? null : c.getCompany().getId());
        return m;
    }
}

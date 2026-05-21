package com.expensetracker.service;

import com.expensetracker.dto.request.ExpenseRequest;
import com.expensetracker.dto.response.ExpenseResponse;
import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.AuditLog.Action;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.security.ExpenseSpecification;
import com.expensetracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private static final String ENTITY_TYPE = "Expense";

    private final ExpenseRepository expenseRepo;
    private final CategoryRepository categoryRepo;
    private final AuditLogService auditLog;

    @Transactional(readOnly = true)
    public Page<ExpenseResponse> list(Long categoryId,
                                      LocalDate startDate,
                                      LocalDate endDate,
                                      String search,
                                      Pageable pageable) {
        return expenseRepo
                .findAll(ExpenseSpecification.filter(categoryId, startDate, endDate, search), pageable)
                .map(ExpenseResponse::from);
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getById(Long id) {
        return ExpenseResponse.from(loadOrThrow(id));
    }

    @Transactional
    public ExpenseResponse create(ExpenseRequest req) {
        Category category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", req.categoryId()));

        AdminUser actor = SecurityUtils.getCurrentUser();

        Expense expense = Expense.builder()
                .title(req.title())
                .amount(req.amount())
                .expenseDate(req.expenseDate())
                .category(category)
                .description(req.description())
                .createdBy(actor)
                .build();

        Expense saved = expenseRepo.save(expense);

        auditLog.log(actor, Action.CREATE, ENTITY_TYPE, saved.getId(),
                null, snapshot(saved));

        return ExpenseResponse.from(saved);
    }

    @Transactional
    public ExpenseResponse update(Long id, ExpenseRequest req) {
        Expense expense = loadOrThrow(id);

        // Capture BEFORE mutating
        Map<String, Object> oldValue = snapshot(expense);

        if (!expense.getCategory().getId().equals(req.categoryId())) {
            Category category = categoryRepo.findById(req.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", req.categoryId()));
            expense.setCategory(category);
        }

        expense.setTitle(req.title());
        expense.setAmount(req.amount());
        expense.setExpenseDate(req.expenseDate());
        expense.setDescription(req.description());

        Expense saved = expenseRepo.save(expense);

        AdminUser actor = SecurityUtils.getCurrentUser();
        auditLog.log(actor, Action.UPDATE, ENTITY_TYPE, saved.getId(),
                oldValue, snapshot(saved));

        return ExpenseResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Expense expense = loadOrThrow(id);

        Map<String, Object> oldValue = snapshot(expense);

        expenseRepo.delete(expense);

        AdminUser actor = SecurityUtils.getCurrentUser();
        auditLog.log(actor, Action.DELETE, ENTITY_TYPE, id,
                oldValue, null);
    }

    private Expense loadOrThrow(Long id) {
        return expenseRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_TYPE, id));
    }

    private Map<String, Object> snapshot(Expense e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          e.getId());
        m.put("title",       e.getTitle());
        m.put("amount",      e.getAmount());
        m.put("expenseDate", e.getExpenseDate());
        m.put("categoryId",  e.getCategory().getId());
        m.put("description", e.getDescription());
        m.put("createdById", e.getCreatedBy().getId());
        return m;
    }
}

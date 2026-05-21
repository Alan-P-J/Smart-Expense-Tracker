package com.expensetracker.repository;

import com.expensetracker.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByName(String name);

    List<Category> findAllByOrderByNameAsc();

    // Used by CategoryService to enforce 409 before delete (Decision D07)
    @Query("SELECT COUNT(e) > 0 FROM Expense e WHERE e.category.id = :categoryId")
    boolean hasExpenses(Long categoryId);
}

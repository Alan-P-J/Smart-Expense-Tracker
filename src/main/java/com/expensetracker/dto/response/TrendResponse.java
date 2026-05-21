package com.expensetracker.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record TrendResponse(List<MonthlyTotal> months) {

    public record MonthlyTotal(String month, BigDecimal total) {}
}

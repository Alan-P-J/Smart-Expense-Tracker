package com.expensetracker.controller;

import com.expensetracker.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@Tag(name = "Export", description = "Streaming CSV and PDF exports")
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/csv")
    @Operation(summary = "Stream all expenses as CSV (any authenticated role)")
    public ResponseEntity<StreamingResponseBody> csv(HttpServletResponse response) {
        return ResponseEntity.ok(exportService.generateCsv(response));
    }

    @GetMapping("/pdf")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Stream a PDF report of the current month's expenses (admin only)")
    public ResponseEntity<StreamingResponseBody> pdf(HttpServletResponse response) {
        return ResponseEntity.ok(exportService.generatePdf(response));
    }
}

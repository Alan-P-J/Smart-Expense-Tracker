package com.expensetracker.service;

import com.expensetracker.entity.Expense;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.security.TenantSecurityService;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExportService {

    private static final int CSV_PAGE_SIZE = 500;
    private static final String CSV_HEADER = "id,title,amount,expenseDate,category,description,createdBy";
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("MMMM yyyy");
    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final ExpenseRepository expenseRepo;

    // Self-reference (lazy to break the circular bean wiring) so internal
    // calls to @Transactional methods go through the Spring proxy instead of
    // self-invoking `this.x(...)` — required because the streaming lambda
    // executes after the controller returns and the inner txn is the only
    // session covering the lazy associations on Expense.category/createdBy.
    @Autowired
    @Lazy
    private ExportService self;

    // ────────────────────────────────────────────────────────────
    // CSV
    // ────────────────────────────────────────────────────────────

    public StreamingResponseBody generateCsv(HttpServletResponse response,
                                             LocalDate from, LocalDate to) {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"" + csvFilename(from, to) + "\"");

        // Snapshot tenant before the response stream starts — the streaming
        // lambda runs after the request thread releases TenantContext.
        final Long companyId = TenantSecurityService.currentCompanyIdOrNull();

        return outputStream -> {
            try (BufferedWriter w = new BufferedWriter(
                    new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {

                w.write(CSV_HEADER);
                w.newLine();

                int pageNum = 0;
                Page<CsvRow> page;
                do {
                    page = self.fetchCsvPage(pageNum, CSV_PAGE_SIZE, from, to, companyId);
                    for (CsvRow row : page.getContent()) {
                        w.write(row.toCsvLine());
                        w.newLine();
                    }
                    w.flush();
                    pageNum++;
                } while (page.hasNext());
            }
        };
    }

    /**
     * Inside @Transactional so lazy {@code category} / {@code createdBy} resolve
     * during the {@code .map(...)} call. The DTO rows that leak out hold only
     * primitives + strings, so the streaming lambda never touches a JPA proxy.
     */
    @Transactional(readOnly = true)
    public Page<CsvRow> fetchCsvPage(int pageNum, int pageSize, LocalDate from, LocalDate to,
                                     Long companyId) {
        Sort sort = Sort.by(Sort.Direction.DESC, "expenseDate")
                .and(Sort.by(Sort.Direction.DESC, "createdAt"));
        PageRequest pageReq = PageRequest.of(pageNum, pageSize, sort);
        return expenseRepo
                .findAll(ExpenseExportSpec.forCompanyBetween(companyId, from, to), pageReq)
                .map(CsvRow::from);
    }

    private static String csvFilename(LocalDate from, LocalDate to) {
        if (from == null && to == null) return "expenses.csv";
        String start = from == null ? "start" : from.format(ISO_FMT);
        String end = to == null ? "end" : to.format(ISO_FMT);
        return "expenses-" + start + "_to_" + end + ".csv";
    }

    // ────────────────────────────────────────────────────────────
    // PDF (caller-supplied range, falls back to current month)
    // ────────────────────────────────────────────────────────────

    public StreamingResponseBody generatePdf(HttpServletResponse response,
                                             LocalDate from, LocalDate to) {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"" + pdfFilename(from, to) + "\"");

        LocalDate today = LocalDate.now();
        LocalDate start = from != null ? from : today.withDayOfMonth(1);
        LocalDate end = to != null ? to : today;
        Long companyId = TenantSecurityService.currentCompanyIdOrNull();
        PdfData data = self.loadPdfData(start, end, companyId);
        String periodLabel = pdfPeriodLabel(start, end);

        return outputStream -> {
            try (PdfWriter writer = new PdfWriter(outputStream);
                 PdfDocument pdfDoc = new PdfDocument(writer);
                 Document doc = new Document(pdfDoc)) {

                doc.add(new Paragraph("Expense Report — " + periodLabel)
                        .setBold().setFontSize(18));

                // Summary block
                Table summary = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                        .useAllAvailableWidth();
                summary.addCell(headerCell("Total Expenses"));
                summary.addCell(valueCell(String.valueOf(data.rows.size())));
                summary.addCell(headerCell("Total Amount"));
                summary.addCell(valueCell(data.totalAmount.toPlainString()));
                summary.addCell(headerCell("Top Category"));
                summary.addCell(valueCell(data.topCategory == null ? "—" : data.topCategory));
                doc.add(summary);

                doc.add(new Paragraph(" "));

                // Detail block
                Table detail = new Table(UnitValue.createPercentArray(new float[]{2, 4, 3, 2}))
                        .useAllAvailableWidth();
                detail.addHeaderCell(headerCell("Date"));
                detail.addHeaderCell(headerCell("Title"));
                detail.addHeaderCell(headerCell("Category"));
                detail.addHeaderCell(headerCell("Amount").setTextAlignment(TextAlignment.RIGHT));

                for (PdfRow row : data.rows) {
                    detail.addCell(valueCell(row.date.toString()));
                    detail.addCell(valueCell(row.title));
                    detail.addCell(valueCell(row.category));
                    detail.addCell(valueCell(row.amount.toPlainString())
                            .setTextAlignment(TextAlignment.RIGHT));
                }
                doc.add(detail);
            }
        };
    }

    @Transactional(readOnly = true)
    public PdfData loadPdfData(LocalDate start, LocalDate end, Long companyId) {
        List<Expense> expenses = expenseRepo
                .findAll(ExpenseExportSpec.forCompanyBetween(companyId, start, end),
                        Sort.by(Sort.Direction.DESC, "expenseDate"));

        BigDecimal total = BigDecimal.ZERO;
        Map<String, BigDecimal> byCategory = new HashMap<>();
        List<PdfRow> rows = new java.util.ArrayList<>(expenses.size());

        for (Expense e : expenses) {
            total = total.add(e.getAmount());
            byCategory.merge(e.getCategory().getName(), e.getAmount(), BigDecimal::add);
            rows.add(new PdfRow(e.getExpenseDate(), e.getTitle(),
                    e.getCategory().getName(), e.getAmount()));
        }

        String topCategory = byCategory.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        return new PdfData(rows, total, topCategory);
    }

    private static String pdfFilename(LocalDate from, LocalDate to) {
        if (from == null && to == null) return "expense-report.pdf";
        String start = from == null ? "start" : from.format(ISO_FMT);
        String end = to == null ? "end" : to.format(ISO_FMT);
        return "expense-report-" + start + "_to_" + end + ".pdf";
    }

    private static String pdfPeriodLabel(LocalDate start, LocalDate end) {
        boolean sameMonth = start.getYear() == end.getYear()
                && start.getMonth() == end.getMonth()
                && start.getDayOfMonth() == 1
                && end.equals(start.withDayOfMonth(start.lengthOfMonth()));
        if (sameMonth) return start.format(MONTH_FMT);
        return start.format(ISO_FMT) + " → " + end.format(ISO_FMT);
    }

    private Cell headerCell(String text) {
        return new Cell()
                .add(new Paragraph(text).setBold())
                .setBackgroundColor(ColorConstants.LIGHT_GRAY);
    }

    private Cell valueCell(String text) {
        return new Cell().add(new Paragraph(text == null ? "" : text));
    }

    // ────────────────────────────────────────────────────────────
    // Internal carriers (no JPA proxies leak past the txn boundary)
    // ────────────────────────────────────────────────────────────

    public record CsvRow(Long id, String title, BigDecimal amount, LocalDate expenseDate,
                         String category, String description, String createdBy) {

        public static CsvRow from(Expense e) {
            return new CsvRow(
                    e.getId(),
                    e.getTitle(),
                    e.getAmount(),
                    e.getExpenseDate(),
                    e.getCategory().getName(),
                    e.getDescription(),
                    e.getCreatedBy().getFullName()
            );
        }

        public String toCsvLine() {
            return new StringBuilder()
                    .append(id).append(',')
                    .append(escape(title)).append(',')
                    .append(amount.toPlainString()).append(',')
                    .append(expenseDate).append(',')
                    .append(escape(category)).append(',')
                    .append(escape(description)).append(',')
                    .append(escape(createdBy))
                    .toString();
        }

        /** RFC 4180 quoting: wrap in quotes if it contains comma/quote/newline. */
        private static String escape(String value) {
            if (value == null) return "";
            boolean needsQuote = value.indexOf(',') >= 0
                    || value.indexOf('"') >= 0
                    || value.indexOf('\n') >= 0
                    || value.indexOf('\r') >= 0;
            if (!needsQuote) return value;
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
    }

    public record PdfRow(LocalDate date, String title, String category, BigDecimal amount) {}

    public record PdfData(List<PdfRow> rows, BigDecimal totalAmount, String topCategory) {}

    /** Self-contained spec for exports: tenant scope + optional date range.
     *  Null companyId = no tenant filter (SUPER_ADMIN). Both date bounds are
     *  optional so callers can do "from only", "to only", or full range. */
    private static final class ExpenseExportSpec {
        static org.springframework.data.jpa.domain.Specification<Expense> forCompanyBetween(
                Long companyId, LocalDate start, LocalDate end) {
            return (root, q, cb) -> {
                java.util.List<jakarta.persistence.criteria.Predicate> ps = new java.util.ArrayList<>();
                if (companyId != null) {
                    ps.add(cb.equal(root.get("company").get("id"), companyId));
                }
                if (start != null) {
                    ps.add(cb.greaterThanOrEqualTo(root.get("expenseDate"), start));
                }
                if (end != null) {
                    ps.add(cb.lessThanOrEqualTo(root.get("expenseDate"), end));
                }
                return ps.isEmpty()
                        ? cb.conjunction()
                        : cb.and(ps.toArray(new jakarta.persistence.criteria.Predicate[0]));
            };
        }
    }
}

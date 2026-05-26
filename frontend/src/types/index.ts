// ────────────────────────────────────────────────────────────
// Backend DTO mirrors. Field-for-field with the Java records.
// Money fields are strings on the wire (Jackson serializes BigDecimal
// as a plain string by default with default-property-inclusion: non_null).
// ────────────────────────────────────────────────────────────

// ADMIN is the company-scoped admin (the "COMPANY_ADMIN" in the spec).
// SUPER_ADMIN spans every company and manages /companies.
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';

// ─── Auth ───────────────────────────────────────────────────
export interface AuthResponse {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  companyId: number | null;       // null for SUPER_ADMIN
  companyName: string | null;
  isSuperAdmin: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─── Users ──────────────────────────────────────────────────
export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  isSuperAdmin: boolean;
  companyId: number | null;
  companyName: string | null;
  createdAt: string; // ISO OffsetDateTime
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role?: Role;
}

// ─── Companies (SUPER_ADMIN only) ──────────────────────────
export interface CompanyResponse {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  userCount: number;
  createdAt: string;
}

export interface CompanyStatsResponse {
  companyId: number;
  name: string;
  slug: string;
  isActive: boolean;
  userCount: number;
  expenseCount: number;
  totalAmountThisMonth: string;
}

export interface CreateCompanyRequest {
  name: string;
  slug: string;       // lowercase, digits, hyphens
  logoUrl?: string;
}

export interface CreateCompanyUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'VIEWER';
}

// ─── Categories ─────────────────────────────────────────────
export interface CategoryResponse {
  id: number;
  name: string;
  colourHex: string;
  iconName?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CategoryRequest {
  name: string;
  colourHex: string;
  iconName?: string;
}

// ─── Expenses ───────────────────────────────────────────────
export interface ExpenseResponse {
  id: number;
  title: string;
  amount: string;          // BigDecimal as string
  expenseDate: string;     // ISO LocalDate yyyy-MM-dd
  categoryId: number;
  categoryName: string;
  categoryColourHex: string;
  description?: string;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRequest {
  title: string;
  amount: string;
  expenseDate: string;
  categoryId: number;
  description?: string;
}

export interface ExpenseListParams {
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  size?: number;
}

// ─── Budgets ────────────────────────────────────────────────
export interface BudgetResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryColourHex: string;
  monthlyLimit: string;
  spent: string;
  remaining: string;
  percentageUsed: number;  // double
  isOverBudget: boolean;
  isNearLimit: boolean;
}

export interface BudgetRequest {
  categoryId: number;
  monthlyLimit: string;
}

// ─── Dashboard ──────────────────────────────────────────────
export interface DashboardSummaryResponse {
  totalAmount: string;
  totalCount: number;
  topCategoryName: string | null;
  topCategoryAmount: string | null;
  alertCount: number;
}

export interface MonthlyTotal {
  month: string;           // "YYYY-MM"
  total: string;
}

export interface TrendResponse {
  months: MonthlyTotal[];
}

export interface CategorySpendResponse {
  categoryId: number;
  categoryName: string;
  categoryColourHex: string;
  total: string;
}

export interface RecentExpenseResponse {
  id: number;
  title: string;
  amount: string;
  expenseDate: string;
  categoryName: string;
  categoryColourHex: string;
}

// ─── Reports ────────────────────────────────────────────────
export interface ReportSummaryResponse {
  totalAmount: string;
  totalCount: number;
  avgPerDay: string;
  avgPerExpense: string;
  largestExpense: RecentExpenseResponse | null;
  mostActiveDay: string | null;
}

export interface DayOfWeekSpendResponse {
  day: string;        // "Mon"..."Sun"
  dayIndex: number;   // 1=Mon ... 7=Sun
  amount: string;
  count: number;
}

// ─── Audit ──────────────────────────────────────────────────
export interface AuditLogResponse {
  id: number;
  userId: number;
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: number;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

// ─── Spring Data Page<T> ────────────────────────────────────
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ─── Error envelope (matches GlobalExceptionHandler) ────────
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  details: Record<string, string> | null;
}

import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { AdminRoute } from './components/guards/AdminRoute';
import { SuperAdminRoute } from './components/guards/SuperAdminRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { LoginPage } from './pages/LoginPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CompaniesPage } from './pages/CompaniesPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="expenses"   element={<ExpensesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="budgets"    element={<BudgetsPage />} />
          <Route path="reports"    element={<ReportsPage />} />
          <Route path="profile"    element={<ProfilePage />} />
          <Route path="settings"   element={<SettingsPage />} />

          <Route element={<AdminRoute />}>
            <Route path="users"     element={<UsersPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
          </Route>

          <Route element={<SuperAdminRoute />}>
            <Route path="companies" element={<CompaniesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

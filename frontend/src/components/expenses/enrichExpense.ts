import type { ExpenseResponse } from '../../types';

export type ExpenseStatus = 'Approved' | 'Pending' | 'Rejected' | 'Draft';

export interface Submitter {
  name: string;
  initials: string;
  tint: string;
}

export interface EnrichedExpense {
  id: number;
  expenseCode: string;   // e.g. "EXP-1024"
  title: string;
  description: string;
  amount: number;
  expenseDate: string;   // YYYY-MM-DD
  date: Date;
  categoryId: number;
  categoryName: string;
  categoryColourHex: string;
  // ── client-side mocks (backend doesn't carry these yet) ──
  status: ExpenseStatus;
  project: string;
  submitter: Submitter;
  payment: string;
  hasReceipt: boolean;
}

const PROJECTS = ['Marketing Q2', 'Website Redesign', 'Mobile App', 'Operations', 'General'];
const PAYMENTS = ['Corporate Card', 'Reimbursable', 'UPI', 'Bank Transfer'];
const TINTS    = ['#5B5CF0', '#10B981', '#F59E0B', '#38BDF8', '#EC4899', '#8B5CF6'];

function initialsOf(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || (parts[0]?.[0] ?? '').toUpperCase();
}

function deriveStatus(id: number): ExpenseStatus {
  // Deterministic per-id mock — backend doesn't carry status yet.
  if (id % 11 === 0) return 'Rejected';
  if (id % 17 === 0) return 'Draft';
  if (id % 5 === 0) return 'Pending';
  return 'Approved';
}

export function enrichExpense(api: ExpenseResponse): EnrichedExpense {
  const i = api.id;
  const tint = TINTS[i % TINTS.length];
  return {
    id: api.id,
    expenseCode: 'EXP-' + String(1024 + i),
    title: api.title,
    description: api.description ?? '',
    amount: Number(api.amount),
    expenseDate: api.expenseDate,
    date: new Date(api.expenseDate),
    categoryId: api.categoryId,
    categoryName: api.categoryName,
    categoryColourHex: api.categoryColourHex,
    status: deriveStatus(i),
    project: PROJECTS[i % PROJECTS.length],
    submitter: { name: api.createdByName, initials: initialsOf(api.createdByName), tint },
    payment: PAYMENTS[i % PAYMENTS.length],
    hasReceipt: i % 3 !== 0,
  };
}

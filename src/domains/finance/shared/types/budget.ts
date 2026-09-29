/** Espejo del contrato de GET /api/v1/budgets. */
import type { BudgetStatus, Money } from './overview';

export interface BudgetPeriodInfo {
  id: string;
  year: number;
  month: number;
  /** 1 = días 1–15, 2 = día 16 al fin de mes. En modo mensual siempre 1. */
  sequence: number;
  startDate: string;
  endDate: string;
  daysLeft: number;
  isCurrent: boolean;
  closedAt: string | null;
}

export interface BudgetLine {
  id: string;
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  planned: Money;
  rollover: boolean;
  spent: Money;
  remaining: Money;
  percentUsed: number;
  status: BudgetStatus;
}

export interface UnbudgetedCategory {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  spent: Money;
}

export interface BudgetView {
  period: BudgetPeriodInfo;
  plan: { monthlySpendingBudget: Money; monthlySavingsTarget: Money; currencyCode: string };
  totals: {
    planned: Money;
    allocated: Money;
    unallocated: Money;
    spent: Money;
    /** Tope − gasto. Lo que queda si no pasara nada más. */
    remaining: Money;
    /** Recurrencias que vencen antes de que acabe el ciclo y aún no se cobran. */
    committed: Money;
    /** Lo realmente libre: tope − gastado − comprometido. */
    available: Money;
    percentUsed: number;
    status: BudgetStatus;
  };
  lines: BudgetLine[];
  unbudgeted: UnbudgetedCategory[];
  /** Lo que compone `totals.committed`. */
  upcoming: { id: string; name: string; amount: Money; date: string }[];
}

/** El ciclo que se está mirando. Sin valores = el vigente. */
export interface PeriodSelector {
  year?: number;
  month?: number;
  sequence?: number;
}

/** Categoría editable. `children` solo viene en las de primer nivel. */
export interface EditableCategory {
  id: string;
  name: string;
  type: 'EXPENSE' | 'INCOME' | 'SAVING' | 'INVESTMENT';
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isSystem: boolean;
  isActive: boolean;
  children: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    sortOrder: number;
    isSystem: boolean;
    isActive: boolean;
  }[];
}

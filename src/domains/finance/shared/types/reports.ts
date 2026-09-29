/** Espejo del contrato de /api/v1/finance/reports (Fase 10). */
import type { Money } from './overview';
import type { BudgetStatus } from './overview';

export interface FlowMonth {
  /** "2026-09". Se formatea con `monthLabel`. */
  label: string;
  /** El mes en curso va a medias: la pantalla tiene que decirlo. */
  isPartial: boolean;
  income: Money;
  expense: Money;
  saved: Money;
  /** Puede ser negativo, y ese es justo el dato que importa ver. */
  leftover: Money;
}

export interface CategoryTrendRow {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  /** Un importe por mes, en el orden de `categories.months`. */
  byMonth: Money[];
  total: Money;
  average: Money;
  /** Último mes cerrado contra el anterior. */
  deltaAmount: Money | null;
  deltaPercent: number | null;
}

export interface BudgetComplianceRow {
  label: string;
  year: number;
  month: number;
  sequence: number;
  startDate: string;
  endDate: string;
  planned: Money;
  spent: Money;
  percentUsed: number;
  status: BudgetStatus;
}

export interface MicroMonth {
  label: string;
  isPartial: boolean;
  total: Money;
  count: number;
  shareOfExpense: number;
}

export interface NetWorthMonth {
  label: string;
  isPartial: boolean;
  assets: Money;
  liabilities: Money;
  netWorth: Money;
  delta: Money | null;
}

export interface ReportsView {
  range: {
    from: string;
    to: string;
    /** Meses realmente devueltos: el histórico puede no llegar tan atrás. */
    months: number;
    requestedMonths: number;
    truncated: boolean;
    currencyCode: string;
  };
  flow: {
    months: FlowMonth[];
    /** Promedios de meses cerrados; null si todavía no cerró ninguno. */
    averages: { income: Money; expense: Money; saved: Money } | null;
  };
  categories: { months: string[]; rows: CategoryTrendRow[] };
  budget: { periods: BudgetComplianceRow[]; exceeded: number; closed: number };
  microExpenses: { months: MicroMonth[]; total: Money; count: number; shareOfExpense: number };
  netWorth: {
    months: NetWorthMonth[];
    change: { amount: Money; percent: number | null } | null;
  };
}

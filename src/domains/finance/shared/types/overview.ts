/** Espejo de la seccion `finance` de GET /api/v1/command-center. */
import type { PendingItem } from './recurring';

export type BudgetStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'ADJUSTMENT';

/** Los montos viajan como string: un number en JSON perderia precision. */
export type Money = string;

export interface CategorySpend {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  spent: Money;
  planned: Money | null;
  percentUsed: number | null;
  status: BudgetStatus | null;
}

export interface DashboardSummary {
  period: { label: string; sequence: number; startDate: string; endDate: string; daysLeft: number };
  plan: {
    monthlyIncome: Money;
    monthlySpendingBudget: Money;
    monthlySavingsTarget: Money;
    currencyCode: string;
  };
  cycle: {
    plannedAmount: Money;
    spent: Money;
    remaining: Money;
    /** Recurrencias que vencen antes de que acabe el ciclo y aún no se cobran. */
    committed: Money;
    /** Lo realmente libre: tope − gastado − comprometido. */
    available: Money;
    percentUsed: number;
    status: BudgetStatus;
    dailyAllowance: Money;
  };
  month: {
    spent: Money;
    income: Money;
    budget: Money;
    remaining: Money;
    percentUsed: number;
    status: BudgetStatus;
  };
  microExpenses: {
    total: Money;
    count: number;
    threshold: Money;
    breakdown: { name: string; amount: Money; color: string | null }[];
  };
  liquidity: {
    available: Money;
    savings: Money;
    debt: Money;
    /** Plusvalía de las inversiones, ya incluida en netWorth (Fase 11). */
    investments: Money;
    netWorth: Money;
  };
  emergencyFund: {
    name: string;
    current: Money;
    target: Money | null;
    percent: number;
    monthsCovered: number | null;
    monthsTarget: number | null;
  } | null;
  /**
   * Fase 9. El plan aparta un monto al mes: esto dice si de verdad se apartó.
   * No se descuenta del presupuesto del ciclo — el tope de gasto ya excluye el
   * ahorro, restarlo otra vez sería contarlo dos veces.
   */
  savings: {
    monthTarget: Money;
    monthSaved: Money;
    /** Lo guardado sin objetivo asignado, ya incluido en monthSaved. */
    unassigned: Money;
    remaining: Money;
    percent: number;
    progress: 'AHEAD' | 'ON_TRACK' | 'BEHIND' | 'NONE';
    totalSaved: Money;
    goals: {
      id: string;
      name: string;
      icon: string | null;
      color: string | null;
      current: Money;
      target: Money | null;
      percent: number;
      contributedThisMonth: Money;
      monthlyTarget: Money | null;
    }[];
  };
  categories: CategorySpend[];
  subscriptions: {
    monthlyTotal: Money;
    yearlyTotal: Money;
    count: number;
    upcoming: { name: string; amount: Money | null; nextRunDate: string; vendor: string | null }[];
  };
  /** Recurrencias vencidas esperando confirmación (Fase 7). */
  pending: PendingItem[];
  /** Tarjetas con su corte por pagar (Fase 8). */
  cards: {
    id: string;
    name: string;
    brand: string | null;
    last4: string | null;
    debt: Money;
    statementRemaining: Money;
    minimumPayment: Money | null;
    dueDate: string;
    daysUntilDue: number;
    isOverdue: boolean;
    creditUsedPercent: number;
    pendingInstallments: Money;
  }[];
  recentTransactions: {
    id: string;
    description: string | null;
    amount: Money;
    date: string;
    type: TransactionType;
    /** Entra dinero a la cuenta: un ingreso o un ajuste al alza. */
    isInflow: boolean;
    isMicroExpense: boolean;
    categoryName: string | null;
    categoryColor: string | null;
    categoryIcon: string | null;
    accountName: string | null;
  }[];
}

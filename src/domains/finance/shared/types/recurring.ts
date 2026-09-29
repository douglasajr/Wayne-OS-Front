/** Espejo del contrato de /api/v1/finance/recurring. */
import type { Money } from './overview';

export type RecurrenceKind = 'FIXED' | 'VARIABLE' | 'SUBSCRIPTION';

export type RecurrenceFrequency =
  | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';

export interface RecurringRule {
  id: string;
  kind: RecurrenceKind;
  name: string;
  /** En VARIABLE es un estimado; el real llega al confirmar. */
  amount: Money | null;
  currencyCode: string;
  transactionType: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  frequency: RecurrenceFrequency;
  interval: number;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  endDate: string | null;
  nextRunDate: string;
  lastRunDate: string | null;
  autoGenerate: boolean;
  isActive: boolean;
  vendor: string | null;
  plan: string | null;
  trialEndsAt: string | null;
  cancelAtDate: string | null;
  reminderDaysBefore: number | null;
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
  fromAccount: { id: string; name: string; type: string } | null;
  toAccount: { id: string; name: string; type: string } | null;
  /** Positivo = faltan días; negativo = lleva días de retraso. */
  daysUntilNext: number;
  overdueCount: number;
  isOverdue: boolean;
  /** Lo que cuesta al mes, normalizado desde su frecuencia. */
  monthlyEquivalent: Money;
}

export interface RecurringList {
  rules: RecurringRule[];
  totals: {
    monthlyTotal: Money;
    yearlyTotal: Money;
    count: number;
    overdue: number;
  };
}

/** Una ocurrencia vencida esperando confirmación. */
export interface PendingItem {
  ruleId: string;
  name: string;
  kind: RecurrenceKind;
  vendor: string | null;
  amount: Money | null;
  isEstimate: boolean;
  currencyCode: string;
  transactionType: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  dueDate: string;
  daysOverdue: number;
  overdueCount: number;
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
  account: { id: string; name: string } | null;
}

export interface CreateRulePayload {
  kind: RecurrenceKind;
  name: string;
  amount?: string;
  currencyCode?: string;
  transactionType?: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  categoryId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  frequency: RecurrenceFrequency;
  interval?: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: string;
  endDate?: string;
  autoGenerate?: boolean;
  vendor?: string;
  plan?: string;
  reminderDaysBefore?: number;
}

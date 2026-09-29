/** Espejo del contrato de /api/v1/finance/plan (Fase 12). */
import type { Money } from './overview';

export type PeriodMode = 'BIWEEKLY' | 'MONTHLY';

export interface FinancialPlan {
  id: string;
  effectiveFrom: string;
  expectedMonthlyIncome: Money;
  monthlySpendingBudget: Money;
  monthlySavingsTarget: Money;
  currencyCode: string;
  notes: string | null;
  /** Ingreso menos gasto menos ahorro: lo que no tiene destino declarado. */
  unassigned: Money;
}

export interface MeasurementSettings {
  baseCurrencyCode: string;
  periodMode: PeriodMode;
  microExpenseThreshold: Money;
  autoFlagMicroExpense: boolean;
  /** Cambio de modo agendado que aún no entra en vigor. */
  pendingPeriodMode: PeriodMode | null;
  pendingPeriodModeFrom: string | null;
}

export interface PlanSettings {
  plan: FinancialPlan;
  history: { id: string; effectiveFrom: string; effectiveTo: string; monthlySpendingBudget: Money }[];
  settings: MeasurementSettings;
  /** El ciclo vigente, para poder avisar si su tope no coincide con el plan. */
  currentCycle: {
    label: string;
    startDate: string;
    endDate: string;
    plannedAmount: Money;
    suggestedAmount: Money;
    matchesPlan: boolean;
  } | null;
}

export interface CorrectPlanPayload {
  expectedMonthlyIncome?: string;
  monthlySpendingBudget?: string;
  monthlySavingsTarget?: string;
  notes?: string | null;
}

export interface SchedulePlanPayload {
  expectedMonthlyIncome: string;
  monthlySpendingBudget: string;
  monthlySavingsTarget: string;
  effectiveFrom?: string;
  notes?: string;
}

export interface PreferencesPayload {
  microExpenseThreshold?: string;
  autoFlagMicroExpense?: boolean;
}

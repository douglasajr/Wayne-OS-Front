/** Espejo del contrato de /api/v1/finance/savings (Fase 9). */
import type { Money } from './overview';

export type SavingsGoalType = 'EMERGENCY_FUND' | 'GENERAL' | 'TARGET';

/**
 * El semáforo del ahorro va al revés que el del gasto: pasarse de la meta es
 * bueno. Por eso no reutiliza `BudgetStatus`.
 */
export type SavingsProgress = 'AHEAD' | 'ON_TRACK' | 'BEHIND' | 'NONE';

export interface SavingsGoal {
  id: string;
  type: SavingsGoalType;
  name: string;
  icon: string | null;
  color: string | null;
  priority: number;
  isActive: boolean;
  /** Cuenta donde vive el dinero. Sin ella no se puede aportar. */
  accountId: string | null;
  accountName: string | null;
  currencyCode: string;
  currentAmount: Money;
  /** Lo que ya estaba apartado antes de registrar el objetivo. */
  openingAmount: Money;
  targetAmount: Money | null;
  targetDate: string | null;
  remaining: Money | null;
  percent: number;
  achievedAt: string | null;
  /** Cuánto de la meta mensual de ahorro le toca a este objetivo. */
  monthlyTarget: Money | null;
  contributedThisMonth: Money;
  progress: SavingsProgress;
  monthsToTarget: number | null;
  coverageMonthsTarget: number | null;
  monthsCovered: number | null;
}

export interface SavingsAccount {
  id: string;
  name: string;
  currencyCode: string;
  balance: Money;
  /** Suma de los objetivos respaldados por esta cuenta. */
  allocated: Money;
  /** Capital invertido que vive en esta cuenta: tampoco está libre (Fase 12). */
  invested: Money;
  /** Lo que hay en la cuenta sin objetivo ni inversión asignada. */
  unallocated: Money;
}

export interface SavingsMonth {
  label: string;
  target: Money;
  saved: Money;
  toGoals: Money;
  unassigned: Money;
  /** Aportes netos a inversiones: invertir es ahorrar (Fase 11). */
  toInvestments: Money;
  remaining: Money;
  percent: number;
  progress: SavingsProgress;
  /** Suma de los aportes mensuales comprometidos, para cuadrar contra el plan. */
  allocatedToGoals: Money;
}

export interface SavingsOverview {
  month: SavingsMonth;
  totals: { saved: Money; target: Money; currencyCode: string };
  emergencyFund: SavingsGoal | null;
  goals: SavingsGoal[];
  accounts: SavingsAccount[];
  averageMonthlySpend: Money;
}

export interface CreateGoalPayload {
  type?: SavingsGoalType;
  name: string;
  accountId?: string;
  targetAmount?: string;
  targetDate?: string;
  /** Lo que ya tenías guardado antes de crear el objetivo. */
  openingAmount?: string;
  monthlyTarget?: string;
  coverageMonthsTarget?: number;
  priority?: number;
  icon?: string;
  color?: string;
}

export type UpdateGoalPayload = Partial<Omit<CreateGoalPayload, 'type'>>;

export interface MovementPayload {
  amount: string;
  date?: string;
  description?: string;
  notes?: string;
}

export interface RecalculateTargetPayload {
  months?: number;
  basis?: 'ACTUAL_SPEND' | 'PLAN_BUDGET';
}

export interface RecalculateTargetResult {
  goal: SavingsGoal;
  basis: 'ACTUAL_SPEND' | 'PLAN_BUDGET';
  monthlyCost: Money;
  months: number;
}

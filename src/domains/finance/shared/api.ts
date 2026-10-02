/**
 * Acceso a datos. Un solo lugar define las claves de cache, para que al
 * guardar un movimiento se refresquen a la vez la lista, los saldos y el panel.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/lib/api';
import { commandCenterKey, sectionOf, useCommandCenter } from '@/platform/command-center/api';
import type { CreditCard, InstallmentPlan } from '@/domains/finance/shared/types/cards';
import type { ReportsView } from '@/domains/finance/shared/types/reports';
import type {
  CorrectPlanPayload,
  PeriodMode,
  PlanSettings,
  PreferencesPayload,
  SchedulePlanPayload,
} from '@/domains/finance/shared/types/plan';
import type {
  CreateInvestmentPayload,
  Investment,
  InvestmentMovementPayload,
  Portfolio,
  UpdateInvestmentPayload,
  ValuationPayload,
} from '@/domains/finance/shared/types/investments';
import type {
  CreateGoalPayload,
  MovementPayload,
  RecalculateTargetPayload,
  RecalculateTargetResult,
  SavingsGoal,
  SavingsOverview,
  UpdateGoalPayload,
} from '@/domains/finance/shared/types/savings';
import type {
  CreateRulePayload,
  RecurrenceKind,
  RecurringList,
  RecurringRule,
} from '@/domains/finance/shared/types/recurring';
import type {
  Account,
  AccountsResponse,
  Money,
  CategoryNode,
  FrequentCategory,
  Transaction,
  TransactionListMeta,
} from '@/domains/finance/shared/types/domain';
import type { DashboardSummary } from '@/domains/finance/shared/types/overview';
import type { BudgetView, EditableCategory, PeriodSelector } from '@/domains/finance/shared/types/budget';

export const keys = {
  accounts: ['accounts'] as const,
  categories: ['categories'] as const,
  frequentCategories: ['categories', 'frequent'] as const,
  transactions: (filters: TransactionFilters) => ['transactions', filters] as const,
  budget: (selector: PeriodSelector) => ['budget', selector] as const,
};

/** "?year=2026&month=10&sequence=1". Vacio = el ciclo vigente. */
function periodQuery(selector: PeriodSelector): string {
  const params = new URLSearchParams();
  if (selector.year) params.set('year', String(selector.year));
  if (selector.month) params.set('month', String(selector.month));
  if (selector.sequence) params.set('sequence', String(selector.sequence));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * El panel de finanzas NO tiene endpoint propio: es la seccion `finance` del
 * Command Center. Se selecciona de esa consulta para que la pantalla principal
 * y el panel de registro rapido compartan una sola peticion y una sola cache,
 * en vez de pedir dos veces los mismos numeros.
 */
export function useFinanceOverview() {
  const query = useCommandCenter();
  const section = sectionOf<DashboardSummary>(query.data, 'finance');

  return {
    ...query,
    section,
    data: section?.status === 'ok' ? section.data : undefined,
  };
}

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: [...keys.accounts, { includeArchived }],
    queryFn: ({ signal }) =>
      api.get<AccountsResponse>(`/finance/accounts?includeArchived=${includeArchived}`, signal),
    staleTime: 30_000,
  });
}

export function useCategories(type?: 'EXPENSE' | 'INCOME') {
  return useQuery({
    queryKey: [...keys.categories, type ?? 'all'],
    queryFn: ({ signal }) => api.get<CategoryNode[]>(`/finance/categories${type ? `?type=${type}` : ''}`, signal),
    // El catálogo cambia poco; no vale la pena volver a pedirlo constantemente.
    staleTime: 10 * 60_000,
  });
}

/** El árbol completo, incluidas las ocultas: solo para la pantalla de ajustes. */
export function useEditableCategories() {
  return useQuery({
    queryKey: [...keys.categories, 'editable'],
    queryFn: ({ signal }) => api.get<EditableCategory[]>('/finance/categories?includeHidden=true', signal),
    staleTime: 60_000,
  });
}

export function useFrequentCategories() {
  return useQuery({
    queryKey: keys.frequentCategories,
    queryFn: ({ signal }) => api.get<FrequentCategory[]>('/finance/categories/frequent', signal),
    staleTime: 5 * 60_000,
  });
}

export interface TransactionFilters extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  type?: string;
  accountId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  isMicroExpense?: boolean;
  search?: string;
  excludeTransfers?: boolean;
}

function toQuery(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== '' && v !== false) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: keys.transactions(filters),
    queryFn: async ({ signal }) => {
      const response = await api.getWithMeta<Transaction[], TransactionListMeta>(
        `/finance/transactions${toQuery(filters)}`,
        signal,
      );
      return response;
    },
    staleTime: 15_000,
  });
}

/**
 * Tras escribir un movimiento hay que invalidar TODO lo que depende de él:
 * la lista, los saldos de las cuentas y el panel. Olvidar uno deja al usuario
 * viendo una cifra que ya no es cierta.
 */
function useInvalidateMoney() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['transactions'] });
    void qc.invalidateQueries({ queryKey: keys.accounts });
    void qc.invalidateQueries({ queryKey: commandCenterKey });
    void qc.invalidateQueries({ queryKey: keys.frequentCategories });
  };
}

export interface QuickExpensePayload {
  amount: string;
  categoryId: string;
  fromAccountId: string;
  description?: string;
  date?: string;
  paymentMethod?: string;
  isMicroExpense?: boolean;
}

export function useQuickExpense() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (payload: QuickExpensePayload) => api.post<Transaction>('/finance/transactions/quick', payload),
    onSuccess: invalidate,
  });
}

export function useCreateTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<Transaction>('/finance/transactions', payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Record<string, unknown>) =>
      api.patch<Transaction>(`/finance/transactions/${id}`, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/finance/transactions/${id}`),
    onSuccess: invalidate,
  });
}

export function useCreateAccount() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<Account>('/finance/accounts', payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAccount() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Record<string, unknown>) =>
      api.patch<Account>(`/finance/accounts/${id}`, payload),
    onSuccess: invalidate,
  });
}

/**
 * Archivar. El backend decide si borra de verdad (cuenta sin movimientos) o
 * solo archiva, y devuelve cuál de las dos cosas hizo para poder decírselo al
 * usuario sin adivinar.
 */
export function useArchiveAccount() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ deleted: boolean; archived: boolean; movements: number }>(`/finance/accounts/${id}`),
    onSuccess: invalidate,
  });
}

export function useUnarchiveAccount() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (id: string) => api.post<Account>(`/finance/accounts/${id}/unarchive`),
    onSuccess: invalidate,
  });
}

/**
 * Ajuste de saldo: se manda el saldo REAL (firmado: deuda en negativo) y el
 * backend registra la diferencia como un movimiento que no es gasto.
 */
export function useAdjustBalance() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; balance: string; date: string }) =>
      api.post<Transaction>(`/finance/accounts/${id}/adjust`, payload),
    onSuccess: invalidate,
  });
}

export interface ReconcileResult {
  results: {
    accountId: string;
    accountName: string;
    storedBalance: Money;
    computedBalance: Money;
    drift: Money;
    corrected: boolean;
  }[];
  withDrift: number;
  checked: number;
}

/**
 * Reconciliación. Por defecto `apply=false`: primero se enseña la diferencia y
 * el usuario decide. Corregir saldos sin avisar es justo lo que haría dudar de
 * las cifras del panel.
 */
export function useReconcileAccounts() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (apply: boolean) => api.post<ReconcileResult>(`/finance/accounts/reconcile?apply=${apply}`),
    onSuccess: (_data, apply) => {
      if (apply) invalidate();
    },
  });
}

// ---------------------------------------------------------------------------
// Presupuestos (Fase 5)
// ---------------------------------------------------------------------------

/**
 * El ciclo se crea en el backend si no existía, así que esta consulta nunca
 * devuelve "no hay presupuesto": devuelve el ciclo, heredado del anterior.
 */
export function useBudget(selector: PeriodSelector) {
  return useQuery({
    queryKey: keys.budget(selector),
    queryFn: ({ signal }) => api.get<BudgetView>(`/finance/budgets${periodQuery(selector)}`, signal),
    staleTime: 15_000,
  });
}

/**
 * Cambiar un límite mueve el semáforo del panel, así que se invalidan los dos.
 * Las tres mutaciones devuelven la vista completa del ciclo: el backend
 * recalcula repartido y sobrante, y el cliente no tiene que rehacer sumas de
 * dinero por su cuenta.
 */
function useInvalidateBudget() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['budget'] });
    void qc.invalidateQueries({ queryKey: commandCenterKey });
  };
}

export function useSetBudgetLine(selector: PeriodSelector) {
  const invalidate = useInvalidateBudget();
  return useMutation({
    mutationFn: (payload: { categoryId: string; plannedAmount: string; rollover?: boolean }) =>
      api.put<BudgetView>(`/finance/budgets/lines${periodQuery(selector)}`, payload),
    onSuccess: invalidate,
  });
}

export function useRemoveBudgetLine(selector: PeriodSelector) {
  const invalidate = useInvalidateBudget();
  return useMutation({
    mutationFn: (categoryId: string) =>
      api.delete<BudgetView>(`/finance/budgets/lines/${categoryId}${periodQuery(selector)}`),
    onSuccess: invalidate,
  });
}

export function useSetPeriodAmount(selector: PeriodSelector) {
  const invalidate = useInvalidateBudget();
  return useMutation({
    mutationFn: (plannedAmount: string) =>
      api.patch<BudgetView>(`/finance/budgets/period${periodQuery(selector)}`, { plannedAmount }),
    onSuccess: invalidate,
  });
}

// ---------------------------------------------------------------------------
// Categorías editables (Fase 5)
// ---------------------------------------------------------------------------

/**
 * Tocar una categoría afecta a todo lo que la nombra: los selectores de
 * registro, el panel y el presupuesto del ciclo.
 */
function useInvalidateCategories() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: keys.categories });
    void qc.invalidateQueries({ queryKey: ['budget'] });
    void qc.invalidateQueries({ queryKey: commandCenterKey });
  };
}

export interface CategoryPayload {
  name: string;
  parentId?: string;
  type?: 'EXPENSE' | 'INCOME' | 'SAVING' | 'INVESTMENT';
  icon?: string;
  color?: string;
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (payload: CategoryPayload) => api.post<EditableCategory>('/finance/categories', payload),
    onSuccess: invalidate,
  });
}

/** `null` en icono o color los limpia; `undefined` los deja como estaban. */
export interface UpdateCategoryPayload {
  name?: string;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean;
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateCategoryPayload) =>
      api.patch<EditableCategory>(`/finance/categories/${id}`, payload),
    onSuccess: invalidate,
  });
}

/** Baja lógica: el backend conserva los movimientos y lo reporta. */
export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string; transactionsKept: number; budgetLinesRemoved: number }>(
        `/finance/categories/${id}`,
      ),
    onSuccess: invalidate,
  });
}

export function useReorderCategories() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      api.patch<{ reordered: number }>('/finance/categories/reorder', { items }),
    onSuccess: invalidate,
  });
}

// ---------------------------------------------------------------------------
// Recurrencias y suscripciones (Fase 7)
// ---------------------------------------------------------------------------

export const recurringKey = ['finance', 'recurring'] as const;

/**
 * Tocar una recurrencia mueve más de lo que parece: confirmarla crea un
 * movimiento, que cambia saldos, gasto del ciclo y semáforo. Se invalida todo
 * el dinero, no solo la lista.
 */
function useInvalidateRecurring() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: recurringKey });
    void qc.invalidateQueries({ queryKey: ['transactions'] });
    void qc.invalidateQueries({ queryKey: keys.accounts });
    void qc.invalidateQueries({ queryKey: ['budget'] });
    void qc.invalidateQueries({ queryKey: commandCenterKey });
  };
}

export function useRecurring(filters: { kind?: RecurrenceKind; includeInactive?: boolean } = {}) {
  const query = new URLSearchParams();
  if (filters.kind) query.set('kind', filters.kind);
  if (filters.includeInactive) query.set('includeInactive', 'true');
  const qs = query.toString();

  return useQuery({
    queryKey: [...recurringKey, filters],
    queryFn: ({ signal }) => api.get<RecurringList>(`/finance/recurring${qs ? `?${qs}` : ''}`, signal),
    staleTime: 30_000,
  });
}

export function useCreateRule() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: (payload: CreateRulePayload) => api.post<RecurringRule>('/finance/recurring', payload),
    onSuccess: invalidate,
  });
}

export function useUpdateRule() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Record<string, unknown>) =>
      api.patch<RecurringRule>(`/finance/recurring/${id}`, payload),
    onSuccess: invalidate,
  });
}

export function useCancelRule() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: ({ id, at }: { id: string; at?: string }) =>
      api.post<RecurringRule>(`/finance/recurring/${id}/cancel`, at ? { at } : {}),
    onSuccess: invalidate,
  });
}

export function useResumeRule() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: (id: string) => api.post<RecurringRule>(`/finance/recurring/${id}/resume`),
    onSuccess: invalidate,
  });
}

/** Solo permitido si nunca generó movimientos; el backend lo decide. */
export function useDeleteRule() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string; deleted: boolean }>(`/finance/recurring/${id}`),
    onSuccess: invalidate,
  });
}

export interface ConfirmPayload {
  /** Obligatorio en las de monto variable. */
  amount?: string;
  date?: string;
  accountId?: string;
}

export function useConfirmPending() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & ConfirmPayload) =>
      api.post<{ materialized: boolean; nextRunDate: string }>(
        `/finance/recurring/${id}/confirm`,
        payload,
      ),
    onSuccess: invalidate,
  });
}

/** Saltar la ocurrencia sin registrar gasto: el mes que no se cobró. */
export function useSkipPending() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ skipped: string; nextRunDate: string }>(`/finance/recurring/${id}/skip`),
    onSuccess: invalidate,
  });
}

// ---------------------------------------------------------------------------
// Tarjetas de crédito (Fase 8)
// ---------------------------------------------------------------------------

export const cardsKey = ['finance', 'cards'] as const;

/**
 * Pagar o diferir mueve saldos y estados de cuenta, así que se invalida el
 * dinero entero. El presupuesto también: un pago NO es gasto, pero sí cambia
 * el saldo de la cuenta de donde sale.
 */
function useInvalidateCards() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: cardsKey });
    void qc.invalidateQueries({ queryKey: ['transactions'] });
    void qc.invalidateQueries({ queryKey: keys.accounts });
    void qc.invalidateQueries({ queryKey: ['budget'] });
    void qc.invalidateQueries({ queryKey: commandCenterKey });
  };
}

export function useCards() {
  return useQuery({
    queryKey: cardsKey,
    queryFn: ({ signal }) => api.get<CreditCard[]>('/finance/cards', signal),
    staleTime: 30_000,
  });
}

export interface PayCardPayload {
  amount: string;
  fromAccountId?: string;
  date?: string;
  notes?: string;
}

export function usePayCard() {
  const invalidate = useInvalidateCards();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & PayCardPayload) =>
      api.post<Transaction>(`/finance/cards/${id}/pay`, payload),
    onSuccess: invalidate,
  });
}

export interface CreateInstallmentPayload {
  transactionId: string;
  months: number;
  firstDueDate?: string;
}

export function useCreateInstallmentPlan() {
  const invalidate = useInvalidateCards();
  return useMutation({
    mutationFn: (payload: CreateInstallmentPayload) =>
      api.post<InstallmentPlan>('/finance/cards/installments', payload),
    onSuccess: invalidate,
  });
}

export function useCancelInstallmentPlan() {
  const invalidate = useInvalidateCards();
  return useMutation({
    mutationFn: (planId: string) =>
      api.delete<InstallmentPlan>(`/finance/cards/installments/${planId}`),
    onSuccess: invalidate,
  });
}

// ---------------------------------------------------------------------------
// Ahorro y fondo de emergencia (Fase 9)
// ---------------------------------------------------------------------------

export const savingsKey = ['finance', 'savings'] as const;

/**
 * Un aporte NO es gasto (regla 4), pero sí mueve saldos: sale de una cuenta y
 * entra a otra. Por eso se invalidan cuentas y movimientos, y el presupuesto
 * no: el tope del ciclo no se entera de que ahorré.
 */
function useInvalidateSavings() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: savingsKey });
    void qc.invalidateQueries({ queryKey: ['transactions'] });
    void qc.invalidateQueries({ queryKey: keys.accounts });
    void qc.invalidateQueries({ queryKey: commandCenterKey });
  };
}

export function useSavings() {
  return useQuery({
    queryKey: savingsKey,
    queryFn: ({ signal }) => api.get<SavingsOverview>('/finance/savings', signal),
    staleTime: 30_000,
  });
}

export function useCreateGoal() {
  const invalidate = useInvalidateSavings();
  return useMutation({
    mutationFn: (payload: CreateGoalPayload) => api.post<SavingsGoal>('/finance/savings', payload),
    onSuccess: invalidate,
  });
}

export function useUpdateGoal() {
  const invalidate = useInvalidateSavings();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateGoalPayload) =>
      api.patch<SavingsGoal>(`/finance/savings/${id}`, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveGoal() {
  const invalidate = useInvalidateSavings();
  return useMutation({
    mutationFn: (id: string) => api.post<{ id: string; archived: boolean }>(`/finance/savings/${id}/archive`, {}),
    onSuccess: invalidate,
  });
}

export function useContribute() {
  const invalidate = useInvalidateSavings();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; fromAccountId: string } & MovementPayload) =>
      api.post<Transaction>(`/finance/savings/${id}/contributions`, payload),
    onSuccess: invalidate,
  });
}

export function useWithdraw() {
  const invalidate = useInvalidateSavings();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; toAccountId: string } & MovementPayload) =>
      api.post<Transaction>(`/finance/savings/${id}/withdrawals`, payload),
    onSuccess: invalidate,
  });
}

/** La meta del fondo se mueve cuando el usuario lo pide, nunca sola (regla 18). */
export function useRecalculateEmergencyTarget() {
  const invalidate = useInvalidateSavings();
  return useMutation({
    mutationFn: (payload: RecalculateTargetPayload) =>
      api.post<RecalculateTargetResult>('/finance/savings/emergency-fund/target', payload),
    onSuccess: invalidate,
  });
}

// ---------------------------------------------------------------------------
// Reportes (Fase 10)
// ---------------------------------------------------------------------------

export const reportsKey = (months: number) => ['finance', 'reports', months] as const;

/**
 * Un solo endpoint para los cinco reportes: comparten rango y se miran juntos.
 * Los datos son históricos, así que se mantienen frescos más tiempo que el
 * panel: lo de agosto ya no va a cambiar.
 */
export function useReports(months: number) {
  return useQuery({
    queryKey: reportsKey(months),
    queryFn: ({ signal }) => api.get<ReportsView>(`/finance/reports?months=${months}`, signal),
    staleTime: 5 * 60_000,
  });
}

// ---------------------------------------------------------------------------
// Inversiones (Fase 11)
// ---------------------------------------------------------------------------

export const investmentsKey = ['finance', 'investments'] as const;

/**
 * Invertir no es gastar (regla 4), pero mueve saldos y cambia el patrimonio,
 * así que se invalidan cuentas, movimientos, el Command Center y los reportes.
 * El presupuesto no: el tope del ciclo no se entera de que invertí.
 */
function useInvalidateInvestments() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: investmentsKey });
    void qc.invalidateQueries({ queryKey: ['transactions'] });
    void qc.invalidateQueries({ queryKey: keys.accounts });
    void qc.invalidateQueries({ queryKey: savingsKey });
    void qc.invalidateQueries({ queryKey: ['finance', 'reports'] });
    void qc.invalidateQueries({ queryKey: commandCenterKey });
  };
}

export function useInvestments() {
  return useQuery({
    queryKey: investmentsKey,
    queryFn: ({ signal }) => api.get<Portfolio>('/finance/investments', signal),
    staleTime: 60_000,
  });
}

export function useCreateInvestment() {
  const invalidate = useInvalidateInvestments();
  return useMutation({
    mutationFn: (payload: CreateInvestmentPayload) =>
      api.post<Investment>('/finance/investments', payload),
    onSuccess: invalidate,
  });
}

export function useUpdateInvestment() {
  const invalidate = useInvalidateInvestments();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateInvestmentPayload) =>
      api.patch<Investment>(`/finance/investments/${id}`, payload),
    onSuccess: invalidate,
  });
}

export function useCloseInvestment() {
  const invalidate = useInvalidateInvestments();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ id: string; closed: boolean }>(`/finance/investments/${id}/close`, {}),
    onSuccess: invalidate,
  });
}

/** El valor se registra cuando lo miras: no se estima ni se actualiza solo. */
export function useRecordValuation() {
  const invalidate = useInvalidateInvestments();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & ValuationPayload) =>
      api.post<Investment>(`/finance/investments/${id}/valuations`, payload),
    onSuccess: invalidate,
  });
}

export function useInvestmentContribute() {
  const invalidate = useInvalidateInvestments();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; fromAccountId: string } & InvestmentMovementPayload) =>
      api.post<Transaction>(`/finance/investments/${id}/contributions`, payload),
    onSuccess: invalidate,
  });
}

export function useInvestmentWithdraw() {
  const invalidate = useInvalidateInvestments();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; toAccountId: string } & InvestmentMovementPayload) =>
      api.post<Transaction>(`/finance/investments/${id}/withdrawals`, payload),
    onSuccess: invalidate,
  });
}

// ---------------------------------------------------------------------------
// Plan financiero y ajustes de medición (Fase 12)
// ---------------------------------------------------------------------------

export const planKey = ['finance', 'plan'] as const;

/**
 * Cambiar el plan mueve TODO lo que se mide contra él: el panel, el
 * presupuesto, el ahorro del mes y los reportes. Se invalida en bloque.
 */
function useInvalidatePlan() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: planKey });
    void qc.invalidateQueries({ queryKey: ['budget'] });
    void qc.invalidateQueries({ queryKey: savingsKey });
    void qc.invalidateQueries({ queryKey: ['finance', 'reports'] });
    void qc.invalidateQueries({ queryKey: commandCenterKey });
  };
}

export function usePlanSettings() {
  return useQuery({
    queryKey: planKey,
    queryFn: ({ signal }) => api.get<PlanSettings>('/finance/plan', signal),
    staleTime: 60_000,
  });
}

/** Corregir el plan vigente: para errores de captura, sin crear versión. */
export function useCorrectPlan() {
  const invalidate = useInvalidatePlan();
  return useMutation({
    mutationFn: (payload: CorrectPlanPayload) => api.patch<PlanSettings>('/finance/plan', payload),
    onSuccess: invalidate,
  });
}

/** Cambio real: cierra el plan vigente y abre otro desde una fecha. */
export function useSchedulePlan() {
  const invalidate = useInvalidatePlan();
  return useMutation({
    mutationFn: (payload: SchedulePlanPayload) => api.post<PlanSettings>('/finance/plan', payload),
    onSuccess: invalidate,
  });
}

export function useApplyPlanToCycle() {
  const invalidate = useInvalidatePlan();
  return useMutation({
    mutationFn: () => api.post<PlanSettings>('/finance/plan/apply-to-cycle', {}),
    onSuccess: invalidate,
  });
}

export function useUpdatePreferences() {
  const invalidate = useInvalidatePlan();
  return useMutation({
    mutationFn: (payload: PreferencesPayload) =>
      api.patch<PlanSettings>('/finance/plan/preferences', payload),
    onSuccess: invalidate,
  });
}

/** El cambio de ciclo se agenda: nunca parte un mes por la mitad. */
export function useSchedulePeriodMode() {
  const invalidate = useInvalidatePlan();
  return useMutation({
    mutationFn: (periodMode: PeriodMode) =>
      api.post<PlanSettings>('/finance/plan/period-mode', { periodMode }),
    onSuccess: invalidate,
  });
}

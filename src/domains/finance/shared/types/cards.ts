/** Espejo del contrato de /api/v1/finance/cards. */
import type { Money } from './overview';

export interface InstallmentPlan {
  id: string;
  accountId: string;
  transactionId: string;
  description: string | null;
  purchaseDate: string;
  category: { name: string; icon: string | null; color: string | null } | null;
  totalAmount: Money;
  months: number;
  installmentAmount: Money;
  interestRateAnnual: Money | null;
  firstDueDate: string;
  billedCount: number;
  remainingCount: number;
  billedAmount: Money;
  remainingAmount: Money;
  nextDueDate: string | null;
  isFinished: boolean;
  cancelledAt: string | null;
}

export interface CardStatement {
  period: {
    start: string;
    cutoff: string;
    dueDate: string;
    daysUntilDue: number;
    isOverdue: boolean;
  };
  /** Deuda TOTAL al cierre del corte, incluida la diferida a cuotas. */
  closingBalance: Money;
  /** Parte de esa deuda que son cuotas aún sin facturar: no se debe todavía. */
  deferredNotYetBilled: Money;
  /** Lo que de verdad se exige este corte: total − diferido. */
  dueThisCycle: Money;
  paidSinceCutoff: Money;
  /** Lo que falta por pagar de ese corte. */
  remaining: Money;
  minimumPayment: Money | null;
  charges: Money;
  installments: Money;
}

export interface CreditCard {
  id: string;
  name: string;
  brand: string | null;
  last4: string | null;
  currencyCode: string;
  currentBalance: Money;
  /** La deuda en positivo, que es como la piensa cualquiera. */
  debt: Money;
  creditLimit: Money;
  availableCredit: Money;
  creditUsedPercent: number;
  cutoffDay: number;
  paymentDueDay: number;
  defaultPaymentAccountId: string | null;
  statement: CardStatement;
  /** Lo que se acumula en el corte nuevo: todavía no se debe. */
  currentCycle: { start: string; cutoff: string; charges: Money; daysToCutoff: number };
  installmentPlans: InstallmentPlan[];
  pendingInstallments: Money;
}

/** Espejo de los contratos del backend. Los montos viajan como string. */
export type Money = string;

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN';
/** ADJUSTMENT lo crea "Ajustar saldo", no el formulario de movimientos. */
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'ADJUSTMENT';
export type PaymentMethod = 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CHECK' | 'OTHER';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currencyCode: string;
  initialBalance: Money;
  currentBalance: Money;
  institution: string | null;
  color: string | null;
  icon: string | null;
  includeInNetWorth: boolean;
  isActive: boolean;
  archivedAt: string | null;
  isDebt: boolean;
  availableCredit: Money | null;
  creditUsedPercent: number | null;
  creditCardDetail: {
    creditLimit: Money;
    cutoffDay: number;
    paymentDueDay: number;
    brand: string | null;
    last4: string | null;
  } | null;
}

export interface AccountsResponse {
  accounts: Account[];
  totals: { assets: Money; liabilities: Money; netWorth: Money };
}

export interface CategoryNode {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  children: { id: string; name: string; icon: string | null; color: string | null }[];
}

export interface FrequentCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentName: string | null;
  uses: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: Money;
  toAmount: Money | null;
  currencyCode: string;
  amountBase: Money;
  date: string;
  description: string | null;
  notes: string | null;
  paymentMethod: PaymentMethod | null;
  isMicroExpense: boolean;
  categoryIcon: string | null;
  category: { id: string; name: string; color: string | null; icon: string | null } | null;
  fromAccount: { id: string; name: string; type: AccountType } | null;
  toAccount: { id: string; name: string; type: AccountType } | null;
  merchant: { id: string; name: string } | null;
  tags: { id: string; name: string; color: string | null }[];
}

export interface TransactionListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  totals: { expense: Money; income: Money; transfer: Money };
}

/** Etiquetas e iconos de los tipos de cuenta y metodos de pago. */
import type { AccountType, PaymentMethod } from '@/domains/finance/shared/types/domain';
import type { IconName } from '@/core/components/ui/Icon';

export const ACCOUNT_TYPE: Record<AccountType, { label: string; icon: IconName }> = {
  CHECKING: { label: 'Cuenta corriente', icon: 'landmark' },
  SAVINGS: { label: 'Cuenta de ahorro', icon: 'piggy' },
  CASH: { label: 'Efectivo', icon: 'banknote' },
  CREDIT_CARD: { label: 'Tarjeta de crédito', icon: 'card' },
  INVESTMENT: { label: 'Inversión', icon: 'chart' },
  LOAN: { label: 'Préstamo', icon: 'scale' },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  DEBIT_CARD: 'Tarjeta de débito',
  CREDIT_CARD: 'Tarjeta de crédito',
  BANK_TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  OTHER: 'Otro',
};

/**
 * Metodo de pago sugerido por el tipo de cuenta. El usuario puede cambiarlo,
 * pero acertar por defecto quita un campo del camino del registro rapido.
 */
export function defaultPaymentMethod(type: AccountType): PaymentMethod {
  if (type === 'CASH') return 'CASH';
  if (type === 'CREDIT_CARD') return 'CREDIT_CARD';
  return 'DEBIT_CARD';
}

/**
 * La cuenta que se ofrece primero al registrar un gasto: la ultima usada en
 * este navegador si sigue disponible; si no, la primera que no sea deuda.
 *
 * Se prefiere un activo porque pagar con tarjeta es la excepcion, no la norma,
 * y equivocarse ahi ensucia el saldo de una deuda.
 */
const LAST_ACCOUNT_KEY = 'my-wallet:last-account';

export function rememberAccount(id: string): void {
  try {
    localStorage.setItem(LAST_ACCOUNT_KEY, id);
  } catch {
    // Modo privado o almacenamiento lleno: es una comodidad, no un requisito.
  }
}

export function preferredAccountId(
  accounts: { id: string; isDebt: boolean; archivedAt: string | null }[],
): string {
  const usable = accounts.filter((a) => !a.archivedAt);
  if (usable.length === 0) return '';

  let last: string | null = null;
  try {
    last = localStorage.getItem(LAST_ACCOUNT_KEY);
  } catch {
    last = null;
  }

  if (last && usable.some((a) => a.id === last)) return last;
  return (usable.find((a) => !a.isDebt) ?? usable[0]!).id;
}

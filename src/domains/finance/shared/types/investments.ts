/** Espejo del contrato de /api/v1/finance/investments (Fase 11). */
import type { Money } from './overview';

export type InvestmentType =
  | 'STOCK'
  | 'ETF'
  | 'MUTUAL_FUND'
  | 'CRYPTO'
  | 'FIXED_INCOME'
  | 'REAL_ESTATE'
  | 'BUSINESS'
  | 'OTHER';

export interface Valuation {
  id: string;
  date: string;
  value: Money;
  currencyCode: string;
  exchangeRate: Money;
  /** Valor en moneda base: es el que suma el patrimonio. */
  valueBase: Money;
  notes: string | null;
}

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
  symbol: string | null;
  currencyCode: string;
  /** Sin cuenta detrás no admite aportes: su capital se edita en la posición. */
  accountId: string | null;
  accountName: string | null;
  investedAmount: Money;
  openingInvested: Money;
  currentValue: Money;
  gain: Money;
  /** Ganancia simple sobre el capital, NO rentabilidad ponderada por tiempo. */
  gainPercent: number;
  weight: number;
  quantity: Money | null;
  purchaseDate: string | null;
  isActive: boolean;
  notes: string | null;
  lastValuationDate: string | null;
  /** Días desde la última valuación: un valor viejo es un valor sospechoso. */
  staleDays: number | null;
  valuations: Valuation[];
}

export interface Portfolio {
  totals: {
    invested: Money;
    value: Money;
    gain: Money;
    gainPercent: number;
    currencyCode: string;
    count: number;
  };
  /**
   * Lo que la cartera aporta al patrimonio sin contarse dos veces: de las
   * posiciones con cuenta, solo la plusvalía (su saldo ya está contado); de
   * las que no tienen cuenta, el valor entero.
   */
  netWorthContribution: {
    unrealizedGain: Money;
    standaloneValue: Money;
    total: Money;
  };
  investments: Investment[];
  staleCount: number;
}

export interface CreateInvestmentPayload {
  type: InvestmentType;
  name: string;
  symbol?: string;
  currencyCode?: string;
  accountId?: string;
  openingInvested?: string;
  currentValue?: string;
  exchangeRate?: string;
  quantity?: string;
  purchaseDate?: string;
  notes?: string;
}

export type UpdateInvestmentPayload = Partial<
  Omit<CreateInvestmentPayload, 'type' | 'currentValue' | 'exchangeRate' | 'currencyCode'>
> & { isActive?: boolean };

export interface ValuationPayload {
  value: string;
  date?: string;
  exchangeRate?: string;
  notes?: string;
}

export interface InvestmentMovementPayload {
  amount: string;
  date?: string;
  description?: string;
  notes?: string;
}

/**
 * El semáforo del presupuesto, con la forma que pone el núcleo.
 *
 * Vive en el dominio porque «excedido» es un concepto de gasto: el núcleo no
 * tiene por qué saber qué es un tope, ni Body heredaría este vocabulario.
 */
import { Pill } from '@/core/components/ui/Pill';
import { STATUS } from '@/domains/finance/shared/status';
import type { BudgetStatus } from '@/domains/finance/shared/types/overview';

export function StatusPill({ status, compact = false }: { status: BudgetStatus; compact?: boolean }) {
  return <Pill meta={STATUS[status]} compact={compact} />;
}

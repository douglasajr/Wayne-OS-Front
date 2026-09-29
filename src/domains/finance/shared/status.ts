/**
 * Semaforo de presupuesto.
 *
 * Los cuatro estados del producto. Cada uno viaja SIEMPRE con icono y
 * etiqueta: el color nunca comunica solo, porque un usuario con daltonismo
 * rojo-verde no distinguiria "vas bien" de "te pasaste".
 */
import type { BudgetStatus } from '@/domains/finance/shared/types/overview';

export interface StatusMeta {
  label: string;
  color: string;
  icon: 'check' | 'alert' | 'warn' | 'siren';
}

export const STATUS: Record<BudgetStatus, StatusMeta> = {
  HEALTHY: { label: 'En control', color: 'var(--good)', icon: 'check' },
  WARNING: { label: 'Atento', color: 'var(--warning)', icon: 'alert' },
  CRITICAL: { label: 'Al límite', color: 'var(--serious)', icon: 'warn' },
  EXCEEDED: { label: 'Excedido', color: 'var(--critical)', icon: 'siren' },
};

/** Token de paleta ("cat-1".."cat-8", "neutral", "income") -> variable CSS. */
export function categoryColor(token: string | null | undefined): string {
  if (!token) return 'var(--cat-neutral)';
  if (token.startsWith('cat-')) return `var(--${token})`;
  if (token === 'neutral') return 'var(--cat-neutral)';
  if (token === 'income') return 'var(--cat-income)';
  // Compatibilidad con un hex escrito a mano por el usuario.
  return token.startsWith('#') ? token : 'var(--cat-neutral)';
}

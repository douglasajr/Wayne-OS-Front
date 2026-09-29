/**
 * Formato de presentacion — parte del CORE.
 *
 * Aqui solo vive lo que no pertenece a ningun dominio: numeros y fechas. El
 * formato de DINERO se fue a `domains/finance/shared/money.ts` en la Fase 5.5,
 * porque Lempiras es un concepto de Finance, no de WAYNE OS. El dia que exista
 * Body, su peso corporal se formatea en su dominio, no aqui.
 */

export function toNumber(value: string | number): number {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "18 sep". La fecha llega como "YYYY-MM-DD" y se parte a mano para que la
 *  zona horaria del navegador no la corra un dia. */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''}`;
}

export function relativeDay(iso: string): string {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (iso === todayIso) return 'Hoy';
  const yesterday = new Date(today.getTime() - 86_400_000);
  const yIso = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  if (iso === yIso) return 'Ayer';
  return shortDate(iso);
}

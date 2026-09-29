/**
 * Fechas civiles en formato "YYYY-MM-DD".
 *
 * Todo se construye a mano desde los componentes locales del `Date`. Usar
 * `toISOString()` convierte a UTC y en Honduras (UTC-6) eso corre el dia hacia
 * atras: un gasto registrado a las 7pm del 18 se guardaria como dia 19.
 */

export type IsoDate = string;

function iso(d: Date): IsoDate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayIso(): IsoDate {
  return iso(new Date());
}

export function daysAgoIso(days: number): IsoDate {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return iso(d);
}

/** Primer y ultimo dia del mes que contiene la fecha dada (hoy por defecto). */
export function monthRange(ref: Date = new Date()): { from: IsoDate; to: IsoDate } {
  const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { from: iso(first), to: iso(last) };
}

export function previousMonthRange(ref: Date = new Date()): { from: IsoDate; to: IsoDate } {
  return monthRange(new Date(ref.getFullYear(), ref.getMonth() - 1, 1));
}

const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "18 de septiembre de 2026", para encabezados de grupo y detalles. */
export function longDate(isoDate: IsoDate): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d} de ${MONTHS_LONG[m - 1]} de ${y}`;
}

/** Etiqueta del mes, para el selector de periodo: "septiembre 2026". */
export function monthLabel(isoDate: IsoDate): string {
  const [y, m] = isoDate.split('-').map(Number);
  if (!y || !m) return isoDate;
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

/**
 * Formato de dinero — dominio FINANCE.
 *
 * Los montos llegan como string desde la API (precision decimal intacta). Solo
 * se convierten a number en el ULTIMO paso, para mostrarlos: esa es la regla 11
 * del proyecto y este archivo es el unico sitio donde se cruza esa linea.
 */

const formatter = new Intl.NumberFormat('es-HN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('es-HN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function money(value: string | number, options?: { compact?: boolean }): string {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(n)) return 'L 0.00';
  const abs = Math.abs(n);
  const body = options?.compact ? compactFormatter.format(abs) : formatter.format(abs);
  return `${n < 0 ? '-' : ''}L ${body}`;
}

/** Sin simbolo, para cuando la etiqueta ya dice que es dinero. */
export function amount(value: string | number, compact = false): string {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(n)) return '0';
  return compact ? compactFormatter.format(n) : formatter.format(n);
}

/**
 * Lo que el dominio FINANCE aporta a la navegacion de WAYNE OS.
 *
 * El armazon no conoce estas rutas: las recibe. Agregar Body es escribir un
 * archivo como este y sumarlo a `platform/navigation.ts`.
 */
import type { DomainNav } from '@/platform/navigation';

export const FINANCE_BASE = '/finanzas';

export const FINANCE_NAV: DomainNav = {
  id: 'finance',
  label: 'Finanzas',
  icon: 'wallet',
  items: [
    { to: `${FINANCE_BASE}/movimientos`, label: 'Movimientos', icon: 'list' },
    { to: `${FINANCE_BASE}/presupuesto`, label: 'Presupuesto', icon: 'target' },
    { to: `${FINANCE_BASE}/cuentas`, label: 'Cuentas', icon: 'wallet' },
    { to: `${FINANCE_BASE}/tarjetas`, label: 'Tarjetas', icon: 'card' },
    { to: `${FINANCE_BASE}/suscripciones`, label: 'Suscripciones', icon: 'repeat' },
    { to: `${FINANCE_BASE}/ahorro`, label: 'Ahorro', icon: 'shield' },
    { to: `${FINANCE_BASE}/inversiones`, label: 'Inversiones', icon: 'chart' },
    { to: `${FINANCE_BASE}/reportes`, label: 'Reportes', icon: 'chart' },
  ],
  /** Paginas que no van en el menu pero necesitan titulo propio. */
  subpages: {
    [`${FINANCE_BASE}/categorias`]: 'Categorías',
  },
};

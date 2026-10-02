/**
 * Filtros de la lista de movimientos.
 *
 * Lo frecuente arriba y a la vista (periodo, tipo, busqueda); lo ocasional
 * —cuenta, gastos hormiga, rango a medida— detras de "Más filtros", con un
 * contador para que nunca haya un filtro activo invisible: una lista filtrada
 * que parece vacia es el peor error posible en una app de dinero.
 */
import { useState } from 'react';
import { Icon } from '@/core/components/ui/Icon';
import { monthRange, previousMonthRange, daysAgoIso, todayIso } from '@/core/lib/dates';
import type { Account } from '@/domains/finance/shared/types/domain';

export interface FiltersState {
  search: string;
  type: '' | 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'ADJUSTMENT';
  accountId: string;
  from: string;
  to: string;
  onlyMicro: boolean;
}

export const EMPTY_FILTERS: FiltersState = {
  search: '',
  type: '',
  accountId: '',
  from: '',
  to: '',
  onlyMicro: false,
};

/** El periodo por defecto es el mes en curso: la pregunta de siempre. */
export function initialFilters(): FiltersState {
  return { ...EMPTY_FILTERS, ...monthRange() };
}

const TYPES: { value: FiltersState['type']; label: string }[] = [
  { value: '', label: 'Todo' },
  { value: 'EXPENSE', label: 'Gastos' },
  { value: 'INCOME', label: 'Ingresos' },
  { value: 'TRANSFER', label: 'Traslados' },
  { value: 'ADJUSTMENT', label: 'Ajustes' },
];

interface Props {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  accounts: Account[];
}

export function TransactionFilters({ value, onChange, accounts }: Props) {
  const [expanded, setExpanded] = useState(false);
  const set = (patch: Partial<FiltersState>) => onChange({ ...value, ...patch });

  const thisMonth = monthRange();
  const lastMonth = previousMonthRange();

  const isRange = (r: { from: string; to: string }) => value.from === r.from && value.to === r.to;
  const isLast30 = value.from === daysAgoIso(30) && value.to === todayIso();

  const extraCount =
    (value.accountId ? 1 : 0) + (value.onlyMicro ? 1 : 0) + (value.search.trim() ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="relative">
        <span
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          style={{ color: 'var(--ink-muted)' }}
        >
          <Icon name="search" size={16} />
        </span>
        <input
          className="field"
          style={{ fontSize: 14, padding: '10px 12px 10px 36px' }}
          placeholder="Buscar descripción, notas o comercio"
          value={value.search}
          onChange={(e) => set({ search: e.target.value })}
          aria-label="Buscar movimientos"
        />
        {value.search && (
          <button
            type="button"
            onClick={() => set({ search: '' })}
            className="absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center"
            style={{ color: 'var(--ink-muted)' }}
            aria-label="Limpiar búsqueda"
          >
            <Icon name="x" size={15} strokeWidth={2.2} />
          </button>
        )}
      </div>

      <div className="chip-row">
        {TYPES.map((t) => (
          <button
            key={t.value || 'all'}
            type="button"
            className="chip"
            aria-pressed={value.type === t.value}
            onClick={() => set({ type: t.value })}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="chip-row">
        <button
          type="button"
          className="chip"
          aria-pressed={isRange(thisMonth)}
          onClick={() => set(thisMonth)}
        >
          Este mes
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={isRange(lastMonth)}
          onClick={() => set(lastMonth)}
        >
          Mes pasado
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={isLast30}
          onClick={() => set({ from: daysAgoIso(30), to: todayIso() })}
        >
          Últimos 30 días
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={!value.from && !value.to}
          onClick={() => set({ from: '', to: '' })}
        >
          Todo
        </button>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-[12px] font-semibold"
        style={{ color: extraCount > 0 ? 'var(--accent)' : 'var(--ink-2)' }}
        aria-expanded={expanded}
      >
        <Icon name="filter" size={14} strokeWidth={2} />
        Más filtros
        {extraCount > 0 && ` (${extraCount})`}
        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={13} strokeWidth={2.2} />
      </button>

      {expanded && (
        <div
          className="space-y-3 border px-3 py-3"
          style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius-sm)' }}
        >
          <label className="block">
            <span className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
              Cuenta
            </span>
            <select
              className="field"
              style={{ fontSize: 14, padding: '10px 12px' }}
              value={value.accountId}
              onChange={(e) => set({ accountId: e.target.value })}
            >
              <option value="">Todas las cuentas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
                Desde
              </span>
              <input
                type="date"
                className="field"
                style={{ fontSize: 14, padding: '10px 12px' }}
                value={value.from}
                onChange={(e) => set({ from: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
                Hasta
              </span>
              <input
                type="date"
                className="field"
                style={{ fontSize: 14, padding: '10px 12px' }}
                value={value.to}
                onChange={(e) => set({ to: e.target.value })}
              />
            </label>
          </div>

          <button
            type="button"
            className="chip w-full justify-center"
            aria-pressed={value.onlyMicro}
            onClick={() => set({ onlyMicro: !value.onlyMicro })}
          >
            <Icon name="ant" size={15} strokeWidth={2} />
            Solo gastos hormiga
          </button>

          <button
            type="button"
            onClick={() => onChange(initialFilters())}
            className="w-full text-[12px] font-semibold"
            style={{ color: 'var(--ink-muted)' }}
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </div>
  );
}

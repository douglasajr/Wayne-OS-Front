/**
 * Una categoria con limite.
 *
 * El punto de color identifica la categoria; la barra usa el color de ESTADO.
 * Son dos trabajos distintos y mezclarlos haria que "rojo" significara a la vez
 * "Salud" y "te pasaste".
 */
import { Meter } from '@/core/components/ui/Meter';
import { Icon } from '@/core/components/ui/Icon';
import { STATUS, categoryColor } from '@/domains/finance/shared/status';
import { toNumber } from '@/core/lib/format';
import { amount, money } from '@/domains/finance/shared/money';
import type { BudgetLine } from '@/domains/finance/shared/types/budget';

export function BudgetLineRow({ line, onEdit }: { line: BudgetLine; onEdit: () => void }) {
  const meta = STATUS[line.status];
  const remaining = toNumber(line.remaining);

  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        className="w-full text-left"
        aria-label={`Editar el límite de ${line.name}`}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className="grid h-7 w-7 shrink-0 place-items-center"
            style={{
              background: `color-mix(in oklab, ${categoryColor(line.color)} 16%, transparent)`,
              color: categoryColor(line.color),
            }}
          >
            <Icon name={line.icon} size={14} strokeWidth={2.1} />
          </span>

          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{line.name}</span>

          <span className="tabular shrink-0 text-sm font-bold">L {amount(line.spent, true)}</span>
        </div>

        <Meter
          percent={line.percentUsed}
          color={meta.color}
          label={`${line.name}: ${Math.round(line.percentUsed)}% del límite`}
        />

        <div
          className="mt-1 flex items-center justify-between text-[11px]"
          style={{ color: 'var(--ink-muted)' }}
        >
          <span className="tabular">
            {remaining >= 0
              ? `quedan ${money(remaining, { compact: true })} de ${money(line.planned, { compact: true })}`
              : `${money(Math.abs(remaining), { compact: true })} sobre el límite`}
          </span>
          <span className="flex items-center gap-1 font-semibold" style={{ color: meta.color }}>
            <Icon name={meta.icon} size={11} strokeWidth={2.6} />
            {Math.round(line.percentUsed)}%
          </span>
        </div>
      </button>
    </li>
  );
}

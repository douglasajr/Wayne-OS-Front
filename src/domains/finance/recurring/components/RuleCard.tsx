/**
 * Una recurrencia en la lista.
 *
 * Muestra el equivalente MENSUAL junto al monto real: una anual de L1,200 y
 * una mensual de L100 cuestan lo mismo al mes, y sin normalizar es imposible
 * compararlas de un vistazo.
 */
import { Icon } from '@/core/components/ui/Icon';
import { categoryColor } from '@/domains/finance/shared/status';
import { shortDate } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import type { RecurringRule } from '@/domains/finance/shared/types/recurring';
import { KIND, frequencyLabel } from '../labels';

export function RuleCard({ rule, onSelect }: { rule: RecurringRule; onSelect: () => void }) {
  const dim = rule.isActive ? 1 : 0.5;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-2.5 border px-3 py-3 text-left"
        style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius-sm)', opacity: dim }}
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center"
          style={{
            background: `color-mix(in oklab, ${categoryColor(rule.category?.color)} 16%, transparent)`,
            color: categoryColor(rule.category?.color),
          }}
        >
          <Icon name={rule.category?.icon ?? KIND[rule.kind].icon} size={16} strokeWidth={2.1} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="min-w-0 truncate text-sm font-semibold">{rule.name}</span>
            {rule.autoGenerate && (
              <span title="Se registra solo" style={{ color: 'var(--accent)' }}>
                <Icon name="repeat" size={12} strokeWidth={2.4} />
              </span>
            )}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            {!rule.isActive
              ? 'cancelada'
              : rule.isOverdue
                ? `venció el ${shortDate(rule.nextRunDate)}`
                : `${frequencyLabel(rule.frequency, rule.interval)} · próxima ${shortDate(rule.nextRunDate)}`}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="tabular text-sm font-bold">
            {rule.amount ? money(rule.amount, { compact: true }) : '—'}
          </div>
          {rule.frequency !== 'MONTHLY' && rule.amount && (
            <div className="tabular text-[10px]" style={{ color: 'var(--ink-muted)' }}>
              {money(rule.monthlyEquivalent, { compact: true })}/mes
            </div>
          )}
        </div>

        {rule.isOverdue && rule.isActive && (
          <span className="shrink-0" style={{ color: 'var(--warning)' }} title="Pendiente de confirmar">
            <Icon name="alert" size={15} strokeWidth={2.2} />
          </span>
        )}
      </button>
    </li>
  );
}

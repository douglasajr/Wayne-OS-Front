/**
 * Un objetivo de ahorro.
 *
 * La cifra que manda es lo apartado; la meta es contexto. Cuando el objetivo
 * tiene aporte mensual comprometido se muestra cuantos meses faltan al ritmo
 * actual, que es la unica forma util de leer "me faltan L21,000".
 */
import { Card } from '@/core/components/ui/Card';
import { Icon, type IconName } from '@/core/components/ui/Icon';
import { Meter } from '@/core/components/ui/Meter';
import { categoryColor } from '@/domains/finance/shared/status';
import { money } from '@/domains/finance/shared/money';
import { toNumber } from '@/core/lib/format';
import { monthLabel } from '@/core/lib/dates';
import type { SavingsGoal } from '@/domains/finance/shared/types/savings';

interface Props {
  goal: SavingsGoal;
  onContribute: (goal: SavingsGoal) => void;
  onWithdraw: (goal: SavingsGoal) => void;
  onEdit: (goal: SavingsGoal) => void;
}

export function GoalCard({ goal, onContribute, onWithdraw, onEdit }: Props) {
  const color = categoryColor(goal.color);
  const hasTarget = goal.targetAmount !== null;
  const current = toNumber(goal.currentAmount);
  const icon = (goal.icon ?? 'target') as IconName;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center"
            style={{
              background: `color-mix(in oklab, ${color} 16%, transparent)`,
              color,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Icon name={icon} size={16} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{goal.name}</div>
            <div className="truncate text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              {goal.accountName ?? 'Sin cuenta asignada'}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="chip shrink-0"
          onClick={() => onEdit(goal)}
          aria-label={`Editar ${goal.name}`}
        >
          <Icon name="pencil" size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="tabular text-xl font-bold">{money(goal.currentAmount, { compact: true })}</div>
        {hasTarget && (
          <div className="tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            de {money(goal.targetAmount!, { compact: true })}
          </div>
        )}
      </div>

      {hasTarget && (
        <div className="mt-2">
          <Meter percent={goal.percent} color={color} label={`${goal.name}: ${Math.round(goal.percent)}%`} />
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        {goal.achievedAt ? (
          <span style={{ color: 'var(--good)' }}>
            <Icon name="check" size={12} strokeWidth={2.4} /> Meta alcanzada
          </span>
        ) : (
          goal.monthsToTarget !== null && (
            <span className="tabular">
              {goal.monthsToTarget} {goal.monthsToTarget === 1 ? 'mes' : 'meses'} al ritmo de{' '}
              {money(goal.monthlyTarget!, { compact: true })}/mes
            </span>
          )
        )}
        {goal.targetDate && <span>para {monthLabel(goal.targetDate)}</span>}
        <span className="tabular">este mes {money(goal.contributedThisMonth, { compact: true })}</span>
      </div>

      <div className="mt-3.5 flex gap-2">
        <button
          type="button"
          className="chip"
          onClick={() => onContribute(goal)}
          disabled={!goal.accountId}
          title={goal.accountId ? undefined : 'Asigna una cuenta que respalde el objetivo'}
        >
          <Icon name="plus" size={14} strokeWidth={2.4} />
          Aportar
        </button>
        {current > 0 && (
          <button type="button" className="chip" onClick={() => onWithdraw(goal)}>
            <Icon name="out" size={14} strokeWidth={2.4} />
            Retirar
          </button>
        )}
      </div>
    </Card>
  );
}

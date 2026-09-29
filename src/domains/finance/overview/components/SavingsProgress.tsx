/**
 * El ahorro del mes en el Command Center.
 *
 * El plan aparta L5,000 al mes y hasta la Fase 9 nadie comprobaba si de verdad
 * se apartaban. Esta tarjeta responde eso y nada mas; el detalle por objetivo
 * vive en /finanzas/ahorro.
 *
 * No aparece cuando no hay meta de ahorro: una tarjeta que siempre dice
 * "0 de 0" es ruido, no informacion.
 */
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Icon } from '@/core/components/ui/Icon';
import { Meter } from '@/core/components/ui/Meter';
import { money } from '@/domains/finance/shared/money';
import { toNumber } from '@/core/lib/format';
import type { DashboardSummary } from '@/domains/finance/shared/types/overview';

const COLOR: Record<DashboardSummary['savings']['progress'], string> = {
  AHEAD: 'var(--good)',
  ON_TRACK: 'var(--good)',
  BEHIND: 'var(--warning)',
  NONE: 'var(--ink-muted)',
};

export function SavingsProgress({ savings }: { savings: DashboardSummary['savings'] }) {
  if (toNumber(savings.monthTarget) <= 0) return null;

  const color = COLOR[savings.progress];
  const remaining = toNumber(savings.remaining);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <CardTitle>Ahorro del mes</CardTitle>
        <Link to="/finanzas/ahorro" className="chip shrink-0">
          <Icon name="piggy" size={14} strokeWidth={2} />
          Ver
        </Link>
      </div>

      <div className="tabular text-lg font-bold whitespace-nowrap">
        {money(savings.monthSaved, { compact: true })}
        <span className="text-sm font-medium" style={{ color: 'var(--ink-muted)' }}>
          {' '}de {money(savings.monthTarget, { compact: true })}
        </span>
      </div>

      <div className="mt-2.5">
        <Meter
          percent={savings.percent}
          color={color}
          label={`Ahorro del mes: ${Math.round(savings.percent)}% de la meta`}
        />
      </div>

      <div className="tabular mt-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        {remaining > 0
          ? `faltan ${money(remaining, { compact: true })} para cumplir el plan`
          : 'meta del mes cumplida'}
      </div>

      {savings.goals.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {savings.goals.map((goal) => (
            <li key={goal.id} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="min-w-0 truncate" style={{ color: 'var(--ink-2)' }}>{goal.name}</span>
              <span className="tabular shrink-0" style={{ color: 'var(--ink-muted)' }}>
                {money(goal.current, { compact: true })}
                {goal.target ? ` / ${money(goal.target, { compact: true })}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

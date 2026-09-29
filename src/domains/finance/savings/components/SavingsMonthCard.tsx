/**
 * El ahorro del mes contra la meta del plan.
 *
 * El numero grande es lo apartado, no lo que falta: la pregunta de esta
 * pantalla es "¿cumpli?", no "¿cuanto me queda por gastar?". Y el semaforo va
 * al reves que el del presupuesto — aqui pasarse de la meta es lo bueno, por
 * eso no reutiliza StatusPill.
 */
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Icon } from '@/core/components/ui/Icon';
import { Meter } from '@/core/components/ui/Meter';
import { money } from '@/domains/finance/shared/money';
import { toNumber } from '@/core/lib/format';
import type { SavingsMonth, SavingsProgress } from '@/domains/finance/shared/types/savings';

const PROGRESS: Record<SavingsProgress, { label: string; color: string; icon: 'check' | 'alert' | 'warn' }> = {
  AHEAD: { label: 'Meta cumplida', color: 'var(--good)', icon: 'check' },
  ON_TRACK: { label: 'En camino', color: 'var(--good)', icon: 'check' },
  BEHIND: { label: 'Vas corto', color: 'var(--warning)', icon: 'alert' },
  NONE: { label: 'Sin meta', color: 'var(--ink-muted)', icon: 'warn' },
};

export function SavingsMonthCard({
  month,
  totalSaved,
}: {
  month: SavingsMonth;
  totalSaved: string;
}) {
  const meta = PROGRESS[month.progress];
  const unassigned = toNumber(month.unassigned);
  const allocated = toNumber(month.allocatedToGoals);
  const target = toNumber(month.target);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <CardTitle>Ahorro de este mes</CardTitle>
        <span
          className="label-deco inline-flex shrink-0 items-center gap-1.5 px-2 py-1 text-[9px]"
          style={{
            background: `color-mix(in oklab, ${meta.color} 14%, transparent)`,
            color: meta.color,
            border: `1px solid color-mix(in oklab, ${meta.color} 34%, transparent)`,
            borderRadius: 'var(--radius-pill)',
          }}
        >
          <Icon name={meta.icon} size={13} strokeWidth={2.4} />
          {meta.label}
        </span>
      </div>

      <div className="tabular text-3xl font-bold">{money(month.saved, { compact: true })}</div>
      <div className="tabular mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
        de {money(month.target, { compact: true })} que aparta el plan
      </div>

      <div className="mt-3.5">
        <Meter
          percent={month.percent}
          color={meta.color}
          label={`Ahorro del mes: ${Math.round(month.percent)}% de la meta`}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[
          ['A objetivos', month.toGoals],
          ['A inversión', month.toInvestments],
          ['Sin asignar', month.unassigned],
        ].map(([label, value]) => (
          <div
            key={label}
            className="px-3 py-2"
            style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}
          >
            <div className="label-deco text-[9px]" style={{ color: 'var(--ink-muted)' }}>
              {label}
            </div>
            <div className="tabular text-sm font-semibold">{money(value!, { compact: true })}</div>
          </div>
        ))}
      </div>

      <div className="tabular mt-3 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        Patrimonio apartado en objetivos: {money(totalSaved, { compact: true })}
      </div>

      {unassigned > 0 && (
        <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          Hay {money(unassigned, { compact: true })} guardados sin objetivo. Es ahorro igual, pero
          sin destino es lo primero que se gasta.
        </p>
      )}

      {allocated > 0 && allocated !== target && (
        <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          Tus objetivos comprometen {money(allocated, { compact: true })} al mes y el plan aparta{' '}
          {money(target, { compact: true })}:{' '}
          {allocated > target ? 'estás prometiendo más de lo que separas.' : 'te sobra margen sin destino.'}
        </p>
      )}
    </Card>
  );
}

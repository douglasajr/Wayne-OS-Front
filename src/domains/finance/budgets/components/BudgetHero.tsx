/**
 * Cabecera del ciclo.
 *
 * Responde dos preguntas distintas que es facil confundir:
 *   - cuanto he GASTADO del tope (la barra);
 *   - cuanto he REPARTIDO del tope entre categorias (la linea de abajo).
 *
 * Son numeros independientes: se puede haber repartido el 100% y gastado el
 * 20%, o no haber repartido nada y estar excedido. Mezclarlos en una sola
 * cifra era la forma mas rapida de que el panel mintiera.
 *
 * Desde la Fase 7 hay un tercero: lo COMPROMETIDO, recurrencias que vencen
 * antes de que acabe el ciclo. No es gasto —no ha ocurrido— pero tampoco es
 * dinero con el que se pueda contar.
 */
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Meter } from '@/core/components/ui/Meter';
import { StatusPill } from '@/domains/finance/shared/components/StatusPill';
import { Icon } from '@/core/components/ui/Icon';
import { STATUS } from '@/domains/finance/shared/status';
import { toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import type { BudgetView } from '@/domains/finance/shared/types/budget';

export function BudgetHero({ view, onEditAmount }: { view: BudgetView; onEditAmount: () => void }) {
  const { totals, plan, period } = view;
  const meta = STATUS[totals.status];
  const unallocated = toNumber(totals.unallocated);
  const allocatedPercent = toNumber(totals.planned) > 0
    ? (toNumber(totals.allocated) / toNumber(totals.planned)) * 100
    : 0;

  return (
    <Card edge>
      <CardTitle
        action={
          <button
            type="button"
            onClick={onEditAmount}
            disabled={period.closedAt !== null}
            className="label-deco inline-flex items-center gap-1.5 text-[9px]"
            style={{ color: period.closedAt ? 'var(--ink-muted)' : 'var(--accent)' }}
          >
            <Icon name="pencil" size={12} strokeWidth={2.2} />
            Tope
          </button>
        }
      >
        Presupuesto del ciclo
      </CardTitle>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="figure tabular text-[34px] leading-none">
            {money(totals.spent, { compact: true })}
          </div>
          <div className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-2)' }}>
            de {money(totals.planned, { compact: true })} · quedan{' '}
            <span className="tabular font-semibold">{money(totals.remaining, { compact: true })}</span>
          </div>
        </div>
        <StatusPill status={totals.status} />
      </div>

      <div className="mt-3.5">
        <Meter
          percent={totals.percentUsed}
          color={meta.color}
          height={10}
          label={`Gastado: ${Math.round(totals.percentUsed)}% del tope del ciclo`}
        />
      </div>

      <div
        className="mt-3.5 space-y-2 border-t pt-3"
        style={{ borderColor: 'var(--line)' }}
      >
        <Row
          label="Repartido en categorías"
          value={money(totals.allocated, { compact: true })}
          hint={`${Math.round(allocatedPercent)}% del tope`}
        />
        {toNumber(totals.committed) > 0 && (
          <Row
            label="Comprometido"
            value={money(totals.committed, { compact: true })}
            hint="Recurrencias que vencen antes de que acabe el ciclo"
          />
        )}
        <Row
          label="Libre de verdad"
          value={money(totals.available, { compact: true })}
          hint="Tope − gastado − comprometido"
          tone={toNumber(totals.available) < 0 ? 'var(--critical)' : undefined}
        />
        <Row
          label={unallocated < 0 ? 'Repartido de más' : 'Sin repartir'}
          value={money(Math.abs(unallocated), { compact: true })}
          hint={
            unallocated < 0
              ? 'Los límites suman más que el tope'
              : 'Gasto que ninguna categoría está vigilando'
          }
          tone={unallocated < 0 ? 'var(--serious)' : undefined}
        />
      </div>

      <p className="mt-3 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        Tu plan mensual es de {money(plan.monthlySpendingBudget, { compact: true })} para gastar y{' '}
        {money(plan.monthlySavingsTarget, { compact: true })} que no se tocan.
      </p>
    </Card>
  );
}

function Row({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold">{label}</div>
        <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{hint}</div>
      </div>
      <div className="figure tabular shrink-0 text-base" style={{ color: tone }}>
        {value}
      </div>
    </div>
  );
}

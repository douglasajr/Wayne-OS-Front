/**
 * La respuesta a "¿cuanto me queda?" en menos de 10 segundos.
 *
 * El numero heroe es lo LIBRE, no lo gastado ni lo que queda del tope: es la
 * cifra sobre la que se decide si comprar algo hoy. Desde la Fase 7 descuenta
 * lo comprometido —recurrencias que vencen antes de que acabe el ciclo—,
 * porque "te quedan L2,200" es mentira si L1,400 ya tienen dueño.
 *
 * Debajo, la traduccion accionable: cuanto se puede gastar por dia con los
 * dias que faltan.
 */
import { Card } from '@/core/components/ui/Card';
import { Meter } from '@/core/components/ui/Meter';
import { StatusPill } from '@/domains/finance/shared/components/StatusPill';
import { Icon } from '@/core/components/ui/Icon';
import { STATUS } from '@/domains/finance/shared/status';
import { toNumber } from '@/core/lib/format';
import { amount, money } from '@/domains/finance/shared/money';
import type { DashboardSummary } from '@/domains/finance/shared/types/overview';

interface Props {
  cycle: DashboardSummary['cycle'];
  period: DashboardSummary['period'];
}

export function CycleHero({ cycle, period }: Props) {
  const available = toNumber(cycle.available);
  const committed = toNumber(cycle.committed);
  const overspent = available < 0;
  const meta = STATUS[cycle.status];

  // Cuanto del ciclo ha transcurrido: si el gasto va por delante del tiempo,
  // la marca en la barra lo delata sin necesidad de explicarlo.
  const totalDays = daysBetween(period.startDate, period.endDate) + 1;
  const elapsedPct = totalDays > 0 ? ((totalDays - period.daysLeft) / totalDays) * 100 : 0;

  return (
    <Card edge>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="label-deco text-[10px]" style={{ color: 'var(--ink-muted)' }}>
          {period.sequence === 1 ? 'Primera quincena' : 'Segunda quincena'}
        </span>
        <StatusPill status={cycle.status} />
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span
          className="figure text-[46px] leading-none sm:text-[54px]"
          style={{ color: overspent ? 'var(--critical)' : 'var(--ink)' }}
        >
          {money(Math.abs(available), { compact: true })}
        </span>
        <span className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>
          {overspent ? 'por encima del presupuesto' : 'libres'}
        </span>
      </div>

      {committed > 0 && (
        <p className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-muted)' }}>
          Ya descontados {money(committed, { compact: true })} en recurrencias que vencen
          antes de que acabe la quincena.
        </p>
      )}

      <div className="mt-4">
        <Meter
          percent={cycle.percentUsed}
          color={meta.color}
          height={10}
          marker={elapsedPct}
          label={`Gastado ${Math.round(cycle.percentUsed)}% del presupuesto de la quincena`}
        />
        <div className="mt-2 flex justify-between text-xs" style={{ color: 'var(--ink-muted)' }}>
          <span className="tabular">
            L {amount(cycle.spent, true)} gastados de L {amount(cycle.plannedAmount, true)}
          </span>
          <span className="tabular font-semibold">{Math.round(cycle.percentUsed)}%</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {/* Texto corto a proposito: a 320px de ancho "11 dias restantes" se
            trunca y deja de informar. */}
        <Pill icon="target" label={`${period.daysLeft} ${period.daysLeft === 1 ? 'día' : 'días'}`} />
        <Pill
          icon="wallet"
          label={overspent ? 'Sin margen' : `${money(cycle.dailyAllowance, { compact: true })}/día`}
          strong={!overspent}
        />
      </div>
    </Card>
  );
}

function Pill({ icon, label, strong }: { icon: 'target' | 'wallet'; label: string; strong?: boolean }) {
  return (
    <div
      className="flex items-center gap-2  px-3 py-2.5 text-xs font-medium"
      style={{ background: 'var(--surface-2)', color: strong ? 'var(--ink)' : 'var(--ink-2)' }}
    >
      <Icon name={icon} size={15} />
      <span className="tabular whitespace-nowrap">{label}</span>
    </div>
  );
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

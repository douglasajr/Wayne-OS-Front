/**
 * El concepto central del producto, siempre visible: ingreso NO es presupuesto.
 *
 * Una sola barra dividida deja ver de un vistazo que de los L20,000 que entran,
 * solo L15,000 son gastables y L5,000 estan comprometidos como ahorro.
 */
import { Card } from '@/core/components/ui/Card';
import { toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import type { DashboardSummary } from '@/domains/finance/shared/types/overview';

export function PlanBar({ plan }: { plan: DashboardSummary['plan'] }) {
  const income = toNumber(plan.monthlyIncome);
  const budget = toNumber(plan.monthlySpendingBudget);
  const savings = toNumber(plan.monthlySavingsTarget);
  const budgetPct = income > 0 ? (budget / income) * 100 : 0;
  const savingsPct = income > 0 ? (savings / income) * 100 : 0;

  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="label-deco truncate text-[10px]" style={{ color: 'var(--ink-muted)' }}>
          Plan mensual
        </span>
        <span className="tabular shrink-0 text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--ink-2)' }}>
          {money(income, { compact: true })}
          <span className="font-normal" style={{ color: 'var(--ink-muted)' }}> ingreso</span>
        </span>
      </div>

      {/* 2px de separacion entre segmentos: el ojo los lee como dos bloques,
          no como un degradado continuo. */}
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden" style={{ background: 'var(--surface-2)', borderRadius: 2 }}>
        <div style={{ width: `${budgetPct}%`, background: 'var(--cat-1)', borderRadius: 2 }} />
        <div style={{ width: `${savingsPct}%`, background: 'var(--cat-6)', borderRadius: 2 }} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Legend color="var(--cat-1)" label="Para gastar" value={money(budget, { compact: true })} />
        <Legend color="var(--cat-6)" label="Ahorro intocable" value={money(savings, { compact: true })} />
      </div>
    </Card>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0">
        <div className="truncate text-xs" style={{ color: 'var(--ink-muted)' }}>{label}</div>
        <div className="tabular text-sm font-bold">{value}</div>
      </div>
    </div>
  );
}

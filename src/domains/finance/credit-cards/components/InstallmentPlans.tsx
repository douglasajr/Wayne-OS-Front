/**
 * Compras diferidas a cuotas.
 *
 * Aqui se ve lo que la mayoria de las apps esconde: cuanto de tu tarjeta ya
 * esta comprometido en meses que todavia no llegan. Una laptop a 12 MSI no
 * duele el mes que la compras; duele los once siguientes.
 *
 * Una cuota NO es un gasto nuevo: el gasto se registro el dia de la compra.
 * Esto es el calendario de cobro de una deuda que ya existe.
 */
import { useState } from 'react';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Meter } from '@/core/components/ui/Meter';
import { Icon } from '@/core/components/ui/Icon';
import { categoryColor } from '@/domains/finance/shared/status';
import { shortDate } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import { useCancelInstallmentPlan } from '@/domains/finance/shared/api';
import type { InstallmentPlan } from '@/domains/finance/shared/types/cards';

export function InstallmentPlans({ plans, pending }: { plans: InstallmentPlan[]; pending: string }) {
  const cancel = useCancelInstallmentPlan();
  const [confirming, setConfirming] = useState<string | null>(null);

  if (plans.length === 0) return null;

  return (
    <Card>
      <CardTitle
        action={
          <span className="tabular text-sm font-bold">{money(pending, { compact: true })}</span>
        }
      >
        Comprometido en cuotas
      </CardTitle>

      <ul className="space-y-3.5">
        {plans.map((plan) => {
          const progress = (plan.billedCount / plan.months) * 100;
          return (
            <li key={plan.id}>
              <div className="mb-1.5 flex items-center gap-2.5">
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center"
                  style={{
                    background: `color-mix(in oklab, ${categoryColor(plan.category?.color)} 16%, transparent)`,
                    color: categoryColor(plan.category?.color),
                  }}
                >
                  <Icon name={plan.category?.icon ?? 'card'} size={14} strokeWidth={2.1} />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {plan.description ?? 'Compra diferida'}
                </span>
                <span className="tabular shrink-0 text-sm font-bold">
                  {money(plan.installmentAmount, { compact: true })}
                  <span className="text-[11px] font-normal" style={{ color: 'var(--ink-muted)' }}>/mes</span>
                </span>
              </div>

              <Meter
                percent={progress}
                color="var(--accent)"
                label={`${plan.billedCount} de ${plan.months} cuotas de ${plan.description ?? 'la compra'}`}
              />

              <div
                className="mt-1 flex items-center justify-between text-[11px]"
                style={{ color: 'var(--ink-muted)' }}
              >
                <span className="tabular">
                  {plan.billedCount}/{plan.months} cuotas · faltan{' '}
                  {money(plan.remainingAmount, { compact: true })}
                </span>
                {plan.nextDueDate && <span>próxima {shortDate(plan.nextDueDate)}</span>}
              </div>

              <div className="mt-1.5">
                <button
                  type="button"
                  className="text-[11px] underline-offset-2 hover:underline"
                  style={{ color: confirming === plan.id ? 'var(--critical)' : 'var(--ink-muted)' }}
                  onClick={() =>
                    confirming === plan.id
                      ? void cancel.mutateAsync(plan.id).finally(() => setConfirming(null))
                      : setConfirming(plan.id)
                  }
                >
                  {confirming === plan.id ? '¿Seguro? Anular el diferido' : 'Anular diferido'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        Estas cuotas no son gasto nuevo: la compra ya se registró completa el día que la hiciste.
        Esto es cuándo la cobran.
      </p>
    </Card>
  );
}

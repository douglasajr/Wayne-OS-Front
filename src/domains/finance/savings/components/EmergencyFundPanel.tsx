/**
 * Fondo de emergencia, en su propia tarjeta y con su propia pregunta.
 *
 * El dato que importa no es el porcentaje sino cuantos MESES aguanto sin
 * ingresos. Esos meses se derivan del gasto real de los meses cerrados: no es
 * un campo guardado, y por eso la meta tampoco se mueve sola. Recalcularla es
 * un boton, nunca un efecto secundario (regla 18).
 */
import { useState } from 'react';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { Sheet } from '@/core/components/ui/Sheet';
import { SelectField } from '@/core/components/ui/Field';
import { ApiError } from '@/core/lib/api';
import { money } from '@/domains/finance/shared/money';
import { useRecalculateEmergencyTarget } from '@/domains/finance/shared/api';
import type { SavingsGoal } from '@/domains/finance/shared/types/savings';

interface Props {
  fund: SavingsGoal;
  averageMonthlySpend: string;
  onContribute: (goal: SavingsGoal) => void;
  onWithdraw: (goal: SavingsGoal) => void;
  onEdit: (goal: SavingsGoal) => void;
}

export function EmergencyFundPanel({
  fund,
  averageMonthlySpend,
  onContribute,
  onWithdraw,
  onEdit,
}: Props) {
  const [adjusting, setAdjusting] = useState(false);
  const pct = Math.max(0, Math.min(100, fund.percent));
  const r = 42;
  const circumference = 2 * Math.PI * r;

  return (
    <Card>
      <CardTitle>Fondo de emergencia</CardTitle>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">
            <circle cx="52" cy="52" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="9" />
            <circle
              cx="52" cy="52" r={r} fill="none"
              stroke="var(--cat-6)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
              transform="rotate(-90 52 52)"
              style={{ transition: 'stroke-dasharray .6s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="figure tabular text-[22px]">{Math.round(pct)}%</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="tabular text-xl font-bold">{money(fund.currentAmount, { compact: true })}</div>
          {fund.targetAmount && (
            <div className="tabular text-xs" style={{ color: 'var(--ink-muted)' }}>
              meta {money(fund.targetAmount, { compact: true })}
            </div>
          )}

          {fund.monthsCovered !== null && (
            <div
              className="mt-3 px-3 py-2 text-xs"
              style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', borderRadius: 'var(--radius-sm)' }}
            >
              Cubre{' '}
              <strong className="tabular" style={{ color: 'var(--ink)' }}>
                {fund.monthsCovered} {fund.monthsCovered === 1 ? 'mes' : 'meses'}
              </strong>{' '}
              de gastos{fund.coverageMonthsTarget ? ` · meta ${fund.coverageMonthsTarget}` : ''}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        Calculado sobre {money(averageMonthlySpend, { compact: true })} al mes, que es lo que te ha
        costado vivir en los últimos meses cerrados.
      </p>

      {!fund.accountId && (
        <p className="mt-2 text-[11px]" style={{ color: 'var(--warning)' }}>
          Este fondo todavía no tiene una cuenta que lo respalde. Asígnala para poder aportar: el
          dinero tiene que estar en algún lado.
        </p>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2">
        <button
          type="button"
          className="chip"
          onClick={() => onContribute(fund)}
          disabled={!fund.accountId}
        >
          <Icon name="plus" size={14} strokeWidth={2.4} />
          Aportar
        </button>
        {Number(fund.currentAmount) > 0 && (
          <button type="button" className="chip" onClick={() => onWithdraw(fund)}>
            <Icon name="out" size={14} strokeWidth={2.4} />
            Retirar
          </button>
        )}
        <button type="button" className="chip" onClick={() => setAdjusting(true)}>
          <Icon name="target" size={14} strokeWidth={2.4} />
          Ajustar meta
        </button>
        <button type="button" className="chip" onClick={() => onEdit(fund)}>
          <Icon name="pencil" size={14} strokeWidth={2.4} />
          Editar
        </button>
      </div>

      {adjusting && <AdjustTargetSheet fund={fund} onClose={() => setAdjusting(false)} />}
    </Card>
  );
}

function AdjustTargetSheet({ fund, onClose }: { fund: SavingsGoal; onClose: () => void }) {
  const recalculate = useRecalculateEmergencyTarget();
  const [months, setMonths] = useState(String(fund.coverageMonthsTarget ?? 6));
  const [basis, setBasis] = useState<'ACTUAL_SPEND' | 'PLAN_BUDGET'>('ACTUAL_SPEND');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    try {
      await recalculate.mutateAsync({ months: Number(months), basis });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo ajustar la meta.');
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Ajustar la meta del fondo"
      subtitle="Cuántos meses quieres poder cubrir sin ingresos"
      footer={
        <Button full onClick={() => void submit()} loading={recalculate.isPending}>
          Recalcular meta
        </Button>
      }
    >
      <div className="space-y-4">
        <SelectField label="Meses de cobertura" value={months} onChange={(e) => setMonths(e.target.value)}>
          {[3, 4, 5, 6, 9, 12].map((m) => (
            <option key={m} value={m}>{m} meses</option>
          ))}
        </SelectField>

        <SelectField
          label="Calculada sobre"
          value={basis}
          onChange={(e) => setBasis(e.target.value as 'ACTUAL_SPEND' | 'PLAN_BUDGET')}
          hint="Lo real es lo que te ha costado vivir; el plan es el tope que te propusiste."
        >
          <option value="ACTUAL_SPEND">Mi gasto real</option>
          <option value="PLAN_BUDGET">El presupuesto del plan</option>
        </SelectField>

        <div
          className="flex items-start gap-2.5 px-3.5 py-3 text-[12px]"
          style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', color: 'var(--ink-2)' }}
        >
          <Icon name="alert" size={15} strokeWidth={2} />
          <span>
            La meta no se mueve sola cuando cambia tu gasto: un objetivo que sube cada mes caro es
            un objetivo que nunca se alcanza. Se recalcula solo cuando lo pides aquí.
          </span>
        </div>

        {error && (
          <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

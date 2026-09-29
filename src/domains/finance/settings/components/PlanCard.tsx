/**
 * El plan financiero, editable por fin.
 *
 * La pantalla insiste en la distinción que gobierna el proyecto entero: lo que
 * entra **no** es lo que se puede gastar. La barra reparte el ingreso en tres
 * bloques —gasto, ahorro y lo que quede sin destino— para que esa separación
 * se vea antes de tocar ningún número.
 *
 * Y ofrece dos acciones distintas a propósito:
 *
 * - **Corregir**: me equivoqué al teclear. Edita el plan vigente.
 * - **Cambiar desde el próximo mes**: me subieron el sueldo. Cierra este plan
 *   y abre otro, conservando el anterior para que un reporte de agosto siga
 *   comparándose contra el presupuesto de agosto.
 *
 * Adivinar cuál de las dos quiere el usuario es imposible, así que no se
 * adivina.
 */
import { useState } from 'react';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { Sheet } from '@/core/components/ui/Sheet';
import { TextField } from '@/core/components/ui/Field';
import { AmountInput } from '@/domains/finance/transactions/components/AmountInput';
import { ApiError } from '@/core/lib/api';
import { monthLabel } from '@/core/lib/dates';
import { toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import {
  useApplyPlanToCycle,
  useCorrectPlan,
  useSchedulePlan,
} from '@/domains/finance/shared/api';
import type { PlanSettings } from '@/domains/finance/shared/types/plan';

type Modo = 'CORREGIR' | 'CAMBIAR';

export function PlanCard({ data }: { data: PlanSettings }) {
  const [modo, setModo] = useState<Modo | null>(null);
  const applyToCycle = useApplyPlanToCycle();

  const { plan, currentCycle, history } = data;
  const income = toNumber(plan.expectedMonthlyIncome);
  const budget = toNumber(plan.monthlySpendingBudget);
  const savings = toNumber(plan.monthlySavingsTarget);
  const unassigned = toNumber(plan.unassigned);

  const pct = (v: number) => (income > 0 ? (v / income) * 100 : 0);

  return (
    <Card>
      <CardTitle>Plan financiero</CardTitle>

      <div className="tabular text-2xl font-bold">{money(plan.expectedMonthlyIncome, { compact: true })}</div>
      <p className="mt-1 text-[12px]" style={{ color: 'var(--ink-muted)' }}>
        entra al mes · vigente desde {monthLabel(plan.effectiveFrom)}
      </p>

      {/* Tres bloques, no una barra de progreso: son destinos, no avance. */}
      <div
        className="mt-3.5 flex h-2.5 w-full overflow-hidden"
        style={{ borderRadius: 2, background: 'var(--surface-2)' }}
        role="img"
        aria-label={`De ${money(income)}: ${money(budget)} para gastar, ${money(savings)} de ahorro, ${money(unassigned)} sin destino`}
      >
        <span style={{ width: `${pct(budget)}%`, background: 'var(--accent)' }} />
        <span style={{ width: `${pct(savings)}%`, background: 'var(--good)' }} />
      </div>

      <dl className="mt-3 space-y-1.5">
        <Fila color="var(--accent)" label="Para gastar" value={plan.monthlySpendingBudget} />
        <Fila color="var(--good)" label="Ahorro intocable" value={plan.monthlySavingsTarget} />
        {unassigned !== 0 && (
          <Fila
            color="var(--ink-muted)"
            label="Sin destino"
            value={plan.unassigned}
            hint="Ni presupuestado ni apartado: decide a dónde va."
          />
        )}
      </dl>

      {currentCycle && !currentCycle.matchesPlan && (
        <div
          className="mt-3.5 px-3.5 py-3 text-[12px]"
          style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', color: 'var(--ink-2)' }}
        >
          <div className="flex items-start gap-2.5">
            <Icon name="alert" size={15} strokeWidth={2} />
            <span>
              El ciclo <strong className="tabular">{currentCycle.label}</strong> tiene tope{' '}
              <strong className="tabular">{money(currentCycle.plannedAmount, { compact: true })}</strong>, y
              según este plan le tocarían{' '}
              <strong className="tabular">{money(currentCycle.suggestedAmount, { compact: true })}</strong>.
              Los ciclos cerrados no se tocan nunca.
            </span>
          </div>
          <button
            type="button"
            className="chip mt-2.5"
            onClick={() => void applyToCycle.mutateAsync().catch(() => undefined)}
            disabled={applyToCycle.isPending}
          >
            <Icon name="check" size={14} strokeWidth={2.4} />
            Actualizar el ciclo en curso
          </button>
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2">
        <button type="button" className="chip" onClick={() => setModo('CORREGIR')}>
          <Icon name="pencil" size={14} strokeWidth={2.4} />
          Corregir
        </button>
        <button type="button" className="chip" onClick={() => setModo('CAMBIAR')}>
          <Icon name="calendar" size={14} strokeWidth={2.4} />
          Cambiar desde el próximo mes
        </button>
      </div>

      {history.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            Planes anteriores ({history.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 text-[11px]">
                <span style={{ color: 'var(--ink-muted)' }}>
                  {monthLabel(h.effectiveFrom)} — {monthLabel(h.effectiveTo)}
                </span>
                <span className="tabular">{money(h.monthlySpendingBudget, { compact: true })} de gasto</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {modo && <PlanSheet data={data} modo={modo} onClose={() => setModo(null)} />}
    </Card>
  );
}

function Fila({
  color,
  label,
  value,
  hint,
}: {
  color: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="flex items-center gap-2 text-[12px]">
        <span
          aria-hidden="true"
          style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }}
        />
        {label}
        {hint && (
          <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            · {hint}
          </span>
        )}
      </dt>
      <dd className="tabular shrink-0 text-sm font-semibold">{money(value, { compact: true })}</dd>
    </div>
  );
}

function PlanSheet({
  data,
  modo,
  onClose,
}: {
  data: PlanSettings;
  modo: Modo;
  onClose: () => void;
}) {
  const correct = useCorrectPlan();
  const schedule = useSchedulePlan();

  const [income, setIncome] = useState(String(Number(data.plan.expectedMonthlyIncome)));
  const [budget, setBudget] = useState(String(Number(data.plan.monthlySpendingBudget)));
  const [savings, setSavings] = useState(String(Number(data.plan.monthlySavingsTarget)));
  const [notes, setNotes] = useState(data.plan.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const esCorreccion = modo === 'CORREGIR';
  const restante = Number(income || 0) - Number(budget || 0) - Number(savings || 0);

  const submit = async () => {
    if (restante < 0) {
      return setError('El gasto y el ahorro suman más de lo que entra: el plan tiene que caber.');
    }
    try {
      if (esCorreccion) {
        await correct.mutateAsync({
          expectedMonthlyIncome: income,
          monthlySpendingBudget: budget,
          monthlySavingsTarget: savings,
          notes: notes.trim() || null,
        });
      } else {
        await schedule.mutateAsync({
          expectedMonthlyIncome: income,
          monthlySpendingBudget: budget,
          monthlySavingsTarget: savings,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar el plan.');
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={esCorreccion ? 'Corregir el plan vigente' : 'Plan nuevo desde el próximo mes'}
      subtitle={
        esCorreccion
          ? 'Para un monto mal tecleado: no crea una versión nueva'
          : 'El plan actual se conserva cerrado, para no reescribir el pasado'
      }
      footer={
        <Button full onClick={() => void submit()} loading={correct.isPending || schedule.isPending}>
          {esCorreccion ? 'Guardar corrección' : 'Programar el plan nuevo'}
        </Button>
      }
    >
      <div className="space-y-4">
        <AmountInput value={income} onChange={setIncome} autoFocus label="Ingreso mensual esperado" />
        <AmountInput value={budget} onChange={setBudget} label="Presupuesto de gasto" />
        <AmountInput value={savings} onChange={setSavings} label="Ahorro intocable" />

        <div
          className="flex items-start gap-2.5 px-3.5 py-3 text-[12px]"
          style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)',
            color: restante < 0 ? 'var(--critical)' : 'var(--ink-2)',
          }}
        >
          <Icon name={restante < 0 ? 'siren' : 'scale'} size={15} strokeWidth={2} />
          <span>
            {restante < 0 ? (
              <>
                Te pasas por <strong>{money(Math.abs(restante), { compact: true })}</strong>: el gasto
                y el ahorro no caben en lo que entra.
              </>
            ) : (
              <>
                Quedan <strong>{money(restante, { compact: true })}</strong> sin destino. Tu estilo de
                vida está limitado al presupuesto, no al ingreso: ese es el punto del plan.
              </>
            )}
          </span>
        </div>

        <TextField
          label="Nota (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Aumento de sueldo, cambio de renta…"
        />

        {!esCorreccion && (
          <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            Entra en vigor el día 1 del mes que viene. Un plan que empieza a mitad de quincena
            partiría el ciclo en dos mitades con topes distintos.
          </p>
        )}

        {error && (
          <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

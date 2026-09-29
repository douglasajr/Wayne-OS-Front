/**
 * Cómo se mide el dinero: umbral de gasto hormiga y unidad de presupuesto.
 *
 * El cambio de ciclo **no es inmediato y la pantalla lo dice**. Los ciclos del
 * mes en curso ya existen como quincenas; un ciclo mensual del mismo mes se
 * solaparía con ellos y la base lo rechazaría. Se agenda para el día 1 del mes
 * siguiente y se aplica solo.
 */
import { useEffect, useState } from 'react';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Icon } from '@/core/components/ui/Icon';
import { ApiError } from '@/core/lib/api';
import { monthLabel } from '@/core/lib/dates';
import { money } from '@/domains/finance/shared/money';
import { useSchedulePeriodMode, useUpdatePreferences } from '@/domains/finance/shared/api';
import type { PeriodMode, PlanSettings } from '@/domains/finance/shared/types/plan';

const MODOS: { value: PeriodMode; label: string; hint: string }[] = [
  { value: 'BIWEEKLY', label: 'Quincenal', hint: 'Dos ciclos: del 1 al 15 y del 16 al fin de mes' },
  { value: 'MONTHLY', label: 'Mensual', hint: 'Un solo ciclo por mes' },
];

export function MeasurementCard({ data }: { data: PlanSettings }) {
  const preferences = useUpdatePreferences();
  const periodMode = useSchedulePeriodMode();

  const [threshold, setThreshold] = useState(String(Number(data.settings.microExpenseThreshold)));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setThreshold(String(Number(data.settings.microExpenseThreshold)));
  }, [data.settings.microExpenseThreshold]);

  const guardarUmbral = async () => {
    if (!threshold || Number(threshold) <= 0) return setError('El umbral debe ser mayor a cero.');
    try {
      await preferences.mutateAsync({ microExpenseThreshold: threshold });
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar el umbral.');
    }
  };

  const alternarAuto = async () => {
    try {
      await preferences.mutateAsync({ autoFlagMicroExpense: !data.settings.autoFlagMicroExpense });
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cambiar el ajuste.');
    }
  };

  const cambiarModo = async (modo: PeriodMode) => {
    try {
      await periodMode.mutateAsync(modo);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo programar el cambio.');
    }
  };

  const pendiente = data.settings.pendingPeriodMode;

  return (
    <Card>
      <CardTitle>Cómo se mide</CardTitle>

      <div className="mb-4">
        <label
          className="label-deco mb-1.5 block text-[9px]"
          style={{ color: 'var(--ink-muted)' }}
          htmlFor="umbral-hormiga"
        >
          Umbral de gasto hormiga
        </label>
        <div className="flex items-center gap-2">
          <input
            id="umbral-hormiga"
            className="min-w-0 flex-1 border px-3 py-2 text-sm"
            inputMode="decimal"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value.replace(/[^\d.]/g, ''))}
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--line)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--ink)',
            }}
          />
          <button
            type="button"
            className="chip shrink-0"
            onClick={() => void guardarUmbral()}
            disabled={preferences.isPending}
          >
            Guardar
          </button>
        </div>
        <p className="mt-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          Un gasto por debajo de {money(data.settings.microExpenseThreshold, { compact: true })} se
          sugiere como hormiga. Es una ayuda: siempre puedes corregirlo en el movimiento.
        </p>
      </div>

      <button
        type="button"
        className="mb-4 flex w-full items-center gap-3 border px-3.5 py-3 text-left"
        onClick={() => void alternarAuto()}
        disabled={preferences.isPending}
        aria-pressed={data.settings.autoFlagMicroExpense}
        style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius-sm)' }}
      >
        <Icon
          name={data.settings.autoFlagMicroExpense ? 'check' : 'x'}
          size={16}
          strokeWidth={2.2}
          className={data.settings.autoFlagMicroExpense ? '' : 'opacity-50'}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold">Marcar solo los gastos hormiga</span>
          <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            {data.settings.autoFlagMicroExpense ? 'Activado' : 'Desactivado'}
          </span>
        </span>
      </button>

      <div>
        <span className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
          Unidad de presupuesto
        </span>
        <div className="flex flex-wrap gap-2">
          {MODOS.map((m) => {
            const vigente = data.settings.periodMode === m.value;
            const agendado = pendiente === m.value;
            return (
              <button
                key={m.value}
                type="button"
                className="chip"
                onClick={() => void cambiarModo(m.value)}
                disabled={periodMode.isPending || (vigente && !pendiente)}
                aria-pressed={vigente}
                title={m.hint}
                style={
                  vigente || agendado
                    ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                    : undefined
                }
              >
                {m.label}
                {vigente && ' · vigente'}
                {agendado && ' · programado'}
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          {pendiente && data.settings.pendingPeriodModeFrom ? (
            <>
              El cambio a{' '}
              <strong>{MODOS.find((m) => m.value === pendiente)?.label.toLowerCase()}</strong> entra
              en vigor en {monthLabel(data.settings.pendingPeriodModeFrom)}. Pulsa el modo vigente
              para cancelarlo.
            </>
          ) : (
            <>
              Cambiarlo no es inmediato: los ciclos de este mes ya existen y se pisarían con los
              nuevos. El cambio entra el día 1 del mes siguiente.
            </>
          )}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[12px]" style={{ color: 'var(--critical)' }}>
          {error}
        </p>
      )}
    </Card>
  );
}

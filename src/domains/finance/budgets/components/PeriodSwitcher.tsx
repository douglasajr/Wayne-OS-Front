/**
 * Navegador de ciclos. Muestra SIEMPRE el rango de fechas, no solo el nombre
 * del mes: en modo quincenal "septiembre" es ambiguo y el usuario necesita
 * saber si esta mirando del 1 al 15 o del 16 al 30.
 */
import { Icon } from '@/core/components/ui/Icon';
import { shortDate } from '@/core/lib/format';
import type { BudgetPeriodInfo } from '@/domains/finance/shared/types/budget';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

interface Props {
  period: BudgetPeriodInfo;
  onStep: (direction: -1 | 1) => void;
  onToday: () => void;
  busy?: boolean;
}

export function PeriodSwitcher({ period, onStep, onToday, busy = false }: Props) {
  const month = MONTHS[period.month - 1] ?? '';
  const range = `${shortDate(period.startDate)} – ${shortDate(period.endDate)}`;

  return (
    <div className="flex items-center gap-2">
      <StepButton direction={-1} onStep={onStep} disabled={busy} />

      <div className="min-w-0 flex-1 text-center">
        <div className="label-deco truncate text-[11px]">
          {month} {period.year}
        </div>
        <div className="tabular mt-0.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          {range}
          {period.isCurrent && period.daysLeft > 0 && (
            <> · quedan {period.daysLeft} {period.daysLeft === 1 ? 'día' : 'días'}</>
          )}
        </div>
      </div>

      <StepButton direction={1} onStep={onStep} disabled={busy} />

      {!period.isCurrent && (
        <button type="button" className="chip shrink-0" onClick={onToday}>
          <Icon name="calendar" size={15} strokeWidth={2} />
          Hoy
        </button>
      )}
    </div>
  );
}

function StepButton({
  direction,
  onStep,
  disabled,
}: {
  direction: -1 | 1;
  onStep: (d: -1 | 1) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onStep(direction)}
      aria-label={direction === -1 ? 'Ciclo anterior' : 'Ciclo siguiente'}
      className="grid h-11 w-11 shrink-0 place-items-center border"
      style={{
        borderColor: 'var(--line)',
        color: 'var(--ink-2)',
        borderRadius: 'var(--radius-sm)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon name={direction === -1 ? 'chevron-left' : 'chevron-right'} size={17} strokeWidth={2.2} />
    </button>
  );
}

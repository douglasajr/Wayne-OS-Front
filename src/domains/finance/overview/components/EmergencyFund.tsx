/**
 * Fondo de emergencia.
 *
 * Los "meses de cobertura" no son un dato guardado: el backend los calcula
 * dividiendo el fondo entre el gasto promedio real. Por eso la cifra que
 * importa no es el porcentaje sino cuantos meses aguantas sin ingresos.
 */
import { Card, CardTitle } from '@/core/components/ui/Card';
import { money } from '@/domains/finance/shared/money';
import type { DashboardSummary } from '@/domains/finance/shared/types/overview';

export function EmergencyFund({ fund }: { fund: NonNullable<DashboardSummary['emergencyFund']> }) {
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
          <div className="tabular text-xl font-bold">{money(fund.current, { compact: true })}</div>
          {fund.target && (
            <div className="tabular text-xs" style={{ color: 'var(--ink-muted)' }}>
              meta {money(fund.target, { compact: true })}
            </div>
          )}

          {fund.monthsCovered !== null && (
            <div
              className="mt-3  px-3 py-2 text-xs"
              style={{ background: 'var(--surface-2)', color: 'var(--ink-2)' }}
            >
              Cubre{' '}
              <strong className="tabular" style={{ color: 'var(--ink)' }}>
                {fund.monthsCovered} {fund.monthsCovered === 1 ? 'mes' : 'meses'}
              </strong>{' '}
              de gastos{fund.monthsTarget ? ` · meta ${fund.monthsTarget}` : ''}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

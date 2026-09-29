/**
 * Suscripciones activas.
 *
 * El total ANUAL va junto al mensual a proposito: L250 al mes no duele, pero
 * L3,000 al anio si, y esa es la cifra con la que se decide cancelar algo.
 */
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Icon } from '@/core/components/ui/Icon';
import { shortDate } from '@/core/lib/format';
import { amount, money } from '@/domains/finance/shared/money';
import type { DashboardSummary } from '@/domains/finance/shared/types/overview';

export function Subscriptions({ data }: { data: DashboardSummary['subscriptions'] }) {
  return (
    <Card>
      <CardTitle
        action={
          <span className="tabular text-sm font-bold">
            {money(data.monthlyTotal, { compact: true })}
            <span className="text-[11px] font-normal" style={{ color: 'var(--ink-muted)' }}> /mes</span>
          </span>
        }
      >
        Suscripciones
      </CardTitle>

      {data.count === 0 ? (
        <p className="py-2 text-sm" style={{ color: 'var(--ink-2)' }}>
          Sin suscripciones activas.{' '}
          <Link to="/finanzas/suscripciones" style={{ color: 'var(--accent)' }}>Agregar una</Link>.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {data.upcoming.map((s) => (
            <li key={s.name} className="flex items-center gap-2.5">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center "
                style={{ background: 'var(--surface-2)', color: 'var(--ink-2)' }}
              >
                <Icon name="repeat" size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{s.name.replace(' [demo]', '')}</div>
                <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  renueva el {shortDate(s.nextRunDate)}
                </div>
              </div>
              {s.amount && <span className="tabular shrink-0 text-sm font-bold">L {amount(s.amount, true)}</span>}
            </li>
          ))}
        </ul>
      )}

      {data.count > 0 && (
        <div className="mt-3 flex items-center justify-between border-t pt-2.5" style={{ borderColor: 'var(--line)' }}>
          <span className="tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            {money(data.yearlyTotal, { compact: true })} al año
          </span>
          <Link
            to="/finanzas/suscripciones"
            className="label-deco inline-flex items-center gap-1.5 text-[9px]"
            style={{ color: 'var(--accent)' }}
          >
            Ver todas
            <Icon name="chevron-right" size={12} strokeWidth={2.4} />
          </Link>
        </div>
      )}
    </Card>
  );
}

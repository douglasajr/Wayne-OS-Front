/**
 * Movimientos recientes.
 *
 * Una transferencia se muestra con su propio signo y color neutro: no resta
 * ni suma al gasto, solo mueve dinero. Que se vea distinta de un gasto es
 * parte de enseñar la regla, no un detalle estetico.
 */
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Icon } from '@/core/components/ui/Icon';
import { Button } from '@/core/components/ui/Button';
import { useTransactionSheets } from '@/domains/finance/transactions/hooks/useTransactionSheets';
import { categoryColor } from '@/domains/finance/shared/status';
import { relativeDay } from '@/core/lib/format';
import { amount } from '@/domains/finance/shared/money';
import type { DashboardSummary } from '@/domains/finance/shared/types/overview';

export function RecentTransactions({ items }: { items: DashboardSummary['recentTransactions'] }) {
  const { openQuick } = useTransactionSheets();

  return (
    <Card>
      <CardTitle
        action={
          items.length > 0 ? (
            <Link
              to="/finanzas/movimientos"
              className="shrink-0 text-[11px] font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              Ver todos
            </Link>
          ) : undefined
        }
      >
        Movimientos recientes
      </CardTitle>

      {items.length === 0 ? (
        <div className="py-2">
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
            Aún no hay movimientos. El panel cobra sentido en cuanto registres el primero.
          </p>
          <div className="mt-3">
            <Button icon="plus" onClick={openQuick}>Registrar gasto</Button>
          </div>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {items.map((t) => {
            const isTransfer = t.type === 'TRANSFER';
            const isIncome = t.type === 'INCOME';
            // Un ajuste no es gasto ni ingreso: tono neutro como el traslado, pero con
            // signo, porque si cambia cuanto tienes.
            const isAdjustment = t.type === 'ADJUSTMENT';
            const neutral = isTransfer || isAdjustment;
            const sign = isTransfer ? '' : isAdjustment ? (t.isInflow ? '+' : '−') : isIncome ? '+' : '−';
            const tone = neutral ? 'var(--ink-2)' : isIncome ? 'var(--good)' : 'var(--ink)';

            return (
              <li key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0" style={{ borderColor: 'var(--line)' }}>
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center "
                  style={{
                    background: neutral
                      ? 'var(--surface-2)'
                      : `color-mix(in oklab, ${categoryColor(t.categoryColor)} 15%, transparent)`,
                    color: neutral ? 'var(--ink-muted)' : categoryColor(t.categoryColor),
                  }}
                >
                  {/* El icono de la categoria dice mas que una flecha: de un
                      vistazo se ve que fue comida, gasolina o salud. */}
                  <Icon
                    name={isTransfer ? 'repeat' : isAdjustment ? 'scale' : isIncome ? 'in' : (t.categoryIcon ?? 'out')}
                    size={16}
                    strokeWidth={2}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">
                      {(t.description ?? 'Sin descripción').replace(' [demo]', '')}
                    </span>
                    {t.isMicroExpense && (
                      <span title="Gasto hormiga" style={{ color: 'var(--cat-2)' }}>
                        <Icon name="ant" size={13} strokeWidth={2} />
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    {isTransfer ? 'Transferencia · no es gasto' : isAdjustment ? 'Ajuste · no es gasto' : (t.categoryName ?? 'Sin categoría')}
                    {t.accountName ? ` · ${t.accountName.replace(' [demo]', '')}` : ''}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="tabular text-sm font-bold" style={{ color: tone }}>
                    {sign}L {amount(t.amount, true)}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{relativeDay(t.date)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

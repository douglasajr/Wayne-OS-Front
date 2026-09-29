/**
 * Gastos hormiga.
 *
 * Aqui se ve por que el hormiga es un FLAG y no una categoria: la tarjeta
 * muestra el total del mes Y en que categorias se fue. Con "hormiga" como
 * categoria hermana de Alimentacion, este desglose no existiria.
 */
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Icon } from '@/core/components/ui/Icon';
import { categoryColor } from '@/domains/finance/shared/status';
import { toNumber } from '@/core/lib/format';
import { amount, money } from '@/domains/finance/shared/money';
import type { DashboardSummary } from '@/domains/finance/shared/types/overview';

export function MicroExpenses({ data }: { data: DashboardSummary['microExpenses'] }) {
  const total = toNumber(data.total);
  const hasAny = data.count > 0;

  return (
    <Card>
      <CardTitle
        action={
          <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            bajo {money(data.threshold, { compact: true })}
          </span>
        }
      >
        Gastos hormiga
      </CardTitle>

      {!hasAny ? (
        <p className="py-2 text-sm" style={{ color: 'var(--ink-2)' }}>
          Ningún gasto hormiga este mes. Los movimientos menores a{' '}
          {money(data.threshold, { compact: true })} se marcan solos.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center " style={{ background: 'var(--surface-2)', color: 'var(--cat-2)' }}>
              <Icon name="ant" size={21} />
            </span>
            <div className="min-w-0">
              <div className="figure text-[28px] leading-none">
                {money(total, { compact: true })}
              </div>
              <div className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                en {data.count} {data.count === 1 ? 'compra pequeña' : 'compras pequeñas'} este mes
              </div>
            </div>
          </div>

          {/* Barra apilada: el reparto se ve sin leer numeros. Cada segmento
              lleva su etiqueta debajo, asi el color no es el unico canal. */}
          <div className="mt-4 flex h-2 w-full gap-[2px] overflow-hidden" style={{ borderRadius: 2 }}>
            {data.breakdown.map((b) => (
              <div
                key={b.name}
                style={{
                  width: `${total > 0 ? (toNumber(b.amount) / total) * 100 : 0}%`,
                  background: categoryColor(b.color),
                  borderRadius: 4,
                }}
              />
            ))}
          </div>

          <ul className="mt-3 space-y-1.5">
            {data.breakdown.map((b) => (
              <li key={b.name} className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: categoryColor(b.color) }} />
                <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--ink-2)' }}>{b.name}</span>
                <span className="tabular font-semibold">L {amount(b.amount, true)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

/**
 * Gasto por categoria del ciclo, contra su limite.
 *
 * El punto de color identifica la categoria; la barra usa el color de ESTADO,
 * no el de la categoria. Son dos trabajos distintos: identidad vs. alerta.
 * Mezclarlos haria que "rojo" significara a la vez "Salud" y "te pasaste".
 *
 * Desde la Fase 5 tambien aparecen las categorias CON limite y sin gasto
 * todavia: un tope al 0% es informacion, no ruido, y su ausencia hacia pensar
 * que el limite no se habia guardado.
 */
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Meter } from '@/core/components/ui/Meter';
import { Icon } from '@/core/components/ui/Icon';
import { STATUS, categoryColor } from '@/domains/finance/shared/status';
import { amount } from '@/domains/finance/shared/money';
import type { CategorySpend } from '@/domains/finance/shared/types/overview';

export function CategoryBudgets({ categories }: { categories: CategorySpend[] }) {
  return (
    <Card>
      <CardTitle
        action={
          <Link
            to="/finanzas/presupuesto"
            className="label-deco inline-flex items-center gap-1.5 text-[9px]"
            style={{ color: 'var(--accent)' }}
          >
            Límites
            <Icon name="chevron-right" size={12} strokeWidth={2.4} />
          </Link>
        }
      >
        Gasto por categoría
      </CardTitle>

      {categories.length === 0 ? (
        <p className="py-2 text-sm" style={{ color: 'var(--ink-2)' }}>
          Aún no hay gastos en esta quincena.
        </p>
      ) : (
        <ul className="space-y-4">
          {categories.map((c) => {
            const meta = c.status ? STATUS[c.status] : null;
            return (
              <li key={c.categoryId}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center "
                    style={{
                      background: `color-mix(in oklab, ${categoryColor(c.color)} 16%, transparent)`,
                      color: categoryColor(c.color),
                    }}
                  >
                    <Icon name={c.icon} size={14} strokeWidth={2.1} />
                  </span>

                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.name}</span>

                  <span className="tabular shrink-0 text-sm font-bold">L {amount(c.spent, true)}</span>
                </div>

                {c.planned && meta ? (
                  <>
                    <Meter
                      percent={c.percentUsed ?? 0}
                      color={meta.color}
                      label={`${c.name}: ${Math.round(c.percentUsed ?? 0)}% del límite`}
                    />
                    <div className="mt-1 flex items-center justify-between text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                      <span className="tabular">límite L {amount(c.planned, true)}</span>
                      <span className="flex items-center gap-1 font-semibold" style={{ color: meta.color }}>
                        <Icon name={meta.icon} size={11} strokeWidth={2.6} />
                        {Math.round(c.percentUsed ?? 0)}% · {meta.label}
                      </span>
                    </div>
                  </>
                ) : (
                  <Link
                    to="/finanzas/presupuesto"
                    className="text-[11px] underline-offset-2 hover:underline"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    Sin límite definido · ponerle uno
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/**
 * Presupuesto del ciclo.
 *
 * Tres bloques, en el orden en que se responden las preguntas:
 *   1. como voy contra el tope del ciclo;
 *   2. como voy en cada categoria con limite;
 *   3. en que estoy gastando SIN limite —lo que el presupuesto no vigila, que
 *      es justo donde se escapa el dinero.
 *
 * El ciclo se crea solo al pedirlo: no existe el estado "este mes no tengo
 * presupuesto". Si nunca se configuro nada, se hereda el reparto del plan.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { EmptyState } from '@/core/components/ui/EmptyState';
import { categoryColor } from '@/domains/finance/shared/status';
import { ApiError } from '@/core/lib/api';
import { amount, money } from '@/domains/finance/shared/money';
import { useBudget } from '@/domains/finance/shared/api';
import type { BudgetLine } from '@/domains/finance/shared/types/budget';
import { usePeriodNavigation } from '../hooks/usePeriodNavigation';
import { PeriodSwitcher } from '../components/PeriodSwitcher';
import { BudgetHero } from '../components/BudgetHero';
import { BudgetLineRow } from '../components/BudgetLineRow';
import { BudgetLineSheet } from '../components/BudgetLineSheet';
import { PeriodAmountSheet } from '../components/PeriodAmountSheet';

export function BudgetPage() {
  const { selector, step, reset } = usePeriodNavigation();
  const query = useBudget(selector);

  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);
  const [presetCategoryId, setPresetCategoryId] = useState<string | undefined>();
  const [lineSheetOpen, setLineSheetOpen] = useState(false);
  const [amountSheetOpen, setAmountSheetOpen] = useState(false);

  const view = query.data;

  const openNewLine = (categoryId?: string) => {
    setEditingLine(null);
    setPresetCategoryId(categoryId);
    setLineSheetOpen(true);
  };

  const openEditLine = (line: BudgetLine) => {
    setEditingLine(line);
    setPresetCategoryId(undefined);
    setLineSheetOpen(true);
  };

  if (query.isLoading) {
    return (
      <div className="space-y-3.5">
        <Skeleton height={52} />
        <Skeleton height={220} />
        <Skeleton height={180} />
      </div>
    );
  }

  if (query.error || !view) {
    return (
      <Card className="mt-6 text-center">
        <p role="alert" className="text-sm" style={{ color: 'var(--critical)' }}>
          {query.error instanceof ApiError
            ? query.error.message
            : 'No se pudo cargar el presupuesto.'}
        </p>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        </div>
      </Card>
    );
  }

  const closed = view.period.closedAt !== null;

  return (
    <div className="space-y-3.5 lg:space-y-4">
      <PeriodSwitcher
        period={view.period}
        onStep={(d) => step(view.period, d)}
        onToday={reset}
        busy={query.isFetching}
      />

      {closed && (
        <div
          className="flex items-center gap-2 border px-3.5 py-3 text-[12px]"
          style={{
            borderColor: 'color-mix(in oklab, var(--serious) 34%, transparent)',
            background: 'color-mix(in oklab, var(--serious) 10%, transparent)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--serious)',
          }}
        >
          <Icon name="archive" size={15} strokeWidth={2.2} />
          Ciclo cerrado. Lo que se aprende de él se aplica al siguiente, no se reescribe aquí.
        </div>
      )}

      <BudgetHero view={view} onEditAmount={() => setAmountSheetOpen(true)} />

      <Card>
        <CardTitle
          action={
            !closed && (
              <button
                type="button"
                onClick={() => openNewLine()}
                className="label-deco inline-flex items-center gap-1.5 text-[9px]"
                style={{ color: 'var(--accent)' }}
              >
                <Icon name="plus" size={12} strokeWidth={2.4} />
                Límite
              </button>
            )
          }
        >
          Límites por categoría
        </CardTitle>

        {view.lines.length === 0 ? (
          <EmptyState
            icon="target"
            title="Sin límites todavía"
            description="Un tope por categoría convierte el presupuesto en algo que avisa antes, no después. Empieza por donde más se te va: alimentación o transporte."
            action={
              !closed && (
                <Button icon="plus" onClick={() => openNewLine()}>
                  Poner el primero
                </Button>
              )
            }
          />
        ) : (
          <ul className="space-y-4">
            {view.lines.map((line) => (
              <BudgetLineRow key={line.id} line={line} onEdit={() => openEditLine(line)} />
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Gasto sin límite</CardTitle>

        {view.unbudgeted.length === 0 ? (
          <p className="py-2 text-sm" style={{ color: 'var(--ink-2)' }}>
            Todo el gasto de este ciclo cae en una categoría con límite.
          </p>
        ) : (
          <>
            <p className="mb-3 text-[12px]" style={{ color: 'var(--ink-2)' }}>
              Aquí se te está yendo dinero que ningún tope está vigilando.
            </p>
            <ul className="space-y-1">
              {view.unbudgeted.map((c) => (
                <li key={c.categoryId}>
                  <button
                    type="button"
                    disabled={closed}
                    onClick={() => openNewLine(c.categoryId)}
                    className="flex w-full items-center gap-2.5 py-2 text-left"
                  >
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center"
                      style={{
                        background: `color-mix(in oklab, ${categoryColor(c.color)} 16%, transparent)`,
                        color: categoryColor(c.color),
                      }}
                    >
                      <Icon name={c.icon} size={14} strokeWidth={2.1} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.name}</span>
                    <span className="tabular shrink-0 text-sm font-bold">L {amount(c.spent, true)}</span>
                    {!closed && (
                      <Icon name="chevron-right" size={15} strokeWidth={2.2} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <CardTitle>Categorías</CardTitle>
        <p className="text-[13px]" style={{ color: 'var(--ink-2)' }}>
          Los límites se ponen sobre las categorías principales. Para crear,
          renombrar u ocultar categorías y subcategorías:
        </p>
        <div className="mt-3">
          <Link to="/finanzas/categorias" className="chip">
            <Icon name="list" size={15} strokeWidth={2} />
            Editar categorías
          </Link>
        </div>
      </Card>

      <p className="px-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        El gasto real nunca incluye traslados entre tus cuentas, pagos de tarjeta
        ni aportes a ahorro: mover dinero no es gastarlo. Tope del ciclo:{' '}
        {money(view.totals.planned, { compact: true })}.
      </p>

      <BudgetLineSheet
        open={lineSheetOpen}
        onClose={() => setLineSheetOpen(false)}
        selector={selector}
        editing={editingLine}
        presetCategoryId={presetCategoryId}
        usedCategoryIds={view.lines.map((l) => l.categoryId)}
        unallocated={view.totals.unallocated}
      />

      <PeriodAmountSheet
        open={amountSheetOpen}
        onClose={() => setAmountSheetOpen(false)}
        selector={selector}
        view={view}
      />
    </div>
  );
}

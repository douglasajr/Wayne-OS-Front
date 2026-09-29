/**
 * Movimientos.
 *
 * Dos decisiones gobiernan esta pantalla:
 *
 *  1. Los totales NUNCA se suman entre si. Gasto, ingreso y traslado se
 *     muestran en tres cifras separadas. Un "neto" mezclaria consumo con
 *     dinero que solo cambio de cuenta y daria una cifra que no significa
 *     nada (reglas 1 y 4).
 *  2. Los totales corresponden al FILTRO COMPLETO, no a la pagina visible. El
 *     backend los calcula sobre el conjunto entero; sumarlos en el cliente
 *     daria el total de veinticinco filas y el usuario creeria que gasto menos.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { EmptyState } from '@/core/components/ui/EmptyState';
import { ApiError } from '@/core/lib/api';
import { amount, money } from '@/domains/finance/shared/money';
import { longDate } from '@/core/lib/dates';
import { useAccounts, useTransactions } from '@/domains/finance/shared/api';
import { useDebounced } from '@/core/hooks/useDebounced';
import type { Transaction } from '@/domains/finance/shared/types/domain';
import { useTransactionSheets } from '../hooks/useTransactionSheets';
import { TransactionFilters, initialFilters, type FiltersState } from '../components/TransactionFilters';
import { TransactionRow } from '../components/TransactionRow';
import { TransactionDetailSheet } from '../components/TransactionDetailSheet';

const PAGE_SIZE = 25;

export function TransactionsPage() {
  const { openQuick, openFull, openEdit } = useTransactionSheets();
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const accounts = useAccounts();
  const search = useDebounced(filters.search.trim());

  // Cambiar un filtro y quedarse en la pagina 7 deja una lista vacia que
  // parece un error. Siempre se vuelve al principio.
  useEffect(() => {
    setPage(1);
  }, [filters.type, filters.accountId, filters.from, filters.to, filters.onlyMicro, search]);

  const query = useTransactions({
    page,
    pageSize: PAGE_SIZE,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.accountId ? { accountId: filters.accountId } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    ...(filters.onlyMicro ? { isMicroExpense: true } : {}),
    ...(search ? { search } : {}),
  });

  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  // Agrupado por dia: en una lista larga, la fecha repetida en cada fila es
  // ruido; como encabezado, orienta.
  const groups = useMemo(() => {
    const byDay = new Map<string, Transaction[]>();
    for (const tx of items) {
      const bucket = byDay.get(tx.date);
      if (bucket) bucket.push(tx);
      else byDay.set(tx.date, [tx]);
    }
    return [...byDay.entries()];
  }, [items]);

  const hasFilters =
    Boolean(filters.type || filters.accountId || filters.onlyMicro || search) ||
    Boolean(filters.from || filters.to);

  return (
    <div className="space-y-3.5 lg:space-y-4">
      <Card>
        <TransactionFilters
          value={filters}
          onChange={setFilters}
          accounts={accounts.data?.accounts ?? []}
        />
      </Card>

      {meta && <Totals meta={meta} />}

      <Card>
        {query.isLoading ? (
          <div className="space-y-2.5">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={52} />)}
          </div>
        ) : query.error ? (
          <p role="alert" className="py-6 text-center text-sm" style={{ color: 'var(--critical)' }}>
            {query.error instanceof ApiError ? query.error.message : 'No se pudieron cargar los movimientos.'}
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={hasFilters ? 'search' : 'inbox'}
            title={hasFilters ? 'Nada con esos filtros' : 'Todavía no hay movimientos'}
            description={
              hasFilters
                ? 'Prueba con otro periodo o quita algún filtro.'
                : 'Registra tu primer gasto y el panel empezará a tener sentido.'
            }
            action={
              hasFilters ? (
                <Button variant="ghost" onClick={() => setFilters(initialFilters())}>
                  Restablecer filtros
                </Button>
              ) : (
                <Button icon="plus" onClick={openQuick}>
                  Registrar gasto
                </Button>
              )
            }
          />
        ) : (
          <>
            {groups.map(([date, rows]) => (
              <section key={date} className="mb-1 last:mb-0">
                <div
                  className="label-deco flex items-baseline justify-between gap-3 border-b py-2 text-[9px]"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink-muted)' }}
                >
                  <span>{longDate(date)}</span>
                  <span className="tabular">{dayLabel(rows)}</span>
                </div>
                <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
                  {rows.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} onSelect={setSelected} />
                  ))}
                </ul>
              </section>
            ))}

            {meta && meta.totalPages > 1 && (
              <nav className="mt-4 flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
                <Button
                  variant="ghost"
                  icon="chevron-left"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="tabular text-[12px]" style={{ color: 'var(--ink-muted)' }}>
                  {meta.page} / {meta.totalPages}
                </span>
                <Button
                  variant="ghost"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                  <Icon name="chevron-right" size={16} strokeWidth={2.1} />
                </Button>
              </nav>
            )}
          </>
        )}
      </Card>

      {/* En escritorio no existe la barra inferior con el botón central, así
          que el acceso al registro tiene que estar también aquí. */}
      <div className="hidden gap-2 lg:flex">
        <Button icon="plus" onClick={openQuick}>Registrar gasto</Button>
        <Button variant="ghost" icon="in" onClick={() => openFull('INCOME')}>Ingreso</Button>
        <Button variant="ghost" icon="repeat" onClick={() => openFull('TRANSFER')}>Traslado</Button>
      </div>

      <TransactionDetailSheet
        transaction={selected}
        onClose={() => setSelected(null)}
        onEdit={(tx) => {
          setSelected(null);
          openEdit(tx);
        }}
      />
    </div>
  );
}

/** Resumen del dia: solo se muestra lo que hubo, sin inventar un neto. */
function dayLabel(rows: Transaction[]): string {
  const sum = (type: Transaction['type']) =>
    rows.filter((r) => r.type === type).reduce((acc, r) => acc + Number(r.amount), 0);

  const parts: string[] = [];
  const spent = sum('EXPENSE');
  const earned = sum('INCOME');
  if (spent > 0) parts.push(`−L ${amount(spent, true)}`);
  if (earned > 0) parts.push(`+L ${amount(earned, true)}`);
  return parts.join('  ');
}

function Totals({ meta }: { meta: NonNullable<ReturnType<typeof useTransactions>['data']>['meta'] }) {
  const cells = [
    { label: 'Gastado', value: meta.totals.expense, color: 'var(--ink)' },
    { label: 'Ingresado', value: meta.totals.income, color: 'var(--good)' },
    { label: 'Trasladado', value: meta.totals.transfer, color: 'var(--ink-2)' },
  ];

  return (
    <Card>
      <div className="grid grid-cols-3 gap-3">
        {cells.map((c) => (
          <div key={c.label}>
            <div className="label-deco text-[9px]" style={{ color: 'var(--ink-muted)' }}>
              {c.label}
            </div>
            <div className="figure tabular mt-1 text-lg leading-none" style={{ color: c.color }}>
              {money(c.value, { compact: true })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t pt-2.5 text-[11px]" style={{ borderColor: 'var(--line)', color: 'var(--ink-muted)' }}>
        {meta.total} movimiento{meta.total === 1 ? '' : 's'} en el filtro. Los traslados se muestran aparte
        porque no son gasto.
      </p>
    </Card>
  );
}

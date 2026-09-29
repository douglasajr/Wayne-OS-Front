/**
 * Reportes.
 *
 * El Command Center responde "¿cómo voy hoy?"; esta pantalla responde "¿qué ha
 * pasado?". Por eso aquí no hay semáforos de urgencia ni botones de acción:
 * todo tiene eje temporal y se lee, no se actúa.
 *
 * Orden por la pregunta que responde cada bloque:
 *   1. ¿vivo dentro de mis medios?        -> flujo mensual
 *   2. ¿qué subió?                        -> categorías en el tiempo
 *   3. ¿cumplo el presupuesto?            -> ciclos cerrados
 *   4. ¿cuánto se va en gastos hormiga?
 *   5. ¿voy hacia arriba?                 -> patrimonio neto
 */
import { useState } from 'react';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { EmptyState } from '@/core/components/ui/EmptyState';
import { StatusPill } from '@/domains/finance/shared/components/StatusPill';
import { Meter } from '@/core/components/ui/Meter';
import { Icon, type IconName } from '@/core/components/ui/Icon';
import { ApiError } from '@/core/lib/api';
import { monthLabel } from '@/core/lib/dates';
import { toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import { categoryColor, STATUS } from '@/domains/finance/shared/status';
import { useReports } from '@/domains/finance/shared/api';
import type { ReportsView } from '@/domains/finance/shared/types/reports';
import { AreaLine, Delta, GroupedBars, Sparkbars } from '../components/charts';

const RANGOS = [3, 6, 12] as const;

export function ReportsPage() {
  const [months, setMonths] = useState<number>(6);
  const query = useReports(months);

  if (query.isLoading) {
    return (
      <div className="space-y-3.5">
        <Skeleton height={260} />
        <Skeleton height={220} />
      </div>
    );
  }

  if (query.error) {
    return (
      <Card className="mt-6 text-center">
        <p role="alert" className="text-sm" style={{ color: 'var(--critical)' }}>
          {query.error instanceof ApiError ? query.error.message : 'No se pudieron cargar los reportes.'}
        </p>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        </div>
      </Card>
    );
  }

  const data = query.data;
  if (!data) return null;

  const selector = (
    <div className="flex items-center gap-2">
      {RANGOS.map((r) => (
        <button
          key={r}
          type="button"
          className="chip"
          onClick={() => setMonths(r)}
          aria-pressed={months === r}
          style={months === r ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
        >
          {r} meses
        </button>
      ))}
    </div>
  );

  if (data.range.months === 0) {
    return (
      <div className="space-y-3.5">
        <div className="flex justify-end px-1">{selector}</div>
        <Card>
          <EmptyState
            icon="chart"
            title="Todavía no hay nada que reportar"
            description="Los reportes se construyen sobre tus movimientos. Registra gastos e ingresos durante un mes y aquí aparecerá la evolución: sin datos reales detrás, una gráfica plana sería un adorno."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 lg:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          {monthLabel(data.range.from)} — {monthLabel(data.range.to)}
          {data.range.truncated && ` · tu historial empieza aquí, no hay ${data.range.requestedMonths} meses todavía`}
        </p>
        {selector}
      </div>

      <FlowCard data={data} />
      <CategoriesCard data={data} />

      <div className="grid gap-3.5 lg:grid-cols-2 lg:gap-4">
        <BudgetCard data={data} />
        <MicroCard data={data} />
      </div>

      <NetWorthCard data={data} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function FlowCard({ data }: { data: ReportsView }) {
  const { months, averages } = data.flow;
  const partial = months.map((m) => m.isPartial);

  return (
    <Card>
      <CardTitle>Entra, sale, queda</CardTitle>

      <GroupedBars
        title="Ingreso, gasto y ahorro de cada mes"
        months={months.map((m) => m.label)}
        partial={partial}
        series={[
          { key: 'income', label: 'Ingreso', color: 'var(--good)', values: months.map((m) => toNumber(m.income)) },
          { key: 'expense', label: 'Gasto', color: 'var(--serious)', values: months.map((m) => toNumber(m.expense)) },
          { key: 'saved', label: 'Ahorro', color: 'var(--accent)', values: months.map((m) => toNumber(m.saved)) },
        ]}
      />

      {averages && (
        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          {[
            ['Ingreso medio', averages.income],
            ['Gasto medio', averages.expense],
            ['Ahorro medio', averages.saved],
          ].map(([label, value]) => (
            <div key={label} className="px-3 py-2" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
              <div className="label-deco text-[9px]" style={{ color: 'var(--ink-muted)' }}>{label}</div>
              <div className="tabular text-sm font-semibold">{money(value!, { compact: true })}</div>
            </div>
          ))}
        </div>
      )}

      <ul className="mt-3 space-y-1.5">
        {months.map((m) => {
          const leftover = toNumber(m.leftover);
          return (
            <li key={m.label} className="flex items-center justify-between gap-3 text-[12px]">
              <span style={{ color: 'var(--ink-2)' }}>
                {monthLabel(m.label)}
                {m.isPartial && <span style={{ color: 'var(--ink-muted)' }}> · en curso</span>}
              </span>
              <span className="tabular" style={{ color: leftover < 0 ? 'var(--critical)' : 'var(--ink-2)' }}>
                {leftover < 0 ? 'faltaron ' : 'sobraron '}
                {money(Math.abs(leftover), { compact: true })}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-2.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        «Sobró» es lo que no se gastó ni se apartó. El ahorro no cuenta como gasto: cambia de
        bolsillo, no se va.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function CategoriesCard({ data }: { data: ReportsView }) {
  const { months, rows } = data.categories;

  if (rows.length === 0) {
    return (
      <Card>
        <CardTitle>En qué se va</CardTitle>
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Todavía no hay gasto con categoría en este rango.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <CardTitle>En qué se va</CardTitle>
        <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          último mes cerrado vs. anterior
        </span>
      </div>

      <ul className="space-y-2.5">
        {rows.map((row) => {
          const color = categoryColor(row.color);
          return (
            <li key={row.categoryId} className="flex items-center gap-3">
              <span
                className="grid h-7 w-7 shrink-0 place-items-center"
                style={{
                  background: `color-mix(in oklab, ${color} 16%, transparent)`,
                  color,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Icon name={(row.icon ?? 'ellipsis') as IconName} size={14} strokeWidth={2} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm">{row.name}</span>
                  <span className="tabular shrink-0 text-sm font-semibold">
                    {money(row.total, { compact: true })}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <Delta amount={row.deltaAmount} percent={row.deltaPercent} />
                  <span className="tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    {/* Una media de cero junto a un total de L1,500 parece un
                        error: es una categoria que solo aparece en el mes en
                        curso, y todavia no tiene meses cerrados que promediar. */}
                    {toNumber(row.average) === 0 && toNumber(row.total) > 0
                      ? 'solo este mes'
                      : `media ${money(row.average, { compact: true })}/mes`}
                  </span>
                </span>
              </span>

              <Sparkbars
                values={row.byMonth.map(toNumber)}
                color={color}
                label={`${row.name}: ${months.map((m, i) => `${monthLabel(m)} ${row.byMonth[i]}`).join(', ')}`}
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function BudgetCard({ data }: { data: ReportsView }) {
  const { periods, exceeded, closed } = data.budget;

  return (
    <Card>
      <CardTitle>Cumplimiento del presupuesto</CardTitle>

      {closed > 0 ? (
        <p className="mb-3 text-[12px]" style={{ color: 'var(--ink-2)' }}>
          {exceeded === 0 ? (
            <>Ningún ciclo cerrado se pasó del tope. <strong>{closed} de {closed}</strong> en control.</>
          ) : (
            <>
              Te pasaste en <strong>{exceeded}</strong> de {closed} ciclos cerrados.
            </>
          )}
        </p>
      ) : (
        <p className="mb-3 text-[12px]" style={{ color: 'var(--ink-muted)' }}>
          Ningún ciclo ha cerrado todavía en este rango.
        </p>
      )}

      {periods.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          No hay ciclos presupuestales en este rango.
        </p>
      ) : (
        <ul className="space-y-3">
          {periods.map((period) => (
            <li key={period.label}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="tabular text-[12px]">{period.label}</span>
                <span className="tabular text-[12px]" style={{ color: 'var(--ink-2)' }}>
                  {money(period.spent, { compact: true })}{' '}
                  <span style={{ color: 'var(--ink-muted)' }}>de {money(period.planned, { compact: true })}</span>
                </span>
              </div>
              <div className="mt-1.5">
                <Meter
                  percent={period.percentUsed}
                  color={STATUS[period.status].color}
                  label={`${period.label}: ${Math.round(period.percentUsed)}% del tope`}
                />
              </div>
              <div className="mt-1 flex justify-end">
                <StatusPill status={period.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------

function MicroCard({ data }: { data: ReportsView }) {
  const { months, total, count, shareOfExpense } = data.microExpenses;

  return (
    <Card>
      <CardTitle>Gastos hormiga</CardTitle>

      <div className="tabular text-2xl font-bold">{money(total, { compact: true })}</div>
      <p className="mt-1 text-[12px]" style={{ color: 'var(--ink-muted)' }}>
        en {count} compras pequeñas · {Math.round(shareOfExpense)}% de todo lo que gastaste
      </p>

      <div className="mt-3">
        <GroupedBars
          title="Gasto hormiga de cada mes"
          height={120}
          months={months.map((m) => m.label)}
          partial={months.map((m) => m.isPartial)}
          series={[
            {
              key: 'micro',
              label: 'Gasto hormiga',
              color: 'var(--warning)',
              values: months.map((m) => toNumber(m.total)),
            },
          ]}
        />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function NetWorthCard({ data }: { data: ReportsView }) {
  const { months, change } = data.netWorth;
  const last = months[months.length - 1];
  const subiendo = change ? toNumber(change.amount) >= 0 : true;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <CardTitle>Patrimonio neto</CardTitle>
        {change && (
          <span
            className="tabular shrink-0 text-[12px]"
            style={{ color: subiendo ? 'var(--good)' : 'var(--critical)' }}
          >
            {subiendo ? '↑' : '↓'} {money(Math.abs(toNumber(change.amount)), { compact: true })}
            {change.percent !== null && ` (${Math.round(change.percent)}%)`}
          </span>
        )}
      </div>

      {last && (
        <div className="mb-3">
          <div className="tabular text-2xl font-bold">{money(last.netWorth, { compact: true })}</div>
          <p className="tabular mt-1 text-[12px]" style={{ color: 'var(--ink-muted)' }}>
            {money(last.assets, { compact: true })} en cuentas − {money(last.liabilities, { compact: true })} de deuda
          </p>
        </div>
      )}

      <AreaLine
        title="Patrimonio neto mes a mes"
        months={months.map((m) => m.label)}
        partial={months.map((m) => m.isPartial)}
        values={months.map((m) => toNumber(m.netWorth))}
        color={subiendo ? 'var(--good)' : 'var(--serious)'}
      />

      <p className="mt-2.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        Se calcula desde tus movimientos, no es una foto guardada: si corriges un gasto de hace dos
        meses, esta línea se corrige sola. Pagar la tarjeta o aportar al ahorro no la mueven —
        cambian de bolsillo, no de patrimonio.
      </p>
    </Card>
  );
}

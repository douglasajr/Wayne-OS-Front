/**
 * Inversiones.
 *
 * Dos preguntas, en este orden:
 *   1. ¿cuánto tengo invertido y cuánto ha ganado?
 *   2. ¿qué posiciones lo componen y cuál llevo sin valuar?
 *
 * La tarjeta de arriba insiste en algo que es fácil malentender: de lo que ves
 * aquí, el patrimonio solo suma la plusvalía de las posiciones con cuenta —su
 * capital ya está contado en el saldo— más el valor entero de las que no la
 * tienen. Sin esa distinción, el patrimonio se contaría dos veces.
 */
import { useState } from 'react';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { EmptyState } from '@/core/components/ui/EmptyState';
import { Icon } from '@/core/components/ui/Icon';
import { ApiError } from '@/core/lib/api';
import { toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import { useInvestments } from '@/domains/finance/shared/api';
import type { Investment } from '@/domains/finance/shared/types/investments';
import { InvestmentCard } from '../components/InvestmentCard';
import { InvestmentSheet } from '../components/InvestmentSheet';
import { ValuationSheet } from '../components/ValuationSheet';
import {
  InvestmentMovementSheet,
  type InvestmentMovementKind,
} from '../components/InvestmentMovementSheet';

export function InvestmentsPage() {
  const query = useInvestments();
  const [valuing, setValuing] = useState<Investment | null>(null);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [creating, setCreating] = useState(false);
  const [movement, setMovement] = useState<{
    investment: Investment;
    kind: InvestmentMovementKind;
  } | null>(null);

  if (query.isLoading) {
    return (
      <div className="space-y-3.5">
        <Skeleton height={220} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (query.error) {
    return (
      <Card className="mt-6 text-center">
        <p role="alert" className="text-sm" style={{ color: 'var(--critical)' }}>
          {query.error instanceof ApiError ? query.error.message : 'No se pudo cargar la cartera.'}
        </p>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        </div>
      </Card>
    );
  }

  const data = query.data;
  if (!data) return null;

  const activas = data.investments.filter((i) => i.isActive);
  const cerradas = data.investments.filter((i) => !i.isActive);
  const gain = toNumber(data.totals.gain);

  if (activas.length === 0 && cerradas.length === 0) {
    return (
      <div className="space-y-3.5">
        <Card>
          <EmptyState
            icon="chart"
            title="Sin inversiones registradas"
            description="Una inversión puede ser un ETF en tu casa de bolsa, cripto en un exchange, un terreno o un negocio. Registra lo que ya tienes: el valor lo pones tú y queda con fecha, para poder ver cómo evoluciona."
            action={
              <button type="button" className="chip" onClick={() => setCreating(true)}>
                <Icon name="plus" size={15} strokeWidth={2} />
                Registrar la primera
              </button>
            }
          />
        </Card>
        <InvestmentSheet investment={null} open={creating} onClose={() => setCreating(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-3.5 lg:space-y-4">
      <Card>
        <CardTitle>Tu cartera</CardTitle>

        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="tabular text-3xl font-bold">{money(data.totals.value, { compact: true })}</div>
            <div className="tabular mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
              sobre {money(data.totals.invested, { compact: true })} invertidos
            </div>
          </div>
          <div
            className="tabular text-right text-lg font-bold"
            style={{ color: gain > 0 ? 'var(--good)' : gain < 0 ? 'var(--critical)' : 'var(--ink-muted)' }}
          >
            {gain > 0 ? '↑' : gain < 0 ? '↓' : '='} {money(Math.abs(gain), { compact: true })}
            <div className="text-[11px] font-normal">
              {gain === 0 ? 'sin cambio' : `${Math.abs(Math.round(data.totals.gainPercent))}% de ganancia`}
            </div>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <div className="px-3 py-2" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
            <div className="label-deco text-[9px]" style={{ color: 'var(--ink-muted)' }}>
              Suma al patrimonio
            </div>
            <div className="tabular text-sm font-semibold">
              {money(data.netWorthContribution.total, { compact: true })}
            </div>
          </div>
          <div className="px-3 py-2" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
            <div className="label-deco text-[9px]" style={{ color: 'var(--ink-muted)' }}>
              Posiciones
            </div>
            <div className="tabular text-sm font-semibold">{data.totals.count}</div>
          </div>
        </div>

        <p className="mt-3 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          Tu patrimonio no suma los {money(data.totals.value, { compact: true })} otra vez: el
          capital que está en cuentas ya cuenta como saldo, así que solo se añade la plusvalía
          ({money(data.netWorthContribution.unrealizedGain, { compact: true })})
          {toNumber(data.netWorthContribution.standaloneValue) > 0 && (
            <>
              {' '}y el valor de lo que no vive en ninguna cuenta (
              {money(data.netWorthContribution.standaloneValue, { compact: true })})
            </>
          )}
          .
        </p>

        {data.staleCount > 0 && (
          <p className="mt-2 text-[11px]" style={{ color: 'var(--warning)' }}>
            {data.staleCount === 1
              ? 'Una posición lleva más de tres meses sin valuar.'
              : `${data.staleCount} posiciones llevan más de tres meses sin valuar.`}{' '}
            La ganancia que ves es tan vieja como su último valor.
          </p>
        )}
      </Card>

      <div className="flex items-center justify-between px-1">
        <h2 className="label-deco text-[10px]" style={{ color: 'var(--ink-muted)' }}>
          Posiciones
        </h2>
        <button type="button" className="chip" onClick={() => setCreating(true)}>
          <Icon name="plus" size={14} strokeWidth={2.4} />
          Nueva inversión
        </button>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2 lg:gap-4">
        {activas.map((investment) => (
          <InvestmentCard
            key={investment.id}
            investment={investment}
            onValue={setValuing}
            onEdit={setEditing}
            onContribute={(i) => setMovement({ investment: i, kind: 'CONTRIBUTE' })}
            onWithdraw={(i) => setMovement({ investment: i, kind: 'WITHDRAW' })}
          />
        ))}
      </div>

      {cerradas.length > 0 && (
        <Card>
          <CardTitle>Posiciones cerradas</CardTitle>
          <ul className="space-y-1.5">
            {cerradas.map((investment) => (
              <li key={investment.id} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="min-w-0 truncate" style={{ color: 'var(--ink-2)' }}>{investment.name}</span>
                <span className="tabular shrink-0" style={{ color: 'var(--ink-muted)' }}>
                  último valor {money(investment.currentValue, { compact: true })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="px-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        La ganancia es simple: valor menos capital. No es rentabilidad anualizada ni pondera cuánto
        tiempo lleva dentro cada aporte, así que con aportes en fechas distintas favorece al dinero
        más antiguo.
      </p>

      <ValuationSheet investment={valuing} onClose={() => setValuing(null)} />
      <InvestmentMovementSheet
        investment={movement?.investment ?? null}
        kind={movement?.kind ?? 'CONTRIBUTE'}
        onClose={() => setMovement(null)}
      />
      <InvestmentSheet investment={editing} open={editing !== null} onClose={() => setEditing(null)} />
      <InvestmentSheet investment={null} open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

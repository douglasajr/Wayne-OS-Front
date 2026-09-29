/**
 * Ahorro.
 *
 * La pantalla responde tres preguntas en ese orden:
 *   1. ¿aparté este mes lo que el plan dice?   -> SavingsMonthCard
 *   2. ¿cuánto aguanto sin ingresos?           -> fondo de emergencia
 *   3. ¿cómo van mis objetivos?                -> las tarjetas de abajo
 *
 * Nada de lo que pasa aquí toca el presupuesto del ciclo: el tope de gasto
 * sale de los L15,000 del plan, no de los L20,000 de ingreso, así que el
 * ahorro ya estaba descontado desde el principio. Volver a restarlo sería
 * contarlo dos veces.
 */
import { useState } from 'react';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { EmptyState } from '@/core/components/ui/EmptyState';
import { Icon } from '@/core/components/ui/Icon';
import { ApiError } from '@/core/lib/api';
import { money } from '@/domains/finance/shared/money';
import { toNumber } from '@/core/lib/format';
import { useSavings } from '@/domains/finance/shared/api';
import type { SavingsGoal } from '@/domains/finance/shared/types/savings';
import { SavingsMonthCard } from '../components/SavingsMonthCard';
import { EmergencyFundPanel } from '../components/EmergencyFundPanel';
import { GoalCard } from '../components/GoalCard';
import { GoalSheet } from '../components/GoalSheet';
import { MovementSheet, type MovementKind } from '../components/MovementSheet';

export function SavingsPage() {
  const query = useSavings();
  const [movement, setMovement] = useState<{ goal: SavingsGoal; kind: MovementKind } | null>(null);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [creating, setCreating] = useState(false);

  if (query.isLoading) {
    return (
      <div className="space-y-3.5">
        <Skeleton height={240} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (query.error) {
    return (
      <Card className="mt-6 text-center">
        <p role="alert" className="text-sm" style={{ color: 'var(--critical)' }}>
          {query.error instanceof ApiError ? query.error.message : 'No se pudo cargar el ahorro.'}
        </p>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        </div>
      </Card>
    );
  }

  const data = query.data;
  if (!data) return null;

  const contribute = (goal: SavingsGoal) => setMovement({ goal, kind: 'CONTRIBUTE' });
  const withdraw = (goal: SavingsGoal) => setMovement({ goal, kind: 'WITHDRAW' });

  const activeGoals = data.goals.filter((g) => g.isActive);
  const sharedAccounts = data.accounts.filter((a) => toNumber(a.unallocated) !== 0);

  return (
    <div className="space-y-3.5 lg:space-y-4">
      <SavingsMonthCard month={data.month} totalSaved={data.totals.saved} />

      {data.emergencyFund && (
        <EmergencyFundPanel
          fund={data.emergencyFund}
          averageMonthlySpend={data.averageMonthlySpend}
          onContribute={contribute}
          onWithdraw={withdraw}
          onEdit={setEditing}
        />
      )}

      <div className="flex items-center justify-between px-1">
        <h2 className="label-deco text-[10px]" style={{ color: 'var(--ink-muted)' }}>
          Objetivos
        </h2>
        <button type="button" className="chip" onClick={() => setCreating(true)}>
          <Icon name="plus" size={14} strokeWidth={2.4} />
          Nuevo objetivo
        </button>
      </div>

      {activeGoals.length === 0 ? (
        <Card>
          <EmptyState
            icon="target"
            title="Sin objetivos de ahorro"
            description="Un objetivo es una etiqueta sobre el dinero que ya tienes guardado: le pone nombre y ritmo. Puedes tener varios en la misma cuenta."
            action={
              <button type="button" className="chip" onClick={() => setCreating(true)}>
                <Icon name="plus" size={15} strokeWidth={2} />
                Crear el primero
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3.5 lg:grid-cols-2 lg:gap-4">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onContribute={contribute}
              onWithdraw={withdraw}
              onEdit={setEditing}
            />
          ))}
        </div>
      )}

      {sharedAccounts.length > 0 && (
        <Card>
          <CardTitle>Dinero sin objetivo</CardTitle>
          <p className="mb-3 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            Varios objetivos pueden vivir en la misma cuenta. Esto es lo que hay ahí dentro sin
            dueño asignado — el dinero invertido no cuenta: ya tiene destino.
          </p>
          <ul className="space-y-2">
            {sharedAccounts.map((account) => (
              <li key={account.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{account.name}</span>
                  {toNumber(account.invested) > 0 && (
                    <span className="tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                      {money(account.invested, { compact: true })} invertidos
                    </span>
                  )}
                </span>
                <span className="tabular shrink-0 font-semibold">
                  {money(account.unallocated, { compact: true })}
                  <span className="ml-1 text-[11px] font-normal" style={{ color: 'var(--ink-muted)' }}>
                    de {money(account.balance, { compact: true })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="px-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        Aportar y retirar mueven dinero entre tus cuentas: ninguno de los dos cuenta como gasto ni
        consume presupuesto. Si retiras para pagar algo, el gasto se registra al pagarlo.
      </p>

      <MovementSheet
        goal={movement?.goal ?? null}
        kind={movement?.kind ?? 'CONTRIBUTE'}
        onClose={() => setMovement(null)}
      />
      <GoalSheet goal={editing} open={editing !== null} onClose={() => setEditing(null)} />
      <GoalSheet goal={null} open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

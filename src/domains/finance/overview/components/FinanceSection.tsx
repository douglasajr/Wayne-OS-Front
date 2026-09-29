/**
 * Seccion FINANCE del Command Center.
 *
 * Antes era `DashboardPage`, la pantalla completa. En la Fase 5.5 dejo de ser
 * una pantalla y paso a ser una seccion: el panel de finanzas ASCENDIO al
 * Command Center en vez de duplicarse en dos vistas con los mismos numeros.
 *
 * Solo pinta. La carga, el error y el reintento los lleva el Command Center,
 * que es quien sabe que hay mas secciones esperando.
 *
 * Orden deliberado en movil, de arriba abajo por urgencia de la pregunta:
 *   1. ¿cuanto me queda de esta quincena?   (la decision de hoy)
 *   2. ¿cual es mi plan?                     (ingreso != presupuesto, siempre visible)
 *   3. ¿cuanto tengo y cuanto debo?
 *   4. ¿en que se me esta yendo?
 */
import { useState } from 'react';
import { Card } from '@/core/components/ui/Card';
import { toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import type { DashboardSummary } from '@/domains/finance/shared/types/overview';
import { PendingInbox } from '@/domains/finance/recurring/components/PendingInbox';
import { ConfirmPendingSheet } from '@/domains/finance/recurring/components/ConfirmPendingSheet';
import { useSkipPending } from '@/domains/finance/shared/api';
import type { PendingItem } from '@/domains/finance/shared/types/recurring';
import { CardsDue } from './CardsDue';
import { PlanBar } from './PlanBar';
import { CycleHero } from './CycleHero';
import { LiquidityGrid } from './LiquidityGrid';
import { MicroExpenses } from './MicroExpenses';
import { CategoryBudgets } from './CategoryBudgets';
import { EmergencyFund } from './EmergencyFund';
import { SavingsProgress } from './SavingsProgress';
import { Subscriptions } from './Subscriptions';
import { RecentTransactions } from './RecentTransactions';

export function FinanceSection({ data }: { data: DashboardSummary }) {
  const monthSpent = toNumber(data.month.spent);
  const monthBudget = toNumber(data.month.budget);

  const skip = useSkipPending();
  const [confirming, setConfirming] = useState<PendingItem | null>(null);
  const [skipping, setSkipping] = useState<string | null>(null);

  const onSkip = async (item: PendingItem) => {
    setSkipping(item.ruleId);
    try {
      await skip.mutateAsync(item.ruleId);
    } finally {
      setSkipping(null);
    }
  };

  return (
    <div className="space-y-3.5 lg:space-y-4">
      {/* Lo unico de la seccion que pide una accion va primero. */}
      <PendingInbox
        items={data.pending}
        onConfirm={setConfirming}
        onSkip={(item) => void onSkip(item)}
        busyRuleId={skipping}
      />

      <CycleHero cycle={data.cycle} period={data.period} />

      {/* Justo debajo del ciclo: una fecha limite es tan urgente como el
          presupuesto, y mas facil de olvidar. */}
      <CardsDue cards={data.cards} />

      <PlanBar plan={data.plan} />

      {/* Resumen del mes: contexto por encima del ciclo en curso.
          Cada cifra lleva `whitespace-nowrap`: a 320px, "L 13,714 de L 15,000"
          se partia a mitad del numero y quedaba ilegible. */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <span className="label-deco text-[10px]" style={{ color: 'var(--ink-muted)' }}>
            Mes completo
          </span>
          <span className="figure tabular shrink-0 text-[28px] leading-none" style={{ color: 'var(--ink-2)' }}>
            {Math.round(data.month.percentUsed)}%
          </span>
        </div>

        <div className="tabular mt-1.5 text-lg font-bold whitespace-nowrap">
          {money(monthSpent, { compact: true })}
          <span className="text-sm font-medium" style={{ color: 'var(--ink-muted)' }}>
            {' '}de {money(monthBudget, { compact: true })}
          </span>
        </div>

        <div className="tabular mt-0.5 text-[11px] whitespace-nowrap" style={{ color: 'var(--ink-muted)' }}>
          ingreso {money(data.month.income, { compact: true })}
        </div>
      </Card>

      <LiquidityGrid liquidity={data.liquidity} />

      <MicroExpenses data={data.microExpenses} />

      <div className="grid gap-3.5 lg:grid-cols-2 lg:gap-4">
        <CategoryBudgets categories={data.categories} />
        <div className="space-y-3.5 lg:space-y-4">
          <SavingsProgress savings={data.savings} />
          {data.emergencyFund && <EmergencyFund fund={data.emergencyFund} />}
          <Subscriptions data={data.subscriptions} />
        </div>
      </div>

      <RecentTransactions items={data.recentTransactions} />

      <ConfirmPendingSheet item={confirming} onClose={() => setConfirming(null)} />
    </div>
  );
}

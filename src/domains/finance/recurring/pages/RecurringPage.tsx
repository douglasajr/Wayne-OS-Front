/**
 * Recurrencias y suscripciones.
 *
 * Una sola tabla detras, dos formas de pensarlas: las suscripciones se
 * revisan para CANCELAR (¿sigo pagando esto?), los gastos fijos se revisan
 * para PLANEAR (¿cuanto de la quincena ya tiene dueño?). Por eso la pantalla
 * separa en pestañas lo que el backend guarda junto.
 *
 * Lo primero de la pagina es lo vencido, porque es lo unico que pide accion.
 */
import { useMemo, useState } from 'react';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { EmptyState } from '@/core/components/ui/EmptyState';
import { ApiError } from '@/core/lib/api';
import { money } from '@/domains/finance/shared/money';
import { useRecurring, useSkipPending } from '@/domains/finance/shared/api';
import type {
  PendingItem,
  RecurrenceKind,
  RecurringRule,
} from '@/domains/finance/shared/types/recurring';
import { KIND } from '../labels';
import { RuleCard } from '../components/RuleCard';
import { RuleFormSheet } from '../components/RuleFormSheet';
import { RuleDetailSheet } from '../components/RuleDetailSheet';
import { PendingInbox } from '../components/PendingInbox';
import { ConfirmPendingSheet } from '../components/ConfirmPendingSheet';

type Tab = 'SUBSCRIPTION' | 'RECURRING' | 'INACTIVE';

const TABS: { id: Tab; label: string }[] = [
  { id: 'SUBSCRIPTION', label: 'Suscripciones' },
  { id: 'RECURRING', label: 'Gastos fijos' },
  { id: 'INACTIVE', label: 'Canceladas' },
];

export function RecurringPage() {
  const [tab, setTab] = useState<Tab>('SUBSCRIPTION');
  const [creating, setCreating] = useState<RecurrenceKind | null>(null);
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [selected, setSelected] = useState<RecurringRule | null>(null);
  const [confirmingItem, setConfirmingItem] = useState<PendingItem | null>(null);
  const [skipping, setSkipping] = useState<string | null>(null);

  const query = useRecurring({ includeInactive: true });
  const skip = useSkipPending();

  const rules = useMemo(() => query.data?.rules ?? [], [query.data]);

  const visible = useMemo(() => {
    if (tab === 'INACTIVE') return rules.filter((r) => !r.isActive);
    if (tab === 'SUBSCRIPTION') return rules.filter((r) => r.isActive && r.kind === 'SUBSCRIPTION');
    return rules.filter((r) => r.isActive && r.kind !== 'SUBSCRIPTION');
  }, [rules, tab]);

  /** La bandeja se deriva de las reglas: no hace falta una consulta aparte. */
  const pending: PendingItem[] = useMemo(
    () =>
      rules
        .filter((r) => r.isActive && r.isOverdue)
        .map((r) => ({
          ruleId: r.id,
          name: r.name,
          kind: r.kind,
          vendor: r.vendor,
          amount: r.amount,
          isEstimate: r.kind === 'VARIABLE',
          currencyCode: r.currencyCode,
          transactionType: r.transactionType,
          dueDate: r.nextRunDate,
          daysOverdue: -r.daysUntilNext,
          overdueCount: r.overdueCount,
          category: r.category,
          account: r.fromAccount ?? r.toAccount,
        })),
    [rules],
  );

  const subscriptionTotal = useMemo(
    () =>
      rules
        .filter((r) => r.isActive && r.kind === 'SUBSCRIPTION')
        .reduce((acc, r) => acc + Number(r.monthlyEquivalent), 0),
    [rules],
  );

  const onSkip = async (item: PendingItem) => {
    setSkipping(item.ruleId);
    try {
      await skip.mutateAsync(item.ruleId);
    } finally {
      setSkipping(null);
    }
  };

  if (query.isLoading) {
    return (
      <div className="space-y-3.5">
        <Skeleton height={120} />
        <Skeleton height={64} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (query.error) {
    return (
      <Card className="mt-6 text-center">
        <p role="alert" className="text-sm" style={{ color: 'var(--critical)' }}>
          {query.error instanceof ApiError ? query.error.message : 'No se pudieron cargar las recurrencias.'}
        </p>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        </div>
      </Card>
    );
  }

  const totals = query.data?.totals;

  return (
    <div className="space-y-3.5 lg:space-y-4">
      <PendingInbox
        items={pending}
        onConfirm={setConfirmingItem}
        onSkip={(item) => void onSkip(item)}
        busyRuleId={skipping}
      />

      {totals && (
        <Card edge>
          <CardTitle>Lo que se repite</CardTitle>
          <div className="figure tabular text-[34px] leading-none">
            {money(totals.monthlyTotal, { compact: true })}
            <span className="text-sm font-medium" style={{ color: 'var(--ink-muted)' }}> /mes</span>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
            <Stat label="Al año" value={money(totals.yearlyTotal, { compact: true })} />
            <Stat label="Solo suscripciones" value={`${money(subscriptionTotal, { compact: true })}/mes`} />
          </div>
          <p className="mt-2.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            Cada frecuencia se normaliza a su equivalente mensual: una anual de L1,200 pesa lo
            mismo que una mensual de L100.
          </p>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="chip"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            style={tab === t.id ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
          >
            {t.label}
          </button>
        ))}
        <Button
          icon="plus"
          className="ml-auto"
          onClick={() => setCreating(tab === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'FIXED')}
        >
          Nueva
        </Button>
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState
            icon={tab === 'SUBSCRIPTION' ? 'repeat' : 'home'}
            title={
              tab === 'INACTIVE'
                ? 'Nada cancelado'
                : tab === 'SUBSCRIPTION'
                  ? 'Sin suscripciones'
                  : 'Sin gastos fijos'
            }
            description={
              tab === 'INACTIVE'
                ? 'Aquí aparecen las que dejes de pagar, con su historial intacto.'
                : tab === 'SUBSCRIPTION'
                  ? 'Netflix, Spotify, iCloud. Verlas juntas y con su costo anual es la forma más rápida de descubrir cuál sobra.'
                  : 'Renta, internet, energía. Lo que se repite cada mes y ya tiene dueño antes de que empieces a gastar.'
            }
            action={
              tab !== 'INACTIVE' && (
                <Button
                  icon="plus"
                  onClick={() => setCreating(tab === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'FIXED')}
                >
                  {KIND[tab === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'FIXED'].label}
                </Button>
              )
            }
          />
        ) : (
          <ul className="space-y-2">
            {visible.map((rule) => (
              <RuleCard key={rule.id} rule={rule} onSelect={() => setSelected(rule)} />
            ))}
          </ul>
        )}
      </Card>

      <p className="px-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        <Icon name="alert" size={11} strokeWidth={2.2} /> Una recurrencia es una promesa, no un
        gasto. El gasto nace cuando confirmas la ocurrencia, y solo entonces cuenta en el
        presupuesto.
      </p>

      <RuleFormSheet
        open={creating !== null || editing !== null}
        onClose={() => {
          setCreating(null);
          setEditing(null);
        }}
        editing={editing}
        initialKind={creating ?? 'SUBSCRIPTION'}
      />

      <RuleDetailSheet
        rule={selected}
        onClose={() => setSelected(null)}
        onEdit={(rule) => {
          setSelected(null);
          setEditing(rule);
        }}
      />

      <ConfirmPendingSheet item={confirmingItem} onClose={() => setConfirmingItem(null)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-deco text-[9px]" style={{ color: 'var(--ink-muted)' }}>{label}</div>
      <div className="figure tabular mt-1 text-base leading-none">{value}</div>
    </div>
  );
}

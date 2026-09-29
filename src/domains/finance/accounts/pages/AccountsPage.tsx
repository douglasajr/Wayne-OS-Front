/**
 * Cuentas.
 *
 * El encabezado responde la pregunta de patrimonio: activos − deudas. Se
 * muestran los tres numeros, no solo el neto: un patrimonio de L40,000 no
 * significa lo mismo con L0 de deuda que con L60,000 de activos y L20,000
 * debidos.
 *
 * Activos y deudas van en secciones separadas. Mezclarlos obligaria a leer el
 * signo de cada fila para saber que es cada cosa.
 */
import { useMemo, useState } from 'react';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { EmptyState } from '@/core/components/ui/EmptyState';
import { ApiError } from '@/core/lib/api';
import { money } from '@/domains/finance/shared/money';
import { useAccounts } from '@/domains/finance/shared/api';
import type { Account } from '@/domains/finance/shared/types/domain';
import { AccountCard } from '../components/AccountCard';
import { AccountFormSheet } from '../components/AccountFormSheet';
import { AccountDetailSheet } from '../components/AccountDetailSheet';
import { ReconcilePanel } from '../components/ReconcilePanel';

export function AccountsPage() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [selected, setSelected] = useState<Account | null>(null);

  const query = useAccounts(includeArchived);
  const accounts = query.data?.accounts ?? [];
  const totals = query.data?.totals;

  const { assets, debts } = useMemo(
    () => ({
      assets: accounts.filter((a) => !a.isDebt),
      debts: accounts.filter((a) => a.isDebt),
    }),
    [accounts],
  );

  if (query.isLoading) {
    return (
      <div className="space-y-3.5">
        <Skeleton height={120} />
        <Skeleton height={86} />
        <Skeleton height={86} />
      </div>
    );
  }

  if (query.error) {
    return (
      <Card className="mt-6 text-center">
        <p role="alert" className="text-sm" style={{ color: 'var(--critical)' }}>
          {query.error instanceof ApiError ? query.error.message : 'No se pudieron cargar las cuentas.'}
        </p>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3.5 lg:space-y-4">
      {totals && (
        <Card edge>
          <CardTitle>Patrimonio neto</CardTitle>
          <div className="figure tabular text-[34px] leading-none">
            {money(totals.netWorth, { compact: true })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
            <div>
              <div className="label-deco text-[9px]" style={{ color: 'var(--ink-muted)' }}>Tienes</div>
              <div className="figure tabular mt-1 text-base leading-none" style={{ color: 'var(--good)' }}>
                {money(totals.assets, { compact: true })}
              </div>
            </div>
            <div>
              <div className="label-deco text-[9px]" style={{ color: 'var(--ink-muted)' }}>Debes</div>
              <div className="figure tabular mt-1 text-base leading-none" style={{ color: 'var(--serious)' }}>
                {money(totals.liabilities, { compact: true })}
              </div>
            </div>
          </div>
          <p className="mt-2.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            Solo entran las cuentas marcadas para el patrimonio.
          </p>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button icon="plus" onClick={() => setCreating(true)}>Nueva cuenta</Button>
        <button
          type="button"
          className="chip"
          aria-pressed={includeArchived}
          onClick={() => setIncludeArchived((v) => !v)}
        >
          <Icon name="archive" size={15} strokeWidth={2} />
          Ver archivadas
        </button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon="wallet"
            title="Sin cuentas todavía"
            description="Crea tu primera cuenta —el banco donde cae el sueldo, o el efectivo que cargas— para poder registrar movimientos."
            action={<Button icon="plus" onClick={() => setCreating(true)}>Nueva cuenta</Button>}
          />
        </Card>
      ) : (
        <>
          <Section title="Tus activos" accounts={assets} onSelect={setSelected} />
          <Section title="Tus deudas" accounts={debts} onSelect={setSelected} />
        </>
      )}

      <ReconcilePanel />

      <AccountFormSheet open={creating} onClose={() => setCreating(false)} />
      <AccountFormSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        editing={editing}
      />
      <AccountDetailSheet
        account={selected}
        onClose={() => setSelected(null)}
        onEdit={(a) => {
          setSelected(null);
          setEditing(a);
        }}
      />
    </div>
  );
}

function Section({
  title,
  accounts,
  onSelect,
}: {
  title: string;
  accounts: Account[];
  onSelect: (a: Account) => void;
}) {
  if (accounts.length === 0) return null;

  return (
    <section>
      <h2 className="label-deco mb-2 text-[10px]" style={{ color: 'var(--ink-muted)' }}>
        {title}
      </h2>
      <div className="grid gap-2.5 lg:grid-cols-2">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

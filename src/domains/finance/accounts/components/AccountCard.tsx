/**
 * Tarjeta de cuenta.
 *
 * Un activo muestra su saldo; una deuda muestra lo que se debe y, si es
 * tarjeta, cuanto credito queda y que porcentaje se lleva usado. El porcentaje
 * lleva barra Y cifra: la barra da la magnitud de un vistazo, la cifra es la
 * que se puede citar.
 */
import { Icon } from '@/core/components/ui/Icon';
import { Meter } from '@/core/components/ui/Meter';
import { ACCOUNT_TYPE } from '@/domains/finance/shared/accounts';
import { money } from '@/domains/finance/shared/money';
import type { Account } from '@/domains/finance/shared/types/domain';

/** Mismo semaforo que el presupuesto: el uso de la tarjeta se lee igual. */
function creditTone(percent: number): string {
  if (percent > 90) return 'var(--critical)';
  if (percent >= 70) return 'var(--serious)';
  if (percent >= 50) return 'var(--warning)';
  return 'var(--good)';
}

export function AccountCard({ account, onSelect }: { account: Account; onSelect: (a: Account) => void }) {
  const meta = ACCOUNT_TYPE[account.type];
  const used = account.creditUsedPercent;
  const archived = Boolean(account.archivedAt);

  return (
    <button
      type="button"
      onClick={() => onSelect(account)}
      className="w-full border p-3.5 text-left transition-colors"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--line)',
        borderRadius: 'var(--radius)',
        opacity: archived ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center border"
          style={{
            borderColor: 'var(--line)',
            color: account.isDebt ? 'var(--serious)' : 'var(--accent)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <Icon name={meta.icon} size={19} strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{account.name}</span>
            {archived && (
              <span className="label-deco shrink-0 text-[8px]" style={{ color: 'var(--ink-muted)' }}>
                archivada
              </span>
            )}
          </div>
          <div className="truncate text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            {meta.label}
            {account.institution ? ` · ${account.institution}` : ''}
            {account.creditCardDetail?.last4 ? ` · ••${account.creditCardDetail.last4}` : ''}
            {account.currencyCode !== 'HNL' ? ` · ${account.currencyCode}` : ''}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div
            className="figure tabular text-lg leading-none"
            style={{ color: account.isDebt ? 'var(--serious)' : 'var(--ink)' }}
          >
            {money(account.currentBalance, { compact: true })}
          </div>
          {!account.includeInNetWorth && (
            <div className="text-[10px]" style={{ color: 'var(--ink-muted)' }}>
              fuera del patrimonio
            </div>
          )}
        </div>
      </div>

      {account.creditCardDetail && used !== null && (
        <div className="mt-3">
          <Meter
            percent={used}
            color={creditTone(used)}
            label={`Crédito usado de ${account.name}`}
          />
          <div className="mt-1.5 flex justify-between text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            <span className="tabular">{used}% del límite usado</span>
            <span className="tabular">
              {account.availableCredit ? `${money(account.availableCredit, { compact: true })} disponible` : ''}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

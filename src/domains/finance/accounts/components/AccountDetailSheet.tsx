/**
 * Detalle de cuenta: editar, archivar y desarchivar.
 *
 * "Archivar" y "borrar" son la misma accion desde fuera, pero el backend
 * decide cual aplica segun tenga movimientos o no. Aqui se explica ANTES de
 * pulsar, porque son cosas muy distintas: una se puede deshacer y la otra no.
 */
import { useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { ApiError } from '@/core/lib/api';
import { money } from '@/domains/finance/shared/money';
import { ACCOUNT_TYPE } from '@/domains/finance/shared/accounts';
import { useArchiveAccount, useUnarchiveAccount } from '@/domains/finance/shared/api';
import type { Account } from '@/domains/finance/shared/types/domain';

interface Props {
  account: Account | null;
  onClose: () => void;
  onEdit: (account: Account) => void;
}

export function AccountDetailSheet({ account, onClose, onEdit }: Props) {
  return (
    <Sheet
      open={account !== null}
      onClose={onClose}
      title={account?.name ?? 'Cuenta'}
      subtitle={account ? ACCOUNT_TYPE[account.type].label : undefined}
    >
      {account && <Detail account={account} onClose={onClose} onEdit={onEdit} />}
    </Sheet>
  );
}

function Detail({ account, onClose, onEdit }: { account: Account; onClose: () => void; onEdit: (a: Account) => void }) {
  const [confirming, setConfirming] = useState(false);
  const archive = useArchiveAccount();
  const unarchive = useUnarchiveAccount();

  const archived = Boolean(account.archivedAt);
  const balanceIsZero = Number(account.currentBalance) === 0;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div
          className="figure tabular text-[34px] leading-none"
          style={{ color: account.isDebt ? 'var(--serious)' : 'var(--ink)' }}
        >
          {money(account.currentBalance)}
        </div>
        <p className="mt-1 text-[12px]" style={{ color: 'var(--ink-muted)' }}>
          {account.isDebt ? 'Deuda actual' : 'Saldo disponible'}
        </p>
      </div>

      <dl className="divide-y text-sm" style={{ borderColor: 'var(--line)' }}>
        <Row label="Saldo inicial">{money(account.initialBalance)}</Row>
        <Row label="Moneda">{account.currencyCode}</Row>
        {account.institution && <Row label="Institución">{account.institution}</Row>}
        {account.creditCardDetail && (
          <>
            <Row label="Límite">{money(account.creditCardDetail.creditLimit)}</Row>
            {account.availableCredit && <Row label="Disponible">{money(account.availableCredit)}</Row>}
            <Row label="Corte">día {account.creditCardDetail.cutoffDay}</Row>
            <Row label="Pago">día {account.creditCardDetail.paymentDueDay}</Row>
          </>
        )}
        <Row label="Patrimonio">{account.includeInNetWorth ? 'Sí cuenta' : 'No cuenta'}</Row>
      </dl>

      {(archive.error || unarchive.error) && (
        <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
          {(archive.error ?? unarchive.error) instanceof ApiError
            ? (archive.error ?? unarchive.error)!.message
            : 'No se pudo completar la acción.'}
        </p>
      )}

      {archived ? (
        <Button
          full
          icon="archive"
          loading={unarchive.isPending}
          onClick={async () => {
            await unarchive.mutateAsync(account.id);
            onClose();
          }}
        >
          Devolver al uso diario
        </Button>
      ) : confirming ? (
        <div
          className="space-y-3 border px-3 py-3"
          style={{
            borderColor: 'color-mix(in oklab, var(--critical) 34%, transparent)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <p className="text-[13px]" style={{ color: 'var(--ink-2)' }}>
            Si la cuenta tiene movimientos se <strong>archiva</strong>: desaparece del día a día pero los
            reportes de los meses en que la usaste quedan intactos, y puedes devolverla cuando quieras. Si
            nunca tuvo movimientos, se borra.
          </p>
          {!balanceIsZero && (
            <p className="text-[13px]" style={{ color: 'var(--warning)' }}>
              Todavía tiene saldo. Traslada el dinero a otra cuenta antes de archivarla.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" full onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              full
              icon="archive"
              loading={archive.isPending}
              onClick={async () => {
                await archive.mutateAsync(account.id);
                onClose();
              }}
            >
              Archivar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="ghost" full icon="pencil" onClick={() => onEdit(account)}>
            Editar
          </Button>
          <Button variant="danger" full icon="archive" onClick={() => setConfirming(true)}>
            Archivar
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5" style={{ borderColor: 'var(--line)' }}>
      <dt className="label-deco shrink-0 text-[9px]" style={{ color: 'var(--ink-muted)' }}>
        {label}
      </dt>
      <dd className="tabular truncate text-right text-[13px] font-medium">{children}</dd>
    </div>
  );
}

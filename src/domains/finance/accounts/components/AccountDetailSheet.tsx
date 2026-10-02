/**
 * Detalle de cuenta: editar, ajustar el saldo, archivar y desarchivar.
 *
 * "Archivar" y "borrar" son la misma accion desde fuera, pero el backend
 * decide cual aplica segun tenga movimientos o no. Aqui se explica ANTES de
 * pulsar, porque son cosas muy distintas: una se puede deshacer y la otra no.
 */
import { useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { TextField } from '@/core/components/ui/Field';
import { ApiError } from '@/core/lib/api';
import { todayIso } from '@/core/lib/dates';
import { money } from '@/domains/finance/shared/money';
import { ACCOUNT_TYPE } from '@/domains/finance/shared/accounts';
import { useAdjustBalance, useArchiveAccount, useUnarchiveAccount } from '@/domains/finance/shared/api';
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
  // Un solo panel abierto a la vez: confirmar el archivado o ajustar el saldo.
  const [mode, setMode] = useState<'idle' | 'archive' | 'adjust'>('idle');
  const confirming = mode === 'archive';
  const setConfirming = (on: boolean) => setMode(on ? 'archive' : 'idle');
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
      ) : mode === 'adjust' ? (
        <AdjustPanel account={account} onDone={() => setMode('idle')} />
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
        <div className="space-y-2">
          <Button full icon="scale" onClick={() => setMode('adjust')}>
            Ajustar saldo
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" full icon="pencil" onClick={() => onEdit(account)}>
              Editar
            </Button>
            <Button variant="danger" full icon="archive" onClick={() => setConfirming(true)}>
              Archivar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Se escribe el saldo que dice el banco, no la diferencia: restar frente al
 * estado de cuenta es justo el trabajo que el sistema debe hacer. La deuda se
 * captura en positivo, igual que al crear la cuenta.
 */
function AdjustPanel({ account, onDone }: { account: Account; onDone: () => void }) {
  const adjust = useAdjustBalance();
  const [value, setValue] = useState('');

  const valid = /^\d+(\.\d{1,2})?$/.test(value);
  const target = valid ? (account.isDebt && Number(value) !== 0 ? `-${value}` : value) : null;
  // Solo para la vista previa: el calculo que cuenta lo hace el backend en Decimal.
  const diff = target === null ? null : Number(target) - Number(account.currentBalance);
  const unchanged = diff !== null && Math.abs(diff) < 0.005;

  // En una deuda, que el saldo suba significa deber menos.
  const effect =
    diff === null || unchanged
      ? null
      : account.isDebt
        ? diff > 0 ? 'Debes menos' : 'Debes más'
        : diff > 0 ? 'Tienes más' : 'Tienes menos';

  return (
    <div
      className="space-y-3 border px-3 py-3"
      style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius-sm)' }}
    >
      <TextField
        label={account.isDebt ? '¿Cuánto debes realmente hoy?' : '¿Cuánto hay realmente hoy?'}
        inputMode="decimal"
        placeholder="0.00"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ''))}
      />

      <p className="text-[12px]" style={{ color: 'var(--ink-2)' }}>
        {effect && diff !== null ? (
          <>
            {effect} en <strong className="tabular">{money(Math.abs(diff))}</strong>. Queda como un ajuste en
            tus movimientos: no cuenta como gasto ni como ingreso, y si te equivocas lo borras.
          </>
        ) : unchanged ? (
          'Ese ya es el saldo: no hay nada que ajustar.'
        ) : (
          'Escribe lo que dice tu banco o tu estado de cuenta. El sistema registra la diferencia.'
        )}
      </p>

      {adjust.error && (
        <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
          {adjust.error instanceof ApiError ? adjust.error.message : 'No se pudo ajustar el saldo.'}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" full onClick={onDone}>
          Cancelar
        </Button>
        <Button
          full
          icon="check"
          disabled={target === null || unchanged}
          loading={adjust.isPending}
          onClick={async () => {
            await adjust.mutateAsync({ id: account.id, balance: target!, date: todayIso() });
            onDone();
          }}
        >
          Ajustar
        </Button>
      </div>
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

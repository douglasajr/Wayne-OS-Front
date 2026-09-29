/**
 * Detalle de un movimiento, con corregir y borrar.
 *
 * El borrado pide confirmacion EN EL PANEL, no con un `confirm()` del
 * navegador: un dialogo nativo se ve fuera de lugar y, en movil, aparece
 * pegado arriba, lejos del pulgar que acaba de tocar.
 *
 * Se explica que el saldo vuelve atras. Borrar un gasto de hace tres meses
 * cambia el total de ese mes, y el usuario merece saberlo antes, no despues.
 */
import { useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { DeferSheet } from '@/domains/finance/credit-cards/components/DeferSheet';
import { Icon } from '@/core/components/ui/Icon';
import { ApiError } from '@/core/lib/api';
import { money } from '@/domains/finance/shared/money';
import { longDate } from '@/core/lib/dates';
import { PAYMENT_METHOD } from '@/domains/finance/shared/accounts';
import { categoryColor } from '@/domains/finance/shared/status';
import { useDeleteTransaction } from '@/domains/finance/shared/api';
import type { Transaction } from '@/domains/finance/shared/types/domain';

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
}

const TYPE_LABEL = { EXPENSE: 'Gasto', INCOME: 'Ingreso', TRANSFER: 'Traslado' } as const;

export function TransactionDetailSheet({ transaction, onClose, onEdit }: Props) {
  return (
    <Sheet
      open={transaction !== null}
      onClose={onClose}
      title={transaction ? TYPE_LABEL[transaction.type] : 'Movimiento'}
      subtitle={transaction ? longDate(transaction.date) : undefined}
    >
      {transaction && <Detail tx={transaction} onClose={onClose} onEdit={onEdit} />}
    </Sheet>
  );
}

function Detail({ tx, onClose, onEdit }: { tx: Transaction; onClose: () => void; onEdit: (tx: Transaction) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deferring, setDeferring] = useState(false);
  const remove = useDeleteTransaction();

  const isTransfer = tx.type === 'TRANSFER';
  const isIncome = tx.type === 'INCOME';
  const tone = isTransfer ? 'var(--ink-2)' : isIncome ? 'var(--good)' : 'var(--ink)';

  // Solo una compra con tarjeta de credito se difiere: en debito el dinero ya
  // salio y repartir su cobro no significa nada.
  const canDefer = tx.type === 'EXPENSE' && tx.fromAccount?.type === 'CREDIT_CARD';

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="figure tabular text-[38px] leading-none" style={{ color: tone }}>
          {isTransfer ? '' : isIncome ? '+' : '−'}
          {money(tx.amount)}
        </div>
        {tx.description && <p className="mt-1.5 text-sm font-semibold">{tx.description}</p>}
      </div>

      {isTransfer && (
        <p
          className="px-3 py-2.5 text-center text-[12px]"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', borderRadius: 'var(--radius-sm)' }}
        >
          Este traslado <strong>no cuenta como gasto</strong>: el dinero sigue siendo tuyo.
        </p>
      )}

      <dl className="divide-y text-sm" style={{ borderColor: 'var(--line)' }}>
        {!isTransfer && (
          <Row label="Categoría">
            <span className="inline-flex items-center gap-2">
              <span style={{ color: categoryColor(tx.category?.color) }}>
                <Icon name={tx.categoryIcon ?? 'ellipsis'} size={15} strokeWidth={2} />
              </span>
              {tx.category?.name ?? 'Sin categoría'}
            </span>
          </Row>
        )}
        {tx.fromAccount && <Row label={isTransfer ? 'Sale de' : 'Pagado con'}>{tx.fromAccount.name}</Row>}
        {tx.toAccount && <Row label="Entra a">{tx.toAccount.name}</Row>}
        {tx.toAmount && <Row label="Monto recibido">{money(tx.toAmount)}</Row>}
        <Row label="Fecha">{longDate(tx.date)}</Row>
        {tx.paymentMethod && <Row label="Método">{PAYMENT_METHOD[tx.paymentMethod]}</Row>}
        {tx.merchant && <Row label="Comercio">{tx.merchant.name}</Row>}
        {tx.isMicroExpense && (
          <Row label="Clasificación">
            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--cat-2)' }}>
              <Icon name="ant" size={14} strokeWidth={2} />
              Gasto hormiga
            </span>
          </Row>
        )}
        {tx.currencyCode !== 'HNL' && <Row label="Moneda">{tx.currencyCode}</Row>}
      </dl>

      {/* Diferir solo tiene sentido en una compra con tarjeta de credito: en
          una cuenta de debito el dinero ya salio y no hay nada que repartir. */}
      {canDefer && (
        <div className="mt-3.5 border-t pt-3.5" style={{ borderColor: 'var(--line)' }}>
          <button type="button" className="chip" onClick={() => setDeferring(true)}>
            <Icon name="card" size={15} strokeWidth={2} />
            Diferir a cuotas
          </button>
          <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            Reparte el cobro sin cambiar el gasto: ya quedó registrado completo.
          </p>
        </div>
      )}

      <DeferSheet
        open={deferring}
        onClose={() => setDeferring(false)}
        transactionId={tx.id}
        amount={tx.amount}
        description={tx.description}
      />

      {tx.notes && (
        <p
          className="px-3 py-2.5 text-[13px] whitespace-pre-wrap"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', borderRadius: 'var(--radius-sm)' }}
        >
          {tx.notes}
        </p>
      )}

      {remove.error && (
        <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
          {remove.error instanceof ApiError ? remove.error.message : 'No se pudo borrar.'}
        </p>
      )}

      {confirming ? (
        <div
          className="space-y-3 border px-3 py-3"
          style={{
            borderColor: 'color-mix(in oklab, var(--critical) 34%, transparent)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <p className="text-[13px]" style={{ color: 'var(--ink-2)' }}>
            Se borrará el movimiento y el saldo de la cuenta volverá atrás {money(tx.amount)}. El total del
            mes cambiará.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" full onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              full
              icon="trash"
              loading={remove.isPending}
              onClick={async () => {
                await remove.mutateAsync(tx.id);
                onClose();
              }}
            >
              Sí, borrar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="ghost" full icon="pencil" onClick={() => onEdit(tx)}>
            Corregir
          </Button>
          <Button variant="danger" full icon="trash" onClick={() => setConfirming(true)}>
            Borrar
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
      <dd className="truncate text-right text-[13px] font-medium">{children}</dd>
    </div>
  );
}

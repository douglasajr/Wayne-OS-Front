/**
 * Fila de movimiento.
 *
 * El signo y el color separan las tres naturalezas de un vistazo: el gasto
 * resta en tinta normal, el ingreso suma en verde y la transferencia va en gris
 * SIN signo, porque no cambia cuanto tienes en total. Que se vea distinta es
 * parte de enseñar la regla, no un detalle estetico.
 */
import { Icon } from '@/core/components/ui/Icon';
import { categoryColor } from '@/domains/finance/shared/status';
import { relativeDay } from '@/core/lib/format';
import { amount } from '@/domains/finance/shared/money';
import type { Transaction } from '@/domains/finance/shared/types/domain';

export function TransactionRow({ tx, onSelect }: { tx: Transaction; onSelect: (tx: Transaction) => void }) {
  const isTransfer = tx.type === 'TRANSFER';
  const isIncome = tx.type === 'INCOME';
  // Un ajuste no es gasto ni ingreso: tono neutro como el traslado, pero con
  // signo, porque si cambia cuanto tienes.
  const isAdjustment = tx.type === 'ADJUSTMENT';
  const neutral = isTransfer || isAdjustment;
  const sign = isTransfer ? '' : isAdjustment ? (tx.toAccount !== null ? '+' : '−') : isIncome ? '+' : '−';
  const tone = neutral ? 'var(--ink-2)' : isIncome ? 'var(--good)' : 'var(--ink)';
  const color = categoryColor(tx.category?.color);

  const account = isTransfer
    ? `${tx.fromAccount?.name ?? '—'} → ${tx.toAccount?.name ?? '—'}`
    : (tx.fromAccount?.name ?? tx.toAccount?.name ?? '');

  return (
    // `divide-y` solo pone el ancho del borde: sin fijar el color aqui, el
    // separador cae a `currentColor` y sale casi negro sobre la superficie.
    <li style={{ borderColor: 'var(--line)' }}>
      <button
        type="button"
        onClick={() => onSelect(tx)}
        className="flex w-full items-center gap-3 py-2.5 text-left"
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center"
          style={{
            background: neutral
              ? 'var(--surface-2)'
              : `color-mix(in oklab, ${color} 15%, transparent)`,
            color: neutral ? 'var(--ink-muted)' : color,
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <Icon
            name={isTransfer ? 'repeat' : isAdjustment ? 'scale' : isIncome ? 'in' : (tx.categoryIcon ?? 'out')}
            size={16}
            strokeWidth={2}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">
              {tx.description ?? tx.category?.name ?? 'Sin descripción'}
            </span>
            {tx.isMicroExpense && (
              <span title="Gasto hormiga" style={{ color: 'var(--cat-2)' }}>
                <Icon name="ant" size={13} strokeWidth={2} />
              </span>
            )}
          </div>
          <div className="truncate text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            {isTransfer ? 'Traslado · no es gasto' : isAdjustment ? 'Ajuste · no es gasto' : (tx.category?.name ?? 'Sin categoría')}
            {account ? ` · ${account}` : ''}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="tabular text-sm font-bold" style={{ color: tone }}>
            {sign}L {amount(tx.amount, true)}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            {relativeDay(tx.date)}
          </div>
        </div>
      </button>
    </li>
  );
}

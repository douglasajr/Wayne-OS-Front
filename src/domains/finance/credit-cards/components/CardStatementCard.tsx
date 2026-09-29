/**
 * Estado de cuenta de una tarjeta.
 *
 * El numero grande es lo que hay que PAGAR del corte cerrado, no el saldo
 * total. Son cosas distintas y confundirlas es el error clasico de las
 * tarjetas, por dos motivos a la vez:
 *
 *   - una compra hecha DESPUES del corte no se paga en esta fecha limite;
 *   - una compra DIFERIDA entra entera al saldo, pero el banco solo cobra la
 *     cuota del mes.
 *
 * Las dos cosas se desglosan abajo, para que el saldo total siga visible sin
 * que nadie lo confunda con lo que hay que pagar.
 */
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Meter } from '@/core/components/ui/Meter';
import { Icon } from '@/core/components/ui/Icon';
import { shortDate, toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import type { CreditCard } from '@/domains/finance/shared/types/cards';

interface Props {
  card: CreditCard;
  onPay: (card: CreditCard) => void;
}

export function CardStatementCard({ card, onPay }: Props) {
  const remaining = toNumber(card.statement.remaining);
  const { daysUntilDue, isOverdue } = card.statement.period;
  const settled = remaining <= 0;

  // Mas del 70% del limite usado empieza a pesar en el historial crediticio.
  const usage = card.creditUsedPercent;
  const usageColor =
    usage > 90 ? 'var(--critical)' : usage > 70 ? 'var(--serious)' : 'var(--good)';

  return (
    <Card edge>
      <CardTitle
        action={
          <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            {card.brand ?? 'Tarjeta'}{card.last4 && ` ····${card.last4}`}
          </span>
        }
      >
        {card.name}
      </CardTitle>

      {settled ? (
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center" style={{ color: 'var(--good)' }}>
            <Icon name="check" size={22} strokeWidth={2.4} />
          </span>
          <div>
            <div className="text-sm font-bold">Corte al día</div>
            <div className="text-[12px]" style={{ color: 'var(--ink-2)' }}>
              Nada que pagar antes del {shortDate(card.statement.period.dueDate)}.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span
              className="figure text-[40px] leading-none"
              style={{ color: isOverdue ? 'var(--critical)' : 'var(--ink)' }}
            >
              {money(remaining, { compact: true })}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>
              a pagar
            </span>
          </div>

          <div
            className="mt-1.5 flex items-center gap-1.5 text-[12px]"
            style={{ color: isOverdue ? 'var(--critical)' : daysUntilDue <= 3 ? 'var(--serious)' : 'var(--ink-2)' }}
          >
            <Icon name={isOverdue ? 'siren' : 'calendar'} size={13} strokeWidth={2.2} />
            {isOverdue
              ? `Venció el ${shortDate(card.statement.period.dueDate)}`
              : daysUntilDue === 0
                ? `Vence HOY, ${shortDate(card.statement.period.dueDate)}`
                : `Vence el ${shortDate(card.statement.period.dueDate)} · ${daysUntilDue} ${daysUntilDue === 1 ? 'día' : 'días'}`}
          </div>
        </>
      )}

      <div className="mt-3.5 space-y-1.5 border-t pt-3 text-[12px]" style={{ borderColor: 'var(--line)' }}>
        <Row
          label={`Saldo al corte ${shortDate(card.statement.period.cutoff)}`}
          value={money(card.statement.closingBalance, { compact: true })}
        />
        {toNumber(card.statement.deferredNotYetBilled) > 0 && (
          <Row
            label="Diferido a cuotas"
            value={`− ${money(card.statement.deferredNotYetBilled, { compact: true })}`}
            hint="aún no lo cobran"
            tone="var(--ink-muted)"
          />
        )}
        {toNumber(card.statement.paidSinceCutoff) > 0 && (
          <Row
            label="Abonado desde el corte"
            value={`− ${money(card.statement.paidSinceCutoff, { compact: true })}`}
            tone="var(--good)"
          />
        )}
        {card.statement.minimumPayment && !settled && (
          <Row label="Pago mínimo" value={money(card.statement.minimumPayment, { compact: true })} />
        )}
        <Row
          label={`Corte nuevo · cierra ${shortDate(card.currentCycle.cutoff)}`}
          value={money(card.currentCycle.charges, { compact: true })}
          hint="todavía no se debe"
        />
      </div>

      <div className="mt-3.5 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span style={{ color: 'var(--ink-muted)' }}>
            Usado {money(card.debt, { compact: true })} de {money(card.creditLimit, { compact: true })}
          </span>
          <span className="tabular font-semibold" style={{ color: usageColor }}>{usage}%</span>
        </div>
        <Meter percent={usage} color={usageColor} label={`${usage}% del límite de ${card.name}`} />
        <div className="mt-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          {money(card.availableCredit, { compact: true })} disponibles
        </div>
      </div>

      {!settled && (
        <div className="mt-4">
          <Button full icon="card" onClick={() => onPay(card)}>Pagar</Button>
        </div>
      )}
    </Card>
  );
}

function Row({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0 truncate" style={{ color: 'var(--ink-2)' }}>
        {label}
        {hint && <span style={{ color: 'var(--ink-muted)' }}> · {hint}</span>}
      </span>
      <span className="tabular shrink-0 font-semibold" style={{ color: tone }}>{value}</span>
    </div>
  );
}

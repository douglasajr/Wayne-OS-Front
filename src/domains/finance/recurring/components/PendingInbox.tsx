/**
 * Bandeja de recurrencias vencidas.
 *
 * Decision de la Fase 7: nada se cobra solo por defecto. Un cargo rechazado no
 * debe inventar un gasto ni descuadrar el saldo, asi que la ocurrencia espera
 * aqui hasta que la confirmes —pudiendo corregir el monto— o la saltes.
 *
 * Va ARRIBA de todo en el panel porque es lo unico de la pantalla que pide una
 * accion. El resto son cifras para mirar.
 */
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { categoryColor } from '@/domains/finance/shared/status';
import { shortDate } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import type { PendingItem } from '@/domains/finance/shared/types/recurring';

interface Props {
  items: PendingItem[];
  onConfirm: (item: PendingItem) => void;
  onSkip: (item: PendingItem) => void;
  busyRuleId?: string | null;
}

export function PendingInbox({ items, onConfirm, onSkip, busyRuleId }: Props) {
  if (items.length === 0) return null;

  return (
    <Card edge>
      <CardTitle
        action={
          <span className="label-deco text-[9px]" style={{ color: 'var(--warning)' }}>
            {items.length} {items.length === 1 ? 'pendiente' : 'pendientes'}
          </span>
        }
      >
        Por confirmar
      </CardTitle>

      <ul className="space-y-3">
        {items.map((item) => {
          const busy = busyRuleId === item.ruleId;
          return (
            <li key={item.ruleId}>
              <div className="flex items-start gap-2.5">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center"
                  style={{
                    background: `color-mix(in oklab, ${categoryColor(item.category?.color)} 16%, transparent)`,
                    color: categoryColor(item.category?.color),
                  }}
                >
                  <Icon name={item.category?.icon ?? 'repeat'} size={15} strokeWidth={2.1} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{item.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    venció el {shortDate(item.dueDate)}
                    {item.daysOverdue > 0 && ` · hace ${item.daysOverdue} ${item.daysOverdue === 1 ? 'día' : 'días'}`}
                    {item.overdueCount > 1 && ` · ${item.overdueCount} sin registrar`}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="tabular text-sm font-bold">
                    {item.amount ? money(item.amount, { compact: true }) : '—'}
                  </div>
                  {item.isEstimate && (
                    <div className="text-[10px]" style={{ color: 'var(--ink-muted)' }}>estimado</div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex gap-2 pl-10.5">
                <Button onClick={() => onConfirm(item)} loading={busy} className="flex-1">
                  {item.isEstimate || !item.amount ? 'Registrar…' : 'Confirmar'}
                </Button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => onSkip(item)}
                  disabled={busy}
                  title="Este mes no se cobró"
                >
                  Saltar
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        “Saltar” avanza al siguiente sin registrar gasto: úsalo cuando de verdad no te cobraron.
      </p>
    </Card>
  );
}

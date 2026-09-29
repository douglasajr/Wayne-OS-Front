/**
 * Tarjetas por pagar.
 *
 * Responde la unica pregunta urgente de una tarjeta: cuanto y cuando. El saldo
 * total no sirve para eso —mezcla el corte cerrado con las compras de ayer— y
 * por eso no es lo que se muestra.
 *
 * Solo aparece si hay algo que pagar. Una tarjeta al dia no necesita espacio.
 */
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Icon } from '@/core/components/ui/Icon';
import { shortDate, toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import type { DashboardSummary } from '@/domains/finance/shared/types/overview';

export function CardsDue({ cards }: { cards: DashboardSummary['cards'] }) {
  const pendientes = cards.filter((c) => toNumber(c.statementRemaining) > 0);
  if (pendientes.length === 0) return null;

  return (
    <Card>
      <CardTitle
        action={
          <Link
            to="/finanzas/tarjetas"
            className="label-deco inline-flex items-center gap-1.5 text-[9px]"
            style={{ color: 'var(--accent)' }}
          >
            Ver
            <Icon name="chevron-right" size={12} strokeWidth={2.4} />
          </Link>
        }
      >
        Tarjetas por pagar
      </CardTitle>

      <ul className="space-y-2.5">
        {pendientes.map((card) => {
          const urgent = card.isOverdue || card.daysUntilDue <= 3;
          const tone = card.isOverdue
            ? 'var(--critical)'
            : card.daysUntilDue <= 3
              ? 'var(--serious)'
              : 'var(--ink-muted)';

          return (
            <li key={card.id} className="flex items-center gap-2.5">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center"
                style={{ background: 'var(--surface-2)', color: urgent ? tone : 'var(--ink-2)' }}
              >
                <Icon name={card.isOverdue ? 'siren' : 'card'} size={15} strokeWidth={2} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {card.name.replace(' [demo]', '')}
                  {card.last4 && (
                    <span className="font-normal" style={{ color: 'var(--ink-muted)' }}> ····{card.last4}</span>
                  )}
                </div>
                <div className="text-[11px]" style={{ color: tone }}>
                  {card.isOverdue
                    ? `venció el ${shortDate(card.dueDate)}`
                    : card.daysUntilDue === 0
                      ? 'vence hoy'
                      : `vence el ${shortDate(card.dueDate)} · ${card.daysUntilDue} ${card.daysUntilDue === 1 ? 'día' : 'días'}`}
                </div>
              </div>

              <span className="tabular shrink-0 text-sm font-bold">
                {money(card.statementRemaining, { compact: true })}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        Es lo del corte ya cerrado. Lo que compraste después se paga en el siguiente.
      </p>
    </Card>
  );
}

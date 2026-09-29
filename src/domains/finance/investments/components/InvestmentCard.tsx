/**
 * Una posición de la cartera.
 *
 * El número grande es lo que VALE hoy; lo invertido es el contexto. La
 * ganancia lleva siempre signo y flecha además de color: en rojo-verde, el
 * color solo no comunica.
 *
 * Y lleva un aviso que no es decorativo: si el valor tiene meses, la ganancia
 * que muestra es vieja. Un número de hace medio año presentado como actual es
 * peor que no tener número.
 */
import { Card } from '@/core/components/ui/Card';
import { Icon, type IconName } from '@/core/components/ui/Icon';
import { Meter } from '@/core/components/ui/Meter';
import { monthLabel } from '@/core/lib/dates';
import { toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import type { Investment, InvestmentType } from '@/domains/finance/shared/types/investments';

/** Cada tipo con su icono y su color, del mismo catálogo que las categorías. */
const TIPO: Record<InvestmentType, { label: string; icon: IconName; color: string }> = {
  STOCK: { label: 'Acciones', icon: 'chart', color: 'var(--cat-2)' },
  ETF: { label: 'ETF', icon: 'chart', color: 'var(--cat-1)' },
  MUTUAL_FUND: { label: 'Fondo', icon: 'landmark', color: 'var(--cat-3)' },
  CRYPTO: { label: 'Cripto', icon: 'sparkles', color: 'var(--cat-7)' },
  FIXED_INCOME: { label: 'Renta fija', icon: 'landmark', color: 'var(--cat-4)' },
  REAL_ESTATE: { label: 'Inmueble', icon: 'home', color: 'var(--cat-5)' },
  BUSINESS: { label: 'Negocio', icon: 'wallet', color: 'var(--cat-6)' },
  OTHER: { label: 'Otro', icon: 'ellipsis', color: 'var(--cat-neutral)' },
};

/** Más de esto sin valuar y el valor deja de ser confiable. */
const STALE_DAYS = 90;

interface Props {
  investment: Investment;
  onValue: (investment: Investment) => void;
  onContribute: (investment: Investment) => void;
  onWithdraw: (investment: Investment) => void;
  onEdit: (investment: Investment) => void;
}

export function InvestmentCard({ investment, onValue, onContribute, onWithdraw, onEdit }: Props) {
  const meta = TIPO[investment.type];
  const gain = toNumber(investment.gain);
  const gainColor = gain > 0 ? 'var(--good)' : gain < 0 ? 'var(--critical)' : 'var(--ink-muted)';
  const stale = investment.staleDays === null || investment.staleDays > STALE_DAYS;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center"
            style={{
              background: `color-mix(in oklab, ${meta.color} 16%, transparent)`,
              color: meta.color,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Icon name={meta.icon} size={16} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {investment.name}
              {investment.symbol && (
                <span className="tabular ml-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  {investment.symbol}
                </span>
              )}
            </div>
            <div className="truncate text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              {meta.label}
              {investment.accountName ? ` · ${investment.accountName}` : ' · sin cuenta'}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="chip shrink-0"
          onClick={() => onEdit(investment)}
          aria-label={`Editar ${investment.name}`}
        >
          <Icon name="pencil" size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="tabular text-xl font-bold">{money(investment.currentValue, { compact: true })}</div>
          <div className="tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            invertido {money(investment.investedAmount, { compact: true })}
          </div>
        </div>
        <div className="tabular text-right text-sm font-semibold" style={{ color: gainColor }}>
          {gain > 0 ? '↑' : gain < 0 ? '↓' : '='} {money(Math.abs(gain), { compact: true })}
          <div className="text-[11px] font-normal">
            {gain === 0 ? 'sin cambio' : `${gain > 0 ? '+' : '−'}${Math.abs(Math.round(investment.gainPercent))}% ganancia`}
          </div>
        </div>
      </div>

      {investment.weight > 0 && (
        <div className="mt-2.5">
          <Meter
            percent={investment.weight}
            color={meta.color}
            height={6}
            label={`${investment.name}: ${Math.round(investment.weight)}% de la cartera`}
          />
          <div className="tabular mt-1 text-[10px]" style={{ color: 'var(--ink-muted)' }}>
            {Math.round(investment.weight)}% de tu cartera
          </div>
        </div>
      )}

      <div
        className="mt-3 flex items-start gap-2 px-3 py-2 text-[11px]"
        style={{
          background: 'var(--surface-2)',
          borderRadius: 'var(--radius-sm)',
          color: stale ? 'var(--warning)' : 'var(--ink-muted)',
        }}
      >
        <Icon name={stale ? 'alert' : 'check'} size={13} strokeWidth={2.2} />
        <span>
          {investment.lastValuationDate
            ? `Valor de ${monthLabel(investment.lastValuationDate)}${stale ? ' · conviene actualizarlo' : ''}`
            : 'Sin valuar: vale lo que costó hasta que registres su valor'}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="chip" onClick={() => onValue(investment)}>
          <Icon name="chart" size={14} strokeWidth={2.4} />
          Actualizar valor
        </button>
        {investment.accountId && (
          <>
            <button type="button" className="chip" onClick={() => onContribute(investment)}>
              <Icon name="plus" size={14} strokeWidth={2.4} />
              Aportar
            </button>
            {toNumber(investment.investedAmount) > 0 && (
              <button type="button" className="chip" onClick={() => onWithdraw(investment)}>
                <Icon name="out" size={14} strokeWidth={2.4} />
                Retirar
              </button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

/**
 * Cuatro cifras de contexto. No llevan color de serie: son magnitudes sueltas,
 * no categorias que haya que distinguir entre si. Solo la deuda y el
 * patrimonio negativo usan el color de estado.
 */
import { Icon, type IconName } from '@/core/components/ui/Icon';
import { toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import type { DashboardSummary } from '@/domains/finance/shared/types/overview';

export function LiquidityGrid({ liquidity }: { liquidity: DashboardSummary['liquidity'] }) {
  const netWorth = toNumber(liquidity.netWorth);
  const investments = toNumber(liquidity.investments ?? '0');
  const tiles: { label: string; value: string; icon: IconName; tone?: string; hint?: string }[] = [
    { label: 'Disponible', value: money(liquidity.available, { compact: true }), icon: 'wallet' },
    { label: 'Ahorro', value: money(liquidity.savings, { compact: true }), icon: 'shield' },
    {
      label: 'Deuda tarjetas',
      value: money(liquidity.debt, { compact: true }),
      icon: 'card',
      tone: toNumber(liquidity.debt) > 0 ? 'var(--serious)' : undefined,
    },
    {
      label: 'Patrimonio neto',
      value: money(netWorth, { compact: true }),
      icon: netWorth >= 0 ? 'arrow-up' : 'arrow-down',
      tone: netWorth >= 0 ? 'var(--good)' : 'var(--critical)',
      // Sin esta linea, el patrimonio sube de golpe al registrar inversiones y
      // no hay forma de saber de donde salio la diferencia.
      hint: investments !== 0 ? `incluye ${money(investments, { compact: true })} de inversiones` : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className=" border p-3.5"
          style={{ background: 'var(--surface)', borderColor: 'var(--line)', boxShadow: 'var(--shadow)' }}
        >
          <div className="mb-2 flex items-center gap-1.5" style={{ color: t.tone ?? 'var(--ink-muted)' }}>
            <Icon name={t.icon} size={14} strokeWidth={2.1} />
            <span className="label-deco truncate text-[9px]">{t.label}</span>
          </div>
          <div className="tabular text-lg font-bold sm:text-xl" style={{ color: t.tone ?? 'var(--ink)' }}>
            {t.value}
          </div>
          {t.hint && (
            <div className="tabular mt-1 text-[10px]" style={{ color: 'var(--ink-muted)' }}>
              {t.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

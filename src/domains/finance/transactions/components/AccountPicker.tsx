/**
 * Selector de cuenta en fichas.
 *
 * Un `<select>` obliga a abrir, leer y elegir; aqui la cuenta habitual se ve y
 * se toca de una vez. Cada ficha muestra el saldo porque elegir cuenta sin ver
 * cuanto tiene es adivinar.
 *
 * Las cuentas de deuda (tarjeta, prestamo) se marcan aparte: pagar con tarjeta
 * es un gasto igual (regla 3), pero conviene verlo distinto de sacar efectivo.
 */
import { Icon } from '@/core/components/ui/Icon';
import { ACCOUNT_TYPE } from '@/domains/finance/shared/accounts';
import { amount } from '@/domains/finance/shared/money';
import type { Account } from '@/domains/finance/shared/types/domain';

interface Props {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  error?: string;
  /** Cuenta que no se puede elegir (el otro extremo de una transferencia). */
  excludeId?: string;
}

export function AccountPicker({ accounts, value, onChange, label = 'Cuenta', error, excludeId }: Props) {
  const usable = accounts.filter((a) => !a.archivedAt && a.id !== excludeId);

  return (
    <div>
      <span className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
        {label}
      </span>

      {usable.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--ink-muted)' }}>
          No hay cuentas disponibles.
        </p>
      ) : (
        <div className="chip-row">
          {usable.map((a) => (
            <button
              key={a.id}
              type="button"
              className="chip"
              aria-pressed={value === a.id}
              onClick={() => onChange(a.id)}
            >
              <Icon name={ACCOUNT_TYPE[a.type].icon} size={15} strokeWidth={2} />
              <span className="flex flex-col items-start leading-tight">
                <span>{a.name}</span>
                <span className="tabular text-[10px] font-normal" style={{ color: 'var(--ink-muted)' }}>
                  {a.isDebt && a.availableCredit
                    ? `L ${amount(a.availableCredit, true)} disp.`
                    : `L ${amount(a.currentBalance, true)}`}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <span role="alert" className="mt-1.5 block text-[11px]" style={{ color: 'var(--critical)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

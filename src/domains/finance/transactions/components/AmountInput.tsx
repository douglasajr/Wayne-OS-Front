/**
 * Monto. Es el primer campo del registro rapido y el unico que siempre hay que
 * teclear, asi que ocupa el espacio que merece.
 *
 * `inputMode="decimal"` abre el teclado numerico en movil. El valor se guarda
 * como TEXTO y viaja como texto hasta la API: convertirlo a `number` aqui
 * seria justo el float que la regla 11 prohibe.
 */
import { useId } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  autoFocus?: boolean;
  error?: string;
  label?: string;
}

/** Digitos y un solo separador decimal, maximo dos decimales. */
function sanitize(raw: string): string {
  const cleaned = raw.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  if (rest.length === 0) return whole ?? '';
  return `${whole}.${rest.join('').slice(0, 2)}`;
}

export function AmountInput({
  value,
  onChange,
  currency = 'L',
  autoFocus = false,
  error,
  label = 'Monto',
}: Props) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2 border px-3.5"
        style={{
          background: 'var(--surface-2)',
          borderColor: error ? 'var(--critical)' : 'var(--line-strong)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <span className="figure text-2xl" style={{ color: 'var(--ink-muted)' }}>
          {currency}
        </span>
        <input
          id={id}
          data-autofocus={autoFocus ? '' : undefined}
          className="figure tabular w-full bg-transparent py-3 text-[34px] leading-tight outline-none"
          style={{ color: 'var(--ink)' }}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={value}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(sanitize(e.target.value))}
        />
      </div>
      {error && (
        <span role="alert" className="mt-1.5 block text-[11px]" style={{ color: 'var(--critical)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

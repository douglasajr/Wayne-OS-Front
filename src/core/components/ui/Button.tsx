/**
 * Boton. Tres tonos y un solo sitio donde vive el estilo, porque el mismo
 * rectangulo de latón aparecia copiado en cada pantalla.
 *
 * `min-height: 44px` en todas las variantes: es el minimo tactil de iOS y esta
 * aplicacion se usa sobre todo con el pulgar.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  full?: boolean;
  children?: ReactNode;
}

const TONE: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--accent)', color: 'var(--accent-ink)', border: '1px solid var(--accent)' },
  ghost: { background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line)' },
  danger: {
    background: 'color-mix(in oklab, var(--critical) 12%, transparent)',
    color: 'var(--critical)',
    border: '1px solid color-mix(in oklab, var(--critical) 34%, transparent)',
  },
};

export function Button({
  variant = 'primary',
  icon,
  loading = false,
  full = false,
  children,
  disabled,
  className = '',
  ...rest
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition-opacity active:opacity-80 ${
        full ? 'w-full' : ''
      } ${className}`}
      style={{
        ...TONE[variant],
        borderRadius: 'var(--radius-sm)',
        opacity: isDisabled ? 0.55 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
      {...rest}
    >
      {loading ? (
        <span className="label-deco text-[10px]">Guardando…</span>
      ) : (
        <>
          {icon && <Icon name={icon} size={17} strokeWidth={2.1} />}
          {children}
        </>
      )}
    </button>
  );
}

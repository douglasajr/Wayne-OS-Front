/**
 * Campos de formulario.
 *
 * El mensaje de error va SIEMPRE con `role="alert"` y bajo el campo que lo
 * causa, no en un resumen arriba: en movil, un resumen fuera de pantalla deja
 * al usuario tocando "Guardar" sin entender por que no pasa nada.
 */
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

interface LabelProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function FieldShell({ label, hint, error, children, htmlFor }: LabelProps) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
        {label}
      </span>
      {children}
      {error ? (
        <span role="alert" className="mt-1.5 block text-[11px]" style={{ color: 'var(--critical)' }}>
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, ...rest }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <input
        className="field"
        style={error ? { borderColor: 'var(--critical)' } : undefined}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function SelectField({ label, hint, error, children, ...rest }: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      <select
        className="field"
        style={error ? { borderColor: 'var(--critical)' } : undefined}
        aria-invalid={error ? true : undefined}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

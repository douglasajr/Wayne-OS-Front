import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
  /** Filo de latón en el borde superior. Se reserva para los paneles clave. */
  edge?: boolean;
}

export function Card({ children, className = '', as: Tag = 'section', edge = false }: CardProps) {
  return (
    <Tag
      className={`${edge ? 'edge-top ' : ''}border p-4 sm:p-5 ${className}`}
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--line)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
      }}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-baseline justify-between gap-3">
      <h2 className="label-deco truncate text-[10px]" style={{ color: 'var(--ink-muted)' }}>
        {children}
      </h2>
      {action}
    </div>
  );
}

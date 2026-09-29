import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** Vacio con salida: siempre ofrece la accion que lo resuelve. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-4 py-10 text-center">
      <div
        className="mx-auto mb-3.5 grid h-12 w-12 place-items-center border"
        style={{ borderColor: 'var(--line)', color: 'var(--ink-muted)', borderRadius: 'var(--radius-sm)' }}
      >
        <Icon name={icon} size={22} strokeWidth={1.6} />
      </div>
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-[13px]" style={{ color: 'var(--ink-2)' }}>
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

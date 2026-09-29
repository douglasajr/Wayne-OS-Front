/**
 * Marco de una seccion del Command Center.
 *
 * El encabezado existe para que, cuando haya mas de un dominio, se sepa de un
 * vistazo donde termina uno y empieza otro. Con una sola seccion es casi
 * invisible a proposito: no vamos a poner un titulo gigante para adornar.
 */
import type { ReactNode } from 'react';
import { Card } from '@/core/components/ui/Card';
import { Icon, type IconName } from '@/core/components/ui/Icon';

interface Props {
  title: string;
  icon: IconName;
  children: ReactNode;
}

export function SectionShell({ title, icon, children }: Props) {
  return (
    <section className="space-y-3.5 lg:space-y-4">
      <h2 className="label-deco flex items-center gap-2 px-1 text-[10px]" style={{ color: 'var(--ink-muted)' }}>
        <Icon name={icon} size={13} strokeWidth={2.2} />
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Una seccion que no cargo. Degrada sola: el resto del sistema sigue a la vista. */
export function SectionError({ title, icon, message }: { title: string; icon: IconName; message: string }) {
  return (
    <SectionShell title={title} icon={icon}>
      <Card>
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center" style={{ color: 'var(--serious)' }}>
            <Icon name="alert" size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Esta sección no cargó</p>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-2)' }}>{message}</p>
          </div>
        </div>
      </Card>
    </SectionShell>
  );
}

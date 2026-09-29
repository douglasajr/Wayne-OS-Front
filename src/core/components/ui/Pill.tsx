/**
 * Etiqueta de estado: color + icono + palabra. Los tres, SIEMPRE.
 *
 * El color nunca comunica solo: alguien con daltonismo rojo-verde no
 * distinguiria "vas bien" de "te pasaste". Esa regla es del sistema de diseño
 * entero, no de las finanzas.
 *
 * FASE 13 — antes esto era `StatusPill` y vivia aqui importando el semaforo de
 * presupuesto desde `domains/finance/`: un componente del nucleo que sabia lo
 * que es un tope de gasto. Ahora el nucleo pone la FORMA y cada dominio pone el
 * SIGNIFICADO (ver `domains/finance/shared/components/StatusPill.tsx`).
 */
import { Icon, type IconName } from './Icon';

export interface PillMeta {
  label: string;
  /** Cualquier color del tema: `var(--good)`, `var(--critical)`... */
  color: string;
  icon: IconName;
}

export function Pill({ meta, compact = false }: { meta: PillMeta; compact?: boolean }) {
  return (
    <span
      className="label-deco inline-flex shrink-0 items-center gap-1.5 px-2 py-1 text-[9px]"
      style={{
        background: `color-mix(in oklab, ${meta.color} 14%, transparent)`,
        color: meta.color,
        border: `1px solid color-mix(in oklab, ${meta.color} 34%, transparent)`,
        borderRadius: 'var(--radius-pill)',
      }}
    >
      <Icon name={meta.icon} size={13} strokeWidth={2.4} />
      {!compact && meta.label}
    </span>
  );
}

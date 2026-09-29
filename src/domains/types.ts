/**
 * El contrato que cumple un dominio de WAYNE OS en el cliente.
 *
 * Espejo de `backend/src/domains/types.ts`. Un dominio ofrece estas cosas y el
 * armazon no sabe nada mas de el: ni que pantallas tiene, ni como calcula lo
 * que muestra.
 */
import type { ComponentType, ReactElement } from 'react';
import type { IconName } from '@/core/components/ui/Icon';
import type { DomainNav } from '@/platform/navigation';

export interface DomainClient {
  /** El mismo id que usa el backend: con el se casan seccion y renderizador. */
  id: string;
  /** Lo que aporta al menu. */
  nav: DomainNav;
  /** Con que se pinta su seccion del Command Center. */
  section: { icon: IconName; component: ComponentType<{ data: never }> };
  /**
   * Tarjetas que suma a la pantalla de Ajustes. Cargan sus propios datos: el
   * armazon las compone sin saber que ajustan.
   */
  settingsCards?: ComponentType[];
  /** Sus rutas, ya con carga diferida. */
  routes: ReactElement[];
  /** Redirecciones de URLs antiguas hacia su prefijo. */
  legacyRedirects?: Record<string, string>;
}

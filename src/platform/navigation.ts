/**
 * Navegacion de WAYNE OS.
 *
 * Tres bloques con jerarquia distinta:
 *   - el Command Center, que no pertenece a ningun dominio;
 *   - un grupo por dominio, aportado por el propio dominio;
 *   - la plataforma (ajustes), al final.
 *
 * La barra inferior del movil tiene cinco huecos y uno se lo lleva el boton de
 * registro rapido, asi que sus accesos se eligen a mano: no puede crecer con
 * cada dominio que aparezca.
 */
import type { IconName } from '@/core/components/ui/Icon';
import { DOMAIN_CLIENTS } from '@/domains';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

export interface DomainNav {
  id: string;
  label: string;
  icon: IconName;
  items: NavItem[];
  /** Rutas sin entrada de menu, solo para el titulo de la barra superior. */
  subpages?: Record<string, string>;
}

export const HOME: NavItem = { to: '/', label: 'Inicio', icon: 'home' };

/**
 * El orden del catalogo es el orden del menu (Fase 13: ya no se enumeran los
 * dominios aqui, se leen del catalogo).
 */
export const DOMAINS: DomainNav[] = DOMAIN_CLIENTS.map((d) => d.nav);

export const PLATFORM_NAV: NavItem[] = [
  { to: '/ajustes', label: 'Ajustes', icon: 'ellipsis' },
];

/**
 * Los cuatro accesos de la barra inferior, dos a cada lado del boton.
 *
 * Se toman del PRIMER dominio del catalogo porque la barra tiene cinco huecos
 * y no puede crecer con cada dominio: cual va abajo es una decision de
 * producto, no algo que se derive solo. Hoy el primero es Finance.
 */
const PRINCIPAL = DOMAINS[0];
export const BOTTOM_BAR: [NavItem, NavItem, NavItem, NavItem] = [
  HOME,
  PRINCIPAL!.items[0]!,
  PRINCIPAL!.items[1]!,
  PRINCIPAL!.items[2]!,
];

const SUBPAGES: Record<string, string> = {
  '/ajustes': 'Ajustes',
  ...Object.assign({}, ...DOMAINS.map((d) => d.subpages ?? {})),
};

/** Titulo de la barra superior en movil. */
export function titleFor(pathname: string): string {
  if (pathname === '/') return 'Command Center';
  if (SUBPAGES[pathname]) return SUBPAGES[pathname]!;

  for (const domain of DOMAINS) {
    const item = domain.items.find((i) => i.to === pathname);
    if (item) return item.label;
  }
  return PLATFORM_NAV.find((i) => i.to === pathname)?.label ?? 'WAYNE OS';
}

/**
 * El contrato del catálogo de dominios, desde el cliente.
 *
 * Es el gemelo de `backend/tests/integration/domains.test.ts`. La Fase 13
 * prometió que agregar un dominio es una línea y que el armazón no sabe quién
 * lo llena; esto lo vuelve verificable del lado del navegador.
 *
 * Lo que más protege: **que cada entrada del menú lleve a una ruta que
 * existe**. Es el fallo más fácil de introducir —se añade una pantalla al menú
 * y se olvida la ruta, o se renombra el prefijo— y el typecheck no lo ve
 * porque las dos son cadenas sueltas. El usuario se encuentra un 404 dentro de
 * su propia aplicación.
 */
import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { DOMAIN_BY_ID, DOMAIN_CLIENTS } from '@/domains';
import { BOTTOM_BAR, DOMAINS, HOME, titleFor } from '@/platform/navigation';

/** Las rutas son `<Route path=... />`: aquí se leen sus `path`. */
function pathsOf(routes: ReactElement[]): string[] {
  return routes.map((route) => (route.props as { path?: string }).path ?? '');
}

const ALL_PATHS = DOMAIN_CLIENTS.flatMap((d) => pathsOf(d.routes));

describe('catálogo de dominios', () => {
  it('cada dominio cumple el contrato completo', () => {
    expect(DOMAIN_CLIENTS.length).toBeGreaterThan(0);

    for (const domain of DOMAIN_CLIENTS) {
      expect(domain.id, 'id').toBeTruthy();
      expect(domain.nav.id, `${domain.id}.nav.id`).toBe(domain.id);
      expect(domain.nav.items.length, `${domain.id}.nav.items`).toBeGreaterThan(0);
      expect(domain.section.component, `${domain.id}.section.component`).toBeTruthy();
      expect(domain.routes.length, `${domain.id}.routes`).toBeGreaterThan(0);
    }
  });

  it('se indexa por id sin perder ninguno', () => {
    expect(Object.keys(DOMAIN_BY_ID).sort()).toEqual(DOMAIN_CLIENTS.map((d) => d.id).sort());
  });

  it('ningún dominio pisa la ruta de otro', () => {
    const duplicadas = ALL_PATHS.filter((p, i) => ALL_PATHS.indexOf(p) !== i);
    expect(duplicadas, `rutas repetidas: ${duplicadas.join(', ')}`).toEqual([]);
  });

  it('cada dominio cuelga de su propio prefijo', () => {
    // La URL tiene que decir a qué área de la vida pertenece lo que miras.
    for (const domain of DOMAIN_CLIENTS) {
      const prefijos = new Set(pathsOf(domain.routes).map((p) => p.split('/')[1]));
      expect(prefijos.size, `${domain.id} reparte sus rutas en ${[...prefijos].join(', ')}`).toBe(1);
    }
  });
});

describe('el menú no lleva a ninguna parte rota', () => {
  it('cada entrada del menú tiene su ruta declarada', () => {
    for (const domain of DOMAINS) {
      for (const item of domain.items) {
        expect(ALL_PATHS, `«${item.label}» apunta a ${item.to}, que no existe`).toContain(item.to);
      }
    }
  });

  it('cada subpágina con título tiene su ruta', () => {
    for (const domain of DOMAINS) {
      for (const path of Object.keys(domain.subpages ?? {})) {
        expect(ALL_PATHS, `la subpágina ${path} no existe`).toContain(path);
      }
    }
  });

  it('la barra inferior del móvil apunta a rutas reales', () => {
    expect(BOTTOM_BAR[0]).toEqual(HOME);
    for (const item of BOTTOM_BAR.slice(1)) {
      expect(ALL_PATHS, `la barra inferior apunta a ${item.to}`).toContain(item.to);
    }
  });

  it('las redirecciones antiguas terminan en rutas que existen', () => {
    // Los marcadores del navegador y la pantalla de inicio del móvil dependen
    // de esto: una redirección rota es un 404 en la cara del usuario.
    for (const domain of DOMAIN_CLIENTS) {
      for (const [desde, hacia] of Object.entries(domain.legacyRedirects ?? {})) {
        expect(ALL_PATHS, `${desde} redirige a ${hacia}, que no existe`).toContain(hacia);
        expect(ALL_PATHS, `${desde} es a la vez ruta y redirección`).not.toContain(desde);
      }
    }
  });
});

describe('títulos de la barra superior', () => {
  it('cada ruta del menú tiene su título', () => {
    for (const domain of DOMAINS) {
      for (const item of domain.items) {
        expect(titleFor(item.to)).toBe(item.label);
      }
    }
  });

  it('la raíz es el Command Center y lo desconocido no revienta', () => {
    expect(titleFor('/')).toBe('Command Center');
    expect(titleFor('/ruta/que/no/existe')).toBe('WAYNE OS');
  });
});

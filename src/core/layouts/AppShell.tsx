/**
 * Armazon de la aplicacion.
 *
 * Mobile primero: barra inferior fija con las cinco acciones reales, respetando
 * el area segura del iPhone. A partir de lg la navegacion se mueve a una barra
 * lateral y la inferior desaparece.
 *
 * El boton de registro rapido esta en el centro de la barra inferior porque es
 * la accion que mas se repite: anotar un gasto debe costar un pulgar, no un
 * viaje por un menu.
 *
 * La barra inferior solo tiene cuatro huecos, asi que en movil el RESTO de la
 * navegacion (Ajustes, Reportes, Tarjetas...) vive en un menu del encabezado.
 * Antes no habia ninguno: en el telefono esas pantallas solo se alcanzaban
 * tecleando la URL. El menu se arma con el mismo catalogo que la barra
 * lateral, asi que un dominio nuevo aparece en los dos sin tocar este archivo.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@/core/components/ui/Icon';
import { Sheet } from '@/core/components/ui/Sheet';
import { BatEmblem } from '@/core/components/BatEmblem';
import { useTheme } from '@/core/hooks/useTheme';
import { useAuth } from '@/platform/auth/hooks/useAuth';
import {
  BOTTOM_BAR,
  DOMAINS,
  HOME,
  PLATFORM_NAV,
  titleFor,
  type NavItem,
} from '@/platform/navigation';

/**
 * La accion del boton central de la barra inferior.
 *
 * FASE 13 — antes el armazon importaba `useTransactionSheets` de Finance y el
 * boton abria el registro rapido de gastos: el nucleo dependia de un dominio.
 * Ahora la accion la INYECTA quien compone la aplicacion (`routes/index.tsx`,
 * que hace de raiz de composicion igual que `app.ts` en el backend). Sin
 * accion, el boton no se dibuja.
 */
export interface QuickAction {
  label: string;
  onTrigger: () => void;
}

export function AppShell({
  children,
  quickAction,
}: {
  children: ReactNode;
  quickAction?: QuickAction;
}) {
  const { isDark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const title = titleFor(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  // Elegir un destino cierra el menu: la navegacion ya ocurrio.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="min-h-dvh lg:flex" style={{ background: 'var(--page)' }}>
      {/* --- Barra lateral (solo escritorio) --- */}
      <aside
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r px-3 py-5 lg:flex"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
      >
        <div className="mb-7 px-2">
          <div className="flex items-center gap-2.5">
            <div
              className="grid h-9 w-9 place-items-center border"
              style={{ borderColor: 'var(--line-strong)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
            >
              <BatEmblem size={21} />
            </div>
            <div className="min-w-0">
              <span className="wordmark block text-[13px]">WAYNE OS</span>
              <span className="label-deco block text-[8px]" style={{ color: 'var(--ink-muted)' }}>
                Personal Command Center
              </span>
            </div>
          </div>
          <div className="mt-3 h-px" style={{ background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
        </div>

        <nav className="flex flex-col gap-0.5">
          <SidebarLink item={HOME} />

          {DOMAINS.map((domain) => (
            <div key={domain.id} className="mt-4">
              <span
                className="label-deco block px-3 pb-1.5 text-[8px]"
                style={{ color: 'var(--ink-muted)' }}
              >
                {domain.label}
              </span>
              {domain.items.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </div>
          ))}

          <div className="mt-4">
            {PLATFORM_NAV.map((item) => (
              <SidebarLink key={item.to} item={item} />
            ))}
          </div>
        </nav>

        <div className="mt-auto border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <div className="mb-1 flex items-center gap-2.5 px-3 py-2">
            <div
              className="grid h-7 w-7 shrink-0 place-items-center border"
              style={{ borderColor: 'var(--line)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
            >
              <Icon name="user" size={14} strokeWidth={1.8} />
            </div>
            <span className="truncate text-[13px] font-medium">{user?.name}</span>
          </div>

          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium"
            style={{ color: 'var(--ink-2)', borderRadius: 'var(--radius-sm)' }}
            aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={17} />
            {isDark ? 'Tema claro' : 'Tema oscuro'}
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium"
            style={{ color: 'var(--ink-2)', borderRadius: 'var(--radius-sm)' }}
          >
            <Icon name="logout" size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* --- Encabezado movil --- */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur lg:hidden"
          style={{
            borderColor: 'var(--line)',
            background: 'color-mix(in oklab, var(--page) 88%, transparent)',
            paddingTop: 'max(12px, env(safe-area-inset-top))',
          }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="grid h-8 w-8 shrink-0 place-items-center border"
              style={{ borderColor: 'var(--line-strong)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
            >
              <BatEmblem size={19} />
            </div>
            <span className="label-deco truncate text-[12px]">{title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={toggle}
              className="grid h-9 w-9 place-items-center border"
              style={{ borderColor: 'var(--line)', color: 'var(--ink-2)', borderRadius: 'var(--radius-sm)' }}
              aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={16} />
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="grid h-9 w-9 place-items-center border"
              style={{ borderColor: 'var(--line)', color: 'var(--ink-2)', borderRadius: 'var(--radius-sm)' }}
              aria-label="Cerrar sesión"
            >
              <Icon name="logout" size={16} />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-9 w-9 place-items-center border"
              style={{ borderColor: 'var(--line)', color: 'var(--ink-2)', borderRadius: 'var(--radius-sm)' }}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
            >
              <Icon name="menu" size={16} />
            </button>
          </div>
        </header>

        {/* --- Menu movil: todo lo que no cabe en la barra inferior --- */}
        <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menú" subtitle={user?.name}>
          <nav className="flex flex-col gap-0.5 pb-[env(safe-area-inset-bottom)]">
            <SidebarLink item={HOME} />

            {DOMAINS.map((domain) => (
              <div key={domain.id} className="mt-3">
                <span
                  className="label-deco block px-3 pb-1.5 text-[8px]"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  {domain.label}
                </span>
                {domain.items.map((item) => (
                  <SidebarLink key={item.to} item={item} />
                ))}
              </div>
            ))}

            <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
              {PLATFORM_NAV.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
              <button
                type="button"
                onClick={() => void logout()}
                className="flex w-full items-center gap-2.5 border-l-2 border-transparent px-3 py-2.5 text-sm font-medium"
                style={{ color: 'var(--ink-2)' }}
              >
                <Icon name="logout" size={18} strokeWidth={1.8} />
                Cerrar sesión
              </button>
            </div>
          </nav>
        </Sheet>

        <main
          className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 sm:px-5 lg:px-8 lg:pt-8"
          // Espacio para que la barra inferior no tape la ultima tarjeta.
          style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}
        >
          {children}
        </main>
      </div>

      {/* --- Barra inferior (solo movil) --- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur lg:hidden"
        style={{
          borderColor: 'var(--line)',
          background: 'color-mix(in oklab, var(--surface) 92%, transparent)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-2">
          <TabLink item={BOTTOM_BAR[0]} />
          <TabLink item={BOTTOM_BAR[1]} />

          <div className="flex justify-center">
            {quickAction && (
            <button
              type="button"
              onClick={quickAction.onTrigger}
              className="-mt-5 grid h-13 w-13 rotate-45 place-items-center transition-transform active:scale-95"
              style={{
                height: 52,
                width: 52,
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                borderRadius: 'var(--radius)',
                boxShadow: '0 6px 22px color-mix(in oklab, var(--accent) 38%, transparent)',
              }}
              aria-label={quickAction.label}
            >
              {/* El rombo es del contenedor; el icono se endereza. */}
              <span className="-rotate-45">
                <Icon name="plus" size={24} strokeWidth={2.4} />
              </span>
            </button>
            )}
          </div>

          <TabLink item={BOTTOM_BAR[2]} />
          <TabLink item={BOTTOM_BAR[3]} />
        </div>
      </nav>
    </div>
  );
}

function TabLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      // 56px de alto: por encima del minimo tactil de 44px de iOS.
      className="label-deco flex min-h-14 flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[9px]"
      style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--ink-muted)' })}
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} size={21} strokeWidth={isActive ? 2.3 : 1.8} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className="flex items-center gap-2.5 border-l-2 px-3 py-2.5 text-sm font-medium transition-colors"
      style={({ isActive }) => ({
        color: isActive ? 'var(--accent)' : 'var(--ink-2)',
        background: isActive ? 'color-mix(in oklab, var(--accent) 9%, transparent)' : 'transparent',
        borderLeftColor: isActive ? 'var(--accent)' : 'transparent',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} size={18} strokeWidth={isActive ? 2.2 : 1.8} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

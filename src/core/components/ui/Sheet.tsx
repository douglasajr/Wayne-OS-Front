/**
 * Panel modal. En movil sube desde abajo; desde sm se centra como dialogo.
 *
 * Decisiones que no son cosmeticas:
 *  - el cuerpo de la pagina se bloquea mientras esta abierto: sin eso, en iOS
 *    el scroll se "filtra" al fondo y el usuario pierde el formulario de vista;
 *  - Escape y el fondo cierran, pero el contenido no propaga el clic;
 *  - el foco entra al panel y VUELVE al elemento que lo abrio al cerrar, que es
 *    lo que espera quien navega con teclado o lector de pantalla;
 *  - el area de acciones respeta `env(safe-area-inset-bottom)`: en un iPhone,
 *    el boton de guardar quedaba debajo de la barra gestual.
 */
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Linea de apoyo bajo el titulo. */
  subtitle?: string;
  children: ReactNode;
  /** Barra de acciones fija al pie. */
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

export function Sheet({ open, onClose, title, subtitle, children, footer, size = 'md' }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  // El foco se guarda ANTES de mover nada; al cerrar se devuelve.
  useEffect(() => {
    if (!open) return;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Se enfoca el primer campo real; si no hay, el panel mismo, para que
    // Escape funcione sin obligar a hacer clic dentro.
    const first = panelRef.current?.querySelector<HTMLElement>(
      '[data-autofocus], input:not([type="hidden"]), select, textarea, button',
    );
    first?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      restoreFocusTo.current?.focus();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={onKeyDown}
    >
      <div
        className="sheet-backdrop absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={`sheet-panel relative flex max-h-[92dvh] w-full flex-col border ${
          size === 'lg' ? 'sm:max-w-xl' : 'sm:max-w-md'
        }`}
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--line-strong)',
          boxShadow: 'var(--shadow)',
        }}
      >
        {/* Filo de latón: el mismo detalle que marca los paneles clave. */}
        <span
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) 60%, transparent) 20%, color-mix(in oklab, var(--accent) 60%, transparent) 80%, transparent)',
          }}
        />

        <header
          className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5"
          style={{ borderColor: 'var(--line)' }}
        >
          <div className="min-w-0">
            <h2 className="label-deco truncate text-[11px]">{title}</h2>
            {subtitle && (
              <p className="mt-1 truncate text-[12px]" style={{ color: 'var(--ink-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center border"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-2)', borderRadius: 'var(--radius-sm)' }}
            aria-label="Cerrar"
          >
            <Icon name="x" size={16} strokeWidth={2} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {footer && (
          <footer
            className="shrink-0 border-t px-4 py-3.5 sm:px-5"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--surface-raised)',
              paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * COMMAND CENTER — la pantalla principal de WAYNE OS.
 *
 * Responde "¿cuál es el estado actual de mi sistema?" componiendo las secciones
 * que aportan los dominios. Hoy solo existe Finance, asi que se parece mucho al
 * panel de antes: es intencional. La alternativa —una pantalla nueva con los
 * mismos numeros al lado del panel de finanzas— seria una vista de adorno.
 *
 * Lo que SI cambio es la estructura: cada dominio trae su seccion, el registro
 * vive en el backend y agregar Body NO toca este archivo (Fase 13).
 */
import type { ComponentType } from 'react';
import { Card } from '@/core/components/ui/Card';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { Icon, type IconName } from '@/core/components/ui/Icon';
import { ApiError } from '@/core/lib/api';
import { DOMAIN_BY_ID } from '@/domains';
import { useCommandCenter } from '../api';
import { SectionError, SectionShell } from '../components/SectionShell';

/**
 * Que componente pinta cada seccion.
 *
 * El backend decide QUE secciones hay y en que orden; el dominio dice COMO se
 * ve la suya. Una seccion desconocida se ignora, de modo que el cliente nunca
 * se rompe porque el servidor vaya por delante.
 *
 * FASE 13 — antes este mapa nombraba a Finance a mano, asi que agregar un
 * dominio obligaba a editar un archivo del armazon. Ahora sale del catalogo.
 */
const RENDERERS: Record<string, { icon: IconName; component: ComponentType<{ data: never }> }> =
  Object.fromEntries(
    Object.values(DOMAIN_BY_ID).map((d) => [
      d.id,
      { icon: d.section.icon, component: d.section.component },
    ]),
  );

export function CommandCenterPage() {
  const { data, isLoading, error, refetch, isFetching } = useCommandCenter();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!data) return null;

  return (
    <div className="space-y-6 lg:space-y-7">
      {data.sections.map((section) => {
        const renderer = RENDERERS[section.id];
        if (!renderer) return null;
        const Component = renderer.component;

        if (section.status === 'error') {
          return (
            <SectionError
              key={section.id}
              title={section.title}
              icon={renderer.icon}
              message={section.message ?? 'Sin detalle.'}
            />
          );
        }

        return (
          <SectionShell key={section.id} title={section.title} icon={renderer.icon}>
            <Component data={section.data as never} />
          </SectionShell>
        );
      })}

      <p className="pt-1 pb-2 text-center text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        {isFetching ? 'Actualizando…' : 'WAYNE OS · Personal Command Center'}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3.5">
      <Skeleton height={196} />
      <Skeleton height={132} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={84} />)}
      </div>
      <Skeleton height={220} />
    </div>
  );
}

/** Fallo de transporte: no cargo NADA. Distinto de una seccion caida. */
function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const isNetwork = error instanceof ApiError && error.code === 'NETWORK_ERROR';
  const message = error instanceof Error ? error.message : 'Error desconocido';
  const requestId = error instanceof ApiError ? error.requestId : undefined;

  return (
    <Card className="mt-6 text-center">
      <div
        className="mx-auto mb-3 grid h-12 w-12 place-items-center "
        style={{ background: 'color-mix(in oklab, var(--critical) 14%, transparent)', color: 'var(--critical)' }}
      >
        <Icon name="alert" size={24} />
      </div>
      <h2 className="text-base font-bold">El sistema no responde</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm" style={{ color: 'var(--ink-2)' }}>{message}</p>

      {isNetwork && (
        <pre
          className="mx-auto mt-3 max-w-sm overflow-x-auto  px-3 py-2.5 text-left text-[11px]"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-2)' }}
        >
          cd backend && npm run dev
        </pre>
      )}
      {requestId && (
        <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>id: {requestId}</p>
      )}

      <button
        type="button"
        onClick={onRetry}
        className="mt-4  px-4 py-2.5 text-sm font-semibold"
        style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
      >
        Reintentar
      </button>
    </Card>
  );
}

/**
 * Rutas de WAYNE OS — la RAIZ DE COMPOSICION del cliente.
 *
 * Es el gemelo de `app.ts` en el backend: el unico archivo que ve el armazon y
 * los dominios a la vez. Monta las rutas que aporta cada dominio del catalogo
 * (`src/domains/index.ts`), sus redirecciones antiguas y la accion rapida.
 *
 * `/` es el Command Center. Cada dominio cuelga de su propio prefijo, de modo
 * que la URL dice a que area de la vida pertenece lo que estas mirando.
 *
 * **Fase 13.** Antes las diez rutas de Finance estaban escritas aqui a mano,
 * con sus diez `lazy` y su tabla de redirecciones: agregar una pantalla —o un
 * dominio— obligaba a editar este archivo. Ahora se itera sobre el contrato.
 *
 * **Carga diferida.** Solo el Command Center y el login viajan en el paquete
 * inicial; cada pantalla llega cuando se entra en ella.
 */
import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/core/layouts/AppShell';
import { Card } from '@/core/components/ui/Card';
import { Icon, type IconName } from '@/core/components/ui/Icon';
import { BatEmblem } from '@/core/components/BatEmblem';
import { useAuth } from '@/platform/auth/hooks/useAuth';
import { LoginPage } from '@/platform/auth/pages/LoginPage';
import { CommandCenterPage } from '@/platform/command-center/pages/CommandCenterPage';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { DOMAIN_CLIENTS } from '@/domains';
import {
  TransactionSheetsProvider,
  useTransactionSheets,
} from '@/domains/finance/transactions/hooks/useTransactionSheets';

// Cada pantalla, su propio trozo. `lazy` necesita exportacion por defecto, y
// estos modulos exportan con nombre: de ahi el `.then`.
const SettingsPage = lazy(() =>
  import('@/platform/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

/**
 * Lo que se ve mientras baja el trozo de una pantalla. Ocupa el alto de una
 * tarjeta para que el armazon no salte cuando llega el contenido.
 */
function RouteFallback() {
  return (
    <div className="space-y-3.5">
      <Skeleton height={220} />
      <Skeleton height={160} />
    </div>
  );
}

/** Marcador para las secciones que llegan en fases posteriores. */
function ComingSoon({ title, phase, icon }: { title: string; phase: string; icon: IconName }) {
  return (
    <Card className="mt-8 text-center">
      <div
        className="mx-auto mb-3.5 grid h-12 w-12 place-items-center border"
        style={{ borderColor: 'var(--line)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
      >
        <Icon name={icon} size={22} strokeWidth={1.6} />
      </div>
      <h2 className="label-deco text-[13px]">{title}</h2>
      <p className="mt-2 text-sm" style={{ color: 'var(--ink-2)' }}>{phase}</p>
    </Card>
  );
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center" style={{ background: 'var(--page)' }}>
      <div className="text-center">
        <div className="mb-4 flex animate-pulse justify-center" style={{ color: 'var(--accent)' }}>
          <BatEmblem size={54} />
        </div>
        <p className="label-deco text-[10px]" style={{ color: 'var(--ink-muted)' }}>
          Verificando sesión
        </p>
      </div>
    </div>
  );
}

/**
 * Rutas planas de antes de la Fase 5.5 -> su casa dentro del dominio. Cada
 * dominio declara las suyas; los marcadores del navegador siguen funcionando.
 */
const LEGACY: Record<string, string> = Object.assign(
  {},
  ...DOMAIN_CLIENTS.map((d) => d.legacyRedirects ?? {}),
);

/**
 * El armazon con su accion rapida.
 *
 * Que abre el boton central de la barra inferior es una decision de PRODUCTO,
 * no de arquitectura: solo cabe una, y hoy es registrar un gasto, que es lo
 * que se hace veinte veces al dia. El armazon ya no lo sabe —lo recibe—, asi
 * que cuando exista un segundo dominio esta es la linea que se discute, no un
 * import enterrado en `core/`.
 */
function Shell({ children }: { children: ReactNode }) {
  const { openQuick } = useTransactionSheets();
  return (
    <AppShell quickAction={{ label: 'Registrar gasto', onTrigger: openQuick }}>{children}</AppShell>
  );
}

export function AppRoutes() {
  const { status } = useAuth();

  // Mientras se valida la sesión guardada no se muestra el login: haría
  // parpadear la pantalla en cada recarga.
  if (status === 'checking') return <Splash />;
  if (status === 'anonymous') return <LoginPage />;

  // El proveedor de los paneles de registro envuelve al armazon, no a las
  // rutas: el boton central de la barra inferior vive en el armazon y tiene que
  // poder abrirlos desde cualquier pantalla.
  return (
    <TransactionSheetsProvider>
      <Shell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
          {/* --- Plataforma --- */}
          <Route path="/" element={<CommandCenterPage />} />
          <Route path="/ajustes" element={<SettingsPage />} />

          {/* --- Dominios: cada uno aporta las suyas --- */}
          {DOMAIN_CLIENTS.flatMap((domain) => domain.routes)}

          {/* --- Compatibilidad --- */}
          {Object.entries(LEGACY).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}

          <Route path="*" element={<ComingSoon title="Página no encontrada" phase="Revisa la dirección" icon="alert" />} />
          </Routes>
        </Suspense>
      </Shell>
    </TransactionSheetsProvider>
  );
}

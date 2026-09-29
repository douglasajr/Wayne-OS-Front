/**
 * Todo lo que Finance aporta a la pantalla de Ajustes, con sus propios datos.
 *
 * FASE 13 — antes la pantalla de Ajustes (que es del armazón) llamaba a
 * `usePlanSettings`, un hook del dominio, y le pasaba los datos a cada tarjeta.
 * Era la última fuga: `platform` sabiendo que existe un plan financiero.
 *
 * Ahora el dominio carga lo suyo y el armazón solo compone. La consulta se hace
 * una vez aunque haya varias tarjetas: React Query las une por clave.
 */
import { Card } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { ApiError } from '@/core/lib/api';
import { usePlanSettings } from '@/domains/finance/shared/api';
import { PlanCard } from './PlanCard';
import { MeasurementCard } from './MeasurementCard';
import { CatalogsCard } from './CatalogsCard';

export function FinanceSettingsCards() {
  const query = usePlanSettings();

  if (query.isLoading) return <Skeleton height={280} />;

  if (query.error) {
    return (
      <Card className="text-center">
        <p role="alert" className="text-sm" style={{ color: 'var(--critical)' }}>
          {query.error instanceof ApiError
            ? query.error.message
            : 'No se pudieron cargar los ajustes de finanzas.'}
        </p>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        </div>
      </Card>
    );
  }

  if (!query.data) return null;

  return (
    <>
      <PlanCard data={query.data} />
      <MeasurementCard data={query.data} />
      <CatalogsCard />
    </>
  );
}

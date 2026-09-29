/**
 * Ajustes.
 *
 * No sabe qué se ajusta: compone las tarjetas que declara cada dominio en su
 * contrato (`settingsCards`) y ya. Cada tarjeta carga sus propios datos, así
 * que el día que Body traiga las suyas aparecen solas y esta pantalla no
 * cambia.
 *
 * Hasta la Fase 12 aquí había una lista de «todavía no» con el plan financiero
 * y los umbrales; los tres se volvieron editables y la lista desapareció, que
 * es lo que el proyecto exige: nada de adornos sin datos detrás.
 */
import { Card } from '@/core/components/ui/Card';
import { EmptyState } from '@/core/components/ui/EmptyState';
import { DOMAIN_CLIENTS } from '@/domains';

export function SettingsPage() {
  const cards = DOMAIN_CLIENTS.flatMap((domain) =>
    (domain.settingsCards ?? []).map((Component, index) => ({
      key: `${domain.id}-${index}`,
      Component,
    })),
  );

  if (cards.length === 0) {
    return (
      <Card className="mt-6">
        <EmptyState
          icon="ellipsis"
          title="Nada que ajustar todavía"
          description="Los ajustes los aportan los dominios. Cuando alguno tenga algo configurable, aparecerá aquí."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3.5 lg:space-y-4">
      {cards.map(({ key, Component }) => (
        <Component key={key} />
      ))}
    </div>
  );
}

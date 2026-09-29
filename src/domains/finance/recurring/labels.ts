/** Etiquetas de recurrencia. Un solo sitio, para que la pantalla y el panel
 *  no digan la misma frecuencia con dos palabras distintas. */
import type { RecurrenceFrequency, RecurrenceKind } from '@/domains/finance/shared/types/recurring';
import type { IconName } from '@/core/components/ui/Icon';

export const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  DAILY: 'cada día',
  WEEKLY: 'cada semana',
  BIWEEKLY: 'cada quincena',
  MONTHLY: 'cada mes',
  BIMONTHLY: 'cada 2 meses',
  QUARTERLY: 'cada trimestre',
  SEMIANNUAL: 'cada 6 meses',
  ANNUAL: 'cada año',
};

/** Con intervalo: "cada 3 meses" en vez de "cada mes" repetido tres veces. */
export function frequencyLabel(frequency: RecurrenceFrequency, interval: number): string {
  if (interval <= 1) return FREQUENCY_LABEL[frequency];
  const unit: Partial<Record<RecurrenceFrequency, string>> = {
    DAILY: 'días',
    WEEKLY: 'semanas',
    BIWEEKLY: 'quincenas',
    MONTHLY: 'meses',
    ANNUAL: 'años',
  };
  const word = unit[frequency];
  return word ? `cada ${interval} ${word}` : `${FREQUENCY_LABEL[frequency]} ×${interval}`;
}

export const KIND: Record<RecurrenceKind, { label: string; hint: string; icon: IconName }> = {
  FIXED: {
    label: 'Gasto fijo',
    hint: 'Mismo monto siempre: renta, internet, colegiatura.',
    icon: 'home',
  },
  VARIABLE: {
    label: 'Gasto variable',
    hint: 'Recurre, pero el monto cambia: luz, agua. El monto real se captura al confirmar.',
    icon: 'plug',
  },
  SUBSCRIPTION: {
    label: 'Suscripción',
    hint: 'Servicio con proveedor y renovación: Netflix, Spotify, iCloud.',
    icon: 'repeat',
  },
};

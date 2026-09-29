/**
 * Navegacion entre ciclos.
 *
 * El selector empieza vacio a proposito: sin year/month/sequence el backend
 * devuelve el ciclo vigente, que es lo que se quiere ver al entrar. Solo al
 * moverse se fijan los tres campos.
 */
import { useCallback, useState } from 'react';
import type { BudgetPeriodInfo, PeriodSelector } from '@/domains/finance/shared/types/budget';

export function usePeriodNavigation() {
  const [selector, setSelector] = useState<PeriodSelector>({});

  /**
   * Avanza o retrocede un ciclo partiendo del que devolvio el backend, no de
   * lo que el cliente crea: el numero de ciclos por mes depende del modo
   * (quincenal o mensual) y esa configuracion vive en el servidor.
   */
  const step = useCallback((period: BudgetPeriodInfo, direction: -1 | 1) => {
    const biweekly = period.sequence === 2 || hasTwoCycles(period);
    let { year, month, sequence } = period;

    if (biweekly) {
      sequence += direction;
      if (sequence > 2) { sequence = 1; month += 1; }
      if (sequence < 1) { sequence = 2; month -= 1; }
    } else {
      month += direction;
      sequence = 1;
    }

    if (month > 12) { month = 1; year += 1; }
    if (month < 1) { month = 12; year -= 1; }

    setSelector({ year, month, sequence });
  }, []);

  const reset = useCallback(() => setSelector({}), []);

  return { selector, step, reset, isFollowingToday: selector.year === undefined };
}

/**
 * Un ciclo que no llega al fin de mes es media quincena. Es la unica pista que
 * da la respuesta sobre el modo configurado, y evita pedir los ajustes aparte.
 */
function hasTwoCycles(period: BudgetPeriodInfo): boolean {
  const last = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
  return Number(period.endDate.slice(8, 10)) < last;
}

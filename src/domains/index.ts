/**
 * EL CATALOGO DE DOMINIOS (cliente).
 *
 * Agregar un dominio al frontend de WAYNE OS es escribir su `client.tsx` y
 * sumarlo a esta lista. Una linea. Ni `core/` ni `platform/` ni `routes/`
 * cambian.
 *
 * Antes de la Fase 13 habia que tocar cuatro archivos del armazon: la
 * navegacion, el mapa de renderizadores del Command Center, las rutas y la
 * pantalla de ajustes. La promesa estaba en los comentarios, no en el codigo.
 *
 * El orden es el orden del menu y el de lectura del Command Center.
 */
import { financeClient } from './finance/client';
import type { DomainClient } from './types';

export type { DomainClient } from './types';

export const DOMAIN_CLIENTS: DomainClient[] = [financeClient];

/** Indexado por id, que es como llegan las secciones desde el backend. */
export const DOMAIN_BY_ID: Record<string, DomainClient> = Object.fromEntries(
  DOMAIN_CLIENTS.map((d) => [d.id, d]),
);

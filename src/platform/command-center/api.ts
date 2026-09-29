/**
 * Datos del Command Center.
 *
 * UNA consulta para toda la pantalla principal. El backend resuelve las
 * secciones en paralelo y aisla sus fallos, asi que el cliente no orquesta
 * nada: pide, y pinta lo que venga bien.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/lib/api';

export type SectionStatus = 'ok' | 'error';

export interface Section<T = unknown> {
  id: string;
  title: string;
  status: SectionStatus;
  /** Presente solo si `status === 'ok'`. */
  data?: T;
  /** Presente solo si `status === 'error'`. */
  message?: string;
}

export interface CommandCenterView {
  generatedAt: string;
  sections: Section[];
}

/** Clave unica: todo lo que cambie el estado del sistema la invalida. */
export const commandCenterKey = ['command-center'] as const;

export function useCommandCenter() {
  return useQuery({
    queryKey: commandCenterKey,
    queryFn: ({ signal }) => api.get<CommandCenterView>('/command-center', signal),
    staleTime: 30_000,
  });
}

/** La seccion de un dominio, tipada por quien la pide. */
export function sectionOf<T>(view: CommandCenterView | undefined, id: string): Section<T> | undefined {
  return view?.sections.find((s) => s.id === id) as Section<T> | undefined;
}

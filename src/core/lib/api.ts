/**
 * Cliente HTTP.
 *
 * Tres responsabilidades, todas en un solo lugar para que ninguna pantalla
 * tenga que pensarlas:
 *  1. desempacar el sobre `{ data }` / `{ error }` del backend;
 *  2. adjuntar el access token;
 *  3. refrescar la sesion cuando el token caduca (cada 15 minutos) y reintentar
 *     la peticion, sin que el usuario note nada.
 *
 * El refresh se serializa: si cinco peticiones reciben 401 a la vez, solo una
 * llama a /auth/refresh y las otras cuatro esperan. Sin esto, cuatro de ellas
 * canjearian un refresh token ya rotado y cerrarian la sesion.
 */
import { clearSession, readSession, writeSession } from './auth-storage';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope<T> {
  data?: T;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string; requestId?: string; details?: unknown };
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  signal?: AbortSignal;
  /** false en las rutas de sesion, que no llevan token. */
  auth?: boolean;
}

/** Se avisa a la aplicacion cuando la sesion muere para mandar al login. */
type SessionListener = () => void;
const sessionListeners = new Set<SessionListener>();

export function onSessionExpired(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function endSession(): void {
  clearSession();
  sessionListeners.forEach((l) => l());
}

/** Igual que `rawRequest`, pero conserva el sobre completo. */
async function rawRequestFull<T>(
  path: string,
  options: RequestOptions,
  token?: string,
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const data = await rawRequest<T>(path, options, token, true);
  return data as unknown as { data: T; meta?: Record<string, unknown> };
}

async function rawRequest<T>(
  path: string,
  options: RequestOptions,
  token?: string,
  withMeta = false,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Revisa que el backend esté corriendo.',
      0,
      'NETWORK_ERROR',
    );
  }

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => ({}))) as Envelope<T>;

  if (!response.ok || body.error) {
    throw new ApiError(
      body.error?.message ?? `Error ${response.status}`,
      response.status,
      body.error?.code ?? 'UNKNOWN',
      body.error?.requestId,
      body.error?.details,
    );
  }

  return (withMeta ? { data: body.data, meta: body.meta } : body.data) as T;
}

/** Un solo refresh en vuelo; el resto espera a esta promesa. */
let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const session = readSession();
  if (!session) throw new ApiError('Sesión no iniciada', 401, 'UNAUTHORIZED');

  refreshInFlight ??= (async () => {
    try {
      const result = await rawRequest<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        { method: 'POST', body: { refreshToken: session.refreshToken } },
      );
      writeSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      return result.accessToken;
    } catch (error) {
      // El refresh tambien caduco o fue revocado: no hay forma de seguir.
      endSession();
      throw error;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const needsAuth = options.auth !== false;
  const session = readSession();

  if (needsAuth && !session) throw new ApiError('Sesión no iniciada', 401, 'UNAUTHORIZED');

  try {
    return await rawRequest<T>(path, options, needsAuth ? session?.accessToken : undefined);
  } catch (error) {
    const expired =
      error instanceof ApiError && error.status === 401 && needsAuth && !path.startsWith('/auth/refresh');

    if (!expired) throw error;

    const freshToken = await refreshAccessToken();
    return rawRequest<T>(path, options, freshToken);
  }
}

/** Variante que devuelve tambien la paginacion y los totales del listado. */
async function apiGetWithMeta<T, M>(path: string, signal?: AbortSignal): Promise<{ data: T; meta: M }> {
  const session = readSession();
  if (!session) throw new ApiError('Sesión no iniciada', 401, 'UNAUTHORIZED');

  try {
    return (await rawRequestFull<T>(path, { signal }, session.accessToken)) as { data: T; meta: M };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const fresh = await refreshAccessToken();
    return (await rawRequestFull<T>(path, { signal }, fresh)) as { data: T; meta: M };
  }
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiRequest<T>(path, { signal }),
  getWithMeta: apiGetWithMeta,
  post: <T>(path: string, body?: unknown, opts?: { auth?: boolean }) =>
    apiRequest<T>(path, { method: 'POST', body, auth: opts?.auth }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  /** Para recursos idempotentes: poner el mismo limite dos veces da lo mismo. */
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};

/** Compatibilidad con el codigo que ya usaba apiGet. */
export const apiGet = <T>(path: string, signal?: AbortSignal) => api.get<T>(path, signal);

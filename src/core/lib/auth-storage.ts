/**
 * Guarda la sesion en localStorage.
 *
 * Decision documentada en docs/DEPLOYMENT.md §5: con el dominio gratuito de
 * Vercel, el frontend y la API quedan en dominios distintos y una cookie seria
 * third-party (Safari y los bloqueadores la descartan). El precio es que el
 * token queda expuesto a XSS; se compensa con tokens de 15 minutos y una CSP
 * estricta en la API.
 *
 * Todo acceso va envuelto: en Safari privado, con cookies bloqueadas o en un
 * iframe, tocar localStorage lanza y tumbaria la aplicacion entera.
 */
const ACCESS = 'my-wallet.access';
const REFRESH = 'my-wallet.refresh';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
}

export function readSession(): StoredSession | null {
  try {
    const accessToken = localStorage.getItem(ACCESS);
    const refreshToken = localStorage.getItem(REFRESH);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  } catch {
    return null;
  }
}

export function writeSession(session: StoredSession): void {
  try {
    localStorage.setItem(ACCESS, session.accessToken);
    localStorage.setItem(REFRESH, session.refreshToken);
  } catch {
    /* sesion solo en memoria durante esta pestaña */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  } catch {
    /* nada que limpiar */
  }
}

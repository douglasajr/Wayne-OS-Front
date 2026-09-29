/**
 * Estado de sesion.
 *
 * `status` distingue tres situaciones que la interfaz debe tratar distinto:
 *  - checking: hay tokens guardados pero aun no sabemos si valen. Mostrar el
 *    login aqui haria parpadear la pantalla en cada recarga.
 *  - authenticated / anonymous: lo esperado.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, onSessionExpired } from '@/core/lib/api';
import { clearSession, readSession, writeSession } from '@/core/lib/auth-storage';
import { rememberName } from '../components/WelcomeIntro';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

type Status = 'checking' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: Status;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(() => (readSession() ? 'checking' : 'anonymous'));
  const [user, setUser] = useState<AuthUser | null>(null);

  // Validar la sesion guardada contra el servidor al arrancar: un token puede
  // haber sido revocado desde otro dispositivo.
  useEffect(() => {
    if (status !== 'checking') return;
    let cancelled = false;

    api
      .get<AuthUser>('/auth/me')
      .then((profile) => {
        if (cancelled) return;
        setUser({ id: profile.id, username: profile.username, name: profile.name });
        rememberName(profile.name);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        setStatus('anonymous');
      });

    return () => { cancelled = true; };
  }, [status]);

  // El cliente HTTP avisa cuando el refresh falla definitivamente.
  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setStatus('anonymous');
      }),
    [],
  );

  const applySession = useCallback((result: AuthResponse) => {
    writeSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    // El nombre se guarda aparte del token: al cerrar sesión se borra la
    // sesión pero el saludo de bienvenida sigue sabiendo a quién saludar.
    rememberName(result.user.name);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      applySession(await api.post<AuthResponse>('/auth/login', { username, password }, { auth: false }));
    },
    [applySession],
  );

  const register = useCallback(
    async (name: string, username: string, password: string) => {
      applySession(await api.post<AuthResponse>('/auth/register', { name, username, password }, { auth: false }));
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const session = readSession();
    if (session) {
      // Si la red falla, la sesion local se cierra igual: el usuario pidio salir.
      await api.post('/auth/logout', { refreshToken: session.refreshToken }, { auth: false }).catch(() => undefined);
    }
    clearSession();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

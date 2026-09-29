/**
 * Acceso.
 *
 * Una sola pantalla para entrar y para crear la cuenta inicial: el backend
 * cierra el registro despues del primer usuario (bootstrap), asi que separar
 * ambas en dos rutas sobraria para una app personal.
 */
import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '@/core/lib/api';
import { Icon } from '@/core/components/ui/Icon';
import { BatEmblem } from '@/core/components/BatEmblem';
import { useTheme } from '@/core/hooks/useTheme';
import { WelcomeIntro, shouldShowIntro } from '../components/WelcomeIntro';

type Mode = 'login' | 'register';

export function LoginPage() {
  const { login, register } = useAuth();
  const { isDark, toggle } = useTheme();

  const [intro, setIntro] = useState(shouldShowIntro);
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') await login(username, password);
      else await register(name, username, password);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.code === 'FORBIDDEN'
            ? 'El registro está cerrado en esta instancia.'
            : err.message
          : 'Ocurrió un error inesperado.',
      );
      setBusy(false);
    }
  }

  if (intro) return <WelcomeIntro onDone={() => setIntro(false)} />;

  return (
    <div
      className="hatch relative grid min-h-dvh place-items-center px-4 py-10"
      style={{ background: 'var(--page)' }}
    >
      {/* Halo de latón detrás de la tarjeta: profundidad sin cargar la pantalla. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[55vh]"
        style={{ background: 'radial-gradient(60% 55% at 50% 0%, var(--accent-glow), transparent 70%)' }}
      />

      <button
        type="button"
        onClick={toggle}
        className="absolute top-5 right-5 grid h-9 w-9 place-items-center border"
        style={{ borderColor: 'var(--line)', color: 'var(--ink-muted)', borderRadius: 'var(--radius-sm)' }}
        aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      >
        <Icon name={isDark ? 'sun' : 'moon'} size={16} />
      </button>

      <main className="relative w-full max-w-[400px]">
        <header className="mb-8 text-center">
          <div className="mb-5 flex justify-center" style={{ color: 'var(--accent)' }}>
            <BatEmblem size={84} glow title="WAYNE OS" />
          </div>

          <h1 className="wordmark text-[26px] leading-none" style={{ color: 'var(--ink)' }}>
            WAYNE OS
          </h1>
          <p className="label-deco mt-2 text-[9px]" style={{ color: 'var(--ink-muted)' }}>
            Personal Command Center
          </p>

          {/* Regla déco: línea, rombo, línea. */}
          <div className="mt-3.5 flex items-center justify-center gap-2.5" aria-hidden="true">
            <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, var(--accent))' }} />
            <span className="h-1.5 w-1.5 rotate-45" style={{ background: 'var(--accent)' }} />
            <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
          </div>

          <p className="label-deco mt-3.5 text-[10px]" style={{ color: 'var(--ink-muted)' }}>
            Control patrimonial
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="edge-top border p-6"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--line)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h2 className="label-deco mb-5 text-[11px]" style={{ color: 'var(--ink-2)' }}>
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>

          <div className="space-y-3.5">
            {mode === 'register' && (
              <Field label="Nombre">
                <input
                  className="field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                  placeholder="Tu nombre"
                />
              </Field>
            )}

            <Field label="Usuario">
              <input
                className="field"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                // Sin autocorrección ni mayúscula inicial: en el teclado del
                // teléfono, iOS capitaliza la primera letra y rompería el
                // usuario si el servidor no lo normalizara.
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                minLength={3}
                pattern="[A-Za-z0-9._\-]+"
                placeholder="tu usuario"
              />
            </Field>

            <Field label="Contraseña">
              <div className="relative">
                <input
                  className="field pr-11"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={mode === 'register' ? 12 : undefined}
                  placeholder={mode === 'register' ? 'Mínimo 12 caracteres' : '••••••••••••'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center"
                  style={{ color: 'var(--ink-muted)' }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={17} />
                </button>
              </div>
              {mode === 'register' && (
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  Doce caracteres o más. La longitud protege mucho mejor que los símbolos.
                </p>
              )}
            </Field>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 border px-3 py-2.5 text-[13px]"
              style={{
                borderColor: 'color-mix(in oklab, var(--critical) 40%, transparent)',
                background: 'color-mix(in oklab, var(--critical) 10%, transparent)',
                color: 'var(--ink)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ color: 'var(--critical)' }}>
                <Icon name="alert" size={15} strokeWidth={2.2} />
              </span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="label-deco mt-6 w-full py-3.5 text-[12px] transition-opacity disabled:opacity-55"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>

          <div className="mt-5 border-t pt-4 text-center" style={{ borderColor: 'var(--line)' }}>
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-[13px] underline-offset-4 hover:underline"
              style={{ color: 'var(--ink-2)' }}
            >
              {mode === 'login' ? '¿Primera vez? Crear la cuenta' : 'Ya tengo cuenta'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          El registro se cierra solo después de la primera cuenta.
        </p>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-deco mb-1.5 block text-[10px]" style={{ color: 'var(--ink-muted)' }}>
        {label}
      </span>
      {children}
    </label>
  );
}

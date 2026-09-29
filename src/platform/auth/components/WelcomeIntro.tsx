/**
 * Secuencia de bienvenida.
 *
 * Aparece una vez por sesion del navegador, antes de la pantalla de acceso.
 * Tres reglas para que no estorbe:
 *  - se puede saltar con un toque o cualquier tecla; una animacion que no se
 *    puede omitir se vuelve un peaje a partir de la tercera vez;
 *  - pero NO durante el primer segundo y medio: un toque suelto o un clic
 *    heredado de la pantalla anterior se comia el saludo antes de mostrarlo;
 *  - con `prefers-reduced-motion` no se muestra: se pasa directo al acceso.
 *
 * El nombre sale de la ultima sesion guardada en este navegador. La primera
 * vez, cuando todavia no hay nombre, el saludo se queda en el generico.
 */
import { useEffect, useState } from 'react';
import { BatEmblem } from '@/core/components/BatEmblem';

const SEEN_KEY = 'my-wallet.introSeen';
const NAME_KEY = 'my-wallet.lastName';

export function rememberName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* sin persistencia: el saludo saldra generico la proxima vez */
  }
}

function readName(): string | null {
  try {
    return localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

/** Solo una vez por pestaña: recargar mientras se programa no debe castigar. */
export function shouldShowIntro(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return sessionStorage.getItem(SEEN_KEY) === null;
  } catch {
    return true;
  }
}

function markSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* se volvera a ver en la siguiente carga; es inofensivo */
  }
}

export function WelcomeIntro({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const name = readName();

  useEffect(() => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      setLeaving(true);
      window.setTimeout(() => {
        markSeen();
        onDone();
      }, 650);
    };

    // El nombre alcanza opacidad plena a 1.8s; la escena se sostiene hasta
    // 4.6s para dejar tiempo de leerlo sin prisa.
    const timer = window.setTimeout(finish, 4600);

    // Saltar solo cuando el saludo ya se ve: antes de eso, un toque suelto lo
    // haría desaparecer sin haberse mostrado nunca.
    let skippable = false;
    const allow = window.setTimeout(() => { skippable = true; }, 1500);

    const skip = () => {
      if (!skippable) return;
      window.clearTimeout(timer);
      finish();
    };

    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(allow);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [onDone]);

  return (
    <div
      className={`intro ${leaving ? 'intro-out' : ''}`}
      style={{ background: 'var(--page)' }}
      role="status"
      aria-live="polite"
    >
      <div className="intro-vignette" aria-hidden="true" />

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="intro-emblem" style={{ color: 'var(--accent)' }}>
          <BatEmblem size={128} glow title="WAYNE OS" />
        </div>

        {/* Regla déco: se abre desde el centro. */}
        <div className="intro-rule mt-7 flex items-center gap-3" aria-hidden="true">
          <span className="intro-rule-line" />
          <span className="intro-rule-gem" />
          <span className="intro-rule-line" />
        </div>

        <p className="intro-hello label-deco mt-7 text-[11px]" style={{ color: 'var(--accent)' }}>
          Bienvenido
        </p>

        <h1
          className="intro-name wordmark mt-3 text-[34px] leading-none sm:text-[42px]"
          style={{ color: 'var(--ink)' }}
        >
          {name ?? 'WAYNE OS'}
        </h1>
      </div>

      <p className="intro-skip label-deco absolute bottom-9 text-[9px]" style={{ color: 'var(--ink-muted)' }}>
        Toca para continuar
      </p>
    </div>
  );
}

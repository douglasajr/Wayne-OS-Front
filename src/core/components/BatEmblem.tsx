/**
 * Emblema de la aplicacion.
 *
 * Murcielago geometrico propio, todo en rectas, al gusto art déco.
 * No reproduce el emblema de ningun comic ni pelicula: esos son marcas
 * registradas. La silueta es original; la geometria, la del resto del tema.
 *
 * Las proporciones se eligieron probando el mismo trazo a 120, 72, 40 y 22 px:
 * con el cuerpo mas ancho la figura se leia como una corona, y mas estrecho se
 * deshacia en el tamaño pequeño del armazon.
 *
 * El `viewBox` es cuadrado aunque la figura sea ancha, para que el emblema
 * ocupe una caja predecible junto a los iconos de la interfaz.
 */
interface Props {
  size?: number;
  className?: string;
  /** Halo detras de la figura. Solo en la intro y en la pantalla de acceso. */
  glow?: boolean;
  title?: string;
}

export function BatEmblem({ size = 28, className, glow = false, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {glow && (
        <defs>
          <filter id="bat-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <g filter={glow ? 'url(#bat-glow)' : undefined}>
        <path
          d="
            M 46 27 L 50 34 L 54 27
            L 56 40 L 72 35 L 97 31
            L 86 44 L 81 39
            L 70 49 L 65 42
            L 56 51 L 53 57 L 50 64
            L 47 57 L 44 51
            L 35 42 L 30 49
            L 19 39 L 14 44
            L 3 31 L 28 35 L 44 40
            Z
          "
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

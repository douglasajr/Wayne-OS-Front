/**
 * Barra de progreso de presupuesto.
 *
 * Detalles que no son cosmeticos:
 *  - el relleno se ancla a la linea base y redondea 4px solo el extremo del
 *    dato, no la pista entera: asi el ojo compara longitudes, no capsulas;
 *  - el color de estado va acompañado SIEMPRE de icono y texto en el bloque
 *    que la usa, nunca solo;
 *  - al exceder el 100% la barra se llena y muestra una marca de desborde,
 *    en vez de crecer fuera de su caja o recortarse en silencio.
 */
interface MeterProps {
  percent: number;
  color: string;
  height?: number;
  /** Marca opcional (por ejemplo, el punto del mes en que vamos). */
  marker?: number | null;
  label?: string;
}

export function Meter({ percent, color, height = 8, marker = null, label }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const exceeded = percent > 100;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height, borderRadius: 2, background: 'var(--surface-2)' }}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="absolute inset-y-0 left-0 transition-[width] duration-500 ease-out"
        style={{
          width: `${clamped}%`,
          background: color,
          // Extremo del dato redondeado y base recta: el ojo compara
          // longitudes, no cápsulas. Es especificación de datos, no estilo.
          borderTopRightRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
      {exceeded && (
        // Franja diagonal: el desborde se ve aunque el color no se distinga.
        <div
          className="absolute inset-y-0 right-0 w-1/5"
          style={{
            background:
              'repeating-linear-gradient(135deg, rgba(255,255,255,.55) 0 2px, transparent 2px 5px)',
          }}
        />
      )}
      {marker !== null && marker > 0 && marker < 100 && (
        <div
          className="absolute inset-y-0 w-px"
          style={{ left: `${marker}%`, background: 'var(--ink)', opacity: 0.35 }}
        />
      )}
    </div>
  );
}

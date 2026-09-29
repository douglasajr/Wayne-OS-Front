/**
 * Primitivas de grafica, en SVG y a mano.
 *
 * Por que no una libreria: el frontend tiene cuatro dependencias y las dos
 * "graficas" que ya existian (el medidor del presupuesto y el donut del fondo)
 * son SVG escrito. Meter Recharts sumaria ~100KB gzip sobre 139KB para dibujar
 * barras y una linea, y habria que pelear su tema para que no desentone.
 *
 * Decisiones que no son cosmeticas:
 *
 * - **El color nunca comunica solo.** Toda serie lleva leyenda con texto, y
 *   cada grafica un `<title>` que la describe para lectores de pantalla. Es la
 *   misma regla del semaforo de presupuesto.
 * - **El eje empieza en cero.** Una grafica de barras que empieza en 15,000
 *   convierte un 3% en un acantilado. Si hay negativos, el cero se dibuja.
 * - **El mes en curso se raya**, no se oculta ni se pinta igual: va a medias y
 *   compararlo de tu a tu con meses cerrados es mentir.
 * - Las dimensiones son un `viewBox` con `width: 100%`: escala sola en movil
 *   sin recalcular nada en JavaScript.
 */
import { useId } from 'react';
import { money } from '@/domains/finance/shared/money';
import { monthLabel } from '@/core/lib/dates';

/** "2026-09" -> "sep". Las barras no caben con "septiembre". */
export function shortMonth(label: string): string {
  const full = monthLabel(label);
  const [name, year] = full.split(' ');
  return `${(name ?? '').slice(0, 3)} ${(year ?? '').slice(2)}`;
}

export interface Serie {
  key: string;
  label: string;
  color: string;
  values: number[];
}

interface BarsProps {
  months: string[];
  series: Serie[];
  /** Marca los meses que van a medias. */
  partial?: boolean[];
  /** Descripcion para lectores de pantalla. */
  title: string;
  height?: number;
}

/**
 * Barras agrupadas: una tira por mes, una barra por serie.
 *
 * Los valores negativos bajan del cero, que se dibuja como linea: un mes en
 * rojo tiene que VERSE por debajo, no solo leerse.
 */
export function GroupedBars({ months, series, partial, title, height = 180 }: BarsProps) {
  const id = useId();
  if (months.length === 0 || series.length === 0) return null;

  const all = series.flatMap((s) => s.values);
  const max = Math.max(0, ...all);
  const min = Math.min(0, ...all);
  const span = max - min || 1;

  // Coordenadas internas: el viewBox escala a cualquier ancho real.
  const W = 100;
  const padY = 6;
  const usable = 100 - padY * 2;
  const y = (v: number) => padY + ((max - v) / span) * usable;
  const zero = y(0);

  const slot = W / months.length;
  const groupPad = slot * 0.18;
  const barW = (slot - groupPad * 2) / series.length;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} 100`}
        preserveAspectRatio="none"
        style={{ width: '100%', height }}
        role="img"
        aria-labelledby={`${id}-title`}
      >
        <title id={`${id}-title`}>{title}</title>

        <defs>
          {/* Trama del mes a medias: se distingue sin depender del color. */}
          <pattern id={`${id}-partial`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="4" fill="var(--surface-2)" />
            <line x1="0" y1="0" x2="0" y2="4" stroke="var(--ink-muted)" strokeWidth="1.2" opacity="0.45" />
          </pattern>
        </defs>

        <line x1="0" y1={zero} x2={W} y2={zero} stroke="var(--line)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

        {months.map((_, monthIndex) => (
          <g key={monthIndex}>
            {partial?.[monthIndex] && (
              <rect
                x={monthIndex * slot}
                y={padY}
                width={slot}
                height={usable}
                fill={`url(#${id}-partial)`}
                opacity="0.5"
              />
            )}
            {series.map((serie, serieIndex) => {
              const value = serie.values[monthIndex] ?? 0;
              const top = value >= 0 ? y(value) : zero;
              const barH = Math.abs(y(value) - zero);
              return (
                <rect
                  key={serie.key}
                  x={monthIndex * slot + groupPad + serieIndex * barW}
                  y={top}
                  width={Math.max(barW - 0.6, 0.6)}
                  height={Math.max(barH, value === 0 ? 0 : 0.6)}
                  fill={serie.color}
                  rx="0.5"
                />
              );
            })}
          </g>
        ))}
      </svg>

      <div className="mt-1.5 flex" aria-hidden="true">
        {months.map((label, i) => (
          <span
            key={label}
            className="tabular text-center text-[10px]"
            style={{ width: `${100 / months.length}%`, color: 'var(--ink-muted)' }}
          >
            {shortMonth(label)}
            {partial?.[i] ? '*' : ''}
          </span>
        ))}
      </div>

      <Legend series={series} partial={partial?.some(Boolean) ?? false} />
    </div>
  );
}

interface LineProps {
  months: string[];
  values: number[];
  color: string;
  title: string;
  partial?: boolean[];
  height?: number;
}

/** Linea con area: para una magnitud que se acumula, como el patrimonio. */
export function AreaLine({ months, values, color, title, partial, height = 160 }: LineProps) {
  const id = useId();
  if (values.length === 0) return null;

  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;

  const W = 100;
  const padY = 8;
  const usable = 100 - padY * 2;
  const y = (v: number) => padY + ((max - v) / span) * usable;
  const x = (i: number) => (values.length === 1 ? W / 2 : (i / (values.length - 1)) * W);

  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const area = `${x(0)},${y(min)} ${points} ${x(values.length - 1)},${y(min)}`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} 100`}
        preserveAspectRatio="none"
        style={{ width: '100%', height }}
        role="img"
        aria-labelledby={`${id}-title`}
      >
        <title id={`${id}-title`}>{title}</title>

        <line x1="0" y1={y(0)} x2={W} y2={y(0)} stroke="var(--line)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

        <polygon points={area} fill={color} opacity="0.12" />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {values.map((v, i) => (
          <circle
            key={months[i] ?? i}
            cx={x(i)}
            cy={y(v)}
            r="1.4"
            // El ultimo punto es "hoy": se rellena para distinguirlo.
            fill={i === values.length - 1 ? color : 'var(--surface)'}
            stroke={color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div className="mt-1.5 flex" aria-hidden="true">
        {months.map((label, i) => (
          <span
            key={label}
            className="tabular text-center text-[10px]"
            style={{ width: `${100 / months.length}%`, color: 'var(--ink-muted)' }}
          >
            {shortMonth(label)}
            {partial?.[i] ? '*' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function Legend({ series, partial }: { series: Serie[]; partial: boolean }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1">
      {series.map((serie) => (
        <span key={serie.key} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-2)' }}>
          <span
            aria-hidden="true"
            style={{ width: 8, height: 8, borderRadius: 2, background: serie.color, display: 'inline-block' }}
          />
          {serie.label}
        </span>
      ))}
      {partial && (
        <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          * mes en curso, todavía incompleto
        </span>
      )}
    </div>
  );
}

/** Barras mínimas dentro de una fila de tabla: la tendencia de una categoría. */
export function Sparkbars({ values, color, label }: { values: number[]; color: string; label: string }) {
  const max = Math.max(...values, 1);
  return (
    <span className="flex h-6 items-end gap-0.5" role="img" aria-label={label}>
      {values.map((v, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: `${Math.max((v / max) * 100, v > 0 ? 8 : 3)}%`,
            background: v > 0 ? color : 'var(--line)',
            borderRadius: 1,
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  );
}

/** Texto de variación: flecha, signo e importe. Nunca solo color. */
export function Delta({ amount, percent }: { amount: string | null; percent: number | null }) {
  if (amount === null) {
    return (
      <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        sin comparación
      </span>
    );
  }

  const n = Number(amount);
  if (n === 0) {
    return (
      <span className="tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        = igual
      </span>
    );
  }

  // En gasto, subir es malo. El color acompaña, pero la flecha y el signo
  // dicen lo mismo sin depender de verlo.
  const color = n > 0 ? 'var(--serious)' : 'var(--good)';
  return (
    <span className="tabular text-[11px]" style={{ color }}>
      {n > 0 ? '↑' : '↓'} {money(Math.abs(n), { compact: true })}
      {percent !== null && Math.abs(percent) < 1000 ? ` (${n > 0 ? '+' : '−'}${Math.abs(Math.round(percent))}%)` : ''}
    </span>
  );
}

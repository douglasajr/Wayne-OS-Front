/**
 * Fecha del movimiento.
 *
 * Casi siempre es hoy o ayer —se anota el gasto en el momento o esa noche—,
 * asi que esos dos casos son un toque y el calendario queda para el resto.
 */
import { todayIso, daysAgoIso } from '@/core/lib/dates';

export function DatePicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const today = todayIso();
  const yesterday = daysAgoIso(1);

  return (
    <div>
      <span className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
        Fecha
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="chip" aria-pressed={value === today} onClick={() => onChange(today)}>
          Hoy
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={value === yesterday}
          onClick={() => onChange(yesterday)}
        >
          Ayer
        </button>
        <input
          type="date"
          className="field"
          style={{ width: 'auto', flex: '1 1 150px', padding: '9px 12px', fontSize: 14 }}
          value={value}
          max={today}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          aria-label="Otra fecha"
        />
      </div>
    </div>
  );
}

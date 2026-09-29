/**
 * Selector de categoria.
 *
 * Primero las frecuentes, que es lo que se registra el 90% de las veces; el
 * catalogo completo queda a un toque de distancia. Una lista alfabetica de 75
 * subcategorias convertiria "anotar una Monster" en una busqueda.
 *
 * Solo se pueden elegir HOJAS: el backend rechaza una categoria con hijos
 * porque clasificar en el padre deja el reporte por subcategoria a medias. El
 * padre aqui es un encabezado, no una opcion.
 */
import { useMemo, useState } from 'react';
import { Icon } from '@/core/components/ui/Icon';
import { categoryColor } from '@/domains/finance/shared/status';
import { useCategories, useFrequentCategories } from '@/domains/finance/shared/api';
import type { CategoryNode } from '@/domains/finance/shared/types/domain';

interface Props {
  value: string;
  onChange: (id: string, label: string) => void;
  type: 'EXPENSE' | 'INCOME';
  error?: string;
}

export function CategoryPicker({ value, onChange, type, error }: Props) {
  const [showAll, setShowAll] = useState(false);
  const frequent = useFrequentCategories();
  const tree = useCategories(type);

  // Las frecuentes solo tienen sentido en gasto: el ingreso se registra pocas
  // veces al mes y siempre en las mismas dos o tres categorias.
  const chips = type === 'EXPENSE' ? (frequent.data ?? []) : [];
  const hasChips = chips.length > 0;

  // Cuando la categoria elegida no esta entre las frecuentes hay que poder
  // verla igual, o el usuario no sabe que seleccionó.
  const selectedLabel = useMemo(() => {
    const inChips = chips.find((c) => c.id === value);
    if (inChips) return inChips.name;
    for (const parent of tree.data ?? []) {
      const child = parent.children.find((c) => c.id === value);
      if (child) return `${parent.name} · ${child.name}`;
      if (parent.id === value) return parent.name;
    }
    return null;
  }, [chips, tree.data, value]);

  const openList = showAll || !hasChips;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="label-deco text-[9px]" style={{ color: 'var(--ink-muted)' }}>
          Categoría
        </span>
        {hasChips && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-[11px] font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            {showAll ? 'Ver frecuentes' : 'Ver todas'}
          </button>
        )}
      </div>

      {!openList && (
        <div className="chip-row">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              aria-pressed={value === c.id}
              onClick={() => onChange(c.id, c.name)}
            >
              <span style={{ color: value === c.id ? 'inherit' : categoryColor(c.color) }}>
                <Icon name={c.icon ?? 'ellipsis'} size={15} strokeWidth={2} />
              </span>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {openList && (
        <div
          className="max-h-60 overflow-y-auto border"
          style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)' }}
        >
          {tree.isLoading && (
            <p className="px-3 py-4 text-[13px]" style={{ color: 'var(--ink-muted)' }}>
              Cargando categorías…
            </p>
          )}
          {(tree.data ?? []).map((parent) => (
            <CategoryGroup key={parent.id} parent={parent} value={value} onChange={onChange} />
          ))}
        </div>
      )}

      {error ? (
        <span role="alert" className="mt-1.5 block text-[11px]" style={{ color: 'var(--critical)' }}>
          {error}
        </span>
      ) : selectedLabel ? (
        <span className="mt-1.5 block text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          {selectedLabel}
        </span>
      ) : null}
    </div>
  );
}

function CategoryGroup({
  parent,
  value,
  onChange,
}: {
  parent: CategoryNode;
  value: string;
  onChange: (id: string, label: string) => void;
}) {
  // Una categoria sin hijos SI es hoja y se puede elegir directamente.
  const leaves = parent.children.length > 0 ? parent.children : [{ ...parent }];

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}>
      <div
        className="label-deco flex items-center gap-2 px-3 pt-2.5 pb-1.5 text-[9px]"
        style={{ color: categoryColor(parent.color) }}
      >
        <Icon name={parent.icon ?? 'ellipsis'} size={13} strokeWidth={2} />
        {parent.name}
      </div>
      <div className="flex flex-wrap gap-1.5 px-3 pb-2.5">
        {leaves.map((leaf) => (
          <button
            key={leaf.id}
            type="button"
            className="chip"
            style={{ minHeight: 34, fontSize: 12, padding: '6px 10px' }}
            aria-pressed={value === leaf.id}
            onClick={() => onChange(leaf.id, `${parent.name} · ${leaf.name}`)}
          >
            {leaf.name}
          </button>
        ))}
      </div>
    </div>
  );
}

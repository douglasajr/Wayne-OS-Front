/**
 * Categorias editables (regla 8: nunca hardcodeadas).
 *
 * Dos niveles: categoria principal -> subcategoria. El gasto se registra en la
 * subcategoria y el limite de presupuesto en la principal, asi que esta
 * pantalla lo dice en voz alta en vez de dejar que se descubra fallando.
 *
 * Nada se borra de verdad. Ocultar saca la categoria de los selectores pero
 * conserva el historico; eliminar es una baja logica que tampoco toca los
 * movimientos ya registrados. Las sembradas por el sistema solo se ocultan.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { categoryColor } from '@/domains/finance/shared/status';
import { ApiError } from '@/core/lib/api';
import {
  useDeleteCategory,
  useEditableCategories,
  useReorderCategories,
  useUpdateCategory,
} from '@/domains/finance/shared/api';
import type { EditableCategory } from '@/domains/finance/shared/types/budget';
import { CategoryFormSheet, type CategoryDraft } from '../components/CategoryFormSheet';

export function CategoriesPage() {
  const query = useEditableCategories();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const reorder = useReorderCategories();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = query.data ?? [];

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const a = categories[index]!;
    const b = categories[target]!;
    await reorder.mutateAsync([
      { id: a.id, sortOrder: b.sortOrder },
      { id: b.id, sortOrder: a.sortOrder },
    ]);
  };

  const setActive = async (id: string, isActive: boolean) => {
    setError(null);
    try {
      await update.mutateAsync({ id, isActive });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cambiar la categoría.');
    }
  };

  const del = async (category: { id: string; name: string }) => {
    setError(null);
    setNotice(null);
    try {
      const result = await remove.mutateAsync(category.id);
      setNotice(
        result.transactionsKept > 0
          ? `"${category.name}" ya no aparece al registrar. Sus ${result.transactionsKept} ${
              result.transactionsKept === 1 ? 'movimiento sigue' : 'movimientos siguen'
            } en el historial.`
          : `"${category.name}" eliminada.`,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo eliminar la categoría.');
    }
  };

  if (query.isLoading) {
    return (
      <div className="space-y-3.5">
        <Skeleton height={64} />
        <Skeleton height={260} />
      </div>
    );
  }

  return (
    <div className="space-y-3.5 lg:space-y-4">
      <Card>
        <CardTitle>Cómo funcionan</CardTitle>
        <p className="text-[13px]" style={{ color: 'var(--ink-2)' }}>
          Un gasto se registra en la <strong>subcategoría</strong> (“Proteína”), pero el
          límite de presupuesto se pone en la <strong>categoría principal</strong>
          (“Alimentación”): el gasto de todas sus subcategorías se suma contra ese tope.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            icon="plus"
            onClick={() => setDraft({ name: '', icon: null, color: null })}
          >
            Nueva categoría
          </Button>
          <Link to="/finanzas/presupuesto" className="chip">
            <Icon name="target" size={15} strokeWidth={2} />
            Ir al presupuesto
          </Link>
        </div>
      </Card>

      {notice && (
        <p
          role="status"
          className="border px-3.5 py-3 text-[12px]"
          style={{
            borderColor: 'var(--line)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--ink-2)',
          }}
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="border px-3.5 py-3 text-[12px]"
          style={{
            borderColor: 'color-mix(in oklab, var(--critical) 34%, transparent)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--critical)',
          }}
        >
          {error}
        </p>
      )}

      <Card>
        <CardTitle>Tus categorías</CardTitle>
        <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {categories.map((category, index) => (
            <CategoryRow
              key={category.id}
              category={category}
              open={expanded.has(category.id)}
              first={index === 0}
              last={index === categories.length - 1}
              onToggle={() => toggle(category.id)}
              onMove={(d) => void move(index, d)}
              onEdit={() =>
                setDraft({
                  id: category.id,
                  name: category.name,
                  icon: category.icon,
                  color: category.color,
                })
              }
              onAddChild={() =>
                setDraft({
                  name: '',
                  icon: null,
                  color: null,
                  parentId: category.id,
                  parentName: category.name,
                })
              }
              onEditChild={(child) =>
                setDraft({ id: child.id, name: child.name, icon: child.icon, color: child.color })
              }
              onSetActive={setActive}
              onDelete={del}
            />
          ))}
        </ul>
      </Card>

      <CategoryFormSheet open={draft !== null} onClose={() => setDraft(null)} draft={draft} />
    </div>
  );
}

interface RowProps {
  category: EditableCategory;
  open: boolean;
  first: boolean;
  last: boolean;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onAddChild: () => void;
  onEditChild: (child: EditableCategory['children'][number]) => void;
  onSetActive: (id: string, isActive: boolean) => Promise<void>;
  onDelete: (c: { id: string; name: string }) => Promise<void>;
}

function CategoryRow({
  category, open, first, last,
  onToggle, onMove, onEdit, onAddChild, onEditChild, onSetActive, onDelete,
}: RowProps) {
  const dim = category.isActive ? 1 : 0.5;

  return (
    <li className="py-2.5">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          style={{ opacity: dim }}
        >
          <span
            className="grid h-8 w-8 shrink-0 place-items-center"
            style={{
              background: `color-mix(in oklab, ${categoryColor(category.color)} 16%, transparent)`,
              color: categoryColor(category.color),
            }}
          >
            <Icon name={category.icon} size={15} strokeWidth={2.1} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{category.name}</span>
            <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              {category.children.length === 0
                ? 'sin subcategorías'
                : `${category.children.length} subcategorías`}
              {!category.isActive && ' · oculta'}
            </span>
          </span>
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} strokeWidth={2.2} />
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton label={`Subir ${category.name}`} icon="arrow-up" disabled={first} onClick={() => onMove(-1)} />
          <IconButton label={`Bajar ${category.name}`} icon="arrow-down" disabled={last} onClick={() => onMove(1)} />
        </div>
      </div>

      {open && (
        <div className="mt-2.5 pl-10">
          <ul className="space-y-1">
            {category.children.map((child) => (
              <li key={child.id} className="flex items-center gap-2 py-1.5" style={{ opacity: child.isActive ? 1 : 0.5 }}>
                <span className="min-w-0 flex-1 truncate text-[13px]">
                  {child.name}
                  {!child.isActive && (
                    <span className="ml-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>oculta</span>
                  )}
                </span>
                <IconButton label={`Editar ${child.name}`} icon="pencil" onClick={() => onEditChild(child)} />
                <IconButton
                  label={child.isActive ? `Ocultar ${child.name}` : `Mostrar ${child.name}`}
                  icon={child.isActive ? 'eye-off' : 'eye'}
                  onClick={() => void onSetActive(child.id, !child.isActive)}
                />
                {!child.isSystem && (
                  <IconButton
                    label={`Eliminar ${child.name}`}
                    icon="trash"
                    danger
                    onClick={() => void onDelete(child)}
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="chip" onClick={onAddChild}>
              <Icon name="plus" size={14} strokeWidth={2.4} />
              Subcategoría
            </button>
            <button type="button" className="chip" onClick={onEdit}>
              <Icon name="pencil" size={14} strokeWidth={2.2} />
              Editar
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => void onSetActive(category.id, !category.isActive)}
            >
              <Icon name={category.isActive ? 'eye-off' : 'eye'} size={14} strokeWidth={2.2} />
              {category.isActive ? 'Ocultar' : 'Mostrar'}
            </button>
            {!category.isSystem && (
              <button type="button" className="chip" onClick={() => void onDelete(category)}>
                <Icon name="trash" size={14} strokeWidth={2.2} />
                Eliminar
              </button>
            )}
          </div>

          {category.isSystem && (
            <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              Categoría del sistema: se puede renombrar y ocultar, no eliminar. Así el
              historial que ya la usa sigue teniendo sentido.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function IconButton({
  label, icon, onClick, disabled = false, danger = false,
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]['name'];
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 shrink-0 place-items-center border"
      style={{
        borderColor: 'var(--line)',
        color: danger ? 'var(--critical)' : 'var(--ink-2)',
        borderRadius: 'var(--radius-sm)',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Icon name={icon} size={15} strokeWidth={2.1} />
    </button>
  );
}

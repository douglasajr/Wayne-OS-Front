/**
 * Crear o editar una categoria.
 *
 * El tipo y el padre NO se editan despues de crear: mover una categoria de
 * rama reescribiria el pasado y los reportes de meses ya cerrados cambiarian
 * solos. Para eso se crea una nueva y se oculta la vieja, que conserva su
 * historico.
 */
import { useEffect, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { TextField } from '@/core/components/ui/Field';
import { Icon, type IconName } from '@/core/components/ui/Icon';
import { categoryColor } from '@/domains/finance/shared/status';
import { ApiError } from '@/core/lib/api';
import { useCreateCategory, useUpdateCategory } from '@/domains/finance/shared/api';

/** Paleta y simbolos del sistema: los mismos tokens que usa el resto. */
const COLORS = ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6', 'cat-7', 'cat-8', 'neutral'];
const ICONS: IconName[] = [
  'home', 'utensils', 'car', 'plug', 'laptop', 'sparkles',
  'shirt', 'gift', 'landmark', 'banknote', 'shield', 'piggy', 'ant', 'ellipsis',
];

export interface CategoryDraft {
  id?: string;
  name: string;
  icon: string | null;
  color: string | null;
  /** Presente solo al crear una subcategoria. */
  parentId?: string;
  parentName?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  draft: CategoryDraft | null;
}

export function CategoryFormSheet({ open, onClose, draft }: Props) {
  const create = useCreateCategory();
  const update = useUpdateCategory();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !draft) return;
    setName(draft.name);
    setIcon(draft.icon);
    setColor(draft.color);
    setError(null);
  }, [open, draft]);

  if (!draft) return null;

  const isNew = draft.id === undefined;
  const isChild = draft.parentId !== undefined;

  const submit = async () => {
    if (!name.trim()) return setError('El nombre es obligatorio.');

    try {
      if (isNew) {
        await create.mutateAsync({
          name: name.trim(),
          ...(draft.parentId ? { parentId: draft.parentId } : { type: 'EXPENSE' }),
          ...(icon ? { icon } : {}),
          ...(color ? { color } : {}),
        });
      } else {
        await update.mutateAsync({ id: draft.id!, name: name.trim(), icon, color });
      }
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar la categoría.');
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isNew ? (isChild ? 'Nueva subcategoría' : 'Nueva categoría') : 'Editar categoría'}
      subtitle={isChild ? `Dentro de ${draft.parentName}` : undefined}
      footer={
        <Button full onClick={() => void submit()} loading={create.isPending || update.isPending}>
          Guardar
        </Button>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Nombre"
          value={name}
          data-autofocus
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          placeholder={isChild ? 'Proteína' : 'Alimentación'}
        />

        {/* Las subcategorias heredan color e icono del padre si no se eligen:
            asi una lista de 75 hojas no se convierte en un arcoiris. */}
        <fieldset>
          <legend className="label-deco mb-2 text-[9px]" style={{ color: 'var(--ink-muted)' }}>
            Color
          </legend>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((token) => (
              <button
                key={token}
                type="button"
                aria-label={`Color ${token}`}
                aria-pressed={color === token}
                onClick={() => setColor(color === token ? null : token)}
                className="grid h-9 w-9 place-items-center border"
                style={{
                  background: `color-mix(in oklab, ${categoryColor(token)} 22%, transparent)`,
                  borderColor: color === token ? categoryColor(token) : 'var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  color: categoryColor(token),
                }}
              >
                {color === token && <Icon name="check" size={15} strokeWidth={2.6} />}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label-deco mb-2 text-[9px]" style={{ color: 'var(--ink-muted)' }}>
            Símbolo
          </legend>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((name_) => (
              <button
                key={name_}
                type="button"
                aria-label={`Símbolo ${name_}`}
                aria-pressed={icon === name_}
                onClick={() => setIcon(icon === name_ ? null : name_)}
                className="grid h-9 w-9 place-items-center border"
                style={{
                  borderColor: icon === name_ ? 'var(--accent)' : 'var(--line)',
                  color: icon === name_ ? 'var(--accent)' : 'var(--ink-2)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Icon name={name_} size={16} strokeWidth={2} />
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

/**
 * Poner o cambiar el limite de una categoria en el ciclo.
 *
 * Solo se ofrecen categorias de PRIMER NIVEL. El gasto se registra en la
 * subcategoria ("Proteina") pero el limite vive en la padre ("Alimentacion"),
 * porque el gasto de todas sus hojas se suma contra ese tope. El backend
 * rechaza lo contrario; aqui simplemente no se puede elegir mal.
 */
import { useEffect, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { SelectField } from '@/core/components/ui/Field';
import { Icon } from '@/core/components/ui/Icon';
import { AmountInput } from '@/domains/finance/transactions/components/AmountInput';
import { ApiError } from '@/core/lib/api';
import { money } from '@/domains/finance/shared/money';
import { useCategories, useRemoveBudgetLine, useSetBudgetLine } from '@/domains/finance/shared/api';
import type { BudgetLine, PeriodSelector } from '@/domains/finance/shared/types/budget';

interface Props {
  open: boolean;
  onClose: () => void;
  selector: PeriodSelector;
  /** Linea existente que se edita, o null para crear una nueva. */
  editing: BudgetLine | null;
  /** Categoria preseleccionada al venir desde "gasto sin limite". */
  presetCategoryId?: string;
  /** Categorias que ya tienen limite: no se ofrecen dos veces. */
  usedCategoryIds: string[];
  /** Cuanto queda del tope sin repartir, para orientar el monto. */
  unallocated: string;
}

export function BudgetLineSheet({
  open,
  onClose,
  selector,
  editing,
  presetCategoryId,
  usedCategoryIds,
  unallocated,
}: Props) {
  const categories = useCategories('EXPENSE');
  const setLine = useSetBudgetLine(selector);
  const removeLine = useRemoveBudgetLine(selector);

  const [categoryId, setCategoryId] = useState('');
  const [planned, setPlanned] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Al abrir se siembra el estado. No se hace en el render: el usuario puede
  // estar escribiendo y no debe perder lo tecleado en cada repintado.
  useEffect(() => {
    if (!open) return;
    setCategoryId(editing?.categoryId ?? presetCategoryId ?? '');
    setPlanned(editing ? String(Number(editing.planned)) : '');
    setError(null);
  }, [open, editing, presetCategoryId]);

  const roots = (categories.data ?? []).filter(
    (c) => c.id === categoryId || !usedCategoryIds.includes(c.id),
  );

  const submit = async () => {
    if (!categoryId) return setError('Elige una categoría.');
    if (!planned || Number(planned) <= 0) return setError('Escribe un límite mayor a cero.');

    try {
      await setLine.mutateAsync({ categoryId, plannedAmount: planned });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar el límite.');
    }
  };

  const remove = async () => {
    if (!editing) return;
    try {
      await removeLine.mutateAsync(editing.categoryId);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo quitar el límite.');
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? `Límite de ${editing.name}` : 'Nuevo límite'}
      subtitle="El gasto de las subcategorías se suma contra este tope"
      footer={
        <div className="flex gap-2">
          {editing && (
            <Button variant="danger" icon="trash" onClick={() => void remove()} loading={removeLine.isPending}>
              Quitar
            </Button>
          )}
          <Button full onClick={() => void submit()} loading={setLine.isPending}>
            {editing ? 'Guardar' : 'Poner límite'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <AmountInput value={planned} onChange={setPlanned} autoFocus label="Límite del ciclo" />

        {editing ? (
          <div
            className="flex items-center gap-2 border px-3.5 py-3"
            style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius-sm)' }}
          >
            <Icon name={editing.icon} size={16} strokeWidth={2} />
            <span className="text-sm font-semibold">{editing.name}</span>
            <span className="ml-auto text-[12px]" style={{ color: 'var(--ink-muted)' }}>
              llevas {money(editing.spent, { compact: true })}
            </span>
          </div>
        ) : (
          <SelectField
            label="Categoría"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            hint="Solo categorías principales: el límite cubre todas sus subcategorías."
          >
            <option value="">Elige una…</option>
            {roots.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectField>
        )}

        <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          Sin repartir en este ciclo: {money(unallocated, { compact: true })}.
        </p>

        {error && (
          <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

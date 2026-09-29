/**
 * Alta y edicion de una recurrencia.
 *
 * El tipo se elige primero porque cambia todo lo demas: una VARIABLE acepta
 * monto vacio (es un estimado) y una SUBSCRIPTION pide proveedor. Presentar
 * los tres iguales obligaria a leer la ayuda para entender la diferencia.
 *
 * El CALENDARIO no se edita despues de crear: cambiar la frecuencia
 * reinterpretaria las ocurrencias ya generadas. Se cancela y se crea otra.
 */
import { useEffect, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { SelectField, TextField } from '@/core/components/ui/Field';
import { Icon } from '@/core/components/ui/Icon';
import { AmountInput } from '@/domains/finance/transactions/components/AmountInput';
import { CategoryPicker } from '@/domains/finance/transactions/components/CategoryPicker';
import { ApiError } from '@/core/lib/api';
import { todayIso } from '@/core/lib/dates';
import { useAccounts, useCreateRule, useUpdateRule } from '@/domains/finance/shared/api';
import type {
  RecurrenceFrequency,
  RecurrenceKind,
  RecurringRule,
} from '@/domains/finance/shared/types/recurring';
import { FREQUENCY_LABEL, KIND } from '../labels';

const KINDS: RecurrenceKind[] = ['FIXED', 'VARIABLE', 'SUBSCRIPTION'];
const FREQUENCIES: RecurrenceFrequency[] = [
  'MONTHLY', 'BIWEEKLY', 'WEEKLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL', 'DAILY',
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Regla existente a editar, o null para crear. */
  editing: RecurringRule | null;
  /** Tipo con el que se abre al crear. */
  initialKind?: RecurrenceKind;
}

export function RuleFormSheet({ open, onClose, editing, initialKind = 'SUBSCRIPTION' }: Props) {
  const accounts = useAccounts();
  const create = useCreateRule();
  const update = useUpdateRule();

  const [kind, setKind] = useState<RecurrenceKind>(initialKind);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('MONTHLY');
  const [startDate, setStartDate] = useState(todayIso());
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [vendor, setVendor] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setKind(editing?.kind ?? initialKind);
    setName(editing?.name ?? '');
    setAmount(editing?.amount ? String(Number(editing.amount)) : '');
    setCategoryId(editing?.category?.id ?? '');
    setAccountId(editing?.fromAccount?.id ?? '');
    setFrequency(editing?.frequency ?? 'MONTHLY');
    setStartDate(editing?.startDate ?? todayIso());
    setDayOfWeek(editing?.dayOfWeek ?? 1);
    setAutoGenerate(editing?.autoGenerate ?? false);
    setVendor(editing?.vendor ?? '');
    setError(null);
  }, [open, editing, initialKind]);

  const isEditing = editing !== null;
  const needsAmount = kind !== 'VARIABLE';

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('Ponle un nombre.');
    if (needsAmount && (!amount || Number(amount) <= 0)) {
      return setError('Escribe el monto. Si cambia cada vez, elige "gasto variable".');
    }

    try {
      if (isEditing) {
        await update.mutateAsync({
          id: editing.id,
          name: name.trim(),
          amount: amount ? amount : null,
          categoryId: categoryId || null,
          fromAccountId: accountId || null,
          autoGenerate,
          vendor: vendor.trim() || null,
        });
      } else {
        if (!categoryId) return setError('Elige una categoría.');
        if (!accountId) return setError('Elige de qué cuenta sale.');
        await create.mutateAsync({
          kind,
          name: name.trim(),
          ...(amount ? { amount } : {}),
          transactionType: 'EXPENSE',
          categoryId,
          fromAccountId: accountId,
          frequency,
          startDate,
          ...(frequency === 'WEEKLY' ? { dayOfWeek } : {}),
          autoGenerate,
          ...(kind === 'SUBSCRIPTION' && vendor.trim() ? { vendor: vendor.trim() } : {}),
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar.');
    }
  };

  const options = (accounts.data?.accounts ?? []).filter((a) => !a.archivedAt);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEditing ? `Editar ${editing.name}` : 'Nueva recurrencia'}
      subtitle={isEditing ? 'El calendario no se edita: cancélala y crea otra' : undefined}
      size="lg"
      footer={
        <Button full onClick={() => void submit()} loading={create.isPending || update.isPending}>
          {isEditing ? 'Guardar' : 'Crear'}
        </Button>
      }
    >
      <div className="space-y-4">
        {!isEditing && (
          <fieldset>
            <legend className="label-deco mb-2 text-[9px]" style={{ color: 'var(--ink-muted)' }}>
              Tipo
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                  className="flex items-center gap-2 border px-3 py-2.5 text-left text-[13px] font-semibold"
                  style={{
                    borderColor: kind === k ? 'var(--accent)' : 'var(--line)',
                    color: kind === k ? 'var(--accent)' : 'var(--ink-2)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <Icon name={KIND[k].icon} size={16} strokeWidth={2} />
                  {KIND[k].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              {KIND[kind].hint}
            </p>
          </fieldset>
        )}

        <TextField
          label="Nombre"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          placeholder={kind === 'SUBSCRIPTION' ? 'Netflix' : 'Renta'}
        />

        <AmountInput
          value={amount}
          onChange={setAmount}
          label={kind === 'VARIABLE' ? 'Monto estimado (opcional)' : 'Monto'}
        />

        {kind === 'SUBSCRIPTION' && (
          <TextField
            label="Proveedor (opcional)"
            value={vendor}
            maxLength={80}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Netflix Inc."
          />
        )}

        <CategoryPicker value={categoryId} onChange={(id) => setCategoryId(id)} type="EXPENSE" />

        <SelectField label="Sale de" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">Elige una cuenta…</option>
          {options.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </SelectField>

        {!isEditing && (
          <>
            <SelectField
              label="Cada cuánto"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
              hint="No se puede cambiar después: reinterpretaría lo ya generado."
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>{FREQUENCY_LABEL[f]}</option>
              ))}
            </SelectField>

            {frequency === 'WEEKLY' && (
              <SelectField
                label="Día de la semana"
                value={String(dayOfWeek)}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
              >
                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </SelectField>
            )}

            <TextField
              label="Primera vez"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              hint="Esa fecha ya cuenta como la primera ocurrencia."
            />
          </>
        )}

        <label
          className="flex items-start gap-3 border px-3.5 py-3"
          style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius-sm)' }}
        >
          <input
            type="checkbox"
            checked={autoGenerate}
            onChange={(e) => setAutoGenerate(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold">Registrarlo solo</span>
            <span className="block text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              Solo para lo que de verdad se cobra solo y siempre igual. Si te lo rechazan,
              el sistema habrá registrado un gasto que no ocurrió.
            </span>
          </span>
        </label>

        {error && (
          <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

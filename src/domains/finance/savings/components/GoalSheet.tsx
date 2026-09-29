/**
 * Alta y edicion de un objetivo.
 *
 * Dos campos hacen el trabajo: la meta (cuanto) y el aporte mensual (a que
 * ritmo). Con los dos, la pantalla puede decir cuantos meses faltan; con uno
 * solo, es una cifra suelta.
 *
 * La cuenta que respalda el objetivo no se puede cambiar una vez hay aportes:
 * el backend lo rechaza porque cambiaria la direccion de los movimientos ya
 * registrados. Aqui se deshabilita para no ofrecer algo que va a fallar.
 */
import { useEffect, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { SelectField, TextField } from '@/core/components/ui/Field';
import { AmountInput } from '@/domains/finance/transactions/components/AmountInput';
import { ApiError } from '@/core/lib/api';
import { useAccounts, useArchiveGoal, useCreateGoal, useUpdateGoal } from '@/domains/finance/shared/api';
import type { SavingsGoal } from '@/domains/finance/shared/types/savings';

interface Props {
  /** null = alta; un objetivo = edicion. */
  goal: SavingsGoal | null;
  open: boolean;
  onClose: () => void;
}

export function GoalSheet({ goal, open, onClose }: Props) {
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const archiveGoal = useArchiveGoal();
  const accounts = useAccounts();

  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [openingAmount, setOpeningAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? '');
    setAccountId(goal?.accountId ?? '');
    setTargetAmount(goal?.targetAmount ? String(Number(goal.targetAmount)) : '');
    setMonthlyTarget(goal?.monthlyTarget ? String(Number(goal.monthlyTarget)) : '');
    setTargetDate(goal?.targetDate ?? '');
    setOpeningAmount(goal?.openingAmount ? String(Number(goal.openingAmount)) : '');
    setError(null);
  }, [goal, open]);

  if (!open) return null;

  const isEdit = goal !== null;
  // El backend solo bloquea el cambio de cuenta cuando hay APORTES registrados:
  // un saldo inicial declarado no ata el objetivo a ninguna cuenta.
  const contributed = isEdit ? Number(goal.currentAmount) - Number(goal.openingAmount) : 0;
  const lockedAccount = contributed > 0;
  const pending = createGoal.isPending || updateGoal.isPending || archiveGoal.isPending;

  const submit = async () => {
    if (!name.trim()) return setError('El objetivo necesita un nombre.');

    const payload = {
      name: name.trim(),
      accountId: accountId || undefined,
      targetAmount: targetAmount ? String(Number(targetAmount)) : undefined,
      monthlyTarget: monthlyTarget ? String(Number(monthlyTarget)) : undefined,
      targetDate: targetDate || undefined,
      openingAmount: openingAmount ? String(Number(openingAmount)) : undefined,
    };

    try {
      if (isEdit) {
        await updateGoal.mutateAsync({
          id: goal.id,
          ...payload,
          // En edicion, vaciar un campo lo borra: por eso van null y no undefined.
          targetAmount: targetAmount ? String(Number(targetAmount)) : (null as unknown as undefined),
          monthlyTarget: monthlyTarget ? String(Number(monthlyTarget)) : (null as unknown as undefined),
          targetDate: targetDate || (null as unknown as undefined),
        });
      } else {
        await createGoal.mutateAsync({ ...payload, type: 'TARGET' });
      }
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar el objetivo.');
    }
  };

  const archive = async () => {
    if (!goal) return;
    try {
      await archiveGoal.mutateAsync(goal.id);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo archivar el objetivo.');
    }
  };

  const options = (accounts.data?.accounts ?? []).filter((a) => !a.archivedAt && !a.isDebt);

  return (
    <Sheet
      open
      onClose={onClose}
      title={isEdit ? `Editar ${goal.name}` : 'Nuevo objetivo'}
      subtitle="Una meta con ritmo: cuánto quieres juntar y cuánto le pones al mes"
      footer={
        <Button full onClick={() => void submit()} loading={pending}>
          {isEdit ? 'Guardar cambios' : 'Crear objetivo'}
        </Button>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Viaje, carro, laptop…"
          data-autofocus
        />

        <SelectField
          label="Dónde vive el dinero"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          disabled={lockedAccount}
          hint={
            lockedAccount
              ? 'No se puede cambiar: el objetivo ya tiene aportes registrados en esta cuenta.'
              : 'La cuenta que respalda el objetivo. Sin ella no puedes aportar.'
          }
        >
          <option value="">Elige una cuenta…</option>
          {options.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </SelectField>

        <AmountInput value={targetAmount} onChange={setTargetAmount} label="Meta (opcional)" />
        <AmountInput value={monthlyTarget} onChange={setMonthlyTarget} label="Aporte mensual (opcional)" />

        <div>
          <AmountInput
            value={openingAmount}
            onChange={setOpeningAmount}
            label="Ya tenía guardado"
          />
          <p className="mt-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            Lo que ya estaba apartado antes de registrar el objetivo. Los aportes que registres
            desde aquí se suman encima.
          </p>
        </div>

        <TextField
          label="Fecha objetivo (opcional)"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />

        {isEdit && goal.type !== 'EMERGENCY_FUND' && (
          <button
            type="button"
            className="chip"
            onClick={() => void archive()}
            disabled={Number(goal.currentAmount) > 0}
            title={
              Number(goal.currentAmount) > 0
                ? 'Retira el saldo antes de archivarlo'
                : 'Archivar el objetivo'
            }
          >
            Archivar objetivo
          </button>
        )}

        {error && (
          <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

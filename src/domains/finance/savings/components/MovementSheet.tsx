/**
 * Aporte o retiro de un objetivo.
 *
 * Un solo panel para los dos: cambia la direccion del dinero, no el formulario.
 * Lo que el panel insiste en dejar claro es que ninguno de los dos es un gasto
 * (reglas 4 y 17): aportar mueve dinero a otro bolsillo, y retirar lo trae de
 * vuelta. Si ese dinero se va a gastar, el gasto se registra aparte.
 */
import { useEffect, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { SelectField } from '@/core/components/ui/Field';
import { Icon } from '@/core/components/ui/Icon';
import { AmountInput } from '@/domains/finance/transactions/components/AmountInput';
import { DatePicker } from '@/domains/finance/transactions/components/DatePicker';
import { ApiError } from '@/core/lib/api';
import { todayIso } from '@/core/lib/dates';
import { money } from '@/domains/finance/shared/money';
import { useAccounts, useContribute, useWithdraw } from '@/domains/finance/shared/api';
import type { SavingsGoal } from '@/domains/finance/shared/types/savings';

export type MovementKind = 'CONTRIBUTE' | 'WITHDRAW';

interface Props {
  goal: SavingsGoal | null;
  kind: MovementKind;
  onClose: () => void;
}

export function MovementSheet({ goal, kind, onClose }: Props) {
  const contribute = useContribute();
  const withdraw = useWithdraw();
  const accounts = useAccounts();

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!goal) return;
    setAmount(kind === 'CONTRIBUTE' && goal.monthlyTarget ? String(Number(goal.monthlyTarget)) : '');
    setAccountId('');
    setDate(todayIso());
    setError(null);
  }, [goal, kind]);

  if (!goal) return null;

  const isContribution = kind === 'CONTRIBUTE';
  const pending = contribute.isPending || withdraw.isPending;

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return setError('Escribe el monto.');
    if (!accountId) {
      return setError(isContribution ? 'Elige desde qué cuenta sale.' : 'Elige a qué cuenta entra.');
    }
    try {
      if (isContribution) {
        await contribute.mutateAsync({ id: goal.id, fromAccountId: accountId, amount, date });
      } else {
        await withdraw.mutateAsync({ id: goal.id, toAccountId: accountId, amount, date });
      }
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar el movimiento.');
    }
  };

  // Ni deuda ni archivadas, y nunca la cuenta que respalda el objetivo: el
  // dinero tiene que cruzar de un bolsillo a otro.
  const options = (accounts.data?.accounts ?? []).filter(
    (a) => !a.archivedAt && !a.isDebt && a.id !== goal.accountId,
  );

  return (
    <Sheet
      open
      onClose={onClose}
      title={isContribution ? `Aportar a ${goal.name}` : `Retirar de ${goal.name}`}
      subtitle="Mover dinero entre tus cuentas, no un gasto"
      footer={
        <Button full onClick={() => void submit()} loading={pending}>
          {isContribution ? 'Registrar aporte' : 'Registrar retiro'}
        </Button>
      }
    >
      <div className="space-y-4">
        <AmountInput value={amount} onChange={setAmount} autoFocus label="Monto" />

        <div className="flex flex-wrap gap-2">
          {isContribution && goal.monthlyTarget && (
            <button type="button" className="chip" onClick={() => setAmount(String(Number(goal.monthlyTarget)))}>
              Aporte del mes · {money(goal.monthlyTarget, { compact: true })}
            </button>
          )}
          {isContribution && goal.remaining && Number(goal.remaining) > 0 && (
            <button type="button" className="chip" onClick={() => setAmount(String(Number(goal.remaining)))}>
              Completar meta · {money(goal.remaining, { compact: true })}
            </button>
          )}
          {!isContribution && (
            <button type="button" className="chip" onClick={() => setAmount(String(Number(goal.currentAmount)))}>
              Todo · {money(goal.currentAmount, { compact: true })}
            </button>
          )}
        </div>

        <SelectField
          label={isContribution ? 'Sale de' : 'Entra a'}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="">Elige una cuenta…</option>
          {options.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </SelectField>

        <DatePicker value={date} onChange={setDate} />

        <div
          className="flex items-start gap-2.5 px-3.5 py-3 text-[12px]"
          style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', color: 'var(--ink-2)' }}
        >
          <Icon name="alert" size={15} strokeWidth={2} />
          <span>
            {isContribution ? (
              <>
                Aportar <strong>no</strong> es gastar: el dinero sigue siendo tuyo, solo cambia de
                cuenta. No consume presupuesto del ciclo.
              </>
            ) : (
              <>
                Retirar <strong>tampoco</strong> es gastar. Si vas a usar este dinero, registra el
                gasto cuando lo pagues: contarlo aquí lo contaría dos veces. Puedes retirar hasta{' '}
                {money(goal.currentAmount, { compact: true })}.
              </>
            )}
          </span>
        </div>

        {error && (
          <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

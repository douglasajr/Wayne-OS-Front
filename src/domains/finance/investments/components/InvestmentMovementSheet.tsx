/**
 * Aporte o retiro de una posición.
 *
 * Un aporte no es gasto (regla 4) y un retiro no es ingreso: el dinero ya era
 * tuyo, solo cambia de bolsillo. Si el retiro trae ganancia, esa ganancia ya
 * estaba contada como plusvalía del patrimonio.
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
import {
  useAccounts,
  useInvestmentContribute,
  useInvestmentWithdraw,
} from '@/domains/finance/shared/api';
import type { Investment } from '@/domains/finance/shared/types/investments';

export type InvestmentMovementKind = 'CONTRIBUTE' | 'WITHDRAW';

export function InvestmentMovementSheet({
  investment,
  kind,
  onClose,
}: {
  investment: Investment | null;
  kind: InvestmentMovementKind;
  onClose: () => void;
}) {
  const contribute = useInvestmentContribute();
  const withdraw = useInvestmentWithdraw();
  const accounts = useAccounts();

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!investment) return;
    setAmount('');
    setAccountId('');
    setDate(todayIso());
    setError(null);
  }, [investment, kind]);

  if (!investment) return null;

  const esAporte = kind === 'CONTRIBUTE';
  const pending = contribute.isPending || withdraw.isPending;

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return setError('Escribe el monto.');
    if (!accountId) {
      return setError(esAporte ? 'Elige desde qué cuenta sale.' : 'Elige a qué cuenta entra.');
    }
    try {
      if (esAporte) {
        await contribute.mutateAsync({ id: investment.id, fromAccountId: accountId, amount, date });
      } else {
        await withdraw.mutateAsync({ id: investment.id, toAccountId: accountId, amount, date });
      }
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar el movimiento.');
    }
  };

  // Ni deuda, ni archivadas, ni la cuenta que respalda la posición.
  const options = (accounts.data?.accounts ?? []).filter(
    (a) => !a.archivedAt && !a.isDebt && a.id !== investment.accountId,
  );

  return (
    <Sheet
      open
      onClose={onClose}
      title={esAporte ? `Aportar a ${investment.name}` : `Retirar de ${investment.name}`}
      subtitle="Mover dinero entre tus cuentas, no un gasto"
      footer={
        <Button full onClick={() => void submit()} loading={pending}>
          {esAporte ? 'Registrar aporte' : 'Registrar retiro'}
        </Button>
      }
    >
      <div className="space-y-4">
        <AmountInput value={amount} onChange={setAmount} autoFocus label="Monto" />

        {!esAporte && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="chip"
              onClick={() => setAmount(String(Number(investment.investedAmount)))}
            >
              Todo el capital · {money(investment.investedAmount, { compact: true })}
            </button>
          </div>
        )}

        <SelectField
          label={esAporte ? 'Sale de' : 'Entra a'}
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
            {esAporte ? (
              <>
                Invertir <strong>no</strong> es gastar: el dinero sigue siendo tuyo y no consume
                presupuesto del ciclo.
              </>
            ) : (
              <>
                Retirar <strong>tampoco</strong> es un ingreso. Puedes sacar hasta{' '}
                {money(investment.investedAmount, { compact: true })} de capital; si vendiste con
                ganancia, registra antes el valor actual.
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

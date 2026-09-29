/**
 * Confirmar una ocurrencia vencida.
 *
 * El monto es editable SIEMPRE, no solo en las variables: la renta sube, el
 * recibo trae un recargo. Obligar a editar la regla para registrar un mes
 * distinto haria que el historico dejara de ser cierto.
 */
import { useEffect, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { SelectField } from '@/core/components/ui/Field';
import { AmountInput } from '@/domains/finance/transactions/components/AmountInput';
import { DatePicker } from '@/domains/finance/transactions/components/DatePicker';
import { ApiError } from '@/core/lib/api';
import { useAccounts, useConfirmPending } from '@/domains/finance/shared/api';
import type { PendingItem } from '@/domains/finance/shared/types/recurring';

interface Props {
  item: PendingItem | null;
  onClose: () => void;
}

export function ConfirmPendingSheet({ item, onClose }: Props) {
  const confirm = useConfirmPending();
  const accounts = useAccounts();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setAmount(item.amount ? String(Number(item.amount)) : '');
    setDate(item.dueDate);
    setAccountId(item.account?.id ?? '');
    setError(null);
  }, [item]);

  if (!item) return null;

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return setError('Escribe el monto real.');
    try {
      await confirm.mutateAsync({
        id: item.ruleId,
        amount,
        date,
        ...(accountId && accountId !== item.account?.id ? { accountId } : {}),
      });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar el movimiento.');
    }
  };

  const options = (accounts.data?.accounts ?? []).filter((a) => !a.archivedAt);

  return (
    <Sheet
      open
      onClose={onClose}
      title={item.name}
      subtitle={item.isEstimate ? 'Monto variable: escribe cuánto fue esta vez' : 'Confirma el cargo'}
      footer={
        <Button full onClick={() => void submit()} loading={confirm.isPending}>
          Registrar movimiento
        </Button>
      }
    >
      <div className="space-y-4">
        <AmountInput value={amount} onChange={setAmount} autoFocus label="Monto real" />

        <DatePicker value={date} onChange={setDate} />

        <SelectField
          label="Cuenta"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          hint="Solo para este cargo; la recurrencia no cambia."
        >
          {options.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </SelectField>

        {item.overdueCount > 1 && (
          <p className="text-[12px]" style={{ color: 'var(--ink-2)' }}>
            Llevas {item.overdueCount} ocurrencias sin registrar. Esta confirma la más antigua
            ({item.dueDate}); las demás seguirán en la bandeja.
          </p>
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

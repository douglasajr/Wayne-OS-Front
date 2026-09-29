/**
 * Pago de tarjeta.
 *
 * Precargado con lo que falta del corte y la cuenta configurada: el caso
 * habitual es pagar el total y no tener que pensarlo.
 *
 * Lo que este panel deja claro, porque es la regla que mas se malinterpreta:
 * pagar la tarjeta NO es un gasto. El gasto ocurrio en la compra. Aqui solo se
 * mueve dinero entre cuentas propias.
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
import { toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import { useAccounts, usePayCard } from '@/domains/finance/shared/api';
import type { CreditCard } from '@/domains/finance/shared/types/cards';

export function PayCardSheet({ card, onClose }: { card: CreditCard | null; onClose: () => void }) {
  const pay = usePayCard();
  const accounts = useAccounts();

  const [amount, setAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!card) return;
    setAmount(String(Number(card.statement.remaining)));
    setFromAccountId(card.defaultPaymentAccountId ?? '');
    setDate(todayIso());
    setError(null);
  }, [card]);

  if (!card) return null;

  const debt = toNumber(card.debt);
  const remaining = toNumber(card.statement.remaining);
  const minimum = card.statement.minimumPayment ? toNumber(card.statement.minimumPayment) : null;

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return setError('Escribe el monto del pago.');
    if (!fromAccountId) return setError('Elige desde qué cuenta se paga.');
    try {
      await pay.mutateAsync({ id: card.id, amount, fromAccountId, date });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar el pago.');
    }
  };

  // Ni tarjetas ni cuentas archivadas: no se paga una tarjeta con otra.
  const options = (accounts.data?.accounts ?? []).filter((a) => !a.archivedAt && !a.isDebt);

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Pagar ${card.name}`}
      subtitle="Mover dinero entre tus cuentas, no un gasto nuevo"
      footer={
        <Button full onClick={() => void submit()} loading={pay.isPending}>
          Registrar pago
        </Button>
      }
    >
      <div className="space-y-4">
        <AmountInput value={amount} onChange={setAmount} autoFocus label="Monto del pago" />

        <div className="flex flex-wrap gap-2">
          <button type="button" className="chip" onClick={() => setAmount(String(remaining))}>
            Corte · {money(remaining, { compact: true })}
          </button>
          {minimum !== null && minimum > 0 && (
            <button type="button" className="chip" onClick={() => setAmount(String(minimum))}>
              Mínimo · {money(minimum, { compact: true })}
            </button>
          )}
          {debt > remaining && (
            <button type="button" className="chip" onClick={() => setAmount(String(debt))}>
              Todo · {money(debt, { compact: true })}
            </button>
          )}
        </div>

        <SelectField
          label="Sale de"
          value={fromAccountId}
          onChange={(e) => setFromAccountId(e.target.value)}
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
            Este pago <strong>no</strong> cuenta como gasto del mes: el gasto ya se registró
            cuando usaste la tarjeta. No puedes pagar más de {money(debt, { compact: true })},
            que es lo que debes en total.
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

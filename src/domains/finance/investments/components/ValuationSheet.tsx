/**
 * Registrar cuánto vale hoy.
 *
 * El valor entra a mano y con fecha, y de ahí sale el patrimonio de cualquier
 * mes pasado. No se estima ni se actualiza solo: mismo criterio que la meta
 * del fondo de emergencia (regla 18) y que las recurrencias (regla 14).
 */
import { useEffect, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { TextField } from '@/core/components/ui/Field';
import { AmountInput } from '@/domains/finance/transactions/components/AmountInput';
import { DatePicker } from '@/domains/finance/transactions/components/DatePicker';
import { ApiError } from '@/core/lib/api';
import { todayIso, longDate } from '@/core/lib/dates';
import { toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import { useRecordValuation } from '@/domains/finance/shared/api';
import type { Investment } from '@/domains/finance/shared/types/investments';

export function ValuationSheet({
  investment,
  onClose,
}: {
  investment: Investment | null;
  onClose: () => void;
}) {
  const record = useRecordValuation();
  const [value, setValue] = useState('');
  const [rate, setRate] = useState('');
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!investment) return;
    setValue(String(Number(investment.currentValue)));
    setRate(investment.valuations[0]?.exchangeRate ?? '');
    setDate(todayIso());
    setError(null);
  }, [investment]);

  if (!investment) return null;

  const invested = toNumber(investment.investedAmount);
  const previsto = toNumber(value) - invested;
  const necesitaTasa = investment.currencyCode !== 'HNL';

  const submit = async () => {
    if (!value) return setError('Escribe cuánto vale.');
    if (necesitaTasa && !rate) return setError('Indica el tipo de cambio.');
    try {
      await record.mutateAsync({
        id: investment.id,
        value,
        date,
        ...(necesitaTasa ? { exchangeRate: rate } : {}),
      });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar el valor.');
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Valor de ${investment.name}`}
      subtitle="Cuánto vale hoy, según lo que ves en tu cuenta"
      footer={
        <Button full onClick={() => void submit()} loading={record.isPending}>
          Registrar valor
        </Button>
      }
    >
      <div className="space-y-4">
        <AmountInput
          value={value}
          onChange={setValue}
          autoFocus
          label={`Valor actual${necesitaTasa ? ` (${investment.currencyCode})` : ''}`}
        />

        {necesitaTasa && (
          <TextField
            label={`Tipo de cambio ${investment.currencyCode} → HNL`}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            inputMode="decimal"
            hint="Se congela con esta valuación: lo que valía en junio no cambiará mañana."
          />
        )}

        <DatePicker value={date} onChange={setDate} />

        <div
          className="flex items-start gap-2.5 px-3.5 py-3 text-[12px]"
          style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', color: 'var(--ink-2)' }}
        >
          <Icon name="alert" size={15} strokeWidth={2} />
          <span>
            Con este valor, la posición {previsto >= 0 ? 'gana' : 'pierde'}{' '}
            <strong>{money(Math.abs(previsto), { compact: true })}</strong> sobre los{' '}
            {money(invested, { compact: true })} invertidos. Tu patrimonio solo suma esa
            diferencia: el capital ya estaba contado en el saldo de la cuenta.
          </span>
        </div>

        {investment.valuations.length > 0 && (
          <div>
            <p className="label-deco mb-1.5 text-[9px]" style={{ color: 'var(--ink-muted)' }}>
              Historial
            </p>
            <ul className="space-y-1">
              {investment.valuations.slice(0, 6).map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 text-[12px]">
                  <span style={{ color: 'var(--ink-muted)' }}>{longDate(v.date)}</span>
                  <span className="tabular">{money(v.valueBase, { compact: true })}</span>
                </li>
              ))}
            </ul>
          </div>
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

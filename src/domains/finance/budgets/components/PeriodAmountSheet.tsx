/**
 * Tope del ciclo.
 *
 * Existe porque el reparto entre quincenas casi nunca es mitad y mitad: si la
 * renta y los servicios caen en la primera, ese ciclo vale mas. El ciclo
 * siguiente heredara el numero que se ponga aqui.
 */
import { useEffect, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { AmountInput } from '@/domains/finance/transactions/components/AmountInput';
import { ApiError } from '@/core/lib/api';
import { money } from '@/domains/finance/shared/money';
import { useSetPeriodAmount } from '@/domains/finance/shared/api';
import type { BudgetView, PeriodSelector } from '@/domains/finance/shared/types/budget';

interface Props {
  open: boolean;
  onClose: () => void;
  selector: PeriodSelector;
  view: BudgetView;
}

export function PeriodAmountSheet({ open, onClose, selector, view }: Props) {
  const mutation = useSetPeriodAmount(selector);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue(String(Number(view.totals.planned)));
    setError(null);
  }, [open, view.totals.planned]);

  const submit = async () => {
    if (!value || Number(value) < 0) return setError('Escribe un monto válido.');
    try {
      await mutation.mutateAsync(value);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar el tope.');
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Tope de este ciclo"
      subtitle="Cuánto puedes gastar entre estas fechas"
      footer={
        <Button full onClick={() => void submit()} loading={mutation.isPending}>
          Guardar
        </Button>
      }
    >
      <div className="space-y-4">
        <AmountInput value={value} onChange={setValue} autoFocus label="Tope del ciclo" />
        <p className="text-[12px]" style={{ color: 'var(--ink-2)' }}>
          Tu plan mensual para gastar es de {money(view.plan.monthlySpendingBudget, { compact: true })}.
          Repartirlo desigual entre quincenas es normal: la renta cae en una sola.
        </p>
        <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          El próximo ciclo nacerá con este mismo tope y estos mismos límites.
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

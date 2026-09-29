/**
 * Diferir una compra a cuotas.
 *
 * Se abre desde el detalle del movimiento, que es donde tiene sentido: primero
 * compras, despues el banco te ofrece diferirlo. Solo aparece en compras hechas
 * con tarjeta de credito.
 */
import { useEffect, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { ApiError } from '@/core/lib/api';
import { money } from '@/domains/finance/shared/money';
import { useCreateInstallmentPlan } from '@/domains/finance/shared/api';

const OPTIONS = [3, 6, 9, 12, 18, 24];

interface Props {
  open: boolean;
  onClose: () => void;
  transactionId: string;
  amount: string;
  description: string | null;
}

export function DeferSheet({ open, onClose, transactionId, amount, description }: Props) {
  const create = useCreateInstallmentPlan();
  const [months, setMonths] = useState(12);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMonths(12);
    setError(null);
  }, [open]);

  const perMonth = Number(amount) / months;

  const submit = async () => {
    try {
      await create.mutateAsync({ transactionId, months });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo diferir la compra.');
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Diferir a cuotas"
      subtitle={description ?? 'Compra con tarjeta'}
      footer={
        <Button full onClick={() => void submit()} loading={create.isPending}>
          Diferir a {months} meses
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="text-center">
          <div className="figure tabular text-[40px] leading-none">
            {money(perMonth, { compact: true })}
          </div>
          <div className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
            al mes durante {months} meses
          </div>
        </div>

        <fieldset>
          <legend className="label-deco mb-2 text-[9px]" style={{ color: 'var(--ink-muted)' }}>
            Plazo
          </legend>
          <div className="flex flex-wrap gap-2">
            {OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                className="chip"
                aria-pressed={months === m}
                onClick={() => setMonths(m)}
                style={months === m ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
              >
                {m} meses
              </button>
            ))}
          </div>
        </fieldset>

        <p className="text-[12px]" style={{ color: 'var(--ink-2)' }}>
          El gasto de {money(amount, { compact: true })} <strong>ya está registrado</strong> y no
          cambia: diferir solo reparte su cobro. La primera cuota cae un mes después de la compra.
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

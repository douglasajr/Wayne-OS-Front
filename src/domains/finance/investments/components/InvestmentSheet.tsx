/**
 * Alta y edición de una posición.
 *
 * La decisión que la pantalla tiene que dejar clara es la de la cuenta:
 *
 * - **Con cuenta** (casa de bolsa, exchange): el dinero entra con aportes y el
 *   patrimonio ya cuenta ese saldo, así que la posición solo suma su plusvalía.
 * - **Sin cuenta** (un terreno, un negocio): no hay movimiento bancario que
 *   seguir, el capital se declara a mano y el patrimonio suma el valor entero.
 *
 * Si eso no se entiende al crear la posición, el patrimonio acaba contando dos
 * veces o dejando fuera un activo real.
 */
import { useEffect, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { SelectField, TextField } from '@/core/components/ui/Field';
import { Icon } from '@/core/components/ui/Icon';
import { AmountInput } from '@/domains/finance/transactions/components/AmountInput';
import { ApiError } from '@/core/lib/api';
import { toNumber } from '@/core/lib/format';
import {
  useAccounts,
  useCloseInvestment,
  useCreateInvestment,
  useUpdateInvestment,
} from '@/domains/finance/shared/api';
import type { Investment, InvestmentType } from '@/domains/finance/shared/types/investments';

const TIPOS: { value: InvestmentType; label: string }[] = [
  { value: 'ETF', label: 'ETF' },
  { value: 'STOCK', label: 'Acciones' },
  { value: 'MUTUAL_FUND', label: 'Fondo de inversión' },
  { value: 'CRYPTO', label: 'Cripto' },
  { value: 'FIXED_INCOME', label: 'Renta fija' },
  { value: 'REAL_ESTATE', label: 'Inmueble' },
  { value: 'BUSINESS', label: 'Negocio' },
  { value: 'OTHER', label: 'Otro' },
];

/** Estos casi nunca tienen una cuenta de banco detrás. */
const SIN_CUENTA: InvestmentType[] = ['REAL_ESTATE', 'BUSINESS', 'OTHER'];

export function InvestmentSheet({
  investment,
  open,
  onClose,
}: {
  investment: Investment | null;
  open: boolean;
  onClose: () => void;
}) {
  const create = useCreateInvestment();
  const update = useUpdateInvestment();
  const close = useCloseInvestment();
  const accounts = useAccounts();

  const [type, setType] = useState<InvestmentType>('ETF');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [currencyCode, setCurrencyCode] = useState('HNL');
  const [accountId, setAccountId] = useState('');
  const [openingInvested, setOpeningInvested] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType(investment?.type ?? 'ETF');
    setName(investment?.name ?? '');
    setSymbol(investment?.symbol ?? '');
    setCurrencyCode(investment?.currencyCode ?? 'HNL');
    setAccountId(investment?.accountId ?? '');
    setOpeningInvested(investment?.openingInvested ? String(Number(investment.openingInvested)) : '');
    setCurrentValue('');
    setError(null);
  }, [investment, open]);

  if (!open) return null;

  const isEdit = investment !== null;
  // El backend bloquea cambiar de cuenta cuando ya hay aportes: la dirección
  // de los movimientos pasados dejaría de tener sentido.
  const aportado = isEdit
    ? toNumber(investment.investedAmount) - toNumber(investment.openingInvested)
    : 0;
  const lockedAccount = aportado !== 0;
  const pending = create.isPending || update.isPending || close.isPending;

  const submit = async () => {
    if (!name.trim()) return setError('La inversión necesita un nombre.');

    try {
      if (isEdit) {
        await update.mutateAsync({
          id: investment.id,
          name: name.trim(),
          symbol: symbol.trim() || (null as unknown as undefined),
          accountId: accountId || (null as unknown as undefined),
          openingInvested: openingInvested ? String(Number(openingInvested)) : '0',
        });
      } else {
        await create.mutateAsync({
          type,
          name: name.trim(),
          symbol: symbol.trim() || undefined,
          currencyCode,
          accountId: accountId || undefined,
          openingInvested: openingInvested ? String(Number(openingInvested)) : undefined,
          currentValue: currentValue ? String(Number(currentValue)) : undefined,
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar la inversión.');
    }
  };

  const cerrar = async () => {
    if (!investment) return;
    try {
      await close.mutateAsync(investment.id);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cerrar la posición.');
    }
  };

  const options = (accounts.data?.accounts ?? []).filter((a) => !a.archivedAt && !a.isDebt);
  const sugerirSinCuenta = SIN_CUENTA.includes(type);

  return (
    <Sheet
      open
      onClose={onClose}
      title={isEdit ? `Editar ${investment.name}` : 'Nueva inversión'}
      subtitle="Qué es, dónde vive y cuánto pusiste"
      footer={
        <Button full onClick={() => void submit()} loading={pending}>
          {isEdit ? 'Guardar cambios' : 'Crear inversión'}
        </Button>
      }
    >
      <div className="space-y-4">
        {!isEdit && (
          <SelectField
            label="Tipo"
            value={type}
            onChange={(e) => setType(e.target.value as InvestmentType)}
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </SelectField>
        )}

        <TextField
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="S&P 500, Terreno en La Ceiba…"
          data-autofocus
        />

        <TextField
          label="Símbolo (opcional)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="VOO, BTC…"
        />

        {!isEdit && (
          <SelectField
            label="Moneda"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
            hint="Si no es lempiras, cada valuación pedirá el tipo de cambio y lo congelará."
          >
            <option value="HNL">Lempiras (L)</option>
            <option value="USD">Dólares ($)</option>
          </SelectField>
        )}

        <SelectField
          label="Cuenta que la respalda"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          disabled={lockedAccount}
          hint={
            lockedAccount
              ? 'No se puede cambiar: la posición ya tiene aportes registrados.'
              : sugerirSinCuenta
                ? 'Un inmueble o un negocio normalmente no tiene cuenta: déjalo vacío y declara el capital abajo.'
                : 'La casa de bolsa o el exchange donde está el dinero. Sin ella no podrás registrar aportes.'
          }
        >
          <option value="">Sin cuenta</option>
          {options.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </SelectField>

        <div>
          <AmountInput value={openingInvested} onChange={setOpeningInvested} label="Capital ya puesto" />
          <p className="mt-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            Lo que invertiste antes de registrar la posición. Sin esto, un terreno comprado hace
            años aparecería como ganancia pura.
          </p>
        </div>

        {!isEdit && (
          <div>
            <AmountInput value={currentValue} onChange={setCurrentValue} label="Cuánto vale hoy (opcional)" />
            <p className="mt-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              Se guarda como su primera valuación. Si lo dejas vacío, vale lo que costó.
            </p>
          </div>
        )}

        <div
          className="flex items-start gap-2.5 px-3.5 py-3 text-[12px]"
          style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', color: 'var(--ink-2)' }}
        >
          <Icon name="alert" size={15} strokeWidth={2} />
          <span>
            {accountId ? (
              <>
                Con cuenta detrás, tu patrimonio ya cuenta ese saldo: esta posición solo sumará la{' '}
                <strong>diferencia</strong> entre lo que vale y lo que costó.
              </>
            ) : (
              <>
                Sin cuenta, el patrimonio suma el <strong>valor completo</strong> de la posición, y
                los aportes se registran editando el capital, no con movimientos.
              </>
            )}
          </span>
        </div>

        {isEdit && (
          <button
            type="button"
            className="chip"
            onClick={() => void cerrar()}
            disabled={toNumber(investment.investedAmount) > 0}
            title={
              toNumber(investment.investedAmount) > 0
                ? 'Retira el capital antes de cerrarla'
                : 'Cerrar la posición'
            }
          >
            Cerrar posición
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

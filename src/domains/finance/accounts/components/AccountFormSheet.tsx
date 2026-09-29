/**
 * Alta y edicion de cuentas.
 *
 * Dos cosas que este formulario hace a proposito:
 *
 *  - En una tarjeta o un prestamo se pregunta "¿cuánto debes?" y se envia en
 *    NEGATIVO. Nadie piensa su deuda como un numero negativo, pero la base si
 *    la guarda asi (un pasivo con saldo positivo revienta el CHECK).
 *  - El saldo inicial NO se puede editar despues. Cambiarlo descuadraria en
 *    silencio todo el historico; para corregir un saldo mal capturado se
 *    registra un movimiento de ajuste, que queda visible.
 */
import { useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { TextField, SelectField } from '@/core/components/ui/Field';
import { ApiError } from '@/core/lib/api';
import { ACCOUNT_TYPE } from '@/domains/finance/shared/accounts';
import { toNumber } from '@/core/lib/format';
import { useCreateAccount, useUpdateAccount } from '@/domains/finance/shared/api';
import type { Account, AccountType } from '@/domains/finance/shared/types/domain';

/** Las tres del catalogo sembrado (`DEFAULT_CURRENCIES` en el backend). */
const CURRENCIES = [
  { code: 'HNL', label: 'Lempira (L)' },
  { code: 'USD', label: 'Dólar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
];

const DEBT_TYPES: AccountType[] = ['CREDIT_CARD', 'LOAN'];

export function AccountFormSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Account | null;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar cuenta' : 'Nueva cuenta'}
      subtitle={editing ? editing.name : 'Bancos, efectivo, tarjetas y préstamos.'}
    >
      <AccountForm editing={editing ?? null} onDone={onClose} />
    </Sheet>
  );
}

function AccountForm({ editing, onDone }: { editing: Account | null; onDone: () => void }) {
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const mutation = editing ? update : create;

  const [name, setName] = useState(editing?.name ?? '');
  const [type, setType] = useState<AccountType>(editing?.type ?? 'CHECKING');
  const [currencyCode, setCurrencyCode] = useState(editing?.currencyCode ?? 'HNL');
  const [balance, setBalance] = useState('');
  const [institution, setInstitution] = useState(editing?.institution ?? '');
  const [includeInNetWorth, setIncludeInNetWorth] = useState(editing?.includeInNetWorth ?? true);

  const [creditLimit, setCreditLimit] = useState(editing?.creditCardDetail?.creditLimit ?? '');
  const [cutoffDay, setCutoffDay] = useState(String(editing?.creditCardDetail?.cutoffDay ?? 25));
  const [paymentDueDay, setPaymentDueDay] = useState(String(editing?.creditCardDetail?.paymentDueDay ?? 15));
  const [brand, setBrand] = useState(editing?.creditCardDetail?.brand ?? '');
  const [last4, setLast4] = useState(editing?.creditCardDetail?.last4 ?? '');

  const [touched, setTouched] = useState(false);

  const isDebt = DEBT_TYPES.includes(type);
  const isCard = type === 'CREDIT_CARD';

  const errors = {
    name: touched && !name.trim() ? 'Ponle un nombre.' : undefined,
    creditLimit:
      touched && isCard && toNumber(creditLimit) <= 0 ? 'La tarjeta necesita su límite.' : undefined,
    last4: touched && last4 && !/^\d{4}$/.test(last4) ? 'Deben ser exactamente 4 dígitos.' : undefined,
  };
  const valid =
    Boolean(name.trim()) &&
    (!isCard || toNumber(creditLimit) > 0) &&
    (!last4 || /^\d{4}$/.test(last4));

  async function submit() {
    setTouched(true);
    if (!valid) return;

    if (editing) {
      await update.mutateAsync({
        id: editing.id,
        name: name.trim(),
        institution: institution.trim() || null,
        includeInNetWorth,
        ...(editing.creditCardDetail
          ? {
              creditCard: {
                ...(creditLimit ? { creditLimit } : {}),
                cutoffDay: Number(cutoffDay),
                paymentDueDay: Number(paymentDueDay),
                brand: brand.trim() || null,
                last4: last4 || null,
              },
            }
          : {}),
      });
    } else {
      // Un pasivo se captura en positivo y se guarda en negativo.
      const initial = toNumber(balance);
      const initialBalance = isDebt ? String(-Math.abs(initial)) : String(initial);

      await create.mutateAsync({
        name: name.trim(),
        type,
        currencyCode,
        initialBalance,
        includeInNetWorth,
        ...(institution.trim() ? { institution: institution.trim() } : {}),
        ...(isCard
          ? {
              creditCard: {
                creditLimit,
                cutoffDay: Number(cutoffDay),
                paymentDueDay: Number(paymentDueDay),
                ...(brand.trim() ? { brand: brand.trim() } : {}),
                ...(last4 ? { last4 } : {}),
              },
            }
          : {}),
      });
    }

    onDone();
  }

  return (
    <div className="space-y-4">
      <TextField
        label="Nombre"
        placeholder="BAC ahorro, Efectivo, Visa…"
        value={name}
        maxLength={80}
        error={errors.name}
        onChange={(e) => setName(e.target.value)}
      />

      {editing ? (
        <p className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
          El tipo, la moneda y el saldo inicial no se editan: cambiarlos descuadraría el histórico. Para
          corregir un saldo, registra un movimiento de ajuste.
        </p>
      ) : (
        <>
          <SelectField label="Tipo" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            {Object.entries(ACCOUNT_TYPE).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </SelectField>

          <SelectField
            label="Moneda"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
            hint="No se puede cambiar después."
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </SelectField>

          <TextField
            label={isDebt ? '¿Cuánto debes hoy?' : 'Saldo actual'}
            inputMode="decimal"
            placeholder="0.00"
            value={balance}
            hint={
              isDebt
                ? 'Escríbelo en positivo: se guarda como deuda.'
                : 'Con lo que la cuenta entra al sistema. No se puede cambiar después.'
            }
            onChange={(e) => setBalance(e.target.value.replace(/[^\d.]/g, ''))}
          />
        </>
      )}

      <TextField
        label="Institución (opcional)"
        placeholder="BAC, Ficohsa, Banpaís…"
        value={institution}
        maxLength={80}
        onChange={(e) => setInstitution(e.target.value)}
      />

      {isCard && (
        <div
          className="space-y-3 border px-3 py-3"
          style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius-sm)' }}
        >
          <p className="label-deco text-[9px]" style={{ color: 'var(--ink-muted)' }}>
            Datos de la tarjeta
          </p>

          <TextField
            label="Límite de crédito"
            inputMode="decimal"
            value={creditLimit}
            error={errors.creditLimit}
            onChange={(e) => setCreditLimit(e.target.value.replace(/[^\d.]/g, ''))}
          />

          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="Día de corte"
              inputMode="numeric"
              value={cutoffDay}
              onChange={(e) => setCutoffDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
            />
            <TextField
              label="Día de pago"
              inputMode="numeric"
              value={paymentDueDay}
              onChange={(e) => setPaymentDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <TextField label="Marca" placeholder="Visa" value={brand} onChange={(e) => setBrand(e.target.value)} />
            <TextField
              label="Últimos 4"
              inputMode="numeric"
              placeholder="1234"
              value={last4}
              error={errors.last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        className="chip w-full justify-center"
        aria-pressed={includeInNetWorth}
        onClick={() => setIncludeInNetWorth((v) => !v)}
      >
        <Icon name="scale" size={15} strokeWidth={2} />
        Cuenta para el patrimonio neto
      </button>

      {mutation.error && (
        <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
          {mutation.error instanceof ApiError ? mutation.error.message : 'No se pudo guardar la cuenta.'}
        </p>
      )}

      <Button full icon="check" loading={mutation.isPending} onClick={() => void submit()}>
        {editing ? 'Guardar cambios' : 'Crear cuenta'}
      </Button>
    </div>
  );
}

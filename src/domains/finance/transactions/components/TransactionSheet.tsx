/**
 * Formulario completo: gasto, ingreso y transferencia. Sirve para crear y para
 * corregir.
 *
 * Este formulario es donde el producto ENSEÑA sus reglas, no solo donde las
 * aplica:
 *
 *  - Una transferencia no lleva categoria y lo dice en pantalla: mover dinero
 *    entre cuentas propias no es gasto (regla 1).
 *  - Si el destino es una tarjeta, se avisa que pagarla no vuelve a contar el
 *    gasto, porque el gasto ya ocurrio en la compra (regla 2).
 *  - Si las dos cuentas usan monedas distintas se pide cuanto ENTRA en la de
 *    destino, en vez de inventar una tasa (regla 10).
 *
 * Los campos cambian segun el tipo porque el backend rechaza las combinaciones
 * imposibles; mostrarlas seria ofrecer un camino sin salida.
 *
 * Al editar, el TIPO queda fijo: convertir un gasto en transferencia cambiaria
 * el significado del movimiento y el efecto sobre dos saldos a la vez. Para eso
 * se borra y se vuelve a registrar, que deja rastro.
 */
import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { ApiError } from '@/core/lib/api';
import { toNumber } from '@/core/lib/format';
import { todayIso } from '@/core/lib/dates';
import { PAYMENT_METHOD, defaultPaymentMethod, preferredAccountId, rememberAccount } from '@/domains/finance/shared/accounts';
import { useAccounts, useCreateTransaction, useUpdateTransaction } from '@/domains/finance/shared/api';
import type { PaymentMethod, Transaction, TransactionType } from '@/domains/finance/shared/types/domain';
import { AmountInput } from './AmountInput';
import { AccountPicker } from './AccountPicker';
import { CategoryPicker } from './CategoryPicker';
import { DatePicker } from './DatePicker';

const TYPES: { value: TransactionType; label: string; icon: 'out' | 'in' | 'repeat' }[] = [
  { value: 'EXPENSE', label: 'Gasto', icon: 'out' },
  { value: 'INCOME', label: 'Ingreso', icon: 'in' },
  { value: 'TRANSFER', label: 'Traslado', icon: 'repeat' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  /** Presente = se esta corrigiendo un movimiento ya registrado. */
  editing?: Transaction | null;
}

export function TransactionSheet({ open, onClose, initialType = 'EXPENSE', editing = null }: Props) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Corregir movimiento' : 'Nuevo movimiento'}
      subtitle={editing ? 'Los saldos se ajustan solos al guardar.' : undefined}
      size="lg"
    >
      <TransactionForm initialType={initialType} editing={editing} onDone={onClose} />
    </Sheet>
  );
}

function TransactionForm({
  initialType,
  editing,
  onDone,
}: {
  initialType: TransactionType;
  editing: Transaction | null;
  onDone: () => void;
}) {
  const accounts = useAccounts();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const mutation = editing ? update : create;

  const [type, setType] = useState<TransactionType>(editing?.type ?? initialType);
  const [amount, setAmount] = useState(editing?.amount ?? '');
  const [toAmount, setToAmount] = useState(editing?.toAmount ?? '');
  const [categoryId, setCategoryId] = useState(editing?.category?.id ?? '');
  const [fromId, setFromId] = useState(editing?.fromAccount?.id ?? '');
  const [toId, setToId] = useState(editing?.toAccount?.id ?? '');
  const [date, setDate] = useState(editing?.date ?? todayIso());
  const [description, setDescription] = useState(editing?.description ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [method, setMethod] = useState<PaymentMethod | ''>(editing?.paymentMethod ?? '');
  const [touched, setTouched] = useState(false);

  const list = accounts.data?.accounts ?? [];

  useEffect(() => {
    if (editing || list.length === 0) return;
    const preferred = preferredAccountId(list);
    if (type === 'INCOME') {
      if (!toId) setToId(preferred);
    } else if (!fromId) {
      setFromId(preferred);
    }
  }, [list, type, fromId, toId, editing]);

  // La categoria pertenece a un tipo: al cambiar de gasto a ingreso, la que
  // estaba elegida ya no sirve y dejarla provocaria un 422 del backend.
  useEffect(() => {
    if (editing) return;
    setCategoryId('');
  }, [type, editing]);

  const from = list.find((a) => a.id === fromId);
  const to = list.find((a) => a.id === toId);

  const crossCurrency =
    type === 'TRANSFER' && Boolean(from && to) && from!.currencyCode !== to!.currencyCode;

  const payingCard = type === 'TRANSFER' && Boolean(to?.isDebt);

  const value = toNumber(amount);

  const errors = useMemo(() => {
    if (!touched) return {} as Record<string, string | undefined>;
    return {
      amount: value <= 0 ? 'Escribe el monto.' : undefined,
      categoryId: type !== 'TRANSFER' && !categoryId ? 'Elige una categoría.' : undefined,
      fromId: type !== 'INCOME' && !fromId ? 'Elige la cuenta de origen.' : undefined,
      toId:
        type !== 'EXPENSE' && !toId
          ? 'Elige la cuenta de destino.'
          : type === 'TRANSFER' && fromId === toId
            ? 'El origen y el destino deben ser cuentas distintas.'
            : undefined,
      toAmount:
        crossCurrency && toNumber(toAmount) <= 0 ? 'Indica cuánto entra en la cuenta destino.' : undefined,
    };
  }, [touched, value, type, categoryId, fromId, toId, crossCurrency, toAmount]);

  const valid =
    value > 0 &&
    (type === 'TRANSFER' || Boolean(categoryId)) &&
    (type === 'INCOME' || Boolean(fromId)) &&
    (type === 'EXPENSE' || Boolean(toId)) &&
    (type !== 'TRANSFER' || fromId !== toId) &&
    (!crossCurrency || toNumber(toAmount) > 0);

  async function submit() {
    setTouched(true);
    if (!valid) return;

    const common = {
      amount,
      date,
      // `null` borra el campo; el backend distingue "no tocar" (ausente) de
      // "dejarlo vacío" (null), y al corregir hace falta poder vaciarlo.
      description: description.trim() || (editing ? null : undefined),
      notes: notes.trim() || (editing ? null : undefined),
      ...(type !== 'TRANSFER' ? { categoryId } : {}),
      ...(type !== 'INCOME' ? { fromAccountId: fromId } : {}),
      ...(type !== 'EXPENSE' ? { toAccountId: toId } : {}),
      ...(crossCurrency ? { toAmount } : {}),
      ...(type === 'EXPENSE'
        ? { paymentMethod: method || (from ? defaultPaymentMethod(from.type) : undefined) }
        : {}),
    };

    if (editing) await update.mutateAsync({ id: editing.id, ...common });
    else await create.mutateAsync({ type, ...common });

    if (type !== 'INCOME' && fromId) rememberAccount(fromId);
    onDone();
  }

  return (
    <div className="space-y-4">
      {editing ? (
        <div className="flex items-center gap-2">
          <span className="chip" data-selected="true" style={{ pointerEvents: 'none' }}>
            <Icon name={TYPES.find((t) => t.value === type)!.icon} size={15} strokeWidth={2.2} />
            {TYPES.find((t) => t.value === type)!.label}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            El tipo no se cambia al corregir.
          </span>
        </div>
      ) : (
        // Tipo: tres fichas visibles, no un desplegable. El tipo cambia el
        // resto del formulario, así que debe verse de un vistazo cuál está
        // activo.
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className="chip justify-center"
              aria-pressed={type === t.value}
              onClick={() => setType(t.value)}
            >
              <Icon name={t.icon} size={15} strokeWidth={2.2} />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {type === 'TRANSFER' && (
        <p
          className="flex items-start gap-2 px-3 py-2.5 text-[12px]"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', borderRadius: 'var(--radius-sm)' }}
        >
          <span className="mt-px shrink-0" style={{ color: 'var(--accent)' }}>
            <Icon name="repeat" size={14} strokeWidth={2.2} />
          </span>
          <span>
            Un traslado entre tus cuentas <strong>no es gasto</strong>: mueve el dinero de sitio, no lo
            consume. Por eso no lleva categoría.
          </span>
        </p>
      )}

      {payingCard && (
        <p
          className="flex items-start gap-2 px-3 py-2.5 text-[12px]"
          style={{
            background: 'color-mix(in oklab, var(--accent) 10%, transparent)',
            color: 'var(--ink-2)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <span className="mt-px shrink-0" style={{ color: 'var(--accent)' }}>
            <Icon name="card" size={14} strokeWidth={2.2} />
          </span>
          <span>
            Pagar la tarjeta baja la deuda, <strong>no vuelve a contar como gasto</strong>: ese gasto ya se
            registró cuando hiciste la compra.
          </span>
        </p>
      )}

      <AmountInput
        value={amount}
        onChange={setAmount}
        autoFocus
        error={errors.amount}
        currency={from?.currencyCode === 'USD' ? '$' : 'L'}
        label={crossCurrency ? `Sale de la cuenta (${from?.currencyCode})` : 'Monto'}
      />

      {crossCurrency && (
        <AmountInput
          value={toAmount}
          onChange={setToAmount}
          error={errors.toAmount}
          currency={to?.currencyCode === 'USD' ? '$' : 'L'}
          label={`Entra en la cuenta (${to?.currencyCode})`}
        />
      )}

      {type !== 'TRANSFER' && (
        <CategoryPicker
          type={type === 'INCOME' ? 'INCOME' : 'EXPENSE'}
          value={categoryId}
          onChange={setCategoryId}
          error={errors.categoryId}
        />
      )}

      {type !== 'INCOME' && (
        <AccountPicker
          accounts={list}
          value={fromId}
          onChange={setFromId}
          label={type === 'TRANSFER' ? 'Sale de' : 'Pagado con'}
          error={errors.fromId}
          excludeId={type === 'TRANSFER' ? toId : undefined}
        />
      )}

      {type !== 'EXPENSE' && (
        <AccountPicker
          accounts={list}
          value={toId}
          onChange={setToId}
          label="Entra a"
          error={errors.toId}
          excludeId={type === 'TRANSFER' ? fromId : undefined}
        />
      )}

      <DatePicker value={date} onChange={setDate} />

      {type === 'EXPENSE' && (
        <label className="block">
          <span className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
            Método de pago
          </span>
          <select
            className="field"
            style={{ fontSize: 14, padding: '11px 13px' }}
            value={method || (from ? defaultPaymentMethod(from.type) : '')}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            {Object.entries(PAYMENT_METHOD).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
          Descripción <span className="normal-case">(opcional)</span>
        </span>
        <input
          className="field"
          style={{ fontSize: 14, padding: '11px 13px' }}
          value={description}
          maxLength={200}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
          Notas <span className="normal-case">(opcional)</span>
        </span>
        <textarea
          className="field"
          style={{ fontSize: 14, padding: '11px 13px', minHeight: 72, resize: 'vertical' }}
          value={notes}
          maxLength={1000}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {mutation.error && (
        <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
          {mutation.error instanceof ApiError ? mutation.error.message : 'No se pudo guardar el movimiento.'}
        </p>
      )}

      <Button full onClick={() => void submit()} loading={mutation.isPending} icon="check">
        {editing ? 'Guardar cambios' : 'Guardar movimiento'}
      </Button>
    </div>
  );
}

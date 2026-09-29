/**
 * Registro rapido de gasto.
 *
 * Es la pantalla mas usada del producto: anotar una Monster de L85 debe costar
 * segundos. De ahi las decisiones:
 *
 *  - Solo tres datos obligatorios (monto, categoria, cuenta). Todo lo demas
 *    tiene un valor por defecto razonable y se puede ignorar.
 *  - El monto se enfoca solo al abrir: el teclado numerico aparece sin tocar
 *    nada mas.
 *  - La cuenta viene preseleccionada con la ultima usada en este navegador.
 *  - "Guardar y otro" existe porque los gastos hormiga se anotan en rafaga
 *    (tres cafes de la semana de una sentada), y volver a abrir el panel tres
 *    veces era el motivo real para no anotarlos.
 *
 * Para un ingreso o una transferencia se salta al formulario completo: meter
 * los tres tipos aqui devolveria el formulario de quince campos que este panel
 * existe para evitar.
 */
import { useEffect, useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { ApiError } from '@/core/lib/api';
import { toNumber } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import { todayIso } from '@/core/lib/dates';
import { defaultPaymentMethod, preferredAccountId, rememberAccount } from '@/domains/finance/shared/accounts';
import { useAccounts, useFinanceOverview, useQuickExpense } from '@/domains/finance/shared/api';
import { AmountInput } from './AmountInput';
import { AccountPicker } from './AccountPicker';
import { CategoryPicker } from './CategoryPicker';
import { DatePicker } from './DatePicker';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Cambia al formulario completo (ingresos y transferencias). */
  onSwitchToFull: () => void;
}

export function QuickExpenseSheet({ open, onClose, onSwitchToFull }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Registrar gasto" subtitle="Monto, categoría y cuenta. Nada más.">
      <QuickExpenseForm onDone={onClose} onSwitchToFull={onSwitchToFull} />
    </Sheet>
  );
}

/** Separado del panel para que los hooks solo corran cuando esta abierto. */
function QuickExpenseForm({ onDone, onSwitchToFull }: { onDone: () => void; onSwitchToFull: () => void }) {
  const accounts = useAccounts();
  const overview = useFinanceOverview();
  const quick = useQuickExpense();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(todayIso);
  const [description, setDescription] = useState('');
  /** `null` = lo decide el umbral del usuario; true/false = decision explicita. */
  const [micro, setMicro] = useState<boolean | null>(null);
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const list = accounts.data?.accounts ?? [];

  // La cuenta por defecto solo se fija una vez, cuando llega la lista: volver a
  // calcularla pisaria la eleccion del usuario en cada refetch.
  useEffect(() => {
    if (!accountId && list.length > 0) setAccountId(preferredAccountId(list));
  }, [list, accountId]);

  const threshold = overview.data?.microExpenses.threshold;
  const value = toNumber(amount);
  const autoMicro = threshold !== undefined && value > 0 && value < toNumber(threshold);
  const isMicro = micro ?? autoMicro;

  const errors = {
    amount: touched && value <= 0 ? 'Escribe cuánto gastaste.' : undefined,
    categoryId: touched && !categoryId ? 'Elige una categoría.' : undefined,
    accountId: touched && !accountId ? 'Elige de dónde salió el dinero.' : undefined,
  };
  const valid = value > 0 && Boolean(categoryId) && Boolean(accountId);

  function reset(keepContext: boolean) {
    setAmount('');
    setDescription('');
    setMicro(null);
    setTouched(false);
    if (!keepContext) {
      setCategoryId('');
      setDate(todayIso());
    }
  }

  async function submit(andAnother: boolean) {
    setTouched(true);
    if (!valid) return;

    const account = list.find((a) => a.id === accountId);

    await quick.mutateAsync({
      amount,
      categoryId,
      fromAccountId: accountId,
      date,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(account ? { paymentMethod: defaultPaymentMethod(account.type) } : {}),
      // Solo se manda si el usuario lo decidio: sin esto se le quitaria al
      // backend la posibilidad de aplicar el umbral.
      ...(micro !== null ? { isMicroExpense: micro } : {}),
    });

    rememberAccount(accountId);

    if (andAnother) {
      setSaved(money(amount));
      reset(true);
    } else {
      reset(false);
      onDone();
    }
  }

  return (
    <div className="space-y-4">
      {saved && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 text-[13px]"
          style={{
            background: 'color-mix(in oklab, var(--good) 12%, transparent)',
            color: 'var(--good)',
            borderRadius: 'var(--radius-sm)',
          }}
          role="status"
        >
          <Icon name="check" size={15} strokeWidth={2.4} />
          Guardado {saved}. Anota el siguiente.
        </div>
      )}

      <AmountInput value={amount} onChange={setAmount} autoFocus error={errors.amount} />

      {/* Se avisa ANTES de guardar, no despues: así el usuario entiende de
          dónde sale la cifra de gastos hormiga del panel. */}
      {(isMicro || autoMicro) && (
        <button
          type="button"
          onClick={() => setMicro(!isMicro)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px]"
          style={{
            background: isMicro ? 'color-mix(in oklab, var(--cat-2) 12%, transparent)' : 'var(--surface-2)',
            color: isMicro ? 'var(--cat-2)' : 'var(--ink-muted)',
            borderRadius: 'var(--radius-sm)',
          }}
          aria-pressed={isMicro}
        >
          <Icon name="ant" size={15} strokeWidth={2} />
          {isMicro ? 'Cuenta como gasto hormiga' : 'No es gasto hormiga'}
          <span className="ml-auto text-[11px] underline">cambiar</span>
        </button>
      )}

      <CategoryPicker
        type="EXPENSE"
        value={categoryId}
        onChange={(id) => setCategoryId(id)}
        error={errors.categoryId}
      />

      {accounts.isLoading ? (
        <p className="text-[13px]" style={{ color: 'var(--ink-muted)' }}>Cargando cuentas…</p>
      ) : (
        <AccountPicker
          accounts={list}
          value={accountId}
          onChange={setAccountId}
          label="Sale de"
          error={errors.accountId}
        />
      )}

      <DatePicker value={date} onChange={setDate} />

      <label className="block">
        <span className="label-deco mb-1.5 block text-[9px]" style={{ color: 'var(--ink-muted)' }}>
          Descripción <span className="normal-case">(opcional)</span>
        </span>
        <input
          className="field"
          style={{ fontSize: 14, padding: '11px 13px' }}
          placeholder="Monster, almuerzo, taxi…"
          value={description}
          maxLength={200}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      {quick.error && (
        <p role="alert" className="text-[12px]" style={{ color: 'var(--critical)' }}>
          {quick.error instanceof ApiError ? quick.error.message : 'No se pudo guardar el gasto.'}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <Button full onClick={() => void submit(false)} loading={quick.isPending} icon="check">
          Guardar {value > 0 ? money(amount) : ''}
        </Button>
        <Button variant="ghost" full onClick={() => void submit(true)} disabled={quick.isPending} icon="plus">
          Guardar y otro
        </Button>
        {/* El atajo al formulario completo va como enlace, no como botón: este
            panel es para gastos, y darle el mismo peso visual que a guardar
            invitaba a tomar el camino largo sin necesitarlo. */}
        <button
          type="button"
          onClick={onSwitchToFull}
          className="mx-auto flex items-center gap-1.5 py-1 text-[12px] font-semibold"
          style={{ color: 'var(--ink-2)' }}
        >
          <Icon name="repeat" size={14} strokeWidth={2} />
          ¿Es un ingreso o un traslado?
        </button>
      </div>
    </div>
  );
}

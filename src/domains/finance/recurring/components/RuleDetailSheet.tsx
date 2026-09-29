/**
 * Detalle de una recurrencia: lo que cuesta, cuando toca y como se apaga.
 *
 * Cancelar y eliminar son cosas distintas y se explican antes de pulsar:
 * cancelar conserva el historico de lo que ya te costo; eliminar solo es
 * posible si nunca genero nada.
 */
import { useState } from 'react';
import { Sheet } from '@/core/components/ui/Sheet';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { ApiError } from '@/core/lib/api';
import { shortDate } from '@/core/lib/format';
import { money } from '@/domains/finance/shared/money';
import { useCancelRule, useDeleteRule, useResumeRule } from '@/domains/finance/shared/api';
import type { RecurringRule } from '@/domains/finance/shared/types/recurring';
import { KIND, frequencyLabel } from '../labels';

interface Props {
  rule: RecurringRule | null;
  onClose: () => void;
  onEdit: (rule: RecurringRule) => void;
}

export function RuleDetailSheet({ rule, onClose, onEdit }: Props) {
  const cancel = useCancelRule();
  const resume = useResumeRule();
  const remove = useDeleteRule();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<'cancel' | 'delete' | null>(null);

  if (!rule) return null;

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo completar la acción.');
      setConfirming(null);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={rule.name}
      subtitle={`${KIND[rule.kind].label} · ${frequencyLabel(rule.frequency, rule.interval)}`}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" icon="pencil" onClick={() => onEdit(rule)}>Editar</Button>
          {rule.isActive ? (
            <Button
              variant="danger"
              full
              loading={cancel.isPending}
              onClick={() => (confirming === 'cancel' ? void run(() => cancel.mutateAsync({ id: rule.id })) : setConfirming('cancel'))}
            >
              {confirming === 'cancel' ? '¿Seguro? Cancelar' : 'Cancelar'}
            </Button>
          ) : (
            <Button full loading={resume.isPending} onClick={() => void run(() => resume.mutateAsync(rule.id))}>
              Reactivar
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2.5">
          <Fact label="Monto" value={rule.amount ? money(rule.amount) : 'Variable'} />
          <Fact label="Al mes" value={money(rule.monthlyEquivalent)} />
          <Fact label="Al año" value={money(Number(rule.monthlyEquivalent) * 12)} />
          <Fact
            label={rule.isActive ? 'Próxima' : 'Cancelada'}
            value={rule.isActive ? shortDate(rule.nextRunDate) : shortDate(rule.cancelAtDate ?? rule.nextRunDate)}
          />
        </div>

        <ul className="space-y-1.5 text-[12px]" style={{ color: 'var(--ink-2)' }}>
          <Line icon="list" text={rule.category ? rule.category.name : 'Sin categoría'} />
          <Line icon="wallet" text={rule.fromAccount?.name ?? rule.toAccount?.name ?? 'Sin cuenta'} />
          <Line
            icon="repeat"
            text={rule.autoGenerate
              ? 'Se registra solo al vencer'
              : 'Espera tu confirmación al vencer'}
          />
          {rule.lastRunDate && <Line icon="check" text={`Último registro: ${shortDate(rule.lastRunDate)}`} />}
        </ul>

        {rule.isActive && (
          <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            Cancelar deja de generar movimientos, pero conserva el historial de lo que ya te costó.
          </p>
        )}

        {!rule.isActive && (
          <div className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
            <button
              type="button"
              className="chip"
              onClick={() => (confirming === 'delete' ? void run(() => remove.mutateAsync(rule.id)) : setConfirming('delete'))}
            >
              <Icon name="trash" size={14} strokeWidth={2.2} />
              {confirming === 'delete' ? '¿Seguro? Eliminar' : 'Eliminar del todo'}
            </button>
            <p className="mt-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              Solo se puede si nunca generó movimientos.
            </p>
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
      <div className="label-deco text-[9px]" style={{ color: 'var(--ink-muted)' }}>{label}</div>
      <div className="figure tabular mt-1 text-base leading-none">{value}</div>
    </div>
  );
}

function Line({ icon, text }: { icon: 'list' | 'wallet' | 'repeat' | 'check'; text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Icon name={icon} size={14} strokeWidth={2} />
      {text}
    </li>
  );
}

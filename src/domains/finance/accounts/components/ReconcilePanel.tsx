/**
 * Reconciliacion de saldos.
 *
 * Compara el saldo guardado de cada cuenta contra el que sale de sumar sus
 * movimientos. En condiciones normales coinciden: el saldo se mueve dentro de
 * la misma transaccion de base de datos que el movimiento.
 *
 * Existe igual porque una app de dinero necesita poder DEMOSTRAR que cuadra.
 * Primero se revisa sin tocar nada (`apply=false`) y solo despues, con la
 * diferencia a la vista, el usuario decide si corregir. Ajustar saldos en
 * silencio es exactamente lo que haria desconfiar de las cifras del panel.
 */
import { useState } from 'react';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Icon } from '@/core/components/ui/Icon';
import { ApiError } from '@/core/lib/api';
import { money } from '@/domains/finance/shared/money';
import { useReconcileAccounts } from '@/domains/finance/shared/api';

export function ReconcilePanel() {
  // Cual de los dos botones esta en curso: los dos usan la misma mutacion y sin
  // esto el indicador de "cargando" aparecia en ambos a la vez.
  const [running, setRunning] = useState<'check' | 'fix' | null>(null);
  const reconcile = useReconcileAccounts();

  const run = (apply: boolean) => {
    setRunning(apply ? 'fix' : 'check');
    reconcile.mutate(apply, { onSettled: () => setRunning(null) });
  };
  const report = reconcile.data;
  const drifted = report?.results.filter((r) => r.drift !== '0') ?? [];

  return (
    <Card>
      <CardTitle>Cuadre de saldos</CardTitle>

      <p className="text-[13px]" style={{ color: 'var(--ink-2)' }}>
        Comprueba que el saldo de cada cuenta coincida con la suma de sus movimientos.
      </p>

      {reconcile.error && (
        <p role="alert" className="mt-3 text-[12px]" style={{ color: 'var(--critical)' }}>
          {reconcile.error instanceof ApiError ? reconcile.error.message : 'No se pudo revisar.'}
        </p>
      )}

      {report && (
        <div className="mt-3">
          {report.withDrift === 0 ? (
            <p className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--good)' }}>
              <Icon name="check" size={16} strokeWidth={2.4} />
              {report.checked} cuenta{report.checked === 1 ? '' : 's'} revisada
              {report.checked === 1 ? '' : 's'}: todo cuadra.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--warning)' }}>
                <Icon name="alert" size={16} strokeWidth={2.2} />
                {report.withDrift} cuenta{report.withDrift === 1 ? '' : 's'} con diferencia.
              </p>
              <ul className="divide-y text-[12px]" style={{ borderColor: 'var(--line)' }}>
                {drifted.map((r) => (
                  <li key={r.accountId} className="flex items-center justify-between gap-3 py-2" style={{ borderColor: 'var(--line)' }}>
                    <span className="truncate">{r.accountName}</span>
                    <span className="tabular shrink-0 text-right">
                      <span style={{ color: 'var(--ink-muted)' }}>
                        {money(r.storedBalance, { compact: true })} →{' '}
                      </span>
                      <span style={{ color: 'var(--warning)' }}>
                        {money(r.computedBalance, { compact: true })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2">
        <Button
          variant="ghost"
          icon="scale"
          loading={running === 'check'}
          onClick={() => run(false)}
        >
          Revisar
        </Button>
        {report && report.withDrift > 0 && (
          <Button
            icon="check"
            loading={running === 'fix'}
            onClick={() => run(true)}
          >
            Corregir saldos
          </Button>
        )}
      </div>
    </Card>
  );
}

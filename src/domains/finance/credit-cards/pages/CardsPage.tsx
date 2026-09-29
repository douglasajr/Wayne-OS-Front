/**
 * Tarjetas de credito.
 *
 * Una tarjeta plantea dos preguntas distintas y la pantalla las separa:
 *   1. ¿cuanto y cuando pago?  -> el corte cerrado
 *   2. ¿cuanto llevo comprometido? -> el limite usado y las cuotas
 *
 * El saldo total NO es la respuesta a ninguna de las dos, por eso no es el
 * numero grande.
 */
import { useState } from 'react';
import { Card } from '@/core/components/ui/Card';
import { Button } from '@/core/components/ui/Button';
import { Skeleton } from '@/core/components/ui/Skeleton';
import { EmptyState } from '@/core/components/ui/EmptyState';
import { Icon } from '@/core/components/ui/Icon';
import { ApiError } from '@/core/lib/api';
import { useCards } from '@/domains/finance/shared/api';
import type { CreditCard } from '@/domains/finance/shared/types/cards';
import { CardStatementCard } from '../components/CardStatementCard';
import { InstallmentPlans } from '../components/InstallmentPlans';
import { PayCardSheet } from '../components/PayCardSheet';

export function CardsPage() {
  const query = useCards();
  const [paying, setPaying] = useState<CreditCard | null>(null);

  if (query.isLoading) {
    return (
      <div className="space-y-3.5">
        <Skeleton height={280} />
        <Skeleton height={160} />
      </div>
    );
  }

  if (query.error) {
    return (
      <Card className="mt-6 text-center">
        <p role="alert" className="text-sm" style={{ color: 'var(--critical)' }}>
          {query.error instanceof ApiError ? query.error.message : 'No se pudieron cargar las tarjetas.'}
        </p>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        </div>
      </Card>
    );
  }

  const cards = query.data ?? [];

  if (cards.length === 0) {
    return (
      <Card className="mt-6">
        <EmptyState
          icon="card"
          title="Sin tarjetas de crédito"
          description="Agrega una en Cuentas, con su límite y sus días de corte y pago. Sin esos dos días no hay forma de saber cuánto te toca pagar ni cuándo."
          action={
            <a href="/finanzas/cuentas" className="chip">
              <Icon name="wallet" size={15} strokeWidth={2} />
              Ir a Cuentas
            </a>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3.5 lg:space-y-4">
      {cards.map((card) => (
        <div key={card.id} className="space-y-3.5 lg:space-y-4">
          <CardStatementCard card={card} onPay={setPaying} />
          <InstallmentPlans plans={card.installmentPlans} pending={card.pendingInstallments} />
        </div>
      ))}

      <p className="px-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
        Pagar la tarjeta no es un gasto: el gasto ocurrió en la compra. Por eso un pago nunca
        aparece en el gasto por categoría ni consume presupuesto.
      </p>

      <PayCardSheet card={paying} onClose={() => setPaying(null)} />
    </div>
  );
}

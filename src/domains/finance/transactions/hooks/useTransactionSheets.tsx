/**
 * Los paneles de registro viven una sola vez, por encima de las rutas.
 *
 * Se abren desde sitios muy distintos —el boton central de la barra inferior,
 * el vacio de la lista de movimientos, un atajo del panel—, y montar una copia
 * en cada pantalla significaria que el estado del formulario se pierde al
 * navegar y que el panel se cierra solo al cambiar de ruta.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Transaction, TransactionType } from '@/domains/finance/shared/types/domain';
import { QuickExpenseSheet } from '../components/QuickExpenseSheet';
import { TransactionSheet } from '../components/TransactionSheet';

interface SheetsContextValue {
  /** Panel corto: solo gasto. Es el camino por defecto. */
  openQuick: () => void;
  /** Formulario completo, para ingresos y traslados. */
  openFull: (type?: TransactionType) => void;
  /** El mismo formulario, cargado con un movimiento ya registrado. */
  openEdit: (transaction: Transaction) => void;
}

const SheetsContext = createContext<SheetsContextValue | null>(null);

export function TransactionSheetsProvider({ children }: { children: ReactNode }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [fullType, setFullType] = useState<TransactionType | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const openQuick = useCallback(() => {
    setFullType(null);
    setEditing(null);
    setQuickOpen(true);
  }, []);

  const openFull = useCallback((type: TransactionType = 'EXPENSE') => {
    setQuickOpen(false);
    setEditing(null);
    setFullType(type);
  }, []);

  const openEdit = useCallback((transaction: Transaction) => {
    setQuickOpen(false);
    setEditing(transaction);
    setFullType(transaction.type);
  }, []);

  const closeFull = useCallback(() => {
    setFullType(null);
    setEditing(null);
  }, []);

  const value = useMemo(() => ({ openQuick, openFull, openEdit }), [openQuick, openFull, openEdit]);

  return (
    <SheetsContext.Provider value={value}>
      {children}
      <QuickExpenseSheet
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onSwitchToFull={() => openFull('TRANSFER')}
      />
      <TransactionSheet
        open={fullType !== null}
        onClose={closeFull}
        initialType={fullType ?? 'EXPENSE'}
        editing={editing}
      />
    </SheetsContext.Provider>
  );
}

export function useTransactionSheets(): SheetsContextValue {
  const ctx = useContext(SheetsContext);
  if (!ctx) throw new Error('useTransactionSheets debe usarse dentro de TransactionSheetsProvider');
  return ctx;
}

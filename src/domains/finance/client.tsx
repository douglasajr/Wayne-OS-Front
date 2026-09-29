/**
 * La superficie COMPLETA de Finance frente al armazón.
 *
 * Es el gemelo de `domains/finance/index.ts` en el backend: lo único que
 * `src/domains/index.ts` conoce del dominio. Todo lo demás —pantallas,
 * componentes, cliente de API— es asunto interno de esta carpeta.
 *
 * Aquí viven también las rutas, con su carga diferida. Antes estaban escritas a
 * mano en `routes/index.tsx`, así que agregar una pantalla —o un dominio
 * entero— obligaba a editar un archivo del armazón.
 */
import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import type { DomainClient } from '../types';
import { FINANCE_BASE, FINANCE_NAV } from './navigation';
import { FinanceSection } from './overview/components/FinanceSection';

// Las tarjetas de Ajustes también van diferidas: este archivo lo importa el
// catálogo, que importa la navegación, que está en el paquete inicial. Sin
// esto, el plan financiero y sus formularios viajarían en el primer arranque
// para una pantalla que casi nunca se abre.
const FinanceSettingsCards = lazy(() =>
  import('./settings/components/FinanceSettingsCards').then((m) => ({
    default: m.FinanceSettingsCards,
  })),
);

// `lazy` necesita exportación por defecto y estos módulos exportan con nombre.
const CategoriesPage = lazy(() =>
  import('./settings/pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
);
const TransactionsPage = lazy(() =>
  import('./transactions/pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })),
);
const AccountsPage = lazy(() =>
  import('./accounts/pages/AccountsPage').then((m) => ({ default: m.AccountsPage })),
);
const BudgetPage = lazy(() =>
  import('./budgets/pages/BudgetPage').then((m) => ({ default: m.BudgetPage })),
);
const RecurringPage = lazy(() =>
  import('./recurring/pages/RecurringPage').then((m) => ({ default: m.RecurringPage })),
);
const CardsPage = lazy(() =>
  import('./credit-cards/pages/CardsPage').then((m) => ({ default: m.CardsPage })),
);
const SavingsPage = lazy(() =>
  import('./savings/pages/SavingsPage').then((m) => ({ default: m.SavingsPage })),
);
const ReportsPage = lazy(() =>
  import('./reports/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const InvestmentsPage = lazy(() =>
  import('./investments/pages/InvestmentsPage').then((m) => ({ default: m.InvestmentsPage })),
);

export const financeClient: DomainClient = {
  id: 'finance',
  nav: FINANCE_NAV,

  // Cómo se pinta la sección que el backend aporta al Command Center.
  section: { icon: 'wallet', component: FinanceSection },

  // Lo que el dominio añade a la pantalla de Ajustes.
  settingsCards: [FinanceSettingsCards],

  routes: [
    <Route key="raiz" path={FINANCE_BASE} element={<Navigate to={`${FINANCE_BASE}/presupuesto`} replace />} />,
    <Route key="movimientos" path={`${FINANCE_BASE}/movimientos`} element={<TransactionsPage />} />,
    <Route key="cuentas" path={`${FINANCE_BASE}/cuentas`} element={<AccountsPage />} />,
    <Route key="presupuesto" path={`${FINANCE_BASE}/presupuesto`} element={<BudgetPage />} />,
    <Route key="categorias" path={`${FINANCE_BASE}/categorias`} element={<CategoriesPage />} />,
    <Route key="reportes" path={`${FINANCE_BASE}/reportes`} element={<ReportsPage />} />,
    <Route key="inversiones" path={`${FINANCE_BASE}/inversiones`} element={<InvestmentsPage />} />,
    <Route key="tarjetas" path={`${FINANCE_BASE}/tarjetas`} element={<CardsPage />} />,
    <Route key="suscripciones" path={`${FINANCE_BASE}/suscripciones`} element={<RecurringPage />} />,
    <Route key="ahorro" path={`${FINANCE_BASE}/ahorro`} element={<SavingsPage />} />,
  ],

  /** Rutas planas de antes de la Fase 5.5: los marcadores siguen funcionando. */
  legacyRedirects: {
    '/movimientos': `${FINANCE_BASE}/movimientos`,
    '/cuentas': `${FINANCE_BASE}/cuentas`,
    '/presupuesto': `${FINANCE_BASE}/presupuesto`,
    '/reportes': `${FINANCE_BASE}/reportes`,
    '/tarjetas': `${FINANCE_BASE}/tarjetas`,
    '/suscripciones': `${FINANCE_BASE}/suscripciones`,
    '/ahorro': `${FINANCE_BASE}/ahorro`,
    '/ajustes/categorias': `${FINANCE_BASE}/categorias`,
  },
};

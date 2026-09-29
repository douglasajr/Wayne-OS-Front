/**
 * El acceso a los catálogos editables de Finance.
 *
 * Vive en el dominio porque «categorías de gasto» no significa nada fuera de
 * él. Antes era una tarjeta escrita dentro de la pantalla de Ajustes, con la
 * ruta `/finanzas/categorias` incrustada en un archivo del armazón.
 */
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/core/components/ui/Card';
import { Icon } from '@/core/components/ui/Icon';
import { FINANCE_BASE } from '@/domains/finance/navigation';

export function CatalogsCard() {
  return (
    <Card edge>
      <CardTitle>Catálogos</CardTitle>
      <Link
        to={`${FINANCE_BASE}/categorias`}
        className="flex items-center gap-3 border px-3.5 py-3.5"
        style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius-sm)' }}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center" style={{ color: 'var(--accent)' }}>
          <Icon name="list" size={18} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Categorías</span>
          <span className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
            Crear, renombrar, ocultar y ordenar
          </span>
        </span>
        <Icon name="chevron-right" size={16} strokeWidth={2.2} />
      </Link>
    </Card>
  );
}

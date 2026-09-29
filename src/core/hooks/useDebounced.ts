import { useEffect, useState } from 'react';

/**
 * Retrasa un valor. Se usa en la busqueda de movimientos: sin esto, escribir
 * "supermercado" dispara doce consultas y la lista parpadea en cada letra.
 */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

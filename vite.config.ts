/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/**
 * En Vercel el build FALLA si no hay una API https configurada. Sin esto,
 * `api.ts` caeria en su valor por defecto (localhost) y el despliegue saldria
 * "verde" con una app que no puede hablar con nadie. Solo se exige en Vercel
 * (que define VERCEL=1): el build local sigue usando el .env de desarrollo.
 */
function assertProductionApiUrl(mode: string): void {
  if (!process.env.VERCEL) return;
  const url = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL;
  if (!url || !url.startsWith('https://')) {
    throw new Error(
      `VITE_API_URL debe ser una URL https en Vercel (recibido: ${url ?? 'nada'}). ` +
        'Un frontend https no puede llamar a una API http: el navegador lo bloquea.',
    );
  }
}

export default defineConfig(({ mode }) => {
  assertProductionApiUrl(mode);
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    /**
     * Pruebas del cliente. Son PURAS a proposito: no montan el DOM ni levantan
     * el navegador, asi que corren en milisegundos y no necesitan ni servidor ni
     * base de datos. Cubren lo que se puede romper en silencio —formatos de
     * dinero y fecha, y el contrato del catalogo de dominios— que es justo donde
     * el typecheck no llega.
     */
    test: {
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
      environment: 'node',
    },

    server: {
      // Puerto propio de este proyecto: el 5173 por defecto lo ocupa otra app
      // local. `strictPort` evita que Vite se mueva en silencio a otro puerto y
      // el backend rechace el origen por CORS sin que se entienda por que.
      port: 5180,
      strictPort: true,
      // En desarrollo se llama al backend directo con VITE_API_URL. No se usa
      // proxy a proposito: en produccion (Vercel -> Dokploy) tampoco lo habra,
      // asi que conviene que CORS se ejercite igual en local que en produccion.
    },
  };
});

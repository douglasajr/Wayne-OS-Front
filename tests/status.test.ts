/**
 * El semáforo y la paleta de categorías.
 *
 * La regla del sistema de diseño es que **el color nunca comunica solo**: cada
 * estado viaja con icono y palabra, porque alguien con daltonismo rojo-verde
 * no distinguiría «en control» de «excedido». Esto lo verifica.
 *
 * Y `categoryColor` tiene una trampa fácil: si un token desconocido devolviera
 * la cadena tal cual, acabaría como `color: "cat-99"` en el CSS —inválido— y
 * el texto se vería del color heredado, que puede ser invisible sobre su
 * fondo. El fallback importa.
 */
import { describe, expect, it } from 'vitest';
import { STATUS, categoryColor } from '@/domains/finance/shared/status';
import type { BudgetStatus } from '@/domains/finance/shared/types/overview';

const TODOS: BudgetStatus[] = ['HEALTHY', 'WARNING', 'CRITICAL', 'EXCEEDED'];

describe('semáforo de presupuesto', () => {
  it('los cuatro estados llevan color, icono y palabra', () => {
    for (const status of TODOS) {
      const meta = STATUS[status];
      expect(meta, status).toBeDefined();
      expect(meta.label, `${status}.label`).toBeTruthy();
      expect(meta.icon, `${status}.icon`).toBeTruthy();
      expect(meta.color, `${status}.color`).toMatch(/^var\(--/);
    }
  });

  it('ningún estado se confunde con otro', () => {
    const etiquetas = TODOS.map((s) => STATUS[s].label);
    const iconos = TODOS.map((s) => STATUS[s].icon);
    expect(new Set(etiquetas).size).toBe(TODOS.length);
    expect(new Set(iconos).size).toBe(TODOS.length);
  });
});

describe('paleta de categorías', () => {
  it('traduce los tokens del catálogo a variables del tema', () => {
    expect(categoryColor('cat-1')).toBe('var(--cat-1)');
    expect(categoryColor('cat-8')).toBe('var(--cat-8)');
    expect(categoryColor('neutral')).toBe('var(--cat-neutral)');
    expect(categoryColor('income')).toBe('var(--cat-income)');
  });

  it('respeta un hex escrito a mano', () => {
    expect(categoryColor('#0EA5E9')).toBe('#0EA5E9');
  });

  it('cae en el color neutro cuando no reconoce el token', () => {
    // Nunca devuelve el token crudo: seria CSS invalido y texto invisible.
    expect(categoryColor(null)).toBe('var(--cat-neutral)');
    expect(categoryColor(undefined)).toBe('var(--cat-neutral)');
    expect(categoryColor('')).toBe('var(--cat-neutral)');
    expect(categoryColor('azulito')).toBe('var(--cat-neutral)');
  });
});

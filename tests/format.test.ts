/**
 * Formatos de dinero y fecha.
 *
 * Parecen triviales y son justo lo que se rompe en silencio: nadie escribe una
 * prueba para «poner una coma» y un día el patrimonio aparece como NaN o un
 * gasto del 18 sale fechado el 19.
 *
 * Los dos riesgos que se vigilan aquí son reales en este proyecto:
 *
 * 1. **Zona horaria.** En Honduras (UTC-6), construir la fecha con
 *    `toISOString()` corre el día hacia atrás: un gasto de las 7pm del 18 se
 *    guardaría como 19. Por eso todo se arma a mano desde los componentes
 *    locales, y eso hay que sostenerlo.
 * 2. **Dinero que llega como texto.** La regla 11 prohíbe el float: los montos
 *    viajan como string y solo se convierten a número en el último paso, el de
 *    mostrarlos. Un string raro no puede convertirse en «NaN» en pantalla.
 */
import { describe, expect, it } from 'vitest';
import { longDate, monthLabel, monthRange, previousMonthRange } from '@/core/lib/dates';
import { relativeDay, shortDate, toNumber } from '@/core/lib/format';
import { amount, money } from '@/domains/finance/shared/money';
import { shortMonth } from '@/domains/finance/reports/components/charts';

describe('dinero', () => {
  it('formatea con separador de miles y dos decimales', () => {
    expect(money('15000')).toBe('L 15,000.00');
    expect(money('1234.5')).toBe('L 1,234.50');
  });

  it('el signo va delante del símbolo, no del número', () => {
    // "-L 500.00", no "L -500.00": lo primero que se lee es que es negativo.
    expect(money('-500')).toBe('-L 500.00');
  });

  it('en modo compacto no arrastra decimales', () => {
    expect(money('15000', { compact: true })).toBe('L 15,000');
    expect(money('-2500.75', { compact: true })).toBe('-L 2,501');
  });

  it('un valor imposible no llega a pantalla como NaN', () => {
    expect(money('no es un número')).toBe('L 0.00');
    expect(money('')).toBe('L 0.00');
  });

  it('`amount` omite el símbolo, para cuando la etiqueta ya lo dice', () => {
    expect(amount('15000')).toBe('15,000.00');
    expect(amount('15000', true)).toBe('15,000');
  });

  it('toNumber nunca devuelve NaN', () => {
    expect(toNumber('1234.5')).toBe(1234.5);
    expect(toNumber('')).toBe(0);
    expect(toNumber('abc')).toBe(0);
    expect(toNumber(42)).toBe(42);
  });
});

describe('fechas', () => {
  it('el rango del mes no se sale del mes', () => {
    // Octubre tiene 31; febrero de un año bisiesto, 29.
    expect(monthRange(new Date(2026, 9, 15))).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(monthRange(new Date(2028, 1, 10))).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('el mes anterior cruza el año sin perderse', () => {
    expect(previousMonthRange(new Date(2026, 0, 5))).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    });
  });

  it('el último día del mes no se corre al siguiente', () => {
    // El caso que delata un `toISOString()` colado: 31 a las 00:00 locales.
    expect(monthRange(new Date(2026, 9, 31)).to).toBe('2026-10-31');
  });

  it('formatea fechas largas y de mes sin depender del navegador', () => {
    expect(longDate('2026-09-18')).toBe('18 de septiembre de 2026');
    expect(monthLabel('2026-09')).toBe('septiembre 2026');
    expect(monthLabel('2026-09-18')).toBe('septiembre 2026');
  });

  it('una fecha ilegible se devuelve tal cual en vez de inventar una', () => {
    expect(longDate('vaya fecha')).toBe('vaya fecha');
    expect(monthLabel('')).toBe('');
  });

  it('shortDate no antepone ceros al día', () => {
    expect(shortDate('2026-09-05')).toBe('5 sep');
    expect(shortDate('2026-12-31')).toBe('31 dic');
  });

  it('relativeDay reconoce hoy y ayer', () => {
    const d = (offset: number) => {
      const x = new Date();
      x.setDate(x.getDate() - offset);
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    };

    expect(relativeDay(d(0))).toBe('Hoy');
    expect(relativeDay(d(1))).toBe('Ayer');
    expect(relativeDay('2020-03-15')).toBe('15 mar');
  });

  it('el eje de las gráficas abrevia mes y año', () => {
    // "septiembre 2026" no cabe bajo una barra de 40px.
    expect(shortMonth('2026-09')).toBe('sep 26');
    expect(shortMonth('2026-01')).toBe('ene 26');
  });
});

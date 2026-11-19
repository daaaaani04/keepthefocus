import { describe, expect, it } from 'vitest';
import { multiplierForMinutes, pointsForMinutes } from './points';

describe('pointsForMinutes', () => {
  it('vale 0 senza minuti, con valori negativi', () => {
    expect(pointsForMinutes(0)).toBe(0);
    expect(pointsForMinutes(-5)).toBe(0);
  });

  it('prima fascia: 1 punto al minuto fino a 25', () => {
    expect(pointsForMinutes(1)).toBe(1);
    expect(pointsForMinutes(25)).toBe(25);
  });

  it('seconda fascia: 1,5 punti al minuto da 25 a 50', () => {
    expect(pointsForMinutes(26)).toBe(26); // 25 + 1.5 = 26.5 -> 26
    expect(pointsForMinutes(30)).toBe(32); // 25 + 7.5 = 32.5 -> 32
    expect(pointsForMinutes(50)).toBe(62); // 25 + 37.5 = 62.5 -> 62
  });

  it('terza fascia: 2 punti al minuto oltre 50', () => {
    expect(pointsForMinutes(51)).toBe(64); // 62.5 + 2 = 64.5 -> 64
    expect(pointsForMinutes(60)).toBe(82); // 62.5 + 20 = 82.5 -> 82
    expect(pointsForMinutes(120)).toBe(202);
  });

  it('ignora i decimali dei minuti', () => {
    expect(pointsForMinutes(10.9)).toBe(10);
  });

  it('non diminuisce mai al crescere dei minuti', () => {
    let prev = 0;
    for (let m = 0; m <= 240; m++) {
      const p = pointsForMinutes(m);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });
});

describe('multiplierForMinutes', () => {
  it('cambia moltiplicatore a 25 e a 50 minuti', () => {
    expect(multiplierForMinutes(0)).toBe(1);
    expect(multiplierForMinutes(24)).toBe(1);
    expect(multiplierForMinutes(25)).toBe(1.5);
    expect(multiplierForMinutes(49)).toBe(1.5);
    expect(multiplierForMinutes(50)).toBe(2);
    expect(multiplierForMinutes(300)).toBe(2);
  });
});

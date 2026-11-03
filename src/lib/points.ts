// Punti in base ai minuti di studio senza interruzioni.
// Deve restare identica alla funzione SQL public.points_for_minutes.
//   0-25 min  -> 1 punto al minuto
//   25-50 min -> 1,5 punti al minuto
//   oltre 50  -> 2 punti al minuto
export function pointsForMinutes(minutes: number): number {
  const m = Math.max(0, Math.floor(minutes));
  const tier1 = Math.min(m, 25);
  const tier2 = Math.min(Math.max(m - 25, 0), 25);
  const tier3 = Math.max(m - 50, 0);
  return Math.floor(tier1 + tier2 * 1.5 + tier3 * 2);
}

export function multiplierForMinutes(minutes: number): number {
  if (minutes >= 50) return 2;
  if (minutes >= 25) return 1.5;
  return 1;
}

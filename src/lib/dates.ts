// Tutte le date dell'app sono "giorni" nel fuso Europe/Rome, come la vista SQL daily_points.
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' });

export function romeDay(date: Date = new Date()): string {
  return fmt.format(date); // YYYY-MM-DD
}

function addDays(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// Gli ultimi n giorni, dal più vecchio a oggi.
export function lastDays(n: number, today = romeDay()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

// Lunedì della settimana corrente.
export function startOfWeek(today = romeDay()): string {
  const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = lunedì
  return addDays(today, -weekday);
}

// Giorni consecutivi con almeno un minuto di studio, contando fino a oggi.
// Se oggi non hai ancora studiato la serie resta viva da ieri, come su Duolingo.
export function streak(studyDays: Set<string>, today = romeDay()): number {
  let day = studyDays.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (studyDays.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

export function weekdayLabel(day: string): string {
  return ['D', 'L', 'M', 'M', 'G', 'V', 'S'][new Date(`${day}T12:00:00Z`).getUTCDay()];
}

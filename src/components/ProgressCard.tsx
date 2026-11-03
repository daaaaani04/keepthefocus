import { StyleSheet, Text, View } from 'react-native';
import type { DailyPoints } from '../lib/api';
import { lastDays, romeDay, streak, weekdayLabel } from '../lib/dates';
import { colors } from '../lib/theme';
import { Card } from './ui';

// Andamento personale: serie di giorni consecutivi e punti degli ultimi 7 giorni.
export function ProgressCard({ days, livePoints }: { days: DailyPoints[]; livePoints: number }) {
  const today = romeDay();
  const byDay = new Map(days.map((d) => [d.day, d.points]));
  const week = lastDays(7, today).map((day) => ({
    day,
    points: (byDay.get(day) ?? 0) + (day === today ? livePoints : 0),
  }));
  const studied = new Set(days.filter((d) => d.minutes > 0).map((d) => d.day));
  if (livePoints > 0) studied.add(today);
  const currentStreak = streak(studied, today);
  const max = Math.max(10, ...week.map((w) => w.points));
  const total = week.reduce((s, w) => s + w.points, 0);

  return (
    <Card>
      <Text style={styles.heading}>Il tuo andamento</Text>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.big}>🔥 {currentStreak}</Text>
          <Text style={styles.small}>{currentStreak === 1 ? 'giorno di fila' : 'giorni di fila'}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.big, { color: colors.accent }]}>{total}</Text>
          <Text style={styles.small}>punti negli ultimi 7 giorni</Text>
        </View>
      </View>
      <View style={styles.chart}>
        {week.map((w) => (
          <View key={w.day} style={styles.barCol}>
            <Text style={styles.barValue}>{w.points > 0 ? w.points : ''}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: `${(w.points / max) * 100}%`, backgroundColor: w.day === today ? colors.primary : '#A8D5B5' },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, w.day === today && styles.today]}>{weekdayLabel(w.day)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, alignItems: 'center', backgroundColor: colors.bg, borderRadius: 12, paddingVertical: 12 },
  big: { fontSize: 26, fontWeight: '800', color: colors.text },
  small: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  chart: { flexDirection: 'row', height: 140, gap: 8, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barValue: { fontSize: 11, color: colors.muted, height: 16 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: colors.bg, borderRadius: 8, overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 8, minHeight: 2 },
  barLabel: { fontSize: 13, color: colors.muted, marginTop: 6, fontWeight: '600' },
  today: { color: colors.primaryDark, fontWeight: '800' },
});

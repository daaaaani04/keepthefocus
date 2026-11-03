import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Circle, DailyPoints, Member, StudySession } from '../lib/api';
import { romeDay, startOfWeek, streak } from '../lib/dates';
import { pointsForMinutes } from '../lib/points';
import { minutesSince, useNow } from '../lib/useLiveMinutes';
import { colors } from '../lib/theme';
import { Card } from './ui';

type Row = {
  member: Member;
  weekPoints: number;
  todayPoints: number;
  streak: number;
  runningMinutes: number | null;
};

const medals = ['🥇', '🥈', '🥉'];

// Classifica settimanale del cerchio, con chi sta studiando in questo momento.
export function LeaderboardCard({
  circles,
  selectedId,
  onSelect,
  members,
  running,
  days,
  myId,
}: {
  circles: Circle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  members: Member[];
  running: StudySession[];
  days: DailyPoints[];
  myId: string;
}) {
  const now = useNow(running.length > 0);
  if (circles.length === 0) return null;

  const today = romeDay();
  const weekStart = startOfWeek(today);
  const rows: Row[] = members.map((member) => {
    const mine = days.filter((d) => d.user_id === member.id);
    const session = running.find((s) => s.user_id === member.id);
    const runningMinutes = session ? minutesSince(session.started_at, now) : null;
    const live = runningMinutes !== null ? pointsForMinutes(runningMinutes) : 0;
    const studied = new Set(mine.filter((d) => d.minutes > 0).map((d) => d.day));
    if (runningMinutes !== null) studied.add(today);
    return {
      member,
      weekPoints: mine.filter((d) => d.day >= weekStart).reduce((s, d) => s + d.points, 0) + live,
      todayPoints: (mine.find((d) => d.day === today)?.points ?? 0) + live,
      streak: streak(studied, today),
      runningMinutes,
    };
  });
  rows.sort((a, b) => b.weekPoints - a.weekPoints || a.member.username.localeCompare(b.member.username));
  const studyingNow = rows.filter((r) => r.runningMinutes !== null).length;

  return (
    <Card>
      <Text style={styles.heading}>Classifica della settimana</Text>
      {circles.length > 1 && (
        <View style={styles.tabs}>
          {circles.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => onSelect(c.id)}
              style={[styles.tab, c.id === selectedId && styles.tabActive]}
            >
              <Text style={[styles.tabText, c.id === selectedId && styles.tabTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={styles.muted}>
        {studyingNow === 0 ? 'Nessuno sta studiando ora' : `${studyingNow} ${studyingNow === 1 ? 'persona sta' : 'persone stanno'} studiando ora`}
      </Text>
      {rows.map((r, i) => (
        <View key={r.member.id} style={[styles.row, r.member.id === myId && styles.me]}>
          <Text style={styles.rank}>{medals[i] ?? `${i + 1}.`}</Text>
          <View style={styles.flex}>
            <Text style={styles.name}>
              {r.member.username}
              {r.member.id === myId ? ' (tu)' : ''}
            </Text>
            <Text style={styles.sub}>
              {r.runningMinutes !== null ? (
                <Text style={styles.live}>● studia da {r.runningMinutes} min</Text>
              ) : (
                `oggi ${r.todayPoints} punti`
              )}
              {r.streak > 0 ? `  ·  🔥 ${r.streak}` : ''}
            </Text>
          </View>
          <Text style={styles.points}>{r.weekPoints}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 14 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.text, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12 },
  me: { backgroundColor: '#EEF7F0' },
  rank: { fontSize: 20, width: 32, textAlign: 'center', color: colors.muted, fontWeight: '700' },
  flex: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  live: { color: colors.primary, fontWeight: '700' },
  points: { fontSize: 18, fontWeight: '800', color: colors.accent },
});

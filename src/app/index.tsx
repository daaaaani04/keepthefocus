import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthScreen } from '../components/AuthScreen';
import { CirclesCard } from '../components/CirclesCard';
import { LeaderboardCard } from '../components/LeaderboardCard';
import { ProgressCard } from '../components/ProgressCard';
import { TimerCard } from '../components/TimerCard';
import {
  getCircleMembers,
  getDailyPoints,
  getMyCircles,
  getMyProfile,
  getRunningSession,
  getRunningSessions,
  type Circle,
  type DailyPoints,
  type Member,
  type Profile,
  type StudySession,
} from '../lib/api';
import { lastDays, romeDay } from '../lib/dates';
import { pointsForMinutes } from '../lib/points';
import { minutesSince, useNow } from '../lib/useLiveMinutes';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { colors } from '../lib/theme';

export default function Index() {
  const { session, loading } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <Centered>
        <Text style={styles.title}>Keep the Focus</Text>
        <Text style={styles.muted}>Manca il file .env con le chiavi Supabase (vedi README).</Text>
      </Centered>
    );
  }
  if (loading) {
    return (
      <Centered>
        <ActivityIndicator color={colors.primary} />
      </Centered>
    );
  }
  return (
    <SafeAreaView style={styles.safe}>{session ? <Home userId={session.user.id} /> : <AuthScreen />}</SafeAreaView>
  );
}

// Giorni di storico caricati: bastano per la settimana e per serie fino a 60 giorni.
const HISTORY_DAYS = 60;

function Home({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);
  const [running, setRunning] = useState<StudySession | null>(null);
  const [myDays, setMyDays] = useState<DailyPoints[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [circleRunning, setCircleRunning] = useState<StudySession[]>([]);
  const [circleDays, setCircleDays] = useState<DailyPoints[]>([]);
  const [error, setError] = useState<string | null>(null);

  const since = lastDays(HISTORY_DAYS)[0];
  const circleId = selectedCircle ?? circles[0]?.id ?? null;

  const refreshMine = useCallback(async () => {
    try {
      const [p, c, r, d] = await Promise.all([
        getMyProfile(userId),
        getMyCircles(),
        getRunningSession(userId),
        getDailyPoints([userId], since),
      ]);
      setProfile(p);
      setCircles(c);
      setRunning(r);
      setMyDays(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [userId, since]);

  const refreshCircle = useCallback(async () => {
    if (!circleId) return;
    try {
      const m = await getCircleMembers(circleId);
      const ids = m.map((x) => x.id);
      const [r, d] = await Promise.all([getRunningSessions(ids), getDailyPoints(ids, since)]);
      setMembers(m);
      setCircleRunning(r);
      setCircleDays(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [circleId, since]);

  const refreshAll = useCallback(() => {
    refreshMine();
    refreshCircle();
  }, [refreshMine, refreshCircle]);

  useEffect(() => {
    refreshMine();
  }, [refreshMine]);
  useEffect(() => {
    refreshCircle();
  }, [refreshCircle]);

  // Tempo reale: quando qualcuno nel cerchio avvia o ferma il timer, aggiorna tutto.
  useEffect(() => {
    const channel = supabase
      .channel('study_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions' }, () => refreshAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshAll]);

  const now = useNow(running !== null, 30000);
  const myLivePoints = running ? pointsForMinutes(minutesSince(running.started_at, now)) : 0;
  const todayPoints = myDays.find((d) => d.day === romeDay())?.points ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.hello}>Ciao {profile?.username ?? ''} 👋</Text>
        <Pressable onPress={() => supabase.auth.signOut()}>
          <Text style={styles.link}>Esci</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TimerCard running={running} todayPoints={todayPoints} onChange={refreshAll} />
      <LeaderboardCard
        circles={circles}
        selectedId={circleId}
        onSelect={setSelectedCircle}
        members={members}
        running={circleRunning}
        days={circleDays}
        myId={userId}
      />
      <ProgressCard days={myDays} livePoints={myLivePoints} />
      <CirclesCard circles={circles} onChange={refreshAll} />
    </ScrollView>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <View style={[styles.safe, styles.centered]}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  content: { padding: 20, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { fontSize: 24, fontWeight: '800', color: colors.text },
  link: { color: colors.primaryDark, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted, textAlign: 'center' },
  error: { color: colors.danger },
});

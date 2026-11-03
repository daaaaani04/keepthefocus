import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthScreen } from '../components/AuthScreen';
import { CirclesCard } from '../components/CirclesCard';
import { TimerCard } from '../components/TimerCard';
import {
  getMyCircles,
  getMyProfile,
  getRunningSession,
  getTodayPoints,
  type Circle,
  type Profile,
  type StudySession,
} from '../lib/api';
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

function Home({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [running, setRunning] = useState<StudySession | null>(null);
  const [todayPoints, setTodayPoints] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [p, c, r, t] = await Promise.all([
        getMyProfile(userId),
        getMyCircles(),
        getRunningSession(userId),
        getTodayPoints(userId),
      ]);
      setProfile(p);
      setCircles(c);
      setRunning(r);
      setTodayPoints(t);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.hello}>Ciao {profile?.username ?? ''} 👋</Text>
        <Pressable onPress={() => supabase.auth.signOut()}>
          <Text style={styles.link}>Esci</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TimerCard running={running} todayPoints={todayPoints} onChange={refresh} />
      <CirclesCard circles={circles} onChange={refresh} />
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

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { startSession, stopSession, type StudySession } from '../lib/api';
import { multiplierForMinutes, pointsForMinutes } from '../lib/points';
import { colors } from '../lib/theme';
import { Button, Card, ErrorText } from './ui';

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// I punti mostrati mentre il timer va sono una stima: quelli veri li calcola il server allo stop.
export function TimerCard({
  running,
  todayPoints,
  onChange,
}: {
  running: StudySession | null;
  todayPoints: number;
  onChange: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = running ? Math.max(0, Math.floor((now - new Date(running.started_at).getTime()) / 1000)) : 0;
  const minutes = Math.floor(elapsed / 60);
  const livePoints = pointsForMinutes(minutes);
  const multiplier = multiplierForMinutes(minutes);
  const nextStep = minutes < 25 ? 25 - minutes : minutes < 50 ? 50 - minutes : null;

  async function toggle() {
    setError(null);
    setLoading(true);
    try {
      if (running) {
        const done = await stopSession();
        setLastResult(done?.points ?? 0);
      } else {
        setLastResult(null);
        await startSession();
      }
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.label}>Oggi</Text>
        <Text style={styles.today}>{todayPoints + (running ? livePoints : 0)} punti</Text>
      </View>
      <Text style={[styles.time, running && { color: colors.primaryDark }]}>{formatElapsed(elapsed)}</Text>
      {running ? (
        <View style={styles.center}>
          <Text style={styles.points}>+{livePoints} punti in questa sessione</Text>
          <Text style={styles.multiplier}>
            Moltiplicatore x{multiplier}
            {nextStep !== null ? ` · ancora ${nextStep} min per salire` : ' · massimo raggiunto'}
          </Text>
        </View>
      ) : (
        <Text style={styles.hint}>
          {lastResult !== null
            ? `Sessione chiusa: +${lastResult} punti`
            : 'Avvia il timer e non fermarti: dopo 25 minuti i punti valgono di più.'}
        </Text>
      )}
      <ErrorText message={error} />
      <Button
        title={running ? 'Ferma' : 'Avvia'}
        variant={running ? 'danger' : 'primary'}
        onPress={toggle}
        loading={loading}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 15, color: colors.muted, fontWeight: '600' },
  today: { fontSize: 15, color: colors.accent, fontWeight: '800' },
  time: { fontSize: 64, fontWeight: '800', color: colors.text, textAlign: 'center', fontVariant: ['tabular-nums'] },
  center: { alignItems: 'center', gap: 4 },
  points: { fontSize: 18, fontWeight: '700', color: colors.primaryDark },
  multiplier: { fontSize: 14, color: colors.muted },
  hint: { fontSize: 14, color: colors.muted, textAlign: 'center' },
});

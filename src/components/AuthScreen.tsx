import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { Button, Card, ErrorText, Input } from './ui';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (username.trim().length < 2) throw new Error('Lo username deve avere almeno 2 caratteri');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username: username.trim() } },
        });
        if (error) throw error;
        if (!data.session) setInfo('Controlla la tua email per confermare la registrazione, poi accedi.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Keep the Focus</Text>
      <Text style={styles.subtitle}>Studia con i tuoi amici, guadagna punti.</Text>
      <Card>
        <Text style={styles.heading}>{mode === 'login' ? 'Accedi' : 'Crea un account'}</Text>
        {mode === 'signup' && (
          <Input placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        )}
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <ErrorText message={error} />
        {info ? <Text style={styles.info}>{info}</Text> : null}
        <Button title={mode === 'login' ? 'Accedi' : 'Registrati'} onPress={submit} loading={loading} />
        <Button
          variant="ghost"
          title={mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          onPress={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null);
            setInfo(null);
          }}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 8, maxWidth: 480, width: '100%', alignSelf: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.muted, textAlign: 'center', marginBottom: 16 },
  heading: { fontSize: 20, fontWeight: '700', color: colors.text },
  info: { color: colors.primaryDark, fontSize: 14 },
});

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type Status = 'checking' | 'ok' | 'missing-config' | 'error';

// Schermata provvisoria del passo 1: verifica che l'app raggiunga Supabase.
// Verrà sostituita da login e timer nel passo 2.
export default function Home() {
  const [status, setStatus] = useState<Status>('checking');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('missing-config');
      return;
    }
    supabase
      .from('circles')
      .select('id', { count: 'exact', head: true })
      .then(({ error }) => {
        if (error) {
          setStatus('error');
          setDetail(error.message);
        } else {
          setStatus('ok');
        }
      });
  }, []);

  const label = {
    checking: 'Controllo la connessione…',
    ok: 'Connesso a Supabase e schema trovato ✅',
    'missing-config': 'Manca il file .env con le chiavi Supabase',
    error: 'Supabase raggiungibile, ma qualcosa non va',
  }[status];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Keep the Focus</Text>
      <Text style={styles.subtitle}>Studia con i tuoi amici, guadagna punti.</Text>
      <Text style={styles.status}>{label}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F7F7F2' },
  title: { fontSize: 32, fontWeight: '800', color: '#1F2A1F' },
  subtitle: { fontSize: 16, color: '#4B5B4B', marginTop: 8 },
  status: { fontSize: 15, marginTop: 32, color: '#1F2A1F' },
  detail: { fontSize: 13, marginTop: 8, color: '#A33', textAlign: 'center' },
});

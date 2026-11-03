import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createCircle, joinCircle, type Circle } from '../lib/api';
import { colors } from '../lib/theme';
import { Button, Card, ErrorText, Input } from './ui';

export function CirclesCard({ circles, onChange }: { circles: Circle[]; onChange: () => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: 'create' | 'join') {
    setError(null);
    setBusy(kind);
    try {
      if (kind === 'create') {
        if (!name.trim()) throw new Error('Dai un nome al cerchio');
        await createCircle(name.trim());
        setName('');
      } else {
        if (!code.trim()) throw new Error('Inserisci il codice invito');
        await joinCircle(code.trim());
        setCode('');
      }
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <Text style={styles.heading}>I tuoi cerchi</Text>
      {circles.length === 0 ? (
        <Text style={styles.muted}>Non sei ancora in nessun cerchio. Creane uno o entra con un codice.</Text>
      ) : (
        circles.map((c) => (
          <View key={c.id} style={styles.circle}>
            <Text style={styles.circleName}>{c.name}</Text>
            <Text style={styles.code} selectable>
              Codice: {c.invite_code}
            </Text>
          </View>
        ))
      )}
      <View style={styles.row}>
        <Input style={styles.flex} placeholder="Nome nuovo cerchio" value={name} onChangeText={setName} />
        <Button title="Crea" onPress={() => run('create')} loading={busy === 'create'} />
      </View>
      <View style={styles.row}>
        <Input
          style={styles.flex}
          placeholder="Codice invito"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
        />
        <Button title="Entra" variant="ghost" onPress={() => run('join')} loading={busy === 'join'} />
      </View>
      <ErrorText message={error} />
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 14 },
  circle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  circleName: { fontSize: 16, fontWeight: '600', color: colors.text },
  code: { fontSize: 14, color: colors.primaryDark, fontWeight: '700', letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex: { flex: 1, minWidth: 0 },
});

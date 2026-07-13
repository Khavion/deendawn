import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function QuranScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Quran</ThemedText>
      <ThemedText style={styles.body}>The Quran reader is coming in an upcoming update.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  body: { opacity: 0.7, textAlign: 'center' },
});

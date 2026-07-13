import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function QiblaScreen() {
  const { t } = useTranslation();
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{t('qibla.title')}</ThemedText>
      <ThemedText style={styles.body}>{t('qibla.comingSoon')}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  body: { opacity: 0.7, textAlign: 'center' },
});

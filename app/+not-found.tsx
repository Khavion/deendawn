import { Link, Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui';
import { spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export default function NotFoundScreen() {
  const t = useTokens();
  const { t: tr } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: tr('notFound.title') }} />
      <View style={[styles.container, { backgroundColor: t.bgCanvas }]}>
        <AppText variant="title" style={styles.center}>
          {tr('notFound.title')}
        </AppText>
        <AppText variant="body" style={[styles.center, { color: t.textSecondary }]}>
          {tr('notFound.body')}
        </AppText>
        <Link href="/(tabs)" replace>
          <AppText variant="link">{tr('notFound.home')}</AppText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.l,
    padding: spacing.xxl,
  },
  center: { textAlign: 'center' },
});

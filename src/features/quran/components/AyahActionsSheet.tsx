import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { AppText, ListRow, Sheet } from '@/src/components/ui';
import { localizeNumber } from '@/src/lib/i18n/format';
import { spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

/**
 * The quiet ayah-press Sheet (handoff §6 screen 02): bookmark and share —
 * per-ayah action rows left the page. Play-from-here and repeat-ayah wait on
 * the per-ayah timing artifact (DECISIONS 2026-07-31).
 */
export function AyahActionsSheet({
  visible,
  onClose,
  surah,
  ayah,
  bookmarked,
  onToggleBookmark,
  onShare,
}: {
  visible: boolean;
  onClose: () => void;
  surah: number;
  ayah: number;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onShare: () => void;
}) {
  const t = useTokens();
  const { t: tr, i18n } = useTranslation();
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={tr('quran.actionsTitle', { surah, ayah })}
      testID="ayah-actions-sheet"
    >
      <AppText variant="subtitle" color={t.textSecondary} style={styles.title}>
        {tr('quran.actionsTitle', {
          surah: localizeNumber(surah, i18n.language),
          ayah: localizeNumber(ayah, i18n.language),
        })}
      </AppText>
      <ListRow
        label={bookmarked ? tr('quran.bookmarkRemove') : tr('quran.bookmarkAdd')}
        onPress={() => {
          onToggleBookmark();
          onClose();
        }}
        haptic="select"
        testID={`bookmark-${ayah}`}
      />
      <ListRow
        label={tr('quran.share')}
        onPress={() => {
          onClose();
          onShare();
        }}
        haptic="press"
        testID={`share-${ayah}`}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.s },
});

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui';
import { City } from '@/src/features/settings/cities';
import { searchCities } from '@/src/features/settings/citySearch';
import { radius, spacing } from '@/src/lib/theme/tokens';
import { useTokens } from '@/src/lib/theme/useTokens';

export function CityPickerModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
}) {
  const insets = useSafeAreaInsets();
  const tk = useTokens();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const results = searchCities(query, 25);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[styles.container, { backgroundColor: tk.bgCanvas, paddingTop: insets.top + 12 }]}
      >
        <View style={styles.header}>
          <AppText variant="subtitle">{t('cityPicker.title')}</AppText>
          <Pressable accessibilityRole="button" testID="close-picker" onPress={onClose}>
            <AppText variant="link">{t('common.close')}</AppText>
          </Pressable>
        </View>
        <TextInput
          testID="city-search"
          value={query}
          onChangeText={setQuery}
          placeholder={t('cityPicker.placeholder')}
          placeholderTextColor={tk.icon}
          autoFocus
          autoCorrect={false}
          style={[styles.input, { color: tk.textPrimary, borderColor: tk.border }]}
        />
        <FlashList
          data={results}
          keyExtractor={(c) => c.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <AppText style={styles.hint}>
              {query.trim() ? t('cityPicker.noMatch') : t('cityPicker.hint')}
            </AppText>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              testID={`city-${item.id}`}
              onPress={() => onSelect(item)}
              style={[styles.row, { borderBottomColor: tk.border }]}
            >
              <AppText>{item.name}</AppText>
              <AppText style={[styles.country, { color: tk.textSecondary }]}>{item.country}</AppText>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.l },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    fontSize: 16,
    marginBottom: spacing.s,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  country: {},
  hint: { textAlign: 'center', marginTop: spacing.xl, opacity: 0.7 },
});

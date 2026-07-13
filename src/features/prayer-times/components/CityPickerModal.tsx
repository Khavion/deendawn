import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { City } from '@/src/features/settings/cities';
import { searchCities } from '@/src/features/settings/citySearch';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const scheme = useColorScheme() ?? 'light';
  const [query, setQuery] = useState('');
  const results = searchCities(query, 25);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Choose your city</ThemedText>
          <Pressable accessibilityRole="button" testID="close-picker" onPress={onClose}>
            <ThemedText type="link">Close</ThemedText>
          </Pressable>
        </View>
        <TextInput
          testID="city-search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search city or country"
          placeholderTextColor={Colors[scheme].icon}
          autoFocus
          autoCorrect={false}
          style={[styles.input, { color: Colors[scheme].text, borderColor: Colors[scheme].icon }]}
        />
        <FlatList
          data={results}
          keyExtractor={(c) => c.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <ThemedText style={styles.hint}>
              {query.trim()
                ? 'No match — try the nearest big city.'
                : 'Type a city name, e.g. Houston.'}
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              testID={`city-${item.id}`}
              onPress={() => onSelect(item)}
              style={styles.row}
            >
              <ThemedText>{item.name}</ThemedText>
              <ThemedText style={styles.country}>{item.country}</ThemedText>
            </Pressable>
          )}
        />
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
  },
  country: { opacity: 0.6 },
  hint: { textAlign: 'center', marginTop: 24, opacity: 0.7 },
});

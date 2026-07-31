import React from 'react';
import { View } from 'react-native';
import { AppText, Card, Divider, palette, spacing } from 'deendawn';

/** The standard surface card — hairline border, no heavy shadow. */
export function Basic() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <Card style={{ gap: spacing.s }}>
        <AppText variant="bodyStrong">Hijri calendar</AppText>
        <AppText variant="caption" color={palette.light.textSecondary}>
          Umm al-Qura · calculated — may differ from local moonsighting
        </AppText>
      </Card>
    </View>
  );
}

/** A list card: rows separated by hairline dividers. */
export function ListRows() {
  const rows = [
    ['Fajr', '5:27 AM'],
    ['Dhuhr', '1:29 PM'],
    ['Asr', '5:04 PM'],
    ['Maghrib', '8:16 PM'],
  ] as const;
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <Card style={{ padding: 0 }}>
        {rows.map(([name, time], i) => (
          <React.Fragment key={name}>
            {i > 0 && <Divider />}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: spacing.l,
              }}
            >
              <AppText variant="body">{name}</AppText>
              <AppText variant="body" color={palette.light.textSecondary}>
                {time}
              </AppText>
            </View>
          </React.Fragment>
        ))}
      </Card>
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { Card, Skeleton, spacing } from 'deendawn';

/** Text-shaped loading lines. */
export function TextLines() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360, gap: spacing.s }}>
      <Skeleton width="55%" height={16} />
      <Skeleton width="85%" height={12} />
      <Skeleton width="70%" height={12} />
    </View>
  );
}

/** A loading list card mirroring the prayer-times rows. */
export function CardSkeleton() {
  return (
    <View style={{ padding: spacing.l, maxWidth: 360 }}>
      <Card style={{ gap: spacing.m }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width="30%" height={14} />
            <Skeleton width="20%" height={14} />
          </View>
        ))}
      </Card>
    </View>
  );
}

'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

/**
 * The Android home-screen widget UI. Widget primitives only (FlexWidget /
 * TextWidget — no RN View/Text), rendered headlessly to RemoteViews by
 * react-native-android-widget.
 *
 * 'use no memo': the widget renderer is incompatible with the React
 * Compiler's hooks instrumentation (library-documented "Invalid hook call")
 * — these are plain hook-free functions and stay excluded.
 *
 * RTL: the primitives have no layoutDirection/row-reverse — mirroring is
 * manual (reversed column order + end-aligned header) per the library docs.
 */
export interface WidgetPrayerRow {
  key: string;
  /** Localized display name (already resolved — no i18n in the tree). */
  name: string;
  /** Formatted local time, e.g. "5:27 AM". */
  time: string;
  isNext: boolean;
}

export interface PrayerTimesWidgetProps {
  cityLabel: string;
  dateLabel: string;
  prayers: WidgetPrayerRow[];
  rtl: boolean;
  dark: boolean;
}

const COLORS = {
  light: {
    bg: '#F7F6F2',
    text: '#20242A',
    secondary: '#6B675C',
    accent: '#274D3D',
    nextBg: '#B9CDC2',
  },
  dark: {
    bg: '#15181D',
    text: '#E8E6E1',
    secondary: '#9B968A',
    accent: '#6FA28B',
    nextBg: '#2C3A33',
  },
} as const;

export function PrayerTimesWidget({
  cityLabel,
  dateLabel,
  prayers,
  rtl,
  dark,
}: PrayerTimesWidgetProps) {
  const c = dark ? COLORS.dark : COLORS.light;
  const columns = rtl ? [...prayers].reverse() : prayers;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: c.bg as `#${string}`,
        borderRadius: 16,
        flexDirection: 'column',
        padding: 12,
      }}
    >
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: rtl ? 'row' : 'row',
          justifyContent: 'space-between',
        }}
      >
        <TextWidget
          text={rtl ? dateLabel : cityLabel}
          style={{ fontSize: 12, color: (rtl ? c.secondary : c.accent) as `#${string}` }}
        />
        <TextWidget
          text={rtl ? cityLabel : dateLabel}
          style={{ fontSize: 12, color: (rtl ? c.accent : c.secondary) as `#${string}` }}
        />
      </FlexWidget>
      <FlexWidget
        style={{
          width: 'match_parent',
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
        }}
      >
        {columns.map((p) => (
          <FlexWidget
            key={p.key}
            style={{
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: (p.isNext ? c.nextBg : 'transparent') as `#${string}`,
              borderRadius: 10,
              paddingVertical: 6,
              marginHorizontal: 2,
            }}
          >
            <TextWidget
              text={p.name}
              maxLines={1}
              style={{
                fontSize: 11,
                color: (p.isNext ? c.accent : c.secondary) as `#${string}`,
              }}
            />
            <TextWidget
              text={p.time}
              maxLines={1}
              style={{
                fontSize: 13,
                fontWeight: 'bold',
                color: c.text as `#${string}`,
                marginTop: 2,
              }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}

/** Shown before the app has ever computed times (no location chosen). */
export function PrayerTimesWidgetEmpty({ message, dark }: { message: string; dark: boolean }) {
  const c = dark ? COLORS.dark : COLORS.light;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: c.bg as `#${string}`,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
      }}
    >
      <TextWidget text={message} style={{ fontSize: 13, color: c.secondary as `#${string}` }} />
    </FlexWidget>
  );
}

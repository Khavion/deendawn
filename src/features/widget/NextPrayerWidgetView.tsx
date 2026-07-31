'widget';
import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundColor, padding } from '@expo/ui/swift-ui/modifiers';
import React from 'react';

import { widgetPalettes } from './widgetTokens';
import type { WidgetTimelineEntry } from './timeline';
import type { WidgetEnvironment } from 'expo-widgets';

type Props = WidgetTimelineEntry['props'];

/**
 * The iOS NextPrayer widget (handoff §6 screen 07). All strings arrive
 * localized in props (the extension has no i18n runtime); the countdown is
 * a native timerInterval Text, so it ticks offline forever without a
 * refresh budget. Whole-widget tap opens Today — no inner buttons. Fonts:
 * the system serif design stands in for Newsreader inside the extension
 * (custom-font embedding is a documented alpha gap — TESTPLAN).
 *
 * Palettes (gap 27): Paper in light, Night gold in dark — the environment's
 * color scheme picks; the Forest variant + OS configuration UI are logged
 * follow-ups.
 */
export function NextPrayerWidgetView(props: Props, env: WidgetEnvironment) {
  const p = env.colorScheme === 'dark' ? widgetPalettes.night : widgetPalettes.paper;
  const target = new Date(props.prayerIso);
  const family = env.widgetFamily;

  if (family === 'accessoryInline') {
    // Lock-screen inline is monochrome and one line — absolute time only.
    return <Text>{`${props.prayerName} ${props.prayerTime}`}</Text>;
  }

  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[font({ size: 13, weight: 'semibold' })]}>
          {`${props.prayerName} ${props.prayerTime}`}
        </Text>
        <Text timerInterval={{ lower: new Date(env.date), upper: target }} countsDown modifiers={[font({ size: 13 })]} />
      </VStack>
    );
  }

  const eyebrow = (
    <Text modifiers={[font({ size: 10, weight: 'semibold' }), foregroundColor(p.secondary)]}>
      {props.prayerName.toUpperCase()}
    </Text>
  );
  const bigTime = (
    <Text modifiers={[font({ size: 30, weight: 'semibold', design: 'serif' }), foregroundColor(p.text)]}>
      {props.prayerTime}
    </Text>
  );
  const countdown = (
    <Text
      timerInterval={{ lower: new Date(env.date), upper: target }}
      countsDown
      modifiers={[font({ size: 13, weight: 'semibold' }), foregroundColor(p.gold)]}
    />
  );
  const hijri = (
    <Text modifiers={[font({ size: 11 }), foregroundColor(p.secondary)]}>{props.hijriLabel}</Text>
  );

  if (family === 'systemMedium') {
    return (
      <VStack alignment="leading" spacing={4} modifiers={[padding({ all: 14 })]}>
        <HStack spacing={6}>
          {eyebrow}
          <Spacer />
          <Text modifiers={[font({ size: 11 }), foregroundColor(p.secondary)]}>
            {props.cityLabel}
          </Text>
        </HStack>
        <HStack spacing={8}>
          {bigTime}
          {countdown}
        </HStack>
        <Spacer />
        <HStack spacing={0}>
          {props.strip.map((item) => {
            const isNext = item.key === props.prayerKey;
            return (
              <VStack key={item.key} spacing={1}>
                <Text
                  modifiers={[
                    font({ size: 10, weight: isNext ? 'semibold' : 'regular' }),
                    foregroundColor(isNext ? p.gold : p.secondary),
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  modifiers={[
                    font({ size: 12, weight: isNext ? 'semibold' : 'regular' }),
                    foregroundColor(isNext ? p.gold : p.text),
                  ]}
                >
                  {item.time}
                </Text>
              </VStack>
            );
          })}
        </HStack>
        {hijri}
      </VStack>
    );
  }

  // systemSmall (default).
  return (
    <VStack alignment="leading" spacing={4} modifiers={[padding({ all: 14 })]}>
      {eyebrow}
      {bigTime}
      {countdown}
      <Spacer />
      {hijri}
    </VStack>
  );
}

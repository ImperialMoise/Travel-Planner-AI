import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, shadows, spacing } from '../theme/tokens';

export default function NextTripCard({ trip }) {
  return (
    <View style={styles.card}>
      <View style={styles.blurCircle} />
      <View style={styles.content}>
        <View style={styles.badgeWrap}>
          <Text style={styles.badge}>{trip.badge}</Text>
        </View>

        <Text style={styles.destination}>{trip.destination}</Text>

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <View style={styles.dateRow}>
              <View style={styles.countdownBubble}>
                <Text style={styles.countdownText}>{trip.countdown}</Text>
              </View>
              <Text style={styles.dateText}>{trip.dates}</Text>
            </View>
            <Text style={styles.percent}>{trip.progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${trip.progress}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 175,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.faintBorder,
    overflow: 'hidden',
    ...shadows.card
  },
  blurCircle: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.tertiaryContainer,
    opacity: 0.1
  },
  content: {
    padding: spacing.md,
    gap: spacing.md
  },
  badgeWrap: {
    alignItems: 'flex-start'
  },
  badge: {
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: colors.primaryFixed,
    color: colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.76,
    textTransform: 'uppercase'
  },
  destination: {
    color: colors.onSurface,
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700'
  },
  metaBlock: {
    gap: 8
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  countdownBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center'
  },
  countdownText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700'
  },
  dateText: {
    color: colors.onSurfaceVariant,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 14
  },
  percent: {
    color: colors.primary,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 14
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.surfaceVariant,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary
  }
});

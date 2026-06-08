import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';
import { colors, fonts, radii, shadows } from '../theme/tokens';

export default function TripCard({ trip }) {
  return (
    <View style={[styles.card, trip.past && styles.pastCard]}>
      <ImageBackground source={{ uri: trip.image }} style={styles.image} imageStyle={styles.imageRadius}>
        <View style={styles.scrim} />
        <Text style={[styles.status, trip.past && styles.pastStatus]}>{trip.status}</Text>
      </ImageBackground>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.title}>{trip.title}</Text>
        <View style={styles.dateRow}>
          <AppIcon name="calendar" size={12} color={colors.onSurfaceVariant} />
          <Text style={styles.date}>{trip.date}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    flexShrink: 0,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.faintBorder,
    overflow: 'hidden',
    ...shadows.card
  },
  pastCard: {
    opacity: 0.8
  },
  image: {
    height: 128,
    justifyContent: 'flex-end'
  },
  imageRadius: {
    resizeMode: 'cover'
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)'
  },
  status: {
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(254, 249, 239, 0.92)',
    color: colors.onSurface,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  pastStatus: {
    backgroundColor: colors.surfaceVariant,
    color: colors.onSurfaceVariant
  },
  body: {
    padding: 12
  },
  title: {
    color: colors.onSurface,
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 2
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  date: {
    color: colors.onSurfaceVariant,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 14
  }
});

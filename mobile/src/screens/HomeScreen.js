import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import CreateAdventureButton from '../components/CreateAdventureButton';
import NextTripCard from '../components/NextTripCard';
import TopAppBar from '../components/TopAppBar';
import TripCard from '../components/TripCard';
import { nextTrip, trips } from '../data/homeMock';
import { colors, fonts, spacing } from '../theme/tokens';

export default function HomeScreen({ onCreateTrip }) {
  return (
    <View style={styles.screen}>
      <TopAppBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSection}>
          <Text style={styles.kicker}>Votre Carnet</Text>
          <Text style={styles.heroTitle}>Où commence votre prochaine escale ?</Text>
        </View>

        <View style={styles.section}>
          <NextTripCard trip={nextTrip} />
        </View>

        <View style={styles.createSection}>
          <CreateAdventureButton onPress={onCreateTrip} />
        </View>

        <View style={styles.tripsHeader}>
          <Text style={styles.sectionTitle}>Mes Voyages</Text>
          <Text style={styles.seeAll}>Tout voir</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tripList}
        >
          {trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
        </ScrollView>
      </ScrollView>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    paddingTop: 28,
    paddingBottom: 124
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: spacing.lg
  },
  kicker: {
    color: colors.mutedGreen,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.76,
    textTransform: 'uppercase',
    marginBottom: spacing.xs
  },
  heroTitle: {
    color: colors.onSurface,
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700'
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: spacing.lg
  },
  createSection: {
    paddingHorizontal: 20,
    marginBottom: spacing.xl
  },
  tripsHeader: {
    paddingHorizontal: 20,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    color: colors.onSurface,
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700'
  },
  seeAll: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    textDecorationLine: 'underline'
  },
  tripList: {
    gap: spacing.md,
    paddingHorizontal: 20,
    paddingBottom: spacing.md
  }
});

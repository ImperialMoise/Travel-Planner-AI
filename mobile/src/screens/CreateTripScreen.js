import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../components/AppIcon';
import { colors, fonts, radii, shadows, spacing } from '../theme/tokens';

export default function CreateTripScreen({ onClose }) {
  const insets = useSafeAreaInsets();
  const [destination, setDestination] = React.useState('');

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} style={styles.headerButton}>
          <AppIcon name="close" size={26} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Nouvelle Aventure</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.contentWrap}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Quelle sera votre{`\n`}prochaine aventure ?</Text>
            <Text style={styles.heroSubtitle}>Laissez-vous guider par l'inspiration.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Destination</Text>
              <View style={styles.inputShell}>
                <AppIcon name="location" size={25} color={colors.mutedGreen} style={styles.inputIcon} />
                <TextInput
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Ex: Kyoto, Japon"
                  placeholderTextColor={colors.outlineVariant}
                  autoCapitalize="words"
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Période du voyage</Text>
              <View style={styles.dateGrid}>
                <DateCard label="Début" value="Sélectionner" icon="calendar" />
                <DateCard label="Fin" value="Optionnel" icon="calendarMonth" muted />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Compagnons de route</Text>
              <Pressable accessibilityRole="button" style={styles.companionsButton}>
                <AppIcon name="personAdd" size={25} color={colors.mutedGreen} />
                <Text style={styles.companionsText}>Ajouter des amis (optionnel)</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable accessibilityRole="button" style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Créer le carnet de bord</Text>
          <AppIcon name="arrowRight" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

function DateCard({ label, value, icon, muted = false }) {
  return (
    <Pressable accessibilityRole="button" style={styles.dateCard}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={[styles.dateValue, muted && styles.mutedDateValue]}>{value}</Text>
      <AppIcon name={icon} size={24} color={colors.outlineVariant} style={styles.dateIcon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.faintBorder
  },
  headerButton: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  },
  headerTitle: {
    height: 64,
    color: colors.primary,
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 64,
    fontWeight: '700',
    textAlign: 'center'
  },
  headerSpacer: {
    position: 'absolute',
    right: 20,
    bottom: 12,
    width: 40,
    height: 40
  },
  contentWrap: {
    flex: 1
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 148,
    gap: spacing.xl
  },
  hero: {
    alignItems: 'center'
  },
  heroTitle: {
    color: colors.onSurface,
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8
  },
  heroSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center'
  },
  form: {
    gap: spacing.lg
  },
  fieldGroup: {
    gap: spacing.xs
  },
  label: {
    color: colors.mutedGreen,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.76,
    textTransform: 'uppercase'
  },
  inputShell: {
    minHeight: 64,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '700',
    paddingVertical: 12
  },
  dateGrid: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  dateCard: {
    flex: 1,
    minHeight: 84,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  dateLabel: {
    color: colors.mutedGreen,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 4
  },
  dateValue: {
    color: colors.onSurface,
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '800'
  },
  mutedDateValue: {
    color: colors.outlineVariant
  },
  dateIcon: {
    position: 'absolute',
    right: 16,
    top: 30
  },
  companionsButton: {
    minHeight: 64,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16
  },
  companionsText: {
    color: colors.mutedGreen,
    fontSize: 13.5,
    lineHeight: 20
  },
  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 28,
    backgroundColor: 'rgba(254, 249, 239, 0.92)'
  },
  primaryButton: {
    minHeight: 60,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadows.action
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '800'
  }
});

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import AppIcon from './AppIcon';
import { colors, radii } from '../theme/tokens';

export default function CreateAdventureButton() {
  return (
    <Pressable accessibilityRole="button" style={styles.button}>
      <AppIcon name="add" size={26} color={colors.mutedGreen} />
      <Text style={styles.label}>Créer une nouvelle aventure</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 64,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  label: {
    color: colors.mutedGreen,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700'
  }
});

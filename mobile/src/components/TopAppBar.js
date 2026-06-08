import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';
import { colors, fonts } from '../theme/tokens';

export default function TopAppBar() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir le menu" style={styles.iconButton}>
          <AppIcon name="menu" size={24} />
        </Pressable>
        <Text style={styles.title}>L'Atelier</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir le profil" style={styles.iconButton}>
          <AppIcon name="account" size={22} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(254, 249, 239, 0.92)',
    borderBottomColor: 'transparent',
    borderBottomWidth: 1
  },
  bar: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600'
  }
});

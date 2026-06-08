import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';
import { colors, radii, shadows } from '../theme/tokens';

const tabs = [
  { id: 'plan', label: 'Plan', icon: 'home' },
  { id: 'map', label: 'Carte', icon: 'map' },
  { id: 'budget', label: 'Budget', icon: 'budget' },
  { id: 'docs', label: 'Docs', icon: 'docs' }
];

export default function BottomNavBar() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.nav}>
        {tabs.map(tab => {
          const active = tab.id === 'plan';
          return (
            <Pressable key={tab.id} accessibilityRole="button" style={[styles.tab, active && styles.activeTab]}>
              <AppIcon name={tab.icon} size={18} color={active ? colors.primary : colors.mutedGreen} />
              <Text style={[styles.tabLabel, active && styles.activeLabel]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceContainer,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    ...shadows.nav
  },
  nav: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
    paddingTop: 8
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radii.md,
    paddingVertical: 8
  },
  activeTab: {
    backgroundColor: 'rgba(124, 84, 16, 0.08)'
  },
  tabLabel: {
    color: colors.mutedGreen,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700'
  },
  activeLabel: {
    color: colors.primary
  }
});

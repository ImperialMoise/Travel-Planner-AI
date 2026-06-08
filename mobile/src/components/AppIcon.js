import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';

const ICONS = {
  menu: '☰',
  account: '●',
  add: '+',
  calendar: '▣',
  home: '⌂',
  map: '⌖',
  budget: '◫',
  docs: '☷',
  close: '×',
  location: '⌖',
  calendarMonth: '▦',
  personAdd: '♁',
  arrowRight: '→'
};

export default function AppIcon({ name, size = 22, color = colors.onSurfaceVariant, style }) {
  return <Text style={[styles.icon, { color, fontSize: size, lineHeight: size + 2 }, style]}>{ICONS[name] || '•'}</Text>;
}

const styles = StyleSheet.create({
  icon: {
    fontWeight: '700',
    textAlign: 'center'
  }
});

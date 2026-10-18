import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';
import { STATUS, STATUS_LABELS } from '../data/mockData';

export default function StatusBadge({ status, size = 'md' }) {
  const config = getStatusStyle(status);
  const sizeStyle = size === 'sm' ? styles.small : styles.medium;

  return (
    <View style={[styles.badge, sizeStyle, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.fg }]} />
      <Text style={[styles.label, { color: config.fg }, size === 'sm' && styles.labelSm]}>
        {STATUS_LABELS[status] || status}
      </Text>
    </View>
  );
}

function getStatusStyle(status) {
  switch (status) {
    case STATUS.PENDING:
      return { bg: colors.warningLight, fg: colors.warning };
    case STATUS.CLAIMED:
      return { bg: colors.primaryLight, fg: colors.primary };
    case STATUS.RETURNED:
      return { bg: colors.successLight, fg: colors.success };
    default:
      return { bg: colors.borderLight, fg: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs + 2,
  },
  label: {
    ...typography.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelSm: {
    fontSize: 10,
  },
});

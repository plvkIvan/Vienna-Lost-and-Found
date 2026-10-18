import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../utils/theme';
import { CATEGORIES, TYPE } from '../data/mockData';
import StatusBadge from './StatusBadge';

export default function ItemCard({ item, onPress }) {
  const category = CATEGORIES.find((c) => c.id === item.category);
  const isLost = item.type === TYPE.LOST;
  const accent = isLost ? colors.markerLost : colors.markerFound;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.imageContainer}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>{category?.icon || '📦'}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.typeLabel, { color: accent }]}>
            {isLost ? 'LOST' : 'FOUND'}
          </Text>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            📍 {item.location}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {formatDate(item.date)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  accentBar: {
    width: 4,
  },
  imageContainer: {
    width: 80,
    height: 80,
    margin: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.borderLight,
  },
  placeholderIcon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typeLabel: {
    ...typography.small,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  dateText: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 2,
  },
});

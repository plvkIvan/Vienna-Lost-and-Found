import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadows } from '../utils/theme';
import { useItems } from '../context/ItemsContext';
import { useLanguage } from '../context/LanguageContext';
import { TYPE, STATUS } from '../data/mockData';
import ItemCard from '../components/ItemCard';

export default function HomeScreen({ navigation }) {
  const { items } = useItems();
  const { t } = useLanguage();

  const recentItems = items
    .filter((i) => i.status === STATUS.PENDING)
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Vienna{'\n'}Lost & Found</Text>
          <Text style={styles.subtitle}>
            {t('homeSubtitle')}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.foundCard]} 
            onPress={() => navigation.navigate('Report', { type: TYPE.FOUND })}
            activeOpacity={0.85}
          >
            <View style={styles.cardContentRow}>
              <View style={styles.cardTextContent}>
                <Text style={styles.actionLabel}>I FOUND...</Text>
                <Text style={styles.actionDescription}>
                  Report something you discovered to help its owner.
                </Text>
              </View>
              <View style={styles.actionIconWrap}><Text style={styles.actionIcon}>📍</Text></View>
            </View>
            <View style={styles.actionButton}>
              <Text style={styles.actionButtonText}>{t('reportFound')} →</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.lostCard]} 
            onPress={() => navigation.navigate('Report', { type: TYPE.LOST })}
            activeOpacity={0.85}
          >
            <View style={styles.cardContentRow}>
              <View style={styles.cardTextContent}>
                <Text style={styles.actionLabel}>I LOST...</Text>
                <Text style={styles.actionDescription}>
                  Create a listing so finders can match your item.
                </Text>
              </View>
              <View style={styles.actionIconWrap}>
                <Text style={styles.actionIcon}>🔍</Text>
              </View>
            </View>
            <View style={styles.actionButton}>
              <Text style={styles.actionButtonText}>{t('reportLost')} →</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatBox
            value={items.filter((i) => i.type === TYPE.FOUND).length}
            label="Items found"
            color="#2d9134" 
          />
          <StatBox
            value={items.filter((i) => i.type === TYPE.LOST).length}
            label="Items lost"
            color="#d0021b" 
          />
          <StatBox
            value={items.filter((i) => i.status === STATUS.RETURNED).length}
            label="Returned"
            color={colors.primary}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
              <Text style={styles.sectionLink}>{t('seeAll')} →</Text>
            </TouchableOpacity>
          </View>

          {recentItems.length === 0 ? (
            <Text style={styles.emptyText}>
              No recent activity. Be the first to report!
            </Text>
          ) : (
            recentItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onPress={() =>
                  navigation.navigate('ItemDetail', { itemId: item.id })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ value, label, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 38,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md, 
  },
  actionCard: {
  paddingVertical: 25, 
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  foundCard: {
    backgroundColor: '#2d9134',
  },
  lostCard: {
    backgroundColor: '#d0021b',
  },
  cardContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTextContent: {
    flex: 1,
    paddingRight: spacing.md,
  },
  actionLabel: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    textTransform: 'uppercase',
},
actionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    lineHeight: 18,
    maxWidth: '80%',
},
  actionButton: {
  marginTop: 15,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  paddingVertical: 14,
  paddingHorizontal: 15,
  borderRadius: 12,
  width: '100%',
  alignItems: 'center',
  alignSelf: 'flex-start',
  },
  actionButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
},
actionIconWrap: {
    position: 'absolute',
    right: 20,
    top: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
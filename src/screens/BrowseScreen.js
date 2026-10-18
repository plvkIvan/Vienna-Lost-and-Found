import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { colors, radius, spacing, typography, shadows } from '../utils/theme';
import { useItems } from '../context/ItemsContext';
import { useLanguage } from '../context/LanguageContext';
import { CATEGORIES, STATUS, TYPE, VIENNA_REGION } from '../data/mockData';
import ItemCard from '../components/ItemCard';
import StatusBadge from '../components/StatusBadge';

const STATUS_FILTERS = [
  { id: 'all', labelKey: 'all' },
  { id: STATUS.PENDING, labelKey: 'open' },
  { id: STATUS.CLAIMED, labelKey: 'claimed' },
  { id: STATUS.RETURNED, labelKey: 'returned' },
];

export default function BrowseScreen({ route, navigation }) {
  const { items } = useItems();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState(route?.params?.viewMode || 'map');
  const [typeFilter, setTypeFilter] = useState(route?.params?.typeFilter || 'all');
  const [statusFilter, setStatusFilter] = useState(route?.params?.statusFilter || 'all');
  const [categoryFilter, setCategoryFilter] = useState(route?.params?.categoryFilter || null);
  const [searchQuery, setSearchQuery] = useState(route?.params?.searchQuery || '');
  const [selectedItem, setSelectedItem] = useState(null);

  const mapRef = useRef(null);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items
      .filter((item) => {
        if (typeFilter !== 'all' && item.type !== typeFilter) return false;
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (categoryFilter && item.category !== categoryFilter) return false;

        if (query) {
          const category = CATEGORIES.find((cat) => cat.id === item.category);
          const searchable = [
            item.title,
            item.description,
            item.location,
            category?.label,
            item.type,
            item.status,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (!searchable.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  }, [items, typeFilter, statusFilter, categoryFilter, searchQuery]);

  const hasActiveFilters =
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    categoryFilter !== null ||
    searchQuery.trim() !== '';

  function clearFilters() {
    setTypeFilter('all');
    setStatusFilter('all');
    setCategoryFilter(null);
    setSearchQuery('');
    setSelectedItem(null);
  }

  function handleMarkerPress(item) {
    setSelectedItem(item);
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: item.latitude - 0.008,
          longitude: item.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        300
      );
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('browseTitle')}</Text>
        <Text style={styles.subtitle}>
          {filteredItems.length} {t('matchingItems')}
        </Text>
      </View>

      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>{t('searchAndFilters')}</Text>
        <Text style={styles.panelHint}>{t('browseHint')}</Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterBlock}>
          <Text style={styles.filterLabel}>{t('viewMode')}</Text>
          <View style={styles.segmentedRow}>
            <Pill icon="🗺️" label={t('map')} active={viewMode === 'map'} onPress={() => setViewMode('map')} />
            <Pill icon="📋" label={t('list')} active={viewMode === 'list'} onPress={() => setViewMode('list')} />
          </View>
        </View>

        <View style={styles.filterBlock}>
          <Text style={styles.filterLabel}>{t('reportType')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScrollContent}>
            <Pill label={t('all')} active={typeFilter === 'all'} onPress={() => setTypeFilter('all')} />
            <Pill label={t('lost')} color={colors.markerLost} active={typeFilter === TYPE.LOST} onPress={() => setTypeFilter(TYPE.LOST)} />
            <Pill label={t('found')} color={colors.markerFound} active={typeFilter === TYPE.FOUND} onPress={() => setTypeFilter(TYPE.FOUND)} />
          </ScrollView>
        </View>

        <View style={styles.filterBlock}>
          <Text style={styles.filterLabel}>{t('status')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScrollContent}>
            {STATUS_FILTERS.map((filter) => (
              <Pill
                key={filter.id}
                label={t(filter.labelKey)}
                active={statusFilter === filter.id}
                onPress={() => setStatusFilter(filter.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterBlock}>
          <Text style={styles.filterLabel}>{t('categories')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScrollContent}>
            <CategoryChip
              label={`📦 ${t('allCategories')}`}
              active={!categoryFilter}
              onPress={() => setCategoryFilter(null)}
            />
            {CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={`${cat.icon} ${cat.label}`}
                active={categoryFilter === cat.id}
                onPress={() => setCategoryFilter(cat.id)}
              />
            ))}
          </ScrollView>
        </View>

        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>↻ {t('clearFilters')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={VIENNA_REGION}
          >
            {filteredItems.map((item) => (
              <Marker
                key={item.id}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                pinColor={item.type === TYPE.LOST ? colors.markerLost : colors.markerFound}
                onPress={() => handleMarkerPress(item)}
              />
            ))}
          </MapView>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.markerLost }]} />
              <Text style={styles.legendText}>{t('lost')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.markerFound }]} />
              <Text style={styles.legendText}>{t('found')}</Text>
            </View>
          </View>

          {filteredItems.length === 0 && <EmptyOverlay title={t('noItems')} text={t('adjustFilters')} />}

          {selectedItem && (
            <BottomItemCard
              item={selectedItem}
              onPress={() => {
                setSelectedItem(null);
                navigation.navigate('ItemDetail', { itemId: selectedItem.id });
              }}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>{t('noItems')}</Text>
              <Text style={styles.emptyDescription}>{t('adjustFilters')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function BottomItemCard({ item, onPress, onClose }) {
  const category = CATEGORIES.find((c) => c.id === item.category);
  const isLost = item.type === TYPE.LOST;
  const accent = isLost ? colors.markerLost : colors.markerFound;

  return (
    <TouchableOpacity style={styles.bottomCard} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.bottomCardAccent, { backgroundColor: accent }]} />
      <View style={styles.bottomCardThumb}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.bottomCardPhoto} />
        ) : (
          <Text style={styles.bottomCardIcon}>{category?.icon || '📦'}</Text>
        )}
      </View>
      <View style={styles.bottomCardContent}>
        <View style={styles.bottomCardRow}>
          <Text style={[styles.bottomCardType, { color: accent }]}>{isLost ? 'LOST' : 'FOUND'}</Text>
          <StatusBadge status={item.status} size="sm" />
        </View>
        <Text style={styles.bottomCardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.bottomCardLocation} numberOfLines={1}>📍 {item.location}</Text>
        <Text style={styles.bottomCardCta}>Tap for details →</Text>
      </View>
      <TouchableOpacity style={styles.bottomCardClose} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.bottomCardCloseText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function EmptyOverlay({ title, text }) {
  return (
    <View pointerEvents="none" style={styles.emptyOverlay}>
      <Text style={styles.emptyOverlayIcon}>🔍</Text>
      <Text style={styles.emptyOverlayTitle}>{title}</Text>
      <Text style={styles.emptyOverlayText}>{text}</Text>
    </View>
  );
}

function Pill({ icon, label, color, active, onPress }) {
  const activeColor = color || colors.primary;
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        active && { backgroundColor: activeColor, borderColor: activeColor },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {icon ? `${icon} ` : ''}{label}
      </Text>
    </TouchableOpacity>
  );
}

function CategoryChip({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.categoryChip, active && styles.categoryChipActive]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 24,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterPanel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  panelTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  panelHint: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearText: {
    fontSize: 22,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
  },
  filterBlock: {
    marginTop: spacing.md,
  },
  filterLabel: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.xs,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chipScrollContent: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textInverse,
  },
  categoryChip: {
    maxWidth: 160,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: colors.primary,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
  },
  clearFiltersText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    minHeight: 360,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    ...shadows.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  legendText: {
    ...typography.small,
    color: colors.textPrimary,
  },
  bottomCard: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  bottomCardAccent: {
    width: 4,
  },
  bottomCardThumb: {
    width: 60,
    height: 60,
    margin: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCardPhoto: {
    width: '100%',
    height: '100%',
  },
  bottomCardIcon: {
    fontSize: 28,
  },
  bottomCardContent: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    justifyContent: 'space-between',
  },
  bottomCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  bottomCardType: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bottomCardTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginVertical: 1,
  },
  bottomCardLocation: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bottomCardCta: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomCardClose: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.borderLight,
  },
  bottomCardCloseText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyOverlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '35%',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  emptyOverlayIcon: {
    fontSize: 34,
    marginBottom: spacing.sm,
  },
  emptyOverlayTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptyOverlayText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadows } from '../utils/theme';
import { useItems } from '../context/ItemsContext';
import { useAuth } from '../context/AuthContext';
import { LANGUAGE_OPTIONS, useLanguage } from '../context/LanguageContext';
import { DEFAULT_USER, TYPE, STATUS } from '../data/mockData';
import ItemCard from '../components/ItemCard';

export default function ProfileScreen({ navigation }) {
  const { getItemsByUser, resetToSeed, findPotentialMatches } = useItems();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const activeUser = user || DEFAULT_USER;
  const myItems = getItemsByUser(activeUser.email);

  const lostCount = myItems.filter((i) => i.type === TYPE.LOST).length;
  const foundCount = myItems.filter((i) => i.type === TYPE.FOUND).length;
  const returnedCount = myItems.filter((i) => i.status === STATUS.RETURNED).length;
  const matchAlerts = myItems
    .filter((item) => item.status !== STATUS.RETURNED)
    .flatMap((source) =>
      findPotentialMatches(source, 2).map((match) => ({ ...match, source }))
    )
    .slice(0, 3);

  function handleLogout() {
    Alert.alert(
      'Log out?',
      'You will return to the login screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  }

  function handleReset() {
    Alert.alert(
      'Reset data?',
      'This will restore the original mock items and remove any reports you created. Useful for demoing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetToSeed();
            Alert.alert('Done', 'Mock data has been restored.');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(activeUser.name)}
            </Text>
          </View>
          <Text style={styles.name}>{activeUser.name}</Text>
          <Text style={styles.email}>{activeUser.email}</Text>
          <Text style={styles.joined}>
            Member since {formatJoined(activeUser.joinedDate)}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.markerLost }]}>
                {lostCount}
              </Text>
              <Text style={styles.statLabel}>Lost</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.markerFound }]}>
                {foundCount}
              </Text>
              <Text style={styles.statLabel}>Found</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {returnedCount}
              </Text>
              <Text style={styles.statLabel}>Returned</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('myReports')}</Text>
          <Text style={styles.sectionSubtitle}>
            All items you've reported. Tap to view details or update status.
          </Text>

          {myItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptyDescription}>
                When you report a lost or found item, it'll show up here.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.emptyButtonText}>Create a report →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myItems.map((item) => (
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('matchAlerts')}</Text>
          <Text style={styles.sectionSubtitle}>
            Prototype notifications for possible Lost/Found matches.
          </Text>

          {matchAlerts.length === 0 ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>🔔 No match alerts yet</Text>
              <Text style={styles.infoText}>
                When one of your open reports matches an opposite Lost/Found report, it will be shown here.
              </Text>
            </View>
          ) : (
            matchAlerts.map(({ item, source, score, distanceKm }) => (
              <TouchableOpacity
                key={`${source.id}-${item.id}`}
                style={styles.matchAlertCard}
                onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
              >
                <Text style={styles.infoTitle}>🔔 {score}% match for “{source.title}”</Text>
                <Text style={styles.infoText}>
                  {item.type === TYPE.LOST ? 'Lost' : 'Found'}: {item.title} · {distanceKm} km away
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t('language')}</Text>
            <View style={styles.languageToggle}>
              {LANGUAGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.code}
                  style={[styles.languageButton, language === option.code && styles.languageButtonActive]}
                  onPress={() => setLanguage(option.code)}
                >
                  <Text
                    style={[
                      styles.languageButtonText,
                      language === option.code && styles.languageButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Vienna Lost & Found</Text>
            <Text style={styles.infoText}>
              A community-driven app for finding and returning lost items in Vienna.
              Built as part of an HCI course at the University of Vienna.
            </Text>
            <Text style={styles.infoVersion}>{t('prototypeVersion')}</Text>
          </View>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => navigation.navigate('Help')}
          >
            <Text style={styles.helpButtonText}>❔  {t('helpFaq')}</Text>
          </TouchableOpacity>



          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>🚪  {t('logout')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>🔄  {t('resetMock')}</Text>
          </TouchableOpacity>
          <Text style={styles.resetHelper}>
            Restores the original sample items - useful for demoing.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatJoined(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    backgroundColor: colors.surface,
    margin: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  avatarText: {
    ...typography.h1,
    color: colors.textInverse,
    fontSize: 32,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  joined: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statValue: {
    ...typography.h2,
    fontSize: 24,
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
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
    marginBottom: spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  emptyButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  infoTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  infoVersion: {
    ...typography.small,
    color: colors.textTertiary,
  },
  helpButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  helpButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
  },

  matchAlertCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  languageToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  languageButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  languageButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  languageButtonTextActive: {
    color: colors.textInverse,
  },

  logoutButton: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: spacing.md,
  },
  logoutButtonText: {
    ...typography.bodyBold,
    color: colors.accent,
  },
  resetButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  resetHelper: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

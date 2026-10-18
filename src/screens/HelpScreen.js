import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadows } from '../utils/theme';

const FAQ_ITEMS = [
  {
    question: 'How does matching work?',
    answer:
      'The app compares lost and found reports by category, title, description and nearby Vienna location. Similar reports can be opened from Browse to check whether they match.',
  },
  {
    question: 'How do I contact someone?',
    answer:
      'Open an item detail page and use the available contact action. Contact information should only be shared when both sides agree that the item could match.',
  },
  {
    question: 'What should I do with official documents?',
    answer:
      'Do not publish full ID numbers or sensitive personal details. If possible, hand official documents to an official lost property office or the responsible institution.',
  },
];

const SAFETY_TIPS = [
  'Meet in a public place.',
  'Do not share sensitive personal information.',
  'Ask for hidden details before returning valuable items.',
];

export default function HelpScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Help & FAQ</Text>
        <Text style={styles.subtitle}>
          Short answers and safety tips for using Vienna Lost & Found.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Safety tips</Text>
          {SAFETY_TIPS.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Text style={styles.tipIcon}>🔒</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Frequently asked questions</Text>
          {FAQ_ITEMS.map((item) => (
            <View key={item.question} style={styles.faqItem}>
              <Text style={styles.question}>{item.question}</Text>
              <Text style={styles.answer}>{item.answer}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.md,
  },
  backText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    marginTop: 1,
  },
  tipText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  faqItem: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  question: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  answer: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});

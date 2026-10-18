import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadows } from '../utils/theme';
import { useItems } from '../context/ItemsContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, TYPE, STATUS, DEFAULT_USER } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';

export default function ItemDetailScreen({ route, navigation }) {
  const { itemId } = route.params;
  const { getItemById, updateItem, deleteItem, findPotentialMatches } = useItems();
  const { user } = useAuth();
  const activeUser = user || DEFAULT_USER;
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [message, setMessage] = useState('');

  const item = getItemById(itemId);

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Item not found.</Text>
      </SafeAreaView>
    );
  }

  const category = CATEGORIES.find((c) => c.id === item.category);
  const isLost = item.type === TYPE.LOST;
  const accent = isLost ? colors.markerLost : colors.markerFound;
  const isOwnItem = item.reportedBy?.email === activeUser.email;
  const possibleMatches = findPotentialMatches(item, 3);

  function handleSendEmail() {
    if (!message.trim()) {
      Alert.alert('Empty message', 'Please write a message before sending.');
      return;
    }
    const subject = encodeURIComponent(`Vienna Lost & Found: ${item.title}`);
    const body = encodeURIComponent(
      `Hello ${item.reportedBy.name},\n\n` +
        `I'm contacting you about the ${isLost ? 'lost' : 'found'} item "${item.title}" you reported on the Vienna Lost & Found app.\n\n` +
        `${message}\n\n` +
        `Best regards,\n${activeUser.name}\n${activeUser.email}`
    );
    const mailtoUrl = `mailto:${item.reportedBy.email}?subject=${subject}&body=${body}`;

    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mailtoUrl);
          setContactModalVisible(false);
          setMessage('');
          Alert.alert(
            'Email composed',
            'Your email client has been opened. Send the message to complete contact.'
          );
        } else {
          Alert.alert(
            'No email app',
            `Could not open an email client. You can manually contact: ${item.reportedBy.email}`
          );
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open the email composer.');
      });
  }

  function handleStatusChange(newStatus) {
    updateItem(item.id, { status: newStatus });
    setStatusModalVisible(false);
  }

  function handleDelete() {
    Alert.alert(
      'Delete report',
      'Are you sure you want to delete this report? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteItem(item.id);
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>←  Back</Text>
          </TouchableOpacity>
          {isOwnItem && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.photoContainer}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>{category?.icon || '📦'}</Text>
            </View>
          )}
          <View style={[styles.typeRibbon, { backgroundColor: accent }]}>
            <Text style={styles.typeRibbonText}>
              {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <StatusBadge status={item.status} />
          </View>

          <Text style={styles.categoryText}>
            {category?.icon} {category?.label}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          <View style={styles.detailsGrid}>
            <DetailRow icon="📍" label="Location" value={item.location} />
            <DetailRow icon="📅" label="Date" value={formatDate(item.date)} />
            {item.time && (
              <DetailRow icon="🕐" label="Time" value={item.time} />
            )}
            <DetailRow icon="👤" label="Reported by" value={item.reportedBy?.name} />
          </View>

          {possibleMatches.length > 0 && (
            <View style={styles.matchBox}>
              <Text style={styles.sectionLabel}>Possible matches</Text>
              <Text style={styles.matchHint}>
                Similar opposite Lost/Found reports near this location.
              </Text>
              {possibleMatches.map(({ item: match, score, distanceKm }) => (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchOption}
                  onPress={() => navigation.push('ItemDetail', { itemId: match.id })}
                >
                  <Text style={styles.matchOptionTitle} numberOfLines={1}>
                    {match.type === TYPE.LOST ? '🔍 Lost' : '📍 Found'}: {match.title}
                  </Text>
                  <Text style={styles.matchOptionMeta}>
                    {score}% match · {distanceKm} km away · {match.location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!isOwnItem && item.status !== STATUS.RETURNED && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: accent }]}
              onPress={() => setContactModalVisible(true)}
            >
              <Text style={styles.primaryButtonText}>
                ✉️  Contact {item.reportedBy.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          )}

          {isOwnItem && (
            <View style={styles.ownerActions}>
              <Text style={styles.ownerNotice}>
                ℹ️  This is your report. You can update its status as the situation develops.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={() => setStatusModalVisible(true)}
              >
                <Text style={styles.primaryButtonText}>
                  🔄  Update Status
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {item.status === STATUS.RETURNED && (
            <View style={styles.returnedBanner}>
              <Text style={styles.returnedText}>
                ✅ This item has been returned to its owner.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={contactModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setContactModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Contact {item.reportedBy.name}</Text>
            <Text style={styles.modalSubtitle}>
              Your message will be sent via email. Your email address will be visible to the recipient.
            </Text>

            <Text style={styles.inputLabel}>Your message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder={`Hi! I think this might be my ${item.title.toLowerCase()}...`}
              placeholderTextColor={colors.textTertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setContactModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: accent }]}
                onPress={handleSendEmail}
              >
                <Text style={styles.sendButtonText}>Send via Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={statusModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Update Status</Text>
            <Text style={styles.modalSubtitle}>
              Mark how things are going with this item.
            </Text>

            <StatusOption
              icon="⏳"
              label="Pending"
              description="Still searching / waiting for owner"
              selected={item.status === STATUS.PENDING}
              onPress={() => handleStatusChange(STATUS.PENDING)}
            />
            <StatusOption
              icon="🤝"
              label="Claimed"
              description="Someone reached out, in contact"
              selected={item.status === STATUS.CLAIMED}
              onPress={() => handleStatusChange(STATUS.CLAIMED)}
            />
            <StatusOption
              icon="✅"
              label="Returned"
              description="Item has been returned to owner"
              selected={item.status === STATUS.RETURNED}
              onPress={() => handleStatusChange(STATUS.RETURNED)}
            />

            <TouchableOpacity
              style={styles.cancelButtonFull}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '-'}</Text>
      </View>
    </View>
  );
}

function StatusOption({ icon, label, description, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.statusOption, selected && styles.statusOptionSelected]}
      onPress={onPress}
    >
      <Text style={styles.statusOptionIcon}>{icon}</Text>
      <View style={styles.statusOptionText}>
        <Text style={styles.statusOptionLabel}>{label}</Text>
        <Text style={styles.statusOptionDescription}>{description}</Text>
      </View>
      {selected && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );
}

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  backText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteText: {
    fontSize: 20,
  },
  photoContainer: {
    height: 250,
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.borderLight,
  },
  photoIcon: {
    fontSize: 80,
  },
  typeRibbon: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  typeRibbonText: {
    ...typography.small,
    color: colors.textInverse,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  itemTitle: {
    flex: 1,
    ...typography.h1,
    color: colors.textPrimary,
  },
  categoryText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  detailsGrid: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 20,
    marginRight: spacing.md,
    width: 28,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    marginTop: 2,
  },
  matchBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  matchHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  matchOption: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  matchOptionTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  matchOptionMeta: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },

  primaryButton: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
    fontSize: 16,
  },
  ownerActions: {
    gap: spacing.md,
  },
  ownerNotice: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    lineHeight: 18,
  },
  returnedBanner: {
    backgroundColor: colors.successLight,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  returnedText: {
    ...typography.bodyBold,
    color: colors.success,
  },
  notFound: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  inputLabel: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  messageInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 120,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.borderLight,
  },
  cancelButtonFull: {
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    marginTop: spacing.md,
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  sendButton: {
    flex: 2,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  sendButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },

  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  statusOptionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  statusOptionText: {
    flex: 1,
  },
  statusOptionLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  statusOptionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
  },
});

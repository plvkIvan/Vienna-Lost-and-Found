import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import { colors, radius, spacing, typography, shadows } from '../utils/theme';
import { useItems } from '../context/ItemsContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, TYPE, STATUS, DEFAULT_USER, VIENNA_REGION } from '../data/mockData';
import { reverseGeocode } from '../utils/geocoding';
import { findPotentialMatches as findPotentialMatchesForItem } from '../utils/matching';

const DRAFT_STORAGE_KEY = '@vienna_lost_found_report_draft_v1';

export default function ReportScreen({ route, navigation }) {
  const initialType = route.params?.type || TYPE.FOUND;
  const [type, setType] = useState(initialType);
  const [photo, setPhoto] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(null);
  const [description, setDescription] = useState('');

  const [coordinate, setCoordinate] = useState({
    latitude: VIENNA_REGION.latitude,
    longitude: VIENNA_REGION.longitude,
  });
  const [locationLabel, setLocationLabel] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);
  const [labelManuallyEdited, setLabelManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedItem, setSubmittedItem] = useState(null);
  const [possibleMatches, setPossibleMatches] = useState([]);
  const [draftSavedAt, setDraftSavedAt] = useState(null);

  const geocodeTimer = useRef(null);
  const mapRef = useRef(null);
  const addressInputRef = useRef(null);
  const { items, addItem } = useItems();
  const { user: currentUser } = useAuth();

  const isLost = type === TYPE.LOST;
  const accent = isLost ? '#d0021b' : '#2d9134';

  const hasUnsavedChanges = useMemo(
    () =>
      Boolean(
        title.trim() ||
          category ||
          description.trim() ||
          locationLabel.trim() ||
          photo ||
          coordinate.latitude !== VIENNA_REGION.latitude ||
          coordinate.longitude !== VIENNA_REGION.longitude
      ),
    [title, category, description, locationLabel, photo, coordinate]
  );


  const fetchAddressFor = useCallback(async (lat, lon) => {
    setIsGeocoding(true);
    setGeocodeFailed(false);
    const label = await reverseGeocode(lat, lon);
    setIsGeocoding(false);

    if (label) {
      setLocationLabel(label);
      setGeocodeFailed(false);
      return;
    }

    setGeocodeFailed(true);
  }, []);

  useEffect(() => {
    if (labelManuallyEdited) return;
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => {
      fetchAddressFor(coordinate.latitude, coordinate.longitude);
    }, 700);
    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    };
  }, [coordinate, labelManuallyEdited, fetchAddressFor]);

  function handleRefreshAddress() {
    setLabelManuallyEdited(false);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    fetchAddressFor(coordinate.latitude, coordinate.longitude);
  }

  function handleLabelChange(text) {
    setLocationLabel(text);
    setLabelManuallyEdited(true);
    setGeocodeFailed(false);
  }

  function handleCancel() {
    if (!hasUnsavedChanges) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Discard this report?',
      'You have unsaved changes.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }

  async function handlePickPhoto() {
    try {
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert(
          'Permission required',
          'Please allow photo library access to upload an image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        'Photo could not be uploaded.',
        'Your report was saved without photo.',
        [{ text: 'Try again', onPress: handlePickPhoto }]
      );
    }
  }

  async function handleTakePhoto() {
    try {
      const permResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert(
          'Permission required',
          'Please allow camera access to take a photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        'Photo could not be uploaded.',
        'Your report was saved without photo.',
        [{ text: 'Try again', onPress: handleTakePhoto }]
      );
    }
  }

  function buildDraftPayload() {
    return {
      type,
      title,
      category,
      description,
      location: locationLabel,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      photo,
      savedAt: new Date().toISOString(),
    };
  }

  async function saveDraft() {
    try {
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(buildDraftPayload()));
      const now = new Date();
      setDraftSavedAt(now.toTimeString().slice(0, 5));
      Alert.alert('Draft saved', 'Your current report input was saved as a draft.');
    } catch (error) {
      Alert.alert('Draft could not be saved', 'Please try again.');
    }
  }

  function restoreDraft(draft) {
    if (!draft) return;

    setType(draft.type || initialType);
    setPhoto(draft.photo || null);
    setTitle(draft.title || '');
    setCategory(draft.category || null);
    setDescription(draft.description || '');
    setLocationLabel(draft.location || '');

    setCoordinate({
      latitude: Number(draft.latitude) || VIENNA_REGION.latitude,
      longitude: Number(draft.longitude) || VIENNA_REGION.longitude,
    });

    setLabelManuallyEdited(Boolean(draft.location));
    setGeocodeFailed(false);

    if (draft.savedAt) {
      const savedDate = new Date(draft.savedAt);
      setDraftSavedAt(savedDate.toTimeString().slice(0, 5));
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSavedDraft() {
      try {
        const rawDraft = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);

        if (!rawDraft || !isMounted) return;

        const draft = JSON.parse(rawDraft);

        Alert.alert(
          'Open saved draft?',
          'A saved report draft was found. Do you want to continue editing it?',
          [
            {
              text: 'Discard draft',
              style: 'destructive',
              onPress: async () => {
                await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);

                if (isMounted) {
                  setDraftSavedAt(null);
                }
              },
            },
            {
              text: 'Open draft',
              onPress: () => {
                restoreDraft(draft);
              },
            },
          ]
        );
      } catch (error) {
        console.error('Failed to load saved draft:', error);
      }
    }

    loadSavedDraft();

    return () => {
      isMounted = false;
    };
  }, []);


  function validateForm() {
    if (!title.trim()) {
      Alert.alert('Missing info', 'Please give the item a short title.');
      return false;
    }
    if (!category) {
      Alert.alert('Missing info', 'Please pick a category.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert(
        'Missing info',
        'A short description helps a lot - please add a few details.'
      );
      return false;
    }
    if (!locationLabel.trim()) {
      Alert.alert(
        'Missing info',
        'Please add a short location label (e.g. "Stephansplatz") and place the pin on the map.'
      );
      return false;
    }
    return true;
  }

  function buildMatchCandidate() {
    return {
      id: 'draft_report',
      type,
      title: title.trim(),
      category,
      description: description.trim(),
      location: locationLabel.trim(),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      status: STATUS.PENDING,
    };
  }

  function findDuplicateItem() {
    if (!category) return null;

    const match = findPotentialMatchesForItem(buildMatchCandidate(), items, 1)[0];
    return match?.item || null;
  }

  async function createReport(skipDuplicateCheck = false) {
    if (!validateForm()) return;

    const duplicateItem = findDuplicateItem();
    if (duplicateItem && !skipDuplicateCheck) {
      Alert.alert(
        'Possible match found nearby.',
        'A report with the opposite status, same category and nearby location already exists. Do you want to check it first?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View possible matches',
            onPress: () => navigation.navigate('Main', {
              screen: 'Browse',
              params: {
                typeFilter: type === TYPE.LOST ? TYPE.FOUND : TYPE.LOST,
                categoryFilter: category,
                viewMode: 'list',
              },
            }),
          },
          {
            text: 'Continue anyway',
            onPress: () => createReport(true),
          },
        ]
      );
      return;
    }

    const today = new Date();
    const newItem = {
      type,
      title: title.trim(),
      category,
      description: description.trim(),
      location: locationLabel.trim(),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      date: today.toISOString().split('T')[0],
      time: today.toTimeString().slice(0, 5),
      photo,
      reportedBy: {
        name: currentUser?.name || DEFAULT_USER.name,
        email: currentUser?.email || DEFAULT_USER.email,
      },
    };

    try {
      setIsSubmitting(true);
      const createdItem = await addItem(newItem);
      const matches = findPotentialMatchesForItem(createdItem, items, 3);
      setPossibleMatches(matches);
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
      setSubmittedItem(createdItem);
    } catch (error) {
      try {
        await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(buildDraftPayload()));
        setDraftSavedAt(new Date().toTimeString().slice(0, 5));
      } catch (draftError) {
        console.error('Failed to save report draft:', draftError);
      }

      Alert.alert(
        'Report could not be submitted.',
        'Your input was saved as a draft.',
        [
          { text: 'Retry', onPress: () => createReport(skipDuplicateCheck) },
          { text: 'Save draft', onPress: saveDraft },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit() {
    createReport(false);
  }

  if (submittedItem) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={[styles.successIconCircle, { backgroundColor: accent }]}> 
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Report submitted successfully!</Text>
          <Text style={styles.successText}>
            We checked the current reports and will show possible matches below.
          </Text>

          {possibleMatches.length > 0 ? (
            <View style={styles.matchCard}>
              <Text style={styles.matchCardTitle}>🔔 Possible matches found</Text>
              <Text style={styles.matchCardText}>
                These reports have the opposite status, a similar category and a nearby location.
              </Text>
              {possibleMatches.map(({ item, score, distanceKm }) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.matchRow}
                  onPress={() => navigation.replace('ItemDetail', { itemId: item.id })}
                >
                  <Text style={styles.matchTitle} numberOfLines={1}>
                    {item.type === TYPE.LOST ? '🔍 Lost' : '📍 Found'}: {item.title}
                  </Text>
                  <Text style={styles.matchMeta}>
                    {score}% match · {distanceKm} km away · {item.location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noMatchCard}>
              <Text style={styles.noMatchTitle}>🔔 No direct match yet</Text>
              <Text style={styles.noMatchText}>
                The app will highlight possible matches when matching reports exist in the prototype data.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.successPrimaryButton, { backgroundColor: accent }]}
            onPress={() => {
              if (!submittedItem?.id) {
                Alert.alert(
                  'Report not available',
                  'The created report could not be opened.'
                );
                return;
              }

              navigation.replace('ItemDetail', { itemId: submittedItem.id });
            }}
          >
            <Text style={styles.successPrimaryButtonText}>View report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.successSecondaryButton}
            onPress={() => navigation.popToTop()}
          >
            <Text style={styles.successSecondaryButtonText}>Back to home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
          >
            <Text style={styles.backText}>←  Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.screenTitle}>
            Report {isLost ? 'a Lost' : 'a Found'} Item
          </Text>
          <Text style={styles.screenSubtitle}>
            Provide as much detail as possible - it really helps the search.
          </Text>

          
<View style={styles.typeToggle}>
  <TouchableOpacity
    style={[
      styles.typeOption,
      type === TYPE.FOUND && {
        backgroundColor: '#2d9134',
        borderColor: '#2d9134',
      },
    ]}
    onPress={() => setType(TYPE.FOUND)}
  >
    <Text style={[styles.typeOptionText, type === TYPE.FOUND && styles.typeOptionTextActive]}>
      📍 I found this
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.typeOption,
      type === TYPE.LOST && {
        backgroundColor: '#d0021b',
        borderColor: '#d0021b',
      },
    ]}
    onPress={() => setType(TYPE.LOST)}
  >
    <Text style={[styles.typeOptionText, type === TYPE.LOST && styles.typeOptionTextActive]}>
      🔍 I lost this
    </Text>
  </TouchableOpacity>
</View>

          <Text style={styles.fieldLabel}>Photo {!photo && '(optional)'}</Text>
          {photo ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() => setPhoto(null)}
              >
                <Text style={styles.photoRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
         ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handleTakePhoto}
              >
                <Text style={styles.photoButtonIcon}>📷</Text>
                <Text style={styles.photoButtonLabel}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={handlePickPhoto}
              >
                <Text style={styles.photoButtonIcon}>🖼️</Text>
                <Text style={styles.photoButtonLabel}>Choose from Library</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.fieldLabel}>Item name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Black Leather Wallet"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.fieldLabel}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  category === cat.id && styles.categoryItemActive,
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    category === cat.id && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the item: colour, size, distinguishing features, where exactly..."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.fieldLabel}>Location in Vienna *</Text>
          <Text style={styles.fieldHelper}>
            Drag the map so the red pin sits where the item was {isLost ? 'lost' : 'found'}.
            The address will fill in automatically - you can edit it.
          </Text>


          <View style={styles.mapPickerContainer}>
            <MapView
              ref={mapRef}
              style={styles.mapPicker}
              provider={PROVIDER_DEFAULT}
              initialRegion={{
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
              onRegionChangeComplete={(region) => {
                setCoordinate({
                  latitude: region.latitude,
                  longitude: region.longitude,
                });
              }}
            />
            <View pointerEvents="none" style={styles.centerPinOverlay}>
              <Text style={[styles.centerPinIcon, { color: accent }]}>📍</Text>
            </View>
            <View style={styles.coordinateBadge}>
              <Text style={styles.coordinateText}>
                {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
              </Text>
            </View>
          </View>

          {geocodeFailed && !labelManuallyEdited && (
            <InlineActionBox
              title="No connection."
              text="Please check your internet connection and try again."
              primaryLabel="Retry"
              onPrimaryPress={handleRefreshAddress}
            />
          )}

          <View style={styles.addressFieldWrapper}>
            <TextInput
              ref={addressInputRef}
              style={[styles.input, styles.locationLabelInput]}
              placeholder={
                isGeocoding
                  ? 'Looking up address...'
                  : 'Address will fill in automatically'
              }
              placeholderTextColor={colors.textTertiary}
              value={locationLabel}
              onChangeText={handleLabelChange}
              maxLength={80}
            />
            {isGeocoding && (
              <View style={styles.addressFieldStatus}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            {!isGeocoding && labelManuallyEdited && (
              <TouchableOpacity
                style={styles.addressFieldStatus}
                onPress={handleRefreshAddress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.refreshIcon}>↻</Text>
              </TouchableOpacity>
            )}
          </View>
          {labelManuallyEdited && !isGeocoding && (
            <Text style={styles.fieldHelperSmall}>
              Tap ↻ to reset to the automatic address from the map.
            </Text>
          )}


          <View style={styles.safetyCard}>
            <Text style={styles.safetyTitle}>Safety tips</Text>
            <Text style={styles.safetyText}>• Meet in a public place.</Text>
            <Text style={styles.safetyText}>• Do not share sensitive personal information.</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: accent },
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.submitLoadingRow}>
                <ActivityIndicator size="small" color={colors.textInverse} />
                <Text style={styles.submitButtonText}>Submitting your report...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                Submit {isLost ? 'Lost' : 'Found'} Report
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveDraftButton}
            onPress={saveDraft}
            disabled={isSubmitting}
          >
            <Text style={styles.saveDraftButtonText}>Save draft</Text>
          </TouchableOpacity>
          {draftSavedAt && (
            <Text style={styles.draftSavedText}>Draft saved at {draftSavedAt}</Text>
          )}

          <Text style={styles.privacyNote}>
            🔒 Your contact info is only revealed when someone messages you.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InlineActionBox({ title, text, primaryLabel, onPrimaryPress, secondaryLabel, onSecondaryPress }) {
  return (
    <View style={styles.inlineBox}>
      <View style={styles.inlineBoxTextWrap}>
        <Text style={styles.inlineBoxTitle}>{title}</Text>
        <Text style={styles.inlineBoxText}>{text}</Text>
      </View>
      <View style={styles.inlineBoxActions}>
        {primaryLabel && (
          <TouchableOpacity style={styles.inlineBoxButton} onPress={onPrimaryPress}>
            <Text style={styles.inlineBoxButtonText}>{primaryLabel}</Text>
          </TouchableOpacity>
        )}
        {secondaryLabel && (
          <TouchableOpacity style={styles.inlineBoxSecondaryButton} onPress={onSecondaryPress}>
            <Text style={styles.inlineBoxSecondaryButtonText}>{secondaryLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  backText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  screenTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  screenSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  typeOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  typeOptionText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  typeOptionTextActive: {
    color: colors.textInverse,
  },
  fieldLabel: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  fieldHelper: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoButtonIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  photoButtonLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  photoPreview: {
    height: 200,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: colors.textInverse,
    fontSize: 22,
    lineHeight: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  
categoryItem: {
  width: '31%',
  backgroundColor: colors.surface,
  borderRadius: radius.md,
  paddingVertical: spacing.md,
  alignItems: 'center',
  borderWidth: 1.5,
  borderColor: colors.border,
  minHeight: 90,        
  justifyContent: 'center',
  elevation: 2,        
},
categoryLabel: {
  fontSize: 14,         
  fontWeight: '600',   
  color: colors.textSecondary,
  textAlign: 'center',
  paddingHorizontal: 2,
},
  categoryLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  inlineBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  inlineBoxTextWrap: {
    marginBottom: spacing.sm,
  },
  inlineBoxTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  inlineBoxText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inlineBoxActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  inlineBoxButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inlineBoxButtonText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
  },
  inlineBoxSecondaryButton: {
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inlineBoxSecondaryButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  addressFieldWrapper: {
    position: 'relative',
    marginTop: spacing.sm,
  },
  addressFieldStatus: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
  },
  fieldHelperSmall: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  
mapPickerContainer: {
  height: 210,          
  borderRadius: radius.lg,
  overflow: 'hidden',
  marginTop: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
  position: 'relative',
  elevation: 4,         
},
  mapPicker: {
    flex: 1,
  },
  centerPinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    
    paddingBottom: 24,
  },
  centerPinIcon: {
    fontSize: 36,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  coordinateBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  coordinateText: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    color: colors.textSecondary,
  },
  locationLabelInput: {
    paddingRight: 40, 
  },
  safetyCard: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  safetyTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  safetyText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  submitButton: {
    backgroundColor: '#2d9134',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
    fontSize: 17,
  },
  saveDraftButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveDraftButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  draftSavedText: {
    ...typography.small,
    color: colors.success,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  privacyNote: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  matchCard: {
    width: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  matchCardTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  matchCardText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  matchRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  matchTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  matchMeta: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 3,
  },
  noMatchCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noMatchTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  noMatchText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  categoryItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  categoryIcon: {
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  successIcon: {
    fontSize: 44,
    color: colors.textInverse,
    fontWeight: '800',
  },
  successTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  successPrimaryButton: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  successPrimaryButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  successSecondaryButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  successSecondaryButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
});

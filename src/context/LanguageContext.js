import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@vienna_lost_found_language_v1';

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
];

const STRINGS = {
  en: {
    appTitle: 'Vienna Lost & Found',
    homeSubtitle: 'Help reunite people with their lost belongings.',
    reportFound: 'Report Found',
    reportLost: 'Report Lost',
    recentActivity: 'Recent activity',
    seeAll: 'See all',
    searchAndFilters: 'Search & filters',
    browseTitle: 'Browse Items',
    browseHint: 'Search is always visible. Use the chips below to narrow the result.',
    searchPlaceholder: 'Search title, location, category...',
    all: 'All',
    lost: 'Lost',
    found: 'Found',
    map: 'Map',
    list: 'List',
    viewMode: 'View mode',
    reportType: 'Report type',
    categories: 'Categories',
    allCategories: 'All categories',
    status: 'Status',
    open: 'Open',
    claimed: 'Claimed',
    returned: 'Returned',
    clearFilters: 'Clear filters',
    matchingItems: 'items matching your filters',
    noItems: 'No items found',
    adjustFilters: 'Try another search term or clear the filters.',
    possibleMatches: 'Possible matches',
    possibleMatchesHint: 'These reports look similar by category and nearby location.',
    profile: 'Profile',
    myReports: 'My Reports',
    settings: 'Settings',
    language: 'Language',
    matchAlerts: 'Match alerts',
    helpFaq: 'Help, FAQ & safety tips',
    resetMock: 'Reset to mock data',
    logout: 'Log out',
    prototypeVersion: 'Prototype v1.3 - M4 usability update',
  },
  de: {
    appTitle: 'Vienna Lost & Found',
    homeSubtitle: 'Hilf mit, verlorene Gegenstände wiederzufinden.',
    reportFound: 'Fund melden',
    reportLost: 'Verlust melden',
    recentActivity: 'Aktuelle Meldungen',
    seeAll: 'Alle anzeigen',
    searchAndFilters: 'Suche & Filter',
    browseTitle: 'Meldungen durchsuchen',
    browseHint: 'Die Suche ist immer sichtbar. Mit den Chips unten kannst du das Ergebnis eingrenzen.',
    searchPlaceholder: 'Titel, Ort, Kategorie suchen...',
    all: 'Alle',
    lost: 'Verloren',
    found: 'Gefunden',
    map: 'Karte',
    list: 'Liste',
    viewMode: 'Ansicht',
    reportType: 'Meldungstyp',
    categories: 'Kategorien',
    allCategories: 'Alle Kategorien',
    status: 'Status',
    open: 'Offen',
    claimed: 'In Kontakt',
    returned: 'Zurückgegeben',
    clearFilters: 'Filter zurücksetzen',
    matchingItems: 'Meldungen passend zu deinen Filtern',
    noItems: 'Keine Meldungen gefunden',
    adjustFilters: 'Versuche einen anderen Suchbegriff oder setze die Filter zurück.',
    possibleMatches: 'Mögliche Treffer',
    possibleMatchesHint: 'Diese Meldungen passen nach Kategorie und nahem Standort.',
    profile: 'Profil',
    myReports: 'Meine Meldungen',
    settings: 'Einstellungen',
    language: 'Sprache',
    matchAlerts: 'Treffer-Hinweise',
    helpFaq: 'Hilfe, FAQ & Sicherheitstipps',
    resetMock: 'Mock-Daten zurücksetzen',
    logout: 'Abmelden',
    prototypeVersion: 'Prototype v1.3 - M4 Usability-Update',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    async function loadLanguage() {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored === 'de' || stored === 'en') {
          setLanguageState(stored);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      }
    }

    loadLanguage();
  }, []);

  async function setLanguage(nextLanguage) {
    if (nextLanguage !== 'de' && nextLanguage !== 'en') return;
    setLanguageState(nextLanguage);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key) => STRINGS[language]?.[key] || STRINGS.en[key] || key,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside a LanguageProvider');
  }
  return ctx;
}

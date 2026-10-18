import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEED_ITEMS, STATUS } from '../data/mockData';
import { findPotentialMatches as findPotentialMatchesForItem } from '../utils/matching';

const STORAGE_KEY = '@vienna_lost_found_items_v1';

const ItemsContext = createContext(null);

export function ItemsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        setItems(SEED_ITEMS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ITEMS));
      }
    } catch (error) {
      console.error('Failed to load items:', error);
      setItems(SEED_ITEMS);
    } finally {
      setLoading(false);
    }
  }

  async function persistItems(newItems) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error('Failed to persist items:', error);
    }
  }

  async function addItem(itemData) {
    const newItem = {
      id: `item_${Date.now()}`,
      status: STATUS.PENDING,
      createdAt: new Date().toISOString(),
      ...itemData,
    };
    const updated = [newItem, ...items];
    setItems(updated);
    await persistItems(updated);
    return newItem;
  }

  async function updateItem(itemId, updates) {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setItems(updated);
    await persistItems(updated);
  }

  async function deleteItem(itemId) {
    const updated = items.filter((item) => item.id !== itemId);
    setItems(updated);
    await persistItems(updated);
  }

  async function resetToSeed() {
    setItems(SEED_ITEMS);
    await persistItems(SEED_ITEMS);
  }

  function getItemById(itemId) {
    return items.find((item) => item.id === itemId);
  }

  function getItemsByUser(userEmail) {
    return items.filter((item) => item.reportedBy?.email === userEmail);
  }

  function findPotentialMatches(item, limit = 3) {
    return findPotentialMatchesForItem(item, items, limit);
  }

  return (
    <ItemsContext.Provider
      value={{
        items,
        loading,
        addItem,
        updateItem,
        deleteItem,
        resetToSeed,
        getItemById,
        getItemsByUser,
        findPotentialMatches,
      }}
    >
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const ctx = useContext(ItemsContext);
  if (!ctx) {
    throw new Error('useItems must be used inside an ItemsProvider');
  }
  return ctx;
}

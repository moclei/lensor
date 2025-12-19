import { useState, useEffect, useCallback } from 'react';

// ============ Types ============

export interface SavedColor {
  id: string;
  color: string; // RGB or hex format
  label: string; // User-defined label
  savedAt: number; // Timestamp
}

// Storage key for chrome.storage.sync
export const SAVED_COLORS_STORAGE_KEY = 'lensorSavedColors';

// Maximum number of saved colors (sync storage has limits)
export const MAX_SAVED_COLORS = 50;

// ============ Utilities ============

/** Generate a unique ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Convert any color format to a display-friendly hex */
export function colorToHex(color: string): string {
  if (color.startsWith('#')) return color.toUpperCase();
  
  // Parse rgb(r, g, b) format
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  
  return color.toUpperCase();
}

// ============ Hook ============

/**
 * Hook for managing saved colors in chrome.storage.sync
 */
export function useSavedColors() {
  const [savedColors, setSavedColorsState] = useState<SavedColor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved colors from storage on mount
  useEffect(() => {
    chrome.storage.sync.get([SAVED_COLORS_STORAGE_KEY], (result) => {
      if (result[SAVED_COLORS_STORAGE_KEY]) {
        setSavedColorsState(result[SAVED_COLORS_STORAGE_KEY]);
      }
      setIsLoading(false);
    });
  }, []);

  // Listen for changes from other contexts
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'sync' && changes[SAVED_COLORS_STORAGE_KEY]) {
        setSavedColorsState(changes[SAVED_COLORS_STORAGE_KEY].newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Save a new color
  const saveColor = useCallback(
    (color: string, label?: string) => {
      const hexColor = colorToHex(color);
      
      // Check if color already exists
      const exists = savedColors.some(
        (c) => colorToHex(c.color) === hexColor
      );
      if (exists) {
        return false; // Already saved
      }

      const newColor: SavedColor = {
        id: generateId(),
        color: color,
        label: label || '', // Empty by default, user can name it
        savedAt: Date.now(),
      };

      // Add to beginning, limit total count
      const newColors = [newColor, ...savedColors].slice(0, MAX_SAVED_COLORS);
      setSavedColorsState(newColors);
      chrome.storage.sync.set({ [SAVED_COLORS_STORAGE_KEY]: newColors });
      return true;
    },
    [savedColors]
  );

  // Update a color's label
  const updateLabel = useCallback(
    (id: string, newLabel: string) => {
      const newColors = savedColors.map((c) =>
        c.id === id ? { ...c, label: newLabel } : c
      );
      setSavedColorsState(newColors);
      chrome.storage.sync.set({ [SAVED_COLORS_STORAGE_KEY]: newColors });
    },
    [savedColors]
  );

  // Delete a saved color
  const deleteColor = useCallback(
    (id: string) => {
      const newColors = savedColors.filter((c) => c.id !== id);
      setSavedColorsState(newColors);
      chrome.storage.sync.set({ [SAVED_COLORS_STORAGE_KEY]: newColors });
    },
    [savedColors]
  );

  // Clear all saved colors
  const clearAll = useCallback(() => {
    setSavedColorsState([]);
    chrome.storage.sync.set({ [SAVED_COLORS_STORAGE_KEY]: [] });
  }, []);

  return {
    savedColors,
    isLoading,
    saveColor,
    updateLabel,
    deleteColor,
    clearAll,
  };
}


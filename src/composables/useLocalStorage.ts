import { ref, onUnmounted, readonly } from 'vue';

export interface TeleprompterSettings {
  scriptText: string;
  linesToShow: number;
  scrollTrigger: number;
  textSize: number;
  primaryLanguage: string;
  lastSaved?: string;
}

export interface UseLocalStorageOptions {
  storageKey?: string;
  autoSaveDelay?: number;
  onSave?: (settings: TeleprompterSettings) => void;
}

export const useLocalStorage = (options: UseLocalStorageOptions = {}) => {
  const storageKey = options.storageKey ?? 'speechTeleprompterSettings';
  const autoSaveDelay = options.autoSaveDelay ?? 1000; // 1 second delay for auto-save
  let saveTimeout: number | null = null;

  // Reactive state
  const isSaving = ref(false);
  const lastSaved = ref<Date | null>(null);

  /**
   * Get default settings
   */
  const getDefaultSettings = (): TeleprompterSettings => {
    return {
      scriptText:
        'Welcome to our presentation. Today we will be discussing the future of technology and how it impacts our daily lives. Let me start by sharing some interesting statistics about digital transformation in various industries. [ATTACHMENT:SLIDE_1]The global digital transformation market is expected to reach 3.3 trillion dollars by 2025. This represents a significant shift in how businesses operate and compete in the modern economy.[/ATTACHMENT] Now let me show you some key trends that are shaping this transformation. These trends are not just theoretical concepts but real changes happening right now. [ATTACHMENT:SLIDE_2]Artificial intelligence and machine learning are driving unprecedented changes across sectors. From healthcare to finance, from manufacturing to retail, no industry remains untouched by this technological revolution.[/ATTACHMENT] The impact of these technologies goes beyond just automation. They are creating new business models and opportunities that we never imagined before. [ATTACHMENT:SLIDE_3]Cloud computing has become the backbone of modern business operations. Companies are moving away from traditional on-premises infrastructure to embrace scalable, flexible cloud solutions.[/ATTACHMENT] Thank you for your attention, and I look forward to your questions.',
      linesToShow: 5,
      scrollTrigger: 3,
      textSize: 24,
      primaryLanguage: 'en-US',
    };
  };

  /**
   * Get all saved settings from local storage
   */
  const getSavedSettings = (): TeleprompterSettings => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.lastSaved) {
          lastSaved.value = new Date(settings.lastSaved);
        }
        return settings;
      }
    } catch (error) {
      console.error('Error loading settings from local storage:', error);
    }
    return getDefaultSettings();
  };

  /**
   * Show a brief visual indicator that settings were saved
   */
  const showSaveIndicator = (): void => {
    // Create or update save indicator
    let indicator = document.getElementById('saveIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'saveIndicator';
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      `;
      document.body.appendChild(indicator);
    }

    if (indicator) {
      indicator.textContent = '💾 Auto-saved';
      indicator.style.opacity = '1';
    }

    // Hide after 2 seconds
    setTimeout(() => {
      if (indicator) {
        indicator.style.opacity = '0';
      }
    }, 2000);
  };

  /**
   * Perform the actual save operation
   */
  const performSave = (settings: TeleprompterSettings): void => {
    try {
      isSaving.value = true;
      const settingsToSave: TeleprompterSettings = {
        scriptText: settings.scriptText || '',
        linesToShow: Math.max(parseInt(String(settings.linesToShow)) || 5, 2),
        scrollTrigger: Math.min(
          parseInt(String(settings.scrollTrigger)) || 3,
          Math.max(1, (parseInt(String(settings.linesToShow)) || 5) - 1)
        ),
        textSize: parseInt(String(settings.textSize)) || 24,
        primaryLanguage: settings.primaryLanguage || 'en-US',
        lastSaved: new Date().toISOString(),
      };

      localStorage.setItem(storageKey, JSON.stringify(settingsToSave));
      lastSaved.value = new Date();

      // Show visual indicator
      showSaveIndicator();

      // Call onSave callback if provided
      if (options.onSave) {
        options.onSave(settingsToSave);
      }
    } catch (error) {
      console.error('Error saving settings to local storage:', error);
    } finally {
      isSaving.value = false;
    }
  };

  /**
   * Save settings to local storage with debouncing
   */
  const saveSettings = (settings: TeleprompterSettings): void => {
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for auto-save
    saveTimeout = window.setTimeout(() => {
      performSave(settings);
    }, autoSaveDelay);
  };

  /**
   * Save settings immediately (without debouncing)
   */
  const saveSettingsImmediate = (settings: TeleprompterSettings): void => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    performSave(settings);
  };

  /**
   * Clear all saved settings
   */
  const clearSettings = (): void => {
    try {
      localStorage.removeItem(storageKey);
      lastSaved.value = null;
    } catch (error) {
      console.error('Error clearing settings:', error);
    }
  };

  /**
   * Check if settings exist in local storage
   */
  const hasSettings = (): boolean => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch (error) {
      console.error('Error checking for saved settings:', error);
      return false;
    }
  };

  /**
   * Get the last saved timestamp
   */
  const getLastSavedTime = (): Date | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.lastSaved ? new Date(settings.lastSaved) : null;
      }
    } catch (error) {
      console.error('Error getting last saved time:', error);
    }
    return null;
  };

  /**
   * Export settings as JSON string
   */
  const exportSettings = (): string | null => {
    try {
      const settings = getSavedSettings();
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      return null;
    }
  };

  /**
   * Import settings from JSON string
   */
  const importSettings = (jsonString: string): boolean => {
    try {
      const settings = JSON.parse(jsonString);
      saveSettingsImmediate(settings);
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  };

  // Cleanup on unmount
  onUnmounted(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
  });

  return {
    // State
    isSaving: readonly(isSaving),
    lastSaved: readonly(lastSaved),

    // Methods
    getDefaultSettings,
    getSavedSettings,
    saveSettings,
    saveSettingsImmediate,
    clearSettings,
    hasSettings,
    getLastSavedTime,
    exportSettings,
    importSettings,
  };
};

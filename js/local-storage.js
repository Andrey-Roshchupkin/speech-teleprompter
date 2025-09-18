import { logManager } from './log-manager.js';

/**
 * Local Storage Module
 * Handles saving and loading of application settings and script text
 */
class LocalStorageManager {
  constructor(debugLogger) {
    this.debugLogger = logManager.createLogger('LocalStorageManager');
    this.storageKey = 'speechTeleprompterSettings';
    this.autoSaveDelay = 1000; // 1 second delay for auto-save
    this.saveTimeout = null;
  }

  /**
   * Get all saved settings from local storage
   */
  getSavedSettings() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const settings = JSON.parse(saved);
        this.debugLogger.info('📦 Loaded settings from local storage');
        return settings;
      }
    } catch (error) {
      this.debugLogger.info('❌ Error loading settings from local storage: ' + error.message);
    }
    return this.getDefaultSettings();
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      scriptText:
        'Welcome to our presentation. Today we will be discussing the future of technology and how it impacts our daily lives. Let me start by sharing some interesting statistics about digital transformation in various industries.',
      linesToShow: 5,
      scrollTrigger: 3,
      textSize: 24,
      primaryLanguage: 'en-US',
    };
  }

  /**
   * Save settings to local storage with debouncing
   */
  saveSettings(settings) {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new timeout for auto-save
    this.saveTimeout = setTimeout(() => {
      this.performSave(settings);
    }, this.autoSaveDelay);
  }

  /**
   * Perform the actual save operation
   */
  performSave(settings) {
    try {
      const settingsToSave = {
        scriptText: settings.scriptText || '',
        linesToShow: Math.max(parseInt(settings.linesToShow) || 5, 2),
        scrollTrigger: Math.min(
          parseInt(settings.scrollTrigger) || 3,
          Math.max(1, (parseInt(settings.linesToShow) || 5) - 1)
        ),
        textSize: parseInt(settings.textSize) || 24,
        primaryLanguage: settings.primaryLanguage || 'en-US',
        lastSaved: new Date().toISOString(),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(settingsToSave));
      this.debugLogger.info('💾 Settings auto-saved to local storage');

      // Show visual indicator
      this.showSaveIndicator();
    } catch (error) {
      this.debugLogger.info('❌ Error saving settings to local storage: ' + error.message);
    }
  }

  /**
   * Show a brief visual indicator that settings were saved
   */
  showSaveIndicator() {
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

    indicator.textContent = '💾 Auto-saved';
    indicator.style.opacity = '1';

    // Hide after 2 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 2000);
  }

  /**
   * Save settings immediately (without debouncing)
   */
  saveSettingsImmediate(settings) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.performSave(settings);
  }

  /**
   * Clear all saved settings
   */
  clearSettings() {
    try {
      localStorage.removeItem(this.storageKey);
      this.debugLogger.info('🗑️ Cleared all saved settings');
    } catch (error) {
      this.debugLogger.info('❌ Error clearing settings: ' + error.message);
    }
  }

  /**
   * Check if settings exist in local storage
   */
  hasSettings() {
    try {
      return localStorage.getItem(this.storageKey) !== null;
    } catch (error) {
      this.debugLogger.info('❌ Error checking for saved settings: ' + error.message);
      return false;
    }
  }

  /**
   * Get the last saved timestamp
   */
  getLastSavedTime() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.lastSaved ? new Date(settings.lastSaved) : null;
      }
    } catch (error) {
      this.debugLogger.info('❌ Error getting last saved time: ' + error.message);
    }
    return null;
  }

  /**
   * Export settings as JSON string
   */
  exportSettings() {
    try {
      const settings = this.getSavedSettings();
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      this.debugLogger.info('❌ Error exporting settings: ' + error.message);
      return null;
    }
  }

  /**
   * Import settings from JSON string
   */
  importSettings(jsonString) {
    try {
      const settings = JSON.parse(jsonString);
      this.saveSettingsImmediate(settings);
      this.debugLogger.info('📥 Settings imported successfully');
      return true;
    } catch (error) {
      this.debugLogger.info('❌ Error importing settings: ' + error.message);
      return false;
    }
  }
}

export { LocalStorageManager };

import { BaseManager } from './BaseManager.js';

/**
 * Manages settings and configuration
 * Single Responsibility: Handle all settings-related operations
 */
export class SettingsManager extends BaseManager {
  constructor(debugLogger) {
    super(debugLogger);
    this.settings = {
      linesToShow: 5,
      scrollTrigger: 3,
      textSize: 20,
      fuzzyPrecision: 65,
    };
  }

  /**
   * Initialize settings manager
   */
  initialize() {
    this.log('⚙️ SettingsManager initialized');
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.log(`⚙️ Settings updated: ${JSON.stringify(this.settings)}`);
  }

  /**
   * Get setting value
   */
  getSetting(key) {
    return this.settings[key];
  }

  /**
   * Set setting value
   */
  setSetting(key, value) {
    this.settings[key] = value;
    this.log(`⚙️ Setting ${key} set to: ${value}`);
  }

  /**
   * Get all settings
   */
  getAllSettings() {
    return { ...this.settings };
  }

  /**
   * Reset settings to defaults
   */
  resetToDefaults() {
    this.settings = {
      linesToShow: 5,
      scrollTrigger: 3,
      textSize: 20,
      fuzzyPrecision: 65,
    };
    this.log('🔄 Settings reset to defaults');
  }

  /**
   * Validate settings
   */
  validateSettings(settings) {
    const validated = { ...settings };

    // Validate lines to show
    if (validated.linesToShow < 1 || validated.linesToShow > 20) {
      validated.linesToShow = 5;
      this.log('⚠️ Invalid linesToShow, reset to default: 5');
    }

    // Validate scroll trigger (must be less than linesToShow)
    const maxScrollTrigger = Math.max(1, validated.linesToShow - 1);
    if (
      validated.scrollTrigger < 1 ||
      validated.scrollTrigger > maxScrollTrigger
    ) {
      validated.scrollTrigger = Math.min(3, maxScrollTrigger);
      this.log(
        `⚠️ Invalid scrollTrigger, reset to ${validated.scrollTrigger} (max allowed for ${validated.linesToShow} lines)`
      );
    }

    // Validate text size
    if (validated.textSize < 10 || validated.textSize > 50) {
      validated.textSize = 20;
      this.log('⚠️ Invalid textSize, reset to default: 20');
    }

    // Validate fuzzy precision
    if (validated.fuzzyPrecision < 10 || validated.fuzzyPrecision > 100) {
      validated.fuzzyPrecision = 65;
      this.log('⚠️ Invalid fuzzyPrecision, reset to default: 65');
    }

    return validated;
  }
}

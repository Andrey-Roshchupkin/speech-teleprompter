import { logManager } from '../log-manager.js';

/**
 * Centralized State Manager
 * Single source of truth for all application state
 * Handles synchronization between main window and PiP
 */
export class StateManager {
  constructor() {
    this.log = logManager.createLogger('StateManager');

    // Core application state
    this.state = {
      // Display state
      currentPosition: 0,
      matchedWords: [],
      scriptWords: [],
      displayWords: [],

      // UI state
      isListening: false,
      isInPiP: false,
      pipWindow: null,

      // Settings
      linesToShow: 5,
      scrollTrigger: 3,
      textSize: 24,
      fuzzyPrecision: 65,
      primaryLanguage: 'en-US',

      // Scroll state
      topLinePosition: 0,
      lastScrollPosition: 0,
      scrollCount: 0,

      // Attachment state
      attachments: [],
      currentAttachment: null,

      // Speech recognition state
      finalTranscript: '',
      interimTranscript: '',
      recognitionStatus: 'stopped',
    };

    // Subscribers for state changes
    this.subscribers = new Map();

    // PiP synchronization
    this.pipElements = {
      controls: null,
      display: null,
      attachment: null,
    };

    this.log.info('🏗️ StateManager initialized');
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get specific state property
   */
  getStateProperty(key) {
    return this.state[key];
  }

  /**
   * Update state and notify subscribers
   */
  updateState(updates, source = 'unknown') {
    const oldState = { ...this.state };

    // Update state
    Object.assign(this.state, updates);

    // Log significant changes
    const changedKeys = Object.keys(updates);
    if (changedKeys.length > 0) {
      this.log.info(`🔄 State updated by ${source}: ${changedKeys.join(', ')}`);
    }

    // Notify subscribers
    this.notifySubscribers(updates, oldState, source);

    // Sync with PiP if it's open
    if (
      this.state.isInPiP &&
      this.state.pipWindow &&
      !this.state.pipWindow.closed
    ) {
      this.syncWithPiP(updates);
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback, context = 'unknown') {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }

    this.subscribers.get(key).push({ callback, context });
    this.log.info(`📡 Subscribed ${context} to ${key} changes`);
  }

  /**
   * Unsubscribe from state changes
   */
  unsubscribe(key, context) {
    if (this.subscribers.has(key)) {
      const subscribers = this.subscribers.get(key);
      const index = subscribers.findIndex((sub) => sub.context === context);
      if (index !== -1) {
        subscribers.splice(index, 1);
        this.log.info(`📡 Unsubscribed ${context} from ${key} changes`);
      }
    }
  }

  /**
   * Notify subscribers of state changes
   */
  notifySubscribers(updates, oldState, source) {
    Object.keys(updates).forEach((key) => {
      if (this.subscribers.has(key)) {
        const subscribers = this.subscribers.get(key);
        subscribers.forEach(({ callback, context }) => {
          try {
            callback(updates[key], oldState[key], source);
          } catch (error) {
            this.log.error(
              `❌ Error in subscriber ${context} for ${key}: ${error.message}`
            );
          }
        });
      }
    });
  }

  /**
   * Set PiP elements for synchronization
   */
  setPiPElements(controls, display, attachment) {
    this.pipElements = { controls, display, attachment };
    this.log.info('🖼️ PiP elements registered for synchronization');
  }

  /**
   * Clear PiP elements
   */
  clearPiPElements() {
    this.pipElements = { controls: null, display: null, attachment: null };
    this.log.info('🖼️ PiP elements cleared');
  }

  /**
   * Synchronize state changes with PiP window
   */
  syncWithPiP(updates) {
    if (!this.pipElements.controls || !this.pipElements.display) {
      return;
    }

    try {
      // Sync display content
      if (
        updates.displayWords !== undefined ||
        updates.currentPosition !== undefined ||
        updates.matchedWords !== undefined
      ) {
        this.syncPiPDisplay();
      }

      // Sync controls state
      if (
        updates.isListening !== undefined ||
        updates.recognitionStatus !== undefined
      ) {
        this.syncPiPControls();
      }

      // Sync scroll position
      if (
        updates.topLinePosition !== undefined ||
        updates.lastScrollPosition !== undefined
      ) {
        this.syncPiPScroll();
      }

      // Sync attachment display
      if (updates.currentAttachment !== undefined) {
        this.syncPiPAttachment();
      }
    } catch (error) {
      this.log.error(`❌ Error syncing with PiP: ${error.message}`);
    }
  }

  /**
   * Sync PiP display content (DEPRECATED - not needed with MDN approach)
   */
  syncPiPDisplay() {
    // No need to sync since we're using the same elements
    // Content and scroll position are automatically synchronized
    this.log.info('📺 PiP display sync skipped - using original elements');
  }

  /**
   * Sync PiP controls state (DEPRECATED - not needed with MDN approach)
   */
  syncPiPControls() {
    // No need to sync since we're using the same elements
    // Button states and input values are automatically synchronized
    this.log.info('📺 PiP controls sync skipped - using original elements');
  }

  /**
   * Sync PiP scroll position (DEPRECATED - not needed with MDN approach)
   */
  syncPiPScroll() {
    // No need to sync since we're using the same elements
    // Scroll position is automatically synchronized
    this.log.info('📺 PiP scroll sync skipped - using original elements');
  }

  /**
   * Sync PiP attachment display (DEPRECATED - not needed with MDN approach)
   */
  syncPiPAttachment() {
    // No need to sync since we're using the same elements
    // Attachment content is automatically synchronized
    this.log.info('📺 PiP attachment sync skipped - using original elements');
  }

  /**
   * Reset all state to initial values
   */
  reset() {
    const initialState = {
      currentPosition: 0,
      matchedWords: [],
      topLinePosition: 0,
      lastScrollPosition: 0,
      scrollCount: 0,
      isListening: false,
      finalTranscript: '',
      interimTranscript: '',
      recognitionStatus: 'stopped',
      currentAttachment: null,
    };

    this.updateState(initialState, 'StateManager.reset');
    this.log.info('🔄 State reset to initial values');
  }

  /**
   * Get state for debugging
   */
  getDebugInfo() {
    return {
      state: this.state,
      subscribers: Array.from(this.subscribers.keys()),
      pipElements: Object.keys(this.pipElements).filter(
        (key) => this.pipElements[key] !== null
      ),
    };
  }
}

// Create singleton instance
export const stateManager = new StateManager();

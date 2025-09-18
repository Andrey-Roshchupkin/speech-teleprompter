import { TeleprompterCore } from './core/TeleprompterCore.js';
import { logManager } from './log-manager.js';

/**
 * TeleprompterDisplay - Simplified main class using managers
 * Follows SOLID principles by delegating responsibilities to specialized managers
 */
export class TeleprompterDisplay {
  constructor(debugLogger) {
    this.debugLogger = logManager.createLogger('TeleprompterDisplay');
    this.core = new TeleprompterCore(debugLogger);

    // DOM elements
    this.teleprompterText = null;
    this.teleprompterDisplay = null;
    this.teleprompterControls = null;
    this.teleprompterAttachment = null;
    this.progressFill = null;
    this.pipButton = null;
  }

  /**
   * Initialize the teleprompter display
   */
  initializeElements() {
    this.debugLogger.info('🔍 Initializing TeleprompterDisplay elements...');

    // Get DOM elements
    this.teleprompterText = document.getElementById('teleprompterText');
    this.teleprompterDisplay = document.getElementById('teleprompterDisplay');
    this.teleprompterControls = document.getElementById('teleprompterControls');
    this.teleprompterAttachment = document.getElementById(
      'teleprompterAttachment'
    );
    this.progressFill = document.getElementById('progressFill');
    this.pipButton = document.getElementById('pipButton');

    // Debug: Log which elements were found
    this.debugLogger.info(
      `🔍 TeleprompterDisplay elements found: teleprompterText=${!!this
        .teleprompterText}, teleprompterDisplay=${!!this
        .teleprompterDisplay}, teleprompterControls=${!!this
        .teleprompterControls}, progressFill=${!!this
        .progressFill}, pipButton=${!!this
        .pipButton}, teleprompterAttachment=${!!this.teleprompterAttachment}`
    );

    // Initialize core with elements
    this.core.initialize({
      teleprompterText: this.teleprompterText,
      teleprompterDisplay: this.teleprompterDisplay,
      teleprompterControls: this.teleprompterControls,
      teleprompterAttachment: this.teleprompterAttachment,
      progressFill: this.progressFill,
      pipButton: this.pipButton,
    });

    this.debugLogger.info('✅ TeleprompterDisplay initialized');
  }

  /**
   * Update script text
   */
  updateScript(scriptText) {
    this.core.updateScript(scriptText);
  }

  /**
   * Update settings
   */
  updateSettings(linesToShow, scrollTrigger, textSize) {
    this.core.updateSettings(linesToShow, scrollTrigger, textSize);
  }

  /**
   * Update position and matched words
   */
  updatePosition(newPosition, matchedIndices) {
    this.core.updatePosition(newPosition, matchedIndices);
  }

  /**
   * Update progress
   */
  updateProgress() {
    this.core.updateProgress();
  }

  /**
   * Reset teleprompter
   */
  reset() {
    this.core.reset();
  }

  /**
   * Get current position
   */
  getCurrentPosition() {
    return this.core.getCurrentPosition();
  }

  /**
   * Get total words
   */
  getTotalWords() {
    return this.core.getTotalWords();
  }

  /**
   * Get progress percentage
   */
  getProgress() {
    return this.core.getProgress();
  }

  /**
   * Get original script words (for fuzzy matching)
   */
  getOriginalScriptWords() {
    return this.core.getOriginalScriptWords();
  }

  /**
   * Update height of the teleprompter display
   */
  updateHeight() {
    this.core.scrollManager.updateHeight();
  }

  /**
   * Get managers (for external access if needed)
   */
  getManagers() {
    return this.core.getManagers();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.core.cleanup();
  }
}

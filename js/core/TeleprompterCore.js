import { AttachmentManager } from '../managers/AttachmentManager.js';
import { PictureInPictureManager } from '../managers/PictureInPictureManager.js';
import { DisplayManager } from '../managers/DisplayManager.js';
import { ScrollManager } from '../managers/ScrollManager.js';
import { SettingsManager } from '../managers/SettingsManager.js';
import { stateManager } from '../managers/StateManager.js';
import { logManager } from '../log-manager.js';

/**
 * Core teleprompter functionality
 * Orchestrates all managers and provides main interface
 */
export class TeleprompterCore {
  constructor(debugLogger) {
    this.debugLogger = logManager.createLogger('TeleprompterCore');

    // Initialize managers
    this.attachmentManager = new AttachmentManager(debugLogger);
    this.pipManager = new PictureInPictureManager(debugLogger);
    this.displayManager = new DisplayManager(debugLogger);
    this.scrollManager = new ScrollManager(debugLogger);
    this.settingsManager = new SettingsManager(debugLogger);

    // State
    this.originalScriptWords = [];
    this.progressFill = null;
    this.updateScheduled = false;
    this.pendingUpdates = new Set();

    // Subscribe to state changes
    this.setupStateSubscriptions();
  }

  /**
   * Setup subscriptions to state changes
   */
  setupStateSubscriptions() {
    // Subscribe to position changes
    stateManager.subscribe(
      'currentPosition',
      (newPosition, oldPosition, source) => {
        if (source !== 'TeleprompterCore') {
          this.debugLogger.info(
            `📍 Position changed externally: ${oldPosition} → ${newPosition}`
          );
          this.displayManager.updateCurrentPosition(newPosition);
          this.scheduleUpdate('display');
        }
      },
      'TeleprompterCore'
    );

    // Subscribe to matched words changes
    stateManager.subscribe(
      'matchedWords',
      (newWords, oldWords, source) => {
        if (source !== 'TeleprompterCore') {
          this.debugLogger.info(
            `🟢 Matched words changed externally: ${newWords.length} words`
          );
          this.displayManager.updateMatchedWords(newWords);
          this.scheduleUpdate('display');
        }
      },
      'TeleprompterCore'
    );

    // Subscribe to scroll position changes
    stateManager.subscribe(
      'topLinePosition',
      (newPosition, oldPosition, source) => {
        if (source !== 'TeleprompterCore') {
          this.debugLogger.info(
            `📜 Scroll position changed externally: ${oldPosition} → ${newPosition}`
          );
          // Sync scroll position between main window and PiP
          this.scrollManager.syncScrollPosition(newPosition);
        }
      },
      'TeleprompterCore'
    );

    // Subscribe to PiP state changes
    stateManager.subscribe(
      'isInPiP',
      (isInPiP, oldValue, source) => {
        this.debugLogger.info(`🖼️ PiP state changed: ${oldValue} → ${isInPiP}`);
      },
      'TeleprompterCore'
    );
  }

  /**
   * Initialize the teleprompter core
   */
  initialize(elements) {
    this.debugLogger.info('🚀 Initializing TeleprompterCore...');

    // Initialize managers with their respective elements
    this.attachmentManager.initialize(elements.teleprompterAttachment);
    this.pipManager.initialize(
      elements.pipButton,
      elements.teleprompterControls,
      elements.teleprompterDisplay,
      elements.teleprompterAttachment
    );
    this.displayManager.initialize(
      elements.teleprompterText,
      elements.teleprompterDisplay
    );
    this.scrollManager.initialize(
      elements.teleprompterText,
      elements.teleprompterDisplay
    );
    this.settingsManager.initialize();

    // Store progress bar reference
    this.progressFill = elements.progressFill;

    this.debugLogger.info('✅ TeleprompterCore initialized');
  }

  /**
   * Update script text
   */
  updateScript(scriptText) {
    // Parse attachments first
    this.attachmentManager.parseAttachments(scriptText);

    // Replace attachment blocks with just the attachment names (for display)
    let displayText = scriptText.replace(
      /\[ATTACHMENT:([^\]]+)\][\s\S]*?\[\/ATTACHMENT\]/g,
      (match, attachmentName) => {
        return `[${attachmentName}]`;
      }
    );

    // Split into words for display
    const scriptWords = displayText
      .split(/\s+/)
      .filter((word) => word.length > 0);

    // Store original script words (with attachments) for fuzzy matching
    this.originalScriptWords = scriptText
      .split(/\s+/)
      .filter((word) => word.length > 0);

    // Update display manager
    this.displayManager.updateScriptWords(scriptWords);
    this.displayManager.updateDisplayContent();

    // Set original script words in attachment manager
    this.attachmentManager.setOriginalScriptWords(this.originalScriptWords);

    // Update attachment display
    this.attachmentManager.updateAttachmentDisplay(
      this.displayManager.getCurrentPosition(),
      scriptWords,
      this.settingsManager.getSetting('textSize')
    );

    // Also update PiP window if it's open
    if (this.pipManager.isInPictureInPicture()) {
      this.pipManager.updatePiPContent();
    }

    this.debugLogger.info(`📝 Script updated: ${scriptWords.length} words`);
  }

  /**
   * Update settings
   */
  updateSettings(linesToShow, scrollTrigger, textSize) {
    // Update settings manager
    this.settingsManager.updateSettings({
      linesToShow,
      scrollTrigger,
      textSize,
    });

    // Update individual managers
    this.displayManager.updateSettings(linesToShow, textSize);
    this.displayManager.updateDisplayContent();
    this.scrollManager.updateSettings(scrollTrigger, linesToShow, textSize);

    // Update attachment font size
    this.attachmentManager.updateAttachmentFontSize(textSize);

    // Update height and scroll
    this.scrollManager.updateHeight();
    this.scrollManager.scrollToCurrentPosition(
      this.displayManager.getCurrentPosition()
    );

    // Also update PiP window if it's open
    if (this.pipManager.isInPictureInPicture()) {
      this.pipManager.updatePiPContent();
    }

    this.debugLogger.info(
      `⚙️ Settings updated: ${linesToShow} lines, scroll after ${scrollTrigger}, text size ${textSize}px`
    );
  }

  /**
   * Update position and matched words
   */
  updatePosition(newPosition, matchedIndices) {
    const oldPosition = this.displayManager.getCurrentPosition();

    // Convert position from original script to display script
    const displayPosition =
      this.attachmentManager.convertOriginalToDisplayPosition(newPosition);

    this.debugLogger.info(
      `📍 Setting display position: ${displayPosition} (original: ${newPosition})`
    );

    // If position is inside an attachment (-1), find the next valid position
    let finalDisplayPosition = displayPosition;
    if (displayPosition === -1) {
      this.debugLogger.info(
        `📍 Position ${newPosition} is inside attachment, finding next valid position`
      );

      // Find the next position after the attachment
      const nextPosition = this.findNextValidPosition(newPosition);
      finalDisplayPosition =
        this.attachmentManager.convertOriginalToDisplayPosition(nextPosition);

      this.debugLogger.info(
        `📍 Next valid position: ${nextPosition} → display ${finalDisplayPosition}`
      );
    }

    this.displayManager.updateCurrentPosition(finalDisplayPosition);

    // Get the final position after auto-skipping attachments
    const finalPosition = this.displayManager.getCurrentPosition();
    const currentWord = this.displayManager.getCurrentWord();

    this.debugLogger.info(
      `📍 Final position after auto-skip: ${finalPosition}, current word: "${currentWord}"`
    );

    // Add matched words to highlight list (convert from original to display indices)
    const currentMatchedWords = [...this.displayManager.getMatchedWords()];

    // Check if matchedIndices is valid
    if (!matchedIndices || !Array.isArray(matchedIndices)) {
      this.debugLogger.info(`⚠️ Invalid matchedIndices: ${matchedIndices}`);
      return;
    }

    matchedIndices.forEach((originalIndex) => {
      const displayIndex =
        this.attachmentManager.convertOriginalToDisplayPosition(originalIndex);
      if (displayIndex !== -1 && !currentMatchedWords.includes(displayIndex)) {
        currentMatchedWords.push(displayIndex);
        this.debugLogger.info(
          `🟢 Added matched word: original ${originalIndex} → display ${displayIndex}`
        );
      } else if (displayIndex === -1) {
        this.debugLogger.info(
          `🚫 Skipped matched word at original ${originalIndex} (inside attachment)`
        );
      }
    });
    this.displayManager.updateMatchedWords(currentMatchedWords);

    // Update state manager with new position and matched words
    stateManager.updateState(
      {
        currentPosition: finalPosition,
        matchedWords: currentMatchedWords,
      },
      'TeleprompterCore'
    );

    this.debugLogger.info(
      `📍 Position updated: ${oldPosition} → ${newPosition} (display: ${displayPosition})`
    );
    this.debugLogger.info(
      `🟢 Total highlighted words: ${currentMatchedWords.length}`
    );

    // Schedule updates (auto-scroll will be handled after display update)
    this.scheduleUpdate('display');
    this.scheduleUpdate('progress');
    this.scheduleUpdate('autoScroll');

    // Also update PiP window if it's open
    if (this.pipManager.isInPictureInPicture()) {
      this.pipManager.updatePiPContent();
    }
  }

  /**
   * Update progress bar
   */
  updateProgress() {
    this.updateProgressBar();

    // Also update PiP window if it's open
    if (this.pipManager.isInPictureInPicture()) {
      this.pipManager.updatePiPContent();
    }
  }

  /**
   * Update progress bar
   */
  updateProgressBar() {
    if (!this.progressFill) {
      this.debugLogger.info('⚠️ Progress bar element not found');
      return;
    }

    const progress = this.getProgress();
    this.progressFill.style.width = `${progress}%`;
  }

  /**
   * Reset teleprompter
   */
  reset() {
    this.displayManager.reset();
    this.displayManager.updateDisplayContent();
    this.scrollManager.reset();
    this.attachmentManager.reset();

    // Reset progress bar if it exists
    if (this.progressFill) {
      this.progressFill.style.width = '0%';
    } else {
      this.debugLogger.info('⚠️ Progress bar element not found');
    }

    // Force scroll to beginning position (scrollManager.reset() already handles this)
    setTimeout(() => {
      this.scrollManager.scrollToCurrentPosition(0);
    }, 50);

    // Also update PiP window if it's open
    if (this.pipManager.isInPictureInPicture()) {
      this.pipManager.updatePiPContent();
    }

    this.debugLogger.info('🔄 Teleprompter reset');
  }

  /**
   * Schedule update
   */
  scheduleUpdate(updateType) {
    this.pendingUpdates.add(updateType);

    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => this.flushUpdates());
    }
  }

  /**
   * Flush all pending DOM updates in a single batch
   */
  flushUpdates() {
    if (this.pendingUpdates.size === 0) {
      this.updateScheduled = false;
      return;
    }

    // Store current scroll position to prevent jumping
    const currentScrollTop =
      this.displayManager.teleprompterDisplay?.scrollTop || 0;

    // Process all pending updates
    if (this.pendingUpdates.has('display')) {
      this.displayManager.updateDisplayContent();
      this.attachmentManager.updateAttachmentDisplay(
        this.displayManager.getCurrentPosition(),
        this.displayManager.getScriptWords(),
        this.settingsManager.getSetting('textSize')
      );

      // Update PiP content if in PiP mode
      if (this.pipManager.isInPictureInPicture()) {
        this.pipManager.updatePiPContent();
      }
    }

    if (this.pendingUpdates.has('progress')) {
      this.updateProgressBar();
    }

    if (this.pendingUpdates.has('scroll')) {
      this.scrollManager.scrollToCurrentPosition(
        this.displayManager.getCurrentPosition()
      );
    }

    if (this.pendingUpdates.has('autoScroll')) {
      // Auto-scroll after display has been updated
      this.scrollManager.autoScroll();
    }

    // Restore scroll position and schedule scroll update
    if (this.displayManager.teleprompterDisplay) {
      this.displayManager.teleprompterDisplay.scrollTop = currentScrollTop;
    }

    // Clear pending updates
    this.pendingUpdates.clear();
    this.updateScheduled = false;
  }

  /**
   * Get current position
   */
  getCurrentPosition() {
    return this.displayManager.getCurrentPosition();
  }

  /**
   * Get total words
   */
  getTotalWords() {
    return this.displayManager.getScriptWords().length;
  }

  /**
   * Get progress percentage
   */
  getProgress() {
    const current = this.getCurrentPosition();
    const total = this.getTotalWords();
    return total > 0 ? Math.round((current / total) * 100) : 0;
  }

  /**
   * Get original script words (for fuzzy matching)
   */
  getOriginalScriptWords() {
    return this.originalScriptWords;
  }

  /**
   * Find the next valid position after an attachment
   */
  findNextValidPosition(position) {
    // Find which attachment contains this position
    for (const attachment of this.attachmentManager.getAttachments()) {
      if (
        position >= attachment.startWordIndex &&
        position < attachment.endWordIndex
      ) {
        // Return the position right after this attachment
        this.debugLogger.info(
          `📍 Found attachment "${attachment.name}" at ${attachment.startWordIndex}-${attachment.endWordIndex}, returning position ${attachment.endWordIndex}`
        );
        return attachment.endWordIndex;
      }
    }

    // If not found in any attachment, return the original position
    this.debugLogger.info(
      `📍 Position ${position} not in any attachment, returning original`
    );
    return position;
  }

  /**
   * Get managers (for external access if needed)
   */
  getManagers() {
    return {
      attachment: this.attachmentManager,
      pip: this.pipManager,
      display: this.displayManager,
      scroll: this.scrollManager,
      settings: this.settingsManager,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.attachmentManager.cleanup();
    this.pipManager.cleanup();
    this.displayManager.cleanup();
    this.scrollManager.cleanup();
    this.settingsManager.cleanup();
  }
}

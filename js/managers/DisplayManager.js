import { BaseManager } from './BaseManager.js';

/**
 * Manages display rendering and styling
 * Single Responsibility: Handle all display-related operations
 */
export class DisplayManager extends BaseManager {
  constructor(debugLogger) {
    super(debugLogger);
    this.teleprompterText = null;
    this.teleprompterDisplay = null;
    this.scriptWords = [];
    this.currentPosition = 0;
    this.matchedWords = [];
    this.linesToShow = 5;
    this.textSize = 20;
  }

  /**
   * Initialize display manager
   */
  initialize(teleprompterText, teleprompterDisplay) {
    this.teleprompterText = teleprompterText;
    this.teleprompterDisplay = teleprompterDisplay;
    this.log('🎨 DisplayManager initialized');
  }

  /**
   * Update display content with highlighting
   */
  updateDisplayContent() {
    if (!this.teleprompterText) {
      this.log(
        '⚠️ TeleprompterText element not found, skipping display update'
      );
      return;
    }

    if (this.scriptWords.length === 0) {
      this.teleprompterText.innerHTML =
        'Enter your script in the text area to see it here...';
      return;
    }

    let displayText = '';

    // Create highlighted text for ALL words
    for (let i = 0; i < this.scriptWords.length; i++) {
      const word = this.scriptWords[i];
      let wordHtml = word;

      // Check if this is an attachment name (starts with [ and ends with ])
      if (word.startsWith('[') && word.endsWith(']')) {
        wordHtml = `<span class="teleprompter-attachment-name">${word}</span>`;
      }
      // Highlight current position
      else if (i === this.currentPosition) {
        wordHtml = `<span class="teleprompter-highlight">${word}</span>`;
      }
      // Highlight matched words
      else if (this.matchedWords.includes(i)) {
        wordHtml = `<span class="teleprompter-matched">${word}</span>`;
      }
      // Fade out words before current position
      else if (i < this.currentPosition) {
        wordHtml = `<span class="teleprompter-faded">${word}</span>`;
      }

      displayText += wordHtml + ' ';
    }

    this.teleprompterText.innerHTML = displayText;
    this.updateTextSize();
  }

  /**
   * Update text size
   */
  updateTextSize() {
    if (!this.teleprompterDisplay) {
      return;
    }

    this.teleprompterDisplay.style.fontSize = `${this.textSize}px`;
    this.log(`🔤 Text size updated: ${this.textSize}px`);
  }

  /**
   * Update display settings
   */
  updateSettings(linesToShow, textSize) {
    this.linesToShow = linesToShow;
    this.textSize = textSize;

    // Set dataset for ScrollManager to read
    if (this.teleprompterDisplay) {
      this.teleprompterDisplay.dataset.linesToShow = linesToShow.toString();
    }

    this.updateTextSize();
    this.log(
      `⚙️ Display settings updated: ${linesToShow} lines, text size ${textSize}px`
    );
  }

  /**
   * Update script words
   */
  updateScriptWords(scriptWords) {
    this.scriptWords = scriptWords;
    this.log(`📝 Script words updated: ${scriptWords.length} words`);
  }

  /**
   * Update current position
   */
  updateCurrentPosition(position) {
    const oldPosition = this.currentPosition;

    // Handle invalid position (-1)
    if (position === -1) {
      this.log(
        `📍 Invalid position -1 received, keeping current position: ${oldPosition}`
      );
      return;
    }

    this.currentPosition = position;
    this.log(`📍 Display position updated: ${oldPosition} → ${position}`);

    // Auto-skip attachment names
    this.autoSkipAttachments();
  }

  /**
   * Auto-skip attachment names when current position is on them
   */
  autoSkipAttachments() {
    // Check bounds and validity
    if (
      this.currentPosition < 0 ||
      this.currentPosition >= this.scriptWords.length
    ) {
      this.log(
        `📍 Auto-skip: position ${this.currentPosition} is out of bounds (0-${
          this.scriptWords.length - 1
        })`
      );
      return;
    }

    const currentWord = this.scriptWords[this.currentPosition];

    // Check if current word is an attachment name (starts with [ and ends with ])
    if (
      currentWord &&
      currentWord.startsWith('[') &&
      currentWord.endsWith(']')
    ) {
      this.log(`📍 Auto-skipping attachment name: "${currentWord}"`);

      // Move to next word
      this.currentPosition++;

      // Recursively check if next word is also an attachment
      if (this.currentPosition < this.scriptWords.length) {
        this.autoSkipAttachments();
      }
    }
  }

  /**
   * Update matched words
   */
  updateMatchedWords(matchedWords) {
    this.matchedWords = matchedWords;
  }

  /**
   * Add matched word
   */
  addMatchedWord(index) {
    if (!this.matchedWords.includes(index)) {
      this.matchedWords.push(index);
      this.log(`🟢 Added matched word at index: ${index}`);
    }
  }

  /**
   * Reset display state
   */
  reset() {
    this.currentPosition = 0;
    this.matchedWords = [];
    this.log('🔄 Display state reset');
  }

  /**
   * Get current position
   */
  getCurrentPosition() {
    return this.currentPosition;
  }

  /**
   * Get script words
   */
  getScriptWords() {
    return this.scriptWords;
  }

  /**
   * Get matched words
   */
  getMatchedWords() {
    return this.matchedWords;
  }

  /**
   * Get lines to show
   */
  getLinesToShow() {
    return this.linesToShow;
  }

  /**
   * Get text size
   */
  getTextSize() {
    return this.textSize;
  }

  /**
   * Get current position (auto-skipping attachments)
   */
  getCurrentPosition() {
    return this.currentPosition;
  }

  /**
   * Get current word (auto-skipping attachments)
   */
  getCurrentWord() {
    if (this.currentPosition < this.scriptWords.length) {
      return this.scriptWords[this.currentPosition];
    }
    return null;
  }
}

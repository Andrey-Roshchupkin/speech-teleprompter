import { BaseManager } from './BaseManager.js';

/**
 * Manages attachment parsing, display, and positioning
 * Single Responsibility: Handle all attachment-related functionality
 */
export class AttachmentManager extends BaseManager {
  constructor(debugLogger) {
    super(debugLogger);
    this.attachments = [];
    this.currentAttachment = null;
    this.teleprompterAttachment = null;
  }

  /**
   * Initialize attachment manager
   */
  initialize(teleprompterAttachment) {
    this.teleprompterAttachment = teleprompterAttachment;
    this.log('📎 AttachmentManager initialized');
  }

  /**
   * Set original script words for position conversion
   */
  setOriginalScriptWords(originalScriptWords) {
    this.originalScriptWords = originalScriptWords;
    this.log(
      `📎 Original script words set: ${originalScriptWords.length} words`
    );
  }

  /**
   * Parse attachments from script text
   */
  parseAttachments(scriptText) {
    this.attachments = [];
    this.log(
      `📎 Parsing attachments from script text (${scriptText.length} characters)`
    );

    const attachmentRegex =
      /\[ATTACHMENT:([^\]]+)\]([\s\S]*?)\[\/ATTACHMENT\]/g;
    let match;

    // Split text into words for indexing
    const allWords = scriptText.split(/\s+/).filter((word) => word.length > 0);

    while ((match = attachmentRegex.exec(scriptText)) !== null) {
      const attachmentName = match[1].trim();
      const attachmentContent = match[2].trim();

      this.log(`📎 Raw attachment content: "${attachmentContent}"`);

      // Find word indices for this attachment
      const beforeAttachment = scriptText.substring(0, match.index);
      const beforeWords = beforeAttachment
        .split(/\s+/)
        .filter((word) => word.length > 0);
      const attachmentWords = match[0]
        .split(/\s+/)
        .filter((word) => word.length > 0);

      const startWordIndex = beforeWords.length;
      const endWordIndex = startWordIndex + attachmentWords.length;

      this.attachments.push({
        name: attachmentName,
        content: attachmentContent,
        startWordIndex: startWordIndex,
        endWordIndex: endWordIndex,
      });

      this.log(
        `📎 Found attachment: "${attachmentName}" at words ${startWordIndex}-${endWordIndex}`
      );
      this.log(`📎 Attachment content length: ${attachmentContent.length}`);
    }

    this.log(`📎 Parsed ${this.attachments.length} attachments`);
    if (this.attachments.length > 0) {
      this.attachments.forEach((attachment, index) => {
        this.log(
          `📎 Attachment ${index + 1}: "${attachment.name}" - "${
            attachment.content
          }"`
        );
      });
    }
  }

  /**
   * Find the display position of an attachment name (not content)
   */
  findAttachmentDisplayPosition(attachment, scriptWords) {
    // Find the attachment name in display script
    for (let i = 0; i < scriptWords.length; i++) {
      const word = scriptWords[i];
      if (word && word.startsWith('[') && word.endsWith(']')) {
        const attachmentName = word.slice(1, -1);
        if (attachmentName === attachment.name) {
          return i;
        }
      }
    }
    return -1;
  }

  /**
   * Convert position from original script (with attachments) to display script (without attachments)
   */
  convertOriginalToDisplayPosition(originalPosition) {
    let displayPosition = 0;

    // Check if originalScriptWords is available
    if (!this.originalScriptWords || !Array.isArray(this.originalScriptWords)) {
      this.log(
        `⚠️ originalScriptWords not available, returning original position: ${originalPosition}`
      );
      return originalPosition;
    }

    this.log(
      `📎 Converting original position ${originalPosition} to display position (total original words: ${this.originalScriptWords.length}, attachments: ${this.attachments.length})`
    );

    for (
      let i = 0;
      i < this.originalScriptWords.length && i <= originalPosition;
      i++
    ) {
      // Check if this word is part of an attachment
      let isInAttachment = false;
      let attachmentName = '';
      for (const attachment of this.attachments) {
        if (i >= attachment.startWordIndex && i < attachment.endWordIndex) {
          isInAttachment = true;
          attachmentName = attachment.name;
          break;
        }
      }

      if (!isInAttachment) {
        if (i === originalPosition) {
          this.log(
            `📎 Position ${originalPosition} → display ${displayPosition} (word: "${this.originalScriptWords[i]}")`
          );
          return displayPosition;
        }
        displayPosition++;
      } else if (i === originalPosition) {
        // If the requested position is inside an attachment, return -1
        this.log(
          `📎 Position ${originalPosition} is inside attachment "${attachmentName}", returning -1`
        );
        return -1;
      }
    }

    this.log(
      `📎 Position ${originalPosition} → display ${displayPosition} (end of conversion)`
    );
    return displayPosition;
  }

  /**
   * Update attachment display based on current position
   */
  updateAttachmentDisplay(currentPosition, scriptWords, textSize) {
    if (!this.teleprompterAttachment) {
      this.log('📎 Attachment element not found');
      return;
    }

    this.log(
      `📎 updateAttachmentDisplay called - position: ${currentPosition}, scriptWords length: ${scriptWords.length}`
    );
    this.log(`📎 Available attachments: ${this.attachments.length}`);

    // Find current attachment based on position
    let currentAttachment = null;

    // Check if current word is an attachment name
    if (currentPosition < scriptWords.length) {
      const currentWord = scriptWords[currentPosition];
      this.log(`📎 Current word: "${currentWord}"`);

      if (
        currentWord &&
        currentWord.startsWith('[') &&
        currentWord.endsWith(']')
      ) {
        const attachmentName = currentWord.slice(1, -1); // Remove [ and ]
        this.log(`📎 Found attachment name: "${attachmentName}"`);

        // Find the attachment with this name
        for (const attachment of this.attachments) {
          this.log(`📎 Checking attachment: "${attachment.name}"`);
          if (attachment.name === attachmentName) {
            currentAttachment = attachment;
            this.log(`📎 Found matching attachment: "${attachment.name}"`);
            break;
          }
        }
      }
    }

    // If no current attachment found, show the next upcoming attachment
    if (!currentAttachment && this.attachments.length > 0) {
      // Find the next attachment that hasn't been reached yet
      for (const attachment of this.attachments) {
        // Find the display position of the attachment name
        const displayPosition = this.findAttachmentDisplayPosition(
          attachment,
          scriptWords
        );
        if (displayPosition > currentPosition) {
          currentAttachment = attachment;
          this.log(
            `📎 Showing next upcoming attachment: "${attachment.name}" at position ${displayPosition}`
          );
          break;
        }
      }
    }

    // Update display
    if (currentAttachment && currentAttachment !== this.currentAttachment) {
      this.currentAttachment = currentAttachment;

      // Clear the attachment element
      this.teleprompterAttachment.innerHTML = '';

      // Create title element
      const titleElement = document.createElement('div');
      titleElement.className = 'teleprompter-attachment-title';
      titleElement.textContent = currentAttachment.name;

      // Create content element
      const contentElement = document.createElement('div');
      contentElement.textContent = currentAttachment.content;

      // Append elements
      this.teleprompterAttachment.appendChild(titleElement);
      this.teleprompterAttachment.appendChild(contentElement);

      // Update font size to match settings
      this.updateAttachmentFontSize(textSize);

      this.log(`📎 Displaying attachment: "${currentAttachment.name}"`);
    } else if (!currentAttachment && this.currentAttachment) {
      this.currentAttachment = null;
      this.teleprompterAttachment.innerHTML = '';
      this.teleprompterAttachment.style.display = 'none';
      this.log('📎 Hiding attachment');
    } else if (!currentAttachment && this.attachments.length === 0) {
      // Hide block if no attachments exist
      this.teleprompterAttachment.style.display = 'none';
      this.log('📎 No attachments found, hiding block');
    } else if (currentAttachment) {
      // Show block if there's an attachment to display
      this.teleprompterAttachment.style.display = 'block';
    }
  }

  /**
   * Update attachment block font size to match settings
   */
  updateAttachmentFontSize(textSize) {
    if (!this.teleprompterAttachment) {
      return;
    }

    // Get current text size from settings
    const size = textSize || 20;

    // Apply font size to attachment block
    this.teleprompterAttachment.style.fontSize = `${size}px`;

    // Also update title font size (slightly smaller)
    const titleElement = this.teleprompterAttachment.querySelector(
      '.teleprompter-attachment-title'
    );
    if (titleElement) {
      titleElement.style.fontSize = `${Math.max(size - 2, 12)}px`;
    }
  }

  /**
   * Reset attachment state
   */
  reset() {
    this.currentAttachment = null;
    if (this.teleprompterAttachment) {
      this.teleprompterAttachment.innerHTML = '';
    }
  }

  /**
   * Get attachments array
   */
  getAttachments() {
    return this.attachments;
  }

  /**
   * Get current attachment
   */
  getCurrentAttachment() {
    return this.currentAttachment;
  }
}

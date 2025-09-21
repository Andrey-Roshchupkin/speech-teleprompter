import { ref, readonly } from 'vue';
import type { Attachment } from '@/types/global';

/**
 * Composable for managing attachments in the teleprompter
 * Handles parsing, display, and positioning of attachments
 */
export const useAttachmentManager = () => {
  const attachments = ref<Attachment[]>([]);
  const currentAttachment = ref<Attachment | null>(null);
  const originalScriptWords = ref<string[]>([]);

  /**
   * Parse attachments from script text
   */
  const parseAttachments = (scriptText: string): void => {
    attachments.value = [];

    const attachmentRegex =
      /\[ATTACHMENT:([^\]]+)\]([\s\S]*?)\[\/ATTACHMENT\]/g;
    let match;

    while ((match = attachmentRegex.exec(scriptText)) !== null) {
      const attachmentContent = match[2].trim();

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

      attachments.value.push({
        name: match[1], // Extract attachment name from regex match
        content: attachmentContent,
        startWordIndex: startWordIndex,
        endWordIndex: endWordIndex,
      });
    }
  };

  /**
   * Set original script words for position conversion
   */
  const setOriginalScriptWords = (words: string[]): void => {
    originalScriptWords.value = words;
  };

  /**
   * Convert position from original script (with attachments) to display script (without attachments)
   */
  const convertOriginalToDisplayPosition = (
    originalPosition: number
  ): number => {
    let displayPosition = 0;

    // Check if originalScriptWords is available
    if (
      !originalScriptWords.value ||
      !Array.isArray(originalScriptWords.value)
    ) {
      return originalPosition;
    }

    for (
      let i = 0;
      i < originalScriptWords.value.length && i <= originalPosition;
      i++
    ) {
      let isInAttachment = false;
      for (const attachment of attachments.value) {
        if (i >= attachment.startWordIndex && i < attachment.endWordIndex) {
          isInAttachment = true;
          break;
        }
      }

      if (!isInAttachment) {
        if (i === originalPosition) {
          return displayPosition;
        }
        displayPosition++;
      } else if (i === originalPosition) {
        // If the requested position is inside an attachment, return -1
        return -1;
      }
    }

    return displayPosition;
  };

  /**
   * Find the display position of an attachment name (not content)
   */
  const findAttachmentDisplayPosition = (
    attachment: Attachment,
    scriptWords: string[]
  ): number => {
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
  };

  /**
   * Update attachment display based on current position
   */
  const updateAttachmentDisplay = (
    currentPosition: number,
    scriptWords: string[]
  ): void => {
    // Find current attachment based on position
    let newCurrentAttachment: Attachment | null = null;

    // Check if current word is an attachment name
    if (currentPosition < scriptWords.length) {
      const currentWord = scriptWords[currentPosition];

      if (
        currentWord &&
        currentWord.startsWith('[') &&
        currentWord.endsWith(']')
      ) {
        const attachmentName = currentWord.slice(1, -1); // Remove [ and ]

        // Find the attachment with this name
        for (const attachment of attachments.value) {
          if (attachment.name === attachmentName) {
            newCurrentAttachment = attachment;
            break;
          }
        }
      }
    }

    // If no current attachment found, show the next upcoming attachment
    if (!newCurrentAttachment && attachments.value.length > 0) {
      // Find the next attachment that hasn't been reached yet
      for (const attachment of attachments.value) {
        // Find the display position of the attachment name
        const displayPosition = findAttachmentDisplayPosition(
          attachment,
          scriptWords
        );
        if (displayPosition >= currentPosition) {
          newCurrentAttachment = attachment;
          break;
        }
      }
    }

    currentAttachment.value = newCurrentAttachment;
  };

  /**
   * Find the next valid position after an attachment
   */
  const findNextValidPosition = (position: number): number => {
    // Find which attachment contains this position
    for (const attachment of attachments.value) {
      if (
        position >= attachment.startWordIndex &&
        position < attachment.endWordIndex
      ) {
        // Return the position right after this attachment
        return attachment.endWordIndex;
      }
    }

    // If not found in any attachment, return the original position
    return position;
  };

  /**
   * Reset attachment state
   */
  const reset = (): void => {
    currentAttachment.value = null;
  };

  /**
   * Show first attachment if available
   */
  const showFirstAttachment = (): void => {
    if (attachments.value.length > 0) {
      // Show the first attachment
      currentAttachment.value = attachments.value[0];
    }
  };

  /**
   * Get display text with attachments replaced by names
   */
  const getDisplayText = (scriptText: string): string => {
    return scriptText.replace(
      /\[ATTACHMENT:([^\]]+)\][\s\S]*?\[\/ATTACHMENT\]/g,
      (match, attachmentName) => {
        return `[${attachmentName}]`;
      }
    );
  };

  return {
    // State
    attachments: readonly(attachments),
    currentAttachment: readonly(currentAttachment),
    originalScriptWords: readonly(originalScriptWords),

    // Methods
    parseAttachments,
    setOriginalScriptWords,
    convertOriginalToDisplayPosition,
    findAttachmentDisplayPosition,
    updateAttachmentDisplay,
    findNextValidPosition,
    reset,
    showFirstAttachment,
    getDisplayText,
  };
};

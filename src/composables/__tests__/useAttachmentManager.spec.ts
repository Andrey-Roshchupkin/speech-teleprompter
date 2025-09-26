import { describe, it, expect, beforeEach } from 'vitest';
import { useAttachmentManager } from '../useAttachmentManager';

describe('useAttachmentManager', () => {
  let attachmentManager: ReturnType<typeof useAttachmentManager>;

  beforeEach(() => {
    attachmentManager = useAttachmentManager();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      expect(attachmentManager.attachments.value).toEqual([]);
      expect(attachmentManager.currentAttachment.value).toBe(null);
      expect(attachmentManager.originalScriptWords.value).toEqual([]);
    });
  });

  describe('parseAttachments', () => {
    it('should parse single attachment from script text', () => {
      const scriptText =
        'Hello [ATTACHMENT:image1]This is an image[/ATTACHMENT] world';

      attachmentManager.parseAttachments(scriptText);

      expect(attachmentManager.attachments.value).toHaveLength(1);
      expect(attachmentManager.attachments.value[0]).toEqual({
        name: 'image1',
        content: 'This is an image',
        startWordIndex: 1, // After "Hello"
        endWordIndex: 5, // "Hello" + 4 words in attachment
      });
    });

    it('should parse multiple attachments from script text', () => {
      const scriptText = `
        Start [ATTACHMENT:image1]First image[/ATTACHMENT] 
        middle [ATTACHMENT:image2]Second image[/ATTACHMENT] end
      `;

      attachmentManager.parseAttachments(scriptText);

      expect(attachmentManager.attachments.value).toHaveLength(2);
      expect(attachmentManager.attachments.value[0]).toEqual({
        name: 'image1',
        content: 'First image',
        startWordIndex: 1, // After "Start"
        endWordIndex: 3, // "Start" + 2 words in first attachment
      });
      expect(attachmentManager.attachments.value[1]).toEqual({
        name: 'image2',
        content: 'Second image',
        startWordIndex: 4, // After "Start" + first attachment + "middle"
        endWordIndex: 6, // Previous + 2 words in second attachment
      });
    });

    it('should handle script text without attachments', () => {
      const scriptText = 'Hello world this is a test';

      attachmentManager.parseAttachments(scriptText);

      expect(attachmentManager.attachments.value).toEqual([]);
    });

    it('should handle empty script text', () => {
      attachmentManager.parseAttachments('');

      expect(attachmentManager.attachments.value).toEqual([]);
    });

    it('should handle malformed attachment tags', () => {
      const scriptText = 'Hello [ATTACHMENT:image1]Incomplete world';

      attachmentManager.parseAttachments(scriptText);

      expect(attachmentManager.attachments.value).toEqual([]);
    });

    it('should clear existing attachments when parsing new text', () => {
      const firstScript = 'Hello [ATTACHMENT:image1]First[/ATTACHMENT] world';
      const secondScript = 'New [ATTACHMENT:image2]Second[/ATTACHMENT] text';

      attachmentManager.parseAttachments(firstScript);
      expect(attachmentManager.attachments.value).toHaveLength(1);

      attachmentManager.parseAttachments(secondScript);
      expect(attachmentManager.attachments.value).toHaveLength(1);
      expect(attachmentManager.attachments.value[0].name).toBe('image2');
    });
  });

  describe('setOriginalScriptWords', () => {
    it('should set original script words', () => {
      const words = ['Hello', 'world', 'this', 'is', 'a', 'test'];

      attachmentManager.setOriginalScriptWords(words);

      expect(attachmentManager.originalScriptWords.value).toEqual(words);
    });

    it('should handle empty words array', () => {
      attachmentManager.setOriginalScriptWords([]);

      expect(attachmentManager.originalScriptWords.value).toEqual([]);
    });
  });

  describe('convertOriginalToDisplayPosition', () => {
    beforeEach(() => {
      const scriptText =
        'Hello [ATTACHMENT:image1]This is an image[/ATTACHMENT] world test';
      attachmentManager.parseAttachments(scriptText);
      attachmentManager.setOriginalScriptWords([
        'Hello',
        '[ATTACHMENT:image1]This',
        'is',
        'an',
        'image[/ATTACHMENT]',
        'world',
        'test',
      ]);
    });

    it('should convert position before attachment', () => {
      const displayPosition =
        attachmentManager.convertOriginalToDisplayPosition(0);

      expect(displayPosition).toBe(0); // "Hello" -> "Hello"
    });

    it('should convert position at attachment start', () => {
      const displayPosition =
        attachmentManager.convertOriginalToDisplayPosition(1);

      expect(displayPosition).toBe(-1); // Position inside attachment returns -1
    });

    it('should convert position after attachment', () => {
      const displayPosition =
        attachmentManager.convertOriginalToDisplayPosition(5);

      expect(displayPosition).toBe(1); // "world" -> "world" (position 1 in display)
    });

    it('should handle position beyond script length', () => {
      const displayPosition =
        attachmentManager.convertOriginalToDisplayPosition(10);

      expect(displayPosition).toBe(3); // Clamped to last display word
    });

    it('should handle negative position', () => {
      const displayPosition =
        attachmentManager.convertOriginalToDisplayPosition(-1);

      expect(displayPosition).toBe(0); // Clamped to 0
    });
  });

  describe('findAttachmentDisplayPosition', () => {
    beforeEach(() => {
      const scriptText =
        'Hello [ATTACHMENT:image1]This is an image[/ATTACHMENT] world test';
      attachmentManager.parseAttachments(scriptText);
    });

    it('should find display position of attachment', () => {
      const attachment = attachmentManager.attachments.value[0];
      const scriptWords = ['Hello', '[image1]', 'world', 'test'];

      const position = attachmentManager.findAttachmentDisplayPosition(
        attachment,
        scriptWords
      );

      expect(position).toBe(1); // Position of [image1] in display script
    });

    it('should return -1 when attachment not found in script', () => {
      const attachment = attachmentManager.attachments.value[0];
      const scriptWords = ['Hello', 'world', 'test']; // No attachment

      const position = attachmentManager.findAttachmentDisplayPosition(
        attachment,
        scriptWords
      );

      expect(position).toBe(-1);
    });

    it('should return -1 when script words is empty', () => {
      const attachment = attachmentManager.attachments.value[0];

      const position = attachmentManager.findAttachmentDisplayPosition(
        attachment,
        []
      );

      expect(position).toBe(-1);
    });
  });

  describe('updateAttachmentDisplay', () => {
    beforeEach(() => {
      const scriptText =
        'Hello [ATTACHMENT:image1]This is an image[/ATTACHMENT] world test';
      attachmentManager.parseAttachments(scriptText);
    });

    it('should set current attachment when position is at attachment name', () => {
      attachmentManager.updateAttachmentDisplay(1, [
        'Hello',
        '[image1]',
        'world',
        'test',
      ]);

      expect(attachmentManager.currentAttachment.value).toEqual({
        name: 'image1',
        content: 'This is an image',
        startWordIndex: 1,
        endWordIndex: 5,
      });
    });

    it('should show next upcoming attachment when not at attachment', () => {
      attachmentManager.updateAttachmentDisplay(0, [
        'Hello',
        '[image1]',
        'world',
        'test',
      ]);

      // Should show the first attachment as it's upcoming
      expect(attachmentManager.currentAttachment.value).toEqual({
        name: 'image1',
        content: 'This is an image',
        startWordIndex: 1,
        endWordIndex: 5,
      });
    });

    it('should handle position beyond script length', () => {
      attachmentManager.updateAttachmentDisplay(10, [
        'Hello',
        '[image1]',
        'world',
        'test',
      ]);

      expect(attachmentManager.currentAttachment.value).toBe(null);
    });
  });

  describe('findNextValidPosition', () => {
    beforeEach(() => {
      const scriptText =
        'Hello [ATTACHMENT:image1]This is an image[/ATTACHMENT] world test';
      attachmentManager.parseAttachments(scriptText);
    });

    it('should return same position if not at attachment', () => {
      const nextPosition = attachmentManager.findNextValidPosition(0);

      expect(nextPosition).toBe(0);
    });

    it('should return position after attachment if at attachment start', () => {
      const nextPosition = attachmentManager.findNextValidPosition(1);

      expect(nextPosition).toBe(5); // endWordIndex of the attachment
    });

    it('should return position after attachment if within attachment', () => {
      const nextPosition = attachmentManager.findNextValidPosition(3);

      expect(nextPosition).toBe(5); // endWordIndex of the attachment
    });

    it('should handle position beyond script', () => {
      const nextPosition = attachmentManager.findNextValidPosition(10);

      expect(nextPosition).toBe(10); // Return same position
    });
  });

  describe('reset', () => {
    it('should reset current attachment to null', () => {
      // Set some state
      const scriptText =
        'Hello [ATTACHMENT:image1]This is an image[/ATTACHMENT] world';
      attachmentManager.parseAttachments(scriptText);
      attachmentManager.setOriginalScriptWords(['Hello', 'image1', 'world']);
      attachmentManager.updateAttachmentDisplay(1, [
        'Hello',
        '[image1]',
        'world',
      ]);

      attachmentManager.reset();

      // Only currentAttachment should be reset, attachments and originalScriptWords remain
      expect(attachmentManager.currentAttachment.value).toBe(null);
      expect(attachmentManager.attachments.value).toHaveLength(1);
      expect(attachmentManager.originalScriptWords.value).toEqual([
        'Hello',
        'image1',
        'world',
      ]);
    });
  });

  describe('showFirstAttachment', () => {
    it('should show first attachment if available', () => {
      const scriptText =
        'Hello [ATTACHMENT:image1]First[/ATTACHMENT] [ATTACHMENT:image2]Second[/ATTACHMENT] world';
      attachmentManager.parseAttachments(scriptText);
      attachmentManager.setOriginalScriptWords([
        'Hello',
        'image1',
        'image2',
        'world',
      ]);

      attachmentManager.showFirstAttachment();

      expect(attachmentManager.currentAttachment.value).toEqual({
        name: 'image1',
        content: 'First',
        startWordIndex: 1,
        endWordIndex: 2,
      });
    });

    it('should not change current attachment if none available', () => {
      const scriptText = 'Hello world test';
      attachmentManager.parseAttachments(scriptText);

      attachmentManager.showFirstAttachment();

      expect(attachmentManager.currentAttachment.value).toBe(null);
    });

    it('should always show first attachment regardless of current state', () => {
      const scriptText =
        'Hello [ATTACHMENT:image1]First[/ATTACHMENT] [ATTACHMENT:image2]Second[/ATTACHMENT] world';
      attachmentManager.parseAttachments(scriptText);
      attachmentManager.setOriginalScriptWords([
        'Hello',
        'image1',
        'image2',
        'world',
      ]);

      // Set current attachment to second one
      attachmentManager.updateAttachmentDisplay(2, [
        'Hello',
        '[image1]',
        '[image2]',
        'world',
      ]);

      attachmentManager.showFirstAttachment();

      // Should always show the first attachment
      expect(attachmentManager.currentAttachment.value?.name).toBe('image1');
    });
  });

  describe('getDisplayText', () => {
    it('should replace attachments with their names in brackets', () => {
      const scriptText =
        'Hello [ATTACHMENT:image1]This is an image[/ATTACHMENT] world';

      const displayText = attachmentManager.getDisplayText(scriptText);

      expect(displayText).toBe('Hello [image1] world');
    });

    it('should handle multiple attachments', () => {
      const scriptText =
        'Start [ATTACHMENT:image1]First[/ATTACHMENT] middle [ATTACHMENT:image2]Second[/ATTACHMENT] end';

      const displayText = attachmentManager.getDisplayText(scriptText);

      expect(displayText).toBe('Start [image1] middle [image2] end');
    });

    it('should handle text without attachments', () => {
      const scriptText = 'Hello world this is a test';

      const displayText = attachmentManager.getDisplayText(scriptText);

      expect(displayText).toBe(scriptText);
    });

    it('should handle empty text', () => {
      const displayText = attachmentManager.getDisplayText('');

      expect(displayText).toBe('');
    });

    it('should handle malformed attachment tags', () => {
      const scriptText = 'Hello [ATTACHMENT:image1]Incomplete world';

      const displayText = attachmentManager.getDisplayText(scriptText);

      expect(displayText).toBe(scriptText); // Should remain unchanged
    });
  });

  describe('edge cases', () => {
    it('should handle nested attachment tags (invalid)', () => {
      const scriptText =
        'Hello [ATTACHMENT:outer][ATTACHMENT:inner]content[/ATTACHMENT][/ATTACHMENT] world';

      attachmentManager.parseAttachments(scriptText);

      // Should only parse the outer attachment
      expect(attachmentManager.attachments.value).toHaveLength(1);
      expect(attachmentManager.attachments.value[0].name).toBe('outer');
    });

    it('should handle attachment with empty content', () => {
      const scriptText = 'Hello [ATTACHMENT:empty][/ATTACHMENT] world';

      attachmentManager.parseAttachments(scriptText);

      expect(attachmentManager.attachments.value).toHaveLength(1);
      expect(attachmentManager.attachments.value[0]).toEqual({
        name: 'empty',
        content: '',
        startWordIndex: 1,
        endWordIndex: 2,
      });
    });

    it('should handle attachment with whitespace-only content', () => {
      const scriptText =
        'Hello [ATTACHMENT:whitespace]   \n\t  [/ATTACHMENT] world';

      attachmentManager.parseAttachments(scriptText);

      expect(attachmentManager.attachments.value).toHaveLength(1);
      expect(attachmentManager.attachments.value[0].content).toBe('');
    });

    it('should handle very long attachment names', () => {
      const longName = 'a'.repeat(1000);
      const scriptText = `Hello [ATTACHMENT:${longName}]content[/ATTACHMENT] world`;

      attachmentManager.parseAttachments(scriptText);

      expect(attachmentManager.attachments.value).toHaveLength(1);
      expect(attachmentManager.attachments.value[0].name).toBe(longName);
    });
  });
});

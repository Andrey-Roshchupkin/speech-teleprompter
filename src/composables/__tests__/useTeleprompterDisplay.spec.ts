import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useTeleprompterDisplay,
  type TeleprompterDisplaySettings,
} from '../useTeleprompterDisplay';

// Mock useAttachmentManager
vi.mock('../useAttachmentManager', () => ({
  useAttachmentManager: () => ({
    getDisplayText: vi.fn((text: string) => text),
    getOriginalText: vi.fn((text: string) => text),
    extractAttachments: vi.fn(() => []),
    updateAttachmentDisplay: vi.fn(),
    reset: vi.fn(),
    showFirstAttachment: vi.fn(),
  }),
}));

describe('useTeleprompterDisplay', () => {
  let mockOnPositionChange: ReturnType<typeof vi.fn>;
  let mockOnProgressChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnPositionChange = vi.fn();
    mockOnProgressChange = vi.fn();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const display = useTeleprompterDisplay();

      expect(display.scriptText.value).toBe('');
      expect(display.currentPosition.value).toBe(0);
      expect(display.matchedWords.value).toEqual([]);
      expect(display.settings.value).toEqual({
        linesToShow: 5,
        scrollTrigger: 3,
        textSize: 24,
      });
    });

    it('should initialize with custom options', () => {
      const display = useTeleprompterDisplay({
        onPositionChange: mockOnPositionChange,
        onProgressChange: mockOnProgressChange,
      });

      expect(display.scriptText.value).toBe('');
      expect(display.currentPosition.value).toBe(0);
    });
  });

  describe('scriptText', () => {
    it('should update script text', () => {
      const display = useTeleprompterDisplay();
      const testText = 'Hello world this is a test';

      display.scriptText.value = testText;

      expect(display.scriptText.value).toBe(testText);
    });

    it('should split text into words', () => {
      const display = useTeleprompterDisplay();
      const testText = 'Hello world this is a test';

      display.scriptText.value = testText;

      expect(display.scriptWords.value).toEqual([
        'Hello',
        'world',
        'this',
        'is',
        'a',
        'test',
      ]);
    });

    it('should handle empty text', () => {
      const display = useTeleprompterDisplay();

      display.scriptText.value = '';

      expect(display.scriptWords.value).toEqual([]);
      expect(display.totalWords.value).toBe(0);
    });

    it('should handle text with multiple spaces', () => {
      const display = useTeleprompterDisplay();
      const testText = 'Hello    world   this';

      display.scriptText.value = testText;

      expect(display.scriptWords.value).toEqual(['Hello', 'world', 'this']);
    });
  });

  describe('currentPosition', () => {
    it('should update current position via updatePosition method', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world this is a test';

      display.updatePosition(2, []);

      expect(display.currentPosition.value).toBe(2);
    });

    it('should call onPositionChange callback when position changes', () => {
      const display = useTeleprompterDisplay({
        onPositionChange: mockOnPositionChange,
      });

      display.updatePosition(3, []);

      expect(mockOnPositionChange).toHaveBeenCalledWith(3);
    });
  });

  describe('progress calculation', () => {
    it('should calculate progress correctly', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world this is a test'; // 6 words

      display.updatePosition(3, []);

      expect(display.progress.value).toBe(50); // 3/6 * 100 = 50%
    });

    it('should return 0 progress for empty script', () => {
      const display = useTeleprompterDisplay();

      expect(display.progress.value).toBe(0);
    });

    it('should return 100 progress when at end', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world this is a test'; // 6 words

      display.updatePosition(6, []);

      expect(display.progress.value).toBe(100);
    });

    it('should call onProgressChange callback when progress changes', () => {
      const display = useTeleprompterDisplay({
        onProgressChange: mockOnProgressChange,
      });
      display.scriptText.value = 'Hello world this is a test'; // 6 words

      display.updatePosition(3, []);

      expect(mockOnProgressChange).toHaveBeenCalledWith(50);
    });
  });

  describe('displayedWords', () => {
    it('should return all words for display', () => {
      const display = useTeleprompterDisplay();
      const testText = 'Hello world this is a test';

      display.scriptText.value = testText;

      expect(display.displayedWords.value).toEqual([
        'Hello',
        'world',
        'this',
        'is',
        'a',
        'test',
      ]);
    });
  });

  describe('settings', () => {
    it('should update settings', () => {
      const display = useTeleprompterDisplay();
      const newSettings: TeleprompterDisplaySettings = {
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
      };

      display.settings.value = newSettings;

      expect(display.settings.value).toEqual(newSettings);
    });

    it('should update individual setting properties', () => {
      const display = useTeleprompterDisplay();

      display.settings.value.linesToShow = 7;
      display.settings.value.textSize = 30;

      expect(display.settings.value.linesToShow).toBe(7);
      expect(display.settings.value.textSize).toBe(30);
    });
  });

  describe('updateSettings', () => {
    it('should update settings with new values', () => {
      const display = useTeleprompterDisplay();
      const newSettings: TeleprompterDisplaySettings = {
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
      };

      display.updateSettings(newSettings);

      expect(display.settings.value).toEqual(newSettings);
    });

    it('should merge partial settings', () => {
      const display = useTeleprompterDisplay();
      const originalSettings = { ...display.settings.value };

      display.updateSettings({ linesToShow: 7 });

      expect(display.settings.value.linesToShow).toBe(7);
      expect(display.settings.value.scrollTrigger).toBe(
        originalSettings.scrollTrigger
      );
      expect(display.settings.value.textSize).toBe(originalSettings.textSize);
    });
  });

  describe('updatePosition', () => {
    it('should update position and matched words', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world this is a test';

      display.updatePosition(2, [0, 1]);

      expect(display.currentPosition.value).toBe(2);
      expect(display.matchedWords.value).toEqual([0, 1]);
    });

    it('should call onPositionChange callback', () => {
      const display = useTeleprompterDisplay({
        onPositionChange: mockOnPositionChange,
      });

      display.updatePosition(3, [0, 1, 2]);

      expect(mockOnPositionChange).toHaveBeenCalledWith(3);
    });
  });

  describe('reset', () => {
    it('should reset position and matched words to initial values', () => {
      const display = useTeleprompterDisplay();

      // Set some state
      display.scriptText.value = 'Test script';
      display.updatePosition(5, [0, 1, 2]);
      display.settings.value = {
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
      };

      display.reset();

      // scriptText and settings should remain unchanged
      expect(display.scriptText.value).toBe('Test script');
      expect(display.settings.value).toEqual({
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
      });

      // Only position and matched words should be reset
      expect(display.currentPosition.value).toBe(0);
      expect(display.matchedWords.value).toEqual([]);
    });
  });

  describe('getter methods', () => {
    it('should return current position', () => {
      const display = useTeleprompterDisplay();
      display.updatePosition(5, []);

      expect(display.getCurrentPosition()).toBe(5);
    });

    it('should return total words count', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world this is a test';

      expect(display.getTotalWords()).toBe(6);
    });

    it('should return progress percentage', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world this is a test'; // 6 words
      display.updatePosition(3, []);

      expect(display.getProgress()).toBe(50);
    });

    it('should return original script words', () => {
      const display = useTeleprompterDisplay();
      const testText = 'Hello world this is a test';
      display.scriptText.value = testText;

      const originalWords = display.getOriginalScriptWords();

      expect(originalWords).toEqual([
        'Hello',
        'world',
        'this',
        'is',
        'a',
        'test',
      ]);
    });
  });

  describe('scroll methods', () => {
    it('should scroll to specific position', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world this is a test';

      display.scrollToPosition(3);

      expect(display.currentPosition.value).toBe(3);
    });

    it('should scroll up by scrollTrigger amount', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world this is a test';
      display.updatePosition(5, []); // Start at position 5
      // scrollTrigger is 3 by default

      display.scrollUp();

      expect(display.currentPosition.value).toBe(2); // 5 - 3 = 2
    });

    it('should not scroll up below 0', () => {
      const display = useTeleprompterDisplay();
      display.updatePosition(0, []);

      display.scrollUp();

      expect(display.currentPosition.value).toBe(0);
    });

    it('should scroll down by scrollTrigger amount', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world this is a test'; // 6 words
      display.updatePosition(2, []); // Start at position 2
      // scrollTrigger is 3 by default

      display.scrollDown();

      expect(display.currentPosition.value).toBe(5); // 2 + 3 = 5
    });

    it('should not scroll down beyond total words', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world this is a test'; // 6 words
      display.updatePosition(6, []);

      display.scrollDown();

      expect(display.currentPosition.value).toBe(6);
    });
  });

  describe('edge cases', () => {
    it('should handle position beyond total words', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world'; // 2 words

      display.updatePosition(5, []);

      expect(display.progress.value).toBe(250); // 5/2 * 100 = 250%
    });

    it('should handle negative position', () => {
      const display = useTeleprompterDisplay();
      display.scriptText.value = 'Hello world'; // 2 words

      display.updatePosition(-1, []);

      expect(display.progress.value).toBe(-50); // -1/2 * 100 = -50
    });

    it('should handle text with only spaces', () => {
      const display = useTeleprompterDisplay();

      display.scriptText.value = '   ';

      expect(display.scriptWords.value).toEqual([]);
      expect(display.totalWords.value).toBe(0);
    });

    it('should handle text with special characters', () => {
      const display = useTeleprompterDisplay();

      display.scriptText.value = 'Hello, world! This is a test.';

      expect(display.scriptWords.value).toEqual([
        'Hello,',
        'world!',
        'This',
        'is',
        'a',
        'test.',
      ]);
    });
  });
});

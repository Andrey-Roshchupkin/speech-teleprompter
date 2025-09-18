/**
 * Unit Tests for DisplayManager
 */

import { DisplayManager } from '../../managers/DisplayManager.js';

describe('DisplayManager', () => {
  let displayManager;
  let mockTeleprompterText;
  let mockTeleprompterDisplay;
  let mockLogger;

  beforeEach(() => {
    // Create mock DOM elements
    mockTeleprompterText = {
      innerHTML: '',
    };

    mockTeleprompterDisplay = {
      style: { fontSize: '' },
      dataset: {},
    };

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    displayManager = new DisplayManager(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default values', () => {
      expect(displayManager.teleprompterText).toBe(null);
      expect(displayManager.teleprompterDisplay).toBe(null);
      expect(displayManager.scriptWords).toEqual([]);
      expect(displayManager.currentPosition).toBe(0);
      expect(displayManager.matchedWords).toEqual([]);
      expect(displayManager.linesToShow).toBe(5);
      expect(displayManager.textSize).toBe(20);
    });

    test('should initialize with teleprompter elements', () => {
      displayManager.initialize(mockTeleprompterText, mockTeleprompterDisplay);

      expect(displayManager.teleprompterText).toBe(mockTeleprompterText);
      expect(displayManager.teleprompterDisplay).toBe(mockTeleprompterDisplay);
    });
  });

  describe('updateScriptWords', () => {
    test('should update script words', () => {
      const words = ['hello', 'world', 'test'];

      displayManager.updateScriptWords(words);

      expect(displayManager.scriptWords).toEqual(words);
    });
  });

  describe('updateCurrentPosition', () => {
    test('should update current position', () => {
      displayManager.updateCurrentPosition(2);

      expect(displayManager.currentPosition).toBe(2);
    });

    test('should handle invalid position (-1)', () => {
      displayManager.updateCurrentPosition(1);
      const originalPosition = displayManager.currentPosition;

      displayManager.updateCurrentPosition(-1);

      expect(displayManager.currentPosition).toBe(originalPosition);
    });
  });

  describe('updateMatchedWords', () => {
    test('should update matched words', () => {
      const matchedWords = [0, 2, 4];

      displayManager.updateMatchedWords(matchedWords);

      expect(displayManager.matchedWords).toEqual(matchedWords);
    });
  });

  describe('addMatchedWord', () => {
    test('should add new matched word', () => {
      displayManager.addMatchedWord(1);

      expect(displayManager.matchedWords).toContain(1);
    });

    test('should not add duplicate matched word', () => {
      displayManager.addMatchedWord(1);
      displayManager.addMatchedWord(1);

      expect(displayManager.matchedWords).toEqual([1]);
    });
  });

  describe('updateSettings', () => {
    test('should update lines to show and text size', () => {
      displayManager.initialize(mockTeleprompterText, mockTeleprompterDisplay);

      displayManager.updateSettings(3, 18);

      expect(displayManager.linesToShow).toBe(3);
      expect(displayManager.textSize).toBe(18);
      expect(mockTeleprompterDisplay.dataset.linesToShow).toBe('3');
    });
  });

  describe('updateTextSize', () => {
    test('should update text size in DOM', () => {
      displayManager.initialize(mockTeleprompterText, mockTeleprompterDisplay);
      displayManager.textSize = 24;

      displayManager.updateTextSize();

      expect(mockTeleprompterDisplay.style.fontSize).toBe('24px');
    });

    test('should handle missing teleprompter display', () => {
      displayManager.teleprompterDisplay = null;

      expect(() => displayManager.updateTextSize()).not.toThrow();
    });
  });

  describe('updateDisplayContent', () => {
    beforeEach(() => {
      displayManager.initialize(mockTeleprompterText, mockTeleprompterDisplay);
    });

    test('should show placeholder when no script words', () => {
      displayManager.updateDisplayContent();

      expect(mockTeleprompterText.innerHTML).toBe(
        'Enter your script in the text area to see it here...'
      );
    });

    test('should handle missing teleprompter text element', () => {
      displayManager.teleprompterText = null;

      expect(() => displayManager.updateDisplayContent()).not.toThrow();
    });

    test('should highlight current position', () => {
      displayManager.updateScriptWords(['hello', 'world', 'test']);
      displayManager.updateCurrentPosition(1);

      displayManager.updateDisplayContent();

      expect(mockTeleprompterText.innerHTML).toContain(
        '<span class="teleprompter-highlight">world</span>'
      );
    });

    test('should highlight matched words', () => {
      displayManager.updateScriptWords(['hello', 'world', 'test']);
      displayManager.updateCurrentPosition(1); // Set current position to avoid conflict
      displayManager.updateMatchedWords([0, 2]);

      displayManager.updateDisplayContent();

      expect(mockTeleprompterText.innerHTML).toContain(
        '<span class="teleprompter-matched">hello</span>'
      );
      expect(mockTeleprompterText.innerHTML).toContain(
        '<span class="teleprompter-matched">test</span>'
      );
    });

    test('should fade out words before current position', () => {
      displayManager.updateScriptWords(['hello', 'world', 'test']);
      displayManager.updateCurrentPosition(2);

      displayManager.updateDisplayContent();

      expect(mockTeleprompterText.innerHTML).toContain(
        '<span class="teleprompter-faded">hello</span>'
      );
      expect(mockTeleprompterText.innerHTML).toContain(
        '<span class="teleprompter-faded">world</span>'
      );
    });

    test('should handle attachment names', () => {
      displayManager.updateScriptWords(['hello', '[attachment]', 'world']);

      displayManager.updateDisplayContent();

      expect(mockTeleprompterText.innerHTML).toContain(
        '<span class="teleprompter-attachment-name">[attachment]</span>'
      );
    });
  });

  describe('autoSkipAttachments', () => {
    test('should skip attachment names at current position', () => {
      displayManager.updateScriptWords(['hello', '[attachment]', 'world']);
      displayManager.updateCurrentPosition(1);

      displayManager.autoSkipAttachments();

      expect(displayManager.currentPosition).toBe(2);
    });

    test('should handle out of bounds position', () => {
      displayManager.updateScriptWords(['hello', 'world']);
      displayManager.updateCurrentPosition(-1);

      expect(() => displayManager.autoSkipAttachments()).not.toThrow();
    });

    test('should handle position beyond script length', () => {
      displayManager.updateScriptWords(['hello', 'world']);
      displayManager.updateCurrentPosition(5);

      expect(() => displayManager.autoSkipAttachments()).not.toThrow();
    });

    test('should recursively skip multiple attachments', () => {
      displayManager.updateScriptWords(['hello', '[attachment1]', '[attachment2]', 'world']);
      displayManager.updateCurrentPosition(1);

      displayManager.autoSkipAttachments();

      expect(displayManager.currentPosition).toBe(3);
    });
  });

  describe('reset', () => {
    test('should reset position and matched words', () => {
      displayManager.updateCurrentPosition(5);
      displayManager.updateMatchedWords([1, 2, 3]);

      displayManager.reset();

      expect(displayManager.currentPosition).toBe(0);
      expect(displayManager.matchedWords).toEqual([]);
    });
  });

  describe('Getter methods', () => {
    test('should return current position', () => {
      displayManager.updateCurrentPosition(3);

      expect(displayManager.getCurrentPosition()).toBe(3);
    });

    test('should return script words', () => {
      const words = ['hello', 'world'];
      displayManager.updateScriptWords(words);

      expect(displayManager.getScriptWords()).toEqual(words);
    });

    test('should return matched words', () => {
      const matched = [0, 2];
      displayManager.updateMatchedWords(matched);

      expect(displayManager.getMatchedWords()).toEqual(matched);
    });

    test('should return lines to show', () => {
      displayManager.updateSettings(7, 20);

      expect(displayManager.getLinesToShow()).toBe(7);
    });

    test('should return text size', () => {
      displayManager.updateSettings(5, 18);

      expect(displayManager.getTextSize()).toBe(18);
    });

    test('should return current word', () => {
      displayManager.updateScriptWords(['hello', 'world', 'test']);
      displayManager.updateCurrentPosition(1);

      expect(displayManager.getCurrentWord()).toBe('world');
    });

    test('should return null for current word when out of bounds', () => {
      displayManager.updateScriptWords(['hello', 'world']);
      displayManager.updateCurrentPosition(5);

      expect(displayManager.getCurrentWord()).toBe(null);
    });
  });
});

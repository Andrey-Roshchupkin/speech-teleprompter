import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFuzzyMatcher, type ProcessedMatchResult } from '../useFuzzyMatcher';

describe('useFuzzyMatcher', () => {
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let mockOnMatchFound: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };
    mockOnMatchFound = vi.fn();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const fuzzyMatcher = useFuzzyMatcher();

      expect(fuzzyMatcher.lastValidPosition.value).toBe(0);
      expect(fuzzyMatcher.isProcessing.value).toBe(false);
      expect(fuzzyMatcher.performanceStats.totalSearches).toBe(0);
      expect(fuzzyMatcher.performanceStats.totalTime).toBe(0);
      expect(fuzzyMatcher.performanceStats.averageTime).toBe(0);
      expect(fuzzyMatcher.performanceStats.maxSearchTime).toBe(0);
      expect(fuzzyMatcher.accumulatedSpokenWords.value).toEqual([]);
      expect(fuzzyMatcher.contextWindowSize.value).toBe(30);
    });

    it('should initialize with custom options', () => {
      const fuzzyMatcher = useFuzzyMatcher({
        onMatchFound: mockOnMatchFound,
        logger: mockLogger,
      });

      expect(fuzzyMatcher.lastValidPosition.value).toBe(0);
      expect(fuzzyMatcher.isProcessing.value).toBe(false);
    });
  });

  describe('updatePosition', () => {
    it('should update position and reset context', () => {
      const fuzzyMatcher = useFuzzyMatcher({ logger: mockLogger });

      fuzzyMatcher.updatePosition(10);

      expect(fuzzyMatcher.lastValidPosition.value).toBe(10);
      expect(fuzzyMatcher.accumulatedSpokenWords.value).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '🔄 Manually updating position to 10'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '✅ Position updated: lastValid=10, lastProcessed=10'
      );
    });

    it('should handle multiple position updates', () => {
      const fuzzyMatcher = useFuzzyMatcher({ logger: mockLogger });

      fuzzyMatcher.updatePosition(5);
      expect(fuzzyMatcher.lastValidPosition.value).toBe(5);

      fuzzyMatcher.updatePosition(15);
      expect(fuzzyMatcher.lastValidPosition.value).toBe(15);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const fuzzyMatcher = useFuzzyMatcher();

      // Modify some state
      fuzzyMatcher.updatePosition(10);

      // Reset
      fuzzyMatcher.reset();

      expect(fuzzyMatcher.lastValidPosition.value).toBe(0);
      expect(fuzzyMatcher.performanceStats.totalSearches).toBe(0);
      expect(fuzzyMatcher.performanceStats.totalTime).toBe(0);
      expect(fuzzyMatcher.accumulatedSpokenWords.value).toEqual([]);
    });
  });

  describe('clearAccumulatedContext', () => {
    it('should clear accumulated words and update last processed position', () => {
      const fuzzyMatcher = useFuzzyMatcher();

      // Set some state
      fuzzyMatcher.updatePosition(10);

      // Clear context
      fuzzyMatcher.clearAccumulatedContext();

      expect(fuzzyMatcher.accumulatedSpokenWords.value).toEqual([]);
    });
  });

  describe('getPerformanceStats', () => {
    it('should return performance statistics', () => {
      const fuzzyMatcher = useFuzzyMatcher();

      const stats = fuzzyMatcher.getPerformanceStats();

      expect(stats).toEqual({
        totalSearches: 0,
        totalTime: 0,
        averageTime: 0,
        maxSearchTime: 0,
      });
    });
  });

  describe('processSpokenWords', () => {
    it('should handle empty script words', async () => {
      const fuzzyMatcher = useFuzzyMatcher({ logger: mockLogger });

      await fuzzyMatcher.processSpokenWords(['hello'], [], 0);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'No script words to match against'
      );
    });

    it('should process spoken words and find matches', async () => {
      const fuzzyMatcher = useFuzzyMatcher({
        onMatchFound: mockOnMatchFound,
        logger: mockLogger,
      });

      const scriptWords = [
        'Welcome',
        'to',
        'our',
        'presentation',
        'Today',
        'we',
        'will',
        'be',
      ];
      const spokenWords = ['Welcome', 'to', 'our', 'presentation'];

      await fuzzyMatcher.processSpokenWords(spokenWords, scriptWords, 0);

      // Should find a match and call onMatchFound
      expect(mockOnMatchFound).toHaveBeenCalled();

      const callArgs = mockOnMatchFound.mock
        .calls[0][0] as ProcessedMatchResult;
      expect(callArgs.newPosition).toBe(4); // index 0 + length 4
      expect(callArgs.matchedIndices).toEqual([0, 1, 2, 3]);
      expect(callArgs.match.index).toBe(0);
      expect(callArgs.match.score).toBeGreaterThan(0);
    });

    it('should not find match if threshold not met', async () => {
      const fuzzyMatcher = useFuzzyMatcher({
        onMatchFound: mockOnMatchFound,
        logger: mockLogger,
      });

      const scriptWords = ['Welcome', 'to', 'our', 'presentation'];
      const spokenWords = ['Completely', 'different', 'words', 'here'];

      await fuzzyMatcher.processSpokenWords(spokenWords, scriptWords, 0);

      // Should not find a match
      expect(mockOnMatchFound).not.toHaveBeenCalled();
    });

    it('should prevent backward jumps during automatic processing', async () => {
      const fuzzyMatcher = useFuzzyMatcher({
        onMatchFound: mockOnMatchFound,
        logger: mockLogger,
      });

      // Set a high lastValidPosition
      fuzzyMatcher.updatePosition(10);

      // Wait for the manual flag to reset
      await new Promise((resolve) => setTimeout(resolve, 150));

      const scriptWords = ['Welcome', 'to', 'our', 'presentation'];
      const spokenWords = ['Welcome', 'to', 'our', 'presentation'];

      await fuzzyMatcher.processSpokenWords(spokenWords, scriptWords, 0);

      // Should prevent backward jump
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Preventing backward jump')
      );
      expect(mockOnMatchFound).not.toHaveBeenCalled();
    });

    it('should allow backward jumps during manual position updates', async () => {
      const fuzzyMatcher = useFuzzyMatcher({
        onMatchFound: mockOnMatchFound,
        logger: mockLogger,
      });

      // Set a high lastValidPosition
      fuzzyMatcher.updatePosition(10);

      // Immediately try to process (while manual flag is still true)
      const scriptWords = ['Welcome', 'to', 'our', 'presentation'];
      const spokenWords = ['Welcome', 'to', 'our', 'presentation'];

      await fuzzyMatcher.processSpokenWords(spokenWords, scriptWords, 0);

      // Should allow the match since it's during manual update
      expect(mockOnMatchFound).toHaveBeenCalled();
    });
  });

  describe('performance monitoring', () => {
    it('should track performance statistics', async () => {
      const fuzzyMatcher = useFuzzyMatcher({
        onMatchFound: mockOnMatchFound,
        logger: mockLogger,
      });

      const scriptWords = ['Welcome', 'to', 'our', 'presentation'];
      const spokenWords = ['Welcome', 'to', 'our', 'presentation'];

      await fuzzyMatcher.processSpokenWords(spokenWords, scriptWords, 0);

      const stats = fuzzyMatcher.getPerformanceStats();
      expect(stats.totalSearches).toBe(1);
      expect(stats.totalTime).toBeGreaterThan(0);
      expect(stats.averageTime).toBe(stats.totalTime);
      expect(stats.maxSearchTime).toBe(stats.totalTime);
    });

    it('should log performance warnings for slow searches', async () => {
      const fuzzyMatcher = useFuzzyMatcher({
        onMatchFound: mockOnMatchFound,
        logger: mockLogger,
      });

      // Mock performance.now to simulate slow search
      const originalNow = performance.now;
      performance.now = vi
        .fn()
        .mockReturnValueOnce(0) // start time
        .mockReturnValueOnce(25); // end time (25ms > 20ms threshold)

      const scriptWords = ['Welcome', 'to', 'our', 'presentation'];
      const spokenWords = ['Welcome', 'to', 'our', 'presentation'];

      await fuzzyMatcher.processSpokenWords(spokenWords, scriptWords, 0);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Slow search detected')
      );

      // Restore original performance.now
      performance.now = originalNow;
    });
  });

  describe('queue processing', () => {
    it('should process multiple requests in queue', async () => {
      const fuzzyMatcher = useFuzzyMatcher({
        onMatchFound: mockOnMatchFound,
        logger: mockLogger,
      });

      const scriptWords = [
        'Welcome',
        'to',
        'our',
        'presentation',
        'Today',
        'we',
        'will',
        'be',
      ];

      // Add multiple requests
      const promise1 = fuzzyMatcher.processSpokenWords(
        ['Welcome', 'to'],
        scriptWords,
        0
      );
      const promise2 = fuzzyMatcher.processSpokenWords(
        ['our', 'presentation'],
        scriptWords,
        0
      );

      await Promise.all([promise1, promise2]);

      // Both should be processed
      expect(mockOnMatchFound).toHaveBeenCalledTimes(2);
    });
  });
});

/**
 * Unit Tests for FuzzyMatcher
 */

import { FuzzyMatcher } from '../fuzzy-matcher.js';

describe('FuzzyMatcher', () => {
  let fuzzyMatcher;

  beforeEach(() => {
    fuzzyMatcher = new FuzzyMatcher();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default precision', () => {
      expect(fuzzyMatcher.precision).toBe(65);
      expect(fuzzyMatcher.performanceStats).toEqual({
        totalSearches: 0,
        totalTime: 0,
        averageTime: 0,
        maxSearchTime: 0,
      });
    });

    test('should initialize performance stats', () => {
      expect(fuzzyMatcher.performanceStats).toBeDefined();
      expect(fuzzyMatcher.performanceStats.totalSearches).toBe(0);
      expect(fuzzyMatcher.performanceStats.totalTime).toBe(0);
    });
  });

  describe('setPrecision', () => {
    test('should set precision within valid range', () => {
      fuzzyMatcher.setPrecision(60);
      expect(fuzzyMatcher.precision).toBe(60);

      fuzzyMatcher.setPrecision(80);
      expect(fuzzyMatcher.precision).toBe(80);
    });

    test('should clamp precision to minimum value', () => {
      fuzzyMatcher.setPrecision(30);
      expect(fuzzyMatcher.precision).toBe(50);
    });

    test('should clamp precision to maximum value', () => {
      fuzzyMatcher.setPrecision(100);
      expect(fuzzyMatcher.precision).toBe(95);
    });
  });

  describe('calculateSimilarity', () => {
    test('should return 1 for identical strings', () => {
      const similarity = fuzzyMatcher.calculateSimilarity('hello', 'hello');
      expect(similarity).toBe(1);
    });

    test('should return 0 for very different length strings', () => {
      const similarity = fuzzyMatcher.calculateSimilarity(
        'a',
        'very long string that is completely different'
      );
      expect(similarity).toBe(0);
    });

    test('should calculate similarity for similar strings', () => {
      const similarity = fuzzyMatcher.calculateSimilarity('hello', 'helo');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    test('should handle empty strings', () => {
      const similarity = fuzzyMatcher.calculateSimilarity('', '');
      expect(similarity).toBe(1);
    });

    test('should handle one empty string', () => {
      const similarity = fuzzyMatcher.calculateSimilarity('hello', '');
      expect(similarity).toBe(0);
    });
  });

  describe('findBestMatch', () => {
    test('should find exact match', async () => {
      const scriptWords = ['hello', 'world', 'test'];
      const spokenWords = ['hello'];

      const result = await fuzzyMatcher.findBestMatch(spokenWords, scriptWords, 0);

      expect(result.index).toBe(0);
      expect(result.score).toBeGreaterThan(0);
    });

    test('should find fuzzy match with typos', async () => {
      const scriptWords = ['hello', 'world', 'test'];
      const spokenWords = ['helo']; // typo in hello

      const result = await fuzzyMatcher.findBestMatch(spokenWords, scriptWords, 0);

      expect(result.index).toBe(0);
      expect(result.score).toBeGreaterThan(0);
    });

    test('should not find match below threshold', async () => {
      const scriptWords = ['hello', 'world', 'test'];
      const spokenWords = ['xyz']; // completely different

      const result = await fuzzyMatcher.findBestMatch(spokenWords, scriptWords, 0);

      expect(result.index).toBe(-1);
    });

    test('should search forward from start position', async () => {
      const scriptWords = ['hello', 'world', 'test'];
      const spokenWords = ['world'];

      const result = await fuzzyMatcher.findBestMatch(spokenWords, scriptWords, 1);

      expect(result.index).toBe(1);
    });

    test('should return -1 for empty script words', async () => {
      const scriptWords = [];
      const spokenWords = ['hello'];

      const result = await fuzzyMatcher.findBestMatch(spokenWords, scriptWords, 0);

      expect(result.index).toBe(-1);
    });
  });

  describe('processSpokenWords', () => {
    test('should process spoken words and call callback', async () => {
      const scriptWords = ['hello', 'world'];
      const callback = jest.fn();

      await fuzzyMatcher.processSpokenWords(['hello'], scriptWords, 0, callback);

      expect(callback).toHaveBeenCalled();
    });

    test('should not call callback for no match', async () => {
      const scriptWords = ['hello', 'world'];
      const callback = jest.fn();

      await fuzzyMatcher.processSpokenWords(['xyz'], scriptWords, 0, callback);

      expect(callback).not.toHaveBeenCalled();
    });

    test('should prevent backward movement', async () => {
      const scriptWords = ['hello', 'world'];
      const callback = jest.fn();

      await fuzzyMatcher.processSpokenWords(['hello'], scriptWords, 1, callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Performance Stats', () => {
    test('should update performance stats after search', async () => {
      const scriptWords = ['hello', 'world'];
      const spokenWords = ['hello'];

      await fuzzyMatcher.findBestMatch(spokenWords, scriptWords, 0);

      expect(fuzzyMatcher.performanceStats.totalSearches).toBe(1);
      expect(fuzzyMatcher.performanceStats.totalTime).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    test('should reset processing state', async () => {
      fuzzyMatcher.setPrecision(60);
      await fuzzyMatcher.findBestMatch(['hello'], ['hello'], 0);

      fuzzyMatcher.reset();

      expect(fuzzyMatcher.lastValidPosition).toBe(0);
      expect(fuzzyMatcher.processingQueue).toEqual([]);
      expect(fuzzyMatcher.isProcessing).toBe(false);
      // Precision and performance stats are not reset
      expect(fuzzyMatcher.precision).toBe(60);
      expect(fuzzyMatcher.performanceStats.totalSearches).toBe(1);
    });
  });
});

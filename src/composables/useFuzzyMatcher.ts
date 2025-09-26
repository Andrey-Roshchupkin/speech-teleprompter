import { ref, reactive, readonly } from 'vue';

export interface MatchResult {
  index: number;
  score: number;
  length: number;
  rawSimilarity: number;
  distance: number;
}

export interface ProcessedMatchResult {
  newPosition: number;
  matchedIndices: number[];
  match: MatchResult;
}

export interface PerformanceStats {
  totalSearches: number;
  totalTime: number;
  averageTime: number;
  maxSearchTime: number;
}

export interface UseFuzzyMatcherOptions {
  onMatchFound?: (result: ProcessedMatchResult) => void;
  logger?: {
    info: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
}

export const useFuzzyMatcher = (options: UseFuzzyMatcherOptions = {}) => {
  // Reactive state
  const lastValidPosition = ref(0); // Track the last valid position to prevent large jumps
  const isProcessing = ref(false);
  const isManualPositionUpdate = ref(false); // Flag to track manual position updates

  // Context accumulation for better matching
  const accumulatedSpokenWords = ref<string[]>([]); // Accumulate spoken words across multiple results
  const contextWindowSize = ref(30); // Maximum words to keep in context (reduced for performance)
  const lastProcessedPosition = ref(0); // Last position where we successfully processed words

  // Processing queue and performance monitoring
  const processingQueue: Array<{
    spokenWords: string[];
    scriptWords: string[];
    currentPosition: number;
    onMatchFound: (result: ProcessedMatchResult) => void;
  }> = [];

  const performanceStats = reactive<PerformanceStats>({
    totalSearches: 0,
    totalTime: 0,
    averageTime: 0,
    maxSearchTime: 0,
  });

  /**
   * Simple sliding window matching algorithm
   * Based on word-by-word comparison with bonus scoring
   */
  const findBestMatch = async (
    spokenWords: string[],
    scriptWords: string[],
    startIndex: number = 0
  ): Promise<MatchResult> => {
    const startTime = performance.now();

    // Step 1: Determine search window size
    const bufferSize = Math.min(
      10,
      Math.max(5, Math.floor(spokenWords.length * 0.5))
    );
    const windowSize = spokenWords.length + bufferSize;
    const searchEnd = Math.min(startIndex + windowSize, scriptWords.length);

    options.logger?.debug(
      `🔍 Search window: ${windowSize} words (${spokenWords.length} + ${bufferSize} buffer)`
    );
    options.logger?.debug(`📍 Search range: ${startIndex} to ${searchEnd}`);

    let bestMatch: MatchResult = {
      index: -1,
      score: 0,
      length: spokenWords.length,
      rawSimilarity: 0,
      distance: 0,
    };

    // Step 2: Sliding window comparison
    for (
      let i = startIndex;
      i <= Math.max(startIndex, searchEnd - spokenWords.length);
      i++
    ) {
      let score = 0;
      let matches = 0;

      // Compare each word in the spoken fragment
      for (let j = 0; j < spokenWords.length; j++) {
        const spokenWord = spokenWords[j].toLowerCase();
        const scriptWord = scriptWords[i + j]?.toLowerCase();

        if (spokenWord === scriptWord) {
          matches++;

          // Base score: +1 for each match
          score += 1;

          // Bonus scoring based on position
          if (j === spokenWords.length - 1) {
            // Last word bonus: +3
            score += 3;
          } else if (j === spokenWords.length - 2) {
            // Second-to-last word bonus: +2
            score += 2;
          }
        }
      }

      // Calculate similarity as percentage of matches
      const similarity = matches / spokenWords.length;

      // Update best match if this is better
      if (score > bestMatch.score) {
        bestMatch = {
          index: i,
          score: score,
          length: spokenWords.length,
          rawSimilarity: similarity,
          distance: Math.abs(i - startIndex),
        };
      }
    }

    // Update performance stats
    const endTime = performance.now();
    const searchTime = endTime - startTime;
    updatePerformanceStats(searchTime);

    options.logger?.debug(
      `🎯 Best match: index=${bestMatch.index}, score=${bestMatch.score}, similarity=${bestMatch.rawSimilarity.toFixed(3)}`
    );

    return bestMatch;
  };

  /**
   * Update performance statistics
   */
  const updatePerformanceStats = (searchTime: number): void => {
    performanceStats.totalSearches++;
    performanceStats.totalTime += searchTime;
    performanceStats.averageTime =
      performanceStats.totalTime / performanceStats.totalSearches;
    performanceStats.maxSearchTime = Math.max(
      performanceStats.maxSearchTime,
      searchTime
    );

    // Log performance warning if search takes too long
    if (searchTime > 20) {
      options.logger?.error(
        `Slow search detected: ${searchTime.toFixed(2)}ms (avg: ${performanceStats.averageTime.toFixed(2)}ms)`
      );
    }
  };

  /**
   * Process a single match request
   */
  const processSingleMatch = async (
    spokenWords: string[],
    scriptWords: string[],
    currentPosition: number,
    onMatchFound: (result: ProcessedMatchResult) => void
  ): Promise<void> => {
    try {
      options.logger?.debug(
        `🔍 Processing match: "${spokenWords.join(' ')}" (${spokenWords.length} words)`
      );
      options.logger?.debug(
        `📍 Current position: ${currentPosition}, Script length: ${scriptWords.length}`
      );

      // Find best match starting from current position
      const match = await findBestMatch(
        spokenWords,
        scriptWords,
        currentPosition
      );

      options.logger?.debug(
        `🎯 Match result: index=${match.index}, score=${match.score.toFixed(3)}, length=${match.length}, similarity=${match.rawSimilarity.toFixed(3)}`
      );

      // Step 3: Check threshold (30% of maximum possible score)
      const maxPossibleScore = match.length + 3; // All words + last word bonus
      const threshold = maxPossibleScore * 0.3; // 30% threshold

      options.logger?.debug(
        `📊 Threshold check: score=${match.score}, maxPossible=${maxPossibleScore}, threshold=${threshold.toFixed(1)}`
      );

      const isValidMatch = match.index !== -1 && match.score >= threshold;

      options.logger?.debug(
        `✅ Match validation: ${isValidMatch ? 'PASSED' : 'FAILED'} (score=${match.score} >= ${threshold.toFixed(1)})`
      );

      if (isValidMatch) {
        // Update current position to matched location
        const newPosition = match.index + match.length;

        // Prevent backward jumps - teleprompter should only move forward
        // But allow backward jumps if this is a manual position update
        if (
          newPosition < lastValidPosition.value &&
          !isManualPositionUpdate.value
        ) {
          options.logger?.error(
            `Preventing backward jump: ${newPosition} < ${lastValidPosition.value}`
          );
          return;
        }

        // Update last valid position
        lastValidPosition.value = Math.max(
          lastValidPosition.value,
          newPosition
        );

        // Update last processed position for context management
        lastProcessedPosition.value = newPosition;

        // Clear accumulated context after successful match to prevent performance degradation
        // Keep only the last few words for continuity
        if (accumulatedSpokenWords.value.length > 10) {
          accumulatedSpokenWords.value = accumulatedSpokenWords.value.slice(-5);
        }

        // Get matched word indices for highlighting
        const matchedIndices: number[] = [];
        for (let i = match.index; i < match.index + match.length; i++) {
          matchedIndices.push(i);
        }

        // Call the match found callback
        if (onMatchFound) {
          onMatchFound({
            newPosition,
            matchedIndices,
            match,
          });
        }
      }
    } catch (error) {
      console.error('Error processing match:', error);
    }
  };

  /**
   * Process the queue of spoken words
   */
  const processQueue = async (): Promise<void> => {
    if (isProcessing.value || processingQueue.length === 0) {
      return;
    }

    isProcessing.value = true;

    while (processingQueue.length > 0) {
      const { spokenWords, scriptWords, currentPosition, onMatchFound } =
        processingQueue.shift()!;

      await processSingleMatch(
        spokenWords,
        scriptWords,
        currentPosition,
        onMatchFound
      );
    }

    isProcessing.value = false;
  };

  /**
   * Clear accumulated context when position changes significantly
   */
  const clearAccumulatedContext = (): void => {
    accumulatedSpokenWords.value = [];
    lastProcessedPosition.value = lastValidPosition.value;
  };

  /**
   * Process spoken words and find matches in the script (async version)
   * Now with smart context accumulation for better matching
   */
  const processSpokenWords = async (
    spokenWords: string[],
    scriptWords: string[],
    currentPosition: number,
    onMatchFound?: (result: ProcessedMatchResult) => void
  ): Promise<void> => {
    if (scriptWords.length === 0) {
      options.logger?.error('No script words to match against');
      return;
    }

    // Simple approach: process only the current spoken words
    const wordsToProcess = spokenWords;
    options.logger?.debug(
      `🆕 Processing ${wordsToProcess.length} words: "${wordsToProcess.join(' ')}"`
    );

    // Add to processing queue to prevent concurrent processing
    processingQueue.push({
      spokenWords: wordsToProcess,
      scriptWords,
      currentPosition,
      onMatchFound: onMatchFound ?? options.onMatchFound ?? (() => {}),
    });

    if (isProcessing.value) {
      return; // Already processing, will handle this in queue
    }

    await processQueue();
  };

  /**
   * Get performance statistics
   */
  const getPerformanceStats = (): PerformanceStats => {
    return { ...performanceStats };
  };

  /**
   * Update the current position (for manual position changes)
   */
  const updatePosition = (newPosition: number): void => {
    options.logger?.debug(`🔄 Manually updating position to ${newPosition}`);

    // Set flag to allow backward jumps for this update
    isManualPositionUpdate.value = true;

    // For manual updates, always set lastValidPosition to the new position
    // This allows manual backward movement and sets the new baseline
    lastValidPosition.value = newPosition;
    lastProcessedPosition.value = newPosition;

    // Clear accumulated context to prevent stale matches
    accumulatedSpokenWords.value = [];

    // Reset flag after a short delay to allow the next speech recognition to work normally
    setTimeout(() => {
      isManualPositionUpdate.value = false;
    }, 100);

    options.logger?.debug(
      `✅ Position updated: lastValid=${lastValidPosition.value}, lastProcessed=${lastProcessedPosition.value}`
    );
  };

  /**
   * Reset the fuzzy matcher state
   */
  const reset = (): void => {
    lastValidPosition.value = 0;
    lastProcessedPosition.value = 0;
    processingQueue.length = 0;
    isProcessing.value = false;
    accumulatedSpokenWords.value = [];
    isManualPositionUpdate.value = false;
  };

  return {
    // State
    lastValidPosition: readonly(lastValidPosition),
    isProcessing: readonly(isProcessing),
    performanceStats: readonly(performanceStats),
    accumulatedSpokenWords: readonly(accumulatedSpokenWords),
    contextWindowSize: readonly(contextWindowSize),

    // Methods
    processSpokenWords,
    getPerformanceStats,
    updatePosition,
    reset,
    clearAccumulatedContext,
  };
};

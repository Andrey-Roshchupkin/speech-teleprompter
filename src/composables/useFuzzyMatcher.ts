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
  const precision = ref(65); // Default fuzzy match precision (0-100)
  const lastValidPosition = ref(0); // Track the last valid position to prevent large jumps
  const isProcessing = ref(false);

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

  const maxProcessingTime = 3; // Maximum milliseconds per processing chunk (reduced for better responsiveness)

  /**
   * Yield control to the main thread to prevent blocking
   */
  const yieldToMainThread = (): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => resolve(), { timeout: 1 });
      } else {
        setTimeout(() => resolve(), 0);
      }
    });
  };

  /**
   * Calculate similarity between two strings using optimized Levenshtein distance
   * Uses early termination for better performance
   */
  const calculateSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;

    // Early termination for identical strings
    if (str1 === str2) return 1;

    // Early termination for very different lengths
    const maxLen = Math.max(len1, len2);
    if (maxLen === 0) return 1;

    const minLen = Math.min(len1, len2);
    if (maxLen / minLen > 3) return 0; // Very different lengths

    // Use rolling array for memory efficiency
    let prev = Array(len1 + 1)
      .fill(0)
      .map((_, i) => i);
    let curr = Array(len1 + 1).fill(0);

    for (let i = 1; i <= len2; i++) {
      curr[0] = i;
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          curr[j] = prev[j - 1];
        } else {
          curr[j] = Math.min(prev[j - 1] + 1, curr[j - 1] + 1, prev[j] + 1);
        }
      }
      [prev, curr] = [curr, prev];
    }

    return (maxLen - prev[len1]) / maxLen;
  };

  /**
   * Find the best match for spoken words in the script (async version)
   * Only searches forward from the current position to prevent backward movement
   * For long phrases, searches from the end for better performance
   */
  const findBestMatch = async (
    spokenWords: string[],
    scriptWords: string[],
    startIndex: number = 0
  ): Promise<MatchResult> => {
    let bestMatch: MatchResult = {
      index: -1,
      score: 0,
      length: 0,
      rawSimilarity: 0,
      distance: 0,
    };
    const startTime = performance.now();

    // Two-phase search strategy for better performance (optimized for speed)
    const searchPhases = [
      { name: 'fast', maxDistance: 8, maxLength: 5 },
      { name: 'thorough', maxDistance: 15, maxLength: 8 },
    ];

    // For long phrases (>10 words), search from the end for better performance
    const isLongPhrase = spokenWords.length > 10;
    const searchOrder = isLongPhrase ? 'reverse' : 'normal';

    if (isLongPhrase) {
      options.logger?.debug(
        `🔍 Long phrase detected (${spokenWords.length} words), searching from end`
      );
    }

    for (const phase of searchPhases) {
      // Try different segment lengths, prioritizing longer matches
      const segmentLengths = isLongPhrase
        ? Array.from(
            { length: Math.min(spokenWords.length, phase.maxLength) },
            (_, i) => Math.min(spokenWords.length, phase.maxLength) - i
          )
        : Array.from(
            { length: Math.min(spokenWords.length, phase.maxLength) },
            (_, i) => Math.min(spokenWords.length, phase.maxLength) - i
          );

      for (const j of segmentLengths) {
        // Check if we need to yield control
        if (performance.now() - startTime > maxProcessingTime) {
          await yieldToMainThread();
        }

        // For long phrases, search from the end
        const spokenSegment = isLongPhrase
          ? spokenWords.slice(-j).join(' ').toLowerCase()
          : spokenWords.slice(0, j).join(' ').toLowerCase();

        // Adaptive search window based on phrase length
        const baseDistance = phase.maxDistance;
        const adaptiveDistance = isLongPhrase
          ? Math.min(baseDistance * 2, 30) // Longer distance for long phrases
          : baseDistance;

        const maxLookForward = Math.min(
          adaptiveDistance,
          scriptWords.length - startIndex
        );
        const searchStart = startIndex; // No backward search
        const searchEnd = startIndex + maxLookForward;

        for (let i = searchStart; i < searchEnd; i++) {
          // Yield control periodically during inner loop
          if (
            (i - searchStart) % 5 === 0 &&
            performance.now() - startTime > maxProcessingTime
          ) {
            await yieldToMainThread();
          }

          if (i + j > scriptWords.length) continue;

          const scriptSegment = scriptWords
            .slice(i, i + j)
            .join(' ')
            .toLowerCase();

          const similarity = calculateSimilarity(spokenSegment, scriptSegment);

          // Use precision parameter to calculate dynamic thresholds
          const baseThreshold = precision.value / 100;
          const minThreshold = j === 1 ? baseThreshold + 0.15 : baseThreshold;
          if (similarity < minThreshold) continue;

          // Stronger distance penalty to prefer matches closer to current position
          const distancePenalty = Math.abs(i - startIndex) * 0.05;
          const adjustedScore = similarity - distancePenalty;

          // Bonus for longer matches to prevent single-word jumping
          let lengthBonus = j > 1 ? 0.1 : 0;
          if (j >= 6) lengthBonus += 0.05;
          if (j >= 10) lengthBonus += 0.05;

          const finalScore = adjustedScore + lengthBonus;

          if (finalScore > bestMatch.score) {
            // For long phrases searched from the end, adjust the index
            const matchIndex = isLongPhrase ? i + j - spokenWords.length : i;
            bestMatch = {
              index: matchIndex,
              score: finalScore,
              length: j,
              rawSimilarity: similarity,
              distance: Math.abs(matchIndex - startIndex),
            };
          }
        }

        // Only stop if we found a perfect match (100% similarity) with good length
        // This allows us to find longer matches even if shorter ones are very good
        const shouldStop =
          bestMatch.rawSimilarity >= 1.0 && bestMatch.length >= 8;
        if (shouldStop) {
          break;
        }
      }

      // If we found a very good match in the fast phase, skip the thorough phase
      // But only if it's a long enough match to be confident
      if (
        phase.name === 'fast' &&
        bestMatch.score > 0.8 &&
        bestMatch.length >= 8
      ) {
        break;
      }
    }

    // Update performance stats
    const endTime = performance.now();
    const searchTime = endTime - startTime;
    updatePerformanceStats(searchTime);

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
      console.warn(
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

      // Use dynamic thresholds based on match length, distance, and precision
      const baseSimilarity = precision.value / 100;
      const minSimilarity =
        match.length === 1 ? baseSimilarity + 0.2 : baseSimilarity;

      // Allow longer distances for high-quality matches
      // For teleprompter, we want to be more permissive with forward movement
      let maxDistance: number;
      if (match.length === 1) {
        maxDistance = 3; // Single words need to be close
      } else if (match.rawSimilarity >= 0.9) {
        maxDistance = 25; // Very high similarity allows longer jumps
      } else if (match.rawSimilarity >= 0.8) {
        maxDistance = 20; // High similarity allows moderate jumps
      } else {
        maxDistance = 15; // Default for good matches
      }

      options.logger?.debug(
        `📊 Thresholds: minSimilarity=${minSimilarity.toFixed(3)}, maxDistance=${maxDistance}, precision=${precision.value}`
      );

      const isValidMatch =
        match.index !== -1 &&
        match.rawSimilarity >= minSimilarity &&
        match.distance <= maxDistance;

      options.logger?.debug(
        `✅ Match validation: ${isValidMatch ? 'PASSED' : 'FAILED'} (index=${match.index !== -1}, similarity=${match.rawSimilarity >= minSimilarity}, distance=${match.distance <= maxDistance})`
      );

      if (isValidMatch) {
        // Update current position to matched location
        const newPosition = match.index + match.length;

        // Prevent backward jumps - teleprompter should only move forward
        if (newPosition < lastValidPosition.value) {
          console.warn(
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
   * Set the fuzzy match precision (0-100)
   */
  const setPrecision = (newPrecision: number): void => {
    precision.value = Math.max(50, Math.min(95, newPrecision));
  };

  /**
   * Accumulate spoken words for context-aware matching
   */
  const accumulateSpokenWords = (newWords: string[]): void => {
    // Add new words to accumulated context
    accumulatedSpokenWords.value.push(...newWords);

    // Trim context window to prevent memory bloat
    if (accumulatedSpokenWords.value.length > contextWindowSize.value) {
      const excess =
        accumulatedSpokenWords.value.length - contextWindowSize.value;
      accumulatedSpokenWords.value = accumulatedSpokenWords.value.slice(excess);
    }
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
      console.warn('No script words to match against');
      return;
    }

    // Accumulate new words for context-aware matching
    accumulateSpokenWords(spokenWords);

    // Check if we should clear context (large position jump)
    const positionJump = Math.abs(
      currentPosition - lastProcessedPosition.value
    );
    if (positionJump > 20) {
      clearAccumulatedContext();
    }

    // Smart context selection: use recent words + current words for better performance
    let wordsToProcess: string[];
    if (accumulatedSpokenWords.value.length > 0) {
      // Use last 20 words from context + current words for optimal performance
      const recentContext = accumulatedSpokenWords.value.slice(-20);
      wordsToProcess = [...recentContext, ...spokenWords];
      options.logger?.debug(
        `🔄 Using accumulated context: ${accumulatedSpokenWords.value.length} total words, processing ${wordsToProcess.length} words`
      );
    } else {
      wordsToProcess = spokenWords;
      options.logger?.debug(
        `🆕 No accumulated context, processing ${wordsToProcess.length} words`
      );
    }

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
   * Reset the fuzzy matcher state
   */
  const reset = (): void => {
    lastValidPosition.value = 0;
    lastProcessedPosition.value = 0;
    processingQueue.length = 0;
    isProcessing.value = false;
    accumulatedSpokenWords.value = [];
  };

  return {
    // State
    precision,
    lastValidPosition: readonly(lastValidPosition),
    isProcessing: readonly(isProcessing),
    performanceStats: readonly(performanceStats),
    accumulatedSpokenWords: readonly(accumulatedSpokenWords),
    contextWindowSize: readonly(contextWindowSize),

    // Methods
    setPrecision,
    processSpokenWords,
    getPerformanceStats,
    reset,
    clearAccumulatedContext,
  };
};

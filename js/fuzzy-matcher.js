import { logManager } from './log-manager.js';

/**
 * Fuzzy Matching Module
 * Handles intelligent word matching between spoken words and script
 * Optimized for widget injection with async processing and time slicing
 */
class FuzzyMatcher {
  constructor(debugLogger) {
    this.debugLogger = logManager.createLogger('FuzzyMatcher');
    this.lastValidPosition = 0; // Track the last valid position to prevent large jumps
    this.processingQueue = [];
    this.isProcessing = false;
    this.maxProcessingTime = 5; // Maximum milliseconds per processing chunk
    this.precision = 65; // Default fuzzy match precision (0-100)

    // Performance monitoring
    this.performanceStats = {
      totalSearches: 0,
      totalTime: 0,
      averageTime: 0,
      maxSearchTime: 0,
    };
  }

  /**
   * Set the fuzzy match precision (0-100)
   */
  setPrecision(precision) {
    this.precision = Math.max(50, Math.min(95, precision));
    this.debugLogger.info(
      `🎯 Fuzzy match precision set to: ${this.precision}%`
    );
  }

  /**
   * Yield control to the main thread to prevent blocking
   */
  async yieldToMainThread() {
    return new Promise((resolve) => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(resolve, { timeout: 1 });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  /**
   * Calculate similarity between two strings using optimized Levenshtein distance
   * Uses early termination for better performance
   */
  calculateSimilarity(str1, str2) {
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
  }

  /**
   * Find the best match for spoken words in the script (async version)
   * Only searches forward from the current position to prevent backward movement
   */
  async findBestMatch(spokenWords, scriptWords, startIndex = 0) {
    let bestMatch = { index: -1, score: 0, length: 0 };
    const startTime = performance.now();

    this.debugLogger.info(`🔍 Finding match for: ${spokenWords.join(' ')}`);
    this.debugLogger.info(
      `📝 Script words: ${scriptWords
        .slice(startIndex, startIndex + 20)
        .join(' ')}`
    );
    this.debugLogger.info(`📍 Starting from index: ${startIndex}`);

    // Two-phase search strategy for better performance
    const searchPhases = [
      { name: 'fast', maxDistance: 10, maxLength: 6 },
      { name: 'thorough', maxDistance: 25, maxLength: 12 },
    ];

    for (const phase of searchPhases) {
      this.debugLogger.info(
        `🔍 Phase: ${phase.name} (max distance: ${phase.maxDistance})`
      );

      // Try different segment lengths, prioritizing longer matches
      for (let j = Math.min(spokenWords.length, phase.maxLength); j >= 1; j--) {
        // Check if we need to yield control
        if (performance.now() - startTime > this.maxProcessingTime) {
          await this.yieldToMainThread();
        }

        const spokenSegment = spokenWords.slice(0, j).join(' ').toLowerCase();

        // Forward-only search window with performance optimization
        const maxLookForward = Math.min(
          phase.maxDistance,
          scriptWords.length - startIndex
        );
        const searchStart = startIndex; // No backward search
        const searchEnd = startIndex + maxLookForward;

        for (let i = searchStart; i < searchEnd; i++) {
          // Yield control periodically during inner loop
          if (
            (i - searchStart) % 5 === 0 &&
            performance.now() - startTime > this.maxProcessingTime
          ) {
            await this.yieldToMainThread();
          }

          if (i + j > scriptWords.length) continue;

          const scriptSegment = scriptWords
            .slice(i, i + j)
            .join(' ')
            .toLowerCase();

          const similarity = this.calculateSimilarity(
            spokenSegment,
            scriptSegment
          );

          // Use precision parameter to calculate dynamic thresholds
          const baseThreshold = this.precision / 100;
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
            bestMatch = {
              index: i,
              score: finalScore,
              length: j,
              rawSimilarity: similarity,
              distance: Math.abs(i - startIndex),
            };
            this.debugLogger.info(
              `  ✅ New best match: index ${i}, score ${finalScore.toFixed(
                3
              )}, length ${j}`
            );
          }
        }

        // Only stop if we found a perfect match (100% similarity) with good length
        // This allows us to find longer matches even if shorter ones are very good
        const shouldStop =
          bestMatch.rawSimilarity >= 1.0 && bestMatch.length >= 8;
        if (shouldStop) {
          this.debugLogger.info(
            `  🛑 Stopping search - found perfect match: similarity ${bestMatch.rawSimilarity.toFixed(
              3
            )}, length ${bestMatch.length}`
          );
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
        this.debugLogger.info(
          `🚀 Fast phase found excellent long match (${bestMatch.score.toFixed(
            3
          )}, length ${bestMatch.length}), skipping thorough phase`
        );
        break;
      }
    }

    // Update performance stats
    const endTime = performance.now();
    const searchTime = endTime - startTime;
    this.updatePerformanceStats(searchTime);

    this.debugLogger.info(`🎯 Final match: ${JSON.stringify(bestMatch)}`);
    this.debugLogger.info(`⏱️ Search completed in ${searchTime.toFixed(2)}ms`);
    return bestMatch;
  }

  /**
   * Process spoken words and find matches in the script (async version)
   */
  async processSpokenWords(
    spokenWords,
    scriptWords,
    currentPosition,
    onMatchFound
  ) {
    if (scriptWords.length === 0) {
      this.debugLogger.info('❌ No script words to match against');
      return;
    }

    // Add to processing queue to prevent concurrent processing
    this.processingQueue.push({
      spokenWords,
      scriptWords,
      currentPosition,
      onMatchFound,
    });

    if (this.isProcessing) {
      return; // Already processing, will handle this in queue
    }

    await this.processQueue();
  }

  /**
   * Process the queue of spoken words
   */
  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const { spokenWords, scriptWords, currentPosition, onMatchFound } =
        this.processingQueue.shift();

      await this.processSingleMatch(
        spokenWords,
        scriptWords,
        currentPosition,
        onMatchFound
      );
    }

    this.isProcessing = false;
  }

  /**
   * Process a single match request
   */
  async processSingleMatch(
    spokenWords,
    scriptWords,
    currentPosition,
    onMatchFound
  ) {
    this.debugLogger.info(
      '🎤 Processing spoken words: ' + spokenWords.join(' ')
    );
    this.debugLogger.info('📍 Current position: ' + currentPosition);

    try {
      // Find best match starting from current position
      const match = await this.findBestMatch(
        spokenWords,
        scriptWords,
        currentPosition
      );

      this.debugLogger.info('🔍 Match result: ' + JSON.stringify(match));

      // Use dynamic thresholds based on match length, distance, and precision
      const baseSimilarity = this.precision / 100;
      const minSimilarity =
        match.length === 1 ? baseSimilarity + 0.2 : baseSimilarity;

      // Allow longer distances for high-quality matches
      // For teleprompter, we want to be more permissive with forward movement
      let maxDistance;
      if (match.length === 1) {
        maxDistance = 3; // Single words need to be close
      } else if (match.rawSimilarity >= 0.9) {
        maxDistance = 25; // Very high similarity allows longer jumps
      } else if (match.rawSimilarity >= 0.8) {
        maxDistance = 20; // High similarity allows moderate jumps
      } else {
        maxDistance = 15; // Default for good matches
      }

      this.debugLogger.info(
        `📏 Distance check: ${
          match.distance
        } <= ${maxDistance} (similarity: ${match.rawSimilarity.toFixed(3)})`
      );

      if (
        match.index !== -1 &&
        match.rawSimilarity >= minSimilarity &&
        match.distance <= maxDistance
      ) {
        this.debugLogger.info('✅ Match found! Updating position...');

        // Update current position to matched location
        const newPosition = match.index + match.length;

        // Prevent backward jumps - teleprompter should only move forward
        if (newPosition < this.lastValidPosition) {
          this.debugLogger.info(
            `⚠️ Preventing backward jump: ${newPosition} < ${this.lastValidPosition}`
          );
          this.debugLogger.info('❌ Match rejected due to backward movement');
          return;
        }

        // Update last valid position
        this.lastValidPosition = Math.max(this.lastValidPosition, newPosition);

        this.debugLogger.info(
          `📍 Position updated: ${currentPosition} → ${newPosition}`
        );

        // Get matched word indices for highlighting
        const matchedIndices = [];
        for (let i = match.index; i < match.index + match.length; i++) {
          matchedIndices.push(i);
        }

        this.debugLogger.info(
          '🟢 Highlighted words: ' + matchedIndices.slice(-5).join(', ')
        );

        // Call the match found callback
        if (onMatchFound) {
          onMatchFound({
            newPosition,
            matchedIndices,
            match,
          });
        }
      } else {
        this.debugLogger.info('❌ No suitable match found');
        this.debugLogger.info(`   - Match index: ${match.index}`);
        this.debugLogger.info(
          `   - Raw similarity: ${match.rawSimilarity.toFixed(
            3
          )} (required: ${minSimilarity.toFixed(3)})`
        );
        this.debugLogger.info(
          `   - Distance: ${match.distance} (max allowed: ${maxDistance})`
        );
        this.debugLogger.info(`   - Match length: ${match.length}`);
      }
    } catch (error) {
      this.debugLogger.info('❌ Error processing match: ' + error.message);
    }
  }

  /**
   * Update performance statistics
   */
  updatePerformanceStats(searchTime) {
    this.performanceStats.totalSearches++;
    this.performanceStats.totalTime += searchTime;
    this.performanceStats.averageTime =
      this.performanceStats.totalTime / this.performanceStats.totalSearches;
    this.performanceStats.maxSearchTime = Math.max(
      this.performanceStats.maxSearchTime,
      searchTime
    );

    // Log performance warning if search takes too long
    if (searchTime > 20) {
      this.debugLogger.info(
        `⚠️ Slow search detected: ${searchTime.toFixed(
          2
        )}ms (avg: ${this.performanceStats.averageTime.toFixed(2)}ms)`
      );
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return { ...this.performanceStats };
  }

  /**
   * Reset the fuzzy matcher state
   */
  reset() {
    this.lastValidPosition = 0;
    this.processingQueue = [];
    this.isProcessing = false;
    this.debugLogger.info('🔄 Fuzzy matcher reset');
  }
}

export { FuzzyMatcher };

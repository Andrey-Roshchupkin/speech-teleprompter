<template>
  <div class="teleprompter-main-container">
    <h1>🎤 Speech Teleprompter</h1>

    <!-- Browser Support Warning -->
    <div v-if="!isSpeechSupported" class="browser-warning">
      <div class="warning-content">
        <h3>⚠️ Browser Compatibility Notice</h3>
        <p>
          Your browser doesn't support Web Speech API. Speech recognition
          features are disabled.
        </p>
        <p><strong>Supported browsers (MDN):</strong></p>
        <ul>
          <li>✅ Google Chrome (full support)</li>
          <li>✅ Microsoft Edge - Chromium-based (full support)</li>
          <li>⚠️ Safari (partial support)</li>
          <li>❌ Opera, Firefox, IE (not supported)</li>
        </ul>
        <p>
          <strong>Note:</strong> Web Speech API is not a Baseline feature and
          has limited browser availability.
        </p>
        <p>
          The teleprompter will work in manual mode - you can still edit scripts
          and use all other features.
        </p>
      </div>
    </div>

    <!-- Teleprompter Display Panel -->
    <div class="teleprompter-right-panel">
      <!-- Teleprompter Display Section -->
      <div class="teleprompter-section">
        <div class="teleprompter-header">
          <h3>📺 Teleprompter Display</h3>
          <!-- PiP button temporarily removed from DOM but code remains -->
        </div>

        <!-- Teleprompter Controls Component -->
        <div class="teleprompter-controls-component">
          <div class="teleprompter-controls">
            <button
              class="teleprompter-start-button"
              :class="{ listening: isListening, disabled: !isSpeechSupported }"
              :disabled="!isSpeechSupported"
              @click="handleToggleSpeech"
            >
              {{ isListening ? 'Stop' : 'Start' }}
            </button>
            <button
              class="teleprompter-reset-button"
              :class="{ disabled: !isSpeechSupported }"
              :disabled="!isSpeechSupported"
              @click="handleResetSpeech"
            >
              Reset
            </button>
          </div>

          <!-- Inline Settings -->
          <div class="teleprompter-settings-inline">
            <div class="setting-column">
              <label for="linesToShow">Lines to Show</label>
              <input
                type="number"
                id="linesToShow"
                :value="settings.linesToShow"
                @input="handleLinesToShowChange"
                min="3"
                max="10"
              />
            </div>
            <div class="setting-column">
              <label for="scrollTrigger">Scroll After Lines</label>
              <input
                type="number"
                id="scrollTrigger"
                :value="settings.scrollTrigger"
                @input="handleScrollTriggerChange"
                :min="1"
                :max="settings.linesToShow - 1"
              />
            </div>
            <div class="setting-column">
              <label for="textSize">Text Size (px)</label>
              <input
                type="number"
                id="textSize"
                :value="settings.textSize"
                @input="handleTextSizeChange"
                min="12"
                max="48"
              />
            </div>
          </div>
        </div>

        <!-- Teleprompter Display -->
        <div
          class="teleprompter-display"
          :style="{ height: teleprompterDisplayHeight }"
        >
          <div
            ref="teleprompterTextRef"
            class="teleprompter-text"
            :style="{ fontSize: settings.textSize + 'px' }"
          >
            <!-- Text before pointer (read text) -->
            <span v-if="textBeforePointer" class="teleprompter-matched">
              {{ textBeforePointer }}
            </span>

            <!-- Current word (pointer) -->
            <span v-if="currentWord" class="teleprompter-highlight">
              {{ currentWord }}
            </span>

            <!-- Text after pointer (unread text) -->
            <span v-if="textAfterPointer">
              {{ textAfterPointer }}
            </span>
          </div>
        </div>

        <!-- Attachment Display -->
        <AttachmentDisplay
          :current-attachment="
            teleprompterDisplay.attachmentManager.currentAttachment.value
          "
          :text-size="settings.textSize"
        />

        <!-- Progress Bar -->
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
      </div>

      <!-- Language Settings Section -->
      <div class="teleprompter-section">
        <h3>🌍 Language Settings</h3>
        <div class="teleprompter-settings">
          <div class="setting-group">
            <label for="primaryLanguage">Primary Language:</label>
            <select
              id="primaryLanguage"
              class="language-select"
              v-model="selectedLanguage"
            >
              <option
                v-for="lang in supportedLanguages"
                :key="lang.code"
                :value="lang.code"
              >
                {{ lang.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="language-info">
          <p>
            <strong>Language Selection:</strong> Choose your primary language
            for speech recognition.
          </p>
        </div>
      </div>

      <!-- Speech Output Section -->
      <div class="teleprompter-section">
        <h3>🎤 Speech Output</h3>
        <div class="speech-output">
          <div
            v-if="!isListening && !hasSpeechOutput"
            class="speech-placeholder"
          >
            Click "Start" to begin speech recognition...
          </div>
          <div v-else class="speech-content">
            <div v-if="finalTranscript" class="final-transcript">
              <strong>Final:</strong> {{ finalTranscript }}
            </div>
            <div v-if="interimTranscript" class="interim-transcript">
              <strong>Interim:</strong> {{ interimTranscript }}
            </div>
            <div v-if="isListening" class="listening-indicator">
              <span class="listening-dot"></span>
              Listening...
            </div>
          </div>
        </div>
      </div>

      <!-- Script Text Section -->
      <div class="teleprompter-section">
        <h3>📝 Script Text</h3>
        <textarea
          id="scriptText"
          placeholder="Enter your teleprompter script here..."
          :value="scriptText"
          @input="handleScriptChange"
        >
Welcome to our presentation. Today we will be discussing the future of technology and how it impacts our daily lives. Let me start by sharing some interesting statistics about digital transformation in various industries.
        </textarea>
      </div>

      <!-- Debug Section -->
      <div class="teleprompter-section">
        <h3>🐛 Debug Log</h3>

        <!-- Log Level Controls -->
        <div class="setting-row" style="margin-bottom: 15px">
          <div class="setting-column">
            <label>Log Level</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  name="logLevel"
                  value="off"
                  v-model="logLevel"
                />
                <span>Off</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  name="logLevel"
                  value="error"
                  v-model="logLevel"
                />
                <span>Error</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  name="logLevel"
                  value="info"
                  v-model="logLevel"
                />
                <span>Info</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  name="logLevel"
                  value="debug"
                  v-model="logLevel"
                />
                <span>Debug</span>
              </label>
            </div>
          </div>
        </div>

        <p>
          Logs are displayed in the browser's developer console.<br />
          Open DevTools and view logs in the Console tab.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { SUPPORTED_LANGUAGES } from '@/types/global';

// Import components
import AttachmentDisplay from '@/components/specific/AttachmentDisplay.vue';

// Import composables
import { useSpeechRecognition } from '@/composables/useSpeechRecognition';
import { useFuzzyMatcher } from '@/composables/useFuzzyMatcher';
import { useTeleprompterDisplay } from '@/composables/useTeleprompterDisplay';
import { useLocalStorage } from '@/composables/useLocalStorage';
import { useLogManager } from '@/composables/useLogManager';
import { usePictureInPicture } from '@/composables/usePictureInPicture';
import { useBroadcastSync } from '@/composables/useBroadcastSync';
import { useTeleprompterStore } from '@/stores/teleprompter';

// Initialize composables
const logManager = useLogManager();
const store = useTeleprompterStore();
const { syncState, syncButtonClick } = useBroadcastSync();
const { syncPiPContent, syncButtonStates } = usePictureInPicture();

const localStorage = useLocalStorage({
  onSave: (settings) => {
    logManager.info('Settings saved to localStorage');
    // Sync settings to store
    store.updateSettings(settings);
    syncState();
  },
});

const teleprompterDisplay = useTeleprompterDisplay({
  onPositionChange: (position) => {
    logManager.info(`Position changed: ${position}`);
    // Update store and sync
    store.updatePosition(position);
    syncState();
    // Sync PiP content
    nextTick(() => {
      scrollToCurrentPosition();
      syncPiPContent();
    });
  },
  onProgressChange: (progress) => {
    logManager.info(`Progress: ${progress}%`);
  },
});

const fuzzyMatcher = useFuzzyMatcher({
  onMatchFound: (result) => {
    logManager.info(`Match found at position ${result.newPosition}`);
    teleprompterDisplay.updatePosition(
      result.newPosition,
      result.matchedIndices
    );
  },
  logger: {
    info: logManager.info,
    debug: logManager.debug,
    error: logManager.error,
  },
});

const speechRecognition = useSpeechRecognition({
  onResult: (result) => {
    logManager.info(`Speech result: ${result.newFinalWords.join(' ')}`);
    handleSpeechResult(result);
  },
  onStatusChange: (status) => {
    logManager.info(`Speech status: ${status.status}`);
    handleStatusChange(status);
    // Update store and sync
    store.updateSpeechState(status.status === 'listening', status.status);
    syncState();
    syncButtonStates();
  },
});

// State
const isListening = ref(false);
const selectedLanguage = ref('en-US');
const finalTranscript = ref('');
const interimTranscript = ref('');
const logLevel = ref('debug'); // Set to debug for detailed logging

// Template refs
const teleprompterTextRef = ref<HTMLElement | null>(null);

// Scroll state
const firstLineMiddleY = ref<number | null>(null);
const lineHeight = ref<number | null>(null);
const topLinePosition = ref(0);
const lastScrollPosition = ref(0);

// Update first line coordinates (call when text size changes)
const updateFirstLineCoordinates = (): void => {
  if (!teleprompterTextRef.value) return;

  // Get the first word element
  const firstWordElement = teleprompterTextRef.value.querySelector('span');
  if (!firstWordElement) return;

  // Get absolute coordinates of first word
  const firstWordRect = firstWordElement.getBoundingClientRect();
  const containerRect = teleprompterTextRef.value.getBoundingClientRect();

  // Calculate middle Y of first line (relative to container)
  firstLineMiddleY.value =
    firstWordRect.top - containerRect.top + firstWordRect.height / 2;

  // Calculate line height
  lineHeight.value = firstWordRect.height;

  console.log(
    `📏 First line coordinates updated: middleY=${firstLineMiddleY.value.toFixed(2)}, lineHeight=${lineHeight.value.toFixed(2)}`
  );
};

// Auto-scroll when reaching trigger point
const autoScroll = (): void => {
  if (!teleprompterTextRef.value) return;

  // Check if we have first line coordinates
  if (firstLineMiddleY.value === null || lineHeight.value === null) {
    console.log(
      '🔄 Auto-scroll: First line coordinates not available, updating...'
    );
    updateFirstLineCoordinates();
    if (firstLineMiddleY.value === null || lineHeight.value === null) {
      console.log('🔄 Auto-scroll: Failed to get first line coordinates');
      return;
    }
  }

  // Find the currently highlighted word element
  const currentWordElement = teleprompterTextRef.value.querySelector(
    '.teleprompter-highlight'
  );
  if (!currentWordElement) {
    console.log('🔄 Auto-scroll: No highlighted word element found');
    return;
  }

  console.log(
    `🔄 Auto-scroll: Found highlighted element: "${currentWordElement.textContent}"`
  );

  // Get absolute coordinates of current word
  const wordRect = currentWordElement.getBoundingClientRect();
  const containerRect = teleprompterTextRef.value.getBoundingClientRect();

  // Calculate middle Y of current word (relative to container)
  const currentWordMiddleY =
    wordRect.top - containerRect.top + wordRect.height / 2;

  // Calculate line number: difference in Y coordinates divided by line height + 1
  const lineDifference = currentWordMiddleY - firstLineMiddleY.value;
  const correction = 1;
  const currentLine =
    Math.floor(lineDifference / (lineHeight.value - correction)) + 1;

  console.log(
    `🔄 Auto-scroll: Coordinates - firstLineMiddleY=${firstLineMiddleY.value.toFixed(2)}, currentWordMiddleY=${currentWordMiddleY.toFixed(2)}, lineDifference=${lineDifference.toFixed(2)}, lineHeight=${lineHeight.value.toFixed(2)}, currentLine=${currentLine}`
  );

  // Check if we need to scroll
  // If current line is greater than scrollTrigger, we need to scroll
  if (currentLine > settings.value.scrollTrigger) {
    // Calculate scroll distance: difference between first line and current cursor position
    const scrollDistance = currentWordMiddleY - firstLineMiddleY.value;

    console.log(
      `📜 Auto-scroll triggered! currentLine=${currentLine}, scrollTrigger=${settings.value.scrollTrigger}, scrollDistance=${scrollDistance.toFixed(2)}`
    );

    // Update local state
    topLinePosition.value += 1;

    // Perform smooth scroll animation using the original algorithm
    const startScrollTop = teleprompterTextRef.value.scrollTop;
    const targetScrollTop = startScrollTop + scrollDistance;
    const duration = 300; // Animation duration in milliseconds
    const startTime = performance.now();

    console.log(
      `🎬 Starting smooth scroll: ${startScrollTop.toFixed(2)} → ${targetScrollTop.toFixed(2)} (distance: ${scrollDistance.toFixed(2)}px)`
    );

    const animateScroll = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentScrollTop = startScrollTop + scrollDistance * easeOut;
      teleprompterTextRef.value!.scrollTop = currentScrollTop;
      lastScrollPosition.value = currentScrollTop;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        console.log(
          `🎬 Smooth scroll completed: final scrollTop=${teleprompterTextRef.value!.scrollTop.toFixed(2)}`
        );
      }
    };

    requestAnimationFrame(animateScroll);
  } else {
    console.log(
      `🔄 Auto-scroll: No scroll needed (currentLine=${currentLine} <= scrollTrigger=${settings.value.scrollTrigger})`
    );
  }
};

// Scroll to current position
const scrollToCurrentPosition = (): void => {
  if (!teleprompterTextRef.value) return;

  // Use auto-scroll logic instead of simple positioning
  autoScroll();
};

// Computed
const supportedLanguages = computed(() => SUPPORTED_LANGUAGES);
const hasSpeechOutput = computed(
  () => finalTranscript.value.length > 0 || interimTranscript.value.length > 0
);
const progressPercentage = computed(() => teleprompterDisplay.progress.value);
const scriptText = computed(() => teleprompterDisplay.scriptText.value);
const currentPosition = computed(
  () => teleprompterDisplay.currentPosition.value
);
const settings = computed(() => ({
  ...teleprompterDisplay.settings.value,
}));
const isSpeechSupported = computed(() => speechRecognition.isSupported.value);

// Computed properties for text segmentation
const textBeforePointer = computed(() => {
  const words = teleprompterDisplay.displayedWords.value;
  const currentPos = currentPosition.value;
  if (currentPos <= 0) return '';
  return words.slice(0, currentPos).join(' ') + ' ';
});

const currentWord = computed(() => {
  const words = teleprompterDisplay.displayedWords.value;
  const currentPos = currentPosition.value;
  if (currentPos >= words.length) return '';
  return words[currentPos] || '';
});

const textAfterPointer = computed(() => {
  const words = teleprompterDisplay.displayedWords.value;
  const currentPos = currentPosition.value;
  if (currentPos >= words.length - 1) return '';
  return ' ' + words.slice(currentPos + 1).join(' ');
});

// Computed height for teleprompter display based on lines to show and text size
const teleprompterDisplayHeight = computed(() => {
  const linesToShow = settings.value.linesToShow;
  const textSize = settings.value.textSize;
  const lineHeight = 1.6; // line-height from CSS
  const padding = 30; // 15px top + 15px bottom
  const height = linesToShow * textSize * lineHeight + padding;
  return `${height}px`;
});

// Load saved settings on mount
onMounted(() => {
  const savedSettings = localStorage.getSavedSettings();
  teleprompterDisplay.updateScript(savedSettings.scriptText);
  teleprompterDisplay.updateSettings({
    linesToShow: savedSettings.linesToShow,
    scrollTrigger: savedSettings.scrollTrigger,
    textSize: savedSettings.textSize,
  });
  selectedLanguage.value = savedSettings.primaryLanguage;
  speechRecognition.setLanguages(savedSettings.primaryLanguage);

  // Load log level
  const savedLogLevel = window.localStorage.getItem('teleprompter_logLevel');
  if (
    savedLogLevel &&
    ['off', 'error', 'info', 'debug'].includes(savedLogLevel)
  ) {
    logLevel.value = savedLogLevel;
    logManager.setLogLevel(savedLogLevel as any);
  }

  // Initialize first line coordinates after DOM is ready
  nextTick(() => {
    updateFirstLineCoordinates();
  });

  // Listen for PiP button events
  const handlePiPToggleEvent = () => {
    handleToggleSpeech();
  };

  const handlePiPResetEvent = () => {
    handleResetSpeech();
  };

  window.addEventListener('teleprompter-toggle-speech', handlePiPToggleEvent);
  window.addEventListener('teleprompter-reset', handlePiPResetEvent);

  // Cleanup on unmount
  return () => {
    window.removeEventListener(
      'teleprompter-toggle-speech',
      handlePiPToggleEvent
    );
    window.removeEventListener('teleprompter-reset', handlePiPResetEvent);
  };
});

// Watch for settings changes and auto-save
watch(
  () => ({
    scriptText: teleprompterDisplay.scriptText.value,
    linesToShow: teleprompterDisplay.settings.value.linesToShow,
    scrollTrigger: teleprompterDisplay.settings.value.scrollTrigger,
    textSize: teleprompterDisplay.settings.value.textSize,
    primaryLanguage: selectedLanguage.value,
  }),
  (newSettings) => {
    localStorage.saveSettings(newSettings);
  },
  { deep: true }
);

// Watch for log level changes
watch(logLevel, (newLevel) => {
  logManager.setLogLevel(newLevel as any);
  window.localStorage.setItem('teleprompter_logLevel', newLevel);
});

// Methods
const handleToggleSpeech = (): void => {
  if (isListening.value) {
    speechRecognition.stop();
  } else {
    speechRecognition.start();
  }
  // Sync button state
  syncButtonClick('toggleButton', isListening.value ? 'stop' : 'start');
};

const handleResetSpeech = (): void => {
  speechRecognition.reset();
  teleprompterDisplay.reset();
  fuzzyMatcher.reset();
  finalTranscript.value = '';
  interimTranscript.value = '';

  // Reset store
  store.reset();

  // Reset scroll state
  topLinePosition.value = 0;
  lastScrollPosition.value = 0;

  // Scroll to top
  if (teleprompterTextRef.value) {
    teleprompterTextRef.value.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // Sync state
  syncState();
  syncButtonClick('resetButton', 'reset');

  logManager.info('Speech recognition and teleprompter reset');
};

// PiP functionality temporarily disabled but code preserved
// const handlePiPToggle = async (): Promise<void> => {
//   try {
//     await togglePiP()
//     logManager.info(`PiP toggled: ${isInPiP.value ? 'opened' : 'closed'}`)
//   } catch (error) {
//     logManager.error(`Failed to toggle PiP: ${error}`)
//   }
// }

// Scroll functionality temporarily disabled but code preserved
// const handleScrollUp = (): void => {
//   teleprompterDisplay.scrollUp()
// }

// const handleScrollDown = (): void => {
//   teleprompterDisplay.scrollDown()
// }

// Settings update functionality temporarily disabled but code preserved
// const handleSettingsUpdate = (newSettings: any): void => {
//   teleprompterDisplay.updateSettings({
//     linesToShow: newSettings.linesToShow,
//     scrollTrigger: newSettings.scrollTrigger,
//     textSize: newSettings.textSize,
//   })
//   fuzzyMatcher.setPrecision(newSettings.fuzzyPrecision)
// }

// Language change functionality temporarily disabled but code preserved
// const handleLanguageChange = (newLanguage: string): void => {
//   selectedLanguage.value = newLanguage
//   speechRecognition.setLanguages(newLanguage)
// }

const handleScriptChange = (event: Event): void => {
  const target = event.target as HTMLTextAreaElement;
  teleprompterDisplay.updateScript(target.value);
  // Update store and sync
  store.updateScript(target.value);
  syncState();
};

// Log level change functionality temporarily disabled but code preserved
// const handleLogLevelChange = (newLevel: string): void => {
//   logLevel.value = newLevel
// }

// Settings change handlers
const handleLinesToShowChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const value = parseInt(target.value, 10);

  // If linesToShow changes, we might need to adjust scrollTrigger
  const currentScrollTrigger = settings.value.scrollTrigger;
  let newScrollTrigger = currentScrollTrigger;

  // If current scrollTrigger is >= new linesToShow, adjust it
  if (currentScrollTrigger >= value) {
    newScrollTrigger = Math.max(1, value - 1);
  }

  // Update both settings
  teleprompterDisplay.updateSettings({
    linesToShow: value,
    scrollTrigger: newScrollTrigger,
  });
};

const handleScrollTriggerChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  let value = parseInt(target.value, 10);

  // Validate scrollTrigger: must be between 1 and (linesToShow - 1)
  const linesToShow = settings.value.linesToShow;
  if (value < 1) {
    value = 1;
  } else if (value >= linesToShow) {
    value = linesToShow - 1;
  }

  // Update the input value if it was corrected
  if (value !== parseInt(target.value, 10)) {
    target.value = value.toString();
  }

  teleprompterDisplay.updateSettings({ scrollTrigger: value });
};

const handleTextSizeChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const value = parseInt(target.value, 10);
  teleprompterDisplay.updateSettings({ textSize: value });

  // Update first line coordinates when text size changes
  nextTick(() => {
    updateFirstLineCoordinates();
  });
};

// Speech recognition handlers
const handleSpeechResult = async (result: any): Promise<void> => {
  // Update speech output display
  finalTranscript.value = speechRecognition.finalTranscript.value;
  interimTranscript.value = result.speechOutputHTML.includes(
    '<span class="teleprompter-interim">'
  )
    ? result.speechOutputHTML
        .split('<span class="teleprompter-interim">')[1]
        .split('</span>')[0]
    : '';

  // Process words for matching if we have new final words
  if (result.newFinalWords.length > 0) {
    const scriptWords = teleprompterDisplay.getOriginalScriptWords();
    const currentPosition = teleprompterDisplay.getCurrentPosition();

    await fuzzyMatcher.processSpokenWords(
      result.newFinalWords,
      scriptWords,
      currentPosition
    );
  }
};

const handleStatusChange = (status: any): void => {
  isListening.value = status.status === 'listening';

  // Process any remaining speech output when recognition stops
  if (status.status === 'stopped' && finalTranscript.value.length > 0) {
    const finalWords = finalTranscript.value
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    if (finalWords.length > 0) {
      logManager.info(
        `Processing final speech output: ${finalWords.join(' ')}`
      );
      const scriptWords = teleprompterDisplay.getOriginalScriptWords();
      const currentPosition = teleprompterDisplay.getCurrentPosition();

      logManager.debug(
        `📝 Script words: ${scriptWords.slice(0, 10).join(' ')}... (${scriptWords.length} total)`
      );
      logManager.debug(`📍 Current position: ${currentPosition}`);

      fuzzyMatcher.processSpokenWords(finalWords, scriptWords, currentPosition);
    }
  }
};
</script>

<style scoped>
.teleprompter-main-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: var(--font-family-base);
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: calc(100vh - 40px);
}

.teleprompter-main-container h1 {
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 30px;
  font-size: 2.5em;
  font-weight: 700;
  text-shadow: none;
  -webkit-text-fill-color: unset;
  background: none;
  -webkit-background-clip: unset;
  background-clip: unset;
}

.browser-warning {
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  border: 2px solid #ff4757;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
}

.warning-content h3 {
  color: #fff;
  margin: 0 0 15px 0;
  font-size: 1.3em;
  font-weight: 600;
}

.warning-content p {
  color: #fff;
  margin: 8px 0;
  line-height: 1.5;
  font-size: 14px;
}

.warning-content p strong {
  color: #fff;
  font-weight: 600;
}

.warning-content ul {
  margin: 10px 0;
  padding-left: 20px;
}

.warning-content li {
  color: #fff;
  margin: 5px 0;
  line-height: 1.4;
}

.teleprompter-right-panel {
  background: var(--bg-primary);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 10px 30px var(--shadow-medium);
  display: flex;
  flex-direction: column;
  overflow-y: visible;
}

.teleprompter-section {
  margin-bottom: 25px;
}

.teleprompter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.teleprompter-header h3 {
  color: var(--text-secondary);
  margin-bottom: 15px;
  font-size: 1.2em;
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 5px;
  margin: 0;
}

.pip-button {
  background: var(--bg-gradient);
  color: var(--text-light);
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px var(--primary-medium);
}

.pip-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--primary-medium);
  background: linear-gradient(
    135deg,
    var(--primary-gradient-end) 0%,
    var(--primary-gradient-start) 100%
  );
}

.teleprompter-controls-component {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 2px solid var(--border-color);
  flex-wrap: wrap;
}

.teleprompter-controls {
  display: flex;
  gap: 10px;
  margin: 0;
  flex-wrap: wrap;
}

.teleprompter-start-button,
.teleprompter-reset-button {
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  color: var(--text-light);
  transition: all 0.3s ease;
  font-weight: 600;
  min-width: 100px;
}

.teleprompter-start-button {
  background: linear-gradient(
    45deg,
    var(--success-color),
    var(--success-light)
  );
}

.teleprompter-start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px var(--success-border);
}

.teleprompter-start-button.listening {
  background: linear-gradient(45deg, var(--danger-color), var(--danger-light));
}

.teleprompter-start-button.listening:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px var(--danger-border);
}

.teleprompter-reset-button {
  background: linear-gradient(
    45deg,
    var(--neutral-color),
    var(--neutral-light)
  );
}

.teleprompter-reset-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px var(--neutral-border);
}

.teleprompter-settings-inline {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.teleprompter-settings-inline .setting-column {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.teleprompter-settings-inline .setting-column label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  white-space: nowrap;
}

.teleprompter-settings-inline .setting-column input {
  width: 60px;
  padding: 6px 8px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.teleprompter-display {
  display: block;
  background: #000;
  color: #fff;
  padding: 15px;
  border-radius: 10px;
  font-family: 'Courier New', monospace;
  position: relative;
  margin-bottom: 20px;
  min-height: 0;
  overflow: hidden;
  transition: height 0.3s ease;
}

.teleprompter-text {
  transition: transform 0.5s ease;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 100%;
  color: #fff;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

.teleprompter-text::-webkit-scrollbar {
  display: none; /* WebKit browsers (Chrome, Safari, Edge) */
}

/* Teleprompter text highlighting styles */
.teleprompter-highlight {
  background: rgba(255, 255, 0, 0.3);
  padding: 0px 0px;
  border-radius: 0px;
  animation: teleprompter-pulse 1s infinite;
  display: inline;
}

.teleprompter-matched {
  color: #4caf50;
}

.teleprompter-faded {
  opacity: 0.3;
}

@keyframes teleprompter-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.teleprompter-attachment {
  margin: 15px 0;
  padding: 15px;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 2px solid var(--success-color);
  border-radius: 10px;
  font-family: 'Courier New', monospace;
  line-height: 1.4;
  min-height: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px var(--shadow-light);
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 15px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    45deg,
    var(--primary-gradient-start),
    var(--primary-gradient-end)
  );
  width: 0%;
  transition: width 0.3s ease;
}

.teleprompter-settings {
  margin-bottom: 15px;
}

.setting-group {
  display: flex;
  flex-direction: column;
}

.setting-group label {
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 5px;
}

.language-select {
  padding: 10px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  background-color: var(--bg-primary);
  cursor: pointer;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.language-info {
  margin-top: 15px;
  padding: 12px;
  background: var(--primary-light);
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.language-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.4;
}

.speech-output {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 10px;
  padding: 15px;
  height: 72px;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-secondary);
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  scrollbar-width: thin;
  scrollbar-color: var(--neutral-color) var(--bg-secondary);
}

.speech-placeholder {
  color: var(--text-color-secondary);
  font-style: italic;
  text-align: center;
  padding: var(--spacing-lg);
}

.speech-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.final-transcript {
  color: var(--text-color-primary);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-md);
}

.interim-transcript {
  color: var(--text-color-secondary);
  font-style: italic;
  line-height: var(--line-height-md);
}

.listening-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
  margin-top: var(--spacing-sm);
}

.listening-dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-success);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

textarea {
  width: 100%;
  min-height: 200px;
  padding: 15px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 16px;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.radio-option:hover {
  color: var(--text-primary);
}

.radio-option input[type='radio'] {
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color);
  cursor: pointer;
}

.radio-option span {
  user-select: none;
  font-weight: 500;
}

.radio-option input[type='radio']:checked + span {
  color: var(--primary-color);
  font-weight: 600;
}

/* Responsive design - removed for now as mobile version is not implemented */
</style>

import { SpeechRecognitionModule } from './speech-recognition.js';
import { FuzzyMatcher } from './fuzzy-matcher.js';
import { TeleprompterDisplay } from './teleprompter-display.js';
import { LocalStorageManager } from './local-storage.js';
import { stateManager } from './managers/StateManager.js';
import { logManager } from './log-manager.js';

/**
 * Main Application Orchestrator
 * Coordinates all modules and handles the overall application flow
 * Optimized for widget injection with namespaced event handling
 */
class SpeechTeleprompterApp {
  constructor(container = null) {
    this.container = container || document.body;
    this.namespace = 'teleprompter';
    this.debugLogger = logManager.createLogger('App');
    this.speechRecognition = null;
    this.fuzzyMatcher = null;
    this.teleprompterDisplay = null;
    this.localStorage = null;
    this.eventHandlers = new Map();
    this.resizeTimeout = null;

    this.initializeModules();
    this.setupEventListeners();
    this.initializeApp();
  }

  /**
   * Create optimized debug logger that reduces overhead
   */

  /**
   * Initialize all modules
   */
  initializeModules() {
    this.debugLogger.info('🚀 Initializing Speech Teleprompter App...');

    // Initialize modules
    this.debugLogger.info('🔧 Creating SpeechRecognitionModule...');
    this.speechRecognition = new SpeechRecognitionModule(this.debugLogger);
    this.debugLogger.info(`✅ SpeechRecognitionModule created: ${!!this.speechRecognition}`);

    this.debugLogger.info('🔧 Creating FuzzyMatcher...');
    this.fuzzyMatcher = new FuzzyMatcher(this.debugLogger);
    this.debugLogger.info(`✅ FuzzyMatcher created: ${!!this.fuzzyMatcher}`);

    this.debugLogger.info('🔧 Creating TeleprompterDisplay...');
    this.teleprompterDisplay = new TeleprompterDisplay(this.debugLogger);
    this.debugLogger.info(`✅ TeleprompterDisplay created: ${!!this.teleprompterDisplay}`);

    this.debugLogger.info('🔧 Creating LocalStorageManager...');
    this.localStorage = new LocalStorageManager(this.debugLogger);
    this.debugLogger.info(`✅ LocalStorageManager created: ${!!this.localStorage}`);

    // Set up module callbacks
    this.setupModuleCallbacks();

    this.debugLogger.info('✅ All modules initialized');
  }

  /**
   * Set up callbacks between modules
   */
  setupModuleCallbacks() {
    // Speech recognition callbacks
    this.speechRecognition.setCallbacks(
      (newFinalWords, speechOutputHTML) => this.handleSpeechResult(newFinalWords, speechOutputHTML),
      (status, languageInfo) => this.handleStatusChange(status, languageInfo)
    );
  }

  /**
   * Add namespaced event listener
   */
  addNamespacedEventListener(element, event, handler, options = {}) {
    const namespacedEvent = `${event}.${this.namespace}`;
    const wrappedHandler = (e) => {
      this.debugLogger.info(`🎯 Event triggered: ${event} on ${e.target.id || e.target.tagName}`);
      handler(e);
    };

    element.addEventListener(event, wrappedHandler, options);

    // Store handler for cleanup
    if (!this.eventHandlers.has(element)) {
      this.eventHandlers.set(element, []);
    }
    this.eventHandlers.get(element).push({ event, handler: wrappedHandler, options });
  }

  /**
   * Set up event listeners for main form elements with namespacing
   */
  setupEventListeners() {
    // Main form elements (if they exist)
    const scriptText = this.container.querySelector('#scriptText');
    const linesToShow = this.container.querySelector('#linesToShow');
    const scrollTrigger = this.container.querySelector('#scrollTrigger');
    const textSize = this.container.querySelector('#textSize');
    const fuzzyPrecision = this.container.querySelector('#fuzzyPrecision');
    const primaryLanguage = this.container.querySelector('#primaryLanguage');
    const toggleButton = this.container.querySelector('#toggleButton');
    const resetButton = this.container.querySelector('#resetButton');

    // Debug: Log which elements were found
    this.debugLogger.info(
      `🔍 Found elements: scriptText=${!!scriptText}, linesToShow=${!!linesToShow}, scrollTrigger=${!!scrollTrigger}, textSize=${!!textSize}, fuzzyPrecision=${!!fuzzyPrecision}, primaryLanguage=${!!primaryLanguage}, toggleButton=${!!toggleButton}, resetButton=${!!resetButton}`
    );

    // Simple event listeners removed to prevent duplicate calls with namespaced listeners
    if (scriptText) {
      this.addNamespacedEventListener(scriptText, 'input', () => {
        this.debugLogger.info('📝 Script text changed');
        this.handleScriptChange();
      });
    }
    if (linesToShow) {
      this.addNamespacedEventListener(linesToShow, 'change', () => {
        this.debugLogger.info('📏 Lines to show changed');
        this.updateScrollTriggerMax();
        this.handleSettingsChange();
      });
    }
    if (scrollTrigger) {
      this.addNamespacedEventListener(scrollTrigger, 'change', () => {
        this.debugLogger.info('📜 Scroll trigger changed');
        this.handleSettingsChange();
      });
    }
    if (textSize) {
      this.addNamespacedEventListener(textSize, 'change', () => {
        this.debugLogger.info('🔤 Text size changed');
        this.handleSettingsChange();
      });
    }
    if (primaryLanguage) {
      this.addNamespacedEventListener(primaryLanguage, 'change', () => {
        this.debugLogger.info('🌍 Primary language changed');
        this.handleLanguageChange();
      });
    }
    if (toggleButton) {
      this.addNamespacedEventListener(toggleButton, 'click', () => {
        this.debugLogger.info('🔄 Toggle button clicked');
        this.toggleRecognition();
      });
    }
    if (resetButton) {
      this.addNamespacedEventListener(resetButton, 'click', () => {
        this.debugLogger.info('🔄 Reset button clicked');
        this.reset();
      });
    }

    // Log level radio buttons
    const logLevelRadios = this.container.querySelectorAll('input[name="logLevel"]');
    logLevelRadios.forEach((radio) => {
      this.addNamespacedEventListener(radio, 'change', () => {
        if (radio.checked) {
          const logLevel = radio.value;
          this.debugLogger.info(`🐛 Log level changed to: ${logLevel.toUpperCase()}`);
          logManager.setLogLevel(logLevel);
          this.saveLogLevel(logLevel);
        }
      });
    });

    // Window resize handler with namespacing
    this.addNamespacedEventListener(window, 'resize', () => {
      // Debounce resize events
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.teleprompterDisplay.updateHeight();
      }, 250);
    });
  }

  /**
   * Initialize the application
   */
  initializeApp() {
    this.debugLogger.info('🎯 Initializing application...');

    // Initialize teleprompter display elements first
    this.teleprompterDisplay.initializeElements();

    // Load saved settings first
    this.loadSavedSettings();

    // Load log level settings
    this.loadLogLevel();

    // Load initial script
    this.handleScriptChange();

    // Load initial settings
    this.handleSettingsChange();

    // Update scroll trigger max values
    this.updateScrollTriggerMax();

    // Load initial language settings
    this.handleLanguageChange();

    // Ensure language settings are enabled on startup
    this.updateLanguageSettingsState(false);

    this.debugLogger.info('✅ Application initialized successfully');
  }

  /**
   * Load saved settings from local storage
   */
  loadSavedSettings() {
    const savedSettings = this.localStorage.getSavedSettings();

    // Set form values directly
    this.setFormValues(savedSettings);

    this.debugLogger.info('📦 Loaded saved settings from local storage');
  }

  /**
   * Set form values
   */
  setFormValues(settings) {
    const scriptText = this.container.querySelector('#scriptText');
    const linesToShow = this.container.querySelector('#linesToShow');
    const scrollTrigger = this.container.querySelector('#scrollTrigger');
    const textSize = this.container.querySelector('#textSize');
    const fuzzyPrecision = this.container.querySelector('#fuzzyPrecision');
    const primaryLanguage = this.container.querySelector('#primaryLanguage');

    if (scriptText) scriptText.value = settings.scriptText;
    if (linesToShow) linesToShow.value = settings.linesToShow;
    if (scrollTrigger) scrollTrigger.value = settings.scrollTrigger;
    if (textSize) textSize.value = settings.textSize;
    if (fuzzyPrecision) fuzzyPrecision.value = settings.fuzzyPrecision || 65;
    if (primaryLanguage) primaryLanguage.value = settings.primaryLanguage;
  }

  /**
   * Get form values
   */
  getFormValues() {
    const scriptText = this.container.querySelector('#scriptText');
    const linesToShow = this.container.querySelector('#linesToShow');
    const scrollTrigger = this.container.querySelector('#scrollTrigger');
    const textSize = this.container.querySelector('#textSize');
    const fuzzyPrecision = this.container.querySelector('#fuzzyPrecision');
    const primaryLanguage = this.container.querySelector('#primaryLanguage');

    return {
      scriptText: scriptText ? scriptText.value : '',
      linesToShow: linesToShow ? parseInt(linesToShow.value) : 5,
      scrollTrigger: scrollTrigger ? parseInt(scrollTrigger.value) : 3,
      textSize: textSize ? parseInt(textSize.value) : 24,
      fuzzyPrecision: fuzzyPrecision ? parseInt(fuzzyPrecision.value) : 65,
      primaryLanguage: primaryLanguage ? primaryLanguage.value : 'en-US',
    };
  }

  /**
   * Auto-save current settings
   */
  autoSaveSettings() {
    const formValues = this.getFormValues();
    this.localStorage.saveSettings(formValues);
  }

  /**
   * Save log level to localStorage
   */
  saveLogLevel(logLevel) {
    try {
      localStorage.setItem('teleprompter_logLevel', logLevel);
      this.debugLogger.info(`💾 Log level saved: ${logLevel}`);
    } catch (error) {
      console.error('Failed to save log level:', error);
    }
  }

  /**
   * Load log level from localStorage
   */
  loadLogLevel() {
    try {
      const savedLogLevel = localStorage.getItem('teleprompter_logLevel');
      if (savedLogLevel && ['off', 'error', 'info', 'debug'].includes(savedLogLevel)) {
        logManager.setLogLevel(savedLogLevel);

        // Update radio button selection
        const radioButton = this.container.querySelector(
          `input[name="logLevel"][value="${savedLogLevel}"]`
        );
        if (radioButton) {
          radioButton.checked = true;
        }

        this.debugLogger.info(`📦 Log level loaded: ${savedLogLevel}`);
        return savedLogLevel;
      }
    } catch (error) {
      console.error('Failed to load log level:', error);
    }
    return 'info'; // Default fallback
  }

  /**
   * Save log level to localStorage
   */
  saveLogLevel(logLevel) {
    try {
      localStorage.setItem('teleprompter_logLevel', logLevel);
      this.debugLogger.info(`💾 Log level saved: ${logLevel}`);
    } catch (error) {
      console.error('Failed to save log level:', error);
    }
  }

  /**
   * Load log level from localStorage
   */
  loadLogLevel() {
    try {
      const savedLogLevel = localStorage.getItem('teleprompter_logLevel');
      if (savedLogLevel && ['off', 'error', 'info', 'debug'].includes(savedLogLevel)) {
        logManager.setLogLevel(savedLogLevel);

        // Update radio button selection
        const radioButton = this.container.querySelector(
          `input[name="logLevel"][value="${savedLogLevel}"]`
        );
        if (radioButton) {
          radioButton.checked = true;
        }

        this.debugLogger.info(`📦 Log level loaded: ${savedLogLevel}`);
        return savedLogLevel;
      }
    } catch (error) {
      console.error('Failed to load log level:', error);
    }
    return 'info'; // Default fallback
  }

  /**
   * Handle script text changes
   */
  handleScriptChange() {
    const scriptText = this.container.querySelector('#scriptText')?.value || '';

    this.debugLogger.info(`📝 Script text updated: ${scriptText.length} characters`);
    this.debugLogger.info(
      `📝 Script preview: "${scriptText.substring(0, 100)}${scriptText.length > 100 ? '...' : ''}"`
    );

    this.teleprompterDisplay.updateScript(scriptText);

    // Auto-save settings
    this.autoSaveSettings();
  }

  /**
   * Update scroll trigger max value based on lines to show
   */
  updateScrollTriggerMax() {
    const linesToShow = this.container.querySelector('#linesToShow');
    const scrollTrigger = this.container.querySelector('#scrollTrigger');

    if (linesToShow && scrollTrigger) {
      const linesToShowValue = parseInt(linesToShow.value) || 5;
      const maxValue = Math.max(1, linesToShowValue - 1); // Max is one less than lines to show, minimum 1
      scrollTrigger.max = maxValue;

      // If current scroll trigger value is greater than new max, adjust it
      if (parseInt(scrollTrigger.value) > maxValue) {
        scrollTrigger.value = maxValue;
        this.log(
          `📏 Adjusted scrollTrigger to ${maxValue} (max allowed for ${linesToShowValue} lines)`
        );
      }
    }
  }

  /**
   * Handle settings changes
   */
  handleSettingsChange() {
    const formValues = this.getFormValues();
    this.teleprompterDisplay.updateSettings(
      formValues.linesToShow,
      formValues.scrollTrigger,
      formValues.textSize
    );

    // Update fuzzy matcher precision
    if (this.fuzzyMatcher) {
      this.fuzzyMatcher.setPrecision(formValues.fuzzyPrecision);
    }

    // Auto-save settings
    this.autoSaveSettings();
  }

  /**
   * Handle language changes
   */
  handleLanguageChange() {
    const formValues = this.getFormValues();
    this.speechRecognition.setLanguages(formValues.primaryLanguage);

    // Auto-save settings
    this.autoSaveSettings();
  }

  /**
   * Handle speech recognition results (async version)
   */
  async handleSpeechResult(newFinalWords, speechOutputHTML) {
    // Update speech output display
    const speechOutput = document.getElementById('speechOutput');
    if (speechOutput) {
      speechOutput.innerHTML = speechOutputHTML;
    }

    // Process words for matching if we have new final words
    if (newFinalWords.length > 0) {
      const scriptWords = this.teleprompterDisplay.getOriginalScriptWords();
      const currentPosition = this.teleprompterDisplay.getCurrentPosition();

      // Use async processing to prevent blocking
      try {
        await this.fuzzyMatcher.processSpokenWords(
          newFinalWords,
          scriptWords,
          currentPosition,
          (result) => this.handleMatchFound(result)
        );
      } catch (error) {
        this.debugLogger.info('❌ Error processing speech result: ' + error.message);
      }
    }
  }

  /**
   * Handle when a match is found
   */
  handleMatchFound(result) {
    try {
      this.debugLogger.info(`🔍 Match result: ${JSON.stringify(result)}`);

      if (!result || typeof result.newPosition === 'undefined' || !result.matchedIndices) {
        this.debugLogger.info(`⚠️ Invalid match result: ${JSON.stringify(result)}`);
        return;
      }

      this.teleprompterDisplay.updatePosition(result.newPosition, result.matchedIndices);
    } catch (error) {
      this.debugLogger.info('❌ Error processing match: ' + error.message);
    }
  }

  /**
   * Update language settings state based on listening status
   */
  updateLanguageSettingsState(isListening) {
    const primaryLanguage = document.getElementById('primaryLanguage');

    if (primaryLanguage) {
      primaryLanguage.disabled = isListening;
      if (isListening) {
        primaryLanguage.title = 'Language settings disabled while listening';
      } else {
        primaryLanguage.title = 'Select primary language for speech recognition';
      }
    }

    this.debugLogger.info(`🌍 Language settings ${isListening ? 'disabled' : 'enabled'}`);
  }

  /**
   * Handle status changes from speech recognition
   */
  handleStatusChange(status, languageInfo) {
    const statusMessages = {
      listening: `Listening... (${languageInfo})`,
      stopped: `Ready - ${languageInfo}`,
      error: 'Error occurred',
    };

    // Update button states
    const isListening = status === 'listening';

    // Try to find button in current document context (works for both main and PiP)
    const toggleBtn = document.getElementById('toggleButton');

    this.debugLogger.info(`🔄 Status change: ${status}, isListening: ${isListening}`);
    this.debugLogger.info(`🔄 Current document: ${document === window.document ? 'main' : 'PiP'}`);
    this.debugLogger.info(`🔄 Toggle button found: ${!!toggleBtn}`);

    if (toggleBtn) {
      const oldText = toggleBtn.textContent;
      const oldClass = toggleBtn.className;

      toggleBtn.textContent = isListening ? 'Stop' : 'Start';
      toggleBtn.className = isListening ? 'teleprompter-stop-button' : 'teleprompter-start-button';

      this.debugLogger.info(`🔄 Button updated: "${oldText}" → "${toggleBtn.textContent}"`);
      this.debugLogger.info(`🔄 Class updated: "${oldClass}" → "${toggleBtn.className}"`);
    } else {
      // Button not found in current context - this is normal when elements are in PiP
      this.debugLogger.info('📺 Toggle button not in current document (likely in PiP window)');
      this.debugLogger.info(
        `🔄 Available elements with IDs: ${Array.from(document.querySelectorAll('[id]'))
          .map((el) => el.id)
          .join(', ')}`
      );
    }

    // Update state in StateManager
    stateManager.updateState(
      {
        isListening: isListening,
        recognitionStatus: status,
      },
      'App'
    );

    // Force sync PiP controls after button state update
    if (stateManager.isPiPWindowOpen()) {
      this.debugLogger.info('🔄 PiP window is open, syncing controls...');
      stateManager.syncPiPControls();
    }

    // Update language settings state
    this.updateLanguageSettingsState(isListening);

    // PiP synchronization is now handled by StateManager
  }

  /**
   * Start speech recognition
   */
  startRecognition() {
    this.debugLogger.info('🎤 Starting speech recognition...');
    this.debugLogger.info(`🔍 Speech recognition module exists: ${!!this.speechRecognition}`);
    this.debugLogger.info(
      `🔍 Recognition instance exists: ${!!(
        this.speechRecognition && this.speechRecognition.recognition
      )}`
    );

    if (this.speechRecognition) {
      this.debugLogger.info('🎤 Calling speechRecognition.start()...');
      this.speechRecognition.start();
      this.debugLogger.info('✅ Speech recognition start() called');
    } else {
      this.debugLogger.info('❌ Speech recognition module not found!');
    }
  }

  /**
   * Stop speech recognition
   */
  stopRecognition() {
    this.debugLogger.info('🛑 Stopping speech recognition...');
    if (this.speechRecognition) {
      this.debugLogger.info('🛑 Calling speechRecognition.stop()...');
      this.speechRecognition.stop();
      this.debugLogger.info('✅ Speech recognition stop() called');
    } else {
      this.debugLogger.info('❌ Speech recognition module not found!');
    }
  }

  /**
   * Toggle speech recognition (start if stopped, stop if started)
   */
  toggleRecognition() {
    // Check current state from StateManager
    const currentState = stateManager.getState();
    const isCurrentlyListening = currentState.isListening;

    this.debugLogger.info(
      `🔄 Toggle button clicked - currently listening: ${isCurrentlyListening}`
    );
    this.debugLogger.info(`🔄 Current listening state: ${isCurrentlyListening}`);

    if (isCurrentlyListening) {
      this.debugLogger.info('🔄 Calling stopRecognition()');
      this.stopRecognition();
    } else {
      this.debugLogger.info('🔄 Calling startRecognition()');
      this.startRecognition();
    }
  }

  /**
   * Reset the application
   */
  reset() {
    this.debugLogger.info('🔄 Resetting application...');

    this.speechRecognition.reset();
    this.teleprompterDisplay.reset();
    this.fuzzyMatcher.reset();

    // Update displays
    const speechOutput = document.getElementById('speechOutput');
    if (speechOutput) {
      speechOutput.innerHTML = 'Click "Start Recognition" to begin speech recognition...';
    }

    const toggleBtn = document.getElementById('toggleButton');
    if (toggleBtn) {
      toggleBtn.textContent = 'Start';
      toggleBtn.className = 'teleprompter-start-button';
    }

    // Force sync PiP controls after reset
    if (stateManager.isPiPWindowOpen()) {
      stateManager.syncPiPControls();
    }

    // Reset state in StateManager
    stateManager.reset();

    this.debugLogger.info('✅ Application reset complete');
  }

  /**
   * Clear debug log
   */
  clearDebugLog() {
    const debugLog = document.getElementById('debugLog');
    if (debugLog) {
      debugLog.textContent = 'Debug log cleared...\n';
    }
  }

  /**
   * Get application state for debugging
   */
  getState() {
    return {
      isRecognizing: this.speechRecognition.isRecognizing(),
      currentPosition: this.teleprompterDisplay.getCurrentPosition(),
      totalWords: this.teleprompterDisplay.getTotalWords(),
      progress: this.teleprompterDisplay.getProgress(),
      finalTranscript: this.speechRecognition.getFinalTranscript(),
      formValues: this.getFormValues(),
    };
  }

  /**
   * Clean up event listeners and resources
   */
  destroy() {
    this.debugLogger.info('🧹 Cleaning up application resources...');

    // Stop speech recognition
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }

    // Remove all event listeners
    this.eventHandlers.forEach((handlers, element) => {
      handlers.forEach(({ event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
    });
    this.eventHandlers.clear();

    this.debugLogger.info('✅ Application cleanup complete');
  }
}

// Initialize the application when the DOM is loaded (for standalone mode)
export { SpeechTeleprompterApp };

document.addEventListener('DOMContentLoaded', () => {
  if (!window.speechTeleprompterApp) {
    window.speechTeleprompterApp = new SpeechTeleprompterApp();
  }
});

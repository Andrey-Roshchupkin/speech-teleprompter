import { logManager } from './log-manager.js';

/**
 * Speech Recognition Module
 * Handles Web Speech API integration and fuzzy matching
 * Optimized for widget injection with debouncing and async processing
 */
class SpeechRecognitionModule {
  constructor() {
    this.debugLogger = logManager.createLogger('SpeechRecognitionModule');
    this.recognition = null;
    this.recognizing = false;
    this.finalTranscript = '';
    this.primaryLanguage = 'en-US';
    this.onResultCallback = null;
    this.onStatusChangeCallback = null;

    // Debouncing and async processing
    this.resultQueue = [];
    this.isProcessingResults = false;
    this.debounceTimeout = null;
    this.debounceDelay = 100; // ms
    this.maxProcessingTime = 10; // ms per processing chunk

    this.initializeSpeechRecognition();
  }

  initializeSpeechRecognition() {
    this.debugLogger.info('🔧 Initializing speech recognition...');
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.debugLogger.info('❌ Speech Recognition API not supported');
      alert(
        'Your browser does not support Web Speech API. Please try using Google Chrome.'
      );
      return;
    }

    this.debugLogger.info('✅ Speech Recognition API found');
    this.SpeechRecognition = SpeechRecognition;
    this.createRecognitionInstances();
  }

  createRecognitionInstances() {
    this.debugLogger.info('🔧 Creating recognition instances...');
    // Create primary recognition instance
    this.recognition = new this.SpeechRecognition();
    this.recognition.lang = this.primaryLanguage;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.debugLogger.info(
      `✅ Primary recognition instance created with language: ${this.primaryLanguage}`
    );

    this.recognition.onstart = () => this.onRecognitionStart();
    this.recognition.onresult = (event) =>
      this.onRecognitionResult(event, 'primary');
    this.recognition.onend = () => this.onRecognitionEnd();
    this.recognition.onerror = (event) => this.onRecognitionError(event);
  }

  setLanguages(primary) {
    this.primaryLanguage = primary;
    this.createRecognitionInstances();
  }

  setCallbacks(onResult, onStatusChange) {
    this.onResultCallback = onResult;
    this.onStatusChangeCallback = onStatusChange;
  }

  start() {
    this.debugLogger.info('🎤 SpeechRecognitionModule.start() called');
    this.debugLogger.info(`🔍 Already recognizing: ${this.recognizing}`);
    this.debugLogger.info(
      `🔍 Recognition instance exists: ${!!this.recognition}`
    );

    if (!this.recognizing && this.recognition) {
      this.debugLogger.info('✅ Starting speech recognition...');
      this.recognition.start();
      this.finalTranscript = '';
    } else {
      this.debugLogger.info(
        '❌ Cannot start recognition - already recognizing or no instance'
      );
    }
  }

  stop() {
    if (this.recognizing) {
      if (this.recognition) {
        this.recognition.stop();
      }
    }
  }

  onRecognitionStart() {
    this.recognizing = true;
    this.debugLogger.info('🎙️ Speech recognition started');

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback('listening', this.getLanguageInfo());
    }
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
   * Debounced result processing to prevent rapid-fire callbacks
   */
  debouncedProcessResult(newFinalWords, speechOutputHTML) {
    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Add to processing queue
    this.resultQueue.push({ newFinalWords, speechOutputHTML });

    // Set new timeout
    this.debounceTimeout = setTimeout(() => {
      this.processResultQueue();
    }, this.debounceDelay);
  }

  /**
   * Process the queue of speech results
   */
  async processResultQueue() {
    if (this.isProcessingResults || this.resultQueue.length === 0) {
      return;
    }

    this.isProcessingResults = true;
    const startTime = performance.now();

    while (this.resultQueue.length > 0) {
      // Check if we need to yield control
      if (performance.now() - startTime > this.maxProcessingTime) {
        await this.yieldToMainThread();
      }

      const { newFinalWords, speechOutputHTML } = this.resultQueue.shift();

      if (this.onResultCallback) {
        this.debugLogger.info('🔄 Processing new final words for matching...');
        this.onResultCallback(newFinalWords, speechOutputHTML);
      }
    }

    this.isProcessingResults = false;
  }

  onRecognitionResult(event, source = 'primary') {
    let interimTranscript = '';
    let newFinalWords = [];

    this.debugLogger.info(
      `🎙️ Speech recognition result (${source}): ${event.results.length} results`
    );

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const confidence = event.results[i][0].confidence;

      this.debugLogger.info(
        `  Result ${i}: "${transcript}" (confidence: ${
          confidence?.toFixed(3) || 'N/A'
        }, final: ${event.results[i].isFinal})`
      );

      if (event.results[i].isFinal) {
        this.finalTranscript += transcript + ' ';
        newFinalWords = transcript
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0);

        this.debugLogger.info(`📝 New final words: ${newFinalWords.join(' ')}`);
      } else {
        interimTranscript += transcript;
      }
    }

    // Update speech output display
    const speechOutputHTML =
      this.finalTranscript +
      '<span class="teleprompter-interim">' +
      interimTranscript +
      '</span>';

    // Use debounced processing for final words
    if (newFinalWords.length > 0) {
      this.debouncedProcessResult(newFinalWords, speechOutputHTML);
    } else {
      // Update display immediately for interim results
      if (this.onResultCallback) {
        this.onResultCallback([], speechOutputHTML);
      }
    }
  }

  onRecognitionEnd() {
    this.recognizing = false;
    this.debugLogger.info('🎙️ Speech recognition ended');

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback('stopped', this.getLanguageInfo());
    }
  }

  onRecognitionError(event) {
    this.debugLogger.info(`❌ Speech recognition error: ${event.error}`);
    this.recognizing = false;

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback('error', this.getLanguageInfo());
    }
  }

  getLanguageInfo() {
    return this.getLanguageName(this.primaryLanguage);
  }

  getLanguageName(langCode) {
    const languageNames = {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'es-ES': 'Spanish (Spain)',
      'es-MX': 'Spanish (Mexico)',
      'fr-FR': 'French (France)',
      'de-DE': 'German (Germany)',
      'it-IT': 'Italian (Italy)',
      'pt-BR': 'Portuguese (Brazil)',
      'pt-PT': 'Portuguese (Portugal)',
      'ru-RU': 'Russian (Russia)',
      'ja-JP': 'Japanese (Japan)',
      'ko-KR': 'Korean (South Korea)',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'ar-SA': 'Arabic (Saudi Arabia)',
      'hi-IN': 'Hindi (India)',
      'nl-NL': 'Dutch (Netherlands)',
      'sv-SE': 'Swedish (Sweden)',
      'no-NO': 'Norwegian (Norway)',
      'da-DK': 'Danish (Denmark)',
      'fi-FI': 'Finnish (Finland)',
      'pl-PL': 'Polish (Poland)',
      'tr-TR': 'Turkish (Turkey)',
      'he-IL': 'Hebrew (Israel)',
      'th-TH': 'Thai (Thailand)',
      'vi-VN': 'Vietnamese (Vietnam)',
    };
    return languageNames[langCode] || langCode;
  }

  isRecognizing() {
    return this.recognizing;
  }

  getFinalTranscript() {
    return this.finalTranscript;
  }

  reset() {
    this.finalTranscript = '';

    // Clear any pending processing
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    this.resultQueue = [];
    this.isProcessingResults = false;

    this.debugLogger.info('🔄 Speech recognition reset');
  }
}

export { SpeechRecognitionModule };

import { ref, onUnmounted, readonly } from 'vue';
import type {
  SpeechRecognitionCallbackResult,
  SpeechRecognitionCallbackStatus,
} from '@/types/global';

export interface UseSpeechRecognitionOptions {
  onResult?: (result: SpeechRecognitionCallbackResult) => void;
  onStatusChange?: (status: SpeechRecognitionCallbackStatus) => void;
}

export const useSpeechRecognition = (
  options: UseSpeechRecognitionOptions = {}
) => {
  // Reactive state
  const isRecognizing = ref(false);
  const finalTranscript = ref('');
  const primaryLanguage = ref('en-US');
  const recognition = ref<any | null>(null);
  const isSupported = ref(false);

  // Debouncing and async processing
  const resultQueue: SpeechRecognitionCallbackResult[] = [];
  const isProcessingResults = ref(false);
  let debounceTimeout: number | null = null;
  const debounceDelay = 100; // ms
  const maxProcessingTime = 10; // ms per processing chunk

  // Language names mapping
  const languageNames: Record<string, string> = {
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
   * Process the queue of speech results
   */
  const processResultQueue = async (): Promise<void> => {
    if (isProcessingResults.value || resultQueue.length === 0) {
      return;
    }

    isProcessingResults.value = true;
    const startTime = performance.now();

    while (resultQueue.length > 0) {
      // Check if we need to yield control
      if (performance.now() - startTime > maxProcessingTime) {
        await yieldToMainThread();
      }

      const result = resultQueue.shift();
      if (result && options.onResult) {
        options.onResult(result);
      }
    }

    isProcessingResults.value = false;
  };

  /**
   * Debounced result processing to prevent rapid-fire callbacks
   */
  const debouncedProcessResult = (
    newFinalWords: string[],
    speechOutputHTML: string
  ): void => {
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Add to processing queue
    resultQueue.push({
      newFinalWords,
      speechOutputHTML,
    } as SpeechRecognitionCallbackResult);

    // Set new timeout
    debounceTimeout = window.setTimeout(() => {
      processResultQueue();
    }, debounceDelay);
  };

  /**
   * Get language name from code
   */
  const getLanguageName = (langCode: string): string => {
    return languageNames[langCode] ?? langCode;
  };

  /**
   * Get current language info
   */
  const getLanguageInfo = (): string => {
    return getLanguageName(primaryLanguage.value);
  };

  /**
   * Initialize speech recognition
   */
  const initializeSpeechRecognition = (): void => {
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech Recognition API not supported');
      showBrowserSupportMessage();
      return;
    }

    isSupported.value = true;
    createRecognitionInstances();
  };

  /**
   * Show detailed browser support message
   */
  const showBrowserSupportMessage = (): void => {
    // const userAgent = navigator.userAgent.toLowerCase() // Temporarily unused
    // let browserName = 'Unknown' // Temporarily unused

    // More accurate browser detection (temporarily unused)
    // if (userAgent.includes('opera') || userAgent.includes('opr/')) {
    //   browserName = 'Opera'
    // } else if (userAgent.includes('edg/')) {
    //   browserName = 'Microsoft Edge'
    // } else if (userAgent.includes('chrome') && !userAgent.includes('edg/')) {
    //   browserName = 'Chrome'
    // } else if (userAgent.includes('firefox')) {
    //   browserName = 'Firefox'
    // } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    //   browserName = 'Safari'
    // } else if (userAgent.includes('msie') || userAgent.includes('trident/')) {
    //   browserName = 'Internet Explorer'
    // }

    const message = `
🎤 Speech Teleprompter - Browser Support Required

Your current browser does not support the Web Speech API.

✅ Supported browsers (according to MDN):
• Google Chrome (full support)
• Microsoft Edge (Chromium-based, full support)
• Safari (partial support, limited functionality)

❌ Not supported:
• Opera (all versions)
• Firefox (all versions)
• Internet Explorer (all versions)
• Other browsers

⚠️ Note: Web Speech API is not a Baseline feature and has limited availability across browsers.

Please switch to Google Chrome or Microsoft Edge for the best speech recognition experience.

The teleprompter will work in manual mode without speech recognition.
    `.trim();

    alert(message);
  };

  /**
   * Create recognition instances
   */
  const createRecognitionInstances = (): void => {
    if (!isSupported.value) return;

    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    recognition.value = new SpeechRecognition();
    recognition.value.lang = primaryLanguage.value;
    recognition.value.continuous = true;
    recognition.value.interimResults = true;

    recognition.value.onstart = onRecognitionStart;
    recognition.value.onresult = onRecognitionResult;
    recognition.value.onend = onRecognitionEnd;
    recognition.value.onerror = onRecognitionError;
  };

  /**
   * Handle recognition start
   */
  const onRecognitionStart = (): void => {
    isRecognizing.value = true;
    if (options.onStatusChange) {
      options.onStatusChange({
        status: 'listening',
        languageInfo: getLanguageInfo(),
      });
    }
  };

  /**
   * Handle recognition result
   */
  const onRecognitionResult = (event: any): void => {
    let interimTranscript = '';
    let newFinalWords: string[] = [];

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      // const confidence = event.results[i][0].confidence // Temporarily unused

      if (event.results[i].isFinal) {
        finalTranscript.value += transcript + ' ';
        newFinalWords = transcript
          .trim()
          .split(/\s+/)
          .filter((word: string) => word.length > 0);
      } else {
        interimTranscript += transcript;
      }
    }

    // Update speech output display
    const speechOutputHTML =
      finalTranscript.value +
      '<span class="teleprompter-interim">' +
      interimTranscript +
      '</span>';

    // Use debounced processing for final words
    if (newFinalWords.length > 0) {
      debouncedProcessResult(newFinalWords, speechOutputHTML);
    } else {
      // Update display immediately for interim results
      if (options.onResult) {
        options.onResult({ newFinalWords: [], speechOutputHTML });
      }
    }
  };

  /**
   * Handle recognition end
   */
  const onRecognitionEnd = (): void => {
    isRecognizing.value = false;
    if (options.onStatusChange) {
      options.onStatusChange({
        status: 'stopped',
        languageInfo: getLanguageInfo(),
      });
    }
  };

  /**
   * Handle recognition error
   */
  const onRecognitionError = (event: any): void => {
    console.error('Speech recognition error:', event.error);
    isRecognizing.value = false;
    if (options.onStatusChange) {
      options.onStatusChange({
        status: 'error',
        languageInfo: getLanguageInfo(),
      });
    }
  };

  /**
   * Set languages
   */
  const setLanguages = (primary: string): void => {
    primaryLanguage.value = primary;
    createRecognitionInstances();
  };

  /**
   * Start speech recognition
   */
  const start = (): void => {
    if (!isRecognizing.value && recognition.value) {
      recognition.value.start();
      finalTranscript.value = '';
    }
  };

  /**
   * Stop speech recognition
   */
  const stop = (): void => {
    if (isRecognizing.value && recognition.value) {
      recognition.value.stop();
    }
  };

  /**
   * Reset speech recognition
   */
  const reset = (): void => {
    finalTranscript.value = '';

    // Clear any pending processing
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }
    resultQueue.length = 0;
    isProcessingResults.value = false;
  };

  // Initialize on setup
  initializeSpeechRecognition();

  // Cleanup on unmount
  onUnmounted(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    if (recognition.value) {
      recognition.value.stop();
    }
  });

  return {
    // State
    isRecognizing: readonly(isRecognizing),
    finalTranscript: readonly(finalTranscript),
    primaryLanguage,
    isSupported: readonly(isSupported),

    // Methods
    setLanguages,
    start,
    stop,
    reset,
    getLanguageInfo,
    getLanguageName,
  };
};

/**
 * Unit Tests for SpeechRecognitionModule
 */

import { SpeechRecognitionModule } from '../speech-recognition.js';

// Mock timers for setTimeout/clearTimeout
jest.useFakeTimers();

describe('SpeechRecognitionModule', () => {
  let speechRecognition;
  let mockRecognitionInstance;
  let mockSpeechRecognition;

  beforeEach(() => {
    // Mock the recognition instance
    mockRecognitionInstance = {
      lang: '',
      continuous: false,
      interimResults: false,
      onstart: null,
      onresult: null,
      onend: null,
      onerror: null,
      start: jest.fn(),
      stop: jest.fn(),
    };

    // Mock the SpeechRecognition constructor
    mockSpeechRecognition = jest.fn(() => mockRecognitionInstance);

    // Mock window.SpeechRecognition
    Object.defineProperty(global.window, 'SpeechRecognition', {
      value: mockSpeechRecognition,
      writable: true,
    });

    // Mock window.webkitSpeechRecognition as fallback
    Object.defineProperty(global.window, 'webkitSpeechRecognition', {
      value: mockSpeechRecognition,
      writable: true,
    });

    // Mock requestIdleCallback
    global.requestIdleCallback = jest.fn((callback) => setTimeout(callback, 0));

    // Mock performance.now
    global.performance = { now: jest.fn(() => Date.now()) };

    speechRecognition = new SpeechRecognitionModule();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default values', () => {
      expect(speechRecognition.recognizing).toBe(false);
      expect(speechRecognition.finalTranscript).toBe('');
      expect(speechRecognition.primaryLanguage).toBe('en-US');
      expect(speechRecognition.debounceDelay).toBe(100);
    });

    test('should create recognition instance with correct settings', () => {
      expect(mockSpeechRecognition).toHaveBeenCalled();
      expect(mockRecognitionInstance.lang).toBe('en-US');
      expect(mockRecognitionInstance.continuous).toBe(true);
      expect(mockRecognitionInstance.interimResults).toBe(true);
    });

    test('should set up event handlers', () => {
      expect(mockRecognitionInstance.onstart).toBeDefined();
      expect(mockRecognitionInstance.onresult).toBeDefined();
      expect(mockRecognitionInstance.onend).toBeDefined();
      expect(mockRecognitionInstance.onerror).toBeDefined();
    });
  });

  describe('initializeSpeechRecognition without API support', () => {
    test('should handle missing Speech Recognition API', () => {
      // Mock alert
      global.alert = jest.fn();

      // Remove SpeechRecognition from window
      delete global.window.SpeechRecognition;
      delete global.window.webkitSpeechRecognition;

      // Create new instance without API
      const speechRecognitionNoAPI = new SpeechRecognitionModule();

      expect(global.alert).toHaveBeenCalledWith(
        'Your browser does not support Web Speech API. Please try using Google Chrome.'
      );
      expect(speechRecognitionNoAPI.recognition).toBe(null);
    });
  });

  describe('setLanguages', () => {
    test('should update primary language and recreate instances', () => {
      speechRecognition.setLanguages('es-ES');

      expect(speechRecognition.primaryLanguage).toBe('es-ES');
      // Should create a new recognition instance
      expect(mockSpeechRecognition).toHaveBeenCalledTimes(2); // Once in constructor, once in setLanguages
    });
  });

  describe('setCallbacks', () => {
    test('should set result and status change callbacks', () => {
      const onResult = jest.fn();
      const onStatusChange = jest.fn();

      speechRecognition.setCallbacks(onResult, onStatusChange);

      expect(speechRecognition.onResultCallback).toBe(onResult);
      expect(speechRecognition.onStatusChangeCallback).toBe(onStatusChange);
    });
  });

  describe('start', () => {
    test('should start recognition when not already recognizing', () => {
      speechRecognition.start();

      expect(mockRecognitionInstance.start).toHaveBeenCalled();
      expect(speechRecognition.finalTranscript).toBe('');
    });

    test('should not start recognition when already recognizing', () => {
      speechRecognition.recognizing = true;

      speechRecognition.start();

      expect(mockRecognitionInstance.start).not.toHaveBeenCalled();
    });

    test('should not start recognition when no instance exists', () => {
      speechRecognition.recognition = null;

      speechRecognition.start();

      expect(mockRecognitionInstance.start).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    test('should stop recognition when recognizing', () => {
      speechRecognition.recognizing = true;

      speechRecognition.stop();

      expect(mockRecognitionInstance.stop).toHaveBeenCalled();
    });

    test('should not stop recognition when not recognizing', () => {
      speechRecognition.recognizing = false;

      speechRecognition.stop();

      expect(mockRecognitionInstance.stop).not.toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    test('should handle recognition start', () => {
      const onStatusChange = jest.fn();
      speechRecognition.setCallbacks(null, onStatusChange);

      speechRecognition.onRecognitionStart();

      expect(speechRecognition.recognizing).toBe(true);
      expect(onStatusChange).toHaveBeenCalledWith('listening', 'English (US)');
    });

    test('should handle recognition end', () => {
      speechRecognition.recognizing = true;
      const onStatusChange = jest.fn();
      speechRecognition.setCallbacks(null, onStatusChange);

      speechRecognition.onRecognitionEnd();

      expect(speechRecognition.recognizing).toBe(false);
      expect(onStatusChange).toHaveBeenCalledWith('stopped', 'English (US)');
    });

    test('should handle recognition error', () => {
      const onStatusChange = jest.fn();
      speechRecognition.setCallbacks(null, onStatusChange);
      const errorEvent = { error: 'network' };

      speechRecognition.onRecognitionError(errorEvent);

      expect(onStatusChange).toHaveBeenCalledWith('error', 'English (US)');
    });
  });

  describe('onRecognitionResult', () => {
    function createMockSpeechEvent(transcript, isFinal = true, confidence = 0.9) {
      return {
        results: [
          {
            0: { transcript, confidence },
            isFinal,
          },
        ],
        resultIndex: 0,
      };
    }

    test('should process final results', () => {
      const onResult = jest.fn();
      speechRecognition.setCallbacks(onResult, null);
      const event = createMockSpeechEvent('hello world', true, 0.9);

      speechRecognition.onRecognitionResult(event);

      expect(speechRecognition.finalTranscript).toContain('hello world');

      // Fast-forward debounce timeout
      jest.advanceTimersByTime(100);

      expect(onResult).toHaveBeenCalled();
    });

    test('should process interim results', () => {
      const onResult = jest.fn();
      speechRecognition.setCallbacks(onResult, null);
      const event = createMockSpeechEvent('hello', false, 0.8);

      speechRecognition.onRecognitionResult(event);

      expect(onResult).toHaveBeenCalledWith([], expect.stringContaining('hello'));
    });

    test('should handle multiple results', () => {
      const event = {
        results: [
          { 0: { transcript: 'hello', confidence: 0.9 }, isFinal: true },
          { 0: { transcript: ' world', confidence: 0.8 }, isFinal: true },
        ],
        resultIndex: 0,
      };

      speechRecognition.onRecognitionResult(event);

      expect(speechRecognition.finalTranscript).toContain('hello');
      expect(speechRecognition.finalTranscript).toContain('world');
    });

    test('should handle empty transcript', () => {
      const event = createMockSpeechEvent('', true, 0.9);

      speechRecognition.onRecognitionResult(event);

      expect(speechRecognition.finalTranscript).toContain(' ');
    });
  });

  describe('Debounced Processing', () => {
    test('should debounce result processing', () => {
      const onResult = jest.fn();
      speechRecognition.setCallbacks(onResult, null);

      speechRecognition.debouncedProcessResult(['hello'], '<span>hello</span>');
      speechRecognition.debouncedProcessResult(['world'], '<span>world</span>');

      expect(onResult).not.toHaveBeenCalled();

      // Fast-forward debounce timeout
      jest.advanceTimersByTime(100);

      expect(onResult).toHaveBeenCalled();
    });

    test('should clear previous timeout when called multiple times', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      speechRecognition.debouncedProcessResult(['hello'], '<span>hello</span>');
      speechRecognition.debouncedProcessResult(['world'], '<span>world</span>');

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLanguageInfo', () => {
    test('should return language information', () => {
      const info = speechRecognition.getLanguageInfo();

      expect(info).toEqual('English (US)');
    });
  });

  describe('reset', () => {
    test('should reset recognition state', () => {
      speechRecognition.finalTranscript = 'some text';
      speechRecognition.resultQueue = [{ test: 'data' }];
      speechRecognition.isProcessingResults = true;

      speechRecognition.reset();

      expect(speechRecognition.finalTranscript).toBe('');
      expect(speechRecognition.resultQueue).toEqual([]);
      expect(speechRecognition.isProcessingResults).toBe(false);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSpeechRecognition } from '../useSpeechRecognition';

// Mock Web Speech API
const mockRecognition = {
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Mock global SpeechRecognition
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: vi.fn(() => mockRecognition),
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: vi.fn(() => mockRecognition),
});

// Mock window.alert to prevent errors
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
});

describe('useSpeechRecognition', () => {
  let speechRecognition: ReturnType<typeof useSpeechRecognition>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockRecognition.start.mockClear();
    mockRecognition.stop.mockClear();
    mockRecognition.abort.mockClear();
    mockRecognition.addEventListener.mockClear();
    mockRecognition.removeEventListener.mockClear();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      speechRecognition = useSpeechRecognition();

      expect(speechRecognition.isRecognizing.value).toBe(false);
      expect(speechRecognition.finalTranscript.value).toBe('');
      expect(speechRecognition.primaryLanguage.value).toBe('en-US');
      expect(speechRecognition.isSupported.value).toBe(true);
    });

    it('should initialize with custom options', () => {
      const mockOnResult = vi.fn();
      const mockOnStatusChange = vi.fn();

      speechRecognition = useSpeechRecognition({
        onResult: mockOnResult,
        onStatusChange: mockOnStatusChange,
      });

      expect(speechRecognition.isRecognizing.value).toBe(false);
      expect(speechRecognition.finalTranscript.value).toBe('');
    });

    it('should detect unsupported browsers', () => {
      // Mock unsupported browser
      const originalSpeechRecognition = (window as any).SpeechRecognition;
      const originalWebkitSpeechRecognition = (window as any)
        .webkitSpeechRecognition;

      (window as any).SpeechRecognition = undefined;
      (window as any).webkitSpeechRecognition = undefined;

      speechRecognition = useSpeechRecognition();

      expect(speechRecognition.isSupported.value).toBe(false);

      // Restore
      (window as any).SpeechRecognition = originalSpeechRecognition;
      (window as any).webkitSpeechRecognition = originalWebkitSpeechRecognition;
    });
  });

  describe('setLanguages', () => {
    beforeEach(() => {
      speechRecognition = useSpeechRecognition();
    });

    it('should set primary language', () => {
      speechRecognition.setLanguages('es-ES');

      expect(speechRecognition.primaryLanguage.value).toBe('es-ES');
    });

    it('should handle unsupported language', () => {
      speechRecognition.setLanguages('unsupported-lang');

      expect(speechRecognition.primaryLanguage.value).toBe('unsupported-lang');
    });
  });

  describe('start', () => {
    beforeEach(() => {
      speechRecognition = useSpeechRecognition();
    });

    it('should call recognition start method', () => {
      speechRecognition.start();

      expect(mockRecognition.start).toHaveBeenCalled();
    });

    it('should not start when not supported', () => {
      // Mock unsupported browser
      const originalSpeechRecognition = (window as any).SpeechRecognition;
      const originalWebkitSpeechRecognition = (window as any)
        .webkitSpeechRecognition;

      (window as any).SpeechRecognition = undefined;
      (window as any).webkitSpeechRecognition = undefined;

      speechRecognition = useSpeechRecognition();
      speechRecognition.start();

      expect(speechRecognition.isRecognizing.value).toBe(false);
      expect(mockRecognition.start).not.toHaveBeenCalled();

      // Restore
      (window as any).SpeechRecognition = originalSpeechRecognition;
      (window as any).webkitSpeechRecognition = originalWebkitSpeechRecognition;
    });
  });

  describe('stop', () => {
    beforeEach(() => {
      speechRecognition = useSpeechRecognition();
    });

    it('should handle stop when not recognizing', () => {
      speechRecognition.stop();

      expect(speechRecognition.isRecognizing.value).toBe(false);
      expect(mockRecognition.stop).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      speechRecognition = useSpeechRecognition();
    });

    it('should reset final transcript', () => {
      speechRecognition.reset();

      expect(speechRecognition.finalTranscript.value).toBe('');
    });
  });

  describe('getLanguageInfo', () => {
    beforeEach(() => {
      speechRecognition = useSpeechRecognition();
    });

    it('should return current language name', () => {
      const info = speechRecognition.getLanguageInfo();

      expect(info).toBe('English (US)'); // Default language
    });

    it('should return updated language name after setLanguages', () => {
      speechRecognition.setLanguages('es-ES');
      const info = speechRecognition.getLanguageInfo();

      expect(info).toBe('Spanish (Spain)');
    });
  });

  describe('getLanguageName', () => {
    beforeEach(() => {
      speechRecognition = useSpeechRecognition();
    });

    it('should return language name for supported language', () => {
      const name = speechRecognition.getLanguageName('en-US');

      expect(name).toBe('English (US)');
    });

    it('should return code for unsupported language', () => {
      const name = speechRecognition.getLanguageName('unsupported-lang');

      expect(name).toBe('unsupported-lang');
    });
  });

  describe('language support', () => {
    beforeEach(() => {
      speechRecognition = useSpeechRecognition();
    });

    it('should support common languages', () => {
      const supportedLanguages = [
        'en-US',
        'en-GB',
        'es-ES',
        'es-MX',
        'fr-FR',
        'de-DE',
        'it-IT',
        'pt-BR',
        'pt-PT',
        'ru-RU',
        'ja-JP',
        'ko-KR',
        'zh-CN',
        'zh-TW',
        'ar-SA',
        'hi-IN',
        'nl-NL',
        'sv-SE',
        'no-NO',
        'da-DK',
      ];

      supportedLanguages.forEach((lang) => {
        const name = speechRecognition.getLanguageName(lang);
        expect(name).not.toBe(lang);
        expect(name).toContain('(');
      });
    });

    it('should handle unsupported languages gracefully', () => {
      const unsupportedLanguages = ['xx-XX', 'invalid', ''];

      unsupportedLanguages.forEach((lang) => {
        const name = speechRecognition.getLanguageName(lang);
        expect(name).toBe(lang);
      });
    });
  });
});

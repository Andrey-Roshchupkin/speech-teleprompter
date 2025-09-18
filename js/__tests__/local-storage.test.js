/**
 * Unit Tests for LocalStorageManager
 */

import { LocalStorageManager } from '../local-storage.js';

// Mock timers for setTimeout/clearTimeout
jest.useFakeTimers();

describe('LocalStorageManager', () => {
  let localStorageManager;
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    // Replace global localStorage
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock document.createElement and DOM methods for showSaveIndicator
    global.document = {
      createElement: jest.fn(() => ({
        id: '',
        style: { cssText: '', opacity: '' },
        textContent: '',
      })),
      getElementById: jest.fn(() => null),
      body: {
        appendChild: jest.fn(),
      },
    };

    localStorageManager = new LocalStorageManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct defaults', () => {
      expect(localStorageManager.storageKey).toBe('speechTeleprompterSettings');
      expect(localStorageManager.autoSaveDelay).toBe(1000);
      expect(localStorageManager.saveTimeout).toBe(null);
    });
  });

  describe('getDefaultSettings', () => {
    test('should return default settings object', () => {
      const defaults = localStorageManager.getDefaultSettings();

      expect(defaults).toEqual({
        scriptText: expect.any(String),
        linesToShow: 5,
        scrollTrigger: 3,
        textSize: 24,
        primaryLanguage: 'en-US',
      });
      expect(defaults.scriptText.length).toBeGreaterThan(0);
    });
  });

  describe('getSavedSettings', () => {
    test('should return default settings when no saved data', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const settings = localStorageManager.getSavedSettings();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('speechTeleprompterSettings');
      expect(settings).toEqual(localStorageManager.getDefaultSettings());
    });

    test('should return parsed settings when saved data exists', () => {
      const savedData = {
        scriptText: 'Test script',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 18,
        primaryLanguage: 'es-ES',
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const settings = localStorageManager.getSavedSettings();

      expect(settings).toEqual(savedData);
    });

    test('should return default settings on JSON parse error', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const settings = localStorageManager.getSavedSettings();

      expect(settings).toEqual(localStorageManager.getDefaultSettings());
    });
  });

  describe('saveSettings', () => {
    test('should debounce save calls', () => {
      const settings = { scriptText: 'Test' };

      localStorageManager.saveSettings(settings);
      localStorageManager.saveSettings(settings);
      localStorageManager.saveSettings(settings);

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      // Fast-forward time to trigger save
      jest.advanceTimersByTime(1000);

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });

    test('should clear previous timeout when called multiple times', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const settings = { scriptText: 'Test' };

      localStorageManager.saveSettings(settings);
      localStorageManager.saveSettings(settings);

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('performSave', () => {
    test('should save valid settings to localStorage', () => {
      const settings = {
        scriptText: 'Test script',
        linesToShow: '3',
        scrollTrigger: '2',
        textSize: '20',
        primaryLanguage: 'es-ES',
      };

      localStorageManager.performSave(settings);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'speechTeleprompterSettings',
        expect.stringContaining('Test script')
      );
    });

    test('should normalize numeric values', () => {
      const settings = {
        linesToShow: '1', // Should be clamped to minimum 2
        scrollTrigger: '10', // Should be clamped to linesToShow - 1
        textSize: 'invalid', // Should default to 24
      };

      localStorageManager.performSave(settings);

      const savedCall = mockLocalStorage.setItem.mock.calls[0];
      const savedData = JSON.parse(savedCall[1]);

      expect(savedData.linesToShow).toBe(2);
      expect(savedData.scrollTrigger).toBe(1);
      expect(savedData.textSize).toBe(24);
    });

    test('should add lastSaved timestamp', () => {
      const settings = { scriptText: 'Test' };

      localStorageManager.performSave(settings);

      const savedCall = mockLocalStorage.setItem.mock.calls[0];
      const savedData = JSON.parse(savedCall[1]);

      expect(savedData.lastSaved).toBeDefined();
      expect(new Date(savedData.lastSaved)).toBeInstanceOf(Date);
    });
  });

  describe('saveSettingsImmediate', () => {
    test('should save immediately without debouncing', () => {
      const settings = { scriptText: 'Test' };

      localStorageManager.saveSettingsImmediate(settings);

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });

    test('should clear existing timeout', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const settings = { scriptText: 'Test' };

      // Set a timeout first
      localStorageManager.saveSettings(settings);

      // Then save immediately - this should clear the timeout
      localStorageManager.saveSettingsImmediate(settings);

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1); // Called once from saveSettingsImmediate
    });
  });

  describe('clearSettings', () => {
    test('should remove settings from localStorage', () => {
      localStorageManager.clearSettings();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('speechTeleprompterSettings');
    });
  });

  describe('hasSettings', () => {
    test('should return true when settings exist', () => {
      mockLocalStorage.getItem.mockReturnValue('{}');

      const result = localStorageManager.hasSettings();

      expect(result).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('speechTeleprompterSettings');
    });

    test('should return false when no settings exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = localStorageManager.hasSettings();

      expect(result).toBe(false);
    });

    test('should return false on localStorage error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = localStorageManager.hasSettings();

      expect(result).toBe(false);
    });
  });

  describe('getLastSavedTime', () => {
    test('should return last saved timestamp', () => {
      const timestamp = '2023-01-01T12:00:00.000Z';
      const savedData = { lastSaved: timestamp };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const result = localStorageManager.getLastSavedTime();

      expect(result).toEqual(new Date(timestamp));
    });

    test('should return null when no timestamp exists', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({}));

      const result = localStorageManager.getLastSavedTime();

      expect(result).toBe(null);
    });

    test('should return null when no settings exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = localStorageManager.getLastSavedTime();

      expect(result).toBe(null);
    });
  });

  describe('exportSettings', () => {
    test('should export settings as formatted JSON', () => {
      const settings = { scriptText: 'Test', linesToShow: 5 };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(settings));

      const result = localStorageManager.exportSettings();

      expect(result).toBe(JSON.stringify(settings, null, 2));
    });

    test('should return null on JSON stringify error', () => {
      // Mock getSavedSettings to return an object that can't be stringified
      const circularObject = {};
      circularObject.self = circularObject;

      jest.spyOn(localStorageManager, 'getSavedSettings').mockReturnValue(circularObject);

      const result = localStorageManager.exportSettings();

      expect(result).toBe(null);
    });
  });

  describe('importSettings', () => {
    test('should import valid JSON settings', () => {
      const settings = { scriptText: 'Imported', linesToShow: 3 };
      const jsonString = JSON.stringify(settings);

      const result = localStorageManager.importSettings(jsonString);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('should return false for invalid JSON', () => {
      const result = localStorageManager.importSettings('invalid json');

      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });
});

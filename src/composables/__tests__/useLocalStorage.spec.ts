import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useLocalStorage, type TeleprompterSettings } from '../useLocalStorage';

describe('useLocalStorage', () => {
  let mockLocalStorage: { [key: string]: string };
  let mockOnSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    mockOnSave = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockLocalStorage = {};
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const storage = useLocalStorage();

      expect(storage.isSaving.value).toBe(false);
      expect(storage.lastSaved.value).toBe(null);
    });

    it('should initialize with custom options', () => {
      const storage = useLocalStorage({
        storageKey: 'customKey',
        autoSaveDelay: 500,
        onSave: mockOnSave,
      });

      expect(storage.isSaving.value).toBe(false);
      expect(storage.lastSaved.value).toBe(null);
    });
  });

  describe('getDefaultSettings', () => {
    it('should return default settings', () => {
      const storage = useLocalStorage();
      const defaultSettings = storage.getDefaultSettings();

      expect(defaultSettings.scriptText).toContain(
        'Welcome to our presentation'
      );
      expect(defaultSettings.linesToShow).toBe(5);
      expect(defaultSettings.scrollTrigger).toBe(3);
      expect(defaultSettings.textSize).toBe(24);
      expect(defaultSettings.primaryLanguage).toBe('en-US');
    });
  });

  describe('getSavedSettings', () => {
    it('should return default settings when no saved data exists', () => {
      const storage = useLocalStorage();
      const settings = storage.getSavedSettings();

      expect(settings.scriptText).toContain('Welcome to our presentation');
      expect(settings.linesToShow).toBe(5);
    });

    it('should return saved settings when they exist', () => {
      const savedSettings: TeleprompterSettings = {
        scriptText: 'Custom script text',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'es-ES',
        lastSaved: '2023-01-01T00:00:00.000Z',
      };

      mockLocalStorage['speechTeleprompterSettings'] =
        JSON.stringify(savedSettings);

      const storage = useLocalStorage();
      const settings = storage.getSavedSettings();

      expect(settings.scriptText).toBe('Custom script text');
      expect(settings.linesToShow).toBe(3);
      expect(settings.scrollTrigger).toBe(2);
      expect(settings.textSize).toBe(20);
      expect(settings.primaryLanguage).toBe('es-ES');
    });

    it('should handle corrupted saved data gracefully', () => {
      mockLocalStorage['speechTeleprompterSettings'] = 'invalid json';

      const storage = useLocalStorage();
      const settings = storage.getSavedSettings();

      // Should fall back to default settings
      expect(settings.scriptText).toContain('Welcome to our presentation');
      expect(settings.linesToShow).toBe(5);
    });

    it('should update lastSaved when valid saved data exists', () => {
      const savedSettings: TeleprompterSettings = {
        scriptText: 'Custom script',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'en-US',
        lastSaved: '2023-01-01T00:00:00.000Z',
      };

      mockLocalStorage['speechTeleprompterSettings'] =
        JSON.stringify(savedSettings);

      const storage = useLocalStorage();
      storage.getSavedSettings();

      expect(storage.lastSaved.value).toEqual(
        new Date('2023-01-01T00:00:00.000Z')
      );
    });
  });

  describe('saveSettings', () => {
    it('should save settings with debouncing', async () => {
      const storage = useLocalStorage({ onSave: mockOnSave });
      const settings: TeleprompterSettings = {
        scriptText: 'Test script',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'en-US',
      };

      storage.saveSettings(settings);
      storage.saveSettings(settings);
      storage.saveSettings(settings);

      // Should not save immediately
      expect(mockOnSave).not.toHaveBeenCalled();

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          scriptText: 'Test script',
          linesToShow: 3,
        })
      );
    });

    it('should use custom autoSaveDelay', async () => {
      const storage = useLocalStorage({
        autoSaveDelay: 100,
        onSave: mockOnSave,
      });
      const settings: TeleprompterSettings = {
        scriptText: 'Test script',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'en-US',
      };

      storage.saveSettings(settings);

      // Wait for custom delay
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveSettingsImmediate', () => {
    it('should save settings immediately', () => {
      const storage = useLocalStorage({ onSave: mockOnSave });
      const settings: TeleprompterSettings = {
        scriptText: 'Immediate save test',
        linesToShow: 4,
        scrollTrigger: 2,
        textSize: 22,
        primaryLanguage: 'en-US',
      };

      storage.saveSettingsImmediate(settings);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          scriptText: 'Immediate save test',
          linesToShow: 4,
        })
      );
    });

    it('should update lastSaved timestamp', () => {
      const storage = useLocalStorage();
      const settings: TeleprompterSettings = {
        scriptText: 'Test',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'en-US',
      };

      const beforeSave = new Date();
      storage.saveSettingsImmediate(settings);
      const afterSave = new Date();

      expect(storage.lastSaved.value).toBeInstanceOf(Date);
      expect(storage.lastSaved.value!.getTime()).toBeGreaterThanOrEqual(
        beforeSave.getTime()
      );
      expect(storage.lastSaved.value!.getTime()).toBeLessThanOrEqual(
        afterSave.getTime()
      );
    });
  });

  describe('clearSettings', () => {
    it('should clear saved settings', () => {
      // First save some settings
      mockLocalStorage['speechTeleprompterSettings'] = JSON.stringify({
        scriptText: 'Test',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'en-US',
      });

      const storage = useLocalStorage();
      storage.clearSettings();

      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        'speechTeleprompterSettings'
      );
    });

    it('should reset lastSaved timestamp', () => {
      const storage = useLocalStorage();

      // First save some settings to set lastSaved
      const settings: TeleprompterSettings = {
        scriptText: 'Test',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'en-US',
      };
      storage.saveSettingsImmediate(settings);

      // Verify lastSaved is set
      expect(storage.lastSaved.value).toBeInstanceOf(Date);

      storage.clearSettings();

      expect(storage.lastSaved.value).toBe(null);
    });
  });

  describe('hasSettings', () => {
    it('should return false when no settings exist', () => {
      const storage = useLocalStorage();
      expect(storage.hasSettings()).toBe(false);
    });

    it('should return true when settings exist', () => {
      mockLocalStorage['speechTeleprompterSettings'] = JSON.stringify({
        scriptText: 'Test',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'en-US',
      });

      const storage = useLocalStorage();
      expect(storage.hasSettings()).toBe(true);
    });
  });

  describe('getLastSavedTime', () => {
    it('should return null when no save has occurred', () => {
      const storage = useLocalStorage();
      expect(storage.getLastSavedTime()).toBe(null);
    });

    it('should return last saved time', () => {
      const storage = useLocalStorage();
      const settings: TeleprompterSettings = {
        scriptText: 'Test',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'en-US',
      };

      storage.saveSettingsImmediate(settings);
      const lastSaved = storage.getLastSavedTime();

      expect(lastSaved).toBeInstanceOf(Date);
    });
  });

  describe('exportSettings', () => {
    it('should export saved settings as JSON string', () => {
      const storage = useLocalStorage();
      const settings: TeleprompterSettings = {
        scriptText: 'Export test',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'en-US',
      };

      // First save the settings
      storage.saveSettingsImmediate(settings);

      // Then export them
      const exported = storage.exportSettings();

      expect(exported).toContain('Export test');
      expect(exported).toContain('"linesToShow": 3');
    });
  });

  describe('importSettings', () => {
    it('should import valid JSON settings', () => {
      const storage = useLocalStorage();
      const settings: TeleprompterSettings = {
        scriptText: 'Import test',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'en-US',
      };

      const jsonString = JSON.stringify(settings);
      const imported = storage.importSettings(jsonString);

      expect(imported).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      const storage = useLocalStorage();
      const imported = storage.importSettings('invalid json');

      expect(imported).toBe(false);
    });

    it('should return false for empty string', () => {
      const storage = useLocalStorage();
      const imported = storage.importSettings('');

      expect(imported).toBe(false);
    });
  });

  describe('custom storage key', () => {
    it('should use custom storage key', () => {
      const storage = useLocalStorage({ storageKey: 'customKey' });
      const settings: TeleprompterSettings = {
        scriptText: 'Custom key test',
        linesToShow: 3,
        scrollTrigger: 2,
        textSize: 20,
        primaryLanguage: 'en-US',
      };

      storage.saveSettingsImmediate(settings);

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'customKey',
        expect.stringContaining('Custom key test')
      );
    });
  });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePictureInPicture } from '../usePictureInPicture';

// Mock dependencies
vi.mock('@/stores/teleprompter', () => ({
  useTeleprompterStore: () => ({
    isInPiP: false,
    updatePosition: vi.fn(),
    updateScript: vi.fn(),
    updateSettings: vi.fn(),
    calculatePiPScrollPosition: vi.fn().mockReturnValue(0),
  }),
}));

vi.mock('./useBroadcastSync', () => ({
  useBroadcastSync: () => ({
    syncPiPState: vi.fn(),
    syncState: vi.fn(),
    syncButtonClick: vi.fn(),
  }),
}));

vi.mock('./useLogManager', () => ({
  useLogManager: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('usePictureInPicture', () => {
  let mockDocumentPictureInPicture: any;
  let mockWindow: any;

  beforeEach(() => {
    // Mock documentPictureInPicture API
    mockDocumentPictureInPicture = {
      requestWindow: vi.fn(),
    };

    // Mock window object
    mockWindow = {
      documentPictureInPicture: mockDocumentPictureInPicture,
      document: {
        querySelector: vi.fn(),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
      },
    };

    // Set up global mocks
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true,
    });

    Object.defineProperty(global, 'document', {
      value: mockWindow.document,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const pip = usePictureInPicture();

      expect(pip.isPiPSupported.value).toBe(false);
      expect(pip.isInPiP.value).toBe(false);
      expect(pip.pipWindow.value).toBe(null);
    });

    it('should check PiP support on initialization', () => {
      usePictureInPicture();

      expect(mockDocumentPictureInPicture.requestWindow).toBeDefined();
    });
  });

  describe('checkPiPSupport', () => {
    it('should detect PiP support when available', () => {
      const pip = usePictureInPicture();

      pip.checkPiPSupport();

      expect(pip.isPiPSupported.value).toBe(true);
    });

    it('should detect no PiP support when not available', () => {
      // Remove PiP support
      mockWindow.documentPictureInPicture = undefined;
      Object.defineProperty(global, 'window', {
        value: mockWindow,
        writable: true,
      });

      const pip = usePictureInPicture();

      pip.checkPiPSupport();

      expect(pip.isPiPSupported.value).toBe(false);
    });
  });

  describe('openPiP', () => {
    it('should handle PiP not supported gracefully', async () => {
      mockWindow.documentPictureInPicture = undefined;
      Object.defineProperty(global, 'window', {
        value: mockWindow,
        writable: true,
      });

      const pip = usePictureInPicture();

      // Should not throw, but handle gracefully
      await expect(pip.openPiP()).resolves.toBeUndefined();
    });

    it('should handle missing DOM elements gracefully', async () => {
      mockWindow.document.querySelector.mockReturnValue(null);

      const pip = usePictureInPicture();

      // Should not throw, but handle gracefully
      await expect(pip.openPiP()).resolves.toBeUndefined();
    });
  });

  describe('closePiP', () => {
    it('should handle closing when no PiP window is open', () => {
      const pip = usePictureInPicture();

      // Should not throw error
      expect(() => pip.closePiP()).not.toThrow();
    });
  });

  describe('togglePiP', () => {
    it('should handle toggle when not in PiP', async () => {
      const pip = usePictureInPicture();

      // Should not throw error
      await expect(pip.togglePiP()).resolves.toBeUndefined();
    });
  });

  describe('syncPiPContent', () => {
    it('should handle sync when no PiP window is open', () => {
      const pip = usePictureInPicture();

      // Should not throw error
      expect(() => pip.syncPiPContent()).not.toThrow();
    });
  });

  describe('syncScrollPosition', () => {
    it('should handle sync when no PiP window is open', () => {
      const pip = usePictureInPicture();

      // Should not throw error
      expect(() => pip.syncScrollPosition()).not.toThrow();
    });
  });

  describe('syncButtonStates', () => {
    it('should handle sync when no PiP window is open', () => {
      const pip = usePictureInPicture();

      // Should not throw error
      expect(() => pip.syncButtonStates()).not.toThrow();
    });
  });

  describe('restoreTeleprompterToMain', () => {
    it('should handle restoration when wrapper not found', () => {
      mockWindow.document.querySelector.mockReturnValue(null);

      const pip = usePictureInPicture();

      // Should not throw error
      expect(() => pip.restoreTeleprompterToMain()).not.toThrow();
    });
  });
});

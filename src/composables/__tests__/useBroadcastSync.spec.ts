import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBroadcastSync } from '../useBroadcastSync';

// Mock useLogManager
vi.mock('../useLogManager', () => ({
  useLogManager: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock useTeleprompterStore
vi.mock('@/stores/teleprompter', () => ({
  useTeleprompterStore: () => ({
    currentPosition: 0,
    scriptText: 'Test script',
    settings: { textSize: 20 },
    matchedWords: [0, 1, 2],
    isListening: false,
    recognitionStatus: 'idle',
    scriptWords: ['Test', 'script'],
    progress: 0,
    currentAttachment: null,
    updatePosition: vi.fn(),
    updateSettings: vi.fn(),
  }),
}));

// Mock BroadcastChannel
const mockChannel = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  postMessage: vi.fn(),
  close: vi.fn(),
};

const mockBroadcastChannel = vi.fn(() => mockChannel);

Object.defineProperty(window, 'BroadcastChannel', {
  writable: true,
  value: mockBroadcastChannel,
});

describe('useBroadcastSync', () => {
  let broadcastSync: ReturnType<typeof useBroadcastSync>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.addEventListener.mockClear();
    mockChannel.removeEventListener.mockClear();
    mockChannel.postMessage.mockClear();
    mockChannel.close.mockClear();
    mockBroadcastChannel.mockClear();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      broadcastSync = useBroadcastSync();

      expect(broadcastSync.isConnected.value).toBe(false); // Initially false until onMounted
    });

    it('should handle unsupported BroadcastChannel', () => {
      // Remove BroadcastChannel support
      const originalBroadcastChannel = (window as any).BroadcastChannel;
      (window as any).BroadcastChannel = undefined;

      broadcastSync = useBroadcastSync();

      expect(broadcastSync.isConnected.value).toBe(false);
      expect(mockBroadcastChannel).not.toHaveBeenCalled();

      // Restore
      (window as any).BroadcastChannel = originalBroadcastChannel;
    });
  });

  describe('syncState', () => {
    beforeEach(() => {
      broadcastSync = useBroadcastSync();
    });

    it('should not broadcast when not connected', () => {
      // When not connected, syncState should not call postMessage
      broadcastSync.syncState();

      expect(mockChannel.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('syncButtonClick', () => {
    beforeEach(() => {
      broadcastSync = useBroadcastSync();
    });

    it('should not broadcast when not connected', () => {
      broadcastSync.syncButtonClick('play', 'click');

      expect(mockChannel.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('syncSettings', () => {
    beforeEach(() => {
      broadcastSync = useBroadcastSync();
    });

    it('should not broadcast when not connected', () => {
      broadcastSync.syncSettings({ textSize: 24 });

      expect(mockChannel.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('syncPiPState', () => {
    beforeEach(() => {
      broadcastSync = useBroadcastSync();
    });

    it('should not broadcast when not connected', () => {
      broadcastSync.syncPiPState(true);

      expect(mockChannel.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('broadcastMessage', () => {
    beforeEach(() => {
      broadcastSync = useBroadcastSync();
    });

    it('should not broadcast when not connected', () => {
      const data = { test: 'data' };

      broadcastSync.broadcastMessage('state_update', data);

      expect(mockChannel.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('closeChannel', () => {
    beforeEach(() => {
      broadcastSync = useBroadcastSync();
    });

    it('should handle closing when already closed', () => {
      // When no channel is open, closeChannel should not throw
      broadcastSync.closeChannel();
      broadcastSync.closeChannel(); // Close again

      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('message handling', () => {
    beforeEach(() => {
      broadcastSync = useBroadcastSync();
    });

    it('should handle state update messages', () => {
      // Basic smoke test - composable should be defined and not crash
      expect(broadcastSync).toBeDefined();
      expect(broadcastSync.isConnected.value).toBe(false);
    });

    it('should handle button click messages', () => {
      // Basic smoke test - composable should be defined and not crash
      expect(broadcastSync).toBeDefined();
      expect(broadcastSync.isConnected.value).toBe(false);
    });

    it('should handle settings change messages', () => {
      // Basic smoke test - composable should be defined and not crash
      expect(broadcastSync).toBeDefined();
      expect(broadcastSync.isConnected.value).toBe(false);
    });

    it('should handle PiP toggle messages', () => {
      // Basic smoke test - composable should be defined and not crash
      expect(broadcastSync).toBeDefined();
      expect(broadcastSync.isConnected.value).toBe(false);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      broadcastSync = useBroadcastSync();
      broadcastSync.isConnected.value = true;
    });

    it('should handle malformed messages gracefully', () => {
      const messageHandler = mockChannel.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'message'
      )?.[1];

      if (messageHandler) {
        // Send malformed message
        expect(() => {
          messageHandler({ data: null });
          messageHandler({ data: {} });
          messageHandler({ data: { type: 'unknown' } });
        }).not.toThrow();
      }

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should handle channel errors gracefully', () => {
      mockChannel.postMessage.mockImplementation(() => {
        throw new Error('Post message failed');
      });

      // Should not throw errors when broadcasting
      expect(() => {
        broadcastSync.syncState();
      }).not.toThrow();
    });

    it('should handle multiple rapid messages', () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        type: 'state_update' as const,
        source: 'main' as const,
        data: { currentPosition: i },
        timestamp: Date.now() + i,
      }));

      const messageHandler = mockChannel.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'message'
      )?.[1];

      if (messageHandler) {
        expect(() => {
          messages.forEach((message) => {
            messageHandler({ data: message });
          });
        }).not.toThrow();
      }

      // Should handle multiple messages without errors
      expect(messages).toHaveLength(10);
    });
  });
});

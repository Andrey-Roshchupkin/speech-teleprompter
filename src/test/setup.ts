/**
 * Test setup file for Speech Teleprompter
 * Configures global test environment and mocks
 */

import { config } from '@vue/test-utils';
import { afterEach, vi } from 'vitest';

// Suppress Vue warnings for composable tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes(
      'onUnmounted is called when there is no active component instance'
    )
  ) {
    return; // Suppress this specific warning
  }
  originalWarn.apply(console, args);
};

// ============================================================================
// Global Test Configuration
// ============================================================================

// Mock Web Speech API
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    continuous: false,
    interimResults: false,
    lang: 'en-US',
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    onstart: null,
    onend: null,
    onresult: null,
    onerror: null,
  })),
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: window.SpeechRecognition,
});

// Mock Document Picture-in-Picture API
Object.defineProperty(window, 'documentPictureInPicture', {
  writable: true,
  value: {
    requestWindow: vi.fn().mockResolvedValue({
      document: {
        head: {
          appendChild: vi.fn(),
        },
        body: {
          append: vi.fn(),
        },
      },
      addEventListener: vi.fn(),
      close: vi.fn(),
      closed: false,
    }),
    addEventListener: vi.fn(),
    window: null,
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ============================================================================
// Vue Test Utils Configuration
// ============================================================================

// Global components for testing
config.global.components = {
  // Add global components here if needed
};

// Global plugins for testing
config.global.plugins = [
  // Add global plugins here if needed
];

// Global mocks
config.global.mocks = {
  $t: (key: string) => key, // i18n mock
};

// Global stubs
config.global.stubs = {
  // Add component stubs here if needed
};

// ============================================================================
// Test Utilities
// ============================================================================

// Helper function to create mock speech recognition results
export const createMockSpeechResult = (
  transcript: string,
  confidence: number = 0.9,
  isFinal: boolean = true
) => ({
  transcript,
  confidence,
  isFinal,
});

// Helper function to create mock speech recognition event
export const createMockSpeechEvent = (
  results: any[],
  resultIndex: number = 0
) => ({
  results,
  resultIndex,
});

// Helper function to wait for next tick
export const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

// Helper function to create mock DOM element
export const createMockElement = (tagName: string = 'div') => {
  const element = document.createElement(tagName);
  element.getBoundingClientRect = vi.fn().mockReturnValue({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    x: 0,
    y: 0,
  });
  return element;
};

// ============================================================================
// Cleanup
// ============================================================================

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

// ============================================================================
// Global Test Types
// ============================================================================

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    documentPictureInPicture: any;
  }
}

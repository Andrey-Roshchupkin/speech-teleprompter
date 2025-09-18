/**
 * Jest Setup File
 * Configures the testing environment for the Speech Teleprompter project
 */

// Mock Web Speech API
global.SpeechRecognition = class MockSpeechRecognition {
  constructor() {
    this.lang = 'en-US';
    this.continuous = true;
    this.interimResults = true;
    this.onstart = null;
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
  }

  start() {
    if (this.onstart) {
      setTimeout(() => this.onstart(), 10);
    }
  }

  stop() {
    if (this.onend) {
      setTimeout(() => this.onend(), 10);
    }
  }

  abort() {
    if (this.onend) {
      setTimeout(() => this.onend(), 10);
    }
  }
};

global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock Document Picture-in-Picture API
global.documentPictureInPicture = {
  requestWindow: jest.fn(() =>
    Promise.resolve({
      document: {
        body: {
          appendChild: jest.fn(),
          removeChild: jest.fn(),
        },
        createElement: jest.fn(() => ({
          style: {},
          appendChild: jest.fn(),
          removeChild: jest.fn(),
        })),
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn(),
      closed: false,
    })
  ),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((cb) => setTimeout(cb, 0));
global.cancelIdleCallback = jest.fn();

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock alert function
global.alert = jest.fn();

// Mock DOM methods that might not be available in jsdom
if (!window.getComputedStyle) {
  window.getComputedStyle = jest.fn(() => ({
    display: 'block',
    fontSize: '16px',
    lineHeight: '1.5',
  }));
}

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Setup test utilities
global.testUtils = {
  createMockElement: (tagName = 'div', attributes = {}) => {
    const element = document.createElement(tagName);
    Object.keys(attributes).forEach((key) => {
      element.setAttribute(key, attributes[key]);
    });
    return element;
  },

  createMockEvent: (type, options = {}) => {
    return new Event(type, options);
  },

  waitFor: (condition, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  },

  mockSpeechResult: (transcript, isFinal = true, confidence = 0.9) => {
    return {
      results: [
        [
          {
            transcript,
            confidence,
          },
        ],
      ],
      resultIndex: 0,
      isFinal,
    };
  },
};

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // localStorage is cleared by individual test files

  // Clear DOM
  document.body.innerHTML = '';

  // Clear timers
  jest.clearAllTimers();
});

// Global test timeout
jest.setTimeout(10000);

/**
 * Unit Tests for LogManager
 */

import { LogManager } from '../log-manager.js';

describe('LogManager', () => {
  let logManager;
  let consoleSpy;

  beforeEach(() => {
    logManager = new LogManager();

    // Mock console methods
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      info: jest.spyOn(console, 'info').mockImplementation(() => {}),
      debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default log level', () => {
      expect(logManager.logLevel).toBe('info');
      expect(logManager.logLevels).toEqual({
        off: 0,
        error: 1,
        info: 2,
        debug: 3,
      });
    });

    test('should bind methods to preserve context', () => {
      const { info } = logManager;
      expect(() => info('test')).not.toThrow();
    });
  });

  describe('setLogLevel', () => {
    test('should set valid log levels', () => {
      logManager.setLogLevel('debug');
      expect(logManager.logLevel).toBe('debug');

      logManager.setLogLevel('error');
      expect(logManager.logLevel).toBe('error');

      logManager.setLogLevel('off');
      expect(logManager.logLevel).toBe('off');
    });

    test('should handle invalid log levels', () => {
      const originalLevel = logManager.logLevel;
      logManager.setLogLevel('invalid');
      expect(logManager.logLevel).toBe(originalLevel);
    });
  });

  describe('Logging Methods', () => {
    test('should log error messages when level allows', () => {
      logManager.setLogLevel('error');
      logManager.error('Test error');

      expect(consoleSpy.error).toHaveBeenCalledWith('❌', 'Test error');
    });

    test('should not log error messages when level is off', () => {
      logManager.setLogLevel('off');
      logManager.error('Test error');

      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    test('should log info messages when level allows', () => {
      logManager.setLogLevel('info');
      logManager.info('Test info');

      expect(consoleSpy.log).toHaveBeenCalledWith('ℹ️', 'Test info');
    });

    test('should not log info messages when level is error', () => {
      logManager.setLogLevel('error');
      // Clear the spy after setLogLevel call since it logs the level change
      consoleSpy.log.mockClear();

      logManager.info('Test info');

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('createLogger', () => {
    test('should create namespaced logger', () => {
      const logger = logManager.createLogger('TestComponent');

      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    test('should prefix messages with namespace', () => {
      const logger = logManager.createLogger('TestComponent');
      logManager.setLogLevel('info');

      logger.info('Test message');

      expect(consoleSpy.log).toHaveBeenCalledWith('ℹ️', '[TestComponent]', 'Test message');
    });
  });
});

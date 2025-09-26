import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLogManager, type LogLevel } from '../useLogManager';

describe('useLogManager', () => {
  let logManager: ReturnType<typeof useLogManager>;
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Mock console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      logManager = useLogManager();

      expect(logManager.logLevel.value).toBe('info');
      expect(logManager.logEntries.value).toEqual([]);
    });

    it('should initialize with custom options', () => {
      const onLog = vi.fn();
      logManager = useLogManager({
        maxEntries: 500,
        onLog,
      });

      expect(logManager.logLevel.value).toBe('info');
      expect(logManager.logEntries.value).toEqual([]);
    });
  });

  describe('log level management', () => {
    beforeEach(() => {
      logManager = useLogManager();
    });

    it('should set and get log level', () => {
      logManager.setLogLevel('debug');
      expect(logManager.getLogLevel()).toBe('debug');
      expect(logManager.logLevel.value).toBe('debug');

      logManager.setLogLevel('error');
      expect(logManager.getLogLevel()).toBe('error');
      expect(logManager.logLevel.value).toBe('error');
    });

    it('should handle invalid log level', () => {
      logManager.setLogLevel('invalid' as LogLevel);
      expect(logManager.getLogLevel()).toBe('info');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "⚠️ Invalid log level: invalid. Using 'info' instead."
      );
    });

    it('should check if log level should be output', () => {
      logManager.setLogLevel('info');

      expect(logManager.shouldLog('error')).toBe(true);
      expect(logManager.shouldLog('info')).toBe(true);
      expect(logManager.shouldLog('debug')).toBe(false);

      logManager.setLogLevel('debug');
      expect(logManager.shouldLog('debug')).toBe(true);

      logManager.setLogLevel('off');
      expect(logManager.shouldLog('error')).toBe(false);
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      logManager = useLogManager();
    });

    it('should log error messages', () => {
      logManager.setLogLevel('error');
      logManager.error('Test error', 'with args');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌',
        'Test error',
        'with args'
      );
      expect(logManager.logEntries.value).toHaveLength(1);
      expect(logManager.logEntries.value[0]).toMatchObject({
        level: 'error',
        message: 'Test error with args',
        args: ['Test error', 'with args'],
      });
    });

    it('should log info messages', () => {
      logManager.setLogLevel('info');
      logManager.info('Test info', 'with args');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'ℹ️',
        'Test info',
        'with args'
      );
      expect(logManager.logEntries.value).toHaveLength(1);
      expect(logManager.logEntries.value[0]).toMatchObject({
        level: 'info',
        message: 'Test info with args',
        args: ['Test info', 'with args'],
      });
    });

    it('should log debug messages', () => {
      logManager.setLogLevel('debug');
      logManager.debug('Test debug', 'with args');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '🐛',
        'Test debug',
        'with args'
      );
      expect(logManager.logEntries.value).toHaveLength(1);
      expect(logManager.logEntries.value[0]).toMatchObject({
        level: 'debug',
        message: 'Test debug with args',
        args: ['Test debug', 'with args'],
      });
    });

    it('should not log when level is too low', () => {
      logManager.setLogLevel('error');
      // Clear the console calls from setLogLevel
      consoleSpy.log.mockClear();

      logManager.info('This should not log');
      logManager.debug('This should not log');

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(logManager.logEntries.value).toHaveLength(0);
    });

    it('should log with custom level and emoji', () => {
      logManager.setLogLevel('info');
      logManager.logWithLevel('info', '🚀', 'Custom log');

      expect(consoleSpy.log).toHaveBeenCalledWith('🚀', 'Custom log');
      expect(logManager.logEntries.value).toHaveLength(1);
      expect(logManager.logEntries.value[0]).toMatchObject({
        level: 'info',
        message: 'Custom log',
        args: ['Custom log'],
      });
    });
  });

  describe('namespaced logger', () => {
    beforeEach(() => {
      logManager = useLogManager();
    });

    it('should create namespaced logger', () => {
      const namespacedLogger = logManager.createLogger('TestComponent');
      logManager.setLogLevel('debug');
      // Clear the console calls from setLogLevel
      consoleSpy.log.mockClear();

      namespacedLogger.info('Test message');
      namespacedLogger.error('Test error');
      namespacedLogger.debug('Test debug');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'ℹ️',
        '[TestComponent]',
        'Test message'
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌',
        '[TestComponent]',
        'Test error'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '🐛',
        '[TestComponent]',
        'Test debug'
      );

      expect(logManager.logEntries.value).toHaveLength(3);
      expect(logManager.logEntries.value[0]).toMatchObject({
        level: 'info',
        namespace: 'TestComponent',
        message: 'Test message',
      });
    });

    it('should support log alias in namespaced logger', () => {
      const namespacedLogger = logManager.createLogger('TestComponent');
      logManager.setLogLevel('info');

      namespacedLogger.log('Test log');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'ℹ️',
        '[TestComponent]',
        'Test log'
      );
      expect(logManager.logEntries.value).toHaveLength(1);
      expect(logManager.logEntries.value[0]).toMatchObject({
        level: 'info',
        namespace: 'TestComponent',
        message: 'Test log',
      });
    });
  });

  describe('log entries management', () => {
    beforeEach(() => {
      logManager = useLogManager({ maxEntries: 3 });
    });

    it('should limit log entries to maxEntries', () => {
      logManager.setLogLevel('info');

      logManager.info('Message 1');
      logManager.info('Message 2');
      logManager.info('Message 3');
      logManager.info('Message 4'); // This should remove Message 1

      expect(logManager.logEntries.value).toHaveLength(3);
      expect(logManager.logEntries.value[0].message).toBe('Message 2');
      expect(logManager.logEntries.value[2].message).toBe('Message 4');
    });

    it('should clear all log entries', () => {
      logManager.setLogLevel('info');
      logManager.info('Test message');
      logManager.error('Test error');

      expect(logManager.logEntries.value).toHaveLength(2);

      logManager.clearLogs();
      expect(logManager.logEntries.value).toHaveLength(0);
    });

    it('should get log entries filtered by level', () => {
      logManager.setLogLevel('debug');
      logManager.info('Info message');
      logManager.error('Error message');
      logManager.debug('Debug message');

      const errorEntries = logManager.getLogEntries('error');
      const infoEntries = logManager.getLogEntries('info');
      const debugEntries = logManager.getLogEntries('debug');
      const allEntries = logManager.getLogEntries();

      expect(errorEntries).toHaveLength(1);
      expect(errorEntries[0].message).toBe('Error message');

      expect(infoEntries).toHaveLength(1);
      expect(infoEntries[0].message).toBe('Info message');

      expect(debugEntries).toHaveLength(1);
      expect(debugEntries[0].message).toBe('Debug message');

      expect(allEntries).toHaveLength(3);
    });
  });

  describe('export functionality', () => {
    beforeEach(() => {
      logManager = useLogManager();
    });

    it('should export logs as JSON', () => {
      logManager.setLogLevel('info');
      logManager.info('Test message');
      logManager.error('Test error');

      const exported = logManager.exportLogs();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toMatchObject({
        level: 'info',
        message: 'Test message',
      });
      expect(parsed[1]).toMatchObject({
        level: 'error',
        message: 'Test error',
      });
    });
  });

  describe('onLog callback', () => {
    it('should call onLog callback when provided', () => {
      const onLog = vi.fn();
      logManager = useLogManager({ onLog });

      logManager.setLogLevel('info');
      logManager.info('Test message');

      expect(onLog).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: 'Test message',
        })
      );
    });
  });

  describe('timestamp handling', () => {
    beforeEach(() => {
      logManager = useLogManager();
    });

    it('should add timestamps to log entries', () => {
      const beforeTime = new Date();
      logManager.setLogLevel('info');
      logManager.info('Test message');
      const afterTime = new Date();

      const entry = logManager.logEntries.value[0];
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(entry.timestamp.getTime()).toBeLessThanOrEqual(
        afterTime.getTime()
      );
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      logManager = useLogManager();
    });

    it('should handle empty log messages', () => {
      logManager.setLogLevel('info');
      logManager.info();

      expect(logManager.logEntries.value).toHaveLength(1);
      expect(logManager.logEntries.value[0].message).toBe('');
      expect(logManager.logEntries.value[0].args).toEqual([]);
    });

    it('should handle complex arguments', () => {
      logManager.setLogLevel('info');
      const obj = { test: 'value' };
      const arr = [1, 2, 3];

      logManager.info('Message', obj, arr, null, undefined);

      expect(logManager.logEntries.value).toHaveLength(1);
      expect(logManager.logEntries.value[0].args).toEqual([
        'Message',
        obj,
        arr,
        null,
        undefined,
      ]);
    });

    it('should handle very long messages', () => {
      logManager = useLogManager({ maxEntries: 1 });
      logManager.setLogLevel('info');

      const longMessage = 'a'.repeat(1000);
      logManager.info(longMessage);

      expect(logManager.logEntries.value).toHaveLength(1);
      expect(logManager.logEntries.value[0].message).toBe(longMessage);
    });
  });
});

/**
 * Log Manager - Centralized logging system with configurable levels
 * Handles different log levels: off, error, info, debug
 */
export class LogManager {
  constructor() {
    this.logLevel = 'info'; // Default level
    this.logLevels = {
      off: 0,
      error: 1,
      info: 2,
      debug: 3,
    };

    // Bind methods to preserve context
    this.error = this.error.bind(this);
    this.info = this.info.bind(this);
    this.debug = this.debug.bind(this);
  }

  /**
   * Set the current log level
   * @param {string} level - 'off', 'error', 'info', or 'debug'
   */
  setLogLevel(level) {
    if (this.logLevels.hasOwnProperty(level)) {
      this.logLevel = level;
      console.log(`🐛 Log level set to: ${level.toUpperCase()}`);
    } else {
      console.warn(`⚠️ Invalid log level: ${level}. Using 'info' instead.`);
      this.logLevel = 'info';
    }
  }

  /**
   * Get the current log level
   * @returns {string} Current log level
   */
  getLogLevel() {
    return this.logLevel;
  }

  /**
   * Check if a log level should be output
   * @param {string} level - Log level to check
   * @returns {boolean} True if should log
   */
  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }

  /**
   * Log error messages
   * @param {...any} args - Arguments to log
   */
  error(...args) {
    if (this.shouldLog('error')) {
      console.error('❌', ...args);
    }
  }

  /**
   * Log info messages
   * @param {...any} args - Arguments to log
   */
  info(...args) {
    if (this.shouldLog('info')) {
      console.log('ℹ️', ...args);
    }
  }

  /**
   * Log debug messages
   * @param {...any} args - Arguments to log
   */
  debug(...args) {
    if (this.shouldLog('debug')) {
      console.log('🐛', ...args);
    }
  }

  /**
   * Create a namespaced logger for a specific component
   * @param {string} namespace - Component namespace (e.g., 'TeleprompterCore')
   * @returns {object} Logger with namespaced methods
   */
  createLogger(namespace) {
    return {
      error: (...args) => this.error(`[${namespace}]`, ...args),
      info: (...args) => this.info(`[${namespace}]`, ...args),
      debug: (...args) => this.debug(`[${namespace}]`, ...args),
      log: (...args) => this.info(`[${namespace}]`, ...args), // Alias for backward compatibility
    };
  }

  /**
   * Log with custom level and emoji
   * @param {string} level - Log level
   * @param {string} emoji - Emoji to use
   * @param {...any} args - Arguments to log
   */
  logWithLevel(level, emoji, ...args) {
    if (this.shouldLog(level)) {
      console.log(emoji, ...args);
    }
  }
}

// Create global instance
export const logManager = new LogManager();

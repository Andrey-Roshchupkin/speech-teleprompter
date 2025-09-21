import { logManager } from '../log-manager.js';

/**
 * Base class for all managers
 * Provides common functionality and interface
 */
export class BaseManager {
  constructor(debugLogger) {
    this.debugLogger = logManager.createLogger(this.constructor.name);
  }

  /**
   * Log debug message with manager prefix
   */
  log(message) {
    if (this.debugLogger) {
      this.debugLogger.info(message);
    }
  }

  /**
   * Initialize the manager
   * Override in subclasses
   */
  initialize() {
    // Override in subclasses
  }

  /**
   * Cleanup resources
   * Override in subclasses
   */
  cleanup() {
    // Override in subclasses
  }
}

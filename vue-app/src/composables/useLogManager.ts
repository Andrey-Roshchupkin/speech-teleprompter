import { ref, reactive, readonly } from 'vue'
import type { Ref } from 'vue'

export type LogLevel = 'off' | 'error' | 'info' | 'debug'

export interface Logger {
  error: (...args: any[]) => void
  info: (...args: any[]) => void
  debug: (...args: any[]) => void
  log: (...args: any[]) => void // Alias for backward compatibility
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  namespace?: string
  message: string
  args: any[]
}

export interface UseLogManagerOptions {
  maxEntries?: number
  onLog?: (entry: LogEntry) => void
}

export const useLogManager = (options: UseLogManagerOptions = {}) => {
  const maxEntries = options.maxEntries || 1000

  // Reactive state
  const logLevel = ref<LogLevel>('info') // Default level
  const logEntries = ref<LogEntry[]>([])

  const logLevels: Record<LogLevel, number> = {
    off: 0,
    error: 1,
    info: 2,
    debug: 3,
  }

  /**
   * Set the current log level
   */
  const setLogLevel = (level: LogLevel): void => {
    if (level in logLevels) {
      logLevel.value = level
      console.log(`🐛 Log level set to: ${level.toUpperCase()}`)
    } else {
      console.warn(`⚠️ Invalid log level: ${level}. Using 'info' instead.`)
      logLevel.value = 'info'
    }
  }

  /**
   * Get the current log level
   */
  const getLogLevel = (): LogLevel => {
    return logLevel.value
  }

  /**
   * Check if a log level should be output
   */
  const shouldLog = (level: LogLevel): boolean => {
    return logLevels[level] <= logLevels[logLevel.value]
  }

  /**
   * Add log entry to the log entries array
   */
  const addLogEntry = (entry: LogEntry): void => {
    logEntries.value.push(entry)

    // Keep only the last maxEntries entries
    if (logEntries.value.length > maxEntries) {
      logEntries.value = logEntries.value.slice(-maxEntries)
    }

    // Call onLog callback if provided
    if (options.onLog) {
      options.onLog(entry)
    }
  }

  /**
   * Log error messages
   */
  const error = (...args: any[]): void => {
    if (shouldLog('error')) {
      console.error('❌', ...args)
      addLogEntry({
        timestamp: new Date(),
        level: 'error',
        message: args.join(' '),
        args,
      })
    }
  }

  /**
   * Log info messages
   */
  const info = (...args: any[]): void => {
    if (shouldLog('info')) {
      console.log('ℹ️', ...args)
      addLogEntry({
        timestamp: new Date(),
        level: 'info',
        message: args.join(' '),
        args,
      })
    }
  }

  /**
   * Log debug messages
   */
  const debug = (...args: any[]): void => {
    if (shouldLog('debug')) {
      console.log('🐛', ...args)
      addLogEntry({
        timestamp: new Date(),
        level: 'debug',
        message: args.join(' '),
        args,
      })
    }
  }

  /**
   * Create a namespaced logger for a specific component
   */
  const createLogger = (namespace: string): Logger => {
    return {
      error: (...args: any[]) => {
        if (shouldLog('error')) {
          console.error('❌', `[${namespace}]`, ...args)
          addLogEntry({
            timestamp: new Date(),
            level: 'error',
            namespace,
            message: args.join(' '),
            args,
          })
        }
      },
      info: (...args: any[]) => {
        if (shouldLog('info')) {
          console.log('ℹ️', `[${namespace}]`, ...args)
          addLogEntry({
            timestamp: new Date(),
            level: 'info',
            namespace,
            message: args.join(' '),
            args,
          })
        }
      },
      debug: (...args: any[]) => {
        if (shouldLog('debug')) {
          console.log('🐛', `[${namespace}]`, ...args)
          addLogEntry({
            timestamp: new Date(),
            level: 'debug',
            namespace,
            message: args.join(' '),
            args,
          })
        }
      },
      log: (...args: any[]) => {
        if (shouldLog('info')) {
          console.log('ℹ️', `[${namespace}]`, ...args)
          addLogEntry({
            timestamp: new Date(),
            level: 'info',
            namespace,
            message: args.join(' '),
            args,
          })
        }
      },
    }
  }

  /**
   * Log with custom level and emoji
   */
  const logWithLevel = (level: LogLevel, emoji: string, ...args: any[]): void => {
    if (shouldLog(level)) {
      console.log(emoji, ...args)
      addLogEntry({
        timestamp: new Date(),
        level,
        message: args.join(' '),
        args,
      })
    }
  }

  /**
   * Clear all log entries
   */
  const clearLogs = (): void => {
    logEntries.value = []
  }

  /**
   * Get log entries filtered by level
   */
  const getLogEntries = (level?: LogLevel): LogEntry[] => {
    if (level) {
      return logEntries.value.filter((entry) => entry.level === level)
    }
    return [...logEntries.value]
  }

  /**
   * Export logs as JSON string
   */
  const exportLogs = (): string => {
    return JSON.stringify(logEntries.value, null, 2)
  }

  return {
    // State
    logLevel,
    logEntries: readonly(logEntries),

    // Methods
    setLogLevel,
    getLogLevel,
    shouldLog,
    error,
    info,
    debug,
    createLogger,
    logWithLevel,
    clearLogs,
    getLogEntries,
    exportLogs,
  }
}

// Create global instance for backward compatibility
export const logManager = useLogManager()

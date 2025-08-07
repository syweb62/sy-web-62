export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`

    if (context) {
      logMessage += ` | Context: ${JSON.stringify(context)}`
    }

    if (error) {
      logMessage += ` | Error: ${error.message}`
      if (this.isDevelopment && error.stack) {
        logMessage += `\nStack: ${error.stack}`
      }
    }

    return logMessage
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    }

    const formattedLog = this.formatLog(entry)

    // Console output
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog)
        break
      case LogLevel.WARN:
        console.warn(formattedLog)
        break
      case LogLevel.INFO:
        console.info(formattedLog)
        break
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedLog)
        }
        break
    }

    // In production, send to external logging service
    if (!this.isDevelopment && level === LogLevel.ERROR) {
      // Example: Send to Sentry, LogRocket, etc.
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // Implement external logging service integration
    // Example: Sentry.captureException(entry.error, { extra: entry.context })
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context)
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context)
  }
}

export const logger = new Logger()

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  scriptId?: number;
  duration?: number;
  [key: string]: any;
}

export class Logger {
  private static currentLevel: LogLevel = LogLevel.INFO;

  static setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  private static shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  static debug(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  static info(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  static warn(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  static error(message: string, error?: Error, context?: LogContext) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error ? { 
        ...context, 
        error: error.message, 
        stack: error.stack 
      } : context;
      console.error(this.formatMessage('ERROR', message, errorContext));
    }
  }

  // Performance logging
  static performance(operation: string, startTime: number, context?: LogContext) {
    const duration = Date.now() - startTime;
    this.info(`Operation completed: ${operation}`, {
      ...context,
      operation,
      duration
    });
  }

  // Business metrics logging
  static metric(name: string, value: number, context?: LogContext) {
    this.info(`Metric: ${name}=${value}`, {
      ...context,
      metric: name,
      value
    });
  }
}
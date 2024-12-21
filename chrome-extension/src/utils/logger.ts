// Logger utility for the extension
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogValue = string | number | boolean | null | undefined | Record<string, any>;

export interface LogContext {
    [key: string]: LogValue;
}

export interface Logger {
    debug<T extends LogContext = LogContext>(message: string, context?: T): void;
    info<T extends LogContext = LogContext>(message: string, context?: T): void;
    warn<T extends LogContext = LogContext>(message: string, context?: T): void;
    error<T extends LogContext = LogContext>(message: string, context?: T): void;
}

class ConsoleLogger implements Logger {
    private readonly namespace: string;
    private readonly minLevel: LogLevel;

    constructor(namespace: string, minLevel: LogLevel = 'debug') {
        this.namespace = namespace;
        this.minLevel = minLevel;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        const minLevelIndex = levels.indexOf(this.minLevel);
        const currentLevelIndex = levels.indexOf(level);
        return currentLevelIndex >= minLevelIndex;
    }

    private formatMessage(level: LogLevel, message: string): string {
        return `[${this.namespace}] [${level.toUpperCase()}] ${message}`;
    }

    private formatContext<T extends LogContext>(context?: T): T | undefined {
        if (!context) return undefined;
        return context;
    }

    debug<T extends LogContext>(message: string, context?: T): void {
        if (!this.shouldLog('debug')) return;
        if (context) {
            console.debug(this.formatMessage('debug', message), this.formatContext(context));
        } else {
            console.debug(this.formatMessage('debug', message));
        }
    }

    info<T extends LogContext>(message: string, context?: T): void {
        if (!this.shouldLog('info')) return;
        if (context) {
            console.info(this.formatMessage('info', message), this.formatContext(context));
        } else {
            console.info(this.formatMessage('info', message));
        }
    }

    warn<T extends LogContext>(message: string, context?: T): void {
        if (!this.shouldLog('warn')) return;
        if (context) {
            console.warn(this.formatMessage('warn', message), this.formatContext(context));
        } else {
            console.warn(this.formatMessage('warn', message));
        }
    }

    error<T extends LogContext>(message: string, context?: T): void {
        if (!this.shouldLog('error')) return;
        if (context) {
            console.error(this.formatMessage('error', message), this.formatContext(context));
        } else {
            console.error(this.formatMessage('error', message));
        }
    }
}

export function createLogger(namespace: string, minLevel: LogLevel = 'debug'): Logger {
    return new ConsoleLogger(namespace, minLevel);
}

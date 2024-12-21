// Simple logger utility for Chrome extension

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

interface LogMessage {
    timestamp: string;
    level: LogLevel;
    context: string;
    message: string;
    data?: Record<string, any>;
}

export interface Logger {
    debug(message: string, data?: Record<string, any>): void;
    info(message: string, data?: Record<string, any>): void;
    warn(message: string, data?: Record<string, any>): void;
    error(message: string | Error, data?: Record<string, any>): void;
    success(message: string, data?: Record<string, any>): void;
    createSubLogger(subContext: string): Logger;
}

class LoggerImpl implements Logger {
    private context: string;

    constructor(context: string) {
        this.context = context;
    }

    private _formatMessage(level: LogLevel, message: string, data: Record<string, any> = {}): LogMessage {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            level,
            context: this.context,
            message,
            data
        };
    }

    public debug(message: string, data?: Record<string, any>): void {
        console.debug(this._formatMessage('DEBUG', message, data));
    }

    public info(message: string, data?: Record<string, any>): void {
        console.info(this._formatMessage('INFO', message, data));
    }

    public warn(message: string, data?: Record<string, any>): void {
        console.warn(this._formatMessage('WARN', message, data));
    }

    public error(message: string | Error, data?: Record<string, any>): void {
        const errorMessage = message instanceof Error ? message.message : message;
        const errorData = message instanceof Error 
            ? { ...data, stack: message.stack }
            : data;
        console.error(this._formatMessage('ERROR', errorMessage, errorData));
    }

    public success(message: string, data?: Record<string, any>): void {
        console.info(this._formatMessage('SUCCESS', message, data));
    }

    public createSubLogger(subContext: string): Logger {
        return new LoggerImpl(`${this.context}:${subContext}`);
    }
}

export function createLogger(context: string): Logger {
    return new LoggerImpl(context);
}

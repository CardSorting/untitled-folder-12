// Simple logger utility for Chrome extension
class Logger {
    constructor(context) {
        this.context = context;
    }

    _formatMessage(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            level,
            context: this.context,
            message,
            data
        };
    }

    debug(message, data) {
        console.debug(this._formatMessage('DEBUG', message, data));
    }

    info(message, data) {
        console.info(this._formatMessage('INFO', message, data));
    }

    warn(message, data) {
        console.warn(this._formatMessage('WARN', message, data));
    }

    error(message, data) {
        console.error(this._formatMessage('ERROR', message, data));
    }

    success(message, data) {
        console.info(this._formatMessage('SUCCESS', message, data));
    }

    createSubLogger(subContext) {
        return new Logger(`${this.context}:${subContext}`);
    }
}

export function createLogger(context) {
    return new Logger(context);
}

class Logger {
  constructor(context) {
    this.context = context;
    this.debugMode = true; // Can be toggled via storage
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const dataString = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] [${this.context}] [${level}] ${message}${dataString}`;
  }

  formatError(error) {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...(error.cause && { cause: error.cause })
      };
    }
    return error;
  }

  style(level) {
    switch (level) {
      case 'ERROR':
        return 'color: #ff0000; font-weight: bold';
      case 'WARN':
        return 'color: #ff9900; font-weight: bold';
      case 'INFO':
        return 'color: #0066ff';
      case 'DEBUG':
        return 'color: #666666';
      case 'SUCCESS':
        return 'color: #00cc00; font-weight: bold';
      default:
        return '';
    }
  }

  log(level, message, data = null) {
    if (!this.debugMode && level === 'DEBUG') return;

    const formattedMessage = this.formatMessage(level, message, data);
    const style = this.style(level);

    if (data instanceof Error) {
      data = this.formatError(data);
    }

    console.log(`%c${formattedMessage}`, style);

    // Store in extension's log history (optional)
    this.storeLog({ level, message, data, timestamp: new Date().toISOString() });
  }

  async storeLog(logEntry) {
    try {
      const { logs = [] } = await chrome.storage.local.get('logs');
      logs.push(logEntry);
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.shift();
      }
      
      await chrome.storage.local.set({ logs });
    } catch (error) {
      console.error('Failed to store log:', error);
    }
  }

  error(message, data = null) {
    this.log('ERROR', message, data);
  }

  warn(message, data = null) {
    this.log('WARN', message, data);
  }

  info(message, data = null) {
    this.log('INFO', message, data);
  }

  debug(message, data = null) {
    this.log('DEBUG', message, data);
  }

  success(message, data = null) {
    this.log('SUCCESS', message, data);
  }

  group(label) {
    console.group(`[${this.context}] ${label}`);
  }

  groupEnd() {
    console.groupEnd();
  }

  // Create a sub-logger with a new context
  createSubLogger(subContext) {
    return new Logger(`${this.context}:${subContext}`);
  }
}

// Create logger instances for different parts of the extension
export const createLogger = (context) => new Logger(context);

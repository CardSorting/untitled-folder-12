/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

// UNUSED EXPORTS: default

;// ./src/utils/logger.js
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
function createLogger(context) {
  return new Logger(context);
}
;// ./src/config.js
// Configuration for the extension
const config = {
  // API endpoint
  API_ENDPOINT: 'http://localhost:5001',
  // Celery settings
  celery: {
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 2000,
    taskTimeout: 300000,
    // 5 minutes
    healthCheckInterval: 60000 // 1 minute
  },
  // Default speech settings
  speech: {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voice: null
  }
};
;// ./src/utils/celeryClient.js
// Celery client for handling text processing tasks


class celeryClient_CeleryClient {
  constructor(baseUrl = config.API_ENDPOINT) {
    this.logger = createLogger('CeleryClient');
    this.baseUrl = baseUrl;
    this.taskEndpoint = `${this.baseUrl}/process_text`;
    this.statusEndpoint = `${this.baseUrl}/task_status`;
    this.config = config.celery;
    this.logger.info('CeleryClient initialized', {
      baseUrl: this.baseUrl,
      timeout: this.config.timeout
    });
  }
  async processText(text, options = {}) {
    this.logger.debug('Processing text with Celery', {
      textLength: text.length
    });
    try {
      const response = await fetch(this.taskEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          language: options.language || 'en',
          rate: options.rate || 1.0,
          pitch: options.pitch || 1.0,
          volume: options.volume || 1.0,
          emotionalContext: options.emotionalContext || {},
          textStructure: options.textStructure || {}
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
      }
      const data = await response.json();
      this.logger.success('Text processed successfully', data);
      return {
        taskId: data.task_id,
        status: 'PENDING'
      };
    } catch (error) {
      this.logger.error('Error processing text:', error);
      throw error;
    }
  }
  async checkTaskStatus(taskId) {
    try {
      const response = await fetch(`${this.statusEndpoint}/${taskId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        taskId,
        status: data.status,
        result: data.result,
        error: data.error
      };
    } catch (error) {
      this.logger.error('Error checking task status:', error);
      throw error;
    }
  }
  async pollTaskStatus(taskId, interval = 1000) {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.checkTaskStatus(taskId);
          if (status.status === 'SUCCESS') {
            resolve(status.result);
          } else if (status.status === 'FAILURE') {
            reject(new Error(status.error || 'Task failed'));
          } else {
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };
      poll();
    });
  }
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000) // Short timeout for health checks
      });
      return await response.json();
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw error;
    }
  }
}
const celeryClient = new celeryClient_CeleryClient();
;// ./src/textProcessorWorker.js
// Text processor worker for handling speech synthesis

class TextProcessorWorker {
  constructor() {
    this.celeryClient = new CeleryClient();
    this.currentOptions = {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      language: 'en'
    };
  }
  async processText(text, options = {}) {
    try {
      // Merge options with defaults
      const processOptions = {
        ...this.currentOptions,
        ...options,
        emotionalContext: this._analyzeEmotionalContext(text),
        textStructure: this._analyzeTextStructure(text)
      };

      // Process text through backend
      const {
        taskId
      } = await this.celeryClient.processText(text, processOptions);

      // Wait for processing to complete
      const processedText = await this.celeryClient.pollTaskStatus(taskId);

      // Return the processed text
      return this._processSSMLMarkers(processedText);
    } catch (error) {
      console.error('Error processing text:', error);
      throw error;
    }
  }
  _analyzeEmotionalContext(text) {
    // Simple emotion analysis based on keywords and punctuation
    const emotions = {
      excitement: 0,
      urgency: 0,
      happiness: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      uncertainty: 0
    };

    // Excitement and urgency
    emotions.excitement += (text.match(/!/g) || []).length * 0.2;
    emotions.urgency += (text.match(/!/g) || []).length * 0.15;

    // Happiness
    if (text.match(/\b(happy|great|wonderful|excellent|amazing)\b/gi)) {
      emotions.happiness += 0.3;
    }

    // Sadness
    if (text.match(/\b(sad|sorry|unfortunate|regret|disappointed)\b/gi)) {
      emotions.sadness += 0.3;
    }

    // Anger
    if (text.match(/\b(angry|furious|mad|outraged)\b/gi)) {
      emotions.anger += 0.3;
    }

    // Fear
    if (text.match(/\b(afraid|scared|terrified|worried)\b/gi)) {
      emotions.fear += 0.3;
    }

    // Surprise
    if (text.match(/\b(wow|oh|whoa|amazing|incredible)\b/gi)) {
      emotions.surprise += 0.3;
    }

    // Uncertainty
    emotions.uncertainty += (text.match(/\?/g) || []).length * 0.2;
    if (text.match(/\b(maybe|perhaps|possibly|might|could)\b/gi)) {
      emotions.uncertainty += 0.2;
    }

    // Normalize values
    Object.keys(emotions).forEach(emotion => {
      emotions[emotion] = Math.min(emotions[emotion], 1.0);
    });
    return emotions;
  }
  _analyzeTextStructure(text) {
    return {
      totalLength: text.length,
      sentences: (text.match(/[.!?]+/g) || []).length,
      paragraphs: (text.match(/\n\n+/g) || []).length + 1,
      hasDialog: Boolean(text.match(/[""].*?[""]|[''].*?['']|["'].*?["']/g)),
      hasLists: Boolean(text.match(/(?:^|\n)\s*[-*•]|\d+\.|[a-z]\)/gm)),
      hasCode: Boolean(text.match(/(?:^|\n)\s*[{[(]|^\s*\w+\s*=/gm)),
      formalityLevel: this._assessFormality(text)
    };
  }
  _assessFormality(text) {
    const formalWords = text.match(/\b(therefore|however|moreover|furthermore|nevertheless|accordingly)\b/gi) || [];
    const informalWords = text.match(/\b(like|you know|kind of|sort of|basically|pretty much)\b/gi) || [];
    if (formalWords.length + informalWords.length === 0) {
      return 0.5;
    }
    return formalWords.length / (formalWords.length + informalWords.length);
  }
  _processSSMLMarkers(text) {
    // Handle breathing markers
    text = text.replace(/<break time="(\d+\.?\d*)s"\/>/g, (_, duration) => {
      return ' '.repeat(Math.ceil(parseFloat(duration) * 5));
    });

    // Handle prosody markers
    text = text.replace(/<prosody ([^>]+)>(.*?)<\/prosody>/g, (_, attrs, content) => {
      return content;
    });

    // Remove all remaining SSML-like tags
    return text.replace(/<\/?[^>]+(>|$)/g, '');
  }
  setOptions(options) {
    this.currentOptions = {
      ...this.currentOptions,
      ...options
    };
  }
}
/* harmony default export */ const textProcessorWorker = ((/* unused pure expression or super */ null && (TextProcessorWorker)));
/******/ })()
;
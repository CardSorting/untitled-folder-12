/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

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
;// ./src/content.js
// Content script for handling text selection and speech synthesis

class ContentController {
  constructor() {
    this.logger = createLogger('Content');
    this.isProcessing = false;
    this.selectedText = '';
    this.currentUtterance = null;
    this.speechSynthesis = window.speechSynthesis;

    // Initialize message listeners
    this.initializeListeners();
  }
  initializeListeners() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'ping') {
        sendResponse({
          status: 'alive'
        });
        return true;
      } else if (message.action === 'readText') {
        this.speakText(message.text);
        sendResponse({
          status: 'reading'
        });
        return true;
      } else if (message.type === 'stopSpeech') {
        this.stopSpeech();
        sendResponse({
          status: 'stopped'
        });
        return true;
      } else if (message.type === 'processingError') {
        this.handleError(message.error);
        sendResponse({
          status: 'error'
        });
        return true;
      } else if (message.type === 'speakText') {
        this.speakText(message.text, message.options);
      } else if (message.type === 'stopSpeech') {
        this.stopSpeech();
      } else if (message.type === 'processingError') {
        this.handleError(message.error);
      }
    });

    // Add context menu event listener
    document.addEventListener('mouseup', () => {
      const selection = window.getSelection().toString().trim();
      if (selection) {
        this.selectedText = selection;
      }
    });

    // Add keyboard shortcut listener
    document.addEventListener('keydown', event => {
      // Ctrl/Cmd + Shift + S to start/stop speech
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        if (this.isProcessing || this.currentUtterance) {
          this.stopSpeech();
        } else if (this.selectedText) {
          this.processSelectedText();
        }
      }
    });
  }
  async processSelectedText() {
    if (this.isProcessing) {
      this.logger.warn('Already processing text');
      return;
    }
    if (!this.selectedText) {
      this.logger.warn('No text selected');
      return;
    }
    this.isProcessing = true;
    this.logger.info('Processing selected text', {
      textLength: this.selectedText.length
    });
    try {
      await chrome.runtime.sendMessage({
        type: 'processText',
        text: this.selectedText,
        options: {
          language: document.documentElement.lang || 'en'
        }
      });
    } catch (error) {
      this.logger.error('Failed to send text for processing', error);
      this.isProcessing = false;
    }
  }
  speakText(text, options = {}) {
    this.stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);

    // Apply options
    utterance.lang = options.language || 'en';
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    // Set up event handlers
    utterance.onend = () => {
      this.logger.info('Speech completed');
      this.currentUtterance = null;
      this.isProcessing = false;
    };
    utterance.onerror = event => {
      this.logger.error('Speech synthesis error', event);
      this.currentUtterance = null;
      this.isProcessing = false;
    };

    // Store current utterance and speak
    this.currentUtterance = utterance;
    this.speechSynthesis.speak(utterance);
  }
  stopSpeech() {
    if (this.currentUtterance) {
      this.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
    this.isProcessing = false;
  }
  handleError(error) {
    this.logger.error('Processing error:', error);
    this.isProcessing = false;
    // You could show an error notification here if needed
  }
}

// Initialize the content controller
const contentController = new ContentController();
/******/ })()
;
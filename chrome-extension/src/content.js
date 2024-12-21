// Content script for handling text selection and speech synthesis
import { createLogger } from './utils/logger';

class ContentController {
    constructor() {
        this.logger = createLogger('Content');
        this.isProcessing = false;
        this.selectedText = '';

        // Initialize message listeners
        this.initializeListeners();
    }

    initializeListeners() {
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'processingComplete') {
                this.handleProcessingComplete(message);
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
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + Shift + S to start/stop speech
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
                event.preventDefault();
                if (this.isProcessing) {
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

    stopSpeech() {
        this.logger.info('Stopping speech');
        chrome.runtime.sendMessage({ type: 'stopSpeech' });
        this.isProcessing = false;
    }

    handleProcessingComplete(message) {
        if (message.success) {
            this.logger.success('Text processing completed');
        } else {
            this.logger.error('Text processing failed', message.error);
        }
        this.isProcessing = false;
    }
}

// Initialize the content controller
const contentController = new ContentController();

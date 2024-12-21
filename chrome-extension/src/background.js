// Background script for handling text-to-speech processing
import TextProcessorWorker from './textProcessorWorker';

class BackgroundController {
    constructor() {
        this.textProcessor = new TextProcessorWorker();
        this.currentTabId = null;
        this.isProcessing = false;
        this.queue = [];

        // Initialize listeners
        this.initializeListeners();
    }

    initializeListeners() {
        // Listen for messages from content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'processText') {
                this.handleProcessText(request, sender.tab.id);
                return true; // Will respond asynchronously
            } else if (request.type === 'stopSpeech') {
                this.handleStopSpeech();
                sendResponse({ success: true });
            } else if (request.type === 'pauseSpeech') {
                this.handlePauseSpeech();
                sendResponse({ success: true });
            } else if (request.type === 'resumeSpeech') {
                this.handleResumeSpeech();
                sendResponse({ success: true });
            } else if (request.type === 'updateOptions') {
                this.handleUpdateOptions(request.options);
                sendResponse({ success: true });
            }
        });

        // Handle tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
            if (changeInfo.status === 'complete' && tabId === this.currentTabId) {
                this.handleStopSpeech();
            }
        });

        // Handle tab removal
        chrome.tabs.onRemoved.addListener((tabId) => {
            if (tabId === this.currentTabId) {
                this.handleStopSpeech();
            }
        });
    }

    async handleProcessText(request, tabId) {
        try {
            // Update current tab
            this.currentTabId = tabId;

            // Add to queue if currently processing
            if (this.isProcessing) {
                this.queue.push({ text: request.text, options: request.options });
                return;
            }

            this.isProcessing = true;

            // Process the text
            await this.textProcessor.processText(request.text, request.options);

            // Send success message to content script
            chrome.tabs.sendMessage(tabId, {
                type: 'processingComplete',
                success: true
            });

            // Process next in queue if any
            this.isProcessing = false;
            if (this.queue.length > 0) {
                const next = this.queue.shift();
                this.handleProcessText({ text: next.text, options: next.options }, tabId);
            }

        } catch (error) {
            console.error('Error processing text:', error);
            
            // Send error message to content script
            chrome.tabs.sendMessage(tabId, {
                type: 'processingComplete',
                success: false,
                error: error.message
            });

            this.isProcessing = false;
        }
    }

    handleStopSpeech() {
        this.textProcessor.stop();
        this.queue = [];
        this.isProcessing = false;
    }

    handlePauseSpeech() {
        this.textProcessor.pause();
    }

    handleResumeSpeech() {
        this.textProcessor.resume();
    }

    handleUpdateOptions(options) {
        this.textProcessor.setOptions(options);
    }
}

// Initialize the background controller
const backgroundController = new BackgroundController();

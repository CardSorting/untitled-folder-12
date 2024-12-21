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
        this.createContextMenu();
    }

    createContextMenu() {
        chrome.contextMenus.create({
            id: 'readSelectedText',
            title: 'Read Selected Text',
            contexts: ['selection']
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'readSelectedText' && info.selectionText) {
                this.handleProcessText({
                    type: 'processText',
                    text: info.selectionText,
                    options: { language: 'en' }
                }, tab.id);
            }
        });
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
            const processedText = await this.textProcessor.processText(request.text, request.options);
            
            // Send the processed text back to content script for speech synthesis
            chrome.tabs.sendMessage(tabId, {
                type: 'speakText',
                text: processedText,
                options: request.options
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
                type: 'processingError',
                error: error.message
            });

            this.isProcessing = false;
        }
    }

    handleStopSpeech() {
        if (this.currentTabId) {
            chrome.tabs.sendMessage(this.currentTabId, { type: 'stopSpeech' });
        }
        this.queue = [];
        this.isProcessing = false;
    }
}

// Initialize the background controller
const backgroundController = new BackgroundController();

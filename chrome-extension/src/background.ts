// Background script for handling text-to-speech processing
import { createLogger, Logger } from './utils/logger';
import { celeryClient } from './utils/celeryClient';

interface TaskInfo {
    taskId: string;
    status: string;
    result?: any;
    error?: string;
}

interface ProcessTextRequest {
    type: 'processText';
    text: string;
    options: {
        rate?: number;
        pitch?: number;
        volume?: number;
        language?: string;
    };
}

class BackgroundController {
    private static instance: BackgroundController;
    private logger: Logger;
    private activeTasks: Map<number, string>; // Map of tabId -> taskId
    private taskCheckInterval: number;

    private constructor() {
        this.logger = createLogger('Background');
        this.activeTasks = new Map();
        this.taskCheckInterval = 1000; // Check task status every second

        // Initialize listeners
        this.initializeListeners();
        this.createContextMenu();
    }

    public static getInstance(): BackgroundController {
        if (!BackgroundController.instance) {
            BackgroundController.instance = new BackgroundController();
        }
        return BackgroundController.instance;
    }

    private createContextMenu(): void {
        chrome.contextMenus.create({
            id: 'readText',
            title: 'Read Selected Text',
            contexts: ['selection']
        }, () => {
            const error = chrome.runtime.lastError;
            if (error) {
                this.logger.error('Error creating context menu:', { error: error.message });
            }
        });
    }

    private initializeListeners(): void {
        // Listen for messages from content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (sender.tab?.id) {
                if (request.type === 'contentScriptReady') {
                    this.logger.info('Content script ready in tab:', { tabId: sender.tab.id });
                    return;
                }
                
                if (request.type === 'processText') {
                    this.handleProcessText(request, sender.tab.id)
                        .then(response => sendResponse(response))
                        .catch(error => sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' }));
                    return true; // Will respond asynchronously
                }
            }
            return false;
        });

        // Handle tab updates
        chrome.tabs.onUpdated.addListener((tabId: number, changeInfo) => {
            if (changeInfo.status === 'complete') {
                this.cleanupTasks(tabId);
            }
        });

        // Handle tab removal
        chrome.tabs.onRemoved.addListener((tabId: number) => {
            this.cleanupTasks(tabId);
        });
    }

    private async handleProcessText(request: ProcessTextRequest, tabId: number): Promise<TaskInfo> {
        try {
            const result = await celeryClient.processText(request.text, request.options);
            this.activeTasks.set(tabId, result.taskId);
            return result;
        } catch (error) {
            this.logger.error('Error processing text:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }

    private async pollTaskStatus(taskId: string): Promise<TaskInfo> {
        try {
            const status = await celeryClient.checkTaskStatus(taskId);
            return status;
        } catch (error) {
            this.logger.error('Error polling task status:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }

    private cleanupTasks(tabId: number): void {
        const taskId = this.activeTasks.get(tabId);
        if (taskId) {
            celeryClient.cancelTask(taskId).catch(error => {
                this.logger.error('Error canceling task:', { error: error instanceof Error ? error.message : 'Unknown error' });
            });
            this.activeTasks.delete(tabId);
        }
    }

    private async notifyContentScript(tabId: number, message: any): Promise<void> {
        try {
            await chrome.tabs.sendMessage(tabId, message);
        } catch (error: unknown) {
            // If the content script is not ready, retry after a short delay
            if (error instanceof Error && error.message.includes('Receiving end does not exist')) {
                await new Promise(resolve => setTimeout(resolve, 100));
                return this.notifyContentScript(tabId, message);
            }
            this.logger.error('Error notifying content script:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
}

// Export singleton instance
export const backgroundController = BackgroundController.getInstance();

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'readText' && tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            type: 'readSelectedText',
            text: info.selectionText
        });
    }
});

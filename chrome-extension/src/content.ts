// Content script for handling text selection and TTS
import { createLogger } from './utils/logger';
import { messagingManager } from './utils/messaging';
import { 
    ContentScriptReadyMessage,
    ProcessTextMessage,
    ContextMenuActionMessage,
    ContentScriptReadyResponse,
    ProcessTextResponse,
    ContextMenuActionResponse,
    BaseErrorResponse
} from './types/messages';

const logger = createLogger('Content');

// Type guard for process text success response
function isProcessTextSuccessResponse(response: any): response is Extract<ProcessTextResponse, { status: 'processing' | 'completed' }> {
    return response && 
           typeof response === 'object' && 
           ('status' in response) &&
           (response.status === 'processing' || response.status === 'completed') &&
           'taskId' in response &&
           typeof response.taskId === 'string';
}

// Type guard for error response
function isErrorResponse(response: any): response is BaseErrorResponse {
    return response && 
           typeof response === 'object' && 
           'status' in response &&
           response.status === 'error' &&
           'error' in response &&
           'code' in response;
}

// Safe debug info type
type SafeDebugInfo = {
    [key: string]: string | number | boolean | null | SafeDebugInfo;
};

// Convert unknown error to safe debug info
function toSafeDebugInfo(error: unknown): SafeDebugInfo {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack || 'No stack trace'
        };
    }
    return {
        error: String(error)
    };
}

// Function to handle text selection
async function handleTextSelection(text: string): Promise<ContextMenuActionResponse> {
    try {
        logger.info('Processing selected text');

        const response = await messagingManager.sendMessage({
            type: 'processText',
            text
        } as ProcessTextMessage);

        if (isErrorResponse(response)) {
            return {
                status: 'error',
                error: response.error,
                code: response.code,
                debug: response.debug || {}
            };
        }

        if (!isProcessTextSuccessResponse(response)) {
            return {
                status: 'error',
                error: 'Invalid response from server',
                code: 'INVALID_RESPONSE',
                debug: { response: JSON.stringify(response) }
            };
        }

        return {
            status: 'processing',
            taskId: response.taskId,
            debug: response.debug || {}
        };
    } catch (error) {
        const debugInfo = toSafeDebugInfo(error);
        logger.error('Error handling text selection', debugInfo);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SELECTION_ERROR',
            debug: debugInfo
        };
    }
}

// Initialize content script
async function initializeContentScript(): Promise<void> {
    try {
        // Send ready message to background script
        const response = await messagingManager.sendMessage({
            type: 'contentScriptReady'
        } as ContentScriptReadyMessage);

        if (isErrorResponse(response)) {
            const debugInfo = {
                error: response.error,
                code: response.code,
                debug: response.debug || {}
            };
            logger.error('Failed to initialize content script', debugInfo);
            return;
        }

        logger.info('Content script initialized', response.debug || {});

        // Listen for context menu actions
        chrome.runtime.onMessage.addListener(async (
            message: ContextMenuActionMessage,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response: ContextMenuActionResponse) => void
        ) => {
            if (message.type === 'contextMenuAction') {
                try {
                    if (!message.text) {
                        const errorResponse: BaseErrorResponse = {
                            status: 'error',
                            error: 'No text provided',
                            code: 'INVALID_INPUT',
                            debug: { messageType: message.type }
                        };
                        sendResponse(errorResponse);
                        return true;
                    }

                    const response = await handleTextSelection(message.text);
                    if (isErrorResponse(response)) {
                        const debugInfo = {
                            error: response.error,
                            code: response.code,
                            debug: response.debug || {}
                        };
                        logger.error('Error processing text', debugInfo);
                    } else {
                        logger.info('Text processing started', {
                            taskId: response.taskId,
                            debug: response.debug || {}
                        });
                    }
                    sendResponse(response);
                } catch (error) {
                    const debugInfo = toSafeDebugInfo(error);
                    logger.error('Error in context menu handler', debugInfo);
                    const errorResponse: BaseErrorResponse = {
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Unknown error',
                        code: 'CONTEXT_MENU_ERROR',
                        debug: debugInfo
                    };
                    sendResponse(errorResponse);
                }
                return true; // Keep the message channel open for async response
            }
            return true;
        });

    } catch (error) {
        const debugInfo = toSafeDebugInfo(error);
        logger.error('Error initializing content script', debugInfo);
    }
}

// Initialize the content script
initializeContentScript();

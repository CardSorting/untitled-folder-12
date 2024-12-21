// Background script for handling text-to-speech processing
import { createLogger } from './utils/logger';
import { initManager } from './utils/initUtils';
import { messagingManager } from './utils/messaging';
import { contextMenuManager } from './utils/contextMenu';
import { textProcessingManager } from './utils/textProcessor';
import { StorageService } from './services/storage';
import { errorHandler, InitializationError, ProcessingError } from './utils/errorHandler';
import { 
    ContentScriptReadyMessage,
    ProcessTextMessage,
    GetDebugInfoMessage,
    ExtensionMessage,
    ExtensionResponse,
    ContentScriptReadyResponse,
    ProcessTextResponse,
    GetDebugInfoResponse,
    BaseErrorResponse
} from './types/messages';

const logger = createLogger('Background');
const storageService = StorageService.getInstance();

// Initialize the extension
async function initializeExtension(details?: chrome.runtime.InstalledDetails) {
    try {
        // Ensure we're in a service worker context
        if (!chrome.runtime.id) {
            throw new InitializationError('Extension ID not available', {
                code: 'INVALID_CONTEXT'
            });
        }

        logger.info('Initializing extension', { details: details || {} });
        
        // Initialize core services
        await Promise.all([
            storageService.getSettings(), 
            contextMenuManager.createContextMenu({
                id: 'readSelectedText',
                title: 'Read Selected Text',
                contexts: ['selection']
            }),
            textProcessingManager.setup() 
        ]);

        logger.info('Extension initialized successfully', { status: 'success' });
    } catch (error) {
        logger.error('Failed to initialize extension', { error: error as Error });
        throw error;
    }
}

// Service Worker activation
self.addEventListener('activate', (event) => {
    logger.info('Service worker activated');
});

// Listen for extension installation/update
chrome.runtime.onInstalled.addListener(async (details) => {
    await initializeExtension(details);
});

// Listen for startup
chrome.runtime.onStartup.addListener(async () => {
    await initializeExtension();
});

// Handle unhandled errors and rejections
window.addEventListener('error', (event: ErrorEvent) => {
    errorHandler.handleError(event.error, { 
        source: 'window.error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    errorHandler.handleError(event.reason, { 
        source: 'unhandledrejection',
        message: event.reason?.message || 'Unknown promise rejection'
    });
});

// Initialize extension
async function setupMessageHandlers() {
    // Handle content script ready message
    messagingManager.registerHandler<'contentScriptReady'>(
        'contentScriptReady', 
        async (message): Promise<ContentScriptReadyResponse> => {
            try {
                await errorHandler.checkRuntimeHealth();
                logger.info('Content script ready');
                return { 
                    status: 'acknowledged',
                    debug: initManager.debugInfo()
                };
            } catch (error) {
                const { error: errorMessage, code, debug } = errorHandler.getErrorResponse(error);
                return {
                    status: 'error',
                    error: errorMessage,
                    code,
                    debug
                };
            }
        }
    );

    // Handle text processing request
    messagingManager.registerHandler<'processText'>(
        'processText',
        async (message): Promise<ProcessTextResponse> => {
            try {
                await errorHandler.checkRuntimeHealth();

                if (!initManager.isInitialized('background')) {
                    throw new InitializationError('Background script not fully initialized', {
                        code: 'INVALID_STATE'
                    });
                }

                // Get current TTS settings
                const ttsSettings = await storageService.getTTSSettings();

                // Merge settings with request options
                const options = {
                    ...ttsSettings,
                    ...message.options
                };

                const result = await textProcessingManager.processText(message.text, options);
                
                if (!result || !result.taskId) {
                    throw new ProcessingError('Failed to process text', {
                        code: 'PROCESSING_ERROR',
                        data: { text: message.text }
                    });
                }

                return {
                    status: 'processing',
                    taskId: result.taskId,
                    debug: initManager.debugInfo()
                };
            } catch (error) {
                const { error: errorMessage, code, debug } = errorHandler.getErrorResponse(error);
                return {
                    status: 'error',
                    error: errorMessage,
                    code,
                    debug
                };
            }
        }
    );

    // Handle debug info request
    messagingManager.registerHandler<'getDebugInfo'>(
        'getDebugInfo',
        async (): Promise<GetDebugInfoResponse> => {
            try {
                await errorHandler.checkRuntimeHealth();
                const manifest = chrome.runtime.getManifest();
                
                return {
                    extensionId: chrome.runtime.id,
                    manifestVersion: manifest.manifest_version,
                    permissions: manifest.permissions || [],
                    hostPermissions: manifest.host_permissions || [],
                    timestamp: Date.now(),
                    debug: initManager.debugInfo()
                };
            } catch (error) {
                const { error: errorMessage, code, debug } = errorHandler.getErrorResponse(error);
                return {
                    extensionId: 'unavailable',
                    manifestVersion: 3,
                    permissions: [],
                    hostPermissions: [],
                    timestamp: Date.now(),
                    error: errorMessage,
                    code,
                    debug
                };
            }
        }
    );
}

// Set up message handlers after initialization
initializeExtension().then(() => {
    setupMessageHandlers();
});

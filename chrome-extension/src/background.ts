// Background script for handling text-to-speech processing
import { createLogger } from './utils/logger';
import { initManager } from './utils/initUtils';
import { messagingManager } from './utils/messaging';
import { contextMenuManager } from './utils/contextMenu';
import { textProcessingManager } from './utils/textProcessor';
import { StorageService } from './services/storage';
import { 
    ContentScriptReadyMessage,
    ProcessTextMessage,
    GetDebugInfoMessage,
    ExtensionMessage,
    ExtensionResponse,
    ContentScriptReadyResponse,
    ProcessTextResponse,
    GetDebugInfoResponse
} from './types/messages';

const logger = createLogger('Background');
const storageService = StorageService.getInstance();

// Initialize extension
async function initializeExtension() {
    try {
        // Check permissions
        const permissions = await initManager.checkPermissions();
        const hostPermissions = await initManager.validateHostPermissions();

        logger.info('Permissions status:', { permissions, hostPermissions });

        // Create context menu
        await contextMenuManager.createMenu({
            id: 'readText',
            title: 'Read Selected Text',
            contexts: ['selection']
        });

        // Register message handlers
        setupMessageHandlers();

        // Load initial settings
        await storageService.getSettings();

        // Mark background script as initialized
        initManager.markInitialized('background', {
            contextMenu: true,
            permissions,
            hostPermissions
        });

        logger.info('Extension initialized successfully');
    } catch (error) {
        initManager.markError('background', error instanceof Error ? error : 'Unknown error');
        logger.error('Failed to initialize extension:', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

function setupMessageHandlers() {
    // Handle content script ready message
    messagingManager.registerHandler<'contentScriptReady'>(
        'contentScriptReady', 
        async (message): Promise<ContentScriptReadyResponse> => {
            logger.info('Content script ready');
            return { 
                status: 'acknowledged',
                debug: initManager.debugInfo()
            };
        }
    );

    // Handle text processing request
    messagingManager.registerHandler<'processText'>(
        'processText',
        async (message): Promise<ProcessTextResponse> => {
            if (!initManager.isInitialized('background')) {
                return { 
                    status: 'error',
                    error: 'Background script not fully initialized',
                    debug: initManager.debugInfo()
                };
            }

            try {
                // Get current TTS settings
                const ttsSettings = await storageService.getTTSSettings();

                // Merge settings with request options
                const options = {
                    ...ttsSettings,
                    ...message.options
                };

                const result = await textProcessingManager.processText(message.text, options);
                return {
                    ...result,
                    status: 'processing'
                };
            } catch (error) {
                logger.error('Error processing text:', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                return {
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    debug: initManager.debugInfo()
                };
            }
        }
    );

    // Handle debug info request
    messagingManager.registerHandler<'getDebugInfo'>(
        'getDebugInfo',
        async (): Promise<GetDebugInfoResponse> => {
            return {
                ...initManager.debugInfo(),
                extensionId: chrome.runtime.id,
                manifestVersion: chrome.runtime.getManifest().manifest_version,
                permissions: chrome.runtime.getManifest().permissions || [],
                hostPermissions: chrome.runtime.getManifest().host_permissions || [],
                timestamp: Date.now()
            };
        }
    );
}

// Initialize the extension
initializeExtension();

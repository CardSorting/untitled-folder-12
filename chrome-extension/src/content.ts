// Content script for handling text selection and speech synthesis
import { createLogger } from './utils/logger';
import { initManager } from './utils/initUtils';
import { messagingManager } from './utils/messaging';
import { StorageService } from './services/storage';
import { SpeechService } from './services/speech';
import { 
    ContextMenuActionMessage,
    ProcessTextMessage,
    ExtensionMessage,
    ContentScriptReadyResponse,
    ProcessTextResponse,
    ContextMenuActionResponse
} from './types/messages';

const logger = createLogger('Content');
const storageService = StorageService.getInstance();
const speechService = SpeechService.getInstance();

// Initialize content script
async function initializeContentScript() {
    try {
        // Initialize services
        await Promise.all([
            storageService.getSettings(),
            speechService.getVoices()
        ]);

        // Initialize event listeners
        setupEventListeners();

        // Register message handlers
        setupMessageHandlers();

        // Signal content script is ready
        const response = await messagingManager.sendMessage<'contentScriptReady'>({ 
            type: 'contentScriptReady' 
        });
        logger.info('Content script ready signal acknowledged:', response);

        // Mark content script as initialized
        initManager.markInitialized('content', {
            url: window.location.href,
            voices: speechService.getVoices().length,
            documentLang: document.documentElement.lang
        });

        logger.info('Content script initialized successfully');
    } catch (error) {
        initManager.markError('content', error instanceof Error ? error : 'Unknown error');
        logger.error('Failed to initialize content script:', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

function setupEventListeners() {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('keyup', handleKeyboardShortcuts);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
}

function setupMessageHandlers() {
    messagingManager.registerHandler<'contextMenuAction'>(
        'contextMenuAction',
        async (message): Promise<ContextMenuActionResponse> => {
            if (!initManager.isInitialized('content')) {
                return {
                    error: 'Content script not fully initialized',
                    debug: initManager.debugInfo()
                };
            }

            if (message.menuId === 'readText' && message.text) {
                try {
                    const settings = await storageService.getTTSSettings();
                    const processMessage: ProcessTextMessage = {
                        type: 'processText',
                        text: message.text,
                        options: settings
                    };

                    const response = await messagingManager.sendMessage<'processText'>(processMessage);
                    const processResponse = response as ProcessTextResponse;
                    logger.info('Text processing response:', processResponse);

                    if (processResponse.taskId && !processResponse.error) {
                        // Start speech synthesis with current settings
                        await speechService.speak(message.text, settings);
                        return { 
                            status: 'processing',
                            taskId: processResponse.taskId
                        };
                    }

                    return {
                        error: processResponse.error || 'Failed to process text',
                        debug: initManager.debugInfo()
                    };
                } catch (error) {
                    logger.error('Error processing text:', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        debug: initManager.debugInfo()
                    });
                    return {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        debug: initManager.debugInfo()
                    };
                }
            }

            return { error: 'Invalid menu action' };
        }
    );
}

// Event handlers
function handleTextSelection(event: MouseEvent): void {
    const selection = window.getSelection();
    if (selection) {
        const selectedText = selection.toString().trim();
        if (selectedText) {
            logger.debug('Text selected:', { length: selectedText.length });
        }
    }
}

async function handleKeyboardShortcuts(event: KeyboardEvent): Promise<void> {
    // Handle keyboard shortcuts
    if (event.ctrlKey && event.key === 'r') {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            try {
                const settings = await storageService.getTTSSettings();
                const response = await messagingManager.sendMessage<'processText'>({
                    type: 'processText',
                    text: selection.toString().trim(),
                    options: settings
                });
                const processResponse = response as ProcessTextResponse;
                
                if (processResponse.taskId && !processResponse.error) {
                    await speechService.speak(selection.toString().trim(), settings);
                } else {
                    logger.error('Error processing text:', {
                        error: processResponse.error || 'Unknown error'
                    });
                }
            } catch (error) {
                logger.error('Error processing keyboard shortcut:', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
}

function handleVisibilityChange(): void {
    const isHidden = document.hidden;
    logger.debug('Visibility changed:', { hidden: isHidden });

    if (isHidden && speechService.isSpeaking()) {
        speechService.pause();
    } else if (!isHidden && speechService.isPaused()) {
        speechService.resume();
    }
}

function handleBeforeUnload(): void {
    logger.debug('Page unloading');
    speechService.stop();
}

// Initialize the content script
initializeContentScript();

import { createLogger } from './logger';
import { initManager } from './initUtils';
import { 
    ExtensionMessage, 
    ExtensionResponse,
    MessageType,
    ContentScriptReadyMessage,
    ProcessTextMessage,
    ContextMenuActionMessage,
    UpdateSettingsMessage,
    TaskStatusMessage,
    GetDebugInfoMessage
} from '../types/messages';

const logger = createLogger('Messaging');

type MessageTypeMap = {
    'contentScriptReady': ContentScriptReadyMessage;
    'processText': ProcessTextMessage;
    'contextMenuAction': ContextMenuActionMessage;
    'updateSettings': UpdateSettingsMessage;
    'taskStatus': TaskStatusMessage;
    'getDebugInfo': GetDebugInfoMessage;
}

type MessageHandler<T extends MessageType> = (
    message: MessageTypeMap[T],
    sender: chrome.runtime.MessageSender
) => Promise<ExtensionResponse>;

class MessagingManager {
    private static instance: MessagingManager;
    private handlers: Map<MessageType, MessageHandler<any>>;

    private constructor() {
        this.handlers = new Map();
        this.setupMessageListener();
    }

    public static getInstance(): MessagingManager {
        if (!MessagingManager.instance) {
            MessagingManager.instance = new MessagingManager();
        }
        return MessagingManager.instance;
    }

    private setupMessageListener(): void {
        chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
            logger.debug('Received message:', { type: message.type, sender: sender.id });

            const handler = this.handlers.get(message.type);
            if (!handler) {
                logger.warn('No handler registered for message type:', { type: message.type });
                sendResponse({ 
                    error: `No handler for message type: ${message.type}`,
                    debug: initManager.debugInfo()
                });
                return false;
            }

            handler(message as any, sender)
                .then(response => {
                    logger.debug('Handler response:', { type: message.type, response });
                    sendResponse(response);
                })
                .catch(error => {
                    logger.error('Handler error:', { 
                        type: message.type, 
                        error: error instanceof Error ? error.message : 'Unknown error' 
                    });
                    sendResponse({ 
                        error: error instanceof Error ? error.message : 'Unknown error',
                        debug: initManager.debugInfo()
                    });
                });

            return true; // Will respond asynchronously
        });
    }

    public registerHandler<T extends MessageType>(
        type: T,
        handler: MessageHandler<T>
    ): void {
        this.handlers.set(type, handler);
        logger.debug('Registered handler for message type:', { type });
    }

    public async sendMessage<T extends MessageType>(
        message: MessageTypeMap[T]
    ): Promise<ExtensionResponse> {
        try {
            logger.debug('Sending message:', { type: message.type });
            const response = await chrome.runtime.sendMessage(message);
            logger.debug('Message response:', { type: message.type, response });
            return response;
        } catch (error) {
            logger.error('Error sending message:', { 
                type: message.type,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public async sendTabMessage<T extends MessageType>(
        tabId: number,
        message: MessageTypeMap[T]
    ): Promise<ExtensionResponse> {
        try {
            logger.debug('Sending tab message:', { tabId, type: message.type });
            const response = await chrome.tabs.sendMessage(tabId, message);
            logger.debug('Tab message response:', { tabId, type: message.type, response });
            return response;
        } catch (error) {
            logger.error('Error sending tab message:', {
                tabId,
                type: message.type,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}

export const messagingManager = MessagingManager.getInstance();

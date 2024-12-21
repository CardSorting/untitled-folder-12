import { createLogger } from './logger';
import { messagingManager } from './messaging';
import { ContextMenuActionMessage } from '../types/messages';
import { LogContext } from './logger';

interface ContextMenuConfig extends LogContext {
    id: string;
    title: string;
    contexts: chrome.contextMenus.ContextType[];
    [key: string]: any;
}

const logger = createLogger('ContextMenu');

export class ContextMenuManager {
    private static instance: ContextMenuManager;
    private menuItems: Map<string, ContextMenuConfig>;

    private constructor() {
        this.menuItems = new Map();
    }

    public static getInstance(): ContextMenuManager {
        if (!ContextMenuManager.instance) {
            ContextMenuManager.instance = new ContextMenuManager();
        }
        return ContextMenuManager.instance;
    }

    public createContextMenu(config: ContextMenuConfig): void {
        try {
            chrome.contextMenus.create({
                id: config.id,
                title: config.title,
                contexts: config.contexts,
            }, () => {
                if (chrome.runtime.lastError) {
                    logger.error('Error creating context menu', { 
                        error: chrome.runtime.lastError.message,
                        config 
                    });
                } else {
                    this.menuItems.set(config.id, config);
                    logger.info('Context menu created', { id: config.id });
                }
            });
        } catch (error) {
            logger.error('Error creating context menu', { 
                error: error instanceof Error ? error.message : String(error),
                config 
            });
            throw error;
        }
    }

    public removeContextMenu(id: string): void {
        try {
            chrome.contextMenus.remove(id, () => {
                if (chrome.runtime.lastError) {
                    logger.error('Error removing context menu', { 
                        error: chrome.runtime.lastError.message,
                        id 
                    });
                } else {
                    this.menuItems.delete(id);
                    logger.info('Context menu removed', { id });
                }
            });
        } catch (error) {
            logger.error('Error removing context menu', { 
                error: error instanceof Error ? error.message : String(error),
                id 
            });
            throw error;
        }
    }

    public getContextMenu(id: string): ContextMenuConfig | undefined {
        return this.menuItems.get(id);
    }

    public getAllContextMenus(): ContextMenuConfig[] {
        return Array.from(this.menuItems.values());
    }

    public handleContextMenuClick(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined): void {
        try {
            const menuItem = this.getContextMenu(info.menuItemId.toString());
            if (!menuItem) {
                logger.error('Context menu not found', { menuItemId: info.menuItemId });
                return;
            }

            if (!tab || !tab.id) {
                logger.error('Invalid tab', { tab });
                return;
            }

            const message: ContextMenuActionMessage = {
                type: 'contextMenuAction',
                menuId: info.menuItemId.toString(),
                text: info.selectionText || ''
            };

            messagingManager.sendMessage(message).catch(error => {
                logger.error('Error sending context menu message', { 
                    error: error instanceof Error ? error.message : String(error),
                    message 
                });
            });
        } catch (error) {
            logger.error('Error handling context menu click', { 
                error: error instanceof Error ? error.message : String(error),
                info 
            });
        }
    }
}

export const contextMenuManager = ContextMenuManager.getInstance();

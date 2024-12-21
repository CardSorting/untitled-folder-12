import { createLogger } from './logger';
import { initManager } from './initUtils';
import { messagingManager } from './messaging';
import { ContextMenuConfig } from '../types/settings';
import { ContextMenuActionMessage } from '../types/messages';

const logger = createLogger('ContextMenu');

class ContextMenuManager {
    private static instance: ContextMenuManager;
    private menus: Map<string, ContextMenuConfig>;

    private constructor() {
        this.menus = new Map();
        this.setupClickListener();
    }

    public static getInstance(): ContextMenuManager {
        if (!ContextMenuManager.instance) {
            ContextMenuManager.instance = new ContextMenuManager();
        }
        return ContextMenuManager.instance;
    }

    private setupClickListener(): void {
        chrome.contextMenus.onClicked.addListener(async (info, tab) => {
            if (!tab?.id || !info.menuItemId || !info.selectionText) {
                logger.warn('Invalid context menu click:', { info, tabId: tab?.id });
                return;
            }

            try {
                const message: ContextMenuActionMessage = {
                    type: 'contextMenuAction',
                    menuId: info.menuItemId.toString(),
                    text: info.selectionText
                };

                await messagingManager.sendTabMessage(tab.id, message);
            } catch (error) {
                logger.error('Error handling context menu click:', {
                    menuId: info.menuItemId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    debug: initManager.debugInfo()
                });
            }
        });
    }

    public async createMenu(config: ContextMenuConfig): Promise<void> {
        try {
            await new Promise<void>((resolve, reject) => {
                chrome.contextMenus.create({
                    id: config.id,
                    title: config.title,
                    contexts: config.contexts
                }, () => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        reject(new Error(error.message));
                    } else {
                        resolve();
                    }
                });
            });

            this.menus.set(config.id, config);
            logger.info('Created context menu:', config);
        } catch (error) {
            logger.error('Error creating context menu:', {
                config,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public async removeMenu(menuId: string): Promise<void> {
        try {
            await new Promise<void>((resolve, reject) => {
                chrome.contextMenus.remove(menuId, () => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        reject(new Error(error.message));
                    } else {
                        resolve();
                    }
                });
            });

            this.menus.delete(menuId);
            logger.info('Removed context menu:', { menuId });
        } catch (error) {
            logger.error('Error removing context menu:', {
                menuId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public getMenu(menuId: string): ContextMenuConfig | undefined {
        return this.menus.get(menuId);
    }

    public getAllMenus(): ContextMenuConfig[] {
        return Array.from(this.menus.values());
    }
}

export const contextMenuManager = ContextMenuManager.getInstance();

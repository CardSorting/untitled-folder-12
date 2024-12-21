import { createLogger, Logger } from './logger';

interface InitStatus {
    initialized: boolean;
    error?: string;
    timestamp: number;
    context: string;
    details?: Record<string, any>;
}

class InitializationManager {
    private static instance: InitializationManager;
    private logger: Logger;
    private initStatus: Map<string, InitStatus>;
    private readyCallbacks: Map<string, Array<() => void>>;

    private constructor() {
        this.logger = createLogger('InitManager');
        this.initStatus = new Map();
        this.readyCallbacks = new Map();
        
        // Listen for extension lifecycle events
        this.setupExtensionListeners();
    }

    public static getInstance(): InitializationManager {
        if (!InitializationManager.instance) {
            InitializationManager.instance = new InitializationManager();
        }
        return InitializationManager.instance;
    }

    private setupExtensionListeners(): void {
        // Listen for extension install/update events
        chrome.runtime.onInstalled.addListener((details) => {
            this.logEvent('onInstalled', {
                reason: details.reason,
                previousVersion: details.previousVersion,
                id: details.id
            });
        });

        // Listen for extension startup
        if (chrome.runtime.onStartup) {
            chrome.runtime.onStartup.addListener(() => {
                this.logEvent('onStartup');
            });
        }
    }

    public markInitialized(context: string, details?: Record<string, any>): void {
        const status: InitStatus = {
            initialized: true,
            timestamp: Date.now(),
            context,
            details
        };
        this.initStatus.set(context, status);
        this.logger.info(`${context} initialized`, status);

        // Trigger any waiting callbacks
        const callbacks = this.readyCallbacks.get(context) || [];
        callbacks.forEach(callback => callback());
        this.readyCallbacks.delete(context);
    }

    public markError(context: string, error: Error | string, details?: Record<string, any>): void {
        const status: InitStatus = {
            initialized: false,
            error: error instanceof Error ? error.message : error,
            timestamp: Date.now(),
            context,
            details
        };
        this.initStatus.set(context, status);
        this.logger.error(`${context} initialization failed`, status);
    }

    public isInitialized(context: string): boolean {
        const status = this.initStatus.get(context);
        return status?.initialized || false;
    }

    public getStatus(context: string): InitStatus | undefined {
        return this.initStatus.get(context);
    }

    public getAllStatus(): Record<string, InitStatus> {
        const status: Record<string, InitStatus> = {};
        this.initStatus.forEach((value, key) => {
            status[key] = value;
        });
        return status;
    }

    public async waitForInitialization(context: string, timeout: number = 5000): Promise<boolean> {
        if (this.isInitialized(context)) {
            return true;
        }

        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                this.logger.warn(`Initialization timeout for ${context}`);
                resolve(false);
            }, timeout);

            const callback = () => {
                clearTimeout(timeoutId);
                resolve(true);
            };

            const callbacks = this.readyCallbacks.get(context) || [];
            callbacks.push(callback);
            this.readyCallbacks.set(context, callbacks);
        });
    }

    public logEvent(event: string, details?: Record<string, any>): void {
        this.logger.info(`Extension event: ${event}`, {
            event,
            timestamp: Date.now(),
            ...details
        });
    }

    public async checkPermissions(): Promise<Record<string, boolean>> {
        const permissions = [
            'activeTab',
            'contextMenus',
            'scripting',
            'storage',
            'tabs'
        ];

        const results: Record<string, boolean> = {};
        
        for (const permission of permissions) {
            try {
                const granted = await chrome.permissions.contains({ permissions: [permission] });
                results[permission] = granted;
            } catch (error) {
                this.logger.error(`Error checking permission ${permission}:`, { 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
                results[permission] = false;
            }
        }

        return results;
    }

    public async validateHostPermissions(): Promise<Record<string, boolean>> {
        const hosts = [
            'http://localhost:*/*',
            'http://127.0.0.1:*/*'
        ];

        const results: Record<string, boolean> = {};
        
        for (const host of hosts) {
            try {
                const granted = await chrome.permissions.contains({ origins: [host] });
                results[host] = granted;
            } catch (error) {
                this.logger.error(`Error checking host permission ${host}:`, {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                results[host] = false;
            }
        }

        return results;
    }

    public debugInfo(): Record<string, any> {
        return {
            initStatus: this.getAllStatus(),
            extensionId: chrome.runtime.id,
            manifestVersion: chrome.runtime.getManifest().manifest_version,
            permissions: chrome.runtime.getManifest().permissions,
            hostPermissions: chrome.runtime.getManifest().host_permissions,
            timestamp: Date.now()
        };
    }
}

export const initManager = InitializationManager.getInstance();

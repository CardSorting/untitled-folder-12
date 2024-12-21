// Error handling utility
import { createLogger } from './logger';
import { initManager } from './initUtils';

const logger = createLogger('ErrorHandler');

// Custom error types
export class ExtensionError extends Error {
    public readonly code: string;
    public readonly context: Record<string, any>;

    constructor(message: string, code: string, context: Record<string, any> = {}) {
        super(message);
        this.name = 'ExtensionError';
        this.code = code;
        this.context = context;
    }
}

export class InitializationError extends ExtensionError {
    constructor(message: string, context: Record<string, any> = {}) {
        super(message, 'INIT_ERROR', context);
        this.name = 'InitializationError';
    }
}

export class PermissionError extends ExtensionError {
    constructor(message: string, context: Record<string, any> = {}) {
        super(message, 'PERMISSION_ERROR', context);
        this.name = 'PermissionError';
    }
}

export class RuntimeError extends ExtensionError {
    constructor(message: string, context: Record<string, any> = {}) {
        super(message, 'RUNTIME_ERROR', context);
        this.name = 'RuntimeError';
    }
}

export class ProcessingError extends ExtensionError {
    constructor(message: string, context: Record<string, any> = {}) {
        super(message, 'PROCESSING_ERROR', context);
        this.name = 'ProcessingError';
    }
}

// Error handler class
export class ErrorHandler {
    private static instance: ErrorHandler;

    private constructor() {}

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    public handleError(error: unknown, context: Record<string, any> = {}): {
        message: string;
        code: string;
        context: Record<string, any>;
    } {
        let errorMessage: string;
        let errorCode: string;
        let errorContext: Record<string, any> = {
            ...context,
            timestamp: Date.now(),
            runtimeAvailable: !!chrome.runtime,
            extensionId: chrome.runtime?.id,
            isInitialized: initManager.isInitialized('background')
        };

        if (error instanceof ExtensionError) {
            errorMessage = error.message;
            errorCode = error.code;
            errorContext = { ...errorContext, ...error.context };
        } else if (error instanceof Error) {
            errorMessage = error.message;
            errorCode = 'UNKNOWN_ERROR';
            errorContext = {
                ...errorContext,
                errorName: error.name,
                stack: error.stack
            };
        } else {
            errorMessage = String(error);
            errorCode = 'UNKNOWN_ERROR';
        }

        // Log the error
        logger.error('Error occurred:', {
            message: errorMessage,
            code: errorCode,
            context: errorContext
        });

        return {
            message: errorMessage,
            code: errorCode,
            context: errorContext
        };
    }

    public async checkRuntimeHealth(): Promise<void> {
        if (!chrome.runtime) {
            throw new RuntimeError('Chrome runtime not available');
        }

        if (!chrome.runtime.id) {
            throw new RuntimeError('Extension ID not available');
        }

        // Check if manifest is accessible
        try {
            const manifest = chrome.runtime.getManifest();
            if (!manifest) {
                throw new RuntimeError('Manifest not accessible');
            }
        } catch (error) {
            throw new RuntimeError('Failed to access manifest', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    public async validatePermissions(): Promise<void> {
        try {
            const permissions = await initManager.checkPermissions();
            const hostPermissions = await initManager.validateHostPermissions();

            if (!permissions || !hostPermissions) {
                throw new PermissionError('Required permissions not granted', {
                    permissions,
                    hostPermissions
                });
            }
        } catch (error) {
            if (error instanceof PermissionError) {
                throw error;
            }
            throw new PermissionError('Failed to validate permissions', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    public isRecoverable(error: unknown): boolean {
        if (error instanceof ExtensionError) {
            // Define which error types/codes are recoverable
            const recoverableCodes = ['PROCESSING_ERROR'];
            return recoverableCodes.includes(error.code);
        }
        return false;
    }

    public getErrorResponse(error: unknown): {
        error: string;
        code: string;
        debug: Record<string, any>;
    } {
        const { message, code, context } = this.handleError(error);
        return {
            error: message,
            code,
            debug: {
                ...initManager.debugInfo(),
                errorContext: context
            }
        };
    }
}

export const errorHandler = ErrorHandler.getInstance();

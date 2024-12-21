/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/config.ts":
/*!***********************!*\
  !*** ./src/config.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, exports) => {


// Configuration for the Chrome extension
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.config = void 0;
exports.config = {
    API_ENDPOINT: 'http://localhost:5001', // Default local development server
    celery: {
        timeout: 30000, // 30 seconds
        pollInterval: 1000, // 1 second
        maxRetries: 3
    },
    endpoints: {
        processText: '/process_text',
        taskStatus: '/task_status'
    }
};


/***/ }),

/***/ "./src/services/storage.ts":
/*!*********************************!*\
  !*** ./src/services/storage.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StorageService = void 0;
const logger_1 = __webpack_require__(/*! ../utils/logger */ "./src/utils/logger.ts");
const logger = (0, logger_1.createLogger)('Storage');
const DEFAULT_SETTINGS = {
    ttsSettings: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        autoResume: true,
        language: 'en'
    }
};
class StorageService {
    constructor() { }
    static getInstance() {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }
    async getSettings() {
        try {
            const result = await chrome.storage.local.get('settings');
            return result.settings || DEFAULT_SETTINGS;
        }
        catch (error) {
            logger.error('Error loading settings:', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return DEFAULT_SETTINGS;
        }
    }
    async updateSettings(settings) {
        try {
            const currentSettings = await this.getSettings();
            const newSettings = {
                ...currentSettings,
                ...settings,
                ttsSettings: {
                    ...currentSettings.ttsSettings,
                    ...(settings.ttsSettings || {})
                }
            };
            await chrome.storage.local.set({ settings: newSettings });
            logger.info('Settings updated successfully');
        }
        catch (error) {
            logger.error('Error saving settings:', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    async getTTSSettings() {
        const settings = await this.getSettings();
        return settings.ttsSettings;
    }
    async updateTTSSettings(settings) {
        const currentSettings = await this.getSettings();
        await this.updateSettings({
            ttsSettings: {
                ...currentSettings.ttsSettings,
                ...settings
            }
        });
    }
}
exports.StorageService = StorageService;


/***/ }),

/***/ "./src/utils/celeryClient.ts":
/*!***********************************!*\
  !*** ./src/utils/celeryClient.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.celeryClient = exports.CeleryClient = void 0;
// Celery client for handling text processing tasks
const logger_1 = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
const config_1 = __webpack_require__(/*! ../config */ "./src/config.ts");
const logger = (0, logger_1.createLogger)('CeleryClient');
class CeleryClient {
    constructor(baseUrl = config_1.config.API_ENDPOINT, pollInterval = 1000, maxRetries = 3) {
        this.baseUrl = baseUrl;
        this.taskQueue = new Map();
        this.pollInterval = pollInterval;
        this.maxRetries = maxRetries;
    }
    async processText(text, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${config_1.config.endpoints.processText}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    language: options.language || 'en-US',
                    voice: options.voice,
                    rate: options.rate,
                    pitch: options.pitch,
                    volume: options.volume,
                    emotionalContext: options.emotionalContext || {},
                    textStructure: options.textStructure || {}
                }),
            });
            if (!response.ok) {
                throw new Error(`Failed to process text: ${response.statusText}`);
            }
            const data = await response.json();
            const taskId = data.task_id;
            if (!taskId) {
                throw new Error('No task ID returned from server');
            }
            this.taskQueue.set(taskId, {
                id: taskId,
                name: 'processText',
                args: [text, options],
                status: 'PENDING',
                result: null,
                error: null,
                retries: 0,
            });
            logger.info('Text processing task submitted', { taskId });
            return taskId;
        }
        catch (error) {
            logger.error('Error processing text', { error: String(error) });
            throw error;
        }
    }
    async getTaskResult(taskId) {
        try {
            const response = await fetch(`${this.baseUrl}${config_1.config.endpoints.taskStatus}/${taskId}`);
            if (!response.ok) {
                throw new Error(`Failed to get task status: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                taskId,
                status: data.status,
                result: data.result,
                error: data.error || undefined,
                message: data.message
            };
        }
        catch (error) {
            logger.error('Error getting task result', { taskId, error: String(error) });
            throw error;
        }
    }
    async pollTaskStatus(taskId) {
        const task = this.taskQueue.get(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found in queue`);
        }
        try {
            const result = await this.getTaskResult(taskId);
            task.status = result.status;
            task.result = result.result;
            task.error = result.error || null;
            if (result.status === 'SUCCESS') {
                logger.info('Task completed successfully', {
                    taskId,
                    result: result.result ? JSON.stringify(result.result) : null
                });
                this.taskQueue.delete(taskId);
            }
            else if (result.status === 'FAILURE') {
                logger.error('Task failed', {
                    taskId,
                    error: result.error || 'Unknown error'
                });
                this.taskQueue.delete(taskId);
            }
            else {
                logger.info('Task status updated', {
                    taskId,
                    status: result.status
                });
            }
            return result;
        }
        catch (error) {
            task.retries++;
            if (task.retries >= this.maxRetries) {
                logger.error('Max retries reached', {
                    taskId,
                    error: error instanceof Error ? error.message : String(error),
                    retries: task.retries
                });
                this.taskQueue.delete(taskId);
                throw error;
            }
            logger.warn('Error polling task status, retrying', {
                taskId,
                retries: task.retries,
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                taskId,
                status: 'PENDING',
                result: null,
                error: undefined
            };
        }
    }
    getQueuedTasks() {
        return Array.from(this.taskQueue.values());
    }
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                signal: AbortSignal.timeout(5000) // Short timeout for health checks
            });
            return await response.json();
        }
        catch (error) {
            logger.error('Health check failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async cancelTask(taskId) {
        try {
            const response = await fetch(`${this.baseUrl}${config_1.config.endpoints.taskStatus}/${taskId}/cancel`, {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error(`Failed to cancel task: ${response.statusText}`);
            }
        }
        catch (error) {
            logger.error('Error canceling task', {
                taskId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
}
exports.CeleryClient = CeleryClient;
// Export singleton instance
exports.celeryClient = new CeleryClient();


/***/ }),

/***/ "./src/utils/contextMenu.ts":
/*!**********************************!*\
  !*** ./src/utils/contextMenu.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.contextMenuManager = exports.ContextMenuManager = void 0;
const logger_1 = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
const messaging_1 = __webpack_require__(/*! ./messaging */ "./src/utils/messaging.ts");
const logger = (0, logger_1.createLogger)('ContextMenu');
class ContextMenuManager {
    constructor() {
        this.menuItems = new Map();
    }
    static getInstance() {
        if (!ContextMenuManager.instance) {
            ContextMenuManager.instance = new ContextMenuManager();
        }
        return ContextMenuManager.instance;
    }
    createContextMenu(config) {
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
                }
                else {
                    this.menuItems.set(config.id, config);
                    logger.info('Context menu created', { id: config.id });
                }
            });
        }
        catch (error) {
            logger.error('Error creating context menu', {
                error: error instanceof Error ? error.message : String(error),
                config
            });
            throw error;
        }
    }
    removeContextMenu(id) {
        try {
            chrome.contextMenus.remove(id, () => {
                if (chrome.runtime.lastError) {
                    logger.error('Error removing context menu', {
                        error: chrome.runtime.lastError.message,
                        id
                    });
                }
                else {
                    this.menuItems.delete(id);
                    logger.info('Context menu removed', { id });
                }
            });
        }
        catch (error) {
            logger.error('Error removing context menu', {
                error: error instanceof Error ? error.message : String(error),
                id
            });
            throw error;
        }
    }
    getContextMenu(id) {
        return this.menuItems.get(id);
    }
    getAllContextMenus() {
        return Array.from(this.menuItems.values());
    }
    handleContextMenuClick(info, tab) {
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
            const message = {
                type: 'contextMenuAction',
                menuId: info.menuItemId.toString(),
                text: info.selectionText || ''
            };
            messaging_1.messagingManager.sendMessage(message).catch(error => {
                logger.error('Error sending context menu message', {
                    error: error instanceof Error ? error.message : String(error),
                    message
                });
            });
        }
        catch (error) {
            logger.error('Error handling context menu click', {
                error: error instanceof Error ? error.message : String(error),
                info
            });
        }
    }
}
exports.ContextMenuManager = ContextMenuManager;
exports.contextMenuManager = ContextMenuManager.getInstance();


/***/ }),

/***/ "./src/utils/errorHandler.ts":
/*!***********************************!*\
  !*** ./src/utils/errorHandler.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.errorHandler = exports.ErrorHandler = exports.ProcessingError = exports.RuntimeError = exports.PermissionError = exports.InitializationError = exports.ExtensionError = void 0;
// Error handling utility
const logger_1 = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
const initUtils_1 = __webpack_require__(/*! ./initUtils */ "./src/utils/initUtils.ts");
const logger = (0, logger_1.createLogger)('ErrorHandler');
// Custom error types
class ExtensionError extends Error {
    constructor(message, code, context = {}) {
        super(message);
        this.name = 'ExtensionError';
        this.code = code;
        this.context = context;
    }
}
exports.ExtensionError = ExtensionError;
class InitializationError extends ExtensionError {
    constructor(message, context = {}) {
        super(message, 'INIT_ERROR', context);
        this.name = 'InitializationError';
    }
}
exports.InitializationError = InitializationError;
class PermissionError extends ExtensionError {
    constructor(message, context = {}) {
        super(message, 'PERMISSION_ERROR', context);
        this.name = 'PermissionError';
    }
}
exports.PermissionError = PermissionError;
class RuntimeError extends ExtensionError {
    constructor(message, context = {}) {
        super(message, 'RUNTIME_ERROR', context);
        this.name = 'RuntimeError';
    }
}
exports.RuntimeError = RuntimeError;
class ProcessingError extends ExtensionError {
    constructor(message, context = {}) {
        super(message, 'PROCESSING_ERROR', context);
        this.name = 'ProcessingError';
    }
}
exports.ProcessingError = ProcessingError;
// Error handler class
class ErrorHandler {
    constructor() { }
    static getInstance() {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }
    handleError(error, context = {}) {
        let errorMessage;
        let errorCode;
        let errorContext = {
            ...context,
            timestamp: Date.now(),
            runtimeAvailable: !!chrome.runtime,
            extensionId: chrome.runtime?.id,
            isInitialized: initUtils_1.initManager.isInitialized('background')
        };
        if (error instanceof ExtensionError) {
            errorMessage = error.message;
            errorCode = error.code;
            errorContext = { ...errorContext, ...error.context };
        }
        else if (error instanceof Error) {
            errorMessage = error.message;
            errorCode = 'UNKNOWN_ERROR';
            errorContext = {
                ...errorContext,
                errorName: error.name,
                stack: error.stack
            };
        }
        else {
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
    async checkRuntimeHealth() {
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
        }
        catch (error) {
            throw new RuntimeError('Failed to access manifest', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async validatePermissions() {
        try {
            const permissions = await initUtils_1.initManager.checkPermissions();
            const hostPermissions = await initUtils_1.initManager.validateHostPermissions();
            if (!permissions || !hostPermissions) {
                throw new PermissionError('Required permissions not granted', {
                    permissions,
                    hostPermissions
                });
            }
        }
        catch (error) {
            if (error instanceof PermissionError) {
                throw error;
            }
            throw new PermissionError('Failed to validate permissions', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    isRecoverable(error) {
        if (error instanceof ExtensionError) {
            // Define which error types/codes are recoverable
            const recoverableCodes = ['PROCESSING_ERROR'];
            return recoverableCodes.includes(error.code);
        }
        return false;
    }
    getErrorResponse(error) {
        const { message, code, context } = this.handleError(error);
        return {
            error: message,
            code,
            debug: {
                ...initUtils_1.initManager.debugInfo(),
                errorContext: context
            }
        };
    }
}
exports.ErrorHandler = ErrorHandler;
exports.errorHandler = ErrorHandler.getInstance();


/***/ }),

/***/ "./src/utils/initUtils.ts":
/*!********************************!*\
  !*** ./src/utils/initUtils.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.initManager = void 0;
const logger_1 = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
class InitializationManager {
    constructor() {
        this.logger = (0, logger_1.createLogger)('InitManager');
        this.initStatus = new Map();
        this.readyCallbacks = new Map();
        // Listen for extension lifecycle events
        this.setupExtensionListeners();
    }
    static getInstance() {
        if (!InitializationManager.instance) {
            InitializationManager.instance = new InitializationManager();
        }
        return InitializationManager.instance;
    }
    setupExtensionListeners() {
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
    markInitialized(context, details) {
        const status = {
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
    markError(context, error, details) {
        const status = {
            initialized: false,
            error: error instanceof Error ? error.message : error,
            timestamp: Date.now(),
            context,
            details
        };
        this.initStatus.set(context, status);
        this.logger.error(`${context} initialization failed`, status);
    }
    isInitialized(context) {
        const status = this.initStatus.get(context);
        return status?.initialized || false;
    }
    getStatus(context) {
        return this.initStatus.get(context);
    }
    getAllStatus() {
        const status = {};
        this.initStatus.forEach((value, key) => {
            status[key] = value;
        });
        return status;
    }
    async waitForInitialization(context, timeout = 5000) {
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
    logEvent(event, details) {
        this.logger.info(`Extension event: ${event}`, {
            event,
            timestamp: Date.now(),
            ...details
        });
    }
    async checkPermissions() {
        const permissions = [
            'activeTab',
            'contextMenus',
            'scripting',
            'storage',
            'tabs'
        ];
        const results = {};
        for (const permission of permissions) {
            try {
                const granted = await chrome.permissions.contains({ permissions: [permission] });
                results[permission] = granted;
            }
            catch (error) {
                this.logger.error(`Error checking permission ${permission}:`, {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                results[permission] = false;
            }
        }
        return results;
    }
    async validateHostPermissions() {
        const hosts = [
            'http://localhost:*/*',
            'http://127.0.0.1:*/*'
        ];
        const results = {};
        for (const host of hosts) {
            try {
                const granted = await chrome.permissions.contains({ origins: [host] });
                results[host] = granted;
            }
            catch (error) {
                this.logger.error(`Error checking host permission ${host}:`, {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                results[host] = false;
            }
        }
        return results;
    }
    debugInfo() {
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
exports.initManager = InitializationManager.getInstance();


/***/ }),

/***/ "./src/utils/logger.ts":
/*!*****************************!*\
  !*** ./src/utils/logger.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createLogger = createLogger;
class ConsoleLogger {
    constructor(namespace, minLevel = 'debug') {
        this.namespace = namespace;
        this.minLevel = minLevel;
    }
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const minLevelIndex = levels.indexOf(this.minLevel);
        const currentLevelIndex = levels.indexOf(level);
        return currentLevelIndex >= minLevelIndex;
    }
    formatMessage(level, message) {
        return `[${this.namespace}] [${level.toUpperCase()}] ${message}`;
    }
    formatContext(context) {
        if (!context)
            return undefined;
        return context;
    }
    debug(message, context) {
        if (!this.shouldLog('debug'))
            return;
        if (context) {
            console.debug(this.formatMessage('debug', message), this.formatContext(context));
        }
        else {
            console.debug(this.formatMessage('debug', message));
        }
    }
    info(message, context) {
        if (!this.shouldLog('info'))
            return;
        if (context) {
            console.info(this.formatMessage('info', message), this.formatContext(context));
        }
        else {
            console.info(this.formatMessage('info', message));
        }
    }
    warn(message, context) {
        if (!this.shouldLog('warn'))
            return;
        if (context) {
            console.warn(this.formatMessage('warn', message), this.formatContext(context));
        }
        else {
            console.warn(this.formatMessage('warn', message));
        }
    }
    error(message, context) {
        if (!this.shouldLog('error'))
            return;
        if (context) {
            console.error(this.formatMessage('error', message), this.formatContext(context));
        }
        else {
            console.error(this.formatMessage('error', message));
        }
    }
}
function createLogger(namespace, minLevel = 'debug') {
    return new ConsoleLogger(namespace, minLevel);
}


/***/ }),

/***/ "./src/utils/messaging.ts":
/*!********************************!*\
  !*** ./src/utils/messaging.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.messagingManager = void 0;
const logger_1 = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
const initUtils_1 = __webpack_require__(/*! ./initUtils */ "./src/utils/initUtils.ts");
const logger = (0, logger_1.createLogger)('Messaging');
class MessagingManager {
    constructor() {
        this.handlers = new Map();
        this.setupMessageListener();
    }
    static getInstance() {
        if (!MessagingManager.instance) {
            MessagingManager.instance = new MessagingManager();
        }
        return MessagingManager.instance;
    }
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            logger.debug('Received message:', { type: message.type, sender: sender.id });
            const handler = this.handlers.get(message.type);
            if (!handler) {
                logger.warn('No handler registered for message type:', { type: message.type });
                sendResponse({
                    error: `No handler for message type: ${message.type}`,
                    debug: initUtils_1.initManager.debugInfo()
                });
                return false;
            }
            handler(message, sender)
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
                    debug: initUtils_1.initManager.debugInfo()
                });
            });
            return true; // Will respond asynchronously
        });
    }
    registerHandler(type, handler) {
        this.handlers.set(type, handler);
        logger.debug('Registered handler for message type:', { type });
    }
    async sendMessage(message) {
        try {
            logger.debug('Sending message:', { type: message.type });
            const response = await chrome.runtime.sendMessage(message);
            logger.debug('Message response:', { type: message.type, response });
            return response;
        }
        catch (error) {
            logger.error('Error sending message:', {
                type: message.type,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    async sendTabMessage(tabId, message) {
        try {
            logger.debug('Sending tab message:', { tabId, type: message.type });
            const response = await chrome.tabs.sendMessage(tabId, message);
            logger.debug('Tab message response:', { tabId, type: message.type, response });
            return response;
        }
        catch (error) {
            logger.error('Error sending tab message:', {
                tabId,
                type: message.type,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}
exports.messagingManager = MessagingManager.getInstance();


/***/ }),

/***/ "./src/utils/textProcessor.ts":
/*!************************************!*\
  !*** ./src/utils/textProcessor.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.textProcessingManager = void 0;
const logger_1 = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
const celeryClient_1 = __webpack_require__(/*! ./celeryClient */ "./src/utils/celeryClient.ts");
const config_1 = __webpack_require__(/*! ../config */ "./src/config.ts");
const logger = (0, logger_1.createLogger)('TextProcessor');
const celeryClient = new celeryClient_1.CeleryClient(config_1.config.API_ENDPOINT);
class TextProcessingManager {
    constructor() {
        this.activeTasks = new Map();
        this.isInitialized = false;
    }
    static getInstance() {
        if (!TextProcessingManager.instance) {
            TextProcessingManager.instance = new TextProcessingManager();
        }
        return TextProcessingManager.instance;
    }
    async setup() {
        try {
            // Check if Celery API is available
            const response = await fetch(`${config_1.config.API_ENDPOINT}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to connect to Celery API: ${response.statusText}`);
            }
            this.isInitialized = true;
            logger.info('Text processor initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize text processor', { error: error });
            throw error;
        }
    }
    async processText(text, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Text processor is not initialized');
        }
        try {
            logger.debug('Processing text:', { length: text.length, options });
            const taskId = await celeryClient.processText(text, options);
            const result = await celeryClient.pollTaskStatus(taskId);
            logger.info('Text processing result', {
                taskId,
                status: result.status,
                error: result.error || undefined
            });
            this.activeTasks.set(result.taskId, result);
            return {
                taskId: result.taskId,
                status: result.status,
                result: result.result,
                error: result.error
            };
        }
        catch (error) {
            logger.error('Error processing text', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async checkTaskStatus(taskId) {
        if (!this.isInitialized) {
            throw new Error('Text processor is not initialized');
        }
        try {
            const status = await celeryClient.pollTaskStatus(taskId);
            this.activeTasks.set(taskId, status);
            return status;
        }
        catch (error) {
            logger.error('Error checking task status:', {
                taskId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    async cancelTask(taskId) {
        if (!this.isInitialized) {
            throw new Error('Text processor is not initialized');
        }
        try {
            await celeryClient.cancelTask(taskId);
            this.activeTasks.delete(taskId);
            logger.info('Task cancelled:', { taskId });
        }
        catch (error) {
            logger.error('Error cancelling task:', {
                taskId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    getActiveTask(taskId) {
        return this.activeTasks.get(taskId);
    }
    getAllActiveTasks() {
        return Array.from(this.activeTasks.values());
    }
    cleanupTask(taskId) {
        this.activeTasks.delete(taskId);
        logger.debug('Task cleaned up:', { taskId });
    }
}
exports.textProcessingManager = TextProcessingManager.getInstance();


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!***************************!*\
  !*** ./src/background.ts ***!
  \***************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
// Background script for handling text-to-speech processing
const logger_1 = __webpack_require__(/*! ./utils/logger */ "./src/utils/logger.ts");
const initUtils_1 = __webpack_require__(/*! ./utils/initUtils */ "./src/utils/initUtils.ts");
const messaging_1 = __webpack_require__(/*! ./utils/messaging */ "./src/utils/messaging.ts");
const contextMenu_1 = __webpack_require__(/*! ./utils/contextMenu */ "./src/utils/contextMenu.ts");
const textProcessor_1 = __webpack_require__(/*! ./utils/textProcessor */ "./src/utils/textProcessor.ts");
const storage_1 = __webpack_require__(/*! ./services/storage */ "./src/services/storage.ts");
const errorHandler_1 = __webpack_require__(/*! ./utils/errorHandler */ "./src/utils/errorHandler.ts");
const logger = (0, logger_1.createLogger)('Background');
const storageService = storage_1.StorageService.getInstance();
// Initialize the extension
async function initializeExtension(details) {
    try {
        // Ensure we're in a service worker context
        if (!chrome.runtime.id) {
            throw new errorHandler_1.InitializationError('Extension ID not available', {
                code: 'INVALID_CONTEXT'
            });
        }
        logger.info('Initializing extension', { details: details || {} });
        // Initialize core services
        await Promise.all([
            storageService.getSettings(),
            contextMenu_1.contextMenuManager.createContextMenu({
                id: 'readSelectedText',
                title: 'Read Selected Text',
                contexts: ['selection']
            }),
            textProcessor_1.textProcessingManager.setup()
        ]);
        logger.info('Extension initialized successfully', { status: 'success' });
    }
    catch (error) {
        logger.error('Failed to initialize extension', { error: error });
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
window.addEventListener('error', (event) => {
    errorHandler_1.errorHandler.handleError(event.error, {
        source: 'window.error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});
window.addEventListener('unhandledrejection', (event) => {
    errorHandler_1.errorHandler.handleError(event.reason, {
        source: 'unhandledrejection',
        message: event.reason?.message || 'Unknown promise rejection'
    });
});
// Initialize extension
async function setupMessageHandlers() {
    // Handle content script ready message
    messaging_1.messagingManager.registerHandler('contentScriptReady', async (message) => {
        try {
            await errorHandler_1.errorHandler.checkRuntimeHealth();
            logger.info('Content script ready');
            return {
                status: 'acknowledged',
                debug: initUtils_1.initManager.debugInfo()
            };
        }
        catch (error) {
            const { error: errorMessage, code, debug } = errorHandler_1.errorHandler.getErrorResponse(error);
            return {
                status: 'error',
                error: errorMessage,
                code,
                debug
            };
        }
    });
    // Handle text processing request
    messaging_1.messagingManager.registerHandler('processText', async (message) => {
        try {
            await errorHandler_1.errorHandler.checkRuntimeHealth();
            if (!initUtils_1.initManager.isInitialized('background')) {
                throw new errorHandler_1.InitializationError('Background script not fully initialized', {
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
            const result = await textProcessor_1.textProcessingManager.processText(message.text, options);
            if (!result || !result.taskId) {
                throw new errorHandler_1.ProcessingError('Failed to process text', {
                    code: 'PROCESSING_ERROR',
                    data: { text: message.text }
                });
            }
            return {
                status: 'processing',
                taskId: result.taskId,
                debug: initUtils_1.initManager.debugInfo()
            };
        }
        catch (error) {
            const { error: errorMessage, code, debug } = errorHandler_1.errorHandler.getErrorResponse(error);
            return {
                status: 'error',
                error: errorMessage,
                code,
                debug
            };
        }
    });
    // Handle debug info request
    messaging_1.messagingManager.registerHandler('getDebugInfo', async () => {
        try {
            await errorHandler_1.errorHandler.checkRuntimeHealth();
            const manifest = chrome.runtime.getManifest();
            return {
                extensionId: chrome.runtime.id,
                manifestVersion: manifest.manifest_version,
                permissions: manifest.permissions || [],
                hostPermissions: manifest.host_permissions || [],
                timestamp: Date.now(),
                debug: initUtils_1.initManager.debugInfo()
            };
        }
        catch (error) {
            const { error: errorMessage, code, debug } = errorHandler_1.errorHandler.getErrorResponse(error);
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
    });
}
// Set up message handlers after initialization
initializeExtension().then(() => {
    setupMessageHandlers();
});

})();

/******/ })()
;
//# sourceMappingURL=background.js.map
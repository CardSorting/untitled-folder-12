/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/config.ts":
/*!***********************!*\
  !*** ./src/config.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   config: () => (/* binding */ config)
/* harmony export */ });
// Configuration for the Chrome extension
const config = {
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
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   StorageService: () => (/* binding */ StorageService)
/* harmony export */ });
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/logger */ "./src/utils/logger.ts");

const logger = (0,_utils_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('Storage');
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


/***/ }),

/***/ "./src/utils/celeryClient.ts":
/*!***********************************!*\
  !*** ./src/utils/celeryClient.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CeleryClient: () => (/* binding */ CeleryClient),
/* harmony export */   celeryClient: () => (/* binding */ celeryClient)
/* harmony export */ });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");
// Celery client for handling text processing tasks


const logger = (0,_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('CeleryClient');
class CeleryClient {
    constructor(baseUrl = _config__WEBPACK_IMPORTED_MODULE_1__.config.API_ENDPOINT, pollInterval = 1000, maxRetries = 3) {
        this.baseUrl = baseUrl;
        this.taskQueue = new Map();
        this.pollInterval = pollInterval;
        this.maxRetries = maxRetries;
    }
    async processText(text, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${_config__WEBPACK_IMPORTED_MODULE_1__.config.endpoints.processText}`, {
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
            const response = await fetch(`${this.baseUrl}${_config__WEBPACK_IMPORTED_MODULE_1__.config.endpoints.taskStatus}/${taskId}`);
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
            const response = await fetch(`${this.baseUrl}${_config__WEBPACK_IMPORTED_MODULE_1__.config.endpoints.taskStatus}/${taskId}/cancel`, {
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
// Export singleton instance
const celeryClient = new CeleryClient();


/***/ }),

/***/ "./src/utils/contextMenu.ts":
/*!**********************************!*\
  !*** ./src/utils/contextMenu.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ContextMenuManager: () => (/* binding */ ContextMenuManager),
/* harmony export */   contextMenuManager: () => (/* binding */ contextMenuManager)
/* harmony export */ });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
/* harmony import */ var _messaging__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./messaging */ "./src/utils/messaging.ts");


const logger = (0,_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('ContextMenu');
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
            _messaging__WEBPACK_IMPORTED_MODULE_1__.messagingManager.sendMessage(message).catch(error => {
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
const contextMenuManager = ContextMenuManager.getInstance();


/***/ }),

/***/ "./src/utils/errorHandler.ts":
/*!***********************************!*\
  !*** ./src/utils/errorHandler.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ErrorHandler: () => (/* binding */ ErrorHandler),
/* harmony export */   ExtensionError: () => (/* binding */ ExtensionError),
/* harmony export */   InitializationError: () => (/* binding */ InitializationError),
/* harmony export */   PermissionError: () => (/* binding */ PermissionError),
/* harmony export */   ProcessingError: () => (/* binding */ ProcessingError),
/* harmony export */   RuntimeError: () => (/* binding */ RuntimeError),
/* harmony export */   errorHandler: () => (/* binding */ errorHandler)
/* harmony export */ });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
/* harmony import */ var _initUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./initUtils */ "./src/utils/initUtils.ts");
// Error handling utility


const logger = (0,_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('ErrorHandler');
// Custom error types
class ExtensionError extends Error {
    constructor(message, code, context = {}) {
        super(message);
        this.name = 'ExtensionError';
        this.code = code;
        this.context = context;
    }
}
class InitializationError extends ExtensionError {
    constructor(message, context = {}) {
        super(message, 'INIT_ERROR', context);
        this.name = 'InitializationError';
    }
}
class PermissionError extends ExtensionError {
    constructor(message, context = {}) {
        super(message, 'PERMISSION_ERROR', context);
        this.name = 'PermissionError';
    }
}
class RuntimeError extends ExtensionError {
    constructor(message, context = {}) {
        super(message, 'RUNTIME_ERROR', context);
        this.name = 'RuntimeError';
    }
}
class ProcessingError extends ExtensionError {
    constructor(message, context = {}) {
        super(message, 'PROCESSING_ERROR', context);
        this.name = 'ProcessingError';
    }
}
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
            isInitialized: _initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.isInitialized('background')
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
            const permissions = await _initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.checkPermissions();
            const hostPermissions = await _initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.validateHostPermissions();
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
                ..._initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.debugInfo(),
                errorContext: context
            }
        };
    }
}
const errorHandler = ErrorHandler.getInstance();


/***/ }),

/***/ "./src/utils/initUtils.ts":
/*!********************************!*\
  !*** ./src/utils/initUtils.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initManager: () => (/* binding */ initManager)
/* harmony export */ });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");

class InitializationManager {
    constructor() {
        this.logger = (0,_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('InitManager');
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
const initManager = InitializationManager.getInstance();


/***/ }),

/***/ "./src/utils/logger.ts":
/*!*****************************!*\
  !*** ./src/utils/logger.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createLogger: () => (/* binding */ createLogger)
/* harmony export */ });
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
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   messagingManager: () => (/* binding */ messagingManager)
/* harmony export */ });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
/* harmony import */ var _initUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./initUtils */ "./src/utils/initUtils.ts");


const logger = (0,_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('Messaging');
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
                    debug: _initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.debugInfo()
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
                    debug: _initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.debugInfo()
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
const messagingManager = MessagingManager.getInstance();


/***/ }),

/***/ "./src/utils/textProcessor.ts":
/*!************************************!*\
  !*** ./src/utils/textProcessor.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   textProcessingManager: () => (/* binding */ textProcessingManager)
/* harmony export */ });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./logger */ "./src/utils/logger.ts");
/* harmony import */ var _celeryClient__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./celeryClient */ "./src/utils/celeryClient.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../config */ "./src/config.ts");



const logger = (0,_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('TextProcessor');
const celeryClient = new _celeryClient__WEBPACK_IMPORTED_MODULE_1__.CeleryClient(_config__WEBPACK_IMPORTED_MODULE_2__.config.API_ENDPOINT);
class TextProcessingManager {
    constructor() {
        this.activeTasks = new Map();
    }
    static getInstance() {
        if (!TextProcessingManager.instance) {
            TextProcessingManager.instance = new TextProcessingManager();
        }
        return TextProcessingManager.instance;
    }
    async processText(text, options = {}) {
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
const textProcessingManager = TextProcessingManager.getInstance();


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
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!***************************!*\
  !*** ./src/background.ts ***!
  \***************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/logger */ "./src/utils/logger.ts");
/* harmony import */ var _utils_initUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/initUtils */ "./src/utils/initUtils.ts");
/* harmony import */ var _utils_messaging__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/messaging */ "./src/utils/messaging.ts");
/* harmony import */ var _utils_contextMenu__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/contextMenu */ "./src/utils/contextMenu.ts");
/* harmony import */ var _utils_textProcessor__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils/textProcessor */ "./src/utils/textProcessor.ts");
/* harmony import */ var _services_storage__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./services/storage */ "./src/services/storage.ts");
/* harmony import */ var _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./utils/errorHandler */ "./src/utils/errorHandler.ts");
// Background script for handling text-to-speech processing







const logger = (0,_utils_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('Background');
const storageService = _services_storage__WEBPACK_IMPORTED_MODULE_5__.StorageService.getInstance();
// Initialize extension
function setupMessageHandlers() {
    // Handle content script ready message
    _utils_messaging__WEBPACK_IMPORTED_MODULE_2__.messagingManager.registerHandler('contentScriptReady', async (message) => {
        try {
            await _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.checkRuntimeHealth();
            logger.info('Content script ready');
            return {
                status: 'acknowledged',
                debug: _utils_initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.debugInfo()
            };
        }
        catch (error) {
            const { error: errorMessage, code, debug } = _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.getErrorResponse(error);
            return {
                status: 'error',
                error: errorMessage,
                code,
                debug
            };
        }
    });
    // Handle text processing request
    _utils_messaging__WEBPACK_IMPORTED_MODULE_2__.messagingManager.registerHandler('processText', async (message) => {
        try {
            await _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.checkRuntimeHealth();
            if (!_utils_initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.isInitialized('background')) {
                throw new _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.InitializationError('Background script not fully initialized');
            }
            // Get current TTS settings
            const ttsSettings = await storageService.getTTSSettings();
            // Merge settings with request options
            const options = {
                ...ttsSettings,
                ...message.options
            };
            const result = await _utils_textProcessor__WEBPACK_IMPORTED_MODULE_4__.textProcessingManager.processText(message.text, options);
            if (!result || !result.taskId) {
                throw new _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.ProcessingError('Failed to process text', { text: message.text });
            }
            return {
                status: 'processing',
                taskId: result.taskId,
                debug: _utils_initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.debugInfo()
            };
        }
        catch (error) {
            const { error: errorMessage, code, debug } = _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.getErrorResponse(error);
            return {
                status: 'error',
                error: errorMessage,
                code,
                debug
            };
        }
    });
    // Handle debug info request
    _utils_messaging__WEBPACK_IMPORTED_MODULE_2__.messagingManager.registerHandler('getDebugInfo', async () => {
        try {
            await _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.checkRuntimeHealth();
            const manifest = chrome.runtime.getManifest();
            return {
                extensionId: chrome.runtime.id,
                manifestVersion: manifest.manifest_version,
                permissions: manifest.permissions || [],
                hostPermissions: manifest.host_permissions || [],
                timestamp: Date.now(),
                debug: _utils_initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.debugInfo()
            };
        }
        catch (error) {
            const { error: errorMessage, code, debug } = _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.getErrorResponse(error);
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
// Initialize the extension
async function initializeExtension(details) {
    try {
        // Check runtime health
        await _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.checkRuntimeHealth();
        // Validate permissions
        await _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.validatePermissions();
        logger.info('Starting extension initialization', {
            reason: details?.reason || 'startup'
        });
        // Create context menu items
        await Promise.all([
            _utils_contextMenu__WEBPACK_IMPORTED_MODULE_3__.contextMenuManager.createContextMenu({
                id: 'readSelectedText',
                title: 'Read Selected Text',
                contexts: ['selection']
            }),
            _utils_contextMenu__WEBPACK_IMPORTED_MODULE_3__.contextMenuManager.createContextMenu({
                id: 'summarizeText',
                title: 'Summarize Text',
                contexts: ['selection']
            })
        ]);
        // Load initial settings
        await storageService.getSettings();
        // Mark background script as initialized
        _utils_initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.markInitialized('background', {
            contextMenu: true,
            extensionId: chrome.runtime.id,
            installType: details?.reason
        });
        // Set up message handlers after initialization
        setupMessageHandlers();
        logger.info('Extension initialized successfully', {
            extensionId: chrome.runtime.id,
            reason: details?.reason
        });
    }
    catch (error) {
        const { message, code, context } = _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.handleError(error, {
            reason: details?.reason
        });
        _utils_initUtils__WEBPACK_IMPORTED_MODULE_1__.initManager.markError('background', message);
        // If the error is recoverable, try to set up message handlers anyway
        if (_utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.isRecoverable(error)) {
            logger.warn('Attempting to continue with partial initialization');
            setupMessageHandlers();
        }
    }
}
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
    _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.handleError(event.error, {
        source: 'window.error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});
window.addEventListener('unhandledrejection', (event) => {
    _utils_errorHandler__WEBPACK_IMPORTED_MODULE_6__.errorHandler.handleError(event.reason, {
        source: 'unhandledrejection',
        message: event.reason?.message || 'Unknown promise rejection'
    });
});

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRTtRQUNsQyxNQUFNLEVBQUUsY0FBYztRQUN0QixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87UUFDdEIsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO1FBQ3hCLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTTtRQUNwQixLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUs7S0FDckIsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUM7QUFFSCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxLQUE0QixFQUFFLEVBQUU7SUFDM0UsNkRBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtRQUNuQyxNQUFNLEVBQUUsb0JBQW9CO1FBQzVCLE9BQU8sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sSUFBSSwyQkFBMkI7S0FDaEUsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vLi9zcmMvY29uZmlnLnRzIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi8uL3NyYy9zZXJ2aWNlcy9zdG9yYWdlLnRzIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi8uL3NyYy91dGlscy9jZWxlcnlDbGllbnQudHMiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uLy4vc3JjL3V0aWxzL2NvbnRleHRNZW51LnRzIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi8uL3NyYy91dGlscy9lcnJvckhhbmRsZXIudHMiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uLy4vc3JjL3V0aWxzL2luaXRVdGlscy50cyIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vLi9zcmMvdXRpbHMvbG9nZ2VyLnRzIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi8uL3NyYy91dGlscy9tZXNzYWdpbmcudHMiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uLy4vc3JjL3V0aWxzL3RleHRQcm9jZXNzb3IudHMiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uLy4vc3JjL2JhY2tncm91bmQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29uZmlndXJhdGlvbiBmb3IgdGhlIENocm9tZSBleHRlbnNpb25cblxuaW50ZXJmYWNlIENvbmZpZyB7XG4gICAgQVBJX0VORFBPSU5UOiBzdHJpbmc7XG4gICAgY2VsZXJ5OiB7XG4gICAgICAgIHRpbWVvdXQ6IG51bWJlcjtcbiAgICAgICAgcG9sbEludGVydmFsOiBudW1iZXI7XG4gICAgICAgIG1heFJldHJpZXM6IG51bWJlcjtcbiAgICB9O1xuICAgIGVuZHBvaW50czoge1xuICAgICAgICBwcm9jZXNzVGV4dDogc3RyaW5nO1xuICAgICAgICB0YXNrU3RhdHVzOiBzdHJpbmc7XG4gICAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IGNvbmZpZzogQ29uZmlnID0ge1xuICAgIEFQSV9FTkRQT0lOVDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMScsIC8vIERlZmF1bHQgbG9jYWwgZGV2ZWxvcG1lbnQgc2VydmVyXG4gICAgY2VsZXJ5OiB7XG4gICAgICAgIHRpbWVvdXQ6IDMwMDAwLCAvLyAzMCBzZWNvbmRzXG4gICAgICAgIHBvbGxJbnRlcnZhbDogMTAwMCwgLy8gMSBzZWNvbmRcbiAgICAgICAgbWF4UmV0cmllczogM1xuICAgIH0sXG4gICAgZW5kcG9pbnRzOiB7XG4gICAgICAgIHByb2Nlc3NUZXh0OiAnL3Byb2Nlc3NfdGV4dCcsXG4gICAgICAgIHRhc2tTdGF0dXM6ICcvdGFza19zdGF0dXMnXG4gICAgfVxufTtcbiIsImltcG9ydCB7IGNyZWF0ZUxvZ2dlciB9IGZyb20gJy4uL3V0aWxzL2xvZ2dlcic7XG5pbXBvcnQgeyBFeHRlbnNpb25TZXR0aW5ncywgVGV4dFByb2Nlc3NpbmdTZXR0aW5ncyB9IGZyb20gJy4uL3R5cGVzL3NldHRpbmdzJztcblxuY29uc3QgbG9nZ2VyID0gY3JlYXRlTG9nZ2VyKCdTdG9yYWdlJyk7XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEV4dGVuc2lvblNldHRpbmdzID0ge1xuICAgIHR0c1NldHRpbmdzOiB7XG4gICAgICAgIHJhdGU6IDEuMCxcbiAgICAgICAgcGl0Y2g6IDEuMCxcbiAgICAgICAgdm9sdW1lOiAxLjAsXG4gICAgICAgIGF1dG9SZXN1bWU6IHRydWUsXG4gICAgICAgIGxhbmd1YWdlOiAnZW4nXG4gICAgfVxufTtcblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2VTZXJ2aWNlIHtcbiAgICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogU3RvcmFnZVNlcnZpY2U7XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge31cblxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogU3RvcmFnZVNlcnZpY2Uge1xuICAgICAgICBpZiAoIVN0b3JhZ2VTZXJ2aWNlLmluc3RhbmNlKSB7XG4gICAgICAgICAgICBTdG9yYWdlU2VydmljZS5pbnN0YW5jZSA9IG5ldyBTdG9yYWdlU2VydmljZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTdG9yYWdlU2VydmljZS5pbnN0YW5jZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgZ2V0U2V0dGluZ3MoKTogUHJvbWlzZTxFeHRlbnNpb25TZXR0aW5ncz4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdzZXR0aW5ncycpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5zZXR0aW5ncyB8fCBERUZBVUxUX1NFVFRJTkdTO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBsb2FkaW5nIHNldHRpbmdzOicsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIERFRkFVTFRfU0VUVElOR1M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgdXBkYXRlU2V0dGluZ3Moc2V0dGluZ3M6IFBhcnRpYWw8RXh0ZW5zaW9uU2V0dGluZ3M+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U2V0dGluZ3MgPSBhd2FpdCB0aGlzLmdldFNldHRpbmdzKCk7XG4gICAgICAgICAgICBjb25zdCBuZXdTZXR0aW5ncyA9IHtcbiAgICAgICAgICAgICAgICAuLi5jdXJyZW50U2V0dGluZ3MsXG4gICAgICAgICAgICAgICAgLi4uc2V0dGluZ3MsXG4gICAgICAgICAgICAgICAgdHRzU2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uY3VycmVudFNldHRpbmdzLnR0c1NldHRpbmdzLFxuICAgICAgICAgICAgICAgICAgICAuLi4oc2V0dGluZ3MudHRzU2V0dGluZ3MgfHwge30pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IHNldHRpbmdzOiBuZXdTZXR0aW5ncyB9KTtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdTZXR0aW5ncyB1cGRhdGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBzYXZpbmcgc2V0dGluZ3M6Jywge1xuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBnZXRUVFNTZXR0aW5ncygpOiBQcm9taXNlPFRleHRQcm9jZXNzaW5nU2V0dGluZ3M+IHtcbiAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBhd2FpdCB0aGlzLmdldFNldHRpbmdzKCk7XG4gICAgICAgIHJldHVybiBzZXR0aW5ncy50dHNTZXR0aW5ncztcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgdXBkYXRlVFRTU2V0dGluZ3Moc2V0dGluZ3M6IFBhcnRpYWw8VGV4dFByb2Nlc3NpbmdTZXR0aW5ncz4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgY3VycmVudFNldHRpbmdzID0gYXdhaXQgdGhpcy5nZXRTZXR0aW5ncygpO1xuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZVNldHRpbmdzKHtcbiAgICAgICAgICAgIHR0c1NldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgLi4uY3VycmVudFNldHRpbmdzLnR0c1NldHRpbmdzLFxuICAgICAgICAgICAgICAgIC4uLnNldHRpbmdzXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsIi8vIENlbGVyeSBjbGllbnQgZm9yIGhhbmRsaW5nIHRleHQgcHJvY2Vzc2luZyB0YXNrc1xuaW1wb3J0IHsgY3JlYXRlTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB7IENlbGVyeVRhc2ssIENlbGVyeVRhc2tSZXN1bHQsIENlbGVyeVRhc2tTdGF0dXMsIEhlYWx0aENoZWNrUmVzcG9uc2UsIFRhc2tSZXNwb25zZSB9IGZyb20gJy4uL3R5cGVzL2NlbGVyeSc7XG5pbXBvcnQgeyBMb2dDb250ZXh0IH0gZnJvbSAnLi9sb2dnZXInO1xuXG5pbnRlcmZhY2UgUHJvY2Vzc09wdGlvbnMgZXh0ZW5kcyBMb2dDb250ZXh0IHtcbiAgICBsYW5ndWFnZT86IHN0cmluZztcbiAgICB2b2ljZT86IHN0cmluZztcbiAgICByYXRlPzogbnVtYmVyO1xuICAgIHBpdGNoPzogbnVtYmVyO1xuICAgIHZvbHVtZT86IG51bWJlcjtcbiAgICBlbW90aW9uYWxDb250ZXh0PzogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgICB0ZXh0U3RydWN0dXJlPzogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgICBba2V5OiBzdHJpbmddOiBhbnk7XG59XG5cbmNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcignQ2VsZXJ5Q2xpZW50Jyk7XG5cbmV4cG9ydCBjbGFzcyBDZWxlcnlDbGllbnQge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgYmFzZVVybDogc3RyaW5nO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgdGFza1F1ZXVlOiBNYXA8c3RyaW5nLCBDZWxlcnlUYXNrPjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHBvbGxJbnRlcnZhbDogbnVtYmVyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgbWF4UmV0cmllczogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoYmFzZVVybDogc3RyaW5nID0gY29uZmlnLkFQSV9FTkRQT0lOVCwgcG9sbEludGVydmFsID0gMTAwMCwgbWF4UmV0cmllcyA9IDMpIHtcbiAgICAgICAgdGhpcy5iYXNlVXJsID0gYmFzZVVybDtcbiAgICAgICAgdGhpcy50YXNrUXVldWUgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMucG9sbEludGVydmFsID0gcG9sbEludGVydmFsO1xuICAgICAgICB0aGlzLm1heFJldHJpZXMgPSBtYXhSZXRyaWVzO1xuICAgIH1cblxuICAgIGFzeW5jIHByb2Nlc3NUZXh0KHRleHQ6IHN0cmluZywgb3B0aW9uczogUHJvY2Vzc09wdGlvbnMgPSB7fSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke3RoaXMuYmFzZVVybH0ke2NvbmZpZy5lbmRwb2ludHMucHJvY2Vzc1RleHR9YCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgbGFuZ3VhZ2U6IG9wdGlvbnMubGFuZ3VhZ2UgfHwgJ2VuLVVTJyxcbiAgICAgICAgICAgICAgICAgICAgdm9pY2U6IG9wdGlvbnMudm9pY2UsXG4gICAgICAgICAgICAgICAgICAgIHJhdGU6IG9wdGlvbnMucmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgcGl0Y2g6IG9wdGlvbnMucGl0Y2gsXG4gICAgICAgICAgICAgICAgICAgIHZvbHVtZTogb3B0aW9ucy52b2x1bWUsXG4gICAgICAgICAgICAgICAgICAgIGVtb3Rpb25hbENvbnRleHQ6IG9wdGlvbnMuZW1vdGlvbmFsQ29udGV4dCB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgdGV4dFN0cnVjdHVyZTogb3B0aW9ucy50ZXh0U3RydWN0dXJlIHx8IHt9XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHByb2Nlc3MgdGV4dDogJHtyZXNwb25zZS5zdGF0dXNUZXh0fWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkYXRhOiBUYXNrUmVzcG9uc2UgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICBjb25zdCB0YXNrSWQgPSBkYXRhLnRhc2tfaWQ7XG5cbiAgICAgICAgICAgIGlmICghdGFza0lkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyB0YXNrIElEIHJldHVybmVkIGZyb20gc2VydmVyJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudGFza1F1ZXVlLnNldCh0YXNrSWQsIHtcbiAgICAgICAgICAgICAgICBpZDogdGFza0lkLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdwcm9jZXNzVGV4dCcsXG4gICAgICAgICAgICAgICAgYXJnczogW3RleHQsIG9wdGlvbnNdLFxuICAgICAgICAgICAgICAgIHN0YXR1czogJ1BFTkRJTkcnLFxuICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgICAgICByZXRyaWVzOiAwLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdUZXh0IHByb2Nlc3NpbmcgdGFzayBzdWJtaXR0ZWQnLCB7IHRhc2tJZCB9KTtcbiAgICAgICAgICAgIHJldHVybiB0YXNrSWQ7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgdGV4dCcsIHsgZXJyb3I6IFN0cmluZyhlcnJvcikgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGdldFRhc2tSZXN1bHQodGFza0lkOiBzdHJpbmcpOiBQcm9taXNlPENlbGVyeVRhc2tTdGF0dXM+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7dGhpcy5iYXNlVXJsfSR7Y29uZmlnLmVuZHBvaW50cy50YXNrU3RhdHVzfS8ke3Rhc2tJZH1gKTtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBnZXQgdGFzayBzdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZGF0YTogVGFza1Jlc3BvbnNlID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0YXNrSWQsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBkYXRhLnN0YXR1cyxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IGRhdGEucmVzdWx0LFxuICAgICAgICAgICAgICAgIGVycm9yOiBkYXRhLmVycm9yIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBkYXRhLm1lc3NhZ2VcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGdldHRpbmcgdGFzayByZXN1bHQnLCB7IHRhc2tJZCwgZXJyb3I6IFN0cmluZyhlcnJvcikgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIHBvbGxUYXNrU3RhdHVzKHRhc2tJZDogc3RyaW5nKTogUHJvbWlzZTxDZWxlcnlUYXNrU3RhdHVzPiB7XG4gICAgICAgIGNvbnN0IHRhc2sgPSB0aGlzLnRhc2tRdWV1ZS5nZXQodGFza0lkKTtcbiAgICAgICAgaWYgKCF0YXNrKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRhc2sgJHt0YXNrSWR9IG5vdCBmb3VuZCBpbiBxdWV1ZWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZ2V0VGFza1Jlc3VsdCh0YXNrSWQpO1xuICAgICAgICAgICAgdGFzay5zdGF0dXMgPSByZXN1bHQuc3RhdHVzO1xuICAgICAgICAgICAgdGFzay5yZXN1bHQgPSByZXN1bHQucmVzdWx0O1xuICAgICAgICAgICAgdGFzay5lcnJvciA9IHJlc3VsdC5lcnJvciB8fCBudWxsO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ1NVQ0NFU1MnKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1Rhc2sgY29tcGxldGVkIHN1Y2Nlc3NmdWxseScsIHsgXG4gICAgICAgICAgICAgICAgICAgIHRhc2tJZCwgXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0LnJlc3VsdCA/IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5yZXN1bHQpIDogbnVsbCBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnRhc2tRdWV1ZS5kZWxldGUodGFza0lkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ0ZBSUxVUkUnKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdUYXNrIGZhaWxlZCcsIHsgXG4gICAgICAgICAgICAgICAgICAgIHRhc2tJZCwgXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiByZXN1bHQuZXJyb3IgfHwgJ1Vua25vd24gZXJyb3InXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy50YXNrUXVldWUuZGVsZXRlKHRhc2tJZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdUYXNrIHN0YXR1cyB1cGRhdGVkJywgeyBcbiAgICAgICAgICAgICAgICAgICAgdGFza0lkLCBcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiByZXN1bHQuc3RhdHVzIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGFzay5yZXRyaWVzKys7XG4gICAgICAgICAgICBpZiAodGFzay5yZXRyaWVzID49IHRoaXMubWF4UmV0cmllcykge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignTWF4IHJldHJpZXMgcmVhY2hlZCcsIHsgXG4gICAgICAgICAgICAgICAgICAgIHRhc2tJZCwgXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgICAgIHJldHJpZXM6IHRhc2sucmV0cmllc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMudGFza1F1ZXVlLmRlbGV0ZSh0YXNrSWQpO1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0Vycm9yIHBvbGxpbmcgdGFzayBzdGF0dXMsIHJldHJ5aW5nJywgeyBcbiAgICAgICAgICAgICAgICB0YXNrSWQsIFxuICAgICAgICAgICAgICAgIHJldHJpZXM6IHRhc2sucmV0cmllcyxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB7IFxuICAgICAgICAgICAgICAgIHRhc2tJZCwgXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnUEVORElORycsIFxuICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCwgXG4gICAgICAgICAgICAgICAgZXJyb3I6IHVuZGVmaW5lZCBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRRdWV1ZWRUYXNrcygpOiBDZWxlcnlUYXNrW10ge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLnRhc2tRdWV1ZS52YWx1ZXMoKSk7XG4gICAgfVxuXG4gICAgYXN5bmMgY2hlY2tIZWFsdGgoKTogUHJvbWlzZTxIZWFsdGhDaGVja1Jlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke3RoaXMuYmFzZVVybH0vaGVhbHRoYCwge1xuICAgICAgICAgICAgICAgIHNpZ25hbDogQWJvcnRTaWduYWwudGltZW91dCg1MDAwKSAvLyBTaG9ydCB0aW1lb3V0IGZvciBoZWFsdGggY2hlY2tzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKCkgYXMgSGVhbHRoQ2hlY2tSZXNwb25zZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignSGVhbHRoIGNoZWNrIGZhaWxlZCcsIHsgXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBjYW5jZWxUYXNrKHRhc2tJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke3RoaXMuYmFzZVVybH0ke2NvbmZpZy5lbmRwb2ludHMudGFza1N0YXR1c30vJHt0YXNrSWR9L2NhbmNlbGAsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY2FuY2VsIHRhc2s6ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgY2FuY2VsaW5nIHRhc2snLCB7IFxuICAgICAgICAgICAgICAgIHRhc2tJZCxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpIFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gRXhwb3J0IHNpbmdsZXRvbiBpbnN0YW5jZVxuZXhwb3J0IGNvbnN0IGNlbGVyeUNsaWVudCA9IG5ldyBDZWxlcnlDbGllbnQoKTtcbiIsImltcG9ydCB7IGNyZWF0ZUxvZ2dlciB9IGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IG1lc3NhZ2luZ01hbmFnZXIgfSBmcm9tICcuL21lc3NhZ2luZyc7XG5pbXBvcnQgeyBDb250ZXh0TWVudUFjdGlvbk1lc3NhZ2UgfSBmcm9tICcuLi90eXBlcy9tZXNzYWdlcyc7XG5pbXBvcnQgeyBMb2dDb250ZXh0IH0gZnJvbSAnLi9sb2dnZXInO1xuXG5pbnRlcmZhY2UgQ29udGV4dE1lbnVDb25maWcgZXh0ZW5kcyBMb2dDb250ZXh0IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgY29udGV4dHM6IGNocm9tZS5jb250ZXh0TWVudXMuQ29udGV4dFR5cGVbXTtcbiAgICBba2V5OiBzdHJpbmddOiBhbnk7XG59XG5cbmNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcignQ29udGV4dE1lbnUnKTtcblxuZXhwb3J0IGNsYXNzIENvbnRleHRNZW51TWFuYWdlciB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IENvbnRleHRNZW51TWFuYWdlcjtcbiAgICBwcml2YXRlIG1lbnVJdGVtczogTWFwPHN0cmluZywgQ29udGV4dE1lbnVDb25maWc+O1xuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5tZW51SXRlbXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBDb250ZXh0TWVudU1hbmFnZXIge1xuICAgICAgICBpZiAoIUNvbnRleHRNZW51TWFuYWdlci5pbnN0YW5jZSkge1xuICAgICAgICAgICAgQ29udGV4dE1lbnVNYW5hZ2VyLmluc3RhbmNlID0gbmV3IENvbnRleHRNZW51TWFuYWdlcigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250ZXh0TWVudU1hbmFnZXIuaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZUNvbnRleHRNZW51KGNvbmZpZzogQ29udGV4dE1lbnVDb25maWcpOiB2b2lkIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICBpZDogY29uZmlnLmlkLFxuICAgICAgICAgICAgICAgIHRpdGxlOiBjb25maWcudGl0bGUsXG4gICAgICAgICAgICAgICAgY29udGV4dHM6IGNvbmZpZy5jb250ZXh0cyxcbiAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgY3JlYXRpbmcgY29udGV4dCBtZW51JywgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZyBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZW51SXRlbXMuc2V0KGNvbmZpZy5pZCwgY29uZmlnKTtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ0NvbnRleHQgbWVudSBjcmVhdGVkJywgeyBpZDogY29uZmlnLmlkIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBjcmVhdGluZyBjb250ZXh0IG1lbnUnLCB7IFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgICAgY29uZmlnIFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVDb250ZXh0TWVudShpZDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLnJlbW92ZShpZCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciByZW1vdmluZyBjb250ZXh0IG1lbnUnLCB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVudUl0ZW1zLmRlbGV0ZShpZCk7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdDb250ZXh0IG1lbnUgcmVtb3ZlZCcsIHsgaWQgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIHJlbW92aW5nIGNvbnRleHQgbWVudScsIHsgXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICBpZCBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0Q29udGV4dE1lbnUoaWQ6IHN0cmluZyk6IENvbnRleHRNZW51Q29uZmlnIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWVudUl0ZW1zLmdldChpZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEFsbENvbnRleHRNZW51cygpOiBDb250ZXh0TWVudUNvbmZpZ1tdIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5tZW51SXRlbXMudmFsdWVzKCkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBoYW5kbGVDb250ZXh0TWVudUNsaWNrKGluZm86IGNocm9tZS5jb250ZXh0TWVudXMuT25DbGlja0RhdGEsIHRhYjogY2hyb21lLnRhYnMuVGFiIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBtZW51SXRlbSA9IHRoaXMuZ2V0Q29udGV4dE1lbnUoaW5mby5tZW51SXRlbUlkLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgaWYgKCFtZW51SXRlbSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignQ29udGV4dCBtZW51IG5vdCBmb3VuZCcsIHsgbWVudUl0ZW1JZDogaW5mby5tZW51SXRlbUlkIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF0YWIgfHwgIXRhYi5pZCkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignSW52YWxpZCB0YWInLCB7IHRhYiB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2U6IENvbnRleHRNZW51QWN0aW9uTWVzc2FnZSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnY29udGV4dE1lbnVBY3Rpb24nLFxuICAgICAgICAgICAgICAgIG1lbnVJZDogaW5mby5tZW51SXRlbUlkLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdGV4dDogaW5mby5zZWxlY3Rpb25UZXh0IHx8ICcnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBtZXNzYWdpbmdNYW5hZ2VyLnNlbmRNZXNzYWdlKG1lc3NhZ2UpLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgY29udGV4dCBtZW51IG1lc3NhZ2UnLCB7IFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGhhbmRsaW5nIGNvbnRleHQgbWVudSBjbGljaycsIHsgXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgICBpbmZvIFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb250ZXh0TWVudU1hbmFnZXIgPSBDb250ZXh0TWVudU1hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcbiIsIi8vIEVycm9yIGhhbmRsaW5nIHV0aWxpdHlcbmltcG9ydCB7IGNyZWF0ZUxvZ2dlciB9IGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IGluaXRNYW5hZ2VyIH0gZnJvbSAnLi9pbml0VXRpbHMnO1xuXG5jb25zdCBsb2dnZXIgPSBjcmVhdGVMb2dnZXIoJ0Vycm9ySGFuZGxlcicpO1xuXG4vLyBDdXN0b20gZXJyb3IgdHlwZXNcbmV4cG9ydCBjbGFzcyBFeHRlbnNpb25FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29kZTogc3RyaW5nO1xuICAgIHB1YmxpYyByZWFkb25seSBjb250ZXh0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuXG4gICAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb2RlOiBzdHJpbmcsIGNvbnRleHQ6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5uYW1lID0gJ0V4dGVuc2lvbkVycm9yJztcbiAgICAgICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbml0aWFsaXphdGlvbkVycm9yIGV4dGVuZHMgRXh0ZW5zaW9uRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgY29udGV4dDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9KSB7XG4gICAgICAgIHN1cGVyKG1lc3NhZ2UsICdJTklUX0VSUk9SJywgY29udGV4dCk7XG4gICAgICAgIHRoaXMubmFtZSA9ICdJbml0aWFsaXphdGlvbkVycm9yJztcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQZXJtaXNzaW9uRXJyb3IgZXh0ZW5kcyBFeHRlbnNpb25FcnJvciB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge30pIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSwgJ1BFUk1JU1NJT05fRVJST1InLCBjb250ZXh0KTtcbiAgICAgICAgdGhpcy5uYW1lID0gJ1Blcm1pc3Npb25FcnJvcic7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUnVudGltZUVycm9yIGV4dGVuZHMgRXh0ZW5zaW9uRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgY29udGV4dDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9KSB7XG4gICAgICAgIHN1cGVyKG1lc3NhZ2UsICdSVU5USU1FX0VSUk9SJywgY29udGV4dCk7XG4gICAgICAgIHRoaXMubmFtZSA9ICdSdW50aW1lRXJyb3InO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFByb2Nlc3NpbmdFcnJvciBleHRlbmRzIEV4dGVuc2lvbkVycm9yIHtcbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlLCAnUFJPQ0VTU0lOR19FUlJPUicsIGNvbnRleHQpO1xuICAgICAgICB0aGlzLm5hbWUgPSAnUHJvY2Vzc2luZ0Vycm9yJztcbiAgICB9XG59XG5cbi8vIEVycm9yIGhhbmRsZXIgY2xhc3NcbmV4cG9ydCBjbGFzcyBFcnJvckhhbmRsZXIge1xuICAgIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBFcnJvckhhbmRsZXI7XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge31cblxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogRXJyb3JIYW5kbGVyIHtcbiAgICAgICAgaWYgKCFFcnJvckhhbmRsZXIuaW5zdGFuY2UpIHtcbiAgICAgICAgICAgIEVycm9ySGFuZGxlci5pbnN0YW5jZSA9IG5ldyBFcnJvckhhbmRsZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gRXJyb3JIYW5kbGVyLmluc3RhbmNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBoYW5kbGVFcnJvcihlcnJvcjogdW5rbm93biwgY29udGV4dDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9KToge1xuICAgICAgICBtZXNzYWdlOiBzdHJpbmc7XG4gICAgICAgIGNvZGU6IHN0cmluZztcbiAgICAgICAgY29udGV4dDogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgICB9IHtcbiAgICAgICAgbGV0IGVycm9yTWVzc2FnZTogc3RyaW5nO1xuICAgICAgICBsZXQgZXJyb3JDb2RlOiBzdHJpbmc7XG4gICAgICAgIGxldCBlcnJvckNvbnRleHQ6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7XG4gICAgICAgICAgICAuLi5jb250ZXh0LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgcnVudGltZUF2YWlsYWJsZTogISFjaHJvbWUucnVudGltZSxcbiAgICAgICAgICAgIGV4dGVuc2lvbklkOiBjaHJvbWUucnVudGltZT8uaWQsXG4gICAgICAgICAgICBpc0luaXRpYWxpemVkOiBpbml0TWFuYWdlci5pc0luaXRpYWxpemVkKCdiYWNrZ3JvdW5kJylcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFeHRlbnNpb25FcnJvcikge1xuICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgIGVycm9yQ29kZSA9IGVycm9yLmNvZGU7XG4gICAgICAgICAgICBlcnJvckNvbnRleHQgPSB7IC4uLmVycm9yQ29udGV4dCwgLi4uZXJyb3IuY29udGV4dCB9O1xuICAgICAgICB9IGVsc2UgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICBlcnJvckNvZGUgPSAnVU5LTk9XTl9FUlJPUic7XG4gICAgICAgICAgICBlcnJvckNvbnRleHQgPSB7XG4gICAgICAgICAgICAgICAgLi4uZXJyb3JDb250ZXh0LFxuICAgICAgICAgICAgICAgIGVycm9yTmFtZTogZXJyb3IubmFtZSxcbiAgICAgICAgICAgICAgICBzdGFjazogZXJyb3Iuc3RhY2tcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBTdHJpbmcoZXJyb3IpO1xuICAgICAgICAgICAgZXJyb3JDb2RlID0gJ1VOS05PV05fRVJST1InO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTG9nIHRoZSBlcnJvclxuICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIG9jY3VycmVkOicsIHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yTWVzc2FnZSxcbiAgICAgICAgICAgIGNvZGU6IGVycm9yQ29kZSxcbiAgICAgICAgICAgIGNvbnRleHQ6IGVycm9yQ29udGV4dFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JNZXNzYWdlLFxuICAgICAgICAgICAgY29kZTogZXJyb3JDb2RlLFxuICAgICAgICAgICAgY29udGV4dDogZXJyb3JDb250ZXh0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNoZWNrUnVudGltZUhlYWx0aCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKCFjaHJvbWUucnVudGltZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcignQ2hyb21lIHJ1bnRpbWUgbm90IGF2YWlsYWJsZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjaHJvbWUucnVudGltZS5pZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcignRXh0ZW5zaW9uIElEIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGlmIG1hbmlmZXN0IGlzIGFjY2Vzc2libGVcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG1hbmlmZXN0ID0gY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKTtcbiAgICAgICAgICAgIGlmICghbWFuaWZlc3QpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKCdNYW5pZmVzdCBub3QgYWNjZXNzaWJsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcignRmFpbGVkIHRvIGFjY2VzcyBtYW5pZmVzdCcsIHtcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyB2YWxpZGF0ZVBlcm1pc3Npb25zKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcGVybWlzc2lvbnMgPSBhd2FpdCBpbml0TWFuYWdlci5jaGVja1Blcm1pc3Npb25zKCk7XG4gICAgICAgICAgICBjb25zdCBob3N0UGVybWlzc2lvbnMgPSBhd2FpdCBpbml0TWFuYWdlci52YWxpZGF0ZUhvc3RQZXJtaXNzaW9ucygpO1xuXG4gICAgICAgICAgICBpZiAoIXBlcm1pc3Npb25zIHx8ICFob3N0UGVybWlzc2lvbnMpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUGVybWlzc2lvbkVycm9yKCdSZXF1aXJlZCBwZXJtaXNzaW9ucyBub3QgZ3JhbnRlZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgcGVybWlzc2lvbnMsXG4gICAgICAgICAgICAgICAgICAgIGhvc3RQZXJtaXNzaW9uc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgUGVybWlzc2lvbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGVybWlzc2lvbkVycm9yKCdGYWlsZWQgdG8gdmFsaWRhdGUgcGVybWlzc2lvbnMnLCB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgaXNSZWNvdmVyYWJsZShlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFeHRlbnNpb25FcnJvcikge1xuICAgICAgICAgICAgLy8gRGVmaW5lIHdoaWNoIGVycm9yIHR5cGVzL2NvZGVzIGFyZSByZWNvdmVyYWJsZVxuICAgICAgICAgICAgY29uc3QgcmVjb3ZlcmFibGVDb2RlcyA9IFsnUFJPQ0VTU0lOR19FUlJPUiddO1xuICAgICAgICAgICAgcmV0dXJuIHJlY292ZXJhYmxlQ29kZXMuaW5jbHVkZXMoZXJyb3IuY29kZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRFcnJvclJlc3BvbnNlKGVycm9yOiB1bmtub3duKToge1xuICAgICAgICBlcnJvcjogc3RyaW5nO1xuICAgICAgICBjb2RlOiBzdHJpbmc7XG4gICAgICAgIGRlYnVnOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICAgIH0ge1xuICAgICAgICBjb25zdCB7IG1lc3NhZ2UsIGNvZGUsIGNvbnRleHQgfSA9IHRoaXMuaGFuZGxlRXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXJyb3I6IG1lc3NhZ2UsXG4gICAgICAgICAgICBjb2RlLFxuICAgICAgICAgICAgZGVidWc6IHtcbiAgICAgICAgICAgICAgICAuLi5pbml0TWFuYWdlci5kZWJ1Z0luZm8oKSxcbiAgICAgICAgICAgICAgICBlcnJvckNvbnRleHQ6IGNvbnRleHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBlcnJvckhhbmRsZXIgPSBFcnJvckhhbmRsZXIuZ2V0SW5zdGFuY2UoKTtcbiIsImltcG9ydCB7IGNyZWF0ZUxvZ2dlciwgTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHsgTG9nQ29udGV4dCB9IGZyb20gJy4vbG9nZ2VyJztcblxuaW50ZXJmYWNlIEluaXRTdGF0dXMgZXh0ZW5kcyBMb2dDb250ZXh0IHtcbiAgICBpbml0aWFsaXplZDogYm9vbGVhbjtcbiAgICBlcnJvcj86IHN0cmluZztcbiAgICBtZXNzYWdlPzogc3RyaW5nO1xuICAgIFtrZXk6IHN0cmluZ106IGFueTtcbn1cblxuY2xhc3MgSW5pdGlhbGl6YXRpb25NYW5hZ2VyIHtcbiAgICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogSW5pdGlhbGl6YXRpb25NYW5hZ2VyO1xuICAgIHByaXZhdGUgbG9nZ2VyOiBMb2dnZXI7XG4gICAgcHJpdmF0ZSBpbml0U3RhdHVzOiBNYXA8c3RyaW5nLCBJbml0U3RhdHVzPjtcbiAgICBwcml2YXRlIHJlYWR5Q2FsbGJhY2tzOiBNYXA8c3RyaW5nLCBBcnJheTwoKSA9PiB2b2lkPj47XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxvZ2dlciA9IGNyZWF0ZUxvZ2dlcignSW5pdE1hbmFnZXInKTtcbiAgICAgICAgdGhpcy5pbml0U3RhdHVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnJlYWR5Q2FsbGJhY2tzID0gbmV3IE1hcCgpO1xuICAgICAgICBcbiAgICAgICAgLy8gTGlzdGVuIGZvciBleHRlbnNpb24gbGlmZWN5Y2xlIGV2ZW50c1xuICAgICAgICB0aGlzLnNldHVwRXh0ZW5zaW9uTGlzdGVuZXJzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBJbml0aWFsaXphdGlvbk1hbmFnZXIge1xuICAgICAgICBpZiAoIUluaXRpYWxpemF0aW9uTWFuYWdlci5pbnN0YW5jZSkge1xuICAgICAgICAgICAgSW5pdGlhbGl6YXRpb25NYW5hZ2VyLmluc3RhbmNlID0gbmV3IEluaXRpYWxpemF0aW9uTWFuYWdlcigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBJbml0aWFsaXphdGlvbk1hbmFnZXIuaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXR1cEV4dGVuc2lvbkxpc3RlbmVycygpOiB2b2lkIHtcbiAgICAgICAgLy8gTGlzdGVuIGZvciBleHRlbnNpb24gaW5zdGFsbC91cGRhdGUgZXZlbnRzXG4gICAgICAgIGNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKChkZXRhaWxzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZ0V2ZW50KCdvbkluc3RhbGxlZCcsIHtcbiAgICAgICAgICAgICAgICByZWFzb246IGRldGFpbHMucmVhc29uLFxuICAgICAgICAgICAgICAgIHByZXZpb3VzVmVyc2lvbjogZGV0YWlscy5wcmV2aW91c1ZlcnNpb24sXG4gICAgICAgICAgICAgICAgaWQ6IGRldGFpbHMuaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yIGV4dGVuc2lvbiBzdGFydHVwXG4gICAgICAgIGlmIChjaHJvbWUucnVudGltZS5vblN0YXJ0dXApIHtcbiAgICAgICAgICAgIGNocm9tZS5ydW50aW1lLm9uU3RhcnR1cC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2dFdmVudCgnb25TdGFydHVwJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBtYXJrSW5pdGlhbGl6ZWQoY29udGV4dDogc3RyaW5nLCBkZXRhaWxzPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQge1xuICAgICAgICBjb25zdCBzdGF0dXM6IEluaXRTdGF0dXMgPSB7XG4gICAgICAgICAgICBpbml0aWFsaXplZDogdHJ1ZSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICBkZXRhaWxzXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaW5pdFN0YXR1cy5zZXQoY29udGV4dCwgc3RhdHVzKTtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhgJHtjb250ZXh0fSBpbml0aWFsaXplZGAsIHN0YXR1cyk7XG5cbiAgICAgICAgLy8gVHJpZ2dlciBhbnkgd2FpdGluZyBjYWxsYmFja3NcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5yZWFkeUNhbGxiYWNrcy5nZXQoY29udGV4dCkgfHwgW107XG4gICAgICAgIGNhbGxiYWNrcy5mb3JFYWNoKGNhbGxiYWNrID0+IGNhbGxiYWNrKCkpO1xuICAgICAgICB0aGlzLnJlYWR5Q2FsbGJhY2tzLmRlbGV0ZShjb250ZXh0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbWFya0Vycm9yKGNvbnRleHQ6IHN0cmluZywgZXJyb3I6IEVycm9yIHwgc3RyaW5nLCBkZXRhaWxzPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQge1xuICAgICAgICBjb25zdCBzdGF0dXM6IEluaXRTdGF0dXMgPSB7XG4gICAgICAgICAgICBpbml0aWFsaXplZDogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcixcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICBkZXRhaWxzXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaW5pdFN0YXR1cy5zZXQoY29udGV4dCwgc3RhdHVzKTtcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYCR7Y29udGV4dH0gaW5pdGlhbGl6YXRpb24gZmFpbGVkYCwgc3RhdHVzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaXNJbml0aWFsaXplZChjb250ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5pbml0U3RhdHVzLmdldChjb250ZXh0KTtcbiAgICAgICAgcmV0dXJuIHN0YXR1cz8uaW5pdGlhbGl6ZWQgfHwgZmFsc2U7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFN0YXR1cyhjb250ZXh0OiBzdHJpbmcpOiBJbml0U3RhdHVzIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5pdFN0YXR1cy5nZXQoY29udGV4dCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEFsbFN0YXR1cygpOiBSZWNvcmQ8c3RyaW5nLCBJbml0U3RhdHVzPiB7XG4gICAgICAgIGNvbnN0IHN0YXR1czogUmVjb3JkPHN0cmluZywgSW5pdFN0YXR1cz4gPSB7fTtcbiAgICAgICAgdGhpcy5pbml0U3RhdHVzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgIHN0YXR1c1trZXldID0gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyB3YWl0Rm9ySW5pdGlhbGl6YXRpb24oY29udGV4dDogc3RyaW5nLCB0aW1lb3V0OiBudW1iZXIgPSA1MDAwKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGlmICh0aGlzLmlzSW5pdGlhbGl6ZWQoY29udGV4dCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBJbml0aWFsaXphdGlvbiB0aW1lb3V0IGZvciAke2NvbnRleHR9YCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0KTtcblxuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMucmVhZHlDYWxsYmFja3MuZ2V0KGNvbnRleHQpIHx8IFtdO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgdGhpcy5yZWFkeUNhbGxiYWNrcy5zZXQoY29udGV4dCwgY2FsbGJhY2tzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGxvZ0V2ZW50KGV2ZW50OiBzdHJpbmcsIGRldGFpbHM/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oYEV4dGVuc2lvbiBldmVudDogJHtldmVudH1gLCB7XG4gICAgICAgICAgICBldmVudCxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIC4uLmRldGFpbHNcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNoZWNrUGVybWlzc2lvbnMoKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBib29sZWFuPj4ge1xuICAgICAgICBjb25zdCBwZXJtaXNzaW9ucyA9IFtcbiAgICAgICAgICAgICdhY3RpdmVUYWInLFxuICAgICAgICAgICAgJ2NvbnRleHRNZW51cycsXG4gICAgICAgICAgICAnc2NyaXB0aW5nJyxcbiAgICAgICAgICAgICdzdG9yYWdlJyxcbiAgICAgICAgICAgICd0YWJzJ1xuICAgICAgICBdO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdHM6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge307XG4gICAgICAgIFxuICAgICAgICBmb3IgKGNvbnN0IHBlcm1pc3Npb24gb2YgcGVybWlzc2lvbnMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRlZCA9IGF3YWl0IGNocm9tZS5wZXJtaXNzaW9ucy5jb250YWlucyh7IHBlcm1pc3Npb25zOiBbcGVybWlzc2lvbl0gfSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1twZXJtaXNzaW9uXSA9IGdyYW50ZWQ7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBjaGVja2luZyBwZXJtaXNzaW9uICR7cGVybWlzc2lvbn06YCwgeyBcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbcGVybWlzc2lvbl0gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyB2YWxpZGF0ZUhvc3RQZXJtaXNzaW9ucygpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+PiB7XG4gICAgICAgIGNvbnN0IGhvc3RzID0gW1xuICAgICAgICAgICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6Ki8qJyxcbiAgICAgICAgICAgICdodHRwOi8vMTI3LjAuMC4xOiovKidcbiAgICAgICAgXTtcblxuICAgICAgICBjb25zdCByZXN1bHRzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgICAgICBcbiAgICAgICAgZm9yIChjb25zdCBob3N0IG9mIGhvc3RzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50ZWQgPSBhd2FpdCBjaHJvbWUucGVybWlzc2lvbnMuY29udGFpbnMoeyBvcmlnaW5zOiBbaG9zdF0gfSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1tob3N0XSA9IGdyYW50ZWQ7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBjaGVja2luZyBob3N0IHBlcm1pc3Npb24gJHtob3N0fTpgLCB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbaG9zdF0gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWJ1Z0luZm8oKTogUmVjb3JkPHN0cmluZywgYW55PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbml0U3RhdHVzOiB0aGlzLmdldEFsbFN0YXR1cygpLFxuICAgICAgICAgICAgZXh0ZW5zaW9uSWQ6IGNocm9tZS5ydW50aW1lLmlkLFxuICAgICAgICAgICAgbWFuaWZlc3RWZXJzaW9uOiBjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpLm1hbmlmZXN0X3ZlcnNpb24sXG4gICAgICAgICAgICBwZXJtaXNzaW9uczogY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKS5wZXJtaXNzaW9ucyxcbiAgICAgICAgICAgIGhvc3RQZXJtaXNzaW9uczogY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKS5ob3N0X3Blcm1pc3Npb25zLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgaW5pdE1hbmFnZXIgPSBJbml0aWFsaXphdGlvbk1hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcbiIsIi8vIExvZ2dlciB1dGlsaXR5IGZvciB0aGUgZXh0ZW5zaW9uXG50eXBlIExvZ0xldmVsID0gJ2RlYnVnJyB8ICdpbmZvJyB8ICd3YXJuJyB8ICdlcnJvcic7XG5cbmV4cG9ydCB0eXBlIExvZ1ZhbHVlID0gc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQgfCBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuXG5leHBvcnQgaW50ZXJmYWNlIExvZ0NvbnRleHQge1xuICAgIFtrZXk6IHN0cmluZ106IExvZ1ZhbHVlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ2dlciB7XG4gICAgZGVidWc8VCBleHRlbmRzIExvZ0NvbnRleHQgPSBMb2dDb250ZXh0PihtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBUKTogdm9pZDtcbiAgICBpbmZvPFQgZXh0ZW5kcyBMb2dDb250ZXh0ID0gTG9nQ29udGV4dD4obWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogVCk6IHZvaWQ7XG4gICAgd2FybjxUIGV4dGVuZHMgTG9nQ29udGV4dCA9IExvZ0NvbnRleHQ+KG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFQpOiB2b2lkO1xuICAgIGVycm9yPFQgZXh0ZW5kcyBMb2dDb250ZXh0ID0gTG9nQ29udGV4dD4obWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogVCk6IHZvaWQ7XG59XG5cbmNsYXNzIENvbnNvbGVMb2dnZXIgaW1wbGVtZW50cyBMb2dnZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgbmFtZXNwYWNlOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBtaW5MZXZlbDogTG9nTGV2ZWw7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lc3BhY2U6IHN0cmluZywgbWluTGV2ZWw6IExvZ0xldmVsID0gJ2RlYnVnJykge1xuICAgICAgICB0aGlzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICAgICAgdGhpcy5taW5MZXZlbCA9IG1pbkxldmVsO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvdWxkTG9nKGxldmVsOiBMb2dMZXZlbCk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBsZXZlbHM6IExvZ0xldmVsW10gPSBbJ2RlYnVnJywgJ2luZm8nLCAnd2FybicsICdlcnJvciddO1xuICAgICAgICBjb25zdCBtaW5MZXZlbEluZGV4ID0gbGV2ZWxzLmluZGV4T2YodGhpcy5taW5MZXZlbCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRMZXZlbEluZGV4ID0gbGV2ZWxzLmluZGV4T2YobGV2ZWwpO1xuICAgICAgICByZXR1cm4gY3VycmVudExldmVsSW5kZXggPj0gbWluTGV2ZWxJbmRleDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGZvcm1hdE1lc3NhZ2UobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYFske3RoaXMubmFtZXNwYWNlfV0gWyR7bGV2ZWwudG9VcHBlckNhc2UoKX1dICR7bWVzc2FnZX1gO1xuICAgIH1cblxuICAgIHByaXZhdGUgZm9ybWF0Q29udGV4dDxUIGV4dGVuZHMgTG9nQ29udGV4dD4oY29udGV4dD86IFQpOiBUIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgaWYgKCFjb250ZXh0KSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gY29udGV4dDtcbiAgICB9XG5cbiAgICBkZWJ1ZzxUIGV4dGVuZHMgTG9nQ29udGV4dD4obWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogVCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuc2hvdWxkTG9nKCdkZWJ1ZycpKSByZXR1cm47XG4gICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKHRoaXMuZm9ybWF0TWVzc2FnZSgnZGVidWcnLCBtZXNzYWdlKSwgdGhpcy5mb3JtYXRDb250ZXh0KGNvbnRleHQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcodGhpcy5mb3JtYXRNZXNzYWdlKCdkZWJ1ZycsIG1lc3NhZ2UpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGluZm88VCBleHRlbmRzIExvZ0NvbnRleHQ+KG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFQpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLnNob3VsZExvZygnaW5mbycpKSByZXR1cm47XG4gICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8odGhpcy5mb3JtYXRNZXNzYWdlKCdpbmZvJywgbWVzc2FnZSksIHRoaXMuZm9ybWF0Q29udGV4dChjb250ZXh0KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8odGhpcy5mb3JtYXRNZXNzYWdlKCdpbmZvJywgbWVzc2FnZSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgd2FybjxUIGV4dGVuZHMgTG9nQ29udGV4dD4obWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogVCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuc2hvdWxkTG9nKCd3YXJuJykpIHJldHVybjtcbiAgICAgICAgaWYgKGNvbnRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybih0aGlzLmZvcm1hdE1lc3NhZ2UoJ3dhcm4nLCBtZXNzYWdlKSwgdGhpcy5mb3JtYXRDb250ZXh0KGNvbnRleHQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybih0aGlzLmZvcm1hdE1lc3NhZ2UoJ3dhcm4nLCBtZXNzYWdlKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlcnJvcjxUIGV4dGVuZHMgTG9nQ29udGV4dD4obWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogVCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuc2hvdWxkTG9nKCdlcnJvcicpKSByZXR1cm47XG4gICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMuZm9ybWF0TWVzc2FnZSgnZXJyb3InLCBtZXNzYWdlKSwgdGhpcy5mb3JtYXRDb250ZXh0KGNvbnRleHQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5mb3JtYXRNZXNzYWdlKCdlcnJvcicsIG1lc3NhZ2UpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvZ2dlcihuYW1lc3BhY2U6IHN0cmluZywgbWluTGV2ZWw6IExvZ0xldmVsID0gJ2RlYnVnJyk6IExvZ2dlciB7XG4gICAgcmV0dXJuIG5ldyBDb25zb2xlTG9nZ2VyKG5hbWVzcGFjZSwgbWluTGV2ZWwpO1xufVxuIiwiaW1wb3J0IHsgY3JlYXRlTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHsgaW5pdE1hbmFnZXIgfSBmcm9tICcuL2luaXRVdGlscyc7XG5pbXBvcnQgeyBcbiAgICBFeHRlbnNpb25NZXNzYWdlLCBcbiAgICBFeHRlbnNpb25SZXNwb25zZSxcbiAgICBNZXNzYWdlVHlwZSxcbiAgICBDb250ZW50U2NyaXB0UmVhZHlNZXNzYWdlLFxuICAgIFByb2Nlc3NUZXh0TWVzc2FnZSxcbiAgICBDb250ZXh0TWVudUFjdGlvbk1lc3NhZ2UsXG4gICAgVXBkYXRlU2V0dGluZ3NNZXNzYWdlLFxuICAgIFRhc2tTdGF0dXNNZXNzYWdlLFxuICAgIEdldERlYnVnSW5mb01lc3NhZ2Vcbn0gZnJvbSAnLi4vdHlwZXMvbWVzc2FnZXMnO1xuXG5jb25zdCBsb2dnZXIgPSBjcmVhdGVMb2dnZXIoJ01lc3NhZ2luZycpO1xuXG50eXBlIE1lc3NhZ2VUeXBlTWFwID0ge1xuICAgICdjb250ZW50U2NyaXB0UmVhZHknOiBDb250ZW50U2NyaXB0UmVhZHlNZXNzYWdlO1xuICAgICdwcm9jZXNzVGV4dCc6IFByb2Nlc3NUZXh0TWVzc2FnZTtcbiAgICAnY29udGV4dE1lbnVBY3Rpb24nOiBDb250ZXh0TWVudUFjdGlvbk1lc3NhZ2U7XG4gICAgJ3VwZGF0ZVNldHRpbmdzJzogVXBkYXRlU2V0dGluZ3NNZXNzYWdlO1xuICAgICd0YXNrU3RhdHVzJzogVGFza1N0YXR1c01lc3NhZ2U7XG4gICAgJ2dldERlYnVnSW5mbyc6IEdldERlYnVnSW5mb01lc3NhZ2U7XG59XG5cbnR5cGUgTWVzc2FnZUhhbmRsZXI8VCBleHRlbmRzIE1lc3NhZ2VUeXBlPiA9IChcbiAgICBtZXNzYWdlOiBNZXNzYWdlVHlwZU1hcFtUXSxcbiAgICBzZW5kZXI6IGNocm9tZS5ydW50aW1lLk1lc3NhZ2VTZW5kZXJcbikgPT4gUHJvbWlzZTxFeHRlbnNpb25SZXNwb25zZT47XG5cbmNsYXNzIE1lc3NhZ2luZ01hbmFnZXIge1xuICAgIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBNZXNzYWdpbmdNYW5hZ2VyO1xuICAgIHByaXZhdGUgaGFuZGxlcnM6IE1hcDxNZXNzYWdlVHlwZSwgTWVzc2FnZUhhbmRsZXI8YW55Pj47XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmhhbmRsZXJzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnNldHVwTWVzc2FnZUxpc3RlbmVyKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBNZXNzYWdpbmdNYW5hZ2VyIHtcbiAgICAgICAgaWYgKCFNZXNzYWdpbmdNYW5hZ2VyLmluc3RhbmNlKSB7XG4gICAgICAgICAgICBNZXNzYWdpbmdNYW5hZ2VyLmluc3RhbmNlID0gbmV3IE1lc3NhZ2luZ01hbmFnZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWVzc2FnaW5nTWFuYWdlci5pbnN0YW5jZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldHVwTWVzc2FnZUxpc3RlbmVyKCk6IHZvaWQge1xuICAgICAgICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2U6IEV4dGVuc2lvbk1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBsb2dnZXIuZGVidWcoJ1JlY2VpdmVkIG1lc3NhZ2U6JywgeyB0eXBlOiBtZXNzYWdlLnR5cGUsIHNlbmRlcjogc2VuZGVyLmlkIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5oYW5kbGVycy5nZXQobWVzc2FnZS50eXBlKTtcbiAgICAgICAgICAgIGlmICghaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdObyBoYW5kbGVyIHJlZ2lzdGVyZWQgZm9yIG1lc3NhZ2UgdHlwZTonLCB7IHR5cGU6IG1lc3NhZ2UudHlwZSB9KTtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBObyBoYW5kbGVyIGZvciBtZXNzYWdlIHR5cGU6ICR7bWVzc2FnZS50eXBlfWAsXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnOiBpbml0TWFuYWdlci5kZWJ1Z0luZm8oKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaGFuZGxlcihtZXNzYWdlIGFzIGFueSwgc2VuZGVyKVxuICAgICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKCdIYW5kbGVyIHJlc3BvbnNlOicsIHsgdHlwZTogbWVzc2FnZS50eXBlLCByZXNwb25zZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignSGFuZGxlciBlcnJvcjonLCB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogbWVzc2FnZS50eXBlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWc6IGluaXRNYW5hZ2VyLmRlYnVnSW5mbygpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gV2lsbCByZXNwb25kIGFzeW5jaHJvbm91c2x5XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWdpc3RlckhhbmRsZXI8VCBleHRlbmRzIE1lc3NhZ2VUeXBlPihcbiAgICAgICAgdHlwZTogVCxcbiAgICAgICAgaGFuZGxlcjogTWVzc2FnZUhhbmRsZXI8VD5cbiAgICApOiB2b2lkIHtcbiAgICAgICAgdGhpcy5oYW5kbGVycy5zZXQodHlwZSwgaGFuZGxlcik7XG4gICAgICAgIGxvZ2dlci5kZWJ1ZygnUmVnaXN0ZXJlZCBoYW5kbGVyIGZvciBtZXNzYWdlIHR5cGU6JywgeyB0eXBlIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBzZW5kTWVzc2FnZTxUIGV4dGVuZHMgTWVzc2FnZVR5cGU+KFxuICAgICAgICBtZXNzYWdlOiBNZXNzYWdlVHlwZU1hcFtUXVxuICAgICk6IFByb21pc2U8RXh0ZW5zaW9uUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZygnU2VuZGluZyBtZXNzYWdlOicsIHsgdHlwZTogbWVzc2FnZS50eXBlIH0pO1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZygnTWVzc2FnZSByZXNwb25zZTonLCB7IHR5cGU6IG1lc3NhZ2UudHlwZSwgcmVzcG9uc2UgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZTonLCB7IFxuICAgICAgICAgICAgICAgIHR5cGU6IG1lc3NhZ2UudHlwZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2VuZFRhYk1lc3NhZ2U8VCBleHRlbmRzIE1lc3NhZ2VUeXBlPihcbiAgICAgICAgdGFiSWQ6IG51bWJlcixcbiAgICAgICAgbWVzc2FnZTogTWVzc2FnZVR5cGVNYXBbVF1cbiAgICApOiBQcm9taXNlPEV4dGVuc2lvblJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2dnZXIuZGVidWcoJ1NlbmRpbmcgdGFiIG1lc3NhZ2U6JywgeyB0YWJJZCwgdHlwZTogbWVzc2FnZS50eXBlIH0pO1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCwgbWVzc2FnZSk7XG4gICAgICAgICAgICBsb2dnZXIuZGVidWcoJ1RhYiBtZXNzYWdlIHJlc3BvbnNlOicsIHsgdGFiSWQsIHR5cGU6IG1lc3NhZ2UudHlwZSwgcmVzcG9uc2UgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgdGFiIG1lc3NhZ2U6Jywge1xuICAgICAgICAgICAgICAgIHRhYklkLFxuICAgICAgICAgICAgICAgIHR5cGU6IG1lc3NhZ2UudHlwZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBtZXNzYWdpbmdNYW5hZ2VyID0gTWVzc2FnaW5nTWFuYWdlci5nZXRJbnN0YW5jZSgpO1xuIiwiaW1wb3J0IHsgY3JlYXRlTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHsgQ2VsZXJ5Q2xpZW50IH0gZnJvbSAnLi9jZWxlcnlDbGllbnQnO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB7IExvZ0NvbnRleHQgfSBmcm9tICcuL2xvZ2dlcic7XG5cbmludGVyZmFjZSBQcm9jZXNzaW5nUmVzdWx0IHtcbiAgICB0YXNrSWQ6IHN0cmluZztcbiAgICBzdGF0dXM6IHN0cmluZztcbiAgICByZXN1bHQ/OiBhbnk7XG4gICAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBQcm9jZXNzaW5nT3B0aW9ucyBleHRlbmRzIExvZ0NvbnRleHQge1xuICAgIGxhbmd1YWdlPzogc3RyaW5nO1xuICAgIHZvaWNlPzogc3RyaW5nO1xuICAgIHJhdGU/OiBudW1iZXI7XG4gICAgcGl0Y2g/OiBudW1iZXI7XG4gICAgdm9sdW1lPzogbnVtYmVyO1xuICAgIGVtb3Rpb25hbENvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICAgIHRleHRTdHJ1Y3R1cmU/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICAgIFtrZXk6IHN0cmluZ106IGFueTtcbn1cblxuY29uc3QgbG9nZ2VyID0gY3JlYXRlTG9nZ2VyKCdUZXh0UHJvY2Vzc29yJyk7XG5jb25zdCBjZWxlcnlDbGllbnQgPSBuZXcgQ2VsZXJ5Q2xpZW50KGNvbmZpZy5BUElfRU5EUE9JTlQpO1xuXG5jbGFzcyBUZXh0UHJvY2Vzc2luZ01hbmFnZXIge1xuICAgIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBUZXh0UHJvY2Vzc2luZ01hbmFnZXI7XG4gICAgcHJpdmF0ZSBhY3RpdmVUYXNrczogTWFwPHN0cmluZywgUHJvY2Vzc2luZ1Jlc3VsdD47XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmFjdGl2ZVRhc2tzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogVGV4dFByb2Nlc3NpbmdNYW5hZ2VyIHtcbiAgICAgICAgaWYgKCFUZXh0UHJvY2Vzc2luZ01hbmFnZXIuaW5zdGFuY2UpIHtcbiAgICAgICAgICAgIFRleHRQcm9jZXNzaW5nTWFuYWdlci5pbnN0YW5jZSA9IG5ldyBUZXh0UHJvY2Vzc2luZ01hbmFnZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gVGV4dFByb2Nlc3NpbmdNYW5hZ2VyLmluc3RhbmNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBwcm9jZXNzVGV4dCh0ZXh0OiBzdHJpbmcsIG9wdGlvbnM6IFByb2Nlc3NpbmdPcHRpb25zID0ge30pOiBQcm9taXNlPFByb2Nlc3NpbmdSZXN1bHQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZygnUHJvY2Vzc2luZyB0ZXh0OicsIHsgbGVuZ3RoOiB0ZXh0Lmxlbmd0aCwgb3B0aW9ucyB9KTtcblxuICAgICAgICAgICAgY29uc3QgdGFza0lkID0gYXdhaXQgY2VsZXJ5Q2xpZW50LnByb2Nlc3NUZXh0KHRleHQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2VsZXJ5Q2xpZW50LnBvbGxUYXNrU3RhdHVzKHRhc2tJZCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdUZXh0IHByb2Nlc3NpbmcgcmVzdWx0JywgeyBcbiAgICAgICAgICAgICAgICB0YXNrSWQsIFxuICAgICAgICAgICAgICAgIHN0YXR1czogcmVzdWx0LnN0YXR1cyxcbiAgICAgICAgICAgICAgICBlcnJvcjogcmVzdWx0LmVycm9yIHx8IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuYWN0aXZlVGFza3Muc2V0KHJlc3VsdC50YXNrSWQsIHJlc3VsdCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRhc2tJZDogcmVzdWx0LnRhc2tJZCxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHJlc3VsdC5zdGF0dXMsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiByZXN1bHQucmVzdWx0LFxuICAgICAgICAgICAgICAgIGVycm9yOiByZXN1bHQuZXJyb3JcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgdGV4dCcsIHsgXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgY2hlY2tUYXNrU3RhdHVzKHRhc2tJZDogc3RyaW5nKTogUHJvbWlzZTxQcm9jZXNzaW5nUmVzdWx0PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBjZWxlcnlDbGllbnQucG9sbFRhc2tTdGF0dXModGFza0lkKTtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlVGFza3Muc2V0KHRhc2tJZCwgc3RhdHVzKTtcbiAgICAgICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGNoZWNraW5nIHRhc2sgc3RhdHVzOicsIHtcbiAgICAgICAgICAgICAgICB0YXNrSWQsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNhbmNlbFRhc2sodGFza0lkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGNlbGVyeUNsaWVudC5jYW5jZWxUYXNrKHRhc2tJZCk7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVRhc2tzLmRlbGV0ZSh0YXNrSWQpO1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1Rhc2sgY2FuY2VsbGVkOicsIHsgdGFza0lkIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBjYW5jZWxsaW5nIHRhc2s6Jywge1xuICAgICAgICAgICAgICAgIHRhc2tJZCxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QWN0aXZlVGFzayh0YXNrSWQ6IHN0cmluZyk6IFByb2Nlc3NpbmdSZXN1bHQgfCB1bmRlZmluZWQge1xuICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmVUYXNrcy5nZXQodGFza0lkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QWxsQWN0aXZlVGFza3MoKTogUHJvY2Vzc2luZ1Jlc3VsdFtdIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5hY3RpdmVUYXNrcy52YWx1ZXMoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGNsZWFudXBUYXNrKHRhc2tJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWN0aXZlVGFza3MuZGVsZXRlKHRhc2tJZCk7XG4gICAgICAgIGxvZ2dlci5kZWJ1ZygnVGFzayBjbGVhbmVkIHVwOicsIHsgdGFza0lkIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHRleHRQcm9jZXNzaW5nTWFuYWdlciA9IFRleHRQcm9jZXNzaW5nTWFuYWdlci5nZXRJbnN0YW5jZSgpO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBCYWNrZ3JvdW5kIHNjcmlwdCBmb3IgaGFuZGxpbmcgdGV4dC10by1zcGVlY2ggcHJvY2Vzc2luZ1xuaW1wb3J0IHsgY3JlYXRlTG9nZ2VyIH0gZnJvbSAnLi91dGlscy9sb2dnZXInO1xuaW1wb3J0IHsgaW5pdE1hbmFnZXIgfSBmcm9tICcuL3V0aWxzL2luaXRVdGlscyc7XG5pbXBvcnQgeyBtZXNzYWdpbmdNYW5hZ2VyIH0gZnJvbSAnLi91dGlscy9tZXNzYWdpbmcnO1xuaW1wb3J0IHsgY29udGV4dE1lbnVNYW5hZ2VyIH0gZnJvbSAnLi91dGlscy9jb250ZXh0TWVudSc7XG5pbXBvcnQgeyB0ZXh0UHJvY2Vzc2luZ01hbmFnZXIgfSBmcm9tICcuL3V0aWxzL3RleHRQcm9jZXNzb3InO1xuaW1wb3J0IHsgU3RvcmFnZVNlcnZpY2UgfSBmcm9tICcuL3NlcnZpY2VzL3N0b3JhZ2UnO1xuaW1wb3J0IHsgZXJyb3JIYW5kbGVyLCBJbml0aWFsaXphdGlvbkVycm9yLCBQcm9jZXNzaW5nRXJyb3IgfSBmcm9tICcuL3V0aWxzL2Vycm9ySGFuZGxlcic7XG5pbXBvcnQgeyBcbiAgICBDb250ZW50U2NyaXB0UmVhZHlNZXNzYWdlLFxuICAgIFByb2Nlc3NUZXh0TWVzc2FnZSxcbiAgICBHZXREZWJ1Z0luZm9NZXNzYWdlLFxuICAgIEV4dGVuc2lvbk1lc3NhZ2UsXG4gICAgRXh0ZW5zaW9uUmVzcG9uc2UsXG4gICAgQ29udGVudFNjcmlwdFJlYWR5UmVzcG9uc2UsXG4gICAgUHJvY2Vzc1RleHRSZXNwb25zZSxcbiAgICBHZXREZWJ1Z0luZm9SZXNwb25zZSxcbiAgICBCYXNlRXJyb3JSZXNwb25zZVxufSBmcm9tICcuL3R5cGVzL21lc3NhZ2VzJztcblxuY29uc3QgbG9nZ2VyID0gY3JlYXRlTG9nZ2VyKCdCYWNrZ3JvdW5kJyk7XG5jb25zdCBzdG9yYWdlU2VydmljZSA9IFN0b3JhZ2VTZXJ2aWNlLmdldEluc3RhbmNlKCk7XG5cbi8vIEluaXRpYWxpemUgZXh0ZW5zaW9uXG5mdW5jdGlvbiBzZXR1cE1lc3NhZ2VIYW5kbGVycygpIHtcbiAgICAvLyBIYW5kbGUgY29udGVudCBzY3JpcHQgcmVhZHkgbWVzc2FnZVxuICAgIG1lc3NhZ2luZ01hbmFnZXIucmVnaXN0ZXJIYW5kbGVyPCdjb250ZW50U2NyaXB0UmVhZHknPihcbiAgICAgICAgJ2NvbnRlbnRTY3JpcHRSZWFkeScsIFxuICAgICAgICBhc3luYyAobWVzc2FnZSk6IFByb21pc2U8Q29udGVudFNjcmlwdFJlYWR5UmVzcG9uc2U+ID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZXJyb3JIYW5kbGVyLmNoZWNrUnVudGltZUhlYWx0aCgpO1xuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdDb250ZW50IHNjcmlwdCByZWFkeScpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6ICdhY2tub3dsZWRnZWQnLFxuICAgICAgICAgICAgICAgICAgICBkZWJ1ZzogaW5pdE1hbmFnZXIuZGVidWdJbmZvKClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGVycm9yOiBlcnJvck1lc3NhZ2UsIGNvZGUsIGRlYnVnIH0gPSBlcnJvckhhbmRsZXIuZ2V0RXJyb3JSZXNwb25zZShlcnJvcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3JNZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICBjb2RlLFxuICAgICAgICAgICAgICAgICAgICBkZWJ1Z1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gSGFuZGxlIHRleHQgcHJvY2Vzc2luZyByZXF1ZXN0XG4gICAgbWVzc2FnaW5nTWFuYWdlci5yZWdpc3RlckhhbmRsZXI8J3Byb2Nlc3NUZXh0Jz4oXG4gICAgICAgICdwcm9jZXNzVGV4dCcsXG4gICAgICAgIGFzeW5jIChtZXNzYWdlKTogUHJvbWlzZTxQcm9jZXNzVGV4dFJlc3BvbnNlPiA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGVycm9ySGFuZGxlci5jaGVja1J1bnRpbWVIZWFsdGgoKTtcblxuICAgICAgICAgICAgICAgIGlmICghaW5pdE1hbmFnZXIuaXNJbml0aWFsaXplZCgnYmFja2dyb3VuZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBJbml0aWFsaXphdGlvbkVycm9yKCdCYWNrZ3JvdW5kIHNjcmlwdCBub3QgZnVsbHkgaW5pdGlhbGl6ZWQnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBHZXQgY3VycmVudCBUVFMgc2V0dGluZ3NcbiAgICAgICAgICAgICAgICBjb25zdCB0dHNTZXR0aW5ncyA9IGF3YWl0IHN0b3JhZ2VTZXJ2aWNlLmdldFRUU1NldHRpbmdzKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBNZXJnZSBzZXR0aW5ncyB3aXRoIHJlcXVlc3Qgb3B0aW9uc1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIC4uLnR0c1NldHRpbmdzLFxuICAgICAgICAgICAgICAgICAgICAuLi5tZXNzYWdlLm9wdGlvbnNcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGV4dFByb2Nlc3NpbmdNYW5hZ2VyLnByb2Nlc3NUZXh0KG1lc3NhZ2UudGV4dCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQgfHwgIXJlc3VsdC50YXNrSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFByb2Nlc3NpbmdFcnJvcignRmFpbGVkIHRvIHByb2Nlc3MgdGV4dCcsIHsgdGV4dDogbWVzc2FnZS50ZXh0IH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogJ3Byb2Nlc3NpbmcnLFxuICAgICAgICAgICAgICAgICAgICB0YXNrSWQ6IHJlc3VsdC50YXNrSWQsXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnOiBpbml0TWFuYWdlci5kZWJ1Z0luZm8oKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZXJyb3I6IGVycm9yTWVzc2FnZSwgY29kZSwgZGVidWcgfSA9IGVycm9ySGFuZGxlci5nZXRFcnJvclJlc3BvbnNlKGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvck1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIGNvZGUsXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBIYW5kbGUgZGVidWcgaW5mbyByZXF1ZXN0XG4gICAgbWVzc2FnaW5nTWFuYWdlci5yZWdpc3RlckhhbmRsZXI8J2dldERlYnVnSW5mbyc+KFxuICAgICAgICAnZ2V0RGVidWdJbmZvJyxcbiAgICAgICAgYXN5bmMgKCk6IFByb21pc2U8R2V0RGVidWdJbmZvUmVzcG9uc2U+ID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZXJyb3JIYW5kbGVyLmNoZWNrUnVudGltZUhlYWx0aCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hbmlmZXN0ID0gY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25JZDogY2hyb21lLnJ1bnRpbWUuaWQsXG4gICAgICAgICAgICAgICAgICAgIG1hbmlmZXN0VmVyc2lvbjogbWFuaWZlc3QubWFuaWZlc3RfdmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgcGVybWlzc2lvbnM6IG1hbmlmZXN0LnBlcm1pc3Npb25zIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICBob3N0UGVybWlzc2lvbnM6IG1hbmlmZXN0Lmhvc3RfcGVybWlzc2lvbnMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgZGVidWc6IGluaXRNYW5hZ2VyLmRlYnVnSW5mbygpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBlcnJvcjogZXJyb3JNZXNzYWdlLCBjb2RlLCBkZWJ1ZyB9ID0gZXJyb3JIYW5kbGVyLmdldEVycm9yUmVzcG9uc2UoZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbklkOiAndW5hdmFpbGFibGUnLFxuICAgICAgICAgICAgICAgICAgICBtYW5pZmVzdFZlcnNpb246IDMsXG4gICAgICAgICAgICAgICAgICAgIHBlcm1pc3Npb25zOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgaG9zdFBlcm1pc3Npb25zOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3JNZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICBjb2RlLFxuICAgICAgICAgICAgICAgICAgICBkZWJ1Z1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xufVxuXG4vLyBJbml0aWFsaXplIHRoZSBleHRlbnNpb25cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemVFeHRlbnNpb24oZGV0YWlscz86IGNocm9tZS5ydW50aW1lLkluc3RhbGxlZERldGFpbHMpIHtcbiAgICB0cnkge1xuICAgICAgICAvLyBDaGVjayBydW50aW1lIGhlYWx0aFxuICAgICAgICBhd2FpdCBlcnJvckhhbmRsZXIuY2hlY2tSdW50aW1lSGVhbHRoKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBWYWxpZGF0ZSBwZXJtaXNzaW9uc1xuICAgICAgICBhd2FpdCBlcnJvckhhbmRsZXIudmFsaWRhdGVQZXJtaXNzaW9ucygpO1xuXG4gICAgICAgIGxvZ2dlci5pbmZvKCdTdGFydGluZyBleHRlbnNpb24gaW5pdGlhbGl6YXRpb24nLCB7XG4gICAgICAgICAgICByZWFzb246IGRldGFpbHM/LnJlYXNvbiB8fCAnc3RhcnR1cCdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNvbnRleHQgbWVudSBpdGVtc1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICBjb250ZXh0TWVudU1hbmFnZXIuY3JlYXRlQ29udGV4dE1lbnUoe1xuICAgICAgICAgICAgICAgIGlkOiAncmVhZFNlbGVjdGVkVGV4dCcsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdSZWFkIFNlbGVjdGVkIFRleHQnLFxuICAgICAgICAgICAgICAgIGNvbnRleHRzOiBbJ3NlbGVjdGlvbiddXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvbnRleHRNZW51TWFuYWdlci5jcmVhdGVDb250ZXh0TWVudSh7XG4gICAgICAgICAgICAgICAgaWQ6ICdzdW1tYXJpemVUZXh0JyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ1N1bW1hcml6ZSBUZXh0JyxcbiAgICAgICAgICAgICAgICBjb250ZXh0czogWydzZWxlY3Rpb24nXVxuICAgICAgICAgICAgfSlcbiAgICAgICAgXSk7XG5cbiAgICAgICAgLy8gTG9hZCBpbml0aWFsIHNldHRpbmdzXG4gICAgICAgIGF3YWl0IHN0b3JhZ2VTZXJ2aWNlLmdldFNldHRpbmdzKCk7XG5cbiAgICAgICAgLy8gTWFyayBiYWNrZ3JvdW5kIHNjcmlwdCBhcyBpbml0aWFsaXplZFxuICAgICAgICBpbml0TWFuYWdlci5tYXJrSW5pdGlhbGl6ZWQoJ2JhY2tncm91bmQnLCB7XG4gICAgICAgICAgICBjb250ZXh0TWVudTogdHJ1ZSxcbiAgICAgICAgICAgIGV4dGVuc2lvbklkOiBjaHJvbWUucnVudGltZS5pZCxcbiAgICAgICAgICAgIGluc3RhbGxUeXBlOiBkZXRhaWxzPy5yZWFzb25cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU2V0IHVwIG1lc3NhZ2UgaGFuZGxlcnMgYWZ0ZXIgaW5pdGlhbGl6YXRpb25cbiAgICAgICAgc2V0dXBNZXNzYWdlSGFuZGxlcnMoKTtcblxuICAgICAgICBsb2dnZXIuaW5mbygnRXh0ZW5zaW9uIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgICAgICAgIGV4dGVuc2lvbklkOiBjaHJvbWUucnVudGltZS5pZCxcbiAgICAgICAgICAgIHJlYXNvbjogZGV0YWlscz8ucmVhc29uXG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnN0IHsgbWVzc2FnZSwgY29kZSwgY29udGV4dCB9ID0gZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yLCB7XG4gICAgICAgICAgICByZWFzb246IGRldGFpbHM/LnJlYXNvblxuICAgICAgICB9KTtcblxuICAgICAgICBpbml0TWFuYWdlci5tYXJrRXJyb3IoJ2JhY2tncm91bmQnLCBtZXNzYWdlKTtcbiAgICAgICAgXG4gICAgICAgIC8vIElmIHRoZSBlcnJvciBpcyByZWNvdmVyYWJsZSwgdHJ5IHRvIHNldCB1cCBtZXNzYWdlIGhhbmRsZXJzIGFueXdheVxuICAgICAgICBpZiAoZXJyb3JIYW5kbGVyLmlzUmVjb3ZlcmFibGUoZXJyb3IpKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybignQXR0ZW1wdGluZyB0byBjb250aW51ZSB3aXRoIHBhcnRpYWwgaW5pdGlhbGl6YXRpb24nKTtcbiAgICAgICAgICAgIHNldHVwTWVzc2FnZUhhbmRsZXJzKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIExpc3RlbiBmb3IgZXh0ZW5zaW9uIGluc3RhbGxhdGlvbi91cGRhdGVcbmNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKGFzeW5jIChkZXRhaWxzKSA9PiB7XG4gICAgYXdhaXQgaW5pdGlhbGl6ZUV4dGVuc2lvbihkZXRhaWxzKTtcbn0pO1xuXG4vLyBMaXN0ZW4gZm9yIHN0YXJ0dXBcbmNocm9tZS5ydW50aW1lLm9uU3RhcnR1cC5hZGRMaXN0ZW5lcihhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgaW5pdGlhbGl6ZUV4dGVuc2lvbigpO1xufSk7XG5cbi8vIEhhbmRsZSB1bmhhbmRsZWQgZXJyb3JzIGFuZCByZWplY3Rpb25zXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoZXZlbnQ6IEVycm9yRXZlbnQpID0+IHtcbiAgICBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZXZlbnQuZXJyb3IsIHsgXG4gICAgICAgIHNvdXJjZTogJ3dpbmRvdy5lcnJvcicsXG4gICAgICAgIG1lc3NhZ2U6IGV2ZW50Lm1lc3NhZ2UsXG4gICAgICAgIGZpbGVuYW1lOiBldmVudC5maWxlbmFtZSxcbiAgICAgICAgbGluZW5vOiBldmVudC5saW5lbm8sXG4gICAgICAgIGNvbG5vOiBldmVudC5jb2xub1xuICAgIH0pO1xufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1bmhhbmRsZWRyZWplY3Rpb24nLCAoZXZlbnQ6IFByb21pc2VSZWplY3Rpb25FdmVudCkgPT4ge1xuICAgIGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihldmVudC5yZWFzb24sIHsgXG4gICAgICAgIHNvdXJjZTogJ3VuaGFuZGxlZHJlamVjdGlvbicsXG4gICAgICAgIG1lc3NhZ2U6IGV2ZW50LnJlYXNvbj8ubWVzc2FnZSB8fCAnVW5rbm93biBwcm9taXNlIHJlamVjdGlvbidcbiAgICB9KTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
/*!************************!*\
  !*** ./src/content.ts ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/logger */ "./src/utils/logger.ts");
/* harmony import */ var _utils_messaging__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/messaging */ "./src/utils/messaging.ts");
// Content script for handling text selection and TTS


const logger = (0,_utils_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('Content');
// Type guard for process text success response
function isProcessTextSuccessResponse(response) {
    return response &&
        typeof response === 'object' &&
        ('status' in response) &&
        (response.status === 'processing' || response.status === 'completed') &&
        'taskId' in response &&
        typeof response.taskId === 'string';
}
// Type guard for error response
function isErrorResponse(response) {
    return response &&
        typeof response === 'object' &&
        'status' in response &&
        response.status === 'error' &&
        'error' in response &&
        'code' in response;
}
// Convert unknown error to safe debug info
function toSafeDebugInfo(error) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack || 'No stack trace'
        };
    }
    return {
        error: String(error)
    };
}
// Function to handle text selection
async function handleTextSelection(text) {
    try {
        logger.info('Processing selected text');
        const response = await _utils_messaging__WEBPACK_IMPORTED_MODULE_1__.messagingManager.sendMessage({
            type: 'processText',
            text
        });
        if (isErrorResponse(response)) {
            return {
                status: 'error',
                error: response.error,
                code: response.code,
                debug: response.debug || {}
            };
        }
        if (!isProcessTextSuccessResponse(response)) {
            return {
                status: 'error',
                error: 'Invalid response from server',
                code: 'INVALID_RESPONSE',
                debug: { response: JSON.stringify(response) }
            };
        }
        return {
            status: 'processing',
            taskId: response.taskId,
            debug: response.debug || {}
        };
    }
    catch (error) {
        const debugInfo = toSafeDebugInfo(error);
        logger.error('Error handling text selection', debugInfo);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'SELECTION_ERROR',
            debug: debugInfo
        };
    }
}
// Initialize content script
async function initializeContentScript() {
    try {
        // Send ready message to background script
        const response = await _utils_messaging__WEBPACK_IMPORTED_MODULE_1__.messagingManager.sendMessage({
            type: 'contentScriptReady'
        });
        if (isErrorResponse(response)) {
            const debugInfo = {
                error: response.error,
                code: response.code,
                debug: response.debug || {}
            };
            logger.error('Failed to initialize content script', debugInfo);
            return;
        }
        logger.info('Content script initialized', response.debug || {});
        // Listen for context menu actions
        chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
            if (message.type === 'contextMenuAction') {
                try {
                    if (!message.text) {
                        const errorResponse = {
                            status: 'error',
                            error: 'No text provided',
                            code: 'INVALID_INPUT',
                            debug: { messageType: message.type }
                        };
                        sendResponse(errorResponse);
                        return true;
                    }
                    const response = await handleTextSelection(message.text);
                    if (isErrorResponse(response)) {
                        const debugInfo = {
                            error: response.error,
                            code: response.code,
                            debug: response.debug || {}
                        };
                        logger.error('Error processing text', debugInfo);
                    }
                    else {
                        logger.info('Text processing started', {
                            taskId: response.taskId,
                            debug: response.debug || {}
                        });
                    }
                    sendResponse(response);
                }
                catch (error) {
                    const debugInfo = toSafeDebugInfo(error);
                    logger.error('Error in context menu handler', debugInfo);
                    const errorResponse = {
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Unknown error',
                        code: 'CONTEXT_MENU_ERROR',
                        debug: debugInfo
                    };
                    sendResponse(errorResponse);
                }
                return true; // Keep the message channel open for async response
            }
            return true;
        });
    }
    catch (error) {
        const debugInfo = toSafeDebugInfo(error);
        logger.error('Error initializing content script', debugInfo);
    }
}
// Initialize the content script
initializeContentScript();

})();

/******/ })()
;
//# sourceMappingURL=content.js.map
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBZ0Q7QUFVaEQsTUFBTSxxQkFBcUI7SUFNdkI7UUFDSSxJQUFJLENBQUMsTUFBTSxHQUFHLHFEQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVoQyx3Q0FBd0M7UUFDeEMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVNLE1BQU0sQ0FBQyxXQUFXO1FBQ3JCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQyxxQkFBcUIsQ0FBQyxRQUFRLEdBQUcsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO1FBQ2pFLENBQUM7UUFDRCxPQUFPLHFCQUFxQixDQUFDLFFBQVEsQ0FBQztJQUMxQyxDQUFDO0lBRU8sdUJBQXVCO1FBQzNCLDZDQUE2QztRQUM3QyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUMvQyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRTtnQkFDekIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNO2dCQUN0QixlQUFlLEVBQUUsT0FBTyxDQUFDLGVBQWU7Z0JBQ3hDLEVBQUUsRUFBRSxPQUFPLENBQUMsRUFBRTthQUNqQixDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUVILCtCQUErQjtRQUMvQixJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDM0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRTtnQkFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMvQixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7SUFDTCxDQUFDO0lBRU0sZUFBZSxDQUFDLE9BQWUsRUFBRSxPQUE2QjtRQUNqRSxNQUFNLE1BQU0sR0FBZTtZQUN2QixXQUFXLEVBQUUsSUFBSTtZQUNqQixTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNyQixPQUFPO1lBQ1AsT0FBTztTQUNWLENBQUM7UUFDRixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVuRCxnQ0FBZ0M7UUFDaEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3pELFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTSxTQUFTLENBQUMsT0FBZSxFQUFFLEtBQXFCLEVBQUUsT0FBNkI7UUFDbEYsTUFBTSxNQUFNLEdBQWU7WUFDdkIsV0FBVyxFQUFFLEtBQUs7WUFDbEIsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUs7WUFDckQsU0FBUyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDckIsT0FBTztZQUNQLE9BQU87U0FDVixDQUFDO1FBQ0YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsT0FBTyx3QkFBd0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRU0sYUFBYSxDQUFDLE9BQWU7UUFDaEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUMsT0FBTyxNQUFNLEVBQUUsV0FBVyxJQUFJLEtBQUssQ0FBQztJQUN4QyxDQUFDO0lBRU0sU0FBUyxDQUFDLE9BQWU7UUFDNUIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRU0sWUFBWTtRQUNmLE1BQU0sTUFBTSxHQUErQixFQUFFLENBQUM7UUFDOUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDbkMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUN4QixDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFTSxLQUFLLENBQUMscUJBQXFCLENBQUMsT0FBZSxFQUFFLFVBQWtCLElBQUk7UUFDdEUsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDOUIsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUMzQixNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDMUQsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25CLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVaLE1BQU0sUUFBUSxHQUFHLEdBQUcsRUFBRTtnQkFDbEIsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN4QixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEIsQ0FBQyxDQUFDO1lBRUYsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3pELFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLFFBQVEsQ0FBQyxLQUFhLEVBQUUsT0FBNkI7UUFDeEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEtBQUssRUFBRSxFQUFFO1lBQzFDLEtBQUs7WUFDTCxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNyQixHQUFHLE9BQU87U0FDYixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU0sS0FBSyxDQUFDLGdCQUFnQjtRQUN6QixNQUFNLFdBQVcsR0FBRztZQUNoQixXQUFXO1lBQ1gsY0FBYztZQUNkLFdBQVc7WUFDWCxTQUFTO1lBQ1QsTUFBTTtTQUNULENBQUM7UUFFRixNQUFNLE9BQU8sR0FBNEIsRUFBRSxDQUFDO1FBRTVDLEtBQUssTUFBTSxVQUFVLElBQUksV0FBVyxFQUFFLENBQUM7WUFDbkMsSUFBSSxDQUFDO2dCQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2pGLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxPQUFPLENBQUM7WUFDbEMsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsNkJBQTZCLFVBQVUsR0FBRyxFQUFFO29CQUMxRCxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTtpQkFDbEUsQ0FBQyxDQUFDO2dCQUNILE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDaEMsQ0FBQztRQUNMLENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBRU0sS0FBSyxDQUFDLHVCQUF1QjtRQUNoQyxNQUFNLEtBQUssR0FBRztZQUNWLHNCQUFzQjtZQUN0QixzQkFBc0I7U0FDekIsQ0FBQztRQUVGLE1BQU0sT0FBTyxHQUE0QixFQUFFLENBQUM7UUFFNUMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUM7Z0JBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdkUsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQztZQUM1QixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsSUFBSSxHQUFHLEVBQUU7b0JBQ3pELEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlO2lCQUNsRSxDQUFDLENBQUM7Z0JBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUMxQixDQUFDO1FBQ0wsQ0FBQztRQUVELE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFFTSxTQUFTO1FBQ1osT0FBTztZQUNILFVBQVUsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQy9CLFdBQVcsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDOUIsZUFBZSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsZ0JBQWdCO1lBQzlELFdBQVcsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLFdBQVc7WUFDckQsZUFBZSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsZ0JBQWdCO1lBQzlELFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO1NBQ3hCLENBQUM7SUFDTixDQUFDO0NBQ0o7QUFFTSxNQUFNLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0FDMUsvRCxNQUFNLGFBQWE7SUFJZixZQUFZLFNBQWlCLEVBQUUsV0FBcUIsT0FBTztRQUN2RCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUM3QixDQUFDO0lBRU8sU0FBUyxDQUFDLEtBQWU7UUFDN0IsTUFBTSxNQUFNLEdBQWUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM5RCxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwRCxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEQsT0FBTyxpQkFBaUIsSUFBSSxhQUFhLENBQUM7SUFDOUMsQ0FBQztJQUVPLGFBQWEsQ0FBQyxLQUFlLEVBQUUsT0FBZTtRQUNsRCxPQUFPLElBQUksSUFBSSxDQUFDLFNBQVMsTUFBTSxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssT0FBTyxFQUFFLENBQUM7SUFDckUsQ0FBQztJQUVPLGFBQWEsQ0FBdUIsT0FBVztRQUNuRCxJQUFJLENBQUMsT0FBTztZQUFFLE9BQU8sU0FBUyxDQUFDO1FBQy9CLE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFFRCxLQUFLLENBQXVCLE9BQWUsRUFBRSxPQUFXO1FBQ3BELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztZQUFFLE9BQU87UUFDckMsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7YUFBTSxDQUFDO1lBQ0osT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3hELENBQUM7SUFDTCxDQUFDO0lBRUQsSUFBSSxDQUF1QixPQUFlLEVBQUUsT0FBVztRQUNuRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7WUFBRSxPQUFPO1FBQ3BDLElBQUksT0FBTyxFQUFFLENBQUM7WUFDVixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNuRixDQUFDO2FBQU0sQ0FBQztZQUNKLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDO0lBQ0wsQ0FBQztJQUVELElBQUksQ0FBdUIsT0FBZSxFQUFFLE9BQVc7UUFDbkQsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1lBQUUsT0FBTztRQUNwQyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ1YsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDbkYsQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdEQsQ0FBQztJQUNMLENBQUM7SUFFRCxLQUFLLENBQXVCLE9BQWUsRUFBRSxPQUFXO1FBQ3BELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztZQUFFLE9BQU87UUFDckMsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7YUFBTSxDQUFDO1lBQ0osT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3hELENBQUM7SUFDTCxDQUFDO0NBQ0o7QUFFTSxTQUFTLFlBQVksQ0FBQyxTQUFpQixFQUFFLFdBQXFCLE9BQU87SUFDeEUsT0FBTyxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDbEQsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNoRnVDO0FBQ0U7QUFhMUMsTUFBTSxNQUFNLEdBQUcscURBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQWdCekMsTUFBTSxnQkFBZ0I7SUFJbEI7UUFDSSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVNLE1BQU0sQ0FBQyxXQUFXO1FBQ3JCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM3QixnQkFBZ0IsQ0FBQyxRQUFRLEdBQUcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3ZELENBQUM7UUFDRCxPQUFPLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztJQUNyQyxDQUFDO0lBRU8sb0JBQW9CO1FBQ3hCLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQXlCLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxFQUFFO1lBQ3JGLE1BQU0sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFN0UsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDWCxNQUFNLENBQUMsSUFBSSxDQUFDLHlDQUF5QyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRSxZQUFZLENBQUM7b0JBQ1QsS0FBSyxFQUFFLGdDQUFnQyxPQUFPLENBQUMsSUFBSSxFQUFFO29CQUNyRCxLQUFLLEVBQUUsbURBQVcsQ0FBQyxTQUFTLEVBQUU7aUJBQ2pDLENBQUMsQ0FBQztnQkFDSCxPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1lBRUQsT0FBTyxDQUFDLE9BQWMsRUFBRSxNQUFNLENBQUM7aUJBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDYixNQUFNLENBQUMsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDcEUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzNCLENBQUMsQ0FBQztpQkFDRCxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ1gsTUFBTSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDM0IsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO29CQUNsQixLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTtpQkFDbEUsQ0FBQyxDQUFDO2dCQUNILFlBQVksQ0FBQztvQkFDVCxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTtvQkFDL0QsS0FBSyxFQUFFLG1EQUFXLENBQUMsU0FBUyxFQUFFO2lCQUNqQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztZQUVQLE9BQU8sSUFBSSxDQUFDLENBQUMsOEJBQThCO1FBQy9DLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLGVBQWUsQ0FDbEIsSUFBTyxFQUNQLE9BQTBCO1FBRTFCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqQyxNQUFNLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNuRSxDQUFDO0lBRU0sS0FBSyxDQUFDLFdBQVcsQ0FDcEIsT0FBMEI7UUFFMUIsSUFBSSxDQUFDO1lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN6RCxNQUFNLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3BFLE9BQU8sUUFBUSxDQUFDO1FBQ3BCLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2IsTUFBTSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRTtnQkFDbkMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO2dCQUNsQixLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTthQUNsRSxDQUFDLENBQUM7WUFDSCxNQUFNLEtBQUssQ0FBQztRQUNoQixDQUFDO0lBQ0wsQ0FBQztJQUVNLEtBQUssQ0FBQyxjQUFjLENBQ3ZCLEtBQWEsRUFDYixPQUEwQjtRQUUxQixJQUFJLENBQUM7WUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNwRSxNQUFNLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMvRCxNQUFNLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDL0UsT0FBTyxRQUFRLENBQUM7UUFDcEIsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixNQUFNLENBQUMsS0FBSyxDQUFDLDRCQUE0QixFQUFFO2dCQUN2QyxLQUFLO2dCQUNMLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtnQkFDbEIsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7YUFDbEUsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxLQUFLLENBQUM7UUFDaEIsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQUVNLE1BQU0sZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLENBQUM7Ozs7Ozs7VUM3SC9EO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7O0FDTkEscURBQXFEO0FBQ1A7QUFDTztBQVdyRCxNQUFNLE1BQU0sR0FBRywyREFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBRXZDLCtDQUErQztBQUMvQyxTQUFTLDRCQUE0QixDQUFDLFFBQWE7SUFDL0MsT0FBTyxRQUFRO1FBQ1IsT0FBTyxRQUFRLEtBQUssUUFBUTtRQUM1QixDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUM7UUFDdEIsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLFlBQVksSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLFdBQVcsQ0FBQztRQUNyRSxRQUFRLElBQUksUUFBUTtRQUNwQixPQUFPLFFBQVEsQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDO0FBQy9DLENBQUM7QUFFRCxnQ0FBZ0M7QUFDaEMsU0FBUyxlQUFlLENBQUMsUUFBYTtJQUNsQyxPQUFPLFFBQVE7UUFDUixPQUFPLFFBQVEsS0FBSyxRQUFRO1FBQzVCLFFBQVEsSUFBSSxRQUFRO1FBQ3BCLFFBQVEsQ0FBQyxNQUFNLEtBQUssT0FBTztRQUMzQixPQUFPLElBQUksUUFBUTtRQUNuQixNQUFNLElBQUksUUFBUSxDQUFDO0FBQzlCLENBQUM7QUFPRCwyQ0FBMkM7QUFDM0MsU0FBUyxlQUFlLENBQUMsS0FBYztJQUNuQyxJQUFJLEtBQUssWUFBWSxLQUFLLEVBQUUsQ0FBQztRQUN6QixPQUFPO1lBQ0gsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO1lBQ2hCLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztZQUN0QixLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssSUFBSSxnQkFBZ0I7U0FDekMsQ0FBQztJQUNOLENBQUM7SUFDRCxPQUFPO1FBQ0gsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUM7S0FDdkIsQ0FBQztBQUNOLENBQUM7QUFFRCxvQ0FBb0M7QUFDcEMsS0FBSyxVQUFVLG1CQUFtQixDQUFDLElBQVk7SUFDM0MsSUFBSSxDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBRXhDLE1BQU0sUUFBUSxHQUFHLE1BQU0sOERBQWdCLENBQUMsV0FBVyxDQUFDO1lBQ2hELElBQUksRUFBRSxhQUFhO1lBQ25CLElBQUk7U0FDZSxDQUFDLENBQUM7UUFFekIsSUFBSSxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUM1QixPQUFPO2dCQUNILE1BQU0sRUFBRSxPQUFPO2dCQUNmLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztnQkFDckIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJO2dCQUNuQixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFO2FBQzlCLENBQUM7UUFDTixDQUFDO1FBRUQsSUFBSSxDQUFDLDRCQUE0QixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDMUMsT0FBTztnQkFDSCxNQUFNLEVBQUUsT0FBTztnQkFDZixLQUFLLEVBQUUsOEJBQThCO2dCQUNyQyxJQUFJLEVBQUUsa0JBQWtCO2dCQUN4QixLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTthQUNoRCxDQUFDO1FBQ04sQ0FBQztRQUVELE9BQU87WUFDSCxNQUFNLEVBQUUsWUFBWTtZQUNwQixNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU07WUFDdkIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLElBQUksRUFBRTtTQUM5QixDQUFDO0lBQ04sQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekMsTUFBTSxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN6RCxPQUFPO1lBQ0gsTUFBTSxFQUFFLE9BQU87WUFDZixLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTtZQUMvRCxJQUFJLEVBQUUsaUJBQWlCO1lBQ3ZCLEtBQUssRUFBRSxTQUFTO1NBQ25CLENBQUM7SUFDTixDQUFDO0FBQ0wsQ0FBQztBQUVELDRCQUE0QjtBQUM1QixLQUFLLFVBQVUsdUJBQXVCO0lBQ2xDLElBQUksQ0FBQztRQUNELDBDQUEwQztRQUMxQyxNQUFNLFFBQVEsR0FBRyxNQUFNLDhEQUFnQixDQUFDLFdBQVcsQ0FBQztZQUNoRCxJQUFJLEVBQUUsb0JBQW9CO1NBQ0EsQ0FBQyxDQUFDO1FBRWhDLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDNUIsTUFBTSxTQUFTLEdBQUc7Z0JBQ2QsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO2dCQUNyQixJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7Z0JBQ25CLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxJQUFJLEVBQUU7YUFDOUIsQ0FBQztZQUNGLE1BQU0sQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDL0QsT0FBTztRQUNYLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLDRCQUE0QixFQUFFLFFBQVEsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUM7UUFFaEUsa0NBQWtDO1FBQ2xDLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQ3RDLE9BQWlDLEVBQ2pDLE1BQW9DLEVBQ3BDLFlBQTJELEVBQzdELEVBQUU7WUFDQSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssbUJBQW1CLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxDQUFDO29CQUNELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ2hCLE1BQU0sYUFBYSxHQUFzQjs0QkFDckMsTUFBTSxFQUFFLE9BQU87NEJBQ2YsS0FBSyxFQUFFLGtCQUFrQjs0QkFDekIsSUFBSSxFQUFFLGVBQWU7NEJBQ3JCLEtBQUssRUFBRSxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFO3lCQUN2QyxDQUFDO3dCQUNGLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDNUIsT0FBTyxJQUFJLENBQUM7b0JBQ2hCLENBQUM7b0JBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3pELElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7d0JBQzVCLE1BQU0sU0FBUyxHQUFHOzRCQUNkLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSzs0QkFDckIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJOzRCQUNuQixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFO3lCQUM5QixDQUFDO3dCQUNGLE1BQU0sQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsU0FBUyxDQUFDLENBQUM7b0JBQ3JELENBQUM7eUJBQU0sQ0FBQzt3QkFDSixNQUFNLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFOzRCQUNuQyxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU07NEJBQ3ZCLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxJQUFJLEVBQUU7eUJBQzlCLENBQUMsQ0FBQztvQkFDUCxDQUFDO29CQUNELFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0IsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNiLE1BQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDekMsTUFBTSxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDekQsTUFBTSxhQUFhLEdBQXNCO3dCQUNyQyxNQUFNLEVBQUUsT0FBTzt3QkFDZixLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTt3QkFDL0QsSUFBSSxFQUFFLG9CQUFvQjt3QkFDMUIsS0FBSyxFQUFFLFNBQVM7cUJBQ25CLENBQUM7b0JBQ0YsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUNoQyxDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDLENBQUMsbURBQW1EO1lBQ3BFLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztJQUVQLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsTUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sQ0FBQyxLQUFLLENBQUMsbUNBQW1DLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDakUsQ0FBQztBQUNMLENBQUM7QUFFRCxnQ0FBZ0M7QUFDaEMsdUJBQXVCLEVBQUUsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi8uL3NyYy91dGlscy9pbml0VXRpbHMudHMiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uLy4vc3JjL3V0aWxzL2xvZ2dlci50cyIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vLi9zcmMvdXRpbHMvbWVzc2FnaW5nLnRzIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi8uL3NyYy9jb250ZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUxvZ2dlciwgTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHsgTG9nQ29udGV4dCB9IGZyb20gJy4vbG9nZ2VyJztcblxuaW50ZXJmYWNlIEluaXRTdGF0dXMgZXh0ZW5kcyBMb2dDb250ZXh0IHtcbiAgICBpbml0aWFsaXplZDogYm9vbGVhbjtcbiAgICBlcnJvcj86IHN0cmluZztcbiAgICBtZXNzYWdlPzogc3RyaW5nO1xuICAgIFtrZXk6IHN0cmluZ106IGFueTtcbn1cblxuY2xhc3MgSW5pdGlhbGl6YXRpb25NYW5hZ2VyIHtcbiAgICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogSW5pdGlhbGl6YXRpb25NYW5hZ2VyO1xuICAgIHByaXZhdGUgbG9nZ2VyOiBMb2dnZXI7XG4gICAgcHJpdmF0ZSBpbml0U3RhdHVzOiBNYXA8c3RyaW5nLCBJbml0U3RhdHVzPjtcbiAgICBwcml2YXRlIHJlYWR5Q2FsbGJhY2tzOiBNYXA8c3RyaW5nLCBBcnJheTwoKSA9PiB2b2lkPj47XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxvZ2dlciA9IGNyZWF0ZUxvZ2dlcignSW5pdE1hbmFnZXInKTtcbiAgICAgICAgdGhpcy5pbml0U3RhdHVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnJlYWR5Q2FsbGJhY2tzID0gbmV3IE1hcCgpO1xuICAgICAgICBcbiAgICAgICAgLy8gTGlzdGVuIGZvciBleHRlbnNpb24gbGlmZWN5Y2xlIGV2ZW50c1xuICAgICAgICB0aGlzLnNldHVwRXh0ZW5zaW9uTGlzdGVuZXJzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBJbml0aWFsaXphdGlvbk1hbmFnZXIge1xuICAgICAgICBpZiAoIUluaXRpYWxpemF0aW9uTWFuYWdlci5pbnN0YW5jZSkge1xuICAgICAgICAgICAgSW5pdGlhbGl6YXRpb25NYW5hZ2VyLmluc3RhbmNlID0gbmV3IEluaXRpYWxpemF0aW9uTWFuYWdlcigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBJbml0aWFsaXphdGlvbk1hbmFnZXIuaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXR1cEV4dGVuc2lvbkxpc3RlbmVycygpOiB2b2lkIHtcbiAgICAgICAgLy8gTGlzdGVuIGZvciBleHRlbnNpb24gaW5zdGFsbC91cGRhdGUgZXZlbnRzXG4gICAgICAgIGNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKChkZXRhaWxzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZ0V2ZW50KCdvbkluc3RhbGxlZCcsIHtcbiAgICAgICAgICAgICAgICByZWFzb246IGRldGFpbHMucmVhc29uLFxuICAgICAgICAgICAgICAgIHByZXZpb3VzVmVyc2lvbjogZGV0YWlscy5wcmV2aW91c1ZlcnNpb24sXG4gICAgICAgICAgICAgICAgaWQ6IGRldGFpbHMuaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yIGV4dGVuc2lvbiBzdGFydHVwXG4gICAgICAgIGlmIChjaHJvbWUucnVudGltZS5vblN0YXJ0dXApIHtcbiAgICAgICAgICAgIGNocm9tZS5ydW50aW1lLm9uU3RhcnR1cC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2dFdmVudCgnb25TdGFydHVwJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBtYXJrSW5pdGlhbGl6ZWQoY29udGV4dDogc3RyaW5nLCBkZXRhaWxzPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQge1xuICAgICAgICBjb25zdCBzdGF0dXM6IEluaXRTdGF0dXMgPSB7XG4gICAgICAgICAgICBpbml0aWFsaXplZDogdHJ1ZSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICBkZXRhaWxzXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaW5pdFN0YXR1cy5zZXQoY29udGV4dCwgc3RhdHVzKTtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhgJHtjb250ZXh0fSBpbml0aWFsaXplZGAsIHN0YXR1cyk7XG5cbiAgICAgICAgLy8gVHJpZ2dlciBhbnkgd2FpdGluZyBjYWxsYmFja3NcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5yZWFkeUNhbGxiYWNrcy5nZXQoY29udGV4dCkgfHwgW107XG4gICAgICAgIGNhbGxiYWNrcy5mb3JFYWNoKGNhbGxiYWNrID0+IGNhbGxiYWNrKCkpO1xuICAgICAgICB0aGlzLnJlYWR5Q2FsbGJhY2tzLmRlbGV0ZShjb250ZXh0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbWFya0Vycm9yKGNvbnRleHQ6IHN0cmluZywgZXJyb3I6IEVycm9yIHwgc3RyaW5nLCBkZXRhaWxzPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQge1xuICAgICAgICBjb25zdCBzdGF0dXM6IEluaXRTdGF0dXMgPSB7XG4gICAgICAgICAgICBpbml0aWFsaXplZDogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcixcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICBkZXRhaWxzXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaW5pdFN0YXR1cy5zZXQoY29udGV4dCwgc3RhdHVzKTtcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYCR7Y29udGV4dH0gaW5pdGlhbGl6YXRpb24gZmFpbGVkYCwgc3RhdHVzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaXNJbml0aWFsaXplZChjb250ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5pbml0U3RhdHVzLmdldChjb250ZXh0KTtcbiAgICAgICAgcmV0dXJuIHN0YXR1cz8uaW5pdGlhbGl6ZWQgfHwgZmFsc2U7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFN0YXR1cyhjb250ZXh0OiBzdHJpbmcpOiBJbml0U3RhdHVzIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5pdFN0YXR1cy5nZXQoY29udGV4dCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEFsbFN0YXR1cygpOiBSZWNvcmQ8c3RyaW5nLCBJbml0U3RhdHVzPiB7XG4gICAgICAgIGNvbnN0IHN0YXR1czogUmVjb3JkPHN0cmluZywgSW5pdFN0YXR1cz4gPSB7fTtcbiAgICAgICAgdGhpcy5pbml0U3RhdHVzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgIHN0YXR1c1trZXldID0gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyB3YWl0Rm9ySW5pdGlhbGl6YXRpb24oY29udGV4dDogc3RyaW5nLCB0aW1lb3V0OiBudW1iZXIgPSA1MDAwKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGlmICh0aGlzLmlzSW5pdGlhbGl6ZWQoY29udGV4dCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGBJbml0aWFsaXphdGlvbiB0aW1lb3V0IGZvciAke2NvbnRleHR9YCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0KTtcblxuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMucmVhZHlDYWxsYmFja3MuZ2V0KGNvbnRleHQpIHx8IFtdO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgdGhpcy5yZWFkeUNhbGxiYWNrcy5zZXQoY29udGV4dCwgY2FsbGJhY2tzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGxvZ0V2ZW50KGV2ZW50OiBzdHJpbmcsIGRldGFpbHM/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oYEV4dGVuc2lvbiBldmVudDogJHtldmVudH1gLCB7XG4gICAgICAgICAgICBldmVudCxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIC4uLmRldGFpbHNcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNoZWNrUGVybWlzc2lvbnMoKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBib29sZWFuPj4ge1xuICAgICAgICBjb25zdCBwZXJtaXNzaW9ucyA9IFtcbiAgICAgICAgICAgICdhY3RpdmVUYWInLFxuICAgICAgICAgICAgJ2NvbnRleHRNZW51cycsXG4gICAgICAgICAgICAnc2NyaXB0aW5nJyxcbiAgICAgICAgICAgICdzdG9yYWdlJyxcbiAgICAgICAgICAgICd0YWJzJ1xuICAgICAgICBdO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdHM6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge307XG4gICAgICAgIFxuICAgICAgICBmb3IgKGNvbnN0IHBlcm1pc3Npb24gb2YgcGVybWlzc2lvbnMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhbnRlZCA9IGF3YWl0IGNocm9tZS5wZXJtaXNzaW9ucy5jb250YWlucyh7IHBlcm1pc3Npb25zOiBbcGVybWlzc2lvbl0gfSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1twZXJtaXNzaW9uXSA9IGdyYW50ZWQ7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBjaGVja2luZyBwZXJtaXNzaW9uICR7cGVybWlzc2lvbn06YCwgeyBcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbcGVybWlzc2lvbl0gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyB2YWxpZGF0ZUhvc3RQZXJtaXNzaW9ucygpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+PiB7XG4gICAgICAgIGNvbnN0IGhvc3RzID0gW1xuICAgICAgICAgICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6Ki8qJyxcbiAgICAgICAgICAgICdodHRwOi8vMTI3LjAuMC4xOiovKidcbiAgICAgICAgXTtcblxuICAgICAgICBjb25zdCByZXN1bHRzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgICAgICBcbiAgICAgICAgZm9yIChjb25zdCBob3N0IG9mIGhvc3RzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYW50ZWQgPSBhd2FpdCBjaHJvbWUucGVybWlzc2lvbnMuY29udGFpbnMoeyBvcmlnaW5zOiBbaG9zdF0gfSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1tob3N0XSA9IGdyYW50ZWQ7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBjaGVja2luZyBob3N0IHBlcm1pc3Npb24gJHtob3N0fTpgLCB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbaG9zdF0gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWJ1Z0luZm8oKTogUmVjb3JkPHN0cmluZywgYW55PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbml0U3RhdHVzOiB0aGlzLmdldEFsbFN0YXR1cygpLFxuICAgICAgICAgICAgZXh0ZW5zaW9uSWQ6IGNocm9tZS5ydW50aW1lLmlkLFxuICAgICAgICAgICAgbWFuaWZlc3RWZXJzaW9uOiBjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpLm1hbmlmZXN0X3ZlcnNpb24sXG4gICAgICAgICAgICBwZXJtaXNzaW9uczogY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKS5wZXJtaXNzaW9ucyxcbiAgICAgICAgICAgIGhvc3RQZXJtaXNzaW9uczogY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKS5ob3N0X3Blcm1pc3Npb25zLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgaW5pdE1hbmFnZXIgPSBJbml0aWFsaXphdGlvbk1hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcbiIsIi8vIExvZ2dlciB1dGlsaXR5IGZvciB0aGUgZXh0ZW5zaW9uXG50eXBlIExvZ0xldmVsID0gJ2RlYnVnJyB8ICdpbmZvJyB8ICd3YXJuJyB8ICdlcnJvcic7XG5cbmV4cG9ydCB0eXBlIExvZ1ZhbHVlID0gc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQgfCBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuXG5leHBvcnQgaW50ZXJmYWNlIExvZ0NvbnRleHQge1xuICAgIFtrZXk6IHN0cmluZ106IExvZ1ZhbHVlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ2dlciB7XG4gICAgZGVidWc8VCBleHRlbmRzIExvZ0NvbnRleHQgPSBMb2dDb250ZXh0PihtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBUKTogdm9pZDtcbiAgICBpbmZvPFQgZXh0ZW5kcyBMb2dDb250ZXh0ID0gTG9nQ29udGV4dD4obWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogVCk6IHZvaWQ7XG4gICAgd2FybjxUIGV4dGVuZHMgTG9nQ29udGV4dCA9IExvZ0NvbnRleHQ+KG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFQpOiB2b2lkO1xuICAgIGVycm9yPFQgZXh0ZW5kcyBMb2dDb250ZXh0ID0gTG9nQ29udGV4dD4obWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogVCk6IHZvaWQ7XG59XG5cbmNsYXNzIENvbnNvbGVMb2dnZXIgaW1wbGVtZW50cyBMb2dnZXIge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgbmFtZXNwYWNlOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWFkb25seSBtaW5MZXZlbDogTG9nTGV2ZWw7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lc3BhY2U6IHN0cmluZywgbWluTGV2ZWw6IExvZ0xldmVsID0gJ2RlYnVnJykge1xuICAgICAgICB0aGlzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICAgICAgdGhpcy5taW5MZXZlbCA9IG1pbkxldmVsO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvdWxkTG9nKGxldmVsOiBMb2dMZXZlbCk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBsZXZlbHM6IExvZ0xldmVsW10gPSBbJ2RlYnVnJywgJ2luZm8nLCAnd2FybicsICdlcnJvciddO1xuICAgICAgICBjb25zdCBtaW5MZXZlbEluZGV4ID0gbGV2ZWxzLmluZGV4T2YodGhpcy5taW5MZXZlbCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRMZXZlbEluZGV4ID0gbGV2ZWxzLmluZGV4T2YobGV2ZWwpO1xuICAgICAgICByZXR1cm4gY3VycmVudExldmVsSW5kZXggPj0gbWluTGV2ZWxJbmRleDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGZvcm1hdE1lc3NhZ2UobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYFske3RoaXMubmFtZXNwYWNlfV0gWyR7bGV2ZWwudG9VcHBlckNhc2UoKX1dICR7bWVzc2FnZX1gO1xuICAgIH1cblxuICAgIHByaXZhdGUgZm9ybWF0Q29udGV4dDxUIGV4dGVuZHMgTG9nQ29udGV4dD4oY29udGV4dD86IFQpOiBUIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgaWYgKCFjb250ZXh0KSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gY29udGV4dDtcbiAgICB9XG5cbiAgICBkZWJ1ZzxUIGV4dGVuZHMgTG9nQ29udGV4dD4obWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogVCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuc2hvdWxkTG9nKCdkZWJ1ZycpKSByZXR1cm47XG4gICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKHRoaXMuZm9ybWF0TWVzc2FnZSgnZGVidWcnLCBtZXNzYWdlKSwgdGhpcy5mb3JtYXRDb250ZXh0KGNvbnRleHQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcodGhpcy5mb3JtYXRNZXNzYWdlKCdkZWJ1ZycsIG1lc3NhZ2UpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGluZm88VCBleHRlbmRzIExvZ0NvbnRleHQ+KG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFQpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLnNob3VsZExvZygnaW5mbycpKSByZXR1cm47XG4gICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8odGhpcy5mb3JtYXRNZXNzYWdlKCdpbmZvJywgbWVzc2FnZSksIHRoaXMuZm9ybWF0Q29udGV4dChjb250ZXh0KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8odGhpcy5mb3JtYXRNZXNzYWdlKCdpbmZvJywgbWVzc2FnZSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgd2FybjxUIGV4dGVuZHMgTG9nQ29udGV4dD4obWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogVCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuc2hvdWxkTG9nKCd3YXJuJykpIHJldHVybjtcbiAgICAgICAgaWYgKGNvbnRleHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybih0aGlzLmZvcm1hdE1lc3NhZ2UoJ3dhcm4nLCBtZXNzYWdlKSwgdGhpcy5mb3JtYXRDb250ZXh0KGNvbnRleHQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybih0aGlzLmZvcm1hdE1lc3NhZ2UoJ3dhcm4nLCBtZXNzYWdlKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlcnJvcjxUIGV4dGVuZHMgTG9nQ29udGV4dD4obWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogVCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuc2hvdWxkTG9nKCdlcnJvcicpKSByZXR1cm47XG4gICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMuZm9ybWF0TWVzc2FnZSgnZXJyb3InLCBtZXNzYWdlKSwgdGhpcy5mb3JtYXRDb250ZXh0KGNvbnRleHQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5mb3JtYXRNZXNzYWdlKCdlcnJvcicsIG1lc3NhZ2UpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvZ2dlcihuYW1lc3BhY2U6IHN0cmluZywgbWluTGV2ZWw6IExvZ0xldmVsID0gJ2RlYnVnJyk6IExvZ2dlciB7XG4gICAgcmV0dXJuIG5ldyBDb25zb2xlTG9nZ2VyKG5hbWVzcGFjZSwgbWluTGV2ZWwpO1xufVxuIiwiaW1wb3J0IHsgY3JlYXRlTG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHsgaW5pdE1hbmFnZXIgfSBmcm9tICcuL2luaXRVdGlscyc7XG5pbXBvcnQgeyBcbiAgICBFeHRlbnNpb25NZXNzYWdlLCBcbiAgICBFeHRlbnNpb25SZXNwb25zZSxcbiAgICBNZXNzYWdlVHlwZSxcbiAgICBDb250ZW50U2NyaXB0UmVhZHlNZXNzYWdlLFxuICAgIFByb2Nlc3NUZXh0TWVzc2FnZSxcbiAgICBDb250ZXh0TWVudUFjdGlvbk1lc3NhZ2UsXG4gICAgVXBkYXRlU2V0dGluZ3NNZXNzYWdlLFxuICAgIFRhc2tTdGF0dXNNZXNzYWdlLFxuICAgIEdldERlYnVnSW5mb01lc3NhZ2Vcbn0gZnJvbSAnLi4vdHlwZXMvbWVzc2FnZXMnO1xuXG5jb25zdCBsb2dnZXIgPSBjcmVhdGVMb2dnZXIoJ01lc3NhZ2luZycpO1xuXG50eXBlIE1lc3NhZ2VUeXBlTWFwID0ge1xuICAgICdjb250ZW50U2NyaXB0UmVhZHknOiBDb250ZW50U2NyaXB0UmVhZHlNZXNzYWdlO1xuICAgICdwcm9jZXNzVGV4dCc6IFByb2Nlc3NUZXh0TWVzc2FnZTtcbiAgICAnY29udGV4dE1lbnVBY3Rpb24nOiBDb250ZXh0TWVudUFjdGlvbk1lc3NhZ2U7XG4gICAgJ3VwZGF0ZVNldHRpbmdzJzogVXBkYXRlU2V0dGluZ3NNZXNzYWdlO1xuICAgICd0YXNrU3RhdHVzJzogVGFza1N0YXR1c01lc3NhZ2U7XG4gICAgJ2dldERlYnVnSW5mbyc6IEdldERlYnVnSW5mb01lc3NhZ2U7XG59XG5cbnR5cGUgTWVzc2FnZUhhbmRsZXI8VCBleHRlbmRzIE1lc3NhZ2VUeXBlPiA9IChcbiAgICBtZXNzYWdlOiBNZXNzYWdlVHlwZU1hcFtUXSxcbiAgICBzZW5kZXI6IGNocm9tZS5ydW50aW1lLk1lc3NhZ2VTZW5kZXJcbikgPT4gUHJvbWlzZTxFeHRlbnNpb25SZXNwb25zZT47XG5cbmNsYXNzIE1lc3NhZ2luZ01hbmFnZXIge1xuICAgIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBNZXNzYWdpbmdNYW5hZ2VyO1xuICAgIHByaXZhdGUgaGFuZGxlcnM6IE1hcDxNZXNzYWdlVHlwZSwgTWVzc2FnZUhhbmRsZXI8YW55Pj47XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmhhbmRsZXJzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnNldHVwTWVzc2FnZUxpc3RlbmVyKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBNZXNzYWdpbmdNYW5hZ2VyIHtcbiAgICAgICAgaWYgKCFNZXNzYWdpbmdNYW5hZ2VyLmluc3RhbmNlKSB7XG4gICAgICAgICAgICBNZXNzYWdpbmdNYW5hZ2VyLmluc3RhbmNlID0gbmV3IE1lc3NhZ2luZ01hbmFnZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWVzc2FnaW5nTWFuYWdlci5pbnN0YW5jZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldHVwTWVzc2FnZUxpc3RlbmVyKCk6IHZvaWQge1xuICAgICAgICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2U6IEV4dGVuc2lvbk1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBsb2dnZXIuZGVidWcoJ1JlY2VpdmVkIG1lc3NhZ2U6JywgeyB0eXBlOiBtZXNzYWdlLnR5cGUsIHNlbmRlcjogc2VuZGVyLmlkIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5oYW5kbGVycy5nZXQobWVzc2FnZS50eXBlKTtcbiAgICAgICAgICAgIGlmICghaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdObyBoYW5kbGVyIHJlZ2lzdGVyZWQgZm9yIG1lc3NhZ2UgdHlwZTonLCB7IHR5cGU6IG1lc3NhZ2UudHlwZSB9KTtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBObyBoYW5kbGVyIGZvciBtZXNzYWdlIHR5cGU6ICR7bWVzc2FnZS50eXBlfWAsXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnOiBpbml0TWFuYWdlci5kZWJ1Z0luZm8oKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaGFuZGxlcihtZXNzYWdlIGFzIGFueSwgc2VuZGVyKVxuICAgICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKCdIYW5kbGVyIHJlc3BvbnNlOicsIHsgdHlwZTogbWVzc2FnZS50eXBlLCByZXNwb25zZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignSGFuZGxlciBlcnJvcjonLCB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogbWVzc2FnZS50eXBlLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWc6IGluaXRNYW5hZ2VyLmRlYnVnSW5mbygpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gV2lsbCByZXNwb25kIGFzeW5jaHJvbm91c2x5XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWdpc3RlckhhbmRsZXI8VCBleHRlbmRzIE1lc3NhZ2VUeXBlPihcbiAgICAgICAgdHlwZTogVCxcbiAgICAgICAgaGFuZGxlcjogTWVzc2FnZUhhbmRsZXI8VD5cbiAgICApOiB2b2lkIHtcbiAgICAgICAgdGhpcy5oYW5kbGVycy5zZXQodHlwZSwgaGFuZGxlcik7XG4gICAgICAgIGxvZ2dlci5kZWJ1ZygnUmVnaXN0ZXJlZCBoYW5kbGVyIGZvciBtZXNzYWdlIHR5cGU6JywgeyB0eXBlIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBzZW5kTWVzc2FnZTxUIGV4dGVuZHMgTWVzc2FnZVR5cGU+KFxuICAgICAgICBtZXNzYWdlOiBNZXNzYWdlVHlwZU1hcFtUXVxuICAgICk6IFByb21pc2U8RXh0ZW5zaW9uUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZygnU2VuZGluZyBtZXNzYWdlOicsIHsgdHlwZTogbWVzc2FnZS50eXBlIH0pO1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZygnTWVzc2FnZSByZXNwb25zZTonLCB7IHR5cGU6IG1lc3NhZ2UudHlwZSwgcmVzcG9uc2UgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZTonLCB7IFxuICAgICAgICAgICAgICAgIHR5cGU6IG1lc3NhZ2UudHlwZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2VuZFRhYk1lc3NhZ2U8VCBleHRlbmRzIE1lc3NhZ2VUeXBlPihcbiAgICAgICAgdGFiSWQ6IG51bWJlcixcbiAgICAgICAgbWVzc2FnZTogTWVzc2FnZVR5cGVNYXBbVF1cbiAgICApOiBQcm9taXNlPEV4dGVuc2lvblJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2dnZXIuZGVidWcoJ1NlbmRpbmcgdGFiIG1lc3NhZ2U6JywgeyB0YWJJZCwgdHlwZTogbWVzc2FnZS50eXBlIH0pO1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCwgbWVzc2FnZSk7XG4gICAgICAgICAgICBsb2dnZXIuZGVidWcoJ1RhYiBtZXNzYWdlIHJlc3BvbnNlOicsIHsgdGFiSWQsIHR5cGU6IG1lc3NhZ2UudHlwZSwgcmVzcG9uc2UgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgdGFiIG1lc3NhZ2U6Jywge1xuICAgICAgICAgICAgICAgIHRhYklkLFxuICAgICAgICAgICAgICAgIHR5cGU6IG1lc3NhZ2UudHlwZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBtZXNzYWdpbmdNYW5hZ2VyID0gTWVzc2FnaW5nTWFuYWdlci5nZXRJbnN0YW5jZSgpO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBDb250ZW50IHNjcmlwdCBmb3IgaGFuZGxpbmcgdGV4dCBzZWxlY3Rpb24gYW5kIFRUU1xuaW1wb3J0IHsgY3JlYXRlTG9nZ2VyIH0gZnJvbSAnLi91dGlscy9sb2dnZXInO1xuaW1wb3J0IHsgbWVzc2FnaW5nTWFuYWdlciB9IGZyb20gJy4vdXRpbHMvbWVzc2FnaW5nJztcbmltcG9ydCB7IFxuICAgIENvbnRlbnRTY3JpcHRSZWFkeU1lc3NhZ2UsXG4gICAgUHJvY2Vzc1RleHRNZXNzYWdlLFxuICAgIENvbnRleHRNZW51QWN0aW9uTWVzc2FnZSxcbiAgICBDb250ZW50U2NyaXB0UmVhZHlSZXNwb25zZSxcbiAgICBQcm9jZXNzVGV4dFJlc3BvbnNlLFxuICAgIENvbnRleHRNZW51QWN0aW9uUmVzcG9uc2UsXG4gICAgQmFzZUVycm9yUmVzcG9uc2Vcbn0gZnJvbSAnLi90eXBlcy9tZXNzYWdlcyc7XG5cbmNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcignQ29udGVudCcpO1xuXG4vLyBUeXBlIGd1YXJkIGZvciBwcm9jZXNzIHRleHQgc3VjY2VzcyByZXNwb25zZVxuZnVuY3Rpb24gaXNQcm9jZXNzVGV4dFN1Y2Nlc3NSZXNwb25zZShyZXNwb25zZTogYW55KTogcmVzcG9uc2UgaXMgRXh0cmFjdDxQcm9jZXNzVGV4dFJlc3BvbnNlLCB7IHN0YXR1czogJ3Byb2Nlc3NpbmcnIHwgJ2NvbXBsZXRlZCcgfT4ge1xuICAgIHJldHVybiByZXNwb25zZSAmJiBcbiAgICAgICAgICAgdHlwZW9mIHJlc3BvbnNlID09PSAnb2JqZWN0JyAmJiBcbiAgICAgICAgICAgKCdzdGF0dXMnIGluIHJlc3BvbnNlKSAmJlxuICAgICAgICAgICAocmVzcG9uc2Uuc3RhdHVzID09PSAncHJvY2Vzc2luZycgfHwgcmVzcG9uc2Uuc3RhdHVzID09PSAnY29tcGxldGVkJykgJiZcbiAgICAgICAgICAgJ3Rhc2tJZCcgaW4gcmVzcG9uc2UgJiZcbiAgICAgICAgICAgdHlwZW9mIHJlc3BvbnNlLnRhc2tJZCA9PT0gJ3N0cmluZyc7XG59XG5cbi8vIFR5cGUgZ3VhcmQgZm9yIGVycm9yIHJlc3BvbnNlXG5mdW5jdGlvbiBpc0Vycm9yUmVzcG9uc2UocmVzcG9uc2U6IGFueSk6IHJlc3BvbnNlIGlzIEJhc2VFcnJvclJlc3BvbnNlIHtcbiAgICByZXR1cm4gcmVzcG9uc2UgJiYgXG4gICAgICAgICAgIHR5cGVvZiByZXNwb25zZSA9PT0gJ29iamVjdCcgJiYgXG4gICAgICAgICAgICdzdGF0dXMnIGluIHJlc3BvbnNlICYmXG4gICAgICAgICAgIHJlc3BvbnNlLnN0YXR1cyA9PT0gJ2Vycm9yJyAmJlxuICAgICAgICAgICAnZXJyb3InIGluIHJlc3BvbnNlICYmXG4gICAgICAgICAgICdjb2RlJyBpbiByZXNwb25zZTtcbn1cblxuLy8gU2FmZSBkZWJ1ZyBpbmZvIHR5cGVcbnR5cGUgU2FmZURlYnVnSW5mbyA9IHtcbiAgICBba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IFNhZmVEZWJ1Z0luZm87XG59O1xuXG4vLyBDb252ZXJ0IHVua25vd24gZXJyb3IgdG8gc2FmZSBkZWJ1ZyBpbmZvXG5mdW5jdGlvbiB0b1NhZmVEZWJ1Z0luZm8oZXJyb3I6IHVua25vd24pOiBTYWZlRGVidWdJbmZvIHtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogZXJyb3IubmFtZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgICBzdGFjazogZXJyb3Iuc3RhY2sgfHwgJ05vIHN0YWNrIHRyYWNlJ1xuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBlcnJvcjogU3RyaW5nKGVycm9yKVxuICAgIH07XG59XG5cbi8vIEZ1bmN0aW9uIHRvIGhhbmRsZSB0ZXh0IHNlbGVjdGlvblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlVGV4dFNlbGVjdGlvbih0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPENvbnRleHRNZW51QWN0aW9uUmVzcG9uc2U+IHtcbiAgICB0cnkge1xuICAgICAgICBsb2dnZXIuaW5mbygnUHJvY2Vzc2luZyBzZWxlY3RlZCB0ZXh0Jyk7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBtZXNzYWdpbmdNYW5hZ2VyLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6ICdwcm9jZXNzVGV4dCcsXG4gICAgICAgICAgICB0ZXh0XG4gICAgICAgIH0gYXMgUHJvY2Vzc1RleHRNZXNzYWdlKTtcblxuICAgICAgICBpZiAoaXNFcnJvclJlc3BvbnNlKHJlc3BvbnNlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgZXJyb3I6IHJlc3BvbnNlLmVycm9yLFxuICAgICAgICAgICAgICAgIGNvZGU6IHJlc3BvbnNlLmNvZGUsXG4gICAgICAgICAgICAgICAgZGVidWc6IHJlc3BvbnNlLmRlYnVnIHx8IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc1Byb2Nlc3NUZXh0U3VjY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgZXJyb3I6ICdJbnZhbGlkIHJlc3BvbnNlIGZyb20gc2VydmVyJyxcbiAgICAgICAgICAgICAgICBjb2RlOiAnSU5WQUxJRF9SRVNQT05TRScsXG4gICAgICAgICAgICAgICAgZGVidWc6IHsgcmVzcG9uc2U6IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXR1czogJ3Byb2Nlc3NpbmcnLFxuICAgICAgICAgICAgdGFza0lkOiByZXNwb25zZS50YXNrSWQsXG4gICAgICAgICAgICBkZWJ1ZzogcmVzcG9uc2UuZGVidWcgfHwge31cbiAgICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zdCBkZWJ1Z0luZm8gPSB0b1NhZmVEZWJ1Z0luZm8oZXJyb3IpO1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGhhbmRsaW5nIHRleHQgc2VsZWN0aW9uJywgZGVidWdJbmZvKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgICAgIGNvZGU6ICdTRUxFQ1RJT05fRVJST1InLFxuICAgICAgICAgICAgZGVidWc6IGRlYnVnSW5mb1xuICAgICAgICB9O1xuICAgIH1cbn1cblxuLy8gSW5pdGlhbGl6ZSBjb250ZW50IHNjcmlwdFxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZUNvbnRlbnRTY3JpcHQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gU2VuZCByZWFkeSBtZXNzYWdlIHRvIGJhY2tncm91bmQgc2NyaXB0XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgbWVzc2FnaW5nTWFuYWdlci5zZW5kTWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiAnY29udGVudFNjcmlwdFJlYWR5J1xuICAgICAgICB9IGFzIENvbnRlbnRTY3JpcHRSZWFkeU1lc3NhZ2UpO1xuXG4gICAgICAgIGlmIChpc0Vycm9yUmVzcG9uc2UocmVzcG9uc2UpKSB7XG4gICAgICAgICAgICBjb25zdCBkZWJ1Z0luZm8gPSB7XG4gICAgICAgICAgICAgICAgZXJyb3I6IHJlc3BvbnNlLmVycm9yLFxuICAgICAgICAgICAgICAgIGNvZGU6IHJlc3BvbnNlLmNvZGUsXG4gICAgICAgICAgICAgICAgZGVidWc6IHJlc3BvbnNlLmRlYnVnIHx8IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdGYWlsZWQgdG8gaW5pdGlhbGl6ZSBjb250ZW50IHNjcmlwdCcsIGRlYnVnSW5mbyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsb2dnZXIuaW5mbygnQ29udGVudCBzY3JpcHQgaW5pdGlhbGl6ZWQnLCByZXNwb25zZS5kZWJ1ZyB8fCB7fSk7XG5cbiAgICAgICAgLy8gTGlzdGVuIGZvciBjb250ZXh0IG1lbnUgYWN0aW9uc1xuICAgICAgICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoYXN5bmMgKFxuICAgICAgICAgICAgbWVzc2FnZTogQ29udGV4dE1lbnVBY3Rpb25NZXNzYWdlLFxuICAgICAgICAgICAgc2VuZGVyOiBjaHJvbWUucnVudGltZS5NZXNzYWdlU2VuZGVyLFxuICAgICAgICAgICAgc2VuZFJlc3BvbnNlOiAocmVzcG9uc2U6IENvbnRleHRNZW51QWN0aW9uUmVzcG9uc2UpID0+IHZvaWRcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICBpZiAobWVzc2FnZS50eXBlID09PSAnY29udGV4dE1lbnVBY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtZXNzYWdlLnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yUmVzcG9uc2U6IEJhc2VFcnJvclJlc3BvbnNlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ05vIHRleHQgcHJvdmlkZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICdJTlZBTElEX0lOUFVUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZzogeyBtZXNzYWdlVHlwZTogbWVzc2FnZS50eXBlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoZXJyb3JSZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgaGFuZGxlVGV4dFNlbGVjdGlvbihtZXNzYWdlLnRleHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNFcnJvclJlc3BvbnNlKHJlc3BvbnNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVidWdJbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiByZXNwb25zZS5lcnJvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiByZXNwb25zZS5jb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnOiByZXNwb25zZS5kZWJ1ZyB8fCB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyB0ZXh0JywgZGVidWdJbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdUZXh0IHByb2Nlc3Npbmcgc3RhcnRlZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXNrSWQ6IHJlc3BvbnNlLnRhc2tJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZzogcmVzcG9uc2UuZGVidWcgfHwge31cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZShyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVidWdJbmZvID0gdG9TYWZlRGVidWdJbmZvKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBpbiBjb250ZXh0IG1lbnUgaGFuZGxlcicsIGRlYnVnSW5mbyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yUmVzcG9uc2U6IEJhc2VFcnJvclJlc3BvbnNlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogJ0NPTlRFWFRfTUVOVV9FUlJPUicsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZzogZGVidWdJbmZvXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZShlcnJvclJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIEtlZXAgdGhlIG1lc3NhZ2UgY2hhbm5lbCBvcGVuIGZvciBhc3luYyByZXNwb25zZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc3QgZGVidWdJbmZvID0gdG9TYWZlRGVidWdJbmZvKGVycm9yKTtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBpbml0aWFsaXppbmcgY29udGVudCBzY3JpcHQnLCBkZWJ1Z0luZm8pO1xuICAgIH1cbn1cblxuLy8gSW5pdGlhbGl6ZSB0aGUgY29udGVudCBzY3JpcHRcbmluaXRpYWxpemVDb250ZW50U2NyaXB0KCk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
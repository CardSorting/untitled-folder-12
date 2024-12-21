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


class CeleryClient {
    constructor(baseUrl = _config__WEBPACK_IMPORTED_MODULE_1__.config.API_ENDPOINT) {
        this.logger = (0,_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('CeleryClient');
        this.baseUrl = baseUrl;
        this.taskEndpoint = `${this.baseUrl}${_config__WEBPACK_IMPORTED_MODULE_1__.config.endpoints.processText}`;
        this.statusEndpoint = `${this.baseUrl}${_config__WEBPACK_IMPORTED_MODULE_1__.config.endpoints.taskStatus}`;
        this.config = _config__WEBPACK_IMPORTED_MODULE_1__.config.celery;
        this.logger.info('CeleryClient initialized', {
            baseUrl: this.baseUrl,
            taskEndpoint: this.taskEndpoint,
            statusEndpoint: this.statusEndpoint,
            timeout: this.config.timeout
        });
    }
    async processText(text, options = {}) {
        this.logger.debug('Processing text with Celery', {
            textLength: text.length
        });
        try {
            const response = await fetch(this.taskEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    language: options.language || 'en',
                    rate: options.rate || 1.0,
                    pitch: options.pitch || 1.0,
                    volume: options.volume || 1.0,
                    emotionalContext: options.emotionalContext || {},
                    textStructure: options.textStructure || {}
                }),
                signal: AbortSignal.timeout(this.config.timeout)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
            }
            const data = await response.json();
            this.logger.success('Text processed successfully', data);
            return {
                taskId: data.task_id,
                status: 'PENDING'
            };
        }
        catch (error) {
            this.logger.error('Error processing text:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    async checkTaskStatus(taskId) {
        try {
            const response = await fetch(`${this.statusEndpoint}/${taskId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return {
                taskId,
                status: data.status,
                result: data.result,
                error: data.error
            };
        }
        catch (error) {
            this.logger.error('Error checking task status:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    async pollTaskStatus(taskId, interval = 1000) {
        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    const status = await this.checkTaskStatus(taskId);
                    if (status.status === 'SUCCESS') {
                        resolve(status.result);
                    }
                    else if (status.status === 'FAILURE') {
                        reject(new Error(status.error || 'Task failed'));
                    }
                    else {
                        setTimeout(poll, interval);
                    }
                }
                catch (error) {
                    reject(error);
                }
            };
            poll();
        });
    }
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                signal: AbortSignal.timeout(5000) // Short timeout for health checks
            });
            return await response.json();
        }
        catch (error) {
            this.logger.error('Health check failed:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    async cancelTask(taskId) {
        try {
            const response = await fetch(`${this.statusEndpoint}/${taskId}/cancel`, {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error(`Failed to cancel task: ${taskId}`);
            }
        }
        catch (error) {
            this.logger.error('Error canceling task:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
}
// Export singleton instance
const celeryClient = new CeleryClient();


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
// Simple logger utility for Chrome extension
class LoggerImpl {
    constructor(context) {
        this.context = context;
    }
    _formatMessage(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            level,
            context: this.context,
            message,
            data
        };
    }
    debug(message, data) {
        console.debug(this._formatMessage('DEBUG', message, data));
    }
    info(message, data) {
        console.info(this._formatMessage('INFO', message, data));
    }
    warn(message, data) {
        console.warn(this._formatMessage('WARN', message, data));
    }
    error(message, data) {
        const errorMessage = message instanceof Error ? message.message : message;
        const errorData = message instanceof Error
            ? { ...data, stack: message.stack }
            : data;
        console.error(this._formatMessage('ERROR', errorMessage, errorData));
    }
    success(message, data) {
        console.info(this._formatMessage('SUCCESS', message, data));
    }
    createSubLogger(subContext) {
        return new LoggerImpl(`${this.context}:${subContext}`);
    }
}
function createLogger(context) {
    return new LoggerImpl(context);
}


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
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   backgroundController: () => (/* binding */ backgroundController)
/* harmony export */ });
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/logger */ "./src/utils/logger.ts");
/* harmony import */ var _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/celeryClient */ "./src/utils/celeryClient.ts");
// Background script for handling text-to-speech processing


class BackgroundController {
    constructor() {
        this.logger = (0,_utils_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('Background');
        this.activeTasks = new Map();
        this.taskCheckInterval = 1000; // Check task status every second
        // Initialize listeners
        this.initializeListeners();
        this.createContextMenu();
    }
    static getInstance() {
        if (!BackgroundController.instance) {
            BackgroundController.instance = new BackgroundController();
        }
        return BackgroundController.instance;
    }
    createContextMenu() {
        chrome.contextMenus.create({
            id: 'readText',
            title: 'Read Selected Text',
            contexts: ['selection']
        }, () => {
            const error = chrome.runtime.lastError;
            if (error) {
                this.logger.error('Error creating context menu:', { error: error.message });
            }
        });
    }
    initializeListeners() {
        // Listen for messages from content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (sender.tab?.id) {
                if (request.type === 'contentScriptReady') {
                    this.logger.info('Content script ready in tab:', { tabId: sender.tab.id });
                    return;
                }
                if (request.type === 'processText') {
                    this.handleProcessText(request, sender.tab.id)
                        .then(response => sendResponse(response))
                        .catch(error => sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' }));
                    return true; // Will respond asynchronously
                }
            }
            return false;
        });
        // Handle tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
            if (changeInfo.status === 'complete') {
                this.cleanupTasks(tabId);
            }
        });
        // Handle tab removal
        chrome.tabs.onRemoved.addListener((tabId) => {
            this.cleanupTasks(tabId);
        });
    }
    async handleProcessText(request, tabId) {
        try {
            const result = await _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__.celeryClient.processText(request.text, request.options);
            this.activeTasks.set(tabId, result.taskId);
            return result;
        }
        catch (error) {
            this.logger.error('Error processing text:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    async pollTaskStatus(taskId) {
        try {
            const status = await _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__.celeryClient.checkTaskStatus(taskId);
            return status;
        }
        catch (error) {
            this.logger.error('Error polling task status:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    cleanupTasks(tabId) {
        const taskId = this.activeTasks.get(tabId);
        if (taskId) {
            _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__.celeryClient.cancelTask(taskId).catch(error => {
                this.logger.error('Error canceling task:', { error: error instanceof Error ? error.message : 'Unknown error' });
            });
            this.activeTasks.delete(tabId);
        }
    }
    async notifyContentScript(tabId, message) {
        try {
            await chrome.tabs.sendMessage(tabId, message);
        }
        catch (error) {
            // If the content script is not ready, retry after a short delay
            if (error instanceof Error && error.message.includes('Receiving end does not exist')) {
                await new Promise(resolve => setTimeout(resolve, 100));
                return this.notifyContentScript(tabId, message);
            }
            this.logger.error('Error notifying content script:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
}
// Export singleton instance
const backgroundController = BackgroundController.getInstance();
// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'readText' && tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            type: 'readSelectedText',
            text: info.selectionText
        });
    }
});

})();

/******/ })()
;
//# sourceMappingURL=background.js.map
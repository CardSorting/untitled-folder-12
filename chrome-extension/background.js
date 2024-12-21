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
        this.isInitialized = false;
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
        // Check server connection
        this.checkConnection();
    }
    async checkConnection() {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
            this.isInitialized = response.ok;
            this.logger.info('Server connection established');
        }
        catch (error) {
            this.isInitialized = false;
            this.logger.warn('Failed to connect to server:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                baseUrl: this.baseUrl
            });
        }
    }
    async processText(text, options = {}) {
        if (!this.isInitialized) {
            await this.checkConnection();
            if (!this.isInitialized) {
                throw new Error('Cannot process text: Server not available');
            }
        }
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
        if (!this.isInitialized) {
            await this.checkConnection();
            if (!this.isInitialized) {
                throw new Error('Cannot check task status: Server not available');
            }
        }
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
        if (!this.isInitialized) {
            await this.checkConnection();
            if (!this.isInitialized) {
                throw new Error('Cannot poll task status: Server not available');
            }
        }
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
        if (!this.isInitialized) {
            await this.checkConnection();
            if (!this.isInitialized) {
                throw new Error('Cannot check health: Server not available');
            }
        }
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
        if (!this.isInitialized) {
            await this.checkConnection();
            if (!this.isInitialized) {
                throw new Error('Cannot cancel task: Server not available');
            }
        }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RUFBRSxJQUFJLENBQUMsYUFBYTtTQUMzQixDQUFDLENBQUM7SUFDUCxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vLi9zcmMvY29uZmlnLnRzIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi8uL3NyYy91dGlscy9jZWxlcnlDbGllbnQudHMiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uLy4vc3JjL3V0aWxzL2xvZ2dlci50cyIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vLi9zcmMvYmFja2dyb3VuZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb25maWd1cmF0aW9uIGZvciB0aGUgQ2hyb21lIGV4dGVuc2lvblxuXG5pbnRlcmZhY2UgQ29uZmlnIHtcbiAgICBBUElfRU5EUE9JTlQ6IHN0cmluZztcbiAgICBjZWxlcnk6IHtcbiAgICAgICAgdGltZW91dDogbnVtYmVyO1xuICAgICAgICBwb2xsSW50ZXJ2YWw6IG51bWJlcjtcbiAgICAgICAgbWF4UmV0cmllczogbnVtYmVyO1xuICAgIH07XG4gICAgZW5kcG9pbnRzOiB7XG4gICAgICAgIHByb2Nlc3NUZXh0OiBzdHJpbmc7XG4gICAgICAgIHRhc2tTdGF0dXM6IHN0cmluZztcbiAgICB9O1xufVxuXG5leHBvcnQgY29uc3QgY29uZmlnOiBDb25maWcgPSB7XG4gICAgQVBJX0VORFBPSU5UOiAnaHR0cDovL2xvY2FsaG9zdDo1MDAxJywgLy8gRGVmYXVsdCBsb2NhbCBkZXZlbG9wbWVudCBzZXJ2ZXJcbiAgICBjZWxlcnk6IHtcbiAgICAgICAgdGltZW91dDogMzAwMDAsIC8vIDMwIHNlY29uZHNcbiAgICAgICAgcG9sbEludGVydmFsOiAxMDAwLCAvLyAxIHNlY29uZFxuICAgICAgICBtYXhSZXRyaWVzOiAzXG4gICAgfSxcbiAgICBlbmRwb2ludHM6IHtcbiAgICAgICAgcHJvY2Vzc1RleHQ6ICcvcHJvY2Vzc190ZXh0JyxcbiAgICAgICAgdGFza1N0YXR1czogJy90YXNrX3N0YXR1cydcbiAgICB9XG59O1xuIiwiLy8gQ2VsZXJ5IGNsaWVudCBmb3IgaGFuZGxpbmcgdGV4dCBwcm9jZXNzaW5nIHRhc2tzXG5pbXBvcnQgeyBjcmVhdGVMb2dnZXIsIExvZ2dlciB9IGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZyc7XG5cbmludGVyZmFjZSBQcm9jZXNzT3B0aW9ucyB7XG4gICAgbGFuZ3VhZ2U/OiBzdHJpbmc7XG4gICAgcmF0ZT86IG51bWJlcjtcbiAgICBwaXRjaD86IG51bWJlcjtcbiAgICB2b2x1bWU/OiBudW1iZXI7XG4gICAgZW1vdGlvbmFsQ29udGV4dD86IFJlY29yZDxzdHJpbmcsIGFueT47XG4gICAgdGV4dFN0cnVjdHVyZT86IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbmludGVyZmFjZSBUYXNrUmVzcG9uc2Uge1xuICAgIHRhc2tfaWQ6IHN0cmluZztcbiAgICBzdGF0dXM/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUYXNrU3RhdHVzIHtcbiAgICB0YXNrSWQ6IHN0cmluZztcbiAgICBzdGF0dXM6IHN0cmluZztcbiAgICByZXN1bHQ/OiBhbnk7XG4gICAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBIZWFsdGhDaGVja1Jlc3BvbnNlIHtcbiAgICBzdGF0dXM6IHN0cmluZztcbiAgICBtZXNzYWdlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQ2VsZXJ5Q2xpZW50IHtcbiAgICBwcml2YXRlIGxvZ2dlcjogTG9nZ2VyO1xuICAgIHByaXZhdGUgYmFzZVVybDogc3RyaW5nO1xuICAgIHByaXZhdGUgdGFza0VuZHBvaW50OiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBzdGF0dXNFbmRwb2ludDogc3RyaW5nO1xuICAgIHByaXZhdGUgY29uZmlnOiB7XG4gICAgICAgIHRpbWVvdXQ6IG51bWJlcjtcbiAgICAgICAgW2tleTogc3RyaW5nXTogYW55O1xuICAgIH07XG4gICAgcHJpdmF0ZSBpc0luaXRpYWxpemVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcihiYXNlVXJsOiBzdHJpbmcgPSBjb25maWcuQVBJX0VORFBPSU5UKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyID0gY3JlYXRlTG9nZ2VyKCdDZWxlcnlDbGllbnQnKTtcbiAgICAgICAgdGhpcy5iYXNlVXJsID0gYmFzZVVybDtcbiAgICAgICAgdGhpcy50YXNrRW5kcG9pbnQgPSBgJHt0aGlzLmJhc2VVcmx9JHtjb25maWcuZW5kcG9pbnRzLnByb2Nlc3NUZXh0fWA7XG4gICAgICAgIHRoaXMuc3RhdHVzRW5kcG9pbnQgPSBgJHt0aGlzLmJhc2VVcmx9JHtjb25maWcuZW5kcG9pbnRzLnRhc2tTdGF0dXN9YDtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWcuY2VsZXJ5O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnQ2VsZXJ5Q2xpZW50IGluaXRpYWxpemVkJywge1xuICAgICAgICAgICAgYmFzZVVybDogdGhpcy5iYXNlVXJsLFxuICAgICAgICAgICAgdGFza0VuZHBvaW50OiB0aGlzLnRhc2tFbmRwb2ludCxcbiAgICAgICAgICAgIHN0YXR1c0VuZHBvaW50OiB0aGlzLnN0YXR1c0VuZHBvaW50LFxuICAgICAgICAgICAgdGltZW91dDogdGhpcy5jb25maWcudGltZW91dFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDaGVjayBzZXJ2ZXIgY29ubmVjdGlvblxuICAgICAgICB0aGlzLmNoZWNrQ29ubmVjdGlvbigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY2hlY2tDb25uZWN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh0aGlzLmJhc2VVcmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdIRUFEJyxcbiAgICAgICAgICAgICAgICBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoNTAwMClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5pc0luaXRpYWxpemVkID0gcmVzcG9uc2Uub2s7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdTZXJ2ZXIgY29ubmVjdGlvbiBlc3RhYmxpc2hlZCcpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5pc0luaXRpYWxpemVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKCdGYWlsZWQgdG8gY29ubmVjdCB0byBzZXJ2ZXI6JywgeyBcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgICAgICAgICAgYmFzZVVybDogdGhpcy5iYXNlVXJsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBwcm9jZXNzVGV4dCh0ZXh0OiBzdHJpbmcsIG9wdGlvbnM6IFByb2Nlc3NPcHRpb25zID0ge30pOiBQcm9taXNlPFRhc2tTdGF0dXM+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHByb2Nlc3MgdGV4dDogU2VydmVyIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdQcm9jZXNzaW5nIHRleHQgd2l0aCBDZWxlcnknLCB7IFxuICAgICAgICAgICAgdGV4dExlbmd0aDogdGV4dC5sZW5ndGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godGhpcy50YXNrRW5kcG9pbnQsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlOiBvcHRpb25zLmxhbmd1YWdlIHx8ICdlbicsXG4gICAgICAgICAgICAgICAgICAgIHJhdGU6IG9wdGlvbnMucmF0ZSB8fCAxLjAsXG4gICAgICAgICAgICAgICAgICAgIHBpdGNoOiBvcHRpb25zLnBpdGNoIHx8IDEuMCxcbiAgICAgICAgICAgICAgICAgICAgdm9sdW1lOiBvcHRpb25zLnZvbHVtZSB8fCAxLjAsXG4gICAgICAgICAgICAgICAgICAgIGVtb3Rpb25hbENvbnRleHQ6IG9wdGlvbnMuZW1vdGlvbmFsQ29udGV4dCB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgdGV4dFN0cnVjdHVyZTogb3B0aW9ucy50ZXh0U3RydWN0dXJlIHx8IHt9XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KHRoaXMuY29uZmlnLnRpbWVvdXQpXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yRGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKS5jYXRjaCgoKSA9PiAoe30pKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgZXJyb3IhIHN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9LCBtZXNzYWdlOiAke2Vycm9yRGF0YS5lcnJvciB8fCAnVW5rbm93biBlcnJvcid9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCkgYXMgVGFza1Jlc3BvbnNlO1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuc3VjY2VzcygnVGV4dCBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5JywgZGF0YSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRhc2tJZDogZGF0YS50YXNrX2lkLFxuICAgICAgICAgICAgICAgIHN0YXR1czogJ1BFTkRJTkcnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgdGV4dDonLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNoZWNrVGFza1N0YXR1cyh0YXNrSWQ6IHN0cmluZyk6IFByb21pc2U8VGFza1N0YXR1cz4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2hlY2sgdGFzayBzdGF0dXM6IFNlcnZlciBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHt0aGlzLnN0YXR1c0VuZHBvaW50fS8ke3Rhc2tJZH1gKTtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgZXJyb3IhIHN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRhc2tJZCxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IGRhdGEuc3RhdHVzLFxuICAgICAgICAgICAgICAgIHJlc3VsdDogZGF0YS5yZXN1bHQsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGRhdGEuZXJyb3JcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcignRXJyb3IgY2hlY2tpbmcgdGFzayBzdGF0dXM6JywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBwb2xsVGFza1N0YXR1cyh0YXNrSWQ6IHN0cmluZywgaW50ZXJ2YWw6IG51bWJlciA9IDEwMDApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcG9sbCB0YXNrIHN0YXR1czogU2VydmVyIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwb2xsID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHRoaXMuY2hlY2tUYXNrU3RhdHVzKHRhc2tJZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMuc3RhdHVzID09PSAnU1VDQ0VTUycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc3RhdHVzLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdHVzLnN0YXR1cyA9PT0gJ0ZBSUxVUkUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKHN0YXR1cy5lcnJvciB8fCAnVGFzayBmYWlsZWQnKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHBvbGwsIGludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHBvbGwoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNoZWNrSGVhbHRoKCk6IFByb21pc2U8SGVhbHRoQ2hlY2tSZXNwb25zZT4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2hlY2sgaGVhbHRoOiBTZXJ2ZXIgbm90IGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7dGhpcy5iYXNlVXJsfS9oZWFsdGhgLCB7XG4gICAgICAgICAgICAgICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDUwMDApIC8vIFNob3J0IHRpbWVvdXQgZm9yIGhlYWx0aCBjaGVja3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHJlc3BvbnNlLmpzb24oKSBhcyBIZWFsdGhDaGVja1Jlc3BvbnNlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0hlYWx0aCBjaGVjayBmYWlsZWQ6JywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBjYW5jZWxUYXNrKHRhc2tJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNoZWNrQ29ubmVjdGlvbigpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYW5jZWwgdGFzazogU2VydmVyIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke3RoaXMuc3RhdHVzRW5kcG9pbnR9LyR7dGFza0lkfS9jYW5jZWxgLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGNhbmNlbCB0YXNrOiAke3Rhc2tJZH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdFcnJvciBjYW5jZWxpbmcgdGFzazonLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBFeHBvcnQgc2luZ2xldG9uIGluc3RhbmNlXG5leHBvcnQgY29uc3QgY2VsZXJ5Q2xpZW50ID0gbmV3IENlbGVyeUNsaWVudCgpO1xuIiwiLy8gU2ltcGxlIGxvZ2dlciB1dGlsaXR5IGZvciBDaHJvbWUgZXh0ZW5zaW9uXG5cbnR5cGUgTG9nTGV2ZWwgPSAnREVCVUcnIHwgJ0lORk8nIHwgJ1dBUk4nIHwgJ0VSUk9SJyB8ICdTVUNDRVNTJztcblxuaW50ZXJmYWNlIExvZ01lc3NhZ2Uge1xuICAgIHRpbWVzdGFtcDogc3RyaW5nO1xuICAgIGxldmVsOiBMb2dMZXZlbDtcbiAgICBjb250ZXh0OiBzdHJpbmc7XG4gICAgbWVzc2FnZTogc3RyaW5nO1xuICAgIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ2dlciB7XG4gICAgZGVidWcobWVzc2FnZTogc3RyaW5nLCBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQ7XG4gICAgaW5mbyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZDtcbiAgICB3YXJuKG1lc3NhZ2U6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkO1xuICAgIGVycm9yKG1lc3NhZ2U6IHN0cmluZyB8IEVycm9yLCBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQ7XG4gICAgc3VjY2VzcyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZDtcbiAgICBjcmVhdGVTdWJMb2dnZXIoc3ViQ29udGV4dDogc3RyaW5nKTogTG9nZ2VyO1xufVxuXG5jbGFzcyBMb2dnZXJJbXBsIGltcGxlbWVudHMgTG9nZ2VyIHtcbiAgICBwcml2YXRlIGNvbnRleHQ6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2Zvcm1hdE1lc3NhZ2UobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcsIGRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fSk6IExvZ01lc3NhZ2Uge1xuICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgICAgICBsZXZlbCxcbiAgICAgICAgICAgIGNvbnRleHQ6IHRoaXMuY29udGV4dCxcbiAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICBkYXRhXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIGRlYnVnKG1lc3NhZ2U6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5kZWJ1Zyh0aGlzLl9mb3JtYXRNZXNzYWdlKCdERUJVRycsIG1lc3NhZ2UsIGRhdGEpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW5mbyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUuaW5mbyh0aGlzLl9mb3JtYXRNZXNzYWdlKCdJTkZPJywgbWVzc2FnZSwgZGF0YSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyB3YXJuKG1lc3NhZ2U6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS53YXJuKHRoaXMuX2Zvcm1hdE1lc3NhZ2UoJ1dBUk4nLCBtZXNzYWdlLCBkYXRhKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGVycm9yKG1lc3NhZ2U6IHN0cmluZyB8IEVycm9yLCBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQge1xuICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBtZXNzYWdlIGluc3RhbmNlb2YgRXJyb3IgPyBtZXNzYWdlLm1lc3NhZ2UgOiBtZXNzYWdlO1xuICAgICAgICBjb25zdCBlcnJvckRhdGEgPSBtZXNzYWdlIGluc3RhbmNlb2YgRXJyb3IgXG4gICAgICAgICAgICA/IHsgLi4uZGF0YSwgc3RhY2s6IG1lc3NhZ2Uuc3RhY2sgfVxuICAgICAgICAgICAgOiBkYXRhO1xuICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMuX2Zvcm1hdE1lc3NhZ2UoJ0VSUk9SJywgZXJyb3JNZXNzYWdlLCBlcnJvckRhdGEpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3VjY2VzcyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUuaW5mbyh0aGlzLl9mb3JtYXRNZXNzYWdlKCdTVUNDRVNTJywgbWVzc2FnZSwgZGF0YSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVTdWJMb2dnZXIoc3ViQ29udGV4dDogc3RyaW5nKTogTG9nZ2VyIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMb2dnZXJJbXBsKGAke3RoaXMuY29udGV4dH06JHtzdWJDb250ZXh0fWApO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvZ2dlcihjb250ZXh0OiBzdHJpbmcpOiBMb2dnZXIge1xuICAgIHJldHVybiBuZXcgTG9nZ2VySW1wbChjb250ZXh0KTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gQmFja2dyb3VuZCBzY3JpcHQgZm9yIGhhbmRsaW5nIHRleHQtdG8tc3BlZWNoIHByb2Nlc3NpbmdcbmltcG9ydCB7IGNyZWF0ZUxvZ2dlciwgTG9nZ2VyIH0gZnJvbSAnLi91dGlscy9sb2dnZXInO1xuaW1wb3J0IHsgY2VsZXJ5Q2xpZW50IH0gZnJvbSAnLi91dGlscy9jZWxlcnlDbGllbnQnO1xuXG5pbnRlcmZhY2UgVGFza0luZm8ge1xuICAgIHRhc2tJZDogc3RyaW5nO1xuICAgIHN0YXR1czogc3RyaW5nO1xuICAgIHJlc3VsdD86IGFueTtcbiAgICBlcnJvcj86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFByb2Nlc3NUZXh0UmVxdWVzdCB7XG4gICAgdHlwZTogJ3Byb2Nlc3NUZXh0JztcbiAgICB0ZXh0OiBzdHJpbmc7XG4gICAgb3B0aW9uczoge1xuICAgICAgICByYXRlPzogbnVtYmVyO1xuICAgICAgICBwaXRjaD86IG51bWJlcjtcbiAgICAgICAgdm9sdW1lPzogbnVtYmVyO1xuICAgICAgICBsYW5ndWFnZT86IHN0cmluZztcbiAgICB9O1xufVxuXG5jbGFzcyBCYWNrZ3JvdW5kQ29udHJvbGxlciB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IEJhY2tncm91bmRDb250cm9sbGVyO1xuICAgIHByaXZhdGUgbG9nZ2VyOiBMb2dnZXI7XG4gICAgcHJpdmF0ZSBhY3RpdmVUYXNrczogTWFwPG51bWJlciwgc3RyaW5nPjsgLy8gTWFwIG9mIHRhYklkIC0+IHRhc2tJZFxuICAgIHByaXZhdGUgdGFza0NoZWNrSW50ZXJ2YWw6IG51bWJlcjtcblxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyID0gY3JlYXRlTG9nZ2VyKCdCYWNrZ3JvdW5kJyk7XG4gICAgICAgIHRoaXMuYWN0aXZlVGFza3MgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMudGFza0NoZWNrSW50ZXJ2YWwgPSAxMDAwOyAvLyBDaGVjayB0YXNrIHN0YXR1cyBldmVyeSBzZWNvbmRcblxuICAgICAgICAvLyBJbml0aWFsaXplIGxpc3RlbmVyc1xuICAgICAgICB0aGlzLmluaXRpYWxpemVMaXN0ZW5lcnMoKTtcbiAgICAgICAgdGhpcy5jcmVhdGVDb250ZXh0TWVudSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogQmFja2dyb3VuZENvbnRyb2xsZXIge1xuICAgICAgICBpZiAoIUJhY2tncm91bmRDb250cm9sbGVyLmluc3RhbmNlKSB7XG4gICAgICAgICAgICBCYWNrZ3JvdW5kQ29udHJvbGxlci5pbnN0YW5jZSA9IG5ldyBCYWNrZ3JvdW5kQ29udHJvbGxlcigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBCYWNrZ3JvdW5kQ29udHJvbGxlci5pbnN0YW5jZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZUNvbnRleHRNZW51KCk6IHZvaWQge1xuICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLmNyZWF0ZSh7XG4gICAgICAgICAgICBpZDogJ3JlYWRUZXh0JyxcbiAgICAgICAgICAgIHRpdGxlOiAnUmVhZCBTZWxlY3RlZCBUZXh0JyxcbiAgICAgICAgICAgIGNvbnRleHRzOiBbJ3NlbGVjdGlvbiddXG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yO1xuICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIGNyZWF0aW5nIGNvbnRleHQgbWVudTonLCB7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGluaXRpYWxpemVMaXN0ZW5lcnMoKTogdm9pZCB7XG4gICAgICAgIC8vIExpc3RlbiBmb3IgbWVzc2FnZXMgZnJvbSBjb250ZW50IHNjcmlwdHNcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHNlbmRlci50YWI/LmlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3QudHlwZSA9PT0gJ2NvbnRlbnRTY3JpcHRSZWFkeScpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnQ29udGVudCBzY3JpcHQgcmVhZHkgaW4gdGFiOicsIHsgdGFiSWQ6IHNlbmRlci50YWIuaWQgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3QudHlwZSA9PT0gJ3Byb2Nlc3NUZXh0Jykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVByb2Nlc3NUZXh0KHJlcXVlc3QsIHNlbmRlci50YWIuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiBzZW5kUmVzcG9uc2UocmVzcG9uc2UpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHNlbmRSZXNwb25zZSh7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBXaWxsIHJlc3BvbmQgYXN5bmNocm9ub3VzbHlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZSB0YWIgdXBkYXRlc1xuICAgICAgICBjaHJvbWUudGFicy5vblVwZGF0ZWQuYWRkTGlzdGVuZXIoKHRhYklkOiBudW1iZXIsIGNoYW5nZUluZm8pID0+IHtcbiAgICAgICAgICAgIGlmIChjaGFuZ2VJbmZvLnN0YXR1cyA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYW51cFRhc2tzKHRhYklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSGFuZGxlIHRhYiByZW1vdmFsXG4gICAgICAgIGNocm9tZS50YWJzLm9uUmVtb3ZlZC5hZGRMaXN0ZW5lcigodGFiSWQ6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgdGhpcy5jbGVhbnVwVGFza3ModGFiSWQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVByb2Nlc3NUZXh0KHJlcXVlc3Q6IFByb2Nlc3NUZXh0UmVxdWVzdCwgdGFiSWQ6IG51bWJlcik6IFByb21pc2U8VGFza0luZm8+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNlbGVyeUNsaWVudC5wcm9jZXNzVGV4dChyZXF1ZXN0LnRleHQsIHJlcXVlc3Qub3B0aW9ucyk7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVRhc2tzLnNldCh0YWJJZCwgcmVzdWx0LnRhc2tJZCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgdGV4dDonLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBwb2xsVGFza1N0YXR1cyh0YXNrSWQ6IHN0cmluZyk6IFByb21pc2U8VGFza0luZm8+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGNlbGVyeUNsaWVudC5jaGVja1Rhc2tTdGF0dXModGFza0lkKTtcbiAgICAgICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcignRXJyb3IgcG9sbGluZyB0YXNrIHN0YXR1czonLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjbGVhbnVwVGFza3ModGFiSWQ6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCB0YXNrSWQgPSB0aGlzLmFjdGl2ZVRhc2tzLmdldCh0YWJJZCk7XG4gICAgICAgIGlmICh0YXNrSWQpIHtcbiAgICAgICAgICAgIGNlbGVyeUNsaWVudC5jYW5jZWxUYXNrKHRhc2tJZCkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdFcnJvciBjYW5jZWxpbmcgdGFzazonLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVUYXNrcy5kZWxldGUodGFiSWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBub3RpZnlDb250ZW50U2NyaXB0KHRhYklkOiBudW1iZXIsIG1lc3NhZ2U6IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UodGFiSWQsIG1lc3NhZ2UpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuICAgICAgICAgICAgLy8gSWYgdGhlIGNvbnRlbnQgc2NyaXB0IGlzIG5vdCByZWFkeSwgcmV0cnkgYWZ0ZXIgYSBzaG9ydCBkZWxheVxuICAgICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnUmVjZWl2aW5nIGVuZCBkb2VzIG5vdCBleGlzdCcpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5vdGlmeUNvbnRlbnRTY3JpcHQodGFiSWQsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIG5vdGlmeWluZyBjb250ZW50IHNjcmlwdDonLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBFeHBvcnQgc2luZ2xldG9uIGluc3RhbmNlXG5leHBvcnQgY29uc3QgYmFja2dyb3VuZENvbnRyb2xsZXIgPSBCYWNrZ3JvdW5kQ29udHJvbGxlci5nZXRJbnN0YW5jZSgpO1xuXG4vLyBIYW5kbGUgY29udGV4dCBtZW51IGNsaWNrc1xuY2hyb21lLmNvbnRleHRNZW51cy5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoKGluZm8sIHRhYikgPT4ge1xuICAgIGlmIChpbmZvLm1lbnVJdGVtSWQgPT09ICdyZWFkVGV4dCcgJiYgdGFiPy5pZCkge1xuICAgICAgICBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWIuaWQsIHtcbiAgICAgICAgICAgIHR5cGU6ICdyZWFkU2VsZWN0ZWRUZXh0JyxcbiAgICAgICAgICAgIHRleHQ6IGluZm8uc2VsZWN0aW9uVGV4dFxuICAgICAgICB9KTtcbiAgICB9XG59KTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==
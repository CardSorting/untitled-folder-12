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
/*!************************************!*\
  !*** ./src/textProcessorWorker.ts ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/logger */ "./src/utils/logger.ts");
/* harmony import */ var _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/celeryClient */ "./src/utils/celeryClient.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./config */ "./src/config.ts");
// Text processor worker for handling speech synthesis



const logger = (0,_utils_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('TextProcessorWorker');
class TextProcessorWorker {
    constructor() {
        this.logger = (0,_utils_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('TextProcessorWorker');
        this.celeryClient = new _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__.CeleryClient(_config__WEBPACK_IMPORTED_MODULE_2__.config.API_ENDPOINT);
        this.currentOptions = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
        };
    }
    static getInstance() {
        if (!TextProcessorWorker.instance) {
            TextProcessorWorker.instance = new TextProcessorWorker();
        }
        return TextProcessorWorker.instance;
    }
    async processText(text, options = {}) {
        try {
            // Merge options with defaults
            const processOptions = {
                language: options.language || 'en-US',
                rate: options.rate || 1.0,
                pitch: options.pitch || 1.0,
                volume: options.volume || 1.0,
                ...options
            };
            // Merge options with current options
            const mergedOptions = {
                ...this.currentOptions,
                ...processOptions
            };
            this.logger.info('Processing text', {
                length: text.length,
                options: mergedOptions
            });
            // Submit the task to Celery
            const taskId = await this.celeryClient.processText(text, mergedOptions);
            const result = await this.celeryClient.pollTaskStatus(taskId);
            this.logger.info('Text processing result', {
                taskId,
                status: result.status,
                error: result.error || undefined
            });
            return {
                taskId: result.taskId,
                status: result.status,
                result: result.result,
                error: result.error
            };
        }
        catch (error) {
            this.logger.error('Error processing text', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async pollTaskStatus(taskId) {
        try {
            return await this.celeryClient.pollTaskStatus(taskId);
        }
        catch (error) {
            this.logger.error('Error polling task status:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    updateOptions(options) {
        this.currentOptions = {
            ...this.currentOptions,
            ...options
        };
        this.logger.debug('Updated processing options:', this.currentOptions);
    }
    resetOptions() {
        this.currentOptions = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
        };
        this.logger.debug('Reset processing options to defaults');
    }
}
const textProcessor = TextProcessorWorker.getInstance();
self.onmessage = async (event) => {
    const { text, options = {} } = event.data;
    try {
        logger.info('Processing text in worker', { length: text.length });
        const result = await textProcessor.processText(text, options);
        self.postMessage({
            type: 'success',
            result
        });
    }
    catch (error) {
        logger.error('Error processing text in worker', {
            error: error instanceof Error ? error.message : String(error)
        });
        self.postMessage({
            type: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

})();

/******/ })()
;
//# sourceMappingURL=textProcessorWorker.js.map
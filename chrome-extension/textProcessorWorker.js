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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDaEUsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUNiLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDaEUsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztBQUNMLENBQUMsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi8uL3NyYy9jb25maWcudHMiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uLy4vc3JjL3V0aWxzL2NlbGVyeUNsaWVudC50cyIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vLi9zcmMvdXRpbHMvbG9nZ2VyLnRzIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi8uL3NyYy90ZXh0UHJvY2Vzc29yV29ya2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBDaHJvbWUgZXh0ZW5zaW9uXG5cbmludGVyZmFjZSBDb25maWcge1xuICAgIEFQSV9FTkRQT0lOVDogc3RyaW5nO1xuICAgIGNlbGVyeToge1xuICAgICAgICB0aW1lb3V0OiBudW1iZXI7XG4gICAgICAgIHBvbGxJbnRlcnZhbDogbnVtYmVyO1xuICAgICAgICBtYXhSZXRyaWVzOiBudW1iZXI7XG4gICAgfTtcbiAgICBlbmRwb2ludHM6IHtcbiAgICAgICAgcHJvY2Vzc1RleHQ6IHN0cmluZztcbiAgICAgICAgdGFza1N0YXR1czogc3RyaW5nO1xuICAgIH07XG59XG5cbmV4cG9ydCBjb25zdCBjb25maWc6IENvbmZpZyA9IHtcbiAgICBBUElfRU5EUE9JTlQ6ICdodHRwOi8vbG9jYWxob3N0OjUwMDEnLCAvLyBEZWZhdWx0IGxvY2FsIGRldmVsb3BtZW50IHNlcnZlclxuICAgIGNlbGVyeToge1xuICAgICAgICB0aW1lb3V0OiAzMDAwMCwgLy8gMzAgc2Vjb25kc1xuICAgICAgICBwb2xsSW50ZXJ2YWw6IDEwMDAsIC8vIDEgc2Vjb25kXG4gICAgICAgIG1heFJldHJpZXM6IDNcbiAgICB9LFxuICAgIGVuZHBvaW50czoge1xuICAgICAgICBwcm9jZXNzVGV4dDogJy9wcm9jZXNzX3RleHQnLFxuICAgICAgICB0YXNrU3RhdHVzOiAnL3Rhc2tfc3RhdHVzJ1xuICAgIH1cbn07XG4iLCIvLyBDZWxlcnkgY2xpZW50IGZvciBoYW5kbGluZyB0ZXh0IHByb2Nlc3NpbmcgdGFza3NcbmltcG9ydCB7IGNyZWF0ZUxvZ2dlciB9IGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgeyBDZWxlcnlUYXNrLCBDZWxlcnlUYXNrUmVzdWx0LCBDZWxlcnlUYXNrU3RhdHVzLCBIZWFsdGhDaGVja1Jlc3BvbnNlLCBUYXNrUmVzcG9uc2UgfSBmcm9tICcuLi90eXBlcy9jZWxlcnknO1xuaW1wb3J0IHsgTG9nQ29udGV4dCB9IGZyb20gJy4vbG9nZ2VyJztcblxuaW50ZXJmYWNlIFByb2Nlc3NPcHRpb25zIGV4dGVuZHMgTG9nQ29udGV4dCB7XG4gICAgbGFuZ3VhZ2U/OiBzdHJpbmc7XG4gICAgdm9pY2U/OiBzdHJpbmc7XG4gICAgcmF0ZT86IG51bWJlcjtcbiAgICBwaXRjaD86IG51bWJlcjtcbiAgICB2b2x1bWU/OiBudW1iZXI7XG4gICAgZW1vdGlvbmFsQ29udGV4dD86IFJlY29yZDxzdHJpbmcsIGFueT47XG4gICAgdGV4dFN0cnVjdHVyZT86IFJlY29yZDxzdHJpbmcsIGFueT47XG4gICAgW2tleTogc3RyaW5nXTogYW55O1xufVxuXG5jb25zdCBsb2dnZXIgPSBjcmVhdGVMb2dnZXIoJ0NlbGVyeUNsaWVudCcpO1xuXG5leHBvcnQgY2xhc3MgQ2VsZXJ5Q2xpZW50IHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGJhc2VVcmw6IHN0cmluZztcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRhc2tRdWV1ZTogTWFwPHN0cmluZywgQ2VsZXJ5VGFzaz47XG4gICAgcHJpdmF0ZSByZWFkb25seSBwb2xsSW50ZXJ2YWw6IG51bWJlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1heFJldHJpZXM6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKGJhc2VVcmw6IHN0cmluZyA9IGNvbmZpZy5BUElfRU5EUE9JTlQsIHBvbGxJbnRlcnZhbCA9IDEwMDAsIG1heFJldHJpZXMgPSAzKSB7XG4gICAgICAgIHRoaXMuYmFzZVVybCA9IGJhc2VVcmw7XG4gICAgICAgIHRoaXMudGFza1F1ZXVlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnBvbGxJbnRlcnZhbCA9IHBvbGxJbnRlcnZhbDtcbiAgICAgICAgdGhpcy5tYXhSZXRyaWVzID0gbWF4UmV0cmllcztcbiAgICB9XG5cbiAgICBhc3luYyBwcm9jZXNzVGV4dCh0ZXh0OiBzdHJpbmcsIG9wdGlvbnM6IFByb2Nlc3NPcHRpb25zID0ge30pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHt0aGlzLmJhc2VVcmx9JHtjb25maWcuZW5kcG9pbnRzLnByb2Nlc3NUZXh0fWAsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlOiBvcHRpb25zLmxhbmd1YWdlIHx8ICdlbi1VUycsXG4gICAgICAgICAgICAgICAgICAgIHZvaWNlOiBvcHRpb25zLnZvaWNlLFxuICAgICAgICAgICAgICAgICAgICByYXRlOiBvcHRpb25zLnJhdGUsXG4gICAgICAgICAgICAgICAgICAgIHBpdGNoOiBvcHRpb25zLnBpdGNoLFxuICAgICAgICAgICAgICAgICAgICB2b2x1bWU6IG9wdGlvbnMudm9sdW1lLFxuICAgICAgICAgICAgICAgICAgICBlbW90aW9uYWxDb250ZXh0OiBvcHRpb25zLmVtb3Rpb25hbENvbnRleHQgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHRleHRTdHJ1Y3R1cmU6IG9wdGlvbnMudGV4dFN0cnVjdHVyZSB8fCB7fVxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBwcm9jZXNzIHRleHQ6ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZGF0YTogVGFza1Jlc3BvbnNlID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgY29uc3QgdGFza0lkID0gZGF0YS50YXNrX2lkO1xuXG4gICAgICAgICAgICBpZiAoIXRhc2tJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gdGFzayBJRCByZXR1cm5lZCBmcm9tIHNlcnZlcicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnRhc2tRdWV1ZS5zZXQodGFza0lkLCB7XG4gICAgICAgICAgICAgICAgaWQ6IHRhc2tJZCxcbiAgICAgICAgICAgICAgICBuYW1lOiAncHJvY2Vzc1RleHQnLFxuICAgICAgICAgICAgICAgIGFyZ3M6IFt0ZXh0LCBvcHRpb25zXSxcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdQRU5ESU5HJyxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICAgICAgcmV0cmllczogMCxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsb2dnZXIuaW5mbygnVGV4dCBwcm9jZXNzaW5nIHRhc2sgc3VibWl0dGVkJywgeyB0YXNrSWQgfSk7XG4gICAgICAgICAgICByZXR1cm4gdGFza0lkO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIHRleHQnLCB7IGVycm9yOiBTdHJpbmcoZXJyb3IpIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBnZXRUYXNrUmVzdWx0KHRhc2tJZDogc3RyaW5nKTogUHJvbWlzZTxDZWxlcnlUYXNrU3RhdHVzPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke3RoaXMuYmFzZVVybH0ke2NvbmZpZy5lbmRwb2ludHMudGFza1N0YXR1c30vJHt0YXNrSWR9YCk7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZ2V0IHRhc2sgc3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGE6IFRhc2tSZXNwb25zZSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGFza0lkLFxuICAgICAgICAgICAgICAgIHN0YXR1czogZGF0YS5zdGF0dXMsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiBkYXRhLnJlc3VsdCxcbiAgICAgICAgICAgICAgICBlcnJvcjogZGF0YS5lcnJvciB8fCB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZGF0YS5tZXNzYWdlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBnZXR0aW5nIHRhc2sgcmVzdWx0JywgeyB0YXNrSWQsIGVycm9yOiBTdHJpbmcoZXJyb3IpIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBwb2xsVGFza1N0YXR1cyh0YXNrSWQ6IHN0cmluZyk6IFByb21pc2U8Q2VsZXJ5VGFza1N0YXR1cz4ge1xuICAgICAgICBjb25zdCB0YXNrID0gdGhpcy50YXNrUXVldWUuZ2V0KHRhc2tJZCk7XG4gICAgICAgIGlmICghdGFzaykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUYXNrICR7dGFza0lkfSBub3QgZm91bmQgaW4gcXVldWVgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmdldFRhc2tSZXN1bHQodGFza0lkKTtcbiAgICAgICAgICAgIHRhc2suc3RhdHVzID0gcmVzdWx0LnN0YXR1cztcbiAgICAgICAgICAgIHRhc2sucmVzdWx0ID0gcmVzdWx0LnJlc3VsdDtcbiAgICAgICAgICAgIHRhc2suZXJyb3IgPSByZXN1bHQuZXJyb3IgfHwgbnVsbDtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdGF0dXMgPT09ICdTVUNDRVNTJykge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdUYXNrIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHknLCB7IFxuICAgICAgICAgICAgICAgICAgICB0YXNrSWQsIFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHJlc3VsdC5yZXN1bHQgPyBKU09OLnN0cmluZ2lmeShyZXN1bHQucmVzdWx0KSA6IG51bGwgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy50YXNrUXVldWUuZGVsZXRlKHRhc2tJZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5zdGF0dXMgPT09ICdGQUlMVVJFJykge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignVGFzayBmYWlsZWQnLCB7IFxuICAgICAgICAgICAgICAgICAgICB0YXNrSWQsIFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogcmVzdWx0LmVycm9yIHx8ICdVbmtub3duIGVycm9yJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMudGFza1F1ZXVlLmRlbGV0ZSh0YXNrSWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnVGFzayBzdGF0dXMgdXBkYXRlZCcsIHsgXG4gICAgICAgICAgICAgICAgICAgIHRhc2tJZCwgXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogcmVzdWx0LnN0YXR1cyBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRhc2sucmV0cmllcysrO1xuICAgICAgICAgICAgaWYgKHRhc2sucmV0cmllcyA+PSB0aGlzLm1heFJldHJpZXMpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ01heCByZXRyaWVzIHJlYWNoZWQnLCB7IFxuICAgICAgICAgICAgICAgICAgICB0YXNrSWQsIFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgICAgICAgICByZXRyaWVzOiB0YXNrLnJldHJpZXNcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnRhc2tRdWV1ZS5kZWxldGUodGFza0lkKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvZ2dlci53YXJuKCdFcnJvciBwb2xsaW5nIHRhc2sgc3RhdHVzLCByZXRyeWluZycsIHsgXG4gICAgICAgICAgICAgICAgdGFza0lkLCBcbiAgICAgICAgICAgICAgICByZXRyaWVzOiB0YXNrLnJldHJpZXMsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgICAgICB0YXNrSWQsIFxuICAgICAgICAgICAgICAgIHN0YXR1czogJ1BFTkRJTkcnLCBcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsIFxuICAgICAgICAgICAgICAgIGVycm9yOiB1bmRlZmluZWQgXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0UXVldWVkVGFza3MoKTogQ2VsZXJ5VGFza1tdIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy50YXNrUXVldWUudmFsdWVzKCkpO1xuICAgIH1cblxuICAgIGFzeW5jIGNoZWNrSGVhbHRoKCk6IFByb21pc2U8SGVhbHRoQ2hlY2tSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHt0aGlzLmJhc2VVcmx9L2hlYWx0aGAsIHtcbiAgICAgICAgICAgICAgICBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoNTAwMCkgLy8gU2hvcnQgdGltZW91dCBmb3IgaGVhbHRoIGNoZWNrc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgcmVzcG9uc2UuanNvbigpIGFzIEhlYWx0aENoZWNrUmVzcG9uc2U7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0hlYWx0aCBjaGVjayBmYWlsZWQnLCB7IFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgY2FuY2VsVGFzayh0YXNrSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHt0aGlzLmJhc2VVcmx9JHtjb25maWcuZW5kcG9pbnRzLnRhc2tTdGF0dXN9LyR7dGFza0lkfS9jYW5jZWxgLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGNhbmNlbCB0YXNrOiAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGNhbmNlbGluZyB0YXNrJywgeyBcbiAgICAgICAgICAgICAgICB0YXNrSWQsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIEV4cG9ydCBzaW5nbGV0b24gaW5zdGFuY2VcbmV4cG9ydCBjb25zdCBjZWxlcnlDbGllbnQgPSBuZXcgQ2VsZXJ5Q2xpZW50KCk7XG4iLCIvLyBMb2dnZXIgdXRpbGl0eSBmb3IgdGhlIGV4dGVuc2lvblxudHlwZSBMb2dMZXZlbCA9ICdkZWJ1ZycgfCAnaW5mbycgfCAnd2FybicgfCAnZXJyb3InO1xuXG5leHBvcnQgdHlwZSBMb2dWYWx1ZSA9IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsIHwgdW5kZWZpbmVkIHwgUmVjb3JkPHN0cmluZywgYW55PjtcblxuZXhwb3J0IGludGVyZmFjZSBMb2dDb250ZXh0IHtcbiAgICBba2V5OiBzdHJpbmddOiBMb2dWYWx1ZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMb2dnZXIge1xuICAgIGRlYnVnPFQgZXh0ZW5kcyBMb2dDb250ZXh0ID0gTG9nQ29udGV4dD4obWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogVCk6IHZvaWQ7XG4gICAgaW5mbzxUIGV4dGVuZHMgTG9nQ29udGV4dCA9IExvZ0NvbnRleHQ+KG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFQpOiB2b2lkO1xuICAgIHdhcm48VCBleHRlbmRzIExvZ0NvbnRleHQgPSBMb2dDb250ZXh0PihtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBUKTogdm9pZDtcbiAgICBlcnJvcjxUIGV4dGVuZHMgTG9nQ29udGV4dCA9IExvZ0NvbnRleHQ+KG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFQpOiB2b2lkO1xufVxuXG5jbGFzcyBDb25zb2xlTG9nZ2VyIGltcGxlbWVudHMgTG9nZ2VyIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IG5hbWVzcGFjZTogc3RyaW5nO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgbWluTGV2ZWw6IExvZ0xldmVsO1xuXG4gICAgY29uc3RydWN0b3IobmFtZXNwYWNlOiBzdHJpbmcsIG1pbkxldmVsOiBMb2dMZXZlbCA9ICdkZWJ1ZycpIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHRoaXMubWluTGV2ZWwgPSBtaW5MZXZlbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNob3VsZExvZyhsZXZlbDogTG9nTGV2ZWwpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3QgbGV2ZWxzOiBMb2dMZXZlbFtdID0gWydkZWJ1ZycsICdpbmZvJywgJ3dhcm4nLCAnZXJyb3InXTtcbiAgICAgICAgY29uc3QgbWluTGV2ZWxJbmRleCA9IGxldmVscy5pbmRleE9mKHRoaXMubWluTGV2ZWwpO1xuICAgICAgICBjb25zdCBjdXJyZW50TGV2ZWxJbmRleCA9IGxldmVscy5pbmRleE9mKGxldmVsKTtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRMZXZlbEluZGV4ID49IG1pbkxldmVsSW5kZXg7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmb3JtYXRNZXNzYWdlKGxldmVsOiBMb2dMZXZlbCwgbWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGBbJHt0aGlzLm5hbWVzcGFjZX1dIFske2xldmVsLnRvVXBwZXJDYXNlKCl9XSAke21lc3NhZ2V9YDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGZvcm1hdENvbnRleHQ8VCBleHRlbmRzIExvZ0NvbnRleHQ+KGNvbnRleHQ/OiBUKTogVCB8IHVuZGVmaW5lZCB7XG4gICAgICAgIGlmICghY29udGV4dCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQ7XG4gICAgfVxuXG4gICAgZGVidWc8VCBleHRlbmRzIExvZ0NvbnRleHQ+KG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFQpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLnNob3VsZExvZygnZGVidWcnKSkgcmV0dXJuO1xuICAgICAgICBpZiAoY29udGV4dCkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1Zyh0aGlzLmZvcm1hdE1lc3NhZ2UoJ2RlYnVnJywgbWVzc2FnZSksIHRoaXMuZm9ybWF0Q29udGV4dChjb250ZXh0KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKHRoaXMuZm9ybWF0TWVzc2FnZSgnZGVidWcnLCBtZXNzYWdlKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbmZvPFQgZXh0ZW5kcyBMb2dDb250ZXh0PihtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBUKTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5zaG91bGRMb2coJ2luZm8nKSkgcmV0dXJuO1xuICAgICAgICBpZiAoY29udGV4dCkge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKHRoaXMuZm9ybWF0TWVzc2FnZSgnaW5mbycsIG1lc3NhZ2UpLCB0aGlzLmZvcm1hdENvbnRleHQoY29udGV4dCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKHRoaXMuZm9ybWF0TWVzc2FnZSgnaW5mbycsIG1lc3NhZ2UpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHdhcm48VCBleHRlbmRzIExvZ0NvbnRleHQ+KG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFQpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLnNob3VsZExvZygnd2FybicpKSByZXR1cm47XG4gICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4odGhpcy5mb3JtYXRNZXNzYWdlKCd3YXJuJywgbWVzc2FnZSksIHRoaXMuZm9ybWF0Q29udGV4dChjb250ZXh0KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4odGhpcy5mb3JtYXRNZXNzYWdlKCd3YXJuJywgbWVzc2FnZSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZXJyb3I8VCBleHRlbmRzIExvZ0NvbnRleHQ+KG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFQpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLnNob3VsZExvZygnZXJyb3InKSkgcmV0dXJuO1xuICAgICAgICBpZiAoY29udGV4dCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLmZvcm1hdE1lc3NhZ2UoJ2Vycm9yJywgbWVzc2FnZSksIHRoaXMuZm9ybWF0Q29udGV4dChjb250ZXh0KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMuZm9ybWF0TWVzc2FnZSgnZXJyb3InLCBtZXNzYWdlKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMb2dnZXIobmFtZXNwYWNlOiBzdHJpbmcsIG1pbkxldmVsOiBMb2dMZXZlbCA9ICdkZWJ1ZycpOiBMb2dnZXIge1xuICAgIHJldHVybiBuZXcgQ29uc29sZUxvZ2dlcihuYW1lc3BhY2UsIG1pbkxldmVsKTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gVGV4dCBwcm9jZXNzb3Igd29ya2VyIGZvciBoYW5kbGluZyBzcGVlY2ggc3ludGhlc2lzXG5pbXBvcnQgeyBjcmVhdGVMb2dnZXIgfSBmcm9tICcuL3V0aWxzL2xvZ2dlcic7XG5pbXBvcnQgeyBDZWxlcnlDbGllbnQgfSBmcm9tICcuL3V0aWxzL2NlbGVyeUNsaWVudCc7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgeyBMb2dDb250ZXh0IH0gZnJvbSAnLi91dGlscy9sb2dnZXInO1xuXG5pbnRlcmZhY2UgUHJvY2Vzc09wdGlvbnMgZXh0ZW5kcyBMb2dDb250ZXh0IHtcbiAgICBsYW5ndWFnZT86IHN0cmluZztcbiAgICB2b2ljZT86IHN0cmluZztcbiAgICByYXRlPzogbnVtYmVyO1xuICAgIHBpdGNoPzogbnVtYmVyO1xuICAgIHZvbHVtZT86IG51bWJlcjtcbiAgICBlbW90aW9uYWxDb250ZXh0PzogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgICB0ZXh0U3RydWN0dXJlPzogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgICBba2V5OiBzdHJpbmddOiBhbnk7XG59XG5cbmludGVyZmFjZSBQcm9jZXNzUmVzdWx0IHtcbiAgICB0YXNrSWQ6IHN0cmluZztcbiAgICBzdGF0dXM6IHN0cmluZztcbiAgICByZXN1bHQ/OiBhbnk7XG4gICAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcignVGV4dFByb2Nlc3NvcldvcmtlcicpO1xuXG5jbGFzcyBUZXh0UHJvY2Vzc29yV29ya2VyIHtcbiAgICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogVGV4dFByb2Nlc3NvcldvcmtlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNlbGVyeUNsaWVudDogQ2VsZXJ5Q2xpZW50O1xuICAgIHByaXZhdGUgcmVhZG9ubHkgbG9nZ2VyID0gY3JlYXRlTG9nZ2VyKCdUZXh0UHJvY2Vzc29yV29ya2VyJyk7XG4gICAgcHJpdmF0ZSBjdXJyZW50T3B0aW9uczogUHJvY2Vzc09wdGlvbnM7XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNlbGVyeUNsaWVudCA9IG5ldyBDZWxlcnlDbGllbnQoY29uZmlnLkFQSV9FTkRQT0lOVCk7XG4gICAgICAgIHRoaXMuY3VycmVudE9wdGlvbnMgPSB7XG4gICAgICAgICAgICByYXRlOiAxLjAsXG4gICAgICAgICAgICBwaXRjaDogMS4wLFxuICAgICAgICAgICAgdm9sdW1lOiAxLjBcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKCk6IFRleHRQcm9jZXNzb3JXb3JrZXIge1xuICAgICAgICBpZiAoIVRleHRQcm9jZXNzb3JXb3JrZXIuaW5zdGFuY2UpIHtcbiAgICAgICAgICAgIFRleHRQcm9jZXNzb3JXb3JrZXIuaW5zdGFuY2UgPSBuZXcgVGV4dFByb2Nlc3NvcldvcmtlcigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBUZXh0UHJvY2Vzc29yV29ya2VyLmluc3RhbmNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBwcm9jZXNzVGV4dCh0ZXh0OiBzdHJpbmcsIG9wdGlvbnM6IFByb2Nlc3NPcHRpb25zID0ge30pOiBQcm9taXNlPFByb2Nlc3NSZXN1bHQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIE1lcmdlIG9wdGlvbnMgd2l0aCBkZWZhdWx0c1xuICAgICAgICAgICAgY29uc3QgcHJvY2Vzc09wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgbGFuZ3VhZ2U6IG9wdGlvbnMubGFuZ3VhZ2UgfHwgJ2VuLVVTJyxcbiAgICAgICAgICAgICAgICByYXRlOiBvcHRpb25zLnJhdGUgfHwgMS4wLFxuICAgICAgICAgICAgICAgIHBpdGNoOiBvcHRpb25zLnBpdGNoIHx8IDEuMCxcbiAgICAgICAgICAgICAgICB2b2x1bWU6IG9wdGlvbnMudm9sdW1lIHx8IDEuMCxcbiAgICAgICAgICAgICAgICAuLi5vcHRpb25zXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBNZXJnZSBvcHRpb25zIHdpdGggY3VycmVudCBvcHRpb25zXG4gICAgICAgICAgICBjb25zdCBtZXJnZWRPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIC4uLnRoaXMuY3VycmVudE9wdGlvbnMsXG4gICAgICAgICAgICAgICAgLi4ucHJvY2Vzc09wdGlvbnNcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ1Byb2Nlc3NpbmcgdGV4dCcsIHsgXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiB0ZXh0Lmxlbmd0aCwgXG4gICAgICAgICAgICAgICAgb3B0aW9uczogbWVyZ2VkT3B0aW9ucyBcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBTdWJtaXQgdGhlIHRhc2sgdG8gQ2VsZXJ5XG4gICAgICAgICAgICBjb25zdCB0YXNrSWQgPSBhd2FpdCB0aGlzLmNlbGVyeUNsaWVudC5wcm9jZXNzVGV4dCh0ZXh0LCBtZXJnZWRPcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY2VsZXJ5Q2xpZW50LnBvbGxUYXNrU3RhdHVzKHRhc2tJZCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ1RleHQgcHJvY2Vzc2luZyByZXN1bHQnLCB7IFxuICAgICAgICAgICAgICAgIHRhc2tJZCwgXG4gICAgICAgICAgICAgICAgc3RhdHVzOiByZXN1bHQuc3RhdHVzLFxuICAgICAgICAgICAgICAgIGVycm9yOiByZXN1bHQuZXJyb3IgfHwgdW5kZWZpbmVkXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0YXNrSWQ6IHJlc3VsdC50YXNrSWQsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiByZXN1bHQuc3RhdHVzLFxuICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0LnJlc3VsdCxcbiAgICAgICAgICAgICAgICBlcnJvcjogcmVzdWx0LmVycm9yXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgdGV4dCcsIHsgXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcG9sbFRhc2tTdGF0dXModGFza0lkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY2VsZXJ5Q2xpZW50LnBvbGxUYXNrU3RhdHVzKHRhc2tJZCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcignRXJyb3IgcG9sbGluZyB0YXNrIHN0YXR1czonLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZU9wdGlvbnMob3B0aW9uczogUGFydGlhbDxQcm9jZXNzT3B0aW9ucz4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jdXJyZW50T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIC4uLnRoaXMuY3VycmVudE9wdGlvbnMsXG4gICAgICAgICAgICAuLi5vcHRpb25zXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdVcGRhdGVkIHByb2Nlc3Npbmcgb3B0aW9uczonLCB0aGlzLmN1cnJlbnRPcHRpb25zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzZXRPcHRpb25zKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmN1cnJlbnRPcHRpb25zID0ge1xuICAgICAgICAgICAgcmF0ZTogMS4wLFxuICAgICAgICAgICAgcGl0Y2g6IDEuMCxcbiAgICAgICAgICAgIHZvbHVtZTogMS4wXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdSZXNldCBwcm9jZXNzaW5nIG9wdGlvbnMgdG8gZGVmYXVsdHMnKTtcbiAgICB9XG59XG5cbmNvbnN0IHRleHRQcm9jZXNzb3IgPSBUZXh0UHJvY2Vzc29yV29ya2VyLmdldEluc3RhbmNlKCk7XG5cbnNlbGYub25tZXNzYWdlID0gYXN5bmMgKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICBjb25zdCB7IHRleHQsIG9wdGlvbnMgPSB7fSB9ID0gZXZlbnQuZGF0YTtcblxuICAgIHRyeSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdQcm9jZXNzaW5nIHRleHQgaW4gd29ya2VyJywgeyBsZW5ndGg6IHRleHQubGVuZ3RoIH0pO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRleHRQcm9jZXNzb3IucHJvY2Vzc1RleHQodGV4dCwgb3B0aW9ucyk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyB0ZXh0IGluIHdvcmtlcicsIHsgXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpIFxuICAgICAgICB9KTtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
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
/*!************************************!*\
  !*** ./src/textProcessorWorker.ts ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   textProcessorWorker: () => (/* binding */ textProcessorWorker)
/* harmony export */ });
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/logger */ "./src/utils/logger.ts");
/* harmony import */ var _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/celeryClient */ "./src/utils/celeryClient.ts");
// Text processor worker for handling speech synthesis


class TextProcessorWorker {
    constructor() {
        this.logger = (0,_utils_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('TextProcessor');
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
                ...this.currentOptions,
                ...options
            };
            // Log the processing request
            this.logger.debug('Processing text', {
                textLength: text.length,
                options: processOptions
            });
            // Submit the task to Celery
            const { taskId } = await _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__.celeryClient.processText(text, processOptions);
            return {
                taskId,
                status: 'PENDING'
            };
        }
        catch (error) {
            this.logger.error('Error processing text:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    async pollTaskStatus(taskId) {
        try {
            return await _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__.celeryClient.pollTaskStatus(taskId);
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
// Export singleton instance
const textProcessorWorker = TextProcessorWorker.getInstance();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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TSxhQUFhLENBQUMsT0FBZ0M7UUFDakQsSUFBSSxDQUFDLGNBQWMsR0FBRztZQUNsQixHQUFHLElBQUksQ0FBQyxjQUFjO1lBQ3RCLEdBQUcsT0FBTztTQUNiLENBQUM7UUFDRixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVNLFlBQVk7UUFDZixJQUFJLENBQUMsY0FBYyxHQUFHO1lBQ2xCLElBQUksRUFBRSxHQUFHO1lBQ1QsS0FBSyxFQUFFLEdBQUc7WUFDVixNQUFNLEVBQUUsR0FBRztTQUNkLENBQUM7UUFDRixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO0lBQzlELENBQUM7Q0FDSjtBQUVELDRCQUE0QjtBQUNyQixNQUFNLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uLy4vc3JjL2NvbmZpZy50cyIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vLi9zcmMvdXRpbHMvY2VsZXJ5Q2xpZW50LnRzIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi8uL3NyYy91dGlscy9sb2dnZXIudHMiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uLy4vc3JjL3RleHRQcm9jZXNzb3JXb3JrZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29uZmlndXJhdGlvbiBmb3IgdGhlIENocm9tZSBleHRlbnNpb25cblxuaW50ZXJmYWNlIENvbmZpZyB7XG4gICAgQVBJX0VORFBPSU5UOiBzdHJpbmc7XG4gICAgY2VsZXJ5OiB7XG4gICAgICAgIHRpbWVvdXQ6IG51bWJlcjtcbiAgICAgICAgcG9sbEludGVydmFsOiBudW1iZXI7XG4gICAgICAgIG1heFJldHJpZXM6IG51bWJlcjtcbiAgICB9O1xuICAgIGVuZHBvaW50czoge1xuICAgICAgICBwcm9jZXNzVGV4dDogc3RyaW5nO1xuICAgICAgICB0YXNrU3RhdHVzOiBzdHJpbmc7XG4gICAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IGNvbmZpZzogQ29uZmlnID0ge1xuICAgIEFQSV9FTkRQT0lOVDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMScsIC8vIERlZmF1bHQgbG9jYWwgZGV2ZWxvcG1lbnQgc2VydmVyXG4gICAgY2VsZXJ5OiB7XG4gICAgICAgIHRpbWVvdXQ6IDMwMDAwLCAvLyAzMCBzZWNvbmRzXG4gICAgICAgIHBvbGxJbnRlcnZhbDogMTAwMCwgLy8gMSBzZWNvbmRcbiAgICAgICAgbWF4UmV0cmllczogM1xuICAgIH0sXG4gICAgZW5kcG9pbnRzOiB7XG4gICAgICAgIHByb2Nlc3NUZXh0OiAnL3Byb2Nlc3NfdGV4dCcsXG4gICAgICAgIHRhc2tTdGF0dXM6ICcvdGFza19zdGF0dXMnXG4gICAgfVxufTtcbiIsIi8vIENlbGVyeSBjbGllbnQgZm9yIGhhbmRsaW5nIHRleHQgcHJvY2Vzc2luZyB0YXNrc1xuaW1wb3J0IHsgY3JlYXRlTG9nZ2VyLCBMb2dnZXIgfSBmcm9tICcuL2xvZ2dlcic7XG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuXG5pbnRlcmZhY2UgUHJvY2Vzc09wdGlvbnMge1xuICAgIGxhbmd1YWdlPzogc3RyaW5nO1xuICAgIHJhdGU/OiBudW1iZXI7XG4gICAgcGl0Y2g/OiBudW1iZXI7XG4gICAgdm9sdW1lPzogbnVtYmVyO1xuICAgIGVtb3Rpb25hbENvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICAgIHRleHRTdHJ1Y3R1cmU/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG5pbnRlcmZhY2UgVGFza1Jlc3BvbnNlIHtcbiAgICB0YXNrX2lkOiBzdHJpbmc7XG4gICAgc3RhdHVzPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVGFza1N0YXR1cyB7XG4gICAgdGFza0lkOiBzdHJpbmc7XG4gICAgc3RhdHVzOiBzdHJpbmc7XG4gICAgcmVzdWx0PzogYW55O1xuICAgIGVycm9yPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSGVhbHRoQ2hlY2tSZXNwb25zZSB7XG4gICAgc3RhdHVzOiBzdHJpbmc7XG4gICAgbWVzc2FnZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIENlbGVyeUNsaWVudCB7XG4gICAgcHJpdmF0ZSBsb2dnZXI6IExvZ2dlcjtcbiAgICBwcml2YXRlIGJhc2VVcmw6IHN0cmluZztcbiAgICBwcml2YXRlIHRhc2tFbmRwb2ludDogc3RyaW5nO1xuICAgIHByaXZhdGUgc3RhdHVzRW5kcG9pbnQ6IHN0cmluZztcbiAgICBwcml2YXRlIGNvbmZpZzoge1xuICAgICAgICB0aW1lb3V0OiBudW1iZXI7XG4gICAgICAgIFtrZXk6IHN0cmluZ106IGFueTtcbiAgICB9O1xuICAgIHByaXZhdGUgaXNJbml0aWFsaXplZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgY29uc3RydWN0b3IoYmFzZVVybDogc3RyaW5nID0gY29uZmlnLkFQSV9FTkRQT0lOVCkge1xuICAgICAgICB0aGlzLmxvZ2dlciA9IGNyZWF0ZUxvZ2dlcignQ2VsZXJ5Q2xpZW50Jyk7XG4gICAgICAgIHRoaXMuYmFzZVVybCA9IGJhc2VVcmw7XG4gICAgICAgIHRoaXMudGFza0VuZHBvaW50ID0gYCR7dGhpcy5iYXNlVXJsfSR7Y29uZmlnLmVuZHBvaW50cy5wcm9jZXNzVGV4dH1gO1xuICAgICAgICB0aGlzLnN0YXR1c0VuZHBvaW50ID0gYCR7dGhpcy5iYXNlVXJsfSR7Y29uZmlnLmVuZHBvaW50cy50YXNrU3RhdHVzfWA7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnLmNlbGVyeTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ0NlbGVyeUNsaWVudCBpbml0aWFsaXplZCcsIHtcbiAgICAgICAgICAgIGJhc2VVcmw6IHRoaXMuYmFzZVVybCxcbiAgICAgICAgICAgIHRhc2tFbmRwb2ludDogdGhpcy50YXNrRW5kcG9pbnQsXG4gICAgICAgICAgICBzdGF0dXNFbmRwb2ludDogdGhpcy5zdGF0dXNFbmRwb2ludCxcbiAgICAgICAgICAgIHRpbWVvdXQ6IHRoaXMuY29uZmlnLnRpbWVvdXRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ2hlY2sgc2VydmVyIGNvbm5lY3Rpb25cbiAgICAgICAgdGhpcy5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNoZWNrQ29ubmVjdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godGhpcy5iYXNlVXJsLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnSEVBRCcsXG4gICAgICAgICAgICAgICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDUwMDApXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IHJlc3BvbnNlLm9rO1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnU2VydmVyIGNvbm5lY3Rpb24gZXN0YWJsaXNoZWQnKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuaXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybignRmFpbGVkIHRvIGNvbm5lY3QgdG8gc2VydmVyOicsIHsgXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICAgICAgICAgIGJhc2VVcmw6IHRoaXMuYmFzZVVybFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcHJvY2Vzc1RleHQodGV4dDogc3RyaW5nLCBvcHRpb25zOiBQcm9jZXNzT3B0aW9ucyA9IHt9KTogUHJvbWlzZTxUYXNrU3RhdHVzPiB7XG4gICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNoZWNrQ29ubmVjdGlvbigpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBwcm9jZXNzIHRleHQ6IFNlcnZlciBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnUHJvY2Vzc2luZyB0ZXh0IHdpdGggQ2VsZXJ5JywgeyBcbiAgICAgICAgICAgIHRleHRMZW5ndGg6IHRleHQubGVuZ3RoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHRoaXMudGFza0VuZHBvaW50LCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBsYW5ndWFnZTogb3B0aW9ucy5sYW5ndWFnZSB8fCAnZW4nLFxuICAgICAgICAgICAgICAgICAgICByYXRlOiBvcHRpb25zLnJhdGUgfHwgMS4wLFxuICAgICAgICAgICAgICAgICAgICBwaXRjaDogb3B0aW9ucy5waXRjaCB8fCAxLjAsXG4gICAgICAgICAgICAgICAgICAgIHZvbHVtZTogb3B0aW9ucy52b2x1bWUgfHwgMS4wLFxuICAgICAgICAgICAgICAgICAgICBlbW90aW9uYWxDb250ZXh0OiBvcHRpb25zLmVtb3Rpb25hbENvbnRleHQgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHRleHRTdHJ1Y3R1cmU6IG9wdGlvbnMudGV4dFN0cnVjdHVyZSB8fCB7fVxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIHNpZ25hbDogQWJvcnRTaWduYWwudGltZW91dCh0aGlzLmNvbmZpZy50aW1lb3V0KVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvckRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCkuY2F0Y2goKCkgPT4gKHt9KSk7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQIGVycm9yISBzdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfSwgbWVzc2FnZTogJHtlcnJvckRhdGEuZXJyb3IgfHwgJ1Vua25vd24gZXJyb3InfWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpIGFzIFRhc2tSZXNwb25zZTtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLnN1Y2Nlc3MoJ1RleHQgcHJvY2Vzc2VkIHN1Y2Nlc3NmdWxseScsIGRhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0YXNrSWQ6IGRhdGEudGFza19pZCxcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdQRU5ESU5HJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIHRleHQ6JywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBjaGVja1Rhc2tTdGF0dXModGFza0lkOiBzdHJpbmcpOiBQcm9taXNlPFRhc2tTdGF0dXM+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNoZWNrIHRhc2sgc3RhdHVzOiBTZXJ2ZXIgbm90IGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7dGhpcy5zdGF0dXNFbmRwb2ludH0vJHt0YXNrSWR9YCk7XG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQIGVycm9yISBzdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0YXNrSWQsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBkYXRhLnN0YXR1cyxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IGRhdGEucmVzdWx0LFxuICAgICAgICAgICAgICAgIGVycm9yOiBkYXRhLmVycm9yXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIGNoZWNraW5nIHRhc2sgc3RhdHVzOicsIHsgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcG9sbFRhc2tTdGF0dXModGFza0lkOiBzdHJpbmcsIGludGVydmFsOiBudW1iZXIgPSAxMDAwKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHBvbGwgdGFzayBzdGF0dXM6IFNlcnZlciBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcG9sbCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCB0aGlzLmNoZWNrVGFza1N0YXR1cyh0YXNrSWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzLnN0YXR1cyA9PT0gJ1NVQ0NFU1MnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHN0YXR1cy5yZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXR1cy5zdGF0dXMgPT09ICdGQUlMVVJFJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihzdGF0dXMuZXJyb3IgfHwgJ1Rhc2sgZmFpbGVkJykpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChwb2xsLCBpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBwb2xsKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBjaGVja0hlYWx0aCgpOiBQcm9taXNlPEhlYWx0aENoZWNrUmVzcG9uc2U+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNoZWNrIGhlYWx0aDogU2VydmVyIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke3RoaXMuYmFzZVVybH0vaGVhbHRoYCwge1xuICAgICAgICAgICAgICAgIHNpZ25hbDogQWJvcnRTaWduYWwudGltZW91dCg1MDAwKSAvLyBTaG9ydCB0aW1lb3V0IGZvciBoZWFsdGggY2hlY2tzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKCkgYXMgSGVhbHRoQ2hlY2tSZXNwb25zZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdIZWFsdGggY2hlY2sgZmFpbGVkOicsIHsgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgY2FuY2VsVGFzayh0YXNrSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2FuY2VsIHRhc2s6IFNlcnZlciBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHt0aGlzLnN0YXR1c0VuZHBvaW50fS8ke3Rhc2tJZH0vY2FuY2VsYCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjYW5jZWwgdGFzazogJHt0YXNrSWR9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcignRXJyb3IgY2FuY2VsaW5nIHRhc2s6JywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gRXhwb3J0IHNpbmdsZXRvbiBpbnN0YW5jZVxuZXhwb3J0IGNvbnN0IGNlbGVyeUNsaWVudCA9IG5ldyBDZWxlcnlDbGllbnQoKTtcbiIsIi8vIFNpbXBsZSBsb2dnZXIgdXRpbGl0eSBmb3IgQ2hyb21lIGV4dGVuc2lvblxuXG50eXBlIExvZ0xldmVsID0gJ0RFQlVHJyB8ICdJTkZPJyB8ICdXQVJOJyB8ICdFUlJPUicgfCAnU1VDQ0VTUyc7XG5cbmludGVyZmFjZSBMb2dNZXNzYWdlIHtcbiAgICB0aW1lc3RhbXA6IHN0cmluZztcbiAgICBsZXZlbDogTG9nTGV2ZWw7XG4gICAgY29udGV4dDogc3RyaW5nO1xuICAgIG1lc3NhZ2U6IHN0cmluZztcbiAgICBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMb2dnZXIge1xuICAgIGRlYnVnKG1lc3NhZ2U6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkO1xuICAgIGluZm8obWVzc2FnZTogc3RyaW5nLCBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQ7XG4gICAgd2FybihtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZDtcbiAgICBlcnJvcihtZXNzYWdlOiBzdHJpbmcgfCBFcnJvciwgZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkO1xuICAgIHN1Y2Nlc3MobWVzc2FnZTogc3RyaW5nLCBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQ7XG4gICAgY3JlYXRlU3ViTG9nZ2VyKHN1YkNvbnRleHQ6IHN0cmluZyk6IExvZ2dlcjtcbn1cblxuY2xhc3MgTG9nZ2VySW1wbCBpbXBsZW1lbnRzIExvZ2dlciB7XG4gICAgcHJpdmF0ZSBjb250ZXh0OiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9mb3JtYXRNZXNzYWdlKGxldmVsOiBMb2dMZXZlbCwgbWVzc2FnZTogc3RyaW5nLCBkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge30pOiBMb2dNZXNzYWdlIHtcbiAgICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICAgICAgbGV2ZWwsXG4gICAgICAgICAgICBjb250ZXh0OiB0aGlzLmNvbnRleHQsXG4gICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgZGF0YVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWJ1ZyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcodGhpcy5fZm9ybWF0TWVzc2FnZSgnREVCVUcnLCBtZXNzYWdlLCBkYXRhKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGluZm8obWVzc2FnZTogc3RyaW5nLCBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmluZm8odGhpcy5fZm9ybWF0TWVzc2FnZSgnSU5GTycsIG1lc3NhZ2UsIGRhdGEpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgd2FybihtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUud2Fybih0aGlzLl9mb3JtYXRNZXNzYWdlKCdXQVJOJywgbWVzc2FnZSwgZGF0YSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBlcnJvcihtZXNzYWdlOiBzdHJpbmcgfCBFcnJvciwgZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gbWVzc2FnZSBpbnN0YW5jZW9mIEVycm9yID8gbWVzc2FnZS5tZXNzYWdlIDogbWVzc2FnZTtcbiAgICAgICAgY29uc3QgZXJyb3JEYXRhID0gbWVzc2FnZSBpbnN0YW5jZW9mIEVycm9yIFxuICAgICAgICAgICAgPyB7IC4uLmRhdGEsIHN0YWNrOiBtZXNzYWdlLnN0YWNrIH1cbiAgICAgICAgICAgIDogZGF0YTtcbiAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLl9mb3JtYXRNZXNzYWdlKCdFUlJPUicsIGVycm9yTWVzc2FnZSwgZXJyb3JEYXRhKSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN1Y2Nlc3MobWVzc2FnZTogc3RyaW5nLCBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmluZm8odGhpcy5fZm9ybWF0TWVzc2FnZSgnU1VDQ0VTUycsIG1lc3NhZ2UsIGRhdGEpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlU3ViTG9nZ2VyKHN1YkNvbnRleHQ6IHN0cmluZyk6IExvZ2dlciB7XG4gICAgICAgIHJldHVybiBuZXcgTG9nZ2VySW1wbChgJHt0aGlzLmNvbnRleHR9OiR7c3ViQ29udGV4dH1gKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMb2dnZXIoY29udGV4dDogc3RyaW5nKTogTG9nZ2VyIHtcbiAgICByZXR1cm4gbmV3IExvZ2dlckltcGwoY29udGV4dCk7XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIi8vIFRleHQgcHJvY2Vzc29yIHdvcmtlciBmb3IgaGFuZGxpbmcgc3BlZWNoIHN5bnRoZXNpc1xuaW1wb3J0IHsgY3JlYXRlTG9nZ2VyLCBMb2dnZXIgfSBmcm9tICcuL3V0aWxzL2xvZ2dlcic7XG5pbXBvcnQgeyBjZWxlcnlDbGllbnQgfSBmcm9tICcuL3V0aWxzL2NlbGVyeUNsaWVudCc7XG5cbmludGVyZmFjZSBQcm9jZXNzT3B0aW9ucyB7XG4gICAgcmF0ZT86IG51bWJlcjtcbiAgICBwaXRjaD86IG51bWJlcjtcbiAgICB2b2x1bWU/OiBudW1iZXI7XG4gICAgbGFuZ3VhZ2U/OiBzdHJpbmc7XG4gICAgZW1vdGlvbmFsQ29udGV4dD86IFJlY29yZDxzdHJpbmcsIGFueT47XG4gICAgdGV4dFN0cnVjdHVyZT86IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbmludGVyZmFjZSBUYXNrUmVzdWx0IHtcbiAgICB0YXNrSWQ6IHN0cmluZztcbiAgICBzdGF0dXM6IHN0cmluZztcbiAgICByZXN1bHQ/OiBhbnk7XG4gICAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmNsYXNzIFRleHRQcm9jZXNzb3JXb3JrZXIge1xuICAgIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBUZXh0UHJvY2Vzc29yV29ya2VyO1xuICAgIHByaXZhdGUgbG9nZ2VyOiBMb2dnZXI7XG4gICAgcHJpdmF0ZSBjdXJyZW50T3B0aW9uczogUHJvY2Vzc09wdGlvbnM7XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxvZ2dlciA9IGNyZWF0ZUxvZ2dlcignVGV4dFByb2Nlc3NvcicpO1xuICAgICAgICB0aGlzLmN1cnJlbnRPcHRpb25zID0ge1xuICAgICAgICAgICAgcmF0ZTogMS4wLFxuICAgICAgICAgICAgcGl0Y2g6IDEuMCxcbiAgICAgICAgICAgIHZvbHVtZTogMS4wXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBUZXh0UHJvY2Vzc29yV29ya2VyIHtcbiAgICAgICAgaWYgKCFUZXh0UHJvY2Vzc29yV29ya2VyLmluc3RhbmNlKSB7XG4gICAgICAgICAgICBUZXh0UHJvY2Vzc29yV29ya2VyLmluc3RhbmNlID0gbmV3IFRleHRQcm9jZXNzb3JXb3JrZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gVGV4dFByb2Nlc3Nvcldvcmtlci5pbnN0YW5jZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcHJvY2Vzc1RleHQodGV4dDogc3RyaW5nLCBvcHRpb25zOiBQcm9jZXNzT3B0aW9ucyA9IHt9KTogUHJvbWlzZTxUYXNrUmVzdWx0PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBNZXJnZSBvcHRpb25zIHdpdGggZGVmYXVsdHNcbiAgICAgICAgICAgIGNvbnN0IHByb2Nlc3NPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIC4uLnRoaXMuY3VycmVudE9wdGlvbnMsXG4gICAgICAgICAgICAgICAgLi4ub3B0aW9uc1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gTG9nIHRoZSBwcm9jZXNzaW5nIHJlcXVlc3RcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdQcm9jZXNzaW5nIHRleHQnLCB7XG4gICAgICAgICAgICAgICAgdGV4dExlbmd0aDogdGV4dC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgb3B0aW9uczogcHJvY2Vzc09wdGlvbnNcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBTdWJtaXQgdGhlIHRhc2sgdG8gQ2VsZXJ5XG4gICAgICAgICAgICBjb25zdCB7IHRhc2tJZCB9ID0gYXdhaXQgY2VsZXJ5Q2xpZW50LnByb2Nlc3NUZXh0KHRleHQsIHByb2Nlc3NPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGFza0lkLFxuICAgICAgICAgICAgICAgIHN0YXR1czogJ1BFTkRJTkcnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgdGV4dDonLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHBvbGxUYXNrU3RhdHVzKHRhc2tJZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBjZWxlcnlDbGllbnQucG9sbFRhc2tTdGF0dXModGFza0lkKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdFcnJvciBwb2xsaW5nIHRhc2sgc3RhdHVzOicsIHsgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlT3B0aW9ucyhvcHRpb25zOiBQYXJ0aWFsPFByb2Nlc3NPcHRpb25zPik6IHZvaWQge1xuICAgICAgICB0aGlzLmN1cnJlbnRPcHRpb25zID0ge1xuICAgICAgICAgICAgLi4udGhpcy5jdXJyZW50T3B0aW9ucyxcbiAgICAgICAgICAgIC4uLm9wdGlvbnNcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ1VwZGF0ZWQgcHJvY2Vzc2luZyBvcHRpb25zOicsIHRoaXMuY3VycmVudE9wdGlvbnMpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXNldE9wdGlvbnMoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY3VycmVudE9wdGlvbnMgPSB7XG4gICAgICAgICAgICByYXRlOiAxLjAsXG4gICAgICAgICAgICBwaXRjaDogMS4wLFxuICAgICAgICAgICAgdm9sdW1lOiAxLjBcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ1Jlc2V0IHByb2Nlc3Npbmcgb3B0aW9ucyB0byBkZWZhdWx0cycpO1xuICAgIH1cbn1cblxuLy8gRXhwb3J0IHNpbmdsZXRvbiBpbnN0YW5jZVxuZXhwb3J0IGNvbnN0IHRleHRQcm9jZXNzb3JXb3JrZXIgPSBUZXh0UHJvY2Vzc29yV29ya2VyLmdldEluc3RhbmNlKCk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
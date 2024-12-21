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
/*!************************!*\
  !*** ./src/content.ts ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   contentController: () => (/* binding */ contentController)
/* harmony export */ });
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/logger */ "./src/utils/logger.ts");
/* harmony import */ var _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/celeryClient */ "./src/utils/celeryClient.ts");
// Content script for handling text selection and speech synthesis


class ContentController {
    constructor() {
        this.logger = (0,_utils_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('Content');
        this.state = {
            isProcessing: false,
            isPaused: false,
            selectedText: '',
            currentUtterance: null,
            preferredVoice: null,
            settings: {
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                autoResume: true,
                language: document.documentElement.lang || 'en'
            }
        };
        // Initialize web speech synthesis
        this.speechSynthesis = window.speechSynthesis;
        this.voices = [];
        // Initialize listeners
        this.initializeListeners();
        // Signal that content script is ready with retry
        this.signalContentScriptReady();
    }
    static getInstance() {
        if (!ContentController.instance) {
            ContentController.instance = new ContentController();
        }
        return ContentController.instance;
    }
    async loadSettings() {
        try {
            const settings = await chrome.storage.local.get('ttsSettings');
            if (settings.ttsSettings) {
                this.state.settings = { ...this.state.settings, ...settings.ttsSettings };
            }
        }
        catch (error) {
            this.logger.error('Error loading settings:', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async saveSettings() {
        try {
            await chrome.storage.local.set({ ttsSettings: this.state.settings });
        }
        catch (error) {
            this.logger.error('Error saving settings:', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async initializeVoices() {
        if ('onvoiceschanged' in this.speechSynthesis) {
            this.speechSynthesis.onvoiceschanged = () => {
                this.voices = this.speechSynthesis.getVoices();
                const preferredVoice = this.voices.find(voice => voice.lang.startsWith(this.state.settings.language));
                if (preferredVoice) {
                    this.state.preferredVoice = preferredVoice;
                }
            };
        }
        this.voices = this.speechSynthesis.getVoices();
    }
    initializeListeners() {
        // Listen for messages from the background script
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
        // Listen for text selection
        document.addEventListener('mouseup', this.handleTextSelection.bind(this));
        document.addEventListener('keyup', this.handleKeyboardShortcuts.bind(this));
        // Handle visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }
    handleMessage(message, sender, sendResponse) {
        if (message.type === 'updateSettings') {
            this.updateSettings(message.settings);
            sendResponse({ success: true });
        }
    }
    handleTextSelection(event) {
        const selection = window.getSelection();
        if (selection) {
            this.state.selectedText = selection.toString().trim();
        }
    }
    handleKeyboardShortcuts(event) {
        // Add keyboard shortcut handling logic here
    }
    handleVisibilityChange() {
        if (document.hidden && this.state.settings.autoResume) {
            this.pauseSpeech();
        }
        else {
            this.resumeSpeech();
        }
    }
    handleBeforeUnload() {
        this.stopSpeech();
    }
    updateSettings(newSettings) {
        this.state.settings = { ...this.state.settings, ...newSettings };
        this.saveSettings();
    }
    async speakText(text, options = {}) {
        if (this.state.isProcessing) {
            return;
        }
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = options.rate || this.state.settings.rate;
            utterance.pitch = options.pitch || this.state.settings.pitch;
            utterance.volume = options.volume || this.state.settings.volume;
            utterance.voice = this.state.preferredVoice;
            // Handle speech events
            utterance.onstart = this.onstart.bind(this);
            utterance.onend = this.onend.bind(this);
            utterance.onerror = this.onerror.bind(this);
            utterance.onpause = this.onpause.bind(this);
            utterance.onresume = this.onresume.bind(this);
            utterance.onboundary = this.onboundary.bind(this);
            this.state.currentUtterance = utterance;
            this.state.isProcessing = true;
            this.speechSynthesis.speak(utterance);
        }
        catch (error) {
            this.handleError(error);
        }
    }
    onstart() {
        this.logger.debug('Speech started');
    }
    onend() {
        this.logger.debug('Speech ended');
        this.reset();
    }
    onerror(event) {
        this.logger.error('Speech error:', event);
        this.reset();
    }
    onpause() {
        this.logger.debug('Speech paused');
    }
    onresume() {
        this.logger.debug('Speech resumed');
    }
    onboundary(event) {
        this.logger.debug('Speech boundary reached:', event);
    }
    pauseSpeech() {
        if (this.speechSynthesis.speaking && !this.state.isPaused) {
            this.speechSynthesis.pause();
            this.state.isPaused = true;
        }
    }
    resumeSpeech() {
        if (this.state.isPaused) {
            this.speechSynthesis.resume();
            this.state.isPaused = false;
        }
    }
    stopSpeech() {
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }
        this.reset();
    }
    reset() {
        this.state.isProcessing = false;
        this.state.currentUtterance = null;
        this.state.isPaused = false;
    }
    handleError(error) {
        this.logger.error('Error:', { error: error instanceof Error ? error.message : 'Unknown error' });
        this.reset();
    }
    async processSelectedText() {
        if (this.state.isProcessing || !this.state.selectedText) {
            return;
        }
        try {
            await _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__.celeryClient.processText(this.state.selectedText, this.state.settings);
            // The background script will handle the result and call back with processResult
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async signalContentScriptReady(retries = 3) {
        try {
            await chrome.runtime.sendMessage({ type: 'contentScriptReady' });
            this.logger.info('Content script ready signal sent successfully');
        }
        catch (error) {
            if (retries > 0 && error instanceof Error && error.message.includes('Receiving end does not exist')) {
                this.logger.info('Background script not ready, retrying in 1 second...');
                setTimeout(() => this.signalContentScriptReady(retries - 1), 1000);
            }
            else {
                this.logger.error('Failed to signal content script ready:', { error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }
    }
}
// Export singleton instance
const contentController = ContentController.getInstance();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDLHNEQUFzRCxDQUFDLENBQUM7Z0JBQ3pFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7aUJBQU0sQ0FBQztnQkFDSixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQ3JJLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBRUQsNEJBQTRCO0FBQ3JCLE1BQU0saUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsV0FBVyxFQUFFLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vLi9zcmMvY29uZmlnLnRzIiwid2VicGFjazovL3RleHQtcmVhZGVyLWV4dGVuc2lvbi8uL3NyYy91dGlscy9jZWxlcnlDbGllbnQudHMiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uLy4vc3JjL3V0aWxzL2xvZ2dlci50cyIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vdGV4dC1yZWFkZXItZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly90ZXh0LXJlYWRlci1leHRlbnNpb24vLi9zcmMvY29udGVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb25maWd1cmF0aW9uIGZvciB0aGUgQ2hyb21lIGV4dGVuc2lvblxuXG5pbnRlcmZhY2UgQ29uZmlnIHtcbiAgICBBUElfRU5EUE9JTlQ6IHN0cmluZztcbiAgICBjZWxlcnk6IHtcbiAgICAgICAgdGltZW91dDogbnVtYmVyO1xuICAgICAgICBwb2xsSW50ZXJ2YWw6IG51bWJlcjtcbiAgICAgICAgbWF4UmV0cmllczogbnVtYmVyO1xuICAgIH07XG4gICAgZW5kcG9pbnRzOiB7XG4gICAgICAgIHByb2Nlc3NUZXh0OiBzdHJpbmc7XG4gICAgICAgIHRhc2tTdGF0dXM6IHN0cmluZztcbiAgICB9O1xufVxuXG5leHBvcnQgY29uc3QgY29uZmlnOiBDb25maWcgPSB7XG4gICAgQVBJX0VORFBPSU5UOiAnaHR0cDovL2xvY2FsaG9zdDo1MDAxJywgLy8gRGVmYXVsdCBsb2NhbCBkZXZlbG9wbWVudCBzZXJ2ZXJcbiAgICBjZWxlcnk6IHtcbiAgICAgICAgdGltZW91dDogMzAwMDAsIC8vIDMwIHNlY29uZHNcbiAgICAgICAgcG9sbEludGVydmFsOiAxMDAwLCAvLyAxIHNlY29uZFxuICAgICAgICBtYXhSZXRyaWVzOiAzXG4gICAgfSxcbiAgICBlbmRwb2ludHM6IHtcbiAgICAgICAgcHJvY2Vzc1RleHQ6ICcvcHJvY2Vzc190ZXh0JyxcbiAgICAgICAgdGFza1N0YXR1czogJy90YXNrX3N0YXR1cydcbiAgICB9XG59O1xuIiwiLy8gQ2VsZXJ5IGNsaWVudCBmb3IgaGFuZGxpbmcgdGV4dCBwcm9jZXNzaW5nIHRhc2tzXG5pbXBvcnQgeyBjcmVhdGVMb2dnZXIsIExvZ2dlciB9IGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IGNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZyc7XG5cbmludGVyZmFjZSBQcm9jZXNzT3B0aW9ucyB7XG4gICAgbGFuZ3VhZ2U/OiBzdHJpbmc7XG4gICAgcmF0ZT86IG51bWJlcjtcbiAgICBwaXRjaD86IG51bWJlcjtcbiAgICB2b2x1bWU/OiBudW1iZXI7XG4gICAgZW1vdGlvbmFsQ29udGV4dD86IFJlY29yZDxzdHJpbmcsIGFueT47XG4gICAgdGV4dFN0cnVjdHVyZT86IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbmludGVyZmFjZSBUYXNrUmVzcG9uc2Uge1xuICAgIHRhc2tfaWQ6IHN0cmluZztcbiAgICBzdGF0dXM/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUYXNrU3RhdHVzIHtcbiAgICB0YXNrSWQ6IHN0cmluZztcbiAgICBzdGF0dXM6IHN0cmluZztcbiAgICByZXN1bHQ/OiBhbnk7XG4gICAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBIZWFsdGhDaGVja1Jlc3BvbnNlIHtcbiAgICBzdGF0dXM6IHN0cmluZztcbiAgICBtZXNzYWdlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQ2VsZXJ5Q2xpZW50IHtcbiAgICBwcml2YXRlIGxvZ2dlcjogTG9nZ2VyO1xuICAgIHByaXZhdGUgYmFzZVVybDogc3RyaW5nO1xuICAgIHByaXZhdGUgdGFza0VuZHBvaW50OiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBzdGF0dXNFbmRwb2ludDogc3RyaW5nO1xuICAgIHByaXZhdGUgY29uZmlnOiB7XG4gICAgICAgIHRpbWVvdXQ6IG51bWJlcjtcbiAgICAgICAgW2tleTogc3RyaW5nXTogYW55O1xuICAgIH07XG4gICAgcHJpdmF0ZSBpc0luaXRpYWxpemVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcihiYXNlVXJsOiBzdHJpbmcgPSBjb25maWcuQVBJX0VORFBPSU5UKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyID0gY3JlYXRlTG9nZ2VyKCdDZWxlcnlDbGllbnQnKTtcbiAgICAgICAgdGhpcy5iYXNlVXJsID0gYmFzZVVybDtcbiAgICAgICAgdGhpcy50YXNrRW5kcG9pbnQgPSBgJHt0aGlzLmJhc2VVcmx9JHtjb25maWcuZW5kcG9pbnRzLnByb2Nlc3NUZXh0fWA7XG4gICAgICAgIHRoaXMuc3RhdHVzRW5kcG9pbnQgPSBgJHt0aGlzLmJhc2VVcmx9JHtjb25maWcuZW5kcG9pbnRzLnRhc2tTdGF0dXN9YDtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWcuY2VsZXJ5O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbygnQ2VsZXJ5Q2xpZW50IGluaXRpYWxpemVkJywge1xuICAgICAgICAgICAgYmFzZVVybDogdGhpcy5iYXNlVXJsLFxuICAgICAgICAgICAgdGFza0VuZHBvaW50OiB0aGlzLnRhc2tFbmRwb2ludCxcbiAgICAgICAgICAgIHN0YXR1c0VuZHBvaW50OiB0aGlzLnN0YXR1c0VuZHBvaW50LFxuICAgICAgICAgICAgdGltZW91dDogdGhpcy5jb25maWcudGltZW91dFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDaGVjayBzZXJ2ZXIgY29ubmVjdGlvblxuICAgICAgICB0aGlzLmNoZWNrQ29ubmVjdGlvbigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY2hlY2tDb25uZWN0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh0aGlzLmJhc2VVcmwsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdIRUFEJyxcbiAgICAgICAgICAgICAgICBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoNTAwMClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5pc0luaXRpYWxpemVkID0gcmVzcG9uc2Uub2s7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdTZXJ2ZXIgY29ubmVjdGlvbiBlc3RhYmxpc2hlZCcpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5pc0luaXRpYWxpemVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuKCdGYWlsZWQgdG8gY29ubmVjdCB0byBzZXJ2ZXI6JywgeyBcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgICAgICAgICAgYmFzZVVybDogdGhpcy5iYXNlVXJsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBwcm9jZXNzVGV4dCh0ZXh0OiBzdHJpbmcsIG9wdGlvbnM6IFByb2Nlc3NPcHRpb25zID0ge30pOiBQcm9taXNlPFRhc2tTdGF0dXM+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hlY2tDb25uZWN0aW9uKCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHByb2Nlc3MgdGV4dDogU2VydmVyIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdQcm9jZXNzaW5nIHRleHQgd2l0aCBDZWxlcnknLCB7IFxuICAgICAgICAgICAgdGV4dExlbmd0aDogdGV4dC5sZW5ndGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godGhpcy50YXNrRW5kcG9pbnQsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlOiBvcHRpb25zLmxhbmd1YWdlIHx8ICdlbicsXG4gICAgICAgICAgICAgICAgICAgIHJhdGU6IG9wdGlvbnMucmF0ZSB8fCAxLjAsXG4gICAgICAgICAgICAgICAgICAgIHBpdGNoOiBvcHRpb25zLnBpdGNoIHx8IDEuMCxcbiAgICAgICAgICAgICAgICAgICAgdm9sdW1lOiBvcHRpb25zLnZvbHVtZSB8fCAxLjAsXG4gICAgICAgICAgICAgICAgICAgIGVtb3Rpb25hbENvbnRleHQ6IG9wdGlvbnMuZW1vdGlvbmFsQ29udGV4dCB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgdGV4dFN0cnVjdHVyZTogb3B0aW9ucy50ZXh0U3RydWN0dXJlIHx8IHt9XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KHRoaXMuY29uZmlnLnRpbWVvdXQpXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yRGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKS5jYXRjaCgoKSA9PiAoe30pKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgZXJyb3IhIHN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9LCBtZXNzYWdlOiAke2Vycm9yRGF0YS5lcnJvciB8fCAnVW5rbm93biBlcnJvcid9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCkgYXMgVGFza1Jlc3BvbnNlO1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuc3VjY2VzcygnVGV4dCBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5JywgZGF0YSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRhc2tJZDogZGF0YS50YXNrX2lkLFxuICAgICAgICAgICAgICAgIHN0YXR1czogJ1BFTkRJTkcnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgdGV4dDonLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNoZWNrVGFza1N0YXR1cyh0YXNrSWQ6IHN0cmluZyk6IFByb21pc2U8VGFza1N0YXR1cz4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2hlY2sgdGFzayBzdGF0dXM6IFNlcnZlciBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHt0aGlzLnN0YXR1c0VuZHBvaW50fS8ke3Rhc2tJZH1gKTtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgZXJyb3IhIHN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRhc2tJZCxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IGRhdGEuc3RhdHVzLFxuICAgICAgICAgICAgICAgIHJlc3VsdDogZGF0YS5yZXN1bHQsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGRhdGEuZXJyb3JcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcignRXJyb3IgY2hlY2tpbmcgdGFzayBzdGF0dXM6JywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBwb2xsVGFza1N0YXR1cyh0YXNrSWQ6IHN0cmluZywgaW50ZXJ2YWw6IG51bWJlciA9IDEwMDApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcG9sbCB0YXNrIHN0YXR1czogU2VydmVyIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwb2xsID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHRoaXMuY2hlY2tUYXNrU3RhdHVzKHRhc2tJZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMuc3RhdHVzID09PSAnU1VDQ0VTUycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc3RhdHVzLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdHVzLnN0YXR1cyA9PT0gJ0ZBSUxVUkUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKHN0YXR1cy5lcnJvciB8fCAnVGFzayBmYWlsZWQnKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHBvbGwsIGludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHBvbGwoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGNoZWNrSGVhbHRoKCk6IFByb21pc2U8SGVhbHRoQ2hlY2tSZXNwb25zZT4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja0Nvbm5lY3Rpb24oKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2hlY2sgaGVhbHRoOiBTZXJ2ZXIgbm90IGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7dGhpcy5iYXNlVXJsfS9oZWFsdGhgLCB7XG4gICAgICAgICAgICAgICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDUwMDApIC8vIFNob3J0IHRpbWVvdXQgZm9yIGhlYWx0aCBjaGVja3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHJlc3BvbnNlLmpzb24oKSBhcyBIZWFsdGhDaGVja1Jlc3BvbnNlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0hlYWx0aCBjaGVjayBmYWlsZWQ6JywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBjYW5jZWxUYXNrKHRhc2tJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNoZWNrQ29ubmVjdGlvbigpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYW5jZWwgdGFzazogU2VydmVyIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke3RoaXMuc3RhdHVzRW5kcG9pbnR9LyR7dGFza0lkfS9jYW5jZWxgLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGNhbmNlbCB0YXNrOiAke3Rhc2tJZH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdFcnJvciBjYW5jZWxpbmcgdGFzazonLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBFeHBvcnQgc2luZ2xldG9uIGluc3RhbmNlXG5leHBvcnQgY29uc3QgY2VsZXJ5Q2xpZW50ID0gbmV3IENlbGVyeUNsaWVudCgpO1xuIiwiLy8gU2ltcGxlIGxvZ2dlciB1dGlsaXR5IGZvciBDaHJvbWUgZXh0ZW5zaW9uXG5cbnR5cGUgTG9nTGV2ZWwgPSAnREVCVUcnIHwgJ0lORk8nIHwgJ1dBUk4nIHwgJ0VSUk9SJyB8ICdTVUNDRVNTJztcblxuaW50ZXJmYWNlIExvZ01lc3NhZ2Uge1xuICAgIHRpbWVzdGFtcDogc3RyaW5nO1xuICAgIGxldmVsOiBMb2dMZXZlbDtcbiAgICBjb250ZXh0OiBzdHJpbmc7XG4gICAgbWVzc2FnZTogc3RyaW5nO1xuICAgIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ2dlciB7XG4gICAgZGVidWcobWVzc2FnZTogc3RyaW5nLCBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQ7XG4gICAgaW5mbyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZDtcbiAgICB3YXJuKG1lc3NhZ2U6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkO1xuICAgIGVycm9yKG1lc3NhZ2U6IHN0cmluZyB8IEVycm9yLCBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQ7XG4gICAgc3VjY2VzcyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZDtcbiAgICBjcmVhdGVTdWJMb2dnZXIoc3ViQ29udGV4dDogc3RyaW5nKTogTG9nZ2VyO1xufVxuXG5jbGFzcyBMb2dnZXJJbXBsIGltcGxlbWVudHMgTG9nZ2VyIHtcbiAgICBwcml2YXRlIGNvbnRleHQ6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2Zvcm1hdE1lc3NhZ2UobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcsIGRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fSk6IExvZ01lc3NhZ2Uge1xuICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgICAgICBsZXZlbCxcbiAgICAgICAgICAgIGNvbnRleHQ6IHRoaXMuY29udGV4dCxcbiAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICBkYXRhXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIGRlYnVnKG1lc3NhZ2U6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5kZWJ1Zyh0aGlzLl9mb3JtYXRNZXNzYWdlKCdERUJVRycsIG1lc3NhZ2UsIGRhdGEpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW5mbyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUuaW5mbyh0aGlzLl9mb3JtYXRNZXNzYWdlKCdJTkZPJywgbWVzc2FnZSwgZGF0YSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyB3YXJuKG1lc3NhZ2U6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS53YXJuKHRoaXMuX2Zvcm1hdE1lc3NhZ2UoJ1dBUk4nLCBtZXNzYWdlLCBkYXRhKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGVycm9yKG1lc3NhZ2U6IHN0cmluZyB8IEVycm9yLCBkYXRhPzogUmVjb3JkPHN0cmluZywgYW55Pik6IHZvaWQge1xuICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBtZXNzYWdlIGluc3RhbmNlb2YgRXJyb3IgPyBtZXNzYWdlLm1lc3NhZ2UgOiBtZXNzYWdlO1xuICAgICAgICBjb25zdCBlcnJvckRhdGEgPSBtZXNzYWdlIGluc3RhbmNlb2YgRXJyb3IgXG4gICAgICAgICAgICA/IHsgLi4uZGF0YSwgc3RhY2s6IG1lc3NhZ2Uuc3RhY2sgfVxuICAgICAgICAgICAgOiBkYXRhO1xuICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMuX2Zvcm1hdE1lc3NhZ2UoJ0VSUk9SJywgZXJyb3JNZXNzYWdlLCBlcnJvckRhdGEpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3VjY2VzcyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUuaW5mbyh0aGlzLl9mb3JtYXRNZXNzYWdlKCdTVUNDRVNTJywgbWVzc2FnZSwgZGF0YSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVTdWJMb2dnZXIoc3ViQ29udGV4dDogc3RyaW5nKTogTG9nZ2VyIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMb2dnZXJJbXBsKGAke3RoaXMuY29udGV4dH06JHtzdWJDb250ZXh0fWApO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvZ2dlcihjb250ZXh0OiBzdHJpbmcpOiBMb2dnZXIge1xuICAgIHJldHVybiBuZXcgTG9nZ2VySW1wbChjb250ZXh0KTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gQ29udGVudCBzY3JpcHQgZm9yIGhhbmRsaW5nIHRleHQgc2VsZWN0aW9uIGFuZCBzcGVlY2ggc3ludGhlc2lzXG5pbXBvcnQgeyBjcmVhdGVMb2dnZXIsIExvZ2dlciB9IGZyb20gJy4vdXRpbHMvbG9nZ2VyJztcbmltcG9ydCB7IGNlbGVyeUNsaWVudCB9IGZyb20gJy4vdXRpbHMvY2VsZXJ5Q2xpZW50JztcblxuaW50ZXJmYWNlIENvbnRlbnRTdGF0ZSB7XG4gICAgaXNQcm9jZXNzaW5nOiBib29sZWFuO1xuICAgIGlzUGF1c2VkOiBib29sZWFuO1xuICAgIHNlbGVjdGVkVGV4dDogc3RyaW5nO1xuICAgIGN1cnJlbnRVdHRlcmFuY2U6IFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSB8IG51bGw7XG4gICAgcHJlZmVycmVkVm9pY2U6IFNwZWVjaFN5bnRoZXNpc1ZvaWNlIHwgbnVsbDtcbiAgICBzZXR0aW5nczoge1xuICAgICAgICByYXRlOiBudW1iZXI7XG4gICAgICAgIHBpdGNoOiBudW1iZXI7XG4gICAgICAgIHZvbHVtZTogbnVtYmVyO1xuICAgICAgICBhdXRvUmVzdW1lOiBib29sZWFuO1xuICAgICAgICBsYW5ndWFnZTogc3RyaW5nO1xuICAgIH07XG59XG5cbmludGVyZmFjZSBUVFNTZXR0aW5ncyB7XG4gICAgdHRzU2V0dGluZ3M/OiB7XG4gICAgICAgIHJhdGU6IG51bWJlcjtcbiAgICAgICAgcGl0Y2g6IG51bWJlcjtcbiAgICAgICAgdm9sdW1lOiBudW1iZXI7XG4gICAgICAgIGF1dG9SZXN1bWU6IGJvb2xlYW47XG4gICAgICAgIGxhbmd1YWdlOiBzdHJpbmc7XG4gICAgfTtcbn1cblxuY2xhc3MgQ29udGVudENvbnRyb2xsZXIge1xuICAgIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBDb250ZW50Q29udHJvbGxlcjtcbiAgICBwcml2YXRlIGxvZ2dlcjogTG9nZ2VyO1xuICAgIHByaXZhdGUgc3RhdGU6IENvbnRlbnRTdGF0ZTtcbiAgICBwcml2YXRlIHNwZWVjaFN5bnRoZXNpczogU3BlZWNoU3ludGhlc2lzO1xuICAgIHByaXZhdGUgdm9pY2VzOiBTcGVlY2hTeW50aGVzaXNWb2ljZVtdO1xuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIgPSBjcmVhdGVMb2dnZXIoJ0NvbnRlbnQnKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGlzUHJvY2Vzc2luZzogZmFsc2UsXG4gICAgICAgICAgICBpc1BhdXNlZDogZmFsc2UsXG4gICAgICAgICAgICBzZWxlY3RlZFRleHQ6ICcnLFxuICAgICAgICAgICAgY3VycmVudFV0dGVyYW5jZTogbnVsbCxcbiAgICAgICAgICAgIHByZWZlcnJlZFZvaWNlOiBudWxsLFxuICAgICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICByYXRlOiAxLjAsXG4gICAgICAgICAgICAgICAgcGl0Y2g6IDEuMCxcbiAgICAgICAgICAgICAgICB2b2x1bWU6IDEuMCxcbiAgICAgICAgICAgICAgICBhdXRvUmVzdW1lOiB0cnVlLFxuICAgICAgICAgICAgICAgIGxhbmd1YWdlOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZyB8fCAnZW4nXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB3ZWIgc3BlZWNoIHN5bnRoZXNpc1xuICAgICAgICB0aGlzLnNwZWVjaFN5bnRoZXNpcyA9IHdpbmRvdy5zcGVlY2hTeW50aGVzaXM7XG4gICAgICAgIHRoaXMudm9pY2VzID0gW107XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBsaXN0ZW5lcnNcbiAgICAgICAgdGhpcy5pbml0aWFsaXplTGlzdGVuZXJzKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBTaWduYWwgdGhhdCBjb250ZW50IHNjcmlwdCBpcyByZWFkeSB3aXRoIHJldHJ5XG4gICAgICAgIHRoaXMuc2lnbmFsQ29udGVudFNjcmlwdFJlYWR5KCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBDb250ZW50Q29udHJvbGxlciB7XG4gICAgICAgIGlmICghQ29udGVudENvbnRyb2xsZXIuaW5zdGFuY2UpIHtcbiAgICAgICAgICAgIENvbnRlbnRDb250cm9sbGVyLmluc3RhbmNlID0gbmV3IENvbnRlbnRDb250cm9sbGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRlbnRDb250cm9sbGVyLmluc3RhbmNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ3R0c1NldHRpbmdzJykgYXMgVFRTU2V0dGluZ3M7XG4gICAgICAgICAgICBpZiAoc2V0dGluZ3MudHRzU2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlLnNldHRpbmdzID0geyAuLi50aGlzLnN0YXRlLnNldHRpbmdzLCAuLi5zZXR0aW5ncy50dHNTZXR0aW5ncyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgc2V0dGluZ3M6JywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IHR0c1NldHRpbmdzOiB0aGlzLnN0YXRlLnNldHRpbmdzIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoJ0Vycm9yIHNhdmluZyBzZXR0aW5nczonLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaW5pdGlhbGl6ZVZvaWNlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKCdvbnZvaWNlc2NoYW5nZWQnIGluIHRoaXMuc3BlZWNoU3ludGhlc2lzKSB7XG4gICAgICAgICAgICB0aGlzLnNwZWVjaFN5bnRoZXNpcy5vbnZvaWNlc2NoYW5nZWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy52b2ljZXMgPSB0aGlzLnNwZWVjaFN5bnRoZXNpcy5nZXRWb2ljZXMoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVmZXJyZWRWb2ljZSA9IHRoaXMudm9pY2VzLmZpbmQodm9pY2UgPT4gXG4gICAgICAgICAgICAgICAgICAgIHZvaWNlLmxhbmcuc3RhcnRzV2l0aCh0aGlzLnN0YXRlLnNldHRpbmdzLmxhbmd1YWdlKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKHByZWZlcnJlZFZvaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUucHJlZmVycmVkVm9pY2UgPSBwcmVmZXJyZWRWb2ljZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudm9pY2VzID0gdGhpcy5zcGVlY2hTeW50aGVzaXMuZ2V0Vm9pY2VzKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbml0aWFsaXplTGlzdGVuZXJzKCk6IHZvaWQge1xuICAgICAgICAvLyBMaXN0ZW4gZm9yIG1lc3NhZ2VzIGZyb20gdGhlIGJhY2tncm91bmQgc2NyaXB0XG4gICAgICAgIGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcih0aGlzLmhhbmRsZU1lc3NhZ2UuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gTGlzdGVuIGZvciB0ZXh0IHNlbGVjdGlvblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5oYW5kbGVUZXh0U2VsZWN0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuaGFuZGxlS2V5Ym9hcmRTaG9ydGN1dHMuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gSGFuZGxlIHZpc2liaWxpdHkgY2hhbmdlc1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgdGhpcy5oYW5kbGVWaXNpYmlsaXR5Q2hhbmdlLmJpbmQodGhpcykpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgdGhpcy5oYW5kbGVCZWZvcmVVbmxvYWQuYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYW5kbGVNZXNzYWdlKFxuICAgICAgICBtZXNzYWdlOiBhbnksXG4gICAgICAgIHNlbmRlcjogY2hyb21lLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcixcbiAgICAgICAgc2VuZFJlc3BvbnNlOiAocmVzcG9uc2U/OiBhbnkpID0+IHZvaWRcbiAgICApOiB2b2lkIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ3VwZGF0ZVNldHRpbmdzJykge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTZXR0aW5ncyhtZXNzYWdlLnNldHRpbmdzKTtcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZVRleHRTZWxlY3Rpb24oZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgICAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnNlbGVjdGVkVGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpLnRyaW0oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaGFuZGxlS2V5Ym9hcmRTaG9ydGN1dHMoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICAgICAgLy8gQWRkIGtleWJvYXJkIHNob3J0Y3V0IGhhbmRsaW5nIGxvZ2ljIGhlcmVcbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZVZpc2liaWxpdHlDaGFuZ2UoKTogdm9pZCB7XG4gICAgICAgIGlmIChkb2N1bWVudC5oaWRkZW4gJiYgdGhpcy5zdGF0ZS5zZXR0aW5ncy5hdXRvUmVzdW1lKSB7XG4gICAgICAgICAgICB0aGlzLnBhdXNlU3BlZWNoKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlc3VtZVNwZWVjaCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYW5kbGVCZWZvcmVVbmxvYWQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc3RvcFNwZWVjaCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgdXBkYXRlU2V0dGluZ3MobmV3U2V0dGluZ3M6IFBhcnRpYWw8Q29udGVudFN0YXRlWydzZXR0aW5ncyddPik6IHZvaWQge1xuICAgICAgICB0aGlzLnN0YXRlLnNldHRpbmdzID0geyAuLi50aGlzLnN0YXRlLnNldHRpbmdzLCAuLi5uZXdTZXR0aW5ncyB9O1xuICAgICAgICB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc3BlYWtUZXh0KHRleHQ6IHN0cmluZywgb3B0aW9uczogUGFydGlhbDxDb250ZW50U3RhdGVbJ3NldHRpbmdzJ10+ID0ge30pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuaXNQcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdXR0ZXJhbmNlID0gbmV3IFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSh0ZXh0KTtcbiAgICAgICAgICAgIHV0dGVyYW5jZS5yYXRlID0gb3B0aW9ucy5yYXRlIHx8IHRoaXMuc3RhdGUuc2V0dGluZ3MucmF0ZTtcbiAgICAgICAgICAgIHV0dGVyYW5jZS5waXRjaCA9IG9wdGlvbnMucGl0Y2ggfHwgdGhpcy5zdGF0ZS5zZXR0aW5ncy5waXRjaDtcbiAgICAgICAgICAgIHV0dGVyYW5jZS52b2x1bWUgPSBvcHRpb25zLnZvbHVtZSB8fCB0aGlzLnN0YXRlLnNldHRpbmdzLnZvbHVtZTtcbiAgICAgICAgICAgIHV0dGVyYW5jZS52b2ljZSA9IHRoaXMuc3RhdGUucHJlZmVycmVkVm9pY2U7XG5cbiAgICAgICAgICAgIC8vIEhhbmRsZSBzcGVlY2ggZXZlbnRzXG4gICAgICAgICAgICB1dHRlcmFuY2Uub25zdGFydCA9IHRoaXMub25zdGFydC5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgdXR0ZXJhbmNlLm9uZW5kID0gdGhpcy5vbmVuZC5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgdXR0ZXJhbmNlLm9uZXJyb3IgPSB0aGlzLm9uZXJyb3IuYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHV0dGVyYW5jZS5vbnBhdXNlID0gdGhpcy5vbnBhdXNlLmJpbmQodGhpcyk7XG4gICAgICAgICAgICB1dHRlcmFuY2Uub25yZXN1bWUgPSB0aGlzLm9ucmVzdW1lLmJpbmQodGhpcyk7XG4gICAgICAgICAgICB1dHRlcmFuY2Uub25ib3VuZGFyeSA9IHRoaXMub25ib3VuZGFyeS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRVdHRlcmFuY2UgPSB1dHRlcmFuY2U7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmlzUHJvY2Vzc2luZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNwZWVjaFN5bnRoZXNpcy5zcGVhayh1dHRlcmFuY2UpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVFcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uc3RhcnQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTcGVlY2ggc3RhcnRlZCcpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25lbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTcGVlY2ggZW5kZWQnKTtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25lcnJvcihldmVudDogU3BlZWNoU3ludGhlc2lzRXJyb3JFdmVudCk6IHZvaWQge1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcignU3BlZWNoIGVycm9yOicsIGV2ZW50KTtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25wYXVzZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ1NwZWVjaCBwYXVzZWQnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9ucmVzdW1lKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnU3BlZWNoIHJlc3VtZWQnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uYm91bmRhcnkoZXZlbnQ6IFNwZWVjaFN5bnRoZXNpc0V2ZW50KTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTcGVlY2ggYm91bmRhcnkgcmVhY2hlZDonLCBldmVudCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwYXVzZVNwZWVjaCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuc3BlZWNoU3ludGhlc2lzLnNwZWFraW5nICYmICF0aGlzLnN0YXRlLmlzUGF1c2VkKSB7XG4gICAgICAgICAgICB0aGlzLnNwZWVjaFN5bnRoZXNpcy5wYXVzZSgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5pc1BhdXNlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHJlc3VtZVNwZWVjaCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuaXNQYXVzZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc3BlZWNoU3ludGhlc2lzLnJlc3VtZSgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5pc1BhdXNlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdG9wU3BlZWNoKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5zcGVlY2hTeW50aGVzaXMuc3BlYWtpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuc3BlZWNoU3ludGhlc2lzLmNhbmNlbCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlc2V0KCk6IHZvaWQge1xuICAgICAgICB0aGlzLnN0YXRlLmlzUHJvY2Vzc2luZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnN0YXRlLmN1cnJlbnRVdHRlcmFuY2UgPSBudWxsO1xuICAgICAgICB0aGlzLnN0YXRlLmlzUGF1c2VkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYW5kbGVFcnJvcihlcnJvcjogdW5rbm93bik6IHZvaWQge1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcignRXJyb3I6JywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHByb2Nlc3NTZWxlY3RlZFRleHQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmlzUHJvY2Vzc2luZyB8fCAhdGhpcy5zdGF0ZS5zZWxlY3RlZFRleHQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBjZWxlcnlDbGllbnQucHJvY2Vzc1RleHQodGhpcy5zdGF0ZS5zZWxlY3RlZFRleHQsIHRoaXMuc3RhdGUuc2V0dGluZ3MpO1xuICAgICAgICAgICAgLy8gVGhlIGJhY2tncm91bmQgc2NyaXB0IHdpbGwgaGFuZGxlIHRoZSByZXN1bHQgYW5kIGNhbGwgYmFjayB3aXRoIHByb2Nlc3NSZXN1bHRcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzaWduYWxDb250ZW50U2NyaXB0UmVhZHkocmV0cmllcyA9IDMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgdHlwZTogJ2NvbnRlbnRTY3JpcHRSZWFkeScgfSk7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKCdDb250ZW50IHNjcmlwdCByZWFkeSBzaWduYWwgc2VudCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChyZXRyaWVzID4gMCAmJiBlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmIGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoJ1JlY2VpdmluZyBlbmQgZG9lcyBub3QgZXhpc3QnKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmluZm8oJ0JhY2tncm91bmQgc2NyaXB0IG5vdCByZWFkeSwgcmV0cnlpbmcgaW4gMSBzZWNvbmQuLi4nKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuc2lnbmFsQ29udGVudFNjcmlwdFJlYWR5KHJldHJpZXMgLSAxKSwgMTAwMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdGYWlsZWQgdG8gc2lnbmFsIGNvbnRlbnQgc2NyaXB0IHJlYWR5OicsIHsgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBFeHBvcnQgc2luZ2xldG9uIGluc3RhbmNlXG5leHBvcnQgY29uc3QgY29udGVudENvbnRyb2xsZXIgPSBDb250ZW50Q29udHJvbGxlci5nZXRJbnN0YW5jZSgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
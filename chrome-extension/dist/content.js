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
        // Signal that content script is ready
        chrome.runtime.sendMessage({ type: 'contentScriptReady' });
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
}
// Export singleton instance
const contentController = ContentController.getInstance();

})();

/******/ })()
;
//# sourceMappingURL=content.js.map
/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/content.js":
/*!************************!*\
  !*** ./src/content.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/logger */ \"./src/utils/logger.js\");\n// Content script for handling text selection and speech synthesis\n\nclass ContentController {\n  constructor() {\n    this.logger = (0,_utils_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('Content');\n    this.isProcessing = false;\n    this.selectedText = '';\n\n    // Initialize message listeners\n    this.initializeListeners();\n  }\n  initializeListeners() {\n    // Listen for messages from background script\n    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {\n      if (message.type === 'processingComplete') {\n        this.handleProcessingComplete(message);\n      }\n    });\n\n    // Add context menu event listener\n    document.addEventListener('mouseup', () => {\n      const selection = window.getSelection().toString().trim();\n      if (selection) {\n        this.selectedText = selection;\n      }\n    });\n\n    // Add keyboard shortcut listener\n    document.addEventListener('keydown', event => {\n      // Ctrl/Cmd + Shift + S to start/stop speech\n      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {\n        event.preventDefault();\n        if (this.isProcessing) {\n          this.stopSpeech();\n        } else if (this.selectedText) {\n          this.processSelectedText();\n        }\n      }\n    });\n  }\n  async processSelectedText() {\n    if (this.isProcessing) {\n      this.logger.warn('Already processing text');\n      return;\n    }\n    if (!this.selectedText) {\n      this.logger.warn('No text selected');\n      return;\n    }\n    this.isProcessing = true;\n    this.logger.info('Processing selected text', {\n      textLength: this.selectedText.length\n    });\n    try {\n      await chrome.runtime.sendMessage({\n        type: 'processText',\n        text: this.selectedText,\n        options: {\n          language: document.documentElement.lang || 'en'\n        }\n      });\n    } catch (error) {\n      this.logger.error('Failed to send text for processing', error);\n      this.isProcessing = false;\n    }\n  }\n  stopSpeech() {\n    this.logger.info('Stopping speech');\n    chrome.runtime.sendMessage({\n      type: 'stopSpeech'\n    });\n    this.isProcessing = false;\n  }\n  handleProcessingComplete(message) {\n    if (message.success) {\n      this.logger.success('Text processing completed');\n    } else {\n      this.logger.error('Text processing failed', message.error);\n    }\n    this.isProcessing = false;\n  }\n}\n\n// Initialize the content controller\nconst contentController = new ContentController();\n\n//# sourceURL=webpack://text-reader-extension/./src/content.js?");

/***/ }),

/***/ "./src/utils/logger.js":
/*!*****************************!*\
  !*** ./src/utils/logger.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createLogger: () => (/* binding */ createLogger)\n/* harmony export */ });\n// Simple logger utility for Chrome extension\nclass Logger {\n  constructor(context) {\n    this.context = context;\n  }\n  _formatMessage(level, message, data = {}) {\n    const timestamp = new Date().toISOString();\n    return {\n      timestamp,\n      level,\n      context: this.context,\n      message,\n      data\n    };\n  }\n  debug(message, data) {\n    console.debug(this._formatMessage('DEBUG', message, data));\n  }\n  info(message, data) {\n    console.info(this._formatMessage('INFO', message, data));\n  }\n  warn(message, data) {\n    console.warn(this._formatMessage('WARN', message, data));\n  }\n  error(message, data) {\n    console.error(this._formatMessage('ERROR', message, data));\n  }\n  success(message, data) {\n    console.info(this._formatMessage('SUCCESS', message, data));\n  }\n  createSubLogger(subContext) {\n    return new Logger(`${this.context}:${subContext}`);\n  }\n}\nfunction createLogger(context) {\n  return new Logger(context);\n}\n\n//# sourceURL=webpack://text-reader-extension/./src/utils/logger.js?");

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
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/content.js");
/******/ 	
/******/ })()
;
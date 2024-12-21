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

/***/ "./src/config.js":
/*!***********************!*\
  !*** ./src/config.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   config: () => (/* binding */ config)\n/* harmony export */ });\n// Configuration for the extension\nconst config = {\n  // API endpoint\n  API_ENDPOINT: 'http://localhost:5001',\n  // Celery settings\n  celery: {\n    timeout: 30000,\n    maxRetries: 3,\n    retryDelay: 2000,\n    taskTimeout: 300000,\n    // 5 minutes\n    healthCheckInterval: 60000 // 1 minute\n  },\n  // Default speech settings\n  speech: {\n    rate: 1.0,\n    pitch: 1.0,\n    volume: 1.0,\n    voice: null\n  }\n};\n\n//# sourceURL=webpack://text-reader-extension/./src/config.js?");

/***/ }),

/***/ "./src/textProcessorWorker.js":
/*!************************************!*\
  !*** ./src/textProcessorWorker.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _utils_celeryClient__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/celeryClient */ \"./src/utils/celeryClient.js\");\n// Text processor worker for handling speech synthesis\n\nclass TextProcessorWorker {\n  constructor() {\n    this.celeryClient = new _utils_celeryClient__WEBPACK_IMPORTED_MODULE_0__.CeleryClient();\n    this.speechSynthesis = window.speechSynthesis;\n    this.currentUtterance = null;\n    this.isProcessing = false;\n    this.queue = [];\n    this.currentOptions = {\n      rate: 1.0,\n      pitch: 1.0,\n      volume: 1.0,\n      language: 'en'\n    };\n  }\n  async processText(text, options = {}) {\n    try {\n      // Merge options with defaults\n      const processOptions = {\n        ...this.currentOptions,\n        ...options,\n        emotionalContext: this._analyzeEmotionalContext(text),\n        textStructure: this._analyzeTextStructure(text)\n      };\n\n      // Process text through backend\n      const {\n        taskId\n      } = await this.celeryClient.processText(text, processOptions);\n\n      // Wait for processing to complete\n      const processedText = await this.celeryClient.pollTaskStatus(taskId);\n\n      // Convert processed text into speech\n      return this._convertToSpeech(processedText);\n    } catch (error) {\n      console.error('Error processing text:', error);\n      throw error;\n    }\n  }\n  _analyzeEmotionalContext(text) {\n    // Simple emotion analysis based on keywords and punctuation\n    const emotions = {\n      excitement: 0,\n      urgency: 0,\n      happiness: 0,\n      sadness: 0,\n      anger: 0,\n      fear: 0,\n      surprise: 0,\n      uncertainty: 0\n    };\n\n    // Excitement and urgency\n    emotions.excitement += (text.match(/!/g) || []).length * 0.2;\n    emotions.urgency += (text.match(/!/g) || []).length * 0.15;\n\n    // Happiness\n    if (text.match(/\\b(happy|great|wonderful|excellent|amazing)\\b/gi)) {\n      emotions.happiness += 0.3;\n    }\n\n    // Sadness\n    if (text.match(/\\b(sad|sorry|unfortunate|regret|disappointed)\\b/gi)) {\n      emotions.sadness += 0.3;\n    }\n\n    // Anger\n    if (text.match(/\\b(angry|furious|mad|outraged)\\b/gi)) {\n      emotions.anger += 0.3;\n    }\n\n    // Fear\n    if (text.match(/\\b(afraid|scared|terrified|worried)\\b/gi)) {\n      emotions.fear += 0.3;\n    }\n\n    // Surprise\n    if (text.match(/\\b(wow|oh|whoa|amazing|incredible)\\b/gi)) {\n      emotions.surprise += 0.3;\n    }\n\n    // Uncertainty\n    emotions.uncertainty += (text.match(/\\?/g) || []).length * 0.2;\n    if (text.match(/\\b(maybe|perhaps|possibly|might|could)\\b/gi)) {\n      emotions.uncertainty += 0.2;\n    }\n\n    // Normalize values\n    Object.keys(emotions).forEach(emotion => {\n      emotions[emotion] = Math.min(emotions[emotion], 1.0);\n    });\n    return emotions;\n  }\n  _analyzeTextStructure(text) {\n    return {\n      totalLength: text.length,\n      sentences: (text.match(/[.!?]+/g) || []).length,\n      paragraphs: (text.match(/\\n\\n+/g) || []).length + 1,\n      hasDialog: Boolean(text.match(/[\"\"].*?[\"\"]|[''].*?['']|[\"'].*?[\"']/g)),\n      hasLists: Boolean(text.match(/(?:^|\\n)\\s*[-*•]|\\d+\\.|[a-z]\\)/gm)),\n      hasCode: Boolean(text.match(/(?:^|\\n)\\s*[{[(]|^\\s*\\w+\\s*=/gm)),\n      formalityLevel: this._assessFormality(text)\n    };\n  }\n  _assessFormality(text) {\n    const formalWords = text.match(/\\b(therefore|however|moreover|furthermore|nevertheless|accordingly)\\b/gi) || [];\n    const informalWords = text.match(/\\b(like|you know|kind of|sort of|basically|pretty much)\\b/gi) || [];\n    if (formalWords.length + informalWords.length === 0) {\n      return 0.5;\n    }\n    return formalWords.length / (formalWords.length + informalWords.length);\n  }\n  async _convertToSpeech(processedText) {\n    return new Promise((resolve, reject) => {\n      const utterance = new SpeechSynthesisUtterance(processedText);\n\n      // Apply current options\n      utterance.rate = this.currentOptions.rate;\n      utterance.pitch = this.currentOptions.pitch;\n      utterance.volume = this.currentOptions.volume;\n      utterance.lang = this.currentOptions.language;\n\n      // Handle SSML-like markers\n      this._applySSMLMarkers(utterance, processedText);\n\n      // Set up event handlers\n      utterance.onend = () => {\n        this.currentUtterance = null;\n        resolve();\n      };\n      utterance.onerror = event => {\n        this.currentUtterance = null;\n        reject(new Error(`Speech synthesis error: ${event.error}`));\n      };\n\n      // Store current utterance and speak\n      this.currentUtterance = utterance;\n      this.speechSynthesis.speak(utterance);\n    });\n  }\n  _applySSMLMarkers(utterance, text) {\n    // Handle breathing markers\n    text = text.replace(/<break time=\"(\\d+\\.?\\d*)s\"\\/>/g, (_, duration) => {\n      return ' '.repeat(Math.ceil(parseFloat(duration) * 5));\n    });\n\n    // Handle prosody markers\n    const rateMatch = text.match(/<prosody rate=\"(\\d+)%\">/);\n    if (rateMatch) {\n      utterance.rate *= parseInt(rateMatch[1]) / 100;\n    }\n    const pitchMatch = text.match(/<prosody pitch=\"([+-]\\d+)%\">/);\n    if (pitchMatch) {\n      const pitchChange = parseInt(pitchMatch[1]);\n      utterance.pitch *= 1 + pitchChange / 100;\n    }\n    const volumeMatch = text.match(/<prosody volume=\"([+-]\\d+)db\">/);\n    if (volumeMatch) {\n      const volumeChange = parseInt(volumeMatch[1]);\n      utterance.volume *= Math.pow(10, volumeChange / 20);\n    }\n\n    // Remove all SSML-like tags\n    return text.replace(/<\\/?[^>]+(>|$)/g, '');\n  }\n  stop() {\n    if (this.currentUtterance) {\n      this.speechSynthesis.cancel();\n      this.currentUtterance = null;\n    }\n  }\n  pause() {\n    if (this.currentUtterance) {\n      this.speechSynthesis.pause();\n    }\n  }\n  resume() {\n    if (this.currentUtterance) {\n      this.speechSynthesis.resume();\n    }\n  }\n  setOptions(options) {\n    this.currentOptions = {\n      ...this.currentOptions,\n      ...options\n    };\n  }\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (TextProcessorWorker);\n\n//# sourceURL=webpack://text-reader-extension/./src/textProcessorWorker.js?");

/***/ }),

/***/ "./src/utils/celeryClient.js":
/*!***********************************!*\
  !*** ./src/utils/celeryClient.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   CeleryClient: () => (/* binding */ CeleryClient),\n/* harmony export */   celeryClient: () => (/* binding */ celeryClient)\n/* harmony export */ });\n/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./logger */ \"./src/utils/logger.js\");\n/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ \"./src/config.js\");\n// Celery client for handling text processing tasks\n\n\nclass CeleryClient {\n  constructor(baseUrl = _config__WEBPACK_IMPORTED_MODULE_1__.config.API_ENDPOINT) {\n    this.logger = (0,_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('CeleryClient');\n    this.baseUrl = baseUrl;\n    this.taskEndpoint = `${this.baseUrl}/process_text`;\n    this.statusEndpoint = `${this.baseUrl}/task_status`;\n    this.config = _config__WEBPACK_IMPORTED_MODULE_1__.config.celery;\n    this.logger.info('CeleryClient initialized', {\n      baseUrl: this.baseUrl,\n      timeout: this.config.timeout\n    });\n  }\n  async processText(text, options = {}) {\n    this.logger.debug('Processing text with Celery', {\n      textLength: text.length\n    });\n    try {\n      const response = await fetch(this.taskEndpoint, {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify({\n          text,\n          language: options.language || 'en',\n          rate: options.rate || 1.0,\n          pitch: options.pitch || 1.0,\n          volume: options.volume || 1.0,\n          emotionalContext: options.emotionalContext || {},\n          textStructure: options.textStructure || {}\n        }),\n        signal: AbortSignal.timeout(this.config.timeout)\n      });\n      if (!response.ok) {\n        const errorData = await response.json().catch(() => ({}));\n        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);\n      }\n      const data = await response.json();\n      this.logger.success('Text processed successfully', data);\n      return {\n        taskId: data.task_id,\n        status: 'PENDING'\n      };\n    } catch (error) {\n      this.logger.error('Error processing text:', error);\n      throw error;\n    }\n  }\n  async checkTaskStatus(taskId) {\n    try {\n      const response = await fetch(`${this.statusEndpoint}/${taskId}`);\n      if (!response.ok) {\n        throw new Error(`HTTP error! status: ${response.status}`);\n      }\n      const data = await response.json();\n      return {\n        taskId,\n        status: data.status,\n        result: data.result,\n        error: data.error\n      };\n    } catch (error) {\n      this.logger.error('Error checking task status:', error);\n      throw error;\n    }\n  }\n  async pollTaskStatus(taskId, interval = 1000) {\n    return new Promise((resolve, reject) => {\n      const poll = async () => {\n        try {\n          const status = await this.checkTaskStatus(taskId);\n          if (status.status === 'SUCCESS') {\n            resolve(status.result);\n          } else if (status.status === 'FAILURE') {\n            reject(new Error(status.error || 'Task failed'));\n          } else {\n            setTimeout(poll, interval);\n          }\n        } catch (error) {\n          reject(error);\n        }\n      };\n      poll();\n    });\n  }\n  async checkHealth() {\n    try {\n      const response = await fetch(`${this.baseUrl}/health`, {\n        signal: AbortSignal.timeout(5000) // Short timeout for health checks\n      });\n      return await response.json();\n    } catch (error) {\n      this.logger.error('Health check failed:', error);\n      throw error;\n    }\n  }\n}\nconst celeryClient = new CeleryClient();\n\n//# sourceURL=webpack://text-reader-extension/./src/utils/celeryClient.js?");

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
/******/ 	var __webpack_exports__ = __webpack_require__("./src/textProcessorWorker.js");
/******/ 	
/******/ })()
;
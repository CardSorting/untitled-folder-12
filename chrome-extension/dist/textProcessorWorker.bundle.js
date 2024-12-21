/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/utils/chunkManager.js":
/*!***********************************!*\
  !*** ./src/utils/chunkManager.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ChunkManager: () => (/* binding */ ChunkManager)
/* harmony export */ });
/* harmony import */ var _textProcessorConfig_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./textProcessorConfig.js */ "./src/utils/textProcessorConfig.js");
/* harmony import */ var _languagePatterns__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./languagePatterns */ "./src/utils/languagePatterns.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Chunk Management Utilities



// Helper function to get language-specific patterns
function getPatterns(text) {
  var lang = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.detectLanguage)(text);
  var langPatterns = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.getLanguagePatterns)(lang);
  return _objectSpread(_objectSpread({}, _languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns), langPatterns.patterns);
}

// Helper function to get pause points
function getPausePoints(text) {
  var lang = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.detectLanguage)(text);
  var langPatterns = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.getLanguagePatterns)(lang);
  return langPatterns.pausePoints;
}
var ChunkManager = /*#__PURE__*/function () {
  function ChunkManager() {
    _classCallCheck(this, ChunkManager);
  }
  return _createClass(ChunkManager, null, [{
    key: "createOptimalChunks",
    value: function createOptimalChunks(sentence, blockType, context) {
      var config = _textProcessorConfig_js__WEBPACK_IMPORTED_MODULE_0__.TextProcessorConfig.chunk;
      var patterns = getPatterns(sentence);
      var pausePoints = getPausePoints(sentence);

      // Initialize chunking parameters
      var chunks = [];
      var currentChunk = this.initializeChunk(blockType);
      var words = this.splitIntoWords(sentence, patterns);

      // Process words with advanced chunking strategy
      for (var i = 0; i < words.length; i++) {
        var word = words[i];
        var nextWord = words[i + 1] || '';
        var potentialText = currentChunk.text ? "".concat(currentChunk.text, " ").concat(word) : word;
        if (this.shouldSplitChunk(potentialText, word, nextWord, blockType, config, patterns, pausePoints)) {
          chunks.push(this.finalizeChunk(currentChunk, context));
          currentChunk = this.initializeChunk(blockType, word);
        } else {
          currentChunk.text = potentialText;
          this.updateChunkMetadata(currentChunk, word, context, (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.detectLanguage)(sentence));
        }
      }

      // Handle remaining text
      if (currentChunk.text) {
        chunks.push(this.finalizeChunk(currentChunk, context));
      }

      // Post-process chunks for optimal delivery
      return this.postProcessChunks(chunks, context);
    }
  }, {
    key: "initializeChunk",
    value: function initializeChunk(blockType) {
      var initialText = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      return {
        text: initialText,
        pause: 0,
        emphasis: false,
        type: blockType,
        metadata: {
          language: null,
          complexity: 0,
          emotion: null,
          formality: 0
        }
      };
    }
  }, {
    key: "splitIntoWords",
    value: function splitIntoWords(text, patterns) {
      return text.split(patterns.whitespace);
    }
  }, {
    key: "shouldSplitChunk",
    value: function shouldSplitChunk(potentialText, currentWord, nextWord, blockType, config, patterns, pausePoints) {
      var length = potentialText.length;
      var wordCount = potentialText.split(patterns.whitespace).length;

      // Check basic length constraints
      if (length >= config.max) return true;
      if (length < config.min) return false;

      // Check language-specific constraints
      if (wordCount > config.maxWords) return true;
      if (wordCount < config.minWords) return false;

      // Check for natural break points
      if (length >= config.optimal) {
        // Check preferred break points
        var lastChar = potentialText[potentialText.length - 1];
        if (config.breakpoints.preferred.includes(lastChar)) return true;

        // Check acceptable break points if approaching max length
        if (length >= config.optimal * 1.2) {
          if (config.breakpoints.acceptable.includes(lastChar)) return true;
        }

        // Prevent overflow with next word
        if (length + nextWord.length + 1 > config.max) return true;
      }

      // Check semantic boundaries
      if (this.isSemanticBoundary(currentWord, nextWord, patterns, pausePoints)) return true;
      return false;
    }
  }, {
    key: "isSemanticBoundary",
    value: function isSemanticBoundary(currentWord, nextWord, patterns, pausePoints) {
      // Check for transition words that indicate logical breaks
      var transitionWords = new Set(['however', 'therefore', 'furthermore', 'moreover', 'meanwhile', 'consequently', 'nevertheless', 'otherwise']);
      return transitionWords.has(nextWord.toLowerCase()) || this.isPunctuationBoundary(currentWord, pausePoints) || this.isStructuralBoundary(currentWord, nextWord, patterns);
    }
  }, {
    key: "isPunctuationBoundary",
    value: function isPunctuationBoundary(word, pausePoints) {
      var lastChar = word[word.length - 1];
      return pausePoints.has(lastChar) && pausePoints.get(lastChar).weight >= 0.6;
    }
  }, {
    key: "isStructuralBoundary",
    value: function isStructuralBoundary(currentWord, nextWord, patterns) {
      return /[:;]$/.test(currentWord) || /^[A-Z][a-z]/.test(nextWord) || /["""]/.test(currentWord) || /^[•\-*]/.test(nextWord);
    }
  }, {
    key: "updateChunkMetadata",
    value: function updateChunkMetadata(chunk, word, context, language) {
      // Update language-specific metadata
      chunk.metadata.language = language;

      // Update pause based on punctuation
      var lastChar = word[word.length - 1];
      if (pausePoints.has(lastChar)) {
        var pauseInfo = pausePoints.get(lastChar);
        chunk.pause = Math.max(chunk.pause, pauseInfo.pause);

        // Adjust pause based on context
        if (context.emphasisLevel > 0) {
          chunk.pause *= 1.2;
        }
      }

      // Update emphasis and emotion
      var emphasis = TextAnalyzer.analyzeEmphasis(word);
      if (emphasis.hasEmphasis) {
        chunk.emphasis = true;
        chunk.metadata.complexity += 0.1;
      }

      // Update complexity based on word characteristics
      if (/^[A-Z][a-z]{12,}/.test(word)) {
        chunk.metadata.complexity += 0.05; // Long capitalized words
      }
      if (/[-–—]/.test(word)) {
        chunk.metadata.complexity += 0.03; // Hyphenated words
      }

      // Adjust formality based on word characteristics
      if (/^[A-Z]{2,}$/.test(word)) {
        chunk.metadata.formality += 0.1; // Acronyms
      }
    }
  }, {
    key: "finalizeChunk",
    value: function finalizeChunk(chunk, context) {
      var config = _textProcessorConfig_js__WEBPACK_IMPORTED_MODULE_0__.TextProcessorConfig;

      // Ensure minimum pause
      if (!chunk.pause) {
        chunk.pause = config.pause.breathing;
      }

      // Apply context-based adjustments
      if (context.contentType) {
        var contentSettings = config.voice.contentTypes[context.contentType];
        if (contentSettings) {
          chunk.pause = Math.min(chunk.pause * contentSettings.rate, config.pause.emphasis);
        }
      }

      // Apply emotional adjustments
      if (context.emotion) {
        var emotionPause = config.pause.emotion[context.emotion] || config.pause.emotion.neutral;
        chunk.pause = Math.min(chunk.pause * 1.2, emotionPause);
      }

      // Format text based on metadata
      chunk.text = this.formatChunkText(chunk);
      return {
        text: chunk.text.trim(),
        pause: Math.round(chunk.pause),
        type: chunk.type,
        emphasis: chunk.emphasis,
        metadata: chunk.metadata
      };
    }
  }, {
    key: "formatChunkText",
    value: function formatChunkText(chunk) {
      var text = chunk.text;

      // Add emphasis markers if needed
      if (chunk.emphasis) {
        text = "[EMPHASIS] ".concat(text);
      }

      // Add emotional markers if present
      if (chunk.metadata.emotion) {
        text = "[".concat(chunk.metadata.emotion.toUpperCase(), "] ").concat(text);
      }

      // Add complexity markers for very complex text
      if (chunk.metadata.complexity > 0.8) {
        text = "[COMPLEX] ".concat(text);
      }
      return text;
    }
  }, {
    key: "postProcessChunks",
    value: function postProcessChunks(chunks, context) {
      // Balance chunk sizes
      chunks = this.balanceChunks(chunks);

      // Optimize pauses between chunks
      chunks = this.optimizePauses(chunks, context);

      // Generate metadata for the chunk set
      var metadata = this.generateMetadata(chunks);
      return {
        chunks: chunks,
        metadata: metadata
      };
    }
  }, {
    key: "balanceChunks",
    value: function balanceChunks(chunks) {
      var config = _textProcessorConfig_js__WEBPACK_IMPORTED_MODULE_0__.TextProcessorConfig.chunk;
      var balanced = [];
      for (var i = 0; i < chunks.length; i++) {
        var chunk = chunks[i];

        // Check if chunk is too short and can be merged
        if (i < chunks.length - 1 && chunk.text.length < config.min && chunk.text.length + chunks[i + 1].text.length <= config.optimal) {
          // Merge with next chunk
          chunks[i + 1].text = "".concat(chunk.text, " ").concat(chunks[i + 1].text);
          chunks[i + 1].pause = Math.max(chunk.pause, chunks[i + 1].pause);
          chunks[i + 1].emphasis = chunk.emphasis || chunks[i + 1].emphasis;
        } else {
          balanced.push(chunk);
        }
      }
      return balanced;
    }
  }, {
    key: "optimizePauses",
    value: function optimizePauses(chunks, context) {
      var config = _textProcessorConfig_js__WEBPACK_IMPORTED_MODULE_0__.TextProcessorConfig.pause;
      var prevPause = 0;
      return chunks.map(function (chunk, index) {
        // Avoid too long pauses between chunks
        if (prevPause > 0 && chunk.pause > prevPause * 1.5) {
          chunk.pause = Math.round(prevPause * 1.2);
        }

        // Add longer pauses before emphasis or new sections
        if (chunk.emphasis || index > 0 && chunk.type !== chunks[index - 1].type) {
          chunk.pause = Math.max(chunk.pause, config.emphasis);
        }
        prevPause = chunk.pause;
        return chunk;
      });
    }
  }, {
    key: "generateMetadata",
    value: function generateMetadata(chunks) {
      var metadata = {
        totalChunks: chunks.length,
        averageChunkLength: 0,
        emphasisCount: 0,
        pauseDistribution: {
          "short": 0,
          // < 300ms
          medium: 0,
          // 300-600ms
          "long": 0 // > 600ms
        },
        blockTypes: {},
        complexity: {
          average: 0,
          max: 0
        },
        languages: new Set()
      };
      var totalLength = 0;
      var totalComplexity = 0;
      var _iterator = _createForOfIteratorHelper(chunks),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var chunk = _step.value;
          // Basic metrics
          totalLength += chunk.text.length;
          if (chunk.emphasis) metadata.emphasisCount++;

          // Pause distribution
          if (chunk.pause < 300) metadata.pauseDistribution["short"]++;else if (chunk.pause < 600) metadata.pauseDistribution.medium++;else metadata.pauseDistribution["long"]++;

          // Block types
          metadata.blockTypes[chunk.type] = (metadata.blockTypes[chunk.type] || 0) + 1;

          // Complexity
          if (chunk.metadata.complexity) {
            totalComplexity += chunk.metadata.complexity;
            metadata.complexity.max = Math.max(metadata.complexity.max, chunk.metadata.complexity);
          }

          // Languages
          if (chunk.metadata.language) {
            metadata.languages.add(chunk.metadata.language);
          }
        }

        // Calculate averages
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      metadata.averageChunkLength = Math.round(totalLength / chunks.length);
      metadata.complexity.average = totalComplexity / chunks.length;

      // Convert languages Set to Array for JSON serialization
      metadata.languages = Array.from(metadata.languages);
      metadata.processingComplete = true;
      return metadata;
    }
  }]);
}();

/***/ }),

/***/ "./src/utils/languagePatterns.js":
/*!***************************************!*\
  !*** ./src/utils/languagePatterns.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ChinesePatterns: () => (/* reexport safe */ _languages_chinese__WEBPACK_IMPORTED_MODULE_2__.ChinesePatterns),
/* harmony export */   CommonPatterns: () => (/* binding */ CommonPatterns),
/* harmony export */   EnglishPatterns: () => (/* reexport safe */ _languages_english__WEBPACK_IMPORTED_MODULE_0__.EnglishPatterns),
/* harmony export */   JapanesePatterns: () => (/* reexport safe */ _languages_japanese__WEBPACK_IMPORTED_MODULE_1__.JapanesePatterns),
/* harmony export */   LanguageDetection: () => (/* binding */ LanguageDetection),
/* harmony export */   detectLanguage: () => (/* binding */ detectLanguage),
/* harmony export */   getLanguagePatterns: () => (/* binding */ getLanguagePatterns)
/* harmony export */ });
/* harmony import */ var _languages_english__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./languages/english */ "./src/utils/languages/english.js");
/* harmony import */ var _languages_japanese__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./languages/japanese */ "./src/utils/languages/japanese.js");
/* harmony import */ var _languages_chinese__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./languages/chinese */ "./src/utils/languages/chinese.js");
// Language Patterns Module




// Common patterns across all languages
var CommonPatterns = {
  whitespace: /\s+/,
  linebreak: /\r?\n/,
  indent: /^(?:    |\t)/,
  // Common structural elements
  structure: {
    heading: new Set(['#', '##', '###', '====', '----']),
    section: new Set(['§', '¶', '†', '‡']),
    formatting: new Set(['*', '_', '**', '__', '~~', '`'])
  },
  // Common quote markers
  quotes: new Set(['"', '"', '"', "'", "'", "'", '「', '」', '『', '』']),
  // Common list markers
  lists: new Set(['•', '-', '*', '1.', '2.', '3.', '①', '②', '③', 'a.', 'b.', 'c.', 'A.', 'B.', 'C.', '(a)', '(b)', '(c)', '一', '二', '三', 'Ⅰ', 'Ⅱ', 'Ⅲ'])
};

// Export language-specific patterns


// Language detection patterns
var LanguageDetection = {
  english: /^[\x00-\x7F\s]+$/,
  // ASCII characters only
  japanese: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
  // Hiragana, Katakana, and Kanji
  chinese: /[\u4E00-\u9FFF\u3400-\u4DBF]/ // CJK Unified Ideographs
};

// Helper function to detect language
function detectLanguage(text) {
  if (LanguageDetection.japanese.test(text)) {
    return 'japanese';
  } else if (LanguageDetection.chinese.test(text)) {
    return 'chinese';
  } else if (LanguageDetection.english.test(text)) {
    return 'english';
  }
  return 'unknown';
}

// Helper function to get language-specific patterns
function getLanguagePatterns(language) {
  switch (language) {
    case 'english':
      return _languages_english__WEBPACK_IMPORTED_MODULE_0__.EnglishPatterns;
    case 'japanese':
      return _languages_japanese__WEBPACK_IMPORTED_MODULE_1__.JapanesePatterns;
    case 'chinese':
      return _languages_chinese__WEBPACK_IMPORTED_MODULE_2__.ChinesePatterns;
    default:
      return _languages_english__WEBPACK_IMPORTED_MODULE_0__.EnglishPatterns;
    // Default to English
  }
}

/***/ }),

/***/ "./src/utils/languages/chinese.js":
/*!****************************************!*\
  !*** ./src/utils/languages/chinese.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ChinesePatterns: () => (/* binding */ ChinesePatterns)
/* harmony export */ });
// Chinese Language Patterns

var ChinesePatterns = {
  abbreviations: {
    titles: new Set(['先生', '女士', '小姐', '教授', '博士', '主任', '经理', '总裁', '董事长', '主席']),
    honorifics: new Set(['老', '小', '大', '师', '总', '长']),
    organizations: new Set(['有限公司', '股份公司', '集团', '企业', '研究所', '学院', '大学', '机构'])
  },
  pausePoints: new Map([['。', {
    weight: 1.0,
    pause: 800,
    context: 'end'
  }], ['！', {
    weight: 1.0,
    pause: 800,
    context: 'exclamation'
  }], ['？', {
    weight: 1.0,
    pause: 800,
    context: 'question'
  }], ['，', {
    weight: 0.4,
    pause: 400,
    context: 'minor_break'
  }], ['、', {
    weight: 0.4,
    pause: 400,
    context: 'minor_break'
  }], ['：', {
    weight: 0.6,
    pause: 500,
    context: 'introduction'
  }], ['；', {
    weight: 0.7,
    pause: 600,
    context: 'major_break'
  }], ['……', {
    weight: 0.5,
    pause: 450,
    context: 'ellipsis'
  }], ['—', {
    weight: 0.5,
    pause: 450,
    context: 'dash'
  }]]),
  semanticMarkers: {
    emphasis: new Set(['重要', '警告', '注意', '提醒', '记住', '必须', '危险', '紧急', '要点', '关键']),
    emotion: {
      positive: new Set(['优秀', '出色', '完美', '精彩', '卓越', '优异', '杰出', '出众', '优良', '完善']),
      negative: new Set(['遗憾', '可惜', '抱歉', '糟糕', '不幸', '悲伤', '难过', '失望', '痛心', '惋惜']),
      emphasis: new Set(['绝对', '一定', '确实', '必然', '肯定', '无疑', '当然', '显然', '明显', '毫无疑问']),
      uncertainty: new Set(['可能', '或许', '大概', '也许', '估计', '兴许', '没准', '不一定', '不确定'])
    },
    transition: new Set(['但是', '然而', '不过', '因此', '所以', '而且', '并且', '此外', '另外', '况且', '反之', '相反', '尽管', '虽然', '即使'])
  },
  patterns: {
    sentence: /[。！？]+/g,
    measure: /[个個條条份]/g,
    delimiter: /[的得地]/g,
    quotation: /"([^"]*)"|\s'([^']*)'/g,
    parenthetical: /（([^）]*)）|\(([^)]*)\)/g,
    emphasis: /[【】《》〈〉「」『』]/g,
    list: /^[\s]*(?:•|[\d１-９]+、|\([\d１-９]+\))/,
    heading: /^(?:［[^］]*］|【[^】]*】|■|□|◆|◇|▲|△|▼|▽)/,
    date: /(?:\d{4}年\d{1,2}月\d{1,2}日)|(?:\d{4}\/\d{1,2}\/\d{1,2})/,
    time: /\d{1,2}[时點]\d{1,2}[分](?:\d{1,2}[秒])?/,
    phone: /(?:\+\d{1,3}[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/,
    money: /￥\d+(?:,\d{3})*(?:\.\d{2})?|¥\d+(?:,\d{3})*(?:\.\d{2})?|[\d.]+元/,
    whitespace: /[\s　]+/
  },
  structure: {
    paragraph: /\n\s*\n/,
    indentation: /^[\s　]+/,
    listItem: /^[\s]*(?:•|\d+、|[①-⑳]|[㋐-㋾])\s*/,
    blockquote: /^[＞>]+\s*/,
    codeBlock: /^(?:    |\t)/,
    horizontalRule: /^(?:―{3,}|＊{3,}|＿{3,})\s*$/
  },
  // Chinese-specific patterns
  simplified: /[\u4E00-\u9FFF]/,
  traditional: /[\u4E00-\u9FFF]/,
  pinyin: /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/,
  numbers: {
    simplified: /[〇一二三四五六七八九十百千万亿]/,
    traditional: /[零壹贰叁肆伍陆柒捌玖拾佰仟萬億]/
  },
  punctuation: {
    fullWidth: /[，。！？；：""''（）【】《》〈〉「」『』]/,
    halfWidth: /[,.!?;:"'()\[\]<>]/
  }
};

/***/ }),

/***/ "./src/utils/languages/english.js":
/*!****************************************!*\
  !*** ./src/utils/languages/english.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EnglishPatterns: () => (/* binding */ EnglishPatterns)
/* harmony export */ });
// English Language Patterns

var EnglishPatterns = {
  abbreviations: {
    titles: new Set(['mr', 'mrs', 'ms', 'dr', 'prof', 'rev', 'sr', 'jr', 'esq', 'hon', 'gov', 'pres', 'supt', 'rep', 'sen', 'amb']),
    academic: new Set(['ph.d', 'm.d', 'b.a', 'm.a', 'm.sc', 'b.sc', 'd.phil', 'b.tech', 'm.tech', 'm.phil', 'b.ed', 'm.ed', 'j.d']),
    business: new Set(['inc', 'ltd', 'corp', 'co', 'llc', 'llp', 'gmbh', 'sa', 'ag', 'plc', 'intl', 'assn', 'bros', 'mfg', 'dept']),
    temporal: new Set(['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'a.m', 'p.m', 'b.c', 'a.d', 'cent']),
    geographic: new Set(['st', 'ave', 'blvd', 'rd', 'hwy', 'apt', 'ste', 'ft', 'mt', 'pt', 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']),
    units: new Set(['kg', 'km', 'cm', 'mm', 'mg', 'hz', 'kb', 'mb', 'gb', 'tb', 'hr', 'min', 'sec', 'ft', 'in', 'yd', 'ml', 'oz'])
  },
  pausePoints: new Map([['.', {
    weight: 1.0,
    pause: 800,
    context: 'end'
  }], ['!', {
    weight: 1.0,
    pause: 800,
    context: 'exclamation'
  }], ['?', {
    weight: 1.0,
    pause: 800,
    context: 'question'
  }], [';', {
    weight: 0.7,
    pause: 600,
    context: 'major_break'
  }], [':', {
    weight: 0.6,
    pause: 500,
    context: 'introduction'
  }], [',', {
    weight: 0.4,
    pause: 400,
    context: 'minor_break'
  }], ['—', {
    weight: 0.5,
    pause: 450,
    context: 'em_dash'
  }], ['–', {
    weight: 0.4,
    pause: 400,
    context: 'en_dash'
  }], ['-', {
    weight: 0.3,
    pause: 300,
    context: 'hyphen'
  }]]),
  semanticMarkers: {
    emphasis: new Set(['important', 'warning', 'note', 'caution', 'remember', 'key', 'critical', 'essential', 'crucial', 'vital', 'notice', 'attention', 'alert', 'danger', 'tip']),
    emotion: {
      positive: new Set(['hooray', 'great', 'excellent', 'wonderful', 'fantastic', 'amazing', 'brilliant', 'outstanding', 'superb', 'perfect']),
      negative: new Set(['unfortunately', 'sadly', 'regrettably', 'alas', 'disappointingly', 'tragically', 'woefully']),
      emphasis: new Set(['absolutely', 'definitely', 'certainly', 'surely', 'undoubtedly', 'unquestionably', 'indisputably']),
      uncertainty: new Set(['perhaps', 'maybe', 'possibly', 'presumably', 'apparently', 'seemingly', 'probably', 'likely'])
    },
    transition: new Set(['however', 'therefore', 'furthermore', 'moreover', 'meanwhile', 'consequently', 'nevertheless', 'otherwise', 'additionally', 'similarly', 'conversely', 'specifically'])
  },
  patterns: {
    sentence: /[.!?]+[\s\n]+(?=[A-Z])/g,
    clause: /,\s*(?:and|or|but|because|while|although|though|unless|if|when|where|which|who|that|despite|whereas)/gi,
    quotation: /"([^"]*)"|\s'([^']*)'/g,
    parenthetical: /\(([^)]+)\)|\[([^\]]+)\]|{([^}]+)}/g,
    emphasis: /\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*(.+?)\*/g,
    list: /^[\s]*(?:[•\-*]|\d+\.|[a-zA-Z]\.)(?:\s+)/,
    heading: /^(?:#{1,6}|\=+|\-+)\s+.*$|^[A-Z][A-Z\s]+[A-Z]$/,
    url: /https?:\/\/\S+|www\.\S+/,
    email: /[\w.-]+@[\w.-]+\.\w+/,
    number: /\d+(?:st|nd|rd|th)?(?:,\d{3})*(?:\.\d+)?/,
    time: /\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?/,
    date: /(?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i,
    phone: /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    money: /\$\d+(?:,\d{3})*(?:\.\d{2})?/,
    whitespace: /\s+/
  },
  structure: {
    paragraph: /\n\s*\n/,
    indentation: /^[ \t]+/,
    listItem: /^[\s]*(?:[•\-*]|\d+\.|[a-zA-Z]\.)\s+/,
    blockquote: /^>+\s/,
    codeBlock: /^(?:    |\t)/,
    horizontalRule: /^(?:-{3,}|\*{3,}|_{3,})\s*$/
  }
};

/***/ }),

/***/ "./src/utils/languages/japanese.js":
/*!*****************************************!*\
  !*** ./src/utils/languages/japanese.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   JapanesePatterns: () => (/* binding */ JapanesePatterns)
/* harmony export */ });
// Japanese Language Patterns

var JapanesePatterns = {
  abbreviations: {
    titles: new Set(['さん', '様', '氏', '君', '先生', '教授', '博士', '社長', '部長', '課長', '係長', '主任']),
    honorifics: new Set(['お', 'ご', '殿', '様', '先生', '閣下']),
    organizations: new Set(['株式会社', '有限会社', '合同会社', '財団法人', '社団法人', '学校法人', '独立行政法人'])
  },
  pausePoints: new Map([['。', {
    weight: 1.0,
    pause: 800,
    context: 'end'
  }], ['．', {
    weight: 1.0,
    pause: 800,
    context: 'end'
  }], ['！', {
    weight: 1.0,
    pause: 800,
    context: 'exclamation'
  }], ['？', {
    weight: 1.0,
    pause: 800,
    context: 'question'
  }], ['、', {
    weight: 0.4,
    pause: 400,
    context: 'minor_break'
  }], ['，', {
    weight: 0.4,
    pause: 400,
    context: 'minor_break'
  }], ['：', {
    weight: 0.6,
    pause: 500,
    context: 'introduction'
  }], ['；', {
    weight: 0.7,
    pause: 600,
    context: 'major_break'
  }], ['…', {
    weight: 0.5,
    pause: 450,
    context: 'ellipsis'
  }], ['―', {
    weight: 0.5,
    pause: 450,
    context: 'dash'
  }]]),
  semanticMarkers: {
    emphasis: new Set(['重要', '警告', '注意', '注目', '確認', '必須', '危険', '緊急', 'ポイント', '要点']),
    emotion: {
      positive: new Set(['素晴らしい', '最高', '優れた', '良い', '嬉しい', '楽しい', '幸せ', '面白い', '快適', '満足']),
      negative: new Set(['残念', '悲しい', '申し訳ない', '困った', '悪い', '不快', '不満', '心配', '怖い', '嫌']),
      emphasis: new Set(['絶対に', '必ず', '確かに', '間違いなく', '当然', '明らかに', '確実に', '本当に']),
      uncertainty: new Set(['たぶん', 'おそらく', 'かもしれない', '多分', '説かもしれません', '可能性があります'])
    },
    transition: new Set(['しかし', 'ところが', 'それでも', 'そのため', 'したがって', 'また', 'さらに', 'なお', 'ただし', 'むしろ', 'あるいは', 'すなわち'])
  },
  patterns: {
    sentence: /[。．！？]+/g,
    particle: /[はがのにへとでもや]/g,
    honorific: /(?:さん|君|様|先生|氏)$/,
    quotation: /「([^」]*)」|『([^』]*)』/g,
    parenthetical: /（([^）]*)）|\(([^)]*)\)/g,
    emphasis: /[【】《》〈〉「」『』]/g,
    list: /^[\s]*(?:・|[\d１-９]+、|\([\d１-９]+\))/,
    heading: /^(?:［[^］]*］|【[^】]*】|■|□|◆|◇|▲|△|▼|▽)/,
    date: /(?:\d{4}年\d{1,2}月\d{1,2}日)|(?:令和\d{1,2}年)|(?:平成\d{1,2}年)/,
    time: /\d{1,2}時\d{1,2}分(?:\d{1,2}秒)?/,
    phone: /(?:\+\d{1,3}[-.\\s]?)?\d{2,4}[-.\\s]?\d{2,4}[-.\\s]?\d{4}/,
    money: /¥\d+(?:,\d{3})*(?:\.\d{2})?/,
    whitespace: /[\s　]+/
  },
  structure: {
    paragraph: /\n\s*\n/,
    indentation: /^[\s　]+/,
    listItem: /^[\s]*(?:・|\d+、|[①-⑳]|[㋐-㋾])\s*/,
    blockquote: /^[＞>]+\s*/,
    codeBlock: /^(?:    |\t)/,
    horizontalRule: /^(?:―{3,}|＊{3,}|＿{3,})\s*$/
  },
  // Japanese-specific patterns
  kanji: /[\u4E00-\u9FFF]/,
  hiragana: /[\u3040-\u309F]/,
  katakana: /[\u30A0-\u30FF]/,
  furigana: /[\u3040-\u309F]|\[\u4E00-\u9FFF\][\u3040-\u309F]+/g,
  ruby: /<ruby>[\u4E00-\u9FFF]+<rt>[\u3040-\u309F]+<\/rt><\/ruby>/g
};

/***/ }),

/***/ "./src/utils/logger.js":
/*!*****************************!*\
  !*** ./src/utils/logger.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createLogger: () => (/* binding */ createLogger)
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Logger = /*#__PURE__*/function () {
  function Logger(context) {
    _classCallCheck(this, Logger);
    this.context = context;
    this.debugMode = true; // Can be toggled via storage
  }
  return _createClass(Logger, [{
    key: "formatMessage",
    value: function formatMessage(level, message, data) {
      var timestamp = new Date().toISOString();
      var dataString = data ? "\n".concat(JSON.stringify(data, null, 2)) : '';
      return "[".concat(timestamp, "] [").concat(this.context, "] [").concat(level, "] ").concat(message).concat(dataString);
    }
  }, {
    key: "formatError",
    value: function formatError(error) {
      if (error instanceof Error) {
        return _objectSpread({
          message: error.message,
          stack: error.stack,
          name: error.name
        }, error.cause && {
          cause: error.cause
        });
      }
      return error;
    }
  }, {
    key: "style",
    value: function style(level) {
      switch (level) {
        case 'ERROR':
          return 'color: #ff0000; font-weight: bold';
        case 'WARN':
          return 'color: #ff9900; font-weight: bold';
        case 'INFO':
          return 'color: #0066ff';
        case 'DEBUG':
          return 'color: #666666';
        case 'SUCCESS':
          return 'color: #00cc00; font-weight: bold';
        default:
          return '';
      }
    }
  }, {
    key: "log",
    value: function log(level, message) {
      var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      if (!this.debugMode && level === 'DEBUG') return;
      var formattedMessage = this.formatMessage(level, message, data);
      var style = this.style(level);
      if (data instanceof Error) {
        data = this.formatError(data);
      }
      console.log("%c".concat(formattedMessage), style);

      // Store in extension's log history (optional)
      this.storeLog({
        level: level,
        message: message,
        data: data,
        timestamp: new Date().toISOString()
      });
    }
  }, {
    key: "storeLog",
    value: function () {
      var _storeLog = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(logEntry) {
        var _yield$chrome$storage, _yield$chrome$storage2, logs;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return chrome.storage.local.get('logs');
            case 3:
              _yield$chrome$storage = _context.sent;
              _yield$chrome$storage2 = _yield$chrome$storage.logs;
              logs = _yield$chrome$storage2 === void 0 ? [] : _yield$chrome$storage2;
              logs.push(logEntry);

              // Keep only last 1000 logs
              if (logs.length > 1000) {
                logs.shift();
              }
              _context.next = 10;
              return chrome.storage.local.set({
                logs: logs
              });
            case 10:
              _context.next = 15;
              break;
            case 12:
              _context.prev = 12;
              _context.t0 = _context["catch"](0);
              console.error('Failed to store log:', _context.t0);
            case 15:
            case "end":
              return _context.stop();
          }
        }, _callee, null, [[0, 12]]);
      }));
      function storeLog(_x) {
        return _storeLog.apply(this, arguments);
      }
      return storeLog;
    }()
  }, {
    key: "error",
    value: function error(message) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      this.log('ERROR', message, data);
    }
  }, {
    key: "warn",
    value: function warn(message) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      this.log('WARN', message, data);
    }
  }, {
    key: "info",
    value: function info(message) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      this.log('INFO', message, data);
    }
  }, {
    key: "debug",
    value: function debug(message) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      this.log('DEBUG', message, data);
    }
  }, {
    key: "success",
    value: function success(message) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      this.log('SUCCESS', message, data);
    }
  }, {
    key: "group",
    value: function group(label) {
      console.group("[".concat(this.context, "] ").concat(label));
    }
  }, {
    key: "groupEnd",
    value: function groupEnd() {
      console.groupEnd();
    }

    // Create a sub-logger with a new context
  }, {
    key: "createSubLogger",
    value: function createSubLogger(subContext) {
      return new Logger("".concat(this.context, ":").concat(subContext));
    }
  }]);
}(); // Create logger instances for different parts of the extension
var createLogger = function createLogger(context) {
  return new Logger(context);
};

/***/ }),

/***/ "./src/utils/textAnalyzer.js":
/*!***********************************!*\
  !*** ./src/utils/textAnalyzer.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TextAnalyzer: () => (/* binding */ TextAnalyzer)
/* harmony export */ });
/* harmony import */ var _textProcessorConfig_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./textProcessorConfig.js */ "./src/utils/textProcessorConfig.js");
/* harmony import */ var _languagePatterns__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./languagePatterns */ "./src/utils/languagePatterns.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Text Analysis Utilities


var TextAnalyzer = /*#__PURE__*/function () {
  function TextAnalyzer() {
    _classCallCheck(this, TextAnalyzer);
  }
  return _createClass(TextAnalyzer, null, [{
    key: "analyzeBlockType",
    value: function analyzeBlockType(text) {
      var blockInfo = {
        type: 'paragraph',
        context: {},
        semanticLevel: 0,
        metadata: {
          complexity: 0,
          formality: 0,
          emotion: null,
          language: (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.detectLanguage)(text)
        }
      };
      var patterns = getPatterns(text);
      var semanticMarkers = getSemanticMarkers(text);

      // Check for list items with enhanced pattern matching
      if (patterns.list.test(text)) {
        blockInfo.type = 'list-item';
        blockInfo.semanticLevel = 1;
        blockInfo.metadata.formality = 0.5;
      }

      // Enhanced heading detection
      if (this.isHeading(text)) {
        blockInfo.type = 'heading';
        blockInfo.semanticLevel = this.getHeadingLevel(text);
        blockInfo.metadata.formality = 0.8;
      }

      // Detect block quotes
      if (patterns.blockquote.test(text)) {
        blockInfo.type = 'quote';
        blockInfo.context.quoted = true;
        blockInfo.metadata.formality = 0.7;
      }

      // Analyze text complexity
      blockInfo.metadata.complexity = this.analyzeComplexity(text);

      // Detect content type and adjust metadata
      var contentType = this.detectContentType(text);
      if (contentType) {
        blockInfo.context.contentType = contentType;
        blockInfo.metadata.formality = this.getFormalityLevel(contentType);
      }

      // Analyze emotional content
      var emotionAnalysis = this.analyzeEmotion(text);
      if (emotionAnalysis.emotion) {
        blockInfo.metadata.emotion = emotionAnalysis.emotion;
        blockInfo.context.emotionalIntensity = emotionAnalysis.intensity;
      }
      return blockInfo;
    }
  }, {
    key: "isHeading",
    value: function isHeading(text) {
      return _languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.heading.test(text) || text.length < _textProcessorConfig_js__WEBPACK_IMPORTED_MODULE_0__.TextProcessorConfig.analysis.complexity.maxLength / 2 && /^[A-Z][^.!?]+$/.test(text);
    }
  }, {
    key: "getHeadingLevel",
    value: function getHeadingLevel(text) {
      var match = text.match(/^#{1,6}/);
      if (match) {
        return match[0].length;
      }
      return text.length < 50 ? 2 : 1;
    }
  }, {
    key: "analyzeComplexity",
    value: function analyzeComplexity(text) {
      var config = _textProcessorConfig_js__WEBPACK_IMPORTED_MODULE_0__.TextProcessorConfig.analysis.complexity;
      var complexity = 0;

      // Analyze sentence length
      var wordCount = text.split(_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.whitespace).length;
      complexity += Math.min(wordCount / config.maxLength, 1) * 0.4;

      // Analyze clause count
      var clauseCount = (text.match(/,|;|and|or|but|because|if|when|while/g) || []).length + 1;
      complexity += Math.min(clauseCount / config.maxClauses, 1) * 0.3;

      // Analyze nesting level
      var nestingLevel = (text.match(/[\(\[\{]/g) || []).length;
      complexity += Math.min(nestingLevel / config.maxNesting, 1) * 0.3;
      return Math.min(complexity, 1);
    }
  }, {
    key: "detectContentType",
    value: function detectContentType(text) {
      var patterns = {
        technical: /\b(?:function|class|method|algorithm|data|system|process)\b/i,
        narrative: /\b(?:then|after|before|when|while|during)\b/i,
        dialogue: /["'](?:[^"']|\\.)*["']|[A-Z][a-z]+:/,
        description: /\b(?:appears?|looks?|seems?|feels?|smells?|sounds?|tastes?)\b/i
      };
      for (var _i = 0, _Object$entries = Object.entries(patterns); _i < _Object$entries.length; _i++) {
        var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
          type = _Object$entries$_i[0],
          pattern = _Object$entries$_i[1];
        if (pattern.test(text)) {
          return type;
        }
      }
      return null;
    }
  }, {
    key: "getFormalityLevel",
    value: function getFormalityLevel(contentType) {
      var formalityLevels = {
        technical: 0.9,
        narrative: 0.6,
        dialogue: 0.4,
        description: 0.7
      };
      return formalityLevels[contentType] || 0.5;
    }
  }, {
    key: "analyzeEmotion",
    value: function analyzeEmotion(text) {
      var result = {
        emotion: null,
        intensity: 0
      };

      // Check for emotional markers
      var _loop = function _loop() {
        var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2),
          emotion = _Object$entries2$_i[0],
          words = _Object$entries2$_i[1];
        var matches = text.toLowerCase().split(_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.whitespace).filter(function (word) {
          return words.has(word);
        });
        if (matches.length > 0) {
          result.emotion = emotion;
          result.intensity = Math.min(matches.length / 5, 1);
          return 1; // break
        }
      };
      for (var _i2 = 0, _Object$entries2 = Object.entries(semanticMarkers.emotion); _i2 < _Object$entries2.length; _i2++) {
        if (_loop()) break;
      }

      // Analyze punctuation for emotional intensity
      var exclamations = (text.match(/!/g) || []).length;
      var questions = (text.match(/\?/g) || []).length;
      result.intensity = Math.max(result.intensity, Math.min((exclamations + questions) / 3, 1));
      return result;
    }
  }, {
    key: "isActualSentenceEnd",
    value: function isActualSentenceEnd(text, position, _ref) {
      var inQuote = _ref.inQuote,
        inParentheses = _ref.inParentheses;
      if (inQuote || inParentheses > 0) return false;

      // Look back for potential abbreviation
      var prevWord = text.slice(Math.max(0, position - 20), position).split(_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.whitespace).pop().toLowerCase();

      // Check all abbreviation categories
      for (var _i3 = 0, _Object$values = Object.values(getAbbreviations(text)); _i3 < _Object$values.length; _i3++) {
        var category = _Object$values[_i3];
        if (category.has(prevWord)) return false;
      }

      // Look ahead for sentence continuation
      var nextChar = text[position + 1] || '';
      var followingChar = text[position + 2] || '';

      // Handle closing punctuation
      if ('"\')]}'.includes(nextChar)) {
        return this.isActualSentenceEnd(text, position + 1, {
          inQuote: inQuote,
          inParentheses: inParentheses
        });
      }

      // Check for proper sentence boundary
      return nextChar === ' ' && (!followingChar || followingChar === followingChar.toUpperCase()) && !this.isSpecialCase(text, position);
    }
  }, {
    key: "isSpecialCase",
    value: function isSpecialCase(text, position) {
      var nextWord = text.slice(position + 1, position + 20).split(_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.whitespace)[1] || '';

      // Check for special cases like "e.g. ", "i.e. ", etc.
      return getAbbreviations(text).misc.has(nextWord.toLowerCase()) || this.isNumberContinuation(text, position);
    }
  }, {
    key: "isNumberContinuation",
    value: function isNumberContinuation(text, position) {
      var nextPart = text.slice(position + 1, position + 10);
      return /^\s*\d+/.test(nextPart);
    }
  }, {
    key: "getPauseForPunctuation",
    value: function getPauseForPunctuation(_char) {
      return getPausePoints(text).get(_char) || {
        weight: 0,
        pause: 0,
        context: null
      };
    }
  }, {
    key: "analyzeEmphasis",
    value: function analyzeEmphasis(text) {
      var words = text.toLowerCase().split(_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.whitespace);
      var emphasisWords = words.filter(function (word) {
        return semanticMarkers.emphasis.has(word);
      });
      var analysis = {
        hasEmphasis: emphasisWords.length > 0,
        emphasisCount: emphasisWords.length,
        emphasisWords: emphasisWords,
        emphasisLevel: Math.min(emphasisWords.length / words.length, 1),
        patterns: this.detectEmphasisPatterns(text)
      };

      // Adjust emphasis level based on formatting
      if (analysis.patterns.some(function (pattern) {
        return pattern.type === 'strong';
      })) {
        analysis.emphasisLevel = Math.min(analysis.emphasisLevel + 0.3, 1);
      }
      return analysis;
    }
  }, {
    key: "detectEmphasisPatterns",
    value: function detectEmphasisPatterns(text) {
      var patterns = [];
      var match;

      // Check for markdown-style emphasis
      var emphasisRegex = _languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.emphasis;
      while ((match = emphasisRegex.exec(text)) !== null) {
        patterns.push({
          type: match[1] || match[2] ? 'strong' : 'emphasis',
          text: match[0],
          position: match.index
        });
      }
      return patterns;
    }
  }, {
    key: "detectSpecialContent",
    value: function detectSpecialContent(text) {
      return {
        hasUrls: _languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.url.test(text),
        hasEmails: _languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.email.test(text),
        hasNumbers: _languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.number.test(text),
        hasEmphasisMarkers: _languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.emphasis.test(text),
        hasMath: _languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.math.test(text),
        hasCode: _languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.code.test(text),
        hasCitations: _languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns.citation.test(text),
        specialCharacters: this.extractSpecialCharacters(text)
      };
    }
  }, {
    key: "extractSpecialCharacters",
    value: function extractSpecialCharacters(text) {
      var specialChars = text.match(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g) || [];
      return _toConsumableArray(new Set(specialChars));
    }
  }]);
}();

// Helper function to get language-specific patterns
function getPatterns(text) {
  var lang = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.detectLanguage)(text);
  var langPatterns = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.getLanguagePatterns)(lang);
  return _objectSpread(_objectSpread({}, _languagePatterns__WEBPACK_IMPORTED_MODULE_1__.CommonPatterns), langPatterns.patterns);
}

// Helper function to get semantic markers
function getSemanticMarkers(text) {
  var lang = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.detectLanguage)(text);
  var langPatterns = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.getLanguagePatterns)(lang);
  return langPatterns.semanticMarkers;
}

// Helper function to get pause points
function getPausePoints(text) {
  var lang = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.detectLanguage)(text);
  var langPatterns = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.getLanguagePatterns)(lang);
  return langPatterns.pausePoints;
}

// Helper function to get abbreviations
function getAbbreviations(text) {
  var lang = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.detectLanguage)(text);
  var langPatterns = (0,_languagePatterns__WEBPACK_IMPORTED_MODULE_1__.getLanguagePatterns)(lang);
  return langPatterns.abbreviations;
}

/***/ }),

/***/ "./src/utils/textProcessorConfig.js":
/*!******************************************!*\
  !*** ./src/utils/textProcessorConfig.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TextProcessorConfig: () => (/* binding */ TextProcessorConfig)
/* harmony export */ });
// Text Processor Configuration
var TextProcessorConfig = {
  // Chunk size configuration
  chunk: {
    optimal: 150,
    max: 200,
    min: 50,
    tolerance: 20,
    // Advanced chunking options
    breakpoints: {
      preferred: ['。', '．', '！', '？', '.', '!', '?'],
      // Primary break points
      acceptable: [',', '、', '，', ';', '；'],
      // Secondary break points
      fallback: [' ', '\n', '\t'] // Last resort break points
    },
    // Language-specific settings
    languages: {
      english: {
        maxWords: 25,
        minWords: 3
      },
      japanese: {
        maxChars: 50,
        minChars: 10
      },
      chinese: {
        maxChars: 50,
        minChars: 10
      }
    }
  },
  // Pause duration configuration
  pause: {
    breathing: 250,
    emphasis: 500,
    paragraph: 1000,
    list: 400,
    // Detailed pause settings
    punctuation: {
      period: 800,
      comma: 400,
      semicolon: 600,
      colon: 500,
      dash: 300,
      parenthesis: 300,
      quote: 200,
      ellipsis: 450
    },
    // Context-based pauses
    context: {
      dialogue: 600,
      description: 400,
      action: 300,
      transition: 500
    },
    // Emotional pauses
    emotion: {
      excited: 200,
      sad: 600,
      thoughtful: 800,
      neutral: 400
    }
  },
  // Processing settings
  processing: {
    maxIterations: 1000,
    bufferSize: 5000,
    maxBlockSize: 10000,
    // Performance settings
    throttle: {
      chunkDelay: 50,
      // ms between chunk processing
      batchSize: 10,
      // chunks per batch
      maxQueueSize: 100 // maximum queued chunks
    },
    // Memory management
    memory: {
      maxCacheSize: 1000,
      // maximum cached items
      cleanupThreshold: 0.8,
      // cleanup when 80% full
      ttl: 300000 // cache TTL in ms (5 minutes)
    }
  },
  // Voice and speech settings
  voice: {
    "default": {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0
    },
    // Content-type specific settings
    contentTypes: {
      heading: {
        rate: 0.9,
        pitch: 1.1,
        volume: 1.0
      },
      emphasis: {
        rate: 0.95,
        pitch: 1.05,
        volume: 1.0
      },
      quote: {
        rate: 1.0,
        pitch: 0.95,
        volume: 0.9
      },
      parenthetical: {
        rate: 1.1,
        pitch: 0.9,
        volume: 0.8
      }
    },
    // Language-specific adjustments
    languages: {
      english: {
        rate: 1.0,
        pitch: 1.0
      },
      japanese: {
        rate: 0.9,
        pitch: 1.0
      },
      chinese: {
        rate: 0.9,
        pitch: 1.0
      }
    }
  },
  // Text analysis settings
  analysis: {
    // Sentence complexity metrics
    complexity: {
      maxLength: 100,
      // maximum sentence length
      maxClauses: 5,
      // maximum clauses per sentence
      maxNesting: 3 // maximum nested structures
    },
    // Content classification
    classification: {
      minConfidence: 0.7,
      // minimum confidence for classification
      categories: ['narrative', 'dialogue', 'description', 'technical']
    },
    // Semantic analysis
    semantic: {
      emphasisThreshold: 0.6,
      // threshold for emphasis detection
      emotionThreshold: 0.5,
      // threshold for emotion detection
      contextWindow: 3 // sentences for context analysis
    }
  },
  // Error handling and recovery
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackOptions: {
      useSimpleChunking: true,
      skipComplexAnalysis: true,
      forceSynchronousProcessing: true
    },
    logging: {
      level: 'warning',
      // log level: debug, info, warning, error
      maxEntries: 1000,
      // maximum log entries
      persistLogs: false // whether to persist logs
    }
  },
  // Accessibility settings
  accessibility: {
    screenReader: {
      announceStructure: true,
      // announce structural elements
      describeFormatting: true,
      // describe text formatting
      indicatePunctuation: true // indicate punctuation marks
    },
    alternatives: {
      provideTextAlternatives: true,
      // provide text alternatives
      describeMathContent: true,
      // describe mathematical content
      handleSpecialCharacters: true // handle special characters
    }
  }
};

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
  !*** ./src/textProcessorWorker.js ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_textAnalyzer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/textAnalyzer */ "./src/utils/textAnalyzer.js");
/* harmony import */ var _utils_chunkManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/chunkManager */ "./src/utils/chunkManager.js");
/* harmony import */ var _utils_languagePatterns__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/languagePatterns */ "./src/utils/languagePatterns.js");
/* harmony import */ var _utils_textProcessorConfig__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/textProcessorConfig */ "./src/utils/textProcessorConfig.js");
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils/logger */ "./src/utils/logger.js");
// Import required utilities





var logger = (0,_utils_logger__WEBPACK_IMPORTED_MODULE_4__.createLogger)('TextProcessor');
logger.info('Text processor worker initialized');

// Initialize text processing utilities
var textAnalyzer = new _utils_textAnalyzer__WEBPACK_IMPORTED_MODULE_0__.TextAnalyzer();
var chunkManager = new _utils_chunkManager__WEBPACK_IMPORTED_MODULE_1__.ChunkManager();
var textProcessorConfig = new _utils_textProcessorConfig__WEBPACK_IMPORTED_MODULE_3__.TextProcessorConfig();

// Listen for messages from the content script
self.onmessage = function (e) {
  var msgLogger = logger.createSubLogger('MessageHandler');
  msgLogger.debug('Received message', e.data);
  if (e.data.action === 'processText') {
    try {
      var processedText = processText(e.data.text);
      msgLogger.success('Text processed successfully', {
        inputLength: e.data.text.length,
        outputLength: processedText.length
      });
      self.postMessage({
        action: 'processedText',
        text: processedText
      });
    } catch (error) {
      msgLogger.error('Error processing text', error);
      self.postMessage({
        action: 'error',
        error: error.message
      });
    }
  } else {
    msgLogger.warn('Unknown action received', e.data);
  }
};

// Process the text using our utility functions
function processText(text) {
  var procLogger = logger.createSubLogger('Processor');
  procLogger.debug('Processing text', {
    length: text.length
  });
  try {
    // Analyze the text
    var analysis = textAnalyzer.analyzeText(text);

    // Get language patterns based on analysis
    var patterns = (0,_utils_languagePatterns__WEBPACK_IMPORTED_MODULE_2__.getLanguagePatterns)(analysis.detectedLanguage);

    // Break text into manageable chunks
    var chunks = chunkManager.splitIntoChunks(text, textProcessorConfig.chunkSize);

    // Process each chunk according to detected patterns
    var processedChunks = chunks.map(function (chunk) {
      return textAnalyzer.processChunk(chunk, patterns);
    });

    // Combine processed chunks
    return processedChunks.join(' ');
  } catch (error) {
    procLogger.error('Error processing text', error);
    return text; // Return original text if processing fails
  }
}
logger.success('Text processor worker ready with utilities loaded');
})();

/******/ })()
;
//# sourceMappingURL=textProcessorWorker.bundle.js.map
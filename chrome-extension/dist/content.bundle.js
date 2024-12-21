/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/config.js":
/*!***********************!*\
  !*** ./src/config.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   config: () => (/* binding */ config)
/* harmony export */ });
// Configuration for the extension
var config = {
  // API endpoint
  API_ENDPOINT: 'http://localhost:5001',
  // Celery settings
  celery: {
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 2000,
    taskTimeout: 300000,
    // 5 minutes
    healthCheckInterval: 60000 // 1 minute
  },
  // Default speech settings
  speech: {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voice: null
  }
};

/***/ }),

/***/ "./src/utils/celeryClient.js":
/*!***********************************!*\
  !*** ./src/utils/celeryClient.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CeleryClient: () => (/* binding */ CeleryClient),
/* harmony export */   celeryClient: () => (/* binding */ celeryClient)
/* harmony export */ });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./logger */ "./src/utils/logger.js");
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config.js */ "./src/config.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


var CeleryClient = /*#__PURE__*/function () {
  function CeleryClient() {
    _classCallCheck(this, CeleryClient);
    this.logger = (0,_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('CeleryClient');
    this.baseUrl = _config_js__WEBPACK_IMPORTED_MODULE_1__.config.API_ENDPOINT;
    this.taskRetryDelay = _config_js__WEBPACK_IMPORTED_MODULE_1__.config.celery.retryDelay;
    this.maxRetries = _config_js__WEBPACK_IMPORTED_MODULE_1__.config.celery.maxRetries;
    this.pendingTasks = new Map(); // Track pending tasks
    this.logger.info('CeleryClient initialized', {
      baseUrl: this.baseUrl,
      taskRetryDelay: this.taskRetryDelay,
      maxRetries: this.maxRetries
    });
  }
  return _createClass(CeleryClient, [{
    key: "getEndpoint",
    value: function getEndpoint(path) {
      return "".concat(this.baseUrl).concat(_config_js__WEBPACK_IMPORTED_MODULE_1__.config.celery.paths[path]);
    }
  }, {
    key: "processText",
    value: function () {
      var _processText = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(text) {
        var _this = this;
        var attempts, _loop, _ret;
        return _regeneratorRuntime().wrap(function _callee$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              this.logger.debug('Processing text with Celery', {
                textLength: text.length,
                endpoint: this.getEndpoint('processText')
              });
              attempts = 0;
              _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop() {
                var response, result, delay;
                return _regeneratorRuntime().wrap(function _loop$(_context) {
                  while (1) switch (_context.prev = _context.next) {
                    case 0:
                      _context.prev = 0;
                      _context.next = 3;
                      return fetch(_this.getEndpoint('processText'), {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          text: text
                        }),
                        signal: AbortSignal.timeout(_config_js__WEBPACK_IMPORTED_MODULE_1__.config.celery.timeout)
                      });
                    case 3:
                      response = _context.sent;
                      if (response.ok) {
                        _context.next = 6;
                        break;
                      }
                      throw new Error("HTTP error! status: ".concat(response.status));
                    case 6:
                      _context.next = 8;
                      return response.json();
                    case 8:
                      result = _context.sent;
                      _this.logger.success('Text processed successfully', result);
                      return _context.abrupt("return", {
                        v: result
                      });
                    case 13:
                      _context.prev = 13;
                      _context.t0 = _context["catch"](0);
                      attempts++;
                      _this.logger.warn("Attempt ".concat(attempts, " failed"), {
                        error: _context.t0.message
                      });

                      // If we still have retries, wait before trying again
                      if (!(attempts < _this.maxRetries)) {
                        _context.next = 24;
                        break;
                      }
                      delay = _this.taskRetryDelay * Math.pow(2, attempts - 1);
                      _this.logger.info("Retrying in ".concat(delay, "ms"));
                      _context.next = 22;
                      return new Promise(function (resolve) {
                        return setTimeout(resolve, delay);
                      });
                    case 22:
                      _context.next = 26;
                      break;
                    case 24:
                      _this.logger.error('All attempts failed', _context.t0);
                      throw _context.t0;
                    case 26:
                    case "end":
                      return _context.stop();
                  }
                }, _loop, null, [[0, 13]]);
              });
            case 3:
              if (!(attempts < this.maxRetries)) {
                _context2.next = 10;
                break;
              }
              return _context2.delegateYield(_loop(), "t0", 5);
            case 5:
              _ret = _context2.t0;
              if (!_ret) {
                _context2.next = 8;
                break;
              }
              return _context2.abrupt("return", _ret.v);
            case 8:
              _context2.next = 3;
              break;
            case 10:
            case "end":
              return _context2.stop();
          }
        }, _callee, this);
      }));
      function processText(_x) {
        return _processText.apply(this, arguments);
      }
      return processText;
    }()
  }, {
    key: "checkStatus",
    value: function () {
      var _checkStatus = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(taskId) {
        var response, result;
        return _regeneratorRuntime().wrap(function _callee2$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              this.logger.debug('Checking task status', {
                taskId: taskId,
                endpoint: this.getEndpoint('status')
              });
              _context3.prev = 1;
              _context3.next = 4;
              return fetch("".concat(this.getEndpoint('status'), "/").concat(taskId), {
                method: 'GET',
                signal: AbortSignal.timeout(_config_js__WEBPACK_IMPORTED_MODULE_1__.config.celery.timeout)
              });
            case 4:
              response = _context3.sent;
              if (response.ok) {
                _context3.next = 7;
                break;
              }
              throw new Error("HTTP error! status: ".concat(response.status));
            case 7:
              _context3.next = 9;
              return response.json();
            case 9:
              result = _context3.sent;
              this.logger.debug('Task status received', result);
              return _context3.abrupt("return", result);
            case 14:
              _context3.prev = 14;
              _context3.t0 = _context3["catch"](1);
              this.logger.error('Failed to check task status', _context3.t0);
              throw _context3.t0;
            case 18:
            case "end":
              return _context3.stop();
          }
        }, _callee2, this, [[1, 14]]);
      }));
      function checkStatus(_x2) {
        return _checkStatus.apply(this, arguments);
      }
      return checkStatus;
    }()
  }, {
    key: "cancelTask",
    value: function () {
      var _cancelTask = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(taskId) {
        var response, result;
        return _regeneratorRuntime().wrap(function _callee3$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              this.logger.debug('Canceling task', {
                taskId: taskId,
                endpoint: this.getEndpoint('cancel')
              });
              _context4.prev = 1;
              _context4.next = 4;
              return fetch("".concat(this.getEndpoint('cancel'), "/").concat(taskId), {
                method: 'POST',
                signal: AbortSignal.timeout(_config_js__WEBPACK_IMPORTED_MODULE_1__.config.celery.timeout)
              });
            case 4:
              response = _context4.sent;
              if (response.ok) {
                _context4.next = 7;
                break;
              }
              throw new Error("HTTP error! status: ".concat(response.status));
            case 7:
              _context4.next = 9;
              return response.json();
            case 9:
              result = _context4.sent;
              this.logger.success('Task canceled successfully', result);
              return _context4.abrupt("return", result);
            case 14:
              _context4.prev = 14;
              _context4.t0 = _context4["catch"](1);
              this.logger.error('Failed to cancel task', _context4.t0);
              throw _context4.t0;
            case 18:
            case "end":
              return _context4.stop();
          }
        }, _callee3, this, [[1, 14]]);
      }));
      function cancelTask(_x3) {
        return _cancelTask.apply(this, arguments);
      }
      return cancelTask;
    }()
  }, {
    key: "healthCheck",
    value: function () {
      var _healthCheck = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
        var response, result, health, _result;
        return _regeneratorRuntime().wrap(function _callee4$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              this.logger.debug('Checking API health', {
                endpoint: this.getEndpoint('health')
              });
              _context5.prev = 1;
              _context5.next = 4;
              return fetch(this.getEndpoint('health'), {
                signal: AbortSignal.timeout(5000) // Short timeout for health checks
              });
            case 4:
              response = _context5.sent;
              result = {
                status: response.ok ? 'healthy' : 'unhealthy',
                statusCode: response.status
              };
              if (!response.ok) {
                _context5.next = 11;
                break;
              }
              _context5.next = 9;
              return response.json();
            case 9:
              health = _context5.sent;
              result.details = health;
            case 11:
              this.logger.debug('Health check result', result);
              return _context5.abrupt("return", result);
            case 15:
              _context5.prev = 15;
              _context5.t0 = _context5["catch"](1);
              _result = {
                status: 'unhealthy',
                error: _context5.t0.message
              };
              this.logger.error('Health check failed', _result);
              return _context5.abrupt("return", _result);
            case 20:
            case "end":
              return _context5.stop();
          }
        }, _callee4, this, [[1, 15]]);
      }));
      function healthCheck() {
        return _healthCheck.apply(this, arguments);
      }
      return healthCheck;
    }()
  }]);
}();
var celeryClient = new CeleryClient();

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
  !*** ./src/content.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/logger */ "./src/utils/logger.js");
/* harmony import */ var _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/celeryClient */ "./src/utils/celeryClient.js");


var logger = (0,_utils_logger__WEBPACK_IMPORTED_MODULE_0__.createLogger)('Content');
logger.info('Content script loaded');

// Initialize text-to-speech and Celery client
var speechSynthesis = window.speechSynthesis;
var currentUtterance = null;
var celeryClient = new _utils_celeryClient__WEBPACK_IMPORTED_MODULE_1__.CeleryClient();

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  var msgLogger = logger.createSubLogger('MessageHandler');
  msgLogger.debug('Received message', request);

  // Handle ping message
  if (request.action === 'ping') {
    msgLogger.debug('Received ping, sending response');
    sendResponse({
      success: true
    });
    return true;
  }
  if (request.action === 'readText' && request.text) {
    msgLogger.info('Processing text request', {
      textLength: request.text.length,
      preview: request.text.substring(0, 50) + '...'
    });
    try {
      // Stop any current speech
      if (currentUtterance) {
        msgLogger.debug('Stopping current speech');
        speechSynthesis.cancel();
      }

      // Send text to Celery for processing
      msgLogger.debug('Sending text to Celery for processing');
      celeryClient.processText(request.text).then(function (result) {
        msgLogger.success('Text processed by Celery', result);
        speakText(result.text);
      })["catch"](function (error) {
        msgLogger.error('Celery processing error', error);
        // Still speak the original text if processing fails
        speakText(request.text);
      });

      // Send immediate success response
      msgLogger.success('Text sent to Celery for processing');
      sendResponse({
        success: true,
        message: 'Processing text'
      });
    } catch (error) {
      msgLogger.error('Error processing text', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  } else if (request.action !== 'ping') {
    msgLogger.warn('Invalid request received', request);
    sendResponse({
      success: false,
      error: 'Invalid request'
    });
  }
  return true; // Keep the message channel open for async response
});

// Function to speak the text
function speakText(text) {
  var speechLogger = logger.createSubLogger('Speech');
  try {
    speechLogger.info('Starting speech synthesis', {
      textLength: text.length,
      preview: text.substring(0, 50) + '...'
    });

    // Create and configure utterance
    currentUtterance = new SpeechSynthesisUtterance(text);

    // Set default voice (English)
    var voices = speechSynthesis.getVoices();
    speechLogger.debug('Available voices', {
      count: voices.length,
      voices: voices.map(function (v) {
        return {
          name: v.name,
          lang: v.lang,
          "default": v["default"]
        };
      })
    });
    var englishVoice = voices.find(function (voice) {
      return voice.lang.startsWith('en-');
    });
    if (englishVoice) {
      speechLogger.debug('Selected voice', {
        name: englishVoice.name,
        lang: englishVoice.lang
      });
      currentUtterance.voice = englishVoice;
    } else {
      speechLogger.warn('No English voice found, using default');
    }

    // Configure speech parameters
    currentUtterance.rate = 1.0;
    currentUtterance.pitch = 1.0;
    currentUtterance.volume = 1.0;

    // Add event listeners
    currentUtterance.onend = function () {
      speechLogger.success('Speech completed');
      currentUtterance = null;
    };
    currentUtterance.onerror = function (event) {
      speechLogger.error('Speech synthesis error', {
        error: event.error,
        message: event.message,
        elapsedTime: event.elapsedTime
      });
      currentUtterance = null;
    };

    // Start speaking
    speechSynthesis.speak(currentUtterance);
    speechLogger.info('Started speaking');
  } catch (error) {
    speechLogger.error('Error in speech synthesis', error);
    currentUtterance = null;
  }
}

// Initialize voices when they're loaded
speechSynthesis.onvoiceschanged = function () {
  var voices = speechSynthesis.getVoices();
  logger.debug('Available voices loaded', voices.map(function (v) {
    return {
      name: v.name,
      lang: v.lang,
      "default": v["default"]
    };
  }));
};
logger.success('Content script initialization complete');
})();

/******/ })()
;
//# sourceMappingURL=content.bundle.js.map
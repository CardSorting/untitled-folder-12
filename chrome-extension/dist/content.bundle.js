/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/utils/celeryClient.js":
/*!***********************************!*\
  !*** ./src/utils/celeryClient.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   celeryClient: () => (/* binding */ celeryClient)
/* harmony export */ });
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../config.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


// Celery client for communicating with CloudAMQP
var CeleryClient = /*#__PURE__*/function () {
  function CeleryClient() {
    _classCallCheck(this, CeleryClient);
    this.baseUrl = Object(function webpackMissingModule() { var e = new Error("Cannot find module '../config.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
    this.taskRetryDelay = 2000; // Initial retry delay in ms
    this.maxRetries = 3;
    this.pendingTasks = new Map(); // Track pending tasks
    console.log("CeleryClient initialized with endpoint: ".concat(this.baseUrl));
  }
  return _createClass(CeleryClient, [{
    key: "processText",
    value: function () {
      var _processText = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(text) {
        var onProgress,
          submitResponse,
          errorData,
          _yield$submitResponse,
          task_id,
          _args = arguments;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              onProgress = _args.length > 1 && _args[1] !== undefined ? _args[1] : null;
              _context.prev = 1;
              _context.next = 4;
              return fetch("".concat(this.baseUrl, "/process_text"), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  text: text
                })
              });
            case 4:
              submitResponse = _context.sent;
              if (submitResponse.ok) {
                _context.next = 10;
                break;
              }
              _context.next = 8;
              return submitResponse.json()["catch"](function () {
                return {};
              });
            case 8:
              errorData = _context.sent;
              throw new Error("HTTP error! status: ".concat(submitResponse.status, ", message: ").concat(errorData.error || 'Unknown error'));
            case 10:
              _context.next = 12;
              return submitResponse.json();
            case 12:
              _yield$submitResponse = _context.sent;
              task_id = _yield$submitResponse.task_id;
              if (task_id) {
                _context.next = 16;
                break;
              }
              throw new Error('No task ID received from server');
            case 16:
              // Track the task
              this.pendingTasks.set(task_id, {
                status: 'PENDING',
                retries: 0,
                startTime: Date.now(),
                endpoint: this.baseUrl // Track which endpoint processed this task
              });

              // Start polling for results
              _context.next = 19;
              return this.pollTaskResult(task_id, onProgress);
            case 19:
              return _context.abrupt("return", _context.sent);
            case 22:
              _context.prev = 22;
              _context.t0 = _context["catch"](1);
              console.error('Error processing text:', _context.t0);
              throw _context.t0;
            case 26:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[1, 22]]);
      }));
      function processText(_x) {
        return _processText.apply(this, arguments);
      }
      return processText;
    }()
  }, {
    key: "pollTaskResult",
    value: function () {
      var _pollTaskResult = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(taskId, onProgress) {
        var _this = this;
        var retryCount,
          response,
          errorData,
          result,
          taskInfo,
          _args2 = arguments;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              retryCount = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : 0;
              _context2.prev = 1;
              _context2.next = 4;
              return fetch("".concat(this.baseUrl, "/task_status/").concat(taskId));
            case 4:
              response = _context2.sent;
              if (response.ok) {
                _context2.next = 10;
                break;
              }
              _context2.next = 8;
              return response.json()["catch"](function () {
                return {};
              });
            case 8:
              errorData = _context2.sent;
              throw new Error("HTTP error! status: ".concat(response.status, ", message: ").concat(errorData.error || 'Unknown error'));
            case 10:
              _context2.next = 12;
              return response.json();
            case 12:
              result = _context2.sent;
              // Update task tracking
              taskInfo = this.pendingTasks.get(taskId);
              if (taskInfo) {
                taskInfo.status = result.status;
                if (result.worker_info) {
                  taskInfo.workerId = result.worker_info.worker_id;
                  taskInfo.retries = result.worker_info.retries;
                }
              }

              // Handle different task states
              _context2.t0 = result.status;
              _context2.next = _context2.t0 === 'SUCCESS' ? 18 : _context2.t0 === 'FAILURE' ? 21 : _context2.t0 === 'PENDING' ? 27 : _context2.t0 === 'STARTED' ? 27 : 33;
              break;
            case 18:
              this.pendingTasks["delete"](taskId);
              if (onProgress) {
                onProgress({
                  status: 'COMPLETED',
                  result: result.result,
                  taskId: taskId,
                  workerInfo: result.worker_info,
                  processingTime: Date.now() - (taskInfo === null || taskInfo === void 0 ? void 0 : taskInfo.startTime)
                });
              }
              return _context2.abrupt("return", result.result);
            case 21:
              if (!(retryCount < this.maxRetries)) {
                _context2.next = 26;
                break;
              }
              if (onProgress) {
                onProgress({
                  status: 'RETRYING',
                  attempt: retryCount + 1,
                  taskId: taskId,
                  error: result.error,
                  endpoint: this.baseUrl
                });
              }
              _context2.next = 25;
              return new Promise(function (resolve) {
                return setTimeout(resolve, _this.taskRetryDelay * Math.pow(2, retryCount));
              });
            case 25:
              return _context2.abrupt("return", this.pollTaskResult(taskId, onProgress, retryCount + 1));
            case 26:
              throw new Error("Task failed after ".concat(retryCount, " retries: ").concat(result.error));
            case 27:
              if (onProgress) {
                onProgress({
                  status: result.status,
                  taskId: taskId,
                  workerInfo: result.worker_info,
                  endpoint: this.baseUrl
                });
              }
              // Check if task has been running too long
              if (!(taskInfo && Date.now() - taskInfo.startTime > 300000)) {
                _context2.next = 30;
                break;
              }
              throw new Error('Task timeout exceeded');
            case 30:
              _context2.next = 32;
              return new Promise(function (resolve) {
                return setTimeout(resolve, 1000);
              });
            case 32:
              return _context2.abrupt("return", this.pollTaskResult(taskId, onProgress, retryCount));
            case 33:
              throw new Error("Unknown task status: ".concat(result.status));
            case 34:
              _context2.next = 44;
              break;
            case 36:
              _context2.prev = 36;
              _context2.t1 = _context2["catch"](1);
              console.error("Error polling task ".concat(taskId, ":"), _context2.t1);
              if (!(retryCount < this.maxRetries)) {
                _context2.next = 43;
                break;
              }
              _context2.next = 42;
              return new Promise(function (resolve) {
                return setTimeout(resolve, _this.taskRetryDelay * Math.pow(2, retryCount));
              });
            case 42:
              return _context2.abrupt("return", this.pollTaskResult(taskId, onProgress, retryCount + 1));
            case 43:
              throw _context2.t1;
            case 44:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[1, 36]]);
      }));
      function pollTaskResult(_x2, _x3) {
        return _pollTaskResult.apply(this, arguments);
      }
      return pollTaskResult;
    }() // Get all pending tasks
  }, {
    key: "getPendingTasks",
    value: function getPendingTasks() {
      var _this2 = this;
      return Array.from(this.pendingTasks.entries()).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          taskId = _ref2[0],
          info = _ref2[1];
        return _objectSpread(_objectSpread({
          taskId: taskId
        }, info), {}, {
          endpoint: _this2.baseUrl
        });
      });
    }

    // Cancel a task if possible
  }, {
    key: "cancelTask",
    value: function () {
      var _cancelTask = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(taskId) {
        var response, errorData;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              _context3.next = 3;
              return fetch("".concat(this.baseUrl, "/cancel_task/").concat(taskId), {
                method: 'POST'
              });
            case 3:
              response = _context3.sent;
              if (response.ok) {
                _context3.next = 9;
                break;
              }
              _context3.next = 7;
              return response.json()["catch"](function () {
                return {};
              });
            case 7:
              errorData = _context3.sent;
              throw new Error("HTTP error! status: ".concat(response.status, ", message: ").concat(errorData.error || 'Unknown error'));
            case 9:
              this.pendingTasks["delete"](taskId);
              _context3.next = 12;
              return response.json();
            case 12:
              return _context3.abrupt("return", _context3.sent);
            case 15:
              _context3.prev = 15;
              _context3.t0 = _context3["catch"](0);
              console.error('Error canceling task:', _context3.t0);
              throw _context3.t0;
            case 19:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[0, 15]]);
      }));
      function cancelTask(_x4) {
        return _cancelTask.apply(this, arguments);
      }
      return cancelTask;
    }() // Health check for the API endpoint
  }, {
    key: "checkEndpointHealth",
    value: function () {
      var _checkEndpointHealth = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
        var response;
        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;
              _context4.next = 3;
              return fetch("".concat(this.baseUrl, "/health"));
            case 3:
              response = _context4.sent;
              if (response.ok) {
                _context4.next = 6;
                break;
              }
              throw new Error("Health check failed: ".concat(response.status));
            case 6:
              _context4.next = 8;
              return response.json();
            case 8:
              return _context4.abrupt("return", _context4.sent);
            case 11:
              _context4.prev = 11;
              _context4.t0 = _context4["catch"](0);
              console.error('Health check failed:', _context4.t0);
              throw _context4.t0;
            case 15:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this, [[0, 11]]);
      }));
      function checkEndpointHealth() {
        return _checkEndpointHealth.apply(this, arguments);
      }
      return checkEndpointHealth;
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
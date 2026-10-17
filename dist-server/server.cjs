"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module2.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module2.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = require("bufferutil");
        module2.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module2.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num2 = +value;
                if (!Number.isInteger(num2) || num2 < 8 || num2 > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num2;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num2 = +value;
              if (!Number.isInteger(num2) || num2 < 8 || num2 > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num2;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    var { isUtf8 } = require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module2.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module2.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = require("utf-8-validate");
        module2.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num2 = buf.readUInt32BE(0);
        if (num2 > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num2 * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module2.exports = Receiver2;
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    var { randomFillSync } = require("crypto");
    var {
      types: { isUint8Array }
    } = require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module2.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function push2(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse2(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push2(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push2(params, header.slice(start, end), true);
            if (code === 44) {
              push2(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push2(params, paramName, value);
            if (code === 44) {
              push2(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push2(offers, token, params);
      } else {
        if (paramName === void 0) {
          push2(params, token, true);
        } else if (mustUnescape) {
          push2(params, paramName, token.replace(/\\/g, ""));
        } else {
          push2(params, paramName, token);
        }
        push2(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension2) => {
        let configurations = extensions[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module2.exports = { format, parse: parse2 };
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var https = require("https");
    var http2 = require("http");
    var net = require("net");
    var tls = require("tls");
    var { randomBytes: randomBytes8, createHash: createHash2 } = require("crypto");
    var { Duplex, Readable } = require("stream");
    var { URL: URL2 } = require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse: parse2 } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes8(16).toString("base64");
      const request = isSecure ? https.request : http2.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash2("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse2(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open2() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish2() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open2() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module2.exports = createWebSocketStream2;
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/subprotocol.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse2(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module2.exports = { parse: parse2 };
  }
});

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/.pnpm/ws@8.21.3/node_modules/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var http2 = require("http");
    var { Duplex } = require("stream");
    var { createHash: createHash2 } = require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http2.createServer((req, res) => {
            const body = http2.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server2 = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server2.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash2("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer2;
    function addListeners(server2, map) {
      for (const event of Object.keys(map)) server2.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server2.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server2) {
      server2._state = CLOSED;
      server2.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http2.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http2.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server2, req, socket, code, message, headers) {
      if (server2.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server2.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// server/main.ts
var import_node_crypto9 = require("node:crypto");
var import_node_fs13 = require("node:fs");
var import_promises = require("node:fs/promises");
var import_node_http = __toESM(require("node:http"), 1);
var import_node_path11 = __toESM(require("node:path"), 1);
var import_node_perf_hooks = require("node:perf_hooks");

// node_modules/.pnpm/ws@8.21.3/node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// src/net/protocol.ts
function parseClientMsg(raw) {
  try {
    const m = JSON.parse(raw);
    if (typeof m === "object" && m !== null && typeof m.t === "string") {
      return m;
    }
  } catch {
  }
  return null;
}
function isFiniteVec(x, z) {
  return typeof x === "number" && Number.isFinite(x) && typeof z === "number" && Number.isFinite(z);
}

// src/sim/exact.ts
function hypot(x, z) {
  return Math.sqrt(x * x + z * z);
}
var TWO_PI = 2 * Math.PI;
var HALF_PI = Math.PI / 2;
var TERMS = 12;
function reduce(x) {
  let r = x % TWO_PI;
  if (r > Math.PI) r -= TWO_PI;
  else if (r < -Math.PI) r += TWO_PI;
  return r;
}
function cosQuadrant(x) {
  const xx = x * x;
  let t = 1;
  for (let n = TERMS; n >= 1; n--) t = 1 - xx / ((2 * n - 1) * (2 * n)) * t;
  return t;
}
function cos(x) {
  const r = Math.abs(reduce(x));
  if (r > HALF_PI) return -cosQuadrant(Math.PI - r);
  return cosQuadrant(r);
}

// src/sim/coach.ts
var GOTO_DONE_RADIUS = 3;
var FOCUS_UNSEEN_S = 4;
function finite(v) {
  return typeof v === "number" && Number.isFinite(v);
}
function parseCoachOrder(raw, at) {
  switch (raw.kind) {
    case "free":
      return null;
    case "goto":
      return finite(raw.x) && finite(raw.z) ? { kind: "goto", x: raw.x, z: raw.z } : void 0;
    case "warden":
    case "creature":
    case "back":
    case "group":
      return { kind: raw.kind };
    case "focus":
      return Number.isInteger(raw.targetId) ? { kind: "focus", targetId: raw.targetId } : void 0;
    case "hold":
      return finite(raw.x) && finite(raw.z) ? { kind: "hold", x: raw.x, z: raw.z } : { kind: "hold", x: at.x, z: at.z };
    default:
      return void 0;
  }
}
function stepCoachOrder(sim, u) {
  const order = u.coachOrder;
  if (!order) return;
  if (order.kind === "goto") {
    if (hypot(u.pos.x - order.x, u.pos.z - order.z) <= GOTO_DONE_RADIUS) u.coachOrder = null;
    return;
  }
  if (order.kind === "focus") {
    const target = sim.units.get(order.targetId);
    if (!target || target.dead) {
      u.coachOrder = null;
      return;
    }
    if (sim.isVisible(u.team, target.id)) u.coachOrderSeenAt = sim.time;
    else if (sim.time - u.coachOrderSeenAt > FOCUS_UNSEEN_S) u.coachOrder = null;
  }
}

// src/sim/content/rings.ts
var ASPECTS = {
  might: { id: "might", name: "Might", perStack: 0.03, says: "{pct} AD and AP" },
  tide: { id: "tide", name: "Tide", perStack: 0.02, says: "{pct} missing HP every 5s" },
  tempo: { id: "tempo", name: "Tempo", perStack: 0.05, says: "{pct} attack speed" },
  bulwark: { id: "bulwark", name: "Bulwark", perStack: 0.05, says: "{pct} armor and MR" },
  swiftness: {
    id: "swiftness",
    name: "Swiftness",
    perStack: 0.05,
    says: "{pct} speed out of combat, {pct} slow resist"
  },
  resolve: {
    id: "resolve",
    name: "Resolve",
    perStack: 0.06,
    says: "{pct} tenacity, {pct} heal and shield power"
  }
};
var ASPECT_IDS = [
  "might",
  "tide",
  "tempo",
  "bulwark",
  "swiftness",
  "resolve"
];
var FAVOR_MAX_STACKS = 1;
var TIDE_PERIOD_S = 5;
var OUT_OF_COMBAT_S = 5;
var RING_BODY = {
  hp: 7e3,
  ad: 14,
  bitePct: 8e-3,
  armor: 40,
  mr: 40,
  attackRange: 2,
  attackSpeed: 0.6,
  moveSpeed: 3.2,
  radius: 0.95,
  xpBounty: 180
};
var ASCENDANT_BODY = {
  hp: 18e3,
  ad: 14,
  bitePct: 0.014,
  armor: 60,
  mr: 60,
  attackRange: 2.4,
  attackSpeed: 0.65,
  moveSpeed: 3,
  radius: 1.3,
  xpBounty: 400
};
var CREATURES = {
  pyrefang: {
    id: "pyrefang",
    name: "\u71CE\u7259",
    ring: "bot",
    firstRiseS: 240,
    returnS: 180,
    aspects: ["might", "tide", "tempo"],
    body: RING_BODY,
    ascendant: { name: "Pyrefang Ascendant", returnS: 300, body: ASCENDANT_BODY }
  },
  voidmaul: {
    id: "voidmaul",
    name: "\u865A\u9524",
    ring: "top",
    firstRiseS: 390,
    returnS: 180,
    aspects: ["bulwark", "swiftness", "resolve"],
    body: { ...RING_BODY, attackRange: 2.2, attackSpeed: 0.5, moveSpeed: 2.8, radius: 1.15 },
    ascendant: {
      name: "Voidmaul Ascendant",
      returnS: 300,
      body: { ...ASCENDANT_BODY, attackSpeed: 0.55, moveSpeed: 2.6, radius: 1.5 }
    }
  }
};
var CREATURE_LIST = [CREATURES.pyrefang, CREATURES.voidmaul];
function creatureOfRing(ring) {
  return ring === "bot" ? CREATURES.pyrefang : CREATURES.voidmaul;
}
var RING_GOLD_EACH = 150;
var CREATURE_CALM_S = 5;
var CREATURE_CALM_REGEN_PER_S = 0.03;
var BODY_GROWTH = [
  [240, 1],
  [390, 1.25],
  [720, 2],
  [1200, 3.1],
  [1500, 3.6]
];
var BITE_GROWTH = [
  [240, 1],
  [720, 2.2],
  [1200, 3.6],
  [1500, 4]
];
function growthAt(curve, time) {
  const first2 = curve[0];
  if (time <= first2[0]) return first2[1];
  for (let i = 1; i < curve.length; i++) {
    const [t1, g1] = curve[i];
    if (time <= t1) {
      const [t0, g0] = curve[i - 1];
      return g0 + (g1 - g0) * (time - t0) / (t1 - t0);
    }
  }
  return curve[curve.length - 1][1];
}
function bodyGrowth(time) {
  return growthAt(BODY_GROWTH, time);
}
function biteGrowth(time) {
  return growthAt(BITE_GROWTH, time);
}
var WRATH_DURATION_S = 150;
var WRATH_EXECUTE_FRAC = 0.2;
var WRATH_BURN_PCT = 0.03;
var WRATH_BURN_S = 3;
var RINGS_CONTENT = {
  aspects: ASPECTS,
  creatures: CREATURES,
  maxStacks: FAVOR_MAX_STACKS,
  tidePeriod: TIDE_PERIOD_S,
  outOfCombat: OUT_OF_COMBAT_S,
  goldEach: RING_GOLD_EACH,
  bodyGrowth: BODY_GROWTH,
  biteGrowth: BITE_GROWTH,
  calm: CREATURE_CALM_S,
  calmRegen: CREATURE_CALM_REGEN_PER_S,
  wrath: {
    duration: WRATH_DURATION_S,
    execute: WRATH_EXECUTE_FRAC,
    burnPct: WRATH_BURN_PCT,
    burnS: WRATH_BURN_S
  }
};

// src/sim/favors.ts
var NO_FAVORS = Object.freeze({
  might: 0,
  tide: 0,
  tempo: 0,
  bulwark: 0,
  swiftness: 0,
  resolve: 0
});
function favorBonus(stacks, aspect) {
  return stacks[aspect] * ASPECTS[aspect].perStack;
}
function hasAnyFavor(stacks) {
  return ASPECT_IDS.some((id) => stacks[id] > 0);
}
function outOfCombat(u, time) {
  return time - u.lastDamagedAt > OUT_OF_COMBAT_S && time - u.lastDealtDamageAt > OUT_OF_COMBAT_S;
}
var Favors = class {
  held = [
    { ...NO_FAVORS },
    { ...NO_FAVORS }
  ];
  // The stacks as plain data, for a world checkpoint (src/sim/snapshot.ts).
  snapshot() {
    return [{ ...this.held[0] }, { ...this.held[1] }];
  }
  restore(held2) {
    Object.assign(this.held[0], held2[0]);
    Object.assign(this.held[1], held2[1]);
  }
  // One more stack of the aspect for the team, up to the cap; returns the
  // stacks held after.
  grant(team2, aspect) {
    const h = this.held[team2];
    h[aspect] = Math.min(FAVOR_MAX_STACKS, h[aspect] + 1);
    return h[aspect];
  }
  // A frozen copy of the team's stacks: what a unit mirrors.
  stacks(team2) {
    return Object.freeze({ ...this.held[team2] });
  }
};

// src/sim/combat/status.ts
function expireStatuses(u, time) {
  if (u.statuses.length === 0) return;
  u.statuses = u.statuses.filter((s) => s.until > time);
}
function addStatus(u, s) {
  u.statuses.push(s);
}
function refreshBuff(u, time, duration, stats) {
  const msPct = stats.msPct ?? 0;
  const asPct = stats.asPct ?? 0;
  const armor = stats.armor ?? 0;
  const mr = stats.mr ?? 0;
  for (const s of u.statuses) {
    if (s.kind === "buff" && s.msPct === msPct && s.asPct === asPct && s.armor === armor && s.mr === mr) {
      s.until = Math.max(s.until, time + duration);
      return;
    }
  }
  u.statuses.push({ kind: "buff", until: time + duration, msPct, asPct, armor, mr });
}
function has(u, kind, time) {
  return u.statuses.some((s) => s.kind === kind && s.until > time);
}
function isRooted(u, time) {
  return has(u, "root", time) || isStunned(u, time);
}
function isStunned(u, time) {
  return has(u, "stun", time) || has(u, "airborne", time);
}
function isUntargetable(u, time) {
  return has(u, "untargetable", time);
}
function isStealthed(u, time) {
  return has(u, "stealth", time);
}
function breakStealth(u) {
  u.statuses = u.statuses.filter((s) => s.kind !== "stealth");
}
function tauntSourceId(u, time) {
  for (const s of u.statuses) {
    if (s.kind === "taunt" && s.until > time) return s.sourceId;
  }
  return null;
}
function slowPct(u, time) {
  let strongest = 0;
  for (const s of u.statuses) {
    if (s.kind === "slow" && s.until > time && s.pct > strongest) strongest = s.pct;
  }
  return strongest * (1 - favorBonus(u.favors, "swiftness"));
}
function buffSum(u, time, pick2) {
  let sum = 0;
  for (const s of u.statuses) {
    if (s.kind === "buff" && s.until > time) sum += pick2(s);
  }
  return sum;
}
function moveSpeedBonusPct(u, time) {
  return buffSum(u, time, (b) => b.msPct);
}
function attackSpeedBonusPct(u, time) {
  return buffSum(u, time, (b) => b.asPct);
}
function armorBonus(u, time) {
  return buffSum(u, time, (b) => b.armor);
}
function mrBonus(u, time) {
  return buffSum(u, time, (b) => b.mr);
}
function effectiveMoveSpeed(u, time) {
  if (isRooted(u, time)) return 0;
  const swift = outOfCombat(u, time) ? favorBonus(u.favors, "swiftness") : 0;
  return u.moveSpeed * (1 - slowPct(u, time)) * (1 + moveSpeedBonusPct(u, time) + swift);
}
function sightFactor(u, time) {
  let factor = 1;
  for (const s of u.statuses) {
    if (s.kind === "blind" && s.until > time && s.factor < factor) factor = s.factor;
  }
  return factor;
}
function healFactor(u, time) {
  let strongest = 0;
  for (const s of u.statuses) {
    if (s.kind === "grievous" && s.until > time && s.factor > strongest) strongest = s.factor;
  }
  return 1 - strongest;
}
function absorbWithShields(u, amount, time) {
  let left = amount;
  for (const s of u.statuses) {
    if (left <= 0) break;
    if (s.kind !== "shield" || s.until <= time || s.remaining <= 0) continue;
    const absorbed = Math.min(s.remaining, left);
    s.remaining -= absorbed;
    left -= absorbed;
  }
  if (left !== amount) {
    u.statuses = u.statuses.filter(
      (s) => s.kind !== "shield" || s.remaining > 0 || s.burst !== void 0
    );
  }
  return left;
}
function consumeEmpower(u, time) {
  for (let i = 0; i < u.statuses.length; i++) {
    const s = u.statuses[i];
    if (s.kind === "empower" && s.until > time) {
      u.statuses.splice(i, 1);
      return s;
    }
  }
  return null;
}
function addMarkStack(u, duration, time, sourceId) {
  const existing = u.statuses.find(
    (s) => s.kind === "mark" && s.sourceId === sourceId && s.until > time
  );
  if (existing && existing.kind === "mark") {
    existing.stacks += 1;
    existing.until = time + duration;
    return existing.stacks;
  }
  u.statuses.push({ kind: "mark", until: time + duration, stacks: 1, sourceId });
  return 1;
}
function clearMarks(u, sourceId) {
  u.statuses = u.statuses.filter((s) => !(s.kind === "mark" && s.sourceId === sourceId));
}
function isRecalling(u, time) {
  return u.statuses.some((s) => s.kind === "recall" && s.until > time);
}
function cancelRecall(u) {
  u.statuses = u.statuses.filter((s) => s.kind !== "recall");
}

// src/sim/content/item_passives.ts
var HEARTBEAT_CALM_S = 5;
var HEARTBEAT_HP_PCT_PER_S = 0.02;
var TICK_PERIOD_S = 0.25;
var DEATHMARK_THRESHOLD = 0.3;
var DEATHMARK_BONUS = 1.12;
var GALE_MS_PCT = 0.12;
var GALE_DURATION_S = 1.5;
var WORLDHEART = {
  itemId: "worldheart",
  name: "Heartbeat",
  description: "After 5s without taking damage, regenerate 2% max health per second.",
  onTick(ctx, self) {
    if (self.hp >= self.maxHp) return;
    if (ctx.time - self.lastDamagedAt < HEARTBEAT_CALM_S) return;
    const amount = self.maxHp * HEARTBEAT_HP_PCT_PER_S * TICK_PERIOD_S;
    self.hp = Math.min(self.maxHp, self.hp + amount * healFactor(self, ctx.time));
  }
};
var DOOMBRAND = {
  itemId: "doombrand",
  name: "Deathmark",
  description: "Your damage against targets below 30% health is increased by 12%.",
  modifyDamage(_ctx, _self, target, amount) {
    if (target.maxHp > 0 && target.hp / target.maxHp < DEATHMARK_THRESHOLD) {
      return amount * DEATHMARK_BONUS;
    }
    return amount;
  }
};
var SKYSHEAR = {
  itemId: "skyshear",
  name: "Gale",
  description: "Attacks on champions grant 12% move speed for 1.5s.",
  onAttackHit(ctx, self, target) {
    if (target.kind !== "champion") return;
    addStatus(self, {
      kind: "buff",
      until: ctx.time + GALE_DURATION_S,
      msPct: GALE_MS_PCT,
      asPct: 0,
      armor: 0,
      mr: 0
    });
  }
};
var ITEM_PASSIVES = {
  [WORLDHEART.itemId]: WORLDHEART,
  [DOOMBRAND.itemId]: DOOMBRAND,
  [SKYSHEAR.itemId]: SKYSHEAR
};

// src/sim/passives.ts
var PASSIVE_PERIOD_TICKS = 5;
function passiveOf(u) {
  if (u.kind !== "champion") return void 0;
  return u.champion?.passive;
}
var NO_ITEM_PASSIVES = [];
function itemPassivesOf(u) {
  if (u.kind !== "champion" || u.items.length === 0) return NO_ITEM_PASSIVES;
  let out = null;
  for (const id of u.items) {
    const p = ITEM_PASSIVES[id];
    if (!p) continue;
    if (out === null) out = [p];
    else if (!out.includes(p)) out.push(p);
  }
  return out ?? NO_ITEM_PASSIVES;
}
function runItemAttackHits(ctx, self, target) {
  for (const p of itemPassivesOf(self)) p.onAttackHit?.(ctx, self, target);
}
function applyItemDamageModifiers(ctx, self, target, amount, dtype, via) {
  for (const p of itemPassivesOf(self)) {
    if (p.modifyDamage) amount = p.modifyDamage(ctx, self, target, amount, dtype, via);
  }
  return amount;
}
function stepPassives(ctx, tickCount) {
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.dead || ctx.dead.has(u.id)) continue;
    if ((tickCount + u.id) % PASSIVE_PERIOD_TICKS !== 0) continue;
    passiveOf(u)?.onTick?.(ctx, u);
    for (const p of itemPassivesOf(u)) p.onTick?.(ctx, u);
  }
}

// src/sim/structure_rules.ts
var LANES = ["top", "mid", "bot"];
function hasAliveTower(units, team2, pred) {
  for (const u of units.values()) {
    if (u.team !== team2 || u.kind !== "tower" || u.dead || !u.structure) continue;
    if (pred(u)) return true;
  }
  return false;
}
function laneFullyOpen(units, team2, lane) {
  return !hasAliveTower(units, team2, (o) => o.structure.lane === lane);
}
function isInvulnerable(units, u) {
  if (u.kind === "tower" && u.structure) {
    const s = u.structure;
    if (s.lane !== "sanctum") {
      if (s.tier > 1) {
        return hasAliveTower(
          units,
          u.team,
          (o) => o.structure.lane === s.lane && o.structure.tier < s.tier
        );
      }
      return false;
    }
    const anyLaneOpen = LANES.some(
      (lane) => !hasAliveTower(units, u.team, (o) => o.structure.lane === lane)
    );
    return !anyLaneOpen;
  }
  if (u.kind === "sanctum") {
    return hasAliveTower(units, u.team, (o) => o.structure.lane === "sanctum");
  }
  return false;
}

// src/sim/combat/damage.ts
var KILL_CREDIT_WINDOW_S = 10;
function mitigationMultiplier(target, dtype, penFlat = 0, penPct = 0) {
  if (dtype === "physical") {
    const armor = target.stats.armor + armorBonus(target, 0);
    return 100 / (100 + Math.max(0, armor * (1 - penPct) - penFlat));
  }
  if (dtype === "magic") {
    const mr = target.stats.mr + mrBonus(target, 0);
    return 100 / (100 + Math.max(0, mr * (1 - penPct) - penFlat));
  }
  return 1;
}
function dealDamage(ctx, sourceId, target, amount, dtype, via = "other") {
  if (ctx.dead.has(target.id) || target.dead) return;
  if (isUntargetable(target, ctx.time)) return;
  if ((target.kind === "tower" || target.kind === "sanctum") && isInvulnerable(ctx.units, target)) {
    return;
  }
  const source = ctx.units.get(sourceId);
  if (source) {
    const passive = passiveOf(source);
    if (passive?.modifyDamage) {
      amount = passive.modifyDamage(ctx, source, target, amount, dtype, via);
    }
    amount = applyItemDamageModifiers(ctx, source, target, amount, dtype, via);
    if (!source.neutral) {
      amount *= ctx.teamBuffs.damageMultiplier(source.team, ctx.time);
    }
  }
  const penFlat = source === void 0 ? 0 : dtype === "physical" ? source.stats.armorPen : source.stats.mrPen;
  const penPct = source === void 0 ? 0 : dtype === "physical" ? source.stats.armorPenPct : source.stats.mrPenPct;
  const mitigated = amount * mitigationMultiplier(target, dtype, penFlat, penPct);
  if (mitigated > 0) target.lastDamagedAt = ctx.time;
  const after = absorbWithShields(target, mitigated, ctx.time);
  if (after <= 0) return;
  cancelRecall(target);
  if (target.kind === "champion") {
    const source2 = ctx.units.get(sourceId);
    if (source2 && source2.kind === "champion" && source2.team !== target.team) {
      target.lastHitByChampion = sourceId;
      target.lastHitAt = ctx.time;
      const seen2 = target.recentDamagers.find((r) => r.id === sourceId);
      if (seen2) seen2.at = ctx.time;
      else target.recentDamagers.push({ id: sourceId, at: ctx.time });
    }
  }
  target.hp -= after;
  if (source) source.lastDealtDamageAt = ctx.time;
  ctx.events.push({ type: "damage", sourceId, targetId: target.id, amount: after, dtype });
  if (target.kind === "champion" && source?.kind === "champion" && !source.neutral && source.team !== target.team && ctx.teamBuffs.wrathUntil(source.team, ctx.time) !== null) {
    if (via !== "other") {
      const burn = target.statuses.find((st) => st.kind === "dot" && st.tag === "wrath");
      const perSecond = WRATH_BURN_PCT * target.maxHp / WRATH_BURN_S;
      if (burn && burn.kind === "dot") {
        burn.until = ctx.time + WRATH_BURN_S;
        burn.perSecond = perSecond;
        burn.sourceId = sourceId;
      } else {
        target.statuses.push({
          kind: "dot",
          until: ctx.time + WRATH_BURN_S,
          perSecond,
          sourceId,
          dtype: "true",
          tag: "wrath"
        });
      }
    }
    if (target.hp > 0 && target.hp <= WRATH_EXECUTE_FRAC * target.maxHp) {
      target.hp = 0;
      ctx.events.push({ type: "execute", unitId: target.id, killerId: sourceId });
    }
  }
  if (target.hp <= 0) {
    target.hp = 0;
    ctx.dead.add(target.id);
    let creditId = sourceId;
    const executor = ctx.units.get(sourceId);
    if (target.kind === "champion" && (executor?.kind !== "champion" || executor.team === target.team)) {
      const contributor = ctx.units.get(target.lastHitByChampion);
      if (contributor && contributor.kind === "champion" && contributor.team !== target.team && ctx.time - target.lastHitAt <= KILL_CREDIT_WINDOW_S) {
        creditId = contributor.id;
      }
    }
    ctx.killers.set(target.id, creditId);
    ctx.events.push({ type: "death", unitId: target.id, killerId: creditId });
  }
}

// src/sim/content/champions/ashvyn.ts
var TWINSHOT_EVERY = 3;
var TWINSHOT_RATIO = 0.5;
var ASHVYN = {
  id: "ashvyn",
  name: "\u827E\u4EC0\u6587, \u591C\u5F13",
  role: "Marksman",
  blurb: "A mobile duelist marksman who weaves in and out of range.",
  passive: {
    name: "\u53CC\u53D1",
    description: "Every third attack strikes twice (the echo deals 50 percent damage). Casting Hunter's Step readies the echo instantly.",
    onAttackHit(ctx, self, target) {
      self.passiveStacks += 1;
      if (self.passiveStacks < TWINSHOT_EVERY) return;
      self.passiveStacks = 0;
      dealDamage(ctx, self.id, target, self.stats.ad * TWINSHOT_RATIO, "physical", "other");
    },
    // The roster's promised W synergy: the dash primes the next echo.
    onCast(_ctx, self, key) {
      if (key === "W") self.passiveStacks = TWINSHOT_EVERY - 1;
    }
  },
  base: {
    hp: 560,
    mana: 280,
    ad: 58,
    ap: 0,
    armor: 24,
    mr: 30,
    attackRange: 5.9,
    attackSpeed: 0.75,
    moveSpeed: 3.7,
    hpRegen: 1.4,
    manaRegen: 1.3,
    radius: 0.6
  },
  growth: { hp: 90, mana: 30, ad: 5.5, armor: 2.2, mr: 1.3 },
  abilities: {
    Q: {
      name: "\u6697\u5F71\u9F50\u5C04",
      manaCost: 40,
      cooldown: 5.5,
      castRange: 7,
      // Instant scaling cone: the draw telegraphs before the volley flies.
      // Reach pass: at 5.5 the volley landed SHORTER than his own bow
      // (5.9), so there was never a moment to cast it that an attack did
      // not already cover. At the engine's cone rail it is what it reads
      // as, a point-blank shotgun that opens a trade.
      windup: 0.25,
      spec: {
        kind: "cone",
        range: 7,
        halfAngle: Math.PI / 6,
        onHit: [{ kind: "damage", base: 62, adRatio: 1.33, dtype: "physical" }]
      }
    },
    W: {
      name: "Hunter's Step",
      manaCost: 35,
      cooldown: 7,
      // The step the blurb promises ("weaves in and out of range"): 3.5
      // was under his own body plus a champion's, so it bought no time at
      // all. Five costs a melee champion a second approach without undoing
      // its engage outright, which would be the other mistake.
      castRange: 5,
      spec: {
        kind: "dash",
        range: 5,
        speed: 16,
        selfEffects: [{ kind: "buff", duration: 2.5, asPct: 0.4 }]
      }
    },
    E: {
      name: "\u9489\u8DB3\u7BAD",
      manaCost: 45,
      cooldown: 8.5,
      castRange: 10,
      // The roster promise, delivered: a long flight pins (root), a
      // point-blank shot only slows. Max-range picks, not melee spam.
      spec: {
        kind: "skillshot",
        speed: 26,
        radius: 0.55,
        range: 10,
        onHit: [
          { kind: "damage", base: 53, adRatio: 0.95, dtype: "physical" },
          {
            kind: "conditional",
            // Six tenths of the flight, held there as the arrow got
            // longer: the root stays the reward for the far shot.
            when: { kind: "distanceAtLeast", distance: 6 },
            effects: [{ kind: "root", duration: 1 }],
            otherwise: [{ kind: "slow", pct: 0.4, duration: 1 }]
          }
        ]
      }
    },
    R: {
      name: "Eclipse Rain",
      manaCost: 85,
      cooldown: 64,
      castRange: 10,
      // Brush and stealth offer no cover under the eclipse: the zone
      // reveals everything inside for its duration. It was the smallest
      // ultimate zone on the roster and cast from the shortest distance,
      // which is the wrong pair for the squishiest body that owns one.
      spec: {
        kind: "zone",
        radius: 5.2,
        duration: 3,
        tickEvery: 0.5,
        reveal: true,
        onTick: [
          { kind: "damage", base: 48, adRatio: 0.66, dtype: "physical" },
          { kind: "slow", pct: 0.3, duration: 1 }
        ]
      }
    }
  }
};

// src/sim/content/champions/dain.ts
var HEAT_MAX = 4;
var HEAT_BONUS = 1.25;
var JAB_KILL_WINDOW_S = 0.6;
var DAIN = {
  id: "dain",
  name: "\u6234\u6069, \u70BD\u62F3",
  role: "Fighter",
  blurb: "A brawler who wants long trades: attacks build Heat for empowered abilities.",
  passive: {
    name: "\u70BD\u70ED",
    description: "Attacks build Heat (up to 4); Ember Flurry adds one. At full Heat, the next ability deals 25 percent bonus damage. A kill moments after his strike resets Blazing Jab.",
    onAttackHit(_ctx, self) {
      self.passiveStacks = Math.min(HEAT_MAX, self.passiveStacks + 1);
    },
    onCast(_ctx, self, key) {
      if (key === "E") self.passiveStacks = Math.min(HEAT_MAX, self.passiveStacks + 1);
    },
    modifyDamage(_ctx, self, _target, amount, _dtype, via) {
      if (via !== "ability" || self.passiveStacks < HEAT_MAX) return amount;
      self.passiveStacks = 0;
      return amount * HEAT_BONUS;
    },
    onTakedown(ctx, self, victim) {
      const hit = victim.recentDamagers.find((r) => r.id === self.id);
      if (hit && ctx.time - hit.at <= JAB_KILL_WINDOW_S) self.cooldowns.Q = ctx.time;
    }
  },
  base: {
    hp: 620,
    mana: 300,
    ad: 62,
    ap: 0,
    armor: 28,
    mr: 30,
    attackRange: 1.8,
    attackSpeed: 0.68,
    moveSpeed: 3.75,
    hpRegen: 1.8,
    manaRegen: 1.1,
    radius: 0.68
  },
  growth: { hp: 100, mana: 30, ad: 3.8, armor: 2.6, mr: 1.8 },
  abilities: {
    Q: {
      name: "\u70BD\u7130\u7A81\u523A",
      manaCost: 30,
      cooldown: 4,
      castRange: 7,
      // A traveling punch through the line (doubled reach, playtest round
      // 2): hitting a champion refunds half the cooldown, a kill resets it
      // outright (the passive), the weave that keeps his trades alive.
      spec: {
        kind: "dash",
        range: 7,
        speed: 18,
        // Only champions move this cooldown: a hit refunds half, and the
        // punch's own killing blow resets it outright. Minions and camps
        // change nothing, so the weave is a duel tool, not a farm tool.
        passThrough: [
          { kind: "damage", base: 95, adRatio: 0.7, dtype: "physical" },
          {
            kind: "conditional",
            when: { kind: "targetIsChampion" },
            effects: [
              { kind: "cooldownRefund", key: "Q", pctOfRemaining: 0.5 },
              {
                kind: "conditional",
                when: { kind: "targetDying" },
                effects: [{ kind: "cooldownRefund", key: "Q", pctOfRemaining: 1 }]
              }
            ]
          }
        ]
      }
    },
    W: {
      name: "\u4F59\u70EC\u5B88\u536B",
      manaCost: 45,
      cooldown: 9,
      castRange: 6.5,
      // A rescue jump: it goes TO the aimed ally, landing against them, and
      // the guard goes off where he lands. With no ally in reach there is
      // nothing to jump to and the cast is refused, so the button always
      // means the same thing.
      spec: {
        kind: "dash",
        range: 6.5,
        speed: 16,
        toAlly: { searchRadius: 3.5 },
        landRadius: 2.5,
        // The roster's burn-while-held: enemies caught in the guard keep
        // burning while the shield holds.
        onLand: [
          { kind: "damage", base: 40, apRatio: 0.2, dtype: "magic" },
          { kind: "dot", duration: 3, perSecond: 22, dtype: "magic" }
        ],
        // Breaking the guard early detonates it: attackers choose between
        // popping the shield and eating the blast, or waiting it out.
        selfEffects: [
          {
            kind: "shield",
            base: 90,
            duration: 3,
            burst: {
              radius: 2.5,
              onBreak: [
                { kind: "damage", base: 70, apRatio: 0.3, dtype: "magic" },
                { kind: "slow", pct: 0.2, duration: 1 }
              ]
            }
          }
        ]
      }
    },
    E: {
      name: "\u4F59\u70EC\u65CB\u821E",
      manaCost: 30,
      cooldown: 7,
      castRange: 0,
      // Ignited fists: the next auto hits harder, splashes behind the
      // victim, and banks an extra Heat stack (passive onCast).
      spec: {
        kind: "self_or_ally",
        searchRadius: 0,
        effects: [
          {
            kind: "empower",
            duration: 3,
            bonus: [{ kind: "damage", base: 60, adRatio: 0.4, dtype: "magic" }],
            splashRadius: 2,
            splash: [{ kind: "damage", base: 45, adRatio: 0.3, dtype: "magic" }]
          }
        ]
      }
    },
    R: {
      name: "\u70EC\u843D",
      manaCost: 75,
      cooldown: 60,
      castRange: 6,
      // A called-down comet, doubled across (playtest round 2): the wider
      // the threat, the longer the fuse (telegraph first). Only the small
      // epicenter stuns; the rim burns and slows, so the aim is the skill.
      spec: {
        kind: "zone",
        radius: 6,
        duration: 1.35,
        detonateDelay: 1.3,
        onDetonate: [
          {
            kind: "conditional",
            when: { kind: "withinCenter", radius: 2.2 },
            effects: [
              { kind: "damage", base: 250, adRatio: 0.8, dtype: "magic" },
              { kind: "stun", duration: 1.2 },
              { kind: "dot", duration: 2, perSecond: 30, dtype: "magic" }
            ],
            otherwise: [
              { kind: "damage", base: 150, adRatio: 0.5, dtype: "magic" },
              { kind: "slow", pct: 0.4, duration: 1.5 }
            ]
          }
        ]
      }
    }
  }
};

// src/sim/content/champions/elowen.ts
var MISTBORNE_MS_PCT = 0.08;
var MISTBORNE_DURATION_S = 1.2;
var ELOWEN = {
  id: "elowen",
  name: "\u827E\u6D1B\u6587, \u5B88\u96FE\u8005",
  role: "Battlemage",
  blurb: "A skirmishing mage who bends vision itself and flows between hits.",
  passive: {
    name: "\u96FE\u751F",
    description: "Dealing ability damage grants a brief burst of move speed.",
    modifyDamage(ctx, self, _target, amount, _dtype, via) {
      if (via === "ability" && amount > 0) {
        refreshBuff(self, ctx.time, MISTBORNE_DURATION_S, { msPct: MISTBORNE_MS_PCT });
      }
      return amount;
    }
  },
  base: {
    hp: 560,
    mana: 480,
    ad: 52,
    ap: 0,
    armor: 22,
    mr: 30,
    attackRange: 5.75,
    attackSpeed: 0.62,
    moveSpeed: 3.65,
    hpRegen: 1.2,
    manaRegen: 1.7,
    radius: 0.65
  },
  growth: { hp: 90, mana: 45, ad: 3, armor: 2.3, mr: 1.3 },
  abilities: {
    Q: {
      name: "\u8FF7\u96FE\u957F\u67AA",
      manaCost: 40,
      cooldown: 4.5,
      castRange: 9.5,
      spec: {
        kind: "skillshot",
        speed: 22,
        radius: 0.6,
        range: 9.5,
        pierce: true,
        onHit: [
          { kind: "damage", base: 62, apRatio: 0.95, dtype: "magic" },
          // The mist clings: the second lance on a marked target bursts and
          // slows. Duration outlives the rank-1 cooldown so the weave works
          // from level 1.
          {
            kind: "mark",
            duration: 5.5,
            stacksToTrigger: 2,
            onTrigger: [
              { kind: "damage", base: 55, apRatio: 0.4, dtype: "magic" },
              { kind: "slow", pct: 0.25, duration: 1 }
            ]
          }
        ]
      }
    },
    W: {
      name: "\u5E37\u5E55",
      manaCost: 60,
      cooldown: 10.5,
      // Cast from where a battlemage stands, which is a step behind her
      // own lance: the veil was landing inside the range she was already
      // being shot from.
      castRange: 8.5,
      spec: {
        kind: "zone",
        radius: 3.5,
        duration: 3.5,
        tickEvery: 0.5,
        onTick: [
          { kind: "blind", duration: 1, factor: 0.4 },
          { kind: "damage", base: 10, apRatio: 0.19, dtype: "magic" }
        ],
        // The mist conceals: allied CHAMPIONS inside stay hidden (the zone
        // itself is visible, so enemies know where the threat is, not what
        // it does). Minions are exempt or the lane war would stall blind.
        allyOnTick: [
          {
            kind: "conditional",
            when: { kind: "targetIsChampion" },
            effects: [{ kind: "stealth", duration: 0.6 }]
          }
        ]
      }
    },
    E: {
      name: "\u6D6E\u6B65",
      manaCost: 45,
      cooldown: 8.5,
      // Four was the shortest step on the roster, shorter than the veil
      // she casts and inside the landing spread of every leap that hunts
      // her. Five buys the beat a second cast needs, which is the whole
      // point of a battlemage's step.
      castRange: 5,
      spec: { kind: "dash", range: 5 }
    },
    R: {
      name: "\u767D\u832B",
      manaCost: 85,
      cooldown: 64,
      castRange: 9,
      spec: {
        kind: "zone",
        radius: 5,
        duration: 4,
        tickEvery: 0.5,
        onTick: [
          { kind: "damage", base: 35, apRatio: 0.48, dtype: "magic" },
          { kind: "slow", pct: 0.45, duration: 1 }
        ],
        // The storm's rim is a wall of wind: walking out throws you back
        // toward the eye (once per 1.5 s each). A dash or blink escapes.
        boundary: {
          effects: [
            { kind: "knockback", distance: 2, direction: "toCenter" },
            { kind: "damage", base: 25, apRatio: 0.2, dtype: "magic" }
          ],
          perUnitEvery: 1.5
        }
      }
    }
  }
};

// src/sim/content/champions/fenn.ts
var OPPORTUNIST_THRESHOLD = 0.35;
var OPPORTUNIST_BONUS = 1.15;
var LUNGE_RESET_WINDOW_S = 2;
var FENN = {
  id: "fenn",
  name: "\u82AC\u6069, \u8FC5\u5203",
  role: "Assassin",
  blurb: "A single-target executioner who commits hard and finishes low targets.",
  passive: {
    name: "\u4F3A\u673A\u800C\u52A8",
    description: "Deals 15 percent bonus damage to enemies below 35 percent health. Takedowns on recently struck champions reset Lunge.",
    modifyDamage(_ctx, _self, target, amount) {
      if (target.maxHp <= 0 || target.hp / target.maxHp >= OPPORTUNIST_THRESHOLD) return amount;
      return amount * OPPORTUNIST_BONUS;
    },
    onTakedown(ctx, self, victim) {
      const hit = victim.recentDamagers.find((r) => r.id === self.id);
      if (hit && ctx.time - hit.at <= LUNGE_RESET_WINDOW_S) self.cooldowns.Q = ctx.time;
    }
  },
  base: {
    hp: 560,
    mana: 320,
    ad: 64,
    ap: 0,
    armor: 24,
    mr: 30,
    attackRange: 1.8,
    attackSpeed: 0.7,
    moveSpeed: 3.85,
    hpRegen: 1.6,
    manaRegen: 1.3,
    radius: 0.62
  },
  growth: { hp: 92, mana: 35, ad: 5.5, armor: 2.2, mr: 1.6 },
  abilities: {
    Q: {
      name: "\u7A81\u523A",
      manaCost: 35,
      cooldown: 5.5,
      // Seven, level with the fighter's punch (Blazing Jab): the
      // assassin's opener was two units shorter than it, which read as the
      // wrong way round on the champion whose whole case is arriving
      // first. The melee engage is a band, not a ladder.
      castRange: 7,
      // A real flight now: visible, interceptable, and reset by takedowns
      // (the passive), the assassin's snowball lever.
      spec: {
        kind: "dash",
        range: 7,
        speed: 18,
        landRadius: 1.8,
        onLand: [{ kind: "damage", base: 79, adRatio: 1.52, dtype: "physical" }]
      }
    },
    W: {
      name: "\u53CC\u7259",
      manaCost: 40,
      cooldown: 6,
      castRange: 8,
      // Both fangs bite anyone; a target with no ally nearby takes the
      // hunter's bonus. Fenn wants strays, not teamfights.
      spec: {
        kind: "skillshot",
        speed: 26,
        radius: 0.5,
        range: 8,
        onHit: [
          { kind: "damage", base: 40, adRatio: 0.66, dtype: "physical" },
          { kind: "damage", base: 40, adRatio: 0.66, dtype: "physical" },
          {
            kind: "conditional",
            when: { kind: "targetIsolated", radius: 4 },
            effects: [{ kind: "damage", base: 32, adRatio: 0.53, dtype: "physical" }]
          }
        ]
      }
    },
    E: {
      name: "\u70DF\u5E55",
      manaCost: 45,
      cooldown: 10.5,
      castRange: 0,
      spec: {
        kind: "self_or_ally",
        searchRadius: 0,
        effects: [
          { kind: "stealth", duration: 2.5 },
          { kind: "buff", duration: 2.5, msPct: 0.25 }
        ]
      }
    },
    R: {
      name: "\u6697\u5F71\u8FDE\u51FB",
      manaCost: 85,
      cooldown: 56.5,
      // The blur has to cross a screen's worth of teamfight to reach the
      // back line it is aimed at; at 5.5 it landed him in the front one.
      castRange: 6.5,
      // The crouch telegraphs, then Fenn blurs down a short line, striking
      // every champion passed, untouchable only while he travels. Pressing
      // R again inside the window blinks him back to where he committed:
      // the banked, budgeted way home (the roster's only recast, ADR 0005).
      windup: 0.35,
      spec: {
        kind: "dash",
        range: 6.5,
        speed: 14,
        untargetableDuringTravel: true,
        passThrough: [
          {
            kind: "conditional",
            when: { kind: "targetIsChampion" },
            effects: [{ kind: "damage", base: 228, adRatio: 1.9, dtype: "physical" }]
          }
        ]
      },
      recast: { window: 4, returnBlink: true }
    }
  }
};

// src/sim/content/champions/korrath.ts
var SHIELDSKIN_CALM_S = 4;
var SHIELDSKIN_BASE = 25;
var SHIELDSKIN_PER_LEVEL = 7;
var KORRATH = {
  id: "korrath",
  name: "\u79D1\u62C9\u601D, \u58C1\u5792",
  role: "Tank",
  blurb: "An immovable frontline anchor who soaks damage and locks enemies down.",
  passive: {
    name: "\u76FE\u76AE",
    description: "After 4 seconds without taking damage, gains a small shield.",
    onTick(ctx, self) {
      if (ctx.time - self.lastDamagedAt < SHIELDSKIN_CALM_S) return;
      if (self.statuses.some((s) => s.kind === "shield" && s.until > ctx.time)) return;
      addStatus(self, {
        kind: "shield",
        until: ctx.time + 6,
        remaining: SHIELDSKIN_BASE + SHIELDSKIN_PER_LEVEL * self.level
      });
    }
  },
  base: {
    hp: 650,
    mana: 320,
    ad: 58,
    ap: 0,
    armor: 32,
    mr: 32,
    attackRange: 1.8,
    attackSpeed: 0.62,
    moveSpeed: 3.65,
    hpRegen: 2.2,
    manaRegen: 1.2,
    radius: 0.75
  },
  growth: { hp: 95, mana: 35, ad: 3.5, armor: 3.2, mr: 2 },
  abilities: {
    Q: {
      name: "\u76FE\u51FB",
      manaCost: 35,
      cooldown: 4.5,
      castRange: 5,
      // Instant heavy cone: the slam telegraphs before it lands. Widened
      // and lengthened after the v2 playtest: the old sweep felt like a
      // dagger on a champion this size. Lengthened again by the reach
      // pass: his body is 0.75 across and a victim's 0.65, so a cone of 4
      // covered barely two and a half units of open ground past contact.
      // At 5 the slam takes a scrum instead of whoever is touching him.
      windup: 0.3,
      spec: {
        kind: "cone",
        range: 5,
        halfAngle: Math.PI / 3,
        onHit: [
          { kind: "damage", base: 95, adRatio: 0.4, dtype: "physical" },
          { kind: "slow", pct: 0.3, duration: 1.5 }
        ]
      }
    },
    W: {
      // The name finally means it: a stone rampart across the aim, real
      // terrain that blocks walking and dashes for a beat.
      name: "\u94C1\u58C1",
      manaCost: 45,
      cooldown: 11,
      // Placed as far as the grip reaches (8), because wall-then-grip is
      // the combo: at 7 the stone landed short of the only spot that
      // makes the grip stun, and the two halves of one kit disagreed.
      castRange: 8,
      spec: { kind: "wall", length: 4, duration: 6 }
    },
    E: {
      // A maul slam that sends a fissure of grasping stone along the ground.
      // A target dragged into contact with terrain (map rock or his own
      // rampart) is stunned: the wall and the grip are one kit.
      name: "\u5927\u5730\u4E4B\u63E1",
      manaCost: 50,
      cooldown: 9,
      castRange: 8,
      spec: {
        kind: "skillshot",
        speed: 20,
        radius: 0.6,
        range: 8,
        onHit: [
          { kind: "damage", base: 81, adRatio: 0.3, dtype: "physical" },
          // Evaluated BEFORE the pull: gripping someone who stands against
          // terrain crushes them into it first, then drags.
          {
            kind: "conditional",
            when: { kind: "targetNearTerrain", distance: 1.1 },
            effects: [{ kind: "stun", duration: 0.75 }]
          },
          { kind: "pull", distance: 6 }
        ]
      }
    },
    R: {
      name: "\u88C2\u5730",
      manaCost: 85,
      cooldown: 67.5,
      castRange: 7,
      windup: 0.4,
      // A true leap with air time and a telegraphed landing: the epicenter
      // sends enemies airborne, the rim only slows. Aim is the skill. The
      // leap is the tank's whole engage, so it clears a ranged champion's
      // attack range with the telegraph already spent.
      spec: {
        kind: "dash",
        range: 7,
        speed: 14,
        landRadius: 3,
        onLand: [
          {
            kind: "conditional",
            when: { kind: "withinCenter", radius: 1.5 },
            effects: [
              { kind: "damage", base: 203, adRatio: 0.5, dtype: "magic" },
              { kind: "knockup", duration: 1 }
            ],
            otherwise: [
              { kind: "damage", base: 120, adRatio: 0.35, dtype: "magic" },
              { kind: "slow", pct: 0.4, duration: 1.5 }
            ]
          }
        ]
      }
    }
  }
};

// src/sim/content/champions/maera.ts
var SPRING_TIDE_RATIO = 0.35;
var SPRING_TIDE_RANGE = 6;
var MAERA = {
  id: "maera",
  name: "\u6885\u62C9, \u5524\u6F6E\u8005",
  role: "Support",
  blurb: "Sustain and wave-shaped utility: keeps the team standing.",
  passive: {
    name: "\u6625\u6F6E",
    description: "Her heals splash 35 percent of the amount onto the nearest other ally.",
    onHealGiven(ctx, self, target, amount) {
      let best = null;
      let bestD = SPRING_TIDE_RANGE;
      for (const u of ctx.units.values()) {
        if (u.kind !== "champion" || u.team !== self.team) continue;
        if (u.id === target.id || u.id === self.id || u.dead || ctx.dead.has(u.id)) continue;
        const d = hypot(u.pos.x - target.pos.x, u.pos.z - target.pos.z);
        if (d < bestD) {
          bestD = d;
          best = u;
        }
      }
      if (!best) return;
      const splash = amount * SPRING_TIDE_RATIO * healFactor(best, ctx.time);
      best.hp = Math.min(best.maxHp, best.hp + splash);
    }
  },
  base: {
    hp: 550,
    mana: 500,
    ad: 48,
    ap: 0,
    armor: 24,
    mr: 32,
    attackRange: 5.75,
    attackSpeed: 0.6,
    moveSpeed: 3.65,
    hpRegen: 1.4,
    manaRegen: 1.9,
    radius: 0.62
  },
  growth: { hp: 85, mana: 50, ad: 2.5, armor: 2.3, mr: 1.5 },
  abilities: {
    Q: {
      name: "\u6F6E\u6D8C",
      manaCost: 50,
      cooldown: 7,
      castRange: 9,
      spec: {
        kind: "skillshot",
        speed: 20,
        radius: 1,
        range: 9,
        pierce: true,
        onHit: [{ kind: "damage", base: 62, apRatio: 0.95, dtype: "magic" }],
        allyEffects: [{ kind: "heal", base: 60, apRatio: 0.4 }]
      }
    },
    W: {
      name: "\u5347\u817E\u4E4B\u6CC9",
      manaCost: 60,
      cooldown: 10,
      castRange: 8,
      // Triage made legible: allies under 40 percent health heal double.
      spec: {
        kind: "zone",
        radius: 3,
        duration: 4,
        tickEvery: 0.5,
        allyOnTick: [
          {
            kind: "conditional",
            when: { kind: "targetHpBelow", frac: 0.4 },
            effects: [{ kind: "heal", base: 36, apRatio: 0.24 }],
            otherwise: [{ kind: "heal", base: 18, apRatio: 0.12 }]
          }
        ]
      }
    },
    E: {
      name: "\u6697\u6D41",
      manaCost: 45,
      cooldown: 7,
      castRange: 8,
      spec: {
        kind: "skillshot",
        speed: 18,
        radius: 0.9,
        range: 8,
        pierce: true,
        onHit: [
          { kind: "damage", base: 44, apRatio: 0.66, dtype: "magic" },
          { kind: "slow", pct: 0.35, duration: 1.5 }
        ]
      }
    },
    R: {
      name: "\u5DE8\u6D6A",
      manaCost: 85,
      cooldown: 67.5,
      castRange: 10,
      windup: 0.5,
      // The peel ultimate: the wave sweeps enemies OFF its path (aside,
      // not airborne) and shields the allies it washes over.
      spec: {
        kind: "skillshot",
        speed: 16,
        radius: 1.6,
        range: 10,
        pierce: true,
        onHit: [
          { kind: "damage", base: 132, apRatio: 1.14, dtype: "magic" },
          { kind: "knockback", distance: 2.5, direction: "aside" }
        ],
        allyEffects: [{ kind: "shield", base: 150, apRatio: 0.5, duration: 3 }]
      }
    }
  }
};

// src/sim/content/champions/rhoka.ts
var REND_DURATION_S = 2.5;
var REND_BASE_DPS = 3;
var REND_DPS_PER_LEVEL = 0.6;
var REND_ABILITY_BONUS_PER_STACK = 0.15;
var REND_MAX_STACKS = 3;
var REND_GRIEVOUS_FACTOR = 0.25;
var REND_GRIEVOUS_REFRESH_S = 1;
var FRENZY_HEAL_BASE = 10;
var FRENZY_HEAL_AD_RATIO = 0.15;
var FRENZY_AS_PCT = 0.6;
var FRENZY_MS_PCT = 0.2;
var RHOKA = {
  id: "rhoka",
  name: "\u7F57\u5361, \u91CE\u722A",
  role: "Skirmisher",
  blurb: "A diving brawler who feeds on extended fights and bleeds targets out.",
  passive: {
    name: "\u6495\u626F",
    description: "Attacks apply a stacking short bleed. Abilities deal 15 percent more damage per bleed on the target (up to 3); three bleeds fester, cutting healing. During Apex Frenzy her attacks on bleeding targets restore health.",
    onAttackHit(ctx, self, target) {
      if (target.kind === "tower" || target.kind === "sanctum") return;
      addStatus(target, {
        kind: "dot",
        until: ctx.time + REND_DURATION_S,
        perSecond: REND_BASE_DPS + REND_DPS_PER_LEVEL * self.level,
        sourceId: self.id,
        dtype: "physical"
      });
      const bleeds = target.statuses.filter(
        (s) => s.kind === "dot" && s.sourceId === self.id && s.until > ctx.time
      ).length;
      if (bleeds >= REND_MAX_STACKS) {
        addStatus(target, {
          kind: "grievous",
          until: ctx.time + REND_GRIEVOUS_REFRESH_S,
          factor: REND_GRIEVOUS_FACTOR
        });
      }
      const frenzied = self.statuses.some(
        (s) => s.kind === "buff" && s.asPct === FRENZY_AS_PCT && s.msPct === FRENZY_MS_PCT && s.until > ctx.time
      );
      if (frenzied && bleeds > 0 && !self.dead) {
        self.hp = Math.min(
          self.maxHp,
          self.hp + FRENZY_HEAL_BASE + FRENZY_HEAL_AD_RATIO * self.stats.ad
        );
      }
    },
    // The roster's promised per-stack payoff on ability damage.
    modifyDamage(ctx, self, target, amount, _dtype, via) {
      if (via !== "ability") return amount;
      const bleeds = target.statuses.filter(
        (s) => s.kind === "dot" && s.sourceId === self.id && s.until > ctx.time
      ).length;
      return amount * (1 + REND_ABILITY_BONUS_PER_STACK * Math.min(bleeds, REND_MAX_STACKS));
    }
  },
  base: {
    hp: 600,
    mana: 320,
    ad: 60,
    ap: 0,
    armor: 27,
    mr: 30,
    attackRange: 1.8,
    attackSpeed: 0.72,
    moveSpeed: 3.8,
    hpRegen: 1.9,
    manaRegen: 1.2,
    radius: 0.66
  },
  growth: { hp: 98, mana: 32, ad: 3.8, armor: 2.4, mr: 1.6 },
  abilities: {
    Q: {
      name: "\u6251\u51FB",
      manaCost: 40,
      cooldown: 5.5,
      // Six, not five: a skirmisher who cannot re-enter after a step back
      // is a melee champion with extra steps, and every ranged body on the
      // roster attacks from 5.75 or more.
      castRange: 6,
      // Seed wounds, then pounce again and again: landing on bleeding prey
      // refunds most of the cooldown.
      spec: {
        kind: "dash",
        range: 6,
        speed: 18,
        landRadius: 2,
        onLand: [
          { kind: "damage", base: 66, adRatio: 1.14, dtype: "physical" },
          {
            kind: "conditional",
            when: { kind: "targetHasSourceDot" },
            effects: [{ kind: "cooldownRefund", key: "Q", pctOfRemaining: 0.6 }]
          }
        ]
      }
    },
    W: {
      name: "\u91CE\u86EE\u6A2A\u626B",
      manaCost: 45,
      cooldown: 6,
      castRange: 0,
      // Instant heavy burst: the sweep telegraphs before it lands. The
      // sweep is centered on him, so its radius IS its reach: at 2.4 it
      // barely cleared his own body and one enemy's.
      windup: 0.3,
      spec: {
        kind: "burst",
        radius: 3,
        effects: [{ kind: "damage", base: 79, adRatio: 1.33, dtype: "physical" }]
      }
    },
    E: {
      name: "\u539F\u59CB\u568E\u53EB",
      manaCost: 40,
      cooldown: 8.5,
      castRange: 0,
      // The howl is how he keeps prey from walking away, so it has to
      // reach past the step that leaves him.
      spec: {
        kind: "burst",
        radius: 3.6,
        effects: [{ kind: "slow", pct: 0.3, duration: 1.5 }],
        selfEffects: [{ kind: "buff", duration: 3, asPct: 0.45 }]
      }
    },
    R: {
      name: "\u5DC5\u5CF0\u72C2\u70ED",
      manaCost: 85,
      cooldown: 60,
      castRange: 0,
      // No flat heal any more: the sustain is earned per strike on bleeding
      // targets while the frenzy lasts (the passive reads this buff).
      spec: {
        kind: "self_or_ally",
        searchRadius: 0,
        effects: [{ kind: "buff", duration: 5, asPct: 0.6, msPct: 0.2 }]
      }
    }
  }
};

// src/sim/content/champions/sylra.ts
var BARBED_MARK = {
  kind: "mark",
  duration: 4,
  stacksToTrigger: 3,
  onTrigger: [
    { kind: "root", duration: 1.1 },
    { kind: "damage", base: 35, apRatio: 0.57, dtype: "magic" }
  ]
};
var SYLRA = {
  id: "sylra",
  name: "\u5E0C\u5C14\u62C9, \u8346\u68D8\u7EC7\u624B",
  role: "Mage",
  blurb: "A zone-control mage who locks areas down and punishes anyone who stays.",
  // Barbed Marks lives entirely in her ability specs (mark effects), so the
  // passive entry is descriptive only.
  passive: {
    name: "\u5012\u523A\u6807\u8BB0",
    description: "Her abilities mark enemies; the third mark on a target roots it briefly."
  },
  base: {
    hp: 570,
    mana: 480,
    ad: 52,
    ap: 0,
    armor: 22,
    mr: 30,
    attackRange: 5.9,
    attackSpeed: 0.65,
    moveSpeed: 3.6,
    hpRegen: 1.1,
    manaRegen: 1.6,
    radius: 0.65
  },
  growth: {
    hp: 96,
    mana: 40,
    ad: 3,
    armor: 2.4,
    mr: 1.3
  },
  abilities: {
    Q: {
      name: "\u8346\u68D8\u7BAD",
      manaCost: 45,
      cooldown: 5.5,
      castRange: 10.5,
      spec: {
        kind: "skillshot",
        speed: 24,
        radius: 0.7,
        range: 10.5,
        onHit: [{ kind: "damage", base: 70, apRatio: 1.23, dtype: "magic" }, BARBED_MARK],
        // The bolt jumps once to the nearest other enemy: spread out, or a
        // poked ally makes you the second victim (and the second mark).
        chain: {
          radius: 4,
          onHit: [{ kind: "damage", base: 49, apRatio: 0.86, dtype: "magic" }, BARBED_MARK]
        }
      }
    },
    W: {
      name: "\u8346\u68D8\u4E1B",
      manaCost: 60,
      cooldown: 9,
      castRange: 8.5,
      spec: {
        kind: "zone",
        radius: 3.2,
        duration: 4,
        tickEvery: 0.5,
        onEnter: [BARBED_MARK],
        onTick: [
          { kind: "damage", base: 18, apRatio: 0.19, dtype: "magic" },
          { kind: "slow", pct: 0.25, duration: 1 }
        ]
      }
    },
    E: {
      name: "\u7FE0\u7EFF\u4E4B\u58F3",
      manaCost: 50,
      cooldown: 8.5,
      castRange: 8,
      // The shell bursts thorns when it breaks or expires: shielding the
      // diver inside the enemy team is a play, not just a save.
      spec: {
        kind: "self_or_ally",
        searchRadius: 2.5,
        effects: [
          {
            kind: "shield",
            base: 70,
            apRatio: 0.6,
            duration: 2.5,
            burst: {
              radius: 2.6,
              onBreak: [{ kind: "damage", base: 55, apRatio: 0.45, dtype: "magic" }, BARBED_MARK],
              onExpire: [{ kind: "damage", base: 55, apRatio: 0.45, dtype: "magic" }, BARBED_MARK]
            }
          }
        ]
      }
    },
    R: {
      name: "\u75AF\u957F",
      manaCost: 85,
      cooldown: 60,
      castRange: 9,
      spec: {
        kind: "zone",
        radius: 4.8,
        duration: 1.3,
        detonateDelay: 1.25,
        onDetonate: [
          { kind: "damage", base: 158, apRatio: 1.33, dtype: "magic" },
          { kind: "root", duration: 1.6 },
          BARBED_MARK
        ]
      },
      // Rank 3: the detonation leaves a lingering bramble patch behind.
      atRank: [
        {
          rank: 3,
          spec: {
            kind: "zone",
            radius: 4.8,
            duration: 1.3,
            detonateDelay: 1.25,
            onDetonate: [
              { kind: "damage", base: 158, apRatio: 1.33, dtype: "magic" },
              { kind: "root", duration: 1.6 },
              BARBED_MARK
            ],
            leaveZone: {
              radius: 3.5,
              duration: 2,
              onTick: [
                { kind: "damage", base: 20, apRatio: 0.2, dtype: "magic" },
                { kind: "slow", pct: 0.4, duration: 1 }
              ]
            }
          }
        }
      ]
    }
  }
};

// src/sim/content/champions/torv.ts
var BULWARK_RANGE = 6;
var BULWARK_ARMOR = 8;
var BULWARK_DURATION_S = 0.4;
var TORV = {
  id: "torv",
  name: "\u6258\u592B, \u77F3\u89D2",
  role: "Support",
  blurb: "The one who starts the fight: engage, disruption, and a protective aura.",
  passive: {
    name: "\u58C1\u5792\u5149\u73AF",
    description: "Nearby allied champions gain 8 bonus armor.",
    onTick(ctx, self) {
      for (const u of ctx.units.values()) {
        if (u.kind !== "champion" || u.team !== self.team || u.dead || ctx.dead.has(u.id)) {
          continue;
        }
        if (hypot(u.pos.x - self.pos.x, u.pos.z - self.pos.z) > BULWARK_RANGE) continue;
        refreshBuff(u, ctx.time, BULWARK_DURATION_S, { armor: BULWARK_ARMOR });
      }
    }
  },
  base: {
    hp: 640,
    mana: 340,
    ad: 56,
    ap: 0,
    armor: 30,
    mr: 32,
    attackRange: 1.8,
    attackSpeed: 0.6,
    moveSpeed: 3.7,
    hpRegen: 2,
    manaRegen: 1.3,
    radius: 0.72
  },
  growth: { hp: 92, mana: 35, ad: 3.2, armor: 3.2, mr: 2 },
  abilities: {
    Q: {
      name: "\u7284\u89D2\u51B2\u950B",
      manaCost: 45,
      cooldown: 7.5,
      // Six, the roster's melee engage floor: the charge is Torv's only
      // way onto a ranged champion, and at 5.5 it stopped inside the
      // range he was being shot from.
      castRange: 6,
      windup: 0.25,
      // A real charge: interceptable, wall-blocked, plowing bystanders
      // aside; only whoever stands at the impact point goes airborne.
      spec: {
        kind: "dash",
        range: 6,
        speed: 13,
        passThrough: [
          { kind: "damage", base: 60, adRatio: 0.3, dtype: "physical" },
          { kind: "knockback", distance: 1.8, direction: "aside" }
        ],
        landRadius: 2,
        onLand: [
          { kind: "damage", base: 108, adRatio: 0.5, dtype: "physical" },
          { kind: "knockup", duration: 0.75 }
        ]
      }
    },
    W: {
      name: "\u6311\u6218",
      manaCost: 50,
      cooldown: 10.5,
      castRange: 0,
      // Hard CC telegraphs itself: the roar is seen before it takes hold.
      windup: 0.25,
      spec: {
        kind: "burst",
        radius: 3,
        effects: [{ kind: "taunt", duration: 1.2 }]
      }
    },
    E: {
      name: "\u9707\u5730\u8DF5\u8E0F",
      manaCost: 40,
      cooldown: 6,
      castRange: 0,
      // The stomp is a heavy instant nuke: it owes its victims a beat.
      windup: 0.3,
      // The escalation the kit teaches: a fresh target is slowed, an
      // already-impaired one is rooted. Q into E, or any ally slow into E.
      spec: {
        kind: "burst",
        radius: 3.2,
        effects: [
          { kind: "damage", base: 81, adRatio: 0.4, dtype: "magic" },
          {
            kind: "conditional",
            when: { kind: "targetSlowed" },
            effects: [{ kind: "root", duration: 0.9 }],
            otherwise: [{ kind: "slow", pct: 0.3, duration: 1.5 }]
          }
        ]
      }
    },
    R: {
      name: "\u65AD\u5C42",
      manaCost: 85,
      cooldown: 67.5,
      castRange: 9,
      // The earth answers twice: the crack stays marked along the line and
      // erupts again after a beat. Walls belong to Korrath (kits-v2: one
      // signature mechanic, one owner); Torv's signature is the echo.
      spec: {
        kind: "skillshot",
        speed: 18,
        radius: 1.2,
        range: 9,
        pierce: true,
        onHit: [
          { kind: "damage", base: 203, adRatio: 0.6, dtype: "magic" },
          { kind: "stun", duration: 1.2 }
        ],
        aftershock: {
          delay: 1.5,
          radius: 1.4,
          spacing: 2.2,
          effects: [
            { kind: "damage", base: 110, adRatio: 0.35, dtype: "magic" },
            { kind: "slow", pct: 0.45, duration: 1.5 }
          ]
        }
      }
    }
  }
};

// src/sim/content/champions/vesk.ts
var DEADSTILL_BONUS = 1.15;
var BACKSTEP_PATCH_RADIUS = 1.5;
var BACKSTEP_PATCH_DURATION_S = 1.5;
var VESK = {
  id: "vesk",
  name: "\u7EF4\u65AF\u514B, \u8FDC\u5C04",
  role: "Marksman",
  blurb: "Artillery range, immobile and terrifying: punishes anything held still.",
  passive: {
    name: "\u6B7B\u5BC2",
    description: "Attacks deal 15 percent bonus damage to slowed or immobilized targets.",
    modifyDamage(ctx, _self, target, amount, _dtype, via) {
      if (via !== "attack") return amount;
      if (slowPct(target, ctx.time) <= 0 && !isRooted(target, ctx.time)) return amount;
      return amount * DEADSTILL_BONUS;
    },
    // Backstep scatters caltrops where the vault began: kiting leaves a
    // trace that feeds Deadstill. onCast fires before the dash launches, so
    // self.pos is still the launch point.
    onCast(ctx, self, key) {
      if (key !== "E") return;
      const tickEvery = 0.5;
      const id = ctx.allocId();
      ctx.zones.set(id, {
        id,
        sourceId: self.id,
        team: self.team,
        pos: { x: self.pos.x, z: self.pos.z },
        radius: BACKSTEP_PATCH_RADIUS,
        until: ctx.time + BACKSTEP_PATCH_DURATION_S,
        tickEvery,
        nextTickAt: ctx.time + tickEvery,
        power: { ad: self.stats.ad, ap: self.stats.ap },
        onEnter: [],
        onTick: [{ kind: "slow", pct: 0.35, duration: 1 }],
        allyOnTick: [],
        detonateAt: null,
        onDetonate: [],
        entered: /* @__PURE__ */ new Set(),
        reveal: false,
        boundary: null,
        boundaryNextAt: /* @__PURE__ */ new Map(),
        insideIds: /* @__PURE__ */ new Set(),
        leaveZone: null,
        vfx: "vesk_W"
      });
    }
  },
  base: {
    hp: 540,
    mana: 300,
    ad: 60,
    ap: 0,
    armor: 22,
    mr: 30,
    attackRange: 6.2,
    attackSpeed: 0.66,
    moveSpeed: 3.55,
    hpRegen: 1.3,
    manaRegen: 1.4,
    radius: 0.6
  },
  growth: { hp: 88, mana: 32, ad: 5.5, armor: 2, mr: 1.3 },
  abilities: {
    Q: {
      name: "\u7A7F\u900F\u5F39",
      manaCost: 45,
      cooldown: 6,
      castRange: 14,
      // The marksman shoulders his rifle before the shot: a short windup
      // that telegraphs the line and lets the target step off it.
      windup: 0.3,
      // Damage grows with the distance flown: about +50 percent past 8.5.
      spec: {
        kind: "skillshot",
        speed: 30,
        radius: 0.5,
        range: 14,
        pierce: true,
        onHit: [
          { kind: "damage", base: 55, adRatio: 1.15, dtype: "physical" },
          {
            kind: "conditional",
            when: { kind: "distanceAtLeast", distance: 8.5 },
            effects: [{ kind: "damage", base: 28, adRatio: 0.57, dtype: "physical" }]
          }
        ]
      }
    },
    W: {
      name: "\u94C1\u84BA\u85DC",
      manaCost: 50,
      cooldown: 9,
      castRange: 8,
      spec: {
        kind: "zone",
        radius: 3,
        duration: 3,
        tickEvery: 0.5,
        onTick: [
          { kind: "slow", pct: 0.35, duration: 1 },
          { kind: "damage", base: 9, adRatio: 0.19, dtype: "physical" }
        ]
      }
    },
    E: {
      name: "\u540E\u64A4\u6B65",
      manaCost: 35,
      cooldown: 7.5,
      castRange: 3,
      // A real vault (caltrops land at the launch point via the passive).
      spec: {
        kind: "dash",
        range: 3,
        speed: 16,
        selfEffects: [{ kind: "buff", duration: 3, asPct: 0.5 }]
      }
    },
    R: {
      name: "\u5929\u9645\u5C04\u51FB",
      manaCost: 85,
      cooldown: 67.5,
      // Map-crossing artillery (the map is 150 across): the shot itself is
      // the fantasy, so the range covers anything Vesk can draw a line to.
      // The payoff is distance-tiered: a close shot only slows, a long one
      // stuns, the longest stuns hard. The counterplay window (windup plus
      // flight time) grows exactly as the payoff does.
      castRange: 120,
      windup: 0.6,
      spec: {
        kind: "skillshot",
        speed: 40,
        radius: 0.9,
        range: 120,
        onHit: [
          {
            kind: "conditional",
            when: { kind: "distanceAtLeast", distance: 80 },
            effects: [
              { kind: "damage", base: 220, adRatio: 1.9, dtype: "physical" },
              { kind: "stun", duration: 1.5 }
            ],
            otherwise: [
              {
                kind: "conditional",
                when: { kind: "distanceAtLeast", distance: 30 },
                effects: [
                  { kind: "damage", base: 220, adRatio: 1.9, dtype: "physical" },
                  { kind: "stun", duration: 0.75 }
                ],
                otherwise: [
                  { kind: "damage", base: 180, adRatio: 1.4, dtype: "physical" },
                  { kind: "slow", pct: 0.5, duration: 2 }
                ]
              }
            ]
          }
        ]
      }
    }
  }
};

// src/sim/content/champions/index.ts
var HOME_LANES = {
  Tank: "top",
  Fighter: "top",
  Mage: "mid",
  Battlemage: "mid",
  Assassin: "mid",
  Marksman: "bot",
  Support: "bot",
  Skirmisher: null
};
function homeLane(role) {
  return role ? HOME_LANES[role] : null;
}
var ROLE_DAMAGE = {
  Tank: "physical",
  Fighter: "physical",
  Mage: "magic",
  Battlemage: "magic",
  Assassin: "physical",
  Marksman: "physical",
  Support: "mixed",
  Skirmisher: "physical"
};
var ALL = [
  KORRATH,
  DAIN,
  SYLRA,
  FENN,
  ELOWEN,
  VESK,
  ASHVYN,
  MAERA,
  TORV,
  RHOKA
];
var CHAMPIONS = Object.fromEntries(
  ALL.map((c) => [c.id, c])
);
var CHAMPION_LIST = ALL;
var STARTER_CHAMPION_IDS = [KORRATH.id, DAIN.id, SYLRA.id, ASHVYN.id, MAERA.id];
var STARTER_CHAMPION_LIST = STARTER_CHAMPION_IDS.map(
  (id) => CHAMPIONS[id]
);
var DEFAULT_CHAMPION_ID = SYLRA.id;

// src/sim/fill.ts
var TEAM_SIZE = 5;
var SEATS = ["mid", "top", "carry", "support", "jungle"];
var ELIGIBLE = {
  mid: ["Mage", "Assassin", "Battlemage", "Skirmisher"],
  top: ["Tank", "Fighter", "Skirmisher"],
  carry: ["Marksman"],
  support: ["Support"],
  jungle: ["Fighter", "Tank", "Skirmisher", "Assassin"]
};
var FLEX = "Skirmisher";
function roleOf(seat) {
  return seat.role ?? CHAMPIONS[seat.championId]?.role ?? null;
}
function fillSeats(held2, rng, size = TEAM_SIZE, pool = CHAMPION_LIST) {
  const open2 = SEATS.slice(0, size);
  const used = new Set(held2.map((h) => h.championId));
  const consume = (kind) => {
    if (kind === void 0) return;
    open2.splice(open2.indexOf(kind), 1);
  };
  const later = [];
  for (const seat of held2) {
    const role = roleOf(seat);
    const own = role !== null && role !== FLEX ? open2.find((k) => ELIGIBLE[k].includes(role)) : void 0;
    if (own !== void 0) consume(own);
    else later.push(seat);
  }
  for (const seat of later) {
    const role = roleOf(seat);
    const fit = role !== null ? open2.find((k) => ELIGIBLE[k].includes(role)) : void 0;
    consume(fit ?? open2[0]);
  }
  const out = [];
  for (const kind of open2) {
    const unused = pool.filter((c) => !used.has(c.id));
    const eligible = unused.filter((c) => ELIGIBLE[kind].includes(c.role));
    const choices = eligible.length > 0 ? eligible : unused;
    if (choices.length === 0) break;
    const pick2 = choices[rng.int(choices.length)];
    used.add(pick2.id);
    out.push({ championId: pick2.id, kind });
  }
  return out;
}

// src/sim/content/map.ts
var SIZE = 150;
function mirrorPoint(x, z) {
  return { x: SIZE - x, z: SIZE - z };
}
function flipLane(lane) {
  if (lane === "top") return "bot";
  if (lane === "bot") return "top";
  return lane;
}
var RIVER = { a: { x: 15, z: 135 }, b: mirrorPoint(15, 135), width: 9 };
function segDist(px, pz, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz;
  const t0 = len2 > 0 ? ((px - a.x) * abx + (pz - a.z) * abz) / len2 : 0;
  const t = t0 < 0 ? 0 : t0 > 1 ? 1 : t0;
  return hypot(px - a.x - abx * t, pz - a.z - abz * t);
}
var TEAM0_TOWERS = [
  { team: 0, lane: "mid", tier: 1, x: 57, z: 57 },
  { team: 0, lane: "mid", tier: 2, x: 36, z: 36 },
  { team: 0, lane: "top", tier: 1, x: 13, z: 100 },
  { team: 0, lane: "top", tier: 2, x: 13, z: 55 },
  { team: 0, lane: "bot", tier: 1, x: 100, z: 13 },
  { team: 0, lane: "bot", tier: 2, x: 55, z: 13 },
  { team: 0, lane: "sanctum", tier: 1, x: 17, z: 21 },
  { team: 0, lane: "sanctum", tier: 2, x: 21, z: 17 }
];
var NW_WALLS = [
  { x: 32, z: 55, r: 7 },
  { x: 50, z: 70, r: 8 },
  { x: 30, z: 85, r: 8 },
  { x: 52, z: 98, r: 7 },
  { x: 38, z: 115, r: 7 },
  { x: 65, z: 90, r: 6 },
  { x: 28, z: 68, r: 6 },
  { x: 55, z: 32, r: 7 },
  { x: 70, z: 50, r: 8 },
  { x: 85, z: 30, r: 8 },
  { x: 68, z: 28, r: 6 },
  // The mid choke: two small blobs flanking the outer mid tower, close
  // enough along the lane that the tower's reach overlaps them. Past this
  // pinch there is no way down the diagonal except through the tower.
  { x: 48, z: 62, r: 5 },
  { x: 62, z: 48, r: 5 },
  // The side-lane chokes: the outer tower's reach stopped short of both the
  // map border and the jungle, so you could simply walk around it. These
  // close the two strips it cannot cover.
  { x: 3, z: 91, r: 6 },
  { x: 21, z: 91, r: 5 },
  { x: 91, z: 3, r: 6 },
  { x: 91, z: 21, r: 5 },
  // And the pocket walls that stop the jungle from being a through-road
  // from the river into the base. The paths through it stay open, but they
  // are paths now, not an open field.
  { x: 40, z: 64, r: 6 },
  { x: 64, z: 40, r: 6 },
  { x: 48, z: 84, r: 8 },
  { x: 84, z: 48, r: 8 }
];
var ON_THE_WATER = 0.5;
var SPLIT_RADIUS = Math.SQRT1_2;
function bankOffRiver(w) {
  const need = w.r + RIVER.width / 2;
  if (segDist(w.x, w.z, RIVER.a, RIVER.b) >= need) return [w];
  const signed = (w.x + w.z - SIZE) / Math.SQRT2;
  const bank = (side2, r = w.r) => {
    const push2 = (side2 * (r + RIVER.width / 2) - signed) / Math.SQRT2;
    return { x: w.x + push2, z: w.z + push2, r };
  };
  if (Math.abs(signed) > ON_THE_WATER) return [bank(signed > 0 ? 1 : -1)];
  const half = w.r * SPLIT_RADIUS;
  return [bank(-1, half), bank(1, half)];
}
var NW_BANKED_WALLS = NW_WALLS.flatMap(bankOffRiver);
var NW_CAMPS = [
  // Moved out of the mid corridor in round 3: the buff camp sat exactly
  // where the pocket wall had to go. It now sits deeper in the pocket, a
  // cul-de-sac off the top lane rather than a stop on a through-road.
  { x: 38, z: 76, kind: "barkmaw" },
  { x: 40, z: 100, kind: "spinecrest" },
  // Was at 58,108: that is where the river's own bank wall has to stand once
  // the water is a road, so the camp sits one bay deeper in the pocket.
  { x: 52, z: 112, kind: "brackenlings" }
];
var NW_BRUSH = [
  { x: 22, z: 45, r: 3 },
  // Was at 40,90: opening the river slid the blob above it onto that spot.
  // Same pocket, same job, one bay further up the bank.
  { x: 34, z: 106, r: 3 },
  { x: 24, z: 105, r: 3 },
  { x: 58, z: 80, r: 3 },
  { x: 70, z: 82, r: 3 }
];
var TOP_LANE = [
  { x: 17, z: 23 },
  { x: 13, z: 27 },
  { x: 13, z: 128 },
  { x: 22, z: 137 },
  { x: 123, z: 137 },
  { x: 127, z: 133 }
];
var GAME_MAP = {
  size: SIZE,
  borderMargin: 2,
  laneWidth: 8,
  river: RIVER,
  fountains: [
    { team: 0, x: 7, z: 7, r: 4 },
    { team: 1, x: SIZE - 7, z: SIZE - 7, r: 4 }
  ],
  sanctums: [
    { team: 0, x: 15, z: 15 },
    { team: 1, x: SIZE - 15, z: SIZE - 15 }
  ],
  towers: [
    ...TEAM0_TOWERS,
    ...TEAM0_TOWERS.map(
      (t) => ({
        team: 1,
        lane: flipLane(t.lane),
        tier: t.tier,
        ...mirrorPoint(t.x, t.z)
      })
    )
  ],
  // No polyline VERTEX may coincide with a tower spot: a tower footprint
  // makes the cells around it unwalkable and minions could never "reach"
  // such a waypoint (review finding F.0). tests/map.test.ts pins this.
  lanes: {
    top: TOP_LANE,
    mid: [
      { x: 19, z: 19 },
      { x: 45, z: 45 },
      { x: 75, z: 75 },
      { x: 105, z: 105 },
      { x: 131, z: 131 }
    ],
    bot: [...TOP_LANE].map((p) => mirrorPoint(p.x, p.z)).reverse()
  },
  walls: [
    ...NW_BANKED_WALLS,
    ...NW_BANKED_WALLS.map((w) => ({ ...mirrorPoint(w.x, w.z), r: w.r }))
  ],
  brush: [...NW_BRUSH, ...NW_BRUSH.map((b) => ({ ...mirrorPoint(b.x, b.z), r: b.r }))],
  // On the river diagonal (x + z = SIZE), clear of the jungle walls, and
  // point-symmetric so neither team owns the pit.
  wardenPits: [
    { x: 58, z: 92, name: "west pit" },
    { ...mirrorPoint(58, 92), name: "east pit" }
  ],
  camps: [...NW_CAMPS, ...NW_CAMPS.map((c) => ({ ...mirrorPoint(c.x, c.z), kind: c.kind }))]
};

// src/sim/content/camps.ts
var CAMPS = {
  // A squat prowler with a ridge of thorns down its back: the plain camp,
  // one body, the first a jungler clears.
  spinecrest: {
    id: "spinecrest",
    name: "Spinecrest",
    count: 1,
    body: {
      hp: 600,
      ad: 38,
      bitePct: 0,
      armor: 15,
      mr: 15,
      attackRange: 1.5,
      attackSpeed: 0.6,
      moveSpeed: 2.8,
      radius: 0.7,
      xpBounty: 110
    },
    goldBounty: 85,
    respawnS: 90,
    buff: false
  },
  // A pack of three small fern-crested skitterers: quick, frail, and paid
  // per body, so the clear splits between whoever is there.
  brackenlings: {
    id: "brackenlings",
    name: "Brackenlings",
    count: 3,
    body: {
      hp: 210,
      ad: 13,
      bitePct: 0,
      armor: 8,
      mr: 8,
      attackRange: 1.2,
      attackSpeed: 0.8,
      moveSpeed: 3.2,
      radius: 0.45,
      xpBounty: 40
    },
    goldBounty: 32,
    respawnS: 90,
    buff: false
  },
  // The forest's brute, bark-hided with a wide maw: the buff camp, at the
  // far end of each forest, slower to come back.
  barkmaw: {
    id: "barkmaw",
    name: "Barkmaw",
    count: 1,
    body: {
      hp: 900,
      ad: 45,
      bitePct: 0,
      armor: 20,
      mr: 20,
      attackRange: 1.8,
      attackSpeed: 0.55,
      moveSpeed: 2.6,
      radius: 1,
      xpBounty: 170
    },
    goldBounty: 130,
    respawnS: 120,
    buff: true
  }
};
var CAMP_FIRST_SPAWN_S = 30;
var CAMP_BUFF_AS_PCT = 0.15;
var CAMP_BUFF_DURATION_S = 90;
var CAMP_ROUND = ["spinecrest", "brackenlings", "barkmaw"];
var CAMPS_CONTENT = {
  camps: CAMPS,
  firstSpawnS: CAMP_FIRST_SPAWN_S,
  buffAsPct: CAMP_BUFF_AS_PCT,
  buffDurationS: CAMP_BUFF_DURATION_S,
  round: CAMP_ROUND
};

// src/sim/content/items.ts
var T1 = [
  { id: "iron_blade", name: "\u94C1\u5203", cost: 350, tier: 1, stats: { ad: 10 } },
  { id: "spark_rod", name: "\u7535\u5149\u6756", cost: 435, tier: 1, stats: { ap: 20 } },
  { id: "guard_plate", name: "\u62A4\u536B\u677F\u7532", cost: 300, tier: 1, stats: { armor: 15 } },
  { id: "null_cloak", name: "\u865A\u7A7A\u6597\u7BF7", cost: 450, tier: 1, stats: { mr: 15 } },
  { id: "heart_gem", name: "\u751F\u547D\u5B9D\u77F3", cost: 400, tier: 1, stats: { hp: 150 } },
  { id: "mind_gem", name: "\u6CD5\u529B\u5B9D\u77F3", cost: 350, tier: 1, stats: { mana: 200 } },
  { id: "swift_fang", name: "\u8FC5\u6377\u4E4B\u7259", cost: 300, tier: 1, stats: { attackSpeedPct: 0.12 } },
  { id: "traveler_soles", name: "\u65C5\u8005\u8349\u978B", cost: 300, tier: 1, stats: { moveSpeed: 0.25 } }
];
var T2 = [
  {
    id: "warbrand",
    name: "\u6218\u75D5\u5DE8\u5203",
    cost: 1300,
    tier: 2,
    stats: { ad: 56 },
    buildsFrom: ["iron_blade", "iron_blade"]
  },
  {
    id: "storm_staff",
    name: "\u98CE\u66B4\u6CD5\u6756",
    cost: 1600,
    tier: 2,
    stats: { ap: 105 },
    buildsFrom: ["spark_rod", "spark_rod"]
  },
  {
    id: "sunder_axe",
    name: "\u7834\u7532\u65A7",
    cost: 1350,
    tier: 2,
    stats: { ad: 30, armorPenPct: 0.35 },
    buildsFrom: ["iron_blade", "traveler_soles"]
  },
  {
    id: "void_crystal",
    name: "\u865A\u7A7A\u6C34\u6676",
    cost: 1450,
    tier: 2,
    stats: { ap: 50, mrPenPct: 0.35 },
    buildsFrom: ["spark_rod", "null_cloak"]
  },
  {
    id: "stone_bulwark",
    name: "\u78D0\u77F3\u58C1\u5792",
    cost: 1300,
    tier: 2,
    stats: { armor: 20, hp: 180 },
    buildsFrom: ["guard_plate", "heart_gem"]
  },
  {
    id: "spirit_ward",
    name: "\u7075\u9B42\u5B88\u536B",
    cost: 1400,
    tier: 2,
    stats: { mr: 20, hp: 180 },
    buildsFrom: ["null_cloak", "heart_gem"]
  },
  {
    id: "colossus_heart",
    name: "\u5DE8\u50CF\u4E4B\u5FC3",
    cost: 1400,
    tier: 2,
    stats: { hp: 350 },
    buildsFrom: ["heart_gem", "heart_gem"]
  },
  {
    id: "archmind",
    name: "\u81F3\u9AD8\u5FC3\u667A",
    cost: 1300,
    tier: 2,
    stats: { ap: 60, mana: 300 },
    buildsFrom: ["mind_gem", "spark_rod"]
  },
  {
    id: "windrazor",
    name: "\u98CE\u4E4B\u5243\u5200",
    cost: 1150,
    tier: 2,
    stats: { ad: 35, attackSpeedPct: 0.35 },
    buildsFrom: ["swift_fang", "iron_blade"]
  },
  {
    id: "titan_cleaver",
    name: "\u6CF0\u5766\u5288\u5200",
    cost: 1250,
    tier: 2,
    stats: { ad: 35, hp: 200 },
    buildsFrom: ["iron_blade", "heart_gem"]
  },
  {
    id: "runeblade",
    name: "\u7B26\u6587\u4E4B\u5203",
    cost: 1300,
    tier: 2,
    stats: { ad: 28, ap: 42 },
    buildsFrom: ["iron_blade", "spark_rod"]
  },
  {
    id: "swiftplate",
    name: "\u8FC5\u6377\u677F\u7532",
    cost: 1050,
    tier: 2,
    stats: { armor: 25, attackSpeedPct: 0.2 },
    buildsFrom: ["guard_plate", "swift_fang"]
  },
  {
    id: "clarity_stone",
    name: "\u6E05\u660E\u77F3",
    cost: 1250,
    tier: 2,
    stats: { mr: 20, mana: 250 },
    buildsFrom: ["mind_gem", "null_cloak"]
  },
  {
    id: "swift_treads",
    name: "\u75BE\u884C\u80EB\u7532",
    cost: 900,
    tier: 2,
    stats: { moveSpeed: 0.55 },
    buildsFrom: ["traveler_soles", "traveler_soles"]
  }
];
var T3 = [
  {
    id: "doombrand",
    name: "\u672B\u65E5\u70D9\u5370",
    cost: 2900,
    tier: 3,
    stats: { ad: 95 },
    buildsFrom: ["warbrand", "iron_blade"]
  },
  {
    id: "tempest_core",
    name: "\u98CE\u66B4\u6838\u5FC3",
    cost: 3200,
    tier: 3,
    stats: { ap: 175 },
    buildsFrom: ["storm_staff", "spark_rod"]
  },
  {
    id: "rendfang",
    name: "\u6495\u88C2\u4E4B\u7259",
    cost: 2900,
    tier: 3,
    stats: { ad: 55, armorPenPct: 0.45 },
    buildsFrom: ["sunder_axe", "iron_blade"]
  },
  {
    id: "null_engine",
    name: "\u865A\u7A7A\u5F15\u64CE",
    cost: 3e3,
    tier: 3,
    stats: { ap: 90, mrPenPct: 0.45 },
    buildsFrom: ["void_crystal", "spark_rod"]
  },
  {
    id: "skyshear",
    name: "\u88C2\u7A7A\u8005",
    cost: 2800,
    tier: 3,
    stats: { ad: 60, attackSpeedPct: 0.55, moveSpeed: 0.35 },
    buildsFrom: ["windrazor", "swift_fang"]
  },
  {
    id: "worldheart",
    name: "\u4E16\u754C\u4E4B\u5FC3",
    cost: 3e3,
    tier: 3,
    stats: { hp: 650, armor: 25, mr: 25 },
    buildsFrom: ["colossus_heart", "guard_plate"]
  }
];
var ITEMS = Object.fromEntries(
  [...T1, ...T2, ...T3].map((i) => [i.id, i])
);
function effectiveItemCost(itemId, owned2) {
  const def = ITEMS[itemId];
  if (!def) return Number.POSITIVE_INFINITY;
  let discount = 0;
  const consumed = [];
  for (const compId of def.buildsFrom ?? []) {
    const idx = owned2.findIndex((it, i) => it === compId && !consumed.includes(i));
    if (idx !== -1) {
      consumed.push(idx);
      discount += ITEMS[compId]?.cost ?? 0;
    }
  }
  return def.cost - discount;
}
var ITEM_LIST = [...T1, ...T2, ...T3];

// src/sim/playbook/odds.ts
var ODDS_RADIUS = 20;
var LEVEL_WEIGHT = 1 / 17;
function strengthOf(hpFrac, level) {
  return Math.max(0, hpFrac) * (1 + (Math.max(1, level ?? 1) - 1) * LEVEL_WEIGHT);
}
function fightOdds(ctx, within2 = ODDS_RADIUS) {
  const { s, obs } = ctx;
  let own = strengthOf(s.hpFrac, s.level);
  let enemy = 0;
  for (const u of obs.units) {
    if (u.kind !== "champion") continue;
    if (hypot(u.x - s.x, u.z - s.z) > within2) continue;
    if (u.friendly) own += strengthOf(u.hpFrac, u.level);
    else enemy += strengthOf(u.hpFrac, u.level);
  }
  const total = own + enemy;
  return total > 0 ? own / total : 0.5;
}

// src/sim/playbook/triggers.ts
function within(value, below, atLeast) {
  return (below === void 0 || value < below) && (atLeast === void 0 || value >= atLeast);
}
function countWithin(count3, atLeast, atMost) {
  return (atLeast === void 0 || count3 >= atLeast) && (atMost === void 0 || count3 <= atMost);
}
function seatsOf(ctx, side2) {
  const team2 = ctx.s.team;
  return (ctx.obs.seats ?? []).filter((seat) => seat.team === team2 === (side2 === "own"));
}
function holds(t, ctx) {
  const { s, obs } = ctx;
  switch (t.kind) {
    case "always":
      return true;
    case "hp":
      return within(s.hpFrac, t.below, t.atLeast);
    case "mana":
      return within(s.maxMana > 0 ? s.mana / s.maxMana : 1, t.below, t.atLeast);
    case "level":
      return within(s.level, t.below, t.atLeast);
    case "gold":
      return within(s.gold, t.below, t.atLeast);
    case "time":
      return within(obs.time, t.below, t.atLeast);
    case "enemies": {
      const n = ctx.enemyChampions.filter((u) => hypot(u.x - s.x, u.z - s.z) <= t.within).length;
      return countWithin(n, t.atLeast, t.atMost);
    }
    case "allies": {
      const n = obs.units.filter(
        (u) => u.friendly && u.kind === "champion" && hypot(u.x - s.x, u.z - s.z) <= t.within
      ).length;
      return countWithin(n, t.atLeast, t.atMost);
    }
    case "numbers": {
      const allies = obs.units.filter(
        (u) => u.friendly && u.kind === "champion" && hypot(u.x - s.x, u.z - s.z) <= t.within
      ).length;
      const enemies = ctx.enemyChampions.filter(
        (u) => hypot(u.x - s.x, u.z - s.z) <= t.within
      ).length;
      return countWithin(allies + 1 - enemies, t.atLeast, t.atMost);
    }
    case "odds":
      return within(fightOdds(ctx, t.within ?? ODDS_RADIUS), t.below, t.atLeast);
    case "minions": {
      const own = t.side === "own";
      const n = obs.units.filter(
        (u) => u.kind === "minion" && u.friendly === own && hypot(u.x - s.x, u.z - s.z) <= t.within
      ).length;
      return countWithin(n, t.atLeast, t.atMost);
    }
    case "towerThreatened":
      return ctx.threatenedTowers(t.within ?? 200).length > 0;
    case "enemyVisible":
      return ctx.champ !== null;
    case "atFountain":
      return ctx.atFountain;
    case "underTower":
      return ctx.inTowerReach(s.x, s.z);
    case "warden": {
      const live = ctx.enemies.find((u) => u.kind === "warden");
      if (t.state === "up") return live !== void 0 && bodyMeans(ctx, live, t.hpAtMost, t.near);
      const up = live !== void 0;
      if (t.state === "down") return !up;
      if (up || obs.objectiveSpawnAt == null) return false;
      const until = obs.objectiveSpawnAt - obs.time;
      return until >= 0 && until <= (t.within ?? 20);
    }
    case "creature": {
      const clocks = (obs.creatures ?? []).filter((c) => clockMeans(c, t.which));
      const up = clocks.some((c) => c.unitId !== null);
      if (t.state === "up") {
        if (t.hpAtMost === void 0 && t.near === void 0) return up;
        return clocks.some((c) => {
          const live = c.unitId === null ? void 0 : ctx.enemies.find((u) => u.id === c.unitId);
          return live !== void 0 && bodyMeans(ctx, live, t.hpAtMost, t.near);
        });
      }
      if (t.state === "down") return !up;
      return clocks.some(
        (c) => c.riseAt !== null && c.riseAt - obs.time >= 0 && c.riseAt - obs.time <= (t.within ?? 20)
      );
    }
    case "abilityReady":
      return s.abilityReady[t.key] === true;
    case "sigilReady":
      return s.sigils.some((id, i) => id === t.id && s.sigilReady[i] === true);
    case "lane":
      return t.is === "jungle" ? s.lane === null : s.lane === t.is;
    case "allyFighting":
      return ctx.engagedAllies(t.within).length > 0;
    case "order": {
      const order = s.coachOrder ?? null;
      return order !== null && (t.is === void 0 || order.kind === t.is);
    }
    case "champion":
      return seatsOf(ctx, t.side).some((seat) => seat.championId === t.is);
    case "roles":
      return countWithin(
        seatsOf(ctx, t.side).filter((seat) => seat.role === t.role).length,
        t.atLeast,
        t.atMost
      );
    case "enemyDamage": {
      const enemy = seatsOf(ctx, "enemy");
      const magic = enemy.filter((seat) => ROLE_DAMAGE[seat.role] === "magic").length;
      const physical = enemy.filter((seat) => ROLE_DAMAGE[seat.role] === "physical").length;
      return t.mostly === "magic" ? magic > physical : physical > magic;
    }
    case "enemyItem":
      return obs.units.some(
        (u) => !u.friendly && u.kind === "champion" && (u.items ?? []).includes(t.item)
      );
    case "laneOpponent": {
      if (s.lane === null) return false;
      const id = obs.laneOpponents?.[s.lane] ?? null;
      if (id === null) return false;
      return (obs.seats ?? []).some((seat) => seat.id === id && seat.championId === t.is);
    }
    case "lanePartner":
      return s.lane !== null && seatsOf(ctx, "own").some(
        (seat) => seat.id !== s.id && seat.lane === s.lane && seat.championId === t.is
      );
    case "not":
      return !holds(t.of, ctx);
    case "all":
      return t.of.every((sub) => holds(sub, ctx));
    case "any":
      return t.of.some((sub) => holds(sub, ctx));
  }
}
function bodyMeans(ctx, body, hpAtMost, near) {
  if (hpAtMost !== void 0 && body.hpFrac > hpAtMost) return false;
  if (near !== void 0 && hypot(body.x - ctx.s.x, body.z - ctx.s.z) > near) return false;
  return true;
}
function clockMeans(c, which) {
  if (which === void 0 || which === "any") return true;
  if (which === "ascendant") return c.ascendant;
  return c.creature === which;
}

// src/sim/playbook/kit.ts
var BAG_SLOTS = 6;
var SELL_REFUND = 0.7;
var DEFAULT_SKILLS = ["Q", "W", "E"];
var MAX_BUILD = 12;
var DAMAGE_BUILD = [
  "warbrand",
  "sunder_axe",
  "windrazor",
  "heart_gem",
  "doombrand",
  "skyshear",
  "rendfang",
  "colossus_heart",
  "swift_treads"
];
var MAGIC_BUILD = [
  "storm_staff",
  "void_crystal",
  "archmind",
  "heart_gem",
  "tempest_core",
  "null_engine",
  "colossus_heart",
  "spirit_ward",
  "swift_treads"
];
var SHELL_BUILD = [
  "colossus_heart",
  "stone_bulwark",
  "spirit_ward",
  "worldheart",
  "titan_cleaver",
  "swiftplate",
  "swift_treads"
];
var BUILD_BY_ROLE = {
  Marksman: DAMAGE_BUILD,
  Assassin: DAMAGE_BUILD,
  Skirmisher: DAMAGE_BUILD,
  Mage: MAGIC_BUILD,
  Battlemage: MAGIC_BUILD,
  Tank: SHELL_BUILD,
  Fighter: SHELL_BUILD,
  Support: SHELL_BUILD
};
function roleBuild(championId) {
  const role = championId ? CHAMPIONS[championId]?.role : void 0;
  return role ? BUILD_BY_ROLE[role] : SHELL_BUILD;
}
function resolveKit(kit2, championId, ctx) {
  let build2 = kit2?.build;
  let skills2 = kit2?.skills;
  let variant = null;
  const variants = kit2?.variants ?? [];
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    if (!holds(v.when, ctx)) continue;
    if (v.build) build2 = v.build;
    if (v.skills) skills2 = v.skills;
    variant = i;
    break;
  }
  return {
    build: build2 && build2.length > 0 ? build2 : roleBuild(championId),
    skills: skills2 && skills2.length === 3 ? skills2 : DEFAULT_SKILLS,
    variant
  };
}
function closure(id, into = /* @__PURE__ */ new Map()) {
  into.set(id, (into.get(id) ?? 0) + 1);
  for (const c of ITEMS[id]?.buildsFrom ?? []) closure(c, into);
  return into;
}
function ownedCount(bag, target) {
  let n = 0;
  for (const b of bag) n += closure(b).get(target) ?? 0;
  return n;
}
function unsatisfied(build2, bag) {
  const seen2 = /* @__PURE__ */ new Map();
  const out = [];
  for (const t of build2) {
    if (ITEMS[t] === void 0) continue;
    const k = (seen2.get(t) ?? 0) + 1;
    seen2.set(t, k);
    if (ownedCount(bag, t) < k) out.push(t);
  }
  return out;
}
function stepToward(target, bag, direct) {
  const used = [];
  for (const c of ITEMS[target]?.buildsFrom ?? []) {
    const idx = bag.findIndex((b, i) => b === c && !used.includes(i));
    if (idx !== -1) {
      used.push(idx);
      continue;
    }
    if (!direct) return stepToward(c, bag, false);
  }
  return { id: target, consumes: used.length };
}
function remainingCost(target, bag) {
  const held2 = [];
  const owned2 = (id) => {
    let value = 0;
    for (const c of ITEMS[id]?.buildsFrom ?? []) {
      const idx = bag.findIndex((b, i) => b === c && !held2.includes(i));
      if (idx !== -1) {
        held2.push(idx);
        value += ITEMS[c]?.cost ?? 0;
      } else value += owned2(c);
    }
    return value;
  };
  return Math.max(0, (ITEMS[target]?.cost ?? 0) - owned2(target));
}
function unwantedSlots(build2, bag) {
  const need = /* @__PURE__ */ new Map();
  const held2 = [];
  for (const t of unsatisfied(build2, bag)) {
    for (const c of ITEMS[t]?.buildsFrom ?? []) {
      const idx = bag.findIndex((b, i) => b === c && !held2.includes(i));
      if (idx !== -1) {
        held2.push(idx);
        continue;
      }
      for (const [id, n] of closure(c)) need.set(id, (need.get(id) ?? 0) + n);
    }
  }
  const want = /* @__PURE__ */ new Map();
  for (const t of build2) want.set(t, (want.get(t) ?? 0) + 1);
  const out = [];
  bag.forEach((b, i) => {
    if (held2.includes(i)) return;
    let wanted = false;
    for (const [id, n2] of closure(b)) {
      const w = want.get(id) ?? 0;
      if (w <= 0) continue;
      want.set(id, w - Math.min(w, n2));
      wanted = true;
    }
    if (wanted) return;
    const n = need.get(b) ?? 0;
    if (n > 0) {
      need.set(b, n - 1);
      return;
    }
    out.push(i);
  });
  return out;
}
function cheapestSlot(bag, among) {
  let best = among[0];
  for (const i of among) {
    if ((ITEMS[bag[i]]?.cost ?? 0) < (ITEMS[bag[best]]?.cost ?? 0)) best = i;
  }
  return best;
}
function nextKitStep(build2, bag, gold) {
  const unsat = unsatisfied(build2, bag);
  if (unsat.length === 0) return null;
  const free = BAG_SLOTS - bag.length;
  let target = unsat[0];
  if (free <= 1) {
    let best = null;
    for (const t of unsat) {
      if (remainingCost(t, bag) > gold) continue;
      if (best === null || (ITEMS[t]?.cost ?? 0) > (ITEMS[best]?.cost ?? 0)) best = t;
    }
    if (best !== null) target = best;
  }
  const step = stepToward(target, bag, free <= 0);
  const needsSlot = step.consumes === 0;
  if (!needsSlot || free > 0) {
    return gold >= effectiveItemCost(step.id, bag) ? { kind: "buy", itemId: step.id } : null;
  }
  const unwanted = unwantedSlots(build2, bag);
  if (unwanted.length > 0) return { kind: "sell", slot: cheapestSlot(bag, unwanted) };
  const cheapest = cheapestSlot(
    bag,
    bag.map((_, i) => i)
  );
  const cheapestCost = ITEMS[bag[cheapest]]?.cost ?? 0;
  if ((ITEMS[target]?.cost ?? 0) > cheapestCost && gold + Math.floor(cheapestCost * SELL_REFUND) >= remainingCost(target, bag)) {
    return { kind: "sell", slot: cheapest };
  }
  return null;
}

// src/sim/content/bots/hints.ts
var DEFAULT_HINTS = {
  keys: { Q: "poke", W: "poke", E: "poke" },
  ult: { minEnemies: 2, radius: 5 }
};
var BOT_HINTS = {
  korrath: {
    keys: { Q: "poke", W: "wall", E: "poke" },
    ult: { minEnemies: 2, radius: 4 }
  },
  dain: {
    keys: { Q: "engage", W: "steroid", E: "steroid" },
    ult: { minEnemies: 2, radius: 4, targetHpBelow: 0.45 }
  },
  sylra: {
    keys: { Q: "poke", W: "poke", E: "steroid" },
    ult: { minEnemies: 2, radius: 5 }
  },
  fenn: {
    keys: { Q: "engage", W: "poke", E: "escape" },
    ult: { targetHpBelow: 0.55 },
    recastHomeBelow: 0.4
  },
  elowen: {
    keys: { Q: "poke", W: "poke", E: "escape" },
    ult: { minEnemies: 2, radius: 6 }
  },
  vesk: {
    keys: { Q: "poke", W: "poke", E: "escape" },
    minRange: { Q: 6, R: 25 },
    ult: { targetHpBelow: 0.5 }
  },
  ashvyn: {
    keys: { Q: "poke", W: "steroid", E: "poke" },
    // Six, which is where Pinning Arrow starts rooting instead of slowing.
    // This number is the champion's own conditional, not a taste: the reach
    // pass moved the arrow to 10 and the threshold with it, and a bot that
    // fired at 5.4 would be spending the pin for a slow.
    minRange: { E: 6 },
    ult: { minEnemies: 2, radius: 5.2 }
  },
  maera: {
    keys: { Q: "poke", W: "heal", E: "poke" },
    ult: { minEnemies: 2, radius: 6 }
  },
  torv: {
    keys: { Q: "engage", W: "poke", E: "poke" },
    ult: { minEnemies: 2, radius: 5 }
  },
  rhoka: {
    keys: { Q: "engage", W: "poke", E: "steroid" },
    ult: { minEnemies: 1, radius: 4 }
  }
};
function hintsFor(championId) {
  return championId && BOT_HINTS[championId] || DEFAULT_HINTS;
}

// src/sim/types.ts
var TICK_RATE = 20;
var DT = 1 / TICK_RATE;

// src/sim/fountain.ts
var FOUNTAIN_HP_FRAC_PER_S = 0.09;
var FOUNTAIN_MANA_FRAC_PER_S = 0.12;
var FOUNTAIN_PAD = 2;
var FOUNTAIN_TRUE_DPS = 220;
function onPad(pad, pos) {
  return hypot(pos.x - pad.x, pos.z - pad.z) <= pad.r + FOUNTAIN_PAD;
}
function onFountain(fountain, pos) {
  return onPad(fountain, pos) || (fountain.pads ?? []).some((pad) => onPad(pad, pos));
}
function withinFountain(map, team2, pos) {
  const fountain = map.fountains.find((f) => f.team === team2);
  return fountain !== void 0 && onFountain(fountain, pos);
}
function applyFountainRegen(ctx, map) {
  for (const u of ctx.units.values()) {
    if (u.dead || ctx.dead.has(u.id)) continue;
    for (const fountain of map.fountains) {
      if (fountain.team === u.team) {
        if (u.kind !== "champion" || !onFountain(fountain, u.pos)) continue;
        u.hp = Math.min(u.maxHp, u.hp + u.maxHp * FOUNTAIN_HP_FRAC_PER_S * DT);
        u.mana = Math.min(u.maxMana, u.mana + u.maxMana * FOUNTAIN_MANA_FRAC_PER_S * DT);
      } else if (onPad(fountain, u.pos)) {
        dealDamage(ctx, 0, u, FOUNTAIN_TRUE_DPS * DT, "true");
      }
    }
  }
}

// src/sim/lanes.ts
var LANE_SEATS = { top: 2, mid: 1, bot: 2 };
var LANES2 = ["top", "bot", "mid"];
function assignLanes(seats) {
  const open2 = { ...LANE_SEATS };
  const out = seats.map(() => null);
  const forest = seats.map((seat) => seat.prefer?.[0] === "jungle");
  const reopen = () => {
    if (LANES2.every((lane) => open2[lane] <= 0)) {
      for (const lane of LANES2) open2[lane] += LANE_SEATS[lane];
    }
  };
  const take = (i, lane) => {
    out[i] = lane;
    open2[lane] -= 1;
  };
  for (const [i, seat] of seats.entries()) {
    if (forest[i]) continue;
    reopen();
    const want = (seat.prefer ?? []).find((lane) => lane !== "jungle" && open2[lane] > 0) ?? seat.home;
    if (want !== null && open2[want] > 0) take(i, want);
  }
  for (const [i] of seats.entries()) {
    if (out[i] !== null || forest[i]) continue;
    reopen();
    let best = LANES2[0];
    for (const lane of LANES2) if (open2[lane] > open2[best]) best = lane;
    take(i, best);
  }
  return out;
}
function laneDistance(lane, x, z) {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i + 1 < lane.length; i++) {
    const a = lane[i];
    const b = lane[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const len2 = abx * abx + abz * abz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / len2));
    best = Math.min(best, hypot(x - (a.x + abx * t), z - (a.z + abz * t)));
  }
  return best;
}
var LANE_HALF_WIDTH = 7;
function laneOf(x, z, map = GAME_MAP) {
  let best = null;
  let bestD = LANE_HALF_WIDTH;
  for (const lane of ["top", "mid", "bot"]) {
    const d = laneDistance(map.lanes[lane], x, z);
    if (d <= bestD) {
      best = lane;
      bestD = d;
    }
  }
  return best;
}

// src/sim/playbook/micro.ts
var CAST_RANGE = 7;
var CHAMPION_ATTACK_RANGE = 9;
var FARM_RANGE = 8;
var TOWER_DANGER_RANGE = 11.5;
var ESCORT_RADIUS = 7;
var ESCORT_MIN = 3;
var KILL_SECURE_HP_FRAC = 0.3;
var SELF_RADIUS = 0.75;
var DODGE_STEP = 2.6;
var DODGE_ETA_S = 1;
var WINDUP_DANGER_RADIUS = 3.4;
var RECALL_MIN_HOME_DIST = 30;
var RECALL_CLEAR_CHAMP_RANGE = 18;
var RECALL_CLEAR_MEMORY_RANGE = 16;
var RECALL_CLEAR_MINION_RANGE = 8;
var RECALL_BREAK_RANGE = 10;
var WARDEN_APPROACH_RANGE = 40;
var WARDEN_PREP_S = 20;
var WARDEN_PREP_RANGE = 55;
var WARDEN_FIGHT_HP_FRAC = 0.5;
var REGROUP_AT_S = 12 * 60;
var JITTER = 1.5;
function dist(ax, az, b) {
  return hypot(b.x - ax, b.z - az);
}
function nearest(list, x, z) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of list) {
    const d = dist(x, z, u);
    if (d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
function hardCCd(u, time) {
  return (u.statuses ?? []).some(
    (s) => (s.kind === "stun" || s.kind === "root" || s.kind === "airborne") && s.until > time
  );
}
function aimAt(s, target, def, time) {
  const spec = def.spec;
  if (spec.kind !== "skillshot" || hardCCd(target, time)) return { x: target.x, z: target.z };
  const d = hypot(target.x - s.x, target.z - s.z);
  const eta = d / spec.speed;
  const px = target.x + (target.vx ?? 0) * eta;
  const pz = target.z + (target.vz ?? 0) * eta;
  const pd = hypot(px - s.x, pz - s.z);
  if (pd > spec.range) {
    const k = spec.range / pd;
    return { x: s.x + (px - s.x) * k, z: s.z + (pz - s.z) * k };
  }
  return { x: px, z: pz };
}
function abilityRange(def) {
  const spec = def.spec;
  switch (spec.kind) {
    case "skillshot":
    case "cone":
      return spec.range;
    case "dash":
      return spec.range;
    case "burst":
      return spec.radius + 0.5;
    default:
      return def.castRange;
  }
}
function pickCast(ctx, champ, engage = true) {
  const { s, obs, def, hints, enemyChampions } = ctx;
  if (!def) return null;
  const dc = hypot(champ.x - s.x, champ.z - s.z);
  if (s.abilityReady.R && s.recastArmed !== "R") {
    const r = def.abilities.R;
    const range2 = abilityRange(r);
    const minR = hints.minRange?.R ?? 0;
    const cluster = enemyChampions.filter(
      (e) => hypot(e.x - champ.x, e.z - champ.z) <= (hints.ult.radius ?? 5)
    ).length;
    const gate = hints.ult.minEnemies !== void 0 && cluster >= hints.ult.minEnemies || hints.ult.targetHpBelow !== void 0 && champ.hpFrac < hints.ult.targetHpBelow;
    if (gate && dc <= range2 && dc >= minR) {
      const aim = aimAt(s, champ, r, obs.time);
      return { kind: "cast", key: "R", x: aim.x, z: aim.z };
    }
  }
  for (const key of ["Q", "W", "E"]) {
    if (!s.abilityReady[key]) continue;
    const role = hints.keys[key];
    if (role === "escape") continue;
    const range2 = abilityRange(def.abilities[key]);
    const minR = hints.minRange?.[key] ?? 0;
    if (role === "steroid") {
      if (dc <= CHAMPION_ATTACK_RANGE) return { kind: "cast", key, x: s.x, z: s.z };
      continue;
    }
    if (role === "heal") {
      const hurt = obs.units.filter((u) => u.friendly && u.kind === "champion" && u.hpFrac < 0.65).sort((a, b) => a.hpFrac - b.hpFrac)[0];
      if (hurt && hypot(hurt.x - s.x, hurt.z - s.z) <= def.abilities[key].castRange) {
        return { kind: "cast", key, x: hurt.x, z: hurt.z };
      }
      continue;
    }
    if (role === "wall") {
      if (champ.hpFrac < 0.5 && dc <= range2) return { kind: "cast", key, x: champ.x, z: champ.z };
      continue;
    }
    if (role === "engage" && (s.hpFrac < 0.5 || !engage)) continue;
    if (dc <= range2 && dc >= minR) {
      const aim = aimAt(s, champ, def.abilities[key], obs.time);
      return { kind: "cast", key, x: aim.x, z: aim.z };
    }
  }
  return null;
}
var RANGED_MIN_RANGE = 4;
var KITE_DANGER_FRAC = 0.6;
var KITE_STEP = 3.5;
var CHASE_RANGE = 15;
var KITE_APPROACH = 4;
var ENGAGED_RANGE = 10;
var BESIDE_RANGE = 6;
var ALONE_RANGE = 8;
var TOWER_THREAT_RANGE = 16;
var JOIN_RANGE = 40;
var FIGHT_TARGET_RADIUS = 25;
var ATTACK_RANGE_FALLBACK = 6;
function buildSlotContext(obs, rng, kitDef, map = GAME_MAP) {
  const s = obs.self;
  const fountain = map.fountains.find((f) => f.team === s.team);
  const enemySanctum = map.sanctums.find((c) => c.team !== s.team);
  const enemyTowers = obs.units.filter((u) => !u.friendly && u.kind === "tower");
  const inTowerReach2 = (x, z) => enemyTowers.some((t) => hypot(t.x - x, t.z - z) <= TOWER_DANGER_RANGE);
  const enemies = obs.units.filter((u) => !u.friendly);
  const friendlyMinions = obs.units.filter((u) => u.friendly && u.kind === "minion");
  const escortAt = (x, z) => friendlyMinions.filter((m) => hypot(m.x - x, m.z - z) <= ESCORT_RADIUS).length;
  const enemyChampions = enemies.filter((u) => u.kind === "champion");
  const ccdTarget = enemyChampions.filter((u) => hardCCd(u, obs.time) && dist(s.x, s.z, u) <= CHAMPION_ATTACK_RANGE).sort((a, b) => dist(s.x, s.z, a) - dist(s.x, s.z, b))[0];
  const champ = ccdTarget ?? nearest(enemyChampions, s.x, s.z);
  const atFountain = onFountain(fountain, { x: s.x, z: s.z });
  const recallClear = () => !obs.units.some(
    (u) => !u.friendly && (u.kind === "champion" && hypot(u.x - s.x, u.z - s.z) <= RECALL_CLEAR_CHAMP_RANGE || (u.kind === "minion" || u.kind === "warden" || u.kind === "creature") && hypot(u.x - s.x, u.z - s.z) <= RECALL_CLEAR_MINION_RANGE)
  ) && !(obs.lastSeen ?? []).some(
    (ls) => obs.time - ls.at <= 3 && hypot(ls.x - s.x, ls.z - s.z) <= RECALL_CLEAR_MEMORY_RANGE
  ) && !inTowerReach2(s.x, s.z);
  let drawn = null;
  let resolved = null;
  const ctx = {
    obs,
    s,
    map,
    def: s.championId ? CHAMPIONS[s.championId] : void 0,
    attackRange: s.attackRange ?? ATTACK_RANGE_FALLBACK,
    hints: hintsFor(s.championId),
    fountain,
    enemySanctum,
    enemyTowers,
    enemies,
    enemyChampions,
    friendlyMinions,
    champ,
    atFountain,
    inTowerReach: inTowerReach2,
    escortAt,
    recallClear,
    distHome: () => hypot(s.x - fountain.x, s.z - fountain.z),
    besideAlly: () => obs.units.some(
      (u) => u.friendly && u.kind === "champion" && dist(s.x, s.z, u) <= ALONE_RANGE
    ),
    threatenedTowers: (within2) => {
      const out = [];
      for (const t of obs.units) {
        if (!t.friendly || t.kind !== "tower" || t.hpFrac <= 0) continue;
        if (dist(s.x, s.z, t) > within2) continue;
        const count3 = enemyChampions.filter((e) => dist(t.x, t.z, e) <= TOWER_THREAT_RANGE).length;
        if (count3 > 0) out.push({ tower: t, count: count3 });
      }
      return out.sort(
        (a, b) => b.count - a.count || dist(s.x, s.z, a.tower) - dist(s.x, s.z, b.tower)
      );
    },
    engagedAllies: (within2) => obs.units.filter(
      (u) => u.friendly && u.kind === "champion" && dist(s.x, s.z, u) <= within2 && enemyChampions.some((e) => dist(u.x, u.z, e) <= ENGAGED_RANGE)
    ).sort((a, b) => dist(s.x, s.z, a) - dist(s.x, s.z, b)),
    jitter: () => {
      if (!drawn) {
        drawn = { jx: (rng.next() * 2 - 1) * JITTER, jz: (rng.next() * 2 - 1) * JITTER };
      }
      return drawn;
    },
    kit: () => {
      if (!resolved) resolved = resolveKit(kitDef, s.championId, ctx);
      return resolved;
    }
  };
  return ctx;
}
function homewardPoint(ctx, len) {
  const { s, fountain } = ctx;
  const dh = hypot(fountain.x - s.x, fountain.z - s.z) || 1;
  return {
    x: s.x + (fountain.x - s.x) / dh * len,
    z: s.z + (fountain.z - s.z) / dh * len
  };
}
function towardHome(ctx, len) {
  const p = homewardPoint(ctx, len);
  return { kind: "move", x: p.x, z: p.z };
}
function dodge(ctx) {
  const { s, obs, inTowerReach: inTowerReach2 } = ctx;
  for (const p of obs.projectiles ?? []) {
    if (p.friendly || p.homing) continue;
    const relX = s.x - p.x;
    const relZ = s.z - p.z;
    const along = relX * p.dirX + relZ * p.dirZ;
    if (along < 0) continue;
    if (along / Math.max(1, p.speed) > DODGE_ETA_S) continue;
    const lateral = relX * -p.dirZ + relZ * p.dirX;
    if (Math.abs(lateral) > p.radius + SELF_RADIUS + 0.5) continue;
    const side2 = lateral >= 0 ? 1 : -1;
    let mx = s.x - p.dirZ * side2 * DODGE_STEP;
    let mz = s.z + p.dirX * side2 * DODGE_STEP;
    if (inTowerReach2(mx, mz) && !inTowerReach2(s.x, s.z)) {
      mx = s.x + p.dirZ * side2 * DODGE_STEP;
      mz = s.z - p.dirX * side2 * DODGE_STEP;
    }
    return { kind: "move", x: mx, z: mz };
  }
  for (const zn of obs.zones ?? []) {
    if (zn.friendly) continue;
    const d = hypot(s.x - zn.x, s.z - zn.z);
    if (d > zn.radius + SELF_RADIUS) continue;
    const ux = d > 0.05 ? (s.x - zn.x) / d : 1;
    const uz = d > 0.05 ? (s.z - zn.z) / d : 0;
    const out = zn.radius + SELF_RADIUS + 1;
    const mx = zn.x + ux * out;
    const mz = zn.z + uz * out;
    if (inTowerReach2(mx, mz) && !inTowerReach2(s.x, s.z)) {
      return towardHome(ctx, out);
    }
    return { kind: "move", x: mx, z: mz };
  }
  for (const e of obs.units) {
    if (e.friendly || e.kind !== "champion" || !e.windup) continue;
    const d = hypot(s.x - e.windup.x, s.z - e.windup.z);
    if (d > WINDUP_DANGER_RADIUS) continue;
    const ux = d > 0.05 ? (s.x - e.windup.x) / d : 1;
    const uz = d > 0.05 ? (s.z - e.windup.z) / d : 0;
    const mx = s.x + ux * DODGE_STEP;
    const mz = s.z + uz * DODGE_STEP;
    if (inTowerReach2(mx, mz) && !inTowerReach2(s.x, s.z)) return towardHome(ctx, DODGE_STEP);
    return { kind: "move", x: mx, z: mz };
  }
  return null;
}
function recastHome(ctx) {
  const { s, hints } = ctx;
  if (s.recastArmed && hints.recastHomeBelow !== void 0 && s.hpFrac < hints.recastHomeBelow && s.abilityReady[s.recastArmed]) {
    return { kind: "cast", key: s.recastArmed, x: s.x, z: s.z };
  }
  return null;
}
function levelUp(ctx) {
  const { s } = ctx;
  if (s.skillPoints > 0) {
    const ultGate = [6, 11, 16][s.abilityRanks.R];
    if (ultGate !== void 0 && s.level >= ultGate) return { kind: "level", key: "R" };
    for (const key of ctx.kit().skills) {
      if (s.abilityRanks[key] < 5) return { kind: "level", key };
    }
  }
  return null;
}
function holdRecall(ctx) {
  const { s, obs } = ctx;
  if (!s.recalling) return null;
  const breaker = obs.units.some(
    (u) => !u.friendly && u.kind === "champion" && hypot(u.x - s.x, u.z - s.z) <= RECALL_BREAK_RANGE
  ) || (obs.lastSeen ?? []).some(
    (ls) => obs.time - ls.at <= 2 && hypot(ls.x - s.x, ls.z - s.z) <= RECALL_BREAK_RANGE
  );
  return breaker ? null : { kind: "noop" };
}
function readySigil(s, id) {
  return s.sigils.findIndex((sid, i) => sid === id && s.sigilReady[i] === true);
}

// src/sim/playbook/wave.ts
var FREEZE_AHEAD = 9;
var LANE_TOWER_RANGE = 8;
var SANCTUM_TOWER_RANGE = 12;
var AT_SPOT = 2;
function killable(minion, attackDamage) {
  return minion.hp !== void 0 && minion.hp <= attackDamage;
}
function lastHit(ctx) {
  const { s } = ctx;
  const ad = s.attackDamage;
  if (ad === void 0) return null;
  let best = null;
  for (const m of ctx.enemies) {
    if (m.kind !== "minion" || dist(s.x, s.z, m) > FARM_RANGE || !killable(m, ad)) continue;
    if (!best || (m.hp ?? 0) < (best.hp ?? 0)) best = m;
  }
  return best ? { kind: "attack", targetId: best.id } : null;
}
function shove(ctx) {
  const { s } = ctx;
  const minion = nearest(
    ctx.enemies.filter((u) => u.kind === "minion"),
    s.x,
    s.z
  );
  if (minion && dist(s.x, s.z, minion) <= FARM_RANGE) {
    return { kind: "attack", targetId: minion.id };
  }
  return null;
}
function laneTower(ctx) {
  const lane = ctx.s.lane;
  if (lane === null) return null;
  const path12 = ctx.map.lanes[lane];
  const home = ctx.map.sanctums.find((c) => c.team === ctx.s.team);
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const t of ctx.obs.units) {
    if (!t.friendly || t.kind !== "tower" || t.hpFrac <= 0) continue;
    if (laneDistance(path12, t.x, t.z) > LANE_TOWER_RANGE) continue;
    if (hypot(t.x - home.x, t.z - home.z) <= SANCTUM_TOWER_RANGE) continue;
    const d = hypot(t.x - ctx.enemySanctum.x, t.z - ctx.enemySanctum.z);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}
function freezeSpot(ctx, tower) {
  const lane = ctx.s.lane;
  const path12 = ctx.map.lanes[lane];
  const oriented = ctx.s.team === 0 ? path12 : [...path12].reverse();
  let idx = 0;
  let best = Number.POSITIVE_INFINITY;
  oriented.forEach((p, i) => {
    const d = hypot(p.x - tower.x, p.z - tower.z);
    if (d < best) {
      best = d;
      idx = i;
    }
  });
  const next = oriented[Math.min(idx + 1, oriented.length - 1)];
  let dx = next.x - tower.x;
  let dz = next.z - tower.z;
  if (hypot(dx, dz) < 0.5) {
    dx = ctx.enemySanctum.x - tower.x;
    dz = ctx.enemySanctum.z - tower.z;
  }
  const len = hypot(dx, dz) || 1;
  return { x: tower.x + dx / len * FREEZE_AHEAD, z: tower.z + dz / len * FREEZE_AHEAD };
}
function freeze(ctx) {
  const tower = laneTower(ctx);
  if (!tower) return null;
  const hit = lastHit(ctx);
  if (hit) return hit;
  const { s } = ctx;
  const spot = freezeSpot(ctx, tower);
  if (hypot(spot.x - s.x, spot.z - s.z) <= AT_SPOT) {
    return s.holding === true ? { kind: "noop" } : { kind: "stop" };
  }
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: spot.x + jx, z: spot.z + jz };
}
function manageWave(ctx, intent) {
  return intent === "shove" ? shove(ctx) : freeze(ctx);
}

// src/sim/playbook/behaviors.ts
function runBehavior(b, ctx) {
  switch (b.kind) {
    case "retreat":
      return retreat(ctx);
    case "hold":
      return { kind: "noop" };
    case "shop":
      return shop(ctx);
    case "goShop":
      return goShop(ctx);
    case "sell":
      return sellNamed(ctx, b.item);
    case "avoidTower":
      return avoidTower(ctx, b.escortMin ?? ESCORT_MIN, b.hpBelow ?? 0.65);
    case "finishSanctum":
      return finishSanctum(ctx);
    case "fight":
      return fight(ctx, b.stance ?? "auto", b.target ?? "nearest", b.alone ?? "engage", b.commitAt);
    case "hunt":
      return hunt(ctx, b.hpAbove ?? 0.5);
    case "answerVanish":
      return answerVanish(ctx, b.hpAtLeast ?? 0.55);
    case "contestWarden":
      return contestWarden(
        ctx,
        b.hpAtLeast ?? WARDEN_FIGHT_HP_FRAC,
        b.prepSeconds ?? WARDEN_PREP_S,
        b.partyAtLeast ?? WARDEN_PARTY
      );
    case "contestCreature":
      return contestCreature(
        ctx,
        b.which ?? "any",
        b.hpAtLeast ?? WARDEN_FIGHT_HP_FRAC,
        b.prepSeconds ?? WARDEN_PREP_S,
        b.within ?? WARDEN_APPROACH_RANGE,
        b.partyAtLeast ?? (b.which === "ascendant" ? WARDEN_PARTY : CREATURE_PARTY)
      );
    case "farm":
      return b.mode === "lastHit" ? lastHit(ctx) : farm(ctx);
    case "manageWave":
      return manageWave(ctx, b.intent);
    case "defendTower":
      return defendTower(ctx, b.within ?? 200);
    case "takeCamp":
      return takeCamp(ctx);
    case "jungle":
      return jungle(ctx, b.side ?? "own");
    case "siege":
      return siege(ctx, b.escortMin ?? ESCORT_MIN);
    case "push":
      return push(
        ctx,
        b.lane ?? "assigned",
        b.regroupAt === void 0 ? REGROUP_AT_S : b.regroupAt
      );
    case "obeyOrder":
      return obeyOrder(ctx);
    case "followAlly":
      return followAlly(ctx, b.keep ?? 3);
    case "joinAlly":
      return joinAlly(ctx, b.within ?? JOIN_RANGE);
    case "fallBack":
      return fallBack(ctx);
    case "splitPush":
      return push(ctx, quietestLane(ctx), null);
    case "holdPosition":
      return holdPosition(ctx, b.x, b.z, b.within ?? 2);
  }
}
function retreat(ctx) {
  const { s, obs, hints, fountain } = ctx;
  const chaser = obs.units.some(
    (u) => !u.friendly && u.kind === "champion" && hypot(u.x - s.x, u.z - s.z) <= 6
  ) || (obs.lastSeen ?? []).some((ls) => obs.time - ls.at <= 2 && hypot(ls.x - s.x, ls.z - s.z) <= 6);
  if (chaser) {
    const escapeKey = ["Q", "W", "E"].find(
      (k) => hints.keys[k] === "escape" && s.abilityReady[k]
    );
    if (escapeKey) {
      const p = homewardPoint(ctx, 6);
      return { kind: "cast", key: escapeKey, x: p.x, z: p.z };
    }
    const rift = readySigil(s, "riftstep");
    if (rift !== -1) {
      const p = homewardPoint(ctx, 6);
      return { kind: "sigil", slot: rift, x: p.x, z: p.z };
    }
    const zephyr = readySigil(s, "zephyr");
    if (zephyr !== -1) return { kind: "sigil", slot: zephyr, x: s.x, z: s.z };
  }
  if (!s.recalling) {
    const mendSlot = readySigil(s, "mend");
    if (mendSlot !== -1) return { kind: "sigil", slot: mendSlot, x: s.x, z: s.z };
    if (ctx.recallClear() && ctx.distHome() > RECALL_MIN_HOME_DIST) return { kind: "recall" };
  }
  if (ctx.atFountain) return { kind: "noop" };
  return { kind: "move", x: fountain.x, z: fountain.z };
}
function shop(ctx) {
  const step = nextKitStep(ctx.kit().build, ctx.s.items, ctx.s.gold);
  if (!step || !ctx.atFountain) return null;
  return step;
}
function sellNamed(ctx, item) {
  if (!ctx.atFountain) return null;
  const slot = ctx.s.items.indexOf(item);
  return slot === -1 ? null : { kind: "sell", slot };
}
function goShop(ctx) {
  const { fountain } = ctx;
  if (!nextKitStep(ctx.kit().build, ctx.s.items, ctx.s.gold) || !ctx.recallClear()) return null;
  if (ctx.distHome() > RECALL_MIN_HOME_DIST) return { kind: "recall" };
  return { kind: "move", x: fountain.x, z: fountain.z };
}
function avoidTower(ctx, escortMin, hpBelow) {
  const { s, champ, fountain } = ctx;
  const dangerTower = ctx.enemyTowers.find(
    (t) => dist(s.x, s.z, t) <= TOWER_DANGER_RANGE && (ctx.escortAt(t.x, t.z) < escortMin || s.hpFrac < hpBelow)
  );
  const securingKill = champ !== null && s.hpFrac >= 0.4 && champ.hpFrac < KILL_SECURE_HP_FRAC && dist(s.x, s.z, champ) <= CAST_RANGE;
  if (!dangerTower || securingKill) return null;
  const dt = dist(s.x, s.z, dangerTower);
  const la = hypot(s.x - dangerTower.x, s.z - dangerTower.z) || 1;
  const lh = hypot(fountain.x - s.x, fountain.z - s.z) || 1;
  const dirX = (s.x - dangerTower.x) / la + (fountain.x - s.x) / lh;
  const dirZ = (s.z - dangerTower.z) / la + (fountain.z - s.z) / lh;
  const ld = hypot(dirX, dirZ) || 1;
  const step = TOWER_DANGER_RANGE - dt + 2.5;
  return { kind: "move", x: s.x + dirX / ld * step, z: s.z + dirZ / ld * step };
}
function finishSanctum(ctx) {
  const { s } = ctx;
  const sanctum = ctx.enemies.find((e) => e.kind === "sanctum" && e.invulnerable !== true);
  if (sanctum && dist(s.x, s.z, sanctum) <= FARM_RANGE && (sanctum.hpFrac < 0.5 || ctx.escortAt(sanctum.x, sanctum.z) >= 2)) {
    return { kind: "attack", targetId: sanctum.id };
  }
  return null;
}
var SQUISH = {
  Marksman: 0,
  Mage: 0,
  Assassin: 1,
  Battlemage: 1,
  Skirmisher: 2,
  Support: 2,
  Fighter: 3,
  Tank: 4
};
function pickTarget(ctx, rule) {
  const { s, obs } = ctx;
  const cands = ctx.enemyChampions;
  if (cands.length === 0) return null;
  const ccd = cands.filter((u) => hardCCd(u, obs.time) && dist(s.x, s.z, u) <= CHAMPION_ATTACK_RANGE).sort((a, b) => dist(s.x, s.z, a) - dist(s.x, s.z, b))[0];
  if (ccd) return ccd;
  if (rule === "order") {
    const order = s.coachOrder ?? null;
    const focus = order?.kind === "focus" ? cands.find((u) => u.id === order.targetId) : void 0;
    if (focus) return focus;
  }
  const near = cands.filter((u) => dist(s.x, s.z, u) <= FIGHT_TARGET_RADIUS);
  const byDistance = (a, b) => dist(s.x, s.z, a) - dist(s.x, s.z, b);
  if (rule === "lowest" && near.length > 0) {
    return [...near].sort((a, b) => a.hpFrac - b.hpFrac || byDistance(a, b))[0];
  }
  if (rule === "squishiest" && near.length > 0) {
    const squish = (u) => {
      const role = u.championId ? CHAMPIONS[u.championId]?.role : void 0;
      return role ? SQUISH[role] : 2;
    };
    return [...near].sort((a, b) => squish(a) - squish(b) || byDistance(a, b))[0];
  }
  return nearest(cands, s.x, s.z);
}
function kiteStep(ctx, threat) {
  const { s } = ctx;
  const d = dist(s.x, s.z, threat) || 1;
  const mx = s.x + (s.x - threat.x) / d * KITE_STEP;
  const mz = s.z + (s.z - threat.z) / d * KITE_STEP;
  if (ctx.inTowerReach(mx, mz) && !ctx.inTowerReach(s.x, s.z)) return towardHome(ctx, KITE_STEP);
  return { kind: "move", x: mx, z: mz };
}
function fight(ctx, stance, rule, alone, commitAt) {
  const { s, obs } = ctx;
  const champ = pickTarget(ctx, rule);
  if (!champ) return null;
  const committed = commitAt === void 0 || fightOdds(ctx) >= commitAt;
  const dc = dist(s.x, s.z, champ);
  if (dc <= CAST_RANGE && champ.hpFrac < KILL_SECURE_HP_FRAC) {
    const sear = readySigil(s, "sear");
    if (sear !== -1) return { kind: "sigil", slot: sear, x: champ.x, z: champ.z };
  }
  const range2 = ctx.attackRange;
  const mode = stance === "auto" ? range2 >= RANGED_MIN_RANGE ? "kite" : "front" : stance;
  const cast = pickCast(ctx, champ, committed);
  if (mode === "front") {
    if (cast) return cast;
    if (dc <= CHAMPION_ATTACK_RANGE) return { kind: "attack", targetId: champ.id };
    if (alone === "hold" && !ctx.besideAlly()) return null;
    if (!committed) return null;
    if (dc <= CHASE_RANGE && !ctx.inTowerReach(champ.x, champ.z)) {
      return { kind: "move", x: champ.x, z: champ.z };
    }
    return null;
  }
  const threat = nearest(ctx.enemyChampions, s.x, s.z);
  const td = threat ? dist(s.x, s.z, threat) : Number.POSITIVE_INFINITY;
  const securing = champ.hpFrac < KILL_SECURE_HP_FRAC && dc <= range2 + 1;
  const swinging = s.attackSwingUntil != null && s.attackSwingUntil > obs.time;
  if (swinging) return { kind: "noop" };
  if (mode === "poke") {
    if (cast) return cast;
    if (threat && td < range2) return kiteStep(ctx, threat);
    return null;
  }
  if (cast) return cast;
  const ready = (s.attackReadyAt ?? 0) <= obs.time;
  const inReach = dc <= range2 + 0.5;
  if (ready && inReach) return { kind: "attack", targetId: champ.id };
  if (threat && td < range2 * KITE_DANGER_FRAC && !securing) return kiteStep(ctx, threat);
  if (inReach) return { kind: "noop" };
  if (!committed) return null;
  if (dc <= range2 + KITE_APPROACH) {
    const k = (dc - (range2 - 0.5)) / dc;
    const ax = s.x + (champ.x - s.x) * k;
    const az = s.z + (champ.z - s.z) * k;
    if (!ctx.inTowerReach(ax, az)) return { kind: "move", x: ax, z: az };
  }
  return null;
}
function hunt(ctx, hpAbove) {
  const { s, obs } = ctx;
  if (ctx.champ || !(s.hpFrac > hpAbove)) return null;
  const prey = (obs.lastSeen ?? []).find(
    (ls) => ls.hpFrac < KILL_SECURE_HP_FRAC && obs.time - ls.at <= 3 && hypot(ls.x - s.x, ls.z - s.z) <= 12 && !ctx.inTowerReach(ls.x, ls.z)
  );
  return prey ? { kind: "move", x: prey.x, z: prey.z } : null;
}
function answerVanish(ctx, hpAtLeast) {
  const { s, obs } = ctx;
  if (ctx.champ) return null;
  const vanished = (obs.lastSeen ?? []).find(
    (ls) => obs.time - ls.at <= 2.5 && hypot(ls.x - s.x, ls.z - s.z) <= 9
  );
  if (!vanished) return null;
  if (s.hpFrac >= hpAtLeast && !ctx.inTowerReach(vanished.x, vanished.z)) {
    return { kind: "move", x: vanished.x, z: vanished.z };
  }
  return towardHome(ctx, 6);
}
var CREATURE_PARTY = 2;
var WARDEN_PARTY = 3;
var GROUP_RANGE = 15;
var RALLY_EVERY_S = 120;
var RALLY_WINDOW_S = 40;
var GATHER_STAND_OFF = 6;
function rallying(obs, roseAt) {
  if (roseAt === null || roseAt === void 0) return false;
  const since = obs.time - roseAt;
  return since >= 0 && since % RALLY_EVERY_S <= RALLY_WINDOW_S;
}
function strikeBody(ctx, body) {
  const cast = pickCast(ctx, body);
  if (cast) return cast;
  if (dist(ctx.s.x, ctx.s.z, body) <= FARM_RANGE) return { kind: "attack", targetId: body.id };
  return null;
}
function gather(ctx, body, party, partyAtLeast, hpAtLeast, within2, roseAt) {
  const { s, obs } = ctx;
  if (party < partyAtLeast - 1 || s.hpFrac < hpAtLeast) return null;
  const d = dist(s.x, s.z, body);
  if (d > within2 || !rallying(obs, roseAt)) return null;
  if (d <= GATHER_STAND_OFF + 2) return { kind: "noop" };
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: body.x + jx, z: body.z + jz };
}
function partyAt(ctx, x, z, within2) {
  const { s, obs } = ctx;
  let atBody = 0;
  let beside = 0;
  for (const u of obs.units) {
    if (!u.friendly || u.kind !== "champion" || u.hpFrac <= 0) continue;
    if (dist(x, z, u) <= within2) atBody += 1;
    if (dist(s.x, s.z, u) <= GROUP_RANGE) beside += 1;
  }
  return 1 + Math.max(atBody, beside);
}
function wardenPitOf(ctx) {
  const { s, obs } = ctx;
  if (obs.wardenPit) return obs.wardenPit;
  let pit = ctx.map.wardenPits[0];
  for (const p of ctx.map.wardenPits) {
    if (hypot(p.x - s.x, p.z - s.z) < hypot(pit.x - s.x, pit.z - s.z)) pit = p;
  }
  return pit;
}
function contestWarden(ctx, hpAtLeast, prepSeconds, partyAtLeast) {
  const { s, obs } = ctx;
  const { jx, jz } = ctx.jitter();
  const warden = ctx.enemies.find((u) => u.kind === "warden");
  if (warden) {
    const party = partyAt(ctx, warden.x, warden.z, WARDEN_APPROACH_RANGE);
    if (party < partyAtLeast) {
      return gather(
        ctx,
        warden,
        party,
        partyAtLeast,
        hpAtLeast,
        WARDEN_APPROACH_RANGE,
        obs.wardenRoseAt
      );
    }
    const hit = strikeBody(ctx, warden);
    if (hit) return hit;
    const dw = dist(s.x, s.z, warden);
    if (dw <= WARDEN_APPROACH_RANGE && s.hpFrac >= hpAtLeast) {
      return { kind: "move", x: warden.x + jx, z: warden.z + jz };
    }
    return null;
  }
  if (obs.objectiveSpawnAt != null && s.hpFrac >= hpAtLeast) {
    const untilSpawn = obs.objectiveSpawnAt - obs.time;
    if (untilSpawn >= 0 && untilSpawn <= prepSeconds) {
      const pit = wardenPitOf(ctx);
      const dp = hypot(pit.x - s.x, pit.z - s.z);
      if (dp <= 6) return { kind: "noop" };
      if (dp <= WARDEN_PREP_RANGE) return { kind: "move", x: pit.x + jx, z: pit.z + jz };
    }
  }
  return null;
}
function ringClocksOf(ctx, which) {
  return (ctx.obs.creatures ?? []).filter((c) => clockMeans(c, which));
}
function nearestLiveClock(ctx, clocks) {
  const { s } = ctx;
  let best = null;
  for (const c of clocks) {
    if (c.unitId === null) continue;
    if (!best || hypot(c.x - s.x, c.z - s.z) < hypot(best.x - s.x, best.z - s.z)) best = c;
  }
  return best;
}
function liveCreatures(ctx, clocks) {
  const out = [];
  for (const c of clocks) {
    if (c.unitId === null) continue;
    const u = ctx.enemies.find((e) => e.id === c.unitId);
    if (u) out.push(u);
  }
  return out;
}
function contestCreature(ctx, which, hpAtLeast, prepSeconds, within2, partyAtLeast) {
  const { s, obs } = ctx;
  const clocks = ringClocksOf(ctx, which);
  if (clocks.length === 0) return null;
  const { jx, jz } = ctx.jitter();
  const live = nearest(liveCreatures(ctx, clocks), s.x, s.z);
  const body = live ?? nearestLiveClock(ctx, clocks);
  if (body) {
    const party = partyAt(ctx, body.x, body.z, within2);
    if (party < partyAtLeast) {
      const roseAt = live ? clocks.find((c) => c.unitId === live.id)?.roseAt : body.roseAt;
      return gather(ctx, body, party, partyAtLeast, hpAtLeast, within2, roseAt);
    }
    if (live) {
      const hit = strikeBody(ctx, live);
      if (hit) return hit;
    }
    const d = dist(s.x, s.z, body);
    if (d <= within2 && s.hpFrac >= hpAtLeast) {
      return { kind: "move", x: body.x + jx, z: body.z + jz };
    }
    return null;
  }
  if (s.hpFrac < hpAtLeast) return null;
  let ring = null;
  for (const c of clocks) {
    if (c.riseAt === null) continue;
    const until = c.riseAt - obs.time;
    if (until < 0 || until > prepSeconds) continue;
    if (!ring || hypot(c.x - s.x, c.z - s.z) < hypot(ring.x - s.x, ring.z - s.z)) ring = c;
  }
  if (!ring) return null;
  const dp = hypot(ring.x - s.x, ring.z - s.z);
  if (dp <= 6) return { kind: "noop" };
  if (dp <= WARDEN_PREP_RANGE) return { kind: "move", x: ring.x + jx, z: ring.z + jz };
  return null;
}
function farm(ctx) {
  const { s } = ctx;
  const minion = nearest(
    ctx.enemies.filter((u) => u.kind === "minion"),
    s.x,
    s.z
  );
  if (minion && dist(s.x, s.z, minion) <= FARM_RANGE) {
    return { kind: "attack", targetId: minion.id };
  }
  return null;
}
function takeCamp(ctx) {
  const { s } = ctx;
  if (ctx.champ) return null;
  const camp = nearest(
    ctx.enemies.filter((u) => u.kind === "camp"),
    s.x,
    s.z
  );
  if (camp && dist(s.x, s.z, camp) <= FARM_RANGE) return { kind: "attack", targetId: camp.id };
  return null;
}
var JUNGLE_CLEAR_RANGE = 10;
var JUNGLE_WAIT_S = 12;
var JUNGLE_WALK_SPEED = 3.4;
function campUpAt(camp) {
  if (camp.up === null) return CAMP_FIRST_SPAWN_S;
  if (camp.up) return camp.seenAt ?? 0;
  return (camp.downSince ?? camp.seenAt ?? 0) + CAMPS[camp.kind].respawnS;
}
function jungle(ctx, side2) {
  const { s, obs, fountain } = ctx;
  const body = nearest(
    ctx.enemies.filter((u) => u.kind === "camp"),
    s.x,
    s.z
  );
  if (body && dist(s.x, s.z, body) <= JUNGLE_CLEAR_RANGE) {
    return strikeBody(ctx, body) ?? { kind: "attack", targetId: body.id };
  }
  const enemyFountain = ctx.map.fountains.find((f) => f.team !== s.team);
  let best = null;
  let bestAt = Number.POSITIVE_INFINITY;
  let bestD = Number.POSITIVE_INFINITY;
  for (const camp of obs.camps ?? []) {
    if (side2 === "own" && enemyFountain && hypot(camp.x - fountain.x, camp.z - fountain.z) > hypot(camp.x - enemyFountain.x, camp.z - enemyFountain.z)) {
      continue;
    }
    if (ctx.inTowerReach(camp.x, camp.z)) continue;
    const arrival = obs.time + hypot(camp.x - s.x, camp.z - s.z) / JUNGLE_WALK_SPEED;
    const upAt = campUpAt(camp);
    if (obs.time >= CAMP_FIRST_SPAWN_S && upAt > arrival + JUNGLE_WAIT_S) continue;
    const at = Math.max(arrival, upAt);
    const d = hypot(camp.x - s.x, camp.z - s.z);
    if (at < bestAt - 1e-9 || Math.abs(at - bestAt) <= 1e-9 && d < bestD) {
      bestAt = at;
      bestD = d;
      best = camp;
    }
  }
  if (!best) return null;
  if (hypot(best.x - s.x, best.z - s.z) <= 3) return { kind: "noop" };
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: best.x + jx * 0.3, z: best.z + jz * 0.3 };
}
function siege(ctx, escortMin) {
  const { s } = ctx;
  const structure = nearest(
    ctx.enemies.filter(
      (u) => (u.kind === "tower" || u.kind === "sanctum") && u.invulnerable !== true
    ),
    s.x,
    s.z
  );
  if (structure && dist(s.x, s.z, structure) <= FARM_RANGE && ctx.escortAt(structure.x, structure.z) >= escortMin) {
    return { kind: "attack", targetId: structure.id };
  }
  return null;
}
function push(ctx, lane, regroupAt) {
  const { s, obs, enemySanctum } = ctx;
  const { jx, jz } = ctx.jitter();
  const laneId = lane === "assigned" ? s.lane !== null && regroupAt !== null && obs.time >= regroupAt ? "mid" : s.lane : lane;
  const myLane = laneId ? ctx.map.lanes[laneId] : null;
  let vanguard = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const m of ctx.friendlyMinions) {
    if (myLane && laneDistance(myLane, m.x, m.z) > 7) continue;
    const d = hypot(m.x - enemySanctum.x, m.z - enemySanctum.z);
    if (d < bestD) {
      bestD = d;
      vanguard = m;
    }
  }
  if (vanguard) return { kind: "move", x: vanguard.x + jx, z: vanguard.z + jz };
  if (myLane) {
    const oriented = s.team === 0 ? myLane : [...myLane].reverse();
    let idx = 0;
    let best = Number.POSITIVE_INFINITY;
    oriented.forEach((p, i) => {
      const d = hypot(p.x - s.x, p.z - s.z);
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    const next = oriented[Math.min(idx + 1, oriented.length - 1)];
    return { kind: "move", x: next.x + jx, z: next.z + jz };
  }
  return { kind: "move", x: enemySanctum.x + jx, z: enemySanctum.z + jz };
}
function followAlly(ctx, keep) {
  const { s, obs } = ctx;
  const ally = nearest(
    obs.units.filter((u) => u.friendly && u.kind === "champion"),
    s.x,
    s.z
  );
  if (!ally) return null;
  if (dist(s.x, s.z, ally) <= keep) return { kind: "noop" };
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: ally.x + jx, z: ally.z + jz };
}
function joinAlly(ctx, within2) {
  const { s } = ctx;
  const ally = ctx.engagedAllies(within2)[0];
  if (!ally || dist(s.x, s.z, ally) <= BESIDE_RANGE) return null;
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: ally.x + jx, z: ally.z + jz };
}
function quietestLane(ctx) {
  const activity = ctx.obs.laneActivity;
  if (!activity) return "assigned";
  const lanes = ["top", "mid", "bot"];
  const foes = ctx.enemyChampions;
  const farness = (lane) => {
    if (foes.length === 0) return 0;
    const path12 = ctx.map.lanes[lane];
    const mid = path12[Math.floor(path12.length / 2)];
    let sum = 0;
    for (const f of foes) sum += hypot(f.x - mid.x, f.z - mid.z);
    return sum / foes.length;
  };
  let best = ctx.s.lane ?? "mid";
  let bestKey = Number.POSITIVE_INFINITY;
  for (const lane of lanes) {
    const key = activity[lane] - farness(lane) / 1e3;
    if (key < bestKey) {
      bestKey = key;
      best = lane;
    }
  }
  return best;
}
function defendTower(ctx, within2) {
  const { s } = ctx;
  const target = ctx.threatenedTowers(within2)[0];
  if (!target || dist(s.x, s.z, target.tower) <= BESIDE_RANGE + 4) return null;
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: target.tower.x + jx, z: target.tower.z + jz };
}
function fallBack(ctx) {
  const { s, obs } = ctx;
  const tower = nearest(
    obs.units.filter((u) => u.friendly && u.kind === "tower"),
    s.x,
    s.z
  );
  if (!tower || dist(s.x, s.z, tower) <= BESIDE_RANGE) return null;
  const { jx, jz } = ctx.jitter();
  return { kind: "move", x: tower.x + jx, z: tower.z + jz };
}
function obeyOrder(ctx) {
  const { s } = ctx;
  const order = s.coachOrder ?? null;
  if (!order) return null;
  switch (order.kind) {
    case "goto":
      return holdPosition(ctx, order.x, order.z, GOTO_DONE_RADIUS);
    case "hold":
      return holdPosition(ctx, order.x, order.z, 2);
    case "back":
      return retreat(ctx);
    case "group":
      return followAlly(ctx, 4);
    case "warden": {
      const warden = ctx.enemies.find((u) => u.kind === "warden");
      if (warden) return strikeBody(ctx, warden) ?? { kind: "move", x: warden.x, z: warden.z };
      const pit = wardenPitOf(ctx);
      return holdPosition(ctx, pit.x, pit.z, 6);
    }
    case "creature": {
      const clocks = ringClocksOf(ctx, "any");
      const live = nearest(liveCreatures(ctx, clocks), s.x, s.z);
      if (live) return strikeBody(ctx, live) ?? { kind: "move", x: live.x, z: live.z };
      const up = nearestLiveClock(ctx, clocks);
      if (up) return holdPosition(ctx, up.x, up.z, 6);
      let next = null;
      for (const c of clocks) {
        if (c.riseAt !== null && (!next || c.riseAt < (next.riseAt ?? 0))) next = c;
      }
      if (!next) return null;
      return holdPosition(ctx, next.x, next.z, 6);
    }
    case "focus": {
      const target = ctx.enemies.find((u) => u.id === order.targetId);
      if (!target) return null;
      if (target.kind === "champion") {
        const cast = pickCast(ctx, target);
        if (cast) return cast;
      }
      return { kind: "attack", targetId: target.id };
    }
  }
}
function holdPosition(ctx, x, z, within2) {
  const { s } = ctx;
  if (hypot(x - s.x, z - s.z) <= within2) return { kind: "noop" };
  return { kind: "move", x, z };
}

// src/sim/playbook/interpreter.ts
var REFLEX_IDS = {
  dodge: "reflex:dodge",
  recastHome: "reflex:recast-home",
  level: "reflex:level",
  holdRecall: "reflex:hold-recall"
};
var IDLE_ID = "idle";
var REFLEXES = [
  { id: REFLEX_IDS.dodge, run: dodge },
  { id: REFLEX_IDS.recastHome, run: recastHome },
  { id: REFLEX_IDS.level, run: levelUp },
  { id: REFLEX_IDS.holdRecall, run: holdRecall }
];
function playbookPolicy(def, trace, map = GAME_MAP) {
  return (obs, rng) => {
    if (obs.self.dead) return { kind: "noop" };
    const ctx = buildSlotContext(obs, rng, def.kit, map);
    for (const reflex of REFLEXES) {
      const action = reflex.run(ctx);
      if (action) {
        trace?.(reflex.id, obs.self.id);
        return action;
      }
    }
    for (const play2 of def.plays) {
      if (play2.enabled === false) continue;
      if (!holds(play2.when, ctx)) continue;
      const action = runBehavior(play2.do, ctx);
      if (action) {
        trace?.(play2.id, obs.self.id);
        return action;
      }
    }
    trace?.(IDLE_ID, obs.self.id);
    return { kind: "noop" };
  };
}

// src/sim/content/playbooks/brawler.ts
var BRAWLER_PLAYBOOK = {
  version: 4,
  plays: [
    { id: "retreat", when: { kind: "hp", below: 0.25 }, do: { kind: "retreat" } },
    {
      id: "rest",
      when: { kind: "all", of: [{ kind: "atFountain" }, { kind: "hp", below: 0.7 }] },
      do: { kind: "hold" }
    },
    { id: "shop", when: { kind: "atFountain" }, do: { kind: "shop" } },
    {
      id: "shop-trip",
      when: {
        kind: "all",
        of: [
          { kind: "not", of: { kind: "atFountain" } },
          { kind: "gold", atLeast: 1e3 }
        ]
      },
      do: { kind: "goShop" }
    },
    // Dives with a thinner escort and deeper into the red than the Laner.
    {
      id: "avoid-tower",
      when: { kind: "underTower" },
      do: { kind: "avoidTower", escortMin: 2, hpBelow: 0.5 }
    },
    { id: "finish", when: { kind: "always" }, do: { kind: "finishSanctum" } },
    // The fight first, walking in only with the odds, the lowest enemy first.
    // A body nearly down beats a fight: the last strikes on a creature or
    // the Warden in reach land whatever is in sight (docs/plan-rings.md,
    // round two: bots dropped an 8 percent Warden for an arriving enemy
    // and it reset to full).
    {
      id: "finish-warden",
      when: { kind: "warden", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestWarden", partyAtLeast: 1 }
    },
    {
      id: "finish-creature",
      when: { kind: "creature", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestCreature", partyAtLeast: 1 }
    },
    {
      id: "fight",
      when: { kind: "enemyVisible" },
      do: { kind: "fight", stance: "auto", alone: "engage", target: "lowest", commitAt: 0.5 }
    },
    // The odds turned badly: under the tower, where they turn back.
    {
      id: "outnumbered",
      when: { kind: "odds", below: 0.4 },
      do: { kind: "fallBack" }
    },
    {
      id: "join",
      when: { kind: "allyFighting", within: 80 },
      do: { kind: "joinAlly", within: 80 }
    },
    {
      id: "hunt",
      when: { kind: "not", of: { kind: "enemyVisible" } },
      do: { kind: "hunt", hpAbove: 0.35 }
    },
    {
      id: "vanish",
      when: { kind: "not", of: { kind: "enemyVisible" } },
      do: { kind: "answerVanish", hpAtLeast: 0.4 }
    },
    { id: "warden", when: { kind: "always" }, do: { kind: "contestWarden" } },
    {
      id: "ascendant",
      when: { kind: "always" },
      do: { kind: "contestCreature", which: "ascendant" }
    },
    { id: "creature", when: { kind: "always" }, do: { kind: "contestCreature" } },
    { id: "farm", when: { kind: "always" }, do: { kind: "farm" } },
    { id: "siege", when: { kind: "always" }, do: { kind: "siege" } },
    { id: "push", when: { kind: "always" }, do: { kind: "push", regroupAt: 8 * 60 } }
  ]
};

// src/sim/content/bots/brawler.ts
var BRAWLER = {
  id: "brawler",
  name: "Brawler",
  policy: playbookPolicy(BRAWLER_PLAYBOOK),
  playbook: BRAWLER_PLAYBOOK
};

// src/sim/content/playbooks/jungler.ts
var JUNGLER_PLAYBOOK = {
  version: 4,
  lanes: ["jungle"],
  plays: [
    { id: "retreat", when: { kind: "hp", below: 0.32 }, do: { kind: "retreat" } },
    {
      id: "rest",
      when: { kind: "all", of: [{ kind: "atFountain" }, { kind: "hp", below: 0.7 }] },
      do: { kind: "hold" }
    },
    { id: "shop", when: { kind: "atFountain" }, do: { kind: "shop" } },
    {
      id: "shop-trip",
      when: {
        kind: "all",
        of: [
          { kind: "not", of: { kind: "atFountain" } },
          { kind: "gold", atLeast: 1e3 }
        ]
      },
      do: { kind: "goShop" }
    },
    { id: "avoid-tower", when: { kind: "underTower" }, do: { kind: "avoidTower" } },
    { id: "finish", when: { kind: "always" }, do: { kind: "finishSanctum" } },
    // A body nearly down beats a fight (docs/plan-rings.md, round two).
    {
      id: "finish-warden",
      when: { kind: "warden", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestWarden", partyAtLeast: 1 }
    },
    {
      id: "finish-creature",
      when: { kind: "creature", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestCreature", partyAtLeast: 1 }
    },
    // The objectives first, from anywhere on the map, with nobody close.
    {
      id: "warden",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: { kind: "contestWarden", hpAtLeast: 0.6, prepSeconds: 45 }
    },
    {
      id: "ascendant",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: {
        kind: "contestCreature",
        which: "ascendant",
        hpAtLeast: 0.6,
        prepSeconds: 45,
        within: 90
      }
    },
    {
      id: "creature",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: { kind: "contestCreature", hpAtLeast: 0.6, prepSeconds: 45, within: 90 }
    },
    {
      id: "outnumbered",
      when: {
        kind: "all",
        of: [
          { kind: "enemies", within: 15, atLeast: 2 },
          { kind: "allies", within: 15, atMost: 0 }
        ]
      },
      do: { kind: "fallBack" }
    },
    { id: "fight", when: { kind: "enemyVisible" }, do: { kind: "fight", alone: "hold" } },
    // The gank: an ally in a fight near is where the jungler goes, once it
    // has a few levels and the health for it (a level-one jungler that
    // joined every skirmish walked into tower fire, measured on seed 42).
    {
      id: "join",
      when: {
        kind: "all",
        of: [
          { kind: "allyFighting", within: 45 },
          { kind: "hp", atLeast: 0.6 },
          { kind: "level", atLeast: 3 }
        ]
      },
      do: { kind: "joinAlly", within: 45 }
    },
    // The round, with no enemy champion close: the team's sight of an
    // enemy across the map is not a reason to leave a camp.
    {
      id: "jungle",
      when: { kind: "enemies", within: 20, atMost: 0 },
      do: { kind: "jungle" }
    },
    { id: "hunt", when: { kind: "not", of: { kind: "enemyVisible" } }, do: { kind: "hunt" } },
    {
      id: "vanish",
      when: { kind: "not", of: { kind: "enemyVisible" } },
      do: { kind: "answerVanish" }
    },
    { id: "farm", when: { kind: "always" }, do: { kind: "farm" } },
    { id: "siege", when: { kind: "always" }, do: { kind: "siege" } },
    { id: "push", when: { kind: "always" }, do: { kind: "push", lane: "mid" } }
  ]
};

// src/sim/content/bots/jungler.ts
var JUNGLER = {
  id: "jungler",
  name: "Jungler",
  policy: playbookPolicy(JUNGLER_PLAYBOOK),
  playbook: JUNGLER_PLAYBOOK
};

// src/sim/content/playbooks/laner.ts
var LANER_PLAYBOOK = {
  version: 2,
  plays: [
    // Survive first: under a third of health, run home by the fastest
    // means (escape key, Riftstep, Zephyr, Mend, recall, feet).
    { id: "retreat", when: { kind: "hp", below: 0.32 }, do: { kind: "retreat" } },
    // Heal up before walking back out (fountain regen makes this quick).
    {
      id: "rest",
      when: { kind: "all", of: [{ kind: "atFountain" }, { kind: "hp", below: 0.7 }] },
      do: { kind: "hold" }
    },
    { id: "shop", when: { kind: "atFountain" }, do: { kind: "shop" } },
    // A full purse is a power spike waiting: go convert it once the bank
    // covers the next build step.
    {
      id: "shop-trip",
      when: {
        kind: "all",
        of: [
          { kind: "not", of: { kind: "atFountain" } },
          { kind: "gold", atLeast: 1e3 }
        ]
      },
      do: { kind: "goShop" }
    },
    { id: "avoid-tower", when: { kind: "underTower" }, do: { kind: "avoidTower" } },
    { id: "finish", when: { kind: "always" }, do: { kind: "finishSanctum" } },
    // A body nearly down beats a fight: the last strikes on a creature or
    // the Warden in reach land whatever is in sight (docs/plan-rings.md,
    // round two: bots dropped an 8 percent Warden for an arriving enemy
    // and it reset to full).
    {
      id: "finish-warden",
      when: { kind: "warden", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestWarden", partyAtLeast: 1 }
    },
    {
      id: "finish-creature",
      when: { kind: "creature", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestCreature", partyAtLeast: 1 }
    },
    { id: "fight", when: { kind: "enemyVisible" }, do: { kind: "fight" } },
    // A fight the team is already in beats anything below: scouting round 1
    // found a third of the deaths outnumbered and fights taken one bot at a
    // time; joining lifted the gate from 55% to 90% on its own.
    {
      id: "join",
      when: { kind: "allyFighting", within: 40 },
      do: { kind: "joinAlly" }
    },
    { id: "hunt", when: { kind: "not", of: { kind: "enemyVisible" } }, do: { kind: "hunt" } },
    {
      id: "vanish",
      when: { kind: "not", of: { kind: "enemyVisible" } },
      do: { kind: "answerVanish" }
    },
    { id: "warden", when: { kind: "always" }, do: { kind: "contestWarden" } },
    {
      id: "ascendant",
      when: { kind: "always" },
      do: { kind: "contestCreature", which: "ascendant" }
    },
    { id: "creature", when: { kind: "always" }, do: { kind: "contestCreature" } },
    { id: "farm", when: { kind: "always" }, do: { kind: "farm" } },
    { id: "camp", when: { kind: "not", of: { kind: "enemyVisible" } }, do: { kind: "takeCamp" } },
    { id: "siege", when: { kind: "always" }, do: { kind: "siege" } },
    { id: "push", when: { kind: "always" }, do: { kind: "push" } }
  ]
};

// src/sim/content/bots/laner.ts
var LANER = {
  id: "laner",
  name: "Laner",
  policy: playbookPolicy(LANER_PLAYBOOK),
  playbook: LANER_PLAYBOOK
};

// src/sim/content/playbooks/objective.ts
var OBJECTIVE_PLAYBOOK = {
  version: 2,
  plays: [
    { id: "retreat", when: { kind: "hp", below: 0.32 }, do: { kind: "retreat" } },
    {
      id: "rest",
      when: { kind: "all", of: [{ kind: "atFountain" }, { kind: "hp", below: 0.7 }] },
      do: { kind: "hold" }
    },
    { id: "shop", when: { kind: "atFountain" }, do: { kind: "shop" } },
    {
      id: "shop-trip",
      when: {
        kind: "all",
        of: [
          { kind: "not", of: { kind: "atFountain" } },
          { kind: "gold", atLeast: 1e3 }
        ]
      },
      do: { kind: "goShop" }
    },
    { id: "avoid-tower", when: { kind: "underTower" }, do: { kind: "avoidTower" } },
    { id: "finish", when: { kind: "always" }, do: { kind: "finishSanctum" } },
    {
      id: "warden",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: { kind: "contestWarden", hpAtLeast: 0.6, prepSeconds: 45 }
    },
    {
      id: "ascendant",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: {
        kind: "contestCreature",
        which: "ascendant",
        hpAtLeast: 0.6,
        prepSeconds: 45,
        within: 70
      }
    },
    {
      id: "creature",
      when: { kind: "enemies", within: 12, atMost: 0 },
      do: { kind: "contestCreature", hpAtLeast: 0.6, prepSeconds: 45, within: 70 }
    },
    {
      id: "outnumbered",
      when: {
        kind: "all",
        of: [
          { kind: "enemies", within: 15, atLeast: 2 },
          { kind: "allies", within: 15, atMost: 0 }
        ]
      },
      do: { kind: "fallBack" }
    },
    // A body nearly down beats a fight: the last strikes on a creature or
    // the Warden in reach land whatever is in sight (docs/plan-rings.md,
    // round two: bots dropped an 8 percent Warden for an arriving enemy
    // and it reset to full).
    {
      id: "finish-warden",
      when: { kind: "warden", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestWarden", partyAtLeast: 1 }
    },
    {
      id: "finish-creature",
      when: { kind: "creature", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestCreature", partyAtLeast: 1 }
    },
    { id: "fight", when: { kind: "enemyVisible" }, do: { kind: "fight", alone: "hold" } },
    {
      id: "join",
      when: { kind: "allyFighting", within: 60 },
      do: { kind: "joinAlly", within: 60 }
    },
    { id: "camp", when: { kind: "not", of: { kind: "enemyVisible" } }, do: { kind: "takeCamp" } },
    { id: "hunt", when: { kind: "not", of: { kind: "enemyVisible" } }, do: { kind: "hunt" } },
    {
      id: "vanish",
      when: { kind: "not", of: { kind: "enemyVisible" } },
      do: { kind: "answerVanish" }
    },
    { id: "farm", when: { kind: "always" }, do: { kind: "farm" } },
    { id: "siege", when: { kind: "always" }, do: { kind: "siege" } },
    { id: "push", when: { kind: "always" }, do: { kind: "push" } }
  ]
};

// src/sim/content/bots/objective.ts
var OBJECTIVE = {
  id: "objective",
  name: "Objective player",
  policy: playbookPolicy(OBJECTIVE_PLAYBOOK),
  playbook: OBJECTIVE_PLAYBOOK
};

// src/sim/content/playbooks/sieger.ts
var SIEGER_PLAYBOOK = {
  version: 4,
  plays: [
    { id: "retreat", when: { kind: "hp", below: 0.3 }, do: { kind: "retreat" } },
    {
      id: "rest",
      when: { kind: "all", of: [{ kind: "atFountain" }, { kind: "hp", below: 0.7 }] },
      do: { kind: "hold" }
    },
    { id: "shop", when: { kind: "atFountain" }, do: { kind: "shop" } },
    {
      id: "shop-trip",
      when: {
        kind: "all",
        of: [
          { kind: "not", of: { kind: "atFountain" } },
          { kind: "gold", atLeast: 1e3 }
        ]
      },
      do: { kind: "goShop" }
    },
    {
      id: "avoid-tower",
      when: { kind: "underTower" },
      do: { kind: "avoidTower", escortMin: 2, hpBelow: 0.5 }
    },
    { id: "finish", when: { kind: "always" }, do: { kind: "finishSanctum" } },
    // The odds turned badly: under the tower, where they turn back.
    {
      id: "outnumbered",
      when: { kind: "odds", below: 0.35 },
      do: { kind: "fallBack" }
    },
    // A body nearly down beats a fight: the last strikes on a creature or
    // the Warden in reach land whatever is in sight (docs/plan-rings.md,
    // round two: bots dropped an 8 percent Warden for an arriving enemy
    // and it reset to full).
    {
      id: "finish-warden",
      when: { kind: "warden", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestWarden", partyAtLeast: 1 }
    },
    {
      id: "finish-creature",
      when: { kind: "creature", state: "up", hpAtMost: 0.2, near: 10 },
      do: { kind: "contestCreature", partyAtLeast: 1 }
    },
    { id: "fight", when: { kind: "enemyVisible" }, do: { kind: "fight", alone: "hold" } },
    {
      id: "join",
      when: { kind: "allyFighting", within: 25 },
      do: { kind: "joinAlly", within: 25 }
    },
    { id: "siege", when: { kind: "always" }, do: { kind: "siege", escortMin: 1 } },
    {
      id: "warden",
      when: { kind: "hp", atLeast: 0.7 },
      do: { kind: "contestWarden", hpAtLeast: 0.7, prepSeconds: 10 }
    },
    {
      id: "ascendant",
      when: { kind: "hp", atLeast: 0.7 },
      do: { kind: "contestCreature", which: "ascendant", hpAtLeast: 0.7, prepSeconds: 10 }
    },
    {
      id: "creature",
      when: { kind: "hp", atLeast: 0.7 },
      do: { kind: "contestCreature", hpAtLeast: 0.7, prepSeconds: 10 }
    },
    { id: "farm", when: { kind: "always" }, do: { kind: "farm" } },
    { id: "push", when: { kind: "always" }, do: { kind: "push", regroupAt: null } }
  ]
};

// src/sim/content/bots/sieger.ts
var SIEGER = {
  id: "sieger",
  name: "Sieger",
  policy: playbookPolicy(SIEGER_PLAYBOOK),
  playbook: SIEGER_PLAYBOOK
};

// src/sim/content/bots/house.ts
var LANE_STYLES = [LANER, BRAWLER, SIEGER, OBJECTIVE];
var HOUSE_STYLES = [...LANE_STYLES, JUNGLER];
var HOUSE_STYLE_IDS = HOUSE_STYLES.map((b) => b.id);
function drawHouseStyle(rng) {
  return LANE_STYLES[rng.int(LANE_STYLES.length)].id;
}
function houseName(botId) {
  const def = HOUSE_STYLES.find((b) => b.id === botId) ?? LANER;
  return `House ${def.name.toLowerCase()}`;
}
function houseSeats(held2, rng, size = TEAM_SIZE, pool) {
  return fillSeats(held2, rng, size, pool).map((seat) => ({
    championId: seat.championId,
    bot: seat.kind === "jungle" ? JUNGLER.id : drawHouseStyle(rng)
  }));
}

// src/sim/content/bots/index.ts
var ALL2 = [...HOUSE_STYLES];
var BOTS = Object.fromEntries(ALL2.map((b) => [b.id, b]));
var DEFAULT_BOT_ID = LANER.id;
function attachBot(sim, unitId, botId) {
  const def = (botId !== void 0 ? BOTS[botId] : void 0) ?? BOTS[DEFAULT_BOT_ID];
  if (!def) return;
  if (def.playbook) sim.attachPlaybook(unitId, def.playbook);
  else sim.attachPolicy(unitId, def.policy);
}

// src/sim/content/sigils.ts
var RIFTSTEP = {
  id: "riftstep",
  name: "\u88C2\u9699\u6B65",
  cooldown: 150,
  castRange: 5.5,
  spec: { kind: "dash", range: 5.5 }
};
var ZEPHYR = {
  id: "zephyr",
  name: "\u548C\u98CE",
  cooldown: 150,
  castRange: 0,
  spec: {
    kind: "self_or_ally",
    searchRadius: 0,
    effects: [{ kind: "buff", duration: 6, msPct: 0.35 }]
  }
};
var MEND = {
  id: "mend",
  name: "\u6108\u5408",
  cooldown: 150,
  castRange: 7,
  spec: {
    kind: "self_or_ally",
    searchRadius: 2.5,
    effects: [{ kind: "heal", base: 100, maxHpPct: 0.15 }]
  }
};
var SEAR = {
  id: "sear",
  name: "\u707C\u70E7",
  cooldown: 120,
  castRange: 7,
  spec: {
    kind: "enemy_target",
    searchRadius: 2,
    effects: [
      { kind: "dot", duration: 3, perSecond: 30, dtype: "magic" },
      { kind: "grievous", duration: 3, factor: 0.4 }
    ]
  }
};
var SIGILS = {
  [RIFTSTEP.id]: RIFTSTEP,
  [ZEPHYR.id]: ZEPHYR,
  [MEND.id]: MEND,
  [SEAR.id]: SEAR
};
var SIGIL_LIST = [RIFTSTEP, ZEPHYR, MEND, SEAR];

// src/sim/content/warden.ts
var WARDEN_BODY = {
  hp: 12500,
  ad: 10,
  bitePct: 8e-3,
  armor: 50,
  mr: 50,
  attackRange: 2,
  attackSpeed: 0.6,
  moveSpeed: 3,
  radius: 1.1,
  xpBounty: 200
};
var WARDEN_GOLD_BOUNTY = 150;
var WARDEN_CONTENT = { body: WARDEN_BODY, goldBounty: WARDEN_GOLD_BOUNTY };

// src/sim/content/fingerprint.ts
function hash(text2) {
  let h = 2166136261;
  for (let i = 0; i < text2.length; i += 1) {
    h ^= text2.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function hashInt16(values) {
  let h = 2166136261;
  for (let i = 0; i < values.length; i += 1) {
    h ^= values[i] & 65535;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const entries = Object.entries(value).filter(([, v]) => v !== void 0 && typeof v !== "function").sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
}
function championShape(c) {
  return {
    id: c.id,
    role: c.role,
    base: c.base,
    growth: c.growth,
    abilities: c.abilities,
    passive: c.passive ?? null
  };
}
function fingerprintOf(content) {
  return hash(canonical(content));
}
var cached = /* @__PURE__ */ new WeakMap();
function contentFingerprint(orchard) {
  let value = cached.get(orchard);
  if (value === void 0) {
    const grid = orchard.navigation;
    value = fingerprintOf({
      dt: DT,
      champions: CHAMPION_LIST.map(championShape),
      items: ITEM_LIST,
      sigils: SIGIL_LIST,
      // The rings' creatures, clocks and favors (content/rings.ts).
      rings: RINGS_CONTENT,
      warden: WARDEN_CONTENT,
      // The forests' camps (content/camps.ts).
      camps: CAMPS_CONTENT,
      map: orchard.map,
      terrain: {
        revision: orchard.revision,
        source: orchard.sourceSha256,
        cells: grid.cells,
        cellSize: grid.cellSize,
        origin: grid.origin,
        heightScale: grid.heightScale,
        blockedValue: grid.blockedValue,
        heights: hashInt16(grid.heights)
      },
      // The house bots by what they DO: a policy is code, so the ids
      // and their playbooks are the most a table can say about them.
      bots: Object.entries(BOTS).map(([id, b]) => [id, b.playbook ?? null]).sort()
    });
    cached.set(orchard, value);
  }
  return value;
}

// src/sim/attack_move.ts
var ACQUIRE_RADIUS = 8;
var ARRIVE_RADIUS = 1.2;
function stepAttackMove(sim) {
  for (const u of sim.units.values()) {
    if (u.kind !== "champion" || u.dead || u.attackMoveTarget === null) continue;
    const goal = u.attackMoveTarget;
    if (u.attackTargetId === null) {
      let best = null;
      let bestD = Number.POSITIVE_INFINITY;
      for (const o of sim.units.values()) {
        if (o.team === u.team || o.neutral || o.dead) continue;
        if (!sim.isVisible(u.team, o.id)) continue;
        const d = hypot(o.pos.x - u.pos.x, o.pos.z - u.pos.z);
        if (d <= ACQUIRE_RADIUS && d < bestD) {
          bestD = d;
          best = o.id;
        }
      }
      if (best !== null) {
        u.attackTargetId = best;
      } else if (u.path.length === 0) {
        const d = hypot(goal.x - u.pos.x, goal.z - u.pos.z);
        if (d <= ARRIVE_RADIUS) {
          u.attackMoveTarget = null;
        } else {
          sim.orderPath(u.id, goal.x, goal.z);
        }
      }
    }
  }
}

// src/sim/action_dispatch.ts
function finite2(a, b) {
  return Number.isFinite(a) && Number.isFinite(b);
}
function dispatchAction(sim, unitId, action) {
  const u = sim.units.get(unitId);
  if (!u) return false;
  switch (action.kind) {
    case "move":
      if (!finite2(action.x, action.z)) return false;
      sim.orderMove(unitId, action.x, action.z);
      return true;
    case "attack":
      if (!Number.isInteger(action.targetId)) return false;
      if (!sim.isVisible(u.team, action.targetId)) return false;
      sim.orderAttack(unitId, action.targetId);
      return true;
    case "cast":
      if (!finite2(action.x, action.z)) return false;
      sim.castAbility(unitId, action.key, { x: action.x, z: action.z });
      return true;
    case "sigil":
      if (action.slot !== 0 && action.slot !== 1) return false;
      if (!finite2(action.x, action.z)) return false;
      sim.castSigil(unitId, action.slot, { x: action.x, z: action.z });
      return true;
    case "buy":
      if (typeof action.itemId !== "string") return false;
      sim.buyItem(unitId, action.itemId);
      return true;
    case "level":
      sim.levelAbility(unitId, action.key);
      return true;
    case "recall":
      sim.startRecall(unitId);
      return true;
    case "sell":
      if (!Number.isInteger(action.slot) || action.slot < 0) return false;
      sim.sellItem(unitId, action.slot);
      return true;
    case "stop":
      sim.orderStop(unitId);
      return true;
    default:
      return true;
  }
}

// src/sim/stats.ts
function sumItemStats(items) {
  const out = {
    hp: 0,
    mana: 0,
    ad: 0,
    ap: 0,
    armor: 0,
    mr: 0,
    attackSpeedPct: 0,
    moveSpeed: 0,
    armorPen: 0,
    mrPen: 0,
    armorPenPct: 0,
    mrPenPct: 0
  };
  for (const id of items) {
    const def = ITEMS[id];
    if (!def) continue;
    out.hp += def.stats.hp ?? 0;
    out.mana += def.stats.mana ?? 0;
    out.ad += def.stats.ad ?? 0;
    out.ap += def.stats.ap ?? 0;
    out.armor += def.stats.armor ?? 0;
    out.mr += def.stats.mr ?? 0;
    out.attackSpeedPct += def.stats.attackSpeedPct ?? 0;
    out.moveSpeed += def.stats.moveSpeed ?? 0;
    out.armorPen += def.stats.armorPen ?? 0;
    out.mrPen += def.stats.mrPen ?? 0;
    out.armorPenPct += def.stats.armorPenPct ?? 0;
    out.mrPenPct += def.stats.mrPenPct ?? 0;
  }
  return out;
}
function recalcChampion(u) {
  const def = u.champion;
  if (!def) return;
  const lvl = u.level - 1;
  const items = sumItemStats(u.items);
  const newMaxHp = def.base.hp + def.growth.hp * lvl + items.hp;
  const hpDelta = newMaxHp - u.maxHp;
  u.maxHp = newMaxHp;
  u.hp = Math.min(u.maxHp, Math.max(0, u.hp + Math.max(0, hpDelta)));
  const newMaxMana = def.base.mana + def.growth.mana * lvl + items.mana;
  const manaDelta = newMaxMana - u.maxMana;
  u.maxMana = newMaxMana;
  u.mana = Math.min(u.maxMana, Math.max(0, u.mana + Math.max(0, manaDelta)));
  const might = 1 + favorBonus(u.favors, "might");
  const bulwark = 1 + favorBonus(u.favors, "bulwark");
  u.stats.ad = (def.base.ad + def.growth.ad * lvl + items.ad) * might;
  u.stats.ap = items.ap * might;
  u.stats.armor = (def.base.armor + def.growth.armor * lvl + items.armor) * bulwark;
  u.stats.mr = (def.base.mr + def.growth.mr * lvl + items.mr) * bulwark;
  u.stats.attackSpeed = def.base.attackSpeed * (1 + items.attackSpeedPct + favorBonus(u.favors, "tempo"));
  u.stats.armorPen = items.armorPen;
  u.stats.mrPen = items.mrPen;
  u.stats.armorPenPct = Math.min(0.7, items.armorPenPct);
  u.stats.mrPenPct = Math.min(0.7, items.mrPenPct);
  u.moveSpeed = def.base.moveSpeed + items.moveSpeed;
}
function xpForNext(level) {
  return 85 + 52 * level;
}
var MAX_LEVEL = 18;
function gainXp(u, amount) {
  if (u.kind !== "champion" || u.level >= MAX_LEVEL) {
    if (u.kind === "champion") u.xp += amount;
    return;
  }
  u.xp += amount;
  while (u.level < MAX_LEVEL && u.xp >= xpForNext(u.level)) {
    u.xp -= xpForNext(u.level);
    u.level += 1;
    u.skillPoints += 1;
    recalcChampion(u);
  }
}
function levelTo(u, level) {
  if (u.kind !== "champion") return;
  const target = Math.min(MAX_LEVEL, Math.floor(level));
  while (u.level < target) gainXp(u, xpForNext(u.level) - u.xp);
}
function effectiveRank(u, key) {
  const stored = u.abilityRanks[key] ?? 0;
  if (key === "R") return stored > 0 ? stored : u.level >= 6 ? 1 : 0;
  return stored;
}
var BASIC_MAX_RANK = 5;
var ULT_MAX_RANK = 3;
var ULT_RANK_LEVELS = [6, 11, 16];
var RANK_BASE_SCALE = 0.55;
var RANK_CD_SCALE = 0.06;

// src/sim/observe.ts
var KEYS = ["Q", "W", "E", "R"];
var OBS_STATUS_KINDS = [
  "stun",
  "root",
  "airborne",
  "slow",
  "shield"
];
function velocityOf(u, time) {
  if (u.activeDash) {
    return {
      vx: u.activeDash.dir.x * u.activeDash.speed,
      vz: u.activeDash.dir.z * u.activeDash.speed
    };
  }
  const wp = u.path[0];
  if (!wp || u.pendingSpell) return { vx: 0, vz: 0 };
  const dx = wp.x - u.pos.x;
  const dz = wp.z - u.pos.z;
  const d = hypot(dx, dz);
  if (d < 1e-6) return { vx: 0, vz: 0 };
  const speed = effectiveMoveSpeed(u, time);
  return { vx: dx / d * speed, vz: dz / d * speed };
}
function buildObservation(sim, unitId) {
  const u = sim.units.get(unitId);
  if (u?.kind !== "champion" || u.championId === null) return null;
  const def = u.champion;
  if (!def) return null;
  const abilityReady = { Q: false, W: false, E: false, R: false };
  const abilityRanks = { Q: 0, W: 0, E: 0, R: 0 };
  for (const key of KEYS) {
    const a = def.abilities[key];
    abilityRanks[key] = effectiveRank(u, key);
    abilityReady[key] = (u.cooldowns[key] ?? 0) <= sim.time && u.mana >= a.manaCost && abilityRanks[key] > 0;
    if (u.recastArmed && u.recastArmed.key === key && u.recastArmed.until > sim.time) {
      abilityReady[key] = true;
    }
  }
  const sigilReady = u.sigils.map((id, slot) => {
    if (!SIGILS[id]) return false;
    return (u.sigilCooldowns[slot] ?? 0) <= sim.time;
  });
  const units = [];
  for (const other of sim.units.values()) {
    if (other.id === u.id) continue;
    if (!sim.isVisible(u.team, other.id)) continue;
    const row = {
      id: other.id,
      kind: other.kind,
      // The neutral Warden reads as hostile to BOTH teams.
      friendly: !other.neutral && other.team === u.team,
      x: other.pos.x,
      z: other.pos.z,
      hpFrac: other.maxHp > 0 ? other.hp / other.maxHp : 0,
      hp: other.hp,
      maxHp: other.maxHp,
      radius: other.radius
    };
    if (other.kind === "tower" || other.kind === "sanctum") {
      row.invulnerable = isInvulnerable(sim.units, other);
    }
    const vel = velocityOf(other, sim.time);
    row.vx = vel.vx;
    row.vz = vel.vz;
    if (other.kind === "champion") {
      const visible = [];
      for (const st of other.statuses) {
        if (st.until <= sim.time) continue;
        if (OBS_STATUS_KINDS.includes(st.kind)) {
          visible.push({ kind: st.kind, until: st.until });
        }
      }
      if (visible.length > 0) row.statuses = visible;
      if (other.championId) row.championId = other.championId;
      row.items = [...other.items];
      row.level = other.level;
    }
    if (other.kind === "champion" && other.pendingSpell && other.championId) {
      const pending = other.pendingSpell;
      const spec = other.champion?.abilities[pending.key]?.spec;
      const selfCentered = spec?.kind === "burst" || spec?.kind === "cone";
      row.windup = {
        key: pending.key,
        x: selfCentered ? other.pos.x : pending.aim.x,
        z: selfCentered ? other.pos.z : pending.aim.z,
        resolveAt: pending.resolveAt
      };
    }
    units.push(row);
  }
  const projectiles = [];
  for (const p of sim.projectiles.values()) {
    const friendly = p.team === u.team;
    if (!friendly && !sim.isPointVisible(u.team, p.pos.x, p.pos.z)) continue;
    projectiles.push({
      x: p.pos.x,
      z: p.pos.z,
      dirX: p.dir.x,
      dirZ: p.dir.z,
      speed: p.speed,
      radius: p.radius,
      friendly,
      homing: p.homingTargetId !== null
    });
  }
  const zones = [];
  for (const z of sim.zones.values()) {
    const friendly = z.team === u.team;
    if (!friendly && !sim.isPointVisible(u.team, z.pos.x, z.pos.z)) continue;
    zones.push({
      x: z.pos.x,
      z: z.pos.z,
      radius: z.radius,
      friendly,
      detonateAt: z.detonateAt
    });
  }
  const LAST_SEEN_FRESH_S = 4;
  const lastSeen = [];
  for (const [id, rec] of sim.lastSeen[u.team]) {
    if (sim.time - rec.at > LAST_SEEN_FRESH_S) continue;
    const other = sim.units.get(id);
    if (!other || other.dead) continue;
    if (sim.isVisible(u.team, id)) continue;
    lastSeen.push({ id, x: rec.x, z: rec.z, at: rec.at, hpFrac: rec.hpFrac });
  }
  const seats = [];
  for (const other of sim.units.values()) {
    if (other.kind !== "champion" || other.neutral || !other.championId) continue;
    const role = other.champion?.role;
    if (!role) continue;
    seats.push({
      id: other.id,
      team: other.team,
      championId: other.championId,
      role,
      ...other.team === u.team ? { lane: other.lane } : {},
      dead: other.dead
    });
  }
  const walls = [];
  for (const w of sim.walls.values()) {
    walls.push({
      x1: w.a.x,
      z1: w.a.z,
      x2: w.b.x,
      z2: w.b.z,
      friendly: w.team === u.team,
      until: w.until
    });
  }
  const pit = sim.wardenPit();
  return {
    tick: sim.tickCount,
    time: sim.time,
    winner: sim.winner,
    self: {
      id: u.id,
      team: u.team,
      x: u.pos.x,
      z: u.pos.z,
      hp: u.hp,
      maxHp: u.maxHp,
      hpFrac: u.maxHp > 0 ? u.hp / u.maxHp : 0,
      mana: u.mana,
      maxMana: u.maxMana,
      level: u.level,
      gold: u.gold,
      dead: u.dead,
      abilityReady,
      abilityRanks,
      skillPoints: u.skillPoints,
      sigils: [...u.sigils],
      sigilReady,
      items: [...u.items],
      championId: u.championId,
      attackRange: u.stats.attackRange,
      attackReadyAt: u.attackReadyAt,
      attackDamage: u.stats.ad,
      holding: u.holding,
      attackSwingUntil: u.pendingAttack ? u.pendingAttack.resolveAt : null,
      recastArmed: u.recastArmed && u.recastArmed.until > sim.time ? u.recastArmed.key : null,
      lane: u.kind === "champion" ? u.lane : null,
      recalling: u.statuses.some((s) => s.kind === "recall" && s.until > sim.time),
      // The owner's coach order, additive: absent for every uncoached seat.
      ...u.coachOrder ? { coachOrder: u.coachOrder } : {}
    },
    units,
    objectiveSpawnAt: sim.objectiveSpawnAt(),
    wardenRoseAt: sim.objectives.roseAt,
    ...pit ? { wardenPit: { x: pit.x, z: pit.z } } : {},
    creatures: sim.ringClocks(),
    camps: sim.campsFor(u.team),
    projectiles,
    zones,
    walls,
    lastSeen,
    seats,
    laneOpponents: sim.laneOpponents(u.team),
    laneActivity: sim.laneActivity(u.team)
  };
}

// src/sim/bot_driver.ts
var POLICY_PERIOD_TICKS = 5;
function isDecisionSlot(tickCount, unitId) {
  return (tickCount + unitId) % POLICY_PERIOD_TICKS === 0;
}
function runBotDecisions(sim, policies) {
  for (const [unitId, policy] of policies) {
    if (!isDecisionSlot(sim.tickCount, unitId)) continue;
    const u = sim.units.get(unitId);
    if (!u || u.dead) continue;
    const obs = buildObservation(sim, unitId);
    if (!obs) continue;
    dispatchAction(sim, unitId, policy(obs, sim.rng));
  }
}

// src/sim/unit.ts
function staticFootprint(u) {
  return u.radius + 0.4;
}
function hostile(a, b) {
  if (a.id === b.id) return false;
  if (a.neutral || b.neutral) return true;
  return a.team !== b.team;
}
function baseUnit(id, team2, kind, pos) {
  return {
    id,
    team: team2,
    neutral: false,
    kind,
    championId: null,
    champion: null,
    pos: { x: pos.x, z: pos.z },
    radius: 0.6,
    moveSpeed: 0,
    hp: 1,
    maxHp: 1,
    mana: 0,
    maxMana: 0,
    stats: {
      ad: 0,
      ap: 0,
      armor: 0,
      mr: 0,
      attackRange: 0,
      attackSpeed: 0,
      hpRegen: 0,
      manaRegen: 0,
      armorPen: 0,
      mrPen: 0,
      armorPenPct: 0,
      mrPenPct: 0
    },
    statuses: [],
    cooldowns: {},
    // Every rank is earned: level 1 grants one point to place (the level 1
    // skill choice the genre opens with).
    abilityRanks: { Q: 0, W: 0, E: 0, R: 0 },
    skillPoints: 0,
    skin: 0,
    passiveStacks: 0,
    lastDamagedAt: -999,
    lastDealtDamageAt: -999,
    favors: NO_FAVORS,
    creatureId: null,
    aspect: null,
    ascendant: false,
    campKind: null,
    bitePct: 0,
    play: null,
    coachOrder: null,
    coachOrderSeenAt: 0,
    lanePrefer: null,
    attackTargetId: null,
    attackReadyAt: 0,
    attackMoveTarget: null,
    holding: false,
    pendingSpell: null,
    activeDash: null,
    recastArmed: null,
    pendingAttack: null,
    path: [],
    level: 1,
    xp: 0,
    gold: 0,
    items: [],
    kills: 0,
    deaths: 0,
    assists: 0,
    cs: 0,
    killStreak: 0,
    recentDamagers: [],
    dead: false,
    respawnAt: 0,
    lastHitByChampion: 0,
    lastHitAt: -999,
    sightRange: 8,
    goldBounty: 0,
    xpBounty: 0,
    sigils: [],
    sigilCooldowns: [],
    decisionTokens: 2,
    decisionRefillAt: 0,
    structure: null,
    lane: null,
    laneProgress: 0
  };
}
function createChampion(id, team2, pos, def) {
  const b = def.base;
  const u = baseUnit(id, team2, "champion", pos);
  u.championId = def.id;
  u.champion = def;
  u.radius = b.radius;
  u.moveSpeed = b.moveSpeed;
  u.hp = b.hp;
  u.maxHp = b.hp;
  u.mana = b.mana;
  u.maxMana = b.mana;
  u.stats = {
    ad: b.ad,
    ap: b.ap,
    armor: b.armor,
    mr: b.mr,
    attackRange: b.attackRange,
    attackSpeed: b.attackSpeed,
    hpRegen: b.hpRegen,
    manaRegen: b.manaRegen,
    armorPen: 0,
    mrPen: 0,
    armorPenPct: 0,
    mrPenPct: 0
  };
  u.gold = 500;
  u.skillPoints = 1;
  u.sightRange = 12;
  u.goldBounty = 300;
  u.xpBounty = 200;
  u.sigils = ["riftstep", "mend"];
  u.sigilCooldowns = [0, 0];
  return u;
}
function createMinion(id, team2, variant, lane, pos, scale = 1) {
  const u = baseUnit(id, team2, "minion", pos);
  u.lane = lane;
  u.laneProgress = 1;
  u.moveSpeed = 3.4;
  if (variant === "melee") {
    u.radius = 0.5;
    u.hp = 455;
    u.stats.ad = 12;
    u.stats.attackRange = 0.5;
    u.stats.attackSpeed = 1.25;
    u.goldBounty = 21;
    u.xpBounty = 60;
  } else if (variant === "caster") {
    u.radius = 0.4;
    u.hp = 290;
    u.stats.ad = 23;
    u.stats.attackRange = 6;
    u.stats.attackSpeed = 0.67;
    u.goldBounty = 14;
    u.xpBounty = 30;
  } else if (variant === "siege") {
    u.radius = 0.6;
    u.hp = 900;
    u.stats.ad = 45;
    u.stats.attackRange = 4;
    u.stats.attackSpeed = 0.5;
    u.goldBounty = 60;
    u.xpBounty = 90;
  } else {
    u.radius = 0.85;
    u.moveSpeed = 3;
    u.hp = 1500;
    u.stats.ad = 65;
    u.stats.armor = 20;
    u.stats.mr = 20;
    u.stats.attackRange = 1.2;
    u.stats.attackSpeed = 0.6;
    u.goldBounty = 90;
    u.xpBounty = 130;
  }
  u.hp = Math.round(u.hp * scale);
  u.maxHp = u.hp;
  u.stats.ad = Math.round(u.stats.ad * scale);
  return u;
}
function growBody(u, body, time) {
  u.radius = body.radius;
  u.moveSpeed = body.moveSpeed;
  u.hp = Math.round(body.hp * bodyGrowth(time));
  u.maxHp = u.hp;
  u.stats.ad = Math.round(body.ad * biteGrowth(time));
  u.bitePct = body.bitePct;
  u.stats.armor = body.armor;
  u.stats.mr = body.mr;
  u.stats.attackRange = body.attackRange;
  u.stats.attackSpeed = body.attackSpeed;
  u.sightRange = 8;
  u.xpBounty = body.xpBounty;
}
function createWarden(id, pos, time = 0) {
  const u = baseUnit(id, 0, "warden", pos);
  u.neutral = true;
  growBody(u, WARDEN_BODY, time);
  u.goldBounty = WARDEN_GOLD_BOUNTY;
  return u;
}
function createCreature(id, def, pos, aspect, time = 0) {
  const u = baseUnit(id, 0, "creature", pos);
  u.neutral = true;
  u.creatureId = def.id;
  u.aspect = aspect;
  u.ascendant = aspect === null;
  growBody(u, u.ascendant ? def.ascendant.body : def.body, time);
  u.goldBounty = 0;
  return u;
}
function createCamp(id, def, pos, time = 0) {
  const u = baseUnit(id, 0, "camp", pos);
  u.neutral = true;
  u.campKind = def.id;
  growBody(u, def.body, time);
  u.sightRange = 6;
  u.goldBounty = def.goldBounty;
  return u;
}
function createTower(id, team2, pos, structure) {
  const u = baseUnit(id, team2, "tower", pos);
  u.radius = 1.4;
  u.hp = 1800;
  u.maxHp = 1800;
  u.stats.ad = 170;
  u.stats.armor = 25;
  u.stats.mr = 25;
  u.stats.attackRange = 9;
  u.stats.attackSpeed = 0.83;
  u.sightRange = 10;
  u.goldBounty = 250;
  u.xpBounty = 100;
  u.structure = structure;
  return u;
}
function createSanctum(id, team2, pos) {
  const u = baseUnit(id, team2, "sanctum", pos);
  u.radius = 2.2;
  u.hp = 3e3;
  u.maxHp = 3e3;
  u.stats.armor = 25;
  u.stats.mr = 25;
  return u;
}

// src/sim/camps.ts
var CAMP_LEASH_RANGE = 10;
var CAMP_CALM_S = 5;
function initialCampStates(map) {
  return map.camps.map((spot) => ({
    spot,
    unitIds: [],
    nextSpawnAt: CAMP_FIRST_SPAWN_S,
    seen: [null, null]
  }));
}
function campStands(spot, kind) {
  const def = CAMPS[kind];
  const gap = def.body.radius * 2.4;
  const out = [];
  for (let i = 0; i < def.count; i++) {
    const side2 = i === 0 ? 0 : i % 2 === 1 ? 1 : -1;
    const row = Math.ceil(i / 2);
    out.push({ x: spot.x + side2 * gap * row, z: spot.z + gap * 0.7 * row });
  }
  return out;
}
function nearestHostileChampion(ctx, from, range2) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.dead || ctx.dead.has(u.id)) continue;
    if (!hostile(from, u)) continue;
    const d = hypot(u.pos.x - from.pos.x, u.pos.z - from.pos.z);
    if (d <= range2 && d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
function stepCamps(ctx, states) {
  for (const state of states) {
    if (state.unitIds.length === 0) {
      if (ctx.time >= state.nextSpawnAt) {
        const def = CAMPS[state.spot.kind];
        for (const stand of campStands(state.spot, state.spot.kind)) {
          const at = ctx.nav.isWalkableAt(stand.x, stand.z) ? stand : ctx.nav.nearestWalkable(stand.x, stand.z) ?? { x: state.spot.x, z: state.spot.z };
          const id = ctx.allocId();
          ctx.units.set(id, createCamp(id, def, at, ctx.time));
          state.unitIds.push(id);
        }
      }
      continue;
    }
    for (const unitId of state.unitIds) {
      const c = ctx.units.get(unitId);
      if (!c || c.dead || ctx.dead.has(c.id)) continue;
      const fromSpot = hypot(c.pos.x - state.spot.x, c.pos.z - state.spot.z);
      const angry = ctx.time - c.lastDamagedAt <= CAMP_CALM_S;
      if (fromSpot > CAMP_LEASH_RANGE || !angry && (c.hp < c.maxHp || fromSpot > 3)) {
        c.hp = c.maxHp;
        c.pos = { x: state.spot.x, z: state.spot.z };
        c.path = [];
        c.attackTargetId = null;
        c.statuses = [];
        continue;
      }
      if (angry) {
        const target = c.attackTargetId !== null ? ctx.units.get(c.attackTargetId) : void 0;
        const targetOk = target && !target.dead && !ctx.dead.has(target.id) && hypot(target.pos.x - state.spot.x, target.pos.z - state.spot.z) <= CAMP_LEASH_RANGE;
        if (!targetOk) {
          const next = nearestHostileChampion(ctx, c, CAMP_LEASH_RANGE);
          c.attackTargetId = next ? next.id : null;
        }
      } else {
        c.attackTargetId = null;
      }
    }
  }
}
function onCampSlain(states, unitId, killer, time) {
  const state = states.find((s) => s.unitIds.includes(unitId));
  if (!state) return;
  const def = CAMPS[state.spot.kind];
  state.unitIds = state.unitIds.filter((id) => id !== unitId);
  if (state.unitIds.length === 0) state.nextSpawnAt = time + def.respawnS;
  if (def.buff && killer && killer.kind === "champion" && !killer.dead) {
    addStatus(killer, {
      kind: "buff",
      until: time + CAMP_BUFF_DURATION_S,
      msPct: 0,
      asPct: CAMP_BUFF_AS_PCT,
      armor: 0,
      mr: 0
    });
  }
}
function noteCampSightings(states, time, isPointVisible) {
  if (time < CAMP_FIRST_SPAWN_S) return;
  for (const state of states) {
    const up = state.unitIds.length > 0;
    for (const team2 of [0, 1]) {
      if (!isPointVisible(team2, state.spot.x, state.spot.z)) continue;
      const before = state.seen[team2];
      state.seen[team2] = {
        at: time,
        up,
        downSince: up ? null : before && !before.up ? before.downSince : time
      };
    }
  }
}

// src/sim/forge/passive_templates.ts
var AURA_REFRESH_S = 0.4;
var CARAPACE_LINGER_S = 6;
function pct(v) {
  return `${Math.round(v * 100)} percent`;
}
function nearestOtherAlly(ctx, self, around, range2) {
  let best = null;
  let bestD = range2;
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.team !== self.team) continue;
    if (u.id === around.id || u.id === self.id || u.dead || ctx.dead.has(u.id)) continue;
    const d = hypot(u.pos.x - around.pos.x, u.pos.z - around.pos.z);
    if (d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
var ALL3 = [
  {
    id: "warding_aura",
    summary: "Nearby allied champions gain armor and magic resist.",
    params: [
      { key: "radius", min: 3, max: 8, costPerUnit: 2 },
      { key: "armor", min: 0, max: 15, costPerUnit: 3 },
      { key: "mr", min: 0, max: 15, costPerUnit: 3 }
    ],
    baseCost: 10,
    describe: ({ radius = 3, armor = 0, mr = 0 }) => `Allied champions within ${radius} gain ${armor} bonus armor and ${mr} bonus magic resist.`,
    create: ({ radius = 3, armor = 0, mr = 0 }) => ({
      onTick(ctx, self) {
        for (const u of ctx.units.values()) {
          if (u.kind !== "champion" || u.team !== self.team || u.dead || ctx.dead.has(u.id)) {
            continue;
          }
          if (hypot(u.pos.x - self.pos.x, u.pos.z - self.pos.z) > radius) continue;
          refreshBuff(u, ctx.time, AURA_REFRESH_S, { armor, mr });
        }
      }
    })
  },
  {
    id: "serrated_strikes",
    summary: "Attacks apply a short stacking bleed.",
    params: [
      { key: "perSecond", min: 1, max: 8, costPerUnit: 4 },
      { key: "perLevel", min: 0, max: 1.5, costPerUnit: 30 },
      { key: "duration", min: 1, max: 4, costPerUnit: 4 }
    ],
    baseCost: 10,
    describe: ({ perSecond = 1, perLevel = 0, duration = 1 }) => `Attacks open a ${duration} second bleed dealing ${perSecond} physical damage per second, plus ${perLevel} per level. Bleeds stack.`,
    create: ({ perSecond = 1, perLevel = 0, duration = 1 }) => ({
      onAttackHit(ctx, self, target) {
        if (target.kind === "tower" || target.kind === "sanctum") return;
        addStatus(target, {
          kind: "dot",
          until: ctx.time + duration,
          perSecond: perSecond + perLevel * self.level,
          sourceId: self.id,
          dtype: "physical"
        });
      }
    })
  },
  {
    id: "executioner",
    summary: "Bonus damage to enemies below a health threshold.",
    params: [
      { key: "hpThreshold", min: 0.1, max: 0.5, costPerUnit: 40 },
      { key: "bonusPct", min: 0.05, max: 0.3, costPerUnit: 250 }
    ],
    baseCost: 5,
    describe: ({ hpThreshold = 0.1, bonusPct = 0.05 }) => `Deals ${pct(bonusPct)} bonus damage to enemies below ${pct(hpThreshold)} health.`,
    create: ({ hpThreshold = 0.1, bonusPct = 0.05 }) => ({
      modifyDamage(_ctx, _self, target, amount) {
        if (target.maxHp <= 0 || target.hp / target.maxHp >= hpThreshold) return amount;
        return amount * (1 + bonusPct);
      }
    })
  },
  {
    id: "battle_flow",
    summary: "Dealing ability damage grants a brief burst of move speed.",
    params: [
      { key: "msPct", min: 0.03, max: 0.15, costPerUnit: 300 },
      { key: "duration", min: 0.5, max: 2, costPerUnit: 8 }
    ],
    baseCost: 5,
    describe: ({ msPct = 0.03, duration = 0.5 }) => `Dealing ability damage grants ${pct(msPct)} move speed for ${duration} seconds.`,
    create: ({ msPct = 0.03, duration = 0.5 }) => ({
      modifyDamage(ctx, self, _target, amount, _dtype, via) {
        if (via === "ability" && amount > 0) {
          refreshBuff(self, ctx.time, duration, { msPct });
        }
        return amount;
      }
    })
  },
  {
    id: "rhythm_echo",
    summary: "Every Nth attack strikes a second time.",
    params: [
      { key: "every", min: 2, max: 5, integer: true, costPerUnit: -10 },
      { key: "adRatio", min: 0.2, max: 0.8, costPerUnit: 150 }
    ],
    baseCost: 10,
    describe: ({ every = 2, adRatio = 0.2 }) => `Every ${every} attacks, the strike echoes for ${pct(adRatio)} attack damage.`,
    create: ({ every = 2, adRatio = 0.2 }) => ({
      onAttackHit(ctx, self, target) {
        self.passiveStacks += 1;
        if (self.passiveStacks < every) return;
        self.passiveStacks = 0;
        dealDamage(ctx, self.id, target, self.stats.ad * adRatio, "physical", "other");
      }
    })
  },
  {
    id: "calm_carapace",
    summary: "Gain a shield after a few seconds without taking damage.",
    params: [
      { key: "calmSeconds", min: 3, max: 8, costPerUnit: -2 },
      { key: "shieldBase", min: 10, max: 60, costPerUnit: 0.5 },
      { key: "shieldPerLevel", min: 0, max: 12, costPerUnit: 4 }
    ],
    baseCost: 5,
    describe: ({ calmSeconds = 3, shieldBase = 10, shieldPerLevel = 0 }) => `After ${calmSeconds} seconds without taking damage, gains a shield of ${shieldBase} plus ${shieldPerLevel} per level.`,
    create: ({ calmSeconds = 3, shieldBase = 10, shieldPerLevel = 0 }) => ({
      onTick(ctx, self) {
        if (ctx.time - self.lastDamagedAt < calmSeconds) return;
        if (self.statuses.some((s) => s.kind === "shield" && s.until > ctx.time)) return;
        addStatus(self, {
          kind: "shield",
          until: ctx.time + CARAPACE_LINGER_S,
          remaining: shieldBase + shieldPerLevel * self.level
        });
      }
    })
  },
  {
    id: "predators_focus",
    summary: "Attacks hit harder against slowed or immobilized targets.",
    params: [{ key: "bonusPct", min: 0.05, max: 0.3, costPerUnit: 250 }],
    baseCost: 5,
    describe: ({ bonusPct = 0.05 }) => `Attacks deal ${pct(bonusPct)} bonus damage to slowed or immobilized targets.`,
    create: ({ bonusPct = 0.05 }) => ({
      modifyDamage(ctx, _self, target, amount, _dtype, via) {
        if (via !== "attack") return amount;
        if (slowPct(target, ctx.time) <= 0 && !isRooted(target, ctx.time)) return amount;
        return amount * (1 + bonusPct);
      }
    })
  },
  {
    id: "mending_ripple",
    summary: "Heals splash a fraction of the amount onto the nearest other ally.",
    params: [
      { key: "ratio", min: 0.1, max: 0.5, costPerUnit: 120 },
      { key: "range", min: 3, max: 8, costPerUnit: 1 }
    ],
    baseCost: 5,
    describe: ({ ratio = 0.1, range: range2 = 3 }) => `Heals splash ${pct(ratio)} of the amount onto the nearest other ally within ${range2}.`,
    create: ({ ratio = 0.1, range: range2 = 3 }) => ({
      onHealGiven(ctx, self, target, amount) {
        const best = nearestOtherAlly(ctx, self, target, range2);
        if (!best) return;
        const splash = amount * ratio * healFactor(best, ctx.time);
        best.hp = Math.min(best.maxHp, best.hp + splash);
      }
    })
  },
  {
    id: "stacking_surge",
    summary: "Attacks build stacks; at full stacks the next ability hits harder.",
    params: [
      { key: "stacks", min: 3, max: 6, integer: true, costPerUnit: -5 },
      { key: "bonusPct", min: 0.1, max: 0.4, costPerUnit: 200 }
    ],
    baseCost: 5,
    describe: ({ stacks = 3, bonusPct = 0.1 }) => `Attacks build stacks (up to ${stacks}); at full stacks, the next ability deals ${pct(bonusPct)} bonus damage and spends them.`,
    create: ({ stacks = 3, bonusPct = 0.1 }) => ({
      onAttackHit(_ctx, self) {
        self.passiveStacks = Math.min(stacks, self.passiveStacks + 1);
      },
      modifyDamage(_ctx, self, _target, amount, _dtype, via) {
        if (via !== "ability" || self.passiveStacks < stacks) return amount;
        self.passiveStacks = 0;
        return amount * (1 + bonusPct);
      }
    })
  },
  {
    id: "kit_inscribed",
    summary: "No hook of its own: the kit itself carries the passive.",
    params: [],
    baseCost: 0,
    describe: () => "The kit carries the passive: its printed spell effects are the whole story.",
    create: () => ({})
  }
];
var PASSIVE_TEMPLATES = Object.fromEntries(
  ALL3.map((t) => [t.id, t])
);
var PASSIVE_TEMPLATE_LIST = ALL3;

// src/sim/forge/resolve.ts
function resolveForgedChampion(def) {
  const tpl = PASSIVE_TEMPLATES[def.passive.template];
  if (!tpl) {
    throw new Error(`unknown passive template '${def.passive.template}' (validate first)`);
  }
  return {
    id: def.id,
    // Roster naming style: "Torv, Stonehorn". The title is optional.
    name: def.title.trim().length > 0 ? `${def.name}, ${def.title}` : def.name,
    role: def.role,
    blurb: def.tagline,
    passive: {
      name: def.passive.name,
      description: def.passive.flavor ? `${def.passive.flavor} ${tpl.describe(def.passive.params)}` : tpl.describe(def.passive.params),
      ...tpl.create(def.passive.params)
    },
    base: def.base,
    growth: def.growth,
    abilities: def.abilities,
    ...def.attackSound !== void 0 ? { attackSound: def.attackSound } : {}
  };
}

// src/sim/content/sounds.ts
var CAST_SOUND_GROUPS = [
  {
    group: "Elements",
    sounds: [
      { id: "fire", family: "fire", label: "Fire: a crackling roar" },
      { id: "fireball", family: "fire", label: "Fireball: a flame flung with a whoosh" },
      { id: "explosion", family: "fire", label: "Explosion: a blast and its rubble" },
      { id: "ember", family: "fire", label: "Ember: a small flame catching" },
      { id: "frost", family: "frost", label: "Frost: a glassy crystalline ring" },
      { id: "coldsnap", family: "frost", label: "Cold snap: an icy blast" },
      { id: "shatter", family: "frost", label: "Shatter: ice breaking apart" },
      { id: "thunder", family: "thunder", label: "Thunder: a crack and a rumble" },
      { id: "spark", family: "thunder", label: "Spark: an electric snap" },
      { id: "storm", family: "thunder", label: "Storm: wind rising into thunder" },
      { id: "wind", family: "wind", label: "Wind: a fast breathy sweep" },
      { id: "gust", family: "wind", label: "Gust: a long heavy rush of air" },
      { id: "sand", family: "wind", label: "Sand: a dry hissing sweep" },
      { id: "earth", family: "control", label: "Earth: a rumbling quake" },
      { id: "rockfall", family: "control", label: "Rockfall: stones tumbling" },
      { id: "water", family: "wind", label: "Water: a splash" },
      { id: "tide", family: "wind", label: "Tide: a surge of water" },
      { id: "venom", family: "shadow", label: "Venom: bubbling poison" }
    ]
  },
  {
    group: "Arcane",
    sounds: [
      { id: "arcane", family: "arcane", label: "Arcane: an airy whoosh with a shimmer" },
      { id: "missile", family: "arcane", label: "Missile: a bolt of magic fired" },
      { id: "beam", family: "arcane", label: "Beam: a sustained ray" },
      { id: "pulse", family: "arcane", label: "Pulse: a low throb of power" },
      { id: "blink", family: "arcane", label: "Blink: a teleport pop" },
      { id: "ward", family: "arcane", label: "Ward: a shield raised" },
      { id: "rune", family: "arcane", label: "Rune: a bright glyph chime" },
      { id: "gravity", family: "arcane", label: "Gravity: space folding in" },
      { id: "soar", family: "arcane", label: "Soar: a rising magical rush" },
      { id: "powerup", family: "arcane", label: "Power up: a charge climbing" },
      { id: "drain", family: "shadow", label: "Drain: power drawn away" }
    ]
  },
  {
    group: "Light and nature",
    sounds: [
      { id: "life", family: "life", label: "Life: a warm double chime" },
      { id: "bloom", family: "life", label: "Bloom: a soft rising cure" },
      { id: "holy", family: "life", label: "Holy: a bell toll under a hymn" },
      { id: "chime", family: "life", label: "Chime: bright bells" },
      { id: "blessing", family: "life", label: "Blessing: a chord of power rising" },
      { id: "growth", family: "life", label: "Growth: twigs and leaves spreading" },
      { id: "incantation", family: "arcane", label: "Incantation: whispered words of power" }
    ]
  },
  {
    group: "Shadow",
    sounds: [
      { id: "shadow", family: "shadow", label: "Shadow: a dark hiss drawn inward" },
      { id: "curse", family: "shadow", label: "Curse: a shade's hiss and a drain" },
      { id: "void", family: "shadow", label: "Void: a hollow implosion" },
      { id: "wraith", family: "shadow", label: "Wraith: a ghostly breath" },
      { id: "lich", family: "shadow", label: "Lich: a dead voice speaking" }
    ]
  },
  {
    group: "Steel and body",
    sounds: [
      { id: "steel", family: "steel", label: "Steel: a metallic schwing" },
      { id: "clash", family: "steel", label: "Clash: blades meeting" },
      { id: "chains", family: "steel", label: "Chains: iron links whipping" },
      { id: "control", family: "control", label: "Control: a heavy low slam" },
      { id: "crush", family: "control", label: "Crush: a hammer falling" },
      { id: "stomp", family: "control", label: "Stomp: a heavy footfall" },
      { id: "roar", family: "control", label: "Roar: a beast's bellow" },
      { id: "growl", family: "shadow", label: "Growl: a guttural threat" },
      { id: "bite", family: "steel", label: "Bite: jaws snapping" },
      { id: "dash", family: "wind", label: "Dash: a burst of speed" }
    ]
  },
  {
    group: "Tech",
    sounds: [
      { id: "gunfire", family: "thunder", label: "Gunfire: a burst of shots" },
      { id: "cannon", family: "thunder", label: "Cannon: a black-powder boom" },
      { id: "laser", family: "arcane", label: "Laser: a retro beam" },
      { id: "shock", family: "thunder", label: "Shock: a taser's crackle" }
    ]
  }
];
var CAST_SOUNDS = CAST_SOUND_GROUPS.flatMap(
  (g) => g.sounds.map((s) => ({ ...s, group: g.group }))
);
var ATTACK_SOUND_GROUPS = [
  {
    group: "Melee",
    sounds: [
      { id: "swing", family: "swing", label: "Swing: a quick whip of air" },
      { id: "blade", family: "blade", label: "Blade: a metallic slash" },
      { id: "dagger", family: "blade", label: "Dagger: a quick stab" },
      { id: "claw", family: "blade", label: "Claw: a raking scratch" },
      { id: "chain", family: "blade", label: "Chain: iron links lashing" },
      { id: "heavy", family: "heavy", label: "Heavy: a deep whoosh and a thud" },
      { id: "blunt", family: "heavy", label: "Blunt: a club's thud" },
      { id: "staff", family: "heavy", label: "Staff: a wooden strike" },
      { id: "punch", family: "heavy", label: "Punch: a fist landing" },
      { id: "bite", family: "heavy", label: "Bite: jaws snapping" },
      { id: "whip", family: "swing", label: "Whip: a crack of leather" }
    ]
  },
  {
    group: "Ranged",
    sounds: [
      { id: "bow", family: "bow", label: "Bow: a string twang and an arrow hiss" },
      { id: "crossbow", family: "bow", label: "Crossbow: a latch and a heavy bolt" },
      { id: "throw", family: "swing", label: "Throw: a spinning blade flung" },
      { id: "bolt", family: "bolt", label: "Bolt: a short arcane zap" },
      { id: "spell", family: "bolt", label: "Spell: a bolt of magic" },
      { id: "laser", family: "bolt", label: "Laser: a retro beam" },
      { id: "gunshot", family: "gunshot", label: "Gunshot: a rifle report" },
      { id: "pistol", family: "gunshot", label: "Pistol: a sharp crack" },
      { id: "cannon", family: "gunshot", label: "Cannon: a black-powder boom" }
    ]
  }
];
var ATTACK_SOUNDS = ATTACK_SOUND_GROUPS.flatMap(
  (g) => g.sounds.map((s) => ({ ...s, group: g.group }))
);
function isCastSound(v) {
  return typeof v === "string" && CAST_SOUNDS.some((s) => s.id === v);
}
function isAttackSound(v) {
  return typeof v === "string" && ATTACK_SOUNDS.some((s) => s.id === v);
}

// src/sim/spell_look.ts
var LOOK_BODIES = ["bolt", "orb", "shard", "blade", "star", "mote"];
var LOOK_TRAILS = ["none", "sparks", "smoke", "embers", "ribbon"];
var LOOK_BURSTS = [
  "flash",
  "spray",
  "ring",
  "pillar",
  "shatter",
  "bloom",
  "wave"
];
var LOOK_FLOORS = ["disc", "ring", "runes", "pool", "storm"];
var LOOK_EDGES = ["soft", "hard", "jagged"];
var LOOK_ZONE_MOTIONS = ["still", "swirl", "pulse", "rain"];
var LOOK_WINDUPS = ["none", "gather", "orbit", "rise"];
var LOOK_MARKS = ["none", "scorch", "frost", "cracks"];
var LOOK_BOUNDS = {
  scale: { min: 0.4, max: 2.5 },
  density: { min: 0, max: 1 },
  spin: { min: -8, max: 8 },
  shake: { min: 0, max: 0.4 }
};
var COLOR_MAX = 16777215;
var LOOK_KEYS = [
  "palette",
  "projectile",
  "cast",
  "impact",
  "zone",
  "detonate",
  "windup"
];
function inList(list, v) {
  return typeof v === "string" && list.includes(v);
}
function checkScalar(errors, path12, v, bound) {
  if (v === void 0) return;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    errors.push(`${path12}: must be a finite number`);
    return;
  }
  if (v < bound.min || v > bound.max) {
    errors.push(`${path12}: ${v} is outside ${bound.min}..${bound.max}`);
  }
}
function checkColor(errors, path12, v) {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > COLOR_MAX) {
    errors.push(`${path12}: must be an integer color between 0 and ${COLOR_MAX}`);
  }
}
function checkBurst(errors, path12, v) {
  if (typeof v !== "object" || v === null) {
    errors.push(`${path12}: must be an object`);
    return;
  }
  const b = v;
  if (!inList(LOOK_BURSTS, b.shape)) {
    errors.push(`${path12}.shape: must be one of ${LOOK_BURSTS.join(", ")}`);
  }
  checkScalar(errors, `${path12}.scale`, b.scale, LOOK_BOUNDS.scale);
  checkScalar(errors, `${path12}.density`, b.density, LOOK_BOUNDS.density);
  checkScalar(errors, `${path12}.shake`, b.shake, LOOK_BOUNDS.shake);
  if (b.smoke !== void 0 && typeof b.smoke !== "boolean") {
    errors.push(`${path12}.smoke: must be a boolean`);
  }
  if (b.mark !== void 0 && !inList(LOOK_MARKS, b.mark)) {
    errors.push(`${path12}.mark: must be one of ${LOOK_MARKS.join(", ")}`);
  }
}
function spellLookErrors(look, path12 = "look") {
  const errors = [];
  if (typeof look !== "object" || look === null) {
    return [`${path12}: must be an object`];
  }
  const l = look;
  if (l.palette !== void 0) {
    if (typeof l.palette !== "object" || l.palette === null) {
      errors.push(`${path12}.palette: must be an object`);
    } else {
      const p = l.palette;
      checkColor(errors, `${path12}.palette.main`, p.main);
      checkColor(errors, `${path12}.palette.glow`, p.glow);
    }
  }
  if (l.projectile !== void 0) {
    const p = l.projectile;
    if (typeof p !== "object" || p === null) {
      errors.push(`${path12}.projectile: must be an object`);
    } else {
      if (!inList(LOOK_BODIES, p.body)) {
        errors.push(`${path12}.projectile.body: must be one of ${LOOK_BODIES.join(", ")}`);
      }
      if (p.trail !== void 0 && !inList(LOOK_TRAILS, p.trail)) {
        errors.push(`${path12}.projectile.trail: must be one of ${LOOK_TRAILS.join(", ")}`);
      }
      checkScalar(errors, `${path12}.projectile.spin`, p.spin, LOOK_BOUNDS.spin);
      checkScalar(errors, `${path12}.projectile.scale`, p.scale, LOOK_BOUNDS.scale);
    }
  }
  if (l.zone !== void 0) {
    const z = l.zone;
    if (typeof z !== "object" || z === null) {
      errors.push(`${path12}.zone: must be an object`);
    } else {
      if (!inList(LOOK_FLOORS, z.floor)) {
        errors.push(`${path12}.zone.floor: must be one of ${LOOK_FLOORS.join(", ")}`);
      }
      if (z.edge !== void 0 && !inList(LOOK_EDGES, z.edge)) {
        errors.push(`${path12}.zone.edge: must be one of ${LOOK_EDGES.join(", ")}`);
      }
      if (z.motion !== void 0 && !inList(LOOK_ZONE_MOTIONS, z.motion)) {
        errors.push(`${path12}.zone.motion: must be one of ${LOOK_ZONE_MOTIONS.join(", ")}`);
      }
    }
  }
  if (l.windup !== void 0) {
    const w = l.windup;
    if (typeof w !== "object" || w === null) {
      errors.push(`${path12}.windup: must be an object`);
    } else if (!inList(LOOK_WINDUPS, w.motion)) {
      errors.push(`${path12}.windup.motion: must be one of ${LOOK_WINDUPS.join(", ")}`);
    }
  }
  for (const key of ["cast", "impact", "detonate"]) {
    if (l[key] !== void 0) checkBurst(errors, `${path12}.${key}`, l[key]);
  }
  for (const key of Object.keys(l)) {
    if (!LOOK_KEYS.includes(key)) errors.push(`${path12}.${key}: not a look field`);
  }
  return errors;
}

// src/sim/forge/bounds.ts
function B(min, max, integer) {
  return integer ? { min, max, integer } : { min, max };
}
var BASE_STAT_BOUNDS = {
  hp: B(400, 800),
  mana: B(200, 600),
  ad: B(40, 80),
  ap: B(0, 0),
  armor: B(15, 45),
  mr: B(15, 45),
  attackRange: B(1, 7.5),
  attackSpeed: B(0.4, 1),
  moveSpeed: B(3.3, 4.2),
  hpRegen: B(0.5, 3),
  manaRegen: B(0.5, 3),
  radius: B(0.5, 0.9)
};
var GROWTH_BOUNDS = {
  hp: B(40, 130),
  mana: B(10, 60),
  ad: B(1, 7),
  armor: B(1, 4.5),
  mr: B(0.5, 3)
};
var FLAVOR_MAX = 160;
var ABILITY_BOUNDS = {
  manaCost: B(0, 120),
  castRange: B(0, 130),
  windup: B(0, 1.5),
  basicCooldown: B(2, 20),
  ultCooldown: B(30, 90),
  recastWindow: B(1, 8)
};
var CAST_BOUNDS = {
  skillshot: { speed: B(8, 45), radius: B(0.3, 2), range: B(3, 130) },
  zone: { radius: B(1.5, 7), duration: B(0.5, 6), tickEvery: B(0.25, 2), detonateDelay: B(0.4, 3) },
  self_or_ally: { searchRadius: B(0, 4) },
  enemy_target: { searchRadius: B(0.5, 4) },
  cone: { range: B(2, 7), halfAngle: B(Math.PI / 12, Math.PI / 2) },
  burst: { radius: B(1, 5) },
  dash: { range: B(1.5, 8), speed: B(10, 22), landRadius: B(0, 3.5) },
  wall: { length: B(2, 6), duration: B(1, 8) }
};
var EFFECT_BOUNDS = {
  damage: { base: B(0, 320), adRatio: B(0, 2.2), apRatio: B(0, 1.6), maxHpPct: B(0, 0.15) },
  heal: { base: B(0, 200), apRatio: B(0, 1.2), maxHpPct: B(0, 0.2) },
  slow: { pct: B(0.05, 0.6), duration: B(0.25, 3) },
  root: { duration: B(0.25, 1.8) },
  stun: { duration: B(0.25, 1.6) },
  taunt: { duration: B(0.25, 1.5) },
  stealth: { duration: B(0.25, 3) },
  blind: { duration: B(0.25, 2), factor: B(0.05, 0.8) },
  knockback: { distance: B(0.5, 3) },
  pull: { distance: B(1, 7) },
  knockup: { duration: B(0.25, 1.2) },
  untargetable: { duration: B(0.2, 1.5) },
  shield: { base: B(0, 220), apRatio: B(0, 1.2), duration: B(0.5, 4) },
  dot: { duration: B(0.5, 4), perSecond: B(1, 40) },
  grievous: { duration: B(0.25, 3), factor: B(0.05, 0.5) },
  buff: { duration: B(0.5, 5), msPct: B(0, 0.5), asPct: B(0, 0.7), armor: B(0, 25), mr: B(0, 25) },
  mark: { duration: B(1, 6), stacksToTrigger: B(2, 4, true) },
  conditional: {},
  cooldownRefund: { pctOfRemaining: B(0.05, 1) },
  empower: { duration: B(0.5, 4), splashRadius: B(0, 3) }
};
var PREDICATE_BOUNDS = {
  distanceAtLeast: { distance: B(0, 130) },
  targetHpBelow: { frac: B(0.05, 0.9) },
  targetDying: {},
  targetIsolated: { radius: B(1, 8) },
  targetSlowed: {},
  targetNearTerrain: { distance: B(0.5, 3) },
  targetIsChampion: {},
  targetHasSourceDot: {},
  withinCenter: { radius: B(0.5, 4) }
};
var NESTED_BOUNDS = {
  chainRadius: B(1, 5),
  leaveWallDuration: B(0.5, 8),
  aftershockDelay: B(0.5, 3),
  aftershockRadius: B(0.5, 2.5),
  aftershockSpacing: B(1, 4),
  boundaryPerUnitEvery: B(0.5, 4),
  leaveZoneRadius: B(1, 5),
  leaveZoneDuration: B(0.5, 4),
  leaveZoneTickEvery: B(0.25, 2),
  toAllySearchRadius: B(1, 5),
  shieldBurstRadius: B(1, 4)
};
var EFFECT_LIST_MAX = 8;
var EFFECT_DEPTH_MAX = 5;
var ABILITY_EFFECT_MAX = 24;
var AT_RANK_MAX = 2;
var FORGED_DAMAGE_TYPES = ["physical", "magic"];
function checkNum(errors, path12, value, bound) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${path12}: must be a finite number`);
    return;
  }
  if (value < bound.min || value > bound.max) {
    errors.push(`${path12}: ${value} is outside [${bound.min}, ${bound.max}]`);
    return;
  }
  if (bound.integer && !Number.isInteger(value)) {
    errors.push(`${path12}: ${value} must be an integer`);
  }
}
function checkOptNum(errors, path12, value, bound) {
  if (value === void 0) return;
  checkNum(errors, path12, value, bound);
}
function checkOptBool(errors, path12, value) {
  if (value !== void 0 && typeof value !== "boolean") {
    errors.push(`${path12}: must be a boolean when present`);
  }
}
function checkFields(errors, path12, obj, bounds, required) {
  for (const [field, bound] of Object.entries(bounds)) {
    if (required.includes(field)) checkNum(errors, `${path12}.${field}`, obj[field], bound);
    else checkOptNum(errors, `${path12}.${field}`, obj[field], bound);
  }
}
function checkPredicate(errors, path12, p) {
  if (typeof p !== "object" || p === null) {
    errors.push(`${path12}: must be a predicate object`);
    return;
  }
  const pred = p;
  const bounds = typeof pred.kind === "string" ? PREDICATE_BOUNDS[pred.kind] : void 0;
  if (!bounds) {
    errors.push(`${path12}.kind: unknown predicate kind '${String(pred.kind)}'`);
    return;
  }
  checkFields(errors, path12, pred, bounds, Object.keys(bounds));
}
function checkEffectList(errors, path12, list, depth, walk, required) {
  if (list === void 0) {
    if (required) errors.push(`${path12}: must be an effect list`);
    return;
  }
  if (!Array.isArray(list)) {
    errors.push(`${path12}: must be an effect list`);
    return;
  }
  if (depth > EFFECT_DEPTH_MAX) {
    errors.push(`${path12}: effects nest deeper than ${EFFECT_DEPTH_MAX}`);
    return;
  }
  if (list.length > EFFECT_LIST_MAX) {
    errors.push(`${path12}: ${list.length} effects in one list (max ${EFFECT_LIST_MAX})`);
    return;
  }
  for (let i = 0; i < list.length; i++) {
    checkEffect(errors, `${path12}[${i}]`, list[i], depth, walk);
  }
}
function checkEffect(errors, path12, e, depth, walk) {
  walk.effects += 1;
  if (typeof e !== "object" || e === null) {
    errors.push(`${path12}: must be an effect object`);
    return;
  }
  const fx = e;
  const bounds = typeof fx.kind === "string" ? EFFECT_BOUNDS[fx.kind] : void 0;
  if (!bounds) {
    errors.push(`${path12}.kind: unknown effect kind '${String(fx.kind)}'`);
    return;
  }
  switch (fx.kind) {
    case "damage":
      checkFields(errors, path12, fx, bounds, ["base"]);
      if (!FORGED_DAMAGE_TYPES.includes(fx.dtype)) {
        errors.push(`${path12}.dtype: must be 'physical' or 'magic'`);
      }
      break;
    case "heal":
      checkFields(errors, path12, fx, bounds, ["base"]);
      break;
    case "buff":
      checkFields(errors, path12, fx, bounds, ["duration"]);
      break;
    case "dot":
      checkFields(errors, path12, fx, bounds, ["duration", "perSecond"]);
      if (!FORGED_DAMAGE_TYPES.includes(fx.dtype)) {
        errors.push(`${path12}.dtype: must be 'physical' or 'magic'`);
      }
      break;
    case "knockback":
      checkFields(errors, path12, fx, bounds, ["distance"]);
      if (fx.direction !== void 0 && fx.direction !== "away" && fx.direction !== "aside" && fx.direction !== "toCenter") {
        errors.push(`${path12}.direction: must be 'away', 'aside', or 'toCenter'`);
      }
      break;
    case "shield": {
      checkFields(errors, path12, fx, bounds, ["base", "duration"]);
      if (fx.burst !== void 0) {
        if (typeof fx.burst !== "object" || fx.burst === null) {
          errors.push(`${path12}.burst: must be an object`);
          break;
        }
        const burst = fx.burst;
        checkNum(errors, `${path12}.burst.radius`, burst.radius, NESTED_BOUNDS.shieldBurstRadius);
        checkEffectList(errors, `${path12}.burst.onBreak`, burst.onBreak, depth + 1, walk, false);
        checkEffectList(errors, `${path12}.burst.onExpire`, burst.onExpire, depth + 1, walk, false);
      }
      break;
    }
    case "mark":
      checkFields(errors, path12, fx, bounds, ["duration", "stacksToTrigger"]);
      checkEffectList(errors, `${path12}.onTrigger`, fx.onTrigger, depth + 1, walk, true);
      break;
    case "conditional":
      checkPredicate(errors, `${path12}.when`, fx.when);
      checkEffectList(errors, `${path12}.effects`, fx.effects, depth + 1, walk, true);
      checkEffectList(errors, `${path12}.otherwise`, fx.otherwise, depth + 1, walk, false);
      break;
    case "cooldownRefund":
      checkFields(errors, path12, fx, bounds, ["pctOfRemaining"]);
      if (fx.key !== "Q" && fx.key !== "W" && fx.key !== "E" && fx.key !== "R") {
        errors.push(`${path12}.key: must be Q, W, E, or R`);
      }
      break;
    case "empower":
      checkFields(errors, path12, fx, bounds, ["duration"]);
      checkEffectList(errors, `${path12}.bonus`, fx.bonus, depth + 1, walk, true);
      checkEffectList(errors, `${path12}.splash`, fx.splash, depth + 1, walk, false);
      break;
    default:
      checkFields(errors, path12, fx, bounds, Object.keys(bounds));
      break;
  }
}
function checkCastSpec(errors, path12, spec, walk) {
  if (typeof spec !== "object" || spec === null) {
    errors.push(`${path12}: must be a cast spec object`);
    return;
  }
  const s = spec;
  const bounds = typeof s.kind === "string" ? CAST_BOUNDS[s.kind] : void 0;
  if (!bounds) {
    errors.push(`${path12}.kind: unknown cast kind '${String(s.kind)}'`);
    return;
  }
  switch (s.kind) {
    case "skillshot": {
      checkFields(errors, path12, s, bounds, ["speed", "radius", "range"]);
      checkOptBool(errors, `${path12}.pierce`, s.pierce);
      checkEffectList(errors, `${path12}.onHit`, s.onHit, 1, walk, true);
      checkEffectList(errors, `${path12}.allyEffects`, s.allyEffects, 1, walk, false);
      if (s.chain !== void 0) {
        const chain = s.chain;
        checkNum(errors, `${path12}.chain.radius`, chain?.radius, NESTED_BOUNDS.chainRadius);
        checkEffectList(errors, `${path12}.chain.onHit`, chain?.onHit, 2, walk, true);
      }
      if (s.leaveWall !== void 0) {
        const lw = s.leaveWall;
        checkNum(
          errors,
          `${path12}.leaveWall.duration`,
          lw?.duration,
          NESTED_BOUNDS.leaveWallDuration
        );
      }
      if (s.aftershock !== void 0) {
        const a = s.aftershock;
        checkNum(errors, `${path12}.aftershock.delay`, a?.delay, NESTED_BOUNDS.aftershockDelay);
        checkNum(errors, `${path12}.aftershock.radius`, a?.radius, NESTED_BOUNDS.aftershockRadius);
        checkNum(errors, `${path12}.aftershock.spacing`, a?.spacing, NESTED_BOUNDS.aftershockSpacing);
        checkEffectList(errors, `${path12}.aftershock.effects`, a?.effects, 2, walk, true);
      }
      break;
    }
    case "zone": {
      checkFields(errors, path12, s, bounds, ["radius", "duration"]);
      checkOptBool(errors, `${path12}.reveal`, s.reveal);
      checkEffectList(errors, `${path12}.onEnter`, s.onEnter, 1, walk, false);
      checkEffectList(errors, `${path12}.onTick`, s.onTick, 1, walk, false);
      checkEffectList(errors, `${path12}.allyOnTick`, s.allyOnTick, 1, walk, false);
      checkEffectList(errors, `${path12}.onDetonate`, s.onDetonate, 1, walk, false);
      if (s.onDetonate !== void 0 && s.detonateDelay === void 0) {
        errors.push(`${path12}.detonateDelay: required when onDetonate is present`);
      }
      if (s.boundary !== void 0) {
        const b = s.boundary;
        checkNum(
          errors,
          `${path12}.boundary.perUnitEvery`,
          b?.perUnitEvery,
          NESTED_BOUNDS.boundaryPerUnitEvery
        );
        checkEffectList(errors, `${path12}.boundary.effects`, b?.effects, 2, walk, true);
      }
      if (s.leaveZone !== void 0) {
        const lz = s.leaveZone;
        checkNum(errors, `${path12}.leaveZone.radius`, lz?.radius, NESTED_BOUNDS.leaveZoneRadius);
        checkNum(
          errors,
          `${path12}.leaveZone.duration`,
          lz?.duration,
          NESTED_BOUNDS.leaveZoneDuration
        );
        checkOptNum(
          errors,
          `${path12}.leaveZone.tickEvery`,
          lz?.tickEvery,
          NESTED_BOUNDS.leaveZoneTickEvery
        );
        checkEffectList(errors, `${path12}.leaveZone.onTick`, lz?.onTick, 2, walk, false);
      }
      break;
    }
    case "self_or_ally":
      checkFields(errors, path12, s, bounds, ["searchRadius"]);
      checkEffectList(errors, `${path12}.effects`, s.effects, 1, walk, true);
      break;
    case "enemy_target":
      checkFields(errors, path12, s, bounds, ["searchRadius"]);
      checkEffectList(errors, `${path12}.effects`, s.effects, 1, walk, true);
      checkEffectList(errors, `${path12}.selfEffects`, s.selfEffects, 1, walk, false);
      break;
    case "cone":
      checkFields(errors, path12, s, bounds, ["range", "halfAngle"]);
      checkEffectList(errors, `${path12}.onHit`, s.onHit, 1, walk, true);
      break;
    case "burst":
      checkFields(errors, path12, s, bounds, ["radius"]);
      checkEffectList(errors, `${path12}.effects`, s.effects, 1, walk, true);
      checkEffectList(errors, `${path12}.selfEffects`, s.selfEffects, 1, walk, false);
      break;
    case "dash": {
      checkFields(errors, path12, s, bounds, ["range"]);
      checkOptBool(errors, `${path12}.untargetableDuringTravel`, s.untargetableDuringTravel);
      checkEffectList(errors, `${path12}.onLand`, s.onLand, 1, walk, false);
      checkEffectList(errors, `${path12}.selfEffects`, s.selfEffects, 1, walk, false);
      checkEffectList(errors, `${path12}.passThrough`, s.passThrough, 1, walk, false);
      if (s.toAlly !== void 0) {
        const t = s.toAlly;
        checkNum(
          errors,
          `${path12}.toAlly.searchRadius`,
          t?.searchRadius,
          NESTED_BOUNDS.toAllySearchRadius
        );
      }
      break;
    }
    case "wall":
      checkFields(errors, path12, s, bounds, ["length", "duration"]);
      break;
  }
}
function checkAbility(errors, key, def) {
  const path12 = `abilities.${key}`;
  if (typeof def !== "object" || def === null) {
    errors.push(`${path12}: must be an ability object`);
    return;
  }
  const a = def;
  if (a.flavor !== void 0 && (typeof a.flavor !== "string" || a.flavor.length > FLAVOR_MAX)) {
    errors.push(`${path12}.flavor: must be a string of at most ${FLAVOR_MAX} characters`);
  }
  if (a.sound !== void 0 && !isCastSound(a.sound)) {
    errors.push(`${path12}.sound: must be one of ${CAST_SOUNDS.map((s) => s.id).join(", ")}`);
  }
  if (a.look !== void 0) errors.push(...spellLookErrors(a.look, `${path12}.look`));
  checkNum(errors, `${path12}.manaCost`, a.manaCost, ABILITY_BOUNDS.manaCost);
  checkNum(errors, `${path12}.castRange`, a.castRange, ABILITY_BOUNDS.castRange);
  checkOptNum(errors, `${path12}.windup`, a.windup, ABILITY_BOUNDS.windup);
  const cdBound = key === "R" ? ABILITY_BOUNDS.ultCooldown : ABILITY_BOUNDS.basicCooldown;
  checkNum(errors, `${path12}.cooldown`, a.cooldown, cdBound);
  if (a.recast !== void 0) {
    const recast = a.recast;
    checkNum(errors, `${path12}.recast.window`, recast?.window, ABILITY_BOUNDS.recastWindow);
    if (recast?.returnBlink !== true) {
      errors.push(`${path12}.recast.returnBlink: must be true (the only recast the engine has)`);
    }
  }
  const walk = { effects: 0 };
  checkCastSpec(errors, `${path12}.spec`, a.spec, walk);
  if (a.atRank !== void 0) {
    if (!Array.isArray(a.atRank)) {
      errors.push(`${path12}.atRank: must be an array`);
    } else if (a.atRank.length > AT_RANK_MAX) {
      errors.push(`${path12}.atRank: ${a.atRank.length} overrides (max ${AT_RANK_MAX})`);
    } else {
      const maxRank = key === "R" ? 3 : 5;
      for (let i = 0; i < a.atRank.length; i++) {
        const o = a.atRank[i];
        checkNum(errors, `${path12}.atRank[${i}].rank`, o?.rank, B(2, maxRank, true));
        checkCastSpec(errors, `${path12}.atRank[${i}].spec`, o?.spec, walk);
      }
    }
  }
  if (walk.effects > ABILITY_EFFECT_MAX) {
    errors.push(
      `${path12}: ${walk.effects} effect primitives in one ability (max ${ABILITY_EFFECT_MAX})`
    );
  }
}
function boundsErrors(def) {
  const errors = [];
  const base = def.base;
  const growth = def.growth;
  if (typeof base !== "object" || base === null) {
    errors.push("base: must be a stats object");
  } else {
    for (const [field, bound] of Object.entries(BASE_STAT_BOUNDS)) {
      checkNum(errors, `base.${field}`, base[field], bound);
    }
  }
  if (typeof growth !== "object" || growth === null) {
    errors.push("growth: must be a growth object");
  } else {
    for (const [field, bound] of Object.entries(GROWTH_BOUNDS)) {
      checkNum(errors, `growth.${field}`, growth[field], bound);
    }
  }
  const abilities = def.abilities;
  if (typeof abilities !== "object" || abilities === null) {
    errors.push("abilities: must declare Q, W, E, and R");
  } else {
    for (const key of ["Q", "W", "E", "R"]) {
      if (abilities[key] === void 0) errors.push(`abilities.${key}: missing`);
      else checkAbility(errors, key, abilities[key]);
    }
    for (const key of Object.keys(abilities)) {
      if (!["Q", "W", "E", "R"].includes(key)) errors.push(`abilities.${key}: unknown ability key`);
    }
  }
  return errors;
}

// src/sim/spell_targets.ts
function isSpellTarget(u) {
  return u.kind !== "tower" && u.kind !== "sanctum";
}

// src/sim/walls.ts
var SAMPLE_RADIUS = 0.7;
var SAMPLE_SPACING = 0.5;
function raiseWall(ctx, sourceId, team2, center, castDir, length, duration) {
  const len = hypot(castDir.x, castDir.z);
  const dir = len > 0 ? { x: castDir.x / len, z: castDir.z / len } : { x: 1, z: 0 };
  const perp = { x: -dir.z, z: dir.x };
  const half = length / 2;
  const a = { x: center.x - perp.x * half, z: center.z - perp.z * half };
  const b = { x: center.x + perp.x * half, z: center.z + perp.z * half };
  const wall = createWallSegment(ctx, sourceId, team2, a, b, duration);
  return wall;
}
function createWallSegment(ctx, sourceId, team2, a, b, duration) {
  const steps = Math.max(1, Math.ceil(hypot(b.x - a.x, b.z - a.z) / SAMPLE_SPACING));
  const samples = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    samples.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
  }
  for (const s of samples) ctx.nav.blockCircle(s.x, s.z, SAMPLE_RADIUS);
  for (const u of ctx.units.values()) {
    if (u.dead || ctx.dead.has(u.id) || u.moveSpeed <= 0) continue;
    if (ctx.nav.isWalkableAt(u.pos.x, u.pos.z)) continue;
    const out = ctx.nav.nearestWalkable(u.pos.x, u.pos.z, 6);
    if (out) {
      u.pos = { x: out.x, z: out.z };
      u.path = [];
    }
  }
  const wall = {
    id: ctx.allocId(),
    sourceId,
    team: team2,
    a,
    b,
    until: ctx.time + duration,
    samples
  };
  ctx.walls.set(wall.id, wall);
  return wall;
}
function stepWalls(ctx) {
  for (const w of [...ctx.walls.values()]) {
    if (ctx.time < w.until) continue;
    for (const s of w.samples) ctx.nav.unblockCircle(s.x, s.z, SAMPLE_RADIUS);
    ctx.walls.delete(w.id);
  }
}
function clampThroughWalls(nav, from, u) {
  const dx = u.pos.x - from.x;
  const dz = u.pos.z - from.z;
  const dist2 = hypot(dx, dz);
  if (dist2 < 1e-9) return;
  const steps = Math.max(1, Math.ceil(dist2 / 0.3));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + dx * t;
    const z = from.z + dz * t;
    if (!nav.isWalkableAt(x, z)) {
      const back = Math.max(0, (i - 1) / steps);
      u.pos = { x: from.x + dx * back, z: from.z + dz * back };
      u.path = [];
      return;
    }
  }
}

// src/sim/combat/ally_dash.ts
var CLEARANCE = 0.15;
function allyDashAim(ctx, caster, aim, range2, searchRadius) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of ctx.units.values()) {
    if (u.id === caster.id || u.kind !== "champion") continue;
    if (u.neutral || u.team !== caster.team || u.dead || ctx.dead.has(u.id)) continue;
    if (hypot(u.pos.x - caster.pos.x, u.pos.z - caster.pos.z) - u.radius > range2) continue;
    const d = hypot(u.pos.x - aim.x, u.pos.z - aim.z) - u.radius;
    if (d > searchRadius) continue;
    if (d < bestD || d === bestD && best !== null && u.id < best.id) {
      bestD = d;
      best = u;
    }
  }
  if (!best) return null;
  const dx = best.pos.x - caster.pos.x;
  const dz = best.pos.z - caster.pos.z;
  const dist2 = hypot(dx, dz);
  if (dist2 === 0) return { x: caster.pos.x, z: caster.pos.z };
  const stop = Math.max(0, dist2 - caster.radius - best.radius - CLEARANCE);
  return { x: caster.pos.x + dx / dist2 * stop, z: caster.pos.z + dz / dist2 * stop };
}

// src/sim/combat/effects.ts
var D = Math.SQRT1_2;
var TERRAIN_RING = [
  [1, 0],
  [D, D],
  [0, 1],
  [-D, D],
  [-1, 0],
  [-D, -D],
  [0, -1],
  [D, -D]
];
function evaluatePredicate(ctx, sourceId, target, p, fx) {
  switch (p.kind) {
    case "distanceAtLeast":
      return (fx.distance ?? 0) >= p.distance;
    case "targetHpBelow":
      return target.maxHp > 0 && target.hp / target.maxHp < p.frac;
    case "targetDying":
      return target.dead || target.hp <= 0 || ctx.dead.has(target.id);
    case "targetIsolated": {
      for (const u of ctx.units.values()) {
        if (u.id === target.id || u.dead || ctx.dead.has(u.id)) continue;
        if (u.kind !== "champion" || u.neutral || u.team !== target.team) continue;
        if (hypot(u.pos.x - target.pos.x, u.pos.z - target.pos.z) <= p.radius) return false;
      }
      return true;
    }
    case "targetSlowed":
      return slowPct(target, ctx.time) > 0 || isRooted(target, ctx.time);
    case "targetNearTerrain": {
      for (const [ux, uz] of TERRAIN_RING) {
        const x = target.pos.x + ux * p.distance;
        const z = target.pos.z + uz * p.distance;
        if (!ctx.nav.isWalkableAt(x, z)) return true;
      }
      return false;
    }
    case "targetIsChampion":
      return target.kind === "champion";
    case "targetHasSourceDot":
      return target.statuses.some(
        (s) => s.kind === "dot" && s.sourceId === sourceId && s.until > ctx.time
      );
    case "withinCenter": {
      if (!fx.center) return false;
      const d = hypot(target.pos.x - fx.center.x, target.pos.z - fx.center.z);
      return d <= p.radius + target.radius;
    }
  }
}
function displace(ctx, target, dx, dz, distance) {
  const len = hypot(dx, dz);
  if (len === 0 || target.moveSpeed <= 0) return;
  const dest = {
    x: target.pos.x + dx / len * distance,
    z: target.pos.z + dz / len * distance
  };
  const landed = ctx.nav.isWalkableAt(dest.x, dest.z) ? dest : ctx.nav.nearestWalkable(dest.x, dest.z, 6);
  if (landed) target.pos = { x: landed.x, z: landed.z };
  target.path = [];
}
function held(target, duration) {
  return duration * (1 - favorBonus(target.favors, "resolve"));
}
function healPower(ctx, sourceId) {
  const source = ctx.units.get(sourceId);
  return source ? 1 + favorBonus(source.favors, "resolve") : 1;
}
function applyEffects(ctx, sourceId, power, target, specs, via = "ability", fx = {}) {
  const scale = power.scale ?? 1;
  const structure = target.kind === "tower" || target.kind === "sanctum";
  if (structure && via === "ability") return;
  for (const spec of specs) {
    if (structure && (spec.kind === "slow" || spec.kind === "root" || spec.kind === "stun" || spec.kind === "taunt" || spec.kind === "knockback" || spec.kind === "pull" || spec.kind === "knockup" || spec.kind === "blind")) {
      continue;
    }
    switch (spec.kind) {
      case "damage": {
        const amount = spec.base * scale + (spec.adRatio ?? 0) * power.ad + (spec.apRatio ?? 0) * power.ap + (spec.maxHpPct ?? 0) * target.maxHp;
        dealDamage(ctx, sourceId, target, amount, spec.dtype, via);
        break;
      }
      case "heal": {
        if (target.dead || ctx.dead.has(target.id)) break;
        const amount = (spec.base * scale + (spec.apRatio ?? 0) * power.ap + (spec.maxHpPct ?? 0) * target.maxHp) * healFactor(target, ctx.time) * healPower(ctx, sourceId);
        target.hp = Math.min(target.maxHp, target.hp + amount);
        const source = ctx.units.get(sourceId);
        if (source && amount > 0) passiveOf(source)?.onHealGiven?.(ctx, source, target, amount);
        break;
      }
      case "slow":
        addStatus(target, {
          kind: "slow",
          until: ctx.time + held(target, spec.duration),
          pct: spec.pct
        });
        break;
      case "root":
        addStatus(target, { kind: "root", until: ctx.time + held(target, spec.duration) });
        break;
      case "stun":
        addStatus(target, { kind: "stun", until: ctx.time + held(target, spec.duration) });
        break;
      case "taunt":
        addStatus(target, {
          kind: "taunt",
          until: ctx.time + held(target, spec.duration),
          sourceId
        });
        break;
      case "stealth":
        addStatus(target, { kind: "stealth", until: ctx.time + spec.duration });
        break;
      case "blind":
        addStatus(target, {
          kind: "blind",
          until: ctx.time + spec.duration,
          factor: spec.factor
        });
        break;
      case "knockback": {
        const direction = spec.direction ?? "away";
        if (direction === "aside" && fx.lineFrom && fx.lineDir) {
          const side2 = fx.lineDir.x * (target.pos.z - fx.lineFrom.z) - fx.lineDir.z * (target.pos.x - fx.lineFrom.x);
          const px = side2 >= 0 ? -fx.lineDir.z : fx.lineDir.z;
          const pz = side2 >= 0 ? fx.lineDir.x : -fx.lineDir.x;
          displace(ctx, target, px, pz, spec.distance);
        } else if (direction === "toCenter" && fx.center) {
          displace(
            ctx,
            target,
            fx.center.x - target.pos.x,
            fx.center.z - target.pos.z,
            spec.distance
          );
        } else {
          const source = ctx.units.get(sourceId);
          const from = source ? source.pos : target.pos;
          displace(ctx, target, target.pos.x - from.x, target.pos.z - from.z, spec.distance);
        }
        break;
      }
      case "pull": {
        const source = ctx.units.get(sourceId);
        if (!source) break;
        const dx = source.pos.x - target.pos.x;
        const dz = source.pos.z - target.pos.z;
        const gap = hypot(dx, dz);
        const travel = Math.min(spec.distance, Math.max(0, gap - 1));
        if (travel > 0) displace(ctx, target, dx, dz, travel);
        break;
      }
      case "knockup":
        addStatus(target, { kind: "airborne", until: ctx.time + spec.duration });
        target.path = [];
        break;
      case "untargetable":
        addStatus(target, { kind: "untargetable", until: ctx.time + spec.duration });
        break;
      case "shield": {
        const value = (spec.base * scale + (spec.apRatio ?? 0) * power.ap) * healFactor(target, ctx.time) * healPower(ctx, sourceId);
        addStatus(target, {
          kind: "shield",
          until: ctx.time + spec.duration,
          remaining: value,
          burst: spec.burst ? {
            radius: spec.burst.radius,
            onBreak: spec.burst.onBreak ?? [],
            onExpire: spec.burst.onExpire ?? [],
            sourceId,
            power: { ad: power.ad, ap: power.ap, scale }
          } : void 0
        });
        break;
      }
      case "dot":
        addStatus(target, {
          kind: "dot",
          until: ctx.time + spec.duration,
          perSecond: spec.perSecond * scale,
          sourceId,
          dtype: spec.dtype
        });
        break;
      case "grievous":
        addStatus(target, {
          kind: "grievous",
          until: ctx.time + spec.duration,
          factor: spec.factor
        });
        break;
      case "buff":
        addStatus(target, {
          kind: "buff",
          until: ctx.time + spec.duration,
          msPct: spec.msPct ?? 0,
          asPct: spec.asPct ?? 0,
          armor: spec.armor ?? 0,
          mr: spec.mr ?? 0
        });
        break;
      case "mark": {
        const stacks = addMarkStack(target, spec.duration, ctx.time, sourceId);
        if (stacks >= spec.stacksToTrigger) {
          clearMarks(target, sourceId);
          applyEffects(ctx, sourceId, power, target, spec.onTrigger, via, fx);
        }
        break;
      }
      case "conditional": {
        const hit = evaluatePredicate(ctx, sourceId, target, spec.when, fx);
        const branch = hit ? spec.effects : spec.otherwise ?? [];
        if (branch.length > 0) applyEffects(ctx, sourceId, power, target, branch, via, fx);
        break;
      }
      case "cooldownRefund": {
        const source = ctx.units.get(sourceId);
        if (source?.kind !== "champion") break;
        const remaining = (source.cooldowns[spec.key] ?? 0) - ctx.time;
        if (remaining > 0) {
          source.cooldowns[spec.key] = ctx.time + remaining * (1 - spec.pctOfRemaining);
        }
        break;
      }
      case "empower":
        addStatus(target, {
          kind: "empower",
          until: ctx.time + spec.duration,
          bonus: spec.bonus,
          splashRadius: spec.splashRadius ?? 0,
          splash: spec.splash ?? [],
          scale
        });
        break;
    }
  }
}

// src/sim/combat/casting.ts
function specForRank(def, rank) {
  let spec = def.spec;
  if (def.atRank) {
    for (const o of def.atRank) {
      if (rank >= o.rank) spec = o.spec;
    }
  }
  return spec;
}
function clampToRange(from, aim, range2) {
  const dx = aim.x - from.x;
  const dz = aim.z - from.z;
  const d = hypot(dx, dz);
  if (d <= range2 || d === 0) return { x: aim.x, z: aim.z };
  return { x: from.x + dx / d * range2, z: from.z + dz / d * range2 };
}
function findEnemyTarget(ctx, caster, aim, searchRadius, castRange) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of ctx.units.values()) {
    if (!hostile(caster, u) || u.dead || ctx.dead.has(u.id)) continue;
    if (!isSpellTarget(u)) continue;
    if (isStealthed(u, ctx.time) || isUntargetable(u, ctx.time)) continue;
    const toCaster = hypot(u.pos.x - caster.pos.x, u.pos.z - caster.pos.z) - caster.radius - u.radius;
    if (toCaster > castRange) continue;
    const d = hypot(u.pos.x - aim.x, u.pos.z - aim.z) - u.radius;
    if (d > searchRadius) continue;
    if (d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
function enemiesWithin(ctx, caster, center, radius) {
  const out = [];
  for (const u of ctx.units.values()) {
    if (!hostile(caster, u) || u.dead || ctx.dead.has(u.id) || !isSpellTarget(u)) continue;
    if (hypot(u.pos.x - center.x, u.pos.z - center.z) <= radius + u.radius) out.push(u);
  }
  return out;
}
function executeCast(ctx, caster, spec, castRange, aim, power, vfx = null) {
  switch (spec.kind) {
    case "skillshot": {
      const dx = aim.x - caster.pos.x;
      const dz = aim.z - caster.pos.z;
      const d = hypot(dx, dz);
      const dir = d > 0 ? { x: dx / d, z: dz / d } : { x: 1, z: 0 };
      const id = ctx.allocId();
      ctx.projectiles.set(id, {
        id,
        sourceId: caster.id,
        team: caster.team,
        pos: { x: caster.pos.x, z: caster.pos.z },
        dir,
        speed: spec.speed,
        radius: spec.radius,
        maxRange: spec.range,
        traveled: 0,
        homingTargetId: null,
        pierce: spec.pierce ?? false,
        hitIds: /* @__PURE__ */ new Set(),
        power,
        onHit: spec.onHit,
        allyEffects: spec.allyEffects ?? [],
        chain: spec.chain ?? null,
        leaveWall: spec.leaveWall ?? null,
        aftershock: spec.aftershock ?? null,
        splashOnHit: null,
        vfx
      });
      return true;
    }
    case "zone": {
      const at = clampToRange(caster.pos, aim, castRange);
      const tickEvery = spec.tickEvery ?? 0.5;
      const id = ctx.allocId();
      ctx.zones.set(id, {
        id,
        sourceId: caster.id,
        team: caster.team,
        pos: at,
        radius: spec.radius,
        // A zone always survives long enough to detonate.
        until: ctx.time + Math.max(spec.duration, (spec.detonateDelay ?? 0) + 0.05),
        tickEvery,
        nextTickAt: ctx.time + tickEvery,
        power,
        onEnter: spec.onEnter ?? [],
        onTick: spec.onTick ?? [],
        allyOnTick: spec.allyOnTick ?? [],
        detonateAt: spec.detonateDelay !== void 0 ? ctx.time + spec.detonateDelay : null,
        onDetonate: spec.onDetonate ?? [],
        entered: /* @__PURE__ */ new Set(),
        reveal: spec.reveal ?? false,
        boundary: spec.boundary ?? null,
        boundaryNextAt: /* @__PURE__ */ new Map(),
        insideIds: /* @__PURE__ */ new Set(),
        leaveZone: spec.leaveZone ?? null,
        vfx
      });
      return true;
    }
    case "self_or_ally": {
      const at = clampToRange(caster.pos, aim, castRange);
      let target = caster;
      let bestD = Math.min(spec.searchRadius, hypot(caster.pos.x - at.x, caster.pos.z - at.z));
      for (const u of ctx.units.values()) {
        if (u.team !== caster.team || u.kind !== "champion" || u.id === caster.id) continue;
        if (u.dead || ctx.dead.has(u.id)) continue;
        const d = hypot(u.pos.x - at.x, u.pos.z - at.z);
        if (d < bestD) {
          bestD = d;
          target = u;
        }
      }
      applyEffects(ctx, caster.id, power, target, spec.effects);
      return true;
    }
    case "enemy_target": {
      const at = clampToRange(caster.pos, aim, castRange);
      const target = findEnemyTarget(ctx, caster, at, spec.searchRadius, castRange);
      if (!target) return false;
      applyEffects(ctx, caster.id, power, target, spec.effects);
      if (spec.selfEffects) applyEffects(ctx, caster.id, power, caster, spec.selfEffects);
      return true;
    }
    case "cone": {
      let dx = aim.x - caster.pos.x;
      let dz = aim.z - caster.pos.z;
      if (dx === 0 && dz === 0) {
        dx = 1;
        dz = 0;
      }
      const aimLen = hypot(dx, dz);
      const cosHalf = cos(spec.halfAngle);
      for (const u of enemiesWithin(ctx, caster, caster.pos, spec.range)) {
        const ux = u.pos.x - caster.pos.x;
        const uz = u.pos.z - caster.pos.z;
        const dot = dx * ux + dz * uz;
        if (dot >= cosHalf * aimLen * hypot(ux, uz)) {
          applyEffects(ctx, caster.id, power, u, spec.onHit);
        }
      }
      return true;
    }
    case "burst": {
      for (const u of enemiesWithin(ctx, caster, caster.pos, spec.radius)) {
        applyEffects(ctx, caster.id, power, u, spec.effects);
      }
      if (spec.selfEffects) applyEffects(ctx, caster.id, power, caster, spec.selfEffects);
      return true;
    }
    case "dash": {
      let goal = aim;
      if (spec.toAlly) {
        const beside = allyDashAim(ctx, caster, aim, spec.range, spec.toAlly.searchRadius);
        if (!beside) return false;
        goal = beside;
      }
      const at = clampToRange(caster.pos, goal, spec.range);
      if (spec.speed !== void 0 && spec.speed > 0) {
        const dx = at.x - caster.pos.x;
        const dz = at.z - caster.pos.z;
        const dist2 = hypot(dx, dz);
        const dir = dist2 > 0 ? { x: dx / dist2, z: dz / dist2 } : { x: 1, z: 0 };
        caster.path = [];
        caster.activeDash = {
          from: { x: caster.pos.x, z: caster.pos.z },
          dir,
          speed: spec.speed,
          remaining: dist2,
          traveled: 0,
          landRadius: spec.landRadius ?? 0,
          onLand: spec.onLand ?? [],
          selfEffects: spec.selfEffects ?? [],
          passThrough: spec.passThrough ?? [],
          hitIds: /* @__PURE__ */ new Set(),
          power,
          vfx
        };
        if (spec.untargetableDuringTravel) {
          addStatus(caster, {
            kind: "untargetable",
            until: ctx.time + dist2 / spec.speed + 0.05
          });
        }
        return true;
      }
      const landed = ctx.nav.isWalkableAt(at.x, at.z) ? at : ctx.nav.nearestWalkable(at.x, at.z, 6);
      if (landed) {
        caster.pos = { x: landed.x, z: landed.z };
        caster.path = [];
      }
      const fx = {
        center: { x: caster.pos.x, z: caster.pos.z },
        distance: hypot(caster.pos.x - aim.x, caster.pos.z - aim.z)
      };
      if (spec.onLand && spec.landRadius) {
        for (const u of enemiesWithin(ctx, caster, caster.pos, spec.landRadius)) {
          applyEffects(ctx, caster.id, power, u, spec.onLand, "ability", fx);
        }
      }
      if (spec.selfEffects) applyEffects(ctx, caster.id, power, caster, spec.selfEffects);
      return true;
    }
    case "wall": {
      const at = clampToRange(caster.pos, aim, castRange);
      const dir = { x: at.x - caster.pos.x, z: at.z - caster.pos.z };
      raiseWall(ctx, caster.id, caster.team, at, dir, spec.length, spec.duration);
      return true;
    }
  }
}
function castAbility(ctx, caster, key, def, aim) {
  if (ctx.dead.has(caster.id) || caster.dead) return false;
  if (isStunned(caster, ctx.time)) return false;
  const armed = caster.recastArmed;
  if (armed && armed.key === key && armed.until > ctx.time) {
    if (isRooted(caster, ctx.time)) return false;
    caster.recastArmed = null;
    const landed = ctx.nav.isWalkableAt(armed.origin.x, armed.origin.z) ? armed.origin : ctx.nav.nearestWalkable(armed.origin.x, armed.origin.z, 6);
    if (landed) {
      caster.pos = { x: landed.x, z: landed.z };
      caster.path = [];
      caster.activeDash = null;
    }
    breakStealth(caster);
    ctx.events.push({ type: "cast", unitId: caster.id, key });
    return true;
  }
  const rank = effectiveRank(caster, key);
  const spec = specForRank(def, rank);
  if (spec.kind === "dash" && isRooted(caster, ctx.time)) return false;
  if (rank <= 0) return false;
  if ((caster.cooldowns[key] ?? 0) > ctx.time) return false;
  if (caster.mana < def.manaCost) return false;
  const power = {
    ad: caster.stats.ad,
    ap: caster.stats.ap,
    scale: 1 + RANK_BASE_SCALE * (rank - 1)
  };
  if (spec.kind === "enemy_target") {
    const at = clampToRange(caster.pos, aim, def.castRange);
    if (!findEnemyTarget(ctx, caster, at, spec.searchRadius, def.castRange)) return false;
  }
  if (spec.kind === "dash" && spec.toAlly) {
    const at = clampToRange(caster.pos, aim, def.castRange);
    if (!allyDashAim(ctx, caster, at, spec.range, spec.toAlly.searchRadius)) return false;
  }
  if (spec.kind === "dash" && spec.speed !== void 0 && spec.speed > 0) {
    const goal = spec.toAlly ? allyDashAim(ctx, caster, aim, spec.range, spec.toAlly.searchRadius) ?? aim : aim;
    const at = clampToRange(caster.pos, goal, spec.range);
    if (!ctx.nav.lineOfWalk(caster.pos, at)) return false;
  }
  caster.cooldowns[key] = ctx.time + def.cooldown * (1 - RANK_CD_SCALE * (rank - 1));
  caster.mana -= def.manaCost;
  breakStealth(caster);
  passiveOf(caster)?.onCast?.(ctx, caster, key);
  ctx.events.push({ type: "cast", unitId: caster.id, key });
  if (def.recast) {
    caster.recastArmed = {
      key,
      until: ctx.time + def.recast.window,
      origin: { x: caster.pos.x, z: caster.pos.z }
    };
  }
  if (def.windup && def.windup > 0) {
    caster.pendingSpell = { key, aim: { x: aim.x, z: aim.z }, resolveAt: ctx.time + def.windup };
    caster.path = [];
    return true;
  }
  return executeCast(ctx, caster, spec, def.castRange, aim, power, `${caster.championId}_${key}`);
}
function stepWindups(ctx) {
  for (const u of ctx.units.values()) {
    if (!u.pendingSpell) continue;
    if (u.dead || ctx.dead.has(u.id) || isStunned(u, ctx.time)) {
      if (u.recastArmed && u.recastArmed.key === u.pendingSpell.key) u.recastArmed = null;
      u.pendingSpell = null;
      continue;
    }
    if (ctx.time < u.pendingSpell.resolveAt) continue;
    const pending = u.pendingSpell;
    u.pendingSpell = null;
    const def = u.champion?.abilities[pending.key];
    if (!def) continue;
    const rank = effectiveRank(u, pending.key);
    const power = {
      ad: u.stats.ad,
      ap: u.stats.ap,
      scale: 1 + RANK_BASE_SCALE * (Math.max(1, rank) - 1)
    };
    executeCast(
      ctx,
      u,
      specForRank(def, Math.max(1, rank)),
      def.castRange,
      pending.aim,
      power,
      `${u.championId}_${pending.key}`
    );
  }
}

// src/sim/forge/envelopes.ts
var STAT_ENVELOPE = 190;
var GROWTH_ENVELOPE = 90;
var KIT_ENVELOPE = 820;
var ENVELOPE_KEYS = ["stats", "growth", "kit"];
var ENVELOPES = {
  stats: STAT_ENVELOPE,
  growth: GROWTH_ENVELOPE,
  kit: KIT_ENVELOPE
};
var ENVELOPE_LABELS = {
  stats: "Stat envelope",
  growth: "Growth envelope",
  kit: "Kit envelope"
};
function kitSpendOf(bill) {
  const a = bill.abilities;
  return bill.passive + a.Q + a.W + a.E + a.R;
}
function envelopeSpend(bill) {
  return { stats: bill.stats, growth: bill.growth, kit: kitSpendOf(bill) };
}
function envelopeErrors(bill) {
  const spend = envelopeSpend(bill);
  const errors = [];
  for (const key of ENVELOPE_KEYS) {
    if (spend[key] > ENVELOPES[key]) {
      errors.push(
        `power budget: ${ENVELOPE_LABELS[key].toLowerCase()} ${spend[key].toFixed(1)} points of ${ENVELOPES[key]}`
      );
    }
  }
  return errors;
}

// src/sim/forge/budget.ts
var POWER_BUDGET = STAT_ENVELOPE + GROWTH_ENVELOPE + KIT_ENVELOPE;
var EFFECT_PRICES = {
  ratioValue: 55,
  maxHpPctValue: 900,
  healWeight: 1,
  dotWeight: 0.8,
  slowPerPctSecond: 90,
  rootPerSecond: 110,
  stunPerSecond: 140,
  tauntPerSecond: 130,
  knockupPerSecond: 140,
  knockbackPerUnit: 22,
  pullPerUnit: 18,
  blindPerFactorSecond: 90,
  stealthPerSecond: 35,
  untargetablePerSecond: 110,
  shieldWeight: 0.9,
  shieldBurstWeight: 0.8,
  grievousPerFactorSecond: 80,
  buffMsPctSecond: 70,
  buffAsPctSecond: 60,
  buffArmorSecond: 1.2,
  buffMrSecond: 1.2,
  markOverhead: 5,
  // A conditional resolves one branch: the stronger one is paid in full,
  // the weaker one at a quarter (it still adds coverage).
  conditionalWeakBranch: 0.25,
  cooldownRefundPerPct: 60,
  empowerSplashWeight: 0.8
};
var CAST_PRICES = {
  // Deliveries: how reliably and how widely a payload lands.
  skillshotPierce: 1.5,
  skillshotAllyWeight: 0.8,
  skillshotChainWeight: 0.5,
  skillshotAftershockWeight: 0.6,
  skillshotWallPerSecond: 12,
  // A repeating zone tick is heavily discounted: standing in it is the
  // victim's mistake, and leaving is always on the table.
  zoneTickWeight: 0.35,
  zoneDetonateWeight: 0.8,
  zoneBoundaryWeight: 0.25,
  zoneRevealPerSecond: 6,
  aoeWeight: 1.25,
  pointClickWeight: 1.35,
  mobilityPerRange: 14,
  blinkPremium: 35,
  dashToAllyDiscount: 0.8,
  dashPassThroughWeight: 1.3,
  dashUntargetable: 45,
  wallPerLengthSecond: 4.5,
  recastCost: 40
};
var AVAIL_PIVOT = 10;
var AVAIL_SOFT = 6;
var MANA_RELIEF_PER_POINT = 24e-4;
var MANA_RELIEF_CAP = 0.2;
var WINDUP_RELIEF_PER_SECOND = 0.4;
var WINDUP_RELIEF_CAP = 0.2;
var BASE_STAT_PRICES = {
  hp: 0.15,
  mana: 0.03,
  ad: 2,
  ap: 0,
  armor: 1.5,
  mr: 1.5,
  attackRange: 7,
  attackSpeed: 80,
  moveSpeed: 50,
  hpRegen: 5,
  manaRegen: 5,
  radius: 0
};
var GROWTH_PRICES = {
  hp: 0.4,
  mana: 0.15,
  ad: 9,
  armor: 10,
  mr: 10
};
function costOfEffects(list) {
  if (!list) return 0;
  let total = 0;
  for (const e of list) total += costOfEffect(e);
  return total;
}
function costOfEffect(e) {
  const P = EFFECT_PRICES;
  switch (e.kind) {
    case "damage":
      return e.base + (e.adRatio ?? 0) * P.ratioValue + (e.apRatio ?? 0) * P.ratioValue + (e.maxHpPct ?? 0) * P.maxHpPctValue;
    case "heal":
      return (e.base + (e.apRatio ?? 0) * P.ratioValue + (e.maxHpPct ?? 0) * P.maxHpPctValue) * P.healWeight;
    case "dot":
      return e.perSecond * e.duration * P.dotWeight;
    case "slow":
      return e.pct * e.duration * P.slowPerPctSecond;
    case "root":
      return e.duration * P.rootPerSecond;
    case "stun":
      return e.duration * P.stunPerSecond;
    case "taunt":
      return e.duration * P.tauntPerSecond;
    case "knockup":
      return e.duration * P.knockupPerSecond;
    case "knockback":
      return e.distance * P.knockbackPerUnit;
    case "pull":
      return e.distance * P.pullPerUnit;
    case "blind":
      return e.duration * e.factor * P.blindPerFactorSecond;
    case "stealth":
      return e.duration * P.stealthPerSecond;
    case "untargetable":
      return e.duration * P.untargetablePerSecond;
    case "shield": {
      const value = (e.base + (e.apRatio ?? 0) * P.ratioValue) * P.shieldWeight;
      const burst = e.burst ? Math.max(costOfEffects(e.burst.onBreak), costOfEffects(e.burst.onExpire)) * P.shieldBurstWeight : 0;
      return value + burst;
    }
    case "grievous":
      return e.duration * e.factor * P.grievousPerFactorSecond;
    case "buff":
      return e.duration * ((e.msPct ?? 0) * P.buffMsPctSecond + (e.asPct ?? 0) * P.buffAsPctSecond + (e.armor ?? 0) * P.buffArmorSecond + (e.mr ?? 0) * P.buffMrSecond);
    case "mark":
      return P.markOverhead + costOfEffects(e.onTrigger) / e.stacksToTrigger;
    case "conditional": {
      const a = costOfEffects(e.effects);
      const b = costOfEffects(e.otherwise);
      return Math.max(a, b) + P.conditionalWeakBranch * Math.min(a, b);
    }
    case "cooldownRefund":
      return e.pctOfRemaining * P.cooldownRefundPerPct;
    case "empower":
      return costOfEffects(e.bonus) + costOfEffects(e.splash) * P.empowerSplashWeight;
  }
}
function costOfCast(spec, castRange) {
  const C = CAST_PRICES;
  switch (spec.kind) {
    case "skillshot": {
      let payload = costOfEffects(spec.onHit) * (spec.pierce ? C.skillshotPierce : 1);
      payload += costOfEffects(spec.allyEffects) * C.skillshotAllyWeight;
      if (spec.chain) payload += costOfEffects(spec.chain.onHit) * C.skillshotChainWeight;
      if (spec.leaveWall) payload += spec.leaveWall.duration * C.skillshotWallPerSecond;
      if (spec.aftershock) {
        payload += costOfEffects(spec.aftershock.effects) * C.skillshotAftershockWeight;
      }
      return payload * (0.85 + spec.radius * 0.25) * (1 + spec.range * 0.015);
    }
    case "zone": {
      const ticks = spec.duration / (spec.tickEvery ?? 0.5);
      let payload = costOfEffects(spec.onEnter);
      payload += (costOfEffects(spec.onTick) + costOfEffects(spec.allyOnTick)) * ticks * C.zoneTickWeight;
      payload += costOfEffects(spec.onDetonate) * C.zoneDetonateWeight;
      if (spec.boundary) {
        payload += costOfEffects(spec.boundary.effects) * (spec.duration / spec.boundary.perUnitEvery) * C.zoneBoundaryWeight;
      }
      if (spec.reveal) payload += spec.duration * C.zoneRevealPerSecond;
      if (spec.leaveZone) {
        const lz = spec.leaveZone;
        payload += costOfEffects(lz.onTick) * (lz.duration / (lz.tickEvery ?? 0.5)) * C.zoneTickWeight * (0.8 + lz.radius * 0.15);
      }
      return payload * (0.8 + spec.radius * 0.15) * (1 + castRange * 0.012);
    }
    case "self_or_ally":
      return costOfEffects(spec.effects);
    case "enemy_target":
      return (costOfEffects(spec.effects) * C.pointClickWeight + costOfEffects(spec.selfEffects)) * (1 + castRange * 0.015);
    case "cone":
      return costOfEffects(spec.onHit) * C.aoeWeight * (0.8 + spec.range * 0.08 + spec.halfAngle * 0.25);
    case "burst":
      return costOfEffects(spec.effects) * C.aoeWeight * (0.7 + spec.radius * 0.15) + costOfEffects(spec.selfEffects);
    case "dash": {
      let cost = spec.range * C.mobilityPerRange * (spec.toAlly ? C.dashToAllyDiscount : 1);
      if (spec.speed === void 0) cost += C.blinkPremium;
      cost += costOfEffects(spec.onLand) * (0.9 + (spec.landRadius ?? 0) * 0.15);
      cost += costOfEffects(spec.passThrough) * C.dashPassThroughWeight;
      cost += costOfEffects(spec.selfEffects);
      if (spec.untargetableDuringTravel) cost += C.dashUntargetable;
      return cost;
    }
    case "wall":
      return spec.length * spec.duration * C.wallPerLengthSecond;
  }
}
function costOfAbility(def) {
  let delivery = costOfCast(def.spec, def.castRange);
  if (def.atRank) {
    const maxRank = Math.max(...def.atRank.map((o) => o.rank));
    delivery = Math.max(delivery, costOfCast(specForRank(def, maxRank), def.castRange));
  }
  const availability = AVAIL_PIVOT / (AVAIL_SOFT + def.cooldown);
  const manaRelief = Math.min(MANA_RELIEF_CAP, def.manaCost * MANA_RELIEF_PER_POINT);
  const windupRelief = Math.min(WINDUP_RELIEF_CAP, (def.windup ?? 0) * WINDUP_RELIEF_PER_SECOND);
  let cost = delivery * availability * (1 - manaRelief) * (1 - windupRelief);
  if (def.recast) cost += CAST_PRICES.recastCost;
  return cost;
}
function costOfBaseStats(base) {
  let total = 0;
  for (const key of Object.keys(BASE_STAT_PRICES)) {
    total += Math.max(0, base[key] - BASE_STAT_BOUNDS[key].min) * BASE_STAT_PRICES[key];
  }
  return total;
}
function costOfGrowth(growth) {
  let total = 0;
  for (const key of Object.keys(GROWTH_PRICES)) {
    total += Math.max(0, growth[key] - GROWTH_BOUNDS[key].min) * GROWTH_PRICES[key];
  }
  return total;
}
function costOfPassive(ref) {
  const tpl = PASSIVE_TEMPLATES[ref.template];
  if (!tpl) return 0;
  let total = tpl.baseCost;
  for (const param of tpl.params) {
    total += (ref.params[param.key] ?? param.min) * param.costPerUnit;
  }
  return Math.max(0, total);
}
function budgetOf(def) {
  const abilities = {
    Q: costOfAbility(def.abilities.Q),
    W: costOfAbility(def.abilities.W),
    E: costOfAbility(def.abilities.E),
    R: costOfAbility(def.abilities.R)
  };
  const stats = costOfBaseStats(def.base);
  const growth = costOfGrowth(def.growth);
  const passive = costOfPassive(def.passive);
  return {
    stats,
    growth,
    abilities,
    passive,
    total: stats + growth + passive + abilities.Q + abilities.W + abilities.E + abilities.R
  };
}

// src/sim/forge/burst.ts
var BURST_REF = { hp: 540, ad: 80, ap: 0, tickWindow: 2 };
var BURST_CAPS = { basic: 0.5, ult: 0.75, basics: 0.9 };
var BASIC_KEYS = ["Q", "W", "E"];
function burstCapOf(key) {
  return BURST_REF.hp * (key === "R" ? BURST_CAPS.ult : BURST_CAPS.basic);
}
var BASICS_BURST_CAP = BURST_REF.hp * BURST_CAPS.basics;
function ticksIn(duration, tickEvery) {
  return Math.floor(Math.min(duration, BURST_REF.tickWindow) / (tickEvery ?? 0.5));
}
function burstOfEffects(list) {
  if (!list) return 0;
  let total = 0;
  for (const e of list) total += burstOfEffect(e);
  return total;
}
function burstOfEffect(e) {
  switch (e.kind) {
    case "damage":
      return e.base + (e.adRatio ?? 0) * BURST_REF.ad + (e.apRatio ?? 0) * BURST_REF.ap + (e.maxHpPct ?? 0) * BURST_REF.hp;
    case "dot":
      return e.perSecond * Math.min(e.duration, BURST_REF.tickWindow);
    case "conditional":
      return Math.max(burstOfEffects(e.effects), burstOfEffects(e.otherwise));
    case "mark":
      return burstOfEffects(e.onTrigger);
    case "empower":
      return burstOfEffects(e.bonus);
    case "shield":
      return e.burst ? Math.max(burstOfEffects(e.burst.onBreak), burstOfEffects(e.burst.onExpire)) : 0;
    default:
      return 0;
  }
}
function burstOfSpec(spec) {
  switch (spec.kind) {
    case "skillshot":
      return burstOfEffects(spec.onHit) + burstOfEffects(spec.aftershock?.effects);
    case "zone": {
      let total = burstOfEffects(spec.onEnter);
      total += burstOfEffects(spec.onTick) * ticksIn(spec.duration, spec.tickEvery);
      total += burstOfEffects(spec.onDetonate);
      total += burstOfEffects(spec.boundary?.effects);
      if (spec.leaveZone) {
        total += burstOfEffects(spec.leaveZone.onTick) * ticksIn(spec.leaveZone.duration, spec.leaveZone.tickEvery);
      }
      return total;
    }
    case "self_or_ally":
      return burstOfEffects(spec.effects);
    case "enemy_target":
      return burstOfEffects(spec.effects);
    case "cone":
      return burstOfEffects(spec.onHit);
    case "burst":
      return burstOfEffects(spec.effects);
    case "dash":
      return burstOfEffects(spec.onLand) + burstOfEffects(spec.passThrough);
    case "wall":
      return 0;
  }
}
function burstOfAbility(def) {
  let most = burstOfSpec(def.spec);
  for (const o of def.atRank ?? []) most = Math.max(most, burstOfSpec(o.spec));
  return most;
}
function burstOf(def) {
  const abilities = {
    Q: burstOfAbility(def.abilities.Q),
    W: burstOfAbility(def.abilities.W),
    E: burstOfAbility(def.abilities.E),
    R: burstOfAbility(def.abilities.R)
  };
  return {
    abilities,
    basics: abilities.Q + abilities.W + abilities.E,
    refHp: BURST_REF.hp
  };
}
function burstVerdict(def) {
  const report2 = burstOf(def);
  const abilities = {
    Q: report2.abilities.Q <= burstCapOf("Q"),
    W: report2.abilities.W <= burstCapOf("W"),
    E: report2.abilities.E <= burstCapOf("E"),
    R: report2.abilities.R <= burstCapOf("R")
  };
  const basics = report2.basics <= BASICS_BURST_CAP;
  return {
    abilities,
    basics,
    ok: basics && abilities.Q && abilities.W && abilities.E && abilities.R
  };
}
function burstErrors(def) {
  const report2 = burstOf(def);
  const errors = [];
  for (const key of ["Q", "W", "E", "R"]) {
    const cap = burstCapOf(key);
    const hit = report2.abilities[key];
    if (hit > cap) {
      const share = key === "R" ? BURST_CAPS.ult : BURST_CAPS.basic;
      errors.push(
        `burst cap: ${key} deals ${hit.toFixed(0)} to one target at rank 1, ${key === "R" ? "an ultimate" : "a basic spell"} may deal ${cap.toFixed(0)} (${Math.round(100 * share)} percent of ${BURST_REF.hp} health)`
      );
    }
  }
  if (report2.basics > BASICS_BURST_CAP) {
    errors.push(
      `burst cap: Q, W and E together deal ${report2.basics.toFixed(0)} to one target at rank 1, the three basics may deal ${BASICS_BURST_CAP.toFixed(0)} (${Math.round(100 * BURST_CAPS.basics)} percent of ${BURST_REF.hp} health)`
    );
  }
  return errors;
}

// src/sim/forge/validate.ts
var FORGED_ID_PATTERN = /^forged_[a-z0-9_]{1,32}$/;
var FORGED_ROLES = [
  "Tank",
  "Fighter",
  "Mage",
  "Battlemage",
  "Assassin",
  "Marksman",
  "Support",
  "Skirmisher"
];
var NAME_MAX = 40;
var TAGLINE_MAX = 90;
var INSTANT_KINDS = ["burst", "cone", "enemy_target"];
var HARD_CC = ["stun", "taunt", "knockup"];
var TELEGRAPH_WINDUP_MIN = 0.2;
function listHasHardCc(list) {
  if (!list) return false;
  for (const e of list) {
    if (HARD_CC.includes(e.kind)) return true;
    if (e.kind === "conditional") {
      if (listHasHardCc(e.effects) || listHasHardCc(e.otherwise)) return true;
    }
  }
  return false;
}
function instantEnemyEffects(spec) {
  switch (spec.kind) {
    case "burst":
      return spec.effects;
    case "cone":
      return spec.onHit;
    case "enemy_target":
      return spec.effects;
    default:
      return void 0;
  }
}
function checkString(errors, path12, value, max, required) {
  if (typeof value !== "string") {
    errors.push(`${path12}: must be a string`);
    return;
  }
  if (required && value.trim().length === 0) errors.push(`${path12}: must not be empty`);
  if (value.length > max) errors.push(`${path12}: longer than ${max} characters`);
}
function structureErrors(def) {
  const errors = [];
  if (typeof def !== "object" || def === null) return ["def: must be an object"];
  if (typeof def.id !== "string" || !FORGED_ID_PATTERN.test(def.id)) {
    errors.push(`id: must match ${FORGED_ID_PATTERN} (never a roster id)`);
  }
  checkString(errors, "name", def.name, NAME_MAX, true);
  checkString(errors, "title", def.title, NAME_MAX, false);
  checkString(errors, "tagline", def.tagline, TAGLINE_MAX, false);
  checkString(errors, "creator", def.creator, NAME_MAX, false);
  if (!FORGED_ROLES.includes(def.role)) {
    errors.push(`role: must be one of ${FORGED_ROLES.join(", ")}`);
  }
  if (def.attackSound !== void 0 && !isAttackSound(def.attackSound)) {
    errors.push(`attackSound: must be one of ${ATTACK_SOUNDS.map((s) => s.id).join(", ")}`);
  }
  return errors;
}
function passiveErrors(def) {
  const errors = [];
  const ref = def.passive;
  if (typeof ref !== "object" || ref === null) return ["passive: must be a template reference"];
  checkString(errors, "passive.name", ref.name, NAME_MAX, true);
  if (ref.flavor !== void 0)
    checkString(errors, "passive.flavor", ref.flavor, FLAVOR_MAX, false);
  const tpl = typeof ref.template === "string" ? PASSIVE_TEMPLATES[ref.template] : void 0;
  if (!tpl) {
    errors.push(`passive.template: unknown template '${String(ref.template)}'`);
    return errors;
  }
  if (typeof ref.params !== "object" || ref.params === null) {
    errors.push("passive.params: must be an object");
    return errors;
  }
  for (const param of tpl.params) {
    const value = ref.params[param.key];
    const path12 = `passive.params.${param.key}`;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors.push(`${path12}: must be a finite number`);
      continue;
    }
    if (value < param.min || value > param.max) {
      errors.push(`${path12}: ${value} is outside [${param.min}, ${param.max}]`);
    }
    if (param.integer && !Number.isInteger(value)) {
      errors.push(`${path12}: ${value} must be an integer`);
    }
  }
  const declared = new Set(tpl.params.map((p) => p.key));
  for (const key of Object.keys(ref.params)) {
    if (!declared.has(key)) {
      errors.push(`passive.params.${key}: not a parameter of '${tpl.id}'`);
    }
  }
  return errors;
}
function telegraphErrors(def) {
  const errors = [];
  if (typeof def.abilities !== "object" || def.abilities === null) return errors;
  for (const key of ["Q", "W", "E", "R"]) {
    const ability = def.abilities[key];
    if (typeof ability !== "object" || ability === null) continue;
    const specs = [ability.spec, ...ability.atRank?.map((o) => o.spec) ?? []];
    for (const spec of specs) {
      if (typeof spec !== "object" || spec === null) continue;
      if (!INSTANT_KINDS.includes(spec.kind)) continue;
      if (!listHasHardCc(instantEnemyEffects(spec))) continue;
      if ((ability.windup ?? 0) < TELEGRAPH_WINDUP_MIN) {
        errors.push(
          `abilities.${key}: instant hard crowd control needs a windup of at least ${TELEGRAPH_WINDUP_MIN} seconds (hard CC telegraphs itself)`
        );
      }
      break;
    }
  }
  return errors;
}
function validateForged(def) {
  const errors = structureErrors(def);
  if (typeof def === "object" && def !== null) {
    errors.push(...passiveErrors(def));
    errors.push(...boundsErrors(def));
  }
  if (errors.length > 0) return { ok: false, errors, cost: null };
  errors.push(...telegraphErrors(def));
  const cost = budgetOf(def);
  errors.push(...envelopeErrors(cost));
  errors.push(...burstErrors(def));
  if (errors.length > 0) return { ok: false, errors, cost };
  return { ok: true, cost };
}

// src/sim/champion_registry.ts
var ChampionRegistry = class {
  // Insertion order is preserved and re-emitted by forgedDefs(): the order
  // definitions are registered in is part of a match's identity (replays
  // re-register them identically).
  forged = /* @__PURE__ */ new Map();
  // Roster first: a forged id can never shadow a roster champion (the
  // validator's forged_ prefix already guarantees no collision).
  get(championId) {
    return CHAMPIONS[championId] ?? this.forged.get(championId)?.resolved ?? null;
  }
  // Registers one forged definition for this match. The deterministic
  // validator is the gate: an invalid def never enters a registry, whoever
  // sent it. Throws, because by the time a def reaches match setup it was
  // already validated upstream; failing loud here catches drift.
  addForged(def) {
    const v = validateForged(def);
    if (!v.ok) {
      throw new Error(`invalid forged champion '${String(def?.id)}': ${v.errors.join("; ")}`);
    }
    if (this.forged.has(def.id)) {
      throw new Error(`forged champion '${def.id}' is already registered`);
    }
    const resolved = resolveForgedChampion(def);
    this.forged.set(def.id, { source: def, resolved });
    return resolved;
  }
  // The match's forged definitions, exactly as registered: what match setup
  // distributes to clients and what a replay embeds instead of ids alone.
  forgedDefs() {
    return [...this.forged.values()].map((f) => f.source);
  }
};

// src/sim/pathfind.ts
var SQRT2 = Math.SQRT2;
var NODE_CAP = 6e4;
var DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1]
];
function octile(ax, az, bx, bz) {
  const dx = Math.abs(ax - bx);
  const dz = Math.abs(az - bz);
  return dx > dz ? dx + (SQRT2 - 1) * dz : dz + (SQRT2 - 1) * dx;
}
function snap(grid, p) {
  return grid.isWalkableAt(p.x, p.z) ? p : grid.nearestWalkable(p.x, p.z);
}
var scratchCells = -1;
var generation = 0;
var seen = new Uint32Array(0);
var gScore = new Float64Array(0);
var came = new Int32Array(0);
var closedAt = new Uint32Array(0);
var heapF = new Float64Array(0);
var heapI = new Int32Array(0);
function scratchFor(cells) {
  if (scratchCells === cells && generation < 4294967294) return;
  scratchCells = cells;
  generation = 0;
  seen = new Uint32Array(cells);
  gScore = new Float64Array(cells);
  came = new Int32Array(cells);
  closedAt = new Uint32Array(cells);
  heapF = new Float64Array(Math.max(1024, cells));
  heapI = new Int32Array(Math.max(1024, cells));
}
function growHeap() {
  const f = new Float64Array(heapF.length * 2);
  const i = new Int32Array(heapI.length * 2);
  f.set(heapF);
  i.set(heapI);
  heapF = f;
  heapI = i;
}
function findPath(grid, from, to) {
  const start = snap(grid, from);
  const goal = snap(grid, to);
  if (!start || !goal) return [];
  if (grid.lineOfWalk(start, goal)) return [{ x: goal.x, z: goal.z }];
  const n = grid.cells;
  const sc = grid.worldToCell(start.x, start.z);
  const gc = grid.worldToCell(goal.x, goal.z);
  const sIdx = sc.cz * n + sc.cx;
  const gIdx = gc.cz * n + gc.cx;
  scratchFor(n * n);
  const gen = ++generation;
  let size = 0;
  const push2 = (idx, f) => {
    if (size === heapF.length) growHeap();
    heapF[size] = f;
    heapI[size] = idx;
    let i = size++;
    while (i > 0) {
      const p = i - 1 >> 1;
      const pf = heapF[p];
      if (pf <= f) break;
      heapF[i] = pf;
      heapI[i] = heapI[p];
      heapF[p] = f;
      heapI[p] = idx;
      i = p;
    }
  };
  const pop = () => {
    const top = heapI[0];
    size--;
    if (size > 0) {
      const lf = heapF[size];
      const li = heapI[size];
      heapF[0] = lf;
      heapI[0] = li;
      let i = 0;
      for (; ; ) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        let mf = lf;
        if (l < size && heapF[l] < mf) {
          m = l;
          mf = heapF[l];
        }
        if (r < size && heapF[r] < mf) {
          m = r;
          mf = heapF[r];
        }
        if (m === i) break;
        heapF[i] = mf;
        heapI[i] = heapI[m];
        heapF[m] = lf;
        heapI[m] = li;
        i = m;
      }
    }
    return top;
  };
  seen[sIdx] = gen;
  gScore[sIdx] = 0;
  came[sIdx] = -1;
  push2(sIdx, octile(sc.cx, sc.cz, gc.cx, gc.cz));
  let found = false;
  let visited = 0;
  while (size > 0) {
    const cur = pop();
    if (cur === gIdx) {
      found = true;
      break;
    }
    if (closedAt[cur] === gen) continue;
    closedAt[cur] = gen;
    if (++visited > NODE_CAP) break;
    const cx = cur % n;
    const cz = cur / n | 0;
    const gCur = gScore[cur];
    for (const [dx, dz] of DIRS) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (!grid.isWalkableCell(nx, nz)) continue;
      if (dx !== 0 && dz !== 0 && (!grid.isWalkableCell(cx + dx, cz) || !grid.isWalkableCell(cx, cz + dz))) {
        continue;
      }
      const ni = nz * n + nx;
      if (closedAt[ni] === gen) continue;
      const cost = dx === 0 || dz === 0 ? 1 : SQRT2;
      const ng = gCur + cost;
      if (seen[ni] !== gen || ng < gScore[ni]) {
        seen[ni] = gen;
        gScore[ni] = ng;
        came[ni] = cur;
        push2(ni, ng + octile(nx, nz, gc.cx, gc.cz));
      }
    }
  }
  if (!found) return [];
  const cellsPath = [];
  for (let c = gIdx; c !== -1; c = came[c]) cellsPath.push(c);
  cellsPath.reverse();
  const pts = cellsPath.map((index) => grid.cellToWorld(index % n, index / n | 0));
  pts[pts.length - 1] = { x: goal.x, z: goal.z };
  return smooth(grid, start, pts);
}
function smooth(grid, from, pts) {
  const out = [];
  let anchor = from;
  let i = 0;
  while (i < pts.length) {
    let j = i;
    for (let k = pts.length - 1; k > i; k--) {
      if (grid.lineOfWalk(anchor, pts[k])) {
        j = k;
        break;
      }
    }
    const p = pts[j];
    out.push({ x: p.x, z: p.z });
    anchor = p;
    i = j + 1;
  }
  return out;
}

// src/sim/combat/tower_shot.ts
var TOWER_RAMP_PER_HIT = 0.35;
var TOWER_RAMP_CAP = 4;
var TOWER_HP_PCT_BASE = 0.03;
var TOWER_HP_PCT_PER_HIT = 0.02;
function towerHeat(stacks) {
  return Math.min(Math.max(0, stacks), TOWER_RAMP_CAP);
}
function towerShotAd(baseAd, stacks) {
  return baseAd * (1 + TOWER_RAMP_PER_HIT * towerHeat(stacks));
}
function towerShotHpPct(stacks) {
  return TOWER_HP_PCT_BASE + TOWER_HP_PCT_PER_HIT * towerHeat(stacks);
}

// src/sim/combat/auto_attack.ts
var RANGED_THRESHOLD = 2;
var BOLT_SPEED = 30;
var REPATH_DISTANCE = 2;
var ATTACK_WINDUP_FRACTION = 0.3;
var ATTACK_WINDUP_MAX = 0.35;
var SWARM_WINDUP_FRACTION = 0.15;
var SWARM_WINDUP_MAX = 0.15;
function attackWindupSeconds(cadence, champion2 = true) {
  const fraction = champion2 ? ATTACK_WINDUP_FRACTION : SWARM_WINDUP_FRACTION;
  const max = champion2 ? ATTACK_WINDUP_MAX : SWARM_WINDUP_MAX;
  return Math.min(max, fraction / Math.max(0.1, cadence));
}
var DISPLACEMENT_CANCEL = 0.8;
var STRIKE_GRACE = 2;
function beginWindup(ctx, u, target) {
  breakStealth(u);
  ctx.events.push({ type: "attack", unitId: u.id, targetId: target.id });
  const cadence = Math.max(0.1, u.stats.attackSpeed * (1 + attackSpeedBonusPct(u, ctx.time)));
  u.attackReadyAt = ctx.time + 1 / cadence;
  u.pendingAttack = {
    targetId: target.id,
    resolveAt: ctx.time + attackWindupSeconds(cadence, u.kind === "champion"),
    startX: u.pos.x,
    startZ: u.pos.z
  };
}
function strike(ctx, u, target) {
  let ad = u.stats.ad;
  let hpPct = 0;
  if (u.kind === "tower" && target.kind === "champion") {
    ad = towerShotAd(ad, u.passiveStacks);
    hpPct = towerShotHpPct(u.passiveStacks);
    u.passiveStacks += 1;
  }
  if (u.bitePct > 0 && target.kind === "champion") hpPct += u.bitePct;
  const empower = u.kind === "champion" ? consumeEmpower(u, ctx.time) : null;
  if (u.stats.attackRange > RANGED_THRESHOLD) {
    const id = ctx.allocId();
    ctx.projectiles.set(id, {
      id,
      sourceId: u.id,
      team: u.team,
      pos: { x: u.pos.x, z: u.pos.z },
      dir: { x: 0, z: 0 },
      speed: BOLT_SPEED,
      radius: 0.35,
      maxRange: Number.POSITIVE_INFINITY,
      traveled: 0,
      homingTargetId: target.id,
      pierce: false,
      hitIds: /* @__PURE__ */ new Set(),
      power: { ad, ap: u.stats.ap, scale: empower?.scale },
      onHit: [
        { kind: "damage", base: 0, adRatio: 1, dtype: "physical" },
        ...hpPct > 0 ? [{ kind: "damage", base: 0, maxHpPct: hpPct, dtype: "true" }] : [],
        ...empower ? empower.bonus : []
      ],
      allyEffects: [],
      chain: null,
      leaveWall: null,
      aftershock: null,
      splashOnHit: empower && empower.splash.length > 0 ? { radius: empower.splashRadius, effects: empower.splash } : null,
      via: "attack",
      // Champion bolts carry a cosmetic auto tag ('vesk_A') so renderers
      // can author per-champion tracers; minion and tower bolts stay null.
      vfx: u.kind === "champion" && u.championId ? `${u.championId}_A` : null
    });
  } else {
    dealDamage(ctx, u.id, target, ad, "physical", "attack");
    if (hpPct > 0) dealDamage(ctx, u.id, target, hpPct * target.maxHp, "true", "attack");
    if (empower) {
      const power = { ad: u.stats.ad, ap: u.stats.ap, scale: empower.scale };
      applyEffects(ctx, u.id, power, target, empower.bonus);
      if (empower.splash.length > 0) {
        for (const other of ctx.units.values()) {
          if (!hostile(u, other) || other.dead || ctx.dead.has(other.id)) continue;
          if (other.id === target.id) continue;
          const d = hypot(other.pos.x - target.pos.x, other.pos.z - target.pos.z);
          if (d > empower.splashRadius + other.radius) continue;
          applyEffects(ctx, u.id, power, other, empower.splash);
        }
      }
    }
    passiveOf(u)?.onAttackHit?.(ctx, u, target);
    runItemAttackHits(ctx, u, target);
  }
}
function stepPendingAttack(ctx, u) {
  const pa = u.pendingAttack;
  if (!pa) return;
  const target = ctx.units.get(pa.targetId);
  const displaced = u.kind === "champion" && hypot(u.pos.x - pa.startX, u.pos.z - pa.startZ) > DISPLACEMENT_CANCEL;
  const canceled = isStunned(u, ctx.time) || u.path.length > 0 || displaced || !target || target.dead || ctx.dead.has(target.id) || isStealthed(target, ctx.time) || isUntargetable(target, ctx.time);
  if (canceled) {
    u.pendingAttack = null;
    u.attackReadyAt = ctx.time;
    return;
  }
  if (ctx.time >= pa.resolveAt) {
    u.pendingAttack = null;
    const edge = hypot(target.pos.x - u.pos.x, target.pos.z - u.pos.z) - u.radius - target.radius;
    if (edge <= u.stats.attackRange + STRIKE_GRACE) strike(ctx, u, target);
  }
}
function stepAutoAttacks(ctx, nav) {
  for (const u of ctx.units.values()) {
    if (ctx.dead.has(u.id) || u.dead) continue;
    stepPendingAttack(ctx, u);
    if (u.pendingAttack) continue;
    if (isStunned(u, ctx.time)) continue;
    const tauntId = tauntSourceId(u, ctx.time);
    if (tauntId !== null) {
      const source = ctx.units.get(tauntId);
      if (source && !source.dead && source.team !== u.team) u.attackTargetId = tauntId;
    }
    if (u.attackTargetId === null) continue;
    const target = ctx.units.get(u.attackTargetId);
    if (!target || target.dead || ctx.dead.has(target.id) || !hostile(u, target) || isStealthed(target, ctx.time) || isUntargetable(target, ctx.time)) {
      u.attackTargetId = null;
      continue;
    }
    const edgeDist = hypot(target.pos.x - u.pos.x, target.pos.z - u.pos.z) - u.radius - target.radius;
    if (edgeDist > u.stats.attackRange) {
      if (u.moveSpeed <= 0) continue;
      const end = u.path[u.path.length - 1];
      if (!end || hypot(end.x - target.pos.x, end.z - target.pos.z) > REPATH_DISTANCE) {
        u.path = findPath(nav, u.pos, target.pos);
      }
    } else {
      u.path = [];
      if (u.stats.attackSpeed > 0 && ctx.time >= u.attackReadyAt && !u.pendingAttack) {
        beginWindup(ctx, u, target);
      }
    }
  }
}

// src/sim/combat/dots.ts
function stepDots(ctx) {
  for (const u of ctx.units.values()) {
    if (u.dead || ctx.dead.has(u.id) || u.statuses.length === 0) continue;
    const dots = u.statuses.filter((s) => s.kind === "dot" && s.until > ctx.time);
    for (const d of dots) {
      if (d.kind === "dot") dealDamage(ctx, d.sourceId, u, d.perSecond * DT, d.dtype);
    }
  }
}

// src/sim/combat/shield_burst.ts
function stepShieldBursts(ctx) {
  for (const u of ctx.units.values()) {
    if (u.statuses.length === 0) continue;
    let fired = false;
    for (const s of u.statuses) {
      if (s.kind !== "shield" || !s.burst) continue;
      const broken = s.remaining <= 0;
      const expired = s.until <= ctx.time;
      if (!broken && !expired) continue;
      const effects = broken ? s.burst.onBreak : s.burst.onExpire;
      if (effects.length > 0 && !u.dead && !ctx.dead.has(u.id)) {
        for (const other of ctx.units.values()) {
          if (!hostile(u, other) || other.dead || ctx.dead.has(other.id)) continue;
          if (!isSpellTarget(other)) continue;
          const d = hypot(other.pos.x - u.pos.x, other.pos.z - u.pos.z);
          if (d > s.burst.radius + other.radius) continue;
          applyEffects(ctx, s.burst.sourceId, s.burst.power, other, effects, "ability", {
            center: u.pos
          });
        }
      }
      s.burst = void 0;
      fired = true;
    }
    if (fired) {
      u.statuses = u.statuses.filter(
        (s) => s.kind !== "shield" || s.remaining > 0 && s.until > ctx.time
      );
    }
  }
}

// src/sim/content/skins.ts
var SKINS = {
  korrath: [
    { name: "Default", body: null, accent: 9411240 },
    { name: "Obsidian Ward", body: 2829107, accent: 12109014 },
    { name: "Dawnplate", body: 13215818, accent: 15786928 }
  ],
  dain: [
    { name: "Default", body: null, accent: 13939322 },
    { name: "Coldsnap", body: 3824248, accent: 11065584 },
    { name: "Ashen Ring", body: 4867138, accent: 14078152 }
  ],
  sylra: [
    { name: "Default", body: null, accent: 6605150 },
    { name: "Nightbloom", body: 3812178, accent: 11566824 },
    { name: "Amber Grove", body: 7035438, accent: 15255650 }
  ],
  fenn: [
    { name: "Default", body: null, accent: 10118104 },
    { name: "Ghostedge", body: 10135728, accent: 15266037 },
    { name: "Crimson Hour", body: 6038576, accent: 15231594 }
  ],
  elowen: [
    { name: "Default", body: null, accent: 12575984 },
    { name: "Deepmist", body: 3032146, accent: 8370380 },
    { name: "Sunveil", body: 11569726, accent: 16114600 }
  ],
  vesk: [
    { name: "Default", body: null, accent: 13218904 },
    { name: "Ironsight", body: 4474959, accent: 11187392 },
    { name: "Verdigris", body: 4089424, accent: 9425064 }
  ],
  ashvyn: [
    { name: "Default", body: null, accent: 6250378 },
    { name: "Duskfeather", body: 3352639, accent: 12626144 },
    { name: "Snowstring", body: 12109004, accent: 15791608 }
  ],
  maera: [
    { name: "Default", body: null, accent: 5224649 },
    { name: "Coral Deep", body: 9062994, accent: 15771808 },
    { name: "Stormtide", body: 3029596, accent: 10337525 }
  ],
  torv: [
    { name: "Default", body: null, accent: 11563834 },
    { name: "Basalt", body: 3354670, accent: 9407109 },
    { name: "Tundra Horn", body: 7241610, accent: 14214896 }
  ],
  rhoka: [
    { name: "Default", body: null, accent: 14179934 },
    { name: "Nightprowl", body: 2501427, accent: 8359080 },
    { name: "Emberpelt", body: 8010276, accent: 15769674 }
  ]
};
function clampSkin(championId, index) {
  const list = SKINS[championId];
  if (!list || typeof index !== "number" || !Number.isInteger(index)) return 0;
  return index >= 0 && index < list.length ? index : 0;
}

// src/sim/dashes.ts
var SAMPLE_STEP = 0.3;
function land(ctx, u, dash) {
  u.activeDash = null;
  u.path = [];
  const fx = {
    center: { x: u.pos.x, z: u.pos.z },
    distance: dash.traveled,
    lineFrom: dash.from,
    lineDir: dash.dir
  };
  if (dash.onLand.length > 0 && dash.landRadius > 0) {
    for (const other of ctx.units.values()) {
      if (!hostile(u, other) || other.dead || ctx.dead.has(other.id)) continue;
      if (!isSpellTarget(other)) continue;
      const d = hypot(other.pos.x - u.pos.x, other.pos.z - u.pos.z);
      if (d > dash.landRadius + other.radius) continue;
      applyEffects(ctx, u.id, dash.power, other, dash.onLand, "ability", fx);
    }
  }
  if (dash.selfEffects.length > 0) {
    applyEffects(ctx, u.id, dash.power, u, dash.selfEffects, "ability", fx);
  }
}
function stepDashes(ctx, dt) {
  for (const u of ctx.units.values()) {
    const dash = u.activeDash;
    if (!dash) continue;
    if (u.dead || ctx.dead.has(u.id)) {
      u.activeDash = null;
      continue;
    }
    const budget = Math.min(dash.speed * dt, dash.remaining);
    const from = { x: u.pos.x, z: u.pos.z };
    let advanced = 0;
    const steps = Math.max(1, Math.ceil(budget / SAMPLE_STEP));
    let blocked = false;
    for (let i = 1; i <= steps; i++) {
      const t = budget * i / steps;
      const x = from.x + dash.dir.x * t;
      const z = from.z + dash.dir.z * t;
      if (!ctx.nav.isWalkableAt(x, z)) {
        blocked = true;
        break;
      }
      advanced = t;
      u.pos.x = x;
      u.pos.z = z;
    }
    dash.remaining -= advanced;
    dash.traveled += advanced;
    if (dash.passThrough.length > 0 && advanced > 0) {
      for (const other of ctx.units.values()) {
        if (!hostile(u, other) || other.dead || ctx.dead.has(other.id)) continue;
        if (!isSpellTarget(other)) continue;
        if (dash.hitIds.has(other.id)) continue;
        const d = segmentDistance(other.pos, from, u.pos);
        if (d > 0.9 + other.radius) continue;
        dash.hitIds.add(other.id);
        applyEffects(ctx, u.id, dash.power, other, dash.passThrough, "ability", {
          distance: dash.traveled,
          lineFrom: dash.from,
          lineDir: dash.dir
        });
      }
    }
    if (blocked || dash.remaining <= 1e-9) land(ctx, u, dash);
  }
}
function segmentDistance(p, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz;
  let t = 0;
  if (len2 > 0) t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2));
  return hypot(p.x - (a.x + abx * t), p.z - (a.z + abz * t));
}

// src/sim/decision_budget.ts
var DECISION_RATE_PER_S = 4;
var DECISION_CAP = 2;
function refill(u, time) {
  const elapsed = Math.max(0, time - u.decisionRefillAt);
  u.decisionTokens = Math.min(DECISION_CAP, u.decisionTokens + elapsed * DECISION_RATE_PER_S);
  u.decisionRefillAt = time;
}
function hasDecisionToken(u, time) {
  refill(u, time);
  return u.decisionTokens >= 1;
}
function spendDecisionToken(u, time) {
  refill(u, time);
  u.decisionTokens = Math.max(0, u.decisionTokens - 1);
}

// src/sim/idle_defense.ts
function stepIdleDefense(sim) {
  for (const u of sim.units.values()) {
    if (u.kind !== "champion" || u.dead || u.holding) continue;
    if (u.attackTargetId !== null || u.attackMoveTarget !== null || u.path.length > 0) continue;
    if (isRecalling(u, sim.time) || isStunned(u, sim.time)) continue;
    let best = null;
    let bestD = Number.POSITIVE_INFINITY;
    for (const o of sim.units.values()) {
      if (o.team === u.team || o.neutral || o.dead) continue;
      if (!sim.isVisible(u.team, o.id)) continue;
      const edge = hypot(o.pos.x - u.pos.x, o.pos.z - u.pos.z) - u.radius - o.radius;
      if (edge <= u.stats.attackRange && edge < bestD) {
        bestD = edge;
        best = o.id;
      }
    }
    if (best !== null) u.attackTargetId = best;
  }
}

// src/sim/lane_sightings.ts
var SIGHTING_BUCKET_S = 10;
var SIGHTING_WINDOW_S = 180;
var LANE_ACTIVITY_WINDOW_S = 60;
var BUCKETS = SIGHTING_WINDOW_S / SIGHTING_BUCKET_S;
var LaneSightings = class {
  seen = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()];
  // The memory as plain data, for a world checkpoint (src/sim/snapshot.ts).
  snapshot() {
    const copy = (m) => new Map([...m].map(([k, list]) => [k, list.map((b) => ({ ...b }))]));
    return [copy(this.seen[0]), copy(this.seen[1])];
  }
  restore(seen2) {
    for (const team2 of [0, 1]) {
      this.seen[team2].clear();
      for (const [k, list] of seen2[team2]) {
        this.seen[team2].set(
          k,
          list.map((b) => ({ ...b }))
        );
      }
    }
  }
  // One tick of an enemy champion seen inside a lane by a team.
  record(team2, lane, enemyId, time, dt) {
    const key = `${lane}:${enemyId}`;
    const period = Math.floor(time / SIGHTING_BUCKET_S);
    let list = this.seen[team2].get(key);
    if (!list) {
      list = [];
      this.seen[team2].set(key, list);
    }
    const last2 = list[list.length - 1];
    if (last2 && last2.period === period) last2.seconds += dt;
    else {
      list.push({ period, seconds: dt });
      if (list.length > BUCKETS) list.shift();
    }
  }
  // Seconds any enemy champion was seen in the lane over the last `windowS`
  // seconds: how busy a lane is, for the split push (the quietest lane).
  activity(team2, lane, time, windowS) {
    const oldest = Math.floor(time / SIGHTING_BUCKET_S) - Math.ceil(windowS / SIGHTING_BUCKET_S) + 1;
    const prefix = `${lane}:`;
    let total = 0;
    for (const [key, list] of this.seen[team2]) {
      if (!key.startsWith(prefix)) continue;
      for (const b of list) if (b.period >= oldest) total += b.seconds;
    }
    return Math.round(total * 10) / 10;
  }
  // The enemy champion seen the most in the lane over the last three minutes.
  opponent(team2, lane, time) {
    const oldest = Math.floor(time / SIGHTING_BUCKET_S) - BUCKETS + 1;
    const prefix = `${lane}:`;
    let best = null;
    let bestSeconds = 0;
    for (const [key, list] of this.seen[team2]) {
      if (!key.startsWith(prefix)) continue;
      const id = Number(key.slice(prefix.length));
      let total = 0;
      for (const b of list) if (b.period >= oldest) total += b.seconds;
      if (total <= 0) continue;
      if (best === null || total > bestSeconds || total === bestSeconds && id < best) {
        best = id;
        bestSeconds = total;
      }
    }
    return best;
  }
};

// src/sim/map_units.ts
function createMapUnits(map, allocId) {
  const out = [];
  for (const t of map.towers) {
    out.push(createTower(allocId(), t.team, { x: t.x, z: t.z }, { lane: t.lane, tier: t.tier }));
  }
  for (const s of map.sanctums) out.push(createSanctum(allocId(), s.team, { x: s.x, z: s.z }));
  return out;
}

// src/sim/minion_ai.ts
var AGGRO_RADIUS = 7;
var LEASH_RADIUS = 10.5;
var ACQUIRE_PERIOD_TICKS = 10;
var WAYPOINT_REACHED = 3;
function targetRank(u) {
  if (u.kind === "minion") return 0;
  if (u.kind === "tower" || u.kind === "sanctum") return 1;
  return 2;
}
var ALLY_PROTECT_RADIUS = 8;
var AGGRO_MEMORY_S = 3;
function aggressorIds(ctx, u) {
  const out = /* @__PURE__ */ new Set();
  for (const ally of ctx.units.values()) {
    if (ally.team !== u.team || ally.kind !== "champion" || ally.dead) continue;
    if (ctx.time - ally.lastHitAt > AGGRO_MEMORY_S) continue;
    if (hypot(ally.pos.x - u.pos.x, ally.pos.z - u.pos.z) > ALLY_PROTECT_RADIUS) continue;
    out.add(ally.lastHitByChampion);
  }
  return out;
}
function acquire(ctx, u) {
  const aggressors = aggressorIds(ctx, u);
  let best = null;
  let bestRank = Number.POSITIVE_INFINITY;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const o of ctx.units.values()) {
    if (o.team === u.team || o.neutral || o.dead || ctx.dead.has(o.id)) continue;
    if (isStealthed(o, ctx.time)) continue;
    const d = hypot(o.pos.x - u.pos.x, o.pos.z - u.pos.z);
    if (d > AGGRO_RADIUS) continue;
    if ((o.kind === "tower" || o.kind === "sanctum") && isInvulnerable(ctx.units, o)) continue;
    const rank = aggressors.has(o.id) ? -1 : targetRank(o);
    if (rank < bestRank || rank === bestRank && d < bestDist) {
      best = o;
      bestRank = rank;
      bestDist = d;
    }
  }
  u.attackTargetId = best ? best.id : null;
}
function currentTargetValid(ctx, u) {
  if (u.attackTargetId === null) return false;
  const t = ctx.units.get(u.attackTargetId);
  if (!t || t.dead || ctx.dead.has(t.id) || t.team === u.team || t.neutral) return false;
  if (isStealthed(t, ctx.time)) return false;
  return hypot(t.pos.x - u.pos.x, t.pos.z - u.pos.z) <= LEASH_RADIUS;
}
function laneWaypoint(map, u) {
  const lane = u.lane;
  const pts = map.lanes[lane];
  const oriented = u.team === 0 ? pts : [...pts].reverse();
  const wp = oriented[u.laneProgress];
  if (wp) return wp;
  const enemySanctum = map.sanctums.find((s) => s.team !== u.team);
  return { x: enemySanctum.x, z: enemySanctum.z };
}
function advanceLane(nav, map, u) {
  let wp = laneWaypoint(map, u);
  if (hypot(wp.x - u.pos.x, wp.z - u.pos.z) < WAYPOINT_REACHED) {
    u.laneProgress += 1;
    wp = laneWaypoint(map, u);
  }
  const end = u.path[u.path.length - 1];
  if (!end || hypot(end.x - wp.x, end.z - wp.z) > 3) {
    u.path = nav.lineOfWalk(u.pos, wp) ? [{ x: wp.x, z: wp.z }] : findPath(nav, u.pos, wp);
  }
}
function stepMinionAi(ctx, nav, map, tickCount) {
  for (const u of ctx.units.values()) {
    if (u.kind !== "minion" || u.dead || ctx.dead.has(u.id)) continue;
    if (tickCount % ACQUIRE_PERIOD_TICKS === 0 || !currentTargetValid(ctx, u)) {
      acquire(ctx, u);
    }
    if (u.attackTargetId === null) advanceLane(nav, map, u);
  }
}

// src/sim/movement.ts
function stepMovement(u, dt, speed) {
  let budget = speed * dt;
  while (budget > 1e-9 && u.path.length > 0) {
    const wp = u.path[0];
    const dx = wp.x - u.pos.x;
    const dz = wp.z - u.pos.z;
    const d = hypot(dx, dz);
    if (d <= budget) {
      u.pos.x = wp.x;
      u.pos.z = wp.z;
      u.path.shift();
      budget -= d;
    } else {
      u.pos.x += dx / d * budget;
      u.pos.z += dz / d * budget;
      budget = 0;
    }
  }
}

// src/sim/navgrid.ts
var NavGrid = class {
  cells;
  blockers;
  constructor(size, walls, borderMargin) {
    this.cells = Math.round(size);
    this.blockers = new Uint8Array(this.cells * this.cells);
    for (let cz = 0; cz < this.cells; cz++) {
      for (let cx = 0; cx < this.cells; cx++) {
        const x = cx + 0.5;
        const z = cz + 0.5;
        let b = x < borderMargin || z < borderMargin || x > size - borderMargin || z > size - borderMargin;
        if (!b) {
          for (const w of walls) {
            const dx = x - w.x;
            const dz = z - w.z;
            if (dx * dx + dz * dz <= w.r * w.r) {
              b = true;
              break;
            }
          }
        }
        if (b) this.blockers[cz * this.cells + cx] = 1;
      }
    }
  }
  isWalkableCell(cx, cz) {
    if (cx < 0 || cz < 0 || cx >= this.cells || cz >= this.cells) return false;
    return this.blockers[cz * this.cells + cx] === 0;
  }
  // The blocker counts as they stand, copied, for a world checkpoint
  // (src/sim/snapshot.ts); restoring writes them back in place.
  snapshotBlockers() {
    return new Uint8Array(this.blockers);
  }
  restoreBlockers(blockers) {
    this.blockers.set(blockers);
  }
  // Adds one blocker to every cell whose center lies within the circle.
  blockCircle(x, z, r) {
    this.forEachCellInCircle(x, z, r, (i) => {
      if (this.blockers[i] < 255) this.blockers[i]++;
    });
  }
  // Removes one blocker from every cell whose center lies within the circle.
  // Must mirror a prior blockCircle with the same shape.
  unblockCircle(x, z, r) {
    this.forEachCellInCircle(x, z, r, (i) => {
      if (this.blockers[i] > 0) this.blockers[i]--;
    });
  }
  forEachCellInCircle(x, z, r, fn) {
    const minX = Math.max(0, Math.floor(x - r));
    const maxX = Math.min(this.cells - 1, Math.ceil(x + r));
    const minZ = Math.max(0, Math.floor(z - r));
    const maxZ = Math.min(this.cells - 1, Math.ceil(z + r));
    for (let cz = minZ; cz <= maxZ; cz++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const dx = cx + 0.5 - x;
        const dz = cz + 0.5 - z;
        if (dx * dx + dz * dz <= r * r) fn(cz * this.cells + cx);
      }
    }
  }
  worldToCell(x, z) {
    return { cx: Math.floor(x), cz: Math.floor(z) };
  }
  cellToWorld(cx, cz) {
    return { x: cx + 0.5, z: cz + 0.5 };
  }
  isWalkableAt(x, z) {
    const c = this.worldToCell(x, z);
    return this.isWalkableCell(c.cx, c.cz);
  }
  // Closest walkable point to (x, z), searching outward ring by ring.
  // Deterministic scan order. Null only if everything within maxRadius is blocked.
  nearestWalkable(x, z, maxRadius = 25) {
    const c = this.worldToCell(x, z);
    if (this.isWalkableCell(c.cx, c.cz)) return { x, z };
    for (let r = 1; r <= maxRadius; r++) {
      let best = null;
      let bestD = Number.POSITIVE_INFINITY;
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const cx = c.cx + dx;
          const cz = c.cz + dz;
          if (!this.isWalkableCell(cx, cz)) continue;
          const { x: px, z: pz } = this.cellToWorld(cx, cz);
          const d = (px - x) * (px - x) + (pz - z) * (pz - z);
          if (d < bestD) {
            bestD = d;
            best = { x: px, z: pz };
          }
        }
      }
      if (best) return best;
    }
    return null;
  }
  // True when the straight segment from a to b stays on walkable ground,
  // sampled every 0.4 units. Shared by path smoothing and movement.
  lineOfWalk(a, b) {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const dist2 = hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(dist2 / 0.4));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (!this.isWalkableAt(a.x + dx * t, a.z + dz * t)) return false;
    }
    return true;
  }
};

// src/sim/objectives.ts
var WARDEN_FIRST_SPAWN_S = 720;
var WARDEN_RESPAWN_S = 150;
var WARDEN_LEASH_RANGE = 13;
var WARDEN_CALM_S = 5;
function initialObjectiveState() {
  return {
    wardenId: null,
    nextSpawnAt: WARDEN_FIRST_SPAWN_S,
    spawnIndex: 0,
    roseAt: null,
    pit: 0
  };
}
function drawPit(rng, count3, last2) {
  if (count3 <= 1) return 0;
  return (last2 + 1 + rng.int(count3 - 1)) % count3;
}
function wardenPitOf2(map, state) {
  return map.wardenPits[state.pit % map.wardenPits.length] ?? map.wardenPits[0];
}
function pitOf(map, state) {
  return wardenPitOf2(map, state);
}
function nearestHostileChampion2(ctx, w, range2) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.dead || ctx.dead.has(u.id)) continue;
    if (!hostile(w, u)) continue;
    const d = hypot(u.pos.x - w.pos.x, u.pos.z - w.pos.z);
    if (d <= range2 && d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
function stepObjectives(ctx, map, state) {
  if (state.wardenId === null) {
    if (ctx.time >= state.nextSpawnAt) {
      const pit2 = wardenPitOf2(map, state);
      const id = ctx.allocId();
      ctx.units.set(id, createWarden(id, pit2, ctx.time));
      state.wardenId = id;
      state.roseAt = ctx.time;
      state.spawnIndex += 1;
    }
    return;
  }
  const w = ctx.units.get(state.wardenId);
  if (!w || w.dead || ctx.dead.has(w.id)) return;
  const pit = pitOf(map, state);
  const fromPit = hypot(w.pos.x - pit.x, w.pos.z - pit.z);
  const angry = ctx.time - w.lastDamagedAt <= WARDEN_CALM_S;
  if (fromPit > WARDEN_LEASH_RANGE) {
    w.hp = w.maxHp;
    w.pos = { x: pit.x, z: pit.z };
    w.path = [];
    w.attackTargetId = null;
    w.statuses = [];
    return;
  }
  if (!angry && (w.hp < w.maxHp || fromPit > 1)) {
    w.hp = Math.min(w.maxHp, w.hp + w.maxHp * CREATURE_CALM_REGEN_PER_S * DT);
    w.pos = { x: pit.x, z: pit.z };
    w.path = [];
    w.attackTargetId = null;
    w.statuses = [];
    return;
  }
  if (angry) {
    const target = w.attackTargetId !== null ? ctx.units.get(w.attackTargetId) : void 0;
    const targetOk = target && !target.dead && !ctx.dead.has(target.id) && hypot(target.pos.x - pit.x, target.pos.z - pit.z) <= WARDEN_LEASH_RANGE;
    if (!targetOk) {
      const next = nearestHostileChampion2(ctx, w, WARDEN_LEASH_RANGE);
      w.attackTargetId = next ? next.id : null;
    }
  } else {
    w.attackTargetId = null;
  }
}
function onWardenSlain(state, time, rng, pitCount) {
  state.wardenId = null;
  state.roseAt = null;
  state.nextSpawnAt = time + WARDEN_RESPAWN_S;
  state.pit = drawPit(rng, pitCount, state.pit);
}

// src/sim/projectiles.ts
function applySplash(ctx, p, around) {
  if (!p.splashOnHit) return;
  for (const u of ctx.units.values()) {
    if (!u.neutral && u.team === p.team || u.dead || ctx.dead.has(u.id)) continue;
    if (u.id === around.id || !isSpellTarget(u)) continue;
    if (hypot(u.pos.x - around.pos.x, u.pos.z - around.pos.z) > p.splashOnHit.radius) continue;
    applyEffects(ctx, p.sourceId, p.power, u, p.splashOnHit.effects);
  }
}
function segmentDistance2(p, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz;
  let t = 0;
  if (len2 > 0) t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2));
  const cx = a.x + abx * t;
  const cz = a.z + abz * t;
  return hypot(p.x - cx, p.z - cz);
}
function stepProjectiles(ctx, dt) {
  for (const p of [...ctx.projectiles.values()]) {
    const from = { x: p.pos.x, z: p.pos.z };
    if (p.homingTargetId !== null) {
      const target = ctx.units.get(p.homingTargetId);
      if (!target || target.dead || ctx.dead.has(target.id)) {
        ctx.projectiles.delete(p.id);
        continue;
      }
      const dx = target.pos.x - p.pos.x;
      const dz = target.pos.z - p.pos.z;
      const d = hypot(dx, dz);
      const step2 = p.speed * dt;
      if (d <= step2 + p.radius + target.radius) {
        const via = p.via ?? "ability";
        applyEffects(ctx, p.sourceId, p.power, target, p.onHit, via);
        applySplash(ctx, p, target);
        if (via === "attack") {
          const source = ctx.units.get(p.sourceId);
          if (source && !source.dead) {
            passiveOf(source)?.onAttackHit?.(ctx, source, target);
            runItemAttackHits(ctx, source, target);
          }
        }
        ctx.projectiles.delete(p.id);
        continue;
      }
      p.pos.x += dx / d * step2;
      p.pos.z += dz / d * step2;
      continue;
    }
    const step = Math.min(p.speed * dt, Math.max(0, p.maxRange - p.traveled));
    p.pos.x += p.dir.x * step;
    p.pos.z += p.dir.z * step;
    p.traveled += step;
    const crossed = [];
    const spellBolt = (p.via ?? "ability") !== "attack";
    for (const u of ctx.units.values()) {
      if (!u.neutral && u.team === p.team || u.dead || ctx.dead.has(u.id)) continue;
      if (spellBolt && !isSpellTarget(u)) continue;
      if (p.hitIds.has(u.id) || u.id === p.sourceId) continue;
      if (segmentDistance2(u.pos, from, p.pos) > p.radius + u.radius) continue;
      crossed.push({ u, d: hypot(u.pos.x - from.x, u.pos.z - from.z) });
    }
    crossed.sort((a, b) => a.d - b.d || a.u.id - b.u.id);
    const origin = { x: p.pos.x - p.dir.x * p.traveled, z: p.pos.z - p.dir.z * p.traveled };
    let despawned = false;
    for (const { u } of crossed) {
      p.hitIds.add(u.id);
      applyEffects(ctx, p.sourceId, p.power, u, p.onHit, p.via ?? "ability", {
        distance: hypot(u.pos.x - origin.x, u.pos.z - origin.z),
        lineFrom: origin,
        lineDir: p.dir
      });
      if (!p.pierce) {
        if (p.chain) {
          let next = null;
          let bestD = Number.POSITIVE_INFINITY;
          for (const c of ctx.units.values()) {
            if (!c.neutral && c.team === p.team || c.dead || ctx.dead.has(c.id)) continue;
            if (spellBolt && !isSpellTarget(c)) continue;
            if (p.hitIds.has(c.id) || c.id === p.sourceId) continue;
            if (isStealthed(c, ctx.time) || isUntargetable(c, ctx.time)) continue;
            const cd = hypot(c.pos.x - u.pos.x, c.pos.z - u.pos.z);
            if (cd > p.chain.radius || cd >= bestD) continue;
            bestD = cd;
            next = c;
          }
          if (next) {
            p.pos = { x: u.pos.x, z: u.pos.z };
            p.homingTargetId = next.id;
            p.onHit = p.chain.onHit;
            p.chain = null;
            p.leaveWall = null;
            p.aftershock = null;
            despawned = false;
            break;
          }
        }
        ctx.projectiles.delete(p.id);
        despawned = true;
        break;
      }
    }
    if (despawned) continue;
    if (p.homingTargetId !== null) continue;
    if (p.allyEffects.length > 0) {
      for (const u of ctx.units.values()) {
        if (u.team !== p.team || u.id === p.sourceId || u.dead || ctx.dead.has(u.id)) continue;
        if (u.kind !== "champion" && u.kind !== "minion") continue;
        if (p.hitIds.has(u.id)) continue;
        if (segmentDistance2(u.pos, from, p.pos) > p.radius + u.radius) continue;
        p.hitIds.add(u.id);
        applyEffects(ctx, p.sourceId, p.power, u, p.allyEffects);
      }
    }
    if (p.traveled >= p.maxRange - 1e-9) {
      if (p.leaveWall) {
        createWallSegment(ctx, p.sourceId, p.team, origin, p.pos, p.leaveWall.duration);
      }
      if (p.aftershock) {
        const shock = p.aftershock;
        const count3 = Math.max(1, Math.round(p.traveled / shock.spacing));
        for (let i = 0; i <= count3; i++) {
          const t = count3 === 0 ? 0 : i / count3;
          const id = ctx.allocId();
          ctx.zones.set(id, {
            id,
            sourceId: p.sourceId,
            team: p.team,
            pos: { x: origin.x + p.dir.x * p.traveled * t, z: origin.z + p.dir.z * p.traveled * t },
            radius: shock.radius,
            until: ctx.time + shock.delay + 0.1,
            tickEvery: 0,
            nextTickAt: Number.POSITIVE_INFINITY,
            power: p.power,
            onEnter: [],
            onTick: [],
            allyOnTick: [],
            detonateAt: ctx.time + shock.delay,
            onDetonate: shock.effects,
            entered: /* @__PURE__ */ new Set(),
            reveal: false,
            boundary: null,
            boundaryNextAt: /* @__PURE__ */ new Map(),
            insideIds: /* @__PURE__ */ new Set(),
            leaveZone: null,
            vfx: p.vfx
          });
        }
      }
      ctx.projectiles.delete(p.id);
    }
  }
}

// src/sim/recall.ts
var RECALL_CHANNEL_S = 8;
function startRecall(u, time) {
  u.path = [];
  u.attackTargetId = null;
  u.attackMoveTarget = null;
  u.statuses = u.statuses.filter((s) => s.kind !== "recall");
  u.statuses.push({ kind: "recall", until: time + RECALL_CHANNEL_S });
}
function stepRecalls(ctx, map) {
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.dead) continue;
    const recall = u.statuses.find((s) => s.kind === "recall");
    if (!recall || recall.until > ctx.time) continue;
    u.statuses = u.statuses.filter((s) => s.kind !== "recall");
    const fountain = map.fountains.find((f) => f.team === u.team);
    if (!fountain) continue;
    u.pos = { x: fountain.x, z: fountain.z };
    u.path = [];
    u.attackTargetId = null;
  }
}

// src/sim/remote_policy.ts
function createRemoteSeat(unitId) {
  return { unitId, pending: null, observation: null, slots: 0, dispatched: 0 };
}
function runRemoteDecisions(sim, seats) {
  for (const seat of seats.values()) {
    if (!isDecisionSlot(sim.tickCount, seat.unitId)) continue;
    const u = sim.units.get(seat.unitId);
    if (!u || u.dead) {
      seat.pending = null;
      seat.observation = null;
      continue;
    }
    if (seat.pending) {
      if (dispatchAction(sim, seat.unitId, seat.pending)) seat.dispatched++;
      seat.pending = null;
    }
    seat.observation = buildObservation(sim, seat.unitId);
    if (seat.observation) seat.slots++;
  }
}

// src/sim/respawn.ts
var BASE = 6;
var PER_LEVEL = 0.4;
var PER_MIN = 1.7;
var MAX_DELAY_S = 55;
function respawnDelay(level, time) {
  const l = level < 1 ? 1 : level > MAX_LEVEL ? MAX_LEVEL : level;
  const minutes = Math.max(0, time) / 60;
  return Math.min(MAX_DELAY_S, BASE + PER_LEVEL * l + PER_MIN * minutes);
}

// src/sim/rewards.ts
var PASSIVE_GOLD_START_AT = 10;
var PASSIVE_GOLD_PER_S = 2.5;
var XP_SHARE_RADIUS = 14;
function grantPassiveGold(ctx) {
  if (ctx.time < PASSIVE_GOLD_START_AT) return;
  for (const u of ctx.units.values()) {
    if (u.kind === "champion" && !u.dead) u.gold += PASSIVE_GOLD_PER_S * DT;
  }
}
var CHAMPION_BOUNTY_BASE = 300;
var CHAMPION_BOUNTY_PER_LEVEL = 25;
var SHUTDOWN_PER_KILL = 60;
var SHUTDOWN_STREAK_CAP = 5;
var ASSIST_GOLD_FRAC = 0.5;
function championBounty(victim) {
  return CHAMPION_BOUNTY_BASE + CHAMPION_BOUNTY_PER_LEVEL * (victim.level - 1) + SHUTDOWN_PER_KILL * Math.min(victim.killStreak, SHUTDOWN_STREAK_CAP);
}
function grantKillRewards(ctx, victim, killerId) {
  const killer = ctx.units.get(killerId);
  const bounty = victim.kind === "champion" ? championBounty(victim) : victim.goldBounty;
  if (bounty > 0) {
    if (killer && killer.kind === "champion" && (victim.neutral || killer.team !== victim.team)) {
      killer.gold += bounty;
      ctx.events.push({ type: "gold", unitId: killer.id, amount: bounty });
    }
  }
  const xpBounty = victim.kind === "champion" ? 120 + 20 * victim.level : victim.xpBounty;
  if (xpBounty > 0) {
    const xpTeam = victim.neutral ? killer?.team : void 0;
    if (!victim.neutral || xpTeam !== void 0) {
      const nearby = [];
      for (const u of ctx.units.values()) {
        if (u.kind !== "champion" || u.dead) continue;
        if (victim.neutral ? u.team !== xpTeam : u.team === victim.team) continue;
        const d = hypot(u.pos.x - victim.pos.x, u.pos.z - victim.pos.z);
        if (d <= XP_SHARE_RADIUS) nearby.push(u);
      }
      if (nearby.length > 0) {
        const share = xpBounty / nearby.length;
        for (const u of nearby) gainXp(u, share);
      }
    }
  }
}

// src/sim/rings.ts
function initialRingStates(map) {
  return (map.rings ?? []).map((site) => {
    const def = creatureOfRing(site.id);
    return {
      ring: site.id,
      creature: def.id,
      site,
      unitId: null,
      nextRiseAt: def.firstRiseS,
      riseIndex: 0,
      roseAt: null
    };
  });
}
function creatureDefOf(state) {
  return creatureOfRing(state.ring);
}
function ringAspect(state, index = state.riseIndex) {
  return creatureDefOf(state).aspects[index] ?? null;
}
function isAscendantRise(state, index = state.riseIndex) {
  return index >= creatureDefOf(state).aspects.length;
}
function nearestHostileChampion3(ctx, from, range2) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const u of ctx.units.values()) {
    if (u.kind !== "champion" || u.dead || ctx.dead.has(u.id)) continue;
    if (!hostile(from, u)) continue;
    const d = hypot(u.pos.x - from.pos.x, u.pos.z - from.pos.z);
    if (d <= range2 && d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}
function stepRings(ctx, states) {
  for (const state of states) {
    const site = state.site;
    if (state.unitId === null) {
      if (ctx.time >= state.nextRiseAt) {
        const id = ctx.allocId();
        const center = { x: site.x, z: site.z };
        const at = ctx.nav.isWalkableAt(center.x, center.z) ? center : ctx.nav.nearestWalkable(center.x, center.z) ?? center;
        ctx.units.set(
          id,
          createCreature(id, creatureDefOf(state), at, ringAspect(state), ctx.time)
        );
        state.unitId = id;
        state.riseIndex += 1;
        state.roseAt = ctx.time;
      }
      continue;
    }
    const c = ctx.units.get(state.unitId);
    if (!c || c.dead || ctx.dead.has(c.id)) continue;
    const fromCenter = hypot(c.pos.x - site.x, c.pos.z - site.z);
    const angry = ctx.time - c.lastDamagedAt <= CREATURE_CALM_S;
    if (fromCenter > site.leash) {
      c.hp = c.maxHp;
      c.pos = { x: site.x, z: site.z };
      c.path = [];
      c.attackTargetId = null;
      c.statuses = [];
      continue;
    }
    if (!angry && (c.hp < c.maxHp || fromCenter > 1)) {
      c.hp = Math.min(c.maxHp, c.hp + c.maxHp * CREATURE_CALM_REGEN_PER_S * DT);
      c.pos = { x: site.x, z: site.z };
      c.path = [];
      c.attackTargetId = null;
      c.statuses = [];
      continue;
    }
    if (angry) {
      const target = c.attackTargetId !== null ? ctx.units.get(c.attackTargetId) : void 0;
      const targetOk = target && !target.dead && !ctx.dead.has(target.id) && hypot(target.pos.x - site.x, target.pos.z - site.z) <= site.leash;
      if (!targetOk) {
        const next = nearestHostileChampion3(ctx, c, site.leash);
        c.attackTargetId = next ? next.id : null;
      }
    } else {
      c.attackTargetId = null;
    }
  }
}
function onCreatureSlain(states, unitId, time) {
  const state = states.find((s) => s.unitId === unitId);
  if (!state) return null;
  const def = creatureDefOf(state);
  const ascendant = isAscendantRise(state, state.riseIndex - 1);
  state.unitId = null;
  state.roseAt = null;
  state.nextRiseAt = time + (ascendant ? def.ascendant.returnS : def.returnS);
  return { creature: state.creature, aspect: ringAspect(state, state.riseIndex - 1), ascendant };
}
function ringClocks(states) {
  return states.map((s) => {
    const index = s.unitId === null ? s.riseIndex : s.riseIndex - 1;
    return {
      ring: s.ring,
      creature: s.creature,
      x: s.site.x,
      z: s.site.z,
      unitId: s.unitId,
      riseAt: s.unitId === null ? s.nextRiseAt : null,
      roseAt: s.roseAt,
      aspect: ringAspect(s, index),
      ascendant: isAscendantRise(s, index)
    };
  });
}

// src/sim/rng.ts
var Rng = class {
  s;
  constructor(seed) {
    this.s = seed >>> 0;
    if (this.s === 0) this.s = 2654435769;
  }
  // The stream's position, for a world checkpoint (src/sim/snapshot.ts):
  // put back, the same numbers follow.
  get state() {
    return this.s;
  }
  set state(v) {
    this.s = v >>> 0;
  }
  /** Uniform float in [0, 1). */
  next() {
    this.s = this.s + 1831565813 >>> 0;
    let t = this.s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive) {
    return Math.floor(this.next() * maxExclusive);
  }
  /** Uniform float in [min, max). */
  range(min, max) {
    return min + this.next() * (max - min);
  }
};

// src/sim/separation.ts
function stepSeparation(ctx, nav) {
  const minions = [];
  for (const u of ctx.units.values()) {
    if (u.kind === "minion" && !u.dead && !ctx.dead.has(u.id)) minions.push(u);
  }
  for (let i = 0; i < minions.length; i++) {
    const a = minions[i];
    for (let j = i + 1; j < minions.length; j++) {
      const b = minions[j];
      const dx = b.pos.x - a.pos.x;
      const dz = b.pos.z - a.pos.z;
      const dist2 = hypot(dx, dz);
      const minDist = a.radius + b.radius;
      if (dist2 >= minDist || dist2 < 1e-6) continue;
      const push2 = Math.min(0.12, (minDist - dist2) / 2);
      const nx = dx / dist2;
      const nz = dz / dist2;
      const ax = a.pos.x - nx * push2;
      const az = a.pos.z - nz * push2;
      const bx = b.pos.x + nx * push2;
      const bz = b.pos.z + nz * push2;
      if (nav.isWalkableAt(ax, az)) {
        a.pos.x = ax;
        a.pos.z = az;
      }
      if (nav.isWalkableAt(bx, bz)) {
        b.pos.x = bx;
        b.pos.z = bz;
      }
    }
  }
}

// src/sim/snapshot.ts
function freezeUnits(units) {
  return [...units.values()].map((u) => ({ ...u, champion: null }));
}
function thawUnits(into, units, champions) {
  into.clear();
  for (const u of units) {
    into.set(u.id, {
      ...u,
      champion: u.championId !== null ? champions.get(u.championId) : null
    });
  }
}
function refillMap(into, from) {
  into.clear();
  for (const [k, v] of from) into.set(k, v);
}
function refillSet(into, from) {
  into.clear();
  for (const v of from) into.add(v);
}
function deepCopy(v) {
  return structuredClone(v);
}

// src/sim/team_buffs.ts
var BOON_DAMAGE_PER_STACK = 0.08;
var BOON_DURATION_S = 180;
var BOON_MAX_STACKS = 2;
var TeamBuffs = class {
  boons = [
    { until: 0, stacks: 0 },
    { until: 0, stacks: 0 }
  ];
  // When each team's Wrath ends; zero or past means none.
  wraths = [0, 0];
  // The buffs as plain data, for a world checkpoint (src/sim/snapshot.ts).
  snapshot() {
    return {
      boons: [{ ...this.boons[0] }, { ...this.boons[1] }],
      wraths: [this.wraths[0], this.wraths[1]]
    };
  }
  restore(state) {
    Object.assign(this.boons[0], state.boons[0]);
    Object.assign(this.boons[1], state.boons[1]);
    this.wraths[0] = state.wraths[0];
    this.wraths[1] = state.wraths[1];
  }
  grantWrath(team2, time) {
    this.wraths[team2] = time + WRATH_DURATION_S;
  }
  // When the team's Wrath ends, null when it holds none.
  wrathUntil(team2, time) {
    const until = this.wraths[team2];
    return until > time ? until : null;
  }
  grantBoon(team2, time) {
    const b = this.boons[team2];
    b.stacks = b.until > time ? Math.min(BOON_MAX_STACKS, b.stacks + 1) : 1;
    b.until = time + BOON_DURATION_S;
  }
  boon(team2, time) {
    const b = this.boons[team2];
    return b.until > time ? b : null;
  }
  // The damage multiplier a unit of `team` deals with right now.
  damageMultiplier(team2, time) {
    const b = this.boon(team2, time);
    return b ? 1 + BOON_DAMAGE_PER_STACK * b.stacks : 1;
  }
};

// src/sim/tower_ai.ts
function inRange(tower, o) {
  const edge = hypot(o.pos.x - tower.pos.x, o.pos.z - tower.pos.z) - tower.radius - o.radius;
  return edge <= tower.stats.attackRange;
}
function nearest2(ctx, tower, kinds) {
  let best = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const o of ctx.units.values()) {
    if (o.team === tower.team || o.neutral || o.dead || ctx.dead.has(o.id)) continue;
    if (isStealthed(o, ctx.time)) continue;
    if (!kinds.includes(o.kind)) continue;
    if (!inRange(tower, o)) continue;
    const d = hypot(o.pos.x - tower.pos.x, o.pos.z - tower.pos.z);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}
var AGGRO_MEMORY_S2 = 2;
function aggressorInRange(ctx, tower) {
  for (const ally of ctx.units.values()) {
    if (ally.team !== tower.team || ally.kind !== "champion" || ally.dead) continue;
    if (ctx.time - ally.lastHitAt > AGGRO_MEMORY_S2) continue;
    if (!inRange(tower, ally)) continue;
    const attacker = ctx.units.get(ally.lastHitByChampion);
    if (!attacker || attacker.dead || ctx.dead.has(attacker.id)) continue;
    if (attacker.team === tower.team || attacker.neutral) continue;
    if (isStealthed(attacker, ctx.time)) continue;
    if (inRange(tower, attacker)) return attacker;
  }
  return null;
}
function stepTowerAi(ctx) {
  for (const u of ctx.units.values()) {
    if (u.kind !== "tower" || u.dead || ctx.dead.has(u.id)) continue;
    const before = u.attackTargetId;
    const aggressor = aggressorInRange(ctx, u);
    if (aggressor) {
      u.attackTargetId = aggressor.id;
      if (u.attackTargetId !== before) u.passiveStacks = 0;
      continue;
    }
    if (u.attackTargetId !== null) {
      const t = ctx.units.get(u.attackTargetId);
      if (t && !t.dead && !ctx.dead.has(t.id) && t.team !== u.team && !isStealthed(t, ctx.time) && inRange(u, t)) {
        continue;
      }
      u.attackTargetId = null;
    }
    const target = nearest2(ctx, u, ["minion"]) ?? nearest2(ctx, u, ["champion"]);
    u.attackTargetId = target ? target.id : null;
    if (u.attackTargetId !== before) u.passiveStacks = 0;
  }
}

// src/sim/vision.ts
function brushIndexAt(map, p) {
  for (let i = 0; i < map.brush.length; i++) {
    const b = map.brush[i];
    if (hypot(p.x - b.x, p.z - b.z) <= b.r) return i;
  }
  return -1;
}
function sightBlocked(map, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz;
  for (const w of map.walls) {
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((w.x - a.x) * abx + (w.z - a.z) * abz) / len2)) : 0;
    const cx = a.x + abx * t;
    const cz = a.z + abz * t;
    if (hypot(w.x - cx, w.z - cz) <= w.r) return true;
  }
  return false;
}
function computeVisibility(map, units, time, zones) {
  const sets = [/* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()];
  const brush = /* @__PURE__ */ new Map();
  for (const u of units.values()) {
    if (!u.dead) brush.set(u.id, brushIndexAt(map, u.pos));
  }
  for (const target of units.values()) {
    if (target.dead || isStealthed(target, time)) continue;
    const observers = target.neutral ? [0, 1] : [1 - target.team];
    const targetBrush = brush.get(target.id) ?? -1;
    for (const observer of observers) {
      for (const src of units.values()) {
        if (src.team !== observer || src.neutral || src.dead) continue;
        const d = hypot(src.pos.x - target.pos.x, src.pos.z - target.pos.z);
        if (d > src.sightRange * sightFactor(src, time)) continue;
        if (targetBrush !== -1 && brush.get(src.id) !== targetBrush) continue;
        if (sightBlocked(map, src.pos, target.pos)) continue;
        sets[observer].add(target.id);
        break;
      }
    }
  }
  if (zones) {
    for (const z of zones.values()) {
      if (!z.reveal || z.until <= time) continue;
      for (const target of units.values()) {
        if (target.dead) continue;
        if (!target.neutral && target.team === z.team) continue;
        const d = hypot(target.pos.x - z.pos.x, target.pos.z - z.pos.z);
        if (d <= z.radius + target.radius) sets[z.team].add(target.id);
      }
    }
  }
  return sets;
}

// src/sim/waves.ts
var FIRST_WAVE_AT = 10;
var WAVE_EVERY = 24;
var MELEE_PER_WAVE = 3;
var CASTERS_PER_WAVE = 2;
var SIEGE_WAVE_EVERY = 3;
var WAVE_SCALING_PER_MIN = 0.03;
var LATE_GAME_S = 18 * 60;
var LATE_WAVE_SCALING_PER_MIN = 0.09;
function waveScale(time) {
  const lateS = Math.max(0, time - LATE_GAME_S);
  return 1 + WAVE_SCALING_PER_MIN * (Math.min(time, LATE_GAME_S) / 60) + LATE_WAVE_SCALING_PER_MIN * (lateS / 60);
}
var LANES3 = ["top", "mid", "bot"];
function spawnWave(ctx, map, waveIndex, snapToTerrain = false) {
  const scale = waveScale(ctx.time);
  const siegeWave = waveIndex % SIEGE_WAVE_EVERY === SIEGE_WAVE_EVERY - 1 || ctx.time >= LATE_GAME_S;
  for (const team2 of [0, 1]) {
    const withSiege = siegeWave || ctx.teamBuffs.boon(team2, ctx.time) !== null;
    for (const lane of LANES3) {
      const pts = map.lanes[lane];
      const a = team2 === 0 ? pts[0] : pts[pts.length - 1];
      const b = team2 === 0 ? pts[1] : pts[pts.length - 2];
      const len = hypot(b.x - a.x, b.z - a.z);
      const dir = { x: (b.x - a.x) / len, z: (b.z - a.z) / len };
      const perp = { x: -dir.z, z: dir.x };
      let slot = 0;
      const spawnAt = (variant) => {
        const along = 1.2 + slot * 1.1;
        const side2 = slot % 2 === 0 ? 0.5 : -0.5;
        const pos = {
          x: a.x + dir.x * along + perp.x * side2,
          z: a.z + dir.z * along + perp.z * side2
        };
        const id = ctx.allocId();
        const spawn = snapToTerrain ? ctx.nav.nearestWalkable(pos.x, pos.z) : pos;
        if (spawn) ctx.units.set(id, createMinion(id, team2, variant, lane, spawn, scale));
        slot += 1;
      };
      for (let i = 0; i < CASTERS_PER_WAVE; i++) spawnAt("caster");
      if (withSiege) spawnAt("siege");
      if (laneFullyOpen(ctx.units, 1 - team2, lane)) spawnAt("vanguard");
      for (let i = 0; i < MELEE_PER_WAVE; i++) spawnAt("melee");
    }
  }
}

// src/sim/zones.ts
function unitsInside(ctx, z, enemies) {
  const out = [];
  for (const u of ctx.units.values()) {
    if (u.dead || ctx.dead.has(u.id) || !isSpellTarget(u)) continue;
    if (enemies ? !u.neutral && u.team === z.team : u.neutral || u.team !== z.team) continue;
    if (hypot(u.pos.x - z.pos.x, u.pos.z - z.pos.z) <= z.radius + u.radius) out.push(u);
  }
  return out;
}
var BOUNDARY_SHELL = 1.2;
function stepZones(ctx) {
  for (const z of [...ctx.zones.values()]) {
    const inside = unitsInside(ctx, z, true);
    if (z.onEnter.length > 0) {
      for (const u of inside) {
        if (!z.entered.has(u.id)) {
          z.entered.add(u.id);
          applyEffects(ctx, z.sourceId, z.power, u, z.onEnter);
        }
      }
    }
    if (z.boundary) {
      const insideNow = new Set(inside.map((u) => u.id));
      for (const id of z.insideIds) {
        if (insideNow.has(id)) continue;
        const u = ctx.units.get(id);
        if (!u || u.dead || ctx.dead.has(id) || u.activeDash) continue;
        const d = hypot(u.pos.x - z.pos.x, u.pos.z - z.pos.z);
        if (d - u.radius > z.radius + BOUNDARY_SHELL) continue;
        if ((z.boundaryNextAt.get(id) ?? 0) > ctx.time) continue;
        z.boundaryNextAt.set(id, ctx.time + z.boundary.perUnitEvery);
        applyEffects(ctx, z.sourceId, z.power, u, z.boundary.effects, "ability", {
          center: z.pos
        });
      }
      z.insideIds = insideNow;
    }
    if (ctx.time >= z.nextTickAt && (z.onTick.length > 0 || z.allyOnTick.length > 0)) {
      for (const u of inside) {
        applyEffects(ctx, z.sourceId, z.power, u, z.onTick, "ability", { center: z.pos });
      }
      if (z.allyOnTick.length > 0) {
        for (const u of unitsInside(ctx, z, false)) {
          applyEffects(ctx, z.sourceId, z.power, u, z.allyOnTick, "ability", { center: z.pos });
        }
      }
      z.nextTickAt += z.tickEvery;
    }
    if (z.detonateAt !== null && ctx.time >= z.detonateAt) {
      for (const u of inside) {
        applyEffects(ctx, z.sourceId, z.power, u, z.onDetonate, "ability", { center: z.pos });
      }
      if (z.leaveZone) {
        const tickEvery = z.leaveZone.tickEvery ?? 0.5;
        const id = ctx.allocId();
        ctx.zones.set(id, {
          id,
          sourceId: z.sourceId,
          team: z.team,
          pos: { x: z.pos.x, z: z.pos.z },
          radius: z.leaveZone.radius,
          until: ctx.time + z.leaveZone.duration,
          tickEvery,
          nextTickAt: ctx.time + tickEvery,
          power: z.power,
          onEnter: [],
          onTick: z.leaveZone.onTick ?? [],
          allyOnTick: [],
          detonateAt: null,
          onDetonate: [],
          entered: /* @__PURE__ */ new Set(),
          reveal: false,
          boundary: null,
          boundaryNextAt: /* @__PURE__ */ new Map(),
          insideIds: /* @__PURE__ */ new Set(),
          leaveZone: null,
          vfx: z.vfx
        });
      }
      ctx.zones.delete(z.id);
      continue;
    }
    if (ctx.time >= z.until) ctx.zones.delete(z.id);
  }
}

// src/sim/sim.ts
var ASSIST_WINDOW_S = 10;
var INVENTORY_SLOTS = 6;
var SPAWN_SLOTS = [
  { x: 0, z: 0 },
  { x: 1.6, z: 0 },
  { x: 0, z: 1.6 },
  { x: -1.6, z: 0 },
  { x: 0, z: -1.6 }
];
var Sim = class {
  constructor(seed, options = {}) {
    this.options = options;
    this.rng = new Rng(seed);
    this.map = options.map ?? GAME_MAP;
    this.campStates = initialCampStates(this.map);
    this.ringStates = initialRingStates(this.map);
    this.nav = options.nav ?? new NavGrid(this.map.size, this.map.walls, this.map.borderMargin);
    for (const u of createMapUnits(this.map, () => this.nextId++)) {
      this.units.set(u.id, u);
      this.nav.blockCircle(u.pos.x, u.pos.z, staticFootprint(u));
    }
    this.visibility = computeVisibility(this.map, this.units, 0);
  }
  options;
  rng;
  map;
  nav;
  // Match-scoped champion resolution: the roster plus this match's forged
  // definitions (plan-forge phase 2). Register forged champions BEFORE
  // adding their units; the registration order is part of match identity.
  champions = new ChampionRegistry();
  units = /* @__PURE__ */ new Map();
  projectiles = /* @__PURE__ */ new Map();
  zones = /* @__PURE__ */ new Map();
  walls = /* @__PURE__ */ new Map();
  // Bots: sim entities driven in-tick by an attached Policy (ADR 0002).
  policies = /* @__PURE__ */ new Map();
  // Seats whose Policy runs outside this process (remote_policy.ts).
  remoteSeats = /* @__PURE__ */ new Map();
  // Each team's memory of who stood in which lane (CONTEXT.md: Lane
  // opponent), fed by the vision step.
  laneSightings = new LaneSightings();
  time = 0;
  tickCount = 0;
  winner = null;
  visibility = [/* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()];
  // Each team's fading memory of enemy champions: where one was last SEEN
  // and how hurt it was. The honest mirror of a human remembering who ran
  // into which brush; observe.ts exposes only fresh, currently-unseen
  // entries (additive obs v0). Indexed by observing team, keyed by unit id.
  lastSeen = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()];
  nextWaveAt = FIRST_WAVE_AT;
  waveCount = 0;
  nextId = 1;
  events = [];
  dead = /* @__PURE__ */ new Set();
  killers = /* @__PURE__ */ new Map();
  // The Warden's Boon lives outside units so it survives deaths.
  teamBuffs = new TeamBuffs();
  // Public like teamBuffs: tests rewind the spawn clock instead of ticking
  // ten sim-minutes to meet the first Warden.
  objectives = initialObjectiveState();
  campStates;
  // The rings' creatures and clocks (CONTEXT.md: Ring), empty on a map
  // without rings; public like objectives, so tests rewind a clock.
  ringStates;
  // The favors each team holds (CONTEXT.md: Favor), the truth the units'
  // mirrors are refreshed from (grantFavor).
  favors = new Favors();
  ctx() {
    return {
      time: this.time,
      rng: this.rng,
      nav: this.nav,
      units: this.units,
      projectiles: this.projectiles,
      zones: this.zones,
      walls: this.walls,
      events: this.events,
      dead: this.dead,
      killers: this.killers,
      teamBuffs: this.teamBuffs,
      allocId: () => this.nextId++
    };
  }
  // Register a forged champion for this match; its id becomes pickable by
  // addChampion. Validation happens inside the registry (throws on an
  // invalid or duplicate def).
  addForgedChampion(def) {
    this.champions.addForged(def);
  }
  addChampion(team2, at, championId = DEFAULT_CHAMPION_ID, skin = 0) {
    const def = this.champions.get(championId);
    if (!def) throw new Error(`unknown champion ${championId}`);
    const fountain = this.map.fountains.find((f) => f.team === team2);
    if (!fountain) throw new Error(`no fountain for team ${team2}`);
    let count3 = 0;
    for (const u of this.units.values()) {
      if (u.kind === "champion" && u.team === team2) count3++;
    }
    const slot = SPAWN_SLOTS[count3 % SPAWN_SLOTS.length];
    const authored = this.map.spawns?.filter((s) => s.team === team2) ?? [];
    const spawn = authored[count3 % Math.max(1, authored.length)];
    const pos = at ?? (spawn ? { x: spawn.x, z: spawn.z } : { x: fountain.x + slot.x, z: fountain.z + slot.z });
    const champ = createChampion(this.nextId++, team2, pos, def);
    champ.skin = clampSkin(championId, skin);
    this.units.set(champ.id, champ);
    this.assignLanes(team2);
    return champ;
  }
  // Every champion of a team holds a lane from creation (CONTEXT.md: Home
  // lane; src/sim/lanes.ts): its role's home lane while the lane has a seat
  // open, else the lane with the most seats open. A human's seat counts
  // like a bot's, so the fill's support lands beside a human marksman and a
  // stand-in bot on a dropped seat inherits the lane (playtest review: all
  // ten participants once funneled into whichever lane was furthest
  // pushed). Recomputed over the team in creation order whenever a
  // champion joins it, which happens at setup only. A playbook's lane
  // preference will go in ahead of the home lane (plan-bots phase 12).
  assignLanes(team2) {
    const seats = [];
    for (const u of this.units.values()) {
      if (u.kind === "champion" && u.team === team2) seats.push(u);
    }
    const lanes = assignLanes(
      seats.map((u) => ({
        home: homeLane(u.championId === null ? null : this.champions.get(u.championId)?.role),
        prefer: u.lanePrefer
      }))
    );
    for (const [i, u] of seats.entries()) u.lane = lanes[i];
  }
  championDef(championId) {
    return this.champions.get(championId);
  }
  // The lane opponents a team's memory names right now (CONTEXT.md): the
  // enemy champion seen the most inside each lane over the last three
  // minutes, null where nobody was seen.
  // Seconds enemies were seen in each lane over the last minute (the
  // additive laneActivity observation field, behind the split push).
  laneActivity(team2, windowS = LANE_ACTIVITY_WINDOW_S) {
    return {
      top: this.laneSightings.activity(team2, "top", this.time, windowS),
      mid: this.laneSightings.activity(team2, "mid", this.time, windowS),
      bot: this.laneSightings.activity(team2, "bot", this.time, windowS)
    };
  }
  laneOpponents(team2) {
    return {
      top: this.laneSightings.opponent(team2, "top", this.time),
      mid: this.laneSightings.opponent(team2, "mid", this.time),
      bot: this.laneSightings.opponent(team2, "bot", this.time)
    };
  }
  attachPolicy(unitId, policy) {
    const u = this.units.get(unitId);
    if (u?.kind !== "champion") return;
    this.policies.set(unitId, policy);
  }
  // A seat driven by a playbook (ADR 0013): the same in-tick attachment as
  // attachPolicy, plus the active-play trace, which writes the unit's
  // `play` and emits a 'play' event whenever it changes. The trace never
  // influences a decision, so a traced playbook and a bare one drive the
  // seat identically (tests/playbook.test.ts).
  attachPlaybook(unitId, def) {
    this.seatLanes(unitId, def.lanes ?? null);
    this.attachPolicy(unitId, this.policyForPlaybook(def));
  }
  // A seat's lane preference, seated ahead of the home lane (phase 12;
  // the forest first means no lane, ADR 0023): the team's lanes are dealt
  // again with it in. What attachPlaybook does before it attaches; on its
  // own for a policy attached bare that still asks for its seat.
  seatLanes(unitId, lanes) {
    const seat = this.units.get(unitId);
    if (seat?.kind !== "champion") return;
    seat.lanePrefer = lanes ? [...lanes] : null;
    this.assignLanes(seat.team);
  }
  // The playbook's Policy alone, traced, without the seating attachPlaybook
  // does around it: what a replay re-attaches after a checkpoint restore
  // (src/net/replay.ts, restorePolicies), when the lanes are already where
  // the snapshot put them and dealing them again would move the world. It
  // carries the match's own map, so a bot restored on the Star Orchard
  // keeps reading the Star Orchard's lanes.
  policyForPlaybook(def) {
    return playbookPolicy(
      def,
      (playId, id) => {
        const u = this.units.get(id);
        if (!u || u.play === playId) return;
        u.play = playId;
        this.events.push({ type: "play", unitId: id, playId });
      },
      this.map
    );
  }
  // Hand a seat to a Policy running outside the process. The sim ships that
  // seat an observation every decision slot and takes one action back; it
  // never learns what produced the action (ADR 0002 phase 2).
  addRemoteSeat(unitId) {
    const u = this.units.get(unitId);
    if (u?.kind !== "champion") return false;
    if (this.remoteSeats.has(unitId)) return true;
    this.remoteSeats.set(unitId, createRemoteSeat(unitId));
    return true;
  }
  removeRemoteSeat(unitId) {
    this.remoteSeats.delete(unitId);
  }
  // Queue the seat's next action. The latest one wins and it is consumed on
  // the seat's next decision slot, so sending more than one per slot buys
  // no extra throughput: the cap is structural, not policed after the fact.
  queueRemoteAction(unitId, action) {
    const seat = this.remoteSeats.get(unitId);
    if (!seat) return false;
    seat.pending = action;
    return true;
  }
  // Drain the observation built on the seat's last slot, null when there is
  // nothing new. Draining is what makes the next one arrive.
  takeRemoteObservation(unitId) {
    const seat = this.remoteSeats.get(unitId);
    if (!seat?.observation) return null;
    const obs = seat.observation;
    seat.observation = null;
    return obs;
  }
  // A reconnected player takes their champion back from the stand-in bot.
  detachPolicy(unitId) {
    this.policies.delete(unitId);
    const u = this.units.get(unitId);
    if (u) u.play = null;
  }
  // A world checkpoint (src/sim/snapshot.ts): every field that moves,
  // as plain data, deep-copied. Policies and champion definitions are not
  // state and are left where they are.
  snapshot() {
    return { tick: this.tickCount, state: deepCopy(this.gatherState()) };
  }
  // A short number standing for where this match is, right now: the tick,
  // the rng, and every unit's place and health. It is what a replay
  // checks itself against as it plays (src/net/replay.ts): a replay is a
  // re-simulation, so the one thing it cannot do on its own is notice
  // that it has stopped matching the match it claims to be. Cheap by
  // design (no copy, no allocation per unit) because it runs every
  // couple of hundred ticks inside the sim loop.
  checksum() {
    let h = (2166136261 ^ this.tickCount) >>> 0;
    const mix = (n) => {
      h = Math.imul(h ^ (n | 0), 16777619) + 2654435769 >>> 0;
    };
    mix(this.rng.state);
    for (const u of this.units.values()) {
      mix(u.id);
      mix(Math.round(u.pos.x * 64));
      mix(Math.round(u.pos.z * 64));
      mix(Math.round(u.hp));
    }
    return h >>> 0;
  }
  // The checkpoint back into THIS sim, in place: the containers attached
  // policies close over are refilled, never replaced. The snapshot stays
  // intact and can be restored again. The policies themselves are not
  // touched: a match whose seats change hands (a disconnect, a rejoin)
  // puts them back from its record (src/net/replay.ts, restorePolicies).
  restore(snap2) {
    const s = deepCopy(snap2.state);
    this.time = s.time;
    this.tickCount = s.tickCount;
    this.winner = s.winner;
    this.nextWaveAt = s.nextWaveAt;
    this.waveCount = s.waveCount;
    this.nextId = s.nextId;
    this.rng.state = s.rng;
    this.nav.restoreBlockers(s.nav);
    thawUnits(this.units, s.units, this.champions);
    refillMap(this.projectiles, s.projectiles);
    refillMap(this.zones, s.zones);
    refillMap(this.walls, s.walls);
    this.visibility = s.visibility;
    refillMap(this.lastSeen[0], s.lastSeen[0]);
    refillMap(this.lastSeen[1], s.lastSeen[1]);
    refillSet(this.dead, s.dead);
    refillMap(this.killers, s.killers);
    this.teamBuffs.restore(s.teamBuffs);
    Object.assign(this.objectives, s.objectives);
    this.campStates.splice(0, this.campStates.length, ...s.campStates);
    this.ringStates.splice(0, this.ringStates.length, ...s.ringStates);
    this.favors.restore(s.favors);
    this.laneSightings.restore(s.laneSightings);
    this.events = [];
  }
  // Every field that moves, gathered by reference; snapshot() deep-copies
  // the lot, so nothing here aliases past the copy.
  gatherState() {
    return {
      time: this.time,
      tickCount: this.tickCount,
      winner: this.winner,
      nextWaveAt: this.nextWaveAt,
      waveCount: this.waveCount,
      nextId: this.nextId,
      rng: this.rng.state,
      nav: this.nav.snapshotBlockers(),
      units: freezeUnits(this.units),
      projectiles: new Map(this.projectiles),
      zones: new Map(this.zones),
      walls: new Map(this.walls),
      visibility: this.visibility,
      lastSeen: this.lastSeen,
      dead: new Set(this.dead),
      killers: new Map(this.killers),
      teamBuffs: this.teamBuffs.snapshot(),
      objectives: { ...this.objectives },
      campStates: this.campStates.map((c) => ({ ...c })),
      ringStates: this.ringStates.map((r) => ({ ...r })),
      favors: this.favors.snapshot(),
      laneSightings: this.laneSightings.snapshot()
    };
  }
  // One row per champion; position-free, so it crosses the fog safely.
  scoreboard() {
    const rows = [];
    for (const u of this.units.values()) {
      if (u.kind !== "champion" || u.championId === null) continue;
      const def = u.champion;
      rows.push({
        unitId: u.id,
        name: def ? def.name.split(",")[0] ?? def.name : u.championId,
        championId: u.championId,
        // Seat identity lives above the sim; the server fills it in.
        player: null,
        team: u.team,
        level: u.level,
        kills: u.kills,
        deaths: u.deaths,
        assists: u.assists,
        cs: u.cs,
        items: [...u.items]
      });
    }
    return rows;
  }
  // True when any alive friendly unit has the point in sight range with no
  // wall in between (blinds shrink the radius). Fog-scopes projectiles and
  // zones on the wire AND in Policy observations: one rule, both consumers.
  isPointVisible(team2, x, z) {
    for (const u of this.units.values()) {
      if (u.team !== team2 || u.neutral || u.dead) continue;
      if (hypot(u.pos.x - x, u.pos.z - z) > u.sightRange * sightFactor(u, this.time)) {
        continue;
      }
      if (sightBlocked(this.map, u.pos, { x, z })) continue;
      return true;
    }
    return false;
  }
  isVisible(team2, unitId) {
    const u = this.units.get(unitId);
    if (!u) return false;
    if (!u.neutral && u.team === team2) return true;
    if (u.dead) return false;
    if (u.kind === "tower" || u.kind === "sanctum" || u.kind === "warden") return true;
    return this.visibility[team2].has(unitId);
  }
  // The Warden's Boon state for a team, null when inactive (IWorld).
  // When the team's Wrath ends (CONTEXT.md), null when it holds none.
  teamWrath(team2) {
    return this.teamBuffs.wrathUntil(team2, this.time);
  }
  // Hands a team the Wrath by hand (a test, a practice drill); a match
  // grants it through an Ascendant's death.
  grantWrath(team2) {
    this.teamBuffs.grantWrath(team2, this.time);
  }
  teamBuff(team2) {
    return this.teamBuffs.boon(team2, this.time);
  }
  // When the next Warden rises; null while one is alive (IWorld).
  objectiveSpawnAt() {
    return this.objectives.wardenId === null ? this.objectives.nextSpawnAt : null;
  }
  // The live Warden's pit (IWorld); null while none stands. The next pit
  // is drawn at the death and told to nobody until the rise: where the
  // Warden appears is not on the map before it does (ADR 0023).
  wardenPit() {
    return this.objectives.wardenId === null ? null : wardenPitOf2(this.map, this.objectives);
  }
  // The camps as a team knows them (the observation, ADR 0023): every
  // spot, its kind, and the team's own memory of it.
  campsFor(team2) {
    return this.campStates.map((state) => {
      const seen2 = state.seen[team2];
      return {
        x: state.spot.x,
        z: state.spot.z,
        kind: state.spot.kind,
        seenAt: seen2 ? seen2.at : null,
        up: seen2 ? seen2.up : null,
        downSince: seen2 ? seen2.downSince : null
      };
    });
  }
  // The rings' clocks (IWorld): the live creature or the next rise, and
  // the aspect in play, per ring. Empty on a map without rings.
  ringClocks() {
    return ringClocks(this.ringStates);
  }
  // The favors a team holds (IWorld), a frozen copy.
  teamFavors(team2) {
    return this.favors.stacks(team2);
  }
  // One more stack of an aspect for a team (CONTEXT.md: Favor): the team
  // record moves, every champion of the team mirrors it and has its stats
  // recomputed, dead ones included since the favor outlives a death. The
  // door the death handling uses, and tests.
  grantFavor(team2, aspect) {
    this.favors.grant(team2, aspect);
    const stacks = this.favors.stacks(team2);
    for (const u of this.units.values()) {
      if (u.kind !== "champion" || u.team !== team2) continue;
      u.favors = stacks;
      recalcChampion(u);
    }
  }
  orderMove(unitId, x, z) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    if (!u || u.moveSpeed <= 0 || u.dead || this.dead.has(unitId)) return;
    cancelRecall(u);
    u.holding = false;
    u.attackTargetId = null;
    u.attackMoveTarget = null;
    u.path = findPath(this.nav, u.pos, { x, z });
  }
  // Stop (S): halt in place and HOLD, opting out of idle auto-defense until
  // the next movement or attack order. The genre's wave-freeze verb.
  orderStop(unitId) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.dead || this.dead.has(unitId)) return;
    u.holding = true;
    u.path = [];
    u.attackTargetId = null;
    u.attackMoveTarget = null;
  }
  // The owner's coach order for a bot seat (ADR 0013): sim state like any
  // order, so it records and replays; null releases it.
  setCoachOrder(unitId, order) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion") return;
    u.coachOrder = order;
    u.coachOrderSeenAt = this.time;
  }
  // System-driven pathing (attack-move) that does not clear the standing
  // intent the way a player move order does.
  orderPath(unitId, x, z) {
    const u = this.units.get(unitId);
    if (!u || u.moveSpeed <= 0 || u.dead) return;
    u.path = findPath(this.nav, u.pos, { x, z });
  }
  orderAttack(unitId, targetId) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    const target = this.units.get(targetId);
    if (!u || !target || u.dead || target.dead) return;
    if (this.dead.has(unitId) || this.dead.has(targetId)) return;
    if (!hostile(u, target)) return;
    cancelRecall(u);
    u.holding = false;
    u.attackMoveTarget = null;
    u.attackTargetId = targetId;
  }
  orderAttackMove(unitId, x, z) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.dead || this.dead.has(unitId)) return;
    cancelRecall(u);
    u.holding = false;
    u.attackTargetId = null;
    u.attackMoveTarget = { x, z };
    u.path = findPath(this.nav, u.pos, { x, z });
  }
  startRecall(unitId) {
    if (this.winner !== null) return;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.dead || this.dead.has(unitId)) return;
    if (isStunned(u, this.time)) return;
    startRecall(u, this.time);
  }
  castAbility(unitId, key, aim) {
    if (this.winner !== null) return false;
    const u = this.units.get(unitId);
    if (!u || u.championId === null || u.dead) return false;
    const def = u.champion?.abilities[key];
    if (!def) return false;
    if (!hasDecisionToken(u, this.time)) return false;
    const ok = castAbility(this.ctx(), u, key, def, aim);
    if (ok) {
      spendDecisionToken(u, this.time);
      cancelRecall(u);
    }
    return ok;
  }
  // Starts a champion past level 1 (a Forge test drive opens at the
  // ultimate's level so R is on the table): the xp curve is walked, so
  // skill points and stat growth land exactly as a match grants them.
  setLevel(unitId, level) {
    const u = this.units.get(unitId);
    if (u?.kind !== "champion") return;
    levelTo(u, level);
  }
  // Spends one skill point to rank up an ability. Basics cap at rank 5; R
  // caps at 3 with champion-level gates 6/11/16. Free action (no decision
  // token): it is meta-progression, not an in-world act.
  levelAbility(unitId, key) {
    if (this.winner !== null) return false;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.championId === null) return false;
    if (u.skillPoints <= 0) return false;
    const rank = effectiveRank(u, key);
    if (key === "R") {
      if (rank >= ULT_MAX_RANK) return false;
      if (u.level < (ULT_RANK_LEVELS[rank] ?? Number.POSITIVE_INFINITY)) return false;
    } else if (rank >= BASIC_MAX_RANK) {
      return false;
    }
    u.abilityRanks[key] = rank + 1;
    u.skillPoints -= 1;
    return true;
  }
  castSigil(unitId, slot, aim) {
    if (this.winner !== null) return false;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.dead || this.dead.has(unitId)) return false;
    if (isStunned(u, this.time)) return false;
    const sigilId = u.sigils[slot];
    const def = sigilId ? SIGILS[sigilId] : void 0;
    if (!def) return false;
    if (def.spec.kind === "dash" && isRooted(u, this.time)) return false;
    if ((u.sigilCooldowns[slot] ?? 0) > this.time) return false;
    if (!hasDecisionToken(u, this.time)) return false;
    const ok = executeCast(
      this.ctx(),
      u,
      def.spec,
      def.castRange,
      aim,
      { ad: u.stats.ad, ap: u.stats.ap },
      `sigil_${sigilId}`
    );
    if (!ok) return false;
    spendDecisionToken(u, this.time);
    cancelRecall(u);
    u.sigilCooldowns[slot] = this.time + def.cooldown;
    breakStealth(u);
    this.events.push({ type: "sigil", unitId, slot });
    return true;
  }
  buyItem(unitId, itemId) {
    if (this.winner !== null) return false;
    const u = this.units.get(unitId);
    const def = ITEMS[itemId];
    if (!u || !def || u.kind !== "champion") return false;
    const dead = u.dead || this.dead.has(unitId);
    if (!dead && !withinFountain(this.map, u.team, u.pos)) return false;
    const consumedIndices = [];
    let discount = 0;
    for (const compId of def.buildsFrom ?? []) {
      const idx = u.items.findIndex((it, i) => it === compId && !consumedIndices.includes(i));
      if (idx !== -1) {
        consumedIndices.push(idx);
        discount += ITEMS[compId]?.cost ?? 0;
      }
    }
    const cost = Math.max(0, def.cost - discount);
    if (u.gold < cost) return false;
    if (u.items.length - consumedIndices.length >= INVENTORY_SLOTS) return false;
    u.gold -= cost;
    u.items = u.items.filter((_, i) => !consumedIndices.includes(i));
    u.items.push(itemId);
    recalcChampion(u);
    return true;
  }
  // Sells the item in `slot` for 70 percent of its own price, fountain
  // only (player review: one misclick should not be gold gone forever).
  sellItem(unitId, slot) {
    if (this.winner !== null) return false;
    const u = this.units.get(unitId);
    if (u?.kind !== "champion" || u.dead || this.dead.has(unitId)) return false;
    if (!withinFountain(this.map, u.team, u.pos)) return false;
    const itemId = u.items[slot];
    if (itemId === void 0) return false;
    const def = ITEMS[itemId];
    if (!def) return false;
    u.items = u.items.filter((_, i) => i !== slot);
    u.gold += Math.floor(def.cost * 0.7);
    recalcChampion(u);
    return true;
  }
  tick() {
    const ctx = this.ctx();
    stepRecalls(ctx, this.map);
    stepShieldBursts(ctx);
    for (const u of this.units.values()) expireStatuses(u, this.time);
    stepWalls(ctx);
    stepDots(ctx);
    if (this.winner === null) grantPassiveGold(ctx);
    const tideTick = this.tickCount % (TIDE_PERIOD_S * TICK_RATE) === 0;
    for (const u of this.units.values()) {
      if (u.dead) continue;
      if (u.stats.hpRegen > 0) u.hp = Math.min(u.maxHp, u.hp + u.stats.hpRegen * DT);
      if (u.stats.manaRegen > 0) u.mana = Math.min(u.maxMana, u.mana + u.stats.manaRegen * DT);
      if (tideTick && u.kind === "champion" && u.favors.tide > 0) {
        u.hp = Math.min(u.maxHp, u.hp + (u.maxHp - u.hp) * favorBonus(u.favors, "tide"));
      }
    }
    applyFountainRegen(ctx, this.map);
    stepPassives(ctx, this.tickCount);
    for (const u of this.units.values()) {
      if (u.coachOrder) stepCoachOrder(this, u);
    }
    runBotDecisions(this, this.policies);
    runRemoteDecisions(this, this.remoteSeats);
    if (this.winner === null && this.time >= this.nextWaveAt) {
      spawnWave(ctx, this.map, this.waveCount++, this.options.strictNavigation);
      this.nextWaveAt += WAVE_EVERY;
    }
    if (this.winner === null) {
      stepObjectives(ctx, this.map, this.objectives);
      stepRings(ctx, this.ringStates);
      stepCamps(ctx, this.campStates);
    }
    stepMinionAi(ctx, this.nav, this.map, this.tickCount);
    stepTowerAi(ctx);
    stepAttackMove(this);
    stepIdleDefense(this);
    stepWindups(ctx);
    stepAutoAttacks(ctx, this.nav);
    stepDashes(ctx, DT);
    for (const u of this.units.values()) {
      if (u.path.length === 0 || u.dead || this.dead.has(u.id)) continue;
      if (u.pendingSpell || u.activeDash) continue;
      const speed = effectiveMoveSpeed(u, this.time);
      if (speed > 0) {
        if (this.walls.size > 0 || this.options.strictNavigation) {
          const from = { x: u.pos.x, z: u.pos.z };
          stepMovement(u, DT, speed);
          clampThroughWalls(this.nav, from, u);
          if (this.options.strictNavigation && !this.nav.lineOfWalk(from, u.pos)) {
            u.pos = from;
            u.path = [];
          }
        } else {
          stepMovement(u, DT, speed);
        }
      }
    }
    stepSeparation(ctx, this.nav);
    stepProjectiles(ctx, DT);
    stepZones(ctx);
    for (const id of this.dead) {
      const u = this.units.get(id);
      if (!u) continue;
      const killerId = this.killers.get(id) ?? 0;
      grantKillRewards(ctx, u, killerId);
      if (u.kind === "champion") {
        const killer = this.units.get(killerId);
        if (killer && killer.kind === "champion" && killer.team !== u.team) {
          killer.kills += 1;
          killer.killStreak += 1;
          passiveOf(killer)?.onTakedown?.(ctx, killer, u);
        }
        const assisters = [];
        for (const r of u.recentDamagers) {
          if (r.id === killerId) continue;
          if (this.time - r.at > ASSIST_WINDOW_S) continue;
          const helper = this.units.get(r.id);
          if (helper && helper.kind === "champion" && helper.team !== u.team) {
            assisters.push(helper);
          }
        }
        const assistGold = assisters.length > 0 ? Math.floor(championBounty(u) * ASSIST_GOLD_FRAC / assisters.length) : 0;
        for (const helper of assisters) {
          helper.assists += 1;
          helper.gold += assistGold;
          this.events.push({ type: "gold", unitId: helper.id, amount: assistGold });
          passiveOf(helper)?.onTakedown?.(ctx, helper, u);
        }
        u.recentDamagers = [];
        u.killStreak = 0;
        u.deaths += 1;
        u.dead = true;
        u.hp = 0;
        u.respawnAt = this.time + respawnDelay(u.level, this.time);
        u.path = [];
        u.attackTargetId = null;
        u.statuses = [];
      } else {
        if (u.kind === "minion") {
          const killer = this.units.get(killerId);
          if (killer && killer.kind === "champion" && killer.team !== u.team) killer.cs += 1;
        }
        if (u.kind === "warden") {
          const killer = this.units.get(killerId);
          if (killer && killer.kind === "champion") {
            this.teamBuffs.grantBoon(killer.team, this.time);
          }
          onWardenSlain(this.objectives, this.time, this.rng, this.map.wardenPits.length);
        }
        if (u.kind === "camp") {
          onCampSlain(this.campStates, id, this.units.get(killerId), this.time);
        }
        if (u.kind === "creature") {
          const fall = onCreatureSlain(this.ringStates, id, this.time);
          const killer = this.units.get(killerId);
          if (fall !== null && killer && killer.kind === "champion") {
            if (fall.aspect !== null) this.grantFavor(killer.team, fall.aspect);
            else this.teamBuffs.grantWrath(killer.team, this.time);
            for (const member of this.units.values()) {
              if (member.kind !== "champion" || member.team !== killer.team) continue;
              member.gold += RING_GOLD_EACH;
              this.events.push({ type: "gold", unitId: member.id, amount: RING_GOLD_EACH });
            }
            if (fall.aspect !== null) {
              this.events.push({
                type: "favor",
                team: killer.team,
                aspect: fall.aspect,
                creature: fall.creature
              });
            } else {
              this.events.push({ type: "wrath", team: killer.team, creature: fall.creature });
            }
          }
        }
        if (u.moveSpeed <= 0) this.nav.unblockCircle(u.pos.x, u.pos.z, staticFootprint(u));
        this.units.delete(id);
        if (u.kind === "sanctum" && this.winner === null) {
          this.winner = 1 - u.team;
          this.events.push({ type: "victory", team: this.winner });
        }
      }
    }
    this.dead.clear();
    this.killers.clear();
    for (const u of this.units.values()) {
      if (this.winner !== null) break;
      if (u.kind !== "champion" || !u.dead || this.time < u.respawnAt) continue;
      const fountain = this.map.fountains.find((f) => f.team === u.team);
      let teammateIndex = 0;
      for (const o of this.units.values()) {
        if (o.kind === "champion" && o.team === u.team && o.id < u.id) teammateIndex++;
      }
      const slot = SPAWN_SLOTS[teammateIndex % SPAWN_SLOTS.length];
      u.dead = false;
      u.pos = { x: fountain.x + slot.x, z: fountain.z + slot.z };
      if (this.options.strictNavigation)
        u.pos = this.nav.nearestWalkable(u.pos.x, u.pos.z) ?? { x: fountain.x, z: fountain.z };
      u.hp = u.maxHp;
      u.mana = u.maxMana;
      u.statuses = [];
    }
    this.visibility = computeVisibility(this.map, this.units, this.time, this.zones);
    noteCampSightings(this.campStates, this.time, (team2, x, z) => this.isPointVisible(team2, x, z));
    for (const u of this.units.values()) {
      if (u.kind !== "champion" || u.neutral) continue;
      const observer = 1 - u.team;
      if (u.dead) {
        this.lastSeen[observer].delete(u.id);
        continue;
      }
      if (this.visibility[observer].has(u.id)) {
        this.lastSeen[observer].set(u.id, {
          x: u.pos.x,
          z: u.pos.z,
          at: this.time,
          hpFrac: u.maxHp > 0 ? u.hp / u.maxHp : 0
        });
        const lane = laneOf(u.pos.x, u.pos.z, this.map);
        if (lane) this.laneSightings.record(observer, lane, u.id, this.time, DT);
      }
    }
    for (const u of this.units.values()) {
      if (u.kind !== "champion" || u.dead || u.attackTargetId === null) continue;
      const t = this.units.get(u.attackTargetId);
      if (t && !t.dead && !this.isVisible(u.team, t.id)) {
        u.attackTargetId = null;
        u.path = [];
      }
    }
    this.time += DT;
    this.tickCount += 1;
    const out = this.events;
    this.events = [];
    return out;
  }
};

// src/sim/terrain_nav.ts
function decodeTerrainNav(spec, buffer) {
  if (spec.version !== 1 || !Number.isInteger(spec.cells) || spec.cells < 1 || spec.cells > 1024 || !Number.isFinite(spec.cellSize) || spec.cellSize <= 0 || !Number.isFinite(spec.heightScale) || spec.heightScale <= 0 || !Number.isFinite(spec.origin.x) || !Number.isFinite(spec.origin.z) || buffer.byteLength !== spec.cells * spec.cells * 2) {
    throw new Error("terrain navigation export is invalid or incomplete");
  }
  const view = new DataView(buffer);
  const heights = new Int16Array(spec.cells * spec.cells);
  for (let row = 0; row < spec.cells; row++) {
    const source = spec.cells - 1 - row;
    for (let column = 0; column < spec.cells; column++) {
      heights[row * spec.cells + column] = view.getInt16((source * spec.cells + column) * 2, true);
    }
  }
  return {
    cells: spec.cells,
    cellSize: spec.cellSize,
    origin: { x: spec.origin.x, z: -spec.origin.z - spec.cells * spec.cellSize },
    heightScale: spec.heightScale,
    heights,
    blockedValue: spec.blockedValue
  };
}
var HEIGHT_SNAP_RADIUS = 3;
var TerrainNavGrid = class extends NavGrid {
  cellSize;
  origin;
  heights;
  heightScale;
  blockedValue;
  constructor(data) {
    super(data.cells, [], 0);
    this.cellSize = data.cellSize;
    this.origin = { x: data.origin.x, z: data.origin.z };
    this.heights = data.heights;
    this.heightScale = data.heightScale;
    this.blockedValue = data.blockedValue;
    const blockers = new Uint8Array(data.cells * data.cells);
    for (let i = 0; i < blockers.length; i++) {
      blockers[i] = data.heights[i] === data.blockedValue ? 1 : 0;
    }
    this.restoreBlockers(blockers);
  }
  local(x, z) {
    return { x: (x - this.origin.x) / this.cellSize, z: (z - this.origin.z) / this.cellSize };
  }
  worldToCell(x, z) {
    const p = this.local(x, z);
    return { cx: Math.floor(p.x), cz: Math.floor(p.z) };
  }
  cellToWorld(cx, cz) {
    return {
      x: this.origin.x + (cx + 0.5) * this.cellSize,
      z: this.origin.z + (cz + 0.5) * this.cellSize
    };
  }
  blockCircle(x, z, r) {
    const p = this.local(x, z);
    super.blockCircle(p.x, p.z, r / this.cellSize);
  }
  unblockCircle(x, z, r) {
    const p = this.local(x, z);
    super.unblockCircle(p.x, p.z, r / this.cellSize);
  }
  // Exact cell traversal (a grid DDA) rather than the base class's fixed
  // sampling: at 40 cm cells a sampled segment can skip a blocked cell at a
  // corner, which is exactly the clip a cliff foot or a railing forbids.
  lineOfWalk(a, b) {
    if (![a.x, a.z, b.x, b.z].every(Number.isFinite)) return false;
    const start = this.local(a.x, a.z);
    const end = this.local(b.x, b.z);
    const current = { cx: Math.floor(start.x), cz: Math.floor(start.z) };
    const goal = { cx: Math.floor(end.x), cz: Math.floor(end.z) };
    if (!this.isWalkableCell(current.cx, current.cz) || !this.isWalkableCell(goal.cx, goal.cz))
      return false;
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const stepX = Math.sign(dx);
    const stepZ = Math.sign(dz);
    const intervalX = dx ? Math.abs(1 / dx) : Number.POSITIVE_INFINITY;
    const intervalZ = dz ? Math.abs(1 / dz) : Number.POSITIVE_INFINITY;
    let crossingX = dx ? (current.cx + (stepX > 0 ? 1 : 0) - start.x) / dx : Number.POSITIVE_INFINITY;
    let crossingZ = dz ? (current.cz + (stepZ > 0 ? 1 : 0) - start.z) / dz : Number.POSITIVE_INFINITY;
    while (current.cx !== goal.cx || current.cz !== goal.cz) {
      if (Math.abs(crossingX - crossingZ) < 1e-10) {
        if (!this.isWalkableCell(current.cx + stepX, current.cz) || !this.isWalkableCell(current.cx, current.cz + stepZ))
          return false;
        current.cx += stepX;
        current.cz += stepZ;
        crossingX += intervalX;
        crossingZ += intervalZ;
      } else if (crossingX < crossingZ) {
        current.cx += stepX;
        crossingX += intervalX;
      } else {
        current.cz += stepZ;
        crossingZ += intervalZ;
      }
      if (!this.isWalkableCell(current.cx, current.cz)) return false;
    }
    return true;
  }
  // Ground height under a sim point, in meters: the cell's exported height,
  // or the nearest walkable cell's within a few meters, else 0.
  heightAt(x, z) {
    const c = this.worldToCell(x, z);
    if (this.isWalkableCell(c.cx, c.cz)) return this.cellHeight(c.cx, c.cz);
    const near = this.nearestWalkable(x, z, Math.ceil(HEIGHT_SNAP_RADIUS / this.cellSize));
    if (!near) return 0;
    const n = this.worldToCell(near.x, near.z);
    return this.cellHeight(n.cx, n.cz);
  }
  cellHeight(cx, cz) {
    const raw = this.heights[cz * this.cells + cx] ?? this.blockedValue;
    return raw === this.blockedValue ? 0 : raw * this.heightScale;
  }
};

// src/net/replay.ts
var REPLAY_VERSION = 7;
var REPLAY_EVENT_CAP = 2e5;
var CHECK_TICKS = 200;
function orchardSim(orchard, seed) {
  return new Sim(seed, {
    map: orchard.map,
    nav: new TerrainNavGrid(orchard.navigation),
    strictNavigation: true
  });
}
function buildMatchSim(orchard, seed, picks, forged = []) {
  const sim = orchardSim(orchard, seed);
  for (const def of forged) sim.addForgedChampion(def);
  const unitIds = [];
  for (const p of picks) {
    const unit = sim.addChampion(p.team, void 0, p.championId, p.skin ?? 0);
    unit.sigils = [...p.sigils];
    unitIds.push(unit.id);
    if (p.playbook) sim.attachPlaybook(unit.id, p.playbook);
    else if (p.bot) attachBot(sim, unit.id, p.bot);
  }
  return { sim, unitIds };
}
var ABILITY_KEYS = /* @__PURE__ */ new Set(["Q", "W", "E", "R"]);
function applySimCommand(sim, team2, unitId, msg) {
  switch (msg.t) {
    case "move":
      if (isFiniteVec(msg.x, msg.z)) sim.orderMove(unitId, msg.x, msg.z);
      break;
    case "attack":
      if (typeof msg.targetId === "number" && sim.isVisible(team2, msg.targetId)) {
        sim.orderAttack(unitId, msg.targetId);
      }
      break;
    case "attack_move":
      if (isFiniteVec(msg.x, msg.z)) sim.orderAttackMove(unitId, msg.x, msg.z);
      break;
    case "stop":
      sim.orderStop(unitId);
      break;
    case "sell":
      if (typeof msg.slot === "number") sim.sellItem(unitId, msg.slot);
      break;
    case "recall":
      sim.startRecall(unitId);
      break;
    case "cast":
      if (typeof msg.key === "string" && ABILITY_KEYS.has(msg.key) && isFiniteVec(msg.x, msg.z)) {
        sim.castAbility(unitId, msg.key, { x: msg.x, z: msg.z });
      }
      break;
    case "sigil":
      if ((msg.slot === 0 || msg.slot === 1) && isFiniteVec(msg.x, msg.z)) {
        sim.castSigil(unitId, msg.slot, { x: msg.x, z: msg.z });
      }
      break;
    case "buy":
      if (typeof msg.itemId === "string") sim.buyItem(unitId, msg.itemId);
      break;
    case "skill":
      if (msg.key === "Q" || msg.key === "W" || msg.key === "E" || msg.key === "R") {
        sim.levelAbility(unitId, msg.key);
      }
      break;
    case "order": {
      const u = sim.units.get(unitId);
      if (!u) break;
      const order = parseCoachOrder(msg, u.pos);
      if (order === void 0) break;
      if (order?.kind === "focus" && !sim.isVisible(team2, order.targetId)) break;
      sim.setCoachOrder(unitId, order);
      break;
    }
    default:
      break;
  }
}

// src/sim/playbook/death_context.ts
var SCENE_RADIUS = 20;
var SCENE_CAP = 12;
var round1 = (v) => Math.round(v * 10) / 10;
function inTowerReach(tower, u) {
  const d = hypot(tower.pos.x - u.pos.x, tower.pos.z - u.pos.z);
  return d <= tower.stats.attackRange + tower.radius + u.radius;
}
function deathScene(sim, unitId, radius = SCENE_RADIUS) {
  const u = sim.units.get(unitId);
  if (u?.kind !== "champion") return null;
  const around = [];
  let allies = 0;
  let enemies = 0;
  let underTower = false;
  for (const o of sim.units.values()) {
    if (o.id === u.id) continue;
    if (o.kind !== "champion" && o.kind !== "tower" && o.kind !== "sanctum") continue;
    const d = hypot(o.pos.x - u.pos.x, o.pos.z - u.pos.z);
    if (d > radius) continue;
    const foe = hostile(u, o);
    if (o.kind === "champion" && !o.dead) {
      if (foe) enemies++;
      else allies++;
    } else if (foe && !o.dead && inTowerReach(o, u)) underTower = true;
    around.push({
      id: o.id,
      team: o.team,
      kind: o.kind,
      x: round1(o.pos.x),
      z: round1(o.pos.z),
      hp: o.dead ? 0 : Math.round(o.hp / Math.max(1, o.maxHp) * 100) / 100
    });
  }
  around.sort((a, b) => a.id - b.id);
  return {
    x: round1(u.pos.x),
    z: round1(u.pos.z),
    underTower,
    allies,
    enemies,
    around: around.slice(0, SCENE_CAP)
  };
}

// src/sim/playbook/report.ts
var PlayLedger = class {
  current = /* @__PURE__ */ new Map();
  stats = /* @__PURE__ */ new Map();
  deaths = /* @__PURE__ */ new Map();
  lastTick = 0;
  slot(unitId, playId) {
    let byPlay = this.stats.get(unitId);
    if (!byPlay) {
      byPlay = /* @__PURE__ */ new Map();
      this.stats.set(unitId, byPlay);
    }
    let s = byPlay.get(playId);
    if (!s) {
      s = { ticks: 0, deaths: 0 };
      byPlay.set(playId, s);
    }
    return s;
  }
  // Feed one tick's events. The tick is the sim's tickCount after the tick
  // ran, the same number a replay event carries. With the sim at hand,
  // every death is noted with its scene (the Death card).
  observe(tick, events, sim) {
    this.lastTick = tick;
    for (const ev of events) {
      if (ev.type === "play") {
        const open2 = this.current.get(ev.unitId);
        if (open2) this.slot(ev.unitId, open2.playId).ticks += tick - open2.since;
        this.current.set(ev.unitId, { playId: ev.playId, since: tick });
        this.slot(ev.unitId, ev.playId);
      } else if (ev.type === "death") {
        const open2 = this.current.get(ev.unitId);
        if (open2) this.slot(ev.unitId, open2.playId).deaths += 1;
        let notes = this.deaths.get(ev.unitId);
        if (!notes) {
          notes = [];
          this.deaths.set(ev.unitId, notes);
        }
        const scene = sim ? deathScene(sim, ev.unitId) : null;
        notes.push({
          tick,
          play: open2?.playId ?? null,
          killerId: ev.killerId,
          ...scene ? { scene } : {}
        });
      }
    }
  }
  // The report so far; the open spans count up to the last tick observed.
  // Reading never mutates, so a report can be taken mid-match.
  report() {
    const units = [];
    for (const [unitId, byPlay] of this.stats) {
      const plays = {};
      let deaths = 0;
      for (const [playId, s] of byPlay) {
        plays[playId] = { ...s };
        deaths += s.deaths;
      }
      const open2 = this.current.get(unitId);
      if (open2) {
        const s = plays[open2.playId] ?? { ticks: 0, deaths: 0 };
        plays[open2.playId] = { ...s, ticks: s.ticks + (this.lastTick - open2.since) };
      }
      units.push({
        unitId,
        plays,
        deaths,
        deathsAt: (this.deaths.get(unitId) ?? []).map((d) => ({ ...d }))
      });
    }
    units.sort((a, b) => a.unitId - b.unitId);
    return { ticks: this.lastTick, units };
  }
};

// src/sim/content/star_orchard.ts
var STAR_ORCHARD_SIZE = 156;
var STAR_ORCHARD_TOWERS = 22;
var STAR_ORCHARD_LANE_WIDTH = 11.5;
function assembleStarOrchard(layout, manifest, navigation) {
  return {
    map: starOrchardMap(layout, manifest),
    navigation: decodeTerrainNav(manifest, navigation),
    revision: manifest.revision,
    sourceSha256: manifest.sourceSha256 ?? "",
    model: manifest.model,
    modelBytes: manifest.visualReport?.glbBytes ?? 0,
    modelLight: manifest.modelLight ?? null,
    modelLightBytes: manifest.visualReport?.light?.glbBytes ?? 0
  };
}
var STAR_ORCHARD_FOREST_PITS = [
  { name: "west glade", x: 23.4, z: 49 },
  { name: "west hollow", x: 28.2, z: 101 },
  { name: "east glade", x: 125, z: 104.6 },
  { name: "east hollow", x: 123.8, z: 48.6 }
];
function mirrorPoint2(x, z) {
  return { x: STAR_ORCHARD_SIZE - x, z: STAR_ORCHARD_SIZE - z };
}
var NW_BRUSH2 = [
  { x: 28, z: 114, r: 5.2 },
  { x: 39, z: 103, r: 4.8 },
  { x: 47, z: 88, r: 4.4 },
  { x: 61, z: 80, r: 4.2 },
  { x: 72, z: 65, r: 4.4 },
  { x: 82, z: 51, r: 4.6 }
];
var STAR_ORCHARD_BRUSH = [
  ...NW_BRUSH2,
  ...NW_BRUSH2.map((b) => ({ ...mirrorPoint2(b.x, b.z), r: b.r }))
];
var FOUNTAIN_SLOT = 3;
var FOUNTAIN_RADIUS = 5;
function starOrchardMap(layout, manifest) {
  if (layout.revision !== manifest.revision || layout.towers.length !== STAR_ORCHARD_TOWERS || !layout.sourceSha256 || layout.sourceSha256 !== manifest.sourceSha256) {
    throw new Error("Star Orchard gameplay export does not match the model export");
  }
  const spawns = manifest.landmarks.filter((p) => p.kind === "spawn");
  const fountains = spawns.filter((p) => p.slot === FOUNTAIN_SLOT);
  const center = manifest.landmarks.find((p) => p.kind === "center");
  if (fountains.length !== 2 || !center) throw new Error("Star Orchard export lacks its spawns");
  const teamOf = (p) => p.team === 1 ? 1 : 0;
  return {
    size: STAR_ORCHARD_SIZE,
    borderMargin: 0,
    laneWidth: layout.laneWidth ?? STAR_ORCHARD_LANE_WIDTH,
    river: { a: { x: center.x, z: 18 }, b: { x: center.x, z: STAR_ORCHARD_SIZE - 18 }, width: 9 },
    fountains: fountains.map((p) => ({
      team: teamOf(p),
      x: p.x,
      z: -p.z,
      r: FOUNTAIN_RADIUS,
      // The fountain heals and sells around every seat of the platform, not
      // only the middle one: the terrace is a band around the Sanctum, and
      // the seats at its ends stand eleven meters from the middle.
      pads: spawns.filter((s) => teamOf(s) === teamOf(p)).map((s) => ({ x: s.x, z: -s.z, r: FOUNTAIN_RADIUS }))
    })),
    spawns: spawns.slice().sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)).map((p) => ({ team: teamOf(p), x: p.x, z: -p.z })),
    sanctums: layout.bases.map((p, team2) => ({
      x: p.x,
      z: p.z,
      team: team2 === 1 ? 1 : 0
    })),
    towers: layout.towers.map((t) => ({
      team: t.team,
      lane: t.lane,
      tier: t.tier,
      x: t.x,
      z: t.z
    })),
    lanes: {
      top: layout.lanes.top.map((p) => ({ x: p.x, z: p.z })),
      mid: layout.lanes.mid.map((p) => ({ x: p.x, z: p.z })),
      bot: layout.lanes.bot.map((p) => ({ x: p.x, z: p.z }))
    },
    walls: [],
    brush: STAR_ORCHARD_BRUSH,
    wardenPits: [{ name: "plaza", x: center.x, z: -center.z }, ...STAR_ORCHARD_FOREST_PITS],
    camps: starOrchardCamps(
      manifest.landmarks.filter((p) => p.kind === "camp").map((p) => ({ x: p.x, z: -p.z })),
      fountains.map((p) => ({ team: teamOf(p), x: p.x, z: -p.z }))
    ),
    rings: starOrchardRings(layout)
  };
}
function starOrchardCamps(spots, fountains) {
  const home = (p) => {
    let best = 0;
    let bestD = Number.POSITIVE_INFINITY;
    for (const f of fountains) {
      const d = hypot(f.x - p.x, f.z - p.z);
      if (d < bestD) {
        bestD = d;
        best = f.team;
      }
    }
    return best;
  };
  const out = [];
  for (const team2 of [0, 1]) {
    const fountain = fountains.find((f) => f.team === team2);
    const mine = spots.filter((p) => home(p) === team2).sort(
      (a, b) => (fountain ? hypot(a.x - fountain.x, a.z - fountain.z) : 0) - (fountain ? hypot(b.x - fountain.x, b.z - fountain.z) : 0)
    );
    mine.forEach((p, i) => {
      const kind = CAMP_ROUND[i % CAMP_ROUND.length];
      out.push({ x: p.x, z: p.z, kind });
    });
  }
  return spots.map((p) => out.find((c) => c.x === p.x && c.z === p.z));
}
var RING_LEASH_MARGIN = 6;
function starOrchardRings(layout) {
  const rings = [];
  for (const site of layout.objectiveSites ?? []) {
    if (site.lane !== "top" && site.lane !== "bot") continue;
    let leash = site.radius + RING_LEASH_MARGIN;
    for (const stair of site.stairCrossings ?? []) {
      const d = hypot(stair.from.x - site.center.x, stair.from.z - site.center.z);
      if (d > leash) leash = d;
    }
    rings.push({
      id: site.lane,
      lane: site.lane,
      x: site.center.x,
      z: site.center.z,
      r: site.radius,
      leash
    });
  }
  return rings;
}

// src/sim/playbook/types.ts
var PLAYBOOK_FORMAT_VERSION = 4;

// src/sim/playbook/validate.ts
var MAX_PLAYS = 48;
var MAX_TRIGGER_DEPTH = 4;
var MAX_VARIANTS = 8;
var MAX_BRANCHES = 8;
var STANCES = ["auto", "kite", "front", "poke"];
var TARGET_RULES = ["nearest", "lowest", "squishiest", "order"];
var ALONES = ["engage", "hold"];
var FARM_MODES = ["shove", "lastHit"];
var WAVE_INTENTS = ["freeze", "shove"];
var MAX_MINIONS = 30;
var SKILL_KEYS = ["Q", "W", "E"];
var ID_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;
var ABILITY_KEYS2 = ["Q", "W", "E", "R"];
var LANES4 = ["top", "mid", "bot"];
var SIDES = ["own", "enemy"];
var ROLES = [
  "Tank",
  "Fighter",
  "Mage",
  "Battlemage",
  "Assassin",
  "Marksman",
  "Support",
  "Skirmisher"
];
var CREATURE_NAMES = ["pyrefang", "voidmaul", "ascendant", "any"];
var ORDER_KINDS = [
  "goto",
  "warden",
  "creature",
  "focus",
  "back",
  "group",
  "hold"
];
var Errors = class {
  list = [];
  add(msg) {
    if (this.list.length < 20) this.list.push(msg);
  }
};
function isRecord(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function optNumber(raw, field, min, max, at, errors, integer = false) {
  const v = raw[field];
  if (v === void 0) return void 0;
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) {
    errors.add(`${at}: ${field} must be a number between ${min} and ${max}`);
    return void 0;
  }
  if (integer && !Number.isInteger(v)) {
    errors.add(`${at}: ${field} must be a whole number`);
    return void 0;
  }
  return v;
}
function reqNumber(raw, field, min, max, at, errors) {
  const v = optNumber(raw, field, min, max, at, errors);
  if (v === void 0) {
    if (raw[field] === void 0) errors.add(`${at}: ${field} is required`);
    return min;
  }
  return v;
}
function range(raw, min, max, at, errors) {
  const below = optNumber(raw, "below", min, max, at, errors);
  const atLeast = optNumber(raw, "atLeast", min, max, at, errors);
  if (below === void 0 && atLeast === void 0) {
    errors.add(`${at}: needs below or atLeast`);
  }
  const out = {};
  if (below !== void 0) out.below = below;
  if (atLeast !== void 0) out.atLeast = atLeast;
  return out;
}
function count(raw, at, errors) {
  const within2 = reqNumber(raw, "within", 0, 200, at, errors);
  const atLeast = optNumber(raw, "atLeast", 0, 10, at, errors, true);
  const atMost = optNumber(raw, "atMost", 0, 10, at, errors, true);
  if (atLeast === void 0 && atMost === void 0) {
    errors.add(`${at}: needs atLeast or atMost`);
  }
  const out = { within: within2 };
  if (atLeast !== void 0) out.atLeast = atLeast;
  if (atMost !== void 0) out.atMost = atMost;
  return out;
}
function creatureName(raw, at, errors) {
  const which = raw.which;
  if (which === void 0) return void 0;
  if (typeof which !== "string" || !CREATURE_NAMES.includes(which)) {
    errors.add(`${at}: which must be pyrefang, voidmaul, ascendant or any`);
    return void 0;
  }
  return which;
}
function trigger(raw, at, depth, errors) {
  if (!isRecord(raw) || typeof raw.kind !== "string") {
    errors.add(`${at}: a trigger needs a kind`);
    return { kind: "always" };
  }
  if (depth > MAX_TRIGGER_DEPTH) {
    errors.add(`${at}: triggers nest at most ${MAX_TRIGGER_DEPTH} deep`);
    return { kind: "always" };
  }
  switch (raw.kind) {
    case "always":
    case "enemyVisible":
    case "atFountain":
    case "underTower":
      return { kind: raw.kind };
    case "hp":
    case "mana":
      return { kind: raw.kind, ...range(raw, 0, 1, at, errors) };
    case "level":
      return { kind: "level", ...range(raw, 1, 18, at, errors) };
    case "gold":
      return { kind: "gold", ...range(raw, 0, 1e6, at, errors) };
    case "time":
      return { kind: "time", ...range(raw, 0, 36e3, at, errors) };
    case "enemies":
    case "allies":
      return { kind: raw.kind, ...count(raw, at, errors) };
    case "warden": {
      const state = raw.state;
      if (state !== "up" && state !== "spawning" && state !== "down") {
        errors.add(`${at}: warden state must be up, spawning or down`);
        return { kind: "warden", state: "up" };
      }
      const t = { kind: "warden", state };
      const within2 = optNumber(raw, "within", 0, 600, at, errors);
      if (within2 !== void 0) t.within = within2;
      const hpAtMost = optNumber(raw, "hpAtMost", 0, 1, at, errors);
      if (hpAtMost !== void 0) t.hpAtMost = hpAtMost;
      const near = optNumber(raw, "near", 0, 200, at, errors);
      if (near !== void 0) t.near = near;
      return t;
    }
    case "creature": {
      const state = raw.state;
      if (state !== "up" && state !== "spawning" && state !== "down") {
        errors.add(`${at}: creature state must be up, spawning or down`);
        return { kind: "creature", state: "up" };
      }
      const t = { kind: "creature", state };
      const which = creatureName(raw, at, errors);
      if (which !== void 0) t.which = which;
      const within2 = optNumber(raw, "within", 0, 600, at, errors);
      if (within2 !== void 0) t.within = within2;
      const hpAtMost = optNumber(raw, "hpAtMost", 0, 1, at, errors);
      if (hpAtMost !== void 0) t.hpAtMost = hpAtMost;
      const near = optNumber(raw, "near", 0, 200, at, errors);
      if (near !== void 0) t.near = near;
      return t;
    }
    case "abilityReady": {
      const key = raw.key;
      if (typeof key !== "string" || !ABILITY_KEYS2.includes(key)) {
        errors.add(`${at}: abilityReady key must be Q, W, E or R`);
        return { kind: "abilityReady", key: "Q" };
      }
      return { kind: "abilityReady", key };
    }
    case "sigilReady": {
      const id = raw.id;
      if (typeof id !== "string" || !ID_RE.test(id)) {
        errors.add(`${at}: sigilReady needs a sigil id`);
        return { kind: "sigilReady", id: "mend" };
      }
      return { kind: "sigilReady", id };
    }
    case "allyFighting":
      return { kind: "allyFighting", within: reqNumber(raw, "within", 0, 200, at, errors) };
    case "towerThreatened": {
      const within2 = optNumber(raw, "within", 0, 200, at, errors);
      return within2 === void 0 ? { kind: "towerThreatened" } : { kind: "towerThreatened", within: within2 };
    }
    case "numbers": {
      const within2 = reqNumber(raw, "within", 0, 200, at, errors);
      const atLeast = optNumber(raw, "atLeast", -10, 10, at, errors, true);
      const atMost = optNumber(raw, "atMost", -10, 10, at, errors, true);
      if (atLeast === void 0 && atMost === void 0) {
        errors.add(`${at}: needs atLeast or atMost`);
      }
      const out = { kind: "numbers", within: within2 };
      if (atLeast !== void 0) out.atLeast = atLeast;
      if (atMost !== void 0) out.atMost = atMost;
      return out;
    }
    case "odds": {
      const within2 = optNumber(raw, "within", 0, 200, at, errors);
      const r = range(raw, 0, 1, at, errors);
      return { kind: "odds", ...within2 !== void 0 ? { within: within2 } : {}, ...r };
    }
    case "minions": {
      const within2 = reqNumber(raw, "within", 0, 200, at, errors);
      const atLeast = optNumber(raw, "atLeast", 0, MAX_MINIONS, at, errors, true);
      const atMost = optNumber(raw, "atMost", 0, MAX_MINIONS, at, errors, true);
      if (atLeast === void 0 && atMost === void 0) {
        errors.add(`${at}: needs atLeast or atMost`);
      }
      const out = { kind: "minions", side: side(raw, at, errors), within: within2 };
      if (atLeast !== void 0) out.atLeast = atLeast;
      if (atMost !== void 0) out.atMost = atMost;
      return out;
    }
    case "order": {
      const is = raw.is;
      if (is === void 0) return { kind: "order" };
      if (typeof is !== "string" || !ORDER_KINDS.includes(is)) {
        errors.add(`${at}: order kind must be one of ${ORDER_KINDS.join(", ")}`);
        return { kind: "order" };
      }
      return { kind: "order", is };
    }
    case "lane": {
      const is = raw.is;
      if (is !== "top" && is !== "mid" && is !== "bot" && is !== "jungle") {
        errors.add(`${at}: lane must be top, mid, bot or jungle`);
        return { kind: "lane", is: "mid" };
      }
      return { kind: "lane", is };
    }
    case "champion":
      return { kind: "champion", side: side(raw, at, errors), is: champion(raw, at, errors) };
    case "roles": {
      const role = raw.role;
      const known = typeof role === "string" && ROLES.includes(role);
      if (!known) errors.add(`${at}: roles needs a role among ${ROLES.join(", ")}`);
      const atLeast = optNumber(raw, "atLeast", 0, 5, at, errors, true);
      const atMost = optNumber(raw, "atMost", 0, 5, at, errors, true);
      if (atLeast === void 0 && atMost === void 0) {
        errors.add(`${at}: roles needs atLeast or atMost`);
      }
      return {
        kind: "roles",
        side: side(raw, at, errors),
        role: known ? role : "Mage",
        ...atLeast !== void 0 ? { atLeast } : {},
        ...atMost !== void 0 ? { atMost } : {}
      };
    }
    case "enemyDamage": {
      const mostly = raw.mostly;
      if (mostly !== "magic" && mostly !== "physical") {
        errors.add(`${at}: enemyDamage mostly must be magic or physical`);
        return { kind: "enemyDamage", mostly: "magic" };
      }
      return { kind: "enemyDamage", mostly };
    }
    case "enemyItem": {
      if (typeof raw.item !== "string" || ITEMS[raw.item] === void 0) {
        errors.add(`${at}: enemyItem needs an item id from the shop`);
        return { kind: "enemyItem", item: "iron_blade" };
      }
      return { kind: "enemyItem", item: raw.item };
    }
    case "laneOpponent":
      return { kind: "laneOpponent", is: champion(raw, at, errors) };
    case "lanePartner":
      return { kind: "lanePartner", is: champion(raw, at, errors) };
    case "not":
      return { kind: "not", of: trigger(raw.of, `${at}.not`, depth + 1, errors) };
    case "all":
    case "any": {
      const of = raw.of;
      if (!Array.isArray(of) || of.length === 0 || of.length > MAX_BRANCHES) {
        errors.add(`${at}: ${raw.kind} needs 1 to ${MAX_BRANCHES} triggers`);
        return { kind: "always" };
      }
      return {
        kind: raw.kind,
        of: of.map((sub, i) => trigger(sub, `${at}.${raw.kind}[${i}]`, depth + 1, errors))
      };
    }
    default:
      errors.add(`${at}: unknown trigger kind "${raw.kind}"`);
      return { kind: "always" };
  }
}
function side(raw, at, errors) {
  const v = raw.side;
  if (typeof v !== "string" || !SIDES.includes(v)) {
    errors.add(`${at}: side must be own or enemy`);
    return "enemy";
  }
  return v;
}
function champion(raw, at, errors) {
  const v = raw.is;
  if (typeof v !== "string" || CHAMPIONS[v] === void 0) {
    errors.add(`${at}: ${String(raw.kind)} needs a roster champion id`);
    return DEFAULT_CHAMPION_ID;
  }
  return v;
}
function behavior(raw, at, errors) {
  if (!isRecord(raw) || typeof raw.kind !== "string") {
    errors.add(`${at}: a behavior needs a kind`);
    return { kind: "hold" };
  }
  const opt = (field, min, max, integer = false) => optNumber(raw, field, min, max, at, errors, integer);
  const withOpt = (b, field, v) => v === void 0 ? b : { ...b, [field]: v };
  switch (raw.kind) {
    case "retreat":
    case "hold":
    case "shop":
    case "goShop":
    case "finishSanctum":
    case "takeCamp":
    case "obeyOrder":
      return { kind: raw.kind };
    case "jungle": {
      const side2 = raw.side;
      if (side2 !== void 0 && side2 !== "own" && side2 !== "any") {
        errors.add(`${at}: side must be own or any`);
        return { kind: "jungle" };
      }
      return { kind: "jungle", ...side2 !== void 0 ? { side: side2 } : {} };
    }
    case "farm": {
      if (raw.mode === void 0) return { kind: "farm" };
      if (!FARM_MODES.includes(raw.mode)) {
        errors.add(`${at}: farm mode must be one of ${FARM_MODES.join(", ")}`);
        return { kind: "farm" };
      }
      return { kind: "farm", mode: raw.mode };
    }
    case "manageWave": {
      if (!WAVE_INTENTS.includes(raw.intent)) {
        errors.add(`${at}: manageWave intent must be one of ${WAVE_INTENTS.join(", ")}`);
        return { kind: "manageWave", intent: "freeze" };
      }
      return { kind: "manageWave", intent: raw.intent };
    }
    case "avoidTower": {
      let b = { kind: "avoidTower" };
      b = withOpt(b, "escortMin", opt("escortMin", 0, 10, true));
      return withOpt(b, "hpBelow", opt("hpBelow", 0, 1));
    }
    case "fight": {
      const b = { kind: "fight" };
      if (raw.stance !== void 0) {
        if (!STANCES.includes(raw.stance)) {
          errors.add(`${at}: stance must be one of ${STANCES.join(", ")}`);
        } else b.stance = raw.stance;
      }
      if (raw.target !== void 0) {
        if (!TARGET_RULES.includes(raw.target)) {
          errors.add(`${at}: target must be one of ${TARGET_RULES.join(", ")}`);
        } else b.target = raw.target;
      }
      if (raw.alone !== void 0) {
        if (!ALONES.includes(raw.alone)) {
          errors.add(`${at}: alone must be one of ${ALONES.join(", ")}`);
        } else b.alone = raw.alone;
      }
      const commitAt = opt("commitAt", 0, 1);
      if (commitAt !== void 0) b.commitAt = commitAt;
      return b;
    }
    case "sell": {
      if (typeof raw.item !== "string" || ITEMS[raw.item] === void 0) {
        errors.add(`${at}: sell needs an item id from the shop`);
        return { kind: "sell", item: "iron_blade" };
      }
      return { kind: "sell", item: raw.item };
    }
    case "hunt":
      return withOpt({ kind: "hunt" }, "hpAbove", opt("hpAbove", 0, 1));
    case "answerVanish":
      return withOpt({ kind: "answerVanish" }, "hpAtLeast", opt("hpAtLeast", 0, 1));
    case "contestWarden": {
      let b = { kind: "contestWarden" };
      b = withOpt(b, "hpAtLeast", opt("hpAtLeast", 0, 1));
      b = withOpt(b, "prepSeconds", opt("prepSeconds", 0, 300));
      return withOpt(b, "partyAtLeast", opt("partyAtLeast", 1, 5, true));
    }
    case "contestCreature": {
      let b = { kind: "contestCreature" };
      const which = creatureName(raw, at, errors);
      if (which !== void 0) b.which = which;
      b = withOpt(b, "hpAtLeast", opt("hpAtLeast", 0, 1));
      b = withOpt(b, "prepSeconds", opt("prepSeconds", 0, 300));
      b = withOpt(b, "within", opt("within", 0, 200));
      return withOpt(b, "partyAtLeast", opt("partyAtLeast", 1, 5, true));
    }
    case "siege":
      return withOpt({ kind: "siege" }, "escortMin", opt("escortMin", 0, 10, true));
    case "push": {
      const b = { kind: "push" };
      const lane = raw.lane;
      if (lane !== void 0) {
        if (lane !== "assigned" && !LANES4.includes(lane)) {
          errors.add(`${at}: push lane must be top, mid, bot or assigned`);
        } else {
          b.lane = lane;
        }
      }
      if (raw.regroupAt === null) b.regroupAt = null;
      else {
        const regroupAt = opt("regroupAt", 0, 7200);
        if (regroupAt !== void 0) b.regroupAt = regroupAt;
      }
      return b;
    }
    case "followAlly":
      return withOpt({ kind: "followAlly" }, "keep", opt("keep", 0, 50));
    case "joinAlly":
      return withOpt({ kind: "joinAlly" }, "within", opt("within", 0, 200));
    case "fallBack":
      return { kind: "fallBack" };
    case "defendTower":
      return withOpt({ kind: "defendTower" }, "within", opt("within", 0, 200));
    case "splitPush":
      return { kind: "splitPush" };
    case "holdPosition": {
      const b = {
        kind: "holdPosition",
        x: reqNumber(raw, "x", 0, STAR_ORCHARD_SIZE, at, errors),
        z: reqNumber(raw, "z", 0, STAR_ORCHARD_SIZE, at, errors)
      };
      return withOpt(b, "within", opt("within", 0, 50));
    }
    default:
      errors.add(`${at}: unknown behavior kind "${raw.kind}"`);
      return { kind: "hold" };
  }
}
function play(raw, index, seen2, errors) {
  const at = `plays[${index}]`;
  if (!isRecord(raw)) {
    errors.add(`${at}: a play is an object`);
    return { id: `play-${index}`, when: { kind: "always" }, do: { kind: "hold" } };
  }
  let id = `play-${index}`;
  if (typeof raw.id !== "string" || !ID_RE.test(raw.id)) {
    errors.add(`${at}: id must be 1 to 32 lowercase letters, digits, - or _`);
  } else if (seen2.has(raw.id)) {
    errors.add(`${at}: duplicate id "${raw.id}"`);
  } else {
    id = raw.id;
    seen2.add(id);
  }
  const out = {
    id,
    when: trigger(raw.when, `${at}.when`, 1, errors),
    do: behavior(raw.do, `${at}.do`, errors)
  };
  if (raw.enabled !== void 0) {
    if (typeof raw.enabled !== "boolean") errors.add(`${at}: enabled must be true or false`);
    else if (!raw.enabled) out.enabled = false;
  }
  return out;
}
function build(raw, at, errors) {
  if (raw === void 0) return void 0;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_BUILD) {
    errors.add(`${at}: build must list 1 to ${MAX_BUILD} items`);
    return void 0;
  }
  const out = [];
  for (const id of raw) {
    if (typeof id !== "string" || ITEMS[id] === void 0) {
      errors.add(`${at}: unknown item "${String(id)}"`);
      return void 0;
    }
    out.push(id);
  }
  return out;
}
function skills(raw, at, errors) {
  if (raw === void 0) return void 0;
  if (!Array.isArray(raw) || raw.length !== 3 || !raw.every((k) => SKILL_KEYS.includes(k)) || new Set(raw).size !== 3) {
    errors.add(`${at}: skills must order Q, W and E, each once`);
    return void 0;
  }
  return raw;
}
function kit(raw, errors) {
  if (raw === void 0) return void 0;
  if (!isRecord(raw)) {
    errors.add("kit must be an object");
    return void 0;
  }
  const out = {};
  const b = build(raw.build, "kit", errors);
  if (b) out.build = b;
  const s = skills(raw.skills, "kit", errors);
  if (s) out.skills = s;
  if (raw.variants !== void 0) {
    if (!Array.isArray(raw.variants) || raw.variants.length > MAX_VARIANTS) {
      errors.add(`kit: at most ${MAX_VARIANTS} variants`);
    } else {
      const variants = [];
      raw.variants.forEach((v, i) => {
        const at = `kit.variants[${i}]`;
        if (!isRecord(v)) {
          errors.add(`${at}: a variant is an object`);
          return;
        }
        const variant = { when: trigger(v.when, `${at}.when`, 1, errors) };
        const vb = build(v.build, at, errors);
        if (vb) variant.build = vb;
        const vs = skills(v.skills, at, errors);
        if (vs) variant.skills = vs;
        if (!vb && !vs) errors.add(`${at}: a variant needs a build or a skill order`);
        variants.push(variant);
      });
      if (variants.length > 0) out.variants = variants;
    }
  }
  return Object.keys(out).length > 0 ? out : void 0;
}
function validatePlaybook(raw) {
  const errors = new Errors();
  if (!isRecord(raw)) return { ok: false, errors: ["a playbook is an object"] };
  const version = raw.version;
  if (!Number.isInteger(version) || version < 1) {
    errors.add("version must be a whole number from 1");
  } else if (version > PLAYBOOK_FORMAT_VERSION) {
    errors.add(`version ${version} is newer than this engine (${PLAYBOOK_FORMAT_VERSION})`);
  }
  const plays = raw.plays;
  if (!Array.isArray(plays) || plays.length === 0) {
    errors.add("plays must hold at least one play");
    return { ok: false, errors: errors.list };
  }
  if (plays.length > MAX_PLAYS) {
    errors.add(`at most ${MAX_PLAYS} plays`);
    return { ok: false, errors: errors.list };
  }
  const seen2 = /* @__PURE__ */ new Set();
  const out = plays.map((p, i) => play(p, i, seen2, errors));
  const k = kit(raw.kit, errors);
  const lanes = lanePreference(raw.lanes, errors);
  if (errors.list.length > 0) return { ok: false, errors: errors.list };
  return {
    ok: true,
    def: {
      version,
      plays: out,
      ...k ? { kit: k } : {},
      ...lanes ? { lanes } : {}
    }
  };
}
function lanePreference(raw, errors) {
  if (raw === void 0) return void 0;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 3) {
    errors.add("lanes must list one to three lanes");
    return void 0;
  }
  const out = [];
  for (const lane of raw) {
    if (lane !== "top" && lane !== "mid" && lane !== "bot" && lane !== "jungle" || out.includes(lane)) {
      errors.add("lanes must be distinct among top, mid, bot and jungle");
      return void 0;
    }
    out.push(lane);
  }
  return out;
}

// server/account_name.ts
var NAME_MIN = 3;
var NAME_MAX2 = 16;
var ALLOWED = /^[A-Za-z0-9_-]+$/;
function foldName(raw) {
  return raw.toLowerCase().replace(/[_-]/g, "");
}
function validateName(raw) {
  if (raw.length > NAME_MAX2) return "too_long";
  if (!ALLOWED.test(raw)) return "charset";
  if (raw.length < NAME_MIN || foldName(raw).length < NAME_MIN) return "too_short";
  return null;
}
function nameErrorMessage(err) {
  switch (err) {
    case "too_short":
      return `A name needs at least ${NAME_MIN} letters or digits.`;
    case "too_long":
      return `A name is at most ${NAME_MAX2} characters.`;
    case "charset":
      return "A name may use letters, digits, underscores and hyphens only.";
  }
}

// server/discord_name.ts
var FALLBACK_NAME = "Player";
function deriveName(discordName, free) {
  const stripped = discordName.replace(/[^A-Za-z0-9_-]/g, "").slice(0, NAME_MAX2);
  const base = validateName(stripped) === null ? stripped : FALLBACK_NAME;
  if (free(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = String(n);
    const candidate = base.slice(0, NAME_MAX2 - suffix.length) + suffix;
    if (validateName(candidate) === null && free(candidate)) return candidate;
  }
}

// server/email_address.ts
var EMAIL_MAX = 254;
var SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
function validateEmail(raw) {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "missing";
  if (trimmed.length > EMAIL_MAX) return "too_long";
  if (!SHAPE.test(trimmed)) return "shape";
  return null;
}
function foldEmail(raw) {
  return raw.trim().toLowerCase();
}
function emailErrorMessage(code) {
  if (code === "missing") return "An email address is required.";
  if (code === "too_long") return `An email address is at most ${EMAIL_MAX} characters.`;
  return "That does not look like an email address.";
}

// server/email_claim.ts
var CLAIM_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
function claimHolds(claim, now) {
  if (claim.confirmed) return true;
  return now - claim.claimedAt < CLAIM_TTL_MS;
}

// server/ways.ts
function seatWay(rec, seat) {
  if (rec.queue === "arena") return "arena";
  if (seat.way === "bot") return "bot";
  if (rec.queue === "forge") return "forge";
  return "hand";
}
function playedByHand(way) {
  return way === "hand" || way === "forge";
}

// server/laurels.ts
var STARTER_COLLECTION = ["dain", "sylra", "ashvyn", "maera", "fenn"];
var CHAMPION_PRICES = {
  korrath: 900,
  vesk: 900,
  torv: 500,
  elowen: 500,
  rhoka: 500
};
var MATCH_LAURELS = 40;
var WIN_LAURELS = 100;
var FIRST_WIN_BONUS = 100;
function matchLaurels(won, firstWinOfDay, rated) {
  if (!rated) return MATCH_LAURELS;
  return (won ? WIN_LAURELS : MATCH_LAURELS) + (won && firstWinOfDay ? FIRST_WIN_BONUS : 0);
}
var DAY_MS = 24 * 60 * 60 * 1e3;
var WEEK_MS = 7 * DAY_MS;
function dayIndex(at) {
  return Math.floor(at / DAY_MS);
}
function weekIndex(at) {
  return Math.floor(at / WEEK_MS);
}
var ROTATION_SIZE = 3;
var ROTATION_POOL = CHAMPION_LIST.map((c) => c.id).filter(
  (id) => !STARTER_COLLECTION.includes(id)
);
function rotationAt(at) {
  const pool = ROTATION_POOL;
  if (pool.length <= ROTATION_SIZE) return [...pool];
  const week = weekIndex(at);
  const out = [];
  for (let i = 0; i < ROTATION_SIZE; i++) {
    const id = pool[((week + i) % pool.length + pool.length) % pool.length];
    if (id !== void 0) out.push(id);
  }
  return out;
}
function playableAt(collection, at) {
  const out = [...collection];
  for (const id of rotationAt(at)) if (!out.includes(id)) out.push(id);
  return out;
}
function championPrice(championId) {
  return CHAMPION_PRICES[championId] ?? null;
}
function backfillLaurels(records, accountId) {
  let laurels = 0;
  let lastWinDay = null;
  for (const rec of records) {
    for (const seat of rec.players) {
      if (seat.accountId !== accountId) continue;
      if (!playedByHand(seatWay(rec, seat))) continue;
      const won = seat.team === rec.winner;
      const day = dayIndex(rec.at);
      const first2 = won && rec.rated && day !== lastWinDay;
      if (first2) lastWinDay = day;
      laurels += matchLaurels(won, first2, rec.rated);
    }
  }
  return { laurels, lastWinDay };
}

// server/password.ts
var import_node_crypto = require("node:crypto");
var KEY_LEN = 64;
var SALT_LEN = 16;
var PASSWORD_MIN = 8;
var PASSWORD_MAX = 200;
function validatePassword(plain) {
  if (plain.length < PASSWORD_MIN) return "too_short";
  if (plain.length > PASSWORD_MAX) return "too_long";
  return null;
}
function passwordErrorMessage(err) {
  return err === "too_short" ? `A password needs at least ${PASSWORD_MIN} characters.` : `A password is at most ${PASSWORD_MAX} characters.`;
}
function hashPassword(plain) {
  const salt = (0, import_node_crypto.randomBytes)(SALT_LEN).toString("hex");
  return { salt, hash: (0, import_node_crypto.scryptSync)(plain, salt, KEY_LEN).toString("hex") };
}
function verifyPassword(plain, stored) {
  const expected = Buffer.from(stored.hash, "hex");
  if (expected.length !== KEY_LEN) return false;
  const actual = (0, import_node_crypto.scryptSync)(plain, stored.salt, KEY_LEN);
  return (0, import_node_crypto.timingSafeEqual)(actual, expected);
}

// server/rating.ts
var BASE_RATING = 1e3;
var K_MAX = 32;
function isRated(humansByTeam) {
  return humansByTeam[0] > 0 && humansByTeam[1] > 0;
}
var LEAVER_RATING_PENALTY = 15;
var LEAVER_LOCKOUT_MS = 6e4;
function leaverPenalty(humansByTeam) {
  return isRated(humansByTeam) ? LEAVER_RATING_PENALTY : 0;
}
function average(values) {
  let sum = 0;
  for (const v of values) sum += v;
  return values.length > 0 ? sum / values.length : BASE_RATING;
}
function ratingDeltas(seats, winner) {
  const out = /* @__PURE__ */ new Map();
  const byTeam = [[], []];
  for (const s of seats) byTeam[s.team].push(s);
  if (byTeam[0].length === 0 || byTeam[1].length === 0) return out;
  const avg = [
    average(byTeam[0].map((s) => s.rating)),
    average(byTeam[1].map((s) => s.rating))
  ];
  const k = K_MAX * seats.length / 10;
  for (const team2 of [0, 1]) {
    const expected = 1 / (1 + 10 ** ((avg[team2 === 0 ? 1 : 0] - avg[team2]) / 400));
    const score = team2 === winner ? 1 : 0;
    let delta = Math.round(k * (score - expected));
    if (delta === 0) delta = score === 1 ? 1 : -1;
    for (const s of byTeam[team2]) out.set(s.accountId, delta);
  }
  return out;
}

// server/store.ts
var import_node_fs = require("node:fs");
var import_node_path = __toESM(require("node:path"), 1);
function loadJson(file, fallback) {
  try {
    return JSON.parse((0, import_node_fs.readFileSync)(file, "utf8"));
  } catch {
    return fallback;
  }
}
function saveJsonAtomic(file, value) {
  (0, import_node_fs.mkdirSync)(import_node_path.default.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  (0, import_node_fs.writeFileSync)(tmp, JSON.stringify(value));
  (0, import_node_fs.renameSync)(tmp, file);
}
function appendJsonl(file, value) {
  (0, import_node_fs.mkdirSync)(import_node_path.default.dirname(file), { recursive: true });
  (0, import_node_fs.appendFileSync)(file, `${JSON.stringify(value)}
`);
}
function pruneNumberedJson(dir, keep, hold = /* @__PURE__ */ new Set()) {
  let names;
  try {
    names = (0, import_node_fs.readdirSync)(dir);
  } catch {
    return [];
  }
  const numbers = names.map((n) => /^(\d+)\.json$/.exec(n)?.[1]).filter((n) => n !== void 0).map(Number).sort((a, b) => b - a);
  const doomed = numbers.slice(keep).filter((n) => !hold.has(n));
  for (const n of doomed) {
    try {
      (0, import_node_fs.unlinkSync)(import_node_path.default.join(dir, `${n}.json`));
    } catch {
    }
  }
  return doomed;
}
function maxNumberedJson(dir) {
  let names;
  try {
    names = (0, import_node_fs.readdirSync)(dir);
  } catch {
    return 0;
  }
  let max = 0;
  for (const n of names) {
    const m = /^(\d+)\.json$/.exec(n);
    if (m && Number(m[1]) > max) max = Number(m[1]);
  }
  return max;
}
function readJsonl(file) {
  let raw;
  try {
    raw = (0, import_node_fs.readFileSync)(file, "utf8");
  } catch {
    return [];
  }
  const out = [];
  for (const line of raw.split("\n")) {
    if (!line) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
    }
  }
  return out;
}

// server/accounts.ts
function collectionOf(a) {
  const out = [...STARTER_COLLECTION];
  for (const id of a.recruited ?? []) if (!out.includes(id)) out.push(id);
  return out;
}
function publicAccount(a) {
  return {
    id: a.id,
    name: a.name,
    createdAt: a.createdAt,
    rating: a.rating,
    ratedGames: a.ratedGames
  };
}
function selfAccount(a) {
  return {
    ...publicAccount(a),
    email: a.email?.address ?? null,
    emailConfirmed: a.email?.confirmed ?? false,
    discord: a.discord?.username ?? null,
    laurels: a.laurels ?? 0,
    collection: collectionOf(a)
  };
}
var AccountRegistry = class {
  constructor(file) {
    this.file = file;
    const state = loadJson(file, { accounts: [], names: [] });
    for (const a of state.accounts) {
      this.byId.set(a.id, a);
      this.nextId = Math.max(this.nextId, a.id + 1);
    }
    for (const [fold, id] of state.names) this.nameOwner.set(fold, id);
    for (const a of this.byId.values()) {
      if (!this.nameOwner.has(a.fold)) this.nameOwner.set(a.fold, a.id);
      if (a.email) this.emailOwner.set(a.email.fold, a.id);
      if (a.discord) this.discordOwner.set(a.discord.id, a.id);
    }
  }
  file;
  byId = /* @__PURE__ */ new Map();
  // Folded name -> account id. Never shrinks: see the header.
  nameOwner = /* @__PURE__ */ new Map();
  // Folded email -> account id. Shrinks when a claim lapses.
  emailOwner = /* @__PURE__ */ new Map();
  // Discord id -> account id. Never shrinks: the id was verified the day
  // it arrived, and it is the way back into the account it points at.
  discordOwner = /* @__PURE__ */ new Map();
  nextId = 1;
  persist() {
    try {
      const state = {
        accounts: [...this.byId.values()],
        names: [...this.nameOwner.entries()]
      };
      saveJsonAtomic(this.file, state);
    } catch (err) {
      console.error("account registry persist failed", err);
    }
  }
  // Whether this name is free for `forAccountId` to take. A name the
  // asking account already holds or held is theirs to take back.
  nameFree(fold, forAccountId) {
    const owner = this.nameOwner.get(fold);
    return owner === void 0 || owner === forAccountId;
  }
  // Whether this address is free, releasing it first if the claim on it
  // has lapsed. Lazy rather than swept, so the answer is right the instant
  // the week is up rather than at the next sweep.
  emailFree(fold, now, forAccountId) {
    const owner = this.emailOwner.get(fold);
    if (owner === void 0 || owner === forAccountId) return true;
    const holder = this.byId.get(owner);
    if (!holder?.email || holder.email.fold !== fold) {
      this.emailOwner.delete(fold);
      return true;
    }
    if (claimHolds(holder.email, now)) return false;
    this.releaseEmail(holder);
    return true;
  }
  // Drops a lapsed claim: the address goes back into circulation and the
  // account keeps its name, its rating and its whole history. Nothing is
  // ever deleted here, which is what ADR 0006 promised and ADR 0007 keeps.
  releaseEmail(account) {
    if (!account.email) return;
    this.emailOwner.delete(account.email.fold);
    account.email = void 0;
  }
  register(name, password, email, now) {
    const nameErr = validateName(name);
    if (nameErr) return { ok: false, error: "name_invalid" };
    const passErr = validatePassword(password);
    if (passErr) return { ok: false, error: "password_invalid" };
    const wantsEmail = email.trim().length > 0;
    if (wantsEmail) {
      const emailErr = validateEmail(email);
      if (emailErr) return { ok: false, error: "email_invalid" };
    }
    const fold = foldName(name);
    if (!this.nameFree(fold)) return { ok: false, error: "name_taken" };
    const eFold = wantsEmail ? foldEmail(email) : null;
    if (eFold !== null && !this.emailFree(eFold, now)) return { ok: false, error: "email_taken" };
    const account = {
      id: this.nextId++,
      name,
      fold,
      password: hashPassword(password),
      createdAt: now,
      seenAt: now,
      rating: BASE_RATING,
      ratedGames: 0
    };
    if (eFold !== null) {
      account.email = { address: email.trim(), fold: eFold, claimedAt: now, confirmed: false };
      this.emailOwner.set(eFold, account.id);
    }
    this.byId.set(account.id, account);
    this.nameOwner.set(fold, account.id);
    this.persist();
    return { ok: true, value: account };
  }
  // The other door in (ADR 0009): an identity a round trip through
  // Discord already proved, and nothing typed at all. The name is derived
  // from the Discord name, uniqueness included, and the account starts
  // with no password and no email: Discord is how its owner gets back in,
  // until they add an address and reset themselves a password.
  registerWithDiscord(identity, now) {
    if (this.findByDiscordId(identity.id)) return { ok: false, error: "discord_taken" };
    const name = deriveName(identity.username, (candidate) => this.nameFree(foldName(candidate)));
    const fold = foldName(name);
    const account = {
      id: this.nextId++,
      name,
      fold,
      discord: { id: identity.id, username: identity.username, linkedAt: now },
      createdAt: now,
      seenAt: now,
      rating: BASE_RATING,
      ratedGames: 0
    };
    this.byId.set(account.id, account);
    this.nameOwner.set(fold, account.id);
    this.discordOwner.set(identity.id, account.id);
    this.persist();
    return { ok: true, value: account };
  }
  // The name is matched on its folded reading, so a player who typed
  // "Bob" at signup still gets in typing "bob". Returns undefined for
  // both an unknown name and a wrong password, so the answer cannot be
  // used to learn which names exist.
  authenticate(name, password) {
    const id = this.nameOwner.get(foldName(name));
    if (id === void 0) return void 0;
    const account = this.byId.get(id);
    if (!account || account.fold !== foldName(name)) return void 0;
    if (!account.password) return void 0;
    if (!verifyPassword(password, account.password)) return void 0;
    return account;
  }
  rename(id, name, now) {
    const account = this.byId.get(id);
    if (!account) return { ok: false, error: "name_invalid" };
    const nameErr = validateName(name);
    if (nameErr) return { ok: false, error: "name_invalid" };
    const fold = foldName(name);
    if (!this.nameFree(fold, id)) return { ok: false, error: "name_taken" };
    account.name = name;
    account.fold = fold;
    account.seenAt = now;
    this.nameOwner.set(fold, id);
    this.persist();
    return { ok: true, value: account };
  }
  // Claims an address for an account: at registration through register(),
  // afterwards through here (a typo at signup, a changed mailbox, or an
  // account old enough to have none). The new claim starts unconfirmed
  // whatever the old one was, so changing an address cannot inherit the
  // trust of the address it replaced.
  setEmail(id, email, now) {
    const account = this.byId.get(id);
    if (!account) return { ok: false, error: "unknown_account" };
    const emailErr = validateEmail(email);
    if (emailErr) return { ok: false, error: "email_invalid" };
    const fold = foldEmail(email);
    if (!this.emailFree(fold, now, id)) return { ok: false, error: "email_taken" };
    if (account.email?.fold === fold) return { ok: true, value: account };
    if (account.email && account.email.fold !== fold) {
      this.emailOwner.delete(account.email.fold);
    }
    account.email = { address: email.trim(), fold, claimedAt: now, confirmed: false };
    this.emailOwner.set(fold, id);
    this.persist();
    return { ok: true, value: account };
  }
  // The link was followed. `address` is what the link was issued for, and
  // it has to still be the account's address: an old link must not
  // confirm an address the account moved to afterwards.
  confirmEmail(id, address, now) {
    const account = this.byId.get(id);
    if (!account?.email) return false;
    if (account.email.fold !== foldEmail(address)) return false;
    if (!claimHolds(account.email, now)) return false;
    account.email.confirmed = true;
    this.emailOwner.set(account.email.fold, id);
    this.persist();
    return true;
  }
  // Who to send a reset link to. CONFIRMED only, and that is the point: a
  // mistyped address at signup belongs to a stranger who never asked for
  // it, and resetting into their inbox would hand them the account.
  findByConfirmedEmail(email) {
    const id = this.emailOwner.get(foldEmail(email));
    if (id === void 0) return void 0;
    const account = this.byId.get(id);
    if (!account?.email?.confirmed) return void 0;
    return account;
  }
  // Attaches a Discord identity that has already been proved. Today its
  // one caller is the sign-in callback refreshing what Discord showed
  // (ADR 0009): relinking the same Discord to the same account updates
  // the stored name and nothing else, so a player who renamed themselves
  // on Discord sees the change catch up at their next sign-in.
  linkDiscord(id, identity, now) {
    const account = this.byId.get(id);
    if (!account) return { ok: false, error: "unknown_account" };
    const holder = this.findByDiscordId(identity.id);
    if (holder && holder.id !== id) return { ok: false, error: "discord_taken" };
    if (account.discord && account.discord.id !== identity.id) {
      this.discordOwner.delete(account.discord.id);
    }
    const linkedAt = account.discord?.id === identity.id ? account.discord.linkedAt : now;
    account.discord = { id: identity.id, username: identity.username, linkedAt };
    this.discordOwner.set(identity.id, id);
    this.persist();
    return { ok: true, value: account };
  }
  findByDiscordId(discordId) {
    const id = this.discordOwner.get(discordId);
    if (id === void 0) return void 0;
    const account = this.byId.get(id);
    if (account?.discord?.id !== discordId) return void 0;
    return account;
  }
  // A reset landed, or an owner changed their password deliberately.
  setPassword(id, password) {
    const account = this.byId.get(id);
    if (!account) return false;
    if (validatePassword(password)) return false;
    account.password = hashPassword(password);
    this.persist();
    return true;
  }
  // Releases every claim whose week is up. Lazily done on lookup too, so
  // this is housekeeping rather than correctness: it keeps the index from
  // holding addresses nothing will ever ask about again.
  purgeExpiredClaims(now) {
    let released = 0;
    for (const account of this.byId.values()) {
      if (account.email && !claimHolds(account.email, now)) {
        this.releaseEmail(account);
        released++;
      }
    }
    if (released > 0) this.persist();
    return released;
  }
  // Last seen, moved in memory only: this happens on every connection and
  // it is not worth a whole-file rewrite (see server/sessions.ts on the
  // same discipline). It reaches disk on the next persist for any reason.
  touch(id, now) {
    const account = this.byId.get(id);
    if (account) account.seenAt = now;
  }
  // One rated match landed for this account; the delta is already signed.
  applyRating(id, delta) {
    const a = this.byId.get(id);
    if (!a) return;
    a.rating += delta;
    a.ratedGames += 1;
    this.persist();
  }
  // A leaver penalty: rating drops without counting a rated game (a
  // walk-out must not speed a placement up).
  penalize(id, amount) {
    const a = this.byId.get(id);
    if (!a) return;
    a.rating -= amount;
    this.persist();
  }
  // The collection (CONTEXT.md), empty for an id nobody holds.
  collection(id) {
    const a = this.byId.get(id);
    return a ? collectionOf(a) : [];
  }
  laurels(id) {
    return this.byId.get(id)?.laurels ?? 0;
  }
  // One finished match, played by hand, landed for this account (ADR
  // 0018). Returns what it paid, which is what the client is told. An
  // unrated match pays the fixed part alone and leaves the day's bonus
  // standing for a real one.
  award(id, won, at, rated) {
    const a = this.byId.get(id);
    if (!a) return 0;
    const day = dayIndex(at);
    const first2 = won && rated && a.lastWinDay !== day;
    const amount = matchLaurels(won, first2, rated);
    a.laurels = (a.laurels ?? 0) + amount;
    if (first2) a.lastWinDay = day;
    this.persist();
    return amount;
  }
  // What the crossing writes once per account: the laurels its recorded
  // matches would have earned. Absent laurels is what marks an account as
  // uncounted, so this is a no-op on one already carrying a balance and
  // can run on every boot.
  seedLaurels(id, laurels, lastWinDay) {
    const a = this.byId.get(id);
    if (!a || a.laurels !== void 0) return false;
    a.laurels = laurels;
    if (lastWinDay !== null) a.lastWinDay = lastWinDay;
    this.persist();
    return true;
  }
  // Buying a champion into the collection. Every refusal names which of
  // the three it is, because a shop that just says no teaches nothing.
  recruit(id, championId) {
    const a = this.byId.get(id);
    if (!a) return { ok: false, error: "unknown_account" };
    const price = championPrice(championId);
    if (price === null) return { ok: false, error: "not_for_sale" };
    if (collectionOf(a).includes(championId)) return { ok: false, error: "already_owned" };
    const balance = a.laurels ?? 0;
    if (balance < price) return { ok: false, error: "not_enough_laurels" };
    a.laurels = balance - price;
    a.recruited = [...a.recruited ?? [], championId];
    this.persist();
    return { ok: true, value: a.laurels };
  }
  all() {
    return [...this.byId.values()];
  }
  findById(id) {
    return this.byId.get(id);
  }
  // Whether a name is available to a would-be registrant, for the signup
  // form to answer before the password is typed.
  nameAvailable(name) {
    return validateName(name) === null && this.nameFree(foldName(name));
  }
  get count() {
    return this.byId.size;
  }
};

// server/action_tokens.ts
var import_node_crypto2 = require("node:crypto");
var CONFIRM_TTL_MS = CLAIM_TTL_MS;
var RESET_TTL_MS = 60 * 6e4;
function ttlFor(kind) {
  return kind === "confirm" ? CONFIRM_TTL_MS : RESET_TTL_MS;
}
function randomToken() {
  return (0, import_node_crypto2.randomBytes)(32).toString("hex");
}
var TokenStore = class {
  constructor(file, gen = randomToken) {
    this.file = file;
    this.gen = gen;
    for (const t of loadJson(file, [])) this.byToken.set(t.token, t);
  }
  file;
  gen;
  byToken = /* @__PURE__ */ new Map();
  persist() {
    try {
      saveJsonAtomic(this.file, [...this.byToken.values()]);
    } catch (err) {
      console.error("token store persist failed", err);
    }
  }
  expired(t, now) {
    return now - t.createdAt >= ttlFor(t.kind);
  }
  // A fresh link, replacing any live one of the same kind for this
  // account. Returns the token to put in the URL.
  issue(kind, accountId, email, now) {
    for (const [token, t] of this.byToken) {
      if (t.accountId === accountId && t.kind === kind) this.byToken.delete(token);
    }
    const record = { token: this.gen(), kind, accountId, createdAt: now, email };
    this.byToken.set(record.token, record);
    this.persist();
    return record;
  }
  // Spends a token. Expiry is enforced here rather than only in the sweep,
  // so a link that outlived its window never works. Returns undefined for
  // unknown, expired, and wrong-kind alike: a caller cannot use the answer
  // to learn that some other kind of token by this name exists.
  redeem(token, kind, now) {
    const t = this.byToken.get(token);
    if (!t) return void 0;
    if (t.kind !== kind || this.expired(t, now)) {
      if (this.expired(t, now)) {
        this.byToken.delete(token);
        this.persist();
      }
      return void 0;
    }
    this.byToken.delete(token);
    this.persist();
    return t;
  }
  // Everything outstanding for an account, dropped: what a password reset
  // does on its way out, so an old link cannot undo a fresh password.
  revokeAllFor(accountId) {
    let dropped = 0;
    for (const [token, t] of this.byToken) {
      if (t.accountId === accountId) {
        this.byToken.delete(token);
        dropped++;
      }
    }
    if (dropped > 0) this.persist();
    return dropped;
  }
  purgeExpired(now) {
    let dropped = 0;
    for (const [token, t] of this.byToken) {
      if (this.expired(t, now)) {
        this.byToken.delete(token);
        dropped++;
      }
    }
    if (dropped > 0) this.persist();
    return dropped;
  }
  get count() {
    return this.byToken.size;
  }
};

// server/api_limit.ts
var API_RATE_PER_MIN = 120;
var WINDOW_MS = 6e4;
var ApiLimiter = class {
  // A limit of zero or less switches the limiter off.
  constructor(limit = API_RATE_PER_MIN) {
    this.limit = limit;
  }
  limit;
  // Timestamps of this window's requests per address, pruned on touch.
  hits = /* @__PURE__ */ new Map();
  allow(address, now) {
    if (this.limit <= 0) return true;
    const cut = now - WINDOW_MS;
    const list = (this.hits.get(address) ?? []).filter((t) => t > cut);
    if (list.length >= this.limit) {
      this.hits.set(address, list);
      return false;
    }
    list.push(now);
    this.hits.set(address, list);
    return true;
  }
  // Housekeeping: an address with no request this window is forgotten, or
  // the map grows one entry per address ever seen.
  purge(now) {
    const cut = now - WINDOW_MS;
    for (const [address, list] of this.hits) {
      if (list.every((t) => t <= cut)) this.hits.delete(address);
    }
  }
  get trackedAddresses() {
    return this.hits.size;
  }
};

// server/bot_fill.ts
function shuffled(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return out;
}
function fillWithBots(picks, seed = 1, teamSize = TEAM_SIZE, pool = []) {
  const out = [...picks];
  const rng = new Rng(seed);
  let botClientId = -1;
  const candidates = shuffled(pool, rng);
  const seatedAccounts = /* @__PURE__ */ new Set();
  for (const p of picks) if (p.ownerId !== void 0) seatedAccounts.add(p.ownerId);
  for (const team2 of [0, 1]) {
    const onTeam = () => out.filter((p) => p.team === team2);
    for (const seat of candidates) {
      if (onTeam().length >= teamSize) break;
      if (seatedAccounts.has(seat.bot.accountId)) continue;
      if (onTeam().some((p) => p.championId === seat.bot.championId)) continue;
      if (!CHAMPIONS[seat.bot.championId]) continue;
      seatedAccounts.add(seat.bot.accountId);
      out.push({
        clientId: botClientId--,
        name: `${seat.owner} (${seat.bot.name})`,
        team: team2,
        championId: seat.bot.championId,
        sigils: seat.bot.sigils,
        skin: seat.bot.skin,
        playbook: seat.bot.playbook,
        botId: seat.bot.id,
        botVersion: seat.bot.version,
        ownerId: seat.bot.accountId
      });
    }
  }
  for (const team2 of [0, 1]) {
    const held2 = out.filter((p) => p.team === team2).map((p) => ({ championId: p.championId, role: p.forged?.role ?? null }));
    let count3 = held2.length;
    for (const seat of houseSeats(held2, rng, teamSize, STARTER_CHAMPION_LIST)) {
      const c = CHAMPIONS[seat.championId];
      if (!c) continue;
      out.push({
        clientId: botClientId--,
        name: houseName(seat.bot),
        team: team2,
        championId: seat.championId,
        sigils: ["riftstep", "mend"],
        // Deterministic cosmetic variety; the sim clamps out-of-range picks.
        skin: (count3 + team2) % 3,
        bot: seat.bot
      });
      count3++;
    }
  }
  return out;
}

// server/arena.ts
var ARENA_ROUND_MS = 60 * 60 * 1e3;
var ARENA_PLAY_NOW_PER_DAY = 20;
var ARENA_TEAM_SIZE = 5;
var ARENA_MATCH_SIZE = ARENA_TEAM_SIZE * 2;
function dueRound(lastAt, now, roundMs = ARENA_ROUND_MS) {
  return lastAt === null || now - lastAt >= roundMs;
}
var SNAKE = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1];
function seatMatch(sorted) {
  const seats = [];
  const rest = [];
  const accounts = /* @__PURE__ */ new Set();
  const champions = [/* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()];
  const count3 = [0, 0];
  for (const entry of sorted) {
    if (seats.length >= ARENA_MATCH_SIZE || accounts.has(entry.bot.accountId)) {
      rest.push(entry);
      continue;
    }
    const preferred = SNAKE[seats.length] ?? 0;
    const other = preferred === 0 ? 1 : 0;
    let team2 = null;
    for (const t of [preferred, other]) {
      if (count3[t] < ARENA_TEAM_SIZE && !champions[t].has(entry.bot.championId)) {
        team2 = t;
        break;
      }
    }
    if (team2 === null) {
      rest.push(entry);
      continue;
    }
    seats.push({ bot: entry.bot, owner: entry.owner, team: team2 });
    accounts.add(entry.bot.accountId);
    champions[team2].add(entry.bot.championId);
    count3[team2] += 1;
  }
  return { plan: { seats }, rest };
}
function planRound(bots, pool) {
  let sorted = bots.map((bot) => ({ bot, owner: pool.nameOf(bot.accountId) })).filter((e) => e.owner !== null).sort(
    (a, b) => pool.ratingOf(b.bot.id) - pool.ratingOf(a.bot.id) || a.bot.id.localeCompare(b.bot.id)
  );
  const plans = [];
  while (sorted.length > 0) {
    const { plan, rest } = seatMatch(sorted);
    if (plan.seats.length === 0) break;
    plans.push(plan);
    sorted = rest;
  }
  return plans;
}
function planPlayNow(bot, pool, ratings) {
  const owner = ratings.nameOf(bot.accountId);
  if (owner === null) return null;
  const mine = ratings.ratingOf(bot.id);
  const others = pool.filter((b) => b.accountId !== bot.accountId).map((b) => ({ bot: b, owner: ratings.nameOf(b.accountId) })).filter((e) => e.owner !== null).sort(
    (a, b) => Math.abs(ratings.ratingOf(a.bot.id) - mine) - Math.abs(ratings.ratingOf(b.bot.id) - mine) || a.bot.id.localeCompare(b.bot.id)
  );
  const { plan } = seatMatch([{ bot, owner }, ...others]);
  return plan;
}
function arenaPicks(plan, seed = 1) {
  const seats = plan.seats.map((s, i) => ({
    clientId: -1e3 - i,
    name: `${s.owner} (${s.bot.name})`,
    team: s.team,
    championId: s.bot.championId,
    sigils: s.bot.sigils,
    skin: s.bot.skin,
    playbook: s.bot.playbook
  }));
  return fillWithBots(seats, seed, ARENA_TEAM_SIZE).map((p) => ({
    name: p.name,
    team: p.team,
    championId: p.championId,
    sigils: [p.sigils[0], p.sigils[1]],
    ...p.skin !== void 0 ? { skin: p.skin } : {},
    ...p.bot !== void 0 ? { bot: p.bot } : {},
    ...p.playbook !== void 0 ? { playbook: p.playbook } : {}
  }));
}
function playNowAllowed(usedToday, cap = ARENA_PLAY_NOW_PER_DAY) {
  return cap <= 0 || usedToday < cap;
}

// server/arena_runner.ts
var import_node_worker_threads = require("node:worker_threads");

// src/fast_match.ts
var FAST_MATCH_MAX_TICKS = 20 * 60 * 40;
function runFastMatch(orchard, req) {
  const forged = req.forged ?? [];
  const { sim, unitIds } = buildMatchSim(orchard, req.seed, req.picks, forged);
  const ledger = new PlayLedger();
  const checks = [];
  while (sim.winner === null && sim.tickCount < req.maxTicks) {
    ledger.observe(sim.tickCount + 1, sim.tick(), sim);
    if (sim.tickCount % CHECK_TICKS === 0) checks.push(sim.checksum());
  }
  const record = {
    version: REPLAY_VERSION,
    content: contentFingerprint(orchard),
    checks,
    seed: req.seed,
    picks: req.picks,
    events: [],
    ticks: sim.tickCount,
    ...forged.length > 0 ? { forged } : {}
  };
  return {
    winner: sim.winner,
    ticks: sim.tickCount,
    time: sim.time,
    report: ledger.report(),
    unitIds,
    score: [...sim.scoreboard()],
    record
  };
}

// server/star_orchard.ts
var import_node_fs2 = require("node:fs");
var import_node_path2 = __toESM(require("node:path"), 1);
var FOLDER = import_node_path2.default.join("map", "star-orchard");
function starOrchardDir(root = process.cwd()) {
  for (const base of ["public", "dist"]) {
    const dir = import_node_path2.default.join(root, base, FOLDER);
    if ((0, import_node_fs2.existsSync)(import_node_path2.default.join(dir, "manifest.json"))) return dir;
  }
  throw new Error(`the Star Orchard export is missing under ${root} (public/ or dist/)`);
}
function readStarOrchard(root = process.cwd()) {
  const dir = starOrchardDir(root);
  const manifest = JSON.parse(
    (0, import_node_fs2.readFileSync)(import_node_path2.default.join(dir, "manifest.json"), "utf8")
  );
  const layout = JSON.parse(
    (0, import_node_fs2.readFileSync)(import_node_path2.default.join(dir, "gameplay.json"), "utf8")
  );
  const binary = (0, import_node_fs2.readFileSync)(import_node_path2.default.join(dir, manifest.navigation));
  const navigation = binary.buffer.slice(
    binary.byteOffset,
    binary.byteOffset + binary.byteLength
  );
  return assembleStarOrchard(layout, manifest, navigation);
}
var cached2 = null;
function starOrchard() {
  cached2 ??= readStarOrchard();
  return cached2;
}

// server/arena_runner.ts
var ARENA_QUEUE_MAX = 20;
var ArenaRunner = class {
  constructor(workerFile, queueMax = ARENA_QUEUE_MAX) {
    this.workerFile = workerFile;
    this.queueMax = queueMax;
  }
  workerFile;
  queueMax;
  chain = Promise.resolve();
  waiting = 0;
  get queued() {
    return this.waiting;
  }
  get hasWorker() {
    return this.workerFile !== null;
  }
  // Resolves with the match once its turn came; rejects at once when the
  // queue is full, so a busy Arena says so instead of piling up.
  run(req) {
    if (this.waiting >= this.queueMax) {
      return Promise.reject(new Error("the Arena is busy right now; try again in a moment"));
    }
    this.waiting += 1;
    const turn = this.chain.then(
      () => this.runOne(req),
      () => this.runOne(req)
    );
    this.chain = turn.finally(() => {
      this.waiting -= 1;
    });
    return turn;
  }
  runOne(req) {
    if (this.workerFile === null) return Promise.resolve(runFastMatch(starOrchard(), req));
    const file = this.workerFile;
    return new Promise((resolve, reject) => {
      const worker = new import_node_worker_threads.Worker(file, { workerData: req });
      let settled = false;
      worker.once("message", (result) => {
        settled = true;
        resolve(result);
      });
      worker.once("error", (err) => {
        settled = true;
        reject(err);
      });
      worker.once("exit", (code) => {
        if (!settled) reject(new Error(`the Arena worker exited with code ${code}`));
      });
    });
  }
};

// server/bot_records.ts
var RECORD_CAP = 50;
var RECORD_UPLOAD_MAX = 256 * 1024;
function wonBy(e) {
  return e.winner === null ? null : e.winner === e.team;
}
function rowOf(e) {
  const { score, report: _report, botId: _botId, ...rest } = e;
  return { ...rest, line: score.find((r) => r.unitId === e.botUnitId) ?? null };
}
function addEntry(store, botId, accountId, entry) {
  const id = store.addRecord({
    botId,
    accountId,
    kind: entry.kind,
    at: entry.at,
    won: wonBy(entry),
    replayId: entry.replayId,
    entry
  });
  const dropped = store.pruneRecords(botId, RECORD_CAP);
  return { id, dropped };
}
function listEntries(store, botId) {
  return store.listRecords(botId).map(({ id, entry }) => rowOf({ ...entry, id, botId }));
}
function getEntry(store, botId, id) {
  const r = store.getRecord(id);
  if (!r || r.botId !== botId) return null;
  return { ...r.entry, id: r.id, botId };
}
function fail(error) {
  return { ok: false, error };
}
function isRecord2(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function int(v, min, max) {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null;
}
function str(v, max) {
  return typeof v === "string" && v.length >= 1 && v.length <= max ? v : null;
}
function team(v) {
  return v === 0 || v === 1 ? v : null;
}
function scoreRow(raw) {
  if (!isRecord2(raw)) return null;
  const unitId = int(raw.unitId, 0, 1e5);
  const name = str(raw.name, 32);
  const championId = str(raw.championId, 32);
  const t = team(raw.team);
  const level = int(raw.level, 1, 18);
  const kills = int(raw.kills, 0, 999);
  const deaths = int(raw.deaths, 0, 999);
  const assists = int(raw.assists, 0, 999);
  const cs = int(raw.cs, 0, 9999);
  if (unitId === null || name === null || championId === null || CHAMPIONS[championId] === void 0 || t === null || level === null || kills === null || deaths === null || assists === null || cs === null) {
    return null;
  }
  const player = raw.player === null || raw.player === void 0 ? null : str(raw.player, 32);
  if (player === null && raw.player !== null && raw.player !== void 0) return null;
  if (!Array.isArray(raw.items) || raw.items.length > INVENTORY_SLOTS) return null;
  const items = [];
  for (const id of raw.items) {
    if (typeof id !== "string" || ITEMS[id] === void 0) return null;
    items.push(id);
  }
  return { unitId, name, championId, player, team: t, level, kills, deaths, assists, cs, items };
}
var PLAY_ID_MAX = 48;
var PLAYS_MAX = 64;
var DEATHS_MAX = 200;
var SCENE_KINDS = ["champion", "tower", "sanctum"];
function coord(v) {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 200 ? v : null;
}
function deathSceneOf(raw) {
  if (!isRecord2(raw)) return null;
  const x = coord(raw.x);
  const z = coord(raw.z);
  const allies = int(raw.allies, 0, 10);
  const enemies = int(raw.enemies, 0, 10);
  if (x === null || z === null || allies === null || enemies === null) return null;
  if (typeof raw.underTower !== "boolean") return null;
  if (!Array.isArray(raw.around) || raw.around.length > SCENE_CAP) return null;
  const around = [];
  for (const u of raw.around) {
    if (!isRecord2(u)) return null;
    const id = int(u.id, 0, 1e5);
    const ux = coord(u.x);
    const uz = coord(u.z);
    const t = team(u.team);
    const hp = typeof u.hp === "number" && u.hp >= 0 && u.hp <= 1 ? u.hp : null;
    const kind = SCENE_KINDS.includes(String(u.kind)) ? u.kind : null;
    if (id === null || ux === null || uz === null || t === null || hp === null || kind === null) {
      return null;
    }
    around.push({ id, team: t, kind, x: ux, z: uz, hp });
  }
  return { x, z, underTower: raw.underTower, allies, enemies, around };
}
function unitReport(raw) {
  if (!isRecord2(raw)) return null;
  const unitId = int(raw.unitId, 0, 1e5);
  const deaths = int(raw.deaths, 0, 999);
  if (unitId === null || deaths === null || !isRecord2(raw.plays)) return null;
  const plays = {};
  const keys = Object.keys(raw.plays);
  if (keys.length > PLAYS_MAX) return null;
  for (const key of keys) {
    if (key.length === 0 || key.length > PLAY_ID_MAX) return null;
    const s = raw.plays[key];
    if (!isRecord2(s)) return null;
    const ticks = int(s.ticks, 0, FAST_MATCH_MAX_TICKS);
    const d = int(s.deaths, 0, 999);
    if (ticks === null || d === null) return null;
    plays[key] = { ticks, deaths: d };
  }
  const out = { unitId, plays, deaths };
  if (raw.deathsAt !== void 0) {
    if (!Array.isArray(raw.deathsAt) || raw.deathsAt.length > DEATHS_MAX) return null;
    const notes = [];
    for (const n of raw.deathsAt) {
      if (!isRecord2(n)) return null;
      const tick = int(n.tick, 0, FAST_MATCH_MAX_TICKS);
      const killerId = int(n.killerId, 0, 1e5);
      const play2 = n.play === null ? null : str(n.play, PLAY_ID_MAX);
      if (tick === null || killerId === null || play2 === null && n.play !== null) return null;
      const note = { tick, play: play2, killerId };
      if (n.scene !== void 0) {
        const scene = deathSceneOf(n.scene);
        if (!scene) return null;
        note.scene = scene;
      }
      notes.push(note);
    }
    out.deathsAt = notes;
  }
  return out;
}
function report(raw) {
  if (!isRecord2(raw)) return null;
  const ticks = int(raw.ticks, 0, FAST_MATCH_MAX_TICKS);
  if (ticks === null || !Array.isArray(raw.units) || raw.units.length > 10) return null;
  const units = [];
  for (const u of raw.units) {
    const parsed = unitReport(u);
    if (!parsed) return null;
    units.push(parsed);
  }
  return { ticks, units };
}
function pick(raw) {
  if (!isRecord2(raw)) return null;
  const name = str(raw.name, 32);
  const t = team(raw.team);
  const championId = str(raw.championId, 32);
  const skin = int(raw.skin, 0, 9);
  if (name === null || t === null || championId === null || CHAMPIONS[championId] === void 0 || skin === null || !Array.isArray(raw.sigils) || raw.sigils.length !== 2) {
    return null;
  }
  const sigils = raw.sigils;
  const a = typeof sigils[0] === "string" && SIGILS[sigils[0]] ? sigils[0] : null;
  const b = typeof sigils[1] === "string" && SIGILS[sigils[1]] ? sigils[1] : null;
  if (a === null || b === null) return null;
  const out = { name, team: t, championId, sigils: [a, b], skin };
  if (raw.bot !== void 0) {
    const bot = str(raw.bot, 32);
    if (bot === null) return null;
    out.bot = bot;
  }
  if (raw.playbook !== void 0) {
    const v = validatePlaybook(raw.playbook);
    if (!v.ok) return null;
    out.playbook = v.def;
  }
  return out;
}
function replay(raw, seed, ticks) {
  if (!isRecord2(raw)) return null;
  if (raw.version !== REPLAY_VERSION || raw.seed !== seed || raw.ticks !== ticks) return null;
  if (!Array.isArray(raw.events) || raw.events.length !== 0) return null;
  if (raw.forged !== void 0) return null;
  if (!Array.isArray(raw.picks) || raw.picks.length !== 10) return null;
  const picks = [];
  for (const p of raw.picks) {
    const parsed = pick(p);
    if (!parsed) return null;
    picks.push(parsed);
  }
  return {
    version: REPLAY_VERSION,
    content: contentFingerprint(starOrchard()),
    seed,
    picks,
    events: [],
    ticks
  };
}
function parseUpload(raw, now) {
  if (!isRecord2(raw)) return fail("a record entry is an object");
  const kind = raw.kind;
  if (kind !== "sparring" && kind !== "series") return fail("kind must be sparring or series");
  const seed = int(raw.seed, 0, 2147483647);
  const t = team(raw.team);
  const winner = raw.winner === null ? null : team(raw.winner);
  const ticks = int(raw.ticks, 1, FAST_MATCH_MAX_TICKS);
  const version = int(raw.version, 1, 1e6);
  const botUnitId = int(raw.botUnitId, 0, 1e5);
  if (seed === null) return fail("seed");
  if (t === null) return fail("team");
  if (winner === null && raw.winner !== null) return fail("winner");
  if (ticks === null) return fail("ticks");
  if (version === null) return fail("version");
  if (typeof raw.edited !== "boolean") return fail("edited");
  if (botUnitId === null) return fail("botUnitId");
  if (!Array.isArray(raw.score) || raw.score.length !== 10) return fail("score: ten rows");
  const score = [];
  for (const r of raw.score) {
    const row = scoreRow(r);
    if (!row) return fail("score: a row is malformed");
    score.push(row);
  }
  if (!score.some((r) => r.unitId === botUnitId && r.team === t)) {
    return fail("score: the bot is not on its side");
  }
  const rep = report(raw.report);
  if (!rep) return fail("report");
  const rec = replay(raw.record, seed, ticks);
  if (!rec) return fail("record: not a sparring replay");
  const entry = {
    kind,
    at: now,
    seed,
    team: t,
    winner,
    ticks,
    version,
    edited: raw.edited,
    botUnitId,
    score,
    report: rep
  };
  if (kind === "series") {
    const seriesId = str(raw.seriesId, 40);
    const seriesIndex = int(raw.seriesIndex, 1, 10);
    const seriesOf = int(raw.seriesOf, 1, 10);
    if (seriesId === null || !/^[a-z0-9_-]+$/.test(seriesId)) return fail("seriesId");
    if (seriesIndex === null || seriesOf === null || seriesIndex > seriesOf) {
      return fail("series place");
    }
    entry.seriesId = seriesId;
    entry.seriesIndex = seriesIndex;
    entry.seriesOf = seriesOf;
  }
  if (raw.versus !== void 0) {
    const versus = str(raw.versus, 80);
    if (versus === null) return fail("versus");
    entry.versus = versus;
  }
  return { ok: true, value: { entry, record: rec } };
}

// server/match_rating.ts
function rateMatch(seats, winner, eligible, book) {
  const ownedByTeam = [
    seats.filter((s) => s.team === 0).length,
    seats.filter((s) => s.team === 1).length
  ];
  const rated = eligible && isRated(ownedByTeam);
  const rows = seats.map((s, i) => ({
    accountId: i,
    team: s.team,
    rating: book.read(s),
    seat: s
  }));
  const deltas = rated ? ratingDeltas(rows, winner) : /* @__PURE__ */ new Map();
  const results = [];
  for (const row of rows) {
    const delta = deltas.get(row.accountId) ?? 0;
    if (delta !== 0) book.apply(row.seat, delta);
    results.push({
      accountId: row.seat.accountId,
      way: row.seat.way,
      ...row.seat.botId !== void 0 ? { botId: row.seat.botId } : {},
      delta,
      rating: book.read(row.seat)
    });
  }
  return { rated, results };
}

// server/records.ts
function buildMatchRecord(rows, accountIdByUnit, winner, durationS, at, rating, replayId) {
  return {
    at,
    durationS: Math.round(durationS),
    winner,
    rated: rating?.rated ?? false,
    ...rating?.queue !== void 0 ? { queue: rating.queue } : {},
    ...replayId !== void 0 ? { replayId } : {},
    players: rows.map((r) => {
      const accountId = accountIdByUnit.get(r.unitId) ?? null;
      const delta = rating?.rated && accountId !== null ? rating.deltas.get(accountId) : void 0;
      return {
        accountId,
        // The person, when there is one; the champion otherwise.
        name: r.player ?? r.name,
        championId: r.championId,
        team: r.team,
        level: r.level,
        kills: r.kills,
        deaths: r.deaths,
        assists: r.assists ?? 0,
        cs: r.cs ?? 0,
        ...delta !== void 0 ? { ratingDelta: delta } : {},
        ...rating?.ways?.get(r.unitId) === "bot" ? { way: "bot" } : {},
        ...r.items && r.items.length > 0 ? { items: [...r.items] } : {}
      };
    })
  };
}

// server/arena_service.ts
var ARENA_MAX_TICKS = 20 * 60 * 40;
var DAY_MS2 = 24 * 60 * 60 * 1e3;
function poolOf(deps) {
  return {
    ratingOf: (botId) => deps.store.botRating(botId, "arena").rating,
    nameOf: deps.nameOf
  };
}
async function runArenaMatch(deps, plan, opts = {}) {
  const now = (deps.now ?? Date.now)();
  const matchId = deps.nextMatchId();
  const seed = now % 2e9 + matchId;
  const picks = arenaPicks(plan, seed);
  const result = await deps.runner.run({
    seed,
    picks,
    maxTicks: deps.maxTicks ?? ARENA_MAX_TICKS
  });
  const summary = {
    matchId,
    winner: result.winner,
    ticks: result.ticks,
    rated: false,
    seats: plan.seats.map((s) => ({
      accountId: s.bot.accountId,
      botId: s.bot.id,
      team: s.team,
      delta: 0,
      rating: deps.store.botRating(s.bot.id, "arena").rating
    }))
  };
  if (result.winner === null) {
    deps.log?.(`arena match ${matchId}: no winner after ${result.ticks} ticks, not recorded`);
    return summary;
  }
  const winner = result.winner;
  const owned2 = plan.seats.map((s) => ({
    accountId: s.bot.accountId,
    team: s.team,
    way: "bot",
    botId: s.bot.id
  }));
  const book = {
    read: (seat) => deps.store.botRating(seat.botId ?? "", "arena").rating,
    apply: (seat, delta) => deps.store.applyBotRating(seat.botId ?? "", seat.accountId, "arena", delta)
  };
  const outcome = rateMatch(owned2, winner, opts.rated !== false, book);
  summary.rated = outcome.rated;
  const deltas = /* @__PURE__ */ new Map();
  const deltasByAccount = /* @__PURE__ */ new Map();
  for (const r of outcome.results) {
    if (r.botId !== void 0) deltas.set(r.botId, r.delta);
    deltasByAccount.set(r.accountId, r.delta);
  }
  summary.seats = plan.seats.map((s) => ({
    accountId: s.bot.accountId,
    botId: s.bot.id,
    team: s.team,
    delta: deltas.get(s.bot.id) ?? 0,
    rating: deps.store.botRating(s.bot.id, "arena").rating
  }));
  let replayId;
  try {
    deps.saveReplay(matchId, result.record);
    replayId = matchId;
  } catch (err) {
    deps.log?.(`arena match ${matchId}: replay save failed: ${err.message}`);
  }
  summary.replayId = replayId;
  const accountIdByUnit = /* @__PURE__ */ new Map();
  const ways = /* @__PURE__ */ new Map();
  const nameByUnit = /* @__PURE__ */ new Map();
  picks.forEach((p, i) => {
    const unitId = result.unitIds[i];
    if (unitId === void 0) return;
    nameByUnit.set(unitId, p.name);
    const seat = plan.seats[i];
    if (i < plan.seats.length && seat) {
      accountIdByUnit.set(unitId, seat.bot.accountId);
      ways.set(unitId, "bot");
    }
  });
  const rows = result.score.map((r) => ({ ...r, player: nameByUnit.get(r.unitId) ?? r.player }));
  plan.seats.forEach((s, i) => {
    deps.store.addBotReport({
      matchId,
      botId: s.bot.id,
      seatIndex: i,
      unitId: result.unitIds[i] ?? 0,
      picks,
      report: result.report,
      at: now
    });
    const delta = deltas.get(s.bot.id);
    addEntry(deps.store, s.bot.id, s.bot.accountId, {
      kind: "arena",
      at: now,
      seed: result.record.seed,
      team: s.team,
      winner,
      ticks: result.ticks,
      version: s.bot.version,
      edited: false,
      botUnitId: result.unitIds[i] ?? 0,
      score: rows,
      report: result.report,
      replayId: replayId ?? null,
      ...outcome.rated && delta !== void 0 ? { ratingDelta: delta } : {}
    });
  });
  deps.recordMatch(
    buildMatchRecord(
      rows,
      accountIdByUnit,
      winner,
      result.time,
      now,
      { rated: outcome.rated, deltas: deltasByAccount, ways, queue: "arena" },
      replayId
    )
  );
  deps.log?.(
    `arena match ${matchId}: team ${winner + 1} won after ${Math.round(result.time)} s (${plan.seats.length} bot seat(s))`
  );
  return summary;
}
async function challenge(deps, accountId, botId, targetId) {
  if (typeof botId !== "string" || typeof targetId !== "string") {
    return { ok: false, error: "malformed request" };
  }
  const bot = deps.store.getBot(botId);
  if (!bot || bot.accountId !== accountId) {
    return { ok: false, error: "no such bot on this account" };
  }
  const target = deps.store.getBot(targetId);
  if (!target?.deposited) return { ok: false, error: "that bot is not ranked" };
  if (target.accountId === accountId) {
    return { ok: false, error: "challenge a bot of another account (spar your own)" };
  }
  const now = (deps.now ?? Date.now)();
  const cap = deps.playNowPerDay ?? ARENA_PLAY_NOW_PER_DAY;
  if (!playNowAllowed(deps.store.arenaEventsSince(accountId, now - DAY_MS2), cap)) {
    return {
      ok: false,
      error: `daily limit reached (${cap} Arena matches per day); try again tomorrow`
    };
  }
  const owner = deps.nameOf(accountId);
  const theirs = deps.nameOf(target.accountId);
  if (owner === null || theirs === null) return { ok: false, error: "cannot enter the Arena" };
  deps.store.addArenaEvent(accountId, now);
  const plan = {
    seats: [
      { bot, owner, team: 0 },
      { bot: target, owner: theirs, team: 1 }
    ]
  };
  try {
    const summary = await runArenaMatch(deps, plan, { rated: false });
    return { ok: true, ...summary, myTeam: 0 };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
function roundDue(deps) {
  return dueRound(
    deps.store.arenaLastRoundAt(),
    (deps.now ?? Date.now)(),
    deps.roundMs ?? ARENA_ROUND_MS
  );
}
async function runArenaRound(deps) {
  const now = (deps.now ?? Date.now)();
  deps.store.setArenaLastRoundAt(now);
  const plans = planRound(deps.store.listDeposited(), poolOf(deps));
  for (const plan of plans) await runArenaMatch(deps, plan);
  if (plans.length > 0) deps.log?.(`arena round: ${plans.length} match(es)`);
  return { matches: plans.length };
}
async function playNow(deps, accountId, botId) {
  if (typeof botId !== "string") return { ok: false, error: "malformed request" };
  const bot = deps.store.getBot(botId);
  if (!bot || bot.accountId !== accountId)
    return { ok: false, error: "no such bot on this account" };
  const now = (deps.now ?? Date.now)();
  const cap = deps.playNowPerDay ?? ARENA_PLAY_NOW_PER_DAY;
  if (!playNowAllowed(deps.store.arenaEventsSince(accountId, now - DAY_MS2), cap)) {
    return {
      ok: false,
      error: `daily limit reached (${cap} Arena matches per day); try again tomorrow`
    };
  }
  const plan = planPlayNow(bot, deps.store.listDeposited(), poolOf(deps));
  if (!plan) return { ok: false, error: "this account cannot enter the Arena" };
  deps.store.addArenaEvent(accountId, now);
  try {
    const summary = await runArenaMatch(deps, plan);
    return { ok: true, ...summary, myTeam: 0 };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// server/art.ts
var import_node_fs4 = require("node:fs");
var import_node_path4 = __toESM(require("node:path"), 1);

// server/embers.ts
var EMBER_PRICES = {
  model: 30,
  weapon: 30,
  rig: 25,
  // Bought from OpenAI directly (server/generation/openai_images.ts):
  // 98 text tokens in and 1372 image tokens out for the splash the Forge
  // really asks for, at the published rates, is 4.2 cents. Tripo resells
  // the same model at a flat 10, which is what IMAGE_PRICE_RESOLD is for:
  // a deployment without an OpenAI key pays that and must charge it.
  image: 4,
  kitTurn: 2,
  coachTurn: 1
};
var IMAGE_PRICE_RESOLD = 10;
var BAKE_BASE = 5;
var BAKE_PER_CLIP = 5;
function bakePrice(providerClips) {
  if (providerClips <= 0) return 0;
  return BAKE_BASE + BAKE_PER_CLIP * providerClips;
}
var EMBERS_PER_WEEK = 100;
var CREATION_IN_EMBERS = EMBER_PRICES.model + EMBER_PRICES.weapon + EMBER_PRICES.rig + bakePrice(5);
var CHAMPION_IN_EMBERS = CREATION_IN_EMBERS;
var FIRST_CHAMPION_IN_EMBERS = CHAMPION_IN_EMBERS + 3 * EMBER_PRICES.image;
var WELCOME_FLOOR = 130;
function welcomeTopUp(held2) {
  return Math.max(0, WELCOME_FLOOR - held2);
}

// server/generation/pipeline.ts
var import_node_fs3 = require("node:fs");
var import_node_path3 = __toESM(require("node:path"), 1);

// server/generation/house_clips.ts
var clip = (name, label) => ({
  id: `house:${name}`,
  label,
  file: `models/mannequin/clips/house_${name}.glb`
});
var HOUSE_CLIP_CHOICES = {
  idle: [
    clip("sns_idle", "Sword and shield stance"),
    clip("sns_block_idle", "Shield guard stance"),
    clip("gs_idle", "Great sword stance"),
    clip("gs_guard", "Great sword guard"),
    clip("magic_idle", "Mage stance"),
    clip("magic_guard", "Mage guard stance")
  ],
  run: [
    clip("sns_run", "Sword and shield run"),
    clip("gs_run", "Great sword run"),
    clip("magic_run", "Mage run")
  ],
  attack: [
    clip("sns_attack_01", "Sword combo"),
    clip("sns_attack_02", "Spinning slash"),
    clip("sns_attack_03", "Turning slash"),
    clip("sns_attack_04", "Shield-arm slash"),
    clip("gs_attack_01", "Great sword slash"),
    clip("gs_attack_02", "Great sword strike"),
    clip("gs_attack_03", "Great sword combo"),
    clip("gs_attack_04", "Great sword sweep"),
    clip("magic_attack_01", "Magic bolt"),
    clip("magic_attack_02", "Magic bolt 2"),
    clip("magic_attack_03", "Magic bolt 3")
  ],
  cast: [
    clip("magic_cast_01", "One-hand cast"),
    clip("magic_cast_02", "Two-hand cast"),
    clip("magic_cast_03", "Focused blast"),
    clip("magic_cast_04", "Area cast"),
    clip("gs_cast_01", "Quick spell"),
    clip("gs_cast_02", "Power up"),
    clip("gs_cast_03", "Long ritual")
  ],
  death: [
    clip("sns_death", "Sword and shield death"),
    clip("gs_death_01", "Great sword death"),
    clip("gs_death_02", "Great sword death 2"),
    clip("magic_death_01", "Mage death"),
    clip("magic_death_02", "Mage death 2")
  ]
};
function isHouseClip(id) {
  return id.startsWith("house:");
}
function houseClipFile(id) {
  for (const list of Object.values(HOUSE_CLIP_CHOICES)) {
    for (const c of list) if (c.id === id) return c.file;
  }
  return null;
}
function catalogRoles(provider) {
  const tripo = provider.clipChoices();
  const out = {};
  for (const role of Object.keys(tripo)) {
    out[role] = [
      ...tripo[role],
      ...HOUSE_CLIP_CHOICES[role].map(({ id, label }) => ({ id, label }))
    ];
  }
  return out;
}

// server/generation/provider.ts
var CLIP_ROLES = ["idle", "run", "attack", "cast", "death"];
var SPELL_CLIP_SLOTS = ["castQ", "castW", "castE", "castR"];
var WEAPON_FAMILIES = ["slashing", "blunt", "bow", "staff", "unarmed"];
var GenerationError = class extends Error {
  constructor(message, blocked = false) {
    super(message);
    this.blocked = blocked;
    this.name = "GenerationError";
  }
  blocked;
};

// server/generation/pipeline.ts
function familyOf(def) {
  const ranged = def.base.attackRange >= 3;
  if (ranged) {
    return def.role === "Marksman" ? "bow" : "staff";
  }
  if (def.role === "Tank") return "blunt";
  if (def.role === "Support" || def.role === "Mage" || def.role === "Battlemage") return "staff";
  return "slashing";
}
function noteSpend(deps, accountId, action, detail, asset, at) {
  if (typeof asset.cost !== "number") return;
  deps.storage.addSpendSample({
    accountId,
    action,
    detail,
    provider: "tripo",
    credits: asset.cost,
    at
  });
}
function buildEmbers(deps, forgedId) {
  const assets = deps.storage.forgedAssets(forgedId) ?? {};
  const weaponComing = !assets.weapon && deps.storage.chosenArt(forgedId, "weapon") !== null;
  return EMBER_PRICES.model + EMBER_PRICES.rig + (weaponComing ? EMBER_PRICES.weapon : 0);
}
function shortfall(price, held2) {
  return `this costs ${price} embers and you have ${held2}; the grant refills weekly`;
}
function startModelBuild(deps, req) {
  const now = deps.now ?? Date.now;
  if (deps.storage.runningJobFor(req.def.id)) {
    return { ok: false, error: "this champion is already being built" };
  }
  const price = buildEmbers(deps, req.def.id);
  const held2 = deps.storage.creditBalance(req.accountId);
  if (held2 < price) return { ok: false, error: shortfall(price, held2) };
  const at = now();
  deps.storage.addCreditEntry({
    accountId: req.accountId,
    delta: -price,
    reason: "finalize",
    ref: req.def.id,
    at
  });
  const jobId = deps.storage.createGenerationJob(req.def.id, req.accountId, at, "build", price);
  const done = runModelBuild(deps, jobId, req).catch((err) => {
    console.error("model build job crashed outside its own handling", err);
  });
  return { ok: true, jobId, done };
}
async function runModelBuild(deps, jobId, req) {
  const now = deps.now ?? Date.now;
  const stage = (name) => {
    deps.storage.updateGenerationJob(jobId, { stage: name }, now());
  };
  try {
    stage("reference");
    const sheet = deps.storage.chosenArt(req.def.id, "sheet");
    if (!sheet) {
      throw new GenerationError("no chosen model reference: generate and pick one first");
    }
    if (!deps.provider.uploadImage) {
      throw new GenerationError("this provider cannot take the chosen reference as input");
    }
    const upload = deps.provider.uploadImage.bind(deps.provider);
    const read = deps.readFile ?? import_node_fs3.readFileSync;
    const sheetRef = await upload({
      data: read(import_node_path3.default.join(deps.assetsDir, sheet.path)),
      name: import_node_path3.default.basename(sheet.path)
    });
    stage("classify");
    const allowed = deps.classifyImage ? await deps.classifyImage(sheet.path) : true;
    if (!allowed) throw new GenerationError("the model reference failed classification", true);
    if (!req.force && deps.checkReference) {
      const refusal = await deps.checkReference(read(import_node_path3.default.join(deps.assetsDir, sheet.path)));
      if (refusal !== null) throw new GenerationError(refusal);
    }
    stage("model");
    const model = await deps.provider.imageTo3D({ image: sheetRef });
    noteSpend(deps, req.accountId, "generation", "model", model, now());
    stage("rig");
    const rigged = await deps.provider.rig({ modelTaskId: model.taskId, rigType: "biped" });
    noteSpend(deps, req.accountId, "animate", "rig", rigged, now());
    const existing = deps.storage.forgedAssets(req.def.id) ?? {};
    const weaponArt = existing.weapon ? null : deps.storage.chosenArt(req.def.id, "weapon");
    let weapon = null;
    if (weaponArt) {
      stage("weapon");
      const weaponRef = await upload({
        data: read(import_node_path3.default.join(deps.assetsDir, weaponArt.path)),
        name: import_node_path3.default.basename(weaponArt.path)
      });
      weapon = await deps.provider.imageTo3D({ image: weaponRef });
      noteSpend(deps, req.accountId, "generation", "weapon", weapon, now());
    }
    stage("download");
    const dir = import_node_path3.default.join(deps.assetsDir, "forged", req.def.id);
    (0, import_node_fs3.mkdirSync)(dir, { recursive: true });
    const sheetPath = `forged/${req.def.id}/sheet.png`;
    const modelPath = `forged/${req.def.id}/model_${jobId}.glb`;
    const riggedPath = `forged/${req.def.id}/rigged_${jobId}.glb`;
    const weaponPath = `forged/${req.def.id}/weapon.glb`;
    const copy = deps.copyFile ?? import_node_fs3.copyFileSync;
    copy(import_node_path3.default.join(deps.assetsDir, sheet.path), import_node_path3.default.join(deps.assetsDir, sheetPath));
    await deps.download(model.url, import_node_path3.default.join(deps.assetsDir, modelPath));
    await deps.download(rigged.url, import_node_path3.default.join(deps.assetsDir, riggedPath));
    if (weapon) await deps.download(weapon.url, import_node_path3.default.join(deps.assetsDir, weaponPath));
    checkBudget(deps, modelPath, deps.budgets?.modelKb);
    checkBudget(deps, riggedPath, deps.budgets?.modelKb);
    if (weapon) checkBudget(deps, weaponPath, deps.budgets?.modelKb);
    const provenance = Array.isArray(existing.provenance) ? existing.provenance : [];
    deps.storage.updateForgedAssets(
      req.def.id,
      {
        ...existing,
        sheet: sheetPath,
        model: modelPath,
        modelTask: model.taskId,
        rigged: riggedPath,
        rigTask: rigged.taskId,
        ...weapon ? { weapon: weaponPath } : {},
        provenance: [
          ...provenance,
          sheet.provenance,
          model.provenance,
          rigged.provenance,
          weapon?.provenance
        ].filter((p) => p !== null && p !== void 0)
      },
      now()
    );
    deps.storage.updateGenerationJob(jobId, { status: "success", stage: "done" }, now());
  } catch (err) {
    const blocked = err instanceof GenerationError && err.blocked;
    const message = err instanceof Error ? err.message : String(err);
    deps.storage.updateGenerationJob(
      jobId,
      { status: "failed", error: blocked ? `blocked: ${message}` : message },
      now()
    );
    refund(
      deps.storage,
      req.accountId,
      req.def.id,
      deps.storage.getGenerationJob(jobId)?.embers ?? null,
      now()
    );
  }
}
function bakePlan(assets, clips) {
  const prevClips = assets.clips ?? {};
  const prevFiles = assets.clipFiles ?? {};
  const slots = [
    ...CLIP_ROLES,
    ...SPELL_CLIP_SLOTS.filter((slot) => typeof clips[slot] === "string")
  ];
  const picks = clips;
  const delta = slots.filter(
    (role) => picks[role] !== prevClips[role] || typeof prevFiles[role] !== "string"
  );
  return {
    delta,
    providerDelta: delta.filter((role) => !isHouseClip(picks[role] ?? "")),
    houseDelta: delta.filter((role) => isHouseClip(picks[role] ?? "")),
    picks
  };
}
function bakeEmbers(assets, clips) {
  const plan = bakePlan(assets, clips);
  if (plan.delta.length === 0) return 0;
  return (isRigged(assets) ? 0 : EMBER_PRICES.rig) + bakePrice(plan.providerDelta.length);
}
function isRigged(assets) {
  return typeof assets.rigTask === "string" && typeof assets.rigged === "string";
}
function legacyModelTask(assets) {
  if (!Array.isArray(assets.provenance)) return null;
  const entry = assets.provenance[1];
  return typeof entry?.taskId === "string" ? entry.taskId : null;
}
function startAnimate(deps, req) {
  const now = deps.now ?? Date.now;
  if (deps.storage.runningJobFor(req.forgedId)) {
    return { ok: false, error: "this champion is already being built" };
  }
  const assets = deps.storage.forgedAssets(req.forgedId) ?? {};
  if (typeof assets.model !== "string") {
    return { ok: false, error: "build the 3D model first: the animations bake onto it" };
  }
  const modelTask = typeof assets.modelTask === "string" ? assets.modelTask : legacyModelTask(assets);
  if (!isRigged(assets) && !modelTask) {
    return { ok: false, error: "this model kept no build task to rig; rebuild the model first" };
  }
  const price = bakeEmbers(assets, req.clips);
  const held2 = deps.storage.creditBalance(req.accountId);
  if (held2 < price) return { ok: false, error: shortfall(price, held2) };
  const at = now();
  if (price > 0) {
    deps.storage.addCreditEntry({
      accountId: req.accountId,
      delta: -price,
      reason: "spend",
      ref: req.forgedId,
      at
    });
  }
  const jobId = deps.storage.createGenerationJob(req.forgedId, req.accountId, at, "animate", price);
  const done = runAnimate(deps, jobId, req, modelTask).catch((err) => {
    console.error("animate job crashed outside its own handling", err);
  });
  return { ok: true, jobId, done };
}
async function runAnimate(deps, jobId, req, modelTask) {
  const now = deps.now ?? Date.now;
  const stage = (name) => {
    deps.storage.updateGenerationJob(jobId, { stage: name }, now());
  };
  try {
    const before = deps.storage.forgedAssets(req.forgedId) ?? {};
    const { delta, providerDelta, houseDelta, picks } = bakePlan(before, req.clips);
    const prevFiles = before.clipFiles ?? {};
    let rigTask = typeof before.rigTask === "string" ? before.rigTask : null;
    let riggedPath = typeof before.rigged === "string" ? before.rigged : null;
    let rigProvenance = null;
    if (delta.length > 0 && (rigTask === null || riggedPath === null)) {
      if (!modelTask) throw new GenerationError("this model kept no build task to rig");
      stage("rig");
      const rigged = await deps.provider.rig({ modelTaskId: modelTask, rigType: "biped" });
      noteSpend(deps, req.accountId, "animate", "rig", rigged, now());
      riggedPath = `forged/${req.forgedId}/rigged_${jobId}.glb`;
      await deps.download(rigged.url, import_node_path3.default.join(deps.assetsDir, riggedPath));
      checkBudget(deps, riggedPath, deps.budgets?.modelKb);
      rigTask = rigged.taskId;
      rigProvenance = rigged.provenance;
    }
    let clipsPath = null;
    let bakeProvenance = null;
    if (providerDelta.length > 0 && rigTask !== null) {
      stage("animate");
      const animations = [...new Set(providerDelta.map((role) => picks[role] ?? ""))].filter(
        (id) => id !== ""
      );
      const baked = await deps.provider.animate({
        riggedTaskId: rigTask,
        animations,
        withGeometry: false
      });
      noteSpend(deps, req.accountId, "animate", "retarget", baked, now());
      stage("download");
      clipsPath = `forged/${req.forgedId}/clips_${jobId}.glb`;
      await deps.download(baked.url, import_node_path3.default.join(deps.assetsDir, clipsPath));
      checkBudget(deps, clipsPath, deps.budgets?.modelKb);
      bakeProvenance = baked.provenance;
    }
    const houseFiles = {};
    if (houseDelta.length > 0) {
      if (!deps.publicDir) {
        throw new GenerationError("house clips are not available on this server");
      }
      const copy = deps.copyFile ?? import_node_fs3.copyFileSync;
      for (const role of houseDelta) {
        const src = houseClipFile(picks[role] ?? "");
        if (!src) throw new GenerationError(`unknown house clip: ${picks[role]}`);
        const dest = `forged/${req.forgedId}/house_${jobId}_${role}.glb`;
        (0, import_node_fs3.mkdirSync)(import_node_path3.default.dirname(import_node_path3.default.join(deps.assetsDir, dest)), { recursive: true });
        copy(import_node_path3.default.join(deps.publicDir, src), import_node_path3.default.join(deps.assetsDir, dest));
        houseFiles[role] = dest;
      }
    }
    const assets = deps.storage.forgedAssets(req.forgedId) ?? {};
    const clipFiles = { ...prevFiles };
    if (clipsPath !== null) {
      for (const role of providerDelta) clipFiles[role] = clipsPath;
    }
    for (const role of houseDelta) {
      const dest = houseFiles[role];
      if (dest !== void 0) clipFiles[role] = dest;
    }
    const splash = deps.storage.chosenArt(req.forgedId, "splash");
    const icons = {};
    for (const key of ["Q", "W", "E", "R"]) {
      const pick2 = deps.storage.chosenArt(req.forgedId, `icon_${key}`);
      if (pick2) icons[key] = pick2.path;
    }
    const provenance = Array.isArray(assets.provenance) ? assets.provenance : [];
    deps.storage.updateForgedAssets(
      req.forgedId,
      {
        ...assets,
        ...rigTask !== null && riggedPath !== null ? { rigTask, rigged: riggedPath } : {},
        family: req.family,
        // The exact pick per role: the renderer plays THESE, no guessing.
        clips: req.clips,
        clipFiles,
        ...splash ? { splash: splash.path } : {},
        ...Object.keys(icons).length > 0 ? { icons } : {},
        provenance: [...provenance, rigProvenance, bakeProvenance].filter(
          (p) => p !== null && p !== void 0
        )
      },
      now()
    );
    deps.storage.updateGenerationJob(jobId, { status: "success", stage: "done" }, now());
  } catch (err) {
    const blocked = err instanceof GenerationError && err.blocked;
    const message = err instanceof Error ? err.message : String(err);
    deps.storage.updateGenerationJob(
      jobId,
      { status: "failed", error: blocked ? `blocked: ${message}` : message },
      now()
    );
    refund(
      deps.storage,
      req.accountId,
      req.forgedId,
      deps.storage.getGenerationJob(jobId)?.embers ?? 0,
      now()
    );
  }
}
function startWeaponForge(deps, req) {
  const now = deps.now ?? Date.now;
  if (deps.storage.runningJobFor(req.forgedId)) {
    return { ok: false, error: "this champion is already being built" };
  }
  const art = deps.storage.chosenArt(req.forgedId, "weapon");
  if (!art) {
    return { ok: false, error: "generate and pick a weapon image first" };
  }
  const price = EMBER_PRICES.weapon;
  const held2 = deps.storage.creditBalance(req.accountId);
  if (held2 < price) return { ok: false, error: shortfall(price, held2) };
  const at = now();
  deps.storage.addCreditEntry({
    accountId: req.accountId,
    delta: -price,
    reason: "spend",
    ref: req.forgedId,
    at
  });
  const jobId = deps.storage.createGenerationJob(req.forgedId, req.accountId, at, "weapon", price);
  const done = runWeaponForge(deps, jobId, req.forgedId, req.accountId, art.path).catch((err) => {
    console.error("weapon forge job crashed outside its own handling", err);
  });
  return { ok: true, jobId, done };
}
async function runWeaponForge(deps, jobId, forgedId, accountId, artPath) {
  const now = deps.now ?? Date.now;
  const stage = (name) => {
    deps.storage.updateGenerationJob(jobId, { stage: name }, now());
  };
  try {
    stage("weapon");
    if (!deps.provider.uploadImage) {
      throw new GenerationError("this provider cannot take the weapon image as input");
    }
    const read = deps.readFile ?? import_node_fs3.readFileSync;
    const token = await deps.provider.uploadImage({
      data: read(import_node_path3.default.join(deps.assetsDir, artPath)),
      name: import_node_path3.default.basename(artPath)
    });
    const weapon = await deps.provider.imageTo3D({ image: token });
    noteSpend(deps, accountId, "generation", "weapon", weapon, now());
    stage("download");
    const weaponPath = `forged/${forgedId}/weapon.glb`;
    await deps.download(weapon.url, import_node_path3.default.join(deps.assetsDir, weaponPath));
    checkBudget(deps, weaponPath, deps.budgets?.modelKb);
    const assets = deps.storage.forgedAssets(forgedId) ?? {};
    const provenance = Array.isArray(assets.provenance) ? assets.provenance : [];
    deps.storage.updateForgedAssets(
      forgedId,
      { ...assets, weapon: weaponPath, provenance: [...provenance, weapon.provenance] },
      now()
    );
    deps.storage.updateGenerationJob(jobId, { status: "success", stage: "done" }, now());
  } catch (err) {
    const blocked = err instanceof GenerationError && err.blocked;
    const message = err instanceof Error ? err.message : String(err);
    deps.storage.updateGenerationJob(
      jobId,
      { status: "failed", error: blocked ? `blocked: ${message}` : message },
      now()
    );
    refund(
      deps.storage,
      accountId,
      forgedId,
      deps.storage.getGenerationJob(jobId)?.embers ?? 0,
      now()
    );
  }
}
function checkBudget(deps, rel, limitKb) {
  if (!limitKb || limitKb <= 0) return;
  const size = deps.fileSize ?? ((p) => statOrZero(p));
  const kb = size(import_node_path3.default.join(deps.assetsDir, rel)) / 1024;
  if (kb > limitKb) {
    throw new GenerationError(`${rel} is ${Math.round(kb)} KB, over the ${limitKb} KB budget`);
  }
}
function statOrZero(absPath) {
  try {
    return (0, import_node_fs3.statSync)(absPath).size;
  } catch {
    return 0;
  }
}
function refund(storage, accountId, forgedId, embers, at) {
  const back = embers ?? CREATION_IN_EMBERS;
  if (back <= 0) return;
  storage.addCreditEntry({ accountId, delta: back, reason: "refund", ref: forgedId, at });
}
function recoverStaleJobs(storage, now = Date.now) {
  const stale = storage.staleRunningJobs();
  for (const job of stale) {
    storage.updateGenerationJob(
      job.id,
      { status: "failed", error: "the server restarted mid-generation" },
      now()
    );
    if (job.embers !== null || job.kind === "build" || job.kind === null) {
      refund(storage, job.accountId, job.forgedId, job.embers, now());
    }
  }
  return stale.length;
}
async function downloadToFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new GenerationError(`asset download failed: ${res.status}`);
  (0, import_node_fs3.mkdirSync)(import_node_path3.default.dirname(dest), { recursive: true });
  (0, import_node_fs3.writeFileSync)(dest, Buffer.from(await res.arrayBuffer()));
}

// server/icon_phrase.ts
var DELIVERY = {
  skillshot: "a flying projectile",
  zone: "a lingering ground area",
  self_or_ally: "a protective cast",
  enemy_target: "a direct strike at one enemy",
  cone: "a sweeping cone blast",
  burst: "a blast around the caster",
  dash: "a swift dash",
  wall: "a conjured wall that blocks the path"
};
var EFFECT_WORDS = [
  { kind: "damage", word: "damage" },
  { kind: "dot", word: "lingering damage over time" },
  { kind: "heal", word: "healing" },
  { kind: "shield", word: "a shield" },
  { kind: "stun", word: "a stun" },
  { kind: "root", word: "rooting in place" },
  { kind: "knockup", word: "a launch into the air" },
  { kind: "knockback", word: "a shove backward" },
  { kind: "pull", word: "a pull inward" },
  { kind: "taunt", word: "a taunt" },
  { kind: "slow", word: "a chilling slow" },
  { kind: "blind", word: "blinding" },
  { kind: "stealth", word: "vanishing from sight" },
  { kind: "untargetable", word: "untouchability" },
  { kind: "grievous", word: "wound-deepening" },
  { kind: "buff", word: "empowerment" },
  { kind: "mark", word: "a mark that detonates" },
  { kind: "empower", word: "an empowered next blow" }
];
function effectLists(spec) {
  switch (spec.kind) {
    case "skillshot":
      return [spec.onHit, spec.allyEffects];
    case "zone":
      return [spec.onEnter, spec.onTick, spec.onDetonate, spec.allyOnTick];
    case "self_or_ally":
      return [spec.effects];
    case "enemy_target":
      return [spec.effects, spec.selfEffects];
    case "cone":
      return [spec.onHit];
    case "burst":
      return [spec.effects, spec.selfEffects];
    case "dash":
      return [spec.onLand, spec.selfEffects, spec.passThrough];
    case "wall":
      return [];
  }
}
function joinAnd(parts) {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
function iconPhrase(def) {
  const spec = def.spec;
  const kinds = /* @__PURE__ */ new Set();
  const dtypes = /* @__PURE__ */ new Set();
  for (const list of effectLists(spec)) {
    for (const e of list ?? []) {
      kinds.add(e.kind);
      if (e.kind === "damage") dtypes.add(e.dtype);
    }
  }
  const words = [];
  for (const { kind, word } of EFFECT_WORDS) {
    if (!kinds.has(kind)) continue;
    if (kind === "damage") {
      const flavored = dtypes.has("magic") ? "magic damage" : "physical damage";
      words.push(flavored);
    } else {
      words.push(word);
    }
    if (words.length === 3) break;
  }
  const delivery = DELIVERY[spec.kind];
  return words.length === 0 ? delivery : `${delivery} that brings ${joinAnd(words)}`;
}

// server/quotas.ts
var DAY_MS3 = 24 * 60 * 60 * 1e3;
var CEILING_DEFAULTS = {
  generation: 60,
  animate: 200,
  gen2d: 400,
  agent: 400
};
function quotaCeiling(deps, action) {
  return deps.ceilings?.[action] ?? CEILING_DEFAULTS[action];
}
function checkQuota(deps, action) {
  const ceiling = quotaCeiling(deps, action);
  if (ceiling <= 0) return { ok: true };
  const at = (deps.now ?? Date.now)();
  if (deps.store.quotaCountAllSince(action, at - DAY_MS3) >= ceiling) {
    return { ok: false, error: "the server has spent its day on this; it opens again tomorrow" };
  }
  return { ok: true };
}
function spendQuota(deps, accountId, action) {
  deps.store.addQuotaEvent(accountId, action, (deps.now ?? Date.now)());
}

// server/word_filter.ts
var SUBSTRING_TERMS = [
  "nigger",
  "nigga",
  "faggot",
  "kike",
  "spic",
  "wetback",
  "chink",
  "tranny",
  "raghead",
  "porchmonkey"
];
var WORD_TERMS = [
  "fuck",
  "fucker",
  "motherfucker",
  "shit",
  "bitch",
  "cunt",
  "whore",
  "slut",
  "rape",
  "rapist",
  "nazi",
  "hitler",
  "retard",
  "fag",
  "dyke",
  "coon",
  "penis",
  "vagina",
  "dick",
  "cock",
  "anal",
  "cum"
];
var LEET = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  $: "s",
  "!": "i"
};
function squeeze(text2) {
  let out = "";
  for (const ch of text2.toLowerCase()) {
    const folded = LEET[ch] ?? ch;
    if (/[a-z]/.test(folded)) out += folded;
  }
  return out;
}
function findBlockedWord(texts) {
  for (const text2 of texts) {
    const squeezedAll = squeeze(text2);
    for (const term of SUBSTRING_TERMS) {
      if (squeezedAll.includes(term)) return term;
    }
    const tokens2 = new Set(text2.split(/\s+/).map(squeeze));
    for (const term of WORD_TERMS) {
      if (tokens2.has(term)) return term;
    }
  }
  return null;
}

// server/art.ts
var ART_KINDS = [
  "splash",
  "sheet",
  "weapon",
  "icon_Q",
  "icon_W",
  "icon_E",
  "icon_R"
];
var ART_HISTORY_CAP = 12;
var ART_LINE_MAX = 400;
var SPLASH_STYLE = "Stylized painted fantasy splash art portrait, 3:4, bold readable silhouette, dramatic rim light, dark moody backdrop with one dominant accent color as atmospheric glow, painterly brushwork, high contrast, game character card art, no text, no watermark.";
var SHEET_STYLE = "One single character, exactly one figure, centered, full body from head to feet, front view, standing A-pose with arms slightly out, empty hands, plain light gray background, even neutral lighting, no other views, no duplicates, no props, no text, no watermark.";
var WEAPON_STYLE = "Only the weapon: extract the exact weapon this character holds and show it completely alone, centered, at a three-quarter angle, floating on a plain light gray background, the whole weapon visible from grip to tip, no hands, no character, no other objects, no text, no watermark.";
var ICON_STYLE = "Flat game ability icon, one bold centered emblem, simple geometric shapes, strong silhouette, dark rounded-square background, single accent color, crisp edges, high contrast, readable at 32 pixels, no text, no letters, no watermark.";
function isArtKind(kind) {
  return ART_KINDS.includes(kind);
}
function weaponStillOpen(store, row, kind) {
  if (kind !== "weapon") return false;
  const assets = store.forgedAssets(row.id);
  return !assets?.weapon;
}
function cleanLine(line) {
  return line.replace(/\s+/g, " ").trim().slice(0, ART_LINE_MAX);
}
var SHEET_MATCH = "Exactly the same character as the input image: same face, same outfit, same colors, same materials.";
var SPLASH_LINE_MARKER = " The champion: ";
function splashLine(prompt) {
  const i = prompt.indexOf(SPLASH_LINE_MARKER);
  return i === -1 ? "" : prompt.slice(i + SPLASH_LINE_MARKER.length).trim();
}
function iterationPrompt(sourcePrompt, note) {
  return note === "" ? sourcePrompt : `${sourcePrompt} Adjustment: ${note}.`;
}
var EDIT_KEEP = "Keep everything else exactly the same: same character, same face, same outfit, same colors, same style, same composition.";
function editInstruction(note) {
  return note === "" ? "Create a close variation of this image. Same character, same outfit, same colors, same style." : `${note}. ${EDIT_KEEP}`;
}
function artPrompt(kind, row, line, appearance = "") {
  if (kind === "splash") return `${SPLASH_STYLE} The champion: ${line}`;
  if (kind === "sheet") {
    const identity = [row.def.name, row.def.title].filter((s) => s.trim() !== "").join(", ");
    const looks = appearance === "" ? "" : ` Appearance: ${appearance}.`;
    const detail2 = line === "" ? "" : ` ${line}.`;
    return `${SHEET_STYLE} The character: ${identity}, a ${row.def.role.toLowerCase()} champion.${looks}${detail2} ${SHEET_MATCH}`;
  }
  if (kind === "weapon") {
    const detail2 = line === "" ? "" : ` ${line}.`;
    return `${WEAPON_STYLE}${detail2} Exactly the same weapon as in the input image: same shape, same materials, same colors.`;
  }
  const key = kind.slice("icon_".length);
  const ability = row.def.abilities[key];
  const detail = line === "" ? "" : `, ${line}`;
  return `${ICON_STYLE} The ability: ${ability.name}, ${iconPhrase(ability)}${detail}.`;
}
function listArt(deps, accountId, id) {
  const row = deps.store.getForged(id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  return {
    ok: true,
    candidates: deps.store.listArtCandidates(id).map((c) => ({ cid: c.id, kind: c.kind, path: c.path, chosen: c.chosen, at: c.at })),
    price: EMBER_PRICES.image,
    embers: deps.store.creditBalance(accountId)
  };
}
async function generateArt(deps, accountId, req) {
  if (!deps.generation) {
    return { ok: false, error: "generation is not configured on this server yet" };
  }
  if (!isArtKind(req.kind)) return { ok: false, error: "unknown art kind" };
  const row = deps.store.getForged(req.id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  if (row.status !== "draft" && !weaponStillOpen(deps.store, row, req.kind)) {
    return {
      ok: false,
      error: "a finalized champion is sealed, art included (Reforge comes later)"
    };
  }
  const line = cleanLine(req.line);
  if (req.kind === "splash" && line === "" && req.fromCid === void 0) {
    return { ok: false, error: "describe the champion: the splash starts from your words" };
  }
  const blocked = findBlockedWord([line]);
  if (blocked !== null) {
    return { ok: false, error: `pick different words: '${blocked}' cannot go in a prompt` };
  }
  let sourcePath = null;
  let prompt;
  if (req.fromCid !== void 0) {
    const from = deps.store.getArtCandidate(req.fromCid);
    if (!from || from.forgedId !== row.id || from.kind !== req.kind) {
      return { ok: false, error: "no such candidate to iterate from" };
    }
    sourcePath = from.path;
    prompt = deps.generation.provider.editsImages ? editInstruction(line) : iterationPrompt(from.prompt, line);
  } else if (req.kind === "sheet" || req.kind === "weapon") {
    const splash = deps.store.chosenArt(row.id, "splash");
    if (!splash) {
      const what = req.kind === "sheet" ? "model reference" : "weapon";
      return { ok: false, error: `pick a splash first: the ${what} derives from it` };
    }
    sourcePath = splash.path;
    prompt = artPrompt(req.kind, row, line, splashLine(splash.prompt));
  } else {
    prompt = artPrompt(req.kind, row, line);
  }
  if (sourcePath !== null && !deps.generation.provider.uploadImage) {
    return { ok: false, error: "this provider cannot start from an image" };
  }
  const quota = checkQuota(deps.quota, "gen2d");
  if (!quota.ok) return quota;
  const price = deps.generation.imagePrice ?? EMBER_PRICES.image;
  const held2 = deps.store.creditBalance(accountId);
  if (held2 < price) return { ok: false, error: shortfall(price, held2) };
  let asset;
  try {
    let image;
    if (sourcePath !== null && deps.generation.provider.uploadImage) {
      const read = deps.generation.readFile ?? import_node_fs4.readFileSync;
      image = await deps.generation.provider.uploadImage({
        data: read(import_node_path4.default.join(deps.generation.assetsDir, sourcePath)),
        name: import_node_path4.default.basename(sourcePath)
      });
    }
    asset = await deps.generation.provider.generate2D({
      prompt,
      ...image !== void 0 ? { image } : {},
      // The model reference wants a rig-ready standing pose; providers
      // that know the flag keep the look and fix the stance.
      ...req.kind === "sheet" ? { tPose: true } : {}
    });
  } catch (err) {
    const blockedGen = err instanceof GenerationError && err.blocked;
    return {
      ok: false,
      error: blockedGen ? "the provider refused this content; rephrase and try again" : "generation failed; nothing was counted against your quota"
    };
  }
  const rel = `forged/${row.id}/art/${req.kind}_${asset.taskId}.png`;
  try {
    await deps.generation.download(asset.url, import_node_path4.default.join(deps.generation.assetsDir, rel));
  } catch {
    return { ok: false, error: "the image could not be saved; nothing was counted" };
  }
  const limitKb = deps.generation.budgets?.imageKb;
  if (limitKb && limitKb > 0) {
    const abs = import_node_path4.default.join(deps.generation.assetsDir, rel);
    if (fileKb(abs) > limitKb) {
      (deps.unlink ?? bestEffortUnlink)(abs);
      return { ok: false, error: "the image came back over the size budget; try again" };
    }
  }
  const at = (deps.now ?? Date.now)();
  const cid = deps.store.addArtCandidate({
    forgedId: row.id,
    accountId,
    kind: req.kind,
    prompt,
    path: rel,
    provenance: asset.provenance,
    at
  });
  if (!deps.store.chosenArt(row.id, req.kind)) {
    deps.store.chooseArtCandidate(row.id, req.kind, cid);
  }
  spendQuota(deps.quota, accountId, "gen2d");
  deps.store.addCreditEntry({
    accountId,
    delta: -price,
    reason: "spend",
    ref: row.id,
    at
  });
  if (typeof asset.cost === "number") {
    deps.store.addSpendSample({
      accountId,
      action: "gen2d",
      detail: "image",
      provider: "tripo",
      credits: asset.cost,
      at
    });
  }
  const cap = deps.historyCap ?? ART_HISTORY_CAP;
  const unlink = deps.unlink ?? bestEffortUnlink;
  for (const stale of deps.store.pruneArtCandidates(row.id, req.kind, cap)) {
    unlink(import_node_path4.default.join(deps.generation.assetsDir, stale));
  }
  const chosen = deps.store.getArtCandidate(cid);
  return {
    ok: true,
    candidate: { cid, kind: req.kind, path: rel, chosen: chosen?.chosen ?? false, at },
    price: EMBER_PRICES.image,
    // The balance after the debit: the number the creator watches move.
    embers: deps.store.creditBalance(accountId)
  };
}
function chooseArt(deps, accountId, req) {
  const row = deps.store.getForged(req.id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  const candidate = deps.store.getArtCandidate(req.cid);
  if (!candidate || candidate.forgedId !== row.id) {
    return { ok: false, error: "no such candidate on this champion" };
  }
  if (row.status !== "draft" && !weaponStillOpen(deps.store, row, candidate.kind)) {
    return {
      ok: false,
      error: "a finalized champion is sealed, art included (Reforge comes later)"
    };
  }
  deps.store.chooseArtCandidate(row.id, candidate.kind, candidate.id);
  return { ok: true };
}
function deleteArtFor(deps, id) {
  const unlink = deps.unlink ?? bestEffortUnlink;
  for (const rel of deps.store.deleteArtCandidates(id)) {
    if (deps.generation) unlink(import_node_path4.default.join(deps.generation.assetsDir, rel));
  }
}
function splashOf(store, row) {
  if (row.status === "finalized") {
    const assets = store.forgedAssets(row.id);
    if (assets?.splash) return assets.splash;
  }
  return store.chosenArt(row.id, "splash")?.path ?? null;
}
function chosenIcons(store, id) {
  const icons = {};
  for (const key of ["Q", "W", "E", "R"]) {
    const pick2 = store.chosenArt(id, `icon_${key}`);
    if (pick2) icons[key] = pick2.path;
  }
  return icons;
}
function iconsOf(store, id) {
  const chosen = chosenIcons(store, id);
  if (Object.keys(chosen).length > 0) return chosen;
  const assets = store.forgedAssets(id);
  const sealed = assets?.icons;
  if (typeof sealed !== "object" || sealed === null) return {};
  const out = {};
  for (const [key, rel] of Object.entries(sealed)) {
    if (typeof rel === "string") out[key] = rel;
  }
  return out;
}
function bestEffortUnlink(absPath) {
  try {
    (0, import_node_fs4.unlinkSync)(absPath);
  } catch {
  }
}
function fileKb(absPath) {
  try {
    return (0, import_node_fs4.statSync)(absPath).size / 1024;
  } catch {
    return -1;
  }
}

// server/bots.ts
var import_node_crypto3 = require("node:crypto");

// src/sim/content/playbooks/new_bot.ts
var COACH_PLAY_ID = "coach";
var NEW_BOT_PLAYBOOK = {
  version: LANER_PLAYBOOK.version,
  plays: LANER_PLAYBOOK.plays.flatMap(
    (p) => p.id === "retreat" ? [
      p,
      {
        id: COACH_PLAY_ID,
        when: { kind: "order" },
        do: { kind: "obeyOrder" }
      }
    ] : [p]
  )
};

// server/bots.ts
var BOT_CAP = 100;
var DEPOSIT_CAP = 3;
var PLAYBOOK_JSON_MAX = 32e3;
var BOT_NAME_MAX = 24;
var BOT_ID_PATTERN = /^bot_[a-f0-9]{16}$/;
function isRecord3(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function checkName(deps, accountId, raw, exceptId) {
  if (typeof raw !== "string") return { ok: false, error: "a bot needs a name" };
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length === 0 || name.length > BOT_NAME_MAX) {
    return { ok: false, error: `a bot name is 1 to ${BOT_NAME_MAX} characters` };
  }
  if (/[\p{C}]/u.test(name)) return { ok: false, error: "a bot name is plain text" };
  const blocked = findBlockedWord([name]);
  if (blocked !== null) {
    return { ok: false, error: `pick a different name: '${blocked}' cannot be on a card` };
  }
  const folded = name.toLowerCase();
  for (const other of deps.store.listByAccount(accountId)) {
    if (other.id !== exceptId && other.name.toLowerCase() === folded) {
      return { ok: false, error: "you already have a bot with that name" };
    }
  }
  return { ok: true, name };
}
function checkSigils(raw) {
  if (!Array.isArray(raw) || raw.length !== 2)
    return { ok: false, error: "a bot picks two sigils" };
  const [a, b] = raw;
  if (typeof a !== "string" || typeof b !== "string" || !SIGILS[a] || !SIGILS[b] || a === b) {
    return { ok: false, error: "a bot picks two different sigils from the pool" };
  }
  return { ok: true, sigils: [a, b] };
}
function checkPlaybook(raw) {
  if (JSON.stringify(raw).length > PLAYBOOK_JSON_MAX) {
    return { ok: false, error: "this playbook is too large to store" };
  }
  const v = validatePlaybook(raw);
  if (!v.ok) return { ok: false, error: `playbook rejected: ${v.errors.slice(0, 5).join("; ")}` };
  return { ok: true, def: v.def };
}
function newBotId(deps) {
  return deps.newId ? deps.newId() : `bot_${(0, import_node_crypto3.randomBytes)(8).toString("hex")}`;
}
function owned(deps, accountId, id) {
  if (typeof id !== "string" || !BOT_ID_PATTERN.test(id)) {
    return { ok: false, error: "malformed bot id" };
  }
  const bot = deps.store.getBot(id);
  if (!bot || bot.accountId !== accountId)
    return { ok: false, error: "no such bot on this account" };
  return { ok: true, bot };
}
function listBots(deps, accountId) {
  return {
    ok: true,
    bots: deps.store.listByAccount(accountId).map((b) => ({ ...b, tally: deps.store.ratedTally(b.id) }))
  };
}
function createBot(deps, accountId, input) {
  if (!isRecord3(input)) return { ok: false, error: "malformed request" };
  const name = checkName(deps, accountId, input.name, null);
  if (!name.ok) return name;
  const championId = input.championId;
  if (typeof championId !== "string" || !CHAMPIONS[championId]) {
    return { ok: false, error: "a bot plays a roster champion" };
  }
  const collection = deps.collectionOf?.(accountId);
  if (collection && !collection.includes(championId)) {
    return { ok: false, error: "a bot plays a champion in your collection" };
  }
  const sigils = checkSigils(input.sigils ?? ["riftstep", "mend"]);
  if (!sigils.ok) return sigils;
  const cap = deps.botCap ?? BOT_CAP;
  if (deps.store.countByAccount(accountId) >= cap) {
    return { ok: false, error: `bot cap reached (${cap}); delete one first` };
  }
  const at = (deps.now ?? Date.now)();
  const bot = {
    id: newBotId(deps),
    accountId,
    name: name.name,
    championId,
    sigils: sigils.sigils,
    skin: clampSkin(championId, input.skin),
    playbook: NEW_BOT_PLAYBOOK,
    version: 1,
    deposited: false,
    autoApply: false,
    openPlaybook: false,
    createdAt: at,
    updatedAt: at
  };
  deps.store.insertBot(bot);
  deps.store.addVersion({ botId: bot.id, version: 1, playbook: bot.playbook, author: "owner", at });
  return { ok: true, bot };
}
function saveBot(deps, accountId, input) {
  if (!isRecord3(input)) return { ok: false, error: "malformed request" };
  const found = owned(deps, accountId, input.id);
  if (!found.ok) return found;
  const bot = found.bot;
  let name = bot.name;
  if (input.name !== void 0) {
    const checked = checkName(deps, accountId, input.name, bot.id);
    if (!checked.ok) return checked;
    name = checked.name;
  }
  let sigils = bot.sigils;
  if (input.sigils !== void 0) {
    const checked = checkSigils(input.sigils);
    if (!checked.ok) return checked;
    sigils = checked.sigils;
  }
  const skin = input.skin !== void 0 ? clampSkin(bot.championId, input.skin) : bot.skin;
  let playbook = bot.playbook;
  let version = bot.version;
  const at = (deps.now ?? Date.now)();
  if (input.playbook !== void 0) {
    const checked = checkPlaybook(input.playbook);
    if (!checked.ok) return checked;
    if (JSON.stringify(checked.def) !== JSON.stringify(bot.playbook)) {
      playbook = checked.def;
      version = bot.version + 1;
      deps.store.addVersion({ botId: bot.id, version, playbook, author: "owner", at });
    }
  }
  deps.store.updateBot(bot.id, { name, sigils, skin, playbook, version, updatedAt: at });
  return { ok: true, bot: { ...bot, name, sigils, skin, playbook, version, updatedAt: at } };
}
function deleteBot(deps, accountId, id) {
  const found = owned(deps, accountId, id);
  if (!found.ok) return found;
  deps.store.deleteRecordsOf(found.bot.id);
  deps.store.deleteBot(found.bot.id);
  return { ok: true };
}
function setDeposited(deps, accountId, id, on) {
  if (typeof on !== "boolean") return { ok: false, error: "malformed request" };
  const found = owned(deps, accountId, id);
  if (!found.ok) return found;
  const bot = found.bot;
  if (on && !bot.deposited) {
    const cap = deps.depositCap ?? DEPOSIT_CAP;
    if (deps.store.depositedCount(accountId) >= cap) {
      return { ok: false, error: `at most ${cap} bots in the Arena at once; withdraw one first` };
    }
  }
  deps.store.setDeposited(bot.id, on);
  return { ok: true, bot: { ...bot, deposited: on } };
}
function setOpenPlaybook(deps, accountId, id, on) {
  if (typeof on !== "boolean") return { ok: false, error: "malformed request" };
  const found = owned(deps, accountId, id);
  if (!found.ok) return found;
  deps.store.setOpenPlaybook(found.bot.id, on);
  return { ok: true, bot: { ...found.bot, openPlaybook: on } };
}
function setAutoApply(deps, accountId, id, on) {
  if (typeof on !== "boolean") return { ok: false, error: "malformed request" };
  const found = owned(deps, accountId, id);
  if (!found.ok) return found;
  deps.store.setAutoApply(found.bot.id, on);
  return { ok: true, bot: { ...found.bot, autoApply: on } };
}
function ownedBot(deps, accountId, id) {
  return owned(deps, accountId, id);
}
function listVersions(deps, accountId, id) {
  const found = owned(deps, accountId, id);
  if (!found.ok) return found;
  return { ok: true, versions: deps.store.listVersions(found.bot.id) };
}
function getVersion(deps, accountId, id, version) {
  const found = owned(deps, accountId, id);
  if (!found.ok) return found;
  if (typeof version !== "number" || !Number.isInteger(version)) {
    return { ok: false, error: "malformed request" };
  }
  const row = deps.store.getVersion(found.bot.id, version);
  if (!row) return { ok: false, error: "no such version" };
  return {
    ok: true,
    version: { version, author: row.author, at: row.at, playbook: row.playbook }
  };
}
function revertBot(deps, accountId, id, version) {
  const found = owned(deps, accountId, id);
  if (!found.ok) return found;
  const bot = found.bot;
  if (typeof version !== "number" || !Number.isInteger(version)) {
    return { ok: false, error: "malformed request" };
  }
  const target = deps.store.getVersion(bot.id, version);
  if (!target) return { ok: false, error: "no such version" };
  const checked = checkPlaybook(target.playbook);
  if (!checked.ok) return checked;
  const at = (deps.now ?? Date.now)();
  const next = bot.version + 1;
  deps.store.addVersion({
    botId: bot.id,
    version: next,
    playbook: checked.def,
    author: `revert:${version}`,
    at
  });
  deps.store.updateBot(bot.id, {
    name: bot.name,
    sigils: bot.sigils,
    skin: bot.skin,
    playbook: checked.def,
    version: next,
    updatedAt: at
  });
  return { ok: true, bot: { ...bot, playbook: checked.def, version: next, updatedAt: at } };
}

// server/suggest.ts
var import_node_fs5 = require("node:fs");
var import_node_path5 = __toESM(require("node:path"), 1);

// src/sim/forge/spell_power.ts
var POWER_DIAL_MIN = 0.25;
var POWER_DIAL_MAX = 2.5;
var EFFECT_AMOUNTS = {
  damage: ["base", "adRatio", "apRatio", "maxHpPct"],
  heal: ["base", "apRatio", "maxHpPct"],
  dot: ["perSecond"],
  slow: ["pct"],
  root: ["duration"],
  stun: ["duration"],
  taunt: ["duration"],
  knockup: ["duration"],
  knockback: ["distance"],
  pull: ["distance"],
  blind: ["factor"],
  stealth: ["duration"],
  untargetable: ["duration"],
  shield: ["base", "apRatio"],
  grievous: ["factor"],
  buff: ["msPct", "asPct", "armor", "mr"],
  cooldownRefund: ["pctOfRemaining"]
};
function clampTo(bound, v) {
  if (!bound) return v;
  return Math.min(bound.max, Math.max(bound.min, v));
}
var STEP_WHOLE = 1;
var STEP_RATIO = 0.01;
var STEP_TIME = 0.05;
var STEP_DISTANCE = 0.1;
var AMOUNT_STEPS = {
  base: STEP_WHOLE,
  perSecond: STEP_WHOLE,
  armor: STEP_WHOLE,
  mr: STEP_WHOLE,
  adRatio: STEP_RATIO,
  apRatio: STEP_RATIO,
  maxHpPct: STEP_RATIO,
  pct: STEP_RATIO,
  factor: STEP_RATIO,
  msPct: STEP_RATIO,
  asPct: STEP_RATIO,
  pctOfRemaining: STEP_RATIO,
  duration: STEP_TIME,
  distance: STEP_DISTANCE
};
var stepOf = (field) => AMOUNT_STEPS[field] ?? STEP_RATIO;
function snapAmount(field, v) {
  const step = stepOf(field);
  let decimals = 0;
  for (let s = step; s < 1; s *= 10) decimals++;
  return Number((Math.round(v / step + 1e-9) * step).toFixed(decimals));
}
function mapEffects(list, fn) {
  for (const e of list ?? []) {
    const fields = EFFECT_AMOUNTS[e.kind] ?? [];
    const bounds = EFFECT_BOUNDS[e.kind] ?? {};
    const rec = e;
    for (const field of fields) {
      const v = rec[field];
      if (typeof v === "number") rec[field] = fn(field, v, bounds[field]);
    }
    if (e.kind === "mark") mapEffects(e.onTrigger, fn);
    if (e.kind === "conditional") {
      mapEffects(e.effects, fn);
      mapEffects(e.otherwise, fn);
    }
    if (e.kind === "empower") {
      mapEffects(e.bonus, fn);
      mapEffects(e.splash, fn);
    }
    if (e.kind === "shield" && e.burst) {
      mapEffects(e.burst.onBreak, fn);
      mapEffects(e.burst.onExpire, fn);
    }
  }
}
function mapSpec(spec, fn) {
  switch (spec.kind) {
    case "skillshot":
      mapEffects(spec.onHit, fn);
      mapEffects(spec.allyEffects, fn);
      if (spec.chain) mapEffects(spec.chain.onHit, fn);
      if (spec.aftershock) mapEffects(spec.aftershock.effects, fn);
      break;
    case "zone":
      mapEffects(spec.onEnter, fn);
      mapEffects(spec.onTick, fn);
      mapEffects(spec.allyOnTick, fn);
      mapEffects(spec.onDetonate, fn);
      if (spec.boundary) mapEffects(spec.boundary.effects, fn);
      if (spec.leaveZone) mapEffects(spec.leaveZone.onTick, fn);
      break;
    case "self_or_ally":
      mapEffects(spec.effects, fn);
      break;
    case "enemy_target":
      mapEffects(spec.effects, fn);
      mapEffects(spec.selfEffects, fn);
      break;
    case "cone":
      mapEffects(spec.onHit, fn);
      break;
    case "burst":
      mapEffects(spec.effects, fn);
      mapEffects(spec.selfEffects, fn);
      break;
    case "dash":
      mapEffects(spec.onLand, fn);
      mapEffects(spec.selfEffects, fn);
      mapEffects(spec.passThrough, fn);
      break;
    case "wall":
      spec.duration = fn(
        "duration",
        spec.duration,
        CAST_BOUNDS.wall?.duration
      );
      break;
  }
}
function mapAbility(ability, fn) {
  mapSpec(ability.spec, fn);
  for (const o of ability.atRank ?? []) mapSpec(o.spec, fn);
}
var scaledBy = (factor) => (field, v, bound) => clampTo(bound, snapAmount(field, v * factor));
function scaleAbility(anchor, factor) {
  const out = structuredClone(anchor);
  mapAbility(out, scaledBy(factor));
  return out;
}
function kitFits(def, abilities) {
  const d = { ...def, abilities };
  return kitSpendOf(budgetOf(d)) <= KIT_ENVELOPE && burstVerdict(d).ok;
}
var STOP_PROBE = 1e-3;
var KIT_KEYS = ["Q", "W", "E", "R"];
function amountCount(ability) {
  let n = 0;
  mapAbility(structuredClone(ability), (_field, v) => {
    n += 1;
    return v;
  });
  return n;
}
function raisedAt(ability, index) {
  const out = structuredClone(ability);
  let seen2 = 0;
  let raised = false;
  mapAbility(out, (field, v, bound) => {
    const here = seen2;
    seen2 += 1;
    if (here !== index) return v;
    const next = clampTo(bound, snapAmount(field, v + stepOf(field)));
    raised = next > v;
    return next;
  });
  return raised ? out : null;
}
function topUp(def, start) {
  let abilities = start;
  for (const key of KIT_KEYS) {
    const count3 = amountCount(abilities[key]);
    for (let i = 0; i < count3; i += 1) {
      const trial = raisedAt(abilities[key], i);
      if (!trial) continue;
      const next = { ...abilities, [key]: trial };
      if (kitFits(def, next)) abilities = next;
    }
  }
  return abilities;
}
function fitKitPower(def) {
  const anchors = def.abilities;
  let abilities = {
    Q: scaleAbility(anchors.Q, 1),
    W: scaleAbility(anchors.W, 1),
    E: scaleAbility(anchors.E, 1),
    R: scaleAbility(anchors.R, 1)
  };
  const held2 = /* @__PURE__ */ new Set();
  let factor = 1;
  const at = (f, free) => {
    const out = { ...abilities };
    for (const k of free) out[k] = scaleAbility(anchors[k], f);
    return out;
  };
  for (let round3 = 0; round3 < KIT_KEYS.length; round3 += 1) {
    const free = KIT_KEYS.filter((k) => !held2.has(k));
    if (free.length === 0) break;
    let f = POWER_DIAL_MAX;
    if (!kitFits(def, at(POWER_DIAL_MAX, free))) {
      if (!kitFits(def, at(POWER_DIAL_MIN, free))) {
        if (round3 === 0) return null;
        break;
      }
      let lo = POWER_DIAL_MIN;
      let hi = POWER_DIAL_MAX;
      for (let i = 0; i < 32; i += 1) {
        const mid = (lo + hi) / 2;
        if (kitFits(def, at(mid, free))) lo = mid;
        else hi = mid;
      }
      f = lo;
    }
    abilities = at(f, free);
    factor = f;
    if (f >= POWER_DIAL_MAX) break;
    const past = { ...def, abilities: at(f + STOP_PROBE, free) };
    if (kitSpendOf(budgetOf(past)) > KIT_ENVELOPE) break;
    const v = burstVerdict(past);
    let caught = false;
    for (const k of free) {
      if (!v.abilities[k]) {
        held2.add(k);
        caught = true;
      }
    }
    if (!v.basics) {
      for (const k of BASIC_KEYS) held2.add(k);
      caught = true;
    }
    if (!caught) break;
  }
  if (factor < POWER_DIAL_MAX) abilities = topUp(def, abilities);
  return { abilities, factor, held: [...held2] };
}

// server/spend.ts
function usageSample(action, detail, accountId, at, usage) {
  return {
    action,
    detail,
    provider: "anthropic",
    accountId,
    at,
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: usage.cache_creation_input_tokens ?? 0
  };
}
var MODEL_RATES = {
  input: 2 / 1e6,
  output: 10 / 1e6,
  cacheRead: 0.2 / 1e6,
  cacheWrite: 2.5 / 1e6
};

// server/suggest.ts
var SUGGEST_MODEL_DEFAULT = "claude-sonnet-5";
var BUDGET_FLOOR_DEFAULT = 0.85;
var SUGGEST_ATTEMPTS = 3;
var SUGGEST_CALL_TIMEOUT_MS = 12e4;
var CHAT_TURNS_MAX = 20;
var CHAT_USER_TEXT_MAX = 2e3;
var CHAT_RAW_TEXT_MAX = 24e3;
var GRAMMAR = `
An ability is: { "name": string, "flavor": string, "manaCost": n, "cooldown": n,
  "castRange": n, "windup"?: seconds, "spec": CastSpec }.
CastSpec is ONE of:
  { "kind": "skillshot", "speed": n, "radius": n, "range": n, "pierce"?: bool, "onHit": Effect[] }
  { "kind": "zone", "radius": n, "duration": n, "tickEvery"?: n, "onEnter"?: Effect[], "onTick"?: Effect[], "detonateDelay"?: n, "onDetonate"?: Effect[], "reveal"?: bool }
  { "kind": "self_or_ally", "searchRadius": n, "effects": Effect[] }
  { "kind": "enemy_target", "searchRadius": n, "effects": Effect[], "selfEffects"?: Effect[] }
  { "kind": "cone", "range": n, "halfAngle": radians, "onHit": Effect[] }
  { "kind": "burst", "radius": n, "effects": Effect[], "selfEffects"?: Effect[] }
  { "kind": "dash", "range": n, "speed"?: n, "landRadius"?: n, "onLand"?: Effect[], "selfEffects"?: Effect[] }
  { "kind": "wall", "length": n, "duration": n }
Effect is ONE of:
  { "kind": "damage", "base": n, "adRatio"?: n, "apRatio"?: n, "dtype": "physical" | "magic" | "true" }
  { "kind": "heal", "base": n, "apRatio"?: n }
  { "kind": "slow", "pct": 0..1, "duration": n }
  { "kind": "root", "duration": n } | { "kind": "stun", "duration": n }
  { "kind": "knockback", "distance": n } | { "kind": "knockup", "duration": n }
  { "kind": "shield", "base": n, "apRatio"?: n, "duration": n }
  { "kind": "dot", "duration": n, "perSecond": n, "dtype": "physical" | "magic" }
  { "kind": "buff", "duration": n, "msPct"?: 0..1, "asPct"?: 0..1, "armor"?: n, "mr"?: n }
  { "kind": "stealth", "duration": n }
  { "kind": "mark", "duration": n, "stacksToTrigger": int, "onTrigger": Effect[] }
Rules: distances are world units (a lane is ~12 wide, castRange tops out
around 10 for most spells). An INSTANT stun, root, knockup or long
knockback needs "windup" >= 0.35 (the telegraph rule). R is the
ultimate: bigger, longer cooldown.
Text: what players read about a spell is DERIVED from its mechanics by the
game, in the game's own words, the same for every champion; that wording
is not yours to change, so to change what a spell does, change its spec.
What IS yours is "flavor": one short line of story per spell and for the
passive (plain English, at most ${FLAVOR_MAX} characters), the image of the
spell in the champion's world, no numbers; it shows above the derived text.
Give every spell and the passive one, and rewrite it when the creator asks
for a different feel.
`;
function templateCatalog() {
  return PASSIVE_TEMPLATE_LIST.map(
    (t) => `${t.id}: ${t.summary} params: ${t.params.map((p) => `${p.key} ${p.min}..${p.max}${p.integer ? " int" : ""}`).join(", ")}`
  ).join("\n");
}
function costSchedule() {
  return [
    `The passive and the four spells together fit the power budget's kit envelope of ${KIT_ENVELOPE} points; base stats and growth have their own envelopes and never trade with it.`,
    `Effect prices (cost = value * price, durations in seconds): ${JSON.stringify(EFFECT_PRICES)}.`,
    `Delivery prices and multipliers: ${JSON.stringify(CAST_PRICES)}.`,
    `An ability's bill is its delivery cost times ${AVAIL_PIVOT}/(${AVAIL_SOFT}+cooldown),`,
    "relieved up to 20 percent each by mana cost and windup.",
    `Size the amounts roughly: the server then scales every amount (damage, healing, crowd control durations) by one shared factor between ${POWER_DIAL_MIN} and ${POWER_DIAL_MAX} so the kit lands exactly on the envelope line. Structure, shapes and rhythm are yours and never scaled: land within a factor of two of the line and spend your care on the design.`,
    `One more rule the budget does not price, the burst cap: what one cast can deal to a single target at rank 1 (measured at ${BURST_REF.ad} attack, no AP, ticks counted for ${BURST_REF.tickWindow} seconds) may not exceed ${Math.round(100 * BURST_CAPS.basic)} percent of ${BURST_REF.hp} health for a basic spell, ${Math.round(100 * BURST_CAPS.ult)} for the R, and Q, W and E together may not exceed ${Math.round(100 * BURST_CAPS.basics)}. A spell the cap stops is held there while the others take the room, so spread damage across the kit rather than stacking it in one nuke.`
  ].join(" ");
}
function kitBudgetOf(bill) {
  return { cap: KIT_ENVELOPE, spend: kitSpendOf(bill) };
}
function billLine(bill) {
  const a = bill.abilities;
  return `Q ${Math.round(a.Q)}, W ${Math.round(a.W)}, E ${Math.round(a.E)}, R ${Math.round(a.R)}, passive ${Math.round(bill.passive)}`;
}
function rules() {
  const intro = "You design a champion kit for a small deterministic MOBA, in conversation with the champion's creator. The image is their chosen splash art: read its theme (weapon, element, silhouette, mood) and propose kits that match it, then rework your latest proposal as the creator asks. The champion on the form, with its name, role and stats, is restated at the end of every turn: those stay as they are and you rework the passive and the abilities.";
  const task = 'Every answer is ONLY a JSON object, no prose around it: { "comment": string, "passive": { "template": id, "params": {..}, "name": string, "flavor": string }, "abilities": { "Q": Ability, "W": Ability, "E": Ability, "R": Ability } }. "comment" is one or two plain sentences to the creator about what you proposed or changed. Spell names must be original English, no borrowed game IP. Compact JSON: no indentation, no line breaks. The creator may write in any language: answer them in their own language inside "comment", but every name (the passive and the four spells) is plain English, like every other champion in the game.';
  const bounds = `Numeric bounds per ability field: ${JSON.stringify(ABILITY_BOUNDS)} (cooldown uses basicCooldown for Q W E and ultCooldown for R).`;
  return [
    intro,
    GRAMMAR,
    `Passive templates (pick ONE):
${templateCatalog()}`,
    bounds,
    costSchedule(),
    task
  ].join("\n\n");
}
var SUGGEST_RULES = rules();
function formState(def) {
  const bill = budgetOf(def);
  const kit2 = kitBudgetOf(bill);
  return [
    `The champion on the form right now: ${JSON.stringify({
      name: def.name,
      title: def.title,
      role: def.role,
      base: def.base
    })}.`,
    `The kit on the form right now: ${JSON.stringify({ passive: def.passive, abilities: def.abilities })}.`,
    `Base stats and growth cost ${Math.round(bill.stats + bill.growth)}, leaving the passive plus abilities ${Math.round(kit2.cap)} to spend;`,
    `the form's kit spends ${Math.round(kit2.spend)} of that (${billLine(bill)}).`
  ].join(" ");
}
function parseSuggestion(text2) {
  const start = text2.indexOf("{");
  const end = text2.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(text2.slice(start, end + 1));
    if (typeof raw !== "object" || raw === null) return null;
    if (typeof raw.passive !== "object" || typeof raw.abilities !== "object") return null;
    const comment = typeof raw.comment === "string" ? raw.comment.slice(0, 400) : "";
    return { comment, passive: raw.passive, abilities: raw.abilities };
  } catch {
    return null;
  }
}
function threadError(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return "malformed conversation";
  if (messages.length > CHAT_TURNS_MAX) {
    return "this conversation is too long: apply what you like and start a fresh one";
  }
  for (let i = 0; i < messages.length; i += 1) {
    const m = messages[i];
    if (typeof m !== "object" || m === null) return "malformed conversation";
    if (m.role !== "user" && m.role !== "assistant") return "malformed conversation";
    if (typeof m.text !== "string") return "malformed conversation";
    const cap = m.role === "user" ? CHAT_USER_TEXT_MAX : CHAT_RAW_TEXT_MAX;
    if (m.text.length > cap) return "a message in this conversation is too long";
    if (i > 0 && messages[i - 1].role === m.role) return "malformed conversation";
  }
  const first2 = messages[0];
  const last2 = messages[messages.length - 1];
  if (first2.role !== "user" || last2.role !== "user") return "malformed conversation";
  return null;
}
function toApiMessages(turns, state, image, mediaType) {
  return turns.map((t, i) => {
    if (t.role === "assistant") return { role: "assistant", content: t.text };
    let text2 = i === 0 ? `The creator says: ${t.text}` : t.text;
    if (i === turns.length - 1) text2 = `${text2}

${state}`;
    if (i > 0) return { role: "user", content: text2 };
    const cache = turns.length > 1 ? { cache_control: { type: "ephemeral" } } : {};
    return {
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: image.toString("base64") }
        },
        { type: "text", text: text2, ...cache }
      ]
    };
  });
}
async function readEventStream(res, onText, onUsage) {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let text2 = "";
  const usage = {};
  const fold = (u) => {
    if (!u) return;
    for (const k of [
      "input_tokens",
      "output_tokens",
      "cache_read_input_tokens",
      "cache_creation_input_tokens"
    ]) {
      if (typeof u[k] === "number") usage[k] = u[k];
    }
  };
  const take = (frame) => {
    for (const line of frame.split("\n")) {
      if (!line.startsWith("data:")) continue;
      let event;
      try {
        event = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }
      if (event.type === "error") throw new Error(event.error?.message ?? "the stream broke");
      if (event.type === "message_start") fold(event.message?.usage);
      if (event.type === "message_delta") fold(event.usage);
      if (event.type !== "content_block_delta" || event.delta?.type !== "text_delta") continue;
      if (typeof event.delta.text !== "string") continue;
      text2 += event.delta.text;
      onText?.(event.delta.text);
    }
  };
  for (; ; ) {
    const { value, done } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    let cut = pending.indexOf("\n\n");
    while (cut >= 0) {
      take(pending.slice(0, cut));
      pending = pending.slice(cut + 2);
      cut = pending.indexOf("\n\n");
    }
  }
  if (pending.trim() !== "") take(pending);
  onUsage?.(usage);
  return text2;
}
async function askModel(deps, messages, onText, onUsage) {
  const doFetch = deps.fetchFn ?? fetch;
  const res = await doFetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": deps.apiKey ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: deps.model ?? SUGGEST_MODEL_DEFAULT,
      max_tokens: 4e3,
      // The rules never change between turns, creators or champions:
      // cached as a prefix, like the coach's own preamble.
      system: [{ type: "text", text: SUGGEST_RULES, cache_control: { type: "ephemeral" } }],
      // No hidden reasoning: a kit is a design, not a proof, and the fit
      // owns the arithmetic. Measured 2026-09-01 on the default (adaptive
      // thinking, implicit on this model): 42 s per call, 34 of them
      // silent; disabled: 11 s.
      thinking: { type: "disabled" },
      stream: true,
      messages
    }),
    signal: AbortSignal.timeout(SUGGEST_CALL_TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`suggestion service answered ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("text/event-stream")) return readEventStream(res, onText, onUsage);
  const body = await res.json();
  if (body.usage) onUsage?.(body.usage);
  const text2 = body.content?.find((c) => c.type === "text")?.text ?? "";
  onText?.(text2);
  return text2;
}
function imageMediaType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return "image/jpeg";
  }
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF") {
    if (bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  }
  if (bytes.length >= 4 && bytes.toString("ascii", 0, 4) === "GIF8") return "image/gif";
  return "image/png";
}
function foreignNames(s) {
  const a = s.abilities ?? {};
  const texts = [
    s.passive?.name,
    s.passive?.flavor,
    ...["Q", "W", "E", "R"].flatMap((k) => [a[k]?.name, a[k]?.flavor])
  ];
  return texts.filter((n) => typeof n === "string" && !/^[^\x00-\x1f\x7f]*$/.test(n));
}
async function suggestKit(deps, accountId, req) {
  if (!deps.apiKey) {
    return { ok: false, error: "suggestions are not configured on this server yet" };
  }
  const row = deps.store.getForged(req.id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  if (row.status === "finalized") {
    return { ok: false, error: "the kit is sealed; suggestions rework drafts only" };
  }
  const badThread = threadError(req.messages);
  if (badThread !== null) return { ok: false, error: badThread };
  const splash = deps.store.chosenArt(req.id, "splash");
  if (!splash) {
    return { ok: false, error: "make and pick the splash art first: the kit derives from it" };
  }
  let base = row.def;
  if (req.def !== void 0) {
    if (typeof req.def !== "object" || req.def === null) {
      return { ok: false, error: "malformed form state" };
    }
    base = { ...req.def, id: row.def.id, creator: row.def.creator };
  }
  const read = deps.readImage ?? ((p) => (0, import_node_fs5.readFileSync)(p));
  let image;
  try {
    image = read(import_node_path5.default.join(deps.assetsDir, splash.path));
  } catch {
    return { ok: false, error: "the chosen splash file is missing on this server" };
  }
  const mediaType = imageMediaType(image);
  const apiMessages = toApiMessages(req.messages, formState(base), image, mediaType);
  const price = EMBER_PRICES.kitTurn;
  const held2 = deps.store.creditBalance(accountId);
  if (held2 < price) {
    return { ok: false, error: `this costs ${price} embers a turn and you have ${held2}` };
  }
  const floor = deps.budgetFloor ?? BUDGET_FLOOR_DEFAULT;
  let fallback = null;
  let lastErrors = [];
  const progress = req.onProgress ?? (() => {
  });
  let stage = "Reading the splash and writing the kit";
  for (let attempt = 0; attempt < SUGGEST_ATTEMPTS; attempt += 1) {
    progress({ kind: "stage", text: stage });
    let text2;
    try {
      text2 = await askModel(
        deps,
        apiMessages,
        (delta) => progress({ kind: "text", text: delta }),
        // Every attempt is its own call and its own bill, so every
        // attempt writes its own calibration sample (ADR 0017).
        (usage) => {
          const at = (deps.now ?? Date.now)();
          deps.store.addSpendSample(usageSample("agent", "kit", accountId, at, usage));
          deps.store.addCreditEntry({
            accountId,
            delta: -price,
            reason: "spend",
            ref: req.id,
            at
          });
        }
      );
    } catch (err) {
      const e = err;
      const why = e.name === "TimeoutError" ? "the model took too long to answer; try again" : e.message;
      return { ok: false, error: `the suggestion call failed: ${why}` };
    }
    progress({ kind: "stage", text: "Fitting the budget and checking the rules" });
    const retry = (feedback2, next) => {
      apiMessages.push({ role: "assistant", content: text2 }, { role: "user", content: feedback2 });
      stage = next;
    };
    const suggestion = parseSuggestion(text2);
    if (!suggestion) {
      lastErrors = ["the answer was not the requested JSON object"];
      retry(
        "That was not the requested JSON object; answer with ONLY the JSON.",
        "The answer was not a kit, asking again"
      );
      continue;
    }
    const foreign = foreignNames(suggestion);
    if (foreign.length > 0) {
      lastErrors = [`names contain control characters: ${foreign.join(", ")}`];
      retry(
        `These names or flavor lines contain control characters: ${foreign.join(", ")}. Rewrite them as one clean line of text (any language is fine, Chinese preferred), keep everything else, and answer with ONLY the JSON object.`,
        "The names had control characters, asking again"
      );
      continue;
    }
    const drafted = {
      ...base,
      passive: suggestion.passive,
      abilities: suggestion.abilities
    };
    let fit = null;
    try {
      fit = fitKitPower(drafted);
    } catch {
      fit = null;
    }
    const candidate = fit ? { ...drafted, abilities: fit.abilities } : drafted;
    const v = validateForged(candidate);
    if (!v.ok) {
      lastErrors = v.errors;
      retry(
        `Your kit failed validation with these errors, fix them precisely: ${v.errors.join("; ")}`,
        "The draft broke a rule, asking for a fix"
      );
      continue;
    }
    const bill = budgetOf(candidate);
    const kit2 = kitBudgetOf(bill);
    const proposal = {
      ok: true,
      comment: suggestion.comment,
      passive: suggestion.passive,
      abilities: candidate.abilities,
      raw: text2.slice(0, CHAT_RAW_TEXT_MAX),
      budget: { total: Math.round(kit2.spend), cap: kit2.cap },
      fit: fit?.factor ?? 1,
      held: fit?.held ?? []
    };
    if (floor <= 0 || kit2.cap <= 0 || kit2.spend >= floor * kit2.cap) return proposal;
    fallback = proposal;
    lastErrors = [];
    retry(
      `Valid, but too light: even with every amount scaled up to ${POWER_DIAL_MAX} times, the passive plus abilities spend ${Math.round(kit2.spend)} of the ${Math.round(kit2.cap)} the budget leaves them (${Math.round(100 * kit2.spend / kit2.cap)} percent). Amounts cannot fix this: add substance to the structure (more effects per spell, shorter cooldowns, wider shapes, a pricier passive). The bill today: ${billLine(bill)}. Answer with ONLY the JSON object.`,
      "The kit was too light, asking for more"
    );
  }
  if (fallback) return fallback;
  return {
    ok: false,
    error: `the suggestion did not clear validation: ${(lastErrors ?? []).slice(0, 3).join("; ")}`
  };
}

// server/bot_chats.ts
var CHAT_STORE_MAX = 200;
function windowTurns(stored, text2) {
  let from = Math.max(0, stored.length - (CHAT_TURNS_MAX - 1));
  while (from < stored.length && stored[from].role !== "user") from++;
  const turns = stored.slice(from).map((t) => ({ role: t.role, text: t.text }));
  while (turns.length > 0 && turns[turns.length - 1].role === "user") turns.pop();
  turns.push({ role: "user", text: text2 });
  return turns;
}
function appendExchange(stored, text2, raw, refused) {
  const out = [
    ...stored,
    { role: "user", text: text2 },
    { role: "assistant", text: raw, ...refused.length > 0 ? { refused: [...refused] } : {} }
  ];
  let from = Math.max(0, out.length - CHAT_STORE_MAX);
  while (from < out.length && out[from].role !== "user") from++;
  return out.slice(from);
}
function botChat(deps, accountId, id) {
  const found = ownedBot(deps, accountId, id);
  if (!found.ok) return found;
  return { ok: true, turns: deps.store.getChat(found.bot.id) };
}
function clearBotChat(deps, accountId, id) {
  const found = ownedBot(deps, accountId, id);
  if (!found.ok) return found;
  deps.store.clearChat(found.bot.id);
  return { ok: true };
}

// server/record_tally.ts
function empty() {
  return { games: 0, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0 };
}
function add(into, row) {
  into.games++;
  if (row.winner !== null) {
    if (row.winner === row.team) into.wins++;
    else into.losses++;
  }
  into.kills += row.line?.kills ?? 0;
  into.deaths += row.line?.deaths ?? 0;
  into.assists += row.line?.assists ?? 0;
}
function talliesOf(rows) {
  const out = {
    rated: empty(),
    arena: empty(),
    live: empty(),
    sparring: empty(),
    series: empty()
  };
  for (const row of rows) {
    add(out[row.kind], row);
    if (row.kind === "arena" || row.kind === "live") add(out.rated, row);
  }
  return out;
}

// server/bot_page.ts
var BOT_PAGE_ROWS = 10;
function describeBotPage(deps, readerId, botId) {
  const bot = typeof botId === "string" ? deps.store.getBot(botId) : null;
  if (!bot) return { ok: false, error: "no such bot" };
  const entries = listEntries(deps.store, bot.id);
  const tally = talliesOf(entries);
  const rated = entries.filter((r) => r.kind === "arena" || r.kind === "live");
  return {
    ok: true,
    bot: {
      id: bot.id,
      name: bot.name,
      championId: bot.championId,
      skin: bot.skin,
      sigils: bot.sigils,
      version: bot.version,
      ranked: bot.deposited,
      openPlaybook: bot.openPlaybook,
      owner: deps.ownerName(bot.accountId),
      accountId: bot.accountId,
      mine: bot.accountId === readerId
    },
    tally,
    ratings: {
      live: deps.store.botRating(bot.id, "live"),
      arena: deps.store.botRating(bot.id, "arena")
    },
    rows: rated.slice(0, BOT_PAGE_ROWS),
    ...bot.openPlaybook ? { playbook: bot.playbook } : {}
  };
}

// server/bot_store.ts
var import_node_fs6 = require("node:fs");
var import_node_path6 = __toESM(require("node:path"), 1);
var import_node_sqlite = require("node:sqlite");
var SCHEMA = `
create table if not exists bots (
  id text primary key,
  account_id integer not null,
  name text not null,
  champion_id text not null,
  sigils text not null,
  skin integer not null default 0,
  playbook text not null,
  version integer not null default 1,
  deposited integer not null default 0,
  created_at integer not null,
  updated_at integer not null
);
create index if not exists bots_by_account on bots (account_id);
create table if not exists bot_versions (
  bot_id text not null references bots(id),
  version integer not null,
  playbook text not null,
  author text not null,
  at integer not null,
  primary key (bot_id, version)
);
create table if not exists bot_ratings (
  bot_id text not null,
  account_id integer not null,
  way text not null,
  rating integer not null,
  games integer not null,
  primary key (bot_id, way)
);
create table if not exists arena_meta (
  key text primary key,
  value integer not null
);
create table if not exists arena_events (
  id integer primary key autoincrement,
  account_id integer not null,
  at integer not null
);
create table if not exists bot_reports (
  id integer primary key autoincrement,
  match_id integer not null,
  bot_id text not null,
  seat_index integer not null,
  unit_id integer not null default 0,
  picks text not null,
  report text not null,
  at integer not null
);
create index if not exists bot_reports_by_bot on bot_reports (bot_id, at);
create table if not exists bot_proposals (
  id integer primary key autoincrement,
  bot_id text not null,
  at integer not null,
  comment text not null,
  ops text not null,
  current_wins integer not null,
  candidate_wins integer not null,
  matches integer not null,
  status text not null check (status in ('pending', 'applied', 'dismissed')),
  applied_version integer
);
create table if not exists bot_chats (
  bot_id text primary key,
  turns text not null,
  updated_at integer not null
);
create table if not exists bot_records (
  id integer primary key autoincrement,
  bot_id text not null,
  account_id integer not null,
  kind text not null,
  at integer not null,
  won integer,
  replay_id integer,
  entry text not null
);
create index if not exists bot_records_by_bot on bot_records (bot_id, at);
`;
var BOT_COLS = "id, account_id, name, champion_id, sigils, skin, playbook, version, deposited, auto_apply, open_playbook, created_at, updated_at";
function toBot(r) {
  return {
    id: r.id,
    accountId: r.account_id,
    name: r.name,
    championId: r.champion_id,
    sigils: JSON.parse(r.sigils),
    skin: r.skin,
    playbook: JSON.parse(r.playbook),
    version: r.version,
    deposited: r.deposited === 1,
    autoApply: r.auto_apply === 1,
    openPlaybook: r.open_playbook === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}
var BotStore = class {
  db;
  // ':memory:' gives tests a real store with no disk.
  constructor(file) {
    if (file !== ":memory:") (0, import_node_fs6.mkdirSync)(import_node_path6.default.dirname(file), { recursive: true });
    this.db = new import_node_sqlite.DatabaseSync(file);
    this.db.exec("pragma journal_mode = wal");
    this.db.exec(SCHEMA);
    this.ensureColumn("bots", "auto_apply", "auto_apply integer not null default 0");
    this.ensureColumn("bots", "last_coached_at", "last_coached_at integer");
    this.ensureColumn("bots", "open_playbook", "open_playbook integer not null default 0");
    this.migrateRatingsToBots();
  }
  // A rating used to belong to the account and now belongs to the bot
  // (ADR 0016). An account's rows cannot be split across the bots it owns
  // after the fact, so the old table goes and every bot places again in
  // three; the ADR says so out loud because it is a real cost.
  migrateRatingsToBots() {
    const cols = this.db.prepare("pragma table_info(bot_ratings)").all();
    if (cols.length === 0 || cols.some((c) => c.name === "bot_id")) return;
    this.db.exec("drop table bot_ratings");
    this.db.exec(`create table bot_ratings (
      bot_id text not null,
      account_id integer not null,
      way text not null,
      rating integer not null,
      games integer not null,
      primary key (bot_id, way)
    )`);
  }
  ensureColumn(table, name, ddl) {
    const cols = this.db.prepare(`pragma table_info(${table})`).all();
    if (!cols.some((c) => c.name === name)) this.db.exec(`alter table ${table} add column ${ddl}`);
  }
  close() {
    this.db.close();
  }
  // -- bots ---------------------------------------------------------------
  insertBot(row) {
    this.db.prepare(
      `insert into bots (${BOT_COLS})
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      row.id,
      row.accountId,
      row.name,
      row.championId,
      JSON.stringify(row.sigils),
      row.skin,
      JSON.stringify(row.playbook),
      row.version,
      row.deposited ? 1 : 0,
      row.autoApply ? 1 : 0,
      row.openPlaybook ? 1 : 0,
      row.createdAt,
      row.updatedAt
    );
  }
  // Rewrites the editable fields of an existing bot; identity (id, account,
  // champion, createdAt) never moves.
  updateBot(id, fields) {
    this.db.prepare(
      `update bots set name = ?, sigils = ?, skin = ?, playbook = ?, version = ?, updated_at = ?
         where id = ?`
    ).run(
      fields.name,
      JSON.stringify(fields.sigils),
      fields.skin,
      JSON.stringify(fields.playbook),
      fields.version,
      fields.updatedAt,
      id
    );
  }
  getBot(id) {
    const r = this.db.prepare(`select ${BOT_COLS} from bots where id = ?`).get(id);
    return r ? toBot(r) : null;
  }
  listByAccount(accountId) {
    const rows = this.db.prepare(`select ${BOT_COLS} from bots where account_id = ? order by created_at, id`).all(accountId);
    return rows.map(toBot);
  }
  countByAccount(accountId) {
    const r = this.db.prepare("select count(*) as n from bots where account_id = ?").get(accountId);
    return r?.n ?? 0;
  }
  deleteBot(id) {
    this.db.prepare("delete from bot_versions where bot_id = ?").run(id);
    this.db.prepare("delete from bot_chats where bot_id = ?").run(id);
    this.db.prepare("delete from bots where id = ?").run(id);
  }
  setDeposited(id, on) {
    this.db.prepare("update bots set deposited = ? where id = ?").run(on ? 1 : 0, id);
  }
  setAutoApply(id, on) {
    this.db.prepare("update bots set auto_apply = ? where id = ?").run(on ? 1 : 0, id);
  }
  setOpenPlaybook(id, on) {
    this.db.prepare("update bots set open_playbook = ? where id = ?").run(on ? 1 : 0, id);
  }
  botLastCoachedAt(id) {
    const r = this.db.prepare("select last_coached_at as at from bots where id = ?").get(id);
    return r?.at ?? null;
  }
  setBotLastCoachedAt(id, at) {
    this.db.prepare("update bots set last_coached_at = ? where id = ?").run(at, id);
  }
  depositedCount(accountId) {
    const r = this.db.prepare("select count(*) as n from bots where account_id = ? and deposited = 1").get(accountId);
    return r?.n ?? 0;
  }
  // Every deposited bot on the server: the Arena's pool.
  listDeposited() {
    const rows = this.db.prepare(
      `select ${BOT_COLS} from bots where deposited = 1 order by account_id, created_at, id`
    ).all();
    return rows.map(toBot);
  }
  // -- versions -----------------------------------------------------------
  addVersion(v) {
    this.db.prepare(
      "insert into bot_versions (bot_id, version, playbook, author, at) values (?, ?, ?, ?, ?)"
    ).run(v.botId, v.version, JSON.stringify(v.playbook), v.author, v.at);
  }
  listVersions(botId) {
    return this.db.prepare("select version, author, at from bot_versions where bot_id = ? order by version").all(botId);
  }
  getVersion(botId, version) {
    const r = this.db.prepare("select playbook, author, at from bot_versions where bot_id = ? and version = ?").get(botId, version);
    if (!r) return null;
    return {
      botId,
      version,
      playbook: JSON.parse(r.playbook),
      author: r.author,
      at: r.at
    };
  }
  // -- ratings ------------------------------------------------------------
  // The rating belongs to the bot, not to its owner (ADR 0016); the owner
  // rides along so a ladder row can name it without a second lookup.
  botRating(botId, way) {
    const r = this.db.prepare("select rating, games from bot_ratings where bot_id = ? and way = ?").get(botId, way);
    return r ?? { rating: BASE_RATING, games: 0 };
  }
  applyBotRating(botId, accountId, way, delta) {
    const cur = this.botRating(botId, way);
    this.db.prepare(
      `insert into bot_ratings (bot_id, account_id, way, rating, games) values (?, ?, ?, ?, ?)
         on conflict (bot_id, way) do update set
           account_id = excluded.account_id,
           rating = excluded.rating, games = excluded.games`
    ).run(botId, accountId, way, cur.rating + delta, cur.games + 1);
  }
  listBotRatings(way) {
    const rows = this.db.prepare("select bot_id, account_id, rating, games from bot_ratings where way = ?").all(way);
    return rows.map((r) => ({
      botId: r.bot_id,
      accountId: r.account_id,
      rating: r.rating,
      games: r.games
    }));
  }
  // -- the Arena ----------------------------------------------------------
  arenaLastRoundAt() {
    const r = this.db.prepare("select value from arena_meta where key = 'last_round_at'").get();
    return r ? r.value : null;
  }
  setArenaLastRoundAt(at) {
    this.db.prepare(
      "insert into arena_meta (key, value) values ('last_round_at', ?) on conflict (key) do update set value = excluded.value"
    ).run(at);
  }
  // On-demand Arena matches, for the daily allocation.
  addArenaEvent(accountId, at) {
    this.db.prepare("insert into arena_events (account_id, at) values (?, ?)").run(accountId, at);
  }
  arenaEventsSince(accountId, since) {
    const r = this.db.prepare("select count(*) as n from arena_events where account_id = ? and at >= ?").get(accountId, since);
    return r?.n ?? 0;
  }
  pruneArenaEvents(before) {
    const r = this.db.prepare("delete from arena_events where at < ?").run(before);
    return Number(r.changes);
  }
  arenaLastNightAt() {
    const r = this.db.prepare("select value from arena_meta where key = 'last_night_at'").get();
    return r ? r.value : null;
  }
  setArenaLastNightAt(at) {
    this.db.prepare(
      "insert into arena_meta (key, value) values ('last_night_at', ?) on conflict (key) do update set value = excluded.value"
    ).run(at);
  }
  // -- reports and proposals (the night coach) -----------------------------
  // What a bot seat did in one Arena match: the match's picks (its
  // opponents, for sparring) and the play report.
  addBotReport(row) {
    this.db.prepare(
      "insert into bot_reports (match_id, bot_id, seat_index, unit_id, picks, report, at) values (?, ?, ?, ?, ?, ?, ?)"
    ).run(
      row.matchId,
      row.botId,
      row.seatIndex,
      row.unitId,
      JSON.stringify(row.picks),
      JSON.stringify(row.report),
      row.at
    );
  }
  listBotReports(botId, since) {
    const rows = this.db.prepare(
      "select match_id, bot_id, seat_index, unit_id, picks, report, at from bot_reports where bot_id = ? and at >= ? order by at"
    ).all(botId, since);
    return rows.map((r) => ({
      matchId: r.match_id,
      botId: r.bot_id,
      seatIndex: r.seat_index,
      unitId: r.unit_id,
      picks: JSON.parse(r.picks),
      report: JSON.parse(r.report),
      at: r.at
    }));
  }
  pruneBotReports(before) {
    const r = this.db.prepare("delete from bot_reports where at < ?").run(before);
    return Number(r.changes);
  }
  // -- the Record (server/bot_records.ts) ----------------------------------
  // One more match on a bot's Record; returns its id. `won` is null for a
  // match without a winner.
  addRecord(row) {
    const r = this.db.prepare(
      "insert into bot_records (bot_id, account_id, kind, at, won, replay_id, entry) values (?, ?, ?, ?, ?, ?, ?)"
    ).run(
      row.botId,
      row.accountId,
      row.kind,
      row.at,
      row.won === null ? null : row.won ? 1 : 0,
      row.replayId,
      JSON.stringify(row.entry)
    );
    return Number(r.lastInsertRowid);
  }
  // A bot's Record, newest first, entries parsed.
  listRecords(botId) {
    const rows = this.db.prepare("select id, entry from bot_records where bot_id = ? order by at desc, id desc").all(botId);
    return rows.map((r) => ({ id: r.id, entry: JSON.parse(r.entry) }));
  }
  getRecord(id) {
    const r = this.db.prepare("select id, bot_id, account_id, entry from bot_records where id = ?").get(id);
    return r ? { id: r.id, botId: r.bot_id, accountId: r.account_id, entry: JSON.parse(r.entry) } : null;
  }
  // Keeps the newest `cap` entries of a bot; returns the replay ids the
  // dropped entries referenced, so the caller can let those files go.
  pruneRecords(botId, cap) {
    const doomed = this.db.prepare(
      "select id, replay_id from bot_records where bot_id = ? order by at desc, id desc limit -1 offset ?"
    ).all(botId, cap);
    const del = this.db.prepare("delete from bot_records where id = ?");
    for (const d of doomed) del.run(d.id);
    return doomed.map((d) => d.replay_id).filter((r) => r !== null);
  }
  deleteRecordsOf(botId) {
    const rows = this.db.prepare("select replay_id from bot_records where bot_id = ?").all(botId);
    this.db.prepare("delete from bot_records where bot_id = ?").run(botId);
    return rows.map((r) => r.replay_id).filter((r) => r !== null);
  }
  // Every replay id some Record still references: a file so held is not
  // the global prune's to delete.
  heldReplayIds() {
    const rows = this.db.prepare("select distinct replay_id from bot_records where replay_id is not null").all();
    return new Set(rows.map((r) => r.replay_id));
  }
  // Won and lost over the Record, the sports sense of the word.
  tally(botId) {
    const r = this.db.prepare(
      "select sum(case when won = 1 then 1 else 0 end) as wins, sum(case when won = 0 then 1 else 0 end) as losses from bot_records where bot_id = ?"
    ).get(botId);
    return { wins: Number(r.wins ?? 0), losses: Number(r.losses ?? 0) };
  }
  // Won and lost over the rated part of the Record: the Arena and the live
  // seats, never the sparring behind them. What a chip beside a bot's name
  // has to mean, on the ladder and in the Academy's rail alike; the full
  // reading per kind is server/record_tally.ts.
  ratedTally(botId) {
    const r = this.db.prepare(
      `select sum(case when won = 1 then 1 else 0 end) as wins,
                sum(case when won = 0 then 1 else 0 end) as losses
           from bot_records where bot_id = ? and kind in ('arena', 'live')`
    ).get(botId);
    return { wins: Number(r.wins ?? 0), losses: Number(r.losses ?? 0) };
  }
  // The coach conversation kept with the bot (server/bot_chats.ts).
  getChat(botId) {
    const r = this.db.prepare("select turns from bot_chats where bot_id = ?").get(botId);
    return r ? JSON.parse(r.turns) : [];
  }
  setChat(botId, turns, at) {
    this.db.prepare(
      `insert into bot_chats (bot_id, turns, updated_at) values (?, ?, ?)
         on conflict(bot_id) do update set turns = excluded.turns, updated_at = excluded.updated_at`
    ).run(botId, JSON.stringify(turns), at);
  }
  clearChat(botId) {
    this.db.prepare("delete from bot_chats where bot_id = ?").run(botId);
  }
  addProposal(p) {
    const r = this.db.prepare(
      `insert into bot_proposals (bot_id, at, comment, ops, current_wins, candidate_wins, matches, status)
         values (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      p.botId,
      p.at,
      p.comment,
      JSON.stringify(p.ops),
      p.currentWins,
      p.candidateWins,
      p.matches,
      p.status
    );
    return Number(r.lastInsertRowid);
  }
  getProposal(id) {
    const r = this.db.prepare(`select ${PROPOSAL_COLS} from bot_proposals where id = ?`).get(id);
    return r ? toProposal(r) : null;
  }
  // The newest proposal still awaiting the owner, if any.
  pendingProposal(botId) {
    const r = this.db.prepare(
      `select ${PROPOSAL_COLS} from bot_proposals where bot_id = ? and status = 'pending' order by at desc limit 1`
    ).get(botId);
    return r ? toProposal(r) : null;
  }
  setProposalStatus(id, status, appliedVersion) {
    this.db.prepare("update bot_proposals set status = ?, applied_version = ? where id = ?").run(status, appliedVersion, id);
  }
};
var PROPOSAL_COLS = "id, bot_id, at, comment, ops, current_wins, candidate_wins, matches, status, applied_version";
function toProposal(r) {
  return {
    id: r.id,
    botId: r.bot_id,
    at: r.at,
    comment: r.comment,
    ops: JSON.parse(r.ops),
    currentWins: r.current_wins,
    candidateWins: r.candidate_wins,
    matches: r.matches,
    status: r.status,
    appliedVersion: r.applied_version
  };
}

// server/way_stats.ts
var FORM_CAP = 10;
function wayStatsOf(records, way) {
  const sorted = [...records].sort((a, b) => a.at - b.at);
  const out = /* @__PURE__ */ new Map();
  for (const rec of sorted) {
    for (const seat of rec.players) {
      if (seat.accountId === null || seat.ratingDelta === void 0) continue;
      if (seatWay(rec, seat) !== way) continue;
      let s = out.get(seat.accountId);
      if (!s) {
        s = { games: 0, wins: 0, losses: 0, form: [], lastAt: 0, champions: /* @__PURE__ */ new Map() };
        out.set(seat.accountId, s);
      }
      const won = seat.team === rec.winner;
      s.games++;
      if (won) s.wins++;
      else s.losses++;
      s.form.unshift(won ? "W" : "L");
      if (s.form.length > FORM_CAP) s.form.length = FORM_CAP;
      s.lastAt = rec.at;
      s.champions.set(seat.championId, (s.champions.get(seat.championId) ?? 0) + 1);
    }
  }
  return out;
}
function favoriteOf(s) {
  if (!s) return null;
  let best = null;
  for (const [championId, games] of s.champions) {
    if (!best || games > best.games) best = { championId, games };
  }
  return best;
}

// server/bot_way_stats.ts
function kindOfWay(way) {
  if (way === "arena") return "arena";
  if (way === "bot") return "live";
  return null;
}
function botWayStats(rows, way, championId) {
  const kind = kindOfWay(way);
  const out = {
    games: 0,
    wins: 0,
    losses: 0,
    form: [],
    lastAt: 0,
    champions: /* @__PURE__ */ new Map()
  };
  if (kind === null) return out;
  const sorted = [...rows].filter((r) => r.kind === kind && r.ratingDelta !== void 0).sort((a, b) => a.at - b.at);
  for (const r of sorted) {
    out.games++;
    if (r.winner !== null) {
      const won = r.winner === r.team;
      if (won) out.wins++;
      else out.losses++;
      out.form.unshift(won ? "W" : "L");
    }
    out.lastAt = Math.max(out.lastAt, r.at);
  }
  out.form = out.form.slice(0, FORM_CAP);
  if (out.games > 0) out.champions.set(championId, out.games);
  return out;
}

// server/build_info.ts
var import_node_fs7 = require("node:fs");
var import_node_path7 = __toESM(require("node:path"), 1);

// src/net/build_watch.ts
var BUNDLE = /\/assets\/(index-[A-Za-z0-9_-]+)\.js(?![A-Za-z0-9_.-])/;
function buildIdIn(text2) {
  const m = BUNDLE.exec(text2);
  return m ? m[1] ?? null : null;
}

// server/build_info.ts
function deployStamp(now = Date.now()) {
  return Math.floor(now / 1e3).toString(36);
}
function buildId(bundle, stamp) {
  return bundle === null ? null : `${bundle}.${stamp}`;
}
function readBuildId(distDir) {
  try {
    return buildIdIn((0, import_node_fs7.readFileSync)(import_node_path7.default.join(distDir, "index.html"), "utf8"));
  } catch {
    return null;
  }
}
function buildInfo(orchard, build2) {
  return { version: REPLAY_VERSION, content: contentFingerprint(orchard), build: build2 };
}

// server/build_tag.ts
var BUILD_META = "build";
function isBuildId(value) {
  return /^[A-Za-z0-9_.-]{1,80}$/.test(value);
}
function buildTag(build2) {
  return `<meta name="${BUILD_META}" content="${build2}">`;
}
function withBuildTag(html, build2) {
  if (build2 === null || !isBuildId(build2)) return html;
  const at = html.search(/<\/head>/i);
  if (at < 0) return html;
  return `${html.slice(0, at)}    ${buildTag(build2)}
  ${html.slice(at)}`;
}

// server/conn_limit.ts
var MAX_CONN_PER_IP = 32;
var ConnectionLimiter = class {
  constructor(max = MAX_CONN_PER_IP) {
    this.max = max;
  }
  max;
  counts = /* @__PURE__ */ new Map();
  // Takes a slot for this address, or reports that the address is at its cap.
  acquire(address) {
    const held2 = this.counts.get(address) ?? 0;
    if (held2 >= this.max) return false;
    this.counts.set(address, held2 + 1);
    return true;
  }
  // Gives a slot back. Deleting at zero keeps the map from growing one entry
  // per address ever seen, which on a public server is unbounded.
  release(address) {
    const remaining = (this.counts.get(address) ?? 1) - 1;
    if (remaining <= 0) this.counts.delete(address);
    else this.counts.set(address, remaining);
  }
  held(address) {
    return this.counts.get(address) ?? 0;
  }
  get trackedAddresses() {
    return this.counts.size;
  }
};

// server/cookies.ts
function parseCookies(header) {
  const out = /* @__PURE__ */ new Map();
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const name = part.slice(0, eq).trim();
    if (name.length === 0 || out.has(name)) continue;
    let value = part.slice(eq + 1).trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    out.set(name, decodeCookieValue(value));
  }
  return out;
}
function decodeCookieValue(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function serializeCookie(name, value, opts) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(opts.maxAgeS))}`
  ];
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}
function clearCookie(name, opts) {
  return serializeCookie(name, "", { maxAgeS: 0, secure: opts.secure });
}

// server/discord_oauth.ts
var AUTHORIZE = "https://discord.com/oauth2/authorize";
var TOKEN = "https://discord.com/api/v10/oauth2/token";
var IDENTITY = "https://discord.com/api/v10/users/@me";
var GUILDS = "https://discord.com/api/v10/guilds";
var SCOPE = "identify";
var JOIN_SCOPE = "guilds.join";
function scopeFor(cfg) {
  return cfg.guild ? `${SCOPE} ${JOIN_SCOPE}` : SCOPE;
}
var EXCHANGE_TIMEOUT_MS = 8e3;
var CALLBACK_PATH = "/api/discord/callback";
function discordConfigFromEnv(env, origin) {
  const clientId = env.DISCORD_CLIENT_ID?.trim();
  const clientSecret = env.DISCORD_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  const explicit = env.DISCORD_REDIRECT_URI?.trim();
  const guildId = env.DISCORD_GUILD_ID?.trim();
  const botToken = env.DISCORD_BOT_TOKEN?.trim();
  return {
    clientId,
    clientSecret,
    redirectUri: explicit || `${origin.replace(/\/+$/, "")}${CALLBACK_PATH}`,
    ...guildId && botToken ? { guild: { id: guildId, botToken } } : {}
  };
}
function authorizeUrl(cfg, state) {
  const q = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: scopeFor(cfg),
    state
  });
  return `${AUTHORIZE}?${q.toString()}`;
}
function readIdentity(body) {
  if (typeof body !== "object" || body === null) return null;
  const raw = body;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const global = typeof raw.global_name === "string" ? raw.global_name.trim() : "";
  const handle = typeof raw.username === "string" ? raw.username.trim() : "";
  const username = global || handle;
  if (!/^\d{1,32}$/.test(id) || username.length === 0) return null;
  return { id, username: username.slice(0, 64) };
}
var DiscordOauth = class {
  constructor(cfg, fetchImpl = fetch, tokenUrl = TOKEN, identityUrl = IDENTITY, guildsUrl = GUILDS) {
    this.cfg = cfg;
    this.fetchImpl = fetchImpl;
    this.tokenUrl = tokenUrl;
    this.identityUrl = identityUrl;
    this.guildsUrl = guildsUrl;
  }
  cfg;
  fetchImpl;
  tokenUrl;
  identityUrl;
  guildsUrl;
  // Put this person in the configured server. Bot-authed, with the
  // player's own access token in the body: that pair is what Discord
  // requires, and it is why the token cannot leave the call that got it.
  // 201 added, 204 already a member, and both are a yes. Everything else
  // is a no that nobody hears: the sign-in already worked, and a server
  // that would not take a member is not a reason to refuse an account.
  async joinGuild(guild, userId, accessToken, signal) {
    try {
      const res = await this.fetchImpl(`${this.guildsUrl}/${guild.id}/members/${userId}`, {
        method: "PUT",
        headers: {
          authorization: `Bot ${guild.botToken}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ access_token: accessToken }),
        signal
      });
      if (res.status === 201 || res.status === 204) return true;
      console.error(`discord guild join refused with ${res.status}`);
      return false;
    } catch (err) {
      console.error("discord guild join failed", err);
      return false;
    }
  }
  // Code in, identity out. Null for every failure alike (a stale code, a
  // refused exchange, an outage, an answer that does not parse): the
  // caller has exactly one thing to do about any of them, which is to
  // send the player back with "that did not work".
  async exchange(code) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EXCHANGE_TIMEOUT_MS);
    try {
      const form = new URLSearchParams({
        client_id: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: this.cfg.redirectUri
      });
      const tokenRes = await this.fetchImpl(this.tokenUrl, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form.toString(),
        signal: controller.signal
      });
      if (!tokenRes.ok) {
        console.error(`discord token exchange refused with ${tokenRes.status}`);
        return null;
      }
      const token = await tokenRes.json();
      if (typeof token.access_token !== "string" || token.access_token.length === 0) return null;
      const meRes = await this.fetchImpl(this.identityUrl, {
        headers: { authorization: `Bearer ${token.access_token}` },
        signal: controller.signal
      });
      if (!meRes.ok) {
        console.error(`discord identity refused with ${meRes.status}`);
        return null;
      }
      const identity = readIdentity(await meRes.json());
      if (!identity) return null;
      const joinedGuild = this.cfg.guild ? await this.joinGuild(this.cfg.guild, identity.id, token.access_token, controller.signal) : false;
      return { identity, joinedGuild };
    } catch (err) {
      console.error("discord exchange failed", err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
};

// server/discord_state.ts
var import_node_crypto4 = require("node:crypto");
var FLOW_TTL_MS = 10 * 6e4;
var MAX_FLOWS = 5e3;
function randomKey() {
  return (0, import_node_crypto4.randomBytes)(32).toString("hex");
}
var DiscordFlows = class {
  constructor(gen = randomKey) {
    this.gen = gen;
  }
  gen;
  flows = /* @__PURE__ */ new Map();
  // Opens a round trip and returns the state to put in the URL.
  // Insertion order is age order in a Map, so the oldest is the first
  // key: dropping it is what keeps a flood bounded. This is the whole
  // defence on the request path, which is why start() never sweeps:
  // expiry is enforced on read, and the hourly sweep in server/main.ts is
  // housekeeping rather than correctness.
  start(now) {
    const flow = { state: this.gen(), createdAt: now };
    this.flows.set(flow.state, flow);
    while (this.flows.size > MAX_FLOWS) {
      const oldest = this.flows.keys().next();
      if (oldest.done) break;
      this.flows.delete(oldest.value);
    }
    return flow.state;
  }
  // Spends a state: true exactly once, for a state this process issued
  // recently. False for unknown and expired alike, so a caller cannot use
  // the answer to learn that some other flow exists.
  take(state, now) {
    const flow = this.flows.get(state);
    if (!flow) return false;
    this.flows.delete(state);
    return now - flow.createdAt < FLOW_TTL_MS;
  }
  purge(now) {
    let dropped = 0;
    for (const [state, flow] of this.flows) {
      if (now - flow.createdAt >= FLOW_TTL_MS) {
        this.flows.delete(state);
        dropped++;
      }
    }
    return dropped;
  }
  get flowCount() {
    return this.flows.size;
  }
};

// src/sim/forge/display.ts
var DISPLAY_PROP_KINDS = ["none", "maul", "shield", "rifle", "generated"];
var DISPLAY_BOUNDS = {
  height: { min: 1.2, max: 4.5, fallback: 2.4 },
  // Zero is feet on the ground; the offset only ever lifts (hovering
  // champions), never sinks the model into the floor.
  yOffset: { min: 0, max: 1.5, fallback: 0 },
  yawOffset: { min: -Math.PI, max: Math.PI, fallback: 0 },
  propOffset: { min: -2, max: 2 },
  // Enough to fix a sword lost in a fist or swallowing the arm; a per-axis
  // stretch would shear the texture, so the scale stays uniform.
  propScale: { min: 0.4, max: 2.5, fallback: 1 },
  boneNameMax: 64
};
function clamp(v, min, max) {
  if (typeof v !== "number" || !Number.isFinite(v)) return void 0;
  return Math.min(max, Math.max(min, v));
}
function triple(v, min, max) {
  const raw = Array.isArray(v) ? v : [];
  const out = [0, 0, 0];
  for (let i = 0; i < 3; i++) out[i] = clamp(raw[i], min, max) ?? 0;
  return out;
}
function sanitizeForgedDisplay(raw) {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw;
  const out = {};
  const height = clamp(r.height, DISPLAY_BOUNDS.height.min, DISPLAY_BOUNDS.height.max);
  if (height !== void 0) out.height = height;
  const yOffset = clamp(r.yOffset, DISPLAY_BOUNDS.yOffset.min, DISPLAY_BOUNDS.yOffset.max);
  if (yOffset !== void 0) out.yOffset = yOffset;
  const yawOffset = clamp(r.yawOffset, DISPLAY_BOUNDS.yawOffset.min, DISPLAY_BOUNDS.yawOffset.max);
  if (yawOffset !== void 0) out.yawOffset = yawOffset;
  const prop = r.prop;
  if (typeof prop === "object" && prop !== null) {
    const kind = DISPLAY_PROP_KINDS.find((k) => k === prop.kind);
    const bone = typeof prop.bone === "string" ? prop.bone.slice(0, DISPLAY_BOUNDS.boneNameMax) : "";
    if (kind !== void 0 && (bone !== "" || kind === "none")) {
      const scale = clamp(prop.scale, DISPLAY_BOUNDS.propScale.min, DISPLAY_BOUNDS.propScale.max);
      out.prop = {
        kind,
        bone,
        rot: triple(prop.rot, DISPLAY_BOUNDS.yawOffset.min, DISPLAY_BOUNDS.yawOffset.max),
        pos: triple(prop.pos, DISPLAY_BOUNDS.propOffset.min, DISPLAY_BOUNDS.propOffset.max),
        ...scale !== void 0 ? { scale } : {}
      };
    }
  }
  return out;
}

// server/display.ts
function setForgedDisplay(deps, accountId, id, raw) {
  const row = deps.store.getForged(id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  const assets = deps.store.forgedAssets(id) ?? {};
  if (row.status !== "finalized" && typeof assets.model !== "string") {
    return { ok: false, error: "only a champion with a built model can be tuned" };
  }
  const display = sanitizeForgedDisplay(raw);
  if (!display) return { ok: false, error: "malformed display tuning" };
  deps.store.updateForgedAssets(id, { ...assets, display }, (deps.now ?? Date.now)());
  return { ok: true, display };
}
function displayOf(store, id) {
  const assets = store.forgedAssets(id);
  if (!assets || assets.display === void 0) return null;
  return sanitizeForgedDisplay(assets.display);
}
function modelPointers(assets) {
  const a = assets ?? {};
  const clips = typeof a.clips === "object" && a.clips !== null ? a.clips : null;
  const clipFiles = typeof a.clipFiles === "object" && a.clipFiles !== null && Object.keys(a.clipFiles).length > 0 ? a.clipFiles : null;
  const embedded = clips !== null && clipFiles === null;
  const model = typeof a.rigged === "string" && !embedded ? a.rigged : typeof a.model === "string" ? a.model : null;
  return { model, clips, clipFiles: clipFiles !== null && model === a.rigged ? clipFiles : null };
}
function forgedMatchAssets(store, defs) {
  const out = {};
  for (const def of defs) {
    const assets = store.forgedAssets(def.id);
    const pointers = modelPointers(assets);
    const a = assets;
    out[def.id] = {
      model: pointers.model,
      family: a?.family ?? null,
      weapon: a?.weapon ?? null,
      clips: pointers.clips,
      clipFiles: pointers.clipFiles,
      display: displayOf(store, def.id),
      icons: iconsOf(store, def.id)
    };
  }
  return out;
}

// server/drop_in.ts
var DROP_IN_WINDOW_S = 8 * 60;
function open(c, windowS) {
  return c.joinable && c.humans > 0 && c.openSeats > 0 && c.time < windowS;
}
function chooseDropIn(candidates, windowS = DROP_IN_WINDOW_S) {
  let best = null;
  for (const c of candidates) {
    if (!open(c, windowS)) continue;
    if (!best || c.humans > best.humans || c.humans === best.humans && (c.time < best.time || c.time === best.time && c.matchId < best.matchId)) {
      best = c;
    }
  }
  return best ? best.matchId : null;
}
function dropInTeam(humans, seats) {
  const can = [seats[0] > 0, seats[1] > 0];
  if (!can[0] && !can[1]) return null;
  if (!can[0]) return 1;
  if (!can[1]) return 0;
  if (humans[0] !== humans[1]) return humans[0] < humans[1] ? 0 : 1;
  if (seats[0] !== seats[1]) return seats[0] > seats[1] ? 0 : 1;
  return 0;
}
function presenceOf(candidates, queued, windowS = DROP_IN_WINDOW_S) {
  let playing = 0;
  let joinable = false;
  for (const c of candidates) {
    if (!c.joinable) continue;
    playing += c.humans;
    if (open(c, windowS)) joinable = true;
  }
  return { playing, queued, joinable };
}

// server/edge.ts
var UNKNOWN = "unknown";
var MAX_HOPS = 10;
var IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
var IPV6 = /^[0-9a-f:]{2,45}$/;
function edgeConfig(env) {
  return { hops: trustedHops(env.TRUST_PROXY), origins: parseOrigins(env.ALLOWED_ORIGINS) };
}
function clientAddress(headers, socketAddress, cfg) {
  const socket = normalizeIp(socketAddress) ?? UNKNOWN;
  if (cfg.hops <= 0) return socket;
  const raw = headers["x-forwarded-for"];
  const forwarded = (Array.isArray(raw) ? raw.join(",") : raw ?? "").split(",").map((entry) => normalizeIp(entry)).reverse();
  const chain = [socket, ...forwarded];
  for (let i = Math.min(cfg.hops, chain.length - 1); i > 0; i--) {
    const hop = chain[i];
    if (hop) return hop;
  }
  const stated = normalizeIp(first(headers["x-real-ip"]));
  if (stated) return stated;
  return socket;
}
function originAllowed(headers, cfg) {
  const origin = first(headers.origin);
  if (origin === void 0 || origin.trim() === "") return true;
  if (cfg.origins.includes("*")) return true;
  const from = normalizeOrigin(origin);
  if (from === null) return false;
  if (cfg.origins.includes(from)) return true;
  const host = expectedHost(headers, cfg);
  return host !== null && from.slice(from.indexOf("://") + 3) === host;
}
function expectedHost(headers, cfg) {
  const forwarded = cfg.hops > 0 ? first(headers["x-forwarded-host"]) : void 0;
  const host = (forwarded ?? first(headers.host) ?? "").split(",")[0]?.trim().toLowerCase();
  return host !== void 0 && host.length > 0 ? host : null;
}
function trustedHops(raw) {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "" || s === "false" || s === "no") return 0;
  if (s === "true" || s === "yes") return 1;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), MAX_HOPS);
}
function parseOrigins(raw) {
  const out = [];
  for (const part of (raw ?? "").split(",")) {
    const s = part.trim();
    if (s === "") continue;
    if (s === "*") return ["*"];
    const o = normalizeOrigin(s);
    if (o !== null) out.push(o);
  }
  return out;
}
function normalizeOrigin(raw) {
  const s = raw.trim().toLowerCase().replace(/\/+$/, "");
  const sep = s.indexOf("://");
  if (sep <= 0 || sep + 3 >= s.length) return null;
  return s.slice(sep + 3).includes("/") ? null : s;
}
function normalizeIp(raw) {
  if (raw === void 0) return null;
  let s = raw.trim().toLowerCase();
  if (s.startsWith("[")) {
    const end = s.indexOf("]");
    if (end < 0) return null;
    s = s.slice(1, end);
  } else if ((s.match(/:/g)?.length ?? 0) === 1) {
    s = s.slice(0, s.indexOf(":"));
  }
  if (s.startsWith("::ffff:") && IPV4.test(s.slice(7))) s = s.slice(7);
  const v4 = IPV4.exec(s);
  if (v4) return v4.slice(1).every((n) => Number(n) <= 255) ? s : null;
  return s.includes(":") && IPV6.test(s) ? s : null;
}
function first(v) {
  return Array.isArray(v) ? v[0] : v;
}

// server/feedback.ts
var import_node_fs8 = require("node:fs");

// src/ui/feedback_box.ts
var FEEDBACK_VERSION = 1;
var FEEDBACK_MAX = 1e3;

// server/feedback.ts
var WHERE = ["end", "pause"];
var MODES = ["practice", "online"];
var FEEDBACK_MINUTES_MAX = 240;
function isRecord4(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function parseFeedback(raw) {
  if (!isRecord4(raw)) return null;
  if (raw.v !== FEEDBACK_VERSION) return null;
  const where = WHERE.find((w) => w === raw.where);
  const mode = MODES.find((m) => m === raw.mode);
  const text2 = typeof raw.text === "string" ? raw.text.trim() : "";
  if (!where || !mode || text2.length === 0 || text2.length > FEEDBACK_MAX) return null;
  if (typeof raw.minutes !== "number" || !Number.isInteger(raw.minutes) || raw.minutes < 0 || raw.minutes > FEEDBACK_MINUTES_MAX) {
    return null;
  }
  if (typeof raw.finished !== "boolean" || typeof raw.signedIn !== "boolean") return null;
  return {
    v: FEEDBACK_VERSION,
    text: text2,
    where,
    mode,
    minutes: raw.minutes,
    finished: raw.finished,
    signedIn: raw.signedIn
  };
}
var FeedbackStore = class {
  constructor(file) {
    this.file = file;
  }
  file;
  append(feedback2, at) {
    const stored = { at, ...feedback2 };
    appendJsonl(this.file, stored);
  }
  // Every message on disk, oldest first; a torn last line (a crash mid
  // write) is skipped rather than fatal.
  readAll() {
    let text2;
    try {
      text2 = (0, import_node_fs8.readFileSync)(this.file, "utf8");
    } catch {
      return [];
    }
    return readFeedbackLines(text2);
  }
};
function readFeedbackLines(text2) {
  const out = [];
  for (const line of text2.split("\n")) {
    if (!line.trim()) continue;
    try {
      const raw = JSON.parse(line);
      const feedback2 = parseFeedback(raw);
      if (feedback2 && typeof raw.at === "number") out.push({ at: raw.at, ...feedback2 });
    } catch {
    }
  }
  return out;
}

// server/forge.ts
var DRAFT_CAP = 50;
var DRAFT_JSON_MAX = 32e3;
var WEEK_MS2 = 7 * 24 * 60 * 60 * 1e3;
function refreshWeeklyGrant(deps, accountId) {
  const at = (deps.now ?? Date.now)();
  migrateCreations(deps, accountId, at);
  const last2 = deps.store.lastCreditEntryAt(accountId, "weekly_grant");
  if (last2 !== null && at - last2 < WEEK_MS2) return;
  deps.store.addCreditEntry({
    accountId,
    delta: deps.emberGrant ?? EMBERS_PER_WEEK,
    reason: "weekly_grant",
    at
  });
  grantFirstChampion(deps, accountId, at);
}
function grantFirstChampion(deps, accountId, at) {
  if (deps.store.lastCreditEntryAt(accountId, "welcome_grant") !== null) return;
  const top = welcomeTopUp(deps.store.creditBalance(accountId));
  deps.store.addCreditEntry({ accountId, delta: top, reason: "welcome_grant", at });
}
function migrateCreations(deps, accountId, at) {
  if (deps.store.lastCreditEntryAt(accountId, "ember_migration") !== null) return;
  const held2 = deps.store.creditBalance(accountId);
  deps.store.addCreditEntry({
    accountId,
    delta: held2 * CREATION_IN_EMBERS - held2,
    reason: "ember_migration",
    at
  });
}
function listDrafts(deps, accountId) {
  refreshWeeklyGrant(deps, accountId);
  return {
    ok: true,
    drafts: deps.store.listForgedByAccount(accountId),
    embers: deps.store.creditBalance(accountId),
    // The price list rides with the balance so every surface can put a
    // number on a button rather than behind a refusal (ADR 0017). A bake
    // is priced by its clip count, so it travels as its two numbers and
    // the surface states the rule.
    //
    // The image price is the deployment's, not the table's: two vendors
    // sell that act at different prices now, and sending the table would
    // put 4 on the button of a server that charges 10, which is the
    // refusal this list exists to prevent.
    prices: {
      ...EMBER_PRICES,
      image: deps.generation?.imagePrice ?? EMBER_PRICES.image,
      bakeBase: BAKE_BASE,
      bakePerClip: BAKE_PER_CLIP
    }
  };
}
function saveDraft(deps, accountId, accountName, def) {
  if (typeof def !== "object" || def === null || typeof def.id !== "string") {
    return { ok: false, error: "malformed draft" };
  }
  if (JSON.stringify(def).length > DRAFT_JSON_MAX) {
    return { ok: false, error: "this draft is too large to store" };
  }
  if (!FORGED_ID_PATTERN.test(def.id)) {
    return { ok: false, error: `draft id must match ${FORGED_ID_PATTERN}` };
  }
  def.creator = accountName;
  const v = validateForged(def);
  if (!v.ok && v.cost === null) {
    return { ok: false, error: `draft rejected: ${v.errors.slice(0, 5).join("; ")}` };
  }
  const blocked = findBlockedWord([
    def.name,
    def.title,
    def.tagline,
    def.passive.name,
    def.passive.flavor ?? "",
    ...["Q", "W", "E", "R"].flatMap((k) => [
      def.abilities[k]?.name ?? "",
      def.abilities[k]?.flavor ?? ""
    ])
  ]);
  if (blocked !== null) {
    return { ok: false, error: `pick different words: '${blocked}' cannot be on a card` };
  }
  const existing = deps.store.getForged(def.id);
  if (existing && existing.accountId !== accountId) {
    return { ok: false, error: "this id belongs to another creator" };
  }
  if (existing?.status === "finalized") {
    return { ok: false, error: "this champion is sealed: unseal it in the editor to edit it" };
  }
  const cap = deps.draftCap ?? DRAFT_CAP;
  if (!existing && deps.store.listForgedByAccount(accountId).length >= cap) {
    return { ok: false, error: `draft cap reached (${cap}); delete one first` };
  }
  const at = (deps.now ?? Date.now)();
  deps.store.saveForged({
    id: def.id,
    accountId,
    def,
    status: "draft",
    createdAt: existing?.createdAt ?? at,
    updatedAt: at
  });
  return { ok: true };
}
function deleteDraft(deps, accountId, id) {
  const existing = deps.store.getForged(id);
  if (!existing || existing.accountId !== accountId) {
    return { ok: false, error: "no such draft on this account" };
  }
  if (existing.status === "finalized") {
    return { ok: false, error: "a sealed champion cannot be deleted: unseal it first" };
  }
  deps.store.deleteForged(id);
  return { ok: true };
}
function buildModel(deps, accountId, id, force = false) {
  if (!deps.generation) {
    return { ok: false, error: "generation is not configured on this server yet" };
  }
  const row = deps.store.getForged(id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such draft on this account" };
  }
  if (row.status === "finalized") {
    return { ok: false, error: "this champion is sealed: unseal it to rebuild the model" };
  }
  if (!deps.store.chosenArt(id, "splash")) {
    return { ok: false, error: "make the splash art first: the champion derives from it" };
  }
  if (!deps.store.chosenArt(id, "sheet")) {
    return {
      ok: false,
      error: "generate and pick a model reference: the 3D builds from that exact image"
    };
  }
  refreshWeeklyGrant(deps, accountId);
  return startModelBuild(deps.generation, { def: row.def, accountId, force });
}
function animateChampion(deps, accountId, id, family, clipsRaw) {
  if (!deps.generation) {
    return { ok: false, error: "generation is not configured on this server yet" };
  }
  const row = deps.store.getForged(id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  const assets = deps.store.forgedAssets(id) ?? {};
  const storedFamily = typeof assets.family === "string" ? assets.family : "";
  const picked = WEAPON_FAMILIES.includes(family ?? "") ? family : WEAPON_FAMILIES.includes(storedFamily) ? storedFamily : familyOf(row.def);
  const provider = deps.generation.provider;
  const choices = catalogRoles(provider);
  const baked = typeof assets.clips === "object" && assets.clips !== null ? assets.clips : {};
  const defaults = provider.clipDefaults(picked);
  const clips = {};
  for (const role of CLIP_ROLES) {
    clips[role] = typeof baked[role] === "string" ? baked[role] : defaults[role];
  }
  for (const slot of SPELL_CLIP_SLOTS) {
    if (typeof baked[slot] === "string") clips[slot] = baked[slot];
  }
  if (typeof clipsRaw === "object" && clipsRaw !== null) {
    for (const role of CLIP_ROLES) {
      const want = clipsRaw[role];
      if (want === void 0) continue;
      if (typeof want !== "string" || !choices[role].some((c) => c.id === want)) {
        return { ok: false, error: `unknown ${role} animation: pick one from the catalog` };
      }
      clips[role] = want;
    }
    for (const slot of SPELL_CLIP_SLOTS) {
      const want = clipsRaw[slot];
      if (want === void 0) continue;
      const known = (c) => c.id === want;
      if (typeof want !== "string" || !(choices.cast.some(known) || choices.attack.some(known))) {
        return { ok: false, error: `unknown ${slot} animation: pick one from the catalog` };
      }
      clips[slot] = want;
    }
  }
  return startAnimate(deps.generation, { forgedId: id, accountId, family: picked, clips });
}
function forgeWeapon(deps, accountId, id) {
  if (!deps.generation) {
    return { ok: false, error: "generation is not configured on this server yet" };
  }
  const row = deps.store.getForged(id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  const assets = deps.store.forgedAssets(id);
  if (!assets?.model) {
    return { ok: false, error: "build the 3D model first: the weapon forges alongside it" };
  }
  if (assets.weapon) {
    return {
      ok: false,
      error: "this champion already has its forged weapon (Reforge comes later)"
    };
  }
  return startWeaponForge(deps.generation, { forgedId: id, accountId });
}
function finalizeStatus(deps, accountId, jobId) {
  const job = deps.store.getGenerationJob(jobId);
  if (!job || job.accountId !== accountId) {
    return { ok: false, error: "no such job on this account" };
  }
  return { ok: true, status: job.status, stage: job.stage, error: job.error };
}

// src/sim/forge/fresh_draft.ts
function freshDraftDef(id) {
  return {
    id,
    name: "New Champion",
    title: "",
    tagline: "",
    role: "Fighter",
    creator: "",
    passive: { template: "battle_flow", params: { msPct: 0.1, duration: 1.5 }, name: "Momentum" },
    base: {
      hp: 540,
      mana: 350,
      ad: 52,
      ap: 0,
      armor: 24,
      mr: 26,
      attackRange: 5.5,
      attackSpeed: 0.6,
      moveSpeed: 3.65,
      hpRegen: 1.3,
      manaRegen: 1.2,
      radius: 0.65
    },
    growth: { hp: 85, mana: 35, ad: 3.5, armor: 2.3, mr: 1.3 },
    abilities: {
      Q: {
        name: "First Strike",
        manaCost: 40,
        cooldown: 4.5,
        castRange: 9,
        spec: {
          kind: "skillshot",
          speed: 22,
          radius: 0.7,
          range: 9,
          onHit: [
            { kind: "damage", base: 120, adRatio: 0.8, dtype: "physical" },
            { kind: "slow", pct: 0.4, duration: 1.5 }
          ]
        }
      },
      W: {
        name: "Second Wind",
        manaCost: 50,
        cooldown: 9,
        castRange: 7,
        spec: {
          kind: "zone",
          radius: 3,
          duration: 3,
          tickEvery: 0.5,
          onEnter: [{ kind: "slow", pct: 0.45, duration: 2 }],
          onTick: [{ kind: "damage", base: 18, adRatio: 0.15, dtype: "magic" }],
          allyOnTick: [{ kind: "heal", base: 16 }]
        }
      },
      E: {
        name: "Third Step",
        manaCost: 35,
        cooldown: 7,
        castRange: 4.5,
        spec: {
          kind: "dash",
          range: 4.5,
          speed: 16,
          landRadius: 1.5,
          onLand: [{ kind: "damage", base: 80, adRatio: 0.5, dtype: "physical" }],
          selfEffects: [{ kind: "buff", duration: 3, asPct: 0.4 }],
          passThrough: []
        }
      },
      R: {
        name: "The Answer",
        manaCost: 85,
        cooldown: 60,
        castRange: 8,
        spec: {
          kind: "zone",
          radius: 3.5,
          duration: 1.5,
          detonateDelay: 1.2,
          onEnter: [{ kind: "slow", pct: 0.5, duration: 1.5 }],
          onTick: [],
          allyOnTick: [],
          onDetonate: [
            { kind: "damage", base: 260, adRatio: 1, dtype: "physical" },
            { kind: "stun", duration: 1.3 }
          ]
        }
      }
    }
  };
}

// src/sim/forge/stat_fit.ts
var MELEE_REACH = 1.8;
var RANGED_MIN = RANGED_THRESHOLD + 0.5;
var STAT_FIT_MAX = 64;
var BASE_KEYS = [
  "hp",
  "mana",
  "ad",
  "armor",
  "mr",
  "attackSpeed",
  "moveSpeed",
  "hpRegen",
  "manaRegen"
];
var GROWTH_KEYS = ["hp", "mana", "ad", "armor", "mr"];
var PRECISION = 1e-4;
function clamp2(v, b) {
  return Math.min(b.max, Math.max(b.min, v));
}
function num(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function floorTo(v) {
  return Number((Math.floor(v / PRECISION) * PRECISION).toFixed(4));
}
function reachOf(asked) {
  if (!Number.isFinite(asked) || asked <= RANGED_THRESHOLD) return MELEE_REACH;
  return clamp2(asked, { min: RANGED_MIN, max: BASE_STAT_BOUNDS.attackRange.max });
}
function factorFor(spendAt, line) {
  if (spendAt(STAT_FIT_MAX) <= line) return STAT_FIT_MAX;
  let lo = 0;
  let hi = STAT_FIT_MAX;
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) / 2;
    if (spendAt(mid) <= line) lo = mid;
    else hi = mid;
  }
  return lo;
}
function shapeOf(keys, asked, bounds, prices, fresh) {
  const shape = {};
  let weight = 0;
  for (const k of keys) {
    const b = bounds[k];
    shape[k] = Math.max(0, clamp2(num(asked[k], b.min), b) - b.min);
    weight += shape[k] * prices[k];
  }
  if (weight > 0) return shape;
  for (const k of keys) shape[k] = fresh[k] - bounds[k].min;
  return shape;
}
function fitStats(base, growth) {
  const fresh = freshDraftDef("fit");
  const reach = reachOf(num(base.attackRange, fresh.base.attackRange));
  const radius = clamp2(num(base.radius, fresh.base.radius), BASE_STAT_BOUNDS.radius);
  const baseShape = shapeOf(BASE_KEYS, base, BASE_STAT_BOUNDS, BASE_STAT_PRICES, fresh.base);
  const baseAt = (f) => {
    const out = { ...fresh.base, ap: 0, attackRange: reach, radius };
    for (const k of BASE_KEYS) {
      const b = BASE_STAT_BOUNDS[k];
      out[k] = clamp2(b.min + baseShape[k] * f, b);
    }
    return out;
  };
  const baseFactor = factorFor((f) => costOfBaseStats(baseAt(f)), STAT_ENVELOPE);
  const fitBase = baseAt(baseFactor);
  for (const k of BASE_KEYS) fitBase[k] = floorTo(fitBase[k]);
  const growthShape = shapeOf(GROWTH_KEYS, growth, GROWTH_BOUNDS, GROWTH_PRICES, fresh.growth);
  const growthAt2 = (f) => {
    const out = { ...fresh.growth };
    for (const k of GROWTH_KEYS) {
      const b = GROWTH_BOUNDS[k];
      out[k] = clamp2(b.min + growthShape[k] * f, b);
    }
    return out;
  };
  const growthFactor = factorFor((f) => costOfGrowth(growthAt2(f)), GROWTH_ENVELOPE);
  const fitGrowth = growthAt2(growthFactor);
  for (const k of GROWTH_KEYS) fitGrowth[k] = floorTo(fitGrowth[k]);
  return {
    base: fitBase,
    growth: fitGrowth,
    factor: { stats: baseFactor, growth: growthFactor }
  };
}

// server/suggest_stats.ts
var KIT_KEYS2 = ["Q", "W", "E", "R"];
function rosterLines() {
  return CHAMPION_LIST.map(
    (c) => `${c.name} (${c.role}): base ${JSON.stringify(c.base)} growth ${JSON.stringify(c.growth)}`
  ).join("\n");
}
function effectKinds(spec) {
  const kinds = [];
  for (const v of Object.values(spec)) {
    if (!Array.isArray(v)) continue;
    for (const e of v) {
      if (typeof e === "object" && e !== null && typeof e.kind === "string") {
        kinds.push(e.kind);
      }
    }
  }
  return [...new Set(kinds)];
}
function kitSummary(def) {
  const lines = KIT_KEYS2.map((k) => {
    const a = def.abilities[k];
    return `${k} ${a.name}: ${a.spec.kind}, cooldown ${a.cooldown}, ${effectKinds(a.spec).join("/") || "no effects"}`;
  });
  lines.unshift(`passive ${def.passive.name || def.passive.template}: ${def.passive.template}`);
  return lines.join("; ");
}
var STAT_RULES = statRules();
function statRules() {
  const rules2 = [
    `Base stat bounds: ${JSON.stringify(BASE_STAT_BOUNDS)}. Growth bounds: ${JSON.stringify(GROWTH_BOUNDS)}.`,
    `Price per point above each floor: base ${JSON.stringify(BASE_STAT_PRICES)}, growth ${JSON.stringify(GROWTH_PRICES)}.`,
    `Base stats fit the Stat envelope of ${ENVELOPES.stats} points and growth the Growth envelope of ${ENVELOPES.growth}; the two never trade with each other or with the kit.`,
    "Size the numbers roughly: the server scales the points above each floor by one shared factor per group so each envelope lands exactly on its line. The SHAPE is yours (which stats are high and which are dumped); the level is the arithmetic. AP is always 0 (it comes from items) and radius is body size, free of charge.",
    `The reach is an identity, never scaled: attackRange at or under 2 makes a melee champion (pinned at ${MELEE_REACH}); above 2 a ranged one, ${RANGED_MIN} to ${BASE_STAT_BOUNDS.attackRange.max}, priced like any stat. Keep the choice the kit implies unless the creator asks otherwise.`
  ].join(" ");
  return [`The roster, for reference:
${rosterLines()}`, rules2].join("\n\n");
}
function preamble() {
  const intro = "You tune the base stats and per-level growth of a champion for a small deterministic MOBA, in conversation with the champion's creator. Read the champion's role and kit, then propose a stat line that fits the body they describe, and rework your latest proposal as the creator asks.";
  const task = 'Every answer is ONLY a JSON object, no prose around it: { "comment": string, "base": { "hp", "mana", "ad", "armor", "mr", "attackRange", "attackSpeed", "moveSpeed", "hpRegen", "manaRegen", "radius" }, "growth": { "hp", "mana", "ad", "armor", "mr" } }, every value a number. "comment" is one or two plain sentences to the creator about the body you proposed or what you changed, in their own language. Compact JSON: no indentation, no line breaks.';
  return [intro, STAT_RULES, task].join("\n\n");
}
function formState2(def) {
  const spend = envelopeSpend(budgetOf(def));
  return [
    `The champion: ${JSON.stringify({ name: def.name, title: def.title, role: def.role })}.`,
    `Its kit: ${kitSummary(def)}.`,
    `The stats on the form right now: base ${JSON.stringify(def.base)}, growth ${JSON.stringify(def.growth)};`,
    `they spend ${Math.round(spend.stats)} of ${ENVELOPES.stats} and ${Math.round(spend.growth)} of ${ENVELOPES.growth}.`
  ].join(" ");
}
function numbersOf(raw) {
  const out = {};
  if (typeof raw !== "object" || raw === null) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}
function parseStatSuggestion(text2) {
  const start = text2.indexOf("{");
  const end = text2.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(text2.slice(start, end + 1));
    if (typeof raw !== "object" || raw === null) return null;
    if (typeof raw.base !== "object" || typeof raw.growth !== "object") return null;
    const comment = typeof raw.comment === "string" ? raw.comment.slice(0, 400) : "";
    return { comment, base: numbersOf(raw.base), growth: numbersOf(raw.growth) };
  } catch {
    return null;
  }
}
function toApiMessages2(turns, intro, state) {
  return turns.map((t, i) => {
    if (t.role === "assistant") return { role: "assistant", content: t.text };
    let text2 = i === 0 ? `${intro}

The creator says: ${t.text}` : t.text;
    if (i === turns.length - 1) text2 = `${text2}

${state}`;
    return { role: "user", content: text2 };
  });
}
async function suggestStats(deps, accountId, req) {
  if (!deps.apiKey) {
    return { ok: false, error: "suggestions are not configured on this server yet" };
  }
  const row = deps.store.getForged(req.id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  if (row.status === "finalized") {
    return { ok: false, error: "the stats are sealed; suggestions retune drafts only" };
  }
  const badThread = threadError(req.messages);
  if (badThread !== null) return { ok: false, error: badThread };
  let base = row.def;
  if (req.def !== void 0) {
    if (typeof req.def !== "object" || req.def === null) {
      return { ok: false, error: "malformed form state" };
    }
    base = { ...req.def, id: row.def.id, creator: row.def.creator };
  }
  const apiMessages = toApiMessages2(req.messages, preamble(), formState2(base));
  let lastErrors = [];
  const progress = req.onProgress ?? (() => {
  });
  let stage = "Reading the kit and shaping the stats";
  for (let attempt = 0; attempt < SUGGEST_ATTEMPTS; attempt += 1) {
    progress({ kind: "stage", text: stage });
    let text2;
    try {
      text2 = await askModel(deps, apiMessages, (delta) => progress({ kind: "text", text: delta }));
    } catch (err) {
      const e = err;
      const why = e.name === "TimeoutError" ? "the model took too long to answer; try again" : e.message;
      return { ok: false, error: `the suggestion call failed: ${why}` };
    }
    progress({ kind: "stage", text: "Fitting the envelopes and checking the rules" });
    const retry = (feedback2, next) => {
      apiMessages.push({ role: "assistant", content: text2 }, { role: "user", content: feedback2 });
      stage = next;
    };
    const suggestion = parseStatSuggestion(text2);
    if (!suggestion) {
      lastErrors = ["the answer was not the requested JSON object"];
      retry(
        "That was not the requested JSON object; answer with ONLY the JSON.",
        "The answer was not a stat line, asking again"
      );
      continue;
    }
    const fit = fitStats(suggestion.base, suggestion.growth);
    const candidate = { ...base, base: fit.base, growth: fit.growth };
    const v = validateForged(candidate);
    if (!v.ok) {
      lastErrors = v.errors;
      retry(
        `Your stats failed validation with these errors, fix them precisely: ${v.errors.join("; ")}`,
        "The draft broke a rule, asking for a fix"
      );
      continue;
    }
    const spend = envelopeSpend(budgetOf(candidate));
    return {
      ok: true,
      comment: suggestion.comment,
      base: fit.base,
      growth: fit.growth,
      raw: text2.slice(0, CHAT_RAW_TEXT_MAX),
      budget: {
        stats: { spend: Math.round(spend.stats), cap: ENVELOPES.stats },
        growth: { spend: Math.round(spend.growth), cap: ENVELOPES.growth }
      },
      fit: fit.factor
    };
  }
  return {
    ok: false,
    error: `the suggestion did not clear validation: ${lastErrors.slice(0, 3).join("; ")}`
  };
}

// server/forge_brief.ts
var NAME_MAX3 = 40;
var TAGLINE_MAX2 = 90;
var KIT_KEYS3 = ["Q", "W", "E", "R"];
function briefRules() {
  const intro = "You invent a whole champion for a small deterministic MOBA from one line by its creator. They have written nothing else: no name, no kit, no stats, no art. Read their line for theme, fantasy and role, and answer with a complete champion they can play with immediately and then change. Be specific and opinionated: a champion that reads as somebody is worth more than a safe one.";
  const identity = [
    `Identity: "name" at most ${NAME_MAX3} characters, "title" at most ${NAME_MAX3} (the words after the name, no comma of your own), "tagline" at most ${TAGLINE_MAX2} (the one line that tells four allies what this kit does).`,
    `"role" is exactly one of ${FORGED_ROLES.join(", ")}.`,
    "Names and titles are original, in Chinese like the rest of the game: no borrowed game IP, no control characters, one clean line each."
  ].join(" ");
  const splash = '"splash" is one sentence describing the champion as a PICTURE, for the art step: silhouette, materials, mood, one accent colour, one memorable detail. No camera or style words, no artist names.';
  const task = 'Answer with ONLY a JSON object, no prose around it: { "comment": string, "name": string, "title": string, "tagline": string, "role": string, "splash": string, "passive": { "template": id, "params": {..}, "name": string, "flavor": string }, "abilities": { "Q": Ability, "W": Ability, "E": Ability, "R": Ability }, "base": { "hp", "mana", "ad", "armor", "mr", "attackRange", "attackSpeed", "moveSpeed", "hpRegen", "manaRegen", "radius" }, "growth": { "hp", "mana", "ad", "armor", "mr" } }. "comment" is one or two plain sentences to the creator saying what you made of their line, in THEIR language. Compact JSON: no indentation, no line breaks.';
  return [intro, identity, splash, STAT_RULES, task].join("\n\n");
}
var BRIEF_RULES = briefRules();
function text(raw, max) {
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}
function numbersOf2(raw) {
  const out = {};
  if (typeof raw !== "object" || raw === null) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}
function parseBrief(answer) {
  const start = answer.indexOf("{");
  const end = answer.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(answer.slice(start, end + 1));
    if (typeof raw !== "object" || raw === null) return null;
    if (typeof raw.passive !== "object" || typeof raw.abilities !== "object") return null;
    if (typeof raw.base !== "object" || typeof raw.growth !== "object") return null;
    return {
      comment: text(raw.comment, 400),
      name: text(raw.name, NAME_MAX3),
      title: text(raw.title, NAME_MAX3),
      tagline: text(raw.tagline, TAGLINE_MAX2),
      role: text(raw.role, NAME_MAX3),
      splash: text(raw.splash, 400),
      passive: raw.passive,
      abilities: raw.abilities,
      base: numbersOf2(raw.base),
      growth: numbersOf2(raw.growth)
    };
  } catch {
    return null;
  }
}
function authoredText(s) {
  return [
    s.name,
    s.title,
    s.tagline,
    s.splash,
    s.passive?.name ?? "",
    s.passive?.flavor ?? "",
    ...KIT_KEYS3.flatMap((k) => [s.abilities[k]?.name ?? "", s.abilities[k]?.flavor ?? ""])
  ];
}
function foreignNames2(s) {
  return [s.name, s.title, s.passive?.name, ...KIT_KEYS3.map((k) => s.abilities[k]?.name)].filter(
    (n) => typeof n === "string" && n !== "" && !/^[^\x00-\x1f\x7f]*$/.test(n)
  );
}
function formState3(def) {
  return [
    `The champion on the form right now: ${JSON.stringify({
      name: def.name,
      title: def.title,
      tagline: def.tagline,
      role: def.role
    })}.`,
    `Its kit: ${JSON.stringify({ passive: def.passive, abilities: def.abilities })}.`,
    `Its body: base ${JSON.stringify(def.base)}, growth ${JSON.stringify(def.growth)}.`,
    "Rework THIS champion when the creator asks for a change; keep everything they did not ask you to touch, and always answer with the whole champion."
  ].join(" ");
}
function toApiMessages3(turns, state) {
  return turns.map((t, i) => {
    if (t.role === "assistant") return { role: "assistant", content: t.text };
    let text2 = i === 0 ? `${BRIEF_RULES}

The creator's line: ${t.text}` : t.text;
    if (i === turns.length - 1) text2 = `${text2}

${state}`;
    return { role: "user", content: text2 };
  });
}
async function briefChampion(deps, accountId, req) {
  if (!deps.apiKey) {
    return { ok: false, error: "suggestions are not configured on this server yet" };
  }
  const row = deps.store.getForged(req.id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  if (row.status === "finalized") {
    return { ok: false, error: "this champion is sealed; unseal it to rework the whole thing" };
  }
  const badThread = threadError(req.messages);
  if (badThread !== null) return { ok: false, error: badThread };
  const first2 = req.messages[0];
  if (!first2 || first2.text.trim() === "") {
    return { ok: false, error: "say what the champion is, in one line" };
  }
  let base = row.def;
  if (req.def !== void 0) {
    if (typeof req.def !== "object" || req.def === null) {
      return { ok: false, error: "malformed form state" };
    }
    base = { ...req.def, id: row.def.id, creator: row.def.creator };
  }
  const price = EMBER_PRICES.kitTurn;
  const held2 = deps.store.creditBalance(accountId);
  if (held2 < price) {
    return { ok: false, error: `this costs ${price} embers and you have ${held2}` };
  }
  const apiMessages = toApiMessages3(req.messages, formState3(base));
  const progress = req.onProgress ?? (() => {
  });
  let stage = req.messages.length > 1 ? "Reworking the champion" : "Reading your line and inventing the champion";
  let lastErrors = [];
  for (let attempt = 0; attempt < SUGGEST_ATTEMPTS; attempt += 1) {
    progress({ kind: "stage", text: stage });
    let answer;
    try {
      answer = await askModel(
        deps,
        apiMessages,
        (delta) => progress({ kind: "text", text: delta }),
        (usage) => {
          const at = (deps.now ?? Date.now)();
          deps.store.addSpendSample(usageSample("agent", "kit", accountId, at, usage));
          deps.store.addCreditEntry({
            accountId,
            delta: -price,
            reason: "spend",
            ref: req.id,
            at
          });
        }
      );
    } catch (err) {
      const e = err;
      const why = e.name === "TimeoutError" ? "the model took too long to answer; try again" : e.message;
      return { ok: false, error: `the brief call failed: ${why}` };
    }
    progress({ kind: "stage", text: "Fitting the envelopes and checking the rules" });
    const retry = (feedback2, next) => {
      apiMessages.push({ role: "assistant", content: answer }, { role: "user", content: feedback2 });
      stage = next;
    };
    const suggestion = parseBrief(answer);
    if (!suggestion) {
      lastErrors = ["the answer was not the requested JSON object"];
      retry(
        "That was not the requested JSON object; answer with ONLY the JSON.",
        "The answer was not a champion, asking again"
      );
      continue;
    }
    const foreign = foreignNames2(suggestion);
    if (foreign.length > 0) {
      lastErrors = [`names contain control characters: ${foreign.join(", ")}`];
      retry(
        `These names contain control characters: ${foreign.join(", ")}. Rewrite them as one clean line of text (Chinese is fine), keep everything else, and answer with ONLY the JSON object.`,
        "The names had control characters, asking again"
      );
      continue;
    }
    const blocked = findBlockedWord(authoredText(suggestion));
    if (blocked !== null) {
      lastErrors = [`a word that cannot go on a card: ${blocked}`];
      retry(
        `The word '${blocked}' cannot appear on a champion card. Rewrite whatever carries it, keep everything else, and answer with ONLY the JSON object.`,
        "A word could not go on a card, asking again"
      );
      continue;
    }
    const role = FORGED_ROLES.find((r) => r.toLowerCase() === suggestion.role.toLowerCase());
    if (!role) {
      lastErrors = [`unknown role: ${suggestion.role}`];
      retry(
        `'${suggestion.role}' is not a role. Use exactly one of ${FORGED_ROLES.join(", ")}, keep everything else, and answer with ONLY the JSON object.`,
        "The role was not one of ours, asking again"
      );
      continue;
    }
    const statFit = fitStats(suggestion.base, suggestion.growth);
    const drafted = {
      ...base,
      name: suggestion.name,
      title: suggestion.title,
      tagline: suggestion.tagline,
      role,
      passive: suggestion.passive,
      abilities: suggestion.abilities,
      base: statFit.base,
      growth: statFit.growth
    };
    let kitFit = null;
    try {
      kitFit = fitKitPower(drafted);
    } catch {
      kitFit = null;
    }
    const candidate = kitFit ? { ...drafted, abilities: kitFit.abilities } : drafted;
    const v = validateForged(candidate);
    if (!v.ok) {
      lastErrors = v.errors;
      retry(
        `Your champion failed validation with these errors, fix them precisely: ${v.errors.join("; ")}`,
        "The champion broke a rule, asking for a fix"
      );
      continue;
    }
    const bill = budgetOf(candidate);
    const spend = envelopeSpend(bill);
    return {
      ok: true,
      comment: suggestion.comment,
      name: candidate.name,
      title: candidate.title,
      tagline: candidate.tagline,
      role,
      splash: suggestion.splash,
      passive: candidate.passive,
      abilities: candidate.abilities,
      base: candidate.base,
      growth: candidate.growth,
      raw: answer.slice(0, CHAT_RAW_TEXT_MAX),
      budget: {
        kit: { spend: Math.round(kitSpendOf(bill)), cap: KIT_ENVELOPE },
        stats: { spend: Math.round(spend.stats), cap: ENVELOPES.stats },
        growth: { spend: Math.round(spend.growth), cap: ENVELOPES.growth }
      },
      fit: {
        kit: kitFit?.factor ?? 1,
        stats: statFit.factor.stats,
        growth: statFit.factor.growth
      },
      held: kitFit?.held ?? []
    };
  }
  return {
    ok: false,
    error: `the brief did not clear validation: ${lastErrors.slice(0, 3).join("; ")}`
  };
}

// server/forge_chats.ts
var CHAT_KINDS = ["brief", "kit", "stats", "looks"];
var CHAT_BUBBLE_MAX = 400;
var CHAT_PROPOSAL_MAX = 6e4;
var CHAT_JSON_MAX = CHAT_TURNS_MAX * CHAT_RAW_TEXT_MAX + CHAT_PROPOSAL_MAX + 4096;
function chatError(turns) {
  if (!Array.isArray(turns)) return "malformed conversation";
  if (turns.length > CHAT_TURNS_MAX) return "this conversation is too long to keep";
  for (let i = 0; i < turns.length; i += 1) {
    const t = turns[i];
    if (typeof t !== "object" || t === null) return "malformed conversation";
    if (t.role !== "user" && t.role !== "assistant") return "malformed conversation";
    if (typeof t.text !== "string" || typeof t.bubble !== "string") {
      return "malformed conversation";
    }
    const cap = t.role === "user" ? CHAT_USER_TEXT_MAX : CHAT_RAW_TEXT_MAX;
    if (t.text.length > cap || t.bubble.length > CHAT_BUBBLE_MAX) {
      return "a message in this conversation is too long";
    }
    const expected = i % 2 === 0 ? "user" : "assistant";
    if (t.role !== expected) return "malformed conversation";
  }
  return null;
}
function isKind(v) {
  return typeof v === "string" && CHAT_KINDS.includes(v);
}
function chatsOf(store, id) {
  const raw = store.forgedChats(id);
  const out = {};
  if (typeof raw !== "object" || raw === null) return out;
  for (const kind of CHAT_KINDS) {
    const c = raw[kind];
    if (typeof c !== "object" || c === null) continue;
    if (chatError(c.turns) !== null) continue;
    out[kind] = { turns: c.turns, proposal: c.proposal ?? null };
  }
  return out;
}
function saveChat(deps, accountId, req) {
  const row = deps.store.getForged(req.id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  if (!isKind(req.kind)) return { ok: false, error: "unknown conversation" };
  const bad = chatError(req.turns);
  if (bad !== null) return { ok: false, error: bad };
  const proposal = req.proposal ?? null;
  if (proposal !== null) {
    if (typeof proposal !== "object") return { ok: false, error: "malformed proposal" };
    if (JSON.stringify(proposal).length > CHAT_PROPOSAL_MAX) {
      return { ok: false, error: "this proposal is too large to keep" };
    }
  }
  const chats = chatsOf(deps.store, req.id);
  chats[req.kind] = { turns: req.turns, proposal };
  deps.store.setForgedChats(req.id, chats);
  return { ok: true };
}

// server/forge_store.ts
var import_node_fs9 = require("node:fs");
var import_node_path8 = __toESM(require("node:path"), 1);
var import_node_sqlite2 = require("node:sqlite");
var SCHEMA2 = `
create table if not exists forged_champions (
  id text primary key,
  account_id integer not null,
  def text not null,
  status text not null check (status in ('draft', 'finalized')),
  assets text,
  created_at integer not null,
  updated_at integer not null,
  listed integer not null default 1,
  shared integer not null default 1,
  taken_down integer not null default 0
);
create table if not exists credits (
  id integer primary key autoincrement,
  account_id integer not null,
  delta integer not null,
  reason text not null,
  ref text,
  at integer not null
);
create table if not exists generation_jobs (
  id integer primary key autoincrement,
  forged_id text not null references forged_champions(id),
  account_id integer not null,
  status text not null check (status in ('running', 'success', 'failed')),
  stage text not null,
  error text,
  kind text,
  created_at integer not null,
  updated_at integer not null
);
create table if not exists forge_ratings (
  account_id integer primary key,
  rating integer not null,
  games integer not null
);
create table if not exists likes (
  account_id integer not null,
  forged_id text not null,
  at integer not null,
  primary key (account_id, forged_id)
);
create table if not exists reports (
  account_id integer not null,
  forged_id text not null,
  reason text not null,
  at integer not null,
  primary key (account_id, forged_id)
);
create table if not exists warnings (
  id integer primary key autoincrement,
  account_id integer not null,
  forged_id text not null,
  reason text not null,
  at integer not null
);
create table if not exists quota_events (
  id integer primary key autoincrement,
  account_id integer not null,
  action text not null,
  at integer not null
);
create table if not exists spend_samples (
  id integer primary key autoincrement,
  account_id integer not null,
  action text not null,
  detail text not null,
  provider text not null,
  credits real,
  input_tokens integer,
  output_tokens integer,
  cache_read_tokens integer,
  cache_write_tokens integer,
  at integer not null
);
create table if not exists art_candidates (
  id integer primary key autoincrement,
  forged_id text not null,
  account_id integer not null,
  kind text not null,
  prompt text not null,
  path text not null,
  provenance text not null,
  chosen integer not null default 0,
  at integer not null
);
`;
function toArt(r) {
  let provenance = null;
  try {
    provenance = JSON.parse(r.provenance);
  } catch {
  }
  return {
    id: r.id,
    forgedId: r.forged_id,
    accountId: r.account_id,
    kind: r.kind,
    prompt: r.prompt,
    path: r.path,
    provenance,
    chosen: r.chosen === 1,
    at: r.at
  };
}
function toForged(r) {
  return {
    id: r.id,
    accountId: r.account_id,
    def: JSON.parse(r.def),
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    listed: r.listed === 1,
    shared: r.shared === 1,
    takenDown: r.taken_down === 1
  };
}
var FORGED_COLS = "id, account_id, def, status, created_at, updated_at, listed, shared, taken_down";
function toJob(r) {
  return {
    id: r.id,
    forgedId: r.forged_id,
    accountId: r.account_id,
    status: r.status,
    stage: r.stage,
    error: r.error,
    kind: r.kind ?? null,
    embers: r.embers ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}
var JOB_COLS = "id, forged_id, account_id, status, stage, error, kind, embers, created_at, updated_at";
var ForgeStore = class {
  db;
  // ':memory:' gives tests a real store with no disk.
  constructor(file) {
    if (file !== ":memory:") (0, import_node_fs9.mkdirSync)(import_node_path8.default.dirname(file), { recursive: true });
    this.db = new import_node_sqlite2.DatabaseSync(file);
    this.db.exec("pragma journal_mode = wal");
    this.db.exec(SCHEMA2);
    this.ensureColumn("forged_champions", "listed", "listed integer not null default 1");
    this.ensureColumn("forged_champions", "shared", "shared integer not null default 1");
    this.ensureColumn("forged_champions", "taken_down", "taken_down integer not null default 0");
    this.ensureColumn("forged_champions", "chats", "chats text");
    this.ensureColumn("generation_jobs", "kind", "kind text");
    this.ensureColumn("generation_jobs", "embers", "embers integer");
  }
  ensureColumn(table, name, ddl) {
    const cols = this.db.prepare(`pragma table_info(${table})`).all();
    if (!cols.some((c) => c.name === name)) this.db.exec(`alter table ${table} add column ${ddl}`);
  }
  close() {
    this.db.close();
  }
  // -- forged champions ---------------------------------------------------
  // Upserts a forged champion row. Validation is the caller's duty (the
  // deterministic validator gates every def before it is worth storing).
  // The gallery switches are not part of a save: they default on insert
  // and only setForgedVisibility and setTakenDown ever move them.
  saveForged(row) {
    this.db.prepare(
      `insert into forged_champions (id, account_id, def, status, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?)
         on conflict (id) do update set
           def = excluded.def, status = excluded.status, updated_at = excluded.updated_at`
    ).run(
      row.id,
      row.accountId,
      JSON.stringify(row.def),
      row.status,
      row.createdAt,
      row.updatedAt
    );
  }
  getForged(id) {
    const r = this.db.prepare(`select ${FORGED_COLS} from forged_champions where id = ?`).get(id);
    return r ? toForged(r) : null;
  }
  listForgedByAccount(accountId) {
    const rows = this.db.prepare(
      `select ${FORGED_COLS} from forged_champions where account_id = ? order by created_at`
    ).all(accountId);
    return rows.map(toForged);
  }
  // The gallery's raw material: every finalized champion that is not taken
  // down, with its like count. Listing policy (listed, shared, search,
  // sort) lives with the callers in server/gallery.ts.
  listFinalized() {
    const rows = this.db.prepare(
      `select ${FORGED_COLS.split(", ").map((c) => `f.${c}`).join(", ")},
           (select count(*) from likes l where l.forged_id = f.id) as likes
         from forged_champions f
         where f.status = 'finalized' and f.taken_down = 0
         order by f.updated_at desc`
    ).all();
    return rows.map((r) => ({ ...toForged(r), likes: r.likes }));
  }
  // The creator's two switches: gallery listing and "others may play it".
  setForgedVisibility(id, fields) {
    const row = this.getForged(id);
    if (!row) return;
    this.db.prepare("update forged_champions set listed = ?, shared = ? where id = ?").run(fields.listed ?? row.listed ? 1 : 0, fields.shared ?? row.shared ? 1 : 0, id);
  }
  setTakenDown(id, down) {
    this.db.prepare("update forged_champions set taken_down = ? where id = ?").run(down ? 1 : 0, id);
  }
  deleteForged(id) {
    this.db.prepare("delete from forged_champions where id = ?").run(id);
  }
  // Success in one write: the champion is sealed with its assets and
  // provenance, exactly once.
  setForgedFinalized(id, assets, now) {
    this.db.prepare(
      `update forged_champions set status = 'finalized', assets = ?, updated_at = ? where id = ?`
    ).run(JSON.stringify(assets), now, id);
  }
  // The explicit seal and unseal (server/seal.ts owns the policy).
  setForgedStatus(id, status, now) {
    this.db.prepare("update forged_champions set status = ?, updated_at = ? where id = ?").run(status, now, id);
  }
  forgedAssets(id) {
    const r = this.db.prepare("select assets from forged_champions where id = ?").get(id);
    if (!r?.assets) return null;
    try {
      return JSON.parse(r.assets);
    } catch {
      return null;
    }
  }
  // The editor's saved conversations, JSON beside the def: editor state,
  // not champion data, so it never touches updated_at.
  forgedChats(id) {
    const r = this.db.prepare("select chats from forged_champions where id = ?").get(id);
    if (!r?.chats) return null;
    try {
      return JSON.parse(r.chats);
    } catch {
      return null;
    }
  }
  setForgedChats(id, chats) {
    this.db.prepare("update forged_champions set chats = ? where id = ?").run(JSON.stringify(chats), id);
  }
  // Rewrites the sealed assets blob in place (the workshop's display
  // tuning); the caller owns merging into what forgedAssets returned.
  updateForgedAssets(id, assets, now) {
    this.db.prepare("update forged_champions set assets = ?, updated_at = ? where id = ?").run(JSON.stringify(assets), now, id);
  }
  // -- art candidates (plan-forge phase 4) ---------------------------------
  addArtCandidate(c) {
    const res = this.db.prepare(
      `insert into art_candidates (forged_id, account_id, kind, prompt, path, provenance, at)
         values (?, ?, ?, ?, ?, ?, ?)`
    ).run(c.forgedId, c.accountId, c.kind, c.prompt, c.path, JSON.stringify(c.provenance), c.at);
    return Number(res.lastInsertRowid);
  }
  listArtCandidates(forgedId) {
    const rows = this.db.prepare("select * from art_candidates where forged_id = ? order by at, id").all(forgedId);
    return rows.map(toArt);
  }
  getArtCandidate(id) {
    const r = this.db.prepare("select * from art_candidates where id = ?").get(id);
    return r ? toArt(r) : null;
  }
  // The creator's pick: at most one chosen candidate per (champion, kind).
  chooseArtCandidate(forgedId, kind, id) {
    this.db.prepare("update art_candidates set chosen = 0 where forged_id = ? and kind = ?").run(forgedId, kind);
    this.db.prepare("update art_candidates set chosen = 1 where id = ?").run(id);
  }
  chosenArt(forgedId, kind) {
    const r = this.db.prepare("select * from art_candidates where forged_id = ? and kind = ? and chosen = 1").get(forgedId, kind);
    return r ? toArt(r) : null;
  }
  // Drops the oldest unchosen candidates past `keep` for one (champion,
  // kind) and returns their file paths so the caller can unlink them; the
  // chosen candidate is never pruned.
  pruneArtCandidates(forgedId, kind, keep) {
    const rows = this.db.prepare(
      `select id, path from art_candidates
         where forged_id = ? and kind = ? and chosen = 0 order by at desc, id desc`
    ).all(forgedId, kind);
    const stale = rows.slice(Math.max(0, keep));
    for (const row of stale) this.db.prepare("delete from art_candidates where id = ?").run(row.id);
    return stale.map((r) => r.path);
  }
  // Every candidate of one champion, gone (a deleted draft); returns the
  // file paths for the caller to unlink.
  deleteArtCandidates(forgedId) {
    const rows = this.db.prepare("select path from art_candidates where forged_id = ?").all(forgedId);
    this.db.prepare("delete from art_candidates where forged_id = ?").run(forgedId);
    return rows.map((r) => r.path);
  }
  // -- the creation ledger ------------------------------------------------
  addCreditEntry(entry) {
    this.db.prepare("insert into credits (account_id, delta, reason, ref, at) values (?, ?, ?, ?, ?)").run(entry.accountId, entry.delta, entry.reason, entry.ref ?? null, entry.at);
  }
  creditBalance(accountId) {
    const r = this.db.prepare("select coalesce(sum(delta), 0) as balance from credits where account_id = ?").get(accountId);
    return r.balance;
  }
  // When the account last received an entry with this reason; null when
  // never. What the weekly allocation refresh paces itself by.
  lastCreditEntryAt(accountId, reason) {
    const r = this.db.prepare("select max(at) as at from credits where account_id = ? and reason = ?").get(accountId, reason);
    return r.at;
  }
  // -- likes, reports, warnings (plan-forge phase 7) -----------------------
  // One like per account per champion; liking twice is a no-op, so is
  // unliking what was never liked.
  setLike(accountId, forgedId, on, at) {
    if (on) {
      this.db.prepare(
        "insert into likes (account_id, forged_id, at) values (?, ?, ?) on conflict do nothing"
      ).run(accountId, forgedId, at);
    } else {
      this.db.prepare("delete from likes where account_id = ? and forged_id = ?").run(accountId, forgedId);
    }
  }
  likeCount(forgedId) {
    const r = this.db.prepare("select count(*) as n from likes where forged_id = ?").get(forgedId);
    return r.n;
  }
  likedBy(accountId, forgedId) {
    return this.db.prepare("select 1 from likes where account_id = ? and forged_id = ?").get(accountId, forgedId) !== void 0;
  }
  likedIds(accountId) {
    const rows = this.db.prepare("select forged_id from likes where account_id = ?").all(accountId);
    return new Set(rows.map((r) => r.forged_id));
  }
  // One report per account per champion, first reason kept.
  addReport(accountId, forgedId, reason, at) {
    this.db.prepare(
      `insert into reports (account_id, forged_id, reason, at) values (?, ?, ?, ?)
         on conflict do nothing`
    ).run(accountId, forgedId, reason, at);
  }
  reportCount(forgedId) {
    const r = this.db.prepare("select count(*) as n from reports where forged_id = ?").get(forgedId);
    return r.n;
  }
  addWarning(accountId, forgedId, reason, at) {
    this.db.prepare("insert into warnings (account_id, forged_id, reason, at) values (?, ?, ?, ?)").run(accountId, forgedId, reason, at);
  }
  warningCount(accountId) {
    const r = this.db.prepare("select count(*) as n from warnings where account_id = ?").get(accountId);
    return r.n;
  }
  // -- daily quota events (plan-forge phase 8) -----------------------------
  // Append-only, like the credits ledger: usage is derived by counting a
  // window, never stored. Policy (limits, the window) lives in
  // server/quotas.ts.
  addQuotaEvent(accountId, action, at) {
    this.db.prepare("insert into quota_events (account_id, action, at) values (?, ?, ?)").run(accountId, action, at);
  }
  quotaCountSince(accountId, action, since) {
    const r = this.db.prepare(
      "select count(*) as n from quota_events where account_id = ? and action = ? and at > ?"
    ).get(accountId, action, since);
    return r.n;
  }
  // The calibration log (server/spend.ts, ADR 0017): append-only, read by
  // nothing in the game, written by every act that costs money.
  addSpendSample(s) {
    this.db.prepare(
      "insert into spend_samples (account_id, action, detail, provider, credits, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      s.accountId,
      s.action,
      s.detail,
      s.provider,
      s.credits ?? null,
      s.inputTokens ?? null,
      s.outputTokens ?? null,
      s.cacheReadTokens ?? null,
      s.cacheWriteTokens ?? null,
      s.at
    );
  }
  listSpendSamples(since = 0) {
    const rows = this.db.prepare("select * from spend_samples where at > ? order by at").all(since);
    return rows.map((r) => ({
      accountId: Number(r.account_id),
      action: String(r.action),
      detail: String(r.detail),
      provider: String(r.provider),
      at: Number(r.at),
      ...r.credits === null ? {} : { credits: Number(r.credits) },
      ...r.input_tokens === null ? {} : { inputTokens: Number(r.input_tokens) },
      ...r.output_tokens === null ? {} : { outputTokens: Number(r.output_tokens) },
      ...r.cache_read_tokens === null ? {} : { cacheReadTokens: Number(r.cache_read_tokens) },
      ...r.cache_write_tokens === null ? {} : { cacheWriteTokens: Number(r.cache_write_tokens) }
    }));
  }
  // The same count over every account: what the server as a whole spent on
  // an action this window, for the ceiling no per-account limit can give.
  quotaCountAllSince(action, since) {
    const r = this.db.prepare("select count(*) as n from quota_events where action = ? and at > ?").get(action, since);
    return r.n;
  }
  // Housekeeping: events older than the widest window will never be
  // counted again; dropping them keeps the table bounded.
  pruneQuotaEvents(before) {
    const res = this.db.prepare("delete from quota_events where at <= ?").run(before);
    return Number(res.changes);
  }
  // -- the Forge queue's own rating (plan-forge phase 6) -------------------
  // Mirrors the account registry's Elo pair (rating, ratedGames) for the
  // Forge queue alone: same policy (server/rating.ts), separate ladder,
  // stored with the rest of the Forge domain (ADR 0011).
  forgeRating(accountId) {
    const r = this.db.prepare("select rating, games from forge_ratings where account_id = ?").get(accountId);
    return r ?? { rating: BASE_RATING, games: 0 };
  }
  // Every account with a Forge-queue rating, for that way's ladder.
  listForgeRatings() {
    const rows = this.db.prepare("select account_id, rating, games from forge_ratings").all();
    return rows.map((r) => ({ accountId: r.account_id, rating: r.rating, games: r.games }));
  }
  // One rated Forge-queue match landed; the delta is already signed.
  applyForgeRating(accountId, delta) {
    const cur = this.forgeRating(accountId);
    this.db.prepare(
      `insert into forge_ratings (account_id, rating, games) values (?, ?, ?)
         on conflict (account_id) do update set rating = excluded.rating, games = excluded.games`
    ).run(accountId, cur.rating + delta, cur.games + 1);
  }
  // A leaver penalty: rating drops without counting a game, exactly like
  // the classic ladder's penalize().
  penalizeForgeRating(accountId, amount) {
    const cur = this.forgeRating(accountId);
    this.db.prepare(
      `insert into forge_ratings (account_id, rating, games) values (?, ?, ?)
         on conflict (account_id) do update set rating = excluded.rating`
    ).run(accountId, cur.rating - amount, cur.games);
  }
  // -- generation jobs ----------------------------------------------------
  createGenerationJob(forgedId, accountId, now, kind = "build", embers = 0) {
    const res = this.db.prepare(
      `insert into generation_jobs (forged_id, account_id, status, stage, kind, embers, created_at, updated_at)
         values (?, ?, 'running', 'queued', ?, ?, ?, ?)`
    ).run(forgedId, accountId, kind, embers, now, now);
    return Number(res.lastInsertRowid);
  }
  updateGenerationJob(id, fields, now) {
    const existing = this.getGenerationJob(id);
    if (!existing) return;
    this.db.prepare(
      "update generation_jobs set status = ?, stage = ?, error = ?, updated_at = ? where id = ?"
    ).run(
      fields.status ?? existing.status,
      fields.stage ?? existing.stage,
      fields.error ?? existing.error,
      now,
      id
    );
  }
  getGenerationJob(id) {
    const r = this.db.prepare(`select ${JOB_COLS} from generation_jobs where id = ?`).get(id);
    return r ? toJob(r) : null;
  }
  // The live job for a champion, if any: what stops a double finalize.
  runningJobFor(forgedId) {
    const r = this.db.prepare(
      `select ${JOB_COLS} from generation_jobs where forged_id = ? and status = 'running' limit 1`
    ).get(forgedId);
    return r ? toJob(r) : null;
  }
  // Jobs still marked running (only a crash leaves them): the boot sweep
  // fails and refunds them, because the in-process work died with the
  // process.
  staleRunningJobs() {
    const rows = this.db.prepare(`select ${JOB_COLS} from generation_jobs where status = 'running'`).all();
    return rows.map(toJob);
  }
};

// server/gallery.ts
var REPORT_TAKEDOWN_THRESHOLD = 3;
var REPORT_REASON_MAX = 300;
function canPlayForged(row, accountId) {
  if (row.status !== "finalized" || row.takenDown) return false;
  return row.accountId === accountId || row.shared;
}
function listGallery(deps, accountId, query = {}) {
  const liked = deps.store.likedIds(accountId);
  const needle = (query.q ?? "").trim().toLowerCase();
  const rows = deps.store.listFinalized().map((r) => ({ ...r, valid: validateForged(r.def).ok })).filter((r) => r.valid || !query.playable && r.accountId === accountId).filter((r) => query.playable ? r.shared && r.listed : r.listed || r.accountId === accountId).filter(
    (r) => needle === "" || r.def.name.toLowerCase().includes(needle) || r.def.title.toLowerCase().includes(needle) || r.def.creator.toLowerCase().includes(needle)
  );
  const entries = rows.map((r) => {
    const assets = deps.store.forgedAssets(r.id);
    const pointers = modelPointers(assets);
    const a = assets;
    return {
      id: r.id,
      def: r.def,
      creator: r.def.creator,
      likes: r.likes,
      likedByMe: liked.has(r.id),
      mine: r.accountId === accountId,
      listed: r.listed,
      shared: r.shared,
      valid: r.valid,
      updatedAt: r.updatedAt,
      splash: splashOf(deps.store, r),
      model: pointers.model,
      family: a?.family ?? null,
      weapon: a?.weapon ?? null,
      clips: pointers.clips,
      clipFiles: pointers.clipFiles,
      display: displayOf(deps.store, r.id),
      icons: iconsOf(deps.store, r.id)
    };
  });
  if (query.sort === "popular") {
    entries.sort((a, b) => b.likes - a.likes || b.updatedAt - a.updatedAt);
  }
  return { ok: true, entries };
}
function toggleLike(deps, accountId, id, on) {
  const row = deps.store.getForged(id);
  if (row?.status !== "finalized" || row.takenDown) {
    return { ok: false, error: "no such champion in the gallery" };
  }
  deps.store.setLike(accountId, id, on, (deps.now ?? Date.now)());
  return { ok: true, likes: deps.store.likeCount(id) };
}
function reportForged(deps, accountId, id, reason) {
  const row = deps.store.getForged(id);
  if (row?.status !== "finalized" || row.takenDown) {
    return { ok: false, error: "no such champion in the gallery" };
  }
  if (row.accountId === accountId) {
    return { ok: false, error: "you cannot report your own champion; unlist it instead" };
  }
  const text2 = reason.trim().slice(0, REPORT_REASON_MAX);
  if (text2 === "") return { ok: false, error: "a report needs a reason" };
  const at = (deps.now ?? Date.now)();
  deps.store.addReport(accountId, id, text2, at);
  const threshold = deps.reportThreshold ?? REPORT_TAKEDOWN_THRESHOLD;
  if (deps.store.reportCount(id) < threshold) return { ok: true, takenDown: false };
  deps.store.setTakenDown(id, true);
  deps.store.addWarning(row.accountId, id, `taken down after ${threshold} reports`, at);
  return { ok: true, takenDown: true };
}
function setVisibility(deps, accountId, id, fields) {
  const row = deps.store.getForged(id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  if (row.status !== "finalized") {
    return { ok: false, error: "only a finalized champion has gallery switches" };
  }
  deps.store.setForgedVisibility(id, fields);
  return { ok: true };
}

// server/generation/mock.ts
var MOCK_COSTS = {
  generate2D: 10,
  imageTo3D: 30,
  rig: 25,
  animate: 30
};
var MockProvider = class {
  constructor(now = Date.now) {
    this.now = now;
  }
  now;
  id = "mock";
  // Mirrors production Tripo (instruction-edit models behind generate2D);
  // tests flip it to cover the reimagining-provider prompt path.
  editsImages = true;
  counter = 0;
  // Ops that must fail, by name; `blocked` failures simulate a content
  // refusal instead of a technical one.
  failOn = /* @__PURE__ */ new Set();
  blockOn = null;
  // Every request, in order, so tests can pin what rode along (the splash
  // token on the model sheet derivation, for one).
  seen = [];
  produce(op, kind, req) {
    this.seen.push({ op, req });
    if (this.blockOn === op) {
      return Promise.reject(new GenerationError(`mock ${op} refused the content`, true));
    }
    if (this.failOn.has(op)) {
      return Promise.reject(new GenerationError(`mock ${op} failed`));
    }
    this.counter += 1;
    const taskId = `mock-${op}-${this.counter}`;
    return Promise.resolve({
      taskId,
      url: `mock://${kind}/${taskId}`,
      provenance: { provider: this.id, model: "mock-1", at: this.now(), taskId },
      // A settled task reports what it charged, as Tripo does, so the
      // calibration path (ADR 0017) is exercised without a real provider.
      cost: MOCK_COSTS[op]
    });
  }
  generate2D(req) {
    return this.produce("generate2D", "image", req);
  }
  uploadImage(file) {
    this.seen.push({ op: "uploadImage", req: { name: file.name, bytes: file.data.length } });
    this.counter += 1;
    return Promise.resolve(`mock-upload-${this.counter}`);
  }
  imageTo3D(req) {
    return this.produce("imageTo3D", "model", req);
  }
  rig(req) {
    return this.produce("rig", "rigged", req);
  }
  // The mock's catalog: each role offers its bare name (what the
  // placeholder GLB names its clips) plus one alternate, so pick
  // validation has something to accept and something to refuse.
  clipChoices() {
    return Object.fromEntries(
      CLIP_ROLES.map((role) => [
        role,
        [
          { id: role, label: `Mock ${role}` },
          { id: `${role}_alt`, label: `Mock ${role} alt` }
        ]
      ])
    );
  }
  clipDefaults(_family) {
    return Object.fromEntries(CLIP_ROLES.map((role) => [role, role]));
  }
  animate(req) {
    return this.produce("animate", "animated", req);
  }
};

// server/generation/openai_images.ts
var GENERATE_URL = "https://api.openai.com/v1/images/generations";
var EDIT_URL = "https://api.openai.com/v1/images/edits";
var DEFAULT_IMAGE_MODEL = "gpt-image-2";
var DEFAULT_SIZE = "1024x1536";
var DEFAULT_QUALITY = "medium";
var OPENAI_IMAGE_RATES = {
  "gpt-image-2": { textIn: 5, imageIn: 8, imageOut: 30 },
  "gpt-image-1-mini": { textIn: 2, imageIn: 2.5, imageOut: 8 }
};
function costInCents(model, usage) {
  const rate = OPENAI_IMAGE_RATES[model];
  if (!rate || !usage) return void 0;
  const textIn = usage.input_tokens_details?.text_tokens ?? usage.input_tokens ?? 0;
  const imageIn = usage.input_tokens_details?.image_tokens ?? 0;
  const imageOut = usage.output_tokens ?? 0;
  return (textIn * rate.textIn + imageIn * rate.imageIn + imageOut * rate.imageOut) / 1e4;
}
var OpenAIImages = class {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.model = options.model || DEFAULT_IMAGE_MODEL;
    this.size = options.size || DEFAULT_SIZE;
    this.quality = options.quality || DEFAULT_QUALITY;
    this.http = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
  }
  apiKey;
  id = "openai";
  // The edits endpoint keeps the input character and applies the prompt as
  // an instruction, which is the behaviour the flag names.
  editsImages = true;
  model;
  size;
  quality;
  http;
  now;
  async generate2D(req) {
    const body = req.image ? this.editBody(req.prompt, req.image) : this.createBody(req.prompt);
    const res = await this.http(req.image ? EDIT_URL : GENERATE_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        ...req.image ? {} : { "content-type": "application/json" }
      },
      body
    });
    const text2 = await res.text();
    if (!res.ok) throw asError(res.status, text2);
    let parsed;
    try {
      parsed = JSON.parse(text2);
    } catch {
      throw new GenerationError("image generation returned something that was not JSON");
    }
    const b64 = parsed.data?.[0]?.b64_json;
    if (!b64) throw new GenerationError("image generation returned no image");
    const at = this.now();
    const taskId = `openai-image-${at}-${b64.length}`;
    const cost = costInCents(this.model, parsed.usage);
    return {
      taskId,
      // A data URL, because the pipeline downloads the asset immediately
      // through one fetch and node's fetch reads data URLs. Nothing has to
      // learn that this provider hands back bytes rather than a link.
      url: `data:image/png;base64,${b64}`,
      provenance: { provider: this.id, model: this.model, at, taskId },
      ...cost === void 0 ? {} : { cost }
    };
  }
  createBody(prompt) {
    return JSON.stringify({
      model: this.model,
      prompt,
      size: this.size,
      quality: this.quality,
      n: 1
    });
  }
  editBody(prompt, image) {
    const form = new FormData();
    form.set("model", this.model);
    form.set("prompt", prompt);
    form.set("size", this.size);
    form.set("quality", this.quality);
    form.set("n", "1");
    const bytes = new Uint8Array(image.data.byteLength);
    bytes.set(image.data);
    form.set("image", new Blob([bytes.buffer], { type: "image/png" }), image.name || "source.png");
    return form;
  }
};
function asError(status, body) {
  let code = "";
  let message = "";
  try {
    const parsed = JSON.parse(body);
    code = parsed.error?.code ?? "";
    message = parsed.error?.message ?? "";
  } catch {
    message = body.slice(0, 200);
  }
  const blocked = status === 400 && /moderation|safety|content_policy|rejected/i.test(`${code} ${message}`);
  return new GenerationError(
    `image generation failed (${status}${code ? ` ${code}` : ""}): ${message.slice(0, 200)}`,
    blocked
  );
}

// server/generation/placeholder.ts
var import_node_zlib = require("node:zlib");
function fnv1a(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function hslToRgb(h, s, l) {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t0) => {
    const t = (t0 % 1 + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)];
}
var CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(...parts) {
  let c = 4294967295;
  for (const part of parts) {
    for (const byte of part) c = (CRC_TABLE[(c ^ byte) & 255] ^ c >>> 8) >>> 0;
  }
  return (c ^ 4294967295) >>> 0;
}
function pngChunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(head.subarray(4), data), 0);
  return Buffer.concat([head, data, crc]);
}
var PLACEHOLDER_PNG_SIZE = { width: 480, height: 640 };
function placeholderPng(seed) {
  const { width, height } = PLACEHOLDER_PNG_SIZE;
  const hash2 = fnv1a(seed);
  const hue = hash2 % 360 / 360;
  const [tr, tg, tb] = hslToRgb(hue, 0.45, 0.16);
  const [br, bg, bb] = hslToRgb(hue, 0.55, 0.05);
  const [ar, ag, ab] = hslToRgb(hue, 0.7, 0.55);
  const raw = Buffer.alloc(height * (1 + width * 4));
  const cx = width / 2;
  const cy = height * 0.42;
  const radius = width * 0.3;
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0;
    const t = y / height;
    for (let x = 0; x < width; x++) {
      let r = tr + (br - tr) * t;
      let g = tg + (bg - tg) * t;
      let b = tb + (bb - tb) * t;
      const band = Math.abs(x - y * (width / height) - width * 0.1);
      if (band < width * 0.09) {
        const w = 0.35 * (1 - band / (width * 0.09));
        r += (ar - r) * w;
        g += (ag - g) * w;
        b += (ab - b) * w;
      }
      const d = Math.hypot(x - cx, y - cy);
      if (d < radius) {
        const rim = d > radius * 0.82 ? 0.75 : 0.3;
        r += (ar - r) * rim;
        g += (ag - g) * rim;
        b += (ab - b) * rim;
      }
      raw[o++] = Math.round(255 * Math.min(1, r));
      raw[o++] = Math.round(255 * Math.min(1, g));
      raw[o++] = Math.round(255 * Math.min(1, b));
      raw[o++] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", (0, import_node_zlib.deflateSync)(raw)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}
function yawQuat(rad) {
  return [0, Math.sin(rad / 2), 0, Math.cos(rad / 2)];
}
function pitchQuat(rad) {
  return [Math.sin(rad / 2), 0, 0, Math.cos(rad / 2)];
}
function rollQuat(rad) {
  return [0, 0, Math.sin(rad / 2), Math.cos(rad / 2)];
}
var TRACKS = [
  {
    name: "idle",
    path: "translation",
    times: [0, 0.6, 1.2],
    values: [
      [0, 0, 0],
      [0, 0.06, 0],
      [0, 0, 0]
    ]
  },
  {
    name: "run",
    path: "rotation",
    times: [0, 0.25, 0.5, 0.75, 1],
    values: [rollQuat(0), rollQuat(0.14), rollQuat(0), rollQuat(-0.14), rollQuat(0)]
  },
  {
    name: "attack",
    path: "rotation",
    times: [0, 0.18, 0.5],
    values: [yawQuat(0), yawQuat(0.6), yawQuat(0)]
  },
  {
    name: "cast",
    path: "translation",
    times: [0, 0.3, 0.8],
    values: [
      [0, 0, 0],
      [0, 0.2, 0],
      [0, 0, 0]
    ]
  },
  {
    name: "death",
    path: "rotation",
    times: [0, 0.8],
    values: [pitchQuat(0), pitchQuat(-Math.PI / 2)]
  }
];
function cubeGeometry() {
  const faces = [
    [
      [0, 0, 1],
      [
        [-0.5, -0.5, 0.5],
        [0.5, -0.5, 0.5],
        [0.5, 0.5, 0.5],
        [-0.5, 0.5, 0.5]
      ]
    ],
    [
      [0, 0, -1],
      [
        [0.5, -0.5, -0.5],
        [-0.5, -0.5, -0.5],
        [-0.5, 0.5, -0.5],
        [0.5, 0.5, -0.5]
      ]
    ],
    [
      [1, 0, 0],
      [
        [0.5, -0.5, 0.5],
        [0.5, -0.5, -0.5],
        [0.5, 0.5, -0.5],
        [0.5, 0.5, 0.5]
      ]
    ],
    [
      [-1, 0, 0],
      [
        [-0.5, -0.5, -0.5],
        [-0.5, -0.5, 0.5],
        [-0.5, 0.5, 0.5],
        [-0.5, 0.5, -0.5]
      ]
    ],
    [
      [0, 1, 0],
      [
        [-0.5, 0.5, 0.5],
        [0.5, 0.5, 0.5],
        [0.5, 0.5, -0.5],
        [-0.5, 0.5, -0.5]
      ]
    ],
    [
      [0, -1, 0],
      [
        [-0.5, -0.5, -0.5],
        [0.5, -0.5, -0.5],
        [0.5, -0.5, 0.5],
        [-0.5, -0.5, 0.5]
      ]
    ]
  ];
  const positions = [];
  const normals = [];
  const indices = [];
  for (const [normal, corners] of faces) {
    const base = positions.length / 3;
    for (const corner of corners) {
      positions.push(...corner);
      normals.push(...normal);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { positions, normals, indices };
}
function align4(buffer, pad = 0) {
  const rest = buffer.length % 4;
  return rest === 0 ? buffer : Buffer.concat([buffer, Buffer.alloc(4 - rest, pad)]);
}
function placeholderGlb(seed) {
  const hash2 = fnv1a(seed);
  const hue = hash2 % 360 / 360;
  const body = hslToRgb(hue, 0.55, 0.45);
  const head = hslToRgb(hue, 0.4, 0.7);
  const geo = cubeGeometry();
  const bins = [];
  const views = [];
  const accessors = [];
  let offset = 0;
  const push2 = (data, target) => {
    const aligned = align4(data);
    views.push({
      buffer: 0,
      byteOffset: offset,
      byteLength: data.length,
      ...target !== void 0 ? { target } : {}
    });
    bins.push(aligned);
    offset += aligned.length;
    return views.length - 1;
  };
  const posView = push2(Buffer.from(new Float32Array(geo.positions).buffer), 34962);
  accessors.push({
    bufferView: posView,
    componentType: 5126,
    count: geo.positions.length / 3,
    type: "VEC3",
    min: [-0.5, -0.5, -0.5],
    max: [0.5, 0.5, 0.5]
  });
  const normView = push2(Buffer.from(new Float32Array(geo.normals).buffer), 34962);
  accessors.push({
    bufferView: normView,
    componentType: 5126,
    count: geo.normals.length / 3,
    type: "VEC3"
  });
  const idxView = push2(Buffer.from(new Uint16Array(geo.indices).buffer), 34963);
  accessors.push({
    bufferView: idxView,
    componentType: 5123,
    count: geo.indices.length,
    type: "SCALAR"
  });
  const animations = [];
  for (const track of TRACKS) {
    const inputView = push2(Buffer.from(new Float32Array(track.times).buffer));
    accessors.push({
      bufferView: inputView,
      componentType: 5126,
      count: track.times.length,
      type: "SCALAR",
      min: [track.times[0]],
      max: [track.times[track.times.length - 1]]
    });
    const input = accessors.length - 1;
    const flat = track.values.flat();
    const outputView = push2(Buffer.from(new Float32Array(flat).buffer));
    accessors.push({
      bufferView: outputView,
      componentType: 5126,
      count: track.values.length,
      type: track.path === "rotation" ? "VEC4" : "VEC3"
    });
    animations.push({
      name: track.name,
      samplers: [{ input, interpolation: "LINEAR", output: accessors.length - 1 }],
      channels: [{ sampler: 0, target: { node: 0, path: track.path } }]
    });
  }
  const bin = Buffer.concat(bins);
  const json = {
    asset: { version: "2.0", generator: "claude-of-legends placeholder" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      { name: "root", children: [1, 2] },
      { name: "body", mesh: 0, translation: [0, 0.85, 0], scale: [0.6, 1.1, 0.35] },
      { name: "head", mesh: 1, translation: [0, 1.62, 0], scale: [0.34, 0.34, 0.34] }
    ],
    meshes: [0, 1].map((material) => ({
      primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material }]
    })),
    materials: [body, head].map((rgb, i) => ({
      name: i === 0 ? "body" : "head",
      pbrMetallicRoughness: {
        baseColorFactor: [...rgb, 1],
        metallicFactor: 0.1,
        roughnessFactor: 0.8
      }
    })),
    animations,
    accessors,
    bufferViews: views,
    buffers: [{ byteLength: bin.length }]
  };
  const jsonChunk = align4(Buffer.from(JSON.stringify(json), "utf8"), 32);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(1179937895, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + bin.length, 8);
  const jsonHead = Buffer.alloc(8);
  jsonHead.writeUInt32LE(jsonChunk.length, 0);
  jsonHead.writeUInt32LE(1313821514, 4);
  const binHead = Buffer.alloc(8);
  binHead.writeUInt32LE(bin.length, 0);
  binHead.writeUInt32LE(5130562, 4);
  return Buffer.concat([header, jsonHead, jsonChunk, binHead, bin]);
}
var PLACEHOLDER_CLIPS = TRACKS.map((t) => t.name);
if (PLACEHOLDER_CLIPS.length !== CLIP_ROLES.length) {
  throw new Error("placeholder clips out of step with CLIP_ROLES");
}
function placeholderFor(url, dest) {
  if (dest.endsWith(".glb")) return placeholderGlb(url);
  if (dest.endsWith(".png")) return placeholderPng(url);
  return Buffer.from(JSON.stringify({ placeholder: url }));
}

// server/generation/split.ts
var import_node_crypto5 = require("node:crypto");
var import_node_fs10 = require("node:fs");
var import_node_path9 = __toESM(require("node:path"), 1);
var TOKEN_PREFIX = "staged:";
var STAGE_TTL_MS = 24 * 60 * 60 * 1e3;
function stagedName(token) {
  return token.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null;
}
var SplitProvider = class {
  constructor(art, rest, options) {
    this.art = art;
    this.rest = rest;
    this.id = `${art.id}+${rest.id}`;
    this.editsImages = art.editsImages;
    this.stageDir = options.stageDir;
    this.now = options.now ?? Date.now;
  }
  art;
  rest;
  id;
  editsImages;
  stageDir;
  now;
  // Staged rather than uploaded: the bytes go to disk under a name derived
  // from them, and whoever needs them decides what to do with them. The
  // hash makes the same image stage once however many times it is offered.
  async uploadImage(file) {
    (0, import_node_fs10.mkdirSync)(this.stageDir, { recursive: true });
    this.sweep();
    const digest = (0, import_node_crypto5.createHash)("sha256").update(file.data).digest("hex").slice(0, 32);
    const ext = import_node_path9.default.extname(file.name) || ".png";
    const name = `${digest}${ext}`;
    const dest = import_node_path9.default.join(this.stageDir, name);
    if (!(0, import_node_fs10.existsSync)(dest)) (0, import_node_fs10.writeFileSync)(dest, file.data);
    return `${TOKEN_PREFIX}${name}`;
  }
  async generate2D(req) {
    const image = req.image === void 0 ? void 0 : this.read(req.image);
    return this.art.generate2D({
      prompt: req.prompt,
      ...image ? { image } : {},
      ...req.tPose === void 0 ? {} : { tPose: req.tPose }
    });
  }
  // The staged file becomes a real upload here, and only here: this is the
  // one call that needs the 3D vendor to be holding the picture.
  async imageTo3D(req) {
    const name = req.image === void 0 ? null : stagedName(req.image);
    if (name === null) return this.rest.imageTo3D(req);
    if (!this.rest.uploadImage) {
      throw new GenerationError("the 3D provider cannot take an image as input");
    }
    const file = this.read(req.image);
    const token = await this.rest.uploadImage(file);
    return this.rest.imageTo3D({ ...req, image: token });
  }
  rig(req) {
    return this.rest.rig(req);
  }
  clipChoices() {
    return this.rest.clipChoices();
  }
  clipDefaults(family) {
    return this.rest.clipDefaults(family);
  }
  animate(req) {
    return this.rest.animate(req);
  }
  read(token) {
    const name = stagedName(token);
    if (name === null) {
      throw new GenerationError("this image was not staged here and cannot be read back");
    }
    const file = import_node_path9.default.join(this.stageDir, name);
    if (!(0, import_node_fs10.existsSync)(file)) {
      throw new GenerationError("the source image is no longer staged; generate it again");
    }
    return { data: (0, import_node_fs10.readFileSync)(file), name };
  }
  // Old staged files, dropped on the way past. No scheduler: uploads are
  // the only thing that fills this directory, so they are the only thing
  // that needs to empty it.
  sweep() {
    const cutoff = this.now() - STAGE_TTL_MS;
    let names;
    try {
      names = (0, import_node_fs10.readdirSync)(this.stageDir);
    } catch {
      return;
    }
    for (const name of names) {
      const file = import_node_path9.default.join(this.stageDir, name);
      try {
        if ((0, import_node_fs10.statSync)(file).mtimeMs < cutoff) (0, import_node_fs10.unlinkSync)(file);
      } catch {
      }
    }
  }
};

// server/generation/tripo.ts
var BASE2 = "https://openapi.tripo3d.ai/v3";
var UPLOAD_URL = "https://api.tripo3d.ai/v2/openapi/upload/sts";
var BALANCE_URL = "https://api.tripo3d.ai/v2/openapi/user/balance";
var TASK_URL = "https://api.tripo3d.ai/v2/openapi/task";
var DEFAULT_IMAGE_MODEL2 = "gpt_image_2";
var RIG_MODEL = "v1.0-20240301";
var IMAGE_TO_MODEL_VERSION = "v3.1-20260211";
var TRIPO_CLIPS = (() => {
  const shared = {
    idle: "preset:biped:idle",
    run: "preset:biped:run",
    cast: "preset:biped:cast_a_spell",
    death: "preset:biped:defeat_02"
  };
  return {
    slashing: { ...shared, attack: "preset:biped:slash" },
    blunt: { ...shared, attack: "preset:biped:chop" },
    bow: { ...shared, attack: "preset:biped:shoot" },
    staff: { ...shared, attack: "preset:biped:fire" },
    unarmed: { ...shared, attack: "preset:biped:box_01" }
  };
})();
var TRIPO_CLIP_CHOICES = {
  idle: [
    { id: "preset:biped:idle", label: "Combat idle" },
    { id: "preset:biped:standing_relax", label: "Relaxed stance" },
    { id: "preset:biped:wait", label: "Impatient wait" },
    { id: "preset:biped:look_around", label: "Look around" },
    { id: "preset:biped:fold_arms", label: "Folded arms" }
  ],
  run: [
    { id: "preset:biped:run", label: "Run" },
    { id: "preset:biped:walk", label: "Walk" },
    { id: "preset:biped:swagger", label: "Swagger walk" }
  ],
  attack: [
    { id: "preset:biped:slash", label: "Sword slash" },
    { id: "preset:biped:chop", label: "Heavy chop" },
    { id: "preset:biped:shoot", label: "Bow shot" },
    { id: "preset:biped:fire", label: "Ranged fire" },
    { id: "preset:biped:box_01", label: "Punch combo 1" },
    { id: "preset:biped:box_02", label: "Punch combo 2" },
    { id: "preset:biped:box_03", label: "Punch combo 3" },
    { id: "preset:biped:front_kick_01", label: "Front kick 1" },
    { id: "preset:biped:front_kick_02", label: "Front kick 2" },
    { id: "preset:biped:pitch_baseball", label: "Overhand throw" }
  ],
  cast: [
    { id: "preset:biped:cast_a_spell", label: "Spell cast" },
    { id: "preset:biped:fire", label: "Channel and fire" }
  ],
  death: [
    { id: "preset:biped:defeat_02", label: "Defeat, variant 2" },
    { id: "preset:biped:defeat_03", label: "Defeat, variant 3" },
    { id: "preset:biped:fall", label: "Fall" }
  ]
};
var TripoProvider = class {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.fetchFn = options.fetchFn ?? fetch;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.pollEveryMs = options.pollEveryMs ?? 3e3;
    this.timeoutMs = options.timeoutMs ?? 10 * 60 * 1e3;
    this.imageModel = options.imageModel || DEFAULT_IMAGE_MODEL2;
  }
  apiKey;
  id = "tripo";
  // Image-driven 2D goes through the advanced generate_image task, whose
  // models edit the input image under the prompt instead of loosely
  // reimagining it.
  editsImages = true;
  fetchFn;
  sleep;
  pollEveryMs;
  timeoutMs;
  imageModel;
  async postAt(url, body) {
    const res = await this.fetchFn(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new GenerationError(`tripo ${url} refused: ${res.status} ${await res.text()}`);
    }
    const envelope = await res.json();
    const taskId = envelope.data?.task_id;
    if (!taskId) throw new GenerationError(`tripo ${url} returned no task id`);
    return taskId;
  }
  post(path12, body) {
    return this.postAt(`${BASE2}${path12}`, body);
  }
  // Poll until the task settles; the first URL in the output is the file
  // (Tripo names it model, pbr_model, or image depending on the task).
  // Both queues speak the same envelope; pollBase picks the queue the
  // task was submitted on (v3 generations, or the v2 task queue).
  async awaitTask(taskId, model, pollBase = `${BASE2}/tasks`) {
    const deadline = Date.now() + this.timeoutMs;
    for (; ; ) {
      const res = await this.fetchFn(`${pollBase}/${taskId}`, {
        headers: { authorization: `Bearer ${this.apiKey}` }
      });
      if (!res.ok) throw new GenerationError(`tripo task poll refused: ${res.status}`);
      const envelope = await res.json();
      const status = envelope.data?.status ?? "unknown";
      if (status === "success") {
        const output = envelope.data?.output ?? {};
        const url = Object.values(output).find(
          (v) => typeof v === "string" && v.startsWith("http")
        );
        if (!url) throw new GenerationError(`tripo task ${taskId} succeeded with no file url`);
        const spent = envelope.data?.consumed_credit;
        return {
          taskId,
          url,
          provenance: { provider: this.id, model, at: Date.now(), taskId },
          ...typeof spent === "number" ? { cost: spent } : {}
        };
      }
      if (status === "failed" || status === "cancelled" || status === "banned") {
        throw new GenerationError(`tripo task ${taskId} ended ${status}`, status === "banned");
      }
      if (Date.now() >= deadline) {
        throw new GenerationError(`tripo task ${taskId} timed out (${status})`);
      }
      await this.sleep(this.pollEveryMs);
    }
  }
  // Every 2D generation rides the advanced generate_image task on the v2
  // queue (docs.tripo3d.ai advanced-image-generation): its model_version
  // selects the actual image model, text-only included, so the splash is
  // never made by a weaker default. With a source image (an uploaded file
  // token) the same model instruction-edits it instead of reimagining.
  // t_pose stands the character in a rig-ready pose while keeping its
  // look; the model reference derivation asks for it. (The v3 basic
  // text-to-image this replaced stays live-verified in git history.)
  async generate2D(req) {
    const taskId = await this.postAt(TASK_URL, {
      type: "generate_image",
      model_version: this.imageModel,
      prompt: req.prompt,
      ...req.image ? { file: { type: "png", file_token: req.image } } : {},
      ...req.tPose ? { t_pose: true } : {}
    });
    return this.awaitTask(taskId, this.imageModel, TASK_URL);
  }
  // The file upload that turns a local image into an input token
  // (data.image_token). Lives on the v2 host; verified live 2026-08-31.
  async uploadImage(file) {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(file.data)]), file.name);
    const res = await this.fetchFn(UPLOAD_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}` },
      body: form
    });
    if (!res.ok) {
      throw new GenerationError(`tripo upload refused: ${res.status} ${await res.text()}`);
    }
    const envelope = await res.json();
    const token = envelope.data?.image_token;
    if (!token) throw new GenerationError("tripo upload returned no image token");
    return token;
  }
  // The account's credit balance ({balance, frozen}); -1 when the call
  // fails, so a boot log never blocks on it. Tripo-specific, not part of
  // the neutral interface.
  async balance() {
    try {
      const res = await this.fetchFn(BALANCE_URL, {
        headers: { authorization: `Bearer ${this.apiKey}` }
      });
      if (!res.ok) return -1;
      const envelope = await res.json();
      return envelope.data?.balance ?? -1;
    } catch {
      return -1;
    }
  }
  async imageTo3D(req) {
    const source = req.image !== void 0 ? { file: { type: "png", file_token: req.image } } : { input: req.imageUrl ?? req.imageTaskId };
    const taskId = await this.post("/generation/image-to-model", {
      model: IMAGE_TO_MODEL_VERSION,
      ...source,
      texture: true,
      compress: "geometry",
      orientation: "align_image",
      ...req.seed !== void 0 ? { model_seed: req.seed } : {}
    });
    return this.awaitTask(taskId, IMAGE_TO_MODEL_VERSION);
  }
  async rig(req) {
    const taskId = await this.post("/animations/rig", {
      input: req.modelTaskId,
      model: RIG_MODEL,
      rig_type: req.rigType,
      spec: "tripo",
      out_format: "glb"
    });
    return this.awaitTask(taskId, RIG_MODEL);
  }
  clipChoices() {
    return TRIPO_CLIP_CHOICES;
  }
  clipDefaults(family) {
    return TRIPO_CLIPS[family];
  }
  async animate(req) {
    const taskId = await this.post("/animations/retarget", {
      input: req.riggedTaskId,
      // The baked GLB names each clip by its preset id.
      animations: [...req.animations],
      out_format: "glb",
      bake_animation: true,
      export_with_geometry: req.withGeometry
    });
    return this.awaitTask(taskId, RIG_MODEL);
  }
};

// server/guests.ts
var import_node_crypto6 = require("node:crypto");
var GUEST_COOKIE = "loc_guest";
var GUEST_TTL_MS = 24 * 60 * 6e4;
var GUEST_MAX = 5e3;
function guestName(n) {
  return `Wanderer ${String(n).padStart(4, "0")}`;
}
function isGuestId(id) {
  return id < 0;
}
function ratedWithGuests(fromQueue, humanIds) {
  return fromQueue && !humanIds.some(isGuestId);
}
function guestRefused(msg) {
  switch (msg.t) {
    case "queue":
      return msg.forge === true;
    case "create_lobby":
    case "join_lobby":
    case "lobby_team":
    case "queue_party":
    case "start_lobby":
    case "spectate":
      return true;
    default:
      return false;
  }
}
function randomToken2() {
  return (0, import_node_crypto6.randomBytes)(24).toString("hex");
}
var GuestStore = class {
  constructor(ttlMs = GUEST_TTL_MS, max = GUEST_MAX, tokenGen = randomToken2, digits = () => Math.floor(Math.random() * 1e4)) {
    this.ttlMs = ttlMs;
    this.max = max;
    this.tokenGen = tokenGen;
    this.digits = digits;
  }
  ttlMs;
  max;
  tokenGen;
  digits;
  byToken = /* @__PURE__ */ new Map();
  nextId = -1;
  issue(now) {
    this.sweep(now);
    while (this.byToken.size >= this.max) {
      const oldest = this.byToken.keys().next().value;
      if (oldest === void 0) break;
      this.byToken.delete(oldest);
    }
    const guest = { id: this.nextId--, name: guestName(this.digits()), seenAt: now };
    const token = this.tokenGen();
    this.byToken.set(token, guest);
    return { token, guest };
  }
  // The Guest behind a cookie, rolled forward; undefined once it has sat
  // unused for the window.
  resolve(token, now) {
    const guest = this.byToken.get(token);
    if (!guest) return void 0;
    if (now - guest.seenAt > this.ttlMs) {
      this.byToken.delete(token);
      return void 0;
    }
    guest.seenAt = now;
    return guest;
  }
  get size() {
    return this.byToken.size;
  }
  sweep(now) {
    for (const [token, guest] of this.byToken) {
      if (now - guest.seenAt > this.ttlMs) this.byToken.delete(token);
    }
  }
};

// server/ladder.ts
var LADDER_CAP = 50;
var MIN_RATED_GAMES = 3;
function buildLadder(accounts, cap = LADDER_CAP) {
  return accounts.filter((a) => a.ratedGames >= MIN_RATED_GAMES).sort((a, b) => b.rating - a.rating || b.ratedGames - a.ratedGames || a.createdAt - b.createdAt).slice(0, cap).map((a, i) => ({
    rank: i + 1,
    id: a.id,
    name: a.name,
    rating: a.rating,
    ratedGames: a.ratedGames
  }));
}
function buildBotLadder(rows, nameOf, cap = LADDER_CAP) {
  const named = [];
  for (const r of rows) {
    if (r.games < MIN_RATED_GAMES) continue;
    const name = nameOf(r.botId, r.accountId);
    if (name !== null) named.push({ ...r, name });
  }
  return named.sort((a, b) => b.rating - a.rating || b.games - a.games || a.botId.localeCompare(b.botId)).slice(0, cap).map((r, i) => ({
    rank: i + 1,
    id: r.botId,
    accountId: r.accountId,
    name: r.name,
    rating: r.rating,
    ratedGames: r.games
  }));
}

// server/ladder_page.ts
var PLACING_CAP = 20;
var ROW_FORM = 5;
function byPlace(a, b) {
  return b.rating - a.rating || b.games - a.games || (a.createdAt ?? 0) - (b.createdAt ?? 0) || String(a.id).localeCompare(String(b.id));
}
function placedOf(seeds) {
  const out = [];
  for (const s of seeds) {
    if (s.name !== null && s.games >= MIN_RATED_GAMES) out.push({ ...s, name: s.name });
  }
  return out.sort(byPlace);
}
function rowOf2(rank, s, stats, opts) {
  const st = stats.get(s.id);
  const fav = favoriteOf(st);
  let favorite = null;
  if (fav) {
    const forged = opts.forged?.(fav.championId) ?? null;
    favorite = forged ? { ...fav, forged } : fav;
  }
  const bots = opts.bots?.(s.accountId);
  return {
    rank,
    id: s.id,
    accountId: s.accountId,
    ...s.owner !== void 0 ? { owner: s.owner } : {},
    name: s.name,
    rating: s.rating,
    ratedGames: s.games,
    wins: st?.wins ?? 0,
    losses: st?.losses ?? 0,
    form: st?.form.slice(0, ROW_FORM) ?? [],
    favorite,
    ...bots !== void 0 ? { bots } : {}
  };
}
function buildLadderPage(way, seeds, stats, readerId, opts = {}) {
  const cap = opts.cap ?? LADDER_CAP;
  const placed = placedOf(seeds);
  const rows = placed.slice(0, cap).map((s, i) => rowOf2(i + 1, s, stats, opts));
  const myIndex = placed.findIndex((s) => s.accountId === readerId);
  const mine = myIndex === -1 ? seeds.filter((s) => s.accountId === readerId).sort((a, b) => b.games - a.games || b.rating - a.rating)[0] : placed[myIndex];
  const myStats = mine ? stats.get(mine.id) : void 0;
  const me = {
    rank: myIndex === -1 ? null : myIndex + 1,
    rating: mine?.rating ?? BASE_RATING,
    ratedGames: mine?.games ?? 0,
    placed: myIndex !== -1,
    wins: myStats?.wins ?? 0,
    losses: myStats?.losses ?? 0,
    form: myStats?.form ?? []
  };
  if (myIndex >= cap) me.pinned = rowOf2(myIndex + 1, placed[myIndex], stats, opts);
  const placing = [];
  for (const s of seeds) {
    if (s.name === null || s.games <= 0 || s.games >= MIN_RATED_GAMES) continue;
    placing.push({
      id: s.id,
      accountId: s.accountId,
      ...s.owner !== void 0 ? { owner: s.owner } : {},
      name: s.name,
      ratedGames: s.games,
      lastAt: stats.get(s.id)?.lastAt ?? null
    });
  }
  placing.sort((a, b) => b.ratedGames - a.ratedGames || (b.lastAt ?? 0) - (a.lastAt ?? 0));
  return {
    way,
    total: placed.length,
    rows,
    placing: placing.slice(0, opts.placingCap ?? PLACING_CAP),
    me
  };
}
function placeOf(seeds, readerId) {
  const placed = placedOf(seeds);
  const i = placed.findIndex((s) => s.accountId === readerId);
  const mine = i === -1 ? seeds.filter((s) => s.accountId === readerId).sort((a, b) => b.games - a.games || b.rating - a.rating)[0] : placed[i];
  return {
    rank: i === -1 ? null : i + 1,
    rating: mine?.rating ?? BASE_RATING,
    games: mine?.games ?? 0,
    placed: i !== -1,
    total: placed.length
  };
}

// server/home_page.ts
var HOME_LADDER_ROWS = 5;
var HOME_BOT_ROWS = 5;
var HOME_FORGED_CARDS = 6;
function mark(rows, readerId) {
  return rows.map((r) => ({ ...r, mine: r.accountId === readerId }));
}
function latestForged(rows, readerId, splash, cap) {
  return rows.filter((r) => r.status === "finalized" && !r.takenDown).filter((r) => r.listed || r.accountId === readerId).filter((r) => validateForged(r.def).ok).sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id)).slice(0, cap).map((r) => ({
    id: r.id,
    name: r.def.name,
    title: r.def.title,
    role: r.def.role,
    creator: r.def.creator,
    splash: splash(r),
    likes: r.likes,
    updatedAt: r.updatedAt,
    mine: r.accountId === readerId
  }));
}
function careerOf(p) {
  const top = p.perChampion[0];
  return {
    games: p.games,
    wins: p.wins,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    favorite: top ? { championId: top.championId, games: top.games } : null,
    lastAt: p.recent[0]?.at ?? null
  };
}
function buildHomePage(input, readerId, opts = {}) {
  const seedsOf = /* @__PURE__ */ new Map();
  const seeds = (way) => {
    let s = seedsOf.get(way);
    if (!s) {
      s = input.seeds(way);
      seedsOf.set(way, s);
    }
    return s;
  };
  const hand = buildLadderPage("hand", seeds("hand"), input.stats("hand"), readerId, {
    cap: opts.ladderRows ?? HOME_LADDER_ROWS
  });
  const botCap = opts.botRows ?? HOME_BOT_ROWS;
  let botWay = "arena";
  let bots = buildLadderPage("arena", seeds("arena"), input.stats("arena"), readerId, {
    cap: botCap
  });
  if (bots.total === 0) {
    const live = buildLadderPage("bot", seeds("bot"), input.stats("bot"), readerId, {
      cap: botCap
    });
    if (live.total > 0) {
      botWay = "bot";
      bots = live;
    }
  }
  const championOf = /* @__PURE__ */ new Map();
  for (const s of seeds(botWay)) if (s.championId) championOf.set(s.id, s.championId);
  const places = {};
  for (const way of ["hand", "bot", "arena", "forge"]) {
    places[way] = placeOf(seeds(way), readerId);
  }
  return {
    ladder: { way: "hand", total: hand.total, rows: mark(hand.rows, readerId) },
    bots: {
      way: botWay,
      total: bots.total,
      rows: mark(bots.rows, readerId).map((r) => ({
        ...r,
        championId: championOf.get(r.id) ?? null
      }))
    },
    forged: latestForged(
      input.forged,
      readerId,
      opts.splash ?? (() => null),
      opts.forgedCards ?? HOME_FORGED_CARDS
    ),
    me: {
      places,
      career: careerOf(input.career),
      bots: {
        total: input.myBots.length,
        ranked: input.myBots.filter((b) => b.deposited).length
      },
      forged: input.forged.filter((r) => r.accountId === readerId && r.status === "finalized").length
    }
  };
}

// server/landing_page.ts
var LANDING_LADDER_ROWS = 5;
var NO_READER = -1;
function buildLandingPage(input, opts = {}) {
  const cap = opts.rows ?? LANDING_LADDER_ROWS;
  const top = (way) => {
    const page = buildLadderPage(way, input.seeds(way), input.stats(way), NO_READER, { cap });
    return {
      way,
      total: page.total,
      rows: page.rows.map((r) => ({
        rank: r.rank,
        name: r.name,
        rating: r.rating,
        wins: r.wins,
        losses: r.losses,
        owner: way === "hand" ? null : r.owner ?? null
      }))
    };
  };
  let bots = top("arena");
  if (bots.total === 0) {
    const live = top("bot");
    if (live.total > 0) bots = live;
  }
  return { ladder: top("hand"), bots, accounts: input.accounts };
}

// server/login_throttle.ts
var FREE_ATTEMPTS = 3;
var BASE_DELAY_MS = 1e3;
var MAX_DELAY_MS = 3e4;
var FORGET_AFTER_MS = 60 * 6e4;
var LoginThrottle = class {
  constructor(freeAttempts = FREE_ATTEMPTS, baseDelayMs = BASE_DELAY_MS, maxDelayMs = MAX_DELAY_MS) {
    this.freeAttempts = freeAttempts;
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
  }
  freeAttempts;
  baseDelayMs;
  maxDelayMs;
  byKey = /* @__PURE__ */ new Map();
  // How long this key must still wait, 0 when it may try now.
  retryAfterMs(key, now) {
    const f = this.byKey.get(key);
    if (!f) return 0;
    return Math.max(0, f.readyAt - now);
  }
  // The wait a caller must honour, given every key an attempt touches.
  // The longest one wins: passing either gate is not enough.
  retryAfterAny(keys, now) {
    let worst = 0;
    for (const key of keys) worst = Math.max(worst, this.retryAfterMs(key, now));
    return worst;
  }
  // One wrong password. Returns the wait now owed on this key.
  recordFailure(key, now) {
    const f = this.byKey.get(key) ?? { count: 0, readyAt: now, lastAt: now };
    f.count += 1;
    f.lastAt = now;
    const over = f.count - this.freeAttempts;
    const delay = over <= 0 ? 0 : Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** Math.min(over - 1, 20));
    f.readyAt = now + delay;
    this.byKey.set(key, f);
    return delay;
  }
  // A correct password clears the key: the person is who they said, and
  // their next mistake starts from zero again.
  recordSuccess(key) {
    this.byKey.delete(key);
  }
  // Drops keys nobody has failed on for a while. Called on the same sweep
  // that prunes the rest of the server's expiring state.
  purge(now, forgetAfterMs = FORGET_AFTER_MS) {
    let dropped = 0;
    for (const [key, f] of this.byKey) {
      if (now - f.lastAt >= forgetAfterMs && f.readyAt <= now) {
        this.byKey.delete(key);
        dropped++;
      }
    }
    return dropped;
  }
  get trackedKeys() {
    return this.byKey.size;
  }
};
function accountKey(foldedName) {
  return `a:${foldedName}`;
}
function addressKey(address) {
  return `ip:${address}`;
}

// server/mail_messages.ts
var CONFIRM_PATH = "/api/email/confirm";
var RESET_PATH = "/reset";
function publicOrigin(env, allowedOrigins, port) {
  const explicit = env.PUBLIC_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const allowed = allowedOrigins.find((o) => o.startsWith("http"));
  if (allowed) return allowed.replace(/\/+$/, "");
  return `http://localhost:${port}`;
}
function confirmUrl(origin, token) {
  return `${origin}${CONFIRM_PATH}?token=${encodeURIComponent(token)}`;
}
function resetUrl(origin, token) {
  return `${origin}${RESET_PATH}?token=${encodeURIComponent(token)}`;
}
function days(ms) {
  return Math.round(ms / (24 * 60 * 60 * 1e3));
}
function confirmMail(to, name, url, ttlMs) {
  return {
    to,
    subject: "Confirm your Claude of Legends account",
    text: [
      `Someone registered the Claude of Legends account "${name}" with this address.`,
      "",
      "If that was you, confirm it here:",
      url,
      "",
      `The link is good for ${days(ttlMs)} days. Confirming is what makes a forgotten`,
      "password recoverable, and it is what keeps this address reserved for you.",
      "",
      "If it was not you, ignore this mail. The address goes back into",
      `circulation on its own after ${days(ttlMs)} days and the account never touches it.`
    ].join("\n")
  };
}
function resetMail(to, name, url, ttlMs) {
  return {
    to,
    subject: "Reset your Claude of Legends password",
    text: [
      `A password reset was requested for the Claude of Legends account "${name}".`,
      "",
      "Set a new password here:",
      url,
      "",
      `The link is good for ${Math.round(ttlMs / 6e4)} minutes and works once.`,
      "",
      "If you did not ask for this, ignore this mail. Your password has not",
      "changed and nobody can use this link without reading it here."
    ].join("\n")
  };
}

// server/mailer.ts
var SEND_TIMEOUT_MS = 8e3;
var RESEND_ENDPOINT = "https://api.resend.com/emails";
var ResendMailer = class {
  constructor(apiKey, from, endpoint = RESEND_ENDPOINT, fetchImpl = fetch) {
    this.apiKey = apiKey;
    this.from = from;
    this.endpoint = endpoint;
    this.fetchImpl = fetchImpl;
    this.description = `resend, from ${from}`;
  }
  apiKey;
  from;
  endpoint;
  fetchImpl;
  description;
  async send(mail) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
    try {
      const res = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          from: this.from,
          to: [mail.to],
          subject: mail.subject,
          text: mail.text
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        console.error(`mail send refused with ${res.status}`);
        return false;
      }
      return true;
    } catch (err) {
      console.error("mail send failed", err);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
};
var LogMailer = class {
  description = "log only (no MAIL_API_KEY set): links are printed, not sent";
  async send(mail) {
    console.log(`[mail:log-only] to=${mail.to} subject=${mail.subject}
${mail.text}`);
    return true;
  }
};
function mailerFromEnv(env) {
  const key = env.MAIL_API_KEY?.trim();
  const from = env.MAIL_FROM?.trim();
  if (!key || !from) return new LogMailer();
  return new ResendMailer(key, from);
}

// server/snapshot.ts
var round2 = (n) => Math.round(n * 100) / 100;
function ccChips(u, time) {
  const out = [];
  let markStacks = 0;
  for (const s of u.statuses) {
    if (s.until <= time) continue;
    if (s.kind === "stun" || s.kind === "root" || s.kind === "recall" || s.kind === "airborne" || s.kind === "untargetable") {
      out.push({ k: s.kind });
    } else if (s.kind === "slow") out.push({ k: "slow", v: round2(s.pct) });
    else if (s.kind === "shield" && s.remaining > 0)
      out.push({ k: "shield", v: Math.round(s.remaining) });
    else if (s.kind === "mark") markStacks += s.stacks;
  }
  if (markStacks > 0) out.push({ k: "mark", v: markStacks });
  return out;
}
function statusValue(s) {
  switch (s.kind) {
    case "slow":
      return round2(s.pct);
    case "shield":
      return Math.round(s.remaining);
    case "mark":
      return s.stacks;
    case "dot":
      return s.perSecond;
    case "grievous":
      return round2(s.factor);
    default:
      return void 0;
  }
}
function buildSnapshot(sim, team2, selfUnitId, known, events) {
  const units = [];
  const visibleNow = /* @__PURE__ */ new Set();
  const knownBefore = new Set(known);
  for (const u of sim.units.values()) {
    if (!sim.isVisible(team2, u.id)) continue;
    visibleNow.add(u.id);
    const snap2 = {
      i: u.id,
      x: round2(u.pos.x),
      z: round2(u.pos.z),
      h: Math.round(u.hp),
      m: Math.round(u.maxHp)
    };
    if (u.kind === "champion") snap2.l = u.level;
    if (u.dead) snap2.d = 1;
    const cc = ccChips(u, sim.time);
    if (cc.length > 0) snap2.st = cc;
    if (u.pendingSpell) {
      snap2.w = {
        k: u.pendingSpell.key,
        x: round2(u.pendingSpell.aim.x),
        z: round2(u.pendingSpell.aim.z),
        u: round2(u.pendingSpell.resolveAt)
      };
    }
    if (u.play !== null && u.team === team2) snap2.p = u.play;
    if (u.coachOrder !== null && u.team === team2) snap2.co = u.coachOrder;
    if (!known.has(u.id)) {
      known.add(u.id);
      snap2.k = u.kind;
      snap2.t = u.team;
      snap2.c = u.championId;
      if (u.kind === "champion") snap2.sk = u.skin;
      snap2.r = u.radius;
      snap2.rg = u.stats.attackRange;
      if (u.structure) snap2.s = u.structure;
      if (u.kind === "creature" && u.creatureId) {
        snap2.cr = u.creatureId;
        if (u.aspect) snap2.a = u.aspect;
        if (u.ascendant) snap2.asc = 1;
      }
      if (u.kind === "camp" && u.campKind) snap2.ck = u.campKind;
    }
    units.push(snap2);
  }
  const gone = [];
  for (const id of known) {
    if (!visibleNow.has(id)) {
      gone.push(id);
      known.delete(id);
    }
  }
  const projectiles = [];
  for (const p of sim.projectiles.values()) {
    if (p.team !== team2 && !sim.isPointVisible(team2, p.pos.x, p.pos.z)) continue;
    const rec = {
      i: p.id,
      x: round2(p.pos.x),
      z: round2(p.pos.z),
      r: p.radius,
      t: p.team
    };
    if (p.vfx) rec.v = p.vfx;
    if (p.sourceId) rec.s = p.sourceId;
    projectiles.push(rec);
  }
  const zones = [];
  for (const z of sim.zones.values()) {
    if (z.team !== team2 && !sim.isPointVisible(team2, z.pos.x, z.pos.z)) continue;
    const rec = {
      i: z.id,
      x: round2(z.pos.x),
      z: round2(z.pos.z),
      r: z.radius,
      t: z.team
    };
    if (z.vfx) rec.v = z.vfx;
    zones.push(rec);
  }
  const walls = [];
  for (const w of sim.walls.values()) {
    walls.push({
      i: w.id,
      x1: round2(w.a.x),
      z1: round2(w.a.z),
      x2: round2(w.b.x),
      z2: round2(w.b.z),
      t: w.team,
      u: round2(w.until)
    });
  }
  let self = null;
  const selfUnit = sim.units.get(selfUnitId);
  if (selfUnit) {
    self = {
      mana: Math.round(selfUnit.mana),
      maxMana: Math.round(selfUnit.maxMana),
      ad: Math.round(selfUnit.stats.ad),
      gold: Math.floor(selfUnit.gold),
      level: selfUnit.level,
      xp: Math.round(selfUnit.xp),
      dead: selfUnit.dead,
      respawnAt: round2(selfUnit.respawnAt),
      cooldowns: { ...selfUnit.cooldowns },
      // Effective ranks: R already reads 1 at level 6 pre-investment.
      abilityRanks: {
        Q: effectiveRank(selfUnit, "Q"),
        W: effectiveRank(selfUnit, "W"),
        E: effectiveRank(selfUnit, "E"),
        R: effectiveRank(selfUnit, "R")
      },
      skillPoints: selfUnit.skillPoints,
      sigilCooldowns: [...selfUnit.sigilCooldowns],
      items: [...selfUnit.items],
      sigils: [...selfUnit.sigils],
      statuses: selfUnit.statuses.filter((s) => s.until > sim.time).map((s) => ({ k: s.kind, until: round2(s.until), v: statusValue(s) }))
    };
    const boon = sim.teamBuff(team2);
    if (boon) {
      self.boonUntil = round2(boon.until);
      self.boonStacks = boon.stacks;
    }
    const enemyBoon = sim.teamBuff(1 - team2);
    if (enemyBoon) {
      self.enemyBoonUntil = round2(enemyBoon.until);
      self.enemyBoonStacks = enemyBoon.stacks;
    }
    const wrath = sim.teamWrath(team2);
    if (wrath !== null) self.wrathUntil = round2(wrath);
    const enemyWrath = sim.teamWrath(1 - team2);
    if (enemyWrath !== null) self.enemyWrathUntil = round2(enemyWrath);
    const favors = sim.teamFavors(team2);
    if (hasAnyFavor(favors)) self.favors = favors;
    const enemyFavors = sim.teamFavors(1 - team2);
    if (hasAnyFavor(enemyFavors)) self.enemyFavors = enemyFavors;
  }
  const snapEvents = [];
  for (const ev of events) {
    if (ev.type === "death") {
      const victim = sim.units.get(ev.unitId);
      const isChampion = victim?.kind === "champion";
      if (isChampion || knownBefore.has(ev.unitId)) {
        snapEvents.push({ e: "death", unitId: ev.unitId, killerId: ev.killerId });
      }
    } else if (ev.type === "gold" && ev.unitId === selfUnitId) {
      snapEvents.push({ e: "gold", amount: ev.amount });
    } else if (ev.type === "damage" && ev.sourceId === selfUnitId && ev.targetId !== selfUnitId) {
      snapEvents.push({ e: "dmg", targetId: ev.targetId, amount: Math.round(ev.amount) });
    } else if (ev.type === "cast" && sim.isVisible(team2, ev.unitId)) {
      snapEvents.push({ e: "cast", unitId: ev.unitId, k: ev.key });
    } else if (ev.type === "sigil" && sim.isVisible(team2, ev.unitId)) {
      snapEvents.push({ e: "cast", unitId: ev.unitId });
    } else if (ev.type === "attack" && sim.isVisible(team2, ev.unitId)) {
      snapEvents.push({ e: "atk", unitId: ev.unitId, targetId: ev.targetId });
    } else if (ev.type === "victory") {
      snapEvents.push({ e: "victory", team: ev.team });
    }
  }
  return {
    t: "snap",
    time: round2(sim.time),
    units,
    gone,
    projectiles,
    zones,
    walls,
    self,
    events: snapEvents,
    winner: sim.winner,
    objAt: sim.objectiveSpawnAt(),
    // The live Warden's pit; nothing before the rise (ADR 0023).
    ...sim.objectives.wardenId !== null ? { objPit: sim.objectives.pit } : {},
    rings: sim.ringClocks().map((c) => ({
      r: c.ring,
      u: c.unitId,
      at: c.riseAt,
      a: c.aspect,
      ...c.ascendant ? { asc: 1 } : {},
      ...c.roseAt !== null ? { ro: round2(c.roseAt) } : {}
    }))
  };
}

// server/match.ts
var AFK_IDLE_TICKS = 20 * 120;
var MAX_SPECTATORS = 10;
var Match = class {
  sim;
  seed;
  players = /* @__PURE__ */ new Map();
  spectators = /* @__PURE__ */ new Map();
  // What a replay needs: the exact picks and every event that steered the
  // sim (src/net/replay.ts rebuilds the match from these plus the seed).
  replayPicks;
  replayEvents = [];
  // The match's forged definitions, unique and in pick order: what match
  // setup distributes to every client and what the saved replay embeds.
  forgedDefs;
  unitNames = /* @__PURE__ */ new Map();
  pickUnitIds;
  // Seats a bot holds from the start that a newcomer may take (ADR 0025):
  // house bots, and ranked bots the fill seated from the pool. A seat a
  // dropped player left to a stand-in is not here: it is held for them.
  botSeats = /* @__PURE__ */ new Map();
  eventsThisTick = [];
  constructor(seed, picks) {
    this.seed = seed;
    this.replayPicks = picks.map((p) => ({
      name: p.name,
      team: p.team,
      championId: p.championId,
      sigils: [p.sigils[0], p.sigils[1]],
      ...p.skin !== void 0 ? { skin: p.skin } : {},
      ...p.bot !== void 0 ? { bot: p.bot } : {},
      ...p.playbook !== void 0 ? { playbook: p.playbook } : {}
    }));
    const forged = /* @__PURE__ */ new Map();
    for (const p of picks) {
      if (p.forged && !forged.has(p.forged.id)) forged.set(p.forged.id, p.forged);
    }
    this.forgedDefs = [...forged.values()];
    const { sim, unitIds } = buildMatchSim(starOrchard(), seed, this.replayPicks, this.forgedDefs);
    this.sim = sim;
    this.pickUnitIds = unitIds;
    picks.forEach((p, i) => {
      const unitId = unitIds[i];
      this.unitNames.set(unitId, p.name);
      if (p.bot || p.ownerId !== void 0) {
        this.botSeats.set(unitId, { team: p.team, pool: p.ownerId !== void 0 });
        return;
      }
      this.players.set(p.clientId, {
        clientId: p.clientId,
        name: p.name,
        team: p.team,
        unitId,
        known: /* @__PURE__ */ new Set(),
        lastCommandAt: 0,
        coach: p.playbook !== void 0
      });
    });
  }
  // The unit a pick became, by its index in pick order (the ids are
  // allocated in that order): for seats nobody is connected behind.
  unitIdOfPick(index) {
    return this.pickUnitIds[index];
  }
  // Connected players whose last command is older than maxIdleTicks.
  idleClientIds(maxIdleTicks) {
    const out = [];
    for (const p of this.players.values()) {
      if (p.coach) continue;
      if (this.sim.tickCount - p.lastCommandAt > maxIdleTicks) out.push(p.clientId);
    }
    return out;
  }
  recordReplay(ev) {
    if (this.replayEvents.length < REPLAY_EVENT_CAP) this.replayEvents.push(ev);
  }
  // True when the log stayed within bounds and is worth saving.
  get replayComplete() {
    return this.replayEvents.length < REPLAY_EVENT_CAP;
  }
  // Client ids on the same team as the sender. Chat and pings route through
  // this: the snapshot layer is fog-scoped, so the social layer must be
  // team-scoped too or a ping leaks a map coordinate to the enemy.
  teamRecipients(senderClientId) {
    const sender = this.players.get(senderClientId);
    if (!sender) return [];
    return [...this.players.values()].filter((p) => p.team === sender.team).map((p) => p.clientId);
  }
  // A dropped player's champion keeps fighting: the seat is handed to the
  // default bot policy instead of standing inert for the rest of the match,
  // and the scoreboard row says so. Returns the seat, for the team notice
  // and the rejoin reservation.
  handleDisconnect(clientId) {
    const p = this.players.get(clientId);
    if (!p) return null;
    this.players.delete(clientId);
    if (p.coach) return { name: p.name, team: p.team, unitId: p.unitId, coach: true };
    attachBot(this.sim, p.unitId, void 0);
    this.recordReplay({ k: this.sim.tickCount, u: p.unitId, e: "bot_on" });
    this.unitNames.set(p.unitId, `${p.name} (bot)`);
    return { name: p.name, team: p.team, unitId: p.unitId };
  }
  // The reverse: a reconnected player takes the seat back from the bot.
  // The fresh known set makes the snapshot layer resend every identity, so
  // the new mirror world starts complete.
  restorePlayer(clientId, seat) {
    if (!seat.coach) {
      this.sim.detachPolicy(seat.unitId);
      this.recordReplay({ k: this.sim.tickCount, u: seat.unitId, e: "bot_off" });
      this.unitNames.set(seat.unitId, seat.name);
    }
    this.players.set(clientId, {
      clientId,
      name: seat.name,
      team: seat.team,
      unitId: seat.unitId,
      known: /* @__PURE__ */ new Set(),
      // A fresh idle clock: a rejoin must not be flagged AFK on arrival.
      lastCommandAt: this.sim.tickCount,
      coach: seat.coach === true
    });
  }
  // How many bot seats a newcomer could still take.
  get openBotSeats() {
    return this.botSeats.size;
  }
  // A newcomer takes a bot's seat (ADR 0025): the side with fewer people
  // on it (server/drop_in.ts), a house bot before a ranked one, the lowest
  // unit id first so the choice never depends on anything but the match.
  // The champion comes as the bot left it: its level, its gold, its items.
  // Returns the seat, or null when no bot seat is left.
  takeBotSeat(clientId, name) {
    const humans = [0, 0];
    for (const p of this.players.values()) humans[p.team] += 1;
    const seats = [0, 0];
    for (const s of this.botSeats.values()) seats[s.team] += 1;
    const team2 = dropInTeam(humans, seats);
    if (team2 === null) return null;
    const chosen = [...this.botSeats].filter(([, s]) => s.team === team2).sort(([ua, a], [ub, b]) => Number(a.pool) - Number(b.pool) || ua - ub)[0]?.[0];
    if (chosen === void 0) return null;
    const pool = this.botSeats.get(chosen)?.pool === true;
    this.botSeats.delete(chosen);
    this.restorePlayer(clientId, { name, team: team2, unitId: chosen });
    return { unitId: chosen, team: team2, pool };
  }
  // Scoreboard rows carrying the seat's real player or bot name alongside
  // the champion name the sim already put in `name`.
  buildScore() {
    const rows = this.sim.scoreboard().map((r) => ({
      ...r,
      player: this.unitNames.get(r.unitId) ?? null
    }));
    return { t: "score", rows };
  }
  tick() {
    this.eventsThisTick = this.sim.tick();
  }
  // The last tick's events, for the play ledger a bot seat's Record wants.
  get lastEvents() {
    return this.eventsThisTick;
  }
  handleCommand(clientId, msg) {
    const p = this.players.get(clientId);
    if (!p) return;
    if (p.coach !== (msg.t === "order")) return;
    p.lastCommandAt = this.sim.tickCount;
    this.recordReplay({ k: this.sim.tickCount, u: p.unitId, e: "cmd", c: msg });
    applySimCommand(this.sim, p.team, p.unitId, msg);
  }
  buildSnapshotFor(clientId) {
    const p = this.players.get(clientId);
    if (!p) return null;
    return buildSnapshot(this.sim, p.team, p.unitId, p.known, this.eventsThisTick);
  }
  // Spectators: seatless viewers on one team's fog. selfUnitId 0 makes the
  // snapshot builder ship self null and no personal events; their known
  // sets live here so identities resend per spectator like any client.
  addSpectator(clientId, team2) {
    if (this.spectators.size >= MAX_SPECTATORS) return false;
    this.spectators.set(clientId, { team: team2 === 1 ? 1 : 0, known: /* @__PURE__ */ new Set() });
    return true;
  }
  removeSpectator(clientId) {
    this.spectators.delete(clientId);
  }
  buildSpectatorSnapshotFor(clientId) {
    const s = this.spectators.get(clientId);
    if (!s) return null;
    return buildSnapshot(this.sim, s.team, 0, s.known, this.eventsThisTick);
  }
};

// server/matchmaker.ts
var import_node_crypto7 = require("node:crypto");

// server/party.ts
function packGroups(sizes, target, teamCap, opts) {
  const seated = [];
  const used = [0, 0];
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    if (used[0] + used[1] + size > target) continue;
    const first2 = used[0] <= used[1] ? 0 : 1;
    const second = first2 === 0 ? 1 : 0;
    let team2 = null;
    if (used[first2] + size <= teamCap) team2 = first2;
    else if (used[second] + size <= teamCap) team2 = second;
    if (team2 === null) continue;
    used[team2] += size;
    seated.push({ index: i, team: team2 });
    if (used[0] + used[1] === target) break;
  }
  if (opts.exact && used[0] + used[1] !== target) return null;
  return seated;
}

// server/matchmaker.ts
var MATCH_SIZE = 10;
var TEAM_CAP = MATCH_SIZE / 2;
var SELECT_SECONDS = 45;
var DEFAULT_SIGILS = ["riftstep", "mend"];
var LOBBY_TTL_MS = 30 * 6e4;
var CODE_LETTERS = "ABCDEFGHJKMNPQRSTUVWXYZ";
function randomCode() {
  let code = "";
  for (let i = 0; i < 5; i++) code += CODE_LETTERS[(0, import_node_crypto7.randomInt)(CODE_LETTERS.length)];
  return code;
}
var Matchmaker = class {
  constructor(send2, onMatchReady2, codeGen = randomCode, opts = {}) {
    this.send = send2;
    this.onMatchReady = onMatchReady2;
    this.codeGen = codeGen;
    this.opts = opts;
  }
  send;
  onMatchReady;
  codeGen;
  opts;
  queue = [];
  lobbies = /* @__PURE__ */ new Map();
  selects = [];
  // People waiting in the queue right now (the drop-in rule and the
  // landing's presence line read it, ADR 0025).
  get queuedCount() {
    return this.queuedSeats();
  }
  queuedSeats() {
    let seats = 0;
    for (const g of this.queue) seats += g.members.length;
    return seats;
  }
  broadcastQueue() {
    const startsIn = null;
    const count3 = this.queuedSeats();
    for (const g of this.queue) {
      for (const p of g.members) {
        this.send(p.clientId, {
          t: "queue_status",
          count: count3,
          needed: MATCH_SIZE,
          startsIn,
          ready: g.botReady
        });
      }
    }
  }
  inSelect(clientId) {
    for (const s of this.selects) {
      if (!s.started && s.entries.some((e) => e.clientId === clientId)) return s;
    }
    return null;
  }
  addToQueue(clientId, name, now) {
    this.removeEverywhere(clientId, now);
    this.queue.push({ members: [{ clientId, name }], botReady: false });
    this.tryFormFullMatch(now);
    this.broadcastQueue();
  }
  // A whole lobby enters the public queue as one group on one side. Only
  // the host may pull the trigger, and a party larger than a team cannot
  // queue (a full lobby should start its own match).
  queuePartyFromLobby(hostId, now) {
    for (const lobby of this.lobbies.values()) {
      if (lobby.hostId !== hostId) continue;
      if (lobby.players.length > TEAM_CAP) {
        this.send(hostId, {
          t: "error",
          message: "A party of up to five can queue together; a full lobby starts its own match."
        });
        return;
      }
      this.lobbies.delete(lobby.code);
      this.queue.push({
        members: lobby.players.map((p) => ({ clientId: p.clientId, name: p.name })),
        botReady: false
      });
      this.tryFormFullMatch(now);
      this.broadcastQueue();
      return;
    }
  }
  // Ten seats worth of whole groups: seat them (parties stay together)
  // and take those groups out of the queue. Groups that do not pack wait.
  tryFormFullMatch(now) {
    if (this.queuedSeats() < MATCH_SIZE) return;
    const seated = packGroups(
      this.queue.map((g) => g.members.length),
      MATCH_SIZE,
      TEAM_CAP,
      { exact: true }
    );
    if (!seated) return;
    const players = [];
    for (const s of seated) {
      for (const m of this.queue[s.index].members) players.push({ ...m, team: s.team });
    }
    for (const s of [...seated].sort((a, b) => b.index - a.index)) this.queue.splice(s.index, 1);
    this.startSelect(players, now, "queue");
  }
  // Seat every bot-ready group into as many bot-filled matches as needed
  // (successive loose packs; a party never splits).
  startReadyGroups(now) {
    for (; ; ) {
      const ready = this.queue.filter((g) => g.botReady);
      if (ready.length === 0) return;
      const seated = packGroups(
        ready.map((g) => g.members.length),
        MATCH_SIZE,
        TEAM_CAP,
        { exact: false }
      );
      if (!seated || seated.length === 0) return;
      const players = [];
      for (const s of seated) {
        const group = ready[s.index];
        for (const m of group.members) players.push({ ...m, team: s.team });
        this.queue.splice(this.queue.indexOf(group), 1);
      }
      this.startSelect(players, now, "queue");
    }
  }
  // The bot fill: whoever presses Start takes EVERYONE queued along, at
  // once, into as few bot-filled matches as the groups pack into. It used
  // to take only volunteers and leave the rest queued behind a ten-second
  // countdown for a human match, which on a server where two people are
  // rarely queued at the same moment meant the second one missed the
  // first (ADR 0025). Nobody queues here to wait for ten humans.
  startNow(clientId, now) {
    if (!this.queue.some((g) => g.members.some((m) => m.clientId === clientId))) return;
    for (const g of this.queue) g.botReady = true;
    this.startReadyGroups(now);
    this.broadcastQueue();
  }
  createLobby(clientId, name, now = Date.now()) {
    this.removeEverywhere(clientId, now);
    let code = this.codeGen();
    for (let guard = 0; this.lobbies.has(code) && guard < 50; guard++) code = this.codeGen();
    if (this.lobbies.has(code)) {
      this.send(clientId, { t: "error", message: "Could not create a lobby, try again." });
      return;
    }
    const lobby = {
      code,
      hostId: clientId,
      players: [{ clientId, name, team: 0 }],
      createdAt: now
    };
    this.lobbies.set(code, lobby);
    this.broadcastLobby(lobby);
  }
  joinLobby(clientId, name, code) {
    const lobby = this.lobbies.get(code.toUpperCase());
    if (!lobby || lobby.players.length >= MATCH_SIZE) {
      this.send(clientId, { t: "error", message: "Lobby not found or full." });
      return;
    }
    this.removeEverywhere(clientId);
    const count0 = lobby.players.filter((p) => p.team === 0).length;
    const count1 = lobby.players.length - count0;
    lobby.players.push({ clientId, name, team: count0 <= count1 ? 0 : 1 });
    this.broadcastLobby(lobby);
  }
  // A lobby member picks their side. A full side refuses silently: the
  // client greys the button out, and the 'error' channel would tear the
  // lobby screen down (it is reserved for closed and expired lobbies).
  setLobbyTeam(clientId, team2) {
    if (team2 !== 0 && team2 !== 1) return;
    for (const lobby of this.lobbies.values()) {
      const entry = lobby.players.find((p) => p.clientId === clientId);
      if (!entry) continue;
      if (entry.team === team2) return;
      if (lobby.players.filter((p) => p.team === team2).length >= TEAM_CAP) return;
      entry.team = team2;
      this.broadcastLobby(lobby);
      return;
    }
  }
  startLobby(clientId, now) {
    for (const lobby of this.lobbies.values()) {
      if (lobby.hostId !== clientId) continue;
      this.lobbies.delete(lobby.code);
      this.startSelect(lobby.players, now, "lobby");
      return;
    }
  }
  broadcastLobby(lobby) {
    for (const p of lobby.players) {
      this.send(p.clientId, {
        t: "lobby",
        code: lobby.code,
        host: p.clientId === lobby.hostId,
        team: p.team,
        players: lobby.players.map((x) => ({ name: x.name, team: x.team }))
      });
    }
  }
  // Queue entries alternate sides by position; lobby entries carry the side
  // their players chose and keep it.
  startSelect(players, now, source) {
    if (players.length === 0) return;
    const session = {
      entries: players.map((p, i) => ({
        clientId: p.clientId,
        name: p.name,
        team: p.team ?? i % 2,
        locked: null
      })),
      deadline: now + SELECT_SECONDS * 1e3,
      started: false,
      source
    };
    this.selects.push(session);
    const roster = session.entries.map((e) => ({ name: e.name, team: e.team }));
    for (const e of session.entries) {
      this.send(e.clientId, {
        t: "select_start",
        team: e.team,
        players: roster,
        deadline: session.deadline,
        ...this.opts.forge ? { forge: true } : {}
      });
    }
  }
  pick(clientId, championId, sigils, skin, botId) {
    const session = this.inSelect(clientId);
    if (!session) return;
    const entry = session.entries.find((e) => e.clientId === clientId);
    if (!entry) return;
    let seat = null;
    if (typeof botId === "string" && this.opts.resolveBot) {
      seat = this.opts.resolveBot(clientId, botId);
      if (seat) {
        championId = seat.championId;
        sigils = seat.sigils;
        skin = seat.skin;
      }
    }
    let champ = CHAMPIONS[championId] ? championId : DEFAULT_CHAMPION_ID;
    let forged;
    if (!CHAMPIONS[championId] && this.opts.forge) {
      const def = this.opts.resolveForged?.(clientId, championId) ?? null;
      if (def) {
        champ = championId;
        forged = def;
      }
    }
    const playable = forged ? null : this.opts.resolvePlayable?.(clientId) ?? null;
    const mayPick = (id) => playable === null || playable.includes(id);
    if (!mayPick(champ)) {
      champ = playable?.[0] ?? DEFAULT_CHAMPION_ID;
      seat = null;
    }
    const teamTaken = session.entries.filter((e) => e.team === entry.team && e.clientId !== clientId && e.locked).map((e) => e.locked?.championId);
    if (teamTaken.includes(champ)) {
      champ = CHAMPION_LIST.find((c) => !teamTaken.includes(c.id) && mayPick(c.id))?.id ?? DEFAULT_CHAMPION_ID;
      forged = void 0;
      seat = null;
    }
    const valid = Array.isArray(sigils) && sigils.length === 2 && sigils[0] !== sigils[1] && sigils.every((s) => typeof s === "string" && SIGILS[s]);
    entry.locked = {
      championId: champ,
      sigils: valid ? [sigils[0], sigils[1]] : DEFAULT_SIGILS,
      skin: clampSkin(champ, skin),
      ...forged ? { forged } : {},
      ...seat ? {
        playbook: seat.playbook,
        botName: seat.name,
        botId: seat.botId,
        botVersion: seat.version
      } : {}
    };
    const locked = session.entries.filter((e) => e.locked).length;
    for (const e of session.entries) {
      const taken = session.entries.filter((o) => o.team === e.team && o.locked).map((o) => o.locked?.championId ?? "");
      this.send(e.clientId, {
        t: "select_update",
        locked,
        total: session.entries.length,
        taken
      });
    }
    if (locked === session.entries.length) this.finishSelect(session);
  }
  // Expires select deadlines, stale lobbies, and the bot-fill countdown;
  // call regularly with the current wall clock.
  tickClock(now) {
    for (const lobby of [...this.lobbies.values()]) {
      if (now - lobby.createdAt > LOBBY_TTL_MS) {
        this.lobbies.delete(lobby.code);
        for (const p of lobby.players) {
          this.send(p.clientId, { t: "error", message: "Lobby expired." });
        }
      }
    }
    for (const session of this.selects) {
      if (!session.started && now >= session.deadline) this.finishSelect(session);
    }
  }
  finishSelect(session) {
    if (session.started) return;
    session.started = true;
    const idx = this.selects.indexOf(session);
    if (idx !== -1) this.selects.splice(idx, 1);
    const picks = session.entries.map((e) => ({
      clientId: e.clientId,
      name: e.locked?.botName ? `${e.name} (${e.locked.botName})` : e.name,
      team: e.team,
      championId: e.locked?.championId ?? DEFAULT_CHAMPION_ID,
      sigils: e.locked?.sigils ?? DEFAULT_SIGILS,
      skin: e.locked?.skin ?? 0,
      ...e.locked?.forged ? { forged: e.locked.forged } : {},
      ...e.locked?.playbook ? { playbook: e.locked.playbook } : {},
      ...e.locked?.botId !== void 0 ? { botId: e.locked.botId } : {},
      ...e.locked?.botVersion !== void 0 ? { botVersion: e.locked.botVersion } : {}
    }));
    this.onMatchReady(picks, session.source);
  }
  // The clock is no longer read here (the queue has no countdown left to
  // cancel, ADR 0025); callers still pass it, so the signature stays.
  removeEverywhere(clientId, _now = Date.now()) {
    const qg = this.queue.find((g) => g.members.some((m) => m.clientId === clientId));
    if (qg) {
      qg.members.splice(
        qg.members.findIndex((m) => m.clientId === clientId),
        1
      );
      if (qg.members.length === 0) this.queue.splice(this.queue.indexOf(qg), 1);
      this.broadcastQueue();
    }
    for (const lobby of [...this.lobbies.values()]) {
      const li = lobby.players.findIndex((p) => p.clientId === clientId);
      if (li === -1) continue;
      lobby.players.splice(li, 1);
      if (lobby.players.length === 0 || lobby.hostId === clientId) {
        this.lobbies.delete(lobby.code);
        for (const p of lobby.players) {
          this.send(p.clientId, { t: "error", message: "Lobby closed." });
        }
      } else {
        this.broadcastLobby(lobby);
      }
    }
    const session = this.inSelect(clientId);
    if (session) {
      const entry = session.entries.find((e) => e.clientId === clientId);
      if (entry && !entry.locked) {
        entry.locked = { championId: DEFAULT_CHAMPION_ID, sigils: DEFAULT_SIGILS, skin: 0 };
        if (session.entries.every((e) => e.locked)) this.finishSelect(session);
      }
    }
  }
};

// src/sim/playbook/patch.ts
function isRecord5(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isPatchOp(raw) {
  if (!isRecord5(raw)) return false;
  switch (raw.op) {
    case "add":
      return isRecord5(raw.play);
    case "remove":
      return typeof raw.id === "string";
    case "move":
      return typeof raw.id === "string" && (typeof raw.before === "string" || raw.before === null);
    case "set":
      return typeof raw.id === "string" && isRecord5(raw.play);
    case "kit":
      return isRecord5(raw.kit);
    case "lanes":
      return Array.isArray(raw.lanes) || raw.lanes === null;
    case "replace":
      return isRecord5(raw.playbook);
    default:
      return false;
  }
}
function indexOf(plays, id) {
  return plays.findIndex((p) => p.id === id);
}
function finish(v) {
  return v.ok ? { ok: true, def: v.def } : { ok: false, error: v.errors.join("; ") };
}
function applyPatchOp(def, op) {
  const plays = def.plays.map((p) => ({ ...p }));
  const rest = {
    ...def.kit ? { kit: def.kit } : {},
    ...def.lanes ? { lanes: def.lanes } : {}
  };
  const withPlays = (next) => finish(validatePlaybook({ version: def.version, plays: next, ...rest }));
  switch (op.op) {
    case "add": {
      const play2 = op.play;
      if (typeof play2.id === "string" && indexOf(plays, play2.id) >= 0) {
        return { ok: false, error: `a play named "${play2.id}" already exists` };
      }
      if (op.before !== void 0 && op.before !== null) {
        const at = indexOf(plays, op.before);
        if (at < 0) return { ok: false, error: `no play named "${op.before}" to insert before` };
        plays.splice(at, 0, play2);
      } else {
        plays.push(play2);
      }
      return withPlays(plays);
    }
    case "remove": {
      const at = indexOf(plays, op.id);
      if (at < 0) return { ok: false, error: `no play named "${op.id}" to remove` };
      plays.splice(at, 1);
      return withPlays(plays);
    }
    case "move": {
      const at = indexOf(plays, op.id);
      if (at < 0) return { ok: false, error: `no play named "${op.id}" to move` };
      const [moved] = plays.splice(at, 1);
      if (op.before === null) plays.push(moved);
      else {
        const to = indexOf(plays, op.before);
        if (to < 0) return { ok: false, error: `no play named "${op.before}" to move before` };
        plays.splice(to, 0, moved);
      }
      return withPlays(plays);
    }
    case "set": {
      const at = indexOf(plays, op.id);
      if (at < 0) return { ok: false, error: `no play named "${op.id}" to change` };
      const patch = op.play;
      const next = { ...plays[at] };
      for (const key of ["when", "do", "enabled"]) {
        if (patch[key] !== void 0) next[key] = patch[key];
      }
      plays[at] = next;
      return withPlays(plays);
    }
    case "kit": {
      const patch = op.kit;
      const next = { ...def.kit ?? {} };
      for (const key of ["build", "skills", "variants"]) {
        if (patch[key] === void 0) continue;
        if (patch[key] === null) delete next[key];
        else next[key] = patch[key];
      }
      return finish(
        validatePlaybook({
          version: Math.max(def.version, 2),
          plays,
          ...Object.keys(next).length > 0 ? { kit: next } : {},
          ...def.lanes ? { lanes: def.lanes } : {}
        })
      );
    }
    case "lanes":
      return finish(
        validatePlaybook({
          version: Math.max(def.version, 3),
          plays,
          ...def.kit ? { kit: def.kit } : {},
          ...op.lanes && op.lanes.length > 0 ? { lanes: op.lanes } : {}
        })
      );
    case "replace":
      return finish(validatePlaybook(op.playbook));
  }
}
function applyPatch(def, ops) {
  let current = def;
  let applied = 0;
  for (const op of ops) {
    const r = applyPatchOp(current, op);
    if (!r.ok) return { def: current, applied, refused: { op, error: r.error } };
    current = r.def;
    applied += 1;
  }
  return { def: current, applied, refused: null };
}

// server/night_eligibility.ts
var DAY_MS4 = 24 * 60 * 60 * 1e3;
var COACH_IDLE_DAYS = 7;
function coachEligible(seenAt, now, idleDays = COACH_IDLE_DAYS) {
  if (idleDays <= 0) return true;
  if (seenAt === null) return false;
  return now - seenAt <= idleDays * DAY_MS4;
}

// server/night_coach.ts
var DAY_MS5 = 24 * 60 * 60 * 1e3;
var SPARRING_PER_SIDE = 3;
var SPARRING_MAX_TICKS = 20 * 60 * 40;
function botMatchesSince(records, accountId, since) {
  const out = [];
  for (const rec of records) {
    if (rec.queue !== "arena" || rec.at < since) continue;
    const me = rec.players.find((p) => p.accountId === accountId && p.way === "bot");
    if (!me) continue;
    out.push({
      at: rec.at,
      win: me.team === rec.winner,
      delta: me.ratingDelta ?? 0,
      ...rec.replayId !== void 0 ? { replayId: rec.replayId, matchId: rec.replayId } : {}
    });
  }
  return out.sort((a, b) => a.at - b.at);
}
function sumPlays(reports) {
  const out = {};
  for (const { report: report2, unitId } of reports) {
    const mine = report2.units.find((u) => u.unitId === unitId);
    if (!mine) continue;
    for (const [id, s] of Object.entries(mine.plays)) {
      const acc2 = out[id] ?? { ticks: 0, deaths: 0 };
      out[id] = { ticks: acc2.ticks + s.ticks, deaths: acc2.deaths + s.deaths };
    }
  }
  return out;
}
function briefingPrompt(bot, matches2, plays) {
  const wins = matches2.filter((m) => m.win).length;
  const delta = matches2.reduce((n, m) => n + m.delta, 0);
  const lines = Object.entries(plays).sort((a, b) => b[1].ticks - a[1].ticks).map(([id, s]) => `${id}: ${Math.round(s.ticks / 20)} s active, ${s.deaths} death(s)`);
  return [
    `Nightly review of the bot "${bot.name}" after its Arena matches: ${wins} won, ${matches2.length - wins} lost, Arena rating ${delta >= 0 ? "+" : ""}${delta}.`,
    `Time and deaths per play over those matches:
${lines.join("\n") || "(no play data)"}`,
    "Propose the smallest patch that would have helped, from what the plays and deaths say. If nothing clearly would, answer with the comment line only and no operations."
  ].join("\n\n");
}
async function sparringGate(deps, seatIndex, picks, current, candidate, seedBase) {
  const per = deps.sparringPerSide ?? SPARRING_PER_SIDE;
  const team2 = picks[seatIndex]?.team ?? 0;
  const wins = async (playbook) => {
    let n = 0;
    for (let i = 0; i < per; i++) {
      const trial = picks.map((p, j) => j === seatIndex ? { ...p, playbook } : p);
      const r = await deps.runner.run({
        seed: seedBase + i,
        picks: trial,
        maxTicks: deps.maxTicks ?? SPARRING_MAX_TICKS
      });
      if (r.winner === team2) n += 1;
    }
    return n;
  };
  const currentWins = await wins(current);
  const candidateWins = await wins(candidate);
  return { currentWins, candidateWins, matches: per * 2 };
}
async function coachBotOvernight(deps, bot) {
  const now = (deps.now ?? Date.now)();
  const since = deps.store.botLastCoachedAt(bot.id) ?? now - DAY_MS5;
  const matches2 = botMatchesSince(deps.records(), bot.accountId, since);
  if (matches2.length === 0) return `${bot.name}: no Arena match since the last briefing`;
  deps.store.setBotLastCoachedAt(bot.id, now);
  const reports = deps.store.listBotReports(bot.id, since);
  const plays = sumPlays(reports);
  if (!deps.coach) return `${bot.name}: no coach configured, report only`;
  if (deps.ownerSeenAt && !coachEligible(deps.ownerSeenAt(bot.accountId), now, deps.idleDays)) {
    return `${bot.name}: the owner has been away, report only`;
  }
  const answer = await deps.coach(bot.accountId, bot.id, briefingPrompt(bot, matches2, plays));
  if (!answer.ok) return `${bot.name}: the coach did not answer (${answer.error})`;
  if (answer.ops.length === 0) return `${bot.name}: the coach proposed no change`;
  const patched = applyPatch(bot.playbook, answer.ops);
  if (patched.refused || patched.applied === 0) return `${bot.name}: the proposal did not apply`;
  const last2 = reports.at(-1);
  if (!last2) return `${bot.name}: no opponents on record to spar against`;
  const gate = await sparringGate(
    deps,
    last2.seatIndex,
    last2.picks,
    bot.playbook,
    patched.def,
    now % 1e6
  );
  const passed = gate.candidateWins > gate.currentWins;
  const proposalId = deps.store.addProposal({
    botId: bot.id,
    at: now,
    comment: answer.comment,
    ops: answer.ops,
    currentWins: gate.currentWins,
    candidateWins: gate.candidateWins,
    matches: gate.matches,
    status: passed ? "pending" : "dismissed"
  });
  if (!passed) {
    return `${bot.name}: proposal ${proposalId} lost the sparring (${gate.candidateWins} to ${gate.currentWins}), dismissed`;
  }
  if (bot.autoApply) {
    const version = applyProposalVersion(deps.store, bot, patched.def, proposalId, now);
    return `${bot.name}: proposal ${proposalId} won the sparring, applied as v${version}`;
  }
  return `${bot.name}: proposal ${proposalId} won the sparring, awaiting the owner`;
}
function applyProposalVersion(store, bot, def, proposalId, at) {
  const version = (store.getBot(bot.id)?.version ?? bot.version) + 1;
  store.addVersion({ botId: bot.id, version, playbook: def, author: "coach", at });
  store.updateBot(bot.id, {
    name: bot.name,
    sigils: bot.sigils,
    skin: bot.skin,
    playbook: def,
    version,
    updatedAt: at
  });
  store.setProposalStatus(proposalId, "applied", version);
  return version;
}
async function runNight(deps) {
  const lines = [];
  for (const bot of deps.store.listDeposited()) {
    try {
      lines.push(await coachBotOvernight(deps, bot));
    } catch (err) {
      lines.push(`${bot.name}: the night failed (${err.message})`);
    }
  }
  for (const line of lines) deps.log?.(`night coach: ${line}`);
  return lines;
}
function nightDue(lastAt, now, everyMs = DAY_MS5) {
  return lastAt === null || now - lastAt >= everyMs;
}
function buildBriefing(deps, bot) {
  const now = (deps.now ?? Date.now)();
  const since = now - DAY_MS5;
  const matches2 = botMatchesSince(deps.records(), bot.accountId, since);
  const reports = deps.store.listBotReports(bot.id, since);
  const wins = matches2.filter((m) => m.win).length;
  return {
    since,
    matches: matches2,
    wins,
    losses: matches2.length - wins,
    ratingDelta: matches2.reduce((n, m) => n + m.delta, 0),
    rating: deps.store.botRating(bot.id, "arena").rating,
    plays: sumPlays(reports),
    proposal: deps.store.pendingProposal(bot.id),
    autoApply: bot.autoApply
  };
}
function answerProposal(deps, bot, proposalId, action) {
  if (typeof proposalId !== "number" || action !== "apply" && action !== "dismiss") {
    return { ok: false, error: "malformed request" };
  }
  const proposal = deps.store.getProposal(proposalId);
  if (!proposal || proposal.botId !== bot.id) return { ok: false, error: "no such proposal" };
  if (proposal.status !== "pending")
    return { ok: false, error: "this proposal was already answered" };
  if (action === "dismiss") {
    deps.store.setProposalStatus(proposalId, "dismissed", null);
    return { ok: true };
  }
  const patched = applyPatch(bot.playbook, proposal.ops);
  if (patched.refused || patched.applied === 0) {
    deps.store.setProposalStatus(proposalId, "dismissed", null);
    return { ok: false, error: "the proposal no longer applies to this playbook" };
  }
  const version = applyProposalVersion(
    deps.store,
    bot,
    patched.def,
    proposalId,
    (deps.now ?? Date.now)()
  );
  return { ok: true, version };
}

// server/playbook_suggest.ts
var COACH_MODEL_DEFAULT = "claude-sonnet-5";
function supportsFallbacks(model) {
  return model.startsWith("claude-opus-") || model.startsWith("claude-fable-");
}
var COACH_CALL_TIMEOUT_MS = 12e4;
var COACH_MAX_TOKENS = 8e3;
function catalog() {
  const stat2 = (s) => Object.entries(s).filter((e) => e[1] !== void 0).map(([k, v]) => `${k} ${v < 1 && v > 0 ? `${Math.round(v * 100)}%` : v}`).join(" ");
  return ITEM_LIST.map(
    (i) => `${i.id} (${i.name}, ${i.cost}g, tier ${i.tier}${i.buildsFrom ? `, from ${i.buildsFrom.join("+")}` : ""}): ${stat2(i.stats)}`
  ).join("\n ");
}
var GRAMMAR2 = `
A playbook is {"version":3,"plays":[Play...],"kit"?:Kit,"lanes"?:["top"|"mid"|"bot"|"jungle"...]}, at most ${MAX_PLAYS} plays. lanes: the lanes the bot asks for, in order, one to three, seated ahead of its champion's home lane (the first with a seat open); "jungle" first means the forest: the bot holds no lane and should carry a jungle play (the camps) instead of a lane's; "bottom" and "bot lane" both mean "bot", and in your comment always say "bot lane" or "top lane", never "bot" alone (a bare "bot" is the bot itself). Each decision
slot (four per second) the bot walks the list top down; the first play whose trigger holds AND
whose behavior can act this slot is the one that acts. A behavior that cannot act (nothing to
farm, nothing affordable) passes to the next play. Reflexes run before the list and are not yours
to write: dodging skillshots and zones, the banked recast home, spending skill points, holding a
recall channel. The micro (last hits, aim, which key is the escape, the steps of a kite) is the
engine's too.
The kit is what the bot works toward, as opposed to what it does now:
Kit: {"build"?:[itemId...],"skills"?:["Q"|"W"|"E" x3],"variants"?:[{"when":Trigger,"build"?:[...],"skills"?:[...]}...]}
 build: FINISHED items in order, 1 to ${MAX_BUILD}; an item listed twice is owned twice; the engine
 buys the components in recipe order and an item consumed into a later one still counts as owned. Absent: the champion's
 role build. Past a full bag the next target replaces the cheapest item once the gold covers it, and
 a leftover the build no longer wants is sold first (the bot sells at the fountain for 70%).
 skills: the order of Q, W, E to max; R goes at levels 6, 11, 16. Absent: Q, W, E.
 variants: at most ${MAX_VARIANTS}; the first whose trigger holds is the kit in force, decided again
 at every purchase and skill point; each needs a build or a skill order.
Items:
 ${catalog()}
Play: {"id":"lowercase-kebab","when":Trigger,"do":Behavior,"enabled"?:bool}
Trigger is ONE of (numeric fields: "below" strictly less, "atLeast" greater or equal; give at
least one of the two):
 {"kind":"always"}
 {"kind":"hp","below"?:0..1,"atLeast"?:0..1} own health as a fraction; {"kind":"mana",...} same
 {"kind":"level","below"?:1..18,"atLeast"?:1..18} {"kind":"gold",0..1000000} {"kind":"time",seconds 0..36000}
 {"kind":"enemies","within":0..200,"atLeast"?:0..10,"atMost"?:0..10} enemy champions in sight within the radius; {"kind":"allies",...} same for allies
 {"kind":"enemyVisible"} {"kind":"atFountain"} {"kind":"underTower"}
 {"kind":"warden","state":"up"|"spawning"|"down","within"?:seconds,"hpAtMost"?:0..1,"near"?:units} (spawning: due within the seconds, default 20; up narrows to a live Warden at or under hpAtMost of its health and within near units of the bot, what a finish play reads: every new bot has "finish-warden" and "finish-creature" right above "fight", the last strikes on a body in reach whatever is in sight, and they are VALID)
 {"kind":"creature","which"?:"pyrefang"|"voidmaul"|"ascendant"|"any","state":"up"|"spawning"|"down","within"?:seconds,"hpAtMost"?:0..1,"near"?:units} a ring creature (the Pyrefang on the bot ring, the Voidmaul on the top ring, ascendant for either ring's Ascendant, the fourth rise and every later one, a team's fight; any by default): up while one is alive, spawning when due within the seconds (default 20), down when none is
 {"kind":"abilityReady","key":"Q"|"W"|"E"|"R"} {"kind":"sigilReady","id":"riftstep"|"zephyr"|"mend"|"sear"} {"kind":"lane","is":"top"|"mid"|"bot"|"jungle"} (jungle: the seat holds no lane, the forest's)
 {"kind":"allyFighting","within":0..200} an allied champion within the radius has an enemy champion within 10 of it
 {"kind":"numbers","within":0..200,"atLeast"?:-10..10,"atMost"?:-10..10} allied champions within the radius (the bot itself counted) minus enemy champions in sight there: atLeast 0 is an even fight or better, atLeast 1 an advantage, atMost -1 outnumbered
 {"kind":"odds","within"?:0..200 (20),"below"?:0..1,"atLeast"?:0..1} the fight's odds: the strength of the allied champions within the radius (the bot itself counted, each weighed by health and level) over both sides' together; 0.5 is an even fight, above it an advantage, below it a losing one
 {"kind":"minions","side":"own"|"enemy","within":0..200,"atLeast"?:0..30,"atMost"?:0..30} minions of that side within the radius: the size of the wave here
 {"kind":"towerThreatened","within"?:0..200 (200)} a live allied tower within the radius has an enemy champion in sight near it (within 16): the map is being lost there
 {"kind":"order","is"?:"goto"|"warden"|"creature"|"focus"|"back"|"group"|"hold"} the owner gave the bot a live coach order (any kind, or that one); every new bot has the play "coach" (this trigger, behavior obeyOrder) right under retreat, and it is VALID: keep it unless the owner asks otherwise
 The lineup, public from champion select ("own" is the bot's team, itself included):
 {"kind":"champion","side":"own"|"enemy","is":championId} that champion is in the match on that side
 {"kind":"roles","side":"own"|"enemy","role":Role,"atLeast"?:0..5,"atMost"?:0..5} how many of a role that side fields
 {"kind":"enemyDamage","mostly":"magic"|"physical"} by roles: mages and battlemages deal magic, supports count on neither side; a strict majority
 {"kind":"enemyItem","item":itemId} a visible enemy champion wears the item right now
 {"kind":"laneOpponent","is":championId} the enemy seen the most in the bot's lane over the last three minutes is that champion
 {"kind":"lanePartner","is":championId} an ally assigned to the bot's lane is that champion
 Champions (id, role): ${CHAMPION_LIST.map((c) => `${c.id} ${c.role}`).join(", ")}
 {"kind":"not","of":Trigger} {"kind":"all","of":[Trigger...]} {"kind":"any","of":[Trigger...]} (nested at most 4 deep)
Behavior is ONE of (every parameter optional, default in parentheses):
 {"kind":"retreat"} run home by the fastest means; always acts.
 {"kind":"hold"} do nothing this slot; always acts.
 {"kind":"obeyOrder"} do what the owner's live coach order says (go somewhere, take the Warden, take the ring's creature, focus, back off, group, hold); passes the turn with no order standing.
 {"kind":"shop"} the kit's next step at the fountain: buy the next item or component, sell what the build no longer wants, replace the cheapest past a full bag.
 {"kind":"goShop"} go home to spend when the next step is affordable and the spot is clear.
 {"kind":"sell","item":itemId} sell the named item at the fountain when the bag holds it.
 {"kind":"avoidTower","escortMin"?:int 0..10 (3),"hpBelow"?:0..1 (0.65)} step out of an enemy tower's reach unless escorted and healthy, or securing a kill.
 {"kind":"finishSanctum"} hit a vulnerable enemy Sanctum in reach when it is low or escorted.
 {"kind":"fight","stance"?:"auto"|"kite"|"front"|"poke" ("auto"),"target"?:"nearest"|"lowest"|"squishiest"|"order" ("nearest"),"alone"?:"engage"|"hold" ("engage")} Sear in kill range, the kit by its hints, then attacks, holding distance by the stance: kite attacks from the edge of its own range and steps away from whoever closes; front walks in and chases a little; poke casts and steps back, never trading attacks; auto is kite on a ranged champion, front on a melee one. Target: the nearest, the lowest in health, the squishiest by role (carries first), or the coach's focus. Alone: what a walk-in does with no allied champion beside it (within 8): engage anyway, or hold and strike only what is already in reach. "commitAt"?:0..1: the odds (as the odds trigger reads them, within 20) under which the bot never walks in: it strikes what reaches it, kites, holds its engage spell, and passes the turn once nothing is in reach; absent, it commits whatever the odds. Acts only with an enemy champion in sight.
 {"kind":"hunt","hpAbove"?:0..1 (0.5)} walk to where a nearly dead enemy was last seen.
 {"kind":"answerVanish","hpAtLeast"?:0..1 (0.55)} an enemy just vanished nearby: walk its spot when healthy, give ground when hurt.
 {"kind":"contestWarden","hpAtLeast"?:0..1 (0.5),"prepSeconds"?:0..300 (20),"partyAtLeast"?:1..5 (3)} attack a live Warden in reach, walk to it healthy and only with that many allied champions near it (self included: the Warden is a team fight), pre-position at the pit before it spawns.
 {"kind":"contestCreature","which"?:"pyrefang"|"voidmaul"|"ascendant"|"any" ("any"),"hpAtLeast"?:0..1 (0.5),"prepSeconds"?:0..300 (20),"within"?:0..200 (40),"partyAtLeast"?:1..5 (2, 3 for the Ascendant)} attack a live ring creature in reach, walk to it healthy and within the range, only with that many allied champions near it (self included: a lone bot pokes a creature for nothing), pre-position at its ring before it rises; its death gives the whole team a permanent favor and gold; an Ascendant's death gives the Wrath instead (150 s: enemies under 20 percent health die to any hit, hits burn), and it wants the whole team.
 {"kind":"farm","mode"?:"shove"|"lastHit" ("shove")} attack the nearest enemy minion in reach; lastHit strikes only a minion the next attack kills, so the wave is not pushed.
 {"kind":"manageWave","intent":"freeze"|"shove"} freeze: hold the enemy wave in front of the bot's own lane tower, last hits only, standing just ahead of the tower and holding still between them, so the wave dies to the tower and the enemy laner must come deep for its farm; always acts while a live allied tower stands on the bot's lane, passes without one. shove: hit the wave to send it at the enemy tower.
 {"kind":"takeCamp"} attack a visible jungle camp in reach, with no enemy champion in sight.
 {"kind":"jungle","side"?:"own"|"any" ("own")} the forest route: clear the camp in reach with the kit's abilities before the strikes, else walk to the camp the team believes up and can reach first (never looked at, seen standing, or seen empty for its kind's respawn clock: the Spinecrest and the Brackenlings 90 s, the Barkmaw 120 s); the own forest by default, any spot with "any"; passes the turn with every camp believed down. What a jungler (lanes ["jungle"]) plays instead of farming a lane.
 {"kind":"siege","escortMin"?:int 0..10 (3)} attack a vulnerable structure in reach with a minion escort.
 {"kind":"push","lane"?:"assigned"|"top"|"mid"|"bot" ("assigned"),"regroupAt"?:seconds|null (720)} follow the wave down the lane, else walk it, else walk at the enemy Sanctum; always acts. Past regroupAt every assigned bot pushes mid as one group; null disables the bell.
 {"kind":"followAlly","keep"?:0..50 (3)} walk to the nearest allied champion and stay within keep.
 {"kind":"joinAlly","within"?:0..200 (40)} walk to the nearest ally in a fight within the radius; passes the turn beside it or when nobody is fighting.
 {"kind":"fallBack"} walk back under the nearest live allied tower; passes the turn once under it, so the plays below go on there.
 {"kind":"defendTower","within"?:0..200 (200)} collapse on the allied tower enemy champions are at (the most of them, the nearest on a tie) within the radius; passes the turn beside it or with no tower threatened, so a fight play below takes over on arrival. How a spread pusher is caught with the numbers.
 {"kind":"splitPush"} push the lane enemies were seen in the least over the last minute (the farthest from the enemies in sight on a tie): takes towers while the enemy groups elsewhere; pair it with a fallBack or a retreat when outnumbered.
 {"kind":"holdPosition","x":0..${STAR_ORCHARD_SIZE},"z":0..${STAR_ORCHARD_SIZE},"within"?:0..50 (2)} walk to a point and hold; always acts.
Patch operations, ONE compact JSON object per line:
 {"op":"add","play":Play,"before"?:id|null} insert before the named play, append when absent
 {"op":"remove","id":id}
 {"op":"move","id":id,"before":id|null} (null: to the end)
 {"op":"set","id":id,"play":{"when"?:Trigger,"do"?:Behavior,"enabled"?:bool}} change parts of a play in place
 {"op":"kit","kit":{"build"?:[...]|null,"skills"?:[...]|null,"variants"?:[...]|null}} change parts of the kit; a part given replaces it, null clears it back to the default, absent leaves it
 {"op":"lanes","lanes":["top"|"mid"|"bot"|"jungle"...]|null} set the lane preference, null for none
 {"op":"replace","playbook":Playbook} a whole rewrite, ONLY when the owner asks for one
`;
function preamble2() {
  const intro = "You coach a bot in a small deterministic MOBA, in conversation with the bot's owner. The bot's whole brain is its playbook: an ordered list of plays, the first one that can act winning each slot, so ORDER is everything and earlier plays win. The owner tells you how they want the bot to play; you answer with the smallest set of patch operations that gets there, keeping what already works.";
  const format = 'Answer format, and nothing else: the first line starts with "# " followed by one or two plain sentences to the owner, in the language the owner wrote their latest message in (English for an English message), saying what you changed and why; then one patch operation per line as compact JSON (no indentation, no line breaks inside an operation). No prose after the first line, no code fences, no numbering, no trailing commentary. Play ids are short lowercase English (letters, digits, hyphens). Prefer set, add, move and remove over replace.';
  return [intro, GRAMMAR2, format].join("\n\n");
}
function formState4(championId, playbook) {
  const def = CHAMPIONS[championId];
  const hints = hintsFor(championId);
  const keys = ["Q", "W", "E"].map((k) => `${k} ${hints.keys[k]}`).join(", ");
  const range2 = def?.base.attackRange;
  const reach = range2 === void 0 ? "" : ` Attack range ${range2} (${range2 >= RANGED_MIN_RANGE ? "ranged, kites by default" : "melee, walks in by default"}).`;
  return [
    `The bot plays ${def?.name ?? championId} (${def?.role ?? "unknown role"}); its keys by role: ${keys}; R is its ultimate.${reach}`,
    `Its role build, used when the kit names none: ${roleBuild(championId).join(", ")}.`,
    `The playbook on the form right now: ${JSON.stringify(playbook)}`
  ].join(" ");
}
function toApiMessages4(turns, state) {
  return turns.map((t, i) => {
    if (t.role === "assistant") return { role: "assistant", content: t.text };
    const text2 = i === turns.length - 1 ? `${t.text}

${state}` : t.text;
    return { role: "user", content: i === 0 ? `The owner says: ${text2}` : text2 };
  });
}
async function readEventStream2(res, onText, onUsage) {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const usage = {};
  const fold = (u) => {
    if (!u) return;
    for (const k of [
      "input_tokens",
      "output_tokens",
      "cache_read_input_tokens",
      "cache_creation_input_tokens"
    ]) {
      if (typeof u[k] === "number") usage[k] = u[k];
    }
  };
  let pending = "";
  let text2 = "";
  const take = (frame) => {
    for (const line of frame.split("\n")) {
      if (!line.startsWith("data:")) continue;
      let event;
      try {
        event = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }
      if (event.type === "error") throw new Error(event.error?.message ?? "the stream broke");
      if (event.type === "message_start") fold(event.message?.usage);
      if (event.type === "message_delta") fold(event.usage);
      if (event.type === "message_delta" && event.delta?.stop_reason === "refusal") {
        throw new Error("the model declined to answer this one");
      }
      if (event.type !== "content_block_delta" || event.delta?.type !== "text_delta") continue;
      if (typeof event.delta.text !== "string") continue;
      text2 += event.delta.text;
      onText(event.delta.text);
    }
  };
  for (; ; ) {
    const { value, done } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    let cut = pending.indexOf("\n\n");
    while (cut >= 0) {
      take(pending.slice(0, cut));
      pending = pending.slice(cut + 2);
      cut = pending.indexOf("\n\n");
    }
  }
  if (pending.trim() !== "") take(pending);
  onUsage?.(usage);
  return text2;
}
async function askModel2(deps, messages, depth, onText, onUsage) {
  const doFetch = deps.fetchFn ?? fetch;
  const model = deps.model ?? COACH_MODEL_DEFAULT;
  const fallbacks = supportsFallbacks(model);
  const res = await doFetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": deps.apiKey ?? "",
      "anthropic-version": "2023-06-01",
      // The refusal fallback: a policy decline re-runs on a fallback
      // model inside the same call instead of ending the conversation.
      ...fallbacks ? { "anthropic-beta": "server-side-fallback-2026-07-01" } : {},
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      max_tokens: COACH_MAX_TOKENS,
      stream: true,
      // The grammar never changes between turns: cached as a prefix.
      system: [{ type: "text", text: preamble2(), cache_control: { type: "ephemeral" } }],
      // Depth is effort, not a model swap: a patch is a small answer at
      // low effort, a rework earns the full think.
      output_config: { effort: depth === "deep" ? "high" : "low" },
      ...fallbacks ? { fallbacks: "default" } : {},
      messages
    }),
    signal: AbortSignal.timeout(COACH_CALL_TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`the coach service answered ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("text/event-stream")) return readEventStream2(res, onText, onUsage);
  const body = await res.json();
  if (body.usage) onUsage?.(body.usage);
  const text2 = body.content?.find((c) => c.type === "text")?.text ?? "";
  onText(text2);
  return text2;
}
var AnswerReader = class {
  constructor(playbook, progress) {
    this.playbook = playbook;
    this.progress = progress;
  }
  playbook;
  progress;
  comment = "";
  ops = [];
  refused = [];
  commentDone = false;
  commentStarted = false;
  lineBuf = "";
  feed(delta) {
    let rest = delta;
    if (!this.commentDone) {
      const nl = rest.indexOf("\n");
      let piece = nl < 0 ? rest : rest.slice(0, nl);
      if (!this.commentStarted) {
        const trimmed = piece.replace(/^\s*#+\s*/, "");
        if (piece.trim() !== "") this.commentStarted = true;
        piece = trimmed;
      }
      if (piece !== "") {
        this.comment += piece;
        this.progress({ kind: "text", text: piece });
      }
      if (nl < 0) return;
      this.commentDone = true;
      rest = rest.slice(nl + 1);
    }
    this.lineBuf += rest;
    let cut = this.lineBuf.indexOf("\n");
    while (cut >= 0) {
      this.takeLine(this.lineBuf.slice(0, cut));
      this.lineBuf = this.lineBuf.slice(cut + 1);
      cut = this.lineBuf.indexOf("\n");
    }
  }
  finish() {
    if (this.lineBuf.trim() !== "") this.takeLine(this.lineBuf);
    this.lineBuf = "";
    this.comment = this.comment.trim().slice(0, 600);
  }
  takeLine(line) {
    const text2 = line.trim();
    if (text2 === "" || text2.startsWith("#") || text2.startsWith("```")) return;
    let raw;
    try {
      raw = JSON.parse(text2);
    } catch {
      this.refuse(text2, "not a patch operation");
      return;
    }
    if (!isPatchOp(raw)) {
      this.refuse(raw, "not a patch operation");
      return;
    }
    const r = applyPatchOp(this.playbook, raw);
    if (!r.ok) {
      this.refuse(raw, r.error);
      return;
    }
    this.playbook = r.def;
    this.ops.push(raw);
    this.progress({ kind: "op", op: raw });
  }
  refuse(op, error) {
    this.refused.push({ op, error });
    this.progress({ kind: "refused", op, error });
  }
};
async function coachPlaybook(deps, accountId, req) {
  if (!deps.apiKey) {
    return { ok: false, error: "the coach is not configured on this server yet" };
  }
  const bot = deps.store.getBot(req.id);
  if (!bot || bot.accountId !== accountId) {
    return { ok: false, error: "no such bot on this account" };
  }
  const badThread = threadError(req.messages);
  if (badThread !== null) return { ok: false, error: badThread };
  let playbook = bot.playbook;
  if (req.playbook !== void 0) {
    const v = validatePlaybook(req.playbook);
    if (!v.ok) return { ok: false, error: `the playbook on the form is not valid: ${v.errors[0]}` };
    playbook = v.def;
  }
  const price = EMBER_PRICES.coachTurn;
  const held2 = deps.balance?.(accountId);
  if (held2 !== void 0 && held2 < price) {
    return { ok: false, error: `this costs ${price} embers a turn and you have ${held2}` };
  }
  const progress = req.onProgress ?? (() => {
  });
  const reader = new AnswerReader(playbook, progress);
  progress({ kind: "stage", text: "Reading the playbook" });
  let text2;
  try {
    text2 = await askModel2(
      deps,
      toApiMessages4(req.messages, formState4(bot.championId, playbook)),
      req.depth ?? "quick",
      (delta) => reader.feed(delta),
      (usage) => {
        const at = (deps.now ?? Date.now)();
        deps.spend?.(usageSample("agent", deps.spendDetail ?? "coach", accountId, at, usage));
        deps.charge?.(accountId, EMBER_PRICES.coachTurn, bot.id);
      }
    );
  } catch (err) {
    const e = err;
    const why = e.name === "TimeoutError" ? "the coach took too long to answer; try again" : e.message;
    return { ok: false, error: `the coach call failed: ${why}` };
  }
  reader.finish();
  return {
    ok: true,
    comment: reader.comment,
    ops: reader.ops,
    refused: reader.refused,
    playbook: reader.playbook,
    raw: text2.slice(0, CHAT_RAW_TEXT_MAX)
  };
}

// server/practice_reports.ts
var import_node_fs11 = require("node:fs");

// src/net/practice_report.ts
var PRACTICE_REPORT_VERSION = 1;

// server/practice_reports.ts
var PRACTICE_ROWS_MAX = 10;
var PRACTICE_ITEMS_MAX = 6;
var PRACTICE_SECONDS_MAX = 4 * 3600;
var RESULTS = ["won", "lost", "left"];
var ID = /^[A-Za-z0-9_-]{1,48}$/;
function isRecord6(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function count2(v, max) {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max ? v : null;
}
function parseRow(raw) {
  if (!isRecord6(raw)) return null;
  const championId = typeof raw.championId === "string" && ID.test(raw.championId) ? raw.championId : null;
  const team2 = raw.team === 0 || raw.team === 1 ? raw.team : null;
  const level = count2(raw.level, 30);
  const kills = count2(raw.kills, 500);
  const deaths = count2(raw.deaths, 500);
  const assists = count2(raw.assists, 500);
  const cs = count2(raw.cs, 5e3);
  if (championId === null || team2 === null || typeof raw.self !== "boolean" || level === null || kills === null || deaths === null || assists === null || cs === null || !Array.isArray(raw.items) || raw.items.length > PRACTICE_ITEMS_MAX || !raw.items.every((i) => typeof i === "string" && ID.test(i))) {
    return null;
  }
  return {
    championId,
    team: team2,
    self: raw.self,
    level,
    kills,
    deaths,
    assists,
    cs,
    items: raw.items
  };
}
function parsePracticeReport(raw) {
  if (!isRecord6(raw)) return null;
  if (raw.v !== PRACTICE_REPORT_VERSION) return null;
  const result = RESULTS.find((r) => r === raw.result);
  if (!result) return null;
  const seconds = count2(raw.seconds, PRACTICE_SECONDS_MAX);
  if (seconds === null) return null;
  if (typeof raw.forged !== "boolean" || typeof raw.touch !== "boolean") return null;
  if (typeof raw.signedIn !== "boolean") return null;
  if (!Array.isArray(raw.rows) || raw.rows.length === 0 || raw.rows.length > PRACTICE_ROWS_MAX) {
    return null;
  }
  const rows = [];
  for (const r of raw.rows) {
    const row = parseRow(r);
    if (!row) return null;
    rows.push(row);
  }
  if (rows.filter((r) => r.self).length !== 1) return null;
  return {
    v: PRACTICE_REPORT_VERSION,
    result,
    seconds,
    forged: raw.forged,
    touch: raw.touch,
    signedIn: raw.signedIn,
    rows
  };
}
var PracticeReportStore = class {
  constructor(file) {
    this.file = file;
  }
  file;
  append(report2, at) {
    const stored = { at, ...report2 };
    appendJsonl(this.file, stored);
  }
  // Every report on disk, oldest first; a torn last line (a crash mid
  // write) is skipped rather than fatal.
  readAll() {
    let text2;
    try {
      text2 = (0, import_node_fs11.readFileSync)(this.file, "utf8");
    } catch {
      return [];
    }
    return readPracticeLines(text2);
  }
};
function readPracticeLines(text2) {
  const out = [];
  for (const line of text2.split("\n")) {
    if (!line.trim()) continue;
    try {
      const raw = JSON.parse(line);
      const report2 = parsePracticeReport(raw);
      if (report2 && typeof raw.at === "number") out.push({ at: raw.at, ...report2 });
    } catch {
    }
  }
  return out;
}

// server/mastery.ts
var MASTERY_THRESHOLDS = [1, 3, 6, 12, 20, 30];
var MASTERY_TITLES = [
  "Unranked",
  "Novice",
  "Adept",
  "Veteran",
  "Expert",
  "Master",
  "Legend"
];
function masteryRank(games) {
  let rank = 0;
  for (const need of MASTERY_THRESHOLDS) {
    if (games >= need) rank++;
    else break;
  }
  return rank;
}
function masteryTitle(rank) {
  return MASTERY_TITLES[Math.max(0, Math.min(MASTERY_TITLES.length - 1, rank))] ?? "Unranked";
}

// server/profile.ts
var RECENT_CAP = 10;
function buildProfile(records, accountId) {
  const out = {
    games: 0,
    wins: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    perChampion: [],
    recent: []
  };
  const perChamp = /* @__PURE__ */ new Map();
  for (const rec of records) {
    const me = rec.players.find((p) => p.accountId === accountId);
    if (!me || !playedByHand(seatWay(rec, me))) continue;
    const win = me.team === rec.winner;
    out.games++;
    if (win) out.wins++;
    out.kills += me.kills;
    out.deaths += me.deaths;
    out.assists += me.assists;
    let line = perChamp.get(me.championId);
    if (!line) {
      line = {
        championId: me.championId,
        games: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
        mastery: 0,
        masteryTitle: masteryTitle(0)
      };
      perChamp.set(me.championId, line);
    }
    line.games++;
    if (win) line.wins++;
    line.kills += me.kills;
    line.deaths += me.deaths;
    line.assists += me.assists;
    line.cs += me.cs;
    out.recent.push({
      at: rec.at,
      durationS: rec.durationS,
      win,
      championId: me.championId,
      kills: me.kills,
      deaths: me.deaths,
      assists: me.assists,
      cs: me.cs,
      ...me.ratingDelta !== void 0 ? { ratingDelta: me.ratingDelta } : {},
      ...rec.replayId !== void 0 ? { replayId: rec.replayId } : {}
    });
  }
  for (const line of perChamp.values()) {
    line.mastery = masteryRank(line.games);
    line.masteryTitle = masteryTitle(line.mastery);
  }
  out.perChampion = [...perChamp.values()].sort((a, b) => b.games - a.games);
  out.recent.sort((a, b) => b.at - a.at);
  out.recent = out.recent.slice(0, RECENT_CAP);
  return out;
}

// server/reference_check.ts
var REFERENCE_REFUSAL = "this reference will not build:";
var RULES = 'You are checking ONE image before it is turned into a 3D model, for a small game. The builder reconstructs literally what the image shows, so the image must be: exactly ONE character, alone; the WHOLE body, head to feet, nothing cropped; seen from the front; on a plain, empty background. Answer with ONLY a JSON object: { "figures": integer (how many separate characters or views of a character you see, counting a multi-view sheet as one per view), "fullBody": boolean, "front": boolean, "plainBackground": boolean, "note": string }. "note" is ONE short sentence for the person who made the image, naming what is wrong and what to ask for instead; empty when nothing is wrong. Judge only what you can plainly see: when in doubt, say it is fine.';
function parse(answer) {
  const start = answer.indexOf("{");
  const end = answer.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(answer.slice(start, end + 1));
    return typeof raw === "object" && raw !== null ? raw : null;
  } catch {
    return null;
  }
}
function readVerdict(raw) {
  const figures = typeof raw.figures === "number" && Number.isFinite(raw.figures) ? Math.round(raw.figures) : null;
  const fullBody = raw.fullBody !== false;
  const plainBackground = raw.plainBackground !== false;
  const note = typeof raw.note === "string" ? raw.note.trim().slice(0, 300) : "";
  const usable = (figures === null || figures <= 1) && fullBody;
  return { usable, figures, fullBody, plainBackground, note };
}
function refusalMessage(v) {
  const seen2 = v.figures !== null && v.figures > 1 ? `it shows ${v.figures} figures, and the builder makes a body out of each` : "the body is cut off, and the builder makes exactly what it sees";
  const note = v.note !== "" ? ` ${v.note}` : "";
  return `${REFERENCE_REFUSAL} ${seen2}.${note}`;
}
async function checkReference(deps, image) {
  if (!deps.apiKey) return null;
  try {
    const answer = await askModel(deps, [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageMediaType(image),
              data: image.toString("base64")
            }
          },
          { type: "text", text: RULES }
        ]
      }
    ]);
    const raw = parse(answer);
    return raw === null ? null : readVerdict(raw);
  } catch {
    return null;
  }
}

// server/reforge.ts
function setForgedAttackRange(deps, accountId, id, raw) {
  const row = deps.store.getForged(id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  if (row.status !== "finalized") {
    return { ok: false, error: "a draft edits freely: save it from the editor instead" };
  }
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return { ok: false, error: "malformed reach" };
  }
  const def = structuredClone(row.def);
  def.base.attackRange = raw;
  const v = validateForged(def);
  if (!v.ok) {
    return { ok: false, error: `reforge rejected: ${v.errors.slice(0, 3).join("; ")}` };
  }
  deps.store.saveForged({ ...row, def, updatedAt: (deps.now ?? Date.now)() });
  return { ok: true, attackRange: raw, melee: raw <= RANGED_THRESHOLD };
}

// server/rejoin.ts
var RejoinRegistry = class {
  // Seats abandoned by a dropped connection; a bot holds the champion
  // meanwhile. Reservations die with their match.
  seats = /* @__PURE__ */ new Map();
  // When each account's queue lockout runs out.
  queueLocks = /* @__PURE__ */ new Map();
  // A connection dropped mid-match: hold the seat for its owner.
  reserve(accountId, seat) {
    this.seats.set(accountId, seat);
  }
  // Claiming is one-shot: the seat is handed back once and the hold is
  // gone, so a second socket cannot be given a champion the first is
  // already playing.
  claim(accountId) {
    const seat = this.seats.get(accountId);
    if (seat) this.seats.delete(accountId);
    return seat;
  }
  // A deliberate walk-out holds no seat: reservations are for dropped
  // connections, and a player who chose to leave must not be pulled back
  // in by their next queue.
  drop(accountId) {
    this.seats.delete(accountId);
  }
  held(accountId) {
    return this.seats.get(accountId);
  }
  // A match closed: every seat it was holding is meaningless now.
  pruneMatch(matchId) {
    let dropped = 0;
    for (const [accountId, seat] of this.seats) {
      if (seat.matchId === matchId) {
        this.seats.delete(accountId);
        dropped++;
      }
    }
    return dropped;
  }
  lockQueue(accountId, until) {
    this.queueLocks.set(accountId, until);
  }
  // Milliseconds still owed before this account may queue again, 0 when
  // it may queue now. A lock that has run out is forgotten on the way, so
  // the map does not keep an entry per leaver forever.
  queueLockRemaining(accountId, now) {
    const until = this.queueLocks.get(accountId);
    if (until === void 0) return 0;
    if (until <= now) {
      this.queueLocks.delete(accountId);
      return 0;
    }
    return until - now;
  }
  get heldSeats() {
    return this.seats.size;
  }
  get lockedAccounts() {
    return this.queueLocks.size;
  }
};

// server/seal.ts
function sealChampion(deps, accountId, id) {
  const row = deps.store.getForged(id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  if (row.status === "finalized") {
    return { ok: false, error: "already sealed" };
  }
  const v = validateForged(row.def);
  if (!v.ok) {
    return {
      ok: false,
      error: `sealing needs a fully valid champion: ${v.errors.slice(0, 3).join("; ")}`
    };
  }
  const assets = deps.store.forgedAssets(id) ?? {};
  if (typeof assets.model !== "string") {
    return { ok: false, error: "build the 3D model first: a sealed champion plays as its model" };
  }
  if (typeof assets.clips !== "object" || assets.clips === null) {
    return { ok: false, error: "animate the champion first: a sealed champion moves" };
  }
  deps.store.setForgedStatus(id, "finalized", (deps.now ?? Date.now)());
  return { ok: true };
}
function unsealChampion(deps, accountId, id) {
  const row = deps.store.getForged(id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  if (row.status !== "finalized") {
    return { ok: false, error: "not sealed" };
  }
  deps.store.setForgedStatus(id, "draft", (deps.now ?? Date.now)());
  return { ok: true };
}

// server/sessions.ts
var import_node_crypto8 = require("node:crypto");
var SESSION_TTL_MS = 30 * 24 * 60 * 6e4;
var TOUCH_FLUSH_MS = 60 * 6e4;
var COOKIE_NAME = "loc_session";
function randomId() {
  return (0, import_node_crypto8.randomBytes)(24).toString("hex");
}
var SessionStore = class {
  constructor(file, ttlMs = SESSION_TTL_MS, idGen = randomId) {
    this.file = file;
    this.ttlMs = ttlMs;
    this.idGen = idGen;
    for (const s of loadJson(file, [])) this.byId.set(s.id, s);
  }
  file;
  ttlMs;
  idGen;
  byId = /* @__PURE__ */ new Map();
  // Set when a touch has moved a seenAt that disk does not know about.
  dirty = false;
  persist() {
    try {
      saveJsonAtomic(this.file, [...this.byId.values()]);
      this.dirty = false;
    } catch (err) {
      console.error("session store persist failed", err);
    }
  }
  expired(s, now) {
    return now - s.seenAt >= this.ttlMs;
  }
  // A new login. Written through: losing a session a player just opened
  // would send them straight back to the login screen.
  create(accountId, now) {
    const session = {
      id: this.idGen(),
      accountId,
      createdAt: now,
      seenAt: now
    };
    this.byId.set(session.id, session);
    this.persist();
    return session;
  }
  // The cookie's id to an account, or undefined. Expiry is enforced on
  // read, so a session that outlived its window never resolves even if
  // the purge sweep has not reached it yet.
  resolve(id, now) {
    const s = this.byId.get(id);
    if (!s) return void 0;
    if (this.expired(s, now)) {
      this.byId.delete(s.id);
      this.persist();
      return void 0;
    }
    return s;
  }
  // One use of a live session. Memory only, by design: this runs on every
  // request and the tick loop pays for every synchronous write.
  touch(id, now) {
    const s = this.byId.get(id);
    if (!s) return;
    if (now - s.seenAt >= TOUCH_FLUSH_MS) this.dirty = true;
    s.seenAt = now;
  }
  // Writes the extensions that touch() only made in memory. Cheap when
  // nothing moved far enough to matter.
  flush() {
    if (this.dirty) this.persist();
  }
  // Logging out on this machine.
  revoke(id) {
    if (!this.byId.delete(id)) return false;
    this.persist();
    return true;
  }
  // Logging out everywhere: what a player reaches for after playing on
  // someone else's machine. The whole point of storing sessions.
  revokeAllFor(accountId) {
    let dropped = 0;
    for (const [id, s] of this.byId) {
      if (s.accountId === accountId) {
        this.byId.delete(id);
        dropped++;
      }
    }
    if (dropped > 0) this.persist();
    return dropped;
  }
  // Drops what has outlived the window. Returns how many, for the log.
  purgeExpired(now) {
    let dropped = 0;
    for (const [id, s] of this.byId) {
      if (this.expired(s, now)) {
        this.byId.delete(id);
        dropped++;
      }
    }
    if (dropped > 0) this.persist();
    return dropped;
  }
  countFor(accountId) {
    let n = 0;
    for (const s of this.byId.values()) if (s.accountId === accountId) n++;
    return n;
  }
  get count() {
    return this.byId.size;
  }
};

// src/net/stats.ts
var BEFORE_SEND_NAME = "colStatsBeforeSend";

// server/stats_tag.ts
var STATS_SCRIPT = "/visit.js";
function isWebsiteId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
function statsTag(websiteId) {
  return `<script defer src="${STATS_SCRIPT}" data-website-id="${websiteId}" data-auto-pageview="false" data-before-send="${BEFORE_SEND_NAME}"></script>`;
}
function withStatsTag(html, websiteId) {
  if (!isWebsiteId(websiteId)) return html;
  const at = html.search(/<\/head>/i);
  if (at < 0) return html;
  return `${html.slice(0, at)}    ${statsTag(websiteId)}
  ${html.slice(at)}`;
}

// server/suggest_look.ts
var import_node_fs12 = require("node:fs");
var import_node_path10 = __toESM(require("node:path"), 1);
var KIT_KEYS4 = ["Q", "W", "E", "R"];
function vocabulary() {
  return [
    'A look is: { "palette"?: { "main": int, "glow": int }, "projectile"?: { "body": Body, "trail"?: Trail, "spin"?: n, "scale"?: n }, "cast"?: Burst, "impact"?: Burst, "zone"?: { "floor": Floor, "edge"?: Edge, "motion"?: Motion }, "detonate"?: Burst, "windup"?: { "motion": Windup } }.',
    'Burst is { "shape": Shape, "scale"?: n, "density"?: 0..1, "smoke"?: bool, "shake"?: n, "mark"?: Mark }.',
    `Body: ${LOOK_BODIES.join(", ")} ("bolt" keeps the plain tracer).`,
    `Trail: ${LOOK_TRAILS.join(", ")}.`,
    `Shape: ${LOOK_BURSTS.join(", ")}.`,
    `Floor: ${LOOK_FLOORS.join(", ")}. Edge: ${LOOK_EDGES.join(", ")}. Motion: ${LOOK_ZONE_MOTIONS.join(", ")}.`,
    `Windup: ${LOOK_WINDUPS.join(", ")}. Mark (the stain left on the ground): ${LOOK_MARKS.join(", ")}.`,
    `Numeric rails: scale ${LOOK_BOUNDS.scale.min}..${LOOK_BOUNDS.scale.max}, density ${LOOK_BOUNDS.density.min}..${LOOK_BOUNDS.density.max}, spin (turns per second) ${LOOK_BOUNDS.spin.min}..${LOOK_BOUNDS.spin.max}, shake (camera trauma) ${LOOK_BOUNDS.shake.min}..${LOOK_BOUNDS.shake.max}.`,
    'Colors are 24-bit RGB integers (write them in decimal or as 0x hex, both parse). Leave "palette" out to keep the color the game derives from the spell effects (burning spells read orange, healing green, crowd control gold, movement cyan, weapon damage bronze, everything else violet); set it when the champion has a color of its own that derivation would miss.'
  ].join("\n");
}
function surfacesOf(a) {
  const spec = a.spec;
  const parts = [];
  switch (spec.kind) {
    case "skillshot":
      parts.push("projectile", "impact");
      break;
    case "zone":
      parts.push("zone");
      if (typeof spec.detonateDelay === "number" && spec.detonateDelay > 0) {
        parts.push("detonate");
      }
      break;
    default:
      parts.push("cast");
      break;
  }
  if (typeof a.windup === "number" && a.windup > 0) parts.push("windup");
  return parts;
}
function kitSummary2(def) {
  return KIT_KEYS4.map((k) => {
    const a = def.abilities[k];
    const flavor = a.flavor ? ` flavor "${a.flavor}"` : "";
    return `${k} ${a.name} (${a.spec.kind}${k === "R" ? ", the ultimate" : ""}):${flavor} shows ${surfacesOf(a).join(" and ")}`;
  }).join("\n");
}
function preamble3(def) {
  const intro = "You art-direct the spell effects of a champion in a small top-down MOBA, in conversation with the champion's creator. The image is their chosen splash art: read its theme (element, weapon, palette, mood) and give each of the four spells a look that reads as THIS champion at a glance, then rework your latest proposal as they ask.";
  const craft = "Craft rules: a spell must be readable in a fight before it is pretty, so keep shapes distinct between the four keys (do not give every spell the same burst), keep density low on spells that are cast often and spend the big shapes, smoke and shake on the ultimate. Only fill the parts a spell actually shows; anything you leave out keeps the game's own default, which is a fine answer for a plain spell.";
  const task = 'Every answer is ONLY a JSON object, no prose around it: { "comment": string, "looks": { "Q": Look, "W": Look, "E": Look, "R": Look } }. "comment" is one or two plain sentences to the creator about what you gave them or changed, in their own language. Compact JSON: no indentation, no line breaks.';
  return [
    intro,
    vocabulary(),
    craft,
    `The champion: ${JSON.stringify({ name: def.name, title: def.title, role: def.role })}.`,
    task
  ].join("\n\n");
}
function formState5(def) {
  const looks = Object.fromEntries(KIT_KEYS4.map((k) => [k, def.abilities[k].look ?? null]));
  return [
    `The kit on the form right now:
${kitSummary2(def)}`,
    `The looks on the form right now (null means the spell has none yet): ${JSON.stringify(looks)}`
  ].join("\n\n");
}
function parseLookSuggestion(text2) {
  const start = text2.indexOf("{");
  const end = text2.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(text2.slice(start, end + 1));
    if (typeof raw !== "object" || raw === null) return null;
    if (typeof raw.looks !== "object" || raw.looks === null) return null;
    const comment = typeof raw.comment === "string" ? raw.comment.slice(0, 400) : "";
    return { comment, looks: raw.looks };
  } catch {
    return null;
  }
}
function toApiMessages5(turns, intro, state, image, mediaType) {
  return turns.map((t, i) => {
    if (t.role === "assistant") return { role: "assistant", content: t.text };
    let text2 = i === 0 ? `${intro}

The creator says: ${t.text}` : t.text;
    if (i === turns.length - 1) text2 = `${text2}

${state}`;
    if (i > 0 || !image) return { role: "user", content: text2 };
    return {
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: image.toString("base64") }
        },
        { type: "text", text: text2 }
      ]
    };
  });
}
function withLooks(def, looks) {
  const abilities = { ...def.abilities };
  for (const k of KIT_KEYS4) {
    const look = looks[k];
    if (look === void 0) continue;
    abilities[k] = look === null ? { ...abilities[k], look: void 0 } : { ...abilities[k], look };
  }
  return { ...def, abilities };
}
async function suggestLook(deps, accountId, req) {
  if (!deps.apiKey) {
    return { ok: false, error: "suggestions are not configured on this server yet" };
  }
  const row = deps.store.getForged(req.id);
  if (!row || row.accountId !== accountId) {
    return { ok: false, error: "no such champion on this account" };
  }
  if (row.status === "finalized") {
    return { ok: false, error: "the spells are sealed; looks are proposed on drafts only" };
  }
  const badThread = threadError(req.messages);
  if (badThread !== null) return { ok: false, error: badThread };
  let base = row.def;
  if (req.def !== void 0) {
    if (typeof req.def !== "object" || req.def === null) {
      return { ok: false, error: "malformed form state" };
    }
    base = { ...req.def, id: row.def.id, creator: row.def.creator };
  }
  let image = null;
  let mediaType = "image/png";
  const splash = deps.store.chosenArt(req.id, "splash");
  if (splash) {
    const read = deps.readImage ?? ((p) => (0, import_node_fs12.readFileSync)(p));
    try {
      image = read(import_node_path10.default.join(deps.assetsDir, splash.path));
      mediaType = imageMediaType(image);
    } catch {
      image = null;
    }
  }
  const apiMessages = toApiMessages5(
    req.messages,
    preamble3(base),
    formState5(base),
    image,
    mediaType
  );
  let lastErrors = [];
  const progress = req.onProgress ?? (() => {
  });
  let stage = "Reading the kit and painting the spells";
  for (let attempt = 0; attempt < SUGGEST_ATTEMPTS; attempt += 1) {
    progress({ kind: "stage", text: stage });
    let text2;
    try {
      text2 = await askModel(deps, apiMessages, (delta) => progress({ kind: "text", text: delta }));
    } catch (err) {
      const e = err;
      const why = e.name === "TimeoutError" ? "the model took too long to answer; try again" : e.message;
      return { ok: false, error: `the suggestion call failed: ${why}` };
    }
    progress({ kind: "stage", text: "Checking the looks against the vocabulary" });
    const retry = (feedback2, next) => {
      apiMessages.push({ role: "assistant", content: text2 }, { role: "user", content: feedback2 });
      stage = next;
    };
    const suggestion = parseLookSuggestion(text2);
    if (!suggestion) {
      lastErrors = ["the answer was not the requested JSON object"];
      retry(
        "That was not the requested JSON object; answer with ONLY the JSON.",
        "The answer was not a set of looks, asking again"
      );
      continue;
    }
    const wordErrors = [];
    for (const k of KIT_KEYS4) {
      const look = suggestion.looks[k];
      if (look === void 0 || look === null) continue;
      wordErrors.push(...spellLookErrors(look, `${k}.look`));
    }
    const candidate = withLooks(base, suggestion.looks);
    const v = validateForged(candidate);
    const errors = wordErrors.length > 0 ? wordErrors : v.ok ? [] : v.errors;
    if (errors.length > 0) {
      lastErrors = errors;
      retry(
        `These looks are not in the vocabulary, fix them precisely: ${errors.join("; ")}`,
        "A look used a word the game does not know, asking for a fix"
      );
      continue;
    }
    return {
      ok: true,
      comment: suggestion.comment,
      looks: Object.fromEntries(
        KIT_KEYS4.map((k) => [k, candidate.abilities[k].look ?? null])
      ),
      raw: text2.slice(0, CHAT_RAW_TEXT_MAX)
    };
  }
  return {
    ok: false,
    error: `the looks did not clear the vocabulary: ${lastErrors.slice(0, 3).join("; ")}`
  };
}

// server/tick_meter.ts
var TickMeter = class {
  constructor(now, windowMs = 5e3) {
    this.windowMs = windowMs;
    this.since = now;
  }
  windowMs;
  since;
  ticks = 0;
  busyMs = 0;
  maxMs = 0;
  late = 0;
  bytes = 0;
  lastReport = null;
  // One tick's cost; late when it ran as a catch-up (the second or later
  // tick of one timer callback).
  tick(durationMs, late) {
    this.ticks++;
    this.busyMs += Math.max(0, durationMs);
    if (durationMs > this.maxMs) this.maxMs = durationMs;
    if (late) this.late++;
  }
  sent(bytes) {
    this.bytes += Math.max(0, bytes);
  }
  // The window's report once it has elapsed, and a fresh window begins;
  // null until then.
  report(now, matches2, clients2) {
    const elapsed = now - this.since;
    if (elapsed < this.windowMs) return null;
    const seconds = elapsed / 1e3;
    const r = {
      seconds: round(seconds, 1),
      ticks: this.ticks,
      ticksPerSecond: round(this.ticks / seconds, 1),
      avgMs: this.ticks > 0 ? round(this.busyMs / this.ticks, 2) : 0,
      maxMs: round(this.maxMs, 2),
      late: this.late,
      bytesOut: this.bytes,
      bytesPerSecond: Math.round(this.bytes / seconds),
      matches: matches2,
      clients: clients2
    };
    this.since = now;
    this.ticks = 0;
    this.busyMs = 0;
    this.maxMs = 0;
    this.late = 0;
    this.bytes = 0;
    this.lastReport = r;
    return r;
  }
  // The most recent report, for anyone asking between windows.
  last() {
    return this.lastReport;
  }
};
function round(v, digits) {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}
function formatTickReport(r) {
  const out = r.bytesPerSecond >= 1e6 ? `${round(r.bytesPerSecond / 1e6, 2)} MB/s` : `${Math.round(r.bytesPerSecond / 1e3)} kB/s`;
  return `tick: ${r.ticks} in ${r.seconds} s (${r.ticksPerSecond}/s), avg ${r.avgMs} ms, max ${r.maxMs} ms, late ${r.late}, out ${out}, matches ${r.matches}, clients ${r.clients}`;
}

// server/visit_cookie.ts
var VISIT_COOKIE = "col_visit";
var VISIT_MAX_AGE_S = 13 * 30 * 24 * 3600;
var VISIT_OFF = "off";
var ID2 = /^[0-9a-f]{32}$/;
function isVisitId(value) {
  return typeof value === "string" && ID2.test(value);
}
function visitChoice(search) {
  const value = new URLSearchParams(search).get("stats");
  return value === "off" ? "off" : value === "on" ? "on" : null;
}
function nextVisit(current, choice, mint) {
  if (choice === "off") return { kind: "set", value: VISIT_OFF };
  if (choice === "on") return { kind: "set", value: mint() };
  if (current === VISIT_OFF) return { kind: "keep", value: VISIT_OFF };
  if (isVisitId(current)) return { kind: "keep", value: current };
  return { kind: "set", value: mint() };
}
function visitIdOf(action) {
  if (action.kind === "clear") return null;
  return isVisitId(action.value) ? action.value : null;
}
var VISIT_META = "visit";
function visitTag(id) {
  return `<meta name="${VISIT_META}" content="${id}">`;
}
function withVisitTag(html, id) {
  if (id === null || !isVisitId(id)) return html;
  const at = html.search(/<\/head>/i);
  if (at < 0) return html;
  return `${html.slice(0, at)}    ${visitTag(id)}
  ${html.slice(at)}`;
}

// server/main.ts
var PORT = Number(process.env.PORT ?? 8787);
var HOST = process.env.HOST?.trim() || void 0;
var DIST = import_node_path11.default.resolve(process.cwd(), "dist");
var BUILD_ID = buildId(readBuildId(DIST), deployStamp());
var DATA_DIR = process.env.DATA_DIR ?? import_node_path11.default.resolve(process.cwd(), "data");
var TICK_MS = DT * 1e3;
var MATCH_LINGER_MS = 2e4;
var REJOIN_GRACE_MS = 6e4;
var MAX_MSG_BYTES = 4096;
var MAX_MSGS_PER_SEC = 60;
var MAX_MATCHES = 50;
var EDGE = edgeConfig(process.env);
var MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".map": "application/json",
  ".json": "application/json",
  ".png": "image/png",
  ".webp": "image/webp",
  // The landing art is the one jpg in the tree, and the first thing a
  // visitor loads. Without this it went out as application/octet-stream,
  // which browsers sniff past for an <img> but which makes the preload
  // link in ui/home_backdrop.ts a coin flip.
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  // The display face, self-hosted (PRIVACY.md). A font sent as
  // application/octet-stream is refused outright by a browser that trusts
  // nosniff, and the page silently falls back to Georgia.
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".glb": "model/gltf-binary",
  ".wasm": "application/wasm",
  // The recorded sound bank (public/sfx/).
  ".ogg": "audio/ogg"
};
var clients = /* @__PURE__ */ new Map();
var matches = /* @__PURE__ */ new Map();
var rejoins = new RejoinRegistry();
var nextClientId = 1;
var nextMatchId = 1;
var registry = new AccountRegistry(import_node_path11.default.join(DATA_DIR, "accounts.json"));
var practiceReports = new PracticeReportStore(import_node_path11.default.join(DATA_DIR, "practice.jsonl"));
var feedback = new FeedbackStore(import_node_path11.default.join(DATA_DIR, "feedback.jsonl"));
var sessions = new SessionStore(import_node_path11.default.join(DATA_DIR, "sessions.json"));
var guests = new GuestStore();
var logins = new LoginThrottle();
var tokens = new TokenStore(import_node_path11.default.join(DATA_DIR, "tokens.json"));
var resets = new LoginThrottle();
var mailer = mailerFromEnv(process.env);
var ORIGIN = publicOrigin(process.env, EDGE.origins, PORT);
var DISCORD = discordConfigFromEnv(process.env, ORIGIN);
var discord = DISCORD ? new DiscordOauth(DISCORD) : null;
var discordFlows = new DiscordFlows();
var forgeStore = new ForgeStore(import_node_path11.default.join(DATA_DIR, "forge.sqlite3"));
var botStore = new BotStore(import_node_path11.default.join(DATA_DIR, "bots.sqlite3"));
var STATS_WEBSITE_ID = (process.env.STATS_WEBSITE_ID ?? "").trim();
var STATS_ON = isWebsiteId(STATS_WEBSITE_ID);
var ASSETS_DIR = import_node_path11.default.join(DATA_DIR, "assets");
function generationFromEnv() {
  let provider = null;
  let imagePrice = IMAGE_PRICE_RESOLD;
  if (process.env.TRIPO_API_KEY) {
    const tripo = new TripoProvider(process.env.TRIPO_API_KEY, {
      ...process.env.TRIPO_IMAGE_MODEL ? { imageModel: process.env.TRIPO_IMAGE_MODEL } : {}
    });
    provider = tripo;
    if (process.env.OPENAI_API_KEY) {
      const art = new OpenAIImages(process.env.OPENAI_API_KEY, {
        ...process.env.OPENAI_IMAGE_MODEL ? { model: process.env.OPENAI_IMAGE_MODEL } : {},
        ...process.env.OPENAI_IMAGE_SIZE ? { size: process.env.OPENAI_IMAGE_SIZE } : {},
        ...process.env.OPENAI_IMAGE_QUALITY ? { quality: process.env.OPENAI_IMAGE_QUALITY } : {}
      });
      provider = new SplitProvider(art, tripo, { stageDir: import_node_path11.default.join(DATA_DIR, "staged") });
      imagePrice = EMBER_PRICES.image;
      console.log(
        `generation: 2D on OpenAI (${process.env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL}), 3D on Tripo; an image costs ${imagePrice} embers instead of ${IMAGE_PRICE_RESOLD}`
      );
    }
    void tripo.balance().then((credits) => {
      console.log(
        `generation: tripo (TRIPO_API_KEY set), real generations from here on; credit balance ${credits < 0 ? "unavailable" : credits}`
      );
    });
  } else if (process.env.GENERATION_PROVIDER === "mock") {
    console.log("generation: mock provider (GENERATION_PROVIDER=mock), placeholder assets");
    provider = new MockProvider();
    imagePrice = EMBER_PRICES.image;
  }
  if (!provider) return null;
  return {
    storage: forgeStore,
    provider,
    imagePrice,
    assetsDir: ASSETS_DIR,
    // The house clip library ships inside the served client build.
    publicDir: DIST,
    // Per-champion asset budgets (ADR 0010), server-configurable like
    // every other number in the plan; zero disables one.
    budgets: {
      imageKb: envNumber("ASSET_MAX_IMAGE_KB", 4096),
      // A real five-clip baked GLB measured 58 MB live (2026-08-31): the
      // ceiling bounds abuse, not the normal case, until compression
      // tuning lands.
      modelKb: envNumber("ASSET_MAX_MODEL_KB", 81920)
    },
    download: provider.id === "mock" ? (url, dest) => {
      (0, import_node_fs13.mkdirSync)(import_node_path11.default.dirname(dest), { recursive: true });
      (0, import_node_fs13.writeFileSync)(dest, placeholderFor(url, dest));
      return Promise.resolve();
    } : downloadToFile
  };
}
var generation2 = generationFromEnv();
{
  const swept = recoverStaleJobs(forgeStore);
  if (swept > 0) console.log(`generation: refunded ${swept} job(s) killed by the last shutdown`);
}
function envNumber(name, fallback) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
var botDeps = {
  store: botStore,
  botCap: envNumber("BOT_CAP", 100),
  depositCap: envNumber("BOT_DEPOSIT_CAP", 3),
  // The collection alone, without the week's rotation: a bot outlives the
  // week it was made in, and one written on a rotating champion would
  // stop being fieldable on the Monday (ADR 0018).
  collectionOf: (accountId) => registry.collection(accountId)
};
var botPageDeps = {
  store: botStore,
  ownerName: (accountId) => registry.findById(accountId)?.name ?? null
};
var coachDeps = {
  store: botStore,
  apiKey: process.env.ANTHROPIC_API_KEY?.trim() || null,
  ...process.env.BOT_COACH_MODEL?.trim() ? { model: process.env.BOT_COACH_MODEL.trim() } : {},
  // The calibration log and the ledger both live in the Forge store, for
  // every paid act in the game and not only the Forge's own (ADR 0017).
  spend: (sample) => forgeStore.addSpendSample(sample),
  charge: (accountId, embers, ref) => forgeStore.addCreditEntry({
    accountId,
    delta: -embers,
    reason: "spend",
    ref,
    at: Date.now()
  }),
  balance: (accountId) => forgeStore.creditBalance(accountId)
};
var forgeDeps = {
  store: forgeStore,
  generation: generation2,
  emberGrant: envNumber("EMBERS_PER_WEEK", EMBERS_PER_WEEK),
  draftCap: envNumber("FORGE_DRAFT_CAP", 50)
};
var galleryDeps = {
  store: forgeStore,
  reportThreshold: envNumber("REPORT_TAKEDOWN_THRESHOLD", 3)
};
var quotaDeps = {
  store: forgeStore,
  ceilings: {
    generation: envNumber("SERVER_GENERATIONS_PER_DAY", CEILING_DEFAULTS.generation),
    animate: envNumber("SERVER_ANIMATIONS_PER_DAY", CEILING_DEFAULTS.animate),
    gen2d: envNumber("SERVER_2D_PER_DAY", CEILING_DEFAULTS.gen2d),
    agent: envNumber("SERVER_AGENT_PER_DAY", CEILING_DEFAULTS.agent)
  }
};
var suggestDeps = {
  store: forgeStore,
  apiKey: process.env.ANTHROPIC_API_KEY?.trim() || null,
  assetsDir: ASSETS_DIR,
  ...process.env.SUGGEST_MODEL?.trim() ? { model: process.env.SUGGEST_MODEL.trim() } : {}
};
console.log(
  suggestDeps.apiKey ? "suggestions: on (ANTHROPIC_API_KEY set), the kit, stat and look conversations are live" : "suggestions: off (no ANTHROPIC_API_KEY set)"
);
if (generation2 && suggestDeps.apiKey) {
  generation2.checkReference = (image) => checkReference(suggestDeps, image).then(
    (v) => v === null || v.usable ? null : refusalMessage(v)
  );
  console.log("generation: the model reference is read before a build spends on it");
}
var artDeps = {
  store: forgeStore,
  generation: generation2,
  quota: quotaDeps,
  historyCap: envNumber("ART_HISTORY_CAP", 12)
};
var apiLimiter = new ApiLimiter(envNumber("API_RATE_PER_MIN", API_RATE_PER_MIN));
var MATCHES_FILE = import_node_path11.default.join(DATA_DIR, "matches.jsonl");
var REPLAYS_DIR = import_node_path11.default.join(DATA_DIR, "replays");
var REPLAY_KEEP = 40;
var matchLog = readJsonl(MATCHES_FILE);
function payLaurels(rec) {
  for (const seat of rec.players) {
    if (seat.accountId === null) continue;
    if (!playedByHand(seatWay(rec, seat))) continue;
    registry.award(seat.accountId, seat.team === rec.winner, rec.at, rec.rated);
  }
}
var RECRUIT_REFUSALS = {
  unknown_account: "This needs an account.",
  not_for_sale: "That champion is not for sale.",
  already_owned: "That champion is already in your collection.",
  not_enough_laurels: "Not enough laurels for that champion yet."
};
function seedStandingAccounts() {
  let seeded = 0;
  for (const a of registry.all()) {
    const { laurels, lastWinDay } = backfillLaurels(matchLog, a.id);
    if (registry.seedLaurels(a.id, laurels, lastWinDay)) seeded++;
  }
  if (seeded > 0) console.log(`laurels: ${seeded} account(s) credited from the match log`);
}
seedStandingAccounts();
nextMatchId = maxNumberedJson(REPLAYS_DIR) + 1;
for (const id of botStore.heldReplayIds()) if (id >= nextMatchId) nextMatchId = id + 1;
for (const m of matchLog)
  if (m.replayId !== void 0 && m.replayId >= nextMatchId) nextMatchId = m.replayId + 1;
var ARENA_WORKER = import_node_path11.default.join(__dirname, "arena_worker.cjs");
var arenaRunner = new ArenaRunner((0, import_node_fs13.existsSync)(ARENA_WORKER) ? ARENA_WORKER : null);
var arenaDeps = {
  store: botStore,
  runner: arenaRunner,
  nameOf: (aid) => registry.findById(aid)?.name ?? null,
  nextMatchId: () => nextMatchId++,
  saveReplay: (id, record) => {
    saveJsonAtomic(import_node_path11.default.join(REPLAYS_DIR, `${id}.json`), record);
    pruneNumberedJson(REPLAYS_DIR, REPLAY_KEEP, botStore.heldReplayIds());
  },
  recordMatch: (rec) => {
    matchLog.push(rec);
    appendJsonl(MATCHES_FILE, rec);
    payLaurels(rec);
  },
  roundMs: envNumber("ARENA_ROUND_MINUTES", 60) * 6e4,
  playNowPerDay: envNumber("ARENA_PLAY_NOW_PER_DAY", ARENA_PLAY_NOW_PER_DAY),
  log: (line) => console.log(line)
};
var nightCoachDeps = {
  store: botStore,
  runner: arenaRunner,
  coach: coachDeps.apiKey ? (accountId, botId, message) => (
    // Marked as the night's own spend: nobody is watching this one,
    // which is exactly what makes it worth telling apart.
    coachPlaybook({ ...coachDeps, spendDetail: "night" }, accountId, {
      id: botId,
      messages: [{ role: "user", text: message }],
      depth: "quick"
    })
  ) : null,
  records: () => matchLog,
  // The night's model call is the only paid step; it is spent on bots
  // whose owner is still around (server/night_eligibility.ts).
  ownerSeenAt: (accountId) => registry.findById(accountId)?.seenAt ?? null,
  idleDays: envNumber("COACH_IDLE_DAYS", COACH_IDLE_DAYS),
  sparringPerSide: envNumber("SPARRING_PER_SIDE", 3),
  log: (line) => console.log(line)
};
var REGISTER_ERRORS = {
  name_invalid: nameErrorMessage("charset"),
  name_taken: "That name is taken.",
  password_invalid: passwordErrorMessage("too_short"),
  email_invalid: emailErrorMessage("shape"),
  email_taken: "An account already uses that email address."
};
function rankedBotsOf(accountId) {
  return botStore.listByAccount(accountId).filter((b) => b.deposited).map((b) => ({
    id: b.id,
    name: b.name,
    championId: b.championId,
    tally: botStore.ratedTally(b.id)
  }));
}
function describeAccount(a) {
  return {
    ...publicAccount(a),
    profile: buildProfile(matchLog, a.id),
    bots: rankedBotsOf(a.id)
  };
}
function ladderSeeds(way) {
  if (way === "hand") {
    return registry.all().map((a) => ({
      id: a.id,
      accountId: a.id,
      name: a.name,
      rating: a.rating,
      games: a.ratedGames,
      createdAt: a.createdAt
    }));
  }
  if (way === "forge") {
    return forgeStore.listForgeRatings().map((r) => ({
      id: r.accountId,
      accountId: r.accountId,
      name: registry.findById(r.accountId)?.name ?? null,
      rating: r.rating,
      games: r.games
    }));
  }
  return botStore.listBotRatings(way === "bot" ? "live" : "arena").map((r) => {
    const bot = botStore.getBot(r.botId);
    const owner = registry.findById(r.accountId)?.name ?? null;
    return {
      id: r.botId,
      accountId: r.accountId,
      // A bot whose row outlived it, or whose owner is gone, does not place.
      name: bot && owner !== null ? bot.name : null,
      owner,
      ...bot ? { championId: bot.championId } : {},
      rating: r.rating,
      games: r.games,
      ...bot ? { createdAt: bot.createdAt } : {}
    };
  });
}
function wayStatsFor(way) {
  if (way === "bot" || way === "arena") {
    const out = /* @__PURE__ */ new Map();
    for (const r of botStore.listBotRatings(way === "bot" ? "live" : "arena")) {
      const bot = botStore.getBot(r.botId);
      if (!bot) continue;
      out.set(r.botId, botWayStats(listEntries(botStore, r.botId), way, bot.championId));
    }
    return out;
  }
  return new Map(wayStatsOf(matchLog, way));
}
var WAYS = ["hand", "bot", "arena", "forge"];
function wayParam(rawUrl) {
  const way = new URLSearchParams((rawUrl ?? "").split("?")[1] ?? "").get("way") ?? "hand";
  return WAYS.includes(way) ? way : null;
}
function describeSelf(a) {
  refreshWeeklyGrant(forgeDeps, a.id);
  return {
    ...selfAccount(a),
    profile: buildProfile(matchLog, a.id),
    embers: forgeStore.creditBalance(a.id),
    embersPerWeek: envNumber("EMBERS_PER_WEEK", EMBERS_PER_WEEK)
  };
}
async function sendConfirmation(account) {
  if (!account.email || account.email.confirmed) return;
  const token = tokens.issue("confirm", account.id, account.email.address, Date.now());
  const sent = await mailer.send(
    confirmMail(
      account.email.address,
      account.name,
      confirmUrl(ORIGIN, token.token),
      CONFIRM_TTL_MS
    )
  );
  if (!sent) console.error(`confirmation mail not delivered for account ${account.id}`);
}
function send(clientId, msg) {
  const c = clients.get(clientId);
  if (!c || c.ws.readyState !== c.ws.OPEN) return;
  const text2 = JSON.stringify(msg);
  meter.sent(text2.length);
  c.ws.send(text2);
}
function forgedPayload(match) {
  if (match.forgedDefs.length === 0) return {};
  return {
    forged: [...match.forgedDefs],
    forgedAssets: forgedMatchAssets(forgeStore, match.forgedDefs)
  };
}
function onMatchReady(forge) {
  return (picks, source) => {
    const id = nextMatchId++;
    const seed = Date.now() % 2e9 + id;
    const present = /* @__PURE__ */ new Set();
    for (const p of picks) {
      const c = clients.get(p.clientId);
      if (c) present.add(c.accountId);
    }
    const pool = [];
    for (const bot of botStore.listDeposited()) {
      if (present.has(bot.accountId)) continue;
      const owner = registry.findById(bot.accountId)?.name;
      if (owner) pool.push({ bot, owner });
    }
    const seated = fillWithBots(picks, seed, TEAM_SIZE, pool);
    const match = new Match(seed, seated);
    const botSeats = /* @__PURE__ */ new Map();
    for (const p of seated) {
      if (p.playbook === void 0) continue;
      if (p.ownerId !== void 0) {
        const unitId = match.unitIdOfPick(seated.indexOf(p));
        if (unitId !== void 0) {
          botSeats.set(unitId, {
            accountId: p.ownerId,
            name: p.name,
            ...p.botId !== void 0 ? { botId: p.botId } : {},
            ...p.botVersion !== void 0 ? { version: p.botVersion } : {}
          });
        }
        continue;
      }
      const c = clients.get(p.clientId);
      const player = match.players.get(p.clientId);
      if (c && player) {
        botSeats.set(player.unitId, {
          accountId: c.accountId,
          name: p.name,
          ...p.botId !== void 0 ? { botId: p.botId } : {},
          ...p.botVersion !== void 0 ? { version: p.botVersion } : {}
        });
      }
    }
    matches.set(id, {
      match,
      endedAt: null,
      failures: 0,
      abandonedAt: null,
      // A Guest seated by hand makes it unrated for everyone (ADR 0024).
      ratedEligible: ratedWithGuests(
        source === "queue",
        picks.flatMap((p) => {
          const c = clients.get(p.clientId);
          return c ? [c.accountId] : [];
        })
      ),
      forge,
      botSeats,
      publicQueue: source === "queue" && !forge,
      dropIns: /* @__PURE__ */ new Set(),
      ledger: new PlayLedger()
    });
    for (const p of picks) {
      const c = clients.get(p.clientId);
      if (!c) continue;
      c.matchId = id;
      const player = match.players.get(p.clientId);
      if (player) {
        send(p.clientId, {
          t: "match_start",
          selfUnitId: player.unitId,
          team: p.team,
          ...player.coach ? { coach: true } : {},
          ...forgedPayload(match)
        });
      }
    }
    console.log(`match ${id} started with ${picks.length} player(s)${forge ? " (forge)" : ""}`);
  };
}
function collectionOfClient(c) {
  return c.guest ? [...STARTER_COLLECTION] : registry.collection(c.accountId);
}
var matchmaker = new Matchmaker(send, onMatchReady(false), void 0, {
  // What this client may pick of the roster (ADR 0018): its collection
  // plus the week's rotation. A client with no account picks nothing here
  // anyway, so answering null for one leaves the wall to the account wall.
  resolvePlayable: (clientId) => {
    const c = clients.get(clientId);
    if (!c) return null;
    return playableAt(collectionOfClient(c), Date.now());
  },
  // Bot seats (ADR 0013): the resolver is the account boundary, answering
  // with the seat when THIS client owns the bot, re-validated so a stored
  // playbook that predates a validator tightening never reaches a match.
  resolveBot: (clientId, botId) => {
    const c = clients.get(clientId);
    if (!c) return null;
    const bot = botStore.getBot(botId);
    if (!bot || bot.accountId !== c.accountId) return null;
    const v = validatePlaybook(bot.playbook);
    if (!v.ok) return null;
    return {
      name: bot.name,
      championId: bot.championId,
      sigils: bot.sigils,
      skin: bot.skin,
      playbook: v.def,
      botId: bot.id,
      version: bot.version
    };
  }
});
var forgeMatchmaker = new Matchmaker(send, onMatchReady(true), void 0, {
  forge: true,
  // What this client may pick of the roster (ADR 0018): its collection
  // plus the week's rotation. A client with no account picks nothing here
  // anyway, so answering null for one leaves the wall to the account wall.
  resolvePlayable: (clientId) => {
    const c = clients.get(clientId);
    if (!c) return null;
    return playableAt(collectionOfClient(c), Date.now());
  },
  resolveForged: (clientId, championId) => {
    const c = clients.get(clientId);
    if (!c) return null;
    const row = forgeStore.getForged(championId);
    if (!row || !canPlayForged(row, c.accountId)) return null;
    return validateForged(row.def).ok ? row.def : null;
  }
});
var matchmakers = [matchmaker, forgeMatchmaker];
function walkOutOfMatch(client, entry, matchId) {
  client.matchId = null;
  rejoins.drop(client.accountId);
  const coach = entry.match.players.get(client.id)?.coach === true;
  const droppedIn = entry.dropIns.has(client.accountId);
  if (entry.ratedEligible && entry.match.sim.winner === null && !coach && !droppedIn) {
    const humansByTeam = [0, 0];
    for (const p of entry.match.players.values()) {
      if (clients.has(p.clientId)) humansByTeam[p.team] += 1;
    }
    const penalty = leaverPenalty(humansByTeam);
    const account = registry.findById(client.accountId);
    if (penalty > 0 && account) {
      if (entry.forge) forgeStore.penalizeForgeRating(account.id, penalty);
      else registry.penalize(account.id, penalty);
      rejoins.lockQueue(client.accountId, Date.now() + LEAVER_LOCKOUT_MS);
      console.log(
        `match ${matchId}: ${client.name} left a rated match (-${penalty}, queue locked)`
      );
    }
  }
  const left = entry.match.handleDisconnect(client.id);
  if (left) {
    for (const cid of entry.match.players.keys()) {
      send(cid, { t: "player_left", name: left.name, team: left.team });
    }
  }
  const anyConnected = [...entry.match.players.keys()].some((cid) => clients.has(cid));
  if (!anyConnected && entry.abandonedAt === null) {
    entry.abandonedAt = Date.now();
    console.log(`match ${matchId} abandoned: holding for rejoin grace`);
  }
}
function dropInCandidates() {
  const out = [];
  for (const [matchId, entry] of matches) {
    let humans = 0;
    for (const p of entry.match.players.values()) if (clients.has(p.clientId)) humans += 1;
    out.push({
      matchId,
      time: entry.match.sim.time,
      humans,
      openSeats: entry.match.openBotSeats,
      joinable: entry.publicQueue && entry.endedAt === null && entry.abandonedAt === null
    });
  }
  return out;
}
function dropInto(client) {
  const matchId = chooseDropIn(dropInCandidates());
  if (matchId === null) return false;
  const entry = matches.get(matchId);
  if (!entry) return false;
  for (const mm of matchmakers) mm.removeEverywhere(client.id);
  const seat = entry.match.takeBotSeat(client.id, client.name);
  if (!seat) return false;
  client.matchId = matchId;
  entry.dropIns.add(client.accountId);
  if (client.guest) entry.ratedEligible = false;
  if (seat.pool) entry.botSeats.delete(seat.unitId);
  send(client.id, {
    t: "match_start",
    selfUnitId: seat.unitId,
    team: seat.team,
    dropIn: true,
    ...forgedPayload(entry.match)
  });
  for (const cid of entry.match.players.keys()) {
    if (cid !== client.id) send(cid, { t: "player_joined", name: client.name, team: seat.team });
  }
  console.log(`match ${matchId}: ${client.name} dropped in on team ${seat.team}`);
  return true;
}
function cookieSecure(req) {
  if ((req.headers["x-forwarded-proto"] ?? "").toString().split(",")[0]?.trim() === "https") {
    return true;
  }
  const host = (req.headers.host ?? "").split(":")[0];
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}
function accountForRequest(req, now) {
  const id = parseCookies(req.headers.cookie).get(COOKIE_NAME);
  if (!id) return void 0;
  const session = sessions.resolve(id, now);
  if (!session) return void 0;
  const account = registry.findById(session.accountId);
  if (!account) return void 0;
  sessions.touch(id, now);
  registry.touch(account.id, now);
  return account;
}
function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}
var MAX_BODY_BYTES = 2048;
async function readJsonBody(req, maxBytes = MAX_BODY_BYTES) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) return null;
    chunks.push(chunk);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}
function addCookie(res, cookie) {
  const existing = res.getHeader("set-cookie");
  const already = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
  res.setHeader("set-cookie", [...already, cookie]);
}
function openSession(res, req, account) {
  const session = sessions.create(account.id, Date.now());
  addCookie(
    res,
    serializeCookie(COOKIE_NAME, session.id, {
      maxAgeS: Math.floor(SESSION_TTL_MS / 1e3),
      secure: cookieSecure(req)
    })
  );
}
var server = import_node_http.default.createServer(async (req, res) => {
  try {
    const url = (req.url ?? "/").split("?")[0];
    if (url.startsWith("/api/")) {
      const address = clientAddress(req.headers, req.socket.remoteAddress, EDGE);
      if (!apiLimiter.allow(address, Date.now())) {
        res.setHeader("retry-after", "60");
        sendJson(res, 429, { error: "Too many requests; slow down." });
        return;
      }
    }
    if (url === "/api/register" || url === "/api/login") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "use POST" });
        return;
      }
      const body2 = await readJsonBody(req);
      const name = typeof body2?.name === "string" ? body2.name.trim() : "";
      const password = typeof body2?.password === "string" ? body2.password : "";
      const email = typeof body2?.email === "string" ? body2.email.trim() : "";
      const now = Date.now();
      const keys = [
        accountKey(foldName(name)),
        addressKey(clientAddress(req.headers, req.socket.remoteAddress, EDGE))
      ];
      const wait = logins.retryAfterAny(keys, now);
      if (wait > 0) {
        res.setHeader("retry-after", String(Math.ceil(wait / 1e3)));
        sendJson(res, 429, {
          error: `Too many attempts. Try again in ${Math.ceil(wait / 1e3)}s.`
        });
        return;
      }
      if (url === "/api/register") {
        const created = registry.register(name, password, email, now);
        if (!created.ok) {
          for (const key of keys) logins.recordFailure(key, now);
          sendJson(res, 409, { error: REGISTER_ERRORS[created.error] });
          return;
        }
        for (const key of keys) logins.recordSuccess(key);
        openSession(res, req, created.value);
        sendJson(res, 200, selfAccount(created.value));
        void sendConfirmation(created.value);
        return;
      }
      const account = registry.authenticate(name, password);
      if (!account) {
        for (const key of keys) logins.recordFailure(key, now);
        sendJson(res, 401, { error: "Wrong name or password." });
        return;
      }
      for (const key of keys) logins.recordSuccess(key);
      registry.touch(account.id, now);
      openSession(res, req, account);
      sendJson(res, 200, selfAccount(account));
      return;
    }
    if (url === "/api/guest") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "use POST" });
        return;
      }
      const now = Date.now();
      const held2 = parseCookies(req.headers.cookie).get(GUEST_COOKIE);
      const known = held2 ? guests.resolve(held2, now) : void 0;
      if (known) {
        sendJson(res, 200, { name: known.name });
        return;
      }
      const { token, guest } = guests.issue(now);
      addCookie(
        res,
        serializeCookie(GUEST_COOKIE, token, {
          maxAgeS: Math.floor(GUEST_TTL_MS / 1e3),
          secure: cookieSecure(req)
        })
      );
      sendJson(res, 200, { name: guest.name });
      return;
    }
    if (url === "/api/public/presence") {
      sendJson(res, 200, presenceOf(dropInCandidates(), matchmaker.queuedCount));
      return;
    }
    if (url === "/api/collection") {
      const now = Date.now();
      const me = accountForRequest(req, now);
      sendJson(res, 200, {
        laurels: me ? registry.laurels(me.id) : 0,
        collection: me ? registry.collection(me.id) : [...STARTER_COLLECTION],
        rotation: rotationAt(now),
        prices: CHAMPION_PRICES
      });
      return;
    }
    if (url === "/api/practice/report") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "use POST" });
        return;
      }
      const report2 = parsePracticeReport(await readJsonBody(req, 8192));
      if (report2) practiceReports.append(report2, Date.now());
      sendJson(res, report2 ? 200 : 400, { ok: report2 !== null });
      return;
    }
    if (url === "/api/feedback") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "use POST" });
        return;
      }
      const written = parseFeedback(await readJsonBody(req, 8192));
      if (written) {
        feedback.append(written, Date.now());
        console.log(`feedback: ${written.text.length} characters from the ${written.where}`);
      }
      sendJson(res, written ? 200 : 400, { ok: written !== null });
      return;
    }
    if (url === "/api/public/stats") {
      sendJson(res, 200, {
        online: clients.size,
        matches: [...matches.values()].filter((e) => e.endedAt === null).length,
        accounts: registry.count
      });
      return;
    }
    if (url === "/api/public/landing") {
      sendJson(
        res,
        200,
        buildLandingPage({ seeds: ladderSeeds, stats: wayStatsFor, accounts: registry.count })
      );
      return;
    }
    if (url === "/api/public/build") {
      sendJson(res, 200, buildInfo(starOrchard(), BUILD_ID));
      return;
    }
    if (url === "/api/email/confirm") {
      const token = new URLSearchParams((req.url ?? "").split("?")[1] ?? "").get("token") ?? "";
      const now = Date.now();
      const redeemed = tokens.redeem(token, "confirm", now);
      const ok = redeemed ? registry.confirmEmail(redeemed.accountId, redeemed.email, now) : false;
      res.writeHead(302, { location: `${ORIGIN}/?confirmed=${ok ? "1" : "0"}` });
      res.end();
      return;
    }
    if (url === "/api/discord/start") {
      if (!DISCORD) {
        res.writeHead(302, { location: `${ORIGIN}/?discord=off`, "cache-control": "no-store" });
        res.end();
        return;
      }
      const state = discordFlows.start(Date.now());
      res.writeHead(302, {
        location: authorizeUrl(DISCORD, state),
        "cache-control": "no-store"
      });
      res.end();
      return;
    }
    if (url === CALLBACK_PATH) {
      const q = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
      const now = Date.now();
      const land2 = (outcome) => {
        res.writeHead(302, {
          location: `${ORIGIN}/?discord=${outcome}`,
          "cache-control": "no-store"
        });
        res.end();
      };
      const flow = discordFlows.take(q.get("state") ?? "", now);
      const code = q.get("code") ?? "";
      if (!discord || !flow || code.length === 0 || code.length > 512) {
        land2("failed");
        return;
      }
      const arrival = await discord.exchange(code);
      if (!arrival) {
        land2("failed");
        return;
      }
      const { identity, joinedGuild } = arrival;
      const held2 = registry.findByDiscordId(identity.id);
      if (held2) {
        registry.linkDiscord(held2.id, identity, now);
        registry.touch(held2.id, now);
        openSession(res, req, held2);
        land2("signedin");
        return;
      }
      const created = registry.registerWithDiscord(identity, now);
      if (!created.ok) {
        land2("failed");
        return;
      }
      openSession(res, req, created.value);
      land2(joinedGuild ? "joined" : "created");
      return;
    }
    if (url === "/api/discord/status") {
      sendJson(res, 200, { configured: DISCORD !== null });
      return;
    }
    if (url === "/api/password/forgot") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "use POST" });
        return;
      }
      const body2 = await readJsonBody(req);
      const email = typeof body2?.email === "string" ? body2.email.trim() : "";
      const now = Date.now();
      const key = addressKey(clientAddress(req.headers, req.socket.remoteAddress, EDGE));
      const wait = resets.retryAfterMs(key, now);
      if (wait > 0) {
        res.setHeader("retry-after", String(Math.ceil(wait / 1e3)));
        sendJson(res, 429, {
          error: `Too many requests. Try again in ${Math.ceil(wait / 1e3)}s.`
        });
        return;
      }
      resets.recordFailure(key, now);
      const account = registry.findByConfirmedEmail(email);
      if (account?.email) {
        const token = tokens.issue("reset", account.id, account.email.address, now);
        void mailer.send(
          resetMail(
            account.email.address,
            account.name,
            resetUrl(ORIGIN, token.token),
            RESET_TTL_MS
          )
        ).then((sent) => {
          if (!sent) console.error(`reset mail not delivered for account ${account.id}`);
        });
      }
      sendJson(res, 200, { ok: true });
      return;
    }
    if (url === "/api/password/reset") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "use POST" });
        return;
      }
      const body2 = await readJsonBody(req);
      const token = typeof body2?.token === "string" ? body2.token : "";
      const password = typeof body2?.password === "string" ? body2.password : "";
      const passErr = validatePassword(password);
      if (passErr) {
        sendJson(res, 400, { error: passwordErrorMessage(passErr) });
        return;
      }
      const redeemed = tokens.redeem(token, "reset", Date.now());
      if (!redeemed || !registry.setPassword(redeemed.accountId, password)) {
        sendJson(res, 400, { error: "That link has expired or has already been used." });
        return;
      }
      sessions.revokeAllFor(redeemed.accountId);
      tokens.revokeAllFor(redeemed.accountId);
      sendJson(res, 200, { ok: true });
      return;
    }
    if (url === "/api/logout") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "use POST" });
        return;
      }
      const id = parseCookies(req.headers.cookie).get(COOKIE_NAME);
      const everywhere = new URLSearchParams((req.url ?? "").split("?")[1] ?? "").get("all") === "1";
      if (id) {
        const session = sessions.resolve(id, Date.now());
        if (everywhere && session) sessions.revokeAllFor(session.accountId);
        else sessions.revoke(id);
      }
      res.setHeader("set-cookie", clearCookie(COOKIE_NAME, { secure: cookieSecure(req) }));
      sendJson(res, 200, { ok: true });
      return;
    }
    if (url.startsWith("/api/")) {
      const me = accountForRequest(req, Date.now());
      if (!me) {
        sendJson(res, 401, { error: "This needs an account." });
        return;
      }
      if (url === "/api/me") {
        sendJson(res, 200, describeSelf(me));
        return;
      }
      if (url === "/api/collection/recruit" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const championId = typeof body2?.championId === "string" ? body2.championId : "";
        const out = registry.recruit(me.id, championId);
        if (!out.ok) {
          sendJson(res, 400, { error: RECRUIT_REFUSALS[out.error] });
          return;
        }
        sendJson(res, 200, {
          laurels: out.value,
          collection: registry.collection(me.id)
        });
        return;
      }
      if (url === "/api/bots") {
        sendJson(res, 200, listBots(botDeps, me.id));
        return;
      }
      if (url === "/api/bots/create" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, createBot(botDeps, me.id, body2));
        return;
      }
      if (url === "/api/bots/save" && req.method === "POST") {
        const body2 = await readJsonBody(req, PLAYBOOK_JSON_MAX + 4096);
        sendJson(res, 200, saveBot(botDeps, me.id, body2));
        return;
      }
      if (url === "/api/bots/delete" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, deleteBot(botDeps, me.id, body2?.id));
        return;
      }
      if (url === "/api/bots/deposit" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, setDeposited(botDeps, me.id, body2?.id, body2?.on));
        return;
      }
      if (url === "/api/bots/versions" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, listVersions(botDeps, me.id, body2?.id));
        return;
      }
      if (url === "/api/bots/version" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, getVersion(botDeps, me.id, body2?.id, body2?.version));
        return;
      }
      if (url === "/api/bots/record/add" && req.method === "POST") {
        const body2 = await readJsonBody(req, RECORD_UPLOAD_MAX);
        const found = ownedBot(botDeps, me.id, body2?.id);
        if (!found.ok) {
          sendJson(res, 200, found);
          return;
        }
        const parsed = parseUpload(body2, Date.now());
        if (!parsed.ok) {
          sendJson(res, 200, { ok: false, error: `not a sparring result: ${parsed.error}` });
          return;
        }
        let replayId = null;
        try {
          const id2 = nextMatchId++;
          saveJsonAtomic(import_node_path11.default.join(REPLAYS_DIR, `${id2}.json`), parsed.value.record);
          replayId = id2;
        } catch (err) {
          console.error("sparring replay save failed", err);
        }
        const { id } = addEntry(botStore, found.bot.id, me.id, { ...parsed.value.entry, replayId });
        pruneNumberedJson(REPLAYS_DIR, REPLAY_KEEP, botStore.heldReplayIds());
        const entry = getEntry(botStore, found.bot.id, id);
        sendJson(res, 200, {
          ok: true,
          row: entry ? rowOf(entry) : null,
          tally: talliesOf(listEntries(botStore, found.bot.id))
        });
        return;
      }
      if (url === "/api/bots/record/list" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const found = ownedBot(botDeps, me.id, body2?.id);
        sendJson(
          res,
          200,
          found.ok ? {
            ok: true,
            rows: listEntries(botStore, found.bot.id),
            tally: talliesOf(listEntries(botStore, found.bot.id))
          } : found
        );
        return;
      }
      if (url === "/api/bots/record/entry" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const found = ownedBot(botDeps, me.id, body2?.id);
        if (!found.ok) {
          sendJson(res, 200, found);
          return;
        }
        const entryId = typeof body2?.entryId === "number" ? body2.entryId : -1;
        const entry = getEntry(botStore, found.bot.id, entryId);
        sendJson(res, 200, entry ? { ok: true, entry } : { ok: false, error: "no such entry" });
        return;
      }
      if (url === "/api/bots/briefing" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const found = ownedBot(botDeps, me.id, body2?.id);
        sendJson(
          res,
          200,
          found.ok ? { ok: true, ...buildBriefing(nightCoachDeps, found.bot) } : found
        );
        return;
      }
      if (url === "/api/bots/proposal" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const found = ownedBot(botDeps, me.id, body2?.id);
        sendJson(
          res,
          200,
          found.ok ? answerProposal(nightCoachDeps, found.bot, body2?.proposalId, body2?.action) : found
        );
        return;
      }
      if (url === "/api/bots/autoapply" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, setAutoApply(botDeps, me.id, body2?.id, body2?.on));
        return;
      }
      if (url === "/api/bots/arena") {
        const now = Date.now();
        const cap = arenaDeps.playNowPerDay ?? ARENA_PLAY_NOW_PER_DAY;
        const used = botStore.arenaEventsSince(me.id, now - DAY_MS3);
        const last2 = botStore.arenaLastRoundAt();
        const roundMs = arenaDeps.roundMs ?? ARENA_ROUND_MS;
        sendJson(res, 200, {
          ok: true,
          left: cap <= 0 ? null : Math.max(0, cap - used),
          cap,
          pool: botStore.listDeposited().length,
          nextRoundInMs: last2 === null ? 0 : Math.max(0, last2 + roundMs - now)
        });
        return;
      }
      if (url === "/api/bots/open" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, setOpenPlaybook(botDeps, me.id, body2?.id, body2?.on));
        return;
      }
      if (url === "/api/bots/page" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, describeBotPage(botPageDeps, me.id, body2?.id));
        return;
      }
      if (url === "/api/bots/pool") {
        sendJson(res, 200, {
          ok: true,
          bots: botStore.listDeposited().map((b) => ({
            id: b.id,
            name: b.name,
            championId: b.championId,
            owner: registry.findById(b.accountId)?.name ?? null,
            mine: b.accountId === me.id,
            tally: botStore.ratedTally(b.id),
            arena: botStore.botRating(b.id, "arena").rating
          }))
        });
        return;
      }
      if (url === "/api/bots/challenge" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, await challenge(arenaDeps, me.id, body2?.id, body2?.target));
        return;
      }
      if (url === "/api/bots/playnow" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, await playNow(arenaDeps, me.id, body2?.id));
        return;
      }
      if (url === "/api/bots/revert" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, revertBot(botDeps, me.id, body2?.id, body2?.version));
        return;
      }
      if (url === "/api/bots/chat" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, botChat(botDeps, me.id, body2?.id));
        return;
      }
      if (url === "/api/bots/chat/clear" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        sendJson(res, 200, clearBotChat(botDeps, me.id, body2?.id));
        return;
      }
      if (url === "/api/bots/suggest" && req.method === "POST") {
        const body2 = await readJsonBody(req, PLAYBOOK_JSON_MAX + 16e4);
        const id = typeof body2?.id === "string" ? body2.id : null;
        const text2 = typeof body2?.text === "string" ? body2.text : null;
        if (!id || text2 === null && !Array.isArray(body2?.messages)) {
          sendJson(res, 400, { ok: false, error: "malformed request" });
          return;
        }
        const stored = text2 !== null ? botStore.getChat(id) : [];
        const quota = checkQuota(quotaDeps, "agent");
        if (!quota.ok) {
          sendJson(res, 200, quota);
          return;
        }
        res.writeHead(200, {
          "content-type": "application/x-ndjson",
          "cache-control": "no-store",
          "x-accel-buffering": "no"
        });
        const outcome = await coachPlaybook(coachDeps, me.id, {
          id,
          messages: text2 !== null ? windowTurns(stored, text2) : body2?.messages,
          ...body2?.playbook !== void 0 ? { playbook: body2.playbook } : {},
          depth: body2?.depth === "deep" ? "deep" : "quick",
          onProgress: (p) => {
            res.write(`${JSON.stringify({ progress: p.kind, ...p })}
`);
          }
        });
        if (outcome.ok) {
          spendQuota(quotaDeps, me.id, "agent");
          if (text2 !== null) {
            botStore.setChat(
              id,
              appendExchange(
                stored,
                text2,
                outcome.raw,
                outcome.refused.map((r) => r.error)
              ),
              Date.now()
            );
          }
        }
        res.end(`${JSON.stringify(outcome)}
`);
        return;
      }
      if (url === "/api/forge/drafts") {
        const out = listDrafts(forgeDeps, me.id);
        sendJson(
          res,
          200,
          out.ok ? {
            ...out,
            drafts: out.drafts.map((d) => {
              const assets = forgeStore.forgedAssets(d.id);
              const pointers = modelPointers(assets);
              const a = assets;
              return {
                ...d,
                // A sealed champion from before a rule tightening may no
                // longer validate: the rail says so, the owner reforges.
                valid: validateForged(d.def).ok,
                splash: splashOf(forgeStore, d),
                model: pointers.model,
                // Whether the model carries a skeleton: every build
                // leaves one, a model built before the build rigged
                // does not, and its first bake will pay for the rig.
                rigged: typeof a?.rigged === "string",
                sheet: a?.sheet ?? null,
                family: a?.family ?? null,
                weapon: a?.weapon ?? null,
                clips: pointers.clips,
                clipFiles: pointers.clipFiles,
                display: assets ? displayOf(forgeStore, d.id) : null,
                // The chosen spell icons, for the HUD of a test drive.
                icons: iconsOf(forgeStore, d.id),
                // The editor's conversations, so a reload finds them.
                chats: chatsOf(forgeStore, d.id)
              };
            })
          } : out
        );
        return;
      }
      if (url === "/api/forge/draft" && req.method === "POST") {
        const body2 = await readJsonBody(req, DRAFT_JSON_MAX + 1024);
        if (!body2 || typeof body2.def !== "object" || body2.def === null) {
          sendJson(res, 400, { ok: false, error: "malformed request" });
          return;
        }
        sendJson(res, 200, saveDraft(forgeDeps, me.id, me.name, body2.def));
        return;
      }
      if (url === "/api/forge/chat" && req.method === "POST") {
        const body2 = await readJsonBody(req, CHAT_JSON_MAX);
        const id = typeof body2?.id === "string" ? body2.id : null;
        if (!id) {
          sendJson(res, 400, { ok: false, error: "malformed request" });
          return;
        }
        sendJson(
          res,
          200,
          saveChat({ store: forgeStore }, me.id, {
            id,
            kind: body2?.kind,
            turns: body2?.turns,
            proposal: body2?.proposal
          })
        );
        return;
      }
      if (url === "/api/forge/draft/delete" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        const outcome = id ? deleteDraft(forgeDeps, me.id, id) : { ok: false, error: "malformed request" };
        if (outcome.ok && id) deleteArtFor(artDeps, id);
        sendJson(res, 200, outcome);
        return;
      }
      if (url === "/api/forge/build" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        if (!id) {
          sendJson(res, 400, { ok: false, error: "malformed request" });
          return;
        }
        const quota = checkQuota(quotaDeps, "generation");
        if (!quota.ok) {
          sendJson(res, 200, quota);
          return;
        }
        const outcome = buildModel(forgeDeps, me.id, id, body2?.force === true);
        if (outcome.ok) spendQuota(quotaDeps, me.id, "generation");
        sendJson(res, 200, outcome.ok ? { ok: true, jobId: outcome.jobId } : outcome);
        return;
      }
      if (url === "/api/forge/animate" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        if (!id) {
          sendJson(res, 400, { ok: false, error: "malformed request" });
          return;
        }
        const quota = checkQuota(quotaDeps, "animate");
        if (!quota.ok) {
          sendJson(res, 200, quota);
          return;
        }
        const family = typeof body2?.family === "string" ? body2.family : void 0;
        const outcome = animateChampion(forgeDeps, me.id, id, family, body2?.clips);
        if (outcome.ok) spendQuota(quotaDeps, me.id, "animate");
        sendJson(res, 200, outcome.ok ? { ok: true, jobId: outcome.jobId } : outcome);
        return;
      }
      if (url === "/api/forge/animations") {
        const provider = forgeDeps.generation?.provider;
        sendJson(
          res,
          200,
          provider ? {
            ok: true,
            // The provider's presets plus the house library, the
            // same merged catalog the bake validates against.
            roles: catalogRoles(provider),
            defaults: Object.fromEntries(
              WEAPON_FAMILIES.map((f) => [f, provider.clipDefaults(f)])
            )
          } : { ok: false, error: "generation is not configured on this server yet" }
        );
        return;
      }
      if (url === "/api/forge/weapon" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        if (!id) {
          sendJson(res, 400, { ok: false, error: "malformed request" });
          return;
        }
        const quota = checkQuota(quotaDeps, "generation");
        if (!quota.ok) {
          sendJson(res, 200, quota);
          return;
        }
        const outcome = forgeWeapon(forgeDeps, me.id, id);
        if (outcome.ok) spendQuota(quotaDeps, me.id, "generation");
        sendJson(res, 200, outcome.ok ? { ok: true, jobId: outcome.jobId } : outcome);
        return;
      }
      if (url === "/api/forge/job") {
        const q = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
        const jobId = Number(q.get("id"));
        sendJson(
          res,
          200,
          Number.isInteger(jobId) ? finalizeStatus(forgeDeps, me.id, jobId) : { ok: false, error: "malformed request" }
        );
        return;
      }
      if (url === "/api/forge/art") {
        const q = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
        const id = q.get("id");
        sendJson(
          res,
          200,
          id ? listArt(artDeps, me.id, id) : { ok: false, error: "malformed request" }
        );
        return;
      }
      if (url === "/api/forge/art/generate" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        const kind = typeof body2?.kind === "string" ? body2.kind : "";
        const line = typeof body2?.line === "string" ? body2.line : "";
        const fromCid = Number.isInteger(body2?.fromCid) ? body2?.fromCid : void 0;
        if (!id) {
          sendJson(res, 400, { ok: false, error: "malformed request" });
          return;
        }
        sendJson(
          res,
          200,
          await generateArt(artDeps, me.id, {
            id,
            kind,
            line,
            ...fromCid !== void 0 ? { fromCid } : {}
          })
        );
        return;
      }
      if (url === "/api/forge/art/pick" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        const cid = Number(body2?.cid);
        sendJson(
          res,
          200,
          id && Number.isInteger(cid) ? chooseArt(artDeps, me.id, { id, cid }) : { ok: false, error: "malformed request" }
        );
        return;
      }
      if (url === "/api/forge/display" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        sendJson(
          res,
          200,
          id ? setForgedDisplay({ store: forgeStore }, me.id, id, body2?.display) : { ok: false, error: "malformed request" }
        );
        return;
      }
      if ((url === "/api/forge/seal" || url === "/api/forge/unseal") && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        const act = url === "/api/forge/seal" ? sealChampion : unsealChampion;
        sendJson(
          res,
          200,
          id ? act({ store: forgeStore }, me.id, id) : { ok: false, error: "malformed request" }
        );
        return;
      }
      if ((url === "/api/forge/brief" || url === "/api/forge/suggest" || url === "/api/forge/suggest-stats" || url === "/api/forge/suggest-look") && req.method === "POST") {
        const body2 = await readJsonBody(req, DRAFT_JSON_MAX + 16e4);
        const id = typeof body2?.id === "string" ? body2.id : null;
        if (!id || !Array.isArray(body2?.messages)) {
          sendJson(res, 400, { ok: false, error: "malformed request" });
          return;
        }
        const quota = checkQuota(quotaDeps, "agent");
        if (!quota.ok) {
          sendJson(res, 200, quota);
          return;
        }
        res.writeHead(200, {
          "content-type": "application/x-ndjson",
          "cache-control": "no-store",
          "x-accel-buffering": "no"
        });
        const ask = url === "/api/forge/brief" ? briefChampion : url === "/api/forge/suggest" ? suggestKit : url === "/api/forge/suggest-stats" ? suggestStats : suggestLook;
        const outcome = await ask(suggestDeps, me.id, {
          id,
          messages: body2.messages,
          ...body2.def !== void 0 ? { def: body2.def } : {},
          onProgress: (p) => {
            res.write(`${JSON.stringify({ progress: p.kind, text: p.text })}
`);
          }
        });
        if (outcome.ok) spendQuota(quotaDeps, me.id, "agent");
        res.end(`${JSON.stringify(outcome)}
`);
        return;
      }
      if (url === "/api/forge/reach" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        sendJson(
          res,
          200,
          id ? setForgedAttackRange({ store: forgeStore }, me.id, id, body2?.attackRange) : { ok: false, error: "malformed request" }
        );
        return;
      }
      const assetUrl = /^\/api\/forge\/asset\/(.+)$/.exec(url);
      if (assetUrl) {
        const rel = decodeURIComponent(assetUrl[1] ?? "");
        const filePath2 = import_node_path11.default.join(ASSETS_DIR, rel);
        if (!filePath2.startsWith(ASSETS_DIR + import_node_path11.default.sep) || rel.includes("..")) {
          sendJson(res, 403, { error: "no" });
          return;
        }
        try {
          const body2 = await (0, import_promises.readFile)(filePath2);
          res.writeHead(200, {
            "content-type": MIME[import_node_path11.default.extname(filePath2)] ?? "application/octet-stream",
            // Candidate files are content-stable (one file per generation);
            // the finalize outputs only change on a future Reforge.
            "cache-control": "private, max-age=3600"
          });
          res.end(body2);
        } catch {
          sendJson(res, 404, { error: "no such asset" });
        }
        return;
      }
      if (url === "/api/gallery") {
        const q = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
        sendJson(
          res,
          200,
          listGallery(galleryDeps, me.id, {
            sort: q.get("sort") === "popular" ? "popular" : "recent",
            q: q.get("q") ?? "",
            playable: q.get("playable") === "1"
          })
        );
        return;
      }
      if (url === "/api/gallery/like" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        sendJson(
          res,
          200,
          id ? toggleLike(galleryDeps, me.id, id, body2?.on === true) : { ok: false, error: "malformed request" }
        );
        return;
      }
      if (url === "/api/gallery/report" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        const reason = typeof body2?.reason === "string" ? body2.reason : "";
        sendJson(
          res,
          200,
          id ? reportForged(galleryDeps, me.id, id, reason) : { ok: false, error: "malformed request" }
        );
        return;
      }
      if (url === "/api/gallery/visibility" && req.method === "POST") {
        const body2 = await readJsonBody(req);
        const id = typeof body2?.id === "string" ? body2.id : null;
        sendJson(
          res,
          200,
          id ? setVisibility(galleryDeps, me.id, id, {
            ...typeof body2?.listed === "boolean" ? { listed: body2.listed } : {},
            ...typeof body2?.shared === "boolean" ? { shared: body2.shared } : {}
          }) : { ok: false, error: "malformed request" }
        );
        return;
      }
      if (url === "/api/email") {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "use POST" });
          return;
        }
        const body2 = await readJsonBody(req);
        const email = typeof body2?.email === "string" ? body2.email.trim() : "";
        const result = registry.setEmail(me.id, email, Date.now());
        if (!result.ok) {
          sendJson(res, 409, {
            error: result.error === "email_taken" ? "An account already uses that email address." : emailErrorMessage("shape")
          });
          return;
        }
        sendJson(res, 200, selfAccount(result.value));
        void sendConfirmation(result.value);
        return;
      }
      if (url === "/api/email/resend") {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "use POST" });
          return;
        }
        const now = Date.now();
        const key = addressKey(clientAddress(req.headers, req.socket.remoteAddress, EDGE));
        const wait = resets.retryAfterMs(key, now);
        if (wait > 0) {
          res.setHeader("retry-after", String(Math.ceil(wait / 1e3)));
          sendJson(res, 429, {
            error: `Too many requests. Try again in ${Math.ceil(wait / 1e3)}s.`
          });
          return;
        }
        resets.recordFailure(key, now);
        sendJson(res, 200, { ok: true });
        void sendConfirmation(me);
        return;
      }
      if (url === "/api/ladder/page") {
        const way = wayParam(req.url);
        if (way === null) {
          sendJson(res, 400, { error: "unknown way" });
          return;
        }
        const page = buildLadderPage(way, ladderSeeds(way), wayStatsFor(way), me.id, {
          // No bot chips on a bot way any more: the row is the bot (ADR 0016).
          ...way === "forge" ? {
            forged: (championId) => {
              const row = forgeStore.getForged(championId);
              return row ? { name: row.def.name, splash: splashOf(forgeStore, row) } : null;
            }
          } : {}
        });
        sendJson(res, 200, page);
        return;
      }
      if (url === "/api/ladder/mine") {
        const out = {};
        for (const way of WAYS) out[way] = placeOf(ladderSeeds(way), me.id);
        sendJson(res, 200, out);
        return;
      }
      if (url === "/api/home") {
        sendJson(
          res,
          200,
          buildHomePage(
            {
              seeds: ladderSeeds,
              stats: wayStatsFor,
              forged: forgeStore.listFinalized(),
              career: buildProfile(matchLog, me.id),
              myBots: botStore.listByAccount(me.id)
            },
            me.id,
            { splash: (row) => splashOf(forgeStore, row) }
          )
        );
        return;
      }
      if (url === "/api/ladder") {
        const way = new URLSearchParams((req.url ?? "").split("?")[1] ?? "").get("way");
        if (way === "bot" || way === "arena") {
          sendJson(
            res,
            200,
            buildBotLadder(
              botStore.listBotRatings(way === "bot" ? "live" : "arena"),
              // The row is the bot; it needs a living bot and a living owner.
              (botId, aid) => registry.findById(aid) ? botStore.getBot(botId)?.name ?? null : null
            )
          );
          return;
        }
        sendJson(res, 200, buildLadder(registry.all()));
        return;
      }
      if (url === "/api/live") {
        const live = [...matches.entries()].filter(([, e]) => e.endedAt === null && e.abandonedAt === null).map(([id, e]) => ({
          id,
          durationS: Math.round(e.match.sim.time),
          spectators: e.match.spectators.size,
          players: [...e.match.players.values()].map((p) => ({ name: p.name, team: p.team }))
        }));
        sendJson(res, 200, live);
        return;
      }
      const replayUrl = /^\/api\/replay\/(\d{1,9})$/.exec(url);
      if (replayUrl) {
        try {
          const body2 = await (0, import_promises.readFile)(import_node_path11.default.join(REPLAYS_DIR, `${replayUrl[1]}.json`));
          res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
          res.end(body2);
        } catch {
          sendJson(res, 404, { error: "replay not found" });
        }
        return;
      }
      const accountUrl = /^\/api\/account\/(\d{1,9})$/.exec(url);
      if (accountUrl) {
        const a = registry.findById(Number(accountUrl[1]));
        if (!a) {
          sendJson(res, 404, { error: "unknown account" });
          return;
        }
        sendJson(res, 200, describeAccount(a));
        return;
      }
      sendJson(res, 404, { error: "unknown endpoint" });
      return;
    }
    if (url === "/healthz") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          ok: true,
          clients: clients.size,
          matches: matches.size,
          uptimeS: Math.round(process.uptime()),
          // How the world loop kept up over its last window (server/tick_meter.ts).
          tick: meter.last()
        })
      );
      return;
    }
    let filePath = import_node_path11.default.join(DIST, url === "/" ? "index.html" : url);
    if (filePath !== DIST && !filePath.startsWith(DIST + import_node_path11.default.sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const s = await (0, import_promises.stat)(filePath);
      if (s.isDirectory()) filePath = import_node_path11.default.join(filePath, "index.html");
    } catch {
      filePath = import_node_path11.default.join(DIST, "index.html");
    }
    const isEntry = filePath === import_node_path11.default.join(DIST, "index.html");
    let visitId = null;
    if (isEntry && STATS_ON) {
      const visit = nextVisit(
        parseCookies(req.headers.cookie).get(VISIT_COOKIE),
        visitChoice(`?${(req.url ?? "").split("?")[1] ?? ""}`),
        () => (0, import_node_crypto9.randomBytes)(16).toString("hex")
      );
      visitId = visitIdOf(visit);
      if (visit.kind === "set") {
        addCookie(
          res,
          serializeCookie(VISIT_COOKIE, visit.value, {
            maxAgeS: VISIT_MAX_AGE_S,
            secure: cookieSecure(req)
          })
        );
      }
    }
    const body = isEntry ? withVisitTag(
      withStatsTag(
        withBuildTag(await (0, import_promises.readFile)(filePath, "utf8"), BUILD_ID),
        STATS_ON ? STATS_WEBSITE_ID : ""
      ),
      visitId
    ) : await (0, import_promises.readFile)(filePath);
    const immutable = url.startsWith("/assets/");
    res.writeHead(200, {
      "content-type": MIME[import_node_path11.default.extname(filePath)] ?? "application/octet-stream",
      "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache"
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  }
});
var wss = new import_websocket_server.default({
  server,
  path: "/ws",
  maxPayload: 16 * 1024,
  // A seat is handed out on the upgrade, so both gates live here: a page
  // we never served does not get one (a client with no Origin header, a
  // headless bot, does), and neither does a visitor with no live session.
  // Refusing here rather than after the socket opens means nothing below
  // has to carry an "unauthenticated client" state.
  verifyClient: ({ req }, done) => {
    if (!originAllowed(req.headers, EDGE)) {
      console.warn(`refused upgrade from origin ${String(req.headers.origin)}`);
      done(false, 403, "forbidden origin");
      return;
    }
    const cookies = parseCookies(req.headers.cookie);
    const cookieId = cookies.get(COOKIE_NAME);
    const session = cookieId ? sessions.resolve(cookieId, Date.now()) : void 0;
    const guestToken = cookies.get(GUEST_COOKIE);
    const guest = guestToken ? guests.resolve(guestToken, Date.now()) : void 0;
    if ((!session || !registry.findById(session.accountId)) && !guest) {
      done(false, 401, "this needs an account");
      return;
    }
    done(true);
  }
});
var connections = new ConnectionLimiter();
wss.on("connection", (ws, req) => {
  const ip = clientAddress(req.headers, req.socket.remoteAddress, EDGE);
  if (!connections.acquire(ip)) {
    ws.close(1013, "too many connections");
    return;
  }
  const now = Date.now();
  const cookies = parseCookies(req.headers.cookie);
  const cookieId = cookies.get(COOKIE_NAME) ?? "";
  const session = sessions.resolve(cookieId, now);
  const account = session ? registry.findById(session.accountId) : void 0;
  const guest = account ? void 0 : guests.resolve(cookies.get(GUEST_COOKIE) ?? "", now);
  const who = account ? { accountId: account.id, name: account.name, sessionId: session?.id ?? "", guest: false } : guest ? { accountId: guest.id, name: guest.name, sessionId: "", guest: true } : null;
  if (!who) {
    connections.release(ip);
    ws.close(4401, "this needs an account");
    return;
  }
  if (account) {
    sessions.touch(cookieId, now);
    registry.touch(account.id, now);
  }
  for (const other of clients.values()) {
    if (other.accountId === who.accountId) {
      other.ws.close(4409, "this account connected somewhere else");
    }
  }
  const id = nextClientId++;
  const client = {
    id,
    ws,
    accountId: who.accountId,
    name: who.name,
    guest: who.guest,
    sessionId: who.sessionId,
    matchId: null,
    msgWindowStart: now,
    msgCount: 0
  };
  clients.set(id, client);
  send(id, { t: "welcome", clientId: id, name: who.name });
  ws.on("message", (data) => {
    const raw = data.toString();
    if (raw.length > MAX_MSG_BYTES) return;
    const now2 = Date.now();
    if (now2 - client.msgWindowStart > 1e3) {
      client.msgWindowStart = now2;
      client.msgCount = 0;
    }
    if (++client.msgCount > MAX_MSGS_PER_SEC) return;
    const msg = parseClientMsg(raw);
    if (!msg) return;
    if (msg.t === "hello") {
      const seat = rejoins.claim(client.accountId);
      if (seat) {
        const entry = matches.get(seat.matchId);
        if (entry) {
          entry.match.restorePlayer(id, seat);
          entry.abandonedAt = null;
          client.matchId = seat.matchId;
          send(id, {
            t: "match_start",
            selfUnitId: seat.unitId,
            team: seat.team,
            ...seat.coach ? { coach: true } : {},
            ...forgedPayload(entry.match)
          });
          for (const cid of entry.match.players.keys()) {
            if (cid !== id) send(cid, { t: "player_back", name: seat.name, team: seat.team });
          }
          console.log(`match ${seat.matchId}: ${seat.name} reconnected`);
        }
      }
      return;
    }
    const inMatch = client.matchId !== null;
    const atCapacity = matches.size >= MAX_MATCHES;
    const refuseCapacity = () => send(id, { t: "error", message: "The server is at capacity, try again in a bit." });
    if (client.guest && guestRefused(msg)) {
      send(id, { t: "error", message: "This needs an account." });
      return;
    }
    switch (msg.t) {
      case "queue": {
        if (inMatch) break;
        const locked = rejoins.queueLockRemaining(client.accountId, now2);
        if (locked > 0) {
          send(id, {
            t: "error",
            message: `You left a rated match. The queue unlocks in ${Math.ceil(locked / 1e3)}s.`
          });
          break;
        }
        if (msg.forge !== true && matchmaker.queuedCount === 0 && dropInto(client)) break;
        if (atCapacity) refuseCapacity();
        else {
          const mm = msg.forge === true ? forgeMatchmaker : matchmaker;
          for (const other of matchmakers) if (other !== mm) other.removeEverywhere(id, now2);
          mm.addToQueue(id, client.name, now2);
        }
        break;
      }
      case "start_now":
        if (!inMatch) for (const mm of matchmakers) mm.startNow(id, now2);
        break;
      case "leave": {
        for (const mm of matchmakers) mm.removeEverywhere(id);
        const leftMatchId = client.matchId;
        if (leftMatchId !== null) {
          const entry = matches.get(leftMatchId);
          if (entry && !entry.match.players.has(id)) {
            client.matchId = null;
            entry.match.removeSpectator(id);
          } else if (entry) {
            walkOutOfMatch(client, entry, leftMatchId);
          } else {
            client.matchId = null;
            rejoins.drop(client.accountId);
          }
        }
        break;
      }
      case "create_lobby":
        if (inMatch) break;
        if (atCapacity) refuseCapacity();
        else {
          forgeMatchmaker.removeEverywhere(id, now2);
          matchmaker.createLobby(id, client.name, now2);
        }
        break;
      case "join_lobby":
        if (!inMatch) {
          forgeMatchmaker.removeEverywhere(id, now2);
          matchmaker.joinLobby(id, client.name, String(msg.code ?? ""));
        }
        break;
      case "lobby_team":
        if (!inMatch) matchmaker.setLobbyTeam(id, msg.team);
        break;
      case "queue_party":
        if (inMatch) break;
        if (atCapacity) refuseCapacity();
        else if (rejoins.queueLockRemaining(client.accountId, now2) > 0) {
          const locked = rejoins.queueLockRemaining(client.accountId, now2);
          send(id, {
            t: "error",
            message: `You left a rated match. The queue unlocks in ${Math.ceil(locked / 1e3)}s.`
          });
        } else matchmaker.queuePartyFromLobby(id, now2);
        break;
      case "spectate": {
        if (inMatch) break;
        const target = typeof msg.matchId === "number" ? matches.get(msg.matchId) : void 0;
        if (!target || target.endedAt !== null || target.abandonedAt !== null) {
          send(id, { t: "error", message: "That match is over or gone." });
          break;
        }
        if (!target.match.addSpectator(id, msg.team === 1 ? 1 : 0)) {
          send(id, { t: "error", message: "That match has no spectator slots left." });
          break;
        }
        client.matchId = msg.matchId;
        send(id, {
          t: "match_start",
          selfUnitId: 0,
          team: msg.team === 1 ? 1 : 0,
          ...forgedPayload(target.match)
        });
        break;
      }
      case "start_lobby":
        if (!inMatch) matchmaker.startLobby(id, now2);
        break;
      case "pick":
        for (const mm of matchmakers) mm.pick(id, msg.championId, msg.sigils, msg.skin, msg.bot);
        break;
      case "chat":
      case "ping": {
        if (client.matchId === null) break;
        const entry = matches.get(client.matchId);
        const player = entry?.match.players.get(id);
        if (!entry || !player) break;
        if (msg.t === "chat") {
          const text2 = String(msg.text ?? "").trim().slice(0, 200);
          if (!text2) break;
          for (const cid of entry.match.teamRecipients(id)) {
            send(cid, { t: "chat", from: player.name, team: player.team, text: text2 });
          }
        } else if (isFiniteVec(msg.x, msg.z)) {
          for (const cid of entry.match.teamRecipients(id)) {
            send(cid, {
              t: "ping",
              from: player.name,
              team: player.team,
              x: msg.x,
              z: msg.z
            });
          }
        }
        break;
      }
      default: {
        if (client.matchId === null) return;
        const entry = matches.get(client.matchId);
        if (entry) entry.match.handleCommand(id, msg);
      }
    }
  });
  ws.on("close", () => {
    connections.release(ip);
    for (const mm of matchmakers) mm.removeEverywhere(id);
    const matchId = client.matchId;
    clients.delete(id);
    if (matchId !== null) {
      const entry = matches.get(matchId);
      if (entry) {
        entry.match.removeSpectator(id);
        const left = entry.match.handleDisconnect(id);
        if (left) {
          rejoins.reserve(client.accountId, { matchId, ...left });
          for (const cid of entry.match.players.keys()) {
            send(cid, { t: "player_left", name: left.name, team: left.team });
          }
        }
        const anyConnected = [...entry.match.players.keys()].some((cid) => clients.has(cid));
        if (!anyConnected && entry.abandonedAt === null) {
          entry.abandonedAt = Date.now();
          console.log(`match ${matchId} abandoned: holding for rejoin grace`);
        }
      }
    }
  });
});
var meter = new TickMeter(Date.now());
var last = Date.now();
var acc = 0;
setInterval(() => {
  const now = Date.now();
  acc += Math.min(now - last, 500);
  last = now;
  for (const mm of matchmakers) mm.tickClock(now);
  let ran = 0;
  for (const [matchId, entry] of matches) {
    if (entry.abandonedAt !== null && now - entry.abandonedAt > REJOIN_GRACE_MS) {
      matches.delete(matchId);
      rejoins.pruneMatch(matchId);
      console.log(`match ${matchId} reaped: rejoin grace expired`);
    }
  }
  while (acc >= TICK_MS) {
    acc -= TICK_MS;
    const tickStart = import_node_perf_hooks.performance.now();
    for (const [matchId, entry] of matches) {
      try {
        entry.match.tick();
        if (entry.botSeats.size > 0) {
          entry.ledger.observe(entry.match.sim.tickCount, entry.match.lastEvents, entry.match.sim);
        }
        const score = entry.match.sim.tickCount % 40 === 0 ? entry.match.buildScore() : null;
        for (const player of entry.match.players.values()) {
          const snap2 = entry.match.buildSnapshotFor(player.clientId);
          if (snap2) send(player.clientId, snap2);
          if (score) send(player.clientId, score);
        }
        for (const cid of entry.match.spectators.keys()) {
          const snap2 = entry.match.buildSpectatorSnapshotFor(cid);
          if (snap2) send(cid, snap2);
          if (score) send(cid, score);
        }
        if (entry.match.sim.tickCount % 200 === 0 && entry.match.sim.winner === null && entry.match.players.size >= 2) {
          for (const cid of entry.match.idleClientIds(AFK_IDLE_TICKS)) {
            const c = clients.get(cid);
            if (!c) continue;
            send(cid, {
              t: "error",
              message: "Removed for inactivity: a bot takes your champion over."
            });
            walkOutOfMatch(c, entry, matchId);
            console.log(`match ${matchId}: ${c.name} removed for inactivity`);
          }
        }
        if (entry.match.sim.winner !== null && entry.endedAt === null) {
          entry.endedAt = now;
          const accountIdByUnit = /* @__PURE__ */ new Map();
          for (const p of entry.match.players.values()) {
            const c = clients.get(p.clientId);
            if (c && !c.guest && !entry.dropIns.has(c.accountId)) {
              accountIdByUnit.set(p.unitId, c.accountId);
            }
          }
          const owned2 = [];
          for (const p of entry.match.players.values()) {
            if (p.coach) continue;
            const pid = accountIdByUnit.get(p.unitId);
            if (pid !== void 0 && registry.findById(pid)) {
              owned2.push({ accountId: pid, team: p.team, way: "hand" });
            }
          }
          const ways = /* @__PURE__ */ new Map();
          for (const [unitId, seat] of entry.botSeats) {
            const u = entry.match.sim.units.get(unitId);
            if (!u || !registry.findById(seat.accountId)) continue;
            accountIdByUnit.set(unitId, seat.accountId);
            ways.set(unitId, "bot");
            owned2.push({ accountId: seat.accountId, team: u.team, way: "bot", botId: seat.botId });
          }
          const book = {
            read: (seat) => {
              if (seat.way === "bot") return botStore.botRating(seat.botId ?? "", "live").rating;
              if (entry.forge) return forgeStore.forgeRating(seat.accountId).rating;
              return registry.findById(seat.accountId)?.rating ?? BASE_RATING;
            },
            apply: (seat, delta) => {
              if (seat.way === "bot") {
                botStore.applyBotRating(seat.botId ?? "", seat.accountId, "live", delta);
              } else if (entry.forge) forgeStore.applyForgeRating(seat.accountId, delta);
              else registry.applyRating(seat.accountId, delta);
            }
          };
          const outcome = rateMatch(owned2, entry.match.sim.winner, entry.ratedEligible, book);
          const rated = outcome.rated;
          const deltas = /* @__PURE__ */ new Map();
          for (const r of outcome.results) deltas.set(r.accountId, r.delta);
          for (const p of entry.match.players.values()) {
            const pid = accountIdByUnit.get(p.unitId);
            const result = outcome.results.find(
              (r) => r.accountId === pid && r.way === (p.coach ? "bot" : "hand")
            );
            if (pid === void 0 || !result) continue;
            send(p.clientId, {
              t: "match_result",
              rated,
              delta: result.delta,
              rating: result.rating,
              ...entry.forge ? { queue: "forge" } : {},
              ...p.coach ? { way: "bot" } : {}
            });
          }
          let replayId;
          if (entry.match.replayComplete) {
            try {
              saveJsonAtomic(import_node_path11.default.join(REPLAYS_DIR, `${matchId}.json`), {
                version: REPLAY_VERSION,
                // What the match ran on: a replay is a re-simulation, so
                // a record whose content has moved plays a different
                // match and the viewer must refuse it.
                content: contentFingerprint(starOrchard()),
                seed: entry.match.seed,
                picks: entry.match.replayPicks,
                events: entry.match.replayEvents,
                ticks: entry.match.sim.tickCount,
                // A forged id means nothing outside its match: the replay
                // carries the definitions themselves (ADR 0010).
                ...forgedPayload(entry.match)
              });
              replayId = matchId;
              pruneNumberedJson(REPLAYS_DIR, REPLAY_KEEP, botStore.heldReplayIds());
            } catch (err) {
              console.error("replay save failed", err);
            }
          }
          const score2 = entry.match.buildScore();
          if (score2.t === "score") {
            const rec = buildMatchRecord(
              score2.rows,
              accountIdByUnit,
              entry.match.sim.winner,
              entry.match.sim.time,
              now,
              { rated, deltas, ways, ...entry.forge ? { queue: "forge" } : {} },
              replayId
            );
            matchLog.push(rec);
            try {
              appendJsonl(MATCHES_FILE, rec);
            } catch (err) {
              console.error("match log append failed", err);
            }
            payLaurels(rec);
            console.log(`match ${matchId} recorded (${accountIdByUnit.size} human seat(s))`);
            const report3 = entry.ledger.report();
            for (const [unitId, seat] of entry.botSeats) {
              if (seat.botId === void 0) continue;
              const u = entry.match.sim.units.get(unitId);
              if (!u) continue;
              const delta = deltas.get(seat.accountId);
              try {
                addEntry(botStore, seat.botId, seat.accountId, {
                  kind: "live",
                  at: now,
                  seed: entry.match.seed,
                  team: u.team,
                  winner: entry.match.sim.winner,
                  ticks: entry.match.sim.tickCount,
                  version: seat.version ?? 1,
                  edited: false,
                  botUnitId: unitId,
                  score: score2.rows,
                  report: report3,
                  replayId: replayId ?? null,
                  ...rated && delta !== void 0 ? { ratingDelta: delta } : {}
                });
              } catch (err) {
                console.error("record entry failed", err);
              }
            }
          }
        }
        if (entry.endedAt !== null && now - entry.endedAt > MATCH_LINGER_MS) {
          for (const player of entry.match.players.values()) {
            const c = clients.get(player.clientId);
            if (c) c.matchId = null;
            send(player.clientId, { t: "match_end" });
          }
          for (const cid of entry.match.spectators.keys()) {
            const c = clients.get(cid);
            if (c) c.matchId = null;
            send(cid, { t: "match_end" });
          }
          matches.delete(matchId);
          rejoins.pruneMatch(matchId);
          console.log(`match ${matchId} closed`);
        }
        entry.failures = 0;
      } catch (err) {
        console.error(`match ${matchId} tick failed`, err);
        entry.failures += 1;
        if (entry.failures > 200) {
          for (const player of entry.match.players.values()) {
            const c = clients.get(player.clientId);
            if (c) c.matchId = null;
            send(player.clientId, { t: "match_end" });
          }
          for (const cid of entry.match.spectators.keys()) {
            const c = clients.get(cid);
            if (c) c.matchId = null;
            send(cid, { t: "match_end" });
          }
          matches.delete(matchId);
          rejoins.pruneMatch(matchId);
          console.error(`match ${matchId} force-closed after repeated tick failures`);
        }
      }
    }
    if (matches.size > 0) meter.tick(import_node_perf_hooks.performance.now() - tickStart, ran > 0);
    ran++;
  }
  const report2 = meter.report(
    now,
    [...matches.values()].filter((e) => e.endedAt === null).length,
    clients.size
  );
  if (report2 && report2.ticks > 0) console.log(formatTickReport(report2));
}, 25);
process.on("uncaughtException", (err) => {
  console.error("uncaught exception (server kept alive)", err);
});
process.on("unhandledRejection", (err) => {
  console.error("unhandled rejection (server kept alive)", err);
});
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`${sig}: shutting down`);
    sessions.flush();
    for (const c of clients.values()) c.ws.close();
    wss.close();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2e3).unref();
  });
}
setInterval(() => {
  const now = Date.now();
  const sessionsDropped = sessions.purgeExpired(now);
  const tokensDropped = tokens.purgeExpired(now);
  const claimsReleased = registry.purgeExpiredClaims(now);
  discordFlows.purge(now);
  apiLimiter.purge(now);
  forgeStore.pruneQuotaEvents(now - DAY_MS3);
  botStore.pruneArenaEvents(now - DAY_MS3);
  botStore.pruneBotReports(now - 7 * DAY_MS3);
  if (sessionsDropped + tokensDropped + claimsReleased > 0) {
    console.log(
      `housekeeping: ${sessionsDropped} session(s), ${tokensDropped} link(s), ${claimsReleased} email claim(s) released after ${Math.round(CLAIM_TTL_MS / 864e5)} days`
    );
  }
}, 60 * 6e4).unref();
var arenaRoundRunning = false;
setInterval(() => {
  if (!arenaRoundRunning && nightDue(botStore.arenaLastNightAt(), Date.now())) {
    arenaRoundRunning = true;
    botStore.setArenaLastNightAt(Date.now());
    void runNight(nightCoachDeps).catch((err) => console.error("night coach failed", err)).finally(() => {
      arenaRoundRunning = false;
    });
    return;
  }
  if (arenaRoundRunning || !roundDue(arenaDeps)) return;
  arenaRoundRunning = true;
  void runArenaRound(arenaDeps).catch((err) => console.error("arena round failed", err)).finally(() => {
    arenaRoundRunning = false;
  });
}, 6e4).unref();
server.listen(PORT, HOST, () => {
  console.log(`claude-of-legends server on ${HOST ?? "0.0.0.0"}:${PORT} (serving ${DIST})`);
  console.log(`mail: ${mailer.description}, links point at ${ORIGIN}`);
  console.log(
    `arena: ${arenaRunner.hasWorker ? "worker thread" : "inline (no worker bundle found)"}`
  );
  console.log(
    DISCORD ? `discord: sign-in on, redirect ${DISCORD.redirectUri}${DISCORD.guild ? `, auto-join into guild ${DISCORD.guild.id}` : ", no auto-join (no DISCORD_BOT_TOKEN and DISCORD_GUILD_ID set)"}` : "discord: off (no DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET set)"
  );
  console.log(
    `edge: ${EDGE.hops} trusted proxy hop(s), origins ${EDGE.origins.length > 0 ? EDGE.origins.join(" ") : "same-host only"}`
  );
  console.log(
    STATS_ON ? `stats: on, ${STATS_SCRIPT} tagged for site ${STATS_WEBSITE_ID}` : STATS_WEBSITE_ID === "" ? "stats: off (no STATS_WEBSITE_ID set)" : "stats: off (STATS_WEBSITE_ID is not a site id)"
  );
  void (0, import_promises.stat)(import_node_path11.default.join(DIST, "index.html")).catch(() => {
    console.warn('dist/index.html not found: the client is not built (run "pnpm build")');
  });
});
//# sourceMappingURL=server.cjs.map

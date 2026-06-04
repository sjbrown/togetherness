var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
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

// node_modules/simple-peer/simplepeer.min.js
var require_simplepeer_min = __commonJS({
  "node_modules/simple-peer/simplepeer.min.js"(exports, module) {
    (function(e) {
      if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
      else if ("function" == typeof define && define.amd) define([], e);
      else {
        var t;
        t = "undefined" == typeof window ? "undefined" == typeof global ? "undefined" == typeof self ? this : self : global : window, t.SimplePeer = e();
      }
    })(function() {
      var t = Math.floor, n = Math.abs, r = Math.pow;
      return (/* @__PURE__ */ (function() {
        function d(s, e, n2) {
          function t2(o, i) {
            if (!e[o]) {
              if (!s[o]) {
                var l = "function" == typeof __require && __require;
                if (!i && l) return l(o, true);
                if (r2) return r2(o, true);
                var c = new Error("Cannot find module '" + o + "'");
                throw c.code = "MODULE_NOT_FOUND", c;
              }
              var a2 = e[o] = { exports: {} };
              s[o][0].call(a2.exports, function(e2) {
                var r3 = s[o][1][e2];
                return t2(r3 || e2);
              }, a2, a2.exports, d, s, e, n2);
            }
            return e[o].exports;
          }
          for (var r2 = "function" == typeof __require && __require, a = 0; a < n2.length; a++) t2(n2[a]);
          return t2;
        }
        return d;
      })())({ 1: [function(e, t2, n2) {
        "use strict";
        function r2(e2) {
          var t3 = e2.length;
          if (0 < t3 % 4) throw new Error("Invalid string. Length must be a multiple of 4");
          var n3 = e2.indexOf("=");
          -1 === n3 && (n3 = t3);
          var r3 = n3 === t3 ? 0 : 4 - n3 % 4;
          return [n3, r3];
        }
        function a(e2, t3, n3) {
          return 3 * (t3 + n3) / 4 - n3;
        }
        function o(e2) {
          var t3, n3, o2 = r2(e2), d2 = o2[0], s2 = o2[1], l2 = new p(a(e2, d2, s2)), c2 = 0, f2 = 0 < s2 ? d2 - 4 : d2;
          for (n3 = 0; n3 < f2; n3 += 4) t3 = u[e2.charCodeAt(n3)] << 18 | u[e2.charCodeAt(n3 + 1)] << 12 | u[e2.charCodeAt(n3 + 2)] << 6 | u[e2.charCodeAt(n3 + 3)], l2[c2++] = 255 & t3 >> 16, l2[c2++] = 255 & t3 >> 8, l2[c2++] = 255 & t3;
          return 2 === s2 && (t3 = u[e2.charCodeAt(n3)] << 2 | u[e2.charCodeAt(n3 + 1)] >> 4, l2[c2++] = 255 & t3), 1 === s2 && (t3 = u[e2.charCodeAt(n3)] << 10 | u[e2.charCodeAt(n3 + 1)] << 4 | u[e2.charCodeAt(n3 + 2)] >> 2, l2[c2++] = 255 & t3 >> 8, l2[c2++] = 255 & t3), l2;
        }
        function d(e2) {
          return c[63 & e2 >> 18] + c[63 & e2 >> 12] + c[63 & e2 >> 6] + c[63 & e2];
        }
        function s(e2, t3, n3) {
          for (var r3, a2 = [], o2 = t3; o2 < n3; o2 += 3) r3 = (16711680 & e2[o2] << 16) + (65280 & e2[o2 + 1] << 8) + (255 & e2[o2 + 2]), a2.push(d(r3));
          return a2.join("");
        }
        function l(e2) {
          for (var t3, n3 = e2.length, r3 = n3 % 3, a2 = [], o2 = 16383, d2 = 0, l2 = n3 - r3; d2 < l2; d2 += o2) a2.push(s(e2, d2, d2 + o2 > l2 ? l2 : d2 + o2));
          return 1 === r3 ? (t3 = e2[n3 - 1], a2.push(c[t3 >> 2] + c[63 & t3 << 4] + "==")) : 2 === r3 && (t3 = (e2[n3 - 2] << 8) + e2[n3 - 1], a2.push(c[t3 >> 10] + c[63 & t3 >> 4] + c[63 & t3 << 2] + "=")), a2.join("");
        }
        n2.byteLength = function(e2) {
          var t3 = r2(e2), n3 = t3[0], a2 = t3[1];
          return 3 * (n3 + a2) / 4 - a2;
        }, n2.toByteArray = o, n2.fromByteArray = l;
        for (var c = [], u = [], p = "undefined" == typeof Uint8Array ? Array : Uint8Array, f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", g = 0, _ = f.length; g < _; ++g) c[g] = f[g], u[f.charCodeAt(g)] = g;
        u[45] = 62, u[95] = 63;
      }, {}], 2: [function() {
      }, {}], 3: [function(e, t2, n2) {
        (function() {
          (function() {
            "use strict";
            var t3 = String.fromCharCode, o = Math.min;
            function d(e2) {
              if (2147483647 < e2) throw new RangeError('The value "' + e2 + '" is invalid for option "size"');
              var t4 = new Uint8Array(e2);
              return t4.__proto__ = s.prototype, t4;
            }
            function s(e2, t4, n3) {
              if ("number" == typeof e2) {
                if ("string" == typeof t4) throw new TypeError('The "string" argument must be of type string. Received type number');
                return p(e2);
              }
              return l(e2, t4, n3);
            }
            function l(e2, t4, n3) {
              if ("string" == typeof e2) return f(e2, t4);
              if (ArrayBuffer.isView(e2)) return g(e2);
              if (null == e2) throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof e2);
              if (K(e2, ArrayBuffer) || e2 && K(e2.buffer, ArrayBuffer)) return _(e2, t4, n3);
              if ("number" == typeof e2) throw new TypeError('The "value" argument must not be of type number. Received type number');
              var r2 = e2.valueOf && e2.valueOf();
              if (null != r2 && r2 !== e2) return s.from(r2, t4, n3);
              var a = h(e2);
              if (a) return a;
              if ("undefined" != typeof Symbol && null != Symbol.toPrimitive && "function" == typeof e2[Symbol.toPrimitive]) return s.from(e2[Symbol.toPrimitive]("string"), t4, n3);
              throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof e2);
            }
            function c(e2) {
              if ("number" != typeof e2) throw new TypeError('"size" argument must be of type number');
              else if (0 > e2) throw new RangeError('The value "' + e2 + '" is invalid for option "size"');
            }
            function u(e2, t4, n3) {
              return c(e2), 0 >= e2 ? d(e2) : void 0 === t4 ? d(e2) : "string" == typeof n3 ? d(e2).fill(t4, n3) : d(e2).fill(t4);
            }
            function p(e2) {
              return c(e2), d(0 > e2 ? 0 : 0 | m(e2));
            }
            function f(e2, t4) {
              if (("string" != typeof t4 || "" === t4) && (t4 = "utf8"), !s.isEncoding(t4)) throw new TypeError("Unknown encoding: " + t4);
              var n3 = 0 | b(e2, t4), r2 = d(n3), a = r2.write(e2, t4);
              return a !== n3 && (r2 = r2.slice(0, a)), r2;
            }
            function g(e2) {
              for (var t4 = 0 > e2.length ? 0 : 0 | m(e2.length), n3 = d(t4), r2 = 0; r2 < t4; r2 += 1) n3[r2] = 255 & e2[r2];
              return n3;
            }
            function _(e2, t4, n3) {
              if (0 > t4 || e2.byteLength < t4) throw new RangeError('"offset" is outside of buffer bounds');
              if (e2.byteLength < t4 + (n3 || 0)) throw new RangeError('"length" is outside of buffer bounds');
              var r2;
              return r2 = void 0 === t4 && void 0 === n3 ? new Uint8Array(e2) : void 0 === n3 ? new Uint8Array(e2, t4) : new Uint8Array(e2, t4, n3), r2.__proto__ = s.prototype, r2;
            }
            function h(e2) {
              if (s.isBuffer(e2)) {
                var t4 = 0 | m(e2.length), n3 = d(t4);
                return 0 === n3.length ? n3 : (e2.copy(n3, 0, 0, t4), n3);
              }
              return void 0 === e2.length ? "Buffer" === e2.type && Array.isArray(e2.data) ? g(e2.data) : void 0 : "number" != typeof e2.length || X(e2.length) ? d(0) : g(e2);
            }
            function m(e2) {
              if (e2 >= 2147483647) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + 2147483647 .toString(16) + " bytes");
              return 0 | e2;
            }
            function b(e2, t4) {
              if (s.isBuffer(e2)) return e2.length;
              if (ArrayBuffer.isView(e2) || K(e2, ArrayBuffer)) return e2.byteLength;
              if ("string" != typeof e2) throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof e2);
              var n3 = e2.length, r2 = 2 < arguments.length && true === arguments[2];
              if (!r2 && 0 === n3) return 0;
              for (var a = false; ; ) switch (t4) {
                case "ascii":
                case "latin1":
                case "binary":
                  return n3;
                case "utf8":
                case "utf-8":
                  return H(e2).length;
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return 2 * n3;
                case "hex":
                  return n3 >>> 1;
                case "base64":
                  return z(e2).length;
                default:
                  if (a) return r2 ? -1 : H(e2).length;
                  t4 = ("" + t4).toLowerCase(), a = true;
              }
            }
            function y(e2, t4, n3) {
              var r2 = false;
              if ((void 0 === t4 || 0 > t4) && (t4 = 0), t4 > this.length) return "";
              if ((void 0 === n3 || n3 > this.length) && (n3 = this.length), 0 >= n3) return "";
              if (n3 >>>= 0, t4 >>>= 0, n3 <= t4) return "";
              for (e2 || (e2 = "utf8"); ; ) switch (e2) {
                case "hex":
                  return P(this, t4, n3);
                case "utf8":
                case "utf-8":
                  return x(this, t4, n3);
                case "ascii":
                  return D(this, t4, n3);
                case "latin1":
                case "binary":
                  return I(this, t4, n3);
                case "base64":
                  return A(this, t4, n3);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return M(this, t4, n3);
                default:
                  if (r2) throw new TypeError("Unknown encoding: " + e2);
                  e2 = (e2 + "").toLowerCase(), r2 = true;
              }
            }
            function C(e2, t4, n3) {
              var r2 = e2[t4];
              e2[t4] = e2[n3], e2[n3] = r2;
            }
            function R(e2, t4, n3, r2, a) {
              if (0 === e2.length) return -1;
              if ("string" == typeof n3 ? (r2 = n3, n3 = 0) : 2147483647 < n3 ? n3 = 2147483647 : -2147483648 > n3 && (n3 = -2147483648), n3 = +n3, X(n3) && (n3 = a ? 0 : e2.length - 1), 0 > n3 && (n3 = e2.length + n3), n3 >= e2.length) {
                if (a) return -1;
                n3 = e2.length - 1;
              } else if (0 > n3) if (a) n3 = 0;
              else return -1;
              if ("string" == typeof t4 && (t4 = s.from(t4, r2)), s.isBuffer(t4)) return 0 === t4.length ? -1 : E(e2, t4, n3, r2, a);
              if ("number" == typeof t4) return t4 &= 255, "function" == typeof Uint8Array.prototype.indexOf ? a ? Uint8Array.prototype.indexOf.call(e2, t4, n3) : Uint8Array.prototype.lastIndexOf.call(e2, t4, n3) : E(e2, [t4], n3, r2, a);
              throw new TypeError("val must be string, number or Buffer");
            }
            function E(e2, t4, n3, r2, a) {
              function o2(e3, t5) {
                return 1 === d2 ? e3[t5] : e3.readUInt16BE(t5 * d2);
              }
              var d2 = 1, s2 = e2.length, l2 = t4.length;
              if (void 0 !== r2 && (r2 = (r2 + "").toLowerCase(), "ucs2" === r2 || "ucs-2" === r2 || "utf16le" === r2 || "utf-16le" === r2)) {
                if (2 > e2.length || 2 > t4.length) return -1;
                d2 = 2, s2 /= 2, l2 /= 2, n3 /= 2;
              }
              var c2;
              if (a) {
                var u2 = -1;
                for (c2 = n3; c2 < s2; c2++) if (o2(e2, c2) !== o2(t4, -1 === u2 ? 0 : c2 - u2)) -1 !== u2 && (c2 -= c2 - u2), u2 = -1;
                else if (-1 === u2 && (u2 = c2), c2 - u2 + 1 === l2) return u2 * d2;
              } else for (n3 + l2 > s2 && (n3 = s2 - l2), c2 = n3; 0 <= c2; c2--) {
                for (var p2 = true, f2 = 0; f2 < l2; f2++) if (o2(e2, c2 + f2) !== o2(t4, f2)) {
                  p2 = false;
                  break;
                }
                if (p2) return c2;
              }
              return -1;
            }
            function w(e2, t4, n3, r2) {
              n3 = +n3 || 0;
              var a = e2.length - n3;
              r2 ? (r2 = +r2, r2 > a && (r2 = a)) : r2 = a;
              var o2 = t4.length;
              r2 > o2 / 2 && (r2 = o2 / 2);
              for (var d2, s2 = 0; s2 < r2; ++s2) {
                if (d2 = parseInt(t4.substr(2 * s2, 2), 16), X(d2)) return s2;
                e2[n3 + s2] = d2;
              }
              return s2;
            }
            function S(e2, t4, n3, r2) {
              return G(H(t4, e2.length - n3), e2, n3, r2);
            }
            function T(e2, t4, n3, r2) {
              return G(Y4(t4), e2, n3, r2);
            }
            function v(e2, t4, n3, r2) {
              return T(e2, t4, n3, r2);
            }
            function k(e2, t4, n3, r2) {
              return G(z(t4), e2, n3, r2);
            }
            function L(e2, t4, n3, r2) {
              return G(V(t4, e2.length - n3), e2, n3, r2);
            }
            function A(e2, t4, n3) {
              return 0 === t4 && n3 === e2.length ? $2.fromByteArray(e2) : $2.fromByteArray(e2.slice(t4, n3));
            }
            function x(e2, t4, n3) {
              n3 = o(e2.length, n3);
              for (var r2 = [], a = t4; a < n3; ) {
                var d2 = e2[a], s2 = null, l2 = 239 < d2 ? 4 : 223 < d2 ? 3 : 191 < d2 ? 2 : 1;
                if (a + l2 <= n3) {
                  var c2, u2, p2, f2;
                  1 === l2 ? 128 > d2 && (s2 = d2) : 2 === l2 ? (c2 = e2[a + 1], 128 == (192 & c2) && (f2 = (31 & d2) << 6 | 63 & c2, 127 < f2 && (s2 = f2))) : 3 === l2 ? (c2 = e2[a + 1], u2 = e2[a + 2], 128 == (192 & c2) && 128 == (192 & u2) && (f2 = (15 & d2) << 12 | (63 & c2) << 6 | 63 & u2, 2047 < f2 && (55296 > f2 || 57343 < f2) && (s2 = f2))) : 4 === l2 ? (c2 = e2[a + 1], u2 = e2[a + 2], p2 = e2[a + 3], 128 == (192 & c2) && 128 == (192 & u2) && 128 == (192 & p2) && (f2 = (15 & d2) << 18 | (63 & c2) << 12 | (63 & u2) << 6 | 63 & p2, 65535 < f2 && 1114112 > f2 && (s2 = f2))) : void 0;
                }
                null === s2 ? (s2 = 65533, l2 = 1) : 65535 < s2 && (s2 -= 65536, r2.push(55296 | 1023 & s2 >>> 10), s2 = 56320 | 1023 & s2), r2.push(s2), a += l2;
              }
              return N(r2);
            }
            function N(e2) {
              var n3 = e2.length;
              if (n3 <= 4096) return t3.apply(String, e2);
              for (var r2 = "", a = 0; a < n3; ) r2 += t3.apply(String, e2.slice(a, a += 4096));
              return r2;
            }
            function D(e2, n3, r2) {
              var a = "";
              r2 = o(e2.length, r2);
              for (var d2 = n3; d2 < r2; ++d2) a += t3(127 & e2[d2]);
              return a;
            }
            function I(e2, n3, r2) {
              var a = "";
              r2 = o(e2.length, r2);
              for (var d2 = n3; d2 < r2; ++d2) a += t3(e2[d2]);
              return a;
            }
            function P(e2, t4, n3) {
              var r2 = e2.length;
              (!t4 || 0 > t4) && (t4 = 0), (!n3 || 0 > n3 || n3 > r2) && (n3 = r2);
              for (var a = "", o2 = t4; o2 < n3; ++o2) a += W(e2[o2]);
              return a;
            }
            function M(e2, n3, r2) {
              for (var a = e2.slice(n3, r2), o2 = "", d2 = 0; d2 < a.length; d2 += 2) o2 += t3(a[d2] + 256 * a[d2 + 1]);
              return o2;
            }
            function O(e2, t4, n3) {
              if (0 != e2 % 1 || 0 > e2) throw new RangeError("offset is not uint");
              if (e2 + t4 > n3) throw new RangeError("Trying to access beyond buffer length");
            }
            function F(e2, t4, n3, r2, a, o2) {
              if (!s.isBuffer(e2)) throw new TypeError('"buffer" argument must be a Buffer instance');
              if (t4 > a || t4 < o2) throw new RangeError('"value" argument is out of bounds');
              if (n3 + r2 > e2.length) throw new RangeError("Index out of range");
            }
            function B(e2, t4, n3, r2) {
              if (n3 + r2 > e2.length) throw new RangeError("Index out of range");
              if (0 > n3) throw new RangeError("Index out of range");
            }
            function U(e2, t4, n3, r2, a) {
              return t4 = +t4, n3 >>>= 0, a || B(e2, t4, n3, 4, 34028234663852886e22, -34028234663852886e22), J.write(e2, t4, n3, r2, 23, 4), n3 + 4;
            }
            function j(e2, t4, n3, r2, a) {
              return t4 = +t4, n3 >>>= 0, a || B(e2, t4, n3, 8, 17976931348623157e292, -17976931348623157e292), J.write(e2, t4, n3, r2, 52, 8), n3 + 8;
            }
            function q(e2) {
              if (e2 = e2.split("=")[0], e2 = e2.trim().replace(Q, ""), 2 > e2.length) return "";
              for (; 0 != e2.length % 4; ) e2 += "=";
              return e2;
            }
            function W(e2) {
              return 16 > e2 ? "0" + e2.toString(16) : e2.toString(16);
            }
            function H(e2, t4) {
              t4 = t4 || 1 / 0;
              for (var n3, r2 = e2.length, a = null, o2 = [], d2 = 0; d2 < r2; ++d2) {
                if (n3 = e2.charCodeAt(d2), 55295 < n3 && 57344 > n3) {
                  if (!a) {
                    if (56319 < n3) {
                      -1 < (t4 -= 3) && o2.push(239, 191, 189);
                      continue;
                    } else if (d2 + 1 === r2) {
                      -1 < (t4 -= 3) && o2.push(239, 191, 189);
                      continue;
                    }
                    a = n3;
                    continue;
                  }
                  if (56320 > n3) {
                    -1 < (t4 -= 3) && o2.push(239, 191, 189), a = n3;
                    continue;
                  }
                  n3 = (a - 55296 << 10 | n3 - 56320) + 65536;
                } else a && -1 < (t4 -= 3) && o2.push(239, 191, 189);
                if (a = null, 128 > n3) {
                  if (0 > (t4 -= 1)) break;
                  o2.push(n3);
                } else if (2048 > n3) {
                  if (0 > (t4 -= 2)) break;
                  o2.push(192 | n3 >> 6, 128 | 63 & n3);
                } else if (65536 > n3) {
                  if (0 > (t4 -= 3)) break;
                  o2.push(224 | n3 >> 12, 128 | 63 & n3 >> 6, 128 | 63 & n3);
                } else if (1114112 > n3) {
                  if (0 > (t4 -= 4)) break;
                  o2.push(240 | n3 >> 18, 128 | 63 & n3 >> 12, 128 | 63 & n3 >> 6, 128 | 63 & n3);
                } else throw new Error("Invalid code point");
              }
              return o2;
            }
            function Y4(e2) {
              for (var t4 = [], n3 = 0; n3 < e2.length; ++n3) t4.push(255 & e2.charCodeAt(n3));
              return t4;
            }
            function V(e2, t4) {
              for (var n3, r2, a, o2 = [], d2 = 0; d2 < e2.length && !(0 > (t4 -= 2)); ++d2) n3 = e2.charCodeAt(d2), r2 = n3 >> 8, a = n3 % 256, o2.push(a), o2.push(r2);
              return o2;
            }
            function z(e2) {
              return $2.toByteArray(q(e2));
            }
            function G(e2, t4, n3, r2) {
              for (var a = 0; a < r2 && !(a + n3 >= t4.length || a >= e2.length); ++a) t4[a + n3] = e2[a];
              return a;
            }
            function K(e2, t4) {
              return e2 instanceof t4 || null != e2 && null != e2.constructor && null != e2.constructor.name && e2.constructor.name === t4.name;
            }
            function X(e2) {
              return e2 !== e2;
            }
            var $2 = e("base64-js"), J = e("ieee754");
            n2.Buffer = s, n2.SlowBuffer = function(e2) {
              return +e2 != e2 && (e2 = 0), s.alloc(+e2);
            }, n2.INSPECT_MAX_BYTES = 50;
            n2.kMaxLength = 2147483647, s.TYPED_ARRAY_SUPPORT = (function() {
              try {
                var e2 = new Uint8Array(1);
                return e2.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
                  return 42;
                } }, 42 === e2.foo();
              } catch (t4) {
                return false;
              }
            })(), s.TYPED_ARRAY_SUPPORT || "undefined" == typeof console || "function" != typeof console.error || console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."), Object.defineProperty(s.prototype, "parent", { enumerable: true, get: function() {
              return s.isBuffer(this) ? this.buffer : void 0;
            } }), Object.defineProperty(s.prototype, "offset", { enumerable: true, get: function() {
              return s.isBuffer(this) ? this.byteOffset : void 0;
            } }), "undefined" != typeof Symbol && null != Symbol.species && s[Symbol.species] === s && Object.defineProperty(s, Symbol.species, { value: null, configurable: true, enumerable: false, writable: false }), s.poolSize = 8192, s.from = function(e2, t4, n3) {
              return l(e2, t4, n3);
            }, s.prototype.__proto__ = Uint8Array.prototype, s.__proto__ = Uint8Array, s.alloc = function(e2, t4, n3) {
              return u(e2, t4, n3);
            }, s.allocUnsafe = function(e2) {
              return p(e2);
            }, s.allocUnsafeSlow = function(e2) {
              return p(e2);
            }, s.isBuffer = function(e2) {
              return null != e2 && true === e2._isBuffer && e2 !== s.prototype;
            }, s.compare = function(e2, t4) {
              if (K(e2, Uint8Array) && (e2 = s.from(e2, e2.offset, e2.byteLength)), K(t4, Uint8Array) && (t4 = s.from(t4, t4.offset, t4.byteLength)), !s.isBuffer(e2) || !s.isBuffer(t4)) throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
              if (e2 === t4) return 0;
              for (var n3 = e2.length, r2 = t4.length, d2 = 0, l2 = o(n3, r2); d2 < l2; ++d2) if (e2[d2] !== t4[d2]) {
                n3 = e2[d2], r2 = t4[d2];
                break;
              }
              return n3 < r2 ? -1 : r2 < n3 ? 1 : 0;
            }, s.isEncoding = function(e2) {
              switch ((e2 + "").toLowerCase()) {
                case "hex":
                case "utf8":
                case "utf-8":
                case "ascii":
                case "latin1":
                case "binary":
                case "base64":
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return true;
                default:
                  return false;
              }
            }, s.concat = function(e2, t4) {
              if (!Array.isArray(e2)) throw new TypeError('"list" argument must be an Array of Buffers');
              if (0 === e2.length) return s.alloc(0);
              var n3;
              if (t4 === void 0) for (t4 = 0, n3 = 0; n3 < e2.length; ++n3) t4 += e2[n3].length;
              var r2 = s.allocUnsafe(t4), a = 0;
              for (n3 = 0; n3 < e2.length; ++n3) {
                var o2 = e2[n3];
                if (K(o2, Uint8Array) && (o2 = s.from(o2)), !s.isBuffer(o2)) throw new TypeError('"list" argument must be an Array of Buffers');
                o2.copy(r2, a), a += o2.length;
              }
              return r2;
            }, s.byteLength = b, s.prototype._isBuffer = true, s.prototype.swap16 = function() {
              var e2 = this.length;
              if (0 != e2 % 2) throw new RangeError("Buffer size must be a multiple of 16-bits");
              for (var t4 = 0; t4 < e2; t4 += 2) C(this, t4, t4 + 1);
              return this;
            }, s.prototype.swap32 = function() {
              var e2 = this.length;
              if (0 != e2 % 4) throw new RangeError("Buffer size must be a multiple of 32-bits");
              for (var t4 = 0; t4 < e2; t4 += 4) C(this, t4, t4 + 3), C(this, t4 + 1, t4 + 2);
              return this;
            }, s.prototype.swap64 = function() {
              var e2 = this.length;
              if (0 != e2 % 8) throw new RangeError("Buffer size must be a multiple of 64-bits");
              for (var t4 = 0; t4 < e2; t4 += 8) C(this, t4, t4 + 7), C(this, t4 + 1, t4 + 6), C(this, t4 + 2, t4 + 5), C(this, t4 + 3, t4 + 4);
              return this;
            }, s.prototype.toString = function() {
              var e2 = this.length;
              return 0 === e2 ? "" : 0 === arguments.length ? x(this, 0, e2) : y.apply(this, arguments);
            }, s.prototype.toLocaleString = s.prototype.toString, s.prototype.equals = function(e2) {
              if (!s.isBuffer(e2)) throw new TypeError("Argument must be a Buffer");
              return this === e2 || 0 === s.compare(this, e2);
            }, s.prototype.inspect = function() {
              var e2 = "", t4 = n2.INSPECT_MAX_BYTES;
              return e2 = this.toString("hex", 0, t4).replace(/(.{2})/g, "$1 ").trim(), this.length > t4 && (e2 += " ... "), "<Buffer " + e2 + ">";
            }, s.prototype.compare = function(e2, t4, n3, r2, a) {
              if (K(e2, Uint8Array) && (e2 = s.from(e2, e2.offset, e2.byteLength)), !s.isBuffer(e2)) throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof e2);
              if (void 0 === t4 && (t4 = 0), void 0 === n3 && (n3 = e2 ? e2.length : 0), void 0 === r2 && (r2 = 0), void 0 === a && (a = this.length), 0 > t4 || n3 > e2.length || 0 > r2 || a > this.length) throw new RangeError("out of range index");
              if (r2 >= a && t4 >= n3) return 0;
              if (r2 >= a) return -1;
              if (t4 >= n3) return 1;
              if (t4 >>>= 0, n3 >>>= 0, r2 >>>= 0, a >>>= 0, this === e2) return 0;
              for (var d2 = a - r2, l2 = n3 - t4, c2 = o(d2, l2), u2 = this.slice(r2, a), p2 = e2.slice(t4, n3), f2 = 0; f2 < c2; ++f2) if (u2[f2] !== p2[f2]) {
                d2 = u2[f2], l2 = p2[f2];
                break;
              }
              return d2 < l2 ? -1 : l2 < d2 ? 1 : 0;
            }, s.prototype.includes = function(e2, t4, n3) {
              return -1 !== this.indexOf(e2, t4, n3);
            }, s.prototype.indexOf = function(e2, t4, n3) {
              return R(this, e2, t4, n3, true);
            }, s.prototype.lastIndexOf = function(e2, t4, n3) {
              return R(this, e2, t4, n3, false);
            }, s.prototype.write = function(e2, t4, n3, r2) {
              if (void 0 === t4) r2 = "utf8", n3 = this.length, t4 = 0;
              else if (void 0 === n3 && "string" == typeof t4) r2 = t4, n3 = this.length, t4 = 0;
              else if (isFinite(t4)) t4 >>>= 0, isFinite(n3) ? (n3 >>>= 0, void 0 === r2 && (r2 = "utf8")) : (r2 = n3, n3 = void 0);
              else throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
              var a = this.length - t4;
              if ((void 0 === n3 || n3 > a) && (n3 = a), 0 < e2.length && (0 > n3 || 0 > t4) || t4 > this.length) throw new RangeError("Attempt to write outside buffer bounds");
              r2 || (r2 = "utf8");
              for (var o2 = false; ; ) switch (r2) {
                case "hex":
                  return w(this, e2, t4, n3);
                case "utf8":
                case "utf-8":
                  return S(this, e2, t4, n3);
                case "ascii":
                  return T(this, e2, t4, n3);
                case "latin1":
                case "binary":
                  return v(this, e2, t4, n3);
                case "base64":
                  return k(this, e2, t4, n3);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return L(this, e2, t4, n3);
                default:
                  if (o2) throw new TypeError("Unknown encoding: " + r2);
                  r2 = ("" + r2).toLowerCase(), o2 = true;
              }
            }, s.prototype.toJSON = function() {
              return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
            };
            s.prototype.slice = function(e2, t4) {
              var n3 = this.length;
              e2 = ~~e2, t4 = t4 === void 0 ? n3 : ~~t4, 0 > e2 ? (e2 += n3, 0 > e2 && (e2 = 0)) : e2 > n3 && (e2 = n3), 0 > t4 ? (t4 += n3, 0 > t4 && (t4 = 0)) : t4 > n3 && (t4 = n3), t4 < e2 && (t4 = e2);
              var r2 = this.subarray(e2, t4);
              return r2.__proto__ = s.prototype, r2;
            }, s.prototype.readUIntLE = function(e2, t4, n3) {
              e2 >>>= 0, t4 >>>= 0, n3 || O(e2, t4, this.length);
              for (var r2 = this[e2], a = 1, o2 = 0; ++o2 < t4 && (a *= 256); ) r2 += this[e2 + o2] * a;
              return r2;
            }, s.prototype.readUIntBE = function(e2, t4, n3) {
              e2 >>>= 0, t4 >>>= 0, n3 || O(e2, t4, this.length);
              for (var r2 = this[e2 + --t4], a = 1; 0 < t4 && (a *= 256); ) r2 += this[e2 + --t4] * a;
              return r2;
            }, s.prototype.readUInt8 = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 1, this.length), this[e2];
            }, s.prototype.readUInt16LE = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 2, this.length), this[e2] | this[e2 + 1] << 8;
            }, s.prototype.readUInt16BE = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 2, this.length), this[e2] << 8 | this[e2 + 1];
            }, s.prototype.readUInt32LE = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 4, this.length), (this[e2] | this[e2 + 1] << 8 | this[e2 + 2] << 16) + 16777216 * this[e2 + 3];
            }, s.prototype.readUInt32BE = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 4, this.length), 16777216 * this[e2] + (this[e2 + 1] << 16 | this[e2 + 2] << 8 | this[e2 + 3]);
            }, s.prototype.readIntLE = function(e2, t4, n3) {
              e2 >>>= 0, t4 >>>= 0, n3 || O(e2, t4, this.length);
              for (var a = this[e2], o2 = 1, d2 = 0; ++d2 < t4 && (o2 *= 256); ) a += this[e2 + d2] * o2;
              return o2 *= 128, a >= o2 && (a -= r(2, 8 * t4)), a;
            }, s.prototype.readIntBE = function(e2, t4, n3) {
              e2 >>>= 0, t4 >>>= 0, n3 || O(e2, t4, this.length);
              for (var a = t4, o2 = 1, d2 = this[e2 + --a]; 0 < a && (o2 *= 256); ) d2 += this[e2 + --a] * o2;
              return o2 *= 128, d2 >= o2 && (d2 -= r(2, 8 * t4)), d2;
            }, s.prototype.readInt8 = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 1, this.length), 128 & this[e2] ? -1 * (255 - this[e2] + 1) : this[e2];
            }, s.prototype.readInt16LE = function(e2, t4) {
              e2 >>>= 0, t4 || O(e2, 2, this.length);
              var n3 = this[e2] | this[e2 + 1] << 8;
              return 32768 & n3 ? 4294901760 | n3 : n3;
            }, s.prototype.readInt16BE = function(e2, t4) {
              e2 >>>= 0, t4 || O(e2, 2, this.length);
              var n3 = this[e2 + 1] | this[e2] << 8;
              return 32768 & n3 ? 4294901760 | n3 : n3;
            }, s.prototype.readInt32LE = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 4, this.length), this[e2] | this[e2 + 1] << 8 | this[e2 + 2] << 16 | this[e2 + 3] << 24;
            }, s.prototype.readInt32BE = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 4, this.length), this[e2] << 24 | this[e2 + 1] << 16 | this[e2 + 2] << 8 | this[e2 + 3];
            }, s.prototype.readFloatLE = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 4, this.length), J.read(this, e2, true, 23, 4);
            }, s.prototype.readFloatBE = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 4, this.length), J.read(this, e2, false, 23, 4);
            }, s.prototype.readDoubleLE = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 8, this.length), J.read(this, e2, true, 52, 8);
            }, s.prototype.readDoubleBE = function(e2, t4) {
              return e2 >>>= 0, t4 || O(e2, 8, this.length), J.read(this, e2, false, 52, 8);
            }, s.prototype.writeUIntLE = function(e2, t4, n3, a) {
              if (e2 = +e2, t4 >>>= 0, n3 >>>= 0, !a) {
                var o2 = r(2, 8 * n3) - 1;
                F(this, e2, t4, n3, o2, 0);
              }
              var d2 = 1, s2 = 0;
              for (this[t4] = 255 & e2; ++s2 < n3 && (d2 *= 256); ) this[t4 + s2] = 255 & e2 / d2;
              return t4 + n3;
            }, s.prototype.writeUIntBE = function(e2, t4, n3, a) {
              if (e2 = +e2, t4 >>>= 0, n3 >>>= 0, !a) {
                var o2 = r(2, 8 * n3) - 1;
                F(this, e2, t4, n3, o2, 0);
              }
              var d2 = n3 - 1, s2 = 1;
              for (this[t4 + d2] = 255 & e2; 0 <= --d2 && (s2 *= 256); ) this[t4 + d2] = 255 & e2 / s2;
              return t4 + n3;
            }, s.prototype.writeUInt8 = function(e2, t4, n3) {
              return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 1, 255, 0), this[t4] = 255 & e2, t4 + 1;
            }, s.prototype.writeUInt16LE = function(e2, t4, n3) {
              return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 2, 65535, 0), this[t4] = 255 & e2, this[t4 + 1] = e2 >>> 8, t4 + 2;
            }, s.prototype.writeUInt16BE = function(e2, t4, n3) {
              return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 2, 65535, 0), this[t4] = e2 >>> 8, this[t4 + 1] = 255 & e2, t4 + 2;
            }, s.prototype.writeUInt32LE = function(e2, t4, n3) {
              return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 4, 4294967295, 0), this[t4 + 3] = e2 >>> 24, this[t4 + 2] = e2 >>> 16, this[t4 + 1] = e2 >>> 8, this[t4] = 255 & e2, t4 + 4;
            }, s.prototype.writeUInt32BE = function(e2, t4, n3) {
              return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 4, 4294967295, 0), this[t4] = e2 >>> 24, this[t4 + 1] = e2 >>> 16, this[t4 + 2] = e2 >>> 8, this[t4 + 3] = 255 & e2, t4 + 4;
            }, s.prototype.writeIntLE = function(e2, t4, n3, a) {
              if (e2 = +e2, t4 >>>= 0, !a) {
                var o2 = r(2, 8 * n3 - 1);
                F(this, e2, t4, n3, o2 - 1, -o2);
              }
              var d2 = 0, s2 = 1, l2 = 0;
              for (this[t4] = 255 & e2; ++d2 < n3 && (s2 *= 256); ) 0 > e2 && 0 === l2 && 0 !== this[t4 + d2 - 1] && (l2 = 1), this[t4 + d2] = 255 & (e2 / s2 >> 0) - l2;
              return t4 + n3;
            }, s.prototype.writeIntBE = function(e2, t4, n3, a) {
              if (e2 = +e2, t4 >>>= 0, !a) {
                var o2 = r(2, 8 * n3 - 1);
                F(this, e2, t4, n3, o2 - 1, -o2);
              }
              var d2 = n3 - 1, s2 = 1, l2 = 0;
              for (this[t4 + d2] = 255 & e2; 0 <= --d2 && (s2 *= 256); ) 0 > e2 && 0 === l2 && 0 !== this[t4 + d2 + 1] && (l2 = 1), this[t4 + d2] = 255 & (e2 / s2 >> 0) - l2;
              return t4 + n3;
            }, s.prototype.writeInt8 = function(e2, t4, n3) {
              return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 1, 127, -128), 0 > e2 && (e2 = 255 + e2 + 1), this[t4] = 255 & e2, t4 + 1;
            }, s.prototype.writeInt16LE = function(e2, t4, n3) {
              return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 2, 32767, -32768), this[t4] = 255 & e2, this[t4 + 1] = e2 >>> 8, t4 + 2;
            }, s.prototype.writeInt16BE = function(e2, t4, n3) {
              return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 2, 32767, -32768), this[t4] = e2 >>> 8, this[t4 + 1] = 255 & e2, t4 + 2;
            }, s.prototype.writeInt32LE = function(e2, t4, n3) {
              return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 4, 2147483647, -2147483648), this[t4] = 255 & e2, this[t4 + 1] = e2 >>> 8, this[t4 + 2] = e2 >>> 16, this[t4 + 3] = e2 >>> 24, t4 + 4;
            }, s.prototype.writeInt32BE = function(e2, t4, n3) {
              return e2 = +e2, t4 >>>= 0, n3 || F(this, e2, t4, 4, 2147483647, -2147483648), 0 > e2 && (e2 = 4294967295 + e2 + 1), this[t4] = e2 >>> 24, this[t4 + 1] = e2 >>> 16, this[t4 + 2] = e2 >>> 8, this[t4 + 3] = 255 & e2, t4 + 4;
            }, s.prototype.writeFloatLE = function(e2, t4, n3) {
              return U(this, e2, t4, true, n3);
            }, s.prototype.writeFloatBE = function(e2, t4, n3) {
              return U(this, e2, t4, false, n3);
            }, s.prototype.writeDoubleLE = function(e2, t4, n3) {
              return j(this, e2, t4, true, n3);
            }, s.prototype.writeDoubleBE = function(e2, t4, n3) {
              return j(this, e2, t4, false, n3);
            }, s.prototype.copy = function(e2, t4, n3, r2) {
              if (!s.isBuffer(e2)) throw new TypeError("argument should be a Buffer");
              if (n3 || (n3 = 0), r2 || 0 === r2 || (r2 = this.length), t4 >= e2.length && (t4 = e2.length), t4 || (t4 = 0), 0 < r2 && r2 < n3 && (r2 = n3), r2 === n3) return 0;
              if (0 === e2.length || 0 === this.length) return 0;
              if (0 > t4) throw new RangeError("targetStart out of bounds");
              if (0 > n3 || n3 >= this.length) throw new RangeError("Index out of range");
              if (0 > r2) throw new RangeError("sourceEnd out of bounds");
              r2 > this.length && (r2 = this.length), e2.length - t4 < r2 - n3 && (r2 = e2.length - t4 + n3);
              var a = r2 - n3;
              if (this === e2 && "function" == typeof Uint8Array.prototype.copyWithin) this.copyWithin(t4, n3, r2);
              else if (this === e2 && n3 < t4 && t4 < r2) for (var o2 = a - 1; 0 <= o2; --o2) e2[o2 + t4] = this[o2 + n3];
              else Uint8Array.prototype.set.call(e2, this.subarray(n3, r2), t4);
              return a;
            }, s.prototype.fill = function(e2, t4, n3, r2) {
              if ("string" == typeof e2) {
                if ("string" == typeof t4 ? (r2 = t4, t4 = 0, n3 = this.length) : "string" == typeof n3 && (r2 = n3, n3 = this.length), void 0 !== r2 && "string" != typeof r2) throw new TypeError("encoding must be a string");
                if ("string" == typeof r2 && !s.isEncoding(r2)) throw new TypeError("Unknown encoding: " + r2);
                if (1 === e2.length) {
                  var a = e2.charCodeAt(0);
                  ("utf8" === r2 && 128 > a || "latin1" === r2) && (e2 = a);
                }
              } else "number" == typeof e2 && (e2 &= 255);
              if (0 > t4 || this.length < t4 || this.length < n3) throw new RangeError("Out of range index");
              if (n3 <= t4) return this;
              t4 >>>= 0, n3 = n3 === void 0 ? this.length : n3 >>> 0, e2 || (e2 = 0);
              var o2;
              if ("number" == typeof e2) for (o2 = t4; o2 < n3; ++o2) this[o2] = e2;
              else {
                var d2 = s.isBuffer(e2) ? e2 : s.from(e2, r2), l2 = d2.length;
                if (0 === l2) throw new TypeError('The value "' + e2 + '" is invalid for argument "value"');
                for (o2 = 0; o2 < n3 - t4; ++o2) this[o2 + t4] = d2[o2 % l2];
              }
              return this;
            };
            var Q = /[^+/0-9A-Za-z-_]/g;
          }).call(this);
        }).call(this, e("buffer").Buffer);
      }, { "base64-js": 1, buffer: 3, ieee754: 9 }], 4: [function(e, t2, n2) {
        (function(a) {
          (function() {
            function r2() {
              let e2;
              try {
                e2 = n2.storage.getItem("debug");
              } catch (e3) {
              }
              return !e2 && "undefined" != typeof a && "env" in a && (e2 = a.env.DEBUG), e2;
            }
            n2.formatArgs = function(e2) {
              if (e2[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + e2[0] + (this.useColors ? "%c " : " ") + "+" + t2.exports.humanize(this.diff), !this.useColors) return;
              const n3 = "color: " + this.color;
              e2.splice(1, 0, n3, "color: inherit");
              let r3 = 0, a2 = 0;
              e2[0].replace(/%[a-zA-Z%]/g, (e3) => {
                "%%" === e3 || (r3++, "%c" === e3 && (a2 = r3));
              }), e2.splice(a2, 0, n3);
            }, n2.save = function(e2) {
              try {
                e2 ? n2.storage.setItem("debug", e2) : n2.storage.removeItem("debug");
              } catch (e3) {
              }
            }, n2.load = r2, n2.useColors = function() {
              return !!("undefined" != typeof window && window.process && ("renderer" === window.process.type || window.process.__nwjs)) || !("undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) && ("undefined" != typeof document && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || "undefined" != typeof window && window.console && (window.console.firebug || window.console.exception && window.console.table) || "undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && 31 <= parseInt(RegExp.$1, 10) || "undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
            }, n2.storage = (function() {
              try {
                return localStorage;
              } catch (e2) {
              }
            })(), n2.destroy = /* @__PURE__ */ (() => {
              let e2 = false;
              return () => {
                e2 || (e2 = true, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
              };
            })(), n2.colors = ["#0000CC", "#0000FF", "#0033CC", "#0033FF", "#0066CC", "#0066FF", "#0099CC", "#0099FF", "#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF", "#3300CC", "#3300FF", "#3333CC", "#3333FF", "#3366CC", "#3366FF", "#3399CC", "#3399FF", "#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF", "#6600CC", "#6600FF", "#6633CC", "#6633FF", "#66CC00", "#66CC33", "#9900CC", "#9900FF", "#9933CC", "#9933FF", "#99CC00", "#99CC33", "#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF", "#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF", "#CC6600", "#CC6633", "#CC9900", "#CC9933", "#CCCC00", "#CCCC33", "#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF", "#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#FF6600", "#FF6633", "#FF9900", "#FF9933", "#FFCC00", "#FFCC33"], n2.log = console.debug || console.log || (() => {
            }), t2.exports = e("./common")(n2);
            const { formatters: o } = t2.exports;
            o.j = function(e2) {
              try {
                return JSON.stringify(e2);
              } catch (e3) {
                return "[UnexpectedJSONParseError]: " + e3.message;
              }
            };
          }).call(this);
        }).call(this, e("_process"));
      }, { "./common": 5, _process: 12 }], 5: [function(e, t2) {
        t2.exports = function(t3) {
          function r2(e2) {
            function t4(...e3) {
              if (!t4.enabled) return;
              const a2 = t4, o3 = +/* @__PURE__ */ new Date(), i = o3 - (n2 || o3);
              a2.diff = i, a2.prev = n2, a2.curr = o3, n2 = o3, e3[0] = r2.coerce(e3[0]), "string" != typeof e3[0] && e3.unshift("%O");
              let d = 0;
              e3[0] = e3[0].replace(/%([a-zA-Z%])/g, (t5, n3) => {
                if ("%%" === t5) return "%";
                d++;
                const o4 = r2.formatters[n3];
                if ("function" == typeof o4) {
                  const n4 = e3[d];
                  t5 = o4.call(a2, n4), e3.splice(d, 1), d--;
                }
                return t5;
              }), r2.formatArgs.call(a2, e3);
              const s = a2.log || r2.log;
              s.apply(a2, e3);
            }
            let n2, o2 = null;
            return t4.namespace = e2, t4.useColors = r2.useColors(), t4.color = r2.selectColor(e2), t4.extend = a, t4.destroy = r2.destroy, Object.defineProperty(t4, "enabled", { enumerable: true, configurable: false, get: () => null === o2 ? r2.enabled(e2) : o2, set: (e3) => {
              o2 = e3;
            } }), "function" == typeof r2.init && r2.init(t4), t4;
          }
          function a(e2, t4) {
            const n2 = r2(this.namespace + ("undefined" == typeof t4 ? ":" : t4) + e2);
            return n2.log = this.log, n2;
          }
          function o(e2) {
            return e2.toString().substring(2, e2.toString().length - 2).replace(/\.\*\?$/, "*");
          }
          return r2.debug = r2, r2.default = r2, r2.coerce = function(e2) {
            return e2 instanceof Error ? e2.stack || e2.message : e2;
          }, r2.disable = function() {
            const e2 = [...r2.names.map(o), ...r2.skips.map(o).map((e3) => "-" + e3)].join(",");
            return r2.enable(""), e2;
          }, r2.enable = function(e2) {
            r2.save(e2), r2.names = [], r2.skips = [];
            let t4;
            const n2 = ("string" == typeof e2 ? e2 : "").split(/[\s,]+/), a2 = n2.length;
            for (t4 = 0; t4 < a2; t4++) n2[t4] && (e2 = n2[t4].replace(/\*/g, ".*?"), "-" === e2[0] ? r2.skips.push(new RegExp("^" + e2.substr(1) + "$")) : r2.names.push(new RegExp("^" + e2 + "$")));
          }, r2.enabled = function(e2) {
            if ("*" === e2[e2.length - 1]) return true;
            let t4, n2;
            for (t4 = 0, n2 = r2.skips.length; t4 < n2; t4++) if (r2.skips[t4].test(e2)) return false;
            for (t4 = 0, n2 = r2.names.length; t4 < n2; t4++) if (r2.names[t4].test(e2)) return true;
            return false;
          }, r2.humanize = e("ms"), r2.destroy = function() {
            console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
          }, Object.keys(t3).forEach((e2) => {
            r2[e2] = t3[e2];
          }), r2.names = [], r2.skips = [], r2.formatters = {}, r2.selectColor = function(e2) {
            let t4 = 0;
            for (let n2 = 0; n2 < e2.length; n2++) t4 = (t4 << 5) - t4 + e2.charCodeAt(n2), t4 |= 0;
            return r2.colors[n(t4) % r2.colors.length];
          }, r2.enable(r2.load()), r2;
        };
      }, { ms: 11 }], 6: [function(e, t2) {
        "use strict";
        function n2(e2, t3) {
          for (const n3 in t3) Object.defineProperty(e2, n3, { value: t3[n3], enumerable: true, configurable: true });
          return e2;
        }
        t2.exports = function(e2, t3, r2) {
          if (!e2 || "string" == typeof e2) throw new TypeError("Please pass an Error to err-code");
          r2 || (r2 = {}), "object" == typeof t3 && (r2 = t3, t3 = ""), t3 && (r2.code = t3);
          try {
            return n2(e2, r2);
          } catch (t4) {
            r2.message = e2.message, r2.stack = e2.stack;
            const a = function() {
            };
            a.prototype = Object.create(Object.getPrototypeOf(e2));
            const o = n2(new a(), r2);
            return o;
          }
        };
      }, {}], 7: [function(e, t2) {
        "use strict";
        function n2(e2) {
          console && console.warn && console.warn(e2);
        }
        function r2() {
          r2.init.call(this);
        }
        function a(e2) {
          if ("function" != typeof e2) throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof e2);
        }
        function o(e2) {
          return void 0 === e2._maxListeners ? r2.defaultMaxListeners : e2._maxListeners;
        }
        function i(e2, t3, r3, i2) {
          var d2, s2, l2;
          if (a(r3), s2 = e2._events, void 0 === s2 ? (s2 = e2._events = /* @__PURE__ */ Object.create(null), e2._eventsCount = 0) : (void 0 !== s2.newListener && (e2.emit("newListener", t3, r3.listener ? r3.listener : r3), s2 = e2._events), l2 = s2[t3]), void 0 === l2) l2 = s2[t3] = r3, ++e2._eventsCount;
          else if ("function" == typeof l2 ? l2 = s2[t3] = i2 ? [r3, l2] : [l2, r3] : i2 ? l2.unshift(r3) : l2.push(r3), d2 = o(e2), 0 < d2 && l2.length > d2 && !l2.warned) {
            l2.warned = true;
            var c2 = new Error("Possible EventEmitter memory leak detected. " + l2.length + " " + (t3 + " listeners added. Use emitter.setMaxListeners() to increase limit"));
            c2.name = "MaxListenersExceededWarning", c2.emitter = e2, c2.type = t3, c2.count = l2.length, n2(c2);
          }
          return e2;
        }
        function d() {
          if (!this.fired) return this.target.removeListener(this.type, this.wrapFn), this.fired = true, 0 === arguments.length ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
        }
        function s(e2, t3, n3) {
          var r3 = { fired: false, wrapFn: void 0, target: e2, type: t3, listener: n3 }, a2 = d.bind(r3);
          return a2.listener = n3, r3.wrapFn = a2, a2;
        }
        function l(e2, t3, n3) {
          var r3 = e2._events;
          if (r3 === void 0) return [];
          var a2 = r3[t3];
          return void 0 === a2 ? [] : "function" == typeof a2 ? n3 ? [a2.listener || a2] : [a2] : n3 ? f(a2) : u(a2, a2.length);
        }
        function c(e2) {
          var t3 = this._events;
          if (t3 !== void 0) {
            var n3 = t3[e2];
            if ("function" == typeof n3) return 1;
            if (void 0 !== n3) return n3.length;
          }
          return 0;
        }
        function u(e2, t3) {
          for (var n3 = Array(t3), r3 = 0; r3 < t3; ++r3) n3[r3] = e2[r3];
          return n3;
        }
        function p(e2, t3) {
          for (; t3 + 1 < e2.length; t3++) e2[t3] = e2[t3 + 1];
          e2.pop();
        }
        function f(e2) {
          for (var t3 = Array(e2.length), n3 = 0; n3 < t3.length; ++n3) t3[n3] = e2[n3].listener || e2[n3];
          return t3;
        }
        function g(e2, t3, n3) {
          "function" == typeof e2.on && _(e2, "error", t3, n3);
        }
        function _(e2, t3, n3, r3) {
          if ("function" == typeof e2.on) r3.once ? e2.once(t3, n3) : e2.on(t3, n3);
          else if ("function" == typeof e2.addEventListener) e2.addEventListener(t3, function a2(o2) {
            r3.once && e2.removeEventListener(t3, a2), n3(o2);
          });
          else throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof e2);
        }
        var h, m = "object" == typeof Reflect ? Reflect : null, b = m && "function" == typeof m.apply ? m.apply : function(e2, t3, n3) {
          return Function.prototype.apply.call(e2, t3, n3);
        };
        h = m && "function" == typeof m.ownKeys ? m.ownKeys : Object.getOwnPropertySymbols ? function(e2) {
          return Object.getOwnPropertyNames(e2).concat(Object.getOwnPropertySymbols(e2));
        } : function(e2) {
          return Object.getOwnPropertyNames(e2);
        };
        var y = Number.isNaN || function(e2) {
          return e2 !== e2;
        };
        t2.exports = r2, t2.exports.once = function(e2, t3) {
          return new Promise(function(n3, r3) {
            function a2(n4) {
              e2.removeListener(t3, o2), r3(n4);
            }
            function o2() {
              "function" == typeof e2.removeListener && e2.removeListener("error", a2), n3([].slice.call(arguments));
            }
            _(e2, t3, o2, { once: true }), "error" !== t3 && g(e2, a2, { once: true });
          });
        }, r2.EventEmitter = r2, r2.prototype._events = void 0, r2.prototype._eventsCount = 0, r2.prototype._maxListeners = void 0;
        var C = 10;
        Object.defineProperty(r2, "defaultMaxListeners", { enumerable: true, get: function() {
          return C;
        }, set: function(e2) {
          if ("number" != typeof e2 || 0 > e2 || y(e2)) throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + e2 + ".");
          C = e2;
        } }), r2.init = function() {
          (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
        }, r2.prototype.setMaxListeners = function(e2) {
          if ("number" != typeof e2 || 0 > e2 || y(e2)) throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e2 + ".");
          return this._maxListeners = e2, this;
        }, r2.prototype.getMaxListeners = function() {
          return o(this);
        }, r2.prototype.emit = function(e2) {
          for (var t3 = [], n3 = 1; n3 < arguments.length; n3++) t3.push(arguments[n3]);
          var r3 = "error" === e2, a2 = this._events;
          if (a2 !== void 0) r3 = r3 && a2.error === void 0;
          else if (!r3) return false;
          if (r3) {
            var o2;
            if (0 < t3.length && (o2 = t3[0]), o2 instanceof Error) throw o2;
            var d2 = new Error("Unhandled error." + (o2 ? " (" + o2.message + ")" : ""));
            throw d2.context = o2, d2;
          }
          var s2 = a2[e2];
          if (s2 === void 0) return false;
          if ("function" == typeof s2) b(s2, this, t3);
          else for (var l2 = s2.length, c2 = u(s2, l2), n3 = 0; n3 < l2; ++n3) b(c2[n3], this, t3);
          return true;
        }, r2.prototype.addListener = function(e2, t3) {
          return i(this, e2, t3, false);
        }, r2.prototype.on = r2.prototype.addListener, r2.prototype.prependListener = function(e2, t3) {
          return i(this, e2, t3, true);
        }, r2.prototype.once = function(e2, t3) {
          return a(t3), this.on(e2, s(this, e2, t3)), this;
        }, r2.prototype.prependOnceListener = function(e2, t3) {
          return a(t3), this.prependListener(e2, s(this, e2, t3)), this;
        }, r2.prototype.removeListener = function(e2, t3) {
          var n3, r3, o2, d2, s2;
          if (a(t3), r3 = this._events, void 0 === r3) return this;
          if (n3 = r3[e2], void 0 === n3) return this;
          if (n3 === t3 || n3.listener === t3) 0 == --this._eventsCount ? this._events = /* @__PURE__ */ Object.create(null) : (delete r3[e2], r3.removeListener && this.emit("removeListener", e2, n3.listener || t3));
          else if ("function" != typeof n3) {
            for (o2 = -1, d2 = n3.length - 1; 0 <= d2; d2--) if (n3[d2] === t3 || n3[d2].listener === t3) {
              s2 = n3[d2].listener, o2 = d2;
              break;
            }
            if (0 > o2) return this;
            0 === o2 ? n3.shift() : p(n3, o2), 1 === n3.length && (r3[e2] = n3[0]), void 0 !== r3.removeListener && this.emit("removeListener", e2, s2 || t3);
          }
          return this;
        }, r2.prototype.off = r2.prototype.removeListener, r2.prototype.removeAllListeners = function(e2) {
          var t3, n3, r3;
          if (n3 = this._events, void 0 === n3) return this;
          if (void 0 === n3.removeListener) return 0 === arguments.length ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : void 0 !== n3[e2] && (0 == --this._eventsCount ? this._events = /* @__PURE__ */ Object.create(null) : delete n3[e2]), this;
          if (0 === arguments.length) {
            var a2, o2 = Object.keys(n3);
            for (r3 = 0; r3 < o2.length; ++r3) a2 = o2[r3], "removeListener" !== a2 && this.removeAllListeners(a2);
            return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
          }
          if (t3 = n3[e2], "function" == typeof t3) this.removeListener(e2, t3);
          else if (void 0 !== t3) for (r3 = t3.length - 1; 0 <= r3; r3--) this.removeListener(e2, t3[r3]);
          return this;
        }, r2.prototype.listeners = function(e2) {
          return l(this, e2, true);
        }, r2.prototype.rawListeners = function(e2) {
          return l(this, e2, false);
        }, r2.listenerCount = function(e2, t3) {
          return "function" == typeof e2.listenerCount ? e2.listenerCount(t3) : c.call(e2, t3);
        }, r2.prototype.listenerCount = c, r2.prototype.eventNames = function() {
          return 0 < this._eventsCount ? h(this._events) : [];
        };
      }, {}], 8: [function(e, t2) {
        t2.exports = function() {
          if ("undefined" == typeof globalThis) return null;
          var e2 = { RTCPeerConnection: globalThis.RTCPeerConnection || globalThis.mozRTCPeerConnection || globalThis.webkitRTCPeerConnection, RTCSessionDescription: globalThis.RTCSessionDescription || globalThis.mozRTCSessionDescription || globalThis.webkitRTCSessionDescription, RTCIceCandidate: globalThis.RTCIceCandidate || globalThis.mozRTCIceCandidate || globalThis.webkitRTCIceCandidate };
          return e2.RTCPeerConnection ? e2 : null;
        };
      }, {}], 9: [function(e, a, o) {
        o.read = function(t2, n2, a2, o2, l) {
          var c, u, p = 8 * l - o2 - 1, f = (1 << p) - 1, g = f >> 1, _ = -7, h = a2 ? l - 1 : 0, b = a2 ? -1 : 1, d = t2[n2 + h];
          for (h += b, c = d & (1 << -_) - 1, d >>= -_, _ += p; 0 < _; c = 256 * c + t2[n2 + h], h += b, _ -= 8) ;
          for (u = c & (1 << -_) - 1, c >>= -_, _ += o2; 0 < _; u = 256 * u + t2[n2 + h], h += b, _ -= 8) ;
          if (0 === c) c = 1 - g;
          else {
            if (c === f) return u ? NaN : (d ? -1 : 1) * (1 / 0);
            u += r(2, o2), c -= g;
          }
          return (d ? -1 : 1) * u * r(2, c - o2);
        }, o.write = function(a2, o2, l, u, p, f) {
          var h, b, y, g = Math.LN2, _ = Math.log, C = 8 * f - p - 1, R = (1 << C) - 1, E = R >> 1, w = 23 === p ? r(2, -24) - r(2, -77) : 0, S = u ? 0 : f - 1, T = u ? 1 : -1, d = 0 > o2 || 0 === o2 && 0 > 1 / o2 ? 1 : 0;
          for (o2 = n(o2), isNaN(o2) || o2 === 1 / 0 ? (b = isNaN(o2) ? 1 : 0, h = R) : (h = t(_(o2) / g), 1 > o2 * (y = r(2, -h)) && (h--, y *= 2), o2 += 1 <= h + E ? w / y : w * r(2, 1 - E), 2 <= o2 * y && (h++, y /= 2), h + E >= R ? (b = 0, h = R) : 1 <= h + E ? (b = (o2 * y - 1) * r(2, p), h += E) : (b = o2 * r(2, E - 1) * r(2, p), h = 0)); 8 <= p; a2[l + S] = 255 & b, S += T, b /= 256, p -= 8) ;
          for (h = h << p | b, C += p; 0 < C; a2[l + S] = 255 & h, S += T, h /= 256, C -= 8) ;
          a2[l + S - T] |= 128 * d;
        };
      }, {}], 10: [function(e, t2) {
        t2.exports = "function" == typeof Object.create ? function(e2, t3) {
          t3 && (e2.super_ = t3, e2.prototype = Object.create(t3.prototype, { constructor: { value: e2, enumerable: false, writable: true, configurable: true } }));
        } : function(e2, t3) {
          if (t3) {
            e2.super_ = t3;
            var n2 = function() {
            };
            n2.prototype = t3.prototype, e2.prototype = new n2(), e2.prototype.constructor = e2;
          }
        };
      }, {}], 11: [function(e, t2) {
        var r2 = Math.round;
        function a(e2) {
          if (e2 += "", !(100 < e2.length)) {
            var t3 = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e2);
            if (t3) {
              var r3 = parseFloat(t3[1]), n2 = (t3[2] || "ms").toLowerCase();
              return "years" === n2 || "year" === n2 || "yrs" === n2 || "yr" === n2 || "y" === n2 ? 315576e5 * r3 : "weeks" === n2 || "week" === n2 || "w" === n2 ? 6048e5 * r3 : "days" === n2 || "day" === n2 || "d" === n2 ? 864e5 * r3 : "hours" === n2 || "hour" === n2 || "hrs" === n2 || "hr" === n2 || "h" === n2 ? 36e5 * r3 : "minutes" === n2 || "minute" === n2 || "mins" === n2 || "min" === n2 || "m" === n2 ? 6e4 * r3 : "seconds" === n2 || "second" === n2 || "secs" === n2 || "sec" === n2 || "s" === n2 ? 1e3 * r3 : "milliseconds" === n2 || "millisecond" === n2 || "msecs" === n2 || "msec" === n2 || "ms" === n2 ? r3 : void 0;
            }
          }
        }
        function o(e2) {
          var t3 = n(e2);
          return 864e5 <= t3 ? r2(e2 / 864e5) + "d" : 36e5 <= t3 ? r2(e2 / 36e5) + "h" : 6e4 <= t3 ? r2(e2 / 6e4) + "m" : 1e3 <= t3 ? r2(e2 / 1e3) + "s" : e2 + "ms";
        }
        function i(e2) {
          var t3 = n(e2);
          return 864e5 <= t3 ? s(e2, t3, 864e5, "day") : 36e5 <= t3 ? s(e2, t3, 36e5, "hour") : 6e4 <= t3 ? s(e2, t3, 6e4, "minute") : 1e3 <= t3 ? s(e2, t3, 1e3, "second") : e2 + " ms";
        }
        function s(e2, t3, a2, n2) {
          return r2(e2 / a2) + " " + n2 + (t3 >= 1.5 * a2 ? "s" : "");
        }
        var l = 24 * (60 * 6e4);
        t2.exports = function(e2, t3) {
          t3 = t3 || {};
          var n2 = typeof e2;
          if ("string" == n2 && 0 < e2.length) return a(e2);
          if ("number" === n2 && isFinite(e2)) return t3.long ? i(e2) : o(e2);
          throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(e2));
        };
      }, {}], 12: [function(e, t2) {
        function n2() {
          throw new Error("setTimeout has not been defined");
        }
        function r2() {
          throw new Error("clearTimeout has not been defined");
        }
        function a(t3) {
          if (c === setTimeout) return setTimeout(t3, 0);
          if ((c === n2 || !c) && setTimeout) return c = setTimeout, setTimeout(t3, 0);
          try {
            return c(t3, 0);
          } catch (n3) {
            try {
              return c.call(null, t3, 0);
            } catch (n4) {
              return c.call(this, t3, 0);
            }
          }
        }
        function o(t3) {
          if (u === clearTimeout) return clearTimeout(t3);
          if ((u === r2 || !u) && clearTimeout) return u = clearTimeout, clearTimeout(t3);
          try {
            return u(t3);
          } catch (n3) {
            try {
              return u.call(null, t3);
            } catch (n4) {
              return u.call(this, t3);
            }
          }
        }
        function i() {
          _ && f && (_ = false, f.length ? g = f.concat(g) : h = -1, g.length && d());
        }
        function d() {
          if (!_) {
            var e2 = a(i);
            _ = true;
            for (var t3 = g.length; t3; ) {
              for (f = g, g = []; ++h < t3; ) f && f[h].run();
              h = -1, t3 = g.length;
            }
            f = null, _ = false, o(e2);
          }
        }
        function s(e2, t3) {
          this.fun = e2, this.array = t3;
        }
        function l() {
        }
        var c, u, p = t2.exports = {};
        (function() {
          try {
            c = "function" == typeof setTimeout ? setTimeout : n2;
          } catch (t3) {
            c = n2;
          }
          try {
            u = "function" == typeof clearTimeout ? clearTimeout : r2;
          } catch (t3) {
            u = r2;
          }
        })();
        var f, g = [], _ = false, h = -1;
        p.nextTick = function(e2) {
          var t3 = Array(arguments.length - 1);
          if (1 < arguments.length) for (var n3 = 1; n3 < arguments.length; n3++) t3[n3 - 1] = arguments[n3];
          g.push(new s(e2, t3)), 1 !== g.length || _ || a(d);
        }, s.prototype.run = function() {
          this.fun.apply(null, this.array);
        }, p.title = "browser", p.browser = true, p.env = {}, p.argv = [], p.version = "", p.versions = {}, p.on = l, p.addListener = l, p.once = l, p.off = l, p.removeListener = l, p.removeAllListeners = l, p.emit = l, p.prependListener = l, p.prependOnceListener = l, p.listeners = function() {
          return [];
        }, p.binding = function() {
          throw new Error("process.binding is not supported");
        }, p.cwd = function() {
          return "/";
        }, p.chdir = function() {
          throw new Error("process.chdir is not supported");
        }, p.umask = function() {
          return 0;
        };
      }, {}], 13: [function(e, t2) {
        (function(e2) {
          (function() {
            let n2;
            t2.exports = "function" == typeof queueMicrotask ? queueMicrotask.bind("undefined" == typeof window ? e2 : window) : (e3) => (n2 || (n2 = Promise.resolve())).then(e3).catch((e4) => setTimeout(() => {
              throw e4;
            }, 0));
          }).call(this);
        }).call(this, "undefined" == typeof global ? "undefined" == typeof self ? "undefined" == typeof window ? {} : window : self : global);
      }, {}], 14: [function(e, t2) {
        (function(n2, r2) {
          (function() {
            "use strict";
            var a = e("safe-buffer").Buffer, o = r2.crypto || r2.msCrypto;
            t2.exports = o && o.getRandomValues ? function(e2, t3) {
              if (e2 > 4294967295) throw new RangeError("requested too many random bytes");
              var r3 = a.allocUnsafe(e2);
              if (0 < e2) if (65536 < e2) for (var i = 0; i < e2; i += 65536) o.getRandomValues(r3.slice(i, i + 65536));
              else o.getRandomValues(r3);
              return "function" == typeof t3 ? n2.nextTick(function() {
                t3(null, r3);
              }) : r3;
            } : function() {
              throw new Error("Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11");
            };
          }).call(this);
        }).call(this, e("_process"), "undefined" == typeof global ? "undefined" == typeof self ? "undefined" == typeof window ? {} : window : self : global);
      }, { _process: 12, "safe-buffer": 30 }], 15: [function(e, t2) {
        "use strict";
        function n2(e2, t3) {
          e2.prototype = Object.create(t3.prototype), e2.prototype.constructor = e2, e2.__proto__ = t3;
        }
        function r2(e2, t3, r3) {
          function a2(e3, n3, r4) {
            return "string" == typeof t3 ? t3 : t3(e3, n3, r4);
          }
          r3 || (r3 = Error);
          var o2 = (function(e3) {
            function t4(t5, n3, r4) {
              return e3.call(this, a2(t5, n3, r4)) || this;
            }
            return n2(t4, e3), t4;
          })(r3);
          o2.prototype.name = r3.name, o2.prototype.code = e2, s[e2] = o2;
        }
        function a(e2, t3) {
          if (Array.isArray(e2)) {
            var n3 = e2.length;
            return e2 = e2.map(function(e3) {
              return e3 + "";
            }), 2 < n3 ? "one of ".concat(t3, " ").concat(e2.slice(0, n3 - 1).join(", "), ", or ") + e2[n3 - 1] : 2 === n3 ? "one of ".concat(t3, " ").concat(e2[0], " or ").concat(e2[1]) : "of ".concat(t3, " ").concat(e2[0]);
          }
          return "of ".concat(t3, " ").concat(e2 + "");
        }
        function o(e2, t3, n3) {
          return e2.substr(!n3 || 0 > n3 ? 0 : +n3, t3.length) === t3;
        }
        function i(e2, t3, n3) {
          return (void 0 === n3 || n3 > e2.length) && (n3 = e2.length), e2.substring(n3 - t3.length, n3) === t3;
        }
        function d(e2, t3, n3) {
          return "number" != typeof n3 && (n3 = 0), !(n3 + t3.length > e2.length) && -1 !== e2.indexOf(t3, n3);
        }
        var s = {};
        r2("ERR_INVALID_OPT_VALUE", function(e2, t3) {
          return 'The value "' + t3 + '" is invalid for option "' + e2 + '"';
        }, TypeError), r2("ERR_INVALID_ARG_TYPE", function(e2, t3, n3) {
          var r3;
          "string" == typeof t3 && o(t3, "not ") ? (r3 = "must not be", t3 = t3.replace(/^not /, "")) : r3 = "must be";
          var s2;
          if (i(e2, " argument")) s2 = "The ".concat(e2, " ").concat(r3, " ").concat(a(t3, "type"));
          else {
            var l = d(e2, ".") ? "property" : "argument";
            s2 = 'The "'.concat(e2, '" ').concat(l, " ").concat(r3, " ").concat(a(t3, "type"));
          }
          return s2 += ". Received type ".concat(typeof n3), s2;
        }, TypeError), r2("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF"), r2("ERR_METHOD_NOT_IMPLEMENTED", function(e2) {
          return "The " + e2 + " method is not implemented";
        }), r2("ERR_STREAM_PREMATURE_CLOSE", "Premature close"), r2("ERR_STREAM_DESTROYED", function(e2) {
          return "Cannot call " + e2 + " after a stream was destroyed";
        }), r2("ERR_MULTIPLE_CALLBACK", "Callback called multiple times"), r2("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable"), r2("ERR_STREAM_WRITE_AFTER_END", "write after end"), r2("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError), r2("ERR_UNKNOWN_ENCODING", function(e2) {
          return "Unknown encoding: " + e2;
        }, TypeError), r2("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event"), t2.exports.codes = s;
      }, {}], 16: [function(e, t2) {
        (function(n2) {
          (function() {
            "use strict";
            function r2(e2) {
              return this instanceof r2 ? void (d.call(this, e2), s.call(this, e2), this.allowHalfOpen = true, e2 && (false === e2.readable && (this.readable = false), false === e2.writable && (this.writable = false), false === e2.allowHalfOpen && (this.allowHalfOpen = false, this.once("end", a)))) : new r2(e2);
            }
            function a() {
              this._writableState.ended || n2.nextTick(o, this);
            }
            function o(e2) {
              e2.end();
            }
            var i = Object.keys || function(e2) {
              var t3 = [];
              for (var n3 in e2) t3.push(n3);
              return t3;
            };
            t2.exports = r2;
            var d = e("./_stream_readable"), s = e("./_stream_writable");
            e("inherits")(r2, d);
            for (var l, c = i(s.prototype), u = 0; u < c.length; u++) l = c[u], r2.prototype[l] || (r2.prototype[l] = s.prototype[l]);
            Object.defineProperty(r2.prototype, "writableHighWaterMark", { enumerable: false, get: function() {
              return this._writableState.highWaterMark;
            } }), Object.defineProperty(r2.prototype, "writableBuffer", { enumerable: false, get: function() {
              return this._writableState && this._writableState.getBuffer();
            } }), Object.defineProperty(r2.prototype, "writableLength", { enumerable: false, get: function() {
              return this._writableState.length;
            } }), Object.defineProperty(r2.prototype, "destroyed", { enumerable: false, get: function() {
              return void 0 !== this._readableState && void 0 !== this._writableState && this._readableState.destroyed && this._writableState.destroyed;
            }, set: function(e2) {
              void 0 === this._readableState || void 0 === this._writableState || (this._readableState.destroyed = e2, this._writableState.destroyed = e2);
            } });
          }).call(this);
        }).call(this, e("_process"));
      }, { "./_stream_readable": 18, "./_stream_writable": 20, _process: 12, inherits: 10 }], 17: [function(e, t2) {
        "use strict";
        function n2(e2) {
          return this instanceof n2 ? void r2.call(this, e2) : new n2(e2);
        }
        t2.exports = n2;
        var r2 = e("./_stream_transform");
        e("inherits")(n2, r2), n2.prototype._transform = function(e2, t3, n3) {
          n3(null, e2);
        };
      }, { "./_stream_transform": 19, inherits: 10 }], 18: [function(e, t2) {
        (function(n2, r2) {
          (function() {
            "use strict";
            function a(e2) {
              return P.from(e2);
            }
            function o(e2) {
              return P.isBuffer(e2) || e2 instanceof M;
            }
            function i(e2, t3, n3) {
              return "function" == typeof e2.prependListener ? e2.prependListener(t3, n3) : void (e2._events && e2._events[t3] ? Array.isArray(e2._events[t3]) ? e2._events[t3].unshift(n3) : e2._events[t3] = [n3, e2._events[t3]] : e2.on(t3, n3));
            }
            function d(t3, n3, r3) {
              A = A || e("./_stream_duplex"), t3 = t3 || {}, "boolean" != typeof r3 && (r3 = n3 instanceof A), this.objectMode = !!t3.objectMode, r3 && (this.objectMode = this.objectMode || !!t3.readableObjectMode), this.highWaterMark = H(this, t3, "readableHighWaterMark", r3), this.buffer = new j(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = false, this.endEmitted = false, this.reading = false, this.sync = true, this.needReadable = false, this.emittedReadable = false, this.readableListening = false, this.resumeScheduled = false, this.paused = true, this.emitClose = false !== t3.emitClose, this.autoDestroy = !!t3.autoDestroy, this.destroyed = false, this.defaultEncoding = t3.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = false, this.decoder = null, this.encoding = null, t3.encoding && (!F && (F = e("string_decoder/").StringDecoder), this.decoder = new F(t3.encoding), this.encoding = t3.encoding);
            }
            function s(t3) {
              if (A = A || e("./_stream_duplex"), !(this instanceof s)) return new s(t3);
              var n3 = this instanceof A;
              this._readableState = new d(t3, this, n3), this.readable = true, t3 && ("function" == typeof t3.read && (this._read = t3.read), "function" == typeof t3.destroy && (this._destroy = t3.destroy)), I.call(this);
            }
            function l(e2, t3, n3, r3, o2) {
              x("readableAddChunk", t3);
              var i2 = e2._readableState;
              if (null === t3) i2.reading = false, g(e2, i2);
              else {
                var d2;
                if (o2 || (d2 = u(i2, t3)), d2) X(e2, d2);
                else if (!(i2.objectMode || t3 && 0 < t3.length)) r3 || (i2.reading = false, m(e2, i2));
                else if ("string" == typeof t3 || i2.objectMode || Object.getPrototypeOf(t3) === P.prototype || (t3 = a(t3)), r3) i2.endEmitted ? X(e2, new K()) : c(e2, i2, t3, true);
                else if (i2.ended) X(e2, new z());
                else {
                  if (i2.destroyed) return false;
                  i2.reading = false, i2.decoder && !n3 ? (t3 = i2.decoder.write(t3), i2.objectMode || 0 !== t3.length ? c(e2, i2, t3, false) : m(e2, i2)) : c(e2, i2, t3, false);
                }
              }
              return !i2.ended && (i2.length < i2.highWaterMark || 0 === i2.length);
            }
            function c(e2, t3, n3, r3) {
              t3.flowing && 0 === t3.length && !t3.sync ? (t3.awaitDrain = 0, e2.emit("data", n3)) : (t3.length += t3.objectMode ? 1 : n3.length, r3 ? t3.buffer.unshift(n3) : t3.buffer.push(n3), t3.needReadable && _(e2)), m(e2, t3);
            }
            function u(e2, t3) {
              var n3;
              return o(t3) || "string" == typeof t3 || void 0 === t3 || e2.objectMode || (n3 = new V("chunk", ["string", "Buffer", "Uint8Array"], t3)), n3;
            }
            function p(e2) {
              return 1073741824 <= e2 ? e2 = 1073741824 : (e2--, e2 |= e2 >>> 1, e2 |= e2 >>> 2, e2 |= e2 >>> 4, e2 |= e2 >>> 8, e2 |= e2 >>> 16, e2++), e2;
            }
            function f(e2, t3) {
              return 0 >= e2 || 0 === t3.length && t3.ended ? 0 : t3.objectMode ? 1 : e2 === e2 ? (e2 > t3.highWaterMark && (t3.highWaterMark = p(e2)), e2 <= t3.length ? e2 : t3.ended ? t3.length : (t3.needReadable = true, 0)) : t3.flowing && t3.length ? t3.buffer.head.data.length : t3.length;
            }
            function g(e2, t3) {
              if (x("onEofChunk"), !t3.ended) {
                if (t3.decoder) {
                  var n3 = t3.decoder.end();
                  n3 && n3.length && (t3.buffer.push(n3), t3.length += t3.objectMode ? 1 : n3.length);
                }
                t3.ended = true, t3.sync ? _(e2) : (t3.needReadable = false, !t3.emittedReadable && (t3.emittedReadable = true, h(e2)));
              }
            }
            function _(e2) {
              var t3 = e2._readableState;
              x("emitReadable", t3.needReadable, t3.emittedReadable), t3.needReadable = false, t3.emittedReadable || (x("emitReadable", t3.flowing), t3.emittedReadable = true, n2.nextTick(h, e2));
            }
            function h(e2) {
              var t3 = e2._readableState;
              x("emitReadable_", t3.destroyed, t3.length, t3.ended), !t3.destroyed && (t3.length || t3.ended) && (e2.emit("readable"), t3.emittedReadable = false), t3.needReadable = !t3.flowing && !t3.ended && t3.length <= t3.highWaterMark, S(e2);
            }
            function m(e2, t3) {
              t3.readingMore || (t3.readingMore = true, n2.nextTick(b, e2, t3));
            }
            function b(e2, t3) {
              for (; !t3.reading && !t3.ended && (t3.length < t3.highWaterMark || t3.flowing && 0 === t3.length); ) {
                var n3 = t3.length;
                if (x("maybeReadMore read 0"), e2.read(0), n3 === t3.length) break;
              }
              t3.readingMore = false;
            }
            function y(e2) {
              return function() {
                var t3 = e2._readableState;
                x("pipeOnDrain", t3.awaitDrain), t3.awaitDrain && t3.awaitDrain--, 0 === t3.awaitDrain && D(e2, "data") && (t3.flowing = true, S(e2));
              };
            }
            function C(e2) {
              var t3 = e2._readableState;
              t3.readableListening = 0 < e2.listenerCount("readable"), t3.resumeScheduled && !t3.paused ? t3.flowing = true : 0 < e2.listenerCount("data") && e2.resume();
            }
            function R(e2) {
              x("readable nexttick read 0"), e2.read(0);
            }
            function E(e2, t3) {
              t3.resumeScheduled || (t3.resumeScheduled = true, n2.nextTick(w, e2, t3));
            }
            function w(e2, t3) {
              x("resume", t3.reading), t3.reading || e2.read(0), t3.resumeScheduled = false, e2.emit("resume"), S(e2), t3.flowing && !t3.reading && e2.read(0);
            }
            function S(e2) {
              var t3 = e2._readableState;
              for (x("flow", t3.flowing); t3.flowing && null !== e2.read(); ) ;
            }
            function T(e2, t3) {
              if (0 === t3.length) return null;
              var n3;
              return t3.objectMode ? n3 = t3.buffer.shift() : !e2 || e2 >= t3.length ? (n3 = t3.decoder ? t3.buffer.join("") : 1 === t3.buffer.length ? t3.buffer.first() : t3.buffer.concat(t3.length), t3.buffer.clear()) : n3 = t3.buffer.consume(e2, t3.decoder), n3;
            }
            function v(e2) {
              var t3 = e2._readableState;
              x("endReadable", t3.endEmitted), t3.endEmitted || (t3.ended = true, n2.nextTick(k, t3, e2));
            }
            function k(e2, t3) {
              if (x("endReadableNT", e2.endEmitted, e2.length), !e2.endEmitted && 0 === e2.length && (e2.endEmitted = true, t3.readable = false, t3.emit("end"), e2.autoDestroy)) {
                var n3 = t3._writableState;
                (!n3 || n3.autoDestroy && n3.finished) && t3.destroy();
              }
            }
            function L(e2, t3) {
              for (var n3 = 0, r3 = e2.length; n3 < r3; n3++) if (e2[n3] === t3) return n3;
              return -1;
            }
            t2.exports = s;
            var A;
            s.ReadableState = d;
            var x, N = e("events").EventEmitter, D = function(e2, t3) {
              return e2.listeners(t3).length;
            }, I = e("./internal/streams/stream"), P = e("buffer").Buffer, M = r2.Uint8Array || function() {
            }, O = e("util");
            x = O && O.debuglog ? O.debuglog("stream") : function() {
            };
            var F, B, U, j = e("./internal/streams/buffer_list"), q = e("./internal/streams/destroy"), W = e("./internal/streams/state"), H = W.getHighWaterMark, Y4 = e("../errors").codes, V = Y4.ERR_INVALID_ARG_TYPE, z = Y4.ERR_STREAM_PUSH_AFTER_EOF, G = Y4.ERR_METHOD_NOT_IMPLEMENTED, K = Y4.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
            e("inherits")(s, I);
            var X = q.errorOrDestroy, $2 = ["error", "close", "destroy", "pause", "resume"];
            Object.defineProperty(s.prototype, "destroyed", { enumerable: false, get: function() {
              return void 0 !== this._readableState && this._readableState.destroyed;
            }, set: function(e2) {
              this._readableState && (this._readableState.destroyed = e2);
            } }), s.prototype.destroy = q.destroy, s.prototype._undestroy = q.undestroy, s.prototype._destroy = function(e2, t3) {
              t3(e2);
            }, s.prototype.push = function(e2, t3) {
              var n3, r3 = this._readableState;
              return r3.objectMode ? n3 = true : "string" == typeof e2 && (t3 = t3 || r3.defaultEncoding, t3 !== r3.encoding && (e2 = P.from(e2, t3), t3 = ""), n3 = true), l(this, e2, t3, false, n3);
            }, s.prototype.unshift = function(e2) {
              return l(this, e2, null, true, false);
            }, s.prototype.isPaused = function() {
              return false === this._readableState.flowing;
            }, s.prototype.setEncoding = function(t3) {
              F || (F = e("string_decoder/").StringDecoder);
              var n3 = new F(t3);
              this._readableState.decoder = n3, this._readableState.encoding = this._readableState.decoder.encoding;
              for (var r3 = this._readableState.buffer.head, a2 = ""; null !== r3; ) a2 += n3.write(r3.data), r3 = r3.next;
              return this._readableState.buffer.clear(), "" !== a2 && this._readableState.buffer.push(a2), this._readableState.length = a2.length, this;
            };
            s.prototype.read = function(e2) {
              x("read", e2), e2 = parseInt(e2, 10);
              var t3 = this._readableState, r3 = e2;
              if (0 !== e2 && (t3.emittedReadable = false), 0 === e2 && t3.needReadable && ((0 === t3.highWaterMark ? 0 < t3.length : t3.length >= t3.highWaterMark) || t3.ended)) return x("read: emitReadable", t3.length, t3.ended), 0 === t3.length && t3.ended ? v(this) : _(this), null;
              if (e2 = f(e2, t3), 0 === e2 && t3.ended) return 0 === t3.length && v(this), null;
              var a2 = t3.needReadable;
              x("need readable", a2), (0 === t3.length || t3.length - e2 < t3.highWaterMark) && (a2 = true, x("length less than watermark", a2)), t3.ended || t3.reading ? (a2 = false, x("reading or ended", a2)) : a2 && (x("do read"), t3.reading = true, t3.sync = true, 0 === t3.length && (t3.needReadable = true), this._read(t3.highWaterMark), t3.sync = false, !t3.reading && (e2 = f(r3, t3)));
              var o2;
              return o2 = 0 < e2 ? T(e2, t3) : null, null === o2 ? (t3.needReadable = t3.length <= t3.highWaterMark, e2 = 0) : (t3.length -= e2, t3.awaitDrain = 0), 0 === t3.length && (!t3.ended && (t3.needReadable = true), r3 !== e2 && t3.ended && v(this)), null !== o2 && this.emit("data", o2), o2;
            }, s.prototype._read = function() {
              X(this, new G("_read()"));
            }, s.prototype.pipe = function(e2, t3) {
              function r3(e3, t4) {
                x("onunpipe"), e3 === p2 && t4 && false === t4.hasUnpiped && (t4.hasUnpiped = true, o2());
              }
              function a2() {
                x("onend"), e2.end();
              }
              function o2() {
                x("cleanup"), e2.removeListener("close", l2), e2.removeListener("finish", c2), e2.removeListener("drain", h2), e2.removeListener("error", s2), e2.removeListener("unpipe", r3), p2.removeListener("end", a2), p2.removeListener("end", u2), p2.removeListener("data", d2), m2 = true, f2.awaitDrain && (!e2._writableState || e2._writableState.needDrain) && h2();
              }
              function d2(t4) {
                x("ondata");
                var n3 = e2.write(t4);
                x("dest.write", n3), false === n3 && ((1 === f2.pipesCount && f2.pipes === e2 || 1 < f2.pipesCount && -1 !== L(f2.pipes, e2)) && !m2 && (x("false write response, pause", f2.awaitDrain), f2.awaitDrain++), p2.pause());
              }
              function s2(t4) {
                x("onerror", t4), u2(), e2.removeListener("error", s2), 0 === D(e2, "error") && X(e2, t4);
              }
              function l2() {
                e2.removeListener("finish", c2), u2();
              }
              function c2() {
                x("onfinish"), e2.removeListener("close", l2), u2();
              }
              function u2() {
                x("unpipe"), p2.unpipe(e2);
              }
              var p2 = this, f2 = this._readableState;
              switch (f2.pipesCount) {
                case 0:
                  f2.pipes = e2;
                  break;
                case 1:
                  f2.pipes = [f2.pipes, e2];
                  break;
                default:
                  f2.pipes.push(e2);
              }
              f2.pipesCount += 1, x("pipe count=%d opts=%j", f2.pipesCount, t3);
              var g2 = (!t3 || false !== t3.end) && e2 !== n2.stdout && e2 !== n2.stderr, _2 = g2 ? a2 : u2;
              f2.endEmitted ? n2.nextTick(_2) : p2.once("end", _2), e2.on("unpipe", r3);
              var h2 = y(p2);
              e2.on("drain", h2);
              var m2 = false;
              return p2.on("data", d2), i(e2, "error", s2), e2.once("close", l2), e2.once("finish", c2), e2.emit("pipe", p2), f2.flowing || (x("pipe resume"), p2.resume()), e2;
            }, s.prototype.unpipe = function(e2) {
              var t3 = this._readableState, n3 = { hasUnpiped: false };
              if (0 === t3.pipesCount) return this;
              if (1 === t3.pipesCount) return e2 && e2 !== t3.pipes ? this : (e2 || (e2 = t3.pipes), t3.pipes = null, t3.pipesCount = 0, t3.flowing = false, e2 && e2.emit("unpipe", this, n3), this);
              if (!e2) {
                var r3 = t3.pipes, a2 = t3.pipesCount;
                t3.pipes = null, t3.pipesCount = 0, t3.flowing = false;
                for (var o2 = 0; o2 < a2; o2++) r3[o2].emit("unpipe", this, { hasUnpiped: false });
                return this;
              }
              var d2 = L(t3.pipes, e2);
              return -1 === d2 ? this : (t3.pipes.splice(d2, 1), t3.pipesCount -= 1, 1 === t3.pipesCount && (t3.pipes = t3.pipes[0]), e2.emit("unpipe", this, n3), this);
            }, s.prototype.on = function(e2, t3) {
              var r3 = I.prototype.on.call(this, e2, t3), a2 = this._readableState;
              return "data" === e2 ? (a2.readableListening = 0 < this.listenerCount("readable"), false !== a2.flowing && this.resume()) : "readable" == e2 && !a2.endEmitted && !a2.readableListening && (a2.readableListening = a2.needReadable = true, a2.flowing = false, a2.emittedReadable = false, x("on readable", a2.length, a2.reading), a2.length ? _(this) : !a2.reading && n2.nextTick(R, this)), r3;
            }, s.prototype.addListener = s.prototype.on, s.prototype.removeListener = function(e2, t3) {
              var r3 = I.prototype.removeListener.call(this, e2, t3);
              return "readable" === e2 && n2.nextTick(C, this), r3;
            }, s.prototype.removeAllListeners = function(e2) {
              var t3 = I.prototype.removeAllListeners.apply(this, arguments);
              return ("readable" === e2 || void 0 === e2) && n2.nextTick(C, this), t3;
            }, s.prototype.resume = function() {
              var e2 = this._readableState;
              return e2.flowing || (x("resume"), e2.flowing = !e2.readableListening, E(this, e2)), e2.paused = false, this;
            }, s.prototype.pause = function() {
              return x("call pause flowing=%j", this._readableState.flowing), false !== this._readableState.flowing && (x("pause"), this._readableState.flowing = false, this.emit("pause")), this._readableState.paused = true, this;
            }, s.prototype.wrap = function(e2) {
              var t3 = this, r3 = this._readableState, a2 = false;
              for (var o2 in e2.on("end", function() {
                if (x("wrapped end"), r3.decoder && !r3.ended) {
                  var e3 = r3.decoder.end();
                  e3 && e3.length && t3.push(e3);
                }
                t3.push(null);
              }), e2.on("data", function(n3) {
                if ((x("wrapped data"), r3.decoder && (n3 = r3.decoder.write(n3)), !(r3.objectMode && (null === n3 || void 0 === n3))) && (r3.objectMode || n3 && n3.length)) {
                  var o3 = t3.push(n3);
                  o3 || (a2 = true, e2.pause());
                }
              }), e2) void 0 === this[o2] && "function" == typeof e2[o2] && (this[o2] = /* @__PURE__ */ (function(t4) {
                return function() {
                  return e2[t4].apply(e2, arguments);
                };
              })(o2));
              for (var i2 = 0; i2 < $2.length; i2++) e2.on($2[i2], this.emit.bind(this, $2[i2]));
              return this._read = function(t4) {
                x("wrapped _read", t4), a2 && (a2 = false, e2.resume());
              }, this;
            }, "function" == typeof Symbol && (s.prototype[Symbol.asyncIterator] = function() {
              return void 0 === B && (B = e("./internal/streams/async_iterator")), B(this);
            }), Object.defineProperty(s.prototype, "readableHighWaterMark", { enumerable: false, get: function() {
              return this._readableState.highWaterMark;
            } }), Object.defineProperty(s.prototype, "readableBuffer", { enumerable: false, get: function() {
              return this._readableState && this._readableState.buffer;
            } }), Object.defineProperty(s.prototype, "readableFlowing", { enumerable: false, get: function() {
              return this._readableState.flowing;
            }, set: function(e2) {
              this._readableState && (this._readableState.flowing = e2);
            } }), s._fromList = T, Object.defineProperty(s.prototype, "readableLength", { enumerable: false, get: function() {
              return this._readableState.length;
            } }), "function" == typeof Symbol && (s.from = function(t3, n3) {
              return void 0 === U && (U = e("./internal/streams/from")), U(s, t3, n3);
            });
          }).call(this);
        }).call(this, e("_process"), "undefined" == typeof global ? "undefined" == typeof self ? "undefined" == typeof window ? {} : window : self : global);
      }, { "../errors": 15, "./_stream_duplex": 16, "./internal/streams/async_iterator": 21, "./internal/streams/buffer_list": 22, "./internal/streams/destroy": 23, "./internal/streams/from": 25, "./internal/streams/state": 27, "./internal/streams/stream": 28, _process: 12, buffer: 3, events: 7, inherits: 10, "string_decoder/": 31, util: 2 }], 19: [function(e, t2) {
        "use strict";
        function n2(e2, t3) {
          var n3 = this._transformState;
          n3.transforming = false;
          var r3 = n3.writecb;
          if (null === r3) return this.emit("error", new s());
          n3.writechunk = null, n3.writecb = null, null != t3 && this.push(t3), r3(e2);
          var a2 = this._readableState;
          a2.reading = false, (a2.needReadable || a2.length < a2.highWaterMark) && this._read(a2.highWaterMark);
        }
        function r2(e2) {
          return this instanceof r2 ? void (u.call(this, e2), this._transformState = { afterTransform: n2.bind(this), needTransform: false, transforming: false, writecb: null, writechunk: null, writeencoding: null }, this._readableState.needReadable = true, this._readableState.sync = false, e2 && ("function" == typeof e2.transform && (this._transform = e2.transform), "function" == typeof e2.flush && (this._flush = e2.flush)), this.on("prefinish", a)) : new r2(e2);
        }
        function a() {
          var e2 = this;
          "function" != typeof this._flush || this._readableState.destroyed ? o(this, null, null) : this._flush(function(t3, n3) {
            o(e2, t3, n3);
          });
        }
        function o(e2, t3, n3) {
          if (t3) return e2.emit("error", t3);
          if (null != n3 && e2.push(n3), e2._writableState.length) throw new c();
          if (e2._transformState.transforming) throw new l();
          return e2.push(null);
        }
        t2.exports = r2;
        var i = e("../errors").codes, d = i.ERR_METHOD_NOT_IMPLEMENTED, s = i.ERR_MULTIPLE_CALLBACK, l = i.ERR_TRANSFORM_ALREADY_TRANSFORMING, c = i.ERR_TRANSFORM_WITH_LENGTH_0, u = e("./_stream_duplex");
        e("inherits")(r2, u), r2.prototype.push = function(e2, t3) {
          return this._transformState.needTransform = false, u.prototype.push.call(this, e2, t3);
        }, r2.prototype._transform = function(e2, t3, n3) {
          n3(new d("_transform()"));
        }, r2.prototype._write = function(e2, t3, n3) {
          var r3 = this._transformState;
          if (r3.writecb = n3, r3.writechunk = e2, r3.writeencoding = t3, !r3.transforming) {
            var a2 = this._readableState;
            (r3.needTransform || a2.needReadable || a2.length < a2.highWaterMark) && this._read(a2.highWaterMark);
          }
        }, r2.prototype._read = function() {
          var e2 = this._transformState;
          null === e2.writechunk || e2.transforming ? e2.needTransform = true : (e2.transforming = true, this._transform(e2.writechunk, e2.writeencoding, e2.afterTransform));
        }, r2.prototype._destroy = function(e2, t3) {
          u.prototype._destroy.call(this, e2, function(e3) {
            t3(e3);
          });
        };
      }, { "../errors": 15, "./_stream_duplex": 16, inherits: 10 }], 20: [function(e, t2) {
        (function(n2, r2) {
          (function() {
            "use strict";
            function a(e2) {
              var t3 = this;
              this.next = null, this.entry = null, this.finish = function() {
                v(t3, e2);
              };
            }
            function o(e2) {
              return x.from(e2);
            }
            function i(e2) {
              return x.isBuffer(e2) || e2 instanceof N;
            }
            function d() {
            }
            function s(t3, n3, r3) {
              k = k || e("./_stream_duplex"), t3 = t3 || {}, "boolean" != typeof r3 && (r3 = n3 instanceof k), this.objectMode = !!t3.objectMode, r3 && (this.objectMode = this.objectMode || !!t3.writableObjectMode), this.highWaterMark = P(this, t3, "writableHighWaterMark", r3), this.finalCalled = false, this.needDrain = false, this.ending = false, this.ended = false, this.finished = false, this.destroyed = false;
              var o2 = false === t3.decodeStrings;
              this.decodeStrings = !o2, this.defaultEncoding = t3.defaultEncoding || "utf8", this.length = 0, this.writing = false, this.corked = 0, this.sync = true, this.bufferProcessing = false, this.onwrite = function(e2) {
                m(n3, e2);
              }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = false, this.errorEmitted = false, this.emitClose = false !== t3.emitClose, this.autoDestroy = !!t3.autoDestroy, this.bufferedRequestCount = 0, this.corkedRequestsFree = new a(this);
            }
            function l(t3) {
              k = k || e("./_stream_duplex");
              var n3 = this instanceof k;
              return n3 || V.call(l, this) ? void (this._writableState = new s(t3, this, n3), this.writable = true, t3 && ("function" == typeof t3.write && (this._write = t3.write), "function" == typeof t3.writev && (this._writev = t3.writev), "function" == typeof t3.destroy && (this._destroy = t3.destroy), "function" == typeof t3.final && (this._final = t3.final)), A.call(this)) : new l(t3);
            }
            function c(e2, t3) {
              var r3 = new W();
              Y4(e2, r3), n2.nextTick(t3, r3);
            }
            function u(e2, t3, r3, a2) {
              var o2;
              return null === r3 ? o2 = new q() : "string" != typeof r3 && !t3.objectMode && (o2 = new O("chunk", ["string", "Buffer"], r3)), !o2 || (Y4(e2, o2), n2.nextTick(a2, o2), false);
            }
            function p(e2, t3, n3) {
              return e2.objectMode || false === e2.decodeStrings || "string" != typeof t3 || (t3 = x.from(t3, n3)), t3;
            }
            function f(e2, t3, n3, r3, a2, o2) {
              if (!n3) {
                var i2 = p(t3, r3, a2);
                r3 !== i2 && (n3 = true, a2 = "buffer", r3 = i2);
              }
              var d2 = t3.objectMode ? 1 : r3.length;
              t3.length += d2;
              var s2 = t3.length < t3.highWaterMark;
              if (s2 || (t3.needDrain = true), t3.writing || t3.corked) {
                var l2 = t3.lastBufferedRequest;
                t3.lastBufferedRequest = { chunk: r3, encoding: a2, isBuf: n3, callback: o2, next: null }, l2 ? l2.next = t3.lastBufferedRequest : t3.bufferedRequest = t3.lastBufferedRequest, t3.bufferedRequestCount += 1;
              } else g(e2, t3, false, d2, r3, a2, o2);
              return s2;
            }
            function g(e2, t3, n3, r3, a2, o2, i2) {
              t3.writelen = r3, t3.writecb = i2, t3.writing = true, t3.sync = true, t3.destroyed ? t3.onwrite(new j("write")) : n3 ? e2._writev(a2, t3.onwrite) : e2._write(a2, o2, t3.onwrite), t3.sync = false;
            }
            function _(e2, t3, r3, a2, o2) {
              --t3.pendingcb, r3 ? (n2.nextTick(o2, a2), n2.nextTick(S, e2, t3), e2._writableState.errorEmitted = true, Y4(e2, a2)) : (o2(a2), e2._writableState.errorEmitted = true, Y4(e2, a2), S(e2, t3));
            }
            function h(e2) {
              e2.writing = false, e2.writecb = null, e2.length -= e2.writelen, e2.writelen = 0;
            }
            function m(e2, t3) {
              var r3 = e2._writableState, a2 = r3.sync, o2 = r3.writecb;
              if ("function" != typeof o2) throw new B();
              if (h(r3), t3) _(e2, r3, a2, t3, o2);
              else {
                var i2 = R(r3) || e2.destroyed;
                i2 || r3.corked || r3.bufferProcessing || !r3.bufferedRequest || C(e2, r3), a2 ? n2.nextTick(b, e2, r3, i2, o2) : b(e2, r3, i2, o2);
              }
            }
            function b(e2, t3, n3, r3) {
              n3 || y(e2, t3), t3.pendingcb--, r3(), S(e2, t3);
            }
            function y(e2, t3) {
              0 === t3.length && t3.needDrain && (t3.needDrain = false, e2.emit("drain"));
            }
            function C(e2, t3) {
              t3.bufferProcessing = true;
              var n3 = t3.bufferedRequest;
              if (e2._writev && n3 && n3.next) {
                var r3 = t3.bufferedRequestCount, o2 = Array(r3), i2 = t3.corkedRequestsFree;
                i2.entry = n3;
                for (var d2 = 0, s2 = true; n3; ) o2[d2] = n3, n3.isBuf || (s2 = false), n3 = n3.next, d2 += 1;
                o2.allBuffers = s2, g(e2, t3, true, t3.length, o2, "", i2.finish), t3.pendingcb++, t3.lastBufferedRequest = null, i2.next ? (t3.corkedRequestsFree = i2.next, i2.next = null) : t3.corkedRequestsFree = new a(t3), t3.bufferedRequestCount = 0;
              } else {
                for (; n3; ) {
                  var l2 = n3.chunk, c2 = n3.encoding, u2 = n3.callback, p2 = t3.objectMode ? 1 : l2.length;
                  if (g(e2, t3, false, p2, l2, c2, u2), n3 = n3.next, t3.bufferedRequestCount--, t3.writing) break;
                }
                null === n3 && (t3.lastBufferedRequest = null);
              }
              t3.bufferedRequest = n3, t3.bufferProcessing = false;
            }
            function R(e2) {
              return e2.ending && 0 === e2.length && null === e2.bufferedRequest && !e2.finished && !e2.writing;
            }
            function E(e2, t3) {
              e2._final(function(n3) {
                t3.pendingcb--, n3 && Y4(e2, n3), t3.prefinished = true, e2.emit("prefinish"), S(e2, t3);
              });
            }
            function w(e2, t3) {
              t3.prefinished || t3.finalCalled || ("function" != typeof e2._final || t3.destroyed ? (t3.prefinished = true, e2.emit("prefinish")) : (t3.pendingcb++, t3.finalCalled = true, n2.nextTick(E, e2, t3)));
            }
            function S(e2, t3) {
              var n3 = R(t3);
              if (n3 && (w(e2, t3), 0 === t3.pendingcb && (t3.finished = true, e2.emit("finish"), t3.autoDestroy))) {
                var r3 = e2._readableState;
                (!r3 || r3.autoDestroy && r3.endEmitted) && e2.destroy();
              }
              return n3;
            }
            function T(e2, t3, r3) {
              t3.ending = true, S(e2, t3), r3 && (t3.finished ? n2.nextTick(r3) : e2.once("finish", r3)), t3.ended = true, e2.writable = false;
            }
            function v(e2, t3, n3) {
              var r3 = e2.entry;
              for (e2.entry = null; r3; ) {
                var a2 = r3.callback;
                t3.pendingcb--, a2(n3), r3 = r3.next;
              }
              t3.corkedRequestsFree.next = e2;
            }
            t2.exports = l;
            var k;
            l.WritableState = s;
            var L = { deprecate: e("util-deprecate") }, A = e("./internal/streams/stream"), x = e("buffer").Buffer, N = r2.Uint8Array || function() {
            }, D = e("./internal/streams/destroy"), I = e("./internal/streams/state"), P = I.getHighWaterMark, M = e("../errors").codes, O = M.ERR_INVALID_ARG_TYPE, F = M.ERR_METHOD_NOT_IMPLEMENTED, B = M.ERR_MULTIPLE_CALLBACK, U = M.ERR_STREAM_CANNOT_PIPE, j = M.ERR_STREAM_DESTROYED, q = M.ERR_STREAM_NULL_VALUES, W = M.ERR_STREAM_WRITE_AFTER_END, H = M.ERR_UNKNOWN_ENCODING, Y4 = D.errorOrDestroy;
            e("inherits")(l, A), s.prototype.getBuffer = function() {
              for (var e2 = this.bufferedRequest, t3 = []; e2; ) t3.push(e2), e2 = e2.next;
              return t3;
            }, (function() {
              try {
                Object.defineProperty(s.prototype, "buffer", { get: L.deprecate(function() {
                  return this.getBuffer();
                }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003") });
              } catch (e2) {
              }
            })();
            var V;
            "function" == typeof Symbol && Symbol.hasInstance && "function" == typeof Function.prototype[Symbol.hasInstance] ? (V = Function.prototype[Symbol.hasInstance], Object.defineProperty(l, Symbol.hasInstance, { value: function(e2) {
              return !!V.call(this, e2) || !(this !== l) && e2 && e2._writableState instanceof s;
            } })) : V = function(e2) {
              return e2 instanceof this;
            }, l.prototype.pipe = function() {
              Y4(this, new U());
            }, l.prototype.write = function(e2, t3, n3) {
              var r3 = this._writableState, a2 = false, s2 = !r3.objectMode && i(e2);
              return s2 && !x.isBuffer(e2) && (e2 = o(e2)), "function" == typeof t3 && (n3 = t3, t3 = null), s2 ? t3 = "buffer" : !t3 && (t3 = r3.defaultEncoding), "function" != typeof n3 && (n3 = d), r3.ending ? c(this, n3) : (s2 || u(this, r3, e2, n3)) && (r3.pendingcb++, a2 = f(this, r3, s2, e2, t3, n3)), a2;
            }, l.prototype.cork = function() {
              this._writableState.corked++;
            }, l.prototype.uncork = function() {
              var e2 = this._writableState;
              e2.corked && (e2.corked--, !e2.writing && !e2.corked && !e2.bufferProcessing && e2.bufferedRequest && C(this, e2));
            }, l.prototype.setDefaultEncoding = function(e2) {
              if ("string" == typeof e2 && (e2 = e2.toLowerCase()), !(-1 < ["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((e2 + "").toLowerCase()))) throw new H(e2);
              return this._writableState.defaultEncoding = e2, this;
            }, Object.defineProperty(l.prototype, "writableBuffer", { enumerable: false, get: function() {
              return this._writableState && this._writableState.getBuffer();
            } }), Object.defineProperty(l.prototype, "writableHighWaterMark", { enumerable: false, get: function() {
              return this._writableState.highWaterMark;
            } }), l.prototype._write = function(e2, t3, n3) {
              n3(new F("_write()"));
            }, l.prototype._writev = null, l.prototype.end = function(e2, t3, n3) {
              var r3 = this._writableState;
              return "function" == typeof e2 ? (n3 = e2, e2 = null, t3 = null) : "function" == typeof t3 && (n3 = t3, t3 = null), null !== e2 && void 0 !== e2 && this.write(e2, t3), r3.corked && (r3.corked = 1, this.uncork()), r3.ending || T(this, r3, n3), this;
            }, Object.defineProperty(l.prototype, "writableLength", { enumerable: false, get: function() {
              return this._writableState.length;
            } }), Object.defineProperty(l.prototype, "destroyed", { enumerable: false, get: function() {
              return void 0 !== this._writableState && this._writableState.destroyed;
            }, set: function(e2) {
              this._writableState && (this._writableState.destroyed = e2);
            } }), l.prototype.destroy = D.destroy, l.prototype._undestroy = D.undestroy, l.prototype._destroy = function(e2, t3) {
              t3(e2);
            };
          }).call(this);
        }).call(this, e("_process"), "undefined" == typeof global ? "undefined" == typeof self ? "undefined" == typeof window ? {} : window : self : global);
      }, { "../errors": 15, "./_stream_duplex": 16, "./internal/streams/destroy": 23, "./internal/streams/state": 27, "./internal/streams/stream": 28, _process: 12, buffer: 3, inherits: 10, "util-deprecate": 32 }], 21: [function(e, t2) {
        (function(n2) {
          (function() {
            "use strict";
            function r2(e2, t3, n3) {
              return t3 in e2 ? Object.defineProperty(e2, t3, { value: n3, enumerable: true, configurable: true, writable: true }) : e2[t3] = n3, e2;
            }
            function a(e2, t3) {
              return { value: e2, done: t3 };
            }
            function o(e2) {
              var t3 = e2[c];
              if (null !== t3) {
                var n3 = e2[h].read();
                null !== n3 && (e2[g] = null, e2[c] = null, e2[u] = null, t3(a(n3, false)));
              }
            }
            function i(e2) {
              n2.nextTick(o, e2);
            }
            function d(e2, t3) {
              return function(n3, r3) {
                e2.then(function() {
                  return t3[f] ? void n3(a(void 0, true)) : void t3[_](n3, r3);
                }, r3);
              };
            }
            var s, l = e("./end-of-stream"), c = /* @__PURE__ */ Symbol("lastResolve"), u = /* @__PURE__ */ Symbol("lastReject"), p = /* @__PURE__ */ Symbol("error"), f = /* @__PURE__ */ Symbol("ended"), g = /* @__PURE__ */ Symbol("lastPromise"), _ = /* @__PURE__ */ Symbol("handlePromise"), h = /* @__PURE__ */ Symbol("stream"), m = Object.getPrototypeOf(function() {
            }), b = Object.setPrototypeOf((s = { get stream() {
              return this[h];
            }, next: function() {
              var e2 = this, t3 = this[p];
              if (null !== t3) return Promise.reject(t3);
              if (this[f]) return Promise.resolve(a(void 0, true));
              if (this[h].destroyed) return new Promise(function(t4, r4) {
                n2.nextTick(function() {
                  e2[p] ? r4(e2[p]) : t4(a(void 0, true));
                });
              });
              var r3, o2 = this[g];
              if (o2) r3 = new Promise(d(o2, this));
              else {
                var i2 = this[h].read();
                if (null !== i2) return Promise.resolve(a(i2, false));
                r3 = new Promise(this[_]);
              }
              return this[g] = r3, r3;
            } }, r2(s, Symbol.asyncIterator, function() {
              return this;
            }), r2(s, "return", function() {
              var e2 = this;
              return new Promise(function(t3, n3) {
                e2[h].destroy(null, function(e3) {
                  return e3 ? void n3(e3) : void t3(a(void 0, true));
                });
              });
            }), s), m);
            t2.exports = function(e2) {
              var t3, n3 = Object.create(b, (t3 = {}, r2(t3, h, { value: e2, writable: true }), r2(t3, c, { value: null, writable: true }), r2(t3, u, { value: null, writable: true }), r2(t3, p, { value: null, writable: true }), r2(t3, f, { value: e2._readableState.endEmitted, writable: true }), r2(t3, _, { value: function(e3, t4) {
                var r3 = n3[h].read();
                r3 ? (n3[g] = null, n3[c] = null, n3[u] = null, e3(a(r3, false))) : (n3[c] = e3, n3[u] = t4);
              }, writable: true }), t3));
              return n3[g] = null, l(e2, function(e3) {
                if (e3 && "ERR_STREAM_PREMATURE_CLOSE" !== e3.code) {
                  var t4 = n3[u];
                  return null !== t4 && (n3[g] = null, n3[c] = null, n3[u] = null, t4(e3)), void (n3[p] = e3);
                }
                var r3 = n3[c];
                null !== r3 && (n3[g] = null, n3[c] = null, n3[u] = null, r3(a(void 0, true))), n3[f] = true;
              }), e2.on("readable", i.bind(null, n3)), n3;
            };
          }).call(this);
        }).call(this, e("_process"));
      }, { "./end-of-stream": 24, _process: 12 }], 22: [function(e, t2) {
        "use strict";
        function n2(e2, t3) {
          var n3 = Object.keys(e2);
          if (Object.getOwnPropertySymbols) {
            var r3 = Object.getOwnPropertySymbols(e2);
            t3 && (r3 = r3.filter(function(t4) {
              return Object.getOwnPropertyDescriptor(e2, t4).enumerable;
            })), n3.push.apply(n3, r3);
          }
          return n3;
        }
        function r2(e2) {
          for (var t3, r3 = 1; r3 < arguments.length; r3++) t3 = null == arguments[r3] ? {} : arguments[r3], r3 % 2 ? n2(Object(t3), true).forEach(function(n3) {
            a(e2, n3, t3[n3]);
          }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(t3)) : n2(Object(t3)).forEach(function(n3) {
            Object.defineProperty(e2, n3, Object.getOwnPropertyDescriptor(t3, n3));
          });
          return e2;
        }
        function a(e2, t3, n3) {
          return t3 in e2 ? Object.defineProperty(e2, t3, { value: n3, enumerable: true, configurable: true, writable: true }) : e2[t3] = n3, e2;
        }
        function o(e2, t3) {
          if (!(e2 instanceof t3)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e2, t3) {
          for (var n3, r3 = 0; r3 < t3.length; r3++) n3 = t3[r3], n3.enumerable = n3.enumerable || false, n3.configurable = true, "value" in n3 && (n3.writable = true), Object.defineProperty(e2, n3.key, n3);
        }
        function d(e2, t3, n3) {
          return t3 && i(e2.prototype, t3), n3 && i(e2, n3), e2;
        }
        function s(e2, t3, n3) {
          u.prototype.copy.call(e2, t3, n3);
        }
        var l = e("buffer"), u = l.Buffer, p = e("util"), f = p.inspect, g = f && f.custom || "inspect";
        t2.exports = (function() {
          function e2() {
            o(this, e2), this.head = null, this.tail = null, this.length = 0;
          }
          return d(e2, [{ key: "push", value: function(e3) {
            var t3 = { data: e3, next: null };
            0 < this.length ? this.tail.next = t3 : this.head = t3, this.tail = t3, ++this.length;
          } }, { key: "unshift", value: function(e3) {
            var t3 = { data: e3, next: this.head };
            0 === this.length && (this.tail = t3), this.head = t3, ++this.length;
          } }, { key: "shift", value: function() {
            if (0 !== this.length) {
              var e3 = this.head.data;
              return this.head = 1 === this.length ? this.tail = null : this.head.next, --this.length, e3;
            }
          } }, { key: "clear", value: function() {
            this.head = this.tail = null, this.length = 0;
          } }, { key: "join", value: function(e3) {
            if (0 === this.length) return "";
            for (var t3 = this.head, n3 = "" + t3.data; t3 = t3.next; ) n3 += e3 + t3.data;
            return n3;
          } }, { key: "concat", value: function(e3) {
            if (0 === this.length) return u.alloc(0);
            for (var t3 = u.allocUnsafe(e3 >>> 0), n3 = this.head, r3 = 0; n3; ) s(n3.data, t3, r3), r3 += n3.data.length, n3 = n3.next;
            return t3;
          } }, { key: "consume", value: function(e3, t3) {
            var n3;
            return e3 < this.head.data.length ? (n3 = this.head.data.slice(0, e3), this.head.data = this.head.data.slice(e3)) : e3 === this.head.data.length ? n3 = this.shift() : n3 = t3 ? this._getString(e3) : this._getBuffer(e3), n3;
          } }, { key: "first", value: function() {
            return this.head.data;
          } }, { key: "_getString", value: function(e3) {
            var t3 = this.head, r3 = 1, a2 = t3.data;
            for (e3 -= a2.length; t3 = t3.next; ) {
              var o2 = t3.data, i2 = e3 > o2.length ? o2.length : e3;
              if (a2 += i2 === o2.length ? o2 : o2.slice(0, e3), e3 -= i2, 0 === e3) {
                i2 === o2.length ? (++r3, this.head = t3.next ? t3.next : this.tail = null) : (this.head = t3, t3.data = o2.slice(i2));
                break;
              }
              ++r3;
            }
            return this.length -= r3, a2;
          } }, { key: "_getBuffer", value: function(e3) {
            var t3 = u.allocUnsafe(e3), r3 = this.head, a2 = 1;
            for (r3.data.copy(t3), e3 -= r3.data.length; r3 = r3.next; ) {
              var o2 = r3.data, i2 = e3 > o2.length ? o2.length : e3;
              if (o2.copy(t3, t3.length - e3, 0, i2), e3 -= i2, 0 === e3) {
                i2 === o2.length ? (++a2, this.head = r3.next ? r3.next : this.tail = null) : (this.head = r3, r3.data = o2.slice(i2));
                break;
              }
              ++a2;
            }
            return this.length -= a2, t3;
          } }, { key: g, value: function(e3, t3) {
            return f(this, r2({}, t3, { depth: 0, customInspect: false }));
          } }]), e2;
        })();
      }, { buffer: 3, util: 2 }], 23: [function(e, t2) {
        (function(e2) {
          (function() {
            "use strict";
            function n2(e3, t3) {
              a(e3, t3), r2(e3);
            }
            function r2(e3) {
              e3._writableState && !e3._writableState.emitClose || e3._readableState && !e3._readableState.emitClose || e3.emit("close");
            }
            function a(e3, t3) {
              e3.emit("error", t3);
            }
            t2.exports = { destroy: function(t3, o) {
              var i = this, d = this._readableState && this._readableState.destroyed, s = this._writableState && this._writableState.destroyed;
              return d || s ? (o ? o(t3) : t3 && (this._writableState ? !this._writableState.errorEmitted && (this._writableState.errorEmitted = true, e2.nextTick(a, this, t3)) : e2.nextTick(a, this, t3)), this) : (this._readableState && (this._readableState.destroyed = true), this._writableState && (this._writableState.destroyed = true), this._destroy(t3 || null, function(t4) {
                !o && t4 ? i._writableState ? i._writableState.errorEmitted ? e2.nextTick(r2, i) : (i._writableState.errorEmitted = true, e2.nextTick(n2, i, t4)) : e2.nextTick(n2, i, t4) : o ? (e2.nextTick(r2, i), o(t4)) : e2.nextTick(r2, i);
              }), this);
            }, undestroy: function() {
              this._readableState && (this._readableState.destroyed = false, this._readableState.reading = false, this._readableState.ended = false, this._readableState.endEmitted = false), this._writableState && (this._writableState.destroyed = false, this._writableState.ended = false, this._writableState.ending = false, this._writableState.finalCalled = false, this._writableState.prefinished = false, this._writableState.finished = false, this._writableState.errorEmitted = false);
            }, errorOrDestroy: function(e3, t3) {
              var n3 = e3._readableState, r3 = e3._writableState;
              n3 && n3.autoDestroy || r3 && r3.autoDestroy ? e3.destroy(t3) : e3.emit("error", t3);
            } };
          }).call(this);
        }).call(this, e("_process"));
      }, { _process: 12 }], 24: [function(e, t2) {
        "use strict";
        function n2(e2) {
          var t3 = false;
          return function() {
            if (!t3) {
              t3 = true;
              for (var n3 = arguments.length, r3 = Array(n3), a2 = 0; a2 < n3; a2++) r3[a2] = arguments[a2];
              e2.apply(this, r3);
            }
          };
        }
        function r2() {
        }
        function a(e2) {
          return e2.setHeader && "function" == typeof e2.abort;
        }
        function o(e2, t3, d) {
          if ("function" == typeof t3) return o(e2, null, t3);
          t3 || (t3 = {}), d = n2(d || r2);
          var s = t3.readable || false !== t3.readable && e2.readable, l = t3.writable || false !== t3.writable && e2.writable, c = function() {
            e2.writable || p();
          }, u = e2._writableState && e2._writableState.finished, p = function() {
            l = false, u = true, s || d.call(e2);
          }, f = e2._readableState && e2._readableState.endEmitted, g = function() {
            s = false, f = true, l || d.call(e2);
          }, _ = function(t4) {
            d.call(e2, t4);
          }, h = function() {
            var t4;
            return s && !f ? (e2._readableState && e2._readableState.ended || (t4 = new i()), d.call(e2, t4)) : l && !u ? (e2._writableState && e2._writableState.ended || (t4 = new i()), d.call(e2, t4)) : void 0;
          }, m = function() {
            e2.req.on("finish", p);
          };
          return a(e2) ? (e2.on("complete", p), e2.on("abort", h), e2.req ? m() : e2.on("request", m)) : l && !e2._writableState && (e2.on("end", c), e2.on("close", c)), e2.on("end", g), e2.on("finish", p), false !== t3.error && e2.on("error", _), e2.on("close", h), function() {
            e2.removeListener("complete", p), e2.removeListener("abort", h), e2.removeListener("request", m), e2.req && e2.req.removeListener("finish", p), e2.removeListener("end", c), e2.removeListener("close", c), e2.removeListener("finish", p), e2.removeListener("end", g), e2.removeListener("error", _), e2.removeListener("close", h);
          };
        }
        var i = e("../../../errors").codes.ERR_STREAM_PREMATURE_CLOSE;
        t2.exports = o;
      }, { "../../../errors": 15 }], 25: [function(e, t2) {
        t2.exports = function() {
          throw new Error("Readable.from is not available in the browser");
        };
      }, {}], 26: [function(e, t2) {
        "use strict";
        function n2(e2) {
          var t3 = false;
          return function() {
            t3 || (t3 = true, e2.apply(void 0, arguments));
          };
        }
        function r2(e2) {
          if (e2) throw e2;
        }
        function a(e2) {
          return e2.setHeader && "function" == typeof e2.abort;
        }
        function o(t3, r3, o2, i2) {
          i2 = n2(i2);
          var d2 = false;
          t3.on("close", function() {
            d2 = true;
          }), l === void 0 && (l = e("./end-of-stream")), l(t3, { readable: r3, writable: o2 }, function(e2) {
            return e2 ? i2(e2) : void (d2 = true, i2());
          });
          var s2 = false;
          return function(e2) {
            if (!d2) return s2 ? void 0 : (s2 = true, a(t3) ? t3.abort() : "function" == typeof t3.destroy ? t3.destroy() : void i2(e2 || new p("pipe")));
          };
        }
        function i(e2) {
          e2();
        }
        function d(e2, t3) {
          return e2.pipe(t3);
        }
        function s(e2) {
          return e2.length ? "function" == typeof e2[e2.length - 1] ? e2.pop() : r2 : r2;
        }
        var l, c = e("../../../errors").codes, u = c.ERR_MISSING_ARGS, p = c.ERR_STREAM_DESTROYED;
        t2.exports = function() {
          for (var e2 = arguments.length, t3 = Array(e2), n3 = 0; n3 < e2; n3++) t3[n3] = arguments[n3];
          var r3 = s(t3);
          if (Array.isArray(t3[0]) && (t3 = t3[0]), 2 > t3.length) throw new u("streams");
          var a2, l2 = t3.map(function(e3, n4) {
            var d2 = n4 < t3.length - 1;
            return o(e3, d2, 0 < n4, function(e4) {
              a2 || (a2 = e4), e4 && l2.forEach(i), d2 || (l2.forEach(i), r3(a2));
            });
          });
          return t3.reduce(d);
        };
      }, { "../../../errors": 15, "./end-of-stream": 24 }], 27: [function(e, n2) {
        "use strict";
        function r2(e2, t2, n3) {
          return null == e2.highWaterMark ? t2 ? e2[n3] : null : e2.highWaterMark;
        }
        var a = e("../../../errors").codes.ERR_INVALID_OPT_VALUE;
        n2.exports = { getHighWaterMark: function(e2, n3, o, i) {
          var d = r2(n3, i, o);
          if (null != d) {
            if (!(isFinite(d) && t(d) === d) || 0 > d) {
              var s = i ? o : "highWaterMark";
              throw new a(s, d);
            }
            return t(d);
          }
          return e2.objectMode ? 16 : 16384;
        } };
      }, { "../../../errors": 15 }], 28: [function(e, t2) {
        t2.exports = e("events").EventEmitter;
      }, { events: 7 }], 29: [function(e, t2, n2) {
        n2 = t2.exports = e("./lib/_stream_readable.js"), n2.Stream = n2, n2.Readable = n2, n2.Writable = e("./lib/_stream_writable.js"), n2.Duplex = e("./lib/_stream_duplex.js"), n2.Transform = e("./lib/_stream_transform.js"), n2.PassThrough = e("./lib/_stream_passthrough.js"), n2.finished = e("./lib/internal/streams/end-of-stream.js"), n2.pipeline = e("./lib/internal/streams/pipeline.js");
      }, { "./lib/_stream_duplex.js": 16, "./lib/_stream_passthrough.js": 17, "./lib/_stream_readable.js": 18, "./lib/_stream_transform.js": 19, "./lib/_stream_writable.js": 20, "./lib/internal/streams/end-of-stream.js": 24, "./lib/internal/streams/pipeline.js": 26 }], 30: [function(e, t2, n2) {
        function r2(e2, t3) {
          for (var n3 in e2) t3[n3] = e2[n3];
        }
        function a(e2, t3, n3) {
          return i(e2, t3, n3);
        }
        var o = e("buffer"), i = o.Buffer;
        i.from && i.alloc && i.allocUnsafe && i.allocUnsafeSlow ? t2.exports = o : (r2(o, n2), n2.Buffer = a), a.prototype = Object.create(i.prototype), r2(i, a), a.from = function(e2, t3, n3) {
          if ("number" == typeof e2) throw new TypeError("Argument must not be a number");
          return i(e2, t3, n3);
        }, a.alloc = function(e2, t3, n3) {
          if ("number" != typeof e2) throw new TypeError("Argument must be a number");
          var r3 = i(e2);
          return void 0 === t3 ? r3.fill(0) : "string" == typeof n3 ? r3.fill(t3, n3) : r3.fill(t3), r3;
        }, a.allocUnsafe = function(e2) {
          if ("number" != typeof e2) throw new TypeError("Argument must be a number");
          return i(e2);
        }, a.allocUnsafeSlow = function(e2) {
          if ("number" != typeof e2) throw new TypeError("Argument must be a number");
          return o.SlowBuffer(e2);
        };
      }, { buffer: 3 }], 31: [function(e, t2, n2) {
        "use strict";
        function r2(e2) {
          if (!e2) return "utf8";
          for (var t3; ; ) switch (e2) {
            case "utf8":
            case "utf-8":
              return "utf8";
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return "utf16le";
            case "latin1":
            case "binary":
              return "latin1";
            case "base64":
            case "ascii":
            case "hex":
              return e2;
            default:
              if (t3) return;
              e2 = ("" + e2).toLowerCase(), t3 = true;
          }
        }
        function a(e2) {
          var t3 = r2(e2);
          if ("string" != typeof t3 && (m.isEncoding === b || !b(e2))) throw new Error("Unknown encoding: " + e2);
          return t3 || e2;
        }
        function o(e2) {
          this.encoding = a(e2);
          var t3;
          switch (this.encoding) {
            case "utf16le":
              this.text = u, this.end = p, t3 = 4;
              break;
            case "utf8":
              this.fillLast = c, t3 = 4;
              break;
            case "base64":
              this.text = f, this.end = g, t3 = 3;
              break;
            default:
              return this.write = _, void (this.end = h);
          }
          this.lastNeed = 0, this.lastTotal = 0, this.lastChar = m.allocUnsafe(t3);
        }
        function d(e2) {
          if (127 >= e2) return 0;
          return 6 == e2 >> 5 ? 2 : 14 == e2 >> 4 ? 3 : 30 == e2 >> 3 ? 4 : 2 == e2 >> 6 ? -1 : -2;
        }
        function s(e2, t3, n3) {
          var r3 = t3.length - 1;
          if (r3 < n3) return 0;
          var a2 = d(t3[r3]);
          return 0 <= a2 ? (0 < a2 && (e2.lastNeed = a2 - 1), a2) : --r3 < n3 || -2 === a2 ? 0 : (a2 = d(t3[r3]), 0 <= a2) ? (0 < a2 && (e2.lastNeed = a2 - 2), a2) : --r3 < n3 || -2 === a2 ? 0 : (a2 = d(t3[r3]), 0 <= a2 ? (0 < a2 && (2 === a2 ? a2 = 0 : e2.lastNeed = a2 - 3), a2) : 0);
        }
        function l(e2, t3) {
          if (128 != (192 & t3[0])) return e2.lastNeed = 0, "\uFFFD";
          if (1 < e2.lastNeed && 1 < t3.length) {
            if (128 != (192 & t3[1])) return e2.lastNeed = 1, "\uFFFD";
            if (2 < e2.lastNeed && 2 < t3.length && 128 != (192 & t3[2])) return e2.lastNeed = 2, "\uFFFD";
          }
        }
        function c(e2) {
          var t3 = this.lastTotal - this.lastNeed, n3 = l(this, e2, t3);
          return void 0 === n3 ? this.lastNeed <= e2.length ? (e2.copy(this.lastChar, t3, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal)) : void (e2.copy(this.lastChar, t3, 0, e2.length), this.lastNeed -= e2.length) : n3;
        }
        function u(e2, t3) {
          if (0 == (e2.length - t3) % 2) {
            var n3 = e2.toString("utf16le", t3);
            if (n3) {
              var r3 = n3.charCodeAt(n3.length - 1);
              if (55296 <= r3 && 56319 >= r3) return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = e2[e2.length - 2], this.lastChar[1] = e2[e2.length - 1], n3.slice(0, -1);
            }
            return n3;
          }
          return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = e2[e2.length - 1], e2.toString("utf16le", t3, e2.length - 1);
        }
        function p(e2) {
          var t3 = e2 && e2.length ? this.write(e2) : "";
          if (this.lastNeed) {
            var n3 = this.lastTotal - this.lastNeed;
            return t3 + this.lastChar.toString("utf16le", 0, n3);
          }
          return t3;
        }
        function f(e2, t3) {
          var r3 = (e2.length - t3) % 3;
          return 0 == r3 ? e2.toString("base64", t3) : (this.lastNeed = 3 - r3, this.lastTotal = 3, 1 == r3 ? this.lastChar[0] = e2[e2.length - 1] : (this.lastChar[0] = e2[e2.length - 2], this.lastChar[1] = e2[e2.length - 1]), e2.toString("base64", t3, e2.length - r3));
        }
        function g(e2) {
          var t3 = e2 && e2.length ? this.write(e2) : "";
          return this.lastNeed ? t3 + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : t3;
        }
        function _(e2) {
          return e2.toString(this.encoding);
        }
        function h(e2) {
          return e2 && e2.length ? this.write(e2) : "";
        }
        var m = e("safe-buffer").Buffer, b = m.isEncoding || function(e2) {
          switch (e2 = "" + e2, e2 && e2.toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "binary":
            case "base64":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
            case "raw":
              return true;
            default:
              return false;
          }
        };
        n2.StringDecoder = o, o.prototype.write = function(e2) {
          if (0 === e2.length) return "";
          var t3, n3;
          if (this.lastNeed) {
            if (t3 = this.fillLast(e2), void 0 === t3) return "";
            n3 = this.lastNeed, this.lastNeed = 0;
          } else n3 = 0;
          return n3 < e2.length ? t3 ? t3 + this.text(e2, n3) : this.text(e2, n3) : t3 || "";
        }, o.prototype.end = function(e2) {
          var t3 = e2 && e2.length ? this.write(e2) : "";
          return this.lastNeed ? t3 + "\uFFFD" : t3;
        }, o.prototype.text = function(e2, t3) {
          var n3 = s(this, e2, t3);
          if (!this.lastNeed) return e2.toString("utf8", t3);
          this.lastTotal = n3;
          var r3 = e2.length - (n3 - this.lastNeed);
          return e2.copy(this.lastChar, 0, r3), e2.toString("utf8", t3, r3);
        }, o.prototype.fillLast = function(e2) {
          return this.lastNeed <= e2.length ? (e2.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal)) : void (e2.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, e2.length), this.lastNeed -= e2.length);
        };
      }, { "safe-buffer": 30 }], 32: [function(e, t2) {
        (function(e2) {
          (function() {
            function n2(t3) {
              try {
                if (!e2.localStorage) return false;
              } catch (e3) {
                return false;
              }
              var n3 = e2.localStorage[t3];
              return null != n3 && "true" === (n3 + "").toLowerCase();
            }
            t2.exports = function(e3, t3) {
              function r2() {
                if (!a) {
                  if (n2("throwDeprecation")) throw new Error(t3);
                  else n2("traceDeprecation") ? console.trace(t3) : console.warn(t3);
                  a = true;
                }
                return e3.apply(this, arguments);
              }
              if (n2("noDeprecation")) return e3;
              var a = false;
              return r2;
            };
          }).call(this);
        }).call(this, "undefined" == typeof global ? "undefined" == typeof self ? "undefined" == typeof window ? {} : window : self : global);
      }, {}], "/": [function(e, t2) {
        function n2(e2) {
          return e2.replace(/a=ice-options:trickle\s\n/g, "");
        }
        function r2(e2) {
          console.warn(e2);
        }
        const a = e("debug")("simple-peer"), o = e("get-browser-rtc"), i = e("randombytes"), d = e("readable-stream"), s = e("queue-microtask"), l = e("err-code"), { Buffer: c } = e("buffer"), u = 65536;
        class p extends d.Duplex {
          constructor(e2) {
            if (e2 = Object.assign({ allowHalfOpen: false }, e2), super(e2), this._id = i(4).toString("hex").slice(0, 7), this._debug("new peer %o", e2), this.channelName = e2.initiator ? e2.channelName || i(20).toString("hex") : null, this.initiator = e2.initiator || false, this.channelConfig = e2.channelConfig || p.channelConfig, this.channelNegotiated = this.channelConfig.negotiated, this.config = Object.assign({}, p.config, e2.config), this.offerOptions = e2.offerOptions || {}, this.answerOptions = e2.answerOptions || {}, this.sdpTransform = e2.sdpTransform || ((e3) => e3), this.streams = e2.streams || (e2.stream ? [e2.stream] : []), this.trickle = void 0 === e2.trickle || e2.trickle, this.allowHalfTrickle = void 0 !== e2.allowHalfTrickle && e2.allowHalfTrickle, this.iceCompleteTimeout = e2.iceCompleteTimeout || 5e3, this.destroyed = false, this.destroying = false, this._connected = false, this.remoteAddress = void 0, this.remoteFamily = void 0, this.remotePort = void 0, this.localAddress = void 0, this.localFamily = void 0, this.localPort = void 0, this._wrtc = e2.wrtc && "object" == typeof e2.wrtc ? e2.wrtc : o(), !this._wrtc) if ("undefined" == typeof window) throw l(new Error("No WebRTC support: Specify `opts.wrtc` option in this environment"), "ERR_WEBRTC_SUPPORT");
            else throw l(new Error("No WebRTC support: Not a supported browser"), "ERR_WEBRTC_SUPPORT");
            this._pcReady = false, this._channelReady = false, this._iceComplete = false, this._iceCompleteTimer = null, this._channel = null, this._pendingCandidates = [], this._isNegotiating = false, this._firstNegotiation = true, this._batchedNegotiation = false, this._queuedNegotiation = false, this._sendersAwaitingStable = [], this._senderMap = /* @__PURE__ */ new Map(), this._closingInterval = null, this._remoteTracks = [], this._remoteStreams = [], this._chunk = null, this._cb = null, this._interval = null;
            try {
              this._pc = new this._wrtc.RTCPeerConnection(this.config);
            } catch (e3) {
              return void this.destroy(l(e3, "ERR_PC_CONSTRUCTOR"));
            }
            this._isReactNativeWebrtc = "number" == typeof this._pc._peerConnectionId, this._pc.oniceconnectionstatechange = () => {
              this._onIceStateChange();
            }, this._pc.onicegatheringstatechange = () => {
              this._onIceStateChange();
            }, this._pc.onconnectionstatechange = () => {
              this._onConnectionStateChange();
            }, this._pc.onsignalingstatechange = () => {
              this._onSignalingStateChange();
            }, this._pc.onicecandidate = (e3) => {
              this._onIceCandidate(e3);
            }, "object" == typeof this._pc.peerIdentity && this._pc.peerIdentity.catch((e3) => {
              this.destroy(l(e3, "ERR_PC_PEER_IDENTITY"));
            }), this.initiator || this.channelNegotiated ? this._setupData({ channel: this._pc.createDataChannel(this.channelName, this.channelConfig) }) : this._pc.ondatachannel = (e3) => {
              this._setupData(e3);
            }, this.streams && this.streams.forEach((e3) => {
              this.addStream(e3);
            }), this._pc.ontrack = (e3) => {
              this._onTrack(e3);
            }, this._debug("initial negotiation"), this._needsNegotiation(), this._onFinishBound = () => {
              this._onFinish();
            }, this.once("finish", this._onFinishBound);
          }
          get bufferSize() {
            return this._channel && this._channel.bufferedAmount || 0;
          }
          get connected() {
            return this._connected && "open" === this._channel.readyState;
          }
          address() {
            return { port: this.localPort, family: this.localFamily, address: this.localAddress };
          }
          signal(e2) {
            if (!this.destroying) {
              if (this.destroyed) throw l(new Error("cannot signal after peer is destroyed"), "ERR_DESTROYED");
              if ("string" == typeof e2) try {
                e2 = JSON.parse(e2);
              } catch (t3) {
                e2 = {};
              }
              this._debug("signal()"), e2.renegotiate && this.initiator && (this._debug("got request to renegotiate"), this._needsNegotiation()), e2.transceiverRequest && this.initiator && (this._debug("got request for transceiver"), this.addTransceiver(e2.transceiverRequest.kind, e2.transceiverRequest.init)), e2.candidate && (this._pc.remoteDescription && this._pc.remoteDescription.type ? this._addIceCandidate(e2.candidate) : this._pendingCandidates.push(e2.candidate)), e2.sdp && this._pc.setRemoteDescription(new this._wrtc.RTCSessionDescription(e2)).then(() => {
                this.destroyed || (this._pendingCandidates.forEach((e3) => {
                  this._addIceCandidate(e3);
                }), this._pendingCandidates = [], "offer" === this._pc.remoteDescription.type && this._createAnswer());
              }).catch((e3) => {
                this.destroy(l(e3, "ERR_SET_REMOTE_DESCRIPTION"));
              }), e2.sdp || e2.candidate || e2.renegotiate || e2.transceiverRequest || this.destroy(l(new Error("signal() called with invalid signal data"), "ERR_SIGNALING"));
            }
          }
          _addIceCandidate(e2) {
            const t3 = new this._wrtc.RTCIceCandidate(e2);
            this._pc.addIceCandidate(t3).catch((e3) => {
              !t3.address || t3.address.endsWith(".local") ? r2("Ignoring unsupported ICE candidate.") : this.destroy(l(e3, "ERR_ADD_ICE_CANDIDATE"));
            });
          }
          send(e2) {
            if (!this.destroying) {
              if (this.destroyed) throw l(new Error("cannot send after peer is destroyed"), "ERR_DESTROYED");
              this._channel.send(e2);
            }
          }
          addTransceiver(e2, t3) {
            if (!this.destroying) {
              if (this.destroyed) throw l(new Error("cannot addTransceiver after peer is destroyed"), "ERR_DESTROYED");
              if (this._debug("addTransceiver()"), this.initiator) try {
                this._pc.addTransceiver(e2, t3), this._needsNegotiation();
              } catch (e3) {
                this.destroy(l(e3, "ERR_ADD_TRANSCEIVER"));
              }
              else this.emit("signal", { type: "transceiverRequest", transceiverRequest: { kind: e2, init: t3 } });
            }
          }
          addStream(e2) {
            if (!this.destroying) {
              if (this.destroyed) throw l(new Error("cannot addStream after peer is destroyed"), "ERR_DESTROYED");
              this._debug("addStream()"), e2.getTracks().forEach((t3) => {
                this.addTrack(t3, e2);
              });
            }
          }
          addTrack(e2, t3) {
            if (this.destroying) return;
            if (this.destroyed) throw l(new Error("cannot addTrack after peer is destroyed"), "ERR_DESTROYED");
            this._debug("addTrack()");
            const n3 = this._senderMap.get(e2) || /* @__PURE__ */ new Map();
            let r3 = n3.get(t3);
            if (!r3) r3 = this._pc.addTrack(e2, t3), n3.set(t3, r3), this._senderMap.set(e2, n3), this._needsNegotiation();
            else if (r3.removed) throw l(new Error("Track has been removed. You should enable/disable tracks that you want to re-add."), "ERR_SENDER_REMOVED");
            else throw l(new Error("Track has already been added to that stream."), "ERR_SENDER_ALREADY_ADDED");
          }
          replaceTrack(e2, t3, n3) {
            if (this.destroying) return;
            if (this.destroyed) throw l(new Error("cannot replaceTrack after peer is destroyed"), "ERR_DESTROYED");
            this._debug("replaceTrack()");
            const r3 = this._senderMap.get(e2), a2 = r3 ? r3.get(n3) : null;
            if (!a2) throw l(new Error("Cannot replace track that was never added."), "ERR_TRACK_NOT_ADDED");
            t3 && this._senderMap.set(t3, r3), null == a2.replaceTrack ? this.destroy(l(new Error("replaceTrack is not supported in this browser"), "ERR_UNSUPPORTED_REPLACETRACK")) : a2.replaceTrack(t3);
          }
          removeTrack(e2, t3) {
            if (this.destroying) return;
            if (this.destroyed) throw l(new Error("cannot removeTrack after peer is destroyed"), "ERR_DESTROYED");
            this._debug("removeSender()");
            const n3 = this._senderMap.get(e2), r3 = n3 ? n3.get(t3) : null;
            if (!r3) throw l(new Error("Cannot remove track that was never added."), "ERR_TRACK_NOT_ADDED");
            try {
              r3.removed = true, this._pc.removeTrack(r3);
            } catch (e3) {
              "NS_ERROR_UNEXPECTED" === e3.name ? this._sendersAwaitingStable.push(r3) : this.destroy(l(e3, "ERR_REMOVE_TRACK"));
            }
            this._needsNegotiation();
          }
          removeStream(e2) {
            if (!this.destroying) {
              if (this.destroyed) throw l(new Error("cannot removeStream after peer is destroyed"), "ERR_DESTROYED");
              this._debug("removeSenders()"), e2.getTracks().forEach((t3) => {
                this.removeTrack(t3, e2);
              });
            }
          }
          _needsNegotiation() {
            this._debug("_needsNegotiation"), this._batchedNegotiation || (this._batchedNegotiation = true, s(() => {
              this._batchedNegotiation = false, this.initiator || !this._firstNegotiation ? (this._debug("starting batched negotiation"), this.negotiate()) : this._debug("non-initiator initial negotiation request discarded"), this._firstNegotiation = false;
            }));
          }
          negotiate() {
            if (!this.destroying) {
              if (this.destroyed) throw l(new Error("cannot negotiate after peer is destroyed"), "ERR_DESTROYED");
              this.initiator ? this._isNegotiating ? (this._queuedNegotiation = true, this._debug("already negotiating, queueing")) : (this._debug("start negotiation"), setTimeout(() => {
                this._createOffer();
              }, 0)) : this._isNegotiating ? (this._queuedNegotiation = true, this._debug("already negotiating, queueing")) : (this._debug("requesting negotiation from initiator"), this.emit("signal", { type: "renegotiate", renegotiate: true })), this._isNegotiating = true;
            }
          }
          destroy(e2) {
            this._destroy(e2, () => {
            });
          }
          _destroy(e2, t3) {
            this.destroyed || this.destroying || (this.destroying = true, this._debug("destroying (error: %s)", e2 && (e2.message || e2)), s(() => {
              if (this.destroyed = true, this.destroying = false, this._debug("destroy (error: %s)", e2 && (e2.message || e2)), this.readable = this.writable = false, this._readableState.ended || this.push(null), this._writableState.finished || this.end(), this._connected = false, this._pcReady = false, this._channelReady = false, this._remoteTracks = null, this._remoteStreams = null, this._senderMap = null, clearInterval(this._closingInterval), this._closingInterval = null, clearInterval(this._interval), this._interval = null, this._chunk = null, this._cb = null, this._onFinishBound && this.removeListener("finish", this._onFinishBound), this._onFinishBound = null, this._channel) {
                try {
                  this._channel.close();
                } catch (e3) {
                }
                this._channel.onmessage = null, this._channel.onopen = null, this._channel.onclose = null, this._channel.onerror = null;
              }
              if (this._pc) {
                try {
                  this._pc.close();
                } catch (e3) {
                }
                this._pc.oniceconnectionstatechange = null, this._pc.onicegatheringstatechange = null, this._pc.onsignalingstatechange = null, this._pc.onicecandidate = null, this._pc.ontrack = null, this._pc.ondatachannel = null;
              }
              this._pc = null, this._channel = null, e2 && this.emit("error", e2), this.emit("close"), t3();
            }));
          }
          _setupData(e2) {
            if (!e2.channel) return this.destroy(l(new Error("Data channel event is missing `channel` property"), "ERR_DATA_CHANNEL"));
            this._channel = e2.channel, this._channel.binaryType = "arraybuffer", "number" == typeof this._channel.bufferedAmountLowThreshold && (this._channel.bufferedAmountLowThreshold = u), this.channelName = this._channel.label, this._channel.onmessage = (e3) => {
              this._onChannelMessage(e3);
            }, this._channel.onbufferedamountlow = () => {
              this._onChannelBufferedAmountLow();
            }, this._channel.onopen = () => {
              this._onChannelOpen();
            }, this._channel.onclose = () => {
              this._onChannelClose();
            }, this._channel.onerror = (e3) => {
              const t4 = e3.error instanceof Error ? e3.error : new Error(`Datachannel error: ${e3.message} ${e3.filename}:${e3.lineno}:${e3.colno}`);
              this.destroy(l(t4, "ERR_DATA_CHANNEL"));
            };
            let t3 = false;
            this._closingInterval = setInterval(() => {
              this._channel && "closing" === this._channel.readyState ? (t3 && this._onChannelClose(), t3 = true) : t3 = false;
            }, 5e3);
          }
          _read() {
          }
          _write(e2, t3, n3) {
            if (this.destroyed) return n3(l(new Error("cannot write after peer is destroyed"), "ERR_DATA_CHANNEL"));
            if (this._connected) {
              try {
                this.send(e2);
              } catch (e3) {
                return this.destroy(l(e3, "ERR_DATA_CHANNEL"));
              }
              this._channel.bufferedAmount > u ? (this._debug("start backpressure: bufferedAmount %d", this._channel.bufferedAmount), this._cb = n3) : n3(null);
            } else this._debug("write before connect"), this._chunk = e2, this._cb = n3;
          }
          _onFinish() {
            if (!this.destroyed) {
              const e2 = () => {
                setTimeout(() => this.destroy(), 1e3);
              };
              this._connected ? e2() : this.once("connect", e2);
            }
          }
          _startIceCompleteTimeout() {
            this.destroyed || this._iceCompleteTimer || (this._debug("started iceComplete timeout"), this._iceCompleteTimer = setTimeout(() => {
              this._iceComplete || (this._iceComplete = true, this._debug("iceComplete timeout completed"), this.emit("iceTimeout"), this.emit("_iceComplete"));
            }, this.iceCompleteTimeout));
          }
          _createOffer() {
            this.destroyed || this._pc.createOffer(this.offerOptions).then((e2) => {
              if (this.destroyed) return;
              this.trickle || this.allowHalfTrickle || (e2.sdp = n2(e2.sdp)), e2.sdp = this.sdpTransform(e2.sdp);
              const t3 = () => {
                if (!this.destroyed) {
                  const t4 = this._pc.localDescription || e2;
                  this._debug("signal"), this.emit("signal", { type: t4.type, sdp: t4.sdp });
                }
              };
              this._pc.setLocalDescription(e2).then(() => {
                this._debug("createOffer success"), this.destroyed || (this.trickle || this._iceComplete ? t3() : this.once("_iceComplete", t3));
              }).catch((e3) => {
                this.destroy(l(e3, "ERR_SET_LOCAL_DESCRIPTION"));
              });
            }).catch((e2) => {
              this.destroy(l(e2, "ERR_CREATE_OFFER"));
            });
          }
          _requestMissingTransceivers() {
            this._pc.getTransceivers && this._pc.getTransceivers().forEach((e2) => {
              e2.mid || !e2.sender.track || e2.requested || (e2.requested = true, this.addTransceiver(e2.sender.track.kind));
            });
          }
          _createAnswer() {
            this.destroyed || this._pc.createAnswer(this.answerOptions).then((e2) => {
              if (this.destroyed) return;
              this.trickle || this.allowHalfTrickle || (e2.sdp = n2(e2.sdp)), e2.sdp = this.sdpTransform(e2.sdp);
              const t3 = () => {
                if (!this.destroyed) {
                  const t4 = this._pc.localDescription || e2;
                  this._debug("signal"), this.emit("signal", { type: t4.type, sdp: t4.sdp }), this.initiator || this._requestMissingTransceivers();
                }
              };
              this._pc.setLocalDescription(e2).then(() => {
                this.destroyed || (this.trickle || this._iceComplete ? t3() : this.once("_iceComplete", t3));
              }).catch((e3) => {
                this.destroy(l(e3, "ERR_SET_LOCAL_DESCRIPTION"));
              });
            }).catch((e2) => {
              this.destroy(l(e2, "ERR_CREATE_ANSWER"));
            });
          }
          _onConnectionStateChange() {
            this.destroyed || "failed" === this._pc.connectionState && this.destroy(l(new Error("Connection failed."), "ERR_CONNECTION_FAILURE"));
          }
          _onIceStateChange() {
            if (this.destroyed) return;
            const e2 = this._pc.iceConnectionState, t3 = this._pc.iceGatheringState;
            this._debug("iceStateChange (connection: %s) (gathering: %s)", e2, t3), this.emit("iceStateChange", e2, t3), ("connected" === e2 || "completed" === e2) && (this._pcReady = true, this._maybeReady()), "failed" === e2 && this.destroy(l(new Error("Ice connection failed."), "ERR_ICE_CONNECTION_FAILURE")), "closed" === e2 && this.destroy(l(new Error("Ice connection closed."), "ERR_ICE_CONNECTION_CLOSED"));
          }
          getStats(e2) {
            const t3 = (e3) => ("[object Array]" === Object.prototype.toString.call(e3.values) && e3.values.forEach((t4) => {
              Object.assign(e3, t4);
            }), e3);
            0 === this._pc.getStats.length || this._isReactNativeWebrtc ? this._pc.getStats().then((n3) => {
              const r3 = [];
              n3.forEach((e3) => {
                r3.push(t3(e3));
              }), e2(null, r3);
            }, (t4) => e2(t4)) : 0 < this._pc.getStats.length ? this._pc.getStats((n3) => {
              if (this.destroyed) return;
              const r3 = [];
              n3.result().forEach((e3) => {
                const n4 = {};
                e3.names().forEach((t4) => {
                  n4[t4] = e3.stat(t4);
                }), n4.id = e3.id, n4.type = e3.type, n4.timestamp = e3.timestamp, r3.push(t3(n4));
              }), e2(null, r3);
            }, (t4) => e2(t4)) : e2(null, []);
          }
          _maybeReady() {
            if (this._debug("maybeReady pc %s channel %s", this._pcReady, this._channelReady), this._connected || this._connecting || !this._pcReady || !this._channelReady) return;
            this._connecting = true;
            const e2 = () => {
              this.destroyed || this.getStats((t3, n3) => {
                if (this.destroyed) return;
                t3 && (n3 = []);
                const r3 = {}, a2 = {}, o2 = {};
                let i2 = false;
                n3.forEach((e3) => {
                  ("remotecandidate" === e3.type || "remote-candidate" === e3.type) && (r3[e3.id] = e3), ("localcandidate" === e3.type || "local-candidate" === e3.type) && (a2[e3.id] = e3), ("candidatepair" === e3.type || "candidate-pair" === e3.type) && (o2[e3.id] = e3);
                });
                const d2 = (e3) => {
                  i2 = true;
                  let t4 = a2[e3.localCandidateId];
                  t4 && (t4.ip || t4.address) ? (this.localAddress = t4.ip || t4.address, this.localPort = +t4.port) : t4 && t4.ipAddress ? (this.localAddress = t4.ipAddress, this.localPort = +t4.portNumber) : "string" == typeof e3.googLocalAddress && (t4 = e3.googLocalAddress.split(":"), this.localAddress = t4[0], this.localPort = +t4[1]), this.localAddress && (this.localFamily = this.localAddress.includes(":") ? "IPv6" : "IPv4");
                  let n4 = r3[e3.remoteCandidateId];
                  n4 && (n4.ip || n4.address) ? (this.remoteAddress = n4.ip || n4.address, this.remotePort = +n4.port) : n4 && n4.ipAddress ? (this.remoteAddress = n4.ipAddress, this.remotePort = +n4.portNumber) : "string" == typeof e3.googRemoteAddress && (n4 = e3.googRemoteAddress.split(":"), this.remoteAddress = n4[0], this.remotePort = +n4[1]), this.remoteAddress && (this.remoteFamily = this.remoteAddress.includes(":") ? "IPv6" : "IPv4"), this._debug("connect local: %s:%s remote: %s:%s", this.localAddress, this.localPort, this.remoteAddress, this.remotePort);
                };
                if (n3.forEach((e3) => {
                  "transport" === e3.type && e3.selectedCandidatePairId && d2(o2[e3.selectedCandidatePairId]), ("googCandidatePair" === e3.type && "true" === e3.googActiveConnection || ("candidatepair" === e3.type || "candidate-pair" === e3.type) && e3.selected) && d2(e3);
                }), !i2 && (!Object.keys(o2).length || Object.keys(a2).length)) return void setTimeout(e2, 100);
                if (this._connecting = false, this._connected = true, this._chunk) {
                  try {
                    this.send(this._chunk);
                  } catch (e4) {
                    return this.destroy(l(e4, "ERR_DATA_CHANNEL"));
                  }
                  this._chunk = null, this._debug('sent chunk from "write before connect"');
                  const e3 = this._cb;
                  this._cb = null, e3(null);
                }
                "number" != typeof this._channel.bufferedAmountLowThreshold && (this._interval = setInterval(() => this._onInterval(), 150), this._interval.unref && this._interval.unref()), this._debug("connect"), this.emit("connect");
              });
            };
            e2();
          }
          _onInterval() {
            this._cb && this._channel && !(this._channel.bufferedAmount > u) && this._onChannelBufferedAmountLow();
          }
          _onSignalingStateChange() {
            this.destroyed || ("stable" === this._pc.signalingState && (this._isNegotiating = false, this._debug("flushing sender queue", this._sendersAwaitingStable), this._sendersAwaitingStable.forEach((e2) => {
              this._pc.removeTrack(e2), this._queuedNegotiation = true;
            }), this._sendersAwaitingStable = [], this._queuedNegotiation ? (this._debug("flushing negotiation queue"), this._queuedNegotiation = false, this._needsNegotiation()) : (this._debug("negotiated"), this.emit("negotiated"))), this._debug("signalingStateChange %s", this._pc.signalingState), this.emit("signalingStateChange", this._pc.signalingState));
          }
          _onIceCandidate(e2) {
            this.destroyed || (e2.candidate && this.trickle ? this.emit("signal", { type: "candidate", candidate: { candidate: e2.candidate.candidate, sdpMLineIndex: e2.candidate.sdpMLineIndex, sdpMid: e2.candidate.sdpMid } }) : !e2.candidate && !this._iceComplete && (this._iceComplete = true, this.emit("_iceComplete")), e2.candidate && this._startIceCompleteTimeout());
          }
          _onChannelMessage(e2) {
            if (this.destroyed) return;
            let t3 = e2.data;
            t3 instanceof ArrayBuffer && (t3 = c.from(t3)), this.push(t3);
          }
          _onChannelBufferedAmountLow() {
            if (!this.destroyed && this._cb) {
              this._debug("ending backpressure: bufferedAmount %d", this._channel.bufferedAmount);
              const e2 = this._cb;
              this._cb = null, e2(null);
            }
          }
          _onChannelOpen() {
            this._connected || this.destroyed || (this._debug("on channel open"), this._channelReady = true, this._maybeReady());
          }
          _onChannelClose() {
            this.destroyed || (this._debug("on channel close"), this.destroy());
          }
          _onTrack(e2) {
            this.destroyed || e2.streams.forEach((t3) => {
              this._debug("on track"), this.emit("track", e2.track, t3), this._remoteTracks.push({ track: e2.track, stream: t3 }), this._remoteStreams.some((e3) => e3.id === t3.id) || (this._remoteStreams.push(t3), s(() => {
                this._debug("on stream"), this.emit("stream", t3);
              }));
            });
          }
          _debug() {
            const e2 = [].slice.call(arguments);
            e2[0] = "[" + this._id + "] " + e2[0], a.apply(null, e2);
          }
        }
        p.WEBRTC_SUPPORT = !!o(), p.config = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] }], sdpSemantics: "unified-plan" }, p.channelConfig = {}, t2.exports = p;
      }, { buffer: 3, debug: 4, "err-code": 6, "get-browser-rtc": 8, "queue-microtask": 13, randombytes: 14, "readable-stream": 29 }] }, {}, [])("/");
    });
  }
});

// node_modules/lib0/map.js
var create = () => /* @__PURE__ */ new Map();
var setIfUndefined = (map2, key, createT) => {
  let set = map2.get(key);
  if (set === void 0) {
    map2.set(key, set = createT());
  }
  return set;
};
var map = (m, f) => {
  const res = [];
  for (const [key, value] of m) {
    res.push(f(value, key));
  }
  return res;
};

// node_modules/lib0/set.js
var create2 = () => /* @__PURE__ */ new Set();

// node_modules/lib0/array.js
var from = Array.from;
var every = (arr, f) => {
  for (let i = 0; i < arr.length; i++) {
    if (!f(arr[i], i, arr)) {
      return false;
    }
  }
  return true;
};
var some = (arr, f) => {
  for (let i = 0; i < arr.length; i++) {
    if (f(arr[i], i, arr)) {
      return true;
    }
  }
  return false;
};
var unfold = (len, f) => {
  const array = new Array(len);
  for (let i = 0; i < len; i++) {
    array[i] = f(i, array);
  }
  return array;
};
var isArray = Array.isArray;

// node_modules/lib0/observable.js
var ObservableV2 = class {
  constructor() {
    this._observers = create();
  }
  /**
   * @template {keyof EVENTS & string} NAME
   * @param {NAME} name
   * @param {EVENTS[NAME]} f
   */
  on(name, f) {
    setIfUndefined(
      this._observers,
      /** @type {string} */
      name,
      create2
    ).add(f);
    return f;
  }
  /**
   * @template {keyof EVENTS & string} NAME
   * @param {NAME} name
   * @param {EVENTS[NAME]} f
   */
  once(name, f) {
    const _f = (...args2) => {
      this.off(
        name,
        /** @type {any} */
        _f
      );
      f(...args2);
    };
    this.on(
      name,
      /** @type {any} */
      _f
    );
  }
  /**
   * @template {keyof EVENTS & string} NAME
   * @param {NAME} name
   * @param {EVENTS[NAME]} f
   */
  off(name, f) {
    const observers = this._observers.get(name);
    if (observers !== void 0) {
      observers.delete(f);
      if (observers.size === 0) {
        this._observers.delete(name);
      }
    }
  }
  /**
   * Emit a named event. All registered event listeners that listen to the
   * specified name will receive the event.
   *
   * @todo This should catch exceptions
   *
   * @template {keyof EVENTS & string} NAME
   * @param {NAME} name The event name.
   * @param {Parameters<EVENTS[NAME]>} args The arguments that are applied to the event listener.
   */
  emit(name, args2) {
    return from((this._observers.get(name) || create()).values()).forEach((f) => f(...args2));
  }
  destroy() {
    this._observers = create();
  }
};
var Observable = class {
  constructor() {
    this._observers = create();
  }
  /**
   * @param {N} name
   * @param {function} f
   */
  on(name, f) {
    setIfUndefined(this._observers, name, create2).add(f);
  }
  /**
   * @param {N} name
   * @param {function} f
   */
  once(name, f) {
    const _f = (...args2) => {
      this.off(name, _f);
      f(...args2);
    };
    this.on(name, _f);
  }
  /**
   * @param {N} name
   * @param {function} f
   */
  off(name, f) {
    const observers = this._observers.get(name);
    if (observers !== void 0) {
      observers.delete(f);
      if (observers.size === 0) {
        this._observers.delete(name);
      }
    }
  }
  /**
   * Emit a named event. All registered event listeners that listen to the
   * specified name will receive the event.
   *
   * @todo This should catch exceptions
   *
   * @param {N} name The event name.
   * @param {Array<any>} args The arguments that are applied to the event listener.
   */
  emit(name, args2) {
    return from((this._observers.get(name) || create()).values()).forEach((f) => f(...args2));
  }
  destroy() {
    this._observers = create();
  }
};

// node_modules/lib0/math.js
var floor = Math.floor;
var abs = Math.abs;
var log10 = Math.log10;
var min = (a, b) => a < b ? a : b;
var max = (a, b) => a > b ? a : b;
var isNaN2 = Number.isNaN;
var isNegativeZero = (n) => n !== 0 ? n < 0 : 1 / n < 0;

// node_modules/lib0/time.js
var getUnixTime = Date.now;

// node_modules/lib0/websocket.js
var reconnectTimeoutBase = 1200;
var maxReconnectTimeout = 2500;
var messageReconnectTimeout = 3e4;
var setupWS = (wsclient) => {
  if (wsclient.shouldConnect && wsclient.ws === null) {
    const websocket = new WebSocket(wsclient.url);
    const binaryType = wsclient.binaryType;
    let pingTimeout = null;
    if (binaryType) {
      websocket.binaryType = binaryType;
    }
    wsclient.ws = websocket;
    wsclient.connecting = true;
    wsclient.connected = false;
    websocket.onmessage = (event) => {
      wsclient.lastMessageReceived = getUnixTime();
      const data = event.data;
      const message = typeof data === "string" ? JSON.parse(data) : data;
      if (message && message.type === "pong") {
        clearTimeout(pingTimeout);
        pingTimeout = setTimeout(sendPing, messageReconnectTimeout / 2);
      }
      wsclient.emit("message", [message, wsclient]);
    };
    const onclose = (error) => {
      if (wsclient.ws !== null) {
        wsclient.ws = null;
        wsclient.connecting = false;
        if (wsclient.connected) {
          wsclient.connected = false;
          wsclient.emit("disconnect", [{ type: "disconnect", error }, wsclient]);
        } else {
          wsclient.unsuccessfulReconnects++;
        }
        setTimeout(setupWS, min(log10(wsclient.unsuccessfulReconnects + 1) * reconnectTimeoutBase, maxReconnectTimeout), wsclient);
      }
      clearTimeout(pingTimeout);
    };
    const sendPing = () => {
      if (wsclient.ws === websocket) {
        wsclient.send({
          type: "ping"
        });
      }
    };
    websocket.onclose = () => onclose(null);
    websocket.onerror = (error) => onclose(error);
    websocket.onopen = () => {
      wsclient.lastMessageReceived = getUnixTime();
      wsclient.connecting = false;
      wsclient.connected = true;
      wsclient.unsuccessfulReconnects = 0;
      wsclient.emit("connect", [{ type: "connect" }, wsclient]);
      pingTimeout = setTimeout(sendPing, messageReconnectTimeout / 2);
    };
  }
};
var WebsocketClient = class extends Observable {
  /**
   * @param {string} url
   * @param {object} opts
   * @param {'arraybuffer' | 'blob' | null} [opts.binaryType] Set `ws.binaryType`
   */
  constructor(url, { binaryType } = {}) {
    super();
    this.url = url;
    this.ws = null;
    this.binaryType = binaryType || null;
    this.connected = false;
    this.connecting = false;
    this.unsuccessfulReconnects = 0;
    this.lastMessageReceived = 0;
    this.shouldConnect = true;
    this._checkInterval = setInterval(() => {
      if (this.connected && messageReconnectTimeout < getUnixTime() - this.lastMessageReceived) {
        this.ws.close();
      }
    }, messageReconnectTimeout / 2);
    setupWS(this);
  }
  /**
   * @param {any} message
   */
  send(message) {
    if (this.ws) {
      this.ws.send(JSON.stringify(message));
    }
  }
  destroy() {
    clearInterval(this._checkInterval);
    this.disconnect();
    super.destroy();
  }
  disconnect() {
    this.shouldConnect = false;
    if (this.ws !== null) {
      this.ws.close();
    }
  }
  connect() {
    this.shouldConnect = true;
    if (!this.connected && this.ws === null) {
      setupWS(this);
    }
  }
};

// node_modules/lib0/error.js
var create3 = (s) => new Error(s);
var methodUnimplemented = () => {
  throw create3("Method unimplemented");
};
var unexpectedCase = () => {
  throw create3("Unexpected case");
};

// node_modules/lib0/binary.js
var BIT7 = 64;
var BIT8 = 128;
var BIT18 = 1 << 17;
var BIT19 = 1 << 18;
var BIT20 = 1 << 19;
var BIT21 = 1 << 20;
var BIT22 = 1 << 21;
var BIT23 = 1 << 22;
var BIT24 = 1 << 23;
var BIT25 = 1 << 24;
var BIT26 = 1 << 25;
var BIT27 = 1 << 26;
var BIT28 = 1 << 27;
var BIT29 = 1 << 28;
var BIT30 = 1 << 29;
var BIT31 = 1 << 30;
var BIT32 = 1 << 31;
var BITS6 = 63;
var BITS7 = 127;
var BITS17 = BIT18 - 1;
var BITS18 = BIT19 - 1;
var BITS19 = BIT20 - 1;
var BITS20 = BIT21 - 1;
var BITS21 = BIT22 - 1;
var BITS22 = BIT23 - 1;
var BITS23 = BIT24 - 1;
var BITS24 = BIT25 - 1;
var BITS25 = BIT26 - 1;
var BITS26 = BIT27 - 1;
var BITS27 = BIT28 - 1;
var BITS28 = BIT29 - 1;
var BITS29 = BIT30 - 1;
var BITS30 = BIT31 - 1;
var BITS31 = 2147483647;

// node_modules/lib0/webcrypto.js
var subtle = crypto.subtle;
var getRandomValues = crypto.getRandomValues.bind(crypto);

// node_modules/lib0/random.js
var rand = Math.random;
var uint32 = () => getRandomValues(new Uint32Array(1))[0];
var uuidv4Template = "10000000-1000-4000-8000" + -1e11;
var uuidv4 = () => uuidv4Template.replace(
  /[018]/g,
  /** @param {number} c */
  (c) => (c ^ uint32() & 15 >> c / 4).toString(16)
);

// node_modules/lib0/number.js
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
var MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER;
var LOWEST_INT32 = 1 << 31;
var isInteger = Number.isInteger || ((num) => typeof num === "number" && isFinite(num) && floor(num) === num);
var isNaN3 = Number.isNaN;
var parseInt2 = Number.parseInt;

// node_modules/lib0/string.js
var fromCharCode = String.fromCharCode;
var fromCodePoint = String.fromCodePoint;
var MAX_UTF16_CHARACTER = fromCharCode(65535);
var toLowerCase = (s) => s.toLowerCase();
var trimLeftRegex = /^\s*/g;
var trimLeft = (s) => s.replace(trimLeftRegex, "");
var fromCamelCaseRegex = /([A-Z])/g;
var fromCamelCase = (s, separator) => trimLeft(s.replace(fromCamelCaseRegex, (match2) => `${separator}${toLowerCase(match2)}`));
var _encodeUtf8Polyfill = (str) => {
  const encodedString = unescape(encodeURIComponent(str));
  const len = encodedString.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buf[i] = /** @type {number} */
    encodedString.codePointAt(i);
  }
  return buf;
};
var utf8TextEncoder = (
  /** @type {TextEncoder} */
  typeof TextEncoder !== "undefined" ? new TextEncoder() : null
);
var _encodeUtf8Native = (str) => utf8TextEncoder.encode(str);
var encodeUtf8 = utf8TextEncoder ? _encodeUtf8Native : _encodeUtf8Polyfill;
var utf8TextDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
if (utf8TextDecoder && utf8TextDecoder.decode(new Uint8Array()).length === 1) {
  utf8TextDecoder = null;
}
var repeat = (source, n) => unfold(n, () => source).join("");

// node_modules/lib0/encoding.js
var Encoder = class {
  constructor() {
    this.cpos = 0;
    this.cbuf = new Uint8Array(100);
    this.bufs = [];
  }
};
var createEncoder = () => new Encoder();
var length = (encoder) => {
  let len = encoder.cpos;
  for (let i = 0; i < encoder.bufs.length; i++) {
    len += encoder.bufs[i].length;
  }
  return len;
};
var toUint8Array = (encoder) => {
  const uint8arr = new Uint8Array(length(encoder));
  let curPos = 0;
  for (let i = 0; i < encoder.bufs.length; i++) {
    const d = encoder.bufs[i];
    uint8arr.set(d, curPos);
    curPos += d.length;
  }
  uint8arr.set(new Uint8Array(encoder.cbuf.buffer, 0, encoder.cpos), curPos);
  return uint8arr;
};
var verifyLen = (encoder, len) => {
  const bufferLen = encoder.cbuf.length;
  if (bufferLen - encoder.cpos < len) {
    encoder.bufs.push(new Uint8Array(encoder.cbuf.buffer, 0, encoder.cpos));
    encoder.cbuf = new Uint8Array(max(bufferLen, len) * 2);
    encoder.cpos = 0;
  }
};
var write = (encoder, num) => {
  const bufferLen = encoder.cbuf.length;
  if (encoder.cpos === bufferLen) {
    encoder.bufs.push(encoder.cbuf);
    encoder.cbuf = new Uint8Array(bufferLen * 2);
    encoder.cpos = 0;
  }
  encoder.cbuf[encoder.cpos++] = num;
};
var writeUint8 = write;
var writeVarUint = (encoder, num) => {
  while (num > BITS7) {
    write(encoder, BIT8 | BITS7 & num);
    num = floor(num / 128);
  }
  write(encoder, BITS7 & num);
};
var writeVarInt = (encoder, num) => {
  const isNegative = isNegativeZero(num);
  if (isNegative) {
    num = -num;
  }
  write(encoder, (num > BITS6 ? BIT8 : 0) | (isNegative ? BIT7 : 0) | BITS6 & num);
  num = floor(num / 64);
  while (num > 0) {
    write(encoder, (num > BITS7 ? BIT8 : 0) | BITS7 & num);
    num = floor(num / 128);
  }
};
var _strBuffer = new Uint8Array(3e4);
var _maxStrBSize = _strBuffer.length / 3;
var _writeVarStringNative = (encoder, str) => {
  if (str.length < _maxStrBSize) {
    const written = utf8TextEncoder.encodeInto(str, _strBuffer).written || 0;
    writeVarUint(encoder, written);
    for (let i = 0; i < written; i++) {
      write(encoder, _strBuffer[i]);
    }
  } else {
    writeVarUint8Array(encoder, encodeUtf8(str));
  }
};
var _writeVarStringPolyfill = (encoder, str) => {
  const encodedString = unescape(encodeURIComponent(str));
  const len = encodedString.length;
  writeVarUint(encoder, len);
  for (let i = 0; i < len; i++) {
    write(
      encoder,
      /** @type {number} */
      encodedString.codePointAt(i)
    );
  }
};
var writeVarString = utf8TextEncoder && /** @type {any} */
utf8TextEncoder.encodeInto ? _writeVarStringNative : _writeVarStringPolyfill;
var writeUint8Array = (encoder, uint8Array) => {
  const bufferLen = encoder.cbuf.length;
  const cpos = encoder.cpos;
  const leftCopyLen = min(bufferLen - cpos, uint8Array.length);
  const rightCopyLen = uint8Array.length - leftCopyLen;
  encoder.cbuf.set(uint8Array.subarray(0, leftCopyLen), cpos);
  encoder.cpos += leftCopyLen;
  if (rightCopyLen > 0) {
    encoder.bufs.push(encoder.cbuf);
    encoder.cbuf = new Uint8Array(max(bufferLen * 2, rightCopyLen));
    encoder.cbuf.set(uint8Array.subarray(leftCopyLen));
    encoder.cpos = rightCopyLen;
  }
};
var writeVarUint8Array = (encoder, uint8Array) => {
  writeVarUint(encoder, uint8Array.byteLength);
  writeUint8Array(encoder, uint8Array);
};
var writeOnDataView = (encoder, len) => {
  verifyLen(encoder, len);
  const dview = new DataView(encoder.cbuf.buffer, encoder.cpos, len);
  encoder.cpos += len;
  return dview;
};
var writeFloat32 = (encoder, num) => writeOnDataView(encoder, 4).setFloat32(0, num, false);
var writeFloat64 = (encoder, num) => writeOnDataView(encoder, 8).setFloat64(0, num, false);
var writeBigInt64 = (encoder, num) => (
  /** @type {any} */
  writeOnDataView(encoder, 8).setBigInt64(0, num, false)
);
var floatTestBed = new DataView(new ArrayBuffer(4));
var isFloat32 = (num) => {
  floatTestBed.setFloat32(0, num);
  return floatTestBed.getFloat32(0) === num;
};
var writeAny = (encoder, data) => {
  switch (typeof data) {
    case "string":
      write(encoder, 119);
      writeVarString(encoder, data);
      break;
    case "number":
      if (isInteger(data) && abs(data) <= BITS31) {
        write(encoder, 125);
        writeVarInt(encoder, data);
      } else if (isFloat32(data)) {
        write(encoder, 124);
        writeFloat32(encoder, data);
      } else {
        write(encoder, 123);
        writeFloat64(encoder, data);
      }
      break;
    case "bigint":
      write(encoder, 122);
      writeBigInt64(encoder, data);
      break;
    case "object":
      if (data === null) {
        write(encoder, 126);
      } else if (isArray(data)) {
        write(encoder, 117);
        writeVarUint(encoder, data.length);
        for (let i = 0; i < data.length; i++) {
          writeAny(encoder, data[i]);
        }
      } else if (data instanceof Uint8Array) {
        write(encoder, 116);
        writeVarUint8Array(encoder, data);
      } else {
        write(encoder, 118);
        const keys2 = Object.keys(data);
        writeVarUint(encoder, keys2.length);
        for (let i = 0; i < keys2.length; i++) {
          const key = keys2[i];
          writeVarString(encoder, key);
          writeAny(encoder, data[key]);
        }
      }
      break;
    case "boolean":
      write(encoder, data ? 120 : 121);
      break;
    default:
      write(encoder, 127);
  }
};

// node_modules/lib0/decoding.js
var errorUnexpectedEndOfArray = create3("Unexpected end of array");
var errorIntegerOutOfRange = create3("Integer out of Range");
var Decoder = class {
  /**
   * @param {Uint8Array<Buf>} uint8Array Binary data to decode
   */
  constructor(uint8Array) {
    this.arr = uint8Array;
    this.pos = 0;
  }
};
var createDecoder = (uint8Array) => new Decoder(uint8Array);
var readUint8Array = (decoder, len) => {
  const view = new Uint8Array(decoder.arr.buffer, decoder.pos + decoder.arr.byteOffset, len);
  decoder.pos += len;
  return view;
};
var readVarUint8Array = (decoder) => readUint8Array(decoder, readVarUint(decoder));
var readUint8 = (decoder) => decoder.arr[decoder.pos++];
var readVarUint = (decoder) => {
  let num = 0;
  let mult = 1;
  const len = decoder.arr.length;
  while (decoder.pos < len) {
    const r = decoder.arr[decoder.pos++];
    num = num + (r & BITS7) * mult;
    mult *= 128;
    if (r < BIT8) {
      return num;
    }
    if (num > MAX_SAFE_INTEGER) {
      throw errorIntegerOutOfRange;
    }
  }
  throw errorUnexpectedEndOfArray;
};
var readVarInt = (decoder) => {
  let r = decoder.arr[decoder.pos++];
  let num = r & BITS6;
  let mult = 64;
  const sign = (r & BIT7) > 0 ? -1 : 1;
  if ((r & BIT8) === 0) {
    return sign * num;
  }
  const len = decoder.arr.length;
  while (decoder.pos < len) {
    r = decoder.arr[decoder.pos++];
    num = num + (r & BITS7) * mult;
    mult *= 128;
    if (r < BIT8) {
      return sign * num;
    }
    if (num > MAX_SAFE_INTEGER) {
      throw errorIntegerOutOfRange;
    }
  }
  throw errorUnexpectedEndOfArray;
};
var _readVarStringPolyfill = (decoder) => {
  let remainingLen = readVarUint(decoder);
  if (remainingLen === 0) {
    return "";
  } else {
    let encodedString = String.fromCodePoint(readUint8(decoder));
    if (--remainingLen < 100) {
      while (remainingLen--) {
        encodedString += String.fromCodePoint(readUint8(decoder));
      }
    } else {
      while (remainingLen > 0) {
        const nextLen = remainingLen < 1e4 ? remainingLen : 1e4;
        const bytes = decoder.arr.subarray(decoder.pos, decoder.pos + nextLen);
        decoder.pos += nextLen;
        encodedString += String.fromCodePoint.apply(
          null,
          /** @type {any} */
          bytes
        );
        remainingLen -= nextLen;
      }
    }
    return decodeURIComponent(escape(encodedString));
  }
};
var _readVarStringNative = (decoder) => (
  /** @type any */
  utf8TextDecoder.decode(readVarUint8Array(decoder))
);
var readVarString = utf8TextDecoder ? _readVarStringNative : _readVarStringPolyfill;
var readFromDataView = (decoder, len) => {
  const dv = new DataView(decoder.arr.buffer, decoder.arr.byteOffset + decoder.pos, len);
  decoder.pos += len;
  return dv;
};
var readFloat32 = (decoder) => readFromDataView(decoder, 4).getFloat32(0, false);
var readFloat64 = (decoder) => readFromDataView(decoder, 8).getFloat64(0, false);
var readBigInt64 = (decoder) => (
  /** @type {any} */
  readFromDataView(decoder, 8).getBigInt64(0, false)
);
var readAnyLookupTable = [
  (decoder) => void 0,
  // CASE 127: undefined
  (decoder) => null,
  // CASE 126: null
  readVarInt,
  // CASE 125: integer
  readFloat32,
  // CASE 124: float32
  readFloat64,
  // CASE 123: float64
  readBigInt64,
  // CASE 122: bigint
  (decoder) => false,
  // CASE 121: boolean (false)
  (decoder) => true,
  // CASE 120: boolean (true)
  readVarString,
  // CASE 119: string
  (decoder) => {
    const len = readVarUint(decoder);
    const obj = {};
    for (let i = 0; i < len; i++) {
      const key = readVarString(decoder);
      obj[key] = readAny(decoder);
    }
    return obj;
  },
  (decoder) => {
    const len = readVarUint(decoder);
    const arr = [];
    for (let i = 0; i < len; i++) {
      arr.push(readAny(decoder));
    }
    return arr;
  },
  readVarUint8Array
  // CASE 116: Uint8Array
];
var readAny = (decoder) => readAnyLookupTable[127 - readUint8(decoder)](decoder);

// node_modules/lib0/conditions.js
var undefinedToNull = (v) => v === void 0 ? null : v;

// node_modules/lib0/storage.js
var VarStoragePolyfill = class {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  /**
   * @param {string} key
   * @param {any} newValue
   */
  setItem(key, newValue) {
    this.map.set(key, newValue);
  }
  /**
   * @param {string} key
   */
  getItem(key) {
    return this.map.get(key);
  }
};
var _localStorage = new VarStoragePolyfill();
var usePolyfill = true;
try {
  if (typeof localStorage !== "undefined" && localStorage) {
    _localStorage = localStorage;
    usePolyfill = false;
  }
} catch (e) {
}
var varStorage = _localStorage;
var onChange = (eventHandler) => usePolyfill || addEventListener(
  "storage",
  /** @type {any} */
  eventHandler
);
var offChange = (eventHandler) => usePolyfill || removeEventListener(
  "storage",
  /** @type {any} */
  eventHandler
);

// node_modules/lib0/trait/equality.js
var EqualityTraitSymbol = /* @__PURE__ */ Symbol("Equality");
var equals = (a, b) => a === b || !!a?.[EqualityTraitSymbol]?.(b) || false;

// node_modules/lib0/object.js
var isObject = (o) => typeof o === "object";
var keys = Object.keys;
var size = (obj) => keys(obj).length;
var every2 = (obj, f) => {
  for (const key in obj) {
    if (!f(obj[key], key)) {
      return false;
    }
  }
  return true;
};
var hasProperty = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

// node_modules/lib0/function.js
var nop = () => {
};
var equalityDeep = (a, b) => {
  if (a === b) {
    return true;
  }
  if (a == null || b == null || a.constructor !== b.constructor && (a.constructor || Object) !== (b.constructor || Object)) {
    return false;
  }
  if (a[EqualityTraitSymbol] != null) {
    return a[EqualityTraitSymbol](b);
  }
  switch (a.constructor) {
    case ArrayBuffer:
      a = new Uint8Array(a);
      b = new Uint8Array(b);
    // eslint-disable-next-line no-fallthrough
    case Uint8Array: {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      break;
    }
    case Set: {
      if (a.size !== b.size) {
        return false;
      }
      for (const value of a) {
        if (!b.has(value)) {
          return false;
        }
      }
      break;
    }
    case Map: {
      if (a.size !== b.size) {
        return false;
      }
      for (const key of a.keys()) {
        if (!b.has(key) || !equalityDeep(a.get(key), b.get(key))) {
          return false;
        }
      }
      break;
    }
    case void 0:
    case Object:
      if (size(a) !== size(b)) {
        return false;
      }
      for (const key in a) {
        if (!hasProperty(a, key) || !equalityDeep(a[key], b[key])) {
          return false;
        }
      }
      break;
    case Array:
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!equalityDeep(a[i], b[i])) {
          return false;
        }
      }
      break;
    default:
      return false;
  }
  return true;
};
var isOneOf = (value, options) => options.includes(value);

// node_modules/lib0/environment.js
var isNode = typeof process !== "undefined" && process.release && /node|io\.js/.test(process.release.name) && Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";
var isBrowser = typeof window !== "undefined" && typeof document !== "undefined" && !isNode;
var isMac = typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;
var params;
var args = [];
var computeParams = () => {
  if (params === void 0) {
    if (isNode) {
      params = create();
      const pargs = process.argv;
      let currParamName = null;
      for (let i = 0; i < pargs.length; i++) {
        const parg = pargs[i];
        if (parg[0] === "-") {
          if (currParamName !== null) {
            params.set(currParamName, "");
          }
          currParamName = parg;
        } else {
          if (currParamName !== null) {
            params.set(currParamName, parg);
            currParamName = null;
          } else {
            args.push(parg);
          }
        }
      }
      if (currParamName !== null) {
        params.set(currParamName, "");
      }
    } else if (typeof location === "object") {
      params = create();
      (location.search || "?").slice(1).split("&").forEach((kv) => {
        if (kv.length !== 0) {
          const [key, value] = kv.split("=");
          params.set(`--${fromCamelCase(key, "-")}`, value);
          params.set(`-${fromCamelCase(key, "-")}`, value);
        }
      });
    } else {
      params = create();
    }
  }
  return params;
};
var hasParam = (name) => computeParams().has(name);
var getVariable = (name) => isNode ? undefinedToNull(process.env[name.toUpperCase().replaceAll("-", "_")]) : undefinedToNull(varStorage.getItem(name));
var hasConf = (name) => hasParam("--" + name) || getVariable(name) !== null;
var production = hasConf("production");
var forceColor = isNode && isOneOf(process.env.FORCE_COLOR, ["true", "1", "2"]);
var supportsColor = forceColor || !hasParam("--no-colors") && // @todo deprecate --no-colors
!hasConf("no-color") && (!isNode || process.stdout.isTTY) && (!isNode || hasParam("--color") || getVariable("COLORTERM") !== null || (getVariable("TERM") || "").includes("color"));

// node_modules/lib0/pair.js
var Pair = class {
  /**
   * @param {L} left
   * @param {R} right
   */
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
};
var create4 = (left, right) => new Pair(left, right);

// node_modules/lib0/buffer.js
var createUint8ArrayFromLen = (len) => new Uint8Array(len);
var createUint8ArrayViewFromArrayBuffer = (buffer, byteOffset, length2) => new Uint8Array(buffer, byteOffset, length2);
var createUint8ArrayFromArrayBuffer = (buffer) => new Uint8Array(buffer);
var toBase64Browser = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    s += fromCharCode(bytes[i]);
  }
  return btoa(s);
};
var toBase64Node = (bytes) => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
var fromBase64Browser = (s) => {
  const a = atob(s);
  const bytes = createUint8ArrayFromLen(a.length);
  for (let i = 0; i < a.length; i++) {
    bytes[i] = a.charCodeAt(i);
  }
  return bytes;
};
var fromBase64Node = (s) => {
  const buf = Buffer.from(s, "base64");
  return createUint8ArrayViewFromArrayBuffer(buf.buffer, buf.byteOffset, buf.byteLength);
};
var toBase64 = isBrowser ? toBase64Browser : toBase64Node;
var fromBase64 = isBrowser ? fromBase64Browser : fromBase64Node;

// node_modules/lib0/prng.js
var bool = (gen) => gen.next() >= 0.5;
var int53 = (gen, min2, max2) => floor(gen.next() * (max2 + 1 - min2) + min2);
var int32 = (gen, min2, max2) => floor(gen.next() * (max2 + 1 - min2) + min2);
var int31 = (gen, min2, max2) => int32(gen, min2, max2);
var letter = (gen) => fromCharCode(int31(gen, 97, 122));
var word = (gen, minLen = 0, maxLen = 20) => {
  const len = int31(gen, minLen, maxLen);
  let str = "";
  for (let i = 0; i < len; i++) {
    str += letter(gen);
  }
  return str;
};
var oneOf = (gen, array) => array[int31(gen, 0, array.length - 1)];

// node_modules/lib0/schema.js
var schemaSymbol = /* @__PURE__ */ Symbol("0schema");
var ValidationError = class {
  constructor() {
    this._rerrs = [];
  }
  /**
   * @param {string?} path
   * @param {string} expected
   * @param {string} has
   * @param {string?} message
   */
  extend(path, expected, has, message = null) {
    this._rerrs.push({ path, expected, has, message });
  }
  toString() {
    const s = [];
    for (let i = this._rerrs.length - 1; i > 0; i--) {
      const r = this._rerrs[i];
      s.push(repeat(" ", (this._rerrs.length - i) * 2) + `${r.path != null ? `[${r.path}] ` : ""}${r.has} doesn't match ${r.expected}. ${r.message}`);
    }
    return s.join("\n");
  }
};
var shapeExtends = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null || a.constructor !== b.constructor) return false;
  if (a[EqualityTraitSymbol]) return equals(a, b);
  if (isArray(a)) {
    return every(
      a,
      (aitem) => some(b, (bitem) => shapeExtends(aitem, bitem))
    );
  } else if (isObject(a)) {
    return every2(
      a,
      (aitem, akey) => shapeExtends(aitem, b[akey])
    );
  }
  return false;
};
var Schema = class {
  // this.shape must not be defined on Schema. Otherwise typecheck on metatypes (e.g. $$object) won't work as expected anymore
  /**
   * If true, the more things are added to the shape the more objects this schema will accept (e.g.
   * union). By default, the more objects are added, the the fewer objects this schema will accept.
   * @protected
   */
  static _dilutes = false;
  /**
   * @param {Schema<any>} other
   */
  extends(other) {
    let [a, b] = [
      /** @type {any} */
      this.shape,
      /** @type {any} */
      other.shape
    ];
    if (
      /** @type {typeof Schema<any>} */
      this.constructor._dilutes
    ) [b, a] = [a, b];
    return shapeExtends(a, b);
  }
  /**
   * Overwrite this when necessary. By default, we only check the `shape` property which every shape
   * should have.
   * @param {Schema<any>} other
   */
  equals(other) {
    return this.constructor === other.constructor && equalityDeep(this.shape, other.shape);
  }
  [schemaSymbol]() {
    return true;
  }
  /**
   * @param {object} other
   */
  [EqualityTraitSymbol](other) {
    return this.equals(
      /** @type {any} */
      other
    );
  }
  /**
   * Use `schema.validate(obj)` with a typed parameter that is already of typed to be an instance of
   * Schema. Validate will check the structure of the parameter and return true iff the instance
   * really is an instance of Schema.
   *
   * @param {T} o
   * @return {boolean}
   */
  validate(o) {
    return this.check(o);
  }
  /* c8 ignore start */
  /**
   * Similar to validate, but this method accepts untyped parameters.
   *
   * @param {any} _o
   * @param {ValidationError} [_err]
   * @return {_o is T}
   */
  check(_o, _err) {
    methodUnimplemented();
  }
  /* c8 ignore stop */
  /**
   * @type {Schema<T?>}
   */
  get nullable() {
    return $union(this, $null);
  }
  /**
   * @type {$Optional<Schema<T>>}
   */
  get optional() {
    return new $Optional(
      /** @type {Schema<T>} */
      this
    );
  }
  /**
   * Cast a variable to a specific type. Returns the casted value, or throws an exception otherwise.
   * Use this if you know that the type is of a specific type and you just want to convince the type
   * system.
   *
   * **Do not rely on these error messages!**
   * Performs an assertion check only if not in a production environment.
   *
   * @template OO
   * @param {OO} o
   * @return {Extract<OO, T> extends never ? T : (OO extends Array<never> ? T : Extract<OO,T>)}
   */
  cast(o) {
    assert(o, this);
    return (
      /** @type {any} */
      o
    );
  }
  /**
   * EXPECTO PATRONUM!! 🪄
   * This function protects against type errors. Though it may not work in the real world.
   *
   * "After all this time?"
   * "Always." - Snape, talking about type safety
   *
   * Ensures that a variable is a a specific type. Returns the value, or throws an exception if the assertion check failed.
   * Use this if you know that the type is of a specific type and you just want to convince the type
   * system.
   *
   * Can be useful when defining lambdas: `s.lambda(s.$number, s.$void).expect((n) => n + 1)`
   *
   * **Do not rely on these error messages!**
   * Performs an assertion check if not in a production environment.
   *
   * @param {T} o
   * @return {o extends T ? T : never}
   */
  expect(o) {
    assert(o, this);
    return o;
  }
};
var $ConstructedBy = class extends Schema {
  /**
   * @param {C} c
   * @param {((o:Instance<C>)=>boolean)|null} check
   */
  constructor(c, check) {
    super();
    this.shape = c;
    this._c = check;
  }
  /**
   * @param {any} o
   * @param {ValidationError} [err]
   * @return {o is C extends ((...args:any[]) => infer T) ? T : (C extends (new (...args:any[]) => any) ? InstanceType<C> : never)} o
   */
  check(o, err = void 0) {
    const c = o?.constructor === this.shape && (this._c == null || this._c(o));
    !c && err?.extend(null, this.shape.name, o?.constructor.name, o?.constructor !== this.shape ? "Constructor match failed" : "Check failed");
    return c;
  }
};
var $constructedBy = (c, check = null) => new $ConstructedBy(c, check);
var $$constructedBy = $constructedBy($ConstructedBy);
var $Custom = class extends Schema {
  /**
   * @param {(o:any) => boolean} check
   */
  constructor(check) {
    super();
    this.shape = check;
  }
  /**
   * @param {any} o
   * @param {ValidationError} err
   * @return {o is any}
   */
  check(o, err) {
    const c = this.shape(o);
    !c && err?.extend(null, "custom prop", o?.constructor.name, "failed to check custom prop");
    return c;
  }
};
var $custom = (check) => new $Custom(check);
var $$custom = $constructedBy($Custom);
var $Literal = class extends Schema {
  /**
   * @param {Array<T>} literals
   */
  constructor(literals) {
    super();
    this.shape = literals;
  }
  /**
   *
   * @param {any} o
   * @param {ValidationError} [err]
   * @return {o is T}
   */
  check(o, err) {
    const c = this.shape.some((a) => a === o);
    !c && err?.extend(null, this.shape.join(" | "), o.toString());
    return c;
  }
};
var $literal = (...literals) => new $Literal(literals);
var $$literal = $constructedBy($Literal);
var _regexEscape = (
  /** @type {any} */
  RegExp.escape || /** @type {(str:string) => string} */
  ((str) => str.replace(/[().|&,$^[\]]/g, (s) => "\\" + s))
);
var _schemaStringTemplateToRegex = (s) => {
  if ($string.check(s)) {
    return [_regexEscape(s)];
  }
  if ($$literal.check(s)) {
    return (
      /** @type {Array<string|number>} */
      s.shape.map((v) => v + "")
    );
  }
  if ($$number.check(s)) {
    return ["[+-]?\\d+.?\\d*"];
  }
  if ($$string.check(s)) {
    return [".*"];
  }
  if ($$union.check(s)) {
    return s.shape.map(_schemaStringTemplateToRegex).flat(1);
  }
  unexpectedCase();
};
var $StringTemplate = class extends Schema {
  /**
   * @param {T} shape
   */
  constructor(shape) {
    super();
    this.shape = shape;
    this._r = new RegExp("^" + shape.map(_schemaStringTemplateToRegex).map((opts) => `(${opts.join("|")})`).join("") + "$");
  }
  /**
   * @param {any} o
   * @param {ValidationError} [err]
   * @return {o is CastStringTemplateArgsToTemplate<T>}
   */
  check(o, err) {
    const c = this._r.exec(o) != null;
    !c && err?.extend(null, this._r.toString(), o.toString(), "String doesn't match string template.");
    return c;
  }
};
var $$stringTemplate = $constructedBy($StringTemplate);
var isOptionalSymbol = /* @__PURE__ */ Symbol("optional");
var $Optional = class extends Schema {
  /**
   * @param {S} shape
   */
  constructor(shape) {
    super();
    this.shape = shape;
  }
  /**
   * @param {any} o
   * @param {ValidationError} [err]
   * @return {o is (Unwrap<S>|undefined)}
   */
  check(o, err) {
    const c = o === void 0 || this.shape.check(o);
    !c && err?.extend(null, "undefined (optional)", "()");
    return c;
  }
  get [isOptionalSymbol]() {
    return true;
  }
};
var $$optional = $constructedBy($Optional);
var $Never = class extends Schema {
  /**
   * @param {any} _o
   * @param {ValidationError} [err]
   * @return {_o is never}
   */
  check(_o, err) {
    err?.extend(null, "never", typeof _o);
    return false;
  }
};
var $never = new $Never();
var $$never = $constructedBy($Never);
var $Object = class _$Object extends Schema {
  /**
   * @param {S} shape
   * @param {boolean} partial
   */
  constructor(shape, partial = false) {
    super();
    this.shape = shape;
    this._isPartial = partial;
  }
  static _dilutes = true;
  /**
   * @type {Schema<Partial<$ObjectToType<S>>>}
   */
  get partial() {
    return new _$Object(this.shape, true);
  }
  /**
   * @param {any} o
   * @param {ValidationError} err
   * @return {o is $ObjectToType<S>}
   */
  check(o, err) {
    if (o == null) {
      err?.extend(null, "object", "null");
      return false;
    }
    return every2(this.shape, (vv, vk) => {
      const c = this._isPartial && !hasProperty(o, vk) || vv.check(o[vk], err);
      !c && err?.extend(vk.toString(), vv.toString(), typeof o[vk], "Object property does not match");
      return c;
    });
  }
};
var $object = (def) => (
  /** @type {any} */
  new $Object(def)
);
var $$object = $constructedBy($Object);
var $objectAny = $custom((o) => o != null && (o.constructor === Object || o.constructor == null));
var $Record = class extends Schema {
  /**
   * @param {Keys} keys
   * @param {Values} values
   */
  constructor(keys2, values) {
    super();
    this.shape = {
      keys: keys2,
      values
    };
  }
  /**
   * @param {any} o
   * @param {ValidationError} err
   * @return {o is { [key in Unwrap<Keys>]: Unwrap<Values> }}
   */
  check(o, err) {
    return o != null && every2(o, (vv, vk) => {
      const ck = this.shape.keys.check(vk, err);
      !ck && err?.extend(vk + "", "Record", typeof o, ck ? "Key doesn't match schema" : "Value doesn't match value");
      return ck && this.shape.values.check(vv, err);
    });
  }
};
var $record = (keys2, values) => new $Record(keys2, values);
var $$record = $constructedBy($Record);
var $Tuple = class extends Schema {
  /**
   * @param {S} shape
   */
  constructor(shape) {
    super();
    this.shape = shape;
  }
  /**
   * @param {any} o
   * @param {ValidationError} err
   * @return {o is { [K in keyof S]: S[K] extends Schema<infer Type> ? Type : never }}
   */
  check(o, err) {
    return o != null && every2(this.shape, (vv, vk) => {
      const c = (
        /** @type {Schema<any>} */
        vv.check(o[vk], err)
      );
      !c && err?.extend(vk.toString(), "Tuple", typeof vv);
      return c;
    });
  }
};
var $tuple = (...def) => new $Tuple(def);
var $$tuple = $constructedBy($Tuple);
var $Array = class extends Schema {
  /**
   * @param {Array<S>} v
   */
  constructor(v) {
    super();
    this.shape = v.length === 1 ? v[0] : new $Union(v);
  }
  /**
   * @param {any} o
   * @param {ValidationError} [err]
   * @return {o is Array<S extends Schema<infer T> ? T : never>} o
   */
  check(o, err) {
    const c = isArray(o) && every(o, (oi) => this.shape.check(oi));
    !c && err?.extend(null, "Array", "");
    return c;
  }
};
var $array = (...def) => new $Array(def);
var $$array = $constructedBy($Array);
var $arrayAny = $custom((o) => isArray(o));
var $InstanceOf = class extends Schema {
  /**
   * @param {new (...args:any) => T} constructor
   * @param {((o:T) => boolean)|null} check
   */
  constructor(constructor, check) {
    super();
    this.shape = constructor;
    this._c = check;
  }
  /**
   * @param {any} o
   * @param {ValidationError} err
   * @return {o is T}
   */
  check(o, err) {
    const c = o instanceof this.shape && (this._c == null || this._c(o));
    !c && err?.extend(null, this.shape.name, o?.constructor.name);
    return c;
  }
};
var $instanceOf = (c, check = null) => new $InstanceOf(c, check);
var $$instanceOf = $constructedBy($InstanceOf);
var $$schema = $instanceOf(Schema);
var $Lambda = class extends Schema {
  /**
   * @param {Args} args
   */
  constructor(args2) {
    super();
    this.len = args2.length - 1;
    this.args = $tuple(...args2.slice(-1));
    this.res = args2[this.len];
  }
  /**
   * @param {any} f
   * @param {ValidationError} err
   * @return {f is _LArgsToLambdaDef<Args>}
   */
  check(f, err) {
    const c = f.constructor === Function && f.length <= this.len;
    !c && err?.extend(null, "function", typeof f);
    return c;
  }
};
var $$lambda = $constructedBy($Lambda);
var $function = $custom((o) => typeof o === "function");
var $Intersection = class extends Schema {
  /**
   * @param {T} v
   */
  constructor(v) {
    super();
    this.shape = v;
  }
  /**
   * @param {any} o
   * @param {ValidationError} [err]
   * @return {o is Intersect<UnwrapArray<T>>}
   */
  check(o, err) {
    const c = every(this.shape, (check) => check.check(o, err));
    !c && err?.extend(null, "Intersectinon", typeof o);
    return c;
  }
};
var $$intersect = $constructedBy($Intersection, (o) => o.shape.length > 0);
var $Union = class extends Schema {
  static _dilutes = true;
  /**
   * @param {Array<Schema<S>>} v
   */
  constructor(v) {
    super();
    this.shape = v;
  }
  /**
   * @param {any} o
   * @param {ValidationError} [err]
   * @return {o is S}
   */
  check(o, err) {
    const c = some(this.shape, (vv) => vv.check(o, err));
    err?.extend(null, "Union", typeof o);
    return c;
  }
};
var $union = (...schemas) => schemas.findIndex(($s) => $$union.check($s)) >= 0 ? $union(...schemas.map(($s) => $($s)).map(($s) => $$union.check($s) ? $s.shape : [$s]).flat(1)) : schemas.length === 1 ? schemas[0] : new $Union(schemas);
var $$union = (
  /** @type {Schema<$Union<any>>} */
  $constructedBy($Union)
);
var _t = () => true;
var $any = $custom(_t);
var $$any = (
  /** @type {Schema<Schema<any>>} */
  $constructedBy($Custom, (o) => o.shape === _t)
);
var $bigint = $custom((o) => typeof o === "bigint");
var $$bigint = (
  /** @type {Schema<Schema<BigInt>>} */
  $custom((o) => o === $bigint)
);
var $symbol = $custom((o) => typeof o === "symbol");
var $$symbol = (
  /** @type {Schema<Schema<Symbol>>} */
  $custom((o) => o === $symbol)
);
var $number = $custom((o) => typeof o === "number");
var $$number = (
  /** @type {Schema<Schema<number>>} */
  $custom((o) => o === $number)
);
var $string = $custom((o) => typeof o === "string");
var $$string = (
  /** @type {Schema<Schema<string>>} */
  $custom((o) => o === $string)
);
var $boolean = $custom((o) => typeof o === "boolean");
var $$boolean = (
  /** @type {Schema<Schema<Boolean>>} */
  $custom((o) => o === $boolean)
);
var $undefined = $literal(void 0);
var $$undefined = (
  /** @type {Schema<Schema<undefined>>} */
  $constructedBy($Literal, (o) => o.shape.length === 1 && o.shape[0] === void 0)
);
var $void = $literal(void 0);
var $null = $literal(null);
var $$null = (
  /** @type {Schema<Schema<null>>} */
  $constructedBy($Literal, (o) => o.shape.length === 1 && o.shape[0] === null)
);
var $uint8Array = $constructedBy(Uint8Array);
var $$uint8Array = (
  /** @type {Schema<Schema<Uint8Array>>} */
  $constructedBy($ConstructedBy, (o) => o.shape === Uint8Array)
);
var $primitive = $union($number, $string, $null, $undefined, $bigint, $boolean, $symbol);
var $json = (() => {
  const $jsonArr = (
    /** @type {$Array<$any>} */
    $array($any)
  );
  const $jsonRecord = (
    /** @type {$Record<$string,$any>} */
    $record($string, $any)
  );
  const $json2 = $union($number, $string, $null, $boolean, $jsonArr, $jsonRecord);
  $jsonArr.shape = $json2;
  $jsonRecord.shape.values = $json2;
  return $json2;
})();
var $ = (o) => {
  if ($$schema.check(o)) {
    return (
      /** @type {any} */
      o
    );
  } else if ($objectAny.check(o)) {
    const o2 = {};
    for (const k in o) {
      o2[k] = $(o[k]);
    }
    return (
      /** @type {any} */
      $object(o2)
    );
  } else if ($arrayAny.check(o)) {
    return (
      /** @type {any} */
      $union(...o.map($))
    );
  } else if ($primitive.check(o)) {
    return (
      /** @type {any} */
      $literal(o)
    );
  } else if ($function.check(o)) {
    return (
      /** @type {any} */
      $constructedBy(
        /** @type {any} */
        o
      )
    );
  }
  unexpectedCase();
};
var assert = production ? () => {
} : (o, schema) => {
  const err = new ValidationError();
  if (!schema.check(o, err)) {
    throw create3(`Expected value to be of type ${schema.constructor.name}.
${err.toString()}`);
  }
};
var PatternMatcher = class {
  /**
   * @param {Schema<State>} [$state]
   */
  constructor($state) {
    this.patterns = [];
    this.$state = $state;
  }
  /**
   * @template P
   * @template R
   * @param {P} pattern
   * @param {(o:NoInfer<Unwrap<ReadSchema<P>>>,s:State)=>R} handler
   * @return {PatternMatcher<State,Patterns|Pattern<Unwrap<ReadSchema<P>>,R>>}
   */
  if(pattern, handler) {
    this.patterns.push({ if: $(pattern), h: handler });
    return this;
  }
  /**
   * @template R
   * @param {(o:any,s:State)=>R} h
   */
  else(h) {
    return this.if($any, h);
  }
  /**
   * @return {State extends undefined
   *   ? <In extends Unwrap<Patterns['if']>>(o:In,state?:undefined)=>PatternMatchResult<Patterns,In>
   *   : <In extends Unwrap<Patterns['if']>>(o:In,state:State)=>PatternMatchResult<Patterns,In>}
   */
  done() {
    return (
      /** @type {any} */
      (o, s) => {
        for (let i = 0; i < this.patterns.length; i++) {
          const p = this.patterns[i];
          if (p.if.check(o)) {
            return p.h(o, s);
          }
        }
        throw create3("Unhandled pattern");
      }
    );
  }
};
var match = (state) => new PatternMatcher(
  /** @type {any} */
  state
);
var _random = (
  /** @type {any} */
  match(
    /** @type {Schema<prng.PRNG>} */
    $any
  ).if($$number, (_o, gen) => int53(gen, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER)).if($$string, (_o, gen) => word(gen)).if($$boolean, (_o, gen) => bool(gen)).if($$bigint, (_o, gen) => BigInt(int53(gen, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER))).if($$union, (o, gen) => random(gen, oneOf(gen, o.shape))).if($$object, (o, gen) => {
    const res = {};
    for (const k in o.shape) {
      let prop = o.shape[k];
      if ($$optional.check(prop)) {
        if (bool(gen)) {
          continue;
        }
        prop = prop.shape;
      }
      res[k] = _random(prop, gen);
    }
    return res;
  }).if($$array, (o, gen) => {
    const arr = [];
    const n = int32(gen, 0, 42);
    for (let i = 0; i < n; i++) {
      arr.push(random(gen, o.shape));
    }
    return arr;
  }).if($$literal, (o, gen) => {
    return oneOf(gen, o.shape);
  }).if($$null, (o, gen) => {
    return null;
  }).if($$lambda, (o, gen) => {
    const res = random(gen, o.res);
    return () => res;
  }).if($$any, (o, gen) => random(gen, oneOf(gen, [
    $number,
    $string,
    $null,
    $undefined,
    $bigint,
    $boolean,
    $array($number),
    $record($union("a", "b", "c"), $number)
  ]))).if($$record, (o, gen) => {
    const res = {};
    const keysN = int53(gen, 0, 3);
    for (let i = 0; i < keysN; i++) {
      const key = random(gen, o.shape.keys);
      const val = random(gen, o.shape.values);
      res[key] = val;
    }
    return res;
  }).done()
);
var random = (gen, schema) => (
  /** @type {any} */
  _random($(schema), gen)
);

// node_modules/lib0/dom.js
var doc = (
  /** @type {Document} */
  typeof document !== "undefined" ? document : {}
);
var $fragment = $custom((el) => el.nodeType === DOCUMENT_FRAGMENT_NODE);
var domParser = (
  /** @type {DOMParser} */
  typeof DOMParser !== "undefined" ? new DOMParser() : null
);
var $element = $custom((el) => el.nodeType === ELEMENT_NODE);
var $text = $custom((el) => el.nodeType === TEXT_NODE);
var mapToStyleString = (m) => map(m, (value, key) => `${key}:${value};`).join("");
var ELEMENT_NODE = doc.ELEMENT_NODE;
var TEXT_NODE = doc.TEXT_NODE;
var CDATA_SECTION_NODE = doc.CDATA_SECTION_NODE;
var COMMENT_NODE = doc.COMMENT_NODE;
var DOCUMENT_NODE = doc.DOCUMENT_NODE;
var DOCUMENT_TYPE_NODE = doc.DOCUMENT_TYPE_NODE;
var DOCUMENT_FRAGMENT_NODE = doc.DOCUMENT_FRAGMENT_NODE;
var $node = $custom((el) => el.nodeType === DOCUMENT_NODE);

// node_modules/lib0/json.js
var stringify = JSON.stringify;

// node_modules/lib0/symbol.js
var create5 = Symbol;

// node_modules/lib0/logging.common.js
var BOLD = create5();
var UNBOLD = create5();
var BLUE = create5();
var GREY = create5();
var GREEN = create5();
var RED = create5();
var PURPLE = create5();
var ORANGE = create5();
var UNCOLOR = create5();
var computeNoColorLoggingArgs = (args2) => {
  if (args2.length === 1 && args2[0]?.constructor === Function) {
    args2 = /** @type {Array<string|Symbol|Object|number>} */
    /** @type {[function]} */
    args2[0]();
  }
  const strBuilder = [];
  const logArgs = [];
  let i = 0;
  for (; i < args2.length; i++) {
    const arg = args2[i];
    if (arg === void 0) {
      break;
    } else if (arg.constructor === String || arg.constructor === Number) {
      strBuilder.push(arg);
    } else if (arg.constructor === Object) {
      break;
    }
  }
  if (i > 0) {
    logArgs.push(strBuilder.join(""));
  }
  for (; i < args2.length; i++) {
    const arg = args2[i];
    if (!(arg instanceof Symbol)) {
      logArgs.push(arg);
    }
  }
  return logArgs;
};
var loggingColors = [GREEN, PURPLE, ORANGE, BLUE];
var nextColor = 0;
var lastLoggingTime = getUnixTime();
var createModuleLogger = (_print, moduleName) => {
  const color = loggingColors[nextColor];
  const debugRegexVar = getVariable("log");
  const doLogging = debugRegexVar !== null && (debugRegexVar === "*" || debugRegexVar === "true" || new RegExp(debugRegexVar, "gi").test(moduleName));
  nextColor = (nextColor + 1) % loggingColors.length;
  moduleName += ": ";
  return !doLogging ? nop : (...args2) => {
    if (args2.length === 1 && args2[0]?.constructor === Function) {
      args2 = args2[0]();
    }
    const timeNow = getUnixTime();
    const timeDiff = timeNow - lastLoggingTime;
    lastLoggingTime = timeNow;
    _print(
      color,
      moduleName,
      UNCOLOR,
      ...args2.map((arg) => {
        if (arg != null && arg.constructor === Uint8Array) {
          arg = Array.from(arg);
        }
        const t = typeof arg;
        switch (t) {
          case "string":
          case "symbol":
            return arg;
          default: {
            return stringify(arg);
          }
        }
      }),
      color,
      " +" + timeDiff + "ms"
    );
  };
};

// node_modules/lib0/logging.js
var _browserStyleMap = {
  [BOLD]: create4("font-weight", "bold"),
  [UNBOLD]: create4("font-weight", "normal"),
  [BLUE]: create4("color", "blue"),
  [GREEN]: create4("color", "green"),
  [GREY]: create4("color", "grey"),
  [RED]: create4("color", "red"),
  [PURPLE]: create4("color", "purple"),
  [ORANGE]: create4("color", "orange"),
  // not well supported in chrome when debugging node with inspector - TODO: deprecate
  [UNCOLOR]: create4("color", "black")
};
var computeBrowserLoggingArgs = (args2) => {
  if (args2.length === 1 && args2[0]?.constructor === Function) {
    args2 = /** @type {Array<string|Symbol|Object|number>} */
    /** @type {[function]} */
    args2[0]();
  }
  const strBuilder = [];
  const styles = [];
  const currentStyle = create();
  let logArgs = [];
  let i = 0;
  for (; i < args2.length; i++) {
    const arg = args2[i];
    const style = _browserStyleMap[arg];
    if (style !== void 0) {
      currentStyle.set(style.left, style.right);
    } else {
      if (arg === void 0) {
        break;
      }
      if (arg.constructor === String || arg.constructor === Number) {
        const style2 = mapToStyleString(currentStyle);
        if (i > 0 || style2.length > 0) {
          strBuilder.push("%c" + arg);
          styles.push(style2);
        } else {
          strBuilder.push(arg);
        }
      } else {
        break;
      }
    }
  }
  if (i > 0) {
    logArgs = styles;
    logArgs.unshift(strBuilder.join(""));
  }
  for (; i < args2.length; i++) {
    const arg = args2[i];
    if (!(arg instanceof Symbol)) {
      logArgs.push(arg);
    }
  }
  return logArgs;
};
var computeLoggingArgs = supportsColor ? computeBrowserLoggingArgs : computeNoColorLoggingArgs;
var print = (...args2) => {
  console.log(...computeLoggingArgs(args2));
  vconsoles.forEach((vc) => vc.print(args2));
};
var vconsoles = create2();
var createModuleLogger2 = (moduleName) => createModuleLogger(print, moduleName);

// node_modules/lib0/promise.js
var all = Promise.all.bind(Promise);
var reject = (reason) => Promise.reject(reason);
var resolve = (res) => Promise.resolve(res);

// node_modules/lib0/broadcastchannel.js
var channels = /* @__PURE__ */ new Map();
var LocalStoragePolyfill = class {
  /**
   * @param {string} room
   */
  constructor(room) {
    this.room = room;
    this.onmessage = null;
    this._onChange = (e) => e.key === room && this.onmessage !== null && this.onmessage({ data: fromBase64(e.newValue || "") });
    onChange(this._onChange);
  }
  /**
   * @param {ArrayBuffer} buf
   */
  postMessage(buf) {
    varStorage.setItem(this.room, toBase64(createUint8ArrayFromArrayBuffer(buf)));
  }
  close() {
    offChange(this._onChange);
  }
};
var BC = typeof BroadcastChannel === "undefined" ? LocalStoragePolyfill : BroadcastChannel;
var getChannel = (room) => setIfUndefined(channels, room, () => {
  const subs = create2();
  const bc = new BC(room);
  bc.onmessage = (e) => subs.forEach((sub) => sub(e.data, "broadcastchannel"));
  return {
    bc,
    subs
  };
});
var subscribe = (room, f) => {
  getChannel(room).subs.add(f);
  return f;
};
var unsubscribe = (room, f) => {
  const channel = getChannel(room);
  const unsubscribed = channel.subs.delete(f);
  if (unsubscribed && channel.subs.size === 0) {
    channel.bc.close();
    channels.delete(room);
  }
  return unsubscribed;
};
var publish = (room, data, origin = null) => {
  const c = getChannel(room);
  c.bc.postMessage(data);
  c.subs.forEach((sub) => sub(data, origin));
};

// node_modules/lib0/mutex.js
var createMutex = () => {
  let token = true;
  return (f, g) => {
    if (token) {
      token = false;
      try {
        f();
      } finally {
        token = true;
      }
    } else if (g !== void 0) {
      g();
    }
  };
};

// node_modules/y-webrtc/src/y-webrtc.js
var import_simplepeer_min = __toESM(require_simplepeer_min(), 1);
import * as Y3 from "yjs";

// node_modules/y-protocols/sync.js
import * as Y from "yjs";
var messageYjsSyncStep1 = 0;
var messageYjsSyncStep2 = 1;
var messageYjsUpdate = 2;
var writeSyncStep1 = (encoder, doc2) => {
  writeVarUint(encoder, messageYjsSyncStep1);
  const sv = Y.encodeStateVector(doc2);
  writeVarUint8Array(encoder, sv);
};
var writeSyncStep2 = (encoder, doc2, encodedStateVector) => {
  writeVarUint(encoder, messageYjsSyncStep2);
  writeVarUint8Array(encoder, Y.encodeStateAsUpdate(doc2, encodedStateVector));
};
var readSyncStep1 = (decoder, encoder, doc2) => writeSyncStep2(encoder, doc2, readVarUint8Array(decoder));
var readSyncStep2 = (decoder, doc2, transactionOrigin, errorHandler) => {
  try {
    Y.applyUpdate(doc2, readVarUint8Array(decoder), transactionOrigin);
  } catch (error) {
    if (errorHandler != null) errorHandler(
      /** @type {Error} */
      error
    );
    console.error("Caught error while handling a Yjs update", error);
  }
};
var writeUpdate = (encoder, update) => {
  writeVarUint(encoder, messageYjsUpdate);
  writeVarUint8Array(encoder, update);
};
var readUpdate = readSyncStep2;
var readSyncMessage = (decoder, encoder, doc2, transactionOrigin, errorHandler) => {
  const messageType = readVarUint(decoder);
  switch (messageType) {
    case messageYjsSyncStep1:
      readSyncStep1(decoder, encoder, doc2);
      break;
    case messageYjsSyncStep2:
      readSyncStep2(decoder, doc2, transactionOrigin, errorHandler);
      break;
    case messageYjsUpdate:
      readUpdate(decoder, doc2, transactionOrigin, errorHandler);
      break;
    default:
      throw new Error("Unknown message type");
  }
  return messageType;
};

// node_modules/y-protocols/awareness.js
import * as Y2 from "yjs";
var outdatedTimeout = 3e4;
var Awareness = class extends Observable {
  /**
   * @param {Y.Doc} doc
   */
  constructor(doc2) {
    super();
    this.doc = doc2;
    this.clientID = doc2.clientID;
    this.states = /* @__PURE__ */ new Map();
    this.meta = /* @__PURE__ */ new Map();
    this._checkInterval = /** @type {any} */
    setInterval(() => {
      const now = getUnixTime();
      if (this.getLocalState() !== null && outdatedTimeout / 2 <= now - /** @type {{lastUpdated:number}} */
      this.meta.get(this.clientID).lastUpdated) {
        this.setLocalState(this.getLocalState());
      }
      const remove = [];
      this.meta.forEach((meta, clientid) => {
        if (clientid !== this.clientID && outdatedTimeout <= now - meta.lastUpdated && this.states.has(clientid)) {
          remove.push(clientid);
        }
      });
      if (remove.length > 0) {
        removeAwarenessStates(this, remove, "timeout");
      }
    }, floor(outdatedTimeout / 10));
    doc2.on("destroy", () => {
      this.destroy();
    });
    this.setLocalState({});
  }
  destroy() {
    this.emit("destroy", [this]);
    this.setLocalState(null);
    super.destroy();
    clearInterval(this._checkInterval);
  }
  /**
   * @return {Object<string,any>|null}
   */
  getLocalState() {
    return this.states.get(this.clientID) || null;
  }
  /**
   * @param {Object<string,any>|null} state
   */
  setLocalState(state) {
    const clientID = this.clientID;
    const currLocalMeta = this.meta.get(clientID);
    const clock = currLocalMeta === void 0 ? 0 : currLocalMeta.clock + 1;
    const prevState = this.states.get(clientID);
    if (state === null) {
      this.states.delete(clientID);
    } else {
      this.states.set(clientID, state);
    }
    this.meta.set(clientID, {
      clock,
      lastUpdated: getUnixTime()
    });
    const added = [];
    const updated = [];
    const filteredUpdated = [];
    const removed = [];
    if (state === null) {
      removed.push(clientID);
    } else if (prevState == null) {
      if (state != null) {
        added.push(clientID);
      }
    } else {
      updated.push(clientID);
      if (!equalityDeep(prevState, state)) {
        filteredUpdated.push(clientID);
      }
    }
    if (added.length > 0 || filteredUpdated.length > 0 || removed.length > 0) {
      this.emit("change", [{ added, updated: filteredUpdated, removed }, "local"]);
    }
    this.emit("update", [{ added, updated, removed }, "local"]);
  }
  /**
   * @param {string} field
   * @param {any} value
   */
  setLocalStateField(field, value) {
    const state = this.getLocalState();
    if (state !== null) {
      this.setLocalState({
        ...state,
        [field]: value
      });
    }
  }
  /**
   * @return {Map<number,Object<string,any>>}
   */
  getStates() {
    return this.states;
  }
};
var removeAwarenessStates = (awareness, clients, origin) => {
  const removed = [];
  for (let i = 0; i < clients.length; i++) {
    const clientID = clients[i];
    if (awareness.states.has(clientID)) {
      awareness.states.delete(clientID);
      if (clientID === awareness.clientID) {
        const curMeta = (
          /** @type {MetaClientState} */
          awareness.meta.get(clientID)
        );
        awareness.meta.set(clientID, {
          clock: curMeta.clock + 1,
          lastUpdated: getUnixTime()
        });
      }
      removed.push(clientID);
    }
  }
  if (removed.length > 0) {
    awareness.emit("change", [{ added: [], updated: [], removed }, origin]);
    awareness.emit("update", [{ added: [], updated: [], removed }, origin]);
  }
};
var encodeAwarenessUpdate = (awareness, clients, states = awareness.states) => {
  const len = clients.length;
  const encoder = createEncoder();
  writeVarUint(encoder, len);
  for (let i = 0; i < len; i++) {
    const clientID = clients[i];
    const state = states.get(clientID) || null;
    const clock = (
      /** @type {MetaClientState} */
      awareness.meta.get(clientID).clock
    );
    writeVarUint(encoder, clientID);
    writeVarUint(encoder, clock);
    writeVarString(encoder, JSON.stringify(state));
  }
  return toUint8Array(encoder);
};
var applyAwarenessUpdate = (awareness, update, origin) => {
  const decoder = createDecoder(update);
  const timestamp = getUnixTime();
  const added = [];
  const updated = [];
  const filteredUpdated = [];
  const removed = [];
  const len = readVarUint(decoder);
  for (let i = 0; i < len; i++) {
    const clientID = readVarUint(decoder);
    let clock = readVarUint(decoder);
    const state = JSON.parse(readVarString(decoder));
    const clientMeta = awareness.meta.get(clientID);
    const prevState = awareness.states.get(clientID);
    const currClock = clientMeta === void 0 ? 0 : clientMeta.clock;
    if (currClock < clock || currClock === clock && state === null && awareness.states.has(clientID)) {
      if (state === null) {
        if (clientID === awareness.clientID && awareness.getLocalState() != null) {
          clock++;
        } else {
          awareness.states.delete(clientID);
        }
      } else {
        awareness.states.set(clientID, state);
      }
      awareness.meta.set(clientID, {
        clock,
        lastUpdated: timestamp
      });
      if (clientMeta === void 0 && state !== null) {
        added.push(clientID);
      } else if (clientMeta !== void 0 && state === null) {
        removed.push(clientID);
      } else if (state !== null) {
        if (!equalityDeep(state, prevState)) {
          filteredUpdated.push(clientID);
        }
        updated.push(clientID);
      }
    }
  }
  if (added.length > 0 || filteredUpdated.length > 0 || removed.length > 0) {
    awareness.emit("change", [{
      added,
      updated: filteredUpdated,
      removed
    }, origin]);
  }
  if (added.length > 0 || updated.length > 0 || removed.length > 0) {
    awareness.emit("update", [{
      added,
      updated,
      removed
    }, origin]);
  }
};

// node_modules/y-webrtc/src/crypto.js
var deriveKey = (secret, roomName) => {
  const secretBuffer = encodeUtf8(secret).buffer;
  const salt = encodeUtf8(roomName).buffer;
  return crypto.subtle.importKey(
    "raw",
    secretBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  ).then(
    (keyMaterial) => crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 1e5,
        hash: "SHA-256"
      },
      keyMaterial,
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    )
  );
};
var encrypt = (data, key) => {
  if (!key) {
    return (
      /** @type {PromiseLike<Uint8Array>} */
      resolve(data)
    );
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    data
  ).then((cipher) => {
    const encryptedDataEncoder = createEncoder();
    writeVarString(encryptedDataEncoder, "AES-GCM");
    writeVarUint8Array(encryptedDataEncoder, iv);
    writeVarUint8Array(encryptedDataEncoder, new Uint8Array(cipher));
    return toUint8Array(encryptedDataEncoder);
  });
};
var encryptJson = (data, key) => {
  const dataEncoder = createEncoder();
  writeAny(dataEncoder, data);
  return encrypt(toUint8Array(dataEncoder), key);
};
var decrypt = (data, key) => {
  if (!key) {
    return (
      /** @type {PromiseLike<Uint8Array>} */
      resolve(data)
    );
  }
  const dataDecoder = createDecoder(data);
  const algorithm = readVarString(dataDecoder);
  if (algorithm !== "AES-GCM") {
    reject(create3("Unknown encryption algorithm"));
  }
  const iv = readVarUint8Array(dataDecoder);
  const cipher = readVarUint8Array(dataDecoder);
  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    cipher
  ).then((data2) => new Uint8Array(data2));
};
var decryptJson = (data, key) => decrypt(data, key).then(
  (decryptedValue) => readAny(createDecoder(new Uint8Array(decryptedValue)))
);

// node_modules/y-webrtc/src/y-webrtc.js
var log = createModuleLogger2("y-webrtc");
var messageSync = 0;
var messageQueryAwareness = 3;
var messageAwareness = 1;
var messageBcPeerId = 4;
var signalingConns = /* @__PURE__ */ new Map();
var rooms = /* @__PURE__ */ new Map();
var checkIsSynced = (room) => {
  let synced = true;
  room.webrtcConns.forEach((peer) => {
    if (!peer.synced) {
      synced = false;
    }
  });
  if (!synced && room.synced || synced && !room.synced) {
    room.synced = synced;
    room.provider.emit("synced", [{ synced }]);
    log("synced ", BOLD, room.name, UNBOLD, " with all peers");
  }
};
var readMessage = (room, buf, syncedCallback) => {
  const decoder = createDecoder(buf);
  const encoder = createEncoder();
  const messageType = readVarUint(decoder);
  if (room === void 0) {
    return null;
  }
  const awareness = room.awareness;
  const doc2 = room.doc;
  let sendReply = false;
  switch (messageType) {
    case messageSync: {
      writeVarUint(encoder, messageSync);
      const syncMessageType = readSyncMessage(decoder, encoder, doc2, room);
      if (syncMessageType === messageYjsSyncStep2 && !room.synced) {
        syncedCallback();
      }
      if (syncMessageType === messageYjsSyncStep1) {
        sendReply = true;
      }
      break;
    }
    case messageQueryAwareness:
      writeVarUint(encoder, messageAwareness);
      writeVarUint8Array(encoder, encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys())));
      sendReply = true;
      break;
    case messageAwareness:
      applyAwarenessUpdate(awareness, readVarUint8Array(decoder), room);
      break;
    case messageBcPeerId: {
      const add = readUint8(decoder) === 1;
      const peerName = readVarString(decoder);
      if (peerName !== room.peerId && (room.bcConns.has(peerName) && !add || !room.bcConns.has(peerName) && add)) {
        const removed = [];
        const added = [];
        if (add) {
          room.bcConns.add(peerName);
          added.push(peerName);
        } else {
          room.bcConns.delete(peerName);
          removed.push(peerName);
        }
        room.provider.emit("peers", [{
          added,
          removed,
          webrtcPeers: Array.from(room.webrtcConns.keys()),
          bcPeers: Array.from(room.bcConns)
        }]);
        broadcastBcPeerId(room);
      }
      break;
    }
    default:
      console.error("Unable to compute message");
      return encoder;
  }
  if (!sendReply) {
    return null;
  }
  return encoder;
};
var readPeerMessage = (peerConn, buf) => {
  const room = peerConn.room;
  log("received message from ", BOLD, peerConn.remotePeerId, GREY, " (", room.name, ")", UNBOLD, UNCOLOR);
  return readMessage(room, buf, () => {
    peerConn.synced = true;
    log("synced ", BOLD, room.name, UNBOLD, " with ", BOLD, peerConn.remotePeerId);
    checkIsSynced(room);
  });
};
var sendWebrtcConn = (webrtcConn, encoder) => {
  log("send message to ", BOLD, webrtcConn.remotePeerId, UNBOLD, GREY, " (", webrtcConn.room.name, ")", UNCOLOR);
  try {
    webrtcConn.peer.send(toUint8Array(encoder));
  } catch (e) {
  }
};
var broadcastWebrtcConn = (room, m) => {
  log("broadcast message in ", BOLD, room.name, UNBOLD);
  room.webrtcConns.forEach((conn) => {
    try {
      conn.peer.send(m);
    } catch (e) {
    }
  });
};
var WebrtcConn = class {
  /**
   * @param {SignalingConn} signalingConn
   * @param {boolean} initiator
   * @param {string} remotePeerId
   * @param {Room} room
   */
  constructor(signalingConn, initiator, remotePeerId, room) {
    log("establishing connection to ", BOLD, remotePeerId);
    this.room = room;
    this.remotePeerId = remotePeerId;
    this.glareToken = void 0;
    this.closed = false;
    this.connected = false;
    this.synced = false;
    this.peer = new import_simplepeer_min.default({ initiator, ...room.provider.peerOpts });
    this.peer.on("signal", (signal) => {
      if (this.glareToken === void 0) {
        this.glareToken = Date.now() + Math.random();
      }
      publishSignalingMessage(signalingConn, room, { to: remotePeerId, from: room.peerId, type: "signal", token: this.glareToken, signal });
    });
    this.peer.on("connect", () => {
      log("connected to ", BOLD, remotePeerId);
      this.connected = true;
      const provider = room.provider;
      const doc2 = provider.doc;
      const awareness = room.awareness;
      const encoder = createEncoder();
      writeVarUint(encoder, messageSync);
      writeSyncStep1(encoder, doc2);
      sendWebrtcConn(this, encoder);
      const awarenessStates = awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder2 = createEncoder();
        writeVarUint(encoder2, messageAwareness);
        writeVarUint8Array(encoder2, encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys())));
        sendWebrtcConn(this, encoder2);
      }
    });
    this.peer.on("close", () => {
      this.connected = false;
      this.closed = true;
      if (room.webrtcConns.has(this.remotePeerId)) {
        room.webrtcConns.delete(this.remotePeerId);
        room.provider.emit("peers", [{
          removed: [this.remotePeerId],
          added: [],
          webrtcPeers: Array.from(room.webrtcConns.keys()),
          bcPeers: Array.from(room.bcConns)
        }]);
      }
      checkIsSynced(room);
      this.peer.destroy();
      log("closed connection to ", BOLD, remotePeerId);
      announceSignalingInfo(room);
    });
    this.peer.on("error", (err) => {
      log("Error in connection to ", BOLD, remotePeerId, ": ", err);
      announceSignalingInfo(room);
    });
    this.peer.on("data", (data) => {
      const answer = readPeerMessage(this, data);
      if (answer !== null) {
        sendWebrtcConn(this, answer);
      }
    });
  }
  destroy() {
    this.peer.destroy();
  }
};
var broadcastBcMessage = (room, m) => encrypt(m, room.key).then(
  (data) => room.mux(
    () => publish(room.name, data)
  )
);
var broadcastRoomMessage = (room, m) => {
  if (room.bcconnected) {
    broadcastBcMessage(room, m);
  }
  broadcastWebrtcConn(room, m);
};
var announceSignalingInfo = (room) => {
  signalingConns.forEach((conn) => {
    if (conn.connected) {
      conn.send({ type: "subscribe", topics: [room.name] });
      if (room.webrtcConns.size < room.provider.maxConns) {
        publishSignalingMessage(conn, room, { type: "announce", from: room.peerId });
      }
    }
  });
};
var broadcastBcPeerId = (room) => {
  if (room.provider.filterBcConns) {
    const encoderPeerIdBc = createEncoder();
    writeVarUint(encoderPeerIdBc, messageBcPeerId);
    writeUint8(encoderPeerIdBc, 1);
    writeVarString(encoderPeerIdBc, room.peerId);
    broadcastBcMessage(room, toUint8Array(encoderPeerIdBc));
  }
};
var Room = class {
  /**
   * @param {Y.Doc} doc
   * @param {WebrtcProvider} provider
   * @param {string} name
   * @param {CryptoKey|null} key
   */
  constructor(doc2, provider, name, key) {
    this.peerId = uuidv4();
    this.doc = doc2;
    this.awareness = provider.awareness;
    this.provider = provider;
    this.synced = false;
    this.name = name;
    this.key = key;
    this.webrtcConns = /* @__PURE__ */ new Map();
    this.bcConns = /* @__PURE__ */ new Set();
    this.mux = createMutex();
    this.bcconnected = false;
    this._bcSubscriber = (data) => decrypt(new Uint8Array(data), key).then(
      (m) => this.mux(() => {
        const reply = readMessage(this, m, () => {
        });
        if (reply) {
          broadcastBcMessage(this, toUint8Array(reply));
        }
      })
    );
    this._docUpdateHandler = (update, _origin) => {
      const encoder = createEncoder();
      writeVarUint(encoder, messageSync);
      writeUpdate(encoder, update);
      broadcastRoomMessage(this, toUint8Array(encoder));
    };
    this._awarenessUpdateHandler = ({ added, updated, removed }, _origin) => {
      const changedClients = added.concat(updated).concat(removed);
      const encoderAwareness = createEncoder();
      writeVarUint(encoderAwareness, messageAwareness);
      writeVarUint8Array(encoderAwareness, encodeAwarenessUpdate(this.awareness, changedClients));
      broadcastRoomMessage(this, toUint8Array(encoderAwareness));
    };
    this._beforeUnloadHandler = () => {
      removeAwarenessStates(this.awareness, [doc2.clientID], "window unload");
      rooms.forEach((room) => {
        room.disconnect();
      });
    };
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this._beforeUnloadHandler);
    } else if (typeof process !== "undefined") {
      process.on("exit", this._beforeUnloadHandler);
    }
  }
  connect() {
    this.doc.on("update", this._docUpdateHandler);
    this.awareness.on("update", this._awarenessUpdateHandler);
    announceSignalingInfo(this);
    const roomName = this.name;
    subscribe(roomName, this._bcSubscriber);
    this.bcconnected = true;
    broadcastBcPeerId(this);
    const encoderSync = createEncoder();
    writeVarUint(encoderSync, messageSync);
    writeSyncStep1(encoderSync, this.doc);
    broadcastBcMessage(this, toUint8Array(encoderSync));
    const encoderState = createEncoder();
    writeVarUint(encoderState, messageSync);
    writeSyncStep2(encoderState, this.doc);
    broadcastBcMessage(this, toUint8Array(encoderState));
    const encoderAwarenessQuery = createEncoder();
    writeVarUint(encoderAwarenessQuery, messageQueryAwareness);
    broadcastBcMessage(this, toUint8Array(encoderAwarenessQuery));
    const encoderAwarenessState = createEncoder();
    writeVarUint(encoderAwarenessState, messageAwareness);
    writeVarUint8Array(encoderAwarenessState, encodeAwarenessUpdate(this.awareness, [this.doc.clientID]));
    broadcastBcMessage(this, toUint8Array(encoderAwarenessState));
  }
  disconnect() {
    signalingConns.forEach((conn) => {
      if (conn.connected) {
        conn.send({ type: "unsubscribe", topics: [this.name] });
      }
    });
    removeAwarenessStates(this.awareness, [this.doc.clientID], "disconnect");
    const encoderPeerIdBc = createEncoder();
    writeVarUint(encoderPeerIdBc, messageBcPeerId);
    writeUint8(encoderPeerIdBc, 0);
    writeVarString(encoderPeerIdBc, this.peerId);
    broadcastBcMessage(this, toUint8Array(encoderPeerIdBc));
    unsubscribe(this.name, this._bcSubscriber);
    this.bcconnected = false;
    this.doc.off("update", this._docUpdateHandler);
    this.awareness.off("update", this._awarenessUpdateHandler);
    this.webrtcConns.forEach((conn) => conn.destroy());
  }
  destroy() {
    this.disconnect();
    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", this._beforeUnloadHandler);
    } else if (typeof process !== "undefined") {
      process.off("exit", this._beforeUnloadHandler);
    }
  }
};
var openRoom = (doc2, provider, name, key) => {
  if (rooms.has(name)) {
    throw create3(`A Yjs Doc connected to room "${name}" already exists!`);
  }
  const room = new Room(doc2, provider, name, key);
  rooms.set(
    name,
    /** @type {Room} */
    room
  );
  return room;
};
var publishSignalingMessage = (conn, room, data) => {
  if (room.key) {
    encryptJson(data, room.key).then((data2) => {
      conn.send({ type: "publish", topic: room.name, data: toBase64(data2) });
    });
  } else {
    conn.send({ type: "publish", topic: room.name, data });
  }
};
var SignalingConn = class extends WebsocketClient {
  constructor(url) {
    super(url);
    this.providers = /* @__PURE__ */ new Set();
    this.on("connect", () => {
      log(`connected (${url})`);
      const topics = Array.from(rooms.keys());
      this.send({ type: "subscribe", topics });
      rooms.forEach(
        (room) => publishSignalingMessage(this, room, { type: "announce", from: room.peerId })
      );
    });
    this.on("message", (m) => {
      switch (m.type) {
        case "publish": {
          const roomName = m.topic;
          const room = rooms.get(roomName);
          if (room == null || typeof roomName !== "string") {
            return;
          }
          const execMessage = (data) => {
            const webrtcConns = room.webrtcConns;
            const peerId = room.peerId;
            if (data == null || data.from === peerId || data.to !== void 0 && data.to !== peerId || room.bcConns.has(data.from)) {
              return;
            }
            const emitPeerChange = webrtcConns.has(data.from) ? () => {
            } : () => room.provider.emit("peers", [{
              removed: [],
              added: [data.from],
              webrtcPeers: Array.from(room.webrtcConns.keys()),
              bcPeers: Array.from(room.bcConns)
            }]);
            switch (data.type) {
              case "announce":
                if (webrtcConns.size < room.provider.maxConns) {
                  setIfUndefined(webrtcConns, data.from, () => new WebrtcConn(this, true, data.from, room));
                  emitPeerChange();
                }
                break;
              case "signal":
                if (data.signal.type === "offer") {
                  const existingConn = webrtcConns.get(data.from);
                  if (existingConn) {
                    const remoteToken = data.token;
                    const localToken = existingConn.glareToken;
                    if (localToken && localToken > remoteToken) {
                      log("offer rejected: ", data.from);
                      return;
                    }
                    existingConn.glareToken = void 0;
                  }
                }
                if (data.signal.type === "answer") {
                  log("offer answered by: ", data.from);
                  const existingConn = webrtcConns.get(data.from);
                  existingConn.glareToken = void 0;
                }
                if (data.to === peerId) {
                  setIfUndefined(webrtcConns, data.from, () => new WebrtcConn(this, false, data.from, room)).peer.signal(data.signal);
                  emitPeerChange();
                }
                break;
            }
          };
          if (room.key) {
            if (typeof m.data === "string") {
              decryptJson(fromBase64(m.data), room.key).then(execMessage);
            }
          } else {
            execMessage(m.data);
          }
        }
      }
    });
    this.on("disconnect", () => log(`disconnect (${url})`));
  }
};
var emitStatus = (provider) => {
  provider.emit("status", [{
    connected: provider.connected
  }]);
};
var WebrtcProvider = class extends ObservableV2 {
  /**
   * @param {string} roomName
   * @param {Y.Doc} doc
   * @param {ProviderOptions?} opts
   */
  constructor(roomName, doc2, {
    signaling = ["wss://y-webrtc-eu.fly.dev"],
    password = null,
    awareness = new Awareness(doc2),
    maxConns = 20 + floor(rand() * 15),
    // the random factor reduces the chance that n clients form a cluster
    filterBcConns = true,
    peerOpts = {}
    // simple-peer options. See https://github.com/feross/simple-peer#peer--new-peeropts
  } = {}) {
    super();
    this.roomName = roomName;
    this.doc = doc2;
    this.filterBcConns = filterBcConns;
    this.awareness = awareness;
    this.shouldConnect = false;
    this.signalingUrls = signaling;
    this.signalingConns = [];
    this.maxConns = maxConns;
    this.peerOpts = peerOpts;
    this.key = password ? deriveKey(password, roomName) : (
      /** @type {PromiseLike<null>} */
      resolve(null)
    );
    this.room = null;
    this.key.then((key) => {
      this.room = openRoom(doc2, this, roomName, key);
      if (this.shouldConnect) {
        this.room.connect();
      } else {
        this.room.disconnect();
      }
      emitStatus(this);
    });
    this.connect();
    this.destroy = this.destroy.bind(this);
    doc2.on("destroy", this.destroy);
  }
  /**
   * Indicates whether the provider is looking for other peers.
   *
   * Other peers can be found via signaling servers or via broadcastchannel (cross browser-tab
   * communication). You never know when you are connected to all peers. You also don't know if
   * there are other peers. connected doesn't mean that you are connected to any physical peers
   * working on the same resource as you. It does not change unless you call provider.disconnect()
   *
   * `this.on('status', (event) => { console.log(event.connected) })`
   *
   * @type {boolean}
   */
  get connected() {
    return this.room !== null && this.shouldConnect;
  }
  connect() {
    this.shouldConnect = true;
    this.signalingUrls.forEach((url) => {
      const signalingConn = setIfUndefined(signalingConns, url, () => new SignalingConn(url));
      this.signalingConns.push(signalingConn);
      signalingConn.providers.add(this);
    });
    if (this.room) {
      this.room.connect();
      emitStatus(this);
    }
  }
  disconnect() {
    this.shouldConnect = false;
    this.signalingConns.forEach((conn) => {
      conn.providers.delete(this);
      if (conn.providers.size === 0) {
        conn.destroy();
        signalingConns.delete(conn.url);
      }
    });
    if (this.room) {
      this.room.disconnect();
      emitStatus(this);
    }
  }
  destroy() {
    this.doc.off("destroy", this.destroy);
    this.key.then(() => {
      this.room.destroy();
      rooms.delete(this.roomName);
    });
    super.destroy();
  }
};
export {
  Room,
  SignalingConn,
  WebrtcConn,
  WebrtcProvider
};
/*! Bundled license information:

simple-peer/simplepeer.min.js:
  (*!
  * The buffer module from node.js, for the browser.
  *
  * @author   Feross Aboukhadijeh <https://feross.org>
  * @license  MIT
  *)
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)
  (*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
  (*! simple-peer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL3NpbXBsZS1wZWVyL3NpbXBsZXBlZXIubWluLmpzIiwgIi4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL21hcC5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9zZXQuanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvYXJyYXkuanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvb2JzZXJ2YWJsZS5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9tYXRoLmpzIiwgIi4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL3RpbWUuanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvd2Vic29ja2V0LmpzIiwgIi4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL2Vycm9yLmpzIiwgIi4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL2JpbmFyeS5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC93ZWJjcnlwdG8uanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvcmFuZG9tLmpzIiwgIi4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL251bWJlci5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9zdHJpbmcuanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvZW5jb2RpbmcuanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvZGVjb2RpbmcuanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvY29uZGl0aW9ucy5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9zdG9yYWdlLmpzIiwgIi4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL3RyYWl0L2VxdWFsaXR5LmpzIiwgIi4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL29iamVjdC5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9mdW5jdGlvbi5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9lbnZpcm9ubWVudC5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9wYWlyLmpzIiwgIi4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL2J1ZmZlci5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9wcm5nLmpzIiwgIi4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL3NjaGVtYS5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9kb20uanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvanNvbi5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9zeW1ib2wuanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvbG9nZ2luZy5jb21tb24uanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvbG9nZ2luZy5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9wcm9taXNlLmpzIiwgIi4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL2Jyb2FkY2FzdGNoYW5uZWwuanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvbXV0ZXguanMiLCAiLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL3ktd2VicnRjL3NyYy95LXdlYnJ0Yy5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMveS1wcm90b2NvbHMvc3luYy5qcyIsICIuLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMveS1wcm90b2NvbHMvYXdhcmVuZXNzLmpzIiwgIi4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy95LXdlYnJ0Yy9zcmMvY3J5cHRvLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIoZnVuY3Rpb24oZSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBtb2R1bGUpbW9kdWxlLmV4cG9ydHM9ZSgpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShbXSxlKTtlbHNle3ZhciB0O3Q9XCJ1bmRlZmluZWRcIj09dHlwZW9mIHdpbmRvdz9cInVuZGVmaW5lZFwiPT10eXBlb2YgZ2xvYmFsP1widW5kZWZpbmVkXCI9PXR5cGVvZiBzZWxmP3RoaXM6c2VsZjpnbG9iYWw6d2luZG93LHQuU2ltcGxlUGVlcj1lKCl9fSkoZnVuY3Rpb24oKXt2YXIgdD1NYXRoLmZsb29yLG49TWF0aC5hYnMscj1NYXRoLnBvdztyZXR1cm4gZnVuY3Rpb24oKXtmdW5jdGlvbiBkKHMsZSxuKXtmdW5jdGlvbiB0KG8saSl7aWYoIWVbb10pe2lmKCFzW29dKXt2YXIgbD1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFpJiZsKXJldHVybiBsKG8sITApO2lmKHIpcmV0dXJuIHIobywhMCk7dmFyIGM9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBjLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsY312YXIgYT1lW29dPXtleHBvcnRzOnt9fTtzW29dWzBdLmNhbGwoYS5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciByPXNbb11bMV1bZV07cmV0dXJuIHQocnx8ZSl9LGEsYS5leHBvcnRzLGQscyxlLG4pfXJldHVybiBlW29dLmV4cG9ydHN9Zm9yKHZhciByPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsYT0wO2E8bi5sZW5ndGg7YSsrKXQoblthXSk7cmV0dXJuIHR9cmV0dXJuIGR9KCkoezE6W2Z1bmN0aW9uKGUsdCxuKXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gcihlKXt2YXIgdD1lLmxlbmd0aDtpZigwPHQlNCl0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0XCIpO3ZhciBuPWUuaW5kZXhPZihcIj1cIik7LTE9PT1uJiYobj10KTt2YXIgcj1uPT09dD8wOjQtbiU0O3JldHVybltuLHJdfWZ1bmN0aW9uIGEoZSx0LG4pe3JldHVybiAzKih0K24pLzQtbn1mdW5jdGlvbiBvKGUpe3ZhciB0LG4sbz1yKGUpLGQ9b1swXSxzPW9bMV0sbD1uZXcgcChhKGUsZCxzKSksYz0wLGY9MDxzP2QtNDpkO2ZvcihuPTA7bjxmO24rPTQpdD11W2UuY2hhckNvZGVBdChuKV08PDE4fHVbZS5jaGFyQ29kZUF0KG4rMSldPDwxMnx1W2UuY2hhckNvZGVBdChuKzIpXTw8Nnx1W2UuY2hhckNvZGVBdChuKzMpXSxsW2MrK109MjU1JnQ+PjE2LGxbYysrXT0yNTUmdD4+OCxsW2MrK109MjU1JnQ7cmV0dXJuIDI9PT1zJiYodD11W2UuY2hhckNvZGVBdChuKV08PDJ8dVtlLmNoYXJDb2RlQXQobisxKV0+PjQsbFtjKytdPTI1NSZ0KSwxPT09cyYmKHQ9dVtlLmNoYXJDb2RlQXQobildPDwxMHx1W2UuY2hhckNvZGVBdChuKzEpXTw8NHx1W2UuY2hhckNvZGVBdChuKzIpXT4+MixsW2MrK109MjU1JnQ+PjgsbFtjKytdPTI1NSZ0KSxsfWZ1bmN0aW9uIGQoZSl7cmV0dXJuIGNbNjMmZT4+MThdK2NbNjMmZT4+MTJdK2NbNjMmZT4+Nl0rY1s2MyZlXX1mdW5jdGlvbiBzKGUsdCxuKXtmb3IodmFyIHIsYT1bXSxvPXQ7bzxuO28rPTMpcj0oMTY3MTE2ODAmZVtvXTw8MTYpKyg2NTI4MCZlW28rMV08PDgpKygyNTUmZVtvKzJdKSxhLnB1c2goZChyKSk7cmV0dXJuIGEuam9pbihcIlwiKX1mdW5jdGlvbiBsKGUpe2Zvcih2YXIgdCxuPWUubGVuZ3RoLHI9biUzLGE9W10sbz0xNjM4MyxkPTAsbD1uLXI7ZDxsO2QrPW8pYS5wdXNoKHMoZSxkLGQrbz5sP2w6ZCtvKSk7cmV0dXJuIDE9PT1yPyh0PWVbbi0xXSxhLnB1c2goY1t0Pj4yXStjWzYzJnQ8PDRdK1wiPT1cIikpOjI9PT1yJiYodD0oZVtuLTJdPDw4KStlW24tMV0sYS5wdXNoKGNbdD4+MTBdK2NbNjMmdD4+NF0rY1s2MyZ0PDwyXStcIj1cIikpLGEuam9pbihcIlwiKX1uLmJ5dGVMZW5ndGg9ZnVuY3Rpb24oZSl7dmFyIHQ9cihlKSxuPXRbMF0sYT10WzFdO3JldHVybiAzKihuK2EpLzQtYX0sbi50b0J5dGVBcnJheT1vLG4uZnJvbUJ5dGVBcnJheT1sO2Zvcih2YXIgYz1bXSx1PVtdLHA9XCJ1bmRlZmluZWRcIj09dHlwZW9mIFVpbnQ4QXJyYXk/QXJyYXk6VWludDhBcnJheSxmPVwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrL1wiLGc9MCxfPWYubGVuZ3RoO2c8XzsrK2cpY1tnXT1mW2ddLHVbZi5jaGFyQ29kZUF0KGcpXT1nO3VbNDVdPTYyLHVbOTVdPTYzfSx7fV0sMjpbZnVuY3Rpb24oKXt9LHt9XSwzOltmdW5jdGlvbihlLHQsbil7KGZ1bmN0aW9uKCl7KGZ1bmN0aW9uKCl7LyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovJ3VzZSBzdHJpY3QnO3ZhciB0PVN0cmluZy5mcm9tQ2hhckNvZGUsbz1NYXRoLm1pbjtmdW5jdGlvbiBkKGUpe2lmKDIxNDc0ODM2NDc8ZSl0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlRoZSB2YWx1ZSBcXFwiXCIrZStcIlxcXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFxcXCJzaXplXFxcIlwiKTt2YXIgdD1uZXcgVWludDhBcnJheShlKTtyZXR1cm4gdC5fX3Byb3RvX189cy5wcm90b3R5cGUsdH1mdW5jdGlvbiBzKGUsdCxuKXtpZihcIm51bWJlclwiPT10eXBlb2YgZSl7aWYoXCJzdHJpbmdcIj09dHlwZW9mIHQpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSBcXFwic3RyaW5nXFxcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLiBSZWNlaXZlZCB0eXBlIG51bWJlclwiKTtyZXR1cm4gcChlKX1yZXR1cm4gbChlLHQsbil9ZnVuY3Rpb24gbChlLHQsbil7aWYoXCJzdHJpbmdcIj09dHlwZW9mIGUpcmV0dXJuIGYoZSx0KTtpZihBcnJheUJ1ZmZlci5pc1ZpZXcoZSkpcmV0dXJuIGcoZSk7aWYobnVsbD09ZSl0aHJvdyBUeXBlRXJyb3IoXCJUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCBvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSBcIit0eXBlb2YgZSk7aWYoSyhlLEFycmF5QnVmZmVyKXx8ZSYmSyhlLmJ1ZmZlcixBcnJheUJ1ZmZlcikpcmV0dXJuIF8oZSx0LG4pO2lmKFwibnVtYmVyXCI9PXR5cGVvZiBlKXRocm93IG5ldyBUeXBlRXJyb3IoXCJUaGUgXFxcInZhbHVlXFxcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBvZiB0eXBlIG51bWJlci4gUmVjZWl2ZWQgdHlwZSBudW1iZXJcIik7dmFyIHI9ZS52YWx1ZU9mJiZlLnZhbHVlT2YoKTtpZihudWxsIT1yJiZyIT09ZSlyZXR1cm4gcy5mcm9tKHIsdCxuKTt2YXIgYT1oKGUpO2lmKGEpcmV0dXJuIGE7aWYoXCJ1bmRlZmluZWRcIiE9dHlwZW9mIFN5bWJvbCYmbnVsbCE9U3ltYm9sLnRvUHJpbWl0aXZlJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiBlW1N5bWJvbC50b1ByaW1pdGl2ZV0pcmV0dXJuIHMuZnJvbShlW1N5bWJvbC50b1ByaW1pdGl2ZV0oXCJzdHJpbmdcIiksdCxuKTt0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgXCIrdHlwZW9mIGUpfWZ1bmN0aW9uIGMoZSl7aWYoXCJudW1iZXJcIiE9dHlwZW9mIGUpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlxcXCJzaXplXFxcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyXCIpO2Vsc2UgaWYoMD5lKXRocm93IG5ldyBSYW5nZUVycm9yKFwiVGhlIHZhbHVlIFxcXCJcIitlK1wiXFxcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXFxcInNpemVcXFwiXCIpfWZ1bmN0aW9uIHUoZSx0LG4pe3JldHVybiBjKGUpLDA+PWU/ZChlKTp2b2lkIDA9PT10P2QoZSk6XCJzdHJpbmdcIj09dHlwZW9mIG4/ZChlKS5maWxsKHQsbik6ZChlKS5maWxsKHQpfWZ1bmN0aW9uIHAoZSl7cmV0dXJuIGMoZSksZCgwPmU/MDowfG0oZSkpfWZ1bmN0aW9uIGYoZSx0KXtpZigoXCJzdHJpbmdcIiE9dHlwZW9mIHR8fFwiXCI9PT10KSYmKHQ9XCJ1dGY4XCIpLCFzLmlzRW5jb2RpbmcodCkpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlVua25vd24gZW5jb2Rpbmc6IFwiK3QpO3ZhciBuPTB8YihlLHQpLHI9ZChuKSxhPXIud3JpdGUoZSx0KTtyZXR1cm4gYSE9PW4mJihyPXIuc2xpY2UoMCxhKSkscn1mdW5jdGlvbiBnKGUpe2Zvcih2YXIgdD0wPmUubGVuZ3RoPzA6MHxtKGUubGVuZ3RoKSxuPWQodCkscj0wO3I8dDtyKz0xKW5bcl09MjU1JmVbcl07cmV0dXJuIG59ZnVuY3Rpb24gXyhlLHQsbil7aWYoMD50fHxlLmJ5dGVMZW5ndGg8dCl0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlxcXCJvZmZzZXRcXFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kc1wiKTtpZihlLmJ5dGVMZW5ndGg8dCsobnx8MCkpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJcXFwibGVuZ3RoXFxcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHNcIik7dmFyIHI7cmV0dXJuIHI9dm9pZCAwPT09dCYmdm9pZCAwPT09bj9uZXcgVWludDhBcnJheShlKTp2b2lkIDA9PT1uP25ldyBVaW50OEFycmF5KGUsdCk6bmV3IFVpbnQ4QXJyYXkoZSx0LG4pLHIuX19wcm90b19fPXMucHJvdG90eXBlLHJ9ZnVuY3Rpb24gaChlKXtpZihzLmlzQnVmZmVyKGUpKXt2YXIgdD0wfG0oZS5sZW5ndGgpLG49ZCh0KTtyZXR1cm4gMD09PW4ubGVuZ3RoP246KGUuY29weShuLDAsMCx0KSxuKX1yZXR1cm4gdm9pZCAwPT09ZS5sZW5ndGg/XCJCdWZmZXJcIj09PWUudHlwZSYmQXJyYXkuaXNBcnJheShlLmRhdGEpP2coZS5kYXRhKTp2b2lkIDA6XCJudW1iZXJcIiE9dHlwZW9mIGUubGVuZ3RofHxYKGUubGVuZ3RoKT9kKDApOmcoZSl9ZnVuY3Rpb24gbShlKXtpZihlPj0yMTQ3NDgzNjQ3KXRocm93IG5ldyBSYW5nZUVycm9yKFwiQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSBzaXplOiAweFwiKzIxNDc0ODM2NDcgLnRvU3RyaW5nKDE2KStcIiBieXRlc1wiKTtyZXR1cm4gMHxlfWZ1bmN0aW9uIGIoZSx0KXtpZihzLmlzQnVmZmVyKGUpKXJldHVybiBlLmxlbmd0aDtpZihBcnJheUJ1ZmZlci5pc1ZpZXcoZSl8fEsoZSxBcnJheUJ1ZmZlcikpcmV0dXJuIGUuYnl0ZUxlbmd0aDtpZihcInN0cmluZ1wiIT10eXBlb2YgZSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIFxcXCJzdHJpbmdcXFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIG9yIEFycmF5QnVmZmVyLiBSZWNlaXZlZCB0eXBlIFwiK3R5cGVvZiBlKTt2YXIgbj1lLmxlbmd0aCxyPTI8YXJndW1lbnRzLmxlbmd0aCYmITA9PT1hcmd1bWVudHNbMl07aWYoIXImJjA9PT1uKXJldHVybiAwO2Zvcih2YXIgYT0hMTs7KXN3aXRjaCh0KXtjYXNlXCJhc2NpaVwiOmNhc2VcImxhdGluMVwiOmNhc2VcImJpbmFyeVwiOnJldHVybiBuO2Nhc2VcInV0ZjhcIjpjYXNlXCJ1dGYtOFwiOnJldHVybiBIKGUpLmxlbmd0aDtjYXNlXCJ1Y3MyXCI6Y2FzZVwidWNzLTJcIjpjYXNlXCJ1dGYxNmxlXCI6Y2FzZVwidXRmLTE2bGVcIjpyZXR1cm4gMipuO2Nhc2VcImhleFwiOnJldHVybiBuPj4+MTtjYXNlXCJiYXNlNjRcIjpyZXR1cm4geihlKS5sZW5ndGg7ZGVmYXVsdDppZihhKXJldHVybiByPy0xOkgoZSkubGVuZ3RoO3Q9KFwiXCIrdCkudG9Mb3dlckNhc2UoKSxhPSEwO319ZnVuY3Rpb24geShlLHQsbil7dmFyIHI9ITE7aWYoKHZvaWQgMD09PXR8fDA+dCkmJih0PTApLHQ+dGhpcy5sZW5ndGgpcmV0dXJuXCJcIjtpZigodm9pZCAwPT09bnx8bj50aGlzLmxlbmd0aCkmJihuPXRoaXMubGVuZ3RoKSwwPj1uKXJldHVyblwiXCI7aWYobj4+Pj0wLHQ+Pj49MCxuPD10KXJldHVyblwiXCI7Zm9yKGV8fChlPVwidXRmOFwiKTs7KXN3aXRjaChlKXtjYXNlXCJoZXhcIjpyZXR1cm4gUCh0aGlzLHQsbik7Y2FzZVwidXRmOFwiOmNhc2VcInV0Zi04XCI6cmV0dXJuIHgodGhpcyx0LG4pO2Nhc2VcImFzY2lpXCI6cmV0dXJuIEQodGhpcyx0LG4pO2Nhc2VcImxhdGluMVwiOmNhc2VcImJpbmFyeVwiOnJldHVybiBJKHRoaXMsdCxuKTtjYXNlXCJiYXNlNjRcIjpyZXR1cm4gQSh0aGlzLHQsbik7Y2FzZVwidWNzMlwiOmNhc2VcInVjcy0yXCI6Y2FzZVwidXRmMTZsZVwiOmNhc2VcInV0Zi0xNmxlXCI6cmV0dXJuIE0odGhpcyx0LG4pO2RlZmF1bHQ6aWYocil0aHJvdyBuZXcgVHlwZUVycm9yKFwiVW5rbm93biBlbmNvZGluZzogXCIrZSk7ZT0oZStcIlwiKS50b0xvd2VyQ2FzZSgpLHI9ITA7fX1mdW5jdGlvbiBDKGUsdCxuKXt2YXIgcj1lW3RdO2VbdF09ZVtuXSxlW25dPXJ9ZnVuY3Rpb24gUihlLHQsbixyLGEpe2lmKDA9PT1lLmxlbmd0aClyZXR1cm4tMTtpZihcInN0cmluZ1wiPT10eXBlb2Ygbj8ocj1uLG49MCk6MjE0NzQ4MzY0NzxuP249MjE0NzQ4MzY0NzotMjE0NzQ4MzY0OD5uJiYobj0tMjE0NzQ4MzY0OCksbj0rbixYKG4pJiYobj1hPzA6ZS5sZW5ndGgtMSksMD5uJiYobj1lLmxlbmd0aCtuKSxuPj1lLmxlbmd0aCl7aWYoYSlyZXR1cm4tMTtuPWUubGVuZ3RoLTF9ZWxzZSBpZigwPm4paWYoYSluPTA7ZWxzZSByZXR1cm4tMTtpZihcInN0cmluZ1wiPT10eXBlb2YgdCYmKHQ9cy5mcm9tKHQscikpLHMuaXNCdWZmZXIodCkpcmV0dXJuIDA9PT10Lmxlbmd0aD8tMTpFKGUsdCxuLHIsYSk7aWYoXCJudW1iZXJcIj09dHlwZW9mIHQpcmV0dXJuIHQmPTI1NSxcImZ1bmN0aW9uXCI9PXR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mP2E/VWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGUsdCxuKTpVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGUsdCxuKTpFKGUsW3RdLG4scixhKTt0aHJvdyBuZXcgVHlwZUVycm9yKFwidmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyXCIpfWZ1bmN0aW9uIEUoZSx0LG4scixhKXtmdW5jdGlvbiBvKGUsdCl7cmV0dXJuIDE9PT1kP2VbdF06ZS5yZWFkVUludDE2QkUodCpkKX12YXIgZD0xLHM9ZS5sZW5ndGgsbD10Lmxlbmd0aDtpZih2b2lkIDAhPT1yJiYocj0ocitcIlwiKS50b0xvd2VyQ2FzZSgpLFwidWNzMlwiPT09cnx8XCJ1Y3MtMlwiPT09cnx8XCJ1dGYxNmxlXCI9PT1yfHxcInV0Zi0xNmxlXCI9PT1yKSl7aWYoMj5lLmxlbmd0aHx8Mj50Lmxlbmd0aClyZXR1cm4tMTtkPTIscy89MixsLz0yLG4vPTJ9dmFyIGM7aWYoYSl7dmFyIHU9LTE7Zm9yKGM9bjtjPHM7YysrKWlmKG8oZSxjKSE9PW8odCwtMT09PXU/MDpjLXUpKS0xIT09dSYmKGMtPWMtdSksdT0tMTtlbHNlIGlmKC0xPT09dSYmKHU9YyksYy11KzE9PT1sKXJldHVybiB1KmR9ZWxzZSBmb3IobitsPnMmJihuPXMtbCksYz1uOzA8PWM7Yy0tKXtmb3IodmFyIHA9ITAsZj0wO2Y8bDtmKyspaWYobyhlLGMrZikhPT1vKHQsZikpe3A9ITE7YnJlYWt9aWYocClyZXR1cm4gY31yZXR1cm4tMX1mdW5jdGlvbiB3KGUsdCxuLHIpe249K258fDA7dmFyIGE9ZS5sZW5ndGgtbjtyPyhyPStyLHI+YSYmKHI9YSkpOnI9YTt2YXIgbz10Lmxlbmd0aDtyPm8vMiYmKHI9by8yKTtmb3IodmFyIGQscz0wO3M8cjsrK3Mpe2lmKGQ9cGFyc2VJbnQodC5zdWJzdHIoMipzLDIpLDE2KSxYKGQpKXJldHVybiBzO2VbbitzXT1kfXJldHVybiBzfWZ1bmN0aW9uIFMoZSx0LG4scil7cmV0dXJuIEcoSCh0LGUubGVuZ3RoLW4pLGUsbixyKX1mdW5jdGlvbiBUKGUsdCxuLHIpe3JldHVybiBHKFkodCksZSxuLHIpfWZ1bmN0aW9uIHYoZSx0LG4scil7cmV0dXJuIFQoZSx0LG4scil9ZnVuY3Rpb24gayhlLHQsbixyKXtyZXR1cm4gRyh6KHQpLGUsbixyKX1mdW5jdGlvbiBMKGUsdCxuLHIpe3JldHVybiBHKFYodCxlLmxlbmd0aC1uKSxlLG4scil9ZnVuY3Rpb24gQShlLHQsbil7cmV0dXJuIDA9PT10JiZuPT09ZS5sZW5ndGg/JC5mcm9tQnl0ZUFycmF5KGUpOiQuZnJvbUJ5dGVBcnJheShlLnNsaWNlKHQsbikpfWZ1bmN0aW9uIHgoZSx0LG4pe249byhlLmxlbmd0aCxuKTtmb3IodmFyIHI9W10sYT10O2E8bjspe3ZhciBkPWVbYV0scz1udWxsLGw9MjM5PGQ/NDoyMjM8ZD8zOjE5MTxkPzI6MTtpZihhK2w8PW4pe3ZhciBjLHUscCxmOzE9PT1sPzEyOD5kJiYocz1kKToyPT09bD8oYz1lW2ErMV0sMTI4PT0oMTkyJmMpJiYoZj0oMzEmZCk8PDZ8NjMmYywxMjc8ZiYmKHM9ZikpKTozPT09bD8oYz1lW2ErMV0sdT1lW2ErMl0sMTI4PT0oMTkyJmMpJiYxMjg9PSgxOTImdSkmJihmPSgxNSZkKTw8MTJ8KDYzJmMpPDw2fDYzJnUsMjA0NzxmJiYoNTUyOTY+Znx8NTczNDM8ZikmJihzPWYpKSk6ND09PWw/KGM9ZVthKzFdLHU9ZVthKzJdLHA9ZVthKzNdLDEyOD09KDE5MiZjKSYmMTI4PT0oMTkyJnUpJiYxMjg9PSgxOTImcCkmJihmPSgxNSZkKTw8MTh8KDYzJmMpPDwxMnwoNjMmdSk8PDZ8NjMmcCw2NTUzNTxmJiYxMTE0MTEyPmYmJihzPWYpKSk6dm9pZCAwfW51bGw9PT1zPyhzPTY1NTMzLGw9MSk6NjU1MzU8cyYmKHMtPTY1NTM2LHIucHVzaCg1NTI5NnwxMDIzJnM+Pj4xMCkscz01NjMyMHwxMDIzJnMpLHIucHVzaChzKSxhKz1sfXJldHVybiBOKHIpfWZ1bmN0aW9uIE4oZSl7dmFyIG49ZS5sZW5ndGg7aWYobjw9NDA5NilyZXR1cm4gdC5hcHBseShTdHJpbmcsZSk7Zm9yKHZhciByPVwiXCIsYT0wO2E8bjspcis9dC5hcHBseShTdHJpbmcsZS5zbGljZShhLGErPTQwOTYpKTtyZXR1cm4gcn1mdW5jdGlvbiBEKGUsbixyKXt2YXIgYT1cIlwiO3I9byhlLmxlbmd0aCxyKTtmb3IodmFyIGQ9bjtkPHI7KytkKWErPXQoMTI3JmVbZF0pO3JldHVybiBhfWZ1bmN0aW9uIEkoZSxuLHIpe3ZhciBhPVwiXCI7cj1vKGUubGVuZ3RoLHIpO2Zvcih2YXIgZD1uO2Q8cjsrK2QpYSs9dChlW2RdKTtyZXR1cm4gYX1mdW5jdGlvbiBQKGUsdCxuKXt2YXIgcj1lLmxlbmd0aDsoIXR8fDA+dCkmJih0PTApLCghbnx8MD5ufHxuPnIpJiYobj1yKTtmb3IodmFyIGE9XCJcIixvPXQ7bzxuOysrbylhKz1XKGVbb10pO3JldHVybiBhfWZ1bmN0aW9uIE0oZSxuLHIpe2Zvcih2YXIgYT1lLnNsaWNlKG4sciksbz1cIlwiLGQ9MDtkPGEubGVuZ3RoO2QrPTIpbys9dChhW2RdKzI1NiphW2QrMV0pO3JldHVybiBvfWZ1bmN0aW9uIE8oZSx0LG4pe2lmKDAhPWUlMXx8MD5lKXRocm93IG5ldyBSYW5nZUVycm9yKFwib2Zmc2V0IGlzIG5vdCB1aW50XCIpO2lmKGUrdD5uKXRocm93IG5ldyBSYW5nZUVycm9yKFwiVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aFwiKX1mdW5jdGlvbiBGKGUsdCxuLHIsYSxvKXtpZighcy5pc0J1ZmZlcihlKSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiXFxcImJ1ZmZlclxcXCIgYXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZVwiKTtpZih0PmF8fHQ8byl0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlxcXCJ2YWx1ZVxcXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kc1wiKTtpZihuK3I+ZS5sZW5ndGgpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbmRleCBvdXQgb2YgcmFuZ2VcIil9ZnVuY3Rpb24gQihlLHQsbixyKXtpZihuK3I+ZS5sZW5ndGgpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbmRleCBvdXQgb2YgcmFuZ2VcIik7aWYoMD5uKXRocm93IG5ldyBSYW5nZUVycm9yKFwiSW5kZXggb3V0IG9mIHJhbmdlXCIpfWZ1bmN0aW9uIFUoZSx0LG4scixhKXtyZXR1cm4gdD0rdCxuPj4+PTAsYXx8QihlLHQsbiw0LDM0MDI4MjM0NjYzODUyODg2ZTIyLC0zNDAyODIzNDY2Mzg1Mjg4NmUyMiksSi53cml0ZShlLHQsbixyLDIzLDQpLG4rNH1mdW5jdGlvbiBqKGUsdCxuLHIsYSl7cmV0dXJuIHQ9K3Qsbj4+Pj0wLGF8fEIoZSx0LG4sOCwxNzk3NjkzMTM0ODYyMzE1N2UyOTIsLTE3OTc2OTMxMzQ4NjIzMTU3ZTI5MiksSi53cml0ZShlLHQsbixyLDUyLDgpLG4rOH1mdW5jdGlvbiBxKGUpe2lmKGU9ZS5zcGxpdChcIj1cIilbMF0sZT1lLnRyaW0oKS5yZXBsYWNlKFEsXCJcIiksMj5lLmxlbmd0aClyZXR1cm5cIlwiO2Zvcig7MCE9ZS5sZW5ndGglNDspZSs9XCI9XCI7cmV0dXJuIGV9ZnVuY3Rpb24gVyhlKXtyZXR1cm4gMTY+ZT9cIjBcIitlLnRvU3RyaW5nKDE2KTplLnRvU3RyaW5nKDE2KX1mdW5jdGlvbiBIKGUsdCl7dD10fHwxLzA7Zm9yKHZhciBuLHI9ZS5sZW5ndGgsYT1udWxsLG89W10sZD0wO2Q8cjsrK2Qpe2lmKG49ZS5jaGFyQ29kZUF0KGQpLDU1Mjk1PG4mJjU3MzQ0Pm4pe2lmKCFhKXtpZig1NjMxOTxuKXstMTwodC09MykmJm8ucHVzaCgyMzksMTkxLDE4OSk7Y29udGludWV9ZWxzZSBpZihkKzE9PT1yKXstMTwodC09MykmJm8ucHVzaCgyMzksMTkxLDE4OSk7Y29udGludWV9YT1uO2NvbnRpbnVlfWlmKDU2MzIwPm4pey0xPCh0LT0zKSYmby5wdXNoKDIzOSwxOTEsMTg5KSxhPW47Y29udGludWV9bj0oYS01NTI5Njw8MTB8bi01NjMyMCkrNjU1MzZ9ZWxzZSBhJiYtMTwodC09MykmJm8ucHVzaCgyMzksMTkxLDE4OSk7aWYoYT1udWxsLDEyOD5uKXtpZigwPih0LT0xKSlicmVhaztvLnB1c2gobil9ZWxzZSBpZigyMDQ4Pm4pe2lmKDA+KHQtPTIpKWJyZWFrO28ucHVzaCgxOTJ8bj4+NiwxMjh8NjMmbil9ZWxzZSBpZig2NTUzNj5uKXtpZigwPih0LT0zKSlicmVhaztvLnB1c2goMjI0fG4+PjEyLDEyOHw2MyZuPj42LDEyOHw2MyZuKX1lbHNlIGlmKDExMTQxMTI+bil7aWYoMD4odC09NCkpYnJlYWs7by5wdXNoKDI0MHxuPj4xOCwxMjh8NjMmbj4+MTIsMTI4fDYzJm4+PjYsMTI4fDYzJm4pfWVsc2UgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBjb2RlIHBvaW50XCIpfXJldHVybiBvfWZ1bmN0aW9uIFkoZSl7Zm9yKHZhciB0PVtdLG49MDtuPGUubGVuZ3RoOysrbil0LnB1c2goMjU1JmUuY2hhckNvZGVBdChuKSk7cmV0dXJuIHR9ZnVuY3Rpb24gVihlLHQpe2Zvcih2YXIgbixyLGEsbz1bXSxkPTA7ZDxlLmxlbmd0aCYmISgwPih0LT0yKSk7KytkKW49ZS5jaGFyQ29kZUF0KGQpLHI9bj4+OCxhPW4lMjU2LG8ucHVzaChhKSxvLnB1c2gocik7cmV0dXJuIG99ZnVuY3Rpb24geihlKXtyZXR1cm4gJC50b0J5dGVBcnJheShxKGUpKX1mdW5jdGlvbiBHKGUsdCxuLHIpe2Zvcih2YXIgYT0wO2E8ciYmIShhK24+PXQubGVuZ3RofHxhPj1lLmxlbmd0aCk7KythKXRbYStuXT1lW2FdO3JldHVybiBhfWZ1bmN0aW9uIEsoZSx0KXtyZXR1cm4gZSBpbnN0YW5jZW9mIHR8fG51bGwhPWUmJm51bGwhPWUuY29uc3RydWN0b3ImJm51bGwhPWUuY29uc3RydWN0b3IubmFtZSYmZS5jb25zdHJ1Y3Rvci5uYW1lPT09dC5uYW1lfWZ1bmN0aW9uIFgoZSl7cmV0dXJuIGUhPT1lfXZhciAkPWUoXCJiYXNlNjQtanNcIiksSj1lKFwiaWVlZTc1NFwiKTtuLkJ1ZmZlcj1zLG4uU2xvd0J1ZmZlcj1mdW5jdGlvbihlKXtyZXR1cm4rZSE9ZSYmKGU9MCkscy5hbGxvYygrZSl9LG4uSU5TUEVDVF9NQVhfQllURVM9NTA7bi5rTWF4TGVuZ3RoPTIxNDc0ODM2NDcscy5UWVBFRF9BUlJBWV9TVVBQT1JUPWZ1bmN0aW9uKCl7dHJ5e3ZhciBlPW5ldyBVaW50OEFycmF5KDEpO3JldHVybiBlLl9fcHJvdG9fXz17X19wcm90b19fOlVpbnQ4QXJyYXkucHJvdG90eXBlLGZvbzpmdW5jdGlvbigpe3JldHVybiA0Mn19LDQyPT09ZS5mb28oKX1jYXRjaCh0KXtyZXR1cm4hMX19KCkscy5UWVBFRF9BUlJBWV9TVVBQT1JUfHxcInVuZGVmaW5lZFwiPT10eXBlb2YgY29uc29sZXx8XCJmdW5jdGlvblwiIT10eXBlb2YgY29uc29sZS5lcnJvcnx8Y29uc29sZS5lcnJvcihcIlRoaXMgYnJvd3NlciBsYWNrcyB0eXBlZCBhcnJheSAoVWludDhBcnJheSkgc3VwcG9ydCB3aGljaCBpcyByZXF1aXJlZCBieSBgYnVmZmVyYCB2NS54LiBVc2UgYGJ1ZmZlcmAgdjQueCBpZiB5b3UgcmVxdWlyZSBvbGQgYnJvd3NlciBzdXBwb3J0LlwiKSxPYmplY3QuZGVmaW5lUHJvcGVydHkocy5wcm90b3R5cGUsXCJwYXJlbnRcIix7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gcy5pc0J1ZmZlcih0aGlzKT90aGlzLmJ1ZmZlcjp2b2lkIDB9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHMucHJvdG90eXBlLFwib2Zmc2V0XCIse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHMuaXNCdWZmZXIodGhpcyk/dGhpcy5ieXRlT2Zmc2V0OnZvaWQgMH19KSxcInVuZGVmaW5lZFwiIT10eXBlb2YgU3ltYm9sJiZudWxsIT1TeW1ib2wuc3BlY2llcyYmc1tTeW1ib2wuc3BlY2llc109PT1zJiZPYmplY3QuZGVmaW5lUHJvcGVydHkocyxTeW1ib2wuc3BlY2llcyx7dmFsdWU6bnVsbCxjb25maWd1cmFibGU6ITAsZW51bWVyYWJsZTohMSx3cml0YWJsZTohMX0pLHMucG9vbFNpemU9ODE5MixzLmZyb209ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBsKGUsdCxuKX0scy5wcm90b3R5cGUuX19wcm90b19fPVVpbnQ4QXJyYXkucHJvdG90eXBlLHMuX19wcm90b19fPVVpbnQ4QXJyYXkscy5hbGxvYz1mdW5jdGlvbihlLHQsbil7cmV0dXJuIHUoZSx0LG4pfSxzLmFsbG9jVW5zYWZlPWZ1bmN0aW9uKGUpe3JldHVybiBwKGUpfSxzLmFsbG9jVW5zYWZlU2xvdz1mdW5jdGlvbihlKXtyZXR1cm4gcChlKX0scy5pc0J1ZmZlcj1mdW5jdGlvbihlKXtyZXR1cm4gbnVsbCE9ZSYmITA9PT1lLl9pc0J1ZmZlciYmZSE9PXMucHJvdG90eXBlfSxzLmNvbXBhcmU9ZnVuY3Rpb24oZSx0KXtpZihLKGUsVWludDhBcnJheSkmJihlPXMuZnJvbShlLGUub2Zmc2V0LGUuYnl0ZUxlbmd0aCkpLEsodCxVaW50OEFycmF5KSYmKHQ9cy5mcm9tKHQsdC5vZmZzZXQsdC5ieXRlTGVuZ3RoKSksIXMuaXNCdWZmZXIoZSl8fCFzLmlzQnVmZmVyKHQpKXRocm93IG5ldyBUeXBlRXJyb3IoXCJUaGUgXFxcImJ1ZjFcXFwiLCBcXFwiYnVmMlxcXCIgYXJndW1lbnRzIG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXlcIik7aWYoZT09PXQpcmV0dXJuIDA7Zm9yKHZhciBuPWUubGVuZ3RoLHI9dC5sZW5ndGgsZD0wLGw9byhuLHIpO2Q8bDsrK2QpaWYoZVtkXSE9PXRbZF0pe249ZVtkXSxyPXRbZF07YnJlYWt9cmV0dXJuIG48cj8tMTpyPG4/MTowfSxzLmlzRW5jb2Rpbmc9ZnVuY3Rpb24oZSl7c3dpdGNoKChlK1wiXCIpLnRvTG93ZXJDYXNlKCkpe2Nhc2VcImhleFwiOmNhc2VcInV0ZjhcIjpjYXNlXCJ1dGYtOFwiOmNhc2VcImFzY2lpXCI6Y2FzZVwibGF0aW4xXCI6Y2FzZVwiYmluYXJ5XCI6Y2FzZVwiYmFzZTY0XCI6Y2FzZVwidWNzMlwiOmNhc2VcInVjcy0yXCI6Y2FzZVwidXRmMTZsZVwiOmNhc2VcInV0Zi0xNmxlXCI6cmV0dXJuITA7ZGVmYXVsdDpyZXR1cm4hMTt9fSxzLmNvbmNhdD1mdW5jdGlvbihlLHQpe2lmKCFBcnJheS5pc0FycmF5KGUpKXRocm93IG5ldyBUeXBlRXJyb3IoXCJcXFwibGlzdFxcXCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzXCIpO2lmKDA9PT1lLmxlbmd0aClyZXR1cm4gcy5hbGxvYygwKTt2YXIgbjtpZih0PT09dm9pZCAwKWZvcih0PTAsbj0wO248ZS5sZW5ndGg7KytuKXQrPWVbbl0ubGVuZ3RoO3ZhciByPXMuYWxsb2NVbnNhZmUodCksYT0wO2ZvcihuPTA7bjxlLmxlbmd0aDsrK24pe3ZhciBvPWVbbl07aWYoSyhvLFVpbnQ4QXJyYXkpJiYobz1zLmZyb20obykpLCFzLmlzQnVmZmVyKG8pKXRocm93IG5ldyBUeXBlRXJyb3IoXCJcXFwibGlzdFxcXCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzXCIpO28uY29weShyLGEpLGErPW8ubGVuZ3RofXJldHVybiByfSxzLmJ5dGVMZW5ndGg9YixzLnByb3RvdHlwZS5faXNCdWZmZXI9ITAscy5wcm90b3R5cGUuc3dhcDE2PWZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5sZW5ndGg7aWYoMCE9ZSUyKXRocm93IG5ldyBSYW5nZUVycm9yKFwiQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDE2LWJpdHNcIik7Zm9yKHZhciB0PTA7dDxlO3QrPTIpQyh0aGlzLHQsdCsxKTtyZXR1cm4gdGhpc30scy5wcm90b3R5cGUuc3dhcDMyPWZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5sZW5ndGg7aWYoMCE9ZSU0KXRocm93IG5ldyBSYW5nZUVycm9yKFwiQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHNcIik7Zm9yKHZhciB0PTA7dDxlO3QrPTQpQyh0aGlzLHQsdCszKSxDKHRoaXMsdCsxLHQrMik7cmV0dXJuIHRoaXN9LHMucHJvdG90eXBlLnN3YXA2ND1mdW5jdGlvbigpe3ZhciBlPXRoaXMubGVuZ3RoO2lmKDAhPWUlOCl0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkJ1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA2NC1iaXRzXCIpO2Zvcih2YXIgdD0wO3Q8ZTt0Kz04KUModGhpcyx0LHQrNyksQyh0aGlzLHQrMSx0KzYpLEModGhpcyx0KzIsdCs1KSxDKHRoaXMsdCszLHQrNCk7cmV0dXJuIHRoaXN9LHMucHJvdG90eXBlLnRvU3RyaW5nPWZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5sZW5ndGg7cmV0dXJuIDA9PT1lP1wiXCI6MD09PWFyZ3VtZW50cy5sZW5ndGg/eCh0aGlzLDAsZSk6eS5hcHBseSh0aGlzLGFyZ3VtZW50cyl9LHMucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nPXMucHJvdG90eXBlLnRvU3RyaW5nLHMucHJvdG90eXBlLmVxdWFscz1mdW5jdGlvbihlKXtpZighcy5pc0J1ZmZlcihlKSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlclwiKTtyZXR1cm4gdGhpcz09PWV8fDA9PT1zLmNvbXBhcmUodGhpcyxlKX0scy5wcm90b3R5cGUuaW5zcGVjdD1mdW5jdGlvbigpe3ZhciBlPVwiXCIsdD1uLklOU1BFQ1RfTUFYX0JZVEVTO3JldHVybiBlPXRoaXMudG9TdHJpbmcoXCJoZXhcIiwwLHQpLnJlcGxhY2UoLyguezJ9KS9nLFwiJDEgXCIpLnRyaW0oKSx0aGlzLmxlbmd0aD50JiYoZSs9XCIgLi4uIFwiKSxcIjxCdWZmZXIgXCIrZStcIj5cIn0scy5wcm90b3R5cGUuY29tcGFyZT1mdW5jdGlvbihlLHQsbixyLGEpe2lmKEsoZSxVaW50OEFycmF5KSYmKGU9cy5mcm9tKGUsZS5vZmZzZXQsZS5ieXRlTGVuZ3RoKSksIXMuaXNCdWZmZXIoZSkpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSBcXFwidGFyZ2V0XFxcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5LiBSZWNlaXZlZCB0eXBlIFwiK3R5cGVvZiBlKTtpZih2b2lkIDA9PT10JiYodD0wKSx2b2lkIDA9PT1uJiYobj1lP2UubGVuZ3RoOjApLHZvaWQgMD09PXImJihyPTApLHZvaWQgMD09PWEmJihhPXRoaXMubGVuZ3RoKSwwPnR8fG4+ZS5sZW5ndGh8fDA+cnx8YT50aGlzLmxlbmd0aCl0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIm91dCBvZiByYW5nZSBpbmRleFwiKTtpZihyPj1hJiZ0Pj1uKXJldHVybiAwO2lmKHI+PWEpcmV0dXJuLTE7aWYodD49bilyZXR1cm4gMTtpZih0Pj4+PTAsbj4+Pj0wLHI+Pj49MCxhPj4+PTAsdGhpcz09PWUpcmV0dXJuIDA7Zm9yKHZhciBkPWEtcixsPW4tdCxjPW8oZCxsKSx1PXRoaXMuc2xpY2UocixhKSxwPWUuc2xpY2UodCxuKSxmPTA7ZjxjOysrZilpZih1W2ZdIT09cFtmXSl7ZD11W2ZdLGw9cFtmXTticmVha31yZXR1cm4gZDxsPy0xOmw8ZD8xOjB9LHMucHJvdG90eXBlLmluY2x1ZGVzPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4tMSE9PXRoaXMuaW5kZXhPZihlLHQsbil9LHMucHJvdG90eXBlLmluZGV4T2Y9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBSKHRoaXMsZSx0LG4sITApfSxzLnByb3RvdHlwZS5sYXN0SW5kZXhPZj1mdW5jdGlvbihlLHQsbil7cmV0dXJuIFIodGhpcyxlLHQsbiwhMSl9LHMucHJvdG90eXBlLndyaXRlPWZ1bmN0aW9uKGUsdCxuLHIpe2lmKHZvaWQgMD09PXQpcj1cInV0ZjhcIixuPXRoaXMubGVuZ3RoLHQ9MDtlbHNlIGlmKHZvaWQgMD09PW4mJlwic3RyaW5nXCI9PXR5cGVvZiB0KXI9dCxuPXRoaXMubGVuZ3RoLHQ9MDtlbHNlIGlmKGlzRmluaXRlKHQpKXQ+Pj49MCxpc0Zpbml0ZShuKT8obj4+Pj0wLHZvaWQgMD09PXImJihyPVwidXRmOFwiKSk6KHI9bixuPXZvaWQgMCk7ZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZFwiKTt2YXIgYT10aGlzLmxlbmd0aC10O2lmKCh2b2lkIDA9PT1ufHxuPmEpJiYobj1hKSwwPGUubGVuZ3RoJiYoMD5ufHwwPnQpfHx0PnRoaXMubGVuZ3RoKXRocm93IG5ldyBSYW5nZUVycm9yKFwiQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHNcIik7cnx8KHI9XCJ1dGY4XCIpO2Zvcih2YXIgbz0hMTs7KXN3aXRjaChyKXtjYXNlXCJoZXhcIjpyZXR1cm4gdyh0aGlzLGUsdCxuKTtjYXNlXCJ1dGY4XCI6Y2FzZVwidXRmLThcIjpyZXR1cm4gUyh0aGlzLGUsdCxuKTtjYXNlXCJhc2NpaVwiOnJldHVybiBUKHRoaXMsZSx0LG4pO2Nhc2VcImxhdGluMVwiOmNhc2VcImJpbmFyeVwiOnJldHVybiB2KHRoaXMsZSx0LG4pO2Nhc2VcImJhc2U2NFwiOnJldHVybiBrKHRoaXMsZSx0LG4pO2Nhc2VcInVjczJcIjpjYXNlXCJ1Y3MtMlwiOmNhc2VcInV0ZjE2bGVcIjpjYXNlXCJ1dGYtMTZsZVwiOnJldHVybiBMKHRoaXMsZSx0LG4pO2RlZmF1bHQ6aWYobyl0aHJvdyBuZXcgVHlwZUVycm9yKFwiVW5rbm93biBlbmNvZGluZzogXCIrcik7cj0oXCJcIityKS50b0xvd2VyQ2FzZSgpLG89ITA7fX0scy5wcm90b3R5cGUudG9KU09OPWZ1bmN0aW9uKCl7cmV0dXJue3R5cGU6XCJCdWZmZXJcIixkYXRhOkFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2Fycnx8dGhpcywwKX19O3MucHJvdG90eXBlLnNsaWNlPWZ1bmN0aW9uKGUsdCl7dmFyIG49dGhpcy5sZW5ndGg7ZT1+fmUsdD10PT09dm9pZCAwP246fn50LDA+ZT8oZSs9biwwPmUmJihlPTApKTplPm4mJihlPW4pLDA+dD8odCs9biwwPnQmJih0PTApKTp0Pm4mJih0PW4pLHQ8ZSYmKHQ9ZSk7dmFyIHI9dGhpcy5zdWJhcnJheShlLHQpO3JldHVybiByLl9fcHJvdG9fXz1zLnByb3RvdHlwZSxyfSxzLnByb3RvdHlwZS5yZWFkVUludExFPWZ1bmN0aW9uKGUsdCxuKXtlPj4+PTAsdD4+Pj0wLG58fE8oZSx0LHRoaXMubGVuZ3RoKTtmb3IodmFyIHI9dGhpc1tlXSxhPTEsbz0wOysrbzx0JiYoYSo9MjU2KTspcis9dGhpc1tlK29dKmE7cmV0dXJuIHJ9LHMucHJvdG90eXBlLnJlYWRVSW50QkU9ZnVuY3Rpb24oZSx0LG4pe2U+Pj49MCx0Pj4+PTAsbnx8TyhlLHQsdGhpcy5sZW5ndGgpO2Zvcih2YXIgcj10aGlzW2UrLS10XSxhPTE7MDx0JiYoYSo9MjU2KTspcis9dGhpc1tlKy0tdF0qYTtyZXR1cm4gcn0scy5wcm90b3R5cGUucmVhZFVJbnQ4PWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsMSx0aGlzLmxlbmd0aCksdGhpc1tlXX0scy5wcm90b3R5cGUucmVhZFVJbnQxNkxFPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsMix0aGlzLmxlbmd0aCksdGhpc1tlXXx0aGlzW2UrMV08PDh9LHMucHJvdG90eXBlLnJlYWRVSW50MTZCRT1mdW5jdGlvbihlLHQpe3JldHVybiBlPj4+PTAsdHx8TyhlLDIsdGhpcy5sZW5ndGgpLHRoaXNbZV08PDh8dGhpc1tlKzFdfSxzLnByb3RvdHlwZS5yZWFkVUludDMyTEU9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZT4+Pj0wLHR8fE8oZSw0LHRoaXMubGVuZ3RoKSwodGhpc1tlXXx0aGlzW2UrMV08PDh8dGhpc1tlKzJdPDwxNikrMTY3NzcyMTYqdGhpc1tlKzNdfSxzLnByb3RvdHlwZS5yZWFkVUludDMyQkU9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZT4+Pj0wLHR8fE8oZSw0LHRoaXMubGVuZ3RoKSwxNjc3NzIxNip0aGlzW2VdKyh0aGlzW2UrMV08PDE2fHRoaXNbZSsyXTw8OHx0aGlzW2UrM10pfSxzLnByb3RvdHlwZS5yZWFkSW50TEU9ZnVuY3Rpb24oZSx0LG4pe2U+Pj49MCx0Pj4+PTAsbnx8TyhlLHQsdGhpcy5sZW5ndGgpO2Zvcih2YXIgYT10aGlzW2VdLG89MSxkPTA7KytkPHQmJihvKj0yNTYpOylhKz10aGlzW2UrZF0qbztyZXR1cm4gbyo9MTI4LGE+PW8mJihhLT1yKDIsOCp0KSksYX0scy5wcm90b3R5cGUucmVhZEludEJFPWZ1bmN0aW9uKGUsdCxuKXtlPj4+PTAsdD4+Pj0wLG58fE8oZSx0LHRoaXMubGVuZ3RoKTtmb3IodmFyIGE9dCxvPTEsZD10aGlzW2UrLS1hXTswPGEmJihvKj0yNTYpOylkKz10aGlzW2UrLS1hXSpvO3JldHVybiBvKj0xMjgsZD49byYmKGQtPXIoMiw4KnQpKSxkfSxzLnByb3RvdHlwZS5yZWFkSW50OD1mdW5jdGlvbihlLHQpe3JldHVybiBlPj4+PTAsdHx8TyhlLDEsdGhpcy5sZW5ndGgpLDEyOCZ0aGlzW2VdPy0xKigyNTUtdGhpc1tlXSsxKTp0aGlzW2VdfSxzLnByb3RvdHlwZS5yZWFkSW50MTZMRT1mdW5jdGlvbihlLHQpe2U+Pj49MCx0fHxPKGUsMix0aGlzLmxlbmd0aCk7dmFyIG49dGhpc1tlXXx0aGlzW2UrMV08PDg7cmV0dXJuIDMyNzY4Jm4/NDI5NDkwMTc2MHxuOm59LHMucHJvdG90eXBlLnJlYWRJbnQxNkJFPWZ1bmN0aW9uKGUsdCl7ZT4+Pj0wLHR8fE8oZSwyLHRoaXMubGVuZ3RoKTt2YXIgbj10aGlzW2UrMV18dGhpc1tlXTw8ODtyZXR1cm4gMzI3Njgmbj80Mjk0OTAxNzYwfG46bn0scy5wcm90b3R5cGUucmVhZEludDMyTEU9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZT4+Pj0wLHR8fE8oZSw0LHRoaXMubGVuZ3RoKSx0aGlzW2VdfHRoaXNbZSsxXTw8OHx0aGlzW2UrMl08PDE2fHRoaXNbZSszXTw8MjR9LHMucHJvdG90eXBlLnJlYWRJbnQzMkJFPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsNCx0aGlzLmxlbmd0aCksdGhpc1tlXTw8MjR8dGhpc1tlKzFdPDwxNnx0aGlzW2UrMl08PDh8dGhpc1tlKzNdfSxzLnByb3RvdHlwZS5yZWFkRmxvYXRMRT1mdW5jdGlvbihlLHQpe3JldHVybiBlPj4+PTAsdHx8TyhlLDQsdGhpcy5sZW5ndGgpLEoucmVhZCh0aGlzLGUsITAsMjMsNCl9LHMucHJvdG90eXBlLnJlYWRGbG9hdEJFPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsNCx0aGlzLmxlbmd0aCksSi5yZWFkKHRoaXMsZSwhMSwyMyw0KX0scy5wcm90b3R5cGUucmVhZERvdWJsZUxFPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsOCx0aGlzLmxlbmd0aCksSi5yZWFkKHRoaXMsZSwhMCw1Miw4KX0scy5wcm90b3R5cGUucmVhZERvdWJsZUJFPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsOCx0aGlzLmxlbmd0aCksSi5yZWFkKHRoaXMsZSwhMSw1Miw4KX0scy5wcm90b3R5cGUud3JpdGVVSW50TEU9ZnVuY3Rpb24oZSx0LG4sYSl7aWYoZT0rZSx0Pj4+PTAsbj4+Pj0wLCFhKXt2YXIgbz1yKDIsOCpuKS0xO0YodGhpcyxlLHQsbixvLDApfXZhciBkPTEscz0wO2Zvcih0aGlzW3RdPTI1NSZlOysrczxuJiYoZCo9MjU2KTspdGhpc1t0K3NdPTI1NSZlL2Q7cmV0dXJuIHQrbn0scy5wcm90b3R5cGUud3JpdGVVSW50QkU9ZnVuY3Rpb24oZSx0LG4sYSl7aWYoZT0rZSx0Pj4+PTAsbj4+Pj0wLCFhKXt2YXIgbz1yKDIsOCpuKS0xO0YodGhpcyxlLHQsbixvLDApfXZhciBkPW4tMSxzPTE7Zm9yKHRoaXNbdCtkXT0yNTUmZTswPD0tLWQmJihzKj0yNTYpOyl0aGlzW3QrZF09MjU1JmUvcztyZXR1cm4gdCtufSxzLnByb3RvdHlwZS53cml0ZVVJbnQ4PWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZT0rZSx0Pj4+PTAsbnx8Rih0aGlzLGUsdCwxLDI1NSwwKSx0aGlzW3RdPTI1NSZlLHQrMX0scy5wcm90b3R5cGUud3JpdGVVSW50MTZMRT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGU9K2UsdD4+Pj0wLG58fEYodGhpcyxlLHQsMiw2NTUzNSwwKSx0aGlzW3RdPTI1NSZlLHRoaXNbdCsxXT1lPj4+OCx0KzJ9LHMucHJvdG90eXBlLndyaXRlVUludDE2QkU9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlPStlLHQ+Pj49MCxufHxGKHRoaXMsZSx0LDIsNjU1MzUsMCksdGhpc1t0XT1lPj4+OCx0aGlzW3QrMV09MjU1JmUsdCsyfSxzLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZT0rZSx0Pj4+PTAsbnx8Rih0aGlzLGUsdCw0LDQyOTQ5NjcyOTUsMCksdGhpc1t0KzNdPWU+Pj4yNCx0aGlzW3QrMl09ZT4+PjE2LHRoaXNbdCsxXT1lPj4+OCx0aGlzW3RdPTI1NSZlLHQrNH0scy5wcm90b3R5cGUud3JpdGVVSW50MzJCRT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGU9K2UsdD4+Pj0wLG58fEYodGhpcyxlLHQsNCw0Mjk0OTY3Mjk1LDApLHRoaXNbdF09ZT4+PjI0LHRoaXNbdCsxXT1lPj4+MTYsdGhpc1t0KzJdPWU+Pj44LHRoaXNbdCszXT0yNTUmZSx0KzR9LHMucHJvdG90eXBlLndyaXRlSW50TEU9ZnVuY3Rpb24oZSx0LG4sYSl7aWYoZT0rZSx0Pj4+PTAsIWEpe3ZhciBvPXIoMiw4Km4tMSk7Rih0aGlzLGUsdCxuLG8tMSwtbyl9dmFyIGQ9MCxzPTEsbD0wO2Zvcih0aGlzW3RdPTI1NSZlOysrZDxuJiYocyo9MjU2KTspMD5lJiYwPT09bCYmMCE9PXRoaXNbdCtkLTFdJiYobD0xKSx0aGlzW3QrZF09MjU1JihlL3M+PjApLWw7cmV0dXJuIHQrbn0scy5wcm90b3R5cGUud3JpdGVJbnRCRT1mdW5jdGlvbihlLHQsbixhKXtpZihlPStlLHQ+Pj49MCwhYSl7dmFyIG89cigyLDgqbi0xKTtGKHRoaXMsZSx0LG4sby0xLC1vKX12YXIgZD1uLTEscz0xLGw9MDtmb3IodGhpc1t0K2RdPTI1NSZlOzA8PS0tZCYmKHMqPTI1Nik7KTA+ZSYmMD09PWwmJjAhPT10aGlzW3QrZCsxXSYmKGw9MSksdGhpc1t0K2RdPTI1NSYoZS9zPj4wKS1sO3JldHVybiB0K259LHMucHJvdG90eXBlLndyaXRlSW50OD1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGU9K2UsdD4+Pj0wLG58fEYodGhpcyxlLHQsMSwxMjcsLTEyOCksMD5lJiYoZT0yNTUrZSsxKSx0aGlzW3RdPTI1NSZlLHQrMX0scy5wcm90b3R5cGUud3JpdGVJbnQxNkxFPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZT0rZSx0Pj4+PTAsbnx8Rih0aGlzLGUsdCwyLDMyNzY3LC0zMjc2OCksdGhpc1t0XT0yNTUmZSx0aGlzW3QrMV09ZT4+PjgsdCsyfSxzLnByb3RvdHlwZS53cml0ZUludDE2QkU9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlPStlLHQ+Pj49MCxufHxGKHRoaXMsZSx0LDIsMzI3NjcsLTMyNzY4KSx0aGlzW3RdPWU+Pj44LHRoaXNbdCsxXT0yNTUmZSx0KzJ9LHMucHJvdG90eXBlLndyaXRlSW50MzJMRT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGU9K2UsdD4+Pj0wLG58fEYodGhpcyxlLHQsNCwyMTQ3NDgzNjQ3LC0yMTQ3NDgzNjQ4KSx0aGlzW3RdPTI1NSZlLHRoaXNbdCsxXT1lPj4+OCx0aGlzW3QrMl09ZT4+PjE2LHRoaXNbdCszXT1lPj4+MjQsdCs0fSxzLnByb3RvdHlwZS53cml0ZUludDMyQkU9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlPStlLHQ+Pj49MCxufHxGKHRoaXMsZSx0LDQsMjE0NzQ4MzY0NywtMjE0NzQ4MzY0OCksMD5lJiYoZT00Mjk0OTY3Mjk1K2UrMSksdGhpc1t0XT1lPj4+MjQsdGhpc1t0KzFdPWU+Pj4xNix0aGlzW3QrMl09ZT4+PjgsdGhpc1t0KzNdPTI1NSZlLHQrNH0scy5wcm90b3R5cGUud3JpdGVGbG9hdExFPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gVSh0aGlzLGUsdCwhMCxuKX0scy5wcm90b3R5cGUud3JpdGVGbG9hdEJFPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gVSh0aGlzLGUsdCwhMSxuKX0scy5wcm90b3R5cGUud3JpdGVEb3VibGVMRT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGoodGhpcyxlLHQsITAsbil9LHMucHJvdG90eXBlLndyaXRlRG91YmxlQkU9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBqKHRoaXMsZSx0LCExLG4pfSxzLnByb3RvdHlwZS5jb3B5PWZ1bmN0aW9uKGUsdCxuLHIpe2lmKCFzLmlzQnVmZmVyKGUpKXRocm93IG5ldyBUeXBlRXJyb3IoXCJhcmd1bWVudCBzaG91bGQgYmUgYSBCdWZmZXJcIik7aWYobnx8KG49MCkscnx8MD09PXJ8fChyPXRoaXMubGVuZ3RoKSx0Pj1lLmxlbmd0aCYmKHQ9ZS5sZW5ndGgpLHR8fCh0PTApLDA8ciYmcjxuJiYocj1uKSxyPT09bilyZXR1cm4gMDtpZigwPT09ZS5sZW5ndGh8fDA9PT10aGlzLmxlbmd0aClyZXR1cm4gMDtpZigwPnQpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJ0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzXCIpO2lmKDA+bnx8bj49dGhpcy5sZW5ndGgpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbmRleCBvdXQgb2YgcmFuZ2VcIik7aWYoMD5yKXRocm93IG5ldyBSYW5nZUVycm9yKFwic291cmNlRW5kIG91dCBvZiBib3VuZHNcIik7cj50aGlzLmxlbmd0aCYmKHI9dGhpcy5sZW5ndGgpLGUubGVuZ3RoLXQ8ci1uJiYocj1lLmxlbmd0aC10K24pO3ZhciBhPXItbjtpZih0aGlzPT09ZSYmXCJmdW5jdGlvblwiPT10eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuY29weVdpdGhpbil0aGlzLmNvcHlXaXRoaW4odCxuLHIpO2Vsc2UgaWYodGhpcz09PWUmJm48dCYmdDxyKWZvcih2YXIgbz1hLTE7MDw9bzstLW8pZVtvK3RdPXRoaXNbbytuXTtlbHNlIFVpbnQ4QXJyYXkucHJvdG90eXBlLnNldC5jYWxsKGUsdGhpcy5zdWJhcnJheShuLHIpLHQpO3JldHVybiBhfSxzLnByb3RvdHlwZS5maWxsPWZ1bmN0aW9uKGUsdCxuLHIpe2lmKFwic3RyaW5nXCI9PXR5cGVvZiBlKXtpZihcInN0cmluZ1wiPT10eXBlb2YgdD8ocj10LHQ9MCxuPXRoaXMubGVuZ3RoKTpcInN0cmluZ1wiPT10eXBlb2YgbiYmKHI9bixuPXRoaXMubGVuZ3RoKSx2b2lkIDAhPT1yJiZcInN0cmluZ1wiIT10eXBlb2Ygcil0aHJvdyBuZXcgVHlwZUVycm9yKFwiZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZ1wiKTtpZihcInN0cmluZ1wiPT10eXBlb2YgciYmIXMuaXNFbmNvZGluZyhyKSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiVW5rbm93biBlbmNvZGluZzogXCIrcik7aWYoMT09PWUubGVuZ3RoKXt2YXIgYT1lLmNoYXJDb2RlQXQoMCk7KFwidXRmOFwiPT09ciYmMTI4PmF8fFwibGF0aW4xXCI9PT1yKSYmKGU9YSl9fWVsc2VcIm51bWJlclwiPT10eXBlb2YgZSYmKGUmPTI1NSk7aWYoMD50fHx0aGlzLmxlbmd0aDx0fHx0aGlzLmxlbmd0aDxuKXRocm93IG5ldyBSYW5nZUVycm9yKFwiT3V0IG9mIHJhbmdlIGluZGV4XCIpO2lmKG48PXQpcmV0dXJuIHRoaXM7dD4+Pj0wLG49bj09PXZvaWQgMD90aGlzLmxlbmd0aDpuPj4+MCxlfHwoZT0wKTt2YXIgbztpZihcIm51bWJlclwiPT10eXBlb2YgZSlmb3Iobz10O288bjsrK28pdGhpc1tvXT1lO2Vsc2V7dmFyIGQ9cy5pc0J1ZmZlcihlKT9lOnMuZnJvbShlLHIpLGw9ZC5sZW5ndGg7aWYoMD09PWwpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSB2YWx1ZSBcXFwiXCIrZStcIlxcXCIgaXMgaW52YWxpZCBmb3IgYXJndW1lbnQgXFxcInZhbHVlXFxcIlwiKTtmb3Iobz0wO288bi10Oysrbyl0aGlzW28rdF09ZFtvJWxdfXJldHVybiB0aGlzfTt2YXIgUT0vW14rLzAtOUEtWmEtei1fXS9nfSkuY2FsbCh0aGlzKX0pLmNhbGwodGhpcyxlKFwiYnVmZmVyXCIpLkJ1ZmZlcil9LHtcImJhc2U2NC1qc1wiOjEsYnVmZmVyOjMsaWVlZTc1NDo5fV0sNDpbZnVuY3Rpb24oZSx0LG4peyhmdW5jdGlvbihhKXsoZnVuY3Rpb24oKXtmdW5jdGlvbiByKCl7bGV0IGU7dHJ5e2U9bi5zdG9yYWdlLmdldEl0ZW0oXCJkZWJ1Z1wiKX1jYXRjaChlKXt9cmV0dXJuIWUmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBhJiZcImVudlwiaW4gYSYmKGU9YS5lbnYuREVCVUcpLGV9bi5mb3JtYXRBcmdzPWZ1bmN0aW9uKGUpe2lmKGVbMF09KHRoaXMudXNlQ29sb3JzP1wiJWNcIjpcIlwiKSt0aGlzLm5hbWVzcGFjZSsodGhpcy51c2VDb2xvcnM/XCIgJWNcIjpcIiBcIikrZVswXSsodGhpcy51c2VDb2xvcnM/XCIlYyBcIjpcIiBcIikrXCIrXCIrdC5leHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZiksIXRoaXMudXNlQ29sb3JzKXJldHVybjtjb25zdCBuPVwiY29sb3I6IFwiK3RoaXMuY29sb3I7ZS5zcGxpY2UoMSwwLG4sXCJjb2xvcjogaW5oZXJpdFwiKTtsZXQgcj0wLGE9MDtlWzBdLnJlcGxhY2UoLyVbYS16QS1aJV0vZyxlPT57XCIlJVwiPT09ZXx8KHIrKyxcIiVjXCI9PT1lJiYoYT1yKSl9KSxlLnNwbGljZShhLDAsbil9LG4uc2F2ZT1mdW5jdGlvbihlKXt0cnl7ZT9uLnN0b3JhZ2Uuc2V0SXRlbShcImRlYnVnXCIsZSk6bi5zdG9yYWdlLnJlbW92ZUl0ZW0oXCJkZWJ1Z1wiKX1jYXRjaChlKXt9fSxuLmxvYWQ9cixuLnVzZUNvbG9ycz1mdW5jdGlvbigpe3JldHVybiEhKFwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJndpbmRvdy5wcm9jZXNzJiYoXCJyZW5kZXJlclwiPT09d2luZG93LnByb2Nlc3MudHlwZXx8d2luZG93LnByb2Nlc3MuX19ud2pzKSl8fCEoXCJ1bmRlZmluZWRcIiE9dHlwZW9mIG5hdmlnYXRvciYmbmF2aWdhdG9yLnVzZXJBZ2VudCYmbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC8oZWRnZXx0cmlkZW50KVxcLyhcXGQrKS8pKSYmKFwidW5kZWZpbmVkXCIhPXR5cGVvZiBkb2N1bWVudCYmZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50JiZkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUmJmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5XZWJraXRBcHBlYXJhbmNlfHxcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93JiZ3aW5kb3cuY29uc29sZSYmKHdpbmRvdy5jb25zb2xlLmZpcmVidWd8fHdpbmRvdy5jb25zb2xlLmV4Y2VwdGlvbiYmd2luZG93LmNvbnNvbGUudGFibGUpfHxcInVuZGVmaW5lZFwiIT10eXBlb2YgbmF2aWdhdG9yJiZuYXZpZ2F0b3IudXNlckFnZW50JiZuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSYmMzE8PXBhcnNlSW50KFJlZ0V4cC4kMSwxMCl8fFwidW5kZWZpbmVkXCIhPXR5cGVvZiBuYXZpZ2F0b3ImJm5hdmlnYXRvci51c2VyQWdlbnQmJm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvYXBwbGV3ZWJraXRcXC8oXFxkKykvKSl9LG4uc3RvcmFnZT1mdW5jdGlvbigpe3RyeXtyZXR1cm4gbG9jYWxTdG9yYWdlfWNhdGNoKGUpe319KCksbi5kZXN0cm95PSgoKT0+e2xldCBlPSExO3JldHVybigpPT57ZXx8KGU9ITAsY29uc29sZS53YXJuKFwiSW5zdGFuY2UgbWV0aG9kIGBkZWJ1Zy5kZXN0cm95KClgIGlzIGRlcHJlY2F0ZWQgYW5kIG5vIGxvbmdlciBkb2VzIGFueXRoaW5nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbiBvZiBgZGVidWdgLlwiKSl9fSkoKSxuLmNvbG9ycz1bXCIjMDAwMENDXCIsXCIjMDAwMEZGXCIsXCIjMDAzM0NDXCIsXCIjMDAzM0ZGXCIsXCIjMDA2NkNDXCIsXCIjMDA2NkZGXCIsXCIjMDA5OUNDXCIsXCIjMDA5OUZGXCIsXCIjMDBDQzAwXCIsXCIjMDBDQzMzXCIsXCIjMDBDQzY2XCIsXCIjMDBDQzk5XCIsXCIjMDBDQ0NDXCIsXCIjMDBDQ0ZGXCIsXCIjMzMwMENDXCIsXCIjMzMwMEZGXCIsXCIjMzMzM0NDXCIsXCIjMzMzM0ZGXCIsXCIjMzM2NkNDXCIsXCIjMzM2NkZGXCIsXCIjMzM5OUNDXCIsXCIjMzM5OUZGXCIsXCIjMzNDQzAwXCIsXCIjMzNDQzMzXCIsXCIjMzNDQzY2XCIsXCIjMzNDQzk5XCIsXCIjMzNDQ0NDXCIsXCIjMzNDQ0ZGXCIsXCIjNjYwMENDXCIsXCIjNjYwMEZGXCIsXCIjNjYzM0NDXCIsXCIjNjYzM0ZGXCIsXCIjNjZDQzAwXCIsXCIjNjZDQzMzXCIsXCIjOTkwMENDXCIsXCIjOTkwMEZGXCIsXCIjOTkzM0NDXCIsXCIjOTkzM0ZGXCIsXCIjOTlDQzAwXCIsXCIjOTlDQzMzXCIsXCIjQ0MwMDAwXCIsXCIjQ0MwMDMzXCIsXCIjQ0MwMDY2XCIsXCIjQ0MwMDk5XCIsXCIjQ0MwMENDXCIsXCIjQ0MwMEZGXCIsXCIjQ0MzMzAwXCIsXCIjQ0MzMzMzXCIsXCIjQ0MzMzY2XCIsXCIjQ0MzMzk5XCIsXCIjQ0MzM0NDXCIsXCIjQ0MzM0ZGXCIsXCIjQ0M2NjAwXCIsXCIjQ0M2NjMzXCIsXCIjQ0M5OTAwXCIsXCIjQ0M5OTMzXCIsXCIjQ0NDQzAwXCIsXCIjQ0NDQzMzXCIsXCIjRkYwMDAwXCIsXCIjRkYwMDMzXCIsXCIjRkYwMDY2XCIsXCIjRkYwMDk5XCIsXCIjRkYwMENDXCIsXCIjRkYwMEZGXCIsXCIjRkYzMzAwXCIsXCIjRkYzMzMzXCIsXCIjRkYzMzY2XCIsXCIjRkYzMzk5XCIsXCIjRkYzM0NDXCIsXCIjRkYzM0ZGXCIsXCIjRkY2NjAwXCIsXCIjRkY2NjMzXCIsXCIjRkY5OTAwXCIsXCIjRkY5OTMzXCIsXCIjRkZDQzAwXCIsXCIjRkZDQzMzXCJdLG4ubG9nPWNvbnNvbGUuZGVidWd8fGNvbnNvbGUubG9nfHwoKCk9Pnt9KSx0LmV4cG9ydHM9ZShcIi4vY29tbW9uXCIpKG4pO2NvbnN0e2Zvcm1hdHRlcnM6b309dC5leHBvcnRzO28uaj1mdW5jdGlvbihlKXt0cnl7cmV0dXJuIEpTT04uc3RyaW5naWZ5KGUpfWNhdGNoKGUpe3JldHVyblwiW1VuZXhwZWN0ZWRKU09OUGFyc2VFcnJvcl06IFwiK2UubWVzc2FnZX19fSkuY2FsbCh0aGlzKX0pLmNhbGwodGhpcyxlKFwiX3Byb2Nlc3NcIikpfSx7XCIuL2NvbW1vblwiOjUsX3Byb2Nlc3M6MTJ9XSw1OltmdW5jdGlvbihlLHQpe3QuZXhwb3J0cz1mdW5jdGlvbih0KXtmdW5jdGlvbiByKGUpe2Z1bmN0aW9uIHQoLi4uZSl7aWYoIXQuZW5hYmxlZClyZXR1cm47Y29uc3QgYT10LG89K25ldyBEYXRlLGk9by0obnx8byk7YS5kaWZmPWksYS5wcmV2PW4sYS5jdXJyPW8sbj1vLGVbMF09ci5jb2VyY2UoZVswXSksXCJzdHJpbmdcIiE9dHlwZW9mIGVbMF0mJmUudW5zaGlmdChcIiVPXCIpO2xldCBkPTA7ZVswXT1lWzBdLnJlcGxhY2UoLyUoW2EtekEtWiVdKS9nLCh0LG4pPT57aWYoXCIlJVwiPT09dClyZXR1cm5cIiVcIjtkKys7Y29uc3Qgbz1yLmZvcm1hdHRlcnNbbl07aWYoXCJmdW5jdGlvblwiPT10eXBlb2Ygbyl7Y29uc3Qgbj1lW2RdO3Q9by5jYWxsKGEsbiksZS5zcGxpY2UoZCwxKSxkLS19cmV0dXJuIHR9KSxyLmZvcm1hdEFyZ3MuY2FsbChhLGUpO2NvbnN0IHM9YS5sb2d8fHIubG9nO3MuYXBwbHkoYSxlKX1sZXQgbixvPW51bGw7cmV0dXJuIHQubmFtZXNwYWNlPWUsdC51c2VDb2xvcnM9ci51c2VDb2xvcnMoKSx0LmNvbG9yPXIuc2VsZWN0Q29sb3IoZSksdC5leHRlbmQ9YSx0LmRlc3Ryb3k9ci5kZXN0cm95LE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0LFwiZW5hYmxlZFwiLHtlbnVtZXJhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMSxnZXQ6KCk9Pm51bGw9PT1vP3IuZW5hYmxlZChlKTpvLHNldDplPT57bz1lfX0pLFwiZnVuY3Rpb25cIj09dHlwZW9mIHIuaW5pdCYmci5pbml0KHQpLHR9ZnVuY3Rpb24gYShlLHQpe2NvbnN0IG49cih0aGlzLm5hbWVzcGFjZSsoXCJ1bmRlZmluZWRcIj09dHlwZW9mIHQ/XCI6XCI6dCkrZSk7cmV0dXJuIG4ubG9nPXRoaXMubG9nLG59ZnVuY3Rpb24gbyhlKXtyZXR1cm4gZS50b1N0cmluZygpLnN1YnN0cmluZygyLGUudG9TdHJpbmcoKS5sZW5ndGgtMikucmVwbGFjZSgvXFwuXFwqXFw/JC8sXCIqXCIpfXJldHVybiByLmRlYnVnPXIsci5kZWZhdWx0PXIsci5jb2VyY2U9ZnVuY3Rpb24oZSl7cmV0dXJuIGUgaW5zdGFuY2VvZiBFcnJvcj9lLnN0YWNrfHxlLm1lc3NhZ2U6ZX0sci5kaXNhYmxlPWZ1bmN0aW9uKCl7Y29uc3QgZT1bLi4uci5uYW1lcy5tYXAobyksLi4uci5za2lwcy5tYXAobykubWFwKGU9PlwiLVwiK2UpXS5qb2luKFwiLFwiKTtyZXR1cm4gci5lbmFibGUoXCJcIiksZX0sci5lbmFibGU9ZnVuY3Rpb24oZSl7ci5zYXZlKGUpLHIubmFtZXM9W10sci5za2lwcz1bXTtsZXQgdDtjb25zdCBuPShcInN0cmluZ1wiPT10eXBlb2YgZT9lOlwiXCIpLnNwbGl0KC9bXFxzLF0rLyksYT1uLmxlbmd0aDtmb3IodD0wO3Q8YTt0Kyspblt0XSYmKGU9blt0XS5yZXBsYWNlKC9cXCovZyxcIi4qP1wiKSxcIi1cIj09PWVbMF0/ci5za2lwcy5wdXNoKG5ldyBSZWdFeHAoXCJeXCIrZS5zdWJzdHIoMSkrXCIkXCIpKTpyLm5hbWVzLnB1c2gobmV3IFJlZ0V4cChcIl5cIitlK1wiJFwiKSkpfSxyLmVuYWJsZWQ9ZnVuY3Rpb24oZSl7aWYoXCIqXCI9PT1lW2UubGVuZ3RoLTFdKXJldHVybiEwO2xldCB0LG47Zm9yKHQ9MCxuPXIuc2tpcHMubGVuZ3RoO3Q8bjt0KyspaWYoci5za2lwc1t0XS50ZXN0KGUpKXJldHVybiExO2Zvcih0PTAsbj1yLm5hbWVzLmxlbmd0aDt0PG47dCsrKWlmKHIubmFtZXNbdF0udGVzdChlKSlyZXR1cm4hMDtyZXR1cm4hMX0sci5odW1hbml6ZT1lKFwibXNcIiksci5kZXN0cm95PWZ1bmN0aW9uKCl7Y29uc29sZS53YXJuKFwiSW5zdGFuY2UgbWV0aG9kIGBkZWJ1Zy5kZXN0cm95KClgIGlzIGRlcHJlY2F0ZWQgYW5kIG5vIGxvbmdlciBkb2VzIGFueXRoaW5nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbiBvZiBgZGVidWdgLlwiKX0sT2JqZWN0LmtleXModCkuZm9yRWFjaChlPT57cltlXT10W2VdfSksci5uYW1lcz1bXSxyLnNraXBzPVtdLHIuZm9ybWF0dGVycz17fSxyLnNlbGVjdENvbG9yPWZ1bmN0aW9uKGUpe2xldCB0PTA7Zm9yKGxldCBuPTA7bjxlLmxlbmd0aDtuKyspdD0odDw8NSktdCtlLmNoYXJDb2RlQXQobiksdHw9MDtyZXR1cm4gci5jb2xvcnNbbih0KSVyLmNvbG9ycy5sZW5ndGhdfSxyLmVuYWJsZShyLmxvYWQoKSkscn19LHttczoxMX1dLDY6W2Z1bmN0aW9uKGUsdCl7J3VzZSBzdHJpY3QnO2Z1bmN0aW9uIG4oZSx0KXtmb3IoY29uc3QgbiBpbiB0KU9iamVjdC5kZWZpbmVQcm9wZXJ0eShlLG4se3ZhbHVlOnRbbl0sZW51bWVyYWJsZTohMCxjb25maWd1cmFibGU6ITB9KTtyZXR1cm4gZX10LmV4cG9ydHM9ZnVuY3Rpb24oZSx0LHIpe2lmKCFlfHxcInN0cmluZ1wiPT10eXBlb2YgZSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiUGxlYXNlIHBhc3MgYW4gRXJyb3IgdG8gZXJyLWNvZGVcIik7cnx8KHI9e30pLFwib2JqZWN0XCI9PXR5cGVvZiB0JiYocj10LHQ9XCJcIiksdCYmKHIuY29kZT10KTt0cnl7cmV0dXJuIG4oZSxyKX1jYXRjaCh0KXtyLm1lc3NhZ2U9ZS5tZXNzYWdlLHIuc3RhY2s9ZS5zdGFjaztjb25zdCBhPWZ1bmN0aW9uKCl7fTthLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKE9iamVjdC5nZXRQcm90b3R5cGVPZihlKSk7Y29uc3Qgbz1uKG5ldyBhLHIpO3JldHVybiBvfX19LHt9XSw3OltmdW5jdGlvbihlLHQpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBuKGUpe2NvbnNvbGUmJmNvbnNvbGUud2FybiYmY29uc29sZS53YXJuKGUpfWZ1bmN0aW9uIHIoKXtyLmluaXQuY2FsbCh0aGlzKX1mdW5jdGlvbiBhKGUpe2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIGUpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSBcXFwibGlzdGVuZXJcXFwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBGdW5jdGlvbi4gUmVjZWl2ZWQgdHlwZSBcIit0eXBlb2YgZSl9ZnVuY3Rpb24gbyhlKXtyZXR1cm4gdm9pZCAwPT09ZS5fbWF4TGlzdGVuZXJzP3IuZGVmYXVsdE1heExpc3RlbmVyczplLl9tYXhMaXN0ZW5lcnN9ZnVuY3Rpb24gaShlLHQscixpKXt2YXIgZCxzLGw7aWYoYShyKSxzPWUuX2V2ZW50cyx2b2lkIDA9PT1zPyhzPWUuX2V2ZW50cz1PYmplY3QuY3JlYXRlKG51bGwpLGUuX2V2ZW50c0NvdW50PTApOih2b2lkIDAhPT1zLm5ld0xpc3RlbmVyJiYoZS5lbWl0KFwibmV3TGlzdGVuZXJcIix0LHIubGlzdGVuZXI/ci5saXN0ZW5lcjpyKSxzPWUuX2V2ZW50cyksbD1zW3RdKSx2b2lkIDA9PT1sKWw9c1t0XT1yLCsrZS5fZXZlbnRzQ291bnQ7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBsP2w9c1t0XT1pP1tyLGxdOltsLHJdOmk/bC51bnNoaWZ0KHIpOmwucHVzaChyKSxkPW8oZSksMDxkJiZsLmxlbmd0aD5kJiYhbC53YXJuZWQpe2wud2FybmVkPSEwO3ZhciBjPW5ldyBFcnJvcihcIlBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgbGVhayBkZXRlY3RlZC4gXCIrbC5sZW5ndGgrXCIgXCIrKHQrXCIgbGlzdGVuZXJzIGFkZGVkLiBVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdFwiKSk7Yy5uYW1lPVwiTWF4TGlzdGVuZXJzRXhjZWVkZWRXYXJuaW5nXCIsYy5lbWl0dGVyPWUsYy50eXBlPXQsYy5jb3VudD1sLmxlbmd0aCxuKGMpfXJldHVybiBlfWZ1bmN0aW9uIGQoKXtpZighdGhpcy5maXJlZClyZXR1cm4gdGhpcy50YXJnZXQucmVtb3ZlTGlzdGVuZXIodGhpcy50eXBlLHRoaXMud3JhcEZuKSx0aGlzLmZpcmVkPSEwLDA9PT1hcmd1bWVudHMubGVuZ3RoP3RoaXMubGlzdGVuZXIuY2FsbCh0aGlzLnRhcmdldCk6dGhpcy5saXN0ZW5lci5hcHBseSh0aGlzLnRhcmdldCxhcmd1bWVudHMpfWZ1bmN0aW9uIHMoZSx0LG4pe3ZhciByPXtmaXJlZDohMSx3cmFwRm46dm9pZCAwLHRhcmdldDplLHR5cGU6dCxsaXN0ZW5lcjpufSxhPWQuYmluZChyKTtyZXR1cm4gYS5saXN0ZW5lcj1uLHIud3JhcEZuPWEsYX1mdW5jdGlvbiBsKGUsdCxuKXt2YXIgcj1lLl9ldmVudHM7aWYocj09PXZvaWQgMClyZXR1cm5bXTt2YXIgYT1yW3RdO3JldHVybiB2b2lkIDA9PT1hP1tdOlwiZnVuY3Rpb25cIj09dHlwZW9mIGE/bj9bYS5saXN0ZW5lcnx8YV06W2FdOm4/ZihhKTp1KGEsYS5sZW5ndGgpfWZ1bmN0aW9uIGMoZSl7dmFyIHQ9dGhpcy5fZXZlbnRzO2lmKHQhPT12b2lkIDApe3ZhciBuPXRbZV07aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgbilyZXR1cm4gMTtpZih2b2lkIDAhPT1uKXJldHVybiBuLmxlbmd0aH1yZXR1cm4gMH1mdW5jdGlvbiB1KGUsdCl7Zm9yKHZhciBuPUFycmF5KHQpLHI9MDtyPHQ7KytyKW5bcl09ZVtyXTtyZXR1cm4gbn1mdW5jdGlvbiBwKGUsdCl7Zm9yKDt0KzE8ZS5sZW5ndGg7dCsrKWVbdF09ZVt0KzFdO2UucG9wKCl9ZnVuY3Rpb24gZihlKXtmb3IodmFyIHQ9QXJyYXkoZS5sZW5ndGgpLG49MDtuPHQubGVuZ3RoOysrbil0W25dPWVbbl0ubGlzdGVuZXJ8fGVbbl07cmV0dXJuIHR9ZnVuY3Rpb24gZyhlLHQsbil7XCJmdW5jdGlvblwiPT10eXBlb2YgZS5vbiYmXyhlLFwiZXJyb3JcIix0LG4pfWZ1bmN0aW9uIF8oZSx0LG4scil7aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZS5vbilyLm9uY2U/ZS5vbmNlKHQsbik6ZS5vbih0LG4pO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZS5hZGRFdmVudExpc3RlbmVyKWUuYWRkRXZlbnRMaXN0ZW5lcih0LGZ1bmN0aW9uIGEobyl7ci5vbmNlJiZlLnJlbW92ZUV2ZW50TGlzdGVuZXIodCxhKSxuKG8pfSk7ZWxzZSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIFxcXCJlbWl0dGVyXFxcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgRXZlbnRFbWl0dGVyLiBSZWNlaXZlZCB0eXBlIFwiK3R5cGVvZiBlKX12YXIgaCxtPVwib2JqZWN0XCI9PXR5cGVvZiBSZWZsZWN0P1JlZmxlY3Q6bnVsbCxiPW0mJlwiZnVuY3Rpb25cIj09dHlwZW9mIG0uYXBwbHk/bS5hcHBseTpmdW5jdGlvbihlLHQsbil7cmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGUsdCxuKX07aD1tJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiBtLm93bktleXM/bS5vd25LZXlzOk9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHM/ZnVuY3Rpb24oZSl7cmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGUpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGUpKX06ZnVuY3Rpb24oZSl7cmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGUpfTt2YXIgeT1OdW1iZXIuaXNOYU58fGZ1bmN0aW9uKGUpe3JldHVybiBlIT09ZX07dC5leHBvcnRzPXIsdC5leHBvcnRzLm9uY2U9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24obixyKXtmdW5jdGlvbiBhKG4pe2UucmVtb3ZlTGlzdGVuZXIodCxvKSxyKG4pfWZ1bmN0aW9uIG8oKXtcImZ1bmN0aW9uXCI9PXR5cGVvZiBlLnJlbW92ZUxpc3RlbmVyJiZlLnJlbW92ZUxpc3RlbmVyKFwiZXJyb3JcIixhKSxuKFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSl9XyhlLHQsbyx7b25jZTohMH0pLFwiZXJyb3JcIiE9PXQmJmcoZSxhLHtvbmNlOiEwfSl9KX0sci5FdmVudEVtaXR0ZXI9cixyLnByb3RvdHlwZS5fZXZlbnRzPXZvaWQgMCxyLnByb3RvdHlwZS5fZXZlbnRzQ291bnQ9MCxyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzPXZvaWQgMDt2YXIgQz0xMDtPYmplY3QuZGVmaW5lUHJvcGVydHkocixcImRlZmF1bHRNYXhMaXN0ZW5lcnNcIix7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gQ30sc2V0OmZ1bmN0aW9uKGUpe2lmKFwibnVtYmVyXCIhPXR5cGVvZiBlfHwwPmV8fHkoZSkpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJUaGUgdmFsdWUgb2YgXFxcImRlZmF1bHRNYXhMaXN0ZW5lcnNcXFwiIGlzIG91dCBvZiByYW5nZS4gSXQgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIuIFJlY2VpdmVkIFwiK2UrXCIuXCIpO0M9ZX19KSxyLmluaXQ9ZnVuY3Rpb24oKXsodGhpcy5fZXZlbnRzPT09dm9pZCAwfHx0aGlzLl9ldmVudHM9PT1PYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykuX2V2ZW50cykmJih0aGlzLl9ldmVudHM9T2JqZWN0LmNyZWF0ZShudWxsKSx0aGlzLl9ldmVudHNDb3VudD0wKSx0aGlzLl9tYXhMaXN0ZW5lcnM9dGhpcy5fbWF4TGlzdGVuZXJzfHx2b2lkIDB9LHIucHJvdG90eXBlLnNldE1heExpc3RlbmVycz1mdW5jdGlvbihlKXtpZihcIm51bWJlclwiIT10eXBlb2YgZXx8MD5lfHx5KGUpKXRocm93IG5ldyBSYW5nZUVycm9yKFwiVGhlIHZhbHVlIG9mIFxcXCJuXFxcIiBpcyBvdXQgb2YgcmFuZ2UuIEl0IG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyLiBSZWNlaXZlZCBcIitlK1wiLlwiKTtyZXR1cm4gdGhpcy5fbWF4TGlzdGVuZXJzPWUsdGhpc30sci5wcm90b3R5cGUuZ2V0TWF4TGlzdGVuZXJzPWZ1bmN0aW9uKCl7cmV0dXJuIG8odGhpcyl9LHIucHJvdG90eXBlLmVtaXQ9ZnVuY3Rpb24oZSl7Zm9yKHZhciB0PVtdLG49MTtuPGFyZ3VtZW50cy5sZW5ndGg7bisrKXQucHVzaChhcmd1bWVudHNbbl0pO3ZhciByPVwiZXJyb3JcIj09PWUsYT10aGlzLl9ldmVudHM7aWYoYSE9PXZvaWQgMClyPXImJmEuZXJyb3I9PT12b2lkIDA7ZWxzZSBpZighcilyZXR1cm4hMTtpZihyKXt2YXIgbztpZigwPHQubGVuZ3RoJiYobz10WzBdKSxvIGluc3RhbmNlb2YgRXJyb3IpdGhyb3cgbzt2YXIgZD1uZXcgRXJyb3IoXCJVbmhhbmRsZWQgZXJyb3IuXCIrKG8/XCIgKFwiK28ubWVzc2FnZStcIilcIjpcIlwiKSk7dGhyb3cgZC5jb250ZXh0PW8sZH12YXIgcz1hW2VdO2lmKHM9PT12b2lkIDApcmV0dXJuITE7aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgcyliKHMsdGhpcyx0KTtlbHNlIGZvcih2YXIgbD1zLmxlbmd0aCxjPXUocyxsKSxuPTA7bjxsOysrbiliKGNbbl0sdGhpcyx0KTtyZXR1cm4hMH0sci5wcm90b3R5cGUuYWRkTGlzdGVuZXI9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gaSh0aGlzLGUsdCwhMSl9LHIucHJvdG90eXBlLm9uPXIucHJvdG90eXBlLmFkZExpc3RlbmVyLHIucHJvdG90eXBlLnByZXBlbmRMaXN0ZW5lcj1mdW5jdGlvbihlLHQpe3JldHVybiBpKHRoaXMsZSx0LCEwKX0sci5wcm90b3R5cGUub25jZT1mdW5jdGlvbihlLHQpe3JldHVybiBhKHQpLHRoaXMub24oZSxzKHRoaXMsZSx0KSksdGhpc30sci5wcm90b3R5cGUucHJlcGVuZE9uY2VMaXN0ZW5lcj1mdW5jdGlvbihlLHQpe3JldHVybiBhKHQpLHRoaXMucHJlcGVuZExpc3RlbmVyKGUscyh0aGlzLGUsdCkpLHRoaXN9LHIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyPWZ1bmN0aW9uKGUsdCl7dmFyIG4scixvLGQscztpZihhKHQpLHI9dGhpcy5fZXZlbnRzLHZvaWQgMD09PXIpcmV0dXJuIHRoaXM7aWYobj1yW2VdLHZvaWQgMD09PW4pcmV0dXJuIHRoaXM7aWYobj09PXR8fG4ubGlzdGVuZXI9PT10KTA9PS0tdGhpcy5fZXZlbnRzQ291bnQ/dGhpcy5fZXZlbnRzPU9iamVjdC5jcmVhdGUobnVsbCk6KGRlbGV0ZSByW2VdLHIucmVtb3ZlTGlzdGVuZXImJnRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyXCIsZSxuLmxpc3RlbmVyfHx0KSk7ZWxzZSBpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiBuKXtmb3Iobz0tMSxkPW4ubGVuZ3RoLTE7MDw9ZDtkLS0paWYobltkXT09PXR8fG5bZF0ubGlzdGVuZXI9PT10KXtzPW5bZF0ubGlzdGVuZXIsbz1kO2JyZWFrfWlmKDA+bylyZXR1cm4gdGhpczswPT09bz9uLnNoaWZ0KCk6cChuLG8pLDE9PT1uLmxlbmd0aCYmKHJbZV09blswXSksdm9pZCAwIT09ci5yZW1vdmVMaXN0ZW5lciYmdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJcIixlLHN8fHQpfXJldHVybiB0aGlzfSxyLnByb3RvdHlwZS5vZmY9ci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIsci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzPWZ1bmN0aW9uKGUpe3ZhciB0LG4scjtpZihuPXRoaXMuX2V2ZW50cyx2b2lkIDA9PT1uKXJldHVybiB0aGlzO2lmKHZvaWQgMD09PW4ucmVtb3ZlTGlzdGVuZXIpcmV0dXJuIDA9PT1hcmd1bWVudHMubGVuZ3RoPyh0aGlzLl9ldmVudHM9T2JqZWN0LmNyZWF0ZShudWxsKSx0aGlzLl9ldmVudHNDb3VudD0wKTp2b2lkIDAhPT1uW2VdJiYoMD09LS10aGlzLl9ldmVudHNDb3VudD90aGlzLl9ldmVudHM9T2JqZWN0LmNyZWF0ZShudWxsKTpkZWxldGUgbltlXSksdGhpcztpZigwPT09YXJndW1lbnRzLmxlbmd0aCl7dmFyIGEsbz1PYmplY3Qua2V5cyhuKTtmb3Iocj0wO3I8by5sZW5ndGg7KytyKWE9b1tyXSxcInJlbW92ZUxpc3RlbmVyXCIhPT1hJiZ0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhhKTtyZXR1cm4gdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoXCJyZW1vdmVMaXN0ZW5lclwiKSx0aGlzLl9ldmVudHM9T2JqZWN0LmNyZWF0ZShudWxsKSx0aGlzLl9ldmVudHNDb3VudD0wLHRoaXN9aWYodD1uW2VdLFwiZnVuY3Rpb25cIj09dHlwZW9mIHQpdGhpcy5yZW1vdmVMaXN0ZW5lcihlLHQpO2Vsc2UgaWYodm9pZCAwIT09dClmb3Iocj10Lmxlbmd0aC0xOzA8PXI7ci0tKXRoaXMucmVtb3ZlTGlzdGVuZXIoZSx0W3JdKTtyZXR1cm4gdGhpc30sci5wcm90b3R5cGUubGlzdGVuZXJzPWZ1bmN0aW9uKGUpe3JldHVybiBsKHRoaXMsZSwhMCl9LHIucHJvdG90eXBlLnJhd0xpc3RlbmVycz1mdW5jdGlvbihlKXtyZXR1cm4gbCh0aGlzLGUsITEpfSxyLmxpc3RlbmVyQ291bnQ9ZnVuY3Rpb24oZSx0KXtyZXR1cm5cImZ1bmN0aW9uXCI9PXR5cGVvZiBlLmxpc3RlbmVyQ291bnQ/ZS5saXN0ZW5lckNvdW50KHQpOmMuY2FsbChlLHQpfSxyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50PWMsci5wcm90b3R5cGUuZXZlbnROYW1lcz1mdW5jdGlvbigpe3JldHVybiAwPHRoaXMuX2V2ZW50c0NvdW50P2godGhpcy5fZXZlbnRzKTpbXX19LHt9XSw4OltmdW5jdGlvbihlLHQpe3QuZXhwb3J0cz1mdW5jdGlvbigpe2lmKFwidW5kZWZpbmVkXCI9PXR5cGVvZiBnbG9iYWxUaGlzKXJldHVybiBudWxsO3ZhciBlPXtSVENQZWVyQ29ubmVjdGlvbjpnbG9iYWxUaGlzLlJUQ1BlZXJDb25uZWN0aW9ufHxnbG9iYWxUaGlzLm1velJUQ1BlZXJDb25uZWN0aW9ufHxnbG9iYWxUaGlzLndlYmtpdFJUQ1BlZXJDb25uZWN0aW9uLFJUQ1Nlc3Npb25EZXNjcmlwdGlvbjpnbG9iYWxUaGlzLlJUQ1Nlc3Npb25EZXNjcmlwdGlvbnx8Z2xvYmFsVGhpcy5tb3pSVENTZXNzaW9uRGVzY3JpcHRpb258fGdsb2JhbFRoaXMud2Via2l0UlRDU2Vzc2lvbkRlc2NyaXB0aW9uLFJUQ0ljZUNhbmRpZGF0ZTpnbG9iYWxUaGlzLlJUQ0ljZUNhbmRpZGF0ZXx8Z2xvYmFsVGhpcy5tb3pSVENJY2VDYW5kaWRhdGV8fGdsb2JhbFRoaXMud2Via2l0UlRDSWNlQ2FuZGlkYXRlfTtyZXR1cm4gZS5SVENQZWVyQ29ubmVjdGlvbj9lOm51bGx9fSx7fV0sOTpbZnVuY3Rpb24oZSxhLG8pey8qISBpZWVlNzU0LiBCU0QtMy1DbGF1c2UgTGljZW5zZS4gRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnL29wZW5zb3VyY2U+ICovby5yZWFkPWZ1bmN0aW9uKHQsbixhLG8sbCl7dmFyIGMsdSxwPTgqbC1vLTEsZj0oMTw8cCktMSxnPWY+PjEsXz0tNyxoPWE/bC0xOjAsYj1hPy0xOjEsZD10W24raF07Zm9yKGgrPWIsYz1kJigxPDwtXyktMSxkPj49LV8sXys9cDswPF87Yz0yNTYqYyt0W24raF0saCs9YixfLT04KTtmb3IodT1jJigxPDwtXyktMSxjPj49LV8sXys9bzswPF87dT0yNTYqdSt0W24raF0saCs9YixfLT04KTtpZigwPT09YyljPTEtZztlbHNle2lmKGM9PT1mKXJldHVybiB1P05hTjooZD8tMToxKSooMS8wKTt1Kz1yKDIsbyksYy09Z31yZXR1cm4oZD8tMToxKSp1KnIoMixjLW8pfSxvLndyaXRlPWZ1bmN0aW9uKGEsbyxsLHUscCxmKXt2YXIgaCxiLHksZz1NYXRoLkxOMixfPU1hdGgubG9nLEM9OCpmLXAtMSxSPSgxPDxDKS0xLEU9Uj4+MSx3PTIzPT09cD9yKDIsLTI0KS1yKDIsLTc3KTowLFM9dT8wOmYtMSxUPXU/MTotMSxkPTA+b3x8MD09PW8mJjA+MS9vPzE6MDtmb3Iobz1uKG8pLGlzTmFOKG8pfHxvPT09MS8wPyhiPWlzTmFOKG8pPzE6MCxoPVIpOihoPXQoXyhvKS9nKSwxPm8qKHk9cigyLC1oKSkmJihoLS0seSo9Miksbys9MTw9aCtFP3cveTp3KnIoMiwxLUUpLDI8PW8qeSYmKGgrKyx5Lz0yKSxoK0U+PVI/KGI9MCxoPVIpOjE8PWgrRT8oYj0obyp5LTEpKnIoMixwKSxoKz1FKTooYj1vKnIoMixFLTEpKnIoMixwKSxoPTApKTs4PD1wO2FbbCtTXT0yNTUmYixTKz1ULGIvPTI1NixwLT04KTtmb3IoaD1oPDxwfGIsQys9cDswPEM7YVtsK1NdPTI1NSZoLFMrPVQsaC89MjU2LEMtPTgpO2FbbCtTLVRdfD0xMjgqZH19LHt9XSwxMDpbZnVuY3Rpb24oZSx0KXt0LmV4cG9ydHM9XCJmdW5jdGlvblwiPT10eXBlb2YgT2JqZWN0LmNyZWF0ZT9mdW5jdGlvbihlLHQpe3QmJihlLnN1cGVyXz10LGUucHJvdG90eXBlPU9iamVjdC5jcmVhdGUodC5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTplLGVudW1lcmFibGU6ITEsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfX0pKX06ZnVuY3Rpb24oZSx0KXtpZih0KXtlLnN1cGVyXz10O3ZhciBuPWZ1bmN0aW9uKCl7fTtuLnByb3RvdHlwZT10LnByb3RvdHlwZSxlLnByb3RvdHlwZT1uZXcgbixlLnByb3RvdHlwZS5jb25zdHJ1Y3Rvcj1lfX19LHt9XSwxMTpbZnVuY3Rpb24oZSx0KXt2YXIgcj1NYXRoLnJvdW5kO2Z1bmN0aW9uIGEoZSl7aWYoZSs9XCJcIiwhKDEwMDxlLmxlbmd0aCkpe3ZhciB0PS9eKC0/KD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx3ZWVrcz98d3x5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhlKTtpZih0KXt2YXIgcj1wYXJzZUZsb2F0KHRbMV0pLG49KHRbMl18fFwibXNcIikudG9Mb3dlckNhc2UoKTtyZXR1cm5cInllYXJzXCI9PT1ufHxcInllYXJcIj09PW58fFwieXJzXCI9PT1ufHxcInlyXCI9PT1ufHxcInlcIj09PW4/MzE1NTc2MDAwMDAqcjpcIndlZWtzXCI9PT1ufHxcIndlZWtcIj09PW58fFwid1wiPT09bj82MDQ4MDAwMDAqcjpcImRheXNcIj09PW58fFwiZGF5XCI9PT1ufHxcImRcIj09PW4/ODY0MDAwMDAqcjpcImhvdXJzXCI9PT1ufHxcImhvdXJcIj09PW58fFwiaHJzXCI9PT1ufHxcImhyXCI9PT1ufHxcImhcIj09PW4/MzYwMDAwMCpyOlwibWludXRlc1wiPT09bnx8XCJtaW51dGVcIj09PW58fFwibWluc1wiPT09bnx8XCJtaW5cIj09PW58fFwibVwiPT09bj82MDAwMCpyOlwic2Vjb25kc1wiPT09bnx8XCJzZWNvbmRcIj09PW58fFwic2Vjc1wiPT09bnx8XCJzZWNcIj09PW58fFwic1wiPT09bj8xMDAwKnI6XCJtaWxsaXNlY29uZHNcIj09PW58fFwibWlsbGlzZWNvbmRcIj09PW58fFwibXNlY3NcIj09PW58fFwibXNlY1wiPT09bnx8XCJtc1wiPT09bj9yOnZvaWQgMH19fWZ1bmN0aW9uIG8oZSl7dmFyIHQ9bihlKTtyZXR1cm4gODY0MDAwMDA8PXQ/cihlLzg2NDAwMDAwKStcImRcIjozNjAwMDAwPD10P3IoZS8zNjAwMDAwKStcImhcIjo2MDAwMDw9dD9yKGUvNjAwMDApK1wibVwiOjEwMDA8PXQ/cihlLzEwMDApK1wic1wiOmUrXCJtc1wifWZ1bmN0aW9uIGkoZSl7dmFyIHQ9bihlKTtyZXR1cm4gODY0MDAwMDA8PXQ/cyhlLHQsODY0MDAwMDAsXCJkYXlcIik6MzYwMDAwMDw9dD9zKGUsdCwzNjAwMDAwLFwiaG91clwiKTo2MDAwMDw9dD9zKGUsdCw2MDAwMCxcIm1pbnV0ZVwiKToxMDAwPD10P3MoZSx0LDEwMDAsXCJzZWNvbmRcIik6ZStcIiBtc1wifWZ1bmN0aW9uIHMoZSx0LGEsbil7cmV0dXJuIHIoZS9hKStcIiBcIituKyh0Pj0xLjUqYT9cInNcIjpcIlwiKX12YXIgbD0yNCooNjAqNjAwMDApO3QuZXhwb3J0cz1mdW5jdGlvbihlLHQpe3Q9dHx8e307dmFyIG49dHlwZW9mIGU7aWYoXCJzdHJpbmdcIj09biYmMDxlLmxlbmd0aClyZXR1cm4gYShlKTtpZihcIm51bWJlclwiPT09biYmaXNGaW5pdGUoZSkpcmV0dXJuIHQubG9uZz9pKGUpOm8oZSk7dGhyb3cgbmV3IEVycm9yKFwidmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSB2YWxpZCBudW1iZXIuIHZhbD1cIitKU09OLnN0cmluZ2lmeShlKSl9fSx7fV0sMTI6W2Z1bmN0aW9uKGUsdCl7ZnVuY3Rpb24gbigpe3Rocm93IG5ldyBFcnJvcihcInNldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWRcIil9ZnVuY3Rpb24gcigpe3Rocm93IG5ldyBFcnJvcihcImNsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZFwiKX1mdW5jdGlvbiBhKHQpe2lmKGM9PT1zZXRUaW1lb3V0KXJldHVybiBzZXRUaW1lb3V0KHQsMCk7aWYoKGM9PT1ufHwhYykmJnNldFRpbWVvdXQpcmV0dXJuIGM9c2V0VGltZW91dCxzZXRUaW1lb3V0KHQsMCk7dHJ5e3JldHVybiBjKHQsMCl9Y2F0Y2gobil7dHJ5e3JldHVybiBjLmNhbGwobnVsbCx0LDApfWNhdGNoKG4pe3JldHVybiBjLmNhbGwodGhpcyx0LDApfX19ZnVuY3Rpb24gbyh0KXtpZih1PT09Y2xlYXJUaW1lb3V0KXJldHVybiBjbGVhclRpbWVvdXQodCk7aWYoKHU9PT1yfHwhdSkmJmNsZWFyVGltZW91dClyZXR1cm4gdT1jbGVhclRpbWVvdXQsY2xlYXJUaW1lb3V0KHQpO3RyeXtyZXR1cm4gdSh0KX1jYXRjaChuKXt0cnl7cmV0dXJuIHUuY2FsbChudWxsLHQpfWNhdGNoKG4pe3JldHVybiB1LmNhbGwodGhpcyx0KX19fWZ1bmN0aW9uIGkoKXtfJiZmJiYoXz0hMSxmLmxlbmd0aD9nPWYuY29uY2F0KGcpOmg9LTEsZy5sZW5ndGgmJmQoKSl9ZnVuY3Rpb24gZCgpe2lmKCFfKXt2YXIgZT1hKGkpO189ITA7Zm9yKHZhciB0PWcubGVuZ3RoO3Q7KXtmb3IoZj1nLGc9W107KytoPHQ7KWYmJmZbaF0ucnVuKCk7aD0tMSx0PWcubGVuZ3RofWY9bnVsbCxfPSExLG8oZSl9fWZ1bmN0aW9uIHMoZSx0KXt0aGlzLmZ1bj1lLHRoaXMuYXJyYXk9dH1mdW5jdGlvbiBsKCl7fXZhciBjLHUscD10LmV4cG9ydHM9e307KGZ1bmN0aW9uKCl7dHJ5e2M9XCJmdW5jdGlvblwiPT10eXBlb2Ygc2V0VGltZW91dD9zZXRUaW1lb3V0Om59Y2F0Y2godCl7Yz1ufXRyeXt1PVwiZnVuY3Rpb25cIj09dHlwZW9mIGNsZWFyVGltZW91dD9jbGVhclRpbWVvdXQ6cn1jYXRjaCh0KXt1PXJ9fSkoKTt2YXIgZixnPVtdLF89ITEsaD0tMTtwLm5leHRUaWNrPWZ1bmN0aW9uKGUpe3ZhciB0PUFycmF5KGFyZ3VtZW50cy5sZW5ndGgtMSk7aWYoMTxhcmd1bWVudHMubGVuZ3RoKWZvcih2YXIgbj0xO248YXJndW1lbnRzLmxlbmd0aDtuKyspdFtuLTFdPWFyZ3VtZW50c1tuXTtnLnB1c2gobmV3IHMoZSx0KSksMSE9PWcubGVuZ3RofHxffHxhKGQpfSxzLnByb3RvdHlwZS5ydW49ZnVuY3Rpb24oKXt0aGlzLmZ1bi5hcHBseShudWxsLHRoaXMuYXJyYXkpfSxwLnRpdGxlPVwiYnJvd3NlclwiLHAuYnJvd3Nlcj0hMCxwLmVudj17fSxwLmFyZ3Y9W10scC52ZXJzaW9uPVwiXCIscC52ZXJzaW9ucz17fSxwLm9uPWwscC5hZGRMaXN0ZW5lcj1sLHAub25jZT1sLHAub2ZmPWwscC5yZW1vdmVMaXN0ZW5lcj1sLHAucmVtb3ZlQWxsTGlzdGVuZXJzPWwscC5lbWl0PWwscC5wcmVwZW5kTGlzdGVuZXI9bCxwLnByZXBlbmRPbmNlTGlzdGVuZXI9bCxwLmxpc3RlbmVycz1mdW5jdGlvbigpe3JldHVybltdfSxwLmJpbmRpbmc9ZnVuY3Rpb24oKXt0aHJvdyBuZXcgRXJyb3IoXCJwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZFwiKX0scC5jd2Q9ZnVuY3Rpb24oKXtyZXR1cm5cIi9cIn0scC5jaGRpcj1mdW5jdGlvbigpe3Rocm93IG5ldyBFcnJvcihcInByb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZFwiKX0scC51bWFzaz1mdW5jdGlvbigpe3JldHVybiAwfX0se31dLDEzOltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihlKXsoZnVuY3Rpb24oKXsvKiEgcXVldWUtbWljcm90YXNrLiBNSVQgTGljZW5zZS4gRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnL29wZW5zb3VyY2U+ICovbGV0IG47dC5leHBvcnRzPVwiZnVuY3Rpb25cIj09dHlwZW9mIHF1ZXVlTWljcm90YXNrP3F1ZXVlTWljcm90YXNrLmJpbmQoXCJ1bmRlZmluZWRcIj09dHlwZW9mIHdpbmRvdz9lOndpbmRvdyk6ZT0+KG58fChuPVByb21pc2UucmVzb2x2ZSgpKSkudGhlbihlKS5jYXRjaChlPT5zZXRUaW1lb3V0KCgpPT57dGhyb3cgZX0sMCkpfSkuY2FsbCh0aGlzKX0pLmNhbGwodGhpcyxcInVuZGVmaW5lZFwiPT10eXBlb2YgZ2xvYmFsP1widW5kZWZpbmVkXCI9PXR5cGVvZiBzZWxmP1widW5kZWZpbmVkXCI9PXR5cGVvZiB3aW5kb3c/e306d2luZG93OnNlbGY6Z2xvYmFsKX0se31dLDE0OltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihuLHIpeyhmdW5jdGlvbigpeyd1c2Ugc3RyaWN0Jzt2YXIgYT1lKFwic2FmZS1idWZmZXJcIikuQnVmZmVyLG89ci5jcnlwdG98fHIubXNDcnlwdG87dC5leHBvcnRzPW8mJm8uZ2V0UmFuZG9tVmFsdWVzP2Z1bmN0aW9uKGUsdCl7aWYoZT40Mjk0OTY3Mjk1KXRocm93IG5ldyBSYW5nZUVycm9yKFwicmVxdWVzdGVkIHRvbyBtYW55IHJhbmRvbSBieXRlc1wiKTt2YXIgcj1hLmFsbG9jVW5zYWZlKGUpO2lmKDA8ZSlpZig2NTUzNjxlKWZvcih2YXIgaT0wO2k8ZTtpKz02NTUzNilvLmdldFJhbmRvbVZhbHVlcyhyLnNsaWNlKGksaSs2NTUzNikpO2Vsc2Ugby5nZXRSYW5kb21WYWx1ZXMocik7cmV0dXJuXCJmdW5jdGlvblwiPT10eXBlb2YgdD9uLm5leHRUaWNrKGZ1bmN0aW9uKCl7dChudWxsLHIpfSk6cn06ZnVuY3Rpb24oKXt0aHJvdyBuZXcgRXJyb3IoXCJTZWN1cmUgcmFuZG9tIG51bWJlciBnZW5lcmF0aW9uIGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhpcyBicm93c2VyLlxcblVzZSBDaHJvbWUsIEZpcmVmb3ggb3IgSW50ZXJuZXQgRXhwbG9yZXIgMTFcIil9fSkuY2FsbCh0aGlzKX0pLmNhbGwodGhpcyxlKFwiX3Byb2Nlc3NcIiksXCJ1bmRlZmluZWRcIj09dHlwZW9mIGdsb2JhbD9cInVuZGVmaW5lZFwiPT10eXBlb2Ygc2VsZj9cInVuZGVmaW5lZFwiPT10eXBlb2Ygd2luZG93P3t9OndpbmRvdzpzZWxmOmdsb2JhbCl9LHtfcHJvY2VzczoxMixcInNhZmUtYnVmZmVyXCI6MzB9XSwxNTpbZnVuY3Rpb24oZSx0KXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gbihlLHQpe2UucHJvdG90eXBlPU9iamVjdC5jcmVhdGUodC5wcm90b3R5cGUpLGUucHJvdG90eXBlLmNvbnN0cnVjdG9yPWUsZS5fX3Byb3RvX189dH1mdW5jdGlvbiByKGUsdCxyKXtmdW5jdGlvbiBhKGUsbixyKXtyZXR1cm5cInN0cmluZ1wiPT10eXBlb2YgdD90OnQoZSxuLHIpfXJ8fChyPUVycm9yKTt2YXIgbz1mdW5jdGlvbihlKXtmdW5jdGlvbiB0KHQsbixyKXtyZXR1cm4gZS5jYWxsKHRoaXMsYSh0LG4scikpfHx0aGlzfXJldHVybiBuKHQsZSksdH0ocik7by5wcm90b3R5cGUubmFtZT1yLm5hbWUsby5wcm90b3R5cGUuY29kZT1lLHNbZV09b31mdW5jdGlvbiBhKGUsdCl7aWYoQXJyYXkuaXNBcnJheShlKSl7dmFyIG49ZS5sZW5ndGg7cmV0dXJuIGU9ZS5tYXAoZnVuY3Rpb24oZSl7cmV0dXJuIGUrXCJcIn0pLDI8bj9cIm9uZSBvZiBcIi5jb25jYXQodCxcIiBcIikuY29uY2F0KGUuc2xpY2UoMCxuLTEpLmpvaW4oXCIsIFwiKSxcIiwgb3IgXCIpK2Vbbi0xXToyPT09bj9cIm9uZSBvZiBcIi5jb25jYXQodCxcIiBcIikuY29uY2F0KGVbMF0sXCIgb3IgXCIpLmNvbmNhdChlWzFdKTpcIm9mIFwiLmNvbmNhdCh0LFwiIFwiKS5jb25jYXQoZVswXSl9cmV0dXJuXCJvZiBcIi5jb25jYXQodCxcIiBcIikuY29uY2F0KGUrXCJcIil9ZnVuY3Rpb24gbyhlLHQsbil7cmV0dXJuIGUuc3Vic3RyKCFufHwwPm4/MDorbix0Lmxlbmd0aCk9PT10fWZ1bmN0aW9uIGkoZSx0LG4pe3JldHVybih2b2lkIDA9PT1ufHxuPmUubGVuZ3RoKSYmKG49ZS5sZW5ndGgpLGUuc3Vic3RyaW5nKG4tdC5sZW5ndGgsbik9PT10fWZ1bmN0aW9uIGQoZSx0LG4pe3JldHVyblwibnVtYmVyXCIhPXR5cGVvZiBuJiYobj0wKSwhKG4rdC5sZW5ndGg+ZS5sZW5ndGgpJiYtMSE9PWUuaW5kZXhPZih0LG4pfXZhciBzPXt9O3IoXCJFUlJfSU5WQUxJRF9PUFRfVkFMVUVcIixmdW5jdGlvbihlLHQpe3JldHVyblwiVGhlIHZhbHVlIFxcXCJcIit0K1wiXFxcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXFxcIlwiK2UrXCJcXFwiXCJ9LFR5cGVFcnJvcikscihcIkVSUl9JTlZBTElEX0FSR19UWVBFXCIsZnVuY3Rpb24oZSx0LG4pe3ZhciByO1wic3RyaW5nXCI9PXR5cGVvZiB0JiZvKHQsXCJub3QgXCIpPyhyPVwibXVzdCBub3QgYmVcIix0PXQucmVwbGFjZSgvXm5vdCAvLFwiXCIpKTpyPVwibXVzdCBiZVwiO3ZhciBzO2lmKGkoZSxcIiBhcmd1bWVudFwiKSlzPVwiVGhlIFwiLmNvbmNhdChlLFwiIFwiKS5jb25jYXQocixcIiBcIikuY29uY2F0KGEodCxcInR5cGVcIikpO2Vsc2V7dmFyIGw9ZChlLFwiLlwiKT9cInByb3BlcnR5XCI6XCJhcmd1bWVudFwiO3M9XCJUaGUgXFxcIlwiLmNvbmNhdChlLFwiXFxcIiBcIikuY29uY2F0KGwsXCIgXCIpLmNvbmNhdChyLFwiIFwiKS5jb25jYXQoYSh0LFwidHlwZVwiKSl9cmV0dXJuIHMrPVwiLiBSZWNlaXZlZCB0eXBlIFwiLmNvbmNhdCh0eXBlb2Ygbiksc30sVHlwZUVycm9yKSxyKFwiRVJSX1NUUkVBTV9QVVNIX0FGVEVSX0VPRlwiLFwic3RyZWFtLnB1c2goKSBhZnRlciBFT0ZcIikscihcIkVSUl9NRVRIT0RfTk9UX0lNUExFTUVOVEVEXCIsZnVuY3Rpb24oZSl7cmV0dXJuXCJUaGUgXCIrZStcIiBtZXRob2QgaXMgbm90IGltcGxlbWVudGVkXCJ9KSxyKFwiRVJSX1NUUkVBTV9QUkVNQVRVUkVfQ0xPU0VcIixcIlByZW1hdHVyZSBjbG9zZVwiKSxyKFwiRVJSX1NUUkVBTV9ERVNUUk9ZRURcIixmdW5jdGlvbihlKXtyZXR1cm5cIkNhbm5vdCBjYWxsIFwiK2UrXCIgYWZ0ZXIgYSBzdHJlYW0gd2FzIGRlc3Ryb3llZFwifSkscihcIkVSUl9NVUxUSVBMRV9DQUxMQkFDS1wiLFwiQ2FsbGJhY2sgY2FsbGVkIG11bHRpcGxlIHRpbWVzXCIpLHIoXCJFUlJfU1RSRUFNX0NBTk5PVF9QSVBFXCIsXCJDYW5ub3QgcGlwZSwgbm90IHJlYWRhYmxlXCIpLHIoXCJFUlJfU1RSRUFNX1dSSVRFX0FGVEVSX0VORFwiLFwid3JpdGUgYWZ0ZXIgZW5kXCIpLHIoXCJFUlJfU1RSRUFNX05VTExfVkFMVUVTXCIsXCJNYXkgbm90IHdyaXRlIG51bGwgdmFsdWVzIHRvIHN0cmVhbVwiLFR5cGVFcnJvcikscihcIkVSUl9VTktOT1dOX0VOQ09ESU5HXCIsZnVuY3Rpb24oZSl7cmV0dXJuXCJVbmtub3duIGVuY29kaW5nOiBcIitlfSxUeXBlRXJyb3IpLHIoXCJFUlJfU1RSRUFNX1VOU0hJRlRfQUZURVJfRU5EX0VWRU5UXCIsXCJzdHJlYW0udW5zaGlmdCgpIGFmdGVyIGVuZCBldmVudFwiKSx0LmV4cG9ydHMuY29kZXM9c30se31dLDE2OltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihuKXsoZnVuY3Rpb24oKXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gcihlKXtyZXR1cm4gdGhpcyBpbnN0YW5jZW9mIHI/dm9pZChkLmNhbGwodGhpcyxlKSxzLmNhbGwodGhpcyxlKSx0aGlzLmFsbG93SGFsZk9wZW49ITAsZSYmKCExPT09ZS5yZWFkYWJsZSYmKHRoaXMucmVhZGFibGU9ITEpLCExPT09ZS53cml0YWJsZSYmKHRoaXMud3JpdGFibGU9ITEpLCExPT09ZS5hbGxvd0hhbGZPcGVuJiYodGhpcy5hbGxvd0hhbGZPcGVuPSExLHRoaXMub25jZShcImVuZFwiLGEpKSkpOm5ldyByKGUpfWZ1bmN0aW9uIGEoKXt0aGlzLl93cml0YWJsZVN0YXRlLmVuZGVkfHxuLm5leHRUaWNrKG8sdGhpcyl9ZnVuY3Rpb24gbyhlKXtlLmVuZCgpfXZhciBpPU9iamVjdC5rZXlzfHxmdW5jdGlvbihlKXt2YXIgdD1bXTtmb3IodmFyIG4gaW4gZSl0LnB1c2gobik7cmV0dXJuIHR9O3QuZXhwb3J0cz1yO3ZhciBkPWUoXCIuL19zdHJlYW1fcmVhZGFibGVcIikscz1lKFwiLi9fc3RyZWFtX3dyaXRhYmxlXCIpO2UoXCJpbmhlcml0c1wiKShyLGQpO2Zvcih2YXIgbCxjPWkocy5wcm90b3R5cGUpLHU9MDt1PGMubGVuZ3RoO3UrKylsPWNbdV0sci5wcm90b3R5cGVbbF18fChyLnByb3RvdHlwZVtsXT1zLnByb3RvdHlwZVtsXSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KHIucHJvdG90eXBlLFwid3JpdGFibGVIaWdoV2F0ZXJNYXJrXCIse2VudW1lcmFibGU6ITEsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3dyaXRhYmxlU3RhdGUuaGlnaFdhdGVyTWFya319KSxPYmplY3QuZGVmaW5lUHJvcGVydHkoci5wcm90b3R5cGUsXCJ3cml0YWJsZUJ1ZmZlclwiLHtlbnVtZXJhYmxlOiExLGdldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLl93cml0YWJsZVN0YXRlJiZ0aGlzLl93cml0YWJsZVN0YXRlLmdldEJ1ZmZlcigpfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyLnByb3RvdHlwZSxcIndyaXRhYmxlTGVuZ3RoXCIse2VudW1lcmFibGU6ITEsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3dyaXRhYmxlU3RhdGUubGVuZ3RofX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyLnByb3RvdHlwZSxcImRlc3Ryb3llZFwiLHtlbnVtZXJhYmxlOiExLGdldDpmdW5jdGlvbigpe3JldHVybiB2b2lkIDAhPT10aGlzLl9yZWFkYWJsZVN0YXRlJiZ2b2lkIDAhPT10aGlzLl93cml0YWJsZVN0YXRlJiZ0aGlzLl9yZWFkYWJsZVN0YXRlLmRlc3Ryb3llZCYmdGhpcy5fd3JpdGFibGVTdGF0ZS5kZXN0cm95ZWR9LHNldDpmdW5jdGlvbihlKXt2b2lkIDA9PT10aGlzLl9yZWFkYWJsZVN0YXRlfHx2b2lkIDA9PT10aGlzLl93cml0YWJsZVN0YXRlfHwodGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWQ9ZSx0aGlzLl93cml0YWJsZVN0YXRlLmRlc3Ryb3llZD1lKX19KX0pLmNhbGwodGhpcyl9KS5jYWxsKHRoaXMsZShcIl9wcm9jZXNzXCIpKX0se1wiLi9fc3RyZWFtX3JlYWRhYmxlXCI6MTgsXCIuL19zdHJlYW1fd3JpdGFibGVcIjoyMCxfcHJvY2VzczoxMixpbmhlcml0czoxMH1dLDE3OltmdW5jdGlvbihlLHQpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBuKGUpe3JldHVybiB0aGlzIGluc3RhbmNlb2Ygbj92b2lkIHIuY2FsbCh0aGlzLGUpOm5ldyBuKGUpfXQuZXhwb3J0cz1uO3ZhciByPWUoXCIuL19zdHJlYW1fdHJhbnNmb3JtXCIpO2UoXCJpbmhlcml0c1wiKShuLHIpLG4ucHJvdG90eXBlLl90cmFuc2Zvcm09ZnVuY3Rpb24oZSx0LG4pe24obnVsbCxlKX19LHtcIi4vX3N0cmVhbV90cmFuc2Zvcm1cIjoxOSxpbmhlcml0czoxMH1dLDE4OltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihuLHIpeyhmdW5jdGlvbigpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBhKGUpe3JldHVybiBQLmZyb20oZSl9ZnVuY3Rpb24gbyhlKXtyZXR1cm4gUC5pc0J1ZmZlcihlKXx8ZSBpbnN0YW5jZW9mIE19ZnVuY3Rpb24gaShlLHQsbil7cmV0dXJuXCJmdW5jdGlvblwiPT10eXBlb2YgZS5wcmVwZW5kTGlzdGVuZXI/ZS5wcmVwZW5kTGlzdGVuZXIodCxuKTp2b2lkKGUuX2V2ZW50cyYmZS5fZXZlbnRzW3RdP0FycmF5LmlzQXJyYXkoZS5fZXZlbnRzW3RdKT9lLl9ldmVudHNbdF0udW5zaGlmdChuKTplLl9ldmVudHNbdF09W24sZS5fZXZlbnRzW3RdXTplLm9uKHQsbikpfWZ1bmN0aW9uIGQodCxuLHIpe0E9QXx8ZShcIi4vX3N0cmVhbV9kdXBsZXhcIiksdD10fHx7fSxcImJvb2xlYW5cIiE9dHlwZW9mIHImJihyPW4gaW5zdGFuY2VvZiBBKSx0aGlzLm9iamVjdE1vZGU9ISF0Lm9iamVjdE1vZGUsciYmKHRoaXMub2JqZWN0TW9kZT10aGlzLm9iamVjdE1vZGV8fCEhdC5yZWFkYWJsZU9iamVjdE1vZGUpLHRoaXMuaGlnaFdhdGVyTWFyaz1IKHRoaXMsdCxcInJlYWRhYmxlSGlnaFdhdGVyTWFya1wiLHIpLHRoaXMuYnVmZmVyPW5ldyBqLHRoaXMubGVuZ3RoPTAsdGhpcy5waXBlcz1udWxsLHRoaXMucGlwZXNDb3VudD0wLHRoaXMuZmxvd2luZz1udWxsLHRoaXMuZW5kZWQ9ITEsdGhpcy5lbmRFbWl0dGVkPSExLHRoaXMucmVhZGluZz0hMSx0aGlzLnN5bmM9ITAsdGhpcy5uZWVkUmVhZGFibGU9ITEsdGhpcy5lbWl0dGVkUmVhZGFibGU9ITEsdGhpcy5yZWFkYWJsZUxpc3RlbmluZz0hMSx0aGlzLnJlc3VtZVNjaGVkdWxlZD0hMSx0aGlzLnBhdXNlZD0hMCx0aGlzLmVtaXRDbG9zZT0hMSE9PXQuZW1pdENsb3NlLHRoaXMuYXV0b0Rlc3Ryb3k9ISF0LmF1dG9EZXN0cm95LHRoaXMuZGVzdHJveWVkPSExLHRoaXMuZGVmYXVsdEVuY29kaW5nPXQuZGVmYXVsdEVuY29kaW5nfHxcInV0ZjhcIix0aGlzLmF3YWl0RHJhaW49MCx0aGlzLnJlYWRpbmdNb3JlPSExLHRoaXMuZGVjb2Rlcj1udWxsLHRoaXMuZW5jb2Rpbmc9bnVsbCx0LmVuY29kaW5nJiYoIUYmJihGPWUoXCJzdHJpbmdfZGVjb2Rlci9cIikuU3RyaW5nRGVjb2RlciksdGhpcy5kZWNvZGVyPW5ldyBGKHQuZW5jb2RpbmcpLHRoaXMuZW5jb2Rpbmc9dC5lbmNvZGluZyl9ZnVuY3Rpb24gcyh0KXtpZihBPUF8fGUoXCIuL19zdHJlYW1fZHVwbGV4XCIpLCEodGhpcyBpbnN0YW5jZW9mIHMpKXJldHVybiBuZXcgcyh0KTt2YXIgbj10aGlzIGluc3RhbmNlb2YgQTt0aGlzLl9yZWFkYWJsZVN0YXRlPW5ldyBkKHQsdGhpcyxuKSx0aGlzLnJlYWRhYmxlPSEwLHQmJihcImZ1bmN0aW9uXCI9PXR5cGVvZiB0LnJlYWQmJih0aGlzLl9yZWFkPXQucmVhZCksXCJmdW5jdGlvblwiPT10eXBlb2YgdC5kZXN0cm95JiYodGhpcy5fZGVzdHJveT10LmRlc3Ryb3kpKSxJLmNhbGwodGhpcyl9ZnVuY3Rpb24gbChlLHQsbixyLG8pe3goXCJyZWFkYWJsZUFkZENodW5rXCIsdCk7dmFyIGk9ZS5fcmVhZGFibGVTdGF0ZTtpZihudWxsPT09dClpLnJlYWRpbmc9ITEsZyhlLGkpO2Vsc2V7dmFyIGQ7aWYob3x8KGQ9dShpLHQpKSxkKVgoZSxkKTtlbHNlIGlmKCEoaS5vYmplY3RNb2RlfHx0JiYwPHQubGVuZ3RoKSlyfHwoaS5yZWFkaW5nPSExLG0oZSxpKSk7ZWxzZSBpZihcInN0cmluZ1wiPT10eXBlb2YgdHx8aS5vYmplY3RNb2RlfHxPYmplY3QuZ2V0UHJvdG90eXBlT2YodCk9PT1QLnByb3RvdHlwZXx8KHQ9YSh0KSkscilpLmVuZEVtaXR0ZWQ/WChlLG5ldyBLKTpjKGUsaSx0LCEwKTtlbHNlIGlmKGkuZW5kZWQpWChlLG5ldyB6KTtlbHNle2lmKGkuZGVzdHJveWVkKXJldHVybiExO2kucmVhZGluZz0hMSxpLmRlY29kZXImJiFuPyh0PWkuZGVjb2Rlci53cml0ZSh0KSxpLm9iamVjdE1vZGV8fDAhPT10Lmxlbmd0aD9jKGUsaSx0LCExKTptKGUsaSkpOmMoZSxpLHQsITEpfX1yZXR1cm4haS5lbmRlZCYmKGkubGVuZ3RoPGkuaGlnaFdhdGVyTWFya3x8MD09PWkubGVuZ3RoKX1mdW5jdGlvbiBjKGUsdCxuLHIpe3QuZmxvd2luZyYmMD09PXQubGVuZ3RoJiYhdC5zeW5jPyh0LmF3YWl0RHJhaW49MCxlLmVtaXQoXCJkYXRhXCIsbikpOih0Lmxlbmd0aCs9dC5vYmplY3RNb2RlPzE6bi5sZW5ndGgscj90LmJ1ZmZlci51bnNoaWZ0KG4pOnQuYnVmZmVyLnB1c2gobiksdC5uZWVkUmVhZGFibGUmJl8oZSkpLG0oZSx0KX1mdW5jdGlvbiB1KGUsdCl7dmFyIG47cmV0dXJuIG8odCl8fFwic3RyaW5nXCI9PXR5cGVvZiB0fHx2b2lkIDA9PT10fHxlLm9iamVjdE1vZGV8fChuPW5ldyBWKFwiY2h1bmtcIixbXCJzdHJpbmdcIixcIkJ1ZmZlclwiLFwiVWludDhBcnJheVwiXSx0KSksbn1mdW5jdGlvbiBwKGUpe3JldHVybiAxMDczNzQxODI0PD1lP2U9MTA3Mzc0MTgyNDooZS0tLGV8PWU+Pj4xLGV8PWU+Pj4yLGV8PWU+Pj40LGV8PWU+Pj44LGV8PWU+Pj4xNixlKyspLGV9ZnVuY3Rpb24gZihlLHQpe3JldHVybiAwPj1lfHwwPT09dC5sZW5ndGgmJnQuZW5kZWQ/MDp0Lm9iamVjdE1vZGU/MTplPT09ZT8oZT50LmhpZ2hXYXRlck1hcmsmJih0LmhpZ2hXYXRlck1hcms9cChlKSksZTw9dC5sZW5ndGg/ZTp0LmVuZGVkP3QubGVuZ3RoOih0Lm5lZWRSZWFkYWJsZT0hMCwwKSk6dC5mbG93aW5nJiZ0Lmxlbmd0aD90LmJ1ZmZlci5oZWFkLmRhdGEubGVuZ3RoOnQubGVuZ3RofWZ1bmN0aW9uIGcoZSx0KXtpZih4KFwib25Fb2ZDaHVua1wiKSwhdC5lbmRlZCl7aWYodC5kZWNvZGVyKXt2YXIgbj10LmRlY29kZXIuZW5kKCk7biYmbi5sZW5ndGgmJih0LmJ1ZmZlci5wdXNoKG4pLHQubGVuZ3RoKz10Lm9iamVjdE1vZGU/MTpuLmxlbmd0aCl9dC5lbmRlZD0hMCx0LnN5bmM/XyhlKToodC5uZWVkUmVhZGFibGU9ITEsIXQuZW1pdHRlZFJlYWRhYmxlJiYodC5lbWl0dGVkUmVhZGFibGU9ITAsaChlKSkpfX1mdW5jdGlvbiBfKGUpe3ZhciB0PWUuX3JlYWRhYmxlU3RhdGU7eChcImVtaXRSZWFkYWJsZVwiLHQubmVlZFJlYWRhYmxlLHQuZW1pdHRlZFJlYWRhYmxlKSx0Lm5lZWRSZWFkYWJsZT0hMSx0LmVtaXR0ZWRSZWFkYWJsZXx8KHgoXCJlbWl0UmVhZGFibGVcIix0LmZsb3dpbmcpLHQuZW1pdHRlZFJlYWRhYmxlPSEwLG4ubmV4dFRpY2soaCxlKSl9ZnVuY3Rpb24gaChlKXt2YXIgdD1lLl9yZWFkYWJsZVN0YXRlO3goXCJlbWl0UmVhZGFibGVfXCIsdC5kZXN0cm95ZWQsdC5sZW5ndGgsdC5lbmRlZCksIXQuZGVzdHJveWVkJiYodC5sZW5ndGh8fHQuZW5kZWQpJiYoZS5lbWl0KFwicmVhZGFibGVcIiksdC5lbWl0dGVkUmVhZGFibGU9ITEpLHQubmVlZFJlYWRhYmxlPSF0LmZsb3dpbmcmJiF0LmVuZGVkJiZ0Lmxlbmd0aDw9dC5oaWdoV2F0ZXJNYXJrLFMoZSl9ZnVuY3Rpb24gbShlLHQpe3QucmVhZGluZ01vcmV8fCh0LnJlYWRpbmdNb3JlPSEwLG4ubmV4dFRpY2soYixlLHQpKX1mdW5jdGlvbiBiKGUsdCl7Zm9yKDshdC5yZWFkaW5nJiYhdC5lbmRlZCYmKHQubGVuZ3RoPHQuaGlnaFdhdGVyTWFya3x8dC5mbG93aW5nJiYwPT09dC5sZW5ndGgpOyl7dmFyIG49dC5sZW5ndGg7aWYoeChcIm1heWJlUmVhZE1vcmUgcmVhZCAwXCIpLGUucmVhZCgwKSxuPT09dC5sZW5ndGgpYnJlYWt9dC5yZWFkaW5nTW9yZT0hMX1mdW5jdGlvbiB5KGUpe3JldHVybiBmdW5jdGlvbigpe3ZhciB0PWUuX3JlYWRhYmxlU3RhdGU7eChcInBpcGVPbkRyYWluXCIsdC5hd2FpdERyYWluKSx0LmF3YWl0RHJhaW4mJnQuYXdhaXREcmFpbi0tLDA9PT10LmF3YWl0RHJhaW4mJkQoZSxcImRhdGFcIikmJih0LmZsb3dpbmc9ITAsUyhlKSl9fWZ1bmN0aW9uIEMoZSl7dmFyIHQ9ZS5fcmVhZGFibGVTdGF0ZTt0LnJlYWRhYmxlTGlzdGVuaW5nPTA8ZS5saXN0ZW5lckNvdW50KFwicmVhZGFibGVcIiksdC5yZXN1bWVTY2hlZHVsZWQmJiF0LnBhdXNlZD90LmZsb3dpbmc9ITA6MDxlLmxpc3RlbmVyQ291bnQoXCJkYXRhXCIpJiZlLnJlc3VtZSgpfWZ1bmN0aW9uIFIoZSl7eChcInJlYWRhYmxlIG5leHR0aWNrIHJlYWQgMFwiKSxlLnJlYWQoMCl9ZnVuY3Rpb24gRShlLHQpe3QucmVzdW1lU2NoZWR1bGVkfHwodC5yZXN1bWVTY2hlZHVsZWQ9ITAsbi5uZXh0VGljayh3LGUsdCkpfWZ1bmN0aW9uIHcoZSx0KXt4KFwicmVzdW1lXCIsdC5yZWFkaW5nKSx0LnJlYWRpbmd8fGUucmVhZCgwKSx0LnJlc3VtZVNjaGVkdWxlZD0hMSxlLmVtaXQoXCJyZXN1bWVcIiksUyhlKSx0LmZsb3dpbmcmJiF0LnJlYWRpbmcmJmUucmVhZCgwKX1mdW5jdGlvbiBTKGUpe3ZhciB0PWUuX3JlYWRhYmxlU3RhdGU7Zm9yKHgoXCJmbG93XCIsdC5mbG93aW5nKTt0LmZsb3dpbmcmJm51bGwhPT1lLnJlYWQoKTspO31mdW5jdGlvbiBUKGUsdCl7aWYoMD09PXQubGVuZ3RoKXJldHVybiBudWxsO3ZhciBuO3JldHVybiB0Lm9iamVjdE1vZGU/bj10LmJ1ZmZlci5zaGlmdCgpOiFlfHxlPj10Lmxlbmd0aD8obj10LmRlY29kZXI/dC5idWZmZXIuam9pbihcIlwiKToxPT09dC5idWZmZXIubGVuZ3RoP3QuYnVmZmVyLmZpcnN0KCk6dC5idWZmZXIuY29uY2F0KHQubGVuZ3RoKSx0LmJ1ZmZlci5jbGVhcigpKTpuPXQuYnVmZmVyLmNvbnN1bWUoZSx0LmRlY29kZXIpLG59ZnVuY3Rpb24gdihlKXt2YXIgdD1lLl9yZWFkYWJsZVN0YXRlO3goXCJlbmRSZWFkYWJsZVwiLHQuZW5kRW1pdHRlZCksdC5lbmRFbWl0dGVkfHwodC5lbmRlZD0hMCxuLm5leHRUaWNrKGssdCxlKSl9ZnVuY3Rpb24gayhlLHQpe2lmKHgoXCJlbmRSZWFkYWJsZU5UXCIsZS5lbmRFbWl0dGVkLGUubGVuZ3RoKSwhZS5lbmRFbWl0dGVkJiYwPT09ZS5sZW5ndGgmJihlLmVuZEVtaXR0ZWQ9ITAsdC5yZWFkYWJsZT0hMSx0LmVtaXQoXCJlbmRcIiksZS5hdXRvRGVzdHJveSkpe3ZhciBuPXQuX3dyaXRhYmxlU3RhdGU7KCFufHxuLmF1dG9EZXN0cm95JiZuLmZpbmlzaGVkKSYmdC5kZXN0cm95KCl9fWZ1bmN0aW9uIEwoZSx0KXtmb3IodmFyIG49MCxyPWUubGVuZ3RoO248cjtuKyspaWYoZVtuXT09PXQpcmV0dXJuIG47cmV0dXJuLTF9dC5leHBvcnRzPXM7dmFyIEE7cy5SZWFkYWJsZVN0YXRlPWQ7dmFyIHgsTj1lKFwiZXZlbnRzXCIpLkV2ZW50RW1pdHRlcixEPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGUubGlzdGVuZXJzKHQpLmxlbmd0aH0sST1lKFwiLi9pbnRlcm5hbC9zdHJlYW1zL3N0cmVhbVwiKSxQPWUoXCJidWZmZXJcIikuQnVmZmVyLE09ci5VaW50OEFycmF5fHxmdW5jdGlvbigpe30sTz1lKFwidXRpbFwiKTt4PU8mJk8uZGVidWdsb2c/Ty5kZWJ1Z2xvZyhcInN0cmVhbVwiKTpmdW5jdGlvbigpe307dmFyIEYsQixVLGo9ZShcIi4vaW50ZXJuYWwvc3RyZWFtcy9idWZmZXJfbGlzdFwiKSxxPWUoXCIuL2ludGVybmFsL3N0cmVhbXMvZGVzdHJveVwiKSxXPWUoXCIuL2ludGVybmFsL3N0cmVhbXMvc3RhdGVcIiksSD1XLmdldEhpZ2hXYXRlck1hcmssWT1lKFwiLi4vZXJyb3JzXCIpLmNvZGVzLFY9WS5FUlJfSU5WQUxJRF9BUkdfVFlQRSx6PVkuRVJSX1NUUkVBTV9QVVNIX0FGVEVSX0VPRixHPVkuRVJSX01FVEhPRF9OT1RfSU1QTEVNRU5URUQsSz1ZLkVSUl9TVFJFQU1fVU5TSElGVF9BRlRFUl9FTkRfRVZFTlQ7ZShcImluaGVyaXRzXCIpKHMsSSk7dmFyIFg9cS5lcnJvck9yRGVzdHJveSwkPVtcImVycm9yXCIsXCJjbG9zZVwiLFwiZGVzdHJveVwiLFwicGF1c2VcIixcInJlc3VtZVwiXTtPYmplY3QuZGVmaW5lUHJvcGVydHkocy5wcm90b3R5cGUsXCJkZXN0cm95ZWRcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdm9pZCAwIT09dGhpcy5fcmVhZGFibGVTdGF0ZSYmdGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWR9LHNldDpmdW5jdGlvbihlKXt0aGlzLl9yZWFkYWJsZVN0YXRlJiYodGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWQ9ZSl9fSkscy5wcm90b3R5cGUuZGVzdHJveT1xLmRlc3Ryb3kscy5wcm90b3R5cGUuX3VuZGVzdHJveT1xLnVuZGVzdHJveSxzLnByb3RvdHlwZS5fZGVzdHJveT1mdW5jdGlvbihlLHQpe3QoZSl9LHMucHJvdG90eXBlLnB1c2g9ZnVuY3Rpb24oZSx0KXt2YXIgbixyPXRoaXMuX3JlYWRhYmxlU3RhdGU7cmV0dXJuIHIub2JqZWN0TW9kZT9uPSEwOlwic3RyaW5nXCI9PXR5cGVvZiBlJiYodD10fHxyLmRlZmF1bHRFbmNvZGluZyx0IT09ci5lbmNvZGluZyYmKGU9UC5mcm9tKGUsdCksdD1cIlwiKSxuPSEwKSxsKHRoaXMsZSx0LCExLG4pfSxzLnByb3RvdHlwZS51bnNoaWZ0PWZ1bmN0aW9uKGUpe3JldHVybiBsKHRoaXMsZSxudWxsLCEwLCExKX0scy5wcm90b3R5cGUuaXNQYXVzZWQ9ZnVuY3Rpb24oKXtyZXR1cm4hMT09PXRoaXMuX3JlYWRhYmxlU3RhdGUuZmxvd2luZ30scy5wcm90b3R5cGUuc2V0RW5jb2Rpbmc9ZnVuY3Rpb24odCl7Rnx8KEY9ZShcInN0cmluZ19kZWNvZGVyL1wiKS5TdHJpbmdEZWNvZGVyKTt2YXIgbj1uZXcgRih0KTt0aGlzLl9yZWFkYWJsZVN0YXRlLmRlY29kZXI9bix0aGlzLl9yZWFkYWJsZVN0YXRlLmVuY29kaW5nPXRoaXMuX3JlYWRhYmxlU3RhdGUuZGVjb2Rlci5lbmNvZGluZztmb3IodmFyIHI9dGhpcy5fcmVhZGFibGVTdGF0ZS5idWZmZXIuaGVhZCxhPVwiXCI7bnVsbCE9PXI7KWErPW4ud3JpdGUoci5kYXRhKSxyPXIubmV4dDtyZXR1cm4gdGhpcy5fcmVhZGFibGVTdGF0ZS5idWZmZXIuY2xlYXIoKSxcIlwiIT09YSYmdGhpcy5fcmVhZGFibGVTdGF0ZS5idWZmZXIucHVzaChhKSx0aGlzLl9yZWFkYWJsZVN0YXRlLmxlbmd0aD1hLmxlbmd0aCx0aGlzfTtzLnByb3RvdHlwZS5yZWFkPWZ1bmN0aW9uKGUpe3goXCJyZWFkXCIsZSksZT1wYXJzZUludChlLDEwKTt2YXIgdD10aGlzLl9yZWFkYWJsZVN0YXRlLHI9ZTtpZigwIT09ZSYmKHQuZW1pdHRlZFJlYWRhYmxlPSExKSwwPT09ZSYmdC5uZWVkUmVhZGFibGUmJigoMD09PXQuaGlnaFdhdGVyTWFyaz8wPHQubGVuZ3RoOnQubGVuZ3RoPj10LmhpZ2hXYXRlck1hcmspfHx0LmVuZGVkKSlyZXR1cm4geChcInJlYWQ6IGVtaXRSZWFkYWJsZVwiLHQubGVuZ3RoLHQuZW5kZWQpLDA9PT10Lmxlbmd0aCYmdC5lbmRlZD92KHRoaXMpOl8odGhpcyksbnVsbDtpZihlPWYoZSx0KSwwPT09ZSYmdC5lbmRlZClyZXR1cm4gMD09PXQubGVuZ3RoJiZ2KHRoaXMpLG51bGw7dmFyIGE9dC5uZWVkUmVhZGFibGU7eChcIm5lZWQgcmVhZGFibGVcIixhKSwoMD09PXQubGVuZ3RofHx0Lmxlbmd0aC1lPHQuaGlnaFdhdGVyTWFyaykmJihhPSEwLHgoXCJsZW5ndGggbGVzcyB0aGFuIHdhdGVybWFya1wiLGEpKSx0LmVuZGVkfHx0LnJlYWRpbmc/KGE9ITEseChcInJlYWRpbmcgb3IgZW5kZWRcIixhKSk6YSYmKHgoXCJkbyByZWFkXCIpLHQucmVhZGluZz0hMCx0LnN5bmM9ITAsMD09PXQubGVuZ3RoJiYodC5uZWVkUmVhZGFibGU9ITApLHRoaXMuX3JlYWQodC5oaWdoV2F0ZXJNYXJrKSx0LnN5bmM9ITEsIXQucmVhZGluZyYmKGU9ZihyLHQpKSk7dmFyIG87cmV0dXJuIG89MDxlP1QoZSx0KTpudWxsLG51bGw9PT1vPyh0Lm5lZWRSZWFkYWJsZT10Lmxlbmd0aDw9dC5oaWdoV2F0ZXJNYXJrLGU9MCk6KHQubGVuZ3RoLT1lLHQuYXdhaXREcmFpbj0wKSwwPT09dC5sZW5ndGgmJighdC5lbmRlZCYmKHQubmVlZFJlYWRhYmxlPSEwKSxyIT09ZSYmdC5lbmRlZCYmdih0aGlzKSksbnVsbCE9PW8mJnRoaXMuZW1pdChcImRhdGFcIixvKSxvfSxzLnByb3RvdHlwZS5fcmVhZD1mdW5jdGlvbigpe1godGhpcyxuZXcgRyhcIl9yZWFkKClcIikpfSxzLnByb3RvdHlwZS5waXBlPWZ1bmN0aW9uKGUsdCl7ZnVuY3Rpb24gcihlLHQpe3goXCJvbnVucGlwZVwiKSxlPT09cCYmdCYmITE9PT10Lmhhc1VucGlwZWQmJih0Lmhhc1VucGlwZWQ9ITAsbygpKX1mdW5jdGlvbiBhKCl7eChcIm9uZW5kXCIpLGUuZW5kKCl9ZnVuY3Rpb24gbygpe3goXCJjbGVhbnVwXCIpLGUucmVtb3ZlTGlzdGVuZXIoXCJjbG9zZVwiLGwpLGUucmVtb3ZlTGlzdGVuZXIoXCJmaW5pc2hcIixjKSxlLnJlbW92ZUxpc3RlbmVyKFwiZHJhaW5cIixoKSxlLnJlbW92ZUxpc3RlbmVyKFwiZXJyb3JcIixzKSxlLnJlbW92ZUxpc3RlbmVyKFwidW5waXBlXCIscikscC5yZW1vdmVMaXN0ZW5lcihcImVuZFwiLGEpLHAucmVtb3ZlTGlzdGVuZXIoXCJlbmRcIix1KSxwLnJlbW92ZUxpc3RlbmVyKFwiZGF0YVwiLGQpLG09ITAsZi5hd2FpdERyYWluJiYoIWUuX3dyaXRhYmxlU3RhdGV8fGUuX3dyaXRhYmxlU3RhdGUubmVlZERyYWluKSYmaCgpfWZ1bmN0aW9uIGQodCl7eChcIm9uZGF0YVwiKTt2YXIgbj1lLndyaXRlKHQpO3goXCJkZXN0LndyaXRlXCIsbiksITE9PT1uJiYoKDE9PT1mLnBpcGVzQ291bnQmJmYucGlwZXM9PT1lfHwxPGYucGlwZXNDb3VudCYmLTEhPT1MKGYucGlwZXMsZSkpJiYhbSYmKHgoXCJmYWxzZSB3cml0ZSByZXNwb25zZSwgcGF1c2VcIixmLmF3YWl0RHJhaW4pLGYuYXdhaXREcmFpbisrKSxwLnBhdXNlKCkpfWZ1bmN0aW9uIHModCl7eChcIm9uZXJyb3JcIix0KSx1KCksZS5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIscyksMD09PUQoZSxcImVycm9yXCIpJiZYKGUsdCl9ZnVuY3Rpb24gbCgpe2UucmVtb3ZlTGlzdGVuZXIoXCJmaW5pc2hcIixjKSx1KCl9ZnVuY3Rpb24gYygpe3goXCJvbmZpbmlzaFwiKSxlLnJlbW92ZUxpc3RlbmVyKFwiY2xvc2VcIixsKSx1KCl9ZnVuY3Rpb24gdSgpe3goXCJ1bnBpcGVcIikscC51bnBpcGUoZSl9dmFyIHA9dGhpcyxmPXRoaXMuX3JlYWRhYmxlU3RhdGU7c3dpdGNoKGYucGlwZXNDb3VudCl7Y2FzZSAwOmYucGlwZXM9ZTticmVhaztjYXNlIDE6Zi5waXBlcz1bZi5waXBlcyxlXTticmVhaztkZWZhdWx0OmYucGlwZXMucHVzaChlKTt9Zi5waXBlc0NvdW50Kz0xLHgoXCJwaXBlIGNvdW50PSVkIG9wdHM9JWpcIixmLnBpcGVzQ291bnQsdCk7dmFyIGc9KCF0fHwhMSE9PXQuZW5kKSYmZSE9PW4uc3Rkb3V0JiZlIT09bi5zdGRlcnIsXz1nP2E6dTtmLmVuZEVtaXR0ZWQ/bi5uZXh0VGljayhfKTpwLm9uY2UoXCJlbmRcIixfKSxlLm9uKFwidW5waXBlXCIscik7dmFyIGg9eShwKTtlLm9uKFwiZHJhaW5cIixoKTt2YXIgbT0hMTtyZXR1cm4gcC5vbihcImRhdGFcIixkKSxpKGUsXCJlcnJvclwiLHMpLGUub25jZShcImNsb3NlXCIsbCksZS5vbmNlKFwiZmluaXNoXCIsYyksZS5lbWl0KFwicGlwZVwiLHApLGYuZmxvd2luZ3x8KHgoXCJwaXBlIHJlc3VtZVwiKSxwLnJlc3VtZSgpKSxlfSxzLnByb3RvdHlwZS51bnBpcGU9ZnVuY3Rpb24oZSl7dmFyIHQ9dGhpcy5fcmVhZGFibGVTdGF0ZSxuPXtoYXNVbnBpcGVkOiExfTtpZigwPT09dC5waXBlc0NvdW50KXJldHVybiB0aGlzO2lmKDE9PT10LnBpcGVzQ291bnQpcmV0dXJuIGUmJmUhPT10LnBpcGVzP3RoaXM6KGV8fChlPXQucGlwZXMpLHQucGlwZXM9bnVsbCx0LnBpcGVzQ291bnQ9MCx0LmZsb3dpbmc9ITEsZSYmZS5lbWl0KFwidW5waXBlXCIsdGhpcyxuKSx0aGlzKTtpZighZSl7dmFyIHI9dC5waXBlcyxhPXQucGlwZXNDb3VudDt0LnBpcGVzPW51bGwsdC5waXBlc0NvdW50PTAsdC5mbG93aW5nPSExO2Zvcih2YXIgbz0wO288YTtvKyspcltvXS5lbWl0KFwidW5waXBlXCIsdGhpcyx7aGFzVW5waXBlZDohMX0pO3JldHVybiB0aGlzfXZhciBkPUwodC5waXBlcyxlKTtyZXR1cm4tMT09PWQ/dGhpczoodC5waXBlcy5zcGxpY2UoZCwxKSx0LnBpcGVzQ291bnQtPTEsMT09PXQucGlwZXNDb3VudCYmKHQucGlwZXM9dC5waXBlc1swXSksZS5lbWl0KFwidW5waXBlXCIsdGhpcyxuKSx0aGlzKX0scy5wcm90b3R5cGUub249ZnVuY3Rpb24oZSx0KXt2YXIgcj1JLnByb3RvdHlwZS5vbi5jYWxsKHRoaXMsZSx0KSxhPXRoaXMuX3JlYWRhYmxlU3RhdGU7cmV0dXJuXCJkYXRhXCI9PT1lPyhhLnJlYWRhYmxlTGlzdGVuaW5nPTA8dGhpcy5saXN0ZW5lckNvdW50KFwicmVhZGFibGVcIiksITEhPT1hLmZsb3dpbmcmJnRoaXMucmVzdW1lKCkpOlwicmVhZGFibGVcIj09ZSYmIWEuZW5kRW1pdHRlZCYmIWEucmVhZGFibGVMaXN0ZW5pbmcmJihhLnJlYWRhYmxlTGlzdGVuaW5nPWEubmVlZFJlYWRhYmxlPSEwLGEuZmxvd2luZz0hMSxhLmVtaXR0ZWRSZWFkYWJsZT0hMSx4KFwib24gcmVhZGFibGVcIixhLmxlbmd0aCxhLnJlYWRpbmcpLGEubGVuZ3RoP18odGhpcyk6IWEucmVhZGluZyYmbi5uZXh0VGljayhSLHRoaXMpKSxyfSxzLnByb3RvdHlwZS5hZGRMaXN0ZW5lcj1zLnByb3RvdHlwZS5vbixzLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcj1mdW5jdGlvbihlLHQpe3ZhciByPUkucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyLmNhbGwodGhpcyxlLHQpO3JldHVyblwicmVhZGFibGVcIj09PWUmJm4ubmV4dFRpY2soQyx0aGlzKSxyfSxzLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnM9ZnVuY3Rpb24oZSl7dmFyIHQ9SS5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzLmFwcGx5KHRoaXMsYXJndW1lbnRzKTtyZXR1cm4oXCJyZWFkYWJsZVwiPT09ZXx8dm9pZCAwPT09ZSkmJm4ubmV4dFRpY2soQyx0aGlzKSx0fSxzLnByb3RvdHlwZS5yZXN1bWU9ZnVuY3Rpb24oKXt2YXIgZT10aGlzLl9yZWFkYWJsZVN0YXRlO3JldHVybiBlLmZsb3dpbmd8fCh4KFwicmVzdW1lXCIpLGUuZmxvd2luZz0hZS5yZWFkYWJsZUxpc3RlbmluZyxFKHRoaXMsZSkpLGUucGF1c2VkPSExLHRoaXN9LHMucHJvdG90eXBlLnBhdXNlPWZ1bmN0aW9uKCl7cmV0dXJuIHgoXCJjYWxsIHBhdXNlIGZsb3dpbmc9JWpcIix0aGlzLl9yZWFkYWJsZVN0YXRlLmZsb3dpbmcpLCExIT09dGhpcy5fcmVhZGFibGVTdGF0ZS5mbG93aW5nJiYoeChcInBhdXNlXCIpLHRoaXMuX3JlYWRhYmxlU3RhdGUuZmxvd2luZz0hMSx0aGlzLmVtaXQoXCJwYXVzZVwiKSksdGhpcy5fcmVhZGFibGVTdGF0ZS5wYXVzZWQ9ITAsdGhpc30scy5wcm90b3R5cGUud3JhcD1mdW5jdGlvbihlKXt2YXIgdD10aGlzLHI9dGhpcy5fcmVhZGFibGVTdGF0ZSxhPSExO2Zvcih2YXIgbyBpbiBlLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtpZih4KFwid3JhcHBlZCBlbmRcIiksci5kZWNvZGVyJiYhci5lbmRlZCl7dmFyIGU9ci5kZWNvZGVyLmVuZCgpO2UmJmUubGVuZ3RoJiZ0LnB1c2goZSl9dC5wdXNoKG51bGwpfSksZS5vbihcImRhdGFcIixmdW5jdGlvbihuKXtpZigoeChcIndyYXBwZWQgZGF0YVwiKSxyLmRlY29kZXImJihuPXIuZGVjb2Rlci53cml0ZShuKSksIShyLm9iamVjdE1vZGUmJihudWxsPT09bnx8dm9pZCAwPT09bikpKSYmKHIub2JqZWN0TW9kZXx8biYmbi5sZW5ndGgpKXt2YXIgbz10LnB1c2gobik7b3x8KGE9ITAsZS5wYXVzZSgpKX19KSxlKXZvaWQgMD09PXRoaXNbb10mJlwiZnVuY3Rpb25cIj09dHlwZW9mIGVbb10mJih0aGlzW29dPWZ1bmN0aW9uKHQpe3JldHVybiBmdW5jdGlvbigpe3JldHVybiBlW3RdLmFwcGx5KGUsYXJndW1lbnRzKX19KG8pKTtmb3IodmFyIGk9MDtpPCQubGVuZ3RoO2krKyllLm9uKCRbaV0sdGhpcy5lbWl0LmJpbmQodGhpcywkW2ldKSk7cmV0dXJuIHRoaXMuX3JlYWQ9ZnVuY3Rpb24odCl7eChcIndyYXBwZWQgX3JlYWRcIix0KSxhJiYoYT0hMSxlLnJlc3VtZSgpKX0sdGhpc30sXCJmdW5jdGlvblwiPT10eXBlb2YgU3ltYm9sJiYocy5wcm90b3R5cGVbU3ltYm9sLmFzeW5jSXRlcmF0b3JdPWZ1bmN0aW9uKCl7cmV0dXJuIHZvaWQgMD09PUImJihCPWUoXCIuL2ludGVybmFsL3N0cmVhbXMvYXN5bmNfaXRlcmF0b3JcIikpLEIodGhpcyl9KSxPYmplY3QuZGVmaW5lUHJvcGVydHkocy5wcm90b3R5cGUsXCJyZWFkYWJsZUhpZ2hXYXRlck1hcmtcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fcmVhZGFibGVTdGF0ZS5oaWdoV2F0ZXJNYXJrfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzLnByb3RvdHlwZSxcInJlYWRhYmxlQnVmZmVyXCIse2VudW1lcmFibGU6ITEsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3JlYWRhYmxlU3RhdGUmJnRoaXMuX3JlYWRhYmxlU3RhdGUuYnVmZmVyfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzLnByb3RvdHlwZSxcInJlYWRhYmxlRmxvd2luZ1wiLHtlbnVtZXJhYmxlOiExLGdldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9yZWFkYWJsZVN0YXRlLmZsb3dpbmd9LHNldDpmdW5jdGlvbihlKXt0aGlzLl9yZWFkYWJsZVN0YXRlJiYodGhpcy5fcmVhZGFibGVTdGF0ZS5mbG93aW5nPWUpfX0pLHMuX2Zyb21MaXN0PVQsT2JqZWN0LmRlZmluZVByb3BlcnR5KHMucHJvdG90eXBlLFwicmVhZGFibGVMZW5ndGhcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fcmVhZGFibGVTdGF0ZS5sZW5ndGh9fSksXCJmdW5jdGlvblwiPT10eXBlb2YgU3ltYm9sJiYocy5mcm9tPWZ1bmN0aW9uKHQsbil7cmV0dXJuIHZvaWQgMD09PVUmJihVPWUoXCIuL2ludGVybmFsL3N0cmVhbXMvZnJvbVwiKSksVShzLHQsbil9KX0pLmNhbGwodGhpcyl9KS5jYWxsKHRoaXMsZShcIl9wcm9jZXNzXCIpLFwidW5kZWZpbmVkXCI9PXR5cGVvZiBnbG9iYWw/XCJ1bmRlZmluZWRcIj09dHlwZW9mIHNlbGY/XCJ1bmRlZmluZWRcIj09dHlwZW9mIHdpbmRvdz97fTp3aW5kb3c6c2VsZjpnbG9iYWwpfSx7XCIuLi9lcnJvcnNcIjoxNSxcIi4vX3N0cmVhbV9kdXBsZXhcIjoxNixcIi4vaW50ZXJuYWwvc3RyZWFtcy9hc3luY19pdGVyYXRvclwiOjIxLFwiLi9pbnRlcm5hbC9zdHJlYW1zL2J1ZmZlcl9saXN0XCI6MjIsXCIuL2ludGVybmFsL3N0cmVhbXMvZGVzdHJveVwiOjIzLFwiLi9pbnRlcm5hbC9zdHJlYW1zL2Zyb21cIjoyNSxcIi4vaW50ZXJuYWwvc3RyZWFtcy9zdGF0ZVwiOjI3LFwiLi9pbnRlcm5hbC9zdHJlYW1zL3N0cmVhbVwiOjI4LF9wcm9jZXNzOjEyLGJ1ZmZlcjozLGV2ZW50czo3LGluaGVyaXRzOjEwLFwic3RyaW5nX2RlY29kZXIvXCI6MzEsdXRpbDoyfV0sMTk6W2Z1bmN0aW9uKGUsdCl7J3VzZSBzdHJpY3QnO2Z1bmN0aW9uIG4oZSx0KXt2YXIgbj10aGlzLl90cmFuc2Zvcm1TdGF0ZTtuLnRyYW5zZm9ybWluZz0hMTt2YXIgcj1uLndyaXRlY2I7aWYobnVsbD09PXIpcmV0dXJuIHRoaXMuZW1pdChcImVycm9yXCIsbmV3IHMpO24ud3JpdGVjaHVuaz1udWxsLG4ud3JpdGVjYj1udWxsLG51bGwhPXQmJnRoaXMucHVzaCh0KSxyKGUpO3ZhciBhPXRoaXMuX3JlYWRhYmxlU3RhdGU7YS5yZWFkaW5nPSExLChhLm5lZWRSZWFkYWJsZXx8YS5sZW5ndGg8YS5oaWdoV2F0ZXJNYXJrKSYmdGhpcy5fcmVhZChhLmhpZ2hXYXRlck1hcmspfWZ1bmN0aW9uIHIoZSl7cmV0dXJuIHRoaXMgaW5zdGFuY2VvZiByP3ZvaWQodS5jYWxsKHRoaXMsZSksdGhpcy5fdHJhbnNmb3JtU3RhdGU9e2FmdGVyVHJhbnNmb3JtOm4uYmluZCh0aGlzKSxuZWVkVHJhbnNmb3JtOiExLHRyYW5zZm9ybWluZzohMSx3cml0ZWNiOm51bGwsd3JpdGVjaHVuazpudWxsLHdyaXRlZW5jb2Rpbmc6bnVsbH0sdGhpcy5fcmVhZGFibGVTdGF0ZS5uZWVkUmVhZGFibGU9ITAsdGhpcy5fcmVhZGFibGVTdGF0ZS5zeW5jPSExLGUmJihcImZ1bmN0aW9uXCI9PXR5cGVvZiBlLnRyYW5zZm9ybSYmKHRoaXMuX3RyYW5zZm9ybT1lLnRyYW5zZm9ybSksXCJmdW5jdGlvblwiPT10eXBlb2YgZS5mbHVzaCYmKHRoaXMuX2ZsdXNoPWUuZmx1c2gpKSx0aGlzLm9uKFwicHJlZmluaXNoXCIsYSkpOm5ldyByKGUpfWZ1bmN0aW9uIGEoKXt2YXIgZT10aGlzO1wiZnVuY3Rpb25cIiE9dHlwZW9mIHRoaXMuX2ZsdXNofHx0aGlzLl9yZWFkYWJsZVN0YXRlLmRlc3Ryb3llZD9vKHRoaXMsbnVsbCxudWxsKTp0aGlzLl9mbHVzaChmdW5jdGlvbih0LG4pe28oZSx0LG4pfSl9ZnVuY3Rpb24gbyhlLHQsbil7aWYodClyZXR1cm4gZS5lbWl0KFwiZXJyb3JcIix0KTtpZihudWxsIT1uJiZlLnB1c2gobiksZS5fd3JpdGFibGVTdGF0ZS5sZW5ndGgpdGhyb3cgbmV3IGM7aWYoZS5fdHJhbnNmb3JtU3RhdGUudHJhbnNmb3JtaW5nKXRocm93IG5ldyBsO3JldHVybiBlLnB1c2gobnVsbCl9dC5leHBvcnRzPXI7dmFyIGk9ZShcIi4uL2Vycm9yc1wiKS5jb2RlcyxkPWkuRVJSX01FVEhPRF9OT1RfSU1QTEVNRU5URUQscz1pLkVSUl9NVUxUSVBMRV9DQUxMQkFDSyxsPWkuRVJSX1RSQU5TRk9STV9BTFJFQURZX1RSQU5TRk9STUlORyxjPWkuRVJSX1RSQU5TRk9STV9XSVRIX0xFTkdUSF8wLHU9ZShcIi4vX3N0cmVhbV9kdXBsZXhcIik7ZShcImluaGVyaXRzXCIpKHIsdSksci5wcm90b3R5cGUucHVzaD1mdW5jdGlvbihlLHQpe3JldHVybiB0aGlzLl90cmFuc2Zvcm1TdGF0ZS5uZWVkVHJhbnNmb3JtPSExLHUucHJvdG90eXBlLnB1c2guY2FsbCh0aGlzLGUsdCl9LHIucHJvdG90eXBlLl90cmFuc2Zvcm09ZnVuY3Rpb24oZSx0LG4pe24obmV3IGQoXCJfdHJhbnNmb3JtKClcIikpfSxyLnByb3RvdHlwZS5fd3JpdGU9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRoaXMuX3RyYW5zZm9ybVN0YXRlO2lmKHIud3JpdGVjYj1uLHIud3JpdGVjaHVuaz1lLHIud3JpdGVlbmNvZGluZz10LCFyLnRyYW5zZm9ybWluZyl7dmFyIGE9dGhpcy5fcmVhZGFibGVTdGF0ZTsoci5uZWVkVHJhbnNmb3JtfHxhLm5lZWRSZWFkYWJsZXx8YS5sZW5ndGg8YS5oaWdoV2F0ZXJNYXJrKSYmdGhpcy5fcmVhZChhLmhpZ2hXYXRlck1hcmspfX0sci5wcm90b3R5cGUuX3JlYWQ9ZnVuY3Rpb24oKXt2YXIgZT10aGlzLl90cmFuc2Zvcm1TdGF0ZTtudWxsPT09ZS53cml0ZWNodW5rfHxlLnRyYW5zZm9ybWluZz9lLm5lZWRUcmFuc2Zvcm09ITA6KGUudHJhbnNmb3JtaW5nPSEwLHRoaXMuX3RyYW5zZm9ybShlLndyaXRlY2h1bmssZS53cml0ZWVuY29kaW5nLGUuYWZ0ZXJUcmFuc2Zvcm0pKX0sci5wcm90b3R5cGUuX2Rlc3Ryb3k9ZnVuY3Rpb24oZSx0KXt1LnByb3RvdHlwZS5fZGVzdHJveS5jYWxsKHRoaXMsZSxmdW5jdGlvbihlKXt0KGUpfSl9fSx7XCIuLi9lcnJvcnNcIjoxNSxcIi4vX3N0cmVhbV9kdXBsZXhcIjoxNixpbmhlcml0czoxMH1dLDIwOltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihuLHIpeyhmdW5jdGlvbigpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBhKGUpe3ZhciB0PXRoaXM7dGhpcy5uZXh0PW51bGwsdGhpcy5lbnRyeT1udWxsLHRoaXMuZmluaXNoPWZ1bmN0aW9uKCl7dih0LGUpfX1mdW5jdGlvbiBvKGUpe3JldHVybiB4LmZyb20oZSl9ZnVuY3Rpb24gaShlKXtyZXR1cm4geC5pc0J1ZmZlcihlKXx8ZSBpbnN0YW5jZW9mIE59ZnVuY3Rpb24gZCgpe31mdW5jdGlvbiBzKHQsbixyKXtrPWt8fGUoXCIuL19zdHJlYW1fZHVwbGV4XCIpLHQ9dHx8e30sXCJib29sZWFuXCIhPXR5cGVvZiByJiYocj1uIGluc3RhbmNlb2YgayksdGhpcy5vYmplY3RNb2RlPSEhdC5vYmplY3RNb2RlLHImJih0aGlzLm9iamVjdE1vZGU9dGhpcy5vYmplY3RNb2RlfHwhIXQud3JpdGFibGVPYmplY3RNb2RlKSx0aGlzLmhpZ2hXYXRlck1hcms9UCh0aGlzLHQsXCJ3cml0YWJsZUhpZ2hXYXRlck1hcmtcIixyKSx0aGlzLmZpbmFsQ2FsbGVkPSExLHRoaXMubmVlZERyYWluPSExLHRoaXMuZW5kaW5nPSExLHRoaXMuZW5kZWQ9ITEsdGhpcy5maW5pc2hlZD0hMSx0aGlzLmRlc3Ryb3llZD0hMTt2YXIgbz0hMT09PXQuZGVjb2RlU3RyaW5nczt0aGlzLmRlY29kZVN0cmluZ3M9IW8sdGhpcy5kZWZhdWx0RW5jb2Rpbmc9dC5kZWZhdWx0RW5jb2Rpbmd8fFwidXRmOFwiLHRoaXMubGVuZ3RoPTAsdGhpcy53cml0aW5nPSExLHRoaXMuY29ya2VkPTAsdGhpcy5zeW5jPSEwLHRoaXMuYnVmZmVyUHJvY2Vzc2luZz0hMSx0aGlzLm9ud3JpdGU9ZnVuY3Rpb24oZSl7bShuLGUpfSx0aGlzLndyaXRlY2I9bnVsbCx0aGlzLndyaXRlbGVuPTAsdGhpcy5idWZmZXJlZFJlcXVlc3Q9bnVsbCx0aGlzLmxhc3RCdWZmZXJlZFJlcXVlc3Q9bnVsbCx0aGlzLnBlbmRpbmdjYj0wLHRoaXMucHJlZmluaXNoZWQ9ITEsdGhpcy5lcnJvckVtaXR0ZWQ9ITEsdGhpcy5lbWl0Q2xvc2U9ITEhPT10LmVtaXRDbG9zZSx0aGlzLmF1dG9EZXN0cm95PSEhdC5hdXRvRGVzdHJveSx0aGlzLmJ1ZmZlcmVkUmVxdWVzdENvdW50PTAsdGhpcy5jb3JrZWRSZXF1ZXN0c0ZyZWU9bmV3IGEodGhpcyl9ZnVuY3Rpb24gbCh0KXtrPWt8fGUoXCIuL19zdHJlYW1fZHVwbGV4XCIpO3ZhciBuPXRoaXMgaW5zdGFuY2VvZiBrO3JldHVybiBufHxWLmNhbGwobCx0aGlzKT92b2lkKHRoaXMuX3dyaXRhYmxlU3RhdGU9bmV3IHModCx0aGlzLG4pLHRoaXMud3JpdGFibGU9ITAsdCYmKFwiZnVuY3Rpb25cIj09dHlwZW9mIHQud3JpdGUmJih0aGlzLl93cml0ZT10LndyaXRlKSxcImZ1bmN0aW9uXCI9PXR5cGVvZiB0LndyaXRldiYmKHRoaXMuX3dyaXRldj10LndyaXRldiksXCJmdW5jdGlvblwiPT10eXBlb2YgdC5kZXN0cm95JiYodGhpcy5fZGVzdHJveT10LmRlc3Ryb3kpLFwiZnVuY3Rpb25cIj09dHlwZW9mIHQuZmluYWwmJih0aGlzLl9maW5hbD10LmZpbmFsKSksQS5jYWxsKHRoaXMpKTpuZXcgbCh0KX1mdW5jdGlvbiBjKGUsdCl7dmFyIHI9bmV3IFc7WShlLHIpLG4ubmV4dFRpY2sodCxyKX1mdW5jdGlvbiB1KGUsdCxyLGEpe3ZhciBvO3JldHVybiBudWxsPT09cj9vPW5ldyBxOlwic3RyaW5nXCIhPXR5cGVvZiByJiYhdC5vYmplY3RNb2RlJiYobz1uZXcgTyhcImNodW5rXCIsW1wic3RyaW5nXCIsXCJCdWZmZXJcIl0scikpLCFvfHwoWShlLG8pLG4ubmV4dFRpY2soYSxvKSwhMSl9ZnVuY3Rpb24gcChlLHQsbil7cmV0dXJuIGUub2JqZWN0TW9kZXx8ITE9PT1lLmRlY29kZVN0cmluZ3N8fFwic3RyaW5nXCIhPXR5cGVvZiB0fHwodD14LmZyb20odCxuKSksdH1mdW5jdGlvbiBmKGUsdCxuLHIsYSxvKXtpZighbil7dmFyIGk9cCh0LHIsYSk7ciE9PWkmJihuPSEwLGE9XCJidWZmZXJcIixyPWkpfXZhciBkPXQub2JqZWN0TW9kZT8xOnIubGVuZ3RoO3QubGVuZ3RoKz1kO3ZhciBzPXQubGVuZ3RoPHQuaGlnaFdhdGVyTWFyaztpZihzfHwodC5uZWVkRHJhaW49ITApLHQud3JpdGluZ3x8dC5jb3JrZWQpe3ZhciBsPXQubGFzdEJ1ZmZlcmVkUmVxdWVzdDt0Lmxhc3RCdWZmZXJlZFJlcXVlc3Q9e2NodW5rOnIsZW5jb2Rpbmc6YSxpc0J1ZjpuLGNhbGxiYWNrOm8sbmV4dDpudWxsfSxsP2wubmV4dD10Lmxhc3RCdWZmZXJlZFJlcXVlc3Q6dC5idWZmZXJlZFJlcXVlc3Q9dC5sYXN0QnVmZmVyZWRSZXF1ZXN0LHQuYnVmZmVyZWRSZXF1ZXN0Q291bnQrPTF9ZWxzZSBnKGUsdCwhMSxkLHIsYSxvKTtyZXR1cm4gc31mdW5jdGlvbiBnKGUsdCxuLHIsYSxvLGkpe3Qud3JpdGVsZW49cix0LndyaXRlY2I9aSx0LndyaXRpbmc9ITAsdC5zeW5jPSEwLHQuZGVzdHJveWVkP3Qub253cml0ZShuZXcgaihcIndyaXRlXCIpKTpuP2UuX3dyaXRldihhLHQub253cml0ZSk6ZS5fd3JpdGUoYSxvLHQub253cml0ZSksdC5zeW5jPSExfWZ1bmN0aW9uIF8oZSx0LHIsYSxvKXstLXQucGVuZGluZ2NiLHI/KG4ubmV4dFRpY2sobyxhKSxuLm5leHRUaWNrKFMsZSx0KSxlLl93cml0YWJsZVN0YXRlLmVycm9yRW1pdHRlZD0hMCxZKGUsYSkpOihvKGEpLGUuX3dyaXRhYmxlU3RhdGUuZXJyb3JFbWl0dGVkPSEwLFkoZSxhKSxTKGUsdCkpfWZ1bmN0aW9uIGgoZSl7ZS53cml0aW5nPSExLGUud3JpdGVjYj1udWxsLGUubGVuZ3RoLT1lLndyaXRlbGVuLGUud3JpdGVsZW49MH1mdW5jdGlvbiBtKGUsdCl7dmFyIHI9ZS5fd3JpdGFibGVTdGF0ZSxhPXIuc3luYyxvPXIud3JpdGVjYjtpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiBvKXRocm93IG5ldyBCO2lmKGgociksdClfKGUscixhLHQsbyk7ZWxzZXt2YXIgaT1SKHIpfHxlLmRlc3Ryb3llZDtpfHxyLmNvcmtlZHx8ci5idWZmZXJQcm9jZXNzaW5nfHwhci5idWZmZXJlZFJlcXVlc3R8fEMoZSxyKSxhP24ubmV4dFRpY2soYixlLHIsaSxvKTpiKGUscixpLG8pfX1mdW5jdGlvbiBiKGUsdCxuLHIpe258fHkoZSx0KSx0LnBlbmRpbmdjYi0tLHIoKSxTKGUsdCl9ZnVuY3Rpb24geShlLHQpezA9PT10Lmxlbmd0aCYmdC5uZWVkRHJhaW4mJih0Lm5lZWREcmFpbj0hMSxlLmVtaXQoXCJkcmFpblwiKSl9ZnVuY3Rpb24gQyhlLHQpe3QuYnVmZmVyUHJvY2Vzc2luZz0hMDt2YXIgbj10LmJ1ZmZlcmVkUmVxdWVzdDtpZihlLl93cml0ZXYmJm4mJm4ubmV4dCl7dmFyIHI9dC5idWZmZXJlZFJlcXVlc3RDb3VudCxvPUFycmF5KHIpLGk9dC5jb3JrZWRSZXF1ZXN0c0ZyZWU7aS5lbnRyeT1uO2Zvcih2YXIgZD0wLHM9ITA7bjspb1tkXT1uLG4uaXNCdWZ8fChzPSExKSxuPW4ubmV4dCxkKz0xO28uYWxsQnVmZmVycz1zLGcoZSx0LCEwLHQubGVuZ3RoLG8sXCJcIixpLmZpbmlzaCksdC5wZW5kaW5nY2IrKyx0Lmxhc3RCdWZmZXJlZFJlcXVlc3Q9bnVsbCxpLm5leHQ/KHQuY29ya2VkUmVxdWVzdHNGcmVlPWkubmV4dCxpLm5leHQ9bnVsbCk6dC5jb3JrZWRSZXF1ZXN0c0ZyZWU9bmV3IGEodCksdC5idWZmZXJlZFJlcXVlc3RDb3VudD0wfWVsc2V7Zm9yKDtuOyl7dmFyIGw9bi5jaHVuayxjPW4uZW5jb2RpbmcsdT1uLmNhbGxiYWNrLHA9dC5vYmplY3RNb2RlPzE6bC5sZW5ndGg7aWYoZyhlLHQsITEscCxsLGMsdSksbj1uLm5leHQsdC5idWZmZXJlZFJlcXVlc3RDb3VudC0tLHQud3JpdGluZylicmVha31udWxsPT09biYmKHQubGFzdEJ1ZmZlcmVkUmVxdWVzdD1udWxsKX10LmJ1ZmZlcmVkUmVxdWVzdD1uLHQuYnVmZmVyUHJvY2Vzc2luZz0hMX1mdW5jdGlvbiBSKGUpe3JldHVybiBlLmVuZGluZyYmMD09PWUubGVuZ3RoJiZudWxsPT09ZS5idWZmZXJlZFJlcXVlc3QmJiFlLmZpbmlzaGVkJiYhZS53cml0aW5nfWZ1bmN0aW9uIEUoZSx0KXtlLl9maW5hbChmdW5jdGlvbihuKXt0LnBlbmRpbmdjYi0tLG4mJlkoZSxuKSx0LnByZWZpbmlzaGVkPSEwLGUuZW1pdChcInByZWZpbmlzaFwiKSxTKGUsdCl9KX1mdW5jdGlvbiB3KGUsdCl7dC5wcmVmaW5pc2hlZHx8dC5maW5hbENhbGxlZHx8KFwiZnVuY3Rpb25cIiE9dHlwZW9mIGUuX2ZpbmFsfHx0LmRlc3Ryb3llZD8odC5wcmVmaW5pc2hlZD0hMCxlLmVtaXQoXCJwcmVmaW5pc2hcIikpOih0LnBlbmRpbmdjYisrLHQuZmluYWxDYWxsZWQ9ITAsbi5uZXh0VGljayhFLGUsdCkpKX1mdW5jdGlvbiBTKGUsdCl7dmFyIG49Uih0KTtpZihuJiYodyhlLHQpLDA9PT10LnBlbmRpbmdjYiYmKHQuZmluaXNoZWQ9ITAsZS5lbWl0KFwiZmluaXNoXCIpLHQuYXV0b0Rlc3Ryb3kpKSl7dmFyIHI9ZS5fcmVhZGFibGVTdGF0ZTsoIXJ8fHIuYXV0b0Rlc3Ryb3kmJnIuZW5kRW1pdHRlZCkmJmUuZGVzdHJveSgpfXJldHVybiBufWZ1bmN0aW9uIFQoZSx0LHIpe3QuZW5kaW5nPSEwLFMoZSx0KSxyJiYodC5maW5pc2hlZD9uLm5leHRUaWNrKHIpOmUub25jZShcImZpbmlzaFwiLHIpKSx0LmVuZGVkPSEwLGUud3JpdGFibGU9ITF9ZnVuY3Rpb24gdihlLHQsbil7dmFyIHI9ZS5lbnRyeTtmb3IoZS5lbnRyeT1udWxsO3I7KXt2YXIgYT1yLmNhbGxiYWNrO3QucGVuZGluZ2NiLS0sYShuKSxyPXIubmV4dH10LmNvcmtlZFJlcXVlc3RzRnJlZS5uZXh0PWV9dC5leHBvcnRzPWw7dmFyIGs7bC5Xcml0YWJsZVN0YXRlPXM7dmFyIEw9e2RlcHJlY2F0ZTplKFwidXRpbC1kZXByZWNhdGVcIil9LEE9ZShcIi4vaW50ZXJuYWwvc3RyZWFtcy9zdHJlYW1cIikseD1lKFwiYnVmZmVyXCIpLkJ1ZmZlcixOPXIuVWludDhBcnJheXx8ZnVuY3Rpb24oKXt9LEQ9ZShcIi4vaW50ZXJuYWwvc3RyZWFtcy9kZXN0cm95XCIpLEk9ZShcIi4vaW50ZXJuYWwvc3RyZWFtcy9zdGF0ZVwiKSxQPUkuZ2V0SGlnaFdhdGVyTWFyayxNPWUoXCIuLi9lcnJvcnNcIikuY29kZXMsTz1NLkVSUl9JTlZBTElEX0FSR19UWVBFLEY9TS5FUlJfTUVUSE9EX05PVF9JTVBMRU1FTlRFRCxCPU0uRVJSX01VTFRJUExFX0NBTExCQUNLLFU9TS5FUlJfU1RSRUFNX0NBTk5PVF9QSVBFLGo9TS5FUlJfU1RSRUFNX0RFU1RST1lFRCxxPU0uRVJSX1NUUkVBTV9OVUxMX1ZBTFVFUyxXPU0uRVJSX1NUUkVBTV9XUklURV9BRlRFUl9FTkQsSD1NLkVSUl9VTktOT1dOX0VOQ09ESU5HLFk9RC5lcnJvck9yRGVzdHJveTtlKFwiaW5oZXJpdHNcIikobCxBKSxzLnByb3RvdHlwZS5nZXRCdWZmZXI9ZnVuY3Rpb24oKXtmb3IodmFyIGU9dGhpcy5idWZmZXJlZFJlcXVlc3QsdD1bXTtlOyl0LnB1c2goZSksZT1lLm5leHQ7cmV0dXJuIHR9LGZ1bmN0aW9uKCl7dHJ5e09iamVjdC5kZWZpbmVQcm9wZXJ0eShzLnByb3RvdHlwZSxcImJ1ZmZlclwiLHtnZXQ6TC5kZXByZWNhdGUoZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5nZXRCdWZmZXIoKX0sXCJfd3JpdGFibGVTdGF0ZS5idWZmZXIgaXMgZGVwcmVjYXRlZC4gVXNlIF93cml0YWJsZVN0YXRlLmdldEJ1ZmZlciBpbnN0ZWFkLlwiLFwiREVQMDAwM1wiKX0pfWNhdGNoKGUpe319KCk7dmFyIFY7XCJmdW5jdGlvblwiPT10eXBlb2YgU3ltYm9sJiZTeW1ib2wuaGFzSW5zdGFuY2UmJlwiZnVuY3Rpb25cIj09dHlwZW9mIEZ1bmN0aW9uLnByb3RvdHlwZVtTeW1ib2wuaGFzSW5zdGFuY2VdPyhWPUZ1bmN0aW9uLnByb3RvdHlwZVtTeW1ib2wuaGFzSW5zdGFuY2VdLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShsLFN5bWJvbC5oYXNJbnN0YW5jZSx7dmFsdWU6ZnVuY3Rpb24oZSl7cmV0dXJuISFWLmNhbGwodGhpcyxlKXx8ISh0aGlzIT09bCkmJmUmJmUuX3dyaXRhYmxlU3RhdGUgaW5zdGFuY2VvZiBzfX0pKTpWPWZ1bmN0aW9uKGUpe3JldHVybiBlIGluc3RhbmNlb2YgdGhpc30sbC5wcm90b3R5cGUucGlwZT1mdW5jdGlvbigpe1kodGhpcyxuZXcgVSl9LGwucHJvdG90eXBlLndyaXRlPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10aGlzLl93cml0YWJsZVN0YXRlLGE9ITEscz0hci5vYmplY3RNb2RlJiZpKGUpO3JldHVybiBzJiYheC5pc0J1ZmZlcihlKSYmKGU9byhlKSksXCJmdW5jdGlvblwiPT10eXBlb2YgdCYmKG49dCx0PW51bGwpLHM/dD1cImJ1ZmZlclwiOiF0JiYodD1yLmRlZmF1bHRFbmNvZGluZyksXCJmdW5jdGlvblwiIT10eXBlb2YgbiYmKG49ZCksci5lbmRpbmc/Yyh0aGlzLG4pOihzfHx1KHRoaXMscixlLG4pKSYmKHIucGVuZGluZ2NiKyssYT1mKHRoaXMscixzLGUsdCxuKSksYX0sbC5wcm90b3R5cGUuY29yaz1mdW5jdGlvbigpe3RoaXMuX3dyaXRhYmxlU3RhdGUuY29ya2VkKyt9LGwucHJvdG90eXBlLnVuY29yaz1mdW5jdGlvbigpe3ZhciBlPXRoaXMuX3dyaXRhYmxlU3RhdGU7ZS5jb3JrZWQmJihlLmNvcmtlZC0tLCFlLndyaXRpbmcmJiFlLmNvcmtlZCYmIWUuYnVmZmVyUHJvY2Vzc2luZyYmZS5idWZmZXJlZFJlcXVlc3QmJkModGhpcyxlKSl9LGwucHJvdG90eXBlLnNldERlZmF1bHRFbmNvZGluZz1mdW5jdGlvbihlKXtpZihcInN0cmluZ1wiPT10eXBlb2YgZSYmKGU9ZS50b0xvd2VyQ2FzZSgpKSwhKC0xPFtcImhleFwiLFwidXRmOFwiLFwidXRmLThcIixcImFzY2lpXCIsXCJiaW5hcnlcIixcImJhc2U2NFwiLFwidWNzMlwiLFwidWNzLTJcIixcInV0ZjE2bGVcIixcInV0Zi0xNmxlXCIsXCJyYXdcIl0uaW5kZXhPZigoZStcIlwiKS50b0xvd2VyQ2FzZSgpKSkpdGhyb3cgbmV3IEgoZSk7cmV0dXJuIHRoaXMuX3dyaXRhYmxlU3RhdGUuZGVmYXVsdEVuY29kaW5nPWUsdGhpc30sT2JqZWN0LmRlZmluZVByb3BlcnR5KGwucHJvdG90eXBlLFwid3JpdGFibGVCdWZmZXJcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fd3JpdGFibGVTdGF0ZSYmdGhpcy5fd3JpdGFibGVTdGF0ZS5nZXRCdWZmZXIoKX19KSxPYmplY3QuZGVmaW5lUHJvcGVydHkobC5wcm90b3R5cGUsXCJ3cml0YWJsZUhpZ2hXYXRlck1hcmtcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fd3JpdGFibGVTdGF0ZS5oaWdoV2F0ZXJNYXJrfX0pLGwucHJvdG90eXBlLl93cml0ZT1mdW5jdGlvbihlLHQsbil7bihuZXcgRihcIl93cml0ZSgpXCIpKX0sbC5wcm90b3R5cGUuX3dyaXRldj1udWxsLGwucHJvdG90eXBlLmVuZD1mdW5jdGlvbihlLHQsbil7dmFyIHI9dGhpcy5fd3JpdGFibGVTdGF0ZTtyZXR1cm5cImZ1bmN0aW9uXCI9PXR5cGVvZiBlPyhuPWUsZT1udWxsLHQ9bnVsbCk6XCJmdW5jdGlvblwiPT10eXBlb2YgdCYmKG49dCx0PW51bGwpLG51bGwhPT1lJiZ2b2lkIDAhPT1lJiZ0aGlzLndyaXRlKGUsdCksci5jb3JrZWQmJihyLmNvcmtlZD0xLHRoaXMudW5jb3JrKCkpLHIuZW5kaW5nfHxUKHRoaXMscixuKSx0aGlzfSxPYmplY3QuZGVmaW5lUHJvcGVydHkobC5wcm90b3R5cGUsXCJ3cml0YWJsZUxlbmd0aFwiLHtlbnVtZXJhYmxlOiExLGdldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLl93cml0YWJsZVN0YXRlLmxlbmd0aH19KSxPYmplY3QuZGVmaW5lUHJvcGVydHkobC5wcm90b3R5cGUsXCJkZXN0cm95ZWRcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdm9pZCAwIT09dGhpcy5fd3JpdGFibGVTdGF0ZSYmdGhpcy5fd3JpdGFibGVTdGF0ZS5kZXN0cm95ZWR9LHNldDpmdW5jdGlvbihlKXt0aGlzLl93cml0YWJsZVN0YXRlJiYodGhpcy5fd3JpdGFibGVTdGF0ZS5kZXN0cm95ZWQ9ZSl9fSksbC5wcm90b3R5cGUuZGVzdHJveT1ELmRlc3Ryb3ksbC5wcm90b3R5cGUuX3VuZGVzdHJveT1ELnVuZGVzdHJveSxsLnByb3RvdHlwZS5fZGVzdHJveT1mdW5jdGlvbihlLHQpe3QoZSl9fSkuY2FsbCh0aGlzKX0pLmNhbGwodGhpcyxlKFwiX3Byb2Nlc3NcIiksXCJ1bmRlZmluZWRcIj09dHlwZW9mIGdsb2JhbD9cInVuZGVmaW5lZFwiPT10eXBlb2Ygc2VsZj9cInVuZGVmaW5lZFwiPT10eXBlb2Ygd2luZG93P3t9OndpbmRvdzpzZWxmOmdsb2JhbCl9LHtcIi4uL2Vycm9yc1wiOjE1LFwiLi9fc3RyZWFtX2R1cGxleFwiOjE2LFwiLi9pbnRlcm5hbC9zdHJlYW1zL2Rlc3Ryb3lcIjoyMyxcIi4vaW50ZXJuYWwvc3RyZWFtcy9zdGF0ZVwiOjI3LFwiLi9pbnRlcm5hbC9zdHJlYW1zL3N0cmVhbVwiOjI4LF9wcm9jZXNzOjEyLGJ1ZmZlcjozLGluaGVyaXRzOjEwLFwidXRpbC1kZXByZWNhdGVcIjozMn1dLDIxOltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihuKXsoZnVuY3Rpb24oKXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gcihlLHQsbil7cmV0dXJuIHQgaW4gZT9PYmplY3QuZGVmaW5lUHJvcGVydHkoZSx0LHt2YWx1ZTpuLGVudW1lcmFibGU6ITAsY29uZmlndXJhYmxlOiEwLHdyaXRhYmxlOiEwfSk6ZVt0XT1uLGV9ZnVuY3Rpb24gYShlLHQpe3JldHVybnt2YWx1ZTplLGRvbmU6dH19ZnVuY3Rpb24gbyhlKXt2YXIgdD1lW2NdO2lmKG51bGwhPT10KXt2YXIgbj1lW2hdLnJlYWQoKTtudWxsIT09biYmKGVbZ109bnVsbCxlW2NdPW51bGwsZVt1XT1udWxsLHQoYShuLCExKSkpfX1mdW5jdGlvbiBpKGUpe24ubmV4dFRpY2sobyxlKX1mdW5jdGlvbiBkKGUsdCl7cmV0dXJuIGZ1bmN0aW9uKG4scil7ZS50aGVuKGZ1bmN0aW9uKCl7cmV0dXJuIHRbZl0/dm9pZCBuKGEodm9pZCAwLCEwKSk6dm9pZCB0W19dKG4scil9LHIpfX12YXIgcyxsPWUoXCIuL2VuZC1vZi1zdHJlYW1cIiksYz1TeW1ib2woXCJsYXN0UmVzb2x2ZVwiKSx1PVN5bWJvbChcImxhc3RSZWplY3RcIikscD1TeW1ib2woXCJlcnJvclwiKSxmPVN5bWJvbChcImVuZGVkXCIpLGc9U3ltYm9sKFwibGFzdFByb21pc2VcIiksXz1TeW1ib2woXCJoYW5kbGVQcm9taXNlXCIpLGg9U3ltYm9sKFwic3RyZWFtXCIpLG09T2JqZWN0LmdldFByb3RvdHlwZU9mKGZ1bmN0aW9uKCl7fSksYj1PYmplY3Quc2V0UHJvdG90eXBlT2YoKHM9e2dldCBzdHJlYW0oKXtyZXR1cm4gdGhpc1toXX0sbmV4dDpmdW5jdGlvbigpe3ZhciBlPXRoaXMsdD10aGlzW3BdO2lmKG51bGwhPT10KXJldHVybiBQcm9taXNlLnJlamVjdCh0KTtpZih0aGlzW2ZdKXJldHVybiBQcm9taXNlLnJlc29sdmUoYSh2b2lkIDAsITApKTtpZih0aGlzW2hdLmRlc3Ryb3llZClyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24odCxyKXtuLm5leHRUaWNrKGZ1bmN0aW9uKCl7ZVtwXT9yKGVbcF0pOnQoYSh2b2lkIDAsITApKX0pfSk7dmFyIHIsbz10aGlzW2ddO2lmKG8pcj1uZXcgUHJvbWlzZShkKG8sdGhpcykpO2Vsc2V7dmFyIGk9dGhpc1toXS5yZWFkKCk7aWYobnVsbCE9PWkpcmV0dXJuIFByb21pc2UucmVzb2x2ZShhKGksITEpKTtyPW5ldyBQcm9taXNlKHRoaXNbX10pfXJldHVybiB0aGlzW2ddPXIscn19LHIocyxTeW1ib2wuYXN5bmNJdGVyYXRvcixmdW5jdGlvbigpe3JldHVybiB0aGlzfSkscihzLFwicmV0dXJuXCIsZnVuY3Rpb24oKXt2YXIgZT10aGlzO3JldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbih0LG4pe2VbaF0uZGVzdHJveShudWxsLGZ1bmN0aW9uKGUpe3JldHVybiBlP3ZvaWQgbihlKTp2b2lkIHQoYSh2b2lkIDAsITApKX0pfSl9KSxzKSxtKTt0LmV4cG9ydHM9ZnVuY3Rpb24oZSl7dmFyIHQsbj1PYmplY3QuY3JlYXRlKGIsKHQ9e30scih0LGgse3ZhbHVlOmUsd3JpdGFibGU6ITB9KSxyKHQsYyx7dmFsdWU6bnVsbCx3cml0YWJsZTohMH0pLHIodCx1LHt2YWx1ZTpudWxsLHdyaXRhYmxlOiEwfSkscih0LHAse3ZhbHVlOm51bGwsd3JpdGFibGU6ITB9KSxyKHQsZix7dmFsdWU6ZS5fcmVhZGFibGVTdGF0ZS5lbmRFbWl0dGVkLHdyaXRhYmxlOiEwfSkscih0LF8se3ZhbHVlOmZ1bmN0aW9uKGUsdCl7dmFyIHI9bltoXS5yZWFkKCk7cj8obltnXT1udWxsLG5bY109bnVsbCxuW3VdPW51bGwsZShhKHIsITEpKSk6KG5bY109ZSxuW3VdPXQpfSx3cml0YWJsZTohMH0pLHQpKTtyZXR1cm4gbltnXT1udWxsLGwoZSxmdW5jdGlvbihlKXtpZihlJiZcIkVSUl9TVFJFQU1fUFJFTUFUVVJFX0NMT1NFXCIhPT1lLmNvZGUpe3ZhciB0PW5bdV07cmV0dXJuIG51bGwhPT10JiYobltnXT1udWxsLG5bY109bnVsbCxuW3VdPW51bGwsdChlKSksdm9pZChuW3BdPWUpfXZhciByPW5bY107bnVsbCE9PXImJihuW2ddPW51bGwsbltjXT1udWxsLG5bdV09bnVsbCxyKGEodm9pZCAwLCEwKSkpLG5bZl09ITB9KSxlLm9uKFwicmVhZGFibGVcIixpLmJpbmQobnVsbCxuKSksbn19KS5jYWxsKHRoaXMpfSkuY2FsbCh0aGlzLGUoXCJfcHJvY2Vzc1wiKSl9LHtcIi4vZW5kLW9mLXN0cmVhbVwiOjI0LF9wcm9jZXNzOjEyfV0sMjI6W2Z1bmN0aW9uKGUsdCl7J3VzZSBzdHJpY3QnO2Z1bmN0aW9uIG4oZSx0KXt2YXIgbj1PYmplY3Qua2V5cyhlKTtpZihPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKXt2YXIgcj1PYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGUpO3QmJihyPXIuZmlsdGVyKGZ1bmN0aW9uKHQpe3JldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGUsdCkuZW51bWVyYWJsZX0pKSxuLnB1c2guYXBwbHkobixyKX1yZXR1cm4gbn1mdW5jdGlvbiByKGUpe2Zvcih2YXIgdCxyPTE7cjxhcmd1bWVudHMubGVuZ3RoO3IrKyl0PW51bGw9PWFyZ3VtZW50c1tyXT97fTphcmd1bWVudHNbcl0sciUyP24oT2JqZWN0KHQpLCEwKS5mb3JFYWNoKGZ1bmN0aW9uKG4pe2EoZSxuLHRbbl0pfSk6T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnM/T2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZSxPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyh0KSk6bihPYmplY3QodCkpLmZvckVhY2goZnVuY3Rpb24obil7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsbixPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHQsbikpfSk7cmV0dXJuIGV9ZnVuY3Rpb24gYShlLHQsbil7cmV0dXJuIHQgaW4gZT9PYmplY3QuZGVmaW5lUHJvcGVydHkoZSx0LHt2YWx1ZTpuLGVudW1lcmFibGU6ITAsY29uZmlndXJhYmxlOiEwLHdyaXRhYmxlOiEwfSk6ZVt0XT1uLGV9ZnVuY3Rpb24gbyhlLHQpe2lmKCEoZSBpbnN0YW5jZW9mIHQpKXRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIil9ZnVuY3Rpb24gaShlLHQpe2Zvcih2YXIgbixyPTA7cjx0Lmxlbmd0aDtyKyspbj10W3JdLG4uZW51bWVyYWJsZT1uLmVudW1lcmFibGV8fCExLG4uY29uZmlndXJhYmxlPSEwLFwidmFsdWVcImluIG4mJihuLndyaXRhYmxlPSEwKSxPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxuLmtleSxuKX1mdW5jdGlvbiBkKGUsdCxuKXtyZXR1cm4gdCYmaShlLnByb3RvdHlwZSx0KSxuJiZpKGUsbiksZX1mdW5jdGlvbiBzKGUsdCxuKXt1LnByb3RvdHlwZS5jb3B5LmNhbGwoZSx0LG4pfXZhciBsPWUoXCJidWZmZXJcIiksdT1sLkJ1ZmZlcixwPWUoXCJ1dGlsXCIpLGY9cC5pbnNwZWN0LGc9ZiYmZi5jdXN0b218fFwiaW5zcGVjdFwiO3QuZXhwb3J0cz1mdW5jdGlvbigpe2Z1bmN0aW9uIGUoKXtvKHRoaXMsZSksdGhpcy5oZWFkPW51bGwsdGhpcy50YWlsPW51bGwsdGhpcy5sZW5ndGg9MH1yZXR1cm4gZChlLFt7a2V5OlwicHVzaFwiLHZhbHVlOmZ1bmN0aW9uKGUpe3ZhciB0PXtkYXRhOmUsbmV4dDpudWxsfTswPHRoaXMubGVuZ3RoP3RoaXMudGFpbC5uZXh0PXQ6dGhpcy5oZWFkPXQsdGhpcy50YWlsPXQsKyt0aGlzLmxlbmd0aH19LHtrZXk6XCJ1bnNoaWZ0XCIsdmFsdWU6ZnVuY3Rpb24oZSl7dmFyIHQ9e2RhdGE6ZSxuZXh0OnRoaXMuaGVhZH07MD09PXRoaXMubGVuZ3RoJiYodGhpcy50YWlsPXQpLHRoaXMuaGVhZD10LCsrdGhpcy5sZW5ndGh9fSx7a2V5Olwic2hpZnRcIix2YWx1ZTpmdW5jdGlvbigpe2lmKDAhPT10aGlzLmxlbmd0aCl7dmFyIGU9dGhpcy5oZWFkLmRhdGE7cmV0dXJuIHRoaXMuaGVhZD0xPT09dGhpcy5sZW5ndGg/dGhpcy50YWlsPW51bGw6dGhpcy5oZWFkLm5leHQsLS10aGlzLmxlbmd0aCxlfX19LHtrZXk6XCJjbGVhclwiLHZhbHVlOmZ1bmN0aW9uKCl7dGhpcy5oZWFkPXRoaXMudGFpbD1udWxsLHRoaXMubGVuZ3RoPTB9fSx7a2V5Olwiam9pblwiLHZhbHVlOmZ1bmN0aW9uKGUpe2lmKDA9PT10aGlzLmxlbmd0aClyZXR1cm5cIlwiO2Zvcih2YXIgdD10aGlzLmhlYWQsbj1cIlwiK3QuZGF0YTt0PXQubmV4dDspbis9ZSt0LmRhdGE7cmV0dXJuIG59fSx7a2V5OlwiY29uY2F0XCIsdmFsdWU6ZnVuY3Rpb24oZSl7aWYoMD09PXRoaXMubGVuZ3RoKXJldHVybiB1LmFsbG9jKDApO2Zvcih2YXIgdD11LmFsbG9jVW5zYWZlKGU+Pj4wKSxuPXRoaXMuaGVhZCxyPTA7bjspcyhuLmRhdGEsdCxyKSxyKz1uLmRhdGEubGVuZ3RoLG49bi5uZXh0O3JldHVybiB0fX0se2tleTpcImNvbnN1bWVcIix2YWx1ZTpmdW5jdGlvbihlLHQpe3ZhciBuO3JldHVybiBlPHRoaXMuaGVhZC5kYXRhLmxlbmd0aD8obj10aGlzLmhlYWQuZGF0YS5zbGljZSgwLGUpLHRoaXMuaGVhZC5kYXRhPXRoaXMuaGVhZC5kYXRhLnNsaWNlKGUpKTplPT09dGhpcy5oZWFkLmRhdGEubGVuZ3RoP249dGhpcy5zaGlmdCgpOm49dD90aGlzLl9nZXRTdHJpbmcoZSk6dGhpcy5fZ2V0QnVmZmVyKGUpLG59fSx7a2V5OlwiZmlyc3RcIix2YWx1ZTpmdW5jdGlvbigpe3JldHVybiB0aGlzLmhlYWQuZGF0YX19LHtrZXk6XCJfZ2V0U3RyaW5nXCIsdmFsdWU6ZnVuY3Rpb24oZSl7dmFyIHQ9dGhpcy5oZWFkLHI9MSxhPXQuZGF0YTtmb3IoZS09YS5sZW5ndGg7dD10Lm5leHQ7KXt2YXIgbz10LmRhdGEsaT1lPm8ubGVuZ3RoP28ubGVuZ3RoOmU7aWYoYSs9aT09PW8ubGVuZ3RoP286by5zbGljZSgwLGUpLGUtPWksMD09PWUpe2k9PT1vLmxlbmd0aD8oKytyLHRoaXMuaGVhZD10Lm5leHQ/dC5uZXh0OnRoaXMudGFpbD1udWxsKToodGhpcy5oZWFkPXQsdC5kYXRhPW8uc2xpY2UoaSkpO2JyZWFrfSsrcn1yZXR1cm4gdGhpcy5sZW5ndGgtPXIsYX19LHtrZXk6XCJfZ2V0QnVmZmVyXCIsdmFsdWU6ZnVuY3Rpb24oZSl7dmFyIHQ9dS5hbGxvY1Vuc2FmZShlKSxyPXRoaXMuaGVhZCxhPTE7Zm9yKHIuZGF0YS5jb3B5KHQpLGUtPXIuZGF0YS5sZW5ndGg7cj1yLm5leHQ7KXt2YXIgbz1yLmRhdGEsaT1lPm8ubGVuZ3RoP28ubGVuZ3RoOmU7aWYoby5jb3B5KHQsdC5sZW5ndGgtZSwwLGkpLGUtPWksMD09PWUpe2k9PT1vLmxlbmd0aD8oKythLHRoaXMuaGVhZD1yLm5leHQ/ci5uZXh0OnRoaXMudGFpbD1udWxsKToodGhpcy5oZWFkPXIsci5kYXRhPW8uc2xpY2UoaSkpO2JyZWFrfSsrYX1yZXR1cm4gdGhpcy5sZW5ndGgtPWEsdH19LHtrZXk6Zyx2YWx1ZTpmdW5jdGlvbihlLHQpe3JldHVybiBmKHRoaXMscih7fSx0LHtkZXB0aDowLGN1c3RvbUluc3BlY3Q6ITF9KSl9fV0pLGV9KCl9LHtidWZmZXI6Myx1dGlsOjJ9XSwyMzpbZnVuY3Rpb24oZSx0KXsoZnVuY3Rpb24oZSl7KGZ1bmN0aW9uKCl7J3VzZSBzdHJpY3QnO2Z1bmN0aW9uIG4oZSx0KXthKGUsdCkscihlKX1mdW5jdGlvbiByKGUpe2UuX3dyaXRhYmxlU3RhdGUmJiFlLl93cml0YWJsZVN0YXRlLmVtaXRDbG9zZXx8ZS5fcmVhZGFibGVTdGF0ZSYmIWUuX3JlYWRhYmxlU3RhdGUuZW1pdENsb3NlfHxlLmVtaXQoXCJjbG9zZVwiKX1mdW5jdGlvbiBhKGUsdCl7ZS5lbWl0KFwiZXJyb3JcIix0KX10LmV4cG9ydHM9e2Rlc3Ryb3k6ZnVuY3Rpb24odCxvKXt2YXIgaT10aGlzLGQ9dGhpcy5fcmVhZGFibGVTdGF0ZSYmdGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWQscz10aGlzLl93cml0YWJsZVN0YXRlJiZ0aGlzLl93cml0YWJsZVN0YXRlLmRlc3Ryb3llZDtyZXR1cm4gZHx8cz8obz9vKHQpOnQmJih0aGlzLl93cml0YWJsZVN0YXRlPyF0aGlzLl93cml0YWJsZVN0YXRlLmVycm9yRW1pdHRlZCYmKHRoaXMuX3dyaXRhYmxlU3RhdGUuZXJyb3JFbWl0dGVkPSEwLGUubmV4dFRpY2soYSx0aGlzLHQpKTplLm5leHRUaWNrKGEsdGhpcyx0KSksdGhpcyk6KHRoaXMuX3JlYWRhYmxlU3RhdGUmJih0aGlzLl9yZWFkYWJsZVN0YXRlLmRlc3Ryb3llZD0hMCksdGhpcy5fd3JpdGFibGVTdGF0ZSYmKHRoaXMuX3dyaXRhYmxlU3RhdGUuZGVzdHJveWVkPSEwKSx0aGlzLl9kZXN0cm95KHR8fG51bGwsZnVuY3Rpb24odCl7IW8mJnQ/aS5fd3JpdGFibGVTdGF0ZT9pLl93cml0YWJsZVN0YXRlLmVycm9yRW1pdHRlZD9lLm5leHRUaWNrKHIsaSk6KGkuX3dyaXRhYmxlU3RhdGUuZXJyb3JFbWl0dGVkPSEwLGUubmV4dFRpY2sobixpLHQpKTplLm5leHRUaWNrKG4saSx0KTpvPyhlLm5leHRUaWNrKHIsaSksbyh0KSk6ZS5uZXh0VGljayhyLGkpfSksdGhpcyl9LHVuZGVzdHJveTpmdW5jdGlvbigpe3RoaXMuX3JlYWRhYmxlU3RhdGUmJih0aGlzLl9yZWFkYWJsZVN0YXRlLmRlc3Ryb3llZD0hMSx0aGlzLl9yZWFkYWJsZVN0YXRlLnJlYWRpbmc9ITEsdGhpcy5fcmVhZGFibGVTdGF0ZS5lbmRlZD0hMSx0aGlzLl9yZWFkYWJsZVN0YXRlLmVuZEVtaXR0ZWQ9ITEpLHRoaXMuX3dyaXRhYmxlU3RhdGUmJih0aGlzLl93cml0YWJsZVN0YXRlLmRlc3Ryb3llZD0hMSx0aGlzLl93cml0YWJsZVN0YXRlLmVuZGVkPSExLHRoaXMuX3dyaXRhYmxlU3RhdGUuZW5kaW5nPSExLHRoaXMuX3dyaXRhYmxlU3RhdGUuZmluYWxDYWxsZWQ9ITEsdGhpcy5fd3JpdGFibGVTdGF0ZS5wcmVmaW5pc2hlZD0hMSx0aGlzLl93cml0YWJsZVN0YXRlLmZpbmlzaGVkPSExLHRoaXMuX3dyaXRhYmxlU3RhdGUuZXJyb3JFbWl0dGVkPSExKX0sZXJyb3JPckRlc3Ryb3k6ZnVuY3Rpb24oZSx0KXt2YXIgbj1lLl9yZWFkYWJsZVN0YXRlLHI9ZS5fd3JpdGFibGVTdGF0ZTtuJiZuLmF1dG9EZXN0cm95fHxyJiZyLmF1dG9EZXN0cm95P2UuZGVzdHJveSh0KTplLmVtaXQoXCJlcnJvclwiLHQpfX19KS5jYWxsKHRoaXMpfSkuY2FsbCh0aGlzLGUoXCJfcHJvY2Vzc1wiKSl9LHtfcHJvY2VzczoxMn1dLDI0OltmdW5jdGlvbihlLHQpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBuKGUpe3ZhciB0PSExO3JldHVybiBmdW5jdGlvbigpe2lmKCF0KXt0PSEwO2Zvcih2YXIgbj1hcmd1bWVudHMubGVuZ3RoLHI9QXJyYXkobiksYT0wO2E8bjthKyspclthXT1hcmd1bWVudHNbYV07ZS5hcHBseSh0aGlzLHIpfX19ZnVuY3Rpb24gcigpe31mdW5jdGlvbiBhKGUpe3JldHVybiBlLnNldEhlYWRlciYmXCJmdW5jdGlvblwiPT10eXBlb2YgZS5hYm9ydH1mdW5jdGlvbiBvKGUsdCxkKXtpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiB0KXJldHVybiBvKGUsbnVsbCx0KTt0fHwodD17fSksZD1uKGR8fHIpO3ZhciBzPXQucmVhZGFibGV8fCExIT09dC5yZWFkYWJsZSYmZS5yZWFkYWJsZSxsPXQud3JpdGFibGV8fCExIT09dC53cml0YWJsZSYmZS53cml0YWJsZSxjPWZ1bmN0aW9uKCl7ZS53cml0YWJsZXx8cCgpfSx1PWUuX3dyaXRhYmxlU3RhdGUmJmUuX3dyaXRhYmxlU3RhdGUuZmluaXNoZWQscD1mdW5jdGlvbigpe2w9ITEsdT0hMCxzfHxkLmNhbGwoZSl9LGY9ZS5fcmVhZGFibGVTdGF0ZSYmZS5fcmVhZGFibGVTdGF0ZS5lbmRFbWl0dGVkLGc9ZnVuY3Rpb24oKXtzPSExLGY9ITAsbHx8ZC5jYWxsKGUpfSxfPWZ1bmN0aW9uKHQpe2QuY2FsbChlLHQpfSxoPWZ1bmN0aW9uKCl7dmFyIHQ7cmV0dXJuIHMmJiFmPyhlLl9yZWFkYWJsZVN0YXRlJiZlLl9yZWFkYWJsZVN0YXRlLmVuZGVkfHwodD1uZXcgaSksZC5jYWxsKGUsdCkpOmwmJiF1PyhlLl93cml0YWJsZVN0YXRlJiZlLl93cml0YWJsZVN0YXRlLmVuZGVkfHwodD1uZXcgaSksZC5jYWxsKGUsdCkpOnZvaWQgMH0sbT1mdW5jdGlvbigpe2UucmVxLm9uKFwiZmluaXNoXCIscCl9O3JldHVybiBhKGUpPyhlLm9uKFwiY29tcGxldGVcIixwKSxlLm9uKFwiYWJvcnRcIixoKSxlLnJlcT9tKCk6ZS5vbihcInJlcXVlc3RcIixtKSk6bCYmIWUuX3dyaXRhYmxlU3RhdGUmJihlLm9uKFwiZW5kXCIsYyksZS5vbihcImNsb3NlXCIsYykpLGUub24oXCJlbmRcIixnKSxlLm9uKFwiZmluaXNoXCIscCksITEhPT10LmVycm9yJiZlLm9uKFwiZXJyb3JcIixfKSxlLm9uKFwiY2xvc2VcIixoKSxmdW5jdGlvbigpe2UucmVtb3ZlTGlzdGVuZXIoXCJjb21wbGV0ZVwiLHApLGUucmVtb3ZlTGlzdGVuZXIoXCJhYm9ydFwiLGgpLGUucmVtb3ZlTGlzdGVuZXIoXCJyZXF1ZXN0XCIsbSksZS5yZXEmJmUucmVxLnJlbW92ZUxpc3RlbmVyKFwiZmluaXNoXCIscCksZS5yZW1vdmVMaXN0ZW5lcihcImVuZFwiLGMpLGUucmVtb3ZlTGlzdGVuZXIoXCJjbG9zZVwiLGMpLGUucmVtb3ZlTGlzdGVuZXIoXCJmaW5pc2hcIixwKSxlLnJlbW92ZUxpc3RlbmVyKFwiZW5kXCIsZyksZS5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsXyksZS5yZW1vdmVMaXN0ZW5lcihcImNsb3NlXCIsaCl9fXZhciBpPWUoXCIuLi8uLi8uLi9lcnJvcnNcIikuY29kZXMuRVJSX1NUUkVBTV9QUkVNQVRVUkVfQ0xPU0U7dC5leHBvcnRzPW99LHtcIi4uLy4uLy4uL2Vycm9yc1wiOjE1fV0sMjU6W2Z1bmN0aW9uKGUsdCl7dC5leHBvcnRzPWZ1bmN0aW9uKCl7dGhyb3cgbmV3IEVycm9yKFwiUmVhZGFibGUuZnJvbSBpcyBub3QgYXZhaWxhYmxlIGluIHRoZSBicm93c2VyXCIpfX0se31dLDI2OltmdW5jdGlvbihlLHQpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBuKGUpe3ZhciB0PSExO3JldHVybiBmdW5jdGlvbigpe3R8fCh0PSEwLGUuYXBwbHkodm9pZCAwLGFyZ3VtZW50cykpfX1mdW5jdGlvbiByKGUpe2lmKGUpdGhyb3cgZX1mdW5jdGlvbiBhKGUpe3JldHVybiBlLnNldEhlYWRlciYmXCJmdW5jdGlvblwiPT10eXBlb2YgZS5hYm9ydH1mdW5jdGlvbiBvKHQscixvLGkpe2k9bihpKTt2YXIgZD0hMTt0Lm9uKFwiY2xvc2VcIixmdW5jdGlvbigpe2Q9ITB9KSxsPT09dm9pZCAwJiYobD1lKFwiLi9lbmQtb2Ytc3RyZWFtXCIpKSxsKHQse3JlYWRhYmxlOnIsd3JpdGFibGU6b30sZnVuY3Rpb24oZSl7cmV0dXJuIGU/aShlKTp2b2lkKGQ9ITAsaSgpKX0pO3ZhciBzPSExO3JldHVybiBmdW5jdGlvbihlKXtpZighZClyZXR1cm4gcz92b2lkIDA6KHM9ITAsYSh0KT90LmFib3J0KCk6XCJmdW5jdGlvblwiPT10eXBlb2YgdC5kZXN0cm95P3QuZGVzdHJveSgpOnZvaWQgaShlfHxuZXcgcChcInBpcGVcIikpKX19ZnVuY3Rpb24gaShlKXtlKCl9ZnVuY3Rpb24gZChlLHQpe3JldHVybiBlLnBpcGUodCl9ZnVuY3Rpb24gcyhlKXtyZXR1cm4gZS5sZW5ndGg/XCJmdW5jdGlvblwiPT10eXBlb2YgZVtlLmxlbmd0aC0xXT9lLnBvcCgpOnI6cn12YXIgbCxjPWUoXCIuLi8uLi8uLi9lcnJvcnNcIikuY29kZXMsdT1jLkVSUl9NSVNTSU5HX0FSR1MscD1jLkVSUl9TVFJFQU1fREVTVFJPWUVEO3QuZXhwb3J0cz1mdW5jdGlvbigpe2Zvcih2YXIgZT1hcmd1bWVudHMubGVuZ3RoLHQ9QXJyYXkoZSksbj0wO248ZTtuKyspdFtuXT1hcmd1bWVudHNbbl07dmFyIHI9cyh0KTtpZihBcnJheS5pc0FycmF5KHRbMF0pJiYodD10WzBdKSwyPnQubGVuZ3RoKXRocm93IG5ldyB1KFwic3RyZWFtc1wiKTt2YXIgYSxsPXQubWFwKGZ1bmN0aW9uKGUsbil7dmFyIGQ9bjx0Lmxlbmd0aC0xO3JldHVybiBvKGUsZCwwPG4sZnVuY3Rpb24oZSl7YXx8KGE9ZSksZSYmbC5mb3JFYWNoKGkpLGR8fChsLmZvckVhY2goaSkscihhKSl9KX0pO3JldHVybiB0LnJlZHVjZShkKX19LHtcIi4uLy4uLy4uL2Vycm9yc1wiOjE1LFwiLi9lbmQtb2Ytc3RyZWFtXCI6MjR9XSwyNzpbZnVuY3Rpb24oZSxuKXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gcihlLHQsbil7cmV0dXJuIG51bGw9PWUuaGlnaFdhdGVyTWFyaz90P2Vbbl06bnVsbDplLmhpZ2hXYXRlck1hcmt9dmFyIGE9ZShcIi4uLy4uLy4uL2Vycm9yc1wiKS5jb2Rlcy5FUlJfSU5WQUxJRF9PUFRfVkFMVUU7bi5leHBvcnRzPXtnZXRIaWdoV2F0ZXJNYXJrOmZ1bmN0aW9uKGUsbixvLGkpe3ZhciBkPXIobixpLG8pO2lmKG51bGwhPWQpe2lmKCEoaXNGaW5pdGUoZCkmJnQoZCk9PT1kKXx8MD5kKXt2YXIgcz1pP286XCJoaWdoV2F0ZXJNYXJrXCI7dGhyb3cgbmV3IGEocyxkKX1yZXR1cm4gdChkKX1yZXR1cm4gZS5vYmplY3RNb2RlPzE2OjE2Mzg0fX19LHtcIi4uLy4uLy4uL2Vycm9yc1wiOjE1fV0sMjg6W2Z1bmN0aW9uKGUsdCl7dC5leHBvcnRzPWUoXCJldmVudHNcIikuRXZlbnRFbWl0dGVyfSx7ZXZlbnRzOjd9XSwyOTpbZnVuY3Rpb24oZSx0LG4pe249dC5leHBvcnRzPWUoXCIuL2xpYi9fc3RyZWFtX3JlYWRhYmxlLmpzXCIpLG4uU3RyZWFtPW4sbi5SZWFkYWJsZT1uLG4uV3JpdGFibGU9ZShcIi4vbGliL19zdHJlYW1fd3JpdGFibGUuanNcIiksbi5EdXBsZXg9ZShcIi4vbGliL19zdHJlYW1fZHVwbGV4LmpzXCIpLG4uVHJhbnNmb3JtPWUoXCIuL2xpYi9fc3RyZWFtX3RyYW5zZm9ybS5qc1wiKSxuLlBhc3NUaHJvdWdoPWUoXCIuL2xpYi9fc3RyZWFtX3Bhc3N0aHJvdWdoLmpzXCIpLG4uZmluaXNoZWQ9ZShcIi4vbGliL2ludGVybmFsL3N0cmVhbXMvZW5kLW9mLXN0cmVhbS5qc1wiKSxuLnBpcGVsaW5lPWUoXCIuL2xpYi9pbnRlcm5hbC9zdHJlYW1zL3BpcGVsaW5lLmpzXCIpfSx7XCIuL2xpYi9fc3RyZWFtX2R1cGxleC5qc1wiOjE2LFwiLi9saWIvX3N0cmVhbV9wYXNzdGhyb3VnaC5qc1wiOjE3LFwiLi9saWIvX3N0cmVhbV9yZWFkYWJsZS5qc1wiOjE4LFwiLi9saWIvX3N0cmVhbV90cmFuc2Zvcm0uanNcIjoxOSxcIi4vbGliL19zdHJlYW1fd3JpdGFibGUuanNcIjoyMCxcIi4vbGliL2ludGVybmFsL3N0cmVhbXMvZW5kLW9mLXN0cmVhbS5qc1wiOjI0LFwiLi9saWIvaW50ZXJuYWwvc3RyZWFtcy9waXBlbGluZS5qc1wiOjI2fV0sMzA6W2Z1bmN0aW9uKGUsdCxuKXtmdW5jdGlvbiByKGUsdCl7Zm9yKHZhciBuIGluIGUpdFtuXT1lW25dfWZ1bmN0aW9uIGEoZSx0LG4pe3JldHVybiBpKGUsdCxuKX0vKiEgc2FmZS1idWZmZXIuIE1JVCBMaWNlbnNlLiBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmcvb3BlbnNvdXJjZT4gKi92YXIgbz1lKFwiYnVmZmVyXCIpLGk9by5CdWZmZXI7aS5mcm9tJiZpLmFsbG9jJiZpLmFsbG9jVW5zYWZlJiZpLmFsbG9jVW5zYWZlU2xvdz90LmV4cG9ydHM9bzoocihvLG4pLG4uQnVmZmVyPWEpLGEucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoaS5wcm90b3R5cGUpLHIoaSxhKSxhLmZyb209ZnVuY3Rpb24oZSx0LG4pe2lmKFwibnVtYmVyXCI9PXR5cGVvZiBlKXRocm93IG5ldyBUeXBlRXJyb3IoXCJBcmd1bWVudCBtdXN0IG5vdCBiZSBhIG51bWJlclwiKTtyZXR1cm4gaShlLHQsbil9LGEuYWxsb2M9ZnVuY3Rpb24oZSx0LG4pe2lmKFwibnVtYmVyXCIhPXR5cGVvZiBlKXRocm93IG5ldyBUeXBlRXJyb3IoXCJBcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyXCIpO3ZhciByPWkoZSk7cmV0dXJuIHZvaWQgMD09PXQ/ci5maWxsKDApOlwic3RyaW5nXCI9PXR5cGVvZiBuP3IuZmlsbCh0LG4pOnIuZmlsbCh0KSxyfSxhLmFsbG9jVW5zYWZlPWZ1bmN0aW9uKGUpe2lmKFwibnVtYmVyXCIhPXR5cGVvZiBlKXRocm93IG5ldyBUeXBlRXJyb3IoXCJBcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyXCIpO3JldHVybiBpKGUpfSxhLmFsbG9jVW5zYWZlU2xvdz1mdW5jdGlvbihlKXtpZihcIm51bWJlclwiIT10eXBlb2YgZSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiQXJndW1lbnQgbXVzdCBiZSBhIG51bWJlclwiKTtyZXR1cm4gby5TbG93QnVmZmVyKGUpfX0se2J1ZmZlcjozfV0sMzE6W2Z1bmN0aW9uKGUsdCxuKXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gcihlKXtpZighZSlyZXR1cm5cInV0ZjhcIjtmb3IodmFyIHQ7Oylzd2l0Y2goZSl7Y2FzZVwidXRmOFwiOmNhc2VcInV0Zi04XCI6cmV0dXJuXCJ1dGY4XCI7Y2FzZVwidWNzMlwiOmNhc2VcInVjcy0yXCI6Y2FzZVwidXRmMTZsZVwiOmNhc2VcInV0Zi0xNmxlXCI6cmV0dXJuXCJ1dGYxNmxlXCI7Y2FzZVwibGF0aW4xXCI6Y2FzZVwiYmluYXJ5XCI6cmV0dXJuXCJsYXRpbjFcIjtjYXNlXCJiYXNlNjRcIjpjYXNlXCJhc2NpaVwiOmNhc2VcImhleFwiOnJldHVybiBlO2RlZmF1bHQ6aWYodClyZXR1cm47ZT0oXCJcIitlKS50b0xvd2VyQ2FzZSgpLHQ9ITA7fX1mdW5jdGlvbiBhKGUpe3ZhciB0PXIoZSk7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIHQmJihtLmlzRW5jb2Rpbmc9PT1ifHwhYihlKSkpdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBlbmNvZGluZzogXCIrZSk7cmV0dXJuIHR8fGV9ZnVuY3Rpb24gbyhlKXt0aGlzLmVuY29kaW5nPWEoZSk7dmFyIHQ7c3dpdGNoKHRoaXMuZW5jb2Rpbmcpe2Nhc2VcInV0ZjE2bGVcIjp0aGlzLnRleHQ9dSx0aGlzLmVuZD1wLHQ9NDticmVhaztjYXNlXCJ1dGY4XCI6dGhpcy5maWxsTGFzdD1jLHQ9NDticmVhaztjYXNlXCJiYXNlNjRcIjp0aGlzLnRleHQ9Zix0aGlzLmVuZD1nLHQ9MzticmVhaztkZWZhdWx0OnJldHVybiB0aGlzLndyaXRlPV8sdm9pZCh0aGlzLmVuZD1oKTt9dGhpcy5sYXN0TmVlZD0wLHRoaXMubGFzdFRvdGFsPTAsdGhpcy5sYXN0Q2hhcj1tLmFsbG9jVW5zYWZlKHQpfWZ1bmN0aW9uIGQoZSl7aWYoMTI3Pj1lKXJldHVybiAwO3JldHVybiA2PT1lPj41PzI6MTQ9PWU+PjQ/MzozMD09ZT4+Mz80OjI9PWU+PjY/LTE6LTJ9ZnVuY3Rpb24gcyhlLHQsbil7dmFyIHI9dC5sZW5ndGgtMTtpZihyPG4pcmV0dXJuIDA7dmFyIGE9ZCh0W3JdKTtyZXR1cm4gMDw9YT8oMDxhJiYoZS5sYXN0TmVlZD1hLTEpLGEpOi0tcjxufHwtMj09PWE/MDooYT1kKHRbcl0pLDA8PWEpPygwPGEmJihlLmxhc3ROZWVkPWEtMiksYSk6LS1yPG58fC0yPT09YT8wOihhPWQodFtyXSksMDw9YT8oMDxhJiYoMj09PWE/YT0wOmUubGFzdE5lZWQ9YS0zKSxhKTowKX1mdW5jdGlvbiBsKGUsdCl7aWYoMTI4IT0oMTkyJnRbMF0pKXJldHVybiBlLmxhc3ROZWVkPTAsXCJcXHVGRkZEXCI7aWYoMTxlLmxhc3ROZWVkJiYxPHQubGVuZ3RoKXtpZigxMjghPSgxOTImdFsxXSkpcmV0dXJuIGUubGFzdE5lZWQ9MSxcIlxcdUZGRkRcIjtpZigyPGUubGFzdE5lZWQmJjI8dC5sZW5ndGgmJjEyOCE9KDE5MiZ0WzJdKSlyZXR1cm4gZS5sYXN0TmVlZD0yLFwiXFx1RkZGRFwifX1mdW5jdGlvbiBjKGUpe3ZhciB0PXRoaXMubGFzdFRvdGFsLXRoaXMubGFzdE5lZWQsbj1sKHRoaXMsZSx0KTtyZXR1cm4gdm9pZCAwPT09bj90aGlzLmxhc3ROZWVkPD1lLmxlbmd0aD8oZS5jb3B5KHRoaXMubGFzdENoYXIsdCwwLHRoaXMubGFzdE5lZWQpLHRoaXMubGFzdENoYXIudG9TdHJpbmcodGhpcy5lbmNvZGluZywwLHRoaXMubGFzdFRvdGFsKSk6dm9pZChlLmNvcHkodGhpcy5sYXN0Q2hhcix0LDAsZS5sZW5ndGgpLHRoaXMubGFzdE5lZWQtPWUubGVuZ3RoKTpufWZ1bmN0aW9uIHUoZSx0KXtpZigwPT0oZS5sZW5ndGgtdCklMil7dmFyIG49ZS50b1N0cmluZyhcInV0ZjE2bGVcIix0KTtpZihuKXt2YXIgcj1uLmNoYXJDb2RlQXQobi5sZW5ndGgtMSk7aWYoNTUyOTY8PXImJjU2MzE5Pj1yKXJldHVybiB0aGlzLmxhc3ROZWVkPTIsdGhpcy5sYXN0VG90YWw9NCx0aGlzLmxhc3RDaGFyWzBdPWVbZS5sZW5ndGgtMl0sdGhpcy5sYXN0Q2hhclsxXT1lW2UubGVuZ3RoLTFdLG4uc2xpY2UoMCwtMSl9cmV0dXJuIG59cmV0dXJuIHRoaXMubGFzdE5lZWQ9MSx0aGlzLmxhc3RUb3RhbD0yLHRoaXMubGFzdENoYXJbMF09ZVtlLmxlbmd0aC0xXSxlLnRvU3RyaW5nKFwidXRmMTZsZVwiLHQsZS5sZW5ndGgtMSl9ZnVuY3Rpb24gcChlKXt2YXIgdD1lJiZlLmxlbmd0aD90aGlzLndyaXRlKGUpOlwiXCI7aWYodGhpcy5sYXN0TmVlZCl7dmFyIG49dGhpcy5sYXN0VG90YWwtdGhpcy5sYXN0TmVlZDtyZXR1cm4gdCt0aGlzLmxhc3RDaGFyLnRvU3RyaW5nKFwidXRmMTZsZVwiLDAsbil9cmV0dXJuIHR9ZnVuY3Rpb24gZihlLHQpe3ZhciByPShlLmxlbmd0aC10KSUzO3JldHVybiAwPT1yP2UudG9TdHJpbmcoXCJiYXNlNjRcIix0KToodGhpcy5sYXN0TmVlZD0zLXIsdGhpcy5sYXN0VG90YWw9MywxPT1yP3RoaXMubGFzdENoYXJbMF09ZVtlLmxlbmd0aC0xXToodGhpcy5sYXN0Q2hhclswXT1lW2UubGVuZ3RoLTJdLHRoaXMubGFzdENoYXJbMV09ZVtlLmxlbmd0aC0xXSksZS50b1N0cmluZyhcImJhc2U2NFwiLHQsZS5sZW5ndGgtcikpfWZ1bmN0aW9uIGcoZSl7dmFyIHQ9ZSYmZS5sZW5ndGg/dGhpcy53cml0ZShlKTpcIlwiO3JldHVybiB0aGlzLmxhc3ROZWVkP3QrdGhpcy5sYXN0Q2hhci50b1N0cmluZyhcImJhc2U2NFwiLDAsMy10aGlzLmxhc3ROZWVkKTp0fWZ1bmN0aW9uIF8oZSl7cmV0dXJuIGUudG9TdHJpbmcodGhpcy5lbmNvZGluZyl9ZnVuY3Rpb24gaChlKXtyZXR1cm4gZSYmZS5sZW5ndGg/dGhpcy53cml0ZShlKTpcIlwifXZhciBtPWUoXCJzYWZlLWJ1ZmZlclwiKS5CdWZmZXIsYj1tLmlzRW5jb2Rpbmd8fGZ1bmN0aW9uKGUpe3N3aXRjaChlPVwiXCIrZSxlJiZlLnRvTG93ZXJDYXNlKCkpe2Nhc2VcImhleFwiOmNhc2VcInV0ZjhcIjpjYXNlXCJ1dGYtOFwiOmNhc2VcImFzY2lpXCI6Y2FzZVwiYmluYXJ5XCI6Y2FzZVwiYmFzZTY0XCI6Y2FzZVwidWNzMlwiOmNhc2VcInVjcy0yXCI6Y2FzZVwidXRmMTZsZVwiOmNhc2VcInV0Zi0xNmxlXCI6Y2FzZVwicmF3XCI6cmV0dXJuITA7ZGVmYXVsdDpyZXR1cm4hMTt9fTtuLlN0cmluZ0RlY29kZXI9byxvLnByb3RvdHlwZS53cml0ZT1mdW5jdGlvbihlKXtpZigwPT09ZS5sZW5ndGgpcmV0dXJuXCJcIjt2YXIgdCxuO2lmKHRoaXMubGFzdE5lZWQpe2lmKHQ9dGhpcy5maWxsTGFzdChlKSx2b2lkIDA9PT10KXJldHVyblwiXCI7bj10aGlzLmxhc3ROZWVkLHRoaXMubGFzdE5lZWQ9MH1lbHNlIG49MDtyZXR1cm4gbjxlLmxlbmd0aD90P3QrdGhpcy50ZXh0KGUsbik6dGhpcy50ZXh0KGUsbik6dHx8XCJcIn0sby5wcm90b3R5cGUuZW5kPWZ1bmN0aW9uKGUpe3ZhciB0PWUmJmUubGVuZ3RoP3RoaXMud3JpdGUoZSk6XCJcIjtyZXR1cm4gdGhpcy5sYXN0TmVlZD90K1wiXFx1RkZGRFwiOnR9LG8ucHJvdG90eXBlLnRleHQ9ZnVuY3Rpb24oZSx0KXt2YXIgbj1zKHRoaXMsZSx0KTtpZighdGhpcy5sYXN0TmVlZClyZXR1cm4gZS50b1N0cmluZyhcInV0ZjhcIix0KTt0aGlzLmxhc3RUb3RhbD1uO3ZhciByPWUubGVuZ3RoLShuLXRoaXMubGFzdE5lZWQpO3JldHVybiBlLmNvcHkodGhpcy5sYXN0Q2hhciwwLHIpLGUudG9TdHJpbmcoXCJ1dGY4XCIsdCxyKX0sby5wcm90b3R5cGUuZmlsbExhc3Q9ZnVuY3Rpb24oZSl7cmV0dXJuIHRoaXMubGFzdE5lZWQ8PWUubGVuZ3RoPyhlLmNvcHkodGhpcy5sYXN0Q2hhcix0aGlzLmxhc3RUb3RhbC10aGlzLmxhc3ROZWVkLDAsdGhpcy5sYXN0TmVlZCksdGhpcy5sYXN0Q2hhci50b1N0cmluZyh0aGlzLmVuY29kaW5nLDAsdGhpcy5sYXN0VG90YWwpKTp2b2lkKGUuY29weSh0aGlzLmxhc3RDaGFyLHRoaXMubGFzdFRvdGFsLXRoaXMubGFzdE5lZWQsMCxlLmxlbmd0aCksdGhpcy5sYXN0TmVlZC09ZS5sZW5ndGgpfX0se1wic2FmZS1idWZmZXJcIjozMH1dLDMyOltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihlKXsoZnVuY3Rpb24oKXtmdW5jdGlvbiBuKHQpe3RyeXtpZighZS5sb2NhbFN0b3JhZ2UpcmV0dXJuITF9Y2F0Y2goZSl7cmV0dXJuITF9dmFyIG49ZS5sb2NhbFN0b3JhZ2VbdF07cmV0dXJuIG51bGwhPW4mJlwidHJ1ZVwiPT09KG4rXCJcIikudG9Mb3dlckNhc2UoKX10LmV4cG9ydHM9ZnVuY3Rpb24oZSx0KXtmdW5jdGlvbiByKCl7aWYoIWEpe2lmKG4oXCJ0aHJvd0RlcHJlY2F0aW9uXCIpKXRocm93IG5ldyBFcnJvcih0KTtlbHNlIG4oXCJ0cmFjZURlcHJlY2F0aW9uXCIpP2NvbnNvbGUudHJhY2UodCk6Y29uc29sZS53YXJuKHQpO2E9ITB9cmV0dXJuIGUuYXBwbHkodGhpcyxhcmd1bWVudHMpfWlmKG4oXCJub0RlcHJlY2F0aW9uXCIpKXJldHVybiBlO3ZhciBhPSExO3JldHVybiByfX0pLmNhbGwodGhpcyl9KS5jYWxsKHRoaXMsXCJ1bmRlZmluZWRcIj09dHlwZW9mIGdsb2JhbD9cInVuZGVmaW5lZFwiPT10eXBlb2Ygc2VsZj9cInVuZGVmaW5lZFwiPT10eXBlb2Ygd2luZG93P3t9OndpbmRvdzpzZWxmOmdsb2JhbCl9LHt9XSxcIi9cIjpbZnVuY3Rpb24oZSx0KXtmdW5jdGlvbiBuKGUpe3JldHVybiBlLnJlcGxhY2UoL2E9aWNlLW9wdGlvbnM6dHJpY2tsZVxcc1xcbi9nLFwiXCIpfWZ1bmN0aW9uIHIoZSl7Y29uc29sZS53YXJuKGUpfS8qISBzaW1wbGUtcGVlci4gTUlUIExpY2Vuc2UuIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZy9vcGVuc291cmNlPiAqL2NvbnN0IGE9ZShcImRlYnVnXCIpKFwic2ltcGxlLXBlZXJcIiksbz1lKFwiZ2V0LWJyb3dzZXItcnRjXCIpLGk9ZShcInJhbmRvbWJ5dGVzXCIpLGQ9ZShcInJlYWRhYmxlLXN0cmVhbVwiKSxzPWUoXCJxdWV1ZS1taWNyb3Rhc2tcIiksbD1lKFwiZXJyLWNvZGVcIikse0J1ZmZlcjpjfT1lKFwiYnVmZmVyXCIpLHU9NjU1MzY7Y2xhc3MgcCBleHRlbmRzIGQuRHVwbGV4e2NvbnN0cnVjdG9yKGUpe2lmKGU9T2JqZWN0LmFzc2lnbih7YWxsb3dIYWxmT3BlbjohMX0sZSksc3VwZXIoZSksdGhpcy5faWQ9aSg0KS50b1N0cmluZyhcImhleFwiKS5zbGljZSgwLDcpLHRoaXMuX2RlYnVnKFwibmV3IHBlZXIgJW9cIixlKSx0aGlzLmNoYW5uZWxOYW1lPWUuaW5pdGlhdG9yP2UuY2hhbm5lbE5hbWV8fGkoMjApLnRvU3RyaW5nKFwiaGV4XCIpOm51bGwsdGhpcy5pbml0aWF0b3I9ZS5pbml0aWF0b3J8fCExLHRoaXMuY2hhbm5lbENvbmZpZz1lLmNoYW5uZWxDb25maWd8fHAuY2hhbm5lbENvbmZpZyx0aGlzLmNoYW5uZWxOZWdvdGlhdGVkPXRoaXMuY2hhbm5lbENvbmZpZy5uZWdvdGlhdGVkLHRoaXMuY29uZmlnPU9iamVjdC5hc3NpZ24oe30scC5jb25maWcsZS5jb25maWcpLHRoaXMub2ZmZXJPcHRpb25zPWUub2ZmZXJPcHRpb25zfHx7fSx0aGlzLmFuc3dlck9wdGlvbnM9ZS5hbnN3ZXJPcHRpb25zfHx7fSx0aGlzLnNkcFRyYW5zZm9ybT1lLnNkcFRyYW5zZm9ybXx8KGU9PmUpLHRoaXMuc3RyZWFtcz1lLnN0cmVhbXN8fChlLnN0cmVhbT9bZS5zdHJlYW1dOltdKSx0aGlzLnRyaWNrbGU9dm9pZCAwPT09ZS50cmlja2xlfHxlLnRyaWNrbGUsdGhpcy5hbGxvd0hhbGZUcmlja2xlPXZvaWQgMCE9PWUuYWxsb3dIYWxmVHJpY2tsZSYmZS5hbGxvd0hhbGZUcmlja2xlLHRoaXMuaWNlQ29tcGxldGVUaW1lb3V0PWUuaWNlQ29tcGxldGVUaW1lb3V0fHw1MDAwLHRoaXMuZGVzdHJveWVkPSExLHRoaXMuZGVzdHJveWluZz0hMSx0aGlzLl9jb25uZWN0ZWQ9ITEsdGhpcy5yZW1vdGVBZGRyZXNzPXZvaWQgMCx0aGlzLnJlbW90ZUZhbWlseT12b2lkIDAsdGhpcy5yZW1vdGVQb3J0PXZvaWQgMCx0aGlzLmxvY2FsQWRkcmVzcz12b2lkIDAsdGhpcy5sb2NhbEZhbWlseT12b2lkIDAsdGhpcy5sb2NhbFBvcnQ9dm9pZCAwLHRoaXMuX3dydGM9ZS53cnRjJiZcIm9iamVjdFwiPT10eXBlb2YgZS53cnRjP2Uud3J0YzpvKCksIXRoaXMuX3dydGMpaWYoXCJ1bmRlZmluZWRcIj09dHlwZW9mIHdpbmRvdyl0aHJvdyBsKG5ldyBFcnJvcihcIk5vIFdlYlJUQyBzdXBwb3J0OiBTcGVjaWZ5IGBvcHRzLndydGNgIG9wdGlvbiBpbiB0aGlzIGVudmlyb25tZW50XCIpLFwiRVJSX1dFQlJUQ19TVVBQT1JUXCIpO2Vsc2UgdGhyb3cgbChuZXcgRXJyb3IoXCJObyBXZWJSVEMgc3VwcG9ydDogTm90IGEgc3VwcG9ydGVkIGJyb3dzZXJcIiksXCJFUlJfV0VCUlRDX1NVUFBPUlRcIik7dGhpcy5fcGNSZWFkeT0hMSx0aGlzLl9jaGFubmVsUmVhZHk9ITEsdGhpcy5faWNlQ29tcGxldGU9ITEsdGhpcy5faWNlQ29tcGxldGVUaW1lcj1udWxsLHRoaXMuX2NoYW5uZWw9bnVsbCx0aGlzLl9wZW5kaW5nQ2FuZGlkYXRlcz1bXSx0aGlzLl9pc05lZ290aWF0aW5nPSExLHRoaXMuX2ZpcnN0TmVnb3RpYXRpb249ITAsdGhpcy5fYmF0Y2hlZE5lZ290aWF0aW9uPSExLHRoaXMuX3F1ZXVlZE5lZ290aWF0aW9uPSExLHRoaXMuX3NlbmRlcnNBd2FpdGluZ1N0YWJsZT1bXSx0aGlzLl9zZW5kZXJNYXA9bmV3IE1hcCx0aGlzLl9jbG9zaW5nSW50ZXJ2YWw9bnVsbCx0aGlzLl9yZW1vdGVUcmFja3M9W10sdGhpcy5fcmVtb3RlU3RyZWFtcz1bXSx0aGlzLl9jaHVuaz1udWxsLHRoaXMuX2NiPW51bGwsdGhpcy5faW50ZXJ2YWw9bnVsbDt0cnl7dGhpcy5fcGM9bmV3IHRoaXMuX3dydGMuUlRDUGVlckNvbm5lY3Rpb24odGhpcy5jb25maWcpfWNhdGNoKGUpe3JldHVybiB2b2lkIHRoaXMuZGVzdHJveShsKGUsXCJFUlJfUENfQ09OU1RSVUNUT1JcIikpfXRoaXMuX2lzUmVhY3ROYXRpdmVXZWJydGM9XCJudW1iZXJcIj09dHlwZW9mIHRoaXMuX3BjLl9wZWVyQ29ubmVjdGlvbklkLHRoaXMuX3BjLm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlPSgpPT57dGhpcy5fb25JY2VTdGF0ZUNoYW5nZSgpfSx0aGlzLl9wYy5vbmljZWdhdGhlcmluZ3N0YXRlY2hhbmdlPSgpPT57dGhpcy5fb25JY2VTdGF0ZUNoYW5nZSgpfSx0aGlzLl9wYy5vbmNvbm5lY3Rpb25zdGF0ZWNoYW5nZT0oKT0+e3RoaXMuX29uQ29ubmVjdGlvblN0YXRlQ2hhbmdlKCl9LHRoaXMuX3BjLm9uc2lnbmFsaW5nc3RhdGVjaGFuZ2U9KCk9Pnt0aGlzLl9vblNpZ25hbGluZ1N0YXRlQ2hhbmdlKCl9LHRoaXMuX3BjLm9uaWNlY2FuZGlkYXRlPWU9Pnt0aGlzLl9vbkljZUNhbmRpZGF0ZShlKX0sXCJvYmplY3RcIj09dHlwZW9mIHRoaXMuX3BjLnBlZXJJZGVudGl0eSYmdGhpcy5fcGMucGVlcklkZW50aXR5LmNhdGNoKGU9Pnt0aGlzLmRlc3Ryb3kobChlLFwiRVJSX1BDX1BFRVJfSURFTlRJVFlcIikpfSksdGhpcy5pbml0aWF0b3J8fHRoaXMuY2hhbm5lbE5lZ290aWF0ZWQ/dGhpcy5fc2V0dXBEYXRhKHtjaGFubmVsOnRoaXMuX3BjLmNyZWF0ZURhdGFDaGFubmVsKHRoaXMuY2hhbm5lbE5hbWUsdGhpcy5jaGFubmVsQ29uZmlnKX0pOnRoaXMuX3BjLm9uZGF0YWNoYW5uZWw9ZT0+e3RoaXMuX3NldHVwRGF0YShlKX0sdGhpcy5zdHJlYW1zJiZ0aGlzLnN0cmVhbXMuZm9yRWFjaChlPT57dGhpcy5hZGRTdHJlYW0oZSl9KSx0aGlzLl9wYy5vbnRyYWNrPWU9Pnt0aGlzLl9vblRyYWNrKGUpfSx0aGlzLl9kZWJ1ZyhcImluaXRpYWwgbmVnb3RpYXRpb25cIiksdGhpcy5fbmVlZHNOZWdvdGlhdGlvbigpLHRoaXMuX29uRmluaXNoQm91bmQ9KCk9Pnt0aGlzLl9vbkZpbmlzaCgpfSx0aGlzLm9uY2UoXCJmaW5pc2hcIix0aGlzLl9vbkZpbmlzaEJvdW5kKX1nZXQgYnVmZmVyU2l6ZSgpe3JldHVybiB0aGlzLl9jaGFubmVsJiZ0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50fHwwfWdldCBjb25uZWN0ZWQoKXtyZXR1cm4gdGhpcy5fY29ubmVjdGVkJiZcIm9wZW5cIj09PXRoaXMuX2NoYW5uZWwucmVhZHlTdGF0ZX1hZGRyZXNzKCl7cmV0dXJue3BvcnQ6dGhpcy5sb2NhbFBvcnQsZmFtaWx5OnRoaXMubG9jYWxGYW1pbHksYWRkcmVzczp0aGlzLmxvY2FsQWRkcmVzc319c2lnbmFsKGUpe2lmKCF0aGlzLmRlc3Ryb3lpbmcpe2lmKHRoaXMuZGVzdHJveWVkKXRocm93IGwobmV3IEVycm9yKFwiY2Fubm90IHNpZ25hbCBhZnRlciBwZWVyIGlzIGRlc3Ryb3llZFwiKSxcIkVSUl9ERVNUUk9ZRURcIik7aWYoXCJzdHJpbmdcIj09dHlwZW9mIGUpdHJ5e2U9SlNPTi5wYXJzZShlKX1jYXRjaCh0KXtlPXt9fXRoaXMuX2RlYnVnKFwic2lnbmFsKClcIiksZS5yZW5lZ290aWF0ZSYmdGhpcy5pbml0aWF0b3ImJih0aGlzLl9kZWJ1ZyhcImdvdCByZXF1ZXN0IHRvIHJlbmVnb3RpYXRlXCIpLHRoaXMuX25lZWRzTmVnb3RpYXRpb24oKSksZS50cmFuc2NlaXZlclJlcXVlc3QmJnRoaXMuaW5pdGlhdG9yJiYodGhpcy5fZGVidWcoXCJnb3QgcmVxdWVzdCBmb3IgdHJhbnNjZWl2ZXJcIiksdGhpcy5hZGRUcmFuc2NlaXZlcihlLnRyYW5zY2VpdmVyUmVxdWVzdC5raW5kLGUudHJhbnNjZWl2ZXJSZXF1ZXN0LmluaXQpKSxlLmNhbmRpZGF0ZSYmKHRoaXMuX3BjLnJlbW90ZURlc2NyaXB0aW9uJiZ0aGlzLl9wYy5yZW1vdGVEZXNjcmlwdGlvbi50eXBlP3RoaXMuX2FkZEljZUNhbmRpZGF0ZShlLmNhbmRpZGF0ZSk6dGhpcy5fcGVuZGluZ0NhbmRpZGF0ZXMucHVzaChlLmNhbmRpZGF0ZSkpLGUuc2RwJiZ0aGlzLl9wYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgdGhpcy5fd3J0Yy5SVENTZXNzaW9uRGVzY3JpcHRpb24oZSkpLnRoZW4oKCk9Pnt0aGlzLmRlc3Ryb3llZHx8KHRoaXMuX3BlbmRpbmdDYW5kaWRhdGVzLmZvckVhY2goZT0+e3RoaXMuX2FkZEljZUNhbmRpZGF0ZShlKX0pLHRoaXMuX3BlbmRpbmdDYW5kaWRhdGVzPVtdLFwib2ZmZXJcIj09PXRoaXMuX3BjLnJlbW90ZURlc2NyaXB0aW9uLnR5cGUmJnRoaXMuX2NyZWF0ZUFuc3dlcigpKX0pLmNhdGNoKGU9Pnt0aGlzLmRlc3Ryb3kobChlLFwiRVJSX1NFVF9SRU1PVEVfREVTQ1JJUFRJT05cIikpfSksZS5zZHB8fGUuY2FuZGlkYXRlfHxlLnJlbmVnb3RpYXRlfHxlLnRyYW5zY2VpdmVyUmVxdWVzdHx8dGhpcy5kZXN0cm95KGwobmV3IEVycm9yKFwic2lnbmFsKCkgY2FsbGVkIHdpdGggaW52YWxpZCBzaWduYWwgZGF0YVwiKSxcIkVSUl9TSUdOQUxJTkdcIikpfX1fYWRkSWNlQ2FuZGlkYXRlKGUpe2NvbnN0IHQ9bmV3IHRoaXMuX3dydGMuUlRDSWNlQ2FuZGlkYXRlKGUpO3RoaXMuX3BjLmFkZEljZUNhbmRpZGF0ZSh0KS5jYXRjaChlPT57IXQuYWRkcmVzc3x8dC5hZGRyZXNzLmVuZHNXaXRoKFwiLmxvY2FsXCIpP3IoXCJJZ25vcmluZyB1bnN1cHBvcnRlZCBJQ0UgY2FuZGlkYXRlLlwiKTp0aGlzLmRlc3Ryb3kobChlLFwiRVJSX0FERF9JQ0VfQ0FORElEQVRFXCIpKX0pfXNlbmQoZSl7aWYoIXRoaXMuZGVzdHJveWluZyl7aWYodGhpcy5kZXN0cm95ZWQpdGhyb3cgbChuZXcgRXJyb3IoXCJjYW5ub3Qgc2VuZCBhZnRlciBwZWVyIGlzIGRlc3Ryb3llZFwiKSxcIkVSUl9ERVNUUk9ZRURcIik7dGhpcy5fY2hhbm5lbC5zZW5kKGUpfX1hZGRUcmFuc2NlaXZlcihlLHQpe2lmKCF0aGlzLmRlc3Ryb3lpbmcpe2lmKHRoaXMuZGVzdHJveWVkKXRocm93IGwobmV3IEVycm9yKFwiY2Fubm90IGFkZFRyYW5zY2VpdmVyIGFmdGVyIHBlZXIgaXMgZGVzdHJveWVkXCIpLFwiRVJSX0RFU1RST1lFRFwiKTtpZih0aGlzLl9kZWJ1ZyhcImFkZFRyYW5zY2VpdmVyKClcIiksdGhpcy5pbml0aWF0b3IpdHJ5e3RoaXMuX3BjLmFkZFRyYW5zY2VpdmVyKGUsdCksdGhpcy5fbmVlZHNOZWdvdGlhdGlvbigpfWNhdGNoKGUpe3RoaXMuZGVzdHJveShsKGUsXCJFUlJfQUREX1RSQU5TQ0VJVkVSXCIpKX1lbHNlIHRoaXMuZW1pdChcInNpZ25hbFwiLHt0eXBlOlwidHJhbnNjZWl2ZXJSZXF1ZXN0XCIsdHJhbnNjZWl2ZXJSZXF1ZXN0OntraW5kOmUsaW5pdDp0fX0pfX1hZGRTdHJlYW0oZSl7aWYoIXRoaXMuZGVzdHJveWluZyl7aWYodGhpcy5kZXN0cm95ZWQpdGhyb3cgbChuZXcgRXJyb3IoXCJjYW5ub3QgYWRkU3RyZWFtIGFmdGVyIHBlZXIgaXMgZGVzdHJveWVkXCIpLFwiRVJSX0RFU1RST1lFRFwiKTt0aGlzLl9kZWJ1ZyhcImFkZFN0cmVhbSgpXCIpLGUuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0PT57dGhpcy5hZGRUcmFjayh0LGUpfSl9fWFkZFRyYWNrKGUsdCl7aWYodGhpcy5kZXN0cm95aW5nKXJldHVybjtpZih0aGlzLmRlc3Ryb3llZCl0aHJvdyBsKG5ldyBFcnJvcihcImNhbm5vdCBhZGRUcmFjayBhZnRlciBwZWVyIGlzIGRlc3Ryb3llZFwiKSxcIkVSUl9ERVNUUk9ZRURcIik7dGhpcy5fZGVidWcoXCJhZGRUcmFjaygpXCIpO2NvbnN0IG49dGhpcy5fc2VuZGVyTWFwLmdldChlKXx8bmV3IE1hcDtsZXQgcj1uLmdldCh0KTtpZighcilyPXRoaXMuX3BjLmFkZFRyYWNrKGUsdCksbi5zZXQodCxyKSx0aGlzLl9zZW5kZXJNYXAuc2V0KGUsbiksdGhpcy5fbmVlZHNOZWdvdGlhdGlvbigpO2Vsc2UgaWYoci5yZW1vdmVkKXRocm93IGwobmV3IEVycm9yKFwiVHJhY2sgaGFzIGJlZW4gcmVtb3ZlZC4gWW91IHNob3VsZCBlbmFibGUvZGlzYWJsZSB0cmFja3MgdGhhdCB5b3Ugd2FudCB0byByZS1hZGQuXCIpLFwiRVJSX1NFTkRFUl9SRU1PVkVEXCIpO2Vsc2UgdGhyb3cgbChuZXcgRXJyb3IoXCJUcmFjayBoYXMgYWxyZWFkeSBiZWVuIGFkZGVkIHRvIHRoYXQgc3RyZWFtLlwiKSxcIkVSUl9TRU5ERVJfQUxSRUFEWV9BRERFRFwiKX1yZXBsYWNlVHJhY2soZSx0LG4pe2lmKHRoaXMuZGVzdHJveWluZylyZXR1cm47aWYodGhpcy5kZXN0cm95ZWQpdGhyb3cgbChuZXcgRXJyb3IoXCJjYW5ub3QgcmVwbGFjZVRyYWNrIGFmdGVyIHBlZXIgaXMgZGVzdHJveWVkXCIpLFwiRVJSX0RFU1RST1lFRFwiKTt0aGlzLl9kZWJ1ZyhcInJlcGxhY2VUcmFjaygpXCIpO2NvbnN0IHI9dGhpcy5fc2VuZGVyTWFwLmdldChlKSxhPXI/ci5nZXQobik6bnVsbDtpZighYSl0aHJvdyBsKG5ldyBFcnJvcihcIkNhbm5vdCByZXBsYWNlIHRyYWNrIHRoYXQgd2FzIG5ldmVyIGFkZGVkLlwiKSxcIkVSUl9UUkFDS19OT1RfQURERURcIik7dCYmdGhpcy5fc2VuZGVyTWFwLnNldCh0LHIpLG51bGw9PWEucmVwbGFjZVRyYWNrP3RoaXMuZGVzdHJveShsKG5ldyBFcnJvcihcInJlcGxhY2VUcmFjayBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKSxcIkVSUl9VTlNVUFBPUlRFRF9SRVBMQUNFVFJBQ0tcIikpOmEucmVwbGFjZVRyYWNrKHQpfXJlbW92ZVRyYWNrKGUsdCl7aWYodGhpcy5kZXN0cm95aW5nKXJldHVybjtpZih0aGlzLmRlc3Ryb3llZCl0aHJvdyBsKG5ldyBFcnJvcihcImNhbm5vdCByZW1vdmVUcmFjayBhZnRlciBwZWVyIGlzIGRlc3Ryb3llZFwiKSxcIkVSUl9ERVNUUk9ZRURcIik7dGhpcy5fZGVidWcoXCJyZW1vdmVTZW5kZXIoKVwiKTtjb25zdCBuPXRoaXMuX3NlbmRlck1hcC5nZXQoZSkscj1uP24uZ2V0KHQpOm51bGw7aWYoIXIpdGhyb3cgbChuZXcgRXJyb3IoXCJDYW5ub3QgcmVtb3ZlIHRyYWNrIHRoYXQgd2FzIG5ldmVyIGFkZGVkLlwiKSxcIkVSUl9UUkFDS19OT1RfQURERURcIik7dHJ5e3IucmVtb3ZlZD0hMCx0aGlzLl9wYy5yZW1vdmVUcmFjayhyKX1jYXRjaChlKXtcIk5TX0VSUk9SX1VORVhQRUNURURcIj09PWUubmFtZT90aGlzLl9zZW5kZXJzQXdhaXRpbmdTdGFibGUucHVzaChyKTp0aGlzLmRlc3Ryb3kobChlLFwiRVJSX1JFTU9WRV9UUkFDS1wiKSl9dGhpcy5fbmVlZHNOZWdvdGlhdGlvbigpfXJlbW92ZVN0cmVhbShlKXtpZighdGhpcy5kZXN0cm95aW5nKXtpZih0aGlzLmRlc3Ryb3llZCl0aHJvdyBsKG5ldyBFcnJvcihcImNhbm5vdCByZW1vdmVTdHJlYW0gYWZ0ZXIgcGVlciBpcyBkZXN0cm95ZWRcIiksXCJFUlJfREVTVFJPWUVEXCIpO3RoaXMuX2RlYnVnKFwicmVtb3ZlU2VuZGVycygpXCIpLGUuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0PT57dGhpcy5yZW1vdmVUcmFjayh0LGUpfSl9fV9uZWVkc05lZ290aWF0aW9uKCl7dGhpcy5fZGVidWcoXCJfbmVlZHNOZWdvdGlhdGlvblwiKSx0aGlzLl9iYXRjaGVkTmVnb3RpYXRpb258fCh0aGlzLl9iYXRjaGVkTmVnb3RpYXRpb249ITAscygoKT0+e3RoaXMuX2JhdGNoZWROZWdvdGlhdGlvbj0hMSx0aGlzLmluaXRpYXRvcnx8IXRoaXMuX2ZpcnN0TmVnb3RpYXRpb24/KHRoaXMuX2RlYnVnKFwic3RhcnRpbmcgYmF0Y2hlZCBuZWdvdGlhdGlvblwiKSx0aGlzLm5lZ290aWF0ZSgpKTp0aGlzLl9kZWJ1ZyhcIm5vbi1pbml0aWF0b3IgaW5pdGlhbCBuZWdvdGlhdGlvbiByZXF1ZXN0IGRpc2NhcmRlZFwiKSx0aGlzLl9maXJzdE5lZ290aWF0aW9uPSExfSkpfW5lZ290aWF0ZSgpe2lmKCF0aGlzLmRlc3Ryb3lpbmcpe2lmKHRoaXMuZGVzdHJveWVkKXRocm93IGwobmV3IEVycm9yKFwiY2Fubm90IG5lZ290aWF0ZSBhZnRlciBwZWVyIGlzIGRlc3Ryb3llZFwiKSxcIkVSUl9ERVNUUk9ZRURcIik7dGhpcy5pbml0aWF0b3I/dGhpcy5faXNOZWdvdGlhdGluZz8odGhpcy5fcXVldWVkTmVnb3RpYXRpb249ITAsdGhpcy5fZGVidWcoXCJhbHJlYWR5IG5lZ290aWF0aW5nLCBxdWV1ZWluZ1wiKSk6KHRoaXMuX2RlYnVnKFwic3RhcnQgbmVnb3RpYXRpb25cIiksc2V0VGltZW91dCgoKT0+e3RoaXMuX2NyZWF0ZU9mZmVyKCl9LDApKTp0aGlzLl9pc05lZ290aWF0aW5nPyh0aGlzLl9xdWV1ZWROZWdvdGlhdGlvbj0hMCx0aGlzLl9kZWJ1ZyhcImFscmVhZHkgbmVnb3RpYXRpbmcsIHF1ZXVlaW5nXCIpKToodGhpcy5fZGVidWcoXCJyZXF1ZXN0aW5nIG5lZ290aWF0aW9uIGZyb20gaW5pdGlhdG9yXCIpLHRoaXMuZW1pdChcInNpZ25hbFwiLHt0eXBlOlwicmVuZWdvdGlhdGVcIixyZW5lZ290aWF0ZTohMH0pKSx0aGlzLl9pc05lZ290aWF0aW5nPSEwfX1kZXN0cm95KGUpe3RoaXMuX2Rlc3Ryb3koZSwoKT0+e30pfV9kZXN0cm95KGUsdCl7dGhpcy5kZXN0cm95ZWR8fHRoaXMuZGVzdHJveWluZ3x8KHRoaXMuZGVzdHJveWluZz0hMCx0aGlzLl9kZWJ1ZyhcImRlc3Ryb3lpbmcgKGVycm9yOiAlcylcIixlJiYoZS5tZXNzYWdlfHxlKSkscygoKT0+e2lmKHRoaXMuZGVzdHJveWVkPSEwLHRoaXMuZGVzdHJveWluZz0hMSx0aGlzLl9kZWJ1ZyhcImRlc3Ryb3kgKGVycm9yOiAlcylcIixlJiYoZS5tZXNzYWdlfHxlKSksdGhpcy5yZWFkYWJsZT10aGlzLndyaXRhYmxlPSExLHRoaXMuX3JlYWRhYmxlU3RhdGUuZW5kZWR8fHRoaXMucHVzaChudWxsKSx0aGlzLl93cml0YWJsZVN0YXRlLmZpbmlzaGVkfHx0aGlzLmVuZCgpLHRoaXMuX2Nvbm5lY3RlZD0hMSx0aGlzLl9wY1JlYWR5PSExLHRoaXMuX2NoYW5uZWxSZWFkeT0hMSx0aGlzLl9yZW1vdGVUcmFja3M9bnVsbCx0aGlzLl9yZW1vdGVTdHJlYW1zPW51bGwsdGhpcy5fc2VuZGVyTWFwPW51bGwsY2xlYXJJbnRlcnZhbCh0aGlzLl9jbG9zaW5nSW50ZXJ2YWwpLHRoaXMuX2Nsb3NpbmdJbnRlcnZhbD1udWxsLGNsZWFySW50ZXJ2YWwodGhpcy5faW50ZXJ2YWwpLHRoaXMuX2ludGVydmFsPW51bGwsdGhpcy5fY2h1bms9bnVsbCx0aGlzLl9jYj1udWxsLHRoaXMuX29uRmluaXNoQm91bmQmJnRoaXMucmVtb3ZlTGlzdGVuZXIoXCJmaW5pc2hcIix0aGlzLl9vbkZpbmlzaEJvdW5kKSx0aGlzLl9vbkZpbmlzaEJvdW5kPW51bGwsdGhpcy5fY2hhbm5lbCl7dHJ5e3RoaXMuX2NoYW5uZWwuY2xvc2UoKX1jYXRjaChlKXt9dGhpcy5fY2hhbm5lbC5vbm1lc3NhZ2U9bnVsbCx0aGlzLl9jaGFubmVsLm9ub3Blbj1udWxsLHRoaXMuX2NoYW5uZWwub25jbG9zZT1udWxsLHRoaXMuX2NoYW5uZWwub25lcnJvcj1udWxsfWlmKHRoaXMuX3BjKXt0cnl7dGhpcy5fcGMuY2xvc2UoKX1jYXRjaChlKXt9dGhpcy5fcGMub25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2U9bnVsbCx0aGlzLl9wYy5vbmljZWdhdGhlcmluZ3N0YXRlY2hhbmdlPW51bGwsdGhpcy5fcGMub25zaWduYWxpbmdzdGF0ZWNoYW5nZT1udWxsLHRoaXMuX3BjLm9uaWNlY2FuZGlkYXRlPW51bGwsdGhpcy5fcGMub250cmFjaz1udWxsLHRoaXMuX3BjLm9uZGF0YWNoYW5uZWw9bnVsbH10aGlzLl9wYz1udWxsLHRoaXMuX2NoYW5uZWw9bnVsbCxlJiZ0aGlzLmVtaXQoXCJlcnJvclwiLGUpLHRoaXMuZW1pdChcImNsb3NlXCIpLHQoKX0pKX1fc2V0dXBEYXRhKGUpe2lmKCFlLmNoYW5uZWwpcmV0dXJuIHRoaXMuZGVzdHJveShsKG5ldyBFcnJvcihcIkRhdGEgY2hhbm5lbCBldmVudCBpcyBtaXNzaW5nIGBjaGFubmVsYCBwcm9wZXJ0eVwiKSxcIkVSUl9EQVRBX0NIQU5ORUxcIikpO3RoaXMuX2NoYW5uZWw9ZS5jaGFubmVsLHRoaXMuX2NoYW5uZWwuYmluYXJ5VHlwZT1cImFycmF5YnVmZmVyXCIsXCJudW1iZXJcIj09dHlwZW9mIHRoaXMuX2NoYW5uZWwuYnVmZmVyZWRBbW91bnRMb3dUaHJlc2hvbGQmJih0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50TG93VGhyZXNob2xkPXUpLHRoaXMuY2hhbm5lbE5hbWU9dGhpcy5fY2hhbm5lbC5sYWJlbCx0aGlzLl9jaGFubmVsLm9ubWVzc2FnZT1lPT57dGhpcy5fb25DaGFubmVsTWVzc2FnZShlKX0sdGhpcy5fY2hhbm5lbC5vbmJ1ZmZlcmVkYW1vdW50bG93PSgpPT57dGhpcy5fb25DaGFubmVsQnVmZmVyZWRBbW91bnRMb3coKX0sdGhpcy5fY2hhbm5lbC5vbm9wZW49KCk9Pnt0aGlzLl9vbkNoYW5uZWxPcGVuKCl9LHRoaXMuX2NoYW5uZWwub25jbG9zZT0oKT0+e3RoaXMuX29uQ2hhbm5lbENsb3NlKCl9LHRoaXMuX2NoYW5uZWwub25lcnJvcj1lPT57Y29uc3QgdD1lLmVycm9yIGluc3RhbmNlb2YgRXJyb3I/ZS5lcnJvcjpuZXcgRXJyb3IoYERhdGFjaGFubmVsIGVycm9yOiAke2UubWVzc2FnZX0gJHtlLmZpbGVuYW1lfToke2UubGluZW5vfToke2UuY29sbm99YCk7dGhpcy5kZXN0cm95KGwodCxcIkVSUl9EQVRBX0NIQU5ORUxcIikpfTtsZXQgdD0hMTt0aGlzLl9jbG9zaW5nSW50ZXJ2YWw9c2V0SW50ZXJ2YWwoKCk9Pnt0aGlzLl9jaGFubmVsJiZcImNsb3NpbmdcIj09PXRoaXMuX2NoYW5uZWwucmVhZHlTdGF0ZT8odCYmdGhpcy5fb25DaGFubmVsQ2xvc2UoKSx0PSEwKTp0PSExfSw1MDAwKX1fcmVhZCgpe31fd3JpdGUoZSx0LG4pe2lmKHRoaXMuZGVzdHJveWVkKXJldHVybiBuKGwobmV3IEVycm9yKFwiY2Fubm90IHdyaXRlIGFmdGVyIHBlZXIgaXMgZGVzdHJveWVkXCIpLFwiRVJSX0RBVEFfQ0hBTk5FTFwiKSk7aWYodGhpcy5fY29ubmVjdGVkKXt0cnl7dGhpcy5zZW5kKGUpfWNhdGNoKGUpe3JldHVybiB0aGlzLmRlc3Ryb3kobChlLFwiRVJSX0RBVEFfQ0hBTk5FTFwiKSl9dGhpcy5fY2hhbm5lbC5idWZmZXJlZEFtb3VudD51Pyh0aGlzLl9kZWJ1ZyhcInN0YXJ0IGJhY2twcmVzc3VyZTogYnVmZmVyZWRBbW91bnQgJWRcIix0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50KSx0aGlzLl9jYj1uKTpuKG51bGwpfWVsc2UgdGhpcy5fZGVidWcoXCJ3cml0ZSBiZWZvcmUgY29ubmVjdFwiKSx0aGlzLl9jaHVuaz1lLHRoaXMuX2NiPW59X29uRmluaXNoKCl7aWYoIXRoaXMuZGVzdHJveWVkKXtjb25zdCBlPSgpPT57c2V0VGltZW91dCgoKT0+dGhpcy5kZXN0cm95KCksMWUzKX07dGhpcy5fY29ubmVjdGVkP2UoKTp0aGlzLm9uY2UoXCJjb25uZWN0XCIsZSl9fV9zdGFydEljZUNvbXBsZXRlVGltZW91dCgpe3RoaXMuZGVzdHJveWVkfHx0aGlzLl9pY2VDb21wbGV0ZVRpbWVyfHwodGhpcy5fZGVidWcoXCJzdGFydGVkIGljZUNvbXBsZXRlIHRpbWVvdXRcIiksdGhpcy5faWNlQ29tcGxldGVUaW1lcj1zZXRUaW1lb3V0KCgpPT57dGhpcy5faWNlQ29tcGxldGV8fCh0aGlzLl9pY2VDb21wbGV0ZT0hMCx0aGlzLl9kZWJ1ZyhcImljZUNvbXBsZXRlIHRpbWVvdXQgY29tcGxldGVkXCIpLHRoaXMuZW1pdChcImljZVRpbWVvdXRcIiksdGhpcy5lbWl0KFwiX2ljZUNvbXBsZXRlXCIpKX0sdGhpcy5pY2VDb21wbGV0ZVRpbWVvdXQpKX1fY3JlYXRlT2ZmZXIoKXt0aGlzLmRlc3Ryb3llZHx8dGhpcy5fcGMuY3JlYXRlT2ZmZXIodGhpcy5vZmZlck9wdGlvbnMpLnRoZW4oZT0+e2lmKHRoaXMuZGVzdHJveWVkKXJldHVybjt0aGlzLnRyaWNrbGV8fHRoaXMuYWxsb3dIYWxmVHJpY2tsZXx8KGUuc2RwPW4oZS5zZHApKSxlLnNkcD10aGlzLnNkcFRyYW5zZm9ybShlLnNkcCk7Y29uc3QgdD0oKT0+e2lmKCF0aGlzLmRlc3Ryb3llZCl7Y29uc3QgdD10aGlzLl9wYy5sb2NhbERlc2NyaXB0aW9ufHxlO3RoaXMuX2RlYnVnKFwic2lnbmFsXCIpLHRoaXMuZW1pdChcInNpZ25hbFwiLHt0eXBlOnQudHlwZSxzZHA6dC5zZHB9KX19O3RoaXMuX3BjLnNldExvY2FsRGVzY3JpcHRpb24oZSkudGhlbigoKT0+e3RoaXMuX2RlYnVnKFwiY3JlYXRlT2ZmZXIgc3VjY2Vzc1wiKSx0aGlzLmRlc3Ryb3llZHx8KHRoaXMudHJpY2tsZXx8dGhpcy5faWNlQ29tcGxldGU/dCgpOnRoaXMub25jZShcIl9pY2VDb21wbGV0ZVwiLHQpKX0pLmNhdGNoKGU9Pnt0aGlzLmRlc3Ryb3kobChlLFwiRVJSX1NFVF9MT0NBTF9ERVNDUklQVElPTlwiKSl9KX0pLmNhdGNoKGU9Pnt0aGlzLmRlc3Ryb3kobChlLFwiRVJSX0NSRUFURV9PRkZFUlwiKSl9KX1fcmVxdWVzdE1pc3NpbmdUcmFuc2NlaXZlcnMoKXt0aGlzLl9wYy5nZXRUcmFuc2NlaXZlcnMmJnRoaXMuX3BjLmdldFRyYW5zY2VpdmVycygpLmZvckVhY2goZT0+e2UubWlkfHwhZS5zZW5kZXIudHJhY2t8fGUucmVxdWVzdGVkfHwoZS5yZXF1ZXN0ZWQ9ITAsdGhpcy5hZGRUcmFuc2NlaXZlcihlLnNlbmRlci50cmFjay5raW5kKSl9KX1fY3JlYXRlQW5zd2VyKCl7dGhpcy5kZXN0cm95ZWR8fHRoaXMuX3BjLmNyZWF0ZUFuc3dlcih0aGlzLmFuc3dlck9wdGlvbnMpLnRoZW4oZT0+e2lmKHRoaXMuZGVzdHJveWVkKXJldHVybjt0aGlzLnRyaWNrbGV8fHRoaXMuYWxsb3dIYWxmVHJpY2tsZXx8KGUuc2RwPW4oZS5zZHApKSxlLnNkcD10aGlzLnNkcFRyYW5zZm9ybShlLnNkcCk7Y29uc3QgdD0oKT0+e2lmKCF0aGlzLmRlc3Ryb3llZCl7Y29uc3QgdD10aGlzLl9wYy5sb2NhbERlc2NyaXB0aW9ufHxlO3RoaXMuX2RlYnVnKFwic2lnbmFsXCIpLHRoaXMuZW1pdChcInNpZ25hbFwiLHt0eXBlOnQudHlwZSxzZHA6dC5zZHB9KSx0aGlzLmluaXRpYXRvcnx8dGhpcy5fcmVxdWVzdE1pc3NpbmdUcmFuc2NlaXZlcnMoKX19O3RoaXMuX3BjLnNldExvY2FsRGVzY3JpcHRpb24oZSkudGhlbigoKT0+e3RoaXMuZGVzdHJveWVkfHwodGhpcy50cmlja2xlfHx0aGlzLl9pY2VDb21wbGV0ZT90KCk6dGhpcy5vbmNlKFwiX2ljZUNvbXBsZXRlXCIsdCkpfSkuY2F0Y2goZT0+e3RoaXMuZGVzdHJveShsKGUsXCJFUlJfU0VUX0xPQ0FMX0RFU0NSSVBUSU9OXCIpKX0pfSkuY2F0Y2goZT0+e3RoaXMuZGVzdHJveShsKGUsXCJFUlJfQ1JFQVRFX0FOU1dFUlwiKSl9KX1fb25Db25uZWN0aW9uU3RhdGVDaGFuZ2UoKXt0aGlzLmRlc3Ryb3llZHx8XCJmYWlsZWRcIj09PXRoaXMuX3BjLmNvbm5lY3Rpb25TdGF0ZSYmdGhpcy5kZXN0cm95KGwobmV3IEVycm9yKFwiQ29ubmVjdGlvbiBmYWlsZWQuXCIpLFwiRVJSX0NPTk5FQ1RJT05fRkFJTFVSRVwiKSl9X29uSWNlU3RhdGVDaGFuZ2UoKXtpZih0aGlzLmRlc3Ryb3llZClyZXR1cm47Y29uc3QgZT10aGlzLl9wYy5pY2VDb25uZWN0aW9uU3RhdGUsdD10aGlzLl9wYy5pY2VHYXRoZXJpbmdTdGF0ZTt0aGlzLl9kZWJ1ZyhcImljZVN0YXRlQ2hhbmdlIChjb25uZWN0aW9uOiAlcykgKGdhdGhlcmluZzogJXMpXCIsZSx0KSx0aGlzLmVtaXQoXCJpY2VTdGF0ZUNoYW5nZVwiLGUsdCksKFwiY29ubmVjdGVkXCI9PT1lfHxcImNvbXBsZXRlZFwiPT09ZSkmJih0aGlzLl9wY1JlYWR5PSEwLHRoaXMuX21heWJlUmVhZHkoKSksXCJmYWlsZWRcIj09PWUmJnRoaXMuZGVzdHJveShsKG5ldyBFcnJvcihcIkljZSBjb25uZWN0aW9uIGZhaWxlZC5cIiksXCJFUlJfSUNFX0NPTk5FQ1RJT05fRkFJTFVSRVwiKSksXCJjbG9zZWRcIj09PWUmJnRoaXMuZGVzdHJveShsKG5ldyBFcnJvcihcIkljZSBjb25uZWN0aW9uIGNsb3NlZC5cIiksXCJFUlJfSUNFX0NPTk5FQ1RJT05fQ0xPU0VEXCIpKX1nZXRTdGF0cyhlKXtjb25zdCB0PWU9PihcIltvYmplY3QgQXJyYXldXCI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZS52YWx1ZXMpJiZlLnZhbHVlcy5mb3JFYWNoKHQ9PntPYmplY3QuYXNzaWduKGUsdCl9KSxlKTswPT09dGhpcy5fcGMuZ2V0U3RhdHMubGVuZ3RofHx0aGlzLl9pc1JlYWN0TmF0aXZlV2VicnRjP3RoaXMuX3BjLmdldFN0YXRzKCkudGhlbihuPT57Y29uc3Qgcj1bXTtuLmZvckVhY2goZT0+e3IucHVzaCh0KGUpKX0pLGUobnVsbCxyKX0sdD0+ZSh0KSk6MDx0aGlzLl9wYy5nZXRTdGF0cy5sZW5ndGg/dGhpcy5fcGMuZ2V0U3RhdHMobj0+e2lmKHRoaXMuZGVzdHJveWVkKXJldHVybjtjb25zdCByPVtdO24ucmVzdWx0KCkuZm9yRWFjaChlPT57Y29uc3Qgbj17fTtlLm5hbWVzKCkuZm9yRWFjaCh0PT57blt0XT1lLnN0YXQodCl9KSxuLmlkPWUuaWQsbi50eXBlPWUudHlwZSxuLnRpbWVzdGFtcD1lLnRpbWVzdGFtcCxyLnB1c2godChuKSl9KSxlKG51bGwscil9LHQ9PmUodCkpOmUobnVsbCxbXSl9X21heWJlUmVhZHkoKXtpZih0aGlzLl9kZWJ1ZyhcIm1heWJlUmVhZHkgcGMgJXMgY2hhbm5lbCAlc1wiLHRoaXMuX3BjUmVhZHksdGhpcy5fY2hhbm5lbFJlYWR5KSx0aGlzLl9jb25uZWN0ZWR8fHRoaXMuX2Nvbm5lY3Rpbmd8fCF0aGlzLl9wY1JlYWR5fHwhdGhpcy5fY2hhbm5lbFJlYWR5KXJldHVybjt0aGlzLl9jb25uZWN0aW5nPSEwO2NvbnN0IGU9KCk9Pnt0aGlzLmRlc3Ryb3llZHx8dGhpcy5nZXRTdGF0cygodCxuKT0+e2lmKHRoaXMuZGVzdHJveWVkKXJldHVybjt0JiYobj1bXSk7Y29uc3Qgcj17fSxhPXt9LG89e307bGV0IGk9ITE7bi5mb3JFYWNoKGU9PnsoXCJyZW1vdGVjYW5kaWRhdGVcIj09PWUudHlwZXx8XCJyZW1vdGUtY2FuZGlkYXRlXCI9PT1lLnR5cGUpJiYocltlLmlkXT1lKSwoXCJsb2NhbGNhbmRpZGF0ZVwiPT09ZS50eXBlfHxcImxvY2FsLWNhbmRpZGF0ZVwiPT09ZS50eXBlKSYmKGFbZS5pZF09ZSksKFwiY2FuZGlkYXRlcGFpclwiPT09ZS50eXBlfHxcImNhbmRpZGF0ZS1wYWlyXCI9PT1lLnR5cGUpJiYob1tlLmlkXT1lKX0pO2NvbnN0IGQ9ZT0+e2k9ITA7bGV0IHQ9YVtlLmxvY2FsQ2FuZGlkYXRlSWRdO3QmJih0LmlwfHx0LmFkZHJlc3MpPyh0aGlzLmxvY2FsQWRkcmVzcz10LmlwfHx0LmFkZHJlc3MsdGhpcy5sb2NhbFBvcnQ9K3QucG9ydCk6dCYmdC5pcEFkZHJlc3M/KHRoaXMubG9jYWxBZGRyZXNzPXQuaXBBZGRyZXNzLHRoaXMubG9jYWxQb3J0PSt0LnBvcnROdW1iZXIpOlwic3RyaW5nXCI9PXR5cGVvZiBlLmdvb2dMb2NhbEFkZHJlc3MmJih0PWUuZ29vZ0xvY2FsQWRkcmVzcy5zcGxpdChcIjpcIiksdGhpcy5sb2NhbEFkZHJlc3M9dFswXSx0aGlzLmxvY2FsUG9ydD0rdFsxXSksdGhpcy5sb2NhbEFkZHJlc3MmJih0aGlzLmxvY2FsRmFtaWx5PXRoaXMubG9jYWxBZGRyZXNzLmluY2x1ZGVzKFwiOlwiKT9cIklQdjZcIjpcIklQdjRcIik7bGV0IG49cltlLnJlbW90ZUNhbmRpZGF0ZUlkXTtuJiYobi5pcHx8bi5hZGRyZXNzKT8odGhpcy5yZW1vdGVBZGRyZXNzPW4uaXB8fG4uYWRkcmVzcyx0aGlzLnJlbW90ZVBvcnQ9K24ucG9ydCk6biYmbi5pcEFkZHJlc3M/KHRoaXMucmVtb3RlQWRkcmVzcz1uLmlwQWRkcmVzcyx0aGlzLnJlbW90ZVBvcnQ9K24ucG9ydE51bWJlcik6XCJzdHJpbmdcIj09dHlwZW9mIGUuZ29vZ1JlbW90ZUFkZHJlc3MmJihuPWUuZ29vZ1JlbW90ZUFkZHJlc3Muc3BsaXQoXCI6XCIpLHRoaXMucmVtb3RlQWRkcmVzcz1uWzBdLHRoaXMucmVtb3RlUG9ydD0rblsxXSksdGhpcy5yZW1vdGVBZGRyZXNzJiYodGhpcy5yZW1vdGVGYW1pbHk9dGhpcy5yZW1vdGVBZGRyZXNzLmluY2x1ZGVzKFwiOlwiKT9cIklQdjZcIjpcIklQdjRcIiksdGhpcy5fZGVidWcoXCJjb25uZWN0IGxvY2FsOiAlczolcyByZW1vdGU6ICVzOiVzXCIsdGhpcy5sb2NhbEFkZHJlc3MsdGhpcy5sb2NhbFBvcnQsdGhpcy5yZW1vdGVBZGRyZXNzLHRoaXMucmVtb3RlUG9ydCl9O2lmKG4uZm9yRWFjaChlPT57XCJ0cmFuc3BvcnRcIj09PWUudHlwZSYmZS5zZWxlY3RlZENhbmRpZGF0ZVBhaXJJZCYmZChvW2Uuc2VsZWN0ZWRDYW5kaWRhdGVQYWlySWRdKSwoXCJnb29nQ2FuZGlkYXRlUGFpclwiPT09ZS50eXBlJiZcInRydWVcIj09PWUuZ29vZ0FjdGl2ZUNvbm5lY3Rpb258fChcImNhbmRpZGF0ZXBhaXJcIj09PWUudHlwZXx8XCJjYW5kaWRhdGUtcGFpclwiPT09ZS50eXBlKSYmZS5zZWxlY3RlZCkmJmQoZSl9KSwhaSYmKCFPYmplY3Qua2V5cyhvKS5sZW5ndGh8fE9iamVjdC5rZXlzKGEpLmxlbmd0aCkpcmV0dXJuIHZvaWQgc2V0VGltZW91dChlLDEwMCk7aWYodGhpcy5fY29ubmVjdGluZz0hMSx0aGlzLl9jb25uZWN0ZWQ9ITAsdGhpcy5fY2h1bmspe3RyeXt0aGlzLnNlbmQodGhpcy5fY2h1bmspfWNhdGNoKGUpe3JldHVybiB0aGlzLmRlc3Ryb3kobChlLFwiRVJSX0RBVEFfQ0hBTk5FTFwiKSl9dGhpcy5fY2h1bms9bnVsbCx0aGlzLl9kZWJ1ZyhcInNlbnQgY2h1bmsgZnJvbSBcXFwid3JpdGUgYmVmb3JlIGNvbm5lY3RcXFwiXCIpO2NvbnN0IGU9dGhpcy5fY2I7dGhpcy5fY2I9bnVsbCxlKG51bGwpfVwibnVtYmVyXCIhPXR5cGVvZiB0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50TG93VGhyZXNob2xkJiYodGhpcy5faW50ZXJ2YWw9c2V0SW50ZXJ2YWwoKCk9PnRoaXMuX29uSW50ZXJ2YWwoKSwxNTApLHRoaXMuX2ludGVydmFsLnVucmVmJiZ0aGlzLl9pbnRlcnZhbC51bnJlZigpKSx0aGlzLl9kZWJ1ZyhcImNvbm5lY3RcIiksdGhpcy5lbWl0KFwiY29ubmVjdFwiKX0pfTtlKCl9X29uSW50ZXJ2YWwoKXt0aGlzLl9jYiYmdGhpcy5fY2hhbm5lbCYmISh0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50PnUpJiZ0aGlzLl9vbkNoYW5uZWxCdWZmZXJlZEFtb3VudExvdygpfV9vblNpZ25hbGluZ1N0YXRlQ2hhbmdlKCl7dGhpcy5kZXN0cm95ZWR8fChcInN0YWJsZVwiPT09dGhpcy5fcGMuc2lnbmFsaW5nU3RhdGUmJih0aGlzLl9pc05lZ290aWF0aW5nPSExLHRoaXMuX2RlYnVnKFwiZmx1c2hpbmcgc2VuZGVyIHF1ZXVlXCIsdGhpcy5fc2VuZGVyc0F3YWl0aW5nU3RhYmxlKSx0aGlzLl9zZW5kZXJzQXdhaXRpbmdTdGFibGUuZm9yRWFjaChlPT57dGhpcy5fcGMucmVtb3ZlVHJhY2soZSksdGhpcy5fcXVldWVkTmVnb3RpYXRpb249ITB9KSx0aGlzLl9zZW5kZXJzQXdhaXRpbmdTdGFibGU9W10sdGhpcy5fcXVldWVkTmVnb3RpYXRpb24/KHRoaXMuX2RlYnVnKFwiZmx1c2hpbmcgbmVnb3RpYXRpb24gcXVldWVcIiksdGhpcy5fcXVldWVkTmVnb3RpYXRpb249ITEsdGhpcy5fbmVlZHNOZWdvdGlhdGlvbigpKToodGhpcy5fZGVidWcoXCJuZWdvdGlhdGVkXCIpLHRoaXMuZW1pdChcIm5lZ290aWF0ZWRcIikpKSx0aGlzLl9kZWJ1ZyhcInNpZ25hbGluZ1N0YXRlQ2hhbmdlICVzXCIsdGhpcy5fcGMuc2lnbmFsaW5nU3RhdGUpLHRoaXMuZW1pdChcInNpZ25hbGluZ1N0YXRlQ2hhbmdlXCIsdGhpcy5fcGMuc2lnbmFsaW5nU3RhdGUpKX1fb25JY2VDYW5kaWRhdGUoZSl7dGhpcy5kZXN0cm95ZWR8fChlLmNhbmRpZGF0ZSYmdGhpcy50cmlja2xlP3RoaXMuZW1pdChcInNpZ25hbFwiLHt0eXBlOlwiY2FuZGlkYXRlXCIsY2FuZGlkYXRlOntjYW5kaWRhdGU6ZS5jYW5kaWRhdGUuY2FuZGlkYXRlLHNkcE1MaW5lSW5kZXg6ZS5jYW5kaWRhdGUuc2RwTUxpbmVJbmRleCxzZHBNaWQ6ZS5jYW5kaWRhdGUuc2RwTWlkfX0pOiFlLmNhbmRpZGF0ZSYmIXRoaXMuX2ljZUNvbXBsZXRlJiYodGhpcy5faWNlQ29tcGxldGU9ITAsdGhpcy5lbWl0KFwiX2ljZUNvbXBsZXRlXCIpKSxlLmNhbmRpZGF0ZSYmdGhpcy5fc3RhcnRJY2VDb21wbGV0ZVRpbWVvdXQoKSl9X29uQ2hhbm5lbE1lc3NhZ2UoZSl7aWYodGhpcy5kZXN0cm95ZWQpcmV0dXJuO2xldCB0PWUuZGF0YTt0IGluc3RhbmNlb2YgQXJyYXlCdWZmZXImJih0PWMuZnJvbSh0KSksdGhpcy5wdXNoKHQpfV9vbkNoYW5uZWxCdWZmZXJlZEFtb3VudExvdygpe2lmKCF0aGlzLmRlc3Ryb3llZCYmdGhpcy5fY2Ipe3RoaXMuX2RlYnVnKFwiZW5kaW5nIGJhY2twcmVzc3VyZTogYnVmZmVyZWRBbW91bnQgJWRcIix0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50KTtjb25zdCBlPXRoaXMuX2NiO3RoaXMuX2NiPW51bGwsZShudWxsKX19X29uQ2hhbm5lbE9wZW4oKXt0aGlzLl9jb25uZWN0ZWR8fHRoaXMuZGVzdHJveWVkfHwodGhpcy5fZGVidWcoXCJvbiBjaGFubmVsIG9wZW5cIiksdGhpcy5fY2hhbm5lbFJlYWR5PSEwLHRoaXMuX21heWJlUmVhZHkoKSl9X29uQ2hhbm5lbENsb3NlKCl7dGhpcy5kZXN0cm95ZWR8fCh0aGlzLl9kZWJ1ZyhcIm9uIGNoYW5uZWwgY2xvc2VcIiksdGhpcy5kZXN0cm95KCkpfV9vblRyYWNrKGUpe3RoaXMuZGVzdHJveWVkfHxlLnN0cmVhbXMuZm9yRWFjaCh0PT57dGhpcy5fZGVidWcoXCJvbiB0cmFja1wiKSx0aGlzLmVtaXQoXCJ0cmFja1wiLGUudHJhY2ssdCksdGhpcy5fcmVtb3RlVHJhY2tzLnB1c2goe3RyYWNrOmUudHJhY2ssc3RyZWFtOnR9KSx0aGlzLl9yZW1vdGVTdHJlYW1zLnNvbWUoZT0+ZS5pZD09PXQuaWQpfHwodGhpcy5fcmVtb3RlU3RyZWFtcy5wdXNoKHQpLHMoKCk9Pnt0aGlzLl9kZWJ1ZyhcIm9uIHN0cmVhbVwiKSx0aGlzLmVtaXQoXCJzdHJlYW1cIix0KX0pKX0pfV9kZWJ1Zygpe2NvbnN0IGU9W10uc2xpY2UuY2FsbChhcmd1bWVudHMpO2VbMF09XCJbXCIrdGhpcy5faWQrXCJdIFwiK2VbMF0sYS5hcHBseShudWxsLGUpfX1wLldFQlJUQ19TVVBQT1JUPSEhbygpLHAuY29uZmlnPXtpY2VTZXJ2ZXJzOlt7dXJsczpbXCJzdHVuOnN0dW4ubC5nb29nbGUuY29tOjE5MzAyXCIsXCJzdHVuOmdsb2JhbC5zdHVuLnR3aWxpby5jb206MzQ3OFwiXX1dLHNkcFNlbWFudGljczpcInVuaWZpZWQtcGxhblwifSxwLmNoYW5uZWxDb25maWc9e30sdC5leHBvcnRzPXB9LHtidWZmZXI6MyxkZWJ1Zzo0LFwiZXJyLWNvZGVcIjo2LFwiZ2V0LWJyb3dzZXItcnRjXCI6OCxcInF1ZXVlLW1pY3JvdGFza1wiOjEzLHJhbmRvbWJ5dGVzOjE0LFwicmVhZGFibGUtc3RyZWFtXCI6Mjl9XX0se30sW10pKFwiL1wiKX0pOyIsICIvKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCBrZXktdmFsdWUgc3RvcmVzLlxuICpcbiAqIEBtb2R1bGUgbWFwXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUgS1xuICogQHRlbXBsYXRlIFZcbiAqIEB0eXBlZGVmIHtNYXA8SyxWPn0gR2xvYmFsTWFwXG4gKi9cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IE1hcCBpbnN0YW5jZS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEByZXR1cm4ge01hcDxhbnksIGFueT59XG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGUgPSAoKSA9PiBuZXcgTWFwKClcblxuLyoqXG4gKiBDb3B5IGEgTWFwIG9iamVjdCBpbnRvIGEgZnJlc2ggTWFwIG9iamVjdC5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSBLLFZcbiAqIEBwYXJhbSB7TWFwPEssVj59IG1cbiAqIEByZXR1cm4ge01hcDxLLFY+fVxuICovXG5leHBvcnQgY29uc3QgY29weSA9IG0gPT4ge1xuICBjb25zdCByID0gY3JlYXRlKClcbiAgbS5mb3JFYWNoKCh2LCBrKSA9PiB7IHIuc2V0KGssIHYpIH0pXG4gIHJldHVybiByXG59XG5cbi8qKlxuICogR2V0IG1hcCBwcm9wZXJ0eS4gQ3JlYXRlIFQgaWYgcHJvcGVydHkgaXMgdW5kZWZpbmVkIGFuZCBzZXQgVCBvbiBtYXAuXG4gKlxuICogYGBganNcbiAqIGNvbnN0IGxpc3RlbmVycyA9IG1hcC5zZXRJZlVuZGVmaW5lZChldmVudHMsICdldmVudE5hbWUnLCBzZXQuY3JlYXRlKVxuICogbGlzdGVuZXJzLmFkZChsaXN0ZW5lcilcbiAqIGBgYFxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIHtNYXA8YW55LCBhbnk+fSBNQVBcbiAqIEB0ZW1wbGF0ZSB7TUFQIGV4dGVuZHMgTWFwPGFueSxpbmZlciBWPiA/IGZ1bmN0aW9uKCk6ViA6IHVua25vd259IENGXG4gKiBAcGFyYW0ge01BUH0gbWFwXG4gKiBAcGFyYW0ge01BUCBleHRlbmRzIE1hcDxpbmZlciBLLGFueT4gPyBLIDogdW5rbm93bn0ga2V5XG4gKiBAcGFyYW0ge0NGfSBjcmVhdGVUXG4gKiBAcmV0dXJuIHtSZXR1cm5UeXBlPENGPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHNldElmVW5kZWZpbmVkID0gKG1hcCwga2V5LCBjcmVhdGVUKSA9PiB7XG4gIGxldCBzZXQgPSBtYXAuZ2V0KGtleSlcbiAgaWYgKHNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbWFwLnNldChrZXksIHNldCA9IGNyZWF0ZVQoKSlcbiAgfVxuICByZXR1cm4gc2V0XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBBcnJheSBhbmQgcG9wdWxhdGVzIGl0IHdpdGggdGhlIGNvbnRlbnQgb2YgYWxsIGtleS12YWx1ZSBwYWlycyB1c2luZyB0aGUgYGYodmFsdWUsIGtleSlgIGZ1bmN0aW9uLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIEtcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAdGVtcGxhdGUgUlxuICogQHBhcmFtIHtNYXA8SyxWPn0gbVxuICogQHBhcmFtIHtmdW5jdGlvbihWLEspOlJ9IGZcbiAqIEByZXR1cm4ge0FycmF5PFI+fVxuICovXG5leHBvcnQgY29uc3QgbWFwID0gKG0sIGYpID0+IHtcbiAgY29uc3QgcmVzID0gW11cbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgbSkge1xuICAgIHJlcy5wdXNoKGYodmFsdWUsIGtleSkpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG4vKipcbiAqIFRlc3RzIHdoZXRoZXIgYW55IGtleS12YWx1ZSBwYWlycyBwYXNzIHRoZSB0ZXN0IGltcGxlbWVudGVkIGJ5IGBmKHZhbHVlLCBrZXkpYC5cbiAqXG4gKiBAdG9kbyBzaG91bGQgcmVuYW1lIHRvIHNvbWUgLSBzaW1pbGFybHkgdG8gQXJyYXkuc29tZVxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIEtcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge01hcDxLLFY+fSBtXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFYsSyk6Ym9vbGVhbn0gZlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGFueSA9IChtLCBmKSA9PiB7XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIG0pIHtcbiAgICBpZiAoZih2YWx1ZSwga2V5KSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogVGVzdHMgd2hldGhlciBhbGwga2V5LXZhbHVlIHBhaXJzIHBhc3MgdGhlIHRlc3QgaW1wbGVtZW50ZWQgYnkgYGYodmFsdWUsIGtleSlgLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIEtcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge01hcDxLLFY+fSBtXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFYsSyk6Ym9vbGVhbn0gZlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGFsbCA9IChtLCBmKSA9PiB7XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIG0pIHtcbiAgICBpZiAoIWYodmFsdWUsIGtleSkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8qKlxuICogVXRpbGl0eSBtb2R1bGUgdG8gd29yayB3aXRoIHNldHMuXG4gKlxuICogQG1vZHVsZSBzZXRcbiAqL1xuXG5leHBvcnQgY29uc3QgY3JlYXRlID0gKCkgPT4gbmV3IFNldCgpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7U2V0PFQ+fSBzZXRcbiAqIEByZXR1cm4ge0FycmF5PFQ+fVxuICovXG5leHBvcnQgY29uc3QgdG9BcnJheSA9IHNldCA9PiBBcnJheS5mcm9tKHNldClcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtTZXQ8VD59IHNldFxuICogQHJldHVybiB7VHx1bmRlZmluZWR9XG4gKi9cbmV4cG9ydCBjb25zdCBmaXJzdCA9IHNldCA9PiBzZXQudmFsdWVzKCkubmV4dCgpLnZhbHVlXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7SXRlcmFibGU8VD59IGVudHJpZXNcbiAqIEByZXR1cm4ge1NldDxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGZyb20gPSBlbnRyaWVzID0+IG5ldyBTZXQoZW50cmllcylcbiIsICIvKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCBBcnJheXMuXG4gKlxuICogQG1vZHVsZSBhcnJheVxuICovXG5cbmltcG9ydCAqIGFzIHNldCBmcm9tICcuL3NldC5qcydcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gVGhlIGVsZW1lbnQgbXVzdCBleGlzdFxuICpcbiAqIEB0ZW1wbGF0ZSBMXG4gKiBAcGFyYW0ge0FycmF5TGlrZTxMPn0gYXJyXG4gKiBAcmV0dXJuIHtMfVxuICovXG5leHBvcnQgY29uc3QgbGFzdCA9IGFyciA9PiBhcnJbYXJyLmxlbmd0aCAtIDFdXG5cbi8qKlxuICogQHRlbXBsYXRlIENcbiAqIEByZXR1cm4ge0FycmF5PEM+fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gKCkgPT4gLyoqIEB0eXBlIHtBcnJheTxDPn0gKi8gKFtdKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBEXG4gKiBAcGFyYW0ge0FycmF5PEQ+fSBhXG4gKiBAcmV0dXJuIHtBcnJheTxEPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNvcHkgPSBhID0+IC8qKiBAdHlwZSB7QXJyYXk8RD59ICovIChhLnNsaWNlKCkpXG5cbi8qKlxuICogQXBwZW5kIGVsZW1lbnRzIGZyb20gc3JjIHRvIGRlc3RcbiAqXG4gKiBAdGVtcGxhdGUgTVxuICogQHBhcmFtIHtBcnJheTxNPn0gZGVzdFxuICogQHBhcmFtIHtBcnJheTxNPn0gc3JjXG4gKi9cbmV4cG9ydCBjb25zdCBhcHBlbmRUbyA9IChkZXN0LCBzcmMpID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcmMubGVuZ3RoOyBpKyspIHtcbiAgICBkZXN0LnB1c2goc3JjW2ldKVxuICB9XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBzb21ldGhpbmcgYXJyYXktbGlrZSB0byBhbiBhY3R1YWwgQXJyYXkuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtBcnJheUxpa2U8VD58SXRlcmFibGU8VD59IGFycmF5bGlrZVxuICogQHJldHVybiB7VH1cbiAqL1xuZXhwb3J0IGNvbnN0IGZyb20gPSBBcnJheS5mcm9tXG5cbi8qKlxuICogVHJ1ZSBpZmYgY29uZGl0aW9uIGhvbGRzIG9uIGV2ZXJ5IGVsZW1lbnQgaW4gdGhlIEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIHtBcnJheUxpa2U8YW55Pn0gQVJSXG4gKlxuICogQHBhcmFtIHtBUlJ9IGFyclxuICogQHBhcmFtIHtBUlIgZXh0ZW5kcyBBcnJheUxpa2U8aW5mZXIgUz4gPyAoKHZhbHVlOlMsIGluZGV4Om51bWJlciwgYXJyOkFSUikgPT4gYm9vbGVhbikgOiBhbnl9IGZcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBldmVyeSA9IChhcnIsIGYpID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIWYoYXJyW2ldLCBpLCBhcnIpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBUcnVlIGlmZiBjb25kaXRpb24gaG9sZHMgb24gc29tZSBlbGVtZW50IGluIHRoZSBBcnJheS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSB7QXJyYXlMaWtlPGFueT59IEFSUlxuICpcbiAqIEBwYXJhbSB7QVJSfSBhcnJcbiAqIEBwYXJhbSB7QVJSIGV4dGVuZHMgQXJyYXlMaWtlPGluZmVyIFM+ID8gKCh2YWx1ZTpTLCBpbmRleDpudW1iZXIsIGFycjpBUlIpID0+IGJvb2xlYW4pIDogbmV2ZXJ9IGZcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBzb21lID0gKGFyciwgZikgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChmKGFycltpXSwgaSwgYXJyKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogQHRlbXBsYXRlIEVMRU1cbiAqXG4gKiBAcGFyYW0ge0FycmF5TGlrZTxFTEVNPn0gYVxuICogQHBhcmFtIHtBcnJheUxpa2U8RUxFTT59IGJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBlcXVhbEZsYXQgPSAoYSwgYikgPT4gYS5sZW5ndGggPT09IGIubGVuZ3RoICYmIGV2ZXJ5KGEsIChpdGVtLCBpbmRleCkgPT4gaXRlbSA9PT0gYltpbmRleF0pXG5cbi8qKlxuICogQHRlbXBsYXRlIEVMRU1cbiAqIEBwYXJhbSB7QXJyYXk8QXJyYXk8RUxFTT4+fSBhcnJcbiAqIEByZXR1cm4ge0FycmF5PEVMRU0+fVxuICovXG5leHBvcnQgY29uc3QgZmxhdHRlbiA9IGFyciA9PiBmb2xkKGFyciwgLyoqIEB0eXBlIHtBcnJheTxFTEVNPn0gKi8gKFtdKSwgKGFjYywgdmFsKSA9PiBhY2MuY29uY2F0KHZhbCkpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24obnVtYmVyLCBBcnJheTxUPik6VH0gZlxuICogQHJldHVybiB7QXJyYXk8VD59XG4gKi9cbmV4cG9ydCBjb25zdCB1bmZvbGQgPSAobGVuLCBmKSA9PiB7XG4gIGNvbnN0IGFycmF5ID0gbmV3IEFycmF5KGxlbilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGFycmF5W2ldID0gZihpLCBhcnJheSlcbiAgfVxuICByZXR1cm4gYXJyYXlcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHRlbXBsYXRlIFJFU1VMVFxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyXG4gKiBAcGFyYW0ge1JFU1VMVH0gc2VlZFxuICogQHBhcmFtIHtmdW5jdGlvbihSRVNVTFQsIFQsIG51bWJlcik6UkVTVUxUfSBmb2xkZXJcbiAqL1xuZXhwb3J0IGNvbnN0IGZvbGQgPSAoYXJyLCBzZWVkLCBmb2xkZXIpID0+IGFyci5yZWR1Y2UoZm9sZGVyLCBzZWVkKVxuXG5leHBvcnQgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXlcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyXG4gKiBAcmV0dXJuIHtBcnJheTxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHVuaXF1ZSA9IGFyciA9PiBmcm9tKHNldC5mcm9tKGFycikpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEB0ZW1wbGF0ZSBNXG4gKiBAcGFyYW0ge0FycmF5TGlrZTxUPn0gYXJyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFQpOk19IG1hcHBlclxuICogQHJldHVybiB7QXJyYXk8VD59XG4gKi9cbmV4cG9ydCBjb25zdCB1bmlxdWVCeSA9IChhcnIsIG1hcHBlcikgPT4ge1xuICAvKipcbiAgICogQHR5cGUge1NldDxNPn1cbiAgICovXG4gIGNvbnN0IGhhcHBlbmVkID0gc2V0LmNyZWF0ZSgpXG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXk8VD59XG4gICAqL1xuICBjb25zdCByZXN1bHQgPSBbXVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGVsID0gYXJyW2ldXG4gICAgY29uc3QgbWFwcGVkID0gbWFwcGVyKGVsKVxuICAgIGlmICghaGFwcGVuZWQuaGFzKG1hcHBlZCkpIHtcbiAgICAgIGhhcHBlbmVkLmFkZChtYXBwZWQpXG4gICAgICByZXN1bHQucHVzaChlbClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7QXJyYXlMaWtlPGFueT59IEFSUlxuICogQHRlbXBsYXRlIHtmdW5jdGlvbihBUlIgZXh0ZW5kcyBBcnJheUxpa2U8aW5mZXIgVD4gPyBUIDogbmV2ZXIsIG51bWJlciwgQVJSKTphbnl9IE1BUFBFUlxuICogQHBhcmFtIHtBUlJ9IGFyclxuICogQHBhcmFtIHtNQVBQRVJ9IG1hcHBlclxuICogQHJldHVybiB7QXJyYXk8TUFQUEVSIGV4dGVuZHMgZnVuY3Rpb24oLi4uYW55KTogaW5mZXIgTSA/IE0gOiBuZXZlcj59XG4gKi9cbmV4cG9ydCBjb25zdCBtYXAgPSAoYXJyLCBtYXBwZXIpID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgY29uc3QgcmVzID0gQXJyYXkoYXJyLmxlbmd0aClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICByZXNbaV0gPSBtYXBwZXIoLyoqIEB0eXBlIHthbnl9ICovIChhcnJbaV0pLCBpLCAvKiogQHR5cGUge2FueX0gKi8gKGFycikpXG4gIH1cbiAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAocmVzKVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gYnViYmxlLXNvcnRzIGEgc2luZ2xlIGl0ZW0gdG8gdGhlIGNvcnJlY3QgcG9zaXRpb24uIFRoZSBzb3J0IGhhcHBlbnMgaW4tcGxhY2UgYW5kXG4gKiBtaWdodCBiZSB1c2VmdWwgdG8gZW5zdXJlIHRoYXQgYSBzaW5nbGUgaXRlbSBpcyBhdCB0aGUgY29ycmVjdCBwb3NpdGlvbiBpbiBhbiBvdGhlcndpc2Ugc29ydGVkXG4gKiBhcnJheS5cbiAqXG4gKiBAZXhhbXBsZVxuICogIGNvbnN0IGFyciA9IFszLCAyLCA1XVxuICogIGFyci5zb3J0KChhLCBiKSA9PiBhIC0gYilcbiAqICBhcnIgLy8gPT4gWzIsIDMsIDVdXG4gKiAgYXJyLnNwbGljZSgxLCAwLCA3KVxuICogIGFycmF5LmJ1YmJsZVNvcnRJdGVtKGFyciwgMSwgKGEsIGIpID0+IGEgLSBiKVxuICogIGFyciAvLyA9PiBbMiwgMywgNSwgN11cbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyXG4gKiBAcGFyYW0ge251bWJlcn0gaVxuICogQHBhcmFtIHsoYTpULGI6VCkgPT4gbnVtYmVyfSBjb21wYXJlRm5cbiAqL1xuZXhwb3J0IGNvbnN0IGJ1YmJsZXNvcnRJdGVtID0gKGFyciwgaSwgY29tcGFyZUZuKSA9PiB7XG4gIGNvbnN0IG4gPSBhcnJbaV1cbiAgbGV0IGogPSBpXG4gIC8vIHRyeSB0byBzb3J0IHRvIHRoZSByaWdodFxuICB3aGlsZSAoaiArIDEgPCBhcnIubGVuZ3RoICYmIGNvbXBhcmVGbihuLCBhcnJbaiArIDFdKSA+IDApIHtcbiAgICBhcnJbal0gPSBhcnJbaiArIDFdXG4gICAgYXJyWysral0gPSBuXG4gIH1cbiAgaWYgKGkgPT09IGogJiYgaiA+IDApIHsgLy8gbm8gY2hhbmdlIHlldFxuICAgIC8vIHNvcnQgdG8gdGhlIGxlZnRcbiAgICB3aGlsZSAoaiA+IDAgJiYgY29tcGFyZUZuKGFycltqIC0gMV0sIG4pID4gMCkge1xuICAgICAgYXJyW2pdID0gYXJyW2ogLSAxXVxuICAgICAgYXJyWy0tal0gPSBuXG4gICAgfVxuICB9XG4gIHJldHVybiBqXG59XG4iLCAiLyoqXG4gKiBPYnNlcnZhYmxlIGNsYXNzIHByb3RvdHlwZS5cbiAqXG4gKiBAbW9kdWxlIG9ic2VydmFibGVcbiAqL1xuXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnLi9tYXAuanMnXG5pbXBvcnQgKiBhcyBzZXQgZnJvbSAnLi9zZXQuanMnXG5pbXBvcnQgKiBhcyBhcnJheSBmcm9tICcuL2FycmF5LmpzJ1xuXG4vKipcbiAqIEhhbmRsZXMgbmFtZWQgZXZlbnRzLlxuICogQGV4cGVyaW1lbnRhbFxuICpcbiAqIFRoaXMgaXMgYmFzaWNhbGx5IGEgKGJldHRlciB0eXBlZCkgZHVwbGljYXRlIG9mIE9ic2VydmFibGUsIHdoaWNoIHdpbGwgcmVwbGFjZSBPYnNlcnZhYmxlIGluIHRoZVxuICogbmV4dCByZWxlYXNlLlxuICpcbiAqIEB0ZW1wbGF0ZSB7e1trZXkgaW4ga2V5b2YgRVZFTlRTXTogZnVuY3Rpb24oLi4uYW55KTp2b2lkfX0gRVZFTlRTXG4gKi9cbmV4cG9ydCBjbGFzcyBPYnNlcnZhYmxlVjIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogU29tZSBkZXNjLlxuICAgICAqIEB0eXBlIHtNYXA8c3RyaW5nLCBTZXQ8YW55Pj59XG4gICAgICovXG4gICAgdGhpcy5fb2JzZXJ2ZXJzID0gbWFwLmNyZWF0ZSgpXG4gIH1cblxuICAvKipcbiAgICogQHRlbXBsYXRlIHtrZXlvZiBFVkVOVFMgJiBzdHJpbmd9IE5BTUVcbiAgICogQHBhcmFtIHtOQU1FfSBuYW1lXG4gICAqIEBwYXJhbSB7RVZFTlRTW05BTUVdfSBmXG4gICAqL1xuICBvbiAobmFtZSwgZikge1xuICAgIG1hcC5zZXRJZlVuZGVmaW5lZCh0aGlzLl9vYnNlcnZlcnMsIC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAobmFtZSksIHNldC5jcmVhdGUpLmFkZChmKVxuICAgIHJldHVybiBmXG4gIH1cblxuICAvKipcbiAgICogQHRlbXBsYXRlIHtrZXlvZiBFVkVOVFMgJiBzdHJpbmd9IE5BTUVcbiAgICogQHBhcmFtIHtOQU1FfSBuYW1lXG4gICAqIEBwYXJhbSB7RVZFTlRTW05BTUVdfSBmXG4gICAqL1xuICBvbmNlIChuYW1lLCBmKSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtICB7Li4uYW55fSBhcmdzXG4gICAgICovXG4gICAgY29uc3QgX2YgPSAoLi4uYXJncykgPT4ge1xuICAgICAgdGhpcy5vZmYobmFtZSwgLyoqIEB0eXBlIHthbnl9ICovIChfZikpXG4gICAgICBmKC4uLmFyZ3MpXG4gICAgfVxuICAgIHRoaXMub24obmFtZSwgLyoqIEB0eXBlIHthbnl9ICovIChfZikpXG4gIH1cblxuICAvKipcbiAgICogQHRlbXBsYXRlIHtrZXlvZiBFVkVOVFMgJiBzdHJpbmd9IE5BTUVcbiAgICogQHBhcmFtIHtOQU1FfSBuYW1lXG4gICAqIEBwYXJhbSB7RVZFTlRTW05BTUVdfSBmXG4gICAqL1xuICBvZmYgKG5hbWUsIGYpIHtcbiAgICBjb25zdCBvYnNlcnZlcnMgPSB0aGlzLl9vYnNlcnZlcnMuZ2V0KG5hbWUpXG4gICAgaWYgKG9ic2VydmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBvYnNlcnZlcnMuZGVsZXRlKGYpXG4gICAgICBpZiAob2JzZXJ2ZXJzLnNpemUgPT09IDApIHtcbiAgICAgICAgdGhpcy5fb2JzZXJ2ZXJzLmRlbGV0ZShuYW1lKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0IGEgbmFtZWQgZXZlbnQuIEFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycyB0aGF0IGxpc3RlbiB0byB0aGVcbiAgICogc3BlY2lmaWVkIG5hbWUgd2lsbCByZWNlaXZlIHRoZSBldmVudC5cbiAgICpcbiAgICogQHRvZG8gVGhpcyBzaG91bGQgY2F0Y2ggZXhjZXB0aW9uc1xuICAgKlxuICAgKiBAdGVtcGxhdGUge2tleW9mIEVWRU5UUyAmIHN0cmluZ30gTkFNRVxuICAgKiBAcGFyYW0ge05BTUV9IG5hbWUgVGhlIGV2ZW50IG5hbWUuXG4gICAqIEBwYXJhbSB7UGFyYW1ldGVyczxFVkVOVFNbTkFNRV0+fSBhcmdzIFRoZSBhcmd1bWVudHMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZXZlbnQgbGlzdGVuZXIuXG4gICAqL1xuICBlbWl0IChuYW1lLCBhcmdzKSB7XG4gICAgLy8gY29weSBhbGwgbGlzdGVuZXJzIHRvIGFuIGFycmF5IGZpcnN0IHRvIG1ha2Ugc3VyZSB0aGF0IG5vIGV2ZW50IGlzIGVtaXR0ZWQgdG8gbGlzdGVuZXJzIHRoYXQgYXJlIHN1YnNjcmliZWQgd2hpbGUgdGhlIGV2ZW50IGhhbmRsZXIgaXMgY2FsbGVkLlxuICAgIHJldHVybiBhcnJheS5mcm9tKCh0aGlzLl9vYnNlcnZlcnMuZ2V0KG5hbWUpIHx8IG1hcC5jcmVhdGUoKSkudmFsdWVzKCkpLmZvckVhY2goZiA9PiBmKC4uLmFyZ3MpKVxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgdGhpcy5fb2JzZXJ2ZXJzID0gbWFwLmNyZWF0ZSgpXG4gIH1cbn1cblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIEhhbmRsZXMgbmFtZWQgZXZlbnRzLlxuICpcbiAqIEBkZXByZWNhdGVkXG4gKiBAdGVtcGxhdGUgTlxuICovXG5leHBvcnQgY2xhc3MgT2JzZXJ2YWJsZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICAvKipcbiAgICAgKiBTb21lIGRlc2MuXG4gICAgICogQHR5cGUge01hcDxOLCBhbnk+fVxuICAgICAqL1xuICAgIHRoaXMuX29ic2VydmVycyA9IG1hcC5jcmVhdGUoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Tn0gbmFtZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmXG4gICAqL1xuICBvbiAobmFtZSwgZikge1xuICAgIG1hcC5zZXRJZlVuZGVmaW5lZCh0aGlzLl9vYnNlcnZlcnMsIG5hbWUsIHNldC5jcmVhdGUpLmFkZChmKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Tn0gbmFtZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmXG4gICAqL1xuICBvbmNlIChuYW1lLCBmKSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtICB7Li4uYW55fSBhcmdzXG4gICAgICovXG4gICAgY29uc3QgX2YgPSAoLi4uYXJncykgPT4ge1xuICAgICAgdGhpcy5vZmYobmFtZSwgX2YpXG4gICAgICBmKC4uLmFyZ3MpXG4gICAgfVxuICAgIHRoaXMub24obmFtZSwgX2YpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtOfSBuYW1lXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGZcbiAgICovXG4gIG9mZiAobmFtZSwgZikge1xuICAgIGNvbnN0IG9ic2VydmVycyA9IHRoaXMuX29ic2VydmVycy5nZXQobmFtZSlcbiAgICBpZiAob2JzZXJ2ZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG9ic2VydmVycy5kZWxldGUoZilcbiAgICAgIGlmIChvYnNlcnZlcnMuc2l6ZSA9PT0gMCkge1xuICAgICAgICB0aGlzLl9vYnNlcnZlcnMuZGVsZXRlKG5hbWUpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVtaXQgYSBuYW1lZCBldmVudC4gQWxsIHJlZ2lzdGVyZWQgZXZlbnQgbGlzdGVuZXJzIHRoYXQgbGlzdGVuIHRvIHRoZVxuICAgKiBzcGVjaWZpZWQgbmFtZSB3aWxsIHJlY2VpdmUgdGhlIGV2ZW50LlxuICAgKlxuICAgKiBAdG9kbyBUaGlzIHNob3VsZCBjYXRjaCBleGNlcHRpb25zXG4gICAqXG4gICAqIEBwYXJhbSB7Tn0gbmFtZSBUaGUgZXZlbnQgbmFtZS5cbiAgICogQHBhcmFtIHtBcnJheTxhbnk+fSBhcmdzIFRoZSBhcmd1bWVudHMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZXZlbnQgbGlzdGVuZXIuXG4gICAqL1xuICBlbWl0IChuYW1lLCBhcmdzKSB7XG4gICAgLy8gY29weSBhbGwgbGlzdGVuZXJzIHRvIGFuIGFycmF5IGZpcnN0IHRvIG1ha2Ugc3VyZSB0aGF0IG5vIGV2ZW50IGlzIGVtaXR0ZWQgdG8gbGlzdGVuZXJzIHRoYXQgYXJlIHN1YnNjcmliZWQgd2hpbGUgdGhlIGV2ZW50IGhhbmRsZXIgaXMgY2FsbGVkLlxuICAgIHJldHVybiBhcnJheS5mcm9tKCh0aGlzLl9vYnNlcnZlcnMuZ2V0KG5hbWUpIHx8IG1hcC5jcmVhdGUoKSkudmFsdWVzKCkpLmZvckVhY2goZiA9PiBmKC4uLmFyZ3MpKVxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgdGhpcy5fb2JzZXJ2ZXJzID0gbWFwLmNyZWF0ZSgpXG4gIH1cbn1cbi8qIGM4IGlnbm9yZSBlbmQgKi9cbiIsICIvKipcbiAqIENvbW1vbiBNYXRoIGV4cHJlc3Npb25zLlxuICpcbiAqIEBtb2R1bGUgbWF0aFxuICovXG5cbmV4cG9ydCBjb25zdCBmbG9vciA9IE1hdGguZmxvb3JcbmV4cG9ydCBjb25zdCBjZWlsID0gTWF0aC5jZWlsXG5leHBvcnQgY29uc3QgYWJzID0gTWF0aC5hYnNcbmV4cG9ydCBjb25zdCBpbXVsID0gTWF0aC5pbXVsXG5leHBvcnQgY29uc3Qgcm91bmQgPSBNYXRoLnJvdW5kXG5leHBvcnQgY29uc3QgbG9nMTAgPSBNYXRoLmxvZzEwXG5leHBvcnQgY29uc3QgbG9nMiA9IE1hdGgubG9nMlxuZXhwb3J0IGNvbnN0IGxvZyA9IE1hdGgubG9nXG5leHBvcnQgY29uc3Qgc3FydCA9IE1hdGguc3FydFxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtudW1iZXJ9IGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBiXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBzdW0gb2YgYSBhbmQgYlxuICovXG5leHBvcnQgY29uc3QgYWRkID0gKGEsIGIpID0+IGEgKyBiXG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gYVxuICogQHBhcmFtIHtudW1iZXJ9IGJcbiAqIEByZXR1cm4ge251bWJlcn0gVGhlIHNtYWxsZXIgZWxlbWVudCBvZiBhIGFuZCBiXG4gKi9cbmV4cG9ydCBjb25zdCBtaW4gPSAoYSwgYikgPT4gYSA8IGIgPyBhIDogYlxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtudW1iZXJ9IGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBiXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBiaWdnZXIgZWxlbWVudCBvZiBhIGFuZCBiXG4gKi9cbmV4cG9ydCBjb25zdCBtYXggPSAoYSwgYikgPT4gYSA+IGIgPyBhIDogYlxuXG5leHBvcnQgY29uc3QgaXNOYU4gPSBOdW1iZXIuaXNOYU5cblxuZXhwb3J0IGNvbnN0IHBvdyA9IE1hdGgucG93XG4vKipcbiAqIEJhc2UgMTAgZXhwb25lbnRpYWwgZnVuY3Rpb24uIFJldHVybnMgdGhlIHZhbHVlIG9mIDEwIHJhaXNlZCB0byB0aGUgcG93ZXIgb2YgcG93LlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBleHBcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IGV4cDEwID0gZXhwID0+IE1hdGgucG93KDEwLCBleHApXG5cbmV4cG9ydCBjb25zdCBzaWduID0gTWF0aC5zaWduXG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBuIGlzIG5lZ2F0aXZlLCB3aGlsZSBjb25zaWRlcmluZyB0aGUgLTAgZWRnZSBjYXNlLiBXaGlsZSBgLTAgPCAwYCBpcyBmYWxzZSwgdGhpc1xuICogZnVuY3Rpb24gcmV0dXJucyB0cnVlIGZvciAtMCwtMSwsLi4gYW5kIHJldHVybnMgZmFsc2UgZm9yIDAsMSwyLC4uLlxuICogQHBhcmFtIHtudW1iZXJ9IG5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdldGhlciBuIGlzIG5lZ2F0aXZlLiBUaGlzIGZ1bmN0aW9uIGFsc28gZGlzdGluZ3Vpc2hlcyBiZXR3ZWVuIC0wIGFuZCArMFxuICovXG5leHBvcnQgY29uc3QgaXNOZWdhdGl2ZVplcm8gPSBuID0+IG4gIT09IDAgPyBuIDwgMCA6IDEgLyBuIDwgMFxuIiwgIi8qKlxuICogVXRpbGl0eSBtb2R1bGUgdG8gd29yayB3aXRoIHRpbWUuXG4gKlxuICogQG1vZHVsZSB0aW1lXG4gKi9cblxuaW1wb3J0ICogYXMgbWV0cmljIGZyb20gJy4vbWV0cmljLmpzJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5cbi8qKlxuICogUmV0dXJuIGN1cnJlbnQgdGltZS5cbiAqXG4gKiBAcmV0dXJuIHtEYXRlfVxuICovXG5leHBvcnQgY29uc3QgZ2V0RGF0ZSA9ICgpID0+IG5ldyBEYXRlKClcblxuLyoqXG4gKiBSZXR1cm4gY3VycmVudCB1bml4IHRpbWUuXG4gKlxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgZ2V0VW5peFRpbWUgPSBEYXRlLm5vd1xuXG4vKipcbiAqIFRyYW5zZm9ybSB0aW1lIChpbiBtcykgdG8gYSBodW1hbiByZWFkYWJsZSBmb3JtYXQuIEUuZy4gMTEwMCA9PiAxLjFzLiA2MHMgPT4gMW1pbi4gLjAwMSA9PiAxMFx1MDNCQ3MuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGQgZHVyYXRpb24gaW4gbWlsbGlzZWNvbmRzXG4gKiBAcmV0dXJuIHtzdHJpbmd9IGh1bWFuaXplZCBhcHByb3hpbWF0aW9uIG9mIHRpbWVcbiAqL1xuZXhwb3J0IGNvbnN0IGh1bWFuaXplRHVyYXRpb24gPSBkID0+IHtcbiAgaWYgKGQgPCA2MDAwMCkge1xuICAgIGNvbnN0IHAgPSBtZXRyaWMucHJlZml4KGQsIC0xKVxuICAgIHJldHVybiBtYXRoLnJvdW5kKHAubiAqIDEwMCkgLyAxMDAgKyBwLnByZWZpeCArICdzJ1xuICB9XG4gIGQgPSBtYXRoLmZsb29yKGQgLyAxMDAwKVxuICBjb25zdCBzZWNvbmRzID0gZCAlIDYwXG4gIGNvbnN0IG1pbnV0ZXMgPSBtYXRoLmZsb29yKGQgLyA2MCkgJSA2MFxuICBjb25zdCBob3VycyA9IG1hdGguZmxvb3IoZCAvIDM2MDApICUgMjRcbiAgY29uc3QgZGF5cyA9IG1hdGguZmxvb3IoZCAvIDg2NDAwKVxuICBpZiAoZGF5cyA+IDApIHtcbiAgICByZXR1cm4gZGF5cyArICdkJyArICgoaG91cnMgPiAwIHx8IG1pbnV0ZXMgPiAzMCkgPyAnICcgKyAobWludXRlcyA+IDMwID8gaG91cnMgKyAxIDogaG91cnMpICsgJ2gnIDogJycpXG4gIH1cbiAgaWYgKGhvdXJzID4gMCkge1xuICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIGhvdXJzICsgJ2gnICsgKChtaW51dGVzID4gMCB8fCBzZWNvbmRzID4gMzApID8gJyAnICsgKHNlY29uZHMgPiAzMCA/IG1pbnV0ZXMgKyAxIDogbWludXRlcykgKyAnbWluJyA6ICcnKVxuICB9XG4gIHJldHVybiBtaW51dGVzICsgJ21pbicgKyAoc2Vjb25kcyA+IDAgPyAnICcgKyBzZWNvbmRzICsgJ3MnIDogJycpXG59XG4iLCAiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogVGlueSB3ZWJzb2NrZXQgY29ubmVjdGlvbiBoYW5kbGVyLlxuICpcbiAqIEltcGxlbWVudHMgZXhwb25lbnRpYWwgYmFja29mZiByZWNvbm5lY3RzLCBwaW5nL3BvbmcsIGFuZCBhIG5pY2UgZXZlbnQgc3lzdGVtIHVzaW5nIFtsaWIwL29ic2VydmFibGVdLlxuICpcbiAqIEBtb2R1bGUgd2Vic29ja2V0XG4gKi9cblxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJy4vb2JzZXJ2YWJsZS5qcydcbmltcG9ydCAqIGFzIHRpbWUgZnJvbSAnLi90aW1lLmpzJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5cbmNvbnN0IHJlY29ubmVjdFRpbWVvdXRCYXNlID0gMTIwMFxuY29uc3QgbWF4UmVjb25uZWN0VGltZW91dCA9IDI1MDBcbi8vIEB0b2RvIC0gdGhpcyBzaG91bGQgZGVwZW5kIG9uIGF3YXJlbmVzcy5vdXRkYXRlZFRpbWVcbmNvbnN0IG1lc3NhZ2VSZWNvbm5lY3RUaW1lb3V0ID0gMzAwMDBcblxuLyoqXG4gKiBAcGFyYW0ge1dlYnNvY2tldENsaWVudH0gd3NjbGllbnRcbiAqL1xuY29uc3Qgc2V0dXBXUyA9ICh3c2NsaWVudCkgPT4ge1xuICBpZiAod3NjbGllbnQuc2hvdWxkQ29ubmVjdCAmJiB3c2NsaWVudC53cyA9PT0gbnVsbCkge1xuICAgIGNvbnN0IHdlYnNvY2tldCA9IG5ldyBXZWJTb2NrZXQod3NjbGllbnQudXJsKVxuICAgIGNvbnN0IGJpbmFyeVR5cGUgPSB3c2NsaWVudC5iaW5hcnlUeXBlXG4gICAgLyoqXG4gICAgICogQHR5cGUge2FueX1cbiAgICAgKi9cbiAgICBsZXQgcGluZ1RpbWVvdXQgPSBudWxsXG4gICAgaWYgKGJpbmFyeVR5cGUpIHtcbiAgICAgIHdlYnNvY2tldC5iaW5hcnlUeXBlID0gYmluYXJ5VHlwZVxuICAgIH1cbiAgICB3c2NsaWVudC53cyA9IHdlYnNvY2tldFxuICAgIHdzY2xpZW50LmNvbm5lY3RpbmcgPSB0cnVlXG4gICAgd3NjbGllbnQuY29ubmVjdGVkID0gZmFsc2VcbiAgICB3ZWJzb2NrZXQub25tZXNzYWdlID0gZXZlbnQgPT4ge1xuICAgICAgd3NjbGllbnQubGFzdE1lc3NhZ2VSZWNlaXZlZCA9IHRpbWUuZ2V0VW5peFRpbWUoKVxuICAgICAgY29uc3QgZGF0YSA9IGV2ZW50LmRhdGFcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSB0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKGRhdGEpIDogZGF0YVxuICAgICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50eXBlID09PSAncG9uZycpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHBpbmdUaW1lb3V0KVxuICAgICAgICBwaW5nVGltZW91dCA9IHNldFRpbWVvdXQoc2VuZFBpbmcsIG1lc3NhZ2VSZWNvbm5lY3RUaW1lb3V0IC8gMilcbiAgICAgIH1cbiAgICAgIHdzY2xpZW50LmVtaXQoJ21lc3NhZ2UnLCBbbWVzc2FnZSwgd3NjbGllbnRdKVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2FueX0gZXJyb3JcbiAgICAgKi9cbiAgICBjb25zdCBvbmNsb3NlID0gZXJyb3IgPT4ge1xuICAgICAgaWYgKHdzY2xpZW50LndzICE9PSBudWxsKSB7XG4gICAgICAgIHdzY2xpZW50LndzID0gbnVsbFxuICAgICAgICB3c2NsaWVudC5jb25uZWN0aW5nID0gZmFsc2VcbiAgICAgICAgaWYgKHdzY2xpZW50LmNvbm5lY3RlZCkge1xuICAgICAgICAgIHdzY2xpZW50LmNvbm5lY3RlZCA9IGZhbHNlXG4gICAgICAgICAgd3NjbGllbnQuZW1pdCgnZGlzY29ubmVjdCcsIFt7IHR5cGU6ICdkaXNjb25uZWN0JywgZXJyb3IgfSwgd3NjbGllbnRdKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHdzY2xpZW50LnVuc3VjY2Vzc2Z1bFJlY29ubmVjdHMrK1xuICAgICAgICB9XG4gICAgICAgIC8vIFN0YXJ0IHdpdGggbm8gcmVjb25uZWN0IHRpbWVvdXQgYW5kIGluY3JlYXNlIHRpbWVvdXQgYnlcbiAgICAgICAgLy8gbG9nMTAod3NVbnN1Y2Nlc3NmdWxSZWNvbm5lY3RzKS5cbiAgICAgICAgLy8gVGhlIGlkZWEgaXMgdG8gaW5jcmVhc2UgcmVjb25uZWN0IHRpbWVvdXQgc2xvd2x5IGFuZCBoYXZlIG5vIHJlY29ubmVjdFxuICAgICAgICAvLyB0aW1lb3V0IGF0IHRoZSBiZWdpbm5pbmcgKGxvZygxKSA9IDApXG4gICAgICAgIHNldFRpbWVvdXQoc2V0dXBXUywgbWF0aC5taW4obWF0aC5sb2cxMCh3c2NsaWVudC51bnN1Y2Nlc3NmdWxSZWNvbm5lY3RzICsgMSkgKiByZWNvbm5lY3RUaW1lb3V0QmFzZSwgbWF4UmVjb25uZWN0VGltZW91dCksIHdzY2xpZW50KVxuICAgICAgfVxuICAgICAgY2xlYXJUaW1lb3V0KHBpbmdUaW1lb3V0KVxuICAgIH1cbiAgICBjb25zdCBzZW5kUGluZyA9ICgpID0+IHtcbiAgICAgIGlmICh3c2NsaWVudC53cyA9PT0gd2Vic29ja2V0KSB7XG4gICAgICAgIHdzY2xpZW50LnNlbmQoe1xuICAgICAgICAgIHR5cGU6ICdwaW5nJ1xuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICB3ZWJzb2NrZXQub25jbG9zZSA9ICgpID0+IG9uY2xvc2UobnVsbClcbiAgICB3ZWJzb2NrZXQub25lcnJvciA9IGVycm9yID0+IG9uY2xvc2UoZXJyb3IpXG4gICAgd2Vic29ja2V0Lm9ub3BlbiA9ICgpID0+IHtcbiAgICAgIHdzY2xpZW50Lmxhc3RNZXNzYWdlUmVjZWl2ZWQgPSB0aW1lLmdldFVuaXhUaW1lKClcbiAgICAgIHdzY2xpZW50LmNvbm5lY3RpbmcgPSBmYWxzZVxuICAgICAgd3NjbGllbnQuY29ubmVjdGVkID0gdHJ1ZVxuICAgICAgd3NjbGllbnQudW5zdWNjZXNzZnVsUmVjb25uZWN0cyA9IDBcbiAgICAgIHdzY2xpZW50LmVtaXQoJ2Nvbm5lY3QnLCBbeyB0eXBlOiAnY29ubmVjdCcgfSwgd3NjbGllbnRdKVxuICAgICAgLy8gc2V0IHBpbmdcbiAgICAgIHBpbmdUaW1lb3V0ID0gc2V0VGltZW91dChzZW5kUGluZywgbWVzc2FnZVJlY29ubmVjdFRpbWVvdXQgLyAyKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKiBAZXh0ZW5kcyBPYnNlcnZhYmxlPHN0cmluZz5cbiAqL1xuZXhwb3J0IGNsYXNzIFdlYnNvY2tldENsaWVudCBleHRlbmRzIE9ic2VydmFibGUge1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVybFxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0c1xuICAgKiBAcGFyYW0geydhcnJheWJ1ZmZlcicgfCAnYmxvYicgfCBudWxsfSBbb3B0cy5iaW5hcnlUeXBlXSBTZXQgYHdzLmJpbmFyeVR5cGVgXG4gICAqL1xuICBjb25zdHJ1Y3RvciAodXJsLCB7IGJpbmFyeVR5cGUgfSA9IHt9KSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMudXJsID0gdXJsXG4gICAgLyoqXG4gICAgICogQHR5cGUge1dlYlNvY2tldD99XG4gICAgICovXG4gICAgdGhpcy53cyA9IG51bGxcbiAgICB0aGlzLmJpbmFyeVR5cGUgPSBiaW5hcnlUeXBlIHx8IG51bGxcbiAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlXG4gICAgdGhpcy5jb25uZWN0aW5nID0gZmFsc2VcbiAgICB0aGlzLnVuc3VjY2Vzc2Z1bFJlY29ubmVjdHMgPSAwXG4gICAgdGhpcy5sYXN0TWVzc2FnZVJlY2VpdmVkID0gMFxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdG8gY29ubmVjdCB0byBvdGhlciBwZWVycyBvciBub3RcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGlzLnNob3VsZENvbm5lY3QgPSB0cnVlXG4gICAgdGhpcy5fY2hlY2tJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCAmJiBtZXNzYWdlUmVjb25uZWN0VGltZW91dCA8IHRpbWUuZ2V0VW5peFRpbWUoKSAtIHRoaXMubGFzdE1lc3NhZ2VSZWNlaXZlZCkge1xuICAgICAgICAvLyBubyBtZXNzYWdlIHJlY2VpdmVkIGluIGEgbG9uZyB0aW1lIC0gbm90IGV2ZW4geW91ciBvd24gYXdhcmVuZXNzXG4gICAgICAgIC8vIHVwZGF0ZXMgKHdoaWNoIGFyZSB1cGRhdGVkIGV2ZXJ5IDE1IHNlY29uZHMpXG4gICAgICAgIC8qKiBAdHlwZSB7V2ViU29ja2V0fSAqLyAodGhpcy53cykuY2xvc2UoKVxuICAgICAgfVxuICAgIH0sIG1lc3NhZ2VSZWNvbm5lY3RUaW1lb3V0IC8gMilcbiAgICBzZXR1cFdTKHRoaXMpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG1lc3NhZ2VcbiAgICovXG4gIHNlbmQgKG1lc3NhZ2UpIHtcbiAgICBpZiAodGhpcy53cykge1xuICAgICAgdGhpcy53cy5zZW5kKEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKVxuICAgIH1cbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fY2hlY2tJbnRlcnZhbClcbiAgICB0aGlzLmRpc2Nvbm5lY3QoKVxuICAgIHN1cGVyLmRlc3Ryb3koKVxuICB9XG5cbiAgZGlzY29ubmVjdCAoKSB7XG4gICAgdGhpcy5zaG91bGRDb25uZWN0ID0gZmFsc2VcbiAgICBpZiAodGhpcy53cyAhPT0gbnVsbCkge1xuICAgICAgdGhpcy53cy5jbG9zZSgpXG4gICAgfVxuICB9XG5cbiAgY29ubmVjdCAoKSB7XG4gICAgdGhpcy5zaG91bGRDb25uZWN0ID0gdHJ1ZVxuICAgIGlmICghdGhpcy5jb25uZWN0ZWQgJiYgdGhpcy53cyA9PT0gbnVsbCkge1xuICAgICAgc2V0dXBXUyh0aGlzKVxuICAgIH1cbiAgfVxufVxuIiwgIi8qKlxuICogRXJyb3IgaGVscGVycy5cbiAqXG4gKiBAbW9kdWxlIGVycm9yXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc1xuICogQHJldHVybiB7RXJyb3J9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gcyA9PiBuZXcgRXJyb3IocylcblxuLyoqXG4gKiBAdGhyb3dzIHtFcnJvcn1cbiAqIEByZXR1cm4ge25ldmVyfVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAzICovXG5leHBvcnQgY29uc3QgbWV0aG9kVW5pbXBsZW1lbnRlZCA9ICgpID0+IHtcbiAgdGhyb3cgY3JlYXRlKCdNZXRob2QgdW5pbXBsZW1lbnRlZCcpXG59XG5cbi8qKlxuICogQHRocm93cyB7RXJyb3J9XG4gKiBAcmV0dXJuIHtuZXZlcn1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgMyAqL1xuZXhwb3J0IGNvbnN0IHVuZXhwZWN0ZWRDYXNlID0gKCkgPT4ge1xuICB0aHJvdyBjcmVhdGUoJ1VuZXhwZWN0ZWQgY2FzZScpXG59XG5cbi8qKlxuICogQHBhcmFtIHtib29sZWFufSBwcm9wZXJ0eVxuICogQHJldHVybiB7YXNzZXJ0cyBwcm9wZXJ0eSBpcyB0cnVlfVxuICovXG5leHBvcnQgY29uc3QgYXNzZXJ0ID0gcHJvcGVydHkgPT4geyBpZiAoIXByb3BlcnR5KSB0aHJvdyBjcmVhdGUoJ0Fzc2VydCBmYWlsZWQnKSB9XG4iLCAiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogQmluYXJ5IGRhdGEgY29uc3RhbnRzLlxuICpcbiAqIEBtb2R1bGUgYmluYXJ5XG4gKi9cblxuLyoqXG4gKiBuLXRoIGJpdCBhY3RpdmF0ZWQuXG4gKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVDEgPSAxXG5leHBvcnQgY29uc3QgQklUMiA9IDJcbmV4cG9ydCBjb25zdCBCSVQzID0gNFxuZXhwb3J0IGNvbnN0IEJJVDQgPSA4XG5leHBvcnQgY29uc3QgQklUNSA9IDE2XG5leHBvcnQgY29uc3QgQklUNiA9IDMyXG5leHBvcnQgY29uc3QgQklUNyA9IDY0XG5leHBvcnQgY29uc3QgQklUOCA9IDEyOFxuZXhwb3J0IGNvbnN0IEJJVDkgPSAyNTZcbmV4cG9ydCBjb25zdCBCSVQxMCA9IDUxMlxuZXhwb3J0IGNvbnN0IEJJVDExID0gMTAyNFxuZXhwb3J0IGNvbnN0IEJJVDEyID0gMjA0OFxuZXhwb3J0IGNvbnN0IEJJVDEzID0gNDA5NlxuZXhwb3J0IGNvbnN0IEJJVDE0ID0gODE5MlxuZXhwb3J0IGNvbnN0IEJJVDE1ID0gMTYzODRcbmV4cG9ydCBjb25zdCBCSVQxNiA9IDMyNzY4XG5leHBvcnQgY29uc3QgQklUMTcgPSA2NTUzNlxuZXhwb3J0IGNvbnN0IEJJVDE4ID0gMSA8PCAxN1xuZXhwb3J0IGNvbnN0IEJJVDE5ID0gMSA8PCAxOFxuZXhwb3J0IGNvbnN0IEJJVDIwID0gMSA8PCAxOVxuZXhwb3J0IGNvbnN0IEJJVDIxID0gMSA8PCAyMFxuZXhwb3J0IGNvbnN0IEJJVDIyID0gMSA8PCAyMVxuZXhwb3J0IGNvbnN0IEJJVDIzID0gMSA8PCAyMlxuZXhwb3J0IGNvbnN0IEJJVDI0ID0gMSA8PCAyM1xuZXhwb3J0IGNvbnN0IEJJVDI1ID0gMSA8PCAyNFxuZXhwb3J0IGNvbnN0IEJJVDI2ID0gMSA8PCAyNVxuZXhwb3J0IGNvbnN0IEJJVDI3ID0gMSA8PCAyNlxuZXhwb3J0IGNvbnN0IEJJVDI4ID0gMSA8PCAyN1xuZXhwb3J0IGNvbnN0IEJJVDI5ID0gMSA8PCAyOFxuZXhwb3J0IGNvbnN0IEJJVDMwID0gMSA8PCAyOVxuZXhwb3J0IGNvbnN0IEJJVDMxID0gMSA8PCAzMFxuZXhwb3J0IGNvbnN0IEJJVDMyID0gMSA8PCAzMVxuXG4vKipcbiAqIEZpcnN0IG4gYml0cyBhY3RpdmF0ZWQuXG4gKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMwID0gMFxuZXhwb3J0IGNvbnN0IEJJVFMxID0gMVxuZXhwb3J0IGNvbnN0IEJJVFMyID0gM1xuZXhwb3J0IGNvbnN0IEJJVFMzID0gN1xuZXhwb3J0IGNvbnN0IEJJVFM0ID0gMTVcbmV4cG9ydCBjb25zdCBCSVRTNSA9IDMxXG5leHBvcnQgY29uc3QgQklUUzYgPSA2M1xuZXhwb3J0IGNvbnN0IEJJVFM3ID0gMTI3XG5leHBvcnQgY29uc3QgQklUUzggPSAyNTVcbmV4cG9ydCBjb25zdCBCSVRTOSA9IDUxMVxuZXhwb3J0IGNvbnN0IEJJVFMxMCA9IDEwMjNcbmV4cG9ydCBjb25zdCBCSVRTMTEgPSAyMDQ3XG5leHBvcnQgY29uc3QgQklUUzEyID0gNDA5NVxuZXhwb3J0IGNvbnN0IEJJVFMxMyA9IDgxOTFcbmV4cG9ydCBjb25zdCBCSVRTMTQgPSAxNjM4M1xuZXhwb3J0IGNvbnN0IEJJVFMxNSA9IDMyNzY3XG5leHBvcnQgY29uc3QgQklUUzE2ID0gNjU1MzVcbmV4cG9ydCBjb25zdCBCSVRTMTcgPSBCSVQxOCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMTggPSBCSVQxOSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMTkgPSBCSVQyMCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjAgPSBCSVQyMSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjEgPSBCSVQyMiAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjIgPSBCSVQyMyAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjMgPSBCSVQyNCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjQgPSBCSVQyNSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjUgPSBCSVQyNiAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjYgPSBCSVQyNyAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjcgPSBCSVQyOCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjggPSBCSVQyOSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjkgPSBCSVQzMCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMzAgPSBCSVQzMSAtIDFcbi8qKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMzMSA9IDB4N0ZGRkZGRkZcbi8qKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMzMiA9IDB4RkZGRkZGRkZcbiIsICIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuZXhwb3J0IGNvbnN0IHN1YnRsZSA9IGNyeXB0by5zdWJ0bGVcbmV4cG9ydCBjb25zdCBnZXRSYW5kb21WYWx1ZXMgPSBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzLmJpbmQoY3J5cHRvKVxuIiwgIi8qKlxuICogSXNvbW9ycGhpYyBtb2R1bGUgZm9yIHRydWUgcmFuZG9tIG51bWJlcnMgLyBidWZmZXJzIC8gdXVpZHMuXG4gKlxuICogQXR0ZW50aW9uOiBmYWxscyBiYWNrIHRvIE1hdGgucmFuZG9tIGlmIHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgY3J5cHRvLlxuICpcbiAqIEBtb2R1bGUgcmFuZG9tXG4gKi9cblxuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5pbXBvcnQgKiBhcyBiaW5hcnkgZnJvbSAnLi9iaW5hcnkuanMnXG5pbXBvcnQgeyBnZXRSYW5kb21WYWx1ZXMgfSBmcm9tICdsaWIwL3dlYmNyeXB0bydcblxuZXhwb3J0IGNvbnN0IHJhbmQgPSBNYXRoLnJhbmRvbVxuXG5leHBvcnQgY29uc3QgdWludDMyID0gKCkgPT4gZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50MzJBcnJheSgxKSlbMF1cblxuZXhwb3J0IGNvbnN0IHVpbnQ1MyA9ICgpID0+IHtcbiAgY29uc3QgYXJyID0gZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50MzJBcnJheSg4KSlcbiAgcmV0dXJuIChhcnJbMF0gJiBiaW5hcnkuQklUUzIxKSAqIChiaW5hcnkuQklUUzMyICsgMSkgKyAoYXJyWzFdID4+PiAwKVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge0FycmF5PFQ+fSBhcnJcbiAqIEByZXR1cm4ge1R9XG4gKi9cbmV4cG9ydCBjb25zdCBvbmVPZiA9IGFyciA9PiBhcnJbbWF0aC5mbG9vcihyYW5kKCkgKiBhcnIubGVuZ3RoKV1cblxuLy8gQHRzLWlnbm9yZVxuY29uc3QgdXVpZHY0VGVtcGxhdGUgPSBbMWU3XSArIC0xZTMgKyAtNGUzICsgLThlMyArIC0xZTExXG5cbi8qKlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgdXVpZHY0ID0gKCkgPT4gdXVpZHY0VGVtcGxhdGUucmVwbGFjZSgvWzAxOF0vZywgLyoqIEBwYXJhbSB7bnVtYmVyfSBjICovIGMgPT5cbiAgKGMgXiB1aW50MzIoKSAmIDE1ID4+IGMgLyA0KS50b1N0cmluZygxNilcbilcbiIsICIvKipcbiAqIFV0aWxpdHkgaGVscGVycyBmb3Igd29ya2luZyB3aXRoIG51bWJlcnMuXG4gKlxuICogQG1vZHVsZSBudW1iZXJcbiAqL1xuXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJy4vbWF0aC5qcydcbmltcG9ydCAqIGFzIGJpbmFyeSBmcm9tICcuL2JpbmFyeS5qcydcblxuZXhwb3J0IGNvbnN0IE1BWF9TQUZFX0lOVEVHRVIgPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUlxuZXhwb3J0IGNvbnN0IE1JTl9TQUZFX0lOVEVHRVIgPSBOdW1iZXIuTUlOX1NBRkVfSU5URUdFUlxuXG5leHBvcnQgY29uc3QgTE9XRVNUX0lOVDMyID0gMSA8PCAzMVxuZXhwb3J0IGNvbnN0IEhJR0hFU1RfSU5UMzIgPSBiaW5hcnkuQklUUzMxXG5leHBvcnQgY29uc3QgSElHSEVTVF9VSU5UMzIgPSBiaW5hcnkuQklUUzMyXG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgaXNJbnRlZ2VyID0gTnVtYmVyLmlzSW50ZWdlciB8fCAobnVtID0+IHR5cGVvZiBudW0gPT09ICdudW1iZXInICYmIGlzRmluaXRlKG51bSkgJiYgbWF0aC5mbG9vcihudW0pID09PSBudW0pXG5leHBvcnQgY29uc3QgaXNOYU4gPSBOdW1iZXIuaXNOYU5cbmV4cG9ydCBjb25zdCBwYXJzZUludCA9IE51bWJlci5wYXJzZUludFxuXG4vKipcbiAqIENvdW50IHRoZSBudW1iZXIgb2YgXCIxXCIgYml0cyBpbiBhbiB1bnNpZ25lZCAzMmJpdCBudW1iZXIuXG4gKlxuICogU3VwZXIgZnVuIGJpdGNvdW50IGFsZ29yaXRobSBieSBCcmlhbiBLZXJuaWdoYW4uXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IG5cbiAqL1xuZXhwb3J0IGNvbnN0IGNvdW50Qml0cyA9IG4gPT4ge1xuICBuICY9IGJpbmFyeS5CSVRTMzJcbiAgbGV0IGNvdW50ID0gMFxuICB3aGlsZSAobikge1xuICAgIG4gJj0gKG4gLSAxKVxuICAgIGNvdW50KytcbiAgfVxuICByZXR1cm4gY291bnRcbn1cbiIsICJpbXBvcnQgKiBhcyBhcnJheSBmcm9tICcuL2FycmF5LmpzJ1xuXG4vKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCBzdHJpbmdzLlxuICpcbiAqIEBtb2R1bGUgc3RyaW5nXG4gKi9cblxuZXhwb3J0IGNvbnN0IGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGVcbmV4cG9ydCBjb25zdCBmcm9tQ29kZVBvaW50ID0gU3RyaW5nLmZyb21Db2RlUG9pbnRcblxuLyoqXG4gKiBUaGUgbGFyZ2VzdCB1dGYxNiBjaGFyYWN0ZXIuXG4gKiBDb3JyZXNwb25kcyB0byBVaW50OEFycmF5KFsyNTUsIDI1NV0pIG9yIGNoYXJjb2Rlb2YoMngyXjgpXG4gKi9cbmV4cG9ydCBjb25zdCBNQVhfVVRGMTZfQ0hBUkFDVEVSID0gZnJvbUNoYXJDb2RlKDY1NTM1KVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmNvbnN0IHRvTG93ZXJDYXNlID0gcyA9PiBzLnRvTG93ZXJDYXNlKClcblxuY29uc3QgdHJpbUxlZnRSZWdleCA9IC9eXFxzKi9nXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IHRyaW1MZWZ0ID0gcyA9PiBzLnJlcGxhY2UodHJpbUxlZnRSZWdleCwgJycpXG5cbmNvbnN0IGZyb21DYW1lbENhc2VSZWdleCA9IC8oW0EtWl0pL2dcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc1xuICogQHBhcmFtIHtzdHJpbmd9IHNlcGFyYXRvclxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgZnJvbUNhbWVsQ2FzZSA9IChzLCBzZXBhcmF0b3IpID0+IHRyaW1MZWZ0KHMucmVwbGFjZShmcm9tQ2FtZWxDYXNlUmVnZXgsIG1hdGNoID0+IGAke3NlcGFyYXRvcn0ke3RvTG93ZXJDYXNlKG1hdGNoKX1gKSlcblxuLyoqXG4gKiBDb21wdXRlIHRoZSB1dGY4Qnl0ZUxlbmd0aFxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgdXRmOEJ5dGVMZW5ndGggPSBzdHIgPT4gdW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHN0cikpLmxlbmd0aFxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXk8QXJyYXlCdWZmZXI+fVxuICovXG5leHBvcnQgY29uc3QgX2VuY29kZVV0ZjhQb2x5ZmlsbCA9IHN0ciA9PiB7XG4gIGNvbnN0IGVuY29kZWRTdHJpbmcgPSB1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoc3RyKSlcbiAgY29uc3QgbGVuID0gZW5jb2RlZFN0cmluZy5sZW5ndGhcbiAgY29uc3QgYnVmID0gbmV3IFVpbnQ4QXJyYXkobGVuKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgYnVmW2ldID0gLyoqIEB0eXBlIHtudW1iZXJ9ICovIChlbmNvZGVkU3RyaW5nLmNvZGVQb2ludEF0KGkpKVxuICB9XG4gIHJldHVybiBidWZcbn1cblxuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCB1dGY4VGV4dEVuY29kZXIgPSAvKiogQHR5cGUge1RleHRFbmNvZGVyfSAqLyAodHlwZW9mIFRleHRFbmNvZGVyICE9PSAndW5kZWZpbmVkJyA/IG5ldyBUZXh0RW5jb2RlcigpIDogbnVsbClcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5PEFycmF5QnVmZmVyPn1cbiAqL1xuZXhwb3J0IGNvbnN0IF9lbmNvZGVVdGY4TmF0aXZlID0gc3RyID0+IHV0ZjhUZXh0RW5jb2Rlci5lbmNvZGUoc3RyKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgZW5jb2RlVXRmOCA9IHV0ZjhUZXh0RW5jb2RlciA/IF9lbmNvZGVVdGY4TmF0aXZlIDogX2VuY29kZVV0ZjhQb2x5ZmlsbFxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBfZGVjb2RlVXRmOFBvbHlmaWxsID0gYnVmID0+IHtcbiAgbGV0IHJlbWFpbmluZ0xlbiA9IGJ1Zi5sZW5ndGhcbiAgbGV0IGVuY29kZWRTdHJpbmcgPSAnJ1xuICBsZXQgYnVmUG9zID0gMFxuICB3aGlsZSAocmVtYWluaW5nTGVuID4gMCkge1xuICAgIGNvbnN0IG5leHRMZW4gPSByZW1haW5pbmdMZW4gPCAxMDAwMCA/IHJlbWFpbmluZ0xlbiA6IDEwMDAwXG4gICAgY29uc3QgYnl0ZXMgPSBidWYuc3ViYXJyYXkoYnVmUG9zLCBidWZQb3MgKyBuZXh0TGVuKVxuICAgIGJ1ZlBvcyArPSBuZXh0TGVuXG4gICAgLy8gU3RhcnRpbmcgd2l0aCBFUzUuMSB3ZSBjYW4gc3VwcGx5IGEgZ2VuZXJpYyBhcnJheS1saWtlIG9iamVjdCBhcyBhcmd1bWVudHNcbiAgICBlbmNvZGVkU3RyaW5nICs9IFN0cmluZy5mcm9tQ29kZVBvaW50LmFwcGx5KG51bGwsIC8qKiBAdHlwZSB7YW55fSAqLyAoYnl0ZXMpKVxuICAgIHJlbWFpbmluZ0xlbiAtPSBuZXh0TGVuXG4gIH1cbiAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChlc2NhcGUoZW5jb2RlZFN0cmluZykpXG59XG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgbGV0IHV0ZjhUZXh0RGVjb2RlciA9IHR5cGVvZiBUZXh0RGVjb2RlciA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogbmV3IFRleHREZWNvZGVyKCd1dGYtOCcsIHsgZmF0YWw6IHRydWUsIGlnbm9yZUJPTTogdHJ1ZSB9KVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmlmICh1dGY4VGV4dERlY29kZXIgJiYgdXRmOFRleHREZWNvZGVyLmRlY29kZShuZXcgVWludDhBcnJheSgpKS5sZW5ndGggPT09IDEpIHtcbiAgLy8gU2FmYXJpIGRvZXNuJ3QgaGFuZGxlIEJPTSBjb3JyZWN0bHkuXG4gIC8vIFRoaXMgZml4ZXMgYSBidWcgaW4gU2FmYXJpIDEzLjAuNSB3aGVyZSBpdCBwcm9kdWNlcyBhIEJPTSB0aGUgZmlyc3QgdGltZSBpdCBpcyBjYWxsZWQuXG4gIC8vIHV0ZjhUZXh0RGVjb2Rlci5kZWNvZGUobmV3IFVpbnQ4QXJyYXkoKSkubGVuZ3RoID09PSAxIG9uIHRoZSBmaXJzdCBjYWxsIGFuZFxuICAvLyB1dGY4VGV4dERlY29kZXIuZGVjb2RlKG5ldyBVaW50OEFycmF5KCkpLmxlbmd0aCA9PT0gMSBvbiB0aGUgc2Vjb25kIGNhbGxcbiAgLy8gQW5vdGhlciBpc3N1ZSBpcyB0aGF0IGZyb20gdGhlbiBvbiBubyBCT00gY2hhcnMgYXJlIHJlY29nbml6ZWQgYW55bW9yZVxuICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICB1dGY4VGV4dERlY29kZXIgPSBudWxsXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBfZGVjb2RlVXRmOE5hdGl2ZSA9IGJ1ZiA9PiAvKiogQHR5cGUge1RleHREZWNvZGVyfSAqLyAodXRmOFRleHREZWNvZGVyKS5kZWNvZGUoYnVmKVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgZGVjb2RlVXRmOCA9IHV0ZjhUZXh0RGVjb2RlciA/IF9kZWNvZGVVdGY4TmF0aXZlIDogX2RlY29kZVV0ZjhQb2x5ZmlsbFxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgVGhlIGluaXRpYWwgc3RyaW5nXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXggU3RhcnRpbmcgcG9zaXRpb25cbiAqIEBwYXJhbSB7bnVtYmVyfSByZW1vdmUgTnVtYmVyIG9mIGNoYXJhY3RlcnMgdG8gcmVtb3ZlXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5zZXJ0IE5ldyBjb250ZW50IHRvIGluc2VydFxuICovXG5leHBvcnQgY29uc3Qgc3BsaWNlID0gKHN0ciwgaW5kZXgsIHJlbW92ZSwgaW5zZXJ0ID0gJycpID0+IHN0ci5zbGljZSgwLCBpbmRleCkgKyBpbnNlcnQgKyBzdHIuc2xpY2UoaW5kZXggKyByZW1vdmUpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZVxuICogQHBhcmFtIHtudW1iZXJ9IG5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlcGVhdCA9IChzb3VyY2UsIG4pID0+IGFycmF5LnVuZm9sZChuLCAoKSA9PiBzb3VyY2UpLmpvaW4oJycpXG5cbi8qKlxuICogRXNjYXBlIEhUTUwgY2hhcmFjdGVycyAmLDwsPiwnLFwiIHRvIHRoZWlyIHJlc3BlY3RpdmUgSFRNTCBlbnRpdGllcyAmYW1wOywmbHQ7LCZndDssJiMzOTssJnF1b3Q7XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICovXG5leHBvcnQgY29uc3QgZXNjYXBlSFRNTCA9IHN0ciA9PlxuICBzdHIucmVwbGFjZSgvWyY8PidcIl0vZywgciA9PiAvKiogQHR5cGUge3N0cmluZ30gKi8gKHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgXCInXCI6ICcmIzM5OycsXG4gICAgJ1wiJzogJyZxdW90OydcbiAgfVtyXSkpXG5cbi8qKlxuICogUmV2ZXJzZSBvZiBgZXNjYXBlSFRNTGBcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKi9cbmV4cG9ydCBjb25zdCB1bmVzY2FwZUhUTUwgPSBzdHIgPT5cbiAgc3RyLnJlcGxhY2UoLyZhbXA7fCZsdDt8Jmd0O3wmIzM5O3wmcXVvdDsvZywgciA9PiAvKiogQHR5cGUge3N0cmluZ30gKi8gKHtcbiAgICAnJmFtcDsnOiAnJicsXG4gICAgJyZsdDsnOiAnPCcsXG4gICAgJyZndDsnOiAnPicsXG4gICAgJyYjMzk7JzogXCInXCIsXG4gICAgJyZxdW90Oyc6ICdcIidcbiAgfVtyXSkpXG4iLCAiLyoqXG4gKiBFZmZpY2llbnQgc2NoZW1hLWxlc3MgYmluYXJ5IGVuY29kaW5nIHdpdGggc3VwcG9ydCBmb3IgdmFyaWFibGUgbGVuZ3RoIGVuY29kaW5nLlxuICpcbiAqIFVzZSBbbGliMC9lbmNvZGluZ10gd2l0aCBbbGliMC9kZWNvZGluZ10uIEV2ZXJ5IGVuY29kaW5nIGZ1bmN0aW9uIGhhcyBhIGNvcnJlc3BvbmRpbmcgZGVjb2RpbmcgZnVuY3Rpb24uXG4gKlxuICogRW5jb2RlcyBudW1iZXJzIGluIGxpdHRsZS1lbmRpYW4gb3JkZXIgKGxlYXN0IHRvIG1vc3Qgc2lnbmlmaWNhbnQgYnl0ZSBvcmRlcilcbiAqIGFuZCBpcyBjb21wYXRpYmxlIHdpdGggR29sYW5nJ3MgYmluYXJ5IGVuY29kaW5nIChodHRwczovL2dvbGFuZy5vcmcvcGtnL2VuY29kaW5nL2JpbmFyeS8pXG4gKiB3aGljaCBpcyBhbHNvIHVzZWQgaW4gUHJvdG9jb2wgQnVmZmVycy5cbiAqXG4gKiBgYGBqc1xuICogLy8gZW5jb2Rpbmcgc3RlcFxuICogY29uc3QgZW5jb2RlciA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICogZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIDI1NilcbiAqIGVuY29kaW5nLndyaXRlVmFyU3RyaW5nKGVuY29kZXIsICdIZWxsbyB3b3JsZCEnKVxuICogY29uc3QgYnVmID0gZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXIpXG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogLy8gZGVjb2Rpbmcgc3RlcFxuICogY29uc3QgZGVjb2RlciA9IGRlY29kaW5nLmNyZWF0ZURlY29kZXIoYnVmKVxuICogZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2RlcikgLy8gPT4gMjU2XG4gKiBkZWNvZGluZy5yZWFkVmFyU3RyaW5nKGRlY29kZXIpIC8vID0+ICdIZWxsbyB3b3JsZCEnXG4gKiBkZWNvZGluZy5oYXNDb250ZW50KGRlY29kZXIpIC8vID0+IGZhbHNlIC0gYWxsIGRhdGEgaXMgcmVhZFxuICogYGBgXG4gKlxuICogQG1vZHVsZSBlbmNvZGluZ1xuICovXG5cbmltcG9ydCAqIGFzIG1hdGggZnJvbSAnLi9tYXRoLmpzJ1xuaW1wb3J0ICogYXMgbnVtYmVyIGZyb20gJy4vbnVtYmVyLmpzJ1xuaW1wb3J0ICogYXMgYmluYXJ5IGZyb20gJy4vYmluYXJ5LmpzJ1xuaW1wb3J0ICogYXMgc3RyaW5nIGZyb20gJy4vc3RyaW5nLmpzJ1xuaW1wb3J0ICogYXMgYXJyYXkgZnJvbSAnLi9hcnJheS5qcydcblxuLyoqXG4gKiBBIEJpbmFyeUVuY29kZXIgaGFuZGxlcyB0aGUgZW5jb2RpbmcgdG8gYW4gVWludDhBcnJheS5cbiAqL1xuZXhwb3J0IGNsYXNzIEVuY29kZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5jcG9zID0gMFxuICAgIHRoaXMuY2J1ZiA9IG5ldyBVaW50OEFycmF5KDEwMClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QXJyYXk8VWludDhBcnJheT59XG4gICAgICovXG4gICAgdGhpcy5idWZzID0gW11cbiAgfVxufVxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHJldHVybiB7RW5jb2Rlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUVuY29kZXIgPSAoKSA9PiBuZXcgRW5jb2RlcigpXG5cbi8qKlxuICogQHBhcmFtIHtmdW5jdGlvbihFbmNvZGVyKTp2b2lkfSBmXG4gKi9cbmV4cG9ydCBjb25zdCBlbmNvZGUgPSAoZikgPT4ge1xuICBjb25zdCBlbmNvZGVyID0gY3JlYXRlRW5jb2RlcigpXG4gIGYoZW5jb2RlcilcbiAgcmV0dXJuIHRvVWludDhBcnJheShlbmNvZGVyKVxufVxuXG4vKipcbiAqIFRoZSBjdXJyZW50IGxlbmd0aCBvZiB0aGUgZW5jb2RlZCBkYXRhLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBsZW5ndGggPSBlbmNvZGVyID0+IHtcbiAgbGV0IGxlbiA9IGVuY29kZXIuY3Bvc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGVuY29kZXIuYnVmcy5sZW5ndGg7IGkrKykge1xuICAgIGxlbiArPSBlbmNvZGVyLmJ1ZnNbaV0ubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGxlblxufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgZW5jb2RlciBpcyBlbXB0eS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGhhc0NvbnRlbnQgPSBlbmNvZGVyID0+IGVuY29kZXIuY3BvcyA+IDAgfHwgZW5jb2Rlci5idWZzLmxlbmd0aCA+IDBcblxuLyoqXG4gKiBUcmFuc2Zvcm0gdG8gVWludDhBcnJheS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHJldHVybiB7VWludDhBcnJheTxBcnJheUJ1ZmZlcj59IFRoZSBjcmVhdGVkIEFycmF5QnVmZmVyLlxuICovXG5leHBvcnQgY29uc3QgdG9VaW50OEFycmF5ID0gZW5jb2RlciA9PiB7XG4gIGNvbnN0IHVpbnQ4YXJyID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKGVuY29kZXIpKVxuICBsZXQgY3VyUG9zID0gMFxuICBmb3IgKGxldCBpID0gMDsgaSA8IGVuY29kZXIuYnVmcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGQgPSBlbmNvZGVyLmJ1ZnNbaV1cbiAgICB1aW50OGFyci5zZXQoZCwgY3VyUG9zKVxuICAgIGN1clBvcyArPSBkLmxlbmd0aFxuICB9XG4gIHVpbnQ4YXJyLnNldChuZXcgVWludDhBcnJheShlbmNvZGVyLmNidWYuYnVmZmVyLCAwLCBlbmNvZGVyLmNwb3MpLCBjdXJQb3MpXG4gIHJldHVybiB1aW50OGFyclxufVxuXG4vKipcbiAqIFZlcmlmeSB0aGF0IGl0IGlzIHBvc3NpYmxlIHRvIHdyaXRlIGBsZW5gIGJ5dGVzIHd0aWhvdXQgY2hlY2tpbmcuIElmXG4gKiBuZWNlc3NhcnksIGEgbmV3IEJ1ZmZlciB3aXRoIHRoZSByZXF1aXJlZCBsZW5ndGggaXMgYXR0YWNoZWQuXG4gKlxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gKi9cbmV4cG9ydCBjb25zdCB2ZXJpZnlMZW4gPSAoZW5jb2RlciwgbGVuKSA9PiB7XG4gIGNvbnN0IGJ1ZmZlckxlbiA9IGVuY29kZXIuY2J1Zi5sZW5ndGhcbiAgaWYgKGJ1ZmZlckxlbiAtIGVuY29kZXIuY3BvcyA8IGxlbikge1xuICAgIGVuY29kZXIuYnVmcy5wdXNoKG5ldyBVaW50OEFycmF5KGVuY29kZXIuY2J1Zi5idWZmZXIsIDAsIGVuY29kZXIuY3BvcykpXG4gICAgZW5jb2Rlci5jYnVmID0gbmV3IFVpbnQ4QXJyYXkobWF0aC5tYXgoYnVmZmVyTGVuLCBsZW4pICogMilcbiAgICBlbmNvZGVyLmNwb3MgPSAwXG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSBvbmUgYnl0ZSB0byB0aGUgZW5jb2Rlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgYnl0ZSB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZSA9IChlbmNvZGVyLCBudW0pID0+IHtcbiAgY29uc3QgYnVmZmVyTGVuID0gZW5jb2Rlci5jYnVmLmxlbmd0aFxuICBpZiAoZW5jb2Rlci5jcG9zID09PSBidWZmZXJMZW4pIHtcbiAgICBlbmNvZGVyLmJ1ZnMucHVzaChlbmNvZGVyLmNidWYpXG4gICAgZW5jb2Rlci5jYnVmID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyTGVuICogMilcbiAgICBlbmNvZGVyLmNwb3MgPSAwXG4gIH1cbiAgZW5jb2Rlci5jYnVmW2VuY29kZXIuY3BvcysrXSA9IG51bVxufVxuXG4vKipcbiAqIFdyaXRlIG9uZSBieXRlIGF0IGEgc3BlY2lmaWMgcG9zaXRpb24uXG4gKiBQb3NpdGlvbiBtdXN0IGFscmVhZHkgYmUgd3JpdHRlbiAoaS5lLiBlbmNvZGVyLmxlbmd0aCA+IHBvcylcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBQb3NpdGlvbiB0byB3aGljaCB0byB3cml0ZSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFVuc2lnbmVkIDgtYml0IGludGVnZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHNldCA9IChlbmNvZGVyLCBwb3MsIG51bSkgPT4ge1xuICBsZXQgYnVmZmVyID0gbnVsbFxuICAvLyBpdGVyYXRlIGFsbCBidWZmZXJzIGFuZCBhZGp1c3QgcG9zaXRpb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVyLmJ1ZnMubGVuZ3RoICYmIGJ1ZmZlciA9PT0gbnVsbDsgaSsrKSB7XG4gICAgY29uc3QgYiA9IGVuY29kZXIuYnVmc1tpXVxuICAgIGlmIChwb3MgPCBiLmxlbmd0aCkge1xuICAgICAgYnVmZmVyID0gYiAvLyBmb3VuZCBidWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgcG9zIC09IGIubGVuZ3RoXG4gICAgfVxuICB9XG4gIGlmIChidWZmZXIgPT09IG51bGwpIHtcbiAgICAvLyB1c2UgY3VycmVudCBidWZmZXJcbiAgICBidWZmZXIgPSBlbmNvZGVyLmNidWZcbiAgfVxuICBidWZmZXJbcG9zXSA9IG51bVxufVxuXG4vKipcbiAqIFdyaXRlIG9uZSBieXRlIGFzIGFuIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZVVpbnQ4ID0gd3JpdGVcblxuLyoqXG4gKiBXcml0ZSBvbmUgYnl0ZSBhcyBhbiB1bnNpZ25lZCBJbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50OCA9IHNldFxuXG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFRoZSBudW1iZXIgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVVaW50MTYgPSAoZW5jb2RlciwgbnVtKSA9PiB7XG4gIHdyaXRlKGVuY29kZXIsIG51bSAmIGJpbmFyeS5CSVRTOClcbiAgd3JpdGUoZW5jb2RlciwgKG51bSA+Pj4gOCkgJiBiaW5hcnkuQklUUzgpXG59XG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50MTYgPSAoZW5jb2RlciwgcG9zLCBudW0pID0+IHtcbiAgc2V0KGVuY29kZXIsIHBvcywgbnVtICYgYmluYXJ5LkJJVFM4KVxuICBzZXQoZW5jb2RlciwgcG9zICsgMSwgKG51bSA+Pj4gOCkgJiBiaW5hcnkuQklUUzgpXG59XG5cbi8qKlxuICogV3JpdGUgdHdvIGJ5dGVzIGFzIGFuIHVuc2lnbmVkIGludGVnZXJcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDMyID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgIHdyaXRlKGVuY29kZXIsIG51bSAmIGJpbmFyeS5CSVRTOClcbiAgICBudW0gPj4+PSA4XG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSB0d28gYnl0ZXMgYXMgYW4gdW5zaWduZWQgaW50ZWdlciBpbiBiaWcgZW5kaWFuIG9yZGVyLlxuICogKG1vc3Qgc2lnbmlmaWNhbnQgYnl0ZSBmaXJzdClcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDMyQmlnRW5kaWFuID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBmb3IgKGxldCBpID0gMzsgaSA+PSAwOyBpLS0pIHtcbiAgICB3cml0ZShlbmNvZGVyLCAobnVtID4+PiAoOCAqIGkpKSAmIGJpbmFyeS5CSVRTOClcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50MzIgPSAoZW5jb2RlciwgcG9zLCBudW0pID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICBzZXQoZW5jb2RlciwgcG9zICsgaSwgbnVtICYgYmluYXJ5LkJJVFM4KVxuICAgIG51bSA+Pj49IDhcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIGEgdmFyaWFibGUgbGVuZ3RoIHVuc2lnbmVkIGludGVnZXIuIE1heCBlbmNvZGFibGUgaW50ZWdlciBpcyAyXjUzLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFRoZSBudW1iZXIgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVWYXJVaW50ID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICB3aGlsZSAobnVtID4gYmluYXJ5LkJJVFM3KSB7XG4gICAgd3JpdGUoZW5jb2RlciwgYmluYXJ5LkJJVDggfCAoYmluYXJ5LkJJVFM3ICYgbnVtKSlcbiAgICBudW0gPSBtYXRoLmZsb29yKG51bSAvIDEyOCkgLy8gc2hpZnQgPj4+IDdcbiAgfVxuICB3cml0ZShlbmNvZGVyLCBiaW5hcnkuQklUUzcgJiBudW0pXG59XG5cbi8qKlxuICogV3JpdGUgYSB2YXJpYWJsZSBsZW5ndGggaW50ZWdlci5cbiAqXG4gKiBXZSB1c2UgdGhlIDd0aCBiaXQgaW5zdGVhZCBmb3Igc2lnbmFsaW5nIHRoYXQgdGhpcyBpcyBhIG5lZ2F0aXZlIG51bWJlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVmFySW50ID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBjb25zdCBpc05lZ2F0aXZlID0gbWF0aC5pc05lZ2F0aXZlWmVybyhudW0pXG4gIGlmIChpc05lZ2F0aXZlKSB7XG4gICAgbnVtID0gLW51bVxuICB9XG4gIC8vICAgICAgICAgICAgIHwtIHdoZXRoZXIgdG8gY29udGludWUgcmVhZGluZyAgICAgICAgIHwtIHdoZXRoZXIgaXMgbmVnYXRpdmUgICAgIHwtIG51bWJlclxuICB3cml0ZShlbmNvZGVyLCAobnVtID4gYmluYXJ5LkJJVFM2ID8gYmluYXJ5LkJJVDggOiAwKSB8IChpc05lZ2F0aXZlID8gYmluYXJ5LkJJVDcgOiAwKSB8IChiaW5hcnkuQklUUzYgJiBudW0pKVxuICBudW0gPSBtYXRoLmZsb29yKG51bSAvIDY0KSAvLyBzaGlmdCA+Pj4gNlxuICAvLyBXZSBkb24ndCBuZWVkIHRvIGNvbnNpZGVyIHRoZSBjYXNlIG9mIG51bSA9PT0gMCBzbyB3ZSBjYW4gdXNlIGEgZGlmZmVyZW50XG4gIC8vIHBhdHRlcm4gaGVyZSB0aGFuIGFib3ZlLlxuICB3aGlsZSAobnVtID4gMCkge1xuICAgIHdyaXRlKGVuY29kZXIsIChudW0gPiBiaW5hcnkuQklUUzcgPyBiaW5hcnkuQklUOCA6IDApIHwgKGJpbmFyeS5CSVRTNyAmIG51bSkpXG4gICAgbnVtID0gbWF0aC5mbG9vcihudW0gLyAxMjgpIC8vIHNoaWZ0ID4+PiA3XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNhY2hlIHRvIHN0b3JlIHN0cmluZ3MgdGVtcG9yYXJpbHlcbiAqL1xuY29uc3QgX3N0ckJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KDMwMDAwKVxuY29uc3QgX21heFN0ckJTaXplID0gX3N0ckJ1ZmZlci5sZW5ndGggLyAzXG5cbi8qKlxuICogV3JpdGUgYSB2YXJpYWJsZSBsZW5ndGggc3RyaW5nLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3QgX3dyaXRlVmFyU3RyaW5nTmF0aXZlID0gKGVuY29kZXIsIHN0cikgPT4ge1xuICBpZiAoc3RyLmxlbmd0aCA8IF9tYXhTdHJCU2l6ZSkge1xuICAgIC8vIFdlIGNhbiBlbmNvZGUgdGhlIHN0cmluZyBpbnRvIHRoZSBleGlzdGluZyBidWZmZXJcbiAgICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgIGNvbnN0IHdyaXR0ZW4gPSBzdHJpbmcudXRmOFRleHRFbmNvZGVyLmVuY29kZUludG8oc3RyLCBfc3RyQnVmZmVyKS53cml0dGVuIHx8IDBcbiAgICB3cml0ZVZhclVpbnQoZW5jb2Rlciwgd3JpdHRlbilcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdyaXR0ZW47IGkrKykge1xuICAgICAgd3JpdGUoZW5jb2RlciwgX3N0ckJ1ZmZlcltpXSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgd3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIHN0cmluZy5lbmNvZGVVdGY4KHN0cikpXG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSBhIHZhcmlhYmxlIGxlbmd0aCBzdHJpbmcuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBfd3JpdGVWYXJTdHJpbmdQb2x5ZmlsbCA9IChlbmNvZGVyLCBzdHIpID0+IHtcbiAgY29uc3QgZW5jb2RlZFN0cmluZyA9IHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzdHIpKVxuICBjb25zdCBsZW4gPSBlbmNvZGVkU3RyaW5nLmxlbmd0aFxuICB3cml0ZVZhclVpbnQoZW5jb2RlciwgbGVuKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgd3JpdGUoZW5jb2RlciwgLyoqIEB0eXBlIHtudW1iZXJ9ICovIChlbmNvZGVkU3RyaW5nLmNvZGVQb2ludEF0KGkpKSlcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIGEgdmFyaWFibGUgbGVuZ3RoIHN0cmluZy5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCB3cml0ZVZhclN0cmluZyA9IChzdHJpbmcudXRmOFRleHRFbmNvZGVyICYmIC8qKiBAdHlwZSB7YW55fSAqLyAoc3RyaW5nLnV0ZjhUZXh0RW5jb2RlcikuZW5jb2RlSW50bykgPyBfd3JpdGVWYXJTdHJpbmdOYXRpdmUgOiBfd3JpdGVWYXJTdHJpbmdQb2x5ZmlsbFxuXG4vKipcbiAqIFdyaXRlIGEgc3RyaW5nIHRlcm1pbmF0ZWQgYnkgYSBzcGVjaWFsIGJ5dGUgc2VxdWVuY2UuIFRoaXMgaXMgbm90IHZlcnkgcGVyZm9ybWFudCBhbmQgaXNcbiAqIGdlbmVyYWxseSBkaXNjb3VyYWdlZC4gSG93ZXZlciwgdGhlIHJlc3VsdGluZyBieXRlIGFycmF5cyBhcmUgbGV4aW9ncmFwaGljYWxseSBvcmRlcmVkIHdoaWNoXG4gKiBtYWtlcyB0aGlzIGEgbmljZSBmZWF0dXJlIGZvciBkYXRhYmFzZXMuXG4gKlxuICogVGhlIHN0cmluZyB3aWxsIGJlIGVuY29kZWQgdXNpbmcgdXRmOCBhbmQgdGhlbiB0ZXJtaW5hdGVkIGFuZCBlc2NhcGVkIHVzaW5nIHdyaXRlVGVybWluYXRpbmdVaW50OEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVUZXJtaW5hdGVkU3RyaW5nID0gKGVuY29kZXIsIHN0cikgPT5cbiAgd3JpdGVUZXJtaW5hdGVkVWludDhBcnJheShlbmNvZGVyLCBzdHJpbmcuZW5jb2RlVXRmOChzdHIpKVxuXG4vKipcbiAqIFdyaXRlIGEgdGVybWluYXRpbmcgVWludDhBcnJheS4gTm90ZSB0aGF0IHRoaXMgaXMgbm90IHBlcmZvcm1hbnQgYW5kIGlzIGdlbmVyYWxseVxuICogZGlzY291cmFnZWQuIFRoZXJlIGFyZSBmZXcgc2l0dWF0aW9ucyB3aGVuIHRoaXMgaXMgbmVlZGVkLlxuICpcbiAqIFdlIHVzZSAweDAgYXMgYSB0ZXJtaW5hdGluZyBjaGFyYWN0ZXIuIDB4MSBzZXJ2ZXMgYXMgYW4gZXNjYXBlIGNoYXJhY3RlciBmb3IgMHgwIGFuZCAweDEuXG4gKlxuICogRXhhbXBsZTogWzAsMSwyXSBpcyBlbmNvZGVkIHRvIFsxLDAsMSwxLDIsMF0uIDB4MCwgYW5kIDB4MSBuZWVkZWQgdG8gYmUgZXNjYXBlZCB1c2luZyAweDEuIFRoZW5cbiAqIHRoZSByZXN1bHQgaXMgdGVybWluYXRlZCB1c2luZyB0aGUgMHgwIGNoYXJhY3Rlci5cbiAqXG4gKiBUaGlzIGlzIGJhc2ljYWxseSBob3cgbWFueSBzeXN0ZW1zIGltcGxlbWVudCBudWxsIHRlcm1pbmF0ZWQgc3RyaW5ncy4gSG93ZXZlciwgd2UgdXNlIGFuIGVzY2FwZVxuICogY2hhcmFjdGVyIDB4MSB0byBhdm9pZCBpc3N1ZXMgYW5kIHBvdGVuaWFsIGF0dGFja3Mgb24gb3VyIGRhdGFiYXNlIChpZiB0aGlzIGlzIHVzZWQgYXMgYSBrZXlcbiAqIGVuY29kZXIgZm9yIE5vU3FsIGRhdGFiYXNlcykuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVUZXJtaW5hdGVkVWludDhBcnJheSA9IChlbmNvZGVyLCBidWYpID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBidWYubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBiID0gYnVmW2ldXG4gICAgaWYgKGIgPT09IDAgfHwgYiA9PT0gMSkge1xuICAgICAgd3JpdGUoZW5jb2RlciwgMSlcbiAgICB9XG4gICAgd3JpdGUoZW5jb2RlciwgYnVmW2ldKVxuICB9XG4gIHdyaXRlKGVuY29kZXIsIDApXG59XG5cbi8qKlxuICogV3JpdGUgdGhlIGNvbnRlbnQgb2YgYW5vdGhlciBFbmNvZGVyLlxuICpcbiAqIEBUT0RPOiBjYW4gYmUgaW1wcm92ZWQhXG4gKiAgICAgICAgLSBOb3RlOiBTaG91bGQgY29uc2lkZXIgdGhhdCB3aGVuIGFwcGVuZGluZyBhIGxvdCBvZiBzbWFsbCBFbmNvZGVycywgd2Ugc2hvdWxkIHJhdGhlciBjbG9uZSB0aGFuIHJlZmVyZW5jaW5nIHRoZSBvbGQgc3RydWN0dXJlLlxuICogICAgICAgICAgICAgICAgRW5jb2RlcnMgc3RhcnQgd2l0aCBhIHJhdGhlciBiaWcgaW5pdGlhbCBidWZmZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXIgVGhlIGVuVWludDhBcnJcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gYXBwZW5kIFRoZSBCaW5hcnlFbmNvZGVyIHRvIGJlIHdyaXR0ZW4uXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZUJpbmFyeUVuY29kZXIgPSAoZW5jb2RlciwgYXBwZW5kKSA9PiB3cml0ZVVpbnQ4QXJyYXkoZW5jb2RlciwgdG9VaW50OEFycmF5KGFwcGVuZCkpXG5cbi8qKlxuICogQXBwZW5kIGZpeGVkLWxlbmd0aCBVaW50OEFycmF5IHRvIHRoZSBlbmNvZGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDhBcnJheSA9IChlbmNvZGVyLCB1aW50OEFycmF5KSA9PiB7XG4gIGNvbnN0IGJ1ZmZlckxlbiA9IGVuY29kZXIuY2J1Zi5sZW5ndGhcbiAgY29uc3QgY3BvcyA9IGVuY29kZXIuY3Bvc1xuICBjb25zdCBsZWZ0Q29weUxlbiA9IG1hdGgubWluKGJ1ZmZlckxlbiAtIGNwb3MsIHVpbnQ4QXJyYXkubGVuZ3RoKVxuICBjb25zdCByaWdodENvcHlMZW4gPSB1aW50OEFycmF5Lmxlbmd0aCAtIGxlZnRDb3B5TGVuXG4gIGVuY29kZXIuY2J1Zi5zZXQodWludDhBcnJheS5zdWJhcnJheSgwLCBsZWZ0Q29weUxlbiksIGNwb3MpXG4gIGVuY29kZXIuY3BvcyArPSBsZWZ0Q29weUxlblxuICBpZiAocmlnaHRDb3B5TGVuID4gMCkge1xuICAgIC8vIFN0aWxsIHNvbWV0aGluZyB0byB3cml0ZSwgd3JpdGUgcmlnaHQgaGFsZi4uXG4gICAgLy8gQXBwZW5kIG5ldyBidWZmZXJcbiAgICBlbmNvZGVyLmJ1ZnMucHVzaChlbmNvZGVyLmNidWYpXG4gICAgLy8gbXVzdCBoYXZlIGF0IGxlYXN0IHNpemUgb2YgcmVtYWluaW5nIGJ1ZmZlclxuICAgIGVuY29kZXIuY2J1ZiA9IG5ldyBVaW50OEFycmF5KG1hdGgubWF4KGJ1ZmZlckxlbiAqIDIsIHJpZ2h0Q29weUxlbikpXG4gICAgLy8gY29weSBhcnJheVxuICAgIGVuY29kZXIuY2J1Zi5zZXQodWludDhBcnJheS5zdWJhcnJheShsZWZ0Q29weUxlbikpXG4gICAgZW5jb2Rlci5jcG9zID0gcmlnaHRDb3B5TGVuXG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmQgYW4gVWludDhBcnJheSB0byBFbmNvZGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVmFyVWludDhBcnJheSA9IChlbmNvZGVyLCB1aW50OEFycmF5KSA9PiB7XG4gIHdyaXRlVmFyVWludChlbmNvZGVyLCB1aW50OEFycmF5LmJ5dGVMZW5ndGgpXG4gIHdyaXRlVWludDhBcnJheShlbmNvZGVyLCB1aW50OEFycmF5KVxufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBEYXRhVmlldyBvZiB0aGUgbmV4dCBgbGVuYCBieXRlcy4gVXNlIGl0IHRvIHdyaXRlIGRhdGEgYWZ0ZXJcbiAqIGNhbGxpbmcgdGhpcyBmdW5jdGlvbi5cbiAqXG4gKiBgYGBqc1xuICogLy8gd3JpdGUgZmxvYXQzMiB1c2luZyBEYXRhVmlld1xuICogY29uc3QgZHYgPSB3cml0ZU9uRGF0YVZpZXcoZW5jb2RlciwgNClcbiAqIGR2LnNldEZsb2F0MzIoMCwgMS4xKVxuICogLy8gcmVhZCBmbG9hdDMyIHVzaW5nIERhdGFWaWV3XG4gKiBjb25zdCBkdiA9IHJlYWRGcm9tRGF0YVZpZXcoZW5jb2RlciwgNClcbiAqIGR2LmdldEZsb2F0MzIoMCkgLy8gPT4gMS4xMDAwMDAwMjM4NDE4NTggKGxlYXZpbmcgaXQgdG8gdGhlIHJlYWRlciB0byBmaW5kIG91dCB3aHkgdGhpcyBpcyB0aGUgY29ycmVjdCByZXN1bHQpXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAqIEByZXR1cm4ge0RhdGFWaWV3fVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVPbkRhdGFWaWV3ID0gKGVuY29kZXIsIGxlbikgPT4ge1xuICB2ZXJpZnlMZW4oZW5jb2RlciwgbGVuKVxuICBjb25zdCBkdmlldyA9IG5ldyBEYXRhVmlldyhlbmNvZGVyLmNidWYuYnVmZmVyLCBlbmNvZGVyLmNwb3MsIGxlbilcbiAgZW5jb2Rlci5jcG9zICs9IGxlblxuICByZXR1cm4gZHZpZXdcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlRmxvYXQzMiA9IChlbmNvZGVyLCBudW0pID0+IHdyaXRlT25EYXRhVmlldyhlbmNvZGVyLCA0KS5zZXRGbG9hdDMyKDAsIG51bSwgZmFsc2UpXG5cbi8qKlxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZUZsb2F0NjQgPSAoZW5jb2RlciwgbnVtKSA9PiB3cml0ZU9uRGF0YVZpZXcoZW5jb2RlciwgOCkuc2V0RmxvYXQ2NCgwLCBudW0sIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtiaWdpbnR9IG51bVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVCaWdJbnQ2NCA9IChlbmNvZGVyLCBudW0pID0+IC8qKiBAdHlwZSB7YW55fSAqLyAod3JpdGVPbkRhdGFWaWV3KGVuY29kZXIsIDgpKS5zZXRCaWdJbnQ2NCgwLCBudW0sIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtiaWdpbnR9IG51bVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVCaWdVaW50NjQgPSAoZW5jb2RlciwgbnVtKSA9PiAvKiogQHR5cGUge2FueX0gKi8gKHdyaXRlT25EYXRhVmlldyhlbmNvZGVyLCA4KSkuc2V0QmlnVWludDY0KDAsIG51bSwgZmFsc2UpXG5cbmNvbnN0IGZsb2F0VGVzdEJlZCA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoNCkpXG4vKipcbiAqIENoZWNrIGlmIGEgbnVtYmVyIGNhbiBiZSBlbmNvZGVkIGFzIGEgMzIgYml0IGZsb2F0LlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGlzRmxvYXQzMiA9IG51bSA9PiB7XG4gIGZsb2F0VGVzdEJlZC5zZXRGbG9hdDMyKDAsIG51bSlcbiAgcmV0dXJuIGZsb2F0VGVzdEJlZC5nZXRGbG9hdDMyKDApID09PSBudW1cbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7QXJyYXk8QW55RW5jb2RhYmxlPn0gQW55RW5jb2RhYmxlQXJyYXlcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHt1bmRlZmluZWR8bnVsbHxudW1iZXJ8YmlnaW50fGJvb2xlYW58c3RyaW5nfHtbazpzdHJpbmddOkFueUVuY29kYWJsZX18QW55RW5jb2RhYmxlQXJyYXl8VWludDhBcnJheX0gQW55RW5jb2RhYmxlXG4gKi9cblxuLyoqXG4gKiBFbmNvZGUgZGF0YSB3aXRoIGVmZmljaWVudCBiaW5hcnkgZm9ybWF0LlxuICpcbiAqIERpZmZlcmVuY2VzIHRvIEpTT046XG4gKiBcdTIwMjIgVHJhbnNmb3JtcyBkYXRhIHRvIGEgYmluYXJ5IGZvcm1hdCAobm90IHRvIGEgc3RyaW5nKVxuICogXHUyMDIyIEVuY29kZXMgdW5kZWZpbmVkLCBOYU4sIGFuZCBBcnJheUJ1ZmZlciAodGhlc2UgY2FuJ3QgYmUgcmVwcmVzZW50ZWQgaW4gSlNPTilcbiAqIFx1MjAyMiBOdW1iZXJzIGFyZSBlZmZpY2llbnRseSBlbmNvZGVkIGVpdGhlciBhcyBhIHZhcmlhYmxlIGxlbmd0aCBpbnRlZ2VyLCBhcyBhXG4gKiAgIDMyIGJpdCBmbG9hdCwgYXMgYSA2NCBiaXQgZmxvYXQsIG9yIGFzIGEgNjQgYml0IGJpZ2ludC5cbiAqXG4gKiBFbmNvZGluZyB0YWJsZTpcbiAqXG4gKiB8IERhdGEgVHlwZSAgICAgICAgICAgfCBQcmVmaXggICB8IEVuY29kaW5nIE1ldGhvZCAgICB8IENvbW1lbnQgfFxuICogfCAtLS0tLS0tLS0tLS0tLS0tLS0tIHwgLS0tLS0tLS0gfCAtLS0tLS0tLS0tLS0tLS0tLS0gfCAtLS0tLS0tIHxcbiAqIHwgdW5kZWZpbmVkICAgICAgICAgICB8IDEyNyAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgRnVuY3Rpb25zLCBzeW1ib2wsIGFuZCBldmVyeXRoaW5nIHRoYXQgY2Fubm90IGJlIGlkZW50aWZpZWQgaXMgZW5jb2RlZCBhcyB1bmRlZmluZWQgfFxuICogfCBudWxsICAgICAgICAgICAgICAgIHwgMTI2ICAgICAgfCAgICAgICAgICAgICAgICAgICAgfCB8XG4gKiB8IGludGVnZXIgICAgICAgICAgICAgfCAxMjUgICAgICB8IHdyaXRlVmFySW50ICAgICAgICB8IE9ubHkgZW5jb2RlcyAzMiBiaXQgc2lnbmVkIGludGVnZXJzIHxcbiAqIHwgZmxvYXQzMiAgICAgICAgICAgICB8IDEyNCAgICAgIHwgd3JpdGVGbG9hdDMyICAgICAgIHwgfFxuICogfCBmbG9hdDY0ICAgICAgICAgICAgIHwgMTIzICAgICAgfCB3cml0ZUZsb2F0NjQgICAgICAgfCB8XG4gKiB8IGJpZ2ludCAgICAgICAgICAgICAgfCAxMjIgICAgICB8IHdyaXRlQmlnSW50NjQgICAgICB8IHxcbiAqIHwgYm9vbGVhbiAoZmFsc2UpICAgICB8IDEyMSAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgVHJ1ZSBhbmQgZmFsc2UgYXJlIGRpZmZlcmVudCBkYXRhIHR5cGVzIHNvIHdlIHNhdmUgdGhlIGZvbGxvd2luZyBieXRlIHxcbiAqIHwgYm9vbGVhbiAodHJ1ZSkgICAgICB8IDEyMCAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgLSAwYjAxMTExMDAwIHNvIHRoZSBsYXN0IGJpdCBkZXRlcm1pbmVzIHdoZXRoZXIgdHJ1ZSBvciBmYWxzZSB8XG4gKiB8IHN0cmluZyAgICAgICAgICAgICAgfCAxMTkgICAgICB8IHdyaXRlVmFyU3RyaW5nICAgICB8IHxcbiAqIHwgb2JqZWN0PHN0cmluZyxhbnk+ICB8IDExOCAgICAgIHwgY3VzdG9tICAgICAgICAgICAgIHwgV3JpdGVzIHtsZW5ndGh9IHRoZW4ge2xlbmd0aH0ga2V5LXZhbHVlIHBhaXJzIHxcbiAqIHwgYXJyYXk8YW55PiAgICAgICAgICB8IDExNyAgICAgIHwgY3VzdG9tICAgICAgICAgICAgIHwgV3JpdGVzIHtsZW5ndGh9IHRoZW4ge2xlbmd0aH0ganNvbiB2YWx1ZXMgfFxuICogfCBVaW50OEFycmF5ICAgICAgICAgIHwgMTE2ICAgICAgfCB3cml0ZVZhclVpbnQ4QXJyYXkgfCBXZSB1c2UgVWludDhBcnJheSBmb3IgYW55IGtpbmQgb2YgYmluYXJ5IGRhdGEgfFxuICpcbiAqIFJlYXNvbnMgZm9yIHRoZSBkZWNyZWFzaW5nIHByZWZpeDpcbiAqIFdlIG5lZWQgdGhlIGZpcnN0IGJpdCBmb3IgZXh0ZW5kYWJpbGl0eSAobGF0ZXIgd2UgbWF5IHdhbnQgdG8gZW5jb2RlIHRoZVxuICogcHJlZml4IHdpdGggd3JpdGVWYXJVaW50KS4gVGhlIHJlbWFpbmluZyA3IGJpdHMgYXJlIGRpdmlkZWQgYXMgZm9sbG93czpcbiAqIFswLTMwXSAgIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGRhdGEgcmFuZ2UgaXMgdXNlZCBmb3IgY3VzdG9tIHB1cnBvc2VzXG4gKiAgICAgICAgICAoZGVmaW5lZCBieSB0aGUgZnVuY3Rpb24gdGhhdCB1c2VzIHRoaXMgbGlicmFyeSlcbiAqIFszMS0xMjddIHRoZSBlbmQgb2YgdGhlIGRhdGEgcmFuZ2UgaXMgdXNlZCBmb3IgZGF0YSBlbmNvZGluZyBieVxuICogICAgICAgICAgbGliMC9lbmNvZGluZy5qc1xuICpcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtBbnlFbmNvZGFibGV9IGRhdGFcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlQW55ID0gKGVuY29kZXIsIGRhdGEpID0+IHtcbiAgc3dpdGNoICh0eXBlb2YgZGF0YSkge1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAvLyBUWVBFIDExOTogU1RSSU5HXG4gICAgICB3cml0ZShlbmNvZGVyLCAxMTkpXG4gICAgICB3cml0ZVZhclN0cmluZyhlbmNvZGVyLCBkYXRhKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgaWYgKG51bWJlci5pc0ludGVnZXIoZGF0YSkgJiYgbWF0aC5hYnMoZGF0YSkgPD0gYmluYXJ5LkJJVFMzMSkge1xuICAgICAgICAvLyBUWVBFIDEyNTogSU5URUdFUlxuICAgICAgICB3cml0ZShlbmNvZGVyLCAxMjUpXG4gICAgICAgIHdyaXRlVmFySW50KGVuY29kZXIsIGRhdGEpXG4gICAgICB9IGVsc2UgaWYgKGlzRmxvYXQzMihkYXRhKSkge1xuICAgICAgICAvLyBUWVBFIDEyNDogRkxPQVQzMlxuICAgICAgICB3cml0ZShlbmNvZGVyLCAxMjQpXG4gICAgICAgIHdyaXRlRmxvYXQzMihlbmNvZGVyLCBkYXRhKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVFlQRSAxMjM6IEZMT0FUNjRcbiAgICAgICAgd3JpdGUoZW5jb2RlciwgMTIzKVxuICAgICAgICB3cml0ZUZsb2F0NjQoZW5jb2RlciwgZGF0YSlcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmlnaW50JzpcbiAgICAgIC8vIFRZUEUgMTIyOiBCaWdJbnRcbiAgICAgIHdyaXRlKGVuY29kZXIsIDEyMilcbiAgICAgIHdyaXRlQmlnSW50NjQoZW5jb2RlciwgZGF0YSlcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgIGlmIChkYXRhID09PSBudWxsKSB7XG4gICAgICAgIC8vIFRZUEUgMTI2OiBudWxsXG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDEyNilcbiAgICAgIH0gZWxzZSBpZiAoYXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAvLyBUWVBFIDExNzogQXJyYXlcbiAgICAgICAgd3JpdGUoZW5jb2RlciwgMTE3KVxuICAgICAgICB3cml0ZVZhclVpbnQoZW5jb2RlciwgZGF0YS5sZW5ndGgpXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHdyaXRlQW55KGVuY29kZXIsIGRhdGFbaV0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgLy8gVFlQRSAxMTY6IEFycmF5QnVmZmVyXG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDExNilcbiAgICAgICAgd3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIGRhdGEpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUWVBFIDExODogT2JqZWN0XG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDExOClcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGRhdGEpXG4gICAgICAgIHdyaXRlVmFyVWludChlbmNvZGVyLCBrZXlzLmxlbmd0aClcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0ga2V5c1tpXVxuICAgICAgICAgIHdyaXRlVmFyU3RyaW5nKGVuY29kZXIsIGtleSlcbiAgICAgICAgICB3cml0ZUFueShlbmNvZGVyLCBkYXRhW2tleV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAvLyBUWVBFIDEyMC8xMjE6IGJvb2xlYW4gKHRydWUvZmFsc2UpXG4gICAgICB3cml0ZShlbmNvZGVyLCBkYXRhID8gMTIwIDogMTIxKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gVFlQRSAxMjc6IHVuZGVmaW5lZFxuICAgICAgd3JpdGUoZW5jb2RlciwgMTI3KVxuICB9XG59XG5cbi8qKlxuICogTm93IGNvbWUgYSBmZXcgc3RhdGVmdWwgZW5jb2RlciB0aGF0IGhhdmUgdGhlaXIgb3duIGNsYXNzZXMuXG4gKi9cblxuLyoqXG4gKiBCYXNpYyBSdW4gTGVuZ3RoIEVuY29kZXIgLSBhIGJhc2ljIGNvbXByZXNzaW9uIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIEVuY29kZXMgWzEsMSwxLDddIHRvIFsxLDMsNywxXSAoMyB0aW1lcyAxLCAxIHRpbWUgNykuIFRoaXMgZW5jb2RlciBtaWdodCBkbyBtb3JlIGhhcm0gdGhhbiBnb29kIGlmIHRoZXJlIGFyZSBhIGxvdCBvZiB2YWx1ZXMgdGhhdCBhcmUgbm90IHJlcGVhdGVkLlxuICpcbiAqIEl0IHdhcyBvcmlnaW5hbGx5IHVzZWQgZm9yIGltYWdlIGNvbXByZXNzaW9uLiBDb29sIC4uIGFydGljbGUgaHR0cDovL2NzYnJ1Y2UuY29tL2NibS90cmFuc2FjdG9yL3BkZnMvdHJhbnNfdjdfaTA2LnBkZlxuICpcbiAqIEBub3RlIFQgbXVzdCBub3QgYmUgbnVsbCFcbiAqXG4gKiBAdGVtcGxhdGUgVFxuICovXG5leHBvcnQgY2xhc3MgUmxlRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtmdW5jdGlvbihFbmNvZGVyLCBUKTp2b2lkfSB3cml0ZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yICh3cml0ZXIpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogVGhlIHdyaXRlclxuICAgICAqL1xuICAgIHRoaXMudyA9IHdyaXRlclxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7VHxudWxsfVxuICAgICAqL1xuICAgIHRoaXMucyA9IG51bGxcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VH0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zID09PSB2KSB7XG4gICAgICB0aGlzLmNvdW50KytcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuY291bnQgPiAwKSB7XG4gICAgICAgIC8vIGZsdXNoIGNvdW50ZXIsIHVubGVzcyB0aGlzIGlzIHRoZSBmaXJzdCB2YWx1ZSAoY291bnQgPSAwKVxuICAgICAgICB3cml0ZVZhclVpbnQodGhpcywgdGhpcy5jb3VudCAtIDEpIC8vIHNpbmNlIGNvdW50IGlzIGFsd2F5cyA+IDAsIHdlIGNhbiBkZWNyZW1lbnQgYnkgb25lLiBub24tc3RhbmRhcmQgZW5jb2RpbmcgZnR3XG4gICAgICB9XG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgLy8gd3JpdGUgZmlyc3QgdmFsdWVcbiAgICAgIHRoaXMudyh0aGlzLCB2KVxuICAgICAgdGhpcy5zID0gdlxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJhc2ljIGRpZmYgZGVjb2RlciB1c2luZyB2YXJpYWJsZSBsZW5ndGggZW5jb2RpbmcuXG4gKlxuICogRW5jb2RlcyB0aGUgdmFsdWVzIFszLCAxMTAwLCAxMTAxLCAxMDUwLCAwXSB0byBbMywgMTA5NywgMSwgLTUxLCAtMTA1MF0gdXNpbmcgd3JpdGVWYXJJbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnREaWZmRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc3RhcnQpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQ3VycmVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gc3RhcnRcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICB3cml0ZVZhckludCh0aGlzLCB2IC0gdGhpcy5zKVxuICAgIHRoaXMucyA9IHZcbiAgfVxufVxuXG4vKipcbiAqIEEgY29tYmluYXRpb24gb2YgSW50RGlmZkVuY29kZXIgYW5kIFJsZUVuY29kZXIuXG4gKlxuICogQmFzaWNhbGx5IGZpcnN0IHdyaXRlcyB0aGUgSW50RGlmZkVuY29kZXIgYW5kIHRoZW4gY291bnRzIGR1cGxpY2F0ZSBkaWZmcyB1c2luZyBSbGVFbmNvZGluZy5cbiAqXG4gKiBFbmNvZGVzIHRoZSB2YWx1ZXMgWzEsMSwxLDIsMyw0LDUsNl0gYXMgWzEsMSwwLDIsMSw1XSAoUkxFKFsxLDAsMCwxLDEsMSwxLDFdKSBcdTIxRDIgUmxlSW50RGlmZlsxLDEsMCwyLDEsNV0pXG4gKi9cbmV4cG9ydCBjbGFzcyBSbGVJbnREaWZmRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc3RhcnQpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQ3VycmVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gc3RhcnRcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2XG4gICAqL1xuICB3cml0ZSAodikge1xuICAgIGlmICh0aGlzLnMgPT09IHYgJiYgdGhpcy5jb3VudCA+IDApIHtcbiAgICAgIHRoaXMuY291bnQrK1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5jb3VudCA+IDApIHtcbiAgICAgICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgICAgIHdyaXRlVmFyVWludCh0aGlzLCB0aGlzLmNvdW50IC0gMSkgLy8gc2luY2UgY291bnQgaXMgYWx3YXlzID4gMCwgd2UgY2FuIGRlY3JlbWVudCBieSBvbmUuIG5vbi1zdGFuZGFyZCBlbmNvZGluZyBmdHdcbiAgICAgIH1cbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICAvLyB3cml0ZSBmaXJzdCB2YWx1ZVxuICAgICAgd3JpdGVWYXJJbnQodGhpcywgdiAtIHRoaXMucylcbiAgICAgIHRoaXMucyA9IHZcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnRPcHRSbGVFbmNvZGVyfSBlbmNvZGVyXG4gKi9cbmNvbnN0IGZsdXNoVWludE9wdFJsZUVuY29kZXIgPSBlbmNvZGVyID0+IHtcbiAgaWYgKGVuY29kZXIuY291bnQgPiAwKSB7XG4gICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgLy8gY2FzZSAxOiBqdXN0IGEgc2luZ2xlIHZhbHVlLiBzZXQgc2lnbiB0byBwb3NpdGl2ZVxuICAgIC8vIGNhc2UgMjogd3JpdGUgc2V2ZXJhbCB2YWx1ZXMuIHNldCBzaWduIHRvIG5lZ2F0aXZlIHRvIGluZGljYXRlIHRoYXQgdGhlcmUgaXMgYSBsZW5ndGggY29taW5nXG4gICAgd3JpdGVWYXJJbnQoZW5jb2Rlci5lbmNvZGVyLCBlbmNvZGVyLmNvdW50ID09PSAxID8gZW5jb2Rlci5zIDogLWVuY29kZXIucylcbiAgICBpZiAoZW5jb2Rlci5jb3VudCA+IDEpIHtcbiAgICAgIHdyaXRlVmFyVWludChlbmNvZGVyLmVuY29kZXIsIGVuY29kZXIuY291bnQgLSAyKSAvLyBzaW5jZSBjb3VudCBpcyBhbHdheXMgPiAxLCB3ZSBjYW4gZGVjcmVtZW50IGJ5IG9uZS4gbm9uLXN0YW5kYXJkIGVuY29kaW5nIGZ0d1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE9wdGltaXplZCBSbGUgZW5jb2RlciB0aGF0IGRvZXMgbm90IHN1ZmZlciBmcm9tIHRoZSBtZW50aW9uZWQgcHJvYmxlbSBvZiB0aGUgYmFzaWMgUmxlIGVuY29kZXIuXG4gKlxuICogSW50ZXJuYWxseSB1c2VzIFZhckludCBlbmNvZGVyIHRvIHdyaXRlIHVuc2lnbmVkIGludGVnZXJzLiBJZiB0aGUgaW5wdXQgb2NjdXJzIG11bHRpcGxlIHRpbWVzLCB3ZSB3cml0ZVxuICogd3JpdGUgaXQgYXMgYSBuZWdhdGl2ZSBudW1iZXIuIFRoZSBVaW50T3B0UmxlRGVjb2RlciB0aGVuIHVuZGVyc3RhbmRzIHRoYXQgaXQgbmVlZHMgdG8gcmVhZCBhIGNvdW50LlxuICpcbiAqIEVuY29kZXMgWzEsMiwzLDMsM10gYXMgWzEsMiwtMywzXSAob25jZSAxLCBvbmNlIDIsIHRocmVlIHRpbWVzIDMpXG4gKi9cbmV4cG9ydCBjbGFzcyBVaW50T3B0UmxlRW5jb2RlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmVuY29kZXIgPSBuZXcgRW5jb2RlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zID09PSB2KSB7XG4gICAgICB0aGlzLmNvdW50KytcbiAgICB9IGVsc2Uge1xuICAgICAgZmx1c2hVaW50T3B0UmxlRW5jb2Rlcih0aGlzKVxuICAgICAgdGhpcy5jb3VudCA9IDFcbiAgICAgIHRoaXMucyA9IHZcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmx1c2ggdGhlIGVuY29kZWQgc3RhdGUgYW5kIHRyYW5zZm9ybSB0aGlzIHRvIGEgVWludDhBcnJheS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoaXMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIG9uY2UuXG4gICAqL1xuICB0b1VpbnQ4QXJyYXkgKCkge1xuICAgIGZsdXNoVWludE9wdFJsZUVuY29kZXIodGhpcylcbiAgICByZXR1cm4gdG9VaW50OEFycmF5KHRoaXMuZW5jb2RlcilcbiAgfVxufVxuXG4vKipcbiAqIEluY3JlYXNpbmcgVWludCBPcHRpbWl6ZWQgUkxFIEVuY29kZXJcbiAqXG4gKiBUaGUgUkxFIGVuY29kZXIgY291bnRzIHRoZSBudW1iZXIgb2Ygc2FtZSBvY2N1cmVuY2VzIG9mIHRoZSBzYW1lIHZhbHVlLlxuICogVGhlIEluY1VpbnRPcHRSbGUgZW5jb2RlciBjb3VudHMgaWYgdGhlIHZhbHVlIGluY3JlYXNlcy5cbiAqIEkuZS4gNywgOCwgOSwgMTAgd2lsbCBiZSBlbmNvZGVkIGFzIFstNywgNF0uIDEsIDMsIDUgd2lsbCBiZSBlbmNvZGVkXG4gKiBhcyBbMSwgMywgNV0uXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmNVaW50T3B0UmxlRW5jb2RlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmVuY29kZXIgPSBuZXcgRW5jb2RlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zICsgdGhpcy5jb3VudCA9PT0gdikge1xuICAgICAgdGhpcy5jb3VudCsrXG4gICAgfSBlbHNlIHtcbiAgICAgIGZsdXNoVWludE9wdFJsZUVuY29kZXIodGhpcylcbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICB0aGlzLnMgPSB2XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZsdXNoIHRoZSBlbmNvZGVkIHN0YXRlIGFuZCB0cmFuc2Zvcm0gdGhpcyB0byBhIFVpbnQ4QXJyYXkuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGlzIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBvbmNlLlxuICAgKi9cbiAgdG9VaW50OEFycmF5ICgpIHtcbiAgICBmbHVzaFVpbnRPcHRSbGVFbmNvZGVyKHRoaXMpXG4gICAgcmV0dXJuIHRvVWludDhBcnJheSh0aGlzLmVuY29kZXIpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0ludERpZmZPcHRSbGVFbmNvZGVyfSBlbmNvZGVyXG4gKi9cbmNvbnN0IGZsdXNoSW50RGlmZk9wdFJsZUVuY29kZXIgPSBlbmNvZGVyID0+IHtcbiAgaWYgKGVuY29kZXIuY291bnQgPiAwKSB7XG4gICAgLy8gICAgICAgICAgMzEgYml0IG1ha2luZyB1cCB0aGUgZGlmZiB8IHdldGhlciB0byB3cml0ZSB0aGUgY291bnRlclxuICAgIC8vIGNvbnN0IGVuY29kZWREaWZmID0gZW5jb2Rlci5kaWZmIDw8IDEgfCAoZW5jb2Rlci5jb3VudCA9PT0gMSA/IDAgOiAxKVxuICAgIGNvbnN0IGVuY29kZWREaWZmID0gZW5jb2Rlci5kaWZmICogMiArIChlbmNvZGVyLmNvdW50ID09PSAxID8gMCA6IDEpXG4gICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgLy8gY2FzZSAxOiBqdXN0IGEgc2luZ2xlIHZhbHVlLiBzZXQgZmlyc3QgYml0IHRvIHBvc2l0aXZlXG4gICAgLy8gY2FzZSAyOiB3cml0ZSBzZXZlcmFsIHZhbHVlcy4gc2V0IGZpcnN0IGJpdCB0byBuZWdhdGl2ZSB0byBpbmRpY2F0ZSB0aGF0IHRoZXJlIGlzIGEgbGVuZ3RoIGNvbWluZ1xuICAgIHdyaXRlVmFySW50KGVuY29kZXIuZW5jb2RlciwgZW5jb2RlZERpZmYpXG4gICAgaWYgKGVuY29kZXIuY291bnQgPiAxKSB7XG4gICAgICB3cml0ZVZhclVpbnQoZW5jb2Rlci5lbmNvZGVyLCBlbmNvZGVyLmNvdW50IC0gMikgLy8gc2luY2UgY291bnQgaXMgYWx3YXlzID4gMSwgd2UgY2FuIGRlY3JlbWVudCBieSBvbmUuIG5vbi1zdGFuZGFyZCBlbmNvZGluZyBmdHdcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNvbWJpbmF0aW9uIG9mIHRoZSBJbnREaWZmRW5jb2RlciBhbmQgdGhlIFVpbnRPcHRSbGVFbmNvZGVyLlxuICpcbiAqIFRoZSBjb3VudCBhcHByb2FjaCBpcyBzaW1pbGFyIHRvIHRoZSBVaW50RGlmZk9wdFJsZUVuY29kZXIsIGJ1dCBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBuZWdhdGl2ZSBiaXRmbGFnLCBpdCBlbmNvZGVzXG4gKiBpbiB0aGUgTFNCIHdoZXRoZXIgYSBjb3VudCBpcyB0byBiZSByZWFkLiBUaGVyZWZvcmUgdGhpcyBFbmNvZGVyIG9ubHkgc3VwcG9ydHMgMzEgYml0IGludGVnZXJzIVxuICpcbiAqIEVuY29kZXMgWzEsIDIsIDMsIDJdIGFzIFszLCAxLCA2LCAtMV0gKG1vcmUgc3BlY2lmaWNhbGx5IFsoMSA8PCAxKSB8IDEsICgzIDw8IDApIHwgMCwgLTFdKVxuICpcbiAqIEludGVybmFsbHkgdXNlcyB2YXJpYWJsZSBsZW5ndGggZW5jb2RpbmcuIENvbnRyYXJ5IHRvIG5vcm1hbCBVaW50VmFyIGVuY29kaW5nLCB0aGUgZmlyc3QgYnl0ZSBjb250YWluczpcbiAqICogMSBiaXQgdGhhdCBkZW5vdGVzIHdoZXRoZXIgdGhlIG5leHQgdmFsdWUgaXMgYSBjb3VudCAoTFNCKVxuICogKiAxIGJpdCB0aGF0IGRlbm90ZXMgd2hldGhlciB0aGlzIHZhbHVlIGlzIG5lZ2F0aXZlIChNU0IgLSAxKVxuICogKiAxIGJpdCB0aGF0IGRlbm90ZXMgd2hldGhlciB0byBjb250aW51ZSByZWFkaW5nIHRoZSB2YXJpYWJsZSBsZW5ndGggaW50ZWdlciAoTVNCKVxuICpcbiAqIFRoZXJlZm9yZSwgb25seSBmaXZlIGJpdHMgcmVtYWluIHRvIGVuY29kZSBkaWZmIHJhbmdlcy5cbiAqXG4gKiBVc2UgdGhpcyBFbmNvZGVyIG9ubHkgd2hlbiBhcHByb3ByaWF0ZS4gSW4gbW9zdCBjYXNlcywgdGhpcyBpcyBwcm9iYWJseSBhIGJhZCBpZGVhLlxuICovXG5leHBvcnQgY2xhc3MgSW50RGlmZk9wdFJsZUVuY29kZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5lbmNvZGVyID0gbmV3IEVuY29kZXIoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gMFxuICAgIHRoaXMuY291bnQgPSAwXG4gICAgdGhpcy5kaWZmID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2XG4gICAqL1xuICB3cml0ZSAodikge1xuICAgIGlmICh0aGlzLmRpZmYgPT09IHYgLSB0aGlzLnMpIHtcbiAgICAgIHRoaXMucyA9IHZcbiAgICAgIHRoaXMuY291bnQrK1xuICAgIH0gZWxzZSB7XG4gICAgICBmbHVzaEludERpZmZPcHRSbGVFbmNvZGVyKHRoaXMpXG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgdGhpcy5kaWZmID0gdiAtIHRoaXMuc1xuICAgICAgdGhpcy5zID0gdlxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGbHVzaCB0aGUgZW5jb2RlZCBzdGF0ZSBhbmQgdHJhbnNmb3JtIHRoaXMgdG8gYSBVaW50OEFycmF5LlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhpcyBzaG91bGQgb25seSBiZSBjYWxsZWQgb25jZS5cbiAgICovXG4gIHRvVWludDhBcnJheSAoKSB7XG4gICAgZmx1c2hJbnREaWZmT3B0UmxlRW5jb2Rlcih0aGlzKVxuICAgIHJldHVybiB0b1VpbnQ4QXJyYXkodGhpcy5lbmNvZGVyKVxuICB9XG59XG5cbi8qKlxuICogT3B0aW1pemVkIFN0cmluZyBFbmNvZGVyLlxuICpcbiAqIEVuY29kaW5nIG1hbnkgc21hbGwgc3RyaW5ncyBpbiBhIHNpbXBsZSBFbmNvZGVyIGlzIG5vdCB2ZXJ5IGVmZmljaWVudC4gVGhlIGZ1bmN0aW9uIGNhbGwgdG8gZGVjb2RlIGEgc3RyaW5nIHRha2VzIHNvbWUgdGltZSBhbmQgY3JlYXRlcyByZWZlcmVuY2VzIHRoYXQgbXVzdCBiZSBldmVudHVhbGx5IGRlbGV0ZWQuXG4gKiBJbiBwcmFjdGljZSwgd2hlbiBkZWNvZGluZyBzZXZlcmFsIG1pbGxpb24gc21hbGwgc3RyaW5ncywgdGhlIEdDIHdpbGwga2ljayBpbiBtb3JlIGFuZCBtb3JlIG9mdGVuIHRvIGNvbGxlY3Qgb3JwaGFuZWQgc3RyaW5nIG9iamVjdHMgKG9yIG1heWJlIHRoZXJlIGlzIGFub3RoZXIgcmVhc29uPykuXG4gKlxuICogVGhpcyBzdHJpbmcgZW5jb2RlciBzb2x2ZXMgdGhlIGFib3ZlIHByb2JsZW0uIEFsbCBzdHJpbmdzIGFyZSBjb25jYXRlbmF0ZWQgYW5kIHdyaXR0ZW4gYXMgYSBzaW5nbGUgc3RyaW5nIHVzaW5nIGEgc2luZ2xlIGVuY29kaW5nIGNhbGwuXG4gKlxuICogVGhlIGxlbmd0aHMgYXJlIGVuY29kZWQgdXNpbmcgYSBVaW50T3B0UmxlRW5jb2Rlci5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0cmluZ0VuY29kZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PHN0cmluZz59XG4gICAgICovXG4gICAgdGhpcy5zYXJyID0gW11cbiAgICB0aGlzLnMgPSAnJ1xuICAgIHRoaXMubGVuc0UgPSBuZXcgVWludE9wdFJsZUVuY29kZXIoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmdcbiAgICovXG4gIHdyaXRlIChzdHJpbmcpIHtcbiAgICB0aGlzLnMgKz0gc3RyaW5nXG4gICAgaWYgKHRoaXMucy5sZW5ndGggPiAxOSkge1xuICAgICAgdGhpcy5zYXJyLnB1c2godGhpcy5zKVxuICAgICAgdGhpcy5zID0gJydcbiAgICB9XG4gICAgdGhpcy5sZW5zRS53cml0ZShzdHJpbmcubGVuZ3RoKVxuICB9XG5cbiAgdG9VaW50OEFycmF5ICgpIHtcbiAgICBjb25zdCBlbmNvZGVyID0gbmV3IEVuY29kZXIoKVxuICAgIHRoaXMuc2Fyci5wdXNoKHRoaXMucylcbiAgICB0aGlzLnMgPSAnJ1xuICAgIHdyaXRlVmFyU3RyaW5nKGVuY29kZXIsIHRoaXMuc2Fyci5qb2luKCcnKSlcbiAgICB3cml0ZVVpbnQ4QXJyYXkoZW5jb2RlciwgdGhpcy5sZW5zRS50b1VpbnQ4QXJyYXkoKSlcbiAgICByZXR1cm4gdG9VaW50OEFycmF5KGVuY29kZXIpXG4gIH1cbn1cbiIsICIvKipcbiAqIEVmZmljaWVudCBzY2hlbWEtbGVzcyBiaW5hcnkgZGVjb2Rpbmcgd2l0aCBzdXBwb3J0IGZvciB2YXJpYWJsZSBsZW5ndGggZW5jb2RpbmcuXG4gKlxuICogVXNlIFtsaWIwL2RlY29kaW5nXSB3aXRoIFtsaWIwL2VuY29kaW5nXS4gRXZlcnkgZW5jb2RpbmcgZnVuY3Rpb24gaGFzIGEgY29ycmVzcG9uZGluZyBkZWNvZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBFbmNvZGVzIG51bWJlcnMgaW4gbGl0dGxlLWVuZGlhbiBvcmRlciAobGVhc3QgdG8gbW9zdCBzaWduaWZpY2FudCBieXRlIG9yZGVyKVxuICogYW5kIGlzIGNvbXBhdGlibGUgd2l0aCBHb2xhbmcncyBiaW5hcnkgZW5jb2RpbmcgKGh0dHBzOi8vZ29sYW5nLm9yZy9wa2cvZW5jb2RpbmcvYmluYXJ5LylcbiAqIHdoaWNoIGlzIGFsc28gdXNlZCBpbiBQcm90b2NvbCBCdWZmZXJzLlxuICpcbiAqIGBgYGpzXG4gKiAvLyBlbmNvZGluZyBzdGVwXG4gKiBjb25zdCBlbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gKiBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgMjU2KVxuICogZW5jb2Rpbmcud3JpdGVWYXJTdHJpbmcoZW5jb2RlciwgJ0hlbGxvIHdvcmxkIScpXG4gKiBjb25zdCBidWYgPSBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlcilcbiAqIGBgYFxuICpcbiAqIGBgYGpzXG4gKiAvLyBkZWNvZGluZyBzdGVwXG4gKiBjb25zdCBkZWNvZGVyID0gZGVjb2RpbmcuY3JlYXRlRGVjb2RlcihidWYpXG4gKiBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyKSAvLyA9PiAyNTZcbiAqIGRlY29kaW5nLnJlYWRWYXJTdHJpbmcoZGVjb2RlcikgLy8gPT4gJ0hlbGxvIHdvcmxkISdcbiAqIGRlY29kaW5nLmhhc0NvbnRlbnQoZGVjb2RlcikgLy8gPT4gZmFsc2UgLSBhbGwgZGF0YSBpcyByZWFkXG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlIGRlY29kaW5nXG4gKi9cblxuaW1wb3J0ICogYXMgYmluYXJ5IGZyb20gJy4vYmluYXJ5LmpzJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5pbXBvcnQgKiBhcyBudW1iZXIgZnJvbSAnLi9udW1iZXIuanMnXG5pbXBvcnQgKiBhcyBzdHJpbmcgZnJvbSAnLi9zdHJpbmcuanMnXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICcuL2Vycm9yLmpzJ1xuaW1wb3J0ICogYXMgZW5jb2RpbmcgZnJvbSAnLi9lbmNvZGluZy5qcydcblxuY29uc3QgZXJyb3JVbmV4cGVjdGVkRW5kT2ZBcnJheSA9IGVycm9yLmNyZWF0ZSgnVW5leHBlY3RlZCBlbmQgb2YgYXJyYXknKVxuY29uc3QgZXJyb3JJbnRlZ2VyT3V0T2ZSYW5nZSA9IGVycm9yLmNyZWF0ZSgnSW50ZWdlciBvdXQgb2YgUmFuZ2UnKVxuXG4vKipcbiAqIEEgRGVjb2RlciBoYW5kbGVzIHRoZSBkZWNvZGluZyBvZiBhbiBVaW50OEFycmF5LlxuICogQHRlbXBsYXRlIHtBcnJheUJ1ZmZlckxpa2V9IFtCdWY9QXJyYXlCdWZmZXJMaWtlXVxuICovXG5leHBvcnQgY2xhc3MgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXk8QnVmPn0gdWludDhBcnJheSBCaW5hcnkgZGF0YSB0byBkZWNvZGVcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5KSB7XG4gICAgLyoqXG4gICAgICogRGVjb2RpbmcgdGFyZ2V0LlxuICAgICAqXG4gICAgICogQHR5cGUge1VpbnQ4QXJyYXk8QnVmPn1cbiAgICAgKi9cbiAgICB0aGlzLmFyciA9IHVpbnQ4QXJyYXlcbiAgICAvKipcbiAgICAgKiBDdXJyZW50IGRlY29kaW5nIHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnBvcyA9IDBcbiAgfVxufVxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIHtBcnJheUJ1ZmZlckxpa2V9IEJ1ZlxuICogQHBhcmFtIHtVaW50OEFycmF5PEJ1Zj59IHVpbnQ4QXJyYXlcbiAqIEByZXR1cm4ge0RlY29kZXI8QnVmPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZURlY29kZXIgPSB1aW50OEFycmF5ID0+IG5ldyBEZWNvZGVyKHVpbnQ4QXJyYXkpXG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBoYXNDb250ZW50ID0gZGVjb2RlciA9PiBkZWNvZGVyLnBvcyAhPT0gZGVjb2Rlci5hcnIubGVuZ3RoXG5cbi8qKlxuICogQ2xvbmUgYSBkZWNvZGVyIGluc3RhbmNlLlxuICogT3B0aW9uYWxseSBzZXQgYSBuZXcgcG9zaXRpb24gcGFyYW1ldGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyIFRoZSBkZWNvZGVyIGluc3RhbmNlXG4gKiBAcGFyYW0ge251bWJlcn0gW25ld1Bvc10gRGVmYXVsdHMgdG8gY3VycmVudCBwb3NpdGlvblxuICogQHJldHVybiB7RGVjb2Rlcn0gQSBjbG9uZSBvZiBgZGVjb2RlcmBcbiAqL1xuZXhwb3J0IGNvbnN0IGNsb25lID0gKGRlY29kZXIsIG5ld1BvcyA9IGRlY29kZXIucG9zKSA9PiB7XG4gIGNvbnN0IF9kZWNvZGVyID0gY3JlYXRlRGVjb2RlcihkZWNvZGVyLmFycilcbiAgX2RlY29kZXIucG9zID0gbmV3UG9zXG4gIHJldHVybiBfZGVjb2RlclxufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBVaW50OEFycmF5IHZpZXcgb2YgdGhlIG5leHQgYGxlbmAgYnl0ZXMgYW5kIGFkdmFuY2UgdGhlIHBvc2l0aW9uIGJ5IGBsZW5gLlxuICpcbiAqIEltcG9ydGFudDogVGhlIFVpbnQ4QXJyYXkgc3RpbGwgcG9pbnRzIHRvIHRoZSB1bmRlcmx5aW5nIEFycmF5QnVmZmVyLiBNYWtlIHN1cmUgdG8gZGlzY2FyZCB0aGUgcmVzdWx0IGFzIHNvb24gYXMgcG9zc2libGUgdG8gcHJldmVudCBhbnkgbWVtb3J5IGxlYWtzLlxuICogICAgICAgICAgICBVc2UgYGJ1ZmZlci5jb3B5VWludDhBcnJheWAgdG8gY29weSB0aGUgcmVzdWx0IGludG8gYSBuZXcgVWludDhBcnJheS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSB7QXJyYXlCdWZmZXJMaWtlfSBCdWZcbiAqIEBwYXJhbSB7RGVjb2RlcjxCdWY+fSBkZWNvZGVyIFRoZSBkZWNvZGVyIGluc3RhbmNlXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuIFRoZSBsZW5ndGggb2YgYnl0ZXMgdG8gcmVhZFxuICogQHJldHVybiB7VWludDhBcnJheTxCdWY+fVxuICovXG5leHBvcnQgY29uc3QgcmVhZFVpbnQ4QXJyYXkgPSAoZGVjb2RlciwgbGVuKSA9PiB7XG4gIGNvbnN0IHZpZXcgPSBuZXcgVWludDhBcnJheShkZWNvZGVyLmFyci5idWZmZXIsIGRlY29kZXIucG9zICsgZGVjb2Rlci5hcnIuYnl0ZU9mZnNldCwgbGVuKVxuICBkZWNvZGVyLnBvcyArPSBsZW5cbiAgcmV0dXJuIHZpZXdcbn1cblxuLyoqXG4gKiBSZWFkIHZhcmlhYmxlIGxlbmd0aCBVaW50OEFycmF5LlxuICpcbiAqIEltcG9ydGFudDogVGhlIFVpbnQ4QXJyYXkgc3RpbGwgcG9pbnRzIHRvIHRoZSB1bmRlcmx5aW5nIEFycmF5QnVmZmVyLiBNYWtlIHN1cmUgdG8gZGlzY2FyZCB0aGUgcmVzdWx0IGFzIHNvb24gYXMgcG9zc2libGUgdG8gcHJldmVudCBhbnkgbWVtb3J5IGxlYWtzLlxuICogICAgICAgICAgICBVc2UgYGJ1ZmZlci5jb3B5VWludDhBcnJheWAgdG8gY29weSB0aGUgcmVzdWx0IGludG8gYSBuZXcgVWludDhBcnJheS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSB7QXJyYXlCdWZmZXJMaWtlfSBCdWZcbiAqIEBwYXJhbSB7RGVjb2RlcjxCdWY+fSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5PEJ1Zj59XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkVmFyVWludDhBcnJheSA9IGRlY29kZXIgPT4gcmVhZFVpbnQ4QXJyYXkoZGVjb2RlciwgcmVhZFZhclVpbnQoZGVjb2RlcikpXG5cbi8qKlxuICogUmVhZCB0aGUgcmVzdCBvZiB0aGUgY29udGVudCBhcyBhbiBBcnJheUJ1ZmZlclxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkVGFpbEFzVWludDhBcnJheSA9IGRlY29kZXIgPT4gcmVhZFVpbnQ4QXJyYXkoZGVjb2RlciwgZGVjb2Rlci5hcnIubGVuZ3RoIC0gZGVjb2Rlci5wb3MpXG5cbi8qKlxuICogU2tpcCBvbmUgYnl0ZSwganVtcCB0byB0aGUgbmV4dCBwb3NpdGlvbi5cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyIFRoZSBkZWNvZGVyIGluc3RhbmNlXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBuZXh0IHBvc2l0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBza2lwOCA9IGRlY29kZXIgPT4gZGVjb2Rlci5wb3MrK1xuXG4vKipcbiAqIFJlYWQgb25lIGJ5dGUgYXMgdW5zaWduZWQgaW50ZWdlci5cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyIFRoZSBkZWNvZGVyIGluc3RhbmNlXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFVuc2lnbmVkIDgtYml0IGludGVnZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRVaW50OCA9IGRlY29kZXIgPT4gZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MrK11cblxuLyoqXG4gKiBSZWFkIDIgYnl0ZXMgYXMgdW5zaWduZWQgaW50ZWdlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfSBBbiB1bnNpZ25lZCBpbnRlZ2VyLlxuICovXG5leHBvcnQgY29uc3QgcmVhZFVpbnQxNiA9IGRlY29kZXIgPT4ge1xuICBjb25zdCB1aW50ID1cbiAgICBkZWNvZGVyLmFycltkZWNvZGVyLnBvc10gK1xuICAgIChkZWNvZGVyLmFycltkZWNvZGVyLnBvcyArIDFdIDw8IDgpXG4gIGRlY29kZXIucG9zICs9IDJcbiAgcmV0dXJuIHVpbnRcbn1cblxuLyoqXG4gKiBSZWFkIDQgYnl0ZXMgYXMgdW5zaWduZWQgaW50ZWdlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfSBBbiB1bnNpZ25lZCBpbnRlZ2VyLlxuICovXG5leHBvcnQgY29uc3QgcmVhZFVpbnQzMiA9IGRlY29kZXIgPT4ge1xuICBjb25zdCB1aW50ID1cbiAgICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3NdICtcbiAgICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAxXSA8PCA4KSArXG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgMl0gPDwgMTYpICtcbiAgICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAzXSA8PCAyNCkpID4+PiAwXG4gIGRlY29kZXIucG9zICs9IDRcbiAgcmV0dXJuIHVpbnRcbn1cblxuLyoqXG4gKiBSZWFkIDQgYnl0ZXMgYXMgdW5zaWduZWQgaW50ZWdlciBpbiBiaWcgZW5kaWFuIG9yZGVyLlxuICogKG1vc3Qgc2lnbmlmaWNhbnQgYnl0ZSBmaXJzdClcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfSBBbiB1bnNpZ25lZCBpbnRlZ2VyLlxuICovXG5leHBvcnQgY29uc3QgcmVhZFVpbnQzMkJpZ0VuZGlhbiA9IGRlY29kZXIgPT4ge1xuICBjb25zdCB1aW50ID1cbiAgICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAzXSArXG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgMl0gPDwgOCkgK1xuICAgIChkZWNvZGVyLmFycltkZWNvZGVyLnBvcyArIDFdIDw8IDE2KSArXG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zXSA8PCAyNCkpID4+PiAwXG4gIGRlY29kZXIucG9zICs9IDRcbiAgcmV0dXJuIHVpbnRcbn1cblxuLyoqXG4gKiBMb29rIGFoZWFkIHdpdGhvdXQgaW5jcmVtZW50aW5nIHRoZSBwb3NpdGlvblxuICogdG8gdGhlIG5leHQgYnl0ZSBhbmQgcmVhZCBpdCBhcyB1bnNpZ25lZCBpbnRlZ2VyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IEFuIHVuc2lnbmVkIGludGVnZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBwZWVrVWludDggPSBkZWNvZGVyID0+IGRlY29kZXIuYXJyW2RlY29kZXIucG9zXVxuXG4vKipcbiAqIExvb2sgYWhlYWQgd2l0aG91dCBpbmNyZW1lbnRpbmcgdGhlIHBvc2l0aW9uXG4gKiB0byB0aGUgbmV4dCBieXRlIGFuZCByZWFkIGl0IGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHBlZWtVaW50MTYgPSBkZWNvZGVyID0+XG4gIGRlY29kZXIuYXJyW2RlY29kZXIucG9zXSArXG4gIChkZWNvZGVyLmFycltkZWNvZGVyLnBvcyArIDFdIDw8IDgpXG5cbi8qKlxuICogTG9vayBhaGVhZCB3aXRob3V0IGluY3JlbWVudGluZyB0aGUgcG9zaXRpb25cbiAqIHRvIHRoZSBuZXh0IGJ5dGUgYW5kIHJlYWQgaXQgYXMgdW5zaWduZWQgaW50ZWdlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfSBBbiB1bnNpZ25lZCBpbnRlZ2VyLlxuICovXG5leHBvcnQgY29uc3QgcGVla1VpbnQzMiA9IGRlY29kZXIgPT4gKFxuICBkZWNvZGVyLmFycltkZWNvZGVyLnBvc10gK1xuICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAxXSA8PCA4KSArXG4gIChkZWNvZGVyLmFycltkZWNvZGVyLnBvcyArIDJdIDw8IDE2KSArXG4gIChkZWNvZGVyLmFycltkZWNvZGVyLnBvcyArIDNdIDw8IDI0KVxuKSA+Pj4gMFxuXG4vKipcbiAqIFJlYWQgdW5zaWduZWQgaW50ZWdlciAoMzJiaXQpIHdpdGggdmFyaWFibGUgbGVuZ3RoLlxuICogMS84dGggb2YgdGhlIHN0b3JhZ2UgaXMgdXNlZCBhcyBlbmNvZGluZyBvdmVyaGVhZC5cbiAqICAqIG51bWJlcnMgPCAyXjcgaXMgc3RvcmVkIGluIG9uZSBieXRsZW5ndGhcbiAqICAqIG51bWJlcnMgPCAyXjE0IGlzIHN0b3JlZCBpbiB0d28gYnlsZW5ndGhcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfSBBbiB1bnNpZ25lZCBpbnRlZ2VyLmxlbmd0aFxuICovXG5leHBvcnQgY29uc3QgcmVhZFZhclVpbnQgPSBkZWNvZGVyID0+IHtcbiAgbGV0IG51bSA9IDBcbiAgbGV0IG11bHQgPSAxXG4gIGNvbnN0IGxlbiA9IGRlY29kZXIuYXJyLmxlbmd0aFxuICB3aGlsZSAoZGVjb2Rlci5wb3MgPCBsZW4pIHtcbiAgICBjb25zdCByID0gZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MrK11cbiAgICAvLyBudW0gPSBudW0gfCAoKHIgJiBiaW5hcnkuQklUUzcpIDw8IGxlbilcbiAgICBudW0gPSBudW0gKyAociAmIGJpbmFyeS5CSVRTNykgKiBtdWx0IC8vIHNoaWZ0ICRyIDw8ICg3KiNpdGVyYXRpb25zKSBhbmQgYWRkIGl0IHRvIG51bVxuICAgIG11bHQgKj0gMTI4IC8vIG5leHQgaXRlcmF0aW9uLCBzaGlmdCA3IFwibW9yZVwiIHRvIHRoZSBsZWZ0XG4gICAgaWYgKHIgPCBiaW5hcnkuQklUOCkge1xuICAgICAgcmV0dXJuIG51bVxuICAgIH1cbiAgICAvKiBjOCBpZ25vcmUgc3RhcnQgKi9cbiAgICBpZiAobnVtID4gbnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpIHtcbiAgICAgIHRocm93IGVycm9ySW50ZWdlck91dE9mUmFuZ2VcbiAgICB9XG4gICAgLyogYzggaWdub3JlIHN0b3AgKi9cbiAgfVxuICB0aHJvdyBlcnJvclVuZXhwZWN0ZWRFbmRPZkFycmF5XG59XG5cbi8qKlxuICogUmVhZCBzaWduZWQgaW50ZWdlciAoMzJiaXQpIHdpdGggdmFyaWFibGUgbGVuZ3RoLlxuICogMS84dGggb2YgdGhlIHN0b3JhZ2UgaXMgdXNlZCBhcyBlbmNvZGluZyBvdmVyaGVhZC5cbiAqICAqIG51bWJlcnMgPCAyXjcgaXMgc3RvcmVkIGluIG9uZSBieXRsZW5ndGhcbiAqICAqIG51bWJlcnMgPCAyXjE0IGlzIHN0b3JlZCBpbiB0d28gYnlsZW5ndGhcbiAqIEB0b2RvIFRoaXMgc2hvdWxkIHByb2JhYmx5IGNyZWF0ZSB0aGUgaW52ZXJzZSB+bnVtIGlmIG51bWJlciBpcyBuZWdhdGl2ZSAtIGJ1dCB0aGlzIHdvdWxkIGJlIGEgYnJlYWtpbmcgY2hhbmdlLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IEFuIHVuc2lnbmVkIGludGVnZXIubGVuZ3RoXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkVmFySW50ID0gZGVjb2RlciA9PiB7XG4gIGxldCByID0gZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MrK11cbiAgbGV0IG51bSA9IHIgJiBiaW5hcnkuQklUUzZcbiAgbGV0IG11bHQgPSA2NFxuICBjb25zdCBzaWduID0gKHIgJiBiaW5hcnkuQklUNykgPiAwID8gLTEgOiAxXG4gIGlmICgociAmIGJpbmFyeS5CSVQ4KSA9PT0gMCkge1xuICAgIC8vIGRvbid0IGNvbnRpbnVlIHJlYWRpbmdcbiAgICByZXR1cm4gc2lnbiAqIG51bVxuICB9XG4gIGNvbnN0IGxlbiA9IGRlY29kZXIuYXJyLmxlbmd0aFxuICB3aGlsZSAoZGVjb2Rlci5wb3MgPCBsZW4pIHtcbiAgICByID0gZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MrK11cbiAgICAvLyBudW0gPSBudW0gfCAoKHIgJiBiaW5hcnkuQklUUzcpIDw8IGxlbilcbiAgICBudW0gPSBudW0gKyAociAmIGJpbmFyeS5CSVRTNykgKiBtdWx0XG4gICAgbXVsdCAqPSAxMjhcbiAgICBpZiAociA8IGJpbmFyeS5CSVQ4KSB7XG4gICAgICByZXR1cm4gc2lnbiAqIG51bVxuICAgIH1cbiAgICAvKiBjOCBpZ25vcmUgc3RhcnQgKi9cbiAgICBpZiAobnVtID4gbnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpIHtcbiAgICAgIHRocm93IGVycm9ySW50ZWdlck91dE9mUmFuZ2VcbiAgICB9XG4gICAgLyogYzggaWdub3JlIHN0b3AgKi9cbiAgfVxuICB0aHJvdyBlcnJvclVuZXhwZWN0ZWRFbmRPZkFycmF5XG59XG5cbi8qKlxuICogTG9vayBhaGVhZCBhbmQgcmVhZCB2YXJVaW50IHdpdGhvdXQgaW5jcmVtZW50aW5nIHBvc2l0aW9uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IHBlZWtWYXJVaW50ID0gZGVjb2RlciA9PiB7XG4gIGNvbnN0IHBvcyA9IGRlY29kZXIucG9zXG4gIGNvbnN0IHMgPSByZWFkVmFyVWludChkZWNvZGVyKVxuICBkZWNvZGVyLnBvcyA9IHBvc1xuICByZXR1cm4gc1xufVxuXG4vKipcbiAqIExvb2sgYWhlYWQgYW5kIHJlYWQgdmFyVWludCB3aXRob3V0IGluY3JlbWVudGluZyBwb3NpdGlvblxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBwZWVrVmFySW50ID0gZGVjb2RlciA9PiB7XG4gIGNvbnN0IHBvcyA9IGRlY29kZXIucG9zXG4gIGNvbnN0IHMgPSByZWFkVmFySW50KGRlY29kZXIpXG4gIGRlY29kZXIucG9zID0gcG9zXG4gIHJldHVybiBzXG59XG5cbi8qKlxuICogV2UgZG9uJ3QgdGVzdCB0aGlzIGZ1bmN0aW9uIGFueW1vcmUgYXMgd2UgdXNlIG5hdGl2ZSBkZWNvZGluZy9lbmNvZGluZyBieSBkZWZhdWx0IG5vdy5cbiAqIEJldHRlciBub3QgbW9kaWZ5IHRoaXMgYW55bW9yZS4uXG4gKlxuICogVHJhbnNmb3JtaW5nIHV0ZjggdG8gYSBzdHJpbmcgaXMgcHJldHR5IGV4cGVuc2l2ZS4gVGhlIGNvZGUgcGVyZm9ybXMgMTB4IGJldHRlclxuICogd2hlbiBTdHJpbmcuZnJvbUNvZGVQb2ludCBpcyBmZWQgd2l0aCBhbGwgY2hhcmFjdGVycyBhcyBhcmd1bWVudHMuXG4gKiBCdXQgbW9zdCBlbnZpcm9ubWVudHMgaGF2ZSBhIG1heGltdW0gbnVtYmVyIG9mIGFyZ3VtZW50cyBwZXIgZnVuY3Rpb25zLlxuICogRm9yIGVmZmllbmN5IHJlYXNvbnMgd2UgYXBwbHkgYSBtYXhpbXVtIG9mIDEwMDAwIGNoYXJhY3RlcnMgYXQgb25jZS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgcmVhZCBTdHJpbmcuXG4gKi9cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuZXhwb3J0IGNvbnN0IF9yZWFkVmFyU3RyaW5nUG9seWZpbGwgPSBkZWNvZGVyID0+IHtcbiAgbGV0IHJlbWFpbmluZ0xlbiA9IHJlYWRWYXJVaW50KGRlY29kZXIpXG4gIGlmIChyZW1haW5pbmdMZW4gPT09IDApIHtcbiAgICByZXR1cm4gJydcbiAgfSBlbHNlIHtcbiAgICBsZXQgZW5jb2RlZFN0cmluZyA9IFN0cmluZy5mcm9tQ29kZVBvaW50KHJlYWRVaW50OChkZWNvZGVyKSkgLy8gcmVtZW1iZXIgdG8gZGVjcmVhc2UgcmVtYWluaW5nTGVuXG4gICAgaWYgKC0tcmVtYWluaW5nTGVuIDwgMTAwKSB7IC8vIGRvIG5vdCBjcmVhdGUgYSBVaW50OEFycmF5IGZvciBzbWFsbCBzdHJpbmdzXG4gICAgICB3aGlsZSAocmVtYWluaW5nTGVuLS0pIHtcbiAgICAgICAgZW5jb2RlZFN0cmluZyArPSBTdHJpbmcuZnJvbUNvZGVQb2ludChyZWFkVWludDgoZGVjb2RlcikpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHdoaWxlIChyZW1haW5pbmdMZW4gPiAwKSB7XG4gICAgICAgIGNvbnN0IG5leHRMZW4gPSByZW1haW5pbmdMZW4gPCAxMDAwMCA/IHJlbWFpbmluZ0xlbiA6IDEwMDAwXG4gICAgICAgIC8vIHRoaXMgaXMgZGFuZ2Vyb3VzLCB3ZSBjcmVhdGUgYSBmcmVzaCBhcnJheSB2aWV3IGZyb20gdGhlIGV4aXN0aW5nIGJ1ZmZlclxuICAgICAgICBjb25zdCBieXRlcyA9IGRlY29kZXIuYXJyLnN1YmFycmF5KGRlY29kZXIucG9zLCBkZWNvZGVyLnBvcyArIG5leHRMZW4pXG4gICAgICAgIGRlY29kZXIucG9zICs9IG5leHRMZW5cbiAgICAgICAgLy8gU3RhcnRpbmcgd2l0aCBFUzUuMSB3ZSBjYW4gc3VwcGx5IGEgZ2VuZXJpYyBhcnJheS1saWtlIG9iamVjdCBhcyBhcmd1bWVudHNcbiAgICAgICAgZW5jb2RlZFN0cmluZyArPSBTdHJpbmcuZnJvbUNvZGVQb2ludC5hcHBseShudWxsLCAvKiogQHR5cGUge2FueX0gKi8gKGJ5dGVzKSlcbiAgICAgICAgcmVtYWluaW5nTGVuIC09IG5leHRMZW5cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChlc2NhcGUoZW5jb2RlZFN0cmluZykpXG4gIH1cbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHJlYWQgU3RyaW5nXG4gKi9cbmV4cG9ydCBjb25zdCBfcmVhZFZhclN0cmluZ05hdGl2ZSA9IGRlY29kZXIgPT5cbiAgLyoqIEB0eXBlIGFueSAqLyAoc3RyaW5nLnV0ZjhUZXh0RGVjb2RlcikuZGVjb2RlKHJlYWRWYXJVaW50OEFycmF5KGRlY29kZXIpKVxuXG4vKipcbiAqIFJlYWQgc3RyaW5nIG9mIHZhcmlhYmxlIGxlbmd0aFxuICogKiB2YXJVaW50IGlzIHVzZWQgdG8gc3RvcmUgdGhlIGxlbmd0aCBvZiB0aGUgc3RyaW5nXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHJlYWQgU3RyaW5nXG4gKlxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IHJlYWRWYXJTdHJpbmcgPSBzdHJpbmcudXRmOFRleHREZWNvZGVyID8gX3JlYWRWYXJTdHJpbmdOYXRpdmUgOiBfcmVhZFZhclN0cmluZ1BvbHlmaWxsXG5cbi8qKlxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5leHBvcnQgY29uc3QgcmVhZFRlcm1pbmF0ZWRVaW50OEFycmF5ID0gZGVjb2RlciA9PiB7XG4gIGNvbnN0IGVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAgbGV0IGJcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBiID0gcmVhZFVpbnQ4KGRlY29kZXIpXG4gICAgaWYgKGIgPT09IDApIHtcbiAgICAgIHJldHVybiBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlcilcbiAgICB9XG4gICAgaWYgKGIgPT09IDEpIHtcbiAgICAgIGIgPSByZWFkVWludDgoZGVjb2RlcilcbiAgICB9XG4gICAgZW5jb2Rpbmcud3JpdGUoZW5jb2RlciwgYilcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgcmVhZFRlcm1pbmF0ZWRTdHJpbmcgPSBkZWNvZGVyID0+IHN0cmluZy5kZWNvZGVVdGY4KHJlYWRUZXJtaW5hdGVkVWludDhBcnJheShkZWNvZGVyKSlcblxuLyoqXG4gKiBMb29rIGFoZWFkIGFuZCByZWFkIHZhclN0cmluZyB3aXRob3V0IGluY3JlbWVudGluZyBwb3NpdGlvblxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBwZWVrVmFyU3RyaW5nID0gZGVjb2RlciA9PiB7XG4gIGNvbnN0IHBvcyA9IGRlY29kZXIucG9zXG4gIGNvbnN0IHMgPSByZWFkVmFyU3RyaW5nKGRlY29kZXIpXG4gIGRlY29kZXIucG9zID0gcG9zXG4gIHJldHVybiBzXG59XG5cbi8qKlxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gKiBAcmV0dXJuIHtEYXRhVmlld31cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRGcm9tRGF0YVZpZXcgPSAoZGVjb2RlciwgbGVuKSA9PiB7XG4gIGNvbnN0IGR2ID0gbmV3IERhdGFWaWV3KGRlY29kZXIuYXJyLmJ1ZmZlciwgZGVjb2Rlci5hcnIuYnl0ZU9mZnNldCArIGRlY29kZXIucG9zLCBsZW4pXG4gIGRlY29kZXIucG9zICs9IGxlblxuICByZXR1cm4gZHZcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRGbG9hdDMyID0gZGVjb2RlciA9PiByZWFkRnJvbURhdGFWaWV3KGRlY29kZXIsIDQpLmdldEZsb2F0MzIoMCwgZmFsc2UpXG5cbi8qKlxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkRmxvYXQ2NCA9IGRlY29kZXIgPT4gcmVhZEZyb21EYXRhVmlldyhkZWNvZGVyLCA4KS5nZXRGbG9hdDY0KDAsIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICovXG5leHBvcnQgY29uc3QgcmVhZEJpZ0ludDY0ID0gZGVjb2RlciA9PiAvKiogQHR5cGUge2FueX0gKi8gKHJlYWRGcm9tRGF0YVZpZXcoZGVjb2RlciwgOCkpLmdldEJpZ0ludDY0KDAsIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICovXG5leHBvcnQgY29uc3QgcmVhZEJpZ1VpbnQ2NCA9IGRlY29kZXIgPT4gLyoqIEB0eXBlIHthbnl9ICovIChyZWFkRnJvbURhdGFWaWV3KGRlY29kZXIsIDgpKS5nZXRCaWdVaW50NjQoMCwgZmFsc2UpXG5cbi8qKlxuICogQHR5cGUge0FycmF5PGZ1bmN0aW9uKERlY29kZXIpOmFueT59XG4gKi9cbmNvbnN0IHJlYWRBbnlMb29rdXBUYWJsZSA9IFtcbiAgZGVjb2RlciA9PiB1bmRlZmluZWQsIC8vIENBU0UgMTI3OiB1bmRlZmluZWRcbiAgZGVjb2RlciA9PiBudWxsLCAvLyBDQVNFIDEyNjogbnVsbFxuICByZWFkVmFySW50LCAvLyBDQVNFIDEyNTogaW50ZWdlclxuICByZWFkRmxvYXQzMiwgLy8gQ0FTRSAxMjQ6IGZsb2F0MzJcbiAgcmVhZEZsb2F0NjQsIC8vIENBU0UgMTIzOiBmbG9hdDY0XG4gIHJlYWRCaWdJbnQ2NCwgLy8gQ0FTRSAxMjI6IGJpZ2ludFxuICBkZWNvZGVyID0+IGZhbHNlLCAvLyBDQVNFIDEyMTogYm9vbGVhbiAoZmFsc2UpXG4gIGRlY29kZXIgPT4gdHJ1ZSwgLy8gQ0FTRSAxMjA6IGJvb2xlYW4gKHRydWUpXG4gIHJlYWRWYXJTdHJpbmcsIC8vIENBU0UgMTE5OiBzdHJpbmdcbiAgZGVjb2RlciA9PiB7IC8vIENBU0UgMTE4OiBvYmplY3Q8c3RyaW5nLGFueT5cbiAgICBjb25zdCBsZW4gPSByZWFkVmFyVWludChkZWNvZGVyKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtPYmplY3Q8c3RyaW5nLGFueT59XG4gICAgICovXG4gICAgY29uc3Qgb2JqID0ge31cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBjb25zdCBrZXkgPSByZWFkVmFyU3RyaW5nKGRlY29kZXIpXG4gICAgICBvYmpba2V5XSA9IHJlYWRBbnkoZGVjb2RlcilcbiAgICB9XG4gICAgcmV0dXJuIG9ialxuICB9LFxuICBkZWNvZGVyID0+IHsgLy8gQ0FTRSAxMTc6IGFycmF5PGFueT5cbiAgICBjb25zdCBsZW4gPSByZWFkVmFyVWludChkZWNvZGVyKVxuICAgIGNvbnN0IGFyciA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJyLnB1c2gocmVhZEFueShkZWNvZGVyKSlcbiAgICB9XG4gICAgcmV0dXJuIGFyclxuICB9LFxuICByZWFkVmFyVWludDhBcnJheSAvLyBDQVNFIDExNjogVWludDhBcnJheVxuXVxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICovXG5leHBvcnQgY29uc3QgcmVhZEFueSA9IGRlY29kZXIgPT4gcmVhZEFueUxvb2t1cFRhYmxlWzEyNyAtIHJlYWRVaW50OChkZWNvZGVyKV0oZGVjb2RlcilcblxuLyoqXG4gKiBUIG11c3Qgbm90IGJlIG51bGwuXG4gKlxuICogQHRlbXBsYXRlIFRcbiAqL1xuZXhwb3J0IGNsYXNzIFJsZURlY29kZXIgZXh0ZW5kcyBEZWNvZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKERlY29kZXIpOlR9IHJlYWRlclxuICAgKi9cbiAgY29uc3RydWN0b3IgKHVpbnQ4QXJyYXksIHJlYWRlcikge1xuICAgIHN1cGVyKHVpbnQ4QXJyYXkpXG4gICAgLyoqXG4gICAgICogVGhlIHJlYWRlclxuICAgICAqL1xuICAgIHRoaXMucmVhZGVyID0gcmVhZGVyXG4gICAgLyoqXG4gICAgICogQ3VycmVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtUfG51bGx9XG4gICAgICovXG4gICAgdGhpcy5zID0gbnVsbFxuICAgIHRoaXMuY291bnQgPSAwXG4gIH1cblxuICByZWFkICgpIHtcbiAgICBpZiAodGhpcy5jb3VudCA9PT0gMCkge1xuICAgICAgdGhpcy5zID0gdGhpcy5yZWFkZXIodGhpcylcbiAgICAgIGlmIChoYXNDb250ZW50KHRoaXMpKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSByZWFkVmFyVWludCh0aGlzKSArIDEgLy8gc2VlIGVuY29kZXIgaW1wbGVtZW50YXRpb24gZm9yIHRoZSByZWFzb24gd2h5IHRoaXMgaXMgaW5jcmVtZW50ZWRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAtMSAvLyByZWFkIHRoZSBjdXJyZW50IHZhbHVlIGZvcmV2ZXJcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jb3VudC0tXG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7VH0gKi8gKHRoaXMucylcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSW50RGlmZkRlY29kZXIgZXh0ZW5kcyBEZWNvZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheVxuICAgKiBAcGFyYW0ge251bWJlcn0gc3RhcnRcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5LCBzdGFydCkge1xuICAgIHN1cGVyKHVpbnQ4QXJyYXkpXG4gICAgLyoqXG4gICAgICogQ3VycmVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gc3RhcnRcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICByZWFkICgpIHtcbiAgICB0aGlzLnMgKz0gcmVhZFZhckludCh0aGlzKVxuICAgIHJldHVybiB0aGlzLnNcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmxlSW50RGlmZkRlY29kZXIgZXh0ZW5kcyBEZWNvZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheVxuICAgKiBAcGFyYW0ge251bWJlcn0gc3RhcnRcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5LCBzdGFydCkge1xuICAgIHN1cGVyKHVpbnQ4QXJyYXkpXG4gICAgLyoqXG4gICAgICogQ3VycmVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gc3RhcnRcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn1cbiAgICovXG4gIHJlYWQgKCkge1xuICAgIGlmICh0aGlzLmNvdW50ID09PSAwKSB7XG4gICAgICB0aGlzLnMgKz0gcmVhZFZhckludCh0aGlzKVxuICAgICAgaWYgKGhhc0NvbnRlbnQodGhpcykpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IHJlYWRWYXJVaW50KHRoaXMpICsgMSAvLyBzZWUgZW5jb2RlciBpbXBsZW1lbnRhdGlvbiBmb3IgdGhlIHJlYXNvbiB3aHkgdGhpcyBpcyBpbmNyZW1lbnRlZFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IC0xIC8vIHJlYWQgdGhlIGN1cnJlbnQgdmFsdWUgZm9yZXZlclxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNvdW50LS1cbiAgICByZXR1cm4gLyoqIEB0eXBlIHtudW1iZXJ9ICovICh0aGlzLnMpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVpbnRPcHRSbGVEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5KSB7XG4gICAgc3VwZXIodWludDhBcnJheSlcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucyA9IDBcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgcmVhZCAoKSB7XG4gICAgaWYgKHRoaXMuY291bnQgPT09IDApIHtcbiAgICAgIHRoaXMucyA9IHJlYWRWYXJJbnQodGhpcylcbiAgICAgIC8vIGlmIHRoZSBzaWduIGlzIG5lZ2F0aXZlLCB3ZSByZWFkIHRoZSBjb3VudCB0b28sIG90aGVyd2lzZSBjb3VudCBpcyAxXG4gICAgICBjb25zdCBpc05lZ2F0aXZlID0gbWF0aC5pc05lZ2F0aXZlWmVybyh0aGlzLnMpXG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgaWYgKGlzTmVnYXRpdmUpIHtcbiAgICAgICAgdGhpcy5zID0gLXRoaXMuc1xuICAgICAgICB0aGlzLmNvdW50ID0gcmVhZFZhclVpbnQodGhpcykgKyAyXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY291bnQtLVxuICAgIHJldHVybiAvKiogQHR5cGUge251bWJlcn0gKi8gKHRoaXMucylcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSW5jVWludE9wdFJsZURlY29kZXIgZXh0ZW5kcyBEZWNvZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheVxuICAgKi9cbiAgY29uc3RydWN0b3IgKHVpbnQ4QXJyYXkpIHtcbiAgICBzdXBlcih1aW50OEFycmF5KVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gMFxuICAgIHRoaXMuY291bnQgPSAwXG4gIH1cblxuICByZWFkICgpIHtcbiAgICBpZiAodGhpcy5jb3VudCA9PT0gMCkge1xuICAgICAgdGhpcy5zID0gcmVhZFZhckludCh0aGlzKVxuICAgICAgLy8gaWYgdGhlIHNpZ24gaXMgbmVnYXRpdmUsIHdlIHJlYWQgdGhlIGNvdW50IHRvbywgb3RoZXJ3aXNlIGNvdW50IGlzIDFcbiAgICAgIGNvbnN0IGlzTmVnYXRpdmUgPSBtYXRoLmlzTmVnYXRpdmVaZXJvKHRoaXMucylcbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICBpZiAoaXNOZWdhdGl2ZSkge1xuICAgICAgICB0aGlzLnMgPSAtdGhpcy5zXG4gICAgICAgIHRoaXMuY291bnQgPSByZWFkVmFyVWludCh0aGlzKSArIDJcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jb3VudC0tXG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7bnVtYmVyfSAqLyAodGhpcy5zKyspXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEludERpZmZPcHRSbGVEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5KSB7XG4gICAgc3VwZXIodWludDhBcnJheSlcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucyA9IDBcbiAgICB0aGlzLmNvdW50ID0gMFxuICAgIHRoaXMuZGlmZiA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICByZWFkICgpIHtcbiAgICBpZiAodGhpcy5jb3VudCA9PT0gMCkge1xuICAgICAgY29uc3QgZGlmZiA9IHJlYWRWYXJJbnQodGhpcylcbiAgICAgIC8vIGlmIHRoZSBmaXJzdCBiaXQgaXMgc2V0LCB3ZSByZWFkIG1vcmUgZGF0YVxuICAgICAgY29uc3QgaGFzQ291bnQgPSBkaWZmICYgMVxuICAgICAgdGhpcy5kaWZmID0gbWF0aC5mbG9vcihkaWZmIC8gMikgLy8gc2hpZnQgPj4gMVxuICAgICAgdGhpcy5jb3VudCA9IDFcbiAgICAgIGlmIChoYXNDb3VudCkge1xuICAgICAgICB0aGlzLmNvdW50ID0gcmVhZFZhclVpbnQodGhpcykgKyAyXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucyArPSB0aGlzLmRpZmZcbiAgICB0aGlzLmNvdW50LS1cbiAgICByZXR1cm4gdGhpcy5zXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN0cmluZ0RlY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OEFycmF5XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSkge1xuICAgIHRoaXMuZGVjb2RlciA9IG5ldyBVaW50T3B0UmxlRGVjb2Rlcih1aW50OEFycmF5KVxuICAgIHRoaXMuc3RyID0gcmVhZFZhclN0cmluZyh0aGlzLmRlY29kZXIpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnNwb3MgPSAwXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKi9cbiAgcmVhZCAoKSB7XG4gICAgY29uc3QgZW5kID0gdGhpcy5zcG9zICsgdGhpcy5kZWNvZGVyLnJlYWQoKVxuICAgIGNvbnN0IHJlcyA9IHRoaXMuc3RyLnNsaWNlKHRoaXMuc3BvcywgZW5kKVxuICAgIHRoaXMuc3BvcyA9IGVuZFxuICAgIHJldHVybiByZXNcbiAgfVxufVxuIiwgIi8qKlxuICogT2Z0ZW4gdXNlZCBjb25kaXRpb25zLlxuICpcbiAqIEBtb2R1bGUgY29uZGl0aW9uc1xuICovXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7VHxudWxsfHVuZGVmaW5lZH0gdlxuICogQHJldHVybiB7VHxudWxsfVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IHVuZGVmaW5lZFRvTnVsbCA9IHYgPT4gdiA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHZcbiIsICIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuLyoqXG4gKiBJc29tb3JwaGljIHZhcmlhYmxlIHN0b3JhZ2UuXG4gKlxuICogVXNlcyBMb2NhbFN0b3JhZ2UgaW4gdGhlIGJyb3dzZXIgYW5kIGZhbGxzIGJhY2sgdG8gaW4tbWVtb3J5IHN0b3JhZ2UuXG4gKlxuICogQG1vZHVsZSBzdG9yYWdlXG4gKi9cblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG5jbGFzcyBWYXJTdG9yYWdlUG9seWZpbGwge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5tYXAgPSBuZXcgTWFwKClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAqIEBwYXJhbSB7YW55fSBuZXdWYWx1ZVxuICAgKi9cbiAgc2V0SXRlbSAoa2V5LCBuZXdWYWx1ZSkge1xuICAgIHRoaXMubWFwLnNldChrZXksIG5ld1ZhbHVlKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICovXG4gIGdldEl0ZW0gKGtleSkge1xuICAgIHJldHVybiB0aGlzLm1hcC5nZXQoa2V5KVxuICB9XG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEB0eXBlIHthbnl9XG4gKi9cbmxldCBfbG9jYWxTdG9yYWdlID0gbmV3IFZhclN0b3JhZ2VQb2x5ZmlsbCgpXG5sZXQgdXNlUG9seWZpbGwgPSB0cnVlXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xudHJ5IHtcbiAgLy8gaWYgdGhlIHNhbWUtb3JpZ2luIHJ1bGUgaXMgdmlvbGF0ZWQsIGFjY2Vzc2luZyBsb2NhbFN0b3JhZ2UgbWlnaHQgdGhyb3duIGFuIGVycm9yXG4gIGlmICh0eXBlb2YgbG9jYWxTdG9yYWdlICE9PSAndW5kZWZpbmVkJyAmJiBsb2NhbFN0b3JhZ2UpIHtcbiAgICBfbG9jYWxTdG9yYWdlID0gbG9jYWxTdG9yYWdlXG4gICAgdXNlUG9seWZpbGwgPSBmYWxzZVxuICB9XG59IGNhdGNoIChlKSB7IH1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogVGhpcyBpcyBiYXNpY2FsbHkgbG9jYWxTdG9yYWdlIGluIGJyb3dzZXIsIG9yIGEgcG9seWZpbGwgaW4gbm9kZWpzXG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgdmFyU3RvcmFnZSA9IF9sb2NhbFN0b3JhZ2VcblxuLyoqXG4gKiBBIHBvbHlmaWxsIGZvciBgYWRkRXZlbnRMaXN0ZW5lcignc3RvcmFnZScsIGV2ZW50ID0+IHsuLn0pYCB0aGF0IGRvZXMgbm90aGluZyBpZiB0aGUgcG9seWZpbGwgaXMgYmVpbmcgdXNlZC5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHsga2V5OiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmcgfSk6IHZvaWR9IGV2ZW50SGFuZGxlclxuICogQGZ1bmN0aW9uXG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3Qgb25DaGFuZ2UgPSBldmVudEhhbmRsZXIgPT4gdXNlUG9seWZpbGwgfHwgYWRkRXZlbnRMaXN0ZW5lcignc3RvcmFnZScsIC8qKiBAdHlwZSB7YW55fSAqLyAoZXZlbnRIYW5kbGVyKSlcblxuLyoqXG4gKiBBIHBvbHlmaWxsIGZvciBgcmVtb3ZlRXZlbnRMaXN0ZW5lcignc3RvcmFnZScsIGV2ZW50ID0+IHsuLn0pYCB0aGF0IGRvZXMgbm90aGluZyBpZiB0aGUgcG9seWZpbGwgaXMgYmVpbmcgdXNlZC5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHsga2V5OiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmcgfSk6IHZvaWR9IGV2ZW50SGFuZGxlclxuICogQGZ1bmN0aW9uXG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3Qgb2ZmQ2hhbmdlID0gZXZlbnRIYW5kbGVyID0+IHVzZVBvbHlmaWxsIHx8IHJlbW92ZUV2ZW50TGlzdGVuZXIoJ3N0b3JhZ2UnLCAvKiogQHR5cGUge2FueX0gKi8gKGV2ZW50SGFuZGxlcikpXG4iLCAiZXhwb3J0IGNvbnN0IEVxdWFsaXR5VHJhaXRTeW1ib2wgPSBTeW1ib2woJ0VxdWFsaXR5JylcblxuLyoqXG4gKiBAdHlwZWRlZiB7eyBbRXF1YWxpdHlUcmFpdFN5bWJvbF06KG90aGVyOkVxdWFsaXR5VHJhaXQpPT5ib29sZWFuIH19IEVxdWFsaXR5VHJhaXRcbiAqL1xuXG4vKipcbiAqXG4gKiBVdGlsaXR5IGZ1bmN0aW9uIHRvIGNvbXBhcmUgYW55IHR3byBvYmplY3RzLlxuICpcbiAqIE5vdGUgdGhhdCBpdCBpcyBleHBlY3RlZCB0aGF0IHRoZSBmaXJzdCBwYXJhbWV0ZXIgaXMgbW9yZSBzcGVjaWZpYyB0aGFuIHRoZSBsYXR0ZXIgb25lLlxuICpcbiAqIEBleGFtcGxlIGpzXG4gKiAgICAgY2xhc3MgWCB7IFt0cmFpdHMuRXF1YWxpdHlUcmFpdFN5bWJvbF0gKG90aGVyKSB7IHJldHVybiBvdGhlciA9PT0gdGhpcyB9ICB9XG4gKiAgICAgY2xhc3MgWDIgeyBbdHJhaXRzLkVxdWFsaXR5VHJhaXRTeW1ib2xdIChvdGhlcikgeyByZXR1cm4gb3RoZXIgPT09IHRoaXMgfSwgeDIgKCkgeyByZXR1cm4gMiB9ICB9XG4gKiAgICAgLy8gdGhpcyBpcyBmaW5lXG4gKiAgICAgdHJhaXRzLmVxdWFscyhuZXcgWDIoKSwgbmV3IFgoKSlcbiAqICAgICAvLyB0aGlzIGlzIG5vdCwgYmVjYXVzZSB0aGUgbGVmdCB0eXBlIGlzIGxlc3Mgc3BlY2lmaWMgdGhhbiB0aGUgcmlnaHQgb25lXG4gKiAgICAgdHJhaXRzLmVxdWFscyhuZXcgWCgpLCBuZXcgWDIoKSlcbiAqXG4gKiBAdGVtcGxhdGUge0VxdWFsaXR5VHJhaXR9IFRcbiAqIEBwYXJhbSB7Tm9JbmZlcjxUPn0gYVxuICogQHBhcmFtIHtUfSBiXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgZXF1YWxzID0gKGEsIGIpID0+IGEgPT09IGIgfHwgISFhPy5bRXF1YWxpdHlUcmFpdFN5bWJvbF0/LihiKSB8fCBmYWxzZVxuIiwgImltcG9ydCAqIGFzIGVxdWFsaXR5VHJhaXQgZnJvbSAnLi90cmFpdC9lcXVhbGl0eS5qcydcblxuLyoqXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyBmb3Igd29ya2luZyB3aXRoIEVjbWFTY3JpcHQgb2JqZWN0cy5cbiAqXG4gKiBAbW9kdWxlIG9iamVjdFxuICovXG5cbi8qKlxuICogQHJldHVybiB7T2JqZWN0PHN0cmluZyxhbnk+fSBvYmpcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9ICgpID0+IE9iamVjdC5jcmVhdGUobnVsbClcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gb1xuICogQHJldHVybiB7byBpcyB7IFtrOnN0cmluZ106YW55IH19XG4gKi9cbmV4cG9ydCBjb25zdCBpc09iamVjdCA9IG8gPT4gdHlwZW9mIG8gPT09ICdvYmplY3QnXG5cbi8qKlxuICogT2JqZWN0LmFzc2lnblxuICovXG5leHBvcnQgY29uc3QgYXNzaWduID0gT2JqZWN0LmFzc2lnblxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBvYmpcbiAqL1xuZXhwb3J0IGNvbnN0IGtleXMgPSBPYmplY3Qua2V5c1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge3tba2V5OnN0cmluZ106IFZ9fSBvYmpcbiAqIEByZXR1cm4ge0FycmF5PFY+fVxuICovXG5leHBvcnQgY29uc3QgdmFsdWVzID0gT2JqZWN0LnZhbHVlc1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge3tbazpzdHJpbmddOlZ9fSBvYmpcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oVixzdHJpbmcpOmFueX0gZlxuICovXG5leHBvcnQgY29uc3QgZm9yRWFjaCA9IChvYmosIGYpID0+IHtcbiAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgZihvYmpba2V5XSwga2V5KVxuICB9XG59XG5cbi8qKlxuICogQHRvZG8gaW1wbGVtZW50IG1hcFRvQXJyYXkgJiBtYXBcbiAqXG4gKiBAdGVtcGxhdGUgUlxuICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLGFueT59IG9ialxuICogQHBhcmFtIHtmdW5jdGlvbihhbnksc3RyaW5nKTpSfSBmXG4gKiBAcmV0dXJuIHtBcnJheTxSPn1cbiAqL1xuZXhwb3J0IGNvbnN0IG1hcCA9IChvYmosIGYpID0+IHtcbiAgY29uc3QgcmVzdWx0cyA9IFtdXG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIHJlc3VsdHMucHVzaChmKG9ialtrZXldLCBrZXkpKVxuICB9XG4gIHJldHVybiByZXN1bHRzXG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC5zaXplIGluc3RlYWRcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBvYmpcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IGxlbmd0aCA9IG9iaiA9PiBrZXlzKG9iaikubGVuZ3RoXG5cbi8qKlxuICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLGFueT59IG9ialxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3Qgc2l6ZSA9IG9iaiA9PiBrZXlzKG9iaikubGVuZ3RoXG5cbi8qKlxuICogQHRlbXBsYXRlIHt7IFtrZXk6c3RyaW5nfG51bWJlcnxzeW1ib2xdOiBhbnkgfX0gVFxuICogQHBhcmFtIHtUfSBvYmpcbiAqIEBwYXJhbSB7KHY6VFtrZXlvZiBUXSxrOmtleW9mIFQpPT5ib29sZWFufSBmXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3Qgc29tZSA9IChvYmosIGYpID0+IHtcbiAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGYob2JqW2tleV0sIGtleSkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fG51bGx8dW5kZWZpbmVkfSBvYmpcbiAqL1xuZXhwb3J0IGNvbnN0IGlzRW1wdHkgPSBvYmogPT4ge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5yZWFjaGFibGUtbG9vcFxuICBmb3IgKGNvbnN0IF9rIGluIG9iaikge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogQHRlbXBsYXRlIHt7IFtrZXk6c3RyaW5nfG51bWJlcnxzeW1ib2xdOiBhbnkgfX0gVFxuICogQHBhcmFtIHtUfSBvYmpcbiAqIEBwYXJhbSB7KHY6VFtrZXlvZiBUXSxrOmtleW9mIFQpPT5ib29sZWFufSBmXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgZXZlcnkgPSAob2JqLCBmKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIGlmICghZihvYmpba2V5XSwga2V5KSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogQ2FsbHMgYE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlgLlxuICpcbiAqIEBwYXJhbSB7YW55fSBvYmpcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxzeW1ib2x9IGtleVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGhhc1Byb3BlcnR5ID0gKG9iaiwga2V5KSA9PiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpXG5cbi8qKlxuICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLGFueT59IGFcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBiXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgZXF1YWxGbGF0ID0gKGEsIGIpID0+IGEgPT09IGIgfHwgKHNpemUoYSkgPT09IHNpemUoYikgJiYgZXZlcnkoYSwgKHZhbCwga2V5KSA9PiAodmFsICE9PSB1bmRlZmluZWQgfHwgaGFzUHJvcGVydHkoYiwga2V5KSkgJiYgZXF1YWxpdHlUcmFpdC5lcXVhbHMoYltrZXldLCB2YWwpKSlcblxuLyoqXG4gKiBNYWtlIGFuIG9iamVjdCBpbW11dGFibGUuIFRoaXMgaHVydHMgcGVyZm9ybWFuY2UgYW5kIGlzIHVzdWFsbHkgbm90IG5lZWRlZCBpZiB5b3UgcGVyZm9ybSBnb29kXG4gKiBjb2RpbmcgcHJhY3RpY2VzLlxuICovXG5leHBvcnQgY29uc3QgZnJlZXplID0gT2JqZWN0LmZyZWV6ZVxuXG4vKipcbiAqIE1ha2UgYW4gb2JqZWN0IGFuZCBhbGwgaXRzIGNoaWxkcmVuIGltbXV0YWJsZS5cbiAqIFRoaXMgKnJlYWxseSogaHVydHMgcGVyZm9ybWFuY2UgYW5kIGlzIHVzdWFsbHkgbm90IG5lZWRlZCBpZiB5b3UgcGVyZm9ybSBnb29kIGNvZGluZyBwcmFjdGljZXMuXG4gKlxuICogQHRlbXBsYXRlIHthbnl9IFRcbiAqIEBwYXJhbSB7VH0gb1xuICogQHJldHVybiB7UmVhZG9ubHk8VD59XG4gKi9cbmV4cG9ydCBjb25zdCBkZWVwRnJlZXplID0gKG8pID0+IHtcbiAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgIGNvbnN0IGMgPSBvW2tleV1cbiAgICBpZiAodHlwZW9mIGMgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBjID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBkZWVwRnJlZXplKG9ba2V5XSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZyZWV6ZShvKVxufVxuXG4vKipcbiAqIEdldCBvYmplY3QgcHJvcGVydHkuIENyZWF0ZSBUIGlmIHByb3BlcnR5IGlzIHVuZGVmaW5lZCBhbmQgc2V0IFQgb24gb2JqZWN0LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIHtvYmplY3R9IEtWXG4gKiBAdGVtcGxhdGUge2tleW9mIEtWfSBbSz1rZXlvZiBLVl1cbiAqIEBwYXJhbSB7S1Z9IG9cbiAqIEBwYXJhbSB7S30ga2V5XG4gKiBAcGFyYW0geygpID0+IEtWW0tdfSBjcmVhdGVUXG4gKiBAcmV0dXJuIHtLVltLXX1cbiAqL1xuZXhwb3J0IGNvbnN0IHNldElmVW5kZWZpbmVkID0gKG8sIGtleSwgY3JlYXRlVCkgPT4gaGFzUHJvcGVydHkobywga2V5KSA/IG9ba2V5XSA6IChvW2tleV0gPSBjcmVhdGVUKCkpXG4iLCAiLyoqXG4gKiBDb21tb24gZnVuY3Rpb25zIGFuZCBmdW5jdGlvbiBjYWxsIGhlbHBlcnMuXG4gKlxuICogQG1vZHVsZSBmdW5jdGlvblxuICovXG5cbmltcG9ydCAqIGFzIGFycmF5IGZyb20gJy4vYXJyYXkuanMnXG5pbXBvcnQgKiBhcyBvYmplY3QgZnJvbSAnLi9vYmplY3QuanMnXG5pbXBvcnQgKiBhcyBlcXVhbGl0eVRyYWl0IGZyb20gJy4vdHJhaXQvZXF1YWxpdHkuanMnXG5cbi8qKlxuICogQ2FsbHMgYWxsIGZ1bmN0aW9ucyBpbiBgZnNgIHdpdGggYXJncy4gT25seSB0aHJvd3MgYWZ0ZXIgYWxsIGZ1bmN0aW9ucyB3ZXJlIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0ge0FycmF5PGZ1bmN0aW9uPn0gZnNcbiAqIEBwYXJhbSB7QXJyYXk8YW55Pn0gYXJnc1xuICovXG5leHBvcnQgY29uc3QgY2FsbEFsbCA9IChmcywgYXJncywgaSA9IDApID0+IHtcbiAgdHJ5IHtcbiAgICBmb3IgKDsgaSA8IGZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmc1tpXSguLi5hcmdzKVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoaSA8IGZzLmxlbmd0aCkge1xuICAgICAgY2FsbEFsbChmcywgYXJncywgaSArIDEpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBub3AgPSAoKSA9PiB7fVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCk6VH0gZlxuICogQHJldHVybiB7VH1cbiAqL1xuZXhwb3J0IGNvbnN0IGFwcGx5ID0gZiA9PiBmKClcblxuLyoqXG4gKiBAdGVtcGxhdGUgQVxuICpcbiAqIEBwYXJhbSB7QX0gYVxuICogQHJldHVybiB7QX1cbiAqL1xuZXhwb3J0IGNvbnN0IGlkID0gYSA9PiBhXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqXG4gKiBAcGFyYW0ge1R9IGFcbiAqIEBwYXJhbSB7VH0gYlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGVxdWFsaXR5U3RyaWN0ID0gKGEsIGIpID0+IGEgPT09IGJcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICpcbiAqIEBwYXJhbSB7QXJyYXk8VD58b2JqZWN0fSBhXG4gKiBAcGFyYW0ge0FycmF5PFQ+fG9iamVjdH0gYlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGVxdWFsaXR5RmxhdCA9IChhLCBiKSA9PiBhID09PSBiIHx8IChhICE9IG51bGwgJiYgYiAhPSBudWxsICYmIGEuY29uc3RydWN0b3IgPT09IGIuY29uc3RydWN0b3IgJiYgKChhcnJheS5pc0FycmF5KGEpICYmIGFycmF5LmVxdWFsRmxhdChhLCAvKiogQHR5cGUge0FycmF5PFQ+fSAqLyAoYikpKSB8fCAodHlwZW9mIGEgPT09ICdvYmplY3QnICYmIG9iamVjdC5lcXVhbEZsYXQoYSwgYikpKSlcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG5cbi8qKlxuICogQHBhcmFtIHthbnl9IGFcbiAqIEBwYXJhbSB7YW55fSBiXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgZXF1YWxpdHlEZWVwID0gKGEsIGIpID0+IHtcbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsIHx8IChhLmNvbnN0cnVjdG9yICE9PSBiLmNvbnN0cnVjdG9yICYmIChhLmNvbnN0cnVjdG9yIHx8IE9iamVjdCkgIT09IChiLmNvbnN0cnVjdG9yIHx8IE9iamVjdCkpKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgaWYgKGFbZXF1YWxpdHlUcmFpdC5FcXVhbGl0eVRyYWl0U3ltYm9sXSAhPSBudWxsKSB7XG4gICAgcmV0dXJuIGFbZXF1YWxpdHlUcmFpdC5FcXVhbGl0eVRyYWl0U3ltYm9sXShiKVxuICB9XG4gIHN3aXRjaCAoYS5jb25zdHJ1Y3Rvcikge1xuICAgIGNhc2UgQXJyYXlCdWZmZXI6XG4gICAgICBhID0gbmV3IFVpbnQ4QXJyYXkoYSlcbiAgICAgIGIgPSBuZXcgVWludDhBcnJheShiKVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1mYWxsdGhyb3VnaFxuICAgIGNhc2UgVWludDhBcnJheToge1xuICAgICAgaWYgKGEuYnl0ZUxlbmd0aCAhPT0gYi5ieXRlTGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgfVxuICAgIGNhc2UgU2V0OiB7XG4gICAgICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGEpIHtcbiAgICAgICAgaWYgKCFiLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICB9XG4gICAgY2FzZSBNYXA6IHtcbiAgICAgIGlmIChhLnNpemUgIT09IGIuc2l6ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIGEua2V5cygpKSB7XG4gICAgICAgIGlmICghYi5oYXMoa2V5KSB8fCAhZXF1YWxpdHlEZWVwKGEuZ2V0KGtleSksIGIuZ2V0KGtleSkpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgfVxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgIGNhc2UgT2JqZWN0OlxuICAgICAgaWYgKG9iamVjdC5zaXplKGEpICE9PSBvYmplY3Quc2l6ZShiKSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3Qga2V5IGluIGEpIHtcbiAgICAgICAgaWYgKCFvYmplY3QuaGFzUHJvcGVydHkoYSwga2V5KSB8fCAhZXF1YWxpdHlEZWVwKGFba2V5XSwgYltrZXldKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuICAgIGNhc2UgQXJyYXk6XG4gICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghZXF1YWxpdHlEZWVwKGFbaV0sIGJbaV0pKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogQHRlbXBsYXRlIFZcbiAqIEB0ZW1wbGF0ZSB7Vn0gT1BUU1xuICpcbiAqIEBwYXJhbSB7Vn0gdmFsdWVcbiAqIEBwYXJhbSB7QXJyYXk8T1BUUz59IG9wdGlvbnNcbiAqL1xuLy8gQHRzLWlnbm9yZVxuZXhwb3J0IGNvbnN0IGlzT25lT2YgPSAodmFsdWUsIG9wdGlvbnMpID0+IG9wdGlvbnMuaW5jbHVkZXModmFsdWUpXG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG5leHBvcnQgY29uc3QgaXNBcnJheSA9IGFycmF5LmlzQXJyYXlcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gc1xuICogQHJldHVybiB7cyBpcyBTdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBpc1N0cmluZyA9IChzKSA9PiBzICYmIHMuY29uc3RydWN0b3IgPT09IFN0cmluZ1xuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBuXG4gKiBAcmV0dXJuIHtuIGlzIE51bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IGlzTnVtYmVyID0gbiA9PiBuICE9IG51bGwgJiYgbi5jb25zdHJ1Y3RvciA9PT0gTnVtYmVyXG5cbi8qKlxuICogQHRlbXBsYXRlIHthYnN0cmFjdCBuZXcgKC4uLmFyZ3M6IGFueSkgPT4gYW55fSBUWVBFXG4gKiBAcGFyYW0ge2FueX0gblxuICogQHBhcmFtIHtUWVBFfSBUXG4gKiBAcmV0dXJuIHtuIGlzIEluc3RhbmNlVHlwZTxUWVBFPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGlzID0gKG4sIFQpID0+IG4gJiYgbi5jb25zdHJ1Y3RvciA9PT0gVFxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7YWJzdHJhY3QgbmV3ICguLi5hcmdzOiBhbnkpID0+IGFueX0gVFlQRVxuICogQHBhcmFtIHtUWVBFfSBUXG4gKi9cbmV4cG9ydCBjb25zdCBpc1RlbXBsYXRlID0gKFQpID0+XG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gblxuICAgKiBAcmV0dXJuIHtuIGlzIEluc3RhbmNlVHlwZTxUWVBFPn1cbiAgICoqL1xuICBuID0+IG4gJiYgbi5jb25zdHJ1Y3RvciA9PT0gVFxuIiwgIi8qKlxuICogSXNvbW9ycGhpYyBtb2R1bGUgdG8gd29yayBhY2Nlc3MgdGhlIGVudmlyb25tZW50IChxdWVyeSBwYXJhbXMsIGVudiB2YXJpYWJsZXMpLlxuICpcbiAqIEBtb2R1bGUgZW52aXJvbm1lbnRcbiAqL1xuXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnLi9tYXAuanMnXG5pbXBvcnQgKiBhcyBzdHJpbmcgZnJvbSAnLi9zdHJpbmcuanMnXG5pbXBvcnQgKiBhcyBjb25kaXRpb25zIGZyb20gJy4vY29uZGl0aW9ucy5qcydcbmltcG9ydCAqIGFzIHN0b3JhZ2UgZnJvbSAnLi9zdG9yYWdlLmpzJ1xuaW1wb3J0ICogYXMgZiBmcm9tICcuL2Z1bmN0aW9uLmpzJ1xuXG4vKiBjOCBpZ25vcmUgbmV4dCAyICovXG4vLyBAdHMtaWdub3JlXG5leHBvcnQgY29uc3QgaXNOb2RlID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MucmVsZWFzZSAmJiAvbm9kZXxpb1xcLmpzLy50ZXN0KHByb2Nlc3MucmVsZWFzZS5uYW1lKSAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnID8gcHJvY2VzcyA6IDApID09PSAnW29iamVjdCBwcm9jZXNzXSdcblxuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCBpc0Jyb3dzZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmICFpc05vZGVcbi8qIGM4IGlnbm9yZSBuZXh0IDMgKi9cbmV4cG9ydCBjb25zdCBpc01hYyA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnXG4gID8gL01hYy8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pXG4gIDogZmFsc2VcblxuLyoqXG4gKiBAdHlwZSB7TWFwPHN0cmluZyxzdHJpbmc+fVxuICovXG5sZXQgcGFyYW1zXG5jb25zdCBhcmdzID0gW11cblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG5jb25zdCBjb21wdXRlUGFyYW1zID0gKCkgPT4ge1xuICBpZiAocGFyYW1zID09PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoaXNOb2RlKSB7XG4gICAgICBwYXJhbXMgPSBtYXAuY3JlYXRlKClcbiAgICAgIGNvbnN0IHBhcmdzID0gcHJvY2Vzcy5hcmd2XG4gICAgICBsZXQgY3VyclBhcmFtTmFtZSA9IG51bGxcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFyZyA9IHBhcmdzW2ldXG4gICAgICAgIGlmIChwYXJnWzBdID09PSAnLScpIHtcbiAgICAgICAgICBpZiAoY3VyclBhcmFtTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyYW1zLnNldChjdXJyUGFyYW1OYW1lLCAnJylcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VyclBhcmFtTmFtZSA9IHBhcmdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoY3VyclBhcmFtTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyYW1zLnNldChjdXJyUGFyYW1OYW1lLCBwYXJnKVxuICAgICAgICAgICAgY3VyclBhcmFtTmFtZSA9IG51bGxcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJncy5wdXNoKHBhcmcpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoY3VyclBhcmFtTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICBwYXJhbXMuc2V0KGN1cnJQYXJhbU5hbWUsICcnKVxuICAgICAgfVxuICAgICAgLy8gaW4gUmVhY3ROYXRpdmUgZm9yIGV4YW1wbGUgdGhpcyB3b3VsZCBub3QgYmUgdHJ1ZSAodW5sZXNzIGNvbm5lY3RlZCB0byB0aGUgUmVtb3RlIERlYnVnZ2VyKVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGxvY2F0aW9uID09PSAnb2JqZWN0Jykge1xuICAgICAgcGFyYW1zID0gbWFwLmNyZWF0ZSgpOyAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbiAgICAgIChsb2NhdGlvbi5zZWFyY2ggfHwgJz8nKS5zbGljZSgxKS5zcGxpdCgnJicpLmZvckVhY2goKGt2KSA9PiB7XG4gICAgICAgIGlmIChrdi5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICBjb25zdCBba2V5LCB2YWx1ZV0gPSBrdi5zcGxpdCgnPScpXG4gICAgICAgICAgcGFyYW1zLnNldChgLS0ke3N0cmluZy5mcm9tQ2FtZWxDYXNlKGtleSwgJy0nKX1gLCB2YWx1ZSlcbiAgICAgICAgICBwYXJhbXMuc2V0KGAtJHtzdHJpbmcuZnJvbUNhbWVsQ2FzZShrZXksICctJyl9YCwgdmFsdWUpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmFtcyA9IG1hcC5jcmVhdGUoKVxuICAgIH1cbiAgfVxuICByZXR1cm4gcGFyYW1zXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IGhhc1BhcmFtID0gKG5hbWUpID0+IGNvbXB1dGVQYXJhbXMoKS5oYXMobmFtZSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IGRlZmF1bHRWYWxcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IGdldFBhcmFtID0gKG5hbWUsIGRlZmF1bHRWYWwpID0+XG4gIGNvbXB1dGVQYXJhbXMoKS5nZXQobmFtZSkgfHwgZGVmYXVsdFZhbFxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgNCAqL1xuZXhwb3J0IGNvbnN0IGdldFZhcmlhYmxlID0gKG5hbWUpID0+XG4gIGlzTm9kZVxuICAgID8gY29uZGl0aW9ucy51bmRlZmluZWRUb051bGwocHJvY2Vzcy5lbnZbbmFtZS50b1VwcGVyQ2FzZSgpLnJlcGxhY2VBbGwoJy0nLCAnXycpXSlcbiAgICA6IGNvbmRpdGlvbnMudW5kZWZpbmVkVG9OdWxsKHN0b3JhZ2UudmFyU3RvcmFnZS5nZXRJdGVtKG5hbWUpKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IGdldENvbmYgPSAobmFtZSkgPT5cbiAgY29tcHV0ZVBhcmFtcygpLmdldCgnLS0nICsgbmFtZSkgfHwgZ2V0VmFyaWFibGUobmFtZSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCA1ICovXG5leHBvcnQgY29uc3QgZW5zdXJlQ29uZiA9IChuYW1lKSA9PiB7XG4gIGNvbnN0IGMgPSBnZXRDb25mKG5hbWUpXG4gIGlmIChjID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgY29uZmlndXJhdGlvbiBcIiR7bmFtZS50b1VwcGVyQ2FzZSgpLnJlcGxhY2VBbGwoJy0nLCAnXycpfVwiYClcbiAgcmV0dXJuIGNcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IGhhc0NvbmYgPSAobmFtZSkgPT5cbiAgaGFzUGFyYW0oJy0tJyArIG5hbWUpIHx8IGdldFZhcmlhYmxlKG5hbWUpICE9PSBudWxsXG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgcHJvZHVjdGlvbiA9IGhhc0NvbmYoJ3Byb2R1Y3Rpb24nKVxuXG4vKiBjOCBpZ25vcmUgbmV4dCAyICovXG5jb25zdCBmb3JjZUNvbG9yID0gaXNOb2RlICYmXG4gIGYuaXNPbmVPZihwcm9jZXNzLmVudi5GT1JDRV9DT0xPUiwgWyd0cnVlJywgJzEnLCAnMiddKVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQ29sb3IgaXMgZW5hYmxlZCBieSBkZWZhdWx0IGlmIHRoZSB0ZXJtaW5hbCBzdXBwb3J0cyBpdC5cbiAqXG4gKiBFeHBsaWNpdGx5IGVuYWJsZSBjb2xvciB1c2luZyBgLS1jb2xvcmAgcGFyYW1ldGVyXG4gKiBEaXNhYmxlIGNvbG9yIHVzaW5nIGAtLW5vLWNvbG9yYCBwYXJhbWV0ZXIgb3IgdXNpbmcgYE5PX0NPTE9SPTFgIGVudmlyb25tZW50IHZhcmlhYmxlLlxuICogYEZPUkNFX0NPTE9SPTFgIGVuYWJsZXMgY29sb3IgYW5kIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBhbGwuXG4gKi9cbmV4cG9ydCBjb25zdCBzdXBwb3J0c0NvbG9yID0gZm9yY2VDb2xvciB8fCAoXG4gICFoYXNQYXJhbSgnLS1uby1jb2xvcnMnKSAmJiAvLyBAdG9kbyBkZXByZWNhdGUgLS1uby1jb2xvcnNcbiAgIWhhc0NvbmYoJ25vLWNvbG9yJykgJiZcbiAgKCFpc05vZGUgfHwgcHJvY2Vzcy5zdGRvdXQuaXNUVFkpICYmIChcbiAgICAhaXNOb2RlIHx8XG4gICAgaGFzUGFyYW0oJy0tY29sb3InKSB8fFxuICAgIGdldFZhcmlhYmxlKCdDT0xPUlRFUk0nKSAhPT0gbnVsbCB8fFxuICAgIChnZXRWYXJpYWJsZSgnVEVSTScpIHx8ICcnKS5pbmNsdWRlcygnY29sb3InKVxuICApXG4pXG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuIiwgIi8qKlxuICogV29ya2luZyB3aXRoIHZhbHVlIHBhaXJzLlxuICpcbiAqIEBtb2R1bGUgcGFpclxuICovXG5cbi8qKlxuICogQHRlbXBsYXRlIEwsUlxuICovXG5leHBvcnQgY2xhc3MgUGFpciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0x9IGxlZnRcbiAgICogQHBhcmFtIHtSfSByaWdodFxuICAgKi9cbiAgY29uc3RydWN0b3IgKGxlZnQsIHJpZ2h0KSB7XG4gICAgdGhpcy5sZWZ0ID0gbGVmdFxuICAgIHRoaXMucmlnaHQgPSByaWdodFxuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIEwsUlxuICogQHBhcmFtIHtMfSBsZWZ0XG4gKiBAcGFyYW0ge1J9IHJpZ2h0XG4gKiBAcmV0dXJuIHtQYWlyPEwsUj59XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGUgPSAobGVmdCwgcmlnaHQpID0+IG5ldyBQYWlyKGxlZnQsIHJpZ2h0KVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBMLFJcbiAqIEBwYXJhbSB7Un0gcmlnaHRcbiAqIEBwYXJhbSB7TH0gbGVmdFxuICogQHJldHVybiB7UGFpcjxMLFI+fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlUmV2ZXJzZWQgPSAocmlnaHQsIGxlZnQpID0+IG5ldyBQYWlyKGxlZnQsIHJpZ2h0KVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBMLFJcbiAqIEBwYXJhbSB7QXJyYXk8UGFpcjxMLFI+Pn0gYXJyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKEwsIFIpOmFueX0gZlxuICovXG5leHBvcnQgY29uc3QgZm9yRWFjaCA9IChhcnIsIGYpID0+IGFyci5mb3JFYWNoKHAgPT4gZihwLmxlZnQsIHAucmlnaHQpKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBMLFIsWFxuICogQHBhcmFtIHtBcnJheTxQYWlyPEwsUj4+fSBhcnJcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oTCwgUik6WH0gZlxuICogQHJldHVybiB7QXJyYXk8WD59XG4gKi9cbmV4cG9ydCBjb25zdCBtYXAgPSAoYXJyLCBmKSA9PiBhcnIubWFwKHAgPT4gZihwLmxlZnQsIHAucmlnaHQpKVxuIiwgIi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbnMgdG8gd29yayB3aXRoIGJ1ZmZlcnMgKFVpbnQ4QXJyYXkpLlxuICpcbiAqIEBtb2R1bGUgYnVmZmVyXG4gKi9cblxuaW1wb3J0ICogYXMgc3RyaW5nIGZyb20gJy4vc3RyaW5nLmpzJ1xuaW1wb3J0ICogYXMgZW52IGZyb20gJy4vZW52aXJvbm1lbnQuanMnXG5pbXBvcnQgKiBhcyBhcnJheSBmcm9tICcuL2FycmF5LmpzJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICcuL2VuY29kaW5nLmpzJ1xuaW1wb3J0ICogYXMgZGVjb2RpbmcgZnJvbSAnLi9kZWNvZGluZy5qcydcblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVVaW50OEFycmF5RnJvbUxlbiA9IGxlbiA9PiBuZXcgVWludDhBcnJheShsZW4pXG5cbi8qKlxuICogQ3JlYXRlIFVpbnQ4QXJyYXkgd2l0aCBpbml0aWFsIGNvbnRlbnQgZnJvbSBidWZmZXJcbiAqXG4gKiBAcGFyYW0ge0FycmF5QnVmZmVyfSBidWZmZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBieXRlT2Zmc2V0XG4gKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVVaW50OEFycmF5Vmlld0Zyb21BcnJheUJ1ZmZlciA9IChidWZmZXIsIGJ5dGVPZmZzZXQsIGxlbmd0aCkgPT4gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyLCBieXRlT2Zmc2V0LCBsZW5ndGgpXG5cbi8qKlxuICogQ3JlYXRlIFVpbnQ4QXJyYXkgd2l0aCBpbml0aWFsIGNvbnRlbnQgZnJvbSBidWZmZXJcbiAqXG4gKiBAcGFyYW0ge0FycmF5QnVmZmVyfSBidWZmZXJcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVVpbnQ4QXJyYXlGcm9tQXJyYXlCdWZmZXIgPSBidWZmZXIgPT4gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBieXRlc1xuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5jb25zdCB0b0Jhc2U2NEJyb3dzZXIgPSBieXRlcyA9PiB7XG4gIGxldCBzID0gJydcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBieXRlcy5ieXRlTGVuZ3RoOyBpKyspIHtcbiAgICBzICs9IHN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0pXG4gIH1cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gIHJldHVybiBidG9hKHMpXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnl0ZXNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuY29uc3QgdG9CYXNlNjROb2RlID0gYnl0ZXMgPT4gQnVmZmVyLmZyb20oYnl0ZXMuYnVmZmVyLCBieXRlcy5ieXRlT2Zmc2V0LCBieXRlcy5ieXRlTGVuZ3RoKS50b1N0cmluZygnYmFzZTY0JylcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5PEFycmF5QnVmZmVyPn1cbiAqL1xuY29uc3QgZnJvbUJhc2U2NEJyb3dzZXIgPSBzID0+IHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gIGNvbnN0IGEgPSBhdG9iKHMpXG4gIGNvbnN0IGJ5dGVzID0gY3JlYXRlVWludDhBcnJheUZyb21MZW4oYS5sZW5ndGgpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgIGJ5dGVzW2ldID0gYS5jaGFyQ29kZUF0KGkpXG4gIH1cbiAgcmV0dXJuIGJ5dGVzXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzXG4gKi9cbmNvbnN0IGZyb21CYXNlNjROb2RlID0gcyA9PiB7XG4gIGNvbnN0IGJ1ZiA9IEJ1ZmZlci5mcm9tKHMsICdiYXNlNjQnKVxuICByZXR1cm4gY3JlYXRlVWludDhBcnJheVZpZXdGcm9tQXJyYXlCdWZmZXIoYnVmLmJ1ZmZlciwgYnVmLmJ5dGVPZmZzZXQsIGJ1Zi5ieXRlTGVuZ3RoKVxufVxuXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IHRvQmFzZTY0ID0gZW52LmlzQnJvd3NlciA/IHRvQmFzZTY0QnJvd3NlciA6IHRvQmFzZTY0Tm9kZVxuXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IGZyb21CYXNlNjQgPSBlbnYuaXNCcm93c2VyID8gZnJvbUJhc2U2NEJyb3dzZXIgOiBmcm9tQmFzZTY0Tm9kZVxuXG4vKipcbiAqIEltcGxlbWVudHMgYmFzZTY0dXJsIC0gc2VlIGh0dHBzOi8vZGF0YXRyYWNrZXIuaWV0Zi5vcmcvZG9jL2h0bWwvcmZjNDY0OCNzZWN0aW9uLTVcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKi9cbmV4cG9ydCBjb25zdCB0b0Jhc2U2NFVybEVuY29kZWQgPSBidWYgPT4gdG9CYXNlNjQoYnVmKS5yZXBsYWNlQWxsKCcrJywgJy0nKS5yZXBsYWNlQWxsKCcvJywgJ18nKS5yZXBsYWNlQWxsKCc9JywgJycpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGJhc2U2NFxuICovXG5leHBvcnQgY29uc3QgZnJvbUJhc2U2NFVybEVuY29kZWQgPSBiYXNlNjQgPT4gZnJvbUJhc2U2NChiYXNlNjQucmVwbGFjZUFsbCgnLScsICcrJykucmVwbGFjZUFsbCgnXycsICcvJykpXG5cbi8qKlxuICogQmFzZTY0IGlzIGFsd2F5cyBhIG1vcmUgZWZmaWNpZW50IGNob2ljZS4gVGhpcyBleGlzdHMgZm9yIHV0aWxpdHkgcHVycG9zZXMgb25seS5cbiAqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICovXG5leHBvcnQgY29uc3QgdG9IZXhTdHJpbmcgPSBidWYgPT4gYXJyYXkubWFwKGJ1ZiwgYiA9PiBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpKS5qb2luKCcnKVxuXG4vKipcbiAqIE5vdGU6IFRoaXMgZnVuY3Rpb24gZXhwZWN0cyB0aGF0IHRoZSBoZXggZG9lc24ndCBzdGFydCB3aXRoIDB4Li5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaGV4XG4gKi9cbmV4cG9ydCBjb25zdCBmcm9tSGV4U3RyaW5nID0gaGV4ID0+IHtcbiAgY29uc3QgaGxlbiA9IGhleC5sZW5ndGhcbiAgY29uc3QgYnVmID0gbmV3IFVpbnQ4QXJyYXkobWF0aC5jZWlsKGhsZW4gLyAyKSlcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBobGVuOyBpICs9IDIpIHtcbiAgICBidWZbYnVmLmxlbmd0aCAtIGkgLyAyIC0gMV0gPSBOdW1iZXIucGFyc2VJbnQoaGV4LnNsaWNlKGhsZW4gLSBpIC0gMiwgaGxlbiAtIGkpLCAxNilcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbi8qKlxuICogQ29weSB0aGUgY29udGVudCBvZiBhbiBVaW50OEFycmF5IHZpZXcgdG8gYSBuZXcgQXJyYXlCdWZmZXIuXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OEFycmF5XG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5leHBvcnQgY29uc3QgY29weVVpbnQ4QXJyYXkgPSB1aW50OEFycmF5ID0+IHtcbiAgY29uc3QgbmV3QnVmID0gY3JlYXRlVWludDhBcnJheUZyb21MZW4odWludDhBcnJheS5ieXRlTGVuZ3RoKVxuICBuZXdCdWYuc2V0KHVpbnQ4QXJyYXkpXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLyoqXG4gKiBFbmNvZGUgYW55dGhpbmcgYXMgYSBVSW50OEFycmF5LiBJdCdzIGEgcHVuIG9uIHR5cGVzY3JpcHRzJ3MgYGFueWAgdHlwZS5cbiAqIFNlZSBlbmNvZGluZy53cml0ZUFueSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBAcGFyYW0ge2FueX0gZGF0YVxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZUFueSA9IGRhdGEgPT5cbiAgZW5jb2RpbmcuZW5jb2RlKGVuY29kZXIgPT4gZW5jb2Rpbmcud3JpdGVBbnkoZW5jb2RlciwgZGF0YSkpXG5cbi8qKlxuICogRGVjb2RlIGFuIGFueS1lbmNvZGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcmV0dXJuIHthbnl9XG4gKi9cbmV4cG9ydCBjb25zdCBkZWNvZGVBbnkgPSBidWYgPT4gZGVjb2RpbmcucmVhZEFueShkZWNvZGluZy5jcmVhdGVEZWNvZGVyKGJ1ZikpXG5cbi8qKlxuICogU2hpZnQgQnl0ZSBBcnJheSB7Tn0gYml0cyB0byB0aGUgbGVmdC4gRG9lcyBub3QgZXhwYW5kIGJ5dGUgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBic1xuICogQHBhcmFtIHtudW1iZXJ9IE4gc2hvdWxkIGJlIGluIHRoZSByYW5nZSBvZiBbMC03XVxuICovXG5leHBvcnQgY29uc3Qgc2hpZnROQml0c0xlZnQgPSAoYnMsIE4pID0+IHtcbiAgaWYgKE4gPT09IDApIHJldHVybiBic1xuICBicyA9IG5ldyBVaW50OEFycmF5KGJzKVxuICBic1swXSA8PD0gTlxuICBmb3IgKGxldCBpID0gMTsgaSA8IGJzLmxlbmd0aDsgaSsrKSB7XG4gICAgYnNbaSAtIDFdIHw9IGJzW2ldID4+PiAoOCAtIE4pXG4gICAgYnNbaV0gPDw9IE5cbiAgfVxuICByZXR1cm4gYnNcbn1cbiIsICIvKipcbiAqIEZhc3QgUHNldWRvIFJhbmRvbSBOdW1iZXIgR2VuZXJhdG9ycy5cbiAqXG4gKiBHaXZlbiBhIHNlZWQgYSBQUk5HIGdlbmVyYXRlcyBhIHNlcXVlbmNlIG9mIG51bWJlcnMgdGhhdCBjYW5ub3QgYmUgcmVhc29uYWJseSBwcmVkaWN0ZWQuXG4gKiBUd28gUFJOR3MgbXVzdCBnZW5lcmF0ZSB0aGUgc2FtZSByYW5kb20gc2VxdWVuY2Ugb2YgbnVtYmVycyBpZiAgZ2l2ZW4gdGhlIHNhbWUgc2VlZC5cbiAqXG4gKiBAbW9kdWxlIHBybmdcbiAqL1xuXG5pbXBvcnQgKiBhcyBiaW5hcnkgZnJvbSAnLi9iaW5hcnkuanMnXG5pbXBvcnQgeyBmcm9tQ2hhckNvZGUsIGZyb21Db2RlUG9pbnQgfSBmcm9tICcuL3N0cmluZy5qcydcbmltcG9ydCAqIGFzIG1hdGggZnJvbSAnLi9tYXRoLmpzJ1xuaW1wb3J0IHsgWG9yb3NoaXJvMTI4cGx1cyB9IGZyb20gJy4vcHJuZy9Yb3Jvc2hpcm8xMjhwbHVzLmpzJ1xuaW1wb3J0ICogYXMgYnVmZmVyIGZyb20gJy4vYnVmZmVyLmpzJ1xuXG4vKipcbiAqIERlc2NyaXB0aW9uIG9mIHRoZSBmdW5jdGlvblxuICogIEBjYWxsYmFjayBnZW5lcmF0b3JOZXh0XG4gKiAgQHJldHVybiB7bnVtYmVyfSBBIHJhbmRvbSBmbG9hdCBpbiB0aGUgY2FuZ2Ugb2YgWzAsMSlcbiAqL1xuXG4vKipcbiAqIEEgcmFuZG9tIHR5cGUgZ2VuZXJhdG9yLlxuICpcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFBSTkdcbiAqIEBwcm9wZXJ0eSB7Z2VuZXJhdG9yTmV4dH0gbmV4dCBHZW5lcmF0ZSBuZXcgbnVtYmVyXG4gKi9cbmV4cG9ydCBjb25zdCBEZWZhdWx0UFJORyA9IFhvcm9zaGlybzEyOHBsdXNcblxuLyoqXG4gKiBDcmVhdGUgYSBYb3Jvc2hpcm8xMjhwbHVzIFBzZXVkby1SYW5kb20tTnVtYmVyLUdlbmVyYXRvci5cbiAqIFRoaXMgaXMgdGhlIGZhc3Rlc3QgZnVsbC1wZXJpb2QgZ2VuZXJhdG9yIHBhc3NpbmcgQmlnQ3J1c2ggd2l0aG91dCBzeXN0ZW1hdGljIGZhaWx1cmVzLlxuICogQnV0IHRoZXJlIGFyZSBtb3JlIFBSTkdzIGF2YWlsYWJsZSBpbiAuL1BSTkcvLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBzZWVkIEEgcG9zaXRpdmUgMzJiaXQgaW50ZWdlci4gRG8gbm90IHVzZSBuZWdhdGl2ZSBudW1iZXJzLlxuICogQHJldHVybiB7UFJOR31cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9IHNlZWQgPT4gbmV3IERlZmF1bHRQUk5HKHNlZWQpXG5cbi8qKlxuICogR2VuZXJhdGVzIGEgc2luZ2xlIHJhbmRvbSBib29sLlxuICpcbiAqIEBwYXJhbSB7UFJOR30gZ2VuIEEgcmFuZG9tIG51bWJlciBnZW5lcmF0b3IuXG4gKiBAcmV0dXJuIHtCb29sZWFufSBBIHJhbmRvbSBib29sZWFuXG4gKi9cbmV4cG9ydCBjb25zdCBib29sID0gZ2VuID0+IChnZW4ubmV4dCgpID49IDAuNSlcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gaW50ZWdlciB3aXRoIDUzIGJpdCByZXNvbHV0aW9uLlxuICpcbiAqIEBwYXJhbSB7UFJOR30gZ2VuIEEgcmFuZG9tIG51bWJlciBnZW5lcmF0b3IuXG4gKiBAcGFyYW0ge051bWJlcn0gbWluIFRoZSBsb3dlciBib3VuZCBvZiB0aGUgYWxsb3dlZCByZXR1cm4gdmFsdWVzIChpbmNsdXNpdmUpLlxuICogQHBhcmFtIHtOdW1iZXJ9IG1heCBUaGUgdXBwZXIgYm91bmQgb2YgdGhlIGFsbG93ZWQgcmV0dXJuIHZhbHVlcyAoaW5jbHVzaXZlKS5cbiAqIEByZXR1cm4ge051bWJlcn0gQSByYW5kb20gaW50ZWdlciBvbiBbbWluLCBtYXhdXG4gKi9cbmV4cG9ydCBjb25zdCBpbnQ1MyA9IChnZW4sIG1pbiwgbWF4KSA9PiBtYXRoLmZsb29yKGdlbi5uZXh0KCkgKiAobWF4ICsgMSAtIG1pbikgKyBtaW4pXG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmFuZG9tIGludGVnZXIgd2l0aCA1MyBiaXQgcmVzb2x1dGlvbi5cbiAqXG4gKiBAcGFyYW0ge1BSTkd9IGdlbiBBIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yLlxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbiBUaGUgbG93ZXIgYm91bmQgb2YgdGhlIGFsbG93ZWQgcmV0dXJuIHZhbHVlcyAoaW5jbHVzaXZlKS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBtYXggVGhlIHVwcGVyIGJvdW5kIG9mIHRoZSBhbGxvd2VkIHJldHVybiB2YWx1ZXMgKGluY2x1c2l2ZSkuXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEEgcmFuZG9tIGludGVnZXIgb24gW21pbiwgbWF4XVxuICovXG5leHBvcnQgY29uc3QgdWludDUzID0gKGdlbiwgbWluLCBtYXgpID0+IG1hdGguYWJzKGludDUzKGdlbiwgbWluLCBtYXgpKVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHJhbmRvbSBpbnRlZ2VyIHdpdGggMzIgYml0IHJlc29sdXRpb24uXG4gKlxuICogQHBhcmFtIHtQUk5HfSBnZW4gQSByYW5kb20gbnVtYmVyIGdlbmVyYXRvci5cbiAqIEBwYXJhbSB7TnVtYmVyfSBtaW4gVGhlIGxvd2VyIGJvdW5kIG9mIHRoZSBhbGxvd2VkIHJldHVybiB2YWx1ZXMgKGluY2x1c2l2ZSkuXG4gKiBAcGFyYW0ge051bWJlcn0gbWF4IFRoZSB1cHBlciBib3VuZCBvZiB0aGUgYWxsb3dlZCByZXR1cm4gdmFsdWVzIChpbmNsdXNpdmUpLlxuICogQHJldHVybiB7TnVtYmVyfSBBIHJhbmRvbSBpbnRlZ2VyIG9uIFttaW4sIG1heF1cbiAqL1xuZXhwb3J0IGNvbnN0IGludDMyID0gKGdlbiwgbWluLCBtYXgpID0+IG1hdGguZmxvb3IoZ2VuLm5leHQoKSAqIChtYXggKyAxIC0gbWluKSArIG1pbilcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gaW50ZWdlciB3aXRoIDUzIGJpdCByZXNvbHV0aW9uLlxuICpcbiAqIEBwYXJhbSB7UFJOR30gZ2VuIEEgcmFuZG9tIG51bWJlciBnZW5lcmF0b3IuXG4gKiBAcGFyYW0ge051bWJlcn0gbWluIFRoZSBsb3dlciBib3VuZCBvZiB0aGUgYWxsb3dlZCByZXR1cm4gdmFsdWVzIChpbmNsdXNpdmUpLlxuICogQHBhcmFtIHtOdW1iZXJ9IG1heCBUaGUgdXBwZXIgYm91bmQgb2YgdGhlIGFsbG93ZWQgcmV0dXJuIHZhbHVlcyAoaW5jbHVzaXZlKS5cbiAqIEByZXR1cm4ge051bWJlcn0gQSByYW5kb20gaW50ZWdlciBvbiBbbWluLCBtYXhdXG4gKi9cbmV4cG9ydCBjb25zdCB1aW50MzIgPSAoZ2VuLCBtaW4sIG1heCkgPT4gaW50MzIoZ2VuLCBtaW4sIG1heCkgPj4+IDBcblxuLyoqXG4gKiBAZGVwcmVjYXRlZFxuICogT3B0aW1pemVkIHZlcnNpb24gb2YgcHJuZy5pbnQzMi4gSXQgaGFzIHRoZSBzYW1lIHByZWNpc2lvbiBhcyBwcm5nLmludDMyLCBidXQgc2hvdWxkIGJlIHByZWZlcnJlZCB3aGVuXG4gKiBvcGVuYXJpbmcgb24gc21hbGxlciByYW5nZXMuXG4gKlxuICogQHBhcmFtIHtQUk5HfSBnZW4gQSByYW5kb20gbnVtYmVyIGdlbmVyYXRvci5cbiAqIEBwYXJhbSB7TnVtYmVyfSBtaW4gVGhlIGxvd2VyIGJvdW5kIG9mIHRoZSBhbGxvd2VkIHJldHVybiB2YWx1ZXMgKGluY2x1c2l2ZSkuXG4gKiBAcGFyYW0ge051bWJlcn0gbWF4IFRoZSB1cHBlciBib3VuZCBvZiB0aGUgYWxsb3dlZCByZXR1cm4gdmFsdWVzIChpbmNsdXNpdmUpLiBUaGUgbWF4IGluY2x1c2l2ZSBudW1iZXIgaXMgYGJpbmFyeS5CSVRTMzEtMWBcbiAqIEByZXR1cm4ge051bWJlcn0gQSByYW5kb20gaW50ZWdlciBvbiBbbWluLCBtYXhdXG4gKi9cbmV4cG9ydCBjb25zdCBpbnQzMSA9IChnZW4sIG1pbiwgbWF4KSA9PiBpbnQzMihnZW4sIG1pbiwgbWF4KVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHJhbmRvbSByZWFsIG9uIFswLCAxKSB3aXRoIDUzIGJpdCByZXNvbHV0aW9uLlxuICpcbiAqIEBwYXJhbSB7UFJOR30gZ2VuIEEgcmFuZG9tIG51bWJlciBnZW5lcmF0b3IuXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEEgcmFuZG9tIHJlYWwgbnVtYmVyIG9uIFswLCAxKS5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWw1MyA9IGdlbiA9PiBnZW4ubmV4dCgpIC8vICgoKGdlbi5uZXh0KCkgPj4+IDUpICogYmluYXJ5LkJJVDI2KSArIChnZW4ubmV4dCgpID4+PiA2KSkgLyBNQVhfU0FGRV9JTlRFR0VSXG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmFuZG9tIGNoYXJhY3RlciBmcm9tIGNoYXIgY29kZSAzMiAtIDEyNi4gSS5lLiBDaGFyYWN0ZXJzLCBOdW1iZXJzLCBzcGVjaWFsIGNoYXJhY3RlcnMsIGFuZCBTcGFjZTpcbiAqXG4gKiBAcGFyYW0ge1BSTkd9IGdlbiBBIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yLlxuICogQHJldHVybiB7c3RyaW5nfVxuICpcbiAqIChTcGFjZSkhXCIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWlsvXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9flxuICovXG5leHBvcnQgY29uc3QgY2hhciA9IGdlbiA9PiBmcm9tQ2hhckNvZGUoaW50MzEoZ2VuLCAzMiwgMTI2KSlcblxuLyoqXG4gKiBAcGFyYW0ge1BSTkd9IGdlblxuICogQHJldHVybiB7c3RyaW5nfSBBIHNpbmdsZSBsZXR0ZXIgKGEteilcbiAqL1xuZXhwb3J0IGNvbnN0IGxldHRlciA9IGdlbiA9PiBmcm9tQ2hhckNvZGUoaW50MzEoZ2VuLCA5NywgMTIyKSlcblxuLyoqXG4gKiBAcGFyYW0ge1BSTkd9IGdlblxuICogQHBhcmFtIHtudW1iZXJ9IFttaW5MZW49MF1cbiAqIEBwYXJhbSB7bnVtYmVyfSBbbWF4TGVuPTIwXVxuICogQHJldHVybiB7c3RyaW5nfSBBIHJhbmRvbSB3b3JkICgwLTIwIGNoYXJhY3RlcnMpIHdpdGhvdXQgc3BhY2VzIGNvbnNpc3Rpbmcgb2YgbGV0dGVycyAoYS16KVxuICovXG5leHBvcnQgY29uc3Qgd29yZCA9IChnZW4sIG1pbkxlbiA9IDAsIG1heExlbiA9IDIwKSA9PiB7XG4gIGNvbnN0IGxlbiA9IGludDMxKGdlbiwgbWluTGVuLCBtYXhMZW4pXG4gIGxldCBzdHIgPSAnJ1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgc3RyICs9IGxldHRlcihnZW4pXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG4vKipcbiAqIFRPRE86IHRoaXMgZnVuY3Rpb24gcHJvZHVjZXMgaW52YWxpZCBydW5lcy4gRG9lcyBub3QgY292ZXIgYWxsIG9mIHV0ZjE2ISFcbiAqXG4gKiBAcGFyYW0ge1BSTkd9IGdlblxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgdXRmMTZSdW5lID0gZ2VuID0+IHtcbiAgY29uc3QgY29kZXBvaW50ID0gaW50MzEoZ2VuLCAwLCAyNTYpXG4gIHJldHVybiBmcm9tQ29kZVBvaW50KGNvZGVwb2ludClcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1BSTkd9IGdlblxuICogQHBhcmFtIHtudW1iZXJ9IFttYXhsZW4gPSAyMF1cbiAqL1xuZXhwb3J0IGNvbnN0IHV0ZjE2U3RyaW5nID0gKGdlbiwgbWF4bGVuID0gMjApID0+IHtcbiAgY29uc3QgbGVuID0gaW50MzEoZ2VuLCAwLCBtYXhsZW4pXG4gIGxldCBzdHIgPSAnJ1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgc3RyICs9IHV0ZjE2UnVuZShnZW4pXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG4vKipcbiAqIFJldHVybnMgb25lIGVsZW1lbnQgb2YgYSBnaXZlbiBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge1BSTkd9IGdlbiBBIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yLlxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyYXkgTm9uIGVtcHR5IEFycmF5IG9mIHBvc3NpYmxlIHZhbHVlcy5cbiAqIEByZXR1cm4ge1R9IE9uZSBvZiB0aGUgdmFsdWVzIG9mIHRoZSBzdXBwbGllZCBBcnJheS5cbiAqIEB0ZW1wbGF0ZSBUXG4gKi9cbmV4cG9ydCBjb25zdCBvbmVPZiA9IChnZW4sIGFycmF5KSA9PiBhcnJheVtpbnQzMShnZW4sIDAsIGFycmF5Lmxlbmd0aCAtIDEpXVxuXG4vKipcbiAqIEBwYXJhbSB7UFJOR30gZ2VuXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5PEFycmF5QnVmZmVyPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHVpbnQ4QXJyYXkgPSAoZ2VuLCBsZW4pID0+IHtcbiAgY29uc3QgYnVmID0gYnVmZmVyLmNyZWF0ZVVpbnQ4QXJyYXlGcm9tTGVuKGxlbilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBidWYubGVuZ3RoOyBpKyspIHtcbiAgICBidWZbaV0gPSBpbnQzMihnZW4sIDAsIGJpbmFyeS5CSVRTOClcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBAcGFyYW0ge1BSTkd9IGdlblxuICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICogQHJldHVybiB7VWludDE2QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCB1aW50MTZBcnJheSA9IChnZW4sIGxlbikgPT4gbmV3IFVpbnQxNkFycmF5KHVpbnQ4QXJyYXkoZ2VuLCBsZW4gKiAyKS5idWZmZXIpXG5cbi8qKlxuICogQHBhcmFtIHtQUk5HfSBnZW5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAqIEByZXR1cm4ge1VpbnQzMkFycmF5fVxuICovXG5leHBvcnQgY29uc3QgdWludDMyQXJyYXkgPSAoZ2VuLCBsZW4pID0+IG5ldyBVaW50MzJBcnJheSh1aW50OEFycmF5KGdlbiwgbGVuICogNCkuYnVmZmVyKVxuLyogYzggaWdub3JlIHN0b3AgKi9cbiIsICIvKipcbiAqIEBleHBlcmltZW50YWwgV0lQXG4gKlxuICogU2ltcGxlICYgZWZmaWNpZW50IHNjaGVtYXMgZm9yIHlvdXIgZGF0YS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBvYmogZnJvbSAnLi9vYmplY3QuanMnXG5pbXBvcnQgKiBhcyBhcnIgZnJvbSAnLi9hcnJheS5qcydcbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJy4vZXJyb3IuanMnXG5pbXBvcnQgKiBhcyBlbnYgZnJvbSAnLi9lbnZpcm9ubWVudC5qcydcbmltcG9ydCAqIGFzIGVxdWFsaXR5VHJhaXRzIGZyb20gJy4vdHJhaXQvZXF1YWxpdHkuanMnXG5pbXBvcnQgKiBhcyBmdW4gZnJvbSAnLi9mdW5jdGlvbi5qcydcbmltcG9ydCAqIGFzIHN0cmluZyBmcm9tICcuL3N0cmluZy5qcydcbmltcG9ydCAqIGFzIHBybmcgZnJvbSAnLi9wcm5nLmpzJ1xuaW1wb3J0ICogYXMgbnVtYmVyIGZyb20gJy4vbnVtYmVyLmpzJ1xuXG4vKipcbiAqIEB0eXBlZGVmIHtzdHJpbmd8bnVtYmVyfGJpZ2ludHxib29sZWFufG51bGx8dW5kZWZpbmVkfHN5bWJvbH0gUHJpbWl0aXZlXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7eyBbazpzdHJpbmd8bnVtYmVyfHN5bWJvbF06IGFueSB9fSBBbnlPYmplY3RcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAdHlwZWRlZiB7VCBleHRlbmRzIFNjaGVtYTxpbmZlciBYPiA/IFggOiBUfSBVbndyYXBcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAdHlwZWRlZiB7VCBleHRlbmRzIFNjaGVtYTxpbmZlciBYPiA/IFggOiBUfSBUeXBlT2ZcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7cmVhZG9ubHkgdW5rbm93bltdfSBUXG4gKiBAdHlwZWRlZiB7VCBleHRlbmRzIHJlYWRvbmx5IFtTY2hlbWE8aW5mZXIgRmlyc3Q+LCAuLi5pbmZlciBSZXN0XSA/IFtGaXJzdCwgLi4uVW53cmFwQXJyYXk8UmVzdD5dIDogW10gfSBVbndyYXBBcnJheVxuICovXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEB0eXBlZGVmIHtUIGV4dGVuZHMgU2NoZW1hPGluZmVyIFM+ID8gU2NoZW1hPFM+IDogbmV2ZXJ9IENhc3RUb1NjaGVtYVxuICovXG5cbi8qKlxuICogQHRlbXBsYXRlIHt1bmtub3duW119IEFyclxuICogQHR5cGVkZWYge0FyciBleHRlbmRzIFsuLi51bmtub3duW10sIGluZmVyIExdID8gTCA6IG5ldmVyfSBUdXBsZUxhc3RcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7dW5rbm93bltdfSBBcnJcbiAqIEB0eXBlZGVmIHtBcnIgZXh0ZW5kcyBbLi4uaW5mZXIgRnMsIHVua25vd25dID8gRnMgOiBuZXZlcn0gVHVwbGVQb3BcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7cmVhZG9ubHkgdW5rbm93bltdfSBUXG4gKiBAdHlwZWRlZiB7VCBleHRlbmRzIFtdXG4gKiAgID8ge31cbiAqICAgOiBUIGV4dGVuZHMgW2luZmVyIEZpcnN0XVxuICogICA/IEZpcnN0XG4gKiAgIDogVCBleHRlbmRzIFtpbmZlciBGaXJzdCwgLi4uaW5mZXIgUmVzdF1cbiAqICAgPyBGaXJzdCAmIEludGVyc2VjdDxSZXN0PlxuICogICA6IG5ldmVyXG4gKiB9IEludGVyc2VjdFxuICovXG5cbmNvbnN0IHNjaGVtYVN5bWJvbCA9IFN5bWJvbCgnMHNjaGVtYScpXG5cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uRXJyb3Ige1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogUmV2ZXJzZSBlcnJvcnNcbiAgICAgKiBAdHlwZSB7QXJyYXk8eyBwYXRoOiBzdHJpbmc/LCBleHBlY3RlZDogc3RyaW5nLCBoYXM6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nPyB9Pn1cbiAgICAgKi9cbiAgICB0aGlzLl9yZXJycyA9IFtdXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmc/fSBwYXRoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBleHBlY3RlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGFzXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gbWVzc2FnZVxuICAgKi9cbiAgZXh0ZW5kIChwYXRoLCBleHBlY3RlZCwgaGFzLCBtZXNzYWdlID0gbnVsbCkge1xuICAgIHRoaXMuX3JlcnJzLnB1c2goeyBwYXRoLCBleHBlY3RlZCwgaGFzLCBtZXNzYWdlIH0pXG4gIH1cblxuICB0b1N0cmluZyAoKSB7XG4gICAgY29uc3QgcyA9IFtdXG4gICAgZm9yIChsZXQgaSA9IHRoaXMuX3JlcnJzLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IHIgPSB0aGlzLl9yZXJyc1tpXVxuICAgICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAgIHMucHVzaChzdHJpbmcucmVwZWF0KCcgJywgKHRoaXMuX3JlcnJzLmxlbmd0aCAtIGkpICogMikgKyBgJHtyLnBhdGggIT0gbnVsbCA/IGBbJHtyLnBhdGh9XSBgIDogJyd9JHtyLmhhc30gZG9lc24ndCBtYXRjaCAke3IuZXhwZWN0ZWR9LiAke3IubWVzc2FnZX1gKVxuICAgIH1cbiAgICByZXR1cm4gcy5qb2luKCdcXG4nKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IGFcbiAqIEBwYXJhbSB7YW55fSBiXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5jb25zdCBzaGFwZUV4dGVuZHMgPSAoYSwgYikgPT4ge1xuICBpZiAoYSA9PT0gYikgcmV0dXJuIHRydWVcbiAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwgfHwgYS5jb25zdHJ1Y3RvciAhPT0gYi5jb25zdHJ1Y3RvcikgcmV0dXJuIGZhbHNlXG4gIGlmIChhW2VxdWFsaXR5VHJhaXRzLkVxdWFsaXR5VHJhaXRTeW1ib2xdKSByZXR1cm4gZXF1YWxpdHlUcmFpdHMuZXF1YWxzKGEsIGIpIC8vIGxhc3QgcmVzb3J0OiBjaGVjayBlcXVhbGl0eSAoZG8gdGhpcyBiZWZvcmUgYXJyYXkgYW5kIG9iaiBjaGVjayB3aGljaCBkb24ndCBpbXBsZW1lbnQgdGhlIGVxdWFsaXR5IHRyYWl0KVxuICBpZiAoYXJyLmlzQXJyYXkoYSkpIHtcbiAgICByZXR1cm4gYXJyLmV2ZXJ5KGEsIGFpdGVtID0+XG4gICAgICBhcnIuc29tZShiLCBiaXRlbSA9PiBzaGFwZUV4dGVuZHMoYWl0ZW0sIGJpdGVtKSlcbiAgICApXG4gIH0gZWxzZSBpZiAob2JqLmlzT2JqZWN0KGEpKSB7XG4gICAgcmV0dXJuIG9iai5ldmVyeShhLCAoYWl0ZW0sIGFrZXkpID0+XG4gICAgICBzaGFwZUV4dGVuZHMoYWl0ZW0sIGJbYWtleV0pXG4gICAgKVxuICB9XG4gIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAaW1wbGVtZW50cyB7ZXF1YWxpdHlUcmFpdHMuRXF1YWxpdHlUcmFpdH1cbiAqL1xuZXhwb3J0IGNsYXNzIFNjaGVtYSB7XG4gIC8vIHRoaXMuc2hhcGUgbXVzdCBub3QgYmUgZGVmaW5lZCBvbiBTY2hlbWEuIE90aGVyd2lzZSB0eXBlY2hlY2sgb24gbWV0YXR5cGVzIChlLmcuICQkb2JqZWN0KSB3b24ndCB3b3JrIGFzIGV4cGVjdGVkIGFueW1vcmVcbiAgLyoqXG4gICAqIElmIHRydWUsIHRoZSBtb3JlIHRoaW5ncyBhcmUgYWRkZWQgdG8gdGhlIHNoYXBlIHRoZSBtb3JlIG9iamVjdHMgdGhpcyBzY2hlbWEgd2lsbCBhY2NlcHQgKGUuZy5cbiAgICogdW5pb24pLiBCeSBkZWZhdWx0LCB0aGUgbW9yZSBvYmplY3RzIGFyZSBhZGRlZCwgdGhlIHRoZSBmZXdlciBvYmplY3RzIHRoaXMgc2NoZW1hIHdpbGwgYWNjZXB0LlxuICAgKiBAcHJvdGVjdGVkXG4gICAqL1xuICBzdGF0aWMgX2RpbHV0ZXMgPSBmYWxzZVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1NjaGVtYTxhbnk+fSBvdGhlclxuICAgKi9cbiAgZXh0ZW5kcyAob3RoZXIpIHtcbiAgICBsZXQgW2EsIGJdID0gWy8qKiBAdHlwZSB7YW55fSAqLyh0aGlzKS5zaGFwZSwgLyoqIEB0eXBlIHthbnl9ICovIChvdGhlcikuc2hhcGVdXG4gICAgaWYgKC8qKiBAdHlwZSB7dHlwZW9mIFNjaGVtYTxhbnk+fSAqLyAodGhpcy5jb25zdHJ1Y3RvcikuX2RpbHV0ZXMpIFtiLCBhXSA9IFthLCBiXVxuICAgIHJldHVybiBzaGFwZUV4dGVuZHMoYSwgYilcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGUgdGhpcyB3aGVuIG5lY2Vzc2FyeS4gQnkgZGVmYXVsdCwgd2Ugb25seSBjaGVjayB0aGUgYHNoYXBlYCBwcm9wZXJ0eSB3aGljaCBldmVyeSBzaGFwZVxuICAgKiBzaG91bGQgaGF2ZS5cbiAgICogQHBhcmFtIHtTY2hlbWE8YW55Pn0gb3RoZXJcbiAgICovXG4gIGVxdWFscyAob3RoZXIpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IgPT09IG90aGVyLmNvbnN0cnVjdG9yICYmIGZ1bi5lcXVhbGl0eURlZXAodGhpcy5zaGFwZSwgb3RoZXIuc2hhcGUpXG4gIH1cblxuICBbc2NoZW1hU3ltYm9sXSAoKSB7IHJldHVybiB0cnVlIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtvYmplY3R9IG90aGVyXG4gICAqL1xuICBbZXF1YWxpdHlUcmFpdHMuRXF1YWxpdHlUcmFpdFN5bWJvbF0gKG90aGVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZXF1YWxzKC8qKiBAdHlwZSB7YW55fSAqLyAob3RoZXIpKVxuICB9XG5cbiAgLyoqXG4gICAqIFVzZSBgc2NoZW1hLnZhbGlkYXRlKG9iailgIHdpdGggYSB0eXBlZCBwYXJhbWV0ZXIgdGhhdCBpcyBhbHJlYWR5IG9mIHR5cGVkIHRvIGJlIGFuIGluc3RhbmNlIG9mXG4gICAqIFNjaGVtYS4gVmFsaWRhdGUgd2lsbCBjaGVjayB0aGUgc3RydWN0dXJlIG9mIHRoZSBwYXJhbWV0ZXIgYW5kIHJldHVybiB0cnVlIGlmZiB0aGUgaW5zdGFuY2VcbiAgICogcmVhbGx5IGlzIGFuIGluc3RhbmNlIG9mIFNjaGVtYS5cbiAgICpcbiAgICogQHBhcmFtIHtUfSBvXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICB2YWxpZGF0ZSAobykge1xuICAgIHJldHVybiB0aGlzLmNoZWNrKG8pXG4gIH1cblxuICAvKiBjOCBpZ25vcmUgc3RhcnQgKi9cbiAgLyoqXG4gICAqIFNpbWlsYXIgdG8gdmFsaWRhdGUsIGJ1dCB0aGlzIG1ldGhvZCBhY2NlcHRzIHVudHlwZWQgcGFyYW1ldGVycy5cbiAgICpcbiAgICogQHBhcmFtIHthbnl9IF9vXG4gICAqIEBwYXJhbSB7VmFsaWRhdGlvbkVycm9yfSBbX2Vycl1cbiAgICogQHJldHVybiB7X28gaXMgVH1cbiAgICovXG4gIGNoZWNrIChfbywgX2Vycikge1xuICAgIGVycm9yLm1ldGhvZFVuaW1wbGVtZW50ZWQoKVxuICB9XG4gIC8qIGM4IGlnbm9yZSBzdG9wICovXG5cbiAgLyoqXG4gICAqIEB0eXBlIHtTY2hlbWE8VD8+fVxuICAgKi9cbiAgZ2V0IG51bGxhYmxlICgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcmV0dXJuICR1bmlvbih0aGlzLCAkbnVsbClcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZSB7JE9wdGlvbmFsPFNjaGVtYTxUPj59XG4gICAqL1xuICBnZXQgb3B0aW9uYWwgKCkge1xuICAgIHJldHVybiBuZXcgJE9wdGlvbmFsKC8qKiBAdHlwZSB7U2NoZW1hPFQ+fSAqLyAodGhpcykpXG4gIH1cblxuICAvKipcbiAgICogQ2FzdCBhIHZhcmlhYmxlIHRvIGEgc3BlY2lmaWMgdHlwZS4gUmV0dXJucyB0aGUgY2FzdGVkIHZhbHVlLCBvciB0aHJvd3MgYW4gZXhjZXB0aW9uIG90aGVyd2lzZS5cbiAgICogVXNlIHRoaXMgaWYgeW91IGtub3cgdGhhdCB0aGUgdHlwZSBpcyBvZiBhIHNwZWNpZmljIHR5cGUgYW5kIHlvdSBqdXN0IHdhbnQgdG8gY29udmluY2UgdGhlIHR5cGVcbiAgICogc3lzdGVtLlxuICAgKlxuICAgKiAqKkRvIG5vdCByZWx5IG9uIHRoZXNlIGVycm9yIG1lc3NhZ2VzISoqXG4gICAqIFBlcmZvcm1zIGFuIGFzc2VydGlvbiBjaGVjayBvbmx5IGlmIG5vdCBpbiBhIHByb2R1Y3Rpb24gZW52aXJvbm1lbnQuXG4gICAqXG4gICAqIEB0ZW1wbGF0ZSBPT1xuICAgKiBAcGFyYW0ge09PfSBvXG4gICAqIEByZXR1cm4ge0V4dHJhY3Q8T08sIFQ+IGV4dGVuZHMgbmV2ZXIgPyBUIDogKE9PIGV4dGVuZHMgQXJyYXk8bmV2ZXI+ID8gVCA6IEV4dHJhY3Q8T08sVD4pfVxuICAgKi9cbiAgY2FzdCAobykge1xuICAgIGFzc2VydChvLCB0aGlzKVxuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKG8pXG4gIH1cblxuICAvKipcbiAgICogRVhQRUNUTyBQQVRST05VTSEhIFx1RDgzRVx1REU4NFxuICAgKiBUaGlzIGZ1bmN0aW9uIHByb3RlY3RzIGFnYWluc3QgdHlwZSBlcnJvcnMuIFRob3VnaCBpdCBtYXkgbm90IHdvcmsgaW4gdGhlIHJlYWwgd29ybGQuXG4gICAqXG4gICAqIFwiQWZ0ZXIgYWxsIHRoaXMgdGltZT9cIlxuICAgKiBcIkFsd2F5cy5cIiAtIFNuYXBlLCB0YWxraW5nIGFib3V0IHR5cGUgc2FmZXR5XG4gICAqXG4gICAqIEVuc3VyZXMgdGhhdCBhIHZhcmlhYmxlIGlzIGEgYSBzcGVjaWZpYyB0eXBlLiBSZXR1cm5zIHRoZSB2YWx1ZSwgb3IgdGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiB0aGUgYXNzZXJ0aW9uIGNoZWNrIGZhaWxlZC5cbiAgICogVXNlIHRoaXMgaWYgeW91IGtub3cgdGhhdCB0aGUgdHlwZSBpcyBvZiBhIHNwZWNpZmljIHR5cGUgYW5kIHlvdSBqdXN0IHdhbnQgdG8gY29udmluY2UgdGhlIHR5cGVcbiAgICogc3lzdGVtLlxuICAgKlxuICAgKiBDYW4gYmUgdXNlZnVsIHdoZW4gZGVmaW5pbmcgbGFtYmRhczogYHMubGFtYmRhKHMuJG51bWJlciwgcy4kdm9pZCkuZXhwZWN0KChuKSA9PiBuICsgMSlgXG4gICAqXG4gICAqICoqRG8gbm90IHJlbHkgb24gdGhlc2UgZXJyb3IgbWVzc2FnZXMhKipcbiAgICogUGVyZm9ybXMgYW4gYXNzZXJ0aW9uIGNoZWNrIGlmIG5vdCBpbiBhIHByb2R1Y3Rpb24gZW52aXJvbm1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7VH0gb1xuICAgKiBAcmV0dXJuIHtvIGV4dGVuZHMgVCA/IFQgOiBuZXZlcn1cbiAgICovXG4gIGV4cGVjdCAobykge1xuICAgIGFzc2VydChvLCB0aGlzKVxuICAgIHJldHVybiBvXG4gIH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgeyhuZXcgKC4uLmFyZ3M6YW55W10pID0+IGFueSkgfCAoKC4uLmFyZ3M6YW55W10pID0+IGFueSl9IENvbnN0clxuICogQHR5cGVkZWYge0NvbnN0ciBleHRlbmRzICgoLi4uYXJnczphbnlbXSkgPT4gaW5mZXIgVCkgPyBUIDogKENvbnN0ciBleHRlbmRzIChuZXcgKC4uLmFyZ3M6YW55W10pID0+IGFueSkgPyBJbnN0YW5jZVR5cGU8Q29uc3RyPiA6IG5ldmVyKX0gSW5zdGFuY2VcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7KG5ldyAoLi4uYXJnczphbnlbXSkgPT4gYW55KSB8ICgoLi4uYXJnczphbnlbXSkgPT4gYW55KX0gQ1xuICogQGV4dGVuZHMge1NjaGVtYTxJbnN0YW5jZTxDPj59XG4gKi9cbmV4cG9ydCBjbGFzcyAkQ29uc3RydWN0ZWRCeSBleHRlbmRzIFNjaGVtYSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0N9IGNcbiAgICogQHBhcmFtIHsoKG86SW5zdGFuY2U8Qz4pPT5ib29sZWFuKXxudWxsfSBjaGVja1xuICAgKi9cbiAgY29uc3RydWN0b3IgKGMsIGNoZWNrKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuc2hhcGUgPSBjXG4gICAgdGhpcy5fYyA9IGNoZWNrXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9cbiAgICogQHBhcmFtIHtWYWxpZGF0aW9uRXJyb3J9IFtlcnJdXG4gICAqIEByZXR1cm4ge28gaXMgQyBleHRlbmRzICgoLi4uYXJnczphbnlbXSkgPT4gaW5mZXIgVCkgPyBUIDogKEMgZXh0ZW5kcyAobmV3ICguLi5hcmdzOmFueVtdKSA9PiBhbnkpID8gSW5zdGFuY2VUeXBlPEM+IDogbmV2ZXIpfSBvXG4gICAqL1xuICBjaGVjayAobywgZXJyID0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgYyA9IG8/LmNvbnN0cnVjdG9yID09PSB0aGlzLnNoYXBlICYmICh0aGlzLl9jID09IG51bGwgfHwgdGhpcy5fYyhvKSlcbiAgICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgICFjICYmIGVycj8uZXh0ZW5kKG51bGwsIHRoaXMuc2hhcGUubmFtZSwgbz8uY29uc3RydWN0b3IubmFtZSwgbz8uY29uc3RydWN0b3IgIT09IHRoaXMuc2hhcGUgPyAnQ29uc3RydWN0b3IgbWF0Y2ggZmFpbGVkJyA6ICdDaGVjayBmYWlsZWQnKVxuICAgIHJldHVybiBjXG4gIH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgeyhuZXcgKC4uLmFyZ3M6YW55W10pID0+IGFueSkgfCAoKC4uLmFyZ3M6YW55W10pID0+IGFueSl9IENcbiAqIEBwYXJhbSB7Q30gY1xuICogQHBhcmFtIHsoKG86SW5zdGFuY2U8Qz4pID0+IGJvb2xlYW4pfG51bGx9IGNoZWNrXG4gKiBAcmV0dXJuIHtDYXN0VG9TY2hlbWE8JENvbnN0cnVjdGVkQnk8Qz4+fVxuICovXG5leHBvcnQgY29uc3QgJGNvbnN0cnVjdGVkQnkgPSAoYywgY2hlY2sgPSBudWxsKSA9PiBuZXcgJENvbnN0cnVjdGVkQnkoYywgY2hlY2spXG5leHBvcnQgY29uc3QgJCRjb25zdHJ1Y3RlZEJ5ID0gJGNvbnN0cnVjdGVkQnkoJENvbnN0cnVjdGVkQnkpXG5cbi8qKlxuICogQ2hlY2sgY3VzdG9tIHByb3BlcnRpZXMgb24gYW55IG9iamVjdC4gWW91IG1heSB3YW50IHRvIG92ZXJ3cml0ZSB0aGUgZ2VuZXJhdGVkIFNjaGVtYTxhbnk+LlxuICpcbiAqIEBleHRlbmRzIHtTY2hlbWE8YW55Pn1cbiAqL1xuZXhwb3J0IGNsYXNzICRDdXN0b20gZXh0ZW5kcyBTY2hlbWEge1xuICAvKipcbiAgICogQHBhcmFtIHsobzphbnkpID0+IGJvb2xlYW59IGNoZWNrXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoY2hlY2spIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUgeyhvOmFueSkgPT4gYm9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGlzLnNoYXBlID0gY2hlY2tcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gb1xuICAgKiBAcGFyYW0ge1ZhbGlkYXRpb25FcnJvcn0gZXJyXG4gICAqIEByZXR1cm4ge28gaXMgYW55fVxuICAgKi9cbiAgY2hlY2sgKG8sIGVycikge1xuICAgIGNvbnN0IGMgPSB0aGlzLnNoYXBlKG8pXG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAhYyAmJiBlcnI/LmV4dGVuZChudWxsLCAnY3VzdG9tIHByb3AnLCBvPy5jb25zdHJ1Y3Rvci5uYW1lLCAnZmFpbGVkIHRvIGNoZWNrIGN1c3RvbSBwcm9wJylcbiAgICByZXR1cm4gY1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHsobzphbnkpID0+IGJvb2xlYW59IGNoZWNrXG4gKiBAcmV0dXJuIHtTY2hlbWE8YW55Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRjdXN0b20gPSAoY2hlY2spID0+IG5ldyAkQ3VzdG9tKGNoZWNrKVxuZXhwb3J0IGNvbnN0ICQkY3VzdG9tID0gJGNvbnN0cnVjdGVkQnkoJEN1c3RvbSlcblxuLyoqXG4gKiBAdGVtcGxhdGUge1ByaW1pdGl2ZX0gVFxuICogQGV4dGVuZHMge1NjaGVtYTxUPn1cbiAqL1xuZXhwb3J0IGNsYXNzICRMaXRlcmFsIGV4dGVuZHMgU2NoZW1hIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXk8VD59IGxpdGVyYWxzXG4gICAqL1xuICBjb25zdHJ1Y3RvciAobGl0ZXJhbHMpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5zaGFwZSA9IGxpdGVyYWxzXG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIHthbnl9IG9cbiAgICogQHBhcmFtIHtWYWxpZGF0aW9uRXJyb3J9IFtlcnJdXG4gICAqIEByZXR1cm4ge28gaXMgVH1cbiAgICovXG4gIGNoZWNrIChvLCBlcnIpIHtcbiAgICBjb25zdCBjID0gdGhpcy5zaGFwZS5zb21lKGEgPT4gYSA9PT0gbylcbiAgICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgICFjICYmIGVycj8uZXh0ZW5kKG51bGwsIHRoaXMuc2hhcGUuam9pbignIHwgJyksIG8udG9TdHJpbmcoKSlcbiAgICByZXR1cm4gY1xuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIHtQcmltaXRpdmVbXX0gVFxuICogQHBhcmFtIHtUfSBsaXRlcmFsc1xuICogQHJldHVybiB7Q2FzdFRvU2NoZW1hPCRMaXRlcmFsPFRbbnVtYmVyXT4+fVxuICovXG5leHBvcnQgY29uc3QgJGxpdGVyYWwgPSAoLi4ubGl0ZXJhbHMpID0+IG5ldyAkTGl0ZXJhbChsaXRlcmFscylcbmV4cG9ydCBjb25zdCAkJGxpdGVyYWwgPSAkY29uc3RydWN0ZWRCeSgkTGl0ZXJhbClcblxuLyoqXG4gKiBAdGVtcGxhdGUge0FycmF5PHN0cmluZ3xTY2hlbWE8c3RyaW5nfG51bWJlcj4+fSBUc1xuICogQHR5cGVkZWYge1RzIGV4dGVuZHMgW10gPyBgYCA6IChUcyBleHRlbmRzIFtpbmZlciBUXSA/IChVbndyYXA8VD4gZXh0ZW5kcyAoc3RyaW5nfG51bWJlcikgPyBVbndyYXA8VD4gOiBuZXZlcikgOiAoVHMgZXh0ZW5kcyBbaW5mZXIgVDEsIC4uLmluZmVyIFJlc3RdID8gYCR7VW53cmFwPFQxPiBleHRlbmRzIChzdHJpbmd8bnVtYmVyKSA/IFVud3JhcDxUMT4gOiBuZXZlcn0ke1Jlc3QgZXh0ZW5kcyBBcnJheTxzdHJpbmd8U2NoZW1hPHN0cmluZ3xudW1iZXI+PiA/IENhc3RTdHJpbmdUZW1wbGF0ZUFyZ3NUb1RlbXBsYXRlPFJlc3Q+IDogbmV2ZXJ9YCA6IG5ldmVyKSl9IENhc3RTdHJpbmdUZW1wbGF0ZUFyZ3NUb1RlbXBsYXRlXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmNvbnN0IF9yZWdleEVzY2FwZSA9IC8qKiBAdHlwZSB7YW55fSAqLyAoUmVnRXhwKS5lc2NhcGUgfHwgLyoqIEB0eXBlIHsoc3RyOnN0cmluZykgPT4gc3RyaW5nfSAqLyAoc3RyID0+XG4gIHN0ci5yZXBsYWNlKC9bKCkufCYsJF5bXFxdXS9nLCBzID0+ICdcXFxcJyArIHMpXG4pXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd8U2NoZW1hPGFueT59IHNcbiAqIEByZXR1cm4ge3N0cmluZ1tdfVxuICovXG5jb25zdCBfc2NoZW1hU3RyaW5nVGVtcGxhdGVUb1JlZ2V4ID0gcyA9PiB7XG4gIGlmICgkc3RyaW5nLmNoZWNrKHMpKSB7XG4gICAgcmV0dXJuIFtfcmVnZXhFc2NhcGUocyldXG4gIH1cbiAgaWYgKCQkbGl0ZXJhbC5jaGVjayhzKSkge1xuICAgIHJldHVybiAvKiogQHR5cGUge0FycmF5PHN0cmluZ3xudW1iZXI+fSAqLyAocy5zaGFwZSkubWFwKHYgPT4gdiArICcnKVxuICB9XG4gIGlmICgkJG51bWJlci5jaGVjayhzKSkge1xuICAgIHJldHVybiBbJ1srLV0/XFxcXGQrLj9cXFxcZConXVxuICB9XG4gIGlmICgkJHN0cmluZy5jaGVjayhzKSkge1xuICAgIHJldHVybiBbJy4qJ11cbiAgfVxuICBpZiAoJCR1bmlvbi5jaGVjayhzKSkge1xuICAgIHJldHVybiBzLnNoYXBlLm1hcChfc2NoZW1hU3RyaW5nVGVtcGxhdGVUb1JlZ2V4KS5mbGF0KDEpXG4gIH1cbiAgLyogYzggaWdub3JlIG5leHQgMiAqL1xuICAvLyB1bmV4cGVjdGVkIHNjaGVtYSBzdHJ1Y3R1cmUgKG9ubHkgc3VwcG9ydHMgdW5pb25zIGFuZCBzdHJpbmcgaW4gbGl0ZXJhbCB0eXBlcylcbiAgZXJyb3IudW5leHBlY3RlZENhc2UoKVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7QXJyYXk8c3RyaW5nfFNjaGVtYTxzdHJpbmd8bnVtYmVyPj59IFRcbiAqIEBleHRlbmRzIHtTY2hlbWE8Q2FzdFN0cmluZ1RlbXBsYXRlQXJnc1RvVGVtcGxhdGU8VD4+fVxuICovXG5leHBvcnQgY2xhc3MgJFN0cmluZ1RlbXBsYXRlIGV4dGVuZHMgU2NoZW1hIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VH0gc2hhcGVcbiAgICovXG4gIGNvbnN0cnVjdG9yIChzaGFwZSkge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLnNoYXBlID0gc2hhcGVcbiAgICB0aGlzLl9yID0gbmV3IFJlZ0V4cCgnXicgKyBzaGFwZS5tYXAoX3NjaGVtYVN0cmluZ1RlbXBsYXRlVG9SZWdleCkubWFwKG9wdHMgPT4gYCgke29wdHMuam9pbignfCcpfSlgKS5qb2luKCcnKSArICckJylcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gb1xuICAgKiBAcGFyYW0ge1ZhbGlkYXRpb25FcnJvcn0gW2Vycl1cbiAgICogQHJldHVybiB7byBpcyBDYXN0U3RyaW5nVGVtcGxhdGVBcmdzVG9UZW1wbGF0ZTxUPn1cbiAgICovXG4gIGNoZWNrIChvLCBlcnIpIHtcbiAgICBjb25zdCBjID0gdGhpcy5fci5leGVjKG8pICE9IG51bGxcbiAgICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgICFjICYmIGVycj8uZXh0ZW5kKG51bGwsIHRoaXMuX3IudG9TdHJpbmcoKSwgby50b1N0cmluZygpLCAnU3RyaW5nIGRvZXNuXFwndCBtYXRjaCBzdHJpbmcgdGVtcGxhdGUuJylcbiAgICByZXR1cm4gY1xuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIHtBcnJheTxzdHJpbmd8U2NoZW1hPHN0cmluZ3xudW1iZXI+Pn0gVFxuICogQHBhcmFtIHtUfSBsaXRlcmFsc1xuICogQHJldHVybiB7Q2FzdFRvU2NoZW1hPCRTdHJpbmdUZW1wbGF0ZTxUPj59XG4gKi9cbmV4cG9ydCBjb25zdCAkc3RyaW5nVGVtcGxhdGUgPSAoLi4ubGl0ZXJhbHMpID0+IG5ldyAkU3RyaW5nVGVtcGxhdGUobGl0ZXJhbHMpXG5leHBvcnQgY29uc3QgJCRzdHJpbmdUZW1wbGF0ZSA9ICRjb25zdHJ1Y3RlZEJ5KCRTdHJpbmdUZW1wbGF0ZSlcblxuY29uc3QgaXNPcHRpb25hbFN5bWJvbCA9IFN5bWJvbCgnb3B0aW9uYWwnKVxuLyoqXG4gKiBAdGVtcGxhdGUge1NjaGVtYTxhbnk+fSBTXG4gKiBAZXh0ZW5kcyBTY2hlbWE8VW53cmFwPFM+fHVuZGVmaW5lZD5cbiAqL1xuY2xhc3MgJE9wdGlvbmFsIGV4dGVuZHMgU2NoZW1hIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7U30gc2hhcGVcbiAgICovXG4gIGNvbnN0cnVjdG9yIChzaGFwZSkge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLnNoYXBlID0gc2hhcGVcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gb1xuICAgKiBAcGFyYW0ge1ZhbGlkYXRpb25FcnJvcn0gW2Vycl1cbiAgICogQHJldHVybiB7byBpcyAoVW53cmFwPFM+fHVuZGVmaW5lZCl9XG4gICAqL1xuICBjaGVjayAobywgZXJyKSB7XG4gICAgY29uc3QgYyA9IG8gPT09IHVuZGVmaW5lZCB8fCB0aGlzLnNoYXBlLmNoZWNrKG8pXG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAhYyAmJiBlcnI/LmV4dGVuZChudWxsLCAndW5kZWZpbmVkIChvcHRpb25hbCknLCAnKCknKVxuICAgIHJldHVybiBjXG4gIH1cblxuICBnZXQgW2lzT3B0aW9uYWxTeW1ib2xdICgpIHsgcmV0dXJuIHRydWUgfVxufVxuZXhwb3J0IGNvbnN0ICQkb3B0aW9uYWwgPSAkY29uc3RydWN0ZWRCeSgkT3B0aW9uYWwpXG5cbi8qKlxuICogQGV4dGVuZHMgU2NoZW1hPG5ldmVyPlxuICovXG5jbGFzcyAkTmV2ZXIgZXh0ZW5kcyBTY2hlbWEge1xuICAvKipcbiAgICogQHBhcmFtIHthbnl9IF9vXG4gICAqIEBwYXJhbSB7VmFsaWRhdGlvbkVycm9yfSBbZXJyXVxuICAgKiBAcmV0dXJuIHtfbyBpcyBuZXZlcn1cbiAgICovXG4gIGNoZWNrIChfbywgZXJyKSB7XG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICBlcnI/LmV4dGVuZChudWxsLCAnbmV2ZXInLCB0eXBlb2YgX28pXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuLyoqXG4gKiBAdHlwZSB7U2NoZW1hPG5ldmVyPn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRuZXZlciA9IG5ldyAkTmV2ZXIoKVxuZXhwb3J0IGNvbnN0ICQkbmV2ZXIgPSAkY29uc3RydWN0ZWRCeSgkTmV2ZXIpXG5cbi8qKlxuICogQHRlbXBsYXRlIHt7IFtrZXk6IHN0cmluZ3xzeW1ib2x8bnVtYmVyXTogU2NoZW1hPGFueT4gfX0gU1xuICogQHR5cGVkZWYge3sgW0tleSBpbiBrZXlvZiBTIGFzIFNbS2V5XSBleHRlbmRzICRPcHRpb25hbDxTY2hlbWE8YW55Pj4gPyBLZXkgOiBuZXZlcl0/OiBTW0tleV0gZXh0ZW5kcyAkT3B0aW9uYWw8U2NoZW1hPGluZmVyIFR5cGU+PiA/IFR5cGUgOiBuZXZlciB9ICYgeyBbS2V5IGluIGtleW9mIFMgYXMgU1tLZXldIGV4dGVuZHMgJE9wdGlvbmFsPFNjaGVtYTxhbnk+PiA/IG5ldmVyIDogS2V5XTogU1tLZXldIGV4dGVuZHMgU2NoZW1hPGluZmVyIFR5cGU+ID8gVHlwZSA6IG5ldmVyIH19ICRPYmplY3RUb1R5cGVcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7e1trZXk6c3RyaW5nfHN5bWJvbHxudW1iZXJdOiBTY2hlbWE8YW55Pn19IFNcbiAqIEBleHRlbmRzIHtTY2hlbWE8JE9iamVjdFRvVHlwZTxTPj59XG4gKi9cbmV4cG9ydCBjbGFzcyAkT2JqZWN0IGV4dGVuZHMgU2NoZW1hIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7U30gc2hhcGVcbiAgICogQHBhcmFtIHtib29sZWFufSBwYXJ0aWFsXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc2hhcGUsIHBhcnRpYWwgPSBmYWxzZSkge1xuICAgIHN1cGVyKClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7U31cbiAgICAgKi9cbiAgICB0aGlzLnNoYXBlID0gc2hhcGVcbiAgICB0aGlzLl9pc1BhcnRpYWwgPSBwYXJ0aWFsXG4gIH1cblxuICBzdGF0aWMgX2RpbHV0ZXMgPSB0cnVlXG5cbiAgLyoqXG4gICAqIEB0eXBlIHtTY2hlbWE8UGFydGlhbDwkT2JqZWN0VG9UeXBlPFM+Pj59XG4gICAqL1xuICBnZXQgcGFydGlhbCAoKSB7XG4gICAgcmV0dXJuIG5ldyAkT2JqZWN0KHRoaXMuc2hhcGUsIHRydWUpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9cbiAgICogQHBhcmFtIHtWYWxpZGF0aW9uRXJyb3J9IGVyclxuICAgKiBAcmV0dXJuIHtvIGlzICRPYmplY3RUb1R5cGU8Uz59XG4gICAqL1xuICBjaGVjayAobywgZXJyKSB7XG4gICAgaWYgKG8gPT0gbnVsbCkge1xuICAgICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAgIGVycj8uZXh0ZW5kKG51bGwsICdvYmplY3QnLCAnbnVsbCcpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgcmV0dXJuIG9iai5ldmVyeSh0aGlzLnNoYXBlLCAodnYsIHZrKSA9PiB7XG4gICAgICBjb25zdCBjID0gKHRoaXMuX2lzUGFydGlhbCAmJiAhb2JqLmhhc1Byb3BlcnR5KG8sIHZrKSkgfHwgdnYuY2hlY2sob1t2a10sIGVycilcbiAgICAgICFjICYmIGVycj8uZXh0ZW5kKHZrLnRvU3RyaW5nKCksIHZ2LnRvU3RyaW5nKCksIHR5cGVvZiBvW3ZrXSwgJ09iamVjdCBwcm9wZXJ0eSBkb2VzIG5vdCBtYXRjaCcpXG4gICAgICByZXR1cm4gY1xuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgU1xuICogQHR5cGVkZWYge1NjaGVtYTx7IFtLZXkgaW4ga2V5b2YgUyBhcyBTW0tleV0gZXh0ZW5kcyAkT3B0aW9uYWw8U2NoZW1hPGFueT4+ID8gS2V5IDogbmV2ZXJdPzogU1tLZXldIGV4dGVuZHMgJE9wdGlvbmFsPFNjaGVtYTxpbmZlciBUeXBlPj4gPyBUeXBlIDogbmV2ZXIgfSAmIHsgW0tleSBpbiBrZXlvZiBTIGFzIFNbS2V5XSBleHRlbmRzICRPcHRpb25hbDxTY2hlbWE8YW55Pj4gPyBuZXZlciA6IEtleV06IFNbS2V5XSBleHRlbmRzIFNjaGVtYTxpbmZlciBUeXBlPiA/IFR5cGUgOiBuZXZlciB9Pn0gX09iamVjdERlZlRvU2NoZW1hXG4gKi9cblxuLy8gSSB1c2VkIGFuIGV4cGxpY2l0IHR5cGUgYW5ub3RhdGlvbiBpbnN0ZWFkIG9mICRPYmplY3RUb1R5cGUsIHNvIHRoYXQgdGhlIHVzZXIgZG9lc24ndCBzZWUgdGhlXG4vLyB3ZWlyZCB0eXBlIGRlZmluaXRpb25zIHdoZW4gaW5zcGVjdGluZyB0eXBlIGRlZmluaW9ucy5cbi8qKlxuICogQHRlbXBsYXRlIHt7IFtrZXk6c3RyaW5nfHN5bWJvbHxudW1iZXJdOiBTY2hlbWE8YW55PiB9fSBTXG4gKiBAcGFyYW0ge1N9IGRlZlxuICogQHJldHVybiB7X09iamVjdERlZlRvU2NoZW1hPFM+IGV4dGVuZHMgU2NoZW1hPGluZmVyIFM+ID8gU2NoZW1hPHsgW0sgaW4ga2V5b2YgU106IFNbS10gfT4gOiBuZXZlcn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRvYmplY3QgPSBkZWYgPT4gLyoqIEB0eXBlIHthbnl9ICovIChuZXcgJE9iamVjdChkZWYpKVxuZXhwb3J0IGNvbnN0ICQkb2JqZWN0ID0gJGNvbnN0cnVjdGVkQnkoJE9iamVjdClcbi8qKlxuICogQHR5cGUge1NjaGVtYTx7W2tleTpzdHJpbmddOiBhbnl9Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRvYmplY3RBbnkgPSAkY3VzdG9tKG8gPT4gbyAhPSBudWxsICYmIChvLmNvbnN0cnVjdG9yID09PSBPYmplY3QgfHwgby5jb25zdHJ1Y3RvciA9PSBudWxsKSlcblxuLyoqXG4gKiBAdGVtcGxhdGUge1NjaGVtYTxzdHJpbmd8bnVtYmVyfHN5bWJvbD59IEtleXNcbiAqIEB0ZW1wbGF0ZSB7U2NoZW1hPGFueT59IFZhbHVlc1xuICogQGV4dGVuZHMge1NjaGVtYTx7IFtrZXkgaW4gVW53cmFwPEtleXM+XTogVW53cmFwPFZhbHVlcz4gfT59XG4gKi9cbmV4cG9ydCBjbGFzcyAkUmVjb3JkIGV4dGVuZHMgU2NoZW1hIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7S2V5c30ga2V5c1xuICAgKiBAcGFyYW0ge1ZhbHVlc30gdmFsdWVzXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoa2V5cywgdmFsdWVzKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuc2hhcGUgPSB7XG4gICAgICBrZXlzLCB2YWx1ZXNcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9cbiAgICogQHBhcmFtIHtWYWxpZGF0aW9uRXJyb3J9IGVyclxuICAgKiBAcmV0dXJuIHtvIGlzIHsgW2tleSBpbiBVbndyYXA8S2V5cz5dOiBVbndyYXA8VmFsdWVzPiB9fVxuICAgKi9cbiAgY2hlY2sgKG8sIGVycikge1xuICAgIHJldHVybiBvICE9IG51bGwgJiYgb2JqLmV2ZXJ5KG8sICh2diwgdmspID0+IHtcbiAgICAgIGNvbnN0IGNrID0gdGhpcy5zaGFwZS5rZXlzLmNoZWNrKHZrLCBlcnIpXG4gICAgICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgICAgIWNrICYmIGVycj8uZXh0ZW5kKHZrICsgJycsICdSZWNvcmQnLCB0eXBlb2YgbywgY2sgPyAnS2V5IGRvZXNuXFwndCBtYXRjaCBzY2hlbWEnIDogJ1ZhbHVlIGRvZXNuXFwndCBtYXRjaCB2YWx1ZScpXG4gICAgICByZXR1cm4gY2sgJiYgdGhpcy5zaGFwZS52YWx1ZXMuY2hlY2sodnYsIGVycilcbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIHtTY2hlbWE8c3RyaW5nfG51bWJlcnxzeW1ib2w+fSBLZXlzXG4gKiBAdGVtcGxhdGUge1NjaGVtYTxhbnk+fSBWYWx1ZXNcbiAqIEBwYXJhbSB7S2V5c30ga2V5c1xuICogQHBhcmFtIHtWYWx1ZXN9IHZhbHVlc1xuICogQHJldHVybiB7Q2FzdFRvU2NoZW1hPCRSZWNvcmQ8S2V5cyxWYWx1ZXM+Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRyZWNvcmQgPSAoa2V5cywgdmFsdWVzKSA9PiBuZXcgJFJlY29yZChrZXlzLCB2YWx1ZXMpXG5leHBvcnQgY29uc3QgJCRyZWNvcmQgPSAkY29uc3RydWN0ZWRCeSgkUmVjb3JkKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7U2NoZW1hPGFueT5bXX0gU1xuICogQGV4dGVuZHMge1NjaGVtYTx7IFtLZXkgaW4ga2V5b2YgU106IFNbS2V5XSBleHRlbmRzIFNjaGVtYTxpbmZlciBUeXBlPiA/IFR5cGUgOiBuZXZlciB9Pn1cbiAqL1xuZXhwb3J0IGNsYXNzICRUdXBsZSBleHRlbmRzIFNjaGVtYSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1N9IHNoYXBlXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc2hhcGUpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5zaGFwZSA9IHNoYXBlXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9cbiAgICogQHBhcmFtIHtWYWxpZGF0aW9uRXJyb3J9IGVyclxuICAgKiBAcmV0dXJuIHtvIGlzIHsgW0sgaW4ga2V5b2YgU106IFNbS10gZXh0ZW5kcyBTY2hlbWE8aW5mZXIgVHlwZT4gPyBUeXBlIDogbmV2ZXIgfX1cbiAgICovXG4gIGNoZWNrIChvLCBlcnIpIHtcbiAgICByZXR1cm4gbyAhPSBudWxsICYmIG9iai5ldmVyeSh0aGlzLnNoYXBlLCAodnYsIHZrKSA9PiB7XG4gICAgICBjb25zdCBjID0gLyoqIEB0eXBlIHtTY2hlbWE8YW55Pn0gKi8gKHZ2KS5jaGVjayhvW3ZrXSwgZXJyKVxuICAgICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAgICFjICYmIGVycj8uZXh0ZW5kKHZrLnRvU3RyaW5nKCksICdUdXBsZScsIHR5cGVvZiB2dilcbiAgICAgIHJldHVybiBjXG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7QXJyYXk8U2NoZW1hPGFueT4+fSBUXG4gKiBAcGFyYW0ge1R9IGRlZlxuICogQHJldHVybiB7Q2FzdFRvU2NoZW1hPCRUdXBsZTxUPj59XG4gKi9cbmV4cG9ydCBjb25zdCAkdHVwbGUgPSAoLi4uZGVmKSA9PiBuZXcgJFR1cGxlKGRlZilcbmV4cG9ydCBjb25zdCAkJHR1cGxlID0gJGNvbnN0cnVjdGVkQnkoJFR1cGxlKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7U2NoZW1hPGFueT59IFNcbiAqIEBleHRlbmRzIHtTY2hlbWE8QXJyYXk8UyBleHRlbmRzIFNjaGVtYTxpbmZlciBUPiA/IFQgOiBuZXZlcj4+fVxuICovXG5leHBvcnQgY2xhc3MgJEFycmF5IGV4dGVuZHMgU2NoZW1hIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXk8Uz59IHZcbiAgICovXG4gIGNvbnN0cnVjdG9yICh2KSB7XG4gICAgc3VwZXIoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtTY2hlbWE8UyBleHRlbmRzIFNjaGVtYTxpbmZlciBUPiA/IFQgOiBuZXZlcj59XG4gICAgICovXG4gICAgdGhpcy5zaGFwZSA9IHYubGVuZ3RoID09PSAxID8gdlswXSA6IG5ldyAkVW5pb24odilcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gb1xuICAgKiBAcGFyYW0ge1ZhbGlkYXRpb25FcnJvcn0gW2Vycl1cbiAgICogQHJldHVybiB7byBpcyBBcnJheTxTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyPn0gb1xuICAgKi9cbiAgY2hlY2sgKG8sIGVycikge1xuICAgIGNvbnN0IGMgPSBhcnIuaXNBcnJheShvKSAmJiBhcnIuZXZlcnkobywgb2kgPT4gdGhpcy5zaGFwZS5jaGVjayhvaSkpXG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAhYyAmJiBlcnI/LmV4dGVuZChudWxsLCAnQXJyYXknLCAnJylcbiAgICByZXR1cm4gY1xuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIHtBcnJheTxTY2hlbWE8YW55Pj59IFRcbiAqIEBwYXJhbSB7VH0gZGVmXG4gKiBAcmV0dXJuIHtTY2hlbWE8QXJyYXk8VCBleHRlbmRzIEFycmF5PFNjaGVtYTxpbmZlciBTPj4gPyBTIDogbmV2ZXI+Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRhcnJheSA9ICguLi5kZWYpID0+IG5ldyAkQXJyYXkoZGVmKVxuZXhwb3J0IGNvbnN0ICQkYXJyYXkgPSAkY29uc3RydWN0ZWRCeSgkQXJyYXkpXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8QXJyYXk8YW55Pj59XG4gKi9cbmV4cG9ydCBjb25zdCAkYXJyYXlBbnkgPSAkY3VzdG9tKG8gPT4gYXJyLmlzQXJyYXkobykpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBleHRlbmRzIHtTY2hlbWE8VD59XG4gKi9cbmV4cG9ydCBjbGFzcyAkSW5zdGFuY2VPZiBleHRlbmRzIFNjaGVtYSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge25ldyAoLi4uYXJnczphbnkpID0+IFR9IGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7KChvOlQpID0+IGJvb2xlYW4pfG51bGx9IGNoZWNrXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoY29uc3RydWN0b3IsIGNoZWNrKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuc2hhcGUgPSBjb25zdHJ1Y3RvclxuICAgIHRoaXMuX2MgPSBjaGVja1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBvXG4gICAqIEBwYXJhbSB7VmFsaWRhdGlvbkVycm9yfSBlcnJcbiAgICogQHJldHVybiB7byBpcyBUfVxuICAgKi9cbiAgY2hlY2sgKG8sIGVycikge1xuICAgIGNvbnN0IGMgPSBvIGluc3RhbmNlb2YgdGhpcy5zaGFwZSAmJiAodGhpcy5fYyA9PSBudWxsIHx8IHRoaXMuX2MobykpXG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAhYyAmJiBlcnI/LmV4dGVuZChudWxsLCB0aGlzLnNoYXBlLm5hbWUsIG8/LmNvbnN0cnVjdG9yLm5hbWUpXG4gICAgcmV0dXJuIGNcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge25ldyAoLi4uYXJnczphbnkpID0+IFR9IGNcbiAqIEBwYXJhbSB7KChvOlQpID0+IGJvb2xlYW4pfG51bGx9IGNoZWNrXG4gKiBAcmV0dXJuIHtTY2hlbWE8VD59XG4gKi9cbmV4cG9ydCBjb25zdCAkaW5zdGFuY2VPZiA9IChjLCBjaGVjayA9IG51bGwpID0+IG5ldyAkSW5zdGFuY2VPZihjLCBjaGVjaylcbmV4cG9ydCBjb25zdCAkJGluc3RhbmNlT2YgPSAkY29uc3RydWN0ZWRCeSgkSW5zdGFuY2VPZilcblxuZXhwb3J0IGNvbnN0ICQkc2NoZW1hID0gJGluc3RhbmNlT2YoU2NoZW1hKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7U2NoZW1hPGFueT5bXX0gQXJnc1xuICogQHR5cGVkZWYgeyguLi5hcmdzOlVud3JhcEFycmF5PFR1cGxlUG9wPEFyZ3M+Pik9PlVud3JhcDxUdXBsZUxhc3Q8QXJncz4+fSBfTEFyZ3NUb0xhbWJkYURlZlxuICovXG5cbi8qKlxuICogQHRlbXBsYXRlIHtBcnJheTxTY2hlbWE8YW55Pj59IEFyZ3NcbiAqIEBleHRlbmRzIHtTY2hlbWE8X0xBcmdzVG9MYW1iZGFEZWY8QXJncz4+fVxuICovXG5leHBvcnQgY2xhc3MgJExhbWJkYSBleHRlbmRzIFNjaGVtYSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0FyZ3N9IGFyZ3NcbiAgICovXG4gIGNvbnN0cnVjdG9yIChhcmdzKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMubGVuID0gYXJncy5sZW5ndGggLSAxXG4gICAgdGhpcy5hcmdzID0gJHR1cGxlKC4uLmFyZ3Muc2xpY2UoLTEpKVxuICAgIHRoaXMucmVzID0gYXJnc1t0aGlzLmxlbl1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gZlxuICAgKiBAcGFyYW0ge1ZhbGlkYXRpb25FcnJvcn0gZXJyXG4gICAqIEByZXR1cm4ge2YgaXMgX0xBcmdzVG9MYW1iZGFEZWY8QXJncz59XG4gICAqL1xuICBjaGVjayAoZiwgZXJyKSB7XG4gICAgY29uc3QgYyA9IGYuY29uc3RydWN0b3IgPT09IEZ1bmN0aW9uICYmIGYubGVuZ3RoIDw9IHRoaXMubGVuXG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAhYyAmJiBlcnI/LmV4dGVuZChudWxsLCAnZnVuY3Rpb24nLCB0eXBlb2YgZilcbiAgICByZXR1cm4gY1xuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIHtTY2hlbWE8YW55PltdfSBBcmdzXG4gKiBAcGFyYW0ge0FyZ3N9IGFyZ3NcbiAqIEByZXR1cm4ge1NjaGVtYTwoLi4uYXJnczpVbndyYXBBcnJheTxUdXBsZVBvcDxBcmdzPj4pPT5VbndyYXA8VHVwbGVMYXN0PEFyZ3M+Pj59XG4gKi9cbmV4cG9ydCBjb25zdCAkbGFtYmRhID0gKC4uLmFyZ3MpID0+IG5ldyAkTGFtYmRhKGFyZ3MubGVuZ3RoID4gMCA/IGFyZ3MgOiBbJHZvaWRdKVxuZXhwb3J0IGNvbnN0ICQkbGFtYmRhID0gJGNvbnN0cnVjdGVkQnkoJExhbWJkYSlcblxuLyoqXG4gKiBAdHlwZSB7U2NoZW1hPEZ1bmN0aW9uPn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRmdW5jdGlvbiA9ICRjdXN0b20obyA9PiB0eXBlb2YgbyA9PT0gJ2Z1bmN0aW9uJylcblxuLyoqXG4gKiBAdGVtcGxhdGUge0FycmF5PFNjaGVtYTxhbnk+Pn0gVFxuICogQGV4dGVuZHMge1NjaGVtYTxJbnRlcnNlY3Q8VW53cmFwQXJyYXk8VD4+Pn1cbiAqL1xuZXhwb3J0IGNsYXNzICRJbnRlcnNlY3Rpb24gZXh0ZW5kcyBTY2hlbWEge1xuICAvKipcbiAgICogQHBhcmFtIHtUfSB2XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodikge1xuICAgIHN1cGVyKClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7VH1cbiAgICAgKi9cbiAgICB0aGlzLnNoYXBlID0gdlxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBvXG4gICAqIEBwYXJhbSB7VmFsaWRhdGlvbkVycm9yfSBbZXJyXVxuICAgKiBAcmV0dXJuIHtvIGlzIEludGVyc2VjdDxVbndyYXBBcnJheTxUPj59XG4gICAqL1xuICBjaGVjayAobywgZXJyKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGMgPSBhcnIuZXZlcnkodGhpcy5zaGFwZSwgY2hlY2sgPT4gY2hlY2suY2hlY2sobywgZXJyKSlcbiAgICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgICFjICYmIGVycj8uZXh0ZW5kKG51bGwsICdJbnRlcnNlY3Rpbm9uJywgdHlwZW9mIG8pXG4gICAgcmV0dXJuIGNcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7U2NoZW1hPGFueT5bXX0gVFxuICogQHBhcmFtIHtUfSBkZWZcbiAqIEByZXR1cm4ge0Nhc3RUb1NjaGVtYTwkSW50ZXJzZWN0aW9uPFQ+Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRpbnRlcnNlY3QgPSAoLi4uZGVmKSA9PiBuZXcgJEludGVyc2VjdGlvbihkZWYpXG5leHBvcnQgY29uc3QgJCRpbnRlcnNlY3QgPSAkY29uc3RydWN0ZWRCeSgkSW50ZXJzZWN0aW9uLCBvID0+IG8uc2hhcGUubGVuZ3RoID4gMCkgLy8gSW50ZXJzZWN0aW9uIHdpdGggbGVuZ3RoPTAgaXMgY29uc2lkZXJlZCBcImFueVwiXG5cbi8qKlxuICogQHRlbXBsYXRlIFNcbiAqIEBleHRlbmRzIHtTY2hlbWE8Uz59XG4gKi9cbmV4cG9ydCBjbGFzcyAkVW5pb24gZXh0ZW5kcyBTY2hlbWEge1xuICBzdGF0aWMgX2RpbHV0ZXMgPSB0cnVlXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXk8U2NoZW1hPFM+Pn0gdlxuICAgKi9cbiAgY29uc3RydWN0b3IgKHYpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5zaGFwZSA9IHZcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gb1xuICAgKiBAcGFyYW0ge1ZhbGlkYXRpb25FcnJvcn0gW2Vycl1cbiAgICogQHJldHVybiB7byBpcyBTfVxuICAgKi9cbiAgY2hlY2sgKG8sIGVycikge1xuICAgIGNvbnN0IGMgPSBhcnIuc29tZSh0aGlzLnNoYXBlLCAodnYpID0+IHZ2LmNoZWNrKG8sIGVycikpXG4gICAgZXJyPy5leHRlbmQobnVsbCwgJ1VuaW9uJywgdHlwZW9mIG8pXG4gICAgcmV0dXJuIGNcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7QXJyYXk8YW55Pn0gVFxuICogQHBhcmFtIHtUfSBzY2hlbWFzXG4gKiBAcmV0dXJuIHtDYXN0VG9TY2hlbWE8JFVuaW9uPFVud3JhcDxSZWFkU2NoZW1hPFQ+Pj4+fVxuICovXG5leHBvcnQgY29uc3QgJHVuaW9uID0gKC4uLnNjaGVtYXMpID0+IHNjaGVtYXMuZmluZEluZGV4KCRzID0+ICQkdW5pb24uY2hlY2soJHMpKSA+PSAwXG4gID8gJHVuaW9uKC4uLnNjaGVtYXMubWFwKCRzID0+ICQoJHMpKS5tYXAoJHMgPT4gJCR1bmlvbi5jaGVjaygkcykgPyAkcy5zaGFwZSA6IFskc10pLmZsYXQoMSkpXG4gIDogKHNjaGVtYXMubGVuZ3RoID09PSAxXG4gICAgICA/IHNjaGVtYXNbMF1cbiAgICAgIDogbmV3ICRVbmlvbihzY2hlbWFzKSlcbmV4cG9ydCBjb25zdCAkJHVuaW9uID0gLyoqIEB0eXBlIHtTY2hlbWE8JFVuaW9uPGFueT4+fSAqLyAoJGNvbnN0cnVjdGVkQnkoJFVuaW9uKSlcblxuY29uc3QgX3QgPSAoKSA9PiB0cnVlXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8YW55Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRhbnkgPSAkY3VzdG9tKF90KVxuZXhwb3J0IGNvbnN0ICQkYW55ID0gLyoqIEB0eXBlIHtTY2hlbWE8U2NoZW1hPGFueT4+fSAqLyAoJGNvbnN0cnVjdGVkQnkoJEN1c3RvbSwgbyA9PiBvLnNoYXBlID09PSBfdCkpXG5cbi8qKlxuICogQHR5cGUge1NjaGVtYTxiaWdpbnQ+fVxuICovXG5leHBvcnQgY29uc3QgJGJpZ2ludCA9ICRjdXN0b20obyA9PiB0eXBlb2YgbyA9PT0gJ2JpZ2ludCcpXG5leHBvcnQgY29uc3QgJCRiaWdpbnQgPSAvKiogQHR5cGUge1NjaGVtYTxTY2hlbWE8QmlnSW50Pj59ICovICgkY3VzdG9tKG8gPT4gbyA9PT0gJGJpZ2ludCkpXG5cbi8qKlxuICogQHR5cGUge1NjaGVtYTxzeW1ib2w+fVxuICovXG5leHBvcnQgY29uc3QgJHN5bWJvbCA9ICRjdXN0b20obyA9PiB0eXBlb2YgbyA9PT0gJ3N5bWJvbCcpXG5leHBvcnQgY29uc3QgJCRzeW1ib2wgPSAvKiogQHR5cGUge1NjaGVtYTxTY2hlbWE8U3ltYm9sPj59ICovICgkY3VzdG9tKG8gPT4gbyA9PT0gJHN5bWJvbCkpXG5cbi8qKlxuICogQHR5cGUge1NjaGVtYTxudW1iZXI+fVxuICovXG5leHBvcnQgY29uc3QgJG51bWJlciA9ICRjdXN0b20obyA9PiB0eXBlb2YgbyA9PT0gJ251bWJlcicpXG5leHBvcnQgY29uc3QgJCRudW1iZXIgPSAvKiogQHR5cGUge1NjaGVtYTxTY2hlbWE8bnVtYmVyPj59ICovICgkY3VzdG9tKG8gPT4gbyA9PT0gJG51bWJlcikpXG5cbi8qKlxuICogQHR5cGUge1NjaGVtYTxzdHJpbmc+fVxuICovXG5leHBvcnQgY29uc3QgJHN0cmluZyA9ICRjdXN0b20obyA9PiB0eXBlb2YgbyA9PT0gJ3N0cmluZycpXG5leHBvcnQgY29uc3QgJCRzdHJpbmcgPSAvKiogQHR5cGUge1NjaGVtYTxTY2hlbWE8c3RyaW5nPj59ICovICgkY3VzdG9tKG8gPT4gbyA9PT0gJHN0cmluZykpXG5cbi8qKlxuICogQHR5cGUge1NjaGVtYTxib29sZWFuPn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRib29sZWFuID0gJGN1c3RvbShvID0+IHR5cGVvZiBvID09PSAnYm9vbGVhbicpXG5leHBvcnQgY29uc3QgJCRib29sZWFuID0gLyoqIEB0eXBlIHtTY2hlbWE8U2NoZW1hPEJvb2xlYW4+Pn0gKi8gKCRjdXN0b20obyA9PiBvID09PSAkYm9vbGVhbikpXG5cbi8qKlxuICogQHR5cGUge1NjaGVtYTx1bmRlZmluZWQ+fVxuICovXG5leHBvcnQgY29uc3QgJHVuZGVmaW5lZCA9ICRsaXRlcmFsKHVuZGVmaW5lZClcbmV4cG9ydCBjb25zdCAkJHVuZGVmaW5lZCA9IC8qKiBAdHlwZSB7U2NoZW1hPFNjaGVtYTx1bmRlZmluZWQ+Pn0gKi8gKCRjb25zdHJ1Y3RlZEJ5KCRMaXRlcmFsLCBvID0+IG8uc2hhcGUubGVuZ3RoID09PSAxICYmIG8uc2hhcGVbMF0gPT09IHVuZGVmaW5lZCkpXG5cbi8qKlxuICogQHR5cGUge1NjaGVtYTx2b2lkPn1cbiAqL1xuZXhwb3J0IGNvbnN0ICR2b2lkID0gJGxpdGVyYWwodW5kZWZpbmVkKVxuZXhwb3J0IGNvbnN0ICQkdm9pZCA9IC8qKiBAdHlwZSB7U2NoZW1hPFNjaGVtYTx2b2lkPj59ICovICgkJHVuZGVmaW5lZClcblxuZXhwb3J0IGNvbnN0ICRudWxsID0gJGxpdGVyYWwobnVsbClcbmV4cG9ydCBjb25zdCAkJG51bGwgPSAvKiogQHR5cGUge1NjaGVtYTxTY2hlbWE8bnVsbD4+fSAqLyAoJGNvbnN0cnVjdGVkQnkoJExpdGVyYWwsIG8gPT4gby5zaGFwZS5sZW5ndGggPT09IDEgJiYgby5zaGFwZVswXSA9PT0gbnVsbCkpXG5cbmV4cG9ydCBjb25zdCAkdWludDhBcnJheSA9ICRjb25zdHJ1Y3RlZEJ5KFVpbnQ4QXJyYXkpXG5leHBvcnQgY29uc3QgJCR1aW50OEFycmF5ID0gLyoqIEB0eXBlIHtTY2hlbWE8U2NoZW1hPFVpbnQ4QXJyYXk+Pn0gKi8gKCRjb25zdHJ1Y3RlZEJ5KCRDb25zdHJ1Y3RlZEJ5LCBvID0+IG8uc2hhcGUgPT09IFVpbnQ4QXJyYXkpKVxuXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8UHJpbWl0aXZlPn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRwcmltaXRpdmUgPSAkdW5pb24oJG51bWJlciwgJHN0cmluZywgJG51bGwsICR1bmRlZmluZWQsICRiaWdpbnQsICRib29sZWFuLCAkc3ltYm9sKVxuXG4vKipcbiAqIEB0eXBlZGVmIHtKU09OW119IEpTT05BcnJheVxuICovXG4vKipcbiAqIEB0eXBlZGVmIHtQcmltaXRpdmV8SlNPTkFycmF5fHsgW2tleTpzdHJpbmddOkpTT04gfX0gSlNPTlxuICovXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8bnVsbHxudW1iZXJ8c3RyaW5nfGJvb2xlYW58SlNPTltdfHtba2V5OnN0cmluZ106SlNPTn0+fVxuICovXG5leHBvcnQgY29uc3QgJGpzb24gPSAoKCkgPT4ge1xuICBjb25zdCAkanNvbkFyciA9IC8qKiBAdHlwZSB7JEFycmF5PCRhbnk+fSAqLyAoJGFycmF5KCRhbnkpKVxuICBjb25zdCAkanNvblJlY29yZCA9IC8qKiBAdHlwZSB7JFJlY29yZDwkc3RyaW5nLCRhbnk+fSAqLyAoJHJlY29yZCgkc3RyaW5nLCAkYW55KSlcbiAgY29uc3QgJGpzb24gPSAkdW5pb24oJG51bWJlciwgJHN0cmluZywgJG51bGwsICRib29sZWFuLCAkanNvbkFyciwgJGpzb25SZWNvcmQpXG4gICRqc29uQXJyLnNoYXBlID0gJGpzb25cbiAgJGpzb25SZWNvcmQuc2hhcGUudmFsdWVzID0gJGpzb25cbiAgcmV0dXJuICRqc29uXG59KSgpXG5cbi8qKlxuICogQHRlbXBsYXRlIHthbnl9IElOXG4gKiBAdHlwZWRlZiB7SU4gZXh0ZW5kcyBTY2hlbWE8YW55PiA/IElOXG4gKiAgIDogKElOIGV4dGVuZHMgc3RyaW5nfG51bWJlcnxib29sZWFufG51bGwgPyBTY2hlbWE8SU4+XG4gKiAgICAgOiAoSU4gZXh0ZW5kcyBuZXcgKC4uLmFyZ3M6YW55W10pPT5hbnkgPyBTY2hlbWE8SW5zdGFuY2VUeXBlPElOPj5cbiAqICAgICAgIDogKElOIGV4dGVuZHMgYW55W10gPyBTY2hlbWE8eyBbSyBpbiBrZXlvZiBJTl06IFVud3JhcDxSZWFkU2NoZW1hPElOW0tdPj4gfVtudW1iZXJdPlxuICAgKiAgICAgICA6IChJTiBleHRlbmRzIG9iamVjdCA/IChfT2JqZWN0RGVmVG9TY2hlbWE8e1tLIGluIGtleW9mIElOXTpSZWFkU2NoZW1hPElOW0tdPn0+IGV4dGVuZHMgU2NoZW1hPGluZmVyIFM+ID8gU2NoZW1hPHsgW0sgaW4ga2V5b2YgU106IFNbS10gfT4gOiBuZXZlcilcbiAgICogICAgICAgICA6IG5ldmVyKVxuICogICAgICAgICApXG4gKiAgICAgICApXG4gKiAgICAgKVxuICogfSBSZWFkU2NoZW1hT2xkXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUge2FueX0gSU5cbiAqIEB0eXBlZGVmIHtbRXh0cmFjdDxJTixTY2hlbWE8YW55Pj4sRXh0cmFjdDxJTixzdHJpbmd8bnVtYmVyfGJvb2xlYW58bnVsbD4sRXh0cmFjdDxJTixuZXcgKC4uLmFyZ3M6YW55W10pPT5hbnk+LEV4dHJhY3Q8SU4sYW55W10+LEV4dHJhY3Q8RXhjbHVkZTxJTixTY2hlbWE8YW55PnxzdHJpbmd8bnVtYmVyfGJvb2xlYW58bnVsbHwobmV3ICguLi5hcmdzOmFueVtdKT0+YW55KXxhbnlbXT4sb2JqZWN0Pl0gZXh0ZW5kcyBbaW5mZXIgU2NoZW1hcywgaW5mZXIgUHJpbWl0aXZlcywgaW5mZXIgQ29uc3RydWN0b3JzLCBpbmZlciBBcnJzLCBpbmZlciBPYmpdXG4gKiAgID8gU2NoZW1hPFxuICogICAgICAgKFNjaGVtYXMgZXh0ZW5kcyBTY2hlbWE8aW5mZXIgUz4gPyBTIDogbmV2ZXIpXG4gKiAgICAgfCBQcmltaXRpdmVzXG4gKiAgICAgfCAoQ29uc3RydWN0b3JzIGV4dGVuZHMgbmV3ICguLi5hcmdzOmFueVtdKT0+YW55ID8gSW5zdGFuY2VUeXBlPENvbnN0cnVjdG9ycz4gOiBuZXZlcilcbiAqICAgICB8IChBcnJzIGV4dGVuZHMgYW55W10gPyB7IFtLIGluIGtleW9mIEFycnNdOiBVbndyYXA8UmVhZFNjaGVtYTxBcnJzW0tdPj4gfVtudW1iZXJdIDogbmV2ZXIpXG4gKiAgICAgfCAoT2JqIGV4dGVuZHMgb2JqZWN0ID8gVW53cmFwPChfT2JqZWN0RGVmVG9TY2hlbWE8e1tLIGluIGtleW9mIE9ial06UmVhZFNjaGVtYTxPYmpbS10+fT4gZXh0ZW5kcyBTY2hlbWE8aW5mZXIgUz4gPyBTY2hlbWE8eyBbSyBpbiBrZXlvZiBTXTogU1tLXSB9PiA6IG5ldmVyKT4gOiBuZXZlcik+XG4gKiAgIDogbmV2ZXJcbiAqIH0gUmVhZFNjaGVtYVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge1JlYWRTY2hlbWE8e3g6NDJ9fHt5Ojk5fXxTY2hlbWE8c3RyaW5nPnxbMSwyLHt9XT59IFFcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBJTlxuICogQHBhcmFtIHtJTn0gb1xuICogQHJldHVybiB7UmVhZFNjaGVtYTxJTj59XG4gKi9cbmV4cG9ydCBjb25zdCAkID0gbyA9PiB7XG4gIGlmICgkJHNjaGVtYS5jaGVjayhvKSkge1xuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKG8pXG4gIH0gZWxzZSBpZiAoJG9iamVjdEFueS5jaGVjayhvKSkge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHthbnl9XG4gICAgICovXG4gICAgY29uc3QgbzIgPSB7fVxuICAgIGZvciAoY29uc3QgayBpbiBvKSB7XG4gICAgICBvMltrXSA9ICQob1trXSlcbiAgICB9XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAoJG9iamVjdChvMikpXG4gIH0gZWxzZSBpZiAoJGFycmF5QW55LmNoZWNrKG8pKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAoJHVuaW9uKC4uLm8ubWFwKCQpKSlcbiAgfSBlbHNlIGlmICgkcHJpbWl0aXZlLmNoZWNrKG8pKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAoJGxpdGVyYWwobykpXG4gIH0gZWxzZSBpZiAoJGZ1bmN0aW9uLmNoZWNrKG8pKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAoJGNvbnN0cnVjdGVkQnkoLyoqIEB0eXBlIHthbnl9ICovIChvKSkpXG4gIH1cbiAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgZXJyb3IudW5leHBlY3RlZENhc2UoKVxufVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQXNzZXJ0IHRoYXQgYSB2YXJpYWJsZSBpcyBvZiB0aGlzIHNwZWNpZmljIHR5cGUuXG4gKiBUaGUgYXNzZXJ0aW9uIGNoZWNrIGlzIG9ubHkgcGVyZm9ybWVkIGluIG5vbi1wcm9kdWN0aW9uIGVudmlyb25tZW50cy5cbiAqXG4gKiBAdHlwZSB7PFQ+KG86YW55LHNjaGVtYTpTY2hlbWE8VD4pID0+IGFzc2VydHMgbyBpcyBUfVxuICovXG5leHBvcnQgY29uc3QgYXNzZXJ0ID0gZW52LnByb2R1Y3Rpb25cbiAgPyAoKSA9PiB7fVxuICA6IChvLCBzY2hlbWEpID0+IHtcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBWYWxpZGF0aW9uRXJyb3IoKVxuICAgICAgaWYgKCFzY2hlbWEuY2hlY2sobywgZXJyKSkge1xuICAgICAgICB0aHJvdyBlcnJvci5jcmVhdGUoYEV4cGVjdGVkIHZhbHVlIHRvIGJlIG9mIHR5cGUgJHtzY2hlbWEuY29uc3RydWN0b3IubmFtZX0uXFxuJHtlcnIudG9TdHJpbmcoKX1gKVxuICAgICAgfVxuICAgIH1cbi8qIGM4IGlnbm9yZSBlbmQgKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUgSW5cbiAqIEB0ZW1wbGF0ZSBPdXRcbiAqIEB0eXBlZGVmIHt7IGlmOiBTY2hlbWE8SW4+LCBoOiAobzpJbixzdGF0ZT86YW55KT0+T3V0IH19IFBhdHRlcm5cbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7UGF0dGVybjxhbnksYW55Pn0gUFxuICogQHRlbXBsYXRlIEluXG4gKiBAdHlwZWRlZiB7UmV0dXJuVHlwZTxFeHRyYWN0PFAsUGF0dGVybjxJbiBleHRlbmRzIG51bWJlciA/IG51bWJlciA6IChJbiBleHRlbmRzIHN0cmluZyA/IHN0cmluZyA6IEluKSxhbnk+PlsnaCddPn0gUGF0dGVybk1hdGNoUmVzdWx0XG4gKi9cblxuLyoqXG4gKiBAdG9kbyBtb3ZlIHRoaXMgdG8gc2VwYXJhdGUgbGlicmFyeVxuICogQHRlbXBsYXRlIHthbnl9IFtTdGF0ZT11bmRlZmluZWRdXG4gKiBAdGVtcGxhdGUge1BhdHRlcm48YW55LGFueT59IFtQYXR0ZXJucz1uZXZlcl1cbiAqL1xuZXhwb3J0IGNsYXNzIFBhdHRlcm5NYXRjaGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7U2NoZW1hPFN0YXRlPn0gWyRzdGF0ZV1cbiAgICovXG4gIGNvbnN0cnVjdG9yICgkc3RhdGUpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QXJyYXk8UGF0dGVybnM+fVxuICAgICAqL1xuICAgIHRoaXMucGF0dGVybnMgPSBbXVxuICAgIHRoaXMuJHN0YXRlID0gJHN0YXRlXG4gIH1cblxuICAvKipcbiAgICogQHRlbXBsYXRlIFBcbiAgICogQHRlbXBsYXRlIFJcbiAgICogQHBhcmFtIHtQfSBwYXR0ZXJuXG4gICAqIEBwYXJhbSB7KG86Tm9JbmZlcjxVbndyYXA8UmVhZFNjaGVtYTxQPj4+LHM6U3RhdGUpPT5SfSBoYW5kbGVyXG4gICAqIEByZXR1cm4ge1BhdHRlcm5NYXRjaGVyPFN0YXRlLFBhdHRlcm5zfFBhdHRlcm48VW53cmFwPFJlYWRTY2hlbWE8UD4+LFI+Pn1cbiAgICovXG4gIGlmIChwYXR0ZXJuLCBoYW5kbGVyKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHRoaXMucGF0dGVybnMucHVzaCh7IGlmOiAkKHBhdHRlcm4pLCBoOiBoYW5kbGVyIH0pXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQHRlbXBsYXRlIFJcbiAgICogQHBhcmFtIHsobzphbnksczpTdGF0ZSk9PlJ9IGhcbiAgICovXG4gIGVsc2UgKGgpIHtcbiAgICByZXR1cm4gdGhpcy5pZigkYW55LCBoKVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1N0YXRlIGV4dGVuZHMgdW5kZWZpbmVkXG4gICAqICAgPyA8SW4gZXh0ZW5kcyBVbndyYXA8UGF0dGVybnNbJ2lmJ10+PihvOkluLHN0YXRlPzp1bmRlZmluZWQpPT5QYXR0ZXJuTWF0Y2hSZXN1bHQ8UGF0dGVybnMsSW4+XG4gICAqICAgOiA8SW4gZXh0ZW5kcyBVbndyYXA8UGF0dGVybnNbJ2lmJ10+PihvOkluLHN0YXRlOlN0YXRlKT0+UGF0dGVybk1hdGNoUmVzdWx0PFBhdHRlcm5zLEluPn1cbiAgICovXG4gIGRvbmUgKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICByZXR1cm4gLyoqIEB0eXBlIHthbnl9ICovIChvLCBzKSA9PiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucGF0dGVybnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcCA9IHRoaXMucGF0dGVybnNbaV1cbiAgICAgICAgaWYgKHAuaWYuY2hlY2sobykpIHtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgcmV0dXJuIHAuaChvLCBzKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvci5jcmVhdGUoJ1VuaGFuZGxlZCBwYXR0ZXJuJylcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgW1N0YXRlPXVuZGVmaW5lZF1cbiAqIEBwYXJhbSB7U3RhdGV9IFtzdGF0ZV1cbiAqIEByZXR1cm4ge1BhdHRlcm5NYXRjaGVyPFN0YXRlIGV4dGVuZHMgdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogVW53cmFwPFJlYWRTY2hlbWE8U3RhdGU+Pj59XG4gKi9cbmV4cG9ydCBjb25zdCBtYXRjaCA9IHN0YXRlID0+IG5ldyBQYXR0ZXJuTWF0Y2hlcigvKiogQHR5cGUge2FueX0gKi8gKHN0YXRlKSlcblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgYSAobm9uLWV4aGF1c3RpdmUpIHNhbXBsZSBzZXQgZnJvbSBhIGdpdmVzIHNjaGVtYS5cbiAqXG4gKiBAdHlwZSB7PFQ+KG86VCxnZW46cHJuZy5QUk5HKT0+VH1cbiAqL1xuY29uc3QgX3JhbmRvbSA9IC8qKiBAdHlwZSB7YW55fSAqLyAobWF0Y2goLyoqIEB0eXBlIHtTY2hlbWE8cHJuZy5QUk5HPn0gKi8gKCRhbnkpKVxuICAuaWYoJCRudW1iZXIsIChfbywgZ2VuKSA9PiBwcm5nLmludDUzKGdlbiwgbnVtYmVyLk1JTl9TQUZFX0lOVEVHRVIsIG51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSlcbiAgLmlmKCQkc3RyaW5nLCAoX28sIGdlbikgPT4gcHJuZy53b3JkKGdlbikpXG4gIC5pZigkJGJvb2xlYW4sIChfbywgZ2VuKSA9PiBwcm5nLmJvb2woZ2VuKSlcbiAgLmlmKCQkYmlnaW50LCAoX28sIGdlbikgPT4gQmlnSW50KHBybmcuaW50NTMoZ2VuLCBudW1iZXIuTUlOX1NBRkVfSU5URUdFUiwgbnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpKSlcbiAgLmlmKCQkdW5pb24sIChvLCBnZW4pID0+IHJhbmRvbShnZW4sIHBybmcub25lT2YoZ2VuLCBvLnNoYXBlKSkpXG4gIC5pZigkJG9iamVjdCwgKG8sIGdlbikgPT4ge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHthbnl9XG4gICAgICovXG4gICAgY29uc3QgcmVzID0ge31cbiAgICBmb3IgKGNvbnN0IGsgaW4gby5zaGFwZSkge1xuICAgICAgbGV0IHByb3AgPSBvLnNoYXBlW2tdXG4gICAgICBpZiAoJCRvcHRpb25hbC5jaGVjayhwcm9wKSkge1xuICAgICAgICBpZiAocHJuZy5ib29sKGdlbikpIHsgY29udGludWUgfVxuICAgICAgICBwcm9wID0gcHJvcC5zaGFwZVxuICAgICAgfVxuICAgICAgcmVzW2tdID0gX3JhbmRvbShwcm9wLCBnZW4pXG4gICAgfVxuICAgIHJldHVybiByZXNcbiAgfSlcbiAgLmlmKCQkYXJyYXksIChvLCBnZW4pID0+IHtcbiAgICBjb25zdCBhcnIgPSBbXVxuICAgIGNvbnN0IG4gPSBwcm5nLmludDMyKGdlbiwgMCwgNDIpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIGFyci5wdXNoKHJhbmRvbShnZW4sIG8uc2hhcGUpKVxuICAgIH1cbiAgICByZXR1cm4gYXJyXG4gIH0pXG4gIC5pZigkJGxpdGVyYWwsIChvLCBnZW4pID0+IHtcbiAgICByZXR1cm4gcHJuZy5vbmVPZihnZW4sIG8uc2hhcGUpXG4gIH0pXG4gIC5pZigkJG51bGwsIChvLCBnZW4pID0+IHtcbiAgICByZXR1cm4gbnVsbFxuICB9KVxuICAuaWYoJCRsYW1iZGEsIChvLCBnZW4pID0+IHtcbiAgICBjb25zdCByZXMgPSByYW5kb20oZ2VuLCBvLnJlcylcbiAgICByZXR1cm4gKCkgPT4gcmVzXG4gIH0pXG4gIC5pZigkJGFueSwgKG8sIGdlbikgPT4gcmFuZG9tKGdlbiwgcHJuZy5vbmVPZihnZW4sIFtcbiAgICAkbnVtYmVyLCAkc3RyaW5nLCAkbnVsbCwgJHVuZGVmaW5lZCwgJGJpZ2ludCwgJGJvb2xlYW4sXG4gICAgJGFycmF5KCRudW1iZXIpLFxuICAgICRyZWNvcmQoJHVuaW9uKCdhJywgJ2InLCAnYycpLCAkbnVtYmVyKVxuICBdKSkpXG4gIC5pZigkJHJlY29yZCwgKG8sIGdlbikgPT4ge1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHthbnl9XG4gICAgICovXG4gICAgY29uc3QgcmVzID0ge31cbiAgICBjb25zdCBrZXlzTiA9IHBybmcuaW50NTMoZ2VuLCAwLCAzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5c047IGkrKykge1xuICAgICAgY29uc3Qga2V5ID0gcmFuZG9tKGdlbiwgby5zaGFwZS5rZXlzKVxuICAgICAgY29uc3QgdmFsID0gcmFuZG9tKGdlbiwgby5zaGFwZS52YWx1ZXMpXG4gICAgICByZXNba2V5XSA9IHZhbFxuICAgIH1cbiAgICByZXR1cm4gcmVzXG4gIH0pXG4gIC5kb25lKCkpXG5cbi8qKlxuICogQHRlbXBsYXRlIFNcbiAqIEBwYXJhbSB7cHJuZy5QUk5HfSBnZW5cbiAqIEBwYXJhbSB7U30gc2NoZW1hXG4gKiBAcmV0dXJuIHtVbndyYXA8UmVhZFNjaGVtYTxTPj59XG4gKi9cbmV4cG9ydCBjb25zdCByYW5kb20gPSAoZ2VuLCBzY2hlbWEpID0+IC8qKiBAdHlwZSB7YW55fSAqLyAoX3JhbmRvbSgkKHNjaGVtYSksIGdlbikpXG4iLCAiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogVXRpbGl0eSBtb2R1bGUgdG8gd29yayB3aXRoIHRoZSBET00uXG4gKlxuICogQG1vZHVsZSBkb21cbiAqL1xuXG5pbXBvcnQgKiBhcyBwYWlyIGZyb20gJy4vcGFpci5qcydcbmltcG9ydCAqIGFzIG1hcCBmcm9tICcuL21hcC5qcydcbmltcG9ydCAqIGFzICQgZnJvbSAnLi9zY2hlbWEuanMnXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBAdHlwZSB7RG9jdW1lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBkb2MgPSAvKiogQHR5cGUge0RvY3VtZW50fSAqLyAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyA/IGRvY3VtZW50IDoge30pXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRWxlbWVudCA9IG5hbWUgPT4gZG9jLmNyZWF0ZUVsZW1lbnQobmFtZSlcblxuLyoqXG4gKiBAcmV0dXJuIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRG9jdW1lbnRGcmFnbWVudCA9ICgpID0+IGRvYy5jcmVhdGVEb2N1bWVudEZyYWdtZW50KClcblxuLyoqXG4gKiBAdHlwZSB7JC5TY2hlbWE8RG9jdW1lbnRGcmFnbWVudD59XG4gKi9cbmV4cG9ydCBjb25zdCAkZnJhZ21lbnQgPSAkLiRjdXN0b20oZWwgPT4gZWwubm9kZVR5cGUgPT09IERPQ1VNRU5UX0ZSQUdNRU5UX05PREUpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEByZXR1cm4ge1RleHR9XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVUZXh0Tm9kZSA9IHRleHQgPT4gZG9jLmNyZWF0ZVRleHROb2RlKHRleHQpXG5cbmV4cG9ydCBjb25zdCBkb21QYXJzZXIgPSAvKiogQHR5cGUge0RPTVBhcnNlcn0gKi8gKHR5cGVvZiBET01QYXJzZXIgIT09ICd1bmRlZmluZWQnID8gbmV3IERPTVBhcnNlcigpIDogbnVsbClcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gKi9cbmV4cG9ydCBjb25zdCBlbWl0Q3VzdG9tRXZlbnQgPSAoZWwsIG5hbWUsIG9wdHMpID0+IGVsLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KG5hbWUsIG9wdHMpKVxuXG4vKipcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7QXJyYXk8cGFpci5QYWlyPHN0cmluZyxzdHJpbmd8Ym9vbGVhbj4+fSBhdHRycyBBcnJheSBvZiBrZXktdmFsdWUgcGFpcnNcbiAqIEByZXR1cm4ge0VsZW1lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBzZXRBdHRyaWJ1dGVzID0gKGVsLCBhdHRycykgPT4ge1xuICBwYWlyLmZvckVhY2goYXR0cnMsIChrZXksIHZhbHVlKSA9PiB7XG4gICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKGtleSlcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSB0cnVlKSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoa2V5LCAnJylcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgZWwuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpXG4gICAgfVxuICB9KVxuICByZXR1cm4gZWxcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge01hcDxzdHJpbmcsIHN0cmluZz59IGF0dHJzIEFycmF5IG9mIGtleS12YWx1ZSBwYWlyc1xuICogQHJldHVybiB7RWxlbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IHNldEF0dHJpYnV0ZXNNYXAgPSAoZWwsIGF0dHJzKSA9PiB7XG4gIGF0dHJzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHsgZWwuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpIH0pXG4gIHJldHVybiBlbFxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT58SFRNTENvbGxlY3Rpb259IGNoaWxkcmVuXG4gKiBAcmV0dXJuIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5leHBvcnQgY29uc3QgZnJhZ21lbnQgPSBjaGlsZHJlbiA9PiB7XG4gIGNvbnN0IGZyYWdtZW50ID0gY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICBhcHBlbmRDaGlsZChmcmFnbWVudCwgY2hpbGRyZW5baV0pXG4gIH1cbiAgcmV0dXJuIGZyYWdtZW50XG59XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBwYXJlbnRcbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IG5vZGVzXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3QgYXBwZW5kID0gKHBhcmVudCwgbm9kZXMpID0+IHtcbiAgYXBwZW5kQ2hpbGQocGFyZW50LCBmcmFnbWVudChub2RlcykpXG4gIHJldHVybiBwYXJlbnRcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbFxuICovXG5leHBvcnQgY29uc3QgcmVtb3ZlID0gZWwgPT4gZWwucmVtb3ZlKClcblxuLyoqXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7RXZlbnRMaXN0ZW5lcn0gZlxuICovXG5leHBvcnQgY29uc3QgYWRkRXZlbnRMaXN0ZW5lciA9IChlbCwgbmFtZSwgZikgPT4gZWwuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBmKVxuXG4vKipcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtFdmVudExpc3RlbmVyfSBmXG4gKi9cbmV4cG9ydCBjb25zdCByZW1vdmVFdmVudExpc3RlbmVyID0gKGVsLCBuYW1lLCBmKSA9PiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGYpXG5cbi8qKlxuICogQHBhcmFtIHtOb2RlfSBub2RlXG4gKiBAcGFyYW0ge0FycmF5PHBhaXIuUGFpcjxzdHJpbmcsRXZlbnRMaXN0ZW5lcj4+fSBsaXN0ZW5lcnNcbiAqIEByZXR1cm4ge05vZGV9XG4gKi9cbmV4cG9ydCBjb25zdCBhZGRFdmVudExpc3RlbmVycyA9IChub2RlLCBsaXN0ZW5lcnMpID0+IHtcbiAgcGFpci5mb3JFYWNoKGxpc3RlbmVycywgKG5hbWUsIGYpID0+IGFkZEV2ZW50TGlzdGVuZXIobm9kZSwgbmFtZSwgZikpXG4gIHJldHVybiBub2RlXG59XG5cbi8qKlxuICogQHBhcmFtIHtOb2RlfSBub2RlXG4gKiBAcGFyYW0ge0FycmF5PHBhaXIuUGFpcjxzdHJpbmcsRXZlbnRMaXN0ZW5lcj4+fSBsaXN0ZW5lcnNcbiAqIEByZXR1cm4ge05vZGV9XG4gKi9cbmV4cG9ydCBjb25zdCByZW1vdmVFdmVudExpc3RlbmVycyA9IChub2RlLCBsaXN0ZW5lcnMpID0+IHtcbiAgcGFpci5mb3JFYWNoKGxpc3RlbmVycywgKG5hbWUsIGYpID0+IHJlbW92ZUV2ZW50TGlzdGVuZXIobm9kZSwgbmFtZSwgZikpXG4gIHJldHVybiBub2RlXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7QXJyYXk8cGFpci5QYWlyPHN0cmluZyxzdHJpbmc+fHBhaXIuUGFpcjxzdHJpbmcsYm9vbGVhbj4+fSBhdHRycyBBcnJheSBvZiBrZXktdmFsdWUgcGFpcnNcbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IGNoaWxkcmVuXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3QgZWxlbWVudCA9IChuYW1lLCBhdHRycyA9IFtdLCBjaGlsZHJlbiA9IFtdKSA9PlxuICBhcHBlbmQoc2V0QXR0cmlidXRlcyhjcmVhdGVFbGVtZW50KG5hbWUpLCBhdHRycyksIGNoaWxkcmVuKVxuXG4vKipcbiAqIEB0eXBlIHskLlNjaGVtYTxFbGVtZW50Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRlbGVtZW50ID0gJC4kY3VzdG9tKGVsID0+IGVsLm5vZGVUeXBlID09PSBFTEVNRU5UX05PREUpXG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoXG4gKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XG4gKi9cbmV4cG9ydCBjb25zdCBjYW52YXMgPSAod2lkdGgsIGhlaWdodCkgPT4ge1xuICBjb25zdCBjID0gLyoqIEB0eXBlIHtIVE1MQ2FudmFzRWxlbWVudH0gKi8gKGNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpKVxuICBjLmhlaWdodCA9IGhlaWdodFxuICBjLndpZHRoID0gd2lkdGhcbiAgcmV0dXJuIGNcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdFxuICogQHJldHVybiB7VGV4dH1cbiAqL1xuZXhwb3J0IGNvbnN0IHRleHQgPSBjcmVhdGVUZXh0Tm9kZVxuXG4vKipcbiAqIEB0eXBlIHskLlNjaGVtYTxUZXh0Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICR0ZXh0ID0gJC4kY3VzdG9tKGVsID0+IGVsLm5vZGVUeXBlID09PSBURVhUX05PREUpXG5cbi8qKlxuICogQHBhcmFtIHtwYWlyLlBhaXI8c3RyaW5nLHN0cmluZz59IHBhaXJcbiAqL1xuZXhwb3J0IGNvbnN0IHBhaXJUb1N0eWxlU3RyaW5nID0gcGFpciA9PiBgJHtwYWlyLmxlZnR9OiR7cGFpci5yaWdodH07YFxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8cGFpci5QYWlyPHN0cmluZyxzdHJpbmc+Pn0gcGFpcnNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IHBhaXJzVG9TdHlsZVN0cmluZyA9IHBhaXJzID0+IHBhaXJzLm1hcChwYWlyVG9TdHlsZVN0cmluZykuam9pbignJylcblxuLyoqXG4gKiBAcGFyYW0ge01hcDxzdHJpbmcsc3RyaW5nPn0gbVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgbWFwVG9TdHlsZVN0cmluZyA9IG0gPT4gbWFwLm1hcChtLCAodmFsdWUsIGtleSkgPT4gYCR7a2V5fToke3ZhbHVlfTtgKS5qb2luKCcnKVxuXG4vKipcbiAqIEB0b2RvIHNob3VsZCBhbHdheXMgcXVlcnkgb24gYSBkb20gZWxlbWVudFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR8U2hhZG93Um9vdH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeVxuICogQHJldHVybiB7SFRNTEVsZW1lbnQgfCBudWxsfVxuICovXG5leHBvcnQgY29uc3QgcXVlcnlTZWxlY3RvciA9IChlbCwgcXVlcnkpID0+IGVsLnF1ZXJ5U2VsZWN0b3IocXVlcnkpXG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudHxTaGFkb3dSb290fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5XG4gKiBAcmV0dXJuIHtOb2RlTGlzdE9mPEhUTUxFbGVtZW50Pn1cbiAqL1xuZXhwb3J0IGNvbnN0IHF1ZXJ5U2VsZWN0b3JBbGwgPSAoZWwsIHF1ZXJ5KSA9PiBlbC5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBnZXRFbGVtZW50QnlJZCA9IGlkID0+IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2MuZ2V0RWxlbWVudEJ5SWQoaWQpKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAqL1xuY29uc3QgX3BhcnNlID0gaHRtbCA9PiBkb21QYXJzZXIucGFyc2VGcm9tU3RyaW5nKGA8aHRtbD48Ym9keT4ke2h0bWx9PC9ib2R5PjwvaHRtbD5gLCAndGV4dC9odG1sJykuYm9keVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sXG4gKiBAcmV0dXJuIHtEb2N1bWVudEZyYWdtZW50fVxuICovXG5leHBvcnQgY29uc3QgcGFyc2VGcmFnbWVudCA9IGh0bWwgPT4gZnJhZ21lbnQoLyoqIEB0eXBlIHthbnl9ICovIChfcGFyc2UoaHRtbCkuY2hpbGROb2RlcykpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGh0bWxcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3QgcGFyc2VFbGVtZW50ID0gaHRtbCA9PiAvKiogQHR5cGUgSFRNTEVsZW1lbnQgKi8gKF9wYXJzZShodG1sKS5maXJzdEVsZW1lbnRDaGlsZClcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBvbGRFbFxuICogQHBhcmFtIHtIVE1MRWxlbWVudHxEb2N1bWVudEZyYWdtZW50fSBuZXdFbFxuICovXG5leHBvcnQgY29uc3QgcmVwbGFjZVdpdGggPSAob2xkRWwsIG5ld0VsKSA9PiBvbGRFbC5yZXBsYWNlV2l0aChuZXdFbClcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBwYXJlbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge05vZGV8bnVsbH0gcmVmXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IGluc2VydEJlZm9yZSA9IChwYXJlbnQsIGVsLCByZWYpID0+IHBhcmVudC5pbnNlcnRCZWZvcmUoZWwsIHJlZilcblxuLyoqXG4gKiBAcGFyYW0ge05vZGV9IHBhcmVudFxuICogQHBhcmFtIHtOb2RlfSBjaGlsZFxuICogQHJldHVybiB7Tm9kZX1cbiAqL1xuZXhwb3J0IGNvbnN0IGFwcGVuZENoaWxkID0gKHBhcmVudCwgY2hpbGQpID0+IHBhcmVudC5hcHBlbmRDaGlsZChjaGlsZClcblxuZXhwb3J0IGNvbnN0IEVMRU1FTlRfTk9ERSA9IGRvYy5FTEVNRU5UX05PREVcbmV4cG9ydCBjb25zdCBURVhUX05PREUgPSBkb2MuVEVYVF9OT0RFXG5leHBvcnQgY29uc3QgQ0RBVEFfU0VDVElPTl9OT0RFID0gZG9jLkNEQVRBX1NFQ1RJT05fTk9ERVxuZXhwb3J0IGNvbnN0IENPTU1FTlRfTk9ERSA9IGRvYy5DT01NRU5UX05PREVcbmV4cG9ydCBjb25zdCBET0NVTUVOVF9OT0RFID0gZG9jLkRPQ1VNRU5UX05PREVcbmV4cG9ydCBjb25zdCBET0NVTUVOVF9UWVBFX05PREUgPSBkb2MuRE9DVU1FTlRfVFlQRV9OT0RFXG5leHBvcnQgY29uc3QgRE9DVU1FTlRfRlJBR01FTlRfTk9ERSA9IGRvYy5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFXG5cbi8qKlxuICogQHR5cGUgeyQuU2NoZW1hPE5vZGU+fVxuICovXG5leHBvcnQgY29uc3QgJG5vZGUgPSAkLiRjdXN0b20oZWwgPT4gZWwubm9kZVR5cGUgPT09IERPQ1VNRU5UX05PREUpXG5cbi8qKlxuICogQHBhcmFtIHthbnl9IG5vZGVcbiAqIEBwYXJhbSB7bnVtYmVyfSB0eXBlXG4gKi9cbmV4cG9ydCBjb25zdCBjaGVja05vZGVUeXBlID0gKG5vZGUsIHR5cGUpID0+IG5vZGUubm9kZVR5cGUgPT09IHR5cGVcblxuLyoqXG4gKiBAcGFyYW0ge05vZGV9IHBhcmVudFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gY2hpbGRcbiAqL1xuZXhwb3J0IGNvbnN0IGlzUGFyZW50T2YgPSAocGFyZW50LCBjaGlsZCkgPT4ge1xuICBsZXQgcCA9IGNoaWxkLnBhcmVudE5vZGVcbiAgd2hpbGUgKHAgJiYgcCAhPT0gcGFyZW50KSB7XG4gICAgcCA9IHAucGFyZW50Tm9kZVxuICB9XG4gIHJldHVybiBwID09PSBwYXJlbnRcbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG4iLCAiLyoqXG4gKiBKU09OIHV0aWxpdHkgZnVuY3Rpb25zLlxuICpcbiAqIEBtb2R1bGUganNvblxuICovXG5cbi8qKlxuICogVHJhbnNmb3JtIEphdmFTY3JpcHQgb2JqZWN0IHRvIEpTT04uXG4gKlxuICogQHBhcmFtIHthbnl9IG9iamVjdFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3Qgc3RyaW5naWZ5ID0gSlNPTi5zdHJpbmdpZnlcblxuLyoqXG4gKiBQYXJzZSBKU09OIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30ganNvblxuICogQHJldHVybiB7YW55fVxuICovXG5leHBvcnQgY29uc3QgcGFyc2UgPSBKU09OLnBhcnNlXG4iLCAiLyoqXG4gKiBVdGlsaXR5IG1vZHVsZSB0byB3b3JrIHdpdGggRWNtYVNjcmlwdCBTeW1ib2xzLlxuICpcbiAqIEBtb2R1bGUgc3ltYm9sXG4gKi9cblxuLyoqXG4gKiBSZXR1cm4gZnJlc2ggc3ltYm9sLlxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gU3ltYm9sXG5cbi8qKlxuICogQHBhcmFtIHthbnl9IHNcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBpc1N5bWJvbCA9IHMgPT4gdHlwZW9mIHMgPT09ICdzeW1ib2wnXG4iLCAiaW1wb3J0ICogYXMgc3ltYm9sIGZyb20gJy4vc3ltYm9sLmpzJ1xuaW1wb3J0ICogYXMgdGltZSBmcm9tICcuL3RpbWUuanMnXG5pbXBvcnQgKiBhcyBlbnYgZnJvbSAnLi9lbnZpcm9ubWVudC5qcydcbmltcG9ydCAqIGFzIGZ1bmMgZnJvbSAnLi9mdW5jdGlvbi5qcydcbmltcG9ydCAqIGFzIGpzb24gZnJvbSAnLi9qc29uLmpzJ1xuXG5leHBvcnQgY29uc3QgQk9MRCA9IHN5bWJvbC5jcmVhdGUoKVxuZXhwb3J0IGNvbnN0IFVOQk9MRCA9IHN5bWJvbC5jcmVhdGUoKVxuZXhwb3J0IGNvbnN0IEJMVUUgPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBHUkVZID0gc3ltYm9sLmNyZWF0ZSgpXG5leHBvcnQgY29uc3QgR1JFRU4gPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBSRUQgPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBQVVJQTEUgPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBPUkFOR0UgPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBVTkNPTE9SID0gc3ltYm9sLmNyZWF0ZSgpXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHVuZGVmaW5lZHxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXJ8ZnVuY3Rpb24oKTphbnk+fSBhcmdzXG4gKiBAcmV0dXJuIHtBcnJheTxzdHJpbmd8b2JqZWN0fG51bWJlcnx1bmRlZmluZWQ+fVxuICovXG5leHBvcnQgY29uc3QgY29tcHV0ZU5vQ29sb3JMb2dnaW5nQXJncyA9IGFyZ3MgPT4ge1xuICBpZiAoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXT8uY29uc3RydWN0b3IgPT09IEZ1bmN0aW9uKSB7XG4gICAgYXJncyA9IC8qKiBAdHlwZSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gKi8gKC8qKiBAdHlwZSB7W2Z1bmN0aW9uXX0gKi8gKGFyZ3MpWzBdKCkpXG4gIH1cbiAgY29uc3Qgc3RyQnVpbGRlciA9IFtdXG4gIGNvbnN0IGxvZ0FyZ3MgPSBbXVxuICAvLyB0cnkgd2l0aCBmb3JtYXR0aW5nIHVudGlsIHdlIGZpbmQgc29tZXRoaW5nIHVuc3VwcG9ydGVkXG4gIGxldCBpID0gMFxuICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcmcgPSBhcmdzW2ldXG4gICAgaWYgKGFyZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBicmVha1xuICAgIH0gZWxzZSBpZiAoYXJnLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgfHwgYXJnLmNvbnN0cnVjdG9yID09PSBOdW1iZXIpIHtcbiAgICAgIHN0ckJ1aWxkZXIucHVzaChhcmcpXG4gICAgfSBlbHNlIGlmIChhcmcuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgaWYgKGkgPiAwKSB7XG4gICAgLy8gY3JlYXRlIGxvZ0FyZ3Mgd2l0aCB3aGF0IHdlIGhhdmUgc28gZmFyXG4gICAgbG9nQXJncy5wdXNoKHN0ckJ1aWxkZXIuam9pbignJykpXG4gIH1cbiAgLy8gYXBwZW5kIHRoZSByZXN0XG4gIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IGFyZ3NbaV1cbiAgICBpZiAoIShhcmcgaW5zdGFuY2VvZiBTeW1ib2wpKSB7XG4gICAgICBsb2dBcmdzLnB1c2goYXJnKVxuICAgIH1cbiAgfVxuICByZXR1cm4gbG9nQXJnc1xufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuY29uc3QgbG9nZ2luZ0NvbG9ycyA9IFtHUkVFTiwgUFVSUExFLCBPUkFOR0UsIEJMVUVdXG5sZXQgbmV4dENvbG9yID0gMFxubGV0IGxhc3RMb2dnaW5nVGltZSA9IHRpbWUuZ2V0VW5peFRpbWUoKVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQHBhcmFtIHtmdW5jdGlvbiguLi5hbnkpOnZvaWR9IF9wcmludFxuICogQHBhcmFtIHtzdHJpbmd9IG1vZHVsZU5hbWVcbiAqIEByZXR1cm4ge2Z1bmN0aW9uKC4uLmFueSk6dm9pZH1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZU1vZHVsZUxvZ2dlciA9IChfcHJpbnQsIG1vZHVsZU5hbWUpID0+IHtcbiAgY29uc3QgY29sb3IgPSBsb2dnaW5nQ29sb3JzW25leHRDb2xvcl1cbiAgY29uc3QgZGVidWdSZWdleFZhciA9IGVudi5nZXRWYXJpYWJsZSgnbG9nJylcbiAgY29uc3QgZG9Mb2dnaW5nID0gZGVidWdSZWdleFZhciAhPT0gbnVsbCAmJlxuICAgIChkZWJ1Z1JlZ2V4VmFyID09PSAnKicgfHwgZGVidWdSZWdleFZhciA9PT0gJ3RydWUnIHx8XG4gICAgICBuZXcgUmVnRXhwKGRlYnVnUmVnZXhWYXIsICdnaScpLnRlc3QobW9kdWxlTmFtZSkpXG4gIG5leHRDb2xvciA9IChuZXh0Q29sb3IgKyAxKSAlIGxvZ2dpbmdDb2xvcnMubGVuZ3RoXG4gIG1vZHVsZU5hbWUgKz0gJzogJ1xuICByZXR1cm4gIWRvTG9nZ2luZ1xuICAgID8gZnVuYy5ub3BcbiAgICA6ICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSAmJiBhcmdzWzBdPy5jb25zdHJ1Y3RvciA9PT0gRnVuY3Rpb24pIHtcbiAgICAgICAgICBhcmdzID0gYXJnc1swXSgpXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGltZU5vdyA9IHRpbWUuZ2V0VW5peFRpbWUoKVxuICAgICAgICBjb25zdCB0aW1lRGlmZiA9IHRpbWVOb3cgLSBsYXN0TG9nZ2luZ1RpbWVcbiAgICAgICAgbGFzdExvZ2dpbmdUaW1lID0gdGltZU5vd1xuICAgICAgICBfcHJpbnQoXG4gICAgICAgICAgY29sb3IsXG4gICAgICAgICAgbW9kdWxlTmFtZSxcbiAgICAgICAgICBVTkNPTE9SLFxuICAgICAgICAgIC4uLmFyZ3MubWFwKChhcmcpID0+IHtcbiAgICAgICAgICAgIGlmIChhcmcgIT0gbnVsbCAmJiBhcmcuY29uc3RydWN0b3IgPT09IFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgICAgICAgYXJnID0gQXJyYXkuZnJvbShhcmcpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB0ID0gdHlwZW9mIGFyZ1xuICAgICAgICAgICAgc3dpdGNoICh0KSB7XG4gICAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyZ1xuICAgICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGpzb24uc3RyaW5naWZ5KGFyZylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLFxuICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgICcgKycgKyB0aW1lRGlmZiArICdtcydcbiAgICAgICAgKVxuICAgICAgfVxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cbiIsICIvKipcbiAqIElzb21vcnBoaWMgbG9nZ2luZyBtb2R1bGUgd2l0aCBzdXBwb3J0IGZvciBjb2xvcnMhXG4gKlxuICogQG1vZHVsZSBsb2dnaW5nXG4gKi9cblxuaW1wb3J0ICogYXMgZW52IGZyb20gJy4vZW52aXJvbm1lbnQuanMnXG5pbXBvcnQgKiBhcyBzZXQgZnJvbSAnLi9zZXQuanMnXG5pbXBvcnQgKiBhcyBwYWlyIGZyb20gJy4vcGFpci5qcydcbmltcG9ydCAqIGFzIGRvbSBmcm9tICcuL2RvbS5qcydcbmltcG9ydCAqIGFzIGpzb24gZnJvbSAnLi9qc29uLmpzJ1xuaW1wb3J0ICogYXMgbWFwIGZyb20gJy4vbWFwLmpzJ1xuaW1wb3J0ICogYXMgZXZlbnRsb29wIGZyb20gJy4vZXZlbnRsb29wLmpzJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5pbXBvcnQgKiBhcyBjb21tb24gZnJvbSAnLi9sb2dnaW5nLmNvbW1vbi5qcydcblxuZXhwb3J0IHsgQk9MRCwgVU5CT0xELCBCTFVFLCBHUkVZLCBHUkVFTiwgUkVELCBQVVJQTEUsIE9SQU5HRSwgVU5DT0xPUiB9IGZyb20gJy4vbG9nZ2luZy5jb21tb24uanMnXG5cbi8qKlxuICogQHR5cGUge09iamVjdDxTeW1ib2wscGFpci5QYWlyPHN0cmluZyxzdHJpbmc+Pn1cbiAqL1xuY29uc3QgX2Jyb3dzZXJTdHlsZU1hcCA9IHtcbiAgW2NvbW1vbi5CT0xEXTogcGFpci5jcmVhdGUoJ2ZvbnQtd2VpZ2h0JywgJ2JvbGQnKSxcbiAgW2NvbW1vbi5VTkJPTERdOiBwYWlyLmNyZWF0ZSgnZm9udC13ZWlnaHQnLCAnbm9ybWFsJyksXG4gIFtjb21tb24uQkxVRV06IHBhaXIuY3JlYXRlKCdjb2xvcicsICdibHVlJyksXG4gIFtjb21tb24uR1JFRU5dOiBwYWlyLmNyZWF0ZSgnY29sb3InLCAnZ3JlZW4nKSxcbiAgW2NvbW1vbi5HUkVZXTogcGFpci5jcmVhdGUoJ2NvbG9yJywgJ2dyZXknKSxcbiAgW2NvbW1vbi5SRURdOiBwYWlyLmNyZWF0ZSgnY29sb3InLCAncmVkJyksXG4gIFtjb21tb24uUFVSUExFXTogcGFpci5jcmVhdGUoJ2NvbG9yJywgJ3B1cnBsZScpLFxuICBbY29tbW9uLk9SQU5HRV06IHBhaXIuY3JlYXRlKCdjb2xvcicsICdvcmFuZ2UnKSwgLy8gbm90IHdlbGwgc3VwcG9ydGVkIGluIGNocm9tZSB3aGVuIGRlYnVnZ2luZyBub2RlIHdpdGggaW5zcGVjdG9yIC0gVE9ETzogZGVwcmVjYXRlXG4gIFtjb21tb24uVU5DT0xPUl06IHBhaXIuY3JlYXRlKCdjb2xvcicsICdibGFjaycpXG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXJ8ZnVuY3Rpb24oKTphbnk+fSBhcmdzXG4gKiBAcmV0dXJuIHtBcnJheTxzdHJpbmd8b2JqZWN0fG51bWJlcj59XG4gKi9cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuY29uc3QgY29tcHV0ZUJyb3dzZXJMb2dnaW5nQXJncyA9IChhcmdzKSA9PiB7XG4gIGlmIChhcmdzLmxlbmd0aCA9PT0gMSAmJiBhcmdzWzBdPy5jb25zdHJ1Y3RvciA9PT0gRnVuY3Rpb24pIHtcbiAgICBhcmdzID0gLyoqIEB0eXBlIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSAqLyAoLyoqIEB0eXBlIHtbZnVuY3Rpb25dfSAqLyAoYXJncylbMF0oKSlcbiAgfVxuICBjb25zdCBzdHJCdWlsZGVyID0gW11cbiAgY29uc3Qgc3R5bGVzID0gW11cbiAgY29uc3QgY3VycmVudFN0eWxlID0gbWFwLmNyZWF0ZSgpXG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXk8c3RyaW5nfE9iamVjdHxudW1iZXI+fVxuICAgKi9cbiAgbGV0IGxvZ0FyZ3MgPSBbXVxuICAvLyB0cnkgd2l0aCBmb3JtYXR0aW5nIHVudGlsIHdlIGZpbmQgc29tZXRoaW5nIHVuc3VwcG9ydGVkXG4gIGxldCBpID0gMFxuICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcmcgPSBhcmdzW2ldXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IHN0eWxlID0gX2Jyb3dzZXJTdHlsZU1hcFthcmddXG4gICAgaWYgKHN0eWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGN1cnJlbnRTdHlsZS5zZXQoc3R5bGUubGVmdCwgc3R5bGUucmlnaHQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChhcmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgaWYgKGFyZy5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nIHx8IGFyZy5jb25zdHJ1Y3RvciA9PT0gTnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZG9tLm1hcFRvU3R5bGVTdHJpbmcoY3VycmVudFN0eWxlKVxuICAgICAgICBpZiAoaSA+IDAgfHwgc3R5bGUubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHN0ckJ1aWxkZXIucHVzaCgnJWMnICsgYXJnKVxuICAgICAgICAgIHN0eWxlcy5wdXNoKHN0eWxlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ckJ1aWxkZXIucHVzaChhcmcpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChpID4gMCkge1xuICAgIC8vIGNyZWF0ZSBsb2dBcmdzIHdpdGggd2hhdCB3ZSBoYXZlIHNvIGZhclxuICAgIGxvZ0FyZ3MgPSBzdHlsZXNcbiAgICBsb2dBcmdzLnVuc2hpZnQoc3RyQnVpbGRlci5qb2luKCcnKSlcbiAgfVxuICAvLyBhcHBlbmQgdGhlIHJlc3RcbiAgZm9yICg7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXJnID0gYXJnc1tpXVxuICAgIGlmICghKGFyZyBpbnN0YW5jZW9mIFN5bWJvbCkpIHtcbiAgICAgIGxvZ0FyZ3MucHVzaChhcmcpXG4gICAgfVxuICB9XG4gIHJldHVybiBsb2dBcmdzXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmNvbnN0IGNvbXB1dGVMb2dnaW5nQXJncyA9IGVudi5zdXBwb3J0c0NvbG9yXG4gID8gY29tcHV0ZUJyb3dzZXJMb2dnaW5nQXJnc1xuICA6IGNvbW1vbi5jb21wdXRlTm9Db2xvckxvZ2dpbmdBcmdzXG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gYXJnc1xuICovXG5leHBvcnQgY29uc3QgcHJpbnQgPSAoLi4uYXJncykgPT4ge1xuICBjb25zb2xlLmxvZyguLi5jb21wdXRlTG9nZ2luZ0FyZ3MoYXJncykpXG4gIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gIHZjb25zb2xlcy5mb3JFYWNoKCh2YykgPT4gdmMucHJpbnQoYXJncykpXG59XG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAqL1xuZXhwb3J0IGNvbnN0IHdhcm4gPSAoLi4uYXJncykgPT4ge1xuICBjb25zb2xlLndhcm4oLi4uY29tcHV0ZUxvZ2dpbmdBcmdzKGFyZ3MpKVxuICBhcmdzLnVuc2hpZnQoY29tbW9uLk9SQU5HRSlcbiAgdmNvbnNvbGVzLmZvckVhY2goKHZjKSA9PiB2Yy5wcmludChhcmdzKSlcbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogQHBhcmFtIHtFcnJvcn0gZXJyXG4gKi9cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuZXhwb3J0IGNvbnN0IHByaW50RXJyb3IgPSAoZXJyKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoZXJyKVxuICB2Y29uc29sZXMuZm9yRWFjaCgodmMpID0+IHZjLnByaW50RXJyb3IoZXJyKSlcbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHVybCBpbWFnZSBsb2NhdGlvblxuICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCBoZWlnaHQgb2YgdGhlIGltYWdlIGluIHBpeGVsXG4gKi9cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuZXhwb3J0IGNvbnN0IHByaW50SW1nID0gKHVybCwgaGVpZ2h0KSA9PiB7XG4gIGlmIChlbnYuaXNCcm93c2VyKSB7XG4gICAgY29uc29sZS5sb2coXG4gICAgICAnJWMgICAgICAgICAgICAgICAgICAgICAgJyxcbiAgICAgIGBmb250LXNpemU6ICR7aGVpZ2h0fXB4OyBiYWNrZ3JvdW5kLXNpemU6IGNvbnRhaW47IGJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7IGJhY2tncm91bmQtaW1hZ2U6IHVybCgke3VybH0pYFxuICAgIClcbiAgICAvLyBjb25zb2xlLmxvZygnJWMgICAgICAgICAgICAgICAgJywgYGZvbnQtc2l6ZTogJHtoZWlnaHR9eDsgYmFja2dyb3VuZDogdXJsKCR7dXJsfSkgbm8tcmVwZWF0O2ApXG4gIH1cbiAgdmNvbnNvbGVzLmZvckVhY2goKHZjKSA9PiB2Yy5wcmludEltZyh1cmwsIGhlaWdodCkpXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBiYXNlNjRcbiAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IHByaW50SW1nQmFzZTY0ID0gKGJhc2U2NCwgaGVpZ2h0KSA9PlxuICBwcmludEltZyhgZGF0YTppbWFnZS9naWY7YmFzZTY0LCR7YmFzZTY0fWAsIGhlaWdodClcblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAqL1xuZXhwb3J0IGNvbnN0IGdyb3VwID0gKC4uLmFyZ3MpID0+IHtcbiAgY29uc29sZS5ncm91cCguLi5jb21wdXRlTG9nZ2luZ0FyZ3MoYXJncykpXG4gIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gIHZjb25zb2xlcy5mb3JFYWNoKCh2YykgPT4gdmMuZ3JvdXAoYXJncykpXG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSBhcmdzXG4gKi9cbmV4cG9ydCBjb25zdCBncm91cENvbGxhcHNlZCA9ICguLi5hcmdzKSA9PiB7XG4gIGNvbnNvbGUuZ3JvdXBDb2xsYXBzZWQoLi4uY29tcHV0ZUxvZ2dpbmdBcmdzKGFyZ3MpKVxuICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICB2Y29uc29sZXMuZm9yRWFjaCgodmMpID0+IHZjLmdyb3VwQ29sbGFwc2VkKGFyZ3MpKVxufVxuXG5leHBvcnQgY29uc3QgZ3JvdXBFbmQgPSAoKSA9PiB7XG4gIGNvbnNvbGUuZ3JvdXBFbmQoKVxuICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICB2Y29uc29sZXMuZm9yRWFjaCgodmMpID0+IHZjLmdyb3VwRW5kKCkpXG59XG5cbi8qKlxuICogQHBhcmFtIHtmdW5jdGlvbigpOk5vZGV9IGNyZWF0ZU5vZGVcbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IHByaW50RG9tID0gKGNyZWF0ZU5vZGUpID0+XG4gIHZjb25zb2xlcy5mb3JFYWNoKCh2YykgPT4gdmMucHJpbnREb20oY3JlYXRlTm9kZSgpKSlcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBjYW52YXNcbiAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcbiAqL1xuLyogYzggaWdub3JlIG5leHQgMiAqL1xuZXhwb3J0IGNvbnN0IHByaW50Q2FudmFzID0gKGNhbnZhcywgaGVpZ2h0KSA9PlxuICBwcmludEltZyhjYW52YXMudG9EYXRhVVJMKCksIGhlaWdodClcblxuZXhwb3J0IGNvbnN0IHZjb25zb2xlcyA9IHNldC5jcmVhdGUoKVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gYXJnc1xuICogQHJldHVybiB7QXJyYXk8RWxlbWVudD59XG4gKi9cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuY29uc3QgX2NvbXB1dGVMaW5lU3BhbnMgPSAoYXJncykgPT4ge1xuICBjb25zdCBzcGFucyA9IFtdXG4gIGNvbnN0IGN1cnJlbnRTdHlsZSA9IG5ldyBNYXAoKVxuICAvLyB0cnkgd2l0aCBmb3JtYXR0aW5nIHVudGlsIHdlIGZpbmQgc29tZXRoaW5nIHVuc3VwcG9ydGVkXG4gIGxldCBpID0gMFxuICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgYXJnID0gYXJnc1tpXVxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBzdHlsZSA9IF9icm93c2VyU3R5bGVNYXBbYXJnXVxuICAgIGlmIChzdHlsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjdXJyZW50U3R5bGUuc2V0KHN0eWxlLmxlZnQsIHN0eWxlLnJpZ2h0KVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYXJnID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXJnID0gJ3VuZGVmaW5lZCAnXG4gICAgICB9XG4gICAgICBpZiAoYXJnLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgfHwgYXJnLmNvbnN0cnVjdG9yID09PSBOdW1iZXIpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBzcGFuID0gZG9tLmVsZW1lbnQoJ3NwYW4nLCBbXG4gICAgICAgICAgcGFpci5jcmVhdGUoJ3N0eWxlJywgZG9tLm1hcFRvU3R5bGVTdHJpbmcoY3VycmVudFN0eWxlKSlcbiAgICAgICAgXSwgW2RvbS50ZXh0KGFyZy50b1N0cmluZygpKV0pXG4gICAgICAgIGlmIChzcGFuLmlubmVySFRNTCA9PT0gJycpIHtcbiAgICAgICAgICBzcGFuLmlubmVySFRNTCA9ICcmbmJzcDsnXG4gICAgICAgIH1cbiAgICAgICAgc3BhbnMucHVzaChzcGFuKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy8gYXBwZW5kIHRoZSByZXN0XG4gIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBjb250ZW50ID0gYXJnc1tpXVxuICAgIGlmICghKGNvbnRlbnQgaW5zdGFuY2VvZiBTeW1ib2wpKSB7XG4gICAgICBpZiAoY29udGVudC5jb25zdHJ1Y3RvciAhPT0gU3RyaW5nICYmIGNvbnRlbnQuY29uc3RydWN0b3IgIT09IE51bWJlcikge1xuICAgICAgICBjb250ZW50ID0gJyAnICsganNvbi5zdHJpbmdpZnkoY29udGVudCkgKyAnICdcbiAgICAgIH1cbiAgICAgIHNwYW5zLnB1c2goXG4gICAgICAgIGRvbS5lbGVtZW50KCdzcGFuJywgW10sIFtkb20udGV4dCgvKiogQHR5cGUge3N0cmluZ30gKi8gKGNvbnRlbnQpKV0pXG4gICAgICApXG4gICAgfVxuICB9XG4gIHJldHVybiBzcGFuc1xufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuY29uc3QgbGluZVN0eWxlID1cbiAgJ2ZvbnQtZmFtaWx5Om1vbm9zcGFjZTtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZTJlMmUyO3BhZGRpbmc6MnB4OydcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG5leHBvcnQgY2xhc3MgVkNvbnNvbGUge1xuICAvKipcbiAgICogQHBhcmFtIHtFbGVtZW50fSBkb21cbiAgICovXG4gIGNvbnN0cnVjdG9yIChkb20pIHtcbiAgICB0aGlzLmRvbSA9IGRvbVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtFbGVtZW50fVxuICAgICAqL1xuICAgIHRoaXMuY2NvbnRhaW5lciA9IHRoaXMuZG9tXG4gICAgdGhpcy5kZXB0aCA9IDBcbiAgICB2Y29uc29sZXMuYWRkKHRoaXMpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSBhcmdzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gY29sbGFwc2VkXG4gICAqL1xuICBncm91cCAoYXJncywgY29sbGFwc2VkID0gZmFsc2UpIHtcbiAgICBldmVudGxvb3AuZW5xdWV1ZSgoKSA9PiB7XG4gICAgICBjb25zdCB0cmlhbmdsZURvd24gPSBkb20uZWxlbWVudCgnc3BhbicsIFtcbiAgICAgICAgcGFpci5jcmVhdGUoJ2hpZGRlbicsIGNvbGxhcHNlZCksXG4gICAgICAgIHBhaXIuY3JlYXRlKCdzdHlsZScsICdjb2xvcjpncmV5O2ZvbnQtc2l6ZToxMjAlOycpXG4gICAgICBdLCBbZG9tLnRleHQoJ1x1MjVCQycpXSlcbiAgICAgIGNvbnN0IHRyaWFuZ2xlUmlnaHQgPSBkb20uZWxlbWVudCgnc3BhbicsIFtcbiAgICAgICAgcGFpci5jcmVhdGUoJ2hpZGRlbicsICFjb2xsYXBzZWQpLFxuICAgICAgICBwYWlyLmNyZWF0ZSgnc3R5bGUnLCAnY29sb3I6Z3JleTtmb250LXNpemU6MTI1JTsnKVxuICAgICAgXSwgW2RvbS50ZXh0KCdcdTI1QjYnKV0pXG4gICAgICBjb25zdCBjb250ZW50ID0gZG9tLmVsZW1lbnQoXG4gICAgICAgICdkaXYnLFxuICAgICAgICBbcGFpci5jcmVhdGUoXG4gICAgICAgICAgJ3N0eWxlJyxcbiAgICAgICAgICBgJHtsaW5lU3R5bGV9O3BhZGRpbmctbGVmdDoke3RoaXMuZGVwdGggKiAxMH1weGBcbiAgICAgICAgKV0sXG4gICAgICAgIFt0cmlhbmdsZURvd24sIHRyaWFuZ2xlUmlnaHQsIGRvbS50ZXh0KCcgJyldLmNvbmNhdChcbiAgICAgICAgICBfY29tcHV0ZUxpbmVTcGFucyhhcmdzKVxuICAgICAgICApXG4gICAgICApXG4gICAgICBjb25zdCBuZXh0Q29udGFpbmVyID0gZG9tLmVsZW1lbnQoJ2RpdicsIFtcbiAgICAgICAgcGFpci5jcmVhdGUoJ2hpZGRlbicsIGNvbGxhcHNlZClcbiAgICAgIF0pXG4gICAgICBjb25zdCBuZXh0TGluZSA9IGRvbS5lbGVtZW50KCdkaXYnLCBbXSwgW2NvbnRlbnQsIG5leHRDb250YWluZXJdKVxuICAgICAgZG9tLmFwcGVuZCh0aGlzLmNjb250YWluZXIsIFtuZXh0TGluZV0pXG4gICAgICB0aGlzLmNjb250YWluZXIgPSBuZXh0Q29udGFpbmVyXG4gICAgICB0aGlzLmRlcHRoKytcbiAgICAgIC8vIHdoZW4gaGVhZGVyIGlzIGNsaWNrZWQsIGNvbGxhcHNlL3VuY29sbGFwc2UgY29udGFpbmVyXG4gICAgICBkb20uYWRkRXZlbnRMaXN0ZW5lcihjb250ZW50LCAnY2xpY2snLCAoX2V2ZW50KSA9PiB7XG4gICAgICAgIG5leHRDb250YWluZXIudG9nZ2xlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgICAgICB0cmlhbmdsZURvd24udG9nZ2xlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgICAgICB0cmlhbmdsZVJpZ2h0LnRvZ2dsZUF0dHJpYnV0ZSgnaGlkZGVuJylcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAgICovXG4gIGdyb3VwQ29sbGFwc2VkIChhcmdzKSB7XG4gICAgdGhpcy5ncm91cChhcmdzLCB0cnVlKVxuICB9XG5cbiAgZ3JvdXBFbmQgKCkge1xuICAgIGV2ZW50bG9vcC5lbnF1ZXVlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmRlcHRoID4gMCkge1xuICAgICAgICB0aGlzLmRlcHRoLS1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLmNjb250YWluZXIgPSB0aGlzLmNjb250YWluZXIucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAgICovXG4gIHByaW50IChhcmdzKSB7XG4gICAgZXZlbnRsb29wLmVucXVldWUoKCkgPT4ge1xuICAgICAgZG9tLmFwcGVuZCh0aGlzLmNjb250YWluZXIsIFtcbiAgICAgICAgZG9tLmVsZW1lbnQoJ2RpdicsIFtcbiAgICAgICAgICBwYWlyLmNyZWF0ZShcbiAgICAgICAgICAgICdzdHlsZScsXG4gICAgICAgICAgICBgJHtsaW5lU3R5bGV9O3BhZGRpbmctbGVmdDoke3RoaXMuZGVwdGggKiAxMH1weGBcbiAgICAgICAgICApXG4gICAgICAgIF0sIF9jb21wdXRlTGluZVNwYW5zKGFyZ3MpKVxuICAgICAgXSlcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RXJyb3J9IGVyclxuICAgKi9cbiAgcHJpbnRFcnJvciAoZXJyKSB7XG4gICAgdGhpcy5wcmludChbY29tbW9uLlJFRCwgY29tbW9uLkJPTEQsIGVyci50b1N0cmluZygpXSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcbiAgICovXG4gIHByaW50SW1nICh1cmwsIGhlaWdodCkge1xuICAgIGV2ZW50bG9vcC5lbnF1ZXVlKCgpID0+IHtcbiAgICAgIGRvbS5hcHBlbmQodGhpcy5jY29udGFpbmVyLCBbXG4gICAgICAgIGRvbS5lbGVtZW50KCdpbWcnLCBbXG4gICAgICAgICAgcGFpci5jcmVhdGUoJ3NyYycsIHVybCksXG4gICAgICAgICAgcGFpci5jcmVhdGUoJ2hlaWdodCcsIGAke21hdGgucm91bmQoaGVpZ2h0ICogMS41KX1weGApXG4gICAgICAgIF0pXG4gICAgICBdKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlXG4gICAqL1xuICBwcmludERvbSAobm9kZSkge1xuICAgIGV2ZW50bG9vcC5lbnF1ZXVlKCgpID0+IHtcbiAgICAgIGRvbS5hcHBlbmQodGhpcy5jY29udGFpbmVyLCBbbm9kZV0pXG4gICAgfSlcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIGV2ZW50bG9vcC5lbnF1ZXVlKCgpID0+IHtcbiAgICAgIHZjb25zb2xlcy5kZWxldGUodGhpcylcbiAgICB9KVxuICB9XG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7RWxlbWVudH0gZG9tXG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgY3JlYXRlVkNvbnNvbGUgPSAoZG9tKSA9PiBuZXcgVkNvbnNvbGUoZG9tKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBtb2R1bGVOYW1lXG4gKiBAcmV0dXJuIHtmdW5jdGlvbiguLi5hbnkpOnZvaWR9XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVNb2R1bGVMb2dnZXIgPSAobW9kdWxlTmFtZSkgPT4gY29tbW9uLmNyZWF0ZU1vZHVsZUxvZ2dlcihwcmludCwgbW9kdWxlTmFtZSlcbiIsICIvKipcbiAqIFV0aWxpdHkgaGVscGVycyB0byB3b3JrIHdpdGggcHJvbWlzZXMuXG4gKlxuICogQG1vZHVsZSBwcm9taXNlXG4gKi9cblxuaW1wb3J0ICogYXMgdGltZSBmcm9tICcuL3RpbWUuanMnXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBjYWxsYmFjayBQcm9taXNlUmVzb2x2ZVxuICogQHBhcmFtIHtUfFByb21pc2VMaWtlPFQ+fSBbcmVzdWx0XVxuICovXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oUHJvbWlzZVJlc29sdmU8VD4sZnVuY3Rpb24oRXJyb3IpOnZvaWQpOmFueX0gZlxuICogQHJldHVybiB7UHJvbWlzZTxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9IGYgPT4gLyoqIEB0eXBlIHtQcm9taXNlPFQ+fSAqLyAobmV3IFByb21pc2UoZikpXG5cbi8qKlxuICogQHBhcmFtIHtmdW5jdGlvbihmdW5jdGlvbigpOnZvaWQsZnVuY3Rpb24oRXJyb3IpOnZvaWQpOnZvaWR9IGZcbiAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVFbXB0eSA9IGYgPT4gbmV3IFByb21pc2UoZilcblxuLyoqXG4gKiBgUHJvbWlzZS5hbGxgIHdhaXQgZm9yIGFsbCBwcm9taXNlcyBpbiB0aGUgYXJyYXkgdG8gcmVzb2x2ZSBhbmQgcmV0dXJuIHRoZSByZXN1bHRcbiAqIEB0ZW1wbGF0ZSB7dW5rbm93bltdIHwgW119IFBTXG4gKlxuICogQHBhcmFtIHtQU30gcHNcbiAqIEByZXR1cm4ge1Byb21pc2U8eyAtcmVhZG9ubHkgW1AgaW4ga2V5b2YgUFNdOiBBd2FpdGVkPFBTW1BdPiB9Pn1cbiAqL1xuZXhwb3J0IGNvbnN0IGFsbCA9IFByb21pc2UuYWxsLmJpbmQoUHJvbWlzZSlcblxuLyoqXG4gKiBAcGFyYW0ge0Vycm9yfSBbcmVhc29uXVxuICogQHJldHVybiB7UHJvbWlzZTxuZXZlcj59XG4gKi9cbmV4cG9ydCBjb25zdCByZWplY3QgPSByZWFzb24gPT4gUHJvbWlzZS5yZWplY3QocmVhc29uKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1R8dm9pZH0gcmVzXG4gKiBAcmV0dXJuIHtQcm9taXNlPFR8dm9pZD59XG4gKi9cbmV4cG9ydCBjb25zdCByZXNvbHZlID0gcmVzID0+IFByb21pc2UucmVzb2x2ZShyZXMpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7VH0gcmVzXG4gKiBAcmV0dXJuIHtQcm9taXNlPFQ+fVxuICovXG5leHBvcnQgY29uc3QgcmVzb2x2ZVdpdGggPSByZXMgPT4gUHJvbWlzZS5yZXNvbHZlKHJlcylcblxuLyoqXG4gKiBAdG9kbyBOZXh0IHZlcnNpb24sIHJlb3JkZXIgcGFyYW1ldGVyczogY2hlY2ssIFt0aW1lb3V0LCBbaW50ZXJ2YWxSZXNvbHV0aW9uXV1cbiAqIEBkZXByZWNhdGVkIHVzZSB1bnRpbEFzeW5jIGluc3RlYWRcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZW91dFxuICogQHBhcmFtIHtmdW5jdGlvbigpOmJvb2xlYW59IGNoZWNrXG4gKiBAcGFyYW0ge251bWJlcn0gW2ludGVydmFsUmVzb2x1dGlvbl1cbiAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gKi9cbmV4cG9ydCBjb25zdCB1bnRpbCA9ICh0aW1lb3V0LCBjaGVjaywgaW50ZXJ2YWxSZXNvbHV0aW9uID0gMTApID0+IGNyZWF0ZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gIGNvbnN0IHN0YXJ0VGltZSA9IHRpbWUuZ2V0VW5peFRpbWUoKVxuICBjb25zdCBoYXNUaW1lb3V0ID0gdGltZW91dCA+IDBcbiAgY29uc3QgdW50aWxJbnRlcnZhbCA9ICgpID0+IHtcbiAgICBpZiAoY2hlY2soKSkge1xuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbEhhbmRsZSlcbiAgICAgIHJlc29sdmUoKVxuICAgIH0gZWxzZSBpZiAoaGFzVGltZW91dCkge1xuICAgICAgLyogYzggaWdub3JlIGVsc2UgKi9cbiAgICAgIGlmICh0aW1lLmdldFVuaXhUaW1lKCkgLSBzdGFydFRpbWUgPiB0aW1lb3V0KSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGUpXG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1RpbWVvdXQnKSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY29uc3QgaW50ZXJ2YWxIYW5kbGUgPSBzZXRJbnRlcnZhbCh1bnRpbEludGVydmFsLCBpbnRlcnZhbFJlc29sdXRpb24pXG59KVxuXG4vKipcbiAqIEBwYXJhbSB7KCk9PlByb21pc2U8Ym9vbGVhbj58Ym9vbGVhbn0gY2hlY2tcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lb3V0XG4gKiBAcGFyYW0ge251bWJlcn0gaW50ZXJ2YWxSZXNvbHV0aW9uXG4gKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgY29uc3QgdW50aWxBc3luYyA9IGFzeW5jIChjaGVjaywgdGltZW91dCA9IDAsIGludGVydmFsUmVzb2x1dGlvbiA9IDEwKSA9PiB7XG4gIGNvbnN0IHN0YXJ0VGltZSA9IHRpbWUuZ2V0VW5peFRpbWUoKVxuICBjb25zdCBub1RpbWVvdXQgPSB0aW1lb3V0IDw9IDBcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVubW9kaWZpZWQtbG9vcC1jb25kaXRpb25cbiAgd2hpbGUgKG5vVGltZW91dCB8fCB0aW1lLmdldFVuaXhUaW1lKCkgLSBzdGFydFRpbWUgPD0gdGltZW91dCkge1xuICAgIGlmIChhd2FpdCBjaGVjaygpKSByZXR1cm5cbiAgICBhd2FpdCB3YWl0KGludGVydmFsUmVzb2x1dGlvbilcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ1RpbWVvdXQnKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lb3V0XG4gKiBAcmV0dXJuIHtQcm9taXNlPHVuZGVmaW5lZD59XG4gKi9cbmV4cG9ydCBjb25zdCB3YWl0ID0gdGltZW91dCA9PiBjcmVhdGUoKHJlc29sdmUsIF9yZWplY3QpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGltZW91dCkpXG5cbi8qKlxuICogQ2hlY2tzIGlmIGFuIG9iamVjdCBpcyBhIHByb21pc2UgdXNpbmcgZHVja3R5cGluZy5cbiAqXG4gKiBQcm9taXNlcyBhcmUgb2Z0ZW4gcG9seWZpbGxlZCwgc28gaXQgbWFrZXMgc2Vuc2UgdG8gYWRkIHNvbWUgYWRkaXRpb25hbCBndWFyYW50ZWVzIGlmIHRoZSB1c2VyIG9mIHRoaXNcbiAqIGxpYnJhcnkgaGFzIHNvbWUgaW5zYW5lIGVudmlyb25tZW50IHdoZXJlIGdsb2JhbCBQcm9taXNlIG9iamVjdHMgYXJlIG92ZXJ3cml0dGVuLlxuICpcbiAqIEBwYXJhbSB7YW55fSBwXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgaXNQcm9taXNlID0gcCA9PiBwIGluc3RhbmNlb2YgUHJvbWlzZSB8fCAocCAmJiBwLnRoZW4gJiYgcC5jYXRjaCAmJiBwLmZpbmFsbHkpXG4iLCAiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogSGVscGVycyBmb3IgY3Jvc3MtdGFiIGNvbW11bmljYXRpb24gdXNpbmcgYnJvYWRjYXN0Y2hhbm5lbCB3aXRoIExvY2FsU3RvcmFnZSBmYWxsYmFjay5cbiAqXG4gKiBgYGBqc1xuICogLy8gSW4gYnJvd3NlciB3aW5kb3cgQTpcbiAqIGJyb2FkY2FzdGNoYW5uZWwuc3Vic2NyaWJlKCdteSBldmVudHMnLCBkYXRhID0+IGNvbnNvbGUubG9nKGRhdGEpKVxuICogYnJvYWRjYXN0Y2hhbm5lbC5wdWJsaXNoKCdteSBldmVudHMnLCAnSGVsbG8gd29ybGQhJykgLy8gPT4gQTogJ0hlbGxvIHdvcmxkIScgZmlyZXMgc3luY2hyb25vdXNseSBpbiBzYW1lIHRhYlxuICpcbiAqIC8vIEluIGJyb3dzZXIgd2luZG93IEI6XG4gKiBicm9hZGNhc3RjaGFubmVsLnB1Ymxpc2goJ215IGV2ZW50cycsICdoZWxsbyBmcm9tIHRhYiBCJykgLy8gPT4gQTogJ2hlbGxvIGZyb20gdGFiIEInXG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlIGJyb2FkY2FzdGNoYW5uZWxcbiAqL1xuXG4vLyBAdG9kbyBiZWZvcmUgbmV4dCBtYWpvcjogdXNlIFVpbnQ4QXJyYXkgaW5zdGVhZCBhcyBidWZmZXIgb2JqZWN0XG5cbmltcG9ydCAqIGFzIG1hcCBmcm9tICcuL21hcC5qcydcbmltcG9ydCAqIGFzIHNldCBmcm9tICcuL3NldC5qcydcbmltcG9ydCAqIGFzIGJ1ZmZlciBmcm9tICcuL2J1ZmZlci5qcydcbmltcG9ydCAqIGFzIHN0b3JhZ2UgZnJvbSAnLi9zdG9yYWdlLmpzJ1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IENoYW5uZWxcbiAqIEBwcm9wZXJ0eSB7U2V0PGZ1bmN0aW9uKGFueSwgYW55KTphbnk+fSBDaGFubmVsLnN1YnNcbiAqIEBwcm9wZXJ0eSB7YW55fSBDaGFubmVsLmJjXG4gKi9cblxuLyoqXG4gKiBAdHlwZSB7TWFwPHN0cmluZywgQ2hhbm5lbD59XG4gKi9cbmNvbnN0IGNoYW5uZWxzID0gbmV3IE1hcCgpXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuY2xhc3MgTG9jYWxTdG9yYWdlUG9seWZpbGwge1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvb21cbiAgICovXG4gIGNvbnN0cnVjdG9yIChyb29tKSB7XG4gICAgdGhpcy5yb29tID0gcm9vbVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudWxsfGZ1bmN0aW9uKHtkYXRhOlVpbnQ4QXJyYXl9KTp2b2lkfVxuICAgICAqL1xuICAgIHRoaXMub25tZXNzYWdlID0gbnVsbFxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7YW55fSBlXG4gICAgICovXG4gICAgdGhpcy5fb25DaGFuZ2UgPSBlID0+IGUua2V5ID09PSByb29tICYmIHRoaXMub25tZXNzYWdlICE9PSBudWxsICYmIHRoaXMub25tZXNzYWdlKHsgZGF0YTogYnVmZmVyLmZyb21CYXNlNjQoZS5uZXdWYWx1ZSB8fCAnJykgfSlcbiAgICBzdG9yYWdlLm9uQ2hhbmdlKHRoaXMuX29uQ2hhbmdlKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXlCdWZmZXJ9IGJ1ZlxuICAgKi9cbiAgcG9zdE1lc3NhZ2UgKGJ1Zikge1xuICAgIHN0b3JhZ2UudmFyU3RvcmFnZS5zZXRJdGVtKHRoaXMucm9vbSwgYnVmZmVyLnRvQmFzZTY0KGJ1ZmZlci5jcmVhdGVVaW50OEFycmF5RnJvbUFycmF5QnVmZmVyKGJ1ZikpKVxuICB9XG5cbiAgY2xvc2UgKCkge1xuICAgIHN0b3JhZ2Uub2ZmQ2hhbmdlKHRoaXMuX29uQ2hhbmdlKVxuICB9XG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vLyBVc2UgQnJvYWRjYXN0Q2hhbm5lbCBvciBQb2x5ZmlsbFxuLyogYzggaWdub3JlIG5leHQgKi9cbmNvbnN0IEJDID0gdHlwZW9mIEJyb2FkY2FzdENoYW5uZWwgPT09ICd1bmRlZmluZWQnID8gTG9jYWxTdG9yYWdlUG9seWZpbGwgOiBCcm9hZGNhc3RDaGFubmVsXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHJvb21cbiAqIEByZXR1cm4ge0NoYW5uZWx9XG4gKi9cbmNvbnN0IGdldENoYW5uZWwgPSByb29tID0+XG4gIG1hcC5zZXRJZlVuZGVmaW5lZChjaGFubmVscywgcm9vbSwgKCkgPT4ge1xuICAgIGNvbnN0IHN1YnMgPSBzZXQuY3JlYXRlKClcbiAgICBjb25zdCBiYyA9IG5ldyBCQyhyb29tKVxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7e2RhdGE6QXJyYXlCdWZmZXJ9fSBlXG4gICAgICovXG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICBiYy5vbm1lc3NhZ2UgPSBlID0+IHN1YnMuZm9yRWFjaChzdWIgPT4gc3ViKGUuZGF0YSwgJ2Jyb2FkY2FzdGNoYW5uZWwnKSlcbiAgICByZXR1cm4ge1xuICAgICAgYmMsIHN1YnNcbiAgICB9XG4gIH0pXG5cbi8qKlxuICogU3Vic2NyaWJlIHRvIGdsb2JhbCBgcHVibGlzaGAgZXZlbnRzLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IHJvb21cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oYW55LCBhbnkpOmFueX0gZlxuICovXG5leHBvcnQgY29uc3Qgc3Vic2NyaWJlID0gKHJvb20sIGYpID0+IHtcbiAgZ2V0Q2hhbm5lbChyb29tKS5zdWJzLmFkZChmKVxuICByZXR1cm4gZlxufVxuXG4vKipcbiAqIFVuc3Vic2NyaWJlIGZyb20gYHB1Ymxpc2hgIGdsb2JhbCBldmVudHMuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gcm9vbVxuICogQHBhcmFtIHtmdW5jdGlvbihhbnksIGFueSk6YW55fSBmXG4gKi9cbmV4cG9ydCBjb25zdCB1bnN1YnNjcmliZSA9IChyb29tLCBmKSA9PiB7XG4gIGNvbnN0IGNoYW5uZWwgPSBnZXRDaGFubmVsKHJvb20pXG4gIGNvbnN0IHVuc3Vic2NyaWJlZCA9IGNoYW5uZWwuc3Vicy5kZWxldGUoZilcbiAgaWYgKHVuc3Vic2NyaWJlZCAmJiBjaGFubmVsLnN1YnMuc2l6ZSA9PT0gMCkge1xuICAgIGNoYW5uZWwuYmMuY2xvc2UoKVxuICAgIGNoYW5uZWxzLmRlbGV0ZShyb29tKVxuICB9XG4gIHJldHVybiB1bnN1YnNjcmliZWRcbn1cblxuLyoqXG4gKiBQdWJsaXNoIGRhdGEgdG8gYWxsIHN1YnNjcmliZXJzIChpbmNsdWRpbmcgc3Vic2NyaWJlcnMgb24gdGhpcyB0YWIpXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gcm9vbVxuICogQHBhcmFtIHthbnl9IGRhdGFcbiAqIEBwYXJhbSB7YW55fSBbb3JpZ2luXVxuICovXG5leHBvcnQgY29uc3QgcHVibGlzaCA9IChyb29tLCBkYXRhLCBvcmlnaW4gPSBudWxsKSA9PiB7XG4gIGNvbnN0IGMgPSBnZXRDaGFubmVsKHJvb20pXG4gIGMuYmMucG9zdE1lc3NhZ2UoZGF0YSlcbiAgYy5zdWJzLmZvckVhY2goc3ViID0+IHN1YihkYXRhLCBvcmlnaW4pKVxufVxuIiwgIi8qKlxuICogTXV0dWFsIGV4Y2x1ZGUgZm9yIEphdmFTY3JpcHQuXG4gKlxuICogQG1vZHVsZSBtdXRleFxuICovXG5cbi8qKlxuICogQGNhbGxiYWNrIG11dGV4XG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCk6dm9pZH0gY2IgT25seSBleGVjdXRlZCB3aGVuIHRoaXMgbXV0ZXggaXMgbm90IGluIHRoZSBjdXJyZW50IHN0YWNrXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCk6dm9pZH0gW2Vsc2VDYl0gRXhlY3V0ZWQgd2hlbiB0aGlzIG11dGV4IGlzIGluIHRoZSBjdXJyZW50IHN0YWNrXG4gKi9cblxuLyoqXG4gKiBDcmVhdGVzIGEgbXV0dWFsIGV4Y2x1ZGUgZnVuY3Rpb24gd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnR5OlxuICpcbiAqIGBgYGpzXG4gKiBjb25zdCBtdXRleCA9IGNyZWF0ZU11dGV4KClcbiAqIG11dGV4KCgpID0+IHtcbiAqICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBpbW1lZGlhdGVseSBleGVjdXRlZFxuICogICBtdXRleCgoKSA9PiB7XG4gKiAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBub3QgZXhlY3V0ZWQsIGFzIHRoZSBtdXRleCBpcyBhbHJlYWR5IGFjdGl2ZS5cbiAqICAgfSlcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAcmV0dXJuIHttdXRleH0gQSBtdXR1YWwgZXhjbHVkZSBmdW5jdGlvblxuICogQHB1YmxpY1xuICovXG5leHBvcnQgY29uc3QgY3JlYXRlTXV0ZXggPSAoKSA9PiB7XG4gIGxldCB0b2tlbiA9IHRydWVcbiAgcmV0dXJuIChmLCBnKSA9PiB7XG4gICAgaWYgKHRva2VuKSB7XG4gICAgICB0b2tlbiA9IGZhbHNlXG4gICAgICB0cnkge1xuICAgICAgICBmKClcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRva2VuID0gdHJ1ZVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBnKClcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyB3cyBmcm9tICdsaWIwL3dlYnNvY2tldCdcbmltcG9ydCAqIGFzIG1hcCBmcm9tICdsaWIwL21hcCdcbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJ2xpYjAvZXJyb3InXG5pbXBvcnQgKiBhcyByYW5kb20gZnJvbSAnbGliMC9yYW5kb20nXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICdsaWIwL2VuY29kaW5nJ1xuaW1wb3J0ICogYXMgZGVjb2RpbmcgZnJvbSAnbGliMC9kZWNvZGluZydcbmltcG9ydCB7IE9ic2VydmFibGVWMiB9IGZyb20gJ2xpYjAvb2JzZXJ2YWJsZSdcbmltcG9ydCAqIGFzIGxvZ2dpbmcgZnJvbSAnbGliMC9sb2dnaW5nJ1xuaW1wb3J0ICogYXMgcHJvbWlzZSBmcm9tICdsaWIwL3Byb21pc2UnXG5pbXBvcnQgKiBhcyBiYyBmcm9tICdsaWIwL2Jyb2FkY2FzdGNoYW5uZWwnXG5pbXBvcnQgKiBhcyBidWZmZXIgZnJvbSAnbGliMC9idWZmZXInXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJ2xpYjAvbWF0aCdcbmltcG9ydCB7IGNyZWF0ZU11dGV4IH0gZnJvbSAnbGliMC9tdXRleCdcblxuaW1wb3J0ICogYXMgWSBmcm9tICd5anMnIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbmltcG9ydCBQZWVyIGZyb20gJ3NpbXBsZS1wZWVyL3NpbXBsZXBlZXIubWluLmpzJ1xuXG5pbXBvcnQgKiBhcyBzeW5jUHJvdG9jb2wgZnJvbSAneS1wcm90b2NvbHMvc3luYydcbmltcG9ydCAqIGFzIGF3YXJlbmVzc1Byb3RvY29sIGZyb20gJ3ktcHJvdG9jb2xzL2F3YXJlbmVzcydcblxuaW1wb3J0ICogYXMgY3J5cHRvdXRpbHMgZnJvbSAnLi9jcnlwdG8uanMnXG5cbmNvbnN0IGxvZyA9IGxvZ2dpbmcuY3JlYXRlTW9kdWxlTG9nZ2VyKCd5LXdlYnJ0YycpXG5cbmNvbnN0IG1lc3NhZ2VTeW5jID0gMFxuY29uc3QgbWVzc2FnZVF1ZXJ5QXdhcmVuZXNzID0gM1xuY29uc3QgbWVzc2FnZUF3YXJlbmVzcyA9IDFcbmNvbnN0IG1lc3NhZ2VCY1BlZXJJZCA9IDRcblxuLyoqXG4gKiBAdHlwZSB7TWFwPHN0cmluZywgU2lnbmFsaW5nQ29ubj59XG4gKi9cbmNvbnN0IHNpZ25hbGluZ0Nvbm5zID0gbmV3IE1hcCgpXG5cbi8qKlxuICogQHR5cGUge01hcDxzdHJpbmcsUm9vbT59XG4gKi9cbmNvbnN0IHJvb21zID0gbmV3IE1hcCgpXG5cbi8qKlxuICogQHBhcmFtIHtSb29tfSByb29tXG4gKi9cbmNvbnN0IGNoZWNrSXNTeW5jZWQgPSByb29tID0+IHtcbiAgbGV0IHN5bmNlZCA9IHRydWVcbiAgcm9vbS53ZWJydGNDb25ucy5mb3JFYWNoKHBlZXIgPT4ge1xuICAgIGlmICghcGVlci5zeW5jZWQpIHtcbiAgICAgIHN5bmNlZCA9IGZhbHNlXG4gICAgfVxuICB9KVxuICBpZiAoKCFzeW5jZWQgJiYgcm9vbS5zeW5jZWQpIHx8IChzeW5jZWQgJiYgIXJvb20uc3luY2VkKSkge1xuICAgIHJvb20uc3luY2VkID0gc3luY2VkXG4gICAgcm9vbS5wcm92aWRlci5lbWl0KCdzeW5jZWQnLCBbeyBzeW5jZWQgfV0pXG4gICAgbG9nKCdzeW5jZWQgJywgbG9nZ2luZy5CT0xELCByb29tLm5hbWUsIGxvZ2dpbmcuVU5CT0xELCAnIHdpdGggYWxsIHBlZXJzJylcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7Um9vbX0gcm9vbVxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN5bmNlZENhbGxiYWNrXG4gKiBAcmV0dXJuIHtlbmNvZGluZy5FbmNvZGVyP31cbiAqL1xuY29uc3QgcmVhZE1lc3NhZ2UgPSAocm9vbSwgYnVmLCBzeW5jZWRDYWxsYmFjaykgPT4ge1xuICBjb25zdCBkZWNvZGVyID0gZGVjb2RpbmcuY3JlYXRlRGVjb2RlcihidWYpXG4gIGNvbnN0IGVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAgY29uc3QgbWVzc2FnZVR5cGUgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyKVxuICBpZiAocm9vbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICBjb25zdCBhd2FyZW5lc3MgPSByb29tLmF3YXJlbmVzc1xuICBjb25zdCBkb2MgPSByb29tLmRvY1xuICBsZXQgc2VuZFJlcGx5ID0gZmFsc2VcbiAgc3dpdGNoIChtZXNzYWdlVHlwZSkge1xuICAgIGNhc2UgbWVzc2FnZVN5bmM6IHtcbiAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCBtZXNzYWdlU3luYylcbiAgICAgIGNvbnN0IHN5bmNNZXNzYWdlVHlwZSA9IHN5bmNQcm90b2NvbC5yZWFkU3luY01lc3NhZ2UoZGVjb2RlciwgZW5jb2RlciwgZG9jLCByb29tKVxuICAgICAgaWYgKHN5bmNNZXNzYWdlVHlwZSA9PT0gc3luY1Byb3RvY29sLm1lc3NhZ2VZanNTeW5jU3RlcDIgJiYgIXJvb20uc3luY2VkKSB7XG4gICAgICAgIHN5bmNlZENhbGxiYWNrKClcbiAgICAgIH1cbiAgICAgIGlmIChzeW5jTWVzc2FnZVR5cGUgPT09IHN5bmNQcm90b2NvbC5tZXNzYWdlWWpzU3luY1N0ZXAxKSB7XG4gICAgICAgIHNlbmRSZXBseSA9IHRydWVcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgfVxuICAgIGNhc2UgbWVzc2FnZVF1ZXJ5QXdhcmVuZXNzOlxuICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIG1lc3NhZ2VBd2FyZW5lc3MpXG4gICAgICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkoZW5jb2RlciwgYXdhcmVuZXNzUHJvdG9jb2wuZW5jb2RlQXdhcmVuZXNzVXBkYXRlKGF3YXJlbmVzcywgQXJyYXkuZnJvbShhd2FyZW5lc3MuZ2V0U3RhdGVzKCkua2V5cygpKSkpXG4gICAgICBzZW5kUmVwbHkgPSB0cnVlXG4gICAgICBicmVha1xuICAgIGNhc2UgbWVzc2FnZUF3YXJlbmVzczpcbiAgICAgIGF3YXJlbmVzc1Byb3RvY29sLmFwcGx5QXdhcmVuZXNzVXBkYXRlKGF3YXJlbmVzcywgZGVjb2RpbmcucmVhZFZhclVpbnQ4QXJyYXkoZGVjb2RlciksIHJvb20pXG4gICAgICBicmVha1xuICAgIGNhc2UgbWVzc2FnZUJjUGVlcklkOiB7XG4gICAgICBjb25zdCBhZGQgPSBkZWNvZGluZy5yZWFkVWludDgoZGVjb2RlcikgPT09IDFcbiAgICAgIGNvbnN0IHBlZXJOYW1lID0gZGVjb2RpbmcucmVhZFZhclN0cmluZyhkZWNvZGVyKVxuICAgICAgaWYgKHBlZXJOYW1lICE9PSByb29tLnBlZXJJZCAmJiAoKHJvb20uYmNDb25ucy5oYXMocGVlck5hbWUpICYmICFhZGQpIHx8ICghcm9vbS5iY0Nvbm5zLmhhcyhwZWVyTmFtZSkgJiYgYWRkKSkpIHtcbiAgICAgICAgY29uc3QgcmVtb3ZlZCA9IFtdXG4gICAgICAgIGNvbnN0IGFkZGVkID0gW11cbiAgICAgICAgaWYgKGFkZCkge1xuICAgICAgICAgIHJvb20uYmNDb25ucy5hZGQocGVlck5hbWUpXG4gICAgICAgICAgYWRkZWQucHVzaChwZWVyTmFtZSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByb29tLmJjQ29ubnMuZGVsZXRlKHBlZXJOYW1lKVxuICAgICAgICAgIHJlbW92ZWQucHVzaChwZWVyTmFtZSlcbiAgICAgICAgfVxuICAgICAgICByb29tLnByb3ZpZGVyLmVtaXQoJ3BlZXJzJywgW3tcbiAgICAgICAgICBhZGRlZCxcbiAgICAgICAgICByZW1vdmVkLFxuICAgICAgICAgIHdlYnJ0Y1BlZXJzOiBBcnJheS5mcm9tKHJvb20ud2VicnRjQ29ubnMua2V5cygpKSxcbiAgICAgICAgICBiY1BlZXJzOiBBcnJheS5mcm9tKHJvb20uYmNDb25ucylcbiAgICAgICAgfV0pXG4gICAgICAgIGJyb2FkY2FzdEJjUGVlcklkKHJvb20pXG4gICAgICB9XG4gICAgICBicmVha1xuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgY29uc29sZS5lcnJvcignVW5hYmxlIHRvIGNvbXB1dGUgbWVzc2FnZScpXG4gICAgICByZXR1cm4gZW5jb2RlclxuICB9XG4gIGlmICghc2VuZFJlcGx5KSB7XG4gICAgLy8gbm90aGluZyBoYXMgYmVlbiB3cml0dGVuLCBubyBhbnN3ZXIgY3JlYXRlZFxuICAgIHJldHVybiBudWxsXG4gIH1cbiAgcmV0dXJuIGVuY29kZXJcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1dlYnJ0Y0Nvbm59IHBlZXJDb25uXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICogQHJldHVybiB7ZW5jb2RpbmcuRW5jb2Rlcj99XG4gKi9cbmNvbnN0IHJlYWRQZWVyTWVzc2FnZSA9IChwZWVyQ29ubiwgYnVmKSA9PiB7XG4gIGNvbnN0IHJvb20gPSBwZWVyQ29ubi5yb29tXG4gIGxvZygncmVjZWl2ZWQgbWVzc2FnZSBmcm9tICcsIGxvZ2dpbmcuQk9MRCwgcGVlckNvbm4ucmVtb3RlUGVlcklkLCBsb2dnaW5nLkdSRVksICcgKCcsIHJvb20ubmFtZSwgJyknLCBsb2dnaW5nLlVOQk9MRCwgbG9nZ2luZy5VTkNPTE9SKVxuICByZXR1cm4gcmVhZE1lc3NhZ2Uocm9vbSwgYnVmLCAoKSA9PiB7XG4gICAgcGVlckNvbm4uc3luY2VkID0gdHJ1ZVxuICAgIGxvZygnc3luY2VkICcsIGxvZ2dpbmcuQk9MRCwgcm9vbS5uYW1lLCBsb2dnaW5nLlVOQk9MRCwgJyB3aXRoICcsIGxvZ2dpbmcuQk9MRCwgcGVlckNvbm4ucmVtb3RlUGVlcklkKVxuICAgIGNoZWNrSXNTeW5jZWQocm9vbSlcbiAgfSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1dlYnJ0Y0Nvbm59IHdlYnJ0Y0Nvbm5cbiAqIEBwYXJhbSB7ZW5jb2RpbmcuRW5jb2Rlcn0gZW5jb2RlclxuICovXG5jb25zdCBzZW5kV2VicnRjQ29ubiA9ICh3ZWJydGNDb25uLCBlbmNvZGVyKSA9PiB7XG4gIGxvZygnc2VuZCBtZXNzYWdlIHRvICcsIGxvZ2dpbmcuQk9MRCwgd2VicnRjQ29ubi5yZW1vdGVQZWVySWQsIGxvZ2dpbmcuVU5CT0xELCBsb2dnaW5nLkdSRVksICcgKCcsIHdlYnJ0Y0Nvbm4ucm9vbS5uYW1lLCAnKScsIGxvZ2dpbmcuVU5DT0xPUilcbiAgdHJ5IHtcbiAgICB3ZWJydGNDb25uLnBlZXIuc2VuZChlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlcikpXG4gIH0gY2F0Y2ggKGUpIHt9XG59XG5cbi8qKlxuICogQHBhcmFtIHtSb29tfSByb29tXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IG1cbiAqL1xuY29uc3QgYnJvYWRjYXN0V2VicnRjQ29ubiA9IChyb29tLCBtKSA9PiB7XG4gIGxvZygnYnJvYWRjYXN0IG1lc3NhZ2UgaW4gJywgbG9nZ2luZy5CT0xELCByb29tLm5hbWUsIGxvZ2dpbmcuVU5CT0xEKVxuICByb29tLndlYnJ0Y0Nvbm5zLmZvckVhY2goY29ubiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbm4ucGVlci5zZW5kKG0pXG4gICAgfSBjYXRjaCAoZSkge31cbiAgfSlcbn1cblxuZXhwb3J0IGNsYXNzIFdlYnJ0Y0Nvbm4ge1xuICAvKipcbiAgICogQHBhcmFtIHtTaWduYWxpbmdDb25ufSBzaWduYWxpbmdDb25uXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaW5pdGlhdG9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZW1vdGVQZWVySWRcbiAgICogQHBhcmFtIHtSb29tfSByb29tXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc2lnbmFsaW5nQ29ubiwgaW5pdGlhdG9yLCByZW1vdGVQZWVySWQsIHJvb20pIHtcbiAgICBsb2coJ2VzdGFibGlzaGluZyBjb25uZWN0aW9uIHRvICcsIGxvZ2dpbmcuQk9MRCwgcmVtb3RlUGVlcklkKVxuICAgIHRoaXMucm9vbSA9IHJvb21cbiAgICB0aGlzLnJlbW90ZVBlZXJJZCA9IHJlbW90ZVBlZXJJZFxuICAgIHRoaXMuZ2xhcmVUb2tlbiA9IHVuZGVmaW5lZFxuICAgIHRoaXMuY2xvc2VkID0gZmFsc2VcbiAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlXG4gICAgdGhpcy5zeW5jZWQgPSBmYWxzZVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHthbnl9XG4gICAgICovXG4gICAgdGhpcy5wZWVyID0gbmV3IFBlZXIoeyBpbml0aWF0b3IsIC4uLnJvb20ucHJvdmlkZXIucGVlck9wdHMgfSlcbiAgICB0aGlzLnBlZXIub24oJ3NpZ25hbCcsIHNpZ25hbCA9PiB7XG4gICAgICBpZiAodGhpcy5nbGFyZVRva2VuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gYWRkIHNvbWUgcmFuZG9tbmVzcyB0byB0aGUgdGltZXN0YW1wIG9mIHRoZSBvZmZlclxuICAgICAgICB0aGlzLmdsYXJlVG9rZW4gPSBEYXRlLm5vdygpICsgTWF0aC5yYW5kb20oKVxuICAgICAgfVxuICAgICAgcHVibGlzaFNpZ25hbGluZ01lc3NhZ2Uoc2lnbmFsaW5nQ29ubiwgcm9vbSwgeyB0bzogcmVtb3RlUGVlcklkLCBmcm9tOiByb29tLnBlZXJJZCwgdHlwZTogJ3NpZ25hbCcsIHRva2VuOiB0aGlzLmdsYXJlVG9rZW4sIHNpZ25hbCB9KVxuICAgIH0pXG4gICAgdGhpcy5wZWVyLm9uKCdjb25uZWN0JywgKCkgPT4ge1xuICAgICAgbG9nKCdjb25uZWN0ZWQgdG8gJywgbG9nZ2luZy5CT0xELCByZW1vdGVQZWVySWQpXG4gICAgICB0aGlzLmNvbm5lY3RlZCA9IHRydWVcbiAgICAgIC8vIHNlbmQgc3luYyBzdGVwIDFcbiAgICAgIGNvbnN0IHByb3ZpZGVyID0gcm9vbS5wcm92aWRlclxuICAgICAgY29uc3QgZG9jID0gcHJvdmlkZXIuZG9jXG4gICAgICBjb25zdCBhd2FyZW5lc3MgPSByb29tLmF3YXJlbmVzc1xuICAgICAgY29uc3QgZW5jb2RlciA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIG1lc3NhZ2VTeW5jKVxuICAgICAgc3luY1Byb3RvY29sLndyaXRlU3luY1N0ZXAxKGVuY29kZXIsIGRvYylcbiAgICAgIHNlbmRXZWJydGNDb25uKHRoaXMsIGVuY29kZXIpXG4gICAgICBjb25zdCBhd2FyZW5lc3NTdGF0ZXMgPSBhd2FyZW5lc3MuZ2V0U3RhdGVzKClcbiAgICAgIGlmIChhd2FyZW5lc3NTdGF0ZXMuc2l6ZSA+IDApIHtcbiAgICAgICAgY29uc3QgZW5jb2RlciA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICAgICAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgbWVzc2FnZUF3YXJlbmVzcylcbiAgICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIGF3YXJlbmVzc1Byb3RvY29sLmVuY29kZUF3YXJlbmVzc1VwZGF0ZShhd2FyZW5lc3MsIEFycmF5LmZyb20oYXdhcmVuZXNzU3RhdGVzLmtleXMoKSkpKVxuICAgICAgICBzZW5kV2VicnRjQ29ubih0aGlzLCBlbmNvZGVyKVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5wZWVyLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2VcbiAgICAgIHRoaXMuY2xvc2VkID0gdHJ1ZVxuICAgICAgaWYgKHJvb20ud2VicnRjQ29ubnMuaGFzKHRoaXMucmVtb3RlUGVlcklkKSkge1xuICAgICAgICByb29tLndlYnJ0Y0Nvbm5zLmRlbGV0ZSh0aGlzLnJlbW90ZVBlZXJJZClcbiAgICAgICAgcm9vbS5wcm92aWRlci5lbWl0KCdwZWVycycsIFt7XG4gICAgICAgICAgcmVtb3ZlZDogW3RoaXMucmVtb3RlUGVlcklkXSxcbiAgICAgICAgICBhZGRlZDogW10sXG4gICAgICAgICAgd2VicnRjUGVlcnM6IEFycmF5LmZyb20ocm9vbS53ZWJydGNDb25ucy5rZXlzKCkpLFxuICAgICAgICAgIGJjUGVlcnM6IEFycmF5LmZyb20ocm9vbS5iY0Nvbm5zKVxuICAgICAgICB9XSlcbiAgICAgIH1cbiAgICAgIGNoZWNrSXNTeW5jZWQocm9vbSlcbiAgICAgIHRoaXMucGVlci5kZXN0cm95KClcbiAgICAgIGxvZygnY2xvc2VkIGNvbm5lY3Rpb24gdG8gJywgbG9nZ2luZy5CT0xELCByZW1vdGVQZWVySWQpXG4gICAgICBhbm5vdW5jZVNpZ25hbGluZ0luZm8ocm9vbSlcbiAgICB9KVxuICAgIHRoaXMucGVlci5vbignZXJyb3InLCBlcnIgPT4ge1xuICAgICAgbG9nKCdFcnJvciBpbiBjb25uZWN0aW9uIHRvICcsIGxvZ2dpbmcuQk9MRCwgcmVtb3RlUGVlcklkLCAnOiAnLCBlcnIpXG4gICAgICBhbm5vdW5jZVNpZ25hbGluZ0luZm8ocm9vbSlcbiAgICB9KVxuICAgIHRoaXMucGVlci5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgY29uc3QgYW5zd2VyID0gcmVhZFBlZXJNZXNzYWdlKHRoaXMsIGRhdGEpXG4gICAgICBpZiAoYW5zd2VyICE9PSBudWxsKSB7XG4gICAgICAgIHNlbmRXZWJydGNDb25uKHRoaXMsIGFuc3dlcilcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgdGhpcy5wZWVyLmRlc3Ryb3koKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtSb29tfSByb29tXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IG1cbiAqL1xuY29uc3QgYnJvYWRjYXN0QmNNZXNzYWdlID0gKHJvb20sIG0pID0+IGNyeXB0b3V0aWxzLmVuY3J5cHQobSwgcm9vbS5rZXkpLnRoZW4oZGF0YSA9PlxuICByb29tLm11eCgoKSA9PlxuICAgIGJjLnB1Ymxpc2gocm9vbS5uYW1lLCBkYXRhKVxuICApXG4pXG5cbi8qKlxuICogQHBhcmFtIHtSb29tfSByb29tXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IG1cbiAqL1xuY29uc3QgYnJvYWRjYXN0Um9vbU1lc3NhZ2UgPSAocm9vbSwgbSkgPT4ge1xuICBpZiAocm9vbS5iY2Nvbm5lY3RlZCkge1xuICAgIGJyb2FkY2FzdEJjTWVzc2FnZShyb29tLCBtKVxuICB9XG4gIGJyb2FkY2FzdFdlYnJ0Y0Nvbm4ocm9vbSwgbSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1Jvb219IHJvb21cbiAqL1xuY29uc3QgYW5ub3VuY2VTaWduYWxpbmdJbmZvID0gcm9vbSA9PiB7XG4gIHNpZ25hbGluZ0Nvbm5zLmZvckVhY2goY29ubiA9PiB7XG4gICAgLy8gb25seSBzdWJzY3JpYmUgaWYgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZCwgb3RoZXJ3aXNlIHRoZSBjb25uIGF1dG9tYXRpY2FsbHkgc3Vic2NyaWJlcyB0byBhbGwgcm9vbXNcbiAgICBpZiAoY29ubi5jb25uZWN0ZWQpIHtcbiAgICAgIGNvbm4uc2VuZCh7IHR5cGU6ICdzdWJzY3JpYmUnLCB0b3BpY3M6IFtyb29tLm5hbWVdIH0pXG4gICAgICBpZiAocm9vbS53ZWJydGNDb25ucy5zaXplIDwgcm9vbS5wcm92aWRlci5tYXhDb25ucykge1xuICAgICAgICBwdWJsaXNoU2lnbmFsaW5nTWVzc2FnZShjb25uLCByb29tLCB7IHR5cGU6ICdhbm5vdW5jZScsIGZyb206IHJvb20ucGVlcklkIH0pXG4gICAgICB9XG4gICAgfVxuICB9KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7Um9vbX0gcm9vbVxuICovXG5jb25zdCBicm9hZGNhc3RCY1BlZXJJZCA9IHJvb20gPT4ge1xuICBpZiAocm9vbS5wcm92aWRlci5maWx0ZXJCY0Nvbm5zKSB7XG4gICAgLy8gYnJvYWRjYXN0IHBlZXJJZCB2aWEgYnJvYWRjYXN0Y2hhbm5lbFxuICAgIGNvbnN0IGVuY29kZXJQZWVySWRCYyA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyUGVlcklkQmMsIG1lc3NhZ2VCY1BlZXJJZClcbiAgICBlbmNvZGluZy53cml0ZVVpbnQ4KGVuY29kZXJQZWVySWRCYywgMSlcbiAgICBlbmNvZGluZy53cml0ZVZhclN0cmluZyhlbmNvZGVyUGVlcklkQmMsIHJvb20ucGVlcklkKVxuICAgIGJyb2FkY2FzdEJjTWVzc2FnZShyb29tLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlclBlZXJJZEJjKSlcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUm9vbSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1kuRG9jfSBkb2NcbiAgICogQHBhcmFtIHtXZWJydGNQcm92aWRlcn0gcHJvdmlkZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICogQHBhcmFtIHtDcnlwdG9LZXl8bnVsbH0ga2V5XG4gICAqL1xuICBjb25zdHJ1Y3RvciAoZG9jLCBwcm92aWRlciwgbmFtZSwga2V5KSB7XG4gICAgLyoqXG4gICAgICogRG8gbm90IGFzc3VtZSB0aGF0IHBlZXJJZCBpcyB1bmlxdWUuIFRoaXMgaXMgb25seSBtZWFudCBmb3Igc2VuZGluZyBzaWduYWxpbmcgbWVzc2FnZXMuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMucGVlcklkID0gcmFuZG9tLnV1aWR2NCgpXG4gICAgdGhpcy5kb2MgPSBkb2NcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7YXdhcmVuZXNzUHJvdG9jb2wuQXdhcmVuZXNzfVxuICAgICAqL1xuICAgIHRoaXMuYXdhcmVuZXNzID0gcHJvdmlkZXIuYXdhcmVuZXNzXG4gICAgdGhpcy5wcm92aWRlciA9IHByb3ZpZGVyXG4gICAgdGhpcy5zeW5jZWQgPSBmYWxzZVxuICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICAvLyBAdG9kbyBtYWtlIGtleSBzZWNyZXQgYnkgc2NvcGluZ1xuICAgIHRoaXMua2V5ID0ga2V5XG4gICAgLyoqXG4gICAgICogQHR5cGUge01hcDxzdHJpbmcsIFdlYnJ0Y0Nvbm4+fVxuICAgICAqL1xuICAgIHRoaXMud2VicnRjQ29ubnMgPSBuZXcgTWFwKClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7U2V0PHN0cmluZz59XG4gICAgICovXG4gICAgdGhpcy5iY0Nvbm5zID0gbmV3IFNldCgpXG4gICAgdGhpcy5tdXggPSBjcmVhdGVNdXRleCgpXG4gICAgdGhpcy5iY2Nvbm5lY3RlZCA9IGZhbHNlXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gZGF0YVxuICAgICAqL1xuICAgIHRoaXMuX2JjU3Vic2NyaWJlciA9IGRhdGEgPT5cbiAgICAgIGNyeXB0b3V0aWxzLmRlY3J5cHQobmV3IFVpbnQ4QXJyYXkoZGF0YSksIGtleSkudGhlbihtID0+XG4gICAgICAgIHRoaXMubXV4KCgpID0+IHtcbiAgICAgICAgICBjb25zdCByZXBseSA9IHJlYWRNZXNzYWdlKHRoaXMsIG0sICgpID0+IHt9KVxuICAgICAgICAgIGlmIChyZXBseSkge1xuICAgICAgICAgICAgYnJvYWRjYXN0QmNNZXNzYWdlKHRoaXMsIGVuY29kaW5nLnRvVWludDhBcnJheShyZXBseSkpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgKVxuICAgIC8qKlxuICAgICAqIExpc3RlbnMgdG8gWWpzIHVwZGF0ZXMgYW5kIHNlbmRzIHRoZW0gdG8gcmVtb3RlIHBlZXJzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICAgICAqIEBwYXJhbSB7YW55fSBfb3JpZ2luXG4gICAgICovXG4gICAgdGhpcy5fZG9jVXBkYXRlSGFuZGxlciA9ICh1cGRhdGUsIF9vcmlnaW4pID0+IHtcbiAgICAgIGNvbnN0IGVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCBtZXNzYWdlU3luYylcbiAgICAgIHN5bmNQcm90b2NvbC53cml0ZVVwZGF0ZShlbmNvZGVyLCB1cGRhdGUpXG4gICAgICBicm9hZGNhc3RSb29tTWVzc2FnZSh0aGlzLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlcikpXG4gICAgfVxuICAgIC8qKlxuICAgICAqIExpc3RlbnMgdG8gQXdhcmVuZXNzIHVwZGF0ZXMgYW5kIHNlbmRzIHRoZW0gdG8gcmVtb3RlIHBlZXJzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0gY2hhbmdlZFxuICAgICAqIEBwYXJhbSB7YW55fSBfb3JpZ2luXG4gICAgICovXG4gICAgdGhpcy5fYXdhcmVuZXNzVXBkYXRlSGFuZGxlciA9ICh7IGFkZGVkLCB1cGRhdGVkLCByZW1vdmVkIH0sIF9vcmlnaW4pID0+IHtcbiAgICAgIGNvbnN0IGNoYW5nZWRDbGllbnRzID0gYWRkZWQuY29uY2F0KHVwZGF0ZWQpLmNvbmNhdChyZW1vdmVkKVxuICAgICAgY29uc3QgZW5jb2RlckF3YXJlbmVzcyA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXJBd2FyZW5lc3MsIG1lc3NhZ2VBd2FyZW5lc3MpXG4gICAgICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkoZW5jb2RlckF3YXJlbmVzcywgYXdhcmVuZXNzUHJvdG9jb2wuZW5jb2RlQXdhcmVuZXNzVXBkYXRlKHRoaXMuYXdhcmVuZXNzLCBjaGFuZ2VkQ2xpZW50cykpXG4gICAgICBicm9hZGNhc3RSb29tTWVzc2FnZSh0aGlzLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlckF3YXJlbmVzcykpXG4gICAgfVxuXG4gICAgdGhpcy5fYmVmb3JlVW5sb2FkSGFuZGxlciA9ICgpID0+IHtcbiAgICAgIGF3YXJlbmVzc1Byb3RvY29sLnJlbW92ZUF3YXJlbmVzc1N0YXRlcyh0aGlzLmF3YXJlbmVzcywgW2RvYy5jbGllbnRJRF0sICd3aW5kb3cgdW5sb2FkJylcbiAgICAgIHJvb21zLmZvckVhY2gocm9vbSA9PiB7XG4gICAgICAgIHJvb20uZGlzY29ubmVjdCgpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JlZm9yZXVubG9hZCcsIHRoaXMuX2JlZm9yZVVubG9hZEhhbmRsZXIpXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHByb2Nlc3Mub24oJ2V4aXQnLCB0aGlzLl9iZWZvcmVVbmxvYWRIYW5kbGVyKVxuICAgIH1cbiAgfVxuXG4gIGNvbm5lY3QgKCkge1xuICAgIHRoaXMuZG9jLm9uKCd1cGRhdGUnLCB0aGlzLl9kb2NVcGRhdGVIYW5kbGVyKVxuICAgIHRoaXMuYXdhcmVuZXNzLm9uKCd1cGRhdGUnLCB0aGlzLl9hd2FyZW5lc3NVcGRhdGVIYW5kbGVyKVxuICAgIC8vIHNpZ25hbCB0aHJvdWdoIGFsbCBhdmFpbGFibGUgc2lnbmFsaW5nIGNvbm5lY3Rpb25zXG4gICAgYW5ub3VuY2VTaWduYWxpbmdJbmZvKHRoaXMpXG4gICAgY29uc3Qgcm9vbU5hbWUgPSB0aGlzLm5hbWVcbiAgICBiYy5zdWJzY3JpYmUocm9vbU5hbWUsIHRoaXMuX2JjU3Vic2NyaWJlcilcbiAgICB0aGlzLmJjY29ubmVjdGVkID0gdHJ1ZVxuICAgIC8vIGJyb2FkY2FzdCBwZWVySWQgdmlhIGJyb2FkY2FzdGNoYW5uZWxcbiAgICBicm9hZGNhc3RCY1BlZXJJZCh0aGlzKVxuICAgIC8vIHdyaXRlIHN5bmMgc3RlcCAxXG4gICAgY29uc3QgZW5jb2RlclN5bmMgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlclN5bmMsIG1lc3NhZ2VTeW5jKVxuICAgIHN5bmNQcm90b2NvbC53cml0ZVN5bmNTdGVwMShlbmNvZGVyU3luYywgdGhpcy5kb2MpXG4gICAgYnJvYWRjYXN0QmNNZXNzYWdlKHRoaXMsIGVuY29kaW5nLnRvVWludDhBcnJheShlbmNvZGVyU3luYykpXG4gICAgLy8gYnJvYWRjYXN0IGxvY2FsIHN0YXRlXG4gICAgY29uc3QgZW5jb2RlclN0YXRlID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXJTdGF0ZSwgbWVzc2FnZVN5bmMpXG4gICAgc3luY1Byb3RvY29sLndyaXRlU3luY1N0ZXAyKGVuY29kZXJTdGF0ZSwgdGhpcy5kb2MpXG4gICAgYnJvYWRjYXN0QmNNZXNzYWdlKHRoaXMsIGVuY29kaW5nLnRvVWludDhBcnJheShlbmNvZGVyU3RhdGUpKVxuICAgIC8vIHdyaXRlIHF1ZXJ5QXdhcmVuZXNzXG4gICAgY29uc3QgZW5jb2RlckF3YXJlbmVzc1F1ZXJ5ID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXJBd2FyZW5lc3NRdWVyeSwgbWVzc2FnZVF1ZXJ5QXdhcmVuZXNzKVxuICAgIGJyb2FkY2FzdEJjTWVzc2FnZSh0aGlzLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlckF3YXJlbmVzc1F1ZXJ5KSlcbiAgICAvLyBicm9hZGNhc3QgbG9jYWwgYXdhcmVuZXNzIHN0YXRlXG4gICAgY29uc3QgZW5jb2RlckF3YXJlbmVzc1N0YXRlID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXJBd2FyZW5lc3NTdGF0ZSwgbWVzc2FnZUF3YXJlbmVzcylcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkoZW5jb2RlckF3YXJlbmVzc1N0YXRlLCBhd2FyZW5lc3NQcm90b2NvbC5lbmNvZGVBd2FyZW5lc3NVcGRhdGUodGhpcy5hd2FyZW5lc3MsIFt0aGlzLmRvYy5jbGllbnRJRF0pKVxuICAgIGJyb2FkY2FzdEJjTWVzc2FnZSh0aGlzLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlckF3YXJlbmVzc1N0YXRlKSlcbiAgfVxuXG4gIGRpc2Nvbm5lY3QgKCkge1xuICAgIC8vIHNpZ25hbCB0aHJvdWdoIGFsbCBhdmFpbGFibGUgc2lnbmFsaW5nIGNvbm5lY3Rpb25zXG4gICAgc2lnbmFsaW5nQ29ubnMuZm9yRWFjaChjb25uID0+IHtcbiAgICAgIGlmIChjb25uLmNvbm5lY3RlZCkge1xuICAgICAgICBjb25uLnNlbmQoeyB0eXBlOiAndW5zdWJzY3JpYmUnLCB0b3BpY3M6IFt0aGlzLm5hbWVdIH0pXG4gICAgICB9XG4gICAgfSlcbiAgICBhd2FyZW5lc3NQcm90b2NvbC5yZW1vdmVBd2FyZW5lc3NTdGF0ZXModGhpcy5hd2FyZW5lc3MsIFt0aGlzLmRvYy5jbGllbnRJRF0sICdkaXNjb25uZWN0JylcbiAgICAvLyBicm9hZGNhc3QgcGVlcklkIHJlbW92YWwgdmlhIGJyb2FkY2FzdGNoYW5uZWxcbiAgICBjb25zdCBlbmNvZGVyUGVlcklkQmMgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlclBlZXJJZEJjLCBtZXNzYWdlQmNQZWVySWQpXG4gICAgZW5jb2Rpbmcud3JpdGVVaW50OChlbmNvZGVyUGVlcklkQmMsIDApIC8vIHJlbW92ZSBwZWVySWQgZnJvbSBvdGhlciBiYyBwZWVyc1xuICAgIGVuY29kaW5nLndyaXRlVmFyU3RyaW5nKGVuY29kZXJQZWVySWRCYywgdGhpcy5wZWVySWQpXG4gICAgYnJvYWRjYXN0QmNNZXNzYWdlKHRoaXMsIGVuY29kaW5nLnRvVWludDhBcnJheShlbmNvZGVyUGVlcklkQmMpKVxuXG4gICAgYmMudW5zdWJzY3JpYmUodGhpcy5uYW1lLCB0aGlzLl9iY1N1YnNjcmliZXIpXG4gICAgdGhpcy5iY2Nvbm5lY3RlZCA9IGZhbHNlXG4gICAgdGhpcy5kb2Mub2ZmKCd1cGRhdGUnLCB0aGlzLl9kb2NVcGRhdGVIYW5kbGVyKVxuICAgIHRoaXMuYXdhcmVuZXNzLm9mZigndXBkYXRlJywgdGhpcy5fYXdhcmVuZXNzVXBkYXRlSGFuZGxlcilcbiAgICB0aGlzLndlYnJ0Y0Nvbm5zLmZvckVhY2goY29ubiA9PiBjb25uLmRlc3Ryb3koKSlcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuZGlzY29ubmVjdCgpXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgdGhpcy5fYmVmb3JlVW5sb2FkSGFuZGxlcilcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcHJvY2Vzcy5vZmYoJ2V4aXQnLCB0aGlzLl9iZWZvcmVVbmxvYWRIYW5kbGVyKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7WS5Eb2N9IGRvY1xuICogQHBhcmFtIHtXZWJydGNQcm92aWRlcn0gcHJvdmlkZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge0NyeXB0b0tleXxudWxsfSBrZXlcbiAqIEByZXR1cm4ge1Jvb219XG4gKi9cbmNvbnN0IG9wZW5Sb29tID0gKGRvYywgcHJvdmlkZXIsIG5hbWUsIGtleSkgPT4ge1xuICAvLyB0aGVyZSBtdXN0IG9ubHkgYmUgb25lIHJvb21cbiAgaWYgKHJvb21zLmhhcyhuYW1lKSkge1xuICAgIHRocm93IGVycm9yLmNyZWF0ZShgQSBZanMgRG9jIGNvbm5lY3RlZCB0byByb29tIFwiJHtuYW1lfVwiIGFscmVhZHkgZXhpc3RzIWApXG4gIH1cbiAgY29uc3Qgcm9vbSA9IG5ldyBSb29tKGRvYywgcHJvdmlkZXIsIG5hbWUsIGtleSlcbiAgcm9vbXMuc2V0KG5hbWUsIC8qKiBAdHlwZSB7Um9vbX0gKi8gKHJvb20pKVxuICByZXR1cm4gcm9vbVxufVxuXG4vKipcbiAqIEBwYXJhbSB7U2lnbmFsaW5nQ29ubn0gY29ublxuICogQHBhcmFtIHtSb29tfSByb29tXG4gKiBAcGFyYW0ge2FueX0gZGF0YVxuICovXG5jb25zdCBwdWJsaXNoU2lnbmFsaW5nTWVzc2FnZSA9IChjb25uLCByb29tLCBkYXRhKSA9PiB7XG4gIGlmIChyb29tLmtleSkge1xuICAgIGNyeXB0b3V0aWxzLmVuY3J5cHRKc29uKGRhdGEsIHJvb20ua2V5KS50aGVuKGRhdGEgPT4ge1xuICAgICAgY29ubi5zZW5kKHsgdHlwZTogJ3B1Ymxpc2gnLCB0b3BpYzogcm9vbS5uYW1lLCBkYXRhOiBidWZmZXIudG9CYXNlNjQoZGF0YSkgfSlcbiAgICB9KVxuICB9IGVsc2Uge1xuICAgIGNvbm4uc2VuZCh7IHR5cGU6ICdwdWJsaXNoJywgdG9waWM6IHJvb20ubmFtZSwgZGF0YSB9KVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTaWduYWxpbmdDb25uIGV4dGVuZHMgd3MuV2Vic29ja2V0Q2xpZW50IHtcbiAgY29uc3RydWN0b3IgKHVybCkge1xuICAgIHN1cGVyKHVybClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7U2V0PFdlYnJ0Y1Byb3ZpZGVyPn1cbiAgICAgKi9cbiAgICB0aGlzLnByb3ZpZGVycyA9IG5ldyBTZXQoKVxuICAgIHRoaXMub24oJ2Nvbm5lY3QnLCAoKSA9PiB7XG4gICAgICBsb2coYGNvbm5lY3RlZCAoJHt1cmx9KWApXG4gICAgICBjb25zdCB0b3BpY3MgPSBBcnJheS5mcm9tKHJvb21zLmtleXMoKSlcbiAgICAgIHRoaXMuc2VuZCh7IHR5cGU6ICdzdWJzY3JpYmUnLCB0b3BpY3MgfSlcbiAgICAgIHJvb21zLmZvckVhY2gocm9vbSA9PlxuICAgICAgICBwdWJsaXNoU2lnbmFsaW5nTWVzc2FnZSh0aGlzLCByb29tLCB7IHR5cGU6ICdhbm5vdW5jZScsIGZyb206IHJvb20ucGVlcklkIH0pXG4gICAgICApXG4gICAgfSlcbiAgICB0aGlzLm9uKCdtZXNzYWdlJywgbSA9PiB7XG4gICAgICBzd2l0Y2ggKG0udHlwZSkge1xuICAgICAgICBjYXNlICdwdWJsaXNoJzoge1xuICAgICAgICAgIGNvbnN0IHJvb21OYW1lID0gbS50b3BpY1xuICAgICAgICAgIGNvbnN0IHJvb20gPSByb29tcy5nZXQocm9vbU5hbWUpXG4gICAgICAgICAgaWYgKHJvb20gPT0gbnVsbCB8fCB0eXBlb2Ygcm9vbU5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgZXhlY01lc3NhZ2UgPSBkYXRhID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHdlYnJ0Y0Nvbm5zID0gcm9vbS53ZWJydGNDb25uc1xuICAgICAgICAgICAgY29uc3QgcGVlcklkID0gcm9vbS5wZWVySWRcbiAgICAgICAgICAgIGlmIChkYXRhID09IG51bGwgfHwgZGF0YS5mcm9tID09PSBwZWVySWQgfHwgKGRhdGEudG8gIT09IHVuZGVmaW5lZCAmJiBkYXRhLnRvICE9PSBwZWVySWQpIHx8IHJvb20uYmNDb25ucy5oYXMoZGF0YS5mcm9tKSkge1xuICAgICAgICAgICAgICAvLyBpZ25vcmUgbWVzc2FnZXMgdGhhdCBhcmUgbm90IGFkZHJlc3NlZCB0byB0aGlzIGNvbm4sIG9yIGZyb20gY2xpZW50cyB0aGF0IGFyZSBjb25uZWN0ZWQgdmlhIGJyb2FkY2FzdGNoYW5uZWxcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBlbWl0UGVlckNoYW5nZSA9IHdlYnJ0Y0Nvbm5zLmhhcyhkYXRhLmZyb20pXG4gICAgICAgICAgICAgID8gKCkgPT4ge31cbiAgICAgICAgICAgICAgOiAoKSA9PlxuICAgICAgICAgICAgICAgIHJvb20ucHJvdmlkZXIuZW1pdCgncGVlcnMnLCBbe1xuICAgICAgICAgICAgICAgICAgcmVtb3ZlZDogW10sXG4gICAgICAgICAgICAgICAgICBhZGRlZDogW2RhdGEuZnJvbV0sXG4gICAgICAgICAgICAgICAgICB3ZWJydGNQZWVyczogQXJyYXkuZnJvbShyb29tLndlYnJ0Y0Nvbm5zLmtleXMoKSksXG4gICAgICAgICAgICAgICAgICBiY1BlZXJzOiBBcnJheS5mcm9tKHJvb20uYmNDb25ucylcbiAgICAgICAgICAgICAgICB9XSlcbiAgICAgICAgICAgIHN3aXRjaCAoZGF0YS50eXBlKSB7XG4gICAgICAgICAgICAgIGNhc2UgJ2Fubm91bmNlJzpcbiAgICAgICAgICAgICAgICBpZiAod2VicnRjQ29ubnMuc2l6ZSA8IHJvb20ucHJvdmlkZXIubWF4Q29ubnMpIHtcbiAgICAgICAgICAgICAgICAgIG1hcC5zZXRJZlVuZGVmaW5lZCh3ZWJydGNDb25ucywgZGF0YS5mcm9tLCAoKSA9PiBuZXcgV2VicnRjQ29ubih0aGlzLCB0cnVlLCBkYXRhLmZyb20sIHJvb20pKVxuICAgICAgICAgICAgICAgICAgZW1pdFBlZXJDaGFuZ2UoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdzaWduYWwnOlxuICAgICAgICAgICAgICAgIGlmIChkYXRhLnNpZ25hbC50eXBlID09PSAnb2ZmZXInKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ0Nvbm4gPSB3ZWJydGNDb25ucy5nZXQoZGF0YS5mcm9tKVxuICAgICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nQ29ubikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZW1vdGVUb2tlbiA9IGRhdGEudG9rZW5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9jYWxUb2tlbiA9IGV4aXN0aW5nQ29ubi5nbGFyZVRva2VuXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2NhbFRva2VuICYmIGxvY2FsVG9rZW4gPiByZW1vdGVUb2tlbikge1xuICAgICAgICAgICAgICAgICAgICAgIGxvZygnb2ZmZXIgcmVqZWN0ZWQ6ICcsIGRhdGEuZnJvbSlcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB3ZSBkb24ndCByZWplY3QgdGhlIG9mZmVyLCB3ZSB3aWxsIGJlIGFjY2VwdGluZyBpdCBhbmQgYW5zd2VyaW5nIGl0XG4gICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nQ29ubi5nbGFyZVRva2VuID0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkYXRhLnNpZ25hbC50eXBlID09PSAnYW5zd2VyJykge1xuICAgICAgICAgICAgICAgICAgbG9nKCdvZmZlciBhbnN3ZXJlZCBieTogJywgZGF0YS5mcm9tKVxuICAgICAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdDb25uID0gd2VicnRjQ29ubnMuZ2V0KGRhdGEuZnJvbSlcbiAgICAgICAgICAgICAgICAgIGV4aXN0aW5nQ29ubi5nbGFyZVRva2VuID0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkYXRhLnRvID09PSBwZWVySWQpIHtcbiAgICAgICAgICAgICAgICAgIG1hcC5zZXRJZlVuZGVmaW5lZCh3ZWJydGNDb25ucywgZGF0YS5mcm9tLCAoKSA9PiBuZXcgV2VicnRjQ29ubih0aGlzLCBmYWxzZSwgZGF0YS5mcm9tLCByb29tKSkucGVlci5zaWduYWwoZGF0YS5zaWduYWwpXG4gICAgICAgICAgICAgICAgICBlbWl0UGVlckNoYW5nZSgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyb29tLmtleSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtLmRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgIGNyeXB0b3V0aWxzLmRlY3J5cHRKc29uKGJ1ZmZlci5mcm9tQmFzZTY0KG0uZGF0YSksIHJvb20ua2V5KS50aGVuKGV4ZWNNZXNzYWdlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleGVjTWVzc2FnZShtLmRhdGEpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLm9uKCdkaXNjb25uZWN0JywgKCkgPT4gbG9nKGBkaXNjb25uZWN0ICgke3VybH0pYCkpXG4gIH1cbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBQcm92aWRlck9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7QXJyYXk8c3RyaW5nPn0gW3NpZ25hbGluZ11cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbcGFzc3dvcmRdXG4gKiBAcHJvcGVydHkge2F3YXJlbmVzc1Byb3RvY29sLkF3YXJlbmVzc30gW2F3YXJlbmVzc11cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbWF4Q29ubnNdXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtmaWx0ZXJCY0Nvbm5zXVxuICogQHByb3BlcnR5IHthbnl9IFtwZWVyT3B0c11cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7V2VicnRjUHJvdmlkZXJ9IHByb3ZpZGVyXG4gKi9cbmNvbnN0IGVtaXRTdGF0dXMgPSBwcm92aWRlciA9PiB7XG4gIHByb3ZpZGVyLmVtaXQoJ3N0YXR1cycsIFt7XG4gICAgY29ubmVjdGVkOiBwcm92aWRlci5jb25uZWN0ZWRcbiAgfV0pXG59XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gV2VicnRjUHJvdmlkZXJFdmVudHNcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oe2Nvbm5lY3RlZDpib29sZWFufSk6dm9pZH0gV2VicnRjUHJvdmlkZXJFdmVudC5zdGF0dXNcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oe3N5bmNlZDpib29sZWFufSk6dm9pZH0gV2VicnRjUHJvdmlkZXJFdmVudC5zeW5jZWRcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24oe2FkZGVkOkFycmF5PHN0cmluZz4scmVtb3ZlZDpBcnJheTxzdHJpbmc+LHdlYnJ0Y1BlZXJzOkFycmF5PHN0cmluZz4sYmNQZWVyczpBcnJheTxzdHJpbmc+fSk6dm9pZH0gV2VicnRjUHJvdmlkZXJFdmVudC5wZWVyc1xuICovXG5cbi8qKlxuICogQGV4dGVuZHMgT2JzZXJ2YWJsZVYyPFdlYnJ0Y1Byb3ZpZGVyRXZlbnRzPlxuICovXG5leHBvcnQgY2xhc3MgV2VicnRjUHJvdmlkZXIgZXh0ZW5kcyBPYnNlcnZhYmxlVjIge1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvb21OYW1lXG4gICAqIEBwYXJhbSB7WS5Eb2N9IGRvY1xuICAgKiBAcGFyYW0ge1Byb3ZpZGVyT3B0aW9ucz99IG9wdHNcbiAgICovXG4gIGNvbnN0cnVjdG9yIChcbiAgICByb29tTmFtZSxcbiAgICBkb2MsXG4gICAge1xuICAgICAgc2lnbmFsaW5nID0gWyd3c3M6Ly95LXdlYnJ0Yy1ldS5mbHkuZGV2J10sXG4gICAgICBwYXNzd29yZCA9IG51bGwsXG4gICAgICBhd2FyZW5lc3MgPSBuZXcgYXdhcmVuZXNzUHJvdG9jb2wuQXdhcmVuZXNzKGRvYyksXG4gICAgICBtYXhDb25ucyA9IDIwICsgbWF0aC5mbG9vcihyYW5kb20ucmFuZCgpICogMTUpLCAvLyB0aGUgcmFuZG9tIGZhY3RvciByZWR1Y2VzIHRoZSBjaGFuY2UgdGhhdCBuIGNsaWVudHMgZm9ybSBhIGNsdXN0ZXJcbiAgICAgIGZpbHRlckJjQ29ubnMgPSB0cnVlLFxuICAgICAgcGVlck9wdHMgPSB7fSAvLyBzaW1wbGUtcGVlciBvcHRpb25zLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9zaW1wbGUtcGVlciNwZWVyLS1uZXctcGVlcm9wdHNcbiAgICB9ID0ge31cbiAgKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMucm9vbU5hbWUgPSByb29tTmFtZVxuICAgIHRoaXMuZG9jID0gZG9jXG4gICAgdGhpcy5maWx0ZXJCY0Nvbm5zID0gZmlsdGVyQmNDb25uc1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHthd2FyZW5lc3NQcm90b2NvbC5Bd2FyZW5lc3N9XG4gICAgICovXG4gICAgdGhpcy5hd2FyZW5lc3MgPSBhd2FyZW5lc3NcbiAgICB0aGlzLnNob3VsZENvbm5lY3QgPSBmYWxzZVxuICAgIHRoaXMuc2lnbmFsaW5nVXJscyA9IHNpZ25hbGluZ1xuICAgIHRoaXMuc2lnbmFsaW5nQ29ubnMgPSBbXVxuICAgIHRoaXMubWF4Q29ubnMgPSBtYXhDb25uc1xuICAgIHRoaXMucGVlck9wdHMgPSBwZWVyT3B0c1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtQcm9taXNlTGlrZTxDcnlwdG9LZXkgfCBudWxsPn1cbiAgICAgKi9cbiAgICB0aGlzLmtleSA9IHBhc3N3b3JkID8gY3J5cHRvdXRpbHMuZGVyaXZlS2V5KHBhc3N3b3JkLCByb29tTmFtZSkgOiAvKiogQHR5cGUge1Byb21pc2VMaWtlPG51bGw+fSAqLyAocHJvbWlzZS5yZXNvbHZlKG51bGwpKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtSb29tfG51bGx9XG4gICAgICovXG4gICAgdGhpcy5yb29tID0gbnVsbFxuICAgIHRoaXMua2V5LnRoZW4oa2V5ID0+IHtcbiAgICAgIHRoaXMucm9vbSA9IG9wZW5Sb29tKGRvYywgdGhpcywgcm9vbU5hbWUsIGtleSlcbiAgICAgIGlmICh0aGlzLnNob3VsZENvbm5lY3QpIHtcbiAgICAgICAgdGhpcy5yb29tLmNvbm5lY3QoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yb29tLmRpc2Nvbm5lY3QoKVxuICAgICAgfVxuICAgICAgZW1pdFN0YXR1cyh0aGlzKVxuICAgIH0pXG4gICAgdGhpcy5jb25uZWN0KClcbiAgICB0aGlzLmRlc3Ryb3kgPSB0aGlzLmRlc3Ryb3kuYmluZCh0aGlzKVxuICAgIGRvYy5vbignZGVzdHJveScsIHRoaXMuZGVzdHJveSlcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgcHJvdmlkZXIgaXMgbG9va2luZyBmb3Igb3RoZXIgcGVlcnMuXG4gICAqXG4gICAqIE90aGVyIHBlZXJzIGNhbiBiZSBmb3VuZCB2aWEgc2lnbmFsaW5nIHNlcnZlcnMgb3IgdmlhIGJyb2FkY2FzdGNoYW5uZWwgKGNyb3NzIGJyb3dzZXItdGFiXG4gICAqIGNvbW11bmljYXRpb24pLiBZb3UgbmV2ZXIga25vdyB3aGVuIHlvdSBhcmUgY29ubmVjdGVkIHRvIGFsbCBwZWVycy4gWW91IGFsc28gZG9uJ3Qga25vdyBpZlxuICAgKiB0aGVyZSBhcmUgb3RoZXIgcGVlcnMuIGNvbm5lY3RlZCBkb2Vzbid0IG1lYW4gdGhhdCB5b3UgYXJlIGNvbm5lY3RlZCB0byBhbnkgcGh5c2ljYWwgcGVlcnNcbiAgICogd29ya2luZyBvbiB0aGUgc2FtZSByZXNvdXJjZSBhcyB5b3UuIEl0IGRvZXMgbm90IGNoYW5nZSB1bmxlc3MgeW91IGNhbGwgcHJvdmlkZXIuZGlzY29ubmVjdCgpXG4gICAqXG4gICAqIGB0aGlzLm9uKCdzdGF0dXMnLCAoZXZlbnQpID0+IHsgY29uc29sZS5sb2coZXZlbnQuY29ubmVjdGVkKSB9KWBcbiAgICpcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICBnZXQgY29ubmVjdGVkICgpIHtcbiAgICByZXR1cm4gdGhpcy5yb29tICE9PSBudWxsICYmIHRoaXMuc2hvdWxkQ29ubmVjdFxuICB9XG5cbiAgY29ubmVjdCAoKSB7XG4gICAgdGhpcy5zaG91bGRDb25uZWN0ID0gdHJ1ZVxuICAgIHRoaXMuc2lnbmFsaW5nVXJscy5mb3JFYWNoKHVybCA9PiB7XG4gICAgICBjb25zdCBzaWduYWxpbmdDb25uID0gbWFwLnNldElmVW5kZWZpbmVkKHNpZ25hbGluZ0Nvbm5zLCB1cmwsICgpID0+IG5ldyBTaWduYWxpbmdDb25uKHVybCkpXG4gICAgICB0aGlzLnNpZ25hbGluZ0Nvbm5zLnB1c2goc2lnbmFsaW5nQ29ubilcbiAgICAgIHNpZ25hbGluZ0Nvbm4ucHJvdmlkZXJzLmFkZCh0aGlzKVxuICAgIH0pXG4gICAgaWYgKHRoaXMucm9vbSkge1xuICAgICAgdGhpcy5yb29tLmNvbm5lY3QoKVxuICAgICAgZW1pdFN0YXR1cyh0aGlzKVxuICAgIH1cbiAgfVxuXG4gIGRpc2Nvbm5lY3QgKCkge1xuICAgIHRoaXMuc2hvdWxkQ29ubmVjdCA9IGZhbHNlXG4gICAgdGhpcy5zaWduYWxpbmdDb25ucy5mb3JFYWNoKGNvbm4gPT4ge1xuICAgICAgY29ubi5wcm92aWRlcnMuZGVsZXRlKHRoaXMpXG4gICAgICBpZiAoY29ubi5wcm92aWRlcnMuc2l6ZSA9PT0gMCkge1xuICAgICAgICBjb25uLmRlc3Ryb3koKVxuICAgICAgICBzaWduYWxpbmdDb25ucy5kZWxldGUoY29ubi51cmwpXG4gICAgICB9XG4gICAgfSlcbiAgICBpZiAodGhpcy5yb29tKSB7XG4gICAgICB0aGlzLnJvb20uZGlzY29ubmVjdCgpXG4gICAgICBlbWl0U3RhdHVzKHRoaXMpXG4gICAgfVxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgdGhpcy5kb2Mub2ZmKCdkZXN0cm95JywgdGhpcy5kZXN0cm95KVxuICAgIC8vIG5lZWQgdG8gd2FpdCBmb3Iga2V5IGJlZm9yZSBkZWxldGluZyByb29tXG4gICAgdGhpcy5rZXkudGhlbigoKSA9PiB7XG4gICAgICAvKiogQHR5cGUge1Jvb219ICovICh0aGlzLnJvb20pLmRlc3Ryb3koKVxuICAgICAgcm9vbXMuZGVsZXRlKHRoaXMucm9vbU5hbWUpXG4gICAgfSlcbiAgICBzdXBlci5kZXN0cm95KClcbiAgfVxufVxuIiwgIi8qKlxuICogQG1vZHVsZSBzeW5jLXByb3RvY29sXG4gKi9cblxuaW1wb3J0ICogYXMgZW5jb2RpbmcgZnJvbSAnbGliMC9lbmNvZGluZydcbmltcG9ydCAqIGFzIGRlY29kaW5nIGZyb20gJ2xpYjAvZGVjb2RpbmcnXG5pbXBvcnQgKiBhcyBZIGZyb20gJ3lqcydcblxuLyoqXG4gKiBAdHlwZWRlZiB7TWFwPG51bWJlciwgbnVtYmVyPn0gU3RhdGVNYXBcbiAqL1xuXG4vKipcbiAqIENvcmUgWWpzIGRlZmluZXMgdHdvIG1lc3NhZ2UgdHlwZXM6XG4gKiBcdTIwMjIgWWpzU3luY1N0ZXAxOiBJbmNsdWRlcyB0aGUgU3RhdGUgU2V0IG9mIHRoZSBzZW5kaW5nIGNsaWVudC4gV2hlbiByZWNlaXZlZCwgdGhlIGNsaWVudCBzaG91bGQgcmVwbHkgd2l0aCBZanNTeW5jU3RlcDIuXG4gKiBcdTIwMjIgWWpzU3luY1N0ZXAyOiBJbmNsdWRlcyBhbGwgbWlzc2luZyBzdHJ1Y3RzIGFuZCB0aGUgY29tcGxldGUgZGVsZXRlIHNldC4gV2hlbiByZWNlaXZlZCwgdGhlIGNsaWVudCBpcyBhc3N1cmVkIHRoYXQgaXRcbiAqICAgcmVjZWl2ZWQgYWxsIGluZm9ybWF0aW9uIGZyb20gdGhlIHJlbW90ZSBjbGllbnQuXG4gKlxuICogSW4gYSBwZWVyLXRvLXBlZXIgbmV0d29yaywgeW91IG1heSB3YW50IHRvIGludHJvZHVjZSBhIFN5bmNEb25lIG1lc3NhZ2UgdHlwZS4gQm90aCBwYXJ0aWVzIHNob3VsZCBpbml0aWF0ZSB0aGUgY29ubmVjdGlvblxuICogd2l0aCBTeW5jU3RlcDEuIFdoZW4gYSBjbGllbnQgcmVjZWl2ZWQgU3luY1N0ZXAyLCBpdCBzaG91bGQgcmVwbHkgd2l0aCBTeW5jRG9uZS4gV2hlbiB0aGUgbG9jYWwgY2xpZW50IHJlY2VpdmVkIGJvdGhcbiAqIFN5bmNTdGVwMiBhbmQgU3luY0RvbmUsIGl0IGlzIGFzc3VyZWQgdGhhdCBpdCBpcyBzeW5jZWQgdG8gdGhlIHJlbW90ZSBjbGllbnQuXG4gKlxuICogSW4gYSBjbGllbnQtc2VydmVyIG1vZGVsLCB5b3Ugd2FudCB0byBoYW5kbGUgdGhpcyBkaWZmZXJlbnRseTogVGhlIGNsaWVudCBzaG91bGQgaW5pdGlhdGUgdGhlIGNvbm5lY3Rpb24gd2l0aCBTeW5jU3RlcDEuXG4gKiBXaGVuIHRoZSBzZXJ2ZXIgcmVjZWl2ZXMgU3luY1N0ZXAxLCBpdCBzaG91bGQgcmVwbHkgd2l0aCBTeW5jU3RlcDIgaW1tZWRpYXRlbHkgZm9sbG93ZWQgYnkgU3luY1N0ZXAxLiBUaGUgY2xpZW50IHJlcGxpZXNcbiAqIHdpdGggU3luY1N0ZXAyIHdoZW4gaXQgcmVjZWl2ZXMgU3luY1N0ZXAxLiBPcHRpb25hbGx5IHRoZSBzZXJ2ZXIgbWF5IHNlbmQgYSBTeW5jRG9uZSBhZnRlciBpdCByZWNlaXZlZCBTeW5jU3RlcDIsIHNvIHRoZVxuICogY2xpZW50IGtub3dzIHRoYXQgdGhlIHN5bmMgaXMgZmluaXNoZWQuICBUaGVyZSBhcmUgdHdvIHJlYXNvbnMgZm9yIHRoaXMgbW9yZSBlbGFib3JhdGVkIHN5bmMgbW9kZWw6IDEuIFRoaXMgcHJvdG9jb2wgY2FuXG4gKiBlYXNpbHkgYmUgaW1wbGVtZW50ZWQgb24gdG9wIG9mIGh0dHAgYW5kIHdlYnNvY2tldHMuIDIuIFRoZSBzZXJ2ZXIgc2hvdWxkIG9ubHkgcmVwbHkgdG8gcmVxdWVzdHMsIGFuZCBub3QgaW5pdGlhdGUgdGhlbS5cbiAqIFRoZXJlZm9yZSBpdCBpcyBuZWNlc3NhcnkgdGhhdCB0aGUgY2xpZW50IGluaXRpYXRlcyB0aGUgc3luYy5cbiAqXG4gKiBDb25zdHJ1Y3Rpb24gb2YgYSBtZXNzYWdlOlxuICogW21lc3NhZ2VUeXBlIDogdmFyVWludCwgbWVzc2FnZSBkZWZpbml0aW9uLi5dXG4gKlxuICogTm90ZTogQSBtZXNzYWdlIGRvZXMgbm90IGluY2x1ZGUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHJvb20gbmFtZS4gVGhpcyBtdXN0IHRvIGJlIGhhbmRsZWQgYnkgdGhlIHVwcGVyIGxheWVyIHByb3RvY29sIVxuICpcbiAqIHN0cmluZ2lmeVttZXNzYWdlVHlwZV0gc3RyaW5naWZpZXMgYSBtZXNzYWdlIGRlZmluaXRpb24gKG1lc3NhZ2VUeXBlIGlzIGFscmVhZHkgcmVhZCBmcm9tIHRoZSBidWZmZmVyKVxuICovXG5cbmV4cG9ydCBjb25zdCBtZXNzYWdlWWpzU3luY1N0ZXAxID0gMFxuZXhwb3J0IGNvbnN0IG1lc3NhZ2VZanNTeW5jU3RlcDIgPSAxXG5leHBvcnQgY29uc3QgbWVzc2FnZVlqc1VwZGF0ZSA9IDJcblxuLyoqXG4gKiBDcmVhdGUgYSBzeW5jIHN0ZXAgMSBtZXNzYWdlIGJhc2VkIG9uIHRoZSBzdGF0ZSBvZiB0aGUgY3VycmVudCBzaGFyZWQgZG9jdW1lbnQuXG4gKlxuICogQHBhcmFtIHtlbmNvZGluZy5FbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1kuRG9jfSBkb2NcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlU3luY1N0ZXAxID0gKGVuY29kZXIsIGRvYykgPT4ge1xuICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgbWVzc2FnZVlqc1N5bmNTdGVwMSlcbiAgY29uc3Qgc3YgPSBZLmVuY29kZVN0YXRlVmVjdG9yKGRvYylcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIHN2KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7ZW5jb2RpbmcuRW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtZLkRvY30gZG9jXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IFtlbmNvZGVkU3RhdGVWZWN0b3JdXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZVN5bmNTdGVwMiA9IChlbmNvZGVyLCBkb2MsIGVuY29kZWRTdGF0ZVZlY3RvcikgPT4ge1xuICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgbWVzc2FnZVlqc1N5bmNTdGVwMilcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIFkuZW5jb2RlU3RhdGVBc1VwZGF0ZShkb2MsIGVuY29kZWRTdGF0ZVZlY3RvcikpXG59XG5cbi8qKlxuICogUmVhZCBTeW5jU3RlcDEgbWVzc2FnZSBhbmQgcmVwbHkgd2l0aCBTeW5jU3RlcDIuXG4gKlxuICogQHBhcmFtIHtkZWNvZGluZy5EZWNvZGVyfSBkZWNvZGVyIFRoZSByZXBseSB0byB0aGUgcmVjZWl2ZWQgbWVzc2FnZVxuICogQHBhcmFtIHtlbmNvZGluZy5FbmNvZGVyfSBlbmNvZGVyIFRoZSByZWNlaXZlZCBtZXNzYWdlXG4gKiBAcGFyYW0ge1kuRG9jfSBkb2NcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRTeW5jU3RlcDEgPSAoZGVjb2RlciwgZW5jb2RlciwgZG9jKSA9PlxuICB3cml0ZVN5bmNTdGVwMihlbmNvZGVyLCBkb2MsIGRlY29kaW5nLnJlYWRWYXJVaW50OEFycmF5KGRlY29kZXIpKVxuXG4vKipcbiAqIFJlYWQgYW5kIGFwcGx5IFN0cnVjdHMgYW5kIHRoZW4gRGVsZXRlU3RvcmUgdG8gYSB5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7ZGVjb2RpbmcuRGVjb2Rlcn0gZGVjb2RlclxuICogQHBhcmFtIHtZLkRvY30gZG9jXG4gKiBAcGFyYW0ge2FueX0gdHJhbnNhY3Rpb25PcmlnaW5cbiAqIEBwYXJhbSB7KGVycm9yOkVycm9yKT0+YW55fSBbZXJyb3JIYW5kbGVyXVxuICovXG5leHBvcnQgY29uc3QgcmVhZFN5bmNTdGVwMiA9IChkZWNvZGVyLCBkb2MsIHRyYW5zYWN0aW9uT3JpZ2luLCBlcnJvckhhbmRsZXIpID0+IHtcbiAgdHJ5IHtcbiAgICBZLmFwcGx5VXBkYXRlKGRvYywgZGVjb2RpbmcucmVhZFZhclVpbnQ4QXJyYXkoZGVjb2RlciksIHRyYW5zYWN0aW9uT3JpZ2luKVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChlcnJvckhhbmRsZXIgIT0gbnVsbCkgZXJyb3JIYW5kbGVyKC8qKiBAdHlwZSB7RXJyb3J9ICovIChlcnJvcikpXG4gICAgLy8gVGhpcyBjYXRjaGVzIGVycm9ycyB0aGF0IGFyZSB0aHJvd24gYnkgZXZlbnQgaGFuZGxlcnNcbiAgICBjb25zb2xlLmVycm9yKCdDYXVnaHQgZXJyb3Igd2hpbGUgaGFuZGxpbmcgYSBZanMgdXBkYXRlJywgZXJyb3IpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge2VuY29kaW5nLkVuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZVVwZGF0ZSA9IChlbmNvZGVyLCB1cGRhdGUpID0+IHtcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIG1lc3NhZ2VZanNVcGRhdGUpXG4gIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNvZGVyLCB1cGRhdGUpXG59XG5cbi8qKlxuICogUmVhZCBhbmQgYXBwbHkgU3RydWN0cyBhbmQgdGhlbiBEZWxldGVTdG9yZSB0byBhIHkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtkZWNvZGluZy5EZWNvZGVyfSBkZWNvZGVyXG4gKiBAcGFyYW0ge1kuRG9jfSBkb2NcbiAqIEBwYXJhbSB7YW55fSB0cmFuc2FjdGlvbk9yaWdpblxuICogQHBhcmFtIHsoZXJyb3I6RXJyb3IpPT5hbnl9IFtlcnJvckhhbmRsZXJdXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkVXBkYXRlID0gcmVhZFN5bmNTdGVwMlxuXG4vKipcbiAqIEBwYXJhbSB7ZGVjb2RpbmcuRGVjb2Rlcn0gZGVjb2RlciBBIG1lc3NhZ2UgcmVjZWl2ZWQgZnJvbSBhbm90aGVyIGNsaWVudFxuICogQHBhcmFtIHtlbmNvZGluZy5FbmNvZGVyfSBlbmNvZGVyIFRoZSByZXBseSBtZXNzYWdlLiBEb2VzIG5vdCBuZWVkIHRvIGJlIHNlbnQgaWYgZW1wdHkuXG4gKiBAcGFyYW0ge1kuRG9jfSBkb2NcbiAqIEBwYXJhbSB7YW55fSB0cmFuc2FjdGlvbk9yaWdpblxuICogQHBhcmFtIHsoZXJyb3I6RXJyb3IpPT5hbnl9IFtlcnJvckhhbmRsZXJdIE9wdGlvbmFsIGVycm9yIGhhbmRsZXIgdGhhdCBjYXRjaGVzIGVycm9ycyB3aGVuIHJlYWRpbmcgWWpzIG1lc3NhZ2VzLlxuICovXG5leHBvcnQgY29uc3QgcmVhZFN5bmNNZXNzYWdlID0gKGRlY29kZXIsIGVuY29kZXIsIGRvYywgdHJhbnNhY3Rpb25PcmlnaW4sIGVycm9ySGFuZGxlcikgPT4ge1xuICBjb25zdCBtZXNzYWdlVHlwZSA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIpXG4gIHN3aXRjaCAobWVzc2FnZVR5cGUpIHtcbiAgICBjYXNlIG1lc3NhZ2VZanNTeW5jU3RlcDE6XG4gICAgICByZWFkU3luY1N0ZXAxKGRlY29kZXIsIGVuY29kZXIsIGRvYylcbiAgICAgIGJyZWFrXG4gICAgY2FzZSBtZXNzYWdlWWpzU3luY1N0ZXAyOlxuICAgICAgcmVhZFN5bmNTdGVwMihkZWNvZGVyLCBkb2MsIHRyYW5zYWN0aW9uT3JpZ2luLCBlcnJvckhhbmRsZXIpXG4gICAgICBicmVha1xuICAgIGNhc2UgbWVzc2FnZVlqc1VwZGF0ZTpcbiAgICAgIHJlYWRVcGRhdGUoZGVjb2RlciwgZG9jLCB0cmFuc2FjdGlvbk9yaWdpbiwgZXJyb3JIYW5kbGVyKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIG1lc3NhZ2UgdHlwZScpXG4gIH1cbiAgcmV0dXJuIG1lc3NhZ2VUeXBlXG59XG4iLCAiLyoqXG4gKiBAbW9kdWxlIGF3YXJlbmVzcy1wcm90b2NvbFxuICovXG5cbmltcG9ydCAqIGFzIGVuY29kaW5nIGZyb20gJ2xpYjAvZW5jb2RpbmcnXG5pbXBvcnQgKiBhcyBkZWNvZGluZyBmcm9tICdsaWIwL2RlY29kaW5nJ1xuaW1wb3J0ICogYXMgdGltZSBmcm9tICdsaWIwL3RpbWUnXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJ2xpYjAvbWF0aCdcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdsaWIwL29ic2VydmFibGUnXG5pbXBvcnQgKiBhcyBmIGZyb20gJ2xpYjAvZnVuY3Rpb24nXG5pbXBvcnQgKiBhcyBZIGZyb20gJ3lqcycgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuXG5leHBvcnQgY29uc3Qgb3V0ZGF0ZWRUaW1lb3V0ID0gMzAwMDBcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBNZXRhQ2xpZW50U3RhdGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBNZXRhQ2xpZW50U3RhdGUuY2xvY2tcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBNZXRhQ2xpZW50U3RhdGUubGFzdFVwZGF0ZWQgdW5peCB0aW1lc3RhbXBcbiAqL1xuXG4vKipcbiAqIFRoZSBBd2FyZW5lc3MgY2xhc3MgaW1wbGVtZW50cyBhIHNpbXBsZSBzaGFyZWQgc3RhdGUgcHJvdG9jb2wgdGhhdCBjYW4gYmUgdXNlZCBmb3Igbm9uLXBlcnNpc3RlbnQgZGF0YSBsaWtlIGF3YXJlbmVzcyBpbmZvcm1hdGlvblxuICogKGN1cnNvciwgdXNlcm5hbWUsIHN0YXR1cywgLi4pLiBFYWNoIGNsaWVudCBjYW4gdXBkYXRlIGl0cyBvd24gbG9jYWwgc3RhdGUgYW5kIGxpc3RlbiB0byBzdGF0ZSBjaGFuZ2VzIG9mXG4gKiByZW1vdGUgY2xpZW50cy4gRXZlcnkgY2xpZW50IG1heSBzZXQgYSBzdGF0ZSBvZiBhIHJlbW90ZSBwZWVyIHRvIGBudWxsYCB0byBtYXJrIHRoZSBjbGllbnQgYXMgb2ZmbGluZS5cbiAqXG4gKiBFYWNoIGNsaWVudCBpcyBpZGVudGlmaWVkIGJ5IGEgdW5pcXVlIGNsaWVudCBpZCAoc29tZXRoaW5nIHdlIGJvcnJvdyBmcm9tIGBkb2MuY2xpZW50SURgKS4gQSBjbGllbnQgY2FuIG92ZXJyaWRlXG4gKiBpdHMgb3duIHN0YXRlIGJ5IHByb3BhZ2F0aW5nIGEgbWVzc2FnZSB3aXRoIGFuIGluY3JlYXNpbmcgdGltZXN0YW1wIChgY2xvY2tgKS4gSWYgc3VjaCBhIG1lc3NhZ2UgaXMgcmVjZWl2ZWQsIGl0IGlzXG4gKiBhcHBsaWVkIGlmIHRoZSBrbm93biBzdGF0ZSBvZiB0aGF0IGNsaWVudCBpcyBvbGRlciB0aGFuIHRoZSBuZXcgc3RhdGUgKGBjbG9jayA8IG5ld0Nsb2NrYCkuIElmIGEgY2xpZW50IHRoaW5rcyB0aGF0XG4gKiBhIHJlbW90ZSBjbGllbnQgaXMgb2ZmbGluZSwgaXQgbWF5IHByb3BhZ2F0ZSBhIG1lc3NhZ2Ugd2l0aFxuICogYHsgY2xvY2s6IGN1cnJlbnRDbGllbnRDbG9jaywgc3RhdGU6IG51bGwsIGNsaWVudDogcmVtb3RlQ2xpZW50IH1gLiBJZiBzdWNoIGFcbiAqIG1lc3NhZ2UgaXMgcmVjZWl2ZWQsIGFuZCB0aGUga25vd24gY2xvY2sgb2YgdGhhdCBjbGllbnQgZXF1YWxzIHRoZSByZWNlaXZlZCBjbG9jaywgaXQgd2lsbCBvdmVycmlkZSB0aGUgc3RhdGUgd2l0aCBgbnVsbGAuXG4gKlxuICogQmVmb3JlIGEgY2xpZW50IGRpc2Nvbm5lY3RzLCBpdCBzaG91bGQgcHJvcGFnYXRlIGEgYG51bGxgIHN0YXRlIHdpdGggYW4gdXBkYXRlZCBjbG9jay5cbiAqXG4gKiBBd2FyZW5lc3Mgc3RhdGVzIG11c3QgYmUgdXBkYXRlZCBldmVyeSAzMCBzZWNvbmRzLiBPdGhlcndpc2UgdGhlIEF3YXJlbmVzcyBpbnN0YW5jZSB3aWxsIGRlbGV0ZSB0aGUgY2xpZW50IHN0YXRlLlxuICpcbiAqIEBleHRlbmRzIHtPYnNlcnZhYmxlPHN0cmluZz59XG4gKi9cbmV4cG9ydCBjbGFzcyBBd2FyZW5lc3MgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7WS5Eb2N9IGRvY1xuICAgKi9cbiAgY29uc3RydWN0b3IgKGRvYykge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLmRvYyA9IGRvY1xuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5jbGllbnRJRCA9IGRvYy5jbGllbnRJRFxuICAgIC8qKlxuICAgICAqIE1hcHMgZnJvbSBjbGllbnQgaWQgdG8gY2xpZW50IHN0YXRlXG4gICAgICogQHR5cGUge01hcDxudW1iZXIsIE9iamVjdDxzdHJpbmcsIGFueT4+fVxuICAgICAqL1xuICAgIHRoaXMuc3RhdGVzID0gbmV3IE1hcCgpXG4gICAgLyoqXG4gICAgICogQHR5cGUge01hcDxudW1iZXIsIE1ldGFDbGllbnRTdGF0ZT59XG4gICAgICovXG4gICAgdGhpcy5tZXRhID0gbmV3IE1hcCgpXG4gICAgdGhpcy5fY2hlY2tJbnRlcnZhbCA9IC8qKiBAdHlwZSB7YW55fSAqLyAoc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgY29uc3Qgbm93ID0gdGltZS5nZXRVbml4VGltZSgpXG4gICAgICBpZiAodGhpcy5nZXRMb2NhbFN0YXRlKCkgIT09IG51bGwgJiYgKG91dGRhdGVkVGltZW91dCAvIDIgPD0gbm93IC0gLyoqIEB0eXBlIHt7bGFzdFVwZGF0ZWQ6bnVtYmVyfX0gKi8gKHRoaXMubWV0YS5nZXQodGhpcy5jbGllbnRJRCkpLmxhc3RVcGRhdGVkKSkge1xuICAgICAgICAvLyByZW5ldyBsb2NhbCBjbG9ja1xuICAgICAgICB0aGlzLnNldExvY2FsU3RhdGUodGhpcy5nZXRMb2NhbFN0YXRlKCkpXG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAqIEB0eXBlIHtBcnJheTxudW1iZXI+fVxuICAgICAgICovXG4gICAgICBjb25zdCByZW1vdmUgPSBbXVxuICAgICAgdGhpcy5tZXRhLmZvckVhY2goKG1ldGEsIGNsaWVudGlkKSA9PiB7XG4gICAgICAgIGlmIChjbGllbnRpZCAhPT0gdGhpcy5jbGllbnRJRCAmJiBvdXRkYXRlZFRpbWVvdXQgPD0gbm93IC0gbWV0YS5sYXN0VXBkYXRlZCAmJiB0aGlzLnN0YXRlcy5oYXMoY2xpZW50aWQpKSB7XG4gICAgICAgICAgcmVtb3ZlLnB1c2goY2xpZW50aWQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICBpZiAocmVtb3ZlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVtb3ZlQXdhcmVuZXNzU3RhdGVzKHRoaXMsIHJlbW92ZSwgJ3RpbWVvdXQnKVxuICAgICAgfVxuICAgIH0sIG1hdGguZmxvb3Iob3V0ZGF0ZWRUaW1lb3V0IC8gMTApKSlcbiAgICBkb2Mub24oJ2Rlc3Ryb3knLCAoKSA9PiB7XG4gICAgICB0aGlzLmRlc3Ryb3koKVxuICAgIH0pXG4gICAgdGhpcy5zZXRMb2NhbFN0YXRlKHt9KVxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgdGhpcy5lbWl0KCdkZXN0cm95JywgW3RoaXNdKVxuICAgIHRoaXMuc2V0TG9jYWxTdGF0ZShudWxsKVxuICAgIHN1cGVyLmRlc3Ryb3koKVxuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fY2hlY2tJbnRlcnZhbClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtPYmplY3Q8c3RyaW5nLGFueT58bnVsbH1cbiAgICovXG4gIGdldExvY2FsU3RhdGUgKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXRlcy5nZXQodGhpcy5jbGllbnRJRCkgfHwgbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fG51bGx9IHN0YXRlXG4gICAqL1xuICBzZXRMb2NhbFN0YXRlIChzdGF0ZSkge1xuICAgIGNvbnN0IGNsaWVudElEID0gdGhpcy5jbGllbnRJRFxuICAgIGNvbnN0IGN1cnJMb2NhbE1ldGEgPSB0aGlzLm1ldGEuZ2V0KGNsaWVudElEKVxuICAgIGNvbnN0IGNsb2NrID0gY3VyckxvY2FsTWV0YSA9PT0gdW5kZWZpbmVkID8gMCA6IGN1cnJMb2NhbE1ldGEuY2xvY2sgKyAxXG4gICAgY29uc3QgcHJldlN0YXRlID0gdGhpcy5zdGF0ZXMuZ2V0KGNsaWVudElEKVxuICAgIGlmIChzdGF0ZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5zdGF0ZXMuZGVsZXRlKGNsaWVudElEKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0YXRlcy5zZXQoY2xpZW50SUQsIHN0YXRlKVxuICAgIH1cbiAgICB0aGlzLm1ldGEuc2V0KGNsaWVudElELCB7XG4gICAgICBjbG9jayxcbiAgICAgIGxhc3RVcGRhdGVkOiB0aW1lLmdldFVuaXhUaW1lKClcbiAgICB9KVxuICAgIGNvbnN0IGFkZGVkID0gW11cbiAgICBjb25zdCB1cGRhdGVkID0gW11cbiAgICBjb25zdCBmaWx0ZXJlZFVwZGF0ZWQgPSBbXVxuICAgIGNvbnN0IHJlbW92ZWQgPSBbXVxuICAgIGlmIChzdGF0ZSA9PT0gbnVsbCkge1xuICAgICAgcmVtb3ZlZC5wdXNoKGNsaWVudElEKVxuICAgIH0gZWxzZSBpZiAocHJldlN0YXRlID09IG51bGwpIHtcbiAgICAgIGlmIChzdGF0ZSAhPSBudWxsKSB7XG4gICAgICAgIGFkZGVkLnB1c2goY2xpZW50SUQpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZWQucHVzaChjbGllbnRJRClcbiAgICAgIGlmICghZi5lcXVhbGl0eURlZXAocHJldlN0YXRlLCBzdGF0ZSkpIHtcbiAgICAgICAgZmlsdGVyZWRVcGRhdGVkLnB1c2goY2xpZW50SUQpXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChhZGRlZC5sZW5ndGggPiAwIHx8IGZpbHRlcmVkVXBkYXRlZC5sZW5ndGggPiAwIHx8IHJlbW92ZWQubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5lbWl0KCdjaGFuZ2UnLCBbeyBhZGRlZCwgdXBkYXRlZDogZmlsdGVyZWRVcGRhdGVkLCByZW1vdmVkIH0sICdsb2NhbCddKVxuICAgIH1cbiAgICB0aGlzLmVtaXQoJ3VwZGF0ZScsIFt7IGFkZGVkLCB1cGRhdGVkLCByZW1vdmVkIH0sICdsb2NhbCddKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZFxuICAgKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAgICovXG4gIHNldExvY2FsU3RhdGVGaWVsZCAoZmllbGQsIHZhbHVlKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLmdldExvY2FsU3RhdGUoKVxuICAgIGlmIChzdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5zZXRMb2NhbFN0YXRlKHtcbiAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgIFtmaWVsZF06IHZhbHVlXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtNYXA8bnVtYmVyLE9iamVjdDxzdHJpbmcsYW55Pj59XG4gICAqL1xuICBnZXRTdGF0ZXMgKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXRlc1xuICB9XG59XG5cbi8qKlxuICogTWFyayAocmVtb3RlKSBjbGllbnRzIGFzIGluYWN0aXZlIGFuZCByZW1vdmUgdGhlbSBmcm9tIHRoZSBsaXN0IG9mIGFjdGl2ZSBwZWVycy5cbiAqIFRoaXMgY2hhbmdlIHdpbGwgYmUgcHJvcGFnYXRlZCB0byByZW1vdGUgY2xpZW50cy5cbiAqXG4gKiBAcGFyYW0ge0F3YXJlbmVzc30gYXdhcmVuZXNzXG4gKiBAcGFyYW0ge0FycmF5PG51bWJlcj59IGNsaWVudHNcbiAqIEBwYXJhbSB7YW55fSBvcmlnaW5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlbW92ZUF3YXJlbmVzc1N0YXRlcyA9IChhd2FyZW5lc3MsIGNsaWVudHMsIG9yaWdpbikgPT4ge1xuICBjb25zdCByZW1vdmVkID0gW11cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGllbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2xpZW50SUQgPSBjbGllbnRzW2ldXG4gICAgaWYgKGF3YXJlbmVzcy5zdGF0ZXMuaGFzKGNsaWVudElEKSkge1xuICAgICAgYXdhcmVuZXNzLnN0YXRlcy5kZWxldGUoY2xpZW50SUQpXG4gICAgICBpZiAoY2xpZW50SUQgPT09IGF3YXJlbmVzcy5jbGllbnRJRCkge1xuICAgICAgICBjb25zdCBjdXJNZXRhID0gLyoqIEB0eXBlIHtNZXRhQ2xpZW50U3RhdGV9ICovIChhd2FyZW5lc3MubWV0YS5nZXQoY2xpZW50SUQpKVxuICAgICAgICBhd2FyZW5lc3MubWV0YS5zZXQoY2xpZW50SUQsIHtcbiAgICAgICAgICBjbG9jazogY3VyTWV0YS5jbG9jayArIDEsXG4gICAgICAgICAgbGFzdFVwZGF0ZWQ6IHRpbWUuZ2V0VW5peFRpbWUoKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgcmVtb3ZlZC5wdXNoKGNsaWVudElEKVxuICAgIH1cbiAgfVxuICBpZiAocmVtb3ZlZC5sZW5ndGggPiAwKSB7XG4gICAgYXdhcmVuZXNzLmVtaXQoJ2NoYW5nZScsIFt7IGFkZGVkOiBbXSwgdXBkYXRlZDogW10sIHJlbW92ZWQgfSwgb3JpZ2luXSlcbiAgICBhd2FyZW5lc3MuZW1pdCgndXBkYXRlJywgW3sgYWRkZWQ6IFtdLCB1cGRhdGVkOiBbXSwgcmVtb3ZlZCB9LCBvcmlnaW5dKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtBd2FyZW5lc3N9IGF3YXJlbmVzc1xuICogQHBhcmFtIHtBcnJheTxudW1iZXI+fSBjbGllbnRzXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5leHBvcnQgY29uc3QgZW5jb2RlQXdhcmVuZXNzVXBkYXRlID0gKGF3YXJlbmVzcywgY2xpZW50cywgc3RhdGVzID0gYXdhcmVuZXNzLnN0YXRlcykgPT4ge1xuICBjb25zdCBsZW4gPSBjbGllbnRzLmxlbmd0aFxuICBjb25zdCBlbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCBsZW4pXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBjb25zdCBjbGllbnRJRCA9IGNsaWVudHNbaV1cbiAgICBjb25zdCBzdGF0ZSA9IHN0YXRlcy5nZXQoY2xpZW50SUQpIHx8IG51bGxcbiAgICBjb25zdCBjbG9jayA9IC8qKiBAdHlwZSB7TWV0YUNsaWVudFN0YXRlfSAqLyAoYXdhcmVuZXNzLm1ldGEuZ2V0KGNsaWVudElEKSkuY2xvY2tcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgY2xpZW50SUQpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIGNsb2NrKVxuICAgIGVuY29kaW5nLndyaXRlVmFyU3RyaW5nKGVuY29kZXIsIEpTT04uc3RyaW5naWZ5KHN0YXRlKSlcbiAgfVxuICByZXR1cm4gZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXIpXG59XG5cbi8qKlxuICogTW9kaWZ5IHRoZSBjb250ZW50IG9mIGFuIGF3YXJlbmVzcyB1cGRhdGUgYmVmb3JlIHJlLWVuY29kaW5nIGl0IHRvIGFuIGF3YXJlbmVzcyB1cGRhdGUuXG4gKlxuICogVGhpcyBtaWdodCBiZSB1c2VmdWwgd2hlbiB5b3UgaGF2ZSBhIGNlbnRyYWwgc2VydmVyIHRoYXQgd2FudHMgdG8gZW5zdXJlIHRoYXQgY2xpZW50c1xuICogY2FudCBoaWphY2sgc29tZWJvZHkgZWxzZXMgaWRlbnRpdHkuXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oYW55KTphbnl9IG1vZGlmeVxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IG1vZGlmeUF3YXJlbmVzc1VwZGF0ZSA9ICh1cGRhdGUsIG1vZGlmeSkgPT4ge1xuICBjb25zdCBkZWNvZGVyID0gZGVjb2RpbmcuY3JlYXRlRGVjb2Rlcih1cGRhdGUpXG4gIGNvbnN0IGVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAgY29uc3QgbGVuID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2RlcilcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIGxlbilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGNvbnN0IGNsaWVudElEID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2RlcilcbiAgICBjb25zdCBjbG9jayA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIpXG4gICAgY29uc3Qgc3RhdGUgPSBKU09OLnBhcnNlKGRlY29kaW5nLnJlYWRWYXJTdHJpbmcoZGVjb2RlcikpXG4gICAgY29uc3QgbW9kaWZpZWRTdGF0ZSA9IG1vZGlmeShzdGF0ZSlcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgY2xpZW50SUQpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIGNsb2NrKVxuICAgIGVuY29kaW5nLndyaXRlVmFyU3RyaW5nKGVuY29kZXIsIEpTT04uc3RyaW5naWZ5KG1vZGlmaWVkU3RhdGUpKVxuICB9XG4gIHJldHVybiBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2Rlcilcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0F3YXJlbmVzc30gYXdhcmVuZXNzXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICogQHBhcmFtIHthbnl9IG9yaWdpbiBUaGlzIHdpbGwgYmUgYWRkZWQgdG8gdGhlIGVtaXR0ZWQgY2hhbmdlIGV2ZW50XG4gKi9cbmV4cG9ydCBjb25zdCBhcHBseUF3YXJlbmVzc1VwZGF0ZSA9IChhd2FyZW5lc3MsIHVwZGF0ZSwgb3JpZ2luKSA9PiB7XG4gIGNvbnN0IGRlY29kZXIgPSBkZWNvZGluZy5jcmVhdGVEZWNvZGVyKHVwZGF0ZSlcbiAgY29uc3QgdGltZXN0YW1wID0gdGltZS5nZXRVbml4VGltZSgpXG4gIGNvbnN0IGFkZGVkID0gW11cbiAgY29uc3QgdXBkYXRlZCA9IFtdXG4gIGNvbnN0IGZpbHRlcmVkVXBkYXRlZCA9IFtdXG4gIGNvbnN0IHJlbW92ZWQgPSBbXVxuICBjb25zdCBsZW4gPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgY29uc3QgY2xpZW50SUQgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyKVxuICAgIGxldCBjbG9jayA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIpXG4gICAgY29uc3Qgc3RhdGUgPSBKU09OLnBhcnNlKGRlY29kaW5nLnJlYWRWYXJTdHJpbmcoZGVjb2RlcikpXG4gICAgY29uc3QgY2xpZW50TWV0YSA9IGF3YXJlbmVzcy5tZXRhLmdldChjbGllbnRJRClcbiAgICBjb25zdCBwcmV2U3RhdGUgPSBhd2FyZW5lc3Muc3RhdGVzLmdldChjbGllbnRJRClcbiAgICBjb25zdCBjdXJyQ2xvY2sgPSBjbGllbnRNZXRhID09PSB1bmRlZmluZWQgPyAwIDogY2xpZW50TWV0YS5jbG9ja1xuICAgIGlmIChjdXJyQ2xvY2sgPCBjbG9jayB8fCAoY3VyckNsb2NrID09PSBjbG9jayAmJiBzdGF0ZSA9PT0gbnVsbCAmJiBhd2FyZW5lc3Muc3RhdGVzLmhhcyhjbGllbnRJRCkpKSB7XG4gICAgICBpZiAoc3RhdGUgPT09IG51bGwpIHtcbiAgICAgICAgLy8gbmV2ZXIgbGV0IGEgcmVtb3RlIGNsaWVudCByZW1vdmUgdGhpcyBsb2NhbCBzdGF0ZVxuICAgICAgICBpZiAoY2xpZW50SUQgPT09IGF3YXJlbmVzcy5jbGllbnRJRCAmJiBhd2FyZW5lc3MuZ2V0TG9jYWxTdGF0ZSgpICE9IG51bGwpIHtcbiAgICAgICAgICAvLyByZW1vdGUgY2xpZW50IHJlbW92ZWQgdGhlIGxvY2FsIHN0YXRlLiBEbyBub3QgcmVtb3RlIHN0YXRlLiBCcm9hZGNhc3QgYSBtZXNzYWdlIGluZGljYXRpbmdcbiAgICAgICAgICAvLyB0aGF0IHRoaXMgY2xpZW50IHN0aWxsIGV4aXN0cyBieSBpbmNyZWFzaW5nIHRoZSBjbG9ja1xuICAgICAgICAgIGNsb2NrKytcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhd2FyZW5lc3Muc3RhdGVzLmRlbGV0ZShjbGllbnRJRClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhcmVuZXNzLnN0YXRlcy5zZXQoY2xpZW50SUQsIHN0YXRlKVxuICAgICAgfVxuICAgICAgYXdhcmVuZXNzLm1ldGEuc2V0KGNsaWVudElELCB7XG4gICAgICAgIGNsb2NrLFxuICAgICAgICBsYXN0VXBkYXRlZDogdGltZXN0YW1wXG4gICAgICB9KVxuICAgICAgaWYgKGNsaWVudE1ldGEgPT09IHVuZGVmaW5lZCAmJiBzdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgICBhZGRlZC5wdXNoKGNsaWVudElEKVxuICAgICAgfSBlbHNlIGlmIChjbGllbnRNZXRhICE9PSB1bmRlZmluZWQgJiYgc3RhdGUgPT09IG51bGwpIHtcbiAgICAgICAgcmVtb3ZlZC5wdXNoKGNsaWVudElEKVxuICAgICAgfSBlbHNlIGlmIChzdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoIWYuZXF1YWxpdHlEZWVwKHN0YXRlLCBwcmV2U3RhdGUpKSB7XG4gICAgICAgICAgZmlsdGVyZWRVcGRhdGVkLnB1c2goY2xpZW50SUQpXG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlZC5wdXNoKGNsaWVudElEKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoYWRkZWQubGVuZ3RoID4gMCB8fCBmaWx0ZXJlZFVwZGF0ZWQubGVuZ3RoID4gMCB8fCByZW1vdmVkLmxlbmd0aCA+IDApIHtcbiAgICBhd2FyZW5lc3MuZW1pdCgnY2hhbmdlJywgW3tcbiAgICAgIGFkZGVkLCB1cGRhdGVkOiBmaWx0ZXJlZFVwZGF0ZWQsIHJlbW92ZWRcbiAgICB9LCBvcmlnaW5dKVxuICB9XG4gIGlmIChhZGRlZC5sZW5ndGggPiAwIHx8IHVwZGF0ZWQubGVuZ3RoID4gMCB8fCByZW1vdmVkLmxlbmd0aCA+IDApIHtcbiAgICBhd2FyZW5lc3MuZW1pdCgndXBkYXRlJywgW3tcbiAgICAgIGFkZGVkLCB1cGRhdGVkLCByZW1vdmVkXG4gICAgfSwgb3JpZ2luXSlcbiAgfVxufVxuIiwgIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICdsaWIwL2VuY29kaW5nJ1xuaW1wb3J0ICogYXMgZGVjb2RpbmcgZnJvbSAnbGliMC9kZWNvZGluZydcbmltcG9ydCAqIGFzIHByb21pc2UgZnJvbSAnbGliMC9wcm9taXNlJ1xuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnbGliMC9lcnJvcidcbmltcG9ydCAqIGFzIHN0cmluZyBmcm9tICdsaWIwL3N0cmluZydcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VjcmV0XG4gKiBAcGFyYW0ge3N0cmluZ30gcm9vbU5hbWVcbiAqIEByZXR1cm4ge1Byb21pc2VMaWtlPENyeXB0b0tleT59XG4gKi9cbmV4cG9ydCBjb25zdCBkZXJpdmVLZXkgPSAoc2VjcmV0LCByb29tTmFtZSkgPT4ge1xuICBjb25zdCBzZWNyZXRCdWZmZXIgPSBzdHJpbmcuZW5jb2RlVXRmOChzZWNyZXQpLmJ1ZmZlclxuICBjb25zdCBzYWx0ID0gc3RyaW5nLmVuY29kZVV0Zjgocm9vbU5hbWUpLmJ1ZmZlclxuICByZXR1cm4gY3J5cHRvLnN1YnRsZS5pbXBvcnRLZXkoXG4gICAgJ3JhdycsXG4gICAgc2VjcmV0QnVmZmVyLFxuICAgICdQQktERjInLFxuICAgIGZhbHNlLFxuICAgIFsnZGVyaXZlS2V5J11cbiAgKS50aGVuKGtleU1hdGVyaWFsID0+XG4gICAgY3J5cHRvLnN1YnRsZS5kZXJpdmVLZXkoXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdQQktERjInLFxuICAgICAgICBzYWx0LFxuICAgICAgICBpdGVyYXRpb25zOiAxMDAwMDAsXG4gICAgICAgIGhhc2g6ICdTSEEtMjU2J1xuICAgICAgfSxcbiAgICAgIGtleU1hdGVyaWFsLFxuICAgICAge1xuICAgICAgICBuYW1lOiAnQUVTLUdDTScsXG4gICAgICAgIGxlbmd0aDogMjU2XG4gICAgICB9LFxuICAgICAgdHJ1ZSxcbiAgICAgIFsnZW5jcnlwdCcsICdkZWNyeXB0J11cbiAgICApXG4gIClcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGEgZGF0YSB0byBiZSBlbmNyeXB0ZWRcbiAqIEBwYXJhbSB7Q3J5cHRvS2V5P30ga2V5XG4gKiBAcmV0dXJuIHtQcm9taXNlTGlrZTxVaW50OEFycmF5Pn0gZW5jcnlwdGVkLCBiYXNlNjQgZW5jb2RlZCBtZXNzYWdlXG4gKi9cbmV4cG9ydCBjb25zdCBlbmNyeXB0ID0gKGRhdGEsIGtleSkgPT4ge1xuICBpZiAoIWtleSkge1xuICAgIHJldHVybiAvKiogQHR5cGUge1Byb21pc2VMaWtlPFVpbnQ4QXJyYXk+fSAqLyAocHJvbWlzZS5yZXNvbHZlKGRhdGEpKVxuICB9XG4gIGNvbnN0IGl2ID0gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheSgxMikpXG4gIHJldHVybiBjcnlwdG8uc3VidGxlLmVuY3J5cHQoXG4gICAge1xuICAgICAgbmFtZTogJ0FFUy1HQ00nLFxuICAgICAgaXZcbiAgICB9LFxuICAgIGtleSxcbiAgICBkYXRhXG4gICkudGhlbihjaXBoZXIgPT4ge1xuICAgIGNvbnN0IGVuY3J5cHRlZERhdGFFbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJTdHJpbmcoZW5jcnlwdGVkRGF0YUVuY29kZXIsICdBRVMtR0NNJylcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkoZW5jcnlwdGVkRGF0YUVuY29kZXIsIGl2KVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNyeXB0ZWREYXRhRW5jb2RlciwgbmV3IFVpbnQ4QXJyYXkoY2lwaGVyKSlcbiAgICByZXR1cm4gZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY3J5cHRlZERhdGFFbmNvZGVyKVxuICB9KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIGRhdGEgdG8gYmUgZW5jcnlwdGVkXG4gKiBAcGFyYW0ge0NyeXB0b0tleT99IGtleVxuICogQHJldHVybiB7UHJvbWlzZUxpa2U8VWludDhBcnJheT59IGVuY3J5cHRlZCBkYXRhLCBpZiBrZXkgaXMgcHJvdmlkZWRcbiAqL1xuZXhwb3J0IGNvbnN0IGVuY3J5cHRKc29uID0gKGRhdGEsIGtleSkgPT4ge1xuICBjb25zdCBkYXRhRW5jb2RlciA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICBlbmNvZGluZy53cml0ZUFueShkYXRhRW5jb2RlciwgZGF0YSlcbiAgcmV0dXJuIGVuY3J5cHQoZW5jb2RpbmcudG9VaW50OEFycmF5KGRhdGFFbmNvZGVyKSwga2V5KVxufVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gZGF0YVxuICogQHBhcmFtIHtDcnlwdG9LZXk/fSBrZXlcbiAqIEByZXR1cm4ge1Byb21pc2VMaWtlPFVpbnQ4QXJyYXk+fSBkZWNyeXB0ZWQgYnVmZmVyXG4gKi9cbmV4cG9ydCBjb25zdCBkZWNyeXB0ID0gKGRhdGEsIGtleSkgPT4ge1xuICBpZiAoIWtleSkge1xuICAgIHJldHVybiAvKiogQHR5cGUge1Byb21pc2VMaWtlPFVpbnQ4QXJyYXk+fSAqLyAocHJvbWlzZS5yZXNvbHZlKGRhdGEpKVxuICB9XG4gIGNvbnN0IGRhdGFEZWNvZGVyID0gZGVjb2RpbmcuY3JlYXRlRGVjb2RlcihkYXRhKVxuICBjb25zdCBhbGdvcml0aG0gPSBkZWNvZGluZy5yZWFkVmFyU3RyaW5nKGRhdGFEZWNvZGVyKVxuICBpZiAoYWxnb3JpdGhtICE9PSAnQUVTLUdDTScpIHtcbiAgICBwcm9taXNlLnJlamVjdChlcnJvci5jcmVhdGUoJ1Vua25vd24gZW5jcnlwdGlvbiBhbGdvcml0aG0nKSlcbiAgfVxuICBjb25zdCBpdiA9IGRlY29kaW5nLnJlYWRWYXJVaW50OEFycmF5KGRhdGFEZWNvZGVyKVxuICBjb25zdCBjaXBoZXIgPSBkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheShkYXRhRGVjb2RlcilcbiAgcmV0dXJuIGNyeXB0by5zdWJ0bGUuZGVjcnlwdChcbiAgICB7XG4gICAgICBuYW1lOiAnQUVTLUdDTScsXG4gICAgICBpdlxuICAgIH0sXG4gICAga2V5LFxuICAgIGNpcGhlclxuICApLnRoZW4oZGF0YSA9PiBuZXcgVWludDhBcnJheShkYXRhKSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7Q3J5cHRvS2V5P30ga2V5XG4gKiBAcmV0dXJuIHtQcm9taXNlTGlrZTxPYmplY3Q+fSBkZWNyeXB0ZWQgb2JqZWN0XG4gKi9cbmV4cG9ydCBjb25zdCBkZWNyeXB0SnNvbiA9IChkYXRhLCBrZXkpID0+XG4gIGRlY3J5cHQoZGF0YSwga2V5KS50aGVuKGRlY3J5cHRlZFZhbHVlID0+XG4gICAgZGVjb2RpbmcucmVhZEFueShkZWNvZGluZy5jcmVhdGVEZWNvZGVyKG5ldyBVaW50OEFycmF5KGRlY3J5cHRlZFZhbHVlKSkpXG4gIClcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQSxLQUFDLFNBQVMsR0FBRTtBQUFDLFVBQUcsWUFBVSxPQUFPLFdBQVMsZUFBYSxPQUFPLE9BQU8sUUFBTyxVQUFRLEVBQUU7QUFBQSxlQUFVLGNBQVksT0FBTyxVQUFRLE9BQU8sSUFBSSxRQUFPLENBQUMsR0FBRSxDQUFDO0FBQUEsV0FBTTtBQUFDLFlBQUk7QUFBRSxZQUFFLGVBQWEsT0FBTyxTQUFPLGVBQWEsT0FBTyxTQUFPLGVBQWEsT0FBTyxPQUFLLE9BQUssT0FBSyxTQUFPLFFBQU8sRUFBRSxhQUFXLEVBQUU7QUFBQSxNQUFDO0FBQUEsSUFBQyxHQUFHLFdBQVU7QUFBQyxVQUFJLElBQUUsS0FBSyxPQUFNLElBQUUsS0FBSyxLQUFJLElBQUUsS0FBSztBQUFJLGNBQU8sNEJBQVU7QUFBQyxpQkFBUyxFQUFFLEdBQUUsR0FBRUEsSUFBRTtBQUFDLG1CQUFTQyxHQUFFLEdBQUUsR0FBRTtBQUFDLGdCQUFHLENBQUMsRUFBRSxDQUFDLEdBQUU7QUFBQyxrQkFBRyxDQUFDLEVBQUUsQ0FBQyxHQUFFO0FBQUMsb0JBQUksSUFBRSxjQUFZLE9BQU8sYUFBUztBQUFRLG9CQUFHLENBQUMsS0FBRyxFQUFFLFFBQU8sRUFBRSxHQUFFLElBQUU7QUFBRSxvQkFBR0MsR0FBRSxRQUFPQSxHQUFFLEdBQUUsSUFBRTtBQUFFLG9CQUFJLElBQUUsSUFBSSxNQUFNLHlCQUF1QixJQUFFLEdBQUc7QUFBRSxzQkFBTSxFQUFFLE9BQUssb0JBQW1CO0FBQUEsY0FBQztBQUFDLGtCQUFJQyxLQUFFLEVBQUUsQ0FBQyxJQUFFLEVBQUMsU0FBUSxDQUFDLEVBQUM7QUFBRSxnQkFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUtBLEdBQUUsU0FBUSxTQUFTQyxJQUFFO0FBQUMsb0JBQUlGLEtBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFRSxFQUFDO0FBQUUsdUJBQU9ILEdBQUVDLE1BQUdFLEVBQUM7QUFBQSxjQUFDLEdBQUVELElBQUVBLEdBQUUsU0FBUSxHQUFFLEdBQUUsR0FBRUgsRUFBQztBQUFBLFlBQUM7QUFBQyxtQkFBTyxFQUFFLENBQUMsRUFBRTtBQUFBLFVBQU87QUFBQyxtQkFBUUUsS0FBRSxjQUFZLE9BQU8sYUFBUyxXQUFRLElBQUUsR0FBRSxJQUFFRixHQUFFLFFBQU8sSUFBSSxDQUFBQyxHQUFFRCxHQUFFLENBQUMsQ0FBQztBQUFFLGlCQUFPQztBQUFBLFFBQUM7QUFBQyxlQUFPO0FBQUEsTUFBQyxHQUFFLEdBQUUsRUFBQyxHQUFFLENBQUMsU0FBUyxHQUFFQSxJQUFFRCxJQUFFO0FBQUM7QUFBYSxpQkFBU0UsR0FBRUUsSUFBRTtBQUFDLGNBQUlILEtBQUVHLEdBQUU7QUFBTyxjQUFHLElBQUVILEtBQUUsRUFBRSxPQUFNLElBQUksTUFBTSxnREFBZ0Q7QUFBRSxjQUFJRCxLQUFFSSxHQUFFLFFBQVEsR0FBRztBQUFFLGlCQUFLSixPQUFJQSxLQUFFQztBQUFHLGNBQUlDLEtBQUVGLE9BQUlDLEtBQUUsSUFBRSxJQUFFRCxLQUFFO0FBQUUsaUJBQU0sQ0FBQ0EsSUFBRUUsRUFBQztBQUFBLFFBQUM7QUFBQyxpQkFBUyxFQUFFRSxJQUFFSCxJQUFFRCxJQUFFO0FBQUMsaUJBQU8sS0FBR0MsS0FBRUQsTUFBRyxJQUFFQTtBQUFBLFFBQUM7QUFBQyxpQkFBUyxFQUFFSSxJQUFFO0FBQUMsY0FBSUgsSUFBRUQsSUFBRUssS0FBRUgsR0FBRUUsRUFBQyxHQUFFRSxLQUFFRCxHQUFFLENBQUMsR0FBRUUsS0FBRUYsR0FBRSxDQUFDLEdBQUVHLEtBQUUsSUFBSSxFQUFFLEVBQUVKLElBQUVFLElBQUVDLEVBQUMsQ0FBQyxHQUFFRSxLQUFFLEdBQUVDLEtBQUUsSUFBRUgsS0FBRUQsS0FBRSxJQUFFQTtBQUFFLGVBQUlOLEtBQUUsR0FBRUEsS0FBRVUsSUFBRVYsTUFBRyxFQUFFLENBQUFDLEtBQUUsRUFBRUcsR0FBRSxXQUFXSixFQUFDLENBQUMsS0FBRyxLQUFHLEVBQUVJLEdBQUUsV0FBV0osS0FBRSxDQUFDLENBQUMsS0FBRyxLQUFHLEVBQUVJLEdBQUUsV0FBV0osS0FBRSxDQUFDLENBQUMsS0FBRyxJQUFFLEVBQUVJLEdBQUUsV0FBV0osS0FBRSxDQUFDLENBQUMsR0FBRVEsR0FBRUMsSUFBRyxJQUFFLE1BQUlSLE1BQUcsSUFBR08sR0FBRUMsSUFBRyxJQUFFLE1BQUlSLE1BQUcsR0FBRU8sR0FBRUMsSUFBRyxJQUFFLE1BQUlSO0FBQUUsaUJBQU8sTUFBSU0sT0FBSU4sS0FBRSxFQUFFRyxHQUFFLFdBQVdKLEVBQUMsQ0FBQyxLQUFHLElBQUUsRUFBRUksR0FBRSxXQUFXSixLQUFFLENBQUMsQ0FBQyxLQUFHLEdBQUVRLEdBQUVDLElBQUcsSUFBRSxNQUFJUixLQUFHLE1BQUlNLE9BQUlOLEtBQUUsRUFBRUcsR0FBRSxXQUFXSixFQUFDLENBQUMsS0FBRyxLQUFHLEVBQUVJLEdBQUUsV0FBV0osS0FBRSxDQUFDLENBQUMsS0FBRyxJQUFFLEVBQUVJLEdBQUUsV0FBV0osS0FBRSxDQUFDLENBQUMsS0FBRyxHQUFFUSxHQUFFQyxJQUFHLElBQUUsTUFBSVIsTUFBRyxHQUFFTyxHQUFFQyxJQUFHLElBQUUsTUFBSVIsS0FBR087QUFBQSxRQUFDO0FBQUMsaUJBQVMsRUFBRUosSUFBRTtBQUFDLGlCQUFPLEVBQUUsS0FBR0EsTUFBRyxFQUFFLElBQUUsRUFBRSxLQUFHQSxNQUFHLEVBQUUsSUFBRSxFQUFFLEtBQUdBLE1BQUcsQ0FBQyxJQUFFLEVBQUUsS0FBR0EsRUFBQztBQUFBLFFBQUM7QUFBQyxpQkFBUyxFQUFFQSxJQUFFSCxJQUFFRCxJQUFFO0FBQUMsbUJBQVFFLElBQUVDLEtBQUUsQ0FBQyxHQUFFRSxLQUFFSixJQUFFSSxLQUFFTCxJQUFFSyxNQUFHLEVBQUUsQ0FBQUgsTUFBRyxXQUFTRSxHQUFFQyxFQUFDLEtBQUcsT0FBSyxRQUFNRCxHQUFFQyxLQUFFLENBQUMsS0FBRyxNQUFJLE1BQUlELEdBQUVDLEtBQUUsQ0FBQyxJQUFHRixHQUFFLEtBQUssRUFBRUQsRUFBQyxDQUFDO0FBQUUsaUJBQU9DLEdBQUUsS0FBSyxFQUFFO0FBQUEsUUFBQztBQUFDLGlCQUFTLEVBQUVDLElBQUU7QUFBQyxtQkFBUUgsSUFBRUQsS0FBRUksR0FBRSxRQUFPRixLQUFFRixLQUFFLEdBQUVHLEtBQUUsQ0FBQyxHQUFFRSxLQUFFLE9BQU1DLEtBQUUsR0FBRUUsS0FBRVIsS0FBRUUsSUFBRUksS0FBRUUsSUFBRUYsTUFBR0QsR0FBRSxDQUFBRixHQUFFLEtBQUssRUFBRUMsSUFBRUUsSUFBRUEsS0FBRUQsS0FBRUcsS0FBRUEsS0FBRUYsS0FBRUQsRUFBQyxDQUFDO0FBQUUsaUJBQU8sTUFBSUgsTUFBR0QsS0FBRUcsR0FBRUosS0FBRSxDQUFDLEdBQUVHLEdBQUUsS0FBSyxFQUFFRixNQUFHLENBQUMsSUFBRSxFQUFFLEtBQUdBLE1BQUcsQ0FBQyxJQUFFLElBQUksS0FBRyxNQUFJQyxPQUFJRCxNQUFHRyxHQUFFSixLQUFFLENBQUMsS0FBRyxLQUFHSSxHQUFFSixLQUFFLENBQUMsR0FBRUcsR0FBRSxLQUFLLEVBQUVGLE1BQUcsRUFBRSxJQUFFLEVBQUUsS0FBR0EsTUFBRyxDQUFDLElBQUUsRUFBRSxLQUFHQSxNQUFHLENBQUMsSUFBRSxHQUFHLElBQUdFLEdBQUUsS0FBSyxFQUFFO0FBQUEsUUFBQztBQUFDLFFBQUFILEdBQUUsYUFBVyxTQUFTSSxJQUFFO0FBQUMsY0FBSUgsS0FBRUMsR0FBRUUsRUFBQyxHQUFFSixLQUFFQyxHQUFFLENBQUMsR0FBRUUsS0FBRUYsR0FBRSxDQUFDO0FBQUUsaUJBQU8sS0FBR0QsS0FBRUcsTUFBRyxJQUFFQTtBQUFBLFFBQUMsR0FBRUgsR0FBRSxjQUFZLEdBQUVBLEdBQUUsZ0JBQWM7QUFBRSxpQkFBUSxJQUFFLENBQUMsR0FBRSxJQUFFLENBQUMsR0FBRSxJQUFFLGVBQWEsT0FBTyxhQUFXLFFBQU0sWUFBVyxJQUFFLG9FQUFtRSxJQUFFLEdBQUUsSUFBRSxFQUFFLFFBQU8sSUFBRSxHQUFFLEVBQUUsRUFBRSxHQUFFLENBQUMsSUFBRSxFQUFFLENBQUMsR0FBRSxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUMsSUFBRTtBQUFFLFVBQUUsRUFBRSxJQUFFLElBQUcsRUFBRSxFQUFFLElBQUU7QUFBQSxNQUFFLEdBQUUsQ0FBQyxDQUFDLEdBQUUsR0FBRSxDQUFDLFdBQVU7QUFBQSxNQUFDLEdBQUUsQ0FBQyxDQUFDLEdBQUUsR0FBRSxDQUFDLFNBQVMsR0FBRUMsSUFBRUQsSUFBRTtBQUFDLFNBQUMsV0FBVTtBQUFDLFdBQUMsV0FBVTtBQUtudUU7QUFBYSxnQkFBSUMsS0FBRSxPQUFPLGNBQWEsSUFBRSxLQUFLO0FBQUkscUJBQVMsRUFBRUcsSUFBRTtBQUFDLGtCQUFHLGFBQVdBLEdBQUUsT0FBTSxJQUFJLFdBQVcsZ0JBQWVBLEtBQUUsZ0NBQW1DO0FBQUUsa0JBQUlILEtBQUUsSUFBSSxXQUFXRyxFQUFDO0FBQUUscUJBQU9ILEdBQUUsWUFBVSxFQUFFLFdBQVVBO0FBQUEsWUFBQztBQUFDLHFCQUFTLEVBQUVHLElBQUVILElBQUVELElBQUU7QUFBQyxrQkFBRyxZQUFVLE9BQU9JLElBQUU7QUFBQyxvQkFBRyxZQUFVLE9BQU9ILEdBQUUsT0FBTSxJQUFJLFVBQVUsb0VBQXNFO0FBQUUsdUJBQU8sRUFBRUcsRUFBQztBQUFBLGNBQUM7QUFBQyxxQkFBTyxFQUFFQSxJQUFFSCxJQUFFRCxFQUFDO0FBQUEsWUFBQztBQUFDLHFCQUFTLEVBQUVJLElBQUVILElBQUVELElBQUU7QUFBQyxrQkFBRyxZQUFVLE9BQU9JLEdBQUUsUUFBTyxFQUFFQSxJQUFFSCxFQUFDO0FBQUUsa0JBQUcsWUFBWSxPQUFPRyxFQUFDLEVBQUUsUUFBTyxFQUFFQSxFQUFDO0FBQUUsa0JBQUcsUUFBTUEsR0FBRSxPQUFNLFVBQVUsb0hBQWtILE9BQU9BLEVBQUM7QUFBRSxrQkFBRyxFQUFFQSxJQUFFLFdBQVcsS0FBR0EsTUFBRyxFQUFFQSxHQUFFLFFBQU8sV0FBVyxFQUFFLFFBQU8sRUFBRUEsSUFBRUgsSUFBRUQsRUFBQztBQUFFLGtCQUFHLFlBQVUsT0FBT0ksR0FBRSxPQUFNLElBQUksVUFBVSx1RUFBeUU7QUFBRSxrQkFBSUYsS0FBRUUsR0FBRSxXQUFTQSxHQUFFLFFBQVE7QUFBRSxrQkFBRyxRQUFNRixNQUFHQSxPQUFJRSxHQUFFLFFBQU8sRUFBRSxLQUFLRixJQUFFRCxJQUFFRCxFQUFDO0FBQUUsa0JBQUksSUFBRSxFQUFFSSxFQUFDO0FBQUUsa0JBQUcsRUFBRSxRQUFPO0FBQUUsa0JBQUcsZUFBYSxPQUFPLFVBQVEsUUFBTSxPQUFPLGVBQWEsY0FBWSxPQUFPQSxHQUFFLE9BQU8sV0FBVyxFQUFFLFFBQU8sRUFBRSxLQUFLQSxHQUFFLE9BQU8sV0FBVyxFQUFFLFFBQVEsR0FBRUgsSUFBRUQsRUFBQztBQUFFLG9CQUFNLElBQUksVUFBVSxvSEFBa0gsT0FBT0ksRUFBQztBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFQSxJQUFFO0FBQUMsa0JBQUcsWUFBVSxPQUFPQSxHQUFFLE9BQU0sSUFBSSxVQUFVLHdDQUEwQztBQUFBLHVCQUFVLElBQUVBLEdBQUUsT0FBTSxJQUFJLFdBQVcsZ0JBQWVBLEtBQUUsZ0NBQW1DO0FBQUEsWUFBQztBQUFDLHFCQUFTLEVBQUVBLElBQUVILElBQUVELElBQUU7QUFBQyxxQkFBTyxFQUFFSSxFQUFDLEdBQUUsS0FBR0EsS0FBRSxFQUFFQSxFQUFDLElBQUUsV0FBU0gsS0FBRSxFQUFFRyxFQUFDLElBQUUsWUFBVSxPQUFPSixLQUFFLEVBQUVJLEVBQUMsRUFBRSxLQUFLSCxJQUFFRCxFQUFDLElBQUUsRUFBRUksRUFBQyxFQUFFLEtBQUtILEVBQUM7QUFBQSxZQUFDO0FBQUMscUJBQVMsRUFBRUcsSUFBRTtBQUFDLHFCQUFPLEVBQUVBLEVBQUMsR0FBRSxFQUFFLElBQUVBLEtBQUUsSUFBRSxJQUFFLEVBQUVBLEVBQUMsQ0FBQztBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFQSxJQUFFSCxJQUFFO0FBQUMsbUJBQUksWUFBVSxPQUFPQSxNQUFHLE9BQUtBLFFBQUtBLEtBQUUsU0FBUSxDQUFDLEVBQUUsV0FBV0EsRUFBQyxFQUFFLE9BQU0sSUFBSSxVQUFVLHVCQUFxQkEsRUFBQztBQUFFLGtCQUFJRCxLQUFFLElBQUUsRUFBRUksSUFBRUgsRUFBQyxHQUFFQyxLQUFFLEVBQUVGLEVBQUMsR0FBRSxJQUFFRSxHQUFFLE1BQU1FLElBQUVILEVBQUM7QUFBRSxxQkFBTyxNQUFJRCxPQUFJRSxLQUFFQSxHQUFFLE1BQU0sR0FBRSxDQUFDLElBQUdBO0FBQUEsWUFBQztBQUFDLHFCQUFTLEVBQUVFLElBQUU7QUFBQyx1QkFBUUgsS0FBRSxJQUFFRyxHQUFFLFNBQU8sSUFBRSxJQUFFLEVBQUVBLEdBQUUsTUFBTSxHQUFFSixLQUFFLEVBQUVDLEVBQUMsR0FBRUMsS0FBRSxHQUFFQSxLQUFFRCxJQUFFQyxNQUFHLEVBQUUsQ0FBQUYsR0FBRUUsRUFBQyxJQUFFLE1BQUlFLEdBQUVGLEVBQUM7QUFBRSxxQkFBT0Y7QUFBQSxZQUFDO0FBQUMscUJBQVMsRUFBRUksSUFBRUgsSUFBRUQsSUFBRTtBQUFDLGtCQUFHLElBQUVDLE1BQUdHLEdBQUUsYUFBV0gsR0FBRSxPQUFNLElBQUksV0FBVyxzQ0FBd0M7QUFBRSxrQkFBR0csR0FBRSxhQUFXSCxNQUFHRCxNQUFHLEdBQUcsT0FBTSxJQUFJLFdBQVcsc0NBQXdDO0FBQUUsa0JBQUlFO0FBQUUscUJBQU9BLEtBQUUsV0FBU0QsTUFBRyxXQUFTRCxLQUFFLElBQUksV0FBV0ksRUFBQyxJQUFFLFdBQVNKLEtBQUUsSUFBSSxXQUFXSSxJQUFFSCxFQUFDLElBQUUsSUFBSSxXQUFXRyxJQUFFSCxJQUFFRCxFQUFDLEdBQUVFLEdBQUUsWUFBVSxFQUFFLFdBQVVBO0FBQUEsWUFBQztBQUFDLHFCQUFTLEVBQUVFLElBQUU7QUFBQyxrQkFBRyxFQUFFLFNBQVNBLEVBQUMsR0FBRTtBQUFDLG9CQUFJSCxLQUFFLElBQUUsRUFBRUcsR0FBRSxNQUFNLEdBQUVKLEtBQUUsRUFBRUMsRUFBQztBQUFFLHVCQUFPLE1BQUlELEdBQUUsU0FBT0EsTUFBR0ksR0FBRSxLQUFLSixJQUFFLEdBQUUsR0FBRUMsRUFBQyxHQUFFRDtBQUFBLGNBQUU7QUFBQyxxQkFBTyxXQUFTSSxHQUFFLFNBQU8sYUFBV0EsR0FBRSxRQUFNLE1BQU0sUUFBUUEsR0FBRSxJQUFJLElBQUUsRUFBRUEsR0FBRSxJQUFJLElBQUUsU0FBTyxZQUFVLE9BQU9BLEdBQUUsVUFBUSxFQUFFQSxHQUFFLE1BQU0sSUFBRSxFQUFFLENBQUMsSUFBRSxFQUFFQSxFQUFDO0FBQUEsWUFBQztBQUFDLHFCQUFTLEVBQUVBLElBQUU7QUFBQyxrQkFBR0EsTUFBRyxXQUFXLE9BQU0sSUFBSSxXQUFXLDREQUEwRCxZQUFZLFNBQVMsRUFBRSxJQUFFLFFBQVE7QUFBRSxxQkFBTyxJQUFFQTtBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFQSxJQUFFSCxJQUFFO0FBQUMsa0JBQUcsRUFBRSxTQUFTRyxFQUFDLEVBQUUsUUFBT0EsR0FBRTtBQUFPLGtCQUFHLFlBQVksT0FBT0EsRUFBQyxLQUFHLEVBQUVBLElBQUUsV0FBVyxFQUFFLFFBQU9BLEdBQUU7QUFBVyxrQkFBRyxZQUFVLE9BQU9BLEdBQUUsT0FBTSxJQUFJLFVBQVUsNkZBQTZGLE9BQU9BLEVBQUM7QUFBRSxrQkFBSUosS0FBRUksR0FBRSxRQUFPRixLQUFFLElBQUUsVUFBVSxVQUFRLFNBQUssVUFBVSxDQUFDO0FBQUUsa0JBQUcsQ0FBQ0EsTUFBRyxNQUFJRixHQUFFLFFBQU87QUFBRSx1QkFBUSxJQUFFLFVBQUssU0FBT0MsSUFBRTtBQUFBLGdCQUFDLEtBQUk7QUFBQSxnQkFBUSxLQUFJO0FBQUEsZ0JBQVMsS0FBSTtBQUFTLHlCQUFPRDtBQUFBLGdCQUFFLEtBQUk7QUFBQSxnQkFBTyxLQUFJO0FBQVEseUJBQU8sRUFBRUksRUFBQyxFQUFFO0FBQUEsZ0JBQU8sS0FBSTtBQUFBLGdCQUFPLEtBQUk7QUFBQSxnQkFBUSxLQUFJO0FBQUEsZ0JBQVUsS0FBSTtBQUFXLHlCQUFPLElBQUVKO0FBQUEsZ0JBQUUsS0FBSTtBQUFNLHlCQUFPQSxPQUFJO0FBQUEsZ0JBQUUsS0FBSTtBQUFTLHlCQUFPLEVBQUVJLEVBQUMsRUFBRTtBQUFBLGdCQUFPO0FBQVEsc0JBQUcsRUFBRSxRQUFPRixLQUFFLEtBQUcsRUFBRUUsRUFBQyxFQUFFO0FBQU8sa0JBQUFILE1BQUcsS0FBR0EsSUFBRyxZQUFZLEdBQUUsSUFBRTtBQUFBLGNBQUc7QUFBQSxZQUFDO0FBQUMscUJBQVMsRUFBRUcsSUFBRUgsSUFBRUQsSUFBRTtBQUFDLGtCQUFJRSxLQUFFO0FBQUcsbUJBQUksV0FBU0QsTUFBRyxJQUFFQSxRQUFLQSxLQUFFLElBQUdBLEtBQUUsS0FBSyxPQUFPLFFBQU07QUFBRyxtQkFBSSxXQUFTRCxNQUFHQSxLQUFFLEtBQUssWUFBVUEsS0FBRSxLQUFLLFNBQVEsS0FBR0EsR0FBRSxRQUFNO0FBQUcsa0JBQUdBLFFBQUssR0FBRUMsUUFBSyxHQUFFRCxNQUFHQyxHQUFFLFFBQU07QUFBRyxtQkFBSUcsT0FBSUEsS0FBRSxZQUFVLFNBQU9BLElBQUU7QUFBQSxnQkFBQyxLQUFJO0FBQU0seUJBQU8sRUFBRSxNQUFLSCxJQUFFRCxFQUFDO0FBQUEsZ0JBQUUsS0FBSTtBQUFBLGdCQUFPLEtBQUk7QUFBUSx5QkFBTyxFQUFFLE1BQUtDLElBQUVELEVBQUM7QUFBQSxnQkFBRSxLQUFJO0FBQVEseUJBQU8sRUFBRSxNQUFLQyxJQUFFRCxFQUFDO0FBQUEsZ0JBQUUsS0FBSTtBQUFBLGdCQUFTLEtBQUk7QUFBUyx5QkFBTyxFQUFFLE1BQUtDLElBQUVELEVBQUM7QUFBQSxnQkFBRSxLQUFJO0FBQVMseUJBQU8sRUFBRSxNQUFLQyxJQUFFRCxFQUFDO0FBQUEsZ0JBQUUsS0FBSTtBQUFBLGdCQUFPLEtBQUk7QUFBQSxnQkFBUSxLQUFJO0FBQUEsZ0JBQVUsS0FBSTtBQUFXLHlCQUFPLEVBQUUsTUFBS0MsSUFBRUQsRUFBQztBQUFBLGdCQUFFO0FBQVEsc0JBQUdFLEdBQUUsT0FBTSxJQUFJLFVBQVUsdUJBQXFCRSxFQUFDO0FBQUUsa0JBQUFBLE1BQUdBLEtBQUUsSUFBSSxZQUFZLEdBQUVGLEtBQUU7QUFBQSxjQUFHO0FBQUEsWUFBQztBQUFDLHFCQUFTLEVBQUVFLElBQUVILElBQUVELElBQUU7QUFBQyxrQkFBSUUsS0FBRUUsR0FBRUgsRUFBQztBQUFFLGNBQUFHLEdBQUVILEVBQUMsSUFBRUcsR0FBRUosRUFBQyxHQUFFSSxHQUFFSixFQUFDLElBQUVFO0FBQUEsWUFBQztBQUFDLHFCQUFTLEVBQUVFLElBQUVILElBQUVELElBQUVFLElBQUUsR0FBRTtBQUFDLGtCQUFHLE1BQUlFLEdBQUUsT0FBTyxRQUFNO0FBQUcsa0JBQUcsWUFBVSxPQUFPSixNQUFHRSxLQUFFRixJQUFFQSxLQUFFLEtBQUcsYUFBV0EsS0FBRUEsS0FBRSxhQUFXLGNBQVlBLE9BQUlBLEtBQUUsY0FBYUEsS0FBRSxDQUFDQSxJQUFFLEVBQUVBLEVBQUMsTUFBSUEsS0FBRSxJQUFFLElBQUVJLEdBQUUsU0FBTyxJQUFHLElBQUVKLE9BQUlBLEtBQUVJLEdBQUUsU0FBT0osS0FBR0EsTUFBR0ksR0FBRSxRQUFPO0FBQUMsb0JBQUcsRUFBRSxRQUFNO0FBQUcsZ0JBQUFKLEtBQUVJLEdBQUUsU0FBTztBQUFBLGNBQUMsV0FBUyxJQUFFSixHQUFFLEtBQUcsRUFBRSxDQUFBQSxLQUFFO0FBQUEsa0JBQU8sUUFBTTtBQUFHLGtCQUFHLFlBQVUsT0FBT0MsT0FBSUEsS0FBRSxFQUFFLEtBQUtBLElBQUVDLEVBQUMsSUFBRyxFQUFFLFNBQVNELEVBQUMsRUFBRSxRQUFPLE1BQUlBLEdBQUUsU0FBTyxLQUFHLEVBQUVHLElBQUVILElBQUVELElBQUVFLElBQUUsQ0FBQztBQUFFLGtCQUFHLFlBQVUsT0FBT0QsR0FBRSxRQUFPQSxNQUFHLEtBQUksY0FBWSxPQUFPLFdBQVcsVUFBVSxVQUFRLElBQUUsV0FBVyxVQUFVLFFBQVEsS0FBS0csSUFBRUgsSUFBRUQsRUFBQyxJQUFFLFdBQVcsVUFBVSxZQUFZLEtBQUtJLElBQUVILElBQUVELEVBQUMsSUFBRSxFQUFFSSxJQUFFLENBQUNILEVBQUMsR0FBRUQsSUFBRUUsSUFBRSxDQUFDO0FBQUUsb0JBQU0sSUFBSSxVQUFVLHNDQUFzQztBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFRSxJQUFFSCxJQUFFRCxJQUFFRSxJQUFFLEdBQUU7QUFBQyx1QkFBU0csR0FBRUQsSUFBRUgsSUFBRTtBQUFDLHVCQUFPLE1BQUlLLEtBQUVGLEdBQUVILEVBQUMsSUFBRUcsR0FBRSxhQUFhSCxLQUFFSyxFQUFDO0FBQUEsY0FBQztBQUFDLGtCQUFJQSxLQUFFLEdBQUVDLEtBQUVILEdBQUUsUUFBT0ksS0FBRVAsR0FBRTtBQUFPLGtCQUFHLFdBQVNDLE9BQUlBLE1BQUdBLEtBQUUsSUFBSSxZQUFZLEdBQUUsV0FBU0EsTUFBRyxZQUFVQSxNQUFHLGNBQVlBLE1BQUcsZUFBYUEsS0FBRztBQUFDLG9CQUFHLElBQUVFLEdBQUUsVUFBUSxJQUFFSCxHQUFFLE9BQU8sUUFBTTtBQUFHLGdCQUFBSyxLQUFFLEdBQUVDLE1BQUcsR0FBRUMsTUFBRyxHQUFFUixNQUFHO0FBQUEsY0FBQztBQUFDLGtCQUFJUztBQUFFLGtCQUFHLEdBQUU7QUFBQyxvQkFBSUUsS0FBRTtBQUFHLHFCQUFJRixLQUFFVCxJQUFFUyxLQUFFRixJQUFFRSxLQUFJLEtBQUdKLEdBQUVELElBQUVLLEVBQUMsTUFBSUosR0FBRUosSUFBRSxPQUFLVSxLQUFFLElBQUVGLEtBQUVFLEVBQUMsRUFBRSxRQUFLQSxPQUFJRixNQUFHQSxLQUFFRSxLQUFHQSxLQUFFO0FBQUEseUJBQVcsT0FBS0EsT0FBSUEsS0FBRUYsS0FBR0EsS0FBRUUsS0FBRSxNQUFJSCxHQUFFLFFBQU9HLEtBQUVMO0FBQUEsY0FBQyxNQUFNLE1BQUlOLEtBQUVRLEtBQUVELE9BQUlQLEtBQUVPLEtBQUVDLEtBQUdDLEtBQUVULElBQUUsS0FBR1MsSUFBRUEsTUFBSTtBQUFDLHlCQUFRRyxLQUFFLE1BQUdGLEtBQUUsR0FBRUEsS0FBRUYsSUFBRUUsS0FBSSxLQUFHTCxHQUFFRCxJQUFFSyxLQUFFQyxFQUFDLE1BQUlMLEdBQUVKLElBQUVTLEVBQUMsR0FBRTtBQUFDLGtCQUFBRSxLQUFFO0FBQUc7QUFBQSxnQkFBSztBQUFDLG9CQUFHQSxHQUFFLFFBQU9IO0FBQUEsY0FBQztBQUFDLHFCQUFNO0FBQUEsWUFBRTtBQUFDLHFCQUFTLEVBQUVMLElBQUVILElBQUVELElBQUVFLElBQUU7QUFBQyxjQUFBRixLQUFFLENBQUNBLE1BQUc7QUFBRSxrQkFBSSxJQUFFSSxHQUFFLFNBQU9KO0FBQUUsY0FBQUUsTUFBR0EsS0FBRSxDQUFDQSxJQUFFQSxLQUFFLE1BQUlBLEtBQUUsTUFBSUEsS0FBRTtBQUFFLGtCQUFJRyxLQUFFSixHQUFFO0FBQU8sY0FBQUMsS0FBRUcsS0FBRSxNQUFJSCxLQUFFRyxLQUFFO0FBQUcsdUJBQVFDLElBQUVDLEtBQUUsR0FBRUEsS0FBRUwsSUFBRSxFQUFFSyxJQUFFO0FBQUMsb0JBQUdELEtBQUUsU0FBU0wsR0FBRSxPQUFPLElBQUVNLElBQUUsQ0FBQyxHQUFFLEVBQUUsR0FBRSxFQUFFRCxFQUFDLEVBQUUsUUFBT0M7QUFBRSxnQkFBQUgsR0FBRUosS0FBRU8sRUFBQyxJQUFFRDtBQUFBLGNBQUM7QUFBQyxxQkFBT0M7QUFBQSxZQUFDO0FBQUMscUJBQVMsRUFBRUgsSUFBRUgsSUFBRUQsSUFBRUUsSUFBRTtBQUFDLHFCQUFPLEVBQUUsRUFBRUQsSUFBRUcsR0FBRSxTQUFPSixFQUFDLEdBQUVJLElBQUVKLElBQUVFLEVBQUM7QUFBQSxZQUFDO0FBQUMscUJBQVMsRUFBRUUsSUFBRUgsSUFBRUQsSUFBRUUsSUFBRTtBQUFDLHFCQUFPLEVBQUVXLEdBQUVaLEVBQUMsR0FBRUcsSUFBRUosSUFBRUUsRUFBQztBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFRSxJQUFFSCxJQUFFRCxJQUFFRSxJQUFFO0FBQUMscUJBQU8sRUFBRUUsSUFBRUgsSUFBRUQsSUFBRUUsRUFBQztBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFRSxJQUFFSCxJQUFFRCxJQUFFRSxJQUFFO0FBQUMscUJBQU8sRUFBRSxFQUFFRCxFQUFDLEdBQUVHLElBQUVKLElBQUVFLEVBQUM7QUFBQSxZQUFDO0FBQUMscUJBQVMsRUFBRUUsSUFBRUgsSUFBRUQsSUFBRUUsSUFBRTtBQUFDLHFCQUFPLEVBQUUsRUFBRUQsSUFBRUcsR0FBRSxTQUFPSixFQUFDLEdBQUVJLElBQUVKLElBQUVFLEVBQUM7QUFBQSxZQUFDO0FBQUMscUJBQVMsRUFBRUUsSUFBRUgsSUFBRUQsSUFBRTtBQUFDLHFCQUFPLE1BQUlDLE1BQUdELE9BQUlJLEdBQUUsU0FBT1UsR0FBRSxjQUFjVixFQUFDLElBQUVVLEdBQUUsY0FBY1YsR0FBRSxNQUFNSCxJQUFFRCxFQUFDLENBQUM7QUFBQSxZQUFDO0FBQUMscUJBQVMsRUFBRUksSUFBRUgsSUFBRUQsSUFBRTtBQUFDLGNBQUFBLEtBQUUsRUFBRUksR0FBRSxRQUFPSixFQUFDO0FBQUUsdUJBQVFFLEtBQUUsQ0FBQyxHQUFFLElBQUVELElBQUUsSUFBRUQsTUFBRztBQUFDLG9CQUFJTSxLQUFFRixHQUFFLENBQUMsR0FBRUcsS0FBRSxNQUFLQyxLQUFFLE1BQUlGLEtBQUUsSUFBRSxNQUFJQSxLQUFFLElBQUUsTUFBSUEsS0FBRSxJQUFFO0FBQUUsb0JBQUcsSUFBRUUsTUFBR1IsSUFBRTtBQUFDLHNCQUFJUyxJQUFFRSxJQUFFQyxJQUFFRjtBQUFFLHdCQUFJRixLQUFFLE1BQUlGLE9BQUlDLEtBQUVELE1BQUcsTUFBSUUsTUFBR0MsS0FBRUwsR0FBRSxJQUFFLENBQUMsR0FBRSxRQUFNLE1BQUlLLFFBQUtDLE1BQUcsS0FBR0osT0FBSSxJQUFFLEtBQUdHLElBQUUsTUFBSUMsT0FBSUgsS0FBRUcsUUFBSyxNQUFJRixNQUFHQyxLQUFFTCxHQUFFLElBQUUsQ0FBQyxHQUFFTyxLQUFFUCxHQUFFLElBQUUsQ0FBQyxHQUFFLFFBQU0sTUFBSUssT0FBSSxRQUFNLE1BQUlFLFFBQUtELE1BQUcsS0FBR0osT0FBSSxNQUFJLEtBQUdHLE9BQUksSUFBRSxLQUFHRSxJQUFFLE9BQUtELE9BQUksUUFBTUEsTUFBRyxRQUFNQSxRQUFLSCxLQUFFRyxRQUFLLE1BQUlGLE1BQUdDLEtBQUVMLEdBQUUsSUFBRSxDQUFDLEdBQUVPLEtBQUVQLEdBQUUsSUFBRSxDQUFDLEdBQUVRLEtBQUVSLEdBQUUsSUFBRSxDQUFDLEdBQUUsUUFBTSxNQUFJSyxPQUFJLFFBQU0sTUFBSUUsT0FBSSxRQUFNLE1BQUlDLFFBQUtGLE1BQUcsS0FBR0osT0FBSSxNQUFJLEtBQUdHLE9BQUksTUFBSSxLQUFHRSxPQUFJLElBQUUsS0FBR0MsSUFBRSxRQUFNRixNQUFHLFVBQVFBLE9BQUlILEtBQUVHLFFBQUs7QUFBQSxnQkFBTTtBQUFDLHlCQUFPSCxNQUFHQSxLQUFFLE9BQU1DLEtBQUUsS0FBRyxRQUFNRCxPQUFJQSxNQUFHLE9BQU1MLEdBQUUsS0FBSyxRQUFNLE9BQUtLLE9BQUksRUFBRSxHQUFFQSxLQUFFLFFBQU0sT0FBS0EsS0FBR0wsR0FBRSxLQUFLSyxFQUFDLEdBQUUsS0FBR0M7QUFBQSxjQUFDO0FBQUMscUJBQU8sRUFBRU4sRUFBQztBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFRSxJQUFFO0FBQUMsa0JBQUlKLEtBQUVJLEdBQUU7QUFBTyxrQkFBR0osTUFBRyxLQUFLLFFBQU9DLEdBQUUsTUFBTSxRQUFPRyxFQUFDO0FBQUUsdUJBQVFGLEtBQUUsSUFBRyxJQUFFLEdBQUUsSUFBRUYsS0FBRyxDQUFBRSxNQUFHRCxHQUFFLE1BQU0sUUFBT0csR0FBRSxNQUFNLEdBQUUsS0FBRyxJQUFJLENBQUM7QUFBRSxxQkFBT0Y7QUFBQSxZQUFDO0FBQUMscUJBQVMsRUFBRUUsSUFBRUosSUFBRUUsSUFBRTtBQUFDLGtCQUFJLElBQUU7QUFBRyxjQUFBQSxLQUFFLEVBQUVFLEdBQUUsUUFBT0YsRUFBQztBQUFFLHVCQUFRSSxLQUFFTixJQUFFTSxLQUFFSixJQUFFLEVBQUVJLEdBQUUsTUFBR0wsR0FBRSxNQUFJRyxHQUFFRSxFQUFDLENBQUM7QUFBRSxxQkFBTztBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFRixJQUFFSixJQUFFRSxJQUFFO0FBQUMsa0JBQUksSUFBRTtBQUFHLGNBQUFBLEtBQUUsRUFBRUUsR0FBRSxRQUFPRixFQUFDO0FBQUUsdUJBQVFJLEtBQUVOLElBQUVNLEtBQUVKLElBQUUsRUFBRUksR0FBRSxNQUFHTCxHQUFFRyxHQUFFRSxFQUFDLENBQUM7QUFBRSxxQkFBTztBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFRixJQUFFSCxJQUFFRCxJQUFFO0FBQUMsa0JBQUlFLEtBQUVFLEdBQUU7QUFBTyxlQUFDLENBQUNILE1BQUcsSUFBRUEsUUFBS0EsS0FBRSxLQUFJLENBQUNELE1BQUcsSUFBRUEsTUFBR0EsS0FBRUUsUUFBS0YsS0FBRUU7QUFBRyx1QkFBUSxJQUFFLElBQUdHLEtBQUVKLElBQUVJLEtBQUVMLElBQUUsRUFBRUssR0FBRSxNQUFHLEVBQUVELEdBQUVDLEVBQUMsQ0FBQztBQUFFLHFCQUFPO0FBQUEsWUFBQztBQUFDLHFCQUFTLEVBQUVELElBQUVKLElBQUVFLElBQUU7QUFBQyx1QkFBUSxJQUFFRSxHQUFFLE1BQU1KLElBQUVFLEVBQUMsR0FBRUcsS0FBRSxJQUFHQyxLQUFFLEdBQUVBLEtBQUUsRUFBRSxRQUFPQSxNQUFHLEVBQUUsQ0FBQUQsTUFBR0osR0FBRSxFQUFFSyxFQUFDLElBQUUsTUFBSSxFQUFFQSxLQUFFLENBQUMsQ0FBQztBQUFFLHFCQUFPRDtBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFRCxJQUFFSCxJQUFFRCxJQUFFO0FBQUMsa0JBQUcsS0FBR0ksS0FBRSxLQUFHLElBQUVBLEdBQUUsT0FBTSxJQUFJLFdBQVcsb0JBQW9CO0FBQUUsa0JBQUdBLEtBQUVILEtBQUVELEdBQUUsT0FBTSxJQUFJLFdBQVcsdUNBQXVDO0FBQUEsWUFBQztBQUFDLHFCQUFTLEVBQUVJLElBQUVILElBQUVELElBQUVFLElBQUUsR0FBRUcsSUFBRTtBQUFDLGtCQUFHLENBQUMsRUFBRSxTQUFTRCxFQUFDLEVBQUUsT0FBTSxJQUFJLFVBQVUsNkNBQStDO0FBQUUsa0JBQUdILEtBQUUsS0FBR0EsS0FBRUksR0FBRSxPQUFNLElBQUksV0FBVyxtQ0FBcUM7QUFBRSxrQkFBR0wsS0FBRUUsS0FBRUUsR0FBRSxPQUFPLE9BQU0sSUFBSSxXQUFXLG9CQUFvQjtBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFQSxJQUFFSCxJQUFFRCxJQUFFRSxJQUFFO0FBQUMsa0JBQUdGLEtBQUVFLEtBQUVFLEdBQUUsT0FBTyxPQUFNLElBQUksV0FBVyxvQkFBb0I7QUFBRSxrQkFBRyxJQUFFSixHQUFFLE9BQU0sSUFBSSxXQUFXLG9CQUFvQjtBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFSSxJQUFFSCxJQUFFRCxJQUFFRSxJQUFFLEdBQUU7QUFBQyxxQkFBT0QsS0FBRSxDQUFDQSxJQUFFRCxRQUFLLEdBQUUsS0FBRyxFQUFFSSxJQUFFSCxJQUFFRCxJQUFFLEdBQUUsc0JBQXFCLHFCQUFxQixHQUFFLEVBQUUsTUFBTUksSUFBRUgsSUFBRUQsSUFBRUUsSUFBRSxJQUFHLENBQUMsR0FBRUYsS0FBRTtBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFSSxJQUFFSCxJQUFFRCxJQUFFRSxJQUFFLEdBQUU7QUFBQyxxQkFBT0QsS0FBRSxDQUFDQSxJQUFFRCxRQUFLLEdBQUUsS0FBRyxFQUFFSSxJQUFFSCxJQUFFRCxJQUFFLEdBQUUsdUJBQXNCLHNCQUFzQixHQUFFLEVBQUUsTUFBTUksSUFBRUgsSUFBRUQsSUFBRUUsSUFBRSxJQUFHLENBQUMsR0FBRUYsS0FBRTtBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFSSxJQUFFO0FBQUMsa0JBQUdBLEtBQUVBLEdBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxHQUFFQSxLQUFFQSxHQUFFLEtBQUssRUFBRSxRQUFRLEdBQUUsRUFBRSxHQUFFLElBQUVBLEdBQUUsT0FBTyxRQUFNO0FBQUcscUJBQUssS0FBR0EsR0FBRSxTQUFPLElBQUcsQ0FBQUEsTUFBRztBQUFJLHFCQUFPQTtBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFQSxJQUFFO0FBQUMscUJBQU8sS0FBR0EsS0FBRSxNQUFJQSxHQUFFLFNBQVMsRUFBRSxJQUFFQSxHQUFFLFNBQVMsRUFBRTtBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFQSxJQUFFSCxJQUFFO0FBQUMsY0FBQUEsS0FBRUEsTUFBRyxJQUFFO0FBQUUsdUJBQVFELElBQUVFLEtBQUVFLEdBQUUsUUFBTyxJQUFFLE1BQUtDLEtBQUUsQ0FBQyxHQUFFQyxLQUFFLEdBQUVBLEtBQUVKLElBQUUsRUFBRUksSUFBRTtBQUFDLG9CQUFHTixLQUFFSSxHQUFFLFdBQVdFLEVBQUMsR0FBRSxRQUFNTixNQUFHLFFBQU1BLElBQUU7QUFBQyxzQkFBRyxDQUFDLEdBQUU7QUFBQyx3QkFBRyxRQUFNQSxJQUFFO0FBQUMsNEJBQUlDLE1BQUcsTUFBSUksR0FBRSxLQUFLLEtBQUksS0FBSSxHQUFHO0FBQUU7QUFBQSxvQkFBUSxXQUFTQyxLQUFFLE1BQUlKLElBQUU7QUFBQyw0QkFBSUQsTUFBRyxNQUFJSSxHQUFFLEtBQUssS0FBSSxLQUFJLEdBQUc7QUFBRTtBQUFBLG9CQUFRO0FBQUMsd0JBQUVMO0FBQUU7QUFBQSxrQkFBUTtBQUFDLHNCQUFHLFFBQU1BLElBQUU7QUFBQywwQkFBSUMsTUFBRyxNQUFJSSxHQUFFLEtBQUssS0FBSSxLQUFJLEdBQUcsR0FBRSxJQUFFTDtBQUFFO0FBQUEsa0JBQVE7QUFBQyxrQkFBQUEsTUFBRyxJQUFFLFNBQU8sS0FBR0EsS0FBRSxTQUFPO0FBQUEsZ0JBQUssTUFBTSxNQUFHLE1BQUlDLE1BQUcsTUFBSUksR0FBRSxLQUFLLEtBQUksS0FBSSxHQUFHO0FBQUUsb0JBQUcsSUFBRSxNQUFLLE1BQUlMLElBQUU7QUFBQyxzQkFBRyxLQUFHQyxNQUFHLEdBQUc7QUFBTSxrQkFBQUksR0FBRSxLQUFLTCxFQUFDO0FBQUEsZ0JBQUMsV0FBUyxPQUFLQSxJQUFFO0FBQUMsc0JBQUcsS0FBR0MsTUFBRyxHQUFHO0FBQU0sa0JBQUFJLEdBQUUsS0FBSyxNQUFJTCxNQUFHLEdBQUUsTUFBSSxLQUFHQSxFQUFDO0FBQUEsZ0JBQUMsV0FBUyxRQUFNQSxJQUFFO0FBQUMsc0JBQUcsS0FBR0MsTUFBRyxHQUFHO0FBQU0sa0JBQUFJLEdBQUUsS0FBSyxNQUFJTCxNQUFHLElBQUcsTUFBSSxLQUFHQSxNQUFHLEdBQUUsTUFBSSxLQUFHQSxFQUFDO0FBQUEsZ0JBQUMsV0FBUyxVQUFRQSxJQUFFO0FBQUMsc0JBQUcsS0FBR0MsTUFBRyxHQUFHO0FBQU0sa0JBQUFJLEdBQUUsS0FBSyxNQUFJTCxNQUFHLElBQUcsTUFBSSxLQUFHQSxNQUFHLElBQUcsTUFBSSxLQUFHQSxNQUFHLEdBQUUsTUFBSSxLQUFHQSxFQUFDO0FBQUEsZ0JBQUMsTUFBTSxPQUFNLElBQUksTUFBTSxvQkFBb0I7QUFBQSxjQUFDO0FBQUMscUJBQU9LO0FBQUEsWUFBQztBQUFDLHFCQUFTUSxHQUFFVCxJQUFFO0FBQUMsdUJBQVFILEtBQUUsQ0FBQyxHQUFFRCxLQUFFLEdBQUVBLEtBQUVJLEdBQUUsUUFBTyxFQUFFSixHQUFFLENBQUFDLEdBQUUsS0FBSyxNQUFJRyxHQUFFLFdBQVdKLEVBQUMsQ0FBQztBQUFFLHFCQUFPQztBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFRyxJQUFFSCxJQUFFO0FBQUMsdUJBQVFELElBQUVFLElBQUUsR0FBRUcsS0FBRSxDQUFDLEdBQUVDLEtBQUUsR0FBRUEsS0FBRUYsR0FBRSxVQUFRLEVBQUUsS0FBR0gsTUFBRyxLQUFJLEVBQUVLLEdBQUUsQ0FBQU4sS0FBRUksR0FBRSxXQUFXRSxFQUFDLEdBQUVKLEtBQUVGLE1BQUcsR0FBRSxJQUFFQSxLQUFFLEtBQUlLLEdBQUUsS0FBSyxDQUFDLEdBQUVBLEdBQUUsS0FBS0gsRUFBQztBQUFFLHFCQUFPRztBQUFBLFlBQUM7QUFBQyxxQkFBUyxFQUFFRCxJQUFFO0FBQUMscUJBQU9VLEdBQUUsWUFBWSxFQUFFVixFQUFDLENBQUM7QUFBQSxZQUFDO0FBQUMscUJBQVMsRUFBRUEsSUFBRUgsSUFBRUQsSUFBRUUsSUFBRTtBQUFDLHVCQUFRLElBQUUsR0FBRSxJQUFFQSxNQUFHLEVBQUUsSUFBRUYsTUFBR0MsR0FBRSxVQUFRLEtBQUdHLEdBQUUsU0FBUSxFQUFFLEVBQUUsQ0FBQUgsR0FBRSxJQUFFRCxFQUFDLElBQUVJLEdBQUUsQ0FBQztBQUFFLHFCQUFPO0FBQUEsWUFBQztBQUFDLHFCQUFTLEVBQUVBLElBQUVILElBQUU7QUFBQyxxQkFBT0csY0FBYUgsTUFBRyxRQUFNRyxNQUFHLFFBQU1BLEdBQUUsZUFBYSxRQUFNQSxHQUFFLFlBQVksUUFBTUEsR0FBRSxZQUFZLFNBQU9ILEdBQUU7QUFBQSxZQUFJO0FBQUMscUJBQVMsRUFBRUcsSUFBRTtBQUFDLHFCQUFPQSxPQUFJQTtBQUFBLFlBQUM7QUFBQyxnQkFBSVUsS0FBRSxFQUFFLFdBQVcsR0FBRSxJQUFFLEVBQUUsU0FBUztBQUFFLFlBQUFkLEdBQUUsU0FBTyxHQUFFQSxHQUFFLGFBQVcsU0FBU0ksSUFBRTtBQUFDLHFCQUFNLENBQUNBLE1BQUdBLE9BQUlBLEtBQUUsSUFBRyxFQUFFLE1BQU0sQ0FBQ0EsRUFBQztBQUFBLFlBQUMsR0FBRUosR0FBRSxvQkFBa0I7QUFBRyxZQUFBQSxHQUFFLGFBQVcsWUFBVyxFQUFFLHVCQUFvQixXQUFVO0FBQUMsa0JBQUc7QUFBQyxvQkFBSUksS0FBRSxJQUFJLFdBQVcsQ0FBQztBQUFFLHVCQUFPQSxHQUFFLFlBQVUsRUFBQyxXQUFVLFdBQVcsV0FBVSxLQUFJLFdBQVU7QUFBQyx5QkFBTztBQUFBLGdCQUFFLEVBQUMsR0FBRSxPQUFLQSxHQUFFLElBQUk7QUFBQSxjQUFDLFNBQU9ILElBQUU7QUFBQyx1QkFBTTtBQUFBLGNBQUU7QUFBQSxZQUFDLEdBQUUsR0FBRSxFQUFFLHVCQUFxQixlQUFhLE9BQU8sV0FBUyxjQUFZLE9BQU8sUUFBUSxTQUFPLFFBQVEsTUFBTSwrSUFBK0ksR0FBRSxPQUFPLGVBQWUsRUFBRSxXQUFVLFVBQVMsRUFBQyxZQUFXLE1BQUcsS0FBSSxXQUFVO0FBQUMscUJBQU8sRUFBRSxTQUFTLElBQUksSUFBRSxLQUFLLFNBQU87QUFBQSxZQUFNLEVBQUMsQ0FBQyxHQUFFLE9BQU8sZUFBZSxFQUFFLFdBQVUsVUFBUyxFQUFDLFlBQVcsTUFBRyxLQUFJLFdBQVU7QUFBQyxxQkFBTyxFQUFFLFNBQVMsSUFBSSxJQUFFLEtBQUssYUFBVztBQUFBLFlBQU0sRUFBQyxDQUFDLEdBQUUsZUFBYSxPQUFPLFVBQVEsUUFBTSxPQUFPLFdBQVMsRUFBRSxPQUFPLE9BQU8sTUFBSSxLQUFHLE9BQU8sZUFBZSxHQUFFLE9BQU8sU0FBUSxFQUFDLE9BQU0sTUFBSyxjQUFhLE1BQUcsWUFBVyxPQUFHLFVBQVMsTUFBRSxDQUFDLEdBQUUsRUFBRSxXQUFTLE1BQUssRUFBRSxPQUFLLFNBQVNHLElBQUVILElBQUVELElBQUU7QUFBQyxxQkFBTyxFQUFFSSxJQUFFSCxJQUFFRCxFQUFDO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxZQUFVLFdBQVcsV0FBVSxFQUFFLFlBQVUsWUFBVyxFQUFFLFFBQU0sU0FBU0ksSUFBRUgsSUFBRUQsSUFBRTtBQUFDLHFCQUFPLEVBQUVJLElBQUVILElBQUVELEVBQUM7QUFBQSxZQUFDLEdBQUUsRUFBRSxjQUFZLFNBQVNJLElBQUU7QUFBQyxxQkFBTyxFQUFFQSxFQUFDO0FBQUEsWUFBQyxHQUFFLEVBQUUsa0JBQWdCLFNBQVNBLElBQUU7QUFBQyxxQkFBTyxFQUFFQSxFQUFDO0FBQUEsWUFBQyxHQUFFLEVBQUUsV0FBUyxTQUFTQSxJQUFFO0FBQUMscUJBQU8sUUFBTUEsTUFBRyxTQUFLQSxHQUFFLGFBQVdBLE9BQUksRUFBRTtBQUFBLFlBQVMsR0FBRSxFQUFFLFVBQVEsU0FBU0EsSUFBRUgsSUFBRTtBQUFDLGtCQUFHLEVBQUVHLElBQUUsVUFBVSxNQUFJQSxLQUFFLEVBQUUsS0FBS0EsSUFBRUEsR0FBRSxRQUFPQSxHQUFFLFVBQVUsSUFBRyxFQUFFSCxJQUFFLFVBQVUsTUFBSUEsS0FBRSxFQUFFLEtBQUtBLElBQUVBLEdBQUUsUUFBT0EsR0FBRSxVQUFVLElBQUcsQ0FBQyxFQUFFLFNBQVNHLEVBQUMsS0FBRyxDQUFDLEVBQUUsU0FBU0gsRUFBQyxFQUFFLE9BQU0sSUFBSSxVQUFVLHVFQUEyRTtBQUFFLGtCQUFHRyxPQUFJSCxHQUFFLFFBQU87QUFBRSx1QkFBUUQsS0FBRUksR0FBRSxRQUFPRixLQUFFRCxHQUFFLFFBQU9LLEtBQUUsR0FBRUUsS0FBRSxFQUFFUixJQUFFRSxFQUFDLEdBQUVJLEtBQUVFLElBQUUsRUFBRUYsR0FBRSxLQUFHRixHQUFFRSxFQUFDLE1BQUlMLEdBQUVLLEVBQUMsR0FBRTtBQUFDLGdCQUFBTixLQUFFSSxHQUFFRSxFQUFDLEdBQUVKLEtBQUVELEdBQUVLLEVBQUM7QUFBRTtBQUFBLGNBQUs7QUFBQyxxQkFBT04sS0FBRUUsS0FBRSxLQUFHQSxLQUFFRixLQUFFLElBQUU7QUFBQSxZQUFDLEdBQUUsRUFBRSxhQUFXLFNBQVNJLElBQUU7QUFBQyx1QkFBUUEsS0FBRSxJQUFJLFlBQVksR0FBRTtBQUFBLGdCQUFDLEtBQUk7QUFBQSxnQkFBTSxLQUFJO0FBQUEsZ0JBQU8sS0FBSTtBQUFBLGdCQUFRLEtBQUk7QUFBQSxnQkFBUSxLQUFJO0FBQUEsZ0JBQVMsS0FBSTtBQUFBLGdCQUFTLEtBQUk7QUFBQSxnQkFBUyxLQUFJO0FBQUEsZ0JBQU8sS0FBSTtBQUFBLGdCQUFRLEtBQUk7QUFBQSxnQkFBVSxLQUFJO0FBQVcseUJBQU07QUFBQSxnQkFBRztBQUFRLHlCQUFNO0FBQUEsY0FBRztBQUFBLFlBQUMsR0FBRSxFQUFFLFNBQU8sU0FBU0EsSUFBRUgsSUFBRTtBQUFDLGtCQUFHLENBQUMsTUFBTSxRQUFRRyxFQUFDLEVBQUUsT0FBTSxJQUFJLFVBQVUsNkNBQStDO0FBQUUsa0JBQUcsTUFBSUEsR0FBRSxPQUFPLFFBQU8sRUFBRSxNQUFNLENBQUM7QUFBRSxrQkFBSUo7QUFBRSxrQkFBR0MsT0FBSSxPQUFPLE1BQUlBLEtBQUUsR0FBRUQsS0FBRSxHQUFFQSxLQUFFSSxHQUFFLFFBQU8sRUFBRUosR0FBRSxDQUFBQyxNQUFHRyxHQUFFSixFQUFDLEVBQUU7QUFBTyxrQkFBSUUsS0FBRSxFQUFFLFlBQVlELEVBQUMsR0FBRSxJQUFFO0FBQUUsbUJBQUlELEtBQUUsR0FBRUEsS0FBRUksR0FBRSxRQUFPLEVBQUVKLElBQUU7QUFBQyxvQkFBSUssS0FBRUQsR0FBRUosRUFBQztBQUFFLG9CQUFHLEVBQUVLLElBQUUsVUFBVSxNQUFJQSxLQUFFLEVBQUUsS0FBS0EsRUFBQyxJQUFHLENBQUMsRUFBRSxTQUFTQSxFQUFDLEVBQUUsT0FBTSxJQUFJLFVBQVUsNkNBQStDO0FBQUUsZ0JBQUFBLEdBQUUsS0FBS0gsSUFBRSxDQUFDLEdBQUUsS0FBR0csR0FBRTtBQUFBLGNBQU07QUFBQyxxQkFBT0g7QUFBQSxZQUFDLEdBQUUsRUFBRSxhQUFXLEdBQUUsRUFBRSxVQUFVLFlBQVUsTUFBRyxFQUFFLFVBQVUsU0FBTyxXQUFVO0FBQUMsa0JBQUlFLEtBQUUsS0FBSztBQUFPLGtCQUFHLEtBQUdBLEtBQUUsRUFBRSxPQUFNLElBQUksV0FBVywyQ0FBMkM7QUFBRSx1QkFBUUgsS0FBRSxHQUFFQSxLQUFFRyxJQUFFSCxNQUFHLEVBQUUsR0FBRSxNQUFLQSxJQUFFQSxLQUFFLENBQUM7QUFBRSxxQkFBTztBQUFBLFlBQUksR0FBRSxFQUFFLFVBQVUsU0FBTyxXQUFVO0FBQUMsa0JBQUlHLEtBQUUsS0FBSztBQUFPLGtCQUFHLEtBQUdBLEtBQUUsRUFBRSxPQUFNLElBQUksV0FBVywyQ0FBMkM7QUFBRSx1QkFBUUgsS0FBRSxHQUFFQSxLQUFFRyxJQUFFSCxNQUFHLEVBQUUsR0FBRSxNQUFLQSxJQUFFQSxLQUFFLENBQUMsR0FBRSxFQUFFLE1BQUtBLEtBQUUsR0FBRUEsS0FBRSxDQUFDO0FBQUUscUJBQU87QUFBQSxZQUFJLEdBQUUsRUFBRSxVQUFVLFNBQU8sV0FBVTtBQUFDLGtCQUFJRyxLQUFFLEtBQUs7QUFBTyxrQkFBRyxLQUFHQSxLQUFFLEVBQUUsT0FBTSxJQUFJLFdBQVcsMkNBQTJDO0FBQUUsdUJBQVFILEtBQUUsR0FBRUEsS0FBRUcsSUFBRUgsTUFBRyxFQUFFLEdBQUUsTUFBS0EsSUFBRUEsS0FBRSxDQUFDLEdBQUUsRUFBRSxNQUFLQSxLQUFFLEdBQUVBLEtBQUUsQ0FBQyxHQUFFLEVBQUUsTUFBS0EsS0FBRSxHQUFFQSxLQUFFLENBQUMsR0FBRSxFQUFFLE1BQUtBLEtBQUUsR0FBRUEsS0FBRSxDQUFDO0FBQUUscUJBQU87QUFBQSxZQUFJLEdBQUUsRUFBRSxVQUFVLFdBQVMsV0FBVTtBQUFDLGtCQUFJRyxLQUFFLEtBQUs7QUFBTyxxQkFBTyxNQUFJQSxLQUFFLEtBQUcsTUFBSSxVQUFVLFNBQU8sRUFBRSxNQUFLLEdBQUVBLEVBQUMsSUFBRSxFQUFFLE1BQU0sTUFBSyxTQUFTO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxpQkFBZSxFQUFFLFVBQVUsVUFBUyxFQUFFLFVBQVUsU0FBTyxTQUFTQSxJQUFFO0FBQUMsa0JBQUcsQ0FBQyxFQUFFLFNBQVNBLEVBQUMsRUFBRSxPQUFNLElBQUksVUFBVSwyQkFBMkI7QUFBRSxxQkFBTyxTQUFPQSxNQUFHLE1BQUksRUFBRSxRQUFRLE1BQUtBLEVBQUM7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLFVBQVEsV0FBVTtBQUFDLGtCQUFJQSxLQUFFLElBQUdILEtBQUVELEdBQUU7QUFBa0IscUJBQU9JLEtBQUUsS0FBSyxTQUFTLE9BQU0sR0FBRUgsRUFBQyxFQUFFLFFBQVEsV0FBVSxLQUFLLEVBQUUsS0FBSyxHQUFFLEtBQUssU0FBT0EsT0FBSUcsTUFBRyxVQUFTLGFBQVdBLEtBQUU7QUFBQSxZQUFHLEdBQUUsRUFBRSxVQUFVLFVBQVEsU0FBU0EsSUFBRUgsSUFBRUQsSUFBRUUsSUFBRSxHQUFFO0FBQUMsa0JBQUcsRUFBRUUsSUFBRSxVQUFVLE1BQUlBLEtBQUUsRUFBRSxLQUFLQSxJQUFFQSxHQUFFLFFBQU9BLEdBQUUsVUFBVSxJQUFHLENBQUMsRUFBRSxTQUFTQSxFQUFDLEVBQUUsT0FBTSxJQUFJLFVBQVUsbUZBQW1GLE9BQU9BLEVBQUM7QUFBRSxrQkFBRyxXQUFTSCxPQUFJQSxLQUFFLElBQUcsV0FBU0QsT0FBSUEsS0FBRUksS0FBRUEsR0FBRSxTQUFPLElBQUcsV0FBU0YsT0FBSUEsS0FBRSxJQUFHLFdBQVMsTUFBSSxJQUFFLEtBQUssU0FBUSxJQUFFRCxNQUFHRCxLQUFFSSxHQUFFLFVBQVEsSUFBRUYsTUFBRyxJQUFFLEtBQUssT0FBTyxPQUFNLElBQUksV0FBVyxvQkFBb0I7QUFBRSxrQkFBR0EsTUFBRyxLQUFHRCxNQUFHRCxHQUFFLFFBQU87QUFBRSxrQkFBR0UsTUFBRyxFQUFFLFFBQU07QUFBRyxrQkFBR0QsTUFBR0QsR0FBRSxRQUFPO0FBQUUsa0JBQUdDLFFBQUssR0FBRUQsUUFBSyxHQUFFRSxRQUFLLEdBQUUsT0FBSyxHQUFFLFNBQU9FLEdBQUUsUUFBTztBQUFFLHVCQUFRRSxLQUFFLElBQUVKLElBQUVNLEtBQUVSLEtBQUVDLElBQUVRLEtBQUUsRUFBRUgsSUFBRUUsRUFBQyxHQUFFRyxLQUFFLEtBQUssTUFBTVQsSUFBRSxDQUFDLEdBQUVVLEtBQUVSLEdBQUUsTUFBTUgsSUFBRUQsRUFBQyxHQUFFVSxLQUFFLEdBQUVBLEtBQUVELElBQUUsRUFBRUMsR0FBRSxLQUFHQyxHQUFFRCxFQUFDLE1BQUlFLEdBQUVGLEVBQUMsR0FBRTtBQUFDLGdCQUFBSixLQUFFSyxHQUFFRCxFQUFDLEdBQUVGLEtBQUVJLEdBQUVGLEVBQUM7QUFBRTtBQUFBLGNBQUs7QUFBQyxxQkFBT0osS0FBRUUsS0FBRSxLQUFHQSxLQUFFRixLQUFFLElBQUU7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLFdBQVMsU0FBU0YsSUFBRUgsSUFBRUQsSUFBRTtBQUFDLHFCQUFNLE9BQUssS0FBSyxRQUFRSSxJQUFFSCxJQUFFRCxFQUFDO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxVQUFRLFNBQVNJLElBQUVILElBQUVELElBQUU7QUFBQyxxQkFBTyxFQUFFLE1BQUtJLElBQUVILElBQUVELElBQUUsSUFBRTtBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsY0FBWSxTQUFTSSxJQUFFSCxJQUFFRCxJQUFFO0FBQUMscUJBQU8sRUFBRSxNQUFLSSxJQUFFSCxJQUFFRCxJQUFFLEtBQUU7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLFFBQU0sU0FBU0ksSUFBRUgsSUFBRUQsSUFBRUUsSUFBRTtBQUFDLGtCQUFHLFdBQVNELEdBQUUsQ0FBQUMsS0FBRSxRQUFPRixLQUFFLEtBQUssUUFBT0MsS0FBRTtBQUFBLHVCQUFVLFdBQVNELE1BQUcsWUFBVSxPQUFPQyxHQUFFLENBQUFDLEtBQUVELElBQUVELEtBQUUsS0FBSyxRQUFPQyxLQUFFO0FBQUEsdUJBQVUsU0FBU0EsRUFBQyxFQUFFLENBQUFBLFFBQUssR0FBRSxTQUFTRCxFQUFDLEtBQUdBLFFBQUssR0FBRSxXQUFTRSxPQUFJQSxLQUFFLFlBQVVBLEtBQUVGLElBQUVBLEtBQUU7QUFBQSxrQkFBYSxPQUFNLElBQUksTUFBTSx5RUFBeUU7QUFBRSxrQkFBSSxJQUFFLEtBQUssU0FBT0M7QUFBRSxtQkFBSSxXQUFTRCxNQUFHQSxLQUFFLE9BQUtBLEtBQUUsSUFBRyxJQUFFSSxHQUFFLFdBQVMsSUFBRUosTUFBRyxJQUFFQyxPQUFJQSxLQUFFLEtBQUssT0FBTyxPQUFNLElBQUksV0FBVyx3Q0FBd0M7QUFBRSxjQUFBQyxPQUFJQSxLQUFFO0FBQVEsdUJBQVFHLEtBQUUsVUFBSyxTQUFPSCxJQUFFO0FBQUEsZ0JBQUMsS0FBSTtBQUFNLHlCQUFPLEVBQUUsTUFBS0UsSUFBRUgsSUFBRUQsRUFBQztBQUFBLGdCQUFFLEtBQUk7QUFBQSxnQkFBTyxLQUFJO0FBQVEseUJBQU8sRUFBRSxNQUFLSSxJQUFFSCxJQUFFRCxFQUFDO0FBQUEsZ0JBQUUsS0FBSTtBQUFRLHlCQUFPLEVBQUUsTUFBS0ksSUFBRUgsSUFBRUQsRUFBQztBQUFBLGdCQUFFLEtBQUk7QUFBQSxnQkFBUyxLQUFJO0FBQVMseUJBQU8sRUFBRSxNQUFLSSxJQUFFSCxJQUFFRCxFQUFDO0FBQUEsZ0JBQUUsS0FBSTtBQUFTLHlCQUFPLEVBQUUsTUFBS0ksSUFBRUgsSUFBRUQsRUFBQztBQUFBLGdCQUFFLEtBQUk7QUFBQSxnQkFBTyxLQUFJO0FBQUEsZ0JBQVEsS0FBSTtBQUFBLGdCQUFVLEtBQUk7QUFBVyx5QkFBTyxFQUFFLE1BQUtJLElBQUVILElBQUVELEVBQUM7QUFBQSxnQkFBRTtBQUFRLHNCQUFHSyxHQUFFLE9BQU0sSUFBSSxVQUFVLHVCQUFxQkgsRUFBQztBQUFFLGtCQUFBQSxNQUFHLEtBQUdBLElBQUcsWUFBWSxHQUFFRyxLQUFFO0FBQUEsY0FBRztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsU0FBTyxXQUFVO0FBQUMscUJBQU0sRUFBQyxNQUFLLFVBQVMsTUFBSyxNQUFNLFVBQVUsTUFBTSxLQUFLLEtBQUssUUFBTSxNQUFLLENBQUMsRUFBQztBQUFBLFlBQUM7QUFBRSxjQUFFLFVBQVUsUUFBTSxTQUFTRCxJQUFFSCxJQUFFO0FBQUMsa0JBQUlELEtBQUUsS0FBSztBQUFPLGNBQUFJLEtBQUUsQ0FBQyxDQUFDQSxJQUFFSCxLQUFFQSxPQUFJLFNBQU9ELEtBQUUsQ0FBQyxDQUFDQyxJQUFFLElBQUVHLE1BQUdBLE1BQUdKLElBQUUsSUFBRUksT0FBSUEsS0FBRSxNQUFJQSxLQUFFSixPQUFJSSxLQUFFSixLQUFHLElBQUVDLE1BQUdBLE1BQUdELElBQUUsSUFBRUMsT0FBSUEsS0FBRSxNQUFJQSxLQUFFRCxPQUFJQyxLQUFFRCxLQUFHQyxLQUFFRyxPQUFJSCxLQUFFRztBQUFHLGtCQUFJRixLQUFFLEtBQUssU0FBU0UsSUFBRUgsRUFBQztBQUFFLHFCQUFPQyxHQUFFLFlBQVUsRUFBRSxXQUFVQTtBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsYUFBVyxTQUFTRSxJQUFFSCxJQUFFRCxJQUFFO0FBQUMsY0FBQUksUUFBSyxHQUFFSCxRQUFLLEdBQUVELE1BQUcsRUFBRUksSUFBRUgsSUFBRSxLQUFLLE1BQU07QUFBRSx1QkFBUUMsS0FBRSxLQUFLRSxFQUFDLEdBQUUsSUFBRSxHQUFFQyxLQUFFLEdBQUUsRUFBRUEsS0FBRUosT0FBSSxLQUFHLE9BQU0sQ0FBQUMsTUFBRyxLQUFLRSxLQUFFQyxFQUFDLElBQUU7QUFBRSxxQkFBT0g7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGFBQVcsU0FBU0UsSUFBRUgsSUFBRUQsSUFBRTtBQUFDLGNBQUFJLFFBQUssR0FBRUgsUUFBSyxHQUFFRCxNQUFHLEVBQUVJLElBQUVILElBQUUsS0FBSyxNQUFNO0FBQUUsdUJBQVFDLEtBQUUsS0FBS0UsS0FBRSxFQUFFSCxFQUFDLEdBQUUsSUFBRSxHQUFFLElBQUVBLE9BQUksS0FBRyxPQUFNLENBQUFDLE1BQUcsS0FBS0UsS0FBRSxFQUFFSCxFQUFDLElBQUU7QUFBRSxxQkFBT0M7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLFlBQVUsU0FBU0UsSUFBRUgsSUFBRTtBQUFDLHFCQUFPRyxRQUFLLEdBQUVILE1BQUcsRUFBRUcsSUFBRSxHQUFFLEtBQUssTUFBTSxHQUFFLEtBQUtBLEVBQUM7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGVBQWEsU0FBU0EsSUFBRUgsSUFBRTtBQUFDLHFCQUFPRyxRQUFLLEdBQUVILE1BQUcsRUFBRUcsSUFBRSxHQUFFLEtBQUssTUFBTSxHQUFFLEtBQUtBLEVBQUMsSUFBRSxLQUFLQSxLQUFFLENBQUMsS0FBRztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsZUFBYSxTQUFTQSxJQUFFSCxJQUFFO0FBQUMscUJBQU9HLFFBQUssR0FBRUgsTUFBRyxFQUFFRyxJQUFFLEdBQUUsS0FBSyxNQUFNLEdBQUUsS0FBS0EsRUFBQyxLQUFHLElBQUUsS0FBS0EsS0FBRSxDQUFDO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxlQUFhLFNBQVNBLElBQUVILElBQUU7QUFBQyxxQkFBT0csUUFBSyxHQUFFSCxNQUFHLEVBQUVHLElBQUUsR0FBRSxLQUFLLE1BQU0sSUFBRyxLQUFLQSxFQUFDLElBQUUsS0FBS0EsS0FBRSxDQUFDLEtBQUcsSUFBRSxLQUFLQSxLQUFFLENBQUMsS0FBRyxNQUFJLFdBQVMsS0FBS0EsS0FBRSxDQUFDO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxlQUFhLFNBQVNBLElBQUVILElBQUU7QUFBQyxxQkFBT0csUUFBSyxHQUFFSCxNQUFHLEVBQUVHLElBQUUsR0FBRSxLQUFLLE1BQU0sR0FBRSxXQUFTLEtBQUtBLEVBQUMsS0FBRyxLQUFLQSxLQUFFLENBQUMsS0FBRyxLQUFHLEtBQUtBLEtBQUUsQ0FBQyxLQUFHLElBQUUsS0FBS0EsS0FBRSxDQUFDO0FBQUEsWUFBRSxHQUFFLEVBQUUsVUFBVSxZQUFVLFNBQVNBLElBQUVILElBQUVELElBQUU7QUFBQyxjQUFBSSxRQUFLLEdBQUVILFFBQUssR0FBRUQsTUFBRyxFQUFFSSxJQUFFSCxJQUFFLEtBQUssTUFBTTtBQUFFLHVCQUFRLElBQUUsS0FBS0csRUFBQyxHQUFFQyxLQUFFLEdBQUVDLEtBQUUsR0FBRSxFQUFFQSxLQUFFTCxPQUFJSSxNQUFHLE9BQU0sTUFBRyxLQUFLRCxLQUFFRSxFQUFDLElBQUVEO0FBQUUscUJBQU9BLE1BQUcsS0FBSSxLQUFHQSxPQUFJLEtBQUcsRUFBRSxHQUFFLElBQUVKLEVBQUMsSUFBRztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsWUFBVSxTQUFTRyxJQUFFSCxJQUFFRCxJQUFFO0FBQUMsY0FBQUksUUFBSyxHQUFFSCxRQUFLLEdBQUVELE1BQUcsRUFBRUksSUFBRUgsSUFBRSxLQUFLLE1BQU07QUFBRSx1QkFBUSxJQUFFQSxJQUFFSSxLQUFFLEdBQUVDLEtBQUUsS0FBS0YsS0FBRSxFQUFFLENBQUMsR0FBRSxJQUFFLE1BQUlDLE1BQUcsT0FBTSxDQUFBQyxNQUFHLEtBQUtGLEtBQUUsRUFBRSxDQUFDLElBQUVDO0FBQUUscUJBQU9BLE1BQUcsS0FBSUMsTUFBR0QsT0FBSUMsTUFBRyxFQUFFLEdBQUUsSUFBRUwsRUFBQyxJQUFHSztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsV0FBUyxTQUFTRixJQUFFSCxJQUFFO0FBQUMscUJBQU9HLFFBQUssR0FBRUgsTUFBRyxFQUFFRyxJQUFFLEdBQUUsS0FBSyxNQUFNLEdBQUUsTUFBSSxLQUFLQSxFQUFDLElBQUUsTUFBSSxNQUFJLEtBQUtBLEVBQUMsSUFBRSxLQUFHLEtBQUtBLEVBQUM7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGNBQVksU0FBU0EsSUFBRUgsSUFBRTtBQUFDLGNBQUFHLFFBQUssR0FBRUgsTUFBRyxFQUFFRyxJQUFFLEdBQUUsS0FBSyxNQUFNO0FBQUUsa0JBQUlKLEtBQUUsS0FBS0ksRUFBQyxJQUFFLEtBQUtBLEtBQUUsQ0FBQyxLQUFHO0FBQUUscUJBQU8sUUFBTUosS0FBRSxhQUFXQSxLQUFFQTtBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsY0FBWSxTQUFTSSxJQUFFSCxJQUFFO0FBQUMsY0FBQUcsUUFBSyxHQUFFSCxNQUFHLEVBQUVHLElBQUUsR0FBRSxLQUFLLE1BQU07QUFBRSxrQkFBSUosS0FBRSxLQUFLSSxLQUFFLENBQUMsSUFBRSxLQUFLQSxFQUFDLEtBQUc7QUFBRSxxQkFBTyxRQUFNSixLQUFFLGFBQVdBLEtBQUVBO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxjQUFZLFNBQVNJLElBQUVILElBQUU7QUFBQyxxQkFBT0csUUFBSyxHQUFFSCxNQUFHLEVBQUVHLElBQUUsR0FBRSxLQUFLLE1BQU0sR0FBRSxLQUFLQSxFQUFDLElBQUUsS0FBS0EsS0FBRSxDQUFDLEtBQUcsSUFBRSxLQUFLQSxLQUFFLENBQUMsS0FBRyxLQUFHLEtBQUtBLEtBQUUsQ0FBQyxLQUFHO0FBQUEsWUFBRSxHQUFFLEVBQUUsVUFBVSxjQUFZLFNBQVNBLElBQUVILElBQUU7QUFBQyxxQkFBT0csUUFBSyxHQUFFSCxNQUFHLEVBQUVHLElBQUUsR0FBRSxLQUFLLE1BQU0sR0FBRSxLQUFLQSxFQUFDLEtBQUcsS0FBRyxLQUFLQSxLQUFFLENBQUMsS0FBRyxLQUFHLEtBQUtBLEtBQUUsQ0FBQyxLQUFHLElBQUUsS0FBS0EsS0FBRSxDQUFDO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxjQUFZLFNBQVNBLElBQUVILElBQUU7QUFBQyxxQkFBT0csUUFBSyxHQUFFSCxNQUFHLEVBQUVHLElBQUUsR0FBRSxLQUFLLE1BQU0sR0FBRSxFQUFFLEtBQUssTUFBS0EsSUFBRSxNQUFHLElBQUcsQ0FBQztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsY0FBWSxTQUFTQSxJQUFFSCxJQUFFO0FBQUMscUJBQU9HLFFBQUssR0FBRUgsTUFBRyxFQUFFRyxJQUFFLEdBQUUsS0FBSyxNQUFNLEdBQUUsRUFBRSxLQUFLLE1BQUtBLElBQUUsT0FBRyxJQUFHLENBQUM7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGVBQWEsU0FBU0EsSUFBRUgsSUFBRTtBQUFDLHFCQUFPRyxRQUFLLEdBQUVILE1BQUcsRUFBRUcsSUFBRSxHQUFFLEtBQUssTUFBTSxHQUFFLEVBQUUsS0FBSyxNQUFLQSxJQUFFLE1BQUcsSUFBRyxDQUFDO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxlQUFhLFNBQVNBLElBQUVILElBQUU7QUFBQyxxQkFBT0csUUFBSyxHQUFFSCxNQUFHLEVBQUVHLElBQUUsR0FBRSxLQUFLLE1BQU0sR0FBRSxFQUFFLEtBQUssTUFBS0EsSUFBRSxPQUFHLElBQUcsQ0FBQztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsY0FBWSxTQUFTQSxJQUFFSCxJQUFFRCxJQUFFLEdBQUU7QUFBQyxrQkFBR0ksS0FBRSxDQUFDQSxJQUFFSCxRQUFLLEdBQUVELFFBQUssR0FBRSxDQUFDLEdBQUU7QUFBQyxvQkFBSUssS0FBRSxFQUFFLEdBQUUsSUFBRUwsRUFBQyxJQUFFO0FBQUUsa0JBQUUsTUFBS0ksSUFBRUgsSUFBRUQsSUFBRUssSUFBRSxDQUFDO0FBQUEsY0FBQztBQUFDLGtCQUFJQyxLQUFFLEdBQUVDLEtBQUU7QUFBRSxtQkFBSSxLQUFLTixFQUFDLElBQUUsTUFBSUcsSUFBRSxFQUFFRyxLQUFFUCxPQUFJTSxNQUFHLE9BQU0sTUFBS0wsS0FBRU0sRUFBQyxJQUFFLE1BQUlILEtBQUVFO0FBQUUscUJBQU9MLEtBQUVEO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxjQUFZLFNBQVNJLElBQUVILElBQUVELElBQUUsR0FBRTtBQUFDLGtCQUFHSSxLQUFFLENBQUNBLElBQUVILFFBQUssR0FBRUQsUUFBSyxHQUFFLENBQUMsR0FBRTtBQUFDLG9CQUFJSyxLQUFFLEVBQUUsR0FBRSxJQUFFTCxFQUFDLElBQUU7QUFBRSxrQkFBRSxNQUFLSSxJQUFFSCxJQUFFRCxJQUFFSyxJQUFFLENBQUM7QUFBQSxjQUFDO0FBQUMsa0JBQUlDLEtBQUVOLEtBQUUsR0FBRU8sS0FBRTtBQUFFLG1CQUFJLEtBQUtOLEtBQUVLLEVBQUMsSUFBRSxNQUFJRixJQUFFLEtBQUcsRUFBRUUsT0FBSUMsTUFBRyxPQUFNLE1BQUtOLEtBQUVLLEVBQUMsSUFBRSxNQUFJRixLQUFFRztBQUFFLHFCQUFPTixLQUFFRDtBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsYUFBVyxTQUFTSSxJQUFFSCxJQUFFRCxJQUFFO0FBQUMscUJBQU9JLEtBQUUsQ0FBQ0EsSUFBRUgsUUFBSyxHQUFFRCxNQUFHLEVBQUUsTUFBS0ksSUFBRUgsSUFBRSxHQUFFLEtBQUksQ0FBQyxHQUFFLEtBQUtBLEVBQUMsSUFBRSxNQUFJRyxJQUFFSCxLQUFFO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxnQkFBYyxTQUFTRyxJQUFFSCxJQUFFRCxJQUFFO0FBQUMscUJBQU9JLEtBQUUsQ0FBQ0EsSUFBRUgsUUFBSyxHQUFFRCxNQUFHLEVBQUUsTUFBS0ksSUFBRUgsSUFBRSxHQUFFLE9BQU0sQ0FBQyxHQUFFLEtBQUtBLEVBQUMsSUFBRSxNQUFJRyxJQUFFLEtBQUtILEtBQUUsQ0FBQyxJQUFFRyxPQUFJLEdBQUVILEtBQUU7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGdCQUFjLFNBQVNHLElBQUVILElBQUVELElBQUU7QUFBQyxxQkFBT0ksS0FBRSxDQUFDQSxJQUFFSCxRQUFLLEdBQUVELE1BQUcsRUFBRSxNQUFLSSxJQUFFSCxJQUFFLEdBQUUsT0FBTSxDQUFDLEdBQUUsS0FBS0EsRUFBQyxJQUFFRyxPQUFJLEdBQUUsS0FBS0gsS0FBRSxDQUFDLElBQUUsTUFBSUcsSUFBRUgsS0FBRTtBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsZ0JBQWMsU0FBU0csSUFBRUgsSUFBRUQsSUFBRTtBQUFDLHFCQUFPSSxLQUFFLENBQUNBLElBQUVILFFBQUssR0FBRUQsTUFBRyxFQUFFLE1BQUtJLElBQUVILElBQUUsR0FBRSxZQUFXLENBQUMsR0FBRSxLQUFLQSxLQUFFLENBQUMsSUFBRUcsT0FBSSxJQUFHLEtBQUtILEtBQUUsQ0FBQyxJQUFFRyxPQUFJLElBQUcsS0FBS0gsS0FBRSxDQUFDLElBQUVHLE9BQUksR0FBRSxLQUFLSCxFQUFDLElBQUUsTUFBSUcsSUFBRUgsS0FBRTtBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsZ0JBQWMsU0FBU0csSUFBRUgsSUFBRUQsSUFBRTtBQUFDLHFCQUFPSSxLQUFFLENBQUNBLElBQUVILFFBQUssR0FBRUQsTUFBRyxFQUFFLE1BQUtJLElBQUVILElBQUUsR0FBRSxZQUFXLENBQUMsR0FBRSxLQUFLQSxFQUFDLElBQUVHLE9BQUksSUFBRyxLQUFLSCxLQUFFLENBQUMsSUFBRUcsT0FBSSxJQUFHLEtBQUtILEtBQUUsQ0FBQyxJQUFFRyxPQUFJLEdBQUUsS0FBS0gsS0FBRSxDQUFDLElBQUUsTUFBSUcsSUFBRUgsS0FBRTtBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsYUFBVyxTQUFTRyxJQUFFSCxJQUFFRCxJQUFFLEdBQUU7QUFBQyxrQkFBR0ksS0FBRSxDQUFDQSxJQUFFSCxRQUFLLEdBQUUsQ0FBQyxHQUFFO0FBQUMsb0JBQUlJLEtBQUUsRUFBRSxHQUFFLElBQUVMLEtBQUUsQ0FBQztBQUFFLGtCQUFFLE1BQUtJLElBQUVILElBQUVELElBQUVLLEtBQUUsR0FBRSxDQUFDQSxFQUFDO0FBQUEsY0FBQztBQUFDLGtCQUFJQyxLQUFFLEdBQUVDLEtBQUUsR0FBRUMsS0FBRTtBQUFFLG1CQUFJLEtBQUtQLEVBQUMsSUFBRSxNQUFJRyxJQUFFLEVBQUVFLEtBQUVOLE9BQUlPLE1BQUcsT0FBTSxLQUFFSCxNQUFHLE1BQUlJLE1BQUcsTUFBSSxLQUFLUCxLQUFFSyxLQUFFLENBQUMsTUFBSUUsS0FBRSxJQUFHLEtBQUtQLEtBQUVLLEVBQUMsSUFBRSxPQUFLRixLQUFFRyxNQUFHLEtBQUdDO0FBQUUscUJBQU9QLEtBQUVEO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxhQUFXLFNBQVNJLElBQUVILElBQUVELElBQUUsR0FBRTtBQUFDLGtCQUFHSSxLQUFFLENBQUNBLElBQUVILFFBQUssR0FBRSxDQUFDLEdBQUU7QUFBQyxvQkFBSUksS0FBRSxFQUFFLEdBQUUsSUFBRUwsS0FBRSxDQUFDO0FBQUUsa0JBQUUsTUFBS0ksSUFBRUgsSUFBRUQsSUFBRUssS0FBRSxHQUFFLENBQUNBLEVBQUM7QUFBQSxjQUFDO0FBQUMsa0JBQUlDLEtBQUVOLEtBQUUsR0FBRU8sS0FBRSxHQUFFQyxLQUFFO0FBQUUsbUJBQUksS0FBS1AsS0FBRUssRUFBQyxJQUFFLE1BQUlGLElBQUUsS0FBRyxFQUFFRSxPQUFJQyxNQUFHLE9BQU0sS0FBRUgsTUFBRyxNQUFJSSxNQUFHLE1BQUksS0FBS1AsS0FBRUssS0FBRSxDQUFDLE1BQUlFLEtBQUUsSUFBRyxLQUFLUCxLQUFFSyxFQUFDLElBQUUsT0FBS0YsS0FBRUcsTUFBRyxLQUFHQztBQUFFLHFCQUFPUCxLQUFFRDtBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsWUFBVSxTQUFTSSxJQUFFSCxJQUFFRCxJQUFFO0FBQUMscUJBQU9JLEtBQUUsQ0FBQ0EsSUFBRUgsUUFBSyxHQUFFRCxNQUFHLEVBQUUsTUFBS0ksSUFBRUgsSUFBRSxHQUFFLEtBQUksSUFBSSxHQUFFLElBQUVHLE9BQUlBLEtBQUUsTUFBSUEsS0FBRSxJQUFHLEtBQUtILEVBQUMsSUFBRSxNQUFJRyxJQUFFSCxLQUFFO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxlQUFhLFNBQVNHLElBQUVILElBQUVELElBQUU7QUFBQyxxQkFBT0ksS0FBRSxDQUFDQSxJQUFFSCxRQUFLLEdBQUVELE1BQUcsRUFBRSxNQUFLSSxJQUFFSCxJQUFFLEdBQUUsT0FBTSxNQUFNLEdBQUUsS0FBS0EsRUFBQyxJQUFFLE1BQUlHLElBQUUsS0FBS0gsS0FBRSxDQUFDLElBQUVHLE9BQUksR0FBRUgsS0FBRTtBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsZUFBYSxTQUFTRyxJQUFFSCxJQUFFRCxJQUFFO0FBQUMscUJBQU9JLEtBQUUsQ0FBQ0EsSUFBRUgsUUFBSyxHQUFFRCxNQUFHLEVBQUUsTUFBS0ksSUFBRUgsSUFBRSxHQUFFLE9BQU0sTUFBTSxHQUFFLEtBQUtBLEVBQUMsSUFBRUcsT0FBSSxHQUFFLEtBQUtILEtBQUUsQ0FBQyxJQUFFLE1BQUlHLElBQUVILEtBQUU7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGVBQWEsU0FBU0csSUFBRUgsSUFBRUQsSUFBRTtBQUFDLHFCQUFPSSxLQUFFLENBQUNBLElBQUVILFFBQUssR0FBRUQsTUFBRyxFQUFFLE1BQUtJLElBQUVILElBQUUsR0FBRSxZQUFXLFdBQVcsR0FBRSxLQUFLQSxFQUFDLElBQUUsTUFBSUcsSUFBRSxLQUFLSCxLQUFFLENBQUMsSUFBRUcsT0FBSSxHQUFFLEtBQUtILEtBQUUsQ0FBQyxJQUFFRyxPQUFJLElBQUcsS0FBS0gsS0FBRSxDQUFDLElBQUVHLE9BQUksSUFBR0gsS0FBRTtBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsZUFBYSxTQUFTRyxJQUFFSCxJQUFFRCxJQUFFO0FBQUMscUJBQU9JLEtBQUUsQ0FBQ0EsSUFBRUgsUUFBSyxHQUFFRCxNQUFHLEVBQUUsTUFBS0ksSUFBRUgsSUFBRSxHQUFFLFlBQVcsV0FBVyxHQUFFLElBQUVHLE9BQUlBLEtBQUUsYUFBV0EsS0FBRSxJQUFHLEtBQUtILEVBQUMsSUFBRUcsT0FBSSxJQUFHLEtBQUtILEtBQUUsQ0FBQyxJQUFFRyxPQUFJLElBQUcsS0FBS0gsS0FBRSxDQUFDLElBQUVHLE9BQUksR0FBRSxLQUFLSCxLQUFFLENBQUMsSUFBRSxNQUFJRyxJQUFFSCxLQUFFO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxlQUFhLFNBQVNHLElBQUVILElBQUVELElBQUU7QUFBQyxxQkFBTyxFQUFFLE1BQUtJLElBQUVILElBQUUsTUFBR0QsRUFBQztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsZUFBYSxTQUFTSSxJQUFFSCxJQUFFRCxJQUFFO0FBQUMscUJBQU8sRUFBRSxNQUFLSSxJQUFFSCxJQUFFLE9BQUdELEVBQUM7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGdCQUFjLFNBQVNJLElBQUVILElBQUVELElBQUU7QUFBQyxxQkFBTyxFQUFFLE1BQUtJLElBQUVILElBQUUsTUFBR0QsRUFBQztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsZ0JBQWMsU0FBU0ksSUFBRUgsSUFBRUQsSUFBRTtBQUFDLHFCQUFPLEVBQUUsTUFBS0ksSUFBRUgsSUFBRSxPQUFHRCxFQUFDO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxPQUFLLFNBQVNJLElBQUVILElBQUVELElBQUVFLElBQUU7QUFBQyxrQkFBRyxDQUFDLEVBQUUsU0FBU0UsRUFBQyxFQUFFLE9BQU0sSUFBSSxVQUFVLDZCQUE2QjtBQUFFLGtCQUFHSixPQUFJQSxLQUFFLElBQUdFLE1BQUcsTUFBSUEsT0FBSUEsS0FBRSxLQUFLLFNBQVFELE1BQUdHLEdBQUUsV0FBU0gsS0FBRUcsR0FBRSxTQUFRSCxPQUFJQSxLQUFFLElBQUcsSUFBRUMsTUFBR0EsS0FBRUYsT0FBSUUsS0FBRUYsS0FBR0UsT0FBSUYsR0FBRSxRQUFPO0FBQUUsa0JBQUcsTUFBSUksR0FBRSxVQUFRLE1BQUksS0FBSyxPQUFPLFFBQU87QUFBRSxrQkFBRyxJQUFFSCxHQUFFLE9BQU0sSUFBSSxXQUFXLDJCQUEyQjtBQUFFLGtCQUFHLElBQUVELE1BQUdBLE1BQUcsS0FBSyxPQUFPLE9BQU0sSUFBSSxXQUFXLG9CQUFvQjtBQUFFLGtCQUFHLElBQUVFLEdBQUUsT0FBTSxJQUFJLFdBQVcseUJBQXlCO0FBQUUsY0FBQUEsS0FBRSxLQUFLLFdBQVNBLEtBQUUsS0FBSyxTQUFRRSxHQUFFLFNBQU9ILEtBQUVDLEtBQUVGLE9BQUlFLEtBQUVFLEdBQUUsU0FBT0gsS0FBRUQ7QUFBRyxrQkFBSSxJQUFFRSxLQUFFRjtBQUFFLGtCQUFHLFNBQU9JLE1BQUcsY0FBWSxPQUFPLFdBQVcsVUFBVSxXQUFXLE1BQUssV0FBV0gsSUFBRUQsSUFBRUUsRUFBQztBQUFBLHVCQUFVLFNBQU9FLE1BQUdKLEtBQUVDLE1BQUdBLEtBQUVDLEdBQUUsVUFBUUcsS0FBRSxJQUFFLEdBQUUsS0FBR0EsSUFBRSxFQUFFQSxHQUFFLENBQUFELEdBQUVDLEtBQUVKLEVBQUMsSUFBRSxLQUFLSSxLQUFFTCxFQUFDO0FBQUEsa0JBQU8sWUFBVyxVQUFVLElBQUksS0FBS0ksSUFBRSxLQUFLLFNBQVNKLElBQUVFLEVBQUMsR0FBRUQsRUFBQztBQUFFLHFCQUFPO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxPQUFLLFNBQVNHLElBQUVILElBQUVELElBQUVFLElBQUU7QUFBQyxrQkFBRyxZQUFVLE9BQU9FLElBQUU7QUFBQyxvQkFBRyxZQUFVLE9BQU9ILE1BQUdDLEtBQUVELElBQUVBLEtBQUUsR0FBRUQsS0FBRSxLQUFLLFVBQVEsWUFBVSxPQUFPQSxPQUFJRSxLQUFFRixJQUFFQSxLQUFFLEtBQUssU0FBUSxXQUFTRSxNQUFHLFlBQVUsT0FBT0EsR0FBRSxPQUFNLElBQUksVUFBVSwyQkFBMkI7QUFBRSxvQkFBRyxZQUFVLE9BQU9BLE1BQUcsQ0FBQyxFQUFFLFdBQVdBLEVBQUMsRUFBRSxPQUFNLElBQUksVUFBVSx1QkFBcUJBLEVBQUM7QUFBRSxvQkFBRyxNQUFJRSxHQUFFLFFBQU87QUFBQyxzQkFBSSxJQUFFQSxHQUFFLFdBQVcsQ0FBQztBQUFFLG1CQUFDLFdBQVNGLE1BQUcsTUFBSSxLQUFHLGFBQVdBLFFBQUtFLEtBQUU7QUFBQSxnQkFBRTtBQUFBLGNBQUMsTUFBSyxhQUFVLE9BQU9BLE9BQUlBLE1BQUc7QUFBSyxrQkFBRyxJQUFFSCxNQUFHLEtBQUssU0FBT0EsTUFBRyxLQUFLLFNBQU9ELEdBQUUsT0FBTSxJQUFJLFdBQVcsb0JBQW9CO0FBQUUsa0JBQUdBLE1BQUdDLEdBQUUsUUFBTztBQUFLLGNBQUFBLFFBQUssR0FBRUQsS0FBRUEsT0FBSSxTQUFPLEtBQUssU0FBT0EsT0FBSSxHQUFFSSxPQUFJQSxLQUFFO0FBQUcsa0JBQUlDO0FBQUUsa0JBQUcsWUFBVSxPQUFPRCxHQUFFLE1BQUlDLEtBQUVKLElBQUVJLEtBQUVMLElBQUUsRUFBRUssR0FBRSxNQUFLQSxFQUFDLElBQUVEO0FBQUEsbUJBQU07QUFBQyxvQkFBSUUsS0FBRSxFQUFFLFNBQVNGLEVBQUMsSUFBRUEsS0FBRSxFQUFFLEtBQUtBLElBQUVGLEVBQUMsR0FBRU0sS0FBRUYsR0FBRTtBQUFPLG9CQUFHLE1BQUlFLEdBQUUsT0FBTSxJQUFJLFVBQVUsZ0JBQWVKLEtBQUUsbUNBQXNDO0FBQUUscUJBQUlDLEtBQUUsR0FBRUEsS0FBRUwsS0FBRUMsSUFBRSxFQUFFSSxHQUFFLE1BQUtBLEtBQUVKLEVBQUMsSUFBRUssR0FBRUQsS0FBRUcsRUFBQztBQUFBLGNBQUM7QUFBQyxxQkFBTztBQUFBLFlBQUk7QUFBRSxnQkFBSSxJQUFFO0FBQUEsVUFBbUIsR0FBRyxLQUFLLElBQUk7QUFBQSxRQUFDLEdBQUcsS0FBSyxNQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU07QUFBQSxNQUFDLEdBQUUsRUFBQyxhQUFZLEdBQUUsUUFBTyxHQUFFLFNBQVEsRUFBQyxDQUFDLEdBQUUsR0FBRSxDQUFDLFNBQVMsR0FBRVAsSUFBRUQsSUFBRTtBQUFDLFNBQUMsU0FBUyxHQUFFO0FBQUMsV0FBQyxXQUFVO0FBQUMscUJBQVNFLEtBQUc7QUFBQyxrQkFBSUU7QUFBRSxrQkFBRztBQUFDLGdCQUFBQSxLQUFFSixHQUFFLFFBQVEsUUFBUSxPQUFPO0FBQUEsY0FBQyxTQUFPSSxJQUFFO0FBQUEsY0FBQztBQUFDLHFCQUFNLENBQUNBLE1BQUcsZUFBYSxPQUFPLEtBQUcsU0FBUSxNQUFJQSxLQUFFLEVBQUUsSUFBSSxRQUFPQTtBQUFBLFlBQUM7QUFBQyxZQUFBSixHQUFFLGFBQVcsU0FBU0ksSUFBRTtBQUFDLGtCQUFHQSxHQUFFLENBQUMsS0FBRyxLQUFLLFlBQVUsT0FBSyxNQUFJLEtBQUssYUFBVyxLQUFLLFlBQVUsUUFBTSxPQUFLQSxHQUFFLENBQUMsS0FBRyxLQUFLLFlBQVUsUUFBTSxPQUFLLE1BQUlILEdBQUUsUUFBUSxTQUFTLEtBQUssSUFBSSxHQUFFLENBQUMsS0FBSyxVQUFVO0FBQU8sb0JBQU1ELEtBQUUsWUFBVSxLQUFLO0FBQU0sY0FBQUksR0FBRSxPQUFPLEdBQUUsR0FBRUosSUFBRSxnQkFBZ0I7QUFBRSxrQkFBSUUsS0FBRSxHQUFFQyxLQUFFO0FBQUUsY0FBQUMsR0FBRSxDQUFDLEVBQUUsUUFBUSxlQUFjLENBQUFBLE9BQUc7QUFBQyx5QkFBT0EsT0FBSUYsTUFBSSxTQUFPRSxPQUFJRCxLQUFFRDtBQUFBLGNBQUcsQ0FBQyxHQUFFRSxHQUFFLE9BQU9ELElBQUUsR0FBRUgsRUFBQztBQUFBLFlBQUMsR0FBRUEsR0FBRSxPQUFLLFNBQVNJLElBQUU7QUFBQyxrQkFBRztBQUFDLGdCQUFBQSxLQUFFSixHQUFFLFFBQVEsUUFBUSxTQUFRSSxFQUFDLElBQUVKLEdBQUUsUUFBUSxXQUFXLE9BQU87QUFBQSxjQUFDLFNBQU9JLElBQUU7QUFBQSxjQUFDO0FBQUEsWUFBQyxHQUFFSixHQUFFLE9BQUtFLElBQUVGLEdBQUUsWUFBVSxXQUFVO0FBQUMscUJBQU0sQ0FBQyxFQUFFLGVBQWEsT0FBTyxVQUFRLE9BQU8sWUFBVSxlQUFhLE9BQU8sUUFBUSxRQUFNLE9BQU8sUUFBUSxZQUFVLEVBQUUsZUFBYSxPQUFPLGFBQVcsVUFBVSxhQUFXLFVBQVUsVUFBVSxZQUFZLEVBQUUsTUFBTSx1QkFBdUIsT0FBSyxlQUFhLE9BQU8sWUFBVSxTQUFTLG1CQUFpQixTQUFTLGdCQUFnQixTQUFPLFNBQVMsZ0JBQWdCLE1BQU0sb0JBQWtCLGVBQWEsT0FBTyxVQUFRLE9BQU8sWUFBVSxPQUFPLFFBQVEsV0FBUyxPQUFPLFFBQVEsYUFBVyxPQUFPLFFBQVEsVUFBUSxlQUFhLE9BQU8sYUFBVyxVQUFVLGFBQVcsVUFBVSxVQUFVLFlBQVksRUFBRSxNQUFNLGdCQUFnQixLQUFHLE1BQUksU0FBUyxPQUFPLElBQUcsRUFBRSxLQUFHLGVBQWEsT0FBTyxhQUFXLFVBQVUsYUFBVyxVQUFVLFVBQVUsWUFBWSxFQUFFLE1BQU0sb0JBQW9CO0FBQUEsWUFBRSxHQUFFQSxHQUFFLFdBQVEsV0FBVTtBQUFDLGtCQUFHO0FBQUMsdUJBQU87QUFBQSxjQUFZLFNBQU9JLElBQUU7QUFBQSxjQUFDO0FBQUEsWUFBQyxHQUFFLEdBQUVKLEdBQUUsVUFBUyx1QkFBSTtBQUFDLGtCQUFJSSxLQUFFO0FBQUcscUJBQU0sTUFBSTtBQUFDLGdCQUFBQSxPQUFJQSxLQUFFLE1BQUcsUUFBUSxLQUFLLHVJQUF1STtBQUFBLGNBQUU7QUFBQSxZQUFDLEdBQUcsR0FBRUosR0FBRSxTQUFPLENBQUMsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsV0FBVSxXQUFVLFdBQVUsU0FBUyxHQUFFQSxHQUFFLE1BQUksUUFBUSxTQUFPLFFBQVEsUUFBTSxNQUFJO0FBQUEsWUFBQyxJQUFHQyxHQUFFLFVBQVEsRUFBRSxVQUFVLEVBQUVELEVBQUM7QUFBRSxrQkFBSyxFQUFDLFlBQVcsRUFBQyxJQUFFQyxHQUFFO0FBQVEsY0FBRSxJQUFFLFNBQVNHLElBQUU7QUFBQyxrQkFBRztBQUFDLHVCQUFPLEtBQUssVUFBVUEsRUFBQztBQUFBLGNBQUMsU0FBT0EsSUFBRTtBQUFDLHVCQUFNLGlDQUErQkEsR0FBRTtBQUFBLGNBQU87QUFBQSxZQUFDO0FBQUEsVUFBQyxHQUFHLEtBQUssSUFBSTtBQUFBLFFBQUMsR0FBRyxLQUFLLE1BQUssRUFBRSxVQUFVLENBQUM7QUFBQSxNQUFDLEdBQUUsRUFBQyxZQUFXLEdBQUUsVUFBUyxHQUFFLENBQUMsR0FBRSxHQUFFLENBQUMsU0FBUyxHQUFFSCxJQUFFO0FBQUMsUUFBQUEsR0FBRSxVQUFRLFNBQVNBLElBQUU7QUFBQyxtQkFBU0MsR0FBRUUsSUFBRTtBQUFDLHFCQUFTSCxN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S0FBRyxFQUFFO0FBQUMsZUFBSSxJQUFFLEtBQUcsS0FBRyxDQUFDLEtBQUcsR0FBRSxNQUFJLENBQUMsR0FBRSxLQUFHSyxJQUFFLElBQUUsR0FBRSxJQUFFLE1BQUksSUFBRUosR0FBRUQsS0FBRSxDQUFDLEdBQUUsS0FBRyxHQUFFLEtBQUcsRUFBRTtBQUFDLGNBQUcsTUFBSSxFQUFFLEtBQUUsSUFBRTtBQUFBLGVBQU07QUFBQyxnQkFBRyxNQUFJLEVBQUUsUUFBTyxJQUFFLE9BQUssSUFBRSxLQUFHLE1BQUksSUFBRTtBQUFHLGlCQUFHLEVBQUUsR0FBRUssRUFBQyxHQUFFLEtBQUc7QUFBQSxVQUFDO0FBQUMsa0JBQU8sSUFBRSxLQUFHLEtBQUcsSUFBRSxFQUFFLEdBQUUsSUFBRUEsRUFBQztBQUFBLFFBQUMsR0FBRSxFQUFFLFFBQU0sU0FBU0YsSUFBRUUsSUFBRSxHQUFFLEdBQUUsR0FBRSxHQUFFO0FBQUMsY0FBSSxHQUFFLEdBQUUsR0FBRSxJQUFFLEtBQUssS0FBSSxJQUFFLEtBQUssS0FBSSxJQUFFLElBQUUsSUFBRSxJQUFFLEdBQUUsS0FBRyxLQUFHLEtBQUcsR0FBRSxJQUFFLEtBQUcsR0FBRSxJQUFFLE9BQUssSUFBRSxFQUFFLEdBQUUsR0FBRyxJQUFFLEVBQUUsR0FBRSxHQUFHLElBQUUsR0FBRSxJQUFFLElBQUUsSUFBRSxJQUFFLEdBQUUsSUFBRSxJQUFFLElBQUUsSUFBRyxJQUFFLElBQUVBLE1BQUcsTUFBSUEsTUFBRyxJQUFFLElBQUVBLEtBQUUsSUFBRTtBQUFFLGVBQUlBLEtBQUUsRUFBRUEsRUFBQyxHQUFFLE1BQU1BLEVBQUMsS0FBR0EsT0FBSSxJQUFFLEtBQUcsSUFBRSxNQUFNQSxFQUFDLElBQUUsSUFBRSxHQUFFLElBQUUsTUFBSSxJQUFFLEVBQUUsRUFBRUEsRUFBQyxJQUFFLENBQUMsR0FBRSxJQUFFQSxNQUFHLElBQUUsRUFBRSxHQUFFLENBQUMsQ0FBQyxPQUFLLEtBQUksS0FBRyxJQUFHQSxNQUFHLEtBQUcsSUFBRSxJQUFFLElBQUUsSUFBRSxJQUFF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S0FBSyxRQUFPQTtBQUFBLFlBQUM7QUFBQSxVQUFDLEVBQUMsR0FBRSxFQUFDLEtBQUksU0FBUSxPQUFNLFdBQVU7QUFBQyxpQkFBSyxPQUFLLEtBQUssT0FBSyxNQUFLLEtBQUssU0FBTztBQUFBLFVBQUMsRUFBQyxHQUFFLEVBQUMsS0FBSSxRQUFPLE9BQU0sU0FBU0EsSUFBRTtBQUFDLGdCQUFHLE1BQUksS0FBSyxPQUFPLFFBQU07QUFBRyxxQkFBUUgsS0FBRSxLQUFLLE1BQUtELEtBQUUsS0FBR0MsR0FBRSxNQUFLQSxLQUFFQSxHQUFFLE9BQU0sQ0FBQUQsTUFBR0ksS0FBRUgsR0FBRTtBQUFLLG1CQUFPRDtBQUFBLFVBQUMsRUFBQyxHQUFFLEVBQUMsS0FBSSxVQUFTLE9BQU0sU0FBU0ksSUFBRTtBQUFDLGdCQUFHLE1BQUksS0FBSyxPQUFPLFFBQU8sRUFBRSxNQUFNLENBQUM7QUFBRSxxQkFBUUgsS0FBRSxFQUFFLFlBQVlHLE9BQUksQ0FBQyxHQUFFSixLQUFFLEtBQUssTUFBS0UsS0FBRSxHQUFFRixLQUFHLEdBQUVBLEdBQUUsTUFBS0MsSUFBRUMsRUFBQyxHQUFFQSxNQUFHRixHQUFFLEtBQUssUUFBT0EsS0FBRUEsR0FBRTtBQUFLLG1CQUFPQztBQUFBLFVBQUMsRUFBQyxHQUFFLEVBQUMsS0FBSSxXQUFVLE9BQU0sU0FBU0csSUFBRUgsSUFBRTtBQUFDLGdCQUFJRDtBQUFFLG1CQUFPSSxLQUFFLEtBQUssS0FBSyxLQUFLLFVBQVFKLEtBQUUsS0FBSyxLQUFLLEtBQUssTUFBTSxHQUFFSSxFQUFDLEdBQUUsS0FBSyxLQUFLLE9BQUssS0FBSyxLQUFLLEtBQUssTUFBTUEsRUFBQyxLQUFHQSxPQUFJLEtBQUssS0FBSyxLQUFLLFNBQU9KLEtBQUUsS0FBSyxNQUFNLElBQUVBLEtBQUVDLEtBQUUsS0FBSyxXQUFXRyxFQUFDLElBQUUsS0FBSyxXQUFXQSxFQUFDLEdBQUVKO0FBQUEsVUFBQyxFQUFDLEdBQUUsRUFBQyxLQUFJLFNBQVEsT0FBTSxXQUFVO0FBQUMsbUJBQU8sS0FBSyxL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QVc7QUFDVCxTQUFLLElBQUksSUFBSSxXQUFXLEtBQUssT0FBTztBQUVwQyxTQUFLLElBQUksS0FBSyxNQUFNO0FBQ0UsTUFBQyxLQUFLLEtBQU0sUUFBUTtBQUN4QyxZQUFNLE9BQU8sS0FBSyxRQUFRO0FBQUEsSUFDNUIsQ0FBQztBQUNELFVBQU0sUUFBUTtBQUFBLEVBQ2hCO0FBQ0Y7IiwKICAibmFtZXMiOiBbIm4iLCAidCIsICJyIiwgImEiLCAiZSIsICJvIiwgImQiLCAicyIsICJsIiwgImMiLCAiZiIsICJ1IiwgInAiLCAiWSIsICIkIiwgImkiLCAiaCIsICJtIiwgImciLCAiXyIsICJtYXAiLCAiY3JlYXRlIiwgImNyZWF0ZSIsICJhcmdzIiwgImlzTmFOIiwgImNyZWF0ZSIsICJpc05hTiIsICJwYXJzZUludCIsICJtYXRjaCIsICJrZXlzIiwgImNyZWF0ZSIsICJldmVyeSIsICJjcmVhdGUiLCAibGVuZ3RoIiwgIm1pbiIsICJtYXgiLCAibWluIiwgIm1heCIsICJtaW4iLCAibWF4IiwgImV2ZXJ5IiwgImV2ZXJ5IiwgImtleXMiLCAiYXJncyIsICIkanNvbiIsICJjcmVhdGUiLCAiY3JlYXRlIiwgImNyZWF0ZSIsICJhcmdzIiwgImNyZWF0ZSIsICJhcmdzIiwgInN0eWxlIiwgImNyZWF0ZSIsICJjcmVhdGVNb2R1bGVMb2dnZXIiLCAiY3JlYXRlIiwgIlkiLCAiZG9jIiwgIlkiLCAiZG9jIiwgImNyZWF0ZSIsICJkYXRhIiwgImNyZWF0ZU1vZHVsZUxvZ2dlciIsICJkb2MiLCAiUGVlciIsICJlbmNvZGVyIiwgImNyZWF0ZSIsICJkYXRhIl0KfQo=

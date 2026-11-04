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
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
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
var subarray = (arr, begin, len) => {
  if (begin < 0 || len < 0 || begin + len > arr.length) {
    throw errorUnexpectedEndOfArray;
  }
  return new Uint8Array(arr.buffer, arr.byteOffset + begin, len);
};
var subdataview = (arr, begin, len) => {
  if (begin < 0 || len < 0 || begin + len > arr.length) {
    throw errorUnexpectedEndOfArray;
  }
  return new DataView(arr.buffer, arr.byteOffset + begin, len);
};
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
  const view = subarray(decoder.arr, decoder.pos, len);
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
  const dv = subdataview(decoder.arr, decoder.pos, len);
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
var fromBase64Node = (s) => new Uint8Array(Buffer.from(s, "base64"));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL3NpbXBsZS1wZWVyL3NpbXBsZXBlZXIubWluLmpzIiwgIi4uLy4uLy4uLy4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL21hcC5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9zZXQuanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvYXJyYXkuanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvb2JzZXJ2YWJsZS5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9tYXRoLmpzIiwgIi4uLy4uLy4uLy4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL3RpbWUuanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvd2Vic29ja2V0LmpzIiwgIi4uLy4uLy4uLy4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL2Vycm9yLmpzIiwgIi4uLy4uLy4uLy4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL2JpbmFyeS5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC93ZWJjcnlwdG8uanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvcmFuZG9tLmpzIiwgIi4uLy4uLy4uLy4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL251bWJlci5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9zdHJpbmcuanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvZW5jb2RpbmcuanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvZGVjb2RpbmcuanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvY29uZGl0aW9ucy5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9zdG9yYWdlLmpzIiwgIi4uLy4uLy4uLy4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL3RyYWl0L2VxdWFsaXR5LmpzIiwgIi4uLy4uLy4uLy4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL29iamVjdC5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9mdW5jdGlvbi5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9lbnZpcm9ubWVudC5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9wYWlyLmpzIiwgIi4uLy4uLy4uLy4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL2J1ZmZlci5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9wcm5nLmpzIiwgIi4uLy4uLy4uLy4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL3NjaGVtYS5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9kb20uanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvanNvbi5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9zeW1ib2wuanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvbG9nZ2luZy5jb21tb24uanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvbG9nZ2luZy5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMvbGliMC9wcm9taXNlLmpzIiwgIi4uLy4uLy4uLy4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy9saWIwL2Jyb2FkY2FzdGNoYW5uZWwuanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL2xpYjAvbXV0ZXguanMiLCAiLi4vLi4vLi4vLi4vLi4vdG1wL2RlcHMvbm9kZV9tb2R1bGVzL3ktd2VicnRjL3NyYy95LXdlYnJ0Yy5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMveS1wcm90b2NvbHMvc3luYy5qcyIsICIuLi8uLi8uLi8uLi8uLi90bXAvZGVwcy9ub2RlX21vZHVsZXMveS1wcm90b2NvbHMvYXdhcmVuZXNzLmpzIiwgIi4uLy4uLy4uLy4uLy4uL3RtcC9kZXBzL25vZGVfbW9kdWxlcy95LXdlYnJ0Yy9zcmMvY3J5cHRvLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIoZnVuY3Rpb24oZSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBtb2R1bGUpbW9kdWxlLmV4cG9ydHM9ZSgpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShbXSxlKTtlbHNle3ZhciB0O3Q9XCJ1bmRlZmluZWRcIj09dHlwZW9mIHdpbmRvdz9cInVuZGVmaW5lZFwiPT10eXBlb2YgZ2xvYmFsP1widW5kZWZpbmVkXCI9PXR5cGVvZiBzZWxmP3RoaXM6c2VsZjpnbG9iYWw6d2luZG93LHQuU2ltcGxlUGVlcj1lKCl9fSkoZnVuY3Rpb24oKXt2YXIgdD1NYXRoLmZsb29yLG49TWF0aC5hYnMscj1NYXRoLnBvdztyZXR1cm4gZnVuY3Rpb24oKXtmdW5jdGlvbiBkKHMsZSxuKXtmdW5jdGlvbiB0KG8saSl7aWYoIWVbb10pe2lmKCFzW29dKXt2YXIgbD1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFpJiZsKXJldHVybiBsKG8sITApO2lmKHIpcmV0dXJuIHIobywhMCk7dmFyIGM9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBjLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsY312YXIgYT1lW29dPXtleHBvcnRzOnt9fTtzW29dWzBdLmNhbGwoYS5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciByPXNbb11bMV1bZV07cmV0dXJuIHQocnx8ZSl9LGEsYS5leHBvcnRzLGQscyxlLG4pfXJldHVybiBlW29dLmV4cG9ydHN9Zm9yKHZhciByPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsYT0wO2E8bi5sZW5ndGg7YSsrKXQoblthXSk7cmV0dXJuIHR9cmV0dXJuIGR9KCkoezE6W2Z1bmN0aW9uKGUsdCxuKXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gcihlKXt2YXIgdD1lLmxlbmd0aDtpZigwPHQlNCl0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0XCIpO3ZhciBuPWUuaW5kZXhPZihcIj1cIik7LTE9PT1uJiYobj10KTt2YXIgcj1uPT09dD8wOjQtbiU0O3JldHVybltuLHJdfWZ1bmN0aW9uIGEoZSx0LG4pe3JldHVybiAzKih0K24pLzQtbn1mdW5jdGlvbiBvKGUpe3ZhciB0LG4sbz1yKGUpLGQ9b1swXSxzPW9bMV0sbD1uZXcgcChhKGUsZCxzKSksYz0wLGY9MDxzP2QtNDpkO2ZvcihuPTA7bjxmO24rPTQpdD11W2UuY2hhckNvZGVBdChuKV08PDE4fHVbZS5jaGFyQ29kZUF0KG4rMSldPDwxMnx1W2UuY2hhckNvZGVBdChuKzIpXTw8Nnx1W2UuY2hhckNvZGVBdChuKzMpXSxsW2MrK109MjU1JnQ+PjE2LGxbYysrXT0yNTUmdD4+OCxsW2MrK109MjU1JnQ7cmV0dXJuIDI9PT1zJiYodD11W2UuY2hhckNvZGVBdChuKV08PDJ8dVtlLmNoYXJDb2RlQXQobisxKV0+PjQsbFtjKytdPTI1NSZ0KSwxPT09cyYmKHQ9dVtlLmNoYXJDb2RlQXQobildPDwxMHx1W2UuY2hhckNvZGVBdChuKzEpXTw8NHx1W2UuY2hhckNvZGVBdChuKzIpXT4+MixsW2MrK109MjU1JnQ+PjgsbFtjKytdPTI1NSZ0KSxsfWZ1bmN0aW9uIGQoZSl7cmV0dXJuIGNbNjMmZT4+MThdK2NbNjMmZT4+MTJdK2NbNjMmZT4+Nl0rY1s2MyZlXX1mdW5jdGlvbiBzKGUsdCxuKXtmb3IodmFyIHIsYT1bXSxvPXQ7bzxuO28rPTMpcj0oMTY3MTE2ODAmZVtvXTw8MTYpKyg2NTI4MCZlW28rMV08PDgpKygyNTUmZVtvKzJdKSxhLnB1c2goZChyKSk7cmV0dXJuIGEuam9pbihcIlwiKX1mdW5jdGlvbiBsKGUpe2Zvcih2YXIgdCxuPWUubGVuZ3RoLHI9biUzLGE9W10sbz0xNjM4MyxkPTAsbD1uLXI7ZDxsO2QrPW8pYS5wdXNoKHMoZSxkLGQrbz5sP2w6ZCtvKSk7cmV0dXJuIDE9PT1yPyh0PWVbbi0xXSxhLnB1c2goY1t0Pj4yXStjWzYzJnQ8PDRdK1wiPT1cIikpOjI9PT1yJiYodD0oZVtuLTJdPDw4KStlW24tMV0sYS5wdXNoKGNbdD4+MTBdK2NbNjMmdD4+NF0rY1s2MyZ0PDwyXStcIj1cIikpLGEuam9pbihcIlwiKX1uLmJ5dGVMZW5ndGg9ZnVuY3Rpb24oZSl7dmFyIHQ9cihlKSxuPXRbMF0sYT10WzFdO3JldHVybiAzKihuK2EpLzQtYX0sbi50b0J5dGVBcnJheT1vLG4uZnJvbUJ5dGVBcnJheT1sO2Zvcih2YXIgYz1bXSx1PVtdLHA9XCJ1bmRlZmluZWRcIj09dHlwZW9mIFVpbnQ4QXJyYXk/QXJyYXk6VWludDhBcnJheSxmPVwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrL1wiLGc9MCxfPWYubGVuZ3RoO2c8XzsrK2cpY1tnXT1mW2ddLHVbZi5jaGFyQ29kZUF0KGcpXT1nO3VbNDVdPTYyLHVbOTVdPTYzfSx7fV0sMjpbZnVuY3Rpb24oKXt9LHt9XSwzOltmdW5jdGlvbihlLHQsbil7KGZ1bmN0aW9uKCl7KGZ1bmN0aW9uKCl7LyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovJ3VzZSBzdHJpY3QnO3ZhciB0PVN0cmluZy5mcm9tQ2hhckNvZGUsbz1NYXRoLm1pbjtmdW5jdGlvbiBkKGUpe2lmKDIxNDc0ODM2NDc8ZSl0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlRoZSB2YWx1ZSBcXFwiXCIrZStcIlxcXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFxcXCJzaXplXFxcIlwiKTt2YXIgdD1uZXcgVWludDhBcnJheShlKTtyZXR1cm4gdC5fX3Byb3RvX189cy5wcm90b3R5cGUsdH1mdW5jdGlvbiBzKGUsdCxuKXtpZihcIm51bWJlclwiPT10eXBlb2YgZSl7aWYoXCJzdHJpbmdcIj09dHlwZW9mIHQpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSBcXFwic3RyaW5nXFxcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLiBSZWNlaXZlZCB0eXBlIG51bWJlclwiKTtyZXR1cm4gcChlKX1yZXR1cm4gbChlLHQsbil9ZnVuY3Rpb24gbChlLHQsbil7aWYoXCJzdHJpbmdcIj09dHlwZW9mIGUpcmV0dXJuIGYoZSx0KTtpZihBcnJheUJ1ZmZlci5pc1ZpZXcoZSkpcmV0dXJuIGcoZSk7aWYobnVsbD09ZSl0aHJvdyBUeXBlRXJyb3IoXCJUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCBvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSBcIit0eXBlb2YgZSk7aWYoSyhlLEFycmF5QnVmZmVyKXx8ZSYmSyhlLmJ1ZmZlcixBcnJheUJ1ZmZlcikpcmV0dXJuIF8oZSx0LG4pO2lmKFwibnVtYmVyXCI9PXR5cGVvZiBlKXRocm93IG5ldyBUeXBlRXJyb3IoXCJUaGUgXFxcInZhbHVlXFxcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBvZiB0eXBlIG51bWJlci4gUmVjZWl2ZWQgdHlwZSBudW1iZXJcIik7dmFyIHI9ZS52YWx1ZU9mJiZlLnZhbHVlT2YoKTtpZihudWxsIT1yJiZyIT09ZSlyZXR1cm4gcy5mcm9tKHIsdCxuKTt2YXIgYT1oKGUpO2lmKGEpcmV0dXJuIGE7aWYoXCJ1bmRlZmluZWRcIiE9dHlwZW9mIFN5bWJvbCYmbnVsbCE9U3ltYm9sLnRvUHJpbWl0aXZlJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiBlW1N5bWJvbC50b1ByaW1pdGl2ZV0pcmV0dXJuIHMuZnJvbShlW1N5bWJvbC50b1ByaW1pdGl2ZV0oXCJzdHJpbmdcIiksdCxuKTt0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgXCIrdHlwZW9mIGUpfWZ1bmN0aW9uIGMoZSl7aWYoXCJudW1iZXJcIiE9dHlwZW9mIGUpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlxcXCJzaXplXFxcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyXCIpO2Vsc2UgaWYoMD5lKXRocm93IG5ldyBSYW5nZUVycm9yKFwiVGhlIHZhbHVlIFxcXCJcIitlK1wiXFxcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXFxcInNpemVcXFwiXCIpfWZ1bmN0aW9uIHUoZSx0LG4pe3JldHVybiBjKGUpLDA+PWU/ZChlKTp2b2lkIDA9PT10P2QoZSk6XCJzdHJpbmdcIj09dHlwZW9mIG4/ZChlKS5maWxsKHQsbik6ZChlKS5maWxsKHQpfWZ1bmN0aW9uIHAoZSl7cmV0dXJuIGMoZSksZCgwPmU/MDowfG0oZSkpfWZ1bmN0aW9uIGYoZSx0KXtpZigoXCJzdHJpbmdcIiE9dHlwZW9mIHR8fFwiXCI9PT10KSYmKHQ9XCJ1dGY4XCIpLCFzLmlzRW5jb2RpbmcodCkpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlVua25vd24gZW5jb2Rpbmc6IFwiK3QpO3ZhciBuPTB8YihlLHQpLHI9ZChuKSxhPXIud3JpdGUoZSx0KTtyZXR1cm4gYSE9PW4mJihyPXIuc2xpY2UoMCxhKSkscn1mdW5jdGlvbiBnKGUpe2Zvcih2YXIgdD0wPmUubGVuZ3RoPzA6MHxtKGUubGVuZ3RoKSxuPWQodCkscj0wO3I8dDtyKz0xKW5bcl09MjU1JmVbcl07cmV0dXJuIG59ZnVuY3Rpb24gXyhlLHQsbil7aWYoMD50fHxlLmJ5dGVMZW5ndGg8dCl0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlxcXCJvZmZzZXRcXFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kc1wiKTtpZihlLmJ5dGVMZW5ndGg8dCsobnx8MCkpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJcXFwibGVuZ3RoXFxcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHNcIik7dmFyIHI7cmV0dXJuIHI9dm9pZCAwPT09dCYmdm9pZCAwPT09bj9uZXcgVWludDhBcnJheShlKTp2b2lkIDA9PT1uP25ldyBVaW50OEFycmF5KGUsdCk6bmV3IFVpbnQ4QXJyYXkoZSx0LG4pLHIuX19wcm90b19fPXMucHJvdG90eXBlLHJ9ZnVuY3Rpb24gaChlKXtpZihzLmlzQnVmZmVyKGUpKXt2YXIgdD0wfG0oZS5sZW5ndGgpLG49ZCh0KTtyZXR1cm4gMD09PW4ubGVuZ3RoP246KGUuY29weShuLDAsMCx0KSxuKX1yZXR1cm4gdm9pZCAwPT09ZS5sZW5ndGg/XCJCdWZmZXJcIj09PWUudHlwZSYmQXJyYXkuaXNBcnJheShlLmRhdGEpP2coZS5kYXRhKTp2b2lkIDA6XCJudW1iZXJcIiE9dHlwZW9mIGUubGVuZ3RofHxYKGUubGVuZ3RoKT9kKDApOmcoZSl9ZnVuY3Rpb24gbShlKXtpZihlPj0yMTQ3NDgzNjQ3KXRocm93IG5ldyBSYW5nZUVycm9yKFwiQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSBzaXplOiAweFwiKzIxNDc0ODM2NDcgLnRvU3RyaW5nKDE2KStcIiBieXRlc1wiKTtyZXR1cm4gMHxlfWZ1bmN0aW9uIGIoZSx0KXtpZihzLmlzQnVmZmVyKGUpKXJldHVybiBlLmxlbmd0aDtpZihBcnJheUJ1ZmZlci5pc1ZpZXcoZSl8fEsoZSxBcnJheUJ1ZmZlcikpcmV0dXJuIGUuYnl0ZUxlbmd0aDtpZihcInN0cmluZ1wiIT10eXBlb2YgZSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIFxcXCJzdHJpbmdcXFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIG9yIEFycmF5QnVmZmVyLiBSZWNlaXZlZCB0eXBlIFwiK3R5cGVvZiBlKTt2YXIgbj1lLmxlbmd0aCxyPTI8YXJndW1lbnRzLmxlbmd0aCYmITA9PT1hcmd1bWVudHNbMl07aWYoIXImJjA9PT1uKXJldHVybiAwO2Zvcih2YXIgYT0hMTs7KXN3aXRjaCh0KXtjYXNlXCJhc2NpaVwiOmNhc2VcImxhdGluMVwiOmNhc2VcImJpbmFyeVwiOnJldHVybiBuO2Nhc2VcInV0ZjhcIjpjYXNlXCJ1dGYtOFwiOnJldHVybiBIKGUpLmxlbmd0aDtjYXNlXCJ1Y3MyXCI6Y2FzZVwidWNzLTJcIjpjYXNlXCJ1dGYxNmxlXCI6Y2FzZVwidXRmLTE2bGVcIjpyZXR1cm4gMipuO2Nhc2VcImhleFwiOnJldHVybiBuPj4+MTtjYXNlXCJiYXNlNjRcIjpyZXR1cm4geihlKS5sZW5ndGg7ZGVmYXVsdDppZihhKXJldHVybiByPy0xOkgoZSkubGVuZ3RoO3Q9KFwiXCIrdCkudG9Mb3dlckNhc2UoKSxhPSEwO319ZnVuY3Rpb24geShlLHQsbil7dmFyIHI9ITE7aWYoKHZvaWQgMD09PXR8fDA+dCkmJih0PTApLHQ+dGhpcy5sZW5ndGgpcmV0dXJuXCJcIjtpZigodm9pZCAwPT09bnx8bj50aGlzLmxlbmd0aCkmJihuPXRoaXMubGVuZ3RoKSwwPj1uKXJldHVyblwiXCI7aWYobj4+Pj0wLHQ+Pj49MCxuPD10KXJldHVyblwiXCI7Zm9yKGV8fChlPVwidXRmOFwiKTs7KXN3aXRjaChlKXtjYXNlXCJoZXhcIjpyZXR1cm4gUCh0aGlzLHQsbik7Y2FzZVwidXRmOFwiOmNhc2VcInV0Zi04XCI6cmV0dXJuIHgodGhpcyx0LG4pO2Nhc2VcImFzY2lpXCI6cmV0dXJuIEQodGhpcyx0LG4pO2Nhc2VcImxhdGluMVwiOmNhc2VcImJpbmFyeVwiOnJldHVybiBJKHRoaXMsdCxuKTtjYXNlXCJiYXNlNjRcIjpyZXR1cm4gQSh0aGlzLHQsbik7Y2FzZVwidWNzMlwiOmNhc2VcInVjcy0yXCI6Y2FzZVwidXRmMTZsZVwiOmNhc2VcInV0Zi0xNmxlXCI6cmV0dXJuIE0odGhpcyx0LG4pO2RlZmF1bHQ6aWYocil0aHJvdyBuZXcgVHlwZUVycm9yKFwiVW5rbm93biBlbmNvZGluZzogXCIrZSk7ZT0oZStcIlwiKS50b0xvd2VyQ2FzZSgpLHI9ITA7fX1mdW5jdGlvbiBDKGUsdCxuKXt2YXIgcj1lW3RdO2VbdF09ZVtuXSxlW25dPXJ9ZnVuY3Rpb24gUihlLHQsbixyLGEpe2lmKDA9PT1lLmxlbmd0aClyZXR1cm4tMTtpZihcInN0cmluZ1wiPT10eXBlb2Ygbj8ocj1uLG49MCk6MjE0NzQ4MzY0NzxuP249MjE0NzQ4MzY0NzotMjE0NzQ4MzY0OD5uJiYobj0tMjE0NzQ4MzY0OCksbj0rbixYKG4pJiYobj1hPzA6ZS5sZW5ndGgtMSksMD5uJiYobj1lLmxlbmd0aCtuKSxuPj1lLmxlbmd0aCl7aWYoYSlyZXR1cm4tMTtuPWUubGVuZ3RoLTF9ZWxzZSBpZigwPm4paWYoYSluPTA7ZWxzZSByZXR1cm4tMTtpZihcInN0cmluZ1wiPT10eXBlb2YgdCYmKHQ9cy5mcm9tKHQscikpLHMuaXNCdWZmZXIodCkpcmV0dXJuIDA9PT10Lmxlbmd0aD8tMTpFKGUsdCxuLHIsYSk7aWYoXCJudW1iZXJcIj09dHlwZW9mIHQpcmV0dXJuIHQmPTI1NSxcImZ1bmN0aW9uXCI9PXR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mP2E/VWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGUsdCxuKTpVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGUsdCxuKTpFKGUsW3RdLG4scixhKTt0aHJvdyBuZXcgVHlwZUVycm9yKFwidmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyXCIpfWZ1bmN0aW9uIEUoZSx0LG4scixhKXtmdW5jdGlvbiBvKGUsdCl7cmV0dXJuIDE9PT1kP2VbdF06ZS5yZWFkVUludDE2QkUodCpkKX12YXIgZD0xLHM9ZS5sZW5ndGgsbD10Lmxlbmd0aDtpZih2b2lkIDAhPT1yJiYocj0ocitcIlwiKS50b0xvd2VyQ2FzZSgpLFwidWNzMlwiPT09cnx8XCJ1Y3MtMlwiPT09cnx8XCJ1dGYxNmxlXCI9PT1yfHxcInV0Zi0xNmxlXCI9PT1yKSl7aWYoMj5lLmxlbmd0aHx8Mj50Lmxlbmd0aClyZXR1cm4tMTtkPTIscy89MixsLz0yLG4vPTJ9dmFyIGM7aWYoYSl7dmFyIHU9LTE7Zm9yKGM9bjtjPHM7YysrKWlmKG8oZSxjKSE9PW8odCwtMT09PXU/MDpjLXUpKS0xIT09dSYmKGMtPWMtdSksdT0tMTtlbHNlIGlmKC0xPT09dSYmKHU9YyksYy11KzE9PT1sKXJldHVybiB1KmR9ZWxzZSBmb3IobitsPnMmJihuPXMtbCksYz1uOzA8PWM7Yy0tKXtmb3IodmFyIHA9ITAsZj0wO2Y8bDtmKyspaWYobyhlLGMrZikhPT1vKHQsZikpe3A9ITE7YnJlYWt9aWYocClyZXR1cm4gY31yZXR1cm4tMX1mdW5jdGlvbiB3KGUsdCxuLHIpe249K258fDA7dmFyIGE9ZS5sZW5ndGgtbjtyPyhyPStyLHI+YSYmKHI9YSkpOnI9YTt2YXIgbz10Lmxlbmd0aDtyPm8vMiYmKHI9by8yKTtmb3IodmFyIGQscz0wO3M8cjsrK3Mpe2lmKGQ9cGFyc2VJbnQodC5zdWJzdHIoMipzLDIpLDE2KSxYKGQpKXJldHVybiBzO2VbbitzXT1kfXJldHVybiBzfWZ1bmN0aW9uIFMoZSx0LG4scil7cmV0dXJuIEcoSCh0LGUubGVuZ3RoLW4pLGUsbixyKX1mdW5jdGlvbiBUKGUsdCxuLHIpe3JldHVybiBHKFkodCksZSxuLHIpfWZ1bmN0aW9uIHYoZSx0LG4scil7cmV0dXJuIFQoZSx0LG4scil9ZnVuY3Rpb24gayhlLHQsbixyKXtyZXR1cm4gRyh6KHQpLGUsbixyKX1mdW5jdGlvbiBMKGUsdCxuLHIpe3JldHVybiBHKFYodCxlLmxlbmd0aC1uKSxlLG4scil9ZnVuY3Rpb24gQShlLHQsbil7cmV0dXJuIDA9PT10JiZuPT09ZS5sZW5ndGg/JC5mcm9tQnl0ZUFycmF5KGUpOiQuZnJvbUJ5dGVBcnJheShlLnNsaWNlKHQsbikpfWZ1bmN0aW9uIHgoZSx0LG4pe249byhlLmxlbmd0aCxuKTtmb3IodmFyIHI9W10sYT10O2E8bjspe3ZhciBkPWVbYV0scz1udWxsLGw9MjM5PGQ/NDoyMjM8ZD8zOjE5MTxkPzI6MTtpZihhK2w8PW4pe3ZhciBjLHUscCxmOzE9PT1sPzEyOD5kJiYocz1kKToyPT09bD8oYz1lW2ErMV0sMTI4PT0oMTkyJmMpJiYoZj0oMzEmZCk8PDZ8NjMmYywxMjc8ZiYmKHM9ZikpKTozPT09bD8oYz1lW2ErMV0sdT1lW2ErMl0sMTI4PT0oMTkyJmMpJiYxMjg9PSgxOTImdSkmJihmPSgxNSZkKTw8MTJ8KDYzJmMpPDw2fDYzJnUsMjA0NzxmJiYoNTUyOTY+Znx8NTczNDM8ZikmJihzPWYpKSk6ND09PWw/KGM9ZVthKzFdLHU9ZVthKzJdLHA9ZVthKzNdLDEyOD09KDE5MiZjKSYmMTI4PT0oMTkyJnUpJiYxMjg9PSgxOTImcCkmJihmPSgxNSZkKTw8MTh8KDYzJmMpPDwxMnwoNjMmdSk8PDZ8NjMmcCw2NTUzNTxmJiYxMTE0MTEyPmYmJihzPWYpKSk6dm9pZCAwfW51bGw9PT1zPyhzPTY1NTMzLGw9MSk6NjU1MzU8cyYmKHMtPTY1NTM2LHIucHVzaCg1NTI5NnwxMDIzJnM+Pj4xMCkscz01NjMyMHwxMDIzJnMpLHIucHVzaChzKSxhKz1sfXJldHVybiBOKHIpfWZ1bmN0aW9uIE4oZSl7dmFyIG49ZS5sZW5ndGg7aWYobjw9NDA5NilyZXR1cm4gdC5hcHBseShTdHJpbmcsZSk7Zm9yKHZhciByPVwiXCIsYT0wO2E8bjspcis9dC5hcHBseShTdHJpbmcsZS5zbGljZShhLGErPTQwOTYpKTtyZXR1cm4gcn1mdW5jdGlvbiBEKGUsbixyKXt2YXIgYT1cIlwiO3I9byhlLmxlbmd0aCxyKTtmb3IodmFyIGQ9bjtkPHI7KytkKWErPXQoMTI3JmVbZF0pO3JldHVybiBhfWZ1bmN0aW9uIEkoZSxuLHIpe3ZhciBhPVwiXCI7cj1vKGUubGVuZ3RoLHIpO2Zvcih2YXIgZD1uO2Q8cjsrK2QpYSs9dChlW2RdKTtyZXR1cm4gYX1mdW5jdGlvbiBQKGUsdCxuKXt2YXIgcj1lLmxlbmd0aDsoIXR8fDA+dCkmJih0PTApLCghbnx8MD5ufHxuPnIpJiYobj1yKTtmb3IodmFyIGE9XCJcIixvPXQ7bzxuOysrbylhKz1XKGVbb10pO3JldHVybiBhfWZ1bmN0aW9uIE0oZSxuLHIpe2Zvcih2YXIgYT1lLnNsaWNlKG4sciksbz1cIlwiLGQ9MDtkPGEubGVuZ3RoO2QrPTIpbys9dChhW2RdKzI1NiphW2QrMV0pO3JldHVybiBvfWZ1bmN0aW9uIE8oZSx0LG4pe2lmKDAhPWUlMXx8MD5lKXRocm93IG5ldyBSYW5nZUVycm9yKFwib2Zmc2V0IGlzIG5vdCB1aW50XCIpO2lmKGUrdD5uKXRocm93IG5ldyBSYW5nZUVycm9yKFwiVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aFwiKX1mdW5jdGlvbiBGKGUsdCxuLHIsYSxvKXtpZighcy5pc0J1ZmZlcihlKSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiXFxcImJ1ZmZlclxcXCIgYXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZVwiKTtpZih0PmF8fHQ8byl0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlxcXCJ2YWx1ZVxcXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kc1wiKTtpZihuK3I+ZS5sZW5ndGgpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbmRleCBvdXQgb2YgcmFuZ2VcIil9ZnVuY3Rpb24gQihlLHQsbixyKXtpZihuK3I+ZS5sZW5ndGgpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbmRleCBvdXQgb2YgcmFuZ2VcIik7aWYoMD5uKXRocm93IG5ldyBSYW5nZUVycm9yKFwiSW5kZXggb3V0IG9mIHJhbmdlXCIpfWZ1bmN0aW9uIFUoZSx0LG4scixhKXtyZXR1cm4gdD0rdCxuPj4+PTAsYXx8QihlLHQsbiw0LDM0MDI4MjM0NjYzODUyODg2ZTIyLC0zNDAyODIzNDY2Mzg1Mjg4NmUyMiksSi53cml0ZShlLHQsbixyLDIzLDQpLG4rNH1mdW5jdGlvbiBqKGUsdCxuLHIsYSl7cmV0dXJuIHQ9K3Qsbj4+Pj0wLGF8fEIoZSx0LG4sOCwxNzk3NjkzMTM0ODYyMzE1N2UyOTIsLTE3OTc2OTMxMzQ4NjIzMTU3ZTI5MiksSi53cml0ZShlLHQsbixyLDUyLDgpLG4rOH1mdW5jdGlvbiBxKGUpe2lmKGU9ZS5zcGxpdChcIj1cIilbMF0sZT1lLnRyaW0oKS5yZXBsYWNlKFEsXCJcIiksMj5lLmxlbmd0aClyZXR1cm5cIlwiO2Zvcig7MCE9ZS5sZW5ndGglNDspZSs9XCI9XCI7cmV0dXJuIGV9ZnVuY3Rpb24gVyhlKXtyZXR1cm4gMTY+ZT9cIjBcIitlLnRvU3RyaW5nKDE2KTplLnRvU3RyaW5nKDE2KX1mdW5jdGlvbiBIKGUsdCl7dD10fHwxLzA7Zm9yKHZhciBuLHI9ZS5sZW5ndGgsYT1udWxsLG89W10sZD0wO2Q8cjsrK2Qpe2lmKG49ZS5jaGFyQ29kZUF0KGQpLDU1Mjk1PG4mJjU3MzQ0Pm4pe2lmKCFhKXtpZig1NjMxOTxuKXstMTwodC09MykmJm8ucHVzaCgyMzksMTkxLDE4OSk7Y29udGludWV9ZWxzZSBpZihkKzE9PT1yKXstMTwodC09MykmJm8ucHVzaCgyMzksMTkxLDE4OSk7Y29udGludWV9YT1uO2NvbnRpbnVlfWlmKDU2MzIwPm4pey0xPCh0LT0zKSYmby5wdXNoKDIzOSwxOTEsMTg5KSxhPW47Y29udGludWV9bj0oYS01NTI5Njw8MTB8bi01NjMyMCkrNjU1MzZ9ZWxzZSBhJiYtMTwodC09MykmJm8ucHVzaCgyMzksMTkxLDE4OSk7aWYoYT1udWxsLDEyOD5uKXtpZigwPih0LT0xKSlicmVhaztvLnB1c2gobil9ZWxzZSBpZigyMDQ4Pm4pe2lmKDA+KHQtPTIpKWJyZWFrO28ucHVzaCgxOTJ8bj4+NiwxMjh8NjMmbil9ZWxzZSBpZig2NTUzNj5uKXtpZigwPih0LT0zKSlicmVhaztvLnB1c2goMjI0fG4+PjEyLDEyOHw2MyZuPj42LDEyOHw2MyZuKX1lbHNlIGlmKDExMTQxMTI+bil7aWYoMD4odC09NCkpYnJlYWs7by5wdXNoKDI0MHxuPj4xOCwxMjh8NjMmbj4+MTIsMTI4fDYzJm4+PjYsMTI4fDYzJm4pfWVsc2UgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBjb2RlIHBvaW50XCIpfXJldHVybiBvfWZ1bmN0aW9uIFkoZSl7Zm9yKHZhciB0PVtdLG49MDtuPGUubGVuZ3RoOysrbil0LnB1c2goMjU1JmUuY2hhckNvZGVBdChuKSk7cmV0dXJuIHR9ZnVuY3Rpb24gVihlLHQpe2Zvcih2YXIgbixyLGEsbz1bXSxkPTA7ZDxlLmxlbmd0aCYmISgwPih0LT0yKSk7KytkKW49ZS5jaGFyQ29kZUF0KGQpLHI9bj4+OCxhPW4lMjU2LG8ucHVzaChhKSxvLnB1c2gocik7cmV0dXJuIG99ZnVuY3Rpb24geihlKXtyZXR1cm4gJC50b0J5dGVBcnJheShxKGUpKX1mdW5jdGlvbiBHKGUsdCxuLHIpe2Zvcih2YXIgYT0wO2E8ciYmIShhK24+PXQubGVuZ3RofHxhPj1lLmxlbmd0aCk7KythKXRbYStuXT1lW2FdO3JldHVybiBhfWZ1bmN0aW9uIEsoZSx0KXtyZXR1cm4gZSBpbnN0YW5jZW9mIHR8fG51bGwhPWUmJm51bGwhPWUuY29uc3RydWN0b3ImJm51bGwhPWUuY29uc3RydWN0b3IubmFtZSYmZS5jb25zdHJ1Y3Rvci5uYW1lPT09dC5uYW1lfWZ1bmN0aW9uIFgoZSl7cmV0dXJuIGUhPT1lfXZhciAkPWUoXCJiYXNlNjQtanNcIiksSj1lKFwiaWVlZTc1NFwiKTtuLkJ1ZmZlcj1zLG4uU2xvd0J1ZmZlcj1mdW5jdGlvbihlKXtyZXR1cm4rZSE9ZSYmKGU9MCkscy5hbGxvYygrZSl9LG4uSU5TUEVDVF9NQVhfQllURVM9NTA7bi5rTWF4TGVuZ3RoPTIxNDc0ODM2NDcscy5UWVBFRF9BUlJBWV9TVVBQT1JUPWZ1bmN0aW9uKCl7dHJ5e3ZhciBlPW5ldyBVaW50OEFycmF5KDEpO3JldHVybiBlLl9fcHJvdG9fXz17X19wcm90b19fOlVpbnQ4QXJyYXkucHJvdG90eXBlLGZvbzpmdW5jdGlvbigpe3JldHVybiA0Mn19LDQyPT09ZS5mb28oKX1jYXRjaCh0KXtyZXR1cm4hMX19KCkscy5UWVBFRF9BUlJBWV9TVVBQT1JUfHxcInVuZGVmaW5lZFwiPT10eXBlb2YgY29uc29sZXx8XCJmdW5jdGlvblwiIT10eXBlb2YgY29uc29sZS5lcnJvcnx8Y29uc29sZS5lcnJvcihcIlRoaXMgYnJvd3NlciBsYWNrcyB0eXBlZCBhcnJheSAoVWludDhBcnJheSkgc3VwcG9ydCB3aGljaCBpcyByZXF1aXJlZCBieSBgYnVmZmVyYCB2NS54LiBVc2UgYGJ1ZmZlcmAgdjQueCBpZiB5b3UgcmVxdWlyZSBvbGQgYnJvd3NlciBzdXBwb3J0LlwiKSxPYmplY3QuZGVmaW5lUHJvcGVydHkocy5wcm90b3R5cGUsXCJwYXJlbnRcIix7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gcy5pc0J1ZmZlcih0aGlzKT90aGlzLmJ1ZmZlcjp2b2lkIDB9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHMucHJvdG90eXBlLFwib2Zmc2V0XCIse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHMuaXNCdWZmZXIodGhpcyk/dGhpcy5ieXRlT2Zmc2V0OnZvaWQgMH19KSxcInVuZGVmaW5lZFwiIT10eXBlb2YgU3ltYm9sJiZudWxsIT1TeW1ib2wuc3BlY2llcyYmc1tTeW1ib2wuc3BlY2llc109PT1zJiZPYmplY3QuZGVmaW5lUHJvcGVydHkocyxTeW1ib2wuc3BlY2llcyx7dmFsdWU6bnVsbCxjb25maWd1cmFibGU6ITAsZW51bWVyYWJsZTohMSx3cml0YWJsZTohMX0pLHMucG9vbFNpemU9ODE5MixzLmZyb209ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBsKGUsdCxuKX0scy5wcm90b3R5cGUuX19wcm90b19fPVVpbnQ4QXJyYXkucHJvdG90eXBlLHMuX19wcm90b19fPVVpbnQ4QXJyYXkscy5hbGxvYz1mdW5jdGlvbihlLHQsbil7cmV0dXJuIHUoZSx0LG4pfSxzLmFsbG9jVW5zYWZlPWZ1bmN0aW9uKGUpe3JldHVybiBwKGUpfSxzLmFsbG9jVW5zYWZlU2xvdz1mdW5jdGlvbihlKXtyZXR1cm4gcChlKX0scy5pc0J1ZmZlcj1mdW5jdGlvbihlKXtyZXR1cm4gbnVsbCE9ZSYmITA9PT1lLl9pc0J1ZmZlciYmZSE9PXMucHJvdG90eXBlfSxzLmNvbXBhcmU9ZnVuY3Rpb24oZSx0KXtpZihLKGUsVWludDhBcnJheSkmJihlPXMuZnJvbShlLGUub2Zmc2V0LGUuYnl0ZUxlbmd0aCkpLEsodCxVaW50OEFycmF5KSYmKHQ9cy5mcm9tKHQsdC5vZmZzZXQsdC5ieXRlTGVuZ3RoKSksIXMuaXNCdWZmZXIoZSl8fCFzLmlzQnVmZmVyKHQpKXRocm93IG5ldyBUeXBlRXJyb3IoXCJUaGUgXFxcImJ1ZjFcXFwiLCBcXFwiYnVmMlxcXCIgYXJndW1lbnRzIG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXlcIik7aWYoZT09PXQpcmV0dXJuIDA7Zm9yKHZhciBuPWUubGVuZ3RoLHI9dC5sZW5ndGgsZD0wLGw9byhuLHIpO2Q8bDsrK2QpaWYoZVtkXSE9PXRbZF0pe249ZVtkXSxyPXRbZF07YnJlYWt9cmV0dXJuIG48cj8tMTpyPG4/MTowfSxzLmlzRW5jb2Rpbmc9ZnVuY3Rpb24oZSl7c3dpdGNoKChlK1wiXCIpLnRvTG93ZXJDYXNlKCkpe2Nhc2VcImhleFwiOmNhc2VcInV0ZjhcIjpjYXNlXCJ1dGYtOFwiOmNhc2VcImFzY2lpXCI6Y2FzZVwibGF0aW4xXCI6Y2FzZVwiYmluYXJ5XCI6Y2FzZVwiYmFzZTY0XCI6Y2FzZVwidWNzMlwiOmNhc2VcInVjcy0yXCI6Y2FzZVwidXRmMTZsZVwiOmNhc2VcInV0Zi0xNmxlXCI6cmV0dXJuITA7ZGVmYXVsdDpyZXR1cm4hMTt9fSxzLmNvbmNhdD1mdW5jdGlvbihlLHQpe2lmKCFBcnJheS5pc0FycmF5KGUpKXRocm93IG5ldyBUeXBlRXJyb3IoXCJcXFwibGlzdFxcXCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzXCIpO2lmKDA9PT1lLmxlbmd0aClyZXR1cm4gcy5hbGxvYygwKTt2YXIgbjtpZih0PT09dm9pZCAwKWZvcih0PTAsbj0wO248ZS5sZW5ndGg7KytuKXQrPWVbbl0ubGVuZ3RoO3ZhciByPXMuYWxsb2NVbnNhZmUodCksYT0wO2ZvcihuPTA7bjxlLmxlbmd0aDsrK24pe3ZhciBvPWVbbl07aWYoSyhvLFVpbnQ4QXJyYXkpJiYobz1zLmZyb20obykpLCFzLmlzQnVmZmVyKG8pKXRocm93IG5ldyBUeXBlRXJyb3IoXCJcXFwibGlzdFxcXCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzXCIpO28uY29weShyLGEpLGErPW8ubGVuZ3RofXJldHVybiByfSxzLmJ5dGVMZW5ndGg9YixzLnByb3RvdHlwZS5faXNCdWZmZXI9ITAscy5wcm90b3R5cGUuc3dhcDE2PWZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5sZW5ndGg7aWYoMCE9ZSUyKXRocm93IG5ldyBSYW5nZUVycm9yKFwiQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDE2LWJpdHNcIik7Zm9yKHZhciB0PTA7dDxlO3QrPTIpQyh0aGlzLHQsdCsxKTtyZXR1cm4gdGhpc30scy5wcm90b3R5cGUuc3dhcDMyPWZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5sZW5ndGg7aWYoMCE9ZSU0KXRocm93IG5ldyBSYW5nZUVycm9yKFwiQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHNcIik7Zm9yKHZhciB0PTA7dDxlO3QrPTQpQyh0aGlzLHQsdCszKSxDKHRoaXMsdCsxLHQrMik7cmV0dXJuIHRoaXN9LHMucHJvdG90eXBlLnN3YXA2ND1mdW5jdGlvbigpe3ZhciBlPXRoaXMubGVuZ3RoO2lmKDAhPWUlOCl0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkJ1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA2NC1iaXRzXCIpO2Zvcih2YXIgdD0wO3Q8ZTt0Kz04KUModGhpcyx0LHQrNyksQyh0aGlzLHQrMSx0KzYpLEModGhpcyx0KzIsdCs1KSxDKHRoaXMsdCszLHQrNCk7cmV0dXJuIHRoaXN9LHMucHJvdG90eXBlLnRvU3RyaW5nPWZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5sZW5ndGg7cmV0dXJuIDA9PT1lP1wiXCI6MD09PWFyZ3VtZW50cy5sZW5ndGg/eCh0aGlzLDAsZSk6eS5hcHBseSh0aGlzLGFyZ3VtZW50cyl9LHMucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nPXMucHJvdG90eXBlLnRvU3RyaW5nLHMucHJvdG90eXBlLmVxdWFscz1mdW5jdGlvbihlKXtpZighcy5pc0J1ZmZlcihlKSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlclwiKTtyZXR1cm4gdGhpcz09PWV8fDA9PT1zLmNvbXBhcmUodGhpcyxlKX0scy5wcm90b3R5cGUuaW5zcGVjdD1mdW5jdGlvbigpe3ZhciBlPVwiXCIsdD1uLklOU1BFQ1RfTUFYX0JZVEVTO3JldHVybiBlPXRoaXMudG9TdHJpbmcoXCJoZXhcIiwwLHQpLnJlcGxhY2UoLyguezJ9KS9nLFwiJDEgXCIpLnRyaW0oKSx0aGlzLmxlbmd0aD50JiYoZSs9XCIgLi4uIFwiKSxcIjxCdWZmZXIgXCIrZStcIj5cIn0scy5wcm90b3R5cGUuY29tcGFyZT1mdW5jdGlvbihlLHQsbixyLGEpe2lmKEsoZSxVaW50OEFycmF5KSYmKGU9cy5mcm9tKGUsZS5vZmZzZXQsZS5ieXRlTGVuZ3RoKSksIXMuaXNCdWZmZXIoZSkpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSBcXFwidGFyZ2V0XFxcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5LiBSZWNlaXZlZCB0eXBlIFwiK3R5cGVvZiBlKTtpZih2b2lkIDA9PT10JiYodD0wKSx2b2lkIDA9PT1uJiYobj1lP2UubGVuZ3RoOjApLHZvaWQgMD09PXImJihyPTApLHZvaWQgMD09PWEmJihhPXRoaXMubGVuZ3RoKSwwPnR8fG4+ZS5sZW5ndGh8fDA+cnx8YT50aGlzLmxlbmd0aCl0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIm91dCBvZiByYW5nZSBpbmRleFwiKTtpZihyPj1hJiZ0Pj1uKXJldHVybiAwO2lmKHI+PWEpcmV0dXJuLTE7aWYodD49bilyZXR1cm4gMTtpZih0Pj4+PTAsbj4+Pj0wLHI+Pj49MCxhPj4+PTAsdGhpcz09PWUpcmV0dXJuIDA7Zm9yKHZhciBkPWEtcixsPW4tdCxjPW8oZCxsKSx1PXRoaXMuc2xpY2UocixhKSxwPWUuc2xpY2UodCxuKSxmPTA7ZjxjOysrZilpZih1W2ZdIT09cFtmXSl7ZD11W2ZdLGw9cFtmXTticmVha31yZXR1cm4gZDxsPy0xOmw8ZD8xOjB9LHMucHJvdG90eXBlLmluY2x1ZGVzPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4tMSE9PXRoaXMuaW5kZXhPZihlLHQsbil9LHMucHJvdG90eXBlLmluZGV4T2Y9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBSKHRoaXMsZSx0LG4sITApfSxzLnByb3RvdHlwZS5sYXN0SW5kZXhPZj1mdW5jdGlvbihlLHQsbil7cmV0dXJuIFIodGhpcyxlLHQsbiwhMSl9LHMucHJvdG90eXBlLndyaXRlPWZ1bmN0aW9uKGUsdCxuLHIpe2lmKHZvaWQgMD09PXQpcj1cInV0ZjhcIixuPXRoaXMubGVuZ3RoLHQ9MDtlbHNlIGlmKHZvaWQgMD09PW4mJlwic3RyaW5nXCI9PXR5cGVvZiB0KXI9dCxuPXRoaXMubGVuZ3RoLHQ9MDtlbHNlIGlmKGlzRmluaXRlKHQpKXQ+Pj49MCxpc0Zpbml0ZShuKT8obj4+Pj0wLHZvaWQgMD09PXImJihyPVwidXRmOFwiKSk6KHI9bixuPXZvaWQgMCk7ZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZFwiKTt2YXIgYT10aGlzLmxlbmd0aC10O2lmKCh2b2lkIDA9PT1ufHxuPmEpJiYobj1hKSwwPGUubGVuZ3RoJiYoMD5ufHwwPnQpfHx0PnRoaXMubGVuZ3RoKXRocm93IG5ldyBSYW5nZUVycm9yKFwiQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHNcIik7cnx8KHI9XCJ1dGY4XCIpO2Zvcih2YXIgbz0hMTs7KXN3aXRjaChyKXtjYXNlXCJoZXhcIjpyZXR1cm4gdyh0aGlzLGUsdCxuKTtjYXNlXCJ1dGY4XCI6Y2FzZVwidXRmLThcIjpyZXR1cm4gUyh0aGlzLGUsdCxuKTtjYXNlXCJhc2NpaVwiOnJldHVybiBUKHRoaXMsZSx0LG4pO2Nhc2VcImxhdGluMVwiOmNhc2VcImJpbmFyeVwiOnJldHVybiB2KHRoaXMsZSx0LG4pO2Nhc2VcImJhc2U2NFwiOnJldHVybiBrKHRoaXMsZSx0LG4pO2Nhc2VcInVjczJcIjpjYXNlXCJ1Y3MtMlwiOmNhc2VcInV0ZjE2bGVcIjpjYXNlXCJ1dGYtMTZsZVwiOnJldHVybiBMKHRoaXMsZSx0LG4pO2RlZmF1bHQ6aWYobyl0aHJvdyBuZXcgVHlwZUVycm9yKFwiVW5rbm93biBlbmNvZGluZzogXCIrcik7cj0oXCJcIityKS50b0xvd2VyQ2FzZSgpLG89ITA7fX0scy5wcm90b3R5cGUudG9KU09OPWZ1bmN0aW9uKCl7cmV0dXJue3R5cGU6XCJCdWZmZXJcIixkYXRhOkFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2Fycnx8dGhpcywwKX19O3MucHJvdG90eXBlLnNsaWNlPWZ1bmN0aW9uKGUsdCl7dmFyIG49dGhpcy5sZW5ndGg7ZT1+fmUsdD10PT09dm9pZCAwP246fn50LDA+ZT8oZSs9biwwPmUmJihlPTApKTplPm4mJihlPW4pLDA+dD8odCs9biwwPnQmJih0PTApKTp0Pm4mJih0PW4pLHQ8ZSYmKHQ9ZSk7dmFyIHI9dGhpcy5zdWJhcnJheShlLHQpO3JldHVybiByLl9fcHJvdG9fXz1zLnByb3RvdHlwZSxyfSxzLnByb3RvdHlwZS5yZWFkVUludExFPWZ1bmN0aW9uKGUsdCxuKXtlPj4+PTAsdD4+Pj0wLG58fE8oZSx0LHRoaXMubGVuZ3RoKTtmb3IodmFyIHI9dGhpc1tlXSxhPTEsbz0wOysrbzx0JiYoYSo9MjU2KTspcis9dGhpc1tlK29dKmE7cmV0dXJuIHJ9LHMucHJvdG90eXBlLnJlYWRVSW50QkU9ZnVuY3Rpb24oZSx0LG4pe2U+Pj49MCx0Pj4+PTAsbnx8TyhlLHQsdGhpcy5sZW5ndGgpO2Zvcih2YXIgcj10aGlzW2UrLS10XSxhPTE7MDx0JiYoYSo9MjU2KTspcis9dGhpc1tlKy0tdF0qYTtyZXR1cm4gcn0scy5wcm90b3R5cGUucmVhZFVJbnQ4PWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsMSx0aGlzLmxlbmd0aCksdGhpc1tlXX0scy5wcm90b3R5cGUucmVhZFVJbnQxNkxFPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsMix0aGlzLmxlbmd0aCksdGhpc1tlXXx0aGlzW2UrMV08PDh9LHMucHJvdG90eXBlLnJlYWRVSW50MTZCRT1mdW5jdGlvbihlLHQpe3JldHVybiBlPj4+PTAsdHx8TyhlLDIsdGhpcy5sZW5ndGgpLHRoaXNbZV08PDh8dGhpc1tlKzFdfSxzLnByb3RvdHlwZS5yZWFkVUludDMyTEU9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZT4+Pj0wLHR8fE8oZSw0LHRoaXMubGVuZ3RoKSwodGhpc1tlXXx0aGlzW2UrMV08PDh8dGhpc1tlKzJdPDwxNikrMTY3NzcyMTYqdGhpc1tlKzNdfSxzLnByb3RvdHlwZS5yZWFkVUludDMyQkU9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZT4+Pj0wLHR8fE8oZSw0LHRoaXMubGVuZ3RoKSwxNjc3NzIxNip0aGlzW2VdKyh0aGlzW2UrMV08PDE2fHRoaXNbZSsyXTw8OHx0aGlzW2UrM10pfSxzLnByb3RvdHlwZS5yZWFkSW50TEU9ZnVuY3Rpb24oZSx0LG4pe2U+Pj49MCx0Pj4+PTAsbnx8TyhlLHQsdGhpcy5sZW5ndGgpO2Zvcih2YXIgYT10aGlzW2VdLG89MSxkPTA7KytkPHQmJihvKj0yNTYpOylhKz10aGlzW2UrZF0qbztyZXR1cm4gbyo9MTI4LGE+PW8mJihhLT1yKDIsOCp0KSksYX0scy5wcm90b3R5cGUucmVhZEludEJFPWZ1bmN0aW9uKGUsdCxuKXtlPj4+PTAsdD4+Pj0wLG58fE8oZSx0LHRoaXMubGVuZ3RoKTtmb3IodmFyIGE9dCxvPTEsZD10aGlzW2UrLS1hXTswPGEmJihvKj0yNTYpOylkKz10aGlzW2UrLS1hXSpvO3JldHVybiBvKj0xMjgsZD49byYmKGQtPXIoMiw4KnQpKSxkfSxzLnByb3RvdHlwZS5yZWFkSW50OD1mdW5jdGlvbihlLHQpe3JldHVybiBlPj4+PTAsdHx8TyhlLDEsdGhpcy5sZW5ndGgpLDEyOCZ0aGlzW2VdPy0xKigyNTUtdGhpc1tlXSsxKTp0aGlzW2VdfSxzLnByb3RvdHlwZS5yZWFkSW50MTZMRT1mdW5jdGlvbihlLHQpe2U+Pj49MCx0fHxPKGUsMix0aGlzLmxlbmd0aCk7dmFyIG49dGhpc1tlXXx0aGlzW2UrMV08PDg7cmV0dXJuIDMyNzY4Jm4/NDI5NDkwMTc2MHxuOm59LHMucHJvdG90eXBlLnJlYWRJbnQxNkJFPWZ1bmN0aW9uKGUsdCl7ZT4+Pj0wLHR8fE8oZSwyLHRoaXMubGVuZ3RoKTt2YXIgbj10aGlzW2UrMV18dGhpc1tlXTw8ODtyZXR1cm4gMzI3Njgmbj80Mjk0OTAxNzYwfG46bn0scy5wcm90b3R5cGUucmVhZEludDMyTEU9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZT4+Pj0wLHR8fE8oZSw0LHRoaXMubGVuZ3RoKSx0aGlzW2VdfHRoaXNbZSsxXTw8OHx0aGlzW2UrMl08PDE2fHRoaXNbZSszXTw8MjR9LHMucHJvdG90eXBlLnJlYWRJbnQzMkJFPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsNCx0aGlzLmxlbmd0aCksdGhpc1tlXTw8MjR8dGhpc1tlKzFdPDwxNnx0aGlzW2UrMl08PDh8dGhpc1tlKzNdfSxzLnByb3RvdHlwZS5yZWFkRmxvYXRMRT1mdW5jdGlvbihlLHQpe3JldHVybiBlPj4+PTAsdHx8TyhlLDQsdGhpcy5sZW5ndGgpLEoucmVhZCh0aGlzLGUsITAsMjMsNCl9LHMucHJvdG90eXBlLnJlYWRGbG9hdEJFPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsNCx0aGlzLmxlbmd0aCksSi5yZWFkKHRoaXMsZSwhMSwyMyw0KX0scy5wcm90b3R5cGUucmVhZERvdWJsZUxFPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsOCx0aGlzLmxlbmd0aCksSi5yZWFkKHRoaXMsZSwhMCw1Miw4KX0scy5wcm90b3R5cGUucmVhZERvdWJsZUJFPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU+Pj49MCx0fHxPKGUsOCx0aGlzLmxlbmd0aCksSi5yZWFkKHRoaXMsZSwhMSw1Miw4KX0scy5wcm90b3R5cGUud3JpdGVVSW50TEU9ZnVuY3Rpb24oZSx0LG4sYSl7aWYoZT0rZSx0Pj4+PTAsbj4+Pj0wLCFhKXt2YXIgbz1yKDIsOCpuKS0xO0YodGhpcyxlLHQsbixvLDApfXZhciBkPTEscz0wO2Zvcih0aGlzW3RdPTI1NSZlOysrczxuJiYoZCo9MjU2KTspdGhpc1t0K3NdPTI1NSZlL2Q7cmV0dXJuIHQrbn0scy5wcm90b3R5cGUud3JpdGVVSW50QkU9ZnVuY3Rpb24oZSx0LG4sYSl7aWYoZT0rZSx0Pj4+PTAsbj4+Pj0wLCFhKXt2YXIgbz1yKDIsOCpuKS0xO0YodGhpcyxlLHQsbixvLDApfXZhciBkPW4tMSxzPTE7Zm9yKHRoaXNbdCtkXT0yNTUmZTswPD0tLWQmJihzKj0yNTYpOyl0aGlzW3QrZF09MjU1JmUvcztyZXR1cm4gdCtufSxzLnByb3RvdHlwZS53cml0ZVVJbnQ4PWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZT0rZSx0Pj4+PTAsbnx8Rih0aGlzLGUsdCwxLDI1NSwwKSx0aGlzW3RdPTI1NSZlLHQrMX0scy5wcm90b3R5cGUud3JpdGVVSW50MTZMRT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGU9K2UsdD4+Pj0wLG58fEYodGhpcyxlLHQsMiw2NTUzNSwwKSx0aGlzW3RdPTI1NSZlLHRoaXNbdCsxXT1lPj4+OCx0KzJ9LHMucHJvdG90eXBlLndyaXRlVUludDE2QkU9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlPStlLHQ+Pj49MCxufHxGKHRoaXMsZSx0LDIsNjU1MzUsMCksdGhpc1t0XT1lPj4+OCx0aGlzW3QrMV09MjU1JmUsdCsyfSxzLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZT0rZSx0Pj4+PTAsbnx8Rih0aGlzLGUsdCw0LDQyOTQ5NjcyOTUsMCksdGhpc1t0KzNdPWU+Pj4yNCx0aGlzW3QrMl09ZT4+PjE2LHRoaXNbdCsxXT1lPj4+OCx0aGlzW3RdPTI1NSZlLHQrNH0scy5wcm90b3R5cGUud3JpdGVVSW50MzJCRT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGU9K2UsdD4+Pj0wLG58fEYodGhpcyxlLHQsNCw0Mjk0OTY3Mjk1LDApLHRoaXNbdF09ZT4+PjI0LHRoaXNbdCsxXT1lPj4+MTYsdGhpc1t0KzJdPWU+Pj44LHRoaXNbdCszXT0yNTUmZSx0KzR9LHMucHJvdG90eXBlLndyaXRlSW50TEU9ZnVuY3Rpb24oZSx0LG4sYSl7aWYoZT0rZSx0Pj4+PTAsIWEpe3ZhciBvPXIoMiw4Km4tMSk7Rih0aGlzLGUsdCxuLG8tMSwtbyl9dmFyIGQ9MCxzPTEsbD0wO2Zvcih0aGlzW3RdPTI1NSZlOysrZDxuJiYocyo9MjU2KTspMD5lJiYwPT09bCYmMCE9PXRoaXNbdCtkLTFdJiYobD0xKSx0aGlzW3QrZF09MjU1JihlL3M+PjApLWw7cmV0dXJuIHQrbn0scy5wcm90b3R5cGUud3JpdGVJbnRCRT1mdW5jdGlvbihlLHQsbixhKXtpZihlPStlLHQ+Pj49MCwhYSl7dmFyIG89cigyLDgqbi0xKTtGKHRoaXMsZSx0LG4sby0xLC1vKX12YXIgZD1uLTEscz0xLGw9MDtmb3IodGhpc1t0K2RdPTI1NSZlOzA8PS0tZCYmKHMqPTI1Nik7KTA+ZSYmMD09PWwmJjAhPT10aGlzW3QrZCsxXSYmKGw9MSksdGhpc1t0K2RdPTI1NSYoZS9zPj4wKS1sO3JldHVybiB0K259LHMucHJvdG90eXBlLndyaXRlSW50OD1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGU9K2UsdD4+Pj0wLG58fEYodGhpcyxlLHQsMSwxMjcsLTEyOCksMD5lJiYoZT0yNTUrZSsxKSx0aGlzW3RdPTI1NSZlLHQrMX0scy5wcm90b3R5cGUud3JpdGVJbnQxNkxFPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZT0rZSx0Pj4+PTAsbnx8Rih0aGlzLGUsdCwyLDMyNzY3LC0zMjc2OCksdGhpc1t0XT0yNTUmZSx0aGlzW3QrMV09ZT4+PjgsdCsyfSxzLnByb3RvdHlwZS53cml0ZUludDE2QkU9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlPStlLHQ+Pj49MCxufHxGKHRoaXMsZSx0LDIsMzI3NjcsLTMyNzY4KSx0aGlzW3RdPWU+Pj44LHRoaXNbdCsxXT0yNTUmZSx0KzJ9LHMucHJvdG90eXBlLndyaXRlSW50MzJMRT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGU9K2UsdD4+Pj0wLG58fEYodGhpcyxlLHQsNCwyMTQ3NDgzNjQ3LC0yMTQ3NDgzNjQ4KSx0aGlzW3RdPTI1NSZlLHRoaXNbdCsxXT1lPj4+OCx0aGlzW3QrMl09ZT4+PjE2LHRoaXNbdCszXT1lPj4+MjQsdCs0fSxzLnByb3RvdHlwZS53cml0ZUludDMyQkU9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlPStlLHQ+Pj49MCxufHxGKHRoaXMsZSx0LDQsMjE0NzQ4MzY0NywtMjE0NzQ4MzY0OCksMD5lJiYoZT00Mjk0OTY3Mjk1K2UrMSksdGhpc1t0XT1lPj4+MjQsdGhpc1t0KzFdPWU+Pj4xNix0aGlzW3QrMl09ZT4+PjgsdGhpc1t0KzNdPTI1NSZlLHQrNH0scy5wcm90b3R5cGUud3JpdGVGbG9hdExFPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gVSh0aGlzLGUsdCwhMCxuKX0scy5wcm90b3R5cGUud3JpdGVGbG9hdEJFPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gVSh0aGlzLGUsdCwhMSxuKX0scy5wcm90b3R5cGUud3JpdGVEb3VibGVMRT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGoodGhpcyxlLHQsITAsbil9LHMucHJvdG90eXBlLndyaXRlRG91YmxlQkU9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBqKHRoaXMsZSx0LCExLG4pfSxzLnByb3RvdHlwZS5jb3B5PWZ1bmN0aW9uKGUsdCxuLHIpe2lmKCFzLmlzQnVmZmVyKGUpKXRocm93IG5ldyBUeXBlRXJyb3IoXCJhcmd1bWVudCBzaG91bGQgYmUgYSBCdWZmZXJcIik7aWYobnx8KG49MCkscnx8MD09PXJ8fChyPXRoaXMubGVuZ3RoKSx0Pj1lLmxlbmd0aCYmKHQ9ZS5sZW5ndGgpLHR8fCh0PTApLDA8ciYmcjxuJiYocj1uKSxyPT09bilyZXR1cm4gMDtpZigwPT09ZS5sZW5ndGh8fDA9PT10aGlzLmxlbmd0aClyZXR1cm4gMDtpZigwPnQpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJ0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzXCIpO2lmKDA+bnx8bj49dGhpcy5sZW5ndGgpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbmRleCBvdXQgb2YgcmFuZ2VcIik7aWYoMD5yKXRocm93IG5ldyBSYW5nZUVycm9yKFwic291cmNlRW5kIG91dCBvZiBib3VuZHNcIik7cj50aGlzLmxlbmd0aCYmKHI9dGhpcy5sZW5ndGgpLGUubGVuZ3RoLXQ8ci1uJiYocj1lLmxlbmd0aC10K24pO3ZhciBhPXItbjtpZih0aGlzPT09ZSYmXCJmdW5jdGlvblwiPT10eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuY29weVdpdGhpbil0aGlzLmNvcHlXaXRoaW4odCxuLHIpO2Vsc2UgaWYodGhpcz09PWUmJm48dCYmdDxyKWZvcih2YXIgbz1hLTE7MDw9bzstLW8pZVtvK3RdPXRoaXNbbytuXTtlbHNlIFVpbnQ4QXJyYXkucHJvdG90eXBlLnNldC5jYWxsKGUsdGhpcy5zdWJhcnJheShuLHIpLHQpO3JldHVybiBhfSxzLnByb3RvdHlwZS5maWxsPWZ1bmN0aW9uKGUsdCxuLHIpe2lmKFwic3RyaW5nXCI9PXR5cGVvZiBlKXtpZihcInN0cmluZ1wiPT10eXBlb2YgdD8ocj10LHQ9MCxuPXRoaXMubGVuZ3RoKTpcInN0cmluZ1wiPT10eXBlb2YgbiYmKHI9bixuPXRoaXMubGVuZ3RoKSx2b2lkIDAhPT1yJiZcInN0cmluZ1wiIT10eXBlb2Ygcil0aHJvdyBuZXcgVHlwZUVycm9yKFwiZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZ1wiKTtpZihcInN0cmluZ1wiPT10eXBlb2YgciYmIXMuaXNFbmNvZGluZyhyKSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiVW5rbm93biBlbmNvZGluZzogXCIrcik7aWYoMT09PWUubGVuZ3RoKXt2YXIgYT1lLmNoYXJDb2RlQXQoMCk7KFwidXRmOFwiPT09ciYmMTI4PmF8fFwibGF0aW4xXCI9PT1yKSYmKGU9YSl9fWVsc2VcIm51bWJlclwiPT10eXBlb2YgZSYmKGUmPTI1NSk7aWYoMD50fHx0aGlzLmxlbmd0aDx0fHx0aGlzLmxlbmd0aDxuKXRocm93IG5ldyBSYW5nZUVycm9yKFwiT3V0IG9mIHJhbmdlIGluZGV4XCIpO2lmKG48PXQpcmV0dXJuIHRoaXM7dD4+Pj0wLG49bj09PXZvaWQgMD90aGlzLmxlbmd0aDpuPj4+MCxlfHwoZT0wKTt2YXIgbztpZihcIm51bWJlclwiPT10eXBlb2YgZSlmb3Iobz10O288bjsrK28pdGhpc1tvXT1lO2Vsc2V7dmFyIGQ9cy5pc0J1ZmZlcihlKT9lOnMuZnJvbShlLHIpLGw9ZC5sZW5ndGg7aWYoMD09PWwpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSB2YWx1ZSBcXFwiXCIrZStcIlxcXCIgaXMgaW52YWxpZCBmb3IgYXJndW1lbnQgXFxcInZhbHVlXFxcIlwiKTtmb3Iobz0wO288bi10Oysrbyl0aGlzW28rdF09ZFtvJWxdfXJldHVybiB0aGlzfTt2YXIgUT0vW14rLzAtOUEtWmEtei1fXS9nfSkuY2FsbCh0aGlzKX0pLmNhbGwodGhpcyxlKFwiYnVmZmVyXCIpLkJ1ZmZlcil9LHtcImJhc2U2NC1qc1wiOjEsYnVmZmVyOjMsaWVlZTc1NDo5fV0sNDpbZnVuY3Rpb24oZSx0LG4peyhmdW5jdGlvbihhKXsoZnVuY3Rpb24oKXtmdW5jdGlvbiByKCl7bGV0IGU7dHJ5e2U9bi5zdG9yYWdlLmdldEl0ZW0oXCJkZWJ1Z1wiKX1jYXRjaChlKXt9cmV0dXJuIWUmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBhJiZcImVudlwiaW4gYSYmKGU9YS5lbnYuREVCVUcpLGV9bi5mb3JtYXRBcmdzPWZ1bmN0aW9uKGUpe2lmKGVbMF09KHRoaXMudXNlQ29sb3JzP1wiJWNcIjpcIlwiKSt0aGlzLm5hbWVzcGFjZSsodGhpcy51c2VDb2xvcnM/XCIgJWNcIjpcIiBcIikrZVswXSsodGhpcy51c2VDb2xvcnM/XCIlYyBcIjpcIiBcIikrXCIrXCIrdC5leHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZiksIXRoaXMudXNlQ29sb3JzKXJldHVybjtjb25zdCBuPVwiY29sb3I6IFwiK3RoaXMuY29sb3I7ZS5zcGxpY2UoMSwwLG4sXCJjb2xvcjogaW5oZXJpdFwiKTtsZXQgcj0wLGE9MDtlWzBdLnJlcGxhY2UoLyVbYS16QS1aJV0vZyxlPT57XCIlJVwiPT09ZXx8KHIrKyxcIiVjXCI9PT1lJiYoYT1yKSl9KSxlLnNwbGljZShhLDAsbil9LG4uc2F2ZT1mdW5jdGlvbihlKXt0cnl7ZT9uLnN0b3JhZ2Uuc2V0SXRlbShcImRlYnVnXCIsZSk6bi5zdG9yYWdlLnJlbW92ZUl0ZW0oXCJkZWJ1Z1wiKX1jYXRjaChlKXt9fSxuLmxvYWQ9cixuLnVzZUNvbG9ycz1mdW5jdGlvbigpe3JldHVybiEhKFwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJndpbmRvdy5wcm9jZXNzJiYoXCJyZW5kZXJlclwiPT09d2luZG93LnByb2Nlc3MudHlwZXx8d2luZG93LnByb2Nlc3MuX19ud2pzKSl8fCEoXCJ1bmRlZmluZWRcIiE9dHlwZW9mIG5hdmlnYXRvciYmbmF2aWdhdG9yLnVzZXJBZ2VudCYmbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC8oZWRnZXx0cmlkZW50KVxcLyhcXGQrKS8pKSYmKFwidW5kZWZpbmVkXCIhPXR5cGVvZiBkb2N1bWVudCYmZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50JiZkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUmJmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5XZWJraXRBcHBlYXJhbmNlfHxcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93JiZ3aW5kb3cuY29uc29sZSYmKHdpbmRvdy5jb25zb2xlLmZpcmVidWd8fHdpbmRvdy5jb25zb2xlLmV4Y2VwdGlvbiYmd2luZG93LmNvbnNvbGUudGFibGUpfHxcInVuZGVmaW5lZFwiIT10eXBlb2YgbmF2aWdhdG9yJiZuYXZpZ2F0b3IudXNlckFnZW50JiZuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSYmMzE8PXBhcnNlSW50KFJlZ0V4cC4kMSwxMCl8fFwidW5kZWZpbmVkXCIhPXR5cGVvZiBuYXZpZ2F0b3ImJm5hdmlnYXRvci51c2VyQWdlbnQmJm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvYXBwbGV3ZWJraXRcXC8oXFxkKykvKSl9LG4uc3RvcmFnZT1mdW5jdGlvbigpe3RyeXtyZXR1cm4gbG9jYWxTdG9yYWdlfWNhdGNoKGUpe319KCksbi5kZXN0cm95PSgoKT0+e2xldCBlPSExO3JldHVybigpPT57ZXx8KGU9ITAsY29uc29sZS53YXJuKFwiSW5zdGFuY2UgbWV0aG9kIGBkZWJ1Zy5kZXN0cm95KClgIGlzIGRlcHJlY2F0ZWQgYW5kIG5vIGxvbmdlciBkb2VzIGFueXRoaW5nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbiBvZiBgZGVidWdgLlwiKSl9fSkoKSxuLmNvbG9ycz1bXCIjMDAwMENDXCIsXCIjMDAwMEZGXCIsXCIjMDAzM0NDXCIsXCIjMDAzM0ZGXCIsXCIjMDA2NkNDXCIsXCIjMDA2NkZGXCIsXCIjMDA5OUNDXCIsXCIjMDA5OUZGXCIsXCIjMDBDQzAwXCIsXCIjMDBDQzMzXCIsXCIjMDBDQzY2XCIsXCIjMDBDQzk5XCIsXCIjMDBDQ0NDXCIsXCIjMDBDQ0ZGXCIsXCIjMzMwMENDXCIsXCIjMzMwMEZGXCIsXCIjMzMzM0NDXCIsXCIjMzMzM0ZGXCIsXCIjMzM2NkNDXCIsXCIjMzM2NkZGXCIsXCIjMzM5OUNDXCIsXCIjMzM5OUZGXCIsXCIjMzNDQzAwXCIsXCIjMzNDQzMzXCIsXCIjMzNDQzY2XCIsXCIjMzNDQzk5XCIsXCIjMzNDQ0NDXCIsXCIjMzNDQ0ZGXCIsXCIjNjYwMENDXCIsXCIjNjYwMEZGXCIsXCIjNjYzM0NDXCIsXCIjNjYzM0ZGXCIsXCIjNjZDQzAwXCIsXCIjNjZDQzMzXCIsXCIjOTkwMENDXCIsXCIjOTkwMEZGXCIsXCIjOTkzM0NDXCIsXCIjOTkzM0ZGXCIsXCIjOTlDQzAwXCIsXCIjOTlDQzMzXCIsXCIjQ0MwMDAwXCIsXCIjQ0MwMDMzXCIsXCIjQ0MwMDY2XCIsXCIjQ0MwMDk5XCIsXCIjQ0MwMENDXCIsXCIjQ0MwMEZGXCIsXCIjQ0MzMzAwXCIsXCIjQ0MzMzMzXCIsXCIjQ0MzMzY2XCIsXCIjQ0MzMzk5XCIsXCIjQ0MzM0NDXCIsXCIjQ0MzM0ZGXCIsXCIjQ0M2NjAwXCIsXCIjQ0M2NjMzXCIsXCIjQ0M5OTAwXCIsXCIjQ0M5OTMzXCIsXCIjQ0NDQzAwXCIsXCIjQ0NDQzMzXCIsXCIjRkYwMDAwXCIsXCIjRkYwMDMzXCIsXCIjRkYwMDY2XCIsXCIjRkYwMDk5XCIsXCIjRkYwMENDXCIsXCIjRkYwMEZGXCIsXCIjRkYzMzAwXCIsXCIjRkYzMzMzXCIsXCIjRkYzMzY2XCIsXCIjRkYzMzk5XCIsXCIjRkYzM0NDXCIsXCIjRkYzM0ZGXCIsXCIjRkY2NjAwXCIsXCIjRkY2NjMzXCIsXCIjRkY5OTAwXCIsXCIjRkY5OTMzXCIsXCIjRkZDQzAwXCIsXCIjRkZDQzMzXCJdLG4ubG9nPWNvbnNvbGUuZGVidWd8fGNvbnNvbGUubG9nfHwoKCk9Pnt9KSx0LmV4cG9ydHM9ZShcIi4vY29tbW9uXCIpKG4pO2NvbnN0e2Zvcm1hdHRlcnM6b309dC5leHBvcnRzO28uaj1mdW5jdGlvbihlKXt0cnl7cmV0dXJuIEpTT04uc3RyaW5naWZ5KGUpfWNhdGNoKGUpe3JldHVyblwiW1VuZXhwZWN0ZWRKU09OUGFyc2VFcnJvcl06IFwiK2UubWVzc2FnZX19fSkuY2FsbCh0aGlzKX0pLmNhbGwodGhpcyxlKFwiX3Byb2Nlc3NcIikpfSx7XCIuL2NvbW1vblwiOjUsX3Byb2Nlc3M6MTJ9XSw1OltmdW5jdGlvbihlLHQpe3QuZXhwb3J0cz1mdW5jdGlvbih0KXtmdW5jdGlvbiByKGUpe2Z1bmN0aW9uIHQoLi4uZSl7aWYoIXQuZW5hYmxlZClyZXR1cm47Y29uc3QgYT10LG89K25ldyBEYXRlLGk9by0obnx8byk7YS5kaWZmPWksYS5wcmV2PW4sYS5jdXJyPW8sbj1vLGVbMF09ci5jb2VyY2UoZVswXSksXCJzdHJpbmdcIiE9dHlwZW9mIGVbMF0mJmUudW5zaGlmdChcIiVPXCIpO2xldCBkPTA7ZVswXT1lWzBdLnJlcGxhY2UoLyUoW2EtekEtWiVdKS9nLCh0LG4pPT57aWYoXCIlJVwiPT09dClyZXR1cm5cIiVcIjtkKys7Y29uc3Qgbz1yLmZvcm1hdHRlcnNbbl07aWYoXCJmdW5jdGlvblwiPT10eXBlb2Ygbyl7Y29uc3Qgbj1lW2RdO3Q9by5jYWxsKGEsbiksZS5zcGxpY2UoZCwxKSxkLS19cmV0dXJuIHR9KSxyLmZvcm1hdEFyZ3MuY2FsbChhLGUpO2NvbnN0IHM9YS5sb2d8fHIubG9nO3MuYXBwbHkoYSxlKX1sZXQgbixvPW51bGw7cmV0dXJuIHQubmFtZXNwYWNlPWUsdC51c2VDb2xvcnM9ci51c2VDb2xvcnMoKSx0LmNvbG9yPXIuc2VsZWN0Q29sb3IoZSksdC5leHRlbmQ9YSx0LmRlc3Ryb3k9ci5kZXN0cm95LE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0LFwiZW5hYmxlZFwiLHtlbnVtZXJhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMSxnZXQ6KCk9Pm51bGw9PT1vP3IuZW5hYmxlZChlKTpvLHNldDplPT57bz1lfX0pLFwiZnVuY3Rpb25cIj09dHlwZW9mIHIuaW5pdCYmci5pbml0KHQpLHR9ZnVuY3Rpb24gYShlLHQpe2NvbnN0IG49cih0aGlzLm5hbWVzcGFjZSsoXCJ1bmRlZmluZWRcIj09dHlwZW9mIHQ/XCI6XCI6dCkrZSk7cmV0dXJuIG4ubG9nPXRoaXMubG9nLG59ZnVuY3Rpb24gbyhlKXtyZXR1cm4gZS50b1N0cmluZygpLnN1YnN0cmluZygyLGUudG9TdHJpbmcoKS5sZW5ndGgtMikucmVwbGFjZSgvXFwuXFwqXFw/JC8sXCIqXCIpfXJldHVybiByLmRlYnVnPXIsci5kZWZhdWx0PXIsci5jb2VyY2U9ZnVuY3Rpb24oZSl7cmV0dXJuIGUgaW5zdGFuY2VvZiBFcnJvcj9lLnN0YWNrfHxlLm1lc3NhZ2U6ZX0sci5kaXNhYmxlPWZ1bmN0aW9uKCl7Y29uc3QgZT1bLi4uci5uYW1lcy5tYXAobyksLi4uci5za2lwcy5tYXAobykubWFwKGU9PlwiLVwiK2UpXS5qb2luKFwiLFwiKTtyZXR1cm4gci5lbmFibGUoXCJcIiksZX0sci5lbmFibGU9ZnVuY3Rpb24oZSl7ci5zYXZlKGUpLHIubmFtZXM9W10sci5za2lwcz1bXTtsZXQgdDtjb25zdCBuPShcInN0cmluZ1wiPT10eXBlb2YgZT9lOlwiXCIpLnNwbGl0KC9bXFxzLF0rLyksYT1uLmxlbmd0aDtmb3IodD0wO3Q8YTt0Kyspblt0XSYmKGU9blt0XS5yZXBsYWNlKC9cXCovZyxcIi4qP1wiKSxcIi1cIj09PWVbMF0/ci5za2lwcy5wdXNoKG5ldyBSZWdFeHAoXCJeXCIrZS5zdWJzdHIoMSkrXCIkXCIpKTpyLm5hbWVzLnB1c2gobmV3IFJlZ0V4cChcIl5cIitlK1wiJFwiKSkpfSxyLmVuYWJsZWQ9ZnVuY3Rpb24oZSl7aWYoXCIqXCI9PT1lW2UubGVuZ3RoLTFdKXJldHVybiEwO2xldCB0LG47Zm9yKHQ9MCxuPXIuc2tpcHMubGVuZ3RoO3Q8bjt0KyspaWYoci5za2lwc1t0XS50ZXN0KGUpKXJldHVybiExO2Zvcih0PTAsbj1yLm5hbWVzLmxlbmd0aDt0PG47dCsrKWlmKHIubmFtZXNbdF0udGVzdChlKSlyZXR1cm4hMDtyZXR1cm4hMX0sci5odW1hbml6ZT1lKFwibXNcIiksci5kZXN0cm95PWZ1bmN0aW9uKCl7Y29uc29sZS53YXJuKFwiSW5zdGFuY2UgbWV0aG9kIGBkZWJ1Zy5kZXN0cm95KClgIGlzIGRlcHJlY2F0ZWQgYW5kIG5vIGxvbmdlciBkb2VzIGFueXRoaW5nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbiBvZiBgZGVidWdgLlwiKX0sT2JqZWN0LmtleXModCkuZm9yRWFjaChlPT57cltlXT10W2VdfSksci5uYW1lcz1bXSxyLnNraXBzPVtdLHIuZm9ybWF0dGVycz17fSxyLnNlbGVjdENvbG9yPWZ1bmN0aW9uKGUpe2xldCB0PTA7Zm9yKGxldCBuPTA7bjxlLmxlbmd0aDtuKyspdD0odDw8NSktdCtlLmNoYXJDb2RlQXQobiksdHw9MDtyZXR1cm4gci5jb2xvcnNbbih0KSVyLmNvbG9ycy5sZW5ndGhdfSxyLmVuYWJsZShyLmxvYWQoKSkscn19LHttczoxMX1dLDY6W2Z1bmN0aW9uKGUsdCl7J3VzZSBzdHJpY3QnO2Z1bmN0aW9uIG4oZSx0KXtmb3IoY29uc3QgbiBpbiB0KU9iamVjdC5kZWZpbmVQcm9wZXJ0eShlLG4se3ZhbHVlOnRbbl0sZW51bWVyYWJsZTohMCxjb25maWd1cmFibGU6ITB9KTtyZXR1cm4gZX10LmV4cG9ydHM9ZnVuY3Rpb24oZSx0LHIpe2lmKCFlfHxcInN0cmluZ1wiPT10eXBlb2YgZSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiUGxlYXNlIHBhc3MgYW4gRXJyb3IgdG8gZXJyLWNvZGVcIik7cnx8KHI9e30pLFwib2JqZWN0XCI9PXR5cGVvZiB0JiYocj10LHQ9XCJcIiksdCYmKHIuY29kZT10KTt0cnl7cmV0dXJuIG4oZSxyKX1jYXRjaCh0KXtyLm1lc3NhZ2U9ZS5tZXNzYWdlLHIuc3RhY2s9ZS5zdGFjaztjb25zdCBhPWZ1bmN0aW9uKCl7fTthLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKE9iamVjdC5nZXRQcm90b3R5cGVPZihlKSk7Y29uc3Qgbz1uKG5ldyBhLHIpO3JldHVybiBvfX19LHt9XSw3OltmdW5jdGlvbihlLHQpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBuKGUpe2NvbnNvbGUmJmNvbnNvbGUud2FybiYmY29uc29sZS53YXJuKGUpfWZ1bmN0aW9uIHIoKXtyLmluaXQuY2FsbCh0aGlzKX1mdW5jdGlvbiBhKGUpe2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIGUpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSBcXFwibGlzdGVuZXJcXFwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBGdW5jdGlvbi4gUmVjZWl2ZWQgdHlwZSBcIit0eXBlb2YgZSl9ZnVuY3Rpb24gbyhlKXtyZXR1cm4gdm9pZCAwPT09ZS5fbWF4TGlzdGVuZXJzP3IuZGVmYXVsdE1heExpc3RlbmVyczplLl9tYXhMaXN0ZW5lcnN9ZnVuY3Rpb24gaShlLHQscixpKXt2YXIgZCxzLGw7aWYoYShyKSxzPWUuX2V2ZW50cyx2b2lkIDA9PT1zPyhzPWUuX2V2ZW50cz1PYmplY3QuY3JlYXRlKG51bGwpLGUuX2V2ZW50c0NvdW50PTApOih2b2lkIDAhPT1zLm5ld0xpc3RlbmVyJiYoZS5lbWl0KFwibmV3TGlzdGVuZXJcIix0LHIubGlzdGVuZXI/ci5saXN0ZW5lcjpyKSxzPWUuX2V2ZW50cyksbD1zW3RdKSx2b2lkIDA9PT1sKWw9c1t0XT1yLCsrZS5fZXZlbnRzQ291bnQ7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBsP2w9c1t0XT1pP1tyLGxdOltsLHJdOmk/bC51bnNoaWZ0KHIpOmwucHVzaChyKSxkPW8oZSksMDxkJiZsLmxlbmd0aD5kJiYhbC53YXJuZWQpe2wud2FybmVkPSEwO3ZhciBjPW5ldyBFcnJvcihcIlBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgbGVhayBkZXRlY3RlZC4gXCIrbC5sZW5ndGgrXCIgXCIrKHQrXCIgbGlzdGVuZXJzIGFkZGVkLiBVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdFwiKSk7Yy5uYW1lPVwiTWF4TGlzdGVuZXJzRXhjZWVkZWRXYXJuaW5nXCIsYy5lbWl0dGVyPWUsYy50eXBlPXQsYy5jb3VudD1sLmxlbmd0aCxuKGMpfXJldHVybiBlfWZ1bmN0aW9uIGQoKXtpZighdGhpcy5maXJlZClyZXR1cm4gdGhpcy50YXJnZXQucmVtb3ZlTGlzdGVuZXIodGhpcy50eXBlLHRoaXMud3JhcEZuKSx0aGlzLmZpcmVkPSEwLDA9PT1hcmd1bWVudHMubGVuZ3RoP3RoaXMubGlzdGVuZXIuY2FsbCh0aGlzLnRhcmdldCk6dGhpcy5saXN0ZW5lci5hcHBseSh0aGlzLnRhcmdldCxhcmd1bWVudHMpfWZ1bmN0aW9uIHMoZSx0LG4pe3ZhciByPXtmaXJlZDohMSx3cmFwRm46dm9pZCAwLHRhcmdldDplLHR5cGU6dCxsaXN0ZW5lcjpufSxhPWQuYmluZChyKTtyZXR1cm4gYS5saXN0ZW5lcj1uLHIud3JhcEZuPWEsYX1mdW5jdGlvbiBsKGUsdCxuKXt2YXIgcj1lLl9ldmVudHM7aWYocj09PXZvaWQgMClyZXR1cm5bXTt2YXIgYT1yW3RdO3JldHVybiB2b2lkIDA9PT1hP1tdOlwiZnVuY3Rpb25cIj09dHlwZW9mIGE/bj9bYS5saXN0ZW5lcnx8YV06W2FdOm4/ZihhKTp1KGEsYS5sZW5ndGgpfWZ1bmN0aW9uIGMoZSl7dmFyIHQ9dGhpcy5fZXZlbnRzO2lmKHQhPT12b2lkIDApe3ZhciBuPXRbZV07aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgbilyZXR1cm4gMTtpZih2b2lkIDAhPT1uKXJldHVybiBuLmxlbmd0aH1yZXR1cm4gMH1mdW5jdGlvbiB1KGUsdCl7Zm9yKHZhciBuPUFycmF5KHQpLHI9MDtyPHQ7KytyKW5bcl09ZVtyXTtyZXR1cm4gbn1mdW5jdGlvbiBwKGUsdCl7Zm9yKDt0KzE8ZS5sZW5ndGg7dCsrKWVbdF09ZVt0KzFdO2UucG9wKCl9ZnVuY3Rpb24gZihlKXtmb3IodmFyIHQ9QXJyYXkoZS5sZW5ndGgpLG49MDtuPHQubGVuZ3RoOysrbil0W25dPWVbbl0ubGlzdGVuZXJ8fGVbbl07cmV0dXJuIHR9ZnVuY3Rpb24gZyhlLHQsbil7XCJmdW5jdGlvblwiPT10eXBlb2YgZS5vbiYmXyhlLFwiZXJyb3JcIix0LG4pfWZ1bmN0aW9uIF8oZSx0LG4scil7aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZS5vbilyLm9uY2U/ZS5vbmNlKHQsbik6ZS5vbih0LG4pO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZS5hZGRFdmVudExpc3RlbmVyKWUuYWRkRXZlbnRMaXN0ZW5lcih0LGZ1bmN0aW9uIGEobyl7ci5vbmNlJiZlLnJlbW92ZUV2ZW50TGlzdGVuZXIodCxhKSxuKG8pfSk7ZWxzZSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhlIFxcXCJlbWl0dGVyXFxcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgRXZlbnRFbWl0dGVyLiBSZWNlaXZlZCB0eXBlIFwiK3R5cGVvZiBlKX12YXIgaCxtPVwib2JqZWN0XCI9PXR5cGVvZiBSZWZsZWN0P1JlZmxlY3Q6bnVsbCxiPW0mJlwiZnVuY3Rpb25cIj09dHlwZW9mIG0uYXBwbHk/bS5hcHBseTpmdW5jdGlvbihlLHQsbil7cmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGUsdCxuKX07aD1tJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiBtLm93bktleXM/bS5vd25LZXlzOk9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHM/ZnVuY3Rpb24oZSl7cmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGUpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGUpKX06ZnVuY3Rpb24oZSl7cmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGUpfTt2YXIgeT1OdW1iZXIuaXNOYU58fGZ1bmN0aW9uKGUpe3JldHVybiBlIT09ZX07dC5leHBvcnRzPXIsdC5leHBvcnRzLm9uY2U9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24obixyKXtmdW5jdGlvbiBhKG4pe2UucmVtb3ZlTGlzdGVuZXIodCxvKSxyKG4pfWZ1bmN0aW9uIG8oKXtcImZ1bmN0aW9uXCI9PXR5cGVvZiBlLnJlbW92ZUxpc3RlbmVyJiZlLnJlbW92ZUxpc3RlbmVyKFwiZXJyb3JcIixhKSxuKFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSl9XyhlLHQsbyx7b25jZTohMH0pLFwiZXJyb3JcIiE9PXQmJmcoZSxhLHtvbmNlOiEwfSl9KX0sci5FdmVudEVtaXR0ZXI9cixyLnByb3RvdHlwZS5fZXZlbnRzPXZvaWQgMCxyLnByb3RvdHlwZS5fZXZlbnRzQ291bnQ9MCxyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzPXZvaWQgMDt2YXIgQz0xMDtPYmplY3QuZGVmaW5lUHJvcGVydHkocixcImRlZmF1bHRNYXhMaXN0ZW5lcnNcIix7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gQ30sc2V0OmZ1bmN0aW9uKGUpe2lmKFwibnVtYmVyXCIhPXR5cGVvZiBlfHwwPmV8fHkoZSkpdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJUaGUgdmFsdWUgb2YgXFxcImRlZmF1bHRNYXhMaXN0ZW5lcnNcXFwiIGlzIG91dCBvZiByYW5nZS4gSXQgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIuIFJlY2VpdmVkIFwiK2UrXCIuXCIpO0M9ZX19KSxyLmluaXQ9ZnVuY3Rpb24oKXsodGhpcy5fZXZlbnRzPT09dm9pZCAwfHx0aGlzLl9ldmVudHM9PT1PYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykuX2V2ZW50cykmJih0aGlzLl9ldmVudHM9T2JqZWN0LmNyZWF0ZShudWxsKSx0aGlzLl9ldmVudHNDb3VudD0wKSx0aGlzLl9tYXhMaXN0ZW5lcnM9dGhpcy5fbWF4TGlzdGVuZXJzfHx2b2lkIDB9LHIucHJvdG90eXBlLnNldE1heExpc3RlbmVycz1mdW5jdGlvbihlKXtpZihcIm51bWJlclwiIT10eXBlb2YgZXx8MD5lfHx5KGUpKXRocm93IG5ldyBSYW5nZUVycm9yKFwiVGhlIHZhbHVlIG9mIFxcXCJuXFxcIiBpcyBvdXQgb2YgcmFuZ2UuIEl0IG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyLiBSZWNlaXZlZCBcIitlK1wiLlwiKTtyZXR1cm4gdGhpcy5fbWF4TGlzdGVuZXJzPWUsdGhpc30sci5wcm90b3R5cGUuZ2V0TWF4TGlzdGVuZXJzPWZ1bmN0aW9uKCl7cmV0dXJuIG8odGhpcyl9LHIucHJvdG90eXBlLmVtaXQ9ZnVuY3Rpb24oZSl7Zm9yKHZhciB0PVtdLG49MTtuPGFyZ3VtZW50cy5sZW5ndGg7bisrKXQucHVzaChhcmd1bWVudHNbbl0pO3ZhciByPVwiZXJyb3JcIj09PWUsYT10aGlzLl9ldmVudHM7aWYoYSE9PXZvaWQgMClyPXImJmEuZXJyb3I9PT12b2lkIDA7ZWxzZSBpZighcilyZXR1cm4hMTtpZihyKXt2YXIgbztpZigwPHQubGVuZ3RoJiYobz10WzBdKSxvIGluc3RhbmNlb2YgRXJyb3IpdGhyb3cgbzt2YXIgZD1uZXcgRXJyb3IoXCJVbmhhbmRsZWQgZXJyb3IuXCIrKG8/XCIgKFwiK28ubWVzc2FnZStcIilcIjpcIlwiKSk7dGhyb3cgZC5jb250ZXh0PW8sZH12YXIgcz1hW2VdO2lmKHM9PT12b2lkIDApcmV0dXJuITE7aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgcyliKHMsdGhpcyx0KTtlbHNlIGZvcih2YXIgbD1zLmxlbmd0aCxjPXUocyxsKSxuPTA7bjxsOysrbiliKGNbbl0sdGhpcyx0KTtyZXR1cm4hMH0sci5wcm90b3R5cGUuYWRkTGlzdGVuZXI9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gaSh0aGlzLGUsdCwhMSl9LHIucHJvdG90eXBlLm9uPXIucHJvdG90eXBlLmFkZExpc3RlbmVyLHIucHJvdG90eXBlLnByZXBlbmRMaXN0ZW5lcj1mdW5jdGlvbihlLHQpe3JldHVybiBpKHRoaXMsZSx0LCEwKX0sci5wcm90b3R5cGUub25jZT1mdW5jdGlvbihlLHQpe3JldHVybiBhKHQpLHRoaXMub24oZSxzKHRoaXMsZSx0KSksdGhpc30sci5wcm90b3R5cGUucHJlcGVuZE9uY2VMaXN0ZW5lcj1mdW5jdGlvbihlLHQpe3JldHVybiBhKHQpLHRoaXMucHJlcGVuZExpc3RlbmVyKGUscyh0aGlzLGUsdCkpLHRoaXN9LHIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyPWZ1bmN0aW9uKGUsdCl7dmFyIG4scixvLGQscztpZihhKHQpLHI9dGhpcy5fZXZlbnRzLHZvaWQgMD09PXIpcmV0dXJuIHRoaXM7aWYobj1yW2VdLHZvaWQgMD09PW4pcmV0dXJuIHRoaXM7aWYobj09PXR8fG4ubGlzdGVuZXI9PT10KTA9PS0tdGhpcy5fZXZlbnRzQ291bnQ/dGhpcy5fZXZlbnRzPU9iamVjdC5jcmVhdGUobnVsbCk6KGRlbGV0ZSByW2VdLHIucmVtb3ZlTGlzdGVuZXImJnRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyXCIsZSxuLmxpc3RlbmVyfHx0KSk7ZWxzZSBpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiBuKXtmb3Iobz0tMSxkPW4ubGVuZ3RoLTE7MDw9ZDtkLS0paWYobltkXT09PXR8fG5bZF0ubGlzdGVuZXI9PT10KXtzPW5bZF0ubGlzdGVuZXIsbz1kO2JyZWFrfWlmKDA+bylyZXR1cm4gdGhpczswPT09bz9uLnNoaWZ0KCk6cChuLG8pLDE9PT1uLmxlbmd0aCYmKHJbZV09blswXSksdm9pZCAwIT09ci5yZW1vdmVMaXN0ZW5lciYmdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJcIixlLHN8fHQpfXJldHVybiB0aGlzfSxyLnByb3RvdHlwZS5vZmY9ci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIsci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzPWZ1bmN0aW9uKGUpe3ZhciB0LG4scjtpZihuPXRoaXMuX2V2ZW50cyx2b2lkIDA9PT1uKXJldHVybiB0aGlzO2lmKHZvaWQgMD09PW4ucmVtb3ZlTGlzdGVuZXIpcmV0dXJuIDA9PT1hcmd1bWVudHMubGVuZ3RoPyh0aGlzLl9ldmVudHM9T2JqZWN0LmNyZWF0ZShudWxsKSx0aGlzLl9ldmVudHNDb3VudD0wKTp2b2lkIDAhPT1uW2VdJiYoMD09LS10aGlzLl9ldmVudHNDb3VudD90aGlzLl9ldmVudHM9T2JqZWN0LmNyZWF0ZShudWxsKTpkZWxldGUgbltlXSksdGhpcztpZigwPT09YXJndW1lbnRzLmxlbmd0aCl7dmFyIGEsbz1PYmplY3Qua2V5cyhuKTtmb3Iocj0wO3I8by5sZW5ndGg7KytyKWE9b1tyXSxcInJlbW92ZUxpc3RlbmVyXCIhPT1hJiZ0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhhKTtyZXR1cm4gdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoXCJyZW1vdmVMaXN0ZW5lclwiKSx0aGlzLl9ldmVudHM9T2JqZWN0LmNyZWF0ZShudWxsKSx0aGlzLl9ldmVudHNDb3VudD0wLHRoaXN9aWYodD1uW2VdLFwiZnVuY3Rpb25cIj09dHlwZW9mIHQpdGhpcy5yZW1vdmVMaXN0ZW5lcihlLHQpO2Vsc2UgaWYodm9pZCAwIT09dClmb3Iocj10Lmxlbmd0aC0xOzA8PXI7ci0tKXRoaXMucmVtb3ZlTGlzdGVuZXIoZSx0W3JdKTtyZXR1cm4gdGhpc30sci5wcm90b3R5cGUubGlzdGVuZXJzPWZ1bmN0aW9uKGUpe3JldHVybiBsKHRoaXMsZSwhMCl9LHIucHJvdG90eXBlLnJhd0xpc3RlbmVycz1mdW5jdGlvbihlKXtyZXR1cm4gbCh0aGlzLGUsITEpfSxyLmxpc3RlbmVyQ291bnQ9ZnVuY3Rpb24oZSx0KXtyZXR1cm5cImZ1bmN0aW9uXCI9PXR5cGVvZiBlLmxpc3RlbmVyQ291bnQ/ZS5saXN0ZW5lckNvdW50KHQpOmMuY2FsbChlLHQpfSxyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50PWMsci5wcm90b3R5cGUuZXZlbnROYW1lcz1mdW5jdGlvbigpe3JldHVybiAwPHRoaXMuX2V2ZW50c0NvdW50P2godGhpcy5fZXZlbnRzKTpbXX19LHt9XSw4OltmdW5jdGlvbihlLHQpe3QuZXhwb3J0cz1mdW5jdGlvbigpe2lmKFwidW5kZWZpbmVkXCI9PXR5cGVvZiBnbG9iYWxUaGlzKXJldHVybiBudWxsO3ZhciBlPXtSVENQZWVyQ29ubmVjdGlvbjpnbG9iYWxUaGlzLlJUQ1BlZXJDb25uZWN0aW9ufHxnbG9iYWxUaGlzLm1velJUQ1BlZXJDb25uZWN0aW9ufHxnbG9iYWxUaGlzLndlYmtpdFJUQ1BlZXJDb25uZWN0aW9uLFJUQ1Nlc3Npb25EZXNjcmlwdGlvbjpnbG9iYWxUaGlzLlJUQ1Nlc3Npb25EZXNjcmlwdGlvbnx8Z2xvYmFsVGhpcy5tb3pSVENTZXNzaW9uRGVzY3JpcHRpb258fGdsb2JhbFRoaXMud2Via2l0UlRDU2Vzc2lvbkRlc2NyaXB0aW9uLFJUQ0ljZUNhbmRpZGF0ZTpnbG9iYWxUaGlzLlJUQ0ljZUNhbmRpZGF0ZXx8Z2xvYmFsVGhpcy5tb3pSVENJY2VDYW5kaWRhdGV8fGdsb2JhbFRoaXMud2Via2l0UlRDSWNlQ2FuZGlkYXRlfTtyZXR1cm4gZS5SVENQZWVyQ29ubmVjdGlvbj9lOm51bGx9fSx7fV0sOTpbZnVuY3Rpb24oZSxhLG8pey8qISBpZWVlNzU0LiBCU0QtMy1DbGF1c2UgTGljZW5zZS4gRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnL29wZW5zb3VyY2U+ICovby5yZWFkPWZ1bmN0aW9uKHQsbixhLG8sbCl7dmFyIGMsdSxwPTgqbC1vLTEsZj0oMTw8cCktMSxnPWY+PjEsXz0tNyxoPWE/bC0xOjAsYj1hPy0xOjEsZD10W24raF07Zm9yKGgrPWIsYz1kJigxPDwtXyktMSxkPj49LV8sXys9cDswPF87Yz0yNTYqYyt0W24raF0saCs9YixfLT04KTtmb3IodT1jJigxPDwtXyktMSxjPj49LV8sXys9bzswPF87dT0yNTYqdSt0W24raF0saCs9YixfLT04KTtpZigwPT09YyljPTEtZztlbHNle2lmKGM9PT1mKXJldHVybiB1P05hTjooZD8tMToxKSooMS8wKTt1Kz1yKDIsbyksYy09Z31yZXR1cm4oZD8tMToxKSp1KnIoMixjLW8pfSxvLndyaXRlPWZ1bmN0aW9uKGEsbyxsLHUscCxmKXt2YXIgaCxiLHksZz1NYXRoLkxOMixfPU1hdGgubG9nLEM9OCpmLXAtMSxSPSgxPDxDKS0xLEU9Uj4+MSx3PTIzPT09cD9yKDIsLTI0KS1yKDIsLTc3KTowLFM9dT8wOmYtMSxUPXU/MTotMSxkPTA+b3x8MD09PW8mJjA+MS9vPzE6MDtmb3Iobz1uKG8pLGlzTmFOKG8pfHxvPT09MS8wPyhiPWlzTmFOKG8pPzE6MCxoPVIpOihoPXQoXyhvKS9nKSwxPm8qKHk9cigyLC1oKSkmJihoLS0seSo9Miksbys9MTw9aCtFP3cveTp3KnIoMiwxLUUpLDI8PW8qeSYmKGgrKyx5Lz0yKSxoK0U+PVI/KGI9MCxoPVIpOjE8PWgrRT8oYj0obyp5LTEpKnIoMixwKSxoKz1FKTooYj1vKnIoMixFLTEpKnIoMixwKSxoPTApKTs4PD1wO2FbbCtTXT0yNTUmYixTKz1ULGIvPTI1NixwLT04KTtmb3IoaD1oPDxwfGIsQys9cDswPEM7YVtsK1NdPTI1NSZoLFMrPVQsaC89MjU2LEMtPTgpO2FbbCtTLVRdfD0xMjgqZH19LHt9XSwxMDpbZnVuY3Rpb24oZSx0KXt0LmV4cG9ydHM9XCJmdW5jdGlvblwiPT10eXBlb2YgT2JqZWN0LmNyZWF0ZT9mdW5jdGlvbihlLHQpe3QmJihlLnN1cGVyXz10LGUucHJvdG90eXBlPU9iamVjdC5jcmVhdGUodC5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTplLGVudW1lcmFibGU6ITEsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfX0pKX06ZnVuY3Rpb24oZSx0KXtpZih0KXtlLnN1cGVyXz10O3ZhciBuPWZ1bmN0aW9uKCl7fTtuLnByb3RvdHlwZT10LnByb3RvdHlwZSxlLnByb3RvdHlwZT1uZXcgbixlLnByb3RvdHlwZS5jb25zdHJ1Y3Rvcj1lfX19LHt9XSwxMTpbZnVuY3Rpb24oZSx0KXt2YXIgcj1NYXRoLnJvdW5kO2Z1bmN0aW9uIGEoZSl7aWYoZSs9XCJcIiwhKDEwMDxlLmxlbmd0aCkpe3ZhciB0PS9eKC0/KD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx3ZWVrcz98d3x5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhlKTtpZih0KXt2YXIgcj1wYXJzZUZsb2F0KHRbMV0pLG49KHRbMl18fFwibXNcIikudG9Mb3dlckNhc2UoKTtyZXR1cm5cInllYXJzXCI9PT1ufHxcInllYXJcIj09PW58fFwieXJzXCI9PT1ufHxcInlyXCI9PT1ufHxcInlcIj09PW4/MzE1NTc2MDAwMDAqcjpcIndlZWtzXCI9PT1ufHxcIndlZWtcIj09PW58fFwid1wiPT09bj82MDQ4MDAwMDAqcjpcImRheXNcIj09PW58fFwiZGF5XCI9PT1ufHxcImRcIj09PW4/ODY0MDAwMDAqcjpcImhvdXJzXCI9PT1ufHxcImhvdXJcIj09PW58fFwiaHJzXCI9PT1ufHxcImhyXCI9PT1ufHxcImhcIj09PW4/MzYwMDAwMCpyOlwibWludXRlc1wiPT09bnx8XCJtaW51dGVcIj09PW58fFwibWluc1wiPT09bnx8XCJtaW5cIj09PW58fFwibVwiPT09bj82MDAwMCpyOlwic2Vjb25kc1wiPT09bnx8XCJzZWNvbmRcIj09PW58fFwic2Vjc1wiPT09bnx8XCJzZWNcIj09PW58fFwic1wiPT09bj8xMDAwKnI6XCJtaWxsaXNlY29uZHNcIj09PW58fFwibWlsbGlzZWNvbmRcIj09PW58fFwibXNlY3NcIj09PW58fFwibXNlY1wiPT09bnx8XCJtc1wiPT09bj9yOnZvaWQgMH19fWZ1bmN0aW9uIG8oZSl7dmFyIHQ9bihlKTtyZXR1cm4gODY0MDAwMDA8PXQ/cihlLzg2NDAwMDAwKStcImRcIjozNjAwMDAwPD10P3IoZS8zNjAwMDAwKStcImhcIjo2MDAwMDw9dD9yKGUvNjAwMDApK1wibVwiOjEwMDA8PXQ/cihlLzEwMDApK1wic1wiOmUrXCJtc1wifWZ1bmN0aW9uIGkoZSl7dmFyIHQ9bihlKTtyZXR1cm4gODY0MDAwMDA8PXQ/cyhlLHQsODY0MDAwMDAsXCJkYXlcIik6MzYwMDAwMDw9dD9zKGUsdCwzNjAwMDAwLFwiaG91clwiKTo2MDAwMDw9dD9zKGUsdCw2MDAwMCxcIm1pbnV0ZVwiKToxMDAwPD10P3MoZSx0LDEwMDAsXCJzZWNvbmRcIik6ZStcIiBtc1wifWZ1bmN0aW9uIHMoZSx0LGEsbil7cmV0dXJuIHIoZS9hKStcIiBcIituKyh0Pj0xLjUqYT9cInNcIjpcIlwiKX12YXIgbD0yNCooNjAqNjAwMDApO3QuZXhwb3J0cz1mdW5jdGlvbihlLHQpe3Q9dHx8e307dmFyIG49dHlwZW9mIGU7aWYoXCJzdHJpbmdcIj09biYmMDxlLmxlbmd0aClyZXR1cm4gYShlKTtpZihcIm51bWJlclwiPT09biYmaXNGaW5pdGUoZSkpcmV0dXJuIHQubG9uZz9pKGUpOm8oZSk7dGhyb3cgbmV3IEVycm9yKFwidmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSB2YWxpZCBudW1iZXIuIHZhbD1cIitKU09OLnN0cmluZ2lmeShlKSl9fSx7fV0sMTI6W2Z1bmN0aW9uKGUsdCl7ZnVuY3Rpb24gbigpe3Rocm93IG5ldyBFcnJvcihcInNldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWRcIil9ZnVuY3Rpb24gcigpe3Rocm93IG5ldyBFcnJvcihcImNsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZFwiKX1mdW5jdGlvbiBhKHQpe2lmKGM9PT1zZXRUaW1lb3V0KXJldHVybiBzZXRUaW1lb3V0KHQsMCk7aWYoKGM9PT1ufHwhYykmJnNldFRpbWVvdXQpcmV0dXJuIGM9c2V0VGltZW91dCxzZXRUaW1lb3V0KHQsMCk7dHJ5e3JldHVybiBjKHQsMCl9Y2F0Y2gobil7dHJ5e3JldHVybiBjLmNhbGwobnVsbCx0LDApfWNhdGNoKG4pe3JldHVybiBjLmNhbGwodGhpcyx0LDApfX19ZnVuY3Rpb24gbyh0KXtpZih1PT09Y2xlYXJUaW1lb3V0KXJldHVybiBjbGVhclRpbWVvdXQodCk7aWYoKHU9PT1yfHwhdSkmJmNsZWFyVGltZW91dClyZXR1cm4gdT1jbGVhclRpbWVvdXQsY2xlYXJUaW1lb3V0KHQpO3RyeXtyZXR1cm4gdSh0KX1jYXRjaChuKXt0cnl7cmV0dXJuIHUuY2FsbChudWxsLHQpfWNhdGNoKG4pe3JldHVybiB1LmNhbGwodGhpcyx0KX19fWZ1bmN0aW9uIGkoKXtfJiZmJiYoXz0hMSxmLmxlbmd0aD9nPWYuY29uY2F0KGcpOmg9LTEsZy5sZW5ndGgmJmQoKSl9ZnVuY3Rpb24gZCgpe2lmKCFfKXt2YXIgZT1hKGkpO189ITA7Zm9yKHZhciB0PWcubGVuZ3RoO3Q7KXtmb3IoZj1nLGc9W107KytoPHQ7KWYmJmZbaF0ucnVuKCk7aD0tMSx0PWcubGVuZ3RofWY9bnVsbCxfPSExLG8oZSl9fWZ1bmN0aW9uIHMoZSx0KXt0aGlzLmZ1bj1lLHRoaXMuYXJyYXk9dH1mdW5jdGlvbiBsKCl7fXZhciBjLHUscD10LmV4cG9ydHM9e307KGZ1bmN0aW9uKCl7dHJ5e2M9XCJmdW5jdGlvblwiPT10eXBlb2Ygc2V0VGltZW91dD9zZXRUaW1lb3V0Om59Y2F0Y2godCl7Yz1ufXRyeXt1PVwiZnVuY3Rpb25cIj09dHlwZW9mIGNsZWFyVGltZW91dD9jbGVhclRpbWVvdXQ6cn1jYXRjaCh0KXt1PXJ9fSkoKTt2YXIgZixnPVtdLF89ITEsaD0tMTtwLm5leHRUaWNrPWZ1bmN0aW9uKGUpe3ZhciB0PUFycmF5KGFyZ3VtZW50cy5sZW5ndGgtMSk7aWYoMTxhcmd1bWVudHMubGVuZ3RoKWZvcih2YXIgbj0xO248YXJndW1lbnRzLmxlbmd0aDtuKyspdFtuLTFdPWFyZ3VtZW50c1tuXTtnLnB1c2gobmV3IHMoZSx0KSksMSE9PWcubGVuZ3RofHxffHxhKGQpfSxzLnByb3RvdHlwZS5ydW49ZnVuY3Rpb24oKXt0aGlzLmZ1bi5hcHBseShudWxsLHRoaXMuYXJyYXkpfSxwLnRpdGxlPVwiYnJvd3NlclwiLHAuYnJvd3Nlcj0hMCxwLmVudj17fSxwLmFyZ3Y9W10scC52ZXJzaW9uPVwiXCIscC52ZXJzaW9ucz17fSxwLm9uPWwscC5hZGRMaXN0ZW5lcj1sLHAub25jZT1sLHAub2ZmPWwscC5yZW1vdmVMaXN0ZW5lcj1sLHAucmVtb3ZlQWxsTGlzdGVuZXJzPWwscC5lbWl0PWwscC5wcmVwZW5kTGlzdGVuZXI9bCxwLnByZXBlbmRPbmNlTGlzdGVuZXI9bCxwLmxpc3RlbmVycz1mdW5jdGlvbigpe3JldHVybltdfSxwLmJpbmRpbmc9ZnVuY3Rpb24oKXt0aHJvdyBuZXcgRXJyb3IoXCJwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZFwiKX0scC5jd2Q9ZnVuY3Rpb24oKXtyZXR1cm5cIi9cIn0scC5jaGRpcj1mdW5jdGlvbigpe3Rocm93IG5ldyBFcnJvcihcInByb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZFwiKX0scC51bWFzaz1mdW5jdGlvbigpe3JldHVybiAwfX0se31dLDEzOltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihlKXsoZnVuY3Rpb24oKXsvKiEgcXVldWUtbWljcm90YXNrLiBNSVQgTGljZW5zZS4gRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnL29wZW5zb3VyY2U+ICovbGV0IG47dC5leHBvcnRzPVwiZnVuY3Rpb25cIj09dHlwZW9mIHF1ZXVlTWljcm90YXNrP3F1ZXVlTWljcm90YXNrLmJpbmQoXCJ1bmRlZmluZWRcIj09dHlwZW9mIHdpbmRvdz9lOndpbmRvdyk6ZT0+KG58fChuPVByb21pc2UucmVzb2x2ZSgpKSkudGhlbihlKS5jYXRjaChlPT5zZXRUaW1lb3V0KCgpPT57dGhyb3cgZX0sMCkpfSkuY2FsbCh0aGlzKX0pLmNhbGwodGhpcyxcInVuZGVmaW5lZFwiPT10eXBlb2YgZ2xvYmFsP1widW5kZWZpbmVkXCI9PXR5cGVvZiBzZWxmP1widW5kZWZpbmVkXCI9PXR5cGVvZiB3aW5kb3c/e306d2luZG93OnNlbGY6Z2xvYmFsKX0se31dLDE0OltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihuLHIpeyhmdW5jdGlvbigpeyd1c2Ugc3RyaWN0Jzt2YXIgYT1lKFwic2FmZS1idWZmZXJcIikuQnVmZmVyLG89ci5jcnlwdG98fHIubXNDcnlwdG87dC5leHBvcnRzPW8mJm8uZ2V0UmFuZG9tVmFsdWVzP2Z1bmN0aW9uKGUsdCl7aWYoZT40Mjk0OTY3Mjk1KXRocm93IG5ldyBSYW5nZUVycm9yKFwicmVxdWVzdGVkIHRvbyBtYW55IHJhbmRvbSBieXRlc1wiKTt2YXIgcj1hLmFsbG9jVW5zYWZlKGUpO2lmKDA8ZSlpZig2NTUzNjxlKWZvcih2YXIgaT0wO2k8ZTtpKz02NTUzNilvLmdldFJhbmRvbVZhbHVlcyhyLnNsaWNlKGksaSs2NTUzNikpO2Vsc2Ugby5nZXRSYW5kb21WYWx1ZXMocik7cmV0dXJuXCJmdW5jdGlvblwiPT10eXBlb2YgdD9uLm5leHRUaWNrKGZ1bmN0aW9uKCl7dChudWxsLHIpfSk6cn06ZnVuY3Rpb24oKXt0aHJvdyBuZXcgRXJyb3IoXCJTZWN1cmUgcmFuZG9tIG51bWJlciBnZW5lcmF0aW9uIGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhpcyBicm93c2VyLlxcblVzZSBDaHJvbWUsIEZpcmVmb3ggb3IgSW50ZXJuZXQgRXhwbG9yZXIgMTFcIil9fSkuY2FsbCh0aGlzKX0pLmNhbGwodGhpcyxlKFwiX3Byb2Nlc3NcIiksXCJ1bmRlZmluZWRcIj09dHlwZW9mIGdsb2JhbD9cInVuZGVmaW5lZFwiPT10eXBlb2Ygc2VsZj9cInVuZGVmaW5lZFwiPT10eXBlb2Ygd2luZG93P3t9OndpbmRvdzpzZWxmOmdsb2JhbCl9LHtfcHJvY2VzczoxMixcInNhZmUtYnVmZmVyXCI6MzB9XSwxNTpbZnVuY3Rpb24oZSx0KXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gbihlLHQpe2UucHJvdG90eXBlPU9iamVjdC5jcmVhdGUodC5wcm90b3R5cGUpLGUucHJvdG90eXBlLmNvbnN0cnVjdG9yPWUsZS5fX3Byb3RvX189dH1mdW5jdGlvbiByKGUsdCxyKXtmdW5jdGlvbiBhKGUsbixyKXtyZXR1cm5cInN0cmluZ1wiPT10eXBlb2YgdD90OnQoZSxuLHIpfXJ8fChyPUVycm9yKTt2YXIgbz1mdW5jdGlvbihlKXtmdW5jdGlvbiB0KHQsbixyKXtyZXR1cm4gZS5jYWxsKHRoaXMsYSh0LG4scikpfHx0aGlzfXJldHVybiBuKHQsZSksdH0ocik7by5wcm90b3R5cGUubmFtZT1yLm5hbWUsby5wcm90b3R5cGUuY29kZT1lLHNbZV09b31mdW5jdGlvbiBhKGUsdCl7aWYoQXJyYXkuaXNBcnJheShlKSl7dmFyIG49ZS5sZW5ndGg7cmV0dXJuIGU9ZS5tYXAoZnVuY3Rpb24oZSl7cmV0dXJuIGUrXCJcIn0pLDI8bj9cIm9uZSBvZiBcIi5jb25jYXQodCxcIiBcIikuY29uY2F0KGUuc2xpY2UoMCxuLTEpLmpvaW4oXCIsIFwiKSxcIiwgb3IgXCIpK2Vbbi0xXToyPT09bj9cIm9uZSBvZiBcIi5jb25jYXQodCxcIiBcIikuY29uY2F0KGVbMF0sXCIgb3IgXCIpLmNvbmNhdChlWzFdKTpcIm9mIFwiLmNvbmNhdCh0LFwiIFwiKS5jb25jYXQoZVswXSl9cmV0dXJuXCJvZiBcIi5jb25jYXQodCxcIiBcIikuY29uY2F0KGUrXCJcIil9ZnVuY3Rpb24gbyhlLHQsbil7cmV0dXJuIGUuc3Vic3RyKCFufHwwPm4/MDorbix0Lmxlbmd0aCk9PT10fWZ1bmN0aW9uIGkoZSx0LG4pe3JldHVybih2b2lkIDA9PT1ufHxuPmUubGVuZ3RoKSYmKG49ZS5sZW5ndGgpLGUuc3Vic3RyaW5nKG4tdC5sZW5ndGgsbik9PT10fWZ1bmN0aW9uIGQoZSx0LG4pe3JldHVyblwibnVtYmVyXCIhPXR5cGVvZiBuJiYobj0wKSwhKG4rdC5sZW5ndGg+ZS5sZW5ndGgpJiYtMSE9PWUuaW5kZXhPZih0LG4pfXZhciBzPXt9O3IoXCJFUlJfSU5WQUxJRF9PUFRfVkFMVUVcIixmdW5jdGlvbihlLHQpe3JldHVyblwiVGhlIHZhbHVlIFxcXCJcIit0K1wiXFxcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXFxcIlwiK2UrXCJcXFwiXCJ9LFR5cGVFcnJvcikscihcIkVSUl9JTlZBTElEX0FSR19UWVBFXCIsZnVuY3Rpb24oZSx0LG4pe3ZhciByO1wic3RyaW5nXCI9PXR5cGVvZiB0JiZvKHQsXCJub3QgXCIpPyhyPVwibXVzdCBub3QgYmVcIix0PXQucmVwbGFjZSgvXm5vdCAvLFwiXCIpKTpyPVwibXVzdCBiZVwiO3ZhciBzO2lmKGkoZSxcIiBhcmd1bWVudFwiKSlzPVwiVGhlIFwiLmNvbmNhdChlLFwiIFwiKS5jb25jYXQocixcIiBcIikuY29uY2F0KGEodCxcInR5cGVcIikpO2Vsc2V7dmFyIGw9ZChlLFwiLlwiKT9cInByb3BlcnR5XCI6XCJhcmd1bWVudFwiO3M9XCJUaGUgXFxcIlwiLmNvbmNhdChlLFwiXFxcIiBcIikuY29uY2F0KGwsXCIgXCIpLmNvbmNhdChyLFwiIFwiKS5jb25jYXQoYSh0LFwidHlwZVwiKSl9cmV0dXJuIHMrPVwiLiBSZWNlaXZlZCB0eXBlIFwiLmNvbmNhdCh0eXBlb2Ygbiksc30sVHlwZUVycm9yKSxyKFwiRVJSX1NUUkVBTV9QVVNIX0FGVEVSX0VPRlwiLFwic3RyZWFtLnB1c2goKSBhZnRlciBFT0ZcIikscihcIkVSUl9NRVRIT0RfTk9UX0lNUExFTUVOVEVEXCIsZnVuY3Rpb24oZSl7cmV0dXJuXCJUaGUgXCIrZStcIiBtZXRob2QgaXMgbm90IGltcGxlbWVudGVkXCJ9KSxyKFwiRVJSX1NUUkVBTV9QUkVNQVRVUkVfQ0xPU0VcIixcIlByZW1hdHVyZSBjbG9zZVwiKSxyKFwiRVJSX1NUUkVBTV9ERVNUUk9ZRURcIixmdW5jdGlvbihlKXtyZXR1cm5cIkNhbm5vdCBjYWxsIFwiK2UrXCIgYWZ0ZXIgYSBzdHJlYW0gd2FzIGRlc3Ryb3llZFwifSkscihcIkVSUl9NVUxUSVBMRV9DQUxMQkFDS1wiLFwiQ2FsbGJhY2sgY2FsbGVkIG11bHRpcGxlIHRpbWVzXCIpLHIoXCJFUlJfU1RSRUFNX0NBTk5PVF9QSVBFXCIsXCJDYW5ub3QgcGlwZSwgbm90IHJlYWRhYmxlXCIpLHIoXCJFUlJfU1RSRUFNX1dSSVRFX0FGVEVSX0VORFwiLFwid3JpdGUgYWZ0ZXIgZW5kXCIpLHIoXCJFUlJfU1RSRUFNX05VTExfVkFMVUVTXCIsXCJNYXkgbm90IHdyaXRlIG51bGwgdmFsdWVzIHRvIHN0cmVhbVwiLFR5cGVFcnJvcikscihcIkVSUl9VTktOT1dOX0VOQ09ESU5HXCIsZnVuY3Rpb24oZSl7cmV0dXJuXCJVbmtub3duIGVuY29kaW5nOiBcIitlfSxUeXBlRXJyb3IpLHIoXCJFUlJfU1RSRUFNX1VOU0hJRlRfQUZURVJfRU5EX0VWRU5UXCIsXCJzdHJlYW0udW5zaGlmdCgpIGFmdGVyIGVuZCBldmVudFwiKSx0LmV4cG9ydHMuY29kZXM9c30se31dLDE2OltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihuKXsoZnVuY3Rpb24oKXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gcihlKXtyZXR1cm4gdGhpcyBpbnN0YW5jZW9mIHI/dm9pZChkLmNhbGwodGhpcyxlKSxzLmNhbGwodGhpcyxlKSx0aGlzLmFsbG93SGFsZk9wZW49ITAsZSYmKCExPT09ZS5yZWFkYWJsZSYmKHRoaXMucmVhZGFibGU9ITEpLCExPT09ZS53cml0YWJsZSYmKHRoaXMud3JpdGFibGU9ITEpLCExPT09ZS5hbGxvd0hhbGZPcGVuJiYodGhpcy5hbGxvd0hhbGZPcGVuPSExLHRoaXMub25jZShcImVuZFwiLGEpKSkpOm5ldyByKGUpfWZ1bmN0aW9uIGEoKXt0aGlzLl93cml0YWJsZVN0YXRlLmVuZGVkfHxuLm5leHRUaWNrKG8sdGhpcyl9ZnVuY3Rpb24gbyhlKXtlLmVuZCgpfXZhciBpPU9iamVjdC5rZXlzfHxmdW5jdGlvbihlKXt2YXIgdD1bXTtmb3IodmFyIG4gaW4gZSl0LnB1c2gobik7cmV0dXJuIHR9O3QuZXhwb3J0cz1yO3ZhciBkPWUoXCIuL19zdHJlYW1fcmVhZGFibGVcIikscz1lKFwiLi9fc3RyZWFtX3dyaXRhYmxlXCIpO2UoXCJpbmhlcml0c1wiKShyLGQpO2Zvcih2YXIgbCxjPWkocy5wcm90b3R5cGUpLHU9MDt1PGMubGVuZ3RoO3UrKylsPWNbdV0sci5wcm90b3R5cGVbbF18fChyLnByb3RvdHlwZVtsXT1zLnByb3RvdHlwZVtsXSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KHIucHJvdG90eXBlLFwid3JpdGFibGVIaWdoV2F0ZXJNYXJrXCIse2VudW1lcmFibGU6ITEsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3dyaXRhYmxlU3RhdGUuaGlnaFdhdGVyTWFya319KSxPYmplY3QuZGVmaW5lUHJvcGVydHkoci5wcm90b3R5cGUsXCJ3cml0YWJsZUJ1ZmZlclwiLHtlbnVtZXJhYmxlOiExLGdldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLl93cml0YWJsZVN0YXRlJiZ0aGlzLl93cml0YWJsZVN0YXRlLmdldEJ1ZmZlcigpfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyLnByb3RvdHlwZSxcIndyaXRhYmxlTGVuZ3RoXCIse2VudW1lcmFibGU6ITEsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3dyaXRhYmxlU3RhdGUubGVuZ3RofX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyLnByb3RvdHlwZSxcImRlc3Ryb3llZFwiLHtlbnVtZXJhYmxlOiExLGdldDpmdW5jdGlvbigpe3JldHVybiB2b2lkIDAhPT10aGlzLl9yZWFkYWJsZVN0YXRlJiZ2b2lkIDAhPT10aGlzLl93cml0YWJsZVN0YXRlJiZ0aGlzLl9yZWFkYWJsZVN0YXRlLmRlc3Ryb3llZCYmdGhpcy5fd3JpdGFibGVTdGF0ZS5kZXN0cm95ZWR9LHNldDpmdW5jdGlvbihlKXt2b2lkIDA9PT10aGlzLl9yZWFkYWJsZVN0YXRlfHx2b2lkIDA9PT10aGlzLl93cml0YWJsZVN0YXRlfHwodGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWQ9ZSx0aGlzLl93cml0YWJsZVN0YXRlLmRlc3Ryb3llZD1lKX19KX0pLmNhbGwodGhpcyl9KS5jYWxsKHRoaXMsZShcIl9wcm9jZXNzXCIpKX0se1wiLi9fc3RyZWFtX3JlYWRhYmxlXCI6MTgsXCIuL19zdHJlYW1fd3JpdGFibGVcIjoyMCxfcHJvY2VzczoxMixpbmhlcml0czoxMH1dLDE3OltmdW5jdGlvbihlLHQpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBuKGUpe3JldHVybiB0aGlzIGluc3RhbmNlb2Ygbj92b2lkIHIuY2FsbCh0aGlzLGUpOm5ldyBuKGUpfXQuZXhwb3J0cz1uO3ZhciByPWUoXCIuL19zdHJlYW1fdHJhbnNmb3JtXCIpO2UoXCJpbmhlcml0c1wiKShuLHIpLG4ucHJvdG90eXBlLl90cmFuc2Zvcm09ZnVuY3Rpb24oZSx0LG4pe24obnVsbCxlKX19LHtcIi4vX3N0cmVhbV90cmFuc2Zvcm1cIjoxOSxpbmhlcml0czoxMH1dLDE4OltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihuLHIpeyhmdW5jdGlvbigpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBhKGUpe3JldHVybiBQLmZyb20oZSl9ZnVuY3Rpb24gbyhlKXtyZXR1cm4gUC5pc0J1ZmZlcihlKXx8ZSBpbnN0YW5jZW9mIE19ZnVuY3Rpb24gaShlLHQsbil7cmV0dXJuXCJmdW5jdGlvblwiPT10eXBlb2YgZS5wcmVwZW5kTGlzdGVuZXI/ZS5wcmVwZW5kTGlzdGVuZXIodCxuKTp2b2lkKGUuX2V2ZW50cyYmZS5fZXZlbnRzW3RdP0FycmF5LmlzQXJyYXkoZS5fZXZlbnRzW3RdKT9lLl9ldmVudHNbdF0udW5zaGlmdChuKTplLl9ldmVudHNbdF09W24sZS5fZXZlbnRzW3RdXTplLm9uKHQsbikpfWZ1bmN0aW9uIGQodCxuLHIpe0E9QXx8ZShcIi4vX3N0cmVhbV9kdXBsZXhcIiksdD10fHx7fSxcImJvb2xlYW5cIiE9dHlwZW9mIHImJihyPW4gaW5zdGFuY2VvZiBBKSx0aGlzLm9iamVjdE1vZGU9ISF0Lm9iamVjdE1vZGUsciYmKHRoaXMub2JqZWN0TW9kZT10aGlzLm9iamVjdE1vZGV8fCEhdC5yZWFkYWJsZU9iamVjdE1vZGUpLHRoaXMuaGlnaFdhdGVyTWFyaz1IKHRoaXMsdCxcInJlYWRhYmxlSGlnaFdhdGVyTWFya1wiLHIpLHRoaXMuYnVmZmVyPW5ldyBqLHRoaXMubGVuZ3RoPTAsdGhpcy5waXBlcz1udWxsLHRoaXMucGlwZXNDb3VudD0wLHRoaXMuZmxvd2luZz1udWxsLHRoaXMuZW5kZWQ9ITEsdGhpcy5lbmRFbWl0dGVkPSExLHRoaXMucmVhZGluZz0hMSx0aGlzLnN5bmM9ITAsdGhpcy5uZWVkUmVhZGFibGU9ITEsdGhpcy5lbWl0dGVkUmVhZGFibGU9ITEsdGhpcy5yZWFkYWJsZUxpc3RlbmluZz0hMSx0aGlzLnJlc3VtZVNjaGVkdWxlZD0hMSx0aGlzLnBhdXNlZD0hMCx0aGlzLmVtaXRDbG9zZT0hMSE9PXQuZW1pdENsb3NlLHRoaXMuYXV0b0Rlc3Ryb3k9ISF0LmF1dG9EZXN0cm95LHRoaXMuZGVzdHJveWVkPSExLHRoaXMuZGVmYXVsdEVuY29kaW5nPXQuZGVmYXVsdEVuY29kaW5nfHxcInV0ZjhcIix0aGlzLmF3YWl0RHJhaW49MCx0aGlzLnJlYWRpbmdNb3JlPSExLHRoaXMuZGVjb2Rlcj1udWxsLHRoaXMuZW5jb2Rpbmc9bnVsbCx0LmVuY29kaW5nJiYoIUYmJihGPWUoXCJzdHJpbmdfZGVjb2Rlci9cIikuU3RyaW5nRGVjb2RlciksdGhpcy5kZWNvZGVyPW5ldyBGKHQuZW5jb2RpbmcpLHRoaXMuZW5jb2Rpbmc9dC5lbmNvZGluZyl9ZnVuY3Rpb24gcyh0KXtpZihBPUF8fGUoXCIuL19zdHJlYW1fZHVwbGV4XCIpLCEodGhpcyBpbnN0YW5jZW9mIHMpKXJldHVybiBuZXcgcyh0KTt2YXIgbj10aGlzIGluc3RhbmNlb2YgQTt0aGlzLl9yZWFkYWJsZVN0YXRlPW5ldyBkKHQsdGhpcyxuKSx0aGlzLnJlYWRhYmxlPSEwLHQmJihcImZ1bmN0aW9uXCI9PXR5cGVvZiB0LnJlYWQmJih0aGlzLl9yZWFkPXQucmVhZCksXCJmdW5jdGlvblwiPT10eXBlb2YgdC5kZXN0cm95JiYodGhpcy5fZGVzdHJveT10LmRlc3Ryb3kpKSxJLmNhbGwodGhpcyl9ZnVuY3Rpb24gbChlLHQsbixyLG8pe3goXCJyZWFkYWJsZUFkZENodW5rXCIsdCk7dmFyIGk9ZS5fcmVhZGFibGVTdGF0ZTtpZihudWxsPT09dClpLnJlYWRpbmc9ITEsZyhlLGkpO2Vsc2V7dmFyIGQ7aWYob3x8KGQ9dShpLHQpKSxkKVgoZSxkKTtlbHNlIGlmKCEoaS5vYmplY3RNb2RlfHx0JiYwPHQubGVuZ3RoKSlyfHwoaS5yZWFkaW5nPSExLG0oZSxpKSk7ZWxzZSBpZihcInN0cmluZ1wiPT10eXBlb2YgdHx8aS5vYmplY3RNb2RlfHxPYmplY3QuZ2V0UHJvdG90eXBlT2YodCk9PT1QLnByb3RvdHlwZXx8KHQ9YSh0KSkscilpLmVuZEVtaXR0ZWQ/WChlLG5ldyBLKTpjKGUsaSx0LCEwKTtlbHNlIGlmKGkuZW5kZWQpWChlLG5ldyB6KTtlbHNle2lmKGkuZGVzdHJveWVkKXJldHVybiExO2kucmVhZGluZz0hMSxpLmRlY29kZXImJiFuPyh0PWkuZGVjb2Rlci53cml0ZSh0KSxpLm9iamVjdE1vZGV8fDAhPT10Lmxlbmd0aD9jKGUsaSx0LCExKTptKGUsaSkpOmMoZSxpLHQsITEpfX1yZXR1cm4haS5lbmRlZCYmKGkubGVuZ3RoPGkuaGlnaFdhdGVyTWFya3x8MD09PWkubGVuZ3RoKX1mdW5jdGlvbiBjKGUsdCxuLHIpe3QuZmxvd2luZyYmMD09PXQubGVuZ3RoJiYhdC5zeW5jPyh0LmF3YWl0RHJhaW49MCxlLmVtaXQoXCJkYXRhXCIsbikpOih0Lmxlbmd0aCs9dC5vYmplY3RNb2RlPzE6bi5sZW5ndGgscj90LmJ1ZmZlci51bnNoaWZ0KG4pOnQuYnVmZmVyLnB1c2gobiksdC5uZWVkUmVhZGFibGUmJl8oZSkpLG0oZSx0KX1mdW5jdGlvbiB1KGUsdCl7dmFyIG47cmV0dXJuIG8odCl8fFwic3RyaW5nXCI9PXR5cGVvZiB0fHx2b2lkIDA9PT10fHxlLm9iamVjdE1vZGV8fChuPW5ldyBWKFwiY2h1bmtcIixbXCJzdHJpbmdcIixcIkJ1ZmZlclwiLFwiVWludDhBcnJheVwiXSx0KSksbn1mdW5jdGlvbiBwKGUpe3JldHVybiAxMDczNzQxODI0PD1lP2U9MTA3Mzc0MTgyNDooZS0tLGV8PWU+Pj4xLGV8PWU+Pj4yLGV8PWU+Pj40LGV8PWU+Pj44LGV8PWU+Pj4xNixlKyspLGV9ZnVuY3Rpb24gZihlLHQpe3JldHVybiAwPj1lfHwwPT09dC5sZW5ndGgmJnQuZW5kZWQ/MDp0Lm9iamVjdE1vZGU/MTplPT09ZT8oZT50LmhpZ2hXYXRlck1hcmsmJih0LmhpZ2hXYXRlck1hcms9cChlKSksZTw9dC5sZW5ndGg/ZTp0LmVuZGVkP3QubGVuZ3RoOih0Lm5lZWRSZWFkYWJsZT0hMCwwKSk6dC5mbG93aW5nJiZ0Lmxlbmd0aD90LmJ1ZmZlci5oZWFkLmRhdGEubGVuZ3RoOnQubGVuZ3RofWZ1bmN0aW9uIGcoZSx0KXtpZih4KFwib25Fb2ZDaHVua1wiKSwhdC5lbmRlZCl7aWYodC5kZWNvZGVyKXt2YXIgbj10LmRlY29kZXIuZW5kKCk7biYmbi5sZW5ndGgmJih0LmJ1ZmZlci5wdXNoKG4pLHQubGVuZ3RoKz10Lm9iamVjdE1vZGU/MTpuLmxlbmd0aCl9dC5lbmRlZD0hMCx0LnN5bmM/XyhlKToodC5uZWVkUmVhZGFibGU9ITEsIXQuZW1pdHRlZFJlYWRhYmxlJiYodC5lbWl0dGVkUmVhZGFibGU9ITAsaChlKSkpfX1mdW5jdGlvbiBfKGUpe3ZhciB0PWUuX3JlYWRhYmxlU3RhdGU7eChcImVtaXRSZWFkYWJsZVwiLHQubmVlZFJlYWRhYmxlLHQuZW1pdHRlZFJlYWRhYmxlKSx0Lm5lZWRSZWFkYWJsZT0hMSx0LmVtaXR0ZWRSZWFkYWJsZXx8KHgoXCJlbWl0UmVhZGFibGVcIix0LmZsb3dpbmcpLHQuZW1pdHRlZFJlYWRhYmxlPSEwLG4ubmV4dFRpY2soaCxlKSl9ZnVuY3Rpb24gaChlKXt2YXIgdD1lLl9yZWFkYWJsZVN0YXRlO3goXCJlbWl0UmVhZGFibGVfXCIsdC5kZXN0cm95ZWQsdC5sZW5ndGgsdC5lbmRlZCksIXQuZGVzdHJveWVkJiYodC5sZW5ndGh8fHQuZW5kZWQpJiYoZS5lbWl0KFwicmVhZGFibGVcIiksdC5lbWl0dGVkUmVhZGFibGU9ITEpLHQubmVlZFJlYWRhYmxlPSF0LmZsb3dpbmcmJiF0LmVuZGVkJiZ0Lmxlbmd0aDw9dC5oaWdoV2F0ZXJNYXJrLFMoZSl9ZnVuY3Rpb24gbShlLHQpe3QucmVhZGluZ01vcmV8fCh0LnJlYWRpbmdNb3JlPSEwLG4ubmV4dFRpY2soYixlLHQpKX1mdW5jdGlvbiBiKGUsdCl7Zm9yKDshdC5yZWFkaW5nJiYhdC5lbmRlZCYmKHQubGVuZ3RoPHQuaGlnaFdhdGVyTWFya3x8dC5mbG93aW5nJiYwPT09dC5sZW5ndGgpOyl7dmFyIG49dC5sZW5ndGg7aWYoeChcIm1heWJlUmVhZE1vcmUgcmVhZCAwXCIpLGUucmVhZCgwKSxuPT09dC5sZW5ndGgpYnJlYWt9dC5yZWFkaW5nTW9yZT0hMX1mdW5jdGlvbiB5KGUpe3JldHVybiBmdW5jdGlvbigpe3ZhciB0PWUuX3JlYWRhYmxlU3RhdGU7eChcInBpcGVPbkRyYWluXCIsdC5hd2FpdERyYWluKSx0LmF3YWl0RHJhaW4mJnQuYXdhaXREcmFpbi0tLDA9PT10LmF3YWl0RHJhaW4mJkQoZSxcImRhdGFcIikmJih0LmZsb3dpbmc9ITAsUyhlKSl9fWZ1bmN0aW9uIEMoZSl7dmFyIHQ9ZS5fcmVhZGFibGVTdGF0ZTt0LnJlYWRhYmxlTGlzdGVuaW5nPTA8ZS5saXN0ZW5lckNvdW50KFwicmVhZGFibGVcIiksdC5yZXN1bWVTY2hlZHVsZWQmJiF0LnBhdXNlZD90LmZsb3dpbmc9ITA6MDxlLmxpc3RlbmVyQ291bnQoXCJkYXRhXCIpJiZlLnJlc3VtZSgpfWZ1bmN0aW9uIFIoZSl7eChcInJlYWRhYmxlIG5leHR0aWNrIHJlYWQgMFwiKSxlLnJlYWQoMCl9ZnVuY3Rpb24gRShlLHQpe3QucmVzdW1lU2NoZWR1bGVkfHwodC5yZXN1bWVTY2hlZHVsZWQ9ITAsbi5uZXh0VGljayh3LGUsdCkpfWZ1bmN0aW9uIHcoZSx0KXt4KFwicmVzdW1lXCIsdC5yZWFkaW5nKSx0LnJlYWRpbmd8fGUucmVhZCgwKSx0LnJlc3VtZVNjaGVkdWxlZD0hMSxlLmVtaXQoXCJyZXN1bWVcIiksUyhlKSx0LmZsb3dpbmcmJiF0LnJlYWRpbmcmJmUucmVhZCgwKX1mdW5jdGlvbiBTKGUpe3ZhciB0PWUuX3JlYWRhYmxlU3RhdGU7Zm9yKHgoXCJmbG93XCIsdC5mbG93aW5nKTt0LmZsb3dpbmcmJm51bGwhPT1lLnJlYWQoKTspO31mdW5jdGlvbiBUKGUsdCl7aWYoMD09PXQubGVuZ3RoKXJldHVybiBudWxsO3ZhciBuO3JldHVybiB0Lm9iamVjdE1vZGU/bj10LmJ1ZmZlci5zaGlmdCgpOiFlfHxlPj10Lmxlbmd0aD8obj10LmRlY29kZXI/dC5idWZmZXIuam9pbihcIlwiKToxPT09dC5idWZmZXIubGVuZ3RoP3QuYnVmZmVyLmZpcnN0KCk6dC5idWZmZXIuY29uY2F0KHQubGVuZ3RoKSx0LmJ1ZmZlci5jbGVhcigpKTpuPXQuYnVmZmVyLmNvbnN1bWUoZSx0LmRlY29kZXIpLG59ZnVuY3Rpb24gdihlKXt2YXIgdD1lLl9yZWFkYWJsZVN0YXRlO3goXCJlbmRSZWFkYWJsZVwiLHQuZW5kRW1pdHRlZCksdC5lbmRFbWl0dGVkfHwodC5lbmRlZD0hMCxuLm5leHRUaWNrKGssdCxlKSl9ZnVuY3Rpb24gayhlLHQpe2lmKHgoXCJlbmRSZWFkYWJsZU5UXCIsZS5lbmRFbWl0dGVkLGUubGVuZ3RoKSwhZS5lbmRFbWl0dGVkJiYwPT09ZS5sZW5ndGgmJihlLmVuZEVtaXR0ZWQ9ITAsdC5yZWFkYWJsZT0hMSx0LmVtaXQoXCJlbmRcIiksZS5hdXRvRGVzdHJveSkpe3ZhciBuPXQuX3dyaXRhYmxlU3RhdGU7KCFufHxuLmF1dG9EZXN0cm95JiZuLmZpbmlzaGVkKSYmdC5kZXN0cm95KCl9fWZ1bmN0aW9uIEwoZSx0KXtmb3IodmFyIG49MCxyPWUubGVuZ3RoO248cjtuKyspaWYoZVtuXT09PXQpcmV0dXJuIG47cmV0dXJuLTF9dC5leHBvcnRzPXM7dmFyIEE7cy5SZWFkYWJsZVN0YXRlPWQ7dmFyIHgsTj1lKFwiZXZlbnRzXCIpLkV2ZW50RW1pdHRlcixEPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGUubGlzdGVuZXJzKHQpLmxlbmd0aH0sST1lKFwiLi9pbnRlcm5hbC9zdHJlYW1zL3N0cmVhbVwiKSxQPWUoXCJidWZmZXJcIikuQnVmZmVyLE09ci5VaW50OEFycmF5fHxmdW5jdGlvbigpe30sTz1lKFwidXRpbFwiKTt4PU8mJk8uZGVidWdsb2c/Ty5kZWJ1Z2xvZyhcInN0cmVhbVwiKTpmdW5jdGlvbigpe307dmFyIEYsQixVLGo9ZShcIi4vaW50ZXJuYWwvc3RyZWFtcy9idWZmZXJfbGlzdFwiKSxxPWUoXCIuL2ludGVybmFsL3N0cmVhbXMvZGVzdHJveVwiKSxXPWUoXCIuL2ludGVybmFsL3N0cmVhbXMvc3RhdGVcIiksSD1XLmdldEhpZ2hXYXRlck1hcmssWT1lKFwiLi4vZXJyb3JzXCIpLmNvZGVzLFY9WS5FUlJfSU5WQUxJRF9BUkdfVFlQRSx6PVkuRVJSX1NUUkVBTV9QVVNIX0FGVEVSX0VPRixHPVkuRVJSX01FVEhPRF9OT1RfSU1QTEVNRU5URUQsSz1ZLkVSUl9TVFJFQU1fVU5TSElGVF9BRlRFUl9FTkRfRVZFTlQ7ZShcImluaGVyaXRzXCIpKHMsSSk7dmFyIFg9cS5lcnJvck9yRGVzdHJveSwkPVtcImVycm9yXCIsXCJjbG9zZVwiLFwiZGVzdHJveVwiLFwicGF1c2VcIixcInJlc3VtZVwiXTtPYmplY3QuZGVmaW5lUHJvcGVydHkocy5wcm90b3R5cGUsXCJkZXN0cm95ZWRcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdm9pZCAwIT09dGhpcy5fcmVhZGFibGVTdGF0ZSYmdGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWR9LHNldDpmdW5jdGlvbihlKXt0aGlzLl9yZWFkYWJsZVN0YXRlJiYodGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWQ9ZSl9fSkscy5wcm90b3R5cGUuZGVzdHJveT1xLmRlc3Ryb3kscy5wcm90b3R5cGUuX3VuZGVzdHJveT1xLnVuZGVzdHJveSxzLnByb3RvdHlwZS5fZGVzdHJveT1mdW5jdGlvbihlLHQpe3QoZSl9LHMucHJvdG90eXBlLnB1c2g9ZnVuY3Rpb24oZSx0KXt2YXIgbixyPXRoaXMuX3JlYWRhYmxlU3RhdGU7cmV0dXJuIHIub2JqZWN0TW9kZT9uPSEwOlwic3RyaW5nXCI9PXR5cGVvZiBlJiYodD10fHxyLmRlZmF1bHRFbmNvZGluZyx0IT09ci5lbmNvZGluZyYmKGU9UC5mcm9tKGUsdCksdD1cIlwiKSxuPSEwKSxsKHRoaXMsZSx0LCExLG4pfSxzLnByb3RvdHlwZS51bnNoaWZ0PWZ1bmN0aW9uKGUpe3JldHVybiBsKHRoaXMsZSxudWxsLCEwLCExKX0scy5wcm90b3R5cGUuaXNQYXVzZWQ9ZnVuY3Rpb24oKXtyZXR1cm4hMT09PXRoaXMuX3JlYWRhYmxlU3RhdGUuZmxvd2luZ30scy5wcm90b3R5cGUuc2V0RW5jb2Rpbmc9ZnVuY3Rpb24odCl7Rnx8KEY9ZShcInN0cmluZ19kZWNvZGVyL1wiKS5TdHJpbmdEZWNvZGVyKTt2YXIgbj1uZXcgRih0KTt0aGlzLl9yZWFkYWJsZVN0YXRlLmRlY29kZXI9bix0aGlzLl9yZWFkYWJsZVN0YXRlLmVuY29kaW5nPXRoaXMuX3JlYWRhYmxlU3RhdGUuZGVjb2Rlci5lbmNvZGluZztmb3IodmFyIHI9dGhpcy5fcmVhZGFibGVTdGF0ZS5idWZmZXIuaGVhZCxhPVwiXCI7bnVsbCE9PXI7KWErPW4ud3JpdGUoci5kYXRhKSxyPXIubmV4dDtyZXR1cm4gdGhpcy5fcmVhZGFibGVTdGF0ZS5idWZmZXIuY2xlYXIoKSxcIlwiIT09YSYmdGhpcy5fcmVhZGFibGVTdGF0ZS5idWZmZXIucHVzaChhKSx0aGlzLl9yZWFkYWJsZVN0YXRlLmxlbmd0aD1hLmxlbmd0aCx0aGlzfTtzLnByb3RvdHlwZS5yZWFkPWZ1bmN0aW9uKGUpe3goXCJyZWFkXCIsZSksZT1wYXJzZUludChlLDEwKTt2YXIgdD10aGlzLl9yZWFkYWJsZVN0YXRlLHI9ZTtpZigwIT09ZSYmKHQuZW1pdHRlZFJlYWRhYmxlPSExKSwwPT09ZSYmdC5uZWVkUmVhZGFibGUmJigoMD09PXQuaGlnaFdhdGVyTWFyaz8wPHQubGVuZ3RoOnQubGVuZ3RoPj10LmhpZ2hXYXRlck1hcmspfHx0LmVuZGVkKSlyZXR1cm4geChcInJlYWQ6IGVtaXRSZWFkYWJsZVwiLHQubGVuZ3RoLHQuZW5kZWQpLDA9PT10Lmxlbmd0aCYmdC5lbmRlZD92KHRoaXMpOl8odGhpcyksbnVsbDtpZihlPWYoZSx0KSwwPT09ZSYmdC5lbmRlZClyZXR1cm4gMD09PXQubGVuZ3RoJiZ2KHRoaXMpLG51bGw7dmFyIGE9dC5uZWVkUmVhZGFibGU7eChcIm5lZWQgcmVhZGFibGVcIixhKSwoMD09PXQubGVuZ3RofHx0Lmxlbmd0aC1lPHQuaGlnaFdhdGVyTWFyaykmJihhPSEwLHgoXCJsZW5ndGggbGVzcyB0aGFuIHdhdGVybWFya1wiLGEpKSx0LmVuZGVkfHx0LnJlYWRpbmc/KGE9ITEseChcInJlYWRpbmcgb3IgZW5kZWRcIixhKSk6YSYmKHgoXCJkbyByZWFkXCIpLHQucmVhZGluZz0hMCx0LnN5bmM9ITAsMD09PXQubGVuZ3RoJiYodC5uZWVkUmVhZGFibGU9ITApLHRoaXMuX3JlYWQodC5oaWdoV2F0ZXJNYXJrKSx0LnN5bmM9ITEsIXQucmVhZGluZyYmKGU9ZihyLHQpKSk7dmFyIG87cmV0dXJuIG89MDxlP1QoZSx0KTpudWxsLG51bGw9PT1vPyh0Lm5lZWRSZWFkYWJsZT10Lmxlbmd0aDw9dC5oaWdoV2F0ZXJNYXJrLGU9MCk6KHQubGVuZ3RoLT1lLHQuYXdhaXREcmFpbj0wKSwwPT09dC5sZW5ndGgmJighdC5lbmRlZCYmKHQubmVlZFJlYWRhYmxlPSEwKSxyIT09ZSYmdC5lbmRlZCYmdih0aGlzKSksbnVsbCE9PW8mJnRoaXMuZW1pdChcImRhdGFcIixvKSxvfSxzLnByb3RvdHlwZS5fcmVhZD1mdW5jdGlvbigpe1godGhpcyxuZXcgRyhcIl9yZWFkKClcIikpfSxzLnByb3RvdHlwZS5waXBlPWZ1bmN0aW9uKGUsdCl7ZnVuY3Rpb24gcihlLHQpe3goXCJvbnVucGlwZVwiKSxlPT09cCYmdCYmITE9PT10Lmhhc1VucGlwZWQmJih0Lmhhc1VucGlwZWQ9ITAsbygpKX1mdW5jdGlvbiBhKCl7eChcIm9uZW5kXCIpLGUuZW5kKCl9ZnVuY3Rpb24gbygpe3goXCJjbGVhbnVwXCIpLGUucmVtb3ZlTGlzdGVuZXIoXCJjbG9zZVwiLGwpLGUucmVtb3ZlTGlzdGVuZXIoXCJmaW5pc2hcIixjKSxlLnJlbW92ZUxpc3RlbmVyKFwiZHJhaW5cIixoKSxlLnJlbW92ZUxpc3RlbmVyKFwiZXJyb3JcIixzKSxlLnJlbW92ZUxpc3RlbmVyKFwidW5waXBlXCIscikscC5yZW1vdmVMaXN0ZW5lcihcImVuZFwiLGEpLHAucmVtb3ZlTGlzdGVuZXIoXCJlbmRcIix1KSxwLnJlbW92ZUxpc3RlbmVyKFwiZGF0YVwiLGQpLG09ITAsZi5hd2FpdERyYWluJiYoIWUuX3dyaXRhYmxlU3RhdGV8fGUuX3dyaXRhYmxlU3RhdGUubmVlZERyYWluKSYmaCgpfWZ1bmN0aW9uIGQodCl7eChcIm9uZGF0YVwiKTt2YXIgbj1lLndyaXRlKHQpO3goXCJkZXN0LndyaXRlXCIsbiksITE9PT1uJiYoKDE9PT1mLnBpcGVzQ291bnQmJmYucGlwZXM9PT1lfHwxPGYucGlwZXNDb3VudCYmLTEhPT1MKGYucGlwZXMsZSkpJiYhbSYmKHgoXCJmYWxzZSB3cml0ZSByZXNwb25zZSwgcGF1c2VcIixmLmF3YWl0RHJhaW4pLGYuYXdhaXREcmFpbisrKSxwLnBhdXNlKCkpfWZ1bmN0aW9uIHModCl7eChcIm9uZXJyb3JcIix0KSx1KCksZS5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIscyksMD09PUQoZSxcImVycm9yXCIpJiZYKGUsdCl9ZnVuY3Rpb24gbCgpe2UucmVtb3ZlTGlzdGVuZXIoXCJmaW5pc2hcIixjKSx1KCl9ZnVuY3Rpb24gYygpe3goXCJvbmZpbmlzaFwiKSxlLnJlbW92ZUxpc3RlbmVyKFwiY2xvc2VcIixsKSx1KCl9ZnVuY3Rpb24gdSgpe3goXCJ1bnBpcGVcIikscC51bnBpcGUoZSl9dmFyIHA9dGhpcyxmPXRoaXMuX3JlYWRhYmxlU3RhdGU7c3dpdGNoKGYucGlwZXNDb3VudCl7Y2FzZSAwOmYucGlwZXM9ZTticmVhaztjYXNlIDE6Zi5waXBlcz1bZi5waXBlcyxlXTticmVhaztkZWZhdWx0OmYucGlwZXMucHVzaChlKTt9Zi5waXBlc0NvdW50Kz0xLHgoXCJwaXBlIGNvdW50PSVkIG9wdHM9JWpcIixmLnBpcGVzQ291bnQsdCk7dmFyIGc9KCF0fHwhMSE9PXQuZW5kKSYmZSE9PW4uc3Rkb3V0JiZlIT09bi5zdGRlcnIsXz1nP2E6dTtmLmVuZEVtaXR0ZWQ/bi5uZXh0VGljayhfKTpwLm9uY2UoXCJlbmRcIixfKSxlLm9uKFwidW5waXBlXCIscik7dmFyIGg9eShwKTtlLm9uKFwiZHJhaW5cIixoKTt2YXIgbT0hMTtyZXR1cm4gcC5vbihcImRhdGFcIixkKSxpKGUsXCJlcnJvclwiLHMpLGUub25jZShcImNsb3NlXCIsbCksZS5vbmNlKFwiZmluaXNoXCIsYyksZS5lbWl0KFwicGlwZVwiLHApLGYuZmxvd2luZ3x8KHgoXCJwaXBlIHJlc3VtZVwiKSxwLnJlc3VtZSgpKSxlfSxzLnByb3RvdHlwZS51bnBpcGU9ZnVuY3Rpb24oZSl7dmFyIHQ9dGhpcy5fcmVhZGFibGVTdGF0ZSxuPXtoYXNVbnBpcGVkOiExfTtpZigwPT09dC5waXBlc0NvdW50KXJldHVybiB0aGlzO2lmKDE9PT10LnBpcGVzQ291bnQpcmV0dXJuIGUmJmUhPT10LnBpcGVzP3RoaXM6KGV8fChlPXQucGlwZXMpLHQucGlwZXM9bnVsbCx0LnBpcGVzQ291bnQ9MCx0LmZsb3dpbmc9ITEsZSYmZS5lbWl0KFwidW5waXBlXCIsdGhpcyxuKSx0aGlzKTtpZighZSl7dmFyIHI9dC5waXBlcyxhPXQucGlwZXNDb3VudDt0LnBpcGVzPW51bGwsdC5waXBlc0NvdW50PTAsdC5mbG93aW5nPSExO2Zvcih2YXIgbz0wO288YTtvKyspcltvXS5lbWl0KFwidW5waXBlXCIsdGhpcyx7aGFzVW5waXBlZDohMX0pO3JldHVybiB0aGlzfXZhciBkPUwodC5waXBlcyxlKTtyZXR1cm4tMT09PWQ/dGhpczoodC5waXBlcy5zcGxpY2UoZCwxKSx0LnBpcGVzQ291bnQtPTEsMT09PXQucGlwZXNDb3VudCYmKHQucGlwZXM9dC5waXBlc1swXSksZS5lbWl0KFwidW5waXBlXCIsdGhpcyxuKSx0aGlzKX0scy5wcm90b3R5cGUub249ZnVuY3Rpb24oZSx0KXt2YXIgcj1JLnByb3RvdHlwZS5vbi5jYWxsKHRoaXMsZSx0KSxhPXRoaXMuX3JlYWRhYmxlU3RhdGU7cmV0dXJuXCJkYXRhXCI9PT1lPyhhLnJlYWRhYmxlTGlzdGVuaW5nPTA8dGhpcy5saXN0ZW5lckNvdW50KFwicmVhZGFibGVcIiksITEhPT1hLmZsb3dpbmcmJnRoaXMucmVzdW1lKCkpOlwicmVhZGFibGVcIj09ZSYmIWEuZW5kRW1pdHRlZCYmIWEucmVhZGFibGVMaXN0ZW5pbmcmJihhLnJlYWRhYmxlTGlzdGVuaW5nPWEubmVlZFJlYWRhYmxlPSEwLGEuZmxvd2luZz0hMSxhLmVtaXR0ZWRSZWFkYWJsZT0hMSx4KFwib24gcmVhZGFibGVcIixhLmxlbmd0aCxhLnJlYWRpbmcpLGEubGVuZ3RoP18odGhpcyk6IWEucmVhZGluZyYmbi5uZXh0VGljayhSLHRoaXMpKSxyfSxzLnByb3RvdHlwZS5hZGRMaXN0ZW5lcj1zLnByb3RvdHlwZS5vbixzLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcj1mdW5jdGlvbihlLHQpe3ZhciByPUkucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyLmNhbGwodGhpcyxlLHQpO3JldHVyblwicmVhZGFibGVcIj09PWUmJm4ubmV4dFRpY2soQyx0aGlzKSxyfSxzLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnM9ZnVuY3Rpb24oZSl7dmFyIHQ9SS5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzLmFwcGx5KHRoaXMsYXJndW1lbnRzKTtyZXR1cm4oXCJyZWFkYWJsZVwiPT09ZXx8dm9pZCAwPT09ZSkmJm4ubmV4dFRpY2soQyx0aGlzKSx0fSxzLnByb3RvdHlwZS5yZXN1bWU9ZnVuY3Rpb24oKXt2YXIgZT10aGlzLl9yZWFkYWJsZVN0YXRlO3JldHVybiBlLmZsb3dpbmd8fCh4KFwicmVzdW1lXCIpLGUuZmxvd2luZz0hZS5yZWFkYWJsZUxpc3RlbmluZyxFKHRoaXMsZSkpLGUucGF1c2VkPSExLHRoaXN9LHMucHJvdG90eXBlLnBhdXNlPWZ1bmN0aW9uKCl7cmV0dXJuIHgoXCJjYWxsIHBhdXNlIGZsb3dpbmc9JWpcIix0aGlzLl9yZWFkYWJsZVN0YXRlLmZsb3dpbmcpLCExIT09dGhpcy5fcmVhZGFibGVTdGF0ZS5mbG93aW5nJiYoeChcInBhdXNlXCIpLHRoaXMuX3JlYWRhYmxlU3RhdGUuZmxvd2luZz0hMSx0aGlzLmVtaXQoXCJwYXVzZVwiKSksdGhpcy5fcmVhZGFibGVTdGF0ZS5wYXVzZWQ9ITAsdGhpc30scy5wcm90b3R5cGUud3JhcD1mdW5jdGlvbihlKXt2YXIgdD10aGlzLHI9dGhpcy5fcmVhZGFibGVTdGF0ZSxhPSExO2Zvcih2YXIgbyBpbiBlLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtpZih4KFwid3JhcHBlZCBlbmRcIiksci5kZWNvZGVyJiYhci5lbmRlZCl7dmFyIGU9ci5kZWNvZGVyLmVuZCgpO2UmJmUubGVuZ3RoJiZ0LnB1c2goZSl9dC5wdXNoKG51bGwpfSksZS5vbihcImRhdGFcIixmdW5jdGlvbihuKXtpZigoeChcIndyYXBwZWQgZGF0YVwiKSxyLmRlY29kZXImJihuPXIuZGVjb2Rlci53cml0ZShuKSksIShyLm9iamVjdE1vZGUmJihudWxsPT09bnx8dm9pZCAwPT09bikpKSYmKHIub2JqZWN0TW9kZXx8biYmbi5sZW5ndGgpKXt2YXIgbz10LnB1c2gobik7b3x8KGE9ITAsZS5wYXVzZSgpKX19KSxlKXZvaWQgMD09PXRoaXNbb10mJlwiZnVuY3Rpb25cIj09dHlwZW9mIGVbb10mJih0aGlzW29dPWZ1bmN0aW9uKHQpe3JldHVybiBmdW5jdGlvbigpe3JldHVybiBlW3RdLmFwcGx5KGUsYXJndW1lbnRzKX19KG8pKTtmb3IodmFyIGk9MDtpPCQubGVuZ3RoO2krKyllLm9uKCRbaV0sdGhpcy5lbWl0LmJpbmQodGhpcywkW2ldKSk7cmV0dXJuIHRoaXMuX3JlYWQ9ZnVuY3Rpb24odCl7eChcIndyYXBwZWQgX3JlYWRcIix0KSxhJiYoYT0hMSxlLnJlc3VtZSgpKX0sdGhpc30sXCJmdW5jdGlvblwiPT10eXBlb2YgU3ltYm9sJiYocy5wcm90b3R5cGVbU3ltYm9sLmFzeW5jSXRlcmF0b3JdPWZ1bmN0aW9uKCl7cmV0dXJuIHZvaWQgMD09PUImJihCPWUoXCIuL2ludGVybmFsL3N0cmVhbXMvYXN5bmNfaXRlcmF0b3JcIikpLEIodGhpcyl9KSxPYmplY3QuZGVmaW5lUHJvcGVydHkocy5wcm90b3R5cGUsXCJyZWFkYWJsZUhpZ2hXYXRlck1hcmtcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fcmVhZGFibGVTdGF0ZS5oaWdoV2F0ZXJNYXJrfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzLnByb3RvdHlwZSxcInJlYWRhYmxlQnVmZmVyXCIse2VudW1lcmFibGU6ITEsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3JlYWRhYmxlU3RhdGUmJnRoaXMuX3JlYWRhYmxlU3RhdGUuYnVmZmVyfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzLnByb3RvdHlwZSxcInJlYWRhYmxlRmxvd2luZ1wiLHtlbnVtZXJhYmxlOiExLGdldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9yZWFkYWJsZVN0YXRlLmZsb3dpbmd9LHNldDpmdW5jdGlvbihlKXt0aGlzLl9yZWFkYWJsZVN0YXRlJiYodGhpcy5fcmVhZGFibGVTdGF0ZS5mbG93aW5nPWUpfX0pLHMuX2Zyb21MaXN0PVQsT2JqZWN0LmRlZmluZVByb3BlcnR5KHMucHJvdG90eXBlLFwicmVhZGFibGVMZW5ndGhcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fcmVhZGFibGVTdGF0ZS5sZW5ndGh9fSksXCJmdW5jdGlvblwiPT10eXBlb2YgU3ltYm9sJiYocy5mcm9tPWZ1bmN0aW9uKHQsbil7cmV0dXJuIHZvaWQgMD09PVUmJihVPWUoXCIuL2ludGVybmFsL3N0cmVhbXMvZnJvbVwiKSksVShzLHQsbil9KX0pLmNhbGwodGhpcyl9KS5jYWxsKHRoaXMsZShcIl9wcm9jZXNzXCIpLFwidW5kZWZpbmVkXCI9PXR5cGVvZiBnbG9iYWw/XCJ1bmRlZmluZWRcIj09dHlwZW9mIHNlbGY/XCJ1bmRlZmluZWRcIj09dHlwZW9mIHdpbmRvdz97fTp3aW5kb3c6c2VsZjpnbG9iYWwpfSx7XCIuLi9lcnJvcnNcIjoxNSxcIi4vX3N0cmVhbV9kdXBsZXhcIjoxNixcIi4vaW50ZXJuYWwvc3RyZWFtcy9hc3luY19pdGVyYXRvclwiOjIxLFwiLi9pbnRlcm5hbC9zdHJlYW1zL2J1ZmZlcl9saXN0XCI6MjIsXCIuL2ludGVybmFsL3N0cmVhbXMvZGVzdHJveVwiOjIzLFwiLi9pbnRlcm5hbC9zdHJlYW1zL2Zyb21cIjoyNSxcIi4vaW50ZXJuYWwvc3RyZWFtcy9zdGF0ZVwiOjI3LFwiLi9pbnRlcm5hbC9zdHJlYW1zL3N0cmVhbVwiOjI4LF9wcm9jZXNzOjEyLGJ1ZmZlcjozLGV2ZW50czo3LGluaGVyaXRzOjEwLFwic3RyaW5nX2RlY29kZXIvXCI6MzEsdXRpbDoyfV0sMTk6W2Z1bmN0aW9uKGUsdCl7J3VzZSBzdHJpY3QnO2Z1bmN0aW9uIG4oZSx0KXt2YXIgbj10aGlzLl90cmFuc2Zvcm1TdGF0ZTtuLnRyYW5zZm9ybWluZz0hMTt2YXIgcj1uLndyaXRlY2I7aWYobnVsbD09PXIpcmV0dXJuIHRoaXMuZW1pdChcImVycm9yXCIsbmV3IHMpO24ud3JpdGVjaHVuaz1udWxsLG4ud3JpdGVjYj1udWxsLG51bGwhPXQmJnRoaXMucHVzaCh0KSxyKGUpO3ZhciBhPXRoaXMuX3JlYWRhYmxlU3RhdGU7YS5yZWFkaW5nPSExLChhLm5lZWRSZWFkYWJsZXx8YS5sZW5ndGg8YS5oaWdoV2F0ZXJNYXJrKSYmdGhpcy5fcmVhZChhLmhpZ2hXYXRlck1hcmspfWZ1bmN0aW9uIHIoZSl7cmV0dXJuIHRoaXMgaW5zdGFuY2VvZiByP3ZvaWQodS5jYWxsKHRoaXMsZSksdGhpcy5fdHJhbnNmb3JtU3RhdGU9e2FmdGVyVHJhbnNmb3JtOm4uYmluZCh0aGlzKSxuZWVkVHJhbnNmb3JtOiExLHRyYW5zZm9ybWluZzohMSx3cml0ZWNiOm51bGwsd3JpdGVjaHVuazpudWxsLHdyaXRlZW5jb2Rpbmc6bnVsbH0sdGhpcy5fcmVhZGFibGVTdGF0ZS5uZWVkUmVhZGFibGU9ITAsdGhpcy5fcmVhZGFibGVTdGF0ZS5zeW5jPSExLGUmJihcImZ1bmN0aW9uXCI9PXR5cGVvZiBlLnRyYW5zZm9ybSYmKHRoaXMuX3RyYW5zZm9ybT1lLnRyYW5zZm9ybSksXCJmdW5jdGlvblwiPT10eXBlb2YgZS5mbHVzaCYmKHRoaXMuX2ZsdXNoPWUuZmx1c2gpKSx0aGlzLm9uKFwicHJlZmluaXNoXCIsYSkpOm5ldyByKGUpfWZ1bmN0aW9uIGEoKXt2YXIgZT10aGlzO1wiZnVuY3Rpb25cIiE9dHlwZW9mIHRoaXMuX2ZsdXNofHx0aGlzLl9yZWFkYWJsZVN0YXRlLmRlc3Ryb3llZD9vKHRoaXMsbnVsbCxudWxsKTp0aGlzLl9mbHVzaChmdW5jdGlvbih0LG4pe28oZSx0LG4pfSl9ZnVuY3Rpb24gbyhlLHQsbil7aWYodClyZXR1cm4gZS5lbWl0KFwiZXJyb3JcIix0KTtpZihudWxsIT1uJiZlLnB1c2gobiksZS5fd3JpdGFibGVTdGF0ZS5sZW5ndGgpdGhyb3cgbmV3IGM7aWYoZS5fdHJhbnNmb3JtU3RhdGUudHJhbnNmb3JtaW5nKXRocm93IG5ldyBsO3JldHVybiBlLnB1c2gobnVsbCl9dC5leHBvcnRzPXI7dmFyIGk9ZShcIi4uL2Vycm9yc1wiKS5jb2RlcyxkPWkuRVJSX01FVEhPRF9OT1RfSU1QTEVNRU5URUQscz1pLkVSUl9NVUxUSVBMRV9DQUxMQkFDSyxsPWkuRVJSX1RSQU5TRk9STV9BTFJFQURZX1RSQU5TRk9STUlORyxjPWkuRVJSX1RSQU5TRk9STV9XSVRIX0xFTkdUSF8wLHU9ZShcIi4vX3N0cmVhbV9kdXBsZXhcIik7ZShcImluaGVyaXRzXCIpKHIsdSksci5wcm90b3R5cGUucHVzaD1mdW5jdGlvbihlLHQpe3JldHVybiB0aGlzLl90cmFuc2Zvcm1TdGF0ZS5uZWVkVHJhbnNmb3JtPSExLHUucHJvdG90eXBlLnB1c2guY2FsbCh0aGlzLGUsdCl9LHIucHJvdG90eXBlLl90cmFuc2Zvcm09ZnVuY3Rpb24oZSx0LG4pe24obmV3IGQoXCJfdHJhbnNmb3JtKClcIikpfSxyLnByb3RvdHlwZS5fd3JpdGU9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRoaXMuX3RyYW5zZm9ybVN0YXRlO2lmKHIud3JpdGVjYj1uLHIud3JpdGVjaHVuaz1lLHIud3JpdGVlbmNvZGluZz10LCFyLnRyYW5zZm9ybWluZyl7dmFyIGE9dGhpcy5fcmVhZGFibGVTdGF0ZTsoci5uZWVkVHJhbnNmb3JtfHxhLm5lZWRSZWFkYWJsZXx8YS5sZW5ndGg8YS5oaWdoV2F0ZXJNYXJrKSYmdGhpcy5fcmVhZChhLmhpZ2hXYXRlck1hcmspfX0sci5wcm90b3R5cGUuX3JlYWQ9ZnVuY3Rpb24oKXt2YXIgZT10aGlzLl90cmFuc2Zvcm1TdGF0ZTtudWxsPT09ZS53cml0ZWNodW5rfHxlLnRyYW5zZm9ybWluZz9lLm5lZWRUcmFuc2Zvcm09ITA6KGUudHJhbnNmb3JtaW5nPSEwLHRoaXMuX3RyYW5zZm9ybShlLndyaXRlY2h1bmssZS53cml0ZWVuY29kaW5nLGUuYWZ0ZXJUcmFuc2Zvcm0pKX0sci5wcm90b3R5cGUuX2Rlc3Ryb3k9ZnVuY3Rpb24oZSx0KXt1LnByb3RvdHlwZS5fZGVzdHJveS5jYWxsKHRoaXMsZSxmdW5jdGlvbihlKXt0KGUpfSl9fSx7XCIuLi9lcnJvcnNcIjoxNSxcIi4vX3N0cmVhbV9kdXBsZXhcIjoxNixpbmhlcml0czoxMH1dLDIwOltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihuLHIpeyhmdW5jdGlvbigpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBhKGUpe3ZhciB0PXRoaXM7dGhpcy5uZXh0PW51bGwsdGhpcy5lbnRyeT1udWxsLHRoaXMuZmluaXNoPWZ1bmN0aW9uKCl7dih0LGUpfX1mdW5jdGlvbiBvKGUpe3JldHVybiB4LmZyb20oZSl9ZnVuY3Rpb24gaShlKXtyZXR1cm4geC5pc0J1ZmZlcihlKXx8ZSBpbnN0YW5jZW9mIE59ZnVuY3Rpb24gZCgpe31mdW5jdGlvbiBzKHQsbixyKXtrPWt8fGUoXCIuL19zdHJlYW1fZHVwbGV4XCIpLHQ9dHx8e30sXCJib29sZWFuXCIhPXR5cGVvZiByJiYocj1uIGluc3RhbmNlb2YgayksdGhpcy5vYmplY3RNb2RlPSEhdC5vYmplY3RNb2RlLHImJih0aGlzLm9iamVjdE1vZGU9dGhpcy5vYmplY3RNb2RlfHwhIXQud3JpdGFibGVPYmplY3RNb2RlKSx0aGlzLmhpZ2hXYXRlck1hcms9UCh0aGlzLHQsXCJ3cml0YWJsZUhpZ2hXYXRlck1hcmtcIixyKSx0aGlzLmZpbmFsQ2FsbGVkPSExLHRoaXMubmVlZERyYWluPSExLHRoaXMuZW5kaW5nPSExLHRoaXMuZW5kZWQ9ITEsdGhpcy5maW5pc2hlZD0hMSx0aGlzLmRlc3Ryb3llZD0hMTt2YXIgbz0hMT09PXQuZGVjb2RlU3RyaW5nczt0aGlzLmRlY29kZVN0cmluZ3M9IW8sdGhpcy5kZWZhdWx0RW5jb2Rpbmc9dC5kZWZhdWx0RW5jb2Rpbmd8fFwidXRmOFwiLHRoaXMubGVuZ3RoPTAsdGhpcy53cml0aW5nPSExLHRoaXMuY29ya2VkPTAsdGhpcy5zeW5jPSEwLHRoaXMuYnVmZmVyUHJvY2Vzc2luZz0hMSx0aGlzLm9ud3JpdGU9ZnVuY3Rpb24oZSl7bShuLGUpfSx0aGlzLndyaXRlY2I9bnVsbCx0aGlzLndyaXRlbGVuPTAsdGhpcy5idWZmZXJlZFJlcXVlc3Q9bnVsbCx0aGlzLmxhc3RCdWZmZXJlZFJlcXVlc3Q9bnVsbCx0aGlzLnBlbmRpbmdjYj0wLHRoaXMucHJlZmluaXNoZWQ9ITEsdGhpcy5lcnJvckVtaXR0ZWQ9ITEsdGhpcy5lbWl0Q2xvc2U9ITEhPT10LmVtaXRDbG9zZSx0aGlzLmF1dG9EZXN0cm95PSEhdC5hdXRvRGVzdHJveSx0aGlzLmJ1ZmZlcmVkUmVxdWVzdENvdW50PTAsdGhpcy5jb3JrZWRSZXF1ZXN0c0ZyZWU9bmV3IGEodGhpcyl9ZnVuY3Rpb24gbCh0KXtrPWt8fGUoXCIuL19zdHJlYW1fZHVwbGV4XCIpO3ZhciBuPXRoaXMgaW5zdGFuY2VvZiBrO3JldHVybiBufHxWLmNhbGwobCx0aGlzKT92b2lkKHRoaXMuX3dyaXRhYmxlU3RhdGU9bmV3IHModCx0aGlzLG4pLHRoaXMud3JpdGFibGU9ITAsdCYmKFwiZnVuY3Rpb25cIj09dHlwZW9mIHQud3JpdGUmJih0aGlzLl93cml0ZT10LndyaXRlKSxcImZ1bmN0aW9uXCI9PXR5cGVvZiB0LndyaXRldiYmKHRoaXMuX3dyaXRldj10LndyaXRldiksXCJmdW5jdGlvblwiPT10eXBlb2YgdC5kZXN0cm95JiYodGhpcy5fZGVzdHJveT10LmRlc3Ryb3kpLFwiZnVuY3Rpb25cIj09dHlwZW9mIHQuZmluYWwmJih0aGlzLl9maW5hbD10LmZpbmFsKSksQS5jYWxsKHRoaXMpKTpuZXcgbCh0KX1mdW5jdGlvbiBjKGUsdCl7dmFyIHI9bmV3IFc7WShlLHIpLG4ubmV4dFRpY2sodCxyKX1mdW5jdGlvbiB1KGUsdCxyLGEpe3ZhciBvO3JldHVybiBudWxsPT09cj9vPW5ldyBxOlwic3RyaW5nXCIhPXR5cGVvZiByJiYhdC5vYmplY3RNb2RlJiYobz1uZXcgTyhcImNodW5rXCIsW1wic3RyaW5nXCIsXCJCdWZmZXJcIl0scikpLCFvfHwoWShlLG8pLG4ubmV4dFRpY2soYSxvKSwhMSl9ZnVuY3Rpb24gcChlLHQsbil7cmV0dXJuIGUub2JqZWN0TW9kZXx8ITE9PT1lLmRlY29kZVN0cmluZ3N8fFwic3RyaW5nXCIhPXR5cGVvZiB0fHwodD14LmZyb20odCxuKSksdH1mdW5jdGlvbiBmKGUsdCxuLHIsYSxvKXtpZighbil7dmFyIGk9cCh0LHIsYSk7ciE9PWkmJihuPSEwLGE9XCJidWZmZXJcIixyPWkpfXZhciBkPXQub2JqZWN0TW9kZT8xOnIubGVuZ3RoO3QubGVuZ3RoKz1kO3ZhciBzPXQubGVuZ3RoPHQuaGlnaFdhdGVyTWFyaztpZihzfHwodC5uZWVkRHJhaW49ITApLHQud3JpdGluZ3x8dC5jb3JrZWQpe3ZhciBsPXQubGFzdEJ1ZmZlcmVkUmVxdWVzdDt0Lmxhc3RCdWZmZXJlZFJlcXVlc3Q9e2NodW5rOnIsZW5jb2Rpbmc6YSxpc0J1ZjpuLGNhbGxiYWNrOm8sbmV4dDpudWxsfSxsP2wubmV4dD10Lmxhc3RCdWZmZXJlZFJlcXVlc3Q6dC5idWZmZXJlZFJlcXVlc3Q9dC5sYXN0QnVmZmVyZWRSZXF1ZXN0LHQuYnVmZmVyZWRSZXF1ZXN0Q291bnQrPTF9ZWxzZSBnKGUsdCwhMSxkLHIsYSxvKTtyZXR1cm4gc31mdW5jdGlvbiBnKGUsdCxuLHIsYSxvLGkpe3Qud3JpdGVsZW49cix0LndyaXRlY2I9aSx0LndyaXRpbmc9ITAsdC5zeW5jPSEwLHQuZGVzdHJveWVkP3Qub253cml0ZShuZXcgaihcIndyaXRlXCIpKTpuP2UuX3dyaXRldihhLHQub253cml0ZSk6ZS5fd3JpdGUoYSxvLHQub253cml0ZSksdC5zeW5jPSExfWZ1bmN0aW9uIF8oZSx0LHIsYSxvKXstLXQucGVuZGluZ2NiLHI/KG4ubmV4dFRpY2sobyxhKSxuLm5leHRUaWNrKFMsZSx0KSxlLl93cml0YWJsZVN0YXRlLmVycm9yRW1pdHRlZD0hMCxZKGUsYSkpOihvKGEpLGUuX3dyaXRhYmxlU3RhdGUuZXJyb3JFbWl0dGVkPSEwLFkoZSxhKSxTKGUsdCkpfWZ1bmN0aW9uIGgoZSl7ZS53cml0aW5nPSExLGUud3JpdGVjYj1udWxsLGUubGVuZ3RoLT1lLndyaXRlbGVuLGUud3JpdGVsZW49MH1mdW5jdGlvbiBtKGUsdCl7dmFyIHI9ZS5fd3JpdGFibGVTdGF0ZSxhPXIuc3luYyxvPXIud3JpdGVjYjtpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiBvKXRocm93IG5ldyBCO2lmKGgociksdClfKGUscixhLHQsbyk7ZWxzZXt2YXIgaT1SKHIpfHxlLmRlc3Ryb3llZDtpfHxyLmNvcmtlZHx8ci5idWZmZXJQcm9jZXNzaW5nfHwhci5idWZmZXJlZFJlcXVlc3R8fEMoZSxyKSxhP24ubmV4dFRpY2soYixlLHIsaSxvKTpiKGUscixpLG8pfX1mdW5jdGlvbiBiKGUsdCxuLHIpe258fHkoZSx0KSx0LnBlbmRpbmdjYi0tLHIoKSxTKGUsdCl9ZnVuY3Rpb24geShlLHQpezA9PT10Lmxlbmd0aCYmdC5uZWVkRHJhaW4mJih0Lm5lZWREcmFpbj0hMSxlLmVtaXQoXCJkcmFpblwiKSl9ZnVuY3Rpb24gQyhlLHQpe3QuYnVmZmVyUHJvY2Vzc2luZz0hMDt2YXIgbj10LmJ1ZmZlcmVkUmVxdWVzdDtpZihlLl93cml0ZXYmJm4mJm4ubmV4dCl7dmFyIHI9dC5idWZmZXJlZFJlcXVlc3RDb3VudCxvPUFycmF5KHIpLGk9dC5jb3JrZWRSZXF1ZXN0c0ZyZWU7aS5lbnRyeT1uO2Zvcih2YXIgZD0wLHM9ITA7bjspb1tkXT1uLG4uaXNCdWZ8fChzPSExKSxuPW4ubmV4dCxkKz0xO28uYWxsQnVmZmVycz1zLGcoZSx0LCEwLHQubGVuZ3RoLG8sXCJcIixpLmZpbmlzaCksdC5wZW5kaW5nY2IrKyx0Lmxhc3RCdWZmZXJlZFJlcXVlc3Q9bnVsbCxpLm5leHQ/KHQuY29ya2VkUmVxdWVzdHNGcmVlPWkubmV4dCxpLm5leHQ9bnVsbCk6dC5jb3JrZWRSZXF1ZXN0c0ZyZWU9bmV3IGEodCksdC5idWZmZXJlZFJlcXVlc3RDb3VudD0wfWVsc2V7Zm9yKDtuOyl7dmFyIGw9bi5jaHVuayxjPW4uZW5jb2RpbmcsdT1uLmNhbGxiYWNrLHA9dC5vYmplY3RNb2RlPzE6bC5sZW5ndGg7aWYoZyhlLHQsITEscCxsLGMsdSksbj1uLm5leHQsdC5idWZmZXJlZFJlcXVlc3RDb3VudC0tLHQud3JpdGluZylicmVha31udWxsPT09biYmKHQubGFzdEJ1ZmZlcmVkUmVxdWVzdD1udWxsKX10LmJ1ZmZlcmVkUmVxdWVzdD1uLHQuYnVmZmVyUHJvY2Vzc2luZz0hMX1mdW5jdGlvbiBSKGUpe3JldHVybiBlLmVuZGluZyYmMD09PWUubGVuZ3RoJiZudWxsPT09ZS5idWZmZXJlZFJlcXVlc3QmJiFlLmZpbmlzaGVkJiYhZS53cml0aW5nfWZ1bmN0aW9uIEUoZSx0KXtlLl9maW5hbChmdW5jdGlvbihuKXt0LnBlbmRpbmdjYi0tLG4mJlkoZSxuKSx0LnByZWZpbmlzaGVkPSEwLGUuZW1pdChcInByZWZpbmlzaFwiKSxTKGUsdCl9KX1mdW5jdGlvbiB3KGUsdCl7dC5wcmVmaW5pc2hlZHx8dC5maW5hbENhbGxlZHx8KFwiZnVuY3Rpb25cIiE9dHlwZW9mIGUuX2ZpbmFsfHx0LmRlc3Ryb3llZD8odC5wcmVmaW5pc2hlZD0hMCxlLmVtaXQoXCJwcmVmaW5pc2hcIikpOih0LnBlbmRpbmdjYisrLHQuZmluYWxDYWxsZWQ9ITAsbi5uZXh0VGljayhFLGUsdCkpKX1mdW5jdGlvbiBTKGUsdCl7dmFyIG49Uih0KTtpZihuJiYodyhlLHQpLDA9PT10LnBlbmRpbmdjYiYmKHQuZmluaXNoZWQ9ITAsZS5lbWl0KFwiZmluaXNoXCIpLHQuYXV0b0Rlc3Ryb3kpKSl7dmFyIHI9ZS5fcmVhZGFibGVTdGF0ZTsoIXJ8fHIuYXV0b0Rlc3Ryb3kmJnIuZW5kRW1pdHRlZCkmJmUuZGVzdHJveSgpfXJldHVybiBufWZ1bmN0aW9uIFQoZSx0LHIpe3QuZW5kaW5nPSEwLFMoZSx0KSxyJiYodC5maW5pc2hlZD9uLm5leHRUaWNrKHIpOmUub25jZShcImZpbmlzaFwiLHIpKSx0LmVuZGVkPSEwLGUud3JpdGFibGU9ITF9ZnVuY3Rpb24gdihlLHQsbil7dmFyIHI9ZS5lbnRyeTtmb3IoZS5lbnRyeT1udWxsO3I7KXt2YXIgYT1yLmNhbGxiYWNrO3QucGVuZGluZ2NiLS0sYShuKSxyPXIubmV4dH10LmNvcmtlZFJlcXVlc3RzRnJlZS5uZXh0PWV9dC5leHBvcnRzPWw7dmFyIGs7bC5Xcml0YWJsZVN0YXRlPXM7dmFyIEw9e2RlcHJlY2F0ZTplKFwidXRpbC1kZXByZWNhdGVcIil9LEE9ZShcIi4vaW50ZXJuYWwvc3RyZWFtcy9zdHJlYW1cIikseD1lKFwiYnVmZmVyXCIpLkJ1ZmZlcixOPXIuVWludDhBcnJheXx8ZnVuY3Rpb24oKXt9LEQ9ZShcIi4vaW50ZXJuYWwvc3RyZWFtcy9kZXN0cm95XCIpLEk9ZShcIi4vaW50ZXJuYWwvc3RyZWFtcy9zdGF0ZVwiKSxQPUkuZ2V0SGlnaFdhdGVyTWFyayxNPWUoXCIuLi9lcnJvcnNcIikuY29kZXMsTz1NLkVSUl9JTlZBTElEX0FSR19UWVBFLEY9TS5FUlJfTUVUSE9EX05PVF9JTVBMRU1FTlRFRCxCPU0uRVJSX01VTFRJUExFX0NBTExCQUNLLFU9TS5FUlJfU1RSRUFNX0NBTk5PVF9QSVBFLGo9TS5FUlJfU1RSRUFNX0RFU1RST1lFRCxxPU0uRVJSX1NUUkVBTV9OVUxMX1ZBTFVFUyxXPU0uRVJSX1NUUkVBTV9XUklURV9BRlRFUl9FTkQsSD1NLkVSUl9VTktOT1dOX0VOQ09ESU5HLFk9RC5lcnJvck9yRGVzdHJveTtlKFwiaW5oZXJpdHNcIikobCxBKSxzLnByb3RvdHlwZS5nZXRCdWZmZXI9ZnVuY3Rpb24oKXtmb3IodmFyIGU9dGhpcy5idWZmZXJlZFJlcXVlc3QsdD1bXTtlOyl0LnB1c2goZSksZT1lLm5leHQ7cmV0dXJuIHR9LGZ1bmN0aW9uKCl7dHJ5e09iamVjdC5kZWZpbmVQcm9wZXJ0eShzLnByb3RvdHlwZSxcImJ1ZmZlclwiLHtnZXQ6TC5kZXByZWNhdGUoZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5nZXRCdWZmZXIoKX0sXCJfd3JpdGFibGVTdGF0ZS5idWZmZXIgaXMgZGVwcmVjYXRlZC4gVXNlIF93cml0YWJsZVN0YXRlLmdldEJ1ZmZlciBpbnN0ZWFkLlwiLFwiREVQMDAwM1wiKX0pfWNhdGNoKGUpe319KCk7dmFyIFY7XCJmdW5jdGlvblwiPT10eXBlb2YgU3ltYm9sJiZTeW1ib2wuaGFzSW5zdGFuY2UmJlwiZnVuY3Rpb25cIj09dHlwZW9mIEZ1bmN0aW9uLnByb3RvdHlwZVtTeW1ib2wuaGFzSW5zdGFuY2VdPyhWPUZ1bmN0aW9uLnByb3RvdHlwZVtTeW1ib2wuaGFzSW5zdGFuY2VdLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShsLFN5bWJvbC5oYXNJbnN0YW5jZSx7dmFsdWU6ZnVuY3Rpb24oZSl7cmV0dXJuISFWLmNhbGwodGhpcyxlKXx8ISh0aGlzIT09bCkmJmUmJmUuX3dyaXRhYmxlU3RhdGUgaW5zdGFuY2VvZiBzfX0pKTpWPWZ1bmN0aW9uKGUpe3JldHVybiBlIGluc3RhbmNlb2YgdGhpc30sbC5wcm90b3R5cGUucGlwZT1mdW5jdGlvbigpe1kodGhpcyxuZXcgVSl9LGwucHJvdG90eXBlLndyaXRlPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10aGlzLl93cml0YWJsZVN0YXRlLGE9ITEscz0hci5vYmplY3RNb2RlJiZpKGUpO3JldHVybiBzJiYheC5pc0J1ZmZlcihlKSYmKGU9byhlKSksXCJmdW5jdGlvblwiPT10eXBlb2YgdCYmKG49dCx0PW51bGwpLHM/dD1cImJ1ZmZlclwiOiF0JiYodD1yLmRlZmF1bHRFbmNvZGluZyksXCJmdW5jdGlvblwiIT10eXBlb2YgbiYmKG49ZCksci5lbmRpbmc/Yyh0aGlzLG4pOihzfHx1KHRoaXMscixlLG4pKSYmKHIucGVuZGluZ2NiKyssYT1mKHRoaXMscixzLGUsdCxuKSksYX0sbC5wcm90b3R5cGUuY29yaz1mdW5jdGlvbigpe3RoaXMuX3dyaXRhYmxlU3RhdGUuY29ya2VkKyt9LGwucHJvdG90eXBlLnVuY29yaz1mdW5jdGlvbigpe3ZhciBlPXRoaXMuX3dyaXRhYmxlU3RhdGU7ZS5jb3JrZWQmJihlLmNvcmtlZC0tLCFlLndyaXRpbmcmJiFlLmNvcmtlZCYmIWUuYnVmZmVyUHJvY2Vzc2luZyYmZS5idWZmZXJlZFJlcXVlc3QmJkModGhpcyxlKSl9LGwucHJvdG90eXBlLnNldERlZmF1bHRFbmNvZGluZz1mdW5jdGlvbihlKXtpZihcInN0cmluZ1wiPT10eXBlb2YgZSYmKGU9ZS50b0xvd2VyQ2FzZSgpKSwhKC0xPFtcImhleFwiLFwidXRmOFwiLFwidXRmLThcIixcImFzY2lpXCIsXCJiaW5hcnlcIixcImJhc2U2NFwiLFwidWNzMlwiLFwidWNzLTJcIixcInV0ZjE2bGVcIixcInV0Zi0xNmxlXCIsXCJyYXdcIl0uaW5kZXhPZigoZStcIlwiKS50b0xvd2VyQ2FzZSgpKSkpdGhyb3cgbmV3IEgoZSk7cmV0dXJuIHRoaXMuX3dyaXRhYmxlU3RhdGUuZGVmYXVsdEVuY29kaW5nPWUsdGhpc30sT2JqZWN0LmRlZmluZVByb3BlcnR5KGwucHJvdG90eXBlLFwid3JpdGFibGVCdWZmZXJcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fd3JpdGFibGVTdGF0ZSYmdGhpcy5fd3JpdGFibGVTdGF0ZS5nZXRCdWZmZXIoKX19KSxPYmplY3QuZGVmaW5lUHJvcGVydHkobC5wcm90b3R5cGUsXCJ3cml0YWJsZUhpZ2hXYXRlck1hcmtcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fd3JpdGFibGVTdGF0ZS5oaWdoV2F0ZXJNYXJrfX0pLGwucHJvdG90eXBlLl93cml0ZT1mdW5jdGlvbihlLHQsbil7bihuZXcgRihcIl93cml0ZSgpXCIpKX0sbC5wcm90b3R5cGUuX3dyaXRldj1udWxsLGwucHJvdG90eXBlLmVuZD1mdW5jdGlvbihlLHQsbil7dmFyIHI9dGhpcy5fd3JpdGFibGVTdGF0ZTtyZXR1cm5cImZ1bmN0aW9uXCI9PXR5cGVvZiBlPyhuPWUsZT1udWxsLHQ9bnVsbCk6XCJmdW5jdGlvblwiPT10eXBlb2YgdCYmKG49dCx0PW51bGwpLG51bGwhPT1lJiZ2b2lkIDAhPT1lJiZ0aGlzLndyaXRlKGUsdCksci5jb3JrZWQmJihyLmNvcmtlZD0xLHRoaXMudW5jb3JrKCkpLHIuZW5kaW5nfHxUKHRoaXMscixuKSx0aGlzfSxPYmplY3QuZGVmaW5lUHJvcGVydHkobC5wcm90b3R5cGUsXCJ3cml0YWJsZUxlbmd0aFwiLHtlbnVtZXJhYmxlOiExLGdldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLl93cml0YWJsZVN0YXRlLmxlbmd0aH19KSxPYmplY3QuZGVmaW5lUHJvcGVydHkobC5wcm90b3R5cGUsXCJkZXN0cm95ZWRcIix7ZW51bWVyYWJsZTohMSxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdm9pZCAwIT09dGhpcy5fd3JpdGFibGVTdGF0ZSYmdGhpcy5fd3JpdGFibGVTdGF0ZS5kZXN0cm95ZWR9LHNldDpmdW5jdGlvbihlKXt0aGlzLl93cml0YWJsZVN0YXRlJiYodGhpcy5fd3JpdGFibGVTdGF0ZS5kZXN0cm95ZWQ9ZSl9fSksbC5wcm90b3R5cGUuZGVzdHJveT1ELmRlc3Ryb3ksbC5wcm90b3R5cGUuX3VuZGVzdHJveT1ELnVuZGVzdHJveSxsLnByb3RvdHlwZS5fZGVzdHJveT1mdW5jdGlvbihlLHQpe3QoZSl9fSkuY2FsbCh0aGlzKX0pLmNhbGwodGhpcyxlKFwiX3Byb2Nlc3NcIiksXCJ1bmRlZmluZWRcIj09dHlwZW9mIGdsb2JhbD9cInVuZGVmaW5lZFwiPT10eXBlb2Ygc2VsZj9cInVuZGVmaW5lZFwiPT10eXBlb2Ygd2luZG93P3t9OndpbmRvdzpzZWxmOmdsb2JhbCl9LHtcIi4uL2Vycm9yc1wiOjE1LFwiLi9fc3RyZWFtX2R1cGxleFwiOjE2LFwiLi9pbnRlcm5hbC9zdHJlYW1zL2Rlc3Ryb3lcIjoyMyxcIi4vaW50ZXJuYWwvc3RyZWFtcy9zdGF0ZVwiOjI3LFwiLi9pbnRlcm5hbC9zdHJlYW1zL3N0cmVhbVwiOjI4LF9wcm9jZXNzOjEyLGJ1ZmZlcjozLGluaGVyaXRzOjEwLFwidXRpbC1kZXByZWNhdGVcIjozMn1dLDIxOltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihuKXsoZnVuY3Rpb24oKXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gcihlLHQsbil7cmV0dXJuIHQgaW4gZT9PYmplY3QuZGVmaW5lUHJvcGVydHkoZSx0LHt2YWx1ZTpuLGVudW1lcmFibGU6ITAsY29uZmlndXJhYmxlOiEwLHdyaXRhYmxlOiEwfSk6ZVt0XT1uLGV9ZnVuY3Rpb24gYShlLHQpe3JldHVybnt2YWx1ZTplLGRvbmU6dH19ZnVuY3Rpb24gbyhlKXt2YXIgdD1lW2NdO2lmKG51bGwhPT10KXt2YXIgbj1lW2hdLnJlYWQoKTtudWxsIT09biYmKGVbZ109bnVsbCxlW2NdPW51bGwsZVt1XT1udWxsLHQoYShuLCExKSkpfX1mdW5jdGlvbiBpKGUpe24ubmV4dFRpY2sobyxlKX1mdW5jdGlvbiBkKGUsdCl7cmV0dXJuIGZ1bmN0aW9uKG4scil7ZS50aGVuKGZ1bmN0aW9uKCl7cmV0dXJuIHRbZl0/dm9pZCBuKGEodm9pZCAwLCEwKSk6dm9pZCB0W19dKG4scil9LHIpfX12YXIgcyxsPWUoXCIuL2VuZC1vZi1zdHJlYW1cIiksYz1TeW1ib2woXCJsYXN0UmVzb2x2ZVwiKSx1PVN5bWJvbChcImxhc3RSZWplY3RcIikscD1TeW1ib2woXCJlcnJvclwiKSxmPVN5bWJvbChcImVuZGVkXCIpLGc9U3ltYm9sKFwibGFzdFByb21pc2VcIiksXz1TeW1ib2woXCJoYW5kbGVQcm9taXNlXCIpLGg9U3ltYm9sKFwic3RyZWFtXCIpLG09T2JqZWN0LmdldFByb3RvdHlwZU9mKGZ1bmN0aW9uKCl7fSksYj1PYmplY3Quc2V0UHJvdG90eXBlT2YoKHM9e2dldCBzdHJlYW0oKXtyZXR1cm4gdGhpc1toXX0sbmV4dDpmdW5jdGlvbigpe3ZhciBlPXRoaXMsdD10aGlzW3BdO2lmKG51bGwhPT10KXJldHVybiBQcm9taXNlLnJlamVjdCh0KTtpZih0aGlzW2ZdKXJldHVybiBQcm9taXNlLnJlc29sdmUoYSh2b2lkIDAsITApKTtpZih0aGlzW2hdLmRlc3Ryb3llZClyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24odCxyKXtuLm5leHRUaWNrKGZ1bmN0aW9uKCl7ZVtwXT9yKGVbcF0pOnQoYSh2b2lkIDAsITApKX0pfSk7dmFyIHIsbz10aGlzW2ddO2lmKG8pcj1uZXcgUHJvbWlzZShkKG8sdGhpcykpO2Vsc2V7dmFyIGk9dGhpc1toXS5yZWFkKCk7aWYobnVsbCE9PWkpcmV0dXJuIFByb21pc2UucmVzb2x2ZShhKGksITEpKTtyPW5ldyBQcm9taXNlKHRoaXNbX10pfXJldHVybiB0aGlzW2ddPXIscn19LHIocyxTeW1ib2wuYXN5bmNJdGVyYXRvcixmdW5jdGlvbigpe3JldHVybiB0aGlzfSkscihzLFwicmV0dXJuXCIsZnVuY3Rpb24oKXt2YXIgZT10aGlzO3JldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbih0LG4pe2VbaF0uZGVzdHJveShudWxsLGZ1bmN0aW9uKGUpe3JldHVybiBlP3ZvaWQgbihlKTp2b2lkIHQoYSh2b2lkIDAsITApKX0pfSl9KSxzKSxtKTt0LmV4cG9ydHM9ZnVuY3Rpb24oZSl7dmFyIHQsbj1PYmplY3QuY3JlYXRlKGIsKHQ9e30scih0LGgse3ZhbHVlOmUsd3JpdGFibGU6ITB9KSxyKHQsYyx7dmFsdWU6bnVsbCx3cml0YWJsZTohMH0pLHIodCx1LHt2YWx1ZTpudWxsLHdyaXRhYmxlOiEwfSkscih0LHAse3ZhbHVlOm51bGwsd3JpdGFibGU6ITB9KSxyKHQsZix7dmFsdWU6ZS5fcmVhZGFibGVTdGF0ZS5lbmRFbWl0dGVkLHdyaXRhYmxlOiEwfSkscih0LF8se3ZhbHVlOmZ1bmN0aW9uKGUsdCl7dmFyIHI9bltoXS5yZWFkKCk7cj8obltnXT1udWxsLG5bY109bnVsbCxuW3VdPW51bGwsZShhKHIsITEpKSk6KG5bY109ZSxuW3VdPXQpfSx3cml0YWJsZTohMH0pLHQpKTtyZXR1cm4gbltnXT1udWxsLGwoZSxmdW5jdGlvbihlKXtpZihlJiZcIkVSUl9TVFJFQU1fUFJFTUFUVVJFX0NMT1NFXCIhPT1lLmNvZGUpe3ZhciB0PW5bdV07cmV0dXJuIG51bGwhPT10JiYobltnXT1udWxsLG5bY109bnVsbCxuW3VdPW51bGwsdChlKSksdm9pZChuW3BdPWUpfXZhciByPW5bY107bnVsbCE9PXImJihuW2ddPW51bGwsbltjXT1udWxsLG5bdV09bnVsbCxyKGEodm9pZCAwLCEwKSkpLG5bZl09ITB9KSxlLm9uKFwicmVhZGFibGVcIixpLmJpbmQobnVsbCxuKSksbn19KS5jYWxsKHRoaXMpfSkuY2FsbCh0aGlzLGUoXCJfcHJvY2Vzc1wiKSl9LHtcIi4vZW5kLW9mLXN0cmVhbVwiOjI0LF9wcm9jZXNzOjEyfV0sMjI6W2Z1bmN0aW9uKGUsdCl7J3VzZSBzdHJpY3QnO2Z1bmN0aW9uIG4oZSx0KXt2YXIgbj1PYmplY3Qua2V5cyhlKTtpZihPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKXt2YXIgcj1PYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGUpO3QmJihyPXIuZmlsdGVyKGZ1bmN0aW9uKHQpe3JldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGUsdCkuZW51bWVyYWJsZX0pKSxuLnB1c2guYXBwbHkobixyKX1yZXR1cm4gbn1mdW5jdGlvbiByKGUpe2Zvcih2YXIgdCxyPTE7cjxhcmd1bWVudHMubGVuZ3RoO3IrKyl0PW51bGw9PWFyZ3VtZW50c1tyXT97fTphcmd1bWVudHNbcl0sciUyP24oT2JqZWN0KHQpLCEwKS5mb3JFYWNoKGZ1bmN0aW9uKG4pe2EoZSxuLHRbbl0pfSk6T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnM/T2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZSxPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyh0KSk6bihPYmplY3QodCkpLmZvckVhY2goZnVuY3Rpb24obil7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsbixPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHQsbikpfSk7cmV0dXJuIGV9ZnVuY3Rpb24gYShlLHQsbil7cmV0dXJuIHQgaW4gZT9PYmplY3QuZGVmaW5lUHJvcGVydHkoZSx0LHt2YWx1ZTpuLGVudW1lcmFibGU6ITAsY29uZmlndXJhYmxlOiEwLHdyaXRhYmxlOiEwfSk6ZVt0XT1uLGV9ZnVuY3Rpb24gbyhlLHQpe2lmKCEoZSBpbnN0YW5jZW9mIHQpKXRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIil9ZnVuY3Rpb24gaShlLHQpe2Zvcih2YXIgbixyPTA7cjx0Lmxlbmd0aDtyKyspbj10W3JdLG4uZW51bWVyYWJsZT1uLmVudW1lcmFibGV8fCExLG4uY29uZmlndXJhYmxlPSEwLFwidmFsdWVcImluIG4mJihuLndyaXRhYmxlPSEwKSxPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxuLmtleSxuKX1mdW5jdGlvbiBkKGUsdCxuKXtyZXR1cm4gdCYmaShlLnByb3RvdHlwZSx0KSxuJiZpKGUsbiksZX1mdW5jdGlvbiBzKGUsdCxuKXt1LnByb3RvdHlwZS5jb3B5LmNhbGwoZSx0LG4pfXZhciBsPWUoXCJidWZmZXJcIiksdT1sLkJ1ZmZlcixwPWUoXCJ1dGlsXCIpLGY9cC5pbnNwZWN0LGc9ZiYmZi5jdXN0b218fFwiaW5zcGVjdFwiO3QuZXhwb3J0cz1mdW5jdGlvbigpe2Z1bmN0aW9uIGUoKXtvKHRoaXMsZSksdGhpcy5oZWFkPW51bGwsdGhpcy50YWlsPW51bGwsdGhpcy5sZW5ndGg9MH1yZXR1cm4gZChlLFt7a2V5OlwicHVzaFwiLHZhbHVlOmZ1bmN0aW9uKGUpe3ZhciB0PXtkYXRhOmUsbmV4dDpudWxsfTswPHRoaXMubGVuZ3RoP3RoaXMudGFpbC5uZXh0PXQ6dGhpcy5oZWFkPXQsdGhpcy50YWlsPXQsKyt0aGlzLmxlbmd0aH19LHtrZXk6XCJ1bnNoaWZ0XCIsdmFsdWU6ZnVuY3Rpb24oZSl7dmFyIHQ9e2RhdGE6ZSxuZXh0OnRoaXMuaGVhZH07MD09PXRoaXMubGVuZ3RoJiYodGhpcy50YWlsPXQpLHRoaXMuaGVhZD10LCsrdGhpcy5sZW5ndGh9fSx7a2V5Olwic2hpZnRcIix2YWx1ZTpmdW5jdGlvbigpe2lmKDAhPT10aGlzLmxlbmd0aCl7dmFyIGU9dGhpcy5oZWFkLmRhdGE7cmV0dXJuIHRoaXMuaGVhZD0xPT09dGhpcy5sZW5ndGg/dGhpcy50YWlsPW51bGw6dGhpcy5oZWFkLm5leHQsLS10aGlzLmxlbmd0aCxlfX19LHtrZXk6XCJjbGVhclwiLHZhbHVlOmZ1bmN0aW9uKCl7dGhpcy5oZWFkPXRoaXMudGFpbD1udWxsLHRoaXMubGVuZ3RoPTB9fSx7a2V5Olwiam9pblwiLHZhbHVlOmZ1bmN0aW9uKGUpe2lmKDA9PT10aGlzLmxlbmd0aClyZXR1cm5cIlwiO2Zvcih2YXIgdD10aGlzLmhlYWQsbj1cIlwiK3QuZGF0YTt0PXQubmV4dDspbis9ZSt0LmRhdGE7cmV0dXJuIG59fSx7a2V5OlwiY29uY2F0XCIsdmFsdWU6ZnVuY3Rpb24oZSl7aWYoMD09PXRoaXMubGVuZ3RoKXJldHVybiB1LmFsbG9jKDApO2Zvcih2YXIgdD11LmFsbG9jVW5zYWZlKGU+Pj4wKSxuPXRoaXMuaGVhZCxyPTA7bjspcyhuLmRhdGEsdCxyKSxyKz1uLmRhdGEubGVuZ3RoLG49bi5uZXh0O3JldHVybiB0fX0se2tleTpcImNvbnN1bWVcIix2YWx1ZTpmdW5jdGlvbihlLHQpe3ZhciBuO3JldHVybiBlPHRoaXMuaGVhZC5kYXRhLmxlbmd0aD8obj10aGlzLmhlYWQuZGF0YS5zbGljZSgwLGUpLHRoaXMuaGVhZC5kYXRhPXRoaXMuaGVhZC5kYXRhLnNsaWNlKGUpKTplPT09dGhpcy5oZWFkLmRhdGEubGVuZ3RoP249dGhpcy5zaGlmdCgpOm49dD90aGlzLl9nZXRTdHJpbmcoZSk6dGhpcy5fZ2V0QnVmZmVyKGUpLG59fSx7a2V5OlwiZmlyc3RcIix2YWx1ZTpmdW5jdGlvbigpe3JldHVybiB0aGlzLmhlYWQuZGF0YX19LHtrZXk6XCJfZ2V0U3RyaW5nXCIsdmFsdWU6ZnVuY3Rpb24oZSl7dmFyIHQ9dGhpcy5oZWFkLHI9MSxhPXQuZGF0YTtmb3IoZS09YS5sZW5ndGg7dD10Lm5leHQ7KXt2YXIgbz10LmRhdGEsaT1lPm8ubGVuZ3RoP28ubGVuZ3RoOmU7aWYoYSs9aT09PW8ubGVuZ3RoP286by5zbGljZSgwLGUpLGUtPWksMD09PWUpe2k9PT1vLmxlbmd0aD8oKytyLHRoaXMuaGVhZD10Lm5leHQ/dC5uZXh0OnRoaXMudGFpbD1udWxsKToodGhpcy5oZWFkPXQsdC5kYXRhPW8uc2xpY2UoaSkpO2JyZWFrfSsrcn1yZXR1cm4gdGhpcy5sZW5ndGgtPXIsYX19LHtrZXk6XCJfZ2V0QnVmZmVyXCIsdmFsdWU6ZnVuY3Rpb24oZSl7dmFyIHQ9dS5hbGxvY1Vuc2FmZShlKSxyPXRoaXMuaGVhZCxhPTE7Zm9yKHIuZGF0YS5jb3B5KHQpLGUtPXIuZGF0YS5sZW5ndGg7cj1yLm5leHQ7KXt2YXIgbz1yLmRhdGEsaT1lPm8ubGVuZ3RoP28ubGVuZ3RoOmU7aWYoby5jb3B5KHQsdC5sZW5ndGgtZSwwLGkpLGUtPWksMD09PWUpe2k9PT1vLmxlbmd0aD8oKythLHRoaXMuaGVhZD1yLm5leHQ/ci5uZXh0OnRoaXMudGFpbD1udWxsKToodGhpcy5oZWFkPXIsci5kYXRhPW8uc2xpY2UoaSkpO2JyZWFrfSsrYX1yZXR1cm4gdGhpcy5sZW5ndGgtPWEsdH19LHtrZXk6Zyx2YWx1ZTpmdW5jdGlvbihlLHQpe3JldHVybiBmKHRoaXMscih7fSx0LHtkZXB0aDowLGN1c3RvbUluc3BlY3Q6ITF9KSl9fV0pLGV9KCl9LHtidWZmZXI6Myx1dGlsOjJ9XSwyMzpbZnVuY3Rpb24oZSx0KXsoZnVuY3Rpb24oZSl7KGZ1bmN0aW9uKCl7J3VzZSBzdHJpY3QnO2Z1bmN0aW9uIG4oZSx0KXthKGUsdCkscihlKX1mdW5jdGlvbiByKGUpe2UuX3dyaXRhYmxlU3RhdGUmJiFlLl93cml0YWJsZVN0YXRlLmVtaXRDbG9zZXx8ZS5fcmVhZGFibGVTdGF0ZSYmIWUuX3JlYWRhYmxlU3RhdGUuZW1pdENsb3NlfHxlLmVtaXQoXCJjbG9zZVwiKX1mdW5jdGlvbiBhKGUsdCl7ZS5lbWl0KFwiZXJyb3JcIix0KX10LmV4cG9ydHM9e2Rlc3Ryb3k6ZnVuY3Rpb24odCxvKXt2YXIgaT10aGlzLGQ9dGhpcy5fcmVhZGFibGVTdGF0ZSYmdGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWQscz10aGlzLl93cml0YWJsZVN0YXRlJiZ0aGlzLl93cml0YWJsZVN0YXRlLmRlc3Ryb3llZDtyZXR1cm4gZHx8cz8obz9vKHQpOnQmJih0aGlzLl93cml0YWJsZVN0YXRlPyF0aGlzLl93cml0YWJsZVN0YXRlLmVycm9yRW1pdHRlZCYmKHRoaXMuX3dyaXRhYmxlU3RhdGUuZXJyb3JFbWl0dGVkPSEwLGUubmV4dFRpY2soYSx0aGlzLHQpKTplLm5leHRUaWNrKGEsdGhpcyx0KSksdGhpcyk6KHRoaXMuX3JlYWRhYmxlU3RhdGUmJih0aGlzLl9yZWFkYWJsZVN0YXRlLmRlc3Ryb3llZD0hMCksdGhpcy5fd3JpdGFibGVTdGF0ZSYmKHRoaXMuX3dyaXRhYmxlU3RhdGUuZGVzdHJveWVkPSEwKSx0aGlzLl9kZXN0cm95KHR8fG51bGwsZnVuY3Rpb24odCl7IW8mJnQ/aS5fd3JpdGFibGVTdGF0ZT9pLl93cml0YWJsZVN0YXRlLmVycm9yRW1pdHRlZD9lLm5leHRUaWNrKHIsaSk6KGkuX3dyaXRhYmxlU3RhdGUuZXJyb3JFbWl0dGVkPSEwLGUubmV4dFRpY2sobixpLHQpKTplLm5leHRUaWNrKG4saSx0KTpvPyhlLm5leHRUaWNrKHIsaSksbyh0KSk6ZS5uZXh0VGljayhyLGkpfSksdGhpcyl9LHVuZGVzdHJveTpmdW5jdGlvbigpe3RoaXMuX3JlYWRhYmxlU3RhdGUmJih0aGlzLl9yZWFkYWJsZVN0YXRlLmRlc3Ryb3llZD0hMSx0aGlzLl9yZWFkYWJsZVN0YXRlLnJlYWRpbmc9ITEsdGhpcy5fcmVhZGFibGVTdGF0ZS5lbmRlZD0hMSx0aGlzLl9yZWFkYWJsZVN0YXRlLmVuZEVtaXR0ZWQ9ITEpLHRoaXMuX3dyaXRhYmxlU3RhdGUmJih0aGlzLl93cml0YWJsZVN0YXRlLmRlc3Ryb3llZD0hMSx0aGlzLl93cml0YWJsZVN0YXRlLmVuZGVkPSExLHRoaXMuX3dyaXRhYmxlU3RhdGUuZW5kaW5nPSExLHRoaXMuX3dyaXRhYmxlU3RhdGUuZmluYWxDYWxsZWQ9ITEsdGhpcy5fd3JpdGFibGVTdGF0ZS5wcmVmaW5pc2hlZD0hMSx0aGlzLl93cml0YWJsZVN0YXRlLmZpbmlzaGVkPSExLHRoaXMuX3dyaXRhYmxlU3RhdGUuZXJyb3JFbWl0dGVkPSExKX0sZXJyb3JPckRlc3Ryb3k6ZnVuY3Rpb24oZSx0KXt2YXIgbj1lLl9yZWFkYWJsZVN0YXRlLHI9ZS5fd3JpdGFibGVTdGF0ZTtuJiZuLmF1dG9EZXN0cm95fHxyJiZyLmF1dG9EZXN0cm95P2UuZGVzdHJveSh0KTplLmVtaXQoXCJlcnJvclwiLHQpfX19KS5jYWxsKHRoaXMpfSkuY2FsbCh0aGlzLGUoXCJfcHJvY2Vzc1wiKSl9LHtfcHJvY2VzczoxMn1dLDI0OltmdW5jdGlvbihlLHQpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBuKGUpe3ZhciB0PSExO3JldHVybiBmdW5jdGlvbigpe2lmKCF0KXt0PSEwO2Zvcih2YXIgbj1hcmd1bWVudHMubGVuZ3RoLHI9QXJyYXkobiksYT0wO2E8bjthKyspclthXT1hcmd1bWVudHNbYV07ZS5hcHBseSh0aGlzLHIpfX19ZnVuY3Rpb24gcigpe31mdW5jdGlvbiBhKGUpe3JldHVybiBlLnNldEhlYWRlciYmXCJmdW5jdGlvblwiPT10eXBlb2YgZS5hYm9ydH1mdW5jdGlvbiBvKGUsdCxkKXtpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiB0KXJldHVybiBvKGUsbnVsbCx0KTt0fHwodD17fSksZD1uKGR8fHIpO3ZhciBzPXQucmVhZGFibGV8fCExIT09dC5yZWFkYWJsZSYmZS5yZWFkYWJsZSxsPXQud3JpdGFibGV8fCExIT09dC53cml0YWJsZSYmZS53cml0YWJsZSxjPWZ1bmN0aW9uKCl7ZS53cml0YWJsZXx8cCgpfSx1PWUuX3dyaXRhYmxlU3RhdGUmJmUuX3dyaXRhYmxlU3RhdGUuZmluaXNoZWQscD1mdW5jdGlvbigpe2w9ITEsdT0hMCxzfHxkLmNhbGwoZSl9LGY9ZS5fcmVhZGFibGVTdGF0ZSYmZS5fcmVhZGFibGVTdGF0ZS5lbmRFbWl0dGVkLGc9ZnVuY3Rpb24oKXtzPSExLGY9ITAsbHx8ZC5jYWxsKGUpfSxfPWZ1bmN0aW9uKHQpe2QuY2FsbChlLHQpfSxoPWZ1bmN0aW9uKCl7dmFyIHQ7cmV0dXJuIHMmJiFmPyhlLl9yZWFkYWJsZVN0YXRlJiZlLl9yZWFkYWJsZVN0YXRlLmVuZGVkfHwodD1uZXcgaSksZC5jYWxsKGUsdCkpOmwmJiF1PyhlLl93cml0YWJsZVN0YXRlJiZlLl93cml0YWJsZVN0YXRlLmVuZGVkfHwodD1uZXcgaSksZC5jYWxsKGUsdCkpOnZvaWQgMH0sbT1mdW5jdGlvbigpe2UucmVxLm9uKFwiZmluaXNoXCIscCl9O3JldHVybiBhKGUpPyhlLm9uKFwiY29tcGxldGVcIixwKSxlLm9uKFwiYWJvcnRcIixoKSxlLnJlcT9tKCk6ZS5vbihcInJlcXVlc3RcIixtKSk6bCYmIWUuX3dyaXRhYmxlU3RhdGUmJihlLm9uKFwiZW5kXCIsYyksZS5vbihcImNsb3NlXCIsYykpLGUub24oXCJlbmRcIixnKSxlLm9uKFwiZmluaXNoXCIscCksITEhPT10LmVycm9yJiZlLm9uKFwiZXJyb3JcIixfKSxlLm9uKFwiY2xvc2VcIixoKSxmdW5jdGlvbigpe2UucmVtb3ZlTGlzdGVuZXIoXCJjb21wbGV0ZVwiLHApLGUucmVtb3ZlTGlzdGVuZXIoXCJhYm9ydFwiLGgpLGUucmVtb3ZlTGlzdGVuZXIoXCJyZXF1ZXN0XCIsbSksZS5yZXEmJmUucmVxLnJlbW92ZUxpc3RlbmVyKFwiZmluaXNoXCIscCksZS5yZW1vdmVMaXN0ZW5lcihcImVuZFwiLGMpLGUucmVtb3ZlTGlzdGVuZXIoXCJjbG9zZVwiLGMpLGUucmVtb3ZlTGlzdGVuZXIoXCJmaW5pc2hcIixwKSxlLnJlbW92ZUxpc3RlbmVyKFwiZW5kXCIsZyksZS5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsXyksZS5yZW1vdmVMaXN0ZW5lcihcImNsb3NlXCIsaCl9fXZhciBpPWUoXCIuLi8uLi8uLi9lcnJvcnNcIikuY29kZXMuRVJSX1NUUkVBTV9QUkVNQVRVUkVfQ0xPU0U7dC5leHBvcnRzPW99LHtcIi4uLy4uLy4uL2Vycm9yc1wiOjE1fV0sMjU6W2Z1bmN0aW9uKGUsdCl7dC5leHBvcnRzPWZ1bmN0aW9uKCl7dGhyb3cgbmV3IEVycm9yKFwiUmVhZGFibGUuZnJvbSBpcyBub3QgYXZhaWxhYmxlIGluIHRoZSBicm93c2VyXCIpfX0se31dLDI2OltmdW5jdGlvbihlLHQpeyd1c2Ugc3RyaWN0JztmdW5jdGlvbiBuKGUpe3ZhciB0PSExO3JldHVybiBmdW5jdGlvbigpe3R8fCh0PSEwLGUuYXBwbHkodm9pZCAwLGFyZ3VtZW50cykpfX1mdW5jdGlvbiByKGUpe2lmKGUpdGhyb3cgZX1mdW5jdGlvbiBhKGUpe3JldHVybiBlLnNldEhlYWRlciYmXCJmdW5jdGlvblwiPT10eXBlb2YgZS5hYm9ydH1mdW5jdGlvbiBvKHQscixvLGkpe2k9bihpKTt2YXIgZD0hMTt0Lm9uKFwiY2xvc2VcIixmdW5jdGlvbigpe2Q9ITB9KSxsPT09dm9pZCAwJiYobD1lKFwiLi9lbmQtb2Ytc3RyZWFtXCIpKSxsKHQse3JlYWRhYmxlOnIsd3JpdGFibGU6b30sZnVuY3Rpb24oZSl7cmV0dXJuIGU/aShlKTp2b2lkKGQ9ITAsaSgpKX0pO3ZhciBzPSExO3JldHVybiBmdW5jdGlvbihlKXtpZighZClyZXR1cm4gcz92b2lkIDA6KHM9ITAsYSh0KT90LmFib3J0KCk6XCJmdW5jdGlvblwiPT10eXBlb2YgdC5kZXN0cm95P3QuZGVzdHJveSgpOnZvaWQgaShlfHxuZXcgcChcInBpcGVcIikpKX19ZnVuY3Rpb24gaShlKXtlKCl9ZnVuY3Rpb24gZChlLHQpe3JldHVybiBlLnBpcGUodCl9ZnVuY3Rpb24gcyhlKXtyZXR1cm4gZS5sZW5ndGg/XCJmdW5jdGlvblwiPT10eXBlb2YgZVtlLmxlbmd0aC0xXT9lLnBvcCgpOnI6cn12YXIgbCxjPWUoXCIuLi8uLi8uLi9lcnJvcnNcIikuY29kZXMsdT1jLkVSUl9NSVNTSU5HX0FSR1MscD1jLkVSUl9TVFJFQU1fREVTVFJPWUVEO3QuZXhwb3J0cz1mdW5jdGlvbigpe2Zvcih2YXIgZT1hcmd1bWVudHMubGVuZ3RoLHQ9QXJyYXkoZSksbj0wO248ZTtuKyspdFtuXT1hcmd1bWVudHNbbl07dmFyIHI9cyh0KTtpZihBcnJheS5pc0FycmF5KHRbMF0pJiYodD10WzBdKSwyPnQubGVuZ3RoKXRocm93IG5ldyB1KFwic3RyZWFtc1wiKTt2YXIgYSxsPXQubWFwKGZ1bmN0aW9uKGUsbil7dmFyIGQ9bjx0Lmxlbmd0aC0xO3JldHVybiBvKGUsZCwwPG4sZnVuY3Rpb24oZSl7YXx8KGE9ZSksZSYmbC5mb3JFYWNoKGkpLGR8fChsLmZvckVhY2goaSkscihhKSl9KX0pO3JldHVybiB0LnJlZHVjZShkKX19LHtcIi4uLy4uLy4uL2Vycm9yc1wiOjE1LFwiLi9lbmQtb2Ytc3RyZWFtXCI6MjR9XSwyNzpbZnVuY3Rpb24oZSxuKXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gcihlLHQsbil7cmV0dXJuIG51bGw9PWUuaGlnaFdhdGVyTWFyaz90P2Vbbl06bnVsbDplLmhpZ2hXYXRlck1hcmt9dmFyIGE9ZShcIi4uLy4uLy4uL2Vycm9yc1wiKS5jb2Rlcy5FUlJfSU5WQUxJRF9PUFRfVkFMVUU7bi5leHBvcnRzPXtnZXRIaWdoV2F0ZXJNYXJrOmZ1bmN0aW9uKGUsbixvLGkpe3ZhciBkPXIobixpLG8pO2lmKG51bGwhPWQpe2lmKCEoaXNGaW5pdGUoZCkmJnQoZCk9PT1kKXx8MD5kKXt2YXIgcz1pP286XCJoaWdoV2F0ZXJNYXJrXCI7dGhyb3cgbmV3IGEocyxkKX1yZXR1cm4gdChkKX1yZXR1cm4gZS5vYmplY3RNb2RlPzE2OjE2Mzg0fX19LHtcIi4uLy4uLy4uL2Vycm9yc1wiOjE1fV0sMjg6W2Z1bmN0aW9uKGUsdCl7dC5leHBvcnRzPWUoXCJldmVudHNcIikuRXZlbnRFbWl0dGVyfSx7ZXZlbnRzOjd9XSwyOTpbZnVuY3Rpb24oZSx0LG4pe249dC5leHBvcnRzPWUoXCIuL2xpYi9fc3RyZWFtX3JlYWRhYmxlLmpzXCIpLG4uU3RyZWFtPW4sbi5SZWFkYWJsZT1uLG4uV3JpdGFibGU9ZShcIi4vbGliL19zdHJlYW1fd3JpdGFibGUuanNcIiksbi5EdXBsZXg9ZShcIi4vbGliL19zdHJlYW1fZHVwbGV4LmpzXCIpLG4uVHJhbnNmb3JtPWUoXCIuL2xpYi9fc3RyZWFtX3RyYW5zZm9ybS5qc1wiKSxuLlBhc3NUaHJvdWdoPWUoXCIuL2xpYi9fc3RyZWFtX3Bhc3N0aHJvdWdoLmpzXCIpLG4uZmluaXNoZWQ9ZShcIi4vbGliL2ludGVybmFsL3N0cmVhbXMvZW5kLW9mLXN0cmVhbS5qc1wiKSxuLnBpcGVsaW5lPWUoXCIuL2xpYi9pbnRlcm5hbC9zdHJlYW1zL3BpcGVsaW5lLmpzXCIpfSx7XCIuL2xpYi9fc3RyZWFtX2R1cGxleC5qc1wiOjE2LFwiLi9saWIvX3N0cmVhbV9wYXNzdGhyb3VnaC5qc1wiOjE3LFwiLi9saWIvX3N0cmVhbV9yZWFkYWJsZS5qc1wiOjE4LFwiLi9saWIvX3N0cmVhbV90cmFuc2Zvcm0uanNcIjoxOSxcIi4vbGliL19zdHJlYW1fd3JpdGFibGUuanNcIjoyMCxcIi4vbGliL2ludGVybmFsL3N0cmVhbXMvZW5kLW9mLXN0cmVhbS5qc1wiOjI0LFwiLi9saWIvaW50ZXJuYWwvc3RyZWFtcy9waXBlbGluZS5qc1wiOjI2fV0sMzA6W2Z1bmN0aW9uKGUsdCxuKXtmdW5jdGlvbiByKGUsdCl7Zm9yKHZhciBuIGluIGUpdFtuXT1lW25dfWZ1bmN0aW9uIGEoZSx0LG4pe3JldHVybiBpKGUsdCxuKX0vKiEgc2FmZS1idWZmZXIuIE1JVCBMaWNlbnNlLiBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmcvb3BlbnNvdXJjZT4gKi92YXIgbz1lKFwiYnVmZmVyXCIpLGk9by5CdWZmZXI7aS5mcm9tJiZpLmFsbG9jJiZpLmFsbG9jVW5zYWZlJiZpLmFsbG9jVW5zYWZlU2xvdz90LmV4cG9ydHM9bzoocihvLG4pLG4uQnVmZmVyPWEpLGEucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoaS5wcm90b3R5cGUpLHIoaSxhKSxhLmZyb209ZnVuY3Rpb24oZSx0LG4pe2lmKFwibnVtYmVyXCI9PXR5cGVvZiBlKXRocm93IG5ldyBUeXBlRXJyb3IoXCJBcmd1bWVudCBtdXN0IG5vdCBiZSBhIG51bWJlclwiKTtyZXR1cm4gaShlLHQsbil9LGEuYWxsb2M9ZnVuY3Rpb24oZSx0LG4pe2lmKFwibnVtYmVyXCIhPXR5cGVvZiBlKXRocm93IG5ldyBUeXBlRXJyb3IoXCJBcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyXCIpO3ZhciByPWkoZSk7cmV0dXJuIHZvaWQgMD09PXQ/ci5maWxsKDApOlwic3RyaW5nXCI9PXR5cGVvZiBuP3IuZmlsbCh0LG4pOnIuZmlsbCh0KSxyfSxhLmFsbG9jVW5zYWZlPWZ1bmN0aW9uKGUpe2lmKFwibnVtYmVyXCIhPXR5cGVvZiBlKXRocm93IG5ldyBUeXBlRXJyb3IoXCJBcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyXCIpO3JldHVybiBpKGUpfSxhLmFsbG9jVW5zYWZlU2xvdz1mdW5jdGlvbihlKXtpZihcIm51bWJlclwiIT10eXBlb2YgZSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiQXJndW1lbnQgbXVzdCBiZSBhIG51bWJlclwiKTtyZXR1cm4gby5TbG93QnVmZmVyKGUpfX0se2J1ZmZlcjozfV0sMzE6W2Z1bmN0aW9uKGUsdCxuKXsndXNlIHN0cmljdCc7ZnVuY3Rpb24gcihlKXtpZighZSlyZXR1cm5cInV0ZjhcIjtmb3IodmFyIHQ7Oylzd2l0Y2goZSl7Y2FzZVwidXRmOFwiOmNhc2VcInV0Zi04XCI6cmV0dXJuXCJ1dGY4XCI7Y2FzZVwidWNzMlwiOmNhc2VcInVjcy0yXCI6Y2FzZVwidXRmMTZsZVwiOmNhc2VcInV0Zi0xNmxlXCI6cmV0dXJuXCJ1dGYxNmxlXCI7Y2FzZVwibGF0aW4xXCI6Y2FzZVwiYmluYXJ5XCI6cmV0dXJuXCJsYXRpbjFcIjtjYXNlXCJiYXNlNjRcIjpjYXNlXCJhc2NpaVwiOmNhc2VcImhleFwiOnJldHVybiBlO2RlZmF1bHQ6aWYodClyZXR1cm47ZT0oXCJcIitlKS50b0xvd2VyQ2FzZSgpLHQ9ITA7fX1mdW5jdGlvbiBhKGUpe3ZhciB0PXIoZSk7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIHQmJihtLmlzRW5jb2Rpbmc9PT1ifHwhYihlKSkpdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBlbmNvZGluZzogXCIrZSk7cmV0dXJuIHR8fGV9ZnVuY3Rpb24gbyhlKXt0aGlzLmVuY29kaW5nPWEoZSk7dmFyIHQ7c3dpdGNoKHRoaXMuZW5jb2Rpbmcpe2Nhc2VcInV0ZjE2bGVcIjp0aGlzLnRleHQ9dSx0aGlzLmVuZD1wLHQ9NDticmVhaztjYXNlXCJ1dGY4XCI6dGhpcy5maWxsTGFzdD1jLHQ9NDticmVhaztjYXNlXCJiYXNlNjRcIjp0aGlzLnRleHQ9Zix0aGlzLmVuZD1nLHQ9MzticmVhaztkZWZhdWx0OnJldHVybiB0aGlzLndyaXRlPV8sdm9pZCh0aGlzLmVuZD1oKTt9dGhpcy5sYXN0TmVlZD0wLHRoaXMubGFzdFRvdGFsPTAsdGhpcy5sYXN0Q2hhcj1tLmFsbG9jVW5zYWZlKHQpfWZ1bmN0aW9uIGQoZSl7aWYoMTI3Pj1lKXJldHVybiAwO3JldHVybiA2PT1lPj41PzI6MTQ9PWU+PjQ/MzozMD09ZT4+Mz80OjI9PWU+PjY/LTE6LTJ9ZnVuY3Rpb24gcyhlLHQsbil7dmFyIHI9dC5sZW5ndGgtMTtpZihyPG4pcmV0dXJuIDA7dmFyIGE9ZCh0W3JdKTtyZXR1cm4gMDw9YT8oMDxhJiYoZS5sYXN0TmVlZD1hLTEpLGEpOi0tcjxufHwtMj09PWE/MDooYT1kKHRbcl0pLDA8PWEpPygwPGEmJihlLmxhc3ROZWVkPWEtMiksYSk6LS1yPG58fC0yPT09YT8wOihhPWQodFtyXSksMDw9YT8oMDxhJiYoMj09PWE/YT0wOmUubGFzdE5lZWQ9YS0zKSxhKTowKX1mdW5jdGlvbiBsKGUsdCl7aWYoMTI4IT0oMTkyJnRbMF0pKXJldHVybiBlLmxhc3ROZWVkPTAsXCJcXHVGRkZEXCI7aWYoMTxlLmxhc3ROZWVkJiYxPHQubGVuZ3RoKXtpZigxMjghPSgxOTImdFsxXSkpcmV0dXJuIGUubGFzdE5lZWQ9MSxcIlxcdUZGRkRcIjtpZigyPGUubGFzdE5lZWQmJjI8dC5sZW5ndGgmJjEyOCE9KDE5MiZ0WzJdKSlyZXR1cm4gZS5sYXN0TmVlZD0yLFwiXFx1RkZGRFwifX1mdW5jdGlvbiBjKGUpe3ZhciB0PXRoaXMubGFzdFRvdGFsLXRoaXMubGFzdE5lZWQsbj1sKHRoaXMsZSx0KTtyZXR1cm4gdm9pZCAwPT09bj90aGlzLmxhc3ROZWVkPD1lLmxlbmd0aD8oZS5jb3B5KHRoaXMubGFzdENoYXIsdCwwLHRoaXMubGFzdE5lZWQpLHRoaXMubGFzdENoYXIudG9TdHJpbmcodGhpcy5lbmNvZGluZywwLHRoaXMubGFzdFRvdGFsKSk6dm9pZChlLmNvcHkodGhpcy5sYXN0Q2hhcix0LDAsZS5sZW5ndGgpLHRoaXMubGFzdE5lZWQtPWUubGVuZ3RoKTpufWZ1bmN0aW9uIHUoZSx0KXtpZigwPT0oZS5sZW5ndGgtdCklMil7dmFyIG49ZS50b1N0cmluZyhcInV0ZjE2bGVcIix0KTtpZihuKXt2YXIgcj1uLmNoYXJDb2RlQXQobi5sZW5ndGgtMSk7aWYoNTUyOTY8PXImJjU2MzE5Pj1yKXJldHVybiB0aGlzLmxhc3ROZWVkPTIsdGhpcy5sYXN0VG90YWw9NCx0aGlzLmxhc3RDaGFyWzBdPWVbZS5sZW5ndGgtMl0sdGhpcy5sYXN0Q2hhclsxXT1lW2UubGVuZ3RoLTFdLG4uc2xpY2UoMCwtMSl9cmV0dXJuIG59cmV0dXJuIHRoaXMubGFzdE5lZWQ9MSx0aGlzLmxhc3RUb3RhbD0yLHRoaXMubGFzdENoYXJbMF09ZVtlLmxlbmd0aC0xXSxlLnRvU3RyaW5nKFwidXRmMTZsZVwiLHQsZS5sZW5ndGgtMSl9ZnVuY3Rpb24gcChlKXt2YXIgdD1lJiZlLmxlbmd0aD90aGlzLndyaXRlKGUpOlwiXCI7aWYodGhpcy5sYXN0TmVlZCl7dmFyIG49dGhpcy5sYXN0VG90YWwtdGhpcy5sYXN0TmVlZDtyZXR1cm4gdCt0aGlzLmxhc3RDaGFyLnRvU3RyaW5nKFwidXRmMTZsZVwiLDAsbil9cmV0dXJuIHR9ZnVuY3Rpb24gZihlLHQpe3ZhciByPShlLmxlbmd0aC10KSUzO3JldHVybiAwPT1yP2UudG9TdHJpbmcoXCJiYXNlNjRcIix0KToodGhpcy5sYXN0TmVlZD0zLXIsdGhpcy5sYXN0VG90YWw9MywxPT1yP3RoaXMubGFzdENoYXJbMF09ZVtlLmxlbmd0aC0xXToodGhpcy5sYXN0Q2hhclswXT1lW2UubGVuZ3RoLTJdLHRoaXMubGFzdENoYXJbMV09ZVtlLmxlbmd0aC0xXSksZS50b1N0cmluZyhcImJhc2U2NFwiLHQsZS5sZW5ndGgtcikpfWZ1bmN0aW9uIGcoZSl7dmFyIHQ9ZSYmZS5sZW5ndGg/dGhpcy53cml0ZShlKTpcIlwiO3JldHVybiB0aGlzLmxhc3ROZWVkP3QrdGhpcy5sYXN0Q2hhci50b1N0cmluZyhcImJhc2U2NFwiLDAsMy10aGlzLmxhc3ROZWVkKTp0fWZ1bmN0aW9uIF8oZSl7cmV0dXJuIGUudG9TdHJpbmcodGhpcy5lbmNvZGluZyl9ZnVuY3Rpb24gaChlKXtyZXR1cm4gZSYmZS5sZW5ndGg/dGhpcy53cml0ZShlKTpcIlwifXZhciBtPWUoXCJzYWZlLWJ1ZmZlclwiKS5CdWZmZXIsYj1tLmlzRW5jb2Rpbmd8fGZ1bmN0aW9uKGUpe3N3aXRjaChlPVwiXCIrZSxlJiZlLnRvTG93ZXJDYXNlKCkpe2Nhc2VcImhleFwiOmNhc2VcInV0ZjhcIjpjYXNlXCJ1dGYtOFwiOmNhc2VcImFzY2lpXCI6Y2FzZVwiYmluYXJ5XCI6Y2FzZVwiYmFzZTY0XCI6Y2FzZVwidWNzMlwiOmNhc2VcInVjcy0yXCI6Y2FzZVwidXRmMTZsZVwiOmNhc2VcInV0Zi0xNmxlXCI6Y2FzZVwicmF3XCI6cmV0dXJuITA7ZGVmYXVsdDpyZXR1cm4hMTt9fTtuLlN0cmluZ0RlY29kZXI9byxvLnByb3RvdHlwZS53cml0ZT1mdW5jdGlvbihlKXtpZigwPT09ZS5sZW5ndGgpcmV0dXJuXCJcIjt2YXIgdCxuO2lmKHRoaXMubGFzdE5lZWQpe2lmKHQ9dGhpcy5maWxsTGFzdChlKSx2b2lkIDA9PT10KXJldHVyblwiXCI7bj10aGlzLmxhc3ROZWVkLHRoaXMubGFzdE5lZWQ9MH1lbHNlIG49MDtyZXR1cm4gbjxlLmxlbmd0aD90P3QrdGhpcy50ZXh0KGUsbik6dGhpcy50ZXh0KGUsbik6dHx8XCJcIn0sby5wcm90b3R5cGUuZW5kPWZ1bmN0aW9uKGUpe3ZhciB0PWUmJmUubGVuZ3RoP3RoaXMud3JpdGUoZSk6XCJcIjtyZXR1cm4gdGhpcy5sYXN0TmVlZD90K1wiXFx1RkZGRFwiOnR9LG8ucHJvdG90eXBlLnRleHQ9ZnVuY3Rpb24oZSx0KXt2YXIgbj1zKHRoaXMsZSx0KTtpZighdGhpcy5sYXN0TmVlZClyZXR1cm4gZS50b1N0cmluZyhcInV0ZjhcIix0KTt0aGlzLmxhc3RUb3RhbD1uO3ZhciByPWUubGVuZ3RoLShuLXRoaXMubGFzdE5lZWQpO3JldHVybiBlLmNvcHkodGhpcy5sYXN0Q2hhciwwLHIpLGUudG9TdHJpbmcoXCJ1dGY4XCIsdCxyKX0sby5wcm90b3R5cGUuZmlsbExhc3Q9ZnVuY3Rpb24oZSl7cmV0dXJuIHRoaXMubGFzdE5lZWQ8PWUubGVuZ3RoPyhlLmNvcHkodGhpcy5sYXN0Q2hhcix0aGlzLmxhc3RUb3RhbC10aGlzLmxhc3ROZWVkLDAsdGhpcy5sYXN0TmVlZCksdGhpcy5sYXN0Q2hhci50b1N0cmluZyh0aGlzLmVuY29kaW5nLDAsdGhpcy5sYXN0VG90YWwpKTp2b2lkKGUuY29weSh0aGlzLmxhc3RDaGFyLHRoaXMubGFzdFRvdGFsLXRoaXMubGFzdE5lZWQsMCxlLmxlbmd0aCksdGhpcy5sYXN0TmVlZC09ZS5sZW5ndGgpfX0se1wic2FmZS1idWZmZXJcIjozMH1dLDMyOltmdW5jdGlvbihlLHQpeyhmdW5jdGlvbihlKXsoZnVuY3Rpb24oKXtmdW5jdGlvbiBuKHQpe3RyeXtpZighZS5sb2NhbFN0b3JhZ2UpcmV0dXJuITF9Y2F0Y2goZSl7cmV0dXJuITF9dmFyIG49ZS5sb2NhbFN0b3JhZ2VbdF07cmV0dXJuIG51bGwhPW4mJlwidHJ1ZVwiPT09KG4rXCJcIikudG9Mb3dlckNhc2UoKX10LmV4cG9ydHM9ZnVuY3Rpb24oZSx0KXtmdW5jdGlvbiByKCl7aWYoIWEpe2lmKG4oXCJ0aHJvd0RlcHJlY2F0aW9uXCIpKXRocm93IG5ldyBFcnJvcih0KTtlbHNlIG4oXCJ0cmFjZURlcHJlY2F0aW9uXCIpP2NvbnNvbGUudHJhY2UodCk6Y29uc29sZS53YXJuKHQpO2E9ITB9cmV0dXJuIGUuYXBwbHkodGhpcyxhcmd1bWVudHMpfWlmKG4oXCJub0RlcHJlY2F0aW9uXCIpKXJldHVybiBlO3ZhciBhPSExO3JldHVybiByfX0pLmNhbGwodGhpcyl9KS5jYWxsKHRoaXMsXCJ1bmRlZmluZWRcIj09dHlwZW9mIGdsb2JhbD9cInVuZGVmaW5lZFwiPT10eXBlb2Ygc2VsZj9cInVuZGVmaW5lZFwiPT10eXBlb2Ygd2luZG93P3t9OndpbmRvdzpzZWxmOmdsb2JhbCl9LHt9XSxcIi9cIjpbZnVuY3Rpb24oZSx0KXtmdW5jdGlvbiBuKGUpe3JldHVybiBlLnJlcGxhY2UoL2E9aWNlLW9wdGlvbnM6dHJpY2tsZVxcc1xcbi9nLFwiXCIpfWZ1bmN0aW9uIHIoZSl7Y29uc29sZS53YXJuKGUpfS8qISBzaW1wbGUtcGVlci4gTUlUIExpY2Vuc2UuIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZy9vcGVuc291cmNlPiAqL2NvbnN0IGE9ZShcImRlYnVnXCIpKFwic2ltcGxlLXBlZXJcIiksbz1lKFwiZ2V0LWJyb3dzZXItcnRjXCIpLGk9ZShcInJhbmRvbWJ5dGVzXCIpLGQ9ZShcInJlYWRhYmxlLXN0cmVhbVwiKSxzPWUoXCJxdWV1ZS1taWNyb3Rhc2tcIiksbD1lKFwiZXJyLWNvZGVcIikse0J1ZmZlcjpjfT1lKFwiYnVmZmVyXCIpLHU9NjU1MzY7Y2xhc3MgcCBleHRlbmRzIGQuRHVwbGV4e2NvbnN0cnVjdG9yKGUpe2lmKGU9T2JqZWN0LmFzc2lnbih7YWxsb3dIYWxmT3BlbjohMX0sZSksc3VwZXIoZSksdGhpcy5faWQ9aSg0KS50b1N0cmluZyhcImhleFwiKS5zbGljZSgwLDcpLHRoaXMuX2RlYnVnKFwibmV3IHBlZXIgJW9cIixlKSx0aGlzLmNoYW5uZWxOYW1lPWUuaW5pdGlhdG9yP2UuY2hhbm5lbE5hbWV8fGkoMjApLnRvU3RyaW5nKFwiaGV4XCIpOm51bGwsdGhpcy5pbml0aWF0b3I9ZS5pbml0aWF0b3J8fCExLHRoaXMuY2hhbm5lbENvbmZpZz1lLmNoYW5uZWxDb25maWd8fHAuY2hhbm5lbENvbmZpZyx0aGlzLmNoYW5uZWxOZWdvdGlhdGVkPXRoaXMuY2hhbm5lbENvbmZpZy5uZWdvdGlhdGVkLHRoaXMuY29uZmlnPU9iamVjdC5hc3NpZ24oe30scC5jb25maWcsZS5jb25maWcpLHRoaXMub2ZmZXJPcHRpb25zPWUub2ZmZXJPcHRpb25zfHx7fSx0aGlzLmFuc3dlck9wdGlvbnM9ZS5hbnN3ZXJPcHRpb25zfHx7fSx0aGlzLnNkcFRyYW5zZm9ybT1lLnNkcFRyYW5zZm9ybXx8KGU9PmUpLHRoaXMuc3RyZWFtcz1lLnN0cmVhbXN8fChlLnN0cmVhbT9bZS5zdHJlYW1dOltdKSx0aGlzLnRyaWNrbGU9dm9pZCAwPT09ZS50cmlja2xlfHxlLnRyaWNrbGUsdGhpcy5hbGxvd0hhbGZUcmlja2xlPXZvaWQgMCE9PWUuYWxsb3dIYWxmVHJpY2tsZSYmZS5hbGxvd0hhbGZUcmlja2xlLHRoaXMuaWNlQ29tcGxldGVUaW1lb3V0PWUuaWNlQ29tcGxldGVUaW1lb3V0fHw1MDAwLHRoaXMuZGVzdHJveWVkPSExLHRoaXMuZGVzdHJveWluZz0hMSx0aGlzLl9jb25uZWN0ZWQ9ITEsdGhpcy5yZW1vdGVBZGRyZXNzPXZvaWQgMCx0aGlzLnJlbW90ZUZhbWlseT12b2lkIDAsdGhpcy5yZW1vdGVQb3J0PXZvaWQgMCx0aGlzLmxvY2FsQWRkcmVzcz12b2lkIDAsdGhpcy5sb2NhbEZhbWlseT12b2lkIDAsdGhpcy5sb2NhbFBvcnQ9dm9pZCAwLHRoaXMuX3dydGM9ZS53cnRjJiZcIm9iamVjdFwiPT10eXBlb2YgZS53cnRjP2Uud3J0YzpvKCksIXRoaXMuX3dydGMpaWYoXCJ1bmRlZmluZWRcIj09dHlwZW9mIHdpbmRvdyl0aHJvdyBsKG5ldyBFcnJvcihcIk5vIFdlYlJUQyBzdXBwb3J0OiBTcGVjaWZ5IGBvcHRzLndydGNgIG9wdGlvbiBpbiB0aGlzIGVudmlyb25tZW50XCIpLFwiRVJSX1dFQlJUQ19TVVBQT1JUXCIpO2Vsc2UgdGhyb3cgbChuZXcgRXJyb3IoXCJObyBXZWJSVEMgc3VwcG9ydDogTm90IGEgc3VwcG9ydGVkIGJyb3dzZXJcIiksXCJFUlJfV0VCUlRDX1NVUFBPUlRcIik7dGhpcy5fcGNSZWFkeT0hMSx0aGlzLl9jaGFubmVsUmVhZHk9ITEsdGhpcy5faWNlQ29tcGxldGU9ITEsdGhpcy5faWNlQ29tcGxldGVUaW1lcj1udWxsLHRoaXMuX2NoYW5uZWw9bnVsbCx0aGlzLl9wZW5kaW5nQ2FuZGlkYXRlcz1bXSx0aGlzLl9pc05lZ290aWF0aW5nPSExLHRoaXMuX2ZpcnN0TmVnb3RpYXRpb249ITAsdGhpcy5fYmF0Y2hlZE5lZ290aWF0aW9uPSExLHRoaXMuX3F1ZXVlZE5lZ290aWF0aW9uPSExLHRoaXMuX3NlbmRlcnNBd2FpdGluZ1N0YWJsZT1bXSx0aGlzLl9zZW5kZXJNYXA9bmV3IE1hcCx0aGlzLl9jbG9zaW5nSW50ZXJ2YWw9bnVsbCx0aGlzLl9yZW1vdGVUcmFja3M9W10sdGhpcy5fcmVtb3RlU3RyZWFtcz1bXSx0aGlzLl9jaHVuaz1udWxsLHRoaXMuX2NiPW51bGwsdGhpcy5faW50ZXJ2YWw9bnVsbDt0cnl7dGhpcy5fcGM9bmV3IHRoaXMuX3dydGMuUlRDUGVlckNvbm5lY3Rpb24odGhpcy5jb25maWcpfWNhdGNoKGUpe3JldHVybiB2b2lkIHRoaXMuZGVzdHJveShsKGUsXCJFUlJfUENfQ09OU1RSVUNUT1JcIikpfXRoaXMuX2lzUmVhY3ROYXRpdmVXZWJydGM9XCJudW1iZXJcIj09dHlwZW9mIHRoaXMuX3BjLl9wZWVyQ29ubmVjdGlvbklkLHRoaXMuX3BjLm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlPSgpPT57dGhpcy5fb25JY2VTdGF0ZUNoYW5nZSgpfSx0aGlzLl9wYy5vbmljZWdhdGhlcmluZ3N0YXRlY2hhbmdlPSgpPT57dGhpcy5fb25JY2VTdGF0ZUNoYW5nZSgpfSx0aGlzLl9wYy5vbmNvbm5lY3Rpb25zdGF0ZWNoYW5nZT0oKT0+e3RoaXMuX29uQ29ubmVjdGlvblN0YXRlQ2hhbmdlKCl9LHRoaXMuX3BjLm9uc2lnbmFsaW5nc3RhdGVjaGFuZ2U9KCk9Pnt0aGlzLl9vblNpZ25hbGluZ1N0YXRlQ2hhbmdlKCl9LHRoaXMuX3BjLm9uaWNlY2FuZGlkYXRlPWU9Pnt0aGlzLl9vbkljZUNhbmRpZGF0ZShlKX0sXCJvYmplY3RcIj09dHlwZW9mIHRoaXMuX3BjLnBlZXJJZGVudGl0eSYmdGhpcy5fcGMucGVlcklkZW50aXR5LmNhdGNoKGU9Pnt0aGlzLmRlc3Ryb3kobChlLFwiRVJSX1BDX1BFRVJfSURFTlRJVFlcIikpfSksdGhpcy5pbml0aWF0b3J8fHRoaXMuY2hhbm5lbE5lZ290aWF0ZWQ/dGhpcy5fc2V0dXBEYXRhKHtjaGFubmVsOnRoaXMuX3BjLmNyZWF0ZURhdGFDaGFubmVsKHRoaXMuY2hhbm5lbE5hbWUsdGhpcy5jaGFubmVsQ29uZmlnKX0pOnRoaXMuX3BjLm9uZGF0YWNoYW5uZWw9ZT0+e3RoaXMuX3NldHVwRGF0YShlKX0sdGhpcy5zdHJlYW1zJiZ0aGlzLnN0cmVhbXMuZm9yRWFjaChlPT57dGhpcy5hZGRTdHJlYW0oZSl9KSx0aGlzLl9wYy5vbnRyYWNrPWU9Pnt0aGlzLl9vblRyYWNrKGUpfSx0aGlzLl9kZWJ1ZyhcImluaXRpYWwgbmVnb3RpYXRpb25cIiksdGhpcy5fbmVlZHNOZWdvdGlhdGlvbigpLHRoaXMuX29uRmluaXNoQm91bmQ9KCk9Pnt0aGlzLl9vbkZpbmlzaCgpfSx0aGlzLm9uY2UoXCJmaW5pc2hcIix0aGlzLl9vbkZpbmlzaEJvdW5kKX1nZXQgYnVmZmVyU2l6ZSgpe3JldHVybiB0aGlzLl9jaGFubmVsJiZ0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50fHwwfWdldCBjb25uZWN0ZWQoKXtyZXR1cm4gdGhpcy5fY29ubmVjdGVkJiZcIm9wZW5cIj09PXRoaXMuX2NoYW5uZWwucmVhZHlTdGF0ZX1hZGRyZXNzKCl7cmV0dXJue3BvcnQ6dGhpcy5sb2NhbFBvcnQsZmFtaWx5OnRoaXMubG9jYWxGYW1pbHksYWRkcmVzczp0aGlzLmxvY2FsQWRkcmVzc319c2lnbmFsKGUpe2lmKCF0aGlzLmRlc3Ryb3lpbmcpe2lmKHRoaXMuZGVzdHJveWVkKXRocm93IGwobmV3IEVycm9yKFwiY2Fubm90IHNpZ25hbCBhZnRlciBwZWVyIGlzIGRlc3Ryb3llZFwiKSxcIkVSUl9ERVNUUk9ZRURcIik7aWYoXCJzdHJpbmdcIj09dHlwZW9mIGUpdHJ5e2U9SlNPTi5wYXJzZShlKX1jYXRjaCh0KXtlPXt9fXRoaXMuX2RlYnVnKFwic2lnbmFsKClcIiksZS5yZW5lZ290aWF0ZSYmdGhpcy5pbml0aWF0b3ImJih0aGlzLl9kZWJ1ZyhcImdvdCByZXF1ZXN0IHRvIHJlbmVnb3RpYXRlXCIpLHRoaXMuX25lZWRzTmVnb3RpYXRpb24oKSksZS50cmFuc2NlaXZlclJlcXVlc3QmJnRoaXMuaW5pdGlhdG9yJiYodGhpcy5fZGVidWcoXCJnb3QgcmVxdWVzdCBmb3IgdHJhbnNjZWl2ZXJcIiksdGhpcy5hZGRUcmFuc2NlaXZlcihlLnRyYW5zY2VpdmVyUmVxdWVzdC5raW5kLGUudHJhbnNjZWl2ZXJSZXF1ZXN0LmluaXQpKSxlLmNhbmRpZGF0ZSYmKHRoaXMuX3BjLnJlbW90ZURlc2NyaXB0aW9uJiZ0aGlzLl9wYy5yZW1vdGVEZXNjcmlwdGlvbi50eXBlP3RoaXMuX2FkZEljZUNhbmRpZGF0ZShlLmNhbmRpZGF0ZSk6dGhpcy5fcGVuZGluZ0NhbmRpZGF0ZXMucHVzaChlLmNhbmRpZGF0ZSkpLGUuc2RwJiZ0aGlzLl9wYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgdGhpcy5fd3J0Yy5SVENTZXNzaW9uRGVzY3JpcHRpb24oZSkpLnRoZW4oKCk9Pnt0aGlzLmRlc3Ryb3llZHx8KHRoaXMuX3BlbmRpbmdDYW5kaWRhdGVzLmZvckVhY2goZT0+e3RoaXMuX2FkZEljZUNhbmRpZGF0ZShlKX0pLHRoaXMuX3BlbmRpbmdDYW5kaWRhdGVzPVtdLFwib2ZmZXJcIj09PXRoaXMuX3BjLnJlbW90ZURlc2NyaXB0aW9uLnR5cGUmJnRoaXMuX2NyZWF0ZUFuc3dlcigpKX0pLmNhdGNoKGU9Pnt0aGlzLmRlc3Ryb3kobChlLFwiRVJSX1NFVF9SRU1PVEVfREVTQ1JJUFRJT05cIikpfSksZS5zZHB8fGUuY2FuZGlkYXRlfHxlLnJlbmVnb3RpYXRlfHxlLnRyYW5zY2VpdmVyUmVxdWVzdHx8dGhpcy5kZXN0cm95KGwobmV3IEVycm9yKFwic2lnbmFsKCkgY2FsbGVkIHdpdGggaW52YWxpZCBzaWduYWwgZGF0YVwiKSxcIkVSUl9TSUdOQUxJTkdcIikpfX1fYWRkSWNlQ2FuZGlkYXRlKGUpe2NvbnN0IHQ9bmV3IHRoaXMuX3dydGMuUlRDSWNlQ2FuZGlkYXRlKGUpO3RoaXMuX3BjLmFkZEljZUNhbmRpZGF0ZSh0KS5jYXRjaChlPT57IXQuYWRkcmVzc3x8dC5hZGRyZXNzLmVuZHNXaXRoKFwiLmxvY2FsXCIpP3IoXCJJZ25vcmluZyB1bnN1cHBvcnRlZCBJQ0UgY2FuZGlkYXRlLlwiKTp0aGlzLmRlc3Ryb3kobChlLFwiRVJSX0FERF9JQ0VfQ0FORElEQVRFXCIpKX0pfXNlbmQoZSl7aWYoIXRoaXMuZGVzdHJveWluZyl7aWYodGhpcy5kZXN0cm95ZWQpdGhyb3cgbChuZXcgRXJyb3IoXCJjYW5ub3Qgc2VuZCBhZnRlciBwZWVyIGlzIGRlc3Ryb3llZFwiKSxcIkVSUl9ERVNUUk9ZRURcIik7dGhpcy5fY2hhbm5lbC5zZW5kKGUpfX1hZGRUcmFuc2NlaXZlcihlLHQpe2lmKCF0aGlzLmRlc3Ryb3lpbmcpe2lmKHRoaXMuZGVzdHJveWVkKXRocm93IGwobmV3IEVycm9yKFwiY2Fubm90IGFkZFRyYW5zY2VpdmVyIGFmdGVyIHBlZXIgaXMgZGVzdHJveWVkXCIpLFwiRVJSX0RFU1RST1lFRFwiKTtpZih0aGlzLl9kZWJ1ZyhcImFkZFRyYW5zY2VpdmVyKClcIiksdGhpcy5pbml0aWF0b3IpdHJ5e3RoaXMuX3BjLmFkZFRyYW5zY2VpdmVyKGUsdCksdGhpcy5fbmVlZHNOZWdvdGlhdGlvbigpfWNhdGNoKGUpe3RoaXMuZGVzdHJveShsKGUsXCJFUlJfQUREX1RSQU5TQ0VJVkVSXCIpKX1lbHNlIHRoaXMuZW1pdChcInNpZ25hbFwiLHt0eXBlOlwidHJhbnNjZWl2ZXJSZXF1ZXN0XCIsdHJhbnNjZWl2ZXJSZXF1ZXN0OntraW5kOmUsaW5pdDp0fX0pfX1hZGRTdHJlYW0oZSl7aWYoIXRoaXMuZGVzdHJveWluZyl7aWYodGhpcy5kZXN0cm95ZWQpdGhyb3cgbChuZXcgRXJyb3IoXCJjYW5ub3QgYWRkU3RyZWFtIGFmdGVyIHBlZXIgaXMgZGVzdHJveWVkXCIpLFwiRVJSX0RFU1RST1lFRFwiKTt0aGlzLl9kZWJ1ZyhcImFkZFN0cmVhbSgpXCIpLGUuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0PT57dGhpcy5hZGRUcmFjayh0LGUpfSl9fWFkZFRyYWNrKGUsdCl7aWYodGhpcy5kZXN0cm95aW5nKXJldHVybjtpZih0aGlzLmRlc3Ryb3llZCl0aHJvdyBsKG5ldyBFcnJvcihcImNhbm5vdCBhZGRUcmFjayBhZnRlciBwZWVyIGlzIGRlc3Ryb3llZFwiKSxcIkVSUl9ERVNUUk9ZRURcIik7dGhpcy5fZGVidWcoXCJhZGRUcmFjaygpXCIpO2NvbnN0IG49dGhpcy5fc2VuZGVyTWFwLmdldChlKXx8bmV3IE1hcDtsZXQgcj1uLmdldCh0KTtpZighcilyPXRoaXMuX3BjLmFkZFRyYWNrKGUsdCksbi5zZXQodCxyKSx0aGlzLl9zZW5kZXJNYXAuc2V0KGUsbiksdGhpcy5fbmVlZHNOZWdvdGlhdGlvbigpO2Vsc2UgaWYoci5yZW1vdmVkKXRocm93IGwobmV3IEVycm9yKFwiVHJhY2sgaGFzIGJlZW4gcmVtb3ZlZC4gWW91IHNob3VsZCBlbmFibGUvZGlzYWJsZSB0cmFja3MgdGhhdCB5b3Ugd2FudCB0byByZS1hZGQuXCIpLFwiRVJSX1NFTkRFUl9SRU1PVkVEXCIpO2Vsc2UgdGhyb3cgbChuZXcgRXJyb3IoXCJUcmFjayBoYXMgYWxyZWFkeSBiZWVuIGFkZGVkIHRvIHRoYXQgc3RyZWFtLlwiKSxcIkVSUl9TRU5ERVJfQUxSRUFEWV9BRERFRFwiKX1yZXBsYWNlVHJhY2soZSx0LG4pe2lmKHRoaXMuZGVzdHJveWluZylyZXR1cm47aWYodGhpcy5kZXN0cm95ZWQpdGhyb3cgbChuZXcgRXJyb3IoXCJjYW5ub3QgcmVwbGFjZVRyYWNrIGFmdGVyIHBlZXIgaXMgZGVzdHJveWVkXCIpLFwiRVJSX0RFU1RST1lFRFwiKTt0aGlzLl9kZWJ1ZyhcInJlcGxhY2VUcmFjaygpXCIpO2NvbnN0IHI9dGhpcy5fc2VuZGVyTWFwLmdldChlKSxhPXI/ci5nZXQobik6bnVsbDtpZighYSl0aHJvdyBsKG5ldyBFcnJvcihcIkNhbm5vdCByZXBsYWNlIHRyYWNrIHRoYXQgd2FzIG5ldmVyIGFkZGVkLlwiKSxcIkVSUl9UUkFDS19OT1RfQURERURcIik7dCYmdGhpcy5fc2VuZGVyTWFwLnNldCh0LHIpLG51bGw9PWEucmVwbGFjZVRyYWNrP3RoaXMuZGVzdHJveShsKG5ldyBFcnJvcihcInJlcGxhY2VUcmFjayBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKSxcIkVSUl9VTlNVUFBPUlRFRF9SRVBMQUNFVFJBQ0tcIikpOmEucmVwbGFjZVRyYWNrKHQpfXJlbW92ZVRyYWNrKGUsdCl7aWYodGhpcy5kZXN0cm95aW5nKXJldHVybjtpZih0aGlzLmRlc3Ryb3llZCl0aHJvdyBsKG5ldyBFcnJvcihcImNhbm5vdCByZW1vdmVUcmFjayBhZnRlciBwZWVyIGlzIGRlc3Ryb3llZFwiKSxcIkVSUl9ERVNUUk9ZRURcIik7dGhpcy5fZGVidWcoXCJyZW1vdmVTZW5kZXIoKVwiKTtjb25zdCBuPXRoaXMuX3NlbmRlck1hcC5nZXQoZSkscj1uP24uZ2V0KHQpOm51bGw7aWYoIXIpdGhyb3cgbChuZXcgRXJyb3IoXCJDYW5ub3QgcmVtb3ZlIHRyYWNrIHRoYXQgd2FzIG5ldmVyIGFkZGVkLlwiKSxcIkVSUl9UUkFDS19OT1RfQURERURcIik7dHJ5e3IucmVtb3ZlZD0hMCx0aGlzLl9wYy5yZW1vdmVUcmFjayhyKX1jYXRjaChlKXtcIk5TX0VSUk9SX1VORVhQRUNURURcIj09PWUubmFtZT90aGlzLl9zZW5kZXJzQXdhaXRpbmdTdGFibGUucHVzaChyKTp0aGlzLmRlc3Ryb3kobChlLFwiRVJSX1JFTU9WRV9UUkFDS1wiKSl9dGhpcy5fbmVlZHNOZWdvdGlhdGlvbigpfXJlbW92ZVN0cmVhbShlKXtpZighdGhpcy5kZXN0cm95aW5nKXtpZih0aGlzLmRlc3Ryb3llZCl0aHJvdyBsKG5ldyBFcnJvcihcImNhbm5vdCByZW1vdmVTdHJlYW0gYWZ0ZXIgcGVlciBpcyBkZXN0cm95ZWRcIiksXCJFUlJfREVTVFJPWUVEXCIpO3RoaXMuX2RlYnVnKFwicmVtb3ZlU2VuZGVycygpXCIpLGUuZ2V0VHJhY2tzKCkuZm9yRWFjaCh0PT57dGhpcy5yZW1vdmVUcmFjayh0LGUpfSl9fV9uZWVkc05lZ290aWF0aW9uKCl7dGhpcy5fZGVidWcoXCJfbmVlZHNOZWdvdGlhdGlvblwiKSx0aGlzLl9iYXRjaGVkTmVnb3RpYXRpb258fCh0aGlzLl9iYXRjaGVkTmVnb3RpYXRpb249ITAscygoKT0+e3RoaXMuX2JhdGNoZWROZWdvdGlhdGlvbj0hMSx0aGlzLmluaXRpYXRvcnx8IXRoaXMuX2ZpcnN0TmVnb3RpYXRpb24/KHRoaXMuX2RlYnVnKFwic3RhcnRpbmcgYmF0Y2hlZCBuZWdvdGlhdGlvblwiKSx0aGlzLm5lZ290aWF0ZSgpKTp0aGlzLl9kZWJ1ZyhcIm5vbi1pbml0aWF0b3IgaW5pdGlhbCBuZWdvdGlhdGlvbiByZXF1ZXN0IGRpc2NhcmRlZFwiKSx0aGlzLl9maXJzdE5lZ290aWF0aW9uPSExfSkpfW5lZ290aWF0ZSgpe2lmKCF0aGlzLmRlc3Ryb3lpbmcpe2lmKHRoaXMuZGVzdHJveWVkKXRocm93IGwobmV3IEVycm9yKFwiY2Fubm90IG5lZ290aWF0ZSBhZnRlciBwZWVyIGlzIGRlc3Ryb3llZFwiKSxcIkVSUl9ERVNUUk9ZRURcIik7dGhpcy5pbml0aWF0b3I/dGhpcy5faXNOZWdvdGlhdGluZz8odGhpcy5fcXVldWVkTmVnb3RpYXRpb249ITAsdGhpcy5fZGVidWcoXCJhbHJlYWR5IG5lZ290aWF0aW5nLCBxdWV1ZWluZ1wiKSk6KHRoaXMuX2RlYnVnKFwic3RhcnQgbmVnb3RpYXRpb25cIiksc2V0VGltZW91dCgoKT0+e3RoaXMuX2NyZWF0ZU9mZmVyKCl9LDApKTp0aGlzLl9pc05lZ290aWF0aW5nPyh0aGlzLl9xdWV1ZWROZWdvdGlhdGlvbj0hMCx0aGlzLl9kZWJ1ZyhcImFscmVhZHkgbmVnb3RpYXRpbmcsIHF1ZXVlaW5nXCIpKToodGhpcy5fZGVidWcoXCJyZXF1ZXN0aW5nIG5lZ290aWF0aW9uIGZyb20gaW5pdGlhdG9yXCIpLHRoaXMuZW1pdChcInNpZ25hbFwiLHt0eXBlOlwicmVuZWdvdGlhdGVcIixyZW5lZ290aWF0ZTohMH0pKSx0aGlzLl9pc05lZ290aWF0aW5nPSEwfX1kZXN0cm95KGUpe3RoaXMuX2Rlc3Ryb3koZSwoKT0+e30pfV9kZXN0cm95KGUsdCl7dGhpcy5kZXN0cm95ZWR8fHRoaXMuZGVzdHJveWluZ3x8KHRoaXMuZGVzdHJveWluZz0hMCx0aGlzLl9kZWJ1ZyhcImRlc3Ryb3lpbmcgKGVycm9yOiAlcylcIixlJiYoZS5tZXNzYWdlfHxlKSkscygoKT0+e2lmKHRoaXMuZGVzdHJveWVkPSEwLHRoaXMuZGVzdHJveWluZz0hMSx0aGlzLl9kZWJ1ZyhcImRlc3Ryb3kgKGVycm9yOiAlcylcIixlJiYoZS5tZXNzYWdlfHxlKSksdGhpcy5yZWFkYWJsZT10aGlzLndyaXRhYmxlPSExLHRoaXMuX3JlYWRhYmxlU3RhdGUuZW5kZWR8fHRoaXMucHVzaChudWxsKSx0aGlzLl93cml0YWJsZVN0YXRlLmZpbmlzaGVkfHx0aGlzLmVuZCgpLHRoaXMuX2Nvbm5lY3RlZD0hMSx0aGlzLl9wY1JlYWR5PSExLHRoaXMuX2NoYW5uZWxSZWFkeT0hMSx0aGlzLl9yZW1vdGVUcmFja3M9bnVsbCx0aGlzLl9yZW1vdGVTdHJlYW1zPW51bGwsdGhpcy5fc2VuZGVyTWFwPW51bGwsY2xlYXJJbnRlcnZhbCh0aGlzLl9jbG9zaW5nSW50ZXJ2YWwpLHRoaXMuX2Nsb3NpbmdJbnRlcnZhbD1udWxsLGNsZWFySW50ZXJ2YWwodGhpcy5faW50ZXJ2YWwpLHRoaXMuX2ludGVydmFsPW51bGwsdGhpcy5fY2h1bms9bnVsbCx0aGlzLl9jYj1udWxsLHRoaXMuX29uRmluaXNoQm91bmQmJnRoaXMucmVtb3ZlTGlzdGVuZXIoXCJmaW5pc2hcIix0aGlzLl9vbkZpbmlzaEJvdW5kKSx0aGlzLl9vbkZpbmlzaEJvdW5kPW51bGwsdGhpcy5fY2hhbm5lbCl7dHJ5e3RoaXMuX2NoYW5uZWwuY2xvc2UoKX1jYXRjaChlKXt9dGhpcy5fY2hhbm5lbC5vbm1lc3NhZ2U9bnVsbCx0aGlzLl9jaGFubmVsLm9ub3Blbj1udWxsLHRoaXMuX2NoYW5uZWwub25jbG9zZT1udWxsLHRoaXMuX2NoYW5uZWwub25lcnJvcj1udWxsfWlmKHRoaXMuX3BjKXt0cnl7dGhpcy5fcGMuY2xvc2UoKX1jYXRjaChlKXt9dGhpcy5fcGMub25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2U9bnVsbCx0aGlzLl9wYy5vbmljZWdhdGhlcmluZ3N0YXRlY2hhbmdlPW51bGwsdGhpcy5fcGMub25zaWduYWxpbmdzdGF0ZWNoYW5nZT1udWxsLHRoaXMuX3BjLm9uaWNlY2FuZGlkYXRlPW51bGwsdGhpcy5fcGMub250cmFjaz1udWxsLHRoaXMuX3BjLm9uZGF0YWNoYW5uZWw9bnVsbH10aGlzLl9wYz1udWxsLHRoaXMuX2NoYW5uZWw9bnVsbCxlJiZ0aGlzLmVtaXQoXCJlcnJvclwiLGUpLHRoaXMuZW1pdChcImNsb3NlXCIpLHQoKX0pKX1fc2V0dXBEYXRhKGUpe2lmKCFlLmNoYW5uZWwpcmV0dXJuIHRoaXMuZGVzdHJveShsKG5ldyBFcnJvcihcIkRhdGEgY2hhbm5lbCBldmVudCBpcyBtaXNzaW5nIGBjaGFubmVsYCBwcm9wZXJ0eVwiKSxcIkVSUl9EQVRBX0NIQU5ORUxcIikpO3RoaXMuX2NoYW5uZWw9ZS5jaGFubmVsLHRoaXMuX2NoYW5uZWwuYmluYXJ5VHlwZT1cImFycmF5YnVmZmVyXCIsXCJudW1iZXJcIj09dHlwZW9mIHRoaXMuX2NoYW5uZWwuYnVmZmVyZWRBbW91bnRMb3dUaHJlc2hvbGQmJih0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50TG93VGhyZXNob2xkPXUpLHRoaXMuY2hhbm5lbE5hbWU9dGhpcy5fY2hhbm5lbC5sYWJlbCx0aGlzLl9jaGFubmVsLm9ubWVzc2FnZT1lPT57dGhpcy5fb25DaGFubmVsTWVzc2FnZShlKX0sdGhpcy5fY2hhbm5lbC5vbmJ1ZmZlcmVkYW1vdW50bG93PSgpPT57dGhpcy5fb25DaGFubmVsQnVmZmVyZWRBbW91bnRMb3coKX0sdGhpcy5fY2hhbm5lbC5vbm9wZW49KCk9Pnt0aGlzLl9vbkNoYW5uZWxPcGVuKCl9LHRoaXMuX2NoYW5uZWwub25jbG9zZT0oKT0+e3RoaXMuX29uQ2hhbm5lbENsb3NlKCl9LHRoaXMuX2NoYW5uZWwub25lcnJvcj1lPT57Y29uc3QgdD1lLmVycm9yIGluc3RhbmNlb2YgRXJyb3I/ZS5lcnJvcjpuZXcgRXJyb3IoYERhdGFjaGFubmVsIGVycm9yOiAke2UubWVzc2FnZX0gJHtlLmZpbGVuYW1lfToke2UubGluZW5vfToke2UuY29sbm99YCk7dGhpcy5kZXN0cm95KGwodCxcIkVSUl9EQVRBX0NIQU5ORUxcIikpfTtsZXQgdD0hMTt0aGlzLl9jbG9zaW5nSW50ZXJ2YWw9c2V0SW50ZXJ2YWwoKCk9Pnt0aGlzLl9jaGFubmVsJiZcImNsb3NpbmdcIj09PXRoaXMuX2NoYW5uZWwucmVhZHlTdGF0ZT8odCYmdGhpcy5fb25DaGFubmVsQ2xvc2UoKSx0PSEwKTp0PSExfSw1MDAwKX1fcmVhZCgpe31fd3JpdGUoZSx0LG4pe2lmKHRoaXMuZGVzdHJveWVkKXJldHVybiBuKGwobmV3IEVycm9yKFwiY2Fubm90IHdyaXRlIGFmdGVyIHBlZXIgaXMgZGVzdHJveWVkXCIpLFwiRVJSX0RBVEFfQ0hBTk5FTFwiKSk7aWYodGhpcy5fY29ubmVjdGVkKXt0cnl7dGhpcy5zZW5kKGUpfWNhdGNoKGUpe3JldHVybiB0aGlzLmRlc3Ryb3kobChlLFwiRVJSX0RBVEFfQ0hBTk5FTFwiKSl9dGhpcy5fY2hhbm5lbC5idWZmZXJlZEFtb3VudD51Pyh0aGlzLl9kZWJ1ZyhcInN0YXJ0IGJhY2twcmVzc3VyZTogYnVmZmVyZWRBbW91bnQgJWRcIix0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50KSx0aGlzLl9jYj1uKTpuKG51bGwpfWVsc2UgdGhpcy5fZGVidWcoXCJ3cml0ZSBiZWZvcmUgY29ubmVjdFwiKSx0aGlzLl9jaHVuaz1lLHRoaXMuX2NiPW59X29uRmluaXNoKCl7aWYoIXRoaXMuZGVzdHJveWVkKXtjb25zdCBlPSgpPT57c2V0VGltZW91dCgoKT0+dGhpcy5kZXN0cm95KCksMWUzKX07dGhpcy5fY29ubmVjdGVkP2UoKTp0aGlzLm9uY2UoXCJjb25uZWN0XCIsZSl9fV9zdGFydEljZUNvbXBsZXRlVGltZW91dCgpe3RoaXMuZGVzdHJveWVkfHx0aGlzLl9pY2VDb21wbGV0ZVRpbWVyfHwodGhpcy5fZGVidWcoXCJzdGFydGVkIGljZUNvbXBsZXRlIHRpbWVvdXRcIiksdGhpcy5faWNlQ29tcGxldGVUaW1lcj1zZXRUaW1lb3V0KCgpPT57dGhpcy5faWNlQ29tcGxldGV8fCh0aGlzLl9pY2VDb21wbGV0ZT0hMCx0aGlzLl9kZWJ1ZyhcImljZUNvbXBsZXRlIHRpbWVvdXQgY29tcGxldGVkXCIpLHRoaXMuZW1pdChcImljZVRpbWVvdXRcIiksdGhpcy5lbWl0KFwiX2ljZUNvbXBsZXRlXCIpKX0sdGhpcy5pY2VDb21wbGV0ZVRpbWVvdXQpKX1fY3JlYXRlT2ZmZXIoKXt0aGlzLmRlc3Ryb3llZHx8dGhpcy5fcGMuY3JlYXRlT2ZmZXIodGhpcy5vZmZlck9wdGlvbnMpLnRoZW4oZT0+e2lmKHRoaXMuZGVzdHJveWVkKXJldHVybjt0aGlzLnRyaWNrbGV8fHRoaXMuYWxsb3dIYWxmVHJpY2tsZXx8KGUuc2RwPW4oZS5zZHApKSxlLnNkcD10aGlzLnNkcFRyYW5zZm9ybShlLnNkcCk7Y29uc3QgdD0oKT0+e2lmKCF0aGlzLmRlc3Ryb3llZCl7Y29uc3QgdD10aGlzLl9wYy5sb2NhbERlc2NyaXB0aW9ufHxlO3RoaXMuX2RlYnVnKFwic2lnbmFsXCIpLHRoaXMuZW1pdChcInNpZ25hbFwiLHt0eXBlOnQudHlwZSxzZHA6dC5zZHB9KX19O3RoaXMuX3BjLnNldExvY2FsRGVzY3JpcHRpb24oZSkudGhlbigoKT0+e3RoaXMuX2RlYnVnKFwiY3JlYXRlT2ZmZXIgc3VjY2Vzc1wiKSx0aGlzLmRlc3Ryb3llZHx8KHRoaXMudHJpY2tsZXx8dGhpcy5faWNlQ29tcGxldGU/dCgpOnRoaXMub25jZShcIl9pY2VDb21wbGV0ZVwiLHQpKX0pLmNhdGNoKGU9Pnt0aGlzLmRlc3Ryb3kobChlLFwiRVJSX1NFVF9MT0NBTF9ERVNDUklQVElPTlwiKSl9KX0pLmNhdGNoKGU9Pnt0aGlzLmRlc3Ryb3kobChlLFwiRVJSX0NSRUFURV9PRkZFUlwiKSl9KX1fcmVxdWVzdE1pc3NpbmdUcmFuc2NlaXZlcnMoKXt0aGlzLl9wYy5nZXRUcmFuc2NlaXZlcnMmJnRoaXMuX3BjLmdldFRyYW5zY2VpdmVycygpLmZvckVhY2goZT0+e2UubWlkfHwhZS5zZW5kZXIudHJhY2t8fGUucmVxdWVzdGVkfHwoZS5yZXF1ZXN0ZWQ9ITAsdGhpcy5hZGRUcmFuc2NlaXZlcihlLnNlbmRlci50cmFjay5raW5kKSl9KX1fY3JlYXRlQW5zd2VyKCl7dGhpcy5kZXN0cm95ZWR8fHRoaXMuX3BjLmNyZWF0ZUFuc3dlcih0aGlzLmFuc3dlck9wdGlvbnMpLnRoZW4oZT0+e2lmKHRoaXMuZGVzdHJveWVkKXJldHVybjt0aGlzLnRyaWNrbGV8fHRoaXMuYWxsb3dIYWxmVHJpY2tsZXx8KGUuc2RwPW4oZS5zZHApKSxlLnNkcD10aGlzLnNkcFRyYW5zZm9ybShlLnNkcCk7Y29uc3QgdD0oKT0+e2lmKCF0aGlzLmRlc3Ryb3llZCl7Y29uc3QgdD10aGlzLl9wYy5sb2NhbERlc2NyaXB0aW9ufHxlO3RoaXMuX2RlYnVnKFwic2lnbmFsXCIpLHRoaXMuZW1pdChcInNpZ25hbFwiLHt0eXBlOnQudHlwZSxzZHA6dC5zZHB9KSx0aGlzLmluaXRpYXRvcnx8dGhpcy5fcmVxdWVzdE1pc3NpbmdUcmFuc2NlaXZlcnMoKX19O3RoaXMuX3BjLnNldExvY2FsRGVzY3JpcHRpb24oZSkudGhlbigoKT0+e3RoaXMuZGVzdHJveWVkfHwodGhpcy50cmlja2xlfHx0aGlzLl9pY2VDb21wbGV0ZT90KCk6dGhpcy5vbmNlKFwiX2ljZUNvbXBsZXRlXCIsdCkpfSkuY2F0Y2goZT0+e3RoaXMuZGVzdHJveShsKGUsXCJFUlJfU0VUX0xPQ0FMX0RFU0NSSVBUSU9OXCIpKX0pfSkuY2F0Y2goZT0+e3RoaXMuZGVzdHJveShsKGUsXCJFUlJfQ1JFQVRFX0FOU1dFUlwiKSl9KX1fb25Db25uZWN0aW9uU3RhdGVDaGFuZ2UoKXt0aGlzLmRlc3Ryb3llZHx8XCJmYWlsZWRcIj09PXRoaXMuX3BjLmNvbm5lY3Rpb25TdGF0ZSYmdGhpcy5kZXN0cm95KGwobmV3IEVycm9yKFwiQ29ubmVjdGlvbiBmYWlsZWQuXCIpLFwiRVJSX0NPTk5FQ1RJT05fRkFJTFVSRVwiKSl9X29uSWNlU3RhdGVDaGFuZ2UoKXtpZih0aGlzLmRlc3Ryb3llZClyZXR1cm47Y29uc3QgZT10aGlzLl9wYy5pY2VDb25uZWN0aW9uU3RhdGUsdD10aGlzLl9wYy5pY2VHYXRoZXJpbmdTdGF0ZTt0aGlzLl9kZWJ1ZyhcImljZVN0YXRlQ2hhbmdlIChjb25uZWN0aW9uOiAlcykgKGdhdGhlcmluZzogJXMpXCIsZSx0KSx0aGlzLmVtaXQoXCJpY2VTdGF0ZUNoYW5nZVwiLGUsdCksKFwiY29ubmVjdGVkXCI9PT1lfHxcImNvbXBsZXRlZFwiPT09ZSkmJih0aGlzLl9wY1JlYWR5PSEwLHRoaXMuX21heWJlUmVhZHkoKSksXCJmYWlsZWRcIj09PWUmJnRoaXMuZGVzdHJveShsKG5ldyBFcnJvcihcIkljZSBjb25uZWN0aW9uIGZhaWxlZC5cIiksXCJFUlJfSUNFX0NPTk5FQ1RJT05fRkFJTFVSRVwiKSksXCJjbG9zZWRcIj09PWUmJnRoaXMuZGVzdHJveShsKG5ldyBFcnJvcihcIkljZSBjb25uZWN0aW9uIGNsb3NlZC5cIiksXCJFUlJfSUNFX0NPTk5FQ1RJT05fQ0xPU0VEXCIpKX1nZXRTdGF0cyhlKXtjb25zdCB0PWU9PihcIltvYmplY3QgQXJyYXldXCI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZS52YWx1ZXMpJiZlLnZhbHVlcy5mb3JFYWNoKHQ9PntPYmplY3QuYXNzaWduKGUsdCl9KSxlKTswPT09dGhpcy5fcGMuZ2V0U3RhdHMubGVuZ3RofHx0aGlzLl9pc1JlYWN0TmF0aXZlV2VicnRjP3RoaXMuX3BjLmdldFN0YXRzKCkudGhlbihuPT57Y29uc3Qgcj1bXTtuLmZvckVhY2goZT0+e3IucHVzaCh0KGUpKX0pLGUobnVsbCxyKX0sdD0+ZSh0KSk6MDx0aGlzLl9wYy5nZXRTdGF0cy5sZW5ndGg/dGhpcy5fcGMuZ2V0U3RhdHMobj0+e2lmKHRoaXMuZGVzdHJveWVkKXJldHVybjtjb25zdCByPVtdO24ucmVzdWx0KCkuZm9yRWFjaChlPT57Y29uc3Qgbj17fTtlLm5hbWVzKCkuZm9yRWFjaCh0PT57blt0XT1lLnN0YXQodCl9KSxuLmlkPWUuaWQsbi50eXBlPWUudHlwZSxuLnRpbWVzdGFtcD1lLnRpbWVzdGFtcCxyLnB1c2godChuKSl9KSxlKG51bGwscil9LHQ9PmUodCkpOmUobnVsbCxbXSl9X21heWJlUmVhZHkoKXtpZih0aGlzLl9kZWJ1ZyhcIm1heWJlUmVhZHkgcGMgJXMgY2hhbm5lbCAlc1wiLHRoaXMuX3BjUmVhZHksdGhpcy5fY2hhbm5lbFJlYWR5KSx0aGlzLl9jb25uZWN0ZWR8fHRoaXMuX2Nvbm5lY3Rpbmd8fCF0aGlzLl9wY1JlYWR5fHwhdGhpcy5fY2hhbm5lbFJlYWR5KXJldHVybjt0aGlzLl9jb25uZWN0aW5nPSEwO2NvbnN0IGU9KCk9Pnt0aGlzLmRlc3Ryb3llZHx8dGhpcy5nZXRTdGF0cygodCxuKT0+e2lmKHRoaXMuZGVzdHJveWVkKXJldHVybjt0JiYobj1bXSk7Y29uc3Qgcj17fSxhPXt9LG89e307bGV0IGk9ITE7bi5mb3JFYWNoKGU9PnsoXCJyZW1vdGVjYW5kaWRhdGVcIj09PWUudHlwZXx8XCJyZW1vdGUtY2FuZGlkYXRlXCI9PT1lLnR5cGUpJiYocltlLmlkXT1lKSwoXCJsb2NhbGNhbmRpZGF0ZVwiPT09ZS50eXBlfHxcImxvY2FsLWNhbmRpZGF0ZVwiPT09ZS50eXBlKSYmKGFbZS5pZF09ZSksKFwiY2FuZGlkYXRlcGFpclwiPT09ZS50eXBlfHxcImNhbmRpZGF0ZS1wYWlyXCI9PT1lLnR5cGUpJiYob1tlLmlkXT1lKX0pO2NvbnN0IGQ9ZT0+e2k9ITA7bGV0IHQ9YVtlLmxvY2FsQ2FuZGlkYXRlSWRdO3QmJih0LmlwfHx0LmFkZHJlc3MpPyh0aGlzLmxvY2FsQWRkcmVzcz10LmlwfHx0LmFkZHJlc3MsdGhpcy5sb2NhbFBvcnQ9K3QucG9ydCk6dCYmdC5pcEFkZHJlc3M/KHRoaXMubG9jYWxBZGRyZXNzPXQuaXBBZGRyZXNzLHRoaXMubG9jYWxQb3J0PSt0LnBvcnROdW1iZXIpOlwic3RyaW5nXCI9PXR5cGVvZiBlLmdvb2dMb2NhbEFkZHJlc3MmJih0PWUuZ29vZ0xvY2FsQWRkcmVzcy5zcGxpdChcIjpcIiksdGhpcy5sb2NhbEFkZHJlc3M9dFswXSx0aGlzLmxvY2FsUG9ydD0rdFsxXSksdGhpcy5sb2NhbEFkZHJlc3MmJih0aGlzLmxvY2FsRmFtaWx5PXRoaXMubG9jYWxBZGRyZXNzLmluY2x1ZGVzKFwiOlwiKT9cIklQdjZcIjpcIklQdjRcIik7bGV0IG49cltlLnJlbW90ZUNhbmRpZGF0ZUlkXTtuJiYobi5pcHx8bi5hZGRyZXNzKT8odGhpcy5yZW1vdGVBZGRyZXNzPW4uaXB8fG4uYWRkcmVzcyx0aGlzLnJlbW90ZVBvcnQ9K24ucG9ydCk6biYmbi5pcEFkZHJlc3M/KHRoaXMucmVtb3RlQWRkcmVzcz1uLmlwQWRkcmVzcyx0aGlzLnJlbW90ZVBvcnQ9K24ucG9ydE51bWJlcik6XCJzdHJpbmdcIj09dHlwZW9mIGUuZ29vZ1JlbW90ZUFkZHJlc3MmJihuPWUuZ29vZ1JlbW90ZUFkZHJlc3Muc3BsaXQoXCI6XCIpLHRoaXMucmVtb3RlQWRkcmVzcz1uWzBdLHRoaXMucmVtb3RlUG9ydD0rblsxXSksdGhpcy5yZW1vdGVBZGRyZXNzJiYodGhpcy5yZW1vdGVGYW1pbHk9dGhpcy5yZW1vdGVBZGRyZXNzLmluY2x1ZGVzKFwiOlwiKT9cIklQdjZcIjpcIklQdjRcIiksdGhpcy5fZGVidWcoXCJjb25uZWN0IGxvY2FsOiAlczolcyByZW1vdGU6ICVzOiVzXCIsdGhpcy5sb2NhbEFkZHJlc3MsdGhpcy5sb2NhbFBvcnQsdGhpcy5yZW1vdGVBZGRyZXNzLHRoaXMucmVtb3RlUG9ydCl9O2lmKG4uZm9yRWFjaChlPT57XCJ0cmFuc3BvcnRcIj09PWUudHlwZSYmZS5zZWxlY3RlZENhbmRpZGF0ZVBhaXJJZCYmZChvW2Uuc2VsZWN0ZWRDYW5kaWRhdGVQYWlySWRdKSwoXCJnb29nQ2FuZGlkYXRlUGFpclwiPT09ZS50eXBlJiZcInRydWVcIj09PWUuZ29vZ0FjdGl2ZUNvbm5lY3Rpb258fChcImNhbmRpZGF0ZXBhaXJcIj09PWUudHlwZXx8XCJjYW5kaWRhdGUtcGFpclwiPT09ZS50eXBlKSYmZS5zZWxlY3RlZCkmJmQoZSl9KSwhaSYmKCFPYmplY3Qua2V5cyhvKS5sZW5ndGh8fE9iamVjdC5rZXlzKGEpLmxlbmd0aCkpcmV0dXJuIHZvaWQgc2V0VGltZW91dChlLDEwMCk7aWYodGhpcy5fY29ubmVjdGluZz0hMSx0aGlzLl9jb25uZWN0ZWQ9ITAsdGhpcy5fY2h1bmspe3RyeXt0aGlzLnNlbmQodGhpcy5fY2h1bmspfWNhdGNoKGUpe3JldHVybiB0aGlzLmRlc3Ryb3kobChlLFwiRVJSX0RBVEFfQ0hBTk5FTFwiKSl9dGhpcy5fY2h1bms9bnVsbCx0aGlzLl9kZWJ1ZyhcInNlbnQgY2h1bmsgZnJvbSBcXFwid3JpdGUgYmVmb3JlIGNvbm5lY3RcXFwiXCIpO2NvbnN0IGU9dGhpcy5fY2I7dGhpcy5fY2I9bnVsbCxlKG51bGwpfVwibnVtYmVyXCIhPXR5cGVvZiB0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50TG93VGhyZXNob2xkJiYodGhpcy5faW50ZXJ2YWw9c2V0SW50ZXJ2YWwoKCk9PnRoaXMuX29uSW50ZXJ2YWwoKSwxNTApLHRoaXMuX2ludGVydmFsLnVucmVmJiZ0aGlzLl9pbnRlcnZhbC51bnJlZigpKSx0aGlzLl9kZWJ1ZyhcImNvbm5lY3RcIiksdGhpcy5lbWl0KFwiY29ubmVjdFwiKX0pfTtlKCl9X29uSW50ZXJ2YWwoKXt0aGlzLl9jYiYmdGhpcy5fY2hhbm5lbCYmISh0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50PnUpJiZ0aGlzLl9vbkNoYW5uZWxCdWZmZXJlZEFtb3VudExvdygpfV9vblNpZ25hbGluZ1N0YXRlQ2hhbmdlKCl7dGhpcy5kZXN0cm95ZWR8fChcInN0YWJsZVwiPT09dGhpcy5fcGMuc2lnbmFsaW5nU3RhdGUmJih0aGlzLl9pc05lZ290aWF0aW5nPSExLHRoaXMuX2RlYnVnKFwiZmx1c2hpbmcgc2VuZGVyIHF1ZXVlXCIsdGhpcy5fc2VuZGVyc0F3YWl0aW5nU3RhYmxlKSx0aGlzLl9zZW5kZXJzQXdhaXRpbmdTdGFibGUuZm9yRWFjaChlPT57dGhpcy5fcGMucmVtb3ZlVHJhY2soZSksdGhpcy5fcXVldWVkTmVnb3RpYXRpb249ITB9KSx0aGlzLl9zZW5kZXJzQXdhaXRpbmdTdGFibGU9W10sdGhpcy5fcXVldWVkTmVnb3RpYXRpb24/KHRoaXMuX2RlYnVnKFwiZmx1c2hpbmcgbmVnb3RpYXRpb24gcXVldWVcIiksdGhpcy5fcXVldWVkTmVnb3RpYXRpb249ITEsdGhpcy5fbmVlZHNOZWdvdGlhdGlvbigpKToodGhpcy5fZGVidWcoXCJuZWdvdGlhdGVkXCIpLHRoaXMuZW1pdChcIm5lZ290aWF0ZWRcIikpKSx0aGlzLl9kZWJ1ZyhcInNpZ25hbGluZ1N0YXRlQ2hhbmdlICVzXCIsdGhpcy5fcGMuc2lnbmFsaW5nU3RhdGUpLHRoaXMuZW1pdChcInNpZ25hbGluZ1N0YXRlQ2hhbmdlXCIsdGhpcy5fcGMuc2lnbmFsaW5nU3RhdGUpKX1fb25JY2VDYW5kaWRhdGUoZSl7dGhpcy5kZXN0cm95ZWR8fChlLmNhbmRpZGF0ZSYmdGhpcy50cmlja2xlP3RoaXMuZW1pdChcInNpZ25hbFwiLHt0eXBlOlwiY2FuZGlkYXRlXCIsY2FuZGlkYXRlOntjYW5kaWRhdGU6ZS5jYW5kaWRhdGUuY2FuZGlkYXRlLHNkcE1MaW5lSW5kZXg6ZS5jYW5kaWRhdGUuc2RwTUxpbmVJbmRleCxzZHBNaWQ6ZS5jYW5kaWRhdGUuc2RwTWlkfX0pOiFlLmNhbmRpZGF0ZSYmIXRoaXMuX2ljZUNvbXBsZXRlJiYodGhpcy5faWNlQ29tcGxldGU9ITAsdGhpcy5lbWl0KFwiX2ljZUNvbXBsZXRlXCIpKSxlLmNhbmRpZGF0ZSYmdGhpcy5fc3RhcnRJY2VDb21wbGV0ZVRpbWVvdXQoKSl9X29uQ2hhbm5lbE1lc3NhZ2UoZSl7aWYodGhpcy5kZXN0cm95ZWQpcmV0dXJuO2xldCB0PWUuZGF0YTt0IGluc3RhbmNlb2YgQXJyYXlCdWZmZXImJih0PWMuZnJvbSh0KSksdGhpcy5wdXNoKHQpfV9vbkNoYW5uZWxCdWZmZXJlZEFtb3VudExvdygpe2lmKCF0aGlzLmRlc3Ryb3llZCYmdGhpcy5fY2Ipe3RoaXMuX2RlYnVnKFwiZW5kaW5nIGJhY2twcmVzc3VyZTogYnVmZmVyZWRBbW91bnQgJWRcIix0aGlzLl9jaGFubmVsLmJ1ZmZlcmVkQW1vdW50KTtjb25zdCBlPXRoaXMuX2NiO3RoaXMuX2NiPW51bGwsZShudWxsKX19X29uQ2hhbm5lbE9wZW4oKXt0aGlzLl9jb25uZWN0ZWR8fHRoaXMuZGVzdHJveWVkfHwodGhpcy5fZGVidWcoXCJvbiBjaGFubmVsIG9wZW5cIiksdGhpcy5fY2hhbm5lbFJlYWR5PSEwLHRoaXMuX21heWJlUmVhZHkoKSl9X29uQ2hhbm5lbENsb3NlKCl7dGhpcy5kZXN0cm95ZWR8fCh0aGlzLl9kZWJ1ZyhcIm9uIGNoYW5uZWwgY2xvc2VcIiksdGhpcy5kZXN0cm95KCkpfV9vblRyYWNrKGUpe3RoaXMuZGVzdHJveWVkfHxlLnN0cmVhbXMuZm9yRWFjaCh0PT57dGhpcy5fZGVidWcoXCJvbiB0cmFja1wiKSx0aGlzLmVtaXQoXCJ0cmFja1wiLGUudHJhY2ssdCksdGhpcy5fcmVtb3RlVHJhY2tzLnB1c2goe3RyYWNrOmUudHJhY2ssc3RyZWFtOnR9KSx0aGlzLl9yZW1vdGVTdHJlYW1zLnNvbWUoZT0+ZS5pZD09PXQuaWQpfHwodGhpcy5fcmVtb3RlU3RyZWFtcy5wdXNoKHQpLHMoKCk9Pnt0aGlzLl9kZWJ1ZyhcIm9uIHN0cmVhbVwiKSx0aGlzLmVtaXQoXCJzdHJlYW1cIix0KX0pKX0pfV9kZWJ1Zygpe2NvbnN0IGU9W10uc2xpY2UuY2FsbChhcmd1bWVudHMpO2VbMF09XCJbXCIrdGhpcy5faWQrXCJdIFwiK2VbMF0sYS5hcHBseShudWxsLGUpfX1wLldFQlJUQ19TVVBQT1JUPSEhbygpLHAuY29uZmlnPXtpY2VTZXJ2ZXJzOlt7dXJsczpbXCJzdHVuOnN0dW4ubC5nb29nbGUuY29tOjE5MzAyXCIsXCJzdHVuOmdsb2JhbC5zdHVuLnR3aWxpby5jb206MzQ3OFwiXX1dLHNkcFNlbWFudGljczpcInVuaWZpZWQtcGxhblwifSxwLmNoYW5uZWxDb25maWc9e30sdC5leHBvcnRzPXB9LHtidWZmZXI6MyxkZWJ1Zzo0LFwiZXJyLWNvZGVcIjo2LFwiZ2V0LWJyb3dzZXItcnRjXCI6OCxcInF1ZXVlLW1pY3JvdGFza1wiOjEzLHJhbmRvbWJ5dGVzOjE0LFwicmVhZGFibGUtc3RyZWFtXCI6Mjl9XX0se30sW10pKFwiL1wiKX0pOyIsICIvKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCBrZXktdmFsdWUgc3RvcmVzLlxuICpcbiAqIEBtb2R1bGUgbWFwXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUgS1xuICogQHRlbXBsYXRlIFZcbiAqIEB0eXBlZGVmIHtNYXA8SyxWPn0gR2xvYmFsTWFwXG4gKi9cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IE1hcCBpbnN0YW5jZS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEByZXR1cm4ge01hcDxhbnksIGFueT59XG4gKlxuICogQGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGUgPSAoKSA9PiBuZXcgTWFwKClcblxuLyoqXG4gKiBDb3B5IGEgTWFwIG9iamVjdCBpbnRvIGEgZnJlc2ggTWFwIG9iamVjdC5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSBLLFZcbiAqIEBwYXJhbSB7TWFwPEssVj59IG1cbiAqIEByZXR1cm4ge01hcDxLLFY+fVxuICovXG5leHBvcnQgY29uc3QgY29weSA9IG0gPT4ge1xuICBjb25zdCByID0gY3JlYXRlKClcbiAgbS5mb3JFYWNoKCh2LCBrKSA9PiB7IHIuc2V0KGssIHYpIH0pXG4gIHJldHVybiByXG59XG5cbi8qKlxuICogR2V0IG1hcCBwcm9wZXJ0eS4gQ3JlYXRlIFQgaWYgcHJvcGVydHkgaXMgdW5kZWZpbmVkIGFuZCBzZXQgVCBvbiBtYXAuXG4gKlxuICogYGBganNcbiAqIGNvbnN0IGxpc3RlbmVycyA9IG1hcC5zZXRJZlVuZGVmaW5lZChldmVudHMsICdldmVudE5hbWUnLCBzZXQuY3JlYXRlKVxuICogbGlzdGVuZXJzLmFkZChsaXN0ZW5lcilcbiAqIGBgYFxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIHtNYXA8YW55LCBhbnk+fSBNQVBcbiAqIEB0ZW1wbGF0ZSB7TUFQIGV4dGVuZHMgTWFwPGFueSxpbmZlciBWPiA/IGZ1bmN0aW9uKCk6ViA6IHVua25vd259IENGXG4gKiBAcGFyYW0ge01BUH0gbWFwXG4gKiBAcGFyYW0ge01BUCBleHRlbmRzIE1hcDxpbmZlciBLLGFueT4gPyBLIDogdW5rbm93bn0ga2V5XG4gKiBAcGFyYW0ge0NGfSBjcmVhdGVUXG4gKiBAcmV0dXJuIHtSZXR1cm5UeXBlPENGPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHNldElmVW5kZWZpbmVkID0gKG1hcCwga2V5LCBjcmVhdGVUKSA9PiB7XG4gIGxldCBzZXQgPSBtYXAuZ2V0KGtleSlcbiAgaWYgKHNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbWFwLnNldChrZXksIHNldCA9IGNyZWF0ZVQoKSlcbiAgfVxuICByZXR1cm4gc2V0XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBBcnJheSBhbmQgcG9wdWxhdGVzIGl0IHdpdGggdGhlIGNvbnRlbnQgb2YgYWxsIGtleS12YWx1ZSBwYWlycyB1c2luZyB0aGUgYGYodmFsdWUsIGtleSlgIGZ1bmN0aW9uLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIEtcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAdGVtcGxhdGUgUlxuICogQHBhcmFtIHtNYXA8SyxWPn0gbVxuICogQHBhcmFtIHtmdW5jdGlvbihWLEspOlJ9IGZcbiAqIEByZXR1cm4ge0FycmF5PFI+fVxuICovXG5leHBvcnQgY29uc3QgbWFwID0gKG0sIGYpID0+IHtcbiAgY29uc3QgcmVzID0gW11cbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgbSkge1xuICAgIHJlcy5wdXNoKGYodmFsdWUsIGtleSkpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG4vKipcbiAqIFRlc3RzIHdoZXRoZXIgYW55IGtleS12YWx1ZSBwYWlycyBwYXNzIHRoZSB0ZXN0IGltcGxlbWVudGVkIGJ5IGBmKHZhbHVlLCBrZXkpYC5cbiAqXG4gKiBAdG9kbyBzaG91bGQgcmVuYW1lIHRvIHNvbWUgLSBzaW1pbGFybHkgdG8gQXJyYXkuc29tZVxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIEtcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge01hcDxLLFY+fSBtXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFYsSyk6Ym9vbGVhbn0gZlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGFueSA9IChtLCBmKSA9PiB7XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIG0pIHtcbiAgICBpZiAoZih2YWx1ZSwga2V5KSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogVGVzdHMgd2hldGhlciBhbGwga2V5LXZhbHVlIHBhaXJzIHBhc3MgdGhlIHRlc3QgaW1wbGVtZW50ZWQgYnkgYGYodmFsdWUsIGtleSlgLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIEtcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAcGFyYW0ge01hcDxLLFY+fSBtXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFYsSyk6Ym9vbGVhbn0gZlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGFsbCA9IChtLCBmKSA9PiB7XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIG0pIHtcbiAgICBpZiAoIWYodmFsdWUsIGtleSkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8qKlxuICogVXRpbGl0eSBtb2R1bGUgdG8gd29yayB3aXRoIHNldHMuXG4gKlxuICogQG1vZHVsZSBzZXRcbiAqL1xuXG5leHBvcnQgY29uc3QgY3JlYXRlID0gKCkgPT4gbmV3IFNldCgpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7U2V0PFQ+fSBzZXRcbiAqIEByZXR1cm4ge0FycmF5PFQ+fVxuICovXG5leHBvcnQgY29uc3QgdG9BcnJheSA9IHNldCA9PiBBcnJheS5mcm9tKHNldClcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtTZXQ8VD59IHNldFxuICogQHJldHVybiB7VHx1bmRlZmluZWR9XG4gKi9cbmV4cG9ydCBjb25zdCBmaXJzdCA9IHNldCA9PiBzZXQudmFsdWVzKCkubmV4dCgpLnZhbHVlXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7SXRlcmFibGU8VD59IGVudHJpZXNcbiAqIEByZXR1cm4ge1NldDxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGZyb20gPSBlbnRyaWVzID0+IG5ldyBTZXQoZW50cmllcylcbiIsICIvKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCBBcnJheXMuXG4gKlxuICogQG1vZHVsZSBhcnJheVxuICovXG5cbmltcG9ydCAqIGFzIHNldCBmcm9tICcuL3NldC5qcydcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gVGhlIGVsZW1lbnQgbXVzdCBleGlzdFxuICpcbiAqIEB0ZW1wbGF0ZSBMXG4gKiBAcGFyYW0ge0FycmF5TGlrZTxMPn0gYXJyXG4gKiBAcmV0dXJuIHtMfVxuICovXG5leHBvcnQgY29uc3QgbGFzdCA9IGFyciA9PiBhcnJbYXJyLmxlbmd0aCAtIDFdXG5cbi8qKlxuICogQHRlbXBsYXRlIENcbiAqIEByZXR1cm4ge0FycmF5PEM+fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gKCkgPT4gLyoqIEB0eXBlIHtBcnJheTxDPn0gKi8gKFtdKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBEXG4gKiBAcGFyYW0ge0FycmF5PEQ+fSBhXG4gKiBAcmV0dXJuIHtBcnJheTxEPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNvcHkgPSBhID0+IC8qKiBAdHlwZSB7QXJyYXk8RD59ICovIChhLnNsaWNlKCkpXG5cbi8qKlxuICogQXBwZW5kIGVsZW1lbnRzIGZyb20gc3JjIHRvIGRlc3RcbiAqXG4gKiBAdGVtcGxhdGUgTVxuICogQHBhcmFtIHtBcnJheTxNPn0gZGVzdFxuICogQHBhcmFtIHtBcnJheTxNPn0gc3JjXG4gKi9cbmV4cG9ydCBjb25zdCBhcHBlbmRUbyA9IChkZXN0LCBzcmMpID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcmMubGVuZ3RoOyBpKyspIHtcbiAgICBkZXN0LnB1c2goc3JjW2ldKVxuICB9XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBzb21ldGhpbmcgYXJyYXktbGlrZSB0byBhbiBhY3R1YWwgQXJyYXkuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtBcnJheUxpa2U8VD58SXRlcmFibGU8VD59IGFycmF5bGlrZVxuICogQHJldHVybiB7VH1cbiAqL1xuZXhwb3J0IGNvbnN0IGZyb20gPSBBcnJheS5mcm9tXG5cbi8qKlxuICogVHJ1ZSBpZmYgY29uZGl0aW9uIGhvbGRzIG9uIGV2ZXJ5IGVsZW1lbnQgaW4gdGhlIEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIHtBcnJheUxpa2U8YW55Pn0gQVJSXG4gKlxuICogQHBhcmFtIHtBUlJ9IGFyclxuICogQHBhcmFtIHtBUlIgZXh0ZW5kcyBBcnJheUxpa2U8aW5mZXIgUz4gPyAoKHZhbHVlOlMsIGluZGV4Om51bWJlciwgYXJyOkFSUikgPT4gYm9vbGVhbikgOiBhbnl9IGZcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBldmVyeSA9IChhcnIsIGYpID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIWYoYXJyW2ldLCBpLCBhcnIpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBUcnVlIGlmZiBjb25kaXRpb24gaG9sZHMgb24gc29tZSBlbGVtZW50IGluIHRoZSBBcnJheS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSB7QXJyYXlMaWtlPGFueT59IEFSUlxuICpcbiAqIEBwYXJhbSB7QVJSfSBhcnJcbiAqIEBwYXJhbSB7QVJSIGV4dGVuZHMgQXJyYXlMaWtlPGluZmVyIFM+ID8gKCh2YWx1ZTpTLCBpbmRleDpudW1iZXIsIGFycjpBUlIpID0+IGJvb2xlYW4pIDogbmV2ZXJ9IGZcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBzb21lID0gKGFyciwgZikgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChmKGFycltpXSwgaSwgYXJyKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogQHRlbXBsYXRlIEVMRU1cbiAqXG4gKiBAcGFyYW0ge0FycmF5TGlrZTxFTEVNPn0gYVxuICogQHBhcmFtIHtBcnJheUxpa2U8RUxFTT59IGJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBlcXVhbEZsYXQgPSAoYSwgYikgPT4gYS5sZW5ndGggPT09IGIubGVuZ3RoICYmIGV2ZXJ5KGEsIChpdGVtLCBpbmRleCkgPT4gaXRlbSA9PT0gYltpbmRleF0pXG5cbi8qKlxuICogQHRlbXBsYXRlIEVMRU1cbiAqIEBwYXJhbSB7QXJyYXk8QXJyYXk8RUxFTT4+fSBhcnJcbiAqIEByZXR1cm4ge0FycmF5PEVMRU0+fVxuICovXG5leHBvcnQgY29uc3QgZmxhdHRlbiA9IGFyciA9PiBmb2xkKGFyciwgLyoqIEB0eXBlIHtBcnJheTxFTEVNPn0gKi8gKFtdKSwgKGFjYywgdmFsKSA9PiBhY2MuY29uY2F0KHZhbCkpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24obnVtYmVyLCBBcnJheTxUPik6VH0gZlxuICogQHJldHVybiB7QXJyYXk8VD59XG4gKi9cbmV4cG9ydCBjb25zdCB1bmZvbGQgPSAobGVuLCBmKSA9PiB7XG4gIGNvbnN0IGFycmF5ID0gbmV3IEFycmF5KGxlbilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGFycmF5W2ldID0gZihpLCBhcnJheSlcbiAgfVxuICByZXR1cm4gYXJyYXlcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHRlbXBsYXRlIFJFU1VMVFxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyXG4gKiBAcGFyYW0ge1JFU1VMVH0gc2VlZFxuICogQHBhcmFtIHtmdW5jdGlvbihSRVNVTFQsIFQsIG51bWJlcik6UkVTVUxUfSBmb2xkZXJcbiAqL1xuZXhwb3J0IGNvbnN0IGZvbGQgPSAoYXJyLCBzZWVkLCBmb2xkZXIpID0+IGFyci5yZWR1Y2UoZm9sZGVyLCBzZWVkKVxuXG5leHBvcnQgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXlcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyXG4gKiBAcmV0dXJuIHtBcnJheTxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHVuaXF1ZSA9IGFyciA9PiBmcm9tKHNldC5mcm9tKGFycikpXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqIEB0ZW1wbGF0ZSBNXG4gKiBAcGFyYW0ge0FycmF5TGlrZTxUPn0gYXJyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFQpOk19IG1hcHBlclxuICogQHJldHVybiB7QXJyYXk8VD59XG4gKi9cbmV4cG9ydCBjb25zdCB1bmlxdWVCeSA9IChhcnIsIG1hcHBlcikgPT4ge1xuICAvKipcbiAgICogQHR5cGUge1NldDxNPn1cbiAgICovXG4gIGNvbnN0IGhhcHBlbmVkID0gc2V0LmNyZWF0ZSgpXG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXk8VD59XG4gICAqL1xuICBjb25zdCByZXN1bHQgPSBbXVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGVsID0gYXJyW2ldXG4gICAgY29uc3QgbWFwcGVkID0gbWFwcGVyKGVsKVxuICAgIGlmICghaGFwcGVuZWQuaGFzKG1hcHBlZCkpIHtcbiAgICAgIGhhcHBlbmVkLmFkZChtYXBwZWQpXG4gICAgICByZXN1bHQucHVzaChlbClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7QXJyYXlMaWtlPGFueT59IEFSUlxuICogQHRlbXBsYXRlIHtmdW5jdGlvbihBUlIgZXh0ZW5kcyBBcnJheUxpa2U8aW5mZXIgVD4gPyBUIDogbmV2ZXIsIG51bWJlciwgQVJSKTphbnl9IE1BUFBFUlxuICogQHBhcmFtIHtBUlJ9IGFyclxuICogQHBhcmFtIHtNQVBQRVJ9IG1hcHBlclxuICogQHJldHVybiB7QXJyYXk8TUFQUEVSIGV4dGVuZHMgZnVuY3Rpb24oLi4uYW55KTogaW5mZXIgTSA/IE0gOiBuZXZlcj59XG4gKi9cbmV4cG9ydCBjb25zdCBtYXAgPSAoYXJyLCBtYXBwZXIpID0+IHtcbiAgLyoqXG4gICAqIEB0eXBlIHtBcnJheTxhbnk+fVxuICAgKi9cbiAgY29uc3QgcmVzID0gQXJyYXkoYXJyLmxlbmd0aClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICByZXNbaV0gPSBtYXBwZXIoLyoqIEB0eXBlIHthbnl9ICovIChhcnJbaV0pLCBpLCAvKiogQHR5cGUge2FueX0gKi8gKGFycikpXG4gIH1cbiAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAocmVzKVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gYnViYmxlLXNvcnRzIGEgc2luZ2xlIGl0ZW0gdG8gdGhlIGNvcnJlY3QgcG9zaXRpb24uIFRoZSBzb3J0IGhhcHBlbnMgaW4tcGxhY2UgYW5kXG4gKiBtaWdodCBiZSB1c2VmdWwgdG8gZW5zdXJlIHRoYXQgYSBzaW5nbGUgaXRlbSBpcyBhdCB0aGUgY29ycmVjdCBwb3NpdGlvbiBpbiBhbiBvdGhlcndpc2Ugc29ydGVkXG4gKiBhcnJheS5cbiAqXG4gKiBAZXhhbXBsZVxuICogIGNvbnN0IGFyciA9IFszLCAyLCA1XVxuICogIGFyci5zb3J0KChhLCBiKSA9PiBhIC0gYilcbiAqICBhcnIgLy8gPT4gWzIsIDMsIDVdXG4gKiAgYXJyLnNwbGljZSgxLCAwLCA3KVxuICogIGFycmF5LmJ1YmJsZVNvcnRJdGVtKGFyciwgMSwgKGEsIGIpID0+IGEgLSBiKVxuICogIGFyciAvLyA9PiBbMiwgMywgNSwgN11cbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtBcnJheTxUPn0gYXJyXG4gKiBAcGFyYW0ge251bWJlcn0gaVxuICogQHBhcmFtIHsoYTpULGI6VCkgPT4gbnVtYmVyfSBjb21wYXJlRm5cbiAqL1xuZXhwb3J0IGNvbnN0IGJ1YmJsZXNvcnRJdGVtID0gKGFyciwgaSwgY29tcGFyZUZuKSA9PiB7XG4gIGNvbnN0IG4gPSBhcnJbaV1cbiAgbGV0IGogPSBpXG4gIC8vIHRyeSB0byBzb3J0IHRvIHRoZSByaWdodFxuICB3aGlsZSAoaiArIDEgPCBhcnIubGVuZ3RoICYmIGNvbXBhcmVGbihuLCBhcnJbaiArIDFdKSA+IDApIHtcbiAgICBhcnJbal0gPSBhcnJbaiArIDFdXG4gICAgYXJyWysral0gPSBuXG4gIH1cbiAgaWYgKGkgPT09IGogJiYgaiA+IDApIHsgLy8gbm8gY2hhbmdlIHlldFxuICAgIC8vIHNvcnQgdG8gdGhlIGxlZnRcbiAgICB3aGlsZSAoaiA+IDAgJiYgY29tcGFyZUZuKGFycltqIC0gMV0sIG4pID4gMCkge1xuICAgICAgYXJyW2pdID0gYXJyW2ogLSAxXVxuICAgICAgYXJyWy0tal0gPSBuXG4gICAgfVxuICB9XG4gIHJldHVybiBqXG59XG4iLCAiLyoqXG4gKiBPYnNlcnZhYmxlIGNsYXNzIHByb3RvdHlwZS5cbiAqXG4gKiBAbW9kdWxlIG9ic2VydmFibGVcbiAqL1xuXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnLi9tYXAuanMnXG5pbXBvcnQgKiBhcyBzZXQgZnJvbSAnLi9zZXQuanMnXG5pbXBvcnQgKiBhcyBhcnJheSBmcm9tICcuL2FycmF5LmpzJ1xuXG4vKipcbiAqIEhhbmRsZXMgbmFtZWQgZXZlbnRzLlxuICogQGV4cGVyaW1lbnRhbFxuICpcbiAqIFRoaXMgaXMgYmFzaWNhbGx5IGEgKGJldHRlciB0eXBlZCkgZHVwbGljYXRlIG9mIE9ic2VydmFibGUsIHdoaWNoIHdpbGwgcmVwbGFjZSBPYnNlcnZhYmxlIGluIHRoZVxuICogbmV4dCByZWxlYXNlLlxuICpcbiAqIEB0ZW1wbGF0ZSB7e1trZXkgaW4ga2V5b2YgRVZFTlRTXTogZnVuY3Rpb24oLi4uYW55KTp2b2lkfX0gRVZFTlRTXG4gKi9cbmV4cG9ydCBjbGFzcyBPYnNlcnZhYmxlVjIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogU29tZSBkZXNjLlxuICAgICAqIEB0eXBlIHtNYXA8c3RyaW5nLCBTZXQ8YW55Pj59XG4gICAgICovXG4gICAgdGhpcy5fb2JzZXJ2ZXJzID0gbWFwLmNyZWF0ZSgpXG4gIH1cblxuICAvKipcbiAgICogQHRlbXBsYXRlIHtrZXlvZiBFVkVOVFMgJiBzdHJpbmd9IE5BTUVcbiAgICogQHBhcmFtIHtOQU1FfSBuYW1lXG4gICAqIEBwYXJhbSB7RVZFTlRTW05BTUVdfSBmXG4gICAqL1xuICBvbiAobmFtZSwgZikge1xuICAgIG1hcC5zZXRJZlVuZGVmaW5lZCh0aGlzLl9vYnNlcnZlcnMsIC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAobmFtZSksIHNldC5jcmVhdGUpLmFkZChmKVxuICAgIHJldHVybiBmXG4gIH1cblxuICAvKipcbiAgICogQHRlbXBsYXRlIHtrZXlvZiBFVkVOVFMgJiBzdHJpbmd9IE5BTUVcbiAgICogQHBhcmFtIHtOQU1FfSBuYW1lXG4gICAqIEBwYXJhbSB7RVZFTlRTW05BTUVdfSBmXG4gICAqL1xuICBvbmNlIChuYW1lLCBmKSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtICB7Li4uYW55fSBhcmdzXG4gICAgICovXG4gICAgY29uc3QgX2YgPSAoLi4uYXJncykgPT4ge1xuICAgICAgdGhpcy5vZmYobmFtZSwgLyoqIEB0eXBlIHthbnl9ICovIChfZikpXG4gICAgICBmKC4uLmFyZ3MpXG4gICAgfVxuICAgIHRoaXMub24obmFtZSwgLyoqIEB0eXBlIHthbnl9ICovIChfZikpXG4gIH1cblxuICAvKipcbiAgICogQHRlbXBsYXRlIHtrZXlvZiBFVkVOVFMgJiBzdHJpbmd9IE5BTUVcbiAgICogQHBhcmFtIHtOQU1FfSBuYW1lXG4gICAqIEBwYXJhbSB7RVZFTlRTW05BTUVdfSBmXG4gICAqL1xuICBvZmYgKG5hbWUsIGYpIHtcbiAgICBjb25zdCBvYnNlcnZlcnMgPSB0aGlzLl9vYnNlcnZlcnMuZ2V0KG5hbWUpXG4gICAgaWYgKG9ic2VydmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBvYnNlcnZlcnMuZGVsZXRlKGYpXG4gICAgICBpZiAob2JzZXJ2ZXJzLnNpemUgPT09IDApIHtcbiAgICAgICAgdGhpcy5fb2JzZXJ2ZXJzLmRlbGV0ZShuYW1lKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0IGEgbmFtZWQgZXZlbnQuIEFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycyB0aGF0IGxpc3RlbiB0byB0aGVcbiAgICogc3BlY2lmaWVkIG5hbWUgd2lsbCByZWNlaXZlIHRoZSBldmVudC5cbiAgICpcbiAgICogQHRvZG8gVGhpcyBzaG91bGQgY2F0Y2ggZXhjZXB0aW9uc1xuICAgKlxuICAgKiBAdGVtcGxhdGUge2tleW9mIEVWRU5UUyAmIHN0cmluZ30gTkFNRVxuICAgKiBAcGFyYW0ge05BTUV9IG5hbWUgVGhlIGV2ZW50IG5hbWUuXG4gICAqIEBwYXJhbSB7UGFyYW1ldGVyczxFVkVOVFNbTkFNRV0+fSBhcmdzIFRoZSBhcmd1bWVudHMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZXZlbnQgbGlzdGVuZXIuXG4gICAqL1xuICBlbWl0IChuYW1lLCBhcmdzKSB7XG4gICAgLy8gY29weSBhbGwgbGlzdGVuZXJzIHRvIGFuIGFycmF5IGZpcnN0IHRvIG1ha2Ugc3VyZSB0aGF0IG5vIGV2ZW50IGlzIGVtaXR0ZWQgdG8gbGlzdGVuZXJzIHRoYXQgYXJlIHN1YnNjcmliZWQgd2hpbGUgdGhlIGV2ZW50IGhhbmRsZXIgaXMgY2FsbGVkLlxuICAgIHJldHVybiBhcnJheS5mcm9tKCh0aGlzLl9vYnNlcnZlcnMuZ2V0KG5hbWUpIHx8IG1hcC5jcmVhdGUoKSkudmFsdWVzKCkpLmZvckVhY2goZiA9PiBmKC4uLmFyZ3MpKVxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgdGhpcy5fb2JzZXJ2ZXJzID0gbWFwLmNyZWF0ZSgpXG4gIH1cbn1cblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIEhhbmRsZXMgbmFtZWQgZXZlbnRzLlxuICpcbiAqIEBkZXByZWNhdGVkXG4gKiBAdGVtcGxhdGUgTlxuICovXG5leHBvcnQgY2xhc3MgT2JzZXJ2YWJsZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICAvKipcbiAgICAgKiBTb21lIGRlc2MuXG4gICAgICogQHR5cGUge01hcDxOLCBhbnk+fVxuICAgICAqL1xuICAgIHRoaXMuX29ic2VydmVycyA9IG1hcC5jcmVhdGUoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Tn0gbmFtZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmXG4gICAqL1xuICBvbiAobmFtZSwgZikge1xuICAgIG1hcC5zZXRJZlVuZGVmaW5lZCh0aGlzLl9vYnNlcnZlcnMsIG5hbWUsIHNldC5jcmVhdGUpLmFkZChmKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Tn0gbmFtZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmXG4gICAqL1xuICBvbmNlIChuYW1lLCBmKSB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtICB7Li4uYW55fSBhcmdzXG4gICAgICovXG4gICAgY29uc3QgX2YgPSAoLi4uYXJncykgPT4ge1xuICAgICAgdGhpcy5vZmYobmFtZSwgX2YpXG4gICAgICBmKC4uLmFyZ3MpXG4gICAgfVxuICAgIHRoaXMub24obmFtZSwgX2YpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtOfSBuYW1lXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGZcbiAgICovXG4gIG9mZiAobmFtZSwgZikge1xuICAgIGNvbnN0IG9ic2VydmVycyA9IHRoaXMuX29ic2VydmVycy5nZXQobmFtZSlcbiAgICBpZiAob2JzZXJ2ZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG9ic2VydmVycy5kZWxldGUoZilcbiAgICAgIGlmIChvYnNlcnZlcnMuc2l6ZSA9PT0gMCkge1xuICAgICAgICB0aGlzLl9vYnNlcnZlcnMuZGVsZXRlKG5hbWUpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEVtaXQgYSBuYW1lZCBldmVudC4gQWxsIHJlZ2lzdGVyZWQgZXZlbnQgbGlzdGVuZXJzIHRoYXQgbGlzdGVuIHRvIHRoZVxuICAgKiBzcGVjaWZpZWQgbmFtZSB3aWxsIHJlY2VpdmUgdGhlIGV2ZW50LlxuICAgKlxuICAgKiBAdG9kbyBUaGlzIHNob3VsZCBjYXRjaCBleGNlcHRpb25zXG4gICAqXG4gICAqIEBwYXJhbSB7Tn0gbmFtZSBUaGUgZXZlbnQgbmFtZS5cbiAgICogQHBhcmFtIHtBcnJheTxhbnk+fSBhcmdzIFRoZSBhcmd1bWVudHMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZXZlbnQgbGlzdGVuZXIuXG4gICAqL1xuICBlbWl0IChuYW1lLCBhcmdzKSB7XG4gICAgLy8gY29weSBhbGwgbGlzdGVuZXJzIHRvIGFuIGFycmF5IGZpcnN0IHRvIG1ha2Ugc3VyZSB0aGF0IG5vIGV2ZW50IGlzIGVtaXR0ZWQgdG8gbGlzdGVuZXJzIHRoYXQgYXJlIHN1YnNjcmliZWQgd2hpbGUgdGhlIGV2ZW50IGhhbmRsZXIgaXMgY2FsbGVkLlxuICAgIHJldHVybiBhcnJheS5mcm9tKCh0aGlzLl9vYnNlcnZlcnMuZ2V0KG5hbWUpIHx8IG1hcC5jcmVhdGUoKSkudmFsdWVzKCkpLmZvckVhY2goZiA9PiBmKC4uLmFyZ3MpKVxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgdGhpcy5fb2JzZXJ2ZXJzID0gbWFwLmNyZWF0ZSgpXG4gIH1cbn1cbi8qIGM4IGlnbm9yZSBlbmQgKi9cbiIsICIvKipcbiAqIENvbW1vbiBNYXRoIGV4cHJlc3Npb25zLlxuICpcbiAqIEBtb2R1bGUgbWF0aFxuICovXG5cbmV4cG9ydCBjb25zdCBmbG9vciA9IE1hdGguZmxvb3JcbmV4cG9ydCBjb25zdCBjZWlsID0gTWF0aC5jZWlsXG5leHBvcnQgY29uc3QgYWJzID0gTWF0aC5hYnNcbmV4cG9ydCBjb25zdCBpbXVsID0gTWF0aC5pbXVsXG5leHBvcnQgY29uc3Qgcm91bmQgPSBNYXRoLnJvdW5kXG5leHBvcnQgY29uc3QgbG9nMTAgPSBNYXRoLmxvZzEwXG5leHBvcnQgY29uc3QgbG9nMiA9IE1hdGgubG9nMlxuZXhwb3J0IGNvbnN0IGxvZyA9IE1hdGgubG9nXG5leHBvcnQgY29uc3Qgc3FydCA9IE1hdGguc3FydFxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtudW1iZXJ9IGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBiXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBzdW0gb2YgYSBhbmQgYlxuICovXG5leHBvcnQgY29uc3QgYWRkID0gKGEsIGIpID0+IGEgKyBiXG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gYVxuICogQHBhcmFtIHtudW1iZXJ9IGJcbiAqIEByZXR1cm4ge251bWJlcn0gVGhlIHNtYWxsZXIgZWxlbWVudCBvZiBhIGFuZCBiXG4gKi9cbmV4cG9ydCBjb25zdCBtaW4gPSAoYSwgYikgPT4gYSA8IGIgPyBhIDogYlxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtudW1iZXJ9IGFcbiAqIEBwYXJhbSB7bnVtYmVyfSBiXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBiaWdnZXIgZWxlbWVudCBvZiBhIGFuZCBiXG4gKi9cbmV4cG9ydCBjb25zdCBtYXggPSAoYSwgYikgPT4gYSA+IGIgPyBhIDogYlxuXG5leHBvcnQgY29uc3QgaXNOYU4gPSBOdW1iZXIuaXNOYU5cblxuZXhwb3J0IGNvbnN0IHBvdyA9IE1hdGgucG93XG4vKipcbiAqIEJhc2UgMTAgZXhwb25lbnRpYWwgZnVuY3Rpb24uIFJldHVybnMgdGhlIHZhbHVlIG9mIDEwIHJhaXNlZCB0byB0aGUgcG93ZXIgb2YgcG93LlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBleHBcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IGV4cDEwID0gZXhwID0+IE1hdGgucG93KDEwLCBleHApXG5cbmV4cG9ydCBjb25zdCBzaWduID0gTWF0aC5zaWduXG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBuIGlzIG5lZ2F0aXZlLCB3aGlsZSBjb25zaWRlcmluZyB0aGUgLTAgZWRnZSBjYXNlLiBXaGlsZSBgLTAgPCAwYCBpcyBmYWxzZSwgdGhpc1xuICogZnVuY3Rpb24gcmV0dXJucyB0cnVlIGZvciAtMCwtMSwsLi4gYW5kIHJldHVybnMgZmFsc2UgZm9yIDAsMSwyLC4uLlxuICogQHBhcmFtIHtudW1iZXJ9IG5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdldGhlciBuIGlzIG5lZ2F0aXZlLiBUaGlzIGZ1bmN0aW9uIGFsc28gZGlzdGluZ3Vpc2hlcyBiZXR3ZWVuIC0wIGFuZCArMFxuICovXG5leHBvcnQgY29uc3QgaXNOZWdhdGl2ZVplcm8gPSBuID0+IG4gIT09IDAgPyBuIDwgMCA6IDEgLyBuIDwgMFxuIiwgIi8qKlxuICogVXRpbGl0eSBtb2R1bGUgdG8gd29yayB3aXRoIHRpbWUuXG4gKlxuICogQG1vZHVsZSB0aW1lXG4gKi9cblxuaW1wb3J0ICogYXMgbWV0cmljIGZyb20gJy4vbWV0cmljLmpzJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5cbi8qKlxuICogUmV0dXJuIGN1cnJlbnQgdGltZS5cbiAqXG4gKiBAcmV0dXJuIHtEYXRlfVxuICovXG5leHBvcnQgY29uc3QgZ2V0RGF0ZSA9ICgpID0+IG5ldyBEYXRlKClcblxuLyoqXG4gKiBSZXR1cm4gY3VycmVudCB1bml4IHRpbWUuXG4gKlxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgZ2V0VW5peFRpbWUgPSBEYXRlLm5vd1xuXG4vKipcbiAqIFRyYW5zZm9ybSB0aW1lIChpbiBtcykgdG8gYSBodW1hbiByZWFkYWJsZSBmb3JtYXQuIEUuZy4gMTEwMCA9PiAxLjFzLiA2MHMgPT4gMW1pbi4gLjAwMSA9PiAxMFx1MDNCQ3MuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGQgZHVyYXRpb24gaW4gbWlsbGlzZWNvbmRzXG4gKiBAcmV0dXJuIHtzdHJpbmd9IGh1bWFuaXplZCBhcHByb3hpbWF0aW9uIG9mIHRpbWVcbiAqL1xuZXhwb3J0IGNvbnN0IGh1bWFuaXplRHVyYXRpb24gPSBkID0+IHtcbiAgaWYgKGQgPCA2MDAwMCkge1xuICAgIGNvbnN0IHAgPSBtZXRyaWMucHJlZml4KGQsIC0xKVxuICAgIHJldHVybiBtYXRoLnJvdW5kKHAubiAqIDEwMCkgLyAxMDAgKyBwLnByZWZpeCArICdzJ1xuICB9XG4gIGQgPSBtYXRoLmZsb29yKGQgLyAxMDAwKVxuICBjb25zdCBzZWNvbmRzID0gZCAlIDYwXG4gIGNvbnN0IG1pbnV0ZXMgPSBtYXRoLmZsb29yKGQgLyA2MCkgJSA2MFxuICBjb25zdCBob3VycyA9IG1hdGguZmxvb3IoZCAvIDM2MDApICUgMjRcbiAgY29uc3QgZGF5cyA9IG1hdGguZmxvb3IoZCAvIDg2NDAwKVxuICBpZiAoZGF5cyA+IDApIHtcbiAgICByZXR1cm4gZGF5cyArICdkJyArICgoaG91cnMgPiAwIHx8IG1pbnV0ZXMgPiAzMCkgPyAnICcgKyAobWludXRlcyA+IDMwID8gaG91cnMgKyAxIDogaG91cnMpICsgJ2gnIDogJycpXG4gIH1cbiAgaWYgKGhvdXJzID4gMCkge1xuICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIGhvdXJzICsgJ2gnICsgKChtaW51dGVzID4gMCB8fCBzZWNvbmRzID4gMzApID8gJyAnICsgKHNlY29uZHMgPiAzMCA/IG1pbnV0ZXMgKyAxIDogbWludXRlcykgKyAnbWluJyA6ICcnKVxuICB9XG4gIHJldHVybiBtaW51dGVzICsgJ21pbicgKyAoc2Vjb25kcyA+IDAgPyAnICcgKyBzZWNvbmRzICsgJ3MnIDogJycpXG59XG4iLCAiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogVGlueSB3ZWJzb2NrZXQgY29ubmVjdGlvbiBoYW5kbGVyLlxuICpcbiAqIEltcGxlbWVudHMgZXhwb25lbnRpYWwgYmFja29mZiByZWNvbm5lY3RzLCBwaW5nL3BvbmcsIGFuZCBhIG5pY2UgZXZlbnQgc3lzdGVtIHVzaW5nIFtsaWIwL29ic2VydmFibGVdLlxuICpcbiAqIEBtb2R1bGUgd2Vic29ja2V0XG4gKi9cblxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJy4vb2JzZXJ2YWJsZS5qcydcbmltcG9ydCAqIGFzIHRpbWUgZnJvbSAnLi90aW1lLmpzJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5cbmNvbnN0IHJlY29ubmVjdFRpbWVvdXRCYXNlID0gMTIwMFxuY29uc3QgbWF4UmVjb25uZWN0VGltZW91dCA9IDI1MDBcbi8vIEB0b2RvIC0gdGhpcyBzaG91bGQgZGVwZW5kIG9uIGF3YXJlbmVzcy5vdXRkYXRlZFRpbWVcbmNvbnN0IG1lc3NhZ2VSZWNvbm5lY3RUaW1lb3V0ID0gMzAwMDBcblxuLyoqXG4gKiBAcGFyYW0ge1dlYnNvY2tldENsaWVudH0gd3NjbGllbnRcbiAqL1xuY29uc3Qgc2V0dXBXUyA9ICh3c2NsaWVudCkgPT4ge1xuICBpZiAod3NjbGllbnQuc2hvdWxkQ29ubmVjdCAmJiB3c2NsaWVudC53cyA9PT0gbnVsbCkge1xuICAgIGNvbnN0IHdlYnNvY2tldCA9IG5ldyBXZWJTb2NrZXQod3NjbGllbnQudXJsKVxuICAgIGNvbnN0IGJpbmFyeVR5cGUgPSB3c2NsaWVudC5iaW5hcnlUeXBlXG4gICAgLyoqXG4gICAgICogQHR5cGUge2FueX1cbiAgICAgKi9cbiAgICBsZXQgcGluZ1RpbWVvdXQgPSBudWxsXG4gICAgaWYgKGJpbmFyeVR5cGUpIHtcbiAgICAgIHdlYnNvY2tldC5iaW5hcnlUeXBlID0gYmluYXJ5VHlwZVxuICAgIH1cbiAgICB3c2NsaWVudC53cyA9IHdlYnNvY2tldFxuICAgIHdzY2xpZW50LmNvbm5lY3RpbmcgPSB0cnVlXG4gICAgd3NjbGllbnQuY29ubmVjdGVkID0gZmFsc2VcbiAgICB3ZWJzb2NrZXQub25tZXNzYWdlID0gZXZlbnQgPT4ge1xuICAgICAgd3NjbGllbnQubGFzdE1lc3NhZ2VSZWNlaXZlZCA9IHRpbWUuZ2V0VW5peFRpbWUoKVxuICAgICAgY29uc3QgZGF0YSA9IGV2ZW50LmRhdGFcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSB0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKGRhdGEpIDogZGF0YVxuICAgICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50eXBlID09PSAncG9uZycpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHBpbmdUaW1lb3V0KVxuICAgICAgICBwaW5nVGltZW91dCA9IHNldFRpbWVvdXQoc2VuZFBpbmcsIG1lc3NhZ2VSZWNvbm5lY3RUaW1lb3V0IC8gMilcbiAgICAgIH1cbiAgICAgIHdzY2xpZW50LmVtaXQoJ21lc3NhZ2UnLCBbbWVzc2FnZSwgd3NjbGllbnRdKVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2FueX0gZXJyb3JcbiAgICAgKi9cbiAgICBjb25zdCBvbmNsb3NlID0gZXJyb3IgPT4ge1xuICAgICAgaWYgKHdzY2xpZW50LndzICE9PSBudWxsKSB7XG4gICAgICAgIHdzY2xpZW50LndzID0gbnVsbFxuICAgICAgICB3c2NsaWVudC5jb25uZWN0aW5nID0gZmFsc2VcbiAgICAgICAgaWYgKHdzY2xpZW50LmNvbm5lY3RlZCkge1xuICAgICAgICAgIHdzY2xpZW50LmNvbm5lY3RlZCA9IGZhbHNlXG4gICAgICAgICAgd3NjbGllbnQuZW1pdCgnZGlzY29ubmVjdCcsIFt7IHR5cGU6ICdkaXNjb25uZWN0JywgZXJyb3IgfSwgd3NjbGllbnRdKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHdzY2xpZW50LnVuc3VjY2Vzc2Z1bFJlY29ubmVjdHMrK1xuICAgICAgICB9XG4gICAgICAgIC8vIFN0YXJ0IHdpdGggbm8gcmVjb25uZWN0IHRpbWVvdXQgYW5kIGluY3JlYXNlIHRpbWVvdXQgYnlcbiAgICAgICAgLy8gbG9nMTAod3NVbnN1Y2Nlc3NmdWxSZWNvbm5lY3RzKS5cbiAgICAgICAgLy8gVGhlIGlkZWEgaXMgdG8gaW5jcmVhc2UgcmVjb25uZWN0IHRpbWVvdXQgc2xvd2x5IGFuZCBoYXZlIG5vIHJlY29ubmVjdFxuICAgICAgICAvLyB0aW1lb3V0IGF0IHRoZSBiZWdpbm5pbmcgKGxvZygxKSA9IDApXG4gICAgICAgIHNldFRpbWVvdXQoc2V0dXBXUywgbWF0aC5taW4obWF0aC5sb2cxMCh3c2NsaWVudC51bnN1Y2Nlc3NmdWxSZWNvbm5lY3RzICsgMSkgKiByZWNvbm5lY3RUaW1lb3V0QmFzZSwgbWF4UmVjb25uZWN0VGltZW91dCksIHdzY2xpZW50KVxuICAgICAgfVxuICAgICAgY2xlYXJUaW1lb3V0KHBpbmdUaW1lb3V0KVxuICAgIH1cbiAgICBjb25zdCBzZW5kUGluZyA9ICgpID0+IHtcbiAgICAgIGlmICh3c2NsaWVudC53cyA9PT0gd2Vic29ja2V0KSB7XG4gICAgICAgIHdzY2xpZW50LnNlbmQoe1xuICAgICAgICAgIHR5cGU6ICdwaW5nJ1xuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICB3ZWJzb2NrZXQub25jbG9zZSA9ICgpID0+IG9uY2xvc2UobnVsbClcbiAgICB3ZWJzb2NrZXQub25lcnJvciA9IGVycm9yID0+IG9uY2xvc2UoZXJyb3IpXG4gICAgd2Vic29ja2V0Lm9ub3BlbiA9ICgpID0+IHtcbiAgICAgIHdzY2xpZW50Lmxhc3RNZXNzYWdlUmVjZWl2ZWQgPSB0aW1lLmdldFVuaXhUaW1lKClcbiAgICAgIHdzY2xpZW50LmNvbm5lY3RpbmcgPSBmYWxzZVxuICAgICAgd3NjbGllbnQuY29ubmVjdGVkID0gdHJ1ZVxuICAgICAgd3NjbGllbnQudW5zdWNjZXNzZnVsUmVjb25uZWN0cyA9IDBcbiAgICAgIHdzY2xpZW50LmVtaXQoJ2Nvbm5lY3QnLCBbeyB0eXBlOiAnY29ubmVjdCcgfSwgd3NjbGllbnRdKVxuICAgICAgLy8gc2V0IHBpbmdcbiAgICAgIHBpbmdUaW1lb3V0ID0gc2V0VGltZW91dChzZW5kUGluZywgbWVzc2FnZVJlY29ubmVjdFRpbWVvdXQgLyAyKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKiBAZXh0ZW5kcyBPYnNlcnZhYmxlPHN0cmluZz5cbiAqL1xuZXhwb3J0IGNsYXNzIFdlYnNvY2tldENsaWVudCBleHRlbmRzIE9ic2VydmFibGUge1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVybFxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0c1xuICAgKiBAcGFyYW0geydhcnJheWJ1ZmZlcicgfCAnYmxvYicgfCBudWxsfSBbb3B0cy5iaW5hcnlUeXBlXSBTZXQgYHdzLmJpbmFyeVR5cGVgXG4gICAqL1xuICBjb25zdHJ1Y3RvciAodXJsLCB7IGJpbmFyeVR5cGUgfSA9IHt9KSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMudXJsID0gdXJsXG4gICAgLyoqXG4gICAgICogQHR5cGUge1dlYlNvY2tldD99XG4gICAgICovXG4gICAgdGhpcy53cyA9IG51bGxcbiAgICB0aGlzLmJpbmFyeVR5cGUgPSBiaW5hcnlUeXBlIHx8IG51bGxcbiAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlXG4gICAgdGhpcy5jb25uZWN0aW5nID0gZmFsc2VcbiAgICB0aGlzLnVuc3VjY2Vzc2Z1bFJlY29ubmVjdHMgPSAwXG4gICAgdGhpcy5sYXN0TWVzc2FnZVJlY2VpdmVkID0gMFxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdG8gY29ubmVjdCB0byBvdGhlciBwZWVycyBvciBub3RcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGlzLnNob3VsZENvbm5lY3QgPSB0cnVlXG4gICAgdGhpcy5fY2hlY2tJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCAmJiBtZXNzYWdlUmVjb25uZWN0VGltZW91dCA8IHRpbWUuZ2V0VW5peFRpbWUoKSAtIHRoaXMubGFzdE1lc3NhZ2VSZWNlaXZlZCkge1xuICAgICAgICAvLyBubyBtZXNzYWdlIHJlY2VpdmVkIGluIGEgbG9uZyB0aW1lIC0gbm90IGV2ZW4geW91ciBvd24gYXdhcmVuZXNzXG4gICAgICAgIC8vIHVwZGF0ZXMgKHdoaWNoIGFyZSB1cGRhdGVkIGV2ZXJ5IDE1IHNlY29uZHMpXG4gICAgICAgIC8qKiBAdHlwZSB7V2ViU29ja2V0fSAqLyAodGhpcy53cykuY2xvc2UoKVxuICAgICAgfVxuICAgIH0sIG1lc3NhZ2VSZWNvbm5lY3RUaW1lb3V0IC8gMilcbiAgICBzZXR1cFdTKHRoaXMpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG1lc3NhZ2VcbiAgICovXG4gIHNlbmQgKG1lc3NhZ2UpIHtcbiAgICBpZiAodGhpcy53cykge1xuICAgICAgdGhpcy53cy5zZW5kKEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKVxuICAgIH1cbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fY2hlY2tJbnRlcnZhbClcbiAgICB0aGlzLmRpc2Nvbm5lY3QoKVxuICAgIHN1cGVyLmRlc3Ryb3koKVxuICB9XG5cbiAgZGlzY29ubmVjdCAoKSB7XG4gICAgdGhpcy5zaG91bGRDb25uZWN0ID0gZmFsc2VcbiAgICBpZiAodGhpcy53cyAhPT0gbnVsbCkge1xuICAgICAgdGhpcy53cy5jbG9zZSgpXG4gICAgfVxuICB9XG5cbiAgY29ubmVjdCAoKSB7XG4gICAgdGhpcy5zaG91bGRDb25uZWN0ID0gdHJ1ZVxuICAgIGlmICghdGhpcy5jb25uZWN0ZWQgJiYgdGhpcy53cyA9PT0gbnVsbCkge1xuICAgICAgc2V0dXBXUyh0aGlzKVxuICAgIH1cbiAgfVxufVxuIiwgIi8qKlxuICogRXJyb3IgaGVscGVycy5cbiAqXG4gKiBAbW9kdWxlIGVycm9yXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc1xuICogQHJldHVybiB7RXJyb3J9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gcyA9PiBuZXcgRXJyb3IocylcblxuLyoqXG4gKiBAdGhyb3dzIHtFcnJvcn1cbiAqIEByZXR1cm4ge25ldmVyfVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAzICovXG5leHBvcnQgY29uc3QgbWV0aG9kVW5pbXBsZW1lbnRlZCA9ICgpID0+IHtcbiAgdGhyb3cgY3JlYXRlKCdNZXRob2QgdW5pbXBsZW1lbnRlZCcpXG59XG5cbi8qKlxuICogQHRocm93cyB7RXJyb3J9XG4gKiBAcmV0dXJuIHtuZXZlcn1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgMyAqL1xuZXhwb3J0IGNvbnN0IHVuZXhwZWN0ZWRDYXNlID0gKCkgPT4ge1xuICB0aHJvdyBjcmVhdGUoJ1VuZXhwZWN0ZWQgY2FzZScpXG59XG5cbi8qKlxuICogQHBhcmFtIHtib29sZWFufSBwcm9wZXJ0eVxuICogQHJldHVybiB7YXNzZXJ0cyBwcm9wZXJ0eSBpcyB0cnVlfVxuICovXG5leHBvcnQgY29uc3QgYXNzZXJ0ID0gcHJvcGVydHkgPT4geyBpZiAoIXByb3BlcnR5KSB0aHJvdyBjcmVhdGUoJ0Fzc2VydCBmYWlsZWQnKSB9XG4iLCAiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogQmluYXJ5IGRhdGEgY29uc3RhbnRzLlxuICpcbiAqIEBtb2R1bGUgYmluYXJ5XG4gKi9cblxuLyoqXG4gKiBuLXRoIGJpdCBhY3RpdmF0ZWQuXG4gKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVDEgPSAxXG5leHBvcnQgY29uc3QgQklUMiA9IDJcbmV4cG9ydCBjb25zdCBCSVQzID0gNFxuZXhwb3J0IGNvbnN0IEJJVDQgPSA4XG5leHBvcnQgY29uc3QgQklUNSA9IDE2XG5leHBvcnQgY29uc3QgQklUNiA9IDMyXG5leHBvcnQgY29uc3QgQklUNyA9IDY0XG5leHBvcnQgY29uc3QgQklUOCA9IDEyOFxuZXhwb3J0IGNvbnN0IEJJVDkgPSAyNTZcbmV4cG9ydCBjb25zdCBCSVQxMCA9IDUxMlxuZXhwb3J0IGNvbnN0IEJJVDExID0gMTAyNFxuZXhwb3J0IGNvbnN0IEJJVDEyID0gMjA0OFxuZXhwb3J0IGNvbnN0IEJJVDEzID0gNDA5NlxuZXhwb3J0IGNvbnN0IEJJVDE0ID0gODE5MlxuZXhwb3J0IGNvbnN0IEJJVDE1ID0gMTYzODRcbmV4cG9ydCBjb25zdCBCSVQxNiA9IDMyNzY4XG5leHBvcnQgY29uc3QgQklUMTcgPSA2NTUzNlxuZXhwb3J0IGNvbnN0IEJJVDE4ID0gMSA8PCAxN1xuZXhwb3J0IGNvbnN0IEJJVDE5ID0gMSA8PCAxOFxuZXhwb3J0IGNvbnN0IEJJVDIwID0gMSA8PCAxOVxuZXhwb3J0IGNvbnN0IEJJVDIxID0gMSA8PCAyMFxuZXhwb3J0IGNvbnN0IEJJVDIyID0gMSA8PCAyMVxuZXhwb3J0IGNvbnN0IEJJVDIzID0gMSA8PCAyMlxuZXhwb3J0IGNvbnN0IEJJVDI0ID0gMSA8PCAyM1xuZXhwb3J0IGNvbnN0IEJJVDI1ID0gMSA8PCAyNFxuZXhwb3J0IGNvbnN0IEJJVDI2ID0gMSA8PCAyNVxuZXhwb3J0IGNvbnN0IEJJVDI3ID0gMSA8PCAyNlxuZXhwb3J0IGNvbnN0IEJJVDI4ID0gMSA8PCAyN1xuZXhwb3J0IGNvbnN0IEJJVDI5ID0gMSA8PCAyOFxuZXhwb3J0IGNvbnN0IEJJVDMwID0gMSA8PCAyOVxuZXhwb3J0IGNvbnN0IEJJVDMxID0gMSA8PCAzMFxuZXhwb3J0IGNvbnN0IEJJVDMyID0gMSA8PCAzMVxuXG4vKipcbiAqIEZpcnN0IG4gYml0cyBhY3RpdmF0ZWQuXG4gKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMwID0gMFxuZXhwb3J0IGNvbnN0IEJJVFMxID0gMVxuZXhwb3J0IGNvbnN0IEJJVFMyID0gM1xuZXhwb3J0IGNvbnN0IEJJVFMzID0gN1xuZXhwb3J0IGNvbnN0IEJJVFM0ID0gMTVcbmV4cG9ydCBjb25zdCBCSVRTNSA9IDMxXG5leHBvcnQgY29uc3QgQklUUzYgPSA2M1xuZXhwb3J0IGNvbnN0IEJJVFM3ID0gMTI3XG5leHBvcnQgY29uc3QgQklUUzggPSAyNTVcbmV4cG9ydCBjb25zdCBCSVRTOSA9IDUxMVxuZXhwb3J0IGNvbnN0IEJJVFMxMCA9IDEwMjNcbmV4cG9ydCBjb25zdCBCSVRTMTEgPSAyMDQ3XG5leHBvcnQgY29uc3QgQklUUzEyID0gNDA5NVxuZXhwb3J0IGNvbnN0IEJJVFMxMyA9IDgxOTFcbmV4cG9ydCBjb25zdCBCSVRTMTQgPSAxNjM4M1xuZXhwb3J0IGNvbnN0IEJJVFMxNSA9IDMyNzY3XG5leHBvcnQgY29uc3QgQklUUzE2ID0gNjU1MzVcbmV4cG9ydCBjb25zdCBCSVRTMTcgPSBCSVQxOCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMTggPSBCSVQxOSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMTkgPSBCSVQyMCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjAgPSBCSVQyMSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjEgPSBCSVQyMiAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjIgPSBCSVQyMyAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjMgPSBCSVQyNCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjQgPSBCSVQyNSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjUgPSBCSVQyNiAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjYgPSBCSVQyNyAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjcgPSBCSVQyOCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjggPSBCSVQyOSAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMjkgPSBCSVQzMCAtIDFcbmV4cG9ydCBjb25zdCBCSVRTMzAgPSBCSVQzMSAtIDFcbi8qKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMzMSA9IDB4N0ZGRkZGRkZcbi8qKlxuICogQHR5cGUge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IEJJVFMzMiA9IDB4RkZGRkZGRkZcbiIsICIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuZXhwb3J0IGNvbnN0IHN1YnRsZSA9IGNyeXB0by5zdWJ0bGVcbmV4cG9ydCBjb25zdCBnZXRSYW5kb21WYWx1ZXMgPSBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzLmJpbmQoY3J5cHRvKVxuIiwgIi8qKlxuICogSXNvbW9ycGhpYyBtb2R1bGUgZm9yIHRydWUgcmFuZG9tIG51bWJlcnMgLyBidWZmZXJzIC8gdXVpZHMuXG4gKlxuICogQXR0ZW50aW9uOiBmYWxscyBiYWNrIHRvIE1hdGgucmFuZG9tIGlmIHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgY3J5cHRvLlxuICpcbiAqIEBtb2R1bGUgcmFuZG9tXG4gKi9cblxuaW1wb3J0ICogYXMgbWF0aCBmcm9tICcuL21hdGguanMnXG5pbXBvcnQgKiBhcyBiaW5hcnkgZnJvbSAnLi9iaW5hcnkuanMnXG5pbXBvcnQgeyBnZXRSYW5kb21WYWx1ZXMgfSBmcm9tICdsaWIwL3dlYmNyeXB0bydcblxuZXhwb3J0IGNvbnN0IHJhbmQgPSBNYXRoLnJhbmRvbVxuXG5leHBvcnQgY29uc3QgdWludDMyID0gKCkgPT4gZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50MzJBcnJheSgxKSlbMF1cblxuZXhwb3J0IGNvbnN0IHVpbnQ1MyA9ICgpID0+IHtcbiAgY29uc3QgYXJyID0gZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50MzJBcnJheSg4KSlcbiAgcmV0dXJuIChhcnJbMF0gJiBiaW5hcnkuQklUUzIxKSAqIChiaW5hcnkuQklUUzMyICsgMSkgKyAoYXJyWzFdID4+PiAwKVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge0FycmF5PFQ+fSBhcnJcbiAqIEByZXR1cm4ge1R9XG4gKi9cbmV4cG9ydCBjb25zdCBvbmVPZiA9IGFyciA9PiBhcnJbbWF0aC5mbG9vcihyYW5kKCkgKiBhcnIubGVuZ3RoKV1cblxuLy8gQHRzLWlnbm9yZVxuY29uc3QgdXVpZHY0VGVtcGxhdGUgPSBbMWU3XSArIC0xZTMgKyAtNGUzICsgLThlMyArIC0xZTExXG5cbi8qKlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgdXVpZHY0ID0gKCkgPT4gdXVpZHY0VGVtcGxhdGUucmVwbGFjZSgvWzAxOF0vZywgLyoqIEBwYXJhbSB7bnVtYmVyfSBjICovIGMgPT5cbiAgKGMgXiB1aW50MzIoKSAmIDE1ID4+IGMgLyA0KS50b1N0cmluZygxNilcbilcbiIsICIvKipcbiAqIFV0aWxpdHkgaGVscGVycyBmb3Igd29ya2luZyB3aXRoIG51bWJlcnMuXG4gKlxuICogQG1vZHVsZSBudW1iZXJcbiAqL1xuXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJy4vbWF0aC5qcydcbmltcG9ydCAqIGFzIGJpbmFyeSBmcm9tICcuL2JpbmFyeS5qcydcblxuZXhwb3J0IGNvbnN0IE1BWF9TQUZFX0lOVEVHRVIgPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUlxuZXhwb3J0IGNvbnN0IE1JTl9TQUZFX0lOVEVHRVIgPSBOdW1iZXIuTUlOX1NBRkVfSU5URUdFUlxuXG5leHBvcnQgY29uc3QgTE9XRVNUX0lOVDMyID0gMSA8PCAzMVxuZXhwb3J0IGNvbnN0IEhJR0hFU1RfSU5UMzIgPSBiaW5hcnkuQklUUzMxXG5leHBvcnQgY29uc3QgSElHSEVTVF9VSU5UMzIgPSBiaW5hcnkuQklUUzMyXG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgaXNJbnRlZ2VyID0gTnVtYmVyLmlzSW50ZWdlciB8fCAobnVtID0+IHR5cGVvZiBudW0gPT09ICdudW1iZXInICYmIGlzRmluaXRlKG51bSkgJiYgbWF0aC5mbG9vcihudW0pID09PSBudW0pXG5leHBvcnQgY29uc3QgaXNOYU4gPSBOdW1iZXIuaXNOYU5cbmV4cG9ydCBjb25zdCBwYXJzZUludCA9IE51bWJlci5wYXJzZUludFxuXG4vKipcbiAqIENvdW50IHRoZSBudW1iZXIgb2YgXCIxXCIgYml0cyBpbiBhbiB1bnNpZ25lZCAzMmJpdCBudW1iZXIuXG4gKlxuICogU3VwZXIgZnVuIGJpdGNvdW50IGFsZ29yaXRobSBieSBCcmlhbiBLZXJuaWdoYW4uXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IG5cbiAqL1xuZXhwb3J0IGNvbnN0IGNvdW50Qml0cyA9IG4gPT4ge1xuICBuICY9IGJpbmFyeS5CSVRTMzJcbiAgbGV0IGNvdW50ID0gMFxuICB3aGlsZSAobikge1xuICAgIG4gJj0gKG4gLSAxKVxuICAgIGNvdW50KytcbiAgfVxuICByZXR1cm4gY291bnRcbn1cbiIsICJpbXBvcnQgKiBhcyBhcnJheSBmcm9tICcuL2FycmF5LmpzJ1xuXG4vKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCBzdHJpbmdzLlxuICpcbiAqIEBtb2R1bGUgc3RyaW5nXG4gKi9cblxuZXhwb3J0IGNvbnN0IGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGVcbmV4cG9ydCBjb25zdCBmcm9tQ29kZVBvaW50ID0gU3RyaW5nLmZyb21Db2RlUG9pbnRcblxuLyoqXG4gKiBUaGUgbGFyZ2VzdCB1dGYxNiBjaGFyYWN0ZXIuXG4gKiBDb3JyZXNwb25kcyB0byBVaW50OEFycmF5KFsyNTUsIDI1NV0pIG9yIGNoYXJjb2Rlb2YoMngyXjgpXG4gKi9cbmV4cG9ydCBjb25zdCBNQVhfVVRGMTZfQ0hBUkFDVEVSID0gZnJvbUNoYXJDb2RlKDY1NTM1KVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmNvbnN0IHRvTG93ZXJDYXNlID0gcyA9PiBzLnRvTG93ZXJDYXNlKClcblxuY29uc3QgdHJpbUxlZnRSZWdleCA9IC9eXFxzKi9nXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IHRyaW1MZWZ0ID0gcyA9PiBzLnJlcGxhY2UodHJpbUxlZnRSZWdleCwgJycpXG5cbmNvbnN0IGZyb21DYW1lbENhc2VSZWdleCA9IC8oW0EtWl0pL2dcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc1xuICogQHBhcmFtIHtzdHJpbmd9IHNlcGFyYXRvclxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgZnJvbUNhbWVsQ2FzZSA9IChzLCBzZXBhcmF0b3IpID0+IHRyaW1MZWZ0KHMucmVwbGFjZShmcm9tQ2FtZWxDYXNlUmVnZXgsIG1hdGNoID0+IGAke3NlcGFyYXRvcn0ke3RvTG93ZXJDYXNlKG1hdGNoKX1gKSlcblxuLyoqXG4gKiBDb21wdXRlIHRoZSB1dGY4Qnl0ZUxlbmd0aFxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgdXRmOEJ5dGVMZW5ndGggPSBzdHIgPT4gdW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHN0cikpLmxlbmd0aFxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXk8QXJyYXlCdWZmZXI+fVxuICovXG5leHBvcnQgY29uc3QgX2VuY29kZVV0ZjhQb2x5ZmlsbCA9IHN0ciA9PiB7XG4gIGNvbnN0IGVuY29kZWRTdHJpbmcgPSB1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoc3RyKSlcbiAgY29uc3QgbGVuID0gZW5jb2RlZFN0cmluZy5sZW5ndGhcbiAgY29uc3QgYnVmID0gbmV3IFVpbnQ4QXJyYXkobGVuKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgYnVmW2ldID0gLyoqIEB0eXBlIHtudW1iZXJ9ICovIChlbmNvZGVkU3RyaW5nLmNvZGVQb2ludEF0KGkpKVxuICB9XG4gIHJldHVybiBidWZcbn1cblxuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCB1dGY4VGV4dEVuY29kZXIgPSAvKiogQHR5cGUge1RleHRFbmNvZGVyfSAqLyAodHlwZW9mIFRleHRFbmNvZGVyICE9PSAndW5kZWZpbmVkJyA/IG5ldyBUZXh0RW5jb2RlcigpIDogbnVsbClcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5PEFycmF5QnVmZmVyPn1cbiAqL1xuZXhwb3J0IGNvbnN0IF9lbmNvZGVVdGY4TmF0aXZlID0gc3RyID0+IHV0ZjhUZXh0RW5jb2Rlci5lbmNvZGUoc3RyKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgZW5jb2RlVXRmOCA9IHV0ZjhUZXh0RW5jb2RlciA/IF9lbmNvZGVVdGY4TmF0aXZlIDogX2VuY29kZVV0ZjhQb2x5ZmlsbFxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBfZGVjb2RlVXRmOFBvbHlmaWxsID0gYnVmID0+IHtcbiAgbGV0IHJlbWFpbmluZ0xlbiA9IGJ1Zi5sZW5ndGhcbiAgbGV0IGVuY29kZWRTdHJpbmcgPSAnJ1xuICBsZXQgYnVmUG9zID0gMFxuICB3aGlsZSAocmVtYWluaW5nTGVuID4gMCkge1xuICAgIGNvbnN0IG5leHRMZW4gPSByZW1haW5pbmdMZW4gPCAxMDAwMCA/IHJlbWFpbmluZ0xlbiA6IDEwMDAwXG4gICAgY29uc3QgYnl0ZXMgPSBidWYuc3ViYXJyYXkoYnVmUG9zLCBidWZQb3MgKyBuZXh0TGVuKVxuICAgIGJ1ZlBvcyArPSBuZXh0TGVuXG4gICAgLy8gU3RhcnRpbmcgd2l0aCBFUzUuMSB3ZSBjYW4gc3VwcGx5IGEgZ2VuZXJpYyBhcnJheS1saWtlIG9iamVjdCBhcyBhcmd1bWVudHNcbiAgICBlbmNvZGVkU3RyaW5nICs9IFN0cmluZy5mcm9tQ29kZVBvaW50LmFwcGx5KG51bGwsIC8qKiBAdHlwZSB7YW55fSAqLyAoYnl0ZXMpKVxuICAgIHJlbWFpbmluZ0xlbiAtPSBuZXh0TGVuXG4gIH1cbiAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChlc2NhcGUoZW5jb2RlZFN0cmluZykpXG59XG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgbGV0IHV0ZjhUZXh0RGVjb2RlciA9IHR5cGVvZiBUZXh0RGVjb2RlciA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogbmV3IFRleHREZWNvZGVyKCd1dGYtOCcsIHsgZmF0YWw6IHRydWUsIGlnbm9yZUJPTTogdHJ1ZSB9KVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmlmICh1dGY4VGV4dERlY29kZXIgJiYgdXRmOFRleHREZWNvZGVyLmRlY29kZShuZXcgVWludDhBcnJheSgpKS5sZW5ndGggPT09IDEpIHtcbiAgLy8gU2FmYXJpIGRvZXNuJ3QgaGFuZGxlIEJPTSBjb3JyZWN0bHkuXG4gIC8vIFRoaXMgZml4ZXMgYSBidWcgaW4gU2FmYXJpIDEzLjAuNSB3aGVyZSBpdCBwcm9kdWNlcyBhIEJPTSB0aGUgZmlyc3QgdGltZSBpdCBpcyBjYWxsZWQuXG4gIC8vIHV0ZjhUZXh0RGVjb2Rlci5kZWNvZGUobmV3IFVpbnQ4QXJyYXkoKSkubGVuZ3RoID09PSAxIG9uIHRoZSBmaXJzdCBjYWxsIGFuZFxuICAvLyB1dGY4VGV4dERlY29kZXIuZGVjb2RlKG5ldyBVaW50OEFycmF5KCkpLmxlbmd0aCA9PT0gMSBvbiB0aGUgc2Vjb25kIGNhbGxcbiAgLy8gQW5vdGhlciBpc3N1ZSBpcyB0aGF0IGZyb20gdGhlbiBvbiBubyBCT00gY2hhcnMgYXJlIHJlY29nbml6ZWQgYW55bW9yZVxuICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICB1dGY4VGV4dERlY29kZXIgPSBudWxsXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBfZGVjb2RlVXRmOE5hdGl2ZSA9IGJ1ZiA9PiAvKiogQHR5cGUge1RleHREZWNvZGVyfSAqLyAodXRmOFRleHREZWNvZGVyKS5kZWNvZGUoYnVmKVxuXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgZGVjb2RlVXRmOCA9IHV0ZjhUZXh0RGVjb2RlciA/IF9kZWNvZGVVdGY4TmF0aXZlIDogX2RlY29kZVV0ZjhQb2x5ZmlsbFxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgVGhlIGluaXRpYWwgc3RyaW5nXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXggU3RhcnRpbmcgcG9zaXRpb25cbiAqIEBwYXJhbSB7bnVtYmVyfSByZW1vdmUgTnVtYmVyIG9mIGNoYXJhY3RlcnMgdG8gcmVtb3ZlXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5zZXJ0IE5ldyBjb250ZW50IHRvIGluc2VydFxuICovXG5leHBvcnQgY29uc3Qgc3BsaWNlID0gKHN0ciwgaW5kZXgsIHJlbW92ZSwgaW5zZXJ0ID0gJycpID0+IHN0ci5zbGljZSgwLCBpbmRleCkgKyBpbnNlcnQgKyBzdHIuc2xpY2UoaW5kZXggKyByZW1vdmUpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHNvdXJjZVxuICogQHBhcmFtIHtudW1iZXJ9IG5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlcGVhdCA9IChzb3VyY2UsIG4pID0+IGFycmF5LnVuZm9sZChuLCAoKSA9PiBzb3VyY2UpLmpvaW4oJycpXG5cbi8qKlxuICogRXNjYXBlIEhUTUwgY2hhcmFjdGVycyAmLDwsPiwnLFwiIHRvIHRoZWlyIHJlc3BlY3RpdmUgSFRNTCBlbnRpdGllcyAmYW1wOywmbHQ7LCZndDssJiMzOTssJnF1b3Q7XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICovXG5leHBvcnQgY29uc3QgZXNjYXBlSFRNTCA9IHN0ciA9PlxuICBzdHIucmVwbGFjZSgvWyY8PidcIl0vZywgciA9PiAvKiogQHR5cGUge3N0cmluZ30gKi8gKHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgXCInXCI6ICcmIzM5OycsXG4gICAgJ1wiJzogJyZxdW90OydcbiAgfVtyXSkpXG5cbi8qKlxuICogUmV2ZXJzZSBvZiBgZXNjYXBlSFRNTGBcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKi9cbmV4cG9ydCBjb25zdCB1bmVzY2FwZUhUTUwgPSBzdHIgPT5cbiAgc3RyLnJlcGxhY2UoLyZhbXA7fCZsdDt8Jmd0O3wmIzM5O3wmcXVvdDsvZywgciA9PiAvKiogQHR5cGUge3N0cmluZ30gKi8gKHtcbiAgICAnJmFtcDsnOiAnJicsXG4gICAgJyZsdDsnOiAnPCcsXG4gICAgJyZndDsnOiAnPicsXG4gICAgJyYjMzk7JzogXCInXCIsXG4gICAgJyZxdW90Oyc6ICdcIidcbiAgfVtyXSkpXG4iLCAiLyoqXG4gKiBFZmZpY2llbnQgc2NoZW1hLWxlc3MgYmluYXJ5IGVuY29kaW5nIHdpdGggc3VwcG9ydCBmb3IgdmFyaWFibGUgbGVuZ3RoIGVuY29kaW5nLlxuICpcbiAqIFVzZSBbbGliMC9lbmNvZGluZ10gd2l0aCBbbGliMC9kZWNvZGluZ10uIEV2ZXJ5IGVuY29kaW5nIGZ1bmN0aW9uIGhhcyBhIGNvcnJlc3BvbmRpbmcgZGVjb2RpbmcgZnVuY3Rpb24uXG4gKlxuICogRW5jb2RlcyBudW1iZXJzIGluIGxpdHRsZS1lbmRpYW4gb3JkZXIgKGxlYXN0IHRvIG1vc3Qgc2lnbmlmaWNhbnQgYnl0ZSBvcmRlcilcbiAqIGFuZCBpcyBjb21wYXRpYmxlIHdpdGggR29sYW5nJ3MgYmluYXJ5IGVuY29kaW5nIChodHRwczovL2dvbGFuZy5vcmcvcGtnL2VuY29kaW5nL2JpbmFyeS8pXG4gKiB3aGljaCBpcyBhbHNvIHVzZWQgaW4gUHJvdG9jb2wgQnVmZmVycy5cbiAqXG4gKiBgYGBqc1xuICogLy8gZW5jb2Rpbmcgc3RlcFxuICogY29uc3QgZW5jb2RlciA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICogZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIDI1NilcbiAqIGVuY29kaW5nLndyaXRlVmFyU3RyaW5nKGVuY29kZXIsICdIZWxsbyB3b3JsZCEnKVxuICogY29uc3QgYnVmID0gZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXIpXG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogLy8gZGVjb2Rpbmcgc3RlcFxuICogY29uc3QgZGVjb2RlciA9IGRlY29kaW5nLmNyZWF0ZURlY29kZXIoYnVmKVxuICogZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2RlcikgLy8gPT4gMjU2XG4gKiBkZWNvZGluZy5yZWFkVmFyU3RyaW5nKGRlY29kZXIpIC8vID0+ICdIZWxsbyB3b3JsZCEnXG4gKiBkZWNvZGluZy5oYXNDb250ZW50KGRlY29kZXIpIC8vID0+IGZhbHNlIC0gYWxsIGRhdGEgaXMgcmVhZFxuICogYGBgXG4gKlxuICogQG1vZHVsZSBlbmNvZGluZ1xuICovXG5cbmltcG9ydCAqIGFzIG1hdGggZnJvbSAnLi9tYXRoLmpzJ1xuaW1wb3J0ICogYXMgbnVtYmVyIGZyb20gJy4vbnVtYmVyLmpzJ1xuaW1wb3J0ICogYXMgYmluYXJ5IGZyb20gJy4vYmluYXJ5LmpzJ1xuaW1wb3J0ICogYXMgc3RyaW5nIGZyb20gJy4vc3RyaW5nLmpzJ1xuaW1wb3J0ICogYXMgYXJyYXkgZnJvbSAnLi9hcnJheS5qcydcblxuLyoqXG4gKiBBIEJpbmFyeUVuY29kZXIgaGFuZGxlcyB0aGUgZW5jb2RpbmcgdG8gYW4gVWludDhBcnJheS5cbiAqL1xuZXhwb3J0IGNsYXNzIEVuY29kZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5jcG9zID0gMFxuICAgIHRoaXMuY2J1ZiA9IG5ldyBVaW50OEFycmF5KDEwMClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QXJyYXk8VWludDhBcnJheT59XG4gICAgICovXG4gICAgdGhpcy5idWZzID0gW11cbiAgfVxufVxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHJldHVybiB7RW5jb2Rlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUVuY29kZXIgPSAoKSA9PiBuZXcgRW5jb2RlcigpXG5cbi8qKlxuICogQHBhcmFtIHtmdW5jdGlvbihFbmNvZGVyKTp2b2lkfSBmXG4gKi9cbmV4cG9ydCBjb25zdCBlbmNvZGUgPSAoZikgPT4ge1xuICBjb25zdCBlbmNvZGVyID0gY3JlYXRlRW5jb2RlcigpXG4gIGYoZW5jb2RlcilcbiAgcmV0dXJuIHRvVWludDhBcnJheShlbmNvZGVyKVxufVxuXG4vKipcbiAqIFRoZSBjdXJyZW50IGxlbmd0aCBvZiB0aGUgZW5jb2RlZCBkYXRhLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBsZW5ndGggPSBlbmNvZGVyID0+IHtcbiAgbGV0IGxlbiA9IGVuY29kZXIuY3Bvc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGVuY29kZXIuYnVmcy5sZW5ndGg7IGkrKykge1xuICAgIGxlbiArPSBlbmNvZGVyLmJ1ZnNbaV0ubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGxlblxufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgZW5jb2RlciBpcyBlbXB0eS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGhhc0NvbnRlbnQgPSBlbmNvZGVyID0+IGVuY29kZXIuY3BvcyA+IDAgfHwgZW5jb2Rlci5idWZzLmxlbmd0aCA+IDBcblxuLyoqXG4gKiBUcmFuc2Zvcm0gdG8gVWludDhBcnJheS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHJldHVybiB7VWludDhBcnJheTxBcnJheUJ1ZmZlcj59IFRoZSBjcmVhdGVkIEFycmF5QnVmZmVyLlxuICovXG5leHBvcnQgY29uc3QgdG9VaW50OEFycmF5ID0gZW5jb2RlciA9PiB7XG4gIGNvbnN0IHVpbnQ4YXJyID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKGVuY29kZXIpKVxuICBsZXQgY3VyUG9zID0gMFxuICBmb3IgKGxldCBpID0gMDsgaSA8IGVuY29kZXIuYnVmcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGQgPSBlbmNvZGVyLmJ1ZnNbaV1cbiAgICB1aW50OGFyci5zZXQoZCwgY3VyUG9zKVxuICAgIGN1clBvcyArPSBkLmxlbmd0aFxuICB9XG4gIHVpbnQ4YXJyLnNldChuZXcgVWludDhBcnJheShlbmNvZGVyLmNidWYuYnVmZmVyLCAwLCBlbmNvZGVyLmNwb3MpLCBjdXJQb3MpXG4gIHJldHVybiB1aW50OGFyclxufVxuXG4vKipcbiAqIFZlcmlmeSB0aGF0IGl0IGlzIHBvc3NpYmxlIHRvIHdyaXRlIGBsZW5gIGJ5dGVzIHd0aWhvdXQgY2hlY2tpbmcuIElmXG4gKiBuZWNlc3NhcnksIGEgbmV3IEJ1ZmZlciB3aXRoIHRoZSByZXF1aXJlZCBsZW5ndGggaXMgYXR0YWNoZWQuXG4gKlxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gKi9cbmV4cG9ydCBjb25zdCB2ZXJpZnlMZW4gPSAoZW5jb2RlciwgbGVuKSA9PiB7XG4gIGNvbnN0IGJ1ZmZlckxlbiA9IGVuY29kZXIuY2J1Zi5sZW5ndGhcbiAgaWYgKGJ1ZmZlckxlbiAtIGVuY29kZXIuY3BvcyA8IGxlbikge1xuICAgIGVuY29kZXIuYnVmcy5wdXNoKG5ldyBVaW50OEFycmF5KGVuY29kZXIuY2J1Zi5idWZmZXIsIDAsIGVuY29kZXIuY3BvcykpXG4gICAgZW5jb2Rlci5jYnVmID0gbmV3IFVpbnQ4QXJyYXkobWF0aC5tYXgoYnVmZmVyTGVuLCBsZW4pICogMilcbiAgICBlbmNvZGVyLmNwb3MgPSAwXG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSBvbmUgYnl0ZSB0byB0aGUgZW5jb2Rlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgYnl0ZSB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZSA9IChlbmNvZGVyLCBudW0pID0+IHtcbiAgY29uc3QgYnVmZmVyTGVuID0gZW5jb2Rlci5jYnVmLmxlbmd0aFxuICBpZiAoZW5jb2Rlci5jcG9zID09PSBidWZmZXJMZW4pIHtcbiAgICBlbmNvZGVyLmJ1ZnMucHVzaChlbmNvZGVyLmNidWYpXG4gICAgZW5jb2Rlci5jYnVmID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyTGVuICogMilcbiAgICBlbmNvZGVyLmNwb3MgPSAwXG4gIH1cbiAgZW5jb2Rlci5jYnVmW2VuY29kZXIuY3BvcysrXSA9IG51bVxufVxuXG4vKipcbiAqIFdyaXRlIG9uZSBieXRlIGF0IGEgc3BlY2lmaWMgcG9zaXRpb24uXG4gKiBQb3NpdGlvbiBtdXN0IGFscmVhZHkgYmUgd3JpdHRlbiAoaS5lLiBlbmNvZGVyLmxlbmd0aCA+IHBvcylcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IHBvcyBQb3NpdGlvbiB0byB3aGljaCB0byB3cml0ZSBkYXRhXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFVuc2lnbmVkIDgtYml0IGludGVnZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHNldCA9IChlbmNvZGVyLCBwb3MsIG51bSkgPT4ge1xuICBsZXQgYnVmZmVyID0gbnVsbFxuICAvLyBpdGVyYXRlIGFsbCBidWZmZXJzIGFuZCBhZGp1c3QgcG9zaXRpb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVyLmJ1ZnMubGVuZ3RoICYmIGJ1ZmZlciA9PT0gbnVsbDsgaSsrKSB7XG4gICAgY29uc3QgYiA9IGVuY29kZXIuYnVmc1tpXVxuICAgIGlmIChwb3MgPCBiLmxlbmd0aCkge1xuICAgICAgYnVmZmVyID0gYiAvLyBmb3VuZCBidWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgcG9zIC09IGIubGVuZ3RoXG4gICAgfVxuICB9XG4gIGlmIChidWZmZXIgPT09IG51bGwpIHtcbiAgICAvLyB1c2UgY3VycmVudCBidWZmZXJcbiAgICBidWZmZXIgPSBlbmNvZGVyLmNidWZcbiAgfVxuICBidWZmZXJbcG9zXSA9IG51bVxufVxuXG4vKipcbiAqIFdyaXRlIG9uZSBieXRlIGFzIGFuIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZVVpbnQ4ID0gd3JpdGVcblxuLyoqXG4gKiBXcml0ZSBvbmUgYnl0ZSBhcyBhbiB1bnNpZ25lZCBJbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50OCA9IHNldFxuXG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFRoZSBudW1iZXIgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVVaW50MTYgPSAoZW5jb2RlciwgbnVtKSA9PiB7XG4gIHdyaXRlKGVuY29kZXIsIG51bSAmIGJpbmFyeS5CSVRTOClcbiAgd3JpdGUoZW5jb2RlciwgKG51bSA+Pj4gOCkgJiBiaW5hcnkuQklUUzgpXG59XG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50MTYgPSAoZW5jb2RlciwgcG9zLCBudW0pID0+IHtcbiAgc2V0KGVuY29kZXIsIHBvcywgbnVtICYgYmluYXJ5LkJJVFM4KVxuICBzZXQoZW5jb2RlciwgcG9zICsgMSwgKG51bSA+Pj4gOCkgJiBiaW5hcnkuQklUUzgpXG59XG5cbi8qKlxuICogV3JpdGUgdHdvIGJ5dGVzIGFzIGFuIHVuc2lnbmVkIGludGVnZXJcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDMyID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgIHdyaXRlKGVuY29kZXIsIG51bSAmIGJpbmFyeS5CSVRTOClcbiAgICBudW0gPj4+PSA4XG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSB0d28gYnl0ZXMgYXMgYW4gdW5zaWduZWQgaW50ZWdlciBpbiBiaWcgZW5kaWFuIG9yZGVyLlxuICogKG1vc3Qgc2lnbmlmaWNhbnQgYnl0ZSBmaXJzdClcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDMyQmlnRW5kaWFuID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBmb3IgKGxldCBpID0gMzsgaSA+PSAwOyBpLS0pIHtcbiAgICB3cml0ZShlbmNvZGVyLCAobnVtID4+PiAoOCAqIGkpKSAmIGJpbmFyeS5CSVRTOClcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIHR3byBieXRlcyBhcyBhbiB1bnNpZ25lZCBpbnRlZ2VyIGF0IGEgc3BlY2lmaWMgbG9jYXRpb24uXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBwb3MgVGhlIGxvY2F0aW9uIHdoZXJlIHRoZSBkYXRhIHdpbGwgYmUgd3JpdHRlbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBudW0gVGhlIG51bWJlciB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRVaW50MzIgPSAoZW5jb2RlciwgcG9zLCBudW0pID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICBzZXQoZW5jb2RlciwgcG9zICsgaSwgbnVtICYgYmluYXJ5LkJJVFM4KVxuICAgIG51bSA+Pj49IDhcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIGEgdmFyaWFibGUgbGVuZ3RoIHVuc2lnbmVkIGludGVnZXIuIE1heCBlbmNvZGFibGUgaW50ZWdlciBpcyAyXjUzLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtIFRoZSBudW1iZXIgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVWYXJVaW50ID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICB3aGlsZSAobnVtID4gYmluYXJ5LkJJVFM3KSB7XG4gICAgd3JpdGUoZW5jb2RlciwgYmluYXJ5LkJJVDggfCAoYmluYXJ5LkJJVFM3ICYgbnVtKSlcbiAgICBudW0gPSBtYXRoLmZsb29yKG51bSAvIDEyOCkgLy8gc2hpZnQgPj4+IDdcbiAgfVxuICB3cml0ZShlbmNvZGVyLCBiaW5hcnkuQklUUzcgJiBudW0pXG59XG5cbi8qKlxuICogV3JpdGUgYSB2YXJpYWJsZSBsZW5ndGggaW50ZWdlci5cbiAqXG4gKiBXZSB1c2UgdGhlIDd0aCBiaXQgaW5zdGVhZCBmb3Igc2lnbmFsaW5nIHRoYXQgdGhpcyBpcyBhIG5lZ2F0aXZlIG51bWJlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVmFySW50ID0gKGVuY29kZXIsIG51bSkgPT4ge1xuICBjb25zdCBpc05lZ2F0aXZlID0gbWF0aC5pc05lZ2F0aXZlWmVybyhudW0pXG4gIGlmIChpc05lZ2F0aXZlKSB7XG4gICAgbnVtID0gLW51bVxuICB9XG4gIC8vICAgICAgICAgICAgIHwtIHdoZXRoZXIgdG8gY29udGludWUgcmVhZGluZyAgICAgICAgIHwtIHdoZXRoZXIgaXMgbmVnYXRpdmUgICAgIHwtIG51bWJlclxuICB3cml0ZShlbmNvZGVyLCAobnVtID4gYmluYXJ5LkJJVFM2ID8gYmluYXJ5LkJJVDggOiAwKSB8IChpc05lZ2F0aXZlID8gYmluYXJ5LkJJVDcgOiAwKSB8IChiaW5hcnkuQklUUzYgJiBudW0pKVxuICBudW0gPSBtYXRoLmZsb29yKG51bSAvIDY0KSAvLyBzaGlmdCA+Pj4gNlxuICAvLyBXZSBkb24ndCBuZWVkIHRvIGNvbnNpZGVyIHRoZSBjYXNlIG9mIG51bSA9PT0gMCBzbyB3ZSBjYW4gdXNlIGEgZGlmZmVyZW50XG4gIC8vIHBhdHRlcm4gaGVyZSB0aGFuIGFib3ZlLlxuICB3aGlsZSAobnVtID4gMCkge1xuICAgIHdyaXRlKGVuY29kZXIsIChudW0gPiBiaW5hcnkuQklUUzcgPyBiaW5hcnkuQklUOCA6IDApIHwgKGJpbmFyeS5CSVRTNyAmIG51bSkpXG4gICAgbnVtID0gbWF0aC5mbG9vcihudW0gLyAxMjgpIC8vIHNoaWZ0ID4+PiA3XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNhY2hlIHRvIHN0b3JlIHN0cmluZ3MgdGVtcG9yYXJpbHlcbiAqL1xuY29uc3QgX3N0ckJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KDMwMDAwKVxuY29uc3QgX21heFN0ckJTaXplID0gX3N0ckJ1ZmZlci5sZW5ndGggLyAzXG5cbi8qKlxuICogV3JpdGUgYSB2YXJpYWJsZSBsZW5ndGggc3RyaW5nLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3QgX3dyaXRlVmFyU3RyaW5nTmF0aXZlID0gKGVuY29kZXIsIHN0cikgPT4ge1xuICBpZiAoc3RyLmxlbmd0aCA8IF9tYXhTdHJCU2l6ZSkge1xuICAgIC8vIFdlIGNhbiBlbmNvZGUgdGhlIHN0cmluZyBpbnRvIHRoZSBleGlzdGluZyBidWZmZXJcbiAgICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICAgIGNvbnN0IHdyaXR0ZW4gPSBzdHJpbmcudXRmOFRleHRFbmNvZGVyLmVuY29kZUludG8oc3RyLCBfc3RyQnVmZmVyKS53cml0dGVuIHx8IDBcbiAgICB3cml0ZVZhclVpbnQoZW5jb2Rlciwgd3JpdHRlbilcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdyaXR0ZW47IGkrKykge1xuICAgICAgd3JpdGUoZW5jb2RlciwgX3N0ckJ1ZmZlcltpXSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgd3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIHN0cmluZy5lbmNvZGVVdGY4KHN0cikpXG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZSBhIHZhcmlhYmxlIGxlbmd0aCBzdHJpbmcuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0aGF0IGlzIHRvIGJlIGVuY29kZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBfd3JpdGVWYXJTdHJpbmdQb2x5ZmlsbCA9IChlbmNvZGVyLCBzdHIpID0+IHtcbiAgY29uc3QgZW5jb2RlZFN0cmluZyA9IHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzdHIpKVxuICBjb25zdCBsZW4gPSBlbmNvZGVkU3RyaW5nLmxlbmd0aFxuICB3cml0ZVZhclVpbnQoZW5jb2RlciwgbGVuKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgd3JpdGUoZW5jb2RlciwgLyoqIEB0eXBlIHtudW1iZXJ9ICovIChlbmNvZGVkU3RyaW5nLmNvZGVQb2ludEF0KGkpKSlcbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlIGEgdmFyaWFibGUgbGVuZ3RoIHN0cmluZy5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRoYXQgaXMgdG8gYmUgZW5jb2RlZC5cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCB3cml0ZVZhclN0cmluZyA9IChzdHJpbmcudXRmOFRleHRFbmNvZGVyICYmIC8qKiBAdHlwZSB7YW55fSAqLyAoc3RyaW5nLnV0ZjhUZXh0RW5jb2RlcikuZW5jb2RlSW50bykgPyBfd3JpdGVWYXJTdHJpbmdOYXRpdmUgOiBfd3JpdGVWYXJTdHJpbmdQb2x5ZmlsbFxuXG4vKipcbiAqIFdyaXRlIGEgc3RyaW5nIHRlcm1pbmF0ZWQgYnkgYSBzcGVjaWFsIGJ5dGUgc2VxdWVuY2UuIFRoaXMgaXMgbm90IHZlcnkgcGVyZm9ybWFudCBhbmQgaXNcbiAqIGdlbmVyYWxseSBkaXNjb3VyYWdlZC4gSG93ZXZlciwgdGhlIHJlc3VsdGluZyBieXRlIGFycmF5cyBhcmUgbGV4aW9ncmFwaGljYWxseSBvcmRlcmVkIHdoaWNoXG4gKiBtYWtlcyB0aGlzIGEgbmljZSBmZWF0dXJlIGZvciBkYXRhYmFzZXMuXG4gKlxuICogVGhlIHN0cmluZyB3aWxsIGJlIGVuY29kZWQgdXNpbmcgdXRmOCBhbmQgdGhlbiB0ZXJtaW5hdGVkIGFuZCBlc2NhcGVkIHVzaW5nIHdyaXRlVGVybWluYXRpbmdVaW50OEFycmF5LlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVUZXJtaW5hdGVkU3RyaW5nID0gKGVuY29kZXIsIHN0cikgPT5cbiAgd3JpdGVUZXJtaW5hdGVkVWludDhBcnJheShlbmNvZGVyLCBzdHJpbmcuZW5jb2RlVXRmOChzdHIpKVxuXG4vKipcbiAqIFdyaXRlIGEgdGVybWluYXRpbmcgVWludDhBcnJheS4gTm90ZSB0aGF0IHRoaXMgaXMgbm90IHBlcmZvcm1hbnQgYW5kIGlzIGdlbmVyYWxseVxuICogZGlzY291cmFnZWQuIFRoZXJlIGFyZSBmZXcgc2l0dWF0aW9ucyB3aGVuIHRoaXMgaXMgbmVlZGVkLlxuICpcbiAqIFdlIHVzZSAweDAgYXMgYSB0ZXJtaW5hdGluZyBjaGFyYWN0ZXIuIDB4MSBzZXJ2ZXMgYXMgYW4gZXNjYXBlIGNoYXJhY3RlciBmb3IgMHgwIGFuZCAweDEuXG4gKlxuICogRXhhbXBsZTogWzAsMSwyXSBpcyBlbmNvZGVkIHRvIFsxLDAsMSwxLDIsMF0uIDB4MCwgYW5kIDB4MSBuZWVkZWQgdG8gYmUgZXNjYXBlZCB1c2luZyAweDEuIFRoZW5cbiAqIHRoZSByZXN1bHQgaXMgdGVybWluYXRlZCB1c2luZyB0aGUgMHgwIGNoYXJhY3Rlci5cbiAqXG4gKiBUaGlzIGlzIGJhc2ljYWxseSBob3cgbWFueSBzeXN0ZW1zIGltcGxlbWVudCBudWxsIHRlcm1pbmF0ZWQgc3RyaW5ncy4gSG93ZXZlciwgd2UgdXNlIGFuIGVzY2FwZVxuICogY2hhcmFjdGVyIDB4MSB0byBhdm9pZCBpc3N1ZXMgYW5kIHBvdGVuaWFsIGF0dGFja3Mgb24gb3VyIGRhdGFiYXNlIChpZiB0aGlzIGlzIHVzZWQgYXMgYSBrZXlcbiAqIGVuY29kZXIgZm9yIE5vU3FsIGRhdGFiYXNlcykuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmIFRoZSBzdHJpbmcgdGhhdCBpcyB0byBiZSBlbmNvZGVkLlxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVUZXJtaW5hdGVkVWludDhBcnJheSA9IChlbmNvZGVyLCBidWYpID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBidWYubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBiID0gYnVmW2ldXG4gICAgaWYgKGIgPT09IDAgfHwgYiA9PT0gMSkge1xuICAgICAgd3JpdGUoZW5jb2RlciwgMSlcbiAgICB9XG4gICAgd3JpdGUoZW5jb2RlciwgYnVmW2ldKVxuICB9XG4gIHdyaXRlKGVuY29kZXIsIDApXG59XG5cbi8qKlxuICogV3JpdGUgdGhlIGNvbnRlbnQgb2YgYW5vdGhlciBFbmNvZGVyLlxuICpcbiAqIEBUT0RPOiBjYW4gYmUgaW1wcm92ZWQhXG4gKiAgICAgICAgLSBOb3RlOiBTaG91bGQgY29uc2lkZXIgdGhhdCB3aGVuIGFwcGVuZGluZyBhIGxvdCBvZiBzbWFsbCBFbmNvZGVycywgd2Ugc2hvdWxkIHJhdGhlciBjbG9uZSB0aGFuIHJlZmVyZW5jaW5nIHRoZSBvbGQgc3RydWN0dXJlLlxuICogICAgICAgICAgICAgICAgRW5jb2RlcnMgc3RhcnQgd2l0aCBhIHJhdGhlciBiaWcgaW5pdGlhbCBidWZmZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXIgVGhlIGVuVWludDhBcnJcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gYXBwZW5kIFRoZSBCaW5hcnlFbmNvZGVyIHRvIGJlIHdyaXR0ZW4uXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZUJpbmFyeUVuY29kZXIgPSAoZW5jb2RlciwgYXBwZW5kKSA9PiB3cml0ZVVpbnQ4QXJyYXkoZW5jb2RlciwgdG9VaW50OEFycmF5KGFwcGVuZCkpXG5cbi8qKlxuICogQXBwZW5kIGZpeGVkLWxlbmd0aCBVaW50OEFycmF5IHRvIHRoZSBlbmNvZGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVWludDhBcnJheSA9IChlbmNvZGVyLCB1aW50OEFycmF5KSA9PiB7XG4gIGNvbnN0IGJ1ZmZlckxlbiA9IGVuY29kZXIuY2J1Zi5sZW5ndGhcbiAgY29uc3QgY3BvcyA9IGVuY29kZXIuY3Bvc1xuICBjb25zdCBsZWZ0Q29weUxlbiA9IG1hdGgubWluKGJ1ZmZlckxlbiAtIGNwb3MsIHVpbnQ4QXJyYXkubGVuZ3RoKVxuICBjb25zdCByaWdodENvcHlMZW4gPSB1aW50OEFycmF5Lmxlbmd0aCAtIGxlZnRDb3B5TGVuXG4gIGVuY29kZXIuY2J1Zi5zZXQodWludDhBcnJheS5zdWJhcnJheSgwLCBsZWZ0Q29weUxlbiksIGNwb3MpXG4gIGVuY29kZXIuY3BvcyArPSBsZWZ0Q29weUxlblxuICBpZiAocmlnaHRDb3B5TGVuID4gMCkge1xuICAgIC8vIFN0aWxsIHNvbWV0aGluZyB0byB3cml0ZSwgd3JpdGUgcmlnaHQgaGFsZi4uXG4gICAgLy8gQXBwZW5kIG5ldyBidWZmZXJcbiAgICBlbmNvZGVyLmJ1ZnMucHVzaChlbmNvZGVyLmNidWYpXG4gICAgLy8gbXVzdCBoYXZlIGF0IGxlYXN0IHNpemUgb2YgcmVtYWluaW5nIGJ1ZmZlclxuICAgIGVuY29kZXIuY2J1ZiA9IG5ldyBVaW50OEFycmF5KG1hdGgubWF4KGJ1ZmZlckxlbiAqIDIsIHJpZ2h0Q29weUxlbikpXG4gICAgLy8gY29weSBhcnJheVxuICAgIGVuY29kZXIuY2J1Zi5zZXQodWludDhBcnJheS5zdWJhcnJheShsZWZ0Q29weUxlbikpXG4gICAgZW5jb2Rlci5jcG9zID0gcmlnaHRDb3B5TGVuXG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmQgYW4gVWludDhBcnJheSB0byBFbmNvZGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlVmFyVWludDhBcnJheSA9IChlbmNvZGVyLCB1aW50OEFycmF5KSA9PiB7XG4gIHdyaXRlVmFyVWludChlbmNvZGVyLCB1aW50OEFycmF5LmJ5dGVMZW5ndGgpXG4gIHdyaXRlVWludDhBcnJheShlbmNvZGVyLCB1aW50OEFycmF5KVxufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBEYXRhVmlldyBvZiB0aGUgbmV4dCBgbGVuYCBieXRlcy4gVXNlIGl0IHRvIHdyaXRlIGRhdGEgYWZ0ZXJcbiAqIGNhbGxpbmcgdGhpcyBmdW5jdGlvbi5cbiAqXG4gKiBgYGBqc1xuICogLy8gd3JpdGUgZmxvYXQzMiB1c2luZyBEYXRhVmlld1xuICogY29uc3QgZHYgPSB3cml0ZU9uRGF0YVZpZXcoZW5jb2RlciwgNClcbiAqIGR2LnNldEZsb2F0MzIoMCwgMS4xKVxuICogLy8gcmVhZCBmbG9hdDMyIHVzaW5nIERhdGFWaWV3XG4gKiBjb25zdCBkdiA9IHJlYWRGcm9tRGF0YVZpZXcoZW5jb2RlciwgNClcbiAqIGR2LmdldEZsb2F0MzIoMCkgLy8gPT4gMS4xMDAwMDAwMjM4NDE4NTggKGxlYXZpbmcgaXQgdG8gdGhlIHJlYWRlciB0byBmaW5kIG91dCB3aHkgdGhpcyBpcyB0aGUgY29ycmVjdCByZXN1bHQpXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAqIEByZXR1cm4ge0RhdGFWaWV3fVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVPbkRhdGFWaWV3ID0gKGVuY29kZXIsIGxlbikgPT4ge1xuICB2ZXJpZnlMZW4oZW5jb2RlciwgbGVuKVxuICBjb25zdCBkdmlldyA9IG5ldyBEYXRhVmlldyhlbmNvZGVyLmNidWYuYnVmZmVyLCBlbmNvZGVyLmNwb3MsIGxlbilcbiAgZW5jb2Rlci5jcG9zICs9IGxlblxuICByZXR1cm4gZHZpZXdcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0VuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1cbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlRmxvYXQzMiA9IChlbmNvZGVyLCBudW0pID0+IHdyaXRlT25EYXRhVmlldyhlbmNvZGVyLCA0KS5zZXRGbG9hdDMyKDAsIG51bSwgZmFsc2UpXG5cbi8qKlxuICogQHBhcmFtIHtFbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZUZsb2F0NjQgPSAoZW5jb2RlciwgbnVtKSA9PiB3cml0ZU9uRGF0YVZpZXcoZW5jb2RlciwgOCkuc2V0RmxvYXQ2NCgwLCBudW0sIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtiaWdpbnR9IG51bVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVCaWdJbnQ2NCA9IChlbmNvZGVyLCBudW0pID0+IC8qKiBAdHlwZSB7YW55fSAqLyAod3JpdGVPbkRhdGFWaWV3KGVuY29kZXIsIDgpKS5zZXRCaWdJbnQ2NCgwLCBudW0sIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtiaWdpbnR9IG51bVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVCaWdVaW50NjQgPSAoZW5jb2RlciwgbnVtKSA9PiAvKiogQHR5cGUge2FueX0gKi8gKHdyaXRlT25EYXRhVmlldyhlbmNvZGVyLCA4KSkuc2V0QmlnVWludDY0KDAsIG51bSwgZmFsc2UpXG5cbmNvbnN0IGZsb2F0VGVzdEJlZCA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoNCkpXG4vKipcbiAqIENoZWNrIGlmIGEgbnVtYmVyIGNhbiBiZSBlbmNvZGVkIGFzIGEgMzIgYml0IGZsb2F0LlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGlzRmxvYXQzMiA9IG51bSA9PiB7XG4gIGZsb2F0VGVzdEJlZC5zZXRGbG9hdDMyKDAsIG51bSlcbiAgcmV0dXJuIGZsb2F0VGVzdEJlZC5nZXRGbG9hdDMyKDApID09PSBudW1cbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7QXJyYXk8QW55RW5jb2RhYmxlPn0gQW55RW5jb2RhYmxlQXJyYXlcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHt1bmRlZmluZWR8bnVsbHxudW1iZXJ8YmlnaW50fGJvb2xlYW58c3RyaW5nfHtbazpzdHJpbmddOkFueUVuY29kYWJsZX18QW55RW5jb2RhYmxlQXJyYXl8VWludDhBcnJheX0gQW55RW5jb2RhYmxlXG4gKi9cblxuLyoqXG4gKiBFbmNvZGUgZGF0YSB3aXRoIGVmZmljaWVudCBiaW5hcnkgZm9ybWF0LlxuICpcbiAqIERpZmZlcmVuY2VzIHRvIEpTT046XG4gKiBcdTIwMjIgVHJhbnNmb3JtcyBkYXRhIHRvIGEgYmluYXJ5IGZvcm1hdCAobm90IHRvIGEgc3RyaW5nKVxuICogXHUyMDIyIEVuY29kZXMgdW5kZWZpbmVkLCBOYU4sIGFuZCBBcnJheUJ1ZmZlciAodGhlc2UgY2FuJ3QgYmUgcmVwcmVzZW50ZWQgaW4gSlNPTilcbiAqIFx1MjAyMiBOdW1iZXJzIGFyZSBlZmZpY2llbnRseSBlbmNvZGVkIGVpdGhlciBhcyBhIHZhcmlhYmxlIGxlbmd0aCBpbnRlZ2VyLCBhcyBhXG4gKiAgIDMyIGJpdCBmbG9hdCwgYXMgYSA2NCBiaXQgZmxvYXQsIG9yIGFzIGEgNjQgYml0IGJpZ2ludC5cbiAqXG4gKiBFbmNvZGluZyB0YWJsZTpcbiAqXG4gKiB8IERhdGEgVHlwZSAgICAgICAgICAgfCBQcmVmaXggICB8IEVuY29kaW5nIE1ldGhvZCAgICB8IENvbW1lbnQgfFxuICogfCAtLS0tLS0tLS0tLS0tLS0tLS0tIHwgLS0tLS0tLS0gfCAtLS0tLS0tLS0tLS0tLS0tLS0gfCAtLS0tLS0tIHxcbiAqIHwgdW5kZWZpbmVkICAgICAgICAgICB8IDEyNyAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgRnVuY3Rpb25zLCBzeW1ib2wsIGFuZCBldmVyeXRoaW5nIHRoYXQgY2Fubm90IGJlIGlkZW50aWZpZWQgaXMgZW5jb2RlZCBhcyB1bmRlZmluZWQgfFxuICogfCBudWxsICAgICAgICAgICAgICAgIHwgMTI2ICAgICAgfCAgICAgICAgICAgICAgICAgICAgfCB8XG4gKiB8IGludGVnZXIgICAgICAgICAgICAgfCAxMjUgICAgICB8IHdyaXRlVmFySW50ICAgICAgICB8IE9ubHkgZW5jb2RlcyAzMiBiaXQgc2lnbmVkIGludGVnZXJzIHxcbiAqIHwgZmxvYXQzMiAgICAgICAgICAgICB8IDEyNCAgICAgIHwgd3JpdGVGbG9hdDMyICAgICAgIHwgfFxuICogfCBmbG9hdDY0ICAgICAgICAgICAgIHwgMTIzICAgICAgfCB3cml0ZUZsb2F0NjQgICAgICAgfCB8XG4gKiB8IGJpZ2ludCAgICAgICAgICAgICAgfCAxMjIgICAgICB8IHdyaXRlQmlnSW50NjQgICAgICB8IHxcbiAqIHwgYm9vbGVhbiAoZmFsc2UpICAgICB8IDEyMSAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgVHJ1ZSBhbmQgZmFsc2UgYXJlIGRpZmZlcmVudCBkYXRhIHR5cGVzIHNvIHdlIHNhdmUgdGhlIGZvbGxvd2luZyBieXRlIHxcbiAqIHwgYm9vbGVhbiAodHJ1ZSkgICAgICB8IDEyMCAgICAgIHwgICAgICAgICAgICAgICAgICAgIHwgLSAwYjAxMTExMDAwIHNvIHRoZSBsYXN0IGJpdCBkZXRlcm1pbmVzIHdoZXRoZXIgdHJ1ZSBvciBmYWxzZSB8XG4gKiB8IHN0cmluZyAgICAgICAgICAgICAgfCAxMTkgICAgICB8IHdyaXRlVmFyU3RyaW5nICAgICB8IHxcbiAqIHwgb2JqZWN0PHN0cmluZyxhbnk+ICB8IDExOCAgICAgIHwgY3VzdG9tICAgICAgICAgICAgIHwgV3JpdGVzIHtsZW5ndGh9IHRoZW4ge2xlbmd0aH0ga2V5LXZhbHVlIHBhaXJzIHxcbiAqIHwgYXJyYXk8YW55PiAgICAgICAgICB8IDExNyAgICAgIHwgY3VzdG9tICAgICAgICAgICAgIHwgV3JpdGVzIHtsZW5ndGh9IHRoZW4ge2xlbmd0aH0ganNvbiB2YWx1ZXMgfFxuICogfCBVaW50OEFycmF5ICAgICAgICAgIHwgMTE2ICAgICAgfCB3cml0ZVZhclVpbnQ4QXJyYXkgfCBXZSB1c2UgVWludDhBcnJheSBmb3IgYW55IGtpbmQgb2YgYmluYXJ5IGRhdGEgfFxuICpcbiAqIFJlYXNvbnMgZm9yIHRoZSBkZWNyZWFzaW5nIHByZWZpeDpcbiAqIFdlIG5lZWQgdGhlIGZpcnN0IGJpdCBmb3IgZXh0ZW5kYWJpbGl0eSAobGF0ZXIgd2UgbWF5IHdhbnQgdG8gZW5jb2RlIHRoZVxuICogcHJlZml4IHdpdGggd3JpdGVWYXJVaW50KS4gVGhlIHJlbWFpbmluZyA3IGJpdHMgYXJlIGRpdmlkZWQgYXMgZm9sbG93czpcbiAqIFswLTMwXSAgIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGRhdGEgcmFuZ2UgaXMgdXNlZCBmb3IgY3VzdG9tIHB1cnBvc2VzXG4gKiAgICAgICAgICAoZGVmaW5lZCBieSB0aGUgZnVuY3Rpb24gdGhhdCB1c2VzIHRoaXMgbGlicmFyeSlcbiAqIFszMS0xMjddIHRoZSBlbmQgb2YgdGhlIGRhdGEgcmFuZ2UgaXMgdXNlZCBmb3IgZGF0YSBlbmNvZGluZyBieVxuICogICAgICAgICAgbGliMC9lbmNvZGluZy5qc1xuICpcbiAqIEBwYXJhbSB7RW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtBbnlFbmNvZGFibGV9IGRhdGFcbiAqL1xuZXhwb3J0IGNvbnN0IHdyaXRlQW55ID0gKGVuY29kZXIsIGRhdGEpID0+IHtcbiAgc3dpdGNoICh0eXBlb2YgZGF0YSkge1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAvLyBUWVBFIDExOTogU1RSSU5HXG4gICAgICB3cml0ZShlbmNvZGVyLCAxMTkpXG4gICAgICB3cml0ZVZhclN0cmluZyhlbmNvZGVyLCBkYXRhKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgaWYgKG51bWJlci5pc0ludGVnZXIoZGF0YSkgJiYgbWF0aC5hYnMoZGF0YSkgPD0gYmluYXJ5LkJJVFMzMSkge1xuICAgICAgICAvLyBUWVBFIDEyNTogSU5URUdFUlxuICAgICAgICB3cml0ZShlbmNvZGVyLCAxMjUpXG4gICAgICAgIHdyaXRlVmFySW50KGVuY29kZXIsIGRhdGEpXG4gICAgICB9IGVsc2UgaWYgKGlzRmxvYXQzMihkYXRhKSkge1xuICAgICAgICAvLyBUWVBFIDEyNDogRkxPQVQzMlxuICAgICAgICB3cml0ZShlbmNvZGVyLCAxMjQpXG4gICAgICAgIHdyaXRlRmxvYXQzMihlbmNvZGVyLCBkYXRhKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVFlQRSAxMjM6IEZMT0FUNjRcbiAgICAgICAgd3JpdGUoZW5jb2RlciwgMTIzKVxuICAgICAgICB3cml0ZUZsb2F0NjQoZW5jb2RlciwgZGF0YSlcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmlnaW50JzpcbiAgICAgIC8vIFRZUEUgMTIyOiBCaWdJbnRcbiAgICAgIHdyaXRlKGVuY29kZXIsIDEyMilcbiAgICAgIHdyaXRlQmlnSW50NjQoZW5jb2RlciwgZGF0YSlcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgIGlmIChkYXRhID09PSBudWxsKSB7XG4gICAgICAgIC8vIFRZUEUgMTI2OiBudWxsXG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDEyNilcbiAgICAgIH0gZWxzZSBpZiAoYXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAvLyBUWVBFIDExNzogQXJyYXlcbiAgICAgICAgd3JpdGUoZW5jb2RlciwgMTE3KVxuICAgICAgICB3cml0ZVZhclVpbnQoZW5jb2RlciwgZGF0YS5sZW5ndGgpXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHdyaXRlQW55KGVuY29kZXIsIGRhdGFbaV0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgLy8gVFlQRSAxMTY6IEFycmF5QnVmZmVyXG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDExNilcbiAgICAgICAgd3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIGRhdGEpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUWVBFIDExODogT2JqZWN0XG4gICAgICAgIHdyaXRlKGVuY29kZXIsIDExOClcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGRhdGEpXG4gICAgICAgIHdyaXRlVmFyVWludChlbmNvZGVyLCBrZXlzLmxlbmd0aClcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0ga2V5c1tpXVxuICAgICAgICAgIHdyaXRlVmFyU3RyaW5nKGVuY29kZXIsIGtleSlcbiAgICAgICAgICB3cml0ZUFueShlbmNvZGVyLCBkYXRhW2tleV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAvLyBUWVBFIDEyMC8xMjE6IGJvb2xlYW4gKHRydWUvZmFsc2UpXG4gICAgICB3cml0ZShlbmNvZGVyLCBkYXRhID8gMTIwIDogMTIxKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gVFlQRSAxMjc6IHVuZGVmaW5lZFxuICAgICAgd3JpdGUoZW5jb2RlciwgMTI3KVxuICB9XG59XG5cbi8qKlxuICogTm93IGNvbWUgYSBmZXcgc3RhdGVmdWwgZW5jb2RlciB0aGF0IGhhdmUgdGhlaXIgb3duIGNsYXNzZXMuXG4gKi9cblxuLyoqXG4gKiBCYXNpYyBSdW4gTGVuZ3RoIEVuY29kZXIgLSBhIGJhc2ljIGNvbXByZXNzaW9uIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIEVuY29kZXMgWzEsMSwxLDddIHRvIFsxLDMsNywxXSAoMyB0aW1lcyAxLCAxIHRpbWUgNykuIFRoaXMgZW5jb2RlciBtaWdodCBkbyBtb3JlIGhhcm0gdGhhbiBnb29kIGlmIHRoZXJlIGFyZSBhIGxvdCBvZiB2YWx1ZXMgdGhhdCBhcmUgbm90IHJlcGVhdGVkLlxuICpcbiAqIEl0IHdhcyBvcmlnaW5hbGx5IHVzZWQgZm9yIGltYWdlIGNvbXByZXNzaW9uLiBDb29sIC4uIGFydGljbGUgaHR0cDovL2NzYnJ1Y2UuY29tL2NibS90cmFuc2FjdG9yL3BkZnMvdHJhbnNfdjdfaTA2LnBkZlxuICpcbiAqIEBub3RlIFQgbXVzdCBub3QgYmUgbnVsbCFcbiAqXG4gKiBAdGVtcGxhdGUgVFxuICovXG5leHBvcnQgY2xhc3MgUmxlRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtmdW5jdGlvbihFbmNvZGVyLCBUKTp2b2lkfSB3cml0ZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yICh3cml0ZXIpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogVGhlIHdyaXRlclxuICAgICAqL1xuICAgIHRoaXMudyA9IHdyaXRlclxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7VHxudWxsfVxuICAgICAqL1xuICAgIHRoaXMucyA9IG51bGxcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VH0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zID09PSB2KSB7XG4gICAgICB0aGlzLmNvdW50KytcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuY291bnQgPiAwKSB7XG4gICAgICAgIC8vIGZsdXNoIGNvdW50ZXIsIHVubGVzcyB0aGlzIGlzIHRoZSBmaXJzdCB2YWx1ZSAoY291bnQgPSAwKVxuICAgICAgICB3cml0ZVZhclVpbnQodGhpcywgdGhpcy5jb3VudCAtIDEpIC8vIHNpbmNlIGNvdW50IGlzIGFsd2F5cyA+IDAsIHdlIGNhbiBkZWNyZW1lbnQgYnkgb25lLiBub24tc3RhbmRhcmQgZW5jb2RpbmcgZnR3XG4gICAgICB9XG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgLy8gd3JpdGUgZmlyc3QgdmFsdWVcbiAgICAgIHRoaXMudyh0aGlzLCB2KVxuICAgICAgdGhpcy5zID0gdlxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJhc2ljIGRpZmYgZGVjb2RlciB1c2luZyB2YXJpYWJsZSBsZW5ndGggZW5jb2RpbmcuXG4gKlxuICogRW5jb2RlcyB0aGUgdmFsdWVzIFszLCAxMTAwLCAxMTAxLCAxMDUwLCAwXSB0byBbMywgMTA5NywgMSwgLTUxLCAtMTA1MF0gdXNpbmcgd3JpdGVWYXJJbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnREaWZmRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc3RhcnQpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQ3VycmVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gc3RhcnRcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICB3cml0ZVZhckludCh0aGlzLCB2IC0gdGhpcy5zKVxuICAgIHRoaXMucyA9IHZcbiAgfVxufVxuXG4vKipcbiAqIEEgY29tYmluYXRpb24gb2YgSW50RGlmZkVuY29kZXIgYW5kIFJsZUVuY29kZXIuXG4gKlxuICogQmFzaWNhbGx5IGZpcnN0IHdyaXRlcyB0aGUgSW50RGlmZkVuY29kZXIgYW5kIHRoZW4gY291bnRzIGR1cGxpY2F0ZSBkaWZmcyB1c2luZyBSbGVFbmNvZGluZy5cbiAqXG4gKiBFbmNvZGVzIHRoZSB2YWx1ZXMgWzEsMSwxLDIsMyw0LDUsNl0gYXMgWzEsMSwwLDIsMSw1XSAoUkxFKFsxLDAsMCwxLDEsMSwxLDFdKSBcdTIxRDIgUmxlSW50RGlmZlsxLDEsMCwyLDEsNV0pXG4gKi9cbmV4cG9ydCBjbGFzcyBSbGVJbnREaWZmRW5jb2RlciBleHRlbmRzIEVuY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc3RhcnQpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQ3VycmVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gc3RhcnRcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2XG4gICAqL1xuICB3cml0ZSAodikge1xuICAgIGlmICh0aGlzLnMgPT09IHYgJiYgdGhpcy5jb3VudCA+IDApIHtcbiAgICAgIHRoaXMuY291bnQrK1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5jb3VudCA+IDApIHtcbiAgICAgICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgICAgIHdyaXRlVmFyVWludCh0aGlzLCB0aGlzLmNvdW50IC0gMSkgLy8gc2luY2UgY291bnQgaXMgYWx3YXlzID4gMCwgd2UgY2FuIGRlY3JlbWVudCBieSBvbmUuIG5vbi1zdGFuZGFyZCBlbmNvZGluZyBmdHdcbiAgICAgIH1cbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICAvLyB3cml0ZSBmaXJzdCB2YWx1ZVxuICAgICAgd3JpdGVWYXJJbnQodGhpcywgdiAtIHRoaXMucylcbiAgICAgIHRoaXMucyA9IHZcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnRPcHRSbGVFbmNvZGVyfSBlbmNvZGVyXG4gKi9cbmNvbnN0IGZsdXNoVWludE9wdFJsZUVuY29kZXIgPSBlbmNvZGVyID0+IHtcbiAgaWYgKGVuY29kZXIuY291bnQgPiAwKSB7XG4gICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgLy8gY2FzZSAxOiBqdXN0IGEgc2luZ2xlIHZhbHVlLiBzZXQgc2lnbiB0byBwb3NpdGl2ZVxuICAgIC8vIGNhc2UgMjogd3JpdGUgc2V2ZXJhbCB2YWx1ZXMuIHNldCBzaWduIHRvIG5lZ2F0aXZlIHRvIGluZGljYXRlIHRoYXQgdGhlcmUgaXMgYSBsZW5ndGggY29taW5nXG4gICAgd3JpdGVWYXJJbnQoZW5jb2Rlci5lbmNvZGVyLCBlbmNvZGVyLmNvdW50ID09PSAxID8gZW5jb2Rlci5zIDogLWVuY29kZXIucylcbiAgICBpZiAoZW5jb2Rlci5jb3VudCA+IDEpIHtcbiAgICAgIHdyaXRlVmFyVWludChlbmNvZGVyLmVuY29kZXIsIGVuY29kZXIuY291bnQgLSAyKSAvLyBzaW5jZSBjb3VudCBpcyBhbHdheXMgPiAxLCB3ZSBjYW4gZGVjcmVtZW50IGJ5IG9uZS4gbm9uLXN0YW5kYXJkIGVuY29kaW5nIGZ0d1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE9wdGltaXplZCBSbGUgZW5jb2RlciB0aGF0IGRvZXMgbm90IHN1ZmZlciBmcm9tIHRoZSBtZW50aW9uZWQgcHJvYmxlbSBvZiB0aGUgYmFzaWMgUmxlIGVuY29kZXIuXG4gKlxuICogSW50ZXJuYWxseSB1c2VzIFZhckludCBlbmNvZGVyIHRvIHdyaXRlIHVuc2lnbmVkIGludGVnZXJzLiBJZiB0aGUgaW5wdXQgb2NjdXJzIG11bHRpcGxlIHRpbWVzLCB3ZSB3cml0ZVxuICogd3JpdGUgaXQgYXMgYSBuZWdhdGl2ZSBudW1iZXIuIFRoZSBVaW50T3B0UmxlRGVjb2RlciB0aGVuIHVuZGVyc3RhbmRzIHRoYXQgaXQgbmVlZHMgdG8gcmVhZCBhIGNvdW50LlxuICpcbiAqIEVuY29kZXMgWzEsMiwzLDMsM10gYXMgWzEsMiwtMywzXSAob25jZSAxLCBvbmNlIDIsIHRocmVlIHRpbWVzIDMpXG4gKi9cbmV4cG9ydCBjbGFzcyBVaW50T3B0UmxlRW5jb2RlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmVuY29kZXIgPSBuZXcgRW5jb2RlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zID09PSB2KSB7XG4gICAgICB0aGlzLmNvdW50KytcbiAgICB9IGVsc2Uge1xuICAgICAgZmx1c2hVaW50T3B0UmxlRW5jb2Rlcih0aGlzKVxuICAgICAgdGhpcy5jb3VudCA9IDFcbiAgICAgIHRoaXMucyA9IHZcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmx1c2ggdGhlIGVuY29kZWQgc3RhdGUgYW5kIHRyYW5zZm9ybSB0aGlzIHRvIGEgVWludDhBcnJheS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoaXMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIG9uY2UuXG4gICAqL1xuICB0b1VpbnQ4QXJyYXkgKCkge1xuICAgIGZsdXNoVWludE9wdFJsZUVuY29kZXIodGhpcylcbiAgICByZXR1cm4gdG9VaW50OEFycmF5KHRoaXMuZW5jb2RlcilcbiAgfVxufVxuXG4vKipcbiAqIEluY3JlYXNpbmcgVWludCBPcHRpbWl6ZWQgUkxFIEVuY29kZXJcbiAqXG4gKiBUaGUgUkxFIGVuY29kZXIgY291bnRzIHRoZSBudW1iZXIgb2Ygc2FtZSBvY2N1cmVuY2VzIG9mIHRoZSBzYW1lIHZhbHVlLlxuICogVGhlIEluY1VpbnRPcHRSbGUgZW5jb2RlciBjb3VudHMgaWYgdGhlIHZhbHVlIGluY3JlYXNlcy5cbiAqIEkuZS4gNywgOCwgOSwgMTAgd2lsbCBiZSBlbmNvZGVkIGFzIFstNywgNF0uIDEsIDMsIDUgd2lsbCBiZSBlbmNvZGVkXG4gKiBhcyBbMSwgMywgNV0uXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmNVaW50T3B0UmxlRW5jb2RlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmVuY29kZXIgPSBuZXcgRW5jb2RlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdlxuICAgKi9cbiAgd3JpdGUgKHYpIHtcbiAgICBpZiAodGhpcy5zICsgdGhpcy5jb3VudCA9PT0gdikge1xuICAgICAgdGhpcy5jb3VudCsrXG4gICAgfSBlbHNlIHtcbiAgICAgIGZsdXNoVWludE9wdFJsZUVuY29kZXIodGhpcylcbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICB0aGlzLnMgPSB2XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZsdXNoIHRoZSBlbmNvZGVkIHN0YXRlIGFuZCB0cmFuc2Zvcm0gdGhpcyB0byBhIFVpbnQ4QXJyYXkuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGlzIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBvbmNlLlxuICAgKi9cbiAgdG9VaW50OEFycmF5ICgpIHtcbiAgICBmbHVzaFVpbnRPcHRSbGVFbmNvZGVyKHRoaXMpXG4gICAgcmV0dXJuIHRvVWludDhBcnJheSh0aGlzLmVuY29kZXIpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0ludERpZmZPcHRSbGVFbmNvZGVyfSBlbmNvZGVyXG4gKi9cbmNvbnN0IGZsdXNoSW50RGlmZk9wdFJsZUVuY29kZXIgPSBlbmNvZGVyID0+IHtcbiAgaWYgKGVuY29kZXIuY291bnQgPiAwKSB7XG4gICAgLy8gICAgICAgICAgMzEgYml0IG1ha2luZyB1cCB0aGUgZGlmZiB8IHdldGhlciB0byB3cml0ZSB0aGUgY291bnRlclxuICAgIC8vIGNvbnN0IGVuY29kZWREaWZmID0gZW5jb2Rlci5kaWZmIDw8IDEgfCAoZW5jb2Rlci5jb3VudCA9PT0gMSA/IDAgOiAxKVxuICAgIGNvbnN0IGVuY29kZWREaWZmID0gZW5jb2Rlci5kaWZmICogMiArIChlbmNvZGVyLmNvdW50ID09PSAxID8gMCA6IDEpXG4gICAgLy8gZmx1c2ggY291bnRlciwgdW5sZXNzIHRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIChjb3VudCA9IDApXG4gICAgLy8gY2FzZSAxOiBqdXN0IGEgc2luZ2xlIHZhbHVlLiBzZXQgZmlyc3QgYml0IHRvIHBvc2l0aXZlXG4gICAgLy8gY2FzZSAyOiB3cml0ZSBzZXZlcmFsIHZhbHVlcy4gc2V0IGZpcnN0IGJpdCB0byBuZWdhdGl2ZSB0byBpbmRpY2F0ZSB0aGF0IHRoZXJlIGlzIGEgbGVuZ3RoIGNvbWluZ1xuICAgIHdyaXRlVmFySW50KGVuY29kZXIuZW5jb2RlciwgZW5jb2RlZERpZmYpXG4gICAgaWYgKGVuY29kZXIuY291bnQgPiAxKSB7XG4gICAgICB3cml0ZVZhclVpbnQoZW5jb2Rlci5lbmNvZGVyLCBlbmNvZGVyLmNvdW50IC0gMikgLy8gc2luY2UgY291bnQgaXMgYWx3YXlzID4gMSwgd2UgY2FuIGRlY3JlbWVudCBieSBvbmUuIG5vbi1zdGFuZGFyZCBlbmNvZGluZyBmdHdcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNvbWJpbmF0aW9uIG9mIHRoZSBJbnREaWZmRW5jb2RlciBhbmQgdGhlIFVpbnRPcHRSbGVFbmNvZGVyLlxuICpcbiAqIFRoZSBjb3VudCBhcHByb2FjaCBpcyBzaW1pbGFyIHRvIHRoZSBVaW50RGlmZk9wdFJsZUVuY29kZXIsIGJ1dCBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBuZWdhdGl2ZSBiaXRmbGFnLCBpdCBlbmNvZGVzXG4gKiBpbiB0aGUgTFNCIHdoZXRoZXIgYSBjb3VudCBpcyB0byBiZSByZWFkLiBUaGVyZWZvcmUgdGhpcyBFbmNvZGVyIG9ubHkgc3VwcG9ydHMgMzEgYml0IGludGVnZXJzIVxuICpcbiAqIEVuY29kZXMgWzEsIDIsIDMsIDJdIGFzIFszLCAxLCA2LCAtMV0gKG1vcmUgc3BlY2lmaWNhbGx5IFsoMSA8PCAxKSB8IDEsICgzIDw8IDApIHwgMCwgLTFdKVxuICpcbiAqIEludGVybmFsbHkgdXNlcyB2YXJpYWJsZSBsZW5ndGggZW5jb2RpbmcuIENvbnRyYXJ5IHRvIG5vcm1hbCBVaW50VmFyIGVuY29kaW5nLCB0aGUgZmlyc3QgYnl0ZSBjb250YWluczpcbiAqICogMSBiaXQgdGhhdCBkZW5vdGVzIHdoZXRoZXIgdGhlIG5leHQgdmFsdWUgaXMgYSBjb3VudCAoTFNCKVxuICogKiAxIGJpdCB0aGF0IGRlbm90ZXMgd2hldGhlciB0aGlzIHZhbHVlIGlzIG5lZ2F0aXZlIChNU0IgLSAxKVxuICogKiAxIGJpdCB0aGF0IGRlbm90ZXMgd2hldGhlciB0byBjb250aW51ZSByZWFkaW5nIHRoZSB2YXJpYWJsZSBsZW5ndGggaW50ZWdlciAoTVNCKVxuICpcbiAqIFRoZXJlZm9yZSwgb25seSBmaXZlIGJpdHMgcmVtYWluIHRvIGVuY29kZSBkaWZmIHJhbmdlcy5cbiAqXG4gKiBVc2UgdGhpcyBFbmNvZGVyIG9ubHkgd2hlbiBhcHByb3ByaWF0ZS4gSW4gbW9zdCBjYXNlcywgdGhpcyBpcyBwcm9iYWJseSBhIGJhZCBpZGVhLlxuICovXG5leHBvcnQgY2xhc3MgSW50RGlmZk9wdFJsZUVuY29kZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5lbmNvZGVyID0gbmV3IEVuY29kZXIoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zID0gMFxuICAgIHRoaXMuY291bnQgPSAwXG4gICAgdGhpcy5kaWZmID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2XG4gICAqL1xuICB3cml0ZSAodikge1xuICAgIGlmICh0aGlzLmRpZmYgPT09IHYgLSB0aGlzLnMpIHtcbiAgICAgIHRoaXMucyA9IHZcbiAgICAgIHRoaXMuY291bnQrK1xuICAgIH0gZWxzZSB7XG4gICAgICBmbHVzaEludERpZmZPcHRSbGVFbmNvZGVyKHRoaXMpXG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgdGhpcy5kaWZmID0gdiAtIHRoaXMuc1xuICAgICAgdGhpcy5zID0gdlxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGbHVzaCB0aGUgZW5jb2RlZCBzdGF0ZSBhbmQgdHJhbnNmb3JtIHRoaXMgdG8gYSBVaW50OEFycmF5LlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhpcyBzaG91bGQgb25seSBiZSBjYWxsZWQgb25jZS5cbiAgICovXG4gIHRvVWludDhBcnJheSAoKSB7XG4gICAgZmx1c2hJbnREaWZmT3B0UmxlRW5jb2Rlcih0aGlzKVxuICAgIHJldHVybiB0b1VpbnQ4QXJyYXkodGhpcy5lbmNvZGVyKVxuICB9XG59XG5cbi8qKlxuICogT3B0aW1pemVkIFN0cmluZyBFbmNvZGVyLlxuICpcbiAqIEVuY29kaW5nIG1hbnkgc21hbGwgc3RyaW5ncyBpbiBhIHNpbXBsZSBFbmNvZGVyIGlzIG5vdCB2ZXJ5IGVmZmljaWVudC4gVGhlIGZ1bmN0aW9uIGNhbGwgdG8gZGVjb2RlIGEgc3RyaW5nIHRha2VzIHNvbWUgdGltZSBhbmQgY3JlYXRlcyByZWZlcmVuY2VzIHRoYXQgbXVzdCBiZSBldmVudHVhbGx5IGRlbGV0ZWQuXG4gKiBJbiBwcmFjdGljZSwgd2hlbiBkZWNvZGluZyBzZXZlcmFsIG1pbGxpb24gc21hbGwgc3RyaW5ncywgdGhlIEdDIHdpbGwga2ljayBpbiBtb3JlIGFuZCBtb3JlIG9mdGVuIHRvIGNvbGxlY3Qgb3JwaGFuZWQgc3RyaW5nIG9iamVjdHMgKG9yIG1heWJlIHRoZXJlIGlzIGFub3RoZXIgcmVhc29uPykuXG4gKlxuICogVGhpcyBzdHJpbmcgZW5jb2RlciBzb2x2ZXMgdGhlIGFib3ZlIHByb2JsZW0uIEFsbCBzdHJpbmdzIGFyZSBjb25jYXRlbmF0ZWQgYW5kIHdyaXR0ZW4gYXMgYSBzaW5nbGUgc3RyaW5nIHVzaW5nIGEgc2luZ2xlIGVuY29kaW5nIGNhbGwuXG4gKlxuICogVGhlIGxlbmd0aHMgYXJlIGVuY29kZWQgdXNpbmcgYSBVaW50T3B0UmxlRW5jb2Rlci5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0cmluZ0VuY29kZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PHN0cmluZz59XG4gICAgICovXG4gICAgdGhpcy5zYXJyID0gW11cbiAgICB0aGlzLnMgPSAnJ1xuICAgIHRoaXMubGVuc0UgPSBuZXcgVWludE9wdFJsZUVuY29kZXIoKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmdcbiAgICovXG4gIHdyaXRlIChzdHJpbmcpIHtcbiAgICB0aGlzLnMgKz0gc3RyaW5nXG4gICAgaWYgKHRoaXMucy5sZW5ndGggPiAxOSkge1xuICAgICAgdGhpcy5zYXJyLnB1c2godGhpcy5zKVxuICAgICAgdGhpcy5zID0gJydcbiAgICB9XG4gICAgdGhpcy5sZW5zRS53cml0ZShzdHJpbmcubGVuZ3RoKVxuICB9XG5cbiAgdG9VaW50OEFycmF5ICgpIHtcbiAgICBjb25zdCBlbmNvZGVyID0gbmV3IEVuY29kZXIoKVxuICAgIHRoaXMuc2Fyci5wdXNoKHRoaXMucylcbiAgICB0aGlzLnMgPSAnJ1xuICAgIHdyaXRlVmFyU3RyaW5nKGVuY29kZXIsIHRoaXMuc2Fyci5qb2luKCcnKSlcbiAgICB3cml0ZVVpbnQ4QXJyYXkoZW5jb2RlciwgdGhpcy5sZW5zRS50b1VpbnQ4QXJyYXkoKSlcbiAgICByZXR1cm4gdG9VaW50OEFycmF5KGVuY29kZXIpXG4gIH1cbn1cbiIsICIvKipcbiAqIEVmZmljaWVudCBzY2hlbWEtbGVzcyBiaW5hcnkgZGVjb2Rpbmcgd2l0aCBzdXBwb3J0IGZvciB2YXJpYWJsZSBsZW5ndGggZW5jb2RpbmcuXG4gKlxuICogVXNlIFtsaWIwL2RlY29kaW5nXSB3aXRoIFtsaWIwL2VuY29kaW5nXS4gRXZlcnkgZW5jb2RpbmcgZnVuY3Rpb24gaGFzIGEgY29ycmVzcG9uZGluZyBkZWNvZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBFbmNvZGVzIG51bWJlcnMgaW4gbGl0dGxlLWVuZGlhbiBvcmRlciAobGVhc3QgdG8gbW9zdCBzaWduaWZpY2FudCBieXRlIG9yZGVyKVxuICogYW5kIGlzIGNvbXBhdGlibGUgd2l0aCBHb2xhbmcncyBiaW5hcnkgZW5jb2RpbmcgKGh0dHBzOi8vZ29sYW5nLm9yZy9wa2cvZW5jb2RpbmcvYmluYXJ5LylcbiAqIHdoaWNoIGlzIGFsc28gdXNlZCBpbiBQcm90b2NvbCBCdWZmZXJzLlxuICpcbiAqIGBgYGpzXG4gKiAvLyBlbmNvZGluZyBzdGVwXG4gKiBjb25zdCBlbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gKiBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgMjU2KVxuICogZW5jb2Rpbmcud3JpdGVWYXJTdHJpbmcoZW5jb2RlciwgJ0hlbGxvIHdvcmxkIScpXG4gKiBjb25zdCBidWYgPSBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlcilcbiAqIGBgYFxuICpcbiAqIGBgYGpzXG4gKiAvLyBkZWNvZGluZyBzdGVwXG4gKiBjb25zdCBkZWNvZGVyID0gZGVjb2RpbmcuY3JlYXRlRGVjb2RlcihidWYpXG4gKiBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyKSAvLyA9PiAyNTZcbiAqIGRlY29kaW5nLnJlYWRWYXJTdHJpbmcoZGVjb2RlcikgLy8gPT4gJ0hlbGxvIHdvcmxkISdcbiAqIGRlY29kaW5nLmhhc0NvbnRlbnQoZGVjb2RlcikgLy8gPT4gZmFsc2UgLSBhbGwgZGF0YSBpcyByZWFkXG4gKiBgYGBcbiAqXG4gKiBTZWN1cml0eTogRGVjb2RlcnMgcHJvY2VzcyB1bnRydXN0ZWQgaW5wdXQsIGFuZCBgZGVjb2Rlci5hcnJgIG1heSBiZSBhIHZpZXcgb24gYSBsYXJnZXIgKHBvc3NpYmx5IHBvb2xlZCkgQXJyYXlCdWZmZXIuXG4gKiBOZXZlciBjcmVhdGUgdmlld3MgdmlhIGBuZXcgVWludDhBcnJheShhcnIuYnVmZmVyLCAuLilgIC8gYG5ldyBEYXRhVmlldyhhcnIuYnVmZmVyLCAuLilgOyB1c2UgdGhlIHByaXZhdGUgYHN1YmFycmF5YCAvXG4gKiBgc3ViZGF0YXZpZXdgIGhlbHBlcnMsIHdoaWNoIHRocm93IG9uIG91dC1vZi1ib3VuZHMgYWNjZXNzIGluc3RlYWQgb2YgZXhwb3NpbmcgZm9yZWlnbiBtZW1vcnkuXG4gKlxuICogQG1vZHVsZSBkZWNvZGluZ1xuICovXG5cbmltcG9ydCAqIGFzIGJpbmFyeSBmcm9tICcuL2JpbmFyeS5qcydcbmltcG9ydCAqIGFzIG1hdGggZnJvbSAnLi9tYXRoLmpzJ1xuaW1wb3J0ICogYXMgbnVtYmVyIGZyb20gJy4vbnVtYmVyLmpzJ1xuaW1wb3J0ICogYXMgc3RyaW5nIGZyb20gJy4vc3RyaW5nLmpzJ1xuaW1wb3J0ICogYXMgZXJyb3IgZnJvbSAnLi9lcnJvci5qcydcbmltcG9ydCAqIGFzIGVuY29kaW5nIGZyb20gJy4vZW5jb2RpbmcuanMnXG5cbmNvbnN0IGVycm9yVW5leHBlY3RlZEVuZE9mQXJyYXkgPSBlcnJvci5jcmVhdGUoJ1VuZXhwZWN0ZWQgZW5kIG9mIGFycmF5JylcbmNvbnN0IGVycm9ySW50ZWdlck91dE9mUmFuZ2UgPSBlcnJvci5jcmVhdGUoJ0ludGVnZXIgb3V0IG9mIFJhbmdlJylcblxuLyoqXG4gKiBDcmVhdGUgYSB2aWV3IG9mIGBsZW5gIGJ5dGVzIG9mIGBhcnJgLCBzdGFydGluZyBhdCBgYmVnaW5gLiBUaHJvd3MgaWYgdGhlIHJhbmdlIGV4Y2VlZHMgYGFycmAuXG4gKlxuICogU2VjdXJpdHk6IEFsd2F5cyB1c2UgdGhpcyAob3IgYHN1YmRhdGF2aWV3YCkgaW5zdGVhZCBvZiBgbmV3IFVpbnQ4QXJyYXkoYXJyLmJ1ZmZlciwgLi4pYC4gYGFycmAgbWF5IGJlIGEgdmlldyBvbiBhXG4gKiBsYXJnZXIgKHBvc3NpYmx5IHNoYXJlZC9wb29sZWQpIEFycmF5QnVmZmVyLiBBbiB1bmNoZWNrZWQgdmlldyBjb3VsZCBleHBvc2UgbWVtb3J5IG91dHNpZGUgb2YgYGFycmAuXG4gKlxuICogQHRlbXBsYXRlIHtBcnJheUJ1ZmZlckxpa2V9IEJ1ZlxuICogQHBhcmFtIHtVaW50OEFycmF5PEJ1Zj59IGFyclxuICogQHBhcmFtIHtudW1iZXJ9IGJlZ2luXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5PEJ1Zj59XG4gKi9cbmNvbnN0IHN1YmFycmF5ID0gKGFyciwgYmVnaW4sIGxlbikgPT4ge1xuICBpZiAoYmVnaW4gPCAwIHx8IGxlbiA8IDAgfHwgYmVnaW4gKyBsZW4gPiBhcnIubGVuZ3RoKSB7XG4gICAgdGhyb3cgZXJyb3JVbmV4cGVjdGVkRW5kT2ZBcnJheVxuICB9XG4gIHJldHVybiBuZXcgVWludDhBcnJheShhcnIuYnVmZmVyLCBhcnIuYnl0ZU9mZnNldCArIGJlZ2luLCBsZW4pXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgRGF0YVZpZXcgb2YgYGxlbmAgYnl0ZXMgb2YgYGFycmAsIHN0YXJ0aW5nIGF0IGBiZWdpbmAuIFRocm93cyBpZiB0aGUgcmFuZ2UgZXhjZWVkcyBgYXJyYC5cbiAqXG4gKiBTZWN1cml0eTogU2VlIGBzdWJhcnJheWAuXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBhcnJcbiAqIEBwYXJhbSB7bnVtYmVyfSBiZWdpblxuICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICogQHJldHVybiB7RGF0YVZpZXd9XG4gKi9cbmNvbnN0IHN1YmRhdGF2aWV3ID0gKGFyciwgYmVnaW4sIGxlbikgPT4ge1xuICBpZiAoYmVnaW4gPCAwIHx8IGxlbiA8IDAgfHwgYmVnaW4gKyBsZW4gPiBhcnIubGVuZ3RoKSB7XG4gICAgdGhyb3cgZXJyb3JVbmV4cGVjdGVkRW5kT2ZBcnJheVxuICB9XG4gIHJldHVybiBuZXcgRGF0YVZpZXcoYXJyLmJ1ZmZlciwgYXJyLmJ5dGVPZmZzZXQgKyBiZWdpbiwgbGVuKVxufVxuXG4vKipcbiAqIEEgRGVjb2RlciBoYW5kbGVzIHRoZSBkZWNvZGluZyBvZiBhbiBVaW50OEFycmF5LlxuICogQHRlbXBsYXRlIHtBcnJheUJ1ZmZlckxpa2V9IFtCdWY9QXJyYXlCdWZmZXJMaWtlXVxuICovXG5leHBvcnQgY2xhc3MgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXk8QnVmPn0gdWludDhBcnJheSBCaW5hcnkgZGF0YSB0byBkZWNvZGVcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5KSB7XG4gICAgLyoqXG4gICAgICogRGVjb2RpbmcgdGFyZ2V0LlxuICAgICAqXG4gICAgICogQHR5cGUge1VpbnQ4QXJyYXk8QnVmPn1cbiAgICAgKi9cbiAgICB0aGlzLmFyciA9IHVpbnQ4QXJyYXlcbiAgICAvKipcbiAgICAgKiBDdXJyZW50IGRlY29kaW5nIHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnBvcyA9IDBcbiAgfVxufVxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHRlbXBsYXRlIHtBcnJheUJ1ZmZlckxpa2V9IEJ1ZlxuICogQHBhcmFtIHtVaW50OEFycmF5PEJ1Zj59IHVpbnQ4QXJyYXlcbiAqIEByZXR1cm4ge0RlY29kZXI8QnVmPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZURlY29kZXIgPSB1aW50OEFycmF5ID0+IG5ldyBEZWNvZGVyKHVpbnQ4QXJyYXkpXG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBoYXNDb250ZW50ID0gZGVjb2RlciA9PiBkZWNvZGVyLnBvcyAhPT0gZGVjb2Rlci5hcnIubGVuZ3RoXG5cbi8qKlxuICogQ2xvbmUgYSBkZWNvZGVyIGluc3RhbmNlLlxuICogT3B0aW9uYWxseSBzZXQgYSBuZXcgcG9zaXRpb24gcGFyYW1ldGVyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyIFRoZSBkZWNvZGVyIGluc3RhbmNlXG4gKiBAcGFyYW0ge251bWJlcn0gW25ld1Bvc10gRGVmYXVsdHMgdG8gY3VycmVudCBwb3NpdGlvblxuICogQHJldHVybiB7RGVjb2Rlcn0gQSBjbG9uZSBvZiBgZGVjb2RlcmBcbiAqL1xuZXhwb3J0IGNvbnN0IGNsb25lID0gKGRlY29kZXIsIG5ld1BvcyA9IGRlY29kZXIucG9zKSA9PiB7XG4gIGNvbnN0IF9kZWNvZGVyID0gY3JlYXRlRGVjb2RlcihkZWNvZGVyLmFycilcbiAgX2RlY29kZXIucG9zID0gbmV3UG9zXG4gIHJldHVybiBfZGVjb2RlclxufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBVaW50OEFycmF5IHZpZXcgb2YgdGhlIG5leHQgYGxlbmAgYnl0ZXMgYW5kIGFkdmFuY2UgdGhlIHBvc2l0aW9uIGJ5IGBsZW5gLlxuICpcbiAqIEltcG9ydGFudDogVGhlIFVpbnQ4QXJyYXkgc3RpbGwgcG9pbnRzIHRvIHRoZSB1bmRlcmx5aW5nIEFycmF5QnVmZmVyLiBNYWtlIHN1cmUgdG8gZGlzY2FyZCB0aGUgcmVzdWx0IGFzIHNvb24gYXMgcG9zc2libGUgdG8gcHJldmVudCBhbnkgbWVtb3J5IGxlYWtzLlxuICogICAgICAgICAgICBVc2UgYGJ1ZmZlci5jb3B5VWludDhBcnJheWAgdG8gY29weSB0aGUgcmVzdWx0IGludG8gYSBuZXcgVWludDhBcnJheS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSB7QXJyYXlCdWZmZXJMaWtlfSBCdWZcbiAqIEBwYXJhbSB7RGVjb2RlcjxCdWY+fSBkZWNvZGVyIFRoZSBkZWNvZGVyIGluc3RhbmNlXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuIFRoZSBsZW5ndGggb2YgYnl0ZXMgdG8gcmVhZFxuICogQHJldHVybiB7VWludDhBcnJheTxCdWY+fVxuICovXG5leHBvcnQgY29uc3QgcmVhZFVpbnQ4QXJyYXkgPSAoZGVjb2RlciwgbGVuKSA9PiB7XG4gIGNvbnN0IHZpZXcgPSBzdWJhcnJheShkZWNvZGVyLmFyciwgZGVjb2Rlci5wb3MsIGxlbilcbiAgZGVjb2Rlci5wb3MgKz0gbGVuXG4gIHJldHVybiB2aWV3XG59XG5cbi8qKlxuICogUmVhZCB2YXJpYWJsZSBsZW5ndGggVWludDhBcnJheS5cbiAqXG4gKiBJbXBvcnRhbnQ6IFRoZSBVaW50OEFycmF5IHN0aWxsIHBvaW50cyB0byB0aGUgdW5kZXJseWluZyBBcnJheUJ1ZmZlci4gTWFrZSBzdXJlIHRvIGRpc2NhcmQgdGhlIHJlc3VsdCBhcyBzb29uIGFzIHBvc3NpYmxlIHRvIHByZXZlbnQgYW55IG1lbW9yeSBsZWFrcy5cbiAqICAgICAgICAgICAgVXNlIGBidWZmZXIuY29weVVpbnQ4QXJyYXlgIHRvIGNvcHkgdGhlIHJlc3VsdCBpbnRvIGEgbmV3IFVpbnQ4QXJyYXkuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAdGVtcGxhdGUge0FycmF5QnVmZmVyTGlrZX0gQnVmXG4gKiBAcGFyYW0ge0RlY29kZXI8QnVmPn0gZGVjb2RlclxuICogQHJldHVybiB7VWludDhBcnJheTxCdWY+fVxuICovXG5leHBvcnQgY29uc3QgcmVhZFZhclVpbnQ4QXJyYXkgPSBkZWNvZGVyID0+IHJlYWRVaW50OEFycmF5KGRlY29kZXIsIHJlYWRWYXJVaW50KGRlY29kZXIpKVxuXG4vKipcbiAqIFJlYWQgdGhlIHJlc3Qgb2YgdGhlIGNvbnRlbnQgYXMgYW4gQXJyYXlCdWZmZXJcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fVxuICovXG5leHBvcnQgY29uc3QgcmVhZFRhaWxBc1VpbnQ4QXJyYXkgPSBkZWNvZGVyID0+IHJlYWRVaW50OEFycmF5KGRlY29kZXIsIGRlY29kZXIuYXJyLmxlbmd0aCAtIGRlY29kZXIucG9zKVxuXG4vKipcbiAqIFNraXAgb25lIGJ5dGUsIGp1bXAgdG8gdGhlIG5leHQgcG9zaXRpb24uXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlciBUaGUgZGVjb2RlciBpbnN0YW5jZVxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgbmV4dCBwb3NpdGlvblxuICovXG5leHBvcnQgY29uc3Qgc2tpcDggPSBkZWNvZGVyID0+IGRlY29kZXIucG9zKytcblxuLyoqXG4gKiBSZWFkIG9uZSBieXRlIGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlciBUaGUgZGVjb2RlciBpbnN0YW5jZVxuICogQHJldHVybiB7bnVtYmVyfSBVbnNpZ25lZCA4LWJpdCBpbnRlZ2VyXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkVWludDggPSBkZWNvZGVyID0+IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG5cbi8qKlxuICogUmVhZCAyIGJ5dGVzIGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRVaW50MTYgPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgdWludCA9XG4gICAgZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3NdICtcbiAgICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAxXSA8PCA4KVxuICBkZWNvZGVyLnBvcyArPSAyXG4gIHJldHVybiB1aW50XG59XG5cbi8qKlxuICogUmVhZCA0IGJ5dGVzIGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRVaW50MzIgPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgdWludCA9XG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zXSArXG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgMV0gPDwgOCkgK1xuICAgIChkZWNvZGVyLmFycltkZWNvZGVyLnBvcyArIDJdIDw8IDE2KSArXG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgM10gPDwgMjQpKSA+Pj4gMFxuICBkZWNvZGVyLnBvcyArPSA0XG4gIHJldHVybiB1aW50XG59XG5cbi8qKlxuICogUmVhZCA0IGJ5dGVzIGFzIHVuc2lnbmVkIGludGVnZXIgaW4gYmlnIGVuZGlhbiBvcmRlci5cbiAqIChtb3N0IHNpZ25pZmljYW50IGJ5dGUgZmlyc3QpXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRVaW50MzJCaWdFbmRpYW4gPSBkZWNvZGVyID0+IHtcbiAgY29uc3QgdWludCA9XG4gICAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgM10gK1xuICAgIChkZWNvZGVyLmFycltkZWNvZGVyLnBvcyArIDJdIDw8IDgpICtcbiAgICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAxXSA8PCAxNikgK1xuICAgIChkZWNvZGVyLmFycltkZWNvZGVyLnBvc10gPDwgMjQpKSA+Pj4gMFxuICBkZWNvZGVyLnBvcyArPSA0XG4gIHJldHVybiB1aW50XG59XG5cbi8qKlxuICogTG9vayBhaGVhZCB3aXRob3V0IGluY3JlbWVudGluZyB0aGUgcG9zaXRpb25cbiAqIHRvIHRoZSBuZXh0IGJ5dGUgYW5kIHJlYWQgaXQgYXMgdW5zaWduZWQgaW50ZWdlci5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfSBBbiB1bnNpZ25lZCBpbnRlZ2VyLlxuICovXG5leHBvcnQgY29uc3QgcGVla1VpbnQ4ID0gZGVjb2RlciA9PiBkZWNvZGVyLmFycltkZWNvZGVyLnBvc11cblxuLyoqXG4gKiBMb29rIGFoZWFkIHdpdGhvdXQgaW5jcmVtZW50aW5nIHRoZSBwb3NpdGlvblxuICogdG8gdGhlIG5leHQgYnl0ZSBhbmQgcmVhZCBpdCBhcyB1bnNpZ25lZCBpbnRlZ2VyLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IEFuIHVuc2lnbmVkIGludGVnZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBwZWVrVWludDE2ID0gZGVjb2RlciA9PlxuICBkZWNvZGVyLmFycltkZWNvZGVyLnBvc10gK1xuICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAxXSA8PCA4KVxuXG4vKipcbiAqIExvb2sgYWhlYWQgd2l0aG91dCBpbmNyZW1lbnRpbmcgdGhlIHBvc2l0aW9uXG4gKiB0byB0aGUgbmV4dCBieXRlIGFuZCByZWFkIGl0IGFzIHVuc2lnbmVkIGludGVnZXIuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHBlZWtVaW50MzIgPSBkZWNvZGVyID0+IChcbiAgZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3NdICtcbiAgKGRlY29kZXIuYXJyW2RlY29kZXIucG9zICsgMV0gPDwgOCkgK1xuICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAyXSA8PCAxNikgK1xuICAoZGVjb2Rlci5hcnJbZGVjb2Rlci5wb3MgKyAzXSA8PCAyNClcbikgPj4+IDBcblxuLyoqXG4gKiBSZWFkIHVuc2lnbmVkIGludGVnZXIgKDMyYml0KSB3aXRoIHZhcmlhYmxlIGxlbmd0aC5cbiAqIDEvOHRoIG9mIHRoZSBzdG9yYWdlIGlzIHVzZWQgYXMgZW5jb2Rpbmcgb3ZlcmhlYWQuXG4gKiAgKiBudW1iZXJzIDwgMl43IGlzIHN0b3JlZCBpbiBvbmUgYnl0bGVuZ3RoXG4gKiAgKiBudW1iZXJzIDwgMl4xNCBpcyBzdG9yZWQgaW4gdHdvIGJ5bGVuZ3RoXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge251bWJlcn0gQW4gdW5zaWduZWQgaW50ZWdlci5sZW5ndGhcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRWYXJVaW50ID0gZGVjb2RlciA9PiB7XG4gIGxldCBudW0gPSAwXG4gIGxldCBtdWx0ID0gMVxuICBjb25zdCBsZW4gPSBkZWNvZGVyLmFyci5sZW5ndGhcbiAgd2hpbGUgKGRlY29kZXIucG9zIDwgbGVuKSB7XG4gICAgY29uc3QgciA9IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG4gICAgLy8gbnVtID0gbnVtIHwgKChyICYgYmluYXJ5LkJJVFM3KSA8PCBsZW4pXG4gICAgbnVtID0gbnVtICsgKHIgJiBiaW5hcnkuQklUUzcpICogbXVsdCAvLyBzaGlmdCAkciA8PCAoNyojaXRlcmF0aW9ucykgYW5kIGFkZCBpdCB0byBudW1cbiAgICBtdWx0ICo9IDEyOCAvLyBuZXh0IGl0ZXJhdGlvbiwgc2hpZnQgNyBcIm1vcmVcIiB0byB0aGUgbGVmdFxuICAgIGlmIChyIDwgYmluYXJ5LkJJVDgpIHtcbiAgICAgIHJldHVybiBudW1cbiAgICB9XG4gICAgLyogYzggaWdub3JlIHN0YXJ0ICovXG4gICAgaWYgKG51bSA+IG51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSB7XG4gICAgICB0aHJvdyBlcnJvckludGVnZXJPdXRPZlJhbmdlXG4gICAgfVxuICAgIC8qIGM4IGlnbm9yZSBzdG9wICovXG4gIH1cbiAgdGhyb3cgZXJyb3JVbmV4cGVjdGVkRW5kT2ZBcnJheVxufVxuXG4vKipcbiAqIFJlYWQgc2lnbmVkIGludGVnZXIgKDMyYml0KSB3aXRoIHZhcmlhYmxlIGxlbmd0aC5cbiAqIDEvOHRoIG9mIHRoZSBzdG9yYWdlIGlzIHVzZWQgYXMgZW5jb2Rpbmcgb3ZlcmhlYWQuXG4gKiAgKiBudW1iZXJzIDwgMl43IGlzIHN0b3JlZCBpbiBvbmUgYnl0bGVuZ3RoXG4gKiAgKiBudW1iZXJzIDwgMl4xNCBpcyBzdG9yZWQgaW4gdHdvIGJ5bGVuZ3RoXG4gKiBAdG9kbyBUaGlzIHNob3VsZCBwcm9iYWJseSBjcmVhdGUgdGhlIGludmVyc2Ugfm51bSBpZiBudW1iZXIgaXMgbmVnYXRpdmUgLSBidXQgdGhpcyB3b3VsZCBiZSBhIGJyZWFraW5nIGNoYW5nZS5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfSBBbiB1bnNpZ25lZCBpbnRlZ2VyLmxlbmd0aFxuICovXG5leHBvcnQgY29uc3QgcmVhZFZhckludCA9IGRlY29kZXIgPT4ge1xuICBsZXQgciA9IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG4gIGxldCBudW0gPSByICYgYmluYXJ5LkJJVFM2XG4gIGxldCBtdWx0ID0gNjRcbiAgY29uc3Qgc2lnbiA9IChyICYgYmluYXJ5LkJJVDcpID4gMCA/IC0xIDogMVxuICBpZiAoKHIgJiBiaW5hcnkuQklUOCkgPT09IDApIHtcbiAgICAvLyBkb24ndCBjb250aW51ZSByZWFkaW5nXG4gICAgcmV0dXJuIHNpZ24gKiBudW1cbiAgfVxuICBjb25zdCBsZW4gPSBkZWNvZGVyLmFyci5sZW5ndGhcbiAgd2hpbGUgKGRlY29kZXIucG9zIDwgbGVuKSB7XG4gICAgciA9IGRlY29kZXIuYXJyW2RlY29kZXIucG9zKytdXG4gICAgLy8gbnVtID0gbnVtIHwgKChyICYgYmluYXJ5LkJJVFM3KSA8PCBsZW4pXG4gICAgbnVtID0gbnVtICsgKHIgJiBiaW5hcnkuQklUUzcpICogbXVsdFxuICAgIG11bHQgKj0gMTI4XG4gICAgaWYgKHIgPCBiaW5hcnkuQklUOCkge1xuICAgICAgcmV0dXJuIHNpZ24gKiBudW1cbiAgICB9XG4gICAgLyogYzggaWdub3JlIHN0YXJ0ICovXG4gICAgaWYgKG51bSA+IG51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSB7XG4gICAgICB0aHJvdyBlcnJvckludGVnZXJPdXRPZlJhbmdlXG4gICAgfVxuICAgIC8qIGM4IGlnbm9yZSBzdG9wICovXG4gIH1cbiAgdGhyb3cgZXJyb3JVbmV4cGVjdGVkRW5kT2ZBcnJheVxufVxuXG4vKipcbiAqIExvb2sgYWhlYWQgYW5kIHJlYWQgdmFyVWludCB3aXRob3V0IGluY3JlbWVudGluZyBwb3NpdGlvblxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBwZWVrVmFyVWludCA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBwb3MgPSBkZWNvZGVyLnBvc1xuICBjb25zdCBzID0gcmVhZFZhclVpbnQoZGVjb2RlcilcbiAgZGVjb2Rlci5wb3MgPSBwb3NcbiAgcmV0dXJuIHNcbn1cblxuLyoqXG4gKiBMb29rIGFoZWFkIGFuZCByZWFkIHZhclVpbnQgd2l0aG91dCBpbmNyZW1lbnRpbmcgcG9zaXRpb25cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5leHBvcnQgY29uc3QgcGVla1ZhckludCA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBwb3MgPSBkZWNvZGVyLnBvc1xuICBjb25zdCBzID0gcmVhZFZhckludChkZWNvZGVyKVxuICBkZWNvZGVyLnBvcyA9IHBvc1xuICByZXR1cm4gc1xufVxuXG4vKipcbiAqIFdlIGRvbid0IHRlc3QgdGhpcyBmdW5jdGlvbiBhbnltb3JlIGFzIHdlIHVzZSBuYXRpdmUgZGVjb2RpbmcvZW5jb2RpbmcgYnkgZGVmYXVsdCBub3cuXG4gKiBCZXR0ZXIgbm90IG1vZGlmeSB0aGlzIGFueW1vcmUuLlxuICpcbiAqIFRyYW5zZm9ybWluZyB1dGY4IHRvIGEgc3RyaW5nIGlzIHByZXR0eSBleHBlbnNpdmUuIFRoZSBjb2RlIHBlcmZvcm1zIDEweCBiZXR0ZXJcbiAqIHdoZW4gU3RyaW5nLmZyb21Db2RlUG9pbnQgaXMgZmVkIHdpdGggYWxsIGNoYXJhY3RlcnMgYXMgYXJndW1lbnRzLlxuICogQnV0IG1vc3QgZW52aXJvbm1lbnRzIGhhdmUgYSBtYXhpbXVtIG51bWJlciBvZiBhcmd1bWVudHMgcGVyIGZ1bmN0aW9ucy5cbiAqIEZvciBlZmZpZW5jeSByZWFzb25zIHdlIGFwcGx5IGEgbWF4aW11bSBvZiAxMDAwMCBjaGFyYWN0ZXJzIGF0IG9uY2UuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHJlYWQgU3RyaW5nLlxuICovXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmV4cG9ydCBjb25zdCBfcmVhZFZhclN0cmluZ1BvbHlmaWxsID0gZGVjb2RlciA9PiB7XG4gIGxldCByZW1haW5pbmdMZW4gPSByZWFkVmFyVWludChkZWNvZGVyKVxuICBpZiAocmVtYWluaW5nTGVuID09PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH0gZWxzZSB7XG4gICAgbGV0IGVuY29kZWRTdHJpbmcgPSBTdHJpbmcuZnJvbUNvZGVQb2ludChyZWFkVWludDgoZGVjb2RlcikpIC8vIHJlbWVtYmVyIHRvIGRlY3JlYXNlIHJlbWFpbmluZ0xlblxuICAgIGlmICgtLXJlbWFpbmluZ0xlbiA8IDEwMCkgeyAvLyBkbyBub3QgY3JlYXRlIGEgVWludDhBcnJheSBmb3Igc21hbGwgc3RyaW5nc1xuICAgICAgd2hpbGUgKHJlbWFpbmluZ0xlbi0tKSB7XG4gICAgICAgIGVuY29kZWRTdHJpbmcgKz0gU3RyaW5nLmZyb21Db2RlUG9pbnQocmVhZFVpbnQ4KGRlY29kZXIpKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAocmVtYWluaW5nTGVuID4gMCkge1xuICAgICAgICBjb25zdCBuZXh0TGVuID0gcmVtYWluaW5nTGVuIDwgMTAwMDAgPyByZW1haW5pbmdMZW4gOiAxMDAwMFxuICAgICAgICAvLyB0aGlzIGlzIGRhbmdlcm91cywgd2UgY3JlYXRlIGEgZnJlc2ggYXJyYXkgdmlldyBmcm9tIHRoZSBleGlzdGluZyBidWZmZXJcbiAgICAgICAgY29uc3QgYnl0ZXMgPSBkZWNvZGVyLmFyci5zdWJhcnJheShkZWNvZGVyLnBvcywgZGVjb2Rlci5wb3MgKyBuZXh0TGVuKVxuICAgICAgICBkZWNvZGVyLnBvcyArPSBuZXh0TGVuXG4gICAgICAgIC8vIFN0YXJ0aW5nIHdpdGggRVM1LjEgd2UgY2FuIHN1cHBseSBhIGdlbmVyaWMgYXJyYXktbGlrZSBvYmplY3QgYXMgYXJndW1lbnRzXG4gICAgICAgIGVuY29kZWRTdHJpbmcgKz0gU3RyaW5nLmZyb21Db2RlUG9pbnQuYXBwbHkobnVsbCwgLyoqIEB0eXBlIHthbnl9ICovIChieXRlcykpXG4gICAgICAgIHJlbWFpbmluZ0xlbiAtPSBuZXh0TGVuXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKGVuY29kZWRTdHJpbmcpKVxuICB9XG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSByZWFkIFN0cmluZ1xuICovXG5leHBvcnQgY29uc3QgX3JlYWRWYXJTdHJpbmdOYXRpdmUgPSBkZWNvZGVyID0+XG4gIC8qKiBAdHlwZSBhbnkgKi8gKHN0cmluZy51dGY4VGV4dERlY29kZXIpLmRlY29kZShyZWFkVmFyVWludDhBcnJheShkZWNvZGVyKSlcblxuLyoqXG4gKiBSZWFkIHN0cmluZyBvZiB2YXJpYWJsZSBsZW5ndGhcbiAqICogdmFyVWludCBpcyB1c2VkIHRvIHN0b3JlIHRoZSBsZW5ndGggb2YgdGhlIHN0cmluZ1xuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSByZWFkIFN0cmluZ1xuICpcbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCByZWFkVmFyU3RyaW5nID0gc3RyaW5nLnV0ZjhUZXh0RGVjb2RlciA/IF9yZWFkVmFyU3RyaW5nTmF0aXZlIDogX3JlYWRWYXJTdHJpbmdQb2x5ZmlsbFxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRUZXJtaW5hdGVkVWludDhBcnJheSA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBlbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gIGxldCBiXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgYiA9IHJlYWRVaW50OChkZWNvZGVyKVxuICAgIGlmIChiID09PSAwKSB7XG4gICAgICByZXR1cm4gZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXIpXG4gICAgfVxuICAgIGlmIChiID09PSAxKSB7XG4gICAgICBiID0gcmVhZFVpbnQ4KGRlY29kZXIpXG4gICAgfVxuICAgIGVuY29kaW5nLndyaXRlKGVuY29kZXIsIGIpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRUZXJtaW5hdGVkU3RyaW5nID0gZGVjb2RlciA9PiBzdHJpbmcuZGVjb2RlVXRmOChyZWFkVGVybWluYXRlZFVpbnQ4QXJyYXkoZGVjb2RlcikpXG5cbi8qKlxuICogTG9vayBhaGVhZCBhbmQgcmVhZCB2YXJTdHJpbmcgd2l0aG91dCBpbmNyZW1lbnRpbmcgcG9zaXRpb25cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgcGVla1ZhclN0cmluZyA9IGRlY29kZXIgPT4ge1xuICBjb25zdCBwb3MgPSBkZWNvZGVyLnBvc1xuICBjb25zdCBzID0gcmVhZFZhclN0cmluZyhkZWNvZGVyKVxuICBkZWNvZGVyLnBvcyA9IHBvc1xuICByZXR1cm4gc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICogQHJldHVybiB7RGF0YVZpZXd9XG4gKi9cbmV4cG9ydCBjb25zdCByZWFkRnJvbURhdGFWaWV3ID0gKGRlY29kZXIsIGxlbikgPT4ge1xuICBjb25zdCBkdiA9IHN1YmRhdGF2aWV3KGRlY29kZXIuYXJyLCBkZWNvZGVyLnBvcywgbGVuKVxuICBkZWNvZGVyLnBvcyArPSBsZW5cbiAgcmV0dXJuIGR2XG59XG5cbi8qKlxuICogQHBhcmFtIHtEZWNvZGVyfSBkZWNvZGVyXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkRmxvYXQzMiA9IGRlY29kZXIgPT4gcmVhZEZyb21EYXRhVmlldyhkZWNvZGVyLCA0KS5nZXRGbG9hdDMyKDAsIGZhbHNlKVxuXG4vKipcbiAqIEBwYXJhbSB7RGVjb2Rlcn0gZGVjb2RlclxuICovXG5leHBvcnQgY29uc3QgcmVhZEZsb2F0NjQgPSBkZWNvZGVyID0+IHJlYWRGcm9tRGF0YVZpZXcoZGVjb2RlciwgOCkuZ2V0RmxvYXQ2NCgwLCBmYWxzZSlcblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRCaWdJbnQ2NCA9IGRlY29kZXIgPT4gLyoqIEB0eXBlIHthbnl9ICovIChyZWFkRnJvbURhdGFWaWV3KGRlY29kZXIsIDgpKS5nZXRCaWdJbnQ2NCgwLCBmYWxzZSlcblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRCaWdVaW50NjQgPSBkZWNvZGVyID0+IC8qKiBAdHlwZSB7YW55fSAqLyAocmVhZEZyb21EYXRhVmlldyhkZWNvZGVyLCA4KSkuZ2V0QmlnVWludDY0KDAsIGZhbHNlKVxuXG4vKipcbiAqIEB0eXBlIHtBcnJheTxmdW5jdGlvbihEZWNvZGVyKTphbnk+fVxuICovXG5jb25zdCByZWFkQW55TG9va3VwVGFibGUgPSBbXG4gIGRlY29kZXIgPT4gdW5kZWZpbmVkLCAvLyBDQVNFIDEyNzogdW5kZWZpbmVkXG4gIGRlY29kZXIgPT4gbnVsbCwgLy8gQ0FTRSAxMjY6IG51bGxcbiAgcmVhZFZhckludCwgLy8gQ0FTRSAxMjU6IGludGVnZXJcbiAgcmVhZEZsb2F0MzIsIC8vIENBU0UgMTI0OiBmbG9hdDMyXG4gIHJlYWRGbG9hdDY0LCAvLyBDQVNFIDEyMzogZmxvYXQ2NFxuICByZWFkQmlnSW50NjQsIC8vIENBU0UgMTIyOiBiaWdpbnRcbiAgZGVjb2RlciA9PiBmYWxzZSwgLy8gQ0FTRSAxMjE6IGJvb2xlYW4gKGZhbHNlKVxuICBkZWNvZGVyID0+IHRydWUsIC8vIENBU0UgMTIwOiBib29sZWFuICh0cnVlKVxuICByZWFkVmFyU3RyaW5nLCAvLyBDQVNFIDExOTogc3RyaW5nXG4gIGRlY29kZXIgPT4geyAvLyBDQVNFIDExODogb2JqZWN0PHN0cmluZyxhbnk+XG4gICAgY29uc3QgbGVuID0gcmVhZFZhclVpbnQoZGVjb2RlcilcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7T2JqZWN0PHN0cmluZyxhbnk+fVxuICAgICAqL1xuICAgIGNvbnN0IG9iaiA9IHt9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgY29uc3Qga2V5ID0gcmVhZFZhclN0cmluZyhkZWNvZGVyKVxuICAgICAgb2JqW2tleV0gPSByZWFkQW55KGRlY29kZXIpXG4gICAgfVxuICAgIHJldHVybiBvYmpcbiAgfSxcbiAgZGVjb2RlciA9PiB7IC8vIENBU0UgMTE3OiBhcnJheTxhbnk+XG4gICAgY29uc3QgbGVuID0gcmVhZFZhclVpbnQoZGVjb2RlcilcbiAgICBjb25zdCBhcnIgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyci5wdXNoKHJlYWRBbnkoZGVjb2RlcikpXG4gICAgfVxuICAgIHJldHVybiBhcnJcbiAgfSxcbiAgcmVhZFZhclVpbnQ4QXJyYXkgLy8gQ0FTRSAxMTY6IFVpbnQ4QXJyYXlcbl1cblxuLyoqXG4gKiBAcGFyYW0ge0RlY29kZXJ9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRBbnkgPSBkZWNvZGVyID0+IHJlYWRBbnlMb29rdXBUYWJsZVsxMjcgLSByZWFkVWludDgoZGVjb2RlcildKGRlY29kZXIpXG5cbi8qKlxuICogVCBtdXN0IG5vdCBiZSBudWxsLlxuICpcbiAqIEB0ZW1wbGF0ZSBUXG4gKi9cbmV4cG9ydCBjbGFzcyBSbGVEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICogQHBhcmFtIHtmdW5jdGlvbihEZWNvZGVyKTpUfSByZWFkZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5LCByZWFkZXIpIHtcbiAgICBzdXBlcih1aW50OEFycmF5KVxuICAgIC8qKlxuICAgICAqIFRoZSByZWFkZXJcbiAgICAgKi9cbiAgICB0aGlzLnJlYWRlciA9IHJlYWRlclxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7VHxudWxsfVxuICAgICAqL1xuICAgIHRoaXMucyA9IG51bGxcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgcmVhZCAoKSB7XG4gICAgaWYgKHRoaXMuY291bnQgPT09IDApIHtcbiAgICAgIHRoaXMucyA9IHRoaXMucmVhZGVyKHRoaXMpXG4gICAgICBpZiAoaGFzQ29udGVudCh0aGlzKSkge1xuICAgICAgICB0aGlzLmNvdW50ID0gcmVhZFZhclVpbnQodGhpcykgKyAxIC8vIHNlZSBlbmNvZGVyIGltcGxlbWVudGF0aW9uIGZvciB0aGUgcmVhc29uIHdoeSB0aGlzIGlzIGluY3JlbWVudGVkXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvdW50ID0gLTEgLy8gcmVhZCB0aGUgY3VycmVudCB2YWx1ZSBmb3JldmVyXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY291bnQtLVxuICAgIHJldHVybiAvKiogQHR5cGUge1R9ICovICh0aGlzLnMpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEludERpZmZEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSwgc3RhcnQpIHtcbiAgICBzdXBlcih1aW50OEFycmF5KVxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucyA9IHN0YXJ0XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgcmVhZCAoKSB7XG4gICAgdGhpcy5zICs9IHJlYWRWYXJJbnQodGhpcylcbiAgICByZXR1cm4gdGhpcy5zXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJsZUludERpZmZEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSwgc3RhcnQpIHtcbiAgICBzdXBlcih1aW50OEFycmF5KVxuICAgIC8qKlxuICAgICAqIEN1cnJlbnQgc3RhdGVcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucyA9IHN0YXJ0XG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XG4gICAqL1xuICByZWFkICgpIHtcbiAgICBpZiAodGhpcy5jb3VudCA9PT0gMCkge1xuICAgICAgdGhpcy5zICs9IHJlYWRWYXJJbnQodGhpcylcbiAgICAgIGlmIChoYXNDb250ZW50KHRoaXMpKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSByZWFkVmFyVWludCh0aGlzKSArIDEgLy8gc2VlIGVuY29kZXIgaW1wbGVtZW50YXRpb24gZm9yIHRoZSByZWFzb24gd2h5IHRoaXMgaXMgaW5jcmVtZW50ZWRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAtMSAvLyByZWFkIHRoZSBjdXJyZW50IHZhbHVlIGZvcmV2ZXJcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jb3VudC0tXG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7bnVtYmVyfSAqLyAodGhpcy5zKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVaW50T3B0UmxlRGVjb2RlciBleHRlbmRzIERlY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OEFycmF5XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSkge1xuICAgIHN1cGVyKHVpbnQ4QXJyYXkpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgfVxuXG4gIHJlYWQgKCkge1xuICAgIGlmICh0aGlzLmNvdW50ID09PSAwKSB7XG4gICAgICB0aGlzLnMgPSByZWFkVmFySW50KHRoaXMpXG4gICAgICAvLyBpZiB0aGUgc2lnbiBpcyBuZWdhdGl2ZSwgd2UgcmVhZCB0aGUgY291bnQgdG9vLCBvdGhlcndpc2UgY291bnQgaXMgMVxuICAgICAgY29uc3QgaXNOZWdhdGl2ZSA9IG1hdGguaXNOZWdhdGl2ZVplcm8odGhpcy5zKVxuICAgICAgdGhpcy5jb3VudCA9IDFcbiAgICAgIGlmIChpc05lZ2F0aXZlKSB7XG4gICAgICAgIHRoaXMucyA9IC10aGlzLnNcbiAgICAgICAgdGhpcy5jb3VudCA9IHJlYWRWYXJVaW50KHRoaXMpICsgMlxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNvdW50LS1cbiAgICByZXR1cm4gLyoqIEB0eXBlIHtudW1iZXJ9ICovICh0aGlzLnMpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEluY1VpbnRPcHRSbGVEZWNvZGVyIGV4dGVuZHMgRGVjb2RlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4QXJyYXlcbiAgICovXG4gIGNvbnN0cnVjdG9yICh1aW50OEFycmF5KSB7XG4gICAgc3VwZXIodWludDhBcnJheSlcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucyA9IDBcbiAgICB0aGlzLmNvdW50ID0gMFxuICB9XG5cbiAgcmVhZCAoKSB7XG4gICAgaWYgKHRoaXMuY291bnQgPT09IDApIHtcbiAgICAgIHRoaXMucyA9IHJlYWRWYXJJbnQodGhpcylcbiAgICAgIC8vIGlmIHRoZSBzaWduIGlzIG5lZ2F0aXZlLCB3ZSByZWFkIHRoZSBjb3VudCB0b28sIG90aGVyd2lzZSBjb3VudCBpcyAxXG4gICAgICBjb25zdCBpc05lZ2F0aXZlID0gbWF0aC5pc05lZ2F0aXZlWmVybyh0aGlzLnMpXG4gICAgICB0aGlzLmNvdW50ID0gMVxuICAgICAgaWYgKGlzTmVnYXRpdmUpIHtcbiAgICAgICAgdGhpcy5zID0gLXRoaXMuc1xuICAgICAgICB0aGlzLmNvdW50ID0gcmVhZFZhclVpbnQodGhpcykgKyAyXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY291bnQtLVxuICAgIHJldHVybiAvKiogQHR5cGUge251bWJlcn0gKi8gKHRoaXMucysrKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnREaWZmT3B0UmxlRGVjb2RlciBleHRlbmRzIERlY29kZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OEFycmF5XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodWludDhBcnJheSkge1xuICAgIHN1cGVyKHVpbnQ4QXJyYXkpXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnMgPSAwXG4gICAgdGhpcy5jb3VudCA9IDBcbiAgICB0aGlzLmRpZmYgPSAwXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfVxuICAgKi9cbiAgcmVhZCAoKSB7XG4gICAgaWYgKHRoaXMuY291bnQgPT09IDApIHtcbiAgICAgIGNvbnN0IGRpZmYgPSByZWFkVmFySW50KHRoaXMpXG4gICAgICAvLyBpZiB0aGUgZmlyc3QgYml0IGlzIHNldCwgd2UgcmVhZCBtb3JlIGRhdGFcbiAgICAgIGNvbnN0IGhhc0NvdW50ID0gZGlmZiAmIDFcbiAgICAgIHRoaXMuZGlmZiA9IG1hdGguZmxvb3IoZGlmZiAvIDIpIC8vIHNoaWZ0ID4+IDFcbiAgICAgIHRoaXMuY291bnQgPSAxXG4gICAgICBpZiAoaGFzQ291bnQpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IHJlYWRWYXJVaW50KHRoaXMpICsgMlxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnMgKz0gdGhpcy5kaWZmXG4gICAgdGhpcy5jb3VudC0tXG4gICAgcmV0dXJuIHRoaXMuc1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdEZWNvZGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheVxuICAgKi9cbiAgY29uc3RydWN0b3IgKHVpbnQ4QXJyYXkpIHtcbiAgICB0aGlzLmRlY29kZXIgPSBuZXcgVWludE9wdFJsZURlY29kZXIodWludDhBcnJheSlcbiAgICB0aGlzLnN0ciA9IHJlYWRWYXJTdHJpbmcodGhpcy5kZWNvZGVyKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5zcG9zID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICovXG4gIHJlYWQgKCkge1xuICAgIGNvbnN0IGVuZCA9IHRoaXMuc3BvcyArIHRoaXMuZGVjb2Rlci5yZWFkKClcbiAgICBjb25zdCByZXMgPSB0aGlzLnN0ci5zbGljZSh0aGlzLnNwb3MsIGVuZClcbiAgICB0aGlzLnNwb3MgPSBlbmRcbiAgICByZXR1cm4gcmVzXG4gIH1cbn1cbiIsICIvKipcbiAqIE9mdGVuIHVzZWQgY29uZGl0aW9ucy5cbiAqXG4gKiBAbW9kdWxlIGNvbmRpdGlvbnNcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1R8bnVsbHx1bmRlZmluZWR9IHZcbiAqIEByZXR1cm4ge1R8bnVsbH1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCB1bmRlZmluZWRUb051bGwgPSB2ID0+IHYgPT09IHVuZGVmaW5lZCA/IG51bGwgOiB2XG4iLCAiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogSXNvbW9ycGhpYyB2YXJpYWJsZSBzdG9yYWdlLlxuICpcbiAqIFVzZXMgTG9jYWxTdG9yYWdlIGluIHRoZSBicm93c2VyIGFuZCBmYWxscyBiYWNrIHRvIGluLW1lbW9yeSBzdG9yYWdlLlxuICpcbiAqIEBtb2R1bGUgc3RvcmFnZVxuICovXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuY2xhc3MgVmFyU3RvcmFnZVBvbHlmaWxsIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMubWFwID0gbmV3IE1hcCgpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICAgKiBAcGFyYW0ge2FueX0gbmV3VmFsdWVcbiAgICovXG4gIHNldEl0ZW0gKGtleSwgbmV3VmFsdWUpIHtcbiAgICB0aGlzLm1hcC5zZXQoa2V5LCBuZXdWYWx1ZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAqL1xuICBnZXRJdGVtIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAuZ2V0KGtleSlcbiAgfVxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAdHlwZSB7YW55fVxuICovXG5sZXQgX2xvY2FsU3RvcmFnZSA9IG5ldyBWYXJTdG9yYWdlUG9seWZpbGwoKVxubGV0IHVzZVBvbHlmaWxsID0gdHJ1ZVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbnRyeSB7XG4gIC8vIGlmIHRoZSBzYW1lLW9yaWdpbiBydWxlIGlzIHZpb2xhdGVkLCBhY2Nlc3NpbmcgbG9jYWxTdG9yYWdlIG1pZ2h0IHRocm93biBhbiBlcnJvclxuICBpZiAodHlwZW9mIGxvY2FsU3RvcmFnZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbG9jYWxTdG9yYWdlKSB7XG4gICAgX2xvY2FsU3RvcmFnZSA9IGxvY2FsU3RvcmFnZVxuICAgIHVzZVBvbHlmaWxsID0gZmFsc2VcbiAgfVxufSBjYXRjaCAoZSkgeyB9XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIFRoaXMgaXMgYmFzaWNhbGx5IGxvY2FsU3RvcmFnZSBpbiBicm93c2VyLCBvciBhIHBvbHlmaWxsIGluIG5vZGVqc1xuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IHZhclN0b3JhZ2UgPSBfbG9jYWxTdG9yYWdlXG5cbi8qKlxuICogQSBwb2x5ZmlsbCBmb3IgYGFkZEV2ZW50TGlzdGVuZXIoJ3N0b3JhZ2UnLCBldmVudCA9PiB7Li59KWAgdGhhdCBkb2VzIG5vdGhpbmcgaWYgdGhlIHBvbHlmaWxsIGlzIGJlaW5nIHVzZWQuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbih7IGtleTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nLCBvbGRWYWx1ZTogc3RyaW5nIH0pOiB2b2lkfSBldmVudEhhbmRsZXJcbiAqIEBmdW5jdGlvblxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IG9uQ2hhbmdlID0gZXZlbnRIYW5kbGVyID0+IHVzZVBvbHlmaWxsIHx8IGFkZEV2ZW50TGlzdGVuZXIoJ3N0b3JhZ2UnLCAvKiogQHR5cGUge2FueX0gKi8gKGV2ZW50SGFuZGxlcikpXG5cbi8qKlxuICogQSBwb2x5ZmlsbCBmb3IgYHJlbW92ZUV2ZW50TGlzdGVuZXIoJ3N0b3JhZ2UnLCBldmVudCA9PiB7Li59KWAgdGhhdCBkb2VzIG5vdGhpbmcgaWYgdGhlIHBvbHlmaWxsIGlzIGJlaW5nIHVzZWQuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbih7IGtleTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nLCBvbGRWYWx1ZTogc3RyaW5nIH0pOiB2b2lkfSBldmVudEhhbmRsZXJcbiAqIEBmdW5jdGlvblxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IG9mZkNoYW5nZSA9IGV2ZW50SGFuZGxlciA9PiB1c2VQb2x5ZmlsbCB8fCByZW1vdmVFdmVudExpc3RlbmVyKCdzdG9yYWdlJywgLyoqIEB0eXBlIHthbnl9ICovIChldmVudEhhbmRsZXIpKVxuIiwgImV4cG9ydCBjb25zdCBFcXVhbGl0eVRyYWl0U3ltYm9sID0gU3ltYm9sKCdFcXVhbGl0eScpXG5cbi8qKlxuICogQHR5cGVkZWYge3sgW0VxdWFsaXR5VHJhaXRTeW1ib2xdOihvdGhlcjpFcXVhbGl0eVRyYWl0KT0+Ym9vbGVhbiB9fSBFcXVhbGl0eVRyYWl0XG4gKi9cblxuLyoqXG4gKlxuICogVXRpbGl0eSBmdW5jdGlvbiB0byBjb21wYXJlIGFueSB0d28gb2JqZWN0cy5cbiAqXG4gKiBOb3RlIHRoYXQgaXQgaXMgZXhwZWN0ZWQgdGhhdCB0aGUgZmlyc3QgcGFyYW1ldGVyIGlzIG1vcmUgc3BlY2lmaWMgdGhhbiB0aGUgbGF0dGVyIG9uZS5cbiAqXG4gKiBAZXhhbXBsZSBqc1xuICogICAgIGNsYXNzIFggeyBbdHJhaXRzLkVxdWFsaXR5VHJhaXRTeW1ib2xdIChvdGhlcikgeyByZXR1cm4gb3RoZXIgPT09IHRoaXMgfSAgfVxuICogICAgIGNsYXNzIFgyIHsgW3RyYWl0cy5FcXVhbGl0eVRyYWl0U3ltYm9sXSAob3RoZXIpIHsgcmV0dXJuIG90aGVyID09PSB0aGlzIH0sIHgyICgpIHsgcmV0dXJuIDIgfSAgfVxuICogICAgIC8vIHRoaXMgaXMgZmluZVxuICogICAgIHRyYWl0cy5lcXVhbHMobmV3IFgyKCksIG5ldyBYKCkpXG4gKiAgICAgLy8gdGhpcyBpcyBub3QsIGJlY2F1c2UgdGhlIGxlZnQgdHlwZSBpcyBsZXNzIHNwZWNpZmljIHRoYW4gdGhlIHJpZ2h0IG9uZVxuICogICAgIHRyYWl0cy5lcXVhbHMobmV3IFgoKSwgbmV3IFgyKCkpXG4gKlxuICogQHRlbXBsYXRlIHtFcXVhbGl0eVRyYWl0fSBUXG4gKiBAcGFyYW0ge05vSW5mZXI8VD59IGFcbiAqIEBwYXJhbSB7VH0gYlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGVxdWFscyA9IChhLCBiKSA9PiBhID09PSBiIHx8ICEhYT8uW0VxdWFsaXR5VHJhaXRTeW1ib2xdPy4oYikgfHwgZmFsc2VcbiIsICJpbXBvcnQgKiBhcyBlcXVhbGl0eVRyYWl0IGZyb20gJy4vdHJhaXQvZXF1YWxpdHkuanMnXG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbnMgZm9yIHdvcmtpbmcgd2l0aCBFY21hU2NyaXB0IG9iamVjdHMuXG4gKlxuICogQG1vZHVsZSBvYmplY3RcbiAqL1xuXG4vKipcbiAqIEByZXR1cm4ge09iamVjdDxzdHJpbmcsYW55Pn0gb2JqXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGUgPSAoKSA9PiBPYmplY3QuY3JlYXRlKG51bGwpXG5cbi8qKlxuICogQHBhcmFtIHthbnl9IG9cbiAqIEByZXR1cm4ge28gaXMgeyBbazpzdHJpbmddOmFueSB9fVxuICovXG5leHBvcnQgY29uc3QgaXNPYmplY3QgPSBvID0+IHR5cGVvZiBvID09PSAnb2JqZWN0J1xuXG4vKipcbiAqIE9iamVjdC5hc3NpZ25cbiAqL1xuZXhwb3J0IGNvbnN0IGFzc2lnbiA9IE9iamVjdC5hc3NpZ25cblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsYW55Pn0gb2JqXG4gKi9cbmV4cG9ydCBjb25zdCBrZXlzID0gT2JqZWN0LmtleXNcblxuLyoqXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHt7W2tleTpzdHJpbmddOiBWfX0gb2JqXG4gKiBAcmV0dXJuIHtBcnJheTxWPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHZhbHVlcyA9IE9iamVjdC52YWx1ZXNcblxuLyoqXG4gKiBAdGVtcGxhdGUgVlxuICogQHBhcmFtIHt7W2s6c3RyaW5nXTpWfX0gb2JqXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFYsc3RyaW5nKTphbnl9IGZcbiAqL1xuZXhwb3J0IGNvbnN0IGZvckVhY2ggPSAob2JqLCBmKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIGYob2JqW2tleV0sIGtleSlcbiAgfVxufVxuXG4vKipcbiAqIEB0b2RvIGltcGxlbWVudCBtYXBUb0FycmF5ICYgbWFwXG4gKlxuICogQHRlbXBsYXRlIFJcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBvYmpcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oYW55LHN0cmluZyk6Un0gZlxuICogQHJldHVybiB7QXJyYXk8Uj59XG4gKi9cbmV4cG9ydCBjb25zdCBtYXAgPSAob2JqLCBmKSA9PiB7XG4gIGNvbnN0IHJlc3VsdHMgPSBbXVxuICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICByZXN1bHRzLnB1c2goZihvYmpba2V5XSwga2V5KSlcbiAgfVxuICByZXR1cm4gcmVzdWx0c1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIHVzZSBvYmplY3Quc2l6ZSBpbnN0ZWFkXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsYW55Pn0gb2JqXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBsZW5ndGggPSBvYmogPT4ga2V5cyhvYmopLmxlbmd0aFxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBvYmpcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZXhwb3J0IGNvbnN0IHNpemUgPSBvYmogPT4ga2V5cyhvYmopLmxlbmd0aFxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7eyBba2V5OnN0cmluZ3xudW1iZXJ8c3ltYm9sXTogYW55IH19IFRcbiAqIEBwYXJhbSB7VH0gb2JqXG4gKiBAcGFyYW0geyh2OlRba2V5b2YgVF0sazprZXlvZiBUKT0+Ym9vbGVhbn0gZlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IHNvbWUgPSAob2JqLCBmKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIGlmIChmKG9ialtrZXldLCBrZXkpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdHxudWxsfHVuZGVmaW5lZH0gb2JqXG4gKi9cbmV4cG9ydCBjb25zdCBpc0VtcHR5ID0gb2JqID0+IHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVucmVhY2hhYmxlLWxvb3BcbiAgZm9yIChjb25zdCBfayBpbiBvYmopIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7eyBba2V5OnN0cmluZ3xudW1iZXJ8c3ltYm9sXTogYW55IH19IFRcbiAqIEBwYXJhbSB7VH0gb2JqXG4gKiBAcGFyYW0geyh2OlRba2V5b2YgVF0sazprZXlvZiBUKT0+Ym9vbGVhbn0gZlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGV2ZXJ5ID0gKG9iaiwgZikgPT4ge1xuICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICBpZiAoIWYob2JqW2tleV0sIGtleSkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIENhbGxzIGBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5YC5cbiAqXG4gKiBAcGFyYW0ge2FueX0gb2JqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8c3ltYm9sfSBrZXlcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBoYXNQcm9wZXJ0eSA9IChvYmosIGtleSkgPT4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KVxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZyxhbnk+fSBhXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsYW55Pn0gYlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGVxdWFsRmxhdCA9IChhLCBiKSA9PiBhID09PSBiIHx8IChzaXplKGEpID09PSBzaXplKGIpICYmIGV2ZXJ5KGEsICh2YWwsIGtleSkgPT4gKHZhbCAhPT0gdW5kZWZpbmVkIHx8IGhhc1Byb3BlcnR5KGIsIGtleSkpICYmIGVxdWFsaXR5VHJhaXQuZXF1YWxzKGJba2V5XSwgdmFsKSkpXG5cbi8qKlxuICogTWFrZSBhbiBvYmplY3QgaW1tdXRhYmxlLiBUaGlzIGh1cnRzIHBlcmZvcm1hbmNlIGFuZCBpcyB1c3VhbGx5IG5vdCBuZWVkZWQgaWYgeW91IHBlcmZvcm0gZ29vZFxuICogY29kaW5nIHByYWN0aWNlcy5cbiAqL1xuZXhwb3J0IGNvbnN0IGZyZWV6ZSA9IE9iamVjdC5mcmVlemVcblxuLyoqXG4gKiBNYWtlIGFuIG9iamVjdCBhbmQgYWxsIGl0cyBjaGlsZHJlbiBpbW11dGFibGUuXG4gKiBUaGlzICpyZWFsbHkqIGh1cnRzIHBlcmZvcm1hbmNlIGFuZCBpcyB1c3VhbGx5IG5vdCBuZWVkZWQgaWYgeW91IHBlcmZvcm0gZ29vZCBjb2RpbmcgcHJhY3RpY2VzLlxuICpcbiAqIEB0ZW1wbGF0ZSB7YW55fSBUXG4gKiBAcGFyYW0ge1R9IG9cbiAqIEByZXR1cm4ge1JlYWRvbmx5PFQ+fVxuICovXG5leHBvcnQgY29uc3QgZGVlcEZyZWV6ZSA9IChvKSA9PiB7XG4gIGZvciAoY29uc3Qga2V5IGluIG8pIHtcbiAgICBjb25zdCBjID0gb1trZXldXG4gICAgaWYgKHR5cGVvZiBjID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZGVlcEZyZWV6ZShvW2tleV0pXG4gICAgfVxuICB9XG4gIHJldHVybiBmcmVlemUobylcbn1cblxuLyoqXG4gKiBHZXQgb2JqZWN0IHByb3BlcnR5LiBDcmVhdGUgVCBpZiBwcm9wZXJ0eSBpcyB1bmRlZmluZWQgYW5kIHNldCBUIG9uIG9iamVjdC5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEB0ZW1wbGF0ZSB7b2JqZWN0fSBLVlxuICogQHRlbXBsYXRlIHtrZXlvZiBLVn0gW0s9a2V5b2YgS1ZdXG4gKiBAcGFyYW0ge0tWfSBvXG4gKiBAcGFyYW0ge0t9IGtleVxuICogQHBhcmFtIHsoKSA9PiBLVltLXX0gY3JlYXRlVFxuICogQHJldHVybiB7S1ZbS119XG4gKi9cbmV4cG9ydCBjb25zdCBzZXRJZlVuZGVmaW5lZCA9IChvLCBrZXksIGNyZWF0ZVQpID0+IGhhc1Byb3BlcnR5KG8sIGtleSkgPyBvW2tleV0gOiAob1trZXldID0gY3JlYXRlVCgpKVxuIiwgIi8qKlxuICogQ29tbW9uIGZ1bmN0aW9ucyBhbmQgZnVuY3Rpb24gY2FsbCBoZWxwZXJzLlxuICpcbiAqIEBtb2R1bGUgZnVuY3Rpb25cbiAqL1xuXG5pbXBvcnQgKiBhcyBhcnJheSBmcm9tICcuL2FycmF5LmpzJ1xuaW1wb3J0ICogYXMgb2JqZWN0IGZyb20gJy4vb2JqZWN0LmpzJ1xuaW1wb3J0ICogYXMgZXF1YWxpdHlUcmFpdCBmcm9tICcuL3RyYWl0L2VxdWFsaXR5LmpzJ1xuXG4vKipcbiAqIENhbGxzIGFsbCBmdW5jdGlvbnMgaW4gYGZzYCB3aXRoIGFyZ3MuIE9ubHkgdGhyb3dzIGFmdGVyIGFsbCBmdW5jdGlvbnMgd2VyZSBjYWxsZWQuXG4gKlxuICogQHBhcmFtIHtBcnJheTxmdW5jdGlvbj59IGZzXG4gKiBAcGFyYW0ge0FycmF5PGFueT59IGFyZ3NcbiAqL1xuZXhwb3J0IGNvbnN0IGNhbGxBbGwgPSAoZnMsIGFyZ3MsIGkgPSAwKSA9PiB7XG4gIHRyeSB7XG4gICAgZm9yICg7IGkgPCBmcy5sZW5ndGg7IGkrKykge1xuICAgICAgZnNbaV0oLi4uYXJncylcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGkgPCBmcy5sZW5ndGgpIHtcbiAgICAgIGNhbGxBbGwoZnMsIGFyZ3MsIGkgKyAxKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgbm9wID0gKCkgPT4ge31cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtmdW5jdGlvbigpOlR9IGZcbiAqIEByZXR1cm4ge1R9XG4gKi9cbmV4cG9ydCBjb25zdCBhcHBseSA9IGYgPT4gZigpXG5cbi8qKlxuICogQHRlbXBsYXRlIEFcbiAqXG4gKiBAcGFyYW0ge0F9IGFcbiAqIEByZXR1cm4ge0F9XG4gKi9cbmV4cG9ydCBjb25zdCBpZCA9IGEgPT4gYVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKlxuICogQHBhcmFtIHtUfSBhXG4gKiBAcGFyYW0ge1R9IGJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBlcXVhbGl0eVN0cmljdCA9IChhLCBiKSA9PiBhID09PSBiXG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqXG4gKiBAcGFyYW0ge0FycmF5PFQ+fG9iamVjdH0gYVxuICogQHBhcmFtIHtBcnJheTxUPnxvYmplY3R9IGJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBjb25zdCBlcXVhbGl0eUZsYXQgPSAoYSwgYikgPT4gYSA9PT0gYiB8fCAoYSAhPSBudWxsICYmIGIgIT0gbnVsbCAmJiBhLmNvbnN0cnVjdG9yID09PSBiLmNvbnN0cnVjdG9yICYmICgoYXJyYXkuaXNBcnJheShhKSAmJiBhcnJheS5lcXVhbEZsYXQoYSwgLyoqIEB0eXBlIHtBcnJheTxUPn0gKi8gKGIpKSkgfHwgKHR5cGVvZiBhID09PSAnb2JqZWN0JyAmJiBvYmplY3QuZXF1YWxGbGF0KGEsIGIpKSkpXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBhXG4gKiBAcGFyYW0ge2FueX0gYlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGVxdWFsaXR5RGVlcCA9IChhLCBiKSA9PiB7XG4gIGlmIChhID09PSBiKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCB8fCAoYS5jb25zdHJ1Y3RvciAhPT0gYi5jb25zdHJ1Y3RvciAmJiAoYS5jb25zdHJ1Y3RvciB8fCBPYmplY3QpICE9PSAoYi5jb25zdHJ1Y3RvciB8fCBPYmplY3QpKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIGlmIChhW2VxdWFsaXR5VHJhaXQuRXF1YWxpdHlUcmFpdFN5bWJvbF0gIT0gbnVsbCkge1xuICAgIHJldHVybiBhW2VxdWFsaXR5VHJhaXQuRXF1YWxpdHlUcmFpdFN5bWJvbF0oYilcbiAgfVxuICBzd2l0Y2ggKGEuY29uc3RydWN0b3IpIHtcbiAgICBjYXNlIEFycmF5QnVmZmVyOlxuICAgICAgYSA9IG5ldyBVaW50OEFycmF5KGEpXG4gICAgICBiID0gbmV3IFVpbnQ4QXJyYXkoYilcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZmFsbHRocm91Z2hcbiAgICBjYXNlIFVpbnQ4QXJyYXk6IHtcbiAgICAgIGlmIChhLmJ5dGVMZW5ndGggIT09IGIuYnl0ZUxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuICAgIH1cbiAgICBjYXNlIFNldDoge1xuICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhKSB7XG4gICAgICAgIGlmICghYi5oYXModmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgfVxuICAgIGNhc2UgTWFwOiB7XG4gICAgICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBhLmtleXMoKSkge1xuICAgICAgICBpZiAoIWIuaGFzKGtleSkgfHwgIWVxdWFsaXR5RGVlcChhLmdldChrZXkpLCBiLmdldChrZXkpKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuICAgIH1cbiAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICBjYXNlIE9iamVjdDpcbiAgICAgIGlmIChvYmplY3Quc2l6ZShhKSAhPT0gb2JqZWN0LnNpemUoYikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBhKSB7XG4gICAgICAgIGlmICghb2JqZWN0Lmhhc1Byb3BlcnR5KGEsIGtleSkgfHwgIWVxdWFsaXR5RGVlcChhW2tleV0sIGJba2V5XSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICBjYXNlIEFycmF5OlxuICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWVxdWFsaXR5RGVlcChhW2ldLCBiW2ldKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBWXG4gKiBAdGVtcGxhdGUge1Z9IE9QVFNcbiAqXG4gKiBAcGFyYW0ge1Z9IHZhbHVlXG4gKiBAcGFyYW0ge0FycmF5PE9QVFM+fSBvcHRpb25zXG4gKi9cbi8vIEB0cy1pZ25vcmVcbmV4cG9ydCBjb25zdCBpc09uZU9mID0gKHZhbHVlLCBvcHRpb25zKSA9PiBvcHRpb25zLmluY2x1ZGVzKHZhbHVlKVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuZXhwb3J0IGNvbnN0IGlzQXJyYXkgPSBhcnJheS5pc0FycmF5XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IHNcbiAqIEByZXR1cm4ge3MgaXMgU3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgaXNTdHJpbmcgPSAocykgPT4gcyAmJiBzLmNvbnN0cnVjdG9yID09PSBTdHJpbmdcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gblxuICogQHJldHVybiB7biBpcyBOdW1iZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCBpc051bWJlciA9IG4gPT4gbiAhPSBudWxsICYmIG4uY29uc3RydWN0b3IgPT09IE51bWJlclxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7YWJzdHJhY3QgbmV3ICguLi5hcmdzOiBhbnkpID0+IGFueX0gVFlQRVxuICogQHBhcmFtIHthbnl9IG5cbiAqIEBwYXJhbSB7VFlQRX0gVFxuICogQHJldHVybiB7biBpcyBJbnN0YW5jZVR5cGU8VFlQRT59XG4gKi9cbmV4cG9ydCBjb25zdCBpcyA9IChuLCBUKSA9PiBuICYmIG4uY29uc3RydWN0b3IgPT09IFRcblxuLyoqXG4gKiBAdGVtcGxhdGUge2Fic3RyYWN0IG5ldyAoLi4uYXJnczogYW55KSA9PiBhbnl9IFRZUEVcbiAqIEBwYXJhbSB7VFlQRX0gVFxuICovXG5leHBvcnQgY29uc3QgaXNUZW1wbGF0ZSA9IChUKSA9PlxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG5cbiAgICogQHJldHVybiB7biBpcyBJbnN0YW5jZVR5cGU8VFlQRT59XG4gICAqKi9cbiAgbiA9PiBuICYmIG4uY29uc3RydWN0b3IgPT09IFRcbiIsICIvKipcbiAqIElzb21vcnBoaWMgbW9kdWxlIHRvIHdvcmsgYWNjZXNzIHRoZSBlbnZpcm9ubWVudCAocXVlcnkgcGFyYW1zLCBlbnYgdmFyaWFibGVzKS5cbiAqXG4gKiBAbW9kdWxlIGVudmlyb25tZW50XG4gKi9cblxuaW1wb3J0ICogYXMgbWFwIGZyb20gJy4vbWFwLmpzJ1xuaW1wb3J0ICogYXMgc3RyaW5nIGZyb20gJy4vc3RyaW5nLmpzJ1xuaW1wb3J0ICogYXMgY29uZGl0aW9ucyBmcm9tICcuL2NvbmRpdGlvbnMuanMnXG5pbXBvcnQgKiBhcyBzdG9yYWdlIGZyb20gJy4vc3RvcmFnZS5qcydcbmltcG9ydCAqIGFzIGYgZnJvbSAnLi9mdW5jdGlvbi5qcydcblxuLyogYzggaWdub3JlIG5leHQgMiAqL1xuLy8gQHRzLWlnbm9yZVxuZXhwb3J0IGNvbnN0IGlzTm9kZSA9IHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLnJlbGVhc2UgJiYgL25vZGV8aW9cXC5qcy8udGVzdChwcm9jZXNzLnJlbGVhc2UubmFtZSkgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyA/IHByb2Nlc3MgOiAwKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nXG5cbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5leHBvcnQgY29uc3QgaXNCcm93c2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiAhaXNOb2RlXG4vKiBjOCBpZ25vcmUgbmV4dCAzICovXG5leHBvcnQgY29uc3QgaXNNYWMgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJ1xuICA/IC9NYWMvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKVxuICA6IGZhbHNlXG5cbi8qKlxuICogQHR5cGUge01hcDxzdHJpbmcsc3RyaW5nPn1cbiAqL1xubGV0IHBhcmFtc1xuY29uc3QgYXJncyA9IFtdXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuY29uc3QgY29tcHV0ZVBhcmFtcyA9ICgpID0+IHtcbiAgaWYgKHBhcmFtcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGlzTm9kZSkge1xuICAgICAgcGFyYW1zID0gbWFwLmNyZWF0ZSgpXG4gICAgICBjb25zdCBwYXJncyA9IHByb2Nlc3MuYXJndlxuICAgICAgbGV0IGN1cnJQYXJhbU5hbWUgPSBudWxsXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHBhcmcgPSBwYXJnc1tpXVxuICAgICAgICBpZiAocGFyZ1swXSA9PT0gJy0nKSB7XG4gICAgICAgICAgaWYgKGN1cnJQYXJhbU5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHBhcmFtcy5zZXQoY3VyclBhcmFtTmFtZSwgJycpXG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJQYXJhbU5hbWUgPSBwYXJnXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGN1cnJQYXJhbU5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHBhcmFtcy5zZXQoY3VyclBhcmFtTmFtZSwgcGFyZylcbiAgICAgICAgICAgIGN1cnJQYXJhbU5hbWUgPSBudWxsXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaChwYXJnKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGN1cnJQYXJhbU5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgcGFyYW1zLnNldChjdXJyUGFyYW1OYW1lLCAnJylcbiAgICAgIH1cbiAgICAgIC8vIGluIFJlYWN0TmF0aXZlIGZvciBleGFtcGxlIHRoaXMgd291bGQgbm90IGJlIHRydWUgKHVubGVzcyBjb25uZWN0ZWQgdG8gdGhlIFJlbW90ZSBEZWJ1Z2dlcilcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBsb2NhdGlvbiA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHBhcmFtcyA9IG1hcC5jcmVhdGUoKTsgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gICAgICAobG9jYXRpb24uc2VhcmNoIHx8ICc/Jykuc2xpY2UoMSkuc3BsaXQoJyYnKS5mb3JFYWNoKChrdikgPT4ge1xuICAgICAgICBpZiAoa3YubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgY29uc3QgW2tleSwgdmFsdWVdID0ga3Yuc3BsaXQoJz0nKVxuICAgICAgICAgIHBhcmFtcy5zZXQoYC0tJHtzdHJpbmcuZnJvbUNhbWVsQ2FzZShrZXksICctJyl9YCwgdmFsdWUpXG4gICAgICAgICAgcGFyYW1zLnNldChgLSR7c3RyaW5nLmZyb21DYW1lbENhc2Uoa2V5LCAnLScpfWAsIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBwYXJhbXMgPSBtYXAuY3JlYXRlKClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBhcmFtc1xufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCBoYXNQYXJhbSA9IChuYW1lKSA9PiBjb21wdXRlUGFyYW1zKCkuaGFzKG5hbWUpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBkZWZhdWx0VmFsXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDIgKi9cbmV4cG9ydCBjb25zdCBnZXRQYXJhbSA9IChuYW1lLCBkZWZhdWx0VmFsKSA9PlxuICBjb21wdXRlUGFyYW1zKCkuZ2V0KG5hbWUpIHx8IGRlZmF1bHRWYWxcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7c3RyaW5nfG51bGx9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDQgKi9cbmV4cG9ydCBjb25zdCBnZXRWYXJpYWJsZSA9IChuYW1lKSA9PlxuICBpc05vZGVcbiAgICA/IGNvbmRpdGlvbnMudW5kZWZpbmVkVG9OdWxsKHByb2Nlc3MuZW52W25hbWUudG9VcHBlckNhc2UoKS5yZXBsYWNlQWxsKCctJywgJ18nKV0pXG4gICAgOiBjb25kaXRpb25zLnVuZGVmaW5lZFRvTnVsbChzdG9yYWdlLnZhclN0b3JhZ2UuZ2V0SXRlbShuYW1lKSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7c3RyaW5nfG51bGx9XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDIgKi9cbmV4cG9ydCBjb25zdCBnZXRDb25mID0gKG5hbWUpID0+XG4gIGNvbXB1dGVQYXJhbXMoKS5nZXQoJy0tJyArIG5hbWUpIHx8IGdldFZhcmlhYmxlKG5hbWUpXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuLyogYzggaWdub3JlIG5leHQgNSAqL1xuZXhwb3J0IGNvbnN0IGVuc3VyZUNvbmYgPSAobmFtZSkgPT4ge1xuICBjb25zdCBjID0gZ2V0Q29uZihuYW1lKVxuICBpZiAoYyA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGNvbmZpZ3VyYXRpb24gXCIke25hbWUudG9VcHBlckNhc2UoKS5yZXBsYWNlQWxsKCctJywgJ18nKX1cImApXG4gIHJldHVybiBjXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDIgKi9cbmV4cG9ydCBjb25zdCBoYXNDb25mID0gKG5hbWUpID0+XG4gIGhhc1BhcmFtKCctLScgKyBuYW1lKSB8fCBnZXRWYXJpYWJsZShuYW1lKSAhPT0gbnVsbFxuXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IHByb2R1Y3Rpb24gPSBoYXNDb25mKCdwcm9kdWN0aW9uJylcblxuLyogYzggaWdub3JlIG5leHQgMiAqL1xuY29uc3QgZm9yY2VDb2xvciA9IGlzTm9kZSAmJlxuICBmLmlzT25lT2YocHJvY2Vzcy5lbnYuRk9SQ0VfQ09MT1IsIFsndHJ1ZScsICcxJywgJzInXSlcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIENvbG9yIGlzIGVuYWJsZWQgYnkgZGVmYXVsdCBpZiB0aGUgdGVybWluYWwgc3VwcG9ydHMgaXQuXG4gKlxuICogRXhwbGljaXRseSBlbmFibGUgY29sb3IgdXNpbmcgYC0tY29sb3JgIHBhcmFtZXRlclxuICogRGlzYWJsZSBjb2xvciB1c2luZyBgLS1uby1jb2xvcmAgcGFyYW1ldGVyIG9yIHVzaW5nIGBOT19DT0xPUj0xYCBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAqIGBGT1JDRV9DT0xPUj0xYCBlbmFibGVzIGNvbG9yIGFuZCB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgYWxsLlxuICovXG5leHBvcnQgY29uc3Qgc3VwcG9ydHNDb2xvciA9IGZvcmNlQ29sb3IgfHwgKFxuICAhaGFzUGFyYW0oJy0tbm8tY29sb3JzJykgJiYgLy8gQHRvZG8gZGVwcmVjYXRlIC0tbm8tY29sb3JzXG4gICFoYXNDb25mKCduby1jb2xvcicpICYmXG4gICghaXNOb2RlIHx8IHByb2Nlc3Muc3Rkb3V0LmlzVFRZKSAmJiAoXG4gICAgIWlzTm9kZSB8fFxuICAgIGhhc1BhcmFtKCctLWNvbG9yJykgfHxcbiAgICBnZXRWYXJpYWJsZSgnQ09MT1JURVJNJykgIT09IG51bGwgfHxcbiAgICAoZ2V0VmFyaWFibGUoJ1RFUk0nKSB8fCAnJykuaW5jbHVkZXMoJ2NvbG9yJylcbiAgKVxuKVxuLyogYzggaWdub3JlIHN0b3AgKi9cbiIsICIvKipcbiAqIFdvcmtpbmcgd2l0aCB2YWx1ZSBwYWlycy5cbiAqXG4gKiBAbW9kdWxlIHBhaXJcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBMLFJcbiAqL1xuZXhwb3J0IGNsYXNzIFBhaXIge1xuICAvKipcbiAgICogQHBhcmFtIHtMfSBsZWZ0XG4gICAqIEBwYXJhbSB7Un0gcmlnaHRcbiAgICovXG4gIGNvbnN0cnVjdG9yIChsZWZ0LCByaWdodCkge1xuICAgIHRoaXMubGVmdCA9IGxlZnRcbiAgICB0aGlzLnJpZ2h0ID0gcmlnaHRcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBMLFJcbiAqIEBwYXJhbSB7TH0gbGVmdFxuICogQHBhcmFtIHtSfSByaWdodFxuICogQHJldHVybiB7UGFpcjxMLFI+fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlID0gKGxlZnQsIHJpZ2h0KSA9PiBuZXcgUGFpcihsZWZ0LCByaWdodClcblxuLyoqXG4gKiBAdGVtcGxhdGUgTCxSXG4gKiBAcGFyYW0ge1J9IHJpZ2h0XG4gKiBAcGFyYW0ge0x9IGxlZnRcbiAqIEByZXR1cm4ge1BhaXI8TCxSPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVJldmVyc2VkID0gKHJpZ2h0LCBsZWZ0KSA9PiBuZXcgUGFpcihsZWZ0LCByaWdodClcblxuLyoqXG4gKiBAdGVtcGxhdGUgTCxSXG4gKiBAcGFyYW0ge0FycmF5PFBhaXI8TCxSPj59IGFyclxuICogQHBhcmFtIHtmdW5jdGlvbihMLCBSKTphbnl9IGZcbiAqL1xuZXhwb3J0IGNvbnN0IGZvckVhY2ggPSAoYXJyLCBmKSA9PiBhcnIuZm9yRWFjaChwID0+IGYocC5sZWZ0LCBwLnJpZ2h0KSlcblxuLyoqXG4gKiBAdGVtcGxhdGUgTCxSLFhcbiAqIEBwYXJhbSB7QXJyYXk8UGFpcjxMLFI+Pn0gYXJyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKEwsIFIpOlh9IGZcbiAqIEByZXR1cm4ge0FycmF5PFg+fVxuICovXG5leHBvcnQgY29uc3QgbWFwID0gKGFyciwgZikgPT4gYXJyLm1hcChwID0+IGYocC5sZWZ0LCBwLnJpZ2h0KSlcbiIsICIvKipcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIHRvIHdvcmsgd2l0aCBidWZmZXJzIChVaW50OEFycmF5KS5cbiAqXG4gKiBAbW9kdWxlIGJ1ZmZlclxuICovXG5cbmltcG9ydCAqIGFzIHN0cmluZyBmcm9tICcuL3N0cmluZy5qcydcbmltcG9ydCAqIGFzIGVudiBmcm9tICcuL2Vudmlyb25tZW50LmpzJ1xuaW1wb3J0ICogYXMgYXJyYXkgZnJvbSAnLi9hcnJheS5qcydcbmltcG9ydCAqIGFzIG1hdGggZnJvbSAnLi9tYXRoLmpzJ1xuaW1wb3J0ICogYXMgZW5jb2RpbmcgZnJvbSAnLi9lbmNvZGluZy5qcydcbmltcG9ydCAqIGFzIGRlY29kaW5nIGZyb20gJy4vZGVjb2RpbmcuanMnXG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlVWludDhBcnJheUZyb21MZW4gPSBsZW4gPT4gbmV3IFVpbnQ4QXJyYXkobGVuKVxuXG4vKipcbiAqIENyZWF0ZSBVaW50OEFycmF5IHdpdGggaW5pdGlhbCBjb250ZW50IGZyb20gYnVmZmVyXG4gKlxuICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYnVmZmVyXG4gKiBAcGFyYW0ge251bWJlcn0gYnl0ZU9mZnNldFxuICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aFxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlVWludDhBcnJheVZpZXdGcm9tQXJyYXlCdWZmZXIgPSAoYnVmZmVyLCBieXRlT2Zmc2V0LCBsZW5ndGgpID0+IG5ldyBVaW50OEFycmF5KGJ1ZmZlciwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuXG4vKipcbiAqIENyZWF0ZSBVaW50OEFycmF5IHdpdGggaW5pdGlhbCBjb250ZW50IGZyb20gYnVmZmVyXG4gKlxuICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYnVmZmVyXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVVaW50OEFycmF5RnJvbUFycmF5QnVmZmVyID0gYnVmZmVyID0+IG5ldyBVaW50OEFycmF5KGJ1ZmZlcilcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnl0ZXNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuY29uc3QgdG9CYXNlNjRCcm93c2VyID0gYnl0ZXMgPT4ge1xuICBsZXQgcyA9ICcnXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZXMuYnl0ZUxlbmd0aDsgaSsrKSB7XG4gICAgcyArPSBzdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldKVxuICB9XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuICByZXR1cm4gYnRvYShzKVxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ5dGVzXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmNvbnN0IHRvQmFzZTY0Tm9kZSA9IGJ5dGVzID0+IEJ1ZmZlci5mcm9tKGJ5dGVzLmJ1ZmZlciwgYnl0ZXMuYnl0ZU9mZnNldCwgYnl0ZXMuYnl0ZUxlbmd0aCkudG9TdHJpbmcoJ2Jhc2U2NCcpXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc1xuICogQHJldHVybiB7VWludDhBcnJheTxBcnJheUJ1ZmZlcj59XG4gKi9cbmNvbnN0IGZyb21CYXNlNjRCcm93c2VyID0gcyA9PiB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuICBjb25zdCBhID0gYXRvYihzKVxuICBjb25zdCBieXRlcyA9IGNyZWF0ZVVpbnQ4QXJyYXlGcm9tTGVuKGEubGVuZ3RoKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICBieXRlc1tpXSA9IGEuY2hhckNvZGVBdChpKVxuICB9XG4gIHJldHVybiBieXRlc1xufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBDb3BpZXMgdGhlIHJlc3VsdDogc21hbGwgQnVmZmVycyBhcmUgYWxsb2NhdGVkIGZyb20gTm9kZSdzIHNoYXJlZCBwb29sLCBhbmQgYSB2aWV3IG9uIGl0IHdvdWxkIGV4cG9zZSB1bnJlbGF0ZWRcbiAqIG1lbW9yeSB2aWEgYC5idWZmZXJgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzXG4gKiBAcmV0dXJuIHtVaW50OEFycmF5PEFycmF5QnVmZmVyPn1cbiAqL1xuY29uc3QgZnJvbUJhc2U2NE5vZGUgPSBzID0+IG5ldyBVaW50OEFycmF5KEJ1ZmZlci5mcm9tKHMsICdiYXNlNjQnKSlcblxuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCB0b0Jhc2U2NCA9IGVudi5pc0Jyb3dzZXIgPyB0b0Jhc2U2NEJyb3dzZXIgOiB0b0Jhc2U2NE5vZGVcblxuLyogYzggaWdub3JlIG5leHQgKi9cbmV4cG9ydCBjb25zdCBmcm9tQmFzZTY0ID0gZW52LmlzQnJvd3NlciA/IGZyb21CYXNlNjRCcm93c2VyIDogZnJvbUJhc2U2NE5vZGVcblxuLyoqXG4gKiBJbXBsZW1lbnRzIGJhc2U2NHVybCAtIHNlZSBodHRwczovL2RhdGF0cmFja2VyLmlldGYub3JnL2RvYy9odG1sL3JmYzQ2NDgjc2VjdGlvbi01XG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICovXG5leHBvcnQgY29uc3QgdG9CYXNlNjRVcmxFbmNvZGVkID0gYnVmID0+IHRvQmFzZTY0KGJ1ZikucmVwbGFjZUFsbCgnKycsICctJykucmVwbGFjZUFsbCgnLycsICdfJykucmVwbGFjZUFsbCgnPScsICcnKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBiYXNlNjRcbiAqL1xuZXhwb3J0IGNvbnN0IGZyb21CYXNlNjRVcmxFbmNvZGVkID0gYmFzZTY0ID0+IGZyb21CYXNlNjQoYmFzZTY0LnJlcGxhY2VBbGwoJy0nLCAnKycpLnJlcGxhY2VBbGwoJ18nLCAnLycpKVxuXG4vKipcbiAqIEJhc2U2NCBpcyBhbHdheXMgYSBtb3JlIGVmZmljaWVudCBjaG9pY2UuIFRoaXMgZXhpc3RzIGZvciB1dGlsaXR5IHB1cnBvc2VzIG9ubHkuXG4gKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZcbiAqL1xuZXhwb3J0IGNvbnN0IHRvSGV4U3RyaW5nID0gYnVmID0+IGFycmF5Lm1hcChidWYsIGIgPT4gYi50b1N0cmluZygxNikucGFkU3RhcnQoMiwgJzAnKSkuam9pbignJylcblxuLyoqXG4gKiBOb3RlOiBUaGlzIGZ1bmN0aW9uIGV4cGVjdHMgdGhhdCB0aGUgaGV4IGRvZXNuJ3Qgc3RhcnQgd2l0aCAweC4uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGhleFxuICovXG5leHBvcnQgY29uc3QgZnJvbUhleFN0cmluZyA9IGhleCA9PiB7XG4gIGNvbnN0IGhsZW4gPSBoZXgubGVuZ3RoXG4gIGNvbnN0IGJ1ZiA9IG5ldyBVaW50OEFycmF5KG1hdGguY2VpbChobGVuIC8gMikpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaGxlbjsgaSArPSAyKSB7XG4gICAgYnVmW2J1Zi5sZW5ndGggLSBpIC8gMiAtIDFdID0gTnVtYmVyLnBhcnNlSW50KGhleC5zbGljZShobGVuIC0gaSAtIDIsIGhsZW4gLSBpKSwgMTYpXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG4vKipcbiAqIENvcHkgdGhlIGNvbnRlbnQgb2YgYW4gVWludDhBcnJheSB2aWV3IHRvIGEgbmV3IEFycmF5QnVmZmVyLlxuICpcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhBcnJheVxuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IGNvcHlVaW50OEFycmF5ID0gdWludDhBcnJheSA9PiB7XG4gIGNvbnN0IG5ld0J1ZiA9IGNyZWF0ZVVpbnQ4QXJyYXlGcm9tTGVuKHVpbnQ4QXJyYXkuYnl0ZUxlbmd0aClcbiAgbmV3QnVmLnNldCh1aW50OEFycmF5KVxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qKlxuICogRW5jb2RlIGFueXRoaW5nIGFzIGEgVUludDhBcnJheS4gSXQncyBhIHB1biBvbiB0eXBlc2NyaXB0cydzIGBhbnlgIHR5cGUuXG4gKiBTZWUgZW5jb2Rpbmcud3JpdGVBbnkgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gKlxuICogQHBhcmFtIHthbnl9IGRhdGFcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBlbmNvZGVBbnkgPSBkYXRhID0+XG4gIGVuY29kaW5nLmVuY29kZShlbmNvZGVyID0+IGVuY29kaW5nLndyaXRlQW55KGVuY29kZXIsIGRhdGEpKVxuXG4vKipcbiAqIERlY29kZSBhbiBhbnktZW5jb2RlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZlxuICogQHJldHVybiB7YW55fVxuICovXG5leHBvcnQgY29uc3QgZGVjb2RlQW55ID0gYnVmID0+IGRlY29kaW5nLnJlYWRBbnkoZGVjb2RpbmcuY3JlYXRlRGVjb2RlcihidWYpKVxuXG4vKipcbiAqIFNoaWZ0IEJ5dGUgQXJyYXkge059IGJpdHMgdG8gdGhlIGxlZnQuIERvZXMgbm90IGV4cGFuZCBieXRlIGFycmF5LlxuICpcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnNcbiAqIEBwYXJhbSB7bnVtYmVyfSBOIHNob3VsZCBiZSBpbiB0aGUgcmFuZ2Ugb2YgWzAtN11cbiAqL1xuZXhwb3J0IGNvbnN0IHNoaWZ0TkJpdHNMZWZ0ID0gKGJzLCBOKSA9PiB7XG4gIGlmIChOID09PSAwKSByZXR1cm4gYnNcbiAgYnMgPSBuZXcgVWludDhBcnJheShicylcbiAgYnNbMF0gPDw9IE5cbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBicy5sZW5ndGg7IGkrKykge1xuICAgIGJzW2kgLSAxXSB8PSBic1tpXSA+Pj4gKDggLSBOKVxuICAgIGJzW2ldIDw8PSBOXG4gIH1cbiAgcmV0dXJuIGJzXG59XG4iLCAiLyoqXG4gKiBGYXN0IFBzZXVkbyBSYW5kb20gTnVtYmVyIEdlbmVyYXRvcnMuXG4gKlxuICogR2l2ZW4gYSBzZWVkIGEgUFJORyBnZW5lcmF0ZXMgYSBzZXF1ZW5jZSBvZiBudW1iZXJzIHRoYXQgY2Fubm90IGJlIHJlYXNvbmFibHkgcHJlZGljdGVkLlxuICogVHdvIFBSTkdzIG11c3QgZ2VuZXJhdGUgdGhlIHNhbWUgcmFuZG9tIHNlcXVlbmNlIG9mIG51bWJlcnMgaWYgIGdpdmVuIHRoZSBzYW1lIHNlZWQuXG4gKlxuICogQG1vZHVsZSBwcm5nXG4gKi9cblxuaW1wb3J0ICogYXMgYmluYXJ5IGZyb20gJy4vYmluYXJ5LmpzJ1xuaW1wb3J0IHsgZnJvbUNoYXJDb2RlLCBmcm9tQ29kZVBvaW50IH0gZnJvbSAnLi9zdHJpbmcuanMnXG5pbXBvcnQgKiBhcyBtYXRoIGZyb20gJy4vbWF0aC5qcydcbmltcG9ydCB7IFhvcm9zaGlybzEyOHBsdXMgfSBmcm9tICcuL3BybmcvWG9yb3NoaXJvMTI4cGx1cy5qcydcbmltcG9ydCAqIGFzIGJ1ZmZlciBmcm9tICcuL2J1ZmZlci5qcydcblxuLyoqXG4gKiBEZXNjcmlwdGlvbiBvZiB0aGUgZnVuY3Rpb25cbiAqICBAY2FsbGJhY2sgZ2VuZXJhdG9yTmV4dFxuICogIEByZXR1cm4ge251bWJlcn0gQSByYW5kb20gZmxvYXQgaW4gdGhlIGNhbmdlIG9mIFswLDEpXG4gKi9cblxuLyoqXG4gKiBBIHJhbmRvbSB0eXBlIGdlbmVyYXRvci5cbiAqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBQUk5HXG4gKiBAcHJvcGVydHkge2dlbmVyYXRvck5leHR9IG5leHQgR2VuZXJhdGUgbmV3IG51bWJlclxuICovXG5leHBvcnQgY29uc3QgRGVmYXVsdFBSTkcgPSBYb3Jvc2hpcm8xMjhwbHVzXG5cbi8qKlxuICogQ3JlYXRlIGEgWG9yb3NoaXJvMTI4cGx1cyBQc2V1ZG8tUmFuZG9tLU51bWJlci1HZW5lcmF0b3IuXG4gKiBUaGlzIGlzIHRoZSBmYXN0ZXN0IGZ1bGwtcGVyaW9kIGdlbmVyYXRvciBwYXNzaW5nIEJpZ0NydXNoIHdpdGhvdXQgc3lzdGVtYXRpYyBmYWlsdXJlcy5cbiAqIEJ1dCB0aGVyZSBhcmUgbW9yZSBQUk5HcyBhdmFpbGFibGUgaW4gLi9QUk5HLy5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gc2VlZCBBIHBvc2l0aXZlIDMyYml0IGludGVnZXIuIERvIG5vdCB1c2UgbmVnYXRpdmUgbnVtYmVycy5cbiAqIEByZXR1cm4ge1BSTkd9XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGUgPSBzZWVkID0+IG5ldyBEZWZhdWx0UFJORyhzZWVkKVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHNpbmdsZSByYW5kb20gYm9vbC5cbiAqXG4gKiBAcGFyYW0ge1BSTkd9IGdlbiBBIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yLlxuICogQHJldHVybiB7Qm9vbGVhbn0gQSByYW5kb20gYm9vbGVhblxuICovXG5leHBvcnQgY29uc3QgYm9vbCA9IGdlbiA9PiAoZ2VuLm5leHQoKSA+PSAwLjUpXG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmFuZG9tIGludGVnZXIgd2l0aCA1MyBiaXQgcmVzb2x1dGlvbi5cbiAqXG4gKiBAcGFyYW0ge1BSTkd9IGdlbiBBIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yLlxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbiBUaGUgbG93ZXIgYm91bmQgb2YgdGhlIGFsbG93ZWQgcmV0dXJuIHZhbHVlcyAoaW5jbHVzaXZlKS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBtYXggVGhlIHVwcGVyIGJvdW5kIG9mIHRoZSBhbGxvd2VkIHJldHVybiB2YWx1ZXMgKGluY2x1c2l2ZSkuXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEEgcmFuZG9tIGludGVnZXIgb24gW21pbiwgbWF4XVxuICovXG5leHBvcnQgY29uc3QgaW50NTMgPSAoZ2VuLCBtaW4sIG1heCkgPT4gbWF0aC5mbG9vcihnZW4ubmV4dCgpICogKG1heCArIDEgLSBtaW4pICsgbWluKVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHJhbmRvbSBpbnRlZ2VyIHdpdGggNTMgYml0IHJlc29sdXRpb24uXG4gKlxuICogQHBhcmFtIHtQUk5HfSBnZW4gQSByYW5kb20gbnVtYmVyIGdlbmVyYXRvci5cbiAqIEBwYXJhbSB7TnVtYmVyfSBtaW4gVGhlIGxvd2VyIGJvdW5kIG9mIHRoZSBhbGxvd2VkIHJldHVybiB2YWx1ZXMgKGluY2x1c2l2ZSkuXG4gKiBAcGFyYW0ge051bWJlcn0gbWF4IFRoZSB1cHBlciBib3VuZCBvZiB0aGUgYWxsb3dlZCByZXR1cm4gdmFsdWVzIChpbmNsdXNpdmUpLlxuICogQHJldHVybiB7TnVtYmVyfSBBIHJhbmRvbSBpbnRlZ2VyIG9uIFttaW4sIG1heF1cbiAqL1xuZXhwb3J0IGNvbnN0IHVpbnQ1MyA9IChnZW4sIG1pbiwgbWF4KSA9PiBtYXRoLmFicyhpbnQ1MyhnZW4sIG1pbiwgbWF4KSlcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gaW50ZWdlciB3aXRoIDMyIGJpdCByZXNvbHV0aW9uLlxuICpcbiAqIEBwYXJhbSB7UFJOR30gZ2VuIEEgcmFuZG9tIG51bWJlciBnZW5lcmF0b3IuXG4gKiBAcGFyYW0ge051bWJlcn0gbWluIFRoZSBsb3dlciBib3VuZCBvZiB0aGUgYWxsb3dlZCByZXR1cm4gdmFsdWVzIChpbmNsdXNpdmUpLlxuICogQHBhcmFtIHtOdW1iZXJ9IG1heCBUaGUgdXBwZXIgYm91bmQgb2YgdGhlIGFsbG93ZWQgcmV0dXJuIHZhbHVlcyAoaW5jbHVzaXZlKS5cbiAqIEByZXR1cm4ge051bWJlcn0gQSByYW5kb20gaW50ZWdlciBvbiBbbWluLCBtYXhdXG4gKi9cbmV4cG9ydCBjb25zdCBpbnQzMiA9IChnZW4sIG1pbiwgbWF4KSA9PiBtYXRoLmZsb29yKGdlbi5uZXh0KCkgKiAobWF4ICsgMSAtIG1pbikgKyBtaW4pXG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmFuZG9tIGludGVnZXIgd2l0aCA1MyBiaXQgcmVzb2x1dGlvbi5cbiAqXG4gKiBAcGFyYW0ge1BSTkd9IGdlbiBBIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yLlxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbiBUaGUgbG93ZXIgYm91bmQgb2YgdGhlIGFsbG93ZWQgcmV0dXJuIHZhbHVlcyAoaW5jbHVzaXZlKS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBtYXggVGhlIHVwcGVyIGJvdW5kIG9mIHRoZSBhbGxvd2VkIHJldHVybiB2YWx1ZXMgKGluY2x1c2l2ZSkuXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEEgcmFuZG9tIGludGVnZXIgb24gW21pbiwgbWF4XVxuICovXG5leHBvcnQgY29uc3QgdWludDMyID0gKGdlbiwgbWluLCBtYXgpID0+IGludDMyKGdlbiwgbWluLCBtYXgpID4+PiAwXG5cbi8qKlxuICogQGRlcHJlY2F0ZWRcbiAqIE9wdGltaXplZCB2ZXJzaW9uIG9mIHBybmcuaW50MzIuIEl0IGhhcyB0aGUgc2FtZSBwcmVjaXNpb24gYXMgcHJuZy5pbnQzMiwgYnV0IHNob3VsZCBiZSBwcmVmZXJyZWQgd2hlblxuICogb3BlbmFyaW5nIG9uIHNtYWxsZXIgcmFuZ2VzLlxuICpcbiAqIEBwYXJhbSB7UFJOR30gZ2VuIEEgcmFuZG9tIG51bWJlciBnZW5lcmF0b3IuXG4gKiBAcGFyYW0ge051bWJlcn0gbWluIFRoZSBsb3dlciBib3VuZCBvZiB0aGUgYWxsb3dlZCByZXR1cm4gdmFsdWVzIChpbmNsdXNpdmUpLlxuICogQHBhcmFtIHtOdW1iZXJ9IG1heCBUaGUgdXBwZXIgYm91bmQgb2YgdGhlIGFsbG93ZWQgcmV0dXJuIHZhbHVlcyAoaW5jbHVzaXZlKS4gVGhlIG1heCBpbmNsdXNpdmUgbnVtYmVyIGlzIGBiaW5hcnkuQklUUzMxLTFgXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEEgcmFuZG9tIGludGVnZXIgb24gW21pbiwgbWF4XVxuICovXG5leHBvcnQgY29uc3QgaW50MzEgPSAoZ2VuLCBtaW4sIG1heCkgPT4gaW50MzIoZ2VuLCBtaW4sIG1heClcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gcmVhbCBvbiBbMCwgMSkgd2l0aCA1MyBiaXQgcmVzb2x1dGlvbi5cbiAqXG4gKiBAcGFyYW0ge1BSTkd9IGdlbiBBIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yLlxuICogQHJldHVybiB7TnVtYmVyfSBBIHJhbmRvbSByZWFsIG51bWJlciBvbiBbMCwgMSkuXG4gKi9cbmV4cG9ydCBjb25zdCByZWFsNTMgPSBnZW4gPT4gZ2VuLm5leHQoKSAvLyAoKChnZW4ubmV4dCgpID4+PiA1KSAqIGJpbmFyeS5CSVQyNikgKyAoZ2VuLm5leHQoKSA+Pj4gNikpIC8gTUFYX1NBRkVfSU5URUdFUlxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHJhbmRvbSBjaGFyYWN0ZXIgZnJvbSBjaGFyIGNvZGUgMzIgLSAxMjYuIEkuZS4gQ2hhcmFjdGVycywgTnVtYmVycywgc3BlY2lhbCBjaGFyYWN0ZXJzLCBhbmQgU3BhY2U6XG4gKlxuICogQHBhcmFtIHtQUk5HfSBnZW4gQSByYW5kb20gbnVtYmVyIGdlbmVyYXRvci5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqXG4gKiAoU3BhY2UpIVwiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbL11eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5cbiAqL1xuZXhwb3J0IGNvbnN0IGNoYXIgPSBnZW4gPT4gZnJvbUNoYXJDb2RlKGludDMxKGdlbiwgMzIsIDEyNikpXG5cbi8qKlxuICogQHBhcmFtIHtQUk5HfSBnZW5cbiAqIEByZXR1cm4ge3N0cmluZ30gQSBzaW5nbGUgbGV0dGVyIChhLXopXG4gKi9cbmV4cG9ydCBjb25zdCBsZXR0ZXIgPSBnZW4gPT4gZnJvbUNoYXJDb2RlKGludDMxKGdlbiwgOTcsIDEyMikpXG5cbi8qKlxuICogQHBhcmFtIHtQUk5HfSBnZW5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbbWluTGVuPTBdXG4gKiBAcGFyYW0ge251bWJlcn0gW21heExlbj0yMF1cbiAqIEByZXR1cm4ge3N0cmluZ30gQSByYW5kb20gd29yZCAoMC0yMCBjaGFyYWN0ZXJzKSB3aXRob3V0IHNwYWNlcyBjb25zaXN0aW5nIG9mIGxldHRlcnMgKGEteilcbiAqL1xuZXhwb3J0IGNvbnN0IHdvcmQgPSAoZ2VuLCBtaW5MZW4gPSAwLCBtYXhMZW4gPSAyMCkgPT4ge1xuICBjb25zdCBsZW4gPSBpbnQzMShnZW4sIG1pbkxlbiwgbWF4TGVuKVxuICBsZXQgc3RyID0gJydcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIHN0ciArPSBsZXR0ZXIoZ2VuKVxuICB9XG4gIHJldHVybiBzdHJcbn1cblxuLyoqXG4gKiBUT0RPOiB0aGlzIGZ1bmN0aW9uIHByb2R1Y2VzIGludmFsaWQgcnVuZXMuIERvZXMgbm90IGNvdmVyIGFsbCBvZiB1dGYxNiEhXG4gKlxuICogQHBhcmFtIHtQUk5HfSBnZW5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IHV0ZjE2UnVuZSA9IGdlbiA9PiB7XG4gIGNvbnN0IGNvZGVwb2ludCA9IGludDMxKGdlbiwgMCwgMjU2KVxuICByZXR1cm4gZnJvbUNvZGVQb2ludChjb2RlcG9pbnQpXG59XG5cbi8qKlxuICogQHBhcmFtIHtQUk5HfSBnZW5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbbWF4bGVuID0gMjBdXG4gKi9cbmV4cG9ydCBjb25zdCB1dGYxNlN0cmluZyA9IChnZW4sIG1heGxlbiA9IDIwKSA9PiB7XG4gIGNvbnN0IGxlbiA9IGludDMxKGdlbiwgMCwgbWF4bGVuKVxuICBsZXQgc3RyID0gJydcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIHN0ciArPSB1dGYxNlJ1bmUoZ2VuKVxuICB9XG4gIHJldHVybiBzdHJcbn1cblxuLyoqXG4gKiBSZXR1cm5zIG9uZSBlbGVtZW50IG9mIGEgZ2l2ZW4gYXJyYXkuXG4gKlxuICogQHBhcmFtIHtQUk5HfSBnZW4gQSByYW5kb20gbnVtYmVyIGdlbmVyYXRvci5cbiAqIEBwYXJhbSB7QXJyYXk8VD59IGFycmF5IE5vbiBlbXB0eSBBcnJheSBvZiBwb3NzaWJsZSB2YWx1ZXMuXG4gKiBAcmV0dXJuIHtUfSBPbmUgb2YgdGhlIHZhbHVlcyBvZiB0aGUgc3VwcGxpZWQgQXJyYXkuXG4gKiBAdGVtcGxhdGUgVFxuICovXG5leHBvcnQgY29uc3Qgb25lT2YgPSAoZ2VuLCBhcnJheSkgPT4gYXJyYXlbaW50MzEoZ2VuLCAwLCBhcnJheS5sZW5ndGggLSAxKV1cblxuLyoqXG4gKiBAcGFyYW0ge1BSTkd9IGdlblxuICogQHBhcmFtIHtudW1iZXJ9IGxlblxuICogQHJldHVybiB7VWludDhBcnJheTxBcnJheUJ1ZmZlcj59XG4gKi9cbmV4cG9ydCBjb25zdCB1aW50OEFycmF5ID0gKGdlbiwgbGVuKSA9PiB7XG4gIGNvbnN0IGJ1ZiA9IGJ1ZmZlci5jcmVhdGVVaW50OEFycmF5RnJvbUxlbihsZW4pXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmLmxlbmd0aDsgaSsrKSB7XG4gICAgYnVmW2ldID0gaW50MzIoZ2VuLCAwLCBiaW5hcnkuQklUUzgpXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQHBhcmFtIHtQUk5HfSBnZW5cbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5cbiAqIEByZXR1cm4ge1VpbnQxNkFycmF5fVxuICovXG5leHBvcnQgY29uc3QgdWludDE2QXJyYXkgPSAoZ2VuLCBsZW4pID0+IG5ldyBVaW50MTZBcnJheSh1aW50OEFycmF5KGdlbiwgbGVuICogMikuYnVmZmVyKVxuXG4vKipcbiAqIEBwYXJhbSB7UFJOR30gZ2VuXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuXG4gKiBAcmV0dXJuIHtVaW50MzJBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IHVpbnQzMkFycmF5ID0gKGdlbiwgbGVuKSA9PiBuZXcgVWludDMyQXJyYXkodWludDhBcnJheShnZW4sIGxlbiAqIDQpLmJ1ZmZlcilcbi8qIGM4IGlnbm9yZSBzdG9wICovXG4iLCAiLyoqXG4gKiBAZXhwZXJpbWVudGFsIFdJUFxuICpcbiAqIFNpbXBsZSAmIGVmZmljaWVudCBzY2hlbWFzIGZvciB5b3VyIGRhdGEuXG4gKi9cblxuaW1wb3J0ICogYXMgb2JqIGZyb20gJy4vb2JqZWN0LmpzJ1xuaW1wb3J0ICogYXMgYXJyIGZyb20gJy4vYXJyYXkuanMnXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICcuL2Vycm9yLmpzJ1xuaW1wb3J0ICogYXMgZW52IGZyb20gJy4vZW52aXJvbm1lbnQuanMnXG5pbXBvcnQgKiBhcyBlcXVhbGl0eVRyYWl0cyBmcm9tICcuL3RyYWl0L2VxdWFsaXR5LmpzJ1xuaW1wb3J0ICogYXMgZnVuIGZyb20gJy4vZnVuY3Rpb24uanMnXG5pbXBvcnQgKiBhcyBzdHJpbmcgZnJvbSAnLi9zdHJpbmcuanMnXG5pbXBvcnQgKiBhcyBwcm5nIGZyb20gJy4vcHJuZy5qcydcbmltcG9ydCAqIGFzIG51bWJlciBmcm9tICcuL251bWJlci5qcydcblxuLyoqXG4gKiBAdHlwZWRlZiB7c3RyaW5nfG51bWJlcnxiaWdpbnR8Ym9vbGVhbnxudWxsfHVuZGVmaW5lZHxzeW1ib2x9IFByaW1pdGl2ZVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge3sgW2s6c3RyaW5nfG51bWJlcnxzeW1ib2xdOiBhbnkgfX0gQW55T2JqZWN0XG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHR5cGVkZWYge1QgZXh0ZW5kcyBTY2hlbWE8aW5mZXIgWD4gPyBYIDogVH0gVW53cmFwXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHR5cGVkZWYge1QgZXh0ZW5kcyBTY2hlbWE8aW5mZXIgWD4gPyBYIDogVH0gVHlwZU9mXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUge3JlYWRvbmx5IHVua25vd25bXX0gVFxuICogQHR5cGVkZWYge1QgZXh0ZW5kcyByZWFkb25seSBbU2NoZW1hPGluZmVyIEZpcnN0PiwgLi4uaW5mZXIgUmVzdF0gPyBbRmlyc3QsIC4uLlVud3JhcEFycmF5PFJlc3Q+XSA6IFtdIH0gVW53cmFwQXJyYXlcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAdHlwZWRlZiB7VCBleHRlbmRzIFNjaGVtYTxpbmZlciBTPiA/IFNjaGVtYTxTPiA6IG5ldmVyfSBDYXN0VG9TY2hlbWFcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7dW5rbm93bltdfSBBcnJcbiAqIEB0eXBlZGVmIHtBcnIgZXh0ZW5kcyBbLi4udW5rbm93bltdLCBpbmZlciBMXSA/IEwgOiBuZXZlcn0gVHVwbGVMYXN0XG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUge3Vua25vd25bXX0gQXJyXG4gKiBAdHlwZWRlZiB7QXJyIGV4dGVuZHMgWy4uLmluZmVyIEZzLCB1bmtub3duXSA/IEZzIDogbmV2ZXJ9IFR1cGxlUG9wXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUge3JlYWRvbmx5IHVua25vd25bXX0gVFxuICogQHR5cGVkZWYge1QgZXh0ZW5kcyBbXVxuICogICA/IHt9XG4gKiAgIDogVCBleHRlbmRzIFtpbmZlciBGaXJzdF1cbiAqICAgPyBGaXJzdFxuICogICA6IFQgZXh0ZW5kcyBbaW5mZXIgRmlyc3QsIC4uLmluZmVyIFJlc3RdXG4gKiAgID8gRmlyc3QgJiBJbnRlcnNlY3Q8UmVzdD5cbiAqICAgOiBuZXZlclxuICogfSBJbnRlcnNlY3RcbiAqL1xuXG5jb25zdCBzY2hlbWFTeW1ib2wgPSBTeW1ib2woJzBzY2hlbWEnKVxuXG5leHBvcnQgY2xhc3MgVmFsaWRhdGlvbkVycm9yIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIC8qKlxuICAgICAqIFJldmVyc2UgZXJyb3JzXG4gICAgICogQHR5cGUge0FycmF5PHsgcGF0aDogc3RyaW5nPywgZXhwZWN0ZWQ6IHN0cmluZywgaGFzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZz8gfT59XG4gICAgICovXG4gICAgdGhpcy5fcmVycnMgPSBbXVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gcGF0aFxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXhwZWN0ZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhhc1xuICAgKiBAcGFyYW0ge3N0cmluZz99IG1lc3NhZ2VcbiAgICovXG4gIGV4dGVuZCAocGF0aCwgZXhwZWN0ZWQsIGhhcywgbWVzc2FnZSA9IG51bGwpIHtcbiAgICB0aGlzLl9yZXJycy5wdXNoKHsgcGF0aCwgZXhwZWN0ZWQsIGhhcywgbWVzc2FnZSB9KVxuICB9XG5cbiAgdG9TdHJpbmcgKCkge1xuICAgIGNvbnN0IHMgPSBbXVxuICAgIGZvciAobGV0IGkgPSB0aGlzLl9yZXJycy5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICBjb25zdCByID0gdGhpcy5fcmVycnNbaV1cbiAgICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgICBzLnB1c2goc3RyaW5nLnJlcGVhdCgnICcsICh0aGlzLl9yZXJycy5sZW5ndGggLSBpKSAqIDIpICsgYCR7ci5wYXRoICE9IG51bGwgPyBgWyR7ci5wYXRofV0gYCA6ICcnfSR7ci5oYXN9IGRvZXNuJ3QgbWF0Y2ggJHtyLmV4cGVjdGVkfS4gJHtyLm1lc3NhZ2V9YClcbiAgICB9XG4gICAgcmV0dXJuIHMuam9pbignXFxuJylcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBhXG4gKiBAcGFyYW0ge2FueX0gYlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuY29uc3Qgc2hhcGVFeHRlbmRzID0gKGEsIGIpID0+IHtcbiAgaWYgKGEgPT09IGIpIHJldHVybiB0cnVlXG4gIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsIHx8IGEuY29uc3RydWN0b3IgIT09IGIuY29uc3RydWN0b3IpIHJldHVybiBmYWxzZVxuICBpZiAoYVtlcXVhbGl0eVRyYWl0cy5FcXVhbGl0eVRyYWl0U3ltYm9sXSkgcmV0dXJuIGVxdWFsaXR5VHJhaXRzLmVxdWFscyhhLCBiKSAvLyBsYXN0IHJlc29ydDogY2hlY2sgZXF1YWxpdHkgKGRvIHRoaXMgYmVmb3JlIGFycmF5IGFuZCBvYmogY2hlY2sgd2hpY2ggZG9uJ3QgaW1wbGVtZW50IHRoZSBlcXVhbGl0eSB0cmFpdClcbiAgaWYgKGFyci5pc0FycmF5KGEpKSB7XG4gICAgcmV0dXJuIGFyci5ldmVyeShhLCBhaXRlbSA9PlxuICAgICAgYXJyLnNvbWUoYiwgYml0ZW0gPT4gc2hhcGVFeHRlbmRzKGFpdGVtLCBiaXRlbSkpXG4gICAgKVxuICB9IGVsc2UgaWYgKG9iai5pc09iamVjdChhKSkge1xuICAgIHJldHVybiBvYmouZXZlcnkoYSwgKGFpdGVtLCBha2V5KSA9PlxuICAgICAgc2hhcGVFeHRlbmRzKGFpdGVtLCBiW2FrZXldKVxuICAgIClcbiAgfVxuICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQGltcGxlbWVudHMge2VxdWFsaXR5VHJhaXRzLkVxdWFsaXR5VHJhaXR9XG4gKi9cbmV4cG9ydCBjbGFzcyBTY2hlbWEge1xuICAvLyB0aGlzLnNoYXBlIG11c3Qgbm90IGJlIGRlZmluZWQgb24gU2NoZW1hLiBPdGhlcndpc2UgdHlwZWNoZWNrIG9uIG1ldGF0eXBlcyAoZS5nLiAkJG9iamVjdCkgd29uJ3Qgd29yayBhcyBleHBlY3RlZCBhbnltb3JlXG4gIC8qKlxuICAgKiBJZiB0cnVlLCB0aGUgbW9yZSB0aGluZ3MgYXJlIGFkZGVkIHRvIHRoZSBzaGFwZSB0aGUgbW9yZSBvYmplY3RzIHRoaXMgc2NoZW1hIHdpbGwgYWNjZXB0IChlLmcuXG4gICAqIHVuaW9uKS4gQnkgZGVmYXVsdCwgdGhlIG1vcmUgb2JqZWN0cyBhcmUgYWRkZWQsIHRoZSB0aGUgZmV3ZXIgb2JqZWN0cyB0aGlzIHNjaGVtYSB3aWxsIGFjY2VwdC5cbiAgICogQHByb3RlY3RlZFxuICAgKi9cbiAgc3RhdGljIF9kaWx1dGVzID0gZmFsc2VcblxuICAvKipcbiAgICogQHBhcmFtIHtTY2hlbWE8YW55Pn0gb3RoZXJcbiAgICovXG4gIGV4dGVuZHMgKG90aGVyKSB7XG4gICAgbGV0IFthLCBiXSA9IFsvKiogQHR5cGUge2FueX0gKi8odGhpcykuc2hhcGUsIC8qKiBAdHlwZSB7YW55fSAqLyAob3RoZXIpLnNoYXBlXVxuICAgIGlmICgvKiogQHR5cGUge3R5cGVvZiBTY2hlbWE8YW55Pn0gKi8gKHRoaXMuY29uc3RydWN0b3IpLl9kaWx1dGVzKSBbYiwgYV0gPSBbYSwgYl1cbiAgICByZXR1cm4gc2hhcGVFeHRlbmRzKGEsIGIpXG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlIHRoaXMgd2hlbiBuZWNlc3NhcnkuIEJ5IGRlZmF1bHQsIHdlIG9ubHkgY2hlY2sgdGhlIGBzaGFwZWAgcHJvcGVydHkgd2hpY2ggZXZlcnkgc2hhcGVcbiAgICogc2hvdWxkIGhhdmUuXG4gICAqIEBwYXJhbSB7U2NoZW1hPGFueT59IG90aGVyXG4gICAqL1xuICBlcXVhbHMgKG90aGVyKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yID09PSBvdGhlci5jb25zdHJ1Y3RvciAmJiBmdW4uZXF1YWxpdHlEZWVwKHRoaXMuc2hhcGUsIG90aGVyLnNoYXBlKVxuICB9XG5cbiAgW3NjaGVtYVN5bWJvbF0gKCkgeyByZXR1cm4gdHJ1ZSB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvdGhlclxuICAgKi9cbiAgW2VxdWFsaXR5VHJhaXRzLkVxdWFsaXR5VHJhaXRTeW1ib2xdIChvdGhlcikge1xuICAgIHJldHVybiB0aGlzLmVxdWFscygvKiogQHR5cGUge2FueX0gKi8gKG90aGVyKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2UgYHNjaGVtYS52YWxpZGF0ZShvYmopYCB3aXRoIGEgdHlwZWQgcGFyYW1ldGVyIHRoYXQgaXMgYWxyZWFkeSBvZiB0eXBlZCB0byBiZSBhbiBpbnN0YW5jZSBvZlxuICAgKiBTY2hlbWEuIFZhbGlkYXRlIHdpbGwgY2hlY2sgdGhlIHN0cnVjdHVyZSBvZiB0aGUgcGFyYW1ldGVyIGFuZCByZXR1cm4gdHJ1ZSBpZmYgdGhlIGluc3RhbmNlXG4gICAqIHJlYWxseSBpcyBhbiBpbnN0YW5jZSBvZiBTY2hlbWEuXG4gICAqXG4gICAqIEBwYXJhbSB7VH0gb1xuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgdmFsaWRhdGUgKG8pIHtcbiAgICByZXR1cm4gdGhpcy5jaGVjayhvKVxuICB9XG5cbiAgLyogYzggaWdub3JlIHN0YXJ0ICovXG4gIC8qKlxuICAgKiBTaW1pbGFyIHRvIHZhbGlkYXRlLCBidXQgdGhpcyBtZXRob2QgYWNjZXB0cyB1bnR5cGVkIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqIEBwYXJhbSB7YW55fSBfb1xuICAgKiBAcGFyYW0ge1ZhbGlkYXRpb25FcnJvcn0gW19lcnJdXG4gICAqIEByZXR1cm4ge19vIGlzIFR9XG4gICAqL1xuICBjaGVjayAoX28sIF9lcnIpIHtcbiAgICBlcnJvci5tZXRob2RVbmltcGxlbWVudGVkKClcbiAgfVxuICAvKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4gIC8qKlxuICAgKiBAdHlwZSB7U2NoZW1hPFQ/Pn1cbiAgICovXG4gIGdldCBudWxsYWJsZSAoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHJldHVybiAkdW5pb24odGhpcywgJG51bGwpXG4gIH1cblxuICAvKipcbiAgICogQHR5cGUgeyRPcHRpb25hbDxTY2hlbWE8VD4+fVxuICAgKi9cbiAgZ2V0IG9wdGlvbmFsICgpIHtcbiAgICByZXR1cm4gbmV3ICRPcHRpb25hbCgvKiogQHR5cGUge1NjaGVtYTxUPn0gKi8gKHRoaXMpKVxuICB9XG5cbiAgLyoqXG4gICAqIENhc3QgYSB2YXJpYWJsZSB0byBhIHNwZWNpZmljIHR5cGUuIFJldHVybnMgdGhlIGNhc3RlZCB2YWx1ZSwgb3IgdGhyb3dzIGFuIGV4Y2VwdGlvbiBvdGhlcndpc2UuXG4gICAqIFVzZSB0aGlzIGlmIHlvdSBrbm93IHRoYXQgdGhlIHR5cGUgaXMgb2YgYSBzcGVjaWZpYyB0eXBlIGFuZCB5b3UganVzdCB3YW50IHRvIGNvbnZpbmNlIHRoZSB0eXBlXG4gICAqIHN5c3RlbS5cbiAgICpcbiAgICogKipEbyBub3QgcmVseSBvbiB0aGVzZSBlcnJvciBtZXNzYWdlcyEqKlxuICAgKiBQZXJmb3JtcyBhbiBhc3NlcnRpb24gY2hlY2sgb25seSBpZiBub3QgaW4gYSBwcm9kdWN0aW9uIGVudmlyb25tZW50LlxuICAgKlxuICAgKiBAdGVtcGxhdGUgT09cbiAgICogQHBhcmFtIHtPT30gb1xuICAgKiBAcmV0dXJuIHtFeHRyYWN0PE9PLCBUPiBleHRlbmRzIG5ldmVyID8gVCA6IChPTyBleHRlbmRzIEFycmF5PG5ldmVyPiA/IFQgOiBFeHRyYWN0PE9PLFQ+KX1cbiAgICovXG4gIGNhc3QgKG8pIHtcbiAgICBhc3NlcnQobywgdGhpcylcbiAgICByZXR1cm4gLyoqIEB0eXBlIHthbnl9ICovIChvKVxuICB9XG5cbiAgLyoqXG4gICAqIEVYUEVDVE8gUEFUUk9OVU0hISBcdUQ4M0VcdURFODRcbiAgICogVGhpcyBmdW5jdGlvbiBwcm90ZWN0cyBhZ2FpbnN0IHR5cGUgZXJyb3JzLiBUaG91Z2ggaXQgbWF5IG5vdCB3b3JrIGluIHRoZSByZWFsIHdvcmxkLlxuICAgKlxuICAgKiBcIkFmdGVyIGFsbCB0aGlzIHRpbWU/XCJcbiAgICogXCJBbHdheXMuXCIgLSBTbmFwZSwgdGFsa2luZyBhYm91dCB0eXBlIHNhZmV0eVxuICAgKlxuICAgKiBFbnN1cmVzIHRoYXQgYSB2YXJpYWJsZSBpcyBhIGEgc3BlY2lmaWMgdHlwZS4gUmV0dXJucyB0aGUgdmFsdWUsIG9yIHRocm93cyBhbiBleGNlcHRpb24gaWYgdGhlIGFzc2VydGlvbiBjaGVjayBmYWlsZWQuXG4gICAqIFVzZSB0aGlzIGlmIHlvdSBrbm93IHRoYXQgdGhlIHR5cGUgaXMgb2YgYSBzcGVjaWZpYyB0eXBlIGFuZCB5b3UganVzdCB3YW50IHRvIGNvbnZpbmNlIHRoZSB0eXBlXG4gICAqIHN5c3RlbS5cbiAgICpcbiAgICogQ2FuIGJlIHVzZWZ1bCB3aGVuIGRlZmluaW5nIGxhbWJkYXM6IGBzLmxhbWJkYShzLiRudW1iZXIsIHMuJHZvaWQpLmV4cGVjdCgobikgPT4gbiArIDEpYFxuICAgKlxuICAgKiAqKkRvIG5vdCByZWx5IG9uIHRoZXNlIGVycm9yIG1lc3NhZ2VzISoqXG4gICAqIFBlcmZvcm1zIGFuIGFzc2VydGlvbiBjaGVjayBpZiBub3QgaW4gYSBwcm9kdWN0aW9uIGVudmlyb25tZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge1R9IG9cbiAgICogQHJldHVybiB7byBleHRlbmRzIFQgPyBUIDogbmV2ZXJ9XG4gICAqL1xuICBleHBlY3QgKG8pIHtcbiAgICBhc3NlcnQobywgdGhpcylcbiAgICByZXR1cm4gb1xuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIHsobmV3ICguLi5hcmdzOmFueVtdKSA9PiBhbnkpIHwgKCguLi5hcmdzOmFueVtdKSA9PiBhbnkpfSBDb25zdHJcbiAqIEB0eXBlZGVmIHtDb25zdHIgZXh0ZW5kcyAoKC4uLmFyZ3M6YW55W10pID0+IGluZmVyIFQpID8gVCA6IChDb25zdHIgZXh0ZW5kcyAobmV3ICguLi5hcmdzOmFueVtdKSA9PiBhbnkpID8gSW5zdGFuY2VUeXBlPENvbnN0cj4gOiBuZXZlcil9IEluc3RhbmNlXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUgeyhuZXcgKC4uLmFyZ3M6YW55W10pID0+IGFueSkgfCAoKC4uLmFyZ3M6YW55W10pID0+IGFueSl9IENcbiAqIEBleHRlbmRzIHtTY2hlbWE8SW5zdGFuY2U8Qz4+fVxuICovXG5leHBvcnQgY2xhc3MgJENvbnN0cnVjdGVkQnkgZXh0ZW5kcyBTY2hlbWEge1xuICAvKipcbiAgICogQHBhcmFtIHtDfSBjXG4gICAqIEBwYXJhbSB7KChvOkluc3RhbmNlPEM+KT0+Ym9vbGVhbil8bnVsbH0gY2hlY2tcbiAgICovXG4gIGNvbnN0cnVjdG9yIChjLCBjaGVjaykge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLnNoYXBlID0gY1xuICAgIHRoaXMuX2MgPSBjaGVja1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBvXG4gICAqIEBwYXJhbSB7VmFsaWRhdGlvbkVycm9yfSBbZXJyXVxuICAgKiBAcmV0dXJuIHtvIGlzIEMgZXh0ZW5kcyAoKC4uLmFyZ3M6YW55W10pID0+IGluZmVyIFQpID8gVCA6IChDIGV4dGVuZHMgKG5ldyAoLi4uYXJnczphbnlbXSkgPT4gYW55KSA/IEluc3RhbmNlVHlwZTxDPiA6IG5ldmVyKX0gb1xuICAgKi9cbiAgY2hlY2sgKG8sIGVyciA9IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGMgPSBvPy5jb25zdHJ1Y3RvciA9PT0gdGhpcy5zaGFwZSAmJiAodGhpcy5fYyA9PSBudWxsIHx8IHRoaXMuX2MobykpXG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAhYyAmJiBlcnI/LmV4dGVuZChudWxsLCB0aGlzLnNoYXBlLm5hbWUsIG8/LmNvbnN0cnVjdG9yLm5hbWUsIG8/LmNvbnN0cnVjdG9yICE9PSB0aGlzLnNoYXBlID8gJ0NvbnN0cnVjdG9yIG1hdGNoIGZhaWxlZCcgOiAnQ2hlY2sgZmFpbGVkJylcbiAgICByZXR1cm4gY1xuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIHsobmV3ICguLi5hcmdzOmFueVtdKSA9PiBhbnkpIHwgKCguLi5hcmdzOmFueVtdKSA9PiBhbnkpfSBDXG4gKiBAcGFyYW0ge0N9IGNcbiAqIEBwYXJhbSB7KChvOkluc3RhbmNlPEM+KSA9PiBib29sZWFuKXxudWxsfSBjaGVja1xuICogQHJldHVybiB7Q2FzdFRvU2NoZW1hPCRDb25zdHJ1Y3RlZEJ5PEM+Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRjb25zdHJ1Y3RlZEJ5ID0gKGMsIGNoZWNrID0gbnVsbCkgPT4gbmV3ICRDb25zdHJ1Y3RlZEJ5KGMsIGNoZWNrKVxuZXhwb3J0IGNvbnN0ICQkY29uc3RydWN0ZWRCeSA9ICRjb25zdHJ1Y3RlZEJ5KCRDb25zdHJ1Y3RlZEJ5KVxuXG4vKipcbiAqIENoZWNrIGN1c3RvbSBwcm9wZXJ0aWVzIG9uIGFueSBvYmplY3QuIFlvdSBtYXkgd2FudCB0byBvdmVyd3JpdGUgdGhlIGdlbmVyYXRlZCBTY2hlbWE8YW55Pi5cbiAqXG4gKiBAZXh0ZW5kcyB7U2NoZW1hPGFueT59XG4gKi9cbmV4cG9ydCBjbGFzcyAkQ3VzdG9tIGV4dGVuZHMgU2NoZW1hIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7KG86YW55KSA9PiBib29sZWFufSBjaGVja1xuICAgKi9cbiAgY29uc3RydWN0b3IgKGNoZWNrKSB7XG4gICAgc3VwZXIoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHsobzphbnkpID0+IGJvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5zaGFwZSA9IGNoZWNrXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9cbiAgICogQHBhcmFtIHtWYWxpZGF0aW9uRXJyb3J9IGVyclxuICAgKiBAcmV0dXJuIHtvIGlzIGFueX1cbiAgICovXG4gIGNoZWNrIChvLCBlcnIpIHtcbiAgICBjb25zdCBjID0gdGhpcy5zaGFwZShvKVxuICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgIWMgJiYgZXJyPy5leHRlbmQobnVsbCwgJ2N1c3RvbSBwcm9wJywgbz8uY29uc3RydWN0b3IubmFtZSwgJ2ZhaWxlZCB0byBjaGVjayBjdXN0b20gcHJvcCcpXG4gICAgcmV0dXJuIGNcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7KG86YW55KSA9PiBib29sZWFufSBjaGVja1xuICogQHJldHVybiB7U2NoZW1hPGFueT59XG4gKi9cbmV4cG9ydCBjb25zdCAkY3VzdG9tID0gKGNoZWNrKSA9PiBuZXcgJEN1c3RvbShjaGVjaylcbmV4cG9ydCBjb25zdCAkJGN1c3RvbSA9ICRjb25zdHJ1Y3RlZEJ5KCRDdXN0b20pXG5cbi8qKlxuICogQHRlbXBsYXRlIHtQcmltaXRpdmV9IFRcbiAqIEBleHRlbmRzIHtTY2hlbWE8VD59XG4gKi9cbmV4cG9ydCBjbGFzcyAkTGl0ZXJhbCBleHRlbmRzIFNjaGVtYSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5PFQ+fSBsaXRlcmFsc1xuICAgKi9cbiAgY29uc3RydWN0b3IgKGxpdGVyYWxzKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuc2hhcGUgPSBsaXRlcmFsc1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSB7YW55fSBvXG4gICAqIEBwYXJhbSB7VmFsaWRhdGlvbkVycm9yfSBbZXJyXVxuICAgKiBAcmV0dXJuIHtvIGlzIFR9XG4gICAqL1xuICBjaGVjayAobywgZXJyKSB7XG4gICAgY29uc3QgYyA9IHRoaXMuc2hhcGUuc29tZShhID0+IGEgPT09IG8pXG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAhYyAmJiBlcnI/LmV4dGVuZChudWxsLCB0aGlzLnNoYXBlLmpvaW4oJyB8ICcpLCBvLnRvU3RyaW5nKCkpXG4gICAgcmV0dXJuIGNcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7UHJpbWl0aXZlW119IFRcbiAqIEBwYXJhbSB7VH0gbGl0ZXJhbHNcbiAqIEByZXR1cm4ge0Nhc3RUb1NjaGVtYTwkTGl0ZXJhbDxUW251bWJlcl0+Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRsaXRlcmFsID0gKC4uLmxpdGVyYWxzKSA9PiBuZXcgJExpdGVyYWwobGl0ZXJhbHMpXG5leHBvcnQgY29uc3QgJCRsaXRlcmFsID0gJGNvbnN0cnVjdGVkQnkoJExpdGVyYWwpXG5cbi8qKlxuICogQHRlbXBsYXRlIHtBcnJheTxzdHJpbmd8U2NoZW1hPHN0cmluZ3xudW1iZXI+Pn0gVHNcbiAqIEB0eXBlZGVmIHtUcyBleHRlbmRzIFtdID8gYGAgOiAoVHMgZXh0ZW5kcyBbaW5mZXIgVF0gPyAoVW53cmFwPFQ+IGV4dGVuZHMgKHN0cmluZ3xudW1iZXIpID8gVW53cmFwPFQ+IDogbmV2ZXIpIDogKFRzIGV4dGVuZHMgW2luZmVyIFQxLCAuLi5pbmZlciBSZXN0XSA/IGAke1Vud3JhcDxUMT4gZXh0ZW5kcyAoc3RyaW5nfG51bWJlcikgPyBVbndyYXA8VDE+IDogbmV2ZXJ9JHtSZXN0IGV4dGVuZHMgQXJyYXk8c3RyaW5nfFNjaGVtYTxzdHJpbmd8bnVtYmVyPj4gPyBDYXN0U3RyaW5nVGVtcGxhdGVBcmdzVG9UZW1wbGF0ZTxSZXN0PiA6IG5ldmVyfWAgOiBuZXZlcikpfSBDYXN0U3RyaW5nVGVtcGxhdGVBcmdzVG9UZW1wbGF0ZVxuICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5jb25zdCBfcmVnZXhFc2NhcGUgPSAvKiogQHR5cGUge2FueX0gKi8gKFJlZ0V4cCkuZXNjYXBlIHx8IC8qKiBAdHlwZSB7KHN0cjpzdHJpbmcpID0+IHN0cmluZ30gKi8gKHN0ciA9PlxuICBzdHIucmVwbGFjZSgvWygpLnwmLCReW1xcXV0vZywgcyA9PiAnXFxcXCcgKyBzKVxuKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfFNjaGVtYTxhbnk+fSBzXG4gKiBAcmV0dXJuIHtzdHJpbmdbXX1cbiAqL1xuY29uc3QgX3NjaGVtYVN0cmluZ1RlbXBsYXRlVG9SZWdleCA9IHMgPT4ge1xuICBpZiAoJHN0cmluZy5jaGVjayhzKSkge1xuICAgIHJldHVybiBbX3JlZ2V4RXNjYXBlKHMpXVxuICB9XG4gIGlmICgkJGxpdGVyYWwuY2hlY2socykpIHtcbiAgICByZXR1cm4gLyoqIEB0eXBlIHtBcnJheTxzdHJpbmd8bnVtYmVyPn0gKi8gKHMuc2hhcGUpLm1hcCh2ID0+IHYgKyAnJylcbiAgfVxuICBpZiAoJCRudW1iZXIuY2hlY2socykpIHtcbiAgICByZXR1cm4gWydbKy1dP1xcXFxkKy4/XFxcXGQqJ11cbiAgfVxuICBpZiAoJCRzdHJpbmcuY2hlY2socykpIHtcbiAgICByZXR1cm4gWycuKiddXG4gIH1cbiAgaWYgKCQkdW5pb24uY2hlY2socykpIHtcbiAgICByZXR1cm4gcy5zaGFwZS5tYXAoX3NjaGVtYVN0cmluZ1RlbXBsYXRlVG9SZWdleCkuZmxhdCgxKVxuICB9XG4gIC8qIGM4IGlnbm9yZSBuZXh0IDIgKi9cbiAgLy8gdW5leHBlY3RlZCBzY2hlbWEgc3RydWN0dXJlIChvbmx5IHN1cHBvcnRzIHVuaW9ucyBhbmQgc3RyaW5nIGluIGxpdGVyYWwgdHlwZXMpXG4gIGVycm9yLnVuZXhwZWN0ZWRDYXNlKClcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUge0FycmF5PHN0cmluZ3xTY2hlbWE8c3RyaW5nfG51bWJlcj4+fSBUXG4gKiBAZXh0ZW5kcyB7U2NoZW1hPENhc3RTdHJpbmdUZW1wbGF0ZUFyZ3NUb1RlbXBsYXRlPFQ+Pn1cbiAqL1xuZXhwb3J0IGNsYXNzICRTdHJpbmdUZW1wbGF0ZSBleHRlbmRzIFNjaGVtYSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1R9IHNoYXBlXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc2hhcGUpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5zaGFwZSA9IHNoYXBlXG4gICAgdGhpcy5fciA9IG5ldyBSZWdFeHAoJ14nICsgc2hhcGUubWFwKF9zY2hlbWFTdHJpbmdUZW1wbGF0ZVRvUmVnZXgpLm1hcChvcHRzID0+IGAoJHtvcHRzLmpvaW4oJ3wnKX0pYCkuam9pbignJykgKyAnJCcpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9cbiAgICogQHBhcmFtIHtWYWxpZGF0aW9uRXJyb3J9IFtlcnJdXG4gICAqIEByZXR1cm4ge28gaXMgQ2FzdFN0cmluZ1RlbXBsYXRlQXJnc1RvVGVtcGxhdGU8VD59XG4gICAqL1xuICBjaGVjayAobywgZXJyKSB7XG4gICAgY29uc3QgYyA9IHRoaXMuX3IuZXhlYyhvKSAhPSBudWxsXG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAhYyAmJiBlcnI/LmV4dGVuZChudWxsLCB0aGlzLl9yLnRvU3RyaW5nKCksIG8udG9TdHJpbmcoKSwgJ1N0cmluZyBkb2VzblxcJ3QgbWF0Y2ggc3RyaW5nIHRlbXBsYXRlLicpXG4gICAgcmV0dXJuIGNcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7QXJyYXk8c3RyaW5nfFNjaGVtYTxzdHJpbmd8bnVtYmVyPj59IFRcbiAqIEBwYXJhbSB7VH0gbGl0ZXJhbHNcbiAqIEByZXR1cm4ge0Nhc3RUb1NjaGVtYTwkU3RyaW5nVGVtcGxhdGU8VD4+fVxuICovXG5leHBvcnQgY29uc3QgJHN0cmluZ1RlbXBsYXRlID0gKC4uLmxpdGVyYWxzKSA9PiBuZXcgJFN0cmluZ1RlbXBsYXRlKGxpdGVyYWxzKVxuZXhwb3J0IGNvbnN0ICQkc3RyaW5nVGVtcGxhdGUgPSAkY29uc3RydWN0ZWRCeSgkU3RyaW5nVGVtcGxhdGUpXG5cbmNvbnN0IGlzT3B0aW9uYWxTeW1ib2wgPSBTeW1ib2woJ29wdGlvbmFsJylcbi8qKlxuICogQHRlbXBsYXRlIHtTY2hlbWE8YW55Pn0gU1xuICogQGV4dGVuZHMgU2NoZW1hPFVud3JhcDxTPnx1bmRlZmluZWQ+XG4gKi9cbmNsYXNzICRPcHRpb25hbCBleHRlbmRzIFNjaGVtYSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1N9IHNoYXBlXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoc2hhcGUpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5zaGFwZSA9IHNoYXBlXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9cbiAgICogQHBhcmFtIHtWYWxpZGF0aW9uRXJyb3J9IFtlcnJdXG4gICAqIEByZXR1cm4ge28gaXMgKFVud3JhcDxTPnx1bmRlZmluZWQpfVxuICAgKi9cbiAgY2hlY2sgKG8sIGVycikge1xuICAgIGNvbnN0IGMgPSBvID09PSB1bmRlZmluZWQgfHwgdGhpcy5zaGFwZS5jaGVjayhvKVxuICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgIWMgJiYgZXJyPy5leHRlbmQobnVsbCwgJ3VuZGVmaW5lZCAob3B0aW9uYWwpJywgJygpJylcbiAgICByZXR1cm4gY1xuICB9XG5cbiAgZ2V0IFtpc09wdGlvbmFsU3ltYm9sXSAoKSB7IHJldHVybiB0cnVlIH1cbn1cbmV4cG9ydCBjb25zdCAkJG9wdGlvbmFsID0gJGNvbnN0cnVjdGVkQnkoJE9wdGlvbmFsKVxuXG4vKipcbiAqIEBleHRlbmRzIFNjaGVtYTxuZXZlcj5cbiAqL1xuY2xhc3MgJE5ldmVyIGV4dGVuZHMgU2NoZW1hIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBfb1xuICAgKiBAcGFyYW0ge1ZhbGlkYXRpb25FcnJvcn0gW2Vycl1cbiAgICogQHJldHVybiB7X28gaXMgbmV2ZXJ9XG4gICAqL1xuICBjaGVjayAoX28sIGVycikge1xuICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgZXJyPy5leHRlbmQobnVsbCwgJ25ldmVyJywgdHlwZW9mIF9vKVxuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbi8qKlxuICogQHR5cGUge1NjaGVtYTxuZXZlcj59XG4gKi9cbmV4cG9ydCBjb25zdCAkbmV2ZXIgPSBuZXcgJE5ldmVyKClcbmV4cG9ydCBjb25zdCAkJG5ldmVyID0gJGNvbnN0cnVjdGVkQnkoJE5ldmVyKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7eyBba2V5OiBzdHJpbmd8c3ltYm9sfG51bWJlcl06IFNjaGVtYTxhbnk+IH19IFNcbiAqIEB0eXBlZGVmIHt7IFtLZXkgaW4ga2V5b2YgUyBhcyBTW0tleV0gZXh0ZW5kcyAkT3B0aW9uYWw8U2NoZW1hPGFueT4+ID8gS2V5IDogbmV2ZXJdPzogU1tLZXldIGV4dGVuZHMgJE9wdGlvbmFsPFNjaGVtYTxpbmZlciBUeXBlPj4gPyBUeXBlIDogbmV2ZXIgfSAmIHsgW0tleSBpbiBrZXlvZiBTIGFzIFNbS2V5XSBleHRlbmRzICRPcHRpb25hbDxTY2hlbWE8YW55Pj4gPyBuZXZlciA6IEtleV06IFNbS2V5XSBleHRlbmRzIFNjaGVtYTxpbmZlciBUeXBlPiA/IFR5cGUgOiBuZXZlciB9fSAkT2JqZWN0VG9UeXBlXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUge3tba2V5OnN0cmluZ3xzeW1ib2x8bnVtYmVyXTogU2NoZW1hPGFueT59fSBTXG4gKiBAZXh0ZW5kcyB7U2NoZW1hPCRPYmplY3RUb1R5cGU8Uz4+fVxuICovXG5leHBvcnQgY2xhc3MgJE9iamVjdCBleHRlbmRzIFNjaGVtYSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1N9IHNoYXBlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcGFydGlhbFxuICAgKi9cbiAgY29uc3RydWN0b3IgKHNoYXBlLCBwYXJ0aWFsID0gZmFsc2UpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge1N9XG4gICAgICovXG4gICAgdGhpcy5zaGFwZSA9IHNoYXBlXG4gICAgdGhpcy5faXNQYXJ0aWFsID0gcGFydGlhbFxuICB9XG5cbiAgc3RhdGljIF9kaWx1dGVzID0gdHJ1ZVxuXG4gIC8qKlxuICAgKiBAdHlwZSB7U2NoZW1hPFBhcnRpYWw8JE9iamVjdFRvVHlwZTxTPj4+fVxuICAgKi9cbiAgZ2V0IHBhcnRpYWwgKCkge1xuICAgIHJldHVybiBuZXcgJE9iamVjdCh0aGlzLnNoYXBlLCB0cnVlKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBvXG4gICAqIEBwYXJhbSB7VmFsaWRhdGlvbkVycm9yfSBlcnJcbiAgICogQHJldHVybiB7byBpcyAkT2JqZWN0VG9UeXBlPFM+fVxuICAgKi9cbiAgY2hlY2sgKG8sIGVycikge1xuICAgIGlmIChvID09IG51bGwpIHtcbiAgICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgICBlcnI/LmV4dGVuZChudWxsLCAnb2JqZWN0JywgJ251bGwnKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHJldHVybiBvYmouZXZlcnkodGhpcy5zaGFwZSwgKHZ2LCB2aykgPT4ge1xuICAgICAgY29uc3QgYyA9ICh0aGlzLl9pc1BhcnRpYWwgJiYgIW9iai5oYXNQcm9wZXJ0eShvLCB2aykpIHx8IHZ2LmNoZWNrKG9bdmtdLCBlcnIpXG4gICAgICAhYyAmJiBlcnI/LmV4dGVuZCh2ay50b1N0cmluZygpLCB2di50b1N0cmluZygpLCB0eXBlb2Ygb1t2a10sICdPYmplY3QgcHJvcGVydHkgZG9lcyBub3QgbWF0Y2gnKVxuICAgICAgcmV0dXJuIGNcbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIFNcbiAqIEB0eXBlZGVmIHtTY2hlbWE8eyBbS2V5IGluIGtleW9mIFMgYXMgU1tLZXldIGV4dGVuZHMgJE9wdGlvbmFsPFNjaGVtYTxhbnk+PiA/IEtleSA6IG5ldmVyXT86IFNbS2V5XSBleHRlbmRzICRPcHRpb25hbDxTY2hlbWE8aW5mZXIgVHlwZT4+ID8gVHlwZSA6IG5ldmVyIH0gJiB7IFtLZXkgaW4ga2V5b2YgUyBhcyBTW0tleV0gZXh0ZW5kcyAkT3B0aW9uYWw8U2NoZW1hPGFueT4+ID8gbmV2ZXIgOiBLZXldOiBTW0tleV0gZXh0ZW5kcyBTY2hlbWE8aW5mZXIgVHlwZT4gPyBUeXBlIDogbmV2ZXIgfT59IF9PYmplY3REZWZUb1NjaGVtYVxuICovXG5cbi8vIEkgdXNlZCBhbiBleHBsaWNpdCB0eXBlIGFubm90YXRpb24gaW5zdGVhZCBvZiAkT2JqZWN0VG9UeXBlLCBzbyB0aGF0IHRoZSB1c2VyIGRvZXNuJ3Qgc2VlIHRoZVxuLy8gd2VpcmQgdHlwZSBkZWZpbml0aW9ucyB3aGVuIGluc3BlY3RpbmcgdHlwZSBkZWZpbmlvbnMuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7eyBba2V5OnN0cmluZ3xzeW1ib2x8bnVtYmVyXTogU2NoZW1hPGFueT4gfX0gU1xuICogQHBhcmFtIHtTfSBkZWZcbiAqIEByZXR1cm4ge19PYmplY3REZWZUb1NjaGVtYTxTPiBleHRlbmRzIFNjaGVtYTxpbmZlciBTPiA/IFNjaGVtYTx7IFtLIGluIGtleW9mIFNdOiBTW0tdIH0+IDogbmV2ZXJ9XG4gKi9cbmV4cG9ydCBjb25zdCAkb2JqZWN0ID0gZGVmID0+IC8qKiBAdHlwZSB7YW55fSAqLyAobmV3ICRPYmplY3QoZGVmKSlcbmV4cG9ydCBjb25zdCAkJG9iamVjdCA9ICRjb25zdHJ1Y3RlZEJ5KCRPYmplY3QpXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8e1trZXk6c3RyaW5nXTogYW55fT59XG4gKi9cbmV4cG9ydCBjb25zdCAkb2JqZWN0QW55ID0gJGN1c3RvbShvID0+IG8gIT0gbnVsbCAmJiAoby5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0IHx8IG8uY29uc3RydWN0b3IgPT0gbnVsbCkpXG5cbi8qKlxuICogQHRlbXBsYXRlIHtTY2hlbWE8c3RyaW5nfG51bWJlcnxzeW1ib2w+fSBLZXlzXG4gKiBAdGVtcGxhdGUge1NjaGVtYTxhbnk+fSBWYWx1ZXNcbiAqIEBleHRlbmRzIHtTY2hlbWE8eyBba2V5IGluIFVud3JhcDxLZXlzPl06IFVud3JhcDxWYWx1ZXM+IH0+fVxuICovXG5leHBvcnQgY2xhc3MgJFJlY29yZCBleHRlbmRzIFNjaGVtYSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0tleXN9IGtleXNcbiAgICogQHBhcmFtIHtWYWx1ZXN9IHZhbHVlc1xuICAgKi9cbiAgY29uc3RydWN0b3IgKGtleXMsIHZhbHVlcykge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLnNoYXBlID0ge1xuICAgICAga2V5cywgdmFsdWVzXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBvXG4gICAqIEBwYXJhbSB7VmFsaWRhdGlvbkVycm9yfSBlcnJcbiAgICogQHJldHVybiB7byBpcyB7IFtrZXkgaW4gVW53cmFwPEtleXM+XTogVW53cmFwPFZhbHVlcz4gfX1cbiAgICovXG4gIGNoZWNrIChvLCBlcnIpIHtcbiAgICByZXR1cm4gbyAhPSBudWxsICYmIG9iai5ldmVyeShvLCAodnYsIHZrKSA9PiB7XG4gICAgICBjb25zdCBjayA9IHRoaXMuc2hhcGUua2V5cy5jaGVjayh2aywgZXJyKVxuICAgICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAgICFjayAmJiBlcnI/LmV4dGVuZCh2ayArICcnLCAnUmVjb3JkJywgdHlwZW9mIG8sIGNrID8gJ0tleSBkb2VzblxcJ3QgbWF0Y2ggc2NoZW1hJyA6ICdWYWx1ZSBkb2VzblxcJ3QgbWF0Y2ggdmFsdWUnKVxuICAgICAgcmV0dXJuIGNrICYmIHRoaXMuc2hhcGUudmFsdWVzLmNoZWNrKHZ2LCBlcnIpXG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7U2NoZW1hPHN0cmluZ3xudW1iZXJ8c3ltYm9sPn0gS2V5c1xuICogQHRlbXBsYXRlIHtTY2hlbWE8YW55Pn0gVmFsdWVzXG4gKiBAcGFyYW0ge0tleXN9IGtleXNcbiAqIEBwYXJhbSB7VmFsdWVzfSB2YWx1ZXNcbiAqIEByZXR1cm4ge0Nhc3RUb1NjaGVtYTwkUmVjb3JkPEtleXMsVmFsdWVzPj59XG4gKi9cbmV4cG9ydCBjb25zdCAkcmVjb3JkID0gKGtleXMsIHZhbHVlcykgPT4gbmV3ICRSZWNvcmQoa2V5cywgdmFsdWVzKVxuZXhwb3J0IGNvbnN0ICQkcmVjb3JkID0gJGNvbnN0cnVjdGVkQnkoJFJlY29yZClcblxuLyoqXG4gKiBAdGVtcGxhdGUge1NjaGVtYTxhbnk+W119IFNcbiAqIEBleHRlbmRzIHtTY2hlbWE8eyBbS2V5IGluIGtleW9mIFNdOiBTW0tleV0gZXh0ZW5kcyBTY2hlbWE8aW5mZXIgVHlwZT4gPyBUeXBlIDogbmV2ZXIgfT59XG4gKi9cbmV4cG9ydCBjbGFzcyAkVHVwbGUgZXh0ZW5kcyBTY2hlbWEge1xuICAvKipcbiAgICogQHBhcmFtIHtTfSBzaGFwZVxuICAgKi9cbiAgY29uc3RydWN0b3IgKHNoYXBlKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuc2hhcGUgPSBzaGFwZVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSBvXG4gICAqIEBwYXJhbSB7VmFsaWRhdGlvbkVycm9yfSBlcnJcbiAgICogQHJldHVybiB7byBpcyB7IFtLIGluIGtleW9mIFNdOiBTW0tdIGV4dGVuZHMgU2NoZW1hPGluZmVyIFR5cGU+ID8gVHlwZSA6IG5ldmVyIH19XG4gICAqL1xuICBjaGVjayAobywgZXJyKSB7XG4gICAgcmV0dXJuIG8gIT0gbnVsbCAmJiBvYmouZXZlcnkodGhpcy5zaGFwZSwgKHZ2LCB2aykgPT4ge1xuICAgICAgY29uc3QgYyA9IC8qKiBAdHlwZSB7U2NoZW1hPGFueT59ICovICh2dikuY2hlY2sob1t2a10sIGVycilcbiAgICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgICAhYyAmJiBlcnI/LmV4dGVuZCh2ay50b1N0cmluZygpLCAnVHVwbGUnLCB0eXBlb2YgdnYpXG4gICAgICByZXR1cm4gY1xuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUge0FycmF5PFNjaGVtYTxhbnk+Pn0gVFxuICogQHBhcmFtIHtUfSBkZWZcbiAqIEByZXR1cm4ge0Nhc3RUb1NjaGVtYTwkVHVwbGU8VD4+fVxuICovXG5leHBvcnQgY29uc3QgJHR1cGxlID0gKC4uLmRlZikgPT4gbmV3ICRUdXBsZShkZWYpXG5leHBvcnQgY29uc3QgJCR0dXBsZSA9ICRjb25zdHJ1Y3RlZEJ5KCRUdXBsZSlcblxuLyoqXG4gKiBAdGVtcGxhdGUge1NjaGVtYTxhbnk+fSBTXG4gKiBAZXh0ZW5kcyB7U2NoZW1hPEFycmF5PFMgZXh0ZW5kcyBTY2hlbWE8aW5mZXIgVD4gPyBUIDogbmV2ZXI+Pn1cbiAqL1xuZXhwb3J0IGNsYXNzICRBcnJheSBleHRlbmRzIFNjaGVtYSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5PFM+fSB2XG4gICAqL1xuICBjb25zdHJ1Y3RvciAodikge1xuICAgIHN1cGVyKClcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7U2NoZW1hPFMgZXh0ZW5kcyBTY2hlbWE8aW5mZXIgVD4gPyBUIDogbmV2ZXI+fVxuICAgICAqL1xuICAgIHRoaXMuc2hhcGUgPSB2Lmxlbmd0aCA9PT0gMSA/IHZbMF0gOiBuZXcgJFVuaW9uKHYpXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9cbiAgICogQHBhcmFtIHtWYWxpZGF0aW9uRXJyb3J9IFtlcnJdXG4gICAqIEByZXR1cm4ge28gaXMgQXJyYXk8UyBleHRlbmRzIFNjaGVtYTxpbmZlciBUPiA/IFQgOiBuZXZlcj59IG9cbiAgICovXG4gIGNoZWNrIChvLCBlcnIpIHtcbiAgICBjb25zdCBjID0gYXJyLmlzQXJyYXkobykgJiYgYXJyLmV2ZXJ5KG8sIG9pID0+IHRoaXMuc2hhcGUuY2hlY2sob2kpKVxuICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgIWMgJiYgZXJyPy5leHRlbmQobnVsbCwgJ0FycmF5JywgJycpXG4gICAgcmV0dXJuIGNcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7QXJyYXk8U2NoZW1hPGFueT4+fSBUXG4gKiBAcGFyYW0ge1R9IGRlZlxuICogQHJldHVybiB7U2NoZW1hPEFycmF5PFQgZXh0ZW5kcyBBcnJheTxTY2hlbWE8aW5mZXIgUz4+ID8gUyA6IG5ldmVyPj59XG4gKi9cbmV4cG9ydCBjb25zdCAkYXJyYXkgPSAoLi4uZGVmKSA9PiBuZXcgJEFycmF5KGRlZilcbmV4cG9ydCBjb25zdCAkJGFycmF5ID0gJGNvbnN0cnVjdGVkQnkoJEFycmF5KVxuLyoqXG4gKiBAdHlwZSB7U2NoZW1hPEFycmF5PGFueT4+fVxuICovXG5leHBvcnQgY29uc3QgJGFycmF5QW55ID0gJGN1c3RvbShvID0+IGFyci5pc0FycmF5KG8pKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAZXh0ZW5kcyB7U2NoZW1hPFQ+fVxuICovXG5leHBvcnQgY2xhc3MgJEluc3RhbmNlT2YgZXh0ZW5kcyBTY2hlbWEge1xuICAvKipcbiAgICogQHBhcmFtIHtuZXcgKC4uLmFyZ3M6YW55KSA9PiBUfSBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0geygobzpUKSA9PiBib29sZWFuKXxudWxsfSBjaGVja1xuICAgKi9cbiAgY29uc3RydWN0b3IgKGNvbnN0cnVjdG9yLCBjaGVjaykge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLnNoYXBlID0gY29uc3RydWN0b3JcbiAgICB0aGlzLl9jID0gY2hlY2tcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gb1xuICAgKiBAcGFyYW0ge1ZhbGlkYXRpb25FcnJvcn0gZXJyXG4gICAqIEByZXR1cm4ge28gaXMgVH1cbiAgICovXG4gIGNoZWNrIChvLCBlcnIpIHtcbiAgICBjb25zdCBjID0gbyBpbnN0YW5jZW9mIHRoaXMuc2hhcGUgJiYgKHRoaXMuX2MgPT0gbnVsbCB8fCB0aGlzLl9jKG8pKVxuICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgIWMgJiYgZXJyPy5leHRlbmQobnVsbCwgdGhpcy5zaGFwZS5uYW1lLCBvPy5jb25zdHJ1Y3Rvci5uYW1lKVxuICAgIHJldHVybiBjXG4gIH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtuZXcgKC4uLmFyZ3M6YW55KSA9PiBUfSBjXG4gKiBAcGFyYW0geygobzpUKSA9PiBib29sZWFuKXxudWxsfSBjaGVja1xuICogQHJldHVybiB7U2NoZW1hPFQ+fVxuICovXG5leHBvcnQgY29uc3QgJGluc3RhbmNlT2YgPSAoYywgY2hlY2sgPSBudWxsKSA9PiBuZXcgJEluc3RhbmNlT2YoYywgY2hlY2spXG5leHBvcnQgY29uc3QgJCRpbnN0YW5jZU9mID0gJGNvbnN0cnVjdGVkQnkoJEluc3RhbmNlT2YpXG5cbmV4cG9ydCBjb25zdCAkJHNjaGVtYSA9ICRpbnN0YW5jZU9mKFNjaGVtYSlcblxuLyoqXG4gKiBAdGVtcGxhdGUge1NjaGVtYTxhbnk+W119IEFyZ3NcbiAqIEB0eXBlZGVmIHsoLi4uYXJnczpVbndyYXBBcnJheTxUdXBsZVBvcDxBcmdzPj4pPT5VbndyYXA8VHVwbGVMYXN0PEFyZ3M+Pn0gX0xBcmdzVG9MYW1iZGFEZWZcbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7QXJyYXk8U2NoZW1hPGFueT4+fSBBcmdzXG4gKiBAZXh0ZW5kcyB7U2NoZW1hPF9MQXJnc1RvTGFtYmRhRGVmPEFyZ3M+Pn1cbiAqL1xuZXhwb3J0IGNsYXNzICRMYW1iZGEgZXh0ZW5kcyBTY2hlbWEge1xuICAvKipcbiAgICogQHBhcmFtIHtBcmdzfSBhcmdzXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoYXJncykge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLmxlbiA9IGFyZ3MubGVuZ3RoIC0gMVxuICAgIHRoaXMuYXJncyA9ICR0dXBsZSguLi5hcmdzLnNsaWNlKC0xKSlcbiAgICB0aGlzLnJlcyA9IGFyZ3NbdGhpcy5sZW5dXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IGZcbiAgICogQHBhcmFtIHtWYWxpZGF0aW9uRXJyb3J9IGVyclxuICAgKiBAcmV0dXJuIHtmIGlzIF9MQXJnc1RvTGFtYmRhRGVmPEFyZ3M+fVxuICAgKi9cbiAgY2hlY2sgKGYsIGVycikge1xuICAgIGNvbnN0IGMgPSBmLmNvbnN0cnVjdG9yID09PSBGdW5jdGlvbiAmJiBmLmxlbmd0aCA8PSB0aGlzLmxlblxuICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgIWMgJiYgZXJyPy5leHRlbmQobnVsbCwgJ2Z1bmN0aW9uJywgdHlwZW9mIGYpXG4gICAgcmV0dXJuIGNcbiAgfVxufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7U2NoZW1hPGFueT5bXX0gQXJnc1xuICogQHBhcmFtIHtBcmdzfSBhcmdzXG4gKiBAcmV0dXJuIHtTY2hlbWE8KC4uLmFyZ3M6VW53cmFwQXJyYXk8VHVwbGVQb3A8QXJncz4+KT0+VW53cmFwPFR1cGxlTGFzdDxBcmdzPj4+fVxuICovXG5leHBvcnQgY29uc3QgJGxhbWJkYSA9ICguLi5hcmdzKSA9PiBuZXcgJExhbWJkYShhcmdzLmxlbmd0aCA+IDAgPyBhcmdzIDogWyR2b2lkXSlcbmV4cG9ydCBjb25zdCAkJGxhbWJkYSA9ICRjb25zdHJ1Y3RlZEJ5KCRMYW1iZGEpXG5cbi8qKlxuICogQHR5cGUge1NjaGVtYTxGdW5jdGlvbj59XG4gKi9cbmV4cG9ydCBjb25zdCAkZnVuY3Rpb24gPSAkY3VzdG9tKG8gPT4gdHlwZW9mIG8gPT09ICdmdW5jdGlvbicpXG5cbi8qKlxuICogQHRlbXBsYXRlIHtBcnJheTxTY2hlbWE8YW55Pj59IFRcbiAqIEBleHRlbmRzIHtTY2hlbWE8SW50ZXJzZWN0PFVud3JhcEFycmF5PFQ+Pj59XG4gKi9cbmV4cG9ydCBjbGFzcyAkSW50ZXJzZWN0aW9uIGV4dGVuZHMgU2NoZW1hIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7VH0gdlxuICAgKi9cbiAgY29uc3RydWN0b3IgKHYpIHtcbiAgICBzdXBlcigpXG4gICAgLyoqXG4gICAgICogQHR5cGUge1R9XG4gICAgICovXG4gICAgdGhpcy5zaGFwZSA9IHZcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gb1xuICAgKiBAcGFyYW0ge1ZhbGlkYXRpb25FcnJvcn0gW2Vycl1cbiAgICogQHJldHVybiB7byBpcyBJbnRlcnNlY3Q8VW53cmFwQXJyYXk8VD4+fVxuICAgKi9cbiAgY2hlY2sgKG8sIGVycikge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBjID0gYXJyLmV2ZXJ5KHRoaXMuc2hhcGUsIGNoZWNrID0+IGNoZWNrLmNoZWNrKG8sIGVycikpXG4gICAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgICAhYyAmJiBlcnI/LmV4dGVuZChudWxsLCAnSW50ZXJzZWN0aW5vbicsIHR5cGVvZiBvKVxuICAgIHJldHVybiBjXG4gIH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUge1NjaGVtYTxhbnk+W119IFRcbiAqIEBwYXJhbSB7VH0gZGVmXG4gKiBAcmV0dXJuIHtDYXN0VG9TY2hlbWE8JEludGVyc2VjdGlvbjxUPj59XG4gKi9cbmV4cG9ydCBjb25zdCAkaW50ZXJzZWN0ID0gKC4uLmRlZikgPT4gbmV3ICRJbnRlcnNlY3Rpb24oZGVmKVxuZXhwb3J0IGNvbnN0ICQkaW50ZXJzZWN0ID0gJGNvbnN0cnVjdGVkQnkoJEludGVyc2VjdGlvbiwgbyA9PiBvLnNoYXBlLmxlbmd0aCA+IDApIC8vIEludGVyc2VjdGlvbiB3aXRoIGxlbmd0aD0wIGlzIGNvbnNpZGVyZWQgXCJhbnlcIlxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBTXG4gKiBAZXh0ZW5kcyB7U2NoZW1hPFM+fVxuICovXG5leHBvcnQgY2xhc3MgJFVuaW9uIGV4dGVuZHMgU2NoZW1hIHtcbiAgc3RhdGljIF9kaWx1dGVzID0gdHJ1ZVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5PFNjaGVtYTxTPj59IHZcbiAgICovXG4gIGNvbnN0cnVjdG9yICh2KSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuc2hhcGUgPSB2XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHthbnl9IG9cbiAgICogQHBhcmFtIHtWYWxpZGF0aW9uRXJyb3J9IFtlcnJdXG4gICAqIEByZXR1cm4ge28gaXMgU31cbiAgICovXG4gIGNoZWNrIChvLCBlcnIpIHtcbiAgICBjb25zdCBjID0gYXJyLnNvbWUodGhpcy5zaGFwZSwgKHZ2KSA9PiB2di5jaGVjayhvLCBlcnIpKVxuICAgIGVycj8uZXh0ZW5kKG51bGwsICdVbmlvbicsIHR5cGVvZiBvKVxuICAgIHJldHVybiBjXG4gIH1cbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUge0FycmF5PGFueT59IFRcbiAqIEBwYXJhbSB7VH0gc2NoZW1hc1xuICogQHJldHVybiB7Q2FzdFRvU2NoZW1hPCRVbmlvbjxVbndyYXA8UmVhZFNjaGVtYTxUPj4+Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICR1bmlvbiA9ICguLi5zY2hlbWFzKSA9PiBzY2hlbWFzLmZpbmRJbmRleCgkcyA9PiAkJHVuaW9uLmNoZWNrKCRzKSkgPj0gMFxuICA/ICR1bmlvbiguLi5zY2hlbWFzLm1hcCgkcyA9PiAkKCRzKSkubWFwKCRzID0+ICQkdW5pb24uY2hlY2soJHMpID8gJHMuc2hhcGUgOiBbJHNdKS5mbGF0KDEpKVxuICA6IChzY2hlbWFzLmxlbmd0aCA9PT0gMVxuICAgICAgPyBzY2hlbWFzWzBdXG4gICAgICA6IG5ldyAkVW5pb24oc2NoZW1hcykpXG5leHBvcnQgY29uc3QgJCR1bmlvbiA9IC8qKiBAdHlwZSB7U2NoZW1hPCRVbmlvbjxhbnk+Pn0gKi8gKCRjb25zdHJ1Y3RlZEJ5KCRVbmlvbikpXG5cbmNvbnN0IF90ID0gKCkgPT4gdHJ1ZVxuLyoqXG4gKiBAdHlwZSB7U2NoZW1hPGFueT59XG4gKi9cbmV4cG9ydCBjb25zdCAkYW55ID0gJGN1c3RvbShfdClcbmV4cG9ydCBjb25zdCAkJGFueSA9IC8qKiBAdHlwZSB7U2NoZW1hPFNjaGVtYTxhbnk+Pn0gKi8gKCRjb25zdHJ1Y3RlZEJ5KCRDdXN0b20sIG8gPT4gby5zaGFwZSA9PT0gX3QpKVxuXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8YmlnaW50Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRiaWdpbnQgPSAkY3VzdG9tKG8gPT4gdHlwZW9mIG8gPT09ICdiaWdpbnQnKVxuZXhwb3J0IGNvbnN0ICQkYmlnaW50ID0gLyoqIEB0eXBlIHtTY2hlbWE8U2NoZW1hPEJpZ0ludD4+fSAqLyAoJGN1c3RvbShvID0+IG8gPT09ICRiaWdpbnQpKVxuXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8c3ltYm9sPn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRzeW1ib2wgPSAkY3VzdG9tKG8gPT4gdHlwZW9mIG8gPT09ICdzeW1ib2wnKVxuZXhwb3J0IGNvbnN0ICQkc3ltYm9sID0gLyoqIEB0eXBlIHtTY2hlbWE8U2NoZW1hPFN5bWJvbD4+fSAqLyAoJGN1c3RvbShvID0+IG8gPT09ICRzeW1ib2wpKVxuXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8bnVtYmVyPn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRudW1iZXIgPSAkY3VzdG9tKG8gPT4gdHlwZW9mIG8gPT09ICdudW1iZXInKVxuZXhwb3J0IGNvbnN0ICQkbnVtYmVyID0gLyoqIEB0eXBlIHtTY2hlbWE8U2NoZW1hPG51bWJlcj4+fSAqLyAoJGN1c3RvbShvID0+IG8gPT09ICRudW1iZXIpKVxuXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8c3RyaW5nPn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRzdHJpbmcgPSAkY3VzdG9tKG8gPT4gdHlwZW9mIG8gPT09ICdzdHJpbmcnKVxuZXhwb3J0IGNvbnN0ICQkc3RyaW5nID0gLyoqIEB0eXBlIHtTY2hlbWE8U2NoZW1hPHN0cmluZz4+fSAqLyAoJGN1c3RvbShvID0+IG8gPT09ICRzdHJpbmcpKVxuXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8Ym9vbGVhbj59XG4gKi9cbmV4cG9ydCBjb25zdCAkYm9vbGVhbiA9ICRjdXN0b20obyA9PiB0eXBlb2YgbyA9PT0gJ2Jvb2xlYW4nKVxuZXhwb3J0IGNvbnN0ICQkYm9vbGVhbiA9IC8qKiBAdHlwZSB7U2NoZW1hPFNjaGVtYTxCb29sZWFuPj59ICovICgkY3VzdG9tKG8gPT4gbyA9PT0gJGJvb2xlYW4pKVxuXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8dW5kZWZpbmVkPn1cbiAqL1xuZXhwb3J0IGNvbnN0ICR1bmRlZmluZWQgPSAkbGl0ZXJhbCh1bmRlZmluZWQpXG5leHBvcnQgY29uc3QgJCR1bmRlZmluZWQgPSAvKiogQHR5cGUge1NjaGVtYTxTY2hlbWE8dW5kZWZpbmVkPj59ICovICgkY29uc3RydWN0ZWRCeSgkTGl0ZXJhbCwgbyA9PiBvLnNoYXBlLmxlbmd0aCA9PT0gMSAmJiBvLnNoYXBlWzBdID09PSB1bmRlZmluZWQpKVxuXG4vKipcbiAqIEB0eXBlIHtTY2hlbWE8dm9pZD59XG4gKi9cbmV4cG9ydCBjb25zdCAkdm9pZCA9ICRsaXRlcmFsKHVuZGVmaW5lZClcbmV4cG9ydCBjb25zdCAkJHZvaWQgPSAvKiogQHR5cGUge1NjaGVtYTxTY2hlbWE8dm9pZD4+fSAqLyAoJCR1bmRlZmluZWQpXG5cbmV4cG9ydCBjb25zdCAkbnVsbCA9ICRsaXRlcmFsKG51bGwpXG5leHBvcnQgY29uc3QgJCRudWxsID0gLyoqIEB0eXBlIHtTY2hlbWE8U2NoZW1hPG51bGw+Pn0gKi8gKCRjb25zdHJ1Y3RlZEJ5KCRMaXRlcmFsLCBvID0+IG8uc2hhcGUubGVuZ3RoID09PSAxICYmIG8uc2hhcGVbMF0gPT09IG51bGwpKVxuXG5leHBvcnQgY29uc3QgJHVpbnQ4QXJyYXkgPSAkY29uc3RydWN0ZWRCeShVaW50OEFycmF5KVxuZXhwb3J0IGNvbnN0ICQkdWludDhBcnJheSA9IC8qKiBAdHlwZSB7U2NoZW1hPFNjaGVtYTxVaW50OEFycmF5Pj59ICovICgkY29uc3RydWN0ZWRCeSgkQ29uc3RydWN0ZWRCeSwgbyA9PiBvLnNoYXBlID09PSBVaW50OEFycmF5KSlcblxuLyoqXG4gKiBAdHlwZSB7U2NoZW1hPFByaW1pdGl2ZT59XG4gKi9cbmV4cG9ydCBjb25zdCAkcHJpbWl0aXZlID0gJHVuaW9uKCRudW1iZXIsICRzdHJpbmcsICRudWxsLCAkdW5kZWZpbmVkLCAkYmlnaW50LCAkYm9vbGVhbiwgJHN5bWJvbClcblxuLyoqXG4gKiBAdHlwZWRlZiB7SlNPTltdfSBKU09OQXJyYXlcbiAqL1xuLyoqXG4gKiBAdHlwZWRlZiB7UHJpbWl0aXZlfEpTT05BcnJheXx7IFtrZXk6c3RyaW5nXTpKU09OIH19IEpTT05cbiAqL1xuLyoqXG4gKiBAdHlwZSB7U2NoZW1hPG51bGx8bnVtYmVyfHN0cmluZ3xib29sZWFufEpTT05bXXx7W2tleTpzdHJpbmddOkpTT059Pn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRqc29uID0gKCgpID0+IHtcbiAgY29uc3QgJGpzb25BcnIgPSAvKiogQHR5cGUgeyRBcnJheTwkYW55Pn0gKi8gKCRhcnJheSgkYW55KSlcbiAgY29uc3QgJGpzb25SZWNvcmQgPSAvKiogQHR5cGUgeyRSZWNvcmQ8JHN0cmluZywkYW55Pn0gKi8gKCRyZWNvcmQoJHN0cmluZywgJGFueSkpXG4gIGNvbnN0ICRqc29uID0gJHVuaW9uKCRudW1iZXIsICRzdHJpbmcsICRudWxsLCAkYm9vbGVhbiwgJGpzb25BcnIsICRqc29uUmVjb3JkKVxuICAkanNvbkFyci5zaGFwZSA9ICRqc29uXG4gICRqc29uUmVjb3JkLnNoYXBlLnZhbHVlcyA9ICRqc29uXG4gIHJldHVybiAkanNvblxufSkoKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSB7YW55fSBJTlxuICogQHR5cGVkZWYge0lOIGV4dGVuZHMgU2NoZW1hPGFueT4gPyBJTlxuICogICA6IChJTiBleHRlbmRzIHN0cmluZ3xudW1iZXJ8Ym9vbGVhbnxudWxsID8gU2NoZW1hPElOPlxuICogICAgIDogKElOIGV4dGVuZHMgbmV3ICguLi5hcmdzOmFueVtdKT0+YW55ID8gU2NoZW1hPEluc3RhbmNlVHlwZTxJTj4+XG4gKiAgICAgICA6IChJTiBleHRlbmRzIGFueVtdID8gU2NoZW1hPHsgW0sgaW4ga2V5b2YgSU5dOiBVbndyYXA8UmVhZFNjaGVtYTxJTltLXT4+IH1bbnVtYmVyXT5cbiAgICogICAgICAgOiAoSU4gZXh0ZW5kcyBvYmplY3QgPyAoX09iamVjdERlZlRvU2NoZW1hPHtbSyBpbiBrZXlvZiBJTl06UmVhZFNjaGVtYTxJTltLXT59PiBleHRlbmRzIFNjaGVtYTxpbmZlciBTPiA/IFNjaGVtYTx7IFtLIGluIGtleW9mIFNdOiBTW0tdIH0+IDogbmV2ZXIpXG4gICAqICAgICAgICAgOiBuZXZlcilcbiAqICAgICAgICAgKVxuICogICAgICAgKVxuICogICAgIClcbiAqIH0gUmVhZFNjaGVtYU9sZFxuICovXG5cbi8qKlxuICogQHRlbXBsYXRlIHthbnl9IElOXG4gKiBAdHlwZWRlZiB7W0V4dHJhY3Q8SU4sU2NoZW1hPGFueT4+LEV4dHJhY3Q8SU4sc3RyaW5nfG51bWJlcnxib29sZWFufG51bGw+LEV4dHJhY3Q8SU4sbmV3ICguLi5hcmdzOmFueVtdKT0+YW55PixFeHRyYWN0PElOLGFueVtdPixFeHRyYWN0PEV4Y2x1ZGU8SU4sU2NoZW1hPGFueT58c3RyaW5nfG51bWJlcnxib29sZWFufG51bGx8KG5ldyAoLi4uYXJnczphbnlbXSk9PmFueSl8YW55W10+LG9iamVjdD5dIGV4dGVuZHMgW2luZmVyIFNjaGVtYXMsIGluZmVyIFByaW1pdGl2ZXMsIGluZmVyIENvbnN0cnVjdG9ycywgaW5mZXIgQXJycywgaW5mZXIgT2JqXVxuICogICA/IFNjaGVtYTxcbiAqICAgICAgIChTY2hlbWFzIGV4dGVuZHMgU2NoZW1hPGluZmVyIFM+ID8gUyA6IG5ldmVyKVxuICogICAgIHwgUHJpbWl0aXZlc1xuICogICAgIHwgKENvbnN0cnVjdG9ycyBleHRlbmRzIG5ldyAoLi4uYXJnczphbnlbXSk9PmFueSA/IEluc3RhbmNlVHlwZTxDb25zdHJ1Y3RvcnM+IDogbmV2ZXIpXG4gKiAgICAgfCAoQXJycyBleHRlbmRzIGFueVtdID8geyBbSyBpbiBrZXlvZiBBcnJzXTogVW53cmFwPFJlYWRTY2hlbWE8QXJyc1tLXT4+IH1bbnVtYmVyXSA6IG5ldmVyKVxuICogICAgIHwgKE9iaiBleHRlbmRzIG9iamVjdCA/IFVud3JhcDwoX09iamVjdERlZlRvU2NoZW1hPHtbSyBpbiBrZXlvZiBPYmpdOlJlYWRTY2hlbWE8T2JqW0tdPn0+IGV4dGVuZHMgU2NoZW1hPGluZmVyIFM+ID8gU2NoZW1hPHsgW0sgaW4ga2V5b2YgU106IFNbS10gfT4gOiBuZXZlcik+IDogbmV2ZXIpPlxuICogICA6IG5ldmVyXG4gKiB9IFJlYWRTY2hlbWFcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtSZWFkU2NoZW1hPHt4OjQyfXx7eTo5OX18U2NoZW1hPHN0cmluZz58WzEsMix7fV0+fSBRXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUgSU5cbiAqIEBwYXJhbSB7SU59IG9cbiAqIEByZXR1cm4ge1JlYWRTY2hlbWE8SU4+fVxuICovXG5leHBvcnQgY29uc3QgJCA9IG8gPT4ge1xuICBpZiAoJCRzY2hlbWEuY2hlY2sobykpIHtcbiAgICByZXR1cm4gLyoqIEB0eXBlIHthbnl9ICovIChvKVxuICB9IGVsc2UgaWYgKCRvYmplY3RBbnkuY2hlY2sobykpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7YW55fVxuICAgICAqL1xuICAgIGNvbnN0IG8yID0ge31cbiAgICBmb3IgKGNvbnN0IGsgaW4gbykge1xuICAgICAgbzJba10gPSAkKG9ba10pXG4gICAgfVxuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKCRvYmplY3QobzIpKVxuICB9IGVsc2UgaWYgKCRhcnJheUFueS5jaGVjayhvKSkge1xuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKCR1bmlvbiguLi5vLm1hcCgkKSkpXG4gIH0gZWxzZSBpZiAoJHByaW1pdGl2ZS5jaGVjayhvKSkge1xuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKCRsaXRlcmFsKG8pKVxuICB9IGVsc2UgaWYgKCRmdW5jdGlvbi5jaGVjayhvKSkge1xuICAgIHJldHVybiAvKiogQHR5cGUge2FueX0gKi8gKCRjb25zdHJ1Y3RlZEJ5KC8qKiBAdHlwZSB7YW55fSAqLyAobykpKVxuICB9XG4gIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gIGVycm9yLnVuZXhwZWN0ZWRDYXNlKClcbn1cblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIEFzc2VydCB0aGF0IGEgdmFyaWFibGUgaXMgb2YgdGhpcyBzcGVjaWZpYyB0eXBlLlxuICogVGhlIGFzc2VydGlvbiBjaGVjayBpcyBvbmx5IHBlcmZvcm1lZCBpbiBub24tcHJvZHVjdGlvbiBlbnZpcm9ubWVudHMuXG4gKlxuICogQHR5cGUgezxUPihvOmFueSxzY2hlbWE6U2NoZW1hPFQ+KSA9PiBhc3NlcnRzIG8gaXMgVH1cbiAqL1xuZXhwb3J0IGNvbnN0IGFzc2VydCA9IGVudi5wcm9kdWN0aW9uXG4gID8gKCkgPT4ge31cbiAgOiAobywgc2NoZW1hKSA9PiB7XG4gICAgICBjb25zdCBlcnIgPSBuZXcgVmFsaWRhdGlvbkVycm9yKClcbiAgICAgIGlmICghc2NoZW1hLmNoZWNrKG8sIGVycikpIHtcbiAgICAgICAgdGhyb3cgZXJyb3IuY3JlYXRlKGBFeHBlY3RlZCB2YWx1ZSB0byBiZSBvZiB0eXBlICR7c2NoZW1hLmNvbnN0cnVjdG9yLm5hbWV9LlxcbiR7ZXJyLnRvU3RyaW5nKCl9YClcbiAgICAgIH1cbiAgICB9XG4vKiBjOCBpZ25vcmUgZW5kICovXG5cbi8qKlxuICogQHRlbXBsYXRlIEluXG4gKiBAdGVtcGxhdGUgT3V0XG4gKiBAdHlwZWRlZiB7eyBpZjogU2NoZW1hPEluPiwgaDogKG86SW4sc3RhdGU/OmFueSk9Pk91dCB9fSBQYXR0ZXJuXG4gKi9cblxuLyoqXG4gKiBAdGVtcGxhdGUge1BhdHRlcm48YW55LGFueT59IFBcbiAqIEB0ZW1wbGF0ZSBJblxuICogQHR5cGVkZWYge1JldHVyblR5cGU8RXh0cmFjdDxQLFBhdHRlcm48SW4gZXh0ZW5kcyBudW1iZXIgPyBudW1iZXIgOiAoSW4gZXh0ZW5kcyBzdHJpbmcgPyBzdHJpbmcgOiBJbiksYW55Pj5bJ2gnXT59IFBhdHRlcm5NYXRjaFJlc3VsdFxuICovXG5cbi8qKlxuICogQHRvZG8gbW92ZSB0aGlzIHRvIHNlcGFyYXRlIGxpYnJhcnlcbiAqIEB0ZW1wbGF0ZSB7YW55fSBbU3RhdGU9dW5kZWZpbmVkXVxuICogQHRlbXBsYXRlIHtQYXR0ZXJuPGFueSxhbnk+fSBbUGF0dGVybnM9bmV2ZXJdXG4gKi9cbmV4cG9ydCBjbGFzcyBQYXR0ZXJuTWF0Y2hlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1NjaGVtYTxTdGF0ZT59IFskc3RhdGVdXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoJHN0YXRlKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge0FycmF5PFBhdHRlcm5zPn1cbiAgICAgKi9cbiAgICB0aGlzLnBhdHRlcm5zID0gW11cbiAgICB0aGlzLiRzdGF0ZSA9ICRzdGF0ZVxuICB9XG5cbiAgLyoqXG4gICAqIEB0ZW1wbGF0ZSBQXG4gICAqIEB0ZW1wbGF0ZSBSXG4gICAqIEBwYXJhbSB7UH0gcGF0dGVyblxuICAgKiBAcGFyYW0geyhvOk5vSW5mZXI8VW53cmFwPFJlYWRTY2hlbWE8UD4+PixzOlN0YXRlKT0+Un0gaGFuZGxlclxuICAgKiBAcmV0dXJuIHtQYXR0ZXJuTWF0Y2hlcjxTdGF0ZSxQYXR0ZXJuc3xQYXR0ZXJuPFVud3JhcDxSZWFkU2NoZW1hPFA+PixSPj59XG4gICAqL1xuICBpZiAocGF0dGVybiwgaGFuZGxlcikge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB0aGlzLnBhdHRlcm5zLnB1c2goeyBpZjogJChwYXR0ZXJuKSwgaDogaGFuZGxlciB9KVxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIEB0ZW1wbGF0ZSBSXG4gICAqIEBwYXJhbSB7KG86YW55LHM6U3RhdGUpPT5SfSBoXG4gICAqL1xuICBlbHNlIChoKSB7XG4gICAgcmV0dXJuIHRoaXMuaWYoJGFueSwgaClcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtTdGF0ZSBleHRlbmRzIHVuZGVmaW5lZFxuICAgKiAgID8gPEluIGV4dGVuZHMgVW53cmFwPFBhdHRlcm5zWydpZiddPj4obzpJbixzdGF0ZT86dW5kZWZpbmVkKT0+UGF0dGVybk1hdGNoUmVzdWx0PFBhdHRlcm5zLEluPlxuICAgKiAgIDogPEluIGV4dGVuZHMgVW53cmFwPFBhdHRlcm5zWydpZiddPj4obzpJbixzdGF0ZTpTdGF0ZSk9PlBhdHRlcm5NYXRjaFJlc3VsdDxQYXR0ZXJucyxJbj59XG4gICAqL1xuICBkb25lICgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7YW55fSAqLyAobywgcykgPT4ge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBhdHRlcm5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHAgPSB0aGlzLnBhdHRlcm5zW2ldXG4gICAgICAgIGlmIChwLmlmLmNoZWNrKG8pKSB7XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIHJldHVybiBwLmgobywgcylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3IuY3JlYXRlKCdVbmhhbmRsZWQgcGF0dGVybicpXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQHRlbXBsYXRlIFtTdGF0ZT11bmRlZmluZWRdXG4gKiBAcGFyYW0ge1N0YXRlfSBbc3RhdGVdXG4gKiBAcmV0dXJuIHtQYXR0ZXJuTWF0Y2hlcjxTdGF0ZSBleHRlbmRzIHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IFVud3JhcDxSZWFkU2NoZW1hPFN0YXRlPj4+fVxuICovXG5leHBvcnQgY29uc3QgbWF0Y2ggPSBzdGF0ZSA9PiBuZXcgUGF0dGVybk1hdGNoZXIoLyoqIEB0eXBlIHthbnl9ICovIChzdGF0ZSkpXG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGEgKG5vbi1leGhhdXN0aXZlKSBzYW1wbGUgc2V0IGZyb20gYSBnaXZlcyBzY2hlbWEuXG4gKlxuICogQHR5cGUgezxUPihvOlQsZ2VuOnBybmcuUFJORyk9PlR9XG4gKi9cbmNvbnN0IF9yYW5kb20gPSAvKiogQHR5cGUge2FueX0gKi8gKG1hdGNoKC8qKiBAdHlwZSB7U2NoZW1hPHBybmcuUFJORz59ICovICgkYW55KSlcbiAgLmlmKCQkbnVtYmVyLCAoX28sIGdlbikgPT4gcHJuZy5pbnQ1MyhnZW4sIG51bWJlci5NSU5fU0FGRV9JTlRFR0VSLCBudW1iZXIuTUFYX1NBRkVfSU5URUdFUikpXG4gIC5pZigkJHN0cmluZywgKF9vLCBnZW4pID0+IHBybmcud29yZChnZW4pKVxuICAuaWYoJCRib29sZWFuLCAoX28sIGdlbikgPT4gcHJuZy5ib29sKGdlbikpXG4gIC5pZigkJGJpZ2ludCwgKF9vLCBnZW4pID0+IEJpZ0ludChwcm5nLmludDUzKGdlbiwgbnVtYmVyLk1JTl9TQUZFX0lOVEVHRVIsIG51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSkpXG4gIC5pZigkJHVuaW9uLCAobywgZ2VuKSA9PiByYW5kb20oZ2VuLCBwcm5nLm9uZU9mKGdlbiwgby5zaGFwZSkpKVxuICAuaWYoJCRvYmplY3QsIChvLCBnZW4pID0+IHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7YW55fVxuICAgICAqL1xuICAgIGNvbnN0IHJlcyA9IHt9XG4gICAgZm9yIChjb25zdCBrIGluIG8uc2hhcGUpIHtcbiAgICAgIGxldCBwcm9wID0gby5zaGFwZVtrXVxuICAgICAgaWYgKCQkb3B0aW9uYWwuY2hlY2socHJvcCkpIHtcbiAgICAgICAgaWYgKHBybmcuYm9vbChnZW4pKSB7IGNvbnRpbnVlIH1cbiAgICAgICAgcHJvcCA9IHByb3Auc2hhcGVcbiAgICAgIH1cbiAgICAgIHJlc1trXSA9IF9yYW5kb20ocHJvcCwgZ2VuKVxuICAgIH1cbiAgICByZXR1cm4gcmVzXG4gIH0pXG4gIC5pZigkJGFycmF5LCAobywgZ2VuKSA9PiB7XG4gICAgY29uc3QgYXJyID0gW11cbiAgICBjb25zdCBuID0gcHJuZy5pbnQzMihnZW4sIDAsIDQyKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICBhcnIucHVzaChyYW5kb20oZ2VuLCBvLnNoYXBlKSlcbiAgICB9XG4gICAgcmV0dXJuIGFyclxuICB9KVxuICAuaWYoJCRsaXRlcmFsLCAobywgZ2VuKSA9PiB7XG4gICAgcmV0dXJuIHBybmcub25lT2YoZ2VuLCBvLnNoYXBlKVxuICB9KVxuICAuaWYoJCRudWxsLCAobywgZ2VuKSA9PiB7XG4gICAgcmV0dXJuIG51bGxcbiAgfSlcbiAgLmlmKCQkbGFtYmRhLCAobywgZ2VuKSA9PiB7XG4gICAgY29uc3QgcmVzID0gcmFuZG9tKGdlbiwgby5yZXMpXG4gICAgcmV0dXJuICgpID0+IHJlc1xuICB9KVxuICAuaWYoJCRhbnksIChvLCBnZW4pID0+IHJhbmRvbShnZW4sIHBybmcub25lT2YoZ2VuLCBbXG4gICAgJG51bWJlciwgJHN0cmluZywgJG51bGwsICR1bmRlZmluZWQsICRiaWdpbnQsICRib29sZWFuLFxuICAgICRhcnJheSgkbnVtYmVyKSxcbiAgICAkcmVjb3JkKCR1bmlvbignYScsICdiJywgJ2MnKSwgJG51bWJlcilcbiAgXSkpKVxuICAuaWYoJCRyZWNvcmQsIChvLCBnZW4pID0+IHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7YW55fVxuICAgICAqL1xuICAgIGNvbnN0IHJlcyA9IHt9XG4gICAgY29uc3Qga2V5c04gPSBwcm5nLmludDUzKGdlbiwgMCwgMylcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXNOOyBpKyspIHtcbiAgICAgIGNvbnN0IGtleSA9IHJhbmRvbShnZW4sIG8uc2hhcGUua2V5cylcbiAgICAgIGNvbnN0IHZhbCA9IHJhbmRvbShnZW4sIG8uc2hhcGUudmFsdWVzKVxuICAgICAgcmVzW2tleV0gPSB2YWxcbiAgICB9XG4gICAgcmV0dXJuIHJlc1xuICB9KVxuICAuZG9uZSgpKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBTXG4gKiBAcGFyYW0ge3BybmcuUFJOR30gZ2VuXG4gKiBAcGFyYW0ge1N9IHNjaGVtYVxuICogQHJldHVybiB7VW53cmFwPFJlYWRTY2hlbWE8Uz4+fVxuICovXG5leHBvcnQgY29uc3QgcmFuZG9tID0gKGdlbiwgc2NoZW1hKSA9PiAvKiogQHR5cGUge2FueX0gKi8gKF9yYW5kb20oJChzY2hlbWEpLCBnZW4pKVxuIiwgIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIFV0aWxpdHkgbW9kdWxlIHRvIHdvcmsgd2l0aCB0aGUgRE9NLlxuICpcbiAqIEBtb2R1bGUgZG9tXG4gKi9cblxuaW1wb3J0ICogYXMgcGFpciBmcm9tICcuL3BhaXIuanMnXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnLi9tYXAuanMnXG5pbXBvcnQgKiBhcyAkIGZyb20gJy4vc2NoZW1hLmpzJ1xuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQHR5cGUge0RvY3VtZW50fVxuICovXG5leHBvcnQgY29uc3QgZG9jID0gLyoqIEB0eXBlIHtEb2N1bWVudH0gKi8gKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgPyBkb2N1bWVudCA6IHt9KVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZUVsZW1lbnQgPSBuYW1lID0+IGRvYy5jcmVhdGVFbGVtZW50KG5hbWUpXG5cbi8qKlxuICogQHJldHVybiB7RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZURvY3VtZW50RnJhZ21lbnQgPSAoKSA9PiBkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG5cbi8qKlxuICogQHR5cGUgeyQuU2NoZW1hPERvY3VtZW50RnJhZ21lbnQ+fVxuICovXG5leHBvcnQgY29uc3QgJGZyYWdtZW50ID0gJC4kY3VzdG9tKGVsID0+IGVsLm5vZGVUeXBlID09PSBET0NVTUVOVF9GUkFHTUVOVF9OT0RFKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJuIHtUZXh0fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlVGV4dE5vZGUgPSB0ZXh0ID0+IGRvYy5jcmVhdGVUZXh0Tm9kZSh0ZXh0KVxuXG5leHBvcnQgY29uc3QgZG9tUGFyc2VyID0gLyoqIEB0eXBlIHtET01QYXJzZXJ9ICovICh0eXBlb2YgRE9NUGFyc2VyICE9PSAndW5kZWZpbmVkJyA/IG5ldyBET01QYXJzZXIoKSA6IG51bGwpXG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICovXG5leHBvcnQgY29uc3QgZW1pdEN1c3RvbUV2ZW50ID0gKGVsLCBuYW1lLCBvcHRzKSA9PiBlbC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChuYW1lLCBvcHRzKSlcblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge0FycmF5PHBhaXIuUGFpcjxzdHJpbmcsc3RyaW5nfGJvb2xlYW4+Pn0gYXR0cnMgQXJyYXkgb2Yga2V5LXZhbHVlIHBhaXJzXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3Qgc2V0QXR0cmlidXRlcyA9IChlbCwgYXR0cnMpID0+IHtcbiAgcGFpci5mb3JFYWNoKGF0dHJzLCAoa2V5LCB2YWx1ZSkgPT4ge1xuICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShrZXkpXG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gdHJ1ZSkge1xuICAgICAgZWwuc2V0QXR0cmlidXRlKGtleSwgJycpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGVsLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIGVsXG59XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtNYXA8c3RyaW5nLCBzdHJpbmc+fSBhdHRycyBBcnJheSBvZiBrZXktdmFsdWUgcGFpcnNcbiAqIEByZXR1cm4ge0VsZW1lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBzZXRBdHRyaWJ1dGVzTWFwID0gKGVsLCBhdHRycykgPT4ge1xuICBhdHRycy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7IGVsLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKSB9KVxuICByZXR1cm4gZWxcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PE5vZGU+fEhUTUxDb2xsZWN0aW9ufSBjaGlsZHJlblxuICogQHJldHVybiB7RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IGZyYWdtZW50ID0gY2hpbGRyZW4gPT4ge1xuICBjb25zdCBmcmFnbWVudCA9IGNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgYXBwZW5kQ2hpbGQoZnJhZ21lbnQsIGNoaWxkcmVuW2ldKVxuICB9XG4gIHJldHVybiBmcmFnbWVudFxufVxuXG4vKipcbiAqIEBwYXJhbSB7RWxlbWVudH0gcGFyZW50XG4gKiBAcGFyYW0ge0FycmF5PE5vZGU+fSBub2Rlc1xuICogQHJldHVybiB7RWxlbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IGFwcGVuZCA9IChwYXJlbnQsIG5vZGVzKSA9PiB7XG4gIGFwcGVuZENoaWxkKHBhcmVudCwgZnJhZ21lbnQobm9kZXMpKVxuICByZXR1cm4gcGFyZW50XG59XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxcbiAqL1xuZXhwb3J0IGNvbnN0IHJlbW92ZSA9IGVsID0+IGVsLnJlbW92ZSgpXG5cbi8qKlxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge0V2ZW50TGlzdGVuZXJ9IGZcbiAqL1xuZXhwb3J0IGNvbnN0IGFkZEV2ZW50TGlzdGVuZXIgPSAoZWwsIG5hbWUsIGYpID0+IGVsLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZilcblxuLyoqXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7RXZlbnRMaXN0ZW5lcn0gZlxuICovXG5leHBvcnQgY29uc3QgcmVtb3ZlRXZlbnRMaXN0ZW5lciA9IChlbCwgbmFtZSwgZikgPT4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBmKVxuXG4vKipcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICogQHBhcmFtIHtBcnJheTxwYWlyLlBhaXI8c3RyaW5nLEV2ZW50TGlzdGVuZXI+Pn0gbGlzdGVuZXJzXG4gKiBAcmV0dXJuIHtOb2RlfVxuICovXG5leHBvcnQgY29uc3QgYWRkRXZlbnRMaXN0ZW5lcnMgPSAobm9kZSwgbGlzdGVuZXJzKSA9PiB7XG4gIHBhaXIuZm9yRWFjaChsaXN0ZW5lcnMsIChuYW1lLCBmKSA9PiBhZGRFdmVudExpc3RlbmVyKG5vZGUsIG5hbWUsIGYpKVxuICByZXR1cm4gbm9kZVxufVxuXG4vKipcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICogQHBhcmFtIHtBcnJheTxwYWlyLlBhaXI8c3RyaW5nLEV2ZW50TGlzdGVuZXI+Pn0gbGlzdGVuZXJzXG4gKiBAcmV0dXJuIHtOb2RlfVxuICovXG5leHBvcnQgY29uc3QgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMgPSAobm9kZSwgbGlzdGVuZXJzKSA9PiB7XG4gIHBhaXIuZm9yRWFjaChsaXN0ZW5lcnMsIChuYW1lLCBmKSA9PiByZW1vdmVFdmVudExpc3RlbmVyKG5vZGUsIG5hbWUsIGYpKVxuICByZXR1cm4gbm9kZVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge0FycmF5PHBhaXIuUGFpcjxzdHJpbmcsc3RyaW5nPnxwYWlyLlBhaXI8c3RyaW5nLGJvb2xlYW4+Pn0gYXR0cnMgQXJyYXkgb2Yga2V5LXZhbHVlIHBhaXJzXG4gKiBAcGFyYW0ge0FycmF5PE5vZGU+fSBjaGlsZHJlblxuICogQHJldHVybiB7RWxlbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IGVsZW1lbnQgPSAobmFtZSwgYXR0cnMgPSBbXSwgY2hpbGRyZW4gPSBbXSkgPT5cbiAgYXBwZW5kKHNldEF0dHJpYnV0ZXMoY3JlYXRlRWxlbWVudChuYW1lKSwgYXR0cnMpLCBjaGlsZHJlbilcblxuLyoqXG4gKiBAdHlwZSB7JC5TY2hlbWE8RWxlbWVudD59XG4gKi9cbmV4cG9ydCBjb25zdCAkZWxlbWVudCA9ICQuJGN1c3RvbShlbCA9PiBlbC5ub2RlVHlwZSA9PT0gRUxFTUVOVF9OT0RFKVxuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aFxuICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxuICovXG5leHBvcnQgY29uc3QgY2FudmFzID0gKHdpZHRoLCBoZWlnaHQpID0+IHtcbiAgY29uc3QgYyA9IC8qKiBAdHlwZSB7SFRNTENhbnZhc0VsZW1lbnR9ICovIChjcmVhdGVFbGVtZW50KCdjYW52YXMnKSlcbiAgYy5oZWlnaHQgPSBoZWlnaHRcbiAgYy53aWR0aCA9IHdpZHRoXG4gIHJldHVybiBjXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRcbiAqIEByZXR1cm4ge1RleHR9XG4gKi9cbmV4cG9ydCBjb25zdCB0ZXh0ID0gY3JlYXRlVGV4dE5vZGVcblxuLyoqXG4gKiBAdHlwZSB7JC5TY2hlbWE8VGV4dD59XG4gKi9cbmV4cG9ydCBjb25zdCAkdGV4dCA9ICQuJGN1c3RvbShlbCA9PiBlbC5ub2RlVHlwZSA9PT0gVEVYVF9OT0RFKVxuXG4vKipcbiAqIEBwYXJhbSB7cGFpci5QYWlyPHN0cmluZyxzdHJpbmc+fSBwYWlyXG4gKi9cbmV4cG9ydCBjb25zdCBwYWlyVG9TdHlsZVN0cmluZyA9IHBhaXIgPT4gYCR7cGFpci5sZWZ0fToke3BhaXIucmlnaHR9O2BcblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHBhaXIuUGFpcjxzdHJpbmcsc3RyaW5nPj59IHBhaXJzXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBwYWlyc1RvU3R5bGVTdHJpbmcgPSBwYWlycyA9PiBwYWlycy5tYXAocGFpclRvU3R5bGVTdHJpbmcpLmpvaW4oJycpXG5cbi8qKlxuICogQHBhcmFtIHtNYXA8c3RyaW5nLHN0cmluZz59IG1cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IG1hcFRvU3R5bGVTdHJpbmcgPSBtID0+IG1hcC5tYXAobSwgKHZhbHVlLCBrZXkpID0+IGAke2tleX06JHt2YWx1ZX07YCkuam9pbignJylcblxuLyoqXG4gKiBAdG9kbyBzaG91bGQgYWx3YXlzIHF1ZXJ5IG9uIGEgZG9tIGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fFNoYWRvd1Jvb3R9IGVsXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnlcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50IHwgbnVsbH1cbiAqL1xuZXhwb3J0IGNvbnN0IHF1ZXJ5U2VsZWN0b3IgPSAoZWwsIHF1ZXJ5KSA9PiBlbC5xdWVyeVNlbGVjdG9yKHF1ZXJ5KVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR8U2hhZG93Um9vdH0gZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeVxuICogQHJldHVybiB7Tm9kZUxpc3RPZjxIVE1MRWxlbWVudD59XG4gKi9cbmV4cG9ydCBjb25zdCBxdWVyeVNlbGVjdG9yQWxsID0gKGVsLCBxdWVyeSkgPT4gZWwucXVlcnlTZWxlY3RvckFsbChxdWVyeSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICovXG5leHBvcnQgY29uc3QgZ2V0RWxlbWVudEJ5SWQgPSBpZCA9PiAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jLmdldEVsZW1lbnRCeUlkKGlkKSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbFxuICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gKi9cbmNvbnN0IF9wYXJzZSA9IGh0bWwgPT4gZG9tUGFyc2VyLnBhcnNlRnJvbVN0cmluZyhgPGh0bWw+PGJvZHk+JHtodG1sfTwvYm9keT48L2h0bWw+YCwgJ3RleHQvaHRtbCcpLmJvZHlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbFxuICogQHJldHVybiB7RG9jdW1lbnRGcmFnbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IHBhcnNlRnJhZ21lbnQgPSBodG1sID0+IGZyYWdtZW50KC8qKiBAdHlwZSB7YW55fSAqLyAoX3BhcnNlKGh0bWwpLmNoaWxkTm9kZXMpKVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAqL1xuZXhwb3J0IGNvbnN0IHBhcnNlRWxlbWVudCA9IGh0bWwgPT4gLyoqIEB0eXBlIEhUTUxFbGVtZW50ICovIChfcGFyc2UoaHRtbCkuZmlyc3RFbGVtZW50Q2hpbGQpXG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gb2xkRWxcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR8RG9jdW1lbnRGcmFnbWVudH0gbmV3RWxcbiAqL1xuZXhwb3J0IGNvbnN0IHJlcGxhY2VXaXRoID0gKG9sZEVsLCBuZXdFbCkgPT4gb2xkRWwucmVwbGFjZVdpdGgobmV3RWwpXG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gcGFyZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbFxuICogQHBhcmFtIHtOb2RlfG51bGx9IHJlZlxuICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gKi9cbmV4cG9ydCBjb25zdCBpbnNlcnRCZWZvcmUgPSAocGFyZW50LCBlbCwgcmVmKSA9PiBwYXJlbnQuaW5zZXJ0QmVmb3JlKGVsLCByZWYpXG5cbi8qKlxuICogQHBhcmFtIHtOb2RlfSBwYXJlbnRcbiAqIEBwYXJhbSB7Tm9kZX0gY2hpbGRcbiAqIEByZXR1cm4ge05vZGV9XG4gKi9cbmV4cG9ydCBjb25zdCBhcHBlbmRDaGlsZCA9IChwYXJlbnQsIGNoaWxkKSA9PiBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpXG5cbmV4cG9ydCBjb25zdCBFTEVNRU5UX05PREUgPSBkb2MuRUxFTUVOVF9OT0RFXG5leHBvcnQgY29uc3QgVEVYVF9OT0RFID0gZG9jLlRFWFRfTk9ERVxuZXhwb3J0IGNvbnN0IENEQVRBX1NFQ1RJT05fTk9ERSA9IGRvYy5DREFUQV9TRUNUSU9OX05PREVcbmV4cG9ydCBjb25zdCBDT01NRU5UX05PREUgPSBkb2MuQ09NTUVOVF9OT0RFXG5leHBvcnQgY29uc3QgRE9DVU1FTlRfTk9ERSA9IGRvYy5ET0NVTUVOVF9OT0RFXG5leHBvcnQgY29uc3QgRE9DVU1FTlRfVFlQRV9OT0RFID0gZG9jLkRPQ1VNRU5UX1RZUEVfTk9ERVxuZXhwb3J0IGNvbnN0IERPQ1VNRU5UX0ZSQUdNRU5UX05PREUgPSBkb2MuRE9DVU1FTlRfRlJBR01FTlRfTk9ERVxuXG4vKipcbiAqIEB0eXBlIHskLlNjaGVtYTxOb2RlPn1cbiAqL1xuZXhwb3J0IGNvbnN0ICRub2RlID0gJC4kY3VzdG9tKGVsID0+IGVsLm5vZGVUeXBlID09PSBET0NVTUVOVF9OT0RFKVxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBub2RlXG4gKiBAcGFyYW0ge251bWJlcn0gdHlwZVxuICovXG5leHBvcnQgY29uc3QgY2hlY2tOb2RlVHlwZSA9IChub2RlLCB0eXBlKSA9PiBub2RlLm5vZGVUeXBlID09PSB0eXBlXG5cbi8qKlxuICogQHBhcmFtIHtOb2RlfSBwYXJlbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNoaWxkXG4gKi9cbmV4cG9ydCBjb25zdCBpc1BhcmVudE9mID0gKHBhcmVudCwgY2hpbGQpID0+IHtcbiAgbGV0IHAgPSBjaGlsZC5wYXJlbnROb2RlXG4gIHdoaWxlIChwICYmIHAgIT09IHBhcmVudCkge1xuICAgIHAgPSBwLnBhcmVudE5vZGVcbiAgfVxuICByZXR1cm4gcCA9PT0gcGFyZW50XG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuIiwgIi8qKlxuICogSlNPTiB1dGlsaXR5IGZ1bmN0aW9ucy5cbiAqXG4gKiBAbW9kdWxlIGpzb25cbiAqL1xuXG4vKipcbiAqIFRyYW5zZm9ybSBKYXZhU2NyaXB0IG9iamVjdCB0byBKU09OLlxuICpcbiAqIEBwYXJhbSB7YW55fSBvYmplY3RcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IEpTT04uc3RyaW5naWZ5XG5cbi8qKlxuICogUGFyc2UgSlNPTiBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGpzb25cbiAqIEByZXR1cm4ge2FueX1cbiAqL1xuZXhwb3J0IGNvbnN0IHBhcnNlID0gSlNPTi5wYXJzZVxuIiwgIi8qKlxuICogVXRpbGl0eSBtb2R1bGUgdG8gd29yayB3aXRoIEVjbWFTY3JpcHQgU3ltYm9scy5cbiAqXG4gKiBAbW9kdWxlIHN5bWJvbFxuICovXG5cbi8qKlxuICogUmV0dXJuIGZyZXNoIHN5bWJvbC5cbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZSA9IFN5bWJvbFxuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBzXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5leHBvcnQgY29uc3QgaXNTeW1ib2wgPSBzID0+IHR5cGVvZiBzID09PSAnc3ltYm9sJ1xuIiwgImltcG9ydCAqIGFzIHN5bWJvbCBmcm9tICcuL3N5bWJvbC5qcydcbmltcG9ydCAqIGFzIHRpbWUgZnJvbSAnLi90aW1lLmpzJ1xuaW1wb3J0ICogYXMgZW52IGZyb20gJy4vZW52aXJvbm1lbnQuanMnXG5pbXBvcnQgKiBhcyBmdW5jIGZyb20gJy4vZnVuY3Rpb24uanMnXG5pbXBvcnQgKiBhcyBqc29uIGZyb20gJy4vanNvbi5qcydcblxuZXhwb3J0IGNvbnN0IEJPTEQgPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBVTkJPTEQgPSBzeW1ib2wuY3JlYXRlKClcbmV4cG9ydCBjb25zdCBCTFVFID0gc3ltYm9sLmNyZWF0ZSgpXG5leHBvcnQgY29uc3QgR1JFWSA9IHN5bWJvbC5jcmVhdGUoKVxuZXhwb3J0IGNvbnN0IEdSRUVOID0gc3ltYm9sLmNyZWF0ZSgpXG5leHBvcnQgY29uc3QgUkVEID0gc3ltYm9sLmNyZWF0ZSgpXG5leHBvcnQgY29uc3QgUFVSUExFID0gc3ltYm9sLmNyZWF0ZSgpXG5leHBvcnQgY29uc3QgT1JBTkdFID0gc3ltYm9sLmNyZWF0ZSgpXG5leHBvcnQgY29uc3QgVU5DT0xPUiA9IHN5bWJvbC5jcmVhdGUoKVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQHBhcmFtIHtBcnJheTx1bmRlZmluZWR8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyfGZ1bmN0aW9uKCk6YW55Pn0gYXJnc1xuICogQHJldHVybiB7QXJyYXk8c3RyaW5nfG9iamVjdHxudW1iZXJ8dW5kZWZpbmVkPn1cbiAqL1xuZXhwb3J0IGNvbnN0IGNvbXB1dGVOb0NvbG9yTG9nZ2luZ0FyZ3MgPSBhcmdzID0+IHtcbiAgaWYgKGFyZ3MubGVuZ3RoID09PSAxICYmIGFyZ3NbMF0/LmNvbnN0cnVjdG9yID09PSBGdW5jdGlvbikge1xuICAgIGFyZ3MgPSAvKiogQHR5cGUge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59ICovICgvKiogQHR5cGUge1tmdW5jdGlvbl19ICovIChhcmdzKVswXSgpKVxuICB9XG4gIGNvbnN0IHN0ckJ1aWxkZXIgPSBbXVxuICBjb25zdCBsb2dBcmdzID0gW11cbiAgLy8gdHJ5IHdpdGggZm9ybWF0dGluZyB1bnRpbCB3ZSBmaW5kIHNvbWV0aGluZyB1bnN1cHBvcnRlZFxuICBsZXQgaSA9IDBcbiAgZm9yICg7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXJnID0gYXJnc1tpXVxuICAgIGlmIChhcmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYnJlYWtcbiAgICB9IGVsc2UgaWYgKGFyZy5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nIHx8IGFyZy5jb25zdHJ1Y3RvciA9PT0gTnVtYmVyKSB7XG4gICAgICBzdHJCdWlsZGVyLnB1c2goYXJnKVxuICAgIH0gZWxzZSBpZiAoYXJnLmNvbnN0cnVjdG9yID09PSBPYmplY3QpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIGlmIChpID4gMCkge1xuICAgIC8vIGNyZWF0ZSBsb2dBcmdzIHdpdGggd2hhdCB3ZSBoYXZlIHNvIGZhclxuICAgIGxvZ0FyZ3MucHVzaChzdHJCdWlsZGVyLmpvaW4oJycpKVxuICB9XG4gIC8vIGFwcGVuZCB0aGUgcmVzdFxuICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcmcgPSBhcmdzW2ldXG4gICAgaWYgKCEoYXJnIGluc3RhbmNlb2YgU3ltYm9sKSkge1xuICAgICAgbG9nQXJncy5wdXNoKGFyZylcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGxvZ0FyZ3Ncbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbmNvbnN0IGxvZ2dpbmdDb2xvcnMgPSBbR1JFRU4sIFBVUlBMRSwgT1JBTkdFLCBCTFVFXVxubGV0IG5leHRDb2xvciA9IDBcbmxldCBsYXN0TG9nZ2luZ1RpbWUgPSB0aW1lLmdldFVuaXhUaW1lKClcblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG4vKipcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oLi4uYW55KTp2b2lkfSBfcHJpbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBtb2R1bGVOYW1lXG4gKiBAcmV0dXJuIHtmdW5jdGlvbiguLi5hbnkpOnZvaWR9XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVNb2R1bGVMb2dnZXIgPSAoX3ByaW50LCBtb2R1bGVOYW1lKSA9PiB7XG4gIGNvbnN0IGNvbG9yID0gbG9nZ2luZ0NvbG9yc1tuZXh0Q29sb3JdXG4gIGNvbnN0IGRlYnVnUmVnZXhWYXIgPSBlbnYuZ2V0VmFyaWFibGUoJ2xvZycpXG4gIGNvbnN0IGRvTG9nZ2luZyA9IGRlYnVnUmVnZXhWYXIgIT09IG51bGwgJiZcbiAgICAoZGVidWdSZWdleFZhciA9PT0gJyonIHx8IGRlYnVnUmVnZXhWYXIgPT09ICd0cnVlJyB8fFxuICAgICAgbmV3IFJlZ0V4cChkZWJ1Z1JlZ2V4VmFyLCAnZ2knKS50ZXN0KG1vZHVsZU5hbWUpKVxuICBuZXh0Q29sb3IgPSAobmV4dENvbG9yICsgMSkgJSBsb2dnaW5nQ29sb3JzLmxlbmd0aFxuICBtb2R1bGVOYW1lICs9ICc6ICdcbiAgcmV0dXJuICFkb0xvZ2dpbmdcbiAgICA/IGZ1bmMubm9wXG4gICAgOiAoLi4uYXJncykgPT4ge1xuICAgICAgICBpZiAoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXT8uY29uc3RydWN0b3IgPT09IEZ1bmN0aW9uKSB7XG4gICAgICAgICAgYXJncyA9IGFyZ3NbMF0oKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpbWVOb3cgPSB0aW1lLmdldFVuaXhUaW1lKClcbiAgICAgICAgY29uc3QgdGltZURpZmYgPSB0aW1lTm93IC0gbGFzdExvZ2dpbmdUaW1lXG4gICAgICAgIGxhc3RMb2dnaW5nVGltZSA9IHRpbWVOb3dcbiAgICAgICAgX3ByaW50KFxuICAgICAgICAgIGNvbG9yLFxuICAgICAgICAgIG1vZHVsZU5hbWUsXG4gICAgICAgICAgVU5DT0xPUixcbiAgICAgICAgICAuLi5hcmdzLm1hcCgoYXJnKSA9PiB7XG4gICAgICAgICAgICBpZiAoYXJnICE9IG51bGwgJiYgYXJnLmNvbnN0cnVjdG9yID09PSBVaW50OEFycmF5KSB7XG4gICAgICAgICAgICAgIGFyZyA9IEFycmF5LmZyb20oYXJnKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdCA9IHR5cGVvZiBhcmdcbiAgICAgICAgICAgIHN3aXRjaCAodCkge1xuICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICBjYXNlICdzeW1ib2wnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhcmdcbiAgICAgICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgICAgIHJldHVybiBqc29uLnN0cmluZ2lmeShhcmcpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSxcbiAgICAgICAgICBjb2xvcixcbiAgICAgICAgICAnICsnICsgdGltZURpZmYgKyAnbXMnXG4gICAgICAgIClcbiAgICAgIH1cbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG4iLCAiLyoqXG4gKiBJc29tb3JwaGljIGxvZ2dpbmcgbW9kdWxlIHdpdGggc3VwcG9ydCBmb3IgY29sb3JzIVxuICpcbiAqIEBtb2R1bGUgbG9nZ2luZ1xuICovXG5cbmltcG9ydCAqIGFzIGVudiBmcm9tICcuL2Vudmlyb25tZW50LmpzJ1xuaW1wb3J0ICogYXMgc2V0IGZyb20gJy4vc2V0LmpzJ1xuaW1wb3J0ICogYXMgcGFpciBmcm9tICcuL3BhaXIuanMnXG5pbXBvcnQgKiBhcyBkb20gZnJvbSAnLi9kb20uanMnXG5pbXBvcnQgKiBhcyBqc29uIGZyb20gJy4vanNvbi5qcydcbmltcG9ydCAqIGFzIG1hcCBmcm9tICcuL21hcC5qcydcbmltcG9ydCAqIGFzIGV2ZW50bG9vcCBmcm9tICcuL2V2ZW50bG9vcC5qcydcbmltcG9ydCAqIGFzIG1hdGggZnJvbSAnLi9tYXRoLmpzJ1xuaW1wb3J0ICogYXMgY29tbW9uIGZyb20gJy4vbG9nZ2luZy5jb21tb24uanMnXG5cbmV4cG9ydCB7IEJPTEQsIFVOQk9MRCwgQkxVRSwgR1JFWSwgR1JFRU4sIFJFRCwgUFVSUExFLCBPUkFOR0UsIFVOQ09MT1IgfSBmcm9tICcuL2xvZ2dpbmcuY29tbW9uLmpzJ1xuXG4vKipcbiAqIEB0eXBlIHtPYmplY3Q8U3ltYm9sLHBhaXIuUGFpcjxzdHJpbmcsc3RyaW5nPj59XG4gKi9cbmNvbnN0IF9icm93c2VyU3R5bGVNYXAgPSB7XG4gIFtjb21tb24uQk9MRF06IHBhaXIuY3JlYXRlKCdmb250LXdlaWdodCcsICdib2xkJyksXG4gIFtjb21tb24uVU5CT0xEXTogcGFpci5jcmVhdGUoJ2ZvbnQtd2VpZ2h0JywgJ25vcm1hbCcpLFxuICBbY29tbW9uLkJMVUVdOiBwYWlyLmNyZWF0ZSgnY29sb3InLCAnYmx1ZScpLFxuICBbY29tbW9uLkdSRUVOXTogcGFpci5jcmVhdGUoJ2NvbG9yJywgJ2dyZWVuJyksXG4gIFtjb21tb24uR1JFWV06IHBhaXIuY3JlYXRlKCdjb2xvcicsICdncmV5JyksXG4gIFtjb21tb24uUkVEXTogcGFpci5jcmVhdGUoJ2NvbG9yJywgJ3JlZCcpLFxuICBbY29tbW9uLlBVUlBMRV06IHBhaXIuY3JlYXRlKCdjb2xvcicsICdwdXJwbGUnKSxcbiAgW2NvbW1vbi5PUkFOR0VdOiBwYWlyLmNyZWF0ZSgnY29sb3InLCAnb3JhbmdlJyksIC8vIG5vdCB3ZWxsIHN1cHBvcnRlZCBpbiBjaHJvbWUgd2hlbiBkZWJ1Z2dpbmcgbm9kZSB3aXRoIGluc3BlY3RvciAtIFRPRE86IGRlcHJlY2F0ZVxuICBbY29tbW9uLlVOQ09MT1JdOiBwYWlyLmNyZWF0ZSgnY29sb3InLCAnYmxhY2snKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyfGZ1bmN0aW9uKCk6YW55Pn0gYXJnc1xuICogQHJldHVybiB7QXJyYXk8c3RyaW5nfG9iamVjdHxudW1iZXI+fVxuICovXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmNvbnN0IGNvbXB1dGVCcm93c2VyTG9nZ2luZ0FyZ3MgPSAoYXJncykgPT4ge1xuICBpZiAoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXT8uY29uc3RydWN0b3IgPT09IEZ1bmN0aW9uKSB7XG4gICAgYXJncyA9IC8qKiBAdHlwZSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gKi8gKC8qKiBAdHlwZSB7W2Z1bmN0aW9uXX0gKi8gKGFyZ3MpWzBdKCkpXG4gIH1cbiAgY29uc3Qgc3RyQnVpbGRlciA9IFtdXG4gIGNvbnN0IHN0eWxlcyA9IFtdXG4gIGNvbnN0IGN1cnJlbnRTdHlsZSA9IG1hcC5jcmVhdGUoKVxuICAvKipcbiAgICogQHR5cGUge0FycmF5PHN0cmluZ3xPYmplY3R8bnVtYmVyPn1cbiAgICovXG4gIGxldCBsb2dBcmdzID0gW11cbiAgLy8gdHJ5IHdpdGggZm9ybWF0dGluZyB1bnRpbCB3ZSBmaW5kIHNvbWV0aGluZyB1bnN1cHBvcnRlZFxuICBsZXQgaSA9IDBcbiAgZm9yICg7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXJnID0gYXJnc1tpXVxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBzdHlsZSA9IF9icm93c2VyU3R5bGVNYXBbYXJnXVxuICAgIGlmIChzdHlsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjdXJyZW50U3R5bGUuc2V0KHN0eWxlLmxlZnQsIHN0eWxlLnJpZ2h0KVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYXJnID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICAgIGlmIChhcmcuY29uc3RydWN0b3IgPT09IFN0cmluZyB8fCBhcmcuY29uc3RydWN0b3IgPT09IE51bWJlcikge1xuICAgICAgICBjb25zdCBzdHlsZSA9IGRvbS5tYXBUb1N0eWxlU3RyaW5nKGN1cnJlbnRTdHlsZSlcbiAgICAgICAgaWYgKGkgPiAwIHx8IHN0eWxlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBzdHJCdWlsZGVyLnB1c2goJyVjJyArIGFyZylcbiAgICAgICAgICBzdHlsZXMucHVzaChzdHlsZSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHJCdWlsZGVyLnB1c2goYXJnKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoaSA+IDApIHtcbiAgICAvLyBjcmVhdGUgbG9nQXJncyB3aXRoIHdoYXQgd2UgaGF2ZSBzbyBmYXJcbiAgICBsb2dBcmdzID0gc3R5bGVzXG4gICAgbG9nQXJncy51bnNoaWZ0KHN0ckJ1aWxkZXIuam9pbignJykpXG4gIH1cbiAgLy8gYXBwZW5kIHRoZSByZXN0XG4gIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IGFyZ3NbaV1cbiAgICBpZiAoIShhcmcgaW5zdGFuY2VvZiBTeW1ib2wpKSB7XG4gICAgICBsb2dBcmdzLnB1c2goYXJnKVxuICAgIH1cbiAgfVxuICByZXR1cm4gbG9nQXJnc1xufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyogYzggaWdub3JlIHN0YXJ0ICovXG5jb25zdCBjb21wdXRlTG9nZ2luZ0FyZ3MgPSBlbnYuc3VwcG9ydHNDb2xvclxuICA/IGNvbXB1dGVCcm93c2VyTG9nZ2luZ0FyZ3NcbiAgOiBjb21tb24uY29tcHV0ZU5vQ29sb3JMb2dnaW5nQXJnc1xuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAqL1xuZXhwb3J0IGNvbnN0IHByaW50ID0gKC4uLmFyZ3MpID0+IHtcbiAgY29uc29sZS5sb2coLi4uY29tcHV0ZUxvZ2dpbmdBcmdzKGFyZ3MpKVxuICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICB2Y29uc29sZXMuZm9yRWFjaCgodmMpID0+IHZjLnByaW50KGFyZ3MpKVxufVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbi8qKlxuICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSBhcmdzXG4gKi9cbmV4cG9ydCBjb25zdCB3YXJuID0gKC4uLmFyZ3MpID0+IHtcbiAgY29uc29sZS53YXJuKC4uLmNvbXB1dGVMb2dnaW5nQXJncyhhcmdzKSlcbiAgYXJncy51bnNoaWZ0KGNvbW1vbi5PUkFOR0UpXG4gIHZjb25zb2xlcy5mb3JFYWNoKCh2YykgPT4gdmMucHJpbnQoYXJncykpXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7RXJyb3J9IGVyclxuICovXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmV4cG9ydCBjb25zdCBwcmludEVycm9yID0gKGVycikgPT4ge1xuICBjb25zb2xlLmVycm9yKGVycilcbiAgdmNvbnNvbGVzLmZvckVhY2goKHZjKSA9PiB2Yy5wcmludEVycm9yKGVycikpXG59XG4vKiBjOCBpZ25vcmUgc3RvcCAqL1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgaW1hZ2UgbG9jYXRpb25cbiAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgaGVpZ2h0IG9mIHRoZSBpbWFnZSBpbiBwaXhlbFxuICovXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmV4cG9ydCBjb25zdCBwcmludEltZyA9ICh1cmwsIGhlaWdodCkgPT4ge1xuICBpZiAoZW52LmlzQnJvd3Nlcikge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgJyVjICAgICAgICAgICAgICAgICAgICAgICcsXG4gICAgICBgZm9udC1zaXplOiAke2hlaWdodH1weDsgYmFja2dyb3VuZC1zaXplOiBjb250YWluOyBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0OyBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJHt1cmx9KWBcbiAgICApXG4gICAgLy8gY29uc29sZS5sb2coJyVjICAgICAgICAgICAgICAgICcsIGBmb250LXNpemU6ICR7aGVpZ2h0fXg7IGJhY2tncm91bmQ6IHVybCgke3VybH0pIG5vLXJlcGVhdDtgKVxuICB9XG4gIHZjb25zb2xlcy5mb3JFYWNoKCh2YykgPT4gdmMucHJpbnRJbWcodXJsLCBoZWlnaHQpKVxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gYmFzZTY0XG4gKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDIgKi9cbmV4cG9ydCBjb25zdCBwcmludEltZ0Jhc2U2NCA9IChiYXNlNjQsIGhlaWdodCkgPT5cbiAgcHJpbnRJbWcoYGRhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCwke2Jhc2U2NH1gLCBoZWlnaHQpXG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSBhcmdzXG4gKi9cbmV4cG9ydCBjb25zdCBncm91cCA9ICguLi5hcmdzKSA9PiB7XG4gIGNvbnNvbGUuZ3JvdXAoLi4uY29tcHV0ZUxvZ2dpbmdBcmdzKGFyZ3MpKVxuICAvKiBjOCBpZ25vcmUgbmV4dCAqL1xuICB2Y29uc29sZXMuZm9yRWFjaCgodmMpID0+IHZjLmdyb3VwKGFyZ3MpKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gYXJnc1xuICovXG5leHBvcnQgY29uc3QgZ3JvdXBDb2xsYXBzZWQgPSAoLi4uYXJncykgPT4ge1xuICBjb25zb2xlLmdyb3VwQ29sbGFwc2VkKC4uLmNvbXB1dGVMb2dnaW5nQXJncyhhcmdzKSlcbiAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgdmNvbnNvbGVzLmZvckVhY2goKHZjKSA9PiB2Yy5ncm91cENvbGxhcHNlZChhcmdzKSlcbn1cblxuZXhwb3J0IGNvbnN0IGdyb3VwRW5kID0gKCkgPT4ge1xuICBjb25zb2xlLmdyb3VwRW5kKClcbiAgLyogYzggaWdub3JlIG5leHQgKi9cbiAgdmNvbnNvbGVzLmZvckVhY2goKHZjKSA9PiB2Yy5ncm91cEVuZCgpKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKTpOb2RlfSBjcmVhdGVOb2RlXG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDIgKi9cbmV4cG9ydCBjb25zdCBwcmludERvbSA9IChjcmVhdGVOb2RlKSA9PlxuICB2Y29uc29sZXMuZm9yRWFjaCgodmMpID0+IHZjLnByaW50RG9tKGNyZWF0ZU5vZGUoKSkpXG5cbi8qKlxuICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudH0gY2FudmFzXG4gKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XG4gKi9cbi8qIGM4IGlnbm9yZSBuZXh0IDIgKi9cbmV4cG9ydCBjb25zdCBwcmludENhbnZhcyA9IChjYW52YXMsIGhlaWdodCkgPT5cbiAgcHJpbnRJbWcoY2FudmFzLnRvRGF0YVVSTCgpLCBoZWlnaHQpXG5cbmV4cG9ydCBjb25zdCB2Y29uc29sZXMgPSBzZXQuY3JlYXRlKClcblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZ3xTeW1ib2x8T2JqZWN0fG51bWJlcj59IGFyZ3NcbiAqIEByZXR1cm4ge0FycmF5PEVsZW1lbnQ+fVxuICovXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmNvbnN0IF9jb21wdXRlTGluZVNwYW5zID0gKGFyZ3MpID0+IHtcbiAgY29uc3Qgc3BhbnMgPSBbXVxuICBjb25zdCBjdXJyZW50U3R5bGUgPSBuZXcgTWFwKClcbiAgLy8gdHJ5IHdpdGggZm9ybWF0dGluZyB1bnRpbCB3ZSBmaW5kIHNvbWV0aGluZyB1bnN1cHBvcnRlZFxuICBsZXQgaSA9IDBcbiAgZm9yICg7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGFyZyA9IGFyZ3NbaV1cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3Qgc3R5bGUgPSBfYnJvd3NlclN0eWxlTWFwW2FyZ11cbiAgICBpZiAoc3R5bGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY3VycmVudFN0eWxlLnNldChzdHlsZS5sZWZ0LCBzdHlsZS5yaWdodClcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGFyZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFyZyA9ICd1bmRlZmluZWQgJ1xuICAgICAgfVxuICAgICAgaWYgKGFyZy5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nIHx8IGFyZy5jb25zdHJ1Y3RvciA9PT0gTnVtYmVyKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3Qgc3BhbiA9IGRvbS5lbGVtZW50KCdzcGFuJywgW1xuICAgICAgICAgIHBhaXIuY3JlYXRlKCdzdHlsZScsIGRvbS5tYXBUb1N0eWxlU3RyaW5nKGN1cnJlbnRTdHlsZSkpXG4gICAgICAgIF0sIFtkb20udGV4dChhcmcudG9TdHJpbmcoKSldKVxuICAgICAgICBpZiAoc3Bhbi5pbm5lckhUTUwgPT09ICcnKSB7XG4gICAgICAgICAgc3Bhbi5pbm5lckhUTUwgPSAnJm5ic3A7J1xuICAgICAgICB9XG4gICAgICAgIHNwYW5zLnB1c2goc3BhbilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIGFwcGVuZCB0aGUgcmVzdFxuICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY29udGVudCA9IGFyZ3NbaV1cbiAgICBpZiAoIShjb250ZW50IGluc3RhbmNlb2YgU3ltYm9sKSkge1xuICAgICAgaWYgKGNvbnRlbnQuY29uc3RydWN0b3IgIT09IFN0cmluZyAmJiBjb250ZW50LmNvbnN0cnVjdG9yICE9PSBOdW1iZXIpIHtcbiAgICAgICAgY29udGVudCA9ICcgJyArIGpzb24uc3RyaW5naWZ5KGNvbnRlbnQpICsgJyAnXG4gICAgICB9XG4gICAgICBzcGFucy5wdXNoKFxuICAgICAgICBkb20uZWxlbWVudCgnc3BhbicsIFtdLCBbZG9tLnRleHQoLyoqIEB0eXBlIHtzdHJpbmd9ICovIChjb250ZW50KSldKVxuICAgICAgKVxuICAgIH1cbiAgfVxuICByZXR1cm4gc3BhbnNcbn1cbi8qIGM4IGlnbm9yZSBzdG9wICovXG5cbmNvbnN0IGxpbmVTdHlsZSA9XG4gICdmb250LWZhbWlseTptb25vc3BhY2U7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2UyZTJlMjtwYWRkaW5nOjJweDsnXG5cbi8qIGM4IGlnbm9yZSBzdGFydCAqL1xuZXhwb3J0IGNsYXNzIFZDb25zb2xlIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZG9tXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoZG9tKSB7XG4gICAgdGhpcy5kb20gPSBkb21cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RWxlbWVudH1cbiAgICAgKi9cbiAgICB0aGlzLmNjb250YWluZXIgPSB0aGlzLmRvbVxuICAgIHRoaXMuZGVwdGggPSAwXG4gICAgdmNvbnNvbGVzLmFkZCh0aGlzKVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nfFN5bWJvbHxPYmplY3R8bnVtYmVyPn0gYXJnc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNvbGxhcHNlZFxuICAgKi9cbiAgZ3JvdXAgKGFyZ3MsIGNvbGxhcHNlZCA9IGZhbHNlKSB7XG4gICAgZXZlbnRsb29wLmVucXVldWUoKCkgPT4ge1xuICAgICAgY29uc3QgdHJpYW5nbGVEb3duID0gZG9tLmVsZW1lbnQoJ3NwYW4nLCBbXG4gICAgICAgIHBhaXIuY3JlYXRlKCdoaWRkZW4nLCBjb2xsYXBzZWQpLFxuICAgICAgICBwYWlyLmNyZWF0ZSgnc3R5bGUnLCAnY29sb3I6Z3JleTtmb250LXNpemU6MTIwJTsnKVxuICAgICAgXSwgW2RvbS50ZXh0KCdcdTI1QkMnKV0pXG4gICAgICBjb25zdCB0cmlhbmdsZVJpZ2h0ID0gZG9tLmVsZW1lbnQoJ3NwYW4nLCBbXG4gICAgICAgIHBhaXIuY3JlYXRlKCdoaWRkZW4nLCAhY29sbGFwc2VkKSxcbiAgICAgICAgcGFpci5jcmVhdGUoJ3N0eWxlJywgJ2NvbG9yOmdyZXk7Zm9udC1zaXplOjEyNSU7JylcbiAgICAgIF0sIFtkb20udGV4dCgnXHUyNUI2JyldKVxuICAgICAgY29uc3QgY29udGVudCA9IGRvbS5lbGVtZW50KFxuICAgICAgICAnZGl2JyxcbiAgICAgICAgW3BhaXIuY3JlYXRlKFxuICAgICAgICAgICdzdHlsZScsXG4gICAgICAgICAgYCR7bGluZVN0eWxlfTtwYWRkaW5nLWxlZnQ6JHt0aGlzLmRlcHRoICogMTB9cHhgXG4gICAgICAgICldLFxuICAgICAgICBbdHJpYW5nbGVEb3duLCB0cmlhbmdsZVJpZ2h0LCBkb20udGV4dCgnICcpXS5jb25jYXQoXG4gICAgICAgICAgX2NvbXB1dGVMaW5lU3BhbnMoYXJncylcbiAgICAgICAgKVxuICAgICAgKVxuICAgICAgY29uc3QgbmV4dENvbnRhaW5lciA9IGRvbS5lbGVtZW50KCdkaXYnLCBbXG4gICAgICAgIHBhaXIuY3JlYXRlKCdoaWRkZW4nLCBjb2xsYXBzZWQpXG4gICAgICBdKVxuICAgICAgY29uc3QgbmV4dExpbmUgPSBkb20uZWxlbWVudCgnZGl2JywgW10sIFtjb250ZW50LCBuZXh0Q29udGFpbmVyXSlcbiAgICAgIGRvbS5hcHBlbmQodGhpcy5jY29udGFpbmVyLCBbbmV4dExpbmVdKVxuICAgICAgdGhpcy5jY29udGFpbmVyID0gbmV4dENvbnRhaW5lclxuICAgICAgdGhpcy5kZXB0aCsrXG4gICAgICAvLyB3aGVuIGhlYWRlciBpcyBjbGlja2VkLCBjb2xsYXBzZS91bmNvbGxhcHNlIGNvbnRhaW5lclxuICAgICAgZG9tLmFkZEV2ZW50TGlzdGVuZXIoY29udGVudCwgJ2NsaWNrJywgKF9ldmVudCkgPT4ge1xuICAgICAgICBuZXh0Q29udGFpbmVyLnRvZ2dsZUF0dHJpYnV0ZSgnaGlkZGVuJylcbiAgICAgICAgdHJpYW5nbGVEb3duLnRvZ2dsZUF0dHJpYnV0ZSgnaGlkZGVuJylcbiAgICAgICAgdHJpYW5nbGVSaWdodC50b2dnbGVBdHRyaWJ1dGUoJ2hpZGRlbicpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSBhcmdzXG4gICAqL1xuICBncm91cENvbGxhcHNlZCAoYXJncykge1xuICAgIHRoaXMuZ3JvdXAoYXJncywgdHJ1ZSlcbiAgfVxuXG4gIGdyb3VwRW5kICgpIHtcbiAgICBldmVudGxvb3AuZW5xdWV1ZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5kZXB0aCA+IDApIHtcbiAgICAgICAgdGhpcy5kZXB0aC0tXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgdGhpcy5jY29udGFpbmVyID0gdGhpcy5jY29udGFpbmVyLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudFxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtBcnJheTxzdHJpbmd8U3ltYm9sfE9iamVjdHxudW1iZXI+fSBhcmdzXG4gICAqL1xuICBwcmludCAoYXJncykge1xuICAgIGV2ZW50bG9vcC5lbnF1ZXVlKCgpID0+IHtcbiAgICAgIGRvbS5hcHBlbmQodGhpcy5jY29udGFpbmVyLCBbXG4gICAgICAgIGRvbS5lbGVtZW50KCdkaXYnLCBbXG4gICAgICAgICAgcGFpci5jcmVhdGUoXG4gICAgICAgICAgICAnc3R5bGUnLFxuICAgICAgICAgICAgYCR7bGluZVN0eWxlfTtwYWRkaW5nLWxlZnQ6JHt0aGlzLmRlcHRoICogMTB9cHhgXG4gICAgICAgICAgKVxuICAgICAgICBdLCBfY29tcHV0ZUxpbmVTcGFucyhhcmdzKSlcbiAgICAgIF0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0Vycm9yfSBlcnJcbiAgICovXG4gIHByaW50RXJyb3IgKGVycikge1xuICAgIHRoaXMucHJpbnQoW2NvbW1vbi5SRUQsIGNvbW1vbi5CT0xELCBlcnIudG9TdHJpbmcoKV0pXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVybFxuICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XG4gICAqL1xuICBwcmludEltZyAodXJsLCBoZWlnaHQpIHtcbiAgICBldmVudGxvb3AuZW5xdWV1ZSgoKSA9PiB7XG4gICAgICBkb20uYXBwZW5kKHRoaXMuY2NvbnRhaW5lciwgW1xuICAgICAgICBkb20uZWxlbWVudCgnaW1nJywgW1xuICAgICAgICAgIHBhaXIuY3JlYXRlKCdzcmMnLCB1cmwpLFxuICAgICAgICAgIHBhaXIuY3JlYXRlKCdoZWlnaHQnLCBgJHttYXRoLnJvdW5kKGhlaWdodCAqIDEuNSl9cHhgKVxuICAgICAgICBdKVxuICAgICAgXSlcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICAgKi9cbiAgcHJpbnREb20gKG5vZGUpIHtcbiAgICBldmVudGxvb3AuZW5xdWV1ZSgoKSA9PiB7XG4gICAgICBkb20uYXBwZW5kKHRoaXMuY2NvbnRhaW5lciwgW25vZGVdKVxuICAgIH0pXG4gIH1cblxuICBkZXN0cm95ICgpIHtcbiAgICBldmVudGxvb3AuZW5xdWV1ZSgoKSA9PiB7XG4gICAgICB2Y29uc29sZXMuZGVsZXRlKHRoaXMpXG4gICAgfSlcbiAgfVxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLyoqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGRvbVxuICovXG4vKiBjOCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVZDb25zb2xlID0gKGRvbSkgPT4gbmV3IFZDb25zb2xlKGRvbSlcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbW9kdWxlTmFtZVxuICogQHJldHVybiB7ZnVuY3Rpb24oLi4uYW55KTp2b2lkfVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlTW9kdWxlTG9nZ2VyID0gKG1vZHVsZU5hbWUpID0+IGNvbW1vbi5jcmVhdGVNb2R1bGVMb2dnZXIocHJpbnQsIG1vZHVsZU5hbWUpXG4iLCAiLyoqXG4gKiBVdGlsaXR5IGhlbHBlcnMgdG8gd29yayB3aXRoIHByb21pc2VzLlxuICpcbiAqIEBtb2R1bGUgcHJvbWlzZVxuICovXG5cbmltcG9ydCAqIGFzIHRpbWUgZnJvbSAnLi90aW1lLmpzJ1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAY2FsbGJhY2sgUHJvbWlzZVJlc29sdmVcbiAqIEBwYXJhbSB7VHxQcm9taXNlTGlrZTxUPn0gW3Jlc3VsdF1cbiAqL1xuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKFByb21pc2VSZXNvbHZlPFQ+LGZ1bmN0aW9uKEVycm9yKTp2b2lkKTphbnl9IGZcbiAqIEByZXR1cm4ge1Byb21pc2U8VD59XG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGUgPSBmID0+IC8qKiBAdHlwZSB7UHJvbWlzZTxUPn0gKi8gKG5ldyBQcm9taXNlKGYpKVxuXG4vKipcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oZnVuY3Rpb24oKTp2b2lkLGZ1bmN0aW9uKEVycm9yKTp2b2lkKTp2b2lkfSBmXG4gKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRW1wdHkgPSBmID0+IG5ldyBQcm9taXNlKGYpXG5cbi8qKlxuICogYFByb21pc2UuYWxsYCB3YWl0IGZvciBhbGwgcHJvbWlzZXMgaW4gdGhlIGFycmF5IHRvIHJlc29sdmUgYW5kIHJldHVybiB0aGUgcmVzdWx0XG4gKiBAdGVtcGxhdGUge3Vua25vd25bXSB8IFtdfSBQU1xuICpcbiAqIEBwYXJhbSB7UFN9IHBzXG4gKiBAcmV0dXJuIHtQcm9taXNlPHsgLXJlYWRvbmx5IFtQIGluIGtleW9mIFBTXTogQXdhaXRlZDxQU1tQXT4gfT59XG4gKi9cbmV4cG9ydCBjb25zdCBhbGwgPSBQcm9taXNlLmFsbC5iaW5kKFByb21pc2UpXG5cbi8qKlxuICogQHBhcmFtIHtFcnJvcn0gW3JlYXNvbl1cbiAqIEByZXR1cm4ge1Byb21pc2U8bmV2ZXI+fVxuICovXG5leHBvcnQgY29uc3QgcmVqZWN0ID0gcmVhc29uID0+IFByb21pc2UucmVqZWN0KHJlYXNvbilcblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfHZvaWR9IHJlc1xuICogQHJldHVybiB7UHJvbWlzZTxUfHZvaWQ+fVxuICovXG5leHBvcnQgY29uc3QgcmVzb2x2ZSA9IHJlcyA9PiBQcm9taXNlLnJlc29sdmUocmVzKVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1R9IHJlc1xuICogQHJldHVybiB7UHJvbWlzZTxUPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlc29sdmVXaXRoID0gcmVzID0+IFByb21pc2UucmVzb2x2ZShyZXMpXG5cbi8qKlxuICogQHRvZG8gTmV4dCB2ZXJzaW9uLCByZW9yZGVyIHBhcmFtZXRlcnM6IGNoZWNrLCBbdGltZW91dCwgW2ludGVydmFsUmVzb2x1dGlvbl1dXG4gKiBAZGVwcmVjYXRlZCB1c2UgdW50aWxBc3luYyBpbnN0ZWFkXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKTpib29sZWFufSBjaGVja1xuICogQHBhcmFtIHtudW1iZXJ9IFtpbnRlcnZhbFJlc29sdXRpb25dXG4gKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgY29uc3QgdW50aWwgPSAodGltZW91dCwgY2hlY2ssIGludGVydmFsUmVzb2x1dGlvbiA9IDEwKSA9PiBjcmVhdGUoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICBjb25zdCBzdGFydFRpbWUgPSB0aW1lLmdldFVuaXhUaW1lKClcbiAgY29uc3QgaGFzVGltZW91dCA9IHRpbWVvdXQgPiAwXG4gIGNvbnN0IHVudGlsSW50ZXJ2YWwgPSAoKSA9PiB7XG4gICAgaWYgKGNoZWNrKCkpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGUpXG4gICAgICByZXNvbHZlKClcbiAgICB9IGVsc2UgaWYgKGhhc1RpbWVvdXQpIHtcbiAgICAgIC8qIGM4IGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAodGltZS5nZXRVbml4VGltZSgpIC0gc3RhcnRUaW1lID4gdGltZW91dCkge1xuICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsSGFuZGxlKVxuICAgICAgICByZWplY3QobmV3IEVycm9yKCdUaW1lb3V0JykpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNvbnN0IGludGVydmFsSGFuZGxlID0gc2V0SW50ZXJ2YWwodW50aWxJbnRlcnZhbCwgaW50ZXJ2YWxSZXNvbHV0aW9uKVxufSlcblxuLyoqXG4gKiBAcGFyYW0geygpPT5Qcm9taXNlPGJvb2xlYW4+fGJvb2xlYW59IGNoZWNrXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZW91dFxuICogQHBhcmFtIHtudW1iZXJ9IGludGVydmFsUmVzb2x1dGlvblxuICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAqL1xuZXhwb3J0IGNvbnN0IHVudGlsQXN5bmMgPSBhc3luYyAoY2hlY2ssIHRpbWVvdXQgPSAwLCBpbnRlcnZhbFJlc29sdXRpb24gPSAxMCkgPT4ge1xuICBjb25zdCBzdGFydFRpbWUgPSB0aW1lLmdldFVuaXhUaW1lKClcbiAgY29uc3Qgbm9UaW1lb3V0ID0gdGltZW91dCA8PSAwXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bm1vZGlmaWVkLWxvb3AtY29uZGl0aW9uXG4gIHdoaWxlIChub1RpbWVvdXQgfHwgdGltZS5nZXRVbml4VGltZSgpIC0gc3RhcnRUaW1lIDw9IHRpbWVvdXQpIHtcbiAgICBpZiAoYXdhaXQgY2hlY2soKSkgcmV0dXJuXG4gICAgYXdhaXQgd2FpdChpbnRlcnZhbFJlc29sdXRpb24pXG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCdUaW1lb3V0Jylcbn1cblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZW91dFxuICogQHJldHVybiB7UHJvbWlzZTx1bmRlZmluZWQ+fVxuICovXG5leHBvcnQgY29uc3Qgd2FpdCA9IHRpbWVvdXQgPT4gY3JlYXRlKChyZXNvbHZlLCBfcmVqZWN0KSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWVvdXQpKVxuXG4vKipcbiAqIENoZWNrcyBpZiBhbiBvYmplY3QgaXMgYSBwcm9taXNlIHVzaW5nIGR1Y2t0eXBpbmcuXG4gKlxuICogUHJvbWlzZXMgYXJlIG9mdGVuIHBvbHlmaWxsZWQsIHNvIGl0IG1ha2VzIHNlbnNlIHRvIGFkZCBzb21lIGFkZGl0aW9uYWwgZ3VhcmFudGVlcyBpZiB0aGUgdXNlciBvZiB0aGlzXG4gKiBsaWJyYXJ5IGhhcyBzb21lIGluc2FuZSBlbnZpcm9ubWVudCB3aGVyZSBnbG9iYWwgUHJvbWlzZSBvYmplY3RzIGFyZSBvdmVyd3JpdHRlbi5cbiAqXG4gKiBAcGFyYW0ge2FueX0gcFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGNvbnN0IGlzUHJvbWlzZSA9IHAgPT4gcCBpbnN0YW5jZW9mIFByb21pc2UgfHwgKHAgJiYgcC50aGVuICYmIHAuY2F0Y2ggJiYgcC5maW5hbGx5KVxuIiwgIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIEhlbHBlcnMgZm9yIGNyb3NzLXRhYiBjb21tdW5pY2F0aW9uIHVzaW5nIGJyb2FkY2FzdGNoYW5uZWwgd2l0aCBMb2NhbFN0b3JhZ2UgZmFsbGJhY2suXG4gKlxuICogYGBganNcbiAqIC8vIEluIGJyb3dzZXIgd2luZG93IEE6XG4gKiBicm9hZGNhc3RjaGFubmVsLnN1YnNjcmliZSgnbXkgZXZlbnRzJywgZGF0YSA9PiBjb25zb2xlLmxvZyhkYXRhKSlcbiAqIGJyb2FkY2FzdGNoYW5uZWwucHVibGlzaCgnbXkgZXZlbnRzJywgJ0hlbGxvIHdvcmxkIScpIC8vID0+IEE6ICdIZWxsbyB3b3JsZCEnIGZpcmVzIHN5bmNocm9ub3VzbHkgaW4gc2FtZSB0YWJcbiAqXG4gKiAvLyBJbiBicm93c2VyIHdpbmRvdyBCOlxuICogYnJvYWRjYXN0Y2hhbm5lbC5wdWJsaXNoKCdteSBldmVudHMnLCAnaGVsbG8gZnJvbSB0YWIgQicpIC8vID0+IEE6ICdoZWxsbyBmcm9tIHRhYiBCJ1xuICogYGBgXG4gKlxuICogQG1vZHVsZSBicm9hZGNhc3RjaGFubmVsXG4gKi9cblxuLy8gQHRvZG8gYmVmb3JlIG5leHQgbWFqb3I6IHVzZSBVaW50OEFycmF5IGluc3RlYWQgYXMgYnVmZmVyIG9iamVjdFxuXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnLi9tYXAuanMnXG5pbXBvcnQgKiBhcyBzZXQgZnJvbSAnLi9zZXQuanMnXG5pbXBvcnQgKiBhcyBidWZmZXIgZnJvbSAnLi9idWZmZXIuanMnXG5pbXBvcnQgKiBhcyBzdG9yYWdlIGZyb20gJy4vc3RvcmFnZS5qcydcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBDaGFubmVsXG4gKiBAcHJvcGVydHkge1NldDxmdW5jdGlvbihhbnksIGFueSk6YW55Pn0gQ2hhbm5lbC5zdWJzXG4gKiBAcHJvcGVydHkge2FueX0gQ2hhbm5lbC5iY1xuICovXG5cbi8qKlxuICogQHR5cGUge01hcDxzdHJpbmcsIENoYW5uZWw+fVxuICovXG5jb25zdCBjaGFubmVscyA9IG5ldyBNYXAoKVxuXG4vKiBjOCBpZ25vcmUgc3RhcnQgKi9cbmNsYXNzIExvY2FsU3RvcmFnZVBvbHlmaWxsIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb29tXG4gICAqL1xuICBjb25zdHJ1Y3RvciAocm9vbSkge1xuICAgIHRoaXMucm9vbSA9IHJvb21cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVsbHxmdW5jdGlvbih7ZGF0YTpVaW50OEFycmF5fSk6dm9pZH1cbiAgICAgKi9cbiAgICB0aGlzLm9ubWVzc2FnZSA9IG51bGxcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2FueX0gZVxuICAgICAqL1xuICAgIHRoaXMuX29uQ2hhbmdlID0gZSA9PiBlLmtleSA9PT0gcm9vbSAmJiB0aGlzLm9ubWVzc2FnZSAhPT0gbnVsbCAmJiB0aGlzLm9ubWVzc2FnZSh7IGRhdGE6IGJ1ZmZlci5mcm9tQmFzZTY0KGUubmV3VmFsdWUgfHwgJycpIH0pXG4gICAgc3RvcmFnZS5vbkNoYW5nZSh0aGlzLl9vbkNoYW5nZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5QnVmZmVyfSBidWZcbiAgICovXG4gIHBvc3RNZXNzYWdlIChidWYpIHtcbiAgICBzdG9yYWdlLnZhclN0b3JhZ2Uuc2V0SXRlbSh0aGlzLnJvb20sIGJ1ZmZlci50b0Jhc2U2NChidWZmZXIuY3JlYXRlVWludDhBcnJheUZyb21BcnJheUJ1ZmZlcihidWYpKSlcbiAgfVxuXG4gIGNsb3NlICgpIHtcbiAgICBzdG9yYWdlLm9mZkNoYW5nZSh0aGlzLl9vbkNoYW5nZSlcbiAgfVxufVxuLyogYzggaWdub3JlIHN0b3AgKi9cblxuLy8gVXNlIEJyb2FkY2FzdENoYW5uZWwgb3IgUG9seWZpbGxcbi8qIGM4IGlnbm9yZSBuZXh0ICovXG5jb25zdCBCQyA9IHR5cGVvZiBCcm9hZGNhc3RDaGFubmVsID09PSAndW5kZWZpbmVkJyA/IExvY2FsU3RvcmFnZVBvbHlmaWxsIDogQnJvYWRjYXN0Q2hhbm5lbFxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSByb29tXG4gKiBAcmV0dXJuIHtDaGFubmVsfVxuICovXG5jb25zdCBnZXRDaGFubmVsID0gcm9vbSA9PlxuICBtYXAuc2V0SWZVbmRlZmluZWQoY2hhbm5lbHMsIHJvb20sICgpID0+IHtcbiAgICBjb25zdCBzdWJzID0gc2V0LmNyZWF0ZSgpXG4gICAgY29uc3QgYmMgPSBuZXcgQkMocm9vbSlcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3tkYXRhOkFycmF5QnVmZmVyfX0gZVxuICAgICAqL1xuICAgIC8qIGM4IGlnbm9yZSBuZXh0ICovXG4gICAgYmMub25tZXNzYWdlID0gZSA9PiBzdWJzLmZvckVhY2goc3ViID0+IHN1YihlLmRhdGEsICdicm9hZGNhc3RjaGFubmVsJykpXG4gICAgcmV0dXJuIHtcbiAgICAgIGJjLCBzdWJzXG4gICAgfVxuICB9KVxuXG4vKipcbiAqIFN1YnNjcmliZSB0byBnbG9iYWwgYHB1Ymxpc2hgIGV2ZW50cy5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSByb29tXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKGFueSwgYW55KTphbnl9IGZcbiAqL1xuZXhwb3J0IGNvbnN0IHN1YnNjcmliZSA9IChyb29tLCBmKSA9PiB7XG4gIGdldENoYW5uZWwocm9vbSkuc3Vicy5hZGQoZilcbiAgcmV0dXJuIGZcbn1cblxuLyoqXG4gKiBVbnN1YnNjcmliZSBmcm9tIGBwdWJsaXNoYCBnbG9iYWwgZXZlbnRzLlxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IHJvb21cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oYW55LCBhbnkpOmFueX0gZlxuICovXG5leHBvcnQgY29uc3QgdW5zdWJzY3JpYmUgPSAocm9vbSwgZikgPT4ge1xuICBjb25zdCBjaGFubmVsID0gZ2V0Q2hhbm5lbChyb29tKVxuICBjb25zdCB1bnN1YnNjcmliZWQgPSBjaGFubmVsLnN1YnMuZGVsZXRlKGYpXG4gIGlmICh1bnN1YnNjcmliZWQgJiYgY2hhbm5lbC5zdWJzLnNpemUgPT09IDApIHtcbiAgICBjaGFubmVsLmJjLmNsb3NlKClcbiAgICBjaGFubmVscy5kZWxldGUocm9vbSlcbiAgfVxuICByZXR1cm4gdW5zdWJzY3JpYmVkXG59XG5cbi8qKlxuICogUHVibGlzaCBkYXRhIHRvIGFsbCBzdWJzY3JpYmVycyAoaW5jbHVkaW5nIHN1YnNjcmliZXJzIG9uIHRoaXMgdGFiKVxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IHJvb21cbiAqIEBwYXJhbSB7YW55fSBkYXRhXG4gKiBAcGFyYW0ge2FueX0gW29yaWdpbl1cbiAqL1xuZXhwb3J0IGNvbnN0IHB1Ymxpc2ggPSAocm9vbSwgZGF0YSwgb3JpZ2luID0gbnVsbCkgPT4ge1xuICBjb25zdCBjID0gZ2V0Q2hhbm5lbChyb29tKVxuICBjLmJjLnBvc3RNZXNzYWdlKGRhdGEpXG4gIGMuc3Vicy5mb3JFYWNoKHN1YiA9PiBzdWIoZGF0YSwgb3JpZ2luKSlcbn1cbiIsICIvKipcbiAqIE11dHVhbCBleGNsdWRlIGZvciBKYXZhU2NyaXB0LlxuICpcbiAqIEBtb2R1bGUgbXV0ZXhcbiAqL1xuXG4vKipcbiAqIEBjYWxsYmFjayBtdXRleFxuICogQHBhcmFtIHtmdW5jdGlvbigpOnZvaWR9IGNiIE9ubHkgZXhlY3V0ZWQgd2hlbiB0aGlzIG11dGV4IGlzIG5vdCBpbiB0aGUgY3VycmVudCBzdGFja1xuICogQHBhcmFtIHtmdW5jdGlvbigpOnZvaWR9IFtlbHNlQ2JdIEV4ZWN1dGVkIHdoZW4gdGhpcyBtdXRleCBpcyBpbiB0aGUgY3VycmVudCBzdGFja1xuICovXG5cbi8qKlxuICogQ3JlYXRlcyBhIG11dHVhbCBleGNsdWRlIGZ1bmN0aW9uIHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0eTpcbiAqXG4gKiBgYGBqc1xuICogY29uc3QgbXV0ZXggPSBjcmVhdGVNdXRleCgpXG4gKiBtdXRleCgoKSA9PiB7XG4gKiAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgaW1tZWRpYXRlbHkgZXhlY3V0ZWRcbiAqICAgbXV0ZXgoKCkgPT4ge1xuICogICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgbm90IGV4ZWN1dGVkLCBhcyB0aGUgbXV0ZXggaXMgYWxyZWFkeSBhY3RpdmUuXG4gKiAgIH0pXG4gKiB9KVxuICogYGBgXG4gKlxuICogQHJldHVybiB7bXV0ZXh9IEEgbXV0dWFsIGV4Y2x1ZGUgZnVuY3Rpb25cbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZU11dGV4ID0gKCkgPT4ge1xuICBsZXQgdG9rZW4gPSB0cnVlXG4gIHJldHVybiAoZiwgZykgPT4ge1xuICAgIGlmICh0b2tlbikge1xuICAgICAgdG9rZW4gPSBmYWxzZVxuICAgICAgdHJ5IHtcbiAgICAgICAgZigpXG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0b2tlbiA9IHRydWVcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZygpXG4gICAgfVxuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgd3MgZnJvbSAnbGliMC93ZWJzb2NrZXQnXG5pbXBvcnQgKiBhcyBtYXAgZnJvbSAnbGliMC9tYXAnXG5pbXBvcnQgKiBhcyBlcnJvciBmcm9tICdsaWIwL2Vycm9yJ1xuaW1wb3J0ICogYXMgcmFuZG9tIGZyb20gJ2xpYjAvcmFuZG9tJ1xuaW1wb3J0ICogYXMgZW5jb2RpbmcgZnJvbSAnbGliMC9lbmNvZGluZydcbmltcG9ydCAqIGFzIGRlY29kaW5nIGZyb20gJ2xpYjAvZGVjb2RpbmcnXG5pbXBvcnQgeyBPYnNlcnZhYmxlVjIgfSBmcm9tICdsaWIwL29ic2VydmFibGUnXG5pbXBvcnQgKiBhcyBsb2dnaW5nIGZyb20gJ2xpYjAvbG9nZ2luZydcbmltcG9ydCAqIGFzIHByb21pc2UgZnJvbSAnbGliMC9wcm9taXNlJ1xuaW1wb3J0ICogYXMgYmMgZnJvbSAnbGliMC9icm9hZGNhc3RjaGFubmVsJ1xuaW1wb3J0ICogYXMgYnVmZmVyIGZyb20gJ2xpYjAvYnVmZmVyJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICdsaWIwL21hdGgnXG5pbXBvcnQgeyBjcmVhdGVNdXRleCB9IGZyb20gJ2xpYjAvbXV0ZXgnXG5cbmltcG9ydCAqIGFzIFkgZnJvbSAneWpzJyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5pbXBvcnQgUGVlciBmcm9tICdzaW1wbGUtcGVlci9zaW1wbGVwZWVyLm1pbi5qcydcblxuaW1wb3J0ICogYXMgc3luY1Byb3RvY29sIGZyb20gJ3ktcHJvdG9jb2xzL3N5bmMnXG5pbXBvcnQgKiBhcyBhd2FyZW5lc3NQcm90b2NvbCBmcm9tICd5LXByb3RvY29scy9hd2FyZW5lc3MnXG5cbmltcG9ydCAqIGFzIGNyeXB0b3V0aWxzIGZyb20gJy4vY3J5cHRvLmpzJ1xuXG5jb25zdCBsb2cgPSBsb2dnaW5nLmNyZWF0ZU1vZHVsZUxvZ2dlcigneS13ZWJydGMnKVxuXG5jb25zdCBtZXNzYWdlU3luYyA9IDBcbmNvbnN0IG1lc3NhZ2VRdWVyeUF3YXJlbmVzcyA9IDNcbmNvbnN0IG1lc3NhZ2VBd2FyZW5lc3MgPSAxXG5jb25zdCBtZXNzYWdlQmNQZWVySWQgPSA0XG5cbi8qKlxuICogQHR5cGUge01hcDxzdHJpbmcsIFNpZ25hbGluZ0Nvbm4+fVxuICovXG5jb25zdCBzaWduYWxpbmdDb25ucyA9IG5ldyBNYXAoKVxuXG4vKipcbiAqIEB0eXBlIHtNYXA8c3RyaW5nLFJvb20+fVxuICovXG5jb25zdCByb29tcyA9IG5ldyBNYXAoKVxuXG4vKipcbiAqIEBwYXJhbSB7Um9vbX0gcm9vbVxuICovXG5jb25zdCBjaGVja0lzU3luY2VkID0gcm9vbSA9PiB7XG4gIGxldCBzeW5jZWQgPSB0cnVlXG4gIHJvb20ud2VicnRjQ29ubnMuZm9yRWFjaChwZWVyID0+IHtcbiAgICBpZiAoIXBlZXIuc3luY2VkKSB7XG4gICAgICBzeW5jZWQgPSBmYWxzZVxuICAgIH1cbiAgfSlcbiAgaWYgKCghc3luY2VkICYmIHJvb20uc3luY2VkKSB8fCAoc3luY2VkICYmICFyb29tLnN5bmNlZCkpIHtcbiAgICByb29tLnN5bmNlZCA9IHN5bmNlZFxuICAgIHJvb20ucHJvdmlkZXIuZW1pdCgnc3luY2VkJywgW3sgc3luY2VkIH1dKVxuICAgIGxvZygnc3luY2VkICcsIGxvZ2dpbmcuQk9MRCwgcm9vbS5uYW1lLCBsb2dnaW5nLlVOQk9MRCwgJyB3aXRoIGFsbCBwZWVycycpXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1Jvb219IHJvb21cbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzeW5jZWRDYWxsYmFja1xuICogQHJldHVybiB7ZW5jb2RpbmcuRW5jb2Rlcj99XG4gKi9cbmNvbnN0IHJlYWRNZXNzYWdlID0gKHJvb20sIGJ1Ziwgc3luY2VkQ2FsbGJhY2spID0+IHtcbiAgY29uc3QgZGVjb2RlciA9IGRlY29kaW5nLmNyZWF0ZURlY29kZXIoYnVmKVxuICBjb25zdCBlbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gIGNvbnN0IG1lc3NhZ2VUeXBlID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2RlcilcbiAgaWYgKHJvb20gPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgY29uc3QgYXdhcmVuZXNzID0gcm9vbS5hd2FyZW5lc3NcbiAgY29uc3QgZG9jID0gcm9vbS5kb2NcbiAgbGV0IHNlbmRSZXBseSA9IGZhbHNlXG4gIHN3aXRjaCAobWVzc2FnZVR5cGUpIHtcbiAgICBjYXNlIG1lc3NhZ2VTeW5jOiB7XG4gICAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgbWVzc2FnZVN5bmMpXG4gICAgICBjb25zdCBzeW5jTWVzc2FnZVR5cGUgPSBzeW5jUHJvdG9jb2wucmVhZFN5bmNNZXNzYWdlKGRlY29kZXIsIGVuY29kZXIsIGRvYywgcm9vbSlcbiAgICAgIGlmIChzeW5jTWVzc2FnZVR5cGUgPT09IHN5bmNQcm90b2NvbC5tZXNzYWdlWWpzU3luY1N0ZXAyICYmICFyb29tLnN5bmNlZCkge1xuICAgICAgICBzeW5jZWRDYWxsYmFjaygpXG4gICAgICB9XG4gICAgICBpZiAoc3luY01lc3NhZ2VUeXBlID09PSBzeW5jUHJvdG9jb2wubWVzc2FnZVlqc1N5bmNTdGVwMSkge1xuICAgICAgICBzZW5kUmVwbHkgPSB0cnVlXG4gICAgICB9XG4gICAgICBicmVha1xuICAgIH1cbiAgICBjYXNlIG1lc3NhZ2VRdWVyeUF3YXJlbmVzczpcbiAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCBtZXNzYWdlQXdhcmVuZXNzKVxuICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXIsIGF3YXJlbmVzc1Byb3RvY29sLmVuY29kZUF3YXJlbmVzc1VwZGF0ZShhd2FyZW5lc3MsIEFycmF5LmZyb20oYXdhcmVuZXNzLmdldFN0YXRlcygpLmtleXMoKSkpKVxuICAgICAgc2VuZFJlcGx5ID0gdHJ1ZVxuICAgICAgYnJlYWtcbiAgICBjYXNlIG1lc3NhZ2VBd2FyZW5lc3M6XG4gICAgICBhd2FyZW5lc3NQcm90b2NvbC5hcHBseUF3YXJlbmVzc1VwZGF0ZShhd2FyZW5lc3MsIGRlY29kaW5nLnJlYWRWYXJVaW50OEFycmF5KGRlY29kZXIpLCByb29tKVxuICAgICAgYnJlYWtcbiAgICBjYXNlIG1lc3NhZ2VCY1BlZXJJZDoge1xuICAgICAgY29uc3QgYWRkID0gZGVjb2RpbmcucmVhZFVpbnQ4KGRlY29kZXIpID09PSAxXG4gICAgICBjb25zdCBwZWVyTmFtZSA9IGRlY29kaW5nLnJlYWRWYXJTdHJpbmcoZGVjb2RlcilcbiAgICAgIGlmIChwZWVyTmFtZSAhPT0gcm9vbS5wZWVySWQgJiYgKChyb29tLmJjQ29ubnMuaGFzKHBlZXJOYW1lKSAmJiAhYWRkKSB8fCAoIXJvb20uYmNDb25ucy5oYXMocGVlck5hbWUpICYmIGFkZCkpKSB7XG4gICAgICAgIGNvbnN0IHJlbW92ZWQgPSBbXVxuICAgICAgICBjb25zdCBhZGRlZCA9IFtdXG4gICAgICAgIGlmIChhZGQpIHtcbiAgICAgICAgICByb29tLmJjQ29ubnMuYWRkKHBlZXJOYW1lKVxuICAgICAgICAgIGFkZGVkLnB1c2gocGVlck5hbWUpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcm9vbS5iY0Nvbm5zLmRlbGV0ZShwZWVyTmFtZSlcbiAgICAgICAgICByZW1vdmVkLnB1c2gocGVlck5hbWUpXG4gICAgICAgIH1cbiAgICAgICAgcm9vbS5wcm92aWRlci5lbWl0KCdwZWVycycsIFt7XG4gICAgICAgICAgYWRkZWQsXG4gICAgICAgICAgcmVtb3ZlZCxcbiAgICAgICAgICB3ZWJydGNQZWVyczogQXJyYXkuZnJvbShyb29tLndlYnJ0Y0Nvbm5zLmtleXMoKSksXG4gICAgICAgICAgYmNQZWVyczogQXJyYXkuZnJvbShyb29tLmJjQ29ubnMpXG4gICAgICAgIH1dKVxuICAgICAgICBicm9hZGNhc3RCY1BlZXJJZChyb29tKVxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1VuYWJsZSB0byBjb21wdXRlIG1lc3NhZ2UnKVxuICAgICAgcmV0dXJuIGVuY29kZXJcbiAgfVxuICBpZiAoIXNlbmRSZXBseSkge1xuICAgIC8vIG5vdGhpbmcgaGFzIGJlZW4gd3JpdHRlbiwgbm8gYW5zd2VyIGNyZWF0ZWRcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiBlbmNvZGVyXG59XG5cbi8qKlxuICogQHBhcmFtIHtXZWJydGNDb25ufSBwZWVyQ29ublxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZcbiAqIEByZXR1cm4ge2VuY29kaW5nLkVuY29kZXI/fVxuICovXG5jb25zdCByZWFkUGVlck1lc3NhZ2UgPSAocGVlckNvbm4sIGJ1ZikgPT4ge1xuICBjb25zdCByb29tID0gcGVlckNvbm4ucm9vbVxuICBsb2coJ3JlY2VpdmVkIG1lc3NhZ2UgZnJvbSAnLCBsb2dnaW5nLkJPTEQsIHBlZXJDb25uLnJlbW90ZVBlZXJJZCwgbG9nZ2luZy5HUkVZLCAnICgnLCByb29tLm5hbWUsICcpJywgbG9nZ2luZy5VTkJPTEQsIGxvZ2dpbmcuVU5DT0xPUilcbiAgcmV0dXJuIHJlYWRNZXNzYWdlKHJvb20sIGJ1ZiwgKCkgPT4ge1xuICAgIHBlZXJDb25uLnN5bmNlZCA9IHRydWVcbiAgICBsb2coJ3N5bmNlZCAnLCBsb2dnaW5nLkJPTEQsIHJvb20ubmFtZSwgbG9nZ2luZy5VTkJPTEQsICcgd2l0aCAnLCBsb2dnaW5nLkJPTEQsIHBlZXJDb25uLnJlbW90ZVBlZXJJZClcbiAgICBjaGVja0lzU3luY2VkKHJvb20pXG4gIH0pXG59XG5cbi8qKlxuICogQHBhcmFtIHtXZWJydGNDb25ufSB3ZWJydGNDb25uXG4gKiBAcGFyYW0ge2VuY29kaW5nLkVuY29kZXJ9IGVuY29kZXJcbiAqL1xuY29uc3Qgc2VuZFdlYnJ0Y0Nvbm4gPSAod2VicnRjQ29ubiwgZW5jb2RlcikgPT4ge1xuICBsb2coJ3NlbmQgbWVzc2FnZSB0byAnLCBsb2dnaW5nLkJPTEQsIHdlYnJ0Y0Nvbm4ucmVtb3RlUGVlcklkLCBsb2dnaW5nLlVOQk9MRCwgbG9nZ2luZy5HUkVZLCAnICgnLCB3ZWJydGNDb25uLnJvb20ubmFtZSwgJyknLCBsb2dnaW5nLlVOQ09MT1IpXG4gIHRyeSB7XG4gICAgd2VicnRjQ29ubi5wZWVyLnNlbmQoZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXIpKVxuICB9IGNhdGNoIChlKSB7fVxufVxuXG4vKipcbiAqIEBwYXJhbSB7Um9vbX0gcm9vbVxuICogQHBhcmFtIHtVaW50OEFycmF5fSBtXG4gKi9cbmNvbnN0IGJyb2FkY2FzdFdlYnJ0Y0Nvbm4gPSAocm9vbSwgbSkgPT4ge1xuICBsb2coJ2Jyb2FkY2FzdCBtZXNzYWdlIGluICcsIGxvZ2dpbmcuQk9MRCwgcm9vbS5uYW1lLCBsb2dnaW5nLlVOQk9MRClcbiAgcm9vbS53ZWJydGNDb25ucy5mb3JFYWNoKGNvbm4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25uLnBlZXIuc2VuZChtKVxuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH0pXG59XG5cbmV4cG9ydCBjbGFzcyBXZWJydGNDb25uIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7U2lnbmFsaW5nQ29ubn0gc2lnbmFsaW5nQ29ublxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGluaXRpYXRvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVtb3RlUGVlcklkXG4gICAqIEBwYXJhbSB7Um9vbX0gcm9vbVxuICAgKi9cbiAgY29uc3RydWN0b3IgKHNpZ25hbGluZ0Nvbm4sIGluaXRpYXRvciwgcmVtb3RlUGVlcklkLCByb29tKSB7XG4gICAgbG9nKCdlc3RhYmxpc2hpbmcgY29ubmVjdGlvbiB0byAnLCBsb2dnaW5nLkJPTEQsIHJlbW90ZVBlZXJJZClcbiAgICB0aGlzLnJvb20gPSByb29tXG4gICAgdGhpcy5yZW1vdGVQZWVySWQgPSByZW1vdGVQZWVySWRcbiAgICB0aGlzLmdsYXJlVG9rZW4gPSB1bmRlZmluZWRcbiAgICB0aGlzLmNsb3NlZCA9IGZhbHNlXG4gICAgdGhpcy5jb25uZWN0ZWQgPSBmYWxzZVxuICAgIHRoaXMuc3luY2VkID0gZmFsc2VcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7YW55fVxuICAgICAqL1xuICAgIHRoaXMucGVlciA9IG5ldyBQZWVyKHsgaW5pdGlhdG9yLCAuLi5yb29tLnByb3ZpZGVyLnBlZXJPcHRzIH0pXG4gICAgdGhpcy5wZWVyLm9uKCdzaWduYWwnLCBzaWduYWwgPT4ge1xuICAgICAgaWYgKHRoaXMuZ2xhcmVUb2tlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGFkZCBzb21lIHJhbmRvbW5lc3MgdG8gdGhlIHRpbWVzdGFtcCBvZiB0aGUgb2ZmZXJcbiAgICAgICAgdGhpcy5nbGFyZVRva2VuID0gRGF0ZS5ub3coKSArIE1hdGgucmFuZG9tKClcbiAgICAgIH1cbiAgICAgIHB1Ymxpc2hTaWduYWxpbmdNZXNzYWdlKHNpZ25hbGluZ0Nvbm4sIHJvb20sIHsgdG86IHJlbW90ZVBlZXJJZCwgZnJvbTogcm9vbS5wZWVySWQsIHR5cGU6ICdzaWduYWwnLCB0b2tlbjogdGhpcy5nbGFyZVRva2VuLCBzaWduYWwgfSlcbiAgICB9KVxuICAgIHRoaXMucGVlci5vbignY29ubmVjdCcsICgpID0+IHtcbiAgICAgIGxvZygnY29ubmVjdGVkIHRvICcsIGxvZ2dpbmcuQk9MRCwgcmVtb3RlUGVlcklkKVxuICAgICAgdGhpcy5jb25uZWN0ZWQgPSB0cnVlXG4gICAgICAvLyBzZW5kIHN5bmMgc3RlcCAxXG4gICAgICBjb25zdCBwcm92aWRlciA9IHJvb20ucHJvdmlkZXJcbiAgICAgIGNvbnN0IGRvYyA9IHByb3ZpZGVyLmRvY1xuICAgICAgY29uc3QgYXdhcmVuZXNzID0gcm9vbS5hd2FyZW5lc3NcbiAgICAgIGNvbnN0IGVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCBtZXNzYWdlU3luYylcbiAgICAgIHN5bmNQcm90b2NvbC53cml0ZVN5bmNTdGVwMShlbmNvZGVyLCBkb2MpXG4gICAgICBzZW5kV2VicnRjQ29ubih0aGlzLCBlbmNvZGVyKVxuICAgICAgY29uc3QgYXdhcmVuZXNzU3RhdGVzID0gYXdhcmVuZXNzLmdldFN0YXRlcygpXG4gICAgICBpZiAoYXdhcmVuZXNzU3RhdGVzLnNpemUgPiAwKSB7XG4gICAgICAgIGNvbnN0IGVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAgICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIG1lc3NhZ2VBd2FyZW5lc3MpXG4gICAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNvZGVyLCBhd2FyZW5lc3NQcm90b2NvbC5lbmNvZGVBd2FyZW5lc3NVcGRhdGUoYXdhcmVuZXNzLCBBcnJheS5mcm9tKGF3YXJlbmVzc1N0YXRlcy5rZXlzKCkpKSlcbiAgICAgICAgc2VuZFdlYnJ0Y0Nvbm4odGhpcywgZW5jb2RlcilcbiAgICAgIH1cbiAgICB9KVxuICAgIHRoaXMucGVlci5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlXG4gICAgICB0aGlzLmNsb3NlZCA9IHRydWVcbiAgICAgIGlmIChyb29tLndlYnJ0Y0Nvbm5zLmhhcyh0aGlzLnJlbW90ZVBlZXJJZCkpIHtcbiAgICAgICAgcm9vbS53ZWJydGNDb25ucy5kZWxldGUodGhpcy5yZW1vdGVQZWVySWQpXG4gICAgICAgIHJvb20ucHJvdmlkZXIuZW1pdCgncGVlcnMnLCBbe1xuICAgICAgICAgIHJlbW92ZWQ6IFt0aGlzLnJlbW90ZVBlZXJJZF0sXG4gICAgICAgICAgYWRkZWQ6IFtdLFxuICAgICAgICAgIHdlYnJ0Y1BlZXJzOiBBcnJheS5mcm9tKHJvb20ud2VicnRjQ29ubnMua2V5cygpKSxcbiAgICAgICAgICBiY1BlZXJzOiBBcnJheS5mcm9tKHJvb20uYmNDb25ucylcbiAgICAgICAgfV0pXG4gICAgICB9XG4gICAgICBjaGVja0lzU3luY2VkKHJvb20pXG4gICAgICB0aGlzLnBlZXIuZGVzdHJveSgpXG4gICAgICBsb2coJ2Nsb3NlZCBjb25uZWN0aW9uIHRvICcsIGxvZ2dpbmcuQk9MRCwgcmVtb3RlUGVlcklkKVxuICAgICAgYW5ub3VuY2VTaWduYWxpbmdJbmZvKHJvb20pXG4gICAgfSlcbiAgICB0aGlzLnBlZXIub24oJ2Vycm9yJywgZXJyID0+IHtcbiAgICAgIGxvZygnRXJyb3IgaW4gY29ubmVjdGlvbiB0byAnLCBsb2dnaW5nLkJPTEQsIHJlbW90ZVBlZXJJZCwgJzogJywgZXJyKVxuICAgICAgYW5ub3VuY2VTaWduYWxpbmdJbmZvKHJvb20pXG4gICAgfSlcbiAgICB0aGlzLnBlZXIub24oJ2RhdGEnLCBkYXRhID0+IHtcbiAgICAgIGNvbnN0IGFuc3dlciA9IHJlYWRQZWVyTWVzc2FnZSh0aGlzLCBkYXRhKVxuICAgICAgaWYgKGFuc3dlciAhPT0gbnVsbCkge1xuICAgICAgICBzZW5kV2VicnRjQ29ubih0aGlzLCBhbnN3ZXIpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMucGVlci5kZXN0cm95KClcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7Um9vbX0gcm9vbVxuICogQHBhcmFtIHtVaW50OEFycmF5fSBtXG4gKi9cbmNvbnN0IGJyb2FkY2FzdEJjTWVzc2FnZSA9IChyb29tLCBtKSA9PiBjcnlwdG91dGlscy5lbmNyeXB0KG0sIHJvb20ua2V5KS50aGVuKGRhdGEgPT5cbiAgcm9vbS5tdXgoKCkgPT5cbiAgICBiYy5wdWJsaXNoKHJvb20ubmFtZSwgZGF0YSlcbiAgKVxuKVxuXG4vKipcbiAqIEBwYXJhbSB7Um9vbX0gcm9vbVxuICogQHBhcmFtIHtVaW50OEFycmF5fSBtXG4gKi9cbmNvbnN0IGJyb2FkY2FzdFJvb21NZXNzYWdlID0gKHJvb20sIG0pID0+IHtcbiAgaWYgKHJvb20uYmNjb25uZWN0ZWQpIHtcbiAgICBicm9hZGNhc3RCY01lc3NhZ2Uocm9vbSwgbSlcbiAgfVxuICBicm9hZGNhc3RXZWJydGNDb25uKHJvb20sIG0pXG59XG5cbi8qKlxuICogQHBhcmFtIHtSb29tfSByb29tXG4gKi9cbmNvbnN0IGFubm91bmNlU2lnbmFsaW5nSW5mbyA9IHJvb20gPT4ge1xuICBzaWduYWxpbmdDb25ucy5mb3JFYWNoKGNvbm4gPT4ge1xuICAgIC8vIG9ubHkgc3Vic2NyaWJlIGlmIGNvbm5lY3Rpb24gaXMgZXN0YWJsaXNoZWQsIG90aGVyd2lzZSB0aGUgY29ubiBhdXRvbWF0aWNhbGx5IHN1YnNjcmliZXMgdG8gYWxsIHJvb21zXG4gICAgaWYgKGNvbm4uY29ubmVjdGVkKSB7XG4gICAgICBjb25uLnNlbmQoeyB0eXBlOiAnc3Vic2NyaWJlJywgdG9waWNzOiBbcm9vbS5uYW1lXSB9KVxuICAgICAgaWYgKHJvb20ud2VicnRjQ29ubnMuc2l6ZSA8IHJvb20ucHJvdmlkZXIubWF4Q29ubnMpIHtcbiAgICAgICAgcHVibGlzaFNpZ25hbGluZ01lc3NhZ2UoY29ubiwgcm9vbSwgeyB0eXBlOiAnYW5ub3VuY2UnLCBmcm9tOiByb29tLnBlZXJJZCB9KVxuICAgICAgfVxuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1Jvb219IHJvb21cbiAqL1xuY29uc3QgYnJvYWRjYXN0QmNQZWVySWQgPSByb29tID0+IHtcbiAgaWYgKHJvb20ucHJvdmlkZXIuZmlsdGVyQmNDb25ucykge1xuICAgIC8vIGJyb2FkY2FzdCBwZWVySWQgdmlhIGJyb2FkY2FzdGNoYW5uZWxcbiAgICBjb25zdCBlbmNvZGVyUGVlcklkQmMgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlclBlZXJJZEJjLCBtZXNzYWdlQmNQZWVySWQpXG4gICAgZW5jb2Rpbmcud3JpdGVVaW50OChlbmNvZGVyUGVlcklkQmMsIDEpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJTdHJpbmcoZW5jb2RlclBlZXJJZEJjLCByb29tLnBlZXJJZClcbiAgICBicm9hZGNhc3RCY01lc3NhZ2Uocm9vbSwgZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXJQZWVySWRCYykpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJvb20ge1xuICAvKipcbiAgICogQHBhcmFtIHtZLkRvY30gZG9jXG4gICAqIEBwYXJhbSB7V2VicnRjUHJvdmlkZXJ9IHByb3ZpZGVyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAqIEBwYXJhbSB7Q3J5cHRvS2V5fG51bGx9IGtleVxuICAgKi9cbiAgY29uc3RydWN0b3IgKGRvYywgcHJvdmlkZXIsIG5hbWUsIGtleSkge1xuICAgIC8qKlxuICAgICAqIERvIG5vdCBhc3N1bWUgdGhhdCBwZWVySWQgaXMgdW5pcXVlLiBUaGlzIGlzIG9ubHkgbWVhbnQgZm9yIHNlbmRpbmcgc2lnbmFsaW5nIG1lc3NhZ2VzLlxuICAgICAqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLnBlZXJJZCA9IHJhbmRvbS51dWlkdjQoKVxuICAgIHRoaXMuZG9jID0gZG9jXG4gICAgLyoqXG4gICAgICogQHR5cGUge2F3YXJlbmVzc1Byb3RvY29sLkF3YXJlbmVzc31cbiAgICAgKi9cbiAgICB0aGlzLmF3YXJlbmVzcyA9IHByb3ZpZGVyLmF3YXJlbmVzc1xuICAgIHRoaXMucHJvdmlkZXIgPSBwcm92aWRlclxuICAgIHRoaXMuc3luY2VkID0gZmFsc2VcbiAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgLy8gQHRvZG8gbWFrZSBrZXkgc2VjcmV0IGJ5IHNjb3BpbmdcbiAgICB0aGlzLmtleSA9IGtleVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtNYXA8c3RyaW5nLCBXZWJydGNDb25uPn1cbiAgICAgKi9cbiAgICB0aGlzLndlYnJ0Y0Nvbm5zID0gbmV3IE1hcCgpXG4gICAgLyoqXG4gICAgICogQHR5cGUge1NldDxzdHJpbmc+fVxuICAgICAqL1xuICAgIHRoaXMuYmNDb25ucyA9IG5ldyBTZXQoKVxuICAgIHRoaXMubXV4ID0gY3JlYXRlTXV0ZXgoKVxuICAgIHRoaXMuYmNjb25uZWN0ZWQgPSBmYWxzZVxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7QXJyYXlCdWZmZXJ9IGRhdGFcbiAgICAgKi9cbiAgICB0aGlzLl9iY1N1YnNjcmliZXIgPSBkYXRhID0+XG4gICAgICBjcnlwdG91dGlscy5kZWNyeXB0KG5ldyBVaW50OEFycmF5KGRhdGEpLCBrZXkpLnRoZW4obSA9PlxuICAgICAgICB0aGlzLm11eCgoKSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVwbHkgPSByZWFkTWVzc2FnZSh0aGlzLCBtLCAoKSA9PiB7fSlcbiAgICAgICAgICBpZiAocmVwbHkpIHtcbiAgICAgICAgICAgIGJyb2FkY2FzdEJjTWVzc2FnZSh0aGlzLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkocmVwbHkpKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAvKipcbiAgICAgKiBMaXN0ZW5zIHRvIFlqcyB1cGRhdGVzIGFuZCBzZW5kcyB0aGVtIHRvIHJlbW90ZSBwZWVyc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAgICAgKiBAcGFyYW0ge2FueX0gX29yaWdpblxuICAgICAqL1xuICAgIHRoaXMuX2RvY1VwZGF0ZUhhbmRsZXIgPSAodXBkYXRlLCBfb3JpZ2luKSA9PiB7XG4gICAgICBjb25zdCBlbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gICAgICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgbWVzc2FnZVN5bmMpXG4gICAgICBzeW5jUHJvdG9jb2wud3JpdGVVcGRhdGUoZW5jb2RlciwgdXBkYXRlKVxuICAgICAgYnJvYWRjYXN0Um9vbU1lc3NhZ2UodGhpcywgZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXIpKVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBMaXN0ZW5zIHRvIEF3YXJlbmVzcyB1cGRhdGVzIGFuZCBzZW5kcyB0aGVtIHRvIHJlbW90ZSBwZWVyc1xuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IGNoYW5nZWRcbiAgICAgKiBAcGFyYW0ge2FueX0gX29yaWdpblxuICAgICAqL1xuICAgIHRoaXMuX2F3YXJlbmVzc1VwZGF0ZUhhbmRsZXIgPSAoeyBhZGRlZCwgdXBkYXRlZCwgcmVtb3ZlZCB9LCBfb3JpZ2luKSA9PiB7XG4gICAgICBjb25zdCBjaGFuZ2VkQ2xpZW50cyA9IGFkZGVkLmNvbmNhdCh1cGRhdGVkKS5jb25jYXQocmVtb3ZlZClcbiAgICAgIGNvbnN0IGVuY29kZXJBd2FyZW5lc3MgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAgICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyQXdhcmVuZXNzLCBtZXNzYWdlQXdhcmVuZXNzKVxuICAgICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXJBd2FyZW5lc3MsIGF3YXJlbmVzc1Byb3RvY29sLmVuY29kZUF3YXJlbmVzc1VwZGF0ZSh0aGlzLmF3YXJlbmVzcywgY2hhbmdlZENsaWVudHMpKVxuICAgICAgYnJvYWRjYXN0Um9vbU1lc3NhZ2UodGhpcywgZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXJBd2FyZW5lc3MpKVxuICAgIH1cblxuICAgIHRoaXMuX2JlZm9yZVVubG9hZEhhbmRsZXIgPSAoKSA9PiB7XG4gICAgICBhd2FyZW5lc3NQcm90b2NvbC5yZW1vdmVBd2FyZW5lc3NTdGF0ZXModGhpcy5hd2FyZW5lc3MsIFtkb2MuY2xpZW50SURdLCAnd2luZG93IHVubG9hZCcpXG4gICAgICByb29tcy5mb3JFYWNoKHJvb20gPT4ge1xuICAgICAgICByb29tLmRpc2Nvbm5lY3QoKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdiZWZvcmV1bmxvYWQnLCB0aGlzLl9iZWZvcmVVbmxvYWRIYW5kbGVyKVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwcm9jZXNzLm9uKCdleGl0JywgdGhpcy5fYmVmb3JlVW5sb2FkSGFuZGxlcilcbiAgICB9XG4gIH1cblxuICBjb25uZWN0ICgpIHtcbiAgICB0aGlzLmRvYy5vbigndXBkYXRlJywgdGhpcy5fZG9jVXBkYXRlSGFuZGxlcilcbiAgICB0aGlzLmF3YXJlbmVzcy5vbigndXBkYXRlJywgdGhpcy5fYXdhcmVuZXNzVXBkYXRlSGFuZGxlcilcbiAgICAvLyBzaWduYWwgdGhyb3VnaCBhbGwgYXZhaWxhYmxlIHNpZ25hbGluZyBjb25uZWN0aW9uc1xuICAgIGFubm91bmNlU2lnbmFsaW5nSW5mbyh0aGlzKVxuICAgIGNvbnN0IHJvb21OYW1lID0gdGhpcy5uYW1lXG4gICAgYmMuc3Vic2NyaWJlKHJvb21OYW1lLCB0aGlzLl9iY1N1YnNjcmliZXIpXG4gICAgdGhpcy5iY2Nvbm5lY3RlZCA9IHRydWVcbiAgICAvLyBicm9hZGNhc3QgcGVlcklkIHZpYSBicm9hZGNhc3RjaGFubmVsXG4gICAgYnJvYWRjYXN0QmNQZWVySWQodGhpcylcbiAgICAvLyB3cml0ZSBzeW5jIHN0ZXAgMVxuICAgIGNvbnN0IGVuY29kZXJTeW5jID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXJTeW5jLCBtZXNzYWdlU3luYylcbiAgICBzeW5jUHJvdG9jb2wud3JpdGVTeW5jU3RlcDEoZW5jb2RlclN5bmMsIHRoaXMuZG9jKVxuICAgIGJyb2FkY2FzdEJjTWVzc2FnZSh0aGlzLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlclN5bmMpKVxuICAgIC8vIGJyb2FkY2FzdCBsb2NhbCBzdGF0ZVxuICAgIGNvbnN0IGVuY29kZXJTdGF0ZSA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyU3RhdGUsIG1lc3NhZ2VTeW5jKVxuICAgIHN5bmNQcm90b2NvbC53cml0ZVN5bmNTdGVwMihlbmNvZGVyU3RhdGUsIHRoaXMuZG9jKVxuICAgIGJyb2FkY2FzdEJjTWVzc2FnZSh0aGlzLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlclN0YXRlKSlcbiAgICAvLyB3cml0ZSBxdWVyeUF3YXJlbmVzc1xuICAgIGNvbnN0IGVuY29kZXJBd2FyZW5lc3NRdWVyeSA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyQXdhcmVuZXNzUXVlcnksIG1lc3NhZ2VRdWVyeUF3YXJlbmVzcylcbiAgICBicm9hZGNhc3RCY01lc3NhZ2UodGhpcywgZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXJBd2FyZW5lc3NRdWVyeSkpXG4gICAgLy8gYnJvYWRjYXN0IGxvY2FsIGF3YXJlbmVzcyBzdGF0ZVxuICAgIGNvbnN0IGVuY29kZXJBd2FyZW5lc3NTdGF0ZSA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyQXdhcmVuZXNzU3RhdGUsIG1lc3NhZ2VBd2FyZW5lc3MpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY29kZXJBd2FyZW5lc3NTdGF0ZSwgYXdhcmVuZXNzUHJvdG9jb2wuZW5jb2RlQXdhcmVuZXNzVXBkYXRlKHRoaXMuYXdhcmVuZXNzLCBbdGhpcy5kb2MuY2xpZW50SURdKSlcbiAgICBicm9hZGNhc3RCY01lc3NhZ2UodGhpcywgZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXJBd2FyZW5lc3NTdGF0ZSkpXG4gIH1cblxuICBkaXNjb25uZWN0ICgpIHtcbiAgICAvLyBzaWduYWwgdGhyb3VnaCBhbGwgYXZhaWxhYmxlIHNpZ25hbGluZyBjb25uZWN0aW9uc1xuICAgIHNpZ25hbGluZ0Nvbm5zLmZvckVhY2goY29ubiA9PiB7XG4gICAgICBpZiAoY29ubi5jb25uZWN0ZWQpIHtcbiAgICAgICAgY29ubi5zZW5kKHsgdHlwZTogJ3Vuc3Vic2NyaWJlJywgdG9waWNzOiBbdGhpcy5uYW1lXSB9KVxuICAgICAgfVxuICAgIH0pXG4gICAgYXdhcmVuZXNzUHJvdG9jb2wucmVtb3ZlQXdhcmVuZXNzU3RhdGVzKHRoaXMuYXdhcmVuZXNzLCBbdGhpcy5kb2MuY2xpZW50SURdLCAnZGlzY29ubmVjdCcpXG4gICAgLy8gYnJvYWRjYXN0IHBlZXJJZCByZW1vdmFsIHZpYSBicm9hZGNhc3RjaGFubmVsXG4gICAgY29uc3QgZW5jb2RlclBlZXJJZEJjID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXJQZWVySWRCYywgbWVzc2FnZUJjUGVlcklkKVxuICAgIGVuY29kaW5nLndyaXRlVWludDgoZW5jb2RlclBlZXJJZEJjLCAwKSAvLyByZW1vdmUgcGVlcklkIGZyb20gb3RoZXIgYmMgcGVlcnNcbiAgICBlbmNvZGluZy53cml0ZVZhclN0cmluZyhlbmNvZGVyUGVlcklkQmMsIHRoaXMucGVlcklkKVxuICAgIGJyb2FkY2FzdEJjTWVzc2FnZSh0aGlzLCBlbmNvZGluZy50b1VpbnQ4QXJyYXkoZW5jb2RlclBlZXJJZEJjKSlcblxuICAgIGJjLnVuc3Vic2NyaWJlKHRoaXMubmFtZSwgdGhpcy5fYmNTdWJzY3JpYmVyKVxuICAgIHRoaXMuYmNjb25uZWN0ZWQgPSBmYWxzZVxuICAgIHRoaXMuZG9jLm9mZigndXBkYXRlJywgdGhpcy5fZG9jVXBkYXRlSGFuZGxlcilcbiAgICB0aGlzLmF3YXJlbmVzcy5vZmYoJ3VwZGF0ZScsIHRoaXMuX2F3YXJlbmVzc1VwZGF0ZUhhbmRsZXIpXG4gICAgdGhpcy53ZWJydGNDb25ucy5mb3JFYWNoKGNvbm4gPT4gY29ubi5kZXN0cm95KCkpXG4gIH1cblxuICBkZXN0cm95ICgpIHtcbiAgICB0aGlzLmRpc2Nvbm5lY3QoKVxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JlZm9yZXVubG9hZCcsIHRoaXMuX2JlZm9yZVVubG9hZEhhbmRsZXIpXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHByb2Nlc3Mub2ZmKCdleGl0JywgdGhpcy5fYmVmb3JlVW5sb2FkSGFuZGxlcilcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1kuRG9jfSBkb2NcbiAqIEBwYXJhbSB7V2VicnRjUHJvdmlkZXJ9IHByb3ZpZGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtDcnlwdG9LZXl8bnVsbH0ga2V5XG4gKiBAcmV0dXJuIHtSb29tfVxuICovXG5jb25zdCBvcGVuUm9vbSA9IChkb2MsIHByb3ZpZGVyLCBuYW1lLCBrZXkpID0+IHtcbiAgLy8gdGhlcmUgbXVzdCBvbmx5IGJlIG9uZSByb29tXG4gIGlmIChyb29tcy5oYXMobmFtZSkpIHtcbiAgICB0aHJvdyBlcnJvci5jcmVhdGUoYEEgWWpzIERvYyBjb25uZWN0ZWQgdG8gcm9vbSBcIiR7bmFtZX1cIiBhbHJlYWR5IGV4aXN0cyFgKVxuICB9XG4gIGNvbnN0IHJvb20gPSBuZXcgUm9vbShkb2MsIHByb3ZpZGVyLCBuYW1lLCBrZXkpXG4gIHJvb21zLnNldChuYW1lLCAvKiogQHR5cGUge1Jvb219ICovIChyb29tKSlcbiAgcmV0dXJuIHJvb21cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1NpZ25hbGluZ0Nvbm59IGNvbm5cbiAqIEBwYXJhbSB7Um9vbX0gcm9vbVxuICogQHBhcmFtIHthbnl9IGRhdGFcbiAqL1xuY29uc3QgcHVibGlzaFNpZ25hbGluZ01lc3NhZ2UgPSAoY29ubiwgcm9vbSwgZGF0YSkgPT4ge1xuICBpZiAocm9vbS5rZXkpIHtcbiAgICBjcnlwdG91dGlscy5lbmNyeXB0SnNvbihkYXRhLCByb29tLmtleSkudGhlbihkYXRhID0+IHtcbiAgICAgIGNvbm4uc2VuZCh7IHR5cGU6ICdwdWJsaXNoJywgdG9waWM6IHJvb20ubmFtZSwgZGF0YTogYnVmZmVyLnRvQmFzZTY0KGRhdGEpIH0pXG4gICAgfSlcbiAgfSBlbHNlIHtcbiAgICBjb25uLnNlbmQoeyB0eXBlOiAncHVibGlzaCcsIHRvcGljOiByb29tLm5hbWUsIGRhdGEgfSlcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2lnbmFsaW5nQ29ubiBleHRlbmRzIHdzLldlYnNvY2tldENsaWVudCB7XG4gIGNvbnN0cnVjdG9yICh1cmwpIHtcbiAgICBzdXBlcih1cmwpXG4gICAgLyoqXG4gICAgICogQHR5cGUge1NldDxXZWJydGNQcm92aWRlcj59XG4gICAgICovXG4gICAgdGhpcy5wcm92aWRlcnMgPSBuZXcgU2V0KClcbiAgICB0aGlzLm9uKCdjb25uZWN0JywgKCkgPT4ge1xuICAgICAgbG9nKGBjb25uZWN0ZWQgKCR7dXJsfSlgKVxuICAgICAgY29uc3QgdG9waWNzID0gQXJyYXkuZnJvbShyb29tcy5rZXlzKCkpXG4gICAgICB0aGlzLnNlbmQoeyB0eXBlOiAnc3Vic2NyaWJlJywgdG9waWNzIH0pXG4gICAgICByb29tcy5mb3JFYWNoKHJvb20gPT5cbiAgICAgICAgcHVibGlzaFNpZ25hbGluZ01lc3NhZ2UodGhpcywgcm9vbSwgeyB0eXBlOiAnYW5ub3VuY2UnLCBmcm9tOiByb29tLnBlZXJJZCB9KVxuICAgICAgKVxuICAgIH0pXG4gICAgdGhpcy5vbignbWVzc2FnZScsIG0gPT4ge1xuICAgICAgc3dpdGNoIChtLnR5cGUpIHtcbiAgICAgICAgY2FzZSAncHVibGlzaCc6IHtcbiAgICAgICAgICBjb25zdCByb29tTmFtZSA9IG0udG9waWNcbiAgICAgICAgICBjb25zdCByb29tID0gcm9vbXMuZ2V0KHJvb21OYW1lKVxuICAgICAgICAgIGlmIChyb29tID09IG51bGwgfHwgdHlwZW9mIHJvb21OYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGV4ZWNNZXNzYWdlID0gZGF0YSA9PiB7XG4gICAgICAgICAgICBjb25zdCB3ZWJydGNDb25ucyA9IHJvb20ud2VicnRjQ29ubnNcbiAgICAgICAgICAgIGNvbnN0IHBlZXJJZCA9IHJvb20ucGVlcklkXG4gICAgICAgICAgICBpZiAoZGF0YSA9PSBudWxsIHx8IGRhdGEuZnJvbSA9PT0gcGVlcklkIHx8IChkYXRhLnRvICE9PSB1bmRlZmluZWQgJiYgZGF0YS50byAhPT0gcGVlcklkKSB8fCByb29tLmJjQ29ubnMuaGFzKGRhdGEuZnJvbSkpIHtcbiAgICAgICAgICAgICAgLy8gaWdub3JlIG1lc3NhZ2VzIHRoYXQgYXJlIG5vdCBhZGRyZXNzZWQgdG8gdGhpcyBjb25uLCBvciBmcm9tIGNsaWVudHMgdGhhdCBhcmUgY29ubmVjdGVkIHZpYSBicm9hZGNhc3RjaGFubmVsXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZW1pdFBlZXJDaGFuZ2UgPSB3ZWJydGNDb25ucy5oYXMoZGF0YS5mcm9tKVxuICAgICAgICAgICAgICA/ICgpID0+IHt9XG4gICAgICAgICAgICAgIDogKCkgPT5cbiAgICAgICAgICAgICAgICByb29tLnByb3ZpZGVyLmVtaXQoJ3BlZXJzJywgW3tcbiAgICAgICAgICAgICAgICAgIHJlbW92ZWQ6IFtdLFxuICAgICAgICAgICAgICAgICAgYWRkZWQ6IFtkYXRhLmZyb21dLFxuICAgICAgICAgICAgICAgICAgd2VicnRjUGVlcnM6IEFycmF5LmZyb20ocm9vbS53ZWJydGNDb25ucy5rZXlzKCkpLFxuICAgICAgICAgICAgICAgICAgYmNQZWVyczogQXJyYXkuZnJvbShyb29tLmJjQ29ubnMpXG4gICAgICAgICAgICAgICAgfV0pXG4gICAgICAgICAgICBzd2l0Y2ggKGRhdGEudHlwZSkge1xuICAgICAgICAgICAgICBjYXNlICdhbm5vdW5jZSc6XG4gICAgICAgICAgICAgICAgaWYgKHdlYnJ0Y0Nvbm5zLnNpemUgPCByb29tLnByb3ZpZGVyLm1heENvbm5zKSB7XG4gICAgICAgICAgICAgICAgICBtYXAuc2V0SWZVbmRlZmluZWQod2VicnRjQ29ubnMsIGRhdGEuZnJvbSwgKCkgPT4gbmV3IFdlYnJ0Y0Nvbm4odGhpcywgdHJ1ZSwgZGF0YS5mcm9tLCByb29tKSlcbiAgICAgICAgICAgICAgICAgIGVtaXRQZWVyQ2hhbmdlKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnc2lnbmFsJzpcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5zaWduYWwudHlwZSA9PT0gJ29mZmVyJykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdDb25uID0gd2VicnRjQ29ubnMuZ2V0KGRhdGEuZnJvbSlcbiAgICAgICAgICAgICAgICAgIGlmIChleGlzdGluZ0Nvbm4pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3RlVG9rZW4gPSBkYXRhLnRva2VuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvY2FsVG9rZW4gPSBleGlzdGluZ0Nvbm4uZ2xhcmVUb2tlblxuICAgICAgICAgICAgICAgICAgICBpZiAobG9jYWxUb2tlbiAmJiBsb2NhbFRva2VuID4gcmVtb3RlVG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICBsb2coJ29mZmVyIHJlamVjdGVkOiAnLCBkYXRhLmZyb20pXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgZG9uJ3QgcmVqZWN0IHRoZSBvZmZlciwgd2Ugd2lsbCBiZSBhY2NlcHRpbmcgaXQgYW5kIGFuc3dlcmluZyBpdFxuICAgICAgICAgICAgICAgICAgICBleGlzdGluZ0Nvbm4uZ2xhcmVUb2tlbiA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5zaWduYWwudHlwZSA9PT0gJ2Fuc3dlcicpIHtcbiAgICAgICAgICAgICAgICAgIGxvZygnb2ZmZXIgYW5zd2VyZWQgYnk6ICcsIGRhdGEuZnJvbSlcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nQ29ubiA9IHdlYnJ0Y0Nvbm5zLmdldChkYXRhLmZyb20pXG4gICAgICAgICAgICAgICAgICBleGlzdGluZ0Nvbm4uZ2xhcmVUb2tlbiA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZGF0YS50byA9PT0gcGVlcklkKSB7XG4gICAgICAgICAgICAgICAgICBtYXAuc2V0SWZVbmRlZmluZWQod2VicnRjQ29ubnMsIGRhdGEuZnJvbSwgKCkgPT4gbmV3IFdlYnJ0Y0Nvbm4odGhpcywgZmFsc2UsIGRhdGEuZnJvbSwgcm9vbSkpLnBlZXIuc2lnbmFsKGRhdGEuc2lnbmFsKVxuICAgICAgICAgICAgICAgICAgZW1pdFBlZXJDaGFuZ2UoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocm9vbS5rZXkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbS5kYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICBjcnlwdG91dGlscy5kZWNyeXB0SnNvbihidWZmZXIuZnJvbUJhc2U2NChtLmRhdGEpLCByb29tLmtleSkudGhlbihleGVjTWVzc2FnZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhlY01lc3NhZ2UobS5kYXRhKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gICAgdGhpcy5vbignZGlzY29ubmVjdCcsICgpID0+IGxvZyhgZGlzY29ubmVjdCAoJHt1cmx9KWApKVxuICB9XG59XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gUHJvdmlkZXJPcHRpb25zXG4gKiBAcHJvcGVydHkge0FycmF5PHN0cmluZz59IFtzaWduYWxpbmddXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3Bhc3N3b3JkXVxuICogQHByb3BlcnR5IHthd2FyZW5lc3NQcm90b2NvbC5Bd2FyZW5lc3N9IFthd2FyZW5lc3NdXG4gKiBAcHJvcGVydHkge251bWJlcn0gW21heENvbm5zXVxuICogQHByb3BlcnR5IHtib29sZWFufSBbZmlsdGVyQmNDb25uc11cbiAqIEBwcm9wZXJ0eSB7YW55fSBbcGVlck9wdHNdXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge1dlYnJ0Y1Byb3ZpZGVyfSBwcm92aWRlclxuICovXG5jb25zdCBlbWl0U3RhdHVzID0gcHJvdmlkZXIgPT4ge1xuICBwcm92aWRlci5lbWl0KCdzdGF0dXMnLCBbe1xuICAgIGNvbm5lY3RlZDogcHJvdmlkZXIuY29ubmVjdGVkXG4gIH1dKVxufVxuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFdlYnJ0Y1Byb3ZpZGVyRXZlbnRzXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKHtjb25uZWN0ZWQ6Ym9vbGVhbn0pOnZvaWR9IFdlYnJ0Y1Byb3ZpZGVyRXZlbnQuc3RhdHVzXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKHtzeW5jZWQ6Ym9vbGVhbn0pOnZvaWR9IFdlYnJ0Y1Byb3ZpZGVyRXZlbnQuc3luY2VkXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9uKHthZGRlZDpBcnJheTxzdHJpbmc+LHJlbW92ZWQ6QXJyYXk8c3RyaW5nPix3ZWJydGNQZWVyczpBcnJheTxzdHJpbmc+LGJjUGVlcnM6QXJyYXk8c3RyaW5nPn0pOnZvaWR9IFdlYnJ0Y1Byb3ZpZGVyRXZlbnQucGVlcnNcbiAqL1xuXG4vKipcbiAqIEBleHRlbmRzIE9ic2VydmFibGVWMjxXZWJydGNQcm92aWRlckV2ZW50cz5cbiAqL1xuZXhwb3J0IGNsYXNzIFdlYnJ0Y1Byb3ZpZGVyIGV4dGVuZHMgT2JzZXJ2YWJsZVYyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb29tTmFtZVxuICAgKiBAcGFyYW0ge1kuRG9jfSBkb2NcbiAgICogQHBhcmFtIHtQcm92aWRlck9wdGlvbnM/fSBvcHRzXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoXG4gICAgcm9vbU5hbWUsXG4gICAgZG9jLFxuICAgIHtcbiAgICAgIHNpZ25hbGluZyA9IFsnd3NzOi8veS13ZWJydGMtZXUuZmx5LmRldiddLFxuICAgICAgcGFzc3dvcmQgPSBudWxsLFxuICAgICAgYXdhcmVuZXNzID0gbmV3IGF3YXJlbmVzc1Byb3RvY29sLkF3YXJlbmVzcyhkb2MpLFxuICAgICAgbWF4Q29ubnMgPSAyMCArIG1hdGguZmxvb3IocmFuZG9tLnJhbmQoKSAqIDE1KSwgLy8gdGhlIHJhbmRvbSBmYWN0b3IgcmVkdWNlcyB0aGUgY2hhbmNlIHRoYXQgbiBjbGllbnRzIGZvcm0gYSBjbHVzdGVyXG4gICAgICBmaWx0ZXJCY0Nvbm5zID0gdHJ1ZSxcbiAgICAgIHBlZXJPcHRzID0ge30gLy8gc2ltcGxlLXBlZXIgb3B0aW9ucy4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3Mvc2ltcGxlLXBlZXIjcGVlci0tbmV3LXBlZXJvcHRzXG4gICAgfSA9IHt9XG4gICkge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLnJvb21OYW1lID0gcm9vbU5hbWVcbiAgICB0aGlzLmRvYyA9IGRvY1xuICAgIHRoaXMuZmlsdGVyQmNDb25ucyA9IGZpbHRlckJjQ29ubnNcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7YXdhcmVuZXNzUHJvdG9jb2wuQXdhcmVuZXNzfVxuICAgICAqL1xuICAgIHRoaXMuYXdhcmVuZXNzID0gYXdhcmVuZXNzXG4gICAgdGhpcy5zaG91bGRDb25uZWN0ID0gZmFsc2VcbiAgICB0aGlzLnNpZ25hbGluZ1VybHMgPSBzaWduYWxpbmdcbiAgICB0aGlzLnNpZ25hbGluZ0Nvbm5zID0gW11cbiAgICB0aGlzLm1heENvbm5zID0gbWF4Q29ubnNcbiAgICB0aGlzLnBlZXJPcHRzID0gcGVlck9wdHNcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7UHJvbWlzZUxpa2U8Q3J5cHRvS2V5IHwgbnVsbD59XG4gICAgICovXG4gICAgdGhpcy5rZXkgPSBwYXNzd29yZCA/IGNyeXB0b3V0aWxzLmRlcml2ZUtleShwYXNzd29yZCwgcm9vbU5hbWUpIDogLyoqIEB0eXBlIHtQcm9taXNlTGlrZTxudWxsPn0gKi8gKHByb21pc2UucmVzb2x2ZShudWxsKSlcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7Um9vbXxudWxsfVxuICAgICAqL1xuICAgIHRoaXMucm9vbSA9IG51bGxcbiAgICB0aGlzLmtleS50aGVuKGtleSA9PiB7XG4gICAgICB0aGlzLnJvb20gPSBvcGVuUm9vbShkb2MsIHRoaXMsIHJvb21OYW1lLCBrZXkpXG4gICAgICBpZiAodGhpcy5zaG91bGRDb25uZWN0KSB7XG4gICAgICAgIHRoaXMucm9vbS5jb25uZWN0KClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucm9vbS5kaXNjb25uZWN0KClcbiAgICAgIH1cbiAgICAgIGVtaXRTdGF0dXModGhpcylcbiAgICB9KVxuICAgIHRoaXMuY29ubmVjdCgpXG4gICAgdGhpcy5kZXN0cm95ID0gdGhpcy5kZXN0cm95LmJpbmQodGhpcylcbiAgICBkb2Mub24oJ2Rlc3Ryb3knLCB0aGlzLmRlc3Ryb3kpXG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIHByb3ZpZGVyIGlzIGxvb2tpbmcgZm9yIG90aGVyIHBlZXJzLlxuICAgKlxuICAgKiBPdGhlciBwZWVycyBjYW4gYmUgZm91bmQgdmlhIHNpZ25hbGluZyBzZXJ2ZXJzIG9yIHZpYSBicm9hZGNhc3RjaGFubmVsIChjcm9zcyBicm93c2VyLXRhYlxuICAgKiBjb21tdW5pY2F0aW9uKS4gWW91IG5ldmVyIGtub3cgd2hlbiB5b3UgYXJlIGNvbm5lY3RlZCB0byBhbGwgcGVlcnMuIFlvdSBhbHNvIGRvbid0IGtub3cgaWZcbiAgICogdGhlcmUgYXJlIG90aGVyIHBlZXJzLiBjb25uZWN0ZWQgZG9lc24ndCBtZWFuIHRoYXQgeW91IGFyZSBjb25uZWN0ZWQgdG8gYW55IHBoeXNpY2FsIHBlZXJzXG4gICAqIHdvcmtpbmcgb24gdGhlIHNhbWUgcmVzb3VyY2UgYXMgeW91LiBJdCBkb2VzIG5vdCBjaGFuZ2UgdW5sZXNzIHlvdSBjYWxsIHByb3ZpZGVyLmRpc2Nvbm5lY3QoKVxuICAgKlxuICAgKiBgdGhpcy5vbignc3RhdHVzJywgKGV2ZW50KSA9PiB7IGNvbnNvbGUubG9nKGV2ZW50LmNvbm5lY3RlZCkgfSlgXG4gICAqXG4gICAqIEB0eXBlIHtib29sZWFufVxuICAgKi9cbiAgZ2V0IGNvbm5lY3RlZCAoKSB7XG4gICAgcmV0dXJuIHRoaXMucm9vbSAhPT0gbnVsbCAmJiB0aGlzLnNob3VsZENvbm5lY3RcbiAgfVxuXG4gIGNvbm5lY3QgKCkge1xuICAgIHRoaXMuc2hvdWxkQ29ubmVjdCA9IHRydWVcbiAgICB0aGlzLnNpZ25hbGluZ1VybHMuZm9yRWFjaCh1cmwgPT4ge1xuICAgICAgY29uc3Qgc2lnbmFsaW5nQ29ubiA9IG1hcC5zZXRJZlVuZGVmaW5lZChzaWduYWxpbmdDb25ucywgdXJsLCAoKSA9PiBuZXcgU2lnbmFsaW5nQ29ubih1cmwpKVxuICAgICAgdGhpcy5zaWduYWxpbmdDb25ucy5wdXNoKHNpZ25hbGluZ0Nvbm4pXG4gICAgICBzaWduYWxpbmdDb25uLnByb3ZpZGVycy5hZGQodGhpcylcbiAgICB9KVxuICAgIGlmICh0aGlzLnJvb20pIHtcbiAgICAgIHRoaXMucm9vbS5jb25uZWN0KClcbiAgICAgIGVtaXRTdGF0dXModGhpcylcbiAgICB9XG4gIH1cblxuICBkaXNjb25uZWN0ICgpIHtcbiAgICB0aGlzLnNob3VsZENvbm5lY3QgPSBmYWxzZVxuICAgIHRoaXMuc2lnbmFsaW5nQ29ubnMuZm9yRWFjaChjb25uID0+IHtcbiAgICAgIGNvbm4ucHJvdmlkZXJzLmRlbGV0ZSh0aGlzKVxuICAgICAgaWYgKGNvbm4ucHJvdmlkZXJzLnNpemUgPT09IDApIHtcbiAgICAgICAgY29ubi5kZXN0cm95KClcbiAgICAgICAgc2lnbmFsaW5nQ29ubnMuZGVsZXRlKGNvbm4udXJsKVxuICAgICAgfVxuICAgIH0pXG4gICAgaWYgKHRoaXMucm9vbSkge1xuICAgICAgdGhpcy5yb29tLmRpc2Nvbm5lY3QoKVxuICAgICAgZW1pdFN0YXR1cyh0aGlzKVxuICAgIH1cbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuZG9jLm9mZignZGVzdHJveScsIHRoaXMuZGVzdHJveSlcbiAgICAvLyBuZWVkIHRvIHdhaXQgZm9yIGtleSBiZWZvcmUgZGVsZXRpbmcgcm9vbVxuICAgIHRoaXMua2V5LnRoZW4oKCkgPT4ge1xuICAgICAgLyoqIEB0eXBlIHtSb29tfSAqLyAodGhpcy5yb29tKS5kZXN0cm95KClcbiAgICAgIHJvb21zLmRlbGV0ZSh0aGlzLnJvb21OYW1lKVxuICAgIH0pXG4gICAgc3VwZXIuZGVzdHJveSgpXG4gIH1cbn1cbiIsICIvKipcbiAqIEBtb2R1bGUgc3luYy1wcm90b2NvbFxuICovXG5cbmltcG9ydCAqIGFzIGVuY29kaW5nIGZyb20gJ2xpYjAvZW5jb2RpbmcnXG5pbXBvcnQgKiBhcyBkZWNvZGluZyBmcm9tICdsaWIwL2RlY29kaW5nJ1xuaW1wb3J0ICogYXMgWSBmcm9tICd5anMnXG5cbi8qKlxuICogQHR5cGVkZWYge01hcDxudW1iZXIsIG51bWJlcj59IFN0YXRlTWFwXG4gKi9cblxuLyoqXG4gKiBDb3JlIFlqcyBkZWZpbmVzIHR3byBtZXNzYWdlIHR5cGVzOlxuICogXHUyMDIyIFlqc1N5bmNTdGVwMTogSW5jbHVkZXMgdGhlIFN0YXRlIFNldCBvZiB0aGUgc2VuZGluZyBjbGllbnQuIFdoZW4gcmVjZWl2ZWQsIHRoZSBjbGllbnQgc2hvdWxkIHJlcGx5IHdpdGggWWpzU3luY1N0ZXAyLlxuICogXHUyMDIyIFlqc1N5bmNTdGVwMjogSW5jbHVkZXMgYWxsIG1pc3Npbmcgc3RydWN0cyBhbmQgdGhlIGNvbXBsZXRlIGRlbGV0ZSBzZXQuIFdoZW4gcmVjZWl2ZWQsIHRoZSBjbGllbnQgaXMgYXNzdXJlZCB0aGF0IGl0XG4gKiAgIHJlY2VpdmVkIGFsbCBpbmZvcm1hdGlvbiBmcm9tIHRoZSByZW1vdGUgY2xpZW50LlxuICpcbiAqIEluIGEgcGVlci10by1wZWVyIG5ldHdvcmssIHlvdSBtYXkgd2FudCB0byBpbnRyb2R1Y2UgYSBTeW5jRG9uZSBtZXNzYWdlIHR5cGUuIEJvdGggcGFydGllcyBzaG91bGQgaW5pdGlhdGUgdGhlIGNvbm5lY3Rpb25cbiAqIHdpdGggU3luY1N0ZXAxLiBXaGVuIGEgY2xpZW50IHJlY2VpdmVkIFN5bmNTdGVwMiwgaXQgc2hvdWxkIHJlcGx5IHdpdGggU3luY0RvbmUuIFdoZW4gdGhlIGxvY2FsIGNsaWVudCByZWNlaXZlZCBib3RoXG4gKiBTeW5jU3RlcDIgYW5kIFN5bmNEb25lLCBpdCBpcyBhc3N1cmVkIHRoYXQgaXQgaXMgc3luY2VkIHRvIHRoZSByZW1vdGUgY2xpZW50LlxuICpcbiAqIEluIGEgY2xpZW50LXNlcnZlciBtb2RlbCwgeW91IHdhbnQgdG8gaGFuZGxlIHRoaXMgZGlmZmVyZW50bHk6IFRoZSBjbGllbnQgc2hvdWxkIGluaXRpYXRlIHRoZSBjb25uZWN0aW9uIHdpdGggU3luY1N0ZXAxLlxuICogV2hlbiB0aGUgc2VydmVyIHJlY2VpdmVzIFN5bmNTdGVwMSwgaXQgc2hvdWxkIHJlcGx5IHdpdGggU3luY1N0ZXAyIGltbWVkaWF0ZWx5IGZvbGxvd2VkIGJ5IFN5bmNTdGVwMS4gVGhlIGNsaWVudCByZXBsaWVzXG4gKiB3aXRoIFN5bmNTdGVwMiB3aGVuIGl0IHJlY2VpdmVzIFN5bmNTdGVwMS4gT3B0aW9uYWxseSB0aGUgc2VydmVyIG1heSBzZW5kIGEgU3luY0RvbmUgYWZ0ZXIgaXQgcmVjZWl2ZWQgU3luY1N0ZXAyLCBzbyB0aGVcbiAqIGNsaWVudCBrbm93cyB0aGF0IHRoZSBzeW5jIGlzIGZpbmlzaGVkLiAgVGhlcmUgYXJlIHR3byByZWFzb25zIGZvciB0aGlzIG1vcmUgZWxhYm9yYXRlZCBzeW5jIG1vZGVsOiAxLiBUaGlzIHByb3RvY29sIGNhblxuICogZWFzaWx5IGJlIGltcGxlbWVudGVkIG9uIHRvcCBvZiBodHRwIGFuZCB3ZWJzb2NrZXRzLiAyLiBUaGUgc2VydmVyIHNob3VsZCBvbmx5IHJlcGx5IHRvIHJlcXVlc3RzLCBhbmQgbm90IGluaXRpYXRlIHRoZW0uXG4gKiBUaGVyZWZvcmUgaXQgaXMgbmVjZXNzYXJ5IHRoYXQgdGhlIGNsaWVudCBpbml0aWF0ZXMgdGhlIHN5bmMuXG4gKlxuICogQ29uc3RydWN0aW9uIG9mIGEgbWVzc2FnZTpcbiAqIFttZXNzYWdlVHlwZSA6IHZhclVpbnQsIG1lc3NhZ2UgZGVmaW5pdGlvbi4uXVxuICpcbiAqIE5vdGU6IEEgbWVzc2FnZSBkb2VzIG5vdCBpbmNsdWRlIGluZm9ybWF0aW9uIGFib3V0IHRoZSByb29tIG5hbWUuIFRoaXMgbXVzdCB0byBiZSBoYW5kbGVkIGJ5IHRoZSB1cHBlciBsYXllciBwcm90b2NvbCFcbiAqXG4gKiBzdHJpbmdpZnlbbWVzc2FnZVR5cGVdIHN0cmluZ2lmaWVzIGEgbWVzc2FnZSBkZWZpbml0aW9uIChtZXNzYWdlVHlwZSBpcyBhbHJlYWR5IHJlYWQgZnJvbSB0aGUgYnVmZmZlcilcbiAqL1xuXG5leHBvcnQgY29uc3QgbWVzc2FnZVlqc1N5bmNTdGVwMSA9IDBcbmV4cG9ydCBjb25zdCBtZXNzYWdlWWpzU3luY1N0ZXAyID0gMVxuZXhwb3J0IGNvbnN0IG1lc3NhZ2VZanNVcGRhdGUgPSAyXG5cbi8qKlxuICogQ3JlYXRlIGEgc3luYyBzdGVwIDEgbWVzc2FnZSBiYXNlZCBvbiB0aGUgc3RhdGUgb2YgdGhlIGN1cnJlbnQgc2hhcmVkIGRvY3VtZW50LlxuICpcbiAqIEBwYXJhbSB7ZW5jb2RpbmcuRW5jb2Rlcn0gZW5jb2RlclxuICogQHBhcmFtIHtZLkRvY30gZG9jXG4gKi9cbmV4cG9ydCBjb25zdCB3cml0ZVN5bmNTdGVwMSA9IChlbmNvZGVyLCBkb2MpID0+IHtcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIG1lc3NhZ2VZanNTeW5jU3RlcDEpXG4gIGNvbnN0IHN2ID0gWS5lbmNvZGVTdGF0ZVZlY3Rvcihkb2MpXG4gIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNvZGVyLCBzdilcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2VuY29kaW5nLkVuY29kZXJ9IGVuY29kZXJcbiAqIEBwYXJhbSB7WS5Eb2N9IGRvY1xuICogQHBhcmFtIHtVaW50OEFycmF5fSBbZW5jb2RlZFN0YXRlVmVjdG9yXVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVTeW5jU3RlcDIgPSAoZW5jb2RlciwgZG9jLCBlbmNvZGVkU3RhdGVWZWN0b3IpID0+IHtcbiAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIG1lc3NhZ2VZanNTeW5jU3RlcDIpXG4gIGVuY29kaW5nLndyaXRlVmFyVWludDhBcnJheShlbmNvZGVyLCBZLmVuY29kZVN0YXRlQXNVcGRhdGUoZG9jLCBlbmNvZGVkU3RhdGVWZWN0b3IpKVxufVxuXG4vKipcbiAqIFJlYWQgU3luY1N0ZXAxIG1lc3NhZ2UgYW5kIHJlcGx5IHdpdGggU3luY1N0ZXAyLlxuICpcbiAqIEBwYXJhbSB7ZGVjb2RpbmcuRGVjb2Rlcn0gZGVjb2RlciBUaGUgcmVwbHkgdG8gdGhlIHJlY2VpdmVkIG1lc3NhZ2VcbiAqIEBwYXJhbSB7ZW5jb2RpbmcuRW5jb2Rlcn0gZW5jb2RlciBUaGUgcmVjZWl2ZWQgbWVzc2FnZVxuICogQHBhcmFtIHtZLkRvY30gZG9jXG4gKi9cbmV4cG9ydCBjb25zdCByZWFkU3luY1N0ZXAxID0gKGRlY29kZXIsIGVuY29kZXIsIGRvYykgPT5cbiAgd3JpdGVTeW5jU3RlcDIoZW5jb2RlciwgZG9jLCBkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheShkZWNvZGVyKSlcblxuLyoqXG4gKiBSZWFkIGFuZCBhcHBseSBTdHJ1Y3RzIGFuZCB0aGVuIERlbGV0ZVN0b3JlIHRvIGEgeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge2RlY29kaW5nLkRlY29kZXJ9IGRlY29kZXJcbiAqIEBwYXJhbSB7WS5Eb2N9IGRvY1xuICogQHBhcmFtIHthbnl9IHRyYW5zYWN0aW9uT3JpZ2luXG4gKiBAcGFyYW0geyhlcnJvcjpFcnJvcik9PmFueX0gW2Vycm9ySGFuZGxlcl1cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRTeW5jU3RlcDIgPSAoZGVjb2RlciwgZG9jLCB0cmFuc2FjdGlvbk9yaWdpbiwgZXJyb3JIYW5kbGVyKSA9PiB7XG4gIHRyeSB7XG4gICAgWS5hcHBseVVwZGF0ZShkb2MsIGRlY29kaW5nLnJlYWRWYXJVaW50OEFycmF5KGRlY29kZXIpLCB0cmFuc2FjdGlvbk9yaWdpbilcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3JIYW5kbGVyICE9IG51bGwpIGVycm9ySGFuZGxlcigvKiogQHR5cGUge0Vycm9yfSAqLyAoZXJyb3IpKVxuICAgIC8vIFRoaXMgY2F0Y2hlcyBlcnJvcnMgdGhhdCBhcmUgdGhyb3duIGJ5IGV2ZW50IGhhbmRsZXJzXG4gICAgY29uc29sZS5lcnJvcignQ2F1Z2h0IGVycm9yIHdoaWxlIGhhbmRsaW5nIGEgWWpzIHVwZGF0ZScsIGVycm9yKVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtlbmNvZGluZy5FbmNvZGVyfSBlbmNvZGVyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVwZGF0ZVxuICovXG5leHBvcnQgY29uc3Qgd3JpdGVVcGRhdGUgPSAoZW5jb2RlciwgdXBkYXRlKSA9PiB7XG4gIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCBtZXNzYWdlWWpzVXBkYXRlKVxuICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkoZW5jb2RlciwgdXBkYXRlKVxufVxuXG4vKipcbiAqIFJlYWQgYW5kIGFwcGx5IFN0cnVjdHMgYW5kIHRoZW4gRGVsZXRlU3RvcmUgdG8gYSB5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7ZGVjb2RpbmcuRGVjb2Rlcn0gZGVjb2RlclxuICogQHBhcmFtIHtZLkRvY30gZG9jXG4gKiBAcGFyYW0ge2FueX0gdHJhbnNhY3Rpb25PcmlnaW5cbiAqIEBwYXJhbSB7KGVycm9yOkVycm9yKT0+YW55fSBbZXJyb3JIYW5kbGVyXVxuICovXG5leHBvcnQgY29uc3QgcmVhZFVwZGF0ZSA9IHJlYWRTeW5jU3RlcDJcblxuLyoqXG4gKiBAcGFyYW0ge2RlY29kaW5nLkRlY29kZXJ9IGRlY29kZXIgQSBtZXNzYWdlIHJlY2VpdmVkIGZyb20gYW5vdGhlciBjbGllbnRcbiAqIEBwYXJhbSB7ZW5jb2RpbmcuRW5jb2Rlcn0gZW5jb2RlciBUaGUgcmVwbHkgbWVzc2FnZS4gRG9lcyBub3QgbmVlZCB0byBiZSBzZW50IGlmIGVtcHR5LlxuICogQHBhcmFtIHtZLkRvY30gZG9jXG4gKiBAcGFyYW0ge2FueX0gdHJhbnNhY3Rpb25PcmlnaW5cbiAqIEBwYXJhbSB7KGVycm9yOkVycm9yKT0+YW55fSBbZXJyb3JIYW5kbGVyXSBPcHRpb25hbCBlcnJvciBoYW5kbGVyIHRoYXQgY2F0Y2hlcyBlcnJvcnMgd2hlbiByZWFkaW5nIFlqcyBtZXNzYWdlcy5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlYWRTeW5jTWVzc2FnZSA9IChkZWNvZGVyLCBlbmNvZGVyLCBkb2MsIHRyYW5zYWN0aW9uT3JpZ2luLCBlcnJvckhhbmRsZXIpID0+IHtcbiAgY29uc3QgbWVzc2FnZVR5cGUgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyKVxuICBzd2l0Y2ggKG1lc3NhZ2VUeXBlKSB7XG4gICAgY2FzZSBtZXNzYWdlWWpzU3luY1N0ZXAxOlxuICAgICAgcmVhZFN5bmNTdGVwMShkZWNvZGVyLCBlbmNvZGVyLCBkb2MpXG4gICAgICBicmVha1xuICAgIGNhc2UgbWVzc2FnZVlqc1N5bmNTdGVwMjpcbiAgICAgIHJlYWRTeW5jU3RlcDIoZGVjb2RlciwgZG9jLCB0cmFuc2FjdGlvbk9yaWdpbiwgZXJyb3JIYW5kbGVyKVxuICAgICAgYnJlYWtcbiAgICBjYXNlIG1lc3NhZ2VZanNVcGRhdGU6XG4gICAgICByZWFkVXBkYXRlKGRlY29kZXIsIGRvYywgdHJhbnNhY3Rpb25PcmlnaW4sIGVycm9ySGFuZGxlcilcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBtZXNzYWdlIHR5cGUnKVxuICB9XG4gIHJldHVybiBtZXNzYWdlVHlwZVxufVxuIiwgIi8qKlxuICogQG1vZHVsZSBhd2FyZW5lc3MtcHJvdG9jb2xcbiAqL1xuXG5pbXBvcnQgKiBhcyBlbmNvZGluZyBmcm9tICdsaWIwL2VuY29kaW5nJ1xuaW1wb3J0ICogYXMgZGVjb2RpbmcgZnJvbSAnbGliMC9kZWNvZGluZydcbmltcG9ydCAqIGFzIHRpbWUgZnJvbSAnbGliMC90aW1lJ1xuaW1wb3J0ICogYXMgbWF0aCBmcm9tICdsaWIwL21hdGgnXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAnbGliMC9vYnNlcnZhYmxlJ1xuaW1wb3J0ICogYXMgZiBmcm9tICdsaWIwL2Z1bmN0aW9uJ1xuaW1wb3J0ICogYXMgWSBmcm9tICd5anMnIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblxuZXhwb3J0IGNvbnN0IG91dGRhdGVkVGltZW91dCA9IDMwMDAwXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gTWV0YUNsaWVudFN0YXRlXG4gKiBAcHJvcGVydHkge251bWJlcn0gTWV0YUNsaWVudFN0YXRlLmNsb2NrXG4gKiBAcHJvcGVydHkge251bWJlcn0gTWV0YUNsaWVudFN0YXRlLmxhc3RVcGRhdGVkIHVuaXggdGltZXN0YW1wXG4gKi9cblxuLyoqXG4gKiBUaGUgQXdhcmVuZXNzIGNsYXNzIGltcGxlbWVudHMgYSBzaW1wbGUgc2hhcmVkIHN0YXRlIHByb3RvY29sIHRoYXQgY2FuIGJlIHVzZWQgZm9yIG5vbi1wZXJzaXN0ZW50IGRhdGEgbGlrZSBhd2FyZW5lc3MgaW5mb3JtYXRpb25cbiAqIChjdXJzb3IsIHVzZXJuYW1lLCBzdGF0dXMsIC4uKS4gRWFjaCBjbGllbnQgY2FuIHVwZGF0ZSBpdHMgb3duIGxvY2FsIHN0YXRlIGFuZCBsaXN0ZW4gdG8gc3RhdGUgY2hhbmdlcyBvZlxuICogcmVtb3RlIGNsaWVudHMuIEV2ZXJ5IGNsaWVudCBtYXkgc2V0IGEgc3RhdGUgb2YgYSByZW1vdGUgcGVlciB0byBgbnVsbGAgdG8gbWFyayB0aGUgY2xpZW50IGFzIG9mZmxpbmUuXG4gKlxuICogRWFjaCBjbGllbnQgaXMgaWRlbnRpZmllZCBieSBhIHVuaXF1ZSBjbGllbnQgaWQgKHNvbWV0aGluZyB3ZSBib3Jyb3cgZnJvbSBgZG9jLmNsaWVudElEYCkuIEEgY2xpZW50IGNhbiBvdmVycmlkZVxuICogaXRzIG93biBzdGF0ZSBieSBwcm9wYWdhdGluZyBhIG1lc3NhZ2Ugd2l0aCBhbiBpbmNyZWFzaW5nIHRpbWVzdGFtcCAoYGNsb2NrYCkuIElmIHN1Y2ggYSBtZXNzYWdlIGlzIHJlY2VpdmVkLCBpdCBpc1xuICogYXBwbGllZCBpZiB0aGUga25vd24gc3RhdGUgb2YgdGhhdCBjbGllbnQgaXMgb2xkZXIgdGhhbiB0aGUgbmV3IHN0YXRlIChgY2xvY2sgPCBuZXdDbG9ja2ApLiBJZiBhIGNsaWVudCB0aGlua3MgdGhhdFxuICogYSByZW1vdGUgY2xpZW50IGlzIG9mZmxpbmUsIGl0IG1heSBwcm9wYWdhdGUgYSBtZXNzYWdlIHdpdGhcbiAqIGB7IGNsb2NrOiBjdXJyZW50Q2xpZW50Q2xvY2ssIHN0YXRlOiBudWxsLCBjbGllbnQ6IHJlbW90ZUNsaWVudCB9YC4gSWYgc3VjaCBhXG4gKiBtZXNzYWdlIGlzIHJlY2VpdmVkLCBhbmQgdGhlIGtub3duIGNsb2NrIG9mIHRoYXQgY2xpZW50IGVxdWFscyB0aGUgcmVjZWl2ZWQgY2xvY2ssIGl0IHdpbGwgb3ZlcnJpZGUgdGhlIHN0YXRlIHdpdGggYG51bGxgLlxuICpcbiAqIEJlZm9yZSBhIGNsaWVudCBkaXNjb25uZWN0cywgaXQgc2hvdWxkIHByb3BhZ2F0ZSBhIGBudWxsYCBzdGF0ZSB3aXRoIGFuIHVwZGF0ZWQgY2xvY2suXG4gKlxuICogQXdhcmVuZXNzIHN0YXRlcyBtdXN0IGJlIHVwZGF0ZWQgZXZlcnkgMzAgc2Vjb25kcy4gT3RoZXJ3aXNlIHRoZSBBd2FyZW5lc3MgaW5zdGFuY2Ugd2lsbCBkZWxldGUgdGhlIGNsaWVudCBzdGF0ZS5cbiAqXG4gKiBAZXh0ZW5kcyB7T2JzZXJ2YWJsZTxzdHJpbmc+fVxuICovXG5leHBvcnQgY2xhc3MgQXdhcmVuZXNzIGV4dGVuZHMgT2JzZXJ2YWJsZSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge1kuRG9jfSBkb2NcbiAgICovXG4gIGNvbnN0cnVjdG9yIChkb2MpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5kb2MgPSBkb2NcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMuY2xpZW50SUQgPSBkb2MuY2xpZW50SURcbiAgICAvKipcbiAgICAgKiBNYXBzIGZyb20gY2xpZW50IGlkIHRvIGNsaWVudCBzdGF0ZVxuICAgICAqIEB0eXBlIHtNYXA8bnVtYmVyLCBPYmplY3Q8c3RyaW5nLCBhbnk+Pn1cbiAgICAgKi9cbiAgICB0aGlzLnN0YXRlcyA9IG5ldyBNYXAoKVxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtNYXA8bnVtYmVyLCBNZXRhQ2xpZW50U3RhdGU+fVxuICAgICAqL1xuICAgIHRoaXMubWV0YSA9IG5ldyBNYXAoKVxuICAgIHRoaXMuX2NoZWNrSW50ZXJ2YWwgPSAvKiogQHR5cGUge2FueX0gKi8gKHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGNvbnN0IG5vdyA9IHRpbWUuZ2V0VW5peFRpbWUoKVxuICAgICAgaWYgKHRoaXMuZ2V0TG9jYWxTdGF0ZSgpICE9PSBudWxsICYmIChvdXRkYXRlZFRpbWVvdXQgLyAyIDw9IG5vdyAtIC8qKiBAdHlwZSB7e2xhc3RVcGRhdGVkOm51bWJlcn19ICovICh0aGlzLm1ldGEuZ2V0KHRoaXMuY2xpZW50SUQpKS5sYXN0VXBkYXRlZCkpIHtcbiAgICAgICAgLy8gcmVuZXcgbG9jYWwgY2xvY2tcbiAgICAgICAgdGhpcy5zZXRMb2NhbFN0YXRlKHRoaXMuZ2V0TG9jYWxTdGF0ZSgpKVxuICAgICAgfVxuICAgICAgLyoqXG4gICAgICAgKiBAdHlwZSB7QXJyYXk8bnVtYmVyPn1cbiAgICAgICAqL1xuICAgICAgY29uc3QgcmVtb3ZlID0gW11cbiAgICAgIHRoaXMubWV0YS5mb3JFYWNoKChtZXRhLCBjbGllbnRpZCkgPT4ge1xuICAgICAgICBpZiAoY2xpZW50aWQgIT09IHRoaXMuY2xpZW50SUQgJiYgb3V0ZGF0ZWRUaW1lb3V0IDw9IG5vdyAtIG1ldGEubGFzdFVwZGF0ZWQgJiYgdGhpcy5zdGF0ZXMuaGFzKGNsaWVudGlkKSkge1xuICAgICAgICAgIHJlbW92ZS5wdXNoKGNsaWVudGlkKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgaWYgKHJlbW92ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJlbW92ZUF3YXJlbmVzc1N0YXRlcyh0aGlzLCByZW1vdmUsICd0aW1lb3V0JylcbiAgICAgIH1cbiAgICB9LCBtYXRoLmZsb29yKG91dGRhdGVkVGltZW91dCAvIDEwKSkpXG4gICAgZG9jLm9uKCdkZXN0cm95JywgKCkgPT4ge1xuICAgICAgdGhpcy5kZXN0cm95KClcbiAgICB9KVxuICAgIHRoaXMuc2V0TG9jYWxTdGF0ZSh7fSlcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuZW1pdCgnZGVzdHJveScsIFt0aGlzXSlcbiAgICB0aGlzLnNldExvY2FsU3RhdGUobnVsbClcbiAgICBzdXBlci5kZXN0cm95KClcbiAgICBjbGVhckludGVydmFsKHRoaXMuX2NoZWNrSW50ZXJ2YWwpXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7T2JqZWN0PHN0cmluZyxhbnk+fG51bGx9XG4gICAqL1xuICBnZXRMb2NhbFN0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZXMuZ2V0KHRoaXMuY2xpZW50SUQpIHx8IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsYW55PnxudWxsfSBzdGF0ZVxuICAgKi9cbiAgc2V0TG9jYWxTdGF0ZSAoc3RhdGUpIHtcbiAgICBjb25zdCBjbGllbnRJRCA9IHRoaXMuY2xpZW50SURcbiAgICBjb25zdCBjdXJyTG9jYWxNZXRhID0gdGhpcy5tZXRhLmdldChjbGllbnRJRClcbiAgICBjb25zdCBjbG9jayA9IGN1cnJMb2NhbE1ldGEgPT09IHVuZGVmaW5lZCA/IDAgOiBjdXJyTG9jYWxNZXRhLmNsb2NrICsgMVxuICAgIGNvbnN0IHByZXZTdGF0ZSA9IHRoaXMuc3RhdGVzLmdldChjbGllbnRJRClcbiAgICBpZiAoc3RhdGUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuc3RhdGVzLmRlbGV0ZShjbGllbnRJRClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZXMuc2V0KGNsaWVudElELCBzdGF0ZSlcbiAgICB9XG4gICAgdGhpcy5tZXRhLnNldChjbGllbnRJRCwge1xuICAgICAgY2xvY2ssXG4gICAgICBsYXN0VXBkYXRlZDogdGltZS5nZXRVbml4VGltZSgpXG4gICAgfSlcbiAgICBjb25zdCBhZGRlZCA9IFtdXG4gICAgY29uc3QgdXBkYXRlZCA9IFtdXG4gICAgY29uc3QgZmlsdGVyZWRVcGRhdGVkID0gW11cbiAgICBjb25zdCByZW1vdmVkID0gW11cbiAgICBpZiAoc3RhdGUgPT09IG51bGwpIHtcbiAgICAgIHJlbW92ZWQucHVzaChjbGllbnRJRClcbiAgICB9IGVsc2UgaWYgKHByZXZTdGF0ZSA9PSBudWxsKSB7XG4gICAgICBpZiAoc3RhdGUgIT0gbnVsbCkge1xuICAgICAgICBhZGRlZC5wdXNoKGNsaWVudElEKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVkLnB1c2goY2xpZW50SUQpXG4gICAgICBpZiAoIWYuZXF1YWxpdHlEZWVwKHByZXZTdGF0ZSwgc3RhdGUpKSB7XG4gICAgICAgIGZpbHRlcmVkVXBkYXRlZC5wdXNoKGNsaWVudElEKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYWRkZWQubGVuZ3RoID4gMCB8fCBmaWx0ZXJlZFVwZGF0ZWQubGVuZ3RoID4gMCB8fCByZW1vdmVkLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuZW1pdCgnY2hhbmdlJywgW3sgYWRkZWQsIHVwZGF0ZWQ6IGZpbHRlcmVkVXBkYXRlZCwgcmVtb3ZlZCB9LCAnbG9jYWwnXSlcbiAgICB9XG4gICAgdGhpcy5lbWl0KCd1cGRhdGUnLCBbeyBhZGRlZCwgdXBkYXRlZCwgcmVtb3ZlZCB9LCAnbG9jYWwnXSlcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGRcbiAgICogQHBhcmFtIHthbnl9IHZhbHVlXG4gICAqL1xuICBzZXRMb2NhbFN0YXRlRmllbGQgKGZpZWxkLCB2YWx1ZSkge1xuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5nZXRMb2NhbFN0YXRlKClcbiAgICBpZiAoc3RhdGUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuc2V0TG9jYWxTdGF0ZSh7XG4gICAgICAgIC4uLnN0YXRlLFxuICAgICAgICBbZmllbGRdOiB2YWx1ZVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7TWFwPG51bWJlcixPYmplY3Q8c3RyaW5nLGFueT4+fVxuICAgKi9cbiAgZ2V0U3RhdGVzICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZXNcbiAgfVxufVxuXG4vKipcbiAqIE1hcmsgKHJlbW90ZSkgY2xpZW50cyBhcyBpbmFjdGl2ZSBhbmQgcmVtb3ZlIHRoZW0gZnJvbSB0aGUgbGlzdCBvZiBhY3RpdmUgcGVlcnMuXG4gKiBUaGlzIGNoYW5nZSB3aWxsIGJlIHByb3BhZ2F0ZWQgdG8gcmVtb3RlIGNsaWVudHMuXG4gKlxuICogQHBhcmFtIHtBd2FyZW5lc3N9IGF3YXJlbmVzc1xuICogQHBhcmFtIHtBcnJheTxudW1iZXI+fSBjbGllbnRzXG4gKiBAcGFyYW0ge2FueX0gb3JpZ2luXG4gKi9cbmV4cG9ydCBjb25zdCByZW1vdmVBd2FyZW5lc3NTdGF0ZXMgPSAoYXdhcmVuZXNzLCBjbGllbnRzLCBvcmlnaW4pID0+IHtcbiAgY29uc3QgcmVtb3ZlZCA9IFtdXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2xpZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNsaWVudElEID0gY2xpZW50c1tpXVxuICAgIGlmIChhd2FyZW5lc3Muc3RhdGVzLmhhcyhjbGllbnRJRCkpIHtcbiAgICAgIGF3YXJlbmVzcy5zdGF0ZXMuZGVsZXRlKGNsaWVudElEKVxuICAgICAgaWYgKGNsaWVudElEID09PSBhd2FyZW5lc3MuY2xpZW50SUQpIHtcbiAgICAgICAgY29uc3QgY3VyTWV0YSA9IC8qKiBAdHlwZSB7TWV0YUNsaWVudFN0YXRlfSAqLyAoYXdhcmVuZXNzLm1ldGEuZ2V0KGNsaWVudElEKSlcbiAgICAgICAgYXdhcmVuZXNzLm1ldGEuc2V0KGNsaWVudElELCB7XG4gICAgICAgICAgY2xvY2s6IGN1ck1ldGEuY2xvY2sgKyAxLFxuICAgICAgICAgIGxhc3RVcGRhdGVkOiB0aW1lLmdldFVuaXhUaW1lKClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIHJlbW92ZWQucHVzaChjbGllbnRJRClcbiAgICB9XG4gIH1cbiAgaWYgKHJlbW92ZWQubGVuZ3RoID4gMCkge1xuICAgIGF3YXJlbmVzcy5lbWl0KCdjaGFuZ2UnLCBbeyBhZGRlZDogW10sIHVwZGF0ZWQ6IFtdLCByZW1vdmVkIH0sIG9yaWdpbl0pXG4gICAgYXdhcmVuZXNzLmVtaXQoJ3VwZGF0ZScsIFt7IGFkZGVkOiBbXSwgdXBkYXRlZDogW10sIHJlbW92ZWQgfSwgb3JpZ2luXSlcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXdhcmVuZXNzfSBhd2FyZW5lc3NcbiAqIEBwYXJhbSB7QXJyYXk8bnVtYmVyPn0gY2xpZW50c1xuICogQHJldHVybiB7VWludDhBcnJheX1cbiAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZUF3YXJlbmVzc1VwZGF0ZSA9IChhd2FyZW5lc3MsIGNsaWVudHMsIHN0YXRlcyA9IGF3YXJlbmVzcy5zdGF0ZXMpID0+IHtcbiAgY29uc3QgbGVuID0gY2xpZW50cy5sZW5ndGhcbiAgY29uc3QgZW5jb2RlciA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICBlbmNvZGluZy53cml0ZVZhclVpbnQoZW5jb2RlciwgbGVuKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgY29uc3QgY2xpZW50SUQgPSBjbGllbnRzW2ldXG4gICAgY29uc3Qgc3RhdGUgPSBzdGF0ZXMuZ2V0KGNsaWVudElEKSB8fCBudWxsXG4gICAgY29uc3QgY2xvY2sgPSAvKiogQHR5cGUge01ldGFDbGllbnRTdGF0ZX0gKi8gKGF3YXJlbmVzcy5tZXRhLmdldChjbGllbnRJRCkpLmNsb2NrXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIGNsaWVudElEKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCBjbG9jaylcbiAgICBlbmNvZGluZy53cml0ZVZhclN0cmluZyhlbmNvZGVyLCBKU09OLnN0cmluZ2lmeShzdGF0ZSkpXG4gIH1cbiAgcmV0dXJuIGVuY29kaW5nLnRvVWludDhBcnJheShlbmNvZGVyKVxufVxuXG4vKipcbiAqIE1vZGlmeSB0aGUgY29udGVudCBvZiBhbiBhd2FyZW5lc3MgdXBkYXRlIGJlZm9yZSByZS1lbmNvZGluZyBpdCB0byBhbiBhd2FyZW5lc3MgdXBkYXRlLlxuICpcbiAqIFRoaXMgbWlnaHQgYmUgdXNlZnVsIHdoZW4geW91IGhhdmUgYSBjZW50cmFsIHNlcnZlciB0aGF0IHdhbnRzIHRvIGVuc3VyZSB0aGF0IGNsaWVudHNcbiAqIGNhbnQgaGlqYWNrIHNvbWVib2R5IGVsc2VzIGlkZW50aXR5LlxuICpcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gdXBkYXRlXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKGFueSk6YW55fSBtb2RpZnlcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9XG4gKi9cbmV4cG9ydCBjb25zdCBtb2RpZnlBd2FyZW5lc3NVcGRhdGUgPSAodXBkYXRlLCBtb2RpZnkpID0+IHtcbiAgY29uc3QgZGVjb2RlciA9IGRlY29kaW5nLmNyZWF0ZURlY29kZXIodXBkYXRlKVxuICBjb25zdCBlbmNvZGVyID0gZW5jb2RpbmcuY3JlYXRlRW5jb2RlcigpXG4gIGNvbnN0IGxlbiA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIpXG4gIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCBsZW4pXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBjb25zdCBjbGllbnRJRCA9IGRlY29kaW5nLnJlYWRWYXJVaW50KGRlY29kZXIpXG4gICAgY29uc3QgY2xvY2sgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyKVxuICAgIGNvbnN0IHN0YXRlID0gSlNPTi5wYXJzZShkZWNvZGluZy5yZWFkVmFyU3RyaW5nKGRlY29kZXIpKVxuICAgIGNvbnN0IG1vZGlmaWVkU3RhdGUgPSBtb2RpZnkoc3RhdGUpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50KGVuY29kZXIsIGNsaWVudElEKVxuICAgIGVuY29kaW5nLndyaXRlVmFyVWludChlbmNvZGVyLCBjbG9jaylcbiAgICBlbmNvZGluZy53cml0ZVZhclN0cmluZyhlbmNvZGVyLCBKU09OLnN0cmluZ2lmeShtb2RpZmllZFN0YXRlKSlcbiAgfVxuICByZXR1cm4gZW5jb2RpbmcudG9VaW50OEFycmF5KGVuY29kZXIpXG59XG5cbi8qKlxuICogQHBhcmFtIHtBd2FyZW5lc3N9IGF3YXJlbmVzc1xuICogQHBhcmFtIHtVaW50OEFycmF5fSB1cGRhdGVcbiAqIEBwYXJhbSB7YW55fSBvcmlnaW4gVGhpcyB3aWxsIGJlIGFkZGVkIHRvIHRoZSBlbWl0dGVkIGNoYW5nZSBldmVudFxuICovXG5leHBvcnQgY29uc3QgYXBwbHlBd2FyZW5lc3NVcGRhdGUgPSAoYXdhcmVuZXNzLCB1cGRhdGUsIG9yaWdpbikgPT4ge1xuICBjb25zdCBkZWNvZGVyID0gZGVjb2RpbmcuY3JlYXRlRGVjb2Rlcih1cGRhdGUpXG4gIGNvbnN0IHRpbWVzdGFtcCA9IHRpbWUuZ2V0VW5peFRpbWUoKVxuICBjb25zdCBhZGRlZCA9IFtdXG4gIGNvbnN0IHVwZGF0ZWQgPSBbXVxuICBjb25zdCBmaWx0ZXJlZFVwZGF0ZWQgPSBbXVxuICBjb25zdCByZW1vdmVkID0gW11cbiAgY29uc3QgbGVuID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2RlcilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGNvbnN0IGNsaWVudElEID0gZGVjb2RpbmcucmVhZFZhclVpbnQoZGVjb2RlcilcbiAgICBsZXQgY2xvY2sgPSBkZWNvZGluZy5yZWFkVmFyVWludChkZWNvZGVyKVxuICAgIGNvbnN0IHN0YXRlID0gSlNPTi5wYXJzZShkZWNvZGluZy5yZWFkVmFyU3RyaW5nKGRlY29kZXIpKVxuICAgIGNvbnN0IGNsaWVudE1ldGEgPSBhd2FyZW5lc3MubWV0YS5nZXQoY2xpZW50SUQpXG4gICAgY29uc3QgcHJldlN0YXRlID0gYXdhcmVuZXNzLnN0YXRlcy5nZXQoY2xpZW50SUQpXG4gICAgY29uc3QgY3VyckNsb2NrID0gY2xpZW50TWV0YSA9PT0gdW5kZWZpbmVkID8gMCA6IGNsaWVudE1ldGEuY2xvY2tcbiAgICBpZiAoY3VyckNsb2NrIDwgY2xvY2sgfHwgKGN1cnJDbG9jayA9PT0gY2xvY2sgJiYgc3RhdGUgPT09IG51bGwgJiYgYXdhcmVuZXNzLnN0YXRlcy5oYXMoY2xpZW50SUQpKSkge1xuICAgICAgaWYgKHN0YXRlID09PSBudWxsKSB7XG4gICAgICAgIC8vIG5ldmVyIGxldCBhIHJlbW90ZSBjbGllbnQgcmVtb3ZlIHRoaXMgbG9jYWwgc3RhdGVcbiAgICAgICAgaWYgKGNsaWVudElEID09PSBhd2FyZW5lc3MuY2xpZW50SUQgJiYgYXdhcmVuZXNzLmdldExvY2FsU3RhdGUoKSAhPSBudWxsKSB7XG4gICAgICAgICAgLy8gcmVtb3RlIGNsaWVudCByZW1vdmVkIHRoZSBsb2NhbCBzdGF0ZS4gRG8gbm90IHJlbW90ZSBzdGF0ZS4gQnJvYWRjYXN0IGEgbWVzc2FnZSBpbmRpY2F0aW5nXG4gICAgICAgICAgLy8gdGhhdCB0aGlzIGNsaWVudCBzdGlsbCBleGlzdHMgYnkgaW5jcmVhc2luZyB0aGUgY2xvY2tcbiAgICAgICAgICBjbG9jaysrXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXdhcmVuZXNzLnN0YXRlcy5kZWxldGUoY2xpZW50SUQpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YXJlbmVzcy5zdGF0ZXMuc2V0KGNsaWVudElELCBzdGF0ZSlcbiAgICAgIH1cbiAgICAgIGF3YXJlbmVzcy5tZXRhLnNldChjbGllbnRJRCwge1xuICAgICAgICBjbG9jayxcbiAgICAgICAgbGFzdFVwZGF0ZWQ6IHRpbWVzdGFtcFxuICAgICAgfSlcbiAgICAgIGlmIChjbGllbnRNZXRhID09PSB1bmRlZmluZWQgJiYgc3RhdGUgIT09IG51bGwpIHtcbiAgICAgICAgYWRkZWQucHVzaChjbGllbnRJRClcbiAgICAgIH0gZWxzZSBpZiAoY2xpZW50TWV0YSAhPT0gdW5kZWZpbmVkICYmIHN0YXRlID09PSBudWxsKSB7XG4gICAgICAgIHJlbW92ZWQucHVzaChjbGllbnRJRClcbiAgICAgIH0gZWxzZSBpZiAoc3RhdGUgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKCFmLmVxdWFsaXR5RGVlcChzdGF0ZSwgcHJldlN0YXRlKSkge1xuICAgICAgICAgIGZpbHRlcmVkVXBkYXRlZC5wdXNoKGNsaWVudElEKVxuICAgICAgICB9XG4gICAgICAgIHVwZGF0ZWQucHVzaChjbGllbnRJRClcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGFkZGVkLmxlbmd0aCA+IDAgfHwgZmlsdGVyZWRVcGRhdGVkLmxlbmd0aCA+IDAgfHwgcmVtb3ZlZC5sZW5ndGggPiAwKSB7XG4gICAgYXdhcmVuZXNzLmVtaXQoJ2NoYW5nZScsIFt7XG4gICAgICBhZGRlZCwgdXBkYXRlZDogZmlsdGVyZWRVcGRhdGVkLCByZW1vdmVkXG4gICAgfSwgb3JpZ2luXSlcbiAgfVxuICBpZiAoYWRkZWQubGVuZ3RoID4gMCB8fCB1cGRhdGVkLmxlbmd0aCA+IDAgfHwgcmVtb3ZlZC5sZW5ndGggPiAwKSB7XG4gICAgYXdhcmVuZXNzLmVtaXQoJ3VwZGF0ZScsIFt7XG4gICAgICBhZGRlZCwgdXBkYXRlZCwgcmVtb3ZlZFxuICAgIH0sIG9yaWdpbl0pXG4gIH1cbn1cbiIsICIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuaW1wb3J0ICogYXMgZW5jb2RpbmcgZnJvbSAnbGliMC9lbmNvZGluZydcbmltcG9ydCAqIGFzIGRlY29kaW5nIGZyb20gJ2xpYjAvZGVjb2RpbmcnXG5pbXBvcnQgKiBhcyBwcm9taXNlIGZyb20gJ2xpYjAvcHJvbWlzZSdcbmltcG9ydCAqIGFzIGVycm9yIGZyb20gJ2xpYjAvZXJyb3InXG5pbXBvcnQgKiBhcyBzdHJpbmcgZnJvbSAnbGliMC9zdHJpbmcnXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHNlY3JldFxuICogQHBhcmFtIHtzdHJpbmd9IHJvb21OYW1lXG4gKiBAcmV0dXJuIHtQcm9taXNlTGlrZTxDcnlwdG9LZXk+fVxuICovXG5leHBvcnQgY29uc3QgZGVyaXZlS2V5ID0gKHNlY3JldCwgcm9vbU5hbWUpID0+IHtcbiAgY29uc3Qgc2VjcmV0QnVmZmVyID0gc3RyaW5nLmVuY29kZVV0Zjgoc2VjcmV0KS5idWZmZXJcbiAgY29uc3Qgc2FsdCA9IHN0cmluZy5lbmNvZGVVdGY4KHJvb21OYW1lKS5idWZmZXJcbiAgcmV0dXJuIGNyeXB0by5zdWJ0bGUuaW1wb3J0S2V5KFxuICAgICdyYXcnLFxuICAgIHNlY3JldEJ1ZmZlcixcbiAgICAnUEJLREYyJyxcbiAgICBmYWxzZSxcbiAgICBbJ2Rlcml2ZUtleSddXG4gICkudGhlbihrZXlNYXRlcmlhbCA9PlxuICAgIGNyeXB0by5zdWJ0bGUuZGVyaXZlS2V5KFxuICAgICAge1xuICAgICAgICBuYW1lOiAnUEJLREYyJyxcbiAgICAgICAgc2FsdCxcbiAgICAgICAgaXRlcmF0aW9uczogMTAwMDAwLFxuICAgICAgICBoYXNoOiAnU0hBLTI1NidcbiAgICAgIH0sXG4gICAgICBrZXlNYXRlcmlhbCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ0FFUy1HQ00nLFxuICAgICAgICBsZW5ndGg6IDI1NlxuICAgICAgfSxcbiAgICAgIHRydWUsXG4gICAgICBbJ2VuY3J5cHQnLCAnZGVjcnlwdCddXG4gICAgKVxuICApXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhIGRhdGEgdG8gYmUgZW5jcnlwdGVkXG4gKiBAcGFyYW0ge0NyeXB0b0tleT99IGtleVxuICogQHJldHVybiB7UHJvbWlzZUxpa2U8VWludDhBcnJheT59IGVuY3J5cHRlZCwgYmFzZTY0IGVuY29kZWQgbWVzc2FnZVxuICovXG5leHBvcnQgY29uc3QgZW5jcnlwdCA9IChkYXRhLCBrZXkpID0+IHtcbiAgaWYgKCFrZXkpIHtcbiAgICByZXR1cm4gLyoqIEB0eXBlIHtQcm9taXNlTGlrZTxVaW50OEFycmF5Pn0gKi8gKHByb21pc2UucmVzb2x2ZShkYXRhKSlcbiAgfVxuICBjb25zdCBpdiA9IGNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoMTIpKVxuICByZXR1cm4gY3J5cHRvLnN1YnRsZS5lbmNyeXB0KFxuICAgIHtcbiAgICAgIG5hbWU6ICdBRVMtR0NNJyxcbiAgICAgIGl2XG4gICAgfSxcbiAgICBrZXksXG4gICAgZGF0YVxuICApLnRoZW4oY2lwaGVyID0+IHtcbiAgICBjb25zdCBlbmNyeXB0ZWREYXRhRW5jb2RlciA9IGVuY29kaW5nLmNyZWF0ZUVuY29kZXIoKVxuICAgIGVuY29kaW5nLndyaXRlVmFyU3RyaW5nKGVuY3J5cHRlZERhdGFFbmNvZGVyLCAnQUVTLUdDTScpXG4gICAgZW5jb2Rpbmcud3JpdGVWYXJVaW50OEFycmF5KGVuY3J5cHRlZERhdGFFbmNvZGVyLCBpdilcbiAgICBlbmNvZGluZy53cml0ZVZhclVpbnQ4QXJyYXkoZW5jcnlwdGVkRGF0YUVuY29kZXIsIG5ldyBVaW50OEFycmF5KGNpcGhlcikpXG4gICAgcmV0dXJuIGVuY29kaW5nLnRvVWludDhBcnJheShlbmNyeXB0ZWREYXRhRW5jb2RlcilcbiAgfSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBkYXRhIHRvIGJlIGVuY3J5cHRlZFxuICogQHBhcmFtIHtDcnlwdG9LZXk/fSBrZXlcbiAqIEByZXR1cm4ge1Byb21pc2VMaWtlPFVpbnQ4QXJyYXk+fSBlbmNyeXB0ZWQgZGF0YSwgaWYga2V5IGlzIHByb3ZpZGVkXG4gKi9cbmV4cG9ydCBjb25zdCBlbmNyeXB0SnNvbiA9IChkYXRhLCBrZXkpID0+IHtcbiAgY29uc3QgZGF0YUVuY29kZXIgPSBlbmNvZGluZy5jcmVhdGVFbmNvZGVyKClcbiAgZW5jb2Rpbmcud3JpdGVBbnkoZGF0YUVuY29kZXIsIGRhdGEpXG4gIHJldHVybiBlbmNyeXB0KGVuY29kaW5nLnRvVWludDhBcnJheShkYXRhRW5jb2RlciksIGtleSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGRhdGFcbiAqIEBwYXJhbSB7Q3J5cHRvS2V5P30ga2V5XG4gKiBAcmV0dXJuIHtQcm9taXNlTGlrZTxVaW50OEFycmF5Pn0gZGVjcnlwdGVkIGJ1ZmZlclxuICovXG5leHBvcnQgY29uc3QgZGVjcnlwdCA9IChkYXRhLCBrZXkpID0+IHtcbiAgaWYgKCFrZXkpIHtcbiAgICByZXR1cm4gLyoqIEB0eXBlIHtQcm9taXNlTGlrZTxVaW50OEFycmF5Pn0gKi8gKHByb21pc2UucmVzb2x2ZShkYXRhKSlcbiAgfVxuICBjb25zdCBkYXRhRGVjb2RlciA9IGRlY29kaW5nLmNyZWF0ZURlY29kZXIoZGF0YSlcbiAgY29uc3QgYWxnb3JpdGhtID0gZGVjb2RpbmcucmVhZFZhclN0cmluZyhkYXRhRGVjb2RlcilcbiAgaWYgKGFsZ29yaXRobSAhPT0gJ0FFUy1HQ00nKSB7XG4gICAgcHJvbWlzZS5yZWplY3QoZXJyb3IuY3JlYXRlKCdVbmtub3duIGVuY3J5cHRpb24gYWxnb3JpdGhtJykpXG4gIH1cbiAgY29uc3QgaXYgPSBkZWNvZGluZy5yZWFkVmFyVWludDhBcnJheShkYXRhRGVjb2RlcilcbiAgY29uc3QgY2lwaGVyID0gZGVjb2RpbmcucmVhZFZhclVpbnQ4QXJyYXkoZGF0YURlY29kZXIpXG4gIHJldHVybiBjcnlwdG8uc3VidGxlLmRlY3J5cHQoXG4gICAge1xuICAgICAgbmFtZTogJ0FFUy1HQ00nLFxuICAgICAgaXZcbiAgICB9LFxuICAgIGtleSxcbiAgICBjaXBoZXJcbiAgKS50aGVuKGRhdGEgPT4gbmV3IFVpbnQ4QXJyYXkoZGF0YSkpXG59XG5cbi8qKlxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXG4gKiBAcGFyYW0ge0NyeXB0b0tleT99IGtleVxuICogQHJldHVybiB7UHJvbWlzZUxpa2U8T2JqZWN0Pn0gZGVjcnlwdGVkIG9iamVjdFxuICovXG5leHBvcnQgY29uc3QgZGVjcnlwdEpzb24gPSAoZGF0YSwga2V5KSA9PlxuICBkZWNyeXB0KGRhdGEsIGtleSkudGhlbihkZWNyeXB0ZWRWYWx1ZSA9PlxuICAgIGRlY29kaW5nLnJlYWRBbnkoZGVjb2RpbmcuY3JlYXRlRGVjb2RlcihuZXcgVWludDhBcnJheShkZWNyeXB0ZWRWYWx1ZSkpKVxuICApXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBLEtBQUMsU0FBUyxHQUFFO0FBQUMs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LEdBQUUsSUFBRUEsT0FBSSxLQUFHLE9BQU0sQ0FBQUMsTUFBRyxLQUFLRSxLQUFFLEVBQUVILEVBQUMsSUFBRTtBQUFFLHFCQUFPQztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsWUFBVSxTQUFTRSxJQUFFSCxJQUFFO0FBQUMscUJBQU9HLFFBQUssR0FBRUgsTUFBRyxFQUFFRyxJQUFFLEdBQUUsS0FBSyxNQUFNLEdBQUUsS0FBS0EsRUFBQztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsZUFBYSxTQUFTQSxJQUFFSCxJQUFFO0FBQUMscUJBQU9HLFFBQUssR0FBRUgsTUFBRyxFQUFFRyxJQUFFLEdBQUUsS0FBSyxNQUFNLEdBQUUsS0FBS0EsRUFBQyxJQUFFLEtBQUtBLEtBQUUsQ0FBQyxLQUFHO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxlQUFhLFNBQVNBLElBQUVILElBQUU7QUFBQyxxQkFBT0csUUFBSyxHQUFFSCxNQUFHLEVBQUVHLElBQUUsR0FBRSxLQUFLLE1BQU0sR0FBRSxLQUFLQSxFQUFDLEtBQUcsSUFBRSxLQUFLQSxLQUFFLENBQUM7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGVBQWEsU0FBU0EsSUFBRUgsSUFBRTtBQUFDLHFCQUFPRyxRQUFLLEdBQUVILE1BQUcsRUFBRUcsSUFBRSxHQUFFLEtBQUssTUFBTSxJQUFHLEtBQUtBLEVBQUMsSUFBRSxLQUFLQSxLQUFFLENBQUMsS0FBRyxJQUFFLEtBQUtBLEtBQUUsQ0FBQyxLQUFHLE1BQUksV0FBUyxLQUFLQSxLQUFFLENBQUM7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGVBQWEsU0FBU0EsSUFBRUgsSUFBRTtBQUFDLHFCQUFPRyxRQUFLLEdBQUVILE1BQUcsRUFBRUcsSUFBRSxHQUFFLEtBQUssTUFBTSxHQUFFLFdBQVMsS0FBS0EsRUFBQyxLQUFHLEtBQUtBLEtBQUUsQ0FBQyxLQUFHLEtBQUcsS0FBS0EsS0FBRSxDQUFDLEtBQUcsSUFBRSxLQUFLQSxLQUFFLENBQUM7QUFBQSxZQUFFLEdBQUUsRUFBRSxVQUFVLFlBQVUsU0FBU0EsSUFBRUgsSUFBRUQsSUFBRTtBQUFDLGNBQUFJLFFBQUssR0FBRUgsUUFBSyxHQUFFRCxNQUFHLEVBQUVJLElBQUVILElBQUUsS0FBSyxNQUFNO0FBQUUsdUJBQVEsSUFBRSxLQUFLRyxFQUFDLEdBQUVDLEtBQUUsR0FBRUMsS0FBRSxHQUFFLEVBQUVBLEtBQUVMLE9BQUlJLE1BQUcsT0FBTSxNQUFHLEtBQUtELEtBQUVFLEVBQUMsSUFBRUQ7QUFBRSxxQkFBT0EsTUFBRyxLQUFJLEtBQUdBLE9BQUksS0FBRyxFQUFFLEdBQUUsSUFBRUosRUFBQyxJQUFHO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxZQUFVLFNBQVNHLElBQUVILElBQUVELElBQUU7QUFBQyxjQUFBSSxRQUFLLEdBQUVILFFBQUssR0FBRUQsTUFBRyxFQUFFSSxJQUFFSCxJQUFFLEtBQUssTUFBTTtBQUFFLHVCQUFRLElBQUVBLElBQUVJLEtBQUUsR0FBRUMsS0FBRSxLQUFLRixLQUFFLEVBQUUsQ0FBQyxHQUFFLElBQUUsTUFBSUMsTUFBRyxPQUFNLENBQUFDLE1BQUcsS0FBS0YsS0FBRSxFQUFFLENBQUMsSUFBRUM7QUFBRSxxQkFBT0EsTUFBRyxLQUFJQyxNQUFHRCxPQUFJQyxNQUFHLEVBQUUsR0FBRSxJQUFFTCxFQUFDLElBQUdLO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxXQUFTLFNBQVNGLElBQUVILElBQUU7QUFBQyxxQkFBT0csUUFBSyxHQUFFSCxNQUFHLEVBQUVHLElBQUUsR0FBRSxLQUFLLE1BQU0sR0FBRSxNQUFJLEtBQUtBLEVBQUMsSUFBRSxNQUFJLE1BQUksS0FBS0EsRUFBQyxJQUFFLEtBQUcsS0FBS0EsRUFBQztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsY0FBWSxTQUFTQSxJQUFFSCxJQUFFO0FBQUMsY0FBQUcsUUFBSyxHQUFFSCxNQUFHLEVBQUVHLElBQUUsR0FBRSxLQUFLLE1BQU07QUFBRSxrQkFBSUosS0FBRSxLQUFLSSxFQUFDLElBQUUsS0FBS0EsS0FBRSxDQUFDLEtBQUc7QUFBRSxxQkFBTyxRQUFNSixLQUFFLGFBQVdBLEtBQUVBO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxjQUFZLFNBQVNJLElBQUVILElBQUU7QUFBQyxjQUFBRyxRQUFLLEdBQUVILE1BQUcsRUFBRUcsSUFBRSxHQUFFLEtBQUssTUFBTTtBQUFFLGtCQUFJSixLQUFFLEtBQUtJLEtBQUUsQ0FBQyxJQUFFLEtBQUtBLEVBQUMsS0FBRztBQUFFLHFCQUFPLFFBQU1KLEtBQUUsYUFBV0EsS0FBRUE7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGNBQVksU0FBU0ksSUFBRUgsSUFBRTtBQUFDLHFCQUFPRyxRQUFLLEdBQUVILE1BQUcsRUFBRUcsSUFBRSxHQUFFLEtBQUssTUFBTSxHQUFFLEtBQUtBLEVBQUMsSUFBRSxLQUFLQSxLQUFFLENBQUMsS0FBRyxJQUFFLEtBQUtBLEtBQUUsQ0FBQyxLQUFHLEtBQUcsS0FBS0EsS0FBRSxDQUFDLEtBQUc7QUFBQSxZQUFFLEdBQUUsRUFBRSxVQUFVLGNBQVksU0FBU0EsSUFBRUgsSUFBRTtBQUFDLHFCQUFPRyxRQUFLLEdBQUVILE1BQUcsRUFBRUcsSUFBRSxHQUFFLEtBQUssTUFBTSxHQUFFLEtBQUtBLEVBQUMsS0FBRyxLQUFHLEtBQUtBLEtBQUUsQ0FBQyxLQUFHLEtBQUcsS0FBS0EsS0FBRSxDQUFDLEtBQUcsSUFBRSxLQUFLQSxLQUFFLENBQUM7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGNBQVksU0FBU0EsSUFBRUgsSUFBRTtBQUFDLHFCQUFPRyxRQUFLLEdBQUVILE1BQUcsRUFBRUcsSUFBRSxHQUFFLEtBQUssTUFBTSxHQUFFLEVBQUUsS0FBSyxNQUFLQSxJQUFFLE1BQUcsSUFBRyxDQUFDO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxjQUFZLFNBQVNBLElBQUVILElBQUU7QUFBQyxxQkFBT0csUUFBSyxHQUFFSCxNQUFHLEVBQUVHLElBQUUsR0FBRSxLQUFLLE1BQU0sR0FBRSxFQUFFLEtBQUssTUFBS0EsSUFBRSxPQUFHLElBQUcsQ0FBQztBQUFBLFlBQUMs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RUFBQyxJQUFFRyxPQUFJLEdBQUUsS0FBS0gsS0FBRSxDQUFDLElBQUUsTUFBSUcsSUFBRUgsS0FBRTtBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsZUFBYSxTQUFTRyxJQUFFSCxJQUFFRCxJQUFFO0FBQUMscUJBQU9JLEtBQUUsQ0FBQ0EsSUFBRUgsUUFBSyxHQUFFRCxNQUFHLEVBQUUsTUFBS0ksSUFBRUgsSUFBRSxHQUFFLFlBQVcsV0FBVyxHQUFFLEtBQUtBLEVBQUMsSUFBRSxNQUFJRyxJQUFFLEtBQUtILEtBQUUsQ0FBQyxJQUFFRyxPQUFJLEdBQUUsS0FBS0gsS0FBRSxDQUFDLElBQUVHLE9BQUksSUFBRyxLQUFLSCxLQUFFLENBQUMsSUFBRUcsT0FBSSxJQUFHSCxLQUFFO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxlQUFhLFNBQVNHLElBQUVILElBQUVELElBQUU7QUFBQyxxQkFBT0ksS0FBRSxDQUFDQSxJQUFFSCxRQUFLLEdBQUVELE1BQUcsRUFBRSxNQUFLSSxJQUFFSCxJQUFFLEdBQUUsWUFBVyxXQUFXLEdBQUUsSUFBRUcsT0FBSUEsS0FBRSxhQUFXQSxLQUFFLElBQUcsS0FBS0gsRUFBQyxJQUFFRyxPQUFJLElBQUcsS0FBS0gsS0FBRSxDQUFDLElBQUVHLE9BQUksSUFBRyxLQUFLSCxLQUFFLENBQUMsSUFBRUcsT0FBSSxHQUFFLEtBQUtILEtBQUUsQ0FBQyxJQUFFLE1BQUlHLElBQUVILEtBQUU7QUFBQSxZQUFDLEdBQUUsRUFBRSxVQUFVLGVBQWEsU0FBU0csSUFBRUgsSUFBRUQsSUFBRTtBQUFDLHFCQUFPLEVBQUUsTUFBS0ksSUFBRUgsSUFBRSxNQUFHRCxFQUFDO0FBQUEsWUFBQyxHQUFFLEVBQUUsVUFBVSxlQUFhLFNBQVNJLElBQUVILElBQUVELElBQUU7QUFBQyxxQkFBTyxFQUFFLE1BQUtJLElBQUVILElBQUUsT0FBR0QsRUFBQztBQUFBLFlBQUMsR0FBRSxFQUFFLFVBQVUsZ0JBQWMsU0FBU0ksSUFBRUgsSUFBRUQsSUFBRTtBQUFDLHFCQUFPLEVBQUUsTUFBS0ks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LE1BQUksQ0FBQyxHQUFFLEtBQUcsR0FBRSxJQUFFLEdBQUUsSUFBRSxNQUFJLElBQUVDLEdBQUVELEtBQUUsQ0FBQyxHQUFFLEtBQUcsR0FBRSxLQUFHLEVBQUU7QUFBQyxlQUFJLElBQUUsS0FBRyxLQUFHLENBQUMsS0FBRyxHQUFFLE1BQUksQ0FBQyxHQUFFLEtBQUdLLElBQUUsSUFBRSxHQUFFLElBQUUsTUFBSSxJQUFFSixHQUFFRCxLQUFFLENBQUMsR0FBRSxLQUFHLEdBQUUsS0FBRyxFQUFFO0FBQUMsY0FBRyxNQUFJLEVBQUUsS0FBRSxJQUFFO0FBQUEsZUFBTTtBQUFDLGdCQUFHLE1BQUksRUFBRSxRQUFPLElBQUUsT0FBSyxJQUFFLEtBQUcsTUFBSSxJQUFFO0FBQUcsaUJBQUcsRUFBRSxHQUFFSyxFQUFDLEdBQUUsS0FBRztBQUFBLFVBQUM7QUFBQyxrQkFBTyxJQUFFLEtBQUcsS0FBRyxJQUFFLEVBQUUsR0FBRSxJQUFFQSxFQUFDO0FBQUEsUUFBQyxHQUFFLEVBQUUsUUFBTSxTQUFTRixJQUFFRSxJQUFFLEdBQUUsR0FBRSxHQUFFLEdBQUU7QUFBQyxjQUFJLEdBQUUsR0FBRSxHQUFFLElBQUUsS0FBSyxLQUFJLElBQUUsS0FBSyxLQUFJLElBQUUsSUFBRSxJQUFFLElBQUUsR0FBRSxLQUFHLEtBQUcsS0FBRyxHQUFFLElBQUUsS0FBRyxHQUFFLElBQUUsT0FBSyxJQUFFLEVBQUUsR0FBRSxHQUFHLElBQUUsRUFBRSxHQUFFLEdBQUcsSUFBRSxHQUFFLElBQUUsSUFBRSxJQUFFLElBQUUsR0FBRSxJQUFFLElBQUUsSUFBRSxJQUFHLElBQUUsSUFBRUEsTUFBRyxNQUFJQSxNQUFHLElBQUUsSUFBRUEsS0FBRSxJQUFFO0FBQUUsZUFBSUEsS0FBRSxFQUFFQSxFQUFDLEdBQUUsTUFBTUEsRUFBQyxLQUFHQSxPQUFJLElBQUUsS0FBRyxJQUFFLE1BQU1BLEVBQUMsSUFBRSxJQUFFLEdBQUUsSUFBRSxNQUFJLElBQUUsRUFBRSxFQUFFQSxFQUFDLElBQUUsQ0FBQyxHQUFFLElBQUVBLE1B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RSxLQUFLLEtBQUs7QUFBSyxxQkFBTyxLQUFLLE9BQUssTUFBSSxLQUFLLFNBQU8sS0FBSyxPQUFLLE9BQUssS0FBSyxLQUFLLE1BQUssRUFBRSxLQUFLLFFBQU9BO0FBQUEsWUFBQztBQUFBLFVBQUMsRUFBQyxHQUFFLEVBQUMsS0FBSSxTQUFRLE9BQU0sV0FBVTtBQUFDLGlCQUFLLE9BQUssS0FBSyxPQUFLLE1BQUssS0FBSyxTQUFPO0FBQUEsVUFBQyxFQUFDLEdBQUUsRUFBQyxLQUFJLFFBQU8sT0FBTSxTQUFTQSxJQUFFO0FBQUMsZ0JBQUcsTUFBSSxLQUFLLE9BQU8sUUFBTTtBQUFHLHFCQUFRSCxLQUFFLEtBQUssTUFBS0QsS0FBRSxLQUFHQyxHQUFFLE1BQUtBLEtBQUVBLEdBQUUsT0FBTSxDQUFBRCxNQUFHSSxLQUFFSCxHQUFFO0FBQUssbUJBQU9EO0FBQUEsVUFBQyxFQUFDLEdBQUUsRUFBQyxLQUFJLFVBQVMsT0FBTSxTQUFTSSxJQUFFO0FBQUMsZ0JBQUcsTUFBSSxLQUFLLE9BQU8sUUFBTyxFQUFFLE1BQU0sQ0FBQztBQUFFLHFCQUFRSCxLQUFFLEVBQUUsWUFBWUcsT0FBSSxDQUFDLEdBQUVKLEtBQUUsS0FBSyxNQUFLRSxLQUFFLEdBQUVGLEtBQUcsR0FBRUEsR0FBRSxNQUFLQyxJQUFFQyxFQUFDLEdBQUVBLE1BQUdGLEdBQUUsS0FBSyxRQUFPQSxLQUFFQSxHQUFFO0FBQUssbUJBQU9DO0FBQUEsVUFBQyxFQUFDLEdBQUUsRUFBQyxLQUFJLFdBQVUsT0FBTSxTQUFTRyxJQUFFSCxJQUFFO0FBQUMsZ0JBQUlEO0FBQUUsbUJBQU9JLEtBQUUsS0FBSyxLQUFLLEtBQUssVUFBUUosS0FBRSxLQUFLLEtBQUssS0FBSyxNQUFNLEdBQUVJLEVBQUMsR0FBRSxLQUFLLEtBQUssT0FBSyxLQUFLLEtBQUssS0FBSyxNQUFNQSxFQUFDLEtBQUdBLE9BQUksS0FBSyxLQUFLLEtBQUssU0FBT0osS0FBRSxLQUFLLE1BQU0sSUFBRUEsS0FBRUMsS0FBRSxLQUFLLFdBQVdHLEVBQUMsSUFBRSxL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O0FBQ3JCLFNBQUssZUFBZSxRQUFRLFVBQVE7QUFDbEMsV0FBSyxVQUFVLE9BQU8sSUFBSTtBQUMxQixVQUFJLEtBQUssVUFBVSxTQUFTLEdBQUc7QUFDN0IsYUFBSyxRQUFRO0FBQ2IsdUJBQWUsT0FBTyxLQUFLLEdBQUc7QUFBQSxNQUNoQztBQUFBLElBQ0YsQ0FBQztBQUNELFFBQUksS0FBSyxNQUFNO0FBQ2IsV0FBSyxLQUFLLFdBQVc7QUFDckIsaUJBQVcsSUFBSTtBQUFBLElBQ2pCO0FBQUEsRUFDRjtBQUFBLEVBRUEsVUFBVztBQUNULFNBQUssSUFBSSxJQUFJLFdBQVcsS0FBSyxPQUFPO0FBRXBDLFNBQUssSUFBSSxLQUFLLE1BQU07QUFDRSxNQUFDLEtBQUssS0FBTSxRQUFRO0FBQ3hDLFlBQU0sT0FBTyxLQUFLLFFBQVE7QUFBQSxJQUM1QixDQUFDO0FBQ0QsVUFBTSxRQUFRO0FBQUEsRUFDaEI7QUFDRjsiLAogICJuYW1lcyI6IFsibiIsICJ0IiwgInIiLCAiYSIsICJlIiwgIm8iLCAiZCIsICJzIiwgImwiLCAiYyIsICJmIiwgInUiLCAicCIsICJZIiwgIiQiLCAiaSIsICJoIiwgIm0iLCAiZyIsICJfIiwgIm1hcCIsICJjcmVhdGUiLCAiY3JlYXRlIiwgImFyZ3MiLCAiaXNOYU4iLCAiY3JlYXRlIiwgImlzTmFOIiwgInBhcnNlSW50IiwgIm1hdGNoIiwgImtleXMiLCAiY3JlYXRlIiwgImV2ZXJ5IiwgImNyZWF0ZSIsICJtaW4iLCAibWF4IiwgIm1pbiIsICJtYXgiLCAibWluIiwgIm1heCIsICJldmVyeSIsICJldmVyeSIsICJrZXlzIiwgImFyZ3MiLCAiJGpzb24iLCAiY3JlYXRlIiwgImNyZWF0ZSIsICJjcmVhdGUiLCAiYXJncyIsICJjcmVhdGUiLCAiYXJncyIsICJzdHlsZSIsICJjcmVhdGUiLCAiY3JlYXRlTW9kdWxlTG9nZ2VyIiwgImNyZWF0ZSIsICJZIiwgImRvYyIsICJZIiwgImRvYyIsICJjcmVhdGUiLCAiZGF0YSIsICJjcmVhdGVNb2R1bGVMb2dnZXIiLCAiZG9jIiwgIlBlZXIiLCAiZW5jb2RlciIsICJjcmVhdGUiLCAiZGF0YSJdCn0K

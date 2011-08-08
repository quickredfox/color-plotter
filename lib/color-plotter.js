(function() {
  /*
      You can easily remove these and implement non-native wrapping versions
  */  var CartesianPlane, Color, ColorPlotter, M, Plane, PolarPlane, exports;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  if (typeof Array.prototype.flatten !== 'function') {
    Array.prototype.flatten = function() {
      return this.reduce(function(p, n) {
        if (typeof n !== "undefined" && n !== null) {
          return p.concat(n);
        } else {
          return p;
        }
      }, []);
    };
  }
  if (typeof Array.cast !== 'function') {
    Array.cast = function(args) {
      return Array.prototype.slice.call(args);
    };
  }
  /*
      A M is short for "Math" class to handle extend Math and shrin the namespace
  */
  M = (function() {
    function M() {}
    'E LN2 LN10 LOGToE LOG10E PI SQRT1_2 SQRT2'.split(' ').forEach(function(property) {
      return this[property] = Math[property];
    }, M);
    'abs acos asin atan atan2 ceil cos expo floor log max min pow random round sin sqrt tan'.split(' ').forEach(function(method) {
      return this[method] = Math[method];
    }, M);
    M.PI2 = Math.PI * 2;
    M.radToDeg = function(r) {
      return r * (180 / Math.PI);
    };
    M.degToRad = function(d) {
      return d * (Math.PI / 180);
    };
    M.polarToCartesian = function(r, theta) {
      var _ref;
      _ref = Array.cast(arguments).flatten(), r = _ref[0], theta = _ref[1];
      return [r * Math.cos(theta), r * Math.sin(theta)];
    };
    M.cartesianToPolar = function(x, y) {
      var _ref;
      _ref = Array.cast(arguments).flatten(), x = _ref[0], y = _ref[1];
      return [Math.sqrt(x * x + y * y), Math.atan2(y, x)];
    };
    return M;
  })();
  /*
      A Color class to handle all color conversions 
  */
  Color = (function() {
    /*
            conversion helpers
        */    var byteToHex, hueToRgb;
    hueToRgb = function(p, q, t) {
      if (t < 0) {
        t += 1;
      }
      if (t > 1) {
        t -= 1;
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
      }
      if (t < 1 / 2) {
        return q;
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
      }
    };
    byteToHex = function(n) {
      var nybHexString;
      nybHexString = "0123456789ABCDEF";
      return "" + (nybHexString.substr((n >> 4) & 0x0F, 1) + nybHexString.substr(n & 0x0F, 1));
    };
    /*
            convert 3 hex values to 3 rgb values
        */
    Color.hexToRgb = function() {
      return Array.cast(arguments).flatten().map(function(v) {
        return parseInt(v, 16);
      });
    };
    /*
            convert 3 hex values to 3 hsl values
        */
    Color.hexToHsl = function() {
      return Color.rgbToHsl(Color.hexToRgb.apply(this, arguments));
    };
    /*
            convert 3 rgb values to 3 hex values
        */
    Color.rgbToHex = function() {
      var b, g, r, _ref;
      _ref = Array.cast(arguments).flatten(), r = _ref[0], g = _ref[1], b = _ref[2];
      return [byteToHex(r), byteToHex(g), byteToHex(b)];
    };
    /*
            convert 3 rgb values to 3 hsl values
        */
    Color.rgbToHsl = function() {
      var b, d, g, h, l, max, min, r, s, _ref;
      _ref = Array.cast(arguments).flatten(), r = _ref[0], g = _ref[1], b = _ref[2];
      r /= 255;
      g /= 255;
      b /= 255;
      max = Math.max(r, g, b);
      min = Math.min(r, g, b);
      l = (max + min) / 2;
      if (max === min) {
        h = s = 0;
      } else {
        d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
        }
        h /= 6;
      }
      return [h, s, l];
    };
    /*
            convert 3 hsl values to 3 rgb values        
        */
    Color.hslToRgb = function() {
      var b, g, h, l, p, q, r, s, _ref;
      _ref = Array.cast(arguments).flatten(), h = _ref[0], s = _ref[1], l = _ref[2];
      if (s === 0) {
        return r = g = b = l;
      } else {
        q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        p = 2 * l - q;
        r = hueToRgb(p, q, h + 1 / 3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1 / 3);
        return [r * 255, g * 255, b * 255];
      }
    };
    /*
            convert 2 hsl values to 3 hex values
        */
    Color.hslToHex = function() {
      return Color.rgbToHex(Color.hslToRgb.apply(this, arguments));
    };
    function Color(stringColor) {
      var values;
      this.rgb = [];
      this.hsl = [];
      this.hex = [];
      if (/rgb/.test(stringColor)) {
        this.rgb = /(\d+)\s?\,\s?(\d+)\s?\,\s?(\d+)/gm.exec(stringColor).slice(1);
      } else if (/hsl/.test(stringColor)) {
        this.hsl = /(\d+)\s?\,\s?(\d+)\s?\,\s?(\d+)/gm.exec(stringColor).slice(1);
      } else {
        values = /^\#/.test(stringColor) ? stringColor.substr(1) : stringColor;
        if (values.length === 3) {
          this.hex = values.split('').reduce(function(p, n) {
            return p.push("" + n + n);
          }, []);
        } else {
          this.hex = /(\w{2})(\w{2})(\w{2})/.exec(values).slice(1);
        }
      }
      if (this.rgb.length === 0 && this.hsl.length === 0) {
        this.rbg = Color.hexToRgb(this.hex);
        this.hsl = Color.hexToHsl(this.hex);
      } else if (this.rgb.length > 0) {
        this.hsl = Color.rgbToHsl(this.rgb);
        this.hex = Color.rgbToHex(this.rgb);
      } else if (this.hsl.length > 0) {
        this.rgb = Color.hslToRgb(this.hsl);
        this.hex = Color.hslToHex(this.hsl);
      }
      return this;
    }
    Color.prototype.toPolar = function(w, h) {
      var xy;
      xy = this.toXY(w, h);
      return M.cartesianToPolar(xy);
    };
    Color.prototype.toRGBString = function() {
      var rgb;
      rgb = this.rgb.map(M.round);
      return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
    };
    Color.prototype.toHSLString = function() {
      var hsl;
      hsl = this.hsl.map(function(c) {
        return c.toString().substr(0, 4);
      });
      return "hsl(" + hsl[0] + "," + hsl[1] + "," + hsl[2] + ")";
    };
    Color.prototype.toHexString = function() {
      return "#" + this.hex[0] + this.hex[1] + this.hex[2];
    };
    Color.prototype.toString = function() {
      return this.toHexString();
    };
    return Color;
  })();
  /*
      A base Plane class, to map out some dots.
  */
  Plane = (function() {
    function Plane(options) {
      options.type || (options.type = 'cartesian');
      this.image = document.getElementById("" + options.type + "-colors");
      this.gray = document.getElementById("gray-colors");
      options.width || (options.width = this.image.width);
      options.height || (options.height = this.image.height);
      this.type = options.type;
      this.width = options.width;
      this.height = options.height;
      this.container = typeof options.containerID !== "undefined" ? document.getElementById(options.containerID) : document.body;
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      this.canvas.width = this.width + 10;
      this.canvas.height = this.height;
      this.context.drawImage(this.image, 10, 0, this.width, this.height);
      this.context.drawImage(this.gray, 0, 0, 10, this.height);
      this.container.appendChild(this.canvas);
      return this;
    }
    Plane.prototype.drawDot = function(x, y, color) {
      var _ref;
      _ref = Array.cast(arguments).flatten(), x = _ref[0], y = _ref[1], color = _ref[2];
      this.context.save();
      this.context.shadowOffsetX = 0;
      this.context.shadowOffsetY = 0;
      this.context.shadowBlur = 1;
      this.context.shadowColor = "rgba(0, 0, 0, 0.5)";
      this.context.fillStyle = color || '#ffffff';
      this.context.lineWidth = 1.5;
      this.context.strokeStyle = '#ffffff';
      this.context.moveTo(x, y);
      this.context.beginPath();
      this.context.arc(x, y, 3, 0, M.PI2, true);
      this.context.closePath();
      this.context.fill();
      this.context.stroke();
      return this.context.restore();
    };
    Plane.prototype.plotColor = function() {
      var colors;
      colors = Array.cast(arguments).flatten();
      return colors.forEach(function(color) {
        var plot;
        plot = this.getColorPlotPoint(color);
        return this.drawDot(plot[0], plot[1], color.toHexString(), '#ffffff');
      }, this);
    };
    return Plane;
  })();
  /*
      extends the base Plane to provide a cartesian plane
  */
  CartesianPlane = (function() {
    __extends(CartesianPlane, Plane);
    function CartesianPlane() {
      CartesianPlane.__super__.constructor.apply(this, arguments);
    }
    CartesianPlane.prototype.getColorPlotPoint = function(color) {
      var x, y;
      x = color.hsl[0] * this.width;
      y = this.height - color.hsl[2] * this.height;
      if (color.hsl[1] !== 0) {
        return [x + 10, y];
      }
      return [5, this.height - color.hsl[2] * this.height];
    };
    return CartesianPlane;
  })();
  /*
      extends the base Plane to provide a polar plane
  */
  PolarPlane = (function() {
    __extends(PolarPlane, CartesianPlane);
    function PolarPlane() {
      PolarPlane.__super__.constructor.apply(this, arguments);
    }
    return PolarPlane;
  })();
  ColorPlotter = {
    Color: Color,
    CartesianPlane: CartesianPlane,
    PolarPlane: PolarPlane,
    createColor: function(string) {
      return new Color(string);
    },
    createPlane: function(options) {
      switch (options.type) {
        case 'polar':
          return new PolarPlane(options);
        default:
          return new CartesianPlane(options);
      }
    },
    plotColors: function(options) {
      var colors, plane;
      plane = ColorPlotter.createPlane(options);
      colors = (options.color || options.colors || []).map(function(c) {
        if (typeof c === 'string') {
          return new Color(c);
        } else {
          return c;
        }
      });
      return plane.plotColor(colors);
    },
    ready: function(fn) {
      return window.onload = function() {
        return fn(ColorPlotter);
      };
    }
  };
  if (typeof exports === "undefined") {
    exports = window;
    exports.ColorPlotter = ColorPlotter;
  }
}).call(this);

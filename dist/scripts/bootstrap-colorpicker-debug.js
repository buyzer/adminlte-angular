/*!
 * Bootstrap Colorpicker
 * http://mjolnic.github.io/bootstrap-colorpicker/
 *
 * Originally written by (c) 2012 Stefan Petre
 * Licensed under the Apache License v2.0
 * http://www.apache.org/licenses/LICENSE-2.0.txt
 *
 * @todo Update DOCS
 */

(function(factory) {
    "use strict";
    if (typeof exports === 'object') {
      module.exports = factory(window.jQuery);
    } else if (typeof define === 'function' && define.amd) {
      define(['jquery'], factory);
    } else if (window.jQuery && !window.jQuery.fn.colorpicker) {
      factory(window.jQuery);
    }
  }
  (function($) {
    'use strict';

    // Color object
    var Color = function(val, customColors) {
      this.value = {
        h: 0,
        s: 0,
        b: 0,
        a: 1
      };
      this.origFormat = null; // original string format
      if (customColors) {
        $.extend(this.colors, customColors);
      }
      if (val) {
        if (val.toLowerCase !== undefined) {
          // cast to string
          val = val + '';
          this.setColor(val);
        } else if (val.h !== undefined) {
          this.value = val;
        }
      }
    };

    Color.prototype = {
      constructor: Color,
      // 140 predefined colors from the HTML Colors spec
      colors: {
        "aliceblue": "#f0f8ff",
        "antiquewhite": "#faebd7",
        "aqua": "#00ffff",
        "aquamarine": "#7fffd4",
        "azure": "#f0ffff",
        "beige": "#f5f5dc",
        "bisque": "#ffe4c4",
        "black": "#000000",
        "blanchedalmond": "#ffebcd",
        "blue": "#0000ff",
        "blueviolet": "#8a2be2",
        "brown": "#a52a2a",
        "burlywood": "#deb887",
        "cadetblue": "#5f9ea0",
        "chartreuse": "#7fff00",
        "chocolate": "#d2691e",
        "coral": "#ff7f50",
        "cornflowerblue": "#6495ed",
        "cornsilk": "#fff8dc",
        "crimson": "#dc143c",
        "cyan": "#00ffff",
        "darkblue": "#00008b",
        "darkcyan": "#008b8b",
        "darkgoldenrod": "#b8860b",
        "darkgray": "#a9a9a9",
        "darkgreen": "#006400",
        "darkkhaki": "#bdb76b",
        "darkmagenta": "#8b008b",
        "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00",
        "darkorchid": "#9932cc",
        "darkred": "#8b0000",
        "darksalmon": "#e9967a",
        "darkseagreen": "#8fbc8f",
        "darkslateblue": "#483d8b",
        "darkslategray": "#2f4f4f",
        "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3",
        "deeppink": "#ff1493",
        "deepskyblue": "#00bfff",
        "dimgray": "#696969",
        "dodgerblue": "#1e90ff",
        "firebrick": "#b22222",
        "floralwhite": "#fffaf0",
        "forestgreen": "#228b22",
        "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc",
        "ghostwhite": "#f8f8ff",
        "gold": "#ffd700",
        "goldenrod": "#daa520",
        "gray": "#808080",
        "green": "#008000",
        "greenyellow": "#adff2f",
        "honeydew": "#f0fff0",
        "hotpink": "#ff69b4",
        "indianred": "#cd5c5c",
        "indigo": "#4b0082",
        "ivory": "#fffff0",
        "khaki": "#f0e68c",
        "lavender": "#e6e6fa",
        "lavenderblush": "#fff0f5",
        "lawngreen": "#7cfc00",
        "lemonchiffon": "#fffacd",
        "lightblue": "#add8e6",
        "lightcoral": "#f08080",
        "lightcyan": "#e0ffff",
        "lightgoldenrodyellow": "#fafad2",
        "lightgrey": "#d3d3d3",
        "lightgreen": "#90ee90",
        "lightpink": "#ffb6c1",
        "lightsalmon": "#ffa07a",
        "lightseagreen": "#20b2aa",
        "lightskyblue": "#87cefa",
        "lightslategray": "#778899",
        "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0",
        "lime": "#00ff00",
        "limegreen": "#32cd32",
        "linen": "#faf0e6",
        "magenta": "#ff00ff",
        "maroon": "#800000",
        "mediumaquamarine": "#66cdaa",
        "mediumblue": "#0000cd",
        "mediumorchid": "#ba55d3",
        "mediumpurple": "#9370d8",
        "mediumseagreen": "#3cb371",
        "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a",
        "mediumturquoise": "#48d1cc",
        "mediumvioletred": "#c71585",
        "midnightblue": "#191970",
        "mintcream": "#f5fffa",
        "mistyrose": "#ffe4e1",
        "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead",
        "navy": "#000080",
        "oldlace": "#fdf5e6",
        "olive": "#808000",
        "olivedrab": "#6b8e23",
        "orange": "#ffa500",
        "orangered": "#ff4500",
        "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa",
        "palegreen": "#98fb98",
        "paleturquoise": "#afeeee",
        "palevioletred": "#d87093",
        "papayawhip": "#ffefd5",
        "peachpuff": "#ffdab9",
        "peru": "#cd853f",
        "pink": "#ffc0cb",
        "plum": "#dda0dd",
        "powderblue": "#b0e0e6",
        "purple": "#800080",
        "red": "#ff0000",
        "rosybrown": "#bc8f8f",
        "royalblue": "#4169e1",
        "saddlebrown": "#8b4513",
        "salmon": "#fa8072",
        "sandybrown": "#f4a460",
        "seagreen": "#2e8b57",
        "seashell": "#fff5ee",
        "sienna": "#a0522d",
        "silver": "#c0c0c0",
        "skyblue": "#87ceeb",
        "slateblue": "#6a5acd",
        "slategray": "#708090",
        "snow": "#fffafa",
        "springgreen": "#00ff7f",
        "steelblue": "#4682b4",
        "tan": "#d2b48c",
        "teal": "#008080",
        "thistle": "#d8bfd8",
        "tomato": "#ff6347",
        "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3",
        "white": "#ffffff",
        "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00",
        "yellowgreen": "#9acd32",
        "transparent": "transparent"
      },
      _sanitizeNumber: function(val) {
        if (typeof val === 'number') {
          return val;
        }
        if (isNaN(val) || (val === null) || (val === '') || (val === undefined)) {
          return 1;
        }
        if (val.toLowerCase !== undefined) {
          return parseFloat(val);
        }
        return 1;
      },
      isTransparent: function(strVal) {
        if (!strVal) {
          return false;
        }
        strVal = strVal.toLowerCase().trim();
        return (strVal === 'transparent') || (strVal.match(/#?00000000/)) || (strVal.match(/(rgba|hsla)\(0,0,0,0?\.?0\)/));
      },
      rgbaIsTransparent: function(rgba) {
        return ((rgba.r === 0) && (rgba.g === 0) && (rgba.b === 0) && (rgba.a === 0));
      },
      //parse a string to HSB
      setColor: function(strVal) {
        strVal = strVal.toLowerCase().trim();
        if (strVal) {
          if (this.isTransparent(strVal)) {
            this.value = {
              h: 0,
              s: 0,
              b: 0,
              a: 0
            };
          } else {
            this.value = this.stringToHSB(strVal) || {
              h: 0,
              s: 0,
              b: 0,
              a: 1
            }; // if parser fails, defaults to black
          }
        }
      },
      stringToHSB: function(strVal) {
        strVal = strVal.toLowerCase();
        var alias;
        if (typeof this.colors[strVal] !== 'undefined') {
          strVal = this.colors[strVal];
          alias = 'alias';
        }
        var that = this,
          result = false;
        $.each(this.stringParsers, function(i, parser) {
          var match = parser.re.exec(strVal),
            values = match && parser.parse.apply(that, [match]),
            format = alias || parser.format || 'rgba';
          if (values) {
            if (format.match(/hsla?/)) {
              result = that.RGBtoHSB.apply(that, that.HSLtoRGB.apply(that, values));
            } else {
              result = that.RGBtoHSB.apply(that, values);
            }
            that.origFormat = format;
            return false;
          }
          return true;
        });
        return result;
      },
      setHue: function(h) {
        this.value.h = 1 - h;
      },
      setSaturation: function(s) {
        this.value.s = s;
      },
      setBrightness: function(b) {
        this.value.b = 1 - b;
      },
      setAlpha: function(a) {
        this.value.a = parseInt((1 - a) * 100, 10) / 100;
      },
      toRGB: function(h, s, b, a) {
        if (!h) {
          h = this.value.h;
          s = this.value.s;
          b = this.value.b;
        }
        h *= 360;
        var R, G, B, X, C;
        h = (h % 360) / 60;
        C = b * s;
        X = C * (1 - Math.abs(h % 2 - 1));
        R = G = B = b - C;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];
        return {
          r: Math.round(R * 255),
          g: Math.round(G * 255),
          b: Math.round(B * 255),
          a: a || this.value.a
        };
      },
      toHex: function(h, s, b, a) {
        var rgb = this.toRGB(h, s, b, a);
        if (this.rgbaIsTransparent(rgb)) {
          return 'transparent';
        }
        return '#' + ((1 << 24) | (parseInt(rgb.r) << 16) | (parseInt(rgb.g) << 8) | parseInt(rgb.b)).toString(16).substr(1);
      },
      toHSL: function(h, s, b, a) {
        h = h || this.value.h;
        s = s || this.value.s;
        b = b || this.value.b;
        a = a || this.value.a;

        var H = h,
          L = (2 - s) * b,
          S = s * b;
        if (L > 0 && L <= 1) {
          S /= L;
        } else {
          S /= 2 - L;
        }
        L /= 2;
        if (S > 1) {
          S = 1;
        }
        return {
          h: isNaN(H) ? 0 : H,
          s: isNaN(S) ? 0 : S,
          l: isNaN(L) ? 0 : L,
          a: isNaN(a) ? 0 : a
        };
      },
      toAlias: function(r, g, b, a) {
        var rgb = this.toHex(r, g, b, a);
        for (var alias in this.colors) {
          if (this.colors[alias] === rgb) {
            return alias;
          }
        }
        return false;
      },
      RGBtoHSB: function(r, g, b, a) {
        r /= 255;
        g /= 255;
        b /= 255;

        var H, S, V, C;
        V = Math.max(r, g, b);
        C = V - Math.min(r, g, b);
        H = (C === 0 ? null :
          V === r ? (g - b) / C :
          V === g ? (b - r) / C + 2 :
          (r - g) / C + 4
        );
        H = ((H + 360) % 6) * 60 / 360;
        S = C === 0 ? 0 : C / V;
        return {
          h: this._sanitizeNumber(H),
          s: S,
          b: V,
          a: this._sanitizeNumber(a)
        };
      },
      HueToRGB: function(p, q, h) {
        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
        if ((h * 6) < 1) {
          return p + (q - p) * h * 6;
        } else if ((h * 2) < 1) {
          return q;
        } else if ((h * 3) < 2) {
          return p + (q - p) * ((2 / 3) - h) * 6;
        } else {
          return p;
        }
      },
      HSLtoRGB: function(h, s, l, a) {
        if (s < 0) {
          s = 0;
        }
        var q;
        if (l <= 0.5) {
          q = l * (1 + s);
        } else {
          q = l + s - (l * s);
        }

        var p = 2 * l - q;

        var tr = h + (1 / 3);
        var tg = h;
        var tb = h - (1 / 3);

        var r = Math.round(this.HueToRGB(p, q, tr) * 255);
        var g = Math.round(this.HueToRGB(p, q, tg) * 255);
        var b = Math.round(this.HueToRGB(p, q, tb) * 255);
        return [r, g, b, this._sanitizeNumber(a)];
      },
      toString: function(format) {
        format = format || 'rgba';
        var c = false;
        switch (format) {
          case 'rgb':
            {
              c = this.toRGB();
              if (this.rgbaIsTransparent(c)) {
                return 'transparent';
              }
              return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
            }
            break;
          case 'rgba':
            {
              c = this.toRGB();
              return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + c.a + ')';
            }
            break;
          case 'hsl':
            {
              c = this.toHSL();
              return 'hsl(' + Math.round(c.h * 360) + ',' + Math.round(c.s * 100) + '%,' + Math.round(c.l * 100) + '%)';
            }
            break;
          case 'hsla':
            {
              c = this.toHSL();
              return 'hsla(' + Math.round(c.h * 360) + ',' + Math.round(c.s * 100) + '%,' + Math.round(c.l * 100) + '%,' + c.a + ')';
            }
            break;
          case 'hex':
            {
              return this.toHex();
            }
            break;
          case 'alias':
            return this.toAlias() || this.toHex();
          default:
            {
              return c;
            }
            break;
        }
      },
      // a set of RE's that can match strings and generate color tuples.
      // from John Resig color plugin
      // https://github.com/jquery/jquery-color/
      stringParsers: [{
        re: /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*?\)/,
        format: 'rgb',
        parse: function(execResult) {
          return [
            execResult[1],
            execResult[2],
            execResult[3],
            1
          ];
        }
      }, {
        re: /rgb\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*?\)/,
        format: 'rgb',
        parse: function(execResult) {
          return [
            2.55 * execResult[1],
            2.55 * execResult[2],
            2.55 * execResult[3],
            1
          ];
        }
      }, {
        re: /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
        format: 'rgba',
        parse: function(execResult) {
          return [
            execResult[1],
            execResult[2],
            execResult[3],
            execResult[4]
          ];
        }
      }, {
        re: /rgba\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
        format: 'rgba',
        parse: function(execResult) {
          return [
            2.55 * execResult[1],
            2.55 * execResult[2],
            2.55 * execResult[3],
            execResult[4]
          ];
        }
      }, {
        re: /hsl\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*?\)/,
        format: 'hsl',
        parse: function(execResult) {
          return [
            execResult[1] / 360,
            execResult[2] / 100,
            execResult[3] / 100,
            execResult[4]
          ];
        }
      }, {
        re: /hsla\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
        format: 'hsla',
        parse: function(execResult) {
          return [
            execResult[1] / 360,
            execResult[2] / 100,
            execResult[3] / 100,
            execResult[4]
          ];
        }
      }, {
        re: /#?([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
        format: 'hex',
        parse: function(execResult) {
          return [
            parseInt(execResult[1], 16),
            parseInt(execResult[2], 16),
            parseInt(execResult[3], 16),
            1
          ];
        }
      }, {
        re: /#?([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
        format: 'hex',
        parse: function(execResult) {
          return [
            parseInt(execResult[1] + execResult[1], 16),
            parseInt(execResult[2] + execResult[2], 16),
            parseInt(execResult[3] + execResult[3], 16),
            1
          ];
        }
      }],
      colorNameToHex: function(name) {
        if (typeof this.colors[name.toLowerCase()] !== 'undefined') {
          return this.colors[name.toLowerCase()];
        }
        return false;
      }
    };


    var defaults = {
      horizontal: false, // horizontal mode layout ?
      inline: false, //forces to show the colorpicker as an inline element
      color: false, //forces a color
      format: false, //forces a format
      input: 'input', // children input selector
      container: false, // container selector
      component: '.add-on, .input-group-addon', // children component selector
      sliders: {
        saturation: {
          maxLeft: 100,
          maxTop: 100,
          callLeft: 'setSaturation',
          callTop: 'setBrightness'
        },
        hue: {
          maxLeft: 0,
          maxTop: 100,
          callLeft: false,
          callTop: 'setHue'
        },
        alpha: {
          maxLeft: 0,
          maxTop: 100,
          callLeft: false,
          callTop: 'setAlpha'
        }
      },
      slidersHorz: {
        saturation: {
          maxLeft: 100,
          maxTop: 100,
          callLeft: 'setSaturation',
          callTop: 'setBrightness'
        },
        hue: {
          maxLeft: 100,
          maxTop: 0,
          callLeft: 'setHue',
          callTop: false
        },
        alpha: {
          maxLeft: 100,
          maxTop: 0,
          callLeft: 'setAlpha',
          callTop: false
        }
      },
      template: '<div class="colorpicker dropdown-menu">' +
        '<div class="colorpicker-saturation"><i><b></b></i></div>' +
        '<div class="colorpicker-hue"><i></i></div>' +
        '<div class="colorpicker-alpha"><i></i></div>' +
        '<div class="colorpicker-color"><div /></div>' +
        '<div class="colorpicker-selectors"></div>' +
        '</div>',
      align: 'right',
      customClass: null,
      colorSelectors: null
    };

    var Colorpicker = function(element, options) {
      this.element = $(element).addClass('colorpicker-element');
      this.options = $.extend(true, {}, defaults, this.element.data(), options);
      this.component = this.options.component;
      this.component = (this.component !== false) ? this.element.find(this.component) : false;
      if (this.component && (this.component.length === 0)) {
        this.component = false;
      }
      this.container = (this.options.container === true) ? this.element : this.options.container;
      this.container = (this.container !== false) ? $(this.container) : false;

      // Is the element an input? Should we search inside for any input?
      this.input = this.element.is('input') ? this.element : (this.options.input ?
        this.element.find(this.options.input) : false);
      if (this.input && (this.input.length === 0)) {
        this.input = false;
      }
      // Set HSB color
      this.color = new Color(this.options.color !== false ? this.options.color : this.getValue(), this.options.colorSelectors);
      this.format = this.options.format !== false ? this.options.format : this.color.origFormat;

      // Setup picker
      this.picker = $(this.options.template);
      if (this.options.customClass) {
        this.picker.addClass(this.options.customClass);
      }
      if (this.options.inline) {
        this.picker.addClass('colorpicker-inline colorpicker-visible');
      } else {
        this.picker.addClass('colorpicker-hidden');
      }
      if (this.options.horizontal) {
        this.picker.addClass('colorpicker-horizontal');
      }
      if (this.format === 'rgba' || this.format === 'hsla' || this.options.format === false) {
        this.picker.addClass('colorpicker-with-alpha');
      }
      if (this.options.align === 'right') {
        this.picker.addClass('colorpicker-right');
      }
      if (this.options.colorSelectors) {
        var colorpicker = this;
        $.each(this.options.colorSelectors, function(name, color) {
          var $btn = $('<i />').css('background-color', color).data('class', name);
          $btn.click(function() {
            colorpicker.setValue($(this).css('background-color'));
          });
          colorpicker.picker.find('.colorpicker-selectors').append($btn);
        });
        this.picker.find('.colorpicker-selectors').show();
      }
      this.picker.on('mousedown.colorpicker touchstart.colorpicker', $.proxy(this.mousedown, this));
      this.picker.appendTo(this.container ? this.container : $('body'));

      // Bind events
      if (this.input !== false) {
        this.input.on({
          'keyup.colorpicker': $.proxy(this.keyup, this)
        });
        this.input.on({
          'change.colorpicker': $.proxy(this.change, this)
        });
        if (this.component === false) {
          this.element.on({
            'focus.colorpicker': $.proxy(this.show, this)
          });
        }
        if (this.options.inline === false) {
          this.element.on({
            'focusout.colorpicker': $.proxy(this.hide, this)
          });
        }
      }

      if (this.component !== false) {
        this.component.on({
          'click.colorpicker': $.proxy(this.show, this)
        });
      }

      if ((this.input === false) && (this.component === false)) {
        this.element.on({
          'click.colorpicker': $.proxy(this.show, this)
        });
      }

      // for HTML5 input[type='color']
      if ((this.input !== false) && (this.component !== false) && (this.input.attr('type') === 'color')) {

        this.input.on({
          'click.colorpicker': $.proxy(this.show, this),
          'focus.colorpicker': $.proxy(this.show, this)
        });
      }
      this.update();

      $($.proxy(function() {
        this.element.trigger('create');
      }, this));
    };

    Colorpicker.Color = Color;

    Colorpicker.prototype = {
      constructor: Colorpicker,
      destroy: function() {
        this.picker.remove();
        this.element.removeData('colorpicker').off('.colorpicker');
        if (this.input !== false) {
          this.input.off('.colorpicker');
        }
        if (this.component !== false) {
          this.component.off('.colorpicker');
        }
        this.element.removeClass('colorpicker-element');
        this.element.trigger({
          type: 'destroy'
        });
      },
      reposition: function() {
        if (this.options.inline !== false || this.options.container) {
          return false;
        }
        var type = this.container && this.container[0] !== document.body ? 'position' : 'offset';
        var element = this.component || this.element;
        var offset = element[type]();
        if (this.options.align === 'right') {
          offset.left -= this.picker.outerWidth() - element.outerWidth();
        }
        this.picker.css({
          top: offset.top + element.outerHeight(),
          left: offset.left
        });
      },
      show: function(e) {
        if (this.isDisabled()) {
          return false;
        }
        this.picker.addClass('colorpicker-visible').removeClass('colorpicker-hidden');
        this.reposition();
        $(window).on('resize.colorpicker', $.proxy(this.reposition, this));
        if (e && (!this.hasInput() || this.input.attr('type') === 'color')) {
          if (e.stopPropagation && e.preventDefault) {
            e.stopPropagation();
            e.preventDefault();
          }
        }
        if (this.options.inline === false) {
          $(window.document).on({
            'mousedown.colorpicker': $.proxy(this.hide, this)
          });
        }
        this.element.trigger({
          type: 'showPicker',
          color: this.color
        });
      },
      hide: function() {
        this.picker.addClass('colorpicker-hidden').removeClass('colorpicker-visible');
        $(window).off('resize.colorpicker', this.reposition);
        $(document).off({
          'mousedown.colorpicker': this.hide
        });
        this.update();
        this.element.trigger({
          type: 'hidePicker',
          color: this.color
        });
      },
      updateData: function(val) {
        val = val || this.color.toString(this.format);
        this.element.data('color', val);
        return val;
      },
      updateInput: function(val) {
        val = val || this.color.toString(this.format);
        if (this.input !== false) {
          if (this.options.colorSelectors) {
            var color = new Color(val, this.options.colorSelectors);
            var alias = color.toAlias();
            if (typeof this.options.colorSelectors[alias] !== 'undefined') {
              val = alias;
            }
          }
          this.input.prop('value', val);
        }
        return val;
      },
      updatePicker: function(val) {
        if (val !== undefined) {
          this.color = new Color(val, this.options.colorSelectors);
        }
        var sl = (this.options.horizontal === false) ? this.options.sliders : this.options.slidersHorz;
        var icns = this.picker.find('i');
        if (icns.length === 0) {
          return;
        }
        if (this.options.horizontal === false) {
          sl = this.options.sliders;
          icns.eq(1).css('top', sl.hue.maxTop * (1 - this.color.value.h)).end()
            .eq(2).css('top', sl.alpha.maxTop * (1 - this.color.value.a));
        } else {
          sl = this.options.slidersHorz;
          icns.eq(1).css('left', sl.hue.maxLeft * (1 - this.color.value.h)).end()
            .eq(2).css('left', sl.alpha.maxLeft * (1 - this.color.value.a));
        }
        icns.eq(0).css({
          'top': sl.saturation.maxTop - this.color.value.b * sl.saturation.maxTop,
          'left': this.color.value.s * sl.saturation.maxLeft
        });
        this.picker.find('.colorpicker-saturation').css('backgroundColor', this.color.toHex(this.color.value.h, 1, 1, 1));
        this.picker.find('.colorpicker-alpha').css('backgroundColor', this.color.toHex());
        this.picker.find('.colorpicker-color, .colorpicker-color div').css('backgroundColor', this.color.toString(this.format));
        return val;
      },
      updateComponent: function(val) {
        val = val || this.color.toString(this.format);
        if (this.component !== false) {
          var icn = this.component.find('i').eq(0);
          if (icn.length > 0) {
            icn.css({
              'backgroundColor': val
            });
          } else {
            this.component.css({
              'backgroundColor': val
            });
          }
        }
        return val;
      },
      update: function(force) {
        var val;
        if ((this.getValue(false) !== false) || (force === true)) {
          // Update input/data only if the current value is not empty
          val = this.updateComponent();
          this.updateInput(val);
          this.updateData(val);
          this.updatePicker(); // only update picker if value is not empty
        }
        return val;

      },
      setValue: function(val) { // set color manually
        this.color = new Color(val, this.options.colorSelectors);
        this.update(true);
        this.element.trigger({
          type: 'changeColor',
          color: this.color,
          value: val
        });
      },
      getValue: function(defaultValue) {
        defaultValue = (defaultValue === undefined) ? '#000000' : defaultValue;
        var val;
        if (this.hasInput()) {
          val = this.input.val();
        } else {
          val = this.element.data('color');
        }
        if ((val === undefined) || (val === '') || (val === null)) {
          // if not defined or empty, return default
          val = defaultValue;
        }
        return val;
      },
      hasInput: function() {
        return (this.input !== false);
      },
      isDisabled: function() {
        if (this.hasInput()) {
          return (this.input.prop('disabled') === true);
        }
        return false;
      },
      disable: function() {
        if (this.hasInput()) {
          this.input.prop('disabled', true);
          this.element.trigger({
            type: 'disable',
            color: this.color,
            value: this.getValue()
          });
          return true;
        }
        return false;
      },
      enable: function() {
        if (this.hasInput()) {
          this.input.prop('disabled', false);
          this.element.trigger({
            type: 'enable',
            color: this.color,
            value: this.getValue()
          });
          return true;
        }
        return false;
      },
      currentSlider: null,
      mousePointer: {
        left: 0,
        top: 0
      },
      mousedown: function(e) {
        if (!e.pageX && !e.pageY && e.originalEvent) {
          e.pageX = e.originalEvent.touches[0].pageX;
          e.pageY = e.originalEvent.touches[0].pageY;
        }
        e.stopPropagation();
        e.preventDefault();

        var target = $(e.target);

        //detect the slider and set the limits and callbacks
        var zone = target.closest('div');
        var sl = this.options.horizontal ? this.options.slidersHorz : this.options.sliders;
        if (!zone.is('.colorpicker')) {
          if (zone.is('.colorpicker-saturation')) {
            this.currentSlider = $.extend({}, sl.saturation);
          } else if (zone.is('.colorpicker-hue')) {
            this.currentSlider = $.extend({}, sl.hue);
          } else if (zone.is('.colorpicker-alpha')) {
            this.currentSlider = $.extend({}, sl.alpha);
          } else {
            return false;
          }
          var offset = zone.offset();
          //reference to guide's style
          this.currentSlider.guide = zone.find('i')[0].style;
          this.currentSlider.left = e.pageX - offset.left;
          this.currentSlider.top = e.pageY - offset.top;
          this.mousePointer = {
            left: e.pageX,
            top: e.pageY
          };
          //trigger mousemove to move the guide to the current position
          $(document).on({
            'mousemove.colorpicker': $.proxy(this.mousemove, this),
            'touchmove.colorpicker': $.proxy(this.mousemove, this),
            'mouseup.colorpicker': $.proxy(this.mouseup, this),
            'touchend.colorpicker': $.proxy(this.mouseup, this)
          }).trigger('mousemove');
        }
        return false;
      },
      mousemove: function(e) {
        if (!e.pageX && !e.pageY && e.originalEvent) {
          e.pageX = e.originalEvent.touches[0].pageX;
          e.pageY = e.originalEvent.touches[0].pageY;
        }
        e.stopPropagation();
        e.preventDefault();
        var left = Math.max(
          0,
          Math.min(
            this.currentSlider.maxLeft,
            this.currentSlider.left + ((e.pageX || this.mousePointer.left) - this.mousePointer.left)
          )
        );
        var top = Math.max(
          0,
          Math.min(
            this.currentSlider.maxTop,
            this.currentSlider.top + ((e.pageY || this.mousePointer.top) - this.mousePointer.top)
          )
        );
        this.currentSlider.guide.left = left + 'px';
        this.currentSlider.guide.top = top + 'px';
        if (this.currentSlider.callLeft) {
          this.color[this.currentSlider.callLeft].call(this.color, left / this.currentSlider.maxLeft);
        }
        if (this.currentSlider.callTop) {
          this.color[this.currentSlider.callTop].call(this.color, top / this.currentSlider.maxTop);
        }
        // Change format dynamically
        // Only occurs if user choose the dynamic format by
        // setting option format to false
        if (this.currentSlider.callTop === 'setAlpha' && this.options.format === false) {

          // Converting from hex / rgb to rgba
          if (this.color.value.a !== 1) {
            this.format = 'rgba';
            this.color.origFormat = 'rgba';
          }

          // Converting from rgba to hex
          else {
            this.format = 'hex';
            this.color.origFormat = 'hex';
          }
        }
        this.update(true);

        this.element.trigger({
          type: 'changeColor',
          color: this.color
        });
        return false;
      },
      mouseup: function(e) {
        e.stopPropagation();
        e.preventDefault();
        $(document).off({
          'mousemove.colorpicker': this.mousemove,
          'touchmove.colorpicker': this.mousemove,
          'mouseup.colorpicker': this.mouseup,
          'touchend.colorpicker': this.mouseup
        });
        return false;
      },
      change: function(e) {
        this.keyup(e);
      },
      keyup: function(e) {
        if ((e.keyCode === 38)) {
          if (this.color.value.a < 1) {
            this.color.value.a = Math.round((this.color.value.a + 0.01) * 100) / 100;
          }
          this.update(true);
        } else if ((e.keyCode === 40)) {
          if (this.color.value.a > 0) {
            this.color.value.a = Math.round((this.color.value.a - 0.01) * 100) / 100;
          }
          this.update(true);
        } else {
          this.color = new Color(this.input.val(), this.options.colorSelectors);
          // Change format dynamically
          // Only occurs if user choose the dynamic format by
          // setting option format to false
          if (this.color.origFormat && this.options.format === false) {
            this.format = this.color.origFormat;
          }
          if (this.getValue(false) !== false) {
            this.updateData();
            this.updateComponent();
            this.updatePicker();
          }
        }
        this.element.trigger({
          type: 'changeColor',
          color: this.color,
          value: this.input.val()
        });
      }
    };

    $.colorpicker = Colorpicker;

    $.fn.colorpicker = function(option) {
      var pickerArgs = arguments,
        rv;

      var $returnValue = this.each(function() {
        var $this = $(this),
          inst = $this.data('colorpicker'),
          options = ((typeof option === 'object') ? option : {});
        if ((!inst) && (typeof option !== 'string')) {
          $this.data('colorpicker', new Colorpicker(this, options));
        } else {
          if (typeof option === 'string') {
            rv = inst[option].apply(inst, Array.prototype.slice.call(pickerArgs, 1));
          }
        }
      });
      if (option === 'getValue') {
        return rv;
      }
      return $returnValue;
    };

    $.fn.colorpicker.constructor = Colorpicker;

  }));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJvb3RzdHJhcC1jb2xvcnBpY2tlci5qcyJdLCJuYW1lcyI6WyJmYWN0b3J5IiwiZXhwb3J0cyIsIm1vZHVsZSIsIndpbmRvdyIsImpRdWVyeSIsImRlZmluZSIsImFtZCIsImZuIiwiY29sb3JwaWNrZXIiLCIkIiwiQ29sb3IiLCJ2YWwiLCJjdXN0b21Db2xvcnMiLCJ0aGlzIiwidmFsdWUiLCJoIiwicyIsImIiLCJhIiwib3JpZ0Zvcm1hdCIsImV4dGVuZCIsImNvbG9ycyIsInVuZGVmaW5lZCIsInRvTG93ZXJDYXNlIiwic2V0Q29sb3IiLCJwcm90b3R5cGUiLCJjb25zdHJ1Y3RvciIsImFsaWNlYmx1ZSIsImFudGlxdWV3aGl0ZSIsImFxdWEiLCJhcXVhbWFyaW5lIiwiYXp1cmUiLCJiZWlnZSIsImJpc3F1ZSIsImJsYWNrIiwiYmxhbmNoZWRhbG1vbmQiLCJibHVlIiwiYmx1ZXZpb2xldCIsImJyb3duIiwiYnVybHl3b29kIiwiY2FkZXRibHVlIiwiY2hhcnRyZXVzZSIsImNob2NvbGF0ZSIsImNvcmFsIiwiY29ybmZsb3dlcmJsdWUiLCJjb3Juc2lsayIsImNyaW1zb24iLCJjeWFuIiwiZGFya2JsdWUiLCJkYXJrY3lhbiIsImRhcmtnb2xkZW5yb2QiLCJkYXJrZ3JheSIsImRhcmtncmVlbiIsImRhcmtraGFraSIsImRhcmttYWdlbnRhIiwiZGFya29saXZlZ3JlZW4iLCJkYXJrb3JhbmdlIiwiZGFya29yY2hpZCIsImRhcmtyZWQiLCJkYXJrc2FsbW9uIiwiZGFya3NlYWdyZWVuIiwiZGFya3NsYXRlYmx1ZSIsImRhcmtzbGF0ZWdyYXkiLCJkYXJrdHVycXVvaXNlIiwiZGFya3Zpb2xldCIsImRlZXBwaW5rIiwiZGVlcHNreWJsdWUiLCJkaW1ncmF5IiwiZG9kZ2VyYmx1ZSIsImZpcmVicmljayIsImZsb3JhbHdoaXRlIiwiZm9yZXN0Z3JlZW4iLCJmdWNoc2lhIiwiZ2FpbnNib3JvIiwiZ2hvc3R3aGl0ZSIsImdvbGQiLCJnb2xkZW5yb2QiLCJncmF5IiwiZ3JlZW4iLCJncmVlbnllbGxvdyIsImhvbmV5ZGV3IiwiaG90cGluayIsImluZGlhbnJlZCIsImluZGlnbyIsIml2b3J5Iiwia2hha2kiLCJsYXZlbmRlciIsImxhdmVuZGVyYmx1c2giLCJsYXduZ3JlZW4iLCJsZW1vbmNoaWZmb24iLCJsaWdodGJsdWUiLCJsaWdodGNvcmFsIiwibGlnaHRjeWFuIiwibGlnaHRnb2xkZW5yb2R5ZWxsb3ciLCJsaWdodGdyZXkiLCJsaWdodGdyZWVuIiwibGlnaHRwaW5rIiwibGlnaHRzYWxtb24iLCJsaWdodHNlYWdyZWVuIiwibGlnaHRza3libHVlIiwibGlnaHRzbGF0ZWdyYXkiLCJsaWdodHN0ZWVsYmx1ZSIsImxpZ2h0eWVsbG93IiwibGltZSIsImxpbWVncmVlbiIsImxpbmVuIiwibWFnZW50YSIsIm1hcm9vbiIsIm1lZGl1bWFxdWFtYXJpbmUiLCJtZWRpdW1ibHVlIiwibWVkaXVtb3JjaGlkIiwibWVkaXVtcHVycGxlIiwibWVkaXVtc2VhZ3JlZW4iLCJtZWRpdW1zbGF0ZWJsdWUiLCJtZWRpdW1zcHJpbmdncmVlbiIsIm1lZGl1bXR1cnF1b2lzZSIsIm1lZGl1bXZpb2xldHJlZCIsIm1pZG5pZ2h0Ymx1ZSIsIm1pbnRjcmVhbSIsIm1pc3R5cm9zZSIsIm1vY2Nhc2luIiwibmF2YWpvd2hpdGUiLCJuYXZ5Iiwib2xkbGFjZSIsIm9saXZlIiwib2xpdmVkcmFiIiwib3JhbmdlIiwib3JhbmdlcmVkIiwib3JjaGlkIiwicGFsZWdvbGRlbnJvZCIsInBhbGVncmVlbiIsInBhbGV0dXJxdW9pc2UiLCJwYWxldmlvbGV0cmVkIiwicGFwYXlhd2hpcCIsInBlYWNocHVmZiIsInBlcnUiLCJwaW5rIiwicGx1bSIsInBvd2RlcmJsdWUiLCJwdXJwbGUiLCJyZWQiLCJyb3N5YnJvd24iLCJyb3lhbGJsdWUiLCJzYWRkbGVicm93biIsInNhbG1vbiIsInNhbmR5YnJvd24iLCJzZWFncmVlbiIsInNlYXNoZWxsIiwic2llbm5hIiwic2lsdmVyIiwic2t5Ymx1ZSIsInNsYXRlYmx1ZSIsInNsYXRlZ3JheSIsInNub3ciLCJzcHJpbmdncmVlbiIsInN0ZWVsYmx1ZSIsInRhbiIsInRlYWwiLCJ0aGlzdGxlIiwidG9tYXRvIiwidHVycXVvaXNlIiwidmlvbGV0Iiwid2hlYXQiLCJ3aGl0ZSIsIndoaXRlc21va2UiLCJ5ZWxsb3ciLCJ5ZWxsb3dncmVlbiIsInRyYW5zcGFyZW50IiwiX3Nhbml0aXplTnVtYmVyIiwiaXNOYU4iLCJwYXJzZUZsb2F0IiwiaXNUcmFuc3BhcmVudCIsInN0clZhbCIsInRyaW0iLCJtYXRjaCIsInJnYmFJc1RyYW5zcGFyZW50IiwicmdiYSIsInIiLCJnIiwic3RyaW5nVG9IU0IiLCJhbGlhcyIsInRoYXQiLCJyZXN1bHQiLCJlYWNoIiwic3RyaW5nUGFyc2VycyIsImkiLCJwYXJzZXIiLCJyZSIsImV4ZWMiLCJ2YWx1ZXMiLCJwYXJzZSIsImFwcGx5IiwiZm9ybWF0IiwiUkdCdG9IU0IiLCJIU0x0b1JHQiIsInNldEh1ZSIsInNldFNhdHVyYXRpb24iLCJzZXRCcmlnaHRuZXNzIiwic2V0QWxwaGEiLCJwYXJzZUludCIsInRvUkdCIiwiUiIsIkciLCJCIiwiWCIsIkMiLCJNYXRoIiwiYWJzIiwicm91bmQiLCJ0b0hleCIsInJnYiIsInRvU3RyaW5nIiwic3Vic3RyIiwidG9IU0wiLCJIIiwiTCIsIlMiLCJsIiwidG9BbGlhcyIsIlYiLCJtYXgiLCJtaW4iLCJIdWVUb1JHQiIsInAiLCJxIiwidHIiLCJ0ZyIsInRiIiwiYyIsImV4ZWNSZXN1bHQiLCJjb2xvck5hbWVUb0hleCIsIm5hbWUiLCJkZWZhdWx0cyIsImhvcml6b250YWwiLCJpbmxpbmUiLCJjb2xvciIsImlucHV0IiwiY29udGFpbmVyIiwiY29tcG9uZW50Iiwic2xpZGVycyIsInNhdHVyYXRpb24iLCJtYXhMZWZ0IiwibWF4VG9wIiwiY2FsbExlZnQiLCJjYWxsVG9wIiwiaHVlIiwiYWxwaGEiLCJzbGlkZXJzSG9yeiIsInRlbXBsYXRlIiwiYWxpZ24iLCJjdXN0b21DbGFzcyIsImNvbG9yU2VsZWN0b3JzIiwiQ29sb3JwaWNrZXIiLCJlbGVtZW50Iiwib3B0aW9ucyIsImFkZENsYXNzIiwiZGF0YSIsImZpbmQiLCJsZW5ndGgiLCJpcyIsImdldFZhbHVlIiwicGlja2VyIiwiJGJ0biIsImNzcyIsImNsaWNrIiwic2V0VmFsdWUiLCJhcHBlbmQiLCJzaG93Iiwib24iLCJwcm94eSIsIm1vdXNlZG93biIsImFwcGVuZFRvIiwia2V5dXAuY29sb3JwaWNrZXIiLCJrZXl1cCIsImNoYW5nZS5jb2xvcnBpY2tlciIsImNoYW5nZSIsImZvY3VzLmNvbG9ycGlja2VyIiwiZm9jdXNvdXQuY29sb3JwaWNrZXIiLCJoaWRlIiwiY2xpY2suY29sb3JwaWNrZXIiLCJhdHRyIiwidXBkYXRlIiwidHJpZ2dlciIsImRlc3Ryb3kiLCJyZW1vdmUiLCJyZW1vdmVEYXRhIiwib2ZmIiwicmVtb3ZlQ2xhc3MiLCJ0eXBlIiwicmVwb3NpdGlvbiIsImRvY3VtZW50IiwiYm9keSIsIm9mZnNldCIsImxlZnQiLCJvdXRlcldpZHRoIiwidG9wIiwib3V0ZXJIZWlnaHQiLCJlIiwiaXNEaXNhYmxlZCIsImhhc0lucHV0Iiwic3RvcFByb3BhZ2F0aW9uIiwicHJldmVudERlZmF1bHQiLCJtb3VzZWRvd24uY29sb3JwaWNrZXIiLCJ1cGRhdGVEYXRhIiwidXBkYXRlSW5wdXQiLCJwcm9wIiwidXBkYXRlUGlja2VyIiwic2wiLCJpY25zIiwiZXEiLCJlbmQiLCJ1cGRhdGVDb21wb25lbnQiLCJpY24iLCJiYWNrZ3JvdW5kQ29sb3IiLCJmb3JjZSIsImRlZmF1bHRWYWx1ZSIsImRpc2FibGUiLCJlbmFibGUiLCJjdXJyZW50U2xpZGVyIiwibW91c2VQb2ludGVyIiwicGFnZVgiLCJwYWdlWSIsIm9yaWdpbmFsRXZlbnQiLCJ0b3VjaGVzIiwidGFyZ2V0Iiwiem9uZSIsImNsb3Nlc3QiLCJndWlkZSIsInN0eWxlIiwibW91c2Vtb3ZlLmNvbG9ycGlja2VyIiwibW91c2Vtb3ZlIiwidG91Y2htb3ZlLmNvbG9ycGlja2VyIiwibW91c2V1cC5jb2xvcnBpY2tlciIsIm1vdXNldXAiLCJ0b3VjaGVuZC5jb2xvcnBpY2tlciIsImNhbGwiLCJrZXlDb2RlIiwib3B0aW9uIiwicnYiLCJwaWNrZXJBcmdzIiwiYXJndW1lbnRzIiwiJHJldHVyblZhbHVlIiwiJHRoaXMiLCJpbnN0IiwiQXJyYXkiLCJzbGljZSJdLCJtYXBwaW5ncyI6IkNBV0MsU0FBU0EsR0FDTixZQUN1QixpQkFBWkMsU0FDVEMsT0FBT0QsUUFBVUQsRUFBUUcsT0FBT0MsUUFDTCxrQkFBWEMsU0FBeUJBLE9BQU9DLElBQ2hERCxRQUFRLFVBQVdMLEdBQ1ZHLE9BQU9DLFNBQVdELE9BQU9DLE9BQU9HLEdBQUdDLGFBQzVDUixFQUFRRyxPQUFPQyxTQUdsQixTQUFTSyxHQUNSLFlBR0EsSUFBSUMsR0FBUSxTQUFTQyxFQUFLQyxHQUN4QkMsS0FBS0MsT0FDSEMsRUFBRyxFQUNIQyxFQUFHLEVBQ0hDLEVBQUcsRUFDSEMsRUFBRyxHQUVMTCxLQUFLTSxXQUFhLEtBQ2RQLEdBQ0ZILEVBQUVXLE9BQU9QLEtBQUtRLE9BQVFULEdBRXBCRCxJQUNzQlcsU0FBcEJYLEVBQUlZLGFBRU5aLEdBQVksR0FDWkUsS0FBS1csU0FBU2IsSUFDS1csU0FBVlgsRUFBSUksSUFDYkYsS0FBS0MsTUFBUUgsSUFLbkJELEdBQU1lLFdBQ0pDLFlBQWFoQixFQUViVyxRQUNFTSxVQUFhLFVBQ2JDLGFBQWdCLFVBQ2hCQyxLQUFRLFVBQ1JDLFdBQWMsVUFDZEMsTUFBUyxVQUNUQyxNQUFTLFVBQ1RDLE9BQVUsVUFDVkMsTUFBUyxVQUNUQyxlQUFrQixVQUNsQkMsS0FBUSxVQUNSQyxXQUFjLFVBQ2RDLE1BQVMsVUFDVEMsVUFBYSxVQUNiQyxVQUFhLFVBQ2JDLFdBQWMsVUFDZEMsVUFBYSxVQUNiQyxNQUFTLFVBQ1RDLGVBQWtCLFVBQ2xCQyxTQUFZLFVBQ1pDLFFBQVcsVUFDWEMsS0FBUSxVQUNSQyxTQUFZLFVBQ1pDLFNBQVksVUFDWkMsY0FBaUIsVUFDakJDLFNBQVksVUFD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LFVBQVcsSUFDbkRuTCxLQUFLbUwsT0FBU25MLEtBQUs4TixNQUFNeE4sWUFFdkJOLEtBQUt1UCxVQUFTLE1BQVcsSUFDM0J2UCxLQUFLa1MsYUFDTGxTLEtBQUswUyxrQkFDTDFTLEtBQUtxUyxpQkFHVHJTLEtBQUtnUCxRQUFRNkIsU0FDWE0sS0FBTSxjQUNOckQsTUFBTzlOLEtBQUs4TixNQUNaN04sTUFBT0QsS0FBSytOLE1BQU1qTyxVQUt4QkYsRUFBRUQsWUFBY29QLEVBRWhCblAsRUFBRUYsR0FBR0MsWUFBYyxTQUFTeVUsR0FDMUIsR0FDRUMsR0FERUMsRUFBYUMsVUFHYkMsRUFBZXhVLEtBQUswSyxLQUFLLFdBQzNCLEdBQUkrSixHQUFRN1UsRUFBRUksTUFDWjBVLEVBQU9ELEVBQU10RixLQUFLLGVBQ2xCRixFQUE4QixnQkFBWG1GLEdBQXVCQSxJQUN0Q00sSUFBNEIsZ0JBQVhOLEdBR0MsZ0JBQVhBLEtBQ1RDLEVBQUtLLEVBQUtOLEdBQVFsSixNQUFNd0osRUFBTUMsTUFBTS9ULFVBQVVnVSxNQUFNVixLQUFLSSxFQUFZLEtBSHZFRyxFQUFNdEYsS0FBSyxjQUFlLEdBQUlKLEdBQVkvTyxLQUFNaVAsS0FPcEQsT0FBZSxhQUFYbUYsRUFDS0MsRUFFRkcsR0FHVDVVLEVBQUVGLEdBQUdDLFlBQVlrQixZQUFja08iLCJmaWxlIjoiYm9vdHN0cmFwLWNvbG9ycGlja2VyLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBCb290c3RyYXAgQ29sb3JwaWNrZXJcbiAqIGh0dHA6Ly9tam9sbmljLmdpdGh1Yi5pby9ib290c3RyYXAtY29sb3JwaWNrZXIvXG4gKlxuICogT3JpZ2luYWxseSB3cml0dGVuIGJ5IChjKSAyMDEyIFN0ZWZhbiBQZXRyZVxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlIHYyLjBcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMC50eHRcbiAqXG4gKiBAdG9kbyBVcGRhdGUgRE9DU1xuICovXG5cbihmdW5jdGlvbihmYWN0b3J5KSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHdpbmRvdy5qUXVlcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICBkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh3aW5kb3cualF1ZXJ5ICYmICF3aW5kb3cualF1ZXJ5LmZuLmNvbG9ycGlja2VyKSB7XG4gICAgICBmYWN0b3J5KHdpbmRvdy5qUXVlcnkpO1xuICAgIH1cbiAgfVxuICAoZnVuY3Rpb24oJCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIENvbG9yIG9iamVjdFxuICAgIHZhciBDb2xvciA9IGZ1bmN0aW9uKHZhbCwgY3VzdG9tQ29sb3JzKSB7XG4gICAgICB0aGlzLnZhbHVlID0ge1xuICAgICAgICBoOiAwLFxuICAgICAgICBzOiAwLFxuICAgICAgICBiOiAwLFxuICAgICAgICBhOiAxXG4gICAgICB9O1xuICAgICAgdGhpcy5vcmlnRm9ybWF0ID0gbnVsbDsgLy8gb3JpZ2luYWwgc3RyaW5nIGZvcm1hdFxuICAgICAgaWYgKGN1c3RvbUNvbG9ycykge1xuICAgICAgICAkLmV4dGVuZCh0aGlzLmNvbG9ycywgY3VzdG9tQ29sb3JzKTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgaWYgKHZhbC50b0xvd2VyQ2FzZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gY2FzdCB0byBzdHJpbmdcbiAgICAgICAgICB2YWwgPSB2YWwgKyAnJztcbiAgICAgICAgICB0aGlzLnNldENvbG9yKHZhbCk7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsLmggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgQ29sb3IucHJvdG90eXBlID0ge1xuICAgICAgY29uc3RydWN0b3I6IENvbG9yLFxuICAgICAgLy8gMTQwIHByZWRlZmluZWQgY29sb3JzIGZyb20gdGhlIEhUTUwgQ29sb3JzIHNwZWNcbiAgICAgIGNvbG9yczoge1xuICAgICAgICBcImFsaWNlYmx1ZVwiOiBcIiNmMGY4ZmZcIixcbiAgICAgICAgXCJhbnRpcXVld2hpdGVcIjogXCIjZmFlYmQ3XCIsXG4gICAgICAgIFwiYXF1YVwiOiBcIiMwMGZmZmZcIixcbiAgICAgICAgXCJhcXVhbWFyaW5lXCI6IFwiIzdmZmZkNFwiLFxuICAgICAgICBcImF6dXJlXCI6IFwiI2YwZmZmZlwiLFxuICAgICAgICBcImJlaWdlXCI6IFwiI2Y1ZjVkY1wiLFxuICAgICAgICBcImJpc3F1ZVwiOiBcIiNmZmU0YzRcIixcbiAgICAgICAgXCJibGFja1wiOiBcIiMwMDAwMDBcIixcbiAgICAgICAgXCJibGFuY2hlZGFsbW9uZFwiOiBcIiNmZmViY2RcIixcbiAgICAgICAgXCJibHVlXCI6IFwiIzAwMDBmZlwiLFxuICAgICAgICBcImJsdWV2aW9sZXRcIjogXCIjOGEyYmUyXCIsXG4gICAgICAgIFwiYnJvd25cIjogXCIjYTUyYTJhXCIsXG4gICAgICAgIFwiYnVybHl3b29kXCI6IFwiI2RlYjg4N1wiLFxuICAgICAgICBcImNhZGV0Ymx1ZVwiOiBcIiM1ZjllYTBcIixcbiAgICAgICAgXCJjaGFydHJldXNlXCI6IFwiIzdmZmYwMFwiLFxuICAgICAgICBcImNob2NvbGF0ZVwiOiBcIiNkMjY5MWVcIixcbiAgICAgICAgXCJjb3JhbFwiOiBcIiNmZjdmNTBcIixcbiAgICAgICAgXCJjb3JuZmxvd2VyYmx1ZVwiOiBcIiM2NDk1ZWRcIixcbiAgICAgICAgXCJjb3Juc2lsa1wiOiBcIiNmZmY4ZGNcIixcbiAgICAgICAgXCJjcmltc29uXCI6IFwiI2RjMTQzY1wiLFxuICAgICAgICBcImN5YW5cIjogXCIjMDBmZmZmXCIsXG4gICAgICAgIFwiZGFya2JsdWVcIjogXCIjMDAwMDhiXCIsXG4gICAgICAgIFwiZGFya2N5YW5cIjogXCIjMDA4YjhiXCIsXG4gICAgICAgIFwiZGFya2dvbGRlbnJvZFwiOiBcIiNiODg2MGJcIixcbiAgICAgICAgXCJkYXJrZ3JheVwiOiBcIiNhOWE5YTlcIixcbiAgICAgICAgXCJkYXJrZ3JlZW5cIjogXCIjMDA2NDAwXCIsXG4gICAgICAgIFwiZGFya2toYWtpXCI6IFwiI2JkYjc2YlwiLFxuICAgICAgICBcImRhcmttYWdlbnRhXCI6IFwiIzhiMDA4YlwiLFxuICAgICAgICBcImRhcmtvbGl2ZWdyZWVuXCI6IFwiIzU1NmIyZlwiLFxuICAgICAgICBcImRhcmtvcmFuZ2VcIjogXCIjZmY4YzAwXCIsXG4gICAgICAgIFwiZGFya29yY2hpZFwiOiBcIiM5OTMyY2NcIixcbiAgICAgICAgXCJkYXJrcmVkXCI6IFwiIzhiMDAwMFwiLFxuICAgICAgICBcImRhcmtzYWxtb25cIjogXCIjZTk5NjdhXCIsXG4gICAgICAgIFwiZGFya3NlYWdyZWVuXCI6IFwiIzhmYmM4ZlwiLFxuICAgICAgICBcImRhcmtzbGF0ZWJsdWVcIjogXCIjNDgzZDhiXCIsXG4gICAgICAgIFwiZGFya3NsYXRlZ3JheVwiOiBcIiMyZjRmNGZcIixcbiAgICAgICAgXCJkYXJrdHVycXVvaXNlXCI6IFwiIzAwY2VkMVwiLFxuICAgICAgICBcImRhcmt2aW9sZXRcIjogXCIjOTQwMGQzXCIsXG4gICAgICAgIFwiZGVlcHBpbmtcIjogXCIjZmYxNDkzXCIsXG4gICAgICAgIFwiZGVlcHNreWJsdWVcIjogXCIjMDBiZmZmXCIsXG4gICAgICAgIFwiZGltZ3JheVwiOiBcIiM2OTY5NjlcIixcbiAgICAgICAgXCJkb2RnZXJibHVlXCI6IFwiIzFlOTBmZlwiLFxuICAgICAgICBcImZpcmVicmlja1wiOiBcIiNiMjIyMjJcIixcbiAgICAgICAgXCJmbG9yYWx3aGl0ZVwiOiBcIiNmZmZhZjBcIixcbiAgICAgICAgXCJmb3Jlc3RncmVlblwiOiBcIiMyMjhiMjJcIixcbiAgICAgICAgXCJmdWNoc2lhXCI6IFwiI2ZmMDBmZlwiLFxuICAgICAgICBcImdhaW5zYm9yb1wiOiBcIiNkY2RjZGNcIixcbiAgICAgICAgXCJnaG9zdHdoaXRlXCI6IFwiI2Y4ZjhmZlwiLFxuICAgICAgICBcImdvbGRcIjogXCIjZmZkNzAwXCIsXG4gICAgICAgIFwiZ29sZGVucm9kXCI6IFwiI2RhYTUyMFwiLFxuICAgICAgICBcImdyYXlcIjogXCIjODA4MDgwXCIsXG4gICAgICAgIFwiZ3JlZW5cIjogXCIjMDA4MDAwXCIsXG4gICAgICAgIFwiZ3JlZW55ZWxsb3dcIjogXCIjYWRmZjJmXCIsXG4gICAgICAgIFwiaG9uZXlkZXdcIjogXCIjZjBmZmYwXCIsXG4gICAgICAgIFwiaG90cGlua1wiOiBcIiNmZjY5YjRcIixcbiAgICAgICAgXCJpbmRpYW5yZWRcIjogXCIjY2Q1YzVjXCIsXG4gICAgICAgIFwiaW5kaWdvXCI6IFwiIzRiMDA4MlwiLFxuICAgICAgICBcIml2b3J5XCI6IFwiI2ZmZmZmMFwiLFxuICAgICAgICBcImtoYWtpXCI6IFwiI2YwZTY4Y1wiLFxuICAgICAgICBcImxhdmVuZGVyXCI6IFwiI2U2ZTZmYVwiLFxuICAgICAgICBcImxhdmVuZGVyYmx1c2hcIjogXCIjZmZmMGY1XCIsXG4gICAgICAgIFwibGF3bmdyZWVuXCI6IFwiIzdjZmMwMFwiLFxuICAgICAgICBcImxlbW9uY2hpZmZvblwiOiBcIiNmZmZhY2RcIixcbiAgICAgICAgXCJsaWdodGJsdWVcIjogXCIjYWRkOGU2XCIsXG4gICAgICAgIFwibGlnaHRjb3JhbFwiOiBcIiNmMDgwODBcIixcbiAgICAgICAgXCJsaWdodGN5YW5cIjogXCIjZTBmZmZmXCIsXG4gICAgICAgIFwibGlnaHRnb2xkZW5yb2R5ZWxsb3dcIjogXCIjZmFmYWQyXCIsXG4gICAgICAgIFwibGlnaHRncmV5XCI6IFwiI2QzZDNkM1wiLFxuICAgICAgICBcImxpZ2h0Z3JlZW5cIjogXCIjOTBlZTkwXCIsXG4gICAgICAgIFwibGlnaHRwaW5rXCI6IFwiI2ZmYjZjMVwiLFxuICAgICAgICBcImxpZ2h0c2FsbW9uXCI6IFwiI2ZmYTA3YVwiLFxuICAgICAgICBcImxpZ2h0c2VhZ3JlZW5cIjogXCIjMjBiMmFhXCIsXG4gICAgICAgIFwibGlnaHRza3libHVlXCI6IFwiIzg3Y2VmYVwiLFxuICAgICAgICBcImxpZ2h0c2xhdGVncmF5XCI6IFwiIzc3ODg5OVwiLFxuICAgICAgICBcImxpZ2h0c3RlZWxibHVlXCI6IFwiI2IwYzRkZVwiLFxuICAgICAgICBcImxpZ2h0eWVsbG93XCI6IFwiI2ZmZmZlMFwiLFxuICAgICAgICBcImxpbWVcIjogXCIjMDBmZjAwXCIsXG4gICAgICAgIFwibGltZWdyZWVuXCI6IFwiIzMyY2QzMlwiLFxuICAgICAgICBcImxpbmVuXCI6IFwiI2ZhZjBlNlwiLFxuICAgICAgICBcIm1hZ2VudGFcIjogXCIjZmYwMGZmXCIsXG4gICAgICAgIFwibWFyb29uXCI6IFwiIzgwMDAwMFwiLFxuICAgICAgICBcIm1lZGl1bWFxdWFtYXJpbmVcIjogXCIjNjZjZGFhXCIsXG4gICAgICAgIFwibWVkaXVtYmx1ZVwiOiBcIiMwMDAwY2RcIixcbiAgICAgICAgXCJtZWRpdW1vcmNoaWRcIjogXCIjYmE1NWQzXCIsXG4gICAgICAgIFwibWVkaXVtcHVycGxlXCI6IFwiIzkzNzBkOFwiLFxuICAgICAgICBcIm1lZGl1bXNlYWdyZWVuXCI6IFwiIzNjYjM3MVwiLFxuICAgICAgICBcIm1lZGl1bXNsYXRlYmx1ZVwiOiBcIiM3YjY4ZWVcIixcbiAgICAgICAgXCJtZWRpdW1zcHJpbmdncmVlblwiOiBcIiMwMGZhOWFcIixcbiAgICAgICAgXCJtZWRpdW10dXJxdW9pc2VcIjogXCIjNDhkMWNjXCIsXG4gICAgICAgIFwibWVkaXVtdmlvbGV0cmVkXCI6IFwiI2M3MTU4NVwiLFxuICAgICAgICBcIm1pZG5pZ2h0Ymx1ZVwiOiBcIiMxOTE5NzBcIixcbiAgICAgICAgXCJtaW50Y3JlYW1cIjogXCIjZjVmZmZhXCIsXG4gICAgICAgIFwibWlzdHlyb3NlXCI6IFwiI2ZmZTRlMVwiLFxuICAgICAgICBcIm1vY2Nhc2luXCI6IFwiI2ZmZTRiNVwiLFxuICAgICAgICBcIm5hdmFqb3doaXRlXCI6IFwiI2ZmZGVhZFwiLFxuICAgICAgICBcIm5hdnlcIjogXCIjMDAwMDgwXCIsXG4gICAgICAgIFwib2xkbGFjZVwiOiBcIiNmZGY1ZTZcIixcbiAgICAgICAgXCJvbGl2ZVwiOiBcIiM4MDgwMDBcIixcbiAgICAgICAgXCJvbGl2ZWRyYWJcIjogXCIjNmI4ZTIzXCIsXG4gICAgICAgIFwib3JhbmdlXCI6IFwiI2ZmYTUwMFwiLFxuICAgICAgICBcIm9yYW5nZXJlZFwiOiBcIiNmZjQ1MDBcIixcbiAgICAgICAgXCJvcmNoaWRcIjogXCIjZGE3MGQ2XCIsXG4gICAgICAgIFwicGFsZWdvbGRlbnJvZFwiOiBcIiNlZWU4YWFcIixcbiAgICAgICAgXCJwYWxlZ3JlZW5cIjogXCIjOThmYjk4XCIsXG4gICAgICAgIFwicGFsZXR1cnF1b2lzZVwiOiBcIiNhZmVlZWVcIixcbiAgICAgICAgXCJwYWxldmlvbGV0cmVkXCI6IFwiI2Q4NzA5M1wiLFxuICAgICAgICBcInBhcGF5YXdoaXBcIjogXCIjZmZlZmQ1XCIsXG4gICAgICAgIFwicGVhY2hwdWZmXCI6IFwiI2ZmZGFiOVwiLFxuICAgICAgICBcInBlcnVcIjogXCIjY2Q4NTNmXCIsXG4gICAgICAgIFwicGlua1wiOiBcIiNmZmMwY2JcIixcbiAgICAgICAgXCJwbHVtXCI6IFwiI2RkYTBkZFwiLFxuICAgICAgICBcInBvd2RlcmJsdWVcIjogXCIjYjBlMGU2XCIsXG4gICAgICAgIFwicHVycGxlXCI6IFwiIzgwMDA4MFwiLFxuICAgICAgICBcInJlZFwiOiBcIiNmZjAwMDBcIixcbiAgICAgICAgXCJyb3N5YnJvd25cIjogXCIjYmM4ZjhmXCIsXG4gICAgICAgIFwicm95YWxibHVlXCI6IFwiIzQxNjllMVwiLFxuICAgICAgICBcInNhZGRsZWJyb3duXCI6IFwiIzhiNDUxM1wiLFxuICAgICAgICBcInNhbG1vblwiOiBcIiNmYTgwNzJcIixcbiAgICAgICAgXCJzYW5keWJyb3duXCI6IFwiI2Y0YTQ2MFwiLFxuICAgICAgICBcInNlYWdyZWVuXCI6IFwiIzJlOGI1N1wiLFxuICAgICAgICBcInNlYXNoZWxsXCI6IFwiI2ZmZjVlZVwiLFxuICAgICAgICBcInNpZW5uYVwiOiBcIiNhMDUyMmRcIixcbiAgICAgICAgXCJzaWx2ZXJcIjogXCIjYzBjMGMwXCIsXG4gICAgICAgIFwic2t5Ymx1ZVwiOiBcIiM4N2NlZWJcIixcbiAgICAgICAgXCJzbGF0ZWJsdWVcIjogXCIjNmE1YWNkXCIsXG4gICAgICAgIFwic2xhdGVncmF5XCI6IFwiIzcwODA5MFwiLFxuICAgICAgICBcInNub3dcIjogXCIjZmZmYWZhXCIsXG4gICAgICAgIFwic3ByaW5nZ3JlZW5cIjogXCIjMDBmZjdmXCIsXG4gICAgICAgIFwic3RlZWxibHVlXCI6IFwiIzQ2ODJiNFwiLFxuICAgICAgICBcInRhblwiOiBcIiNkMmI0OGNcIixcbiAgICAgICAgXCJ0ZWFsXCI6IFwiIzAwODA4MFwiLFxuICAgICAgICBcInRoaXN0bGVcIjogXCIjZDhiZmQ4XCIsXG4gICAgICAgIFwidG9tYXRvXCI6IFwiI2ZmNjM0N1wiLFxuICAgICAgICBcInR1cnF1b2lzZVwiOiBcIiM0MGUwZDBcIixcbiAgICAgICAgXCJ2aW9sZXRcIjogXCIjZWU4MmVlXCIsXG4gICAgICAgIFwid2hlYXRcIjogXCIjZjVkZWIzXCIsXG4gICAgICAgIFwid2hpdGVcIjogXCIjZmZmZmZmXCIsXG4gICAgICAgIFwid2hpdGVzbW9rZVwiOiBcIiNmNWY1ZjVcIixcbiAgICAgICAgXCJ5ZWxsb3dcIjogXCIjZmZmZjAwXCIsXG4gICAgICAgIFwieWVsbG93Z3JlZW5cIjogXCIjOWFjZDMyXCIsXG4gICAgICAgIFwidHJhbnNwYXJlbnRcIjogXCJ0cmFuc3BhcmVudFwiXG4gICAgICB9LFxuICAgICAgX3Nhbml0aXplTnVtYmVyOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNOYU4odmFsKSB8fCAodmFsID09PSBudWxsKSB8fCAodmFsID09PSAnJykgfHwgKHZhbCA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWwudG9Mb3dlckNhc2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9LFxuICAgICAgaXNUcmFuc3BhcmVudDogZnVuY3Rpb24oc3RyVmFsKSB7XG4gICAgICAgIGlmICghc3RyVmFsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHN0clZhbCA9IHN0clZhbC50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICAgICAgcmV0dXJuIChzdHJWYWwgPT09ICd0cmFuc3BhcmVudCcpIHx8IChzdHJWYWwubWF0Y2goLyM/MDAwMDAwMDAvKSkgfHwgKHN0clZhbC5tYXRjaCgvKHJnYmF8aHNsYSlcXCgwLDAsMCwwP1xcLj8wXFwpLykpO1xuICAgICAgfSxcbiAgICAgIHJnYmFJc1RyYW5zcGFyZW50OiBmdW5jdGlvbihyZ2JhKSB7XG4gICAgICAgIHJldHVybiAoKHJnYmEuciA9PT0gMCkgJiYgKHJnYmEuZyA9PT0gMCkgJiYgKHJnYmEuYiA9PT0gMCkgJiYgKHJnYmEuYSA9PT0gMCkpO1xuICAgICAgfSxcbiAgICAgIC8vcGFyc2UgYSBzdHJpbmcgdG8gSFNCXG4gICAgICBzZXRDb2xvcjogZnVuY3Rpb24oc3RyVmFsKSB7XG4gICAgICAgIHN0clZhbCA9IHN0clZhbC50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICAgICAgaWYgKHN0clZhbCkge1xuICAgICAgICAgIGlmICh0aGlzLmlzVHJhbnNwYXJlbnQoc3RyVmFsKSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHtcbiAgICAgICAgICAgICAgaDogMCxcbiAgICAgICAgICAgICAgczogMCxcbiAgICAgICAgICAgICAgYjogMCxcbiAgICAgICAgICAgICAgYTogMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuc3RyaW5nVG9IU0Ioc3RyVmFsKSB8fCB7XG4gICAgICAgICAgICAgIGg6IDAsXG4gICAgICAgICAgICAgIHM6IDAsXG4gICAgICAgICAgICAgIGI6IDAsXG4gICAgICAgICAgICAgIGE6IDFcbiAgICAgICAgICAgIH07IC8vIGlmIHBhcnNlciBmYWlscywgZGVmYXVsdHMgdG8gYmxhY2tcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzdHJpbmdUb0hTQjogZnVuY3Rpb24oc3RyVmFsKSB7XG4gICAgICAgIHN0clZhbCA9IHN0clZhbC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB2YXIgYWxpYXM7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5jb2xvcnNbc3RyVmFsXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBzdHJWYWwgPSB0aGlzLmNvbG9yc1tzdHJWYWxdO1xuICAgICAgICAgIGFsaWFzID0gJ2FsaWFzJztcbiAgICAgICAgfVxuICAgICAgICB2YXIgdGhhdCA9IHRoaXMsXG4gICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICQuZWFjaCh0aGlzLnN0cmluZ1BhcnNlcnMsIGZ1bmN0aW9uKGksIHBhcnNlcikge1xuICAgICAgICAgIHZhciBtYXRjaCA9IHBhcnNlci5yZS5leGVjKHN0clZhbCksXG4gICAgICAgICAgICB2YWx1ZXMgPSBtYXRjaCAmJiBwYXJzZXIucGFyc2UuYXBwbHkodGhhdCwgW21hdGNoXSksXG4gICAgICAgICAgICBmb3JtYXQgPSBhbGlhcyB8fCBwYXJzZXIuZm9ybWF0IHx8ICdyZ2JhJztcbiAgICAgICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgICAgICBpZiAoZm9ybWF0Lm1hdGNoKC9oc2xhPy8pKSB7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IHRoYXQuUkdCdG9IU0IuYXBwbHkodGhhdCwgdGhhdC5IU0x0b1JHQi5hcHBseSh0aGF0LCB2YWx1ZXMpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IHRoYXQuUkdCdG9IU0IuYXBwbHkodGhhdCwgdmFsdWVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoYXQub3JpZ0Zvcm1hdCA9IGZvcm1hdDtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcbiAgICAgIHNldEh1ZTogZnVuY3Rpb24oaCkge1xuICAgICAgICB0aGlzLnZhbHVlLmggPSAxIC0gaDtcbiAgICAgIH0sXG4gICAgICBzZXRTYXR1cmF0aW9uOiBmdW5jdGlvbihzKSB7XG4gICAgICAgIHRoaXMudmFsdWUucyA9IHM7XG4gICAgICB9LFxuICAgICAgc2V0QnJpZ2h0bmVzczogZnVuY3Rpb24oYikge1xuICAgICAgICB0aGlzLnZhbHVlLmIgPSAxIC0gYjtcbiAgICAgIH0sXG4gICAgICBzZXRBbHBoYTogZnVuY3Rpb24oYSkge1xuICAgICAgICB0aGlzLnZhbHVlLmEgPSBwYXJzZUludCgoMSAtIGEpICogMTAwLCAxMCkgLyAxMDA7XG4gICAgICB9LFxuICAgICAgdG9SR0I6IGZ1bmN0aW9uKGgsIHMsIGIsIGEpIHtcbiAgICAgICAgaWYgKCFoKSB7XG4gICAgICAgICAgaCA9IHRoaXMudmFsdWUuaDtcbiAgICAgICAgICBzID0gdGhpcy52YWx1ZS5zO1xuICAgICAgICAgIGIgPSB0aGlzLnZhbHVlLmI7XG4gICAgICAgIH1cbiAgICAgICAgaCAqPSAzNjA7XG4gICAgICAgIHZhciBSLCBHLCBCLCBYLCBDO1xuICAgICAgICBoID0gKGggJSAzNjApIC8gNjA7XG4gICAgICAgIEMgPSBiICogcztcbiAgICAgICAgWCA9IEMgKiAoMSAtIE1hdGguYWJzKGggJSAyIC0gMSkpO1xuICAgICAgICBSID0gRyA9IEIgPSBiIC0gQztcblxuICAgICAgICBoID0gfn5oO1xuICAgICAgICBSICs9IFtDLCBYLCAwLCAwLCBYLCBDXVtoXTtcbiAgICAgICAgRyArPSBbWCwgQywgQywgWCwgMCwgMF1baF07XG4gICAgICAgIEIgKz0gWzAsIDAsIFgsIEMsIEMsIFhdW2hdO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHI6IE1hdGgucm91bmQoUiAqIDI1NSksXG4gICAgICAgICAgZzogTWF0aC5yb3VuZChHICogMjU1KSxcbiAgICAgICAgICBiOiBNYXRoLnJvdW5kKEIgKiAyNTUpLFxuICAgICAgICAgIGE6IGEgfHwgdGhpcy52YWx1ZS5hXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgdG9IZXg6IGZ1bmN0aW9uKGgsIHMsIGIsIGEpIHtcbiAgICAgICAgdmFyIHJnYiA9IHRoaXMudG9SR0IoaCwgcywgYiwgYSk7XG4gICAgICAgIGlmICh0aGlzLnJnYmFJc1RyYW5zcGFyZW50KHJnYikpIHtcbiAgICAgICAgICByZXR1cm4gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyMnICsgKCgxIDw8IDI0KSB8IChwYXJzZUludChyZ2IucikgPDwgMTYpIHwgKHBhcnNlSW50KHJnYi5nKSA8PCA4KSB8IHBhcnNlSW50KHJnYi5iKSkudG9TdHJpbmcoMTYpLnN1YnN0cigxKTtcbiAgICAgIH0sXG4gICAgICB0b0hTTDogZnVuY3Rpb24oaCwgcywgYiwgYSkge1xuICAgICAgICBoID0gaCB8fCB0aGlzLnZhbHVlLmg7XG4gICAgICAgIHMgPSBzIHx8IHRoaXMudmFsdWUucztcbiAgICAgICAgYiA9IGIgfHwgdGhpcy52YWx1ZS5iO1xuICAgICAgICBhID0gYSB8fCB0aGlzLnZhbHVlLmE7XG5cbiAgICAgICAgdmFyIEggPSBoLFxuICAgICAgICAgIEwgPSAoMiAtIHMpICogYixcbiAgICAgICAgICBTID0gcyAqIGI7XG4gICAgICAgIGlmIChMID4gMCAmJiBMIDw9IDEpIHtcbiAgICAgICAgICBTIC89IEw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgUyAvPSAyIC0gTDtcbiAgICAgICAgfVxuICAgICAgICBMIC89IDI7XG4gICAgICAgIGlmIChTID4gMSkge1xuICAgICAgICAgIFMgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaDogaXNOYU4oSCkgPyAwIDogSCxcbiAgICAgICAgICBzOiBpc05hTihTKSA/IDAgOiBTLFxuICAgICAgICAgIGw6IGlzTmFOKEwpID8gMCA6IEwsXG4gICAgICAgICAgYTogaXNOYU4oYSkgPyAwIDogYVxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIHRvQWxpYXM6IGZ1bmN0aW9uKHIsIGcsIGIsIGEpIHtcbiAgICAgICAgdmFyIHJnYiA9IHRoaXMudG9IZXgociwgZywgYiwgYSk7XG4gICAgICAgIGZvciAodmFyIGFsaWFzIGluIHRoaXMuY29sb3JzKSB7XG4gICAgICAgICAgaWYgKHRoaXMuY29sb3JzW2FsaWFzXSA9PT0gcmdiKSB7XG4gICAgICAgICAgICByZXR1cm4gYWxpYXM7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgICBSR0J0b0hTQjogZnVuY3Rpb24ociwgZywgYiwgYSkge1xuICAgICAgICByIC89IDI1NTtcbiAgICAgICAgZyAvPSAyNTU7XG4gICAgICAgIGIgLz0gMjU1O1xuXG4gICAgICAgIHZhciBILCBTLCBWLCBDO1xuICAgICAgICBWID0gTWF0aC5tYXgociwgZywgYik7XG4gICAgICAgIEMgPSBWIC0gTWF0aC5taW4ociwgZywgYik7XG4gICAgICAgIEggPSAoQyA9PT0gMCA/IG51bGwgOlxuICAgICAgICAgIFYgPT09IHIgPyAoZyAtIGIpIC8gQyA6XG4gICAgICAgICAgViA9PT0gZyA/IChiIC0gcikgLyBDICsgMiA6XG4gICAgICAgICAgKHIgLSBnKSAvIEMgKyA0XG4gICAgICAgICk7XG4gICAgICAgIEggPSAoKEggKyAzNjApICUgNikgKiA2MCAvIDM2MDtcbiAgICAgICAgUyA9IEMgPT09IDAgPyAwIDogQyAvIFY7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaDogdGhpcy5fc2FuaXRpemVOdW1iZXIoSCksXG4gICAgICAgICAgczogUyxcbiAgICAgICAgICBiOiBWLFxuICAgICAgICAgIGE6IHRoaXMuX3Nhbml0aXplTnVtYmVyKGEpXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgSHVlVG9SR0I6IGZ1bmN0aW9uKHAsIHEsIGgpIHtcbiAgICAgICAgaWYgKGggPCAwKSB7XG4gICAgICAgICAgaCArPSAxO1xuICAgICAgICB9IGVsc2UgaWYgKGggPiAxKSB7XG4gICAgICAgICAgaCAtPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoaCAqIDYpIDwgMSkge1xuICAgICAgICAgIHJldHVybiBwICsgKHEgLSBwKSAqIGggKiA2O1xuICAgICAgICB9IGVsc2UgaWYgKChoICogMikgPCAxKSB7XG4gICAgICAgICAgcmV0dXJuIHE7XG4gICAgICAgIH0gZWxzZSBpZiAoKGggKiAzKSA8IDIpIHtcbiAgICAgICAgICByZXR1cm4gcCArIChxIC0gcCkgKiAoKDIgLyAzKSAtIGgpICogNjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIEhTTHRvUkdCOiBmdW5jdGlvbihoLCBzLCBsLCBhKSB7XG4gICAgICAgIGlmIChzIDwgMCkge1xuICAgICAgICAgIHMgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBxO1xuICAgICAgICBpZiAobCA8PSAwLjUpIHtcbiAgICAgICAgICBxID0gbCAqICgxICsgcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcSA9IGwgKyBzIC0gKGwgKiBzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwID0gMiAqIGwgLSBxO1xuXG4gICAgICAgIHZhciB0ciA9IGggKyAoMSAvIDMpO1xuICAgICAgICB2YXIgdGcgPSBoO1xuICAgICAgICB2YXIgdGIgPSBoIC0gKDEgLyAzKTtcblxuICAgICAgICB2YXIgciA9IE1hdGgucm91bmQodGhpcy5IdWVUb1JHQihwLCBxLCB0cikgKiAyNTUpO1xuICAgICAgICB2YXIgZyA9IE1hdGgucm91bmQodGhpcy5IdWVUb1JHQihwLCBxLCB0ZykgKiAyNTUpO1xuICAgICAgICB2YXIgYiA9IE1hdGgucm91bmQodGhpcy5IdWVUb1JHQihwLCBxLCB0YikgKiAyNTUpO1xuICAgICAgICByZXR1cm4gW3IsIGcsIGIsIHRoaXMuX3Nhbml0aXplTnVtYmVyKGEpXTtcbiAgICAgIH0sXG4gICAgICB0b1N0cmluZzogZnVuY3Rpb24oZm9ybWF0KSB7XG4gICAgICAgIGZvcm1hdCA9IGZvcm1hdCB8fCAncmdiYSc7XG4gICAgICAgIHZhciBjID0gZmFsc2U7XG4gICAgICAgIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgICAgICAgY2FzZSAncmdiJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgYyA9IHRoaXMudG9SR0IoKTtcbiAgICAgICAgICAgICAgaWYgKHRoaXMucmdiYUlzVHJhbnNwYXJlbnQoYykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gJ3JnYignICsgYy5yICsgJywnICsgYy5nICsgJywnICsgYy5iICsgJyknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncmdiYSc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGMgPSB0aGlzLnRvUkdCKCk7XG4gICAgICAgICAgICAgIHJldHVybiAncmdiYSgnICsgYy5yICsgJywnICsgYy5nICsgJywnICsgYy5iICsgJywnICsgYy5hICsgJyknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnaHNsJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgYyA9IHRoaXMudG9IU0woKTtcbiAgICAgICAgICAgICAgcmV0dXJuICdoc2woJyArIE1hdGgucm91bmQoYy5oICogMzYwKSArICcsJyArIE1hdGgucm91bmQoYy5zICogMTAwKSArICclLCcgKyBNYXRoLnJvdW5kKGMubCAqIDEwMCkgKyAnJSknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnaHNsYSc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGMgPSB0aGlzLnRvSFNMKCk7XG4gICAgICAgICAgICAgIHJldHVybiAnaHNsYSgnICsgTWF0aC5yb3VuZChjLmggKiAzNjApICsgJywnICsgTWF0aC5yb3VuZChjLnMgKiAxMDApICsgJyUsJyArIE1hdGgucm91bmQoYy5sICogMTAwKSArICclLCcgKyBjLmEgKyAnKSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdoZXgnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy50b0hleCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnYWxpYXMnOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9BbGlhcygpIHx8IHRoaXMudG9IZXgoKTtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgLy8gYSBzZXQgb2YgUkUncyB0aGF0IGNhbiBtYXRjaCBzdHJpbmdzIGFuZCBnZW5lcmF0ZSBjb2xvciB0dXBsZXMuXG4gICAgICAvLyBmcm9tIEpvaG4gUmVzaWcgY29sb3IgcGx1Z2luXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vanF1ZXJ5L2pxdWVyeS1jb2xvci9cbiAgICAgIHN0cmluZ1BhcnNlcnM6IFt7XG4gICAgICAgIHJlOiAvcmdiXFwoXFxzKihcXGR7MSwzfSlcXHMqLFxccyooXFxkezEsM30pXFxzKixcXHMqKFxcZHsxLDN9KVxccyo/XFwpLyxcbiAgICAgICAgZm9ybWF0OiAncmdiJyxcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKGV4ZWNSZXN1bHQpIHtcbiAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgZXhlY1Jlc3VsdFsxXSxcbiAgICAgICAgICAgIGV4ZWNSZXN1bHRbMl0sXG4gICAgICAgICAgICBleGVjUmVzdWx0WzNdLFxuICAgICAgICAgICAgMVxuICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgIH0sIHtcbiAgICAgICAgcmU6IC9yZ2JcXChcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFwlXFxzKixcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFwlXFxzKixcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFwlXFxzKj9cXCkvLFxuICAgICAgICBmb3JtYXQ6ICdyZ2InLFxuICAgICAgICBwYXJzZTogZnVuY3Rpb24oZXhlY1Jlc3VsdCkge1xuICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAyLjU1ICogZXhlY1Jlc3VsdFsxXSxcbiAgICAgICAgICAgIDIuNTUgKiBleGVjUmVzdWx0WzJdLFxuICAgICAgICAgICAgMi41NSAqIGV4ZWNSZXN1bHRbM10sXG4gICAgICAgICAgICAxXG4gICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICByZTogL3JnYmFcXChcXHMqKFxcZHsxLDN9KVxccyosXFxzKihcXGR7MSwzfSlcXHMqLFxccyooXFxkezEsM30pXFxzKig/OixcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFxzKik/XFwpLyxcbiAgICAgICAgZm9ybWF0OiAncmdiYScsXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbihleGVjUmVzdWx0KSB7XG4gICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIGV4ZWNSZXN1bHRbMV0sXG4gICAgICAgICAgICBleGVjUmVzdWx0WzJdLFxuICAgICAgICAgICAgZXhlY1Jlc3VsdFszXSxcbiAgICAgICAgICAgIGV4ZWNSZXN1bHRbNF1cbiAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICB9LCB7XG4gICAgICAgIHJlOiAvcmdiYVxcKFxccyooXFxkKyg/OlxcLlxcZCspPylcXCVcXHMqLFxccyooXFxkKyg/OlxcLlxcZCspPylcXCVcXHMqLFxccyooXFxkKyg/OlxcLlxcZCspPylcXCVcXHMqKD86LFxccyooXFxkKyg/OlxcLlxcZCspPylcXHMqKT9cXCkvLFxuICAgICAgICBmb3JtYXQ6ICdyZ2JhJyxcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKGV4ZWNSZXN1bHQpIHtcbiAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgMi41NSAqIGV4ZWNSZXN1bHRbMV0sXG4gICAgICAgICAgICAyLjU1ICogZXhlY1Jlc3VsdFsyXSxcbiAgICAgICAgICAgIDIuNTUgKiBleGVjUmVzdWx0WzNdLFxuICAgICAgICAgICAgZXhlY1Jlc3VsdFs0XVxuICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgIH0sIHtcbiAgICAgICAgcmU6IC9oc2xcXChcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFxzKixcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFwlXFxzKixcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFwlXFxzKj9cXCkvLFxuICAgICAgICBmb3JtYXQ6ICdoc2wnLFxuICAgICAgICBwYXJzZTogZnVuY3Rpb24oZXhlY1Jlc3VsdCkge1xuICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBleGVjUmVzdWx0WzFdIC8gMzYwLFxuICAgICAgICAgICAgZXhlY1Jlc3VsdFsyXSAvIDEwMCxcbiAgICAgICAgICAgIGV4ZWNSZXN1bHRbM10gLyAxMDAsXG4gICAgICAgICAgICBleGVjUmVzdWx0WzRdXG4gICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICByZTogL2hzbGFcXChcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFxzKixcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFwlXFxzKixcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFwlXFxzKig/OixcXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFxzKik/XFwpLyxcbiAgICAgICAgZm9ybWF0OiAnaHNsYScsXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbihleGVjUmVzdWx0KSB7XG4gICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIGV4ZWNSZXN1bHRbMV0gLyAzNjAsXG4gICAgICAgICAgICBleGVjUmVzdWx0WzJdIC8gMTAwLFxuICAgICAgICAgICAgZXhlY1Jlc3VsdFszXSAvIDEwMCxcbiAgICAgICAgICAgIGV4ZWNSZXN1bHRbNF1cbiAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICB9LCB7XG4gICAgICAgIHJlOiAvIz8oW2EtZkEtRjAtOV17Mn0pKFthLWZBLUYwLTldezJ9KShbYS1mQS1GMC05XXsyfSkvLFxuICAgICAgICBmb3JtYXQ6ICdoZXgnLFxuICAgICAgICBwYXJzZTogZnVuY3Rpb24oZXhlY1Jlc3VsdCkge1xuICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBwYXJzZUludChleGVjUmVzdWx0WzFdLCAxNiksXG4gICAgICAgICAgICBwYXJzZUludChleGVjUmVzdWx0WzJdLCAxNiksXG4gICAgICAgICAgICBwYXJzZUludChleGVjUmVzdWx0WzNdLCAxNiksXG4gICAgICAgICAgICAxXG4gICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICByZTogLyM/KFthLWZBLUYwLTldKShbYS1mQS1GMC05XSkoW2EtZkEtRjAtOV0pLyxcbiAgICAgICAgZm9ybWF0OiAnaGV4JyxcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKGV4ZWNSZXN1bHQpIHtcbiAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgcGFyc2VJbnQoZXhlY1Jlc3VsdFsxXSArIGV4ZWNSZXN1bHRbMV0sIDE2KSxcbiAgICAgICAgICAgIHBhcnNlSW50KGV4ZWNSZXN1bHRbMl0gKyBleGVjUmVzdWx0WzJdLCAxNiksXG4gICAgICAgICAgICBwYXJzZUludChleGVjUmVzdWx0WzNdICsgZXhlY1Jlc3VsdFszXSwgMTYpLFxuICAgICAgICAgICAgMVxuICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgIH1dLFxuICAgICAgY29sb3JOYW1lVG9IZXg6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmNvbG9yc1tuYW1lLnRvTG93ZXJDYXNlKCldICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNvbG9yc1tuYW1lLnRvTG93ZXJDYXNlKCldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9O1xuXG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICBob3Jpem9udGFsOiBmYWxzZSwgLy8gaG9yaXpvbnRhbCBtb2RlIGxheW91dCA/XG4gICAgICBpbmxpbmU6IGZhbHNlLCAvL2ZvcmNlcyB0byBzaG93IHRoZSBjb2xvcnBpY2tlciBhcyBhbiBpbmxpbmUgZWxlbWVudFxuICAgICAgY29sb3I6IGZhbHNlLCAvL2ZvcmNlcyBhIGNvbG9yXG4gICAgICBmb3JtYXQ6IGZhbHNlLCAvL2ZvcmNlcyBhIGZvcm1hdFxuICAgICAgaW5wdXQ6ICdpbnB1dCcsIC8vIGNoaWxkcmVuIGlucHV0IHNlbGVjdG9yXG4gICAgICBjb250YWluZXI6IGZhbHNlLCAvLyBjb250YWluZXIgc2VsZWN0b3JcbiAgICAgIGNvbXBvbmVudDogJy5hZGQtb24sIC5pbnB1dC1ncm91cC1hZGRvbicsIC8vIGNoaWxkcmVuIGNvbXBvbmVudCBzZWxlY3RvclxuICAgICAgc2xpZGVyczoge1xuICAgICAgICBzYXR1cmF0aW9uOiB7XG4gICAgICAgICAgbWF4TGVmdDogMTAwLFxuICAgICAgICAgIG1heFRvcDogMTAwLFxuICAgICAgICAgIGNhbGxMZWZ0OiAnc2V0U2F0dXJhdGlvbicsXG4gICAgICAgICAgY2FsbFRvcDogJ3NldEJyaWdodG5lc3MnXG4gICAgICAgIH0sXG4gICAgICAgIGh1ZToge1xuICAgICAgICAgIG1heExlZnQ6IDAsXG4gICAgICAgICAgbWF4VG9wOiAxMDAsXG4gICAgICAgICAgY2FsbExlZnQ6IGZhbHNlLFxuICAgICAgICAgIGNhbGxUb3A6ICdzZXRIdWUnXG4gICAgICAgIH0sXG4gICAgICAgIGFscGhhOiB7XG4gICAgICAgICAgbWF4TGVmdDogMCxcbiAgICAgICAgICBtYXhUb3A6IDEwMCxcbiAgICAgICAgICBjYWxsTGVmdDogZmFsc2UsXG4gICAgICAgICAgY2FsbFRvcDogJ3NldEFscGhhJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgc2xpZGVyc0hvcno6IHtcbiAgICAgICAgc2F0dXJhdGlvbjoge1xuICAgICAgICAgIG1heExlZnQ6IDEwMCxcbiAgICAgICAgICBtYXhUb3A6IDEwMCxcbiAgICAgICAgICBjYWxsTGVmdDogJ3NldFNhdHVyYXRpb24nLFxuICAgICAgICAgIGNhbGxUb3A6ICdzZXRCcmlnaHRuZXNzJ1xuICAgICAgICB9LFxuICAgICAgICBodWU6IHtcbiAgICAgICAgICBtYXhMZWZ0OiAxMDAsXG4gICAgICAgICAgbWF4VG9wOiAwLFxuICAgICAgICAgIGNhbGxMZWZ0OiAnc2V0SHVlJyxcbiAgICAgICAgICBjYWxsVG9wOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBhbHBoYToge1xuICAgICAgICAgIG1heExlZnQ6IDEwMCxcbiAgICAgICAgICBtYXhUb3A6IDAsXG4gICAgICAgICAgY2FsbExlZnQ6ICdzZXRBbHBoYScsXG4gICAgICAgICAgY2FsbFRvcDogZmFsc2VcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cImNvbG9ycGlja2VyIGRyb3Bkb3duLW1lbnVcIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJjb2xvcnBpY2tlci1zYXR1cmF0aW9uXCI+PGk+PGI+PC9iPjwvaT48L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJjb2xvcnBpY2tlci1odWVcIj48aT48L2k+PC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiY29sb3JwaWNrZXItYWxwaGFcIj48aT48L2k+PC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiY29sb3JwaWNrZXItY29sb3JcIj48ZGl2IC8+PC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiY29sb3JwaWNrZXItc2VsZWN0b3JzXCI+PC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nLFxuICAgICAgYWxpZ246ICdyaWdodCcsXG4gICAgICBjdXN0b21DbGFzczogbnVsbCxcbiAgICAgIGNvbG9yU2VsZWN0b3JzOiBudWxsXG4gICAgfTtcblxuICAgIHZhciBDb2xvcnBpY2tlciA9IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuZWxlbWVudCA9ICQoZWxlbWVudCkuYWRkQ2xhc3MoJ2NvbG9ycGlja2VyLWVsZW1lbnQnKTtcbiAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgdGhpcy5lbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgICB0aGlzLmNvbXBvbmVudCA9IHRoaXMub3B0aW9ucy5jb21wb25lbnQ7XG4gICAgICB0aGlzLmNvbXBvbmVudCA9ICh0aGlzLmNvbXBvbmVudCAhPT0gZmFsc2UpID8gdGhpcy5lbGVtZW50LmZpbmQodGhpcy5jb21wb25lbnQpIDogZmFsc2U7XG4gICAgICBpZiAodGhpcy5jb21wb25lbnQgJiYgKHRoaXMuY29tcG9uZW50Lmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY29udGFpbmVyID0gKHRoaXMub3B0aW9ucy5jb250YWluZXIgPT09IHRydWUpID8gdGhpcy5lbGVtZW50IDogdGhpcy5vcHRpb25zLmNvbnRhaW5lcjtcbiAgICAgIHRoaXMuY29udGFpbmVyID0gKHRoaXMuY29udGFpbmVyICE9PSBmYWxzZSkgPyAkKHRoaXMuY29udGFpbmVyKSA6IGZhbHNlO1xuXG4gICAgICAvLyBJcyB0aGUgZWxlbWVudCBhbiBpbnB1dD8gU2hvdWxkIHdlIHNlYXJjaCBpbnNpZGUgZm9yIGFueSBpbnB1dD9cbiAgICAgIHRoaXMuaW5wdXQgPSB0aGlzLmVsZW1lbnQuaXMoJ2lucHV0JykgPyB0aGlzLmVsZW1lbnQgOiAodGhpcy5vcHRpb25zLmlucHV0ID9cbiAgICAgICAgdGhpcy5lbGVtZW50LmZpbmQodGhpcy5vcHRpb25zLmlucHV0KSA6IGZhbHNlKTtcbiAgICAgIGlmICh0aGlzLmlucHV0ICYmICh0aGlzLmlucHV0Lmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgdGhpcy5pbnB1dCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gU2V0IEhTQiBjb2xvclxuICAgICAgdGhpcy5jb2xvciA9IG5ldyBDb2xvcih0aGlzLm9wdGlvbnMuY29sb3IgIT09IGZhbHNlID8gdGhpcy5vcHRpb25zLmNvbG9yIDogdGhpcy5nZXRWYWx1ZSgpLCB0aGlzLm9wdGlvbnMuY29sb3JTZWxlY3RvcnMpO1xuICAgICAgdGhpcy5mb3JtYXQgPSB0aGlzLm9wdGlvbnMuZm9ybWF0ICE9PSBmYWxzZSA/IHRoaXMub3B0aW9ucy5mb3JtYXQgOiB0aGlzLmNvbG9yLm9yaWdGb3JtYXQ7XG5cbiAgICAgIC8vIFNldHVwIHBpY2tlclxuICAgICAgdGhpcy5waWNrZXIgPSAkKHRoaXMub3B0aW9ucy50ZW1wbGF0ZSk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmN1c3RvbUNsYXNzKSB7XG4gICAgICAgIHRoaXMucGlja2VyLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jdXN0b21DbGFzcyk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmlubGluZSkge1xuICAgICAgICB0aGlzLnBpY2tlci5hZGRDbGFzcygnY29sb3JwaWNrZXItaW5saW5lIGNvbG9ycGlja2VyLXZpc2libGUnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucGlja2VyLmFkZENsYXNzKCdjb2xvcnBpY2tlci1oaWRkZW4nKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaG9yaXpvbnRhbCkge1xuICAgICAgICB0aGlzLnBpY2tlci5hZGRDbGFzcygnY29sb3JwaWNrZXItaG9yaXpvbnRhbCcpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZm9ybWF0ID09PSAncmdiYScgfHwgdGhpcy5mb3JtYXQgPT09ICdoc2xhJyB8fCB0aGlzLm9wdGlvbnMuZm9ybWF0ID09PSBmYWxzZSkge1xuICAgICAgICB0aGlzLnBpY2tlci5hZGRDbGFzcygnY29sb3JwaWNrZXItd2l0aC1hbHBoYScpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbiA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICB0aGlzLnBpY2tlci5hZGRDbGFzcygnY29sb3JwaWNrZXItcmlnaHQnKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuY29sb3JTZWxlY3RvcnMpIHtcbiAgICAgICAgdmFyIGNvbG9ycGlja2VyID0gdGhpcztcbiAgICAgICAgJC5lYWNoKHRoaXMub3B0aW9ucy5jb2xvclNlbGVjdG9ycywgZnVuY3Rpb24obmFtZSwgY29sb3IpIHtcbiAgICAgICAgICB2YXIgJGJ0biA9ICQoJzxpIC8+JykuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3IpLmRhdGEoJ2NsYXNzJywgbmFtZSk7XG4gICAgICAgICAgJGJ0bi5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbG9ycGlja2VyLnNldFZhbHVlKCQodGhpcykuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJykpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbG9ycGlja2VyLnBpY2tlci5maW5kKCcuY29sb3JwaWNrZXItc2VsZWN0b3JzJykuYXBwZW5kKCRidG4pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmNvbG9ycGlja2VyLXNlbGVjdG9ycycpLnNob3coKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGlja2VyLm9uKCdtb3VzZWRvd24uY29sb3JwaWNrZXIgdG91Y2hzdGFydC5jb2xvcnBpY2tlcicsICQucHJveHkodGhpcy5tb3VzZWRvd24sIHRoaXMpKTtcbiAgICAgIHRoaXMucGlja2VyLmFwcGVuZFRvKHRoaXMuY29udGFpbmVyID8gdGhpcy5jb250YWluZXIgOiAkKCdib2R5JykpO1xuXG4gICAgICAvLyBCaW5kIGV2ZW50c1xuICAgICAgaWYgKHRoaXMuaW5wdXQgIT09IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuaW5wdXQub24oe1xuICAgICAgICAgICdrZXl1cC5jb2xvcnBpY2tlcic6ICQucHJveHkodGhpcy5rZXl1cCwgdGhpcylcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaW5wdXQub24oe1xuICAgICAgICAgICdjaGFuZ2UuY29sb3JwaWNrZXInOiAkLnByb3h5KHRoaXMuY2hhbmdlLCB0aGlzKVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50ID09PSBmYWxzZSkge1xuICAgICAgICAgIHRoaXMuZWxlbWVudC5vbih7XG4gICAgICAgICAgICAnZm9jdXMuY29sb3JwaWNrZXInOiAkLnByb3h5KHRoaXMuc2hvdywgdGhpcylcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmlubGluZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICB0aGlzLmVsZW1lbnQub24oe1xuICAgICAgICAgICAgJ2ZvY3Vzb3V0LmNvbG9ycGlja2VyJzogJC5wcm94eSh0aGlzLmhpZGUsIHRoaXMpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuY29tcG9uZW50ICE9PSBmYWxzZSkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudC5vbih7XG4gICAgICAgICAgJ2NsaWNrLmNvbG9ycGlja2VyJzogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoKHRoaXMuaW5wdXQgPT09IGZhbHNlKSAmJiAodGhpcy5jb21wb25lbnQgPT09IGZhbHNlKSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQub24oe1xuICAgICAgICAgICdjbGljay5jb2xvcnBpY2tlcic6ICQucHJveHkodGhpcy5zaG93LCB0aGlzKVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gZm9yIEhUTUw1IGlucHV0W3R5cGU9J2NvbG9yJ11cbiAgICAgIGlmICgodGhpcy5pbnB1dCAhPT0gZmFsc2UpICYmICh0aGlzLmNvbXBvbmVudCAhPT0gZmFsc2UpICYmICh0aGlzLmlucHV0LmF0dHIoJ3R5cGUnKSA9PT0gJ2NvbG9yJykpIHtcblxuICAgICAgICB0aGlzLmlucHV0Lm9uKHtcbiAgICAgICAgICAnY2xpY2suY29sb3JwaWNrZXInOiAkLnByb3h5KHRoaXMuc2hvdywgdGhpcyksXG4gICAgICAgICAgJ2ZvY3VzLmNvbG9ycGlja2VyJzogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdGhpcy51cGRhdGUoKTtcblxuICAgICAgJCgkLnByb3h5KGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcignY3JlYXRlJyk7XG4gICAgICB9LCB0aGlzKSk7XG4gICAgfTtcblxuICAgIENvbG9ycGlja2VyLkNvbG9yID0gQ29sb3I7XG5cbiAgICBDb2xvcnBpY2tlci5wcm90b3R5cGUgPSB7XG4gICAgICBjb25zdHJ1Y3RvcjogQ29sb3JwaWNrZXIsXG4gICAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5waWNrZXIucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVEYXRhKCdjb2xvcnBpY2tlcicpLm9mZignLmNvbG9ycGlja2VyJyk7XG4gICAgICAgIGlmICh0aGlzLmlucHV0ICE9PSBmYWxzZSkge1xuICAgICAgICAgIHRoaXMuaW5wdXQub2ZmKCcuY29sb3JwaWNrZXInKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jb21wb25lbnQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgdGhpcy5jb21wb25lbnQub2ZmKCcuY29sb3JwaWNrZXInKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2NvbG9ycGlja2VyLWVsZW1lbnQnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAgIHR5cGU6ICdkZXN0cm95J1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICByZXBvc2l0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5pbmxpbmUgIT09IGZhbHNlIHx8IHRoaXMub3B0aW9ucy5jb250YWluZXIpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHR5cGUgPSB0aGlzLmNvbnRhaW5lciAmJiB0aGlzLmNvbnRhaW5lclswXSAhPT0gZG9jdW1lbnQuYm9keSA/ICdwb3NpdGlvbicgOiAnb2Zmc2V0JztcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLmNvbXBvbmVudCB8fCB0aGlzLmVsZW1lbnQ7XG4gICAgICAgIHZhciBvZmZzZXQgPSBlbGVtZW50W3R5cGVdKCk7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ24gPT09ICdyaWdodCcpIHtcbiAgICAgICAgICBvZmZzZXQubGVmdCAtPSB0aGlzLnBpY2tlci5vdXRlcldpZHRoKCkgLSBlbGVtZW50Lm91dGVyV2lkdGgoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBpY2tlci5jc3Moe1xuICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArIGVsZW1lbnQub3V0ZXJIZWlnaHQoKSxcbiAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBzaG93OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRGlzYWJsZWQoKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBpY2tlci5hZGRDbGFzcygnY29sb3JwaWNrZXItdmlzaWJsZScpLnJlbW92ZUNsYXNzKCdjb2xvcnBpY2tlci1oaWRkZW4nKTtcbiAgICAgICAgdGhpcy5yZXBvc2l0aW9uKCk7XG4gICAgICAgICQod2luZG93KS5vbigncmVzaXplLmNvbG9ycGlja2VyJywgJC5wcm94eSh0aGlzLnJlcG9zaXRpb24sIHRoaXMpKTtcbiAgICAgICAgaWYgKGUgJiYgKCF0aGlzLmhhc0lucHV0KCkgfHwgdGhpcy5pbnB1dC5hdHRyKCd0eXBlJykgPT09ICdjb2xvcicpKSB7XG4gICAgICAgICAgaWYgKGUuc3RvcFByb3BhZ2F0aW9uICYmIGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaW5saW5lID09PSBmYWxzZSkge1xuICAgICAgICAgICQod2luZG93LmRvY3VtZW50KS5vbih7XG4gICAgICAgICAgICAnbW91c2Vkb3duLmNvbG9ycGlja2VyJzogJC5wcm94eSh0aGlzLmhpZGUsIHRoaXMpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAgIHR5cGU6ICdzaG93UGlja2VyJyxcbiAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvclxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBoaWRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5waWNrZXIuYWRkQ2xhc3MoJ2NvbG9ycGlja2VyLWhpZGRlbicpLnJlbW92ZUNsYXNzKCdjb2xvcnBpY2tlci12aXNpYmxlJyk7XG4gICAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZS5jb2xvcnBpY2tlcicsIHRoaXMucmVwb3NpdGlvbik7XG4gICAgICAgICQoZG9jdW1lbnQpLm9mZih7XG4gICAgICAgICAgJ21vdXNlZG93bi5jb2xvcnBpY2tlcic6IHRoaXMuaGlkZVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAgIHR5cGU6ICdoaWRlUGlja2VyJyxcbiAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvclxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICB1cGRhdGVEYXRhOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdmFsID0gdmFsIHx8IHRoaXMuY29sb3IudG9TdHJpbmcodGhpcy5mb3JtYXQpO1xuICAgICAgICB0aGlzLmVsZW1lbnQuZGF0YSgnY29sb3InLCB2YWwpO1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZUlucHV0OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdmFsID0gdmFsIHx8IHRoaXMuY29sb3IudG9TdHJpbmcodGhpcy5mb3JtYXQpO1xuICAgICAgICBpZiAodGhpcy5pbnB1dCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNvbG9yU2VsZWN0b3JzKSB7XG4gICAgICAgICAgICB2YXIgY29sb3IgPSBuZXcgQ29sb3IodmFsLCB0aGlzLm9wdGlvbnMuY29sb3JTZWxlY3RvcnMpO1xuICAgICAgICAgICAgdmFyIGFsaWFzID0gY29sb3IudG9BbGlhcygpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuY29sb3JTZWxlY3RvcnNbYWxpYXNdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICB2YWwgPSBhbGlhcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5pbnB1dC5wcm9wKCd2YWx1ZScsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgIH0sXG4gICAgICB1cGRhdGVQaWNrZXI6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBpZiAodmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLmNvbG9yID0gbmV3IENvbG9yKHZhbCwgdGhpcy5vcHRpb25zLmNvbG9yU2VsZWN0b3JzKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2wgPSAodGhpcy5vcHRpb25zLmhvcml6b250YWwgPT09IGZhbHNlKSA/IHRoaXMub3B0aW9ucy5zbGlkZXJzIDogdGhpcy5vcHRpb25zLnNsaWRlcnNIb3J6O1xuICAgICAgICB2YXIgaWNucyA9IHRoaXMucGlja2VyLmZpbmQoJ2knKTtcbiAgICAgICAgaWYgKGljbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaG9yaXpvbnRhbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBzbCA9IHRoaXMub3B0aW9ucy5zbGlkZXJzO1xuICAgICAgICAgIGljbnMuZXEoMSkuY3NzKCd0b3AnLCBzbC5odWUubWF4VG9wICogKDEgLSB0aGlzLmNvbG9yLnZhbHVlLmgpKS5lbmQoKVxuICAgICAgICAgICAgLmVxKDIpLmNzcygndG9wJywgc2wuYWxwaGEubWF4VG9wICogKDEgLSB0aGlzLmNvbG9yLnZhbHVlLmEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzbCA9IHRoaXMub3B0aW9ucy5zbGlkZXJzSG9yejtcbiAgICAgICAgICBpY25zLmVxKDEpLmNzcygnbGVmdCcsIHNsLmh1ZS5tYXhMZWZ0ICogKDEgLSB0aGlzLmNvbG9yLnZhbHVlLmgpKS5lbmQoKVxuICAgICAgICAgICAgLmVxKDIpLmNzcygnbGVmdCcsIHNsLmFscGhhLm1heExlZnQgKiAoMSAtIHRoaXMuY29sb3IudmFsdWUuYSkpO1xuICAgICAgICB9XG4gICAgICAgIGljbnMuZXEoMCkuY3NzKHtcbiAgICAgICAgICAndG9wJzogc2wuc2F0dXJhdGlvbi5tYXhUb3AgLSB0aGlzLmNvbG9yLnZhbHVlLmIgKiBzbC5zYXR1cmF0aW9uLm1heFRvcCxcbiAgICAgICAgICAnbGVmdCc6IHRoaXMuY29sb3IudmFsdWUucyAqIHNsLnNhdHVyYXRpb24ubWF4TGVmdFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmNvbG9ycGlja2VyLXNhdHVyYXRpb24nKS5jc3MoJ2JhY2tncm91bmRDb2xvcicsIHRoaXMuY29sb3IudG9IZXgodGhpcy5jb2xvci52YWx1ZS5oLCAxLCAxLCAxKSk7XG4gICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5jb2xvcnBpY2tlci1hbHBoYScpLmNzcygnYmFja2dyb3VuZENvbG9yJywgdGhpcy5jb2xvci50b0hleCgpKTtcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmNvbG9ycGlja2VyLWNvbG9yLCAuY29sb3JwaWNrZXItY29sb3IgZGl2JykuY3NzKCdiYWNrZ3JvdW5kQ29sb3InLCB0aGlzLmNvbG9yLnRvU3RyaW5nKHRoaXMuZm9ybWF0KSk7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgICB9LFxuICAgICAgdXBkYXRlQ29tcG9uZW50OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdmFsID0gdmFsIHx8IHRoaXMuY29sb3IudG9TdHJpbmcodGhpcy5mb3JtYXQpO1xuICAgICAgICBpZiAodGhpcy5jb21wb25lbnQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgdmFyIGljbiA9IHRoaXMuY29tcG9uZW50LmZpbmQoJ2knKS5lcSgwKTtcbiAgICAgICAgICBpZiAoaWNuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGljbi5jc3Moe1xuICAgICAgICAgICAgICAnYmFja2dyb3VuZENvbG9yJzogdmFsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb21wb25lbnQuY3NzKHtcbiAgICAgICAgICAgICAgJ2JhY2tncm91bmRDb2xvcic6IHZhbFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgICB9LFxuICAgICAgdXBkYXRlOiBmdW5jdGlvbihmb3JjZSkge1xuICAgICAgICB2YXIgdmFsO1xuICAgICAgICBpZiAoKHRoaXMuZ2V0VmFsdWUoZmFsc2UpICE9PSBmYWxzZSkgfHwgKGZvcmNlID09PSB0cnVlKSkge1xuICAgICAgICAgIC8vIFVwZGF0ZSBpbnB1dC9kYXRhIG9ubHkgaWYgdGhlIGN1cnJlbnQgdmFsdWUgaXMgbm90IGVtcHR5XG4gICAgICAgICAgdmFsID0gdGhpcy51cGRhdGVDb21wb25lbnQoKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUlucHV0KHZhbCk7XG4gICAgICAgICAgdGhpcy51cGRhdGVEYXRhKHZhbCk7XG4gICAgICAgICAgdGhpcy51cGRhdGVQaWNrZXIoKTsgLy8gb25seSB1cGRhdGUgcGlja2VyIGlmIHZhbHVlIGlzIG5vdCBlbXB0eVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWw7XG5cbiAgICAgIH0sXG4gICAgICBzZXRWYWx1ZTogZnVuY3Rpb24odmFsKSB7IC8vIHNldCBjb2xvciBtYW51YWxseVxuICAgICAgICB0aGlzLmNvbG9yID0gbmV3IENvbG9yKHZhbCwgdGhpcy5vcHRpb25zLmNvbG9yU2VsZWN0b3JzKTtcbiAgICAgICAgdGhpcy51cGRhdGUodHJ1ZSk7XG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcbiAgICAgICAgICB0eXBlOiAnY2hhbmdlQ29sb3InLFxuICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9yLFxuICAgICAgICAgIHZhbHVlOiB2YWxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKGRlZmF1bHRWYWx1ZSkge1xuICAgICAgICBkZWZhdWx0VmFsdWUgPSAoZGVmYXVsdFZhbHVlID09PSB1bmRlZmluZWQpID8gJyMwMDAwMDAnIDogZGVmYXVsdFZhbHVlO1xuICAgICAgICB2YXIgdmFsO1xuICAgICAgICBpZiAodGhpcy5oYXNJbnB1dCgpKSB7XG4gICAgICAgICAgdmFsID0gdGhpcy5pbnB1dC52YWwoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWwgPSB0aGlzLmVsZW1lbnQuZGF0YSgnY29sb3InKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHZhbCA9PT0gdW5kZWZpbmVkKSB8fCAodmFsID09PSAnJykgfHwgKHZhbCA9PT0gbnVsbCkpIHtcbiAgICAgICAgICAvLyBpZiBub3QgZGVmaW5lZCBvciBlbXB0eSwgcmV0dXJuIGRlZmF1bHRcbiAgICAgICAgICB2YWwgPSBkZWZhdWx0VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgIH0sXG4gICAgICBoYXNJbnB1dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAodGhpcy5pbnB1dCAhPT0gZmFsc2UpO1xuICAgICAgfSxcbiAgICAgIGlzRGlzYWJsZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5oYXNJbnB1dCgpKSB7XG4gICAgICAgICAgcmV0dXJuICh0aGlzLmlucHV0LnByb3AoJ2Rpc2FibGVkJykgPT09IHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgICBkaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuaGFzSW5wdXQoKSkge1xuICAgICAgICAgIHRoaXMuaW5wdXQucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XG4gICAgICAgICAgICB0eXBlOiAnZGlzYWJsZScsXG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcixcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLmdldFZhbHVlKClcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgICAgZW5hYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuaGFzSW5wdXQoKSkge1xuICAgICAgICAgIHRoaXMuaW5wdXQucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAgICAgdHlwZTogJ2VuYWJsZScsXG4gICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcixcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLmdldFZhbHVlKClcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgICAgY3VycmVudFNsaWRlcjogbnVsbCxcbiAgICAgIG1vdXNlUG9pbnRlcjoge1xuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICB0b3A6IDBcbiAgICAgIH0sXG4gICAgICBtb3VzZWRvd246IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCFlLnBhZ2VYICYmICFlLnBhZ2VZICYmIGUub3JpZ2luYWxFdmVudCkge1xuICAgICAgICAgIGUucGFnZVggPSBlLm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgICBlLnBhZ2VZID0gZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0ucGFnZVk7XG4gICAgICAgIH1cbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciB0YXJnZXQgPSAkKGUudGFyZ2V0KTtcblxuICAgICAgICAvL2RldGVjdCB0aGUgc2xpZGVyIGFuZCBzZXQgdGhlIGxpbWl0cyBhbmQgY2FsbGJhY2tzXG4gICAgICAgIHZhciB6b25lID0gdGFyZ2V0LmNsb3Nlc3QoJ2RpdicpO1xuICAgICAgICB2YXIgc2wgPSB0aGlzLm9wdGlvbnMuaG9yaXpvbnRhbCA/IHRoaXMub3B0aW9ucy5zbGlkZXJzSG9yeiA6IHRoaXMub3B0aW9ucy5zbGlkZXJzO1xuICAgICAgICBpZiAoIXpvbmUuaXMoJy5jb2xvcnBpY2tlcicpKSB7XG4gICAgICAgICAgaWYgKHpvbmUuaXMoJy5jb2xvcnBpY2tlci1zYXR1cmF0aW9uJykpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNsaWRlciA9ICQuZXh0ZW5kKHt9LCBzbC5zYXR1cmF0aW9uKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHpvbmUuaXMoJy5jb2xvcnBpY2tlci1odWUnKSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50U2xpZGVyID0gJC5leHRlbmQoe30sIHNsLmh1ZSk7XG4gICAgICAgICAgfSBlbHNlIGlmICh6b25lLmlzKCcuY29sb3JwaWNrZXItYWxwaGEnKSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50U2xpZGVyID0gJC5leHRlbmQoe30sIHNsLmFscGhhKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgb2Zmc2V0ID0gem9uZS5vZmZzZXQoKTtcbiAgICAgICAgICAvL3JlZmVyZW5jZSB0byBndWlkZSdzIHN0eWxlXG4gICAgICAgICAgdGhpcy5jdXJyZW50U2xpZGVyLmd1aWRlID0gem9uZS5maW5kKCdpJylbMF0uc3R5bGU7XG4gICAgICAgICAgdGhpcy5jdXJyZW50U2xpZGVyLmxlZnQgPSBlLnBhZ2VYIC0gb2Zmc2V0LmxlZnQ7XG4gICAgICAgICAgdGhpcy5jdXJyZW50U2xpZGVyLnRvcCA9IGUucGFnZVkgLSBvZmZzZXQudG9wO1xuICAgICAgICAgIHRoaXMubW91c2VQb2ludGVyID0ge1xuICAgICAgICAgICAgbGVmdDogZS5wYWdlWCxcbiAgICAgICAgICAgIHRvcDogZS5wYWdlWVxuICAgICAgICAgIH07XG4gICAgICAgICAgLy90cmlnZ2VyIG1vdXNlbW92ZSB0byBtb3ZlIHRoZSBndWlkZSB0byB0aGUgY3VycmVudCBwb3NpdGlvblxuICAgICAgICAgICQoZG9jdW1lbnQpLm9uKHtcbiAgICAgICAgICAgICdtb3VzZW1vdmUuY29sb3JwaWNrZXInOiAkLnByb3h5KHRoaXMubW91c2Vtb3ZlLCB0aGlzKSxcbiAgICAgICAgICAgICd0b3VjaG1vdmUuY29sb3JwaWNrZXInOiAkLnByb3h5KHRoaXMubW91c2Vtb3ZlLCB0aGlzKSxcbiAgICAgICAgICAgICdtb3VzZXVwLmNvbG9ycGlja2VyJzogJC5wcm94eSh0aGlzLm1vdXNldXAsIHRoaXMpLFxuICAgICAgICAgICAgJ3RvdWNoZW5kLmNvbG9ycGlja2VyJzogJC5wcm94eSh0aGlzLm1vdXNldXAsIHRoaXMpXG4gICAgICAgICAgfSkudHJpZ2dlcignbW91c2Vtb3ZlJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICAgIG1vdXNlbW92ZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoIWUucGFnZVggJiYgIWUucGFnZVkgJiYgZS5vcmlnaW5hbEV2ZW50KSB7XG4gICAgICAgICAgZS5wYWdlWCA9IGUub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICAgIGUucGFnZVkgPSBlLm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgfVxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciBsZWZ0ID0gTWF0aC5tYXgoXG4gICAgICAgICAgMCxcbiAgICAgICAgICBNYXRoLm1pbihcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNsaWRlci5tYXhMZWZ0LFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50U2xpZGVyLmxlZnQgKyAoKGUucGFnZVggfHwgdGhpcy5tb3VzZVBvaW50ZXIubGVmdCkgLSB0aGlzLm1vdXNlUG9pbnRlci5sZWZ0KVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgICAgdmFyIHRvcCA9IE1hdGgubWF4KFxuICAgICAgICAgIDAsXG4gICAgICAgICAgTWF0aC5taW4oXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTbGlkZXIubWF4VG9wLFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50U2xpZGVyLnRvcCArICgoZS5wYWdlWSB8fCB0aGlzLm1vdXNlUG9pbnRlci50b3ApIC0gdGhpcy5tb3VzZVBvaW50ZXIudG9wKVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5jdXJyZW50U2xpZGVyLmd1aWRlLmxlZnQgPSBsZWZ0ICsgJ3B4JztcbiAgICAgICAgdGhpcy5jdXJyZW50U2xpZGVyLmd1aWRlLnRvcCA9IHRvcCArICdweCc7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTbGlkZXIuY2FsbExlZnQpIHtcbiAgICAgICAgICB0aGlzLmNvbG9yW3RoaXMuY3VycmVudFNsaWRlci5jYWxsTGVmdF0uY2FsbCh0aGlzLmNvbG9yLCBsZWZ0IC8gdGhpcy5jdXJyZW50U2xpZGVyLm1heExlZnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTbGlkZXIuY2FsbFRvcCkge1xuICAgICAgICAgIHRoaXMuY29sb3JbdGhpcy5jdXJyZW50U2xpZGVyLmNhbGxUb3BdLmNhbGwodGhpcy5jb2xvciwgdG9wIC8gdGhpcy5jdXJyZW50U2xpZGVyLm1heFRvcCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ2hhbmdlIGZvcm1hdCBkeW5hbWljYWxseVxuICAgICAgICAvLyBPbmx5IG9jY3VycyBpZiB1c2VyIGNob29zZSB0aGUgZHluYW1pYyBmb3JtYXQgYnlcbiAgICAgICAgLy8gc2V0dGluZyBvcHRpb24gZm9ybWF0IHRvIGZhbHNlXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTbGlkZXIuY2FsbFRvcCA9PT0gJ3NldEFscGhhJyAmJiB0aGlzLm9wdGlvbnMuZm9ybWF0ID09PSBmYWxzZSkge1xuXG4gICAgICAgICAgLy8gQ29udmVydGluZyBmcm9tIGhleCAvIHJnYiB0byByZ2JhXG4gICAgICAgICAgaWYgKHRoaXMuY29sb3IudmFsdWUuYSAhPT0gMSkge1xuICAgICAgICAgICAgdGhpcy5mb3JtYXQgPSAncmdiYSc7XG4gICAgICAgICAgICB0aGlzLmNvbG9yLm9yaWdGb3JtYXQgPSAncmdiYSc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ29udmVydGluZyBmcm9tIHJnYmEgdG8gaGV4XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZvcm1hdCA9ICdoZXgnO1xuICAgICAgICAgICAgdGhpcy5jb2xvci5vcmlnRm9ybWF0ID0gJ2hleCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlKHRydWUpO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcbiAgICAgICAgICB0eXBlOiAnY2hhbmdlQ29sb3InLFxuICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9yXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgICAgbW91c2V1cDogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9mZih7XG4gICAgICAgICAgJ21vdXNlbW92ZS5jb2xvcnBpY2tlcic6IHRoaXMubW91c2Vtb3ZlLFxuICAgICAgICAgICd0b3VjaG1vdmUuY29sb3JwaWNrZXInOiB0aGlzLm1vdXNlbW92ZSxcbiAgICAgICAgICAnbW91c2V1cC5jb2xvcnBpY2tlcic6IHRoaXMubW91c2V1cCxcbiAgICAgICAgICAndG91Y2hlbmQuY29sb3JwaWNrZXInOiB0aGlzLm1vdXNldXBcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgICBjaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhpcy5rZXl1cChlKTtcbiAgICAgIH0sXG4gICAgICBrZXl1cDogZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoKGUua2V5Q29kZSA9PT0gMzgpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuY29sb3IudmFsdWUuYSA8IDEpIHtcbiAgICAgICAgICAgIHRoaXMuY29sb3IudmFsdWUuYSA9IE1hdGgucm91bmQoKHRoaXMuY29sb3IudmFsdWUuYSArIDAuMDEpICogMTAwKSAvIDEwMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGUodHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoKGUua2V5Q29kZSA9PT0gNDApKSB7XG4gICAgICAgICAgaWYgKHRoaXMuY29sb3IudmFsdWUuYSA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuY29sb3IudmFsdWUuYSA9IE1hdGgucm91bmQoKHRoaXMuY29sb3IudmFsdWUuYSAtIDAuMDEpICogMTAwKSAvIDEwMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGUodHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb2xvciA9IG5ldyBDb2xvcih0aGlzLmlucHV0LnZhbCgpLCB0aGlzLm9wdGlvbnMuY29sb3JTZWxlY3RvcnMpO1xuICAgICAgICAgIC8vIENoYW5nZSBmb3JtYXQgZHluYW1pY2FsbHlcbiAgICAgICAgICAvLyBPbmx5IG9jY3VycyBpZiB1c2VyIGNob29zZSB0aGUgZHluYW1pYyBmb3JtYXQgYnlcbiAgICAgICAgICAvLyBzZXR0aW5nIG9wdGlvbiBmb3JtYXQgdG8gZmFsc2VcbiAgICAgICAgICBpZiAodGhpcy5jb2xvci5vcmlnRm9ybWF0ICYmIHRoaXMub3B0aW9ucy5mb3JtYXQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLmZvcm1hdCA9IHRoaXMuY29sb3Iub3JpZ0Zvcm1hdDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuZ2V0VmFsdWUoZmFsc2UpICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVEYXRhKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbXBvbmVudCgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVQaWNrZXIoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAgIHR5cGU6ICdjaGFuZ2VDb2xvcicsXG4gICAgICAgICAgY29sb3I6IHRoaXMuY29sb3IsXG4gICAgICAgICAgdmFsdWU6IHRoaXMuaW5wdXQudmFsKClcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICQuY29sb3JwaWNrZXIgPSBDb2xvcnBpY2tlcjtcblxuICAgICQuZm4uY29sb3JwaWNrZXIgPSBmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgIHZhciBwaWNrZXJBcmdzID0gYXJndW1lbnRzLFxuICAgICAgICBydjtcblxuICAgICAgdmFyICRyZXR1cm5WYWx1ZSA9IHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICBpbnN0ID0gJHRoaXMuZGF0YSgnY29sb3JwaWNrZXInKSxcbiAgICAgICAgICBvcHRpb25zID0gKCh0eXBlb2Ygb3B0aW9uID09PSAnb2JqZWN0JykgPyBvcHRpb24gOiB7fSk7XG4gICAgICAgIGlmICgoIWluc3QpICYmICh0eXBlb2Ygb3B0aW9uICE9PSAnc3RyaW5nJykpIHtcbiAgICAgICAgICAkdGhpcy5kYXRhKCdjb2xvcnBpY2tlcicsIG5ldyBDb2xvcnBpY2tlcih0aGlzLCBvcHRpb25zKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBydiA9IGluc3Rbb3B0aW9uXS5hcHBseShpbnN0LCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChwaWNrZXJBcmdzLCAxKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmIChvcHRpb24gPT09ICdnZXRWYWx1ZScpIHtcbiAgICAgICAgcmV0dXJuIHJ2O1xuICAgICAgfVxuICAgICAgcmV0dXJuICRyZXR1cm5WYWx1ZTtcbiAgICB9O1xuXG4gICAgJC5mbi5jb2xvcnBpY2tlci5jb25zdHJ1Y3RvciA9IENvbG9ycGlja2VyO1xuXG4gIH0pKTtcbiJdfQ==

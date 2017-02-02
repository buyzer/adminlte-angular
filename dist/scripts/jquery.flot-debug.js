/* Javascript plotting library for jQuery, version 0.8.2.

Copyright (c) 2007-2013 IOLA and Ole Laursen.
Licensed under the MIT license.

*/

// first an inline dependency, jquery.colorhelpers.js, we inline it here
// for convenience

/* Plugin for jQuery for working with colors.
 *
 * Version 1.1.
 *
 * Inspiration from jQuery color animation plugin by John Resig.
 *
 * Released under the MIT license by Ole Laursen, October 2009.
 *
 * Examples:
 *
 *   $.color.parse("#fff").scale('rgb', 0.25).add('a', -0.5).toString()
 *   var c = $.color.extract($("#mydiv"), 'background-color');
 *   console.log(c.r, c.g, c.b, c.a);
 *   $.color.make(100, 50, 25, 0.4).toString() // returns "rgba(100,50,25,0.4)"
 *
 * Note that .scale() and .add() return the same modified object
 * instead of making a new one.
 *
 * V. 1.1: Fix error handling so e.g. parsing an empty string does
 * produce a color rather than just crashing.
 */
(function($){$.color={};$.color.make=function(r,g,b,a){var o={};o.r=r||0;o.g=g||0;o.b=b||0;o.a=a!=null?a:1;o.add=function(c,d){for(var i=0;i<c.length;++i)o[c.charAt(i)]+=d;return o.normalize()};o.scale=function(c,f){for(var i=0;i<c.length;++i)o[c.charAt(i)]*=f;return o.normalize()};o.toString=function(){if(o.a>=1){return"rgb("+[o.r,o.g,o.b].join(",")+")"}else{return"rgba("+[o.r,o.g,o.b,o.a].join(",")+")"}};o.normalize=function(){function clamp(min,value,max){return value<min?min:value>max?max:value}o.r=clamp(0,parseInt(o.r),255);o.g=clamp(0,parseInt(o.g),255);o.b=clamp(0,parseInt(o.b),255);o.a=clamp(0,o.a,1);return o};o.clone=function(){return $.color.make(o.r,o.b,o.g,o.a)};return o.normalize()};$.color.extract=function(elem,css){var c;do{c=elem.css(css).toLowerCase();if(c!=""&&c!="transparent")break;elem=elem.parent()}while(elem.length&&!$.nodeName(elem.get(0),"body"));if(c=="rgba(0, 0, 0, 0)")c="transparent";return $.color.parse(c)};$.color.parse=function(str){var res,m=$.color.make;if(res=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(str))return m(parseInt(res[1],10),parseInt(res[2],10),parseInt(res[3],10));if(res=/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str))return m(parseInt(res[1],10),parseInt(res[2],10),parseInt(res[3],10),parseFloat(res[4]));if(res=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(str))return m(parseFloat(res[1])*2.55,parseFloat(res[2])*2.55,parseFloat(res[3])*2.55);if(res=/rgba\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str))return m(parseFloat(res[1])*2.55,parseFloat(res[2])*2.55,parseFloat(res[3])*2.55,parseFloat(res[4]));if(res=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(str))return m(parseInt(res[1],16),parseInt(res[2],16),parseInt(res[3],16));if(res=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(str))return m(parseInt(res[1]+res[1],16),parseInt(res[2]+res[2],16),parseInt(res[3]+res[3],16));var name=$.trim(str).toLowerCase();if(name=="transparent")return m(255,255,255,0);else{res=lookupColors[name]||[0,0,0];return m(res[0],res[1],res[2])}};var lookupColors={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0]}})(jQuery);

// the actual Flot code
(function($) {

	// Cache the prototype hasOwnProperty for faster access

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	///////////////////////////////////////////////////////////////////////////
	// The Canvas object is a wrapper around an HTML5 <canvas> tag.
	//
	// @constructor
	// @param {string} cls List of classes to apply to the canvas.
	// @param {element} container Element onto which to append the canvas.
	//
	// Requiring a container is a little iffy, but unfortunately canvas
	// operations don't work unless the canvas is attached to the DOM.

	function Canvas(cls, container) {

		var element = container.children("." + cls)[0];

		if (element == null) {

			element = document.createElement("canvas");
			element.className = cls;

			$(element).css({ direction: "ltr", position: "absolute", left: 0, top: 0 })
				.appendTo(container);

			// If HTML5 Canvas isn't available, fall back to [Ex|Flash]canvas

			if (!element.getContext) {
				if (window.G_vmlCanvasManager) {
					element = window.G_vmlCanvasManager.initElement(element);
				} else {
					throw new Error("Canvas is not available. If you're using IE with a fall-back such as Excanvas, then there's either a mistake in your conditional include, or the page has no DOCTYPE and is rendering in Quirks Mode.");
				}
			}
		}

		this.element = element;

		var context = this.context = element.getContext("2d");

		// Determine the screen's ratio of physical to device-independent
		// pixels.  This is the ratio between the canvas width that the browser
		// advertises and the number of pixels actually present in that space.

		// The iPhone 4, for example, has a device-independent width of 320px,
		// but its screen is actually 640px wide.  It therefore has a pixel
		// ratio of 2, while most normal devices have a ratio of 1.

		var devicePixelRatio = window.devicePixelRatio || 1,
			backingStoreRatio =
				context.webkitBackingStorePixelRatio ||
				context.mozBackingStorePixelRatio ||
				context.msBackingStorePixelRatio ||
				context.oBackingStorePixelRatio ||
				context.backingStorePixelRatio || 1;

		this.pixelRatio = devicePixelRatio / backingStoreRatio;

		// Size the canvas to match the internal dimensions of its container

		this.resize(container.width(), container.height());

		// Collection of HTML div layers for text overlaid onto the canvas

		this.textContainer = null;
		this.text = {};

		// Cache of text fragments and metrics, so we can avoid expensively
		// re-calculating them when the plot is re-rendered in a loop.

		this._textCache = {};
	}

	// Resizes the canvas to the given dimensions.
	//
	// @param {number} width New width of the canvas, in pixels.
	// @param {number} width New height of the canvas, in pixels.

	Canvas.prototype.resize = function(width, height) {

		if (width <= 0 || height <= 0) {
			throw new Error("Invalid dimensions for plot, width = " + width + ", height = " + height);
		}

		var element = this.element,
			context = this.context,
			pixelRatio = this.pixelRatio;

		// Resize the canvas, increasing its density based on the display's
		// pixel ratio; basically giving it more pixels without increasing the
		// size of its element, to take advantage of the fact that retina
		// displays have that many more pixels in the same advertised space.

		// Resizing should reset the state (excanvas seems to be buggy though)

		if (this.width != width) {
			element.width = width * pixelRatio;
			element.style.width = width + "px";
			this.width = width;
		}

		if (this.height != height) {
			element.height = height * pixelRatio;
			element.style.height = height + "px";
			this.height = height;
		}

		// Save the context, so we can reset in case we get replotted.  The
		// restore ensure that we're really back at the initial state, and
		// should be safe even if we haven't saved the initial state yet.

		context.restore();
		context.save();

		// Scale the coordinate space to match the display density; so even though we
		// may have twice as many pixels, we still want lines and other drawing to
		// appear at the same size; the extra pixels will just make them crisper.

		context.scale(pixelRatio, pixelRatio);
	};

	// Clears the entire canvas area, not including any overlaid HTML text

	Canvas.prototype.clear = function() {
		this.context.clearRect(0, 0, this.width, this.height);
	};

	// Finishes rendering the canvas, including managing the text overlay.

	Canvas.prototype.render = function() {

		var cache = this._textCache;

		// For each text layer, add elements marked as active that haven't
		// already been rendered, and remove those that are no longer active.

		for (var layerKey in cache) {
			if (hasOwnProperty.call(cache, layerKey)) {

				var layer = this.getTextLayer(layerKey),
					layerCache = cache[layerKey];

				layer.hide();

				for (var styleKey in layerCache) {
					if (hasOwnProperty.call(layerCache, styleKey)) {
						var styleCache = layerCache[styleKey];
						for (var key in styleCache) {
							if (hasOwnProperty.call(styleCache, key)) {

								var positions = styleCache[key].positions;

								for (var i = 0, position; position = positions[i]; i++) {
									if (position.active) {
										if (!position.rendered) {
											layer.append(position.element);
											position.rendered = true;
										}
									} else {
										positions.splice(i--, 1);
										if (position.rendered) {
											position.element.detach();
										}
									}
								}

								if (positions.length == 0) {
									delete styleCache[key];
								}
							}
						}
					}
				}

				layer.show();
			}
		}
	};

	// Creates (if necessary) and returns the text overlay container.
	//
	// @param {string} classes String of space-separated CSS classes used to
	//     uniquely identify the text layer.
	// @return {object} The jQuery-wrapped text-layer div.

	Canvas.prototype.getTextLayer = function(classes) {

		var layer = this.text[classes];

		// Create the text layer if it doesn't exist

		if (layer == null) {

			// Create the text layer container, if it doesn't exist

			if (this.textContainer == null) {
				this.textContainer = $("<div class='flot-text'></div>")
					.css({
						position: "absolute",
						top: 0,
						left: 0,
						bottom: 0,
						right: 0,
						'font-size': "smaller",
						color: "#545454"
					})
					.insertAfter(this.element);
			}

			layer = this.text[classes] = $("<div></div>")
				.addClass(classes)
				.css({
					position: "absolute",
					top: 0,
					left: 0,
					bottom: 0,
					right: 0
				})
				.appendTo(this.textContainer);
		}

		return layer;
	};

	// Creates (if necessary) and returns a text info object.
	//
	// The object looks like this:
	//
	// {
	//     width: Width of the text's wrapper div.
	//     height: Height of the text's wrapper div.
	//     element: The jQuery-wrapped HTML div containing the text.
	//     positions: Array of positions at which this text is drawn.
	// }
	//
	// The positions array contains objects that look like this:
	//
	// {
	//     active: Flag indicating whether the text should be visible.
	//     rendered: Flag indicating whether the text is currently visible.
	//     element: The jQuery-wrapped HTML div containing the text.
	//     x: X coordinate at which to draw the text.
	//     y: Y coordinate at which to draw the text.
	// }
	//
	// Each position after the first receives a clone of the original element.
	//
	// The idea is that that the width, height, and general 'identity' of the
	// text is constant no matter where it is placed; the placements are a
	// secondary property.
	//
	// Canvas maintains a cache of recently-used text info objects; getTextInfo
	// either returns the cached element or creates a new entry.
	//
	// @param {string} layer A string of space-separated CSS classes uniquely
	//     identifying the layer containing this text.
	// @param {string} text Text string to retrieve info for.
	// @param {(string|object)=} font Either a string of space-separated CSS
	//     classes or a font-spec object, defining the text's font and style.
	// @param {number=} angle Angle at which to rotate the text, in degrees.
	//     Angle is currently unused, it will be implemented in the future.
	// @param {number=} width Maximum width of the text before it wraps.
	// @return {object} a text info object.

	Canvas.prototype.getTextInfo = function(layer, text, font, angle, width) {

		var textStyle, layerCache, styleCache, info;

		// Cast the value to a string, in case we were given a number or such

		text = "" + text;

		// If the font is a font-spec object, generate a CSS font definition

		if (typeof font === "object") {
			textStyle = font.style + " " + font.variant + " " + font.weight + " " + font.size + "px/" + font.lineHeight + "px " + font.family;
		} else {
			textStyle = font;
		}

		// Retrieve (or create) the cache for the text's layer and styles

		layerCache = this._textCache[layer];

		if (layerCache == null) {
			layerCache = this._textCache[layer] = {};
		}

		styleCache = layerCache[textStyle];

		if (styleCache == null) {
			styleCache = layerCache[textStyle] = {};
		}

		info = styleCache[text];

		// If we can't find a matching element in our cache, create a new one

		if (info == null) {

			var element = $("<div></div>").html(text)
				.css({
					position: "absolute",
					'max-width': width,
					top: -9999
				})
				.appendTo(this.getTextLayer(layer));

			if (typeof font === "object") {
				element.css({
					font: textStyle,
					color: font.color
				});
			} else if (typeof font === "string") {
				element.addClass(font);
			}

			info = styleCache[text] = {
				width: element.outerWidth(true),
				height: element.outerHeight(true),
				element: element,
				positions: []
			};

			element.detach();
		}

		return info;
	};

	// Adds a text string to the canvas text overlay.
	//
	// The text isn't drawn immediately; it is marked as rendering, which will
	// result in its addition to the canvas on the next render pass.
	//
	// @param {string} layer A string of space-separated CSS classes uniquely
	//     identifying the layer containing this text.
	// @param {number} x X coordinate at which to draw the text.
	// @param {number} y Y coordinate at which to draw the text.
	// @param {string} text Text string to draw.
	// @param {(string|object)=} font Either a string of space-separated CSS
	//     classes or a font-spec object, defining the text's font and style.
	// @param {number=} angle Angle at which to rotate the text, in degrees.
	//     Angle is currently unused, it will be implemented in the future.
	// @param {number=} width Maximum width of the text before it wraps.
	// @param {string=} halign Horizontal alignment of the text; either "left",
	//     "center" or "right".
	// @param {string=} valign Vertical alignment of the text; either "top",
	//     "middle" or "bottom".

	Canvas.prototype.addText = function(layer, x, y, text, font, angle, width, halign, valign) {

		var info = this.getTextInfo(layer, text, font, angle, width),
			positions = info.positions;

		// Tweak the div's position to match the text's alignment

		if (halign == "center") {
			x -= info.width / 2;
		} else if (halign == "right") {
			x -= info.width;
		}

		if (valign == "middle") {
			y -= info.height / 2;
		} else if (valign == "bottom") {
			y -= info.height;
		}

		// Determine whether this text already exists at this position.
		// If so, mark it for inclusion in the next render pass.

		for (var i = 0, position; position = positions[i]; i++) {
			if (position.x == x && position.y == y) {
				position.active = true;
				return;
			}
		}

		// If the text doesn't exist at this position, create a new entry

		// For the very first position we'll re-use the original element,
		// while for subsequent ones we'll clone it.

		position = {
			active: true,
			rendered: false,
			element: positions.length ? info.element.clone() : info.element,
			x: x,
			y: y
		};

		positions.push(position);

		// Move the element to its final position within the container

		position.element.css({
			top: Math.round(y),
			left: Math.round(x),
			'text-align': halign	// In case the text wraps
		});
	};

	// Removes one or more text strings from the canvas text overlay.
	//
	// If no parameters are given, all text within the layer is removed.
	//
	// Note that the text is not immediately removed; it is simply marked as
	// inactive, which will result in its removal on the next render pass.
	// This avoids the performance penalty for 'clear and redraw' behavior,
	// where we potentially get rid of all text on a layer, but will likely
	// add back most or all of it later, as when redrawing axes, for example.
	//
	// @param {string} layer A string of space-separated CSS classes uniquely
	//     identifying the layer containing this text.
	// @param {number=} x X coordinate of the text.
	// @param {number=} y Y coordinate of the text.
	// @param {string=} text Text string to remove.
	// @param {(string|object)=} font Either a string of space-separated CSS
	//     classes or a font-spec object, defining the text's font and style.
	// @param {number=} angle Angle at which the text is rotated, in degrees.
	//     Angle is currently unused, it will be implemented in the future.

	Canvas.prototype.removeText = function(layer, x, y, text, font, angle) {
		if (text == null) {
			var layerCache = this._textCache[layer];
			if (layerCache != null) {
				for (var styleKey in layerCache) {
					if (hasOwnProperty.call(layerCache, styleKey)) {
						var styleCache = layerCache[styleKey];
						for (var key in styleCache) {
							if (hasOwnProperty.call(styleCache, key)) {
								var positions = styleCache[key].positions;
								for (var i = 0, position; position = positions[i]; i++) {
									position.active = false;
								}
							}
						}
					}
				}
			}
		} else {
			var positions = this.getTextInfo(layer, text, font, angle).positions;
			for (var i = 0, position; position = positions[i]; i++) {
				if (position.x == x && position.y == y) {
					position.active = false;
				}
			}
		}
	};

	///////////////////////////////////////////////////////////////////////////
	// The top-level container for the entire plot.

    function Plot(placeholder, data_, options_, plugins) {
        // data is on the form:
        //   [ series1, series2 ... ]
        // where series is either just the data as [ [x1, y1], [x2, y2], ... ]
        // or { data: [ [x1, y1], [x2, y2], ... ], label: "some label", ... }

        var series = [],
            options = {
                // the color theme used for graphs
                colors: ["#edc240", "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed"],
                legend: {
                    show: true,
                    noColumns: 1, // number of colums in legend table
                    labelFormatter: null, // fn: string -> string
                    labelBoxBorderColor: "#ccc", // border color for the little label boxes
                    container: null, // container (as jQuery object) to put legend in, null means default on top of graph
                    position: "ne", // position of default legend container within plot
                    margin: 5, // distance from grid edge to default legend container within plot
                    backgroundColor: null, // null means auto-detect
                    backgroundOpacity: 0.85, // set to 0 to avoid background
                    sorted: null    // default to no legend sorting
                },
                xaxis: {
                    show: null, // null = auto-detect, true = always, false = never
                    position: "bottom", // or "top"
                    mode: null, // null or "time"
                    font: null, // null (derived from CSS in placeholder) or object like { size: 11, lineHeight: 13, style: "italic", weight: "bold", family: "sans-serif", variant: "small-caps" }
                    color: null, // base color, labels, ticks
                    tickColor: null, // possibly different color of ticks, e.g. "rgba(0,0,0,0.15)"
                    transform: null, // null or f: number -> number to transform axis
                    inverseTransform: null, // if transform is set, this should be the inverse function
                    min: null, // min. value to show, null means set automatically
                    max: null, // max. value to show, null means set automatically
                    autoscaleMargin: null, // margin in % to add if auto-setting min/max
                    ticks: null, // either [1, 3] or [[1, "a"], 3] or (fn: axis info -> ticks) or app. number of ticks for auto-ticks
                    tickFormatter: null, // fn: number -> string
                    labelWidth: null, // size of tick labels in pixels
                    labelHeight: null,
                    reserveSpace: null, // whether to reserve space even if axis isn't shown
                    tickLength: null, // size in pixels of ticks, or "full" for whole line
                    alignTicksWithAxis: null, // axis number or null for no sync
                    tickDecimals: null, // no. of decimals, null means auto
                    tickSize: null, // number or [number, "unit"]
                    minTickSize: null // number or [number, "unit"]
                },
                yaxis: {
                    autoscaleMargin: 0.02,
                    position: "left" // or "right"
                },
                xaxes: [],
                yaxes: [],
                series: {
                    points: {
                        show: false,
                        radius: 3,
                        lineWidth: 2, // in pixels
                        fill: true,
                        fillColor: "#ffffff",
                        symbol: "circle" // or callback
                    },
                    lines: {
                        // we don't put in show: false so we can see
                        // whether lines were actively disabled
                        lineWidth: 2, // in pixels
                        fill: false,
                        fillColor: null,
                        steps: false
                        // Omit 'zero', so we can later default its value to
                        // match that of the 'fill' option.
                    },
                    bars: {
                        show: false,
                        lineWidth: 2, // in pixels
                        barWidth: 1, // in units of the x axis
                        fill: true,
                        fillColor: null,
                        align: "left", // "left", "right", or "center"
                        horizontal: false,
                        zero: true
                    },
                    shadowSize: 3,
                    highlightColor: null
                },
                grid: {
                    show: true,
                    aboveData: false,
                    color: "#545454", // primary color used for outline and labels
                    backgroundColor: null, // null for transparent, else color
                    borderColor: null, // set if different from the grid color
                    tickColor: null, // color for the ticks, e.g. "rgba(0,0,0,0.15)"
                    margin: 0, // distance from the canvas edge to the grid
                    labelMargin: 5, // in pixels
                    axisMargin: 8, // in pixels
                    borderWidth: 2, // in pixels
                    minBorderMargin: null, // in pixels, null means taken from points radius
                    markings: null, // array of ranges or fn: axes -> array of ranges
                    markingsColor: "#f4f4f4",
                    markingsLineWidth: 2,
                    // interactive stuff
                    clickable: false,
                    hoverable: false,
                    autoHighlight: true, // highlight in case mouse is near
                    mouseActiveRadius: 10 // how far the mouse can be away to activate an item
                },
                interaction: {
                    redrawOverlayInterval: 1000/60 // time between updates, -1 means in same flow
                },
                hooks: {}
            },
        surface = null,     // the canvas for the plot itself
        overlay = null,     // canvas for interactive stuff on top of plot
        eventHolder = null, // jQuery object that events should be bound to
        ctx = null, octx = null,
        xaxes = [], yaxes = [],
        plotOffset = { left: 0, right: 0, top: 0, bottom: 0},
        plotWidth = 0, plotHeight = 0,
        hooks = {
            processOptions: [],
            processRawData: [],
            processDatapoints: [],
            processOffset: [],
            drawBackground: [],
            drawSeries: [],
            draw: [],
            bindEvents: [],
            drawOverlay: [],
            shutdown: []
        },
        plot = this;

        // public functions
        plot.setData = setData;
        plot.setupGrid = setupGrid;
        plot.draw = draw;
        plot.getPlaceholder = function() { return placeholder; };
        plot.getCanvas = function() { return surface.element; };
        plot.getPlotOffset = function() { return plotOffset; };
        plot.width = function () { return plotWidth; };
        plot.height = function () { return plotHeight; };
        plot.offset = function () {
            var o = eventHolder.offset();
            o.left += plotOffset.left;
            o.top += plotOffset.top;
            return o;
        };
        plot.getData = function () { return series; };
        plot.getAxes = function () {
            var res = {}, i;
            $.each(xaxes.concat(yaxes), function (_, axis) {
                if (axis)
                    res[axis.direction + (axis.n != 1 ? axis.n : "") + "axis"] = axis;
            });
            return res;
        };
        plot.getXAxes = function () { return xaxes; };
        plot.getYAxes = function () { return yaxes; };
        plot.c2p = canvasToAxisCoords;
        plot.p2c = axisToCanvasCoords;
        plot.getOptions = function () { return options; };
        plot.highlight = highlight;
        plot.unhighlight = unhighlight;
        plot.triggerRedrawOverlay = triggerRedrawOverlay;
        plot.pointOffset = function(point) {
            return {
                left: parseInt(xaxes[axisNumber(point, "x") - 1].p2c(+point.x) + plotOffset.left, 10),
                top: parseInt(yaxes[axisNumber(point, "y") - 1].p2c(+point.y) + plotOffset.top, 10)
            };
        };
        plot.shutdown = shutdown;
        plot.destroy = function () {
            shutdown();
            placeholder.removeData("plot").empty();

            series = [];
            options = null;
            surface = null;
            overlay = null;
            eventHolder = null;
            ctx = null;
            octx = null;
            xaxes = [];
            yaxes = [];
            hooks = null;
            highlights = [];
            plot = null;
        };
        plot.resize = function () {
        	var width = placeholder.width(),
        		height = placeholder.height();
            surface.resize(width, height);
            overlay.resize(width, height);
        };

        // public attributes
        plot.hooks = hooks;

        // initialize
        initPlugins(plot);
        parseOptions(options_);
        setupCanvases();
        setData(data_);
        setupGrid();
        draw();
        bindEvents();


        function executeHooks(hook, args) {
            args = [plot].concat(args);
            for (var i = 0; i < hook.length; ++i)
                hook[i].apply(this, args);
        }

        function initPlugins() {

            // References to key classes, allowing plugins to modify them

            var classes = {
                Canvas: Canvas
            };

            for (var i = 0; i < plugins.length; ++i) {
                var p = plugins[i];
                p.init(plot, classes);
                if (p.options)
                    $.extend(true, options, p.options);
            }
        }

        function parseOptions(opts) {

            $.extend(true, options, opts);

            // $.extend merges arrays, rather than replacing them.  When less
            // colors are provided than the size of the default palette, we
            // end up with those colors plus the remaining defaults, which is
            // not expected behavior; avoid it by replacing them here.

            if (opts && opts.colors) {
            	options.colors = opts.colors;
            }

            if (options.xaxis.color == null)
                options.xaxis.color = $.color.parse(options.grid.color).scale('a', 0.22).toString();
            if (options.yaxis.color == null)
                options.yaxis.color = $.color.parse(options.grid.color).scale('a', 0.22).toString();

            if (options.xaxis.tickColor == null) // grid.tickColor for back-compatibility
                options.xaxis.tickColor = options.grid.tickColor || options.xaxis.color;
            if (options.yaxis.tickColor == null) // grid.tickColor for back-compatibility
                options.yaxis.tickColor = options.grid.tickColor || options.yaxis.color;

            if (options.grid.borderColor == null)
                options.grid.borderColor = options.grid.color;
            if (options.grid.tickColor == null)
                options.grid.tickColor = $.color.parse(options.grid.color).scale('a', 0.22).toString();

            // Fill in defaults for axis options, including any unspecified
            // font-spec fields, if a font-spec was provided.

            // If no x/y axis options were provided, create one of each anyway,
            // since the rest of the code assumes that they exist.

            var i, axisOptions, axisCount,
                fontSize = placeholder.css("font-size"),
                fontSizeDefault = fontSize ? +fontSize.replace("px", "") : 13,
                fontDefaults = {
                    style: placeholder.css("font-style"),
                    size: Math.round(0.8 * fontSizeDefault),
                    variant: placeholder.css("font-variant"),
                    weight: placeholder.css("font-weight"),
                    family: placeholder.css("font-family")
                };

            axisCount = options.xaxes.length || 1;
            for (i = 0; i < axisCount; ++i) {

                axisOptions = options.xaxes[i];
                if (axisOptions && !axisOptions.tickColor) {
                    axisOptions.tickColor = axisOptions.color;
                }

                axisOptions = $.extend(true, {}, options.xaxis, axisOptions);
                options.xaxes[i] = axisOptions;

                if (axisOptions.font) {
                    axisOptions.font = $.extend({}, fontDefaults, axisOptions.font);
                    if (!axisOptions.font.color) {
                        axisOptions.font.color = axisOptions.color;
                    }
                    if (!axisOptions.font.lineHeight) {
                        axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
                    }
                }
            }

            axisCount = options.yaxes.length || 1;
            for (i = 0; i < axisCount; ++i) {

                axisOptions = options.yaxes[i];
                if (axisOptions && !axisOptions.tickColor) {
                    axisOptions.tickColor = axisOptions.color;
                }

                axisOptions = $.extend(true, {}, options.yaxis, axisOptions);
                options.yaxes[i] = axisOptions;

                if (axisOptions.font) {
                    axisOptions.font = $.extend({}, fontDefaults, axisOptions.font);
                    if (!axisOptions.font.color) {
                        axisOptions.font.color = axisOptions.color;
                    }
                    if (!axisOptions.font.lineHeight) {
                        axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
                    }
                }
            }

            // backwards compatibility, to be removed in future
            if (options.xaxis.noTicks && options.xaxis.ticks == null)
                options.xaxis.ticks = options.xaxis.noTicks;
            if (options.yaxis.noTicks && options.yaxis.ticks == null)
                options.yaxis.ticks = options.yaxis.noTicks;
            if (options.x2axis) {
                options.xaxes[1] = $.extend(true, {}, options.xaxis, options.x2axis);
                options.xaxes[1].position = "top";
            }
            if (options.y2axis) {
                options.yaxes[1] = $.extend(true, {}, options.yaxis, options.y2axis);
                options.yaxes[1].position = "right";
            }
            if (options.grid.coloredAreas)
                options.grid.markings = options.grid.coloredAreas;
            if (options.grid.coloredAreasColor)
                options.grid.markingsColor = options.grid.coloredAreasColor;
            if (options.lines)
                $.extend(true, options.series.lines, options.lines);
            if (options.points)
                $.extend(true, options.series.points, options.points);
            if (options.bars)
                $.extend(true, options.series.bars, options.bars);
            if (options.shadowSize != null)
                options.series.shadowSize = options.shadowSize;
            if (options.highlightColor != null)
                options.series.highlightColor = options.highlightColor;

            // save options on axes for future reference
            for (i = 0; i < options.xaxes.length; ++i)
                getOrCreateAxis(xaxes, i + 1).options = options.xaxes[i];
            for (i = 0; i < options.yaxes.length; ++i)
                getOrCreateAxis(yaxes, i + 1).options = options.yaxes[i];

            // add hooks from options
            for (var n in hooks)
                if (options.hooks[n] && options.hooks[n].length)
                    hooks[n] = hooks[n].concat(options.hooks[n]);

            executeHooks(hooks.processOptions, [options]);
        }

        function setData(d) {
            series = parseData(d);
            fillInSeriesOptions();
            processData();
        }

        function parseData(d) {
            var res = [];
            for (var i = 0; i < d.length; ++i) {
                var s = $.extend(true, {}, options.series);

                if (d[i].data != null) {
                    s.data = d[i].data; // move the data instead of deep-copy
                    delete d[i].data;

                    $.extend(true, s, d[i]);

                    d[i].data = s.data;
                }
                else
                    s.data = d[i];
                res.push(s);
            }

            return res;
        }

        function axisNumber(obj, coord) {
            var a = obj[coord + "axis"];
            if (typeof a == "object") // if we got a real axis, extract number
                a = a.n;
            if (typeof a != "number")
                a = 1; // default to first axis
            return a;
        }

        function allAxes() {
            // return flat array without annoying null entries
            return $.grep(xaxes.concat(yaxes), function (a) { return a; });
        }

        function canvasToAxisCoords(pos) {
            // return an object with x/y corresponding to all used axes
            var res = {}, i, axis;
            for (i = 0; i < xaxes.length; ++i) {
                axis = xaxes[i];
                if (axis && axis.used)
                    res["x" + axis.n] = axis.c2p(pos.left);
            }

            for (i = 0; i < yaxes.length; ++i) {
                axis = yaxes[i];
                if (axis && axis.used)
                    res["y" + axis.n] = axis.c2p(pos.top);
            }

            if (res.x1 !== undefined)
                res.x = res.x1;
            if (res.y1 !== undefined)
                res.y = res.y1;

            return res;
        }

        function axisToCanvasCoords(pos) {
            // get canvas coords from the first pair of x/y found in pos
            var res = {}, i, axis, key;

            for (i = 0; i < xaxes.length; ++i) {
                axis = xaxes[i];
                if (axis && axis.used) {
                    key = "x" + axis.n;
                    if (pos[key] == null && axis.n == 1)
                        key = "x";

                    if (pos[key] != null) {
                        res.left = axis.p2c(pos[key]);
                        break;
                    }
                }
            }

            for (i = 0; i < yaxes.length; ++i) {
                axis = yaxes[i];
                if (axis && axis.used) {
                    key = "y" + axis.n;
                    if (pos[key] == null && axis.n == 1)
                        key = "y";

                    if (pos[key] != null) {
                        res.top = axis.p2c(pos[key]);
                        break;
                    }
                }
            }

            return res;
        }

        function getOrCreateAxis(axes, number) {
            if (!axes[number - 1])
                axes[number - 1] = {
                    n: number, // save the number for future reference
                    direction: axes == xaxes ? "x" : "y",
                    options: $.extend(true, {}, axes == xaxes ? options.xaxis : options.yaxis)
                };

            return axes[number - 1];
        }

        function fillInSeriesOptions() {

            var neededColors = series.length, maxIndex = -1, i;

            // Subtract the number of series that already have fixed colors or
            // color indexes from the number that we still need to generate.

            for (i = 0; i < series.length; ++i) {
                var sc = series[i].color;
                if (sc != null) {
                    neededColors--;
                    if (typeof sc == "number" && sc > maxIndex) {
                        maxIndex = sc;
                    }
                }
            }

            // If any of the series have fixed color indexes, then we need to
            // generate at least as many colors as the highest index.

            if (neededColors <= maxIndex) {
                neededColors = maxIndex + 1;
            }

            // Generate all the colors, using first the option colors and then
            // variations on those colors once they're exhausted.

            var c, colors = [], colorPool = options.colors,
                colorPoolSize = colorPool.length, variation = 0;

            for (i = 0; i < neededColors; i++) {

                c = $.color.parse(colorPool[i % colorPoolSize] || "#666");

                // Each time we exhaust the colors in the pool we adjust
                // a scaling factor used to produce more variations on
                // those colors. The factor alternates negative/positive
                // to produce lighter/darker colors.

                // Reset the variation after every few cycles, or else
                // it will end up producing only white or black colors.

                if (i % colorPoolSize == 0 && i) {
                    if (variation >= 0) {
                        if (variation < 0.5) {
                            variation = -variation - 0.2;
                        } else variation = 0;
                    } else variation = -variation;
                }

                colors[i] = c.scale('rgb', 1 + variation);
            }

            // Finalize the series options, filling in their colors

            var colori = 0, s;
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                // assign colors
                if (s.color == null) {
                    s.color = colors[colori].toString();
                    ++colori;
                }
                else if (typeof s.color == "number")
                    s.color = colors[s.color].toString();

                // turn on lines automatically in case nothing is set
                if (s.lines.show == null) {
                    var v, show = true;
                    for (v in s)
                        if (s[v] && s[v].show) {
                            show = false;
                            break;
                        }
                    if (show)
                        s.lines.show = true;
                }

                // If nothing was provided for lines.zero, default it to match
                // lines.fill, since areas by default should extend to zero.

                if (s.lines.zero == null) {
                    s.lines.zero = !!s.lines.fill;
                }

                // setup axes
                s.xaxis = getOrCreateAxis(xaxes, axisNumber(s, "x"));
                s.yaxis = getOrCreateAxis(yaxes, axisNumber(s, "y"));
            }
        }

        function processData() {
            var topSentry = Number.POSITIVE_INFINITY,
                bottomSentry = Number.NEGATIVE_INFINITY,
                fakeInfinity = Number.MAX_VALUE,
                i, j, k, m, length,
                s, points, ps, x, y, axis, val, f, p,
                data, format;

            function updateAxis(axis, min, max) {
                if (min < axis.datamin && min != -fakeInfinity)
                    axis.datamin = min;
                if (max > axis.datamax && max != fakeInfinity)
                    axis.datamax = max;
            }

            $.each(allAxes(), function (_, axis) {
                // init axis
                axis.datamin = topSentry;
                axis.datamax = bottomSentry;
                axis.used = false;
            });

            for (i = 0; i < series.length; ++i) {
                s = series[i];
                s.datapoints = { points: [] };

                executeHooks(hooks.processRawData, [ s, s.data, s.datapoints ]);
            }

            // first pass: clean and copy data
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                data = s.data;
                format = s.datapoints.format;

                if (!format) {
                    format = [];
                    // find out how to copy
                    format.push({ x: true, number: true, required: true });
                    format.push({ y: true, number: true, required: true });

                    if (s.bars.show || (s.lines.show && s.lines.fill)) {
                        var autoscale = !!((s.bars.show && s.bars.zero) || (s.lines.show && s.lines.zero));
                        format.push({ y: true, number: true, required: false, defaultValue: 0, autoscale: autoscale });
                        if (s.bars.horizontal) {
                            delete format[format.length - 1].y;
                            format[format.length - 1].x = true;
                        }
                    }

                    s.datapoints.format = format;
                }

                if (s.datapoints.pointsize != null)
                    continue; // already filled in

                s.datapoints.pointsize = format.length;

                ps = s.datapoints.pointsize;
                points = s.datapoints.points;

                var insertSteps = s.lines.show && s.lines.steps;
                s.xaxis.used = s.yaxis.used = true;

                for (j = k = 0; j < data.length; ++j, k += ps) {
                    p = data[j];

                    var nullify = p == null;
                    if (!nullify) {
                        for (m = 0; m < ps; ++m) {
                            val = p[m];
                            f = format[m];

                            if (f) {
                                if (f.number && val != null) {
                                    val = +val; // convert to number
                                    if (isNaN(val))
                                        val = null;
                                    else if (val == Infinity)
                                        val = fakeInfinity;
                                    else if (val == -Infinity)
                                        val = -fakeInfinity;
                                }

                                if (val == null) {
                                    if (f.required)
                                        nullify = true;

                                    if (f.defaultValue != null)
                                        val = f.defaultValue;
                                }
                            }

                            points[k + m] = val;
                        }
                    }

                    if (nullify) {
                        for (m = 0; m < ps; ++m) {
                            val = points[k + m];
                            if (val != null) {
                                f = format[m];
                                // extract min/max info
                                if (f.autoscale !== false) {
                                    if (f.x) {
                                        updateAxis(s.xaxis, val, val);
                                    }
                                    if (f.y) {
                                        updateAxis(s.yaxis, val, val);
                                    }
                                }
                            }
                            points[k + m] = null;
                        }
                    }
                    else {
                        // a little bit of line specific stuff that
                        // perhaps shouldn't be here, but lacking
                        // better means...
                        if (insertSteps && k > 0
                            && points[k - ps] != null
                            && points[k - ps] != points[k]
                            && points[k - ps + 1] != points[k + 1]) {
                            // copy the point to make room for a middle point
                            for (m = 0; m < ps; ++m)
                                points[k + ps + m] = points[k + m];

                            // middle point has same y
                            points[k + 1] = points[k - ps + 1];

                            // we've added a point, better reflect that
                            k += ps;
                        }
                    }
                }
            }

            // give the hooks a chance to run
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                executeHooks(hooks.processDatapoints, [ s, s.datapoints]);
            }

            // second pass: find datamax/datamin for auto-scaling
            for (i = 0; i < series.length; ++i) {
                s = series[i];
                points = s.datapoints.points;
                ps = s.datapoints.pointsize;
                format = s.datapoints.format;

                var xmin = topSentry, ymin = topSentry,
                    xmax = bottomSentry, ymax = bottomSentry;

                for (j = 0; j < points.length; j += ps) {
                    if (points[j] == null)
                        continue;

                    for (m = 0; m < ps; ++m) {
                        val = points[j + m];
                        f = format[m];
                        if (!f || f.autoscale === false || val == fakeInfinity || val == -fakeInfinity)
                            continue;

                        if (f.x) {
                            if (val < xmin)
                                xmin = val;
                            if (val > xmax)
                                xmax = val;
                        }
                        if (f.y) {
                            if (val < ymin)
                                ymin = val;
                            if (val > ymax)
                                ymax = val;
                        }
                    }
                }

                if (s.bars.show) {
                    // make sure we got room for the bar on the dancing floor
                    var delta;

                    switch (s.bars.align) {
                        case "left":
                            delta = 0;
                            break;
                        case "right":
                            delta = -s.bars.barWidth;
                            break;
                        default:
                            delta = -s.bars.barWidth / 2;
                    }

                    if (s.bars.horizontal) {
                        ymin += delta;
                        ymax += delta + s.bars.barWidth;
                    }
                    else {
                        xmin += delta;
                        xmax += delta + s.bars.barWidth;
                    }
                }

                updateAxis(s.xaxis, xmin, xmax);
                updateAxis(s.yaxis, ymin, ymax);
            }

            $.each(allAxes(), function (_, axis) {
                if (axis.datamin == topSentry)
                    axis.datamin = null;
                if (axis.datamax == bottomSentry)
                    axis.datamax = null;
            });
        }

        function setupCanvases() {

            // Make sure the placeholder is clear of everything except canvases
            // from a previous plot in this container that we'll try to re-use.

            placeholder.css("padding", 0) // padding messes up the positioning
                .children().filter(function(){
                    return !$(this).hasClass("flot-overlay") && !$(this).hasClass('flot-base');
                }).remove();

            if (placeholder.css("position") == 'static')
                placeholder.css("position", "relative"); // for positioning labels and overlay

            surface = new Canvas("flot-base", placeholder);
            overlay = new Canvas("flot-overlay", placeholder); // overlay canvas for interactive features

            ctx = surface.context;
            octx = overlay.context;

            // define which element we're listening for events on
            eventHolder = $(overlay.element).unbind();

            // If we're re-using a plot object, shut down the old one

            var existing = placeholder.data("plot");

            if (existing) {
                existing.shutdown();
                overlay.clear();
            }

            // save in case we get replotted
            placeholder.data("plot", plot);
        }

        function bindEvents() {
            // bind events
            if (options.grid.hoverable) {
                eventHolder.mousemove(onMouseMove);

                // Use bind, rather than .mouseleave, because we officially
                // still support jQuery 1.2.6, which doesn't define a shortcut
                // for mouseenter or mouseleave.  This was a bug/oversight that
                // was fixed somewhere around 1.3.x.  We can return to using
                // .mouseleave when we drop support for 1.2.6.

                eventHolder.bind("mouseleave", onMouseLeave);
            }

            if (options.grid.clickable)
                eventHolder.click(onClick);

            executeHooks(hooks.bindEvents, [eventHolder]);
        }

        function shutdown() {
            if (redrawTimeout)
                clearTimeout(redrawTimeout);

            eventHolder.unbind("mousemove", onMouseMove);
            eventHolder.unbind("mouseleave", onMouseLeave);
            eventHolder.unbind("click", onClick);

            executeHooks(hooks.shutdown, [eventHolder]);
        }

        function setTransformationHelpers(axis) {
            // set helper functions on the axis, assumes plot area
            // has been computed already

            function identity(x) { return x; }

            var s, m, t = axis.options.transform || identity,
                it = axis.options.inverseTransform;

            // precompute how much the axis is scaling a point
            // in canvas space
            if (axis.direction == "x") {
                s = axis.scale = plotWidth / Math.abs(t(axis.max) - t(axis.min));
                m = Math.min(t(axis.max), t(axis.min));
            }
            else {
                s = axis.scale = plotHeight / Math.abs(t(axis.max) - t(axis.min));
                s = -s;
                m = Math.max(t(axis.max), t(axis.min));
            }

            // data point to canvas coordinate
            if (t == identity) // slight optimization
                axis.p2c = function (p) { return (p - m) * s; };
            else
                axis.p2c = function (p) { return (t(p) - m) * s; };
            // canvas coordinate to data point
            if (!it)
                axis.c2p = function (c) { return m + c / s; };
            else
                axis.c2p = function (c) { return it(m + c / s); };
        }

        function measureTickLabels(axis) {

            var opts = axis.options,
                ticks = axis.ticks || [],
                labelWidth = opts.labelWidth || 0,
                labelHeight = opts.labelHeight || 0,
                maxWidth = labelWidth || (axis.direction == "x" ? Math.floor(surface.width / (ticks.length || 1)) : null),
                legacyStyles = axis.direction + "Axis " + axis.direction + axis.n + "Axis",
                layer = "flot-" + axis.direction + "-axis flot-" + axis.direction + axis.n + "-axis " + legacyStyles,
                font = opts.font || "flot-tick-label tickLabel";

            for (var i = 0; i < ticks.length; ++i) {

                var t = ticks[i];

                if (!t.label)
                    continue;

                var info = surface.getTextInfo(layer, t.label, font, null, maxWidth);

                labelWidth = Math.max(labelWidth, info.width);
                labelHeight = Math.max(labelHeight, info.height);
            }

            axis.labelWidth = opts.labelWidth || labelWidth;
            axis.labelHeight = opts.labelHeight || labelHeight;
        }

        function allocateAxisBoxFirstPhase(axis) {
            // find the bounding box of the axis by looking at label
            // widths/heights and ticks, make room by diminishing the
            // plotOffset; this first phase only looks at one
            // dimension per axis, the other dimension depends on the
            // other axes so will have to wait

            var lw = axis.labelWidth,
                lh = axis.labelHeight,
                pos = axis.options.position,
                isXAxis = axis.direction === "x",
                tickLength = axis.options.tickLength,
                axisMargin = options.grid.axisMargin,
                padding = options.grid.labelMargin,
                innermost = true,
                outermost = true,
                first = true,
                found = false;

            // Determine the axis's position in its direction and on its side

            $.each(isXAxis ? xaxes : yaxes, function(i, a) {
                if (a && a.reserveSpace) {
                    if (a === axis) {
                        found = true;
                    } else if (a.options.position === pos) {
                        if (found) {
                            outermost = false;
                        } else {
                            innermost = false;
                        }
                    }
                    if (!found) {
                        first = false;
                    }
                }
            });

            // The outermost axis on each side has no margin

            if (outermost) {
                axisMargin = 0;
            }

            // The ticks for the first axis in each direction stretch across

            if (tickLength == null) {
                tickLength = first ? "full" : 5;
            }

            if (!isNaN(+tickLength))
                padding += +tickLength;

            if (isXAxis) {
                lh += padding;

                if (pos == "bottom") {
                    plotOffset.bottom += lh + axisMargin;
                    axis.box = { top: surface.height - plotOffset.bottom, height: lh };
                }
                else {
                    axis.box = { top: plotOffset.top + axisMargin, height: lh };
                    plotOffset.top += lh + axisMargin;
                }
            }
            else {
                lw += padding;

                if (pos == "left") {
                    axis.box = { left: plotOffset.left + axisMargin, width: lw };
                    plotOffset.left += lw + axisMargin;
                }
                else {
                    plotOffset.right += lw + axisMargin;
                    axis.box = { left: surface.width - plotOffset.right, width: lw };
                }
            }

             // save for future reference
            axis.position = pos;
            axis.tickLength = tickLength;
            axis.box.padding = padding;
            axis.innermost = innermost;
        }

        function allocateAxisBoxSecondPhase(axis) {
            // now that all axis boxes have been placed in one
            // dimension, we can set the remaining dimension coordinates
            if (axis.direction == "x") {
                axis.box.left = plotOffset.left - axis.labelWidth / 2;
                axis.box.width = surface.width - plotOffset.left - plotOffset.right + axis.labelWidth;
            }
            else {
                axis.box.top = plotOffset.top - axis.labelHeight / 2;
                axis.box.height = surface.height - plotOffset.bottom - plotOffset.top + axis.labelHeight;
            }
        }

        function adjustLayoutForThingsStickingOut() {
            // possibly adjust plot offset to ensure everything stays
            // inside the canvas and isn't clipped off

            var minMargin = options.grid.minBorderMargin,
                axis, i;

            // check stuff from the plot (FIXME: this should just read
            // a value from the series, otherwise it's impossible to
            // customize)
            if (minMargin == null) {
                minMargin = 0;
                for (i = 0; i < series.length; ++i)
                    minMargin = Math.max(minMargin, 2 * (series[i].points.radius + series[i].points.lineWidth/2));
            }

            var margins = {
                left: minMargin,
                right: minMargin,
                top: minMargin,
                bottom: minMargin
            };

            // check axis labels, note we don't check the actual
            // labels but instead use the overall width/height to not
            // jump as much around with replots
            $.each(allAxes(), function (_, axis) {
                if (axis.reserveSpace && axis.ticks && axis.ticks.length) {
                    var lastTick = axis.ticks[axis.ticks.length - 1];
                    if (axis.direction === "x") {
                        margins.left = Math.max(margins.left, axis.labelWidth / 2);
                        if (lastTick.v <= axis.max) {
                            margins.right = Math.max(margins.right, axis.labelWidth / 2);
                        }
                    } else {
                        margins.bottom = Math.max(margins.bottom, axis.labelHeight / 2);
                        if (lastTick.v <= axis.max) {
                            margins.top = Math.max(margins.top, axis.labelHeight / 2);
                        }
                    }
                }
            });

            plotOffset.left = Math.ceil(Math.max(margins.left, plotOffset.left));
            plotOffset.right = Math.ceil(Math.max(margins.right, plotOffset.right));
            plotOffset.top = Math.ceil(Math.max(margins.top, plotOffset.top));
            plotOffset.bottom = Math.ceil(Math.max(margins.bottom, plotOffset.bottom));
        }

        function setupGrid() {
            var i, axes = allAxes(), showGrid = options.grid.show;

            // Initialize the plot's offset from the edge of the canvas

            for (var a in plotOffset) {
                var margin = options.grid.margin || 0;
                plotOffset[a] = typeof margin == "number" ? margin : margin[a] || 0;
            }

            executeHooks(hooks.processOffset, [plotOffset]);

            // If the grid is visible, add its border width to the offset

            for (var a in plotOffset) {
                if(typeof(options.grid.borderWidth) == "object") {
                    plotOffset[a] += showGrid ? options.grid.borderWidth[a] : 0;
                }
                else {
                    plotOffset[a] += showGrid ? options.grid.borderWidth : 0;
                }
            }

            // init axes
            $.each(axes, function (_, axis) {
                axis.show = axis.options.show;
                if (axis.show == null)
                    axis.show = axis.used; // by default an axis is visible if it's got data

                axis.reserveSpace = axis.show || axis.options.reserveSpace;

                setRange(axis);
            });

            if (showGrid) {

                var allocatedAxes = $.grep(axes, function (axis) { return axis.reserveSpace; });

                $.each(allocatedAxes, function (_, axis) {
                    // make the ticks
                    setupTickGeneration(axis);
                    setTicks(axis);
                    snapRangeToTicks(axis, axis.ticks);
                    // find labelWidth/Height for axis
                    measureTickLabels(axis);
                });

                // with all dimensions calculated, we can compute the
                // axis bounding boxes, start from the outside
                // (reverse order)
                for (i = allocatedAxes.length - 1; i >= 0; --i)
                    allocateAxisBoxFirstPhase(allocatedAxes[i]);

                // make sure we've got enough space for things that
                // might stick out
                adjustLayoutForThingsStickingOut();

                $.each(allocatedAxes, function (_, axis) {
                    allocateAxisBoxSecondPhase(axis);
                });
            }

            plotWidth = surface.width - plotOffset.left - plotOffset.right;
            plotHeight = surface.height - plotOffset.bottom - plotOffset.top;

            // now we got the proper plot dimensions, we can compute the scaling
            $.each(axes, function (_, axis) {
                setTransformationHelpers(axis);
            });

            if (showGrid) {
                drawAxisLabels();
            }

            insertLegend();
        }

        function setRange(axis) {
            var opts = axis.options,
                min = +(opts.min != null ? opts.min : axis.datamin),
                max = +(opts.max != null ? opts.max : axis.datamax),
                delta = max - min;

            if (delta == 0.0) {
                // degenerate case
                var widen = max == 0 ? 1 : 0.01;

                if (opts.min == null)
                    min -= widen;
                // always widen max if we couldn't widen min to ensure we
                // don't fall into min == max which doesn't work
                if (opts.max == null || opts.min != null)
                    max += widen;
            }
            else {
                // consider autoscaling
                var margin = opts.autoscaleMargin;
                if (margin != null) {
                    if (opts.min == null) {
                        min -= delta * margin;
                        // make sure we don't go below zero if all values
                        // are positive
                        if (min < 0 && axis.datamin != null && axis.datamin >= 0)
                            min = 0;
                    }
                    if (opts.max == null) {
                        max += delta * margin;
                        if (max > 0 && axis.datamax != null && axis.datamax <= 0)
                            max = 0;
                    }
                }
            }
            axis.min = min;
            axis.max = max;
        }

        function setupTickGeneration(axis) {
            var opts = axis.options;

            // estimate number of ticks
            var noTicks;
            if (typeof opts.ticks == "number" && opts.ticks > 0)
                noTicks = opts.ticks;
            else
                // heuristic based on the model a*sqrt(x) fitted to
                // some data points that seemed reasonable
                noTicks = 0.3 * Math.sqrt(axis.direction == "x" ? surface.width : surface.height);

            var delta = (axis.max - axis.min) / noTicks,
                dec = -Math.floor(Math.log(delta) / Math.LN10),
                maxDec = opts.tickDecimals;

            if (maxDec != null && dec > maxDec) {
                dec = maxDec;
            }

            var magn = Math.pow(10, -dec),
                norm = delta / magn, // norm is between 1.0 and 10.0
                size;

            if (norm < 1.5) {
                size = 1;
            } else if (norm < 3) {
                size = 2;
                // special case for 2.5, requires an extra decimal
                if (norm > 2.25 && (maxDec == null || dec + 1 <= maxDec)) {
                    size = 2.5;
                    ++dec;
                }
            } else if (norm < 7.5) {
                size = 5;
            } else {
                size = 10;
            }

            size *= magn;

            if (opts.minTickSize != null && size < opts.minTickSize) {
                size = opts.minTickSize;
            }

            axis.delta = delta;
            axis.tickDecimals = Math.max(0, maxDec != null ? maxDec : dec);
            axis.tickSize = opts.tickSize || size;

            // Time mode was moved to a plug-in in 0.8, but since so many people use this
            // we'll add an especially friendly make sure they remembered to include it.

            if (opts.mode == "time" && !axis.tickGenerator) {
                throw new Error("Time mode requires the flot.time plugin.");
            }

            // Flot supports base-10 axes; any other mode else is handled by a plug-in,
            // like flot.time.js.

            if (!axis.tickGenerator) {

                axis.tickGenerator = function (axis) {

                    var ticks = [],
                        start = floorInBase(axis.min, axis.tickSize),
                        i = 0,
                        v = Number.NaN,
                        prev;

                    do {
                        prev = v;
                        v = start + i * axis.tickSize;
                        ticks.push(v);
                        ++i;
                    } while (v < axis.max && v != prev);
                    return ticks;
                };

				axis.tickFormatter = function (value, axis) {

					var factor = axis.tickDecimals ? Math.pow(10, axis.tickDecimals) : 1;
					var formatted = "" + Math.round(value * factor) / factor;

					// If tickDecimals was specified, ensure that we have exactly that
					// much precision; otherwise default to the value's own precision.

					if (axis.tickDecimals != null) {
						var decimal = formatted.indexOf(".");
						var precision = decimal == -1 ? 0 : formatted.length - decimal - 1;
						if (precision < axis.tickDecimals) {
							return (precision ? formatted : formatted + ".") + ("" + factor).substr(1, axis.tickDecimals - precision);
						}
					}

                    return formatted;
                };
            }

            if ($.isFunction(opts.tickFormatter))
                axis.tickFormatter = function (v, axis) { return "" + opts.tickFormatter(v, axis); };

            if (opts.alignTicksWithAxis != null) {
                var otherAxis = (axis.direction == "x" ? xaxes : yaxes)[opts.alignTicksWithAxis - 1];
                if (otherAxis && otherAxis.used && otherAxis != axis) {
                    // consider snapping min/max to outermost nice ticks
                    var niceTicks = axis.tickGenerator(axis);
                    if (niceTicks.length > 0) {
                        if (opts.min == null)
                            axis.min = Math.min(axis.min, niceTicks[0]);
                        if (opts.max == null && niceTicks.length > 1)
                            axis.max = Math.max(axis.max, niceTicks[niceTicks.length - 1]);
                    }

                    axis.tickGenerator = function (axis) {
                        // copy ticks, scaled to this axis
                        var ticks = [], v, i;
                        for (i = 0; i < otherAxis.ticks.length; ++i) {
                            v = (otherAxis.ticks[i].v - otherAxis.min) / (otherAxis.max - otherAxis.min);
                            v = axis.min + v * (axis.max - axis.min);
                            ticks.push(v);
                        }
                        return ticks;
                    };

                    // we might need an extra decimal since forced
                    // ticks don't necessarily fit naturally
                    if (!axis.mode && opts.tickDecimals == null) {
                        var extraDec = Math.max(0, -Math.floor(Math.log(axis.delta) / Math.LN10) + 1),
                            ts = axis.tickGenerator(axis);

                        // only proceed if the tick interval rounded
                        // with an extra decimal doesn't give us a
                        // zero at end
                        if (!(ts.length > 1 && /\..*0$/.test((ts[1] - ts[0]).toFixed(extraDec))))
                            axis.tickDecimals = extraDec;
                    }
                }
            }
        }

        function setTicks(axis) {
            var oticks = axis.options.ticks, ticks = [];
            if (oticks == null || (typeof oticks == "number" && oticks > 0))
                ticks = axis.tickGenerator(axis);
            else if (oticks) {
                if ($.isFunction(oticks))
                    // generate the ticks
                    ticks = oticks(axis);
                else
                    ticks = oticks;
            }

            // clean up/labelify the supplied ticks, copy them over
            var i, v;
            axis.ticks = [];
            for (i = 0; i < ticks.length; ++i) {
                var label = null;
                var t = ticks[i];
                if (typeof t == "object") {
                    v = +t[0];
                    if (t.length > 1)
                        label = t[1];
                }
                else
                    v = +t;
                if (label == null)
                    label = axis.tickFormatter(v, axis);
                if (!isNaN(v))
                    axis.ticks.push({ v: v, label: label });
            }
        }

        function snapRangeToTicks(axis, ticks) {
            if (axis.options.autoscaleMargin && ticks.length > 0) {
                // snap to ticks
                if (axis.options.min == null)
                    axis.min = Math.min(axis.min, ticks[0].v);
                if (axis.options.max == null && ticks.length > 1)
                    axis.max = Math.max(axis.max, ticks[ticks.length - 1].v);
            }
        }

        function draw() {

            surface.clear();

            executeHooks(hooks.drawBackground, [ctx]);

            var grid = options.grid;

            // draw background, if any
            if (grid.show && grid.backgroundColor)
                drawBackground();

            if (grid.show && !grid.aboveData) {
                drawGrid();
            }

            for (var i = 0; i < series.length; ++i) {
                executeHooks(hooks.drawSeries, [ctx, series[i]]);
                drawSeries(series[i]);
            }

            executeHooks(hooks.draw, [ctx]);

            if (grid.show && grid.aboveData) {
                drawGrid();
            }

            surface.render();

            // A draw implies that either the axes or data have changed, so we
            // should probably update the overlay highlights as well.

            triggerRedrawOverlay();
        }

        function extractRange(ranges, coord) {
            var axis, from, to, key, axes = allAxes();

            for (var i = 0; i < axes.length; ++i) {
                axis = axes[i];
                if (axis.direction == coord) {
                    key = coord + axis.n + "axis";
                    if (!ranges[key] && axis.n == 1)
                        key = coord + "axis"; // support x1axis as xaxis
                    if (ranges[key]) {
                        from = ranges[key].from;
                        to = ranges[key].to;
                        break;
                    }
                }
            }

            // backwards-compat stuff - to be removed in future
            if (!ranges[key]) {
                axis = coord == "x" ? xaxes[0] : yaxes[0];
                from = ranges[coord + "1"];
                to = ranges[coord + "2"];
            }

            // auto-reverse as an added bonus
            if (from != null && to != null && from > to) {
                var tmp = from;
                from = to;
                to = tmp;
            }

            return { from: from, to: to, axis: axis };
        }

        function drawBackground() {
            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            ctx.fillStyle = getColorOrGradient(options.grid.backgroundColor, plotHeight, 0, "rgba(255, 255, 255, 0)");
            ctx.fillRect(0, 0, plotWidth, plotHeight);
            ctx.restore();
        }

        function drawGrid() {
            var i, axes, bw, bc;

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            // draw markings
            var markings = options.grid.markings;
            if (markings) {
                if ($.isFunction(markings)) {
                    axes = plot.getAxes();
                    // xmin etc. is backwards compatibility, to be
                    // removed in the future
                    axes.xmin = axes.xaxis.min;
                    axes.xmax = axes.xaxis.max;
                    axes.ymin = axes.yaxis.min;
                    axes.ymax = axes.yaxis.max;

                    markings = markings(axes);
                }

                for (i = 0; i < markings.length; ++i) {
                    var m = markings[i],
                        xrange = extractRange(m, "x"),
                        yrange = extractRange(m, "y");

                    // fill in missing
                    if (xrange.from == null)
                        xrange.from = xrange.axis.min;
                    if (xrange.to == null)
                        xrange.to = xrange.axis.max;
                    if (yrange.from == null)
                        yrange.from = yrange.axis.min;
                    if (yrange.to == null)
                        yrange.to = yrange.axis.max;

                    // clip
                    if (xrange.to < xrange.axis.min || xrange.from > xrange.axis.max ||
                        yrange.to < yrange.axis.min || yrange.from > yrange.axis.max)
                        continue;

                    xrange.from = Math.max(xrange.from, xrange.axis.min);
                    xrange.to = Math.min(xrange.to, xrange.axis.max);
                    yrange.from = Math.max(yrange.from, yrange.axis.min);
                    yrange.to = Math.min(yrange.to, yrange.axis.max);

                    if (xrange.from == xrange.to && yrange.from == yrange.to)
                        continue;

                    // then draw
                    xrange.from = xrange.axis.p2c(xrange.from);
                    xrange.to = xrange.axis.p2c(xrange.to);
                    yrange.from = yrange.axis.p2c(yrange.from);
                    yrange.to = yrange.axis.p2c(yrange.to);

                    if (xrange.from == xrange.to || yrange.from == yrange.to) {
                        // draw line
                        ctx.beginPath();
                        ctx.strokeStyle = m.color || options.grid.markingsColor;
                        ctx.lineWidth = m.lineWidth || options.grid.markingsLineWidth;
                        ctx.moveTo(xrange.from, yrange.from);
                        ctx.lineTo(xrange.to, yrange.to);
                        ctx.stroke();
                    }
                    else {
                        // fill area
                        ctx.fillStyle = m.color || options.grid.markingsColor;
                        ctx.fillRect(xrange.from, yrange.to,
                                     xrange.to - xrange.from,
                                     yrange.from - yrange.to);
                    }
                }
            }

            // draw the ticks
            axes = allAxes();
            bw = options.grid.borderWidth;

            for (var j = 0; j < axes.length; ++j) {
                var axis = axes[j], box = axis.box,
                    t = axis.tickLength, x, y, xoff, yoff;
                if (!axis.show || axis.ticks.length == 0)
                    continue;

                ctx.lineWidth = 1;

                // find the edges
                if (axis.direction == "x") {
                    x = 0;
                    if (t == "full")
                        y = (axis.position == "top" ? 0 : plotHeight);
                    else
                        y = box.top - plotOffset.top + (axis.position == "top" ? box.height : 0);
                }
                else {
                    y = 0;
                    if (t == "full")
                        x = (axis.position == "left" ? 0 : plotWidth);
                    else
                        x = box.left - plotOffset.left + (axis.position == "left" ? box.width : 0);
                }

                // draw tick bar
                if (!axis.innermost) {
                    ctx.strokeStyle = axis.options.color;
                    ctx.beginPath();
                    xoff = yoff = 0;
                    if (axis.direction == "x")
                        xoff = plotWidth + 1;
                    else
                        yoff = plotHeight + 1;

                    if (ctx.lineWidth == 1) {
                        if (axis.direction == "x") {
                            y = Math.floor(y) + 0.5;
                        } else {
                            x = Math.floor(x) + 0.5;
                        }
                    }

                    ctx.moveTo(x, y);
                    ctx.lineTo(x + xoff, y + yoff);
                    ctx.stroke();
                }

                // draw ticks

                ctx.strokeStyle = axis.options.tickColor;

                ctx.beginPath();
                for (i = 0; i < axis.ticks.length; ++i) {
                    var v = axis.ticks[i].v;

                    xoff = yoff = 0;

                    if (isNaN(v) || v < axis.min || v > axis.max
                        // skip those lying on the axes if we got a border
                        || (t == "full"
                            && ((typeof bw == "object" && bw[axis.position] > 0) || bw > 0)
                            && (v == axis.min || v == axis.max)))
                        continue;

                    if (axis.direction == "x") {
                        x = axis.p2c(v);
                        yoff = t == "full" ? -plotHeight : t;

                        if (axis.position == "top")
                            yoff = -yoff;
                    }
                    else {
                        y = axis.p2c(v);
                        xoff = t == "full" ? -plotWidth : t;

                        if (axis.position == "left")
                            xoff = -xoff;
                    }

                    if (ctx.lineWidth == 1) {
                        if (axis.direction == "x")
                            x = Math.floor(x) + 0.5;
                        else
                            y = Math.floor(y) + 0.5;
                    }

                    ctx.moveTo(x, y);
                    ctx.lineTo(x + xoff, y + yoff);
                }

                ctx.stroke();
            }


            // draw border
            if (bw) {
                // If either borderWidth or borderColor is an object, then draw the border
                // line by line instead of as one rectangle
                bc = options.grid.borderColor;
                if(typeof bw == "object" || typeof bc == "object") {
                    if (typeof bw !== "object") {
                        bw = {top: bw, right: bw, bottom: bw, left: bw};
                    }
                    if (typeof bc !== "object") {
                        bc = {top: bc, right: bc, bottom: bc, left: bc};
                    }

                    if (bw.top > 0) {
                        ctx.strokeStyle = bc.top;
                        ctx.lineWidth = bw.top;
                        ctx.beginPath();
                        ctx.moveTo(0 - bw.left, 0 - bw.top/2);
                        ctx.lineTo(plotWidth, 0 - bw.top/2);
                        ctx.stroke();
                    }

                    if (bw.right > 0) {
                        ctx.strokeStyle = bc.right;
                        ctx.lineWidth = bw.right;
                        ctx.beginPath();
                        ctx.moveTo(plotWidth + bw.right / 2, 0 - bw.top);
                        ctx.lineTo(plotWidth + bw.right / 2, plotHeight);
                        ctx.stroke();
                    }

                    if (bw.bottom > 0) {
                        ctx.strokeStyle = bc.bottom;
                        ctx.lineWidth = bw.bottom;
                        ctx.beginPath();
                        ctx.moveTo(plotWidth + bw.right, plotHeight + bw.bottom / 2);
                        ctx.lineTo(0, plotHeight + bw.bottom / 2);
                        ctx.stroke();
                    }

                    if (bw.left > 0) {
                        ctx.strokeStyle = bc.left;
                        ctx.lineWidth = bw.left;
                        ctx.beginPath();
                        ctx.moveTo(0 - bw.left/2, plotHeight + bw.bottom);
                        ctx.lineTo(0- bw.left/2, 0);
                        ctx.stroke();
                    }
                }
                else {
                    ctx.lineWidth = bw;
                    ctx.strokeStyle = options.grid.borderColor;
                    ctx.strokeRect(-bw/2, -bw/2, plotWidth + bw, plotHeight + bw);
                }
            }

            ctx.restore();
        }

        function drawAxisLabels() {

            $.each(allAxes(), function (_, axis) {
                var box = axis.box,
                    legacyStyles = axis.direction + "Axis " + axis.direction + axis.n + "Axis",
                    layer = "flot-" + axis.direction + "-axis flot-" + axis.direction + axis.n + "-axis " + legacyStyles,
                    font = axis.options.font || "flot-tick-label tickLabel",
                    tick, x, y, halign, valign;

                // Remove text before checking for axis.show and ticks.length;
                // otherwise plugins, like flot-tickrotor, that draw their own
                // tick labels will end up with both theirs and the defaults.

                surface.removeText(layer);

                if (!axis.show || axis.ticks.length == 0)
                    return;

                for (var i = 0; i < axis.ticks.length; ++i) {

                    tick = axis.ticks[i];
                    if (!tick.label || tick.v < axis.min || tick.v > axis.max)
                        continue;

                    if (axis.direction == "x") {
                        halign = "center";
                        x = plotOffset.left + axis.p2c(tick.v);
                        if (axis.position == "bottom") {
                            y = box.top + box.padding;
                        } else {
                            y = box.top + box.height - box.padding;
                            valign = "bottom";
                        }
                    } else {
                        valign = "middle";
                        y = plotOffset.top + axis.p2c(tick.v);
                        if (axis.position == "left") {
                            x = box.left + box.width - box.padding;
                            halign = "right";
                        } else {
                            x = box.left + box.padding;
                        }
                    }

                    surface.addText(layer, x, y, tick.label, font, null, null, halign, valign);
                }
            });
        }

        function drawSeries(series) {
            if (series.lines.show)
                drawSeriesLines(series);
            if (series.bars.show)
                drawSeriesBars(series);
            if (series.points.show)
                drawSeriesPoints(series);
        }

        function drawSeriesLines(series) {
            function plotLine(datapoints, xoffset, yoffset, axisx, axisy) {
                var points = datapoints.points,
                    ps = datapoints.pointsize,
                    prevx = null, prevy = null;

                ctx.beginPath();
                for (var i = ps; i < points.length; i += ps) {
                    var x1 = points[i - ps], y1 = points[i - ps + 1],
                        x2 = points[i], y2 = points[i + 1];

                    if (x1 == null || x2 == null)
                        continue;

                    // clip with ymin
                    if (y1 <= y2 && y1 < axisy.min) {
                        if (y2 < axisy.min)
                            continue;   // line segment is outside
                        // compute new intersection point
                        x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.min;
                    }
                    else if (y2 <= y1 && y2 < axisy.min) {
                        if (y1 < axisy.min)
                            continue;
                        x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.min;
                    }

                    // clip with ymax
                    if (y1 >= y2 && y1 > axisy.max) {
                        if (y2 > axisy.max)
                            continue;
                        x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.max;
                    }
                    else if (y2 >= y1 && y2 > axisy.max) {
                        if (y1 > axisy.max)
                            continue;
                        x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.max;
                    }

                    // clip with xmin
                    if (x1 <= x2 && x1 < axisx.min) {
                        if (x2 < axisx.min)
                            continue;
                        y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.min;
                    }
                    else if (x2 <= x1 && x2 < axisx.min) {
                        if (x1 < axisx.min)
                            continue;
                        y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.min;
                    }

                    // clip with xmax
                    if (x1 >= x2 && x1 > axisx.max) {
                        if (x2 > axisx.max)
                            continue;
                        y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.max;
                    }
                    else if (x2 >= x1 && x2 > axisx.max) {
                        if (x1 > axisx.max)
                            continue;
                        y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.max;
                    }

                    if (x1 != prevx || y1 != prevy)
                        ctx.moveTo(axisx.p2c(x1) + xoffset, axisy.p2c(y1) + yoffset);

                    prevx = x2;
                    prevy = y2;
                    ctx.lineTo(axisx.p2c(x2) + xoffset, axisy.p2c(y2) + yoffset);
                }
                ctx.stroke();
            }

            function plotLineArea(datapoints, axisx, axisy) {
                var points = datapoints.points,
                    ps = datapoints.pointsize,
                    bottom = Math.min(Math.max(0, axisy.min), axisy.max),
                    i = 0, top, areaOpen = false,
                    ypos = 1, segmentStart = 0, segmentEnd = 0;

                // we process each segment in two turns, first forward
                // direction to sketch out top, then once we hit the
                // end we go backwards to sketch the bottom
                while (true) {
                    if (ps > 0 && i > points.length + ps)
                        break;

                    i += ps; // ps is negative if going backwards

                    var x1 = points[i - ps],
                        y1 = points[i - ps + ypos],
                        x2 = points[i], y2 = points[i + ypos];

                    if (areaOpen) {
                        if (ps > 0 && x1 != null && x2 == null) {
                            // at turning point
                            segmentEnd = i;
                            ps = -ps;
                            ypos = 2;
                            continue;
                        }

                        if (ps < 0 && i == segmentStart + ps) {
                            // done with the reverse sweep
                            ctx.fill();
                            areaOpen = false;
                            ps = -ps;
                            ypos = 1;
                            i = segmentStart = segmentEnd + ps;
                            continue;
                        }
                    }

                    if (x1 == null || x2 == null)
                        continue;

                    // clip x values

                    // clip with xmin
                    if (x1 <= x2 && x1 < axisx.min) {
                        if (x2 < axisx.min)
                            continue;
                        y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.min;
                    }
                    else if (x2 <= x1 && x2 < axisx.min) {
                        if (x1 < axisx.min)
                            continue;
                        y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.min;
                    }

                    // clip with xmax
                    if (x1 >= x2 && x1 > axisx.max) {
                        if (x2 > axisx.max)
                            continue;
                        y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x1 = axisx.max;
                    }
                    else if (x2 >= x1 && x2 > axisx.max) {
                        if (x1 > axisx.max)
                            continue;
                        y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                        x2 = axisx.max;
                    }

                    if (!areaOpen) {
                        // open area
                        ctx.beginPath();
                        ctx.moveTo(axisx.p2c(x1), axisy.p2c(bottom));
                        areaOpen = true;
                    }

                    // now first check the case where both is outside
                    if (y1 >= axisy.max && y2 >= axisy.max) {
                        ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.max));
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.max));
                        continue;
                    }
                    else if (y1 <= axisy.min && y2 <= axisy.min) {
                        ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.min));
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.min));
                        continue;
                    }

                    // else it's a bit more complicated, there might
                    // be a flat maxed out rectangle first, then a
                    // triangular cutout or reverse; to find these
                    // keep track of the current x values
                    var x1old = x1, x2old = x2;

                    // clip the y values, without shortcutting, we
                    // go through all cases in turn

                    // clip with ymin
                    if (y1 <= y2 && y1 < axisy.min && y2 >= axisy.min) {
                        x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.min;
                    }
                    else if (y2 <= y1 && y2 < axisy.min && y1 >= axisy.min) {
                        x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.min;
                    }

                    // clip with ymax
                    if (y1 >= y2 && y1 > axisy.max && y2 <= axisy.max) {
                        x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y1 = axisy.max;
                    }
                    else if (y2 >= y1 && y2 > axisy.max && y1 <= axisy.max) {
                        x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                        y2 = axisy.max;
                    }

                    // if the x value was changed we got a rectangle
                    // to fill
                    if (x1 != x1old) {
                        ctx.lineTo(axisx.p2c(x1old), axisy.p2c(y1));
                        // it goes to (x1, y1), but we fill that below
                    }

                    // fill triangular section, this sometimes result
                    // in redundant points if (x1, y1) hasn't changed
                    // from previous line to, but we just ignore that
                    ctx.lineTo(axisx.p2c(x1), axisy.p2c(y1));
                    ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));

                    // fill the other rectangle if it's there
                    if (x2 != x2old) {
                        ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));
                        ctx.lineTo(axisx.p2c(x2old), axisy.p2c(y2));
                    }
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);
            ctx.lineJoin = "round";

            var lw = series.lines.lineWidth,
                sw = series.shadowSize;
            // FIXME: consider another form of shadow when filling is turned on
            if (lw > 0 && sw > 0) {
                // draw shadow as a thick and thin line with transparency
                ctx.lineWidth = sw;
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                // position shadow at angle from the mid of line
                var angle = Math.PI/18;
                plotLine(series.datapoints, Math.sin(angle) * (lw/2 + sw/2), Math.cos(angle) * (lw/2 + sw/2), series.xaxis, series.yaxis);
                ctx.lineWidth = sw/2;
                plotLine(series.datapoints, Math.sin(angle) * (lw/2 + sw/4), Math.cos(angle) * (lw/2 + sw/4), series.xaxis, series.yaxis);
            }

            ctx.lineWidth = lw;
            ctx.strokeStyle = series.color;
            var fillStyle = getFillStyle(series.lines, series.color, 0, plotHeight);
            if (fillStyle) {
                ctx.fillStyle = fillStyle;
                plotLineArea(series.datapoints, series.xaxis, series.yaxis);
            }

            if (lw > 0)
                plotLine(series.datapoints, 0, 0, series.xaxis, series.yaxis);
            ctx.restore();
        }

        function drawSeriesPoints(series) {
            function plotPoints(datapoints, radius, fillStyle, offset, shadow, axisx, axisy, symbol) {
                var points = datapoints.points, ps = datapoints.pointsize;

                for (var i = 0; i < points.length; i += ps) {
                    var x = points[i], y = points[i + 1];
                    if (x == null || x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max)
                        continue;

                    ctx.beginPath();
                    x = axisx.p2c(x);
                    y = axisy.p2c(y) + offset;
                    if (symbol == "circle")
                        ctx.arc(x, y, radius, 0, shadow ? Math.PI : Math.PI * 2, false);
                    else
                        symbol(ctx, x, y, radius, shadow);
                    ctx.closePath();

                    if (fillStyle) {
                        ctx.fillStyle = fillStyle;
                        ctx.fill();
                    }
                    ctx.stroke();
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            var lw = series.points.lineWidth,
                sw = series.shadowSize,
                radius = series.points.radius,
                symbol = series.points.symbol;

            // If the user sets the line width to 0, we change it to a very 
            // small value. A line width of 0 seems to force the default of 1.
            // Doing the conditional here allows the shadow setting to still be 
            // optional even with a lineWidth of 0.

            if( lw == 0 )
                lw = 0.0001;

            if (lw > 0 && sw > 0) {
                // draw shadow in two steps
                var w = sw / 2;
                ctx.lineWidth = w;
                ctx.strokeStyle = "rgba(0,0,0,0.1)";
                plotPoints(series.datapoints, radius, null, w + w/2, true,
                           series.xaxis, series.yaxis, symbol);

                ctx.strokeStyle = "rgba(0,0,0,0.2)";
                plotPoints(series.datapoints, radius, null, w/2, true,
                           series.xaxis, series.yaxis, symbol);
            }

            ctx.lineWidth = lw;
            ctx.strokeStyle = series.color;
            plotPoints(series.datapoints, radius,
                       getFillStyle(series.points, series.color), 0, false,
                       series.xaxis, series.yaxis, symbol);
            ctx.restore();
        }

        function drawBar(x, y, b, barLeft, barRight, fillStyleCallback, axisx, axisy, c, horizontal, lineWidth) {
            var left, right, bottom, top,
                drawLeft, drawRight, drawTop, drawBottom,
                tmp;

            // in horizontal mode, we start the bar from the left
            // instead of from the bottom so it appears to be
            // horizontal rather than vertical
            if (horizontal) {
                drawBottom = drawRight = drawTop = true;
                drawLeft = false;
                left = b;
                right = x;
                top = y + barLeft;
                bottom = y + barRight;

                // account for negative bars
                if (right < left) {
                    tmp = right;
                    right = left;
                    left = tmp;
                    drawLeft = true;
                    drawRight = false;
                }
            }
            else {
                drawLeft = drawRight = drawTop = true;
                drawBottom = false;
                left = x + barLeft;
                right = x + barRight;
                bottom = b;
                top = y;

                // account for negative bars
                if (top < bottom) {
                    tmp = top;
                    top = bottom;
                    bottom = tmp;
                    drawBottom = true;
                    drawTop = false;
                }
            }

            // clip
            if (right < axisx.min || left > axisx.max ||
                top < axisy.min || bottom > axisy.max)
                return;

            if (left < axisx.min) {
                left = axisx.min;
                drawLeft = false;
            }

            if (right > axisx.max) {
                right = axisx.max;
                drawRight = false;
            }

            if (bottom < axisy.min) {
                bottom = axisy.min;
                drawBottom = false;
            }

            if (top > axisy.max) {
                top = axisy.max;
                drawTop = false;
            }

            left = axisx.p2c(left);
            bottom = axisy.p2c(bottom);
            right = axisx.p2c(right);
            top = axisy.p2c(top);

            // fill the bar
            if (fillStyleCallback) {
                c.fillStyle = fillStyleCallback(bottom, top);
                c.fillRect(left, top, right - left, bottom - top)
            }

            // draw outline
            if (lineWidth > 0 && (drawLeft || drawRight || drawTop || drawBottom)) {
                c.beginPath();

                // FIXME: inline moveTo is buggy with excanvas
                c.moveTo(left, bottom);
                if (drawLeft)
                    c.lineTo(left, top);
                else
                    c.moveTo(left, top);
                if (drawTop)
                    c.lineTo(right, top);
                else
                    c.moveTo(right, top);
                if (drawRight)
                    c.lineTo(right, bottom);
                else
                    c.moveTo(right, bottom);
                if (drawBottom)
                    c.lineTo(left, bottom);
                else
                    c.moveTo(left, bottom);
                c.stroke();
            }
        }

        function drawSeriesBars(series) {
            function plotBars(datapoints, barLeft, barRight, fillStyleCallback, axisx, axisy) {
                var points = datapoints.points, ps = datapoints.pointsize;

                for (var i = 0; i < points.length; i += ps) {
                    if (points[i] == null)
                        continue;
                    drawBar(points[i], points[i + 1], points[i + 2], barLeft, barRight, fillStyleCallback, axisx, axisy, ctx, series.bars.horizontal, series.bars.lineWidth);
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            // FIXME: figure out a way to add shadows (for instance along the right edge)
            ctx.lineWidth = series.bars.lineWidth;
            ctx.strokeStyle = series.color;

            var barLeft;

            switch (series.bars.align) {
                case "left":
                    barLeft = 0;
                    break;
                case "right":
                    barLeft = -series.bars.barWidth;
                    break;
                default:
                    barLeft = -series.bars.barWidth / 2;
            }

            var fillStyleCallback = series.bars.fill ? function (bottom, top) { return getFillStyle(series.bars, series.color, bottom, top); } : null;
            plotBars(series.datapoints, barLeft, barLeft + series.bars.barWidth, fillStyleCallback, series.xaxis, series.yaxis);
            ctx.restore();
        }

        function getFillStyle(filloptions, seriesColor, bottom, top) {
            var fill = filloptions.fill;
            if (!fill)
                return null;

            if (filloptions.fillColor)
                return getColorOrGradient(filloptions.fillColor, bottom, top, seriesColor);

            var c = $.color.parse(seriesColor);
            c.a = typeof fill == "number" ? fill : 0.4;
            c.normalize();
            return c.toString();
        }

        function insertLegend() {

            if (options.legend.container != null) {
                $(options.legend.container).html("");
            } else {
                placeholder.find(".legend").remove();
            }

            if (!options.legend.show) {
                return;
            }

            var fragments = [], entries = [], rowStarted = false,
                lf = options.legend.labelFormatter, s, label;

            // Build a list of legend entries, with each having a label and a color

            for (var i = 0; i < series.length; ++i) {
                s = series[i];
                if (s.label) {
                    label = lf ? lf(s.label, s) : s.label;
                    if (label) {
                        entries.push({
                            label: label,
                            color: s.color
                        });
                    }
                }
            }

            // Sort the legend using either the default or a custom comparator

            if (options.legend.sorted) {
                if ($.isFunction(options.legend.sorted)) {
                    entries.sort(options.legend.sorted);
                } else if (options.legend.sorted == "reverse") {
                	entries.reverse();
                } else {
                    var ascending = options.legend.sorted != "descending";
                    entries.sort(function(a, b) {
                        return a.label == b.label ? 0 : (
                            (a.label < b.label) != ascending ? 1 : -1   // Logical XOR
                        );
                    });
                }
            }

            // Generate markup for the list of entries, in their final order

            for (var i = 0; i < entries.length; ++i) {

                var entry = entries[i];

                if (i % options.legend.noColumns == 0) {
                    if (rowStarted)
                        fragments.push('</tr>');
                    fragments.push('<tr>');
                    rowStarted = true;
                }

                fragments.push(
                    '<td class="legendColorBox"><div style="border:1px solid ' + options.legend.labelBoxBorderColor + ';padding:1px"><div style="width:4px;height:0;border:5px solid ' + entry.color + ';overflow:hidden"></div></div></td>' +
                    '<td class="legendLabel">' + entry.label + '</td>'
                );
            }

            if (rowStarted)
                fragments.push('</tr>');

            if (fragments.length == 0)
                return;

            var table = '<table style="font-size:smaller;color:' + options.grid.color + '">' + fragments.join("") + '</table>';
            if (options.legend.container != null)
                $(options.legend.container).html(table);
            else {
                var pos = "",
                    p = options.legend.position,
                    m = options.legend.margin;
                if (m[0] == null)
                    m = [m, m];
                if (p.charAt(0) == "n")
                    pos += 'top:' + (m[1] + plotOffset.top) + 'px;';
                else if (p.charAt(0) == "s")
                    pos += 'bottom:' + (m[1] + plotOffset.bottom) + 'px;';
                if (p.charAt(1) == "e")
                    pos += 'right:' + (m[0] + plotOffset.right) + 'px;';
                else if (p.charAt(1) == "w")
                    pos += 'left:' + (m[0] + plotOffset.left) + 'px;';
                var legend = $('<div class="legend">' + table.replace('style="', 'style="position:absolute;' + pos +';') + '</div>').appendTo(placeholder);
                if (options.legend.backgroundOpacity != 0.0) {
                    // put in the transparent background
                    // separately to avoid blended labels and
                    // label boxes
                    var c = options.legend.backgroundColor;
                    if (c == null) {
                        c = options.grid.backgroundColor;
                        if (c && typeof c == "string")
                            c = $.color.parse(c);
                        else
                            c = $.color.extract(legend, 'background-color');
                        c.a = 1;
                        c = c.toString();
                    }
                    var div = legend.children();
                    $('<div style="position:absolute;width:' + div.width() + 'px;height:' + div.height() + 'px;' + pos +'background-color:' + c + ';"> </div>').prependTo(legend).css('opacity', options.legend.backgroundOpacity);
                }
            }
        }


        // interactive features

        var highlights = [],
            redrawTimeout = null;

        // returns the data item the mouse is over, or null if none is found
        function findNearbyItem(mouseX, mouseY, seriesFilter) {
            var maxDistance = options.grid.mouseActiveRadius,
                smallestDistance = maxDistance * maxDistance + 1,
                item = null, foundPoint = false, i, j, ps;

            for (i = series.length - 1; i >= 0; --i) {
                if (!seriesFilter(series[i]))
                    continue;

                var s = series[i],
                    axisx = s.xaxis,
                    axisy = s.yaxis,
                    points = s.datapoints.points,
                    mx = axisx.c2p(mouseX), // precompute some stuff to make the loop faster
                    my = axisy.c2p(mouseY),
                    maxx = maxDistance / axisx.scale,
                    maxy = maxDistance / axisy.scale;

                ps = s.datapoints.pointsize;
                // with inverse transforms, we can't use the maxx/maxy
                // optimization, sadly
                if (axisx.options.inverseTransform)
                    maxx = Number.MAX_VALUE;
                if (axisy.options.inverseTransform)
                    maxy = Number.MAX_VALUE;

                if (s.lines.show || s.points.show) {
                    for (j = 0; j < points.length; j += ps) {
                        var x = points[j], y = points[j + 1];
                        if (x == null)
                            continue;

                        // For points and lines, the cursor must be within a
                        // certain distance to the data point
                        if (x - mx > maxx || x - mx < -maxx ||
                            y - my > maxy || y - my < -maxy)
                            continue;

                        // We have to calculate distances in pixels, not in
                        // data units, because the scales of the axes may be different
                        var dx = Math.abs(axisx.p2c(x) - mouseX),
                            dy = Math.abs(axisy.p2c(y) - mouseY),
                            dist = dx * dx + dy * dy; // we save the sqrt

                        // use <= to ensure last point takes precedence
                        // (last generally means on top of)
                        if (dist < smallestDistance) {
                            smallestDistance = dist;
                            item = [i, j / ps];
                        }
                    }
                }

                if (s.bars.show && !item) { // no other point can be nearby

                    var barLeft, barRight;

                    switch (s.bars.align) {
                        case "left":
                            barLeft = 0;
                            break;
                        case "right":
                            barLeft = -s.bars.barWidth;
                            break;
                        default:
                            barLeft = -s.bars.barWidth / 2;
                    }

                    barRight = barLeft + s.bars.barWidth;

                    for (j = 0; j < points.length; j += ps) {
                        var x = points[j], y = points[j + 1], b = points[j + 2];
                        if (x == null)
                            continue;

                        // for a bar graph, the cursor must be inside the bar
                        if (series[i].bars.horizontal ?
                            (mx <= Math.max(b, x) && mx >= Math.min(b, x) &&
                             my >= y + barLeft && my <= y + barRight) :
                            (mx >= x + barLeft && mx <= x + barRight &&
                             my >= Math.min(b, y) && my <= Math.max(b, y)))
                                item = [i, j / ps];
                    }
                }
            }

            if (item) {
                i = item[0];
                j = item[1];
                ps = series[i].datapoints.pointsize;

                return { datapoint: series[i].datapoints.points.slice(j * ps, (j + 1) * ps),
                         dataIndex: j,
                         series: series[i],
                         seriesIndex: i };
            }

            return null;
        }

        function onMouseMove(e) {
            if (options.grid.hoverable)
                triggerClickHoverEvent("plothover", e,
                                       function (s) { return s["hoverable"] != false; });
        }

        function onMouseLeave(e) {
            if (options.grid.hoverable)
                triggerClickHoverEvent("plothover", e,
                                       function (s) { return false; });
        }

        function onClick(e) {
            triggerClickHoverEvent("plotclick", e,
                                   function (s) { return s["clickable"] != false; });
        }

        // trigger click or hover event (they send the same parameters
        // so we share their code)
        function triggerClickHoverEvent(eventname, event, seriesFilter) {
            var offset = eventHolder.offset(),
                canvasX = event.pageX - offset.left - plotOffset.left,
                canvasY = event.pageY - offset.top - plotOffset.top,
            pos = canvasToAxisCoords({ left: canvasX, top: canvasY });

            pos.pageX = event.pageX;
            pos.pageY = event.pageY;

            var item = findNearbyItem(canvasX, canvasY, seriesFilter);

            if (item) {
                // fill in mouse pos for any listeners out there
                item.pageX = parseInt(item.series.xaxis.p2c(item.datapoint[0]) + offset.left + plotOffset.left, 10);
                item.pageY = parseInt(item.series.yaxis.p2c(item.datapoint[1]) + offset.top + plotOffset.top, 10);
            }

            if (options.grid.autoHighlight) {
                // clear auto-highlights
                for (var i = 0; i < highlights.length; ++i) {
                    var h = highlights[i];
                    if (h.auto == eventname &&
                        !(item && h.series == item.series &&
                          h.point[0] == item.datapoint[0] &&
                          h.point[1] == item.datapoint[1]))
                        unhighlight(h.series, h.point);
                }

                if (item)
                    highlight(item.series, item.datapoint, eventname);
            }

            placeholder.trigger(eventname, [ pos, item ]);
        }

        function triggerRedrawOverlay() {
            var t = options.interaction.redrawOverlayInterval;
            if (t == -1) {      // skip event queue
                drawOverlay();
                return;
            }

            if (!redrawTimeout)
                redrawTimeout = setTimeout(drawOverlay, t);
        }

        function drawOverlay() {
            redrawTimeout = null;

            // draw highlights
            octx.save();
            overlay.clear();
            octx.translate(plotOffset.left, plotOffset.top);

            var i, hi;
            for (i = 0; i < highlights.length; ++i) {
                hi = highlights[i];

                if (hi.series.bars.show)
                    drawBarHighlight(hi.series, hi.point);
                else
                    drawPointHighlight(hi.series, hi.point);
            }
            octx.restore();

            executeHooks(hooks.drawOverlay, [octx]);
        }

        function highlight(s, point, auto) {
            if (typeof s == "number")
                s = series[s];

            if (typeof point == "number") {
                var ps = s.datapoints.pointsize;
                point = s.datapoints.points.slice(ps * point, ps * (point + 1));
            }

            var i = indexOfHighlight(s, point);
            if (i == -1) {
                highlights.push({ series: s, point: point, auto: auto });

                triggerRedrawOverlay();
            }
            else if (!auto)
                highlights[i].auto = false;
        }

        function unhighlight(s, point) {
            if (s == null && point == null) {
                highlights = [];
                triggerRedrawOverlay();
                return;
            }

            if (typeof s == "number")
                s = series[s];

            if (typeof point == "number") {
                var ps = s.datapoints.pointsize;
                point = s.datapoints.points.slice(ps * point, ps * (point + 1));
            }

            var i = indexOfHighlight(s, point);
            if (i != -1) {
                highlights.splice(i, 1);

                triggerRedrawOverlay();
            }
        }

        function indexOfHighlight(s, p) {
            for (var i = 0; i < highlights.length; ++i) {
                var h = highlights[i];
                if (h.series == s && h.point[0] == p[0]
                    && h.point[1] == p[1])
                    return i;
            }
            return -1;
        }

        function drawPointHighlight(series, point) {
            var x = point[0], y = point[1],
                axisx = series.xaxis, axisy = series.yaxis,
                highlightColor = (typeof series.highlightColor === "string") ? series.highlightColor : $.color.parse(series.color).scale('a', 0.5).toString();

            if (x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max)
                return;

            var pointRadius = series.points.radius + series.points.lineWidth / 2;
            octx.lineWidth = pointRadius;
            octx.strokeStyle = highlightColor;
            var radius = 1.5 * pointRadius;
            x = axisx.p2c(x);
            y = axisy.p2c(y);

            octx.beginPath();
            if (series.points.symbol == "circle")
                octx.arc(x, y, radius, 0, 2 * Math.PI, false);
            else
                series.points.symbol(octx, x, y, radius, false);
            octx.closePath();
            octx.stroke();
        }

        function drawBarHighlight(series, point) {
            var highlightColor = (typeof series.highlightColor === "string") ? series.highlightColor : $.color.parse(series.color).scale('a', 0.5).toString(),
                fillStyle = highlightColor,
                barLeft;

            switch (series.bars.align) {
                case "left":
                    barLeft = 0;
                    break;
                case "right":
                    barLeft = -series.bars.barWidth;
                    break;
                default:
                    barLeft = -series.bars.barWidth / 2;
            }

            octx.lineWidth = series.bars.lineWidth;
            octx.strokeStyle = highlightColor;

            drawBar(point[0], point[1], point[2] || 0, barLeft, barLeft + series.bars.barWidth,
                    function () { return fillStyle; }, series.xaxis, series.yaxis, octx, series.bars.horizontal, series.bars.lineWidth);
        }

        function getColorOrGradient(spec, bottom, top, defaultColor) {
            if (typeof spec == "string")
                return spec;
            else {
                // assume this is a gradient spec; IE currently only
                // supports a simple vertical gradient properly, so that's
                // what we support too
                var gradient = ctx.createLinearGradient(0, top, 0, bottom);

                for (var i = 0, l = spec.colors.length; i < l; ++i) {
                    var c = spec.colors[i];
                    if (typeof c != "string") {
                        var co = $.color.parse(defaultColor);
                        if (c.brightness != null)
                            co = co.scale('rgb', c.brightness);
                        if (c.opacity != null)
                            co.a *= c.opacity;
                        c = co.toString();
                    }
                    gradient.addColorStop(i / (l - 1), c);
                }

                return gradient;
            }
        }
    }

    // Add the plot function to the top level of the jQuery object

    $.plot = function(placeholder, data, options) {
        //var t0 = new Date();
        var plot = new Plot($(placeholder), data, options, $.plot.plugins);
        //(window.console ? console.log : alert)("time used (msecs): " + ((new Date()).getTime() - t0.getTime()));
        return plot;
    };

    $.plot.version = "0.8.2";

    $.plot.plugins = [];

    // Also add the plot function as a chainable property

    $.fn.plot = function(data, options) {
        return this.each(function() {
            $.plot(this, data, options);
        });
    };

    // round to nearby lower multiple of base
    function floorInBase(n, base) {
        return base * Math.floor(n / base);
    }

})(jQuery);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS5mbG90LmpzIl0sIm5hbWVzIjpbIiQiLCJjb2xvciIsIm1ha2UiLCJyIiwiZyIsImIiLCJhIiwibyIsImFkZCIsImMiLCJkIiwiaSIsImxlbmd0aCIsImNoYXJBdCIsIm5vcm1hbGl6ZSIsInNjYWxlIiwiZiIsInRvU3RyaW5nIiwiam9pbiIsImNsYW1wIiwibWluIiwidmFsdWUiLCJtYXgiLCJwYXJzZUludCIsImNsb25lIiwiZXh0cmFjdCIsImVsZW0iLCJjc3MiLCJ0b0xvd2VyQ2FzZSIsInBhcmVudCIsIm5vZGVOYW1lIiwiZ2V0IiwicGFyc2UiLCJzdHIiLCJyZXMiLCJtIiwiZXhlYyIsInBhcnNlRmxvYXQiLCJuYW1lIiwidHJpbSIsImxvb2t1cENvbG9ycyIsImFxdWEiLCJhenVyZSIsImJlaWdlIiwiYmxhY2siLCJibHVlIiwiYnJvd24iLCJjeWFuIiwiZGFya2JsdWUiLCJkYXJrY3lhbiIsImRhcmtncmV5IiwiZGFya2dyZWVuIiwiZGFya2toYWtpIiwiZGFya21hZ2VudGEiLCJkYXJrb2xpdmVncmVlbiIsImRhcmtvcmFuZ2UiLCJkYXJrb3JjaGlkIiwiZGFya3JlZCIsImRhcmtzYWxtb24iLCJkYXJrdmlvbGV0IiwiZnVjaHNpYSIsImdvbGQiLCJncmVlbiIsImluZGlnbyIsImtoYWtpIiwibGlnaHRibHVlIiwibGlnaHRjeWFuIiwibGlnaHRncmVlbiIsImxpZ2h0Z3JleSIsImxpZ2h0cGluayIsImxpZ2h0eWVsbG93IiwibGltZSIsIm1hZ2VudGEiLCJtYXJvb24iLCJuYXZ5Iiwib2xpdmUiLCJvcmFuZ2UiLCJwaW5rIiwicHVycGxlIiwidmlvbGV0IiwicmVkIiwic2lsdmVyIiwid2hpdGUiLCJ5ZWxsb3ciLCJqUXVlcnkiLCJDYW52YXMiLCJjbHMiLCJjb250YWluZXIiLCJlbGVtZW50IiwiY2hpbGRyZW4iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjbGFzc05hbWUiLCJkaXJlY3Rpb24iLCJwb3NpdGlvbiIsImxlZnQiLCJ0b3AiLCJhcHBlbmRUbyIsImdldENvbnRleHQiLCJ3aW5kb3ciLCJHX3ZtbENhbnZhc01hbmFnZXIiLCJFcnJvciIsImluaXRFbGVtZW50IiwidGhpcyIsImNvbnRleHQiLCJkZXZpY2VQaXhlbFJhdGlvIiwiYmFja2luZ1N0b3JlUmF0aW8iLCJ3ZWJraXRCYWNraW5nU3RvcmVQaXhlbFJhdGlvIiwibW96QmFja2luZ1N0b3JlUGl4ZWxSYXRpbyIsIm1zQmFja2luZ1N0b3JlUGl4ZWxSYXRpbyIsIm9CYWNraW5nU3RvcmVQaXhlbFJhdGlvIiwiYmFja2luZ1N0b3JlUGl4ZWxSYXRpbyIsInBpeGVsUmF0aW8iLCJyZXNpemUiLCJ3aWR0aCIsImhlaWdodCIsInRleHRDb250YWluZXIiLCJ0ZXh0IiwiX3RleHRDYWNoZSIsIlBsb3QiLCJwbGFjZWhvbGRlciIsImRhdGFfIiwib3B0aW9uc18iLCJwbHVnaW5zIiwiZXhlY3V0ZUhvb2tzIiwiaG9vayIsImFyZ3MiLCJwbG90IiwiY29uY2F0IiwiYXBwbHkiLCJpbml0UGx1Z2lucyIsImNsYXNzZXMiLCJwIiwiaW5pdCIsIm9wdGlvbnMiLCJleHRlbmQiLCJwYXJzZU9wdGlvbnMiLCJvcHRzIiwiY29sb3JzIiwieGF4aXMiLCJncmlkIiwieWF4aXMiLCJ0aWNrQ29sb3IiLCJib3JkZXJDb2xvciIsImF4aXNPcHRpb25zIiwiYXhpc0NvdW50IiwiZm9udFNpemUiLCJmb250U2l6ZURlZmF1bHQiLCJyZXBsYWNlIiwiZm9udERlZmF1bHRzIiwic3R5bGUiLCJzaXplIiwiTWF0aCIsInJvdW5kIiwidmFyaWFudCIsIndlaWdodCIsImZhbWlseSIsInhheGVzIiwiZm9udCIsImxpbmVIZWlnaHQiLCJ5YXhlcyIsIm5vVGlja3MiLCJ0aWNrcyIsIngyYXhpcyIsInkyYXhpcyIsImNvbG9yZWRBcmVhcyIsIm1hcmtpbmdzIiwiY29sb3JlZEFyZWFzQ29sb3IiLCJtYXJraW5nc0NvbG9yIiwibGluZXMiLCJzZXJpZXMiLCJwb2ludHMiLCJiYXJzIiwic2hhZG93U2l6ZSIsImhpZ2hsaWdodENvbG9yIiwiZ2V0T3JDcmVhdGVBeGlzIiwibiIsImhvb2tzIiwicHJvY2Vzc09wdGlvbnMiLCJzZXREYXRhIiwicGFyc2VEYXRhIiwiZmlsbEluU2VyaWVzT3B0aW9ucyIsInByb2Nlc3NEYXRhIiwicyIsImRhdGEiLCJwdXNoIiwiYXhpc051bWJlciIsIm9iaiIsImNvb3JkIiwiYWxsQXhlcyIsImdyZXAiLCJjYW52YXNUb0F4aXNDb29yZHMiLCJwb3MiLCJheGlzIiwidXNlZCIsImMycCIsInVuZGVmaW5lZCIsIngxIiwieCIsInkxIiwieSIsImF4aXNUb0NhbnZhc0Nvb3JkcyIsImtleSIsInAyYyIsImF4ZXMiLCJudW1iZXIiLCJuZWVkZWRDb2xvcnMiLCJtYXhJbmRleCIsInNjIiwiY29sb3JQb29sIiwiY29sb3JQb29sU2l6ZSIsInZhcmlhdGlvbiIsImNvbG9yaSIsInNob3ciLCJ2IiwiemVybyIsImZpbGwiLCJ1cGRhdGVBeGlzIiwiZGF0YW1pbiIsImZha2VJbmZpbml0eSIsImRhdGFtYXgiLCJqIiwiayIsInBzIiwidmFsIiwiZm9ybWF0IiwidG9wU2VudHJ5IiwiTnVtYmVyIiwiUE9TSVRJVkVfSU5GSU5JVFkiLCJib3R0b21TZW50cnkiLCJORUdBVElWRV9JTkZJTklUWSIsIk1BWF9WQUxVRSIsImVhY2giLCJfIiwiZGF0YXBvaW50cyIsInByb2Nlc3NSYXdEYXRhIiwicmVxdWlyZWQiLCJhdXRvc2NhbGUiLCJkZWZhdWx0VmFsdWUiLCJob3Jpem9udGFsIiwicG9pbnRzaXplIiwiaW5zZXJ0U3RlcHMiLCJzdGVwcyIsIm51bGxpZnkiLCJpc05hTiIsIkluZmluaXR5IiwicHJvY2Vzc0RhdGFwb2ludHMiLCJ4bWluIiwieW1pbiIsInhtYXgiLCJ5bWF4IiwiZGVsdGEiLCJhbGlnbiIsImJhcldpZHRoIiwic2V0dXBDYW52YXNlcyIsImZpbHRlciIsImhhc0NsYXNzIiwicmVtb3ZlIiwic3VyZmFjZSIsIm92ZXJsYXkiLCJjdHgiLCJvY3R4IiwiZXZlbnRIb2xkZXIiLCJ1bmJpbmQiLCJleGlzdGluZyIsInNodXRkb3duIiwiY2xlYXIiLCJiaW5kRXZlbnRzIiwiaG92ZXJhYmxlIiwibW91c2Vtb3ZlIiwib25Nb3VzZU1vdmUiLCJiaW5kIiwib25Nb3VzZUxlYXZlIiwiY2xpY2thYmxlIiwiY2xpY2siLCJvbkNsaWNrIiwicmVkcmF3VGltZW91dCIsImNsZWFyVGltZW91dCIsInNldFRyYW5zZm9ybWF0aW9uSGVscGVycyIsImlkZW50aXR5IiwidCIsInRyYW5zZm9ybSIsIml0IiwiaW52ZXJzZVRyYW5zZm9ybSIsInBsb3RXaWR0aCIsImFicyIsInBsb3RIZWlnaHQiLCJtZWFzdXJlVGlja0xhYmVscyIsImxhYmVsV2lkdGgiLCJsYWJlbEhlaWdodCIsIm1heFdpZHRoIiwiZmxvb3IiLCJsZWdhY3lTdHlsZXMiLCJsYXllciIsImxhYmVsIiwiaW5mbyIsImdldFRleHRJbmZvIiwiYWxsb2NhdGVBeGlzQm94Rmlyc3RQaGFzZSIsImx3IiwibGgiLCJpc1hBeGlzIiwidGlja0xlbmd0aCIsImF4aXNNYXJnaW4iLCJwYWRkaW5nIiwibGFiZWxNYXJnaW4iLCJpbm5lcm1vc3QiLCJvdXRlcm1vc3QiLCJmaXJzdCIsImZvdW5kIiwicmVzZXJ2ZVNwYWNlIiwicGxvdE9mZnNldCIsImJvdHRvbSIsImJveCIsInJpZ2h0IiwiYWxsb2NhdGVBeGlzQm94U2Vjb25kUGhhc2UiLCJhZGp1c3RMYXlvdXRGb3JUaGluZ3NTdGlja2luZ091dCIsIm1pbk1hcmdpbiIsIm1pbkJvcmRlck1hcmdpbiIsInJhZGl1cyIsImxpbmVXaWR0aCIsIm1hcmdpbnMiLCJsYXN0VGljayIsImNlaWwiLCJzZXR1cEdyaWQiLCJzaG93R3JpZCIsIm1hcmdpbiIsInByb2Nlc3NPZmZzZXQiLCJib3JkZXJXaWR0aCIsInNldFJhbmdlIiwiYWxsb2NhdGVkQXhlcyIsInNldHVwVGlja0dlbmVyYXRpb24iLCJzZXRUaWNrcyIsInNuYXBSYW5nZVRvVGlja3MiLCJkcmF3QXhpc0xhYmVscyIsImluc2VydExlZ2VuZCIsIndpZGVuIiwiYXV0b3NjYWxlTWFyZ2luIiwic3FydCIsImRlYyIsImxvZyIsIkxOMTAiLCJtYXhEZWMiLCJ0aWNrRGVjaW1hbHMiLCJtYWduIiwicG93Iiwibm9ybSIsIm1pblRpY2tTaXplIiwidGlja1NpemUiLCJtb2RlIiwidGlja0dlbmVyYXRvciIsInByZXYiLCJzdGFydCIsImZsb29ySW5CYXNlIiwiTmFOIiwidGlja0Zvcm1hdHRlciIsImZhY3RvciIsImZvcm1hdHRlZCIsImRlY2ltYWwiLCJpbmRleE9mIiwicHJlY2lzaW9uIiwic3Vic3RyIiwiaXNGdW5jdGlvbiIsImFsaWduVGlja3NXaXRoQXhpcyIsIm90aGVyQXhpcyIsIm5pY2VUaWNrcyIsImV4dHJhRGVjIiwidHMiLCJ0ZXN0IiwidG9GaXhlZCIsIm90aWNrcyIsImRyYXciLCJkcmF3QmFja2dyb3VuZCIsImJhY2tncm91bmRDb2xvciIsImFib3ZlRGF0YSIsImRyYXdHcmlkIiwiZHJhd1NlcmllcyIsInJlbmRlciIsInRyaWdnZXJSZWRyYXdPdmVybGF5IiwiZXh0cmFjdFJhbmdlIiwicmFuZ2VzIiwiZnJvbSIsInRvIiwidG1wIiwic2F2ZSIsInRyYW5zbGF0ZSIsImZpbGxTdHlsZSIsImdldENvbG9yT3JHcmFkaWVudCIsImZpbGxSZWN0IiwicmVzdG9yZSIsImJ3IiwiYmMiLCJnZXRBeGVzIiwieHJhbmdlIiwieXJhbmdlIiwiYmVnaW5QYXRoIiwic3Ryb2tlU3R5bGUiLCJtYXJraW5nc0xpbmVXaWR0aCIsIm1vdmVUbyIsImxpbmVUbyIsInN0cm9rZSIsInhvZmYiLCJ5b2ZmIiwic3Ryb2tlUmVjdCIsInRpY2siLCJoYWxpZ24iLCJ2YWxpZ24iLCJyZW1vdmVUZXh0IiwiYWRkVGV4dCIsImRyYXdTZXJpZXNMaW5lcyIsImRyYXdTZXJpZXNCYXJzIiwiZHJhd1Nlcmllc1BvaW50cyIsInBsb3RMaW5lIiwieG9mZnNldCIsInlvZmZzZXQiLCJheGlzeCIsImF4aXN5IiwicHJldngiLCJwcmV2eSIsIngyIiwieTIiLCJwbG90TGluZUFyZWEiLCJhcmVhT3BlbiIsInlwb3MiLCJzZWdtZW50U3RhcnQiLCJzZWdtZW50RW5kIiwieDFvbGQiLCJ4Mm9sZCIsImxpbmVKb2luIiwic3ciLCJhbmdsZSIsIlBJIiwic2luIiwiY29zIiwiZ2V0RmlsbFN0eWxlIiwicGxvdFBvaW50cyIsIm9mZnNldCIsInNoYWRvdyIsInN5bWJvbCIsImFyYyIsImNsb3NlUGF0aCIsInciLCJkcmF3QmFyIiwiYmFyTGVmdCIsImJhclJpZ2h0IiwiZmlsbFN0eWxlQ2FsbGJhY2siLCJkcmF3TGVmdCIsImRyYXdSaWdodCIsImRyYXdUb3AiLCJkcmF3Qm90dG9tIiwicGxvdEJhcnMiLCJmaWxsb3B0aW9ucyIsInNlcmllc0NvbG9yIiwiZmlsbENvbG9yIiwibGVnZW5kIiwiaHRtbCIsImZpbmQiLCJmcmFnbWVudHMiLCJlbnRyaWVzIiwicm93U3RhcnRlZCIsImxmIiwibGFiZWxGb3JtYXR0ZXIiLCJzb3J0ZWQiLCJzb3J0IiwicmV2ZXJzZSIsImFzY2VuZGluZyIsImVudHJ5Iiwibm9Db2x1bW5zIiwibGFiZWxCb3hCb3JkZXJDb2xvciIsInRhYmxlIiwiYmFja2dyb3VuZE9wYWNpdHkiLCJkaXYiLCJwcmVwZW5kVG8iLCJmaW5kTmVhcmJ5SXRlbSIsIm1vdXNlWCIsIm1vdXNlWSIsInNlcmllc0ZpbHRlciIsIm1heERpc3RhbmNlIiwibW91c2VBY3RpdmVSYWRpdXMiLCJzbWFsbGVzdERpc3RhbmNlIiwiaXRlbSIsIm14IiwibXkiLCJtYXh4IiwibWF4eSIsImR4IiwiZHkiLCJkaXN0IiwiZGF0YXBvaW50Iiwic2xpY2UiLCJkYXRhSW5kZXgiLCJzZXJpZXNJbmRleCIsImUiLCJ0cmlnZ2VyQ2xpY2tIb3ZlckV2ZW50IiwiZXZlbnRuYW1lIiwiZXZlbnQiLCJjYW52YXNYIiwicGFnZVgiLCJjYW52YXNZIiwicGFnZVkiLCJhdXRvSGlnaGxpZ2h0IiwiaGlnaGxpZ2h0cyIsImgiLCJhdXRvIiwicG9pbnQiLCJ1bmhpZ2hsaWdodCIsImhpZ2hsaWdodCIsInRyaWdnZXIiLCJpbnRlcmFjdGlvbiIsInJlZHJhd092ZXJsYXlJbnRlcnZhbCIsImRyYXdPdmVybGF5Iiwic2V0VGltZW91dCIsImhpIiwiZHJhd0JhckhpZ2hsaWdodCIsImRyYXdQb2ludEhpZ2hsaWdodCIsImluZGV4T2ZIaWdobGlnaHQiLCJzcGxpY2UiLCJwb2ludFJhZGl1cyIsInNwZWMiLCJkZWZhdWx0Q29sb3IiLCJncmFkaWVudCIsImNyZWF0ZUxpbmVhckdyYWRpZW50IiwibCIsImNvIiwiYnJpZ2h0bmVzcyIsIm9wYWNpdHkiLCJhZGRDb2xvclN0b3AiLCJnZXRQbGFjZWhvbGRlciIsImdldENhbnZhcyIsImdldFBsb3RPZmZzZXQiLCJnZXREYXRhIiwiZ2V0WEF4ZXMiLCJnZXRZQXhlcyIsImdldE9wdGlvbnMiLCJwb2ludE9mZnNldCIsImRlc3Ryb3kiLCJyZW1vdmVEYXRhIiwiZW1wdHkiLCJiYXNlIiwiaGFzT3duUHJvcGVydHkiLCJPYmplY3QiLCJwcm90b3R5cGUiLCJjbGVhclJlY3QiLCJjYWNoZSIsImxheWVyS2V5IiwiY2FsbCIsImdldFRleHRMYXllciIsImxheWVyQ2FjaGUiLCJoaWRlIiwic3R5bGVLZXkiLCJzdHlsZUNhY2hlIiwicG9zaXRpb25zIiwiYWN0aXZlIiwicmVuZGVyZWQiLCJhcHBlbmQiLCJkZXRhY2giLCJmb250LXNpemUiLCJpbnNlcnRBZnRlciIsImFkZENsYXNzIiwidGV4dFN0eWxlIiwibWF4LXdpZHRoIiwib3V0ZXJXaWR0aCIsIm91dGVySGVpZ2h0IiwidGV4dC1hbGlnbiIsInZlcnNpb24iLCJmbiJdLCJtYXBwaW5ncyI6IkNBK0JBLFNBQVVBLEdBQUdBLEVBQUVDLFNBQVNELEVBQUVDLE1BQU1DLEtBQUssU0FBU0MsRUFBRUMsRUFBRUMsRUFBRUMsR0FBRyxHQUFJQyxLQUFnbkIsT0FBM21CQSxHQUFFSixFQUFFQSxHQUFHLEVBQUVJLEVBQUVILEVBQUVBLEdBQUcsRUFBRUcsRUFBRUYsRUFBRUEsR0FBRyxFQUFF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SUFBSVgsU0FBU1csRUFBSSxHQUFHQSxFQUFJLEdBQUcsSUFBSVgsU0FBU1csRUFBSSxHQUFHQSxFQUFJLEdBQUcsSUFBSyxJQUFJSSxHQUFLdEMsRUFBRXVDLEtBQUtOLEdBQUtMLGFBQWMsT0FBUyxlQUFOVSxFQUEyQkgsRUFBRSxJQUFJLElBQUksSUFBSSxJQUFRRCxFQUFJTSxFQUFhRixLQUFRLEVBQUUsRUFBRSxHQUFVSCxFQUFFRCxFQUFJLEdBQUdBLEVBQUksR0FBR0EsRUFBSSxLQUFNLElBQUlNLElBQWNDLE1BQU0sRUFBRSxJQUFJLEtBQUtDLE9BQU8sSUFBSSxJQUFJLEtBQUtDLE9BQU8sSUFBSSxJQUFJLEtBQUtDLE9BQU8sRUFBRSxFQUFFLEdBQUdDLE1BQU0sRUFBRSxFQUFFLEtBQUtDLE9BQU8sSUFBSSxHQUFHLElBQUlDLE1BQU0sRUFBRSxJQUFJLEtBQUtDLFVBQVUsRUFBRSxFQUFFLEtBQUtDLFVBQVUsRUFBRSxJQUFJLEtBQUtDLFVBQVUsSUFBSSxJQUFJLEtBQUtDLFdBQVcsRUFBRSxJQUFJLEdBQUdDLFdBQVcsSUFBSSxJQUFJLEtBQUtDLGFBQWEsSUFBSSxFQUFFLEtBQUtDLGdCQUFnQixHQUFHLElBQUksSUFBSUMsWUFBWSxJQUFJLElBQUksR0FBR0MsWUFBWSxJQUFJLEdBQUcsS0FBS0MsU0FBUyxJQUFJLEVBQUUsR0FBR0MsWUFBWSxJQUFJLElBQUksS0FBS0MsWUFBWSxJQUFJLEVBQUUsS0FBS0MsU0FBUyxJQUFJLEVBQUUsS0FBS0MsTUFBTSxJQUFJLElBQUksR0FBR0MsT0FBTyxFQUFFLElBQUksR0FBR0MsUUFBUSxHQUFHLEVBQUUsS0FBS0MsT0FBTyxJQUFJLElBQUksS0FBS0MsV0FBVyxJQUFJLElBQUksS0FBS0MsV0FBVyxJQUFJLElBQUksS0FBS0MsWUFBWSxJQUFJLElBQUksS0FBS0MsV0FBVyxJQUFJLElBQUksS0FBS0MsV0FBVyxJQUFJLElBQUksS0FBS0MsYUFBYSxJQUFJLElBQUksS0FBS0MsTUFBTSxFQUFFLElBQUksR0FBR0MsU0FBUyxJQUFJLEVB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b2IsUUFBVSxRQUVqQm5qQixFQUFFK0gsS0FBS0osV0FJUDNILEVBQUVvakIsR0FBR3JiLEtBQU8sU0FBU3lELEVBQU1sRCxHQUN2QixNQUFPL0IsTUFBS2lJLEtBQUssV0FDYnhPLEVBQUUrSCxLQUFLeEIsS0FBTWlGLEVBQU1sRCxPQVM1QmxEIiwiZmlsZSI6ImpxdWVyeS5mbG90LWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogSmF2YXNjcmlwdCBwbG90dGluZyBsaWJyYXJ5IGZvciBqUXVlcnksIHZlcnNpb24gMC44LjIuXG5cbkNvcHlyaWdodCAoYykgMjAwNy0yMDEzIElPTEEgYW5kIE9sZSBMYXVyc2VuLlxuTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4qL1xuXG4vLyBmaXJzdCBhbiBpbmxpbmUgZGVwZW5kZW5jeSwganF1ZXJ5LmNvbG9yaGVscGVycy5qcywgd2UgaW5saW5lIGl0IGhlcmVcbi8vIGZvciBjb252ZW5pZW5jZVxuXG4vKiBQbHVnaW4gZm9yIGpRdWVyeSBmb3Igd29ya2luZyB3aXRoIGNvbG9ycy5cbiAqXG4gKiBWZXJzaW9uIDEuMS5cbiAqXG4gKiBJbnNwaXJhdGlvbiBmcm9tIGpRdWVyeSBjb2xvciBhbmltYXRpb24gcGx1Z2luIGJ5IEpvaG4gUmVzaWcuXG4gKlxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGJ5IE9sZSBMYXVyc2VuLCBPY3RvYmVyIDIwMDkuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAkLmNvbG9yLnBhcnNlKFwiI2ZmZlwiKS5zY2FsZSgncmdiJywgMC4yNSkuYWRkKCdhJywgLTAuNSkudG9TdHJpbmcoKVxuICogICB2YXIgYyA9ICQuY29sb3IuZXh0cmFjdCgkKFwiI215ZGl2XCIpLCAnYmFja2dyb3VuZC1jb2xvcicpO1xuICogICBjb25zb2xlLmxvZyhjLnIsIGMuZywgYy5iLCBjLmEpO1xuICogICAkLmNvbG9yLm1ha2UoMTAwLCA1MCwgMjUsIDAuNCkudG9TdHJpbmcoKSAvLyByZXR1cm5zIFwicmdiYSgxMDAsNTAsMjUsMC40KVwiXG4gKlxuICogTm90ZSB0aGF0IC5zY2FsZSgpIGFuZCAuYWRkKCkgcmV0dXJuIHRoZSBzYW1lIG1vZGlmaWVkIG9iamVjdFxuICogaW5zdGVhZCBvZiBtYWtpbmcgYSBuZXcgb25lLlxuICpcbiAqIFYuIDEuMTogRml4IGVycm9yIGhhbmRsaW5nIHNvIGUuZy4gcGFyc2luZyBhbiBlbXB0eSBzdHJpbmcgZG9lc1xuICogcHJvZHVjZSBhIGNvbG9yIHJhdGhlciB0aGFuIGp1c3QgY3Jhc2hpbmcuXG4gKi9cbihmdW5jdGlvbigkKXskLmNvbG9yPXt9OyQuY29sb3IubWFrZT1mdW5jdGlvbihyLGcsYixhKXt2YXIgbz17fTtvLnI9cnx8MDtvLmc9Z3x8MDtvLmI9Ynx8MDtvLmE9YSE9bnVsbD9hOjE7by5hZGQ9ZnVuY3Rpb24oYyxkKXtmb3IodmFyIGk9MDtpPGMubGVuZ3RoOysraSlvW2MuY2hhckF0KGkpXSs9ZDtyZXR1cm4gby5ub3JtYWxpemUoKX07by5zY2FsZT1mdW5jdGlvbihjLGYpe2Zvcih2YXIgaT0wO2k8Yy5sZW5ndGg7KytpKW9bYy5jaGFyQXQoaSldKj1mO3JldHVybiBvLm5vcm1hbGl6ZSgpfTtvLnRvU3RyaW5nPWZ1bmN0aW9uKCl7aWYoby5hPj0xKXtyZXR1cm5cInJnYihcIitbby5yLG8uZyxvLmJdLmpvaW4oXCIsXCIpK1wiKVwifWVsc2V7cmV0dXJuXCJyZ2JhKFwiK1tvLnIsby5nLG8uYixvLmFdLmpvaW4oXCIsXCIpK1wiKVwifX07by5ub3JtYWxpemU9ZnVuY3Rpb24oKXtmdW5jdGlvbiBjbGFtcChtaW4sdmFsdWUsbWF4KXtyZXR1cm4gdmFsdWU8bWluP21pbjp2YWx1ZT5tYXg/bWF4OnZhbHVlfW8ucj1jbGFtcCgwLHBhcnNlSW50KG8uciksMjU1KTtvLmc9Y2xhbXAoMCxwYXJzZUludChvLmcpLDI1NSk7by5iPWNsYW1wKDAscGFyc2VJbnQoby5iKSwyNTUpO28uYT1jbGFtcCgwLG8uYSwxKTtyZXR1cm4gb307by5jbG9uZT1mdW5jdGlvbigpe3JldHVybiAkLmNvbG9yLm1ha2Uoby5yLG8uYixvLmcsby5hKX07cmV0dXJuIG8ubm9ybWFsaXplKCl9OyQuY29sb3IuZXh0cmFjdD1mdW5jdGlvbihlbGVtLGNzcyl7dmFyIGM7ZG97Yz1lbGVtLmNzcyhjc3MpLnRvTG93ZXJDYXNlKCk7aWYoYyE9XCJcIiYmYyE9XCJ0cmFuc3BhcmVudFwiKWJyZWFrO2VsZW09ZWxlbS5wYXJlbnQoKX13aGlsZShlbGVtLmxlbmd0aCYmISQubm9kZU5hbWUoZWxlbS5nZXQoMCksXCJib2R5XCIpKTtpZihjPT1cInJnYmEoMCwgMCwgMCwgMClcIiljPVwidHJhbnNwYXJlbnRcIjtyZXR1cm4gJC5jb2xvci5wYXJzZShjKX07JC5jb2xvci5wYXJzZT1mdW5jdGlvbihzdHIpe3ZhciByZXMsbT0kLmNvbG9yLm1ha2U7aWYocmVzPS9yZ2JcXChcXHMqKFswLTldezEsM30pXFxzKixcXHMqKFswLTldezEsM30pXFxzKixcXHMqKFswLTldezEsM30pXFxzKlxcKS8uZXhlYyhzdHIpKXJldHVybiBtKHBhcnNlSW50KHJlc1sxXSwxMCkscGFyc2VJbnQocmVzWzJdLDEwKSxwYXJzZUludChyZXNbM10sMTApKTtpZihyZXM9L3JnYmFcXChcXHMqKFswLTldezEsM30pXFxzKixcXHMqKFswLTldezEsM30pXFxzKixcXHMqKFswLTldezEsM30pXFxzKixcXHMqKFswLTldKyg/OlxcLlswLTldKyk/KVxccypcXCkvLmV4ZWMoc3RyKSlyZXR1cm4gbShwYXJzZUludChyZXNbMV0sMTApLHBhcnNlSW50KHJlc1syXSwxMCkscGFyc2VJbnQocmVzWzNdLDEwKSxwYXJzZUZsb2F0KHJlc1s0XSkpO2lmKHJlcz0vcmdiXFwoXFxzKihbMC05XSsoPzpcXC5bMC05XSspPylcXCVcXHMqLFxccyooWzAtOV0rKD86XFwuWzAtOV0rKT8pXFwlXFxzKixcXHMqKFswLTldKyg/OlxcLlswLTldKyk/KVxcJVxccypcXCkvLmV4ZWMoc3RyKSlyZXR1cm4gbShwYXJzZUZsb2F0KHJlc1sxXSkqMi41NSxwYXJzZUZsb2F0KHJlc1syXSkqMi41NSxwYXJzZUZsb2F0KHJlc1szXSkqMi41NSk7aWYocmVzPS9yZ2JhXFwoXFxzKihbMC05XSsoPzpcXC5bMC05XSspPylcXCVcXHMqLFxccyooWzAtOV0rKD86XFwuWzAtOV0rKT8pXFwlXFxzKixcXHMqKFswLTldKyg/OlxcLlswLTldKyk/KVxcJVxccyosXFxzKihbMC05XSsoPzpcXC5bMC05XSspPylcXHMqXFwpLy5leGVjKHN0cikpcmV0dXJuIG0ocGFyc2VGbG9hdChyZXNbMV0pKjIuNTUscGFyc2VGbG9hdChyZXNbMl0pKjIuNTUscGFyc2VGbG9hdChyZXNbM10pKjIuNTUscGFyc2VGbG9hdChyZXNbNF0pKTtpZihyZXM9LyMoW2EtZkEtRjAtOV17Mn0pKFthLWZBLUYwLTldezJ9KShbYS1mQS1GMC05XXsyfSkvLmV4ZWMoc3RyKSlyZXR1cm4gbShwYXJzZUludChyZXNbMV0sMTYpLHBhcnNlSW50KHJlc1syXSwxNikscGFyc2VJbnQocmVzWzNdLDE2KSk7aWYocmVzPS8jKFthLWZBLUYwLTldKShbYS1mQS1GMC05XSkoW2EtZkEtRjAtOV0pLy5leGVjKHN0cikpcmV0dXJuIG0ocGFyc2VJbnQocmVzWzFdK3Jlc1sxXSwxNikscGFyc2VJbnQocmVzWzJdK3Jlc1syXSwxNikscGFyc2VJbnQocmVzWzNdK3Jlc1szXSwxNikpO3ZhciBuYW1lPSQudHJpbShzdHIpLnRvTG93ZXJDYXNlKCk7aWYobmFtZT09XCJ0cmFuc3BhcmVudFwiKXJldHVybiBtKDI1NSwyNTUsMjU1LDApO2Vsc2V7cmVzPWxvb2t1cENvbG9yc1tuYW1lXXx8WzAsMCwwXTtyZXR1cm4gbShyZXNbMF0scmVzWzFdLHJlc1syXSl9fTt2YXIgbG9va3VwQ29sb3JzPXthcXVhOlswLDI1NSwyNTVdLGF6dXJlOlsyNDAsMjU1LDI1NV0sYmVpZ2U6WzI0NSwyNDUsMjIwXSxibGFjazpbMCwwLDBdLGJsdWU6WzAsMCwyNTVdLGJyb3duOlsxNjUsNDIsNDJdLGN5YW46WzAsMjU1LDI1NV0sZGFya2JsdWU6WzAsMCwxMzldLGRhcmtjeWFuOlswLDEzOSwxMzldLGRhcmtncmV5OlsxNjksMTY5LDE2OV0sZGFya2dyZWVuOlswLDEwMCwwXSxkYXJra2hha2k6WzE4OSwxODMsMTA3XSxkYXJrbWFnZW50YTpbMTM5LDAsMTM5XSxkYXJrb2xpdmVncmVlbjpbODUsMTA3LDQ3XSxkYXJrb3JhbmdlOlsyNTUsMTQwLDBdLGRhcmtvcmNoaWQ6WzE1Myw1MCwyMDRdLGRhcmtyZWQ6WzEzOSwwLDBdLGRhcmtzYWxtb246WzIzMywxNTAsMTIyXSxkYXJrdmlvbGV0OlsxNDgsMCwyMTFdLGZ1Y2hzaWE6WzI1NSwwLDI1NV0sZ29sZDpbMjU1LDIxNSwwXSxncmVlbjpbMCwxMjgsMF0saW5kaWdvOls3NSwwLDEzMF0sa2hha2k6WzI0MCwyMzAsMTQwXSxsaWdodGJsdWU6WzE3MywyMTYsMjMwXSxsaWdodGN5YW46WzIyNCwyNTUsMjU1XSxsaWdodGdyZWVuOlsxNDQsMjM4LDE0NF0sbGlnaHRncmV5OlsyMTEsMjExLDIxMV0sbGlnaHRwaW5rOlsyNTUsMTgyLDE5M10sbGlnaHR5ZWxsb3c6WzI1NSwyNTUsMjI0XSxsaW1lOlswLDI1NSwwXSxtYWdlbnRhOlsyNTUsMCwyNTVdLG1hcm9vbjpbMTI4LDAsMF0sbmF2eTpbMCwwLDEyOF0sb2xpdmU6WzEyOCwxMjgsMF0sb3JhbmdlOlsyNTUsMTY1LDBdLHBpbms6WzI1NSwxOTIsMjAzXSxwdXJwbGU6WzEyOCwwLDEyOF0sdmlvbGV0OlsxMjgsMCwxMjhdLHJlZDpbMjU1LDAsMF0sc2lsdmVyOlsxOTIsMTkyLDE5Ml0sd2hpdGU6WzI1NSwyNTUsMjU1XSx5ZWxsb3c6WzI1NSwyNTUsMF19fSkoalF1ZXJ5KTtcblxuLy8gdGhlIGFjdHVhbCBGbG90IGNvZGVcbihmdW5jdGlvbigkKSB7XG5cblx0Ly8gQ2FjaGUgdGhlIHByb3RvdHlwZSBoYXNPd25Qcm9wZXJ0eSBmb3IgZmFzdGVyIGFjY2Vzc1xuXG5cdHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vIFRoZSBDYW52YXMgb2JqZWN0IGlzIGEgd3JhcHBlciBhcm91bmQgYW4gSFRNTDUgPGNhbnZhcz4gdGFnLlxuXHQvL1xuXHQvLyBAY29uc3RydWN0b3Jcblx0Ly8gQHBhcmFtIHtzdHJpbmd9IGNscyBMaXN0IG9mIGNsYXNzZXMgdG8gYXBwbHkgdG8gdGhlIGNhbnZhcy5cblx0Ly8gQHBhcmFtIHtlbGVtZW50fSBjb250YWluZXIgRWxlbWVudCBvbnRvIHdoaWNoIHRvIGFwcGVuZCB0aGUgY2FudmFzLlxuXHQvL1xuXHQvLyBSZXF1aXJpbmcgYSBjb250YWluZXIgaXMgYSBsaXR0bGUgaWZmeSwgYnV0IHVuZm9ydHVuYXRlbHkgY2FudmFzXG5cdC8vIG9wZXJhdGlvbnMgZG9uJ3Qgd29yayB1bmxlc3MgdGhlIGNhbnZhcyBpcyBhdHRhY2hlZCB0byB0aGUgRE9NLlxuXG5cdGZ1bmN0aW9uIENhbnZhcyhjbHMsIGNvbnRhaW5lcikge1xuXG5cdFx0dmFyIGVsZW1lbnQgPSBjb250YWluZXIuY2hpbGRyZW4oXCIuXCIgKyBjbHMpWzBdO1xuXG5cdFx0aWYgKGVsZW1lbnQgPT0gbnVsbCkge1xuXG5cdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcblx0XHRcdGVsZW1lbnQuY2xhc3NOYW1lID0gY2xzO1xuXG5cdFx0XHQkKGVsZW1lbnQpLmNzcyh7IGRpcmVjdGlvbjogXCJsdHJcIiwgcG9zaXRpb246IFwiYWJzb2x1dGVcIiwgbGVmdDogMCwgdG9wOiAwIH0pXG5cdFx0XHRcdC5hcHBlbmRUbyhjb250YWluZXIpO1xuXG5cdFx0XHQvLyBJZiBIVE1MNSBDYW52YXMgaXNuJ3QgYXZhaWxhYmxlLCBmYWxsIGJhY2sgdG8gW0V4fEZsYXNoXWNhbnZhc1xuXG5cdFx0XHRpZiAoIWVsZW1lbnQuZ2V0Q29udGV4dCkge1xuXHRcdFx0XHRpZiAod2luZG93Lkdfdm1sQ2FudmFzTWFuYWdlcikge1xuXHRcdFx0XHRcdGVsZW1lbnQgPSB3aW5kb3cuR192bWxDYW52YXNNYW5hZ2VyLmluaXRFbGVtZW50KGVsZW1lbnQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkNhbnZhcyBpcyBub3QgYXZhaWxhYmxlLiBJZiB5b3UncmUgdXNpbmcgSUUgd2l0aCBhIGZhbGwtYmFjayBzdWNoIGFzIEV4Y2FudmFzLCB0aGVuIHRoZXJlJ3MgZWl0aGVyIGEgbWlzdGFrZSBpbiB5b3VyIGNvbmRpdGlvbmFsIGluY2x1ZGUsIG9yIHRoZSBwYWdlIGhhcyBubyBET0NUWVBFIGFuZCBpcyByZW5kZXJpbmcgaW4gUXVpcmtzIE1vZGUuXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblxuXHRcdHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0ID0gZWxlbWVudC5nZXRDb250ZXh0KFwiMmRcIik7XG5cblx0XHQvLyBEZXRlcm1pbmUgdGhlIHNjcmVlbidzIHJhdGlvIG9mIHBoeXNpY2FsIHRvIGRldmljZS1pbmRlcGVuZGVudFxuXHRcdC8vIHBpeGVscy4gIFRoaXMgaXMgdGhlIHJhdGlvIGJldHdlZW4gdGhlIGNhbnZhcyB3aWR0aCB0aGF0IHRoZSBicm93c2VyXG5cdFx0Ly8gYWR2ZXJ0aXNlcyBhbmQgdGhlIG51bWJlciBvZiBwaXhlbHMgYWN0dWFsbHkgcHJlc2VudCBpbiB0aGF0IHNwYWNlLlxuXG5cdFx0Ly8gVGhlIGlQaG9uZSA0LCBmb3IgZXhhbXBsZSwgaGFzIGEgZGV2aWNlLWluZGVwZW5kZW50IHdpZHRoIG9mIDMyMHB4LFxuXHRcdC8vIGJ1dCBpdHMgc2NyZWVuIGlzIGFjdHVhbGx5IDY0MHB4IHdpZGUuICBJdCB0aGVyZWZvcmUgaGFzIGEgcGl4ZWxcblx0XHQvLyByYXRpbyBvZiAyLCB3aGlsZSBtb3N0IG5vcm1hbCBkZXZpY2VzIGhhdmUgYSByYXRpbyBvZiAxLlxuXG5cdFx0dmFyIGRldmljZVBpeGVsUmF0aW8gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxLFxuXHRcdFx0YmFja2luZ1N0b3JlUmF0aW8gPVxuXHRcdFx0XHRjb250ZXh0LndlYmtpdEJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcblx0XHRcdFx0Y29udGV4dC5tb3pCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XG5cdFx0XHRcdGNvbnRleHQubXNCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XG5cdFx0XHRcdGNvbnRleHQub0JhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcblx0XHRcdFx0Y29udGV4dC5iYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8IDE7XG5cblx0XHR0aGlzLnBpeGVsUmF0aW8gPSBkZXZpY2VQaXhlbFJhdGlvIC8gYmFja2luZ1N0b3JlUmF0aW87XG5cblx0XHQvLyBTaXplIHRoZSBjYW52YXMgdG8gbWF0Y2ggdGhlIGludGVybmFsIGRpbWVuc2lvbnMgb2YgaXRzIGNvbnRhaW5lclxuXG5cdFx0dGhpcy5yZXNpemUoY29udGFpbmVyLndpZHRoKCksIGNvbnRhaW5lci5oZWlnaHQoKSk7XG5cblx0XHQvLyBDb2xsZWN0aW9uIG9mIEhUTUwgZGl2IGxheWVycyBmb3IgdGV4dCBvdmVybGFpZCBvbnRvIHRoZSBjYW52YXNcblxuXHRcdHRoaXMudGV4dENvbnRhaW5lciA9IG51bGw7XG5cdFx0dGhpcy50ZXh0ID0ge307XG5cblx0XHQvLyBDYWNoZSBvZiB0ZXh0IGZyYWdtZW50cyBhbmQgbWV0cmljcywgc28gd2UgY2FuIGF2b2lkIGV4cGVuc2l2ZWx5XG5cdFx0Ly8gcmUtY2FsY3VsYXRpbmcgdGhlbSB3aGVuIHRoZSBwbG90IGlzIHJlLXJlbmRlcmVkIGluIGEgbG9vcC5cblxuXHRcdHRoaXMuX3RleHRDYWNoZSA9IHt9O1xuXHR9XG5cblx0Ly8gUmVzaXplcyB0aGUgY2FudmFzIHRvIHRoZSBnaXZlbiBkaW1lbnNpb25zLlxuXHQvL1xuXHQvLyBAcGFyYW0ge251bWJlcn0gd2lkdGggTmV3IHdpZHRoIG9mIHRoZSBjYW52YXMsIGluIHBpeGVscy5cblx0Ly8gQHBhcmFtIHtudW1iZXJ9IHdpZHRoIE5ldyBoZWlnaHQgb2YgdGhlIGNhbnZhcywgaW4gcGl4ZWxzLlxuXG5cdENhbnZhcy5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuXG5cdFx0aWYgKHdpZHRoIDw9IDAgfHwgaGVpZ2h0IDw9IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZGltZW5zaW9ucyBmb3IgcGxvdCwgd2lkdGggPSBcIiArIHdpZHRoICsgXCIsIGhlaWdodCA9IFwiICsgaGVpZ2h0KTtcblx0XHR9XG5cblx0XHR2YXIgZWxlbWVudCA9IHRoaXMuZWxlbWVudCxcblx0XHRcdGNvbnRleHQgPSB0aGlzLmNvbnRleHQsXG5cdFx0XHRwaXhlbFJhdGlvID0gdGhpcy5waXhlbFJhdGlvO1xuXG5cdFx0Ly8gUmVzaXplIHRoZSBjYW52YXMsIGluY3JlYXNpbmcgaXRzIGRlbnNpdHkgYmFzZWQgb24gdGhlIGRpc3BsYXknc1xuXHRcdC8vIHBpeGVsIHJhdGlvOyBiYXNpY2FsbHkgZ2l2aW5nIGl0IG1vcmUgcGl4ZWxzIHdpdGhvdXQgaW5jcmVhc2luZyB0aGVcblx0XHQvLyBzaXplIG9mIGl0cyBlbGVtZW50LCB0byB0YWtlIGFkdmFudGFnZSBvZiB0aGUgZmFjdCB0aGF0IHJldGluYVxuXHRcdC8vIGRpc3BsYXlzIGhhdmUgdGhhdCBtYW55IG1vcmUgcGl4ZWxzIGluIHRoZSBzYW1lIGFkdmVydGlzZWQgc3BhY2UuXG5cblx0XHQvLyBSZXNpemluZyBzaG91bGQgcmVzZXQgdGhlIHN0YXRlIChleGNhbnZhcyBzZWVtcyB0byBiZSBidWdneSB0aG91Z2gpXG5cblx0XHRpZiAodGhpcy53aWR0aCAhPSB3aWR0aCkge1xuXHRcdFx0ZWxlbWVudC53aWR0aCA9IHdpZHRoICogcGl4ZWxSYXRpbztcblx0XHRcdGVsZW1lbnQuc3R5bGUud2lkdGggPSB3aWR0aCArIFwicHhcIjtcblx0XHRcdHRoaXMud2lkdGggPSB3aWR0aDtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5oZWlnaHQgIT0gaGVpZ2h0KSB7XG5cdFx0XHRlbGVtZW50LmhlaWdodCA9IGhlaWdodCAqIHBpeGVsUmF0aW87XG5cdFx0XHRlbGVtZW50LnN0eWxlLmhlaWdodCA9IGhlaWdodCArIFwicHhcIjtcblx0XHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHRcdH1cblxuXHRcdC8vIFNhdmUgdGhlIGNvbnRleHQsIHNvIHdlIGNhbiByZXNldCBpbiBjYXNlIHdlIGdldCByZXBsb3R0ZWQuICBUaGVcblx0XHQvLyByZXN0b3JlIGVuc3VyZSB0aGF0IHdlJ3JlIHJlYWxseSBiYWNrIGF0IHRoZSBpbml0aWFsIHN0YXRlLCBhbmRcblx0XHQvLyBzaG91bGQgYmUgc2FmZSBldmVuIGlmIHdlIGhhdmVuJ3Qgc2F2ZWQgdGhlIGluaXRpYWwgc3RhdGUgeWV0LlxuXG5cdFx0Y29udGV4dC5yZXN0b3JlKCk7XG5cdFx0Y29udGV4dC5zYXZlKCk7XG5cblx0XHQvLyBTY2FsZSB0aGUgY29vcmRpbmF0ZSBzcGFjZSB0byBtYXRjaCB0aGUgZGlzcGxheSBkZW5zaXR5OyBzbyBldmVuIHRob3VnaCB3ZVxuXHRcdC8vIG1heSBoYXZlIHR3aWNlIGFzIG1hbnkgcGl4ZWxzLCB3ZSBzdGlsbCB3YW50IGxpbmVzIGFuZCBvdGhlciBkcmF3aW5nIHRvXG5cdFx0Ly8gYXBwZWFyIGF0IHRoZSBzYW1lIHNpemU7IHRoZSBleHRyYSBwaXhlbHMgd2lsbCBqdXN0IG1ha2UgdGhlbSBjcmlzcGVyLlxuXG5cdFx0Y29udGV4dC5zY2FsZShwaXhlbFJhdGlvLCBwaXhlbFJhdGlvKTtcblx0fTtcblxuXHQvLyBDbGVhcnMgdGhlIGVudGlyZSBjYW52YXMgYXJlYSwgbm90IGluY2x1ZGluZyBhbnkgb3ZlcmxhaWQgSFRNTCB0ZXh0XG5cblx0Q2FudmFzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXHR9O1xuXG5cdC8vIEZpbmlzaGVzIHJlbmRlcmluZyB0aGUgY2FudmFzLCBpbmNsdWRpbmcgbWFuYWdpbmcgdGhlIHRleHQgb3ZlcmxheS5cblxuXHRDYW52YXMucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyIGNhY2hlID0gdGhpcy5fdGV4dENhY2hlO1xuXG5cdFx0Ly8gRm9yIGVhY2ggdGV4dCBsYXllciwgYWRkIGVsZW1lbnRzIG1hcmtlZCBhcyBhY3RpdmUgdGhhdCBoYXZlbid0XG5cdFx0Ly8gYWxyZWFkeSBiZWVuIHJlbmRlcmVkLCBhbmQgcmVtb3ZlIHRob3NlIHRoYXQgYXJlIG5vIGxvbmdlciBhY3RpdmUuXG5cblx0XHRmb3IgKHZhciBsYXllcktleSBpbiBjYWNoZSkge1xuXHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoY2FjaGUsIGxheWVyS2V5KSkge1xuXG5cdFx0XHRcdHZhciBsYXllciA9IHRoaXMuZ2V0VGV4dExheWVyKGxheWVyS2V5KSxcblx0XHRcdFx0XHRsYXllckNhY2hlID0gY2FjaGVbbGF5ZXJLZXldO1xuXG5cdFx0XHRcdGxheWVyLmhpZGUoKTtcblxuXHRcdFx0XHRmb3IgKHZhciBzdHlsZUtleSBpbiBsYXllckNhY2hlKSB7XG5cdFx0XHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwobGF5ZXJDYWNoZSwgc3R5bGVLZXkpKSB7XG5cdFx0XHRcdFx0XHR2YXIgc3R5bGVDYWNoZSA9IGxheWVyQ2FjaGVbc3R5bGVLZXldO1xuXHRcdFx0XHRcdFx0Zm9yICh2YXIga2V5IGluIHN0eWxlQ2FjaGUpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoc3R5bGVDYWNoZSwga2V5KSkge1xuXG5cdFx0XHRcdFx0XHRcdFx0dmFyIHBvc2l0aW9ucyA9IHN0eWxlQ2FjaGVba2V5XS5wb3NpdGlvbnM7XG5cblx0XHRcdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgcG9zaXRpb247IHBvc2l0aW9uID0gcG9zaXRpb25zW2ldOyBpKyspIHtcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChwb3NpdGlvbi5hY3RpdmUpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKCFwb3NpdGlvbi5yZW5kZXJlZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxheWVyLmFwcGVuZChwb3NpdGlvbi5lbGVtZW50KTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRwb3NpdGlvbi5yZW5kZXJlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHBvc2l0aW9ucy5zcGxpY2UoaS0tLCAxKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHBvc2l0aW9uLnJlbmRlcmVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cG9zaXRpb24uZWxlbWVudC5kZXRhY2goKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGlmIChwb3NpdGlvbnMubGVuZ3RoID09IDApIHtcblx0XHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSBzdHlsZUNhY2hlW2tleV07XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGF5ZXIuc2hvdygpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHQvLyBDcmVhdGVzIChpZiBuZWNlc3NhcnkpIGFuZCByZXR1cm5zIHRoZSB0ZXh0IG92ZXJsYXkgY29udGFpbmVyLlxuXHQvL1xuXHQvLyBAcGFyYW0ge3N0cmluZ30gY2xhc3NlcyBTdHJpbmcgb2Ygc3BhY2Utc2VwYXJhdGVkIENTUyBjbGFzc2VzIHVzZWQgdG9cblx0Ly8gICAgIHVuaXF1ZWx5IGlkZW50aWZ5IHRoZSB0ZXh0IGxheWVyLlxuXHQvLyBAcmV0dXJuIHtvYmplY3R9IFRoZSBqUXVlcnktd3JhcHBlZCB0ZXh0LWxheWVyIGRpdi5cblxuXHRDYW52YXMucHJvdG90eXBlLmdldFRleHRMYXllciA9IGZ1bmN0aW9uKGNsYXNzZXMpIHtcblxuXHRcdHZhciBsYXllciA9IHRoaXMudGV4dFtjbGFzc2VzXTtcblxuXHRcdC8vIENyZWF0ZSB0aGUgdGV4dCBsYXllciBpZiBpdCBkb2Vzbid0IGV4aXN0XG5cblx0XHRpZiAobGF5ZXIgPT0gbnVsbCkge1xuXG5cdFx0XHQvLyBDcmVhdGUgdGhlIHRleHQgbGF5ZXIgY29udGFpbmVyLCBpZiBpdCBkb2Vzbid0IGV4aXN0XG5cblx0XHRcdGlmICh0aGlzLnRleHRDb250YWluZXIgPT0gbnVsbCkge1xuXHRcdFx0XHR0aGlzLnRleHRDb250YWluZXIgPSAkKFwiPGRpdiBjbGFzcz0nZmxvdC10ZXh0Jz48L2Rpdj5cIilcblx0XHRcdFx0XHQuY3NzKHtcblx0XHRcdFx0XHRcdHBvc2l0aW9uOiBcImFic29sdXRlXCIsXG5cdFx0XHRcdFx0XHR0b3A6IDAsXG5cdFx0XHRcdFx0XHRsZWZ0OiAwLFxuXHRcdFx0XHRcdFx0Ym90dG9tOiAwLFxuXHRcdFx0XHRcdFx0cmlnaHQ6IDAsXG5cdFx0XHRcdFx0XHQnZm9udC1zaXplJzogXCJzbWFsbGVyXCIsXG5cdFx0XHRcdFx0XHRjb2xvcjogXCIjNTQ1NDU0XCJcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5pbnNlcnRBZnRlcih0aGlzLmVsZW1lbnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRsYXllciA9IHRoaXMudGV4dFtjbGFzc2VzXSA9ICQoXCI8ZGl2PjwvZGl2PlwiKVxuXHRcdFx0XHQuYWRkQ2xhc3MoY2xhc3Nlcylcblx0XHRcdFx0LmNzcyh7XG5cdFx0XHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdFx0XHR0b3A6IDAsXG5cdFx0XHRcdFx0bGVmdDogMCxcblx0XHRcdFx0XHRib3R0b206IDAsXG5cdFx0XHRcdFx0cmlnaHQ6IDBcblx0XHRcdFx0fSlcblx0XHRcdFx0LmFwcGVuZFRvKHRoaXMudGV4dENvbnRhaW5lcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGxheWVyO1xuXHR9O1xuXG5cdC8vIENyZWF0ZXMgKGlmIG5lY2Vzc2FyeSkgYW5kIHJldHVybnMgYSB0ZXh0IGluZm8gb2JqZWN0LlxuXHQvL1xuXHQvLyBUaGUgb2JqZWN0IGxvb2tzIGxpa2UgdGhpczpcblx0Ly9cblx0Ly8ge1xuXHQvLyAgICAgd2lkdGg6IFdpZHRoIG9mIHRoZSB0ZXh0J3Mgd3JhcHBlciBkaXYuXG5cdC8vICAgICBoZWlnaHQ6IEhlaWdodCBvZiB0aGUgdGV4dCdzIHdyYXBwZXIgZGl2LlxuXHQvLyAgICAgZWxlbWVudDogVGhlIGpRdWVyeS13cmFwcGVkIEhUTUwgZGl2IGNvbnRhaW5pbmcgdGhlIHRleHQuXG5cdC8vICAgICBwb3NpdGlvbnM6IEFycmF5IG9mIHBvc2l0aW9ucyBhdCB3aGljaCB0aGlzIHRleHQgaXMgZHJhd24uXG5cdC8vIH1cblx0Ly9cblx0Ly8gVGhlIHBvc2l0aW9ucyBhcnJheSBjb250YWlucyBvYmplY3RzIHRoYXQgbG9vayBsaWtlIHRoaXM6XG5cdC8vXG5cdC8vIHtcblx0Ly8gICAgIGFjdGl2ZTogRmxhZyBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHRleHQgc2hvdWxkIGJlIHZpc2libGUuXG5cdC8vICAgICByZW5kZXJlZDogRmxhZyBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHRleHQgaXMgY3VycmVudGx5IHZpc2libGUuXG5cdC8vICAgICBlbGVtZW50OiBUaGUgalF1ZXJ5LXdyYXBwZWQgSFRNTCBkaXYgY29udGFpbmluZyB0aGUgdGV4dC5cblx0Ly8gICAgIHg6IFggY29vcmRpbmF0ZSBhdCB3aGljaCB0byBkcmF3IHRoZSB0ZXh0LlxuXHQvLyAgICAgeTogWSBjb29yZGluYXRlIGF0IHdoaWNoIHRvIGRyYXcgdGhlIHRleHQuXG5cdC8vIH1cblx0Ly9cblx0Ly8gRWFjaCBwb3NpdGlvbiBhZnRlciB0aGUgZmlyc3QgcmVjZWl2ZXMgYSBjbG9uZSBvZiB0aGUgb3JpZ2luYWwgZWxlbWVudC5cblx0Ly9cblx0Ly8gVGhlIGlkZWEgaXMgdGhhdCB0aGF0IHRoZSB3aWR0aCwgaGVpZ2h0LCBhbmQgZ2VuZXJhbCAnaWRlbnRpdHknIG9mIHRoZVxuXHQvLyB0ZXh0IGlzIGNvbnN0YW50IG5vIG1hdHRlciB3aGVyZSBpdCBpcyBwbGFjZWQ7IHRoZSBwbGFjZW1lbnRzIGFyZSBhXG5cdC8vIHNlY29uZGFyeSBwcm9wZXJ0eS5cblx0Ly9cblx0Ly8gQ2FudmFzIG1haW50YWlucyBhIGNhY2hlIG9mIHJlY2VudGx5LXVzZWQgdGV4dCBpbmZvIG9iamVjdHM7IGdldFRleHRJbmZvXG5cdC8vIGVpdGhlciByZXR1cm5zIHRoZSBjYWNoZWQgZWxlbWVudCBvciBjcmVhdGVzIGEgbmV3IGVudHJ5LlxuXHQvL1xuXHQvLyBAcGFyYW0ge3N0cmluZ30gbGF5ZXIgQSBzdHJpbmcgb2Ygc3BhY2Utc2VwYXJhdGVkIENTUyBjbGFzc2VzIHVuaXF1ZWx5XG5cdC8vICAgICBpZGVudGlmeWluZyB0aGUgbGF5ZXIgY29udGFpbmluZyB0aGlzIHRleHQuXG5cdC8vIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRleHQgc3RyaW5nIHRvIHJldHJpZXZlIGluZm8gZm9yLlxuXHQvLyBAcGFyYW0geyhzdHJpbmd8b2JqZWN0KT19IGZvbnQgRWl0aGVyIGEgc3RyaW5nIG9mIHNwYWNlLXNlcGFyYXRlZCBDU1Ncblx0Ly8gICAgIGNsYXNzZXMgb3IgYSBmb250LXNwZWMgb2JqZWN0LCBkZWZpbmluZyB0aGUgdGV4dCdzIGZvbnQgYW5kIHN0eWxlLlxuXHQvLyBAcGFyYW0ge251bWJlcj19IGFuZ2xlIEFuZ2xlIGF0IHdoaWNoIHRvIHJvdGF0ZSB0aGUgdGV4dCwgaW4gZGVncmVlcy5cblx0Ly8gICAgIEFuZ2xlIGlzIGN1cnJlbnRseSB1bnVzZWQsIGl0IHdpbGwgYmUgaW1wbGVtZW50ZWQgaW4gdGhlIGZ1dHVyZS5cblx0Ly8gQHBhcmFtIHtudW1iZXI9fSB3aWR0aCBNYXhpbXVtIHdpZHRoIG9mIHRoZSB0ZXh0IGJlZm9yZSBpdCB3cmFwcy5cblx0Ly8gQHJldHVybiB7b2JqZWN0fSBhIHRleHQgaW5mbyBvYmplY3QuXG5cblx0Q2FudmFzLnByb3RvdHlwZS5nZXRUZXh0SW5mbyA9IGZ1bmN0aW9uKGxheWVyLCB0ZXh0LCBmb250LCBhbmdsZSwgd2lkdGgpIHtcblxuXHRcdHZhciB0ZXh0U3R5bGUsIGxheWVyQ2FjaGUsIHN0eWxlQ2FjaGUsIGluZm87XG5cblx0XHQvLyBDYXN0IHRoZSB2YWx1ZSB0byBhIHN0cmluZywgaW4gY2FzZSB3ZSB3ZXJlIGdpdmVuIGEgbnVtYmVyIG9yIHN1Y2hcblxuXHRcdHRleHQgPSBcIlwiICsgdGV4dDtcblxuXHRcdC8vIElmIHRoZSBmb250IGlzIGEgZm9udC1zcGVjIG9iamVjdCwgZ2VuZXJhdGUgYSBDU1MgZm9udCBkZWZpbml0aW9uXG5cblx0XHRpZiAodHlwZW9mIGZvbnQgPT09IFwib2JqZWN0XCIpIHtcblx0XHRcdHRleHRTdHlsZSA9IGZvbnQuc3R5bGUgKyBcIiBcIiArIGZvbnQudmFyaWFudCArIFwiIFwiICsgZm9udC53ZWlnaHQgKyBcIiBcIiArIGZvbnQuc2l6ZSArIFwicHgvXCIgKyBmb250LmxpbmVIZWlnaHQgKyBcInB4IFwiICsgZm9udC5mYW1pbHk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRleHRTdHlsZSA9IGZvbnQ7XG5cdFx0fVxuXG5cdFx0Ly8gUmV0cmlldmUgKG9yIGNyZWF0ZSkgdGhlIGNhY2hlIGZvciB0aGUgdGV4dCdzIGxheWVyIGFuZCBzdHlsZXNcblxuXHRcdGxheWVyQ2FjaGUgPSB0aGlzLl90ZXh0Q2FjaGVbbGF5ZXJdO1xuXG5cdFx0aWYgKGxheWVyQ2FjaGUgPT0gbnVsbCkge1xuXHRcdFx0bGF5ZXJDYWNoZSA9IHRoaXMuX3RleHRDYWNoZVtsYXllcl0gPSB7fTtcblx0XHR9XG5cblx0XHRzdHlsZUNhY2hlID0gbGF5ZXJDYWNoZVt0ZXh0U3R5bGVdO1xuXG5cdFx0aWYgKHN0eWxlQ2FjaGUgPT0gbnVsbCkge1xuXHRcdFx0c3R5bGVDYWNoZSA9IGxheWVyQ2FjaGVbdGV4dFN0eWxlXSA9IHt9O1xuXHRcdH1cblxuXHRcdGluZm8gPSBzdHlsZUNhY2hlW3RleHRdO1xuXG5cdFx0Ly8gSWYgd2UgY2FuJ3QgZmluZCBhIG1hdGNoaW5nIGVsZW1lbnQgaW4gb3VyIGNhY2hlLCBjcmVhdGUgYSBuZXcgb25lXG5cblx0XHRpZiAoaW5mbyA9PSBudWxsKSB7XG5cblx0XHRcdHZhciBlbGVtZW50ID0gJChcIjxkaXY+PC9kaXY+XCIpLmh0bWwodGV4dClcblx0XHRcdFx0LmNzcyh7XG5cdFx0XHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdFx0XHQnbWF4LXdpZHRoJzogd2lkdGgsXG5cdFx0XHRcdFx0dG9wOiAtOTk5OVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQuYXBwZW5kVG8odGhpcy5nZXRUZXh0TGF5ZXIobGF5ZXIpKTtcblxuXHRcdFx0aWYgKHR5cGVvZiBmb250ID09PSBcIm9iamVjdFwiKSB7XG5cdFx0XHRcdGVsZW1lbnQuY3NzKHtcblx0XHRcdFx0XHRmb250OiB0ZXh0U3R5bGUsXG5cdFx0XHRcdFx0Y29sb3I6IGZvbnQuY29sb3Jcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBmb250ID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoZm9udCk7XG5cdFx0XHR9XG5cblx0XHRcdGluZm8gPSBzdHlsZUNhY2hlW3RleHRdID0ge1xuXHRcdFx0XHR3aWR0aDogZWxlbWVudC5vdXRlcldpZHRoKHRydWUpLFxuXHRcdFx0XHRoZWlnaHQ6IGVsZW1lbnQub3V0ZXJIZWlnaHQodHJ1ZSksXG5cdFx0XHRcdGVsZW1lbnQ6IGVsZW1lbnQsXG5cdFx0XHRcdHBvc2l0aW9uczogW11cblx0XHRcdH07XG5cblx0XHRcdGVsZW1lbnQuZGV0YWNoKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGluZm87XG5cdH07XG5cblx0Ly8gQWRkcyBhIHRleHQgc3RyaW5nIHRvIHRoZSBjYW52YXMgdGV4dCBvdmVybGF5LlxuXHQvL1xuXHQvLyBUaGUgdGV4dCBpc24ndCBkcmF3biBpbW1lZGlhdGVseTsgaXQgaXMgbWFya2VkIGFzIHJlbmRlcmluZywgd2hpY2ggd2lsbFxuXHQvLyByZXN1bHQgaW4gaXRzIGFkZGl0aW9uIHRvIHRoZSBjYW52YXMgb24gdGhlIG5leHQgcmVuZGVyIHBhc3MuXG5cdC8vXG5cdC8vIEBwYXJhbSB7c3RyaW5nfSBsYXllciBBIHN0cmluZyBvZiBzcGFjZS1zZXBhcmF0ZWQgQ1NTIGNsYXNzZXMgdW5pcXVlbHlcblx0Ly8gICAgIGlkZW50aWZ5aW5nIHRoZSBsYXllciBjb250YWluaW5nIHRoaXMgdGV4dC5cblx0Ly8gQHBhcmFtIHtudW1iZXJ9IHggWCBjb29yZGluYXRlIGF0IHdoaWNoIHRvIGRyYXcgdGhlIHRleHQuXG5cdC8vIEBwYXJhbSB7bnVtYmVyfSB5IFkgY29vcmRpbmF0ZSBhdCB3aGljaCB0byBkcmF3IHRoZSB0ZXh0LlxuXHQvLyBAcGFyYW0ge3N0cmluZ30gdGV4dCBUZXh0IHN0cmluZyB0byBkcmF3LlxuXHQvLyBAcGFyYW0geyhzdHJpbmd8b2JqZWN0KT19IGZvbnQgRWl0aGVyIGEgc3RyaW5nIG9mIHNwYWNlLXNlcGFyYXRlZCBDU1Ncblx0Ly8gICAgIGNsYXNzZXMgb3IgYSBmb250LXNwZWMgb2JqZWN0LCBkZWZpbmluZyB0aGUgdGV4dCdzIGZvbnQgYW5kIHN0eWxlLlxuXHQvLyBAcGFyYW0ge251bWJlcj19IGFuZ2xlIEFuZ2xlIGF0IHdoaWNoIHRvIHJvdGF0ZSB0aGUgdGV4dCwgaW4gZGVncmVlcy5cblx0Ly8gICAgIEFuZ2xlIGlzIGN1cnJlbnRseSB1bnVzZWQsIGl0IHdpbGwgYmUgaW1wbGVtZW50ZWQgaW4gdGhlIGZ1dHVyZS5cblx0Ly8gQHBhcmFtIHtudW1iZXI9fSB3aWR0aCBNYXhpbXVtIHdpZHRoIG9mIHRoZSB0ZXh0IGJlZm9yZSBpdCB3cmFwcy5cblx0Ly8gQHBhcmFtIHtzdHJpbmc9fSBoYWxpZ24gSG9yaXpvbnRhbCBhbGlnbm1lbnQgb2YgdGhlIHRleHQ7IGVpdGhlciBcImxlZnRcIixcblx0Ly8gICAgIFwiY2VudGVyXCIgb3IgXCJyaWdodFwiLlxuXHQvLyBAcGFyYW0ge3N0cmluZz19IHZhbGlnbiBWZXJ0aWNhbCBhbGlnbm1lbnQgb2YgdGhlIHRleHQ7IGVpdGhlciBcInRvcFwiLFxuXHQvLyAgICAgXCJtaWRkbGVcIiBvciBcImJvdHRvbVwiLlxuXG5cdENhbnZhcy5wcm90b3R5cGUuYWRkVGV4dCA9IGZ1bmN0aW9uKGxheWVyLCB4LCB5LCB0ZXh0LCBmb250LCBhbmdsZSwgd2lkdGgsIGhhbGlnbiwgdmFsaWduKSB7XG5cblx0XHR2YXIgaW5mbyA9IHRoaXMuZ2V0VGV4dEluZm8obGF5ZXIsIHRleHQsIGZvbnQsIGFuZ2xlLCB3aWR0aCksXG5cdFx0XHRwb3NpdGlvbnMgPSBpbmZvLnBvc2l0aW9ucztcblxuXHRcdC8vIFR3ZWFrIHRoZSBkaXYncyBwb3NpdGlvbiB0byBtYXRjaCB0aGUgdGV4dCdzIGFsaWdubWVudFxuXG5cdFx0aWYgKGhhbGlnbiA9PSBcImNlbnRlclwiKSB7XG5cdFx0XHR4IC09IGluZm8ud2lkdGggLyAyO1xuXHRcdH0gZWxzZSBpZiAoaGFsaWduID09IFwicmlnaHRcIikge1xuXHRcdFx0eCAtPSBpbmZvLndpZHRoO1xuXHRcdH1cblxuXHRcdGlmICh2YWxpZ24gPT0gXCJtaWRkbGVcIikge1xuXHRcdFx0eSAtPSBpbmZvLmhlaWdodCAvIDI7XG5cdFx0fSBlbHNlIGlmICh2YWxpZ24gPT0gXCJib3R0b21cIikge1xuXHRcdFx0eSAtPSBpbmZvLmhlaWdodDtcblx0XHR9XG5cblx0XHQvLyBEZXRlcm1pbmUgd2hldGhlciB0aGlzIHRleHQgYWxyZWFkeSBleGlzdHMgYXQgdGhpcyBwb3NpdGlvbi5cblx0XHQvLyBJZiBzbywgbWFyayBpdCBmb3IgaW5jbHVzaW9uIGluIHRoZSBuZXh0IHJlbmRlciBwYXNzLlxuXG5cdFx0Zm9yICh2YXIgaSA9IDAsIHBvc2l0aW9uOyBwb3NpdGlvbiA9IHBvc2l0aW9uc1tpXTsgaSsrKSB7XG5cdFx0XHRpZiAocG9zaXRpb24ueCA9PSB4ICYmIHBvc2l0aW9uLnkgPT0geSkge1xuXHRcdFx0XHRwb3NpdGlvbi5hY3RpdmUgPSB0cnVlO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIHRleHQgZG9lc24ndCBleGlzdCBhdCB0aGlzIHBvc2l0aW9uLCBjcmVhdGUgYSBuZXcgZW50cnlcblxuXHRcdC8vIEZvciB0aGUgdmVyeSBmaXJzdCBwb3NpdGlvbiB3ZSdsbCByZS11c2UgdGhlIG9yaWdpbmFsIGVsZW1lbnQsXG5cdFx0Ly8gd2hpbGUgZm9yIHN1YnNlcXVlbnQgb25lcyB3ZSdsbCBjbG9uZSBpdC5cblxuXHRcdHBvc2l0aW9uID0ge1xuXHRcdFx0YWN0aXZlOiB0cnVlLFxuXHRcdFx0cmVuZGVyZWQ6IGZhbHNlLFxuXHRcdFx0ZWxlbWVudDogcG9zaXRpb25zLmxlbmd0aCA/IGluZm8uZWxlbWVudC5jbG9uZSgpIDogaW5mby5lbGVtZW50LFxuXHRcdFx0eDogeCxcblx0XHRcdHk6IHlcblx0XHR9O1xuXG5cdFx0cG9zaXRpb25zLnB1c2gocG9zaXRpb24pO1xuXG5cdFx0Ly8gTW92ZSB0aGUgZWxlbWVudCB0byBpdHMgZmluYWwgcG9zaXRpb24gd2l0aGluIHRoZSBjb250YWluZXJcblxuXHRcdHBvc2l0aW9uLmVsZW1lbnQuY3NzKHtcblx0XHRcdHRvcDogTWF0aC5yb3VuZCh5KSxcblx0XHRcdGxlZnQ6IE1hdGgucm91bmQoeCksXG5cdFx0XHQndGV4dC1hbGlnbic6IGhhbGlnblx0Ly8gSW4gY2FzZSB0aGUgdGV4dCB3cmFwc1xuXHRcdH0pO1xuXHR9O1xuXG5cdC8vIFJlbW92ZXMgb25lIG9yIG1vcmUgdGV4dCBzdHJpbmdzIGZyb20gdGhlIGNhbnZhcyB0ZXh0IG92ZXJsYXkuXG5cdC8vXG5cdC8vIElmIG5vIHBhcmFtZXRlcnMgYXJlIGdpdmVuLCBhbGwgdGV4dCB3aXRoaW4gdGhlIGxheWVyIGlzIHJlbW92ZWQuXG5cdC8vXG5cdC8vIE5vdGUgdGhhdCB0aGUgdGV4dCBpcyBub3QgaW1tZWRpYXRlbHkgcmVtb3ZlZDsgaXQgaXMgc2ltcGx5IG1hcmtlZCBhc1xuXHQvLyBpbmFjdGl2ZSwgd2hpY2ggd2lsbCByZXN1bHQgaW4gaXRzIHJlbW92YWwgb24gdGhlIG5leHQgcmVuZGVyIHBhc3MuXG5cdC8vIFRoaXMgYXZvaWRzIHRoZSBwZXJmb3JtYW5jZSBwZW5hbHR5IGZvciAnY2xlYXIgYW5kIHJlZHJhdycgYmVoYXZpb3IsXG5cdC8vIHdoZXJlIHdlIHBvdGVudGlhbGx5IGdldCByaWQgb2YgYWxsIHRleHQgb24gYSBsYXllciwgYnV0IHdpbGwgbGlrZWx5XG5cdC8vIGFkZCBiYWNrIG1vc3Qgb3IgYWxsIG9mIGl0IGxhdGVyLCBhcyB3aGVuIHJlZHJhd2luZyBheGVzLCBmb3IgZXhhbXBsZS5cblx0Ly9cblx0Ly8gQHBhcmFtIHtzdHJpbmd9IGxheWVyIEEgc3RyaW5nIG9mIHNwYWNlLXNlcGFyYXRlZCBDU1MgY2xhc3NlcyB1bmlxdWVseVxuXHQvLyAgICAgaWRlbnRpZnlpbmcgdGhlIGxheWVyIGNvbnRhaW5pbmcgdGhpcyB0ZXh0LlxuXHQvLyBAcGFyYW0ge251bWJlcj19IHggWCBjb29yZGluYXRlIG9mIHRoZSB0ZXh0LlxuXHQvLyBAcGFyYW0ge251bWJlcj19IHkgWSBjb29yZGluYXRlIG9mIHRoZSB0ZXh0LlxuXHQvLyBAcGFyYW0ge3N0cmluZz19IHRleHQgVGV4dCBzdHJpbmcgdG8gcmVtb3ZlLlxuXHQvLyBAcGFyYW0geyhzdHJpbmd8b2JqZWN0KT19IGZvbnQgRWl0aGVyIGEgc3RyaW5nIG9mIHNwYWNlLXNlcGFyYXRlZCBDU1Ncblx0Ly8gICAgIGNsYXNzZXMgb3IgYSBmb250LXNwZWMgb2JqZWN0LCBkZWZpbmluZyB0aGUgdGV4dCdzIGZvbnQgYW5kIHN0eWxlLlxuXHQvLyBAcGFyYW0ge251bWJlcj19IGFuZ2xlIEFuZ2xlIGF0IHdoaWNoIHRoZSB0ZXh0IGlzIHJvdGF0ZWQsIGluIGRlZ3JlZXMuXG5cdC8vICAgICBBbmdsZSBpcyBjdXJyZW50bHkgdW51c2VkLCBpdCB3aWxsIGJlIGltcGxlbWVudGVkIGluIHRoZSBmdXR1cmUuXG5cblx0Q2FudmFzLnByb3RvdHlwZS5yZW1vdmVUZXh0ID0gZnVuY3Rpb24obGF5ZXIsIHgsIHksIHRleHQsIGZvbnQsIGFuZ2xlKSB7XG5cdFx0aWYgKHRleHQgPT0gbnVsbCkge1xuXHRcdFx0dmFyIGxheWVyQ2FjaGUgPSB0aGlzLl90ZXh0Q2FjaGVbbGF5ZXJdO1xuXHRcdFx0aWYgKGxheWVyQ2FjaGUgIT0gbnVsbCkge1xuXHRcdFx0XHRmb3IgKHZhciBzdHlsZUtleSBpbiBsYXllckNhY2hlKSB7XG5cdFx0XHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwobGF5ZXJDYWNoZSwgc3R5bGVLZXkpKSB7XG5cdFx0XHRcdFx0XHR2YXIgc3R5bGVDYWNoZSA9IGxheWVyQ2FjaGVbc3R5bGVLZXldO1xuXHRcdFx0XHRcdFx0Zm9yICh2YXIga2V5IGluIHN0eWxlQ2FjaGUpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoc3R5bGVDYWNoZSwga2V5KSkge1xuXHRcdFx0XHRcdFx0XHRcdHZhciBwb3NpdGlvbnMgPSBzdHlsZUNhY2hlW2tleV0ucG9zaXRpb25zO1xuXHRcdFx0XHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBwb3NpdGlvbjsgcG9zaXRpb24gPSBwb3NpdGlvbnNbaV07IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0cG9zaXRpb24uYWN0aXZlID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBwb3NpdGlvbnMgPSB0aGlzLmdldFRleHRJbmZvKGxheWVyLCB0ZXh0LCBmb250LCBhbmdsZSkucG9zaXRpb25zO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIHBvc2l0aW9uOyBwb3NpdGlvbiA9IHBvc2l0aW9uc1tpXTsgaSsrKSB7XG5cdFx0XHRcdGlmIChwb3NpdGlvbi54ID09IHggJiYgcG9zaXRpb24ueSA9PSB5KSB7XG5cdFx0XHRcdFx0cG9zaXRpb24uYWN0aXZlID0gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0Ly8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cdC8vIFRoZSB0b3AtbGV2ZWwgY29udGFpbmVyIGZvciB0aGUgZW50aXJlIHBsb3QuXG5cbiAgICBmdW5jdGlvbiBQbG90KHBsYWNlaG9sZGVyLCBkYXRhXywgb3B0aW9uc18sIHBsdWdpbnMpIHtcbiAgICAgICAgLy8gZGF0YSBpcyBvbiB0aGUgZm9ybTpcbiAgICAgICAgLy8gICBbIHNlcmllczEsIHNlcmllczIgLi4uIF1cbiAgICAgICAgLy8gd2hlcmUgc2VyaWVzIGlzIGVpdGhlciBqdXN0IHRoZSBkYXRhIGFzIFsgW3gxLCB5MV0sIFt4MiwgeTJdLCAuLi4gXVxuICAgICAgICAvLyBvciB7IGRhdGE6IFsgW3gxLCB5MV0sIFt4MiwgeTJdLCAuLi4gXSwgbGFiZWw6IFwic29tZSBsYWJlbFwiLCAuLi4gfVxuXG4gICAgICAgIHZhciBzZXJpZXMgPSBbXSxcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbG9yIHRoZW1lIHVzZWQgZm9yIGdyYXBoc1xuICAgICAgICAgICAgICAgIGNvbG9yczogW1wiI2VkYzI0MFwiLCBcIiNhZmQ4ZjhcIiwgXCIjY2I0YjRiXCIsIFwiIzRkYTc0ZFwiLCBcIiM5NDQwZWRcIl0sXG4gICAgICAgICAgICAgICAgbGVnZW5kOiB7XG4gICAgICAgICAgICAgICAgICAgIHNob3c6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG5vQ29sdW1uczogMSwgLy8gbnVtYmVyIG9mIGNvbHVtcyBpbiBsZWdlbmQgdGFibGVcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxGb3JtYXR0ZXI6IG51bGwsIC8vIGZuOiBzdHJpbmcgLT4gc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsQm94Qm9yZGVyQ29sb3I6IFwiI2NjY1wiLCAvLyBib3JkZXIgY29sb3IgZm9yIHRoZSBsaXR0bGUgbGFiZWwgYm94ZXNcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiBudWxsLCAvLyBjb250YWluZXIgKGFzIGpRdWVyeSBvYmplY3QpIHRvIHB1dCBsZWdlbmQgaW4sIG51bGwgbWVhbnMgZGVmYXVsdCBvbiB0b3Agb2YgZ3JhcGhcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IFwibmVcIiwgLy8gcG9zaXRpb24gb2YgZGVmYXVsdCBsZWdlbmQgY29udGFpbmVyIHdpdGhpbiBwbG90XG4gICAgICAgICAgICAgICAgICAgIG1hcmdpbjogNSwgLy8gZGlzdGFuY2UgZnJvbSBncmlkIGVkZ2UgdG8gZGVmYXVsdCBsZWdlbmQgY29udGFpbmVyIHdpdGhpbiBwbG90XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogbnVsbCwgLy8gbnVsbCBtZWFucyBhdXRvLWRldGVjdFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kT3BhY2l0eTogMC44NSwgLy8gc2V0IHRvIDAgdG8gYXZvaWQgYmFja2dyb3VuZFxuICAgICAgICAgICAgICAgICAgICBzb3J0ZWQ6IG51bGwgICAgLy8gZGVmYXVsdCB0byBubyBsZWdlbmQgc29ydGluZ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgeGF4aXM6IHtcbiAgICAgICAgICAgICAgICAgICAgc2hvdzogbnVsbCwgLy8gbnVsbCA9IGF1dG8tZGV0ZWN0LCB0cnVlID0gYWx3YXlzLCBmYWxzZSA9IG5ldmVyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBcImJvdHRvbVwiLCAvLyBvciBcInRvcFwiXG4gICAgICAgICAgICAgICAgICAgIG1vZGU6IG51bGwsIC8vIG51bGwgb3IgXCJ0aW1lXCJcbiAgICAgICAgICAgICAgICAgICAgZm9udDogbnVsbCwgLy8gbnVsbCAoZGVyaXZlZCBmcm9tIENTUyBpbiBwbGFjZWhvbGRlcikgb3Igb2JqZWN0IGxpa2UgeyBzaXplOiAxMSwgbGluZUhlaWdodDogMTMsIHN0eWxlOiBcIml0YWxpY1wiLCB3ZWlnaHQ6IFwiYm9sZFwiLCBmYW1pbHk6IFwic2Fucy1zZXJpZlwiLCB2YXJpYW50OiBcInNtYWxsLWNhcHNcIiB9XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiBudWxsLCAvLyBiYXNlIGNvbG9yLCBsYWJlbHMsIHRpY2tzXG4gICAgICAgICAgICAgICAgICAgIHRpY2tDb2xvcjogbnVsbCwgLy8gcG9zc2libHkgZGlmZmVyZW50IGNvbG9yIG9mIHRpY2tzLCBlLmcuIFwicmdiYSgwLDAsMCwwLjE1KVwiXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogbnVsbCwgLy8gbnVsbCBvciBmOiBudW1iZXIgLT4gbnVtYmVyIHRvIHRyYW5zZm9ybSBheGlzXG4gICAgICAgICAgICAgICAgICAgIGludmVyc2VUcmFuc2Zvcm06IG51bGwsIC8vIGlmIHRyYW5zZm9ybSBpcyBzZXQsIHRoaXMgc2hvdWxkIGJlIHRoZSBpbnZlcnNlIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIG1pbjogbnVsbCwgLy8gbWluLiB2YWx1ZSB0byBzaG93LCBudWxsIG1lYW5zIHNldCBhdXRvbWF0aWNhbGx5XG4gICAgICAgICAgICAgICAgICAgIG1heDogbnVsbCwgLy8gbWF4LiB2YWx1ZSB0byBzaG93LCBudWxsIG1lYW5zIHNldCBhdXRvbWF0aWNhbGx5XG4gICAgICAgICAgICAgICAgICAgIGF1dG9zY2FsZU1hcmdpbjogbnVsbCwgLy8gbWFyZ2luIGluICUgdG8gYWRkIGlmIGF1dG8tc2V0dGluZyBtaW4vbWF4XG4gICAgICAgICAgICAgICAgICAgIHRpY2tzOiBudWxsLCAvLyBlaXRoZXIgWzEsIDNdIG9yIFtbMSwgXCJhXCJdLCAzXSBvciAoZm46IGF4aXMgaW5mbyAtPiB0aWNrcykgb3IgYXBwLiBudW1iZXIgb2YgdGlja3MgZm9yIGF1dG8tdGlja3NcbiAgICAgICAgICAgICAgICAgICAgdGlja0Zvcm1hdHRlcjogbnVsbCwgLy8gZm46IG51bWJlciAtPiBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxXaWR0aDogbnVsbCwgLy8gc2l6ZSBvZiB0aWNrIGxhYmVscyBpbiBwaXhlbHNcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxIZWlnaHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIHJlc2VydmVTcGFjZTogbnVsbCwgLy8gd2hldGhlciB0byByZXNlcnZlIHNwYWNlIGV2ZW4gaWYgYXhpcyBpc24ndCBzaG93blxuICAgICAgICAgICAgICAgICAgICB0aWNrTGVuZ3RoOiBudWxsLCAvLyBzaXplIGluIHBpeGVscyBvZiB0aWNrcywgb3IgXCJmdWxsXCIgZm9yIHdob2xlIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgYWxpZ25UaWNrc1dpdGhBeGlzOiBudWxsLCAvLyBheGlzIG51bWJlciBvciBudWxsIGZvciBubyBzeW5jXG4gICAgICAgICAgICAgICAgICAgIHRpY2tEZWNpbWFsczogbnVsbCwgLy8gbm8uIG9mIGRlY2ltYWxzLCBudWxsIG1lYW5zIGF1dG9cbiAgICAgICAgICAgICAgICAgICAgdGlja1NpemU6IG51bGwsIC8vIG51bWJlciBvciBbbnVtYmVyLCBcInVuaXRcIl1cbiAgICAgICAgICAgICAgICAgICAgbWluVGlja1NpemU6IG51bGwgLy8gbnVtYmVyIG9yIFtudW1iZXIsIFwidW5pdFwiXVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgeWF4aXM6IHtcbiAgICAgICAgICAgICAgICAgICAgYXV0b3NjYWxlTWFyZ2luOiAwLjAyLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogXCJsZWZ0XCIgLy8gb3IgXCJyaWdodFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB4YXhlczogW10sXG4gICAgICAgICAgICAgICAgeWF4ZXM6IFtdLFxuICAgICAgICAgICAgICAgIHNlcmllczoge1xuICAgICAgICAgICAgICAgICAgICBwb2ludHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiAzLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoOiAyLCAvLyBpbiBwaXhlbHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsQ29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3ltYm9sOiBcImNpcmNsZVwiIC8vIG9yIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGxpbmVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBkb24ndCBwdXQgaW4gc2hvdzogZmFsc2Ugc28gd2UgY2FuIHNlZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2hldGhlciBsaW5lcyB3ZXJlIGFjdGl2ZWx5IGRpc2FibGVkXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IDIsIC8vIGluIHBpeGVsc1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsQ29sb3I6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGVwczogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9taXQgJ3plcm8nLCBzbyB3ZSBjYW4gbGF0ZXIgZGVmYXVsdCBpdHMgdmFsdWUgdG9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1hdGNoIHRoYXQgb2YgdGhlICdmaWxsJyBvcHRpb24uXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGJhcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3c6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoOiAyLCAvLyBpbiBwaXhlbHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhcldpZHRoOiAxLCAvLyBpbiB1bml0cyBvZiB0aGUgeCBheGlzXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbENvbG9yOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246IFwibGVmdFwiLCAvLyBcImxlZnRcIiwgXCJyaWdodFwiLCBvciBcImNlbnRlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICBob3Jpem9udGFsOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHplcm86IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc2hhZG93U2l6ZTogMyxcbiAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0Q29sb3I6IG51bGxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGdyaWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc2hvdzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWJvdmVEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IFwiIzU0NTQ1NFwiLCAvLyBwcmltYXJ5IGNvbG9yIHVzZWQgZm9yIG91dGxpbmUgYW5kIGxhYmVsc1xuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IG51bGwsIC8vIG51bGwgZm9yIHRyYW5zcGFyZW50LCBlbHNlIGNvbG9yXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiBudWxsLCAvLyBzZXQgaWYgZGlmZmVyZW50IGZyb20gdGhlIGdyaWQgY29sb3JcbiAgICAgICAgICAgICAgICAgICAgdGlja0NvbG9yOiBudWxsLCAvLyBjb2xvciBmb3IgdGhlIHRpY2tzLCBlLmcuIFwicmdiYSgwLDAsMCwwLjE1KVwiXG4gICAgICAgICAgICAgICAgICAgIG1hcmdpbjogMCwgLy8gZGlzdGFuY2UgZnJvbSB0aGUgY2FudmFzIGVkZ2UgdG8gdGhlIGdyaWRcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxNYXJnaW46IDUsIC8vIGluIHBpeGVsc1xuICAgICAgICAgICAgICAgICAgICBheGlzTWFyZ2luOiA4LCAvLyBpbiBwaXhlbHNcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDIsIC8vIGluIHBpeGVsc1xuICAgICAgICAgICAgICAgICAgICBtaW5Cb3JkZXJNYXJnaW46IG51bGwsIC8vIGluIHBpeGVscywgbnVsbCBtZWFucyB0YWtlbiBmcm9tIHBvaW50cyByYWRpdXNcbiAgICAgICAgICAgICAgICAgICAgbWFya2luZ3M6IG51bGwsIC8vIGFycmF5IG9mIHJhbmdlcyBvciBmbjogYXhlcyAtPiBhcnJheSBvZiByYW5nZXNcbiAgICAgICAgICAgICAgICAgICAgbWFya2luZ3NDb2xvcjogXCIjZjRmNGY0XCIsXG4gICAgICAgICAgICAgICAgICAgIG1hcmtpbmdzTGluZVdpZHRoOiAyLFxuICAgICAgICAgICAgICAgICAgICAvLyBpbnRlcmFjdGl2ZSBzdHVmZlxuICAgICAgICAgICAgICAgICAgICBjbGlja2FibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBob3ZlcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBhdXRvSGlnaGxpZ2h0OiB0cnVlLCAvLyBoaWdobGlnaHQgaW4gY2FzZSBtb3VzZSBpcyBuZWFyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlQWN0aXZlUmFkaXVzOiAxMCAvLyBob3cgZmFyIHRoZSBtb3VzZSBjYW4gYmUgYXdheSB0byBhY3RpdmF0ZSBhbiBpdGVtXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICByZWRyYXdPdmVybGF5SW50ZXJ2YWw6IDEwMDAvNjAgLy8gdGltZSBiZXR3ZWVuIHVwZGF0ZXMsIC0xIG1lYW5zIGluIHNhbWUgZmxvd1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaG9va3M6IHt9XG4gICAgICAgICAgICB9LFxuICAgICAgICBzdXJmYWNlID0gbnVsbCwgICAgIC8vIHRoZSBjYW52YXMgZm9yIHRoZSBwbG90IGl0c2VsZlxuICAgICAgICBvdmVybGF5ID0gbnVsbCwgICAgIC8vIGNhbnZhcyBmb3IgaW50ZXJhY3RpdmUgc3R1ZmYgb24gdG9wIG9mIHBsb3RcbiAgICAgICAgZXZlbnRIb2xkZXIgPSBudWxsLCAvLyBqUXVlcnkgb2JqZWN0IHRoYXQgZXZlbnRzIHNob3VsZCBiZSBib3VuZCB0b1xuICAgICAgICBjdHggPSBudWxsLCBvY3R4ID0gbnVsbCxcbiAgICAgICAgeGF4ZXMgPSBbXSwgeWF4ZXMgPSBbXSxcbiAgICAgICAgcGxvdE9mZnNldCA9IHsgbGVmdDogMCwgcmlnaHQ6IDAsIHRvcDogMCwgYm90dG9tOiAwfSxcbiAgICAgICAgcGxvdFdpZHRoID0gMCwgcGxvdEhlaWdodCA9IDAsXG4gICAgICAgIGhvb2tzID0ge1xuICAgICAgICAgICAgcHJvY2Vzc09wdGlvbnM6IFtdLFxuICAgICAgICAgICAgcHJvY2Vzc1Jhd0RhdGE6IFtdLFxuICAgICAgICAgICAgcHJvY2Vzc0RhdGFwb2ludHM6IFtdLFxuICAgICAgICAgICAgcHJvY2Vzc09mZnNldDogW10sXG4gICAgICAgICAgICBkcmF3QmFja2dyb3VuZDogW10sXG4gICAgICAgICAgICBkcmF3U2VyaWVzOiBbXSxcbiAgICAgICAgICAgIGRyYXc6IFtdLFxuICAgICAgICAgICAgYmluZEV2ZW50czogW10sXG4gICAgICAgICAgICBkcmF3T3ZlcmxheTogW10sXG4gICAgICAgICAgICBzaHV0ZG93bjogW11cbiAgICAgICAgfSxcbiAgICAgICAgcGxvdCA9IHRoaXM7XG5cbiAgICAgICAgLy8gcHVibGljIGZ1bmN0aW9uc1xuICAgICAgICBwbG90LnNldERhdGEgPSBzZXREYXRhO1xuICAgICAgICBwbG90LnNldHVwR3JpZCA9IHNldHVwR3JpZDtcbiAgICAgICAgcGxvdC5kcmF3ID0gZHJhdztcbiAgICAgICAgcGxvdC5nZXRQbGFjZWhvbGRlciA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gcGxhY2Vob2xkZXI7IH07XG4gICAgICAgIHBsb3QuZ2V0Q2FudmFzID0gZnVuY3Rpb24oKSB7IHJldHVybiBzdXJmYWNlLmVsZW1lbnQ7IH07XG4gICAgICAgIHBsb3QuZ2V0UGxvdE9mZnNldCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gcGxvdE9mZnNldDsgfTtcbiAgICAgICAgcGxvdC53aWR0aCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBsb3RXaWR0aDsgfTtcbiAgICAgICAgcGxvdC5oZWlnaHQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBwbG90SGVpZ2h0OyB9O1xuICAgICAgICBwbG90Lm9mZnNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvID0gZXZlbnRIb2xkZXIub2Zmc2V0KCk7XG4gICAgICAgICAgICBvLmxlZnQgKz0gcGxvdE9mZnNldC5sZWZ0O1xuICAgICAgICAgICAgby50b3AgKz0gcGxvdE9mZnNldC50b3A7XG4gICAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgfTtcbiAgICAgICAgcGxvdC5nZXREYXRhID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gc2VyaWVzOyB9O1xuICAgICAgICBwbG90LmdldEF4ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0ge30sIGk7XG4gICAgICAgICAgICAkLmVhY2goeGF4ZXMuY29uY2F0KHlheGVzKSwgZnVuY3Rpb24gKF8sIGF4aXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXhpcylcbiAgICAgICAgICAgICAgICAgICAgcmVzW2F4aXMuZGlyZWN0aW9uICsgKGF4aXMubiAhPSAxID8gYXhpcy5uIDogXCJcIikgKyBcImF4aXNcIl0gPSBheGlzO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9O1xuICAgICAgICBwbG90LmdldFhBeGVzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4geGF4ZXM7IH07XG4gICAgICAgIHBsb3QuZ2V0WUF4ZXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB5YXhlczsgfTtcbiAgICAgICAgcGxvdC5jMnAgPSBjYW52YXNUb0F4aXNDb29yZHM7XG4gICAgICAgIHBsb3QucDJjID0gYXhpc1RvQ2FudmFzQ29vcmRzO1xuICAgICAgICBwbG90LmdldE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBvcHRpb25zOyB9O1xuICAgICAgICBwbG90LmhpZ2hsaWdodCA9IGhpZ2hsaWdodDtcbiAgICAgICAgcGxvdC51bmhpZ2hsaWdodCA9IHVuaGlnaGxpZ2h0O1xuICAgICAgICBwbG90LnRyaWdnZXJSZWRyYXdPdmVybGF5ID0gdHJpZ2dlclJlZHJhd092ZXJsYXk7XG4gICAgICAgIHBsb3QucG9pbnRPZmZzZXQgPSBmdW5jdGlvbihwb2ludCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBsZWZ0OiBwYXJzZUludCh4YXhlc1theGlzTnVtYmVyKHBvaW50LCBcInhcIikgLSAxXS5wMmMoK3BvaW50LngpICsgcGxvdE9mZnNldC5sZWZ0LCAxMCksXG4gICAgICAgICAgICAgICAgdG9wOiBwYXJzZUludCh5YXhlc1theGlzTnVtYmVyKHBvaW50LCBcInlcIikgLSAxXS5wMmMoK3BvaW50LnkpICsgcGxvdE9mZnNldC50b3AsIDEwKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgcGxvdC5zaHV0ZG93biA9IHNodXRkb3duO1xuICAgICAgICBwbG90LmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzaHV0ZG93bigpO1xuICAgICAgICAgICAgcGxhY2Vob2xkZXIucmVtb3ZlRGF0YShcInBsb3RcIikuZW1wdHkoKTtcblxuICAgICAgICAgICAgc2VyaWVzID0gW107XG4gICAgICAgICAgICBvcHRpb25zID0gbnVsbDtcbiAgICAgICAgICAgIHN1cmZhY2UgPSBudWxsO1xuICAgICAgICAgICAgb3ZlcmxheSA9IG51bGw7XG4gICAgICAgICAgICBldmVudEhvbGRlciA9IG51bGw7XG4gICAgICAgICAgICBjdHggPSBudWxsO1xuICAgICAgICAgICAgb2N0eCA9IG51bGw7XG4gICAgICAgICAgICB4YXhlcyA9IFtdO1xuICAgICAgICAgICAgeWF4ZXMgPSBbXTtcbiAgICAgICAgICAgIGhvb2tzID0gbnVsbDtcbiAgICAgICAgICAgIGhpZ2hsaWdodHMgPSBbXTtcbiAgICAgICAgICAgIHBsb3QgPSBudWxsO1xuICAgICAgICB9O1xuICAgICAgICBwbG90LnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXHR2YXIgd2lkdGggPSBwbGFjZWhvbGRlci53aWR0aCgpLFxuICAgICAgICBcdFx0aGVpZ2h0ID0gcGxhY2Vob2xkZXIuaGVpZ2h0KCk7XG4gICAgICAgICAgICBzdXJmYWNlLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgICAgIG92ZXJsYXkucmVzaXplKHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHB1YmxpYyBhdHRyaWJ1dGVzXG4gICAgICAgIHBsb3QuaG9va3MgPSBob29rcztcblxuICAgICAgICAvLyBpbml0aWFsaXplXG4gICAgICAgIGluaXRQbHVnaW5zKHBsb3QpO1xuICAgICAgICBwYXJzZU9wdGlvbnMob3B0aW9uc18pO1xuICAgICAgICBzZXR1cENhbnZhc2VzKCk7XG4gICAgICAgIHNldERhdGEoZGF0YV8pO1xuICAgICAgICBzZXR1cEdyaWQoKTtcbiAgICAgICAgZHJhdygpO1xuICAgICAgICBiaW5kRXZlbnRzKCk7XG5cblxuICAgICAgICBmdW5jdGlvbiBleGVjdXRlSG9va3MoaG9vaywgYXJncykge1xuICAgICAgICAgICAgYXJncyA9IFtwbG90XS5jb25jYXQoYXJncyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhvb2subGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgaG9va1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGluaXRQbHVnaW5zKCkge1xuXG4gICAgICAgICAgICAvLyBSZWZlcmVuY2VzIHRvIGtleSBjbGFzc2VzLCBhbGxvd2luZyBwbHVnaW5zIHRvIG1vZGlmeSB0aGVtXG5cbiAgICAgICAgICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgICAgICAgICAgIENhbnZhczogQ2FudmFzXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBsdWdpbnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IHBsdWdpbnNbaV07XG4gICAgICAgICAgICAgICAgcC5pbml0KHBsb3QsIGNsYXNzZXMpO1xuICAgICAgICAgICAgICAgIGlmIChwLm9wdGlvbnMpXG4gICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIG9wdGlvbnMsIHAub3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwYXJzZU9wdGlvbnMob3B0cykge1xuXG4gICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBvcHRpb25zLCBvcHRzKTtcblxuICAgICAgICAgICAgLy8gJC5leHRlbmQgbWVyZ2VzIGFycmF5cywgcmF0aGVyIHRoYW4gcmVwbGFjaW5nIHRoZW0uICBXaGVuIGxlc3NcbiAgICAgICAgICAgIC8vIGNvbG9ycyBhcmUgcHJvdmlkZWQgdGhhbiB0aGUgc2l6ZSBvZiB0aGUgZGVmYXVsdCBwYWxldHRlLCB3ZVxuICAgICAgICAgICAgLy8gZW5kIHVwIHdpdGggdGhvc2UgY29sb3JzIHBsdXMgdGhlIHJlbWFpbmluZyBkZWZhdWx0cywgd2hpY2ggaXNcbiAgICAgICAgICAgIC8vIG5vdCBleHBlY3RlZCBiZWhhdmlvcjsgYXZvaWQgaXQgYnkgcmVwbGFjaW5nIHRoZW0gaGVyZS5cblxuICAgICAgICAgICAgaWYgKG9wdHMgJiYgb3B0cy5jb2xvcnMpIHtcbiAgICAgICAgICAgIFx0b3B0aW9ucy5jb2xvcnMgPSBvcHRzLmNvbG9ycztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMueGF4aXMuY29sb3IgPT0gbnVsbClcbiAgICAgICAgICAgICAgICBvcHRpb25zLnhheGlzLmNvbG9yID0gJC5jb2xvci5wYXJzZShvcHRpb25zLmdyaWQuY29sb3IpLnNjYWxlKCdhJywgMC4yMikudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnlheGlzLmNvbG9yID09IG51bGwpXG4gICAgICAgICAgICAgICAgb3B0aW9ucy55YXhpcy5jb2xvciA9ICQuY29sb3IucGFyc2Uob3B0aW9ucy5ncmlkLmNvbG9yKS5zY2FsZSgnYScsIDAuMjIpLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnhheGlzLnRpY2tDb2xvciA9PSBudWxsKSAvLyBncmlkLnRpY2tDb2xvciBmb3IgYmFjay1jb21wYXRpYmlsaXR5XG4gICAgICAgICAgICAgICAgb3B0aW9ucy54YXhpcy50aWNrQ29sb3IgPSBvcHRpb25zLmdyaWQudGlja0NvbG9yIHx8IG9wdGlvbnMueGF4aXMuY29sb3I7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy55YXhpcy50aWNrQ29sb3IgPT0gbnVsbCkgLy8gZ3JpZC50aWNrQ29sb3IgZm9yIGJhY2stY29tcGF0aWJpbGl0eVxuICAgICAgICAgICAgICAgIG9wdGlvbnMueWF4aXMudGlja0NvbG9yID0gb3B0aW9ucy5ncmlkLnRpY2tDb2xvciB8fCBvcHRpb25zLnlheGlzLmNvbG9yO1xuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5ncmlkLmJvcmRlckNvbG9yID09IG51bGwpXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5ncmlkLmJvcmRlckNvbG9yID0gb3B0aW9ucy5ncmlkLmNvbG9yO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZ3JpZC50aWNrQ29sb3IgPT0gbnVsbClcbiAgICAgICAgICAgICAgICBvcHRpb25zLmdyaWQudGlja0NvbG9yID0gJC5jb2xvci5wYXJzZShvcHRpb25zLmdyaWQuY29sb3IpLnNjYWxlKCdhJywgMC4yMikudG9TdHJpbmcoKTtcblxuICAgICAgICAgICAgLy8gRmlsbCBpbiBkZWZhdWx0cyBmb3IgYXhpcyBvcHRpb25zLCBpbmNsdWRpbmcgYW55IHVuc3BlY2lmaWVkXG4gICAgICAgICAgICAvLyBmb250LXNwZWMgZmllbGRzLCBpZiBhIGZvbnQtc3BlYyB3YXMgcHJvdmlkZWQuXG5cbiAgICAgICAgICAgIC8vIElmIG5vIHgveSBheGlzIG9wdGlvbnMgd2VyZSBwcm92aWRlZCwgY3JlYXRlIG9uZSBvZiBlYWNoIGFueXdheSxcbiAgICAgICAgICAgIC8vIHNpbmNlIHRoZSByZXN0IG9mIHRoZSBjb2RlIGFzc3VtZXMgdGhhdCB0aGV5IGV4aXN0LlxuXG4gICAgICAgICAgICB2YXIgaSwgYXhpc09wdGlvbnMsIGF4aXNDb3VudCxcbiAgICAgICAgICAgICAgICBmb250U2l6ZSA9IHBsYWNlaG9sZGVyLmNzcyhcImZvbnQtc2l6ZVwiKSxcbiAgICAgICAgICAgICAgICBmb250U2l6ZURlZmF1bHQgPSBmb250U2l6ZSA/ICtmb250U2l6ZS5yZXBsYWNlKFwicHhcIiwgXCJcIikgOiAxMyxcbiAgICAgICAgICAgICAgICBmb250RGVmYXVsdHMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiBwbGFjZWhvbGRlci5jc3MoXCJmb250LXN0eWxlXCIpLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiBNYXRoLnJvdW5kKDAuOCAqIGZvbnRTaXplRGVmYXVsdCksXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhbnQ6IHBsYWNlaG9sZGVyLmNzcyhcImZvbnQtdmFyaWFudFwiKSxcbiAgICAgICAgICAgICAgICAgICAgd2VpZ2h0OiBwbGFjZWhvbGRlci5jc3MoXCJmb250LXdlaWdodFwiKSxcbiAgICAgICAgICAgICAgICAgICAgZmFtaWx5OiBwbGFjZWhvbGRlci5jc3MoXCJmb250LWZhbWlseVwiKVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGF4aXNDb3VudCA9IG9wdGlvbnMueGF4ZXMubGVuZ3RoIHx8IDE7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXhpc0NvdW50OyArK2kpIHtcblxuICAgICAgICAgICAgICAgIGF4aXNPcHRpb25zID0gb3B0aW9ucy54YXhlc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoYXhpc09wdGlvbnMgJiYgIWF4aXNPcHRpb25zLnRpY2tDb2xvcikge1xuICAgICAgICAgICAgICAgICAgICBheGlzT3B0aW9ucy50aWNrQ29sb3IgPSBheGlzT3B0aW9ucy5jb2xvcjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBheGlzT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvcHRpb25zLnhheGlzLCBheGlzT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy54YXhlc1tpXSA9IGF4aXNPcHRpb25zO1xuXG4gICAgICAgICAgICAgICAgaWYgKGF4aXNPcHRpb25zLmZvbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgYXhpc09wdGlvbnMuZm9udCA9ICQuZXh0ZW5kKHt9LCBmb250RGVmYXVsdHMsIGF4aXNPcHRpb25zLmZvbnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWF4aXNPcHRpb25zLmZvbnQuY29sb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4aXNPcHRpb25zLmZvbnQuY29sb3IgPSBheGlzT3B0aW9ucy5jb2xvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWF4aXNPcHRpb25zLmZvbnQubGluZUhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXhpc09wdGlvbnMuZm9udC5saW5lSGVpZ2h0ID0gTWF0aC5yb3VuZChheGlzT3B0aW9ucy5mb250LnNpemUgKiAxLjE1KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXhpc0NvdW50ID0gb3B0aW9ucy55YXhlcy5sZW5ndGggfHwgMTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBheGlzQ291bnQ7ICsraSkge1xuXG4gICAgICAgICAgICAgICAgYXhpc09wdGlvbnMgPSBvcHRpb25zLnlheGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChheGlzT3B0aW9ucyAmJiAhYXhpc09wdGlvbnMudGlja0NvbG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGF4aXNPcHRpb25zLnRpY2tDb2xvciA9IGF4aXNPcHRpb25zLmNvbG9yO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGF4aXNPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIG9wdGlvbnMueWF4aXMsIGF4aXNPcHRpb25zKTtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnlheGVzW2ldID0gYXhpc09wdGlvbnM7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXhpc09wdGlvbnMuZm9udCkge1xuICAgICAgICAgICAgICAgICAgICBheGlzT3B0aW9ucy5mb250ID0gJC5leHRlbmQoe30sIGZvbnREZWZhdWx0cywgYXhpc09wdGlvbnMuZm9udCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYXhpc09wdGlvbnMuZm9udC5jb2xvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXhpc09wdGlvbnMuZm9udC5jb2xvciA9IGF4aXNPcHRpb25zLmNvbG9yO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghYXhpc09wdGlvbnMuZm9udC5saW5lSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBheGlzT3B0aW9ucy5mb250LmxpbmVIZWlnaHQgPSBNYXRoLnJvdW5kKGF4aXNPcHRpb25zLmZvbnQuc2l6ZSAqIDEuMTUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSwgdG8gYmUgcmVtb3ZlZCBpbiBmdXR1cmVcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnhheGlzLm5vVGlja3MgJiYgb3B0aW9ucy54YXhpcy50aWNrcyA9PSBudWxsKVxuICAgICAgICAgICAgICAgIG9wdGlvbnMueGF4aXMudGlja3MgPSBvcHRpb25zLnhheGlzLm5vVGlja3M7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy55YXhpcy5ub1RpY2tzICYmIG9wdGlvbnMueWF4aXMudGlja3MgPT0gbnVsbClcbiAgICAgICAgICAgICAgICBvcHRpb25zLnlheGlzLnRpY2tzID0gb3B0aW9ucy55YXhpcy5ub1RpY2tzO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMueDJheGlzKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy54YXhlc1sxXSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvcHRpb25zLnhheGlzLCBvcHRpb25zLngyYXhpcyk7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy54YXhlc1sxXS5wb3NpdGlvbiA9IFwidG9wXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy55MmF4aXMpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnlheGVzWzFdID0gJC5leHRlbmQodHJ1ZSwge30sIG9wdGlvbnMueWF4aXMsIG9wdGlvbnMueTJheGlzKTtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnlheGVzWzFdLnBvc2l0aW9uID0gXCJyaWdodFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZ3JpZC5jb2xvcmVkQXJlYXMpXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5ncmlkLm1hcmtpbmdzID0gb3B0aW9ucy5ncmlkLmNvbG9yZWRBcmVhcztcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmdyaWQuY29sb3JlZEFyZWFzQ29sb3IpXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5ncmlkLm1hcmtpbmdzQ29sb3IgPSBvcHRpb25zLmdyaWQuY29sb3JlZEFyZWFzQ29sb3I7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5saW5lcylcbiAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBvcHRpb25zLnNlcmllcy5saW5lcywgb3B0aW9ucy5saW5lcyk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5wb2ludHMpXG4gICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgb3B0aW9ucy5zZXJpZXMucG9pbnRzLCBvcHRpb25zLnBvaW50cyk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5iYXJzKVxuICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIG9wdGlvbnMuc2VyaWVzLmJhcnMsIG9wdGlvbnMuYmFycyk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zaGFkb3dTaXplICE9IG51bGwpXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zZXJpZXMuc2hhZG93U2l6ZSA9IG9wdGlvbnMuc2hhZG93U2l6ZTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhpZ2hsaWdodENvbG9yICE9IG51bGwpXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zZXJpZXMuaGlnaGxpZ2h0Q29sb3IgPSBvcHRpb25zLmhpZ2hsaWdodENvbG9yO1xuXG4gICAgICAgICAgICAvLyBzYXZlIG9wdGlvbnMgb24gYXhlcyBmb3IgZnV0dXJlIHJlZmVyZW5jZVxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9wdGlvbnMueGF4ZXMubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgZ2V0T3JDcmVhdGVBeGlzKHhheGVzLCBpICsgMSkub3B0aW9ucyA9IG9wdGlvbnMueGF4ZXNbaV07XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgb3B0aW9ucy55YXhlcy5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBnZXRPckNyZWF0ZUF4aXMoeWF4ZXMsIGkgKyAxKS5vcHRpb25zID0gb3B0aW9ucy55YXhlc1tpXTtcblxuICAgICAgICAgICAgLy8gYWRkIGhvb2tzIGZyb20gb3B0aW9uc1xuICAgICAgICAgICAgZm9yICh2YXIgbiBpbiBob29rcylcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5ob29rc1tuXSAmJiBvcHRpb25zLmhvb2tzW25dLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgaG9va3Nbbl0gPSBob29rc1tuXS5jb25jYXQob3B0aW9ucy5ob29rc1tuXSk7XG5cbiAgICAgICAgICAgIGV4ZWN1dGVIb29rcyhob29rcy5wcm9jZXNzT3B0aW9ucywgW29wdGlvbnNdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNldERhdGEoZCkge1xuICAgICAgICAgICAgc2VyaWVzID0gcGFyc2VEYXRhKGQpO1xuICAgICAgICAgICAgZmlsbEluU2VyaWVzT3B0aW9ucygpO1xuICAgICAgICAgICAgcHJvY2Vzc0RhdGEoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlRGF0YShkKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvcHRpb25zLnNlcmllcyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZFtpXS5kYXRhICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcy5kYXRhID0gZFtpXS5kYXRhOyAvLyBtb3ZlIHRoZSBkYXRhIGluc3RlYWQgb2YgZGVlcC1jb3B5XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBkW2ldLmRhdGE7XG5cbiAgICAgICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgcywgZFtpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZFtpXS5kYXRhID0gcy5kYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHMuZGF0YSA9IGRbaV07XG4gICAgICAgICAgICAgICAgcmVzLnB1c2gocyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBheGlzTnVtYmVyKG9iaiwgY29vcmQpIHtcbiAgICAgICAgICAgIHZhciBhID0gb2JqW2Nvb3JkICsgXCJheGlzXCJdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhID09IFwib2JqZWN0XCIpIC8vIGlmIHdlIGdvdCBhIHJlYWwgYXhpcywgZXh0cmFjdCBudW1iZXJcbiAgICAgICAgICAgICAgICBhID0gYS5uO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhICE9IFwibnVtYmVyXCIpXG4gICAgICAgICAgICAgICAgYSA9IDE7IC8vIGRlZmF1bHQgdG8gZmlyc3QgYXhpc1xuICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhbGxBeGVzKCkge1xuICAgICAgICAgICAgLy8gcmV0dXJuIGZsYXQgYXJyYXkgd2l0aG91dCBhbm5veWluZyBudWxsIGVudHJpZXNcbiAgICAgICAgICAgIHJldHVybiAkLmdyZXAoeGF4ZXMuY29uY2F0KHlheGVzKSwgZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGE7IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2FudmFzVG9BeGlzQ29vcmRzKHBvcykge1xuICAgICAgICAgICAgLy8gcmV0dXJuIGFuIG9iamVjdCB3aXRoIHgveSBjb3JyZXNwb25kaW5nIHRvIGFsbCB1c2VkIGF4ZXNcbiAgICAgICAgICAgIHZhciByZXMgPSB7fSwgaSwgYXhpcztcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB4YXhlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGF4aXMgPSB4YXhlc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoYXhpcyAmJiBheGlzLnVzZWQpXG4gICAgICAgICAgICAgICAgICAgIHJlc1tcInhcIiArIGF4aXMubl0gPSBheGlzLmMycChwb3MubGVmdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB5YXhlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGF4aXMgPSB5YXhlc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoYXhpcyAmJiBheGlzLnVzZWQpXG4gICAgICAgICAgICAgICAgICAgIHJlc1tcInlcIiArIGF4aXMubl0gPSBheGlzLmMycChwb3MudG9wKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlcy54MSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgIHJlcy54ID0gcmVzLngxO1xuICAgICAgICAgICAgaWYgKHJlcy55MSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgIHJlcy55ID0gcmVzLnkxO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYXhpc1RvQ2FudmFzQ29vcmRzKHBvcykge1xuICAgICAgICAgICAgLy8gZ2V0IGNhbnZhcyBjb29yZHMgZnJvbSB0aGUgZmlyc3QgcGFpciBvZiB4L3kgZm91bmQgaW4gcG9zXG4gICAgICAgICAgICB2YXIgcmVzID0ge30sIGksIGF4aXMsIGtleTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHhheGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgYXhpcyA9IHhheGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChheGlzICYmIGF4aXMudXNlZCkge1xuICAgICAgICAgICAgICAgICAgICBrZXkgPSBcInhcIiArIGF4aXMubjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc1trZXldID09IG51bGwgJiYgYXhpcy5uID09IDEpXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXkgPSBcInhcIjtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocG9zW2tleV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmxlZnQgPSBheGlzLnAyYyhwb3Nba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHlheGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgYXhpcyA9IHlheGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChheGlzICYmIGF4aXMudXNlZCkge1xuICAgICAgICAgICAgICAgICAgICBrZXkgPSBcInlcIiArIGF4aXMubjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc1trZXldID09IG51bGwgJiYgYXhpcy5uID09IDEpXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXkgPSBcInlcIjtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocG9zW2tleV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnRvcCA9IGF4aXMucDJjKHBvc1trZXldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0T3JDcmVhdGVBeGlzKGF4ZXMsIG51bWJlcikge1xuICAgICAgICAgICAgaWYgKCFheGVzW251bWJlciAtIDFdKVxuICAgICAgICAgICAgICAgIGF4ZXNbbnVtYmVyIC0gMV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIG46IG51bWJlciwgLy8gc2F2ZSB0aGUgbnVtYmVyIGZvciBmdXR1cmUgcmVmZXJlbmNlXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogYXhlcyA9PSB4YXhlcyA/IFwieFwiIDogXCJ5XCIsXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6ICQuZXh0ZW5kKHRydWUsIHt9LCBheGVzID09IHhheGVzID8gb3B0aW9ucy54YXhpcyA6IG9wdGlvbnMueWF4aXMpXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIGF4ZXNbbnVtYmVyIC0gMV07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBmaWxsSW5TZXJpZXNPcHRpb25zKCkge1xuXG4gICAgICAgICAgICB2YXIgbmVlZGVkQ29sb3JzID0gc2VyaWVzLmxlbmd0aCwgbWF4SW5kZXggPSAtMSwgaTtcblxuICAgICAgICAgICAgLy8gU3VidHJhY3QgdGhlIG51bWJlciBvZiBzZXJpZXMgdGhhdCBhbHJlYWR5IGhhdmUgZml4ZWQgY29sb3JzIG9yXG4gICAgICAgICAgICAvLyBjb2xvciBpbmRleGVzIGZyb20gdGhlIG51bWJlciB0aGF0IHdlIHN0aWxsIG5lZWQgdG8gZ2VuZXJhdGUuXG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzZXJpZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2MgPSBzZXJpZXNbaV0uY29sb3I7XG4gICAgICAgICAgICAgICAgaWYgKHNjICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgbmVlZGVkQ29sb3JzLS07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc2MgPT0gXCJudW1iZXJcIiAmJiBzYyA+IG1heEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhJbmRleCA9IHNjO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiBhbnkgb2YgdGhlIHNlcmllcyBoYXZlIGZpeGVkIGNvbG9yIGluZGV4ZXMsIHRoZW4gd2UgbmVlZCB0b1xuICAgICAgICAgICAgLy8gZ2VuZXJhdGUgYXQgbGVhc3QgYXMgbWFueSBjb2xvcnMgYXMgdGhlIGhpZ2hlc3QgaW5kZXguXG5cbiAgICAgICAgICAgIGlmIChuZWVkZWRDb2xvcnMgPD0gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBuZWVkZWRDb2xvcnMgPSBtYXhJbmRleCArIDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIGFsbCB0aGUgY29sb3JzLCB1c2luZyBmaXJzdCB0aGUgb3B0aW9uIGNvbG9ycyBhbmQgdGhlblxuICAgICAgICAgICAgLy8gdmFyaWF0aW9ucyBvbiB0aG9zZSBjb2xvcnMgb25jZSB0aGV5J3JlIGV4aGF1c3RlZC5cblxuICAgICAgICAgICAgdmFyIGMsIGNvbG9ycyA9IFtdLCBjb2xvclBvb2wgPSBvcHRpb25zLmNvbG9ycyxcbiAgICAgICAgICAgICAgICBjb2xvclBvb2xTaXplID0gY29sb3JQb29sLmxlbmd0aCwgdmFyaWF0aW9uID0gMDtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG5lZWRlZENvbG9yczsgaSsrKSB7XG5cbiAgICAgICAgICAgICAgICBjID0gJC5jb2xvci5wYXJzZShjb2xvclBvb2xbaSAlIGNvbG9yUG9vbFNpemVdIHx8IFwiIzY2NlwiKTtcblxuICAgICAgICAgICAgICAgIC8vIEVhY2ggdGltZSB3ZSBleGhhdXN0IHRoZSBjb2xvcnMgaW4gdGhlIHBvb2wgd2UgYWRqdXN0XG4gICAgICAgICAgICAgICAgLy8gYSBzY2FsaW5nIGZhY3RvciB1c2VkIHRvIHByb2R1Y2UgbW9yZSB2YXJpYXRpb25zIG9uXG4gICAgICAgICAgICAgICAgLy8gdGhvc2UgY29sb3JzLiBUaGUgZmFjdG9yIGFsdGVybmF0ZXMgbmVnYXRpdmUvcG9zaXRpdmVcbiAgICAgICAgICAgICAgICAvLyB0byBwcm9kdWNlIGxpZ2h0ZXIvZGFya2VyIGNvbG9ycy5cblxuICAgICAgICAgICAgICAgIC8vIFJlc2V0IHRoZSB2YXJpYXRpb24gYWZ0ZXIgZXZlcnkgZmV3IGN5Y2xlcywgb3IgZWxzZVxuICAgICAgICAgICAgICAgIC8vIGl0IHdpbGwgZW5kIHVwIHByb2R1Y2luZyBvbmx5IHdoaXRlIG9yIGJsYWNrIGNvbG9ycy5cblxuICAgICAgICAgICAgICAgIGlmIChpICUgY29sb3JQb29sU2l6ZSA9PSAwICYmIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhcmlhdGlvbiA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFyaWF0aW9uIDwgMC41KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWF0aW9uID0gLXZhcmlhdGlvbiAtIDAuMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB2YXJpYXRpb24gPSAwO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgdmFyaWF0aW9uID0gLXZhcmlhdGlvbjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb2xvcnNbaV0gPSBjLnNjYWxlKCdyZ2InLCAxICsgdmFyaWF0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmluYWxpemUgdGhlIHNlcmllcyBvcHRpb25zLCBmaWxsaW5nIGluIHRoZWlyIGNvbG9yc1xuXG4gICAgICAgICAgICB2YXIgY29sb3JpID0gMCwgcztcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzZXJpZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBzID0gc2VyaWVzW2ldO1xuXG4gICAgICAgICAgICAgICAgLy8gYXNzaWduIGNvbG9yc1xuICAgICAgICAgICAgICAgIGlmIChzLmNvbG9yID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcy5jb2xvciA9IGNvbG9yc1tjb2xvcmldLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICsrY29sb3JpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygcy5jb2xvciA9PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgICAgICAgICBzLmNvbG9yID0gY29sb3JzW3MuY29sb3JdLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgICAgICAvLyB0dXJuIG9uIGxpbmVzIGF1dG9tYXRpY2FsbHkgaW4gY2FzZSBub3RoaW5nIGlzIHNldFxuICAgICAgICAgICAgICAgIGlmIChzLmxpbmVzLnNob3cgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdiwgc2hvdyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodiBpbiBzKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNbdl0gJiYgc1t2XS5zaG93KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdylcbiAgICAgICAgICAgICAgICAgICAgICAgIHMubGluZXMuc2hvdyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSWYgbm90aGluZyB3YXMgcHJvdmlkZWQgZm9yIGxpbmVzLnplcm8sIGRlZmF1bHQgaXQgdG8gbWF0Y2hcbiAgICAgICAgICAgICAgICAvLyBsaW5lcy5maWxsLCBzaW5jZSBhcmVhcyBieSBkZWZhdWx0IHNob3VsZCBleHRlbmQgdG8gemVyby5cblxuICAgICAgICAgICAgICAgIGlmIChzLmxpbmVzLnplcm8gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBzLmxpbmVzLnplcm8gPSAhIXMubGluZXMuZmlsbDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBzZXR1cCBheGVzXG4gICAgICAgICAgICAgICAgcy54YXhpcyA9IGdldE9yQ3JlYXRlQXhpcyh4YXhlcywgYXhpc051bWJlcihzLCBcInhcIikpO1xuICAgICAgICAgICAgICAgIHMueWF4aXMgPSBnZXRPckNyZWF0ZUF4aXMoeWF4ZXMsIGF4aXNOdW1iZXIocywgXCJ5XCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NEYXRhKCkge1xuICAgICAgICAgICAgdmFyIHRvcFNlbnRyeSA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcbiAgICAgICAgICAgICAgICBib3R0b21TZW50cnkgPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXG4gICAgICAgICAgICAgICAgZmFrZUluZmluaXR5ID0gTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgICAgICAgICAgICBpLCBqLCBrLCBtLCBsZW5ndGgsXG4gICAgICAgICAgICAgICAgcywgcG9pbnRzLCBwcywgeCwgeSwgYXhpcywgdmFsLCBmLCBwLFxuICAgICAgICAgICAgICAgIGRhdGEsIGZvcm1hdDtcblxuICAgICAgICAgICAgZnVuY3Rpb24gdXBkYXRlQXhpcyhheGlzLCBtaW4sIG1heCkge1xuICAgICAgICAgICAgICAgIGlmIChtaW4gPCBheGlzLmRhdGFtaW4gJiYgbWluICE9IC1mYWtlSW5maW5pdHkpXG4gICAgICAgICAgICAgICAgICAgIGF4aXMuZGF0YW1pbiA9IG1pbjtcbiAgICAgICAgICAgICAgICBpZiAobWF4ID4gYXhpcy5kYXRhbWF4ICYmIG1heCAhPSBmYWtlSW5maW5pdHkpXG4gICAgICAgICAgICAgICAgICAgIGF4aXMuZGF0YW1heCA9IG1heDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJC5lYWNoKGFsbEF4ZXMoKSwgZnVuY3Rpb24gKF8sIGF4aXMpIHtcbiAgICAgICAgICAgICAgICAvLyBpbml0IGF4aXNcbiAgICAgICAgICAgICAgICBheGlzLmRhdGFtaW4gPSB0b3BTZW50cnk7XG4gICAgICAgICAgICAgICAgYXhpcy5kYXRhbWF4ID0gYm90dG9tU2VudHJ5O1xuICAgICAgICAgICAgICAgIGF4aXMudXNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzZXJpZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBzID0gc2VyaWVzW2ldO1xuICAgICAgICAgICAgICAgIHMuZGF0YXBvaW50cyA9IHsgcG9pbnRzOiBbXSB9O1xuXG4gICAgICAgICAgICAgICAgZXhlY3V0ZUhvb2tzKGhvb2tzLnByb2Nlc3NSYXdEYXRhLCBbIHMsIHMuZGF0YSwgcy5kYXRhcG9pbnRzIF0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBmaXJzdCBwYXNzOiBjbGVhbiBhbmQgY29weSBkYXRhXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2VyaWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgcyA9IHNlcmllc1tpXTtcblxuICAgICAgICAgICAgICAgIGRhdGEgPSBzLmRhdGE7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gcy5kYXRhcG9pbnRzLmZvcm1hdDtcblxuICAgICAgICAgICAgICAgIGlmICghZm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAvLyBmaW5kIG91dCBob3cgdG8gY29weVxuICAgICAgICAgICAgICAgICAgICBmb3JtYXQucHVzaCh7IHg6IHRydWUsIG51bWJlcjogdHJ1ZSwgcmVxdWlyZWQ6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdC5wdXNoKHsgeTogdHJ1ZSwgbnVtYmVyOiB0cnVlLCByZXF1aXJlZDogdHJ1ZSB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocy5iYXJzLnNob3cgfHwgKHMubGluZXMuc2hvdyAmJiBzLmxpbmVzLmZpbGwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXV0b3NjYWxlID0gISEoKHMuYmFycy5zaG93ICYmIHMuYmFycy56ZXJvKSB8fCAocy5saW5lcy5zaG93ICYmIHMubGluZXMuemVybykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0LnB1c2goeyB5OiB0cnVlLCBudW1iZXI6IHRydWUsIHJlcXVpcmVkOiBmYWxzZSwgZGVmYXVsdFZhbHVlOiAwLCBhdXRvc2NhbGU6IGF1dG9zY2FsZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzLmJhcnMuaG9yaXpvbnRhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBmb3JtYXRbZm9ybWF0Lmxlbmd0aCAtIDFdLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0W2Zvcm1hdC5sZW5ndGggLSAxXS54ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHMuZGF0YXBvaW50cy5mb3JtYXQgPSBmb3JtYXQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHMuZGF0YXBvaW50cy5wb2ludHNpemUgIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7IC8vIGFscmVhZHkgZmlsbGVkIGluXG5cbiAgICAgICAgICAgICAgICBzLmRhdGFwb2ludHMucG9pbnRzaXplID0gZm9ybWF0Lmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIHBzID0gcy5kYXRhcG9pbnRzLnBvaW50c2l6ZTtcbiAgICAgICAgICAgICAgICBwb2ludHMgPSBzLmRhdGFwb2ludHMucG9pbnRzO1xuXG4gICAgICAgICAgICAgICAgdmFyIGluc2VydFN0ZXBzID0gcy5saW5lcy5zaG93ICYmIHMubGluZXMuc3RlcHM7XG4gICAgICAgICAgICAgICAgcy54YXhpcy51c2VkID0gcy55YXhpcy51c2VkID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIGZvciAoaiA9IGsgPSAwOyBqIDwgZGF0YS5sZW5ndGg7ICsraiwgayArPSBwcykge1xuICAgICAgICAgICAgICAgICAgICBwID0gZGF0YVtqXTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbnVsbGlmeSA9IHAgPT0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFudWxsaWZ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKG0gPSAwOyBtIDwgcHM7ICsrbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IHBbbV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZiA9IGZvcm1hdFttXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmLm51bWJlciAmJiB2YWwgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gK3ZhbDsgLy8gY29udmVydCB0byBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc05hTih2YWwpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWwgPT0gSW5maW5pdHkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gZmFrZUluZmluaXR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodmFsID09IC1JbmZpbml0eSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSAtZmFrZUluZmluaXR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZi5yZXF1aXJlZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsaWZ5ID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGYuZGVmYXVsdFZhbHVlICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gZi5kZWZhdWx0VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludHNbayArIG1dID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG51bGxpZnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobSA9IDA7IG0gPCBwczsgKyttKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gcG9pbnRzW2sgKyBtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZiA9IGZvcm1hdFttXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXh0cmFjdCBtaW4vbWF4IGluZm9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGYuYXV0b3NjYWxlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGYueCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUF4aXMocy54YXhpcywgdmFsLCB2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGYueSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUF4aXMocy55YXhpcywgdmFsLCB2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50c1trICsgbV0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYSBsaXR0bGUgYml0IG9mIGxpbmUgc3BlY2lmaWMgc3R1ZmYgdGhhdFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGVyaGFwcyBzaG91bGRuJ3QgYmUgaGVyZSwgYnV0IGxhY2tpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJldHRlciBtZWFucy4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluc2VydFN0ZXBzICYmIGsgPiAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgcG9pbnRzW2sgLSBwc10gIT0gbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIHBvaW50c1trIC0gcHNdICE9IHBvaW50c1trXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIHBvaW50c1trIC0gcHMgKyAxXSAhPSBwb2ludHNbayArIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29weSB0aGUgcG9pbnQgdG8gbWFrZSByb29tIGZvciBhIG1pZGRsZSBwb2ludFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobSA9IDA7IG0gPCBwczsgKyttKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludHNbayArIHBzICsgbV0gPSBwb2ludHNbayArIG1dO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbWlkZGxlIHBvaW50IGhhcyBzYW1lIHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludHNbayArIDFdID0gcG9pbnRzW2sgLSBwcyArIDFdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UndmUgYWRkZWQgYSBwb2ludCwgYmV0dGVyIHJlZmxlY3QgdGhhdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGsgKz0gcHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGdpdmUgdGhlIGhvb2tzIGEgY2hhbmNlIHRvIHJ1blxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNlcmllcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIHMgPSBzZXJpZXNbaV07XG5cbiAgICAgICAgICAgICAgICBleGVjdXRlSG9va3MoaG9va3MucHJvY2Vzc0RhdGFwb2ludHMsIFsgcywgcy5kYXRhcG9pbnRzXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlY29uZCBwYXNzOiBmaW5kIGRhdGFtYXgvZGF0YW1pbiBmb3IgYXV0by1zY2FsaW5nXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2VyaWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgcyA9IHNlcmllc1tpXTtcbiAgICAgICAgICAgICAgICBwb2ludHMgPSBzLmRhdGFwb2ludHMucG9pbnRzO1xuICAgICAgICAgICAgICAgIHBzID0gcy5kYXRhcG9pbnRzLnBvaW50c2l6ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBzLmRhdGFwb2ludHMuZm9ybWF0O1xuXG4gICAgICAgICAgICAgICAgdmFyIHhtaW4gPSB0b3BTZW50cnksIHltaW4gPSB0b3BTZW50cnksXG4gICAgICAgICAgICAgICAgICAgIHhtYXggPSBib3R0b21TZW50cnksIHltYXggPSBib3R0b21TZW50cnk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgcG9pbnRzLmxlbmd0aDsgaiArPSBwcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9pbnRzW2pdID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKG0gPSAwOyBtIDwgcHM7ICsrbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gcG9pbnRzW2ogKyBtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGYgPSBmb3JtYXRbbV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWYgfHwgZi5hdXRvc2NhbGUgPT09IGZhbHNlIHx8IHZhbCA9PSBmYWtlSW5maW5pdHkgfHwgdmFsID09IC1mYWtlSW5maW5pdHkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmLngpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsIDwgeG1pbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeG1pbiA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsID4geG1heClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeG1heCA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmLnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsIDwgeW1pbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeW1pbiA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsID4geW1heClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeW1heCA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzLmJhcnMuc2hvdykge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgd2UgZ290IHJvb20gZm9yIHRoZSBiYXIgb24gdGhlIGRhbmNpbmcgZmxvb3JcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlbHRhO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocy5iYXJzLmFsaWduKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibGVmdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyaWdodFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhID0gLXMuYmFycy5iYXJXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGEgPSAtcy5iYXJzLmJhcldpZHRoIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzLmJhcnMuaG9yaXpvbnRhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeW1pbiArPSBkZWx0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHltYXggKz0gZGVsdGEgKyBzLmJhcnMuYmFyV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4bWluICs9IGRlbHRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgeG1heCArPSBkZWx0YSArIHMuYmFycy5iYXJXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHVwZGF0ZUF4aXMocy54YXhpcywgeG1pbiwgeG1heCk7XG4gICAgICAgICAgICAgICAgdXBkYXRlQXhpcyhzLnlheGlzLCB5bWluLCB5bWF4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJC5lYWNoKGFsbEF4ZXMoKSwgZnVuY3Rpb24gKF8sIGF4aXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXhpcy5kYXRhbWluID09IHRvcFNlbnRyeSlcbiAgICAgICAgICAgICAgICAgICAgYXhpcy5kYXRhbWluID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoYXhpcy5kYXRhbWF4ID09IGJvdHRvbVNlbnRyeSlcbiAgICAgICAgICAgICAgICAgICAgYXhpcy5kYXRhbWF4ID0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0dXBDYW52YXNlcygpIHtcblxuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBwbGFjZWhvbGRlciBpcyBjbGVhciBvZiBldmVyeXRoaW5nIGV4Y2VwdCBjYW52YXNlc1xuICAgICAgICAgICAgLy8gZnJvbSBhIHByZXZpb3VzIHBsb3QgaW4gdGhpcyBjb250YWluZXIgdGhhdCB3ZSdsbCB0cnkgdG8gcmUtdXNlLlxuXG4gICAgICAgICAgICBwbGFjZWhvbGRlci5jc3MoXCJwYWRkaW5nXCIsIDApIC8vIHBhZGRpbmcgbWVzc2VzIHVwIHRoZSBwb3NpdGlvbmluZ1xuICAgICAgICAgICAgICAgIC5jaGlsZHJlbigpLmZpbHRlcihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gISQodGhpcykuaGFzQ2xhc3MoXCJmbG90LW92ZXJsYXlcIikgJiYgISQodGhpcykuaGFzQ2xhc3MoJ2Zsb3QtYmFzZScpO1xuICAgICAgICAgICAgICAgIH0pLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICBpZiAocGxhY2Vob2xkZXIuY3NzKFwicG9zaXRpb25cIikgPT0gJ3N0YXRpYycpXG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIuY3NzKFwicG9zaXRpb25cIiwgXCJyZWxhdGl2ZVwiKTsgLy8gZm9yIHBvc2l0aW9uaW5nIGxhYmVscyBhbmQgb3ZlcmxheVxuXG4gICAgICAgICAgICBzdXJmYWNlID0gbmV3IENhbnZhcyhcImZsb3QtYmFzZVwiLCBwbGFjZWhvbGRlcik7XG4gICAgICAgICAgICBvdmVybGF5ID0gbmV3IENhbnZhcyhcImZsb3Qtb3ZlcmxheVwiLCBwbGFjZWhvbGRlcik7IC8vIG92ZXJsYXkgY2FudmFzIGZvciBpbnRlcmFjdGl2ZSBmZWF0dXJlc1xuXG4gICAgICAgICAgICBjdHggPSBzdXJmYWNlLmNvbnRleHQ7XG4gICAgICAgICAgICBvY3R4ID0gb3ZlcmxheS5jb250ZXh0O1xuXG4gICAgICAgICAgICAvLyBkZWZpbmUgd2hpY2ggZWxlbWVudCB3ZSdyZSBsaXN0ZW5pbmcgZm9yIGV2ZW50cyBvblxuICAgICAgICAgICAgZXZlbnRIb2xkZXIgPSAkKG92ZXJsYXkuZWxlbWVudCkudW5iaW5kKCk7XG5cbiAgICAgICAgICAgIC8vIElmIHdlJ3JlIHJlLXVzaW5nIGEgcGxvdCBvYmplY3QsIHNodXQgZG93biB0aGUgb2xkIG9uZVxuXG4gICAgICAgICAgICB2YXIgZXhpc3RpbmcgPSBwbGFjZWhvbGRlci5kYXRhKFwicGxvdFwiKTtcblxuICAgICAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICAgICAgZXhpc3Rpbmcuc2h1dGRvd24oKTtcbiAgICAgICAgICAgICAgICBvdmVybGF5LmNsZWFyKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNhdmUgaW4gY2FzZSB3ZSBnZXQgcmVwbG90dGVkXG4gICAgICAgICAgICBwbGFjZWhvbGRlci5kYXRhKFwicGxvdFwiLCBwbG90KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGJpbmRFdmVudHMoKSB7XG4gICAgICAgICAgICAvLyBiaW5kIGV2ZW50c1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZ3JpZC5ob3ZlcmFibGUpIHtcbiAgICAgICAgICAgICAgICBldmVudEhvbGRlci5tb3VzZW1vdmUob25Nb3VzZU1vdmUpO1xuXG4gICAgICAgICAgICAgICAgLy8gVXNlIGJpbmQsIHJhdGhlciB0aGFuIC5tb3VzZWxlYXZlLCBiZWNhdXNlIHdlIG9mZmljaWFsbHlcbiAgICAgICAgICAgICAgICAvLyBzdGlsbCBzdXBwb3J0IGpRdWVyeSAxLjIuNiwgd2hpY2ggZG9lc24ndCBkZWZpbmUgYSBzaG9ydGN1dFxuICAgICAgICAgICAgICAgIC8vIGZvciBtb3VzZWVudGVyIG9yIG1vdXNlbGVhdmUuICBUaGlzIHdhcyBhIGJ1Zy9vdmVyc2lnaHQgdGhhdFxuICAgICAgICAgICAgICAgIC8vIHdhcyBmaXhlZCBzb21ld2hlcmUgYXJvdW5kIDEuMy54LiAgV2UgY2FuIHJldHVybiB0byB1c2luZ1xuICAgICAgICAgICAgICAgIC8vIC5tb3VzZWxlYXZlIHdoZW4gd2UgZHJvcCBzdXBwb3J0IGZvciAxLjIuNi5cblxuICAgICAgICAgICAgICAgIGV2ZW50SG9sZGVyLmJpbmQoXCJtb3VzZWxlYXZlXCIsIG9uTW91c2VMZWF2ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmdyaWQuY2xpY2thYmxlKVxuICAgICAgICAgICAgICAgIGV2ZW50SG9sZGVyLmNsaWNrKG9uQ2xpY2spO1xuXG4gICAgICAgICAgICBleGVjdXRlSG9va3MoaG9va3MuYmluZEV2ZW50cywgW2V2ZW50SG9sZGVyXSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzaHV0ZG93bigpIHtcbiAgICAgICAgICAgIGlmIChyZWRyYXdUaW1lb3V0KVxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChyZWRyYXdUaW1lb3V0KTtcblxuICAgICAgICAgICAgZXZlbnRIb2xkZXIudW5iaW5kKFwibW91c2Vtb3ZlXCIsIG9uTW91c2VNb3ZlKTtcbiAgICAgICAgICAgIGV2ZW50SG9sZGVyLnVuYmluZChcIm1vdXNlbGVhdmVcIiwgb25Nb3VzZUxlYXZlKTtcbiAgICAgICAgICAgIGV2ZW50SG9sZGVyLnVuYmluZChcImNsaWNrXCIsIG9uQ2xpY2spO1xuXG4gICAgICAgICAgICBleGVjdXRlSG9va3MoaG9va3Muc2h1dGRvd24sIFtldmVudEhvbGRlcl0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0VHJhbnNmb3JtYXRpb25IZWxwZXJzKGF4aXMpIHtcbiAgICAgICAgICAgIC8vIHNldCBoZWxwZXIgZnVuY3Rpb25zIG9uIHRoZSBheGlzLCBhc3N1bWVzIHBsb3QgYXJlYVxuICAgICAgICAgICAgLy8gaGFzIGJlZW4gY29tcHV0ZWQgYWxyZWFkeVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBpZGVudGl0eSh4KSB7IHJldHVybiB4OyB9XG5cbiAgICAgICAgICAgIHZhciBzLCBtLCB0ID0gYXhpcy5vcHRpb25zLnRyYW5zZm9ybSB8fCBpZGVudGl0eSxcbiAgICAgICAgICAgICAgICBpdCA9IGF4aXMub3B0aW9ucy5pbnZlcnNlVHJhbnNmb3JtO1xuXG4gICAgICAgICAgICAvLyBwcmVjb21wdXRlIGhvdyBtdWNoIHRoZSBheGlzIGlzIHNjYWxpbmcgYSBwb2ludFxuICAgICAgICAgICAgLy8gaW4gY2FudmFzIHNwYWNlXG4gICAgICAgICAgICBpZiAoYXhpcy5kaXJlY3Rpb24gPT0gXCJ4XCIpIHtcbiAgICAgICAgICAgICAgICBzID0gYXhpcy5zY2FsZSA9IHBsb3RXaWR0aCAvIE1hdGguYWJzKHQoYXhpcy5tYXgpIC0gdChheGlzLm1pbikpO1xuICAgICAgICAgICAgICAgIG0gPSBNYXRoLm1pbih0KGF4aXMubWF4KSwgdChheGlzLm1pbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcyA9IGF4aXMuc2NhbGUgPSBwbG90SGVpZ2h0IC8gTWF0aC5hYnModChheGlzLm1heCkgLSB0KGF4aXMubWluKSk7XG4gICAgICAgICAgICAgICAgcyA9IC1zO1xuICAgICAgICAgICAgICAgIG0gPSBNYXRoLm1heCh0KGF4aXMubWF4KSwgdChheGlzLm1pbikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBkYXRhIHBvaW50IHRvIGNhbnZhcyBjb29yZGluYXRlXG4gICAgICAgICAgICBpZiAodCA9PSBpZGVudGl0eSkgLy8gc2xpZ2h0IG9wdGltaXphdGlvblxuICAgICAgICAgICAgICAgIGF4aXMucDJjID0gZnVuY3Rpb24gKHApIHsgcmV0dXJuIChwIC0gbSkgKiBzOyB9O1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGF4aXMucDJjID0gZnVuY3Rpb24gKHApIHsgcmV0dXJuICh0KHApIC0gbSkgKiBzOyB9O1xuICAgICAgICAgICAgLy8gY2FudmFzIGNvb3JkaW5hdGUgdG8gZGF0YSBwb2ludFxuICAgICAgICAgICAgaWYgKCFpdClcbiAgICAgICAgICAgICAgICBheGlzLmMycCA9IGZ1bmN0aW9uIChjKSB7IHJldHVybiBtICsgYyAvIHM7IH07XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYXhpcy5jMnAgPSBmdW5jdGlvbiAoYykgeyByZXR1cm4gaXQobSArIGMgLyBzKTsgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG1lYXN1cmVUaWNrTGFiZWxzKGF4aXMpIHtcblxuICAgICAgICAgICAgdmFyIG9wdHMgPSBheGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgdGlja3MgPSBheGlzLnRpY2tzIHx8IFtdLFxuICAgICAgICAgICAgICAgIGxhYmVsV2lkdGggPSBvcHRzLmxhYmVsV2lkdGggfHwgMCxcbiAgICAgICAgICAgICAgICBsYWJlbEhlaWdodCA9IG9wdHMubGFiZWxIZWlnaHQgfHwgMCxcbiAgICAgICAgICAgICAgICBtYXhXaWR0aCA9IGxhYmVsV2lkdGggfHwgKGF4aXMuZGlyZWN0aW9uID09IFwieFwiID8gTWF0aC5mbG9vcihzdXJmYWNlLndpZHRoIC8gKHRpY2tzLmxlbmd0aCB8fCAxKSkgOiBudWxsKSxcbiAgICAgICAgICAgICAgICBsZWdhY3lTdHlsZXMgPSBheGlzLmRpcmVjdGlvbiArIFwiQXhpcyBcIiArIGF4aXMuZGlyZWN0aW9uICsgYXhpcy5uICsgXCJBeGlzXCIsXG4gICAgICAgICAgICAgICAgbGF5ZXIgPSBcImZsb3QtXCIgKyBheGlzLmRpcmVjdGlvbiArIFwiLWF4aXMgZmxvdC1cIiArIGF4aXMuZGlyZWN0aW9uICsgYXhpcy5uICsgXCItYXhpcyBcIiArIGxlZ2FjeVN0eWxlcyxcbiAgICAgICAgICAgICAgICBmb250ID0gb3B0cy5mb250IHx8IFwiZmxvdC10aWNrLWxhYmVsIHRpY2tMYWJlbFwiO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRpY2tzLmxlbmd0aDsgKytpKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgdCA9IHRpY2tzW2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0LmxhYmVsKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIHZhciBpbmZvID0gc3VyZmFjZS5nZXRUZXh0SW5mbyhsYXllciwgdC5sYWJlbCwgZm9udCwgbnVsbCwgbWF4V2lkdGgpO1xuXG4gICAgICAgICAgICAgICAgbGFiZWxXaWR0aCA9IE1hdGgubWF4KGxhYmVsV2lkdGgsIGluZm8ud2lkdGgpO1xuICAgICAgICAgICAgICAgIGxhYmVsSGVpZ2h0ID0gTWF0aC5tYXgobGFiZWxIZWlnaHQsIGluZm8uaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXhpcy5sYWJlbFdpZHRoID0gb3B0cy5sYWJlbFdpZHRoIHx8IGxhYmVsV2lkdGg7XG4gICAgICAgICAgICBheGlzLmxhYmVsSGVpZ2h0ID0gb3B0cy5sYWJlbEhlaWdodCB8fCBsYWJlbEhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFsbG9jYXRlQXhpc0JveEZpcnN0UGhhc2UoYXhpcykge1xuICAgICAgICAgICAgLy8gZmluZCB0aGUgYm91bmRpbmcgYm94IG9mIHRoZSBheGlzIGJ5IGxvb2tpbmcgYXQgbGFiZWxcbiAgICAgICAgICAgIC8vIHdpZHRocy9oZWlnaHRzIGFuZCB0aWNrcywgbWFrZSByb29tIGJ5IGRpbWluaXNoaW5nIHRoZVxuICAgICAgICAgICAgLy8gcGxvdE9mZnNldDsgdGhpcyBmaXJzdCBwaGFzZSBvbmx5IGxvb2tzIGF0IG9uZVxuICAgICAgICAgICAgLy8gZGltZW5zaW9uIHBlciBheGlzLCB0aGUgb3RoZXIgZGltZW5zaW9uIGRlcGVuZHMgb24gdGhlXG4gICAgICAgICAgICAvLyBvdGhlciBheGVzIHNvIHdpbGwgaGF2ZSB0byB3YWl0XG5cbiAgICAgICAgICAgIHZhciBsdyA9IGF4aXMubGFiZWxXaWR0aCxcbiAgICAgICAgICAgICAgICBsaCA9IGF4aXMubGFiZWxIZWlnaHQsXG4gICAgICAgICAgICAgICAgcG9zID0gYXhpcy5vcHRpb25zLnBvc2l0aW9uLFxuICAgICAgICAgICAgICAgIGlzWEF4aXMgPSBheGlzLmRpcmVjdGlvbiA9PT0gXCJ4XCIsXG4gICAgICAgICAgICAgICAgdGlja0xlbmd0aCA9IGF4aXMub3B0aW9ucy50aWNrTGVuZ3RoLFxuICAgICAgICAgICAgICAgIGF4aXNNYXJnaW4gPSBvcHRpb25zLmdyaWQuYXhpc01hcmdpbixcbiAgICAgICAgICAgICAgICBwYWRkaW5nID0gb3B0aW9ucy5ncmlkLmxhYmVsTWFyZ2luLFxuICAgICAgICAgICAgICAgIGlubmVybW9zdCA9IHRydWUsXG4gICAgICAgICAgICAgICAgb3V0ZXJtb3N0ID0gdHJ1ZSxcbiAgICAgICAgICAgICAgICBmaXJzdCA9IHRydWUsXG4gICAgICAgICAgICAgICAgZm91bmQgPSBmYWxzZTtcblxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBheGlzJ3MgcG9zaXRpb24gaW4gaXRzIGRpcmVjdGlvbiBhbmQgb24gaXRzIHNpZGVcblxuICAgICAgICAgICAgJC5lYWNoKGlzWEF4aXMgPyB4YXhlcyA6IHlheGVzLCBmdW5jdGlvbihpLCBhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGEgJiYgYS5yZXNlcnZlU3BhY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGEgPT09IGF4aXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhLm9wdGlvbnMucG9zaXRpb24gPT09IHBvcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXJtb3N0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlubmVybW9zdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gVGhlIG91dGVybW9zdCBheGlzIG9uIGVhY2ggc2lkZSBoYXMgbm8gbWFyZ2luXG5cbiAgICAgICAgICAgIGlmIChvdXRlcm1vc3QpIHtcbiAgICAgICAgICAgICAgICBheGlzTWFyZ2luID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlIHRpY2tzIGZvciB0aGUgZmlyc3QgYXhpcyBpbiBlYWNoIGRpcmVjdGlvbiBzdHJldGNoIGFjcm9zc1xuXG4gICAgICAgICAgICBpZiAodGlja0xlbmd0aCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGlja0xlbmd0aCA9IGZpcnN0ID8gXCJmdWxsXCIgOiA1O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWlzTmFOKCt0aWNrTGVuZ3RoKSlcbiAgICAgICAgICAgICAgICBwYWRkaW5nICs9ICt0aWNrTGVuZ3RoO1xuXG4gICAgICAgICAgICBpZiAoaXNYQXhpcykge1xuICAgICAgICAgICAgICAgIGxoICs9IHBhZGRpbmc7XG5cbiAgICAgICAgICAgICAgICBpZiAocG9zID09IFwiYm90dG9tXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcGxvdE9mZnNldC5ib3R0b20gKz0gbGggKyBheGlzTWFyZ2luO1xuICAgICAgICAgICAgICAgICAgICBheGlzLmJveCA9IHsgdG9wOiBzdXJmYWNlLmhlaWdodCAtIHBsb3RPZmZzZXQuYm90dG9tLCBoZWlnaHQ6IGxoIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBheGlzLmJveCA9IHsgdG9wOiBwbG90T2Zmc2V0LnRvcCArIGF4aXNNYXJnaW4sIGhlaWdodDogbGggfTtcbiAgICAgICAgICAgICAgICAgICAgcGxvdE9mZnNldC50b3AgKz0gbGggKyBheGlzTWFyZ2luO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGx3ICs9IHBhZGRpbmc7XG5cbiAgICAgICAgICAgICAgICBpZiAocG9zID09IFwibGVmdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGF4aXMuYm94ID0geyBsZWZ0OiBwbG90T2Zmc2V0LmxlZnQgKyBheGlzTWFyZ2luLCB3aWR0aDogbHcgfTtcbiAgICAgICAgICAgICAgICAgICAgcGxvdE9mZnNldC5sZWZ0ICs9IGx3ICsgYXhpc01hcmdpbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBsb3RPZmZzZXQucmlnaHQgKz0gbHcgKyBheGlzTWFyZ2luO1xuICAgICAgICAgICAgICAgICAgICBheGlzLmJveCA9IHsgbGVmdDogc3VyZmFjZS53aWR0aCAtIHBsb3RPZmZzZXQucmlnaHQsIHdpZHRoOiBsdyB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgIC8vIHNhdmUgZm9yIGZ1dHVyZSByZWZlcmVuY2VcbiAgICAgICAgICAgIGF4aXMucG9zaXRpb24gPSBwb3M7XG4gICAgICAgICAgICBheGlzLnRpY2tMZW5ndGggPSB0aWNrTGVuZ3RoO1xuICAgICAgICAgICAgYXhpcy5ib3gucGFkZGluZyA9IHBhZGRpbmc7XG4gICAgICAgICAgICBheGlzLmlubmVybW9zdCA9IGlubmVybW9zdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFsbG9jYXRlQXhpc0JveFNlY29uZFBoYXNlKGF4aXMpIHtcbiAgICAgICAgICAgIC8vIG5vdyB0aGF0IGFsbCBheGlzIGJveGVzIGhhdmUgYmVlbiBwbGFjZWQgaW4gb25lXG4gICAgICAgICAgICAvLyBkaW1lbnNpb24sIHdlIGNhbiBzZXQgdGhlIHJlbWFpbmluZyBkaW1lbnNpb24gY29vcmRpbmF0ZXNcbiAgICAgICAgICAgIGlmIChheGlzLmRpcmVjdGlvbiA9PSBcInhcIikge1xuICAgICAgICAgICAgICAgIGF4aXMuYm94LmxlZnQgPSBwbG90T2Zmc2V0LmxlZnQgLSBheGlzLmxhYmVsV2lkdGggLyAyO1xuICAgICAgICAgICAgICAgIGF4aXMuYm94LndpZHRoID0gc3VyZmFjZS53aWR0aCAtIHBsb3RPZmZzZXQubGVmdCAtIHBsb3RPZmZzZXQucmlnaHQgKyBheGlzLmxhYmVsV2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBheGlzLmJveC50b3AgPSBwbG90T2Zmc2V0LnRvcCAtIGF4aXMubGFiZWxIZWlnaHQgLyAyO1xuICAgICAgICAgICAgICAgIGF4aXMuYm94LmhlaWdodCA9IHN1cmZhY2UuaGVpZ2h0IC0gcGxvdE9mZnNldC5ib3R0b20gLSBwbG90T2Zmc2V0LnRvcCArIGF4aXMubGFiZWxIZWlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZGp1c3RMYXlvdXRGb3JUaGluZ3NTdGlja2luZ091dCgpIHtcbiAgICAgICAgICAgIC8vIHBvc3NpYmx5IGFkanVzdCBwbG90IG9mZnNldCB0byBlbnN1cmUgZXZlcnl0aGluZyBzdGF5c1xuICAgICAgICAgICAgLy8gaW5zaWRlIHRoZSBjYW52YXMgYW5kIGlzbid0IGNsaXBwZWQgb2ZmXG5cbiAgICAgICAgICAgIHZhciBtaW5NYXJnaW4gPSBvcHRpb25zLmdyaWQubWluQm9yZGVyTWFyZ2luLFxuICAgICAgICAgICAgICAgIGF4aXMsIGk7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIHN0dWZmIGZyb20gdGhlIHBsb3QgKEZJWE1FOiB0aGlzIHNob3VsZCBqdXN0IHJlYWRcbiAgICAgICAgICAgIC8vIGEgdmFsdWUgZnJvbSB0aGUgc2VyaWVzLCBvdGhlcndpc2UgaXQncyBpbXBvc3NpYmxlIHRvXG4gICAgICAgICAgICAvLyBjdXN0b21pemUpXG4gICAgICAgICAgICBpZiAobWluTWFyZ2luID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBtaW5NYXJnaW4gPSAwO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzZXJpZXMubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgICAgIG1pbk1hcmdpbiA9IE1hdGgubWF4KG1pbk1hcmdpbiwgMiAqIChzZXJpZXNbaV0ucG9pbnRzLnJhZGl1cyArIHNlcmllc1tpXS5wb2ludHMubGluZVdpZHRoLzIpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG1hcmdpbnMgPSB7XG4gICAgICAgICAgICAgICAgbGVmdDogbWluTWFyZ2luLFxuICAgICAgICAgICAgICAgIHJpZ2h0OiBtaW5NYXJnaW4sXG4gICAgICAgICAgICAgICAgdG9wOiBtaW5NYXJnaW4sXG4gICAgICAgICAgICAgICAgYm90dG9tOiBtaW5NYXJnaW5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGF4aXMgbGFiZWxzLCBub3RlIHdlIGRvbid0IGNoZWNrIHRoZSBhY3R1YWxcbiAgICAgICAgICAgIC8vIGxhYmVscyBidXQgaW5zdGVhZCB1c2UgdGhlIG92ZXJhbGwgd2lkdGgvaGVpZ2h0IHRvIG5vdFxuICAgICAgICAgICAgLy8ganVtcCBhcyBtdWNoIGFyb3VuZCB3aXRoIHJlcGxvdHNcbiAgICAgICAgICAgICQuZWFjaChhbGxBeGVzKCksIGZ1bmN0aW9uIChfLCBheGlzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGF4aXMucmVzZXJ2ZVNwYWNlICYmIGF4aXMudGlja3MgJiYgYXhpcy50aWNrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RUaWNrID0gYXhpcy50aWNrc1theGlzLnRpY2tzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXhpcy5kaXJlY3Rpb24gPT09IFwieFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5zLmxlZnQgPSBNYXRoLm1heChtYXJnaW5zLmxlZnQsIGF4aXMubGFiZWxXaWR0aCAvIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RUaWNrLnYgPD0gYXhpcy5tYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5zLnJpZ2h0ID0gTWF0aC5tYXgobWFyZ2lucy5yaWdodCwgYXhpcy5sYWJlbFdpZHRoIC8gMik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5zLmJvdHRvbSA9IE1hdGgubWF4KG1hcmdpbnMuYm90dG9tLCBheGlzLmxhYmVsSGVpZ2h0IC8gMik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdFRpY2sudiA8PSBheGlzLm1heCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbnMudG9wID0gTWF0aC5tYXgobWFyZ2lucy50b3AsIGF4aXMubGFiZWxIZWlnaHQgLyAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBwbG90T2Zmc2V0LmxlZnQgPSBNYXRoLmNlaWwoTWF0aC5tYXgobWFyZ2lucy5sZWZ0LCBwbG90T2Zmc2V0LmxlZnQpKTtcbiAgICAgICAgICAgIHBsb3RPZmZzZXQucmlnaHQgPSBNYXRoLmNlaWwoTWF0aC5tYXgobWFyZ2lucy5yaWdodCwgcGxvdE9mZnNldC5yaWdodCkpO1xuICAgICAgICAgICAgcGxvdE9mZnNldC50b3AgPSBNYXRoLmNlaWwoTWF0aC5tYXgobWFyZ2lucy50b3AsIHBsb3RPZmZzZXQudG9wKSk7XG4gICAgICAgICAgICBwbG90T2Zmc2V0LmJvdHRvbSA9IE1hdGguY2VpbChNYXRoLm1heChtYXJnaW5zLmJvdHRvbSwgcGxvdE9mZnNldC5ib3R0b20pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNldHVwR3JpZCgpIHtcbiAgICAgICAgICAgIHZhciBpLCBheGVzID0gYWxsQXhlcygpLCBzaG93R3JpZCA9IG9wdGlvbnMuZ3JpZC5zaG93O1xuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBwbG90J3Mgb2Zmc2V0IGZyb20gdGhlIGVkZ2Ugb2YgdGhlIGNhbnZhc1xuXG4gICAgICAgICAgICBmb3IgKHZhciBhIGluIHBsb3RPZmZzZXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWFyZ2luID0gb3B0aW9ucy5ncmlkLm1hcmdpbiB8fCAwO1xuICAgICAgICAgICAgICAgIHBsb3RPZmZzZXRbYV0gPSB0eXBlb2YgbWFyZ2luID09IFwibnVtYmVyXCIgPyBtYXJnaW4gOiBtYXJnaW5bYV0gfHwgMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXhlY3V0ZUhvb2tzKGhvb2tzLnByb2Nlc3NPZmZzZXQsIFtwbG90T2Zmc2V0XSk7XG5cbiAgICAgICAgICAgIC8vIElmIHRoZSBncmlkIGlzIHZpc2libGUsIGFkZCBpdHMgYm9yZGVyIHdpZHRoIHRvIHRoZSBvZmZzZXRcblxuICAgICAgICAgICAgZm9yICh2YXIgYSBpbiBwbG90T2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgaWYodHlwZW9mKG9wdGlvbnMuZ3JpZC5ib3JkZXJXaWR0aCkgPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICBwbG90T2Zmc2V0W2FdICs9IHNob3dHcmlkID8gb3B0aW9ucy5ncmlkLmJvcmRlcldpZHRoW2FdIDogMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBsb3RPZmZzZXRbYV0gKz0gc2hvd0dyaWQgPyBvcHRpb25zLmdyaWQuYm9yZGVyV2lkdGggOiAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaW5pdCBheGVzXG4gICAgICAgICAgICAkLmVhY2goYXhlcywgZnVuY3Rpb24gKF8sIGF4aXMpIHtcbiAgICAgICAgICAgICAgICBheGlzLnNob3cgPSBheGlzLm9wdGlvbnMuc2hvdztcbiAgICAgICAgICAgICAgICBpZiAoYXhpcy5zaG93ID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIGF4aXMuc2hvdyA9IGF4aXMudXNlZDsgLy8gYnkgZGVmYXVsdCBhbiBheGlzIGlzIHZpc2libGUgaWYgaXQncyBnb3QgZGF0YVxuXG4gICAgICAgICAgICAgICAgYXhpcy5yZXNlcnZlU3BhY2UgPSBheGlzLnNob3cgfHwgYXhpcy5vcHRpb25zLnJlc2VydmVTcGFjZTtcblxuICAgICAgICAgICAgICAgIHNldFJhbmdlKGF4aXMpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChzaG93R3JpZCkge1xuXG4gICAgICAgICAgICAgICAgdmFyIGFsbG9jYXRlZEF4ZXMgPSAkLmdyZXAoYXhlcywgZnVuY3Rpb24gKGF4aXMpIHsgcmV0dXJuIGF4aXMucmVzZXJ2ZVNwYWNlOyB9KTtcblxuICAgICAgICAgICAgICAgICQuZWFjaChhbGxvY2F0ZWRBeGVzLCBmdW5jdGlvbiAoXywgYXhpcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHRoZSB0aWNrc1xuICAgICAgICAgICAgICAgICAgICBzZXR1cFRpY2tHZW5lcmF0aW9uKGF4aXMpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaWNrcyhheGlzKTtcbiAgICAgICAgICAgICAgICAgICAgc25hcFJhbmdlVG9UaWNrcyhheGlzLCBheGlzLnRpY2tzKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gZmluZCBsYWJlbFdpZHRoL0hlaWdodCBmb3IgYXhpc1xuICAgICAgICAgICAgICAgICAgICBtZWFzdXJlVGlja0xhYmVscyhheGlzKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIHdpdGggYWxsIGRpbWVuc2lvbnMgY2FsY3VsYXRlZCwgd2UgY2FuIGNvbXB1dGUgdGhlXG4gICAgICAgICAgICAgICAgLy8gYXhpcyBib3VuZGluZyBib3hlcywgc3RhcnQgZnJvbSB0aGUgb3V0c2lkZVxuICAgICAgICAgICAgICAgIC8vIChyZXZlcnNlIG9yZGVyKVxuICAgICAgICAgICAgICAgIGZvciAoaSA9IGFsbG9jYXRlZEF4ZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpXG4gICAgICAgICAgICAgICAgICAgIGFsbG9jYXRlQXhpc0JveEZpcnN0UGhhc2UoYWxsb2NhdGVkQXhlc1tpXSk7XG5cbiAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgd2UndmUgZ290IGVub3VnaCBzcGFjZSBmb3IgdGhpbmdzIHRoYXRcbiAgICAgICAgICAgICAgICAvLyBtaWdodCBzdGljayBvdXRcbiAgICAgICAgICAgICAgICBhZGp1c3RMYXlvdXRGb3JUaGluZ3NTdGlja2luZ091dCgpO1xuXG4gICAgICAgICAgICAgICAgJC5lYWNoKGFsbG9jYXRlZEF4ZXMsIGZ1bmN0aW9uIChfLCBheGlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbG9jYXRlQXhpc0JveFNlY29uZFBoYXNlKGF4aXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwbG90V2lkdGggPSBzdXJmYWNlLndpZHRoIC0gcGxvdE9mZnNldC5sZWZ0IC0gcGxvdE9mZnNldC5yaWdodDtcbiAgICAgICAgICAgIHBsb3RIZWlnaHQgPSBzdXJmYWNlLmhlaWdodCAtIHBsb3RPZmZzZXQuYm90dG9tIC0gcGxvdE9mZnNldC50b3A7XG5cbiAgICAgICAgICAgIC8vIG5vdyB3ZSBnb3QgdGhlIHByb3BlciBwbG90IGRpbWVuc2lvbnMsIHdlIGNhbiBjb21wdXRlIHRoZSBzY2FsaW5nXG4gICAgICAgICAgICAkLmVhY2goYXhlcywgZnVuY3Rpb24gKF8sIGF4aXMpIHtcbiAgICAgICAgICAgICAgICBzZXRUcmFuc2Zvcm1hdGlvbkhlbHBlcnMoYXhpcyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHNob3dHcmlkKSB7XG4gICAgICAgICAgICAgICAgZHJhd0F4aXNMYWJlbHMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5zZXJ0TGVnZW5kKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzZXRSYW5nZShheGlzKSB7XG4gICAgICAgICAgICB2YXIgb3B0cyA9IGF4aXMub3B0aW9ucyxcbiAgICAgICAgICAgICAgICBtaW4gPSArKG9wdHMubWluICE9IG51bGwgPyBvcHRzLm1pbiA6IGF4aXMuZGF0YW1pbiksXG4gICAgICAgICAgICAgICAgbWF4ID0gKyhvcHRzLm1heCAhPSBudWxsID8gb3B0cy5tYXggOiBheGlzLmRhdGFtYXgpLFxuICAgICAgICAgICAgICAgIGRlbHRhID0gbWF4IC0gbWluO1xuXG4gICAgICAgICAgICBpZiAoZGVsdGEgPT0gMC4wKSB7XG4gICAgICAgICAgICAgICAgLy8gZGVnZW5lcmF0ZSBjYXNlXG4gICAgICAgICAgICAgICAgdmFyIHdpZGVuID0gbWF4ID09IDAgPyAxIDogMC4wMTtcblxuICAgICAgICAgICAgICAgIGlmIChvcHRzLm1pbiA9PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICBtaW4gLT0gd2lkZW47XG4gICAgICAgICAgICAgICAgLy8gYWx3YXlzIHdpZGVuIG1heCBpZiB3ZSBjb3VsZG4ndCB3aWRlbiBtaW4gdG8gZW5zdXJlIHdlXG4gICAgICAgICAgICAgICAgLy8gZG9uJ3QgZmFsbCBpbnRvIG1pbiA9PSBtYXggd2hpY2ggZG9lc24ndCB3b3JrXG4gICAgICAgICAgICAgICAgaWYgKG9wdHMubWF4ID09IG51bGwgfHwgb3B0cy5taW4gIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgbWF4ICs9IHdpZGVuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc2lkZXIgYXV0b3NjYWxpbmdcbiAgICAgICAgICAgICAgICB2YXIgbWFyZ2luID0gb3B0cy5hdXRvc2NhbGVNYXJnaW47XG4gICAgICAgICAgICAgICAgaWYgKG1hcmdpbiAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLm1pbiA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW4gLT0gZGVsdGEgKiBtYXJnaW47XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgd2UgZG9uJ3QgZ28gYmVsb3cgemVybyBpZiBhbGwgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhcmUgcG9zaXRpdmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaW4gPCAwICYmIGF4aXMuZGF0YW1pbiAhPSBudWxsICYmIGF4aXMuZGF0YW1pbiA+PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbiA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMubWF4ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heCArPSBkZWx0YSAqIG1hcmdpbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXggPiAwICYmIGF4aXMuZGF0YW1heCAhPSBudWxsICYmIGF4aXMuZGF0YW1heCA8PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBheGlzLm1pbiA9IG1pbjtcbiAgICAgICAgICAgIGF4aXMubWF4ID0gbWF4O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0dXBUaWNrR2VuZXJhdGlvbihheGlzKSB7XG4gICAgICAgICAgICB2YXIgb3B0cyA9IGF4aXMub3B0aW9ucztcblxuICAgICAgICAgICAgLy8gZXN0aW1hdGUgbnVtYmVyIG9mIHRpY2tzXG4gICAgICAgICAgICB2YXIgbm9UaWNrcztcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0cy50aWNrcyA9PSBcIm51bWJlclwiICYmIG9wdHMudGlja3MgPiAwKVxuICAgICAgICAgICAgICAgIG5vVGlja3MgPSBvcHRzLnRpY2tzO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIC8vIGhldXJpc3RpYyBiYXNlZCBvbiB0aGUgbW9kZWwgYSpzcXJ0KHgpIGZpdHRlZCB0b1xuICAgICAgICAgICAgICAgIC8vIHNvbWUgZGF0YSBwb2ludHMgdGhhdCBzZWVtZWQgcmVhc29uYWJsZVxuICAgICAgICAgICAgICAgIG5vVGlja3MgPSAwLjMgKiBNYXRoLnNxcnQoYXhpcy5kaXJlY3Rpb24gPT0gXCJ4XCIgPyBzdXJmYWNlLndpZHRoIDogc3VyZmFjZS5oZWlnaHQpO1xuXG4gICAgICAgICAgICB2YXIgZGVsdGEgPSAoYXhpcy5tYXggLSBheGlzLm1pbikgLyBub1RpY2tzLFxuICAgICAgICAgICAgICAgIGRlYyA9IC1NYXRoLmZsb29yKE1hdGgubG9nKGRlbHRhKSAvIE1hdGguTE4xMCksXG4gICAgICAgICAgICAgICAgbWF4RGVjID0gb3B0cy50aWNrRGVjaW1hbHM7XG5cbiAgICAgICAgICAgIGlmIChtYXhEZWMgIT0gbnVsbCAmJiBkZWMgPiBtYXhEZWMpIHtcbiAgICAgICAgICAgICAgICBkZWMgPSBtYXhEZWM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBtYWduID0gTWF0aC5wb3coMTAsIC1kZWMpLFxuICAgICAgICAgICAgICAgIG5vcm0gPSBkZWx0YSAvIG1hZ24sIC8vIG5vcm0gaXMgYmV0d2VlbiAxLjAgYW5kIDEwLjBcbiAgICAgICAgICAgICAgICBzaXplO1xuXG4gICAgICAgICAgICBpZiAobm9ybSA8IDEuNSkge1xuICAgICAgICAgICAgICAgIHNpemUgPSAxO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChub3JtIDwgMykge1xuICAgICAgICAgICAgICAgIHNpemUgPSAyO1xuICAgICAgICAgICAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3IgMi41LCByZXF1aXJlcyBhbiBleHRyYSBkZWNpbWFsXG4gICAgICAgICAgICAgICAgaWYgKG5vcm0gPiAyLjI1ICYmIChtYXhEZWMgPT0gbnVsbCB8fCBkZWMgKyAxIDw9IG1heERlYykpIHtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZSA9IDIuNTtcbiAgICAgICAgICAgICAgICAgICAgKytkZWM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChub3JtIDwgNy41KSB7XG4gICAgICAgICAgICAgICAgc2l6ZSA9IDU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNpemUgPSAxMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2l6ZSAqPSBtYWduO1xuXG4gICAgICAgICAgICBpZiAob3B0cy5taW5UaWNrU2l6ZSAhPSBudWxsICYmIHNpemUgPCBvcHRzLm1pblRpY2tTaXplKSB7XG4gICAgICAgICAgICAgICAgc2l6ZSA9IG9wdHMubWluVGlja1NpemU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF4aXMuZGVsdGEgPSBkZWx0YTtcbiAgICAgICAgICAgIGF4aXMudGlja0RlY2ltYWxzID0gTWF0aC5tYXgoMCwgbWF4RGVjICE9IG51bGwgPyBtYXhEZWMgOiBkZWMpO1xuICAgICAgICAgICAgYXhpcy50aWNrU2l6ZSA9IG9wdHMudGlja1NpemUgfHwgc2l6ZTtcblxuICAgICAgICAgICAgLy8gVGltZSBtb2RlIHdhcyBtb3ZlZCB0byBhIHBsdWctaW4gaW4gMC44LCBidXQgc2luY2Ugc28gbWFueSBwZW9wbGUgdXNlIHRoaXNcbiAgICAgICAgICAgIC8vIHdlJ2xsIGFkZCBhbiBlc3BlY2lhbGx5IGZyaWVuZGx5IG1ha2Ugc3VyZSB0aGV5IHJlbWVtYmVyZWQgdG8gaW5jbHVkZSBpdC5cblxuICAgICAgICAgICAgaWYgKG9wdHMubW9kZSA9PSBcInRpbWVcIiAmJiAhYXhpcy50aWNrR2VuZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGltZSBtb2RlIHJlcXVpcmVzIHRoZSBmbG90LnRpbWUgcGx1Z2luLlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmxvdCBzdXBwb3J0cyBiYXNlLTEwIGF4ZXM7IGFueSBvdGhlciBtb2RlIGVsc2UgaXMgaGFuZGxlZCBieSBhIHBsdWctaW4sXG4gICAgICAgICAgICAvLyBsaWtlIGZsb3QudGltZS5qcy5cblxuICAgICAgICAgICAgaWYgKCFheGlzLnRpY2tHZW5lcmF0b3IpIHtcblxuICAgICAgICAgICAgICAgIGF4aXMudGlja0dlbmVyYXRvciA9IGZ1bmN0aW9uIChheGlzKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRpY2tzID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydCA9IGZsb29ySW5CYXNlKGF4aXMubWluLCBheGlzLnRpY2tTaXplKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgdiA9IE51bWJlci5OYU4sXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2O1xuXG4gICAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXYgPSB2O1xuICAgICAgICAgICAgICAgICAgICAgICAgdiA9IHN0YXJ0ICsgaSAqIGF4aXMudGlja1NpemU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrcy5wdXNoKHYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgKytpO1xuICAgICAgICAgICAgICAgICAgICB9IHdoaWxlICh2IDwgYXhpcy5tYXggJiYgdiAhPSBwcmV2KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRpY2tzO1xuICAgICAgICAgICAgICAgIH07XG5cblx0XHRcdFx0YXhpcy50aWNrRm9ybWF0dGVyID0gZnVuY3Rpb24gKHZhbHVlLCBheGlzKSB7XG5cblx0XHRcdFx0XHR2YXIgZmFjdG9yID0gYXhpcy50aWNrRGVjaW1hbHMgPyBNYXRoLnBvdygxMCwgYXhpcy50aWNrRGVjaW1hbHMpIDogMTtcblx0XHRcdFx0XHR2YXIgZm9ybWF0dGVkID0gXCJcIiArIE1hdGgucm91bmQodmFsdWUgKiBmYWN0b3IpIC8gZmFjdG9yO1xuXG5cdFx0XHRcdFx0Ly8gSWYgdGlja0RlY2ltYWxzIHdhcyBzcGVjaWZpZWQsIGVuc3VyZSB0aGF0IHdlIGhhdmUgZXhhY3RseSB0aGF0XG5cdFx0XHRcdFx0Ly8gbXVjaCBwcmVjaXNpb247IG90aGVyd2lzZSBkZWZhdWx0IHRvIHRoZSB2YWx1ZSdzIG93biBwcmVjaXNpb24uXG5cblx0XHRcdFx0XHRpZiAoYXhpcy50aWNrRGVjaW1hbHMgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0dmFyIGRlY2ltYWwgPSBmb3JtYXR0ZWQuaW5kZXhPZihcIi5cIik7XG5cdFx0XHRcdFx0XHR2YXIgcHJlY2lzaW9uID0gZGVjaW1hbCA9PSAtMSA/IDAgOiBmb3JtYXR0ZWQubGVuZ3RoIC0gZGVjaW1hbCAtIDE7XG5cdFx0XHRcdFx0XHRpZiAocHJlY2lzaW9uIDwgYXhpcy50aWNrRGVjaW1hbHMpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIChwcmVjaXNpb24gPyBmb3JtYXR0ZWQgOiBmb3JtYXR0ZWQgKyBcIi5cIikgKyAoXCJcIiArIGZhY3Rvcikuc3Vic3RyKDEsIGF4aXMudGlja0RlY2ltYWxzIC0gcHJlY2lzaW9uKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdHRlZDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKG9wdHMudGlja0Zvcm1hdHRlcikpXG4gICAgICAgICAgICAgICAgYXhpcy50aWNrRm9ybWF0dGVyID0gZnVuY3Rpb24gKHYsIGF4aXMpIHsgcmV0dXJuIFwiXCIgKyBvcHRzLnRpY2tGb3JtYXR0ZXIodiwgYXhpcyk7IH07XG5cbiAgICAgICAgICAgIGlmIChvcHRzLmFsaWduVGlja3NXaXRoQXhpcyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIG90aGVyQXhpcyA9IChheGlzLmRpcmVjdGlvbiA9PSBcInhcIiA/IHhheGVzIDogeWF4ZXMpW29wdHMuYWxpZ25UaWNrc1dpdGhBeGlzIC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKG90aGVyQXhpcyAmJiBvdGhlckF4aXMudXNlZCAmJiBvdGhlckF4aXMgIT0gYXhpcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zaWRlciBzbmFwcGluZyBtaW4vbWF4IHRvIG91dGVybW9zdCBuaWNlIHRpY2tzXG4gICAgICAgICAgICAgICAgICAgIHZhciBuaWNlVGlja3MgPSBheGlzLnRpY2tHZW5lcmF0b3IoYXhpcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuaWNlVGlja3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMubWluID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXhpcy5taW4gPSBNYXRoLm1pbihheGlzLm1pbiwgbmljZVRpY2tzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLm1heCA9PSBudWxsICYmIG5pY2VUaWNrcy5sZW5ndGggPiAxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF4aXMubWF4ID0gTWF0aC5tYXgoYXhpcy5tYXgsIG5pY2VUaWNrc1tuaWNlVGlja3MubGVuZ3RoIC0gMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYXhpcy50aWNrR2VuZXJhdG9yID0gZnVuY3Rpb24gKGF4aXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvcHkgdGlja3MsIHNjYWxlZCB0byB0aGlzIGF4aXNcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aWNrcyA9IFtdLCB2LCBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG90aGVyQXhpcy50aWNrcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYgPSAob3RoZXJBeGlzLnRpY2tzW2ldLnYgLSBvdGhlckF4aXMubWluKSAvIChvdGhlckF4aXMubWF4IC0gb3RoZXJBeGlzLm1pbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdiA9IGF4aXMubWluICsgdiAqIChheGlzLm1heCAtIGF4aXMubWluKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aWNrcy5wdXNoKHYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRpY2tzO1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIG1pZ2h0IG5lZWQgYW4gZXh0cmEgZGVjaW1hbCBzaW5jZSBmb3JjZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gdGlja3MgZG9uJ3QgbmVjZXNzYXJpbHkgZml0IG5hdHVyYWxseVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWF4aXMubW9kZSAmJiBvcHRzLnRpY2tEZWNpbWFscyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXh0cmFEZWMgPSBNYXRoLm1heCgwLCAtTWF0aC5mbG9vcihNYXRoLmxvZyhheGlzLmRlbHRhKSAvIE1hdGguTE4xMCkgKyAxKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cyA9IGF4aXMudGlja0dlbmVyYXRvcihheGlzKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25seSBwcm9jZWVkIGlmIHRoZSB0aWNrIGludGVydmFsIHJvdW5kZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpdGggYW4gZXh0cmEgZGVjaW1hbCBkb2Vzbid0IGdpdmUgdXMgYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gemVybyBhdCBlbmRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKHRzLmxlbmd0aCA+IDEgJiYgL1xcLi4qMCQvLnRlc3QoKHRzWzFdIC0gdHNbMF0pLnRvRml4ZWQoZXh0cmFEZWMpKSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXhpcy50aWNrRGVjaW1hbHMgPSBleHRyYURlYztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNldFRpY2tzKGF4aXMpIHtcbiAgICAgICAgICAgIHZhciBvdGlja3MgPSBheGlzLm9wdGlvbnMudGlja3MsIHRpY2tzID0gW107XG4gICAgICAgICAgICBpZiAob3RpY2tzID09IG51bGwgfHwgKHR5cGVvZiBvdGlja3MgPT0gXCJudW1iZXJcIiAmJiBvdGlja3MgPiAwKSlcbiAgICAgICAgICAgICAgICB0aWNrcyA9IGF4aXMudGlja0dlbmVyYXRvcihheGlzKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKG90aWNrcykge1xuICAgICAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob3RpY2tzKSlcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2VuZXJhdGUgdGhlIHRpY2tzXG4gICAgICAgICAgICAgICAgICAgIHRpY2tzID0gb3RpY2tzKGF4aXMpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGlja3MgPSBvdGlja3M7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNsZWFuIHVwL2xhYmVsaWZ5IHRoZSBzdXBwbGllZCB0aWNrcywgY29weSB0aGVtIG92ZXJcbiAgICAgICAgICAgIHZhciBpLCB2O1xuICAgICAgICAgICAgYXhpcy50aWNrcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRpY2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB2YXIgdCA9IHRpY2tzW2ldO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdCA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHYgPSArdFswXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQubGVuZ3RoID4gMSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsID0gdFsxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB2ID0gK3Q7XG4gICAgICAgICAgICAgICAgaWYgKGxhYmVsID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsID0gYXhpcy50aWNrRm9ybWF0dGVyKHYsIGF4aXMpO1xuICAgICAgICAgICAgICAgIGlmICghaXNOYU4odikpXG4gICAgICAgICAgICAgICAgICAgIGF4aXMudGlja3MucHVzaCh7IHY6IHYsIGxhYmVsOiBsYWJlbCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNuYXBSYW5nZVRvVGlja3MoYXhpcywgdGlja3MpIHtcbiAgICAgICAgICAgIGlmIChheGlzLm9wdGlvbnMuYXV0b3NjYWxlTWFyZ2luICYmIHRpY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyBzbmFwIHRvIHRpY2tzXG4gICAgICAgICAgICAgICAgaWYgKGF4aXMub3B0aW9ucy5taW4gPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgYXhpcy5taW4gPSBNYXRoLm1pbihheGlzLm1pbiwgdGlja3NbMF0udik7XG4gICAgICAgICAgICAgICAgaWYgKGF4aXMub3B0aW9ucy5tYXggPT0gbnVsbCAmJiB0aWNrcy5sZW5ndGggPiAxKVxuICAgICAgICAgICAgICAgICAgICBheGlzLm1heCA9IE1hdGgubWF4KGF4aXMubWF4LCB0aWNrc1t0aWNrcy5sZW5ndGggLSAxXS52KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRyYXcoKSB7XG5cbiAgICAgICAgICAgIHN1cmZhY2UuY2xlYXIoKTtcblxuICAgICAgICAgICAgZXhlY3V0ZUhvb2tzKGhvb2tzLmRyYXdCYWNrZ3JvdW5kLCBbY3R4XSk7XG5cbiAgICAgICAgICAgIHZhciBncmlkID0gb3B0aW9ucy5ncmlkO1xuXG4gICAgICAgICAgICAvLyBkcmF3IGJhY2tncm91bmQsIGlmIGFueVxuICAgICAgICAgICAgaWYgKGdyaWQuc2hvdyAmJiBncmlkLmJhY2tncm91bmRDb2xvcilcbiAgICAgICAgICAgICAgICBkcmF3QmFja2dyb3VuZCgpO1xuXG4gICAgICAgICAgICBpZiAoZ3JpZC5zaG93ICYmICFncmlkLmFib3ZlRGF0YSkge1xuICAgICAgICAgICAgICAgIGRyYXdHcmlkKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VyaWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgZXhlY3V0ZUhvb2tzKGhvb2tzLmRyYXdTZXJpZXMsIFtjdHgsIHNlcmllc1tpXV0pO1xuICAgICAgICAgICAgICAgIGRyYXdTZXJpZXMoc2VyaWVzW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXhlY3V0ZUhvb2tzKGhvb2tzLmRyYXcsIFtjdHhdKTtcblxuICAgICAgICAgICAgaWYgKGdyaWQuc2hvdyAmJiBncmlkLmFib3ZlRGF0YSkge1xuICAgICAgICAgICAgICAgIGRyYXdHcmlkKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN1cmZhY2UucmVuZGVyKCk7XG5cbiAgICAgICAgICAgIC8vIEEgZHJhdyBpbXBsaWVzIHRoYXQgZWl0aGVyIHRoZSBheGVzIG9yIGRhdGEgaGF2ZSBjaGFuZ2VkLCBzbyB3ZVxuICAgICAgICAgICAgLy8gc2hvdWxkIHByb2JhYmx5IHVwZGF0ZSB0aGUgb3ZlcmxheSBoaWdobGlnaHRzIGFzIHdlbGwuXG5cbiAgICAgICAgICAgIHRyaWdnZXJSZWRyYXdPdmVybGF5KCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBleHRyYWN0UmFuZ2UocmFuZ2VzLCBjb29yZCkge1xuICAgICAgICAgICAgdmFyIGF4aXMsIGZyb20sIHRvLCBrZXksIGF4ZXMgPSBhbGxBeGVzKCk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXhlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGF4aXMgPSBheGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChheGlzLmRpcmVjdGlvbiA9PSBjb29yZCkge1xuICAgICAgICAgICAgICAgICAgICBrZXkgPSBjb29yZCArIGF4aXMubiArIFwiYXhpc1wiO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJhbmdlc1trZXldICYmIGF4aXMubiA9PSAxKVxuICAgICAgICAgICAgICAgICAgICAgICAga2V5ID0gY29vcmQgKyBcImF4aXNcIjsgLy8gc3VwcG9ydCB4MWF4aXMgYXMgeGF4aXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJhbmdlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tID0gcmFuZ2VzW2tleV0uZnJvbTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvID0gcmFuZ2VzW2tleV0udG87XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gYmFja3dhcmRzLWNvbXBhdCBzdHVmZiAtIHRvIGJlIHJlbW92ZWQgaW4gZnV0dXJlXG4gICAgICAgICAgICBpZiAoIXJhbmdlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgYXhpcyA9IGNvb3JkID09IFwieFwiID8geGF4ZXNbMF0gOiB5YXhlc1swXTtcbiAgICAgICAgICAgICAgICBmcm9tID0gcmFuZ2VzW2Nvb3JkICsgXCIxXCJdO1xuICAgICAgICAgICAgICAgIHRvID0gcmFuZ2VzW2Nvb3JkICsgXCIyXCJdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBhdXRvLXJldmVyc2UgYXMgYW4gYWRkZWQgYm9udXNcbiAgICAgICAgICAgIGlmIChmcm9tICE9IG51bGwgJiYgdG8gIT0gbnVsbCAmJiBmcm9tID4gdG8pIHtcbiAgICAgICAgICAgICAgICB2YXIgdG1wID0gZnJvbTtcbiAgICAgICAgICAgICAgICBmcm9tID0gdG87XG4gICAgICAgICAgICAgICAgdG8gPSB0bXA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7IGZyb206IGZyb20sIHRvOiB0bywgYXhpczogYXhpcyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZHJhd0JhY2tncm91bmQoKSB7XG4gICAgICAgICAgICBjdHguc2F2ZSgpO1xuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShwbG90T2Zmc2V0LmxlZnQsIHBsb3RPZmZzZXQudG9wKTtcblxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGdldENvbG9yT3JHcmFkaWVudChvcHRpb25zLmdyaWQuYmFja2dyb3VuZENvbG9yLCBwbG90SGVpZ2h0LCAwLCBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIik7XG4gICAgICAgICAgICBjdHguZmlsbFJlY3QoMCwgMCwgcGxvdFdpZHRoLCBwbG90SGVpZ2h0KTtcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkcmF3R3JpZCgpIHtcbiAgICAgICAgICAgIHZhciBpLCBheGVzLCBidywgYmM7XG5cbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XG4gICAgICAgICAgICBjdHgudHJhbnNsYXRlKHBsb3RPZmZzZXQubGVmdCwgcGxvdE9mZnNldC50b3ApO1xuXG4gICAgICAgICAgICAvLyBkcmF3IG1hcmtpbmdzXG4gICAgICAgICAgICB2YXIgbWFya2luZ3MgPSBvcHRpb25zLmdyaWQubWFya2luZ3M7XG4gICAgICAgICAgICBpZiAobWFya2luZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKG1hcmtpbmdzKSkge1xuICAgICAgICAgICAgICAgICAgICBheGVzID0gcGxvdC5nZXRBeGVzKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHhtaW4gZXRjLiBpcyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSwgdG8gYmVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlZCBpbiB0aGUgZnV0dXJlXG4gICAgICAgICAgICAgICAgICAgIGF4ZXMueG1pbiA9IGF4ZXMueGF4aXMubWluO1xuICAgICAgICAgICAgICAgICAgICBheGVzLnhtYXggPSBheGVzLnhheGlzLm1heDtcbiAgICAgICAgICAgICAgICAgICAgYXhlcy55bWluID0gYXhlcy55YXhpcy5taW47XG4gICAgICAgICAgICAgICAgICAgIGF4ZXMueW1heCA9IGF4ZXMueWF4aXMubWF4O1xuXG4gICAgICAgICAgICAgICAgICAgIG1hcmtpbmdzID0gbWFya2luZ3MoYXhlcyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG1hcmtpbmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtID0gbWFya2luZ3NbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICB4cmFuZ2UgPSBleHRyYWN0UmFuZ2UobSwgXCJ4XCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgeXJhbmdlID0gZXh0cmFjdFJhbmdlKG0sIFwieVwiKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBmaWxsIGluIG1pc3NpbmdcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhyYW5nZS5mcm9tID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICB4cmFuZ2UuZnJvbSA9IHhyYW5nZS5heGlzLm1pbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhyYW5nZS50byA9PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgeHJhbmdlLnRvID0geHJhbmdlLmF4aXMubWF4O1xuICAgICAgICAgICAgICAgICAgICBpZiAoeXJhbmdlLmZyb20gPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIHlyYW5nZS5mcm9tID0geXJhbmdlLmF4aXMubWluO1xuICAgICAgICAgICAgICAgICAgICBpZiAoeXJhbmdlLnRvID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICB5cmFuZ2UudG8gPSB5cmFuZ2UuYXhpcy5tYXg7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2xpcFxuICAgICAgICAgICAgICAgICAgICBpZiAoeHJhbmdlLnRvIDwgeHJhbmdlLmF4aXMubWluIHx8IHhyYW5nZS5mcm9tID4geHJhbmdlLmF4aXMubWF4IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICB5cmFuZ2UudG8gPCB5cmFuZ2UuYXhpcy5taW4gfHwgeXJhbmdlLmZyb20gPiB5cmFuZ2UuYXhpcy5tYXgpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICB4cmFuZ2UuZnJvbSA9IE1hdGgubWF4KHhyYW5nZS5mcm9tLCB4cmFuZ2UuYXhpcy5taW4pO1xuICAgICAgICAgICAgICAgICAgICB4cmFuZ2UudG8gPSBNYXRoLm1pbih4cmFuZ2UudG8sIHhyYW5nZS5heGlzLm1heCk7XG4gICAgICAgICAgICAgICAgICAgIHlyYW5nZS5mcm9tID0gTWF0aC5tYXgoeXJhbmdlLmZyb20sIHlyYW5nZS5heGlzLm1pbik7XG4gICAgICAgICAgICAgICAgICAgIHlyYW5nZS50byA9IE1hdGgubWluKHlyYW5nZS50bywgeXJhbmdlLmF4aXMubWF4KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoeHJhbmdlLmZyb20gPT0geHJhbmdlLnRvICYmIHlyYW5nZS5mcm9tID09IHlyYW5nZS50bylcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gZHJhd1xuICAgICAgICAgICAgICAgICAgICB4cmFuZ2UuZnJvbSA9IHhyYW5nZS5heGlzLnAyYyh4cmFuZ2UuZnJvbSk7XG4gICAgICAgICAgICAgICAgICAgIHhyYW5nZS50byA9IHhyYW5nZS5heGlzLnAyYyh4cmFuZ2UudG8pO1xuICAgICAgICAgICAgICAgICAgICB5cmFuZ2UuZnJvbSA9IHlyYW5nZS5heGlzLnAyYyh5cmFuZ2UuZnJvbSk7XG4gICAgICAgICAgICAgICAgICAgIHlyYW5nZS50byA9IHlyYW5nZS5heGlzLnAyYyh5cmFuZ2UudG8pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh4cmFuZ2UuZnJvbSA9PSB4cmFuZ2UudG8gfHwgeXJhbmdlLmZyb20gPT0geXJhbmdlLnRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkcmF3IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IG0uY29sb3IgfHwgb3B0aW9ucy5ncmlkLm1hcmtpbmdzQ29sb3I7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gbS5saW5lV2lkdGggfHwgb3B0aW9ucy5ncmlkLm1hcmtpbmdzTGluZVdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh4cmFuZ2UuZnJvbSwgeXJhbmdlLmZyb20pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4cmFuZ2UudG8sIHlyYW5nZS50byk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaWxsIGFyZWFcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBtLmNvbG9yIHx8IG9wdGlvbnMuZ3JpZC5tYXJraW5nc0NvbG9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHhyYW5nZS5mcm9tLCB5cmFuZ2UudG8sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeHJhbmdlLnRvIC0geHJhbmdlLmZyb20sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeXJhbmdlLmZyb20gLSB5cmFuZ2UudG8pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBkcmF3IHRoZSB0aWNrc1xuICAgICAgICAgICAgYXhlcyA9IGFsbEF4ZXMoKTtcbiAgICAgICAgICAgIGJ3ID0gb3B0aW9ucy5ncmlkLmJvcmRlcldpZHRoO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGF4ZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICB2YXIgYXhpcyA9IGF4ZXNbal0sIGJveCA9IGF4aXMuYm94LFxuICAgICAgICAgICAgICAgICAgICB0ID0gYXhpcy50aWNrTGVuZ3RoLCB4LCB5LCB4b2ZmLCB5b2ZmO1xuICAgICAgICAgICAgICAgIGlmICghYXhpcy5zaG93IHx8IGF4aXMudGlja3MubGVuZ3RoID09IDApXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDE7XG5cbiAgICAgICAgICAgICAgICAvLyBmaW5kIHRoZSBlZGdlc1xuICAgICAgICAgICAgICAgIGlmIChheGlzLmRpcmVjdGlvbiA9PSBcInhcIikge1xuICAgICAgICAgICAgICAgICAgICB4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgPT0gXCJmdWxsXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gKGF4aXMucG9zaXRpb24gPT0gXCJ0b3BcIiA/IDAgOiBwbG90SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IGJveC50b3AgLSBwbG90T2Zmc2V0LnRvcCArIChheGlzLnBvc2l0aW9uID09IFwidG9wXCIgPyBib3guaGVpZ2h0IDogMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB5ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgPT0gXCJmdWxsXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gKGF4aXMucG9zaXRpb24gPT0gXCJsZWZ0XCIgPyAwIDogcGxvdFdpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGJveC5sZWZ0IC0gcGxvdE9mZnNldC5sZWZ0ICsgKGF4aXMucG9zaXRpb24gPT0gXCJsZWZ0XCIgPyBib3gud2lkdGggOiAwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBkcmF3IHRpY2sgYmFyXG4gICAgICAgICAgICAgICAgaWYgKCFheGlzLmlubmVybW9zdCkge1xuICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBheGlzLm9wdGlvbnMuY29sb3I7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgeG9mZiA9IHlvZmYgPSAwO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXhpcy5kaXJlY3Rpb24gPT0gXCJ4XCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB4b2ZmID0gcGxvdFdpZHRoICsgMTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgeW9mZiA9IHBsb3RIZWlnaHQgKyAxO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHgubGluZVdpZHRoID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChheGlzLmRpcmVjdGlvbiA9PSBcInhcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgPSBNYXRoLmZsb29yKHkpICsgMC41O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ID0gTWF0aC5mbG9vcih4KSArIDAuNTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeCArIHhvZmYsIHkgKyB5b2ZmKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGRyYXcgdGlja3NcblxuICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGF4aXMub3B0aW9ucy50aWNrQ29sb3I7XG5cbiAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGF4aXMudGlja3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHYgPSBheGlzLnRpY2tzW2ldLnY7XG5cbiAgICAgICAgICAgICAgICAgICAgeG9mZiA9IHlvZmYgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc05hTih2KSB8fCB2IDwgYXhpcy5taW4gfHwgdiA+IGF4aXMubWF4XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIHRob3NlIGx5aW5nIG9uIHRoZSBheGVzIGlmIHdlIGdvdCBhIGJvcmRlclxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgKHQgPT0gXCJmdWxsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoKHR5cGVvZiBidyA9PSBcIm9iamVjdFwiICYmIGJ3W2F4aXMucG9zaXRpb25dID4gMCkgfHwgYncgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmICh2ID09IGF4aXMubWluIHx8IHYgPT0gYXhpcy5tYXgpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChheGlzLmRpcmVjdGlvbiA9PSBcInhcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGF4aXMucDJjKHYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgeW9mZiA9IHQgPT0gXCJmdWxsXCIgPyAtcGxvdEhlaWdodCA6IHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChheGlzLnBvc2l0aW9uID09IFwidG9wXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeW9mZiA9IC15b2ZmO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IGF4aXMucDJjKHYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgeG9mZiA9IHQgPT0gXCJmdWxsXCIgPyAtcGxvdFdpZHRoIDogdDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF4aXMucG9zaXRpb24gPT0gXCJsZWZ0XCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeG9mZiA9IC14b2ZmO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN0eC5saW5lV2lkdGggPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF4aXMuZGlyZWN0aW9uID09IFwieFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPSBNYXRoLmZsb29yKHgpICsgMC41O1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgPSBNYXRoLmZsb29yKHkpICsgMC41O1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4ICsgeG9mZiwgeSArIHlvZmYpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAvLyBkcmF3IGJvcmRlclxuICAgICAgICAgICAgaWYgKGJ3KSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgZWl0aGVyIGJvcmRlcldpZHRoIG9yIGJvcmRlckNvbG9yIGlzIGFuIG9iamVjdCwgdGhlbiBkcmF3IHRoZSBib3JkZXJcbiAgICAgICAgICAgICAgICAvLyBsaW5lIGJ5IGxpbmUgaW5zdGVhZCBvZiBhcyBvbmUgcmVjdGFuZ2xlXG4gICAgICAgICAgICAgICAgYmMgPSBvcHRpb25zLmdyaWQuYm9yZGVyQ29sb3I7XG4gICAgICAgICAgICAgICAgaWYodHlwZW9mIGJ3ID09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGJjID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBidyAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYncgPSB7dG9wOiBidywgcmlnaHQ6IGJ3LCBib3R0b206IGJ3LCBsZWZ0OiBid307XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBiYyAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmMgPSB7dG9wOiBiYywgcmlnaHQ6IGJjLCBib3R0b206IGJjLCBsZWZ0OiBiY307XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoYncudG9wID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gYmMudG9wO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IGJ3LnRvcDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oMCAtIGJ3LmxlZnQsIDAgLSBidy50b3AvMik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHBsb3RXaWR0aCwgMCAtIGJ3LnRvcC8yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChidy5yaWdodCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGJjLnJpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IGJ3LnJpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhwbG90V2lkdGggKyBidy5yaWdodCAvIDIsIDAgLSBidy50b3ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhwbG90V2lkdGggKyBidy5yaWdodCAvIDIsIHBsb3RIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ3LmJvdHRvbSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGJjLmJvdHRvbTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBidy5ib3R0b207XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHBsb3RXaWR0aCArIGJ3LnJpZ2h0LCBwbG90SGVpZ2h0ICsgYncuYm90dG9tIC8gMik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKDAsIHBsb3RIZWlnaHQgKyBidy5ib3R0b20gLyAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChidy5sZWZ0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gYmMubGVmdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBidy5sZWZ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbygwIC0gYncubGVmdC8yLCBwbG90SGVpZ2h0ICsgYncuYm90dG9tKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oMC0gYncubGVmdC8yLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IGJ3O1xuICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBvcHRpb25zLmdyaWQuYm9yZGVyQ29sb3I7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VSZWN0KC1idy8yLCAtYncvMiwgcGxvdFdpZHRoICsgYncsIHBsb3RIZWlnaHQgKyBidyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZHJhd0F4aXNMYWJlbHMoKSB7XG5cbiAgICAgICAgICAgICQuZWFjaChhbGxBeGVzKCksIGZ1bmN0aW9uIChfLCBheGlzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJveCA9IGF4aXMuYm94LFxuICAgICAgICAgICAgICAgICAgICBsZWdhY3lTdHlsZXMgPSBheGlzLmRpcmVjdGlvbiArIFwiQXhpcyBcIiArIGF4aXMuZGlyZWN0aW9uICsgYXhpcy5uICsgXCJBeGlzXCIsXG4gICAgICAgICAgICAgICAgICAgIGxheWVyID0gXCJmbG90LVwiICsgYXhpcy5kaXJlY3Rpb24gKyBcIi1heGlzIGZsb3QtXCIgKyBheGlzLmRpcmVjdGlvbiArIGF4aXMubiArIFwiLWF4aXMgXCIgKyBsZWdhY3lTdHlsZXMsXG4gICAgICAgICAgICAgICAgICAgIGZvbnQgPSBheGlzLm9wdGlvbnMuZm9udCB8fCBcImZsb3QtdGljay1sYWJlbCB0aWNrTGFiZWxcIixcbiAgICAgICAgICAgICAgICAgICAgdGljaywgeCwgeSwgaGFsaWduLCB2YWxpZ247XG5cbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGV4dCBiZWZvcmUgY2hlY2tpbmcgZm9yIGF4aXMuc2hvdyBhbmQgdGlja3MubGVuZ3RoO1xuICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBwbHVnaW5zLCBsaWtlIGZsb3QtdGlja3JvdG9yLCB0aGF0IGRyYXcgdGhlaXIgb3duXG4gICAgICAgICAgICAgICAgLy8gdGljayBsYWJlbHMgd2lsbCBlbmQgdXAgd2l0aCBib3RoIHRoZWlycyBhbmQgdGhlIGRlZmF1bHRzLlxuXG4gICAgICAgICAgICAgICAgc3VyZmFjZS5yZW1vdmVUZXh0KGxheWVyKTtcblxuICAgICAgICAgICAgICAgIGlmICghYXhpcy5zaG93IHx8IGF4aXMudGlja3MubGVuZ3RoID09IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXhpcy50aWNrcy5sZW5ndGg7ICsraSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRpY2sgPSBheGlzLnRpY2tzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRpY2subGFiZWwgfHwgdGljay52IDwgYXhpcy5taW4gfHwgdGljay52ID4gYXhpcy5tYXgpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXhpcy5kaXJlY3Rpb24gPT0gXCJ4XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGlnbiA9IFwiY2VudGVyXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gcGxvdE9mZnNldC5sZWZ0ICsgYXhpcy5wMmModGljay52KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChheGlzLnBvc2l0aW9uID09IFwiYm90dG9tXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ID0gYm94LnRvcCArIGJveC5wYWRkaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ID0gYm94LnRvcCArIGJveC5oZWlnaHQgLSBib3gucGFkZGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZ24gPSBcImJvdHRvbVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWduID0gXCJtaWRkbGVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSBwbG90T2Zmc2V0LnRvcCArIGF4aXMucDJjKHRpY2sudik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXhpcy5wb3NpdGlvbiA9PSBcImxlZnRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPSBib3gubGVmdCArIGJveC53aWR0aCAtIGJveC5wYWRkaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbGlnbiA9IFwicmlnaHRcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGJveC5sZWZ0ICsgYm94LnBhZGRpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzdXJmYWNlLmFkZFRleHQobGF5ZXIsIHgsIHksIHRpY2subGFiZWwsIGZvbnQsIG51bGwsIG51bGwsIGhhbGlnbiwgdmFsaWduKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRyYXdTZXJpZXMoc2VyaWVzKSB7XG4gICAgICAgICAgICBpZiAoc2VyaWVzLmxpbmVzLnNob3cpXG4gICAgICAgICAgICAgICAgZHJhd1Nlcmllc0xpbmVzKHNlcmllcyk7XG4gICAgICAgICAgICBpZiAoc2VyaWVzLmJhcnMuc2hvdylcbiAgICAgICAgICAgICAgICBkcmF3U2VyaWVzQmFycyhzZXJpZXMpO1xuICAgICAgICAgICAgaWYgKHNlcmllcy5wb2ludHMuc2hvdylcbiAgICAgICAgICAgICAgICBkcmF3U2VyaWVzUG9pbnRzKHNlcmllcyk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkcmF3U2VyaWVzTGluZXMoc2VyaWVzKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBwbG90TGluZShkYXRhcG9pbnRzLCB4b2Zmc2V0LCB5b2Zmc2V0LCBheGlzeCwgYXhpc3kpIHtcbiAgICAgICAgICAgICAgICB2YXIgcG9pbnRzID0gZGF0YXBvaW50cy5wb2ludHMsXG4gICAgICAgICAgICAgICAgICAgIHBzID0gZGF0YXBvaW50cy5wb2ludHNpemUsXG4gICAgICAgICAgICAgICAgICAgIHByZXZ4ID0gbnVsbCwgcHJldnkgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBwczsgaSA8IHBvaW50cy5sZW5ndGg7IGkgKz0gcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHgxID0gcG9pbnRzW2kgLSBwc10sIHkxID0gcG9pbnRzW2kgLSBwcyArIDFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSBwb2ludHNbaV0sIHkyID0gcG9pbnRzW2kgKyAxXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoeDEgPT0gbnVsbCB8fCB4MiA9PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2xpcCB3aXRoIHltaW5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHkxIDw9IHkyICYmIHkxIDwgYXhpc3kubWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoeTIgPCBheGlzeS5taW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7ICAgLy8gbGluZSBzZWdtZW50IGlzIG91dHNpZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbXB1dGUgbmV3IGludGVyc2VjdGlvbiBwb2ludFxuICAgICAgICAgICAgICAgICAgICAgICAgeDEgPSAoYXhpc3kubWluIC0geTEpIC8gKHkyIC0geTEpICogKHgyIC0geDEpICsgeDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MSA9IGF4aXN5Lm1pbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh5MiA8PSB5MSAmJiB5MiA8IGF4aXN5Lm1pbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHkxIDwgYXhpc3kubWluKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSAoYXhpc3kubWluIC0geTEpIC8gKHkyIC0geTEpICogKHgyIC0geDEpICsgeDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IGF4aXN5Lm1pbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsaXAgd2l0aCB5bWF4XG4gICAgICAgICAgICAgICAgICAgIGlmICh5MSA+PSB5MiAmJiB5MSA+IGF4aXN5Lm1heCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHkyID4gYXhpc3kubWF4KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgeDEgPSAoYXhpc3kubWF4IC0geTEpIC8gKHkyIC0geTEpICogKHgyIC0geDEpICsgeDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MSA9IGF4aXN5Lm1heDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh5MiA+PSB5MSAmJiB5MiA+IGF4aXN5Lm1heCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHkxID4gYXhpc3kubWF4KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSAoYXhpc3kubWF4IC0geTEpIC8gKHkyIC0geTEpICogKHgyIC0geDEpICsgeDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IGF4aXN5Lm1heDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsaXAgd2l0aCB4bWluXG4gICAgICAgICAgICAgICAgICAgIGlmICh4MSA8PSB4MiAmJiB4MSA8IGF4aXN4Lm1pbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHgyIDwgYXhpc3gubWluKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTEgPSAoYXhpc3gubWluIC0geDEpIC8gKHgyIC0geDEpICogKHkyIC0geTEpICsgeTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MSA9IGF4aXN4Lm1pbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh4MiA8PSB4MSAmJiB4MiA8IGF4aXN4Lm1pbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHgxIDwgYXhpc3gubWluKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSAoYXhpc3gubWluIC0geDEpIC8gKHgyIC0geDEpICogKHkyIC0geTEpICsgeTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MiA9IGF4aXN4Lm1pbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsaXAgd2l0aCB4bWF4XG4gICAgICAgICAgICAgICAgICAgIGlmICh4MSA+PSB4MiAmJiB4MSA+IGF4aXN4Lm1heCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHgyID4gYXhpc3gubWF4KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTEgPSAoYXhpc3gubWF4IC0geDEpIC8gKHgyIC0geDEpICogKHkyIC0geTEpICsgeTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MSA9IGF4aXN4Lm1heDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh4MiA+PSB4MSAmJiB4MiA+IGF4aXN4Lm1heCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHgxID4gYXhpc3gubWF4KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSAoYXhpc3gubWF4IC0geDEpIC8gKHgyIC0geDEpICogKHkyIC0geTEpICsgeTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MiA9IGF4aXN4Lm1heDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh4MSAhPSBwcmV2eCB8fCB5MSAhPSBwcmV2eSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oYXhpc3gucDJjKHgxKSArIHhvZmZzZXQsIGF4aXN5LnAyYyh5MSkgKyB5b2Zmc2V0KTtcblxuICAgICAgICAgICAgICAgICAgICBwcmV2eCA9IHgyO1xuICAgICAgICAgICAgICAgICAgICBwcmV2eSA9IHkyO1xuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKGF4aXN4LnAyYyh4MikgKyB4b2Zmc2V0LCBheGlzeS5wMmMoeTIpICsgeW9mZnNldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcGxvdExpbmVBcmVhKGRhdGFwb2ludHMsIGF4aXN4LCBheGlzeSkge1xuICAgICAgICAgICAgICAgIHZhciBwb2ludHMgPSBkYXRhcG9pbnRzLnBvaW50cyxcbiAgICAgICAgICAgICAgICAgICAgcHMgPSBkYXRhcG9pbnRzLnBvaW50c2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tID0gTWF0aC5taW4oTWF0aC5tYXgoMCwgYXhpc3kubWluKSwgYXhpc3kubWF4KSxcbiAgICAgICAgICAgICAgICAgICAgaSA9IDAsIHRvcCwgYXJlYU9wZW4gPSBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgeXBvcyA9IDEsIHNlZ21lbnRTdGFydCA9IDAsIHNlZ21lbnRFbmQgPSAwO1xuXG4gICAgICAgICAgICAgICAgLy8gd2UgcHJvY2VzcyBlYWNoIHNlZ21lbnQgaW4gdHdvIHR1cm5zLCBmaXJzdCBmb3J3YXJkXG4gICAgICAgICAgICAgICAgLy8gZGlyZWN0aW9uIHRvIHNrZXRjaCBvdXQgdG9wLCB0aGVuIG9uY2Ugd2UgaGl0IHRoZVxuICAgICAgICAgICAgICAgIC8vIGVuZCB3ZSBnbyBiYWNrd2FyZHMgdG8gc2tldGNoIHRoZSBib3R0b21cbiAgICAgICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHMgPiAwICYmIGkgPiBwb2ludHMubGVuZ3RoICsgcHMpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICBpICs9IHBzOyAvLyBwcyBpcyBuZWdhdGl2ZSBpZiBnb2luZyBiYWNrd2FyZHNcblxuICAgICAgICAgICAgICAgICAgICB2YXIgeDEgPSBwb2ludHNbaSAtIHBzXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkxID0gcG9pbnRzW2kgLSBwcyArIHlwb3NdLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSBwb2ludHNbaV0sIHkyID0gcG9pbnRzW2kgKyB5cG9zXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJlYU9wZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcyA+IDAgJiYgeDEgIT0gbnVsbCAmJiB4MiA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXQgdHVybmluZyBwb2ludFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlZ21lbnRFbmQgPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBzID0gLXBzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlwb3MgPSAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHMgPCAwICYmIGkgPT0gc2VnbWVudFN0YXJ0ICsgcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkb25lIHdpdGggdGhlIHJldmVyc2Ugc3dlZXBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZWFPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHMgPSAtcHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeXBvcyA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9IHNlZ21lbnRTdGFydCA9IHNlZ21lbnRFbmQgKyBwcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh4MSA9PSBudWxsIHx8IHgyID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjbGlwIHggdmFsdWVzXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2xpcCB3aXRoIHhtaW5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHgxIDw9IHgyICYmIHgxIDwgYXhpc3gubWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoeDIgPCBheGlzeC5taW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MSA9IChheGlzeC5taW4gLSB4MSkgLyAoeDIgLSB4MSkgKiAoeTIgLSB5MSkgKyB5MTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgxID0gYXhpc3gubWluO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHgyIDw9IHgxICYmIHgyIDwgYXhpc3gubWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoeDEgPCBheGlzeC5taW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IChheGlzeC5taW4gLSB4MSkgLyAoeDIgLSB4MSkgKiAoeTIgLSB5MSkgKyB5MTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgyID0gYXhpc3gubWluO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2xpcCB3aXRoIHhtYXhcbiAgICAgICAgICAgICAgICAgICAgaWYgKHgxID49IHgyICYmIHgxID4gYXhpc3gubWF4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoeDIgPiBheGlzeC5tYXgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MSA9IChheGlzeC5tYXggLSB4MSkgLyAoeDIgLSB4MSkgKiAoeTIgLSB5MSkgKyB5MTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgxID0gYXhpc3gubWF4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHgyID49IHgxICYmIHgyID4gYXhpc3gubWF4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoeDEgPiBheGlzeC5tYXgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IChheGlzeC5tYXggLSB4MSkgLyAoeDIgLSB4MSkgKiAoeTIgLSB5MSkgKyB5MTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgyID0gYXhpc3gubWF4O1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhcmVhT3Blbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3BlbiBhcmVhXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKGF4aXN4LnAyYyh4MSksIGF4aXN5LnAyYyhib3R0b20pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZWFPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vdyBmaXJzdCBjaGVjayB0aGUgY2FzZSB3aGVyZSBib3RoIGlzIG91dHNpZGVcbiAgICAgICAgICAgICAgICAgICAgaWYgKHkxID49IGF4aXN5Lm1heCAmJiB5MiA+PSBheGlzeS5tYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oYXhpc3gucDJjKHgxKSwgYXhpc3kucDJjKGF4aXN5Lm1heCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhheGlzeC5wMmMoeDIpLCBheGlzeS5wMmMoYXhpc3kubWF4KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh5MSA8PSBheGlzeS5taW4gJiYgeTIgPD0gYXhpc3kubWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKGF4aXN4LnAyYyh4MSksIGF4aXN5LnAyYyhheGlzeS5taW4pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oYXhpc3gucDJjKHgyKSwgYXhpc3kucDJjKGF4aXN5Lm1pbikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBlbHNlIGl0J3MgYSBiaXQgbW9yZSBjb21wbGljYXRlZCwgdGhlcmUgbWlnaHRcbiAgICAgICAgICAgICAgICAgICAgLy8gYmUgYSBmbGF0IG1heGVkIG91dCByZWN0YW5nbGUgZmlyc3QsIHRoZW4gYVxuICAgICAgICAgICAgICAgICAgICAvLyB0cmlhbmd1bGFyIGN1dG91dCBvciByZXZlcnNlOyB0byBmaW5kIHRoZXNlXG4gICAgICAgICAgICAgICAgICAgIC8vIGtlZXAgdHJhY2sgb2YgdGhlIGN1cnJlbnQgeCB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgdmFyIHgxb2xkID0geDEsIHgyb2xkID0geDI7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2xpcCB0aGUgeSB2YWx1ZXMsIHdpdGhvdXQgc2hvcnRjdXR0aW5nLCB3ZVxuICAgICAgICAgICAgICAgICAgICAvLyBnbyB0aHJvdWdoIGFsbCBjYXNlcyBpbiB0dXJuXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2xpcCB3aXRoIHltaW5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHkxIDw9IHkyICYmIHkxIDwgYXhpc3kubWluICYmIHkyID49IGF4aXN5Lm1pbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDEgPSAoYXhpc3kubWluIC0geTEpIC8gKHkyIC0geTEpICogKHgyIC0geDEpICsgeDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MSA9IGF4aXN5Lm1pbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh5MiA8PSB5MSAmJiB5MiA8IGF4aXN5Lm1pbiAmJiB5MSA+PSBheGlzeS5taW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgyID0gKGF4aXN5Lm1pbiAtIHkxKSAvICh5MiAtIHkxKSAqICh4MiAtIHgxKSArIHgxO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSBheGlzeS5taW47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBjbGlwIHdpdGggeW1heFxuICAgICAgICAgICAgICAgICAgICBpZiAoeTEgPj0geTIgJiYgeTEgPiBheGlzeS5tYXggJiYgeTIgPD0gYXhpc3kubWF4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MSA9IChheGlzeS5tYXggLSB5MSkgLyAoeTIgLSB5MSkgKiAoeDIgLSB4MSkgKyB4MTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkxID0gYXhpc3kubWF4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHkyID49IHkxICYmIHkyID4gYXhpc3kubWF4ICYmIHkxIDw9IGF4aXN5Lm1heCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSAoYXhpc3kubWF4IC0geTEpIC8gKHkyIC0geTEpICogKHgyIC0geDEpICsgeDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IGF4aXN5Lm1heDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSB4IHZhbHVlIHdhcyBjaGFuZ2VkIHdlIGdvdCBhIHJlY3RhbmdsZVxuICAgICAgICAgICAgICAgICAgICAvLyB0byBmaWxsXG4gICAgICAgICAgICAgICAgICAgIGlmICh4MSAhPSB4MW9sZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhheGlzeC5wMmMoeDFvbGQpLCBheGlzeS5wMmMoeTEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGl0IGdvZXMgdG8gKHgxLCB5MSksIGJ1dCB3ZSBmaWxsIHRoYXQgYmVsb3dcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGZpbGwgdHJpYW5ndWxhciBzZWN0aW9uLCB0aGlzIHNvbWV0aW1lcyByZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gcmVkdW5kYW50IHBvaW50cyBpZiAoeDEsIHkxKSBoYXNuJ3QgY2hhbmdlZFxuICAgICAgICAgICAgICAgICAgICAvLyBmcm9tIHByZXZpb3VzIGxpbmUgdG8sIGJ1dCB3ZSBqdXN0IGlnbm9yZSB0aGF0XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oYXhpc3gucDJjKHgxKSwgYXhpc3kucDJjKHkxKSk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oYXhpc3gucDJjKHgyKSwgYXhpc3kucDJjKHkyKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZmlsbCB0aGUgb3RoZXIgcmVjdGFuZ2xlIGlmIGl0J3MgdGhlcmVcbiAgICAgICAgICAgICAgICAgICAgaWYgKHgyICE9IHgyb2xkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKGF4aXN4LnAyYyh4MiksIGF4aXN5LnAyYyh5MikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhheGlzeC5wMmMoeDJvbGQpLCBheGlzeS5wMmMoeTIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3R4LnNhdmUoKTtcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUocGxvdE9mZnNldC5sZWZ0LCBwbG90T2Zmc2V0LnRvcCk7XG4gICAgICAgICAgICBjdHgubGluZUpvaW4gPSBcInJvdW5kXCI7XG5cbiAgICAgICAgICAgIHZhciBsdyA9IHNlcmllcy5saW5lcy5saW5lV2lkdGgsXG4gICAgICAgICAgICAgICAgc3cgPSBzZXJpZXMuc2hhZG93U2l6ZTtcbiAgICAgICAgICAgIC8vIEZJWE1FOiBjb25zaWRlciBhbm90aGVyIGZvcm0gb2Ygc2hhZG93IHdoZW4gZmlsbGluZyBpcyB0dXJuZWQgb25cbiAgICAgICAgICAgIGlmIChsdyA+IDAgJiYgc3cgPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8gZHJhdyBzaGFkb3cgYXMgYSB0aGljayBhbmQgdGhpbiBsaW5lIHdpdGggdHJhbnNwYXJlbmN5XG4gICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHN3O1xuICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IFwicmdiYSgwLDAsMCwwLjEpXCI7XG4gICAgICAgICAgICAgICAgLy8gcG9zaXRpb24gc2hhZG93IGF0IGFuZ2xlIGZyb20gdGhlIG1pZCBvZiBsaW5lXG4gICAgICAgICAgICAgICAgdmFyIGFuZ2xlID0gTWF0aC5QSS8xODtcbiAgICAgICAgICAgICAgICBwbG90TGluZShzZXJpZXMuZGF0YXBvaW50cywgTWF0aC5zaW4oYW5nbGUpICogKGx3LzIgKyBzdy8yKSwgTWF0aC5jb3MoYW5nbGUpICogKGx3LzIgKyBzdy8yKSwgc2VyaWVzLnhheGlzLCBzZXJpZXMueWF4aXMpO1xuICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBzdy8yO1xuICAgICAgICAgICAgICAgIHBsb3RMaW5lKHNlcmllcy5kYXRhcG9pbnRzLCBNYXRoLnNpbihhbmdsZSkgKiAobHcvMiArIHN3LzQpLCBNYXRoLmNvcyhhbmdsZSkgKiAobHcvMiArIHN3LzQpLCBzZXJpZXMueGF4aXMsIHNlcmllcy55YXhpcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBsdztcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHNlcmllcy5jb2xvcjtcbiAgICAgICAgICAgIHZhciBmaWxsU3R5bGUgPSBnZXRGaWxsU3R5bGUoc2VyaWVzLmxpbmVzLCBzZXJpZXMuY29sb3IsIDAsIHBsb3RIZWlnaHQpO1xuICAgICAgICAgICAgaWYgKGZpbGxTdHlsZSkge1xuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsU3R5bGU7XG4gICAgICAgICAgICAgICAgcGxvdExpbmVBcmVhKHNlcmllcy5kYXRhcG9pbnRzLCBzZXJpZXMueGF4aXMsIHNlcmllcy55YXhpcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChsdyA+IDApXG4gICAgICAgICAgICAgICAgcGxvdExpbmUoc2VyaWVzLmRhdGFwb2ludHMsIDAsIDAsIHNlcmllcy54YXhpcywgc2VyaWVzLnlheGlzKTtcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkcmF3U2VyaWVzUG9pbnRzKHNlcmllcykge1xuICAgICAgICAgICAgZnVuY3Rpb24gcGxvdFBvaW50cyhkYXRhcG9pbnRzLCByYWRpdXMsIGZpbGxTdHlsZSwgb2Zmc2V0LCBzaGFkb3csIGF4aXN4LCBheGlzeSwgc3ltYm9sKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBvaW50cyA9IGRhdGFwb2ludHMucG9pbnRzLCBwcyA9IGRhdGFwb2ludHMucG9pbnRzaXplO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpICs9IHBzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0gcG9pbnRzW2ldLCB5ID0gcG9pbnRzW2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHggPT0gbnVsbCB8fCB4IDwgYXhpc3gubWluIHx8IHggPiBheGlzeC5tYXggfHwgeSA8IGF4aXN5Lm1pbiB8fCB5ID4gYXhpc3kubWF4KVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICB4ID0gYXhpc3gucDJjKHgpO1xuICAgICAgICAgICAgICAgICAgICB5ID0gYXhpc3kucDJjKHkpICsgb2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3ltYm9sID09IFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguYXJjKHgsIHksIHJhZGl1cywgMCwgc2hhZG93ID8gTWF0aC5QSSA6IE1hdGguUEkgKiAyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHN5bWJvbChjdHgsIHgsIHksIHJhZGl1cywgc2hhZG93KTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxsU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsU3R5bGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XG4gICAgICAgICAgICBjdHgudHJhbnNsYXRlKHBsb3RPZmZzZXQubGVmdCwgcGxvdE9mZnNldC50b3ApO1xuXG4gICAgICAgICAgICB2YXIgbHcgPSBzZXJpZXMucG9pbnRzLmxpbmVXaWR0aCxcbiAgICAgICAgICAgICAgICBzdyA9IHNlcmllcy5zaGFkb3dTaXplLFxuICAgICAgICAgICAgICAgIHJhZGl1cyA9IHNlcmllcy5wb2ludHMucmFkaXVzLFxuICAgICAgICAgICAgICAgIHN5bWJvbCA9IHNlcmllcy5wb2ludHMuc3ltYm9sO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGUgdXNlciBzZXRzIHRoZSBsaW5lIHdpZHRoIHRvIDAsIHdlIGNoYW5nZSBpdCB0byBhIHZlcnkgXG4gICAgICAgICAgICAvLyBzbWFsbCB2YWx1ZS4gQSBsaW5lIHdpZHRoIG9mIDAgc2VlbXMgdG8gZm9yY2UgdGhlIGRlZmF1bHQgb2YgMS5cbiAgICAgICAgICAgIC8vIERvaW5nIHRoZSBjb25kaXRpb25hbCBoZXJlIGFsbG93cyB0aGUgc2hhZG93IHNldHRpbmcgdG8gc3RpbGwgYmUgXG4gICAgICAgICAgICAvLyBvcHRpb25hbCBldmVuIHdpdGggYSBsaW5lV2lkdGggb2YgMC5cblxuICAgICAgICAgICAgaWYoIGx3ID09IDAgKVxuICAgICAgICAgICAgICAgIGx3ID0gMC4wMDAxO1xuXG4gICAgICAgICAgICBpZiAobHcgPiAwICYmIHN3ID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIGRyYXcgc2hhZG93IGluIHR3byBzdGVwc1xuICAgICAgICAgICAgICAgIHZhciB3ID0gc3cgLyAyO1xuICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB3O1xuICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IFwicmdiYSgwLDAsMCwwLjEpXCI7XG4gICAgICAgICAgICAgICAgcGxvdFBvaW50cyhzZXJpZXMuZGF0YXBvaW50cywgcmFkaXVzLCBudWxsLCB3ICsgdy8yLCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzLnhheGlzLCBzZXJpZXMueWF4aXMsIHN5bWJvbCk7XG5cbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBcInJnYmEoMCwwLDAsMC4yKVwiO1xuICAgICAgICAgICAgICAgIHBsb3RQb2ludHMoc2VyaWVzLmRhdGFwb2ludHMsIHJhZGl1cywgbnVsbCwgdy8yLCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzLnhheGlzLCBzZXJpZXMueWF4aXMsIHN5bWJvbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBsdztcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHNlcmllcy5jb2xvcjtcbiAgICAgICAgICAgIHBsb3RQb2ludHMoc2VyaWVzLmRhdGFwb2ludHMsIHJhZGl1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgZ2V0RmlsbFN0eWxlKHNlcmllcy5wb2ludHMsIHNlcmllcy5jb2xvciksIDAsIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXMueGF4aXMsIHNlcmllcy55YXhpcywgc3ltYm9sKTtcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkcmF3QmFyKHgsIHksIGIsIGJhckxlZnQsIGJhclJpZ2h0LCBmaWxsU3R5bGVDYWxsYmFjaywgYXhpc3gsIGF4aXN5LCBjLCBob3Jpem9udGFsLCBsaW5lV2lkdGgpIHtcbiAgICAgICAgICAgIHZhciBsZWZ0LCByaWdodCwgYm90dG9tLCB0b3AsXG4gICAgICAgICAgICAgICAgZHJhd0xlZnQsIGRyYXdSaWdodCwgZHJhd1RvcCwgZHJhd0JvdHRvbSxcbiAgICAgICAgICAgICAgICB0bXA7XG5cbiAgICAgICAgICAgIC8vIGluIGhvcml6b250YWwgbW9kZSwgd2Ugc3RhcnQgdGhlIGJhciBmcm9tIHRoZSBsZWZ0XG4gICAgICAgICAgICAvLyBpbnN0ZWFkIG9mIGZyb20gdGhlIGJvdHRvbSBzbyBpdCBhcHBlYXJzIHRvIGJlXG4gICAgICAgICAgICAvLyBob3Jpem9udGFsIHJhdGhlciB0aGFuIHZlcnRpY2FsXG4gICAgICAgICAgICBpZiAoaG9yaXpvbnRhbCkge1xuICAgICAgICAgICAgICAgIGRyYXdCb3R0b20gPSBkcmF3UmlnaHQgPSBkcmF3VG9wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBkcmF3TGVmdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGxlZnQgPSBiO1xuICAgICAgICAgICAgICAgIHJpZ2h0ID0geDtcbiAgICAgICAgICAgICAgICB0b3AgPSB5ICsgYmFyTGVmdDtcbiAgICAgICAgICAgICAgICBib3R0b20gPSB5ICsgYmFyUmlnaHQ7XG5cbiAgICAgICAgICAgICAgICAvLyBhY2NvdW50IGZvciBuZWdhdGl2ZSBiYXJzXG4gICAgICAgICAgICAgICAgaWYgKHJpZ2h0IDwgbGVmdCkge1xuICAgICAgICAgICAgICAgICAgICB0bXAgPSByaWdodDtcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSBsZWZ0O1xuICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gdG1wO1xuICAgICAgICAgICAgICAgICAgICBkcmF3TGVmdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGRyYXdSaWdodCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRyYXdMZWZ0ID0gZHJhd1JpZ2h0ID0gZHJhd1RvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZHJhd0JvdHRvbSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGxlZnQgPSB4ICsgYmFyTGVmdDtcbiAgICAgICAgICAgICAgICByaWdodCA9IHggKyBiYXJSaWdodDtcbiAgICAgICAgICAgICAgICBib3R0b20gPSBiO1xuICAgICAgICAgICAgICAgIHRvcCA9IHk7XG5cbiAgICAgICAgICAgICAgICAvLyBhY2NvdW50IGZvciBuZWdhdGl2ZSBiYXJzXG4gICAgICAgICAgICAgICAgaWYgKHRvcCA8IGJvdHRvbSkge1xuICAgICAgICAgICAgICAgICAgICB0bXAgPSB0b3A7XG4gICAgICAgICAgICAgICAgICAgIHRvcCA9IGJvdHRvbTtcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tID0gdG1wO1xuICAgICAgICAgICAgICAgICAgICBkcmF3Qm90dG9tID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZHJhd1RvcCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY2xpcFxuICAgICAgICAgICAgaWYgKHJpZ2h0IDwgYXhpc3gubWluIHx8IGxlZnQgPiBheGlzeC5tYXggfHxcbiAgICAgICAgICAgICAgICB0b3AgPCBheGlzeS5taW4gfHwgYm90dG9tID4gYXhpc3kubWF4KVxuICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKGxlZnQgPCBheGlzeC5taW4pIHtcbiAgICAgICAgICAgICAgICBsZWZ0ID0gYXhpc3gubWluO1xuICAgICAgICAgICAgICAgIGRyYXdMZWZ0ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyaWdodCA+IGF4aXN4Lm1heCkge1xuICAgICAgICAgICAgICAgIHJpZ2h0ID0gYXhpc3gubWF4O1xuICAgICAgICAgICAgICAgIGRyYXdSaWdodCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYm90dG9tIDwgYXhpc3kubWluKSB7XG4gICAgICAgICAgICAgICAgYm90dG9tID0gYXhpc3kubWluO1xuICAgICAgICAgICAgICAgIGRyYXdCb3R0b20gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRvcCA+IGF4aXN5Lm1heCkge1xuICAgICAgICAgICAgICAgIHRvcCA9IGF4aXN5Lm1heDtcbiAgICAgICAgICAgICAgICBkcmF3VG9wID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxlZnQgPSBheGlzeC5wMmMobGVmdCk7XG4gICAgICAgICAgICBib3R0b20gPSBheGlzeS5wMmMoYm90dG9tKTtcbiAgICAgICAgICAgIHJpZ2h0ID0gYXhpc3gucDJjKHJpZ2h0KTtcbiAgICAgICAgICAgIHRvcCA9IGF4aXN5LnAyYyh0b3ApO1xuXG4gICAgICAgICAgICAvLyBmaWxsIHRoZSBiYXJcbiAgICAgICAgICAgIGlmIChmaWxsU3R5bGVDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGMuZmlsbFN0eWxlID0gZmlsbFN0eWxlQ2FsbGJhY2soYm90dG9tLCB0b3ApO1xuICAgICAgICAgICAgICAgIGMuZmlsbFJlY3QobGVmdCwgdG9wLCByaWdodCAtIGxlZnQsIGJvdHRvbSAtIHRvcClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZHJhdyBvdXRsaW5lXG4gICAgICAgICAgICBpZiAobGluZVdpZHRoID4gMCAmJiAoZHJhd0xlZnQgfHwgZHJhd1JpZ2h0IHx8IGRyYXdUb3AgfHwgZHJhd0JvdHRvbSkpIHtcbiAgICAgICAgICAgICAgICBjLmJlZ2luUGF0aCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gRklYTUU6IGlubGluZSBtb3ZlVG8gaXMgYnVnZ3kgd2l0aCBleGNhbnZhc1xuICAgICAgICAgICAgICAgIGMubW92ZVRvKGxlZnQsIGJvdHRvbSk7XG4gICAgICAgICAgICAgICAgaWYgKGRyYXdMZWZ0KVxuICAgICAgICAgICAgICAgICAgICBjLmxpbmVUbyhsZWZ0LCB0b3ApO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYy5tb3ZlVG8obGVmdCwgdG9wKTtcbiAgICAgICAgICAgICAgICBpZiAoZHJhd1RvcClcbiAgICAgICAgICAgICAgICAgICAgYy5saW5lVG8ocmlnaHQsIHRvcCk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjLm1vdmVUbyhyaWdodCwgdG9wKTtcbiAgICAgICAgICAgICAgICBpZiAoZHJhd1JpZ2h0KVxuICAgICAgICAgICAgICAgICAgICBjLmxpbmVUbyhyaWdodCwgYm90dG9tKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGMubW92ZVRvKHJpZ2h0LCBib3R0b20pO1xuICAgICAgICAgICAgICAgIGlmIChkcmF3Qm90dG9tKVxuICAgICAgICAgICAgICAgICAgICBjLmxpbmVUbyhsZWZ0LCBib3R0b20pO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYy5tb3ZlVG8obGVmdCwgYm90dG9tKTtcbiAgICAgICAgICAgICAgICBjLnN0cm9rZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZHJhd1Nlcmllc0JhcnMoc2VyaWVzKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBwbG90QmFycyhkYXRhcG9pbnRzLCBiYXJMZWZ0LCBiYXJSaWdodCwgZmlsbFN0eWxlQ2FsbGJhY2ssIGF4aXN4LCBheGlzeSkge1xuICAgICAgICAgICAgICAgIHZhciBwb2ludHMgPSBkYXRhcG9pbnRzLnBvaW50cywgcHMgPSBkYXRhcG9pbnRzLnBvaW50c2l6ZTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aDsgaSArPSBwcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9pbnRzW2ldID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgZHJhd0Jhcihwb2ludHNbaV0sIHBvaW50c1tpICsgMV0sIHBvaW50c1tpICsgMl0sIGJhckxlZnQsIGJhclJpZ2h0LCBmaWxsU3R5bGVDYWxsYmFjaywgYXhpc3gsIGF4aXN5LCBjdHgsIHNlcmllcy5iYXJzLmhvcml6b250YWwsIHNlcmllcy5iYXJzLmxpbmVXaWR0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdHguc2F2ZSgpO1xuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShwbG90T2Zmc2V0LmxlZnQsIHBsb3RPZmZzZXQudG9wKTtcblxuICAgICAgICAgICAgLy8gRklYTUU6IGZpZ3VyZSBvdXQgYSB3YXkgdG8gYWRkIHNoYWRvd3MgKGZvciBpbnN0YW5jZSBhbG9uZyB0aGUgcmlnaHQgZWRnZSlcbiAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBzZXJpZXMuYmFycy5saW5lV2lkdGg7XG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzZXJpZXMuY29sb3I7XG5cbiAgICAgICAgICAgIHZhciBiYXJMZWZ0O1xuXG4gICAgICAgICAgICBzd2l0Y2ggKHNlcmllcy5iYXJzLmFsaWduKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcImxlZnRcIjpcbiAgICAgICAgICAgICAgICAgICAgYmFyTGVmdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJyaWdodFwiOlxuICAgICAgICAgICAgICAgICAgICBiYXJMZWZ0ID0gLXNlcmllcy5iYXJzLmJhcldpZHRoO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBiYXJMZWZ0ID0gLXNlcmllcy5iYXJzLmJhcldpZHRoIC8gMjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGZpbGxTdHlsZUNhbGxiYWNrID0gc2VyaWVzLmJhcnMuZmlsbCA/IGZ1bmN0aW9uIChib3R0b20sIHRvcCkgeyByZXR1cm4gZ2V0RmlsbFN0eWxlKHNlcmllcy5iYXJzLCBzZXJpZXMuY29sb3IsIGJvdHRvbSwgdG9wKTsgfSA6IG51bGw7XG4gICAgICAgICAgICBwbG90QmFycyhzZXJpZXMuZGF0YXBvaW50cywgYmFyTGVmdCwgYmFyTGVmdCArIHNlcmllcy5iYXJzLmJhcldpZHRoLCBmaWxsU3R5bGVDYWxsYmFjaywgc2VyaWVzLnhheGlzLCBzZXJpZXMueWF4aXMpO1xuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldEZpbGxTdHlsZShmaWxsb3B0aW9ucywgc2VyaWVzQ29sb3IsIGJvdHRvbSwgdG9wKSB7XG4gICAgICAgICAgICB2YXIgZmlsbCA9IGZpbGxvcHRpb25zLmZpbGw7XG4gICAgICAgICAgICBpZiAoIWZpbGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgIGlmIChmaWxsb3B0aW9ucy5maWxsQ29sb3IpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldENvbG9yT3JHcmFkaWVudChmaWxsb3B0aW9ucy5maWxsQ29sb3IsIGJvdHRvbSwgdG9wLCBzZXJpZXNDb2xvcik7XG5cbiAgICAgICAgICAgIHZhciBjID0gJC5jb2xvci5wYXJzZShzZXJpZXNDb2xvcik7XG4gICAgICAgICAgICBjLmEgPSB0eXBlb2YgZmlsbCA9PSBcIm51bWJlclwiID8gZmlsbCA6IDAuNDtcbiAgICAgICAgICAgIGMubm9ybWFsaXplKCk7XG4gICAgICAgICAgICByZXR1cm4gYy50b1N0cmluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaW5zZXJ0TGVnZW5kKCkge1xuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5sZWdlbmQuY29udGFpbmVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAkKG9wdGlvbnMubGVnZW5kLmNvbnRhaW5lcikuaHRtbChcIlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIuZmluZChcIi5sZWdlbmRcIikucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5sZWdlbmQuc2hvdykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGZyYWdtZW50cyA9IFtdLCBlbnRyaWVzID0gW10sIHJvd1N0YXJ0ZWQgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBsZiA9IG9wdGlvbnMubGVnZW5kLmxhYmVsRm9ybWF0dGVyLCBzLCBsYWJlbDtcblxuICAgICAgICAgICAgLy8gQnVpbGQgYSBsaXN0IG9mIGxlZ2VuZCBlbnRyaWVzLCB3aXRoIGVhY2ggaGF2aW5nIGEgbGFiZWwgYW5kIGEgY29sb3JcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZXJpZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBzID0gc2VyaWVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChzLmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsID0gbGYgPyBsZihzLmxhYmVsLCBzKSA6IHMubGFiZWw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW50cmllcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogbGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHMuY29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTb3J0IHRoZSBsZWdlbmQgdXNpbmcgZWl0aGVyIHRoZSBkZWZhdWx0IG9yIGEgY3VzdG9tIGNvbXBhcmF0b3JcblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMubGVnZW5kLnNvcnRlZCkge1xuICAgICAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob3B0aW9ucy5sZWdlbmQuc29ydGVkKSkge1xuICAgICAgICAgICAgICAgICAgICBlbnRyaWVzLnNvcnQob3B0aW9ucy5sZWdlbmQuc29ydGVkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubGVnZW5kLnNvcnRlZCA9PSBcInJldmVyc2VcIikge1xuICAgICAgICAgICAgICAgIFx0ZW50cmllcy5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFzY2VuZGluZyA9IG9wdGlvbnMubGVnZW5kLnNvcnRlZCAhPSBcImRlc2NlbmRpbmdcIjtcbiAgICAgICAgICAgICAgICAgICAgZW50cmllcy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhLmxhYmVsID09IGIubGFiZWwgPyAwIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChhLmxhYmVsIDwgYi5sYWJlbCkgIT0gYXNjZW5kaW5nID8gMSA6IC0xICAgLy8gTG9naWNhbCBYT1JcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gR2VuZXJhdGUgbWFya3VwIGZvciB0aGUgbGlzdCBvZiBlbnRyaWVzLCBpbiB0aGVpciBmaW5hbCBvcmRlclxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVudHJpZXMubGVuZ3RoOyArK2kpIHtcblxuICAgICAgICAgICAgICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAoaSAlIG9wdGlvbnMubGVnZW5kLm5vQ29sdW1ucyA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyb3dTdGFydGVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2goJzwvdHI+Jyk7XG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoKCc8dHI+Jyk7XG4gICAgICAgICAgICAgICAgICAgIHJvd1N0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPVwibGVnZW5kQ29sb3JCb3hcIj48ZGl2IHN0eWxlPVwiYm9yZGVyOjFweCBzb2xpZCAnICsgb3B0aW9ucy5sZWdlbmQubGFiZWxCb3hCb3JkZXJDb2xvciArICc7cGFkZGluZzoxcHhcIj48ZGl2IHN0eWxlPVwid2lkdGg6NHB4O2hlaWdodDowO2JvcmRlcjo1cHggc29saWQgJyArIGVudHJ5LmNvbG9yICsgJztvdmVyZmxvdzpoaWRkZW5cIj48L2Rpdj48L2Rpdj48L3RkPicgK1xuICAgICAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPVwibGVnZW5kTGFiZWxcIj4nICsgZW50cnkubGFiZWwgKyAnPC90ZD4nXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJvd1N0YXJ0ZWQpXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2goJzwvdHI+Jyk7XG5cbiAgICAgICAgICAgIGlmIChmcmFnbWVudHMubGVuZ3RoID09IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YXIgdGFibGUgPSAnPHRhYmxlIHN0eWxlPVwiZm9udC1zaXplOnNtYWxsZXI7Y29sb3I6JyArIG9wdGlvbnMuZ3JpZC5jb2xvciArICdcIj4nICsgZnJhZ21lbnRzLmpvaW4oXCJcIikgKyAnPC90YWJsZT4nO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMubGVnZW5kLmNvbnRhaW5lciAhPSBudWxsKVxuICAgICAgICAgICAgICAgICQob3B0aW9ucy5sZWdlbmQuY29udGFpbmVyKS5odG1sKHRhYmxlKTtcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBwb3MgPSBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBwID0gb3B0aW9ucy5sZWdlbmQucG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgIG0gPSBvcHRpb25zLmxlZ2VuZC5tYXJnaW47XG4gICAgICAgICAgICAgICAgaWYgKG1bMF0gPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgbSA9IFttLCBtXTtcbiAgICAgICAgICAgICAgICBpZiAocC5jaGFyQXQoMCkgPT0gXCJuXCIpXG4gICAgICAgICAgICAgICAgICAgIHBvcyArPSAndG9wOicgKyAobVsxXSArIHBsb3RPZmZzZXQudG9wKSArICdweDsnO1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHAuY2hhckF0KDApID09IFwic1wiKVxuICAgICAgICAgICAgICAgICAgICBwb3MgKz0gJ2JvdHRvbTonICsgKG1bMV0gKyBwbG90T2Zmc2V0LmJvdHRvbSkgKyAncHg7JztcbiAgICAgICAgICAgICAgICBpZiAocC5jaGFyQXQoMSkgPT0gXCJlXCIpXG4gICAgICAgICAgICAgICAgICAgIHBvcyArPSAncmlnaHQ6JyArIChtWzBdICsgcGxvdE9mZnNldC5yaWdodCkgKyAncHg7JztcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwLmNoYXJBdCgxKSA9PSBcIndcIilcbiAgICAgICAgICAgICAgICAgICAgcG9zICs9ICdsZWZ0OicgKyAobVswXSArIHBsb3RPZmZzZXQubGVmdCkgKyAncHg7JztcbiAgICAgICAgICAgICAgICB2YXIgbGVnZW5kID0gJCgnPGRpdiBjbGFzcz1cImxlZ2VuZFwiPicgKyB0YWJsZS5yZXBsYWNlKCdzdHlsZT1cIicsICdzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlOycgKyBwb3MgKyc7JykgKyAnPC9kaXY+JykuYXBwZW5kVG8ocGxhY2Vob2xkZXIpO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxlZ2VuZC5iYWNrZ3JvdW5kT3BhY2l0eSAhPSAwLjApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcHV0IGluIHRoZSB0cmFuc3BhcmVudCBiYWNrZ3JvdW5kXG4gICAgICAgICAgICAgICAgICAgIC8vIHNlcGFyYXRlbHkgdG8gYXZvaWQgYmxlbmRlZCBsYWJlbHMgYW5kXG4gICAgICAgICAgICAgICAgICAgIC8vIGxhYmVsIGJveGVzXG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gb3B0aW9ucy5sZWdlbmQuYmFja2dyb3VuZENvbG9yO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjID0gb3B0aW9ucy5ncmlkLmJhY2tncm91bmRDb2xvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjICYmIHR5cGVvZiBjID09IFwic3RyaW5nXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYyA9ICQuY29sb3IucGFyc2UoYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYyA9ICQuY29sb3IuZXh0cmFjdChsZWdlbmQsICdiYWNrZ3JvdW5kLWNvbG9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjLmEgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYyA9IGMudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgZGl2ID0gbGVnZW5kLmNoaWxkcmVuKCk7XG4gICAgICAgICAgICAgICAgICAgICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt3aWR0aDonICsgZGl2LndpZHRoKCkgKyAncHg7aGVpZ2h0OicgKyBkaXYuaGVpZ2h0KCkgKyAncHg7JyArIHBvcyArJ2JhY2tncm91bmQtY29sb3I6JyArIGMgKyAnO1wiPiA8L2Rpdj4nKS5wcmVwZW5kVG8obGVnZW5kKS5jc3MoJ29wYWNpdHknLCBvcHRpb25zLmxlZ2VuZC5iYWNrZ3JvdW5kT3BhY2l0eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyBpbnRlcmFjdGl2ZSBmZWF0dXJlc1xuXG4gICAgICAgIHZhciBoaWdobGlnaHRzID0gW10sXG4gICAgICAgICAgICByZWRyYXdUaW1lb3V0ID0gbnVsbDtcblxuICAgICAgICAvLyByZXR1cm5zIHRoZSBkYXRhIGl0ZW0gdGhlIG1vdXNlIGlzIG92ZXIsIG9yIG51bGwgaWYgbm9uZSBpcyBmb3VuZFxuICAgICAgICBmdW5jdGlvbiBmaW5kTmVhcmJ5SXRlbShtb3VzZVgsIG1vdXNlWSwgc2VyaWVzRmlsdGVyKSB7XG4gICAgICAgICAgICB2YXIgbWF4RGlzdGFuY2UgPSBvcHRpb25zLmdyaWQubW91c2VBY3RpdmVSYWRpdXMsXG4gICAgICAgICAgICAgICAgc21hbGxlc3REaXN0YW5jZSA9IG1heERpc3RhbmNlICogbWF4RGlzdGFuY2UgKyAxLFxuICAgICAgICAgICAgICAgIGl0ZW0gPSBudWxsLCBmb3VuZFBvaW50ID0gZmFsc2UsIGksIGosIHBzO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSBzZXJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNlcmllc0ZpbHRlcihzZXJpZXNbaV0pKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIHZhciBzID0gc2VyaWVzW2ldLFxuICAgICAgICAgICAgICAgICAgICBheGlzeCA9IHMueGF4aXMsXG4gICAgICAgICAgICAgICAgICAgIGF4aXN5ID0gcy55YXhpcyxcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRzID0gcy5kYXRhcG9pbnRzLnBvaW50cyxcbiAgICAgICAgICAgICAgICAgICAgbXggPSBheGlzeC5jMnAobW91c2VYKSwgLy8gcHJlY29tcHV0ZSBzb21lIHN0dWZmIHRvIG1ha2UgdGhlIGxvb3AgZmFzdGVyXG4gICAgICAgICAgICAgICAgICAgIG15ID0gYXhpc3kuYzJwKG1vdXNlWSksXG4gICAgICAgICAgICAgICAgICAgIG1heHggPSBtYXhEaXN0YW5jZSAvIGF4aXN4LnNjYWxlLFxuICAgICAgICAgICAgICAgICAgICBtYXh5ID0gbWF4RGlzdGFuY2UgLyBheGlzeS5zY2FsZTtcblxuICAgICAgICAgICAgICAgIHBzID0gcy5kYXRhcG9pbnRzLnBvaW50c2l6ZTtcbiAgICAgICAgICAgICAgICAvLyB3aXRoIGludmVyc2UgdHJhbnNmb3Jtcywgd2UgY2FuJ3QgdXNlIHRoZSBtYXh4L21heHlcbiAgICAgICAgICAgICAgICAvLyBvcHRpbWl6YXRpb24sIHNhZGx5XG4gICAgICAgICAgICAgICAgaWYgKGF4aXN4Lm9wdGlvbnMuaW52ZXJzZVRyYW5zZm9ybSlcbiAgICAgICAgICAgICAgICAgICAgbWF4eCA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICAgICAgICAgICAgaWYgKGF4aXN5Lm9wdGlvbnMuaW52ZXJzZVRyYW5zZm9ybSlcbiAgICAgICAgICAgICAgICAgICAgbWF4eSA9IE51bWJlci5NQVhfVkFMVUU7XG5cbiAgICAgICAgICAgICAgICBpZiAocy5saW5lcy5zaG93IHx8IHMucG9pbnRzLnNob3cpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHBvaW50cy5sZW5ndGg7IGogKz0gcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4ID0gcG9pbnRzW2pdLCB5ID0gcG9pbnRzW2ogKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh4ID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBwb2ludHMgYW5kIGxpbmVzLCB0aGUgY3Vyc29yIG11c3QgYmUgd2l0aGluIGFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNlcnRhaW4gZGlzdGFuY2UgdG8gdGhlIGRhdGEgcG9pbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh4IC0gbXggPiBtYXh4IHx8IHggLSBteCA8IC1tYXh4IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeSAtIG15ID4gbWF4eSB8fCB5IC0gbXkgPCAtbWF4eSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSB0byBjYWxjdWxhdGUgZGlzdGFuY2VzIGluIHBpeGVscywgbm90IGluXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkYXRhIHVuaXRzLCBiZWNhdXNlIHRoZSBzY2FsZXMgb2YgdGhlIGF4ZXMgbWF5IGJlIGRpZmZlcmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGR4ID0gTWF0aC5hYnMoYXhpc3gucDJjKHgpIC0gbW91c2VYKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeSA9IE1hdGguYWJzKGF4aXN5LnAyYyh5KSAtIG1vdXNlWSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzdCA9IGR4ICogZHggKyBkeSAqIGR5OyAvLyB3ZSBzYXZlIHRoZSBzcXJ0XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVzZSA8PSB0byBlbnN1cmUgbGFzdCBwb2ludCB0YWtlcyBwcmVjZWRlbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAobGFzdCBnZW5lcmFsbHkgbWVhbnMgb24gdG9wIG9mKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRpc3QgPCBzbWFsbGVzdERpc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hbGxlc3REaXN0YW5jZSA9IGRpc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IFtpLCBqIC8gcHNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHMuYmFycy5zaG93ICYmICFpdGVtKSB7IC8vIG5vIG90aGVyIHBvaW50IGNhbiBiZSBuZWFyYnlcblxuICAgICAgICAgICAgICAgICAgICB2YXIgYmFyTGVmdCwgYmFyUmlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChzLmJhcnMuYWxpZ24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJsZWZ0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFyTGVmdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicmlnaHRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXJMZWZ0ID0gLXMuYmFycy5iYXJXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFyTGVmdCA9IC1zLmJhcnMuYmFyV2lkdGggLyAyO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYmFyUmlnaHQgPSBiYXJMZWZ0ICsgcy5iYXJzLmJhcldpZHRoO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBwb2ludHMubGVuZ3RoOyBqICs9IHBzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IHBvaW50c1tqXSwgeSA9IHBvaW50c1tqICsgMV0sIGIgPSBwb2ludHNbaiArIDJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHggPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yIGEgYmFyIGdyYXBoLCB0aGUgY3Vyc29yIG11c3QgYmUgaW5zaWRlIHRoZSBiYXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXJpZXNbaV0uYmFycy5ob3Jpem9udGFsID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAobXggPD0gTWF0aC5tYXgoYiwgeCkgJiYgbXggPj0gTWF0aC5taW4oYiwgeCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXkgPj0geSArIGJhckxlZnQgJiYgbXkgPD0geSArIGJhclJpZ2h0KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKG14ID49IHggKyBiYXJMZWZ0ICYmIG14IDw9IHggKyBiYXJSaWdodCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBteSA+PSBNYXRoLm1pbihiLCB5KSAmJiBteSA8PSBNYXRoLm1heChiLCB5KSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBbaSwgaiAvIHBzXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICBpID0gaXRlbVswXTtcbiAgICAgICAgICAgICAgICBqID0gaXRlbVsxXTtcbiAgICAgICAgICAgICAgICBwcyA9IHNlcmllc1tpXS5kYXRhcG9pbnRzLnBvaW50c2l6ZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB7IGRhdGFwb2ludDogc2VyaWVzW2ldLmRhdGFwb2ludHMucG9pbnRzLnNsaWNlKGogKiBwcywgKGogKyAxKSAqIHBzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhSW5kZXg6IGosXG4gICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzOiBzZXJpZXNbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzSW5kZXg6IGkgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvbk1vdXNlTW92ZShlKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5ncmlkLmhvdmVyYWJsZSlcbiAgICAgICAgICAgICAgICB0cmlnZ2VyQ2xpY2tIb3ZlckV2ZW50KFwicGxvdGhvdmVyXCIsIGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocykgeyByZXR1cm4gc1tcImhvdmVyYWJsZVwiXSAhPSBmYWxzZTsgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvbk1vdXNlTGVhdmUoZSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZ3JpZC5ob3ZlcmFibGUpXG4gICAgICAgICAgICAgICAgdHJpZ2dlckNsaWNrSG92ZXJFdmVudChcInBsb3Rob3ZlclwiLCBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHMpIHsgcmV0dXJuIGZhbHNlOyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG9uQ2xpY2soZSkge1xuICAgICAgICAgICAgdHJpZ2dlckNsaWNrSG92ZXJFdmVudChcInBsb3RjbGlja1wiLCBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocykgeyByZXR1cm4gc1tcImNsaWNrYWJsZVwiXSAhPSBmYWxzZTsgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0cmlnZ2VyIGNsaWNrIG9yIGhvdmVyIGV2ZW50ICh0aGV5IHNlbmQgdGhlIHNhbWUgcGFyYW1ldGVyc1xuICAgICAgICAvLyBzbyB3ZSBzaGFyZSB0aGVpciBjb2RlKVxuICAgICAgICBmdW5jdGlvbiB0cmlnZ2VyQ2xpY2tIb3ZlckV2ZW50KGV2ZW50bmFtZSwgZXZlbnQsIHNlcmllc0ZpbHRlcikge1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9IGV2ZW50SG9sZGVyLm9mZnNldCgpLFxuICAgICAgICAgICAgICAgIGNhbnZhc1ggPSBldmVudC5wYWdlWCAtIG9mZnNldC5sZWZ0IC0gcGxvdE9mZnNldC5sZWZ0LFxuICAgICAgICAgICAgICAgIGNhbnZhc1kgPSBldmVudC5wYWdlWSAtIG9mZnNldC50b3AgLSBwbG90T2Zmc2V0LnRvcCxcbiAgICAgICAgICAgIHBvcyA9IGNhbnZhc1RvQXhpc0Nvb3Jkcyh7IGxlZnQ6IGNhbnZhc1gsIHRvcDogY2FudmFzWSB9KTtcblxuICAgICAgICAgICAgcG9zLnBhZ2VYID0gZXZlbnQucGFnZVg7XG4gICAgICAgICAgICBwb3MucGFnZVkgPSBldmVudC5wYWdlWTtcblxuICAgICAgICAgICAgdmFyIGl0ZW0gPSBmaW5kTmVhcmJ5SXRlbShjYW52YXNYLCBjYW52YXNZLCBzZXJpZXNGaWx0ZXIpO1xuXG4gICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIC8vIGZpbGwgaW4gbW91c2UgcG9zIGZvciBhbnkgbGlzdGVuZXJzIG91dCB0aGVyZVxuICAgICAgICAgICAgICAgIGl0ZW0ucGFnZVggPSBwYXJzZUludChpdGVtLnNlcmllcy54YXhpcy5wMmMoaXRlbS5kYXRhcG9pbnRbMF0pICsgb2Zmc2V0LmxlZnQgKyBwbG90T2Zmc2V0LmxlZnQsIDEwKTtcbiAgICAgICAgICAgICAgICBpdGVtLnBhZ2VZID0gcGFyc2VJbnQoaXRlbS5zZXJpZXMueWF4aXMucDJjKGl0ZW0uZGF0YXBvaW50WzFdKSArIG9mZnNldC50b3AgKyBwbG90T2Zmc2V0LnRvcCwgMTApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5ncmlkLmF1dG9IaWdobGlnaHQpIHtcbiAgICAgICAgICAgICAgICAvLyBjbGVhciBhdXRvLWhpZ2hsaWdodHNcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhpZ2hsaWdodHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGggPSBoaWdobGlnaHRzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaC5hdXRvID09IGV2ZW50bmFtZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIShpdGVtICYmIGguc2VyaWVzID09IGl0ZW0uc2VyaWVzICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGgucG9pbnRbMF0gPT0gaXRlbS5kYXRhcG9pbnRbMF0gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaC5wb2ludFsxXSA9PSBpdGVtLmRhdGFwb2ludFsxXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICB1bmhpZ2hsaWdodChoLnNlcmllcywgaC5wb2ludCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0pXG4gICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodChpdGVtLnNlcmllcywgaXRlbS5kYXRhcG9pbnQsIGV2ZW50bmFtZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBsYWNlaG9sZGVyLnRyaWdnZXIoZXZlbnRuYW1lLCBbIHBvcywgaXRlbSBdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRyaWdnZXJSZWRyYXdPdmVybGF5KCkge1xuICAgICAgICAgICAgdmFyIHQgPSBvcHRpb25zLmludGVyYWN0aW9uLnJlZHJhd092ZXJsYXlJbnRlcnZhbDtcbiAgICAgICAgICAgIGlmICh0ID09IC0xKSB7ICAgICAgLy8gc2tpcCBldmVudCBxdWV1ZVxuICAgICAgICAgICAgICAgIGRyYXdPdmVybGF5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXJlZHJhd1RpbWVvdXQpXG4gICAgICAgICAgICAgICAgcmVkcmF3VGltZW91dCA9IHNldFRpbWVvdXQoZHJhd092ZXJsYXksIHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZHJhd092ZXJsYXkoKSB7XG4gICAgICAgICAgICByZWRyYXdUaW1lb3V0ID0gbnVsbDtcblxuICAgICAgICAgICAgLy8gZHJhdyBoaWdobGlnaHRzXG4gICAgICAgICAgICBvY3R4LnNhdmUoKTtcbiAgICAgICAgICAgIG92ZXJsYXkuY2xlYXIoKTtcbiAgICAgICAgICAgIG9jdHgudHJhbnNsYXRlKHBsb3RPZmZzZXQubGVmdCwgcGxvdE9mZnNldC50b3ApO1xuXG4gICAgICAgICAgICB2YXIgaSwgaGk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaGlnaGxpZ2h0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGhpID0gaGlnaGxpZ2h0c1tpXTtcblxuICAgICAgICAgICAgICAgIGlmIChoaS5zZXJpZXMuYmFycy5zaG93KVxuICAgICAgICAgICAgICAgICAgICBkcmF3QmFySGlnaGxpZ2h0KGhpLnNlcmllcywgaGkucG9pbnQpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgZHJhd1BvaW50SGlnaGxpZ2h0KGhpLnNlcmllcywgaGkucG9pbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb2N0eC5yZXN0b3JlKCk7XG5cbiAgICAgICAgICAgIGV4ZWN1dGVIb29rcyhob29rcy5kcmF3T3ZlcmxheSwgW29jdHhdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGhpZ2hsaWdodChzLCBwb2ludCwgYXV0bykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzID09IFwibnVtYmVyXCIpXG4gICAgICAgICAgICAgICAgcyA9IHNlcmllc1tzXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwb2ludCA9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBzID0gcy5kYXRhcG9pbnRzLnBvaW50c2l6ZTtcbiAgICAgICAgICAgICAgICBwb2ludCA9IHMuZGF0YXBvaW50cy5wb2ludHMuc2xpY2UocHMgKiBwb2ludCwgcHMgKiAocG9pbnQgKyAxKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBpID0gaW5kZXhPZkhpZ2hsaWdodChzLCBwb2ludCk7XG4gICAgICAgICAgICBpZiAoaSA9PSAtMSkge1xuICAgICAgICAgICAgICAgIGhpZ2hsaWdodHMucHVzaCh7IHNlcmllczogcywgcG9pbnQ6IHBvaW50LCBhdXRvOiBhdXRvIH0pO1xuXG4gICAgICAgICAgICAgICAgdHJpZ2dlclJlZHJhd092ZXJsYXkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCFhdXRvKVxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodHNbaV0uYXV0byA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdW5oaWdobGlnaHQocywgcG9pbnQpIHtcbiAgICAgICAgICAgIGlmIChzID09IG51bGwgJiYgcG9pbnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGhpZ2hsaWdodHMgPSBbXTtcbiAgICAgICAgICAgICAgICB0cmlnZ2VyUmVkcmF3T3ZlcmxheSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzID09IFwibnVtYmVyXCIpXG4gICAgICAgICAgICAgICAgcyA9IHNlcmllc1tzXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwb2ludCA9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBzID0gcy5kYXRhcG9pbnRzLnBvaW50c2l6ZTtcbiAgICAgICAgICAgICAgICBwb2ludCA9IHMuZGF0YXBvaW50cy5wb2ludHMuc2xpY2UocHMgKiBwb2ludCwgcHMgKiAocG9pbnQgKyAxKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBpID0gaW5kZXhPZkhpZ2hsaWdodChzLCBwb2ludCk7XG4gICAgICAgICAgICBpZiAoaSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIGhpZ2hsaWdodHMuc3BsaWNlKGksIDEpO1xuXG4gICAgICAgICAgICAgICAgdHJpZ2dlclJlZHJhd092ZXJsYXkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGluZGV4T2ZIaWdobGlnaHQocywgcCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoaWdobGlnaHRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGggPSBoaWdobGlnaHRzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChoLnNlcmllcyA9PSBzICYmIGgucG9pbnRbMF0gPT0gcFswXVxuICAgICAgICAgICAgICAgICAgICAmJiBoLnBvaW50WzFdID09IHBbMV0pXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZHJhd1BvaW50SGlnaGxpZ2h0KHNlcmllcywgcG9pbnQpIHtcbiAgICAgICAgICAgIHZhciB4ID0gcG9pbnRbMF0sIHkgPSBwb2ludFsxXSxcbiAgICAgICAgICAgICAgICBheGlzeCA9IHNlcmllcy54YXhpcywgYXhpc3kgPSBzZXJpZXMueWF4aXMsXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0Q29sb3IgPSAodHlwZW9mIHNlcmllcy5oaWdobGlnaHRDb2xvciA9PT0gXCJzdHJpbmdcIikgPyBzZXJpZXMuaGlnaGxpZ2h0Q29sb3IgOiAkLmNvbG9yLnBhcnNlKHNlcmllcy5jb2xvcikuc2NhbGUoJ2EnLCAwLjUpLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIGlmICh4IDwgYXhpc3gubWluIHx8IHggPiBheGlzeC5tYXggfHwgeSA8IGF4aXN5Lm1pbiB8fCB5ID4gYXhpc3kubWF4KVxuICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgdmFyIHBvaW50UmFkaXVzID0gc2VyaWVzLnBvaW50cy5yYWRpdXMgKyBzZXJpZXMucG9pbnRzLmxpbmVXaWR0aCAvIDI7XG4gICAgICAgICAgICBvY3R4LmxpbmVXaWR0aCA9IHBvaW50UmFkaXVzO1xuICAgICAgICAgICAgb2N0eC5zdHJva2VTdHlsZSA9IGhpZ2hsaWdodENvbG9yO1xuICAgICAgICAgICAgdmFyIHJhZGl1cyA9IDEuNSAqIHBvaW50UmFkaXVzO1xuICAgICAgICAgICAgeCA9IGF4aXN4LnAyYyh4KTtcbiAgICAgICAgICAgIHkgPSBheGlzeS5wMmMoeSk7XG5cbiAgICAgICAgICAgIG9jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICBpZiAoc2VyaWVzLnBvaW50cy5zeW1ib2wgPT0gXCJjaXJjbGVcIilcbiAgICAgICAgICAgICAgICBvY3R4LmFyYyh4LCB5LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc2VyaWVzLnBvaW50cy5zeW1ib2wob2N0eCwgeCwgeSwgcmFkaXVzLCBmYWxzZSk7XG4gICAgICAgICAgICBvY3R4LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgb2N0eC5zdHJva2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRyYXdCYXJIaWdobGlnaHQoc2VyaWVzLCBwb2ludCkge1xuICAgICAgICAgICAgdmFyIGhpZ2hsaWdodENvbG9yID0gKHR5cGVvZiBzZXJpZXMuaGlnaGxpZ2h0Q29sb3IgPT09IFwic3RyaW5nXCIpID8gc2VyaWVzLmhpZ2hsaWdodENvbG9yIDogJC5jb2xvci5wYXJzZShzZXJpZXMuY29sb3IpLnNjYWxlKCdhJywgMC41KS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIGZpbGxTdHlsZSA9IGhpZ2hsaWdodENvbG9yLFxuICAgICAgICAgICAgICAgIGJhckxlZnQ7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoc2VyaWVzLmJhcnMuYWxpZ24pIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwibGVmdFwiOlxuICAgICAgICAgICAgICAgICAgICBiYXJMZWZ0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcInJpZ2h0XCI6XG4gICAgICAgICAgICAgICAgICAgIGJhckxlZnQgPSAtc2VyaWVzLmJhcnMuYmFyV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGJhckxlZnQgPSAtc2VyaWVzLmJhcnMuYmFyV2lkdGggLyAyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvY3R4LmxpbmVXaWR0aCA9IHNlcmllcy5iYXJzLmxpbmVXaWR0aDtcbiAgICAgICAgICAgIG9jdHguc3Ryb2tlU3R5bGUgPSBoaWdobGlnaHRDb2xvcjtcblxuICAgICAgICAgICAgZHJhd0Jhcihwb2ludFswXSwgcG9pbnRbMV0sIHBvaW50WzJdIHx8IDAsIGJhckxlZnQsIGJhckxlZnQgKyBzZXJpZXMuYmFycy5iYXJXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkgeyByZXR1cm4gZmlsbFN0eWxlOyB9LCBzZXJpZXMueGF4aXMsIHNlcmllcy55YXhpcywgb2N0eCwgc2VyaWVzLmJhcnMuaG9yaXpvbnRhbCwgc2VyaWVzLmJhcnMubGluZVdpZHRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldENvbG9yT3JHcmFkaWVudChzcGVjLCBib3R0b20sIHRvcCwgZGVmYXVsdENvbG9yKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNwZWMgPT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgICAgICByZXR1cm4gc3BlYztcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFzc3VtZSB0aGlzIGlzIGEgZ3JhZGllbnQgc3BlYzsgSUUgY3VycmVudGx5IG9ubHlcbiAgICAgICAgICAgICAgICAvLyBzdXBwb3J0cyBhIHNpbXBsZSB2ZXJ0aWNhbCBncmFkaWVudCBwcm9wZXJseSwgc28gdGhhdCdzXG4gICAgICAgICAgICAgICAgLy8gd2hhdCB3ZSBzdXBwb3J0IHRvb1xuICAgICAgICAgICAgICAgIHZhciBncmFkaWVudCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCB0b3AsIDAsIGJvdHRvbSk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHNwZWMuY29sb3JzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHNwZWMuY29sb3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGMgIT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvID0gJC5jb2xvci5wYXJzZShkZWZhdWx0Q29sb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGMuYnJpZ2h0bmVzcyAhPSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvID0gY28uc2NhbGUoJ3JnYicsIGMuYnJpZ2h0bmVzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYy5vcGFjaXR5ICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY28uYSAqPSBjLm9wYWNpdHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjID0gY28udG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoaSAvIChsIC0gMSksIGMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBncmFkaWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFkZCB0aGUgcGxvdCBmdW5jdGlvbiB0byB0aGUgdG9wIGxldmVsIG9mIHRoZSBqUXVlcnkgb2JqZWN0XG5cbiAgICAkLnBsb3QgPSBmdW5jdGlvbihwbGFjZWhvbGRlciwgZGF0YSwgb3B0aW9ucykge1xuICAgICAgICAvL3ZhciB0MCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHZhciBwbG90ID0gbmV3IFBsb3QoJChwbGFjZWhvbGRlciksIGRhdGEsIG9wdGlvbnMsICQucGxvdC5wbHVnaW5zKTtcbiAgICAgICAgLy8od2luZG93LmNvbnNvbGUgPyBjb25zb2xlLmxvZyA6IGFsZXJ0KShcInRpbWUgdXNlZCAobXNlY3MpOiBcIiArICgobmV3IERhdGUoKSkuZ2V0VGltZSgpIC0gdDAuZ2V0VGltZSgpKSk7XG4gICAgICAgIHJldHVybiBwbG90O1xuICAgIH07XG5cbiAgICAkLnBsb3QudmVyc2lvbiA9IFwiMC44LjJcIjtcblxuICAgICQucGxvdC5wbHVnaW5zID0gW107XG5cbiAgICAvLyBBbHNvIGFkZCB0aGUgcGxvdCBmdW5jdGlvbiBhcyBhIGNoYWluYWJsZSBwcm9wZXJ0eVxuXG4gICAgJC5mbi5wbG90ID0gZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJC5wbG90KHRoaXMsIGRhdGEsIG9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gcm91bmQgdG8gbmVhcmJ5IGxvd2VyIG11bHRpcGxlIG9mIGJhc2VcbiAgICBmdW5jdGlvbiBmbG9vckluQmFzZShuLCBiYXNlKSB7XG4gICAgICAgIHJldHVybiBiYXNlICogTWF0aC5mbG9vcihuIC8gYmFzZSk7XG4gICAgfVxuXG59KShqUXVlcnkpO1xuIl19

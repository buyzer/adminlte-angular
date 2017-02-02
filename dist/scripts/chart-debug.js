/*!
 * Chart.js
 * http://chartjs.org/
 * Version: 1.1.1
 *
 * Copyright 2015 Nick Downie
 * Released under the MIT license
 * https://github.com/nnnick/Chart.js/blob/master/LICENSE.md
 */


(function(){

	"use strict";

	//Declare root variable - window in the browser, global on the server
	var root = this,
		previous = root.Chart;

	//Occupy the global variable of Chart, and create a simple base class
	var Chart = function(context){
		var chart = this;
		this.canvas = context.canvas;

		this.ctx = context;

		//Variables global to the chart
		var computeDimension = function(element,dimension)
		{
			if (element['offset'+dimension])
			{
				return element['offset'+dimension];
			}
			else
			{
				return document.defaultView.getComputedStyle(element).getPropertyValue(dimension);
			}
		};

		var width = this.width = computeDimension(context.canvas,'Width') || context.canvas.width;
		var height = this.height = computeDimension(context.canvas,'Height') || context.canvas.height;

		this.aspectRatio = this.width / this.height;
		//High pixel density displays - multiply the size of the canvas height/width by the device pixel ratio, then scale.
		helpers.retinaScale(this);

		return this;
	};
	//Globally expose the defaults to allow for user updating/changing
	Chart.defaults = {
		global: {
			// Boolean - Whether to animate the chart
			animation: true,

			// Number - Number of animation steps
			animationSteps: 60,

			// String - Animation easing effect
			animationEasing: "easeOutQuart",

			// Boolean - If we should show the scale at all
			showScale: true,

			// Boolean - If we want to override with a hard coded scale
			scaleOverride: false,

			// ** Required if scaleOverride is true **
			// Number - The number of steps in a hard coded scale
			scaleSteps: null,
			// Number - The value jump in the hard coded scale
			scaleStepWidth: null,
			// Number - The scale starting value
			scaleStartValue: null,

			// String - Colour of the scale line
			scaleLineColor: "rgba(0,0,0,.1)",

			// Number - Pixel width of the scale line
			scaleLineWidth: 1,

			// Boolean - Whether to show labels on the scale
			scaleShowLabels: true,

			// Interpolated JS string - can access value
			scaleLabel: "<%=value%>",

			// Boolean - Whether the scale should stick to integers, and not show any floats even if drawing space is there
			scaleIntegersOnly: true,

			// Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
			scaleBeginAtZero: false,

			// String - Scale label font declaration for the scale label
			scaleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

			// Number - Scale label font size in pixels
			scaleFontSize: 12,

			// String - Scale label font weight style
			scaleFontStyle: "normal",

			// String - Scale label font colour
			scaleFontColor: "#666",

			// Boolean - whether or not the chart should be responsive and resize when the browser does.
			responsive: false,

			// Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
			maintainAspectRatio: true,

			// Boolean - Determines whether to draw tooltips on the canvas or not - attaches events to touchmove & mousemove
			showTooltips: true,

			// Boolean - Determines whether to draw built-in tooltip or call custom tooltip function
			customTooltips: false,

			// Array - Array of string names to attach tooltip events
			tooltipEvents: ["mousemove", "touchstart", "touchmove", "mouseout"],

			// String - Tooltip background colour
			tooltipFillColor: "rgba(0,0,0,0.8)",

			// String - Tooltip label font declaration for the scale label
			tooltipFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

			// Number - Tooltip label font size in pixels
			tooltipFontSize: 14,

			// String - Tooltip font weight style
			tooltipFontStyle: "normal",

			// String - Tooltip label font colour
			tooltipFontColor: "#fff",

			// String - Tooltip title font declaration for the scale label
			tooltipTitleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

			// Number - Tooltip title font size in pixels
			tooltipTitleFontSize: 14,

			// String - Tooltip title font weight style
			tooltipTitleFontStyle: "bold",

			// String - Tooltip title font colour
			tooltipTitleFontColor: "#fff",

			// String - Tooltip title template
			tooltipTitleTemplate: "<%= label%>",

			// Number - pixel width of padding around tooltip text
			tooltipYPadding: 6,

			// Number - pixel width of padding around tooltip text
			tooltipXPadding: 6,

			// Number - Size of the caret on the tooltip
			tooltipCaretSize: 8,

			// Number - Pixel radius of the tooltip border
			tooltipCornerRadius: 6,

			// Number - Pixel offset from point x to tooltip edge
			tooltipXOffset: 10,

			// String - Template string for single tooltips
			tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>",

			// String - Template string for single tooltips
			multiTooltipTemplate: "<%= datasetLabel %>: <%= value %>",

			// String - Colour behind the legend colour block
			multiTooltipKeyBackground: '#fff',

			// Array - A list of colors to use as the defaults
			segmentColorDefault: ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99", "#E31A1C", "#FDBF6F", "#FF7F00", "#CAB2D6", "#6A3D9A", "#B4B482", "#B15928" ],

			// Array - A list of highlight colors to use as the defaults
			segmentHighlightColorDefaults: [ "#CEF6FF", "#47A0DC", "#DAFFB2", "#5BC854", "#FFC2C1", "#FF4244", "#FFE797", "#FFA728", "#F2DAFE", "#9265C2", "#DCDCAA", "#D98150" ],

			// Function - Will fire on animation progression.
			onAnimationProgress: function(){},

			// Function - Will fire on animation completion.
			onAnimationComplete: function(){}

		}
	};

	//Create a dictionary of chart types, to allow for extension of existing types
	Chart.types = {};

	//Global Chart helpers object for utility methods and classes
	var helpers = Chart.helpers = {};

		//-- Basic js utility methods
	var each = helpers.each = function(loopable,callback,self){
			var additionalArgs = Array.prototype.slice.call(arguments, 3);
			// Check to see if null or undefined firstly.
			if (loopable){
				if (loopable.length === +loopable.length){
					var i;
					for (i=0; i<loopable.length; i++){
						callback.apply(self,[loopable[i], i].concat(additionalArgs));
					}
				}
				else{
					for (var item in loopable){
						callback.apply(self,[loopable[item],item].concat(additionalArgs));
					}
				}
			}
		},
		clone = helpers.clone = function(obj){
			var objClone = {};
			each(obj,function(value,key){
				if (obj.hasOwnProperty(key)){
					objClone[key] = value;
				}
			});
			return objClone;
		},
		extend = helpers.extend = function(base){
			each(Array.prototype.slice.call(arguments,1), function(extensionObject) {
				each(extensionObject,function(value,key){
					if (extensionObject.hasOwnProperty(key)){
						base[key] = value;
					}
				});
			});
			return base;
		},
		merge = helpers.merge = function(base,master){
			//Merge properties in left object over to a shallow clone of object right.
			var args = Array.prototype.slice.call(arguments,0);
			args.unshift({});
			return extend.apply(null, args);
		},
		indexOf = helpers.indexOf = function(arrayToSearch, item){
			if (Array.prototype.indexOf) {
				return arrayToSearch.indexOf(item);
			}
			else{
				for (var i = 0; i < arrayToSearch.length; i++) {
					if (arrayToSearch[i] === item) return i;
				}
				return -1;
			}
		},
		where = helpers.where = function(collection, filterCallback){
			var filtered = [];

			helpers.each(collection, function(item){
				if (filterCallback(item)){
					filtered.push(item);
				}
			});

			return filtered;
		},
		findNextWhere = helpers.findNextWhere = function(arrayToSearch, filterCallback, startIndex){
			// Default to start of the array
			if (!startIndex){
				startIndex = -1;
			}
			for (var i = startIndex + 1; i < arrayToSearch.length; i++) {
				var currentItem = arrayToSearch[i];
				if (filterCallback(currentItem)){
					return currentItem;
				}
			}
		},
		findPreviousWhere = helpers.findPreviousWhere = function(arrayToSearch, filterCallback, startIndex){
			// Default to end of the array
			if (!startIndex){
				startIndex = arrayToSearch.length;
			}
			for (var i = startIndex - 1; i >= 0; i--) {
				var currentItem = arrayToSearch[i];
				if (filterCallback(currentItem)){
					return currentItem;
				}
			}
		},
		inherits = helpers.inherits = function(extensions){
			//Basic javascript inheritance based on the model created in Backbone.js
			var parent = this;
			var ChartElement = (extensions && extensions.hasOwnProperty("constructor")) ? extensions.constructor : function(){ return parent.apply(this, arguments); };

			var Surrogate = function(){ this.constructor = ChartElement;};
			Surrogate.prototype = parent.prototype;
			ChartElement.prototype = new Surrogate();

			ChartElement.extend = inherits;

			if (extensions) extend(ChartElement.prototype, extensions);

			ChartElement.__super__ = parent.prototype;

			return ChartElement;
		},
		noop = helpers.noop = function(){},
		uid = helpers.uid = (function(){
			var id=0;
			return function(){
				return "chart-" + id++;
			};
		})(),
		warn = helpers.warn = function(str){
			//Method for warning of errors
			if (window.console && typeof window.console.warn === "function") console.warn(str);
		},
		amd = helpers.amd = (typeof define === 'function' && define.amd),
		//-- Math methods
		isNumber = helpers.isNumber = function(n){
			return !isNaN(parseFloat(n)) && isFinite(n);
		},
		max = helpers.max = function(array){
			return Math.max.apply( Math, array );
		},
		min = helpers.min = function(array){
			return Math.min.apply( Math, array );
		},
		cap = helpers.cap = function(valueToCap,maxValue,minValue){
			if(isNumber(maxValue)) {
				if( valueToCap > maxValue ) {
					return maxValue;
				}
			}
			else if(isNumber(minValue)){
				if ( valueToCap < minValue ){
					return minValue;
				}
			}
			return valueToCap;
		},
		getDecimalPlaces = helpers.getDecimalPlaces = function(num){
			if (num%1!==0 && isNumber(num)){
				var s = num.toString();
				if(s.indexOf("e-") < 0){
					// no exponent, e.g. 0.01
					return s.split(".")[1].length;
				}
				else if(s.indexOf(".") < 0) {
					// no decimal point, e.g. 1e-9
					return parseInt(s.split("e-")[1]);
				}
				else {
					// exponent and decimal point, e.g. 1.23e-9
					var parts = s.split(".")[1].split("e-");
					return parts[0].length + parseInt(parts[1]);
				}
			}
			else {
				return 0;
			}
		},
		toRadians = helpers.radians = function(degrees){
			return degrees * (Math.PI/180);
		},
		// Gets the angle from vertical upright to the point about a centre.
		getAngleFromPoint = helpers.getAngleFromPoint = function(centrePoint, anglePoint){
			var distanceFromXCenter = anglePoint.x - centrePoint.x,
				distanceFromYCenter = anglePoint.y - centrePoint.y,
				radialDistanceFromCenter = Math.sqrt( distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);


			var angle = Math.PI * 2 + Math.atan2(distanceFromYCenter, distanceFromXCenter);

			//If the segment is in the top left quadrant, we need to add another rotation to the angle
			if (distanceFromXCenter < 0 && distanceFromYCenter < 0){
				angle += Math.PI*2;
			}

			return {
				angle: angle,
				distance: radialDistanceFromCenter
			};
		},
		aliasPixel = helpers.aliasPixel = function(pixelWidth){
			return (pixelWidth % 2 === 0) ? 0 : 0.5;
		},
		splineCurve = helpers.splineCurve = function(FirstPoint,MiddlePoint,AfterPoint,t){
			//Props to Rob Spencer at scaled innovation for his post on splining between points
			//http://scaledinnovation.com/analytics/splines/aboutSplines.html
			var d01=Math.sqrt(Math.pow(MiddlePoint.x-FirstPoint.x,2)+Math.pow(MiddlePoint.y-FirstPoint.y,2)),
				d12=Math.sqrt(Math.pow(AfterPoint.x-MiddlePoint.x,2)+Math.pow(AfterPoint.y-MiddlePoint.y,2)),
				fa=t*d01/(d01+d12),// scaling factor for triangle Ta
				fb=t*d12/(d01+d12);
			return {
				inner : {
					x : MiddlePoint.x-fa*(AfterPoint.x-FirstPoint.x),
					y : MiddlePoint.y-fa*(AfterPoint.y-FirstPoint.y)
				},
				outer : {
					x: MiddlePoint.x+fb*(AfterPoint.x-FirstPoint.x),
					y : MiddlePoint.y+fb*(AfterPoint.y-FirstPoint.y)
				}
			};
		},
		calculateOrderOfMagnitude = helpers.calculateOrderOfMagnitude = function(val){
			return Math.floor(Math.log(val) / Math.LN10);
		},
		calculateScaleRange = helpers.calculateScaleRange = function(valuesArray, drawingSize, textSize, startFromZero, integersOnly){

			//Set a minimum step of two - a point at the top of the graph, and a point at the base
			var minSteps = 2,
				maxSteps = Math.floor(drawingSize/(textSize * 1.5)),
				skipFitting = (minSteps >= maxSteps);

			// Filter out null values since these would min() to zero
			var values = [];
			each(valuesArray, function( v ){
				v == null || values.push( v );
			});
			var minValue = min(values),
			    maxValue = max(values);

			// We need some degree of separation here to calculate the scales if all the values are the same
			// Adding/minusing 0.5 will give us a range of 1.
			if (maxValue === minValue){
				maxValue += 0.5;
				// So we don't end up with a graph with a negative start value if we've said always start from zero
				if (minValue >= 0.5 && !startFromZero){
					minValue -= 0.5;
				}
				else{
					// Make up a whole number above the values
					maxValue += 0.5;
				}
			}

			var	valueRange = Math.abs(maxValue - minValue),
				rangeOrderOfMagnitude = calculateOrderOfMagnitude(valueRange),
				graphMax = Math.ceil(maxValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
				graphMin = (startFromZero) ? 0 : Math.floor(minValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
				graphRange = graphMax - graphMin,
				stepValue = Math.pow(10, rangeOrderOfMagnitude),
				numberOfSteps = Math.round(graphRange / stepValue);

			//If we have more space on the graph we'll use it to give more definition to the data
			while((numberOfSteps > maxSteps || (numberOfSteps * 2) < maxSteps) && !skipFitting) {
				if(numberOfSteps > maxSteps){
					stepValue *=2;
					numberOfSteps = Math.round(graphRange/stepValue);
					// Don't ever deal with a decimal number of steps - cancel fitting and just use the minimum number of steps.
					if (numberOfSteps % 1 !== 0){
						skipFitting = true;
					}
				}
				//We can fit in double the amount of scale points on the scale
				else{
					//If user has declared ints only, and the step value isn't a decimal
					if (integersOnly && rangeOrderOfMagnitude >= 0){
						//If the user has said integers only, we need to check that making the scale more granular wouldn't make it a float
						if(stepValue/2 % 1 === 0){
							stepValue /=2;
							numberOfSteps = Math.round(graphRange/stepValue);
						}
						//If it would make it a float break out of the loop
						else{
							break;
						}
					}
					//If the scale doesn't have to be an int, make the scale more granular anyway.
					else{
						stepValue /=2;
						numberOfSteps = Math.round(graphRange/stepValue);
					}

				}
			}

			if (skipFitting){
				numberOfSteps = minSteps;
				stepValue = graphRange / numberOfSteps;
			}

			return {
				steps : numberOfSteps,
				stepValue : stepValue,
				min : graphMin,
				max	: graphMin + (numberOfSteps * stepValue)
			};

		},
		/* jshint ignore:start */
		// Blows up jshint errors based on the new Function constructor
		//Templating methods
		//Javascript micro templating by John Resig - source at http://ejohn.org/blog/javascript-micro-templating/
		template = helpers.template = function(templateString, valuesObject){

			// If templateString is function rather than string-template - call the function for valuesObject

			if(templateString instanceof Function){
			 	return templateString(valuesObject);
		 	}

			var cache = {};
			function tmpl(str, data){
				// Figure out if we're getting a template, or if we need to
				// load the template - and be sure to cache the result.
				var fn = !/\W/.test(str) ?
				cache[str] = cache[str] :

				// Generate a reusable function that will serve as a template
				// generator (and which will be cached).
				new Function("obj",
					"var p=[],print=function(){p.push.apply(p,arguments);};" +

					// Introduce the data as local variables using with(){}
					"with(obj){p.push('" +

					// Convert the template into pure JavaScript
					str
						.replace(/[\r\t\n]/g, " ")
						.split("<%").join("\t")
						.replace(/((^|%>)[^\t]*)'/g, "$1\r")
						.replace(/\t=(.*?)%>/g, "',$1,'")
						.split("\t").join("');")
						.split("%>").join("p.push('")
						.split("\r").join("\\'") +
					"');}return p.join('');"
				);

				// Provide some basic currying to the user
				return data ? fn( data ) : fn;
			}
			return tmpl(templateString,valuesObject);
		},
		/* jshint ignore:end */
		generateLabels = helpers.generateLabels = function(templateString,numberOfSteps,graphMin,stepValue){
			var labelsArray = new Array(numberOfSteps);
			if (templateString){
				each(labelsArray,function(val,index){
					labelsArray[index] = template(templateString,{value: (graphMin + (stepValue*(index+1)))});
				});
			}
			return labelsArray;
		},
		//--Animation methods
		//Easing functions adapted from Robert Penner's easing equations
		//http://www.robertpenner.com/easing/
		easingEffects = helpers.easingEffects = {
			linear: function (t) {
				return t;
			},
			easeInQuad: function (t) {
				return t * t;
			},
			easeOutQuad: function (t) {
				return -1 * t * (t - 2);
			},
			easeInOutQuad: function (t) {
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * t * t;
				}
				return -1 / 2 * ((--t) * (t - 2) - 1);
			},
			easeInCubic: function (t) {
				return t * t * t;
			},
			easeOutCubic: function (t) {
				return 1 * ((t = t / 1 - 1) * t * t + 1);
			},
			easeInOutCubic: function (t) {
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * t * t * t;
				}
				return 1 / 2 * ((t -= 2) * t * t + 2);
			},
			easeInQuart: function (t) {
				return t * t * t * t;
			},
			easeOutQuart: function (t) {
				return -1 * ((t = t / 1 - 1) * t * t * t - 1);
			},
			easeInOutQuart: function (t) {
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * t * t * t * t;
				}
				return -1 / 2 * ((t -= 2) * t * t * t - 2);
			},
			easeInQuint: function (t) {
				return 1 * (t /= 1) * t * t * t * t;
			},
			easeOutQuint: function (t) {
				return 1 * ((t = t / 1 - 1) * t * t * t * t + 1);
			},
			easeInOutQuint: function (t) {
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * t * t * t * t * t;
				}
				return 1 / 2 * ((t -= 2) * t * t * t * t + 2);
			},
			easeInSine: function (t) {
				return -1 * Math.cos(t / 1 * (Math.PI / 2)) + 1;
			},
			easeOutSine: function (t) {
				return 1 * Math.sin(t / 1 * (Math.PI / 2));
			},
			easeInOutSine: function (t) {
				return -1 / 2 * (Math.cos(Math.PI * t / 1) - 1);
			},
			easeInExpo: function (t) {
				return (t === 0) ? 1 : 1 * Math.pow(2, 10 * (t / 1 - 1));
			},
			easeOutExpo: function (t) {
				return (t === 1) ? 1 : 1 * (-Math.pow(2, -10 * t / 1) + 1);
			},
			easeInOutExpo: function (t) {
				if (t === 0){
					return 0;
				}
				if (t === 1){
					return 1;
				}
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * Math.pow(2, 10 * (t - 1));
				}
				return 1 / 2 * (-Math.pow(2, -10 * --t) + 2);
			},
			easeInCirc: function (t) {
				if (t >= 1){
					return t;
				}
				return -1 * (Math.sqrt(1 - (t /= 1) * t) - 1);
			},
			easeOutCirc: function (t) {
				return 1 * Math.sqrt(1 - (t = t / 1 - 1) * t);
			},
			easeInOutCirc: function (t) {
				if ((t /= 1 / 2) < 1){
					return -1 / 2 * (Math.sqrt(1 - t * t) - 1);
				}
				return 1 / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1);
			},
			easeInElastic: function (t) {
				var s = 1.70158;
				var p = 0;
				var a = 1;
				if (t === 0){
					return 0;
				}
				if ((t /= 1) == 1){
					return 1;
				}
				if (!p){
					p = 1 * 0.3;
				}
				if (a < Math.abs(1)) {
					a = 1;
					s = p / 4;
				} else{
					s = p / (2 * Math.PI) * Math.asin(1 / a);
				}
				return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p));
			},
			easeOutElastic: function (t) {
				var s = 1.70158;
				var p = 0;
				var a = 1;
				if (t === 0){
					return 0;
				}
				if ((t /= 1) == 1){
					return 1;
				}
				if (!p){
					p = 1 * 0.3;
				}
				if (a < Math.abs(1)) {
					a = 1;
					s = p / 4;
				} else{
					s = p / (2 * Math.PI) * Math.asin(1 / a);
				}
				return a * Math.pow(2, -10 * t) * Math.sin((t * 1 - s) * (2 * Math.PI) / p) + 1;
			},
			easeInOutElastic: function (t) {
				var s = 1.70158;
				var p = 0;
				var a = 1;
				if (t === 0){
					return 0;
				}
				if ((t /= 1 / 2) == 2){
					return 1;
				}
				if (!p){
					p = 1 * (0.3 * 1.5);
				}
				if (a < Math.abs(1)) {
					a = 1;
					s = p / 4;
				} else {
					s = p / (2 * Math.PI) * Math.asin(1 / a);
				}
				if (t < 1){
					return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p));}
				return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p) * 0.5 + 1;
			},
			easeInBack: function (t) {
				var s = 1.70158;
				return 1 * (t /= 1) * t * ((s + 1) * t - s);
			},
			easeOutBack: function (t) {
				var s = 1.70158;
				return 1 * ((t = t / 1 - 1) * t * ((s + 1) * t + s) + 1);
			},
			easeInOutBack: function (t) {
				var s = 1.70158;
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * (t * t * (((s *= (1.525)) + 1) * t - s));
				}
				return 1 / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
			},
			easeInBounce: function (t) {
				return 1 - easingEffects.easeOutBounce(1 - t);
			},
			easeOutBounce: function (t) {
				if ((t /= 1) < (1 / 2.75)) {
					return 1 * (7.5625 * t * t);
				} else if (t < (2 / 2.75)) {
					return 1 * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75);
				} else if (t < (2.5 / 2.75)) {
					return 1 * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375);
				} else {
					return 1 * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
				}
			},
			easeInOutBounce: function (t) {
				if (t < 1 / 2){
					return easingEffects.easeInBounce(t * 2) * 0.5;
				}
				return easingEffects.easeOutBounce(t * 2 - 1) * 0.5 + 1 * 0.5;
			}
		},
		//Request animation polyfill - http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
		requestAnimFrame = helpers.requestAnimFrame = (function(){
			return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function(callback) {
					return window.setTimeout(callback, 1000 / 60);
				};
		})(),
		cancelAnimFrame = helpers.cancelAnimFrame = (function(){
			return window.cancelAnimationFrame ||
				window.webkitCancelAnimationFrame ||
				window.mozCancelAnimationFrame ||
				window.oCancelAnimationFrame ||
				window.msCancelAnimationFrame ||
				function(callback) {
					return window.clearTimeout(callback, 1000 / 60);
				};
		})(),
		animationLoop = helpers.animationLoop = function(callback,totalSteps,easingString,onProgress,onComplete,chartInstance){

			var currentStep = 0,
				easingFunction = easingEffects[easingString] || easingEffects.linear;

			var animationFrame = function(){
				currentStep++;
				var stepDecimal = currentStep/totalSteps;
				var easeDecimal = easingFunction(stepDecimal);

				callback.call(chartInstance,easeDecimal,stepDecimal, currentStep);
				onProgress.call(chartInstance,easeDecimal,stepDecimal);
				if (currentStep < totalSteps){
					chartInstance.animationFrame = requestAnimFrame(animationFrame);
				} else{
					onComplete.apply(chartInstance);
				}
			};
			requestAnimFrame(animationFrame);
		},
		//-- DOM methods
		getRelativePosition = helpers.getRelativePosition = function(evt){
			var mouseX, mouseY;
			var e = evt.originalEvent || evt,
				canvas = evt.currentTarget || evt.srcElement,
				boundingRect = canvas.getBoundingClientRect();

			if (e.touches){
				mouseX = e.touches[0].clientX - boundingRect.left;
				mouseY = e.touches[0].clientY - boundingRect.top;

			}
			else{
				mouseX = e.clientX - boundingRect.left;
				mouseY = e.clientY - boundingRect.top;
			}

			return {
				x : mouseX,
				y : mouseY
			};

		},
		addEvent = helpers.addEvent = function(node,eventType,method){
			if (node.addEventListener){
				node.addEventListener(eventType,method);
			} else if (node.attachEvent){
				node.attachEvent("on"+eventType, method);
			} else {
				node["on"+eventType] = method;
			}
		},
		removeEvent = helpers.removeEvent = function(node, eventType, handler){
			if (node.removeEventListener){
				node.removeEventListener(eventType, handler, false);
			} else if (node.detachEvent){
				node.detachEvent("on"+eventType,handler);
			} else{
				node["on" + eventType] = noop;
			}
		},
		bindEvents = helpers.bindEvents = function(chartInstance, arrayOfEvents, handler){
			// Create the events object if it's not already present
			if (!chartInstance.events) chartInstance.events = {};

			each(arrayOfEvents,function(eventName){
				chartInstance.events[eventName] = function(){
					handler.apply(chartInstance, arguments);
				};
				addEvent(chartInstance.chart.canvas,eventName,chartInstance.events[eventName]);
			});
		},
		unbindEvents = helpers.unbindEvents = function (chartInstance, arrayOfEvents) {
			each(arrayOfEvents, function(handler,eventName){
				removeEvent(chartInstance.chart.canvas, eventName, handler);
			});
		},
		getMaximumWidth = helpers.getMaximumWidth = function(domNode){
			var container = domNode.parentNode,
			    padding = parseInt(getStyle(container, 'padding-left')) + parseInt(getStyle(container, 'padding-right'));
			// TODO = check cross browser stuff with this.
			return container ? container.clientWidth - padding : 0;
		},
		getMaximumHeight = helpers.getMaximumHeight = function(domNode){
			var container = domNode.parentNode,
			    padding = parseInt(getStyle(container, 'padding-bottom')) + parseInt(getStyle(container, 'padding-top'));
			// TODO = check cross browser stuff with this.
			return container ? container.clientHeight - padding : 0;
		},
		getStyle = helpers.getStyle = function (el, property) {
			return el.currentStyle ?
				el.currentStyle[property] :
				document.defaultView.getComputedStyle(el, null).getPropertyValue(property);
		},
		getMaximumSize = helpers.getMaximumSize = helpers.getMaximumWidth, // legacy support
		retinaScale = helpers.retinaScale = function(chart){
			var ctx = chart.ctx,
				width = chart.canvas.width,
				height = chart.canvas.height;

			if (window.devicePixelRatio) {
				ctx.canvas.style.width = width + "px";
				ctx.canvas.style.height = height + "px";
				ctx.canvas.height = height * window.devicePixelRatio;
				ctx.canvas.width = width * window.devicePixelRatio;
				ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
			}
		},
		//-- Canvas methods
		clear = helpers.clear = function(chart){
			chart.ctx.clearRect(0,0,chart.width,chart.height);
		},
		fontString = helpers.fontString = function(pixelSize,fontStyle,fontFamily){
			return fontStyle + " " + pixelSize+"px " + fontFamily;
		},
		longestText = helpers.longestText = function(ctx,font,arrayOfStrings){
			ctx.font = font;
			var longest = 0;
			each(arrayOfStrings,function(string){
				var textWidth = ctx.measureText(string).width;
				longest = (textWidth > longest) ? textWidth : longest;
			});
			return longest;
		},
		drawRoundedRectangle = helpers.drawRoundedRectangle = function(ctx,x,y,width,height,radius){
			ctx.beginPath();
			ctx.moveTo(x + radius, y);
			ctx.lineTo(x + width - radius, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
			ctx.lineTo(x + width, y + height - radius);
			ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
			ctx.lineTo(x + radius, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
			ctx.lineTo(x, y + radius);
			ctx.quadraticCurveTo(x, y, x + radius, y);
			ctx.closePath();
		};


	//Store a reference to each instance - allowing us to globally resize chart instances on window resize.
	//Destroy method on the chart will remove the instance of the chart from this reference.
	Chart.instances = {};

	Chart.Type = function(data,options,chart){
		this.options = options;
		this.chart = chart;
		this.id = uid();
		//Add the chart instance to the global namespace
		Chart.instances[this.id] = this;

		// Initialize is always called when a chart type is created
		// By default it is a no op, but it should be extended
		if (options.responsive){
			this.resize();
		}
		this.initialize.call(this,data);
	};

	//Core methods that'll be a part of every chart type
	extend(Chart.Type.prototype,{
		initialize : function(){return this;},
		clear : function(){
			clear(this.chart);
			return this;
		},
		stop : function(){
			// Stops any current animation loop occuring
			Chart.animationService.cancelAnimation(this);
			return this;
		},
		resize : function(callback){
			this.stop();
			var canvas = this.chart.canvas,
				newWidth = getMaximumWidth(this.chart.canvas),
				newHeight = this.options.maintainAspectRatio ? newWidth / this.chart.aspectRatio : getMaximumHeight(this.chart.canvas);

			canvas.width = this.chart.width = newWidth;
			canvas.height = this.chart.height = newHeight;

			retinaScale(this.chart);

			if (typeof callback === "function"){
				callback.apply(this, Array.prototype.slice.call(arguments, 1));
			}
			return this;
		},
		reflow : noop,
		render : function(reflow){
			if (reflow){
				this.reflow();
			}
			
			if (this.options.animation && !reflow){
				var animation = new Chart.Animation();
				animation.numSteps = this.options.animationSteps;
				animation.easing = this.options.animationEasing;
				
				// render function
				animation.render = function(chartInstance, animationObject) {
					var easingFunction = helpers.easingEffects[animationObject.easing];
					var stepDecimal = animationObject.currentStep / animationObject.numSteps;
					var easeDecimal = easingFunction(stepDecimal);
					
					chartInstance.draw(easeDecimal, stepDecimal, animationObject.currentStep);
				};
				
				// user events
				animation.onAnimationProgress = this.options.onAnimationProgress;
				animation.onAnimationComplete = this.options.onAnimationComplete;
				
				Chart.animationService.addAnimation(this, animation);
			}
			else{
				this.draw();
				this.options.onAnimationComplete.call(this);
			}
			return this;
		},
		generateLegend : function(){
			return helpers.template(this.options.legendTemplate, this);
		},
		destroy : function(){
			this.stop();
			this.clear();
			unbindEvents(this, this.events);
			var canvas = this.chart.canvas;

			// Reset canvas height/width attributes starts a fresh with the canvas context
			canvas.width = this.chart.width;
			canvas.height = this.chart.height;

			// < IE9 doesn't support removeProperty
			if (canvas.style.removeProperty) {
				canvas.style.removeProperty('width');
				canvas.style.removeProperty('height');
			} else {
				canvas.style.removeAttribute('width');
				canvas.style.removeAttribute('height');
			}

			delete Chart.instances[this.id];
		},
		showTooltip : function(ChartElements, forceRedraw){
			// Only redraw the chart if we've actually changed what we're hovering on.
			if (typeof this.activeElements === 'undefined') this.activeElements = [];

			var isChanged = (function(Elements){
				var changed = false;

				if (Elements.length !== this.activeElements.length){
					changed = true;
					return changed;
				}

				each(Elements, function(element, index){
					if (element !== this.activeElements[index]){
						changed = true;
					}
				}, this);
				return changed;
			}).call(this, ChartElements);

			if (!isChanged && !forceRedraw){
				return;
			}
			else{
				this.activeElements = ChartElements;
			}
			this.draw();
			if(this.options.customTooltips){
				this.options.customTooltips(false);
			}
			if (ChartElements.length > 0){
				// If we have multiple datasets, show a MultiTooltip for all of the data points at that index
				if (this.datasets && this.datasets.length > 1) {
					var dataArray,
						dataIndex;

					for (var i = this.datasets.length - 1; i >= 0; i--) {
						dataArray = this.datasets[i].points || this.datasets[i].bars || this.datasets[i].segments;
						dataIndex = indexOf(dataArray, ChartElements[0]);
						if (dataIndex !== -1){
							break;
						}
					}
					var tooltipLabels = [],
						tooltipColors = [],
						medianPosition = (function(index) {

							// Get all the points at that particular index
							var Elements = [],
								dataCollection,
								xPositions = [],
								yPositions = [],
								xMax,
								yMax,
								xMin,
								yMin;
							helpers.each(this.datasets, function(dataset){
								dataCollection = dataset.points || dataset.bars || dataset.segments;
								if (dataCollection[dataIndex] && dataCollection[dataIndex].hasValue()){
									Elements.push(dataCollection[dataIndex]);
								}
							});

							helpers.each(Elements, function(element) {
								xPositions.push(element.x);
								yPositions.push(element.y);


								//Include any colour information about the element
								tooltipLabels.push(helpers.template(this.options.multiTooltipTemplate, element));
								tooltipColors.push({
									fill: element._saved.fillColor || element.fillColor,
									stroke: element._saved.strokeColor || element.strokeColor
								});

							}, this);

							yMin = min(yPositions);
							yMax = max(yPositions);

							xMin = min(xPositions);
							xMax = max(xPositions);

							return {
								x: (xMin > this.chart.width/2) ? xMin : xMax,
								y: (yMin + yMax)/2
							};
						}).call(this, dataIndex);

					new Chart.MultiTooltip({
						x: medianPosition.x,
						y: medianPosition.y,
						xPadding: this.options.tooltipXPadding,
						yPadding: this.options.tooltipYPadding,
						xOffset: this.options.tooltipXOffset,
						fillColor: this.options.tooltipFillColor,
						textColor: this.options.tooltipFontColor,
						fontFamily: this.options.tooltipFontFamily,
						fontStyle: this.options.tooltipFontStyle,
						fontSize: this.options.tooltipFontSize,
						titleTextColor: this.options.tooltipTitleFontColor,
						titleFontFamily: this.options.tooltipTitleFontFamily,
						titleFontStyle: this.options.tooltipTitleFontStyle,
						titleFontSize: this.options.tooltipTitleFontSize,
						cornerRadius: this.options.tooltipCornerRadius,
						labels: tooltipLabels,
						legendColors: tooltipColors,
						legendColorBackground : this.options.multiTooltipKeyBackground,
						title: template(this.options.tooltipTitleTemplate,ChartElements[0]),
						chart: this.chart,
						ctx: this.chart.ctx,
						custom: this.options.customTooltips
					}).draw();

				} else {
					each(ChartElements, function(Element) {
						var tooltipPosition = Element.tooltipPosition();
						new Chart.Tooltip({
							x: Math.round(tooltipPosition.x),
							y: Math.round(tooltipPosition.y),
							xPadding: this.options.tooltipXPadding,
							yPadding: this.options.tooltipYPadding,
							fillColor: this.options.tooltipFillColor,
							textColor: this.options.tooltipFontColor,
							fontFamily: this.options.tooltipFontFamily,
							fontStyle: this.options.tooltipFontStyle,
							fontSize: this.options.tooltipFontSize,
							caretHeight: this.options.tooltipCaretSize,
							cornerRadius: this.options.tooltipCornerRadius,
							text: template(this.options.tooltipTemplate, Element),
							chart: this.chart,
							custom: this.options.customTooltips
						}).draw();
					}, this);
				}
			}
			return this;
		},
		toBase64Image : function(){
			return this.chart.canvas.toDataURL.apply(this.chart.canvas, arguments);
		}
	});

	Chart.Type.extend = function(extensions){

		var parent = this;

		var ChartType = function(){
			return parent.apply(this,arguments);
		};

		//Copy the prototype object of the this class
		ChartType.prototype = clone(parent.prototype);
		//Now overwrite some of the properties in the base class with the new extensions
		extend(ChartType.prototype, extensions);

		ChartType.extend = Chart.Type.extend;

		if (extensions.name || parent.prototype.name){

			var chartName = extensions.name || parent.prototype.name;
			//Assign any potential default values of the new chart type

			//If none are defined, we'll use a clone of the chart type this is being extended from.
			//I.e. if we extend a line chart, we'll use the defaults from the line chart if our new chart
			//doesn't define some defaults of their own.

			var baseDefaults = (Chart.defaults[parent.prototype.name]) ? clone(Chart.defaults[parent.prototype.name]) : {};

			Chart.defaults[chartName] = extend(baseDefaults,extensions.defaults);

			Chart.types[chartName] = ChartType;

			//Register this new chart type in the Chart prototype
			Chart.prototype[chartName] = function(data,options){
				var config = merge(Chart.defaults.global, Chart.defaults[chartName], options || {});
				return new ChartType(data,config,this);
			};
		} else{
			warn("Name not provided for this chart, so it hasn't been registered");
		}
		return parent;
	};

	Chart.Element = function(configuration){
		extend(this,configuration);
		this.initialize.apply(this,arguments);
		this.save();
	};
	extend(Chart.Element.prototype,{
		initialize : function(){},
		restore : function(props){
			if (!props){
				extend(this,this._saved);
			} else {
				each(props,function(key){
					this[key] = this._saved[key];
				},this);
			}
			return this;
		},
		save : function(){
			this._saved = clone(this);
			delete this._saved._saved;
			return this;
		},
		update : function(newProps){
			each(newProps,function(value,key){
				this._saved[key] = this[key];
				this[key] = value;
			},this);
			return this;
		},
		transition : function(props,ease){
			each(props,function(value,key){
				this[key] = ((value - this._saved[key]) * ease) + this._saved[key];
			},this);
			return this;
		},
		tooltipPosition : function(){
			return {
				x : this.x,
				y : this.y
			};
		},
		hasValue: function(){
			return isNumber(this.value);
		}
	});

	Chart.Element.extend = inherits;


	Chart.Point = Chart.Element.extend({
		display: true,
		inRange: function(chartX,chartY){
			var hitDetectionRange = this.hitDetectionRadius + this.radius;
			return ((Math.pow(chartX-this.x, 2)+Math.pow(chartY-this.y, 2)) < Math.pow(hitDetectionRange,2));
		},
		draw : function(){
			if (this.display){
				var ctx = this.ctx;
				ctx.beginPath();

				ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
				ctx.closePath();

				ctx.strokeStyle = this.strokeColor;
				ctx.lineWidth = this.strokeWidth;

				ctx.fillStyle = this.fillColor;

				ctx.fill();
				ctx.stroke();
			}


			//Quick debug for bezier curve splining
			//Highlights control points and the line between them.
			//Handy for dev - stripped in the min version.

			// ctx.save();
			// ctx.fillStyle = "black";
			// ctx.strokeStyle = "black"
			// ctx.beginPath();
			// ctx.arc(this.controlPoints.inner.x,this.controlPoints.inner.y, 2, 0, Math.PI*2);
			// ctx.fill();

			// ctx.beginPath();
			// ctx.arc(this.controlPoints.outer.x,this.controlPoints.outer.y, 2, 0, Math.PI*2);
			// ctx.fill();

			// ctx.moveTo(this.controlPoints.inner.x,this.controlPoints.inner.y);
			// ctx.lineTo(this.x, this.y);
			// ctx.lineTo(this.controlPoints.outer.x,this.controlPoints.outer.y);
			// ctx.stroke();

			// ctx.restore();



		}
	});

	Chart.Arc = Chart.Element.extend({
		inRange : function(chartX,chartY){

			var pointRelativePosition = helpers.getAngleFromPoint(this, {
				x: chartX,
				y: chartY
			});

			// Normalize all angles to 0 - 2*PI (0 - 360°)
			var pointRelativeAngle = pointRelativePosition.angle % (Math.PI * 2),
			    startAngle = (Math.PI * 2 + this.startAngle) % (Math.PI * 2),
			    endAngle = (Math.PI * 2 + this.endAngle) % (Math.PI * 2) || 360;

			// Calculate wether the pointRelativeAngle is between the start and the end angle
			var betweenAngles = (endAngle < startAngle) ?
				pointRelativeAngle <= endAngle || pointRelativeAngle >= startAngle:
				pointRelativeAngle >= startAngle && pointRelativeAngle <= endAngle;

			//Check if within the range of the open/close angle
			var withinRadius = (pointRelativePosition.distance >= this.innerRadius && pointRelativePosition.distance <= this.outerRadius);

			return (betweenAngles && withinRadius);
			//Ensure within the outside of the arc centre, but inside arc outer
		},
		tooltipPosition : function(){
			var centreAngle = this.startAngle + ((this.endAngle - this.startAngle) / 2),
				rangeFromCentre = (this.outerRadius - this.innerRadius) / 2 + this.innerRadius;
			return {
				x : this.x + (Math.cos(centreAngle) * rangeFromCentre),
				y : this.y + (Math.sin(centreAngle) * rangeFromCentre)
			};
		},
		draw : function(animationPercent){

			var easingDecimal = animationPercent || 1;

			var ctx = this.ctx;

			ctx.beginPath();

			ctx.arc(this.x, this.y, this.outerRadius < 0 ? 0 : this.outerRadius, this.startAngle, this.endAngle);

            ctx.arc(this.x, this.y, this.innerRadius < 0 ? 0 : this.innerRadius, this.endAngle, this.startAngle, true);

			ctx.closePath();
			ctx.strokeStyle = this.strokeColor;
			ctx.lineWidth = this.strokeWidth;

			ctx.fillStyle = this.fillColor;

			ctx.fill();
			ctx.lineJoin = 'bevel';

			if (this.showStroke){
				ctx.stroke();
			}
		}
	});

	Chart.Rectangle = Chart.Element.extend({
		draw : function(){
			var ctx = this.ctx,
				halfWidth = this.width/2,
				leftX = this.x - halfWidth,
				rightX = this.x + halfWidth,
				top = this.base - (this.base - this.y),
				halfStroke = this.strokeWidth / 2;

			// Canvas doesn't allow us to stroke inside the width so we can
			// adjust the sizes to fit if we're setting a stroke on the line
			if (this.showStroke){
				leftX += halfStroke;
				rightX -= halfStroke;
				top += halfStroke;
			}

			ctx.beginPath();

			ctx.fillStyle = this.fillColor;
			ctx.strokeStyle = this.strokeColor;
			ctx.lineWidth = this.strokeWidth;

			// It'd be nice to keep this class totally generic to any rectangle
			// and simply specify which border to miss out.
			ctx.moveTo(leftX, this.base);
			ctx.lineTo(leftX, top);
			ctx.lineTo(rightX, top);
			ctx.lineTo(rightX, this.base);
			ctx.fill();
			if (this.showStroke){
				ctx.stroke();
			}
		},
		height : function(){
			return this.base - this.y;
		},
		inRange : function(chartX,chartY){
			return (chartX >= this.x - this.width/2 && chartX <= this.x + this.width/2) && (chartY >= this.y && chartY <= this.base);
		}
	});

	Chart.Animation = Chart.Element.extend({
		currentStep: null, // the current animation step
		numSteps: 60, // default number of steps
		easing: "", // the easing to use for this animation
		render: null, // render function used by the animation service
		
		onAnimationProgress: null, // user specified callback to fire on each step of the animation 
		onAnimationComplete: null, // user specified callback to fire when the animation finishes
	});
	
	Chart.Tooltip = Chart.Element.extend({
		draw : function(){

			var ctx = this.chart.ctx;

			ctx.font = fontString(this.fontSize,this.fontStyle,this.fontFamily);

			this.xAlign = "center";
			this.yAlign = "above";

			//Distance between the actual element.y position and the start of the tooltip caret
			var caretPadding = this.caretPadding = 2;

			var tooltipWidth = ctx.measureText(this.text).width + 2*this.xPadding,
				tooltipRectHeight = this.fontSize + 2*this.yPadding,
				tooltipHeight = tooltipRectHeight + this.caretHeight + caretPadding;

			if (this.x + tooltipWidth/2 >this.chart.width){
				this.xAlign = "left";
			} else if (this.x - tooltipWidth/2 < 0){
				this.xAlign = "right";
			}

			if (this.y - tooltipHeight < 0){
				this.yAlign = "below";
			}


			var tooltipX = this.x - tooltipWidth/2,
				tooltipY = this.y - tooltipHeight;

			ctx.fillStyle = this.fillColor;

			// Custom Tooltips
			if(this.custom){
				this.custom(this);
			}
			else{
				switch(this.yAlign)
				{
				case "above":
					//Draw a caret above the x/y
					ctx.beginPath();
					ctx.moveTo(this.x,this.y - caretPadding);
					ctx.lineTo(this.x + this.caretHeight, this.y - (caretPadding + this.caretHeight));
					ctx.lineTo(this.x - this.caretHeight, this.y - (caretPadding + this.caretHeight));
					ctx.closePath();
					ctx.fill();
					break;
				case "below":
					tooltipY = this.y + caretPadding + this.caretHeight;
					//Draw a caret below the x/y
					ctx.beginPath();
					ctx.moveTo(this.x, this.y + caretPadding);
					ctx.lineTo(this.x + this.caretHeight, this.y + caretPadding + this.caretHeight);
					ctx.lineTo(this.x - this.caretHeight, this.y + caretPadding + this.caretHeight);
					ctx.closePath();
					ctx.fill();
					break;
				}

				switch(this.xAlign)
				{
				case "left":
					tooltipX = this.x - tooltipWidth + (this.cornerRadius + this.caretHeight);
					break;
				case "right":
					tooltipX = this.x - (this.cornerRadius + this.caretHeight);
					break;
				}

				drawRoundedRectangle(ctx,tooltipX,tooltipY,tooltipWidth,tooltipRectHeight,this.cornerRadius);

				ctx.fill();

				ctx.fillStyle = this.textColor;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(this.text, tooltipX + tooltipWidth/2, tooltipY + tooltipRectHeight/2);
			}
		}
	});

	Chart.MultiTooltip = Chart.Element.extend({
		initialize : function(){
			this.font = fontString(this.fontSize,this.fontStyle,this.fontFamily);

			this.titleFont = fontString(this.titleFontSize,this.titleFontStyle,this.titleFontFamily);

			this.titleHeight = this.title ? this.titleFontSize * 1.5 : 0;
			this.height = (this.labels.length * this.fontSize) + ((this.labels.length-1) * (this.fontSize/2)) + (this.yPadding*2) + this.titleHeight;

			this.ctx.font = this.titleFont;

			var titleWidth = this.ctx.measureText(this.title).width,
				//Label has a legend square as well so account for this.
				labelWidth = longestText(this.ctx,this.font,this.labels) + this.fontSize + 3,
				longestTextWidth = max([labelWidth,titleWidth]);

			this.width = longestTextWidth + (this.xPadding*2);


			var halfHeight = this.height/2;

			//Check to ensure the height will fit on the canvas
			if (this.y - halfHeight < 0 ){
				this.y = halfHeight;
			} else if (this.y + halfHeight > this.chart.height){
				this.y = this.chart.height - halfHeight;
			}

			//Decide whether to align left or right based on position on canvas
			if (this.x > this.chart.width/2){
				this.x -= this.xOffset + this.width;
			} else {
				this.x += this.xOffset;
			}


		},
		getLineHeight : function(index){
			var baseLineHeight = this.y - (this.height/2) + this.yPadding,
				afterTitleIndex = index-1;

			//If the index is zero, we're getting the title
			if (index === 0){
				return baseLineHeight + this.titleHeight / 3;
			} else{
				return baseLineHeight + ((this.fontSize * 1.5 * afterTitleIndex) + this.fontSize / 2) + this.titleHeight;
			}

		},
		draw : function(){
			// Custom Tooltips
			if(this.custom){
				this.custom(this);
			}
			else{
				drawRoundedRectangle(this.ctx,this.x,this.y - this.height/2,this.width,this.height,this.cornerRadius);
				var ctx = this.ctx;
				ctx.fillStyle = this.fillColor;
				ctx.fill();
				ctx.closePath();

				ctx.textAlign = "left";
				ctx.textBaseline = "middle";
				ctx.fillStyle = this.titleTextColor;
				ctx.font = this.titleFont;

				ctx.fillText(this.title,this.x + this.xPadding, this.getLineHeight(0));

				ctx.font = this.font;
				helpers.each(this.labels,function(label,index){
					ctx.fillStyle = this.textColor;
					ctx.fillText(label,this.x + this.xPadding + this.fontSize + 3, this.getLineHeight(index + 1));

					//A bit gnarly, but clearing this rectangle breaks when using explorercanvas (clears whole canvas)
					//ctx.clearRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize/2, this.fontSize, this.fontSize);
					//Instead we'll make a white filled block to put the legendColour palette over.

					ctx.fillStyle = this.legendColorBackground;
					ctx.fillRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize/2, this.fontSize, this.fontSize);

					ctx.fillStyle = this.legendColors[index].fill;
					ctx.fillRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize/2, this.fontSize, this.fontSize);


				},this);
			}
		}
	});

	Chart.Scale = Chart.Element.extend({
		initialize : function(){
			this.fit();
		},
		buildYLabels : function(){
			this.yLabels = [];

			var stepDecimalPlaces = getDecimalPlaces(this.stepValue);

			for (var i=0; i<=this.steps; i++){
				this.yLabels.push(template(this.templateString,{value:(this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces)}));
			}
			this.yLabelWidth = (this.display && this.showLabels) ? longestText(this.ctx,this.font,this.yLabels) + 10 : 0;
		},
		addXLabel : function(label){
			this.xLabels.push(label);
			this.valuesCount++;
			this.fit();
		},
		removeXLabel : function(){
			this.xLabels.shift();
			this.valuesCount--;
			this.fit();
		},
		// Fitting loop to rotate x Labels and figure out what fits there, and also calculate how many Y steps to use
		fit: function(){
			// First we need the width of the yLabels, assuming the xLabels aren't rotated

			// To do that we need the base line at the top and base of the chart, assuming there is no x label rotation
			this.startPoint = (this.display) ? this.fontSize : 0;
			this.endPoint = (this.display) ? this.height - (this.fontSize * 1.5) - 5 : this.height; // -5 to pad labels

			// Apply padding settings to the start and end point.
			this.startPoint += this.padding;
			this.endPoint -= this.padding;

			// Cache the starting endpoint, excluding the space for x labels
			var cachedEndPoint = this.endPoint;

			// Cache the starting height, so can determine if we need to recalculate the scale yAxis
			var cachedHeight = this.endPoint - this.startPoint,
				cachedYLabelWidth;

			// Build the current yLabels so we have an idea of what size they'll be to start
			/*
			 *	This sets what is returned from calculateScaleRange as static properties of this class:
			 *
				this.steps;
				this.stepValue;
				this.min;
				this.max;
			 *
			 */
			this.calculateYRange(cachedHeight);

			// With these properties set we can now build the array of yLabels
			// and also the width of the largest yLabel
			this.buildYLabels();

			this.calculateXLabelRotation();

			while((cachedHeight > this.endPoint - this.startPoint)){
				cachedHeight = this.endPoint - this.startPoint;
				cachedYLabelWidth = this.yLabelWidth;

				this.calculateYRange(cachedHeight);
				this.buildYLabels();

				// Only go through the xLabel loop again if the yLabel width has changed
				if (cachedYLabelWidth < this.yLabelWidth){
					this.endPoint = cachedEndPoint;
					this.calculateXLabelRotation();
				}
			}

		},
		calculateXLabelRotation : function(){
			//Get the width of each grid by calculating the difference
			//between x offsets between 0 and 1.

			this.ctx.font = this.font;

			var firstWidth = this.ctx.measureText(this.xLabels[0]).width,
				lastWidth = this.ctx.measureText(this.xLabels[this.xLabels.length - 1]).width,
				firstRotated,
				lastRotated;


			this.xScalePaddingRight = lastWidth/2 + 3;
			this.xScalePaddingLeft = (firstWidth/2 > this.yLabelWidth) ? firstWidth/2 : this.yLabelWidth;

			this.xLabelRotation = 0;
			if (this.display){
				var originalLabelWidth = longestText(this.ctx,this.font,this.xLabels),
					cosRotation,
					firstRotatedWidth;
				this.xLabelWidth = originalLabelWidth;
				//Allow 3 pixels x2 padding either side for label readability
				var xGridWidth = Math.floor(this.calculateX(1) - this.calculateX(0)) - 6;

				//Max label rotate should be 90 - also act as a loop counter
				while ((this.xLabelWidth > xGridWidth && this.xLabelRotation === 0) || (this.xLabelWidth > xGridWidth && this.xLabelRotation <= 90 && this.xLabelRotation > 0)){
					cosRotation = Math.cos(toRadians(this.xLabelRotation));

					firstRotated = cosRotation * firstWidth;
					lastRotated = cosRotation * lastWidth;

					// We're right aligning the text now.
					if (firstRotated + this.fontSize / 2 > this.yLabelWidth){
						this.xScalePaddingLeft = firstRotated + this.fontSize / 2;
					}
					this.xScalePaddingRight = this.fontSize/2;


					this.xLabelRotation++;
					this.xLabelWidth = cosRotation * originalLabelWidth;

				}
				if (this.xLabelRotation > 0){
					this.endPoint -= Math.sin(toRadians(this.xLabelRotation))*originalLabelWidth + 3;
				}
			}
			else{
				this.xLabelWidth = 0;
				this.xScalePaddingRight = this.padding;
				this.xScalePaddingLeft = this.padding;
			}

		},
		// Needs to be overidden in each Chart type
		// Otherwise we need to pass all the data into the scale class
		calculateYRange: noop,
		drawingArea: function(){
			return this.startPoint - this.endPoint;
		},
		calculateY : function(value){
			var scalingFactor = this.drawingArea() / (this.min - this.max);
			return this.endPoint - (scalingFactor * (value - this.min));
		},
		calculateX : function(index){
			var isRotated = (this.xLabelRotation > 0),
				// innerWidth = (this.offsetGridLines) ? this.width - offsetLeft - this.padding : this.width - (offsetLeft + halfLabelWidth * 2) - this.padding,
				innerWidth = this.width - (this.xScalePaddingLeft + this.xScalePaddingRight),
				valueWidth = innerWidth/Math.max((this.valuesCount - ((this.offsetGridLines) ? 0 : 1)), 1),
				valueOffset = (valueWidth * index) + this.xScalePaddingLeft;

			if (this.offsetGridLines){
				valueOffset += (valueWidth/2);
			}

			return Math.round(valueOffset);
		},
		update : function(newProps){
			helpers.extend(this, newProps);
			this.fit();
		},
		draw : function(){
			var ctx = this.ctx,
				yLabelGap = (this.endPoint - this.startPoint) / this.steps,
				xStart = Math.round(this.xScalePaddingLeft);
			if (this.display){
				ctx.fillStyle = this.textColor;
				ctx.font = this.font;
				each(this.yLabels,function(labelString,index){
					var yLabelCenter = this.endPoint - (yLabelGap * index),
						linePositionY = Math.round(yLabelCenter),
						drawHorizontalLine = this.showHorizontalLines;

					ctx.textAlign = "right";
					ctx.textBaseline = "middle";
					if (this.showLabels){
						ctx.fillText(labelString,xStart - 10,yLabelCenter);
					}

					// This is X axis, so draw it
					if (index === 0 && !drawHorizontalLine){
						drawHorizontalLine = true;
					}

					if (drawHorizontalLine){
						ctx.beginPath();
					}

					if (index > 0){
						// This is a grid line in the centre, so drop that
						ctx.lineWidth = this.gridLineWidth;
						ctx.strokeStyle = this.gridLineColor;
					} else {
						// This is the first line on the scale
						ctx.lineWidth = this.lineWidth;
						ctx.strokeStyle = this.lineColor;
					}

					linePositionY += helpers.aliasPixel(ctx.lineWidth);

					if(drawHorizontalLine){
						ctx.moveTo(xStart, linePositionY);
						ctx.lineTo(this.width, linePositionY);
						ctx.stroke();
						ctx.closePath();
					}

					ctx.lineWidth = this.lineWidth;
					ctx.strokeStyle = this.lineColor;
					ctx.beginPath();
					ctx.moveTo(xStart - 5, linePositionY);
					ctx.lineTo(xStart, linePositionY);
					ctx.stroke();
					ctx.closePath();

				},this);

				each(this.xLabels,function(label,index){
					var xPos = this.calculateX(index) + aliasPixel(this.lineWidth),
						// Check to see if line/bar here and decide where to place the line
						linePos = this.calculateX(index - (this.offsetGridLines ? 0.5 : 0)) + aliasPixel(this.lineWidth),
						isRotated = (this.xLabelRotation > 0),
						drawVerticalLine = this.showVerticalLines;

					// This is Y axis, so draw it
					if (index === 0 && !drawVerticalLine){
						drawVerticalLine = true;
					}

					if (drawVerticalLine){
						ctx.beginPath();
					}

					if (index > 0){
						// This is a grid line in the centre, so drop that
						ctx.lineWidth = this.gridLineWidth;
						ctx.strokeStyle = this.gridLineColor;
					} else {
						// This is the first line on the scale
						ctx.lineWidth = this.lineWidth;
						ctx.strokeStyle = this.lineColor;
					}

					if (drawVerticalLine){
						ctx.moveTo(linePos,this.endPoint);
						ctx.lineTo(linePos,this.startPoint - 3);
						ctx.stroke();
						ctx.closePath();
					}


					ctx.lineWidth = this.lineWidth;
					ctx.strokeStyle = this.lineColor;


					// Small lines at the bottom of the base grid line
					ctx.beginPath();
					ctx.moveTo(linePos,this.endPoint);
					ctx.lineTo(linePos,this.endPoint + 5);
					ctx.stroke();
					ctx.closePath();

					ctx.save();
					ctx.translate(xPos,(isRotated) ? this.endPoint + 12 : this.endPoint + 8);
					ctx.rotate(toRadians(this.xLabelRotation)*-1);
					ctx.font = this.font;
					ctx.textAlign = (isRotated) ? "right" : "center";
					ctx.textBaseline = (isRotated) ? "middle" : "top";
					ctx.fillText(label, 0, 0);
					ctx.restore();
				},this);

			}
		}

	});

	Chart.RadialScale = Chart.Element.extend({
		initialize: function(){
			this.size = min([this.height, this.width]);
			this.drawingArea = (this.display) ? (this.size/2) - (this.fontSize/2 + this.backdropPaddingY) : (this.size/2);
		},
		calculateCenterOffset: function(value){
			// Take into account half font size + the yPadding of the top value
			var scalingFactor = this.drawingArea / (this.max - this.min);

			return (value - this.min) * scalingFactor;
		},
		update : function(){
			if (!this.lineArc){
				this.setScaleSize();
			} else {
				this.drawingArea = (this.display) ? (this.size/2) - (this.fontSize/2 + this.backdropPaddingY) : (this.size/2);
			}
			this.buildYLabels();
		},
		buildYLabels: function(){
			this.yLabels = [];

			var stepDecimalPlaces = getDecimalPlaces(this.stepValue);

			for (var i=0; i<=this.steps; i++){
				this.yLabels.push(template(this.templateString,{value:(this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces)}));
			}
		},
		getCircumference : function(){
			return ((Math.PI*2) / this.valuesCount);
		},
		setScaleSize: function(){
			/*
			 * Right, this is really confusing and there is a lot of maths going on here
			 * The gist of the problem is here: https://gist.github.com/nnnick/696cc9c55f4b0beb8fe9
			 *
			 * Reaction: https://dl.dropboxusercontent.com/u/34601363/toomuchscience.gif
			 *
			 * Solution:
			 *
			 * We assume the radius of the polygon is half the size of the canvas at first
			 * at each index we check if the text overlaps.
			 *
			 * Where it does, we store that angle and that index.
			 *
			 * After finding the largest index and angle we calculate how much we need to remove
			 * from the shape radius to move the point inwards by that x.
			 *
			 * We average the left and right distances to get the maximum shape radius that can fit in the box
			 * along with labels.
			 *
			 * Once we have that, we can find the centre point for the chart, by taking the x text protrusion
			 * on each side, removing that from the size, halving it and adding the left x protrusion width.
			 *
			 * This will mean we have a shape fitted to the canvas, as large as it can be with the labels
			 * and position it in the most space efficient manner
			 *
			 * https://dl.dropboxusercontent.com/u/34601363/yeahscience.gif
			 */


			// Get maximum radius of the polygon. Either half the height (minus the text width) or half the width.
			// Use this to calculate the offset + change. - Make sure L/R protrusion is at least 0 to stop issues with centre points
			var largestPossibleRadius = min([(this.height/2 - this.pointLabelFontSize - 5), this.width/2]),
				pointPosition,
				i,
				textWidth,
				halfTextWidth,
				furthestRight = this.width,
				furthestRightIndex,
				furthestRightAngle,
				furthestLeft = 0,
				furthestLeftIndex,
				furthestLeftAngle,
				xProtrusionLeft,
				xProtrusionRight,
				radiusReductionRight,
				radiusReductionLeft,
				maxWidthRadius;
			this.ctx.font = fontString(this.pointLabelFontSize,this.pointLabelFontStyle,this.pointLabelFontFamily);
			for (i=0;i<this.valuesCount;i++){
				// 5px to space the text slightly out - similar to what we do in the draw function.
				pointPosition = this.getPointPosition(i, largestPossibleRadius);
				textWidth = this.ctx.measureText(template(this.templateString, { value: this.labels[i] })).width + 5;
				if (i === 0 || i === this.valuesCount/2){
					// If we're at index zero, or exactly the middle, we're at exactly the top/bottom
					// of the radar chart, so text will be aligned centrally, so we'll half it and compare
					// w/left and right text sizes
					halfTextWidth = textWidth/2;
					if (pointPosition.x + halfTextWidth > furthestRight) {
						furthestRight = pointPosition.x + halfTextWidth;
						furthestRightIndex = i;
					}
					if (pointPosition.x - halfTextWidth < furthestLeft) {
						furthestLeft = pointPosition.x - halfTextWidth;
						furthestLeftIndex = i;
					}
				}
				else if (i < this.valuesCount/2) {
					// Less than half the values means we'll left align the text
					if (pointPosition.x + textWidth > furthestRight) {
						furthestRight = pointPosition.x + textWidth;
						furthestRightIndex = i;
					}
				}
				else if (i > this.valuesCount/2){
					// More than half the values means we'll right align the text
					if (pointPosition.x - textWidth < furthestLeft) {
						furthestLeft = pointPosition.x - textWidth;
						furthestLeftIndex = i;
					}
				}
			}

			xProtrusionLeft = furthestLeft;

			xProtrusionRight = Math.ceil(furthestRight - this.width);

			furthestRightAngle = this.getIndexAngle(furthestRightIndex);

			furthestLeftAngle = this.getIndexAngle(furthestLeftIndex);

			radiusReductionRight = xProtrusionRight / Math.sin(furthestRightAngle + Math.PI/2);

			radiusReductionLeft = xProtrusionLeft / Math.sin(furthestLeftAngle + Math.PI/2);

			// Ensure we actually need to reduce the size of the chart
			radiusReductionRight = (isNumber(radiusReductionRight)) ? radiusReductionRight : 0;
			radiusReductionLeft = (isNumber(radiusReductionLeft)) ? radiusReductionLeft : 0;

			this.drawingArea = largestPossibleRadius - (radiusReductionLeft + radiusReductionRight)/2;

			//this.drawingArea = min([maxWidthRadius, (this.height - (2 * (this.pointLabelFontSize + 5)))/2])
			this.setCenterPoint(radiusReductionLeft, radiusReductionRight);

		},
		setCenterPoint: function(leftMovement, rightMovement){

			var maxRight = this.width - rightMovement - this.drawingArea,
				maxLeft = leftMovement + this.drawingArea;

			this.xCenter = (maxLeft + maxRight)/2;
			// Always vertically in the centre as the text height doesn't change
			this.yCenter = (this.height/2);
		},

		getIndexAngle : function(index){
			var angleMultiplier = (Math.PI * 2) / this.valuesCount;
			// Start from the top instead of right, so remove a quarter of the circle

			return index * angleMultiplier - (Math.PI/2);
		},
		getPointPosition : function(index, distanceFromCenter){
			var thisAngle = this.getIndexAngle(index);
			return {
				x : (Math.cos(thisAngle) * distanceFromCenter) + this.xCenter,
				y : (Math.sin(thisAngle) * distanceFromCenter) + this.yCenter
			};
		},
		draw: function(){
			if (this.display){
				var ctx = this.ctx;
				each(this.yLabels, function(label, index){
					// Don't draw a centre value
					if (index > 0){
						var yCenterOffset = index * (this.drawingArea/this.steps),
							yHeight = this.yCenter - yCenterOffset,
							pointPosition;

						// Draw circular lines around the scale
						if (this.lineWidth > 0){
							ctx.strokeStyle = this.lineColor;
							ctx.lineWidth = this.lineWidth;

							if(this.lineArc){
								ctx.beginPath();
								ctx.arc(this.xCenter, this.yCenter, yCenterOffset, 0, Math.PI*2);
								ctx.closePath();
								ctx.stroke();
							} else{
								ctx.beginPath();
								for (var i=0;i<this.valuesCount;i++)
								{
									pointPosition = this.getPointPosition(i, this.calculateCenterOffset(this.min + (index * this.stepValue)));
									if (i === 0){
										ctx.moveTo(pointPosition.x, pointPosition.y);
									} else {
										ctx.lineTo(pointPosition.x, pointPosition.y);
									}
								}
								ctx.closePath();
								ctx.stroke();
							}
						}
						if(this.showLabels){
							ctx.font = fontString(this.fontSize,this.fontStyle,this.fontFamily);
							if (this.showLabelBackdrop){
								var labelWidth = ctx.measureText(label).width;
								ctx.fillStyle = this.backdropColor;
								ctx.fillRect(
									this.xCenter - labelWidth/2 - this.backdropPaddingX,
									yHeight - this.fontSize/2 - this.backdropPaddingY,
									labelWidth + this.backdropPaddingX*2,
									this.fontSize + this.backdropPaddingY*2
								);
							}
							ctx.textAlign = 'center';
							ctx.textBaseline = "middle";
							ctx.fillStyle = this.fontColor;
							ctx.fillText(label, this.xCenter, yHeight);
						}
					}
				}, this);

				if (!this.lineArc){
					ctx.lineWidth = this.angleLineWidth;
					ctx.strokeStyle = this.angleLineColor;
					for (var i = this.valuesCount - 1; i >= 0; i--) {
						var centerOffset = null, outerPosition = null;

						if (this.angleLineWidth > 0 && (i % this.angleLineInterval === 0)){
							centerOffset = this.calculateCenterOffset(this.max);
							outerPosition = this.getPointPosition(i, centerOffset);
							ctx.beginPath();
							ctx.moveTo(this.xCenter, this.yCenter);
							ctx.lineTo(outerPosition.x, outerPosition.y);
							ctx.stroke();
							ctx.closePath();
						}

						if (this.backgroundColors && this.backgroundColors.length == this.valuesCount) {
							if (centerOffset == null)
								centerOffset = this.calculateCenterOffset(this.max);

							if (outerPosition == null)
								outerPosition = this.getPointPosition(i, centerOffset);

							var previousOuterPosition = this.getPointPosition(i === 0 ? this.valuesCount - 1 : i - 1, centerOffset);
							var nextOuterPosition = this.getPointPosition(i === this.valuesCount - 1 ? 0 : i + 1, centerOffset);

							var previousOuterHalfway = { x: (previousOuterPosition.x + outerPosition.x) / 2, y: (previousOuterPosition.y + outerPosition.y) / 2 };
							var nextOuterHalfway = { x: (outerPosition.x + nextOuterPosition.x) / 2, y: (outerPosition.y + nextOuterPosition.y) / 2 };

							ctx.beginPath();
							ctx.moveTo(this.xCenter, this.yCenter);
							ctx.lineTo(previousOuterHalfway.x, previousOuterHalfway.y);
							ctx.lineTo(outerPosition.x, outerPosition.y);
							ctx.lineTo(nextOuterHalfway.x, nextOuterHalfway.y);
							ctx.fillStyle = this.backgroundColors[i];
							ctx.fill();
							ctx.closePath();
						}
						// Extra 3px out for some label spacing
						var pointLabelPosition = this.getPointPosition(i, this.calculateCenterOffset(this.max) + 5);
						ctx.font = fontString(this.pointLabelFontSize,this.pointLabelFontStyle,this.pointLabelFontFamily);
						ctx.fillStyle = this.pointLabelFontColor;

						var labelsCount = this.labels.length,
							halfLabelsCount = this.labels.length/2,
							quarterLabelsCount = halfLabelsCount/2,
							upperHalf = (i < quarterLabelsCount || i > labelsCount - quarterLabelsCount),
							exactQuarter = (i === quarterLabelsCount || i === labelsCount - quarterLabelsCount);
						if (i === 0){
							ctx.textAlign = 'center';
						} else if(i === halfLabelsCount){
							ctx.textAlign = 'center';
						} else if (i < halfLabelsCount){
							ctx.textAlign = 'left';
						} else {
							ctx.textAlign = 'right';
						}

						// Set the correct text baseline based on outer positioning
						if (exactQuarter){
							ctx.textBaseline = 'middle';
						} else if (upperHalf){
							ctx.textBaseline = 'bottom';
						} else {
							ctx.textBaseline = 'top';
						}

						ctx.fillText(this.labels[i], pointLabelPosition.x, pointLabelPosition.y);
					}
				}
			}
		}
	});

	Chart.animationService = {
		frameDuration: 17,
		animations: [],
		dropFrames: 0,
		addAnimation: function(chartInstance, animationObject) {
			for (var index = 0; index < this.animations.length; ++ index){
				if (this.animations[index].chartInstance === chartInstance){
					// replacing an in progress animation
					this.animations[index].animationObject = animationObject;
					return;
				}
			}
			
			this.animations.push({
				chartInstance: chartInstance,
				animationObject: animationObject
			});

			// If there are no animations queued, manually kickstart a digest, for lack of a better word
			if (this.animations.length == 1) {
				helpers.requestAnimFrame.call(window, this.digestWrapper);
			}
		},
		// Cancel the animation for a given chart instance
		cancelAnimation: function(chartInstance) {
			var index = helpers.findNextWhere(this.animations, function(animationWrapper) {
				return animationWrapper.chartInstance === chartInstance;
			});
			
			if (index)
			{
				this.animations.splice(index, 1);
			}
		},
		// calls startDigest with the proper context
		digestWrapper: function() {
			Chart.animationService.startDigest.call(Chart.animationService);
		},
		startDigest: function() {

			var startTime = Date.now();
			var framesToDrop = 0;

			if(this.dropFrames > 1){
				framesToDrop = Math.floor(this.dropFrames);
				this.dropFrames -= framesToDrop;
			}

			for (var i = 0; i < this.animations.length; i++) {

				if (this.animations[i].animationObject.currentStep === null){
					this.animations[i].animationObject.currentStep = 0;
				}

				this.animations[i].animationObject.currentStep += 1 + framesToDrop;
				if(this.animations[i].animationObject.currentStep > this.animations[i].animationObject.numSteps){
					this.animations[i].animationObject.currentStep = this.animations[i].animationObject.numSteps;
				}
				
				this.animations[i].animationObject.render(this.animations[i].chartInstance, this.animations[i].animationObject);
				
				// Check if executed the last frame.
				if (this.animations[i].animationObject.currentStep == this.animations[i].animationObject.numSteps){
					// Call onAnimationComplete
					this.animations[i].animationObject.onAnimationComplete.call(this.animations[i].chartInstance);
					// Remove the animation.
					this.animations.splice(i, 1);
					// Keep the index in place to offset the splice
					i--;
				}
			}

			var endTime = Date.now();
			var delay = endTime - startTime - this.frameDuration;
			var frameDelay = delay / this.frameDuration;

			if(frameDelay > 1){
				this.dropFrames += frameDelay;
			}

			// Do we have more stuff to animate?
			if (this.animations.length > 0){
				helpers.requestAnimFrame.call(window, this.digestWrapper);
			}
		}
	};

	// Attach global event to resize each chart instance when the browser resizes
	helpers.addEvent(window, "resize", (function(){
		// Basic debounce of resize function so it doesn't hurt performance when resizing browser.
		var timeout;
		return function(){
			clearTimeout(timeout);
			timeout = setTimeout(function(){
				each(Chart.instances,function(instance){
					// If the responsive flag is set in the chart instance config
					// Cascade the resize event down to the chart.
					if (instance.options.responsive){
						instance.resize(instance.render, true);
					}
				});
			}, 50);
		};
	})());


	if (amd) {
		define('Chart', [], function(){
			return Chart;
		});
	} else if (typeof module === 'object' && module.exports) {
		module.exports = Chart;
	}

	root.Chart = Chart;

	Chart.noConflict = function(){
		root.Chart = previous;
		return Chart;
	};

}).call(this);

(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		helpers = Chart.helpers;


	var defaultConfig = {
		//Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
		scaleBeginAtZero : true,

		//Boolean - Whether grid lines are shown across the chart
		scaleShowGridLines : true,

		//String - Colour of the grid lines
		scaleGridLineColor : "rgba(0,0,0,.05)",

		//Number - Width of the grid lines
		scaleGridLineWidth : 1,

		//Boolean - Whether to show horizontal lines (except X axis)
		scaleShowHorizontalLines: true,

		//Boolean - Whether to show vertical lines (except Y axis)
		scaleShowVerticalLines: true,

		//Boolean - If there is a stroke on each bar
		barShowStroke : true,

		//Number - Pixel width of the bar stroke
		barStrokeWidth : 2,

		//Number - Spacing between each of the X value sets
		barValueSpacing : 5,

		//Number - Spacing between data sets within X values
		barDatasetSpacing : 1,

		//String - A legend template
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span class=\"<%=name.toLowerCase()%>-legend-icon\" style=\"background-color:<%=datasets[i].fillColor%>\"></span><span class=\"<%=name.toLowerCase()%>-legend-text\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>"

	};


	Chart.Type.extend({
		name: "Bar",
		defaults : defaultConfig,
		initialize:  function(data){

			//Expose options as a scope variable here so we can access it in the ScaleClass
			var options = this.options;

			this.ScaleClass = Chart.Scale.extend({
				offsetGridLines : true,
				calculateBarX : function(datasetCount, datasetIndex, barIndex){
					//Reusable method for calculating the xPosition of a given bar based on datasetIndex & width of the bar
					var xWidth = this.calculateBaseWidth(),
						xAbsolute = this.calculateX(barIndex) - (xWidth/2),
						barWidth = this.calculateBarWidth(datasetCount);

					return xAbsolute + (barWidth * datasetIndex) + (datasetIndex * options.barDatasetSpacing) + barWidth/2;
				},
				calculateBaseWidth : function(){
					return (this.calculateX(1) - this.calculateX(0)) - (2*options.barValueSpacing);
				},
				calculateBarWidth : function(datasetCount){
					//The padding between datasets is to the right of each bar, providing that there are more than 1 dataset
					var baseWidth = this.calculateBaseWidth() - ((datasetCount - 1) * options.barDatasetSpacing);

					return (baseWidth / datasetCount);
				}
			});

			this.datasets = [];

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activeBars = (evt.type !== 'mouseout') ? this.getBarsAtEvent(evt) : [];

					this.eachBars(function(bar){
						bar.restore(['fillColor', 'strokeColor']);
					});
					helpers.each(activeBars, function(activeBar){
						if (activeBar) {
							activeBar.fillColor = activeBar.highlightFill;
							activeBar.strokeColor = activeBar.highlightStroke;
						}
					});
					this.showTooltip(activeBars);
				});
			}

			//Declare the extension of the default point, to cater for the options passed in to the constructor
			this.BarClass = Chart.Rectangle.extend({
				strokeWidth : this.options.barStrokeWidth,
				showStroke : this.options.barShowStroke,
				ctx : this.chart.ctx
			});

			//Iterate through each of the datasets, and build this into a property of the chart
			helpers.each(data.datasets,function(dataset,datasetIndex){

				var datasetObject = {
					label : dataset.label || null,
					fillColor : dataset.fillColor,
					strokeColor : dataset.strokeColor,
					bars : []
				};

				this.datasets.push(datasetObject);

				helpers.each(dataset.data,function(dataPoint,index){
					//Add a new point for each piece of data, passing any required data to draw.
					datasetObject.bars.push(new this.BarClass({
						value : dataPoint,
						label : data.labels[index],
						datasetLabel: dataset.label,
						strokeColor : (typeof dataset.strokeColor == 'object') ? dataset.strokeColor[index] : dataset.strokeColor,
						fillColor : (typeof dataset.fillColor == 'object') ? dataset.fillColor[index] : dataset.fillColor,
						highlightFill : (dataset.highlightFill) ? (typeof dataset.highlightFill == 'object') ? dataset.highlightFill[index] : dataset.highlightFill : (typeof dataset.fillColor == 'object') ? dataset.fillColor[index] : dataset.fillColor,
						highlightStroke : (dataset.highlightStroke) ? (typeof dataset.highlightStroke == 'object') ? dataset.highlightStroke[index] : dataset.highlightStroke : (typeof dataset.strokeColor == 'object') ? dataset.strokeColor[index] : dataset.strokeColor
					}));
				},this);

			},this);

			this.buildScale(data.labels);

			this.BarClass.prototype.base = this.scale.endPoint;

			this.eachBars(function(bar, index, datasetIndex){
				helpers.extend(bar, {
					width : this.scale.calculateBarWidth(this.datasets.length),
					x: this.scale.calculateBarX(this.datasets.length, datasetIndex, index),
					y: this.scale.endPoint
				});
				bar.save();
			}, this);

			this.render();
		},
		update : function(){
			this.scale.update();
			// Reset any highlight colours before updating.
			helpers.each(this.activeElements, function(activeElement){
				activeElement.restore(['fillColor', 'strokeColor']);
			});

			this.eachBars(function(bar){
				bar.save();
			});
			this.render();
		},
		eachBars : function(callback){
			helpers.each(this.datasets,function(dataset, datasetIndex){
				helpers.each(dataset.bars, callback, this, datasetIndex);
			},this);
		},
		getBarsAtEvent : function(e){
			var barsArray = [],
				eventPosition = helpers.getRelativePosition(e),
				datasetIterator = function(dataset){
					barsArray.push(dataset.bars[barIndex]);
				},
				barIndex;

			for (var datasetIndex = 0; datasetIndex < this.datasets.length; datasetIndex++) {
				for (barIndex = 0; barIndex < this.datasets[datasetIndex].bars.length; barIndex++) {
					if (this.datasets[datasetIndex].bars[barIndex].inRange(eventPosition.x,eventPosition.y)){
						helpers.each(this.datasets, datasetIterator);
						return barsArray;
					}
				}
			}

			return barsArray;
		},
		buildScale : function(labels){
			var self = this;

			var dataTotal = function(){
				var values = [];
				self.eachBars(function(bar){
					values.push(bar.value);
				});
				return values;
			};

			var scaleOptions = {
				templateString : this.options.scaleLabel,
				height : this.chart.height,
				width : this.chart.width,
				ctx : this.chart.ctx,
				textColor : this.options.scaleFontColor,
				fontSize : this.options.scaleFontSize,
				fontStyle : this.options.scaleFontStyle,
				fontFamily : this.options.scaleFontFamily,
				valuesCount : labels.length,
				beginAtZero : this.options.scaleBeginAtZero,
				integersOnly : this.options.scaleIntegersOnly,
				calculateYRange: function(currentHeight){
					var updatedRanges = helpers.calculateScaleRange(
						dataTotal(),
						currentHeight,
						this.fontSize,
						this.beginAtZero,
						this.integersOnly
					);
					helpers.extend(this, updatedRanges);
				},
				xLabels : labels,
				font : helpers.fontString(this.options.scaleFontSize, this.options.scaleFontStyle, this.options.scaleFontFamily),
				lineWidth : this.options.scaleLineWidth,
				lineColor : this.options.scaleLineColor,
				showHorizontalLines : this.options.scaleShowHorizontalLines,
				showVerticalLines : this.options.scaleShowVerticalLines,
				gridLineWidth : (this.options.scaleShowGridLines) ? this.options.scaleGridLineWidth : 0,
				gridLineColor : (this.options.scaleShowGridLines) ? this.options.scaleGridLineColor : "rgba(0,0,0,0)",
				padding : (this.options.showScale) ? 0 : (this.options.barShowStroke) ? this.options.barStrokeWidth : 0,
				showLabels : this.options.scaleShowLabels,
				display : this.options.showScale
			};

			if (this.options.scaleOverride){
				helpers.extend(scaleOptions, {
					calculateYRange: helpers.noop,
					steps: this.options.scaleSteps,
					stepValue: this.options.scaleStepWidth,
					min: this.options.scaleStartValue,
					max: this.options.scaleStartValue + (this.options.scaleSteps * this.options.scaleStepWidth)
				});
			}

			this.scale = new this.ScaleClass(scaleOptions);
		},
		addData : function(valuesArray,label){
			//Map the values array for each of the datasets
			helpers.each(valuesArray,function(value,datasetIndex){
				//Add a new point for each piece of data, passing any required data to draw.
				this.datasets[datasetIndex].bars.push(new this.BarClass({
					value : value,
					label : label,
					datasetLabel: this.datasets[datasetIndex].label,
					x: this.scale.calculateBarX(this.datasets.length, datasetIndex, this.scale.valuesCount+1),
					y: this.scale.endPoint,
					width : this.scale.calculateBarWidth(this.datasets.length),
					base : this.scale.endPoint,
					strokeColor : this.datasets[datasetIndex].strokeColor,
					fillColor : this.datasets[datasetIndex].fillColor
				}));
			},this);

			this.scale.addXLabel(label);
			//Then re-render the chart.
			this.update();
		},
		removeData : function(){
			this.scale.removeXLabel();
			//Then re-render the chart.
			helpers.each(this.datasets,function(dataset){
				dataset.bars.shift();
			},this);
			this.update();
		},
		reflow : function(){
			helpers.extend(this.BarClass.prototype,{
				y: this.scale.endPoint,
				base : this.scale.endPoint
			});
			var newScaleProps = helpers.extend({
				height : this.chart.height,
				width : this.chart.width
			});
			this.scale.update(newScaleProps);
		},
		draw : function(ease){
			var easingDecimal = ease || 1;
			this.clear();

			var ctx = this.chart.ctx;

			this.scale.draw(easingDecimal);

			//Draw all the bars for each dataset
			helpers.each(this.datasets,function(dataset,datasetIndex){
				helpers.each(dataset.bars,function(bar,index){
					if (bar.hasValue()){
						bar.base = this.scale.endPoint;
						//Transition then draw
						bar.transition({
							x : this.scale.calculateBarX(this.datasets.length, datasetIndex, index),
							y : this.scale.calculateY(bar.value),
							width : this.scale.calculateBarWidth(this.datasets.length)
						}, easingDecimal).draw();
					}
				},this);

			},this);
		}
	});


}).call(this);

(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		//Cache a local reference to Chart.helpers
		helpers = Chart.helpers;

	var defaultConfig = {
		//Boolean - Whether we should show a stroke on each segment
		segmentShowStroke : true,

		//String - The colour of each segment stroke
		segmentStrokeColor : "#fff",

		//Number - The width of each segment stroke
		segmentStrokeWidth : 2,

		//The percentage of the chart that we cut out of the middle.
		percentageInnerCutout : 50,

		//Number - Amount of animation steps
		animationSteps : 100,

		//String - Animation easing effect
		animationEasing : "easeOutBounce",

		//Boolean - Whether we animate the rotation of the Doughnut
		animateRotate : true,

		//Boolean - Whether we animate scaling the Doughnut from the centre
		animateScale : false,

		//String - A legend template
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span class=\"<%=name.toLowerCase()%>-legend-icon\" style=\"background-color:<%=segments[i].fillColor%>\"></span><span class=\"<%=name.toLowerCase()%>-legend-text\"><%if(segments[i].label){%><%=segments[i].label%><%}%></span></li><%}%></ul>"

	};

	Chart.Type.extend({
		//Passing in a name registers this chart in the Chart namespace
		name: "Doughnut",
		//Providing a defaults will also register the defaults in the chart namespace
		defaults : defaultConfig,
		//Initialize is fired when the chart is initialized - Data is passed in as a parameter
		//Config is automatically merged by the core of Chart.js, and is available at this.options
		initialize:  function(data){

			//Declare segments as a static property to prevent inheriting across the Chart type prototype
			this.segments = [];
			this.outerRadius = (helpers.min([this.chart.width,this.chart.height]) -	this.options.segmentStrokeWidth/2)/2;

			this.SegmentArc = Chart.Arc.extend({
				ctx : this.chart.ctx,
				x : this.chart.width/2,
				y : this.chart.height/2
			});

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activeSegments = (evt.type !== 'mouseout') ? this.getSegmentsAtEvent(evt) : [];

					helpers.each(this.segments,function(segment){
						segment.restore(["fillColor"]);
					});
					helpers.each(activeSegments,function(activeSegment){
						activeSegment.fillColor = activeSegment.highlightColor;
					});
					this.showTooltip(activeSegments);
				});
			}
			this.calculateTotal(data);

			helpers.each(data,function(datapoint, index){
				if (!datapoint.color) {
					datapoint.color = 'hsl(' + (360 * index / data.length) + ', 100%, 50%)';
				}
				this.addData(datapoint, index, true);
			},this);

			this.render();
		},
		getSegmentsAtEvent : function(e){
			var segmentsArray = [];

			var location = helpers.getRelativePosition(e);

			helpers.each(this.segments,function(segment){
				if (segment.inRange(location.x,location.y)) segmentsArray.push(segment);
			},this);
			return segmentsArray;
		},
		addData : function(segment, atIndex, silent){
			var index = atIndex !== undefined ? atIndex : this.segments.length;
			if ( typeof(segment.color) === "undefined" ) {
				segment.color = Chart.defaults.global.segmentColorDefault[index % Chart.defaults.global.segmentColorDefault.length];
				segment.highlight = Chart.defaults.global.segmentHighlightColorDefaults[index % Chart.defaults.global.segmentHighlightColorDefaults.length];				
			}
			this.segments.splice(index, 0, new this.SegmentArc({
				value : segment.value,
				outerRadius : (this.options.animateScale) ? 0 : this.outerRadius,
				innerRadius : (this.options.animateScale) ? 0 : (this.outerRadius/100) * this.options.percentageInnerCutout,
				fillColor : segment.color,
				highlightColor : segment.highlight || segment.color,
				showStroke : this.options.segmentShowStroke,
				strokeWidth : this.options.segmentStrokeWidth,
				strokeColor : this.options.segmentStrokeColor,
				startAngle : Math.PI * 1.5,
				circumference : (this.options.animateRotate) ? 0 : this.calculateCircumference(segment.value),
				label : segment.label
			}));
			if (!silent){
				this.reflow();
				this.update();
			}
		},
		calculateCircumference : function(value) {
			if ( this.total > 0 ) {
				return (Math.PI*2)*(value / this.total);
			} else {
				return 0;
			}
		},
		calculateTotal : function(data){
			this.total = 0;
			helpers.each(data,function(segment){
				this.total += Math.abs(segment.value);
			},this);
		},
		update : function(){
			this.calculateTotal(this.segments);

			// Reset any highlight colours before updating.
			helpers.each(this.activeElements, function(activeElement){
				activeElement.restore(['fillColor']);
			});

			helpers.each(this.segments,function(segment){
				segment.save();
			});
			this.render();
		},

		removeData: function(atIndex){
			var indexToDelete = (helpers.isNumber(atIndex)) ? atIndex : this.segments.length-1;
			this.segments.splice(indexToDelete, 1);
			this.reflow();
			this.update();
		},

		reflow : function(){
			helpers.extend(this.SegmentArc.prototype,{
				x : this.chart.width/2,
				y : this.chart.height/2
			});
			this.outerRadius = (helpers.min([this.chart.width,this.chart.height]) -	this.options.segmentStrokeWidth/2)/2;
			helpers.each(this.segments, function(segment){
				segment.update({
					outerRadius : this.outerRadius,
					innerRadius : (this.outerRadius/100) * this.options.percentageInnerCutout
				});
			}, this);
		},
		draw : function(easeDecimal){
			var animDecimal = (easeDecimal) ? easeDecimal : 1;
			this.clear();
			helpers.each(this.segments,function(segment,index){
				segment.transition({
					circumference : this.calculateCircumference(segment.value),
					outerRadius : this.outerRadius,
					innerRadius : (this.outerRadius/100) * this.options.percentageInnerCutout
				},animDecimal);

				segment.endAngle = segment.startAngle + segment.circumference;

				segment.draw();
				if (index === 0){
					segment.startAngle = Math.PI * 1.5;
				}
				//Check to see if it's the last segment, if not get the next and update the start angle
				if (index < this.segments.length-1){
					this.segments[index+1].startAngle = segment.endAngle;
				}
			},this);

		}
	});

	Chart.types.Doughnut.extend({
		name : "Pie",
		defaults : helpers.merge(defaultConfig,{percentageInnerCutout : 0})
	});

}).call(this);

(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		helpers = Chart.helpers;

	var defaultConfig = {

		///Boolean - Whether grid lines are shown across the chart
		scaleShowGridLines : true,

		//String - Colour of the grid lines
		scaleGridLineColor : "rgba(0,0,0,.05)",

		//Number - Width of the grid lines
		scaleGridLineWidth : 1,

		//Boolean - Whether to show horizontal lines (except X axis)
		scaleShowHorizontalLines: true,

		//Boolean - Whether to show vertical lines (except Y axis)
		scaleShowVerticalLines: true,

		//Boolean - Whether the line is curved between points
		bezierCurve : true,

		//Number - Tension of the bezier curve between points
		bezierCurveTension : 0.4,

		//Boolean - Whether to show a dot for each point
		pointDot : true,

		//Number - Radius of each point dot in pixels
		pointDotRadius : 4,

		//Number - Pixel width of point dot stroke
		pointDotStrokeWidth : 1,

		//Number - amount extra to add to the radius to cater for hit detection outside the drawn point
		pointHitDetectionRadius : 20,

		//Boolean - Whether to show a stroke for datasets
		datasetStroke : true,

		//Number - Pixel width of dataset stroke
		datasetStrokeWidth : 2,

		//Boolean - Whether to fill the dataset with a colour
		datasetFill : true,

		//String - A legend template
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span class=\"<%=name.toLowerCase()%>-legend-icon\" style=\"background-color:<%=datasets[i].strokeColor%>\"></span><span class=\"<%=name.toLowerCase()%>-legend-text\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>",

		//Boolean - Whether to horizontally center the label and point dot inside the grid
		offsetGridLines : false

	};


	Chart.Type.extend({
		name: "Line",
		defaults : defaultConfig,
		initialize:  function(data){
			//Declare the extension of the default point, to cater for the options passed in to the constructor
			this.PointClass = Chart.Point.extend({
				offsetGridLines : this.options.offsetGridLines,
				strokeWidth : this.options.pointDotStrokeWidth,
				radius : this.options.pointDotRadius,
				display: this.options.pointDot,
				hitDetectionRadius : this.options.pointHitDetectionRadius,
				ctx : this.chart.ctx,
				inRange : function(mouseX){
					return (Math.pow(mouseX-this.x, 2) < Math.pow(this.radius + this.hitDetectionRadius,2));
				}
			});

			this.datasets = [];

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activePoints = (evt.type !== 'mouseout') ? this.getPointsAtEvent(evt) : [];
					this.eachPoints(function(point){
						point.restore(['fillColor', 'strokeColor']);
					});
					helpers.each(activePoints, function(activePoint){
						activePoint.fillColor = activePoint.highlightFill;
						activePoint.strokeColor = activePoint.highlightStroke;
					});
					this.showTooltip(activePoints);
				});
			}

			//Iterate through each of the datasets, and build this into a property of the chart
			helpers.each(data.datasets,function(dataset){

				var datasetObject = {
					label : dataset.label || null,
					fillColor : dataset.fillColor,
					strokeColor : dataset.strokeColor,
					pointColor : dataset.pointColor,
					pointStrokeColor : dataset.pointStrokeColor,
					points : []
				};

				this.datasets.push(datasetObject);


				helpers.each(dataset.data,function(dataPoint,index){
					//Add a new point for each piece of data, passing any required data to draw.
					datasetObject.points.push(new this.PointClass({
						value : dataPoint,
						label : data.labels[index],
						datasetLabel: dataset.label,
						strokeColor : dataset.pointStrokeColor,
						fillColor : dataset.pointColor,
						highlightFill : dataset.pointHighlightFill || dataset.pointColor,
						highlightStroke : dataset.pointHighlightStroke || dataset.pointStrokeColor
					}));
				},this);

				this.buildScale(data.labels);


				this.eachPoints(function(point, index){
					helpers.extend(point, {
						x: this.scale.calculateX(index),
						y: this.scale.endPoint
					});
					point.save();
				}, this);

			},this);


			this.render();
		},
		update : function(){
			this.scale.update();
			// Reset any highlight colours before updating.
			helpers.each(this.activeElements, function(activeElement){
				activeElement.restore(['fillColor', 'strokeColor']);
			});
			this.eachPoints(function(point){
				point.save();
			});
			this.render();
		},
		eachPoints : function(callback){
			helpers.each(this.datasets,function(dataset){
				helpers.each(dataset.points,callback,this);
			},this);
		},
		getPointsAtEvent : function(e){
			var pointsArray = [],
				eventPosition = helpers.getRelativePosition(e);
			helpers.each(this.datasets,function(dataset){
				helpers.each(dataset.points,function(point){
					if (point.inRange(eventPosition.x,eventPosition.y)) pointsArray.push(point);
				});
			},this);
			return pointsArray;
		},
		buildScale : function(labels){
			var self = this;

			var dataTotal = function(){
				var values = [];
				self.eachPoints(function(point){
					values.push(point.value);
				});

				return values;
			};

			var scaleOptions = {
				templateString : this.options.scaleLabel,
				height : this.chart.height,
				width : this.chart.width,
				ctx : this.chart.ctx,
				textColor : this.options.scaleFontColor,
				offsetGridLines : this.options.offsetGridLines,
				fontSize : this.options.scaleFontSize,
				fontStyle : this.options.scaleFontStyle,
				fontFamily : this.options.scaleFontFamily,
				valuesCount : labels.length,
				beginAtZero : this.options.scaleBeginAtZero,
				integersOnly : this.options.scaleIntegersOnly,
				calculateYRange : function(currentHeight){
					var updatedRanges = helpers.calculateScaleRange(
						dataTotal(),
						currentHeight,
						this.fontSize,
						this.beginAtZero,
						this.integersOnly
					);
					helpers.extend(this, updatedRanges);
				},
				xLabels : labels,
				font : helpers.fontString(this.options.scaleFontSize, this.options.scaleFontStyle, this.options.scaleFontFamily),
				lineWidth : this.options.scaleLineWidth,
				lineColor : this.options.scaleLineColor,
				showHorizontalLines : this.options.scaleShowHorizontalLines,
				showVerticalLines : this.options.scaleShowVerticalLines,
				gridLineWidth : (this.options.scaleShowGridLines) ? this.options.scaleGridLineWidth : 0,
				gridLineColor : (this.options.scaleShowGridLines) ? this.options.scaleGridLineColor : "rgba(0,0,0,0)",
				padding: (this.options.showScale) ? 0 : this.options.pointDotRadius + this.options.pointDotStrokeWidth,
				showLabels : this.options.scaleShowLabels,
				display : this.options.showScale
			};

			if (this.options.scaleOverride){
				helpers.extend(scaleOptions, {
					calculateYRange: helpers.noop,
					steps: this.options.scaleSteps,
					stepValue: this.options.scaleStepWidth,
					min: this.options.scaleStartValue,
					max: this.options.scaleStartValue + (this.options.scaleSteps * this.options.scaleStepWidth)
				});
			}


			this.scale = new Chart.Scale(scaleOptions);
		},
		addData : function(valuesArray,label){
			//Map the values array for each of the datasets

			helpers.each(valuesArray,function(value,datasetIndex){
				//Add a new point for each piece of data, passing any required data to draw.
				this.datasets[datasetIndex].points.push(new this.PointClass({
					value : value,
					label : label,
					datasetLabel: this.datasets[datasetIndex].label,
					x: this.scale.calculateX(this.scale.valuesCount+1),
					y: this.scale.endPoint,
					strokeColor : this.datasets[datasetIndex].pointStrokeColor,
					fillColor : this.datasets[datasetIndex].pointColor
				}));
			},this);

			this.scale.addXLabel(label);
			//Then re-render the chart.
			this.update();
		},
		removeData : function(){
			this.scale.removeXLabel();
			//Then re-render the chart.
			helpers.each(this.datasets,function(dataset){
				dataset.points.shift();
			},this);
			this.update();
		},
		reflow : function(){
			var newScaleProps = helpers.extend({
				height : this.chart.height,
				width : this.chart.width
			});
			this.scale.update(newScaleProps);
		},
		draw : function(ease){
			var easingDecimal = ease || 1;
			this.clear();

			var ctx = this.chart.ctx;

			// Some helper methods for getting the next/prev points
			var hasValue = function(item){
				return item.value !== null;
			},
			nextPoint = function(point, collection, index){
				return helpers.findNextWhere(collection, hasValue, index) || point;
			},
			previousPoint = function(point, collection, index){
				return helpers.findPreviousWhere(collection, hasValue, index) || point;
			};

			if (!this.scale) return;
			this.scale.draw(easingDecimal);


			helpers.each(this.datasets,function(dataset){
				var pointsWithValues = helpers.where(dataset.points, hasValue);

				//Transition each point first so that the line and point drawing isn't out of sync
				//We can use this extra loop to calculate the control points of this dataset also in this loop

				helpers.each(dataset.points, function(point, index){
					if (point.hasValue()){
						point.transition({
							y : this.scale.calculateY(point.value),
							x : this.scale.calculateX(index)
						}, easingDecimal);
					}
				},this);


				// Control points need to be calculated in a separate loop, because we need to know the current x/y of the point
				// This would cause issues when there is no animation, because the y of the next point would be 0, so beziers would be skewed
				if (this.options.bezierCurve){
					helpers.each(pointsWithValues, function(point, index){
						var tension = (index > 0 && index < pointsWithValues.length - 1) ? this.options.bezierCurveTension : 0;
						point.controlPoints = helpers.splineCurve(
							previousPoint(point, pointsWithValues, index),
							point,
							nextPoint(point, pointsWithValues, index),
							tension
						);

						// Prevent the bezier going outside of the bounds of the graph

						// Cap puter bezier handles to the upper/lower scale bounds
						if (point.controlPoints.outer.y > this.scale.endPoint){
							point.controlPoints.outer.y = this.scale.endPoint;
						}
						else if (point.controlPoints.outer.y < this.scale.startPoint){
							point.controlPoints.outer.y = this.scale.startPoint;
						}

						// Cap inner bezier handles to the upper/lower scale bounds
						if (point.controlPoints.inner.y > this.scale.endPoint){
							point.controlPoints.inner.y = this.scale.endPoint;
						}
						else if (point.controlPoints.inner.y < this.scale.startPoint){
							point.controlPoints.inner.y = this.scale.startPoint;
						}
					},this);
				}


				//Draw the line between all the points
				ctx.lineWidth = this.options.datasetStrokeWidth;
				ctx.strokeStyle = dataset.strokeColor;
				ctx.beginPath();

				helpers.each(pointsWithValues, function(point, index){
					if (index === 0){
						ctx.moveTo(point.x, point.y);
					}
					else{
						if(this.options.bezierCurve){
							var previous = previousPoint(point, pointsWithValues, index);

							ctx.bezierCurveTo(
								previous.controlPoints.outer.x,
								previous.controlPoints.outer.y,
								point.controlPoints.inner.x,
								point.controlPoints.inner.y,
								point.x,
								point.y
							);
						}
						else{
							ctx.lineTo(point.x,point.y);
						}
					}
				}, this);

				if (this.options.datasetStroke) {
					ctx.stroke();
				}

				if (this.options.datasetFill && pointsWithValues.length > 0){
					//Round off the line by going to the base of the chart, back to the start, then fill.
					ctx.lineTo(pointsWithValues[pointsWithValues.length - 1].x, this.scale.endPoint);
					ctx.lineTo(pointsWithValues[0].x, this.scale.endPoint);
					ctx.fillStyle = dataset.fillColor;
					ctx.closePath();
					ctx.fill();
				}

				//Now draw the points over the line
				//A little inefficient double looping, but better than the line
				//lagging behind the point positions
				helpers.each(pointsWithValues,function(point){
					point.draw();
				});
			},this);
		}
	});


}).call(this);

(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		//Cache a local reference to Chart.helpers
		helpers = Chart.helpers;

	var defaultConfig = {
		//Boolean - Show a backdrop to the scale label
		scaleShowLabelBackdrop : true,

		//String - The colour of the label backdrop
		scaleBackdropColor : "rgba(255,255,255,0.75)",

		// Boolean - Whether the scale should begin at zero
		scaleBeginAtZero : true,

		//Number - The backdrop padding above & below the label in pixels
		scaleBackdropPaddingY : 2,

		//Number - The backdrop padding to the side of the label in pixels
		scaleBackdropPaddingX : 2,

		//Boolean - Show line for each value in the scale
		scaleShowLine : true,

		//Boolean - Stroke a line around each segment in the chart
		segmentShowStroke : true,

		//String - The colour of the stroke on each segment.
		segmentStrokeColor : "#fff",

		//Number - The width of the stroke value in pixels
		segmentStrokeWidth : 2,

		//Number - Amount of animation steps
		animationSteps : 100,

		//String - Animation easing effect.
		animationEasing : "easeOutBounce",

		//Boolean - Whether to animate the rotation of the chart
		animateRotate : true,

		//Boolean - Whether to animate scaling the chart from the centre
		animateScale : false,

		//String - A legend template
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span class=\"<%=name.toLowerCase()%>-legend-icon\" style=\"background-color:<%=segments[i].fillColor%>\"></span><span class=\"<%=name.toLowerCase()%>-legend-text\"><%if(segments[i].label){%><%=segments[i].label%><%}%></span></li><%}%></ul>"
	};


	Chart.Type.extend({
		//Passing in a name registers this chart in the Chart namespace
		name: "PolarArea",
		//Providing a defaults will also register the defaults in the chart namespace
		defaults : defaultConfig,
		//Initialize is fired when the chart is initialized - Data is passed in as a parameter
		//Config is automatically merged by the core of Chart.js, and is available at this.options
		initialize:  function(data){
			this.segments = [];
			//Declare segment class as a chart instance specific class, so it can share props for this instance
			this.SegmentArc = Chart.Arc.extend({
				showStroke : this.options.segmentShowStroke,
				strokeWidth : this.options.segmentStrokeWidth,
				strokeColor : this.options.segmentStrokeColor,
				ctx : this.chart.ctx,
				innerRadius : 0,
				x : this.chart.width/2,
				y : this.chart.height/2
			});
			this.scale = new Chart.RadialScale({
				display: this.options.showScale,
				fontStyle: this.options.scaleFontStyle,
				fontSize: this.options.scaleFontSize,
				fontFamily: this.options.scaleFontFamily,
				fontColor: this.options.scaleFontColor,
				showLabels: this.options.scaleShowLabels,
				showLabelBackdrop: this.options.scaleShowLabelBackdrop,
				backdropColor: this.options.scaleBackdropColor,
				backdropPaddingY : this.options.scaleBackdropPaddingY,
				backdropPaddingX: this.options.scaleBackdropPaddingX,
				lineWidth: (this.options.scaleShowLine) ? this.options.scaleLineWidth : 0,
				lineColor: this.options.scaleLineColor,
				lineArc: true,
				width: this.chart.width,
				height: this.chart.height,
				xCenter: this.chart.width/2,
				yCenter: this.chart.height/2,
				ctx : this.chart.ctx,
				templateString: this.options.scaleLabel,
				valuesCount: data.length
			});

			this.updateScaleRange(data);

			this.scale.update();

			helpers.each(data,function(segment,index){
				this.addData(segment,index,true);
			},this);

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activeSegments = (evt.type !== 'mouseout') ? this.getSegmentsAtEvent(evt) : [];
					helpers.each(this.segments,function(segment){
						segment.restore(["fillColor"]);
					});
					helpers.each(activeSegments,function(activeSegment){
						activeSegment.fillColor = activeSegment.highlightColor;
					});
					this.showTooltip(activeSegments);
				});
			}

			this.render();
		},
		getSegmentsAtEvent : function(e){
			var segmentsArray = [];

			var location = helpers.getRelativePosition(e);

			helpers.each(this.segments,function(segment){
				if (segment.inRange(location.x,location.y)) segmentsArray.push(segment);
			},this);
			return segmentsArray;
		},
		addData : function(segment, atIndex, silent){
			var index = atIndex || this.segments.length;

			this.segments.splice(index, 0, new this.SegmentArc({
				fillColor: segment.color,
				highlightColor: segment.highlight || segment.color,
				label: segment.label,
				value: segment.value,
				outerRadius: (this.options.animateScale) ? 0 : this.scale.calculateCenterOffset(segment.value),
				circumference: (this.options.animateRotate) ? 0 : this.scale.getCircumference(),
				startAngle: Math.PI * 1.5
			}));
			if (!silent){
				this.reflow();
				this.update();
			}
		},
		removeData: function(atIndex){
			var indexToDelete = (helpers.isNumber(atIndex)) ? atIndex : this.segments.length-1;
			this.segments.splice(indexToDelete, 1);
			this.reflow();
			this.update();
		},
		calculateTotal: function(data){
			this.total = 0;
			helpers.each(data,function(segment){
				this.total += segment.value;
			},this);
			this.scale.valuesCount = this.segments.length;
		},
		updateScaleRange: function(datapoints){
			var valuesArray = [];
			helpers.each(datapoints,function(segment){
				valuesArray.push(segment.value);
			});

			var scaleSizes = (this.options.scaleOverride) ?
				{
					steps: this.options.scaleSteps,
					stepValue: this.options.scaleStepWidth,
					min: this.options.scaleStartValue,
					max: this.options.scaleStartValue + (this.options.scaleSteps * this.options.scaleStepWidth)
				} :
				helpers.calculateScaleRange(
					valuesArray,
					helpers.min([this.chart.width, this.chart.height])/2,
					this.options.scaleFontSize,
					this.options.scaleBeginAtZero,
					this.options.scaleIntegersOnly
				);

			helpers.extend(
				this.scale,
				scaleSizes,
				{
					size: helpers.min([this.chart.width, this.chart.height]),
					xCenter: this.chart.width/2,
					yCenter: this.chart.height/2
				}
			);

		},
		update : function(){
			this.calculateTotal(this.segments);

			helpers.each(this.segments,function(segment){
				segment.save();
			});
			
			this.reflow();
			this.render();
		},
		reflow : function(){
			helpers.extend(this.SegmentArc.prototype,{
				x : this.chart.width/2,
				y : this.chart.height/2
			});
			this.updateScaleRange(this.segments);
			this.scale.update();

			helpers.extend(this.scale,{
				xCenter: this.chart.width/2,
				yCenter: this.chart.height/2
			});

			helpers.each(this.segments, function(segment){
				segment.update({
					outerRadius : this.scale.calculateCenterOffset(segment.value)
				});
			}, this);

		},
		draw : function(ease){
			var easingDecimal = ease || 1;
			//Clear & draw the canvas
			this.clear();
			helpers.each(this.segments,function(segment, index){
				segment.transition({
					circumference : this.scale.getCircumference(),
					outerRadius : this.scale.calculateCenterOffset(segment.value)
				},easingDecimal);

				segment.endAngle = segment.startAngle + segment.circumference;

				// If we've removed the first segment we need to set the first one to
				// start at the top.
				if (index === 0){
					segment.startAngle = Math.PI * 1.5;
				}

				//Check to see if it's the last segment, if not get the next and update the start angle
				if (index < this.segments.length - 1){
					this.segments[index+1].startAngle = segment.endAngle;
				}
				segment.draw();
			}, this);
			this.scale.draw();
		}
	});

}).call(this);

(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		helpers = Chart.helpers;



	Chart.Type.extend({
		name: "Radar",
		defaults:{
			//Boolean - Whether to show lines for each scale point
			scaleShowLine : true,

			//Boolean - Whether we show the angle lines out of the radar
			angleShowLineOut : true,

			//Boolean - Whether to show labels on the scale
			scaleShowLabels : false,

			// Boolean - Whether the scale should begin at zero
			scaleBeginAtZero : true,

			//String - Colour of the angle line
			angleLineColor : "rgba(0,0,0,.1)",

			//Number - Pixel width of the angle line
			angleLineWidth : 1,

			//Number - Interval at which to draw angle lines ("every Nth point")
			angleLineInterval: 1,

			//String - Point label font declaration
			pointLabelFontFamily : "'Arial'",

			//String - Point label font weight
			pointLabelFontStyle : "normal",

			//Number - Point label font size in pixels
			pointLabelFontSize : 10,

			//String - Point label font colour
			pointLabelFontColor : "#666",

			//Boolean - Whether to show a dot for each point
			pointDot : true,

			//Number - Radius of each point dot in pixels
			pointDotRadius : 3,

			//Number - Pixel width of point dot stroke
			pointDotStrokeWidth : 1,

			//Number - amount extra to add to the radius to cater for hit detection outside the drawn point
			pointHitDetectionRadius : 20,

			//Boolean - Whether to show a stroke for datasets
			datasetStroke : true,

			//Number - Pixel width of dataset stroke
			datasetStrokeWidth : 2,

			//Boolean - Whether to fill the dataset with a colour
			datasetFill : true,

			//String - A legend template
			legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span class=\"<%=name.toLowerCase()%>-legend-icon\" style=\"background-color:<%=datasets[i].strokeColor%>\"></span><span class=\"<%=name.toLowerCase()%>-legend-text\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>"

		},

		initialize: function(data){
			this.PointClass = Chart.Point.extend({
				strokeWidth : this.options.pointDotStrokeWidth,
				radius : this.options.pointDotRadius,
				display: this.options.pointDot,
				hitDetectionRadius : this.options.pointHitDetectionRadius,
				ctx : this.chart.ctx
			});

			this.datasets = [];

			this.buildScale(data);

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activePointsCollection = (evt.type !== 'mouseout') ? this.getPointsAtEvent(evt) : [];

					this.eachPoints(function(point){
						point.restore(['fillColor', 'strokeColor']);
					});
					helpers.each(activePointsCollection, function(activePoint){
						activePoint.fillColor = activePoint.highlightFill;
						activePoint.strokeColor = activePoint.highlightStroke;
					});

					this.showTooltip(activePointsCollection);
				});
			}

			//Iterate through each of the datasets, and build this into a property of the chart
			helpers.each(data.datasets,function(dataset){

				var datasetObject = {
					label: dataset.label || null,
					fillColor : dataset.fillColor,
					strokeColor : dataset.strokeColor,
					pointColor : dataset.pointColor,
					pointStrokeColor : dataset.pointStrokeColor,
					points : []
				};

				this.datasets.push(datasetObject);

				helpers.each(dataset.data,function(dataPoint,index){
					//Add a new point for each piece of data, passing any required data to draw.
					var pointPosition;
					if (!this.scale.animation){
						pointPosition = this.scale.getPointPosition(index, this.scale.calculateCenterOffset(dataPoint));
					}
					datasetObject.points.push(new this.PointClass({
						value : dataPoint,
						label : data.labels[index],
						datasetLabel: dataset.label,
						x: (this.options.animation) ? this.scale.xCenter : pointPosition.x,
						y: (this.options.animation) ? this.scale.yCenter : pointPosition.y,
						strokeColor : dataset.pointStrokeColor,
						fillColor : dataset.pointColor,
						highlightFill : dataset.pointHighlightFill || dataset.pointColor,
						highlightStroke : dataset.pointHighlightStroke || dataset.pointStrokeColor
					}));
				},this);

			},this);

			this.render();
		},
		eachPoints : function(callback){
			helpers.each(this.datasets,function(dataset){
				helpers.each(dataset.points,callback,this);
			},this);
		},

		getPointsAtEvent : function(evt){
			var mousePosition = helpers.getRelativePosition(evt),
				fromCenter = helpers.getAngleFromPoint({
					x: this.scale.xCenter,
					y: this.scale.yCenter
				}, mousePosition);

			var anglePerIndex = (Math.PI * 2) /this.scale.valuesCount,
				pointIndex = Math.round((fromCenter.angle - Math.PI * 1.5) / anglePerIndex),
				activePointsCollection = [];

			// If we're at the top, make the pointIndex 0 to get the first of the array.
			if (pointIndex >= this.scale.valuesCount || pointIndex < 0){
				pointIndex = 0;
			}

			if (fromCenter.distance <= this.scale.drawingArea){
				helpers.each(this.datasets, function(dataset){
					activePointsCollection.push(dataset.points[pointIndex]);
				});
			}

			return activePointsCollection;
		},

		buildScale : function(data){
			this.scale = new Chart.RadialScale({
				display: this.options.showScale,
				fontStyle: this.options.scaleFontStyle,
				fontSize: this.options.scaleFontSize,
				fontFamily: this.options.scaleFontFamily,
				fontColor: this.options.scaleFontColor,
				showLabels: this.options.scaleShowLabels,
				showLabelBackdrop: this.options.scaleShowLabelBackdrop,
				backdropColor: this.options.scaleBackdropColor,
				backgroundColors: this.options.scaleBackgroundColors,
				backdropPaddingY : this.options.scaleBackdropPaddingY,
				backdropPaddingX: this.options.scaleBackdropPaddingX,
				lineWidth: (this.options.scaleShowLine) ? this.options.scaleLineWidth : 0,
				lineColor: this.options.scaleLineColor,
				angleLineColor : this.options.angleLineColor,
				angleLineWidth : (this.options.angleShowLineOut) ? this.options.angleLineWidth : 0,
        angleLineInterval: (this.options.angleLineInterval) ? this.options.angleLineInterval : 1,
				// Point labels at the edge of each line
				pointLabelFontColor : this.options.pointLabelFontColor,
				pointLabelFontSize : this.options.pointLabelFontSize,
				pointLabelFontFamily : this.options.pointLabelFontFamily,
				pointLabelFontStyle : this.options.pointLabelFontStyle,
				height : this.chart.height,
				width: this.chart.width,
				xCenter: this.chart.width/2,
				yCenter: this.chart.height/2,
				ctx : this.chart.ctx,
				templateString: this.options.scaleLabel,
				labels: data.labels,
				valuesCount: data.datasets[0].data.length
			});

			this.scale.setScaleSize();
			this.updateScaleRange(data.datasets);
			this.scale.buildYLabels();
		},
		updateScaleRange: function(datasets){
			var valuesArray = (function(){
				var totalDataArray = [];
				helpers.each(datasets,function(dataset){
					if (dataset.data){
						totalDataArray = totalDataArray.concat(dataset.data);
					}
					else {
						helpers.each(dataset.points, function(point){
							totalDataArray.push(point.value);
						});
					}
				});
				return totalDataArray;
			})();


			var scaleSizes = (this.options.scaleOverride) ?
				{
					steps: this.options.scaleSteps,
					stepValue: this.options.scaleStepWidth,
					min: this.options.scaleStartValue,
					max: this.options.scaleStartValue + (this.options.scaleSteps * this.options.scaleStepWidth)
				} :
				helpers.calculateScaleRange(
					valuesArray,
					helpers.min([this.chart.width, this.chart.height])/2,
					this.options.scaleFontSize,
					this.options.scaleBeginAtZero,
					this.options.scaleIntegersOnly
				);

			helpers.extend(
				this.scale,
				scaleSizes
			);

		},
		addData : function(valuesArray,label){
			//Map the values array for each of the datasets
			this.scale.valuesCount++;
			helpers.each(valuesArray,function(value,datasetIndex){
				var pointPosition = this.scale.getPointPosition(this.scale.valuesCount, this.scale.calculateCenterOffset(value));
				this.datasets[datasetIndex].points.push(new this.PointClass({
					value : value,
					label : label,
					datasetLabel: this.datasets[datasetIndex].label,
					x: pointPosition.x,
					y: pointPosition.y,
					strokeColor : this.datasets[datasetIndex].pointStrokeColor,
					fillColor : this.datasets[datasetIndex].pointColor
				}));
			},this);

			this.scale.labels.push(label);

			this.reflow();

			this.update();
		},
		removeData : function(){
			this.scale.valuesCount--;
			this.scale.labels.shift();
			helpers.each(this.datasets,function(dataset){
				dataset.points.shift();
			},this);
			this.reflow();
			this.update();
		},
		update : function(){
			this.eachPoints(function(point){
				point.save();
			});
			this.reflow();
			this.render();
		},
		reflow: function(){
			helpers.extend(this.scale, {
				width : this.chart.width,
				height: this.chart.height,
				size : helpers.min([this.chart.width, this.chart.height]),
				xCenter: this.chart.width/2,
				yCenter: this.chart.height/2
			});
			this.updateScaleRange(this.datasets);
			this.scale.setScaleSize();
			this.scale.buildYLabels();
		},
		draw : function(ease){
			var easeDecimal = ease || 1,
				ctx = this.chart.ctx;
			this.clear();
			this.scale.draw();

			helpers.each(this.datasets,function(dataset){

				//Transition each point first so that the line and point drawing isn't out of sync
				helpers.each(dataset.points,function(point,index){
					if (point.hasValue()){
						point.transition(this.scale.getPointPosition(index, this.scale.calculateCenterOffset(point.value)), easeDecimal);
					}
				},this);



				//Draw the line between all the points
				ctx.lineWidth = this.options.datasetStrokeWidth;
				ctx.strokeStyle = dataset.strokeColor;
				ctx.beginPath();
				helpers.each(dataset.points,function(point,index){
					if (index === 0){
						ctx.moveTo(point.x,point.y);
					}
					else{
						ctx.lineTo(point.x,point.y);
					}
				},this);
				ctx.closePath();
				ctx.stroke();

				ctx.fillStyle = dataset.fillColor;
				if(this.options.datasetFill){
					ctx.fill();
				}
				//Now draw the points over the line
				//A little inefficient double looping, but better than the line
				//lagging behind the point positions
				helpers.each(dataset.points,function(point){
					if (point.hasValue()){
						point.draw();
					}
				});

			},this);

		}

	});





}).call(this);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYXJ0LmpzIl0sIm5hbWVzIjpbInJvb3QiLCJ0aGlzIiwicHJldmlvdXMiLCJDaGFydCIsImNvbnRleHQiLCJjYW52YXMiLCJjdHgiLCJjb21wdXRlRGltZW5zaW9uIiwiZWxlbWVudCIsImRpbWVuc2lvbiIsImRvY3VtZW50IiwiZGVmYXVsdFZpZXciLCJnZXRDb21wdXRlZFN0eWxlIiwiZ2V0UHJvcGVydHlWYWx1ZSIsIndpZHRoIiwiaGVpZ2h0IiwiYXNwZWN0UmF0aW8iLCJoZWxwZXJzIiwicmV0aW5hU2NhbGUiLCJkZWZhdWx0cyIsImdsb2JhbCIsImFuaW1hdGlvbiIsImFuaW1hdGlvblN0ZXBzIiwiYW5pbWF0aW9uRWFzaW5nIiwic2hvd1NjYWxlIiwic2NhbGVPdmVycmlkZSIsInNjYWxlU3RlcHMiLCJzY2FsZVN0ZXBXaWR0aCIsInNjYWxlU3RhcnRWYWx1ZSIsInNjYWxlTGluZUNvbG9yIiwic2NhbGVMaW5lV2lkdGgiLCJzY2FsZVNob3dMYWJlbHMiLCJzY2FsZUxhYmVsIiwic2NhbGVJbnRlZ2Vyc09ubHkiLCJzY2FsZUJlZ2luQXRaZXJvIiwic2NhbGVGb250RmFtaWx5Iiwic2NhbGVGb250U2l6ZSIsInNjYWxlRm9udFN0eWxlIiwic2NhbGVGb250Q29sb3IiLCJyZXNwb25zaXZlIiwibWFpbnRhaW5Bc3BlY3RSYXRpbyIsInNob3dUb29sdGlwcyIsImN1c3RvbVRvb2x0aXBzIiwidG9vbHRpcEV2ZW50cyIsInRvb2x0aXBGaWxsQ29sb3IiLCJ0b29sdGlwRm9udEZhbWlseSIsInRvb2x0aXBGb250U2l6ZSIsInRvb2x0aXBGb250U3R5bGUiLCJ0b29sdGlwRm9udENvbG9yIiwidG9vbHRpcFRpdGxlRm9udEZhbWlseSIsInRvb2x0aXBUaXRsZUZvbnRTaXplIiwidG9vbHRpcFRpdGxlRm9udFN0eWxlIiwidG9vbHRpcFRpdGxlRm9udENvbG9yIiwidG9vbHRpcFRpdGxlVGVtcGxhdGUiLCJ0b29sdGlwWVBhZGRpbmciLCJ0b29sdGlwWFBhZGRpbmciLCJ0b29sdGlwQ2FyZXRTaXplIiwidG9vbHRpcENvcm5lclJhZGl1cyIsInRvb2x0aXBYT2Zmc2V0IiwidG9vbHRpcFRlbXBsYXRlIiwibXVsdGlUb29sdGlwVGVtcGxhdGUiLCJtdWx0aVRvb2x0aXBLZXlCYWNrZ3JvdW5kIiwic2VnbWVudENvbG9yRGVmYXVsdCIsInNlZ21lbnRIaWdobGlnaHRDb2xvckRlZmF1bHRzIiwib25BbmltYXRpb25Qcm9ncmVzcyIsIm9uQW5pbWF0aW9uQ29tcGxldGUiLCJ0eXBlcyIsImVhY2giLCJsb29wYWJsZSIsImNhbGxiYWNrIiwic2VsZiIsImFkZGl0aW9uYWxBcmdzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzbGljZSIsImNhbGwiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJpIiwiYXBwbHkiLCJjb25jYXQiLCJpdGVtIiwiY2xvbmUiLCJvYmoiLCJvYmpDbG9uZSIsInZhbHVlIiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJleHRlbmQiLCJiYXNlIiwiZXh0ZW5zaW9uT2JqZWN0IiwibWVyZ2UiLCJtYXN0ZXIiLCJhcmdzIiwidW5zaGlmdCIsImluZGV4T2YiLCJhcnJheVRvU2VhcmNoIiwiaW5oZXJpdHMiLCJ3aGVyZSIsImNvbGxlY3Rpb24iLCJmaWx0ZXJDYWxsYmFjayIsImZpbHRlcmVkIiwicHVzaCIsImZpbmROZXh0V2hlcmUiLCJzdGFydEluZGV4IiwiY3VycmVudEl0ZW0iLCJmaW5kUHJldmlvdXNXaGVyZSIsImV4dGVuc2lvbnMiLCJwYXJlbnQiLCJDaGFydEVsZW1lbnQiLCJjb25zdHJ1Y3RvciIsIlN1cnJvZ2F0ZSIsIl9fc3VwZXJfXyIsIm5vb3AiLCJ1aWQiLCJpZCIsIndhcm4iLCJzdHIiLCJ3aW5kb3ciLCJjb25zb2xlIiwiYW1kIiwiZGVmaW5lIiwiaXNOdW1iZXIiLCJuIiwiaXNOYU4iLCJwYXJzZUZsb2F0IiwiaXNGaW5pdGUiLCJtYXgiLCJhcnJheSIsIk1hdGgiLCJtaW4iLCJnZXREZWNpbWFsUGxhY2VzIiwiY2FwIiwidmFsdWVUb0NhcCIsIm1heFZhbHVlIiwibWluVmFsdWUiLCJudW0iLCJzIiwidG9TdHJpbmciLCJzcGxpdCIsInBhcnNlSW50IiwicGFydHMiLCJ0b1JhZGlhbnMiLCJyYWRpYW5zIiwiZGVncmVlcyIsIlBJIiwiYWxpYXNQaXhlbCIsImdldEFuZ2xlRnJvbVBvaW50IiwiY2VudHJlUG9pbnQiLCJhbmdsZVBvaW50IiwiZGlzdGFuY2VGcm9tWENlbnRlciIsIngiLCJkaXN0YW5jZUZyb21ZQ2VudGVyIiwieSIsInJhZGlhbERpc3RhbmNlRnJvbUNlbnRlciIsInNxcnQiLCJhbmdsZSIsImF0YW4yIiwiZGlzdGFuY2UiLCJwaXhlbFdpZHRoIiwiY2FsY3VsYXRlT3JkZXJPZk1hZ25pdHVkZSIsInNwbGluZUN1cnZlIiwiRmlyc3RQb2ludCIsIk1pZGRsZVBvaW50IiwiQWZ0ZXJQb2ludCIsInQiLCJkMDEiLCJwb3ciLCJkMTIiLCJmYSIsImZiIiwiaW5uZXIiLCJvdXRlciIsInZhbCIsImZsb29yIiwibG9nIiwiTE4xMCIsInRlbXBsYXRlIiwiY2FsY3VsYXRlU2NhbGVSYW5nZSIsInZhbHVlc0FycmF5IiwiZHJhd2luZ1NpemUiLCJ0ZXh0U2l6ZSIsInN0YXJ0RnJvbVplcm8iLCJpbnRlZ2Vyc09ubHkiLCJtaW5TdGVwcyIsIm1heFN0ZXBzIiwic2tpcEZpdHRpbmciLCJ2YWx1ZXMiLCJ2IiwidmFsdWVSYW5nZSIsImFicyIsInJhbmdlT3JkZXJPZk1hZ25pdHVkZSIsImdyYXBoTWF4IiwiY2VpbCIsImdyYXBoTWluIiwiZ3JhcGhSYW5nZSIsInN0ZXBWYWx1ZSIsIm51bWJlck9mU3RlcHMiLCJyb3VuZCIsInN0ZXBzIiwidGVtcGxhdGVTdHJpbmciLCJ2YWx1ZXNPYmplY3QiLCJ0bXBsIiwiZGF0YSIsImZuIiwidGVzdCIsIkZ1bmN0aW9uIiwicmVwbGFjZSIsImpvaW4iLCJjYWNoZSIsImVhc2luZ0VmZmVjdHMiLCJnZW5lcmF0ZUxhYmVscyIsImxhYmVsc0FycmF5IiwiaW5kZXgiLCJsaW5lYXIiLCJlYXNlSW5RdWFkIiwiZWFzZU91dFF1YWQiLCJlYXNlSW5PdXRRdWFkIiwiZWFzZUluQ3ViaWMiLCJlYXNlT3V0Q3ViaWMiLCJlYXNlSW5PdXRDdWJpYyIsImVhc2VJblF1YXJ0IiwiZWFzZU91dFF1YXJ0IiwiZWFzZUluT3V0UXVhcnQiLCJlYXNlSW5RdWludCIsImVhc2VPdXRRdWludCIsImVhc2VJbk91dFF1aW50IiwiZWFzZUluU2luZSIsImNvcyIsImVhc2VPdXRTaW5lIiwic2luIiwiZWFzZUluT3V0U2luZSIsImVhc2VJbkV4cG8iLCJlYXNlT3V0RXhwbyIsImVhc2VJbk91dEV4cG8iLCJlYXNlSW5DaXJjIiwiZWFzZU91dENpcmMiLCJlYXNlSW5PdXRDaXJjIiwiZWFzZUluRWxhc3RpYyIsInAiLCJhIiwiYXNpbiIsImVhc2VPdXRFbGFzdGljIiwiZWFzZUluT3V0RWxhc3RpYyIsImVhc2VJbkJhY2siLCJlYXNlT3V0QmFjayIsImVhc2VJbk91dEJhY2siLCJlYXNlSW5Cb3VuY2UiLCJlYXNlT3V0Qm91bmNlIiwiZWFzZUluT3V0Qm91bmNlIiwicmVxdWVzdEFuaW1GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsIndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSIsIm1velJlcXVlc3RBbmltYXRpb25GcmFtZSIsIm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJtc1JlcXVlc3RBbmltYXRpb25GcmFtZSIsInNldFRpbWVvdXQiLCJhZGRFdmVudCIsImNhbmNlbEFuaW1GcmFtZSIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwid2Via2l0Q2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJtb3pDYW5jZWxBbmltYXRpb25GcmFtZSIsIm9DYW5jZWxBbmltYXRpb25GcmFtZSIsIm1zQ2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJjbGVhclRpbWVvdXQiLCJhbmltYXRpb25Mb29wIiwidG90YWxTdGVwcyIsImVhc2luZ1N0cmluZyIsIm9uUHJvZ3Jlc3MiLCJvbkNvbXBsZXRlIiwiY2hhcnRJbnN0YW5jZSIsImN1cnJlbnRTdGVwIiwiZWFzaW5nRnVuY3Rpb24iLCJhbmltYXRpb25GcmFtZSIsInN0ZXBEZWNpbWFsIiwiZWFzZURlY2ltYWwiLCJnZXRSZWxhdGl2ZVBvc2l0aW9uIiwiZXZ0IiwibW91c2VYIiwibW91c2VZIiwiZSIsIm9yaWdpbmFsRXZlbnQiLCJjdXJyZW50VGFyZ2V0Iiwic3JjRWxlbWVudCIsImJvdW5kaW5nUmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInRvdWNoZXMiLCJjbGllbnRYIiwibGVmdCIsImNsaWVudFkiLCJ0b3AiLCJub2RlIiwiZXZlbnRUeXBlIiwibWV0aG9kIiwiYWRkRXZlbnRMaXN0ZW5lciIsImF0dGFjaEV2ZW50IiwicmVtb3ZlRXZlbnQiLCJoYW5kbGVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImRldGFjaEV2ZW50IiwidW5iaW5kRXZlbnRzIiwiYmluZEV2ZW50cyIsImFycmF5T2ZFdmVudHMiLCJldmVudHMiLCJldmVudE5hbWUiLCJjaGFydCIsImdldE1heGltdW1XaWR0aCIsImRvbU5vZGUiLCJjb250YWluZXIiLCJwYXJlbnROb2RlIiwicGFkZGluZyIsImdldFN0eWxlIiwiY2xpZW50V2lkdGgiLCJnZXRNYXhpbXVtSGVpZ2h0IiwiY2xpZW50SGVpZ2h0IiwiZWwiLCJwcm9wZXJ0eSIsImN1cnJlbnRTdHlsZSIsImdldE1heGltdW1TaXplIiwiZGV2aWNlUGl4ZWxSYXRpbyIsInN0eWxlIiwic2NhbGUiLCJjbGVhciIsImNsZWFyUmVjdCIsImZvbnRTdHJpbmciLCJwaXhlbFNpemUiLCJmb250U3R5bGUiLCJmb250RmFtaWx5IiwibG9uZ2VzdFRleHQiLCJmb250IiwiYXJyYXlPZlN0cmluZ3MiLCJsb25nZXN0Iiwic3RyaW5nIiwidGV4dFdpZHRoIiwibWVhc3VyZVRleHQiLCJkcmF3Um91bmRlZFJlY3RhbmdsZSIsInJhZGl1cyIsImJlZ2luUGF0aCIsIm1vdmVUbyIsImxpbmVUbyIsInF1YWRyYXRpY0N1cnZlVG8iLCJjbG9zZVBhdGgiLCJpbnN0YW5jZXMiLCJUeXBlIiwib3B0aW9ucyIsInJlc2l6ZSIsImluaXRpYWxpemUiLCJzdG9wIiwiYW5pbWF0aW9uU2VydmljZSIsImNhbmNlbEFuaW1hdGlvbiIsIm5ld1dpZHRoIiwibmV3SGVpZ2h0IiwicmVmbG93IiwicmVuZGVyIiwiQW5pbWF0aW9uIiwibnVtU3RlcHMiLCJlYXNpbmciLCJhbmltYXRpb25PYmplY3QiLCJkcmF3IiwiYWRkQW5pbWF0aW9uIiwiZ2VuZXJhdGVMZWdlbmQiLCJsZWdlbmRUZW1wbGF0ZSIsImRlc3Ryb3kiLCJyZW1vdmVQcm9wZXJ0eSIsInJlbW92ZUF0dHJpYnV0ZSIsInNob3dUb29sdGlwIiwiQ2hhcnRFbGVtZW50cyIsImZvcmNlUmVkcmF3IiwiYWN0aXZlRWxlbWVudHMiLCJpc0NoYW5nZWQiLCJFbGVtZW50cyIsImNoYW5nZWQiLCJkYXRhc2V0cyIsImRhdGFBcnJheSIsImRhdGFJbmRleCIsInBvaW50cyIsImJhcnMiLCJzZWdtZW50cyIsInRvb2x0aXBMYWJlbHMiLCJ0b29sdGlwQ29sb3JzIiwibWVkaWFuUG9zaXRpb24iLCJkYXRhQ29sbGVjdGlvbiIsInhNYXgiLCJ5TWF4IiwieE1pbiIsInlNaW4iLCJ4UG9zaXRpb25zIiwieVBvc2l0aW9ucyIsImRhdGFzZXQiLCJoYXNWYWx1ZSIsImZpbGwiLCJfc2F2ZWQiLCJmaWxsQ29sb3IiLCJzdHJva2UiLCJzdHJva2VDb2xvciIsIk11bHRpVG9vbHRpcCIsInhQYWRkaW5nIiwieVBhZGRpbmciLCJ4T2Zmc2V0IiwidGV4dENvbG9yIiwiZm9udFNpemUiLCJ0aXRsZVRleHRDb2xvciIsInRpdGxlRm9udEZhbWlseSIsInRpdGxlRm9udFN0eWxlIiwidGl0bGVGb250U2l6ZSIsImNvcm5lclJhZGl1cyIsImxhYmVscyIsImxlZ2VuZENvbG9ycyIsImxlZ2VuZENvbG9yQmFja2dyb3VuZCIsInRpdGxlIiwiY3VzdG9tIiwiRWxlbWVudCIsInRvb2x0aXBQb3NpdGlvbiIsIlRvb2x0aXAiLCJjYXJldEhlaWdodCIsInRleHQiLCJ0b0Jhc2U2NEltYWdlIiwidG9EYXRhVVJMIiwiQ2hhcnRUeXBlIiwibmFtZSIsImNoYXJ0TmFtZSIsImJhc2VEZWZhdWx0cyIsImNvbmZpZyIsImNvbmZpZ3VyYXRpb24iLCJzYXZlIiwicmVzdG9yZSIsInByb3BzIiwidXBkYXRlIiwibmV3UHJvcHMiLCJ0cmFuc2l0aW9uIiwiZWFzZSIsIlBvaW50IiwiZGlzcGxheSIsImluUmFuZ2UiLCJjaGFydFgiLCJjaGFydFkiLCJoaXREZXRlY3Rpb25SYW5nZSIsImhpdERldGVjdGlvblJhZGl1cyIsImFyYyIsInN0cm9rZVN0eWxlIiwibGluZVdpZHRoIiwic3Ryb2tlV2lkdGgiLCJmaWxsU3R5bGUiLCJBcmMiLCJwb2ludFJlbGF0aXZlUG9zaXRpb24iLCJwb2ludFJlbGF0aXZlQW5nbGUiLCJzdGFydEFuZ2xlIiwiZW5kQW5nbGUiLCJiZXR3ZWVuQW5nbGVzIiwid2l0aGluUmFkaXVzIiwiaW5uZXJSYWRpdXMiLCJvdXRlclJhZGl1cyIsImNlbnRyZUFuZ2xlIiwicmFuZ2VGcm9tQ2VudHJlIiwiYW5pbWF0aW9uUGVyY2VudCIsImxpbmVKb2luIiwic2hvd1N0cm9rZSIsIlJlY3RhbmdsZSIsImhhbGZXaWR0aCIsImxlZnRYIiwicmlnaHRYIiwiaGFsZlN0cm9rZSIsInhBbGlnbiIsInlBbGlnbiIsImNhcmV0UGFkZGluZyIsInRvb2x0aXBXaWR0aCIsInRvb2x0aXBSZWN0SGVpZ2h0IiwidG9vbHRpcEhlaWdodCIsInRvb2x0aXBYIiwidG9vbHRpcFkiLCJ0ZXh0QWxpZ24iLCJ0ZXh0QmFzZWxpbmUiLCJmaWxsVGV4dCIsInRpdGxlRm9udCIsInRpdGxlSGVpZ2h0IiwidGl0bGVXaWR0aCIsImxhYmVsV2lkdGgiLCJsb25nZXN0VGV4dFdpZHRoIiwiaGFsZkhlaWdodCIsImdldExpbmVIZWlnaHQiLCJiYXNlTGluZUhlaWdodCIsImFmdGVyVGl0bGVJbmRleCIsImxhYmVsIiwiZmlsbFJlY3QiLCJTY2FsZSIsImZpdCIsImJ1aWxkWUxhYmVscyIsInlMYWJlbHMiLCJzdGVwRGVjaW1hbFBsYWNlcyIsInRvRml4ZWQiLCJ5TGFiZWxXaWR0aCIsInNob3dMYWJlbHMiLCJhZGRYTGFiZWwiLCJ4TGFiZWxzIiwidmFsdWVzQ291bnQiLCJyZW1vdmVYTGFiZWwiLCJzaGlmdCIsInN0YXJ0UG9pbnQiLCJlbmRQb2ludCIsImNhY2hlZFlMYWJlbFdpZHRoIiwiY2FjaGVkRW5kUG9pbnQiLCJjYWNoZWRIZWlnaHQiLCJjYWxjdWxhdGVZUmFuZ2UiLCJjYWxjdWxhdGVYTGFiZWxSb3RhdGlvbiIsImZpcnN0Um90YXRlZCIsImxhc3RSb3RhdGVkIiwiZmlyc3RXaWR0aCIsImxhc3RXaWR0aCIsInhTY2FsZVBhZGRpbmdSaWdodCIsInhTY2FsZVBhZGRpbmdMZWZ0IiwieExhYmVsUm90YXRpb24iLCJjb3NSb3RhdGlvbiIsIm9yaWdpbmFsTGFiZWxXaWR0aCIsInhMYWJlbFdpZHRoIiwieEdyaWRXaWR0aCIsImNhbGN1bGF0ZVgiLCJkcmF3aW5nQXJlYSIsImNhbGN1bGF0ZVkiLCJzY2FsaW5nRmFjdG9yIiwiaW5uZXJXaWR0aCIsInZhbHVlV2lkdGgiLCJ2YWx1ZU9mZnNldCIsIm9mZnNldEdyaWRMaW5lcyIsInlMYWJlbEdhcCIsInhTdGFydCIsImxhYmVsU3RyaW5nIiwieUxhYmVsQ2VudGVyIiwibGluZVBvc2l0aW9uWSIsImRyYXdIb3Jpem9udGFsTGluZSIsInNob3dIb3Jpem9udGFsTGluZXMiLCJncmlkTGluZVdpZHRoIiwiZ3JpZExpbmVDb2xvciIsImxpbmVDb2xvciIsInhQb3MiLCJsaW5lUG9zIiwiaXNSb3RhdGVkIiwiZHJhd1ZlcnRpY2FsTGluZSIsInNob3dWZXJ0aWNhbExpbmVzIiwidHJhbnNsYXRlIiwicm90YXRlIiwiUmFkaWFsU2NhbGUiLCJzaXplIiwiYmFja2Ryb3BQYWRkaW5nWSIsImNhbGN1bGF0ZUNlbnRlck9mZnNldCIsImxpbmVBcmMiLCJzZXRTY2FsZVNpemUiLCJnZXRDaXJjdW1mZXJlbmNlIiwicG9pbnRQb3NpdGlvbiIsImhhbGZUZXh0V2lkdGgiLCJmdXJ0aGVzdFJpZ2h0SW5kZXgiLCJmdXJ0aGVzdFJpZ2h0QW5nbGUiLCJmdXJ0aGVzdExlZnRJbmRleCIsImZ1cnRoZXN0TGVmdEFuZ2xlIiwieFByb3RydXNpb25MZWZ0IiwieFByb3RydXNpb25SaWdodCIsInJhZGl1c1JlZHVjdGlvblJpZ2h0IiwicmFkaXVzUmVkdWN0aW9uTGVmdCIsImxhcmdlc3RQb3NzaWJsZVJhZGl1cyIsInBvaW50TGFiZWxGb250U2l6ZSIsImZ1cnRoZXN0UmlnaHQiLCJmdXJ0aGVzdExlZnQiLCJwb2ludExhYmVsRm9udFN0eWxlIiwicG9pbnRMYWJlbEZvbnRGYW1pbHkiLCJnZXRQb2ludFBvc2l0aW9uIiwiZ2V0SW5kZXhBbmdsZSIsInNldENlbnRlclBvaW50IiwibGVmdE1vdmVtZW50IiwicmlnaHRNb3ZlbWVudCIsIm1heFJpZ2h0IiwibWF4TGVmdCIsInhDZW50ZXIiLCJ5Q2VudGVyIiwiYW5nbGVNdWx0aXBsaWVyIiwiZGlzdGFuY2VGcm9tQ2VudGVyIiwidGhpc0FuZ2xlIiwieUNlbnRlck9mZnNldCIsInlIZWlnaHQiLCJzaG93TGFiZWxCYWNrZHJvcCIsImJhY2tkcm9wQ29sb3IiLCJiYWNrZHJvcFBhZGRpbmdYIiwiZm9udENvbG9yIiwiYW5nbGVMaW5lV2lkdGgiLCJhbmdsZUxpbmVDb2xvciIsImNlbnRlck9mZnNldCIsIm91dGVyUG9zaXRpb24iLCJhbmdsZUxpbmVJbnRlcnZhbCIsImJhY2tncm91bmRDb2xvcnMiLCJwcmV2aW91c091dGVyUG9zaXRpb24iLCJuZXh0T3V0ZXJQb3NpdGlvbiIsInByZXZpb3VzT3V0ZXJIYWxmd2F5IiwibmV4dE91dGVySGFsZndheSIsInBvaW50TGFiZWxQb3NpdGlvbiIsInBvaW50TGFiZWxGb250Q29sb3IiLCJsYWJlbHNDb3VudCIsImhhbGZMYWJlbHNDb3VudCIsInF1YXJ0ZXJMYWJlbHNDb3VudCIsInVwcGVySGFsZiIsImV4YWN0UXVhcnRlciIsImZyYW1lRHVyYXRpb24iLCJhbmltYXRpb25zIiwiZHJvcEZyYW1lcyIsImRpZ2VzdFdyYXBwZXIiLCJhbmltYXRpb25XcmFwcGVyIiwic3BsaWNlIiwic3RhcnREaWdlc3QiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwiZnJhbWVzVG9Ecm9wIiwiZW5kVGltZSIsImRlbGF5IiwiZnJhbWVEZWxheSIsInRpbWVvdXQiLCJpbnN0YW5jZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJub0NvbmZsaWN0IiwiZGVmYXVsdENvbmZpZyIsInNjYWxlU2hvd0dyaWRMaW5lcyIsInNjYWxlR3JpZExpbmVDb2xvciIsInNjYWxlR3JpZExpbmVXaWR0aCIsInNjYWxlU2hvd0hvcml6b250YWxMaW5lcyIsInNjYWxlU2hvd1ZlcnRpY2FsTGluZXMiLCJiYXJTaG93U3Ryb2tlIiwiYmFyU3Ryb2tlV2lkdGgiLCJiYXJWYWx1ZVNwYWNpbmciLCJiYXJEYXRhc2V0U3BhY2luZyIsIlNjYWxlQ2xhc3MiLCJjYWxjdWxhdGVCYXJYIiwiZGF0YXNldENvdW50IiwiZGF0YXNldEluZGV4IiwiYmFySW5kZXgiLCJ4V2lkdGgiLCJjYWxjdWxhdGVCYXNlV2lkdGgiLCJ4QWJzb2x1dGUiLCJiYXJXaWR0aCIsImNhbGN1bGF0ZUJhcldpZHRoIiwiYmFzZVdpZHRoIiwiYWN0aXZlQmFycyIsInR5cGUiLCJnZXRCYXJzQXRFdmVudCIsImVhY2hCYXJzIiwiYmFyIiwiYWN0aXZlQmFyIiwiaGlnaGxpZ2h0RmlsbCIsImhpZ2hsaWdodFN0cm9rZSIsIkJhckNsYXNzIiwiZGF0YXNldE9iamVjdCIsImRhdGFQb2ludCIsImRhdGFzZXRMYWJlbCIsImJ1aWxkU2NhbGUiLCJhY3RpdmVFbGVtZW50IiwiYmFyc0FycmF5IiwiZXZlbnRQb3NpdGlvbiIsImRhdGFzZXRJdGVyYXRvciIsImRhdGFUb3RhbCIsInNjYWxlT3B0aW9ucyIsImJlZ2luQXRaZXJvIiwiY3VycmVudEhlaWdodCIsInVwZGF0ZWRSYW5nZXMiLCJhZGREYXRhIiwicmVtb3ZlRGF0YSIsIm5ld1NjYWxlUHJvcHMiLCJlYXNpbmdEZWNpbWFsIiwic2VnbWVudFNob3dTdHJva2UiLCJzZWdtZW50U3Ryb2tlQ29sb3IiLCJzZWdtZW50U3Ryb2tlV2lkdGgiLCJwZXJjZW50YWdlSW5uZXJDdXRvdXQiLCJhbmltYXRlUm90YXRlIiwiYW5pbWF0ZVNjYWxlIiwiU2VnbWVudEFyYyIsImFjdGl2ZVNlZ21lbnRzIiwiZ2V0U2VnbWVudHNBdEV2ZW50Iiwic2VnbWVudCIsImFjdGl2ZVNlZ21lbnQiLCJoaWdobGlnaHRDb2xvciIsImNhbGN1bGF0ZVRvdGFsIiwiZGF0YXBvaW50IiwiY29sb3IiLCJzZWdtZW50c0FycmF5IiwibG9jYXRpb24iLCJhdEluZGV4Iiwic2lsZW50IiwidW5kZWZpbmVkIiwiaGlnaGxpZ2h0IiwiY2lyY3VtZmVyZW5jZSIsImNhbGN1bGF0ZUNpcmN1bWZlcmVuY2UiLCJ0b3RhbCIsImluZGV4VG9EZWxldGUiLCJhbmltRGVjaW1hbCIsIkRvdWdobnV0IiwiYmV6aWVyQ3VydmUiLCJiZXppZXJDdXJ2ZVRlbnNpb24iLCJwb2ludERvdCIsInBvaW50RG90UmFkaXVzIiwicG9pbnREb3RTdHJva2VXaWR0aCIsInBvaW50SGl0RGV0ZWN0aW9uUmFkaXVzIiwiZGF0YXNldFN0cm9rZSIsImRhdGFzZXRTdHJva2VXaWR0aCIsImRhdGFzZXRGaWxsIiwiUG9pbnRDbGFzcyIsImFjdGl2ZVBvaW50cyIsImdldFBvaW50c0F0RXZlbnQiLCJlYWNoUG9pbnRzIiwicG9pbnQiLCJhY3RpdmVQb2ludCIsInBvaW50Q29sb3IiLCJwb2ludFN0cm9rZUNvbG9yIiwicG9pbnRIaWdobGlnaHRGaWxsIiwicG9pbnRIaWdobGlnaHRTdHJva2UiLCJwb2ludHNBcnJheSIsIm5leHRQb2ludCIsInByZXZpb3VzUG9pbnQiLCJwb2ludHNXaXRoVmFsdWVzIiwidGVuc2lvbiIsImNvbnRyb2xQb2ludHMiLCJiZXppZXJDdXJ2ZVRvIiwic2NhbGVTaG93TGFiZWxCYWNrZHJvcCIsInNjYWxlQmFja2Ryb3BDb2xvciIsInNjYWxlQmFja2Ryb3BQYWRkaW5nWSIsInNjYWxlQmFja2Ryb3BQYWRkaW5nWCIsInNjYWxlU2hvd0xpbmUiLCJ1cGRhdGVTY2FsZVJhbmdlIiwiZGF0YXBvaW50cyIsInNjYWxlU2l6ZXMiLCJhbmdsZVNob3dMaW5lT3V0IiwiYWN0aXZlUG9pbnRzQ29sbGVjdGlvbiIsIm1vdXNlUG9zaXRpb24iLCJmcm9tQ2VudGVyIiwiYW5nbGVQZXJJbmRleCIsInBvaW50SW5kZXgiLCJzY2FsZUJhY2tncm91bmRDb2xvcnMiLCJ0b3RhbERhdGFBcnJheSJdLCJtYXBwaW5ncyI6IkNBV0EsV0FFQyxZQUdBLElBQUlBLEdBQU9DLEtBQ1ZDLEVBQVdGLEVBQUtHLE1BR2JBLEVBQVEsU0FBU0MsR0FFcEJILEtBQUtJLE9BQVNELEVBQVFDLE9BRXRCSixLQUFLSyxJQUFNRixDQUdYLElBQUlHLEdBQW1CLFNBQVNDLEVBQVFDLEdBRXZDLE1BQUlELEdBQVEsU0FBU0MsR0FFYkQsRUFBUSxTQUFTQyxHQUlqQkMsU0FBU0MsWUFBWUMsaUJBQWlCSixHQUFTSyxpQkFBaUJKLEdBSTdEUixNQUFLYSxNQUFRUCxFQUFpQkgsRUFBUUMsT0FBTyxVQUFZRCxFQUFRQyxPQUFPUyxNQUN2RWIsS0FBS2MsT0FBU1IsRUFBaUJILEVBQVFDLE9BQU8sV0FBYUQsRUFBUUMsT0FBT1UsTUFNdkYsT0FKQWQsTUFBS2UsWUFBY2YsS0FBS2EsTUFBUWIsS0FBS2MsT0FFckNFLEVBQVFDLFlBQVlqQixNQUViQSxLQUdSRSxHQUFNZ0IsVUFDTEMsUUFFQ0MsV0FBVyxFQUdYQyxlQUFnQixHQUdoQkMsZ0JBQWlCLGVBR2pCQyxXQUFXLEVBR1hDLGVBQWUsRUFJZkMsV0FBWSxLQUVaQyxlQUFnQixLQUVoQkMsZ0JBQWlCLEtBR2pCQyxlQUFnQixpQkFHaEJDLGVBQWdCLEVBR2hCQyxpQkFBaUIsRUFHakJDLFdBQVksYUFHWkMsbUJBQW1CLEVBR25CQyxrQkFBa0IsRUFHbEJDLGdCQUFpQixxREFHakJDLGNBQWUsR0FHZkMsZUFB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R0FHekJuSixFQUFJNlUsT0FBTzZXLEVBQU16aUIsRUFBRXlpQixFQUFNdmlCLElBRXpCeEosTUFDRkssRUFBSStVLFlBQ0ovVSxFQUFJbVksU0FFSm5ZLEVBQUlvYixVQUFZdEQsRUFBUUksVUFDckJ2WSxLQUFLdVYsUUFBUW1XLGFBQ2ZyckIsRUFBSWdZLE9BS0xyWCxFQUFRa0QsS0FBS2lVLEVBQVFiLE9BQU8sU0FBU3lVLEdBQ2hDQSxFQUFNM1QsWUFDVDJULEVBQU0xVixVQUlQclcsVUFVRjBFLEtBQUsxRSIsImZpbGUiOiJjaGFydC1kZWJ1Zy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogQ2hhcnQuanNcbiAqIGh0dHA6Ly9jaGFydGpzLm9yZy9cbiAqIFZlcnNpb246IDEuMS4xXG4gKlxuICogQ29weXJpZ2h0IDIwMTUgTmljayBEb3duaWVcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogaHR0cHM6Ly9naXRodWIuY29tL25ubmljay9DaGFydC5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuXG4oZnVuY3Rpb24oKXtcblxuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL0RlY2xhcmUgcm9vdCB2YXJpYWJsZSAtIHdpbmRvdyBpbiB0aGUgYnJvd3NlciwgZ2xvYmFsIG9uIHRoZSBzZXJ2ZXJcblx0dmFyIHJvb3QgPSB0aGlzLFxuXHRcdHByZXZpb3VzID0gcm9vdC5DaGFydDtcblxuXHQvL09jY3VweSB0aGUgZ2xvYmFsIHZhcmlhYmxlIG9mIENoYXJ0LCBhbmQgY3JlYXRlIGEgc2ltcGxlIGJhc2UgY2xhc3Ncblx0dmFyIENoYXJ0ID0gZnVuY3Rpb24oY29udGV4dCl7XG5cdFx0dmFyIGNoYXJ0ID0gdGhpcztcblx0XHR0aGlzLmNhbnZhcyA9IGNvbnRleHQuY2FudmFzO1xuXG5cdFx0dGhpcy5jdHggPSBjb250ZXh0O1xuXG5cdFx0Ly9WYXJpYWJsZXMgZ2xvYmFsIHRvIHRoZSBjaGFydFxuXHRcdHZhciBjb21wdXRlRGltZW5zaW9uID0gZnVuY3Rpb24oZWxlbWVudCxkaW1lbnNpb24pXG5cdFx0e1xuXHRcdFx0aWYgKGVsZW1lbnRbJ29mZnNldCcrZGltZW5zaW9uXSlcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGVsZW1lbnRbJ29mZnNldCcrZGltZW5zaW9uXTtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkuZ2V0UHJvcGVydHlWYWx1ZShkaW1lbnNpb24pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgd2lkdGggPSB0aGlzLndpZHRoID0gY29tcHV0ZURpbWVuc2lvbihjb250ZXh0LmNhbnZhcywnV2lkdGgnKSB8fCBjb250ZXh0LmNhbnZhcy53aWR0aDtcblx0XHR2YXIgaGVpZ2h0ID0gdGhpcy5oZWlnaHQgPSBjb21wdXRlRGltZW5zaW9uKGNvbnRleHQuY2FudmFzLCdIZWlnaHQnKSB8fCBjb250ZXh0LmNhbnZhcy5oZWlnaHQ7XG5cblx0XHR0aGlzLmFzcGVjdFJhdGlvID0gdGhpcy53aWR0aCAvIHRoaXMuaGVpZ2h0O1xuXHRcdC8vSGlnaCBwaXhlbCBkZW5zaXR5IGRpc3BsYXlzIC0gbXVsdGlwbHkgdGhlIHNpemUgb2YgdGhlIGNhbnZhcyBoZWlnaHQvd2lkdGggYnkgdGhlIGRldmljZSBwaXhlbCByYXRpbywgdGhlbiBzY2FsZS5cblx0XHRoZWxwZXJzLnJldGluYVNjYWxlKHRoaXMpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cdC8vR2xvYmFsbHkgZXhwb3NlIHRoZSBkZWZhdWx0cyB0byBhbGxvdyBmb3IgdXNlciB1cGRhdGluZy9jaGFuZ2luZ1xuXHRDaGFydC5kZWZhdWx0cyA9IHtcblx0XHRnbG9iYWw6IHtcblx0XHRcdC8vIEJvb2xlYW4gLSBXaGV0aGVyIHRvIGFuaW1hdGUgdGhlIGNoYXJ0XG5cdFx0XHRhbmltYXRpb246IHRydWUsXG5cblx0XHRcdC8vIE51bWJlciAtIE51bWJlciBvZiBhbmltYXRpb24gc3RlcHNcblx0XHRcdGFuaW1hdGlvblN0ZXBzOiA2MCxcblxuXHRcdFx0Ly8gU3RyaW5nIC0gQW5pbWF0aW9uIGVhc2luZyBlZmZlY3Rcblx0XHRcdGFuaW1hdGlvbkVhc2luZzogXCJlYXNlT3V0UXVhcnRcIixcblxuXHRcdFx0Ly8gQm9vbGVhbiAtIElmIHdlIHNob3VsZCBzaG93IHRoZSBzY2FsZSBhdCBhbGxcblx0XHRcdHNob3dTY2FsZTogdHJ1ZSxcblxuXHRcdFx0Ly8gQm9vbGVhbiAtIElmIHdlIHdhbnQgdG8gb3ZlcnJpZGUgd2l0aCBhIGhhcmQgY29kZWQgc2NhbGVcblx0XHRcdHNjYWxlT3ZlcnJpZGU6IGZhbHNlLFxuXG5cdFx0XHQvLyAqKiBSZXF1aXJlZCBpZiBzY2FsZU92ZXJyaWRlIGlzIHRydWUgKipcblx0XHRcdC8vIE51bWJlciAtIFRoZSBudW1iZXIgb2Ygc3RlcHMgaW4gYSBoYXJkIGNvZGVkIHNjYWxlXG5cdFx0XHRzY2FsZVN0ZXBzOiBudWxsLFxuXHRcdFx0Ly8gTnVtYmVyIC0gVGhlIHZhbHVlIGp1bXAgaW4gdGhlIGhhcmQgY29kZWQgc2NhbGVcblx0XHRcdHNjYWxlU3RlcFdpZHRoOiBudWxsLFxuXHRcdFx0Ly8gTnVtYmVyIC0gVGhlIHNjYWxlIHN0YXJ0aW5nIHZhbHVlXG5cdFx0XHRzY2FsZVN0YXJ0VmFsdWU6IG51bGwsXG5cblx0XHRcdC8vIFN0cmluZyAtIENvbG91ciBvZiB0aGUgc2NhbGUgbGluZVxuXHRcdFx0c2NhbGVMaW5lQ29sb3I6IFwicmdiYSgwLDAsMCwuMSlcIixcblxuXHRcdFx0Ly8gTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgdGhlIHNjYWxlIGxpbmVcblx0XHRcdHNjYWxlTGluZVdpZHRoOiAxLFxuXG5cdFx0XHQvLyBCb29sZWFuIC0gV2hldGhlciB0byBzaG93IGxhYmVscyBvbiB0aGUgc2NhbGVcblx0XHRcdHNjYWxlU2hvd0xhYmVsczogdHJ1ZSxcblxuXHRcdFx0Ly8gSW50ZXJwb2xhdGVkIEpTIHN0cmluZyAtIGNhbiBhY2Nlc3MgdmFsdWVcblx0XHRcdHNjYWxlTGFiZWw6IFwiPCU9dmFsdWUlPlwiLFxuXG5cdFx0XHQvLyBCb29sZWFuIC0gV2hldGhlciB0aGUgc2NhbGUgc2hvdWxkIHN0aWNrIHRvIGludGVnZXJzLCBhbmQgbm90IHNob3cgYW55IGZsb2F0cyBldmVuIGlmIGRyYXdpbmcgc3BhY2UgaXMgdGhlcmVcblx0XHRcdHNjYWxlSW50ZWdlcnNPbmx5OiB0cnVlLFxuXG5cdFx0XHQvLyBCb29sZWFuIC0gV2hldGhlciB0aGUgc2NhbGUgc2hvdWxkIHN0YXJ0IGF0IHplcm8sIG9yIGFuIG9yZGVyIG9mIG1hZ25pdHVkZSBkb3duIGZyb20gdGhlIGxvd2VzdCB2YWx1ZVxuXHRcdFx0c2NhbGVCZWdpbkF0WmVybzogZmFsc2UsXG5cblx0XHRcdC8vIFN0cmluZyAtIFNjYWxlIGxhYmVsIGZvbnQgZGVjbGFyYXRpb24gZm9yIHRoZSBzY2FsZSBsYWJlbFxuXHRcdFx0c2NhbGVGb250RmFtaWx5OiBcIidIZWx2ZXRpY2EgTmV1ZScsICdIZWx2ZXRpY2EnLCAnQXJpYWwnLCBzYW5zLXNlcmlmXCIsXG5cblx0XHRcdC8vIE51bWJlciAtIFNjYWxlIGxhYmVsIGZvbnQgc2l6ZSBpbiBwaXhlbHNcblx0XHRcdHNjYWxlRm9udFNpemU6IDEyLFxuXG5cdFx0XHQvLyBTdHJpbmcgLSBTY2FsZSBsYWJlbCBmb250IHdlaWdodCBzdHlsZVxuXHRcdFx0c2NhbGVGb250U3R5bGU6IFwibm9ybWFsXCIsXG5cblx0XHRcdC8vIFN0cmluZyAtIFNjYWxlIGxhYmVsIGZvbnQgY29sb3VyXG5cdFx0XHRzY2FsZUZvbnRDb2xvcjogXCIjNjY2XCIsXG5cblx0XHRcdC8vIEJvb2xlYW4gLSB3aGV0aGVyIG9yIG5vdCB0aGUgY2hhcnQgc2hvdWxkIGJlIHJlc3BvbnNpdmUgYW5kIHJlc2l6ZSB3aGVuIHRoZSBicm93c2VyIGRvZXMuXG5cdFx0XHRyZXNwb25zaXZlOiBmYWxzZSxcblxuXHRcdFx0Ly8gQm9vbGVhbiAtIHdoZXRoZXIgdG8gbWFpbnRhaW4gdGhlIHN0YXJ0aW5nIGFzcGVjdCByYXRpbyBvciBub3Qgd2hlbiByZXNwb25zaXZlLCBpZiBzZXQgdG8gZmFsc2UsIHdpbGwgdGFrZSB1cCBlbnRpcmUgY29udGFpbmVyXG5cdFx0XHRtYWludGFpbkFzcGVjdFJhdGlvOiB0cnVlLFxuXG5cdFx0XHQvLyBCb29sZWFuIC0gRGV0ZXJtaW5lcyB3aGV0aGVyIHRvIGRyYXcgdG9vbHRpcHMgb24gdGhlIGNhbnZhcyBvciBub3QgLSBhdHRhY2hlcyBldmVudHMgdG8gdG91Y2htb3ZlICYgbW91c2Vtb3ZlXG5cdFx0XHRzaG93VG9vbHRpcHM6IHRydWUsXG5cblx0XHRcdC8vIEJvb2xlYW4gLSBEZXRlcm1pbmVzIHdoZXRoZXIgdG8gZHJhdyBidWlsdC1pbiB0b29sdGlwIG9yIGNhbGwgY3VzdG9tIHRvb2x0aXAgZnVuY3Rpb25cblx0XHRcdGN1c3RvbVRvb2x0aXBzOiBmYWxzZSxcblxuXHRcdFx0Ly8gQXJyYXkgLSBBcnJheSBvZiBzdHJpbmcgbmFtZXMgdG8gYXR0YWNoIHRvb2x0aXAgZXZlbnRzXG5cdFx0XHR0b29sdGlwRXZlbnRzOiBbXCJtb3VzZW1vdmVcIiwgXCJ0b3VjaHN0YXJ0XCIsIFwidG91Y2htb3ZlXCIsIFwibW91c2VvdXRcIl0sXG5cblx0XHRcdC8vIFN0cmluZyAtIFRvb2x0aXAgYmFja2dyb3VuZCBjb2xvdXJcblx0XHRcdHRvb2x0aXBGaWxsQ29sb3I6IFwicmdiYSgwLDAsMCwwLjgpXCIsXG5cblx0XHRcdC8vIFN0cmluZyAtIFRvb2x0aXAgbGFiZWwgZm9udCBkZWNsYXJhdGlvbiBmb3IgdGhlIHNjYWxlIGxhYmVsXG5cdFx0XHR0b29sdGlwRm9udEZhbWlseTogXCInSGVsdmV0aWNhIE5ldWUnLCAnSGVsdmV0aWNhJywgJ0FyaWFsJywgc2Fucy1zZXJpZlwiLFxuXG5cdFx0XHQvLyBOdW1iZXIgLSBUb29sdGlwIGxhYmVsIGZvbnQgc2l6ZSBpbiBwaXhlbHNcblx0XHRcdHRvb2x0aXBGb250U2l6ZTogMTQsXG5cblx0XHRcdC8vIFN0cmluZyAtIFRvb2x0aXAgZm9udCB3ZWlnaHQgc3R5bGVcblx0XHRcdHRvb2x0aXBGb250U3R5bGU6IFwibm9ybWFsXCIsXG5cblx0XHRcdC8vIFN0cmluZyAtIFRvb2x0aXAgbGFiZWwgZm9udCBjb2xvdXJcblx0XHRcdHRvb2x0aXBGb250Q29sb3I6IFwiI2ZmZlwiLFxuXG5cdFx0XHQvLyBTdHJpbmcgLSBUb29sdGlwIHRpdGxlIGZvbnQgZGVjbGFyYXRpb24gZm9yIHRoZSBzY2FsZSBsYWJlbFxuXHRcdFx0dG9vbHRpcFRpdGxlRm9udEZhbWlseTogXCInSGVsdmV0aWNhIE5ldWUnLCAnSGVsdmV0aWNhJywgJ0FyaWFsJywgc2Fucy1zZXJpZlwiLFxuXG5cdFx0XHQvLyBOdW1iZXIgLSBUb29sdGlwIHRpdGxlIGZvbnQgc2l6ZSBpbiBwaXhlbHNcblx0XHRcdHRvb2x0aXBUaXRsZUZvbnRTaXplOiAxNCxcblxuXHRcdFx0Ly8gU3RyaW5nIC0gVG9vbHRpcCB0aXRsZSBmb250IHdlaWdodCBzdHlsZVxuXHRcdFx0dG9vbHRpcFRpdGxlRm9udFN0eWxlOiBcImJvbGRcIixcblxuXHRcdFx0Ly8gU3RyaW5nIC0gVG9vbHRpcCB0aXRsZSBmb250IGNvbG91clxuXHRcdFx0dG9vbHRpcFRpdGxlRm9udENvbG9yOiBcIiNmZmZcIixcblxuXHRcdFx0Ly8gU3RyaW5nIC0gVG9vbHRpcCB0aXRsZSB0ZW1wbGF0ZVxuXHRcdFx0dG9vbHRpcFRpdGxlVGVtcGxhdGU6IFwiPCU9IGxhYmVsJT5cIixcblxuXHRcdFx0Ly8gTnVtYmVyIC0gcGl4ZWwgd2lkdGggb2YgcGFkZGluZyBhcm91bmQgdG9vbHRpcCB0ZXh0XG5cdFx0XHR0b29sdGlwWVBhZGRpbmc6IDYsXG5cblx0XHRcdC8vIE51bWJlciAtIHBpeGVsIHdpZHRoIG9mIHBhZGRpbmcgYXJvdW5kIHRvb2x0aXAgdGV4dFxuXHRcdFx0dG9vbHRpcFhQYWRkaW5nOiA2LFxuXG5cdFx0XHQvLyBOdW1iZXIgLSBTaXplIG9mIHRoZSBjYXJldCBvbiB0aGUgdG9vbHRpcFxuXHRcdFx0dG9vbHRpcENhcmV0U2l6ZTogOCxcblxuXHRcdFx0Ly8gTnVtYmVyIC0gUGl4ZWwgcmFkaXVzIG9mIHRoZSB0b29sdGlwIGJvcmRlclxuXHRcdFx0dG9vbHRpcENvcm5lclJhZGl1czogNixcblxuXHRcdFx0Ly8gTnVtYmVyIC0gUGl4ZWwgb2Zmc2V0IGZyb20gcG9pbnQgeCB0byB0b29sdGlwIGVkZ2Vcblx0XHRcdHRvb2x0aXBYT2Zmc2V0OiAxMCxcblxuXHRcdFx0Ly8gU3RyaW5nIC0gVGVtcGxhdGUgc3RyaW5nIGZvciBzaW5nbGUgdG9vbHRpcHNcblx0XHRcdHRvb2x0aXBUZW1wbGF0ZTogXCI8JWlmIChsYWJlbCl7JT48JT1sYWJlbCU+OiA8JX0lPjwlPSB2YWx1ZSAlPlwiLFxuXG5cdFx0XHQvLyBTdHJpbmcgLSBUZW1wbGF0ZSBzdHJpbmcgZm9yIHNpbmdsZSB0b29sdGlwc1xuXHRcdFx0bXVsdGlUb29sdGlwVGVtcGxhdGU6IFwiPCU9IGRhdGFzZXRMYWJlbCAlPjogPCU9IHZhbHVlICU+XCIsXG5cblx0XHRcdC8vIFN0cmluZyAtIENvbG91ciBiZWhpbmQgdGhlIGxlZ2VuZCBjb2xvdXIgYmxvY2tcblx0XHRcdG11bHRpVG9vbHRpcEtleUJhY2tncm91bmQ6ICcjZmZmJyxcblxuXHRcdFx0Ly8gQXJyYXkgLSBBIGxpc3Qgb2YgY29sb3JzIHRvIHVzZSBhcyB0aGUgZGVmYXVsdHNcblx0XHRcdHNlZ21lbnRDb2xvckRlZmF1bHQ6IFtcIiNBNkNFRTNcIiwgXCIjMUY3OEI0XCIsIFwiI0IyREY4QVwiLCBcIiMzM0EwMkNcIiwgXCIjRkI5QTk5XCIsIFwiI0UzMUExQ1wiLCBcIiNGREJGNkZcIiwgXCIjRkY3RjAwXCIsIFwiI0NBQjJENlwiLCBcIiM2QTNEOUFcIiwgXCIjQjRCNDgyXCIsIFwiI0IxNTkyOFwiIF0sXG5cblx0XHRcdC8vIEFycmF5IC0gQSBsaXN0IG9mIGhpZ2hsaWdodCBjb2xvcnMgdG8gdXNlIGFzIHRoZSBkZWZhdWx0c1xuXHRcdFx0c2VnbWVudEhpZ2hsaWdodENvbG9yRGVmYXVsdHM6IFsgXCIjQ0VGNkZGXCIsIFwiIzQ3QTBEQ1wiLCBcIiNEQUZGQjJcIiwgXCIjNUJDODU0XCIsIFwiI0ZGQzJDMVwiLCBcIiNGRjQyNDRcIiwgXCIjRkZFNzk3XCIsIFwiI0ZGQTcyOFwiLCBcIiNGMkRBRkVcIiwgXCIjOTI2NUMyXCIsIFwiI0RDRENBQVwiLCBcIiNEOTgxNTBcIiBdLFxuXG5cdFx0XHQvLyBGdW5jdGlvbiAtIFdpbGwgZmlyZSBvbiBhbmltYXRpb24gcHJvZ3Jlc3Npb24uXG5cdFx0XHRvbkFuaW1hdGlvblByb2dyZXNzOiBmdW5jdGlvbigpe30sXG5cblx0XHRcdC8vIEZ1bmN0aW9uIC0gV2lsbCBmaXJlIG9uIGFuaW1hdGlvbiBjb21wbGV0aW9uLlxuXHRcdFx0b25BbmltYXRpb25Db21wbGV0ZTogZnVuY3Rpb24oKXt9XG5cblx0XHR9XG5cdH07XG5cblx0Ly9DcmVhdGUgYSBkaWN0aW9uYXJ5IG9mIGNoYXJ0IHR5cGVzLCB0byBhbGxvdyBmb3IgZXh0ZW5zaW9uIG9mIGV4aXN0aW5nIHR5cGVzXG5cdENoYXJ0LnR5cGVzID0ge307XG5cblx0Ly9HbG9iYWwgQ2hhcnQgaGVscGVycyBvYmplY3QgZm9yIHV0aWxpdHkgbWV0aG9kcyBhbmQgY2xhc3Nlc1xuXHR2YXIgaGVscGVycyA9IENoYXJ0LmhlbHBlcnMgPSB7fTtcblxuXHRcdC8vLS0gQmFzaWMganMgdXRpbGl0eSBtZXRob2RzXG5cdHZhciBlYWNoID0gaGVscGVycy5lYWNoID0gZnVuY3Rpb24obG9vcGFibGUsY2FsbGJhY2ssc2VsZil7XG5cdFx0XHR2YXIgYWRkaXRpb25hbEFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDMpO1xuXHRcdFx0Ly8gQ2hlY2sgdG8gc2VlIGlmIG51bGwgb3IgdW5kZWZpbmVkIGZpcnN0bHkuXG5cdFx0XHRpZiAobG9vcGFibGUpe1xuXHRcdFx0XHRpZiAobG9vcGFibGUubGVuZ3RoID09PSArbG9vcGFibGUubGVuZ3RoKXtcblx0XHRcdFx0XHR2YXIgaTtcblx0XHRcdFx0XHRmb3IgKGk9MDsgaTxsb29wYWJsZS5sZW5ndGg7IGkrKyl7XG5cdFx0XHRcdFx0XHRjYWxsYmFjay5hcHBseShzZWxmLFtsb29wYWJsZVtpXSwgaV0uY29uY2F0KGFkZGl0aW9uYWxBcmdzKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaXRlbSBpbiBsb29wYWJsZSl7XG5cdFx0XHRcdFx0XHRjYWxsYmFjay5hcHBseShzZWxmLFtsb29wYWJsZVtpdGVtXSxpdGVtXS5jb25jYXQoYWRkaXRpb25hbEFyZ3MpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdGNsb25lID0gaGVscGVycy5jbG9uZSA9IGZ1bmN0aW9uKG9iail7XG5cdFx0XHR2YXIgb2JqQ2xvbmUgPSB7fTtcblx0XHRcdGVhY2gob2JqLGZ1bmN0aW9uKHZhbHVlLGtleSl7XG5cdFx0XHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSl7XG5cdFx0XHRcdFx0b2JqQ2xvbmVba2V5XSA9IHZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBvYmpDbG9uZTtcblx0XHR9LFxuXHRcdGV4dGVuZCA9IGhlbHBlcnMuZXh0ZW5kID0gZnVuY3Rpb24oYmFzZSl7XG5cdFx0XHRlYWNoKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywxKSwgZnVuY3Rpb24oZXh0ZW5zaW9uT2JqZWN0KSB7XG5cdFx0XHRcdGVhY2goZXh0ZW5zaW9uT2JqZWN0LGZ1bmN0aW9uKHZhbHVlLGtleSl7XG5cdFx0XHRcdFx0aWYgKGV4dGVuc2lvbk9iamVjdC5oYXNPd25Qcm9wZXJ0eShrZXkpKXtcblx0XHRcdFx0XHRcdGJhc2Vba2V5XSA9IHZhbHVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBiYXNlO1xuXHRcdH0sXG5cdFx0bWVyZ2UgPSBoZWxwZXJzLm1lcmdlID0gZnVuY3Rpb24oYmFzZSxtYXN0ZXIpe1xuXHRcdFx0Ly9NZXJnZSBwcm9wZXJ0aWVzIGluIGxlZnQgb2JqZWN0IG92ZXIgdG8gYSBzaGFsbG93IGNsb25lIG9mIG9iamVjdCByaWdodC5cblx0XHRcdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLDApO1xuXHRcdFx0YXJncy51bnNoaWZ0KHt9KTtcblx0XHRcdHJldHVybiBleHRlbmQuYXBwbHkobnVsbCwgYXJncyk7XG5cdFx0fSxcblx0XHRpbmRleE9mID0gaGVscGVycy5pbmRleE9mID0gZnVuY3Rpb24oYXJyYXlUb1NlYXJjaCwgaXRlbSl7XG5cdFx0XHRpZiAoQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcblx0XHRcdFx0cmV0dXJuIGFycmF5VG9TZWFyY2guaW5kZXhPZihpdGVtKTtcblx0XHRcdH1cblx0XHRcdGVsc2V7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlUb1NlYXJjaC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGlmIChhcnJheVRvU2VhcmNoW2ldID09PSBpdGVtKSByZXR1cm4gaTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHR3aGVyZSA9IGhlbHBlcnMud2hlcmUgPSBmdW5jdGlvbihjb2xsZWN0aW9uLCBmaWx0ZXJDYWxsYmFjayl7XG5cdFx0XHR2YXIgZmlsdGVyZWQgPSBbXTtcblxuXHRcdFx0aGVscGVycy5lYWNoKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKGl0ZW0pe1xuXHRcdFx0XHRpZiAoZmlsdGVyQ2FsbGJhY2soaXRlbSkpe1xuXHRcdFx0XHRcdGZpbHRlcmVkLnB1c2goaXRlbSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gZmlsdGVyZWQ7XG5cdFx0fSxcblx0XHRmaW5kTmV4dFdoZXJlID0gaGVscGVycy5maW5kTmV4dFdoZXJlID0gZnVuY3Rpb24oYXJyYXlUb1NlYXJjaCwgZmlsdGVyQ2FsbGJhY2ssIHN0YXJ0SW5kZXgpe1xuXHRcdFx0Ly8gRGVmYXVsdCB0byBzdGFydCBvZiB0aGUgYXJyYXlcblx0XHRcdGlmICghc3RhcnRJbmRleCl7XG5cdFx0XHRcdHN0YXJ0SW5kZXggPSAtMTtcblx0XHRcdH1cblx0XHRcdGZvciAodmFyIGkgPSBzdGFydEluZGV4ICsgMTsgaSA8IGFycmF5VG9TZWFyY2gubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dmFyIGN1cnJlbnRJdGVtID0gYXJyYXlUb1NlYXJjaFtpXTtcblx0XHRcdFx0aWYgKGZpbHRlckNhbGxiYWNrKGN1cnJlbnRJdGVtKSl7XG5cdFx0XHRcdFx0cmV0dXJuIGN1cnJlbnRJdGVtO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRmaW5kUHJldmlvdXNXaGVyZSA9IGhlbHBlcnMuZmluZFByZXZpb3VzV2hlcmUgPSBmdW5jdGlvbihhcnJheVRvU2VhcmNoLCBmaWx0ZXJDYWxsYmFjaywgc3RhcnRJbmRleCl7XG5cdFx0XHQvLyBEZWZhdWx0IHRvIGVuZCBvZiB0aGUgYXJyYXlcblx0XHRcdGlmICghc3RhcnRJbmRleCl7XG5cdFx0XHRcdHN0YXJ0SW5kZXggPSBhcnJheVRvU2VhcmNoLmxlbmd0aDtcblx0XHRcdH1cblx0XHRcdGZvciAodmFyIGkgPSBzdGFydEluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0dmFyIGN1cnJlbnRJdGVtID0gYXJyYXlUb1NlYXJjaFtpXTtcblx0XHRcdFx0aWYgKGZpbHRlckNhbGxiYWNrKGN1cnJlbnRJdGVtKSl7XG5cdFx0XHRcdFx0cmV0dXJuIGN1cnJlbnRJdGVtO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRpbmhlcml0cyA9IGhlbHBlcnMuaW5oZXJpdHMgPSBmdW5jdGlvbihleHRlbnNpb25zKXtcblx0XHRcdC8vQmFzaWMgamF2YXNjcmlwdCBpbmhlcml0YW5jZSBiYXNlZCBvbiB0aGUgbW9kZWwgY3JlYXRlZCBpbiBCYWNrYm9uZS5qc1xuXHRcdFx0dmFyIHBhcmVudCA9IHRoaXM7XG5cdFx0XHR2YXIgQ2hhcnRFbGVtZW50ID0gKGV4dGVuc2lvbnMgJiYgZXh0ZW5zaW9ucy5oYXNPd25Qcm9wZXJ0eShcImNvbnN0cnVjdG9yXCIpKSA/IGV4dGVuc2lvbnMuY29uc3RydWN0b3IgOiBmdW5jdGlvbigpeyByZXR1cm4gcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG5cblx0XHRcdHZhciBTdXJyb2dhdGUgPSBmdW5jdGlvbigpeyB0aGlzLmNvbnN0cnVjdG9yID0gQ2hhcnRFbGVtZW50O307XG5cdFx0XHRTdXJyb2dhdGUucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTtcblx0XHRcdENoYXJ0RWxlbWVudC5wcm90b3R5cGUgPSBuZXcgU3Vycm9nYXRlKCk7XG5cblx0XHRcdENoYXJ0RWxlbWVudC5leHRlbmQgPSBpbmhlcml0cztcblxuXHRcdFx0aWYgKGV4dGVuc2lvbnMpIGV4dGVuZChDaGFydEVsZW1lbnQucHJvdG90eXBlLCBleHRlbnNpb25zKTtcblxuXHRcdFx0Q2hhcnRFbGVtZW50Ll9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7XG5cblx0XHRcdHJldHVybiBDaGFydEVsZW1lbnQ7XG5cdFx0fSxcblx0XHRub29wID0gaGVscGVycy5ub29wID0gZnVuY3Rpb24oKXt9LFxuXHRcdHVpZCA9IGhlbHBlcnMudWlkID0gKGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgaWQ9MDtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHRyZXR1cm4gXCJjaGFydC1cIiArIGlkKys7XG5cdFx0XHR9O1xuXHRcdH0pKCksXG5cdFx0d2FybiA9IGhlbHBlcnMud2FybiA9IGZ1bmN0aW9uKHN0cil7XG5cdFx0XHQvL01ldGhvZCBmb3Igd2FybmluZyBvZiBlcnJvcnNcblx0XHRcdGlmICh3aW5kb3cuY29uc29sZSAmJiB0eXBlb2Ygd2luZG93LmNvbnNvbGUud2FybiA9PT0gXCJmdW5jdGlvblwiKSBjb25zb2xlLndhcm4oc3RyKTtcblx0XHR9LFxuXHRcdGFtZCA9IGhlbHBlcnMuYW1kID0gKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCksXG5cdFx0Ly8tLSBNYXRoIG1ldGhvZHNcblx0XHRpc051bWJlciA9IGhlbHBlcnMuaXNOdW1iZXIgPSBmdW5jdGlvbihuKXtcblx0XHRcdHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG5cdFx0fSxcblx0XHRtYXggPSBoZWxwZXJzLm1heCA9IGZ1bmN0aW9uKGFycmF5KXtcblx0XHRcdHJldHVybiBNYXRoLm1heC5hcHBseSggTWF0aCwgYXJyYXkgKTtcblx0XHR9LFxuXHRcdG1pbiA9IGhlbHBlcnMubWluID0gZnVuY3Rpb24oYXJyYXkpe1xuXHRcdFx0cmV0dXJuIE1hdGgubWluLmFwcGx5KCBNYXRoLCBhcnJheSApO1xuXHRcdH0sXG5cdFx0Y2FwID0gaGVscGVycy5jYXAgPSBmdW5jdGlvbih2YWx1ZVRvQ2FwLG1heFZhbHVlLG1pblZhbHVlKXtcblx0XHRcdGlmKGlzTnVtYmVyKG1heFZhbHVlKSkge1xuXHRcdFx0XHRpZiggdmFsdWVUb0NhcCA+IG1heFZhbHVlICkge1xuXHRcdFx0XHRcdHJldHVybiBtYXhWYWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZihpc051bWJlcihtaW5WYWx1ZSkpe1xuXHRcdFx0XHRpZiAoIHZhbHVlVG9DYXAgPCBtaW5WYWx1ZSApe1xuXHRcdFx0XHRcdHJldHVybiBtaW5WYWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHZhbHVlVG9DYXA7XG5cdFx0fSxcblx0XHRnZXREZWNpbWFsUGxhY2VzID0gaGVscGVycy5nZXREZWNpbWFsUGxhY2VzID0gZnVuY3Rpb24obnVtKXtcblx0XHRcdGlmIChudW0lMSE9PTAgJiYgaXNOdW1iZXIobnVtKSl7XG5cdFx0XHRcdHZhciBzID0gbnVtLnRvU3RyaW5nKCk7XG5cdFx0XHRcdGlmKHMuaW5kZXhPZihcImUtXCIpIDwgMCl7XG5cdFx0XHRcdFx0Ly8gbm8gZXhwb25lbnQsIGUuZy4gMC4wMVxuXHRcdFx0XHRcdHJldHVybiBzLnNwbGl0KFwiLlwiKVsxXS5sZW5ndGg7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZihzLmluZGV4T2YoXCIuXCIpIDwgMCkge1xuXHRcdFx0XHRcdC8vIG5vIGRlY2ltYWwgcG9pbnQsIGUuZy4gMWUtOVxuXHRcdFx0XHRcdHJldHVybiBwYXJzZUludChzLnNwbGl0KFwiZS1cIilbMV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdC8vIGV4cG9uZW50IGFuZCBkZWNpbWFsIHBvaW50LCBlLmcuIDEuMjNlLTlcblx0XHRcdFx0XHR2YXIgcGFydHMgPSBzLnNwbGl0KFwiLlwiKVsxXS5zcGxpdChcImUtXCIpO1xuXHRcdFx0XHRcdHJldHVybiBwYXJ0c1swXS5sZW5ndGggKyBwYXJzZUludChwYXJ0c1sxXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHRvUmFkaWFucyA9IGhlbHBlcnMucmFkaWFucyA9IGZ1bmN0aW9uKGRlZ3JlZXMpe1xuXHRcdFx0cmV0dXJuIGRlZ3JlZXMgKiAoTWF0aC5QSS8xODApO1xuXHRcdH0sXG5cdFx0Ly8gR2V0cyB0aGUgYW5nbGUgZnJvbSB2ZXJ0aWNhbCB1cHJpZ2h0IHRvIHRoZSBwb2ludCBhYm91dCBhIGNlbnRyZS5cblx0XHRnZXRBbmdsZUZyb21Qb2ludCA9IGhlbHBlcnMuZ2V0QW5nbGVGcm9tUG9pbnQgPSBmdW5jdGlvbihjZW50cmVQb2ludCwgYW5nbGVQb2ludCl7XG5cdFx0XHR2YXIgZGlzdGFuY2VGcm9tWENlbnRlciA9IGFuZ2xlUG9pbnQueCAtIGNlbnRyZVBvaW50LngsXG5cdFx0XHRcdGRpc3RhbmNlRnJvbVlDZW50ZXIgPSBhbmdsZVBvaW50LnkgLSBjZW50cmVQb2ludC55LFxuXHRcdFx0XHRyYWRpYWxEaXN0YW5jZUZyb21DZW50ZXIgPSBNYXRoLnNxcnQoIGRpc3RhbmNlRnJvbVhDZW50ZXIgKiBkaXN0YW5jZUZyb21YQ2VudGVyICsgZGlzdGFuY2VGcm9tWUNlbnRlciAqIGRpc3RhbmNlRnJvbVlDZW50ZXIpO1xuXG5cblx0XHRcdHZhciBhbmdsZSA9IE1hdGguUEkgKiAyICsgTWF0aC5hdGFuMihkaXN0YW5jZUZyb21ZQ2VudGVyLCBkaXN0YW5jZUZyb21YQ2VudGVyKTtcblxuXHRcdFx0Ly9JZiB0aGUgc2VnbWVudCBpcyBpbiB0aGUgdG9wIGxlZnQgcXVhZHJhbnQsIHdlIG5lZWQgdG8gYWRkIGFub3RoZXIgcm90YXRpb24gdG8gdGhlIGFuZ2xlXG5cdFx0XHRpZiAoZGlzdGFuY2VGcm9tWENlbnRlciA8IDAgJiYgZGlzdGFuY2VGcm9tWUNlbnRlciA8IDApe1xuXHRcdFx0XHRhbmdsZSArPSBNYXRoLlBJKjI7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGFuZ2xlOiBhbmdsZSxcblx0XHRcdFx0ZGlzdGFuY2U6IHJhZGlhbERpc3RhbmNlRnJvbUNlbnRlclxuXHRcdFx0fTtcblx0XHR9LFxuXHRcdGFsaWFzUGl4ZWwgPSBoZWxwZXJzLmFsaWFzUGl4ZWwgPSBmdW5jdGlvbihwaXhlbFdpZHRoKXtcblx0XHRcdHJldHVybiAocGl4ZWxXaWR0aCAlIDIgPT09IDApID8gMCA6IDAuNTtcblx0XHR9LFxuXHRcdHNwbGluZUN1cnZlID0gaGVscGVycy5zcGxpbmVDdXJ2ZSA9IGZ1bmN0aW9uKEZpcnN0UG9pbnQsTWlkZGxlUG9pbnQsQWZ0ZXJQb2ludCx0KXtcblx0XHRcdC8vUHJvcHMgdG8gUm9iIFNwZW5jZXIgYXQgc2NhbGVkIGlubm92YXRpb24gZm9yIGhpcyBwb3N0IG9uIHNwbGluaW5nIGJldHdlZW4gcG9pbnRzXG5cdFx0XHQvL2h0dHA6Ly9zY2FsZWRpbm5vdmF0aW9uLmNvbS9hbmFseXRpY3Mvc3BsaW5lcy9hYm91dFNwbGluZXMuaHRtbFxuXHRcdFx0dmFyIGQwMT1NYXRoLnNxcnQoTWF0aC5wb3coTWlkZGxlUG9pbnQueC1GaXJzdFBvaW50LngsMikrTWF0aC5wb3coTWlkZGxlUG9pbnQueS1GaXJzdFBvaW50LnksMikpLFxuXHRcdFx0XHRkMTI9TWF0aC5zcXJ0KE1hdGgucG93KEFmdGVyUG9pbnQueC1NaWRkbGVQb2ludC54LDIpK01hdGgucG93KEFmdGVyUG9pbnQueS1NaWRkbGVQb2ludC55LDIpKSxcblx0XHRcdFx0ZmE9dCpkMDEvKGQwMStkMTIpLC8vIHNjYWxpbmcgZmFjdG9yIGZvciB0cmlhbmdsZSBUYVxuXHRcdFx0XHRmYj10KmQxMi8oZDAxK2QxMik7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRpbm5lciA6IHtcblx0XHRcdFx0XHR4IDogTWlkZGxlUG9pbnQueC1mYSooQWZ0ZXJQb2ludC54LUZpcnN0UG9pbnQueCksXG5cdFx0XHRcdFx0eSA6IE1pZGRsZVBvaW50LnktZmEqKEFmdGVyUG9pbnQueS1GaXJzdFBvaW50LnkpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG91dGVyIDoge1xuXHRcdFx0XHRcdHg6IE1pZGRsZVBvaW50LngrZmIqKEFmdGVyUG9pbnQueC1GaXJzdFBvaW50LngpLFxuXHRcdFx0XHRcdHkgOiBNaWRkbGVQb2ludC55K2ZiKihBZnRlclBvaW50LnktRmlyc3RQb2ludC55KVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0Y2FsY3VsYXRlT3JkZXJPZk1hZ25pdHVkZSA9IGhlbHBlcnMuY2FsY3VsYXRlT3JkZXJPZk1hZ25pdHVkZSA9IGZ1bmN0aW9uKHZhbCl7XG5cdFx0XHRyZXR1cm4gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWwpIC8gTWF0aC5MTjEwKTtcblx0XHR9LFxuXHRcdGNhbGN1bGF0ZVNjYWxlUmFuZ2UgPSBoZWxwZXJzLmNhbGN1bGF0ZVNjYWxlUmFuZ2UgPSBmdW5jdGlvbih2YWx1ZXNBcnJheSwgZHJhd2luZ1NpemUsIHRleHRTaXplLCBzdGFydEZyb21aZXJvLCBpbnRlZ2Vyc09ubHkpe1xuXG5cdFx0XHQvL1NldCBhIG1pbmltdW0gc3RlcCBvZiB0d28gLSBhIHBvaW50IGF0IHRoZSB0b3Agb2YgdGhlIGdyYXBoLCBhbmQgYSBwb2ludCBhdCB0aGUgYmFzZVxuXHRcdFx0dmFyIG1pblN0ZXBzID0gMixcblx0XHRcdFx0bWF4U3RlcHMgPSBNYXRoLmZsb29yKGRyYXdpbmdTaXplLyh0ZXh0U2l6ZSAqIDEuNSkpLFxuXHRcdFx0XHRza2lwRml0dGluZyA9IChtaW5TdGVwcyA+PSBtYXhTdGVwcyk7XG5cblx0XHRcdC8vIEZpbHRlciBvdXQgbnVsbCB2YWx1ZXMgc2luY2UgdGhlc2Ugd291bGQgbWluKCkgdG8gemVyb1xuXHRcdFx0dmFyIHZhbHVlcyA9IFtdO1xuXHRcdFx0ZWFjaCh2YWx1ZXNBcnJheSwgZnVuY3Rpb24oIHYgKXtcblx0XHRcdFx0diA9PSBudWxsIHx8IHZhbHVlcy5wdXNoKCB2ICk7XG5cdFx0XHR9KTtcblx0XHRcdHZhciBtaW5WYWx1ZSA9IG1pbih2YWx1ZXMpLFxuXHRcdFx0ICAgIG1heFZhbHVlID0gbWF4KHZhbHVlcyk7XG5cblx0XHRcdC8vIFdlIG5lZWQgc29tZSBkZWdyZWUgb2Ygc2VwYXJhdGlvbiBoZXJlIHRvIGNhbGN1bGF0ZSB0aGUgc2NhbGVzIGlmIGFsbCB0aGUgdmFsdWVzIGFyZSB0aGUgc2FtZVxuXHRcdFx0Ly8gQWRkaW5nL21pbnVzaW5nIDAuNSB3aWxsIGdpdmUgdXMgYSByYW5nZSBvZiAxLlxuXHRcdFx0aWYgKG1heFZhbHVlID09PSBtaW5WYWx1ZSl7XG5cdFx0XHRcdG1heFZhbHVlICs9IDAuNTtcblx0XHRcdFx0Ly8gU28gd2UgZG9uJ3QgZW5kIHVwIHdpdGggYSBncmFwaCB3aXRoIGEgbmVnYXRpdmUgc3RhcnQgdmFsdWUgaWYgd2UndmUgc2FpZCBhbHdheXMgc3RhcnQgZnJvbSB6ZXJvXG5cdFx0XHRcdGlmIChtaW5WYWx1ZSA+PSAwLjUgJiYgIXN0YXJ0RnJvbVplcm8pe1xuXHRcdFx0XHRcdG1pblZhbHVlIC09IDAuNTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNle1xuXHRcdFx0XHRcdC8vIE1ha2UgdXAgYSB3aG9sZSBudW1iZXIgYWJvdmUgdGhlIHZhbHVlc1xuXHRcdFx0XHRcdG1heFZhbHVlICs9IDAuNTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR2YXJcdHZhbHVlUmFuZ2UgPSBNYXRoLmFicyhtYXhWYWx1ZSAtIG1pblZhbHVlKSxcblx0XHRcdFx0cmFuZ2VPcmRlck9mTWFnbml0dWRlID0gY2FsY3VsYXRlT3JkZXJPZk1hZ25pdHVkZSh2YWx1ZVJhbmdlKSxcblx0XHRcdFx0Z3JhcGhNYXggPSBNYXRoLmNlaWwobWF4VmFsdWUgLyAoMSAqIE1hdGgucG93KDEwLCByYW5nZU9yZGVyT2ZNYWduaXR1ZGUpKSkgKiBNYXRoLnBvdygxMCwgcmFuZ2VPcmRlck9mTWFnbml0dWRlKSxcblx0XHRcdFx0Z3JhcGhNaW4gPSAoc3RhcnRGcm9tWmVybykgPyAwIDogTWF0aC5mbG9vcihtaW5WYWx1ZSAvICgxICogTWF0aC5wb3coMTAsIHJhbmdlT3JkZXJPZk1hZ25pdHVkZSkpKSAqIE1hdGgucG93KDEwLCByYW5nZU9yZGVyT2ZNYWduaXR1ZGUpLFxuXHRcdFx0XHRncmFwaFJhbmdlID0gZ3JhcGhNYXggLSBncmFwaE1pbixcblx0XHRcdFx0c3RlcFZhbHVlID0gTWF0aC5wb3coMTAsIHJhbmdlT3JkZXJPZk1hZ25pdHVkZSksXG5cdFx0XHRcdG51bWJlck9mU3RlcHMgPSBNYXRoLnJvdW5kKGdyYXBoUmFuZ2UgLyBzdGVwVmFsdWUpO1xuXG5cdFx0XHQvL0lmIHdlIGhhdmUgbW9yZSBzcGFjZSBvbiB0aGUgZ3JhcGggd2UnbGwgdXNlIGl0IHRvIGdpdmUgbW9yZSBkZWZpbml0aW9uIHRvIHRoZSBkYXRhXG5cdFx0XHR3aGlsZSgobnVtYmVyT2ZTdGVwcyA+IG1heFN0ZXBzIHx8IChudW1iZXJPZlN0ZXBzICogMikgPCBtYXhTdGVwcykgJiYgIXNraXBGaXR0aW5nKSB7XG5cdFx0XHRcdGlmKG51bWJlck9mU3RlcHMgPiBtYXhTdGVwcyl7XG5cdFx0XHRcdFx0c3RlcFZhbHVlICo9Mjtcblx0XHRcdFx0XHRudW1iZXJPZlN0ZXBzID0gTWF0aC5yb3VuZChncmFwaFJhbmdlL3N0ZXBWYWx1ZSk7XG5cdFx0XHRcdFx0Ly8gRG9uJ3QgZXZlciBkZWFsIHdpdGggYSBkZWNpbWFsIG51bWJlciBvZiBzdGVwcyAtIGNhbmNlbCBmaXR0aW5nIGFuZCBqdXN0IHVzZSB0aGUgbWluaW11bSBudW1iZXIgb2Ygc3RlcHMuXG5cdFx0XHRcdFx0aWYgKG51bWJlck9mU3RlcHMgJSAxICE9PSAwKXtcblx0XHRcdFx0XHRcdHNraXBGaXR0aW5nID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly9XZSBjYW4gZml0IGluIGRvdWJsZSB0aGUgYW1vdW50IG9mIHNjYWxlIHBvaW50cyBvbiB0aGUgc2NhbGVcblx0XHRcdFx0ZWxzZXtcblx0XHRcdFx0XHQvL0lmIHVzZXIgaGFzIGRlY2xhcmVkIGludHMgb25seSwgYW5kIHRoZSBzdGVwIHZhbHVlIGlzbid0IGEgZGVjaW1hbFxuXHRcdFx0XHRcdGlmIChpbnRlZ2Vyc09ubHkgJiYgcmFuZ2VPcmRlck9mTWFnbml0dWRlID49IDApe1xuXHRcdFx0XHRcdFx0Ly9JZiB0aGUgdXNlciBoYXMgc2FpZCBpbnRlZ2VycyBvbmx5LCB3ZSBuZWVkIHRvIGNoZWNrIHRoYXQgbWFraW5nIHRoZSBzY2FsZSBtb3JlIGdyYW51bGFyIHdvdWxkbid0IG1ha2UgaXQgYSBmbG9hdFxuXHRcdFx0XHRcdFx0aWYoc3RlcFZhbHVlLzIgJSAxID09PSAwKXtcblx0XHRcdFx0XHRcdFx0c3RlcFZhbHVlIC89Mjtcblx0XHRcdFx0XHRcdFx0bnVtYmVyT2ZTdGVwcyA9IE1hdGgucm91bmQoZ3JhcGhSYW5nZS9zdGVwVmFsdWUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ly9JZiBpdCB3b3VsZCBtYWtlIGl0IGEgZmxvYXQgYnJlYWsgb3V0IG9mIHRoZSBsb29wXG5cdFx0XHRcdFx0XHRlbHNle1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly9JZiB0aGUgc2NhbGUgZG9lc24ndCBoYXZlIHRvIGJlIGFuIGludCwgbWFrZSB0aGUgc2NhbGUgbW9yZSBncmFudWxhciBhbnl3YXkuXG5cdFx0XHRcdFx0ZWxzZXtcblx0XHRcdFx0XHRcdHN0ZXBWYWx1ZSAvPTI7XG5cdFx0XHRcdFx0XHRudW1iZXJPZlN0ZXBzID0gTWF0aC5yb3VuZChncmFwaFJhbmdlL3N0ZXBWYWx1ZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKHNraXBGaXR0aW5nKXtcblx0XHRcdFx0bnVtYmVyT2ZTdGVwcyA9IG1pblN0ZXBzO1xuXHRcdFx0XHRzdGVwVmFsdWUgPSBncmFwaFJhbmdlIC8gbnVtYmVyT2ZTdGVwcztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3RlcHMgOiBudW1iZXJPZlN0ZXBzLFxuXHRcdFx0XHRzdGVwVmFsdWUgOiBzdGVwVmFsdWUsXG5cdFx0XHRcdG1pbiA6IGdyYXBoTWluLFxuXHRcdFx0XHRtYXhcdDogZ3JhcGhNaW4gKyAobnVtYmVyT2ZTdGVwcyAqIHN0ZXBWYWx1ZSlcblx0XHRcdH07XG5cblx0XHR9LFxuXHRcdC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cblx0XHQvLyBCbG93cyB1cCBqc2hpbnQgZXJyb3JzIGJhc2VkIG9uIHRoZSBuZXcgRnVuY3Rpb24gY29uc3RydWN0b3Jcblx0XHQvL1RlbXBsYXRpbmcgbWV0aG9kc1xuXHRcdC8vSmF2YXNjcmlwdCBtaWNybyB0ZW1wbGF0aW5nIGJ5IEpvaG4gUmVzaWcgLSBzb3VyY2UgYXQgaHR0cDovL2Vqb2huLm9yZy9ibG9nL2phdmFzY3JpcHQtbWljcm8tdGVtcGxhdGluZy9cblx0XHR0ZW1wbGF0ZSA9IGhlbHBlcnMudGVtcGxhdGUgPSBmdW5jdGlvbih0ZW1wbGF0ZVN0cmluZywgdmFsdWVzT2JqZWN0KXtcblxuXHRcdFx0Ly8gSWYgdGVtcGxhdGVTdHJpbmcgaXMgZnVuY3Rpb24gcmF0aGVyIHRoYW4gc3RyaW5nLXRlbXBsYXRlIC0gY2FsbCB0aGUgZnVuY3Rpb24gZm9yIHZhbHVlc09iamVjdFxuXG5cdFx0XHRpZih0ZW1wbGF0ZVN0cmluZyBpbnN0YW5jZW9mIEZ1bmN0aW9uKXtcblx0XHRcdCBcdHJldHVybiB0ZW1wbGF0ZVN0cmluZyh2YWx1ZXNPYmplY3QpO1xuXHRcdCBcdH1cblxuXHRcdFx0dmFyIGNhY2hlID0ge307XG5cdFx0XHRmdW5jdGlvbiB0bXBsKHN0ciwgZGF0YSl7XG5cdFx0XHRcdC8vIEZpZ3VyZSBvdXQgaWYgd2UncmUgZ2V0dGluZyBhIHRlbXBsYXRlLCBvciBpZiB3ZSBuZWVkIHRvXG5cdFx0XHRcdC8vIGxvYWQgdGhlIHRlbXBsYXRlIC0gYW5kIGJlIHN1cmUgdG8gY2FjaGUgdGhlIHJlc3VsdC5cblx0XHRcdFx0dmFyIGZuID0gIS9cXFcvLnRlc3Qoc3RyKSA/XG5cdFx0XHRcdGNhY2hlW3N0cl0gPSBjYWNoZVtzdHJdIDpcblxuXHRcdFx0XHQvLyBHZW5lcmF0ZSBhIHJldXNhYmxlIGZ1bmN0aW9uIHRoYXQgd2lsbCBzZXJ2ZSBhcyBhIHRlbXBsYXRlXG5cdFx0XHRcdC8vIGdlbmVyYXRvciAoYW5kIHdoaWNoIHdpbGwgYmUgY2FjaGVkKS5cblx0XHRcdFx0bmV3IEZ1bmN0aW9uKFwib2JqXCIsXG5cdFx0XHRcdFx0XCJ2YXIgcD1bXSxwcmludD1mdW5jdGlvbigpe3AucHVzaC5hcHBseShwLGFyZ3VtZW50cyk7fTtcIiArXG5cblx0XHRcdFx0XHQvLyBJbnRyb2R1Y2UgdGhlIGRhdGEgYXMgbG9jYWwgdmFyaWFibGVzIHVzaW5nIHdpdGgoKXt9XG5cdFx0XHRcdFx0XCJ3aXRoKG9iail7cC5wdXNoKCdcIiArXG5cblx0XHRcdFx0XHQvLyBDb252ZXJ0IHRoZSB0ZW1wbGF0ZSBpbnRvIHB1cmUgSmF2YVNjcmlwdFxuXHRcdFx0XHRcdHN0clxuXHRcdFx0XHRcdFx0LnJlcGxhY2UoL1tcXHJcXHRcXG5dL2csIFwiIFwiKVxuXHRcdFx0XHRcdFx0LnNwbGl0KFwiPCVcIikuam9pbihcIlxcdFwiKVxuXHRcdFx0XHRcdFx0LnJlcGxhY2UoLygoXnwlPilbXlxcdF0qKScvZywgXCIkMVxcclwiKVxuXHRcdFx0XHRcdFx0LnJlcGxhY2UoL1xcdD0oLio/KSU+L2csIFwiJywkMSwnXCIpXG5cdFx0XHRcdFx0XHQuc3BsaXQoXCJcXHRcIikuam9pbihcIicpO1wiKVxuXHRcdFx0XHRcdFx0LnNwbGl0KFwiJT5cIikuam9pbihcInAucHVzaCgnXCIpXG5cdFx0XHRcdFx0XHQuc3BsaXQoXCJcXHJcIikuam9pbihcIlxcXFwnXCIpICtcblx0XHRcdFx0XHRcIicpO31yZXR1cm4gcC5qb2luKCcnKTtcIlxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdC8vIFByb3ZpZGUgc29tZSBiYXNpYyBjdXJyeWluZyB0byB0aGUgdXNlclxuXHRcdFx0XHRyZXR1cm4gZGF0YSA/IGZuKCBkYXRhICkgOiBmbjtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0bXBsKHRlbXBsYXRlU3RyaW5nLHZhbHVlc09iamVjdCk7XG5cdFx0fSxcblx0XHQvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xuXHRcdGdlbmVyYXRlTGFiZWxzID0gaGVscGVycy5nZW5lcmF0ZUxhYmVscyA9IGZ1bmN0aW9uKHRlbXBsYXRlU3RyaW5nLG51bWJlck9mU3RlcHMsZ3JhcGhNaW4sc3RlcFZhbHVlKXtcblx0XHRcdHZhciBsYWJlbHNBcnJheSA9IG5ldyBBcnJheShudW1iZXJPZlN0ZXBzKTtcblx0XHRcdGlmICh0ZW1wbGF0ZVN0cmluZyl7XG5cdFx0XHRcdGVhY2gobGFiZWxzQXJyYXksZnVuY3Rpb24odmFsLGluZGV4KXtcblx0XHRcdFx0XHRsYWJlbHNBcnJheVtpbmRleF0gPSB0ZW1wbGF0ZSh0ZW1wbGF0ZVN0cmluZyx7dmFsdWU6IChncmFwaE1pbiArIChzdGVwVmFsdWUqKGluZGV4KzEpKSl9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbGFiZWxzQXJyYXk7XG5cdFx0fSxcblx0XHQvLy0tQW5pbWF0aW9uIG1ldGhvZHNcblx0XHQvL0Vhc2luZyBmdW5jdGlvbnMgYWRhcHRlZCBmcm9tIFJvYmVydCBQZW5uZXIncyBlYXNpbmcgZXF1YXRpb25zXG5cdFx0Ly9odHRwOi8vd3d3LnJvYmVydHBlbm5lci5jb20vZWFzaW5nL1xuXHRcdGVhc2luZ0VmZmVjdHMgPSBoZWxwZXJzLmVhc2luZ0VmZmVjdHMgPSB7XG5cdFx0XHRsaW5lYXI6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHJldHVybiB0O1xuXHRcdFx0fSxcblx0XHRcdGVhc2VJblF1YWQ6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHJldHVybiB0ICogdDtcblx0XHRcdH0sXG5cdFx0XHRlYXNlT3V0UXVhZDogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIC0xICogdCAqICh0IC0gMik7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluT3V0UXVhZDogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0aWYgKCh0IC89IDEgLyAyKSA8IDEpe1xuXHRcdFx0XHRcdHJldHVybiAxIC8gMiAqIHQgKiB0O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiAtMSAvIDIgKiAoKC0tdCkgKiAodCAtIDIpIC0gMSk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluQ3ViaWM6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHJldHVybiB0ICogdCAqIHQ7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZU91dEN1YmljOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRyZXR1cm4gMSAqICgodCA9IHQgLyAxIC0gMSkgKiB0ICogdCArIDEpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VJbk91dEN1YmljOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRpZiAoKHQgLz0gMSAvIDIpIDwgMSl7XG5cdFx0XHRcdFx0cmV0dXJuIDEgLyAyICogdCAqIHQgKiB0O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiAxIC8gMiAqICgodCAtPSAyKSAqIHQgKiB0ICsgMik7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluUXVhcnQ6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHJldHVybiB0ICogdCAqIHQgKiB0O1xuXHRcdFx0fSxcblx0XHRcdGVhc2VPdXRRdWFydDogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIC0xICogKCh0ID0gdCAvIDEgLSAxKSAqIHQgKiB0ICogdCAtIDEpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VJbk91dFF1YXJ0OiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRpZiAoKHQgLz0gMSAvIDIpIDwgMSl7XG5cdFx0XHRcdFx0cmV0dXJuIDEgLyAyICogdCAqIHQgKiB0ICogdDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gLTEgLyAyICogKCh0IC09IDIpICogdCAqIHQgKiB0IC0gMik7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluUXVpbnQ6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHJldHVybiAxICogKHQgLz0gMSkgKiB0ICogdCAqIHQgKiB0O1xuXHRcdFx0fSxcblx0XHRcdGVhc2VPdXRRdWludDogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIDEgKiAoKHQgPSB0IC8gMSAtIDEpICogdCAqIHQgKiB0ICogdCArIDEpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VJbk91dFF1aW50OiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRpZiAoKHQgLz0gMSAvIDIpIDwgMSl7XG5cdFx0XHRcdFx0cmV0dXJuIDEgLyAyICogdCAqIHQgKiB0ICogdCAqIHQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIDEgLyAyICogKCh0IC09IDIpICogdCAqIHQgKiB0ICogdCArIDIpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VJblNpbmU6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHJldHVybiAtMSAqIE1hdGguY29zKHQgLyAxICogKE1hdGguUEkgLyAyKSkgKyAxO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VPdXRTaW5lOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRyZXR1cm4gMSAqIE1hdGguc2luKHQgLyAxICogKE1hdGguUEkgLyAyKSk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluT3V0U2luZTogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIC0xIC8gMiAqIChNYXRoLmNvcyhNYXRoLlBJICogdCAvIDEpIC0gMSk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluRXhwbzogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuICh0ID09PSAwKSA/IDEgOiAxICogTWF0aC5wb3coMiwgMTAgKiAodCAvIDEgLSAxKSk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZU91dEV4cG86IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHJldHVybiAodCA9PT0gMSkgPyAxIDogMSAqICgtTWF0aC5wb3coMiwgLTEwICogdCAvIDEpICsgMSk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluT3V0RXhwbzogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0aWYgKHQgPT09IDApe1xuXHRcdFx0XHRcdHJldHVybiAwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0ID09PSAxKXtcblx0XHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoKHQgLz0gMSAvIDIpIDwgMSl7XG5cdFx0XHRcdFx0cmV0dXJuIDEgLyAyICogTWF0aC5wb3coMiwgMTAgKiAodCAtIDEpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gMSAvIDIgKiAoLU1hdGgucG93KDIsIC0xMCAqIC0tdCkgKyAyKTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5DaXJjOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRpZiAodCA+PSAxKXtcblx0XHRcdFx0XHRyZXR1cm4gdDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gLTEgKiAoTWF0aC5zcXJ0KDEgLSAodCAvPSAxKSAqIHQpIC0gMSk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZU91dENpcmM6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHJldHVybiAxICogTWF0aC5zcXJ0KDEgLSAodCA9IHQgLyAxIC0gMSkgKiB0KTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5PdXRDaXJjOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRpZiAoKHQgLz0gMSAvIDIpIDwgMSl7XG5cdFx0XHRcdFx0cmV0dXJuIC0xIC8gMiAqIChNYXRoLnNxcnQoMSAtIHQgKiB0KSAtIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiAxIC8gMiAqIChNYXRoLnNxcnQoMSAtICh0IC09IDIpICogdCkgKyAxKTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5FbGFzdGljOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHR2YXIgcyA9IDEuNzAxNTg7XG5cdFx0XHRcdHZhciBwID0gMDtcblx0XHRcdFx0dmFyIGEgPSAxO1xuXHRcdFx0XHRpZiAodCA9PT0gMCl7XG5cdFx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCh0IC89IDEpID09IDEpe1xuXHRcdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghcCl7XG5cdFx0XHRcdFx0cCA9IDEgKiAwLjM7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGEgPCBNYXRoLmFicygxKSkge1xuXHRcdFx0XHRcdGEgPSAxO1xuXHRcdFx0XHRcdHMgPSBwIC8gNDtcblx0XHRcdFx0fSBlbHNle1xuXHRcdFx0XHRcdHMgPSBwIC8gKDIgKiBNYXRoLlBJKSAqIE1hdGguYXNpbigxIC8gYSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIC0oYSAqIE1hdGgucG93KDIsIDEwICogKHQgLT0gMSkpICogTWF0aC5zaW4oKHQgKiAxIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VPdXRFbGFzdGljOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHR2YXIgcyA9IDEuNzAxNTg7XG5cdFx0XHRcdHZhciBwID0gMDtcblx0XHRcdFx0dmFyIGEgPSAxO1xuXHRcdFx0XHRpZiAodCA9PT0gMCl7XG5cdFx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCh0IC89IDEpID09IDEpe1xuXHRcdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghcCl7XG5cdFx0XHRcdFx0cCA9IDEgKiAwLjM7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGEgPCBNYXRoLmFicygxKSkge1xuXHRcdFx0XHRcdGEgPSAxO1xuXHRcdFx0XHRcdHMgPSBwIC8gNDtcblx0XHRcdFx0fSBlbHNle1xuXHRcdFx0XHRcdHMgPSBwIC8gKDIgKiBNYXRoLlBJKSAqIE1hdGguYXNpbigxIC8gYSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGEgKiBNYXRoLnBvdygyLCAtMTAgKiB0KSAqIE1hdGguc2luKCh0ICogMSAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApICsgMTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5PdXRFbGFzdGljOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHR2YXIgcyA9IDEuNzAxNTg7XG5cdFx0XHRcdHZhciBwID0gMDtcblx0XHRcdFx0dmFyIGEgPSAxO1xuXHRcdFx0XHRpZiAodCA9PT0gMCl7XG5cdFx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCh0IC89IDEgLyAyKSA9PSAyKXtcblx0XHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIXApe1xuXHRcdFx0XHRcdHAgPSAxICogKDAuMyAqIDEuNSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGEgPCBNYXRoLmFicygxKSkge1xuXHRcdFx0XHRcdGEgPSAxO1xuXHRcdFx0XHRcdHMgPSBwIC8gNDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzID0gcCAvICgyICogTWF0aC5QSSkgKiBNYXRoLmFzaW4oMSAvIGEpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0IDwgMSl7XG5cdFx0XHRcdFx0cmV0dXJuIC0wLjUgKiAoYSAqIE1hdGgucG93KDIsIDEwICogKHQgLT0gMSkpICogTWF0aC5zaW4oKHQgKiAxIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkpO31cblx0XHRcdFx0cmV0dXJuIGEgKiBNYXRoLnBvdygyLCAtMTAgKiAodCAtPSAxKSkgKiBNYXRoLnNpbigodCAqIDEgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSAqIDAuNSArIDE7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluQmFjazogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0dmFyIHMgPSAxLjcwMTU4O1xuXHRcdFx0XHRyZXR1cm4gMSAqICh0IC89IDEpICogdCAqICgocyArIDEpICogdCAtIHMpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VPdXRCYWNrOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHR2YXIgcyA9IDEuNzAxNTg7XG5cdFx0XHRcdHJldHVybiAxICogKCh0ID0gdCAvIDEgLSAxKSAqIHQgKiAoKHMgKyAxKSAqIHQgKyBzKSArIDEpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VJbk91dEJhY2s6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHZhciBzID0gMS43MDE1ODtcblx0XHRcdFx0aWYgKCh0IC89IDEgLyAyKSA8IDEpe1xuXHRcdFx0XHRcdHJldHVybiAxIC8gMiAqICh0ICogdCAqICgoKHMgKj0gKDEuNTI1KSkgKyAxKSAqIHQgLSBzKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIDEgLyAyICogKCh0IC09IDIpICogdCAqICgoKHMgKj0gKDEuNTI1KSkgKyAxKSAqIHQgKyBzKSArIDIpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VJbkJvdW5jZTogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIDEgLSBlYXNpbmdFZmZlY3RzLmVhc2VPdXRCb3VuY2UoMSAtIHQpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VPdXRCb3VuY2U6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdGlmICgodCAvPSAxKSA8ICgxIC8gMi43NSkpIHtcblx0XHRcdFx0XHRyZXR1cm4gMSAqICg3LjU2MjUgKiB0ICogdCk7XG5cdFx0XHRcdH0gZWxzZSBpZiAodCA8ICgyIC8gMi43NSkpIHtcblx0XHRcdFx0XHRyZXR1cm4gMSAqICg3LjU2MjUgKiAodCAtPSAoMS41IC8gMi43NSkpICogdCArIDAuNzUpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHQgPCAoMi41IC8gMi43NSkpIHtcblx0XHRcdFx0XHRyZXR1cm4gMSAqICg3LjU2MjUgKiAodCAtPSAoMi4yNSAvIDIuNzUpKSAqIHQgKyAwLjkzNzUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiAxICogKDcuNTYyNSAqICh0IC09ICgyLjYyNSAvIDIuNzUpKSAqIHQgKyAwLjk4NDM3NSk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5PdXRCb3VuY2U6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdGlmICh0IDwgMSAvIDIpe1xuXHRcdFx0XHRcdHJldHVybiBlYXNpbmdFZmZlY3RzLmVhc2VJbkJvdW5jZSh0ICogMikgKiAwLjU7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGVhc2luZ0VmZmVjdHMuZWFzZU91dEJvdW5jZSh0ICogMiAtIDEpICogMC41ICsgMSAqIDAuNTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vUmVxdWVzdCBhbmltYXRpb24gcG9seWZpbGwgLSBodHRwOi8vd3d3LnBhdWxpcmlzaC5jb20vMjAxMS9yZXF1ZXN0YW5pbWF0aW9uZnJhbWUtZm9yLXNtYXJ0LWFuaW1hdGluZy9cblx0XHRyZXF1ZXN0QW5pbUZyYW1lID0gaGVscGVycy5yZXF1ZXN0QW5pbUZyYW1lID0gKGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdFx0XHR3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0XHRcdHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHRcdFx0d2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHRcdFx0d2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0XHRcdGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xuXHRcdFx0XHR9O1xuXHRcdH0pKCksXG5cdFx0Y2FuY2VsQW5pbUZyYW1lID0gaGVscGVycy5jYW5jZWxBbmltRnJhbWUgPSAoZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcblx0XHRcdFx0d2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0XHRcdHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuXHRcdFx0XHR3aW5kb3cub0NhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0XHRcdHdpbmRvdy5tc0NhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0XHRcdGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHdpbmRvdy5jbGVhclRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyA2MCk7XG5cdFx0XHRcdH07XG5cdFx0fSkoKSxcblx0XHRhbmltYXRpb25Mb29wID0gaGVscGVycy5hbmltYXRpb25Mb29wID0gZnVuY3Rpb24oY2FsbGJhY2ssdG90YWxTdGVwcyxlYXNpbmdTdHJpbmcsb25Qcm9ncmVzcyxvbkNvbXBsZXRlLGNoYXJ0SW5zdGFuY2Upe1xuXG5cdFx0XHR2YXIgY3VycmVudFN0ZXAgPSAwLFxuXHRcdFx0XHRlYXNpbmdGdW5jdGlvbiA9IGVhc2luZ0VmZmVjdHNbZWFzaW5nU3RyaW5nXSB8fCBlYXNpbmdFZmZlY3RzLmxpbmVhcjtcblxuXHRcdFx0dmFyIGFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oKXtcblx0XHRcdFx0Y3VycmVudFN0ZXArKztcblx0XHRcdFx0dmFyIHN0ZXBEZWNpbWFsID0gY3VycmVudFN0ZXAvdG90YWxTdGVwcztcblx0XHRcdFx0dmFyIGVhc2VEZWNpbWFsID0gZWFzaW5nRnVuY3Rpb24oc3RlcERlY2ltYWwpO1xuXG5cdFx0XHRcdGNhbGxiYWNrLmNhbGwoY2hhcnRJbnN0YW5jZSxlYXNlRGVjaW1hbCxzdGVwRGVjaW1hbCwgY3VycmVudFN0ZXApO1xuXHRcdFx0XHRvblByb2dyZXNzLmNhbGwoY2hhcnRJbnN0YW5jZSxlYXNlRGVjaW1hbCxzdGVwRGVjaW1hbCk7XG5cdFx0XHRcdGlmIChjdXJyZW50U3RlcCA8IHRvdGFsU3RlcHMpe1xuXHRcdFx0XHRcdGNoYXJ0SW5zdGFuY2UuYW5pbWF0aW9uRnJhbWUgPSByZXF1ZXN0QW5pbUZyYW1lKGFuaW1hdGlvbkZyYW1lKTtcblx0XHRcdFx0fSBlbHNle1xuXHRcdFx0XHRcdG9uQ29tcGxldGUuYXBwbHkoY2hhcnRJbnN0YW5jZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHRyZXF1ZXN0QW5pbUZyYW1lKGFuaW1hdGlvbkZyYW1lKTtcblx0XHR9LFxuXHRcdC8vLS0gRE9NIG1ldGhvZHNcblx0XHRnZXRSZWxhdGl2ZVBvc2l0aW9uID0gaGVscGVycy5nZXRSZWxhdGl2ZVBvc2l0aW9uID0gZnVuY3Rpb24oZXZ0KXtcblx0XHRcdHZhciBtb3VzZVgsIG1vdXNlWTtcblx0XHRcdHZhciBlID0gZXZ0Lm9yaWdpbmFsRXZlbnQgfHwgZXZ0LFxuXHRcdFx0XHRjYW52YXMgPSBldnQuY3VycmVudFRhcmdldCB8fCBldnQuc3JjRWxlbWVudCxcblx0XHRcdFx0Ym91bmRpbmdSZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG5cdFx0XHRpZiAoZS50b3VjaGVzKXtcblx0XHRcdFx0bW91c2VYID0gZS50b3VjaGVzWzBdLmNsaWVudFggLSBib3VuZGluZ1JlY3QubGVmdDtcblx0XHRcdFx0bW91c2VZID0gZS50b3VjaGVzWzBdLmNsaWVudFkgLSBib3VuZGluZ1JlY3QudG9wO1xuXG5cdFx0XHR9XG5cdFx0XHRlbHNle1xuXHRcdFx0XHRtb3VzZVggPSBlLmNsaWVudFggLSBib3VuZGluZ1JlY3QubGVmdDtcblx0XHRcdFx0bW91c2VZID0gZS5jbGllbnRZIC0gYm91bmRpbmdSZWN0LnRvcDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0eCA6IG1vdXNlWCxcblx0XHRcdFx0eSA6IG1vdXNlWVxuXHRcdFx0fTtcblxuXHRcdH0sXG5cdFx0YWRkRXZlbnQgPSBoZWxwZXJzLmFkZEV2ZW50ID0gZnVuY3Rpb24obm9kZSxldmVudFR5cGUsbWV0aG9kKXtcblx0XHRcdGlmIChub2RlLmFkZEV2ZW50TGlzdGVuZXIpe1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLG1ldGhvZCk7XG5cdFx0XHR9IGVsc2UgaWYgKG5vZGUuYXR0YWNoRXZlbnQpe1xuXHRcdFx0XHRub2RlLmF0dGFjaEV2ZW50KFwib25cIitldmVudFR5cGUsIG1ldGhvZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRub2RlW1wib25cIitldmVudFR5cGVdID0gbWV0aG9kO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVtb3ZlRXZlbnQgPSBoZWxwZXJzLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24obm9kZSwgZXZlbnRUeXBlLCBoYW5kbGVyKXtcblx0XHRcdGlmIChub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIpe1xuXHRcdFx0XHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBoYW5kbGVyLCBmYWxzZSk7XG5cdFx0XHR9IGVsc2UgaWYgKG5vZGUuZGV0YWNoRXZlbnQpe1xuXHRcdFx0XHRub2RlLmRldGFjaEV2ZW50KFwib25cIitldmVudFR5cGUsaGFuZGxlcik7XG5cdFx0XHR9IGVsc2V7XG5cdFx0XHRcdG5vZGVbXCJvblwiICsgZXZlbnRUeXBlXSA9IG5vb3A7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRiaW5kRXZlbnRzID0gaGVscGVycy5iaW5kRXZlbnRzID0gZnVuY3Rpb24oY2hhcnRJbnN0YW5jZSwgYXJyYXlPZkV2ZW50cywgaGFuZGxlcil7XG5cdFx0XHQvLyBDcmVhdGUgdGhlIGV2ZW50cyBvYmplY3QgaWYgaXQncyBub3QgYWxyZWFkeSBwcmVzZW50XG5cdFx0XHRpZiAoIWNoYXJ0SW5zdGFuY2UuZXZlbnRzKSBjaGFydEluc3RhbmNlLmV2ZW50cyA9IHt9O1xuXG5cdFx0XHRlYWNoKGFycmF5T2ZFdmVudHMsZnVuY3Rpb24oZXZlbnROYW1lKXtcblx0XHRcdFx0Y2hhcnRJbnN0YW5jZS5ldmVudHNbZXZlbnROYW1lXSA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0aGFuZGxlci5hcHBseShjaGFydEluc3RhbmNlLCBhcmd1bWVudHMpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRhZGRFdmVudChjaGFydEluc3RhbmNlLmNoYXJ0LmNhbnZhcyxldmVudE5hbWUsY2hhcnRJbnN0YW5jZS5ldmVudHNbZXZlbnROYW1lXSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdHVuYmluZEV2ZW50cyA9IGhlbHBlcnMudW5iaW5kRXZlbnRzID0gZnVuY3Rpb24gKGNoYXJ0SW5zdGFuY2UsIGFycmF5T2ZFdmVudHMpIHtcblx0XHRcdGVhY2goYXJyYXlPZkV2ZW50cywgZnVuY3Rpb24oaGFuZGxlcixldmVudE5hbWUpe1xuXHRcdFx0XHRyZW1vdmVFdmVudChjaGFydEluc3RhbmNlLmNoYXJ0LmNhbnZhcywgZXZlbnROYW1lLCBoYW5kbGVyKTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0Z2V0TWF4aW11bVdpZHRoID0gaGVscGVycy5nZXRNYXhpbXVtV2lkdGggPSBmdW5jdGlvbihkb21Ob2RlKXtcblx0XHRcdHZhciBjb250YWluZXIgPSBkb21Ob2RlLnBhcmVudE5vZGUsXG5cdFx0XHQgICAgcGFkZGluZyA9IHBhcnNlSW50KGdldFN0eWxlKGNvbnRhaW5lciwgJ3BhZGRpbmctbGVmdCcpKSArIHBhcnNlSW50KGdldFN0eWxlKGNvbnRhaW5lciwgJ3BhZGRpbmctcmlnaHQnKSk7XG5cdFx0XHQvLyBUT0RPID0gY2hlY2sgY3Jvc3MgYnJvd3NlciBzdHVmZiB3aXRoIHRoaXMuXG5cdFx0XHRyZXR1cm4gY29udGFpbmVyID8gY29udGFpbmVyLmNsaWVudFdpZHRoIC0gcGFkZGluZyA6IDA7XG5cdFx0fSxcblx0XHRnZXRNYXhpbXVtSGVpZ2h0ID0gaGVscGVycy5nZXRNYXhpbXVtSGVpZ2h0ID0gZnVuY3Rpb24oZG9tTm9kZSl7XG5cdFx0XHR2YXIgY29udGFpbmVyID0gZG9tTm9kZS5wYXJlbnROb2RlLFxuXHRcdFx0ICAgIHBhZGRpbmcgPSBwYXJzZUludChnZXRTdHlsZShjb250YWluZXIsICdwYWRkaW5nLWJvdHRvbScpKSArIHBhcnNlSW50KGdldFN0eWxlKGNvbnRhaW5lciwgJ3BhZGRpbmctdG9wJykpO1xuXHRcdFx0Ly8gVE9ETyA9IGNoZWNrIGNyb3NzIGJyb3dzZXIgc3R1ZmYgd2l0aCB0aGlzLlxuXHRcdFx0cmV0dXJuIGNvbnRhaW5lciA/IGNvbnRhaW5lci5jbGllbnRIZWlnaHQgLSBwYWRkaW5nIDogMDtcblx0XHR9LFxuXHRcdGdldFN0eWxlID0gaGVscGVycy5nZXRTdHlsZSA9IGZ1bmN0aW9uIChlbCwgcHJvcGVydHkpIHtcblx0XHRcdHJldHVybiBlbC5jdXJyZW50U3R5bGUgP1xuXHRcdFx0XHRlbC5jdXJyZW50U3R5bGVbcHJvcGVydHldIDpcblx0XHRcdFx0ZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCwgbnVsbCkuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSk7XG5cdFx0fSxcblx0XHRnZXRNYXhpbXVtU2l6ZSA9IGhlbHBlcnMuZ2V0TWF4aW11bVNpemUgPSBoZWxwZXJzLmdldE1heGltdW1XaWR0aCwgLy8gbGVnYWN5IHN1cHBvcnRcblx0XHRyZXRpbmFTY2FsZSA9IGhlbHBlcnMucmV0aW5hU2NhbGUgPSBmdW5jdGlvbihjaGFydCl7XG5cdFx0XHR2YXIgY3R4ID0gY2hhcnQuY3R4LFxuXHRcdFx0XHR3aWR0aCA9IGNoYXJ0LmNhbnZhcy53aWR0aCxcblx0XHRcdFx0aGVpZ2h0ID0gY2hhcnQuY2FudmFzLmhlaWdodDtcblxuXHRcdFx0aWYgKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKSB7XG5cdFx0XHRcdGN0eC5jYW52YXMuc3R5bGUud2lkdGggPSB3aWR0aCArIFwicHhcIjtcblx0XHRcdFx0Y3R4LmNhbnZhcy5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyBcInB4XCI7XG5cdFx0XHRcdGN0eC5jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0ICogd2luZG93LmRldmljZVBpeGVsUmF0aW87XG5cdFx0XHRcdGN0eC5jYW52YXMud2lkdGggPSB3aWR0aCAqIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xuXHRcdFx0XHRjdHguc2NhbGUod2luZG93LmRldmljZVBpeGVsUmF0aW8sIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vLS0gQ2FudmFzIG1ldGhvZHNcblx0XHRjbGVhciA9IGhlbHBlcnMuY2xlYXIgPSBmdW5jdGlvbihjaGFydCl7XG5cdFx0XHRjaGFydC5jdHguY2xlYXJSZWN0KDAsMCxjaGFydC53aWR0aCxjaGFydC5oZWlnaHQpO1xuXHRcdH0sXG5cdFx0Zm9udFN0cmluZyA9IGhlbHBlcnMuZm9udFN0cmluZyA9IGZ1bmN0aW9uKHBpeGVsU2l6ZSxmb250U3R5bGUsZm9udEZhbWlseSl7XG5cdFx0XHRyZXR1cm4gZm9udFN0eWxlICsgXCIgXCIgKyBwaXhlbFNpemUrXCJweCBcIiArIGZvbnRGYW1pbHk7XG5cdFx0fSxcblx0XHRsb25nZXN0VGV4dCA9IGhlbHBlcnMubG9uZ2VzdFRleHQgPSBmdW5jdGlvbihjdHgsZm9udCxhcnJheU9mU3RyaW5ncyl7XG5cdFx0XHRjdHguZm9udCA9IGZvbnQ7XG5cdFx0XHR2YXIgbG9uZ2VzdCA9IDA7XG5cdFx0XHRlYWNoKGFycmF5T2ZTdHJpbmdzLGZ1bmN0aW9uKHN0cmluZyl7XG5cdFx0XHRcdHZhciB0ZXh0V2lkdGggPSBjdHgubWVhc3VyZVRleHQoc3RyaW5nKS53aWR0aDtcblx0XHRcdFx0bG9uZ2VzdCA9ICh0ZXh0V2lkdGggPiBsb25nZXN0KSA/IHRleHRXaWR0aCA6IGxvbmdlc3Q7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBsb25nZXN0O1xuXHRcdH0sXG5cdFx0ZHJhd1JvdW5kZWRSZWN0YW5nbGUgPSBoZWxwZXJzLmRyYXdSb3VuZGVkUmVjdGFuZ2xlID0gZnVuY3Rpb24oY3R4LHgseSx3aWR0aCxoZWlnaHQscmFkaXVzKXtcblx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdGN0eC5tb3ZlVG8oeCArIHJhZGl1cywgeSk7XG5cdFx0XHRjdHgubGluZVRvKHggKyB3aWR0aCAtIHJhZGl1cywgeSk7XG5cdFx0XHRjdHgucXVhZHJhdGljQ3VydmVUbyh4ICsgd2lkdGgsIHksIHggKyB3aWR0aCwgeSArIHJhZGl1cyk7XG5cdFx0XHRjdHgubGluZVRvKHggKyB3aWR0aCwgeSArIGhlaWdodCAtIHJhZGl1cyk7XG5cdFx0XHRjdHgucXVhZHJhdGljQ3VydmVUbyh4ICsgd2lkdGgsIHkgKyBoZWlnaHQsIHggKyB3aWR0aCAtIHJhZGl1cywgeSArIGhlaWdodCk7XG5cdFx0XHRjdHgubGluZVRvKHggKyByYWRpdXMsIHkgKyBoZWlnaHQpO1xuXHRcdFx0Y3R4LnF1YWRyYXRpY0N1cnZlVG8oeCwgeSArIGhlaWdodCwgeCwgeSArIGhlaWdodCAtIHJhZGl1cyk7XG5cdFx0XHRjdHgubGluZVRvKHgsIHkgKyByYWRpdXMpO1xuXHRcdFx0Y3R4LnF1YWRyYXRpY0N1cnZlVG8oeCwgeSwgeCArIHJhZGl1cywgeSk7XG5cdFx0XHRjdHguY2xvc2VQYXRoKCk7XG5cdFx0fTtcblxuXG5cdC8vU3RvcmUgYSByZWZlcmVuY2UgdG8gZWFjaCBpbnN0YW5jZSAtIGFsbG93aW5nIHVzIHRvIGdsb2JhbGx5IHJlc2l6ZSBjaGFydCBpbnN0YW5jZXMgb24gd2luZG93IHJlc2l6ZS5cblx0Ly9EZXN0cm95IG1ldGhvZCBvbiB0aGUgY2hhcnQgd2lsbCByZW1vdmUgdGhlIGluc3RhbmNlIG9mIHRoZSBjaGFydCBmcm9tIHRoaXMgcmVmZXJlbmNlLlxuXHRDaGFydC5pbnN0YW5jZXMgPSB7fTtcblxuXHRDaGFydC5UeXBlID0gZnVuY3Rpb24oZGF0YSxvcHRpb25zLGNoYXJ0KXtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuY2hhcnQgPSBjaGFydDtcblx0XHR0aGlzLmlkID0gdWlkKCk7XG5cdFx0Ly9BZGQgdGhlIGNoYXJ0IGluc3RhbmNlIHRvIHRoZSBnbG9iYWwgbmFtZXNwYWNlXG5cdFx0Q2hhcnQuaW5zdGFuY2VzW3RoaXMuaWRdID0gdGhpcztcblxuXHRcdC8vIEluaXRpYWxpemUgaXMgYWx3YXlzIGNhbGxlZCB3aGVuIGEgY2hhcnQgdHlwZSBpcyBjcmVhdGVkXG5cdFx0Ly8gQnkgZGVmYXVsdCBpdCBpcyBhIG5vIG9wLCBidXQgaXQgc2hvdWxkIGJlIGV4dGVuZGVkXG5cdFx0aWYgKG9wdGlvbnMucmVzcG9uc2l2ZSl7XG5cdFx0XHR0aGlzLnJlc2l6ZSgpO1xuXHRcdH1cblx0XHR0aGlzLmluaXRpYWxpemUuY2FsbCh0aGlzLGRhdGEpO1xuXHR9O1xuXG5cdC8vQ29yZSBtZXRob2RzIHRoYXQnbGwgYmUgYSBwYXJ0IG9mIGV2ZXJ5IGNoYXJ0IHR5cGVcblx0ZXh0ZW5kKENoYXJ0LlR5cGUucHJvdG90eXBlLHtcblx0XHRpbml0aWFsaXplIDogZnVuY3Rpb24oKXtyZXR1cm4gdGhpczt9LFxuXHRcdGNsZWFyIDogZnVuY3Rpb24oKXtcblx0XHRcdGNsZWFyKHRoaXMuY2hhcnQpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblx0XHRzdG9wIDogZnVuY3Rpb24oKXtcblx0XHRcdC8vIFN0b3BzIGFueSBjdXJyZW50IGFuaW1hdGlvbiBsb29wIG9jY3VyaW5nXG5cdFx0XHRDaGFydC5hbmltYXRpb25TZXJ2aWNlLmNhbmNlbEFuaW1hdGlvbih0aGlzKTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cdFx0cmVzaXplIDogZnVuY3Rpb24oY2FsbGJhY2spe1xuXHRcdFx0dGhpcy5zdG9wKCk7XG5cdFx0XHR2YXIgY2FudmFzID0gdGhpcy5jaGFydC5jYW52YXMsXG5cdFx0XHRcdG5ld1dpZHRoID0gZ2V0TWF4aW11bVdpZHRoKHRoaXMuY2hhcnQuY2FudmFzKSxcblx0XHRcdFx0bmV3SGVpZ2h0ID0gdGhpcy5vcHRpb25zLm1haW50YWluQXNwZWN0UmF0aW8gPyBuZXdXaWR0aCAvIHRoaXMuY2hhcnQuYXNwZWN0UmF0aW8gOiBnZXRNYXhpbXVtSGVpZ2h0KHRoaXMuY2hhcnQuY2FudmFzKTtcblxuXHRcdFx0Y2FudmFzLndpZHRoID0gdGhpcy5jaGFydC53aWR0aCA9IG5ld1dpZHRoO1xuXHRcdFx0Y2FudmFzLmhlaWdodCA9IHRoaXMuY2hhcnQuaGVpZ2h0ID0gbmV3SGVpZ2h0O1xuXG5cdFx0XHRyZXRpbmFTY2FsZSh0aGlzLmNoYXJ0KTtcblxuXHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdFx0Y2FsbGJhY2suYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXHRcdHJlZmxvdyA6IG5vb3AsXG5cdFx0cmVuZGVyIDogZnVuY3Rpb24ocmVmbG93KXtcblx0XHRcdGlmIChyZWZsb3cpe1xuXHRcdFx0XHR0aGlzLnJlZmxvdygpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbiAmJiAhcmVmbG93KXtcblx0XHRcdFx0dmFyIGFuaW1hdGlvbiA9IG5ldyBDaGFydC5BbmltYXRpb24oKTtcblx0XHRcdFx0YW5pbWF0aW9uLm51bVN0ZXBzID0gdGhpcy5vcHRpb25zLmFuaW1hdGlvblN0ZXBzO1xuXHRcdFx0XHRhbmltYXRpb24uZWFzaW5nID0gdGhpcy5vcHRpb25zLmFuaW1hdGlvbkVhc2luZztcblx0XHRcdFx0XG5cdFx0XHRcdC8vIHJlbmRlciBmdW5jdGlvblxuXHRcdFx0XHRhbmltYXRpb24ucmVuZGVyID0gZnVuY3Rpb24oY2hhcnRJbnN0YW5jZSwgYW5pbWF0aW9uT2JqZWN0KSB7XG5cdFx0XHRcdFx0dmFyIGVhc2luZ0Z1bmN0aW9uID0gaGVscGVycy5lYXNpbmdFZmZlY3RzW2FuaW1hdGlvbk9iamVjdC5lYXNpbmddO1xuXHRcdFx0XHRcdHZhciBzdGVwRGVjaW1hbCA9IGFuaW1hdGlvbk9iamVjdC5jdXJyZW50U3RlcCAvIGFuaW1hdGlvbk9iamVjdC5udW1TdGVwcztcblx0XHRcdFx0XHR2YXIgZWFzZURlY2ltYWwgPSBlYXNpbmdGdW5jdGlvbihzdGVwRGVjaW1hbCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Y2hhcnRJbnN0YW5jZS5kcmF3KGVhc2VEZWNpbWFsLCBzdGVwRGVjaW1hbCwgYW5pbWF0aW9uT2JqZWN0LmN1cnJlbnRTdGVwKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIHVzZXIgZXZlbnRzXG5cdFx0XHRcdGFuaW1hdGlvbi5vbkFuaW1hdGlvblByb2dyZXNzID0gdGhpcy5vcHRpb25zLm9uQW5pbWF0aW9uUHJvZ3Jlc3M7XG5cdFx0XHRcdGFuaW1hdGlvbi5vbkFuaW1hdGlvbkNvbXBsZXRlID0gdGhpcy5vcHRpb25zLm9uQW5pbWF0aW9uQ29tcGxldGU7XG5cdFx0XHRcdFxuXHRcdFx0XHRDaGFydC5hbmltYXRpb25TZXJ2aWNlLmFkZEFuaW1hdGlvbih0aGlzLCBhbmltYXRpb24pO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZXtcblx0XHRcdFx0dGhpcy5kcmF3KCk7XG5cdFx0XHRcdHRoaXMub3B0aW9ucy5vbkFuaW1hdGlvbkNvbXBsZXRlLmNhbGwodGhpcyk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXHRcdGdlbmVyYXRlTGVnZW5kIDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBoZWxwZXJzLnRlbXBsYXRlKHRoaXMub3B0aW9ucy5sZWdlbmRUZW1wbGF0ZSwgdGhpcyk7XG5cdFx0fSxcblx0XHRkZXN0cm95IDogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuc3RvcCgpO1xuXHRcdFx0dGhpcy5jbGVhcigpO1xuXHRcdFx0dW5iaW5kRXZlbnRzKHRoaXMsIHRoaXMuZXZlbnRzKTtcblx0XHRcdHZhciBjYW52YXMgPSB0aGlzLmNoYXJ0LmNhbnZhcztcblxuXHRcdFx0Ly8gUmVzZXQgY2FudmFzIGhlaWdodC93aWR0aCBhdHRyaWJ1dGVzIHN0YXJ0cyBhIGZyZXNoIHdpdGggdGhlIGNhbnZhcyBjb250ZXh0XG5cdFx0XHRjYW52YXMud2lkdGggPSB0aGlzLmNoYXJ0LndpZHRoO1xuXHRcdFx0Y2FudmFzLmhlaWdodCA9IHRoaXMuY2hhcnQuaGVpZ2h0O1xuXG5cdFx0XHQvLyA8IElFOSBkb2Vzbid0IHN1cHBvcnQgcmVtb3ZlUHJvcGVydHlcblx0XHRcdGlmIChjYW52YXMuc3R5bGUucmVtb3ZlUHJvcGVydHkpIHtcblx0XHRcdFx0Y2FudmFzLnN0eWxlLnJlbW92ZVByb3BlcnR5KCd3aWR0aCcpO1xuXHRcdFx0XHRjYW52YXMuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ2hlaWdodCcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y2FudmFzLnN0eWxlLnJlbW92ZUF0dHJpYnV0ZSgnd2lkdGgnKTtcblx0XHRcdFx0Y2FudmFzLnN0eWxlLnJlbW92ZUF0dHJpYnV0ZSgnaGVpZ2h0Jyk7XG5cdFx0XHR9XG5cblx0XHRcdGRlbGV0ZSBDaGFydC5pbnN0YW5jZXNbdGhpcy5pZF07XG5cdFx0fSxcblx0XHRzaG93VG9vbHRpcCA6IGZ1bmN0aW9uKENoYXJ0RWxlbWVudHMsIGZvcmNlUmVkcmF3KXtcblx0XHRcdC8vIE9ubHkgcmVkcmF3IHRoZSBjaGFydCBpZiB3ZSd2ZSBhY3R1YWxseSBjaGFuZ2VkIHdoYXQgd2UncmUgaG92ZXJpbmcgb24uXG5cdFx0XHRpZiAodHlwZW9mIHRoaXMuYWN0aXZlRWxlbWVudHMgPT09ICd1bmRlZmluZWQnKSB0aGlzLmFjdGl2ZUVsZW1lbnRzID0gW107XG5cblx0XHRcdHZhciBpc0NoYW5nZWQgPSAoZnVuY3Rpb24oRWxlbWVudHMpe1xuXHRcdFx0XHR2YXIgY2hhbmdlZCA9IGZhbHNlO1xuXG5cdFx0XHRcdGlmIChFbGVtZW50cy5sZW5ndGggIT09IHRoaXMuYWN0aXZlRWxlbWVudHMubGVuZ3RoKXtcblx0XHRcdFx0XHRjaGFuZ2VkID0gdHJ1ZTtcblx0XHRcdFx0XHRyZXR1cm4gY2hhbmdlZDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVhY2goRWxlbWVudHMsIGZ1bmN0aW9uKGVsZW1lbnQsIGluZGV4KXtcblx0XHRcdFx0XHRpZiAoZWxlbWVudCAhPT0gdGhpcy5hY3RpdmVFbGVtZW50c1tpbmRleF0pe1xuXHRcdFx0XHRcdFx0Y2hhbmdlZCA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCB0aGlzKTtcblx0XHRcdFx0cmV0dXJuIGNoYW5nZWQ7XG5cdFx0XHR9KS5jYWxsKHRoaXMsIENoYXJ0RWxlbWVudHMpO1xuXG5cdFx0XHRpZiAoIWlzQ2hhbmdlZCAmJiAhZm9yY2VSZWRyYXcpe1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRlbHNle1xuXHRcdFx0XHR0aGlzLmFjdGl2ZUVsZW1lbnRzID0gQ2hhcnRFbGVtZW50cztcblx0XHRcdH1cblx0XHRcdHRoaXMuZHJhdygpO1xuXHRcdFx0aWYodGhpcy5vcHRpb25zLmN1c3RvbVRvb2x0aXBzKXtcblx0XHRcdFx0dGhpcy5vcHRpb25zLmN1c3RvbVRvb2x0aXBzKGZhbHNlKTtcblx0XHRcdH1cblx0XHRcdGlmIChDaGFydEVsZW1lbnRzLmxlbmd0aCA+IDApe1xuXHRcdFx0XHQvLyBJZiB3ZSBoYXZlIG11bHRpcGxlIGRhdGFzZXRzLCBzaG93IGEgTXVsdGlUb29sdGlwIGZvciBhbGwgb2YgdGhlIGRhdGEgcG9pbnRzIGF0IHRoYXQgaW5kZXhcblx0XHRcdFx0aWYgKHRoaXMuZGF0YXNldHMgJiYgdGhpcy5kYXRhc2V0cy5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdFx0dmFyIGRhdGFBcnJheSxcblx0XHRcdFx0XHRcdGRhdGFJbmRleDtcblxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSB0aGlzLmRhdGFzZXRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdFx0XHRkYXRhQXJyYXkgPSB0aGlzLmRhdGFzZXRzW2ldLnBvaW50cyB8fCB0aGlzLmRhdGFzZXRzW2ldLmJhcnMgfHwgdGhpcy5kYXRhc2V0c1tpXS5zZWdtZW50cztcblx0XHRcdFx0XHRcdGRhdGFJbmRleCA9IGluZGV4T2YoZGF0YUFycmF5LCBDaGFydEVsZW1lbnRzWzBdKTtcblx0XHRcdFx0XHRcdGlmIChkYXRhSW5kZXggIT09IC0xKXtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhciB0b29sdGlwTGFiZWxzID0gW10sXG5cdFx0XHRcdFx0XHR0b29sdGlwQ29sb3JzID0gW10sXG5cdFx0XHRcdFx0XHRtZWRpYW5Qb3NpdGlvbiA9IChmdW5jdGlvbihpbmRleCkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIEdldCBhbGwgdGhlIHBvaW50cyBhdCB0aGF0IHBhcnRpY3VsYXIgaW5kZXhcblx0XHRcdFx0XHRcdFx0dmFyIEVsZW1lbnRzID0gW10sXG5cdFx0XHRcdFx0XHRcdFx0ZGF0YUNvbGxlY3Rpb24sXG5cdFx0XHRcdFx0XHRcdFx0eFBvc2l0aW9ucyA9IFtdLFxuXHRcdFx0XHRcdFx0XHRcdHlQb3NpdGlvbnMgPSBbXSxcblx0XHRcdFx0XHRcdFx0XHR4TWF4LFxuXHRcdFx0XHRcdFx0XHRcdHlNYXgsXG5cdFx0XHRcdFx0XHRcdFx0eE1pbixcblx0XHRcdFx0XHRcdFx0XHR5TWluO1xuXHRcdFx0XHRcdFx0XHRoZWxwZXJzLmVhY2godGhpcy5kYXRhc2V0cywgZnVuY3Rpb24oZGF0YXNldCl7XG5cdFx0XHRcdFx0XHRcdFx0ZGF0YUNvbGxlY3Rpb24gPSBkYXRhc2V0LnBvaW50cyB8fCBkYXRhc2V0LmJhcnMgfHwgZGF0YXNldC5zZWdtZW50cztcblx0XHRcdFx0XHRcdFx0XHRpZiAoZGF0YUNvbGxlY3Rpb25bZGF0YUluZGV4XSAmJiBkYXRhQ29sbGVjdGlvbltkYXRhSW5kZXhdLmhhc1ZhbHVlKCkpe1xuXHRcdFx0XHRcdFx0XHRcdFx0RWxlbWVudHMucHVzaChkYXRhQ29sbGVjdGlvbltkYXRhSW5kZXhdKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdGhlbHBlcnMuZWFjaChFbGVtZW50cywgZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdFx0XHRcdFx0XHRcdHhQb3NpdGlvbnMucHVzaChlbGVtZW50LngpO1xuXHRcdFx0XHRcdFx0XHRcdHlQb3NpdGlvbnMucHVzaChlbGVtZW50LnkpO1xuXG5cblx0XHRcdFx0XHRcdFx0XHQvL0luY2x1ZGUgYW55IGNvbG91ciBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZWxlbWVudFxuXHRcdFx0XHRcdFx0XHRcdHRvb2x0aXBMYWJlbHMucHVzaChoZWxwZXJzLnRlbXBsYXRlKHRoaXMub3B0aW9ucy5tdWx0aVRvb2x0aXBUZW1wbGF0ZSwgZWxlbWVudCkpO1xuXHRcdFx0XHRcdFx0XHRcdHRvb2x0aXBDb2xvcnMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxsOiBlbGVtZW50Ll9zYXZlZC5maWxsQ29sb3IgfHwgZWxlbWVudC5maWxsQ29sb3IsXG5cdFx0XHRcdFx0XHRcdFx0XHRzdHJva2U6IGVsZW1lbnQuX3NhdmVkLnN0cm9rZUNvbG9yIHx8IGVsZW1lbnQuc3Ryb2tlQ29sb3Jcblx0XHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHR9LCB0aGlzKTtcblxuXHRcdFx0XHRcdFx0XHR5TWluID0gbWluKHlQb3NpdGlvbnMpO1xuXHRcdFx0XHRcdFx0XHR5TWF4ID0gbWF4KHlQb3NpdGlvbnMpO1xuXG5cdFx0XHRcdFx0XHRcdHhNaW4gPSBtaW4oeFBvc2l0aW9ucyk7XG5cdFx0XHRcdFx0XHRcdHhNYXggPSBtYXgoeFBvc2l0aW9ucyk7XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHR4OiAoeE1pbiA+IHRoaXMuY2hhcnQud2lkdGgvMikgPyB4TWluIDogeE1heCxcblx0XHRcdFx0XHRcdFx0XHR5OiAoeU1pbiArIHlNYXgpLzJcblx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdH0pLmNhbGwodGhpcywgZGF0YUluZGV4KTtcblxuXHRcdFx0XHRcdG5ldyBDaGFydC5NdWx0aVRvb2x0aXAoe1xuXHRcdFx0XHRcdFx0eDogbWVkaWFuUG9zaXRpb24ueCxcblx0XHRcdFx0XHRcdHk6IG1lZGlhblBvc2l0aW9uLnksXG5cdFx0XHRcdFx0XHR4UGFkZGluZzogdGhpcy5vcHRpb25zLnRvb2x0aXBYUGFkZGluZyxcblx0XHRcdFx0XHRcdHlQYWRkaW5nOiB0aGlzLm9wdGlvbnMudG9vbHRpcFlQYWRkaW5nLFxuXHRcdFx0XHRcdFx0eE9mZnNldDogdGhpcy5vcHRpb25zLnRvb2x0aXBYT2Zmc2V0LFxuXHRcdFx0XHRcdFx0ZmlsbENvbG9yOiB0aGlzLm9wdGlvbnMudG9vbHRpcEZpbGxDb2xvcixcblx0XHRcdFx0XHRcdHRleHRDb2xvcjogdGhpcy5vcHRpb25zLnRvb2x0aXBGb250Q29sb3IsXG5cdFx0XHRcdFx0XHRmb250RmFtaWx5OiB0aGlzLm9wdGlvbnMudG9vbHRpcEZvbnRGYW1pbHksXG5cdFx0XHRcdFx0XHRmb250U3R5bGU6IHRoaXMub3B0aW9ucy50b29sdGlwRm9udFN0eWxlLFxuXHRcdFx0XHRcdFx0Zm9udFNpemU6IHRoaXMub3B0aW9ucy50b29sdGlwRm9udFNpemUsXG5cdFx0XHRcdFx0XHR0aXRsZVRleHRDb2xvcjogdGhpcy5vcHRpb25zLnRvb2x0aXBUaXRsZUZvbnRDb2xvcixcblx0XHRcdFx0XHRcdHRpdGxlRm9udEZhbWlseTogdGhpcy5vcHRpb25zLnRvb2x0aXBUaXRsZUZvbnRGYW1pbHksXG5cdFx0XHRcdFx0XHR0aXRsZUZvbnRTdHlsZTogdGhpcy5vcHRpb25zLnRvb2x0aXBUaXRsZUZvbnRTdHlsZSxcblx0XHRcdFx0XHRcdHRpdGxlRm9udFNpemU6IHRoaXMub3B0aW9ucy50b29sdGlwVGl0bGVGb250U2l6ZSxcblx0XHRcdFx0XHRcdGNvcm5lclJhZGl1czogdGhpcy5vcHRpb25zLnRvb2x0aXBDb3JuZXJSYWRpdXMsXG5cdFx0XHRcdFx0XHRsYWJlbHM6IHRvb2x0aXBMYWJlbHMsXG5cdFx0XHRcdFx0XHRsZWdlbmRDb2xvcnM6IHRvb2x0aXBDb2xvcnMsXG5cdFx0XHRcdFx0XHRsZWdlbmRDb2xvckJhY2tncm91bmQgOiB0aGlzLm9wdGlvbnMubXVsdGlUb29sdGlwS2V5QmFja2dyb3VuZCxcblx0XHRcdFx0XHRcdHRpdGxlOiB0ZW1wbGF0ZSh0aGlzLm9wdGlvbnMudG9vbHRpcFRpdGxlVGVtcGxhdGUsQ2hhcnRFbGVtZW50c1swXSksXG5cdFx0XHRcdFx0XHRjaGFydDogdGhpcy5jaGFydCxcblx0XHRcdFx0XHRcdGN0eDogdGhpcy5jaGFydC5jdHgsXG5cdFx0XHRcdFx0XHRjdXN0b206IHRoaXMub3B0aW9ucy5jdXN0b21Ub29sdGlwc1xuXHRcdFx0XHRcdH0pLmRyYXcoKTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGVhY2goQ2hhcnRFbGVtZW50cywgZnVuY3Rpb24oRWxlbWVudCkge1xuXHRcdFx0XHRcdFx0dmFyIHRvb2x0aXBQb3NpdGlvbiA9IEVsZW1lbnQudG9vbHRpcFBvc2l0aW9uKCk7XG5cdFx0XHRcdFx0XHRuZXcgQ2hhcnQuVG9vbHRpcCh7XG5cdFx0XHRcdFx0XHRcdHg6IE1hdGgucm91bmQodG9vbHRpcFBvc2l0aW9uLngpLFxuXHRcdFx0XHRcdFx0XHR5OiBNYXRoLnJvdW5kKHRvb2x0aXBQb3NpdGlvbi55KSxcblx0XHRcdFx0XHRcdFx0eFBhZGRpbmc6IHRoaXMub3B0aW9ucy50b29sdGlwWFBhZGRpbmcsXG5cdFx0XHRcdFx0XHRcdHlQYWRkaW5nOiB0aGlzLm9wdGlvbnMudG9vbHRpcFlQYWRkaW5nLFxuXHRcdFx0XHRcdFx0XHRmaWxsQ29sb3I6IHRoaXMub3B0aW9ucy50b29sdGlwRmlsbENvbG9yLFxuXHRcdFx0XHRcdFx0XHR0ZXh0Q29sb3I6IHRoaXMub3B0aW9ucy50b29sdGlwRm9udENvbG9yLFxuXHRcdFx0XHRcdFx0XHRmb250RmFtaWx5OiB0aGlzLm9wdGlvbnMudG9vbHRpcEZvbnRGYW1pbHksXG5cdFx0XHRcdFx0XHRcdGZvbnRTdHlsZTogdGhpcy5vcHRpb25zLnRvb2x0aXBGb250U3R5bGUsXG5cdFx0XHRcdFx0XHRcdGZvbnRTaXplOiB0aGlzLm9wdGlvbnMudG9vbHRpcEZvbnRTaXplLFxuXHRcdFx0XHRcdFx0XHRjYXJldEhlaWdodDogdGhpcy5vcHRpb25zLnRvb2x0aXBDYXJldFNpemUsXG5cdFx0XHRcdFx0XHRcdGNvcm5lclJhZGl1czogdGhpcy5vcHRpb25zLnRvb2x0aXBDb3JuZXJSYWRpdXMsXG5cdFx0XHRcdFx0XHRcdHRleHQ6IHRlbXBsYXRlKHRoaXMub3B0aW9ucy50b29sdGlwVGVtcGxhdGUsIEVsZW1lbnQpLFxuXHRcdFx0XHRcdFx0XHRjaGFydDogdGhpcy5jaGFydCxcblx0XHRcdFx0XHRcdFx0Y3VzdG9tOiB0aGlzLm9wdGlvbnMuY3VzdG9tVG9vbHRpcHNcblx0XHRcdFx0XHRcdH0pLmRyYXcoKTtcblx0XHRcdFx0XHR9LCB0aGlzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblx0XHR0b0Jhc2U2NEltYWdlIDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiB0aGlzLmNoYXJ0LmNhbnZhcy50b0RhdGFVUkwuYXBwbHkodGhpcy5jaGFydC5jYW52YXMsIGFyZ3VtZW50cyk7XG5cdFx0fVxuXHR9KTtcblxuXHRDaGFydC5UeXBlLmV4dGVuZCA9IGZ1bmN0aW9uKGV4dGVuc2lvbnMpe1xuXG5cdFx0dmFyIHBhcmVudCA9IHRoaXM7XG5cblx0XHR2YXIgQ2hhcnRUeXBlID0gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBwYXJlbnQuYXBwbHkodGhpcyxhcmd1bWVudHMpO1xuXHRcdH07XG5cblx0XHQvL0NvcHkgdGhlIHByb3RvdHlwZSBvYmplY3Qgb2YgdGhlIHRoaXMgY2xhc3Ncblx0XHRDaGFydFR5cGUucHJvdG90eXBlID0gY2xvbmUocGFyZW50LnByb3RvdHlwZSk7XG5cdFx0Ly9Ob3cgb3ZlcndyaXRlIHNvbWUgb2YgdGhlIHByb3BlcnRpZXMgaW4gdGhlIGJhc2UgY2xhc3Mgd2l0aCB0aGUgbmV3IGV4dGVuc2lvbnNcblx0XHRleHRlbmQoQ2hhcnRUeXBlLnByb3RvdHlwZSwgZXh0ZW5zaW9ucyk7XG5cblx0XHRDaGFydFR5cGUuZXh0ZW5kID0gQ2hhcnQuVHlwZS5leHRlbmQ7XG5cblx0XHRpZiAoZXh0ZW5zaW9ucy5uYW1lIHx8IHBhcmVudC5wcm90b3R5cGUubmFtZSl7XG5cblx0XHRcdHZhciBjaGFydE5hbWUgPSBleHRlbnNpb25zLm5hbWUgfHwgcGFyZW50LnByb3RvdHlwZS5uYW1lO1xuXHRcdFx0Ly9Bc3NpZ24gYW55IHBvdGVudGlhbCBkZWZhdWx0IHZhbHVlcyBvZiB0aGUgbmV3IGNoYXJ0IHR5cGVcblxuXHRcdFx0Ly9JZiBub25lIGFyZSBkZWZpbmVkLCB3ZSdsbCB1c2UgYSBjbG9uZSBvZiB0aGUgY2hhcnQgdHlwZSB0aGlzIGlzIGJlaW5nIGV4dGVuZGVkIGZyb20uXG5cdFx0XHQvL0kuZS4gaWYgd2UgZXh0ZW5kIGEgbGluZSBjaGFydCwgd2UnbGwgdXNlIHRoZSBkZWZhdWx0cyBmcm9tIHRoZSBsaW5lIGNoYXJ0IGlmIG91ciBuZXcgY2hhcnRcblx0XHRcdC8vZG9lc24ndCBkZWZpbmUgc29tZSBkZWZhdWx0cyBvZiB0aGVpciBvd24uXG5cblx0XHRcdHZhciBiYXNlRGVmYXVsdHMgPSAoQ2hhcnQuZGVmYXVsdHNbcGFyZW50LnByb3RvdHlwZS5uYW1lXSkgPyBjbG9uZShDaGFydC5kZWZhdWx0c1twYXJlbnQucHJvdG90eXBlLm5hbWVdKSA6IHt9O1xuXG5cdFx0XHRDaGFydC5kZWZhdWx0c1tjaGFydE5hbWVdID0gZXh0ZW5kKGJhc2VEZWZhdWx0cyxleHRlbnNpb25zLmRlZmF1bHRzKTtcblxuXHRcdFx0Q2hhcnQudHlwZXNbY2hhcnROYW1lXSA9IENoYXJ0VHlwZTtcblxuXHRcdFx0Ly9SZWdpc3RlciB0aGlzIG5ldyBjaGFydCB0eXBlIGluIHRoZSBDaGFydCBwcm90b3R5cGVcblx0XHRcdENoYXJ0LnByb3RvdHlwZVtjaGFydE5hbWVdID0gZnVuY3Rpb24oZGF0YSxvcHRpb25zKXtcblx0XHRcdFx0dmFyIGNvbmZpZyA9IG1lcmdlKENoYXJ0LmRlZmF1bHRzLmdsb2JhbCwgQ2hhcnQuZGVmYXVsdHNbY2hhcnROYW1lXSwgb3B0aW9ucyB8fCB7fSk7XG5cdFx0XHRcdHJldHVybiBuZXcgQ2hhcnRUeXBlKGRhdGEsY29uZmlnLHRoaXMpO1xuXHRcdFx0fTtcblx0XHR9IGVsc2V7XG5cdFx0XHR3YXJuKFwiTmFtZSBub3QgcHJvdmlkZWQgZm9yIHRoaXMgY2hhcnQsIHNvIGl0IGhhc24ndCBiZWVuIHJlZ2lzdGVyZWRcIik7XG5cdFx0fVxuXHRcdHJldHVybiBwYXJlbnQ7XG5cdH07XG5cblx0Q2hhcnQuRWxlbWVudCA9IGZ1bmN0aW9uKGNvbmZpZ3VyYXRpb24pe1xuXHRcdGV4dGVuZCh0aGlzLGNvbmZpZ3VyYXRpb24pO1xuXHRcdHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLGFyZ3VtZW50cyk7XG5cdFx0dGhpcy5zYXZlKCk7XG5cdH07XG5cdGV4dGVuZChDaGFydC5FbGVtZW50LnByb3RvdHlwZSx7XG5cdFx0aW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCl7fSxcblx0XHRyZXN0b3JlIDogZnVuY3Rpb24ocHJvcHMpe1xuXHRcdFx0aWYgKCFwcm9wcyl7XG5cdFx0XHRcdGV4dGVuZCh0aGlzLHRoaXMuX3NhdmVkKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGVhY2gocHJvcHMsZnVuY3Rpb24oa2V5KXtcblx0XHRcdFx0XHR0aGlzW2tleV0gPSB0aGlzLl9zYXZlZFtrZXldO1xuXHRcdFx0XHR9LHRoaXMpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblx0XHRzYXZlIDogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuX3NhdmVkID0gY2xvbmUodGhpcyk7XG5cdFx0XHRkZWxldGUgdGhpcy5fc2F2ZWQuX3NhdmVkO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblx0XHR1cGRhdGUgOiBmdW5jdGlvbihuZXdQcm9wcyl7XG5cdFx0XHRlYWNoKG5ld1Byb3BzLGZ1bmN0aW9uKHZhbHVlLGtleSl7XG5cdFx0XHRcdHRoaXMuX3NhdmVkW2tleV0gPSB0aGlzW2tleV07XG5cdFx0XHRcdHRoaXNba2V5XSA9IHZhbHVlO1xuXHRcdFx0fSx0aGlzKTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cdFx0dHJhbnNpdGlvbiA6IGZ1bmN0aW9uKHByb3BzLGVhc2Upe1xuXHRcdFx0ZWFjaChwcm9wcyxmdW5jdGlvbih2YWx1ZSxrZXkpe1xuXHRcdFx0XHR0aGlzW2tleV0gPSAoKHZhbHVlIC0gdGhpcy5fc2F2ZWRba2V5XSkgKiBlYXNlKSArIHRoaXMuX3NhdmVkW2tleV07XG5cdFx0XHR9LHRoaXMpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblx0XHR0b29sdGlwUG9zaXRpb24gOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0eCA6IHRoaXMueCxcblx0XHRcdFx0eSA6IHRoaXMueVxuXHRcdFx0fTtcblx0XHR9LFxuXHRcdGhhc1ZhbHVlOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIGlzTnVtYmVyKHRoaXMudmFsdWUpO1xuXHRcdH1cblx0fSk7XG5cblx0Q2hhcnQuRWxlbWVudC5leHRlbmQgPSBpbmhlcml0cztcblxuXG5cdENoYXJ0LlBvaW50ID0gQ2hhcnQuRWxlbWVudC5leHRlbmQoe1xuXHRcdGRpc3BsYXk6IHRydWUsXG5cdFx0aW5SYW5nZTogZnVuY3Rpb24oY2hhcnRYLGNoYXJ0WSl7XG5cdFx0XHR2YXIgaGl0RGV0ZWN0aW9uUmFuZ2UgPSB0aGlzLmhpdERldGVjdGlvblJhZGl1cyArIHRoaXMucmFkaXVzO1xuXHRcdFx0cmV0dXJuICgoTWF0aC5wb3coY2hhcnRYLXRoaXMueCwgMikrTWF0aC5wb3coY2hhcnRZLXRoaXMueSwgMikpIDwgTWF0aC5wb3coaGl0RGV0ZWN0aW9uUmFuZ2UsMikpO1xuXHRcdH0sXG5cdFx0ZHJhdyA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRpZiAodGhpcy5kaXNwbGF5KXtcblx0XHRcdFx0dmFyIGN0eCA9IHRoaXMuY3R4O1xuXHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cblx0XHRcdFx0Y3R4LmFyYyh0aGlzLngsIHRoaXMueSwgdGhpcy5yYWRpdXMsIDAsIE1hdGguUEkqMik7XG5cdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcblxuXHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnN0cm9rZUNvbG9yO1xuXHRcdFx0XHRjdHgubGluZVdpZHRoID0gdGhpcy5zdHJva2VXaWR0aDtcblxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsQ29sb3I7XG5cblx0XHRcdFx0Y3R4LmZpbGwoKTtcblx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xuXHRcdFx0fVxuXG5cblx0XHRcdC8vUXVpY2sgZGVidWcgZm9yIGJlemllciBjdXJ2ZSBzcGxpbmluZ1xuXHRcdFx0Ly9IaWdobGlnaHRzIGNvbnRyb2wgcG9pbnRzIGFuZCB0aGUgbGluZSBiZXR3ZWVuIHRoZW0uXG5cdFx0XHQvL0hhbmR5IGZvciBkZXYgLSBzdHJpcHBlZCBpbiB0aGUgbWluIHZlcnNpb24uXG5cblx0XHRcdC8vIGN0eC5zYXZlKCk7XG5cdFx0XHQvLyBjdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xuXHRcdFx0Ly8gY3R4LnN0cm9rZVN0eWxlID0gXCJibGFja1wiXG5cdFx0XHQvLyBjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHQvLyBjdHguYXJjKHRoaXMuY29udHJvbFBvaW50cy5pbm5lci54LHRoaXMuY29udHJvbFBvaW50cy5pbm5lci55LCAyLCAwLCBNYXRoLlBJKjIpO1xuXHRcdFx0Ly8gY3R4LmZpbGwoKTtcblxuXHRcdFx0Ly8gY3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0Ly8gY3R4LmFyYyh0aGlzLmNvbnRyb2xQb2ludHMub3V0ZXIueCx0aGlzLmNvbnRyb2xQb2ludHMub3V0ZXIueSwgMiwgMCwgTWF0aC5QSSoyKTtcblx0XHRcdC8vIGN0eC5maWxsKCk7XG5cblx0XHRcdC8vIGN0eC5tb3ZlVG8odGhpcy5jb250cm9sUG9pbnRzLmlubmVyLngsdGhpcy5jb250cm9sUG9pbnRzLmlubmVyLnkpO1xuXHRcdFx0Ly8gY3R4LmxpbmVUbyh0aGlzLngsIHRoaXMueSk7XG5cdFx0XHQvLyBjdHgubGluZVRvKHRoaXMuY29udHJvbFBvaW50cy5vdXRlci54LHRoaXMuY29udHJvbFBvaW50cy5vdXRlci55KTtcblx0XHRcdC8vIGN0eC5zdHJva2UoKTtcblxuXHRcdFx0Ly8gY3R4LnJlc3RvcmUoKTtcblxuXG5cblx0XHR9XG5cdH0pO1xuXG5cdENoYXJ0LkFyYyA9IENoYXJ0LkVsZW1lbnQuZXh0ZW5kKHtcblx0XHRpblJhbmdlIDogZnVuY3Rpb24oY2hhcnRYLGNoYXJ0WSl7XG5cblx0XHRcdHZhciBwb2ludFJlbGF0aXZlUG9zaXRpb24gPSBoZWxwZXJzLmdldEFuZ2xlRnJvbVBvaW50KHRoaXMsIHtcblx0XHRcdFx0eDogY2hhcnRYLFxuXHRcdFx0XHR5OiBjaGFydFlcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBOb3JtYWxpemUgYWxsIGFuZ2xlcyB0byAwIC0gMipQSSAoMCAtIDM2MMKwKVxuXHRcdFx0dmFyIHBvaW50UmVsYXRpdmVBbmdsZSA9IHBvaW50UmVsYXRpdmVQb3NpdGlvbi5hbmdsZSAlIChNYXRoLlBJICogMiksXG5cdFx0XHQgICAgc3RhcnRBbmdsZSA9IChNYXRoLlBJICogMiArIHRoaXMuc3RhcnRBbmdsZSkgJSAoTWF0aC5QSSAqIDIpLFxuXHRcdFx0ICAgIGVuZEFuZ2xlID0gKE1hdGguUEkgKiAyICsgdGhpcy5lbmRBbmdsZSkgJSAoTWF0aC5QSSAqIDIpIHx8IDM2MDtcblxuXHRcdFx0Ly8gQ2FsY3VsYXRlIHdldGhlciB0aGUgcG9pbnRSZWxhdGl2ZUFuZ2xlIGlzIGJldHdlZW4gdGhlIHN0YXJ0IGFuZCB0aGUgZW5kIGFuZ2xlXG5cdFx0XHR2YXIgYmV0d2VlbkFuZ2xlcyA9IChlbmRBbmdsZSA8IHN0YXJ0QW5nbGUpID9cblx0XHRcdFx0cG9pbnRSZWxhdGl2ZUFuZ2xlIDw9IGVuZEFuZ2xlIHx8IHBvaW50UmVsYXRpdmVBbmdsZSA+PSBzdGFydEFuZ2xlOlxuXHRcdFx0XHRwb2ludFJlbGF0aXZlQW5nbGUgPj0gc3RhcnRBbmdsZSAmJiBwb2ludFJlbGF0aXZlQW5nbGUgPD0gZW5kQW5nbGU7XG5cblx0XHRcdC8vQ2hlY2sgaWYgd2l0aGluIHRoZSByYW5nZSBvZiB0aGUgb3Blbi9jbG9zZSBhbmdsZVxuXHRcdFx0dmFyIHdpdGhpblJhZGl1cyA9IChwb2ludFJlbGF0aXZlUG9zaXRpb24uZGlzdGFuY2UgPj0gdGhpcy5pbm5lclJhZGl1cyAmJiBwb2ludFJlbGF0aXZlUG9zaXRpb24uZGlzdGFuY2UgPD0gdGhpcy5vdXRlclJhZGl1cyk7XG5cblx0XHRcdHJldHVybiAoYmV0d2VlbkFuZ2xlcyAmJiB3aXRoaW5SYWRpdXMpO1xuXHRcdFx0Ly9FbnN1cmUgd2l0aGluIHRoZSBvdXRzaWRlIG9mIHRoZSBhcmMgY2VudHJlLCBidXQgaW5zaWRlIGFyYyBvdXRlclxuXHRcdH0sXG5cdFx0dG9vbHRpcFBvc2l0aW9uIDogZnVuY3Rpb24oKXtcblx0XHRcdHZhciBjZW50cmVBbmdsZSA9IHRoaXMuc3RhcnRBbmdsZSArICgodGhpcy5lbmRBbmdsZSAtIHRoaXMuc3RhcnRBbmdsZSkgLyAyKSxcblx0XHRcdFx0cmFuZ2VGcm9tQ2VudHJlID0gKHRoaXMub3V0ZXJSYWRpdXMgLSB0aGlzLmlubmVyUmFkaXVzKSAvIDIgKyB0aGlzLmlubmVyUmFkaXVzO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0eCA6IHRoaXMueCArIChNYXRoLmNvcyhjZW50cmVBbmdsZSkgKiByYW5nZUZyb21DZW50cmUpLFxuXHRcdFx0XHR5IDogdGhpcy55ICsgKE1hdGguc2luKGNlbnRyZUFuZ2xlKSAqIHJhbmdlRnJvbUNlbnRyZSlcblx0XHRcdH07XG5cdFx0fSxcblx0XHRkcmF3IDogZnVuY3Rpb24oYW5pbWF0aW9uUGVyY2VudCl7XG5cblx0XHRcdHZhciBlYXNpbmdEZWNpbWFsID0gYW5pbWF0aW9uUGVyY2VudCB8fCAxO1xuXG5cdFx0XHR2YXIgY3R4ID0gdGhpcy5jdHg7XG5cblx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblxuXHRcdFx0Y3R4LmFyYyh0aGlzLngsIHRoaXMueSwgdGhpcy5vdXRlclJhZGl1cyA8IDAgPyAwIDogdGhpcy5vdXRlclJhZGl1cywgdGhpcy5zdGFydEFuZ2xlLCB0aGlzLmVuZEFuZ2xlKTtcblxuICAgICAgICAgICAgY3R4LmFyYyh0aGlzLngsIHRoaXMueSwgdGhpcy5pbm5lclJhZGl1cyA8IDAgPyAwIDogdGhpcy5pbm5lclJhZGl1cywgdGhpcy5lbmRBbmdsZSwgdGhpcy5zdGFydEFuZ2xlLCB0cnVlKTtcblxuXHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gdGhpcy5zdHJva2VDb2xvcjtcblx0XHRcdGN0eC5saW5lV2lkdGggPSB0aGlzLnN0cm9rZVdpZHRoO1xuXG5cdFx0XHRjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsQ29sb3I7XG5cblx0XHRcdGN0eC5maWxsKCk7XG5cdFx0XHRjdHgubGluZUpvaW4gPSAnYmV2ZWwnO1xuXG5cdFx0XHRpZiAodGhpcy5zaG93U3Ryb2tlKXtcblx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0Q2hhcnQuUmVjdGFuZ2xlID0gQ2hhcnQuRWxlbWVudC5leHRlbmQoe1xuXHRcdGRyYXcgOiBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIGN0eCA9IHRoaXMuY3R4LFxuXHRcdFx0XHRoYWxmV2lkdGggPSB0aGlzLndpZHRoLzIsXG5cdFx0XHRcdGxlZnRYID0gdGhpcy54IC0gaGFsZldpZHRoLFxuXHRcdFx0XHRyaWdodFggPSB0aGlzLnggKyBoYWxmV2lkdGgsXG5cdFx0XHRcdHRvcCA9IHRoaXMuYmFzZSAtICh0aGlzLmJhc2UgLSB0aGlzLnkpLFxuXHRcdFx0XHRoYWxmU3Ryb2tlID0gdGhpcy5zdHJva2VXaWR0aCAvIDI7XG5cblx0XHRcdC8vIENhbnZhcyBkb2Vzbid0IGFsbG93IHVzIHRvIHN0cm9rZSBpbnNpZGUgdGhlIHdpZHRoIHNvIHdlIGNhblxuXHRcdFx0Ly8gYWRqdXN0IHRoZSBzaXplcyB0byBmaXQgaWYgd2UncmUgc2V0dGluZyBhIHN0cm9rZSBvbiB0aGUgbGluZVxuXHRcdFx0aWYgKHRoaXMuc2hvd1N0cm9rZSl7XG5cdFx0XHRcdGxlZnRYICs9IGhhbGZTdHJva2U7XG5cdFx0XHRcdHJpZ2h0WCAtPSBoYWxmU3Ryb2tlO1xuXHRcdFx0XHR0b3AgKz0gaGFsZlN0cm9rZTtcblx0XHRcdH1cblxuXHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXG5cdFx0XHRjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsQ29sb3I7XG5cdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnN0cm9rZUNvbG9yO1xuXHRcdFx0Y3R4LmxpbmVXaWR0aCA9IHRoaXMuc3Ryb2tlV2lkdGg7XG5cblx0XHRcdC8vIEl0J2QgYmUgbmljZSB0byBrZWVwIHRoaXMgY2xhc3MgdG90YWxseSBnZW5lcmljIHRvIGFueSByZWN0YW5nbGVcblx0XHRcdC8vIGFuZCBzaW1wbHkgc3BlY2lmeSB3aGljaCBib3JkZXIgdG8gbWlzcyBvdXQuXG5cdFx0XHRjdHgubW92ZVRvKGxlZnRYLCB0aGlzLmJhc2UpO1xuXHRcdFx0Y3R4LmxpbmVUbyhsZWZ0WCwgdG9wKTtcblx0XHRcdGN0eC5saW5lVG8ocmlnaHRYLCB0b3ApO1xuXHRcdFx0Y3R4LmxpbmVUbyhyaWdodFgsIHRoaXMuYmFzZSk7XG5cdFx0XHRjdHguZmlsbCgpO1xuXHRcdFx0aWYgKHRoaXMuc2hvd1N0cm9rZSl7XG5cdFx0XHRcdGN0eC5zdHJva2UoKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGhlaWdodCA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gdGhpcy5iYXNlIC0gdGhpcy55O1xuXHRcdH0sXG5cdFx0aW5SYW5nZSA6IGZ1bmN0aW9uKGNoYXJ0WCxjaGFydFkpe1xuXHRcdFx0cmV0dXJuIChjaGFydFggPj0gdGhpcy54IC0gdGhpcy53aWR0aC8yICYmIGNoYXJ0WCA8PSB0aGlzLnggKyB0aGlzLndpZHRoLzIpICYmIChjaGFydFkgPj0gdGhpcy55ICYmIGNoYXJ0WSA8PSB0aGlzLmJhc2UpO1xuXHRcdH1cblx0fSk7XG5cblx0Q2hhcnQuQW5pbWF0aW9uID0gQ2hhcnQuRWxlbWVudC5leHRlbmQoe1xuXHRcdGN1cnJlbnRTdGVwOiBudWxsLCAvLyB0aGUgY3VycmVudCBhbmltYXRpb24gc3RlcFxuXHRcdG51bVN0ZXBzOiA2MCwgLy8gZGVmYXVsdCBudW1iZXIgb2Ygc3RlcHNcblx0XHRlYXNpbmc6IFwiXCIsIC8vIHRoZSBlYXNpbmcgdG8gdXNlIGZvciB0aGlzIGFuaW1hdGlvblxuXHRcdHJlbmRlcjogbnVsbCwgLy8gcmVuZGVyIGZ1bmN0aW9uIHVzZWQgYnkgdGhlIGFuaW1hdGlvbiBzZXJ2aWNlXG5cdFx0XG5cdFx0b25BbmltYXRpb25Qcm9ncmVzczogbnVsbCwgLy8gdXNlciBzcGVjaWZpZWQgY2FsbGJhY2sgdG8gZmlyZSBvbiBlYWNoIHN0ZXAgb2YgdGhlIGFuaW1hdGlvbiBcblx0XHRvbkFuaW1hdGlvbkNvbXBsZXRlOiBudWxsLCAvLyB1c2VyIHNwZWNpZmllZCBjYWxsYmFjayB0byBmaXJlIHdoZW4gdGhlIGFuaW1hdGlvbiBmaW5pc2hlc1xuXHR9KTtcblx0XG5cdENoYXJ0LlRvb2x0aXAgPSBDaGFydC5FbGVtZW50LmV4dGVuZCh7XG5cdFx0ZHJhdyA6IGZ1bmN0aW9uKCl7XG5cblx0XHRcdHZhciBjdHggPSB0aGlzLmNoYXJ0LmN0eDtcblxuXHRcdFx0Y3R4LmZvbnQgPSBmb250U3RyaW5nKHRoaXMuZm9udFNpemUsdGhpcy5mb250U3R5bGUsdGhpcy5mb250RmFtaWx5KTtcblxuXHRcdFx0dGhpcy54QWxpZ24gPSBcImNlbnRlclwiO1xuXHRcdFx0dGhpcy55QWxpZ24gPSBcImFib3ZlXCI7XG5cblx0XHRcdC8vRGlzdGFuY2UgYmV0d2VlbiB0aGUgYWN0dWFsIGVsZW1lbnQueSBwb3NpdGlvbiBhbmQgdGhlIHN0YXJ0IG9mIHRoZSB0b29sdGlwIGNhcmV0XG5cdFx0XHR2YXIgY2FyZXRQYWRkaW5nID0gdGhpcy5jYXJldFBhZGRpbmcgPSAyO1xuXG5cdFx0XHR2YXIgdG9vbHRpcFdpZHRoID0gY3R4Lm1lYXN1cmVUZXh0KHRoaXMudGV4dCkud2lkdGggKyAyKnRoaXMueFBhZGRpbmcsXG5cdFx0XHRcdHRvb2x0aXBSZWN0SGVpZ2h0ID0gdGhpcy5mb250U2l6ZSArIDIqdGhpcy55UGFkZGluZyxcblx0XHRcdFx0dG9vbHRpcEhlaWdodCA9IHRvb2x0aXBSZWN0SGVpZ2h0ICsgdGhpcy5jYXJldEhlaWdodCArIGNhcmV0UGFkZGluZztcblxuXHRcdFx0aWYgKHRoaXMueCArIHRvb2x0aXBXaWR0aC8yID50aGlzLmNoYXJ0LndpZHRoKXtcblx0XHRcdFx0dGhpcy54QWxpZ24gPSBcImxlZnRcIjtcblx0XHRcdH0gZWxzZSBpZiAodGhpcy54IC0gdG9vbHRpcFdpZHRoLzIgPCAwKXtcblx0XHRcdFx0dGhpcy54QWxpZ24gPSBcInJpZ2h0XCI7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLnkgLSB0b29sdGlwSGVpZ2h0IDwgMCl7XG5cdFx0XHRcdHRoaXMueUFsaWduID0gXCJiZWxvd1wiO1xuXHRcdFx0fVxuXG5cblx0XHRcdHZhciB0b29sdGlwWCA9IHRoaXMueCAtIHRvb2x0aXBXaWR0aC8yLFxuXHRcdFx0XHR0b29sdGlwWSA9IHRoaXMueSAtIHRvb2x0aXBIZWlnaHQ7XG5cblx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGxDb2xvcjtcblxuXHRcdFx0Ly8gQ3VzdG9tIFRvb2x0aXBzXG5cdFx0XHRpZih0aGlzLmN1c3RvbSl7XG5cdFx0XHRcdHRoaXMuY3VzdG9tKHRoaXMpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZXtcblx0XHRcdFx0c3dpdGNoKHRoaXMueUFsaWduKVxuXHRcdFx0XHR7XG5cdFx0XHRcdGNhc2UgXCJhYm92ZVwiOlxuXHRcdFx0XHRcdC8vRHJhdyBhIGNhcmV0IGFib3ZlIHRoZSB4L3lcblx0XHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0Y3R4Lm1vdmVUbyh0aGlzLngsdGhpcy55IC0gY2FyZXRQYWRkaW5nKTtcblx0XHRcdFx0XHRjdHgubGluZVRvKHRoaXMueCArIHRoaXMuY2FyZXRIZWlnaHQsIHRoaXMueSAtIChjYXJldFBhZGRpbmcgKyB0aGlzLmNhcmV0SGVpZ2h0KSk7XG5cdFx0XHRcdFx0Y3R4LmxpbmVUbyh0aGlzLnggLSB0aGlzLmNhcmV0SGVpZ2h0LCB0aGlzLnkgLSAoY2FyZXRQYWRkaW5nICsgdGhpcy5jYXJldEhlaWdodCkpO1xuXHRcdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcblx0XHRcdFx0XHRjdHguZmlsbCgpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwiYmVsb3dcIjpcblx0XHRcdFx0XHR0b29sdGlwWSA9IHRoaXMueSArIGNhcmV0UGFkZGluZyArIHRoaXMuY2FyZXRIZWlnaHQ7XG5cdFx0XHRcdFx0Ly9EcmF3IGEgY2FyZXQgYmVsb3cgdGhlIHgveVxuXHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHRjdHgubW92ZVRvKHRoaXMueCwgdGhpcy55ICsgY2FyZXRQYWRkaW5nKTtcblx0XHRcdFx0XHRjdHgubGluZVRvKHRoaXMueCArIHRoaXMuY2FyZXRIZWlnaHQsIHRoaXMueSArIGNhcmV0UGFkZGluZyArIHRoaXMuY2FyZXRIZWlnaHQpO1xuXHRcdFx0XHRcdGN0eC5saW5lVG8odGhpcy54IC0gdGhpcy5jYXJldEhlaWdodCwgdGhpcy55ICsgY2FyZXRQYWRkaW5nICsgdGhpcy5jYXJldEhlaWdodCk7XG5cdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRcdGN0eC5maWxsKCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzd2l0Y2godGhpcy54QWxpZ24pXG5cdFx0XHRcdHtcblx0XHRcdFx0Y2FzZSBcImxlZnRcIjpcblx0XHRcdFx0XHR0b29sdGlwWCA9IHRoaXMueCAtIHRvb2x0aXBXaWR0aCArICh0aGlzLmNvcm5lclJhZGl1cyArIHRoaXMuY2FyZXRIZWlnaHQpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwicmlnaHRcIjpcblx0XHRcdFx0XHR0b29sdGlwWCA9IHRoaXMueCAtICh0aGlzLmNvcm5lclJhZGl1cyArIHRoaXMuY2FyZXRIZWlnaHQpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZHJhd1JvdW5kZWRSZWN0YW5nbGUoY3R4LHRvb2x0aXBYLHRvb2x0aXBZLHRvb2x0aXBXaWR0aCx0b29sdGlwUmVjdEhlaWdodCx0aGlzLmNvcm5lclJhZGl1cyk7XG5cblx0XHRcdFx0Y3R4LmZpbGwoKTtcblxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gdGhpcy50ZXh0Q29sb3I7XG5cdFx0XHRcdGN0eC50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xuXHRcdFx0XHRjdHgudGV4dEJhc2VsaW5lID0gXCJtaWRkbGVcIjtcblx0XHRcdFx0Y3R4LmZpbGxUZXh0KHRoaXMudGV4dCwgdG9vbHRpcFggKyB0b29sdGlwV2lkdGgvMiwgdG9vbHRpcFkgKyB0b29sdGlwUmVjdEhlaWdodC8yKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cdENoYXJ0Lk11bHRpVG9vbHRpcCA9IENoYXJ0LkVsZW1lbnQuZXh0ZW5kKHtcblx0XHRpbml0aWFsaXplIDogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuZm9udCA9IGZvbnRTdHJpbmcodGhpcy5mb250U2l6ZSx0aGlzLmZvbnRTdHlsZSx0aGlzLmZvbnRGYW1pbHkpO1xuXG5cdFx0XHR0aGlzLnRpdGxlRm9udCA9IGZvbnRTdHJpbmcodGhpcy50aXRsZUZvbnRTaXplLHRoaXMudGl0bGVGb250U3R5bGUsdGhpcy50aXRsZUZvbnRGYW1pbHkpO1xuXG5cdFx0XHR0aGlzLnRpdGxlSGVpZ2h0ID0gdGhpcy50aXRsZSA/IHRoaXMudGl0bGVGb250U2l6ZSAqIDEuNSA6IDA7XG5cdFx0XHR0aGlzLmhlaWdodCA9ICh0aGlzLmxhYmVscy5sZW5ndGggKiB0aGlzLmZvbnRTaXplKSArICgodGhpcy5sYWJlbHMubGVuZ3RoLTEpICogKHRoaXMuZm9udFNpemUvMikpICsgKHRoaXMueVBhZGRpbmcqMikgKyB0aGlzLnRpdGxlSGVpZ2h0O1xuXG5cdFx0XHR0aGlzLmN0eC5mb250ID0gdGhpcy50aXRsZUZvbnQ7XG5cblx0XHRcdHZhciB0aXRsZVdpZHRoID0gdGhpcy5jdHgubWVhc3VyZVRleHQodGhpcy50aXRsZSkud2lkdGgsXG5cdFx0XHRcdC8vTGFiZWwgaGFzIGEgbGVnZW5kIHNxdWFyZSBhcyB3ZWxsIHNvIGFjY291bnQgZm9yIHRoaXMuXG5cdFx0XHRcdGxhYmVsV2lkdGggPSBsb25nZXN0VGV4dCh0aGlzLmN0eCx0aGlzLmZvbnQsdGhpcy5sYWJlbHMpICsgdGhpcy5mb250U2l6ZSArIDMsXG5cdFx0XHRcdGxvbmdlc3RUZXh0V2lkdGggPSBtYXgoW2xhYmVsV2lkdGgsdGl0bGVXaWR0aF0pO1xuXG5cdFx0XHR0aGlzLndpZHRoID0gbG9uZ2VzdFRleHRXaWR0aCArICh0aGlzLnhQYWRkaW5nKjIpO1xuXG5cblx0XHRcdHZhciBoYWxmSGVpZ2h0ID0gdGhpcy5oZWlnaHQvMjtcblxuXHRcdFx0Ly9DaGVjayB0byBlbnN1cmUgdGhlIGhlaWdodCB3aWxsIGZpdCBvbiB0aGUgY2FudmFzXG5cdFx0XHRpZiAodGhpcy55IC0gaGFsZkhlaWdodCA8IDAgKXtcblx0XHRcdFx0dGhpcy55ID0gaGFsZkhlaWdodDtcblx0XHRcdH0gZWxzZSBpZiAodGhpcy55ICsgaGFsZkhlaWdodCA+IHRoaXMuY2hhcnQuaGVpZ2h0KXtcblx0XHRcdFx0dGhpcy55ID0gdGhpcy5jaGFydC5oZWlnaHQgLSBoYWxmSGVpZ2h0O1xuXHRcdFx0fVxuXG5cdFx0XHQvL0RlY2lkZSB3aGV0aGVyIHRvIGFsaWduIGxlZnQgb3IgcmlnaHQgYmFzZWQgb24gcG9zaXRpb24gb24gY2FudmFzXG5cdFx0XHRpZiAodGhpcy54ID4gdGhpcy5jaGFydC53aWR0aC8yKXtcblx0XHRcdFx0dGhpcy54IC09IHRoaXMueE9mZnNldCArIHRoaXMud2lkdGg7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnggKz0gdGhpcy54T2Zmc2V0O1xuXHRcdFx0fVxuXG5cblx0XHR9LFxuXHRcdGdldExpbmVIZWlnaHQgOiBmdW5jdGlvbihpbmRleCl7XG5cdFx0XHR2YXIgYmFzZUxpbmVIZWlnaHQgPSB0aGlzLnkgLSAodGhpcy5oZWlnaHQvMikgKyB0aGlzLnlQYWRkaW5nLFxuXHRcdFx0XHRhZnRlclRpdGxlSW5kZXggPSBpbmRleC0xO1xuXG5cdFx0XHQvL0lmIHRoZSBpbmRleCBpcyB6ZXJvLCB3ZSdyZSBnZXR0aW5nIHRoZSB0aXRsZVxuXHRcdFx0aWYgKGluZGV4ID09PSAwKXtcblx0XHRcdFx0cmV0dXJuIGJhc2VMaW5lSGVpZ2h0ICsgdGhpcy50aXRsZUhlaWdodCAvIDM7XG5cdFx0XHR9IGVsc2V7XG5cdFx0XHRcdHJldHVybiBiYXNlTGluZUhlaWdodCArICgodGhpcy5mb250U2l6ZSAqIDEuNSAqIGFmdGVyVGl0bGVJbmRleCkgKyB0aGlzLmZvbnRTaXplIC8gMikgKyB0aGlzLnRpdGxlSGVpZ2h0O1xuXHRcdFx0fVxuXG5cdFx0fSxcblx0XHRkcmF3IDogZnVuY3Rpb24oKXtcblx0XHRcdC8vIEN1c3RvbSBUb29sdGlwc1xuXHRcdFx0aWYodGhpcy5jdXN0b20pe1xuXHRcdFx0XHR0aGlzLmN1c3RvbSh0aGlzKTtcblx0XHRcdH1cblx0XHRcdGVsc2V7XG5cdFx0XHRcdGRyYXdSb3VuZGVkUmVjdGFuZ2xlKHRoaXMuY3R4LHRoaXMueCx0aGlzLnkgLSB0aGlzLmhlaWdodC8yLHRoaXMud2lkdGgsdGhpcy5oZWlnaHQsdGhpcy5jb3JuZXJSYWRpdXMpO1xuXHRcdFx0XHR2YXIgY3R4ID0gdGhpcy5jdHg7XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGxDb2xvcjtcblx0XHRcdFx0Y3R4LmZpbGwoKTtcblx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXG5cdFx0XHRcdGN0eC50ZXh0QWxpZ24gPSBcImxlZnRcIjtcblx0XHRcdFx0Y3R4LnRleHRCYXNlbGluZSA9IFwibWlkZGxlXCI7XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLnRpdGxlVGV4dENvbG9yO1xuXHRcdFx0XHRjdHguZm9udCA9IHRoaXMudGl0bGVGb250O1xuXG5cdFx0XHRcdGN0eC5maWxsVGV4dCh0aGlzLnRpdGxlLHRoaXMueCArIHRoaXMueFBhZGRpbmcsIHRoaXMuZ2V0TGluZUhlaWdodCgwKSk7XG5cblx0XHRcdFx0Y3R4LmZvbnQgPSB0aGlzLmZvbnQ7XG5cdFx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLmxhYmVscyxmdW5jdGlvbihsYWJlbCxpbmRleCl7XG5cdFx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHRoaXMudGV4dENvbG9yO1xuXHRcdFx0XHRcdGN0eC5maWxsVGV4dChsYWJlbCx0aGlzLnggKyB0aGlzLnhQYWRkaW5nICsgdGhpcy5mb250U2l6ZSArIDMsIHRoaXMuZ2V0TGluZUhlaWdodChpbmRleCArIDEpKTtcblxuXHRcdFx0XHRcdC8vQSBiaXQgZ25hcmx5LCBidXQgY2xlYXJpbmcgdGhpcyByZWN0YW5nbGUgYnJlYWtzIHdoZW4gdXNpbmcgZXhwbG9yZXJjYW52YXMgKGNsZWFycyB3aG9sZSBjYW52YXMpXG5cdFx0XHRcdFx0Ly9jdHguY2xlYXJSZWN0KHRoaXMueCArIHRoaXMueFBhZGRpbmcsIHRoaXMuZ2V0TGluZUhlaWdodChpbmRleCArIDEpIC0gdGhpcy5mb250U2l6ZS8yLCB0aGlzLmZvbnRTaXplLCB0aGlzLmZvbnRTaXplKTtcblx0XHRcdFx0XHQvL0luc3RlYWQgd2UnbGwgbWFrZSBhIHdoaXRlIGZpbGxlZCBibG9jayB0byBwdXQgdGhlIGxlZ2VuZENvbG91ciBwYWxldHRlIG92ZXIuXG5cblx0XHRcdFx0XHRjdHguZmlsbFN0eWxlID0gdGhpcy5sZWdlbmRDb2xvckJhY2tncm91bmQ7XG5cdFx0XHRcdFx0Y3R4LmZpbGxSZWN0KHRoaXMueCArIHRoaXMueFBhZGRpbmcsIHRoaXMuZ2V0TGluZUhlaWdodChpbmRleCArIDEpIC0gdGhpcy5mb250U2l6ZS8yLCB0aGlzLmZvbnRTaXplLCB0aGlzLmZvbnRTaXplKTtcblxuXHRcdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLmxlZ2VuZENvbG9yc1tpbmRleF0uZmlsbDtcblx0XHRcdFx0XHRjdHguZmlsbFJlY3QodGhpcy54ICsgdGhpcy54UGFkZGluZywgdGhpcy5nZXRMaW5lSGVpZ2h0KGluZGV4ICsgMSkgLSB0aGlzLmZvbnRTaXplLzIsIHRoaXMuZm9udFNpemUsIHRoaXMuZm9udFNpemUpO1xuXG5cblx0XHRcdFx0fSx0aGlzKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cdENoYXJ0LlNjYWxlID0gQ2hhcnQuRWxlbWVudC5leHRlbmQoe1xuXHRcdGluaXRpYWxpemUgOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5maXQoKTtcblx0XHR9LFxuXHRcdGJ1aWxkWUxhYmVscyA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLnlMYWJlbHMgPSBbXTtcblxuXHRcdFx0dmFyIHN0ZXBEZWNpbWFsUGxhY2VzID0gZ2V0RGVjaW1hbFBsYWNlcyh0aGlzLnN0ZXBWYWx1ZSk7XG5cblx0XHRcdGZvciAodmFyIGk9MDsgaTw9dGhpcy5zdGVwczsgaSsrKXtcblx0XHRcdFx0dGhpcy55TGFiZWxzLnB1c2godGVtcGxhdGUodGhpcy50ZW1wbGF0ZVN0cmluZyx7dmFsdWU6KHRoaXMubWluICsgKGkgKiB0aGlzLnN0ZXBWYWx1ZSkpLnRvRml4ZWQoc3RlcERlY2ltYWxQbGFjZXMpfSkpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy55TGFiZWxXaWR0aCA9ICh0aGlzLmRpc3BsYXkgJiYgdGhpcy5zaG93TGFiZWxzKSA/IGxvbmdlc3RUZXh0KHRoaXMuY3R4LHRoaXMuZm9udCx0aGlzLnlMYWJlbHMpICsgMTAgOiAwO1xuXHRcdH0sXG5cdFx0YWRkWExhYmVsIDogZnVuY3Rpb24obGFiZWwpe1xuXHRcdFx0dGhpcy54TGFiZWxzLnB1c2gobGFiZWwpO1xuXHRcdFx0dGhpcy52YWx1ZXNDb3VudCsrO1xuXHRcdFx0dGhpcy5maXQoKTtcblx0XHR9LFxuXHRcdHJlbW92ZVhMYWJlbCA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLnhMYWJlbHMuc2hpZnQoKTtcblx0XHRcdHRoaXMudmFsdWVzQ291bnQtLTtcblx0XHRcdHRoaXMuZml0KCk7XG5cdFx0fSxcblx0XHQvLyBGaXR0aW5nIGxvb3AgdG8gcm90YXRlIHggTGFiZWxzIGFuZCBmaWd1cmUgb3V0IHdoYXQgZml0cyB0aGVyZSwgYW5kIGFsc28gY2FsY3VsYXRlIGhvdyBtYW55IFkgc3RlcHMgdG8gdXNlXG5cdFx0Zml0OiBmdW5jdGlvbigpe1xuXHRcdFx0Ly8gRmlyc3Qgd2UgbmVlZCB0aGUgd2lkdGggb2YgdGhlIHlMYWJlbHMsIGFzc3VtaW5nIHRoZSB4TGFiZWxzIGFyZW4ndCByb3RhdGVkXG5cblx0XHRcdC8vIFRvIGRvIHRoYXQgd2UgbmVlZCB0aGUgYmFzZSBsaW5lIGF0IHRoZSB0b3AgYW5kIGJhc2Ugb2YgdGhlIGNoYXJ0LCBhc3N1bWluZyB0aGVyZSBpcyBubyB4IGxhYmVsIHJvdGF0aW9uXG5cdFx0XHR0aGlzLnN0YXJ0UG9pbnQgPSAodGhpcy5kaXNwbGF5KSA/IHRoaXMuZm9udFNpemUgOiAwO1xuXHRcdFx0dGhpcy5lbmRQb2ludCA9ICh0aGlzLmRpc3BsYXkpID8gdGhpcy5oZWlnaHQgLSAodGhpcy5mb250U2l6ZSAqIDEuNSkgLSA1IDogdGhpcy5oZWlnaHQ7IC8vIC01IHRvIHBhZCBsYWJlbHNcblxuXHRcdFx0Ly8gQXBwbHkgcGFkZGluZyBzZXR0aW5ncyB0byB0aGUgc3RhcnQgYW5kIGVuZCBwb2ludC5cblx0XHRcdHRoaXMuc3RhcnRQb2ludCArPSB0aGlzLnBhZGRpbmc7XG5cdFx0XHR0aGlzLmVuZFBvaW50IC09IHRoaXMucGFkZGluZztcblxuXHRcdFx0Ly8gQ2FjaGUgdGhlIHN0YXJ0aW5nIGVuZHBvaW50LCBleGNsdWRpbmcgdGhlIHNwYWNlIGZvciB4IGxhYmVsc1xuXHRcdFx0dmFyIGNhY2hlZEVuZFBvaW50ID0gdGhpcy5lbmRQb2ludDtcblxuXHRcdFx0Ly8gQ2FjaGUgdGhlIHN0YXJ0aW5nIGhlaWdodCwgc28gY2FuIGRldGVybWluZSBpZiB3ZSBuZWVkIHRvIHJlY2FsY3VsYXRlIHRoZSBzY2FsZSB5QXhpc1xuXHRcdFx0dmFyIGNhY2hlZEhlaWdodCA9IHRoaXMuZW5kUG9pbnQgLSB0aGlzLnN0YXJ0UG9pbnQsXG5cdFx0XHRcdGNhY2hlZFlMYWJlbFdpZHRoO1xuXG5cdFx0XHQvLyBCdWlsZCB0aGUgY3VycmVudCB5TGFiZWxzIHNvIHdlIGhhdmUgYW4gaWRlYSBvZiB3aGF0IHNpemUgdGhleSdsbCBiZSB0byBzdGFydFxuXHRcdFx0Lypcblx0XHRcdCAqXHRUaGlzIHNldHMgd2hhdCBpcyByZXR1cm5lZCBmcm9tIGNhbGN1bGF0ZVNjYWxlUmFuZ2UgYXMgc3RhdGljIHByb3BlcnRpZXMgb2YgdGhpcyBjbGFzczpcblx0XHRcdCAqXG5cdFx0XHRcdHRoaXMuc3RlcHM7XG5cdFx0XHRcdHRoaXMuc3RlcFZhbHVlO1xuXHRcdFx0XHR0aGlzLm1pbjtcblx0XHRcdFx0dGhpcy5tYXg7XG5cdFx0XHQgKlxuXHRcdFx0ICovXG5cdFx0XHR0aGlzLmNhbGN1bGF0ZVlSYW5nZShjYWNoZWRIZWlnaHQpO1xuXG5cdFx0XHQvLyBXaXRoIHRoZXNlIHByb3BlcnRpZXMgc2V0IHdlIGNhbiBub3cgYnVpbGQgdGhlIGFycmF5IG9mIHlMYWJlbHNcblx0XHRcdC8vIGFuZCBhbHNvIHRoZSB3aWR0aCBvZiB0aGUgbGFyZ2VzdCB5TGFiZWxcblx0XHRcdHRoaXMuYnVpbGRZTGFiZWxzKCk7XG5cblx0XHRcdHRoaXMuY2FsY3VsYXRlWExhYmVsUm90YXRpb24oKTtcblxuXHRcdFx0d2hpbGUoKGNhY2hlZEhlaWdodCA+IHRoaXMuZW5kUG9pbnQgLSB0aGlzLnN0YXJ0UG9pbnQpKXtcblx0XHRcdFx0Y2FjaGVkSGVpZ2h0ID0gdGhpcy5lbmRQb2ludCAtIHRoaXMuc3RhcnRQb2ludDtcblx0XHRcdFx0Y2FjaGVkWUxhYmVsV2lkdGggPSB0aGlzLnlMYWJlbFdpZHRoO1xuXG5cdFx0XHRcdHRoaXMuY2FsY3VsYXRlWVJhbmdlKGNhY2hlZEhlaWdodCk7XG5cdFx0XHRcdHRoaXMuYnVpbGRZTGFiZWxzKCk7XG5cblx0XHRcdFx0Ly8gT25seSBnbyB0aHJvdWdoIHRoZSB4TGFiZWwgbG9vcCBhZ2FpbiBpZiB0aGUgeUxhYmVsIHdpZHRoIGhhcyBjaGFuZ2VkXG5cdFx0XHRcdGlmIChjYWNoZWRZTGFiZWxXaWR0aCA8IHRoaXMueUxhYmVsV2lkdGgpe1xuXHRcdFx0XHRcdHRoaXMuZW5kUG9pbnQgPSBjYWNoZWRFbmRQb2ludDtcblx0XHRcdFx0XHR0aGlzLmNhbGN1bGF0ZVhMYWJlbFJvdGF0aW9uKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdH0sXG5cdFx0Y2FsY3VsYXRlWExhYmVsUm90YXRpb24gOiBmdW5jdGlvbigpe1xuXHRcdFx0Ly9HZXQgdGhlIHdpZHRoIG9mIGVhY2ggZ3JpZCBieSBjYWxjdWxhdGluZyB0aGUgZGlmZmVyZW5jZVxuXHRcdFx0Ly9iZXR3ZWVuIHggb2Zmc2V0cyBiZXR3ZWVuIDAgYW5kIDEuXG5cblx0XHRcdHRoaXMuY3R4LmZvbnQgPSB0aGlzLmZvbnQ7XG5cblx0XHRcdHZhciBmaXJzdFdpZHRoID0gdGhpcy5jdHgubWVhc3VyZVRleHQodGhpcy54TGFiZWxzWzBdKS53aWR0aCxcblx0XHRcdFx0bGFzdFdpZHRoID0gdGhpcy5jdHgubWVhc3VyZVRleHQodGhpcy54TGFiZWxzW3RoaXMueExhYmVscy5sZW5ndGggLSAxXSkud2lkdGgsXG5cdFx0XHRcdGZpcnN0Um90YXRlZCxcblx0XHRcdFx0bGFzdFJvdGF0ZWQ7XG5cblxuXHRcdFx0dGhpcy54U2NhbGVQYWRkaW5nUmlnaHQgPSBsYXN0V2lkdGgvMiArIDM7XG5cdFx0XHR0aGlzLnhTY2FsZVBhZGRpbmdMZWZ0ID0gKGZpcnN0V2lkdGgvMiA+IHRoaXMueUxhYmVsV2lkdGgpID8gZmlyc3RXaWR0aC8yIDogdGhpcy55TGFiZWxXaWR0aDtcblxuXHRcdFx0dGhpcy54TGFiZWxSb3RhdGlvbiA9IDA7XG5cdFx0XHRpZiAodGhpcy5kaXNwbGF5KXtcblx0XHRcdFx0dmFyIG9yaWdpbmFsTGFiZWxXaWR0aCA9IGxvbmdlc3RUZXh0KHRoaXMuY3R4LHRoaXMuZm9udCx0aGlzLnhMYWJlbHMpLFxuXHRcdFx0XHRcdGNvc1JvdGF0aW9uLFxuXHRcdFx0XHRcdGZpcnN0Um90YXRlZFdpZHRoO1xuXHRcdFx0XHR0aGlzLnhMYWJlbFdpZHRoID0gb3JpZ2luYWxMYWJlbFdpZHRoO1xuXHRcdFx0XHQvL0FsbG93IDMgcGl4ZWxzIHgyIHBhZGRpbmcgZWl0aGVyIHNpZGUgZm9yIGxhYmVsIHJlYWRhYmlsaXR5XG5cdFx0XHRcdHZhciB4R3JpZFdpZHRoID0gTWF0aC5mbG9vcih0aGlzLmNhbGN1bGF0ZVgoMSkgLSB0aGlzLmNhbGN1bGF0ZVgoMCkpIC0gNjtcblxuXHRcdFx0XHQvL01heCBsYWJlbCByb3RhdGUgc2hvdWxkIGJlIDkwIC0gYWxzbyBhY3QgYXMgYSBsb29wIGNvdW50ZXJcblx0XHRcdFx0d2hpbGUgKCh0aGlzLnhMYWJlbFdpZHRoID4geEdyaWRXaWR0aCAmJiB0aGlzLnhMYWJlbFJvdGF0aW9uID09PSAwKSB8fCAodGhpcy54TGFiZWxXaWR0aCA+IHhHcmlkV2lkdGggJiYgdGhpcy54TGFiZWxSb3RhdGlvbiA8PSA5MCAmJiB0aGlzLnhMYWJlbFJvdGF0aW9uID4gMCkpe1xuXHRcdFx0XHRcdGNvc1JvdGF0aW9uID0gTWF0aC5jb3ModG9SYWRpYW5zKHRoaXMueExhYmVsUm90YXRpb24pKTtcblxuXHRcdFx0XHRcdGZpcnN0Um90YXRlZCA9IGNvc1JvdGF0aW9uICogZmlyc3RXaWR0aDtcblx0XHRcdFx0XHRsYXN0Um90YXRlZCA9IGNvc1JvdGF0aW9uICogbGFzdFdpZHRoO1xuXG5cdFx0XHRcdFx0Ly8gV2UncmUgcmlnaHQgYWxpZ25pbmcgdGhlIHRleHQgbm93LlxuXHRcdFx0XHRcdGlmIChmaXJzdFJvdGF0ZWQgKyB0aGlzLmZvbnRTaXplIC8gMiA+IHRoaXMueUxhYmVsV2lkdGgpe1xuXHRcdFx0XHRcdFx0dGhpcy54U2NhbGVQYWRkaW5nTGVmdCA9IGZpcnN0Um90YXRlZCArIHRoaXMuZm9udFNpemUgLyAyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLnhTY2FsZVBhZGRpbmdSaWdodCA9IHRoaXMuZm9udFNpemUvMjtcblxuXG5cdFx0XHRcdFx0dGhpcy54TGFiZWxSb3RhdGlvbisrO1xuXHRcdFx0XHRcdHRoaXMueExhYmVsV2lkdGggPSBjb3NSb3RhdGlvbiAqIG9yaWdpbmFsTGFiZWxXaWR0aDtcblxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLnhMYWJlbFJvdGF0aW9uID4gMCl7XG5cdFx0XHRcdFx0dGhpcy5lbmRQb2ludCAtPSBNYXRoLnNpbih0b1JhZGlhbnModGhpcy54TGFiZWxSb3RhdGlvbikpKm9yaWdpbmFsTGFiZWxXaWR0aCArIDM7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2V7XG5cdFx0XHRcdHRoaXMueExhYmVsV2lkdGggPSAwO1xuXHRcdFx0XHR0aGlzLnhTY2FsZVBhZGRpbmdSaWdodCA9IHRoaXMucGFkZGluZztcblx0XHRcdFx0dGhpcy54U2NhbGVQYWRkaW5nTGVmdCA9IHRoaXMucGFkZGluZztcblx0XHRcdH1cblxuXHRcdH0sXG5cdFx0Ly8gTmVlZHMgdG8gYmUgb3ZlcmlkZGVuIGluIGVhY2ggQ2hhcnQgdHlwZVxuXHRcdC8vIE90aGVyd2lzZSB3ZSBuZWVkIHRvIHBhc3MgYWxsIHRoZSBkYXRhIGludG8gdGhlIHNjYWxlIGNsYXNzXG5cdFx0Y2FsY3VsYXRlWVJhbmdlOiBub29wLFxuXHRcdGRyYXdpbmdBcmVhOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHRoaXMuc3RhcnRQb2ludCAtIHRoaXMuZW5kUG9pbnQ7XG5cdFx0fSxcblx0XHRjYWxjdWxhdGVZIDogZnVuY3Rpb24odmFsdWUpe1xuXHRcdFx0dmFyIHNjYWxpbmdGYWN0b3IgPSB0aGlzLmRyYXdpbmdBcmVhKCkgLyAodGhpcy5taW4gLSB0aGlzLm1heCk7XG5cdFx0XHRyZXR1cm4gdGhpcy5lbmRQb2ludCAtIChzY2FsaW5nRmFjdG9yICogKHZhbHVlIC0gdGhpcy5taW4pKTtcblx0XHR9LFxuXHRcdGNhbGN1bGF0ZVggOiBmdW5jdGlvbihpbmRleCl7XG5cdFx0XHR2YXIgaXNSb3RhdGVkID0gKHRoaXMueExhYmVsUm90YXRpb24gPiAwKSxcblx0XHRcdFx0Ly8gaW5uZXJXaWR0aCA9ICh0aGlzLm9mZnNldEdyaWRMaW5lcykgPyB0aGlzLndpZHRoIC0gb2Zmc2V0TGVmdCAtIHRoaXMucGFkZGluZyA6IHRoaXMud2lkdGggLSAob2Zmc2V0TGVmdCArIGhhbGZMYWJlbFdpZHRoICogMikgLSB0aGlzLnBhZGRpbmcsXG5cdFx0XHRcdGlubmVyV2lkdGggPSB0aGlzLndpZHRoIC0gKHRoaXMueFNjYWxlUGFkZGluZ0xlZnQgKyB0aGlzLnhTY2FsZVBhZGRpbmdSaWdodCksXG5cdFx0XHRcdHZhbHVlV2lkdGggPSBpbm5lcldpZHRoL01hdGgubWF4KCh0aGlzLnZhbHVlc0NvdW50IC0gKCh0aGlzLm9mZnNldEdyaWRMaW5lcykgPyAwIDogMSkpLCAxKSxcblx0XHRcdFx0dmFsdWVPZmZzZXQgPSAodmFsdWVXaWR0aCAqIGluZGV4KSArIHRoaXMueFNjYWxlUGFkZGluZ0xlZnQ7XG5cblx0XHRcdGlmICh0aGlzLm9mZnNldEdyaWRMaW5lcyl7XG5cdFx0XHRcdHZhbHVlT2Zmc2V0ICs9ICh2YWx1ZVdpZHRoLzIpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZU9mZnNldCk7XG5cdFx0fSxcblx0XHR1cGRhdGUgOiBmdW5jdGlvbihuZXdQcm9wcyl7XG5cdFx0XHRoZWxwZXJzLmV4dGVuZCh0aGlzLCBuZXdQcm9wcyk7XG5cdFx0XHR0aGlzLmZpdCgpO1xuXHRcdH0sXG5cdFx0ZHJhdyA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgY3R4ID0gdGhpcy5jdHgsXG5cdFx0XHRcdHlMYWJlbEdhcCA9ICh0aGlzLmVuZFBvaW50IC0gdGhpcy5zdGFydFBvaW50KSAvIHRoaXMuc3RlcHMsXG5cdFx0XHRcdHhTdGFydCA9IE1hdGgucm91bmQodGhpcy54U2NhbGVQYWRkaW5nTGVmdCk7XG5cdFx0XHRpZiAodGhpcy5kaXNwbGF5KXtcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHRoaXMudGV4dENvbG9yO1xuXHRcdFx0XHRjdHguZm9udCA9IHRoaXMuZm9udDtcblx0XHRcdFx0ZWFjaCh0aGlzLnlMYWJlbHMsZnVuY3Rpb24obGFiZWxTdHJpbmcsaW5kZXgpe1xuXHRcdFx0XHRcdHZhciB5TGFiZWxDZW50ZXIgPSB0aGlzLmVuZFBvaW50IC0gKHlMYWJlbEdhcCAqIGluZGV4KSxcblx0XHRcdFx0XHRcdGxpbmVQb3NpdGlvblkgPSBNYXRoLnJvdW5kKHlMYWJlbENlbnRlciksXG5cdFx0XHRcdFx0XHRkcmF3SG9yaXpvbnRhbExpbmUgPSB0aGlzLnNob3dIb3Jpem9udGFsTGluZXM7XG5cblx0XHRcdFx0XHRjdHgudGV4dEFsaWduID0gXCJyaWdodFwiO1xuXHRcdFx0XHRcdGN0eC50ZXh0QmFzZWxpbmUgPSBcIm1pZGRsZVwiO1xuXHRcdFx0XHRcdGlmICh0aGlzLnNob3dMYWJlbHMpe1xuXHRcdFx0XHRcdFx0Y3R4LmZpbGxUZXh0KGxhYmVsU3RyaW5nLHhTdGFydCAtIDEwLHlMYWJlbENlbnRlcik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gVGhpcyBpcyBYIGF4aXMsIHNvIGRyYXcgaXRcblx0XHRcdFx0XHRpZiAoaW5kZXggPT09IDAgJiYgIWRyYXdIb3Jpem9udGFsTGluZSl7XG5cdFx0XHRcdFx0XHRkcmF3SG9yaXpvbnRhbExpbmUgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChkcmF3SG9yaXpvbnRhbExpbmUpe1xuXHRcdFx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChpbmRleCA+IDApe1xuXHRcdFx0XHRcdFx0Ly8gVGhpcyBpcyBhIGdyaWQgbGluZSBpbiB0aGUgY2VudHJlLCBzbyBkcm9wIHRoYXRcblx0XHRcdFx0XHRcdGN0eC5saW5lV2lkdGggPSB0aGlzLmdyaWRMaW5lV2lkdGg7XG5cdFx0XHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmdyaWRMaW5lQ29sb3I7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdC8vIFRoaXMgaXMgdGhlIGZpcnN0IGxpbmUgb24gdGhlIHNjYWxlXG5cdFx0XHRcdFx0XHRjdHgubGluZVdpZHRoID0gdGhpcy5saW5lV2lkdGg7XG5cdFx0XHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmxpbmVDb2xvcjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsaW5lUG9zaXRpb25ZICs9IGhlbHBlcnMuYWxpYXNQaXhlbChjdHgubGluZVdpZHRoKTtcblxuXHRcdFx0XHRcdGlmKGRyYXdIb3Jpem9udGFsTGluZSl7XG5cdFx0XHRcdFx0XHRjdHgubW92ZVRvKHhTdGFydCwgbGluZVBvc2l0aW9uWSk7XG5cdFx0XHRcdFx0XHRjdHgubGluZVRvKHRoaXMud2lkdGgsIGxpbmVQb3NpdGlvblkpO1xuXHRcdFx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xuXHRcdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGN0eC5saW5lV2lkdGggPSB0aGlzLmxpbmVXaWR0aDtcblx0XHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmxpbmVDb2xvcjtcblx0XHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0Y3R4Lm1vdmVUbyh4U3RhcnQgLSA1LCBsaW5lUG9zaXRpb25ZKTtcblx0XHRcdFx0XHRjdHgubGluZVRvKHhTdGFydCwgbGluZVBvc2l0aW9uWSk7XG5cdFx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xuXHRcdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcblxuXHRcdFx0XHR9LHRoaXMpO1xuXG5cdFx0XHRcdGVhY2godGhpcy54TGFiZWxzLGZ1bmN0aW9uKGxhYmVsLGluZGV4KXtcblx0XHRcdFx0XHR2YXIgeFBvcyA9IHRoaXMuY2FsY3VsYXRlWChpbmRleCkgKyBhbGlhc1BpeGVsKHRoaXMubGluZVdpZHRoKSxcblx0XHRcdFx0XHRcdC8vIENoZWNrIHRvIHNlZSBpZiBsaW5lL2JhciBoZXJlIGFuZCBkZWNpZGUgd2hlcmUgdG8gcGxhY2UgdGhlIGxpbmVcblx0XHRcdFx0XHRcdGxpbmVQb3MgPSB0aGlzLmNhbGN1bGF0ZVgoaW5kZXggLSAodGhpcy5vZmZzZXRHcmlkTGluZXMgPyAwLjUgOiAwKSkgKyBhbGlhc1BpeGVsKHRoaXMubGluZVdpZHRoKSxcblx0XHRcdFx0XHRcdGlzUm90YXRlZCA9ICh0aGlzLnhMYWJlbFJvdGF0aW9uID4gMCksXG5cdFx0XHRcdFx0XHRkcmF3VmVydGljYWxMaW5lID0gdGhpcy5zaG93VmVydGljYWxMaW5lcztcblxuXHRcdFx0XHRcdC8vIFRoaXMgaXMgWSBheGlzLCBzbyBkcmF3IGl0XG5cdFx0XHRcdFx0aWYgKGluZGV4ID09PSAwICYmICFkcmF3VmVydGljYWxMaW5lKXtcblx0XHRcdFx0XHRcdGRyYXdWZXJ0aWNhbExpbmUgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChkcmF3VmVydGljYWxMaW5lKXtcblx0XHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoaW5kZXggPiAwKXtcblx0XHRcdFx0XHRcdC8vIFRoaXMgaXMgYSBncmlkIGxpbmUgaW4gdGhlIGNlbnRyZSwgc28gZHJvcCB0aGF0XG5cdFx0XHRcdFx0XHRjdHgubGluZVdpZHRoID0gdGhpcy5ncmlkTGluZVdpZHRoO1xuXHRcdFx0XHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gdGhpcy5ncmlkTGluZUNvbG9yO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyBUaGlzIGlzIHRoZSBmaXJzdCBsaW5lIG9uIHRoZSBzY2FsZVxuXHRcdFx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IHRoaXMubGluZVdpZHRoO1xuXHRcdFx0XHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gdGhpcy5saW5lQ29sb3I7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGRyYXdWZXJ0aWNhbExpbmUpe1xuXHRcdFx0XHRcdFx0Y3R4Lm1vdmVUbyhsaW5lUG9zLHRoaXMuZW5kUG9pbnQpO1xuXHRcdFx0XHRcdFx0Y3R4LmxpbmVUbyhsaW5lUG9zLHRoaXMuc3RhcnRQb2ludCAtIDMpO1xuXHRcdFx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xuXHRcdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRcdH1cblxuXG5cdFx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IHRoaXMubGluZVdpZHRoO1xuXHRcdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IHRoaXMubGluZUNvbG9yO1xuXG5cblx0XHRcdFx0XHQvLyBTbWFsbCBsaW5lcyBhdCB0aGUgYm90dG9tIG9mIHRoZSBiYXNlIGdyaWQgbGluZVxuXHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHRjdHgubW92ZVRvKGxpbmVQb3MsdGhpcy5lbmRQb2ludCk7XG5cdFx0XHRcdFx0Y3R4LmxpbmVUbyhsaW5lUG9zLHRoaXMuZW5kUG9pbnQgKyA1KTtcblx0XHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXG5cdFx0XHRcdFx0Y3R4LnNhdmUoKTtcblx0XHRcdFx0XHRjdHgudHJhbnNsYXRlKHhQb3MsKGlzUm90YXRlZCkgPyB0aGlzLmVuZFBvaW50ICsgMTIgOiB0aGlzLmVuZFBvaW50ICsgOCk7XG5cdFx0XHRcdFx0Y3R4LnJvdGF0ZSh0b1JhZGlhbnModGhpcy54TGFiZWxSb3RhdGlvbikqLTEpO1xuXHRcdFx0XHRcdGN0eC5mb250ID0gdGhpcy5mb250O1xuXHRcdFx0XHRcdGN0eC50ZXh0QWxpZ24gPSAoaXNSb3RhdGVkKSA/IFwicmlnaHRcIiA6IFwiY2VudGVyXCI7XG5cdFx0XHRcdFx0Y3R4LnRleHRCYXNlbGluZSA9IChpc1JvdGF0ZWQpID8gXCJtaWRkbGVcIiA6IFwidG9wXCI7XG5cdFx0XHRcdFx0Y3R4LmZpbGxUZXh0KGxhYmVsLCAwLCAwKTtcblx0XHRcdFx0XHRjdHgucmVzdG9yZSgpO1xuXHRcdFx0XHR9LHRoaXMpO1xuXG5cdFx0XHR9XG5cdFx0fVxuXG5cdH0pO1xuXG5cdENoYXJ0LlJhZGlhbFNjYWxlID0gQ2hhcnQuRWxlbWVudC5leHRlbmQoe1xuXHRcdGluaXRpYWxpemU6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLnNpemUgPSBtaW4oW3RoaXMuaGVpZ2h0LCB0aGlzLndpZHRoXSk7XG5cdFx0XHR0aGlzLmRyYXdpbmdBcmVhID0gKHRoaXMuZGlzcGxheSkgPyAodGhpcy5zaXplLzIpIC0gKHRoaXMuZm9udFNpemUvMiArIHRoaXMuYmFja2Ryb3BQYWRkaW5nWSkgOiAodGhpcy5zaXplLzIpO1xuXHRcdH0sXG5cdFx0Y2FsY3VsYXRlQ2VudGVyT2Zmc2V0OiBmdW5jdGlvbih2YWx1ZSl7XG5cdFx0XHQvLyBUYWtlIGludG8gYWNjb3VudCBoYWxmIGZvbnQgc2l6ZSArIHRoZSB5UGFkZGluZyBvZiB0aGUgdG9wIHZhbHVlXG5cdFx0XHR2YXIgc2NhbGluZ0ZhY3RvciA9IHRoaXMuZHJhd2luZ0FyZWEgLyAodGhpcy5tYXggLSB0aGlzLm1pbik7XG5cblx0XHRcdHJldHVybiAodmFsdWUgLSB0aGlzLm1pbikgKiBzY2FsaW5nRmFjdG9yO1xuXHRcdH0sXG5cdFx0dXBkYXRlIDogZnVuY3Rpb24oKXtcblx0XHRcdGlmICghdGhpcy5saW5lQXJjKXtcblx0XHRcdFx0dGhpcy5zZXRTY2FsZVNpemUoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuZHJhd2luZ0FyZWEgPSAodGhpcy5kaXNwbGF5KSA/ICh0aGlzLnNpemUvMikgLSAodGhpcy5mb250U2l6ZS8yICsgdGhpcy5iYWNrZHJvcFBhZGRpbmdZKSA6ICh0aGlzLnNpemUvMik7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmJ1aWxkWUxhYmVscygpO1xuXHRcdH0sXG5cdFx0YnVpbGRZTGFiZWxzOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy55TGFiZWxzID0gW107XG5cblx0XHRcdHZhciBzdGVwRGVjaW1hbFBsYWNlcyA9IGdldERlY2ltYWxQbGFjZXModGhpcy5zdGVwVmFsdWUpO1xuXG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8PXRoaXMuc3RlcHM7IGkrKyl7XG5cdFx0XHRcdHRoaXMueUxhYmVscy5wdXNoKHRlbXBsYXRlKHRoaXMudGVtcGxhdGVTdHJpbmcse3ZhbHVlOih0aGlzLm1pbiArIChpICogdGhpcy5zdGVwVmFsdWUpKS50b0ZpeGVkKHN0ZXBEZWNpbWFsUGxhY2VzKX0pKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGdldENpcmN1bWZlcmVuY2UgOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuICgoTWF0aC5QSSoyKSAvIHRoaXMudmFsdWVzQ291bnQpO1xuXHRcdH0sXG5cdFx0c2V0U2NhbGVTaXplOiBmdW5jdGlvbigpe1xuXHRcdFx0Lypcblx0XHRcdCAqIFJpZ2h0LCB0aGlzIGlzIHJlYWxseSBjb25mdXNpbmcgYW5kIHRoZXJlIGlzIGEgbG90IG9mIG1hdGhzIGdvaW5nIG9uIGhlcmVcblx0XHRcdCAqIFRoZSBnaXN0IG9mIHRoZSBwcm9ibGVtIGlzIGhlcmU6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL25ubmljay82OTZjYzljNTVmNGIwYmViOGZlOVxuXHRcdFx0ICpcblx0XHRcdCAqIFJlYWN0aW9uOiBodHRwczovL2RsLmRyb3Bib3h1c2VyY29udGVudC5jb20vdS8zNDYwMTM2My90b29tdWNoc2NpZW5jZS5naWZcblx0XHRcdCAqXG5cdFx0XHQgKiBTb2x1dGlvbjpcblx0XHRcdCAqXG5cdFx0XHQgKiBXZSBhc3N1bWUgdGhlIHJhZGl1cyBvZiB0aGUgcG9seWdvbiBpcyBoYWxmIHRoZSBzaXplIG9mIHRoZSBjYW52YXMgYXQgZmlyc3Rcblx0XHRcdCAqIGF0IGVhY2ggaW5kZXggd2UgY2hlY2sgaWYgdGhlIHRleHQgb3ZlcmxhcHMuXG5cdFx0XHQgKlxuXHRcdFx0ICogV2hlcmUgaXQgZG9lcywgd2Ugc3RvcmUgdGhhdCBhbmdsZSBhbmQgdGhhdCBpbmRleC5cblx0XHRcdCAqXG5cdFx0XHQgKiBBZnRlciBmaW5kaW5nIHRoZSBsYXJnZXN0IGluZGV4IGFuZCBhbmdsZSB3ZSBjYWxjdWxhdGUgaG93IG11Y2ggd2UgbmVlZCB0byByZW1vdmVcblx0XHRcdCAqIGZyb20gdGhlIHNoYXBlIHJhZGl1cyB0byBtb3ZlIHRoZSBwb2ludCBpbndhcmRzIGJ5IHRoYXQgeC5cblx0XHRcdCAqXG5cdFx0XHQgKiBXZSBhdmVyYWdlIHRoZSBsZWZ0IGFuZCByaWdodCBkaXN0YW5jZXMgdG8gZ2V0IHRoZSBtYXhpbXVtIHNoYXBlIHJhZGl1cyB0aGF0IGNhbiBmaXQgaW4gdGhlIGJveFxuXHRcdFx0ICogYWxvbmcgd2l0aCBsYWJlbHMuXG5cdFx0XHQgKlxuXHRcdFx0ICogT25jZSB3ZSBoYXZlIHRoYXQsIHdlIGNhbiBmaW5kIHRoZSBjZW50cmUgcG9pbnQgZm9yIHRoZSBjaGFydCwgYnkgdGFraW5nIHRoZSB4IHRleHQgcHJvdHJ1c2lvblxuXHRcdFx0ICogb24gZWFjaCBzaWRlLCByZW1vdmluZyB0aGF0IGZyb20gdGhlIHNpemUsIGhhbHZpbmcgaXQgYW5kIGFkZGluZyB0aGUgbGVmdCB4IHByb3RydXNpb24gd2lkdGguXG5cdFx0XHQgKlxuXHRcdFx0ICogVGhpcyB3aWxsIG1lYW4gd2UgaGF2ZSBhIHNoYXBlIGZpdHRlZCB0byB0aGUgY2FudmFzLCBhcyBsYXJnZSBhcyBpdCBjYW4gYmUgd2l0aCB0aGUgbGFiZWxzXG5cdFx0XHQgKiBhbmQgcG9zaXRpb24gaXQgaW4gdGhlIG1vc3Qgc3BhY2UgZWZmaWNpZW50IG1hbm5lclxuXHRcdFx0ICpcblx0XHRcdCAqIGh0dHBzOi8vZGwuZHJvcGJveHVzZXJjb250ZW50LmNvbS91LzM0NjAxMzYzL3llYWhzY2llbmNlLmdpZlxuXHRcdFx0ICovXG5cblxuXHRcdFx0Ly8gR2V0IG1heGltdW0gcmFkaXVzIG9mIHRoZSBwb2x5Z29uLiBFaXRoZXIgaGFsZiB0aGUgaGVpZ2h0IChtaW51cyB0aGUgdGV4dCB3aWR0aCkgb3IgaGFsZiB0aGUgd2lkdGguXG5cdFx0XHQvLyBVc2UgdGhpcyB0byBjYWxjdWxhdGUgdGhlIG9mZnNldCArIGNoYW5nZS4gLSBNYWtlIHN1cmUgTC9SIHByb3RydXNpb24gaXMgYXQgbGVhc3QgMCB0byBzdG9wIGlzc3VlcyB3aXRoIGNlbnRyZSBwb2ludHNcblx0XHRcdHZhciBsYXJnZXN0UG9zc2libGVSYWRpdXMgPSBtaW4oWyh0aGlzLmhlaWdodC8yIC0gdGhpcy5wb2ludExhYmVsRm9udFNpemUgLSA1KSwgdGhpcy53aWR0aC8yXSksXG5cdFx0XHRcdHBvaW50UG9zaXRpb24sXG5cdFx0XHRcdGksXG5cdFx0XHRcdHRleHRXaWR0aCxcblx0XHRcdFx0aGFsZlRleHRXaWR0aCxcblx0XHRcdFx0ZnVydGhlc3RSaWdodCA9IHRoaXMud2lkdGgsXG5cdFx0XHRcdGZ1cnRoZXN0UmlnaHRJbmRleCxcblx0XHRcdFx0ZnVydGhlc3RSaWdodEFuZ2xlLFxuXHRcdFx0XHRmdXJ0aGVzdExlZnQgPSAwLFxuXHRcdFx0XHRmdXJ0aGVzdExlZnRJbmRleCxcblx0XHRcdFx0ZnVydGhlc3RMZWZ0QW5nbGUsXG5cdFx0XHRcdHhQcm90cnVzaW9uTGVmdCxcblx0XHRcdFx0eFByb3RydXNpb25SaWdodCxcblx0XHRcdFx0cmFkaXVzUmVkdWN0aW9uUmlnaHQsXG5cdFx0XHRcdHJhZGl1c1JlZHVjdGlvbkxlZnQsXG5cdFx0XHRcdG1heFdpZHRoUmFkaXVzO1xuXHRcdFx0dGhpcy5jdHguZm9udCA9IGZvbnRTdHJpbmcodGhpcy5wb2ludExhYmVsRm9udFNpemUsdGhpcy5wb2ludExhYmVsRm9udFN0eWxlLHRoaXMucG9pbnRMYWJlbEZvbnRGYW1pbHkpO1xuXHRcdFx0Zm9yIChpPTA7aTx0aGlzLnZhbHVlc0NvdW50O2krKyl7XG5cdFx0XHRcdC8vIDVweCB0byBzcGFjZSB0aGUgdGV4dCBzbGlnaHRseSBvdXQgLSBzaW1pbGFyIHRvIHdoYXQgd2UgZG8gaW4gdGhlIGRyYXcgZnVuY3Rpb24uXG5cdFx0XHRcdHBvaW50UG9zaXRpb24gPSB0aGlzLmdldFBvaW50UG9zaXRpb24oaSwgbGFyZ2VzdFBvc3NpYmxlUmFkaXVzKTtcblx0XHRcdFx0dGV4dFdpZHRoID0gdGhpcy5jdHgubWVhc3VyZVRleHQodGVtcGxhdGUodGhpcy50ZW1wbGF0ZVN0cmluZywgeyB2YWx1ZTogdGhpcy5sYWJlbHNbaV0gfSkpLndpZHRoICsgNTtcblx0XHRcdFx0aWYgKGkgPT09IDAgfHwgaSA9PT0gdGhpcy52YWx1ZXNDb3VudC8yKXtcblx0XHRcdFx0XHQvLyBJZiB3ZSdyZSBhdCBpbmRleCB6ZXJvLCBvciBleGFjdGx5IHRoZSBtaWRkbGUsIHdlJ3JlIGF0IGV4YWN0bHkgdGhlIHRvcC9ib3R0b21cblx0XHRcdFx0XHQvLyBvZiB0aGUgcmFkYXIgY2hhcnQsIHNvIHRleHQgd2lsbCBiZSBhbGlnbmVkIGNlbnRyYWxseSwgc28gd2UnbGwgaGFsZiBpdCBhbmQgY29tcGFyZVxuXHRcdFx0XHRcdC8vIHcvbGVmdCBhbmQgcmlnaHQgdGV4dCBzaXplc1xuXHRcdFx0XHRcdGhhbGZUZXh0V2lkdGggPSB0ZXh0V2lkdGgvMjtcblx0XHRcdFx0XHRpZiAocG9pbnRQb3NpdGlvbi54ICsgaGFsZlRleHRXaWR0aCA+IGZ1cnRoZXN0UmlnaHQpIHtcblx0XHRcdFx0XHRcdGZ1cnRoZXN0UmlnaHQgPSBwb2ludFBvc2l0aW9uLnggKyBoYWxmVGV4dFdpZHRoO1xuXHRcdFx0XHRcdFx0ZnVydGhlc3RSaWdodEluZGV4ID0gaTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHBvaW50UG9zaXRpb24ueCAtIGhhbGZUZXh0V2lkdGggPCBmdXJ0aGVzdExlZnQpIHtcblx0XHRcdFx0XHRcdGZ1cnRoZXN0TGVmdCA9IHBvaW50UG9zaXRpb24ueCAtIGhhbGZUZXh0V2lkdGg7XG5cdFx0XHRcdFx0XHRmdXJ0aGVzdExlZnRJbmRleCA9IGk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGkgPCB0aGlzLnZhbHVlc0NvdW50LzIpIHtcblx0XHRcdFx0XHQvLyBMZXNzIHRoYW4gaGFsZiB0aGUgdmFsdWVzIG1lYW5zIHdlJ2xsIGxlZnQgYWxpZ24gdGhlIHRleHRcblx0XHRcdFx0XHRpZiAocG9pbnRQb3NpdGlvbi54ICsgdGV4dFdpZHRoID4gZnVydGhlc3RSaWdodCkge1xuXHRcdFx0XHRcdFx0ZnVydGhlc3RSaWdodCA9IHBvaW50UG9zaXRpb24ueCArIHRleHRXaWR0aDtcblx0XHRcdFx0XHRcdGZ1cnRoZXN0UmlnaHRJbmRleCA9IGk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGkgPiB0aGlzLnZhbHVlc0NvdW50LzIpe1xuXHRcdFx0XHRcdC8vIE1vcmUgdGhhbiBoYWxmIHRoZSB2YWx1ZXMgbWVhbnMgd2UnbGwgcmlnaHQgYWxpZ24gdGhlIHRleHRcblx0XHRcdFx0XHRpZiAocG9pbnRQb3NpdGlvbi54IC0gdGV4dFdpZHRoIDwgZnVydGhlc3RMZWZ0KSB7XG5cdFx0XHRcdFx0XHRmdXJ0aGVzdExlZnQgPSBwb2ludFBvc2l0aW9uLnggLSB0ZXh0V2lkdGg7XG5cdFx0XHRcdFx0XHRmdXJ0aGVzdExlZnRJbmRleCA9IGk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHhQcm90cnVzaW9uTGVmdCA9IGZ1cnRoZXN0TGVmdDtcblxuXHRcdFx0eFByb3RydXNpb25SaWdodCA9IE1hdGguY2VpbChmdXJ0aGVzdFJpZ2h0IC0gdGhpcy53aWR0aCk7XG5cblx0XHRcdGZ1cnRoZXN0UmlnaHRBbmdsZSA9IHRoaXMuZ2V0SW5kZXhBbmdsZShmdXJ0aGVzdFJpZ2h0SW5kZXgpO1xuXG5cdFx0XHRmdXJ0aGVzdExlZnRBbmdsZSA9IHRoaXMuZ2V0SW5kZXhBbmdsZShmdXJ0aGVzdExlZnRJbmRleCk7XG5cblx0XHRcdHJhZGl1c1JlZHVjdGlvblJpZ2h0ID0geFByb3RydXNpb25SaWdodCAvIE1hdGguc2luKGZ1cnRoZXN0UmlnaHRBbmdsZSArIE1hdGguUEkvMik7XG5cblx0XHRcdHJhZGl1c1JlZHVjdGlvbkxlZnQgPSB4UHJvdHJ1c2lvbkxlZnQgLyBNYXRoLnNpbihmdXJ0aGVzdExlZnRBbmdsZSArIE1hdGguUEkvMik7XG5cblx0XHRcdC8vIEVuc3VyZSB3ZSBhY3R1YWxseSBuZWVkIHRvIHJlZHVjZSB0aGUgc2l6ZSBvZiB0aGUgY2hhcnRcblx0XHRcdHJhZGl1c1JlZHVjdGlvblJpZ2h0ID0gKGlzTnVtYmVyKHJhZGl1c1JlZHVjdGlvblJpZ2h0KSkgPyByYWRpdXNSZWR1Y3Rpb25SaWdodCA6IDA7XG5cdFx0XHRyYWRpdXNSZWR1Y3Rpb25MZWZ0ID0gKGlzTnVtYmVyKHJhZGl1c1JlZHVjdGlvbkxlZnQpKSA/IHJhZGl1c1JlZHVjdGlvbkxlZnQgOiAwO1xuXG5cdFx0XHR0aGlzLmRyYXdpbmdBcmVhID0gbGFyZ2VzdFBvc3NpYmxlUmFkaXVzIC0gKHJhZGl1c1JlZHVjdGlvbkxlZnQgKyByYWRpdXNSZWR1Y3Rpb25SaWdodCkvMjtcblxuXHRcdFx0Ly90aGlzLmRyYXdpbmdBcmVhID0gbWluKFttYXhXaWR0aFJhZGl1cywgKHRoaXMuaGVpZ2h0IC0gKDIgKiAodGhpcy5wb2ludExhYmVsRm9udFNpemUgKyA1KSkpLzJdKVxuXHRcdFx0dGhpcy5zZXRDZW50ZXJQb2ludChyYWRpdXNSZWR1Y3Rpb25MZWZ0LCByYWRpdXNSZWR1Y3Rpb25SaWdodCk7XG5cblx0XHR9LFxuXHRcdHNldENlbnRlclBvaW50OiBmdW5jdGlvbihsZWZ0TW92ZW1lbnQsIHJpZ2h0TW92ZW1lbnQpe1xuXG5cdFx0XHR2YXIgbWF4UmlnaHQgPSB0aGlzLndpZHRoIC0gcmlnaHRNb3ZlbWVudCAtIHRoaXMuZHJhd2luZ0FyZWEsXG5cdFx0XHRcdG1heExlZnQgPSBsZWZ0TW92ZW1lbnQgKyB0aGlzLmRyYXdpbmdBcmVhO1xuXG5cdFx0XHR0aGlzLnhDZW50ZXIgPSAobWF4TGVmdCArIG1heFJpZ2h0KS8yO1xuXHRcdFx0Ly8gQWx3YXlzIHZlcnRpY2FsbHkgaW4gdGhlIGNlbnRyZSBhcyB0aGUgdGV4dCBoZWlnaHQgZG9lc24ndCBjaGFuZ2Vcblx0XHRcdHRoaXMueUNlbnRlciA9ICh0aGlzLmhlaWdodC8yKTtcblx0XHR9LFxuXG5cdFx0Z2V0SW5kZXhBbmdsZSA6IGZ1bmN0aW9uKGluZGV4KXtcblx0XHRcdHZhciBhbmdsZU11bHRpcGxpZXIgPSAoTWF0aC5QSSAqIDIpIC8gdGhpcy52YWx1ZXNDb3VudDtcblx0XHRcdC8vIFN0YXJ0IGZyb20gdGhlIHRvcCBpbnN0ZWFkIG9mIHJpZ2h0LCBzbyByZW1vdmUgYSBxdWFydGVyIG9mIHRoZSBjaXJjbGVcblxuXHRcdFx0cmV0dXJuIGluZGV4ICogYW5nbGVNdWx0aXBsaWVyIC0gKE1hdGguUEkvMik7XG5cdFx0fSxcblx0XHRnZXRQb2ludFBvc2l0aW9uIDogZnVuY3Rpb24oaW5kZXgsIGRpc3RhbmNlRnJvbUNlbnRlcil7XG5cdFx0XHR2YXIgdGhpc0FuZ2xlID0gdGhpcy5nZXRJbmRleEFuZ2xlKGluZGV4KTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHggOiAoTWF0aC5jb3ModGhpc0FuZ2xlKSAqIGRpc3RhbmNlRnJvbUNlbnRlcikgKyB0aGlzLnhDZW50ZXIsXG5cdFx0XHRcdHkgOiAoTWF0aC5zaW4odGhpc0FuZ2xlKSAqIGRpc3RhbmNlRnJvbUNlbnRlcikgKyB0aGlzLnlDZW50ZXJcblx0XHRcdH07XG5cdFx0fSxcblx0XHRkcmF3OiBmdW5jdGlvbigpe1xuXHRcdFx0aWYgKHRoaXMuZGlzcGxheSl7XG5cdFx0XHRcdHZhciBjdHggPSB0aGlzLmN0eDtcblx0XHRcdFx0ZWFjaCh0aGlzLnlMYWJlbHMsIGZ1bmN0aW9uKGxhYmVsLCBpbmRleCl7XG5cdFx0XHRcdFx0Ly8gRG9uJ3QgZHJhdyBhIGNlbnRyZSB2YWx1ZVxuXHRcdFx0XHRcdGlmIChpbmRleCA+IDApe1xuXHRcdFx0XHRcdFx0dmFyIHlDZW50ZXJPZmZzZXQgPSBpbmRleCAqICh0aGlzLmRyYXdpbmdBcmVhL3RoaXMuc3RlcHMpLFxuXHRcdFx0XHRcdFx0XHR5SGVpZ2h0ID0gdGhpcy55Q2VudGVyIC0geUNlbnRlck9mZnNldCxcblx0XHRcdFx0XHRcdFx0cG9pbnRQb3NpdGlvbjtcblxuXHRcdFx0XHRcdFx0Ly8gRHJhdyBjaXJjdWxhciBsaW5lcyBhcm91bmQgdGhlIHNjYWxlXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5saW5lV2lkdGggPiAwKXtcblx0XHRcdFx0XHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gdGhpcy5saW5lQ29sb3I7XG5cdFx0XHRcdFx0XHRcdGN0eC5saW5lV2lkdGggPSB0aGlzLmxpbmVXaWR0aDtcblxuXHRcdFx0XHRcdFx0XHRpZih0aGlzLmxpbmVBcmMpe1xuXHRcdFx0XHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHRcdFx0XHRjdHguYXJjKHRoaXMueENlbnRlciwgdGhpcy55Q2VudGVyLCB5Q2VudGVyT2Zmc2V0LCAwLCBNYXRoLlBJKjIpO1xuXHRcdFx0XHRcdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcblx0XHRcdFx0XHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZXtcblx0XHRcdFx0XHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0XHRcdFx0Zm9yICh2YXIgaT0wO2k8dGhpcy52YWx1ZXNDb3VudDtpKyspXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0cG9pbnRQb3NpdGlvbiA9IHRoaXMuZ2V0UG9pbnRQb3NpdGlvbihpLCB0aGlzLmNhbGN1bGF0ZUNlbnRlck9mZnNldCh0aGlzLm1pbiArIChpbmRleCAqIHRoaXMuc3RlcFZhbHVlKSkpO1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKGkgPT09IDApe1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRjdHgubW92ZVRvKHBvaW50UG9zaXRpb24ueCwgcG9pbnRQb3NpdGlvbi55KTtcblx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGN0eC5saW5lVG8ocG9pbnRQb3NpdGlvbi54LCBwb2ludFBvc2l0aW9uLnkpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRjdHguY2xvc2VQYXRoKCk7XG5cdFx0XHRcdFx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZih0aGlzLnNob3dMYWJlbHMpe1xuXHRcdFx0XHRcdFx0XHRjdHguZm9udCA9IGZvbnRTdHJpbmcodGhpcy5mb250U2l6ZSx0aGlzLmZvbnRTdHlsZSx0aGlzLmZvbnRGYW1pbHkpO1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5zaG93TGFiZWxCYWNrZHJvcCl7XG5cdFx0XHRcdFx0XHRcdFx0dmFyIGxhYmVsV2lkdGggPSBjdHgubWVhc3VyZVRleHQobGFiZWwpLndpZHRoO1xuXHRcdFx0XHRcdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLmJhY2tkcm9wQ29sb3I7XG5cdFx0XHRcdFx0XHRcdFx0Y3R4LmZpbGxSZWN0KFxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy54Q2VudGVyIC0gbGFiZWxXaWR0aC8yIC0gdGhpcy5iYWNrZHJvcFBhZGRpbmdYLFxuXHRcdFx0XHRcdFx0XHRcdFx0eUhlaWdodCAtIHRoaXMuZm9udFNpemUvMiAtIHRoaXMuYmFja2Ryb3BQYWRkaW5nWSxcblx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsV2lkdGggKyB0aGlzLmJhY2tkcm9wUGFkZGluZ1gqMixcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuZm9udFNpemUgKyB0aGlzLmJhY2tkcm9wUGFkZGluZ1kqMlxuXHRcdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0Y3R4LnRleHRBbGlnbiA9ICdjZW50ZXInO1xuXHRcdFx0XHRcdFx0XHRjdHgudGV4dEJhc2VsaW5lID0gXCJtaWRkbGVcIjtcblx0XHRcdFx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHRoaXMuZm9udENvbG9yO1xuXHRcdFx0XHRcdFx0XHRjdHguZmlsbFRleHQobGFiZWwsIHRoaXMueENlbnRlciwgeUhlaWdodCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCB0aGlzKTtcblxuXHRcdFx0XHRpZiAoIXRoaXMubGluZUFyYyl7XG5cdFx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IHRoaXMuYW5nbGVMaW5lV2lkdGg7XG5cdFx0XHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gdGhpcy5hbmdsZUxpbmVDb2xvcjtcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gdGhpcy52YWx1ZXNDb3VudCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRcdFx0XHR2YXIgY2VudGVyT2Zmc2V0ID0gbnVsbCwgb3V0ZXJQb3NpdGlvbiA9IG51bGw7XG5cblx0XHRcdFx0XHRcdGlmICh0aGlzLmFuZ2xlTGluZVdpZHRoID4gMCAmJiAoaSAlIHRoaXMuYW5nbGVMaW5lSW50ZXJ2YWwgPT09IDApKXtcblx0XHRcdFx0XHRcdFx0Y2VudGVyT2Zmc2V0ID0gdGhpcy5jYWxjdWxhdGVDZW50ZXJPZmZzZXQodGhpcy5tYXgpO1xuXHRcdFx0XHRcdFx0XHRvdXRlclBvc2l0aW9uID0gdGhpcy5nZXRQb2ludFBvc2l0aW9uKGksIGNlbnRlck9mZnNldCk7XG5cdFx0XHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHRcdFx0Y3R4Lm1vdmVUbyh0aGlzLnhDZW50ZXIsIHRoaXMueUNlbnRlcik7XG5cdFx0XHRcdFx0XHRcdGN0eC5saW5lVG8ob3V0ZXJQb3NpdGlvbi54LCBvdXRlclBvc2l0aW9uLnkpO1xuXHRcdFx0XHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cdFx0XHRcdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuYmFja2dyb3VuZENvbG9ycyAmJiB0aGlzLmJhY2tncm91bmRDb2xvcnMubGVuZ3RoID09IHRoaXMudmFsdWVzQ291bnQpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGNlbnRlck9mZnNldCA9PSBudWxsKVxuXHRcdFx0XHRcdFx0XHRcdGNlbnRlck9mZnNldCA9IHRoaXMuY2FsY3VsYXRlQ2VudGVyT2Zmc2V0KHRoaXMubWF4KTtcblxuXHRcdFx0XHRcdFx0XHRpZiAob3V0ZXJQb3NpdGlvbiA9PSBudWxsKVxuXHRcdFx0XHRcdFx0XHRcdG91dGVyUG9zaXRpb24gPSB0aGlzLmdldFBvaW50UG9zaXRpb24oaSwgY2VudGVyT2Zmc2V0KTtcblxuXHRcdFx0XHRcdFx0XHR2YXIgcHJldmlvdXNPdXRlclBvc2l0aW9uID0gdGhpcy5nZXRQb2ludFBvc2l0aW9uKGkgPT09IDAgPyB0aGlzLnZhbHVlc0NvdW50IC0gMSA6IGkgLSAxLCBjZW50ZXJPZmZzZXQpO1xuXHRcdFx0XHRcdFx0XHR2YXIgbmV4dE91dGVyUG9zaXRpb24gPSB0aGlzLmdldFBvaW50UG9zaXRpb24oaSA9PT0gdGhpcy52YWx1ZXNDb3VudCAtIDEgPyAwIDogaSArIDEsIGNlbnRlck9mZnNldCk7XG5cblx0XHRcdFx0XHRcdFx0dmFyIHByZXZpb3VzT3V0ZXJIYWxmd2F5ID0geyB4OiAocHJldmlvdXNPdXRlclBvc2l0aW9uLnggKyBvdXRlclBvc2l0aW9uLngpIC8gMiwgeTogKHByZXZpb3VzT3V0ZXJQb3NpdGlvbi55ICsgb3V0ZXJQb3NpdGlvbi55KSAvIDIgfTtcblx0XHRcdFx0XHRcdFx0dmFyIG5leHRPdXRlckhhbGZ3YXkgPSB7IHg6IChvdXRlclBvc2l0aW9uLnggKyBuZXh0T3V0ZXJQb3NpdGlvbi54KSAvIDIsIHk6IChvdXRlclBvc2l0aW9uLnkgKyBuZXh0T3V0ZXJQb3NpdGlvbi55KSAvIDIgfTtcblxuXHRcdFx0XHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0XHRcdGN0eC5tb3ZlVG8odGhpcy54Q2VudGVyLCB0aGlzLnlDZW50ZXIpO1xuXHRcdFx0XHRcdFx0XHRjdHgubGluZVRvKHByZXZpb3VzT3V0ZXJIYWxmd2F5LngsIHByZXZpb3VzT3V0ZXJIYWxmd2F5LnkpO1xuXHRcdFx0XHRcdFx0XHRjdHgubGluZVRvKG91dGVyUG9zaXRpb24ueCwgb3V0ZXJQb3NpdGlvbi55KTtcblx0XHRcdFx0XHRcdFx0Y3R4LmxpbmVUbyhuZXh0T3V0ZXJIYWxmd2F5LngsIG5leHRPdXRlckhhbGZ3YXkueSk7XG5cdFx0XHRcdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLmJhY2tncm91bmRDb2xvcnNbaV07XG5cdFx0XHRcdFx0XHRcdGN0eC5maWxsKCk7XG5cdFx0XHRcdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdC8vIEV4dHJhIDNweCBvdXQgZm9yIHNvbWUgbGFiZWwgc3BhY2luZ1xuXHRcdFx0XHRcdFx0dmFyIHBvaW50TGFiZWxQb3NpdGlvbiA9IHRoaXMuZ2V0UG9pbnRQb3NpdGlvbihpLCB0aGlzLmNhbGN1bGF0ZUNlbnRlck9mZnNldCh0aGlzLm1heCkgKyA1KTtcblx0XHRcdFx0XHRcdGN0eC5mb250ID0gZm9udFN0cmluZyh0aGlzLnBvaW50TGFiZWxGb250U2l6ZSx0aGlzLnBvaW50TGFiZWxGb250U3R5bGUsdGhpcy5wb2ludExhYmVsRm9udEZhbWlseSk7XG5cdFx0XHRcdFx0XHRjdHguZmlsbFN0eWxlID0gdGhpcy5wb2ludExhYmVsRm9udENvbG9yO1xuXG5cdFx0XHRcdFx0XHR2YXIgbGFiZWxzQ291bnQgPSB0aGlzLmxhYmVscy5sZW5ndGgsXG5cdFx0XHRcdFx0XHRcdGhhbGZMYWJlbHNDb3VudCA9IHRoaXMubGFiZWxzLmxlbmd0aC8yLFxuXHRcdFx0XHRcdFx0XHRxdWFydGVyTGFiZWxzQ291bnQgPSBoYWxmTGFiZWxzQ291bnQvMixcblx0XHRcdFx0XHRcdFx0dXBwZXJIYWxmID0gKGkgPCBxdWFydGVyTGFiZWxzQ291bnQgfHwgaSA+IGxhYmVsc0NvdW50IC0gcXVhcnRlckxhYmVsc0NvdW50KSxcblx0XHRcdFx0XHRcdFx0ZXhhY3RRdWFydGVyID0gKGkgPT09IHF1YXJ0ZXJMYWJlbHNDb3VudCB8fCBpID09PSBsYWJlbHNDb3VudCAtIHF1YXJ0ZXJMYWJlbHNDb3VudCk7XG5cdFx0XHRcdFx0XHRpZiAoaSA9PT0gMCl7XG5cdFx0XHRcdFx0XHRcdGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihpID09PSBoYWxmTGFiZWxzQ291bnQpe1xuXHRcdFx0XHRcdFx0XHRjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKGkgPCBoYWxmTGFiZWxzQ291bnQpe1xuXHRcdFx0XHRcdFx0XHRjdHgudGV4dEFsaWduID0gJ2xlZnQnO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y3R4LnRleHRBbGlnbiA9ICdyaWdodCc7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIFNldCB0aGUgY29ycmVjdCB0ZXh0IGJhc2VsaW5lIGJhc2VkIG9uIG91dGVyIHBvc2l0aW9uaW5nXG5cdFx0XHRcdFx0XHRpZiAoZXhhY3RRdWFydGVyKXtcblx0XHRcdFx0XHRcdFx0Y3R4LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmICh1cHBlckhhbGYpe1xuXHRcdFx0XHRcdFx0XHRjdHgudGV4dEJhc2VsaW5lID0gJ2JvdHRvbSc7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjdHgudGV4dEJhc2VsaW5lID0gJ3RvcCc7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGN0eC5maWxsVGV4dCh0aGlzLmxhYmVsc1tpXSwgcG9pbnRMYWJlbFBvc2l0aW9uLngsIHBvaW50TGFiZWxQb3NpdGlvbi55KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cdENoYXJ0LmFuaW1hdGlvblNlcnZpY2UgPSB7XG5cdFx0ZnJhbWVEdXJhdGlvbjogMTcsXG5cdFx0YW5pbWF0aW9uczogW10sXG5cdFx0ZHJvcEZyYW1lczogMCxcblx0XHRhZGRBbmltYXRpb246IGZ1bmN0aW9uKGNoYXJ0SW5zdGFuY2UsIGFuaW1hdGlvbk9iamVjdCkge1xuXHRcdFx0Zm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuYW5pbWF0aW9ucy5sZW5ndGg7ICsrIGluZGV4KXtcblx0XHRcdFx0aWYgKHRoaXMuYW5pbWF0aW9uc1tpbmRleF0uY2hhcnRJbnN0YW5jZSA9PT0gY2hhcnRJbnN0YW5jZSl7XG5cdFx0XHRcdFx0Ly8gcmVwbGFjaW5nIGFuIGluIHByb2dyZXNzIGFuaW1hdGlvblxuXHRcdFx0XHRcdHRoaXMuYW5pbWF0aW9uc1tpbmRleF0uYW5pbWF0aW9uT2JqZWN0ID0gYW5pbWF0aW9uT2JqZWN0O1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR0aGlzLmFuaW1hdGlvbnMucHVzaCh7XG5cdFx0XHRcdGNoYXJ0SW5zdGFuY2U6IGNoYXJ0SW5zdGFuY2UsXG5cdFx0XHRcdGFuaW1hdGlvbk9iamVjdDogYW5pbWF0aW9uT2JqZWN0XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gSWYgdGhlcmUgYXJlIG5vIGFuaW1hdGlvbnMgcXVldWVkLCBtYW51YWxseSBraWNrc3RhcnQgYSBkaWdlc3QsIGZvciBsYWNrIG9mIGEgYmV0dGVyIHdvcmRcblx0XHRcdGlmICh0aGlzLmFuaW1hdGlvbnMubGVuZ3RoID09IDEpIHtcblx0XHRcdFx0aGVscGVycy5yZXF1ZXN0QW5pbUZyYW1lLmNhbGwod2luZG93LCB0aGlzLmRpZ2VzdFdyYXBwZXIpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gQ2FuY2VsIHRoZSBhbmltYXRpb24gZm9yIGEgZ2l2ZW4gY2hhcnQgaW5zdGFuY2Vcblx0XHRjYW5jZWxBbmltYXRpb246IGZ1bmN0aW9uKGNoYXJ0SW5zdGFuY2UpIHtcblx0XHRcdHZhciBpbmRleCA9IGhlbHBlcnMuZmluZE5leHRXaGVyZSh0aGlzLmFuaW1hdGlvbnMsIGZ1bmN0aW9uKGFuaW1hdGlvbldyYXBwZXIpIHtcblx0XHRcdFx0cmV0dXJuIGFuaW1hdGlvbldyYXBwZXIuY2hhcnRJbnN0YW5jZSA9PT0gY2hhcnRJbnN0YW5jZTtcblx0XHRcdH0pO1xuXHRcdFx0XG5cdFx0XHRpZiAoaW5kZXgpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuYW5pbWF0aW9ucy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8gY2FsbHMgc3RhcnREaWdlc3Qgd2l0aCB0aGUgcHJvcGVyIGNvbnRleHRcblx0XHRkaWdlc3RXcmFwcGVyOiBmdW5jdGlvbigpIHtcblx0XHRcdENoYXJ0LmFuaW1hdGlvblNlcnZpY2Uuc3RhcnREaWdlc3QuY2FsbChDaGFydC5hbmltYXRpb25TZXJ2aWNlKTtcblx0XHR9LFxuXHRcdHN0YXJ0RGlnZXN0OiBmdW5jdGlvbigpIHtcblxuXHRcdFx0dmFyIHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cdFx0XHR2YXIgZnJhbWVzVG9Ecm9wID0gMDtcblxuXHRcdFx0aWYodGhpcy5kcm9wRnJhbWVzID4gMSl7XG5cdFx0XHRcdGZyYW1lc1RvRHJvcCA9IE1hdGguZmxvb3IodGhpcy5kcm9wRnJhbWVzKTtcblx0XHRcdFx0dGhpcy5kcm9wRnJhbWVzIC09IGZyYW1lc1RvRHJvcDtcblx0XHRcdH1cblxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFuaW1hdGlvbnMubGVuZ3RoOyBpKyspIHtcblxuXHRcdFx0XHRpZiAodGhpcy5hbmltYXRpb25zW2ldLmFuaW1hdGlvbk9iamVjdC5jdXJyZW50U3RlcCA9PT0gbnVsbCl7XG5cdFx0XHRcdFx0dGhpcy5hbmltYXRpb25zW2ldLmFuaW1hdGlvbk9iamVjdC5jdXJyZW50U3RlcCA9IDA7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmFuaW1hdGlvbnNbaV0uYW5pbWF0aW9uT2JqZWN0LmN1cnJlbnRTdGVwICs9IDEgKyBmcmFtZXNUb0Ryb3A7XG5cdFx0XHRcdGlmKHRoaXMuYW5pbWF0aW9uc1tpXS5hbmltYXRpb25PYmplY3QuY3VycmVudFN0ZXAgPiB0aGlzLmFuaW1hdGlvbnNbaV0uYW5pbWF0aW9uT2JqZWN0Lm51bVN0ZXBzKXtcblx0XHRcdFx0XHR0aGlzLmFuaW1hdGlvbnNbaV0uYW5pbWF0aW9uT2JqZWN0LmN1cnJlbnRTdGVwID0gdGhpcy5hbmltYXRpb25zW2ldLmFuaW1hdGlvbk9iamVjdC5udW1TdGVwcztcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0dGhpcy5hbmltYXRpb25zW2ldLmFuaW1hdGlvbk9iamVjdC5yZW5kZXIodGhpcy5hbmltYXRpb25zW2ldLmNoYXJ0SW5zdGFuY2UsIHRoaXMuYW5pbWF0aW9uc1tpXS5hbmltYXRpb25PYmplY3QpO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gQ2hlY2sgaWYgZXhlY3V0ZWQgdGhlIGxhc3QgZnJhbWUuXG5cdFx0XHRcdGlmICh0aGlzLmFuaW1hdGlvbnNbaV0uYW5pbWF0aW9uT2JqZWN0LmN1cnJlbnRTdGVwID09IHRoaXMuYW5pbWF0aW9uc1tpXS5hbmltYXRpb25PYmplY3QubnVtU3RlcHMpe1xuXHRcdFx0XHRcdC8vIENhbGwgb25BbmltYXRpb25Db21wbGV0ZVxuXHRcdFx0XHRcdHRoaXMuYW5pbWF0aW9uc1tpXS5hbmltYXRpb25PYmplY3Qub25BbmltYXRpb25Db21wbGV0ZS5jYWxsKHRoaXMuYW5pbWF0aW9uc1tpXS5jaGFydEluc3RhbmNlKTtcblx0XHRcdFx0XHQvLyBSZW1vdmUgdGhlIGFuaW1hdGlvbi5cblx0XHRcdFx0XHR0aGlzLmFuaW1hdGlvbnMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdC8vIEtlZXAgdGhlIGluZGV4IGluIHBsYWNlIHRvIG9mZnNldCB0aGUgc3BsaWNlXG5cdFx0XHRcdFx0aS0tO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHZhciBlbmRUaW1lID0gRGF0ZS5ub3coKTtcblx0XHRcdHZhciBkZWxheSA9IGVuZFRpbWUgLSBzdGFydFRpbWUgLSB0aGlzLmZyYW1lRHVyYXRpb247XG5cdFx0XHR2YXIgZnJhbWVEZWxheSA9IGRlbGF5IC8gdGhpcy5mcmFtZUR1cmF0aW9uO1xuXG5cdFx0XHRpZihmcmFtZURlbGF5ID4gMSl7XG5cdFx0XHRcdHRoaXMuZHJvcEZyYW1lcyArPSBmcmFtZURlbGF5O1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBEbyB3ZSBoYXZlIG1vcmUgc3R1ZmYgdG8gYW5pbWF0ZT9cblx0XHRcdGlmICh0aGlzLmFuaW1hdGlvbnMubGVuZ3RoID4gMCl7XG5cdFx0XHRcdGhlbHBlcnMucmVxdWVzdEFuaW1GcmFtZS5jYWxsKHdpbmRvdywgdGhpcy5kaWdlc3RXcmFwcGVyKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0Ly8gQXR0YWNoIGdsb2JhbCBldmVudCB0byByZXNpemUgZWFjaCBjaGFydCBpbnN0YW5jZSB3aGVuIHRoZSBicm93c2VyIHJlc2l6ZXNcblx0aGVscGVycy5hZGRFdmVudCh3aW5kb3csIFwicmVzaXplXCIsIChmdW5jdGlvbigpe1xuXHRcdC8vIEJhc2ljIGRlYm91bmNlIG9mIHJlc2l6ZSBmdW5jdGlvbiBzbyBpdCBkb2Vzbid0IGh1cnQgcGVyZm9ybWFuY2Ugd2hlbiByZXNpemluZyBicm93c2VyLlxuXHRcdHZhciB0aW1lb3V0O1xuXHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdFx0dGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0ZWFjaChDaGFydC5pbnN0YW5jZXMsZnVuY3Rpb24oaW5zdGFuY2Upe1xuXHRcdFx0XHRcdC8vIElmIHRoZSByZXNwb25zaXZlIGZsYWcgaXMgc2V0IGluIHRoZSBjaGFydCBpbnN0YW5jZSBjb25maWdcblx0XHRcdFx0XHQvLyBDYXNjYWRlIHRoZSByZXNpemUgZXZlbnQgZG93biB0byB0aGUgY2hhcnQuXG5cdFx0XHRcdFx0aWYgKGluc3RhbmNlLm9wdGlvbnMucmVzcG9uc2l2ZSl7XG5cdFx0XHRcdFx0XHRpbnN0YW5jZS5yZXNpemUoaW5zdGFuY2UucmVuZGVyLCB0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSwgNTApO1xuXHRcdH07XG5cdH0pKCkpO1xuXG5cblx0aWYgKGFtZCkge1xuXHRcdGRlZmluZSgnQ2hhcnQnLCBbXSwgZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBDaGFydDtcblx0XHR9KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdG1vZHVsZS5leHBvcnRzID0gQ2hhcnQ7XG5cdH1cblxuXHRyb290LkNoYXJ0ID0gQ2hhcnQ7XG5cblx0Q2hhcnQubm9Db25mbGljdCA9IGZ1bmN0aW9uKCl7XG5cdFx0cm9vdC5DaGFydCA9IHByZXZpb3VzO1xuXHRcdHJldHVybiBDaGFydDtcblx0fTtcblxufSkuY2FsbCh0aGlzKTtcblxuKGZ1bmN0aW9uKCl7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciByb290ID0gdGhpcyxcblx0XHRDaGFydCA9IHJvb3QuQ2hhcnQsXG5cdFx0aGVscGVycyA9IENoYXJ0LmhlbHBlcnM7XG5cblxuXHR2YXIgZGVmYXVsdENvbmZpZyA9IHtcblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBzY2FsZSBzaG91bGQgc3RhcnQgYXQgemVybywgb3IgYW4gb3JkZXIgb2YgbWFnbml0dWRlIGRvd24gZnJvbSB0aGUgbG93ZXN0IHZhbHVlXG5cdFx0c2NhbGVCZWdpbkF0WmVybyA6IHRydWUsXG5cblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcblx0XHRzY2FsZVNob3dHcmlkTGluZXMgOiB0cnVlLFxuXG5cdFx0Ly9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGdyaWQgbGluZXNcblx0XHRzY2FsZUdyaWRMaW5lQ29sb3IgOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxuXG5cdFx0Ly9OdW1iZXIgLSBXaWR0aCBvZiB0aGUgZ3JpZCBsaW5lc1xuXHRcdHNjYWxlR3JpZExpbmVXaWR0aCA6IDEsXG5cblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgaG9yaXpvbnRhbCBsaW5lcyAoZXhjZXB0IFggYXhpcylcblx0XHRzY2FsZVNob3dIb3Jpem9udGFsTGluZXM6IHRydWUsXG5cblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgdmVydGljYWwgbGluZXMgKGV4Y2VwdCBZIGF4aXMpXG5cdFx0c2NhbGVTaG93VmVydGljYWxMaW5lczogdHJ1ZSxcblxuXHRcdC8vQm9vbGVhbiAtIElmIHRoZXJlIGlzIGEgc3Ryb2tlIG9uIGVhY2ggYmFyXG5cdFx0YmFyU2hvd1N0cm9rZSA6IHRydWUsXG5cblx0XHQvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHRoZSBiYXIgc3Ryb2tlXG5cdFx0YmFyU3Ryb2tlV2lkdGggOiAyLFxuXG5cdFx0Ly9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZWFjaCBvZiB0aGUgWCB2YWx1ZSBzZXRzXG5cdFx0YmFyVmFsdWVTcGFjaW5nIDogNSxcblxuXHRcdC8vTnVtYmVyIC0gU3BhY2luZyBiZXR3ZWVuIGRhdGEgc2V0cyB3aXRoaW4gWCB2YWx1ZXNcblx0XHRiYXJEYXRhc2V0U3BhY2luZyA6IDEsXG5cblx0XHQvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG5cdFx0bGVnZW5kVGVtcGxhdGUgOiBcIjx1bCBjbGFzcz1cXFwiPCU9bmFtZS50b0xvd2VyQ2FzZSgpJT4tbGVnZW5kXFxcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmQtaWNvblxcXCIgc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6PCU9ZGF0YXNldHNbaV0uZmlsbENvbG9yJT5cXFwiPjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiPCU9bmFtZS50b0xvd2VyQ2FzZSgpJT4tbGVnZW5kLXRleHRcXFwiPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9zcGFuPjwvbGk+PCV9JT48L3VsPlwiXG5cblx0fTtcblxuXG5cdENoYXJ0LlR5cGUuZXh0ZW5kKHtcblx0XHRuYW1lOiBcIkJhclwiLFxuXHRcdGRlZmF1bHRzIDogZGVmYXVsdENvbmZpZyxcblx0XHRpbml0aWFsaXplOiAgZnVuY3Rpb24oZGF0YSl7XG5cblx0XHRcdC8vRXhwb3NlIG9wdGlvbnMgYXMgYSBzY29wZSB2YXJpYWJsZSBoZXJlIHNvIHdlIGNhbiBhY2Nlc3MgaXQgaW4gdGhlIFNjYWxlQ2xhc3Ncblx0XHRcdHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG5cdFx0XHR0aGlzLlNjYWxlQ2xhc3MgPSBDaGFydC5TY2FsZS5leHRlbmQoe1xuXHRcdFx0XHRvZmZzZXRHcmlkTGluZXMgOiB0cnVlLFxuXHRcdFx0XHRjYWxjdWxhdGVCYXJYIDogZnVuY3Rpb24oZGF0YXNldENvdW50LCBkYXRhc2V0SW5kZXgsIGJhckluZGV4KXtcblx0XHRcdFx0XHQvL1JldXNhYmxlIG1ldGhvZCBmb3IgY2FsY3VsYXRpbmcgdGhlIHhQb3NpdGlvbiBvZiBhIGdpdmVuIGJhciBiYXNlZCBvbiBkYXRhc2V0SW5kZXggJiB3aWR0aCBvZiB0aGUgYmFyXG5cdFx0XHRcdFx0dmFyIHhXaWR0aCA9IHRoaXMuY2FsY3VsYXRlQmFzZVdpZHRoKCksXG5cdFx0XHRcdFx0XHR4QWJzb2x1dGUgPSB0aGlzLmNhbGN1bGF0ZVgoYmFySW5kZXgpIC0gKHhXaWR0aC8yKSxcblx0XHRcdFx0XHRcdGJhcldpZHRoID0gdGhpcy5jYWxjdWxhdGVCYXJXaWR0aChkYXRhc2V0Q291bnQpO1xuXG5cdFx0XHRcdFx0cmV0dXJuIHhBYnNvbHV0ZSArIChiYXJXaWR0aCAqIGRhdGFzZXRJbmRleCkgKyAoZGF0YXNldEluZGV4ICogb3B0aW9ucy5iYXJEYXRhc2V0U3BhY2luZykgKyBiYXJXaWR0aC8yO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRjYWxjdWxhdGVCYXNlV2lkdGggOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiAodGhpcy5jYWxjdWxhdGVYKDEpIC0gdGhpcy5jYWxjdWxhdGVYKDApKSAtICgyKm9wdGlvbnMuYmFyVmFsdWVTcGFjaW5nKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0Y2FsY3VsYXRlQmFyV2lkdGggOiBmdW5jdGlvbihkYXRhc2V0Q291bnQpe1xuXHRcdFx0XHRcdC8vVGhlIHBhZGRpbmcgYmV0d2VlbiBkYXRhc2V0cyBpcyB0byB0aGUgcmlnaHQgb2YgZWFjaCBiYXIsIHByb3ZpZGluZyB0aGF0IHRoZXJlIGFyZSBtb3JlIHRoYW4gMSBkYXRhc2V0XG5cdFx0XHRcdFx0dmFyIGJhc2VXaWR0aCA9IHRoaXMuY2FsY3VsYXRlQmFzZVdpZHRoKCkgLSAoKGRhdGFzZXRDb3VudCAtIDEpICogb3B0aW9ucy5iYXJEYXRhc2V0U3BhY2luZyk7XG5cblx0XHRcdFx0XHRyZXR1cm4gKGJhc2VXaWR0aCAvIGRhdGFzZXRDb3VudCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLmRhdGFzZXRzID0gW107XG5cblx0XHRcdC8vU2V0IHVwIHRvb2x0aXAgZXZlbnRzIG9uIHRoZSBjaGFydFxuXHRcdFx0aWYgKHRoaXMub3B0aW9ucy5zaG93VG9vbHRpcHMpe1xuXHRcdFx0XHRoZWxwZXJzLmJpbmRFdmVudHModGhpcywgdGhpcy5vcHRpb25zLnRvb2x0aXBFdmVudHMsIGZ1bmN0aW9uKGV2dCl7XG5cdFx0XHRcdFx0dmFyIGFjdGl2ZUJhcnMgPSAoZXZ0LnR5cGUgIT09ICdtb3VzZW91dCcpID8gdGhpcy5nZXRCYXJzQXRFdmVudChldnQpIDogW107XG5cblx0XHRcdFx0XHR0aGlzLmVhY2hCYXJzKGZ1bmN0aW9uKGJhcil7XG5cdFx0XHRcdFx0XHRiYXIucmVzdG9yZShbJ2ZpbGxDb2xvcicsICdzdHJva2VDb2xvciddKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRoZWxwZXJzLmVhY2goYWN0aXZlQmFycywgZnVuY3Rpb24oYWN0aXZlQmFyKXtcblx0XHRcdFx0XHRcdGlmIChhY3RpdmVCYXIpIHtcblx0XHRcdFx0XHRcdFx0YWN0aXZlQmFyLmZpbGxDb2xvciA9IGFjdGl2ZUJhci5oaWdobGlnaHRGaWxsO1xuXHRcdFx0XHRcdFx0XHRhY3RpdmVCYXIuc3Ryb2tlQ29sb3IgPSBhY3RpdmVCYXIuaGlnaGxpZ2h0U3Ryb2tlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHRoaXMuc2hvd1Rvb2x0aXAoYWN0aXZlQmFycyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHQvL0RlY2xhcmUgdGhlIGV4dGVuc2lvbiBvZiB0aGUgZGVmYXVsdCBwb2ludCwgdG8gY2F0ZXIgZm9yIHRoZSBvcHRpb25zIHBhc3NlZCBpbiB0byB0aGUgY29uc3RydWN0b3Jcblx0XHRcdHRoaXMuQmFyQ2xhc3MgPSBDaGFydC5SZWN0YW5nbGUuZXh0ZW5kKHtcblx0XHRcdFx0c3Ryb2tlV2lkdGggOiB0aGlzLm9wdGlvbnMuYmFyU3Ryb2tlV2lkdGgsXG5cdFx0XHRcdHNob3dTdHJva2UgOiB0aGlzLm9wdGlvbnMuYmFyU2hvd1N0cm9rZSxcblx0XHRcdFx0Y3R4IDogdGhpcy5jaGFydC5jdHhcblx0XHRcdH0pO1xuXG5cdFx0XHQvL0l0ZXJhdGUgdGhyb3VnaCBlYWNoIG9mIHRoZSBkYXRhc2V0cywgYW5kIGJ1aWxkIHRoaXMgaW50byBhIHByb3BlcnR5IG9mIHRoZSBjaGFydFxuXHRcdFx0aGVscGVycy5lYWNoKGRhdGEuZGF0YXNldHMsZnVuY3Rpb24oZGF0YXNldCxkYXRhc2V0SW5kZXgpe1xuXG5cdFx0XHRcdHZhciBkYXRhc2V0T2JqZWN0ID0ge1xuXHRcdFx0XHRcdGxhYmVsIDogZGF0YXNldC5sYWJlbCB8fCBudWxsLFxuXHRcdFx0XHRcdGZpbGxDb2xvciA6IGRhdGFzZXQuZmlsbENvbG9yLFxuXHRcdFx0XHRcdHN0cm9rZUNvbG9yIDogZGF0YXNldC5zdHJva2VDb2xvcixcblx0XHRcdFx0XHRiYXJzIDogW11cblx0XHRcdFx0fTtcblxuXHRcdFx0XHR0aGlzLmRhdGFzZXRzLnB1c2goZGF0YXNldE9iamVjdCk7XG5cblx0XHRcdFx0aGVscGVycy5lYWNoKGRhdGFzZXQuZGF0YSxmdW5jdGlvbihkYXRhUG9pbnQsaW5kZXgpe1xuXHRcdFx0XHRcdC8vQWRkIGEgbmV3IHBvaW50IGZvciBlYWNoIHBpZWNlIG9mIGRhdGEsIHBhc3NpbmcgYW55IHJlcXVpcmVkIGRhdGEgdG8gZHJhdy5cblx0XHRcdFx0XHRkYXRhc2V0T2JqZWN0LmJhcnMucHVzaChuZXcgdGhpcy5CYXJDbGFzcyh7XG5cdFx0XHRcdFx0XHR2YWx1ZSA6IGRhdGFQb2ludCxcblx0XHRcdFx0XHRcdGxhYmVsIDogZGF0YS5sYWJlbHNbaW5kZXhdLFxuXHRcdFx0XHRcdFx0ZGF0YXNldExhYmVsOiBkYXRhc2V0LmxhYmVsLFxuXHRcdFx0XHRcdFx0c3Ryb2tlQ29sb3IgOiAodHlwZW9mIGRhdGFzZXQuc3Ryb2tlQ29sb3IgPT0gJ29iamVjdCcpID8gZGF0YXNldC5zdHJva2VDb2xvcltpbmRleF0gOiBkYXRhc2V0LnN0cm9rZUNvbG9yLFxuXHRcdFx0XHRcdFx0ZmlsbENvbG9yIDogKHR5cGVvZiBkYXRhc2V0LmZpbGxDb2xvciA9PSAnb2JqZWN0JykgPyBkYXRhc2V0LmZpbGxDb2xvcltpbmRleF0gOiBkYXRhc2V0LmZpbGxDb2xvcixcblx0XHRcdFx0XHRcdGhpZ2hsaWdodEZpbGwgOiAoZGF0YXNldC5oaWdobGlnaHRGaWxsKSA/ICh0eXBlb2YgZGF0YXNldC5oaWdobGlnaHRGaWxsID09ICdvYmplY3QnKSA/IGRhdGFzZXQuaGlnaGxpZ2h0RmlsbFtpbmRleF0gOiBkYXRhc2V0LmhpZ2hsaWdodEZpbGwgOiAodHlwZW9mIGRhdGFzZXQuZmlsbENvbG9yID09ICdvYmplY3QnKSA/IGRhdGFzZXQuZmlsbENvbG9yW2luZGV4XSA6IGRhdGFzZXQuZmlsbENvbG9yLFxuXHRcdFx0XHRcdFx0aGlnaGxpZ2h0U3Ryb2tlIDogKGRhdGFzZXQuaGlnaGxpZ2h0U3Ryb2tlKSA/ICh0eXBlb2YgZGF0YXNldC5oaWdobGlnaHRTdHJva2UgPT0gJ29iamVjdCcpID8gZGF0YXNldC5oaWdobGlnaHRTdHJva2VbaW5kZXhdIDogZGF0YXNldC5oaWdobGlnaHRTdHJva2UgOiAodHlwZW9mIGRhdGFzZXQuc3Ryb2tlQ29sb3IgPT0gJ29iamVjdCcpID8gZGF0YXNldC5zdHJva2VDb2xvcltpbmRleF0gOiBkYXRhc2V0LnN0cm9rZUNvbG9yXG5cdFx0XHRcdFx0fSkpO1xuXHRcdFx0XHR9LHRoaXMpO1xuXG5cdFx0XHR9LHRoaXMpO1xuXG5cdFx0XHR0aGlzLmJ1aWxkU2NhbGUoZGF0YS5sYWJlbHMpO1xuXG5cdFx0XHR0aGlzLkJhckNsYXNzLnByb3RvdHlwZS5iYXNlID0gdGhpcy5zY2FsZS5lbmRQb2ludDtcblxuXHRcdFx0dGhpcy5lYWNoQmFycyhmdW5jdGlvbihiYXIsIGluZGV4LCBkYXRhc2V0SW5kZXgpe1xuXHRcdFx0XHRoZWxwZXJzLmV4dGVuZChiYXIsIHtcblx0XHRcdFx0XHR3aWR0aCA6IHRoaXMuc2NhbGUuY2FsY3VsYXRlQmFyV2lkdGgodGhpcy5kYXRhc2V0cy5sZW5ndGgpLFxuXHRcdFx0XHRcdHg6IHRoaXMuc2NhbGUuY2FsY3VsYXRlQmFyWCh0aGlzLmRhdGFzZXRzLmxlbmd0aCwgZGF0YXNldEluZGV4LCBpbmRleCksXG5cdFx0XHRcdFx0eTogdGhpcy5zY2FsZS5lbmRQb2ludFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0YmFyLnNhdmUoKTtcblx0XHRcdH0sIHRoaXMpO1xuXG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH0sXG5cdFx0dXBkYXRlIDogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuc2NhbGUudXBkYXRlKCk7XG5cdFx0XHQvLyBSZXNldCBhbnkgaGlnaGxpZ2h0IGNvbG91cnMgYmVmb3JlIHVwZGF0aW5nLlxuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuYWN0aXZlRWxlbWVudHMsIGZ1bmN0aW9uKGFjdGl2ZUVsZW1lbnQpe1xuXHRcdFx0XHRhY3RpdmVFbGVtZW50LnJlc3RvcmUoWydmaWxsQ29sb3InLCAnc3Ryb2tlQ29sb3InXSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5lYWNoQmFycyhmdW5jdGlvbihiYXIpe1xuXHRcdFx0XHRiYXIuc2F2ZSgpO1xuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH0sXG5cdFx0ZWFjaEJhcnMgOiBmdW5jdGlvbihjYWxsYmFjayl7XG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5kYXRhc2V0cyxmdW5jdGlvbihkYXRhc2V0LCBkYXRhc2V0SW5kZXgpe1xuXHRcdFx0XHRoZWxwZXJzLmVhY2goZGF0YXNldC5iYXJzLCBjYWxsYmFjaywgdGhpcywgZGF0YXNldEluZGV4KTtcblx0XHRcdH0sdGhpcyk7XG5cdFx0fSxcblx0XHRnZXRCYXJzQXRFdmVudCA6IGZ1bmN0aW9uKGUpe1xuXHRcdFx0dmFyIGJhcnNBcnJheSA9IFtdLFxuXHRcdFx0XHRldmVudFBvc2l0aW9uID0gaGVscGVycy5nZXRSZWxhdGl2ZVBvc2l0aW9uKGUpLFxuXHRcdFx0XHRkYXRhc2V0SXRlcmF0b3IgPSBmdW5jdGlvbihkYXRhc2V0KXtcblx0XHRcdFx0XHRiYXJzQXJyYXkucHVzaChkYXRhc2V0LmJhcnNbYmFySW5kZXhdKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0YmFySW5kZXg7XG5cblx0XHRcdGZvciAodmFyIGRhdGFzZXRJbmRleCA9IDA7IGRhdGFzZXRJbmRleCA8IHRoaXMuZGF0YXNldHMubGVuZ3RoOyBkYXRhc2V0SW5kZXgrKykge1xuXHRcdFx0XHRmb3IgKGJhckluZGV4ID0gMDsgYmFySW5kZXggPCB0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0uYmFycy5sZW5ndGg7IGJhckluZGV4KyspIHtcblx0XHRcdFx0XHRpZiAodGhpcy5kYXRhc2V0c1tkYXRhc2V0SW5kZXhdLmJhcnNbYmFySW5kZXhdLmluUmFuZ2UoZXZlbnRQb3NpdGlvbi54LGV2ZW50UG9zaXRpb24ueSkpe1xuXHRcdFx0XHRcdFx0aGVscGVycy5lYWNoKHRoaXMuZGF0YXNldHMsIGRhdGFzZXRJdGVyYXRvcik7XG5cdFx0XHRcdFx0XHRyZXR1cm4gYmFyc0FycmF5O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYmFyc0FycmF5O1xuXHRcdH0sXG5cdFx0YnVpbGRTY2FsZSA6IGZ1bmN0aW9uKGxhYmVscyl7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRcdHZhciBkYXRhVG90YWwgPSBmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgdmFsdWVzID0gW107XG5cdFx0XHRcdHNlbGYuZWFjaEJhcnMoZnVuY3Rpb24oYmFyKXtcblx0XHRcdFx0XHR2YWx1ZXMucHVzaChiYXIudmFsdWUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0cmV0dXJuIHZhbHVlcztcblx0XHRcdH07XG5cblx0XHRcdHZhciBzY2FsZU9wdGlvbnMgPSB7XG5cdFx0XHRcdHRlbXBsYXRlU3RyaW5nIDogdGhpcy5vcHRpb25zLnNjYWxlTGFiZWwsXG5cdFx0XHRcdGhlaWdodCA6IHRoaXMuY2hhcnQuaGVpZ2h0LFxuXHRcdFx0XHR3aWR0aCA6IHRoaXMuY2hhcnQud2lkdGgsXG5cdFx0XHRcdGN0eCA6IHRoaXMuY2hhcnQuY3R4LFxuXHRcdFx0XHR0ZXh0Q29sb3IgOiB0aGlzLm9wdGlvbnMuc2NhbGVGb250Q29sb3IsXG5cdFx0XHRcdGZvbnRTaXplIDogdGhpcy5vcHRpb25zLnNjYWxlRm9udFNpemUsXG5cdFx0XHRcdGZvbnRTdHlsZSA6IHRoaXMub3B0aW9ucy5zY2FsZUZvbnRTdHlsZSxcblx0XHRcdFx0Zm9udEZhbWlseSA6IHRoaXMub3B0aW9ucy5zY2FsZUZvbnRGYW1pbHksXG5cdFx0XHRcdHZhbHVlc0NvdW50IDogbGFiZWxzLmxlbmd0aCxcblx0XHRcdFx0YmVnaW5BdFplcm8gOiB0aGlzLm9wdGlvbnMuc2NhbGVCZWdpbkF0WmVybyxcblx0XHRcdFx0aW50ZWdlcnNPbmx5IDogdGhpcy5vcHRpb25zLnNjYWxlSW50ZWdlcnNPbmx5LFxuXHRcdFx0XHRjYWxjdWxhdGVZUmFuZ2U6IGZ1bmN0aW9uKGN1cnJlbnRIZWlnaHQpe1xuXHRcdFx0XHRcdHZhciB1cGRhdGVkUmFuZ2VzID0gaGVscGVycy5jYWxjdWxhdGVTY2FsZVJhbmdlKFxuXHRcdFx0XHRcdFx0ZGF0YVRvdGFsKCksXG5cdFx0XHRcdFx0XHRjdXJyZW50SGVpZ2h0LFxuXHRcdFx0XHRcdFx0dGhpcy5mb250U2l6ZSxcblx0XHRcdFx0XHRcdHRoaXMuYmVnaW5BdFplcm8sXG5cdFx0XHRcdFx0XHR0aGlzLmludGVnZXJzT25seVxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0aGVscGVycy5leHRlbmQodGhpcywgdXBkYXRlZFJhbmdlcyk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHhMYWJlbHMgOiBsYWJlbHMsXG5cdFx0XHRcdGZvbnQgOiBoZWxwZXJzLmZvbnRTdHJpbmcodGhpcy5vcHRpb25zLnNjYWxlRm9udFNpemUsIHRoaXMub3B0aW9ucy5zY2FsZUZvbnRTdHlsZSwgdGhpcy5vcHRpb25zLnNjYWxlRm9udEZhbWlseSksXG5cdFx0XHRcdGxpbmVXaWR0aCA6IHRoaXMub3B0aW9ucy5zY2FsZUxpbmVXaWR0aCxcblx0XHRcdFx0bGluZUNvbG9yIDogdGhpcy5vcHRpb25zLnNjYWxlTGluZUNvbG9yLFxuXHRcdFx0XHRzaG93SG9yaXpvbnRhbExpbmVzIDogdGhpcy5vcHRpb25zLnNjYWxlU2hvd0hvcml6b250YWxMaW5lcyxcblx0XHRcdFx0c2hvd1ZlcnRpY2FsTGluZXMgOiB0aGlzLm9wdGlvbnMuc2NhbGVTaG93VmVydGljYWxMaW5lcyxcblx0XHRcdFx0Z3JpZExpbmVXaWR0aCA6ICh0aGlzLm9wdGlvbnMuc2NhbGVTaG93R3JpZExpbmVzKSA/IHRoaXMub3B0aW9ucy5zY2FsZUdyaWRMaW5lV2lkdGggOiAwLFxuXHRcdFx0XHRncmlkTGluZUNvbG9yIDogKHRoaXMub3B0aW9ucy5zY2FsZVNob3dHcmlkTGluZXMpID8gdGhpcy5vcHRpb25zLnNjYWxlR3JpZExpbmVDb2xvciA6IFwicmdiYSgwLDAsMCwwKVwiLFxuXHRcdFx0XHRwYWRkaW5nIDogKHRoaXMub3B0aW9ucy5zaG93U2NhbGUpID8gMCA6ICh0aGlzLm9wdGlvbnMuYmFyU2hvd1N0cm9rZSkgPyB0aGlzLm9wdGlvbnMuYmFyU3Ryb2tlV2lkdGggOiAwLFxuXHRcdFx0XHRzaG93TGFiZWxzIDogdGhpcy5vcHRpb25zLnNjYWxlU2hvd0xhYmVscyxcblx0XHRcdFx0ZGlzcGxheSA6IHRoaXMub3B0aW9ucy5zaG93U2NhbGVcblx0XHRcdH07XG5cblx0XHRcdGlmICh0aGlzLm9wdGlvbnMuc2NhbGVPdmVycmlkZSl7XG5cdFx0XHRcdGhlbHBlcnMuZXh0ZW5kKHNjYWxlT3B0aW9ucywge1xuXHRcdFx0XHRcdGNhbGN1bGF0ZVlSYW5nZTogaGVscGVycy5ub29wLFxuXHRcdFx0XHRcdHN0ZXBzOiB0aGlzLm9wdGlvbnMuc2NhbGVTdGVwcyxcblx0XHRcdFx0XHRzdGVwVmFsdWU6IHRoaXMub3B0aW9ucy5zY2FsZVN0ZXBXaWR0aCxcblx0XHRcdFx0XHRtaW46IHRoaXMub3B0aW9ucy5zY2FsZVN0YXJ0VmFsdWUsXG5cdFx0XHRcdFx0bWF4OiB0aGlzLm9wdGlvbnMuc2NhbGVTdGFydFZhbHVlICsgKHRoaXMub3B0aW9ucy5zY2FsZVN0ZXBzICogdGhpcy5vcHRpb25zLnNjYWxlU3RlcFdpZHRoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zY2FsZSA9IG5ldyB0aGlzLlNjYWxlQ2xhc3Moc2NhbGVPcHRpb25zKTtcblx0XHR9LFxuXHRcdGFkZERhdGEgOiBmdW5jdGlvbih2YWx1ZXNBcnJheSxsYWJlbCl7XG5cdFx0XHQvL01hcCB0aGUgdmFsdWVzIGFycmF5IGZvciBlYWNoIG9mIHRoZSBkYXRhc2V0c1xuXHRcdFx0aGVscGVycy5lYWNoKHZhbHVlc0FycmF5LGZ1bmN0aW9uKHZhbHVlLGRhdGFzZXRJbmRleCl7XG5cdFx0XHRcdC8vQWRkIGEgbmV3IHBvaW50IGZvciBlYWNoIHBpZWNlIG9mIGRhdGEsIHBhc3NpbmcgYW55IHJlcXVpcmVkIGRhdGEgdG8gZHJhdy5cblx0XHRcdFx0dGhpcy5kYXRhc2V0c1tkYXRhc2V0SW5kZXhdLmJhcnMucHVzaChuZXcgdGhpcy5CYXJDbGFzcyh7XG5cdFx0XHRcdFx0dmFsdWUgOiB2YWx1ZSxcblx0XHRcdFx0XHRsYWJlbCA6IGxhYmVsLFxuXHRcdFx0XHRcdGRhdGFzZXRMYWJlbDogdGhpcy5kYXRhc2V0c1tkYXRhc2V0SW5kZXhdLmxhYmVsLFxuXHRcdFx0XHRcdHg6IHRoaXMuc2NhbGUuY2FsY3VsYXRlQmFyWCh0aGlzLmRhdGFzZXRzLmxlbmd0aCwgZGF0YXNldEluZGV4LCB0aGlzLnNjYWxlLnZhbHVlc0NvdW50KzEpLFxuXHRcdFx0XHRcdHk6IHRoaXMuc2NhbGUuZW5kUG9pbnQsXG5cdFx0XHRcdFx0d2lkdGggOiB0aGlzLnNjYWxlLmNhbGN1bGF0ZUJhcldpZHRoKHRoaXMuZGF0YXNldHMubGVuZ3RoKSxcblx0XHRcdFx0XHRiYXNlIDogdGhpcy5zY2FsZS5lbmRQb2ludCxcblx0XHRcdFx0XHRzdHJva2VDb2xvciA6IHRoaXMuZGF0YXNldHNbZGF0YXNldEluZGV4XS5zdHJva2VDb2xvcixcblx0XHRcdFx0XHRmaWxsQ29sb3IgOiB0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0uZmlsbENvbG9yXG5cdFx0XHRcdH0pKTtcblx0XHRcdH0sdGhpcyk7XG5cblx0XHRcdHRoaXMuc2NhbGUuYWRkWExhYmVsKGxhYmVsKTtcblx0XHRcdC8vVGhlbiByZS1yZW5kZXIgdGhlIGNoYXJ0LlxuXHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHR9LFxuXHRcdHJlbW92ZURhdGEgOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5zY2FsZS5yZW1vdmVYTGFiZWwoKTtcblx0XHRcdC8vVGhlbiByZS1yZW5kZXIgdGhlIGNoYXJ0LlxuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuZGF0YXNldHMsZnVuY3Rpb24oZGF0YXNldCl7XG5cdFx0XHRcdGRhdGFzZXQuYmFycy5zaGlmdCgpO1xuXHRcdFx0fSx0aGlzKTtcblx0XHRcdHRoaXMudXBkYXRlKCk7XG5cdFx0fSxcblx0XHRyZWZsb3cgOiBmdW5jdGlvbigpe1xuXHRcdFx0aGVscGVycy5leHRlbmQodGhpcy5CYXJDbGFzcy5wcm90b3R5cGUse1xuXHRcdFx0XHR5OiB0aGlzLnNjYWxlLmVuZFBvaW50LFxuXHRcdFx0XHRiYXNlIDogdGhpcy5zY2FsZS5lbmRQb2ludFxuXHRcdFx0fSk7XG5cdFx0XHR2YXIgbmV3U2NhbGVQcm9wcyA9IGhlbHBlcnMuZXh0ZW5kKHtcblx0XHRcdFx0aGVpZ2h0IDogdGhpcy5jaGFydC5oZWlnaHQsXG5cdFx0XHRcdHdpZHRoIDogdGhpcy5jaGFydC53aWR0aFxuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLnNjYWxlLnVwZGF0ZShuZXdTY2FsZVByb3BzKTtcblx0XHR9LFxuXHRcdGRyYXcgOiBmdW5jdGlvbihlYXNlKXtcblx0XHRcdHZhciBlYXNpbmdEZWNpbWFsID0gZWFzZSB8fCAxO1xuXHRcdFx0dGhpcy5jbGVhcigpO1xuXG5cdFx0XHR2YXIgY3R4ID0gdGhpcy5jaGFydC5jdHg7XG5cblx0XHRcdHRoaXMuc2NhbGUuZHJhdyhlYXNpbmdEZWNpbWFsKTtcblxuXHRcdFx0Ly9EcmF3IGFsbCB0aGUgYmFycyBmb3IgZWFjaCBkYXRhc2V0XG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5kYXRhc2V0cyxmdW5jdGlvbihkYXRhc2V0LGRhdGFzZXRJbmRleCl7XG5cdFx0XHRcdGhlbHBlcnMuZWFjaChkYXRhc2V0LmJhcnMsZnVuY3Rpb24oYmFyLGluZGV4KXtcblx0XHRcdFx0XHRpZiAoYmFyLmhhc1ZhbHVlKCkpe1xuXHRcdFx0XHRcdFx0YmFyLmJhc2UgPSB0aGlzLnNjYWxlLmVuZFBvaW50O1xuXHRcdFx0XHRcdFx0Ly9UcmFuc2l0aW9uIHRoZW4gZHJhd1xuXHRcdFx0XHRcdFx0YmFyLnRyYW5zaXRpb24oe1xuXHRcdFx0XHRcdFx0XHR4IDogdGhpcy5zY2FsZS5jYWxjdWxhdGVCYXJYKHRoaXMuZGF0YXNldHMubGVuZ3RoLCBkYXRhc2V0SW5kZXgsIGluZGV4KSxcblx0XHRcdFx0XHRcdFx0eSA6IHRoaXMuc2NhbGUuY2FsY3VsYXRlWShiYXIudmFsdWUpLFxuXHRcdFx0XHRcdFx0XHR3aWR0aCA6IHRoaXMuc2NhbGUuY2FsY3VsYXRlQmFyV2lkdGgodGhpcy5kYXRhc2V0cy5sZW5ndGgpXG5cdFx0XHRcdFx0XHR9LCBlYXNpbmdEZWNpbWFsKS5kcmF3KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LHRoaXMpO1xuXG5cdFx0XHR9LHRoaXMpO1xuXHRcdH1cblx0fSk7XG5cblxufSkuY2FsbCh0aGlzKTtcblxuKGZ1bmN0aW9uKCl7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciByb290ID0gdGhpcyxcblx0XHRDaGFydCA9IHJvb3QuQ2hhcnQsXG5cdFx0Ly9DYWNoZSBhIGxvY2FsIHJlZmVyZW5jZSB0byBDaGFydC5oZWxwZXJzXG5cdFx0aGVscGVycyA9IENoYXJ0LmhlbHBlcnM7XG5cblx0dmFyIGRlZmF1bHRDb25maWcgPSB7XG5cdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB3ZSBzaG91bGQgc2hvdyBhIHN0cm9rZSBvbiBlYWNoIHNlZ21lbnRcblx0XHRzZWdtZW50U2hvd1N0cm9rZSA6IHRydWUsXG5cblx0XHQvL1N0cmluZyAtIFRoZSBjb2xvdXIgb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuXHRcdHNlZ21lbnRTdHJva2VDb2xvciA6IFwiI2ZmZlwiLFxuXG5cdFx0Ly9OdW1iZXIgLSBUaGUgd2lkdGggb2YgZWFjaCBzZWdtZW50IHN0cm9rZVxuXHRcdHNlZ21lbnRTdHJva2VXaWR0aCA6IDIsXG5cblx0XHQvL1RoZSBwZXJjZW50YWdlIG9mIHRoZSBjaGFydCB0aGF0IHdlIGN1dCBvdXQgb2YgdGhlIG1pZGRsZS5cblx0XHRwZXJjZW50YWdlSW5uZXJDdXRvdXQgOiA1MCxcblxuXHRcdC8vTnVtYmVyIC0gQW1vdW50IG9mIGFuaW1hdGlvbiBzdGVwc1xuXHRcdGFuaW1hdGlvblN0ZXBzIDogMTAwLFxuXG5cdFx0Ly9TdHJpbmcgLSBBbmltYXRpb24gZWFzaW5nIGVmZmVjdFxuXHRcdGFuaW1hdGlvbkVhc2luZyA6IFwiZWFzZU91dEJvdW5jZVwiLFxuXG5cdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHRoZSByb3RhdGlvbiBvZiB0aGUgRG91Z2hudXRcblx0XHRhbmltYXRlUm90YXRlIDogdHJ1ZSxcblxuXHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgd2UgYW5pbWF0ZSBzY2FsaW5nIHRoZSBEb3VnaG51dCBmcm9tIHRoZSBjZW50cmVcblx0XHRhbmltYXRlU2NhbGUgOiBmYWxzZSxcblxuXHRcdC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcblx0XHRsZWdlbmRUZW1wbGF0ZSA6IFwiPHVsIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmRcXFwiPjwlIGZvciAodmFyIGk9MDsgaTxzZWdtZW50cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZC1pY29uXFxcIiBzdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjo8JT1zZWdtZW50c1tpXS5maWxsQ29sb3IlPlxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmQtdGV4dFxcXCI+PCVpZihzZWdtZW50c1tpXS5sYWJlbCl7JT48JT1zZWdtZW50c1tpXS5sYWJlbCU+PCV9JT48L3NwYW4+PC9saT48JX0lPjwvdWw+XCJcblxuXHR9O1xuXG5cdENoYXJ0LlR5cGUuZXh0ZW5kKHtcblx0XHQvL1Bhc3NpbmcgaW4gYSBuYW1lIHJlZ2lzdGVycyB0aGlzIGNoYXJ0IGluIHRoZSBDaGFydCBuYW1lc3BhY2Vcblx0XHRuYW1lOiBcIkRvdWdobnV0XCIsXG5cdFx0Ly9Qcm92aWRpbmcgYSBkZWZhdWx0cyB3aWxsIGFsc28gcmVnaXN0ZXIgdGhlIGRlZmF1bHRzIGluIHRoZSBjaGFydCBuYW1lc3BhY2Vcblx0XHRkZWZhdWx0cyA6IGRlZmF1bHRDb25maWcsXG5cdFx0Ly9Jbml0aWFsaXplIGlzIGZpcmVkIHdoZW4gdGhlIGNoYXJ0IGlzIGluaXRpYWxpemVkIC0gRGF0YSBpcyBwYXNzZWQgaW4gYXMgYSBwYXJhbWV0ZXJcblx0XHQvL0NvbmZpZyBpcyBhdXRvbWF0aWNhbGx5IG1lcmdlZCBieSB0aGUgY29yZSBvZiBDaGFydC5qcywgYW5kIGlzIGF2YWlsYWJsZSBhdCB0aGlzLm9wdGlvbnNcblx0XHRpbml0aWFsaXplOiAgZnVuY3Rpb24oZGF0YSl7XG5cblx0XHRcdC8vRGVjbGFyZSBzZWdtZW50cyBhcyBhIHN0YXRpYyBwcm9wZXJ0eSB0byBwcmV2ZW50IGluaGVyaXRpbmcgYWNyb3NzIHRoZSBDaGFydCB0eXBlIHByb3RvdHlwZVxuXHRcdFx0dGhpcy5zZWdtZW50cyA9IFtdO1xuXHRcdFx0dGhpcy5vdXRlclJhZGl1cyA9IChoZWxwZXJzLm1pbihbdGhpcy5jaGFydC53aWR0aCx0aGlzLmNoYXJ0LmhlaWdodF0pIC1cdHRoaXMub3B0aW9ucy5zZWdtZW50U3Ryb2tlV2lkdGgvMikvMjtcblxuXHRcdFx0dGhpcy5TZWdtZW50QXJjID0gQ2hhcnQuQXJjLmV4dGVuZCh7XG5cdFx0XHRcdGN0eCA6IHRoaXMuY2hhcnQuY3R4LFxuXHRcdFx0XHR4IDogdGhpcy5jaGFydC53aWR0aC8yLFxuXHRcdFx0XHR5IDogdGhpcy5jaGFydC5oZWlnaHQvMlxuXHRcdFx0fSk7XG5cblx0XHRcdC8vU2V0IHVwIHRvb2x0aXAgZXZlbnRzIG9uIHRoZSBjaGFydFxuXHRcdFx0aWYgKHRoaXMub3B0aW9ucy5zaG93VG9vbHRpcHMpe1xuXHRcdFx0XHRoZWxwZXJzLmJpbmRFdmVudHModGhpcywgdGhpcy5vcHRpb25zLnRvb2x0aXBFdmVudHMsIGZ1bmN0aW9uKGV2dCl7XG5cdFx0XHRcdFx0dmFyIGFjdGl2ZVNlZ21lbnRzID0gKGV2dC50eXBlICE9PSAnbW91c2VvdXQnKSA/IHRoaXMuZ2V0U2VnbWVudHNBdEV2ZW50KGV2dCkgOiBbXTtcblxuXHRcdFx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLnNlZ21lbnRzLGZ1bmN0aW9uKHNlZ21lbnQpe1xuXHRcdFx0XHRcdFx0c2VnbWVudC5yZXN0b3JlKFtcImZpbGxDb2xvclwiXSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0aGVscGVycy5lYWNoKGFjdGl2ZVNlZ21lbnRzLGZ1bmN0aW9uKGFjdGl2ZVNlZ21lbnQpe1xuXHRcdFx0XHRcdFx0YWN0aXZlU2VnbWVudC5maWxsQ29sb3IgPSBhY3RpdmVTZWdtZW50LmhpZ2hsaWdodENvbG9yO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHRoaXMuc2hvd1Rvb2x0aXAoYWN0aXZlU2VnbWVudHMpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdHRoaXMuY2FsY3VsYXRlVG90YWwoZGF0YSk7XG5cblx0XHRcdGhlbHBlcnMuZWFjaChkYXRhLGZ1bmN0aW9uKGRhdGFwb2ludCwgaW5kZXgpe1xuXHRcdFx0XHRpZiAoIWRhdGFwb2ludC5jb2xvcikge1xuXHRcdFx0XHRcdGRhdGFwb2ludC5jb2xvciA9ICdoc2woJyArICgzNjAgKiBpbmRleCAvIGRhdGEubGVuZ3RoKSArICcsIDEwMCUsIDUwJSknO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuYWRkRGF0YShkYXRhcG9pbnQsIGluZGV4LCB0cnVlKTtcblx0XHRcdH0sdGhpcyk7XG5cblx0XHRcdHRoaXMucmVuZGVyKCk7XG5cdFx0fSxcblx0XHRnZXRTZWdtZW50c0F0RXZlbnQgOiBmdW5jdGlvbihlKXtcblx0XHRcdHZhciBzZWdtZW50c0FycmF5ID0gW107XG5cblx0XHRcdHZhciBsb2NhdGlvbiA9IGhlbHBlcnMuZ2V0UmVsYXRpdmVQb3NpdGlvbihlKTtcblxuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuc2VnbWVudHMsZnVuY3Rpb24oc2VnbWVudCl7XG5cdFx0XHRcdGlmIChzZWdtZW50LmluUmFuZ2UobG9jYXRpb24ueCxsb2NhdGlvbi55KSkgc2VnbWVudHNBcnJheS5wdXNoKHNlZ21lbnQpO1xuXHRcdFx0fSx0aGlzKTtcblx0XHRcdHJldHVybiBzZWdtZW50c0FycmF5O1xuXHRcdH0sXG5cdFx0YWRkRGF0YSA6IGZ1bmN0aW9uKHNlZ21lbnQsIGF0SW5kZXgsIHNpbGVudCl7XG5cdFx0XHR2YXIgaW5kZXggPSBhdEluZGV4ICE9PSB1bmRlZmluZWQgPyBhdEluZGV4IDogdGhpcy5zZWdtZW50cy5sZW5ndGg7XG5cdFx0XHRpZiAoIHR5cGVvZihzZWdtZW50LmNvbG9yKSA9PT0gXCJ1bmRlZmluZWRcIiApIHtcblx0XHRcdFx0c2VnbWVudC5jb2xvciA9IENoYXJ0LmRlZmF1bHRzLmdsb2JhbC5zZWdtZW50Q29sb3JEZWZhdWx0W2luZGV4ICUgQ2hhcnQuZGVmYXVsdHMuZ2xvYmFsLnNlZ21lbnRDb2xvckRlZmF1bHQubGVuZ3RoXTtcblx0XHRcdFx0c2VnbWVudC5oaWdobGlnaHQgPSBDaGFydC5kZWZhdWx0cy5nbG9iYWwuc2VnbWVudEhpZ2hsaWdodENvbG9yRGVmYXVsdHNbaW5kZXggJSBDaGFydC5kZWZhdWx0cy5nbG9iYWwuc2VnbWVudEhpZ2hsaWdodENvbG9yRGVmYXVsdHMubGVuZ3RoXTtcdFx0XHRcdFxuXHRcdFx0fVxuXHRcdFx0dGhpcy5zZWdtZW50cy5zcGxpY2UoaW5kZXgsIDAsIG5ldyB0aGlzLlNlZ21lbnRBcmMoe1xuXHRcdFx0XHR2YWx1ZSA6IHNlZ21lbnQudmFsdWUsXG5cdFx0XHRcdG91dGVyUmFkaXVzIDogKHRoaXMub3B0aW9ucy5hbmltYXRlU2NhbGUpID8gMCA6IHRoaXMub3V0ZXJSYWRpdXMsXG5cdFx0XHRcdGlubmVyUmFkaXVzIDogKHRoaXMub3B0aW9ucy5hbmltYXRlU2NhbGUpID8gMCA6ICh0aGlzLm91dGVyUmFkaXVzLzEwMCkgKiB0aGlzLm9wdGlvbnMucGVyY2VudGFnZUlubmVyQ3V0b3V0LFxuXHRcdFx0XHRmaWxsQ29sb3IgOiBzZWdtZW50LmNvbG9yLFxuXHRcdFx0XHRoaWdobGlnaHRDb2xvciA6IHNlZ21lbnQuaGlnaGxpZ2h0IHx8IHNlZ21lbnQuY29sb3IsXG5cdFx0XHRcdHNob3dTdHJva2UgOiB0aGlzLm9wdGlvbnMuc2VnbWVudFNob3dTdHJva2UsXG5cdFx0XHRcdHN0cm9rZVdpZHRoIDogdGhpcy5vcHRpb25zLnNlZ21lbnRTdHJva2VXaWR0aCxcblx0XHRcdFx0c3Ryb2tlQ29sb3IgOiB0aGlzLm9wdGlvbnMuc2VnbWVudFN0cm9rZUNvbG9yLFxuXHRcdFx0XHRzdGFydEFuZ2xlIDogTWF0aC5QSSAqIDEuNSxcblx0XHRcdFx0Y2lyY3VtZmVyZW5jZSA6ICh0aGlzLm9wdGlvbnMuYW5pbWF0ZVJvdGF0ZSkgPyAwIDogdGhpcy5jYWxjdWxhdGVDaXJjdW1mZXJlbmNlKHNlZ21lbnQudmFsdWUpLFxuXHRcdFx0XHRsYWJlbCA6IHNlZ21lbnQubGFiZWxcblx0XHRcdH0pKTtcblx0XHRcdGlmICghc2lsZW50KXtcblx0XHRcdFx0dGhpcy5yZWZsb3coKTtcblx0XHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGNhbGN1bGF0ZUNpcmN1bWZlcmVuY2UgOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0aWYgKCB0aGlzLnRvdGFsID4gMCApIHtcblx0XHRcdFx0cmV0dXJuIChNYXRoLlBJKjIpKih2YWx1ZSAvIHRoaXMudG90YWwpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRjYWxjdWxhdGVUb3RhbCA6IGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0dGhpcy50b3RhbCA9IDA7XG5cdFx0XHRoZWxwZXJzLmVhY2goZGF0YSxmdW5jdGlvbihzZWdtZW50KXtcblx0XHRcdFx0dGhpcy50b3RhbCArPSBNYXRoLmFicyhzZWdtZW50LnZhbHVlKTtcblx0XHRcdH0sdGhpcyk7XG5cdFx0fSxcblx0XHR1cGRhdGUgOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5jYWxjdWxhdGVUb3RhbCh0aGlzLnNlZ21lbnRzKTtcblxuXHRcdFx0Ly8gUmVzZXQgYW55IGhpZ2hsaWdodCBjb2xvdXJzIGJlZm9yZSB1cGRhdGluZy5cblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLmFjdGl2ZUVsZW1lbnRzLCBmdW5jdGlvbihhY3RpdmVFbGVtZW50KXtcblx0XHRcdFx0YWN0aXZlRWxlbWVudC5yZXN0b3JlKFsnZmlsbENvbG9yJ10pO1xuXHRcdFx0fSk7XG5cblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLnNlZ21lbnRzLGZ1bmN0aW9uKHNlZ21lbnQpe1xuXHRcdFx0XHRzZWdtZW50LnNhdmUoKTtcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR9LFxuXG5cdFx0cmVtb3ZlRGF0YTogZnVuY3Rpb24oYXRJbmRleCl7XG5cdFx0XHR2YXIgaW5kZXhUb0RlbGV0ZSA9IChoZWxwZXJzLmlzTnVtYmVyKGF0SW5kZXgpKSA/IGF0SW5kZXggOiB0aGlzLnNlZ21lbnRzLmxlbmd0aC0xO1xuXHRcdFx0dGhpcy5zZWdtZW50cy5zcGxpY2UoaW5kZXhUb0RlbGV0ZSwgMSk7XG5cdFx0XHR0aGlzLnJlZmxvdygpO1xuXHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHR9LFxuXG5cdFx0cmVmbG93IDogZnVuY3Rpb24oKXtcblx0XHRcdGhlbHBlcnMuZXh0ZW5kKHRoaXMuU2VnbWVudEFyYy5wcm90b3R5cGUse1xuXHRcdFx0XHR4IDogdGhpcy5jaGFydC53aWR0aC8yLFxuXHRcdFx0XHR5IDogdGhpcy5jaGFydC5oZWlnaHQvMlxuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLm91dGVyUmFkaXVzID0gKGhlbHBlcnMubWluKFt0aGlzLmNoYXJ0LndpZHRoLHRoaXMuY2hhcnQuaGVpZ2h0XSkgLVx0dGhpcy5vcHRpb25zLnNlZ21lbnRTdHJva2VXaWR0aC8yKS8yO1xuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuc2VnbWVudHMsIGZ1bmN0aW9uKHNlZ21lbnQpe1xuXHRcdFx0XHRzZWdtZW50LnVwZGF0ZSh7XG5cdFx0XHRcdFx0b3V0ZXJSYWRpdXMgOiB0aGlzLm91dGVyUmFkaXVzLFxuXHRcdFx0XHRcdGlubmVyUmFkaXVzIDogKHRoaXMub3V0ZXJSYWRpdXMvMTAwKSAqIHRoaXMub3B0aW9ucy5wZXJjZW50YWdlSW5uZXJDdXRvdXRcblx0XHRcdFx0fSk7XG5cdFx0XHR9LCB0aGlzKTtcblx0XHR9LFxuXHRcdGRyYXcgOiBmdW5jdGlvbihlYXNlRGVjaW1hbCl7XG5cdFx0XHR2YXIgYW5pbURlY2ltYWwgPSAoZWFzZURlY2ltYWwpID8gZWFzZURlY2ltYWwgOiAxO1xuXHRcdFx0dGhpcy5jbGVhcigpO1xuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuc2VnbWVudHMsZnVuY3Rpb24oc2VnbWVudCxpbmRleCl7XG5cdFx0XHRcdHNlZ21lbnQudHJhbnNpdGlvbih7XG5cdFx0XHRcdFx0Y2lyY3VtZmVyZW5jZSA6IHRoaXMuY2FsY3VsYXRlQ2lyY3VtZmVyZW5jZShzZWdtZW50LnZhbHVlKSxcblx0XHRcdFx0XHRvdXRlclJhZGl1cyA6IHRoaXMub3V0ZXJSYWRpdXMsXG5cdFx0XHRcdFx0aW5uZXJSYWRpdXMgOiAodGhpcy5vdXRlclJhZGl1cy8xMDApICogdGhpcy5vcHRpb25zLnBlcmNlbnRhZ2VJbm5lckN1dG91dFxuXHRcdFx0XHR9LGFuaW1EZWNpbWFsKTtcblxuXHRcdFx0XHRzZWdtZW50LmVuZEFuZ2xlID0gc2VnbWVudC5zdGFydEFuZ2xlICsgc2VnbWVudC5jaXJjdW1mZXJlbmNlO1xuXG5cdFx0XHRcdHNlZ21lbnQuZHJhdygpO1xuXHRcdFx0XHRpZiAoaW5kZXggPT09IDApe1xuXHRcdFx0XHRcdHNlZ21lbnQuc3RhcnRBbmdsZSA9IE1hdGguUEkgKiAxLjU7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly9DaGVjayB0byBzZWUgaWYgaXQncyB0aGUgbGFzdCBzZWdtZW50LCBpZiBub3QgZ2V0IHRoZSBuZXh0IGFuZCB1cGRhdGUgdGhlIHN0YXJ0IGFuZ2xlXG5cdFx0XHRcdGlmIChpbmRleCA8IHRoaXMuc2VnbWVudHMubGVuZ3RoLTEpe1xuXHRcdFx0XHRcdHRoaXMuc2VnbWVudHNbaW5kZXgrMV0uc3RhcnRBbmdsZSA9IHNlZ21lbnQuZW5kQW5nbGU7XG5cdFx0XHRcdH1cblx0XHRcdH0sdGhpcyk7XG5cblx0XHR9XG5cdH0pO1xuXG5cdENoYXJ0LnR5cGVzLkRvdWdobnV0LmV4dGVuZCh7XG5cdFx0bmFtZSA6IFwiUGllXCIsXG5cdFx0ZGVmYXVsdHMgOiBoZWxwZXJzLm1lcmdlKGRlZmF1bHRDb25maWcse3BlcmNlbnRhZ2VJbm5lckN1dG91dCA6IDB9KVxuXHR9KTtcblxufSkuY2FsbCh0aGlzKTtcblxuKGZ1bmN0aW9uKCl7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciByb290ID0gdGhpcyxcblx0XHRDaGFydCA9IHJvb3QuQ2hhcnQsXG5cdFx0aGVscGVycyA9IENoYXJ0LmhlbHBlcnM7XG5cblx0dmFyIGRlZmF1bHRDb25maWcgPSB7XG5cblx0XHQvLy9Cb29sZWFuIC0gV2hldGhlciBncmlkIGxpbmVzIGFyZSBzaG93biBhY3Jvc3MgdGhlIGNoYXJ0XG5cdFx0c2NhbGVTaG93R3JpZExpbmVzIDogdHJ1ZSxcblxuXHRcdC8vU3RyaW5nIC0gQ29sb3VyIG9mIHRoZSBncmlkIGxpbmVzXG5cdFx0c2NhbGVHcmlkTGluZUNvbG9yIDogXCJyZ2JhKDAsMCwwLC4wNSlcIixcblxuXHRcdC8vTnVtYmVyIC0gV2lkdGggb2YgdGhlIGdyaWQgbGluZXNcblx0XHRzY2FsZUdyaWRMaW5lV2lkdGggOiAxLFxuXG5cdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGhvcml6b250YWwgbGluZXMgKGV4Y2VwdCBYIGF4aXMpXG5cdFx0c2NhbGVTaG93SG9yaXpvbnRhbExpbmVzOiB0cnVlLFxuXG5cdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IHZlcnRpY2FsIGxpbmVzIChleGNlcHQgWSBheGlzKVxuXHRcdHNjYWxlU2hvd1ZlcnRpY2FsTGluZXM6IHRydWUsXG5cblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHRoZSBsaW5lIGlzIGN1cnZlZCBiZXR3ZWVuIHBvaW50c1xuXHRcdGJlemllckN1cnZlIDogdHJ1ZSxcblxuXHRcdC8vTnVtYmVyIC0gVGVuc2lvbiBvZiB0aGUgYmV6aWVyIGN1cnZlIGJldHdlZW4gcG9pbnRzXG5cdFx0YmV6aWVyQ3VydmVUZW5zaW9uIDogMC40LFxuXG5cdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGEgZG90IGZvciBlYWNoIHBvaW50XG5cdFx0cG9pbnREb3QgOiB0cnVlLFxuXG5cdFx0Ly9OdW1iZXIgLSBSYWRpdXMgb2YgZWFjaCBwb2ludCBkb3QgaW4gcGl4ZWxzXG5cdFx0cG9pbnREb3RSYWRpdXMgOiA0LFxuXG5cdFx0Ly9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiBwb2ludCBkb3Qgc3Ryb2tlXG5cdFx0cG9pbnREb3RTdHJva2VXaWR0aCA6IDEsXG5cblx0XHQvL051bWJlciAtIGFtb3VudCBleHRyYSB0byBhZGQgdG8gdGhlIHJhZGl1cyB0byBjYXRlciBmb3IgaGl0IGRldGVjdGlvbiBvdXRzaWRlIHRoZSBkcmF3biBwb2ludFxuXHRcdHBvaW50SGl0RGV0ZWN0aW9uUmFkaXVzIDogMjAsXG5cblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgYSBzdHJva2UgZm9yIGRhdGFzZXRzXG5cdFx0ZGF0YXNldFN0cm9rZSA6IHRydWUsXG5cblx0XHQvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIGRhdGFzZXQgc3Ryb2tlXG5cdFx0ZGF0YXNldFN0cm9rZVdpZHRoIDogMixcblxuXHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gZmlsbCB0aGUgZGF0YXNldCB3aXRoIGEgY29sb3VyXG5cdFx0ZGF0YXNldEZpbGwgOiB0cnVlLFxuXG5cdFx0Ly9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuXHRcdGxlZ2VuZFRlbXBsYXRlIDogXCI8dWwgY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZFxcXCI+PCUgZm9yICh2YXIgaT0wOyBpPGRhdGFzZXRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBjbGFzcz1cXFwiPCU9bmFtZS50b0xvd2VyQ2FzZSgpJT4tbGVnZW5kLWljb25cXFwiIHN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLnN0cm9rZUNvbG9yJT5cXFwiPjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiPCU9bmFtZS50b0xvd2VyQ2FzZSgpJT4tbGVnZW5kLXRleHRcXFwiPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9zcGFuPjwvbGk+PCV9JT48L3VsPlwiLFxuXG5cdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB0byBob3Jpem9udGFsbHkgY2VudGVyIHRoZSBsYWJlbCBhbmQgcG9pbnQgZG90IGluc2lkZSB0aGUgZ3JpZFxuXHRcdG9mZnNldEdyaWRMaW5lcyA6IGZhbHNlXG5cblx0fTtcblxuXG5cdENoYXJ0LlR5cGUuZXh0ZW5kKHtcblx0XHRuYW1lOiBcIkxpbmVcIixcblx0XHRkZWZhdWx0cyA6IGRlZmF1bHRDb25maWcsXG5cdFx0aW5pdGlhbGl6ZTogIGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0Ly9EZWNsYXJlIHRoZSBleHRlbnNpb24gb2YgdGhlIGRlZmF1bHQgcG9pbnQsIHRvIGNhdGVyIGZvciB0aGUgb3B0aW9ucyBwYXNzZWQgaW4gdG8gdGhlIGNvbnN0cnVjdG9yXG5cdFx0XHR0aGlzLlBvaW50Q2xhc3MgPSBDaGFydC5Qb2ludC5leHRlbmQoe1xuXHRcdFx0XHRvZmZzZXRHcmlkTGluZXMgOiB0aGlzLm9wdGlvbnMub2Zmc2V0R3JpZExpbmVzLFxuXHRcdFx0XHRzdHJva2VXaWR0aCA6IHRoaXMub3B0aW9ucy5wb2ludERvdFN0cm9rZVdpZHRoLFxuXHRcdFx0XHRyYWRpdXMgOiB0aGlzLm9wdGlvbnMucG9pbnREb3RSYWRpdXMsXG5cdFx0XHRcdGRpc3BsYXk6IHRoaXMub3B0aW9ucy5wb2ludERvdCxcblx0XHRcdFx0aGl0RGV0ZWN0aW9uUmFkaXVzIDogdGhpcy5vcHRpb25zLnBvaW50SGl0RGV0ZWN0aW9uUmFkaXVzLFxuXHRcdFx0XHRjdHggOiB0aGlzLmNoYXJ0LmN0eCxcblx0XHRcdFx0aW5SYW5nZSA6IGZ1bmN0aW9uKG1vdXNlWCl7XG5cdFx0XHRcdFx0cmV0dXJuIChNYXRoLnBvdyhtb3VzZVgtdGhpcy54LCAyKSA8IE1hdGgucG93KHRoaXMucmFkaXVzICsgdGhpcy5oaXREZXRlY3Rpb25SYWRpdXMsMikpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5kYXRhc2V0cyA9IFtdO1xuXG5cdFx0XHQvL1NldCB1cCB0b29sdGlwIGV2ZW50cyBvbiB0aGUgY2hhcnRcblx0XHRcdGlmICh0aGlzLm9wdGlvbnMuc2hvd1Rvb2x0aXBzKXtcblx0XHRcdFx0aGVscGVycy5iaW5kRXZlbnRzKHRoaXMsIHRoaXMub3B0aW9ucy50b29sdGlwRXZlbnRzLCBmdW5jdGlvbihldnQpe1xuXHRcdFx0XHRcdHZhciBhY3RpdmVQb2ludHMgPSAoZXZ0LnR5cGUgIT09ICdtb3VzZW91dCcpID8gdGhpcy5nZXRQb2ludHNBdEV2ZW50KGV2dCkgOiBbXTtcblx0XHRcdFx0XHR0aGlzLmVhY2hQb2ludHMoZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0XHRcdFx0cG9pbnQucmVzdG9yZShbJ2ZpbGxDb2xvcicsICdzdHJva2VDb2xvciddKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRoZWxwZXJzLmVhY2goYWN0aXZlUG9pbnRzLCBmdW5jdGlvbihhY3RpdmVQb2ludCl7XG5cdFx0XHRcdFx0XHRhY3RpdmVQb2ludC5maWxsQ29sb3IgPSBhY3RpdmVQb2ludC5oaWdobGlnaHRGaWxsO1xuXHRcdFx0XHRcdFx0YWN0aXZlUG9pbnQuc3Ryb2tlQ29sb3IgPSBhY3RpdmVQb2ludC5oaWdobGlnaHRTdHJva2U7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0dGhpcy5zaG93VG9vbHRpcChhY3RpdmVQb2ludHMpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0Ly9JdGVyYXRlIHRocm91Z2ggZWFjaCBvZiB0aGUgZGF0YXNldHMsIGFuZCBidWlsZCB0aGlzIGludG8gYSBwcm9wZXJ0eSBvZiB0aGUgY2hhcnRcblx0XHRcdGhlbHBlcnMuZWFjaChkYXRhLmRhdGFzZXRzLGZ1bmN0aW9uKGRhdGFzZXQpe1xuXG5cdFx0XHRcdHZhciBkYXRhc2V0T2JqZWN0ID0ge1xuXHRcdFx0XHRcdGxhYmVsIDogZGF0YXNldC5sYWJlbCB8fCBudWxsLFxuXHRcdFx0XHRcdGZpbGxDb2xvciA6IGRhdGFzZXQuZmlsbENvbG9yLFxuXHRcdFx0XHRcdHN0cm9rZUNvbG9yIDogZGF0YXNldC5zdHJva2VDb2xvcixcblx0XHRcdFx0XHRwb2ludENvbG9yIDogZGF0YXNldC5wb2ludENvbG9yLFxuXHRcdFx0XHRcdHBvaW50U3Ryb2tlQ29sb3IgOiBkYXRhc2V0LnBvaW50U3Ryb2tlQ29sb3IsXG5cdFx0XHRcdFx0cG9pbnRzIDogW11cblx0XHRcdFx0fTtcblxuXHRcdFx0XHR0aGlzLmRhdGFzZXRzLnB1c2goZGF0YXNldE9iamVjdCk7XG5cblxuXHRcdFx0XHRoZWxwZXJzLmVhY2goZGF0YXNldC5kYXRhLGZ1bmN0aW9uKGRhdGFQb2ludCxpbmRleCl7XG5cdFx0XHRcdFx0Ly9BZGQgYSBuZXcgcG9pbnQgZm9yIGVhY2ggcGllY2Ugb2YgZGF0YSwgcGFzc2luZyBhbnkgcmVxdWlyZWQgZGF0YSB0byBkcmF3LlxuXHRcdFx0XHRcdGRhdGFzZXRPYmplY3QucG9pbnRzLnB1c2gobmV3IHRoaXMuUG9pbnRDbGFzcyh7XG5cdFx0XHRcdFx0XHR2YWx1ZSA6IGRhdGFQb2ludCxcblx0XHRcdFx0XHRcdGxhYmVsIDogZGF0YS5sYWJlbHNbaW5kZXhdLFxuXHRcdFx0XHRcdFx0ZGF0YXNldExhYmVsOiBkYXRhc2V0LmxhYmVsLFxuXHRcdFx0XHRcdFx0c3Ryb2tlQ29sb3IgOiBkYXRhc2V0LnBvaW50U3Ryb2tlQ29sb3IsXG5cdFx0XHRcdFx0XHRmaWxsQ29sb3IgOiBkYXRhc2V0LnBvaW50Q29sb3IsXG5cdFx0XHRcdFx0XHRoaWdobGlnaHRGaWxsIDogZGF0YXNldC5wb2ludEhpZ2hsaWdodEZpbGwgfHwgZGF0YXNldC5wb2ludENvbG9yLFxuXHRcdFx0XHRcdFx0aGlnaGxpZ2h0U3Ryb2tlIDogZGF0YXNldC5wb2ludEhpZ2hsaWdodFN0cm9rZSB8fCBkYXRhc2V0LnBvaW50U3Ryb2tlQ29sb3Jcblx0XHRcdFx0XHR9KSk7XG5cdFx0XHRcdH0sdGhpcyk7XG5cblx0XHRcdFx0dGhpcy5idWlsZFNjYWxlKGRhdGEubGFiZWxzKTtcblxuXG5cdFx0XHRcdHRoaXMuZWFjaFBvaW50cyhmdW5jdGlvbihwb2ludCwgaW5kZXgpe1xuXHRcdFx0XHRcdGhlbHBlcnMuZXh0ZW5kKHBvaW50LCB7XG5cdFx0XHRcdFx0XHR4OiB0aGlzLnNjYWxlLmNhbGN1bGF0ZVgoaW5kZXgpLFxuXHRcdFx0XHRcdFx0eTogdGhpcy5zY2FsZS5lbmRQb2ludFxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHBvaW50LnNhdmUoKTtcblx0XHRcdFx0fSwgdGhpcyk7XG5cblx0XHRcdH0sdGhpcyk7XG5cblxuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR9LFxuXHRcdHVwZGF0ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLnNjYWxlLnVwZGF0ZSgpO1xuXHRcdFx0Ly8gUmVzZXQgYW55IGhpZ2hsaWdodCBjb2xvdXJzIGJlZm9yZSB1cGRhdGluZy5cblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLmFjdGl2ZUVsZW1lbnRzLCBmdW5jdGlvbihhY3RpdmVFbGVtZW50KXtcblx0XHRcdFx0YWN0aXZlRWxlbWVudC5yZXN0b3JlKFsnZmlsbENvbG9yJywgJ3N0cm9rZUNvbG9yJ10pO1xuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLmVhY2hQb2ludHMoZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0XHRwb2ludC5zYXZlKCk7XG5cdFx0XHR9KTtcblx0XHRcdHRoaXMucmVuZGVyKCk7XG5cdFx0fSxcblx0XHRlYWNoUG9pbnRzIDogZnVuY3Rpb24oY2FsbGJhY2spe1xuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuZGF0YXNldHMsZnVuY3Rpb24oZGF0YXNldCl7XG5cdFx0XHRcdGhlbHBlcnMuZWFjaChkYXRhc2V0LnBvaW50cyxjYWxsYmFjayx0aGlzKTtcblx0XHRcdH0sdGhpcyk7XG5cdFx0fSxcblx0XHRnZXRQb2ludHNBdEV2ZW50IDogZnVuY3Rpb24oZSl7XG5cdFx0XHR2YXIgcG9pbnRzQXJyYXkgPSBbXSxcblx0XHRcdFx0ZXZlbnRQb3NpdGlvbiA9IGhlbHBlcnMuZ2V0UmVsYXRpdmVQb3NpdGlvbihlKTtcblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLmRhdGFzZXRzLGZ1bmN0aW9uKGRhdGFzZXQpe1xuXHRcdFx0XHRoZWxwZXJzLmVhY2goZGF0YXNldC5wb2ludHMsZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0XHRcdGlmIChwb2ludC5pblJhbmdlKGV2ZW50UG9zaXRpb24ueCxldmVudFBvc2l0aW9uLnkpKSBwb2ludHNBcnJheS5wdXNoKHBvaW50KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9LHRoaXMpO1xuXHRcdFx0cmV0dXJuIHBvaW50c0FycmF5O1xuXHRcdH0sXG5cdFx0YnVpbGRTY2FsZSA6IGZ1bmN0aW9uKGxhYmVscyl7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHRcdHZhciBkYXRhVG90YWwgPSBmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgdmFsdWVzID0gW107XG5cdFx0XHRcdHNlbGYuZWFjaFBvaW50cyhmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRcdFx0dmFsdWVzLnB1c2gocG9pbnQudmFsdWUpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gdmFsdWVzO1xuXHRcdFx0fTtcblxuXHRcdFx0dmFyIHNjYWxlT3B0aW9ucyA9IHtcblx0XHRcdFx0dGVtcGxhdGVTdHJpbmcgOiB0aGlzLm9wdGlvbnMuc2NhbGVMYWJlbCxcblx0XHRcdFx0aGVpZ2h0IDogdGhpcy5jaGFydC5oZWlnaHQsXG5cdFx0XHRcdHdpZHRoIDogdGhpcy5jaGFydC53aWR0aCxcblx0XHRcdFx0Y3R4IDogdGhpcy5jaGFydC5jdHgsXG5cdFx0XHRcdHRleHRDb2xvciA6IHRoaXMub3B0aW9ucy5zY2FsZUZvbnRDb2xvcixcblx0XHRcdFx0b2Zmc2V0R3JpZExpbmVzIDogdGhpcy5vcHRpb25zLm9mZnNldEdyaWRMaW5lcyxcblx0XHRcdFx0Zm9udFNpemUgOiB0aGlzLm9wdGlvbnMuc2NhbGVGb250U2l6ZSxcblx0XHRcdFx0Zm9udFN0eWxlIDogdGhpcy5vcHRpb25zLnNjYWxlRm9udFN0eWxlLFxuXHRcdFx0XHRmb250RmFtaWx5IDogdGhpcy5vcHRpb25zLnNjYWxlRm9udEZhbWlseSxcblx0XHRcdFx0dmFsdWVzQ291bnQgOiBsYWJlbHMubGVuZ3RoLFxuXHRcdFx0XHRiZWdpbkF0WmVybyA6IHRoaXMub3B0aW9ucy5zY2FsZUJlZ2luQXRaZXJvLFxuXHRcdFx0XHRpbnRlZ2Vyc09ubHkgOiB0aGlzLm9wdGlvbnMuc2NhbGVJbnRlZ2Vyc09ubHksXG5cdFx0XHRcdGNhbGN1bGF0ZVlSYW5nZSA6IGZ1bmN0aW9uKGN1cnJlbnRIZWlnaHQpe1xuXHRcdFx0XHRcdHZhciB1cGRhdGVkUmFuZ2VzID0gaGVscGVycy5jYWxjdWxhdGVTY2FsZVJhbmdlKFxuXHRcdFx0XHRcdFx0ZGF0YVRvdGFsKCksXG5cdFx0XHRcdFx0XHRjdXJyZW50SGVpZ2h0LFxuXHRcdFx0XHRcdFx0dGhpcy5mb250U2l6ZSxcblx0XHRcdFx0XHRcdHRoaXMuYmVnaW5BdFplcm8sXG5cdFx0XHRcdFx0XHR0aGlzLmludGVnZXJzT25seVxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0aGVscGVycy5leHRlbmQodGhpcywgdXBkYXRlZFJhbmdlcyk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHhMYWJlbHMgOiBsYWJlbHMsXG5cdFx0XHRcdGZvbnQgOiBoZWxwZXJzLmZvbnRTdHJpbmcodGhpcy5vcHRpb25zLnNjYWxlRm9udFNpemUsIHRoaXMub3B0aW9ucy5zY2FsZUZvbnRTdHlsZSwgdGhpcy5vcHRpb25zLnNjYWxlRm9udEZhbWlseSksXG5cdFx0XHRcdGxpbmVXaWR0aCA6IHRoaXMub3B0aW9ucy5zY2FsZUxpbmVXaWR0aCxcblx0XHRcdFx0bGluZUNvbG9yIDogdGhpcy5vcHRpb25zLnNjYWxlTGluZUNvbG9yLFxuXHRcdFx0XHRzaG93SG9yaXpvbnRhbExpbmVzIDogdGhpcy5vcHRpb25zLnNjYWxlU2hvd0hvcml6b250YWxMaW5lcyxcblx0XHRcdFx0c2hvd1ZlcnRpY2FsTGluZXMgOiB0aGlzLm9wdGlvbnMuc2NhbGVTaG93VmVydGljYWxMaW5lcyxcblx0XHRcdFx0Z3JpZExpbmVXaWR0aCA6ICh0aGlzLm9wdGlvbnMuc2NhbGVTaG93R3JpZExpbmVzKSA/IHRoaXMub3B0aW9ucy5zY2FsZUdyaWRMaW5lV2lkdGggOiAwLFxuXHRcdFx0XHRncmlkTGluZUNvbG9yIDogKHRoaXMub3B0aW9ucy5zY2FsZVNob3dHcmlkTGluZXMpID8gdGhpcy5vcHRpb25zLnNjYWxlR3JpZExpbmVDb2xvciA6IFwicmdiYSgwLDAsMCwwKVwiLFxuXHRcdFx0XHRwYWRkaW5nOiAodGhpcy5vcHRpb25zLnNob3dTY2FsZSkgPyAwIDogdGhpcy5vcHRpb25zLnBvaW50RG90UmFkaXVzICsgdGhpcy5vcHRpb25zLnBvaW50RG90U3Ryb2tlV2lkdGgsXG5cdFx0XHRcdHNob3dMYWJlbHMgOiB0aGlzLm9wdGlvbnMuc2NhbGVTaG93TGFiZWxzLFxuXHRcdFx0XHRkaXNwbGF5IDogdGhpcy5vcHRpb25zLnNob3dTY2FsZVxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKHRoaXMub3B0aW9ucy5zY2FsZU92ZXJyaWRlKXtcblx0XHRcdFx0aGVscGVycy5leHRlbmQoc2NhbGVPcHRpb25zLCB7XG5cdFx0XHRcdFx0Y2FsY3VsYXRlWVJhbmdlOiBoZWxwZXJzLm5vb3AsXG5cdFx0XHRcdFx0c3RlcHM6IHRoaXMub3B0aW9ucy5zY2FsZVN0ZXBzLFxuXHRcdFx0XHRcdHN0ZXBWYWx1ZTogdGhpcy5vcHRpb25zLnNjYWxlU3RlcFdpZHRoLFxuXHRcdFx0XHRcdG1pbjogdGhpcy5vcHRpb25zLnNjYWxlU3RhcnRWYWx1ZSxcblx0XHRcdFx0XHRtYXg6IHRoaXMub3B0aW9ucy5zY2FsZVN0YXJ0VmFsdWUgKyAodGhpcy5vcHRpb25zLnNjYWxlU3RlcHMgKiB0aGlzLm9wdGlvbnMuc2NhbGVTdGVwV2lkdGgpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cblx0XHRcdHRoaXMuc2NhbGUgPSBuZXcgQ2hhcnQuU2NhbGUoc2NhbGVPcHRpb25zKTtcblx0XHR9LFxuXHRcdGFkZERhdGEgOiBmdW5jdGlvbih2YWx1ZXNBcnJheSxsYWJlbCl7XG5cdFx0XHQvL01hcCB0aGUgdmFsdWVzIGFycmF5IGZvciBlYWNoIG9mIHRoZSBkYXRhc2V0c1xuXG5cdFx0XHRoZWxwZXJzLmVhY2godmFsdWVzQXJyYXksZnVuY3Rpb24odmFsdWUsZGF0YXNldEluZGV4KXtcblx0XHRcdFx0Ly9BZGQgYSBuZXcgcG9pbnQgZm9yIGVhY2ggcGllY2Ugb2YgZGF0YSwgcGFzc2luZyBhbnkgcmVxdWlyZWQgZGF0YSB0byBkcmF3LlxuXHRcdFx0XHR0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0ucG9pbnRzLnB1c2gobmV3IHRoaXMuUG9pbnRDbGFzcyh7XG5cdFx0XHRcdFx0dmFsdWUgOiB2YWx1ZSxcblx0XHRcdFx0XHRsYWJlbCA6IGxhYmVsLFxuXHRcdFx0XHRcdGRhdGFzZXRMYWJlbDogdGhpcy5kYXRhc2V0c1tkYXRhc2V0SW5kZXhdLmxhYmVsLFxuXHRcdFx0XHRcdHg6IHRoaXMuc2NhbGUuY2FsY3VsYXRlWCh0aGlzLnNjYWxlLnZhbHVlc0NvdW50KzEpLFxuXHRcdFx0XHRcdHk6IHRoaXMuc2NhbGUuZW5kUG9pbnQsXG5cdFx0XHRcdFx0c3Ryb2tlQ29sb3IgOiB0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0ucG9pbnRTdHJva2VDb2xvcixcblx0XHRcdFx0XHRmaWxsQ29sb3IgOiB0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0ucG9pbnRDb2xvclxuXHRcdFx0XHR9KSk7XG5cdFx0XHR9LHRoaXMpO1xuXG5cdFx0XHR0aGlzLnNjYWxlLmFkZFhMYWJlbChsYWJlbCk7XG5cdFx0XHQvL1RoZW4gcmUtcmVuZGVyIHRoZSBjaGFydC5cblx0XHRcdHRoaXMudXBkYXRlKCk7XG5cdFx0fSxcblx0XHRyZW1vdmVEYXRhIDogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuc2NhbGUucmVtb3ZlWExhYmVsKCk7XG5cdFx0XHQvL1RoZW4gcmUtcmVuZGVyIHRoZSBjaGFydC5cblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLmRhdGFzZXRzLGZ1bmN0aW9uKGRhdGFzZXQpe1xuXHRcdFx0XHRkYXRhc2V0LnBvaW50cy5zaGlmdCgpO1xuXHRcdFx0fSx0aGlzKTtcblx0XHRcdHRoaXMudXBkYXRlKCk7XG5cdFx0fSxcblx0XHRyZWZsb3cgOiBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIG5ld1NjYWxlUHJvcHMgPSBoZWxwZXJzLmV4dGVuZCh7XG5cdFx0XHRcdGhlaWdodCA6IHRoaXMuY2hhcnQuaGVpZ2h0LFxuXHRcdFx0XHR3aWR0aCA6IHRoaXMuY2hhcnQud2lkdGhcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5zY2FsZS51cGRhdGUobmV3U2NhbGVQcm9wcyk7XG5cdFx0fSxcblx0XHRkcmF3IDogZnVuY3Rpb24oZWFzZSl7XG5cdFx0XHR2YXIgZWFzaW5nRGVjaW1hbCA9IGVhc2UgfHwgMTtcblx0XHRcdHRoaXMuY2xlYXIoKTtcblxuXHRcdFx0dmFyIGN0eCA9IHRoaXMuY2hhcnQuY3R4O1xuXG5cdFx0XHQvLyBTb21lIGhlbHBlciBtZXRob2RzIGZvciBnZXR0aW5nIHRoZSBuZXh0L3ByZXYgcG9pbnRzXG5cdFx0XHR2YXIgaGFzVmFsdWUgPSBmdW5jdGlvbihpdGVtKXtcblx0XHRcdFx0cmV0dXJuIGl0ZW0udmFsdWUgIT09IG51bGw7XG5cdFx0XHR9LFxuXHRcdFx0bmV4dFBvaW50ID0gZnVuY3Rpb24ocG9pbnQsIGNvbGxlY3Rpb24sIGluZGV4KXtcblx0XHRcdFx0cmV0dXJuIGhlbHBlcnMuZmluZE5leHRXaGVyZShjb2xsZWN0aW9uLCBoYXNWYWx1ZSwgaW5kZXgpIHx8IHBvaW50O1xuXHRcdFx0fSxcblx0XHRcdHByZXZpb3VzUG9pbnQgPSBmdW5jdGlvbihwb2ludCwgY29sbGVjdGlvbiwgaW5kZXgpe1xuXHRcdFx0XHRyZXR1cm4gaGVscGVycy5maW5kUHJldmlvdXNXaGVyZShjb2xsZWN0aW9uLCBoYXNWYWx1ZSwgaW5kZXgpIHx8IHBvaW50O1xuXHRcdFx0fTtcblxuXHRcdFx0aWYgKCF0aGlzLnNjYWxlKSByZXR1cm47XG5cdFx0XHR0aGlzLnNjYWxlLmRyYXcoZWFzaW5nRGVjaW1hbCk7XG5cblxuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuZGF0YXNldHMsZnVuY3Rpb24oZGF0YXNldCl7XG5cdFx0XHRcdHZhciBwb2ludHNXaXRoVmFsdWVzID0gaGVscGVycy53aGVyZShkYXRhc2V0LnBvaW50cywgaGFzVmFsdWUpO1xuXG5cdFx0XHRcdC8vVHJhbnNpdGlvbiBlYWNoIHBvaW50IGZpcnN0IHNvIHRoYXQgdGhlIGxpbmUgYW5kIHBvaW50IGRyYXdpbmcgaXNuJ3Qgb3V0IG9mIHN5bmNcblx0XHRcdFx0Ly9XZSBjYW4gdXNlIHRoaXMgZXh0cmEgbG9vcCB0byBjYWxjdWxhdGUgdGhlIGNvbnRyb2wgcG9pbnRzIG9mIHRoaXMgZGF0YXNldCBhbHNvIGluIHRoaXMgbG9vcFxuXG5cdFx0XHRcdGhlbHBlcnMuZWFjaChkYXRhc2V0LnBvaW50cywgZnVuY3Rpb24ocG9pbnQsIGluZGV4KXtcblx0XHRcdFx0XHRpZiAocG9pbnQuaGFzVmFsdWUoKSl7XG5cdFx0XHRcdFx0XHRwb2ludC50cmFuc2l0aW9uKHtcblx0XHRcdFx0XHRcdFx0eSA6IHRoaXMuc2NhbGUuY2FsY3VsYXRlWShwb2ludC52YWx1ZSksXG5cdFx0XHRcdFx0XHRcdHggOiB0aGlzLnNjYWxlLmNhbGN1bGF0ZVgoaW5kZXgpXG5cdFx0XHRcdFx0XHR9LCBlYXNpbmdEZWNpbWFsKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sdGhpcyk7XG5cblxuXHRcdFx0XHQvLyBDb250cm9sIHBvaW50cyBuZWVkIHRvIGJlIGNhbGN1bGF0ZWQgaW4gYSBzZXBhcmF0ZSBsb29wLCBiZWNhdXNlIHdlIG5lZWQgdG8ga25vdyB0aGUgY3VycmVudCB4L3kgb2YgdGhlIHBvaW50XG5cdFx0XHRcdC8vIFRoaXMgd291bGQgY2F1c2UgaXNzdWVzIHdoZW4gdGhlcmUgaXMgbm8gYW5pbWF0aW9uLCBiZWNhdXNlIHRoZSB5IG9mIHRoZSBuZXh0IHBvaW50IHdvdWxkIGJlIDAsIHNvIGJlemllcnMgd291bGQgYmUgc2tld2VkXG5cdFx0XHRcdGlmICh0aGlzLm9wdGlvbnMuYmV6aWVyQ3VydmUpe1xuXHRcdFx0XHRcdGhlbHBlcnMuZWFjaChwb2ludHNXaXRoVmFsdWVzLCBmdW5jdGlvbihwb2ludCwgaW5kZXgpe1xuXHRcdFx0XHRcdFx0dmFyIHRlbnNpb24gPSAoaW5kZXggPiAwICYmIGluZGV4IDwgcG9pbnRzV2l0aFZhbHVlcy5sZW5ndGggLSAxKSA/IHRoaXMub3B0aW9ucy5iZXppZXJDdXJ2ZVRlbnNpb24gOiAwO1xuXHRcdFx0XHRcdFx0cG9pbnQuY29udHJvbFBvaW50cyA9IGhlbHBlcnMuc3BsaW5lQ3VydmUoXG5cdFx0XHRcdFx0XHRcdHByZXZpb3VzUG9pbnQocG9pbnQsIHBvaW50c1dpdGhWYWx1ZXMsIGluZGV4KSxcblx0XHRcdFx0XHRcdFx0cG9pbnQsXG5cdFx0XHRcdFx0XHRcdG5leHRQb2ludChwb2ludCwgcG9pbnRzV2l0aFZhbHVlcywgaW5kZXgpLFxuXHRcdFx0XHRcdFx0XHR0ZW5zaW9uXG5cdFx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0XHQvLyBQcmV2ZW50IHRoZSBiZXppZXIgZ29pbmcgb3V0c2lkZSBvZiB0aGUgYm91bmRzIG9mIHRoZSBncmFwaFxuXG5cdFx0XHRcdFx0XHQvLyBDYXAgcHV0ZXIgYmV6aWVyIGhhbmRsZXMgdG8gdGhlIHVwcGVyL2xvd2VyIHNjYWxlIGJvdW5kc1xuXHRcdFx0XHRcdFx0aWYgKHBvaW50LmNvbnRyb2xQb2ludHMub3V0ZXIueSA+IHRoaXMuc2NhbGUuZW5kUG9pbnQpe1xuXHRcdFx0XHRcdFx0XHRwb2ludC5jb250cm9sUG9pbnRzLm91dGVyLnkgPSB0aGlzLnNjYWxlLmVuZFBvaW50O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAocG9pbnQuY29udHJvbFBvaW50cy5vdXRlci55IDwgdGhpcy5zY2FsZS5zdGFydFBvaW50KXtcblx0XHRcdFx0XHRcdFx0cG9pbnQuY29udHJvbFBvaW50cy5vdXRlci55ID0gdGhpcy5zY2FsZS5zdGFydFBvaW50O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBDYXAgaW5uZXIgYmV6aWVyIGhhbmRsZXMgdG8gdGhlIHVwcGVyL2xvd2VyIHNjYWxlIGJvdW5kc1xuXHRcdFx0XHRcdFx0aWYgKHBvaW50LmNvbnRyb2xQb2ludHMuaW5uZXIueSA+IHRoaXMuc2NhbGUuZW5kUG9pbnQpe1xuXHRcdFx0XHRcdFx0XHRwb2ludC5jb250cm9sUG9pbnRzLmlubmVyLnkgPSB0aGlzLnNjYWxlLmVuZFBvaW50O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAocG9pbnQuY29udHJvbFBvaW50cy5pbm5lci55IDwgdGhpcy5zY2FsZS5zdGFydFBvaW50KXtcblx0XHRcdFx0XHRcdFx0cG9pbnQuY29udHJvbFBvaW50cy5pbm5lci55ID0gdGhpcy5zY2FsZS5zdGFydFBvaW50O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sdGhpcyk7XG5cdFx0XHRcdH1cblxuXG5cdFx0XHRcdC8vRHJhdyB0aGUgbGluZSBiZXR3ZWVuIGFsbCB0aGUgcG9pbnRzXG5cdFx0XHRcdGN0eC5saW5lV2lkdGggPSB0aGlzLm9wdGlvbnMuZGF0YXNldFN0cm9rZVdpZHRoO1xuXHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSBkYXRhc2V0LnN0cm9rZUNvbG9yO1xuXHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cblx0XHRcdFx0aGVscGVycy5lYWNoKHBvaW50c1dpdGhWYWx1ZXMsIGZ1bmN0aW9uKHBvaW50LCBpbmRleCl7XG5cdFx0XHRcdFx0aWYgKGluZGV4ID09PSAwKXtcblx0XHRcdFx0XHRcdGN0eC5tb3ZlVG8ocG9pbnQueCwgcG9pbnQueSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0XHRpZih0aGlzLm9wdGlvbnMuYmV6aWVyQ3VydmUpe1xuXHRcdFx0XHRcdFx0XHR2YXIgcHJldmlvdXMgPSBwcmV2aW91c1BvaW50KHBvaW50LCBwb2ludHNXaXRoVmFsdWVzLCBpbmRleCk7XG5cblx0XHRcdFx0XHRcdFx0Y3R4LmJlemllckN1cnZlVG8oXG5cdFx0XHRcdFx0XHRcdFx0cHJldmlvdXMuY29udHJvbFBvaW50cy5vdXRlci54LFxuXHRcdFx0XHRcdFx0XHRcdHByZXZpb3VzLmNvbnRyb2xQb2ludHMub3V0ZXIueSxcblx0XHRcdFx0XHRcdFx0XHRwb2ludC5jb250cm9sUG9pbnRzLmlubmVyLngsXG5cdFx0XHRcdFx0XHRcdFx0cG9pbnQuY29udHJvbFBvaW50cy5pbm5lci55LFxuXHRcdFx0XHRcdFx0XHRcdHBvaW50LngsXG5cdFx0XHRcdFx0XHRcdFx0cG9pbnQueVxuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZXtcblx0XHRcdFx0XHRcdFx0Y3R4LmxpbmVUbyhwb2ludC54LHBvaW50LnkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgdGhpcyk7XG5cblx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy5kYXRhc2V0U3Ryb2tlKSB7XG5cdFx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy5kYXRhc2V0RmlsbCAmJiBwb2ludHNXaXRoVmFsdWVzLmxlbmd0aCA+IDApe1xuXHRcdFx0XHRcdC8vUm91bmQgb2ZmIHRoZSBsaW5lIGJ5IGdvaW5nIHRvIHRoZSBiYXNlIG9mIHRoZSBjaGFydCwgYmFjayB0byB0aGUgc3RhcnQsIHRoZW4gZmlsbC5cblx0XHRcdFx0XHRjdHgubGluZVRvKHBvaW50c1dpdGhWYWx1ZXNbcG9pbnRzV2l0aFZhbHVlcy5sZW5ndGggLSAxXS54LCB0aGlzLnNjYWxlLmVuZFBvaW50KTtcblx0XHRcdFx0XHRjdHgubGluZVRvKHBvaW50c1dpdGhWYWx1ZXNbMF0ueCwgdGhpcy5zY2FsZS5lbmRQb2ludCk7XG5cdFx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IGRhdGFzZXQuZmlsbENvbG9yO1xuXHRcdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcblx0XHRcdFx0XHRjdHguZmlsbCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9Ob3cgZHJhdyB0aGUgcG9pbnRzIG92ZXIgdGhlIGxpbmVcblx0XHRcdFx0Ly9BIGxpdHRsZSBpbmVmZmljaWVudCBkb3VibGUgbG9vcGluZywgYnV0IGJldHRlciB0aGFuIHRoZSBsaW5lXG5cdFx0XHRcdC8vbGFnZ2luZyBiZWhpbmQgdGhlIHBvaW50IHBvc2l0aW9uc1xuXHRcdFx0XHRoZWxwZXJzLmVhY2gocG9pbnRzV2l0aFZhbHVlcyxmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRcdFx0cG9pbnQuZHJhdygpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0sdGhpcyk7XG5cdFx0fVxuXHR9KTtcblxuXG59KS5jYWxsKHRoaXMpO1xuXG4oZnVuY3Rpb24oKXtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHJvb3QgPSB0aGlzLFxuXHRcdENoYXJ0ID0gcm9vdC5DaGFydCxcblx0XHQvL0NhY2hlIGEgbG9jYWwgcmVmZXJlbmNlIHRvIENoYXJ0LmhlbHBlcnNcblx0XHRoZWxwZXJzID0gQ2hhcnQuaGVscGVycztcblxuXHR2YXIgZGVmYXVsdENvbmZpZyA9IHtcblx0XHQvL0Jvb2xlYW4gLSBTaG93IGEgYmFja2Ryb3AgdG8gdGhlIHNjYWxlIGxhYmVsXG5cdFx0c2NhbGVTaG93TGFiZWxCYWNrZHJvcCA6IHRydWUsXG5cblx0XHQvL1N0cmluZyAtIFRoZSBjb2xvdXIgb2YgdGhlIGxhYmVsIGJhY2tkcm9wXG5cdFx0c2NhbGVCYWNrZHJvcENvbG9yIDogXCJyZ2JhKDI1NSwyNTUsMjU1LDAuNzUpXCIsXG5cblx0XHQvLyBCb29sZWFuIC0gV2hldGhlciB0aGUgc2NhbGUgc2hvdWxkIGJlZ2luIGF0IHplcm9cblx0XHRzY2FsZUJlZ2luQXRaZXJvIDogdHJ1ZSxcblxuXHRcdC8vTnVtYmVyIC0gVGhlIGJhY2tkcm9wIHBhZGRpbmcgYWJvdmUgJiBiZWxvdyB0aGUgbGFiZWwgaW4gcGl4ZWxzXG5cdFx0c2NhbGVCYWNrZHJvcFBhZGRpbmdZIDogMixcblxuXHRcdC8vTnVtYmVyIC0gVGhlIGJhY2tkcm9wIHBhZGRpbmcgdG8gdGhlIHNpZGUgb2YgdGhlIGxhYmVsIGluIHBpeGVsc1xuXHRcdHNjYWxlQmFja2Ryb3BQYWRkaW5nWCA6IDIsXG5cblx0XHQvL0Jvb2xlYW4gLSBTaG93IGxpbmUgZm9yIGVhY2ggdmFsdWUgaW4gdGhlIHNjYWxlXG5cdFx0c2NhbGVTaG93TGluZSA6IHRydWUsXG5cblx0XHQvL0Jvb2xlYW4gLSBTdHJva2UgYSBsaW5lIGFyb3VuZCBlYWNoIHNlZ21lbnQgaW4gdGhlIGNoYXJ0XG5cdFx0c2VnbWVudFNob3dTdHJva2UgOiB0cnVlLFxuXG5cdFx0Ly9TdHJpbmcgLSBUaGUgY29sb3VyIG9mIHRoZSBzdHJva2Ugb24gZWFjaCBzZWdtZW50LlxuXHRcdHNlZ21lbnRTdHJva2VDb2xvciA6IFwiI2ZmZlwiLFxuXG5cdFx0Ly9OdW1iZXIgLSBUaGUgd2lkdGggb2YgdGhlIHN0cm9rZSB2YWx1ZSBpbiBwaXhlbHNcblx0XHRzZWdtZW50U3Ryb2tlV2lkdGggOiAyLFxuXG5cdFx0Ly9OdW1iZXIgLSBBbW91bnQgb2YgYW5pbWF0aW9uIHN0ZXBzXG5cdFx0YW5pbWF0aW9uU3RlcHMgOiAxMDAsXG5cblx0XHQvL1N0cmluZyAtIEFuaW1hdGlvbiBlYXNpbmcgZWZmZWN0LlxuXHRcdGFuaW1hdGlvbkVhc2luZyA6IFwiZWFzZU91dEJvdW5jZVwiLFxuXG5cdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB0byBhbmltYXRlIHRoZSByb3RhdGlvbiBvZiB0aGUgY2hhcnRcblx0XHRhbmltYXRlUm90YXRlIDogdHJ1ZSxcblxuXHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gYW5pbWF0ZSBzY2FsaW5nIHRoZSBjaGFydCBmcm9tIHRoZSBjZW50cmVcblx0XHRhbmltYXRlU2NhbGUgOiBmYWxzZSxcblxuXHRcdC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcblx0XHRsZWdlbmRUZW1wbGF0ZSA6IFwiPHVsIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmRcXFwiPjwlIGZvciAodmFyIGk9MDsgaTxzZWdtZW50cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZC1pY29uXFxcIiBzdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjo8JT1zZWdtZW50c1tpXS5maWxsQ29sb3IlPlxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmQtdGV4dFxcXCI+PCVpZihzZWdtZW50c1tpXS5sYWJlbCl7JT48JT1zZWdtZW50c1tpXS5sYWJlbCU+PCV9JT48L3NwYW4+PC9saT48JX0lPjwvdWw+XCJcblx0fTtcblxuXG5cdENoYXJ0LlR5cGUuZXh0ZW5kKHtcblx0XHQvL1Bhc3NpbmcgaW4gYSBuYW1lIHJlZ2lzdGVycyB0aGlzIGNoYXJ0IGluIHRoZSBDaGFydCBuYW1lc3BhY2Vcblx0XHRuYW1lOiBcIlBvbGFyQXJlYVwiLFxuXHRcdC8vUHJvdmlkaW5nIGEgZGVmYXVsdHMgd2lsbCBhbHNvIHJlZ2lzdGVyIHRoZSBkZWZhdWx0cyBpbiB0aGUgY2hhcnQgbmFtZXNwYWNlXG5cdFx0ZGVmYXVsdHMgOiBkZWZhdWx0Q29uZmlnLFxuXHRcdC8vSW5pdGlhbGl6ZSBpcyBmaXJlZCB3aGVuIHRoZSBjaGFydCBpcyBpbml0aWFsaXplZCAtIERhdGEgaXMgcGFzc2VkIGluIGFzIGEgcGFyYW1ldGVyXG5cdFx0Ly9Db25maWcgaXMgYXV0b21hdGljYWxseSBtZXJnZWQgYnkgdGhlIGNvcmUgb2YgQ2hhcnQuanMsIGFuZCBpcyBhdmFpbGFibGUgYXQgdGhpcy5vcHRpb25zXG5cdFx0aW5pdGlhbGl6ZTogIGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0dGhpcy5zZWdtZW50cyA9IFtdO1xuXHRcdFx0Ly9EZWNsYXJlIHNlZ21lbnQgY2xhc3MgYXMgYSBjaGFydCBpbnN0YW5jZSBzcGVjaWZpYyBjbGFzcywgc28gaXQgY2FuIHNoYXJlIHByb3BzIGZvciB0aGlzIGluc3RhbmNlXG5cdFx0XHR0aGlzLlNlZ21lbnRBcmMgPSBDaGFydC5BcmMuZXh0ZW5kKHtcblx0XHRcdFx0c2hvd1N0cm9rZSA6IHRoaXMub3B0aW9ucy5zZWdtZW50U2hvd1N0cm9rZSxcblx0XHRcdFx0c3Ryb2tlV2lkdGggOiB0aGlzLm9wdGlvbnMuc2VnbWVudFN0cm9rZVdpZHRoLFxuXHRcdFx0XHRzdHJva2VDb2xvciA6IHRoaXMub3B0aW9ucy5zZWdtZW50U3Ryb2tlQ29sb3IsXG5cdFx0XHRcdGN0eCA6IHRoaXMuY2hhcnQuY3R4LFxuXHRcdFx0XHRpbm5lclJhZGl1cyA6IDAsXG5cdFx0XHRcdHggOiB0aGlzLmNoYXJ0LndpZHRoLzIsXG5cdFx0XHRcdHkgOiB0aGlzLmNoYXJ0LmhlaWdodC8yXG5cdFx0XHR9KTtcblx0XHRcdHRoaXMuc2NhbGUgPSBuZXcgQ2hhcnQuUmFkaWFsU2NhbGUoe1xuXHRcdFx0XHRkaXNwbGF5OiB0aGlzLm9wdGlvbnMuc2hvd1NjYWxlLFxuXHRcdFx0XHRmb250U3R5bGU6IHRoaXMub3B0aW9ucy5zY2FsZUZvbnRTdHlsZSxcblx0XHRcdFx0Zm9udFNpemU6IHRoaXMub3B0aW9ucy5zY2FsZUZvbnRTaXplLFxuXHRcdFx0XHRmb250RmFtaWx5OiB0aGlzLm9wdGlvbnMuc2NhbGVGb250RmFtaWx5LFxuXHRcdFx0XHRmb250Q29sb3I6IHRoaXMub3B0aW9ucy5zY2FsZUZvbnRDb2xvcixcblx0XHRcdFx0c2hvd0xhYmVsczogdGhpcy5vcHRpb25zLnNjYWxlU2hvd0xhYmVscyxcblx0XHRcdFx0c2hvd0xhYmVsQmFja2Ryb3A6IHRoaXMub3B0aW9ucy5zY2FsZVNob3dMYWJlbEJhY2tkcm9wLFxuXHRcdFx0XHRiYWNrZHJvcENvbG9yOiB0aGlzLm9wdGlvbnMuc2NhbGVCYWNrZHJvcENvbG9yLFxuXHRcdFx0XHRiYWNrZHJvcFBhZGRpbmdZIDogdGhpcy5vcHRpb25zLnNjYWxlQmFja2Ryb3BQYWRkaW5nWSxcblx0XHRcdFx0YmFja2Ryb3BQYWRkaW5nWDogdGhpcy5vcHRpb25zLnNjYWxlQmFja2Ryb3BQYWRkaW5nWCxcblx0XHRcdFx0bGluZVdpZHRoOiAodGhpcy5vcHRpb25zLnNjYWxlU2hvd0xpbmUpID8gdGhpcy5vcHRpb25zLnNjYWxlTGluZVdpZHRoIDogMCxcblx0XHRcdFx0bGluZUNvbG9yOiB0aGlzLm9wdGlvbnMuc2NhbGVMaW5lQ29sb3IsXG5cdFx0XHRcdGxpbmVBcmM6IHRydWUsXG5cdFx0XHRcdHdpZHRoOiB0aGlzLmNoYXJ0LndpZHRoLFxuXHRcdFx0XHRoZWlnaHQ6IHRoaXMuY2hhcnQuaGVpZ2h0LFxuXHRcdFx0XHR4Q2VudGVyOiB0aGlzLmNoYXJ0LndpZHRoLzIsXG5cdFx0XHRcdHlDZW50ZXI6IHRoaXMuY2hhcnQuaGVpZ2h0LzIsXG5cdFx0XHRcdGN0eCA6IHRoaXMuY2hhcnQuY3R4LFxuXHRcdFx0XHR0ZW1wbGF0ZVN0cmluZzogdGhpcy5vcHRpb25zLnNjYWxlTGFiZWwsXG5cdFx0XHRcdHZhbHVlc0NvdW50OiBkYXRhLmxlbmd0aFxuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMudXBkYXRlU2NhbGVSYW5nZShkYXRhKTtcblxuXHRcdFx0dGhpcy5zY2FsZS51cGRhdGUoKTtcblxuXHRcdFx0aGVscGVycy5lYWNoKGRhdGEsZnVuY3Rpb24oc2VnbWVudCxpbmRleCl7XG5cdFx0XHRcdHRoaXMuYWRkRGF0YShzZWdtZW50LGluZGV4LHRydWUpO1xuXHRcdFx0fSx0aGlzKTtcblxuXHRcdFx0Ly9TZXQgdXAgdG9vbHRpcCBldmVudHMgb24gdGhlIGNoYXJ0XG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLnNob3dUb29sdGlwcyl7XG5cdFx0XHRcdGhlbHBlcnMuYmluZEV2ZW50cyh0aGlzLCB0aGlzLm9wdGlvbnMudG9vbHRpcEV2ZW50cywgZnVuY3Rpb24oZXZ0KXtcblx0XHRcdFx0XHR2YXIgYWN0aXZlU2VnbWVudHMgPSAoZXZ0LnR5cGUgIT09ICdtb3VzZW91dCcpID8gdGhpcy5nZXRTZWdtZW50c0F0RXZlbnQoZXZ0KSA6IFtdO1xuXHRcdFx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLnNlZ21lbnRzLGZ1bmN0aW9uKHNlZ21lbnQpe1xuXHRcdFx0XHRcdFx0c2VnbWVudC5yZXN0b3JlKFtcImZpbGxDb2xvclwiXSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0aGVscGVycy5lYWNoKGFjdGl2ZVNlZ21lbnRzLGZ1bmN0aW9uKGFjdGl2ZVNlZ21lbnQpe1xuXHRcdFx0XHRcdFx0YWN0aXZlU2VnbWVudC5maWxsQ29sb3IgPSBhY3RpdmVTZWdtZW50LmhpZ2hsaWdodENvbG9yO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHRoaXMuc2hvd1Rvb2x0aXAoYWN0aXZlU2VnbWVudHMpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR9LFxuXHRcdGdldFNlZ21lbnRzQXRFdmVudCA6IGZ1bmN0aW9uKGUpe1xuXHRcdFx0dmFyIHNlZ21lbnRzQXJyYXkgPSBbXTtcblxuXHRcdFx0dmFyIGxvY2F0aW9uID0gaGVscGVycy5nZXRSZWxhdGl2ZVBvc2l0aW9uKGUpO1xuXG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5zZWdtZW50cyxmdW5jdGlvbihzZWdtZW50KXtcblx0XHRcdFx0aWYgKHNlZ21lbnQuaW5SYW5nZShsb2NhdGlvbi54LGxvY2F0aW9uLnkpKSBzZWdtZW50c0FycmF5LnB1c2goc2VnbWVudCk7XG5cdFx0XHR9LHRoaXMpO1xuXHRcdFx0cmV0dXJuIHNlZ21lbnRzQXJyYXk7XG5cdFx0fSxcblx0XHRhZGREYXRhIDogZnVuY3Rpb24oc2VnbWVudCwgYXRJbmRleCwgc2lsZW50KXtcblx0XHRcdHZhciBpbmRleCA9IGF0SW5kZXggfHwgdGhpcy5zZWdtZW50cy5sZW5ndGg7XG5cblx0XHRcdHRoaXMuc2VnbWVudHMuc3BsaWNlKGluZGV4LCAwLCBuZXcgdGhpcy5TZWdtZW50QXJjKHtcblx0XHRcdFx0ZmlsbENvbG9yOiBzZWdtZW50LmNvbG9yLFxuXHRcdFx0XHRoaWdobGlnaHRDb2xvcjogc2VnbWVudC5oaWdobGlnaHQgfHwgc2VnbWVudC5jb2xvcixcblx0XHRcdFx0bGFiZWw6IHNlZ21lbnQubGFiZWwsXG5cdFx0XHRcdHZhbHVlOiBzZWdtZW50LnZhbHVlLFxuXHRcdFx0XHRvdXRlclJhZGl1czogKHRoaXMub3B0aW9ucy5hbmltYXRlU2NhbGUpID8gMCA6IHRoaXMuc2NhbGUuY2FsY3VsYXRlQ2VudGVyT2Zmc2V0KHNlZ21lbnQudmFsdWUpLFxuXHRcdFx0XHRjaXJjdW1mZXJlbmNlOiAodGhpcy5vcHRpb25zLmFuaW1hdGVSb3RhdGUpID8gMCA6IHRoaXMuc2NhbGUuZ2V0Q2lyY3VtZmVyZW5jZSgpLFxuXHRcdFx0XHRzdGFydEFuZ2xlOiBNYXRoLlBJICogMS41XG5cdFx0XHR9KSk7XG5cdFx0XHRpZiAoIXNpbGVudCl7XG5cdFx0XHRcdHRoaXMucmVmbG93KCk7XG5cdFx0XHRcdHRoaXMudXBkYXRlKCk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZW1vdmVEYXRhOiBmdW5jdGlvbihhdEluZGV4KXtcblx0XHRcdHZhciBpbmRleFRvRGVsZXRlID0gKGhlbHBlcnMuaXNOdW1iZXIoYXRJbmRleCkpID8gYXRJbmRleCA6IHRoaXMuc2VnbWVudHMubGVuZ3RoLTE7XG5cdFx0XHR0aGlzLnNlZ21lbnRzLnNwbGljZShpbmRleFRvRGVsZXRlLCAxKTtcblx0XHRcdHRoaXMucmVmbG93KCk7XG5cdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdH0sXG5cdFx0Y2FsY3VsYXRlVG90YWw6IGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0dGhpcy50b3RhbCA9IDA7XG5cdFx0XHRoZWxwZXJzLmVhY2goZGF0YSxmdW5jdGlvbihzZWdtZW50KXtcblx0XHRcdFx0dGhpcy50b3RhbCArPSBzZWdtZW50LnZhbHVlO1xuXHRcdFx0fSx0aGlzKTtcblx0XHRcdHRoaXMuc2NhbGUudmFsdWVzQ291bnQgPSB0aGlzLnNlZ21lbnRzLmxlbmd0aDtcblx0XHR9LFxuXHRcdHVwZGF0ZVNjYWxlUmFuZ2U6IGZ1bmN0aW9uKGRhdGFwb2ludHMpe1xuXHRcdFx0dmFyIHZhbHVlc0FycmF5ID0gW107XG5cdFx0XHRoZWxwZXJzLmVhY2goZGF0YXBvaW50cyxmdW5jdGlvbihzZWdtZW50KXtcblx0XHRcdFx0dmFsdWVzQXJyYXkucHVzaChzZWdtZW50LnZhbHVlKTtcblx0XHRcdH0pO1xuXG5cdFx0XHR2YXIgc2NhbGVTaXplcyA9ICh0aGlzLm9wdGlvbnMuc2NhbGVPdmVycmlkZSkgP1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0c3RlcHM6IHRoaXMub3B0aW9ucy5zY2FsZVN0ZXBzLFxuXHRcdFx0XHRcdHN0ZXBWYWx1ZTogdGhpcy5vcHRpb25zLnNjYWxlU3RlcFdpZHRoLFxuXHRcdFx0XHRcdG1pbjogdGhpcy5vcHRpb25zLnNjYWxlU3RhcnRWYWx1ZSxcblx0XHRcdFx0XHRtYXg6IHRoaXMub3B0aW9ucy5zY2FsZVN0YXJ0VmFsdWUgKyAodGhpcy5vcHRpb25zLnNjYWxlU3RlcHMgKiB0aGlzLm9wdGlvbnMuc2NhbGVTdGVwV2lkdGgpXG5cdFx0XHRcdH0gOlxuXHRcdFx0XHRoZWxwZXJzLmNhbGN1bGF0ZVNjYWxlUmFuZ2UoXG5cdFx0XHRcdFx0dmFsdWVzQXJyYXksXG5cdFx0XHRcdFx0aGVscGVycy5taW4oW3RoaXMuY2hhcnQud2lkdGgsIHRoaXMuY2hhcnQuaGVpZ2h0XSkvMixcblx0XHRcdFx0XHR0aGlzLm9wdGlvbnMuc2NhbGVGb250U2l6ZSxcblx0XHRcdFx0XHR0aGlzLm9wdGlvbnMuc2NhbGVCZWdpbkF0WmVybyxcblx0XHRcdFx0XHR0aGlzLm9wdGlvbnMuc2NhbGVJbnRlZ2Vyc09ubHlcblx0XHRcdFx0KTtcblxuXHRcdFx0aGVscGVycy5leHRlbmQoXG5cdFx0XHRcdHRoaXMuc2NhbGUsXG5cdFx0XHRcdHNjYWxlU2l6ZXMsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzaXplOiBoZWxwZXJzLm1pbihbdGhpcy5jaGFydC53aWR0aCwgdGhpcy5jaGFydC5oZWlnaHRdKSxcblx0XHRcdFx0XHR4Q2VudGVyOiB0aGlzLmNoYXJ0LndpZHRoLzIsXG5cdFx0XHRcdFx0eUNlbnRlcjogdGhpcy5jaGFydC5oZWlnaHQvMlxuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXG5cdFx0fSxcblx0XHR1cGRhdGUgOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5jYWxjdWxhdGVUb3RhbCh0aGlzLnNlZ21lbnRzKTtcblxuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuc2VnbWVudHMsZnVuY3Rpb24oc2VnbWVudCl7XG5cdFx0XHRcdHNlZ21lbnQuc2F2ZSgpO1xuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdHRoaXMucmVmbG93KCk7XG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH0sXG5cdFx0cmVmbG93IDogZnVuY3Rpb24oKXtcblx0XHRcdGhlbHBlcnMuZXh0ZW5kKHRoaXMuU2VnbWVudEFyYy5wcm90b3R5cGUse1xuXHRcdFx0XHR4IDogdGhpcy5jaGFydC53aWR0aC8yLFxuXHRcdFx0XHR5IDogdGhpcy5jaGFydC5oZWlnaHQvMlxuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLnVwZGF0ZVNjYWxlUmFuZ2UodGhpcy5zZWdtZW50cyk7XG5cdFx0XHR0aGlzLnNjYWxlLnVwZGF0ZSgpO1xuXG5cdFx0XHRoZWxwZXJzLmV4dGVuZCh0aGlzLnNjYWxlLHtcblx0XHRcdFx0eENlbnRlcjogdGhpcy5jaGFydC53aWR0aC8yLFxuXHRcdFx0XHR5Q2VudGVyOiB0aGlzLmNoYXJ0LmhlaWdodC8yXG5cdFx0XHR9KTtcblxuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuc2VnbWVudHMsIGZ1bmN0aW9uKHNlZ21lbnQpe1xuXHRcdFx0XHRzZWdtZW50LnVwZGF0ZSh7XG5cdFx0XHRcdFx0b3V0ZXJSYWRpdXMgOiB0aGlzLnNjYWxlLmNhbGN1bGF0ZUNlbnRlck9mZnNldChzZWdtZW50LnZhbHVlKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0sIHRoaXMpO1xuXG5cdFx0fSxcblx0XHRkcmF3IDogZnVuY3Rpb24oZWFzZSl7XG5cdFx0XHR2YXIgZWFzaW5nRGVjaW1hbCA9IGVhc2UgfHwgMTtcblx0XHRcdC8vQ2xlYXIgJiBkcmF3IHRoZSBjYW52YXNcblx0XHRcdHRoaXMuY2xlYXIoKTtcblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLnNlZ21lbnRzLGZ1bmN0aW9uKHNlZ21lbnQsIGluZGV4KXtcblx0XHRcdFx0c2VnbWVudC50cmFuc2l0aW9uKHtcblx0XHRcdFx0XHRjaXJjdW1mZXJlbmNlIDogdGhpcy5zY2FsZS5nZXRDaXJjdW1mZXJlbmNlKCksXG5cdFx0XHRcdFx0b3V0ZXJSYWRpdXMgOiB0aGlzLnNjYWxlLmNhbGN1bGF0ZUNlbnRlck9mZnNldChzZWdtZW50LnZhbHVlKVxuXHRcdFx0XHR9LGVhc2luZ0RlY2ltYWwpO1xuXG5cdFx0XHRcdHNlZ21lbnQuZW5kQW5nbGUgPSBzZWdtZW50LnN0YXJ0QW5nbGUgKyBzZWdtZW50LmNpcmN1bWZlcmVuY2U7XG5cblx0XHRcdFx0Ly8gSWYgd2UndmUgcmVtb3ZlZCB0aGUgZmlyc3Qgc2VnbWVudCB3ZSBuZWVkIHRvIHNldCB0aGUgZmlyc3Qgb25lIHRvXG5cdFx0XHRcdC8vIHN0YXJ0IGF0IHRoZSB0b3AuXG5cdFx0XHRcdGlmIChpbmRleCA9PT0gMCl7XG5cdFx0XHRcdFx0c2VnbWVudC5zdGFydEFuZ2xlID0gTWF0aC5QSSAqIDEuNTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vQ2hlY2sgdG8gc2VlIGlmIGl0J3MgdGhlIGxhc3Qgc2VnbWVudCwgaWYgbm90IGdldCB0aGUgbmV4dCBhbmQgdXBkYXRlIHRoZSBzdGFydCBhbmdsZVxuXHRcdFx0XHRpZiAoaW5kZXggPCB0aGlzLnNlZ21lbnRzLmxlbmd0aCAtIDEpe1xuXHRcdFx0XHRcdHRoaXMuc2VnbWVudHNbaW5kZXgrMV0uc3RhcnRBbmdsZSA9IHNlZ21lbnQuZW5kQW5nbGU7XG5cdFx0XHRcdH1cblx0XHRcdFx0c2VnbWVudC5kcmF3KCk7XG5cdFx0XHR9LCB0aGlzKTtcblx0XHRcdHRoaXMuc2NhbGUuZHJhdygpO1xuXHRcdH1cblx0fSk7XG5cbn0pLmNhbGwodGhpcyk7XG5cbihmdW5jdGlvbigpe1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgcm9vdCA9IHRoaXMsXG5cdFx0Q2hhcnQgPSByb290LkNoYXJ0LFxuXHRcdGhlbHBlcnMgPSBDaGFydC5oZWxwZXJzO1xuXG5cblxuXHRDaGFydC5UeXBlLmV4dGVuZCh7XG5cdFx0bmFtZTogXCJSYWRhclwiLFxuXHRcdGRlZmF1bHRzOntcblx0XHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyBsaW5lcyBmb3IgZWFjaCBzY2FsZSBwb2ludFxuXHRcdFx0c2NhbGVTaG93TGluZSA6IHRydWUsXG5cblx0XHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgd2Ugc2hvdyB0aGUgYW5nbGUgbGluZXMgb3V0IG9mIHRoZSByYWRhclxuXHRcdFx0YW5nbGVTaG93TGluZU91dCA6IHRydWUsXG5cblx0XHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyBsYWJlbHMgb24gdGhlIHNjYWxlXG5cdFx0XHRzY2FsZVNob3dMYWJlbHMgOiBmYWxzZSxcblxuXHRcdFx0Ly8gQm9vbGVhbiAtIFdoZXRoZXIgdGhlIHNjYWxlIHNob3VsZCBiZWdpbiBhdCB6ZXJvXG5cdFx0XHRzY2FsZUJlZ2luQXRaZXJvIDogdHJ1ZSxcblxuXHRcdFx0Ly9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGFuZ2xlIGxpbmVcblx0XHRcdGFuZ2xlTGluZUNvbG9yIDogXCJyZ2JhKDAsMCwwLC4xKVwiLFxuXG5cdFx0XHQvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHRoZSBhbmdsZSBsaW5lXG5cdFx0XHRhbmdsZUxpbmVXaWR0aCA6IDEsXG5cblx0XHRcdC8vTnVtYmVyIC0gSW50ZXJ2YWwgYXQgd2hpY2ggdG8gZHJhdyBhbmdsZSBsaW5lcyAoXCJldmVyeSBOdGggcG9pbnRcIilcblx0XHRcdGFuZ2xlTGluZUludGVydmFsOiAxLFxuXG5cdFx0XHQvL1N0cmluZyAtIFBvaW50IGxhYmVsIGZvbnQgZGVjbGFyYXRpb25cblx0XHRcdHBvaW50TGFiZWxGb250RmFtaWx5IDogXCInQXJpYWwnXCIsXG5cblx0XHRcdC8vU3RyaW5nIC0gUG9pbnQgbGFiZWwgZm9udCB3ZWlnaHRcblx0XHRcdHBvaW50TGFiZWxGb250U3R5bGUgOiBcIm5vcm1hbFwiLFxuXG5cdFx0XHQvL051bWJlciAtIFBvaW50IGxhYmVsIGZvbnQgc2l6ZSBpbiBwaXhlbHNcblx0XHRcdHBvaW50TGFiZWxGb250U2l6ZSA6IDEwLFxuXG5cdFx0XHQvL1N0cmluZyAtIFBvaW50IGxhYmVsIGZvbnQgY29sb3VyXG5cdFx0XHRwb2ludExhYmVsRm9udENvbG9yIDogXCIjNjY2XCIsXG5cblx0XHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyBhIGRvdCBmb3IgZWFjaCBwb2ludFxuXHRcdFx0cG9pbnREb3QgOiB0cnVlLFxuXG5cdFx0XHQvL051bWJlciAtIFJhZGl1cyBvZiBlYWNoIHBvaW50IGRvdCBpbiBwaXhlbHNcblx0XHRcdHBvaW50RG90UmFkaXVzIDogMyxcblxuXHRcdFx0Ly9OdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiBwb2ludCBkb3Qgc3Ryb2tlXG5cdFx0XHRwb2ludERvdFN0cm9rZVdpZHRoIDogMSxcblxuXHRcdFx0Ly9OdW1iZXIgLSBhbW91bnQgZXh0cmEgdG8gYWRkIHRvIHRoZSByYWRpdXMgdG8gY2F0ZXIgZm9yIGhpdCBkZXRlY3Rpb24gb3V0c2lkZSB0aGUgZHJhd24gcG9pbnRcblx0XHRcdHBvaW50SGl0RGV0ZWN0aW9uUmFkaXVzIDogMjAsXG5cblx0XHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyBhIHN0cm9rZSBmb3IgZGF0YXNldHNcblx0XHRcdGRhdGFzZXRTdHJva2UgOiB0cnVlLFxuXG5cdFx0XHQvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIGRhdGFzZXQgc3Ryb2tlXG5cdFx0XHRkYXRhc2V0U3Ryb2tlV2lkdGggOiAyLFxuXG5cdFx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIGZpbGwgdGhlIGRhdGFzZXQgd2l0aCBhIGNvbG91clxuXHRcdFx0ZGF0YXNldEZpbGwgOiB0cnVlLFxuXG5cdFx0XHQvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG5cdFx0XHRsZWdlbmRUZW1wbGF0ZSA6IFwiPHVsIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmRcXFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZC1pY29uXFxcIiBzdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjo8JT1kYXRhc2V0c1tpXS5zdHJva2VDb2xvciU+XFxcIj48L3NwYW4+PHNwYW4gY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZC10ZXh0XFxcIj48JWlmKGRhdGFzZXRzW2ldLmxhYmVsKXslPjwlPWRhdGFzZXRzW2ldLmxhYmVsJT48JX0lPjwvc3Bhbj48L2xpPjwlfSU+PC91bD5cIlxuXG5cdFx0fSxcblxuXHRcdGluaXRpYWxpemU6IGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0dGhpcy5Qb2ludENsYXNzID0gQ2hhcnQuUG9pbnQuZXh0ZW5kKHtcblx0XHRcdFx0c3Ryb2tlV2lkdGggOiB0aGlzLm9wdGlvbnMucG9pbnREb3RTdHJva2VXaWR0aCxcblx0XHRcdFx0cmFkaXVzIDogdGhpcy5vcHRpb25zLnBvaW50RG90UmFkaXVzLFxuXHRcdFx0XHRkaXNwbGF5OiB0aGlzLm9wdGlvbnMucG9pbnREb3QsXG5cdFx0XHRcdGhpdERldGVjdGlvblJhZGl1cyA6IHRoaXMub3B0aW9ucy5wb2ludEhpdERldGVjdGlvblJhZGl1cyxcblx0XHRcdFx0Y3R4IDogdGhpcy5jaGFydC5jdHhcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLmRhdGFzZXRzID0gW107XG5cblx0XHRcdHRoaXMuYnVpbGRTY2FsZShkYXRhKTtcblxuXHRcdFx0Ly9TZXQgdXAgdG9vbHRpcCBldmVudHMgb24gdGhlIGNoYXJ0XG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLnNob3dUb29sdGlwcyl7XG5cdFx0XHRcdGhlbHBlcnMuYmluZEV2ZW50cyh0aGlzLCB0aGlzLm9wdGlvbnMudG9vbHRpcEV2ZW50cywgZnVuY3Rpb24oZXZ0KXtcblx0XHRcdFx0XHR2YXIgYWN0aXZlUG9pbnRzQ29sbGVjdGlvbiA9IChldnQudHlwZSAhPT0gJ21vdXNlb3V0JykgPyB0aGlzLmdldFBvaW50c0F0RXZlbnQoZXZ0KSA6IFtdO1xuXG5cdFx0XHRcdFx0dGhpcy5lYWNoUG9pbnRzKGZ1bmN0aW9uKHBvaW50KXtcblx0XHRcdFx0XHRcdHBvaW50LnJlc3RvcmUoWydmaWxsQ29sb3InLCAnc3Ryb2tlQ29sb3InXSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0aGVscGVycy5lYWNoKGFjdGl2ZVBvaW50c0NvbGxlY3Rpb24sIGZ1bmN0aW9uKGFjdGl2ZVBvaW50KXtcblx0XHRcdFx0XHRcdGFjdGl2ZVBvaW50LmZpbGxDb2xvciA9IGFjdGl2ZVBvaW50LmhpZ2hsaWdodEZpbGw7XG5cdFx0XHRcdFx0XHRhY3RpdmVQb2ludC5zdHJva2VDb2xvciA9IGFjdGl2ZVBvaW50LmhpZ2hsaWdodFN0cm9rZTtcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdHRoaXMuc2hvd1Rvb2x0aXAoYWN0aXZlUG9pbnRzQ29sbGVjdGlvbik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHQvL0l0ZXJhdGUgdGhyb3VnaCBlYWNoIG9mIHRoZSBkYXRhc2V0cywgYW5kIGJ1aWxkIHRoaXMgaW50byBhIHByb3BlcnR5IG9mIHRoZSBjaGFydFxuXHRcdFx0aGVscGVycy5lYWNoKGRhdGEuZGF0YXNldHMsZnVuY3Rpb24oZGF0YXNldCl7XG5cblx0XHRcdFx0dmFyIGRhdGFzZXRPYmplY3QgPSB7XG5cdFx0XHRcdFx0bGFiZWw6IGRhdGFzZXQubGFiZWwgfHwgbnVsbCxcblx0XHRcdFx0XHRmaWxsQ29sb3IgOiBkYXRhc2V0LmZpbGxDb2xvcixcblx0XHRcdFx0XHRzdHJva2VDb2xvciA6IGRhdGFzZXQuc3Ryb2tlQ29sb3IsXG5cdFx0XHRcdFx0cG9pbnRDb2xvciA6IGRhdGFzZXQucG9pbnRDb2xvcixcblx0XHRcdFx0XHRwb2ludFN0cm9rZUNvbG9yIDogZGF0YXNldC5wb2ludFN0cm9rZUNvbG9yLFxuXHRcdFx0XHRcdHBvaW50cyA6IFtdXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dGhpcy5kYXRhc2V0cy5wdXNoKGRhdGFzZXRPYmplY3QpO1xuXG5cdFx0XHRcdGhlbHBlcnMuZWFjaChkYXRhc2V0LmRhdGEsZnVuY3Rpb24oZGF0YVBvaW50LGluZGV4KXtcblx0XHRcdFx0XHQvL0FkZCBhIG5ldyBwb2ludCBmb3IgZWFjaCBwaWVjZSBvZiBkYXRhLCBwYXNzaW5nIGFueSByZXF1aXJlZCBkYXRhIHRvIGRyYXcuXG5cdFx0XHRcdFx0dmFyIHBvaW50UG9zaXRpb247XG5cdFx0XHRcdFx0aWYgKCF0aGlzLnNjYWxlLmFuaW1hdGlvbil7XG5cdFx0XHRcdFx0XHRwb2ludFBvc2l0aW9uID0gdGhpcy5zY2FsZS5nZXRQb2ludFBvc2l0aW9uKGluZGV4LCB0aGlzLnNjYWxlLmNhbGN1bGF0ZUNlbnRlck9mZnNldChkYXRhUG9pbnQpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGF0YXNldE9iamVjdC5wb2ludHMucHVzaChuZXcgdGhpcy5Qb2ludENsYXNzKHtcblx0XHRcdFx0XHRcdHZhbHVlIDogZGF0YVBvaW50LFxuXHRcdFx0XHRcdFx0bGFiZWwgOiBkYXRhLmxhYmVsc1tpbmRleF0sXG5cdFx0XHRcdFx0XHRkYXRhc2V0TGFiZWw6IGRhdGFzZXQubGFiZWwsXG5cdFx0XHRcdFx0XHR4OiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbikgPyB0aGlzLnNjYWxlLnhDZW50ZXIgOiBwb2ludFBvc2l0aW9uLngsXG5cdFx0XHRcdFx0XHR5OiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbikgPyB0aGlzLnNjYWxlLnlDZW50ZXIgOiBwb2ludFBvc2l0aW9uLnksXG5cdFx0XHRcdFx0XHRzdHJva2VDb2xvciA6IGRhdGFzZXQucG9pbnRTdHJva2VDb2xvcixcblx0XHRcdFx0XHRcdGZpbGxDb2xvciA6IGRhdGFzZXQucG9pbnRDb2xvcixcblx0XHRcdFx0XHRcdGhpZ2hsaWdodEZpbGwgOiBkYXRhc2V0LnBvaW50SGlnaGxpZ2h0RmlsbCB8fCBkYXRhc2V0LnBvaW50Q29sb3IsXG5cdFx0XHRcdFx0XHRoaWdobGlnaHRTdHJva2UgOiBkYXRhc2V0LnBvaW50SGlnaGxpZ2h0U3Ryb2tlIHx8IGRhdGFzZXQucG9pbnRTdHJva2VDb2xvclxuXHRcdFx0XHRcdH0pKTtcblx0XHRcdFx0fSx0aGlzKTtcblxuXHRcdFx0fSx0aGlzKTtcblxuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR9LFxuXHRcdGVhY2hQb2ludHMgOiBmdW5jdGlvbihjYWxsYmFjayl7XG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5kYXRhc2V0cyxmdW5jdGlvbihkYXRhc2V0KXtcblx0XHRcdFx0aGVscGVycy5lYWNoKGRhdGFzZXQucG9pbnRzLGNhbGxiYWNrLHRoaXMpO1xuXHRcdFx0fSx0aGlzKTtcblx0XHR9LFxuXG5cdFx0Z2V0UG9pbnRzQXRFdmVudCA6IGZ1bmN0aW9uKGV2dCl7XG5cdFx0XHR2YXIgbW91c2VQb3NpdGlvbiA9IGhlbHBlcnMuZ2V0UmVsYXRpdmVQb3NpdGlvbihldnQpLFxuXHRcdFx0XHRmcm9tQ2VudGVyID0gaGVscGVycy5nZXRBbmdsZUZyb21Qb2ludCh7XG5cdFx0XHRcdFx0eDogdGhpcy5zY2FsZS54Q2VudGVyLFxuXHRcdFx0XHRcdHk6IHRoaXMuc2NhbGUueUNlbnRlclxuXHRcdFx0XHR9LCBtb3VzZVBvc2l0aW9uKTtcblxuXHRcdFx0dmFyIGFuZ2xlUGVySW5kZXggPSAoTWF0aC5QSSAqIDIpIC90aGlzLnNjYWxlLnZhbHVlc0NvdW50LFxuXHRcdFx0XHRwb2ludEluZGV4ID0gTWF0aC5yb3VuZCgoZnJvbUNlbnRlci5hbmdsZSAtIE1hdGguUEkgKiAxLjUpIC8gYW5nbGVQZXJJbmRleCksXG5cdFx0XHRcdGFjdGl2ZVBvaW50c0NvbGxlY3Rpb24gPSBbXTtcblxuXHRcdFx0Ly8gSWYgd2UncmUgYXQgdGhlIHRvcCwgbWFrZSB0aGUgcG9pbnRJbmRleCAwIHRvIGdldCB0aGUgZmlyc3Qgb2YgdGhlIGFycmF5LlxuXHRcdFx0aWYgKHBvaW50SW5kZXggPj0gdGhpcy5zY2FsZS52YWx1ZXNDb3VudCB8fCBwb2ludEluZGV4IDwgMCl7XG5cdFx0XHRcdHBvaW50SW5kZXggPSAwO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZnJvbUNlbnRlci5kaXN0YW5jZSA8PSB0aGlzLnNjYWxlLmRyYXdpbmdBcmVhKXtcblx0XHRcdFx0aGVscGVycy5lYWNoKHRoaXMuZGF0YXNldHMsIGZ1bmN0aW9uKGRhdGFzZXQpe1xuXHRcdFx0XHRcdGFjdGl2ZVBvaW50c0NvbGxlY3Rpb24ucHVzaChkYXRhc2V0LnBvaW50c1twb2ludEluZGV4XSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYWN0aXZlUG9pbnRzQ29sbGVjdGlvbjtcblx0XHR9LFxuXG5cdFx0YnVpbGRTY2FsZSA6IGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0dGhpcy5zY2FsZSA9IG5ldyBDaGFydC5SYWRpYWxTY2FsZSh7XG5cdFx0XHRcdGRpc3BsYXk6IHRoaXMub3B0aW9ucy5zaG93U2NhbGUsXG5cdFx0XHRcdGZvbnRTdHlsZTogdGhpcy5vcHRpb25zLnNjYWxlRm9udFN0eWxlLFxuXHRcdFx0XHRmb250U2l6ZTogdGhpcy5vcHRpb25zLnNjYWxlRm9udFNpemUsXG5cdFx0XHRcdGZvbnRGYW1pbHk6IHRoaXMub3B0aW9ucy5zY2FsZUZvbnRGYW1pbHksXG5cdFx0XHRcdGZvbnRDb2xvcjogdGhpcy5vcHRpb25zLnNjYWxlRm9udENvbG9yLFxuXHRcdFx0XHRzaG93TGFiZWxzOiB0aGlzLm9wdGlvbnMuc2NhbGVTaG93TGFiZWxzLFxuXHRcdFx0XHRzaG93TGFiZWxCYWNrZHJvcDogdGhpcy5vcHRpb25zLnNjYWxlU2hvd0xhYmVsQmFja2Ryb3AsXG5cdFx0XHRcdGJhY2tkcm9wQ29sb3I6IHRoaXMub3B0aW9ucy5zY2FsZUJhY2tkcm9wQ29sb3IsXG5cdFx0XHRcdGJhY2tncm91bmRDb2xvcnM6IHRoaXMub3B0aW9ucy5zY2FsZUJhY2tncm91bmRDb2xvcnMsXG5cdFx0XHRcdGJhY2tkcm9wUGFkZGluZ1kgOiB0aGlzLm9wdGlvbnMuc2NhbGVCYWNrZHJvcFBhZGRpbmdZLFxuXHRcdFx0XHRiYWNrZHJvcFBhZGRpbmdYOiB0aGlzLm9wdGlvbnMuc2NhbGVCYWNrZHJvcFBhZGRpbmdYLFxuXHRcdFx0XHRsaW5lV2lkdGg6ICh0aGlzLm9wdGlvbnMuc2NhbGVTaG93TGluZSkgPyB0aGlzLm9wdGlvbnMuc2NhbGVMaW5lV2lkdGggOiAwLFxuXHRcdFx0XHRsaW5lQ29sb3I6IHRoaXMub3B0aW9ucy5zY2FsZUxpbmVDb2xvcixcblx0XHRcdFx0YW5nbGVMaW5lQ29sb3IgOiB0aGlzLm9wdGlvbnMuYW5nbGVMaW5lQ29sb3IsXG5cdFx0XHRcdGFuZ2xlTGluZVdpZHRoIDogKHRoaXMub3B0aW9ucy5hbmdsZVNob3dMaW5lT3V0KSA/IHRoaXMub3B0aW9ucy5hbmdsZUxpbmVXaWR0aCA6IDAsXG4gICAgICAgIGFuZ2xlTGluZUludGVydmFsOiAodGhpcy5vcHRpb25zLmFuZ2xlTGluZUludGVydmFsKSA/IHRoaXMub3B0aW9ucy5hbmdsZUxpbmVJbnRlcnZhbCA6IDEsXG5cdFx0XHRcdC8vIFBvaW50IGxhYmVscyBhdCB0aGUgZWRnZSBvZiBlYWNoIGxpbmVcblx0XHRcdFx0cG9pbnRMYWJlbEZvbnRDb2xvciA6IHRoaXMub3B0aW9ucy5wb2ludExhYmVsRm9udENvbG9yLFxuXHRcdFx0XHRwb2ludExhYmVsRm9udFNpemUgOiB0aGlzLm9wdGlvbnMucG9pbnRMYWJlbEZvbnRTaXplLFxuXHRcdFx0XHRwb2ludExhYmVsRm9udEZhbWlseSA6IHRoaXMub3B0aW9ucy5wb2ludExhYmVsRm9udEZhbWlseSxcblx0XHRcdFx0cG9pbnRMYWJlbEZvbnRTdHlsZSA6IHRoaXMub3B0aW9ucy5wb2ludExhYmVsRm9udFN0eWxlLFxuXHRcdFx0XHRoZWlnaHQgOiB0aGlzLmNoYXJ0LmhlaWdodCxcblx0XHRcdFx0d2lkdGg6IHRoaXMuY2hhcnQud2lkdGgsXG5cdFx0XHRcdHhDZW50ZXI6IHRoaXMuY2hhcnQud2lkdGgvMixcblx0XHRcdFx0eUNlbnRlcjogdGhpcy5jaGFydC5oZWlnaHQvMixcblx0XHRcdFx0Y3R4IDogdGhpcy5jaGFydC5jdHgsXG5cdFx0XHRcdHRlbXBsYXRlU3RyaW5nOiB0aGlzLm9wdGlvbnMuc2NhbGVMYWJlbCxcblx0XHRcdFx0bGFiZWxzOiBkYXRhLmxhYmVscyxcblx0XHRcdFx0dmFsdWVzQ291bnQ6IGRhdGEuZGF0YXNldHNbMF0uZGF0YS5sZW5ndGhcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLnNjYWxlLnNldFNjYWxlU2l6ZSgpO1xuXHRcdFx0dGhpcy51cGRhdGVTY2FsZVJhbmdlKGRhdGEuZGF0YXNldHMpO1xuXHRcdFx0dGhpcy5zY2FsZS5idWlsZFlMYWJlbHMoKTtcblx0XHR9LFxuXHRcdHVwZGF0ZVNjYWxlUmFuZ2U6IGZ1bmN0aW9uKGRhdGFzZXRzKXtcblx0XHRcdHZhciB2YWx1ZXNBcnJheSA9IChmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgdG90YWxEYXRhQXJyYXkgPSBbXTtcblx0XHRcdFx0aGVscGVycy5lYWNoKGRhdGFzZXRzLGZ1bmN0aW9uKGRhdGFzZXQpe1xuXHRcdFx0XHRcdGlmIChkYXRhc2V0LmRhdGEpe1xuXHRcdFx0XHRcdFx0dG90YWxEYXRhQXJyYXkgPSB0b3RhbERhdGFBcnJheS5jb25jYXQoZGF0YXNldC5kYXRhKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRoZWxwZXJzLmVhY2goZGF0YXNldC5wb2ludHMsIGZ1bmN0aW9uKHBvaW50KXtcblx0XHRcdFx0XHRcdFx0dG90YWxEYXRhQXJyYXkucHVzaChwb2ludC52YWx1ZSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRyZXR1cm4gdG90YWxEYXRhQXJyYXk7XG5cdFx0XHR9KSgpO1xuXG5cblx0XHRcdHZhciBzY2FsZVNpemVzID0gKHRoaXMub3B0aW9ucy5zY2FsZU92ZXJyaWRlKSA/XG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdGVwczogdGhpcy5vcHRpb25zLnNjYWxlU3RlcHMsXG5cdFx0XHRcdFx0c3RlcFZhbHVlOiB0aGlzLm9wdGlvbnMuc2NhbGVTdGVwV2lkdGgsXG5cdFx0XHRcdFx0bWluOiB0aGlzLm9wdGlvbnMuc2NhbGVTdGFydFZhbHVlLFxuXHRcdFx0XHRcdG1heDogdGhpcy5vcHRpb25zLnNjYWxlU3RhcnRWYWx1ZSArICh0aGlzLm9wdGlvbnMuc2NhbGVTdGVwcyAqIHRoaXMub3B0aW9ucy5zY2FsZVN0ZXBXaWR0aClcblx0XHRcdFx0fSA6XG5cdFx0XHRcdGhlbHBlcnMuY2FsY3VsYXRlU2NhbGVSYW5nZShcblx0XHRcdFx0XHR2YWx1ZXNBcnJheSxcblx0XHRcdFx0XHRoZWxwZXJzLm1pbihbdGhpcy5jaGFydC53aWR0aCwgdGhpcy5jaGFydC5oZWlnaHRdKS8yLFxuXHRcdFx0XHRcdHRoaXMub3B0aW9ucy5zY2FsZUZvbnRTaXplLFxuXHRcdFx0XHRcdHRoaXMub3B0aW9ucy5zY2FsZUJlZ2luQXRaZXJvLFxuXHRcdFx0XHRcdHRoaXMub3B0aW9ucy5zY2FsZUludGVnZXJzT25seVxuXHRcdFx0XHQpO1xuXG5cdFx0XHRoZWxwZXJzLmV4dGVuZChcblx0XHRcdFx0dGhpcy5zY2FsZSxcblx0XHRcdFx0c2NhbGVTaXplc1xuXHRcdFx0KTtcblxuXHRcdH0sXG5cdFx0YWRkRGF0YSA6IGZ1bmN0aW9uKHZhbHVlc0FycmF5LGxhYmVsKXtcblx0XHRcdC8vTWFwIHRoZSB2YWx1ZXMgYXJyYXkgZm9yIGVhY2ggb2YgdGhlIGRhdGFzZXRzXG5cdFx0XHR0aGlzLnNjYWxlLnZhbHVlc0NvdW50Kys7XG5cdFx0XHRoZWxwZXJzLmVhY2godmFsdWVzQXJyYXksZnVuY3Rpb24odmFsdWUsZGF0YXNldEluZGV4KXtcblx0XHRcdFx0dmFyIHBvaW50UG9zaXRpb24gPSB0aGlzLnNjYWxlLmdldFBvaW50UG9zaXRpb24odGhpcy5zY2FsZS52YWx1ZXNDb3VudCwgdGhpcy5zY2FsZS5jYWxjdWxhdGVDZW50ZXJPZmZzZXQodmFsdWUpKTtcblx0XHRcdFx0dGhpcy5kYXRhc2V0c1tkYXRhc2V0SW5kZXhdLnBvaW50cy5wdXNoKG5ldyB0aGlzLlBvaW50Q2xhc3Moe1xuXHRcdFx0XHRcdHZhbHVlIDogdmFsdWUsXG5cdFx0XHRcdFx0bGFiZWwgOiBsYWJlbCxcblx0XHRcdFx0XHRkYXRhc2V0TGFiZWw6IHRoaXMuZGF0YXNldHNbZGF0YXNldEluZGV4XS5sYWJlbCxcblx0XHRcdFx0XHR4OiBwb2ludFBvc2l0aW9uLngsXG5cdFx0XHRcdFx0eTogcG9pbnRQb3NpdGlvbi55LFxuXHRcdFx0XHRcdHN0cm9rZUNvbG9yIDogdGhpcy5kYXRhc2V0c1tkYXRhc2V0SW5kZXhdLnBvaW50U3Ryb2tlQ29sb3IsXG5cdFx0XHRcdFx0ZmlsbENvbG9yIDogdGhpcy5kYXRhc2V0c1tkYXRhc2V0SW5kZXhdLnBvaW50Q29sb3Jcblx0XHRcdFx0fSkpO1xuXHRcdFx0fSx0aGlzKTtcblxuXHRcdFx0dGhpcy5zY2FsZS5sYWJlbHMucHVzaChsYWJlbCk7XG5cblx0XHRcdHRoaXMucmVmbG93KCk7XG5cblx0XHRcdHRoaXMudXBkYXRlKCk7XG5cdFx0fSxcblx0XHRyZW1vdmVEYXRhIDogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuc2NhbGUudmFsdWVzQ291bnQtLTtcblx0XHRcdHRoaXMuc2NhbGUubGFiZWxzLnNoaWZ0KCk7XG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5kYXRhc2V0cyxmdW5jdGlvbihkYXRhc2V0KXtcblx0XHRcdFx0ZGF0YXNldC5wb2ludHMuc2hpZnQoKTtcblx0XHRcdH0sdGhpcyk7XG5cdFx0XHR0aGlzLnJlZmxvdygpO1xuXHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHR9LFxuXHRcdHVwZGF0ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLmVhY2hQb2ludHMoZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0XHRwb2ludC5zYXZlKCk7XG5cdFx0XHR9KTtcblx0XHRcdHRoaXMucmVmbG93KCk7XG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH0sXG5cdFx0cmVmbG93OiBmdW5jdGlvbigpe1xuXHRcdFx0aGVscGVycy5leHRlbmQodGhpcy5zY2FsZSwge1xuXHRcdFx0XHR3aWR0aCA6IHRoaXMuY2hhcnQud2lkdGgsXG5cdFx0XHRcdGhlaWdodDogdGhpcy5jaGFydC5oZWlnaHQsXG5cdFx0XHRcdHNpemUgOiBoZWxwZXJzLm1pbihbdGhpcy5jaGFydC53aWR0aCwgdGhpcy5jaGFydC5oZWlnaHRdKSxcblx0XHRcdFx0eENlbnRlcjogdGhpcy5jaGFydC53aWR0aC8yLFxuXHRcdFx0XHR5Q2VudGVyOiB0aGlzLmNoYXJ0LmhlaWdodC8yXG5cdFx0XHR9KTtcblx0XHRcdHRoaXMudXBkYXRlU2NhbGVSYW5nZSh0aGlzLmRhdGFzZXRzKTtcblx0XHRcdHRoaXMuc2NhbGUuc2V0U2NhbGVTaXplKCk7XG5cdFx0XHR0aGlzLnNjYWxlLmJ1aWxkWUxhYmVscygpO1xuXHRcdH0sXG5cdFx0ZHJhdyA6IGZ1bmN0aW9uKGVhc2Upe1xuXHRcdFx0dmFyIGVhc2VEZWNpbWFsID0gZWFzZSB8fCAxLFxuXHRcdFx0XHRjdHggPSB0aGlzLmNoYXJ0LmN0eDtcblx0XHRcdHRoaXMuY2xlYXIoKTtcblx0XHRcdHRoaXMuc2NhbGUuZHJhdygpO1xuXG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5kYXRhc2V0cyxmdW5jdGlvbihkYXRhc2V0KXtcblxuXHRcdFx0XHQvL1RyYW5zaXRpb24gZWFjaCBwb2ludCBmaXJzdCBzbyB0aGF0IHRoZSBsaW5lIGFuZCBwb2ludCBkcmF3aW5nIGlzbid0IG91dCBvZiBzeW5jXG5cdFx0XHRcdGhlbHBlcnMuZWFjaChkYXRhc2V0LnBvaW50cyxmdW5jdGlvbihwb2ludCxpbmRleCl7XG5cdFx0XHRcdFx0aWYgKHBvaW50Lmhhc1ZhbHVlKCkpe1xuXHRcdFx0XHRcdFx0cG9pbnQudHJhbnNpdGlvbih0aGlzLnNjYWxlLmdldFBvaW50UG9zaXRpb24oaW5kZXgsIHRoaXMuc2NhbGUuY2FsY3VsYXRlQ2VudGVyT2Zmc2V0KHBvaW50LnZhbHVlKSksIGVhc2VEZWNpbWFsKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sdGhpcyk7XG5cblxuXG5cdFx0XHRcdC8vRHJhdyB0aGUgbGluZSBiZXR3ZWVuIGFsbCB0aGUgcG9pbnRzXG5cdFx0XHRcdGN0eC5saW5lV2lkdGggPSB0aGlzLm9wdGlvbnMuZGF0YXNldFN0cm9rZVdpZHRoO1xuXHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSBkYXRhc2V0LnN0cm9rZUNvbG9yO1xuXHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHRcdGhlbHBlcnMuZWFjaChkYXRhc2V0LnBvaW50cyxmdW5jdGlvbihwb2ludCxpbmRleCl7XG5cdFx0XHRcdFx0aWYgKGluZGV4ID09PSAwKXtcblx0XHRcdFx0XHRcdGN0eC5tb3ZlVG8ocG9pbnQueCxwb2ludC55KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZXtcblx0XHRcdFx0XHRcdGN0eC5saW5lVG8ocG9pbnQueCxwb2ludC55KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sdGhpcyk7XG5cdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcblx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xuXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBkYXRhc2V0LmZpbGxDb2xvcjtcblx0XHRcdFx0aWYodGhpcy5vcHRpb25zLmRhdGFzZXRGaWxsKXtcblx0XHRcdFx0XHRjdHguZmlsbCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vTm93IGRyYXcgdGhlIHBvaW50cyBvdmVyIHRoZSBsaW5lXG5cdFx0XHRcdC8vQSBsaXR0bGUgaW5lZmZpY2llbnQgZG91YmxlIGxvb3BpbmcsIGJ1dCBiZXR0ZXIgdGhhbiB0aGUgbGluZVxuXHRcdFx0XHQvL2xhZ2dpbmcgYmVoaW5kIHRoZSBwb2ludCBwb3NpdGlvbnNcblx0XHRcdFx0aGVscGVycy5lYWNoKGRhdGFzZXQucG9pbnRzLGZ1bmN0aW9uKHBvaW50KXtcblx0XHRcdFx0XHRpZiAocG9pbnQuaGFzVmFsdWUoKSl7XG5cdFx0XHRcdFx0XHRwb2ludC5kcmF3KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0fSx0aGlzKTtcblxuXHRcdH1cblxuXHR9KTtcblxuXG5cblxuXG59KS5jYWxsKHRoaXMpO1xuIl19

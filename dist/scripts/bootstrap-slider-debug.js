/*! =========================================================
 * bootstrap-slider.js
 *
 * Maintainers:
 *		Kyle Kemp
 *			- Twitter: @seiyria
 *			- Github:  seiyria
 *		Rohit Kalkur
 *			- Twitter: @Rovolutionary
 *			- Github:  rovolution
 *
 * =========================================================
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


/**
 * Bridget makes jQuery widgets
 * v1.0.1
 * MIT license
 */

(function(root, factory) {
	if(typeof define === "function" && define.amd) {
		define(["jquery"], factory);
	}
	else if(typeof module === "object" && module.exports) {
		var jQuery;
		try {
			jQuery = require("jquery");
		}
		catch (err) {
			jQuery = null;
		}
		module.exports = factory(jQuery);
	}
	else {
		root.Slider = factory(root.jQuery);
	}
}(this, function($) {
	// Reference to Slider constructor
	var Slider;


	(function( $ ) {

		'use strict';

		// -------------------------- utils -------------------------- //

		var slice = Array.prototype.slice;

		function noop() {}

		// -------------------------- definition -------------------------- //

		function defineBridget( $ ) {

			// bail if no jQuery
			if ( !$ ) {
				return;
			}

			// -------------------------- addOptionMethod -------------------------- //

			/**
			 * adds option method -> $().plugin('option', {...})
			 * @param {Function} PluginClass - constructor class
			 */
			function addOptionMethod( PluginClass ) {
				// don't overwrite original option method
				if ( PluginClass.prototype.option ) {
					return;
				}

			  // option setter
			  PluginClass.prototype.option = function( opts ) {
			    // bail out if not an object
			    if ( !$.isPlainObject( opts ) ){
			      return;
			    }
			    this.options = $.extend( true, this.options, opts );
			  };
			}


			// -------------------------- plugin bridge -------------------------- //

			// helper function for logging errors
			// $.error breaks jQuery chaining
			var logError = typeof console === 'undefined' ? noop :
			  function( message ) {
			    console.error( message );
			  };

			/**
			 * jQuery plugin bridge, access methods like $elem.plugin('method')
			 * @param {String} namespace - plugin name
			 * @param {Function} PluginClass - constructor class
			 */
			function bridge( namespace, PluginClass ) {
			  // add to jQuery fn namespace
			  $.fn[ namespace ] = function( options ) {
			    if ( typeof options === 'string' ) {
			      // call plugin method when first argument is a string
			      // get arguments for method
			      var args = slice.call( arguments, 1 );

			      for ( var i=0, len = this.length; i < len; i++ ) {
			        var elem = this[i];
			        var instance = $.data( elem, namespace );
			        if ( !instance ) {
			          logError( "cannot call methods on " + namespace + " prior to initialization; " +
			            "attempted to call '" + options + "'" );
			          continue;
			        }
			        if ( !$.isFunction( instance[options] ) || options.charAt(0) === '_' ) {
			          logError( "no such method '" + options + "' for " + namespace + " instance" );
			          continue;
			        }

			        // trigger method with arguments
			        var returnValue = instance[ options ].apply( instance, args);

			        // break look and return first value if provided
			        if ( returnValue !== undefined && returnValue !== instance) {
			          return returnValue;
			        }
			      }
			      // return this if no return value
			      return this;
			    } else {
			      var objects = this.map( function() {
			        var instance = $.data( this, namespace );
			        if ( instance ) {
			          // apply options & init
			          instance.option( options );
			          instance._init();
			        } else {
			          // initialize new instance
			          instance = new PluginClass( this, options );
			          $.data( this, namespace, instance );
			        }
			        return $(this);
			      });

			      if(!objects || objects.length > 1) {
			      	return objects;
			      } else {
			      	return objects[0];
			      }
			    }
			  };

			}

			// -------------------------- bridget -------------------------- //

			/**
			 * converts a Prototypical class into a proper jQuery plugin
			 *   the class must have a ._init method
			 * @param {String} namespace - plugin name, used in $().pluginName
			 * @param {Function} PluginClass - constructor class
			 */
			$.bridget = function( namespace, PluginClass ) {
			  addOptionMethod( PluginClass );
			  bridge( namespace, PluginClass );
			};

			return $.bridget;

		}

	  	// get jquery from browser global
	  	defineBridget( $ );

	})( $ );


	/*************************************************

			BOOTSTRAP-SLIDER SOURCE CODE

	**************************************************/

	(function($) {

		var ErrorMsgs = {
			formatInvalidInputErrorMsg : function(input) {
				return "Invalid input value '" + input + "' passed in";
			},
			callingContextNotSliderInstance : "Calling context element does not have instance of Slider bound to it. Check your code to make sure the JQuery object returned from the call to the slider() initializer is calling the method"
		};

		var SliderScale = {
			linear: {
				toValue: function(percentage) {
					var rawValue = percentage/100 * (this.options.max - this.options.min);
					if (this.options.ticks_positions.length > 0) {
						var minv, maxv, minp, maxp = 0;
						for (var i = 0; i < this.options.ticks_positions.length; i++) {
							if (percentage <= this.options.ticks_positions[i]) {
								minv = (i > 0) ? this.options.ticks[i-1] : 0;
								minp = (i > 0) ? this.options.ticks_positions[i-1] : 0;
								maxv = this.options.ticks[i];
								maxp = this.options.ticks_positions[i];

								break;
							}
						}
						if (i > 0) {
							var partialPercentage = (percentage - minp) / (maxp - minp);
							rawValue = minv + partialPercentage * (maxv - minv);
						}
					}

					var value = this.options.min + Math.round(rawValue / this.options.step) * this.options.step;
					if (value < this.options.min) {
						return this.options.min;
					} else if (value > this.options.max) {
						return this.options.max;
					} else {
						return value;
					}
				},
				toPercentage: function(value) {
					if (this.options.max === this.options.min) {
						return 0;
					}

					if (this.options.ticks_positions.length > 0) {
						var minv, maxv, minp, maxp = 0;
						for (var i = 0; i < this.options.ticks.length; i++) {
							if (value  <= this.options.ticks[i]) {
								minv = (i > 0) ? this.options.ticks[i-1] : 0;
								minp = (i > 0) ? this.options.ticks_positions[i-1] : 0;
								maxv = this.options.ticks[i];
								maxp = this.options.ticks_positions[i];

								break;
							}
						}
						if (i > 0) {
							var partialPercentage = (value - minv) / (maxv - minv);
							return minp + partialPercentage * (maxp - minp);
						}
					}

					return 100 * (value - this.options.min) / (this.options.max - this.options.min);
				}
			},

			logarithmic: {
				/* Based on http://stackoverflow.com/questions/846221/logarithmic-slider */
				toValue: function(percentage) {
					var min = (this.options.min === 0) ? 0 : Math.log(this.options.min);
					var max = Math.log(this.options.max);
					var value = Math.exp(min + (max - min) * percentage / 100);
					value = this.options.min + Math.round((value - this.options.min) / this.options.step) * this.options.step;
					/* Rounding to the nearest step could exceed the min or
					 * max, so clip to those values. */
					if (value < this.options.min) {
						return this.options.min;
					} else if (value > this.options.max) {
						return this.options.max;
					} else {
						return value;
					}
				},
				toPercentage: function(value) {
					if (this.options.max === this.options.min) {
						return 0;
					} else {
						var max = Math.log(this.options.max);
						var min = this.options.min === 0 ? 0 : Math.log(this.options.min);
						var v = value === 0 ? 0 : Math.log(value);
						return 100 * (v - min) / (max - min);
					}
				}
			}
		};


		/*************************************************

							CONSTRUCTOR

		**************************************************/
		Slider = function(element, options) {
			createNewSlider.call(this, element, options);
			return this;
		};

		function createNewSlider(element, options) {

			/*
				The internal state object is used to store data about the current 'state' of slider.

				This includes values such as the `value`, `enabled`, etc...
			*/
			this._state = {
				value: null,
				enabled: null,
				offset: null,
				size: null,
				percentage: null,
				inDrag: false,
				over: false
			};


			if(typeof element === "string") {
				this.element = document.querySelector(element);
			} else if(element instanceof HTMLElement) {
				this.element = element;
			}

			/*************************************************

							Process Options

			**************************************************/
			options = options ? options : {};
			var optionTypes = Object.keys(this.defaultOptions);

			for(var i = 0; i < optionTypes.length; i++) {
				var optName = optionTypes[i];

				// First check if an option was passed in via the constructor
				var val = options[optName];
				// If no data attrib, then check data atrributes
				val = (typeof val !== 'undefined') ? val : getDataAttrib(this.element, optName);
				// Finally, if nothing was specified, use the defaults
				val = (val !== null) ? val : this.defaultOptions[optName];

				// Set all options on the instance of the Slider
				if(!this.options) {
					this.options = {};
				}
				this.options[optName] = val;
			}

			/*
				Validate `tooltip_position` against 'orientation`
				- if `tooltip_position` is incompatible with orientation, swith it to a default compatible with specified `orientation`
					-- default for "vertical" -> "right"
					-- default for "horizontal" -> "left"
			*/
			if(this.options.orientation === "vertical" && (this.options.tooltip_position === "top" || this.options.tooltip_position === "bottom")) {

				this.options.tooltip_position	= "right";

			}
			else if(this.options.orientation === "horizontal" && (this.options.tooltip_position === "left" || this.options.tooltip_position === "right")) {

				this.options.tooltip_position	= "top";

			}

			function getDataAttrib(element, optName) {
				var dataName = "data-slider-" + optName.replace(/_/g, '-');
				var dataValString = element.getAttribute(dataName);

				try {
					return JSON.parse(dataValString);
				}
				catch(err) {
					return dataValString;
				}
			}

			/*************************************************

							Create Markup

			**************************************************/

			var origWidth = this.element.style.width;
			var updateSlider = false;
			var parent = this.element.parentNode;
			var sliderTrackSelection;
			var sliderTrackLow, sliderTrackHigh;
			var sliderMinHandle;
			var sliderMaxHandle;

			if (this.sliderElem) {
				updateSlider = true;
			} else {
				/* Create elements needed for slider */
				this.sliderElem = document.createElement("div");
				this.sliderElem.className = "slider";

				/* Create slider track elements */
				var sliderTrack = document.createElement("div");
				sliderTrack.className = "slider-track";

				sliderTrackLow = document.createElement("div");
				sliderTrackLow.className = "slider-track-low";

				sliderTrackSelection = document.createElement("div");
				sliderTrackSelection.className = "slider-selection";

				sliderTrackHigh = document.createElement("div");
				sliderTrackHigh.className = "slider-track-high";

				sliderMinHandle = document.createElement("div");
				sliderMinHandle.className = "slider-handle min-slider-handle";
				sliderMinHandle.setAttribute('role', 'slider');
				sliderMinHandle.setAttribute('aria-valuemin', this.options.min);
				sliderMinHandle.setAttribute('aria-valuemax', this.options.max);

				sliderMaxHandle = document.createElement("div");
				sliderMaxHandle.className = "slider-handle max-slider-handle";
				sliderMaxHandle.setAttribute('role', 'slider');
				sliderMaxHandle.setAttribute('aria-valuemin', this.options.min);
				sliderMaxHandle.setAttribute('aria-valuemax', this.options.max);

				sliderTrack.appendChild(sliderTrackLow);
				sliderTrack.appendChild(sliderTrackSelection);
				sliderTrack.appendChild(sliderTrackHigh);

				/* Add aria-labelledby to handle's */
				var isLabelledbyArray = Array.isArray(this.options.labelledby);
				if (isLabelledbyArray && this.options.labelledby[0]) {
					sliderMinHandle.setAttribute('aria-labelledby', this.options.labelledby[0]);
				}
				if (isLabelledbyArray && this.options.labelledby[1]) {
					sliderMaxHandle.setAttribute('aria-labelledby', this.options.labelledby[1]);
				}
				if (!isLabelledbyArray && this.options.labelledby) {
					sliderMinHandle.setAttribute('aria-labelledby', this.options.labelledby);
					sliderMaxHandle.setAttribute('aria-labelledby', this.options.labelledby);
				}

				/* Create ticks */
				this.ticks = [];
				if (Array.isArray(this.options.ticks) && this.options.ticks.length > 0) {
					for (i = 0; i < this.options.ticks.length; i++) {
						var tick = document.createElement('div');
						tick.className = 'slider-tick';

						this.ticks.push(tick);
						sliderTrack.appendChild(tick);
					}

					sliderTrackSelection.className += " tick-slider-selection";
				}

				sliderTrack.appendChild(sliderMinHandle);
				sliderTrack.appendChild(sliderMaxHandle);

				this.tickLabels = [];
				if (Array.isArray(this.options.ticks_labels) && this.options.ticks_labels.length > 0) {
					this.tickLabelContainer = document.createElement('div');
					this.tickLabelContainer.className = 'slider-tick-label-container';

					for (i = 0; i < this.options.ticks_labels.length; i++) {
						var label = document.createElement('div');
						var noTickPositionsSpecified = this.options.ticks_positions.length === 0;
						var tickLabelsIndex = (this.options.reversed && noTickPositionsSpecified) ? (this.options.ticks_labels.length - (i + 1)) : i;
						label.className = 'slider-tick-label';
						label.innerHTML = this.options.ticks_labels[tickLabelsIndex];

						this.tickLabels.push(label);
						this.tickLabelContainer.appendChild(label);
					}
				}


				var createAndAppendTooltipSubElements = function(tooltipElem) {
					var arrow = document.createElement("div");
					arrow.className = "tooltip-arrow";

					var inner = document.createElement("div");
					inner.className = "tooltip-inner";

					tooltipElem.appendChild(arrow);
					tooltipElem.appendChild(inner);

				};

				/* Create tooltip elements */
				var sliderTooltip = document.createElement("div");
				sliderTooltip.className = "tooltip tooltip-main";
				sliderTooltip.setAttribute('role', 'presentation');
				createAndAppendTooltipSubElements(sliderTooltip);

				var sliderTooltipMin = document.createElement("div");
				sliderTooltipMin.className = "tooltip tooltip-min";
				sliderTooltipMin.setAttribute('role', 'presentation');
				createAndAppendTooltipSubElements(sliderTooltipMin);

				var sliderTooltipMax = document.createElement("div");
				sliderTooltipMax.className = "tooltip tooltip-max";
				sliderTooltipMax.setAttribute('role', 'presentation');
				createAndAppendTooltipSubElements(sliderTooltipMax);


				/* Append components to sliderElem */
				this.sliderElem.appendChild(sliderTrack);
				this.sliderElem.appendChild(sliderTooltip);
				this.sliderElem.appendChild(sliderTooltipMin);
				this.sliderElem.appendChild(sliderTooltipMax);

				if (this.tickLabelContainer) {
					this.sliderElem.appendChild(this.tickLabelContainer);
				}

				/* Append slider element to parent container, right before the original <input> element */
				parent.insertBefore(this.sliderElem, this.element);

				/* Hide original <input> element */
				this.element.style.display = "none";
			}
			/* If JQuery exists, cache JQ references */
			if($) {
				this.$element = $(this.element);
				this.$sliderElem = $(this.sliderElem);
			}

			/*************************************************

								Setup

			**************************************************/
			this.eventToCallbackMap = {};
			this.sliderElem.id = this.options.id;

			this.touchCapable = 'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch);

			this.tooltip = this.sliderElem.querySelector('.tooltip-main');
			this.tooltipInner = this.tooltip.querySelector('.tooltip-inner');

			this.tooltip_min = this.sliderElem.querySelector('.tooltip-min');
			this.tooltipInner_min = this.tooltip_min.querySelector('.tooltip-inner');

			this.tooltip_max = this.sliderElem.querySelector('.tooltip-max');
			this.tooltipInner_max= this.tooltip_max.querySelector('.tooltip-inner');

			if (SliderScale[this.options.scale]) {
				this.options.scale = SliderScale[this.options.scale];
			}

			if (updateSlider === true) {
				// Reset classes
				this._removeClass(this.sliderElem, 'slider-horizontal');
				this._removeClass(this.sliderElem, 'slider-vertical');
				this._removeClass(this.tooltip, 'hide');
				this._removeClass(this.tooltip_min, 'hide');
				this._removeClass(this.tooltip_max, 'hide');

				// Undo existing inline styles for track
				["left", "top", "width", "height"].forEach(function(prop) {
					this._removeProperty(this.trackLow, prop);
					this._removeProperty(this.trackSelection, prop);
					this._removeProperty(this.trackHigh, prop);
				}, this);

				// Undo inline styles on handles
				[this.handle1, this.handle2].forEach(function(handle) {
					this._removeProperty(handle, 'left');
					this._removeProperty(handle, 'top');
				}, this);

				// Undo inline styles and classes on tooltips
				[this.tooltip, this.tooltip_min, this.tooltip_max].forEach(function(tooltip) {
					this._removeProperty(tooltip, 'left');
					this._removeProperty(tooltip, 'top');
					this._removeProperty(tooltip, 'margin-left');
					this._removeProperty(tooltip, 'margin-top');

					this._removeClass(tooltip, 'right');
					this._removeClass(tooltip, 'top');
				}, this);
			}

			if(this.options.orientation === 'vertical') {
				this._addClass(this.sliderElem,'slider-vertical');
				this.stylePos = 'top';
				this.mousePos = 'pageY';
				this.sizePos = 'offsetHeight';
			} else {
				this._addClass(this.sliderElem, 'slider-horizontal');
				this.sliderElem.style.width = origWidth;
				this.options.orientation = 'horizontal';
				this.stylePos = 'left';
				this.mousePos = 'pageX';
				this.sizePos = 'offsetWidth';

			}
			this._setTooltipPosition();
			/* In case ticks are specified, overwrite the min and max bounds */
			if (Array.isArray(this.options.ticks) && this.options.ticks.length > 0) {
					this.options.max = Math.max.apply(Math, this.options.ticks);
					this.options.min = Math.min.apply(Math, this.options.ticks);
			}

			if (Array.isArray(this.options.value)) {
				this.options.range = true;
				this._state.value = this.options.value;
			}
			else if (this.options.range) {
				// User wants a range, but value is not an array
				this._state.value = [this.options.value, this.options.max];
			}
			else {
				this._state.value = this.options.value;
			}

			this.trackLow = sliderTrackLow || this.trackLow;
			this.trackSelection = sliderTrackSelection || this.trackSelection;
			this.trackHigh = sliderTrackHigh || this.trackHigh;

			if (this.options.selection === 'none') {
				this._addClass(this.trackLow, 'hide');
				this._addClass(this.trackSelection, 'hide');
				this._addClass(this.trackHigh, 'hide');
			}

			this.handle1 = sliderMinHandle || this.handle1;
			this.handle2 = sliderMaxHandle || this.handle2;

			if (updateSlider === true) {
				// Reset classes
				this._removeClass(this.handle1, 'round triangle');
				this._removeClass(this.handle2, 'round triangle hide');

				for (i = 0; i < this.ticks.length; i++) {
					this._removeClass(this.ticks[i], 'round triangle hide');
				}
			}

			var availableHandleModifiers = ['round', 'triangle', 'custom'];
			var isValidHandleType = availableHandleModifiers.indexOf(this.options.handle) !== -1;
			if (isValidHandleType) {
				this._addClass(this.handle1, this.options.handle);
				this._addClass(this.handle2, this.options.handle);

				for (i = 0; i < this.ticks.length; i++) {
					this._addClass(this.ticks[i], this.options.handle);
				}
			}

			this._state.offset = this._offset(this.sliderElem);
			this._state.size = this.sliderElem[this.sizePos];
			this.setValue(this._state.value);

			/******************************************

						Bind Event Listeners

			******************************************/

			// Bind keyboard handlers
			this.handle1Keydown = this._keydown.bind(this, 0);
			this.handle1.addEventListener("keydown", this.handle1Keydown, false);

			this.handle2Keydown = this._keydown.bind(this, 1);
			this.handle2.addEventListener("keydown", this.handle2Keydown, false);

			this.mousedown = this._mousedown.bind(this);
			if (this.touchCapable) {
				// Bind touch handlers
				this.sliderElem.addEventListener("touchstart", this.mousedown, false);
			}
			this.sliderElem.addEventListener("mousedown", this.mousedown, false);


			// Bind tooltip-related handlers
			if(this.options.tooltip === 'hide') {
				this._addClass(this.tooltip, 'hide');
				this._addClass(this.tooltip_min, 'hide');
				this._addClass(this.tooltip_max, 'hide');
			}
			else if(this.options.tooltip === 'always') {
				this._showTooltip();
				this._alwaysShowTooltip = true;
			}
			else {
				this.showTooltip = this._showTooltip.bind(this);
				this.hideTooltip = this._hideTooltip.bind(this);

				this.sliderElem.addEventListener("mouseenter", this.showTooltip, false);
				this.sliderElem.addEventListener("mouseleave", this.hideTooltip, false);

				this.handle1.addEventListener("focus", this.showTooltip, false);
				this.handle1.addEventListener("blur", this.hideTooltip, false);

				this.handle2.addEventListener("focus", this.showTooltip, false);
				this.handle2.addEventListener("blur", this.hideTooltip, false);
			}

			if(this.options.enabled) {
				this.enable();
			} else {
				this.disable();
			}
		}



		/*************************************************

					INSTANCE PROPERTIES/METHODS

		- Any methods bound to the prototype are considered
		part of the plugin's `public` interface

		**************************************************/
		Slider.prototype = {
			_init: function() {}, // NOTE: Must exist to support bridget

			constructor: Slider,

			defaultOptions: {
				id: "",
			  min: 0,
				max: 10,
				step: 1,
				precision: 0,
				orientation: 'horizontal',
				value: 5,
				range: false,
				selection: 'before',
				tooltip: 'show',
				tooltip_split: false,
				handle: 'round',
				reversed: false,
				enabled: true,
				formatter: function(val) {
					if (Array.isArray(val)) {
						return val[0] + " : " + val[1];
					} else {
						return val;
					}
				},
				natural_arrow_keys: false,
				ticks: [],
				ticks_positions: [],
				ticks_labels: [],
				ticks_snap_bounds: 0,
				scale: 'linear',
				focus: false,
				tooltip_position: null,
				labelledby: null
			},

			getElement: function() {
				return this.sliderElem;
			},

			getValue: function() {
				if (this.options.range) {
					return this._state.value;
				}
				else {
					return this._state.value[0];
				}
			},

			setValue: function(val, triggerSlideEvent, triggerChangeEvent) {
				if (!val) {
					val = 0;
				}
				var oldValue = this.getValue();
				this._state.value = this._validateInputValue(val);
				var applyPrecision = this._applyPrecision.bind(this);

				if (this.options.range) {
					this._state.value[0] = applyPrecision(this._state.value[0]);
					this._state.value[1] = applyPrecision(this._state.value[1]);

					this._state.value[0] = Math.max(this.options.min, Math.min(this.options.max, this._state.value[0]));
					this._state.value[1] = Math.max(this.options.min, Math.min(this.options.max, this._state.value[1]));
				}
				else {
					this._state.value = applyPrecision(this._state.value);
					this._state.value = [ Math.max(this.options.min, Math.min(this.options.max, this._state.value))];
					this._addClass(this.handle2, 'hide');
					if (this.options.selection === 'after') {
						this._state.value[1] = this.options.max;
					} else {
						this._state.value[1] = this.options.min;
					}
				}

				if (this.options.max > this.options.min) {
					this._state.percentage = [
						this._toPercentage(this._state.value[0]),
						this._toPercentage(this._state.value[1]),
						this.options.step * 100 / (this.options.max - this.options.min)
					];
				} else {
					this._state.percentage = [0, 0, 100];
				}

				this._layout();
				var newValue = this.options.range ? this._state.value : this._state.value[0];

				if(triggerSlideEvent === true) {
					this._trigger('slide', newValue);
				}
				if( (oldValue !== newValue) && (triggerChangeEvent === true) ) {
					this._trigger('change', {
						oldValue: oldValue,
						newValue: newValue
					});
				}
				this._setDataVal(newValue);

				return this;
			},

			destroy: function(){
				// Remove event handlers on slider elements
				this._removeSliderEventHandlers();

				// Remove the slider from the DOM
				this.sliderElem.parentNode.removeChild(this.sliderElem);
				/* Show original <input> element */
				this.element.style.display = "";

				// Clear out custom event bindings
				this._cleanUpEventCallbacksMap();

				// Remove data values
				this.element.removeAttribute("data");

				// Remove JQuery handlers/data
				if($) {
					this._unbindJQueryEventHandlers();
					this.$element.removeData('slider');
				}
			},

			disable: function() {
				this._state.enabled = false;
				this.handle1.removeAttribute("tabindex");
				this.handle2.removeAttribute("tabindex");
				this._addClass(this.sliderElem, 'slider-disabled');
				this._trigger('slideDisabled');

				return this;
			},

			enable: function() {
				this._state.enabled = true;
				this.handle1.setAttribute("tabindex", 0);
				this.handle2.setAttribute("tabindex", 0);
				this._removeClass(this.sliderElem, 'slider-disabled');
				this._trigger('slideEnabled');

				return this;
			},

			toggle: function() {
				if(this._state.enabled) {
					this.disable();
				} else {
					this.enable();
				}
				return this;
			},

			isEnabled: function() {
				return this._state.enabled;
			},

			on: function(evt, callback) {
				this._bindNonQueryEventHandler(evt, callback);
				return this;
			},

      off: function(evt, callback) {
          if($) {
              this.$element.off(evt, callback);
              this.$sliderElem.off(evt, callback);
          } else {
              this._unbindNonQueryEventHandler(evt, callback);
          }
      },

			getAttribute: function(attribute) {
				if(attribute) {
					return this.options[attribute];
				} else {
					return this.options;
				}
			},

			setAttribute: function(attribute, value) {
				this.options[attribute] = value;
				return this;
			},

			refresh: function() {
				this._removeSliderEventHandlers();
				createNewSlider.call(this, this.element, this.options);
				if($) {
					// Bind new instance of slider to the element
					$.data(this.element, 'slider', this);
				}
				return this;
			},

			relayout: function() {
				this._layout();
				return this;
			},

			/******************************+

						HELPERS

			- Any method that is not part of the public interface.
			- Place it underneath this comment block and write its signature like so:

			  					_fnName : function() {...}

			********************************/
			_removeSliderEventHandlers: function() {
				// Remove keydown event listeners
				this.handle1.removeEventListener("keydown", this.handle1Keydown, false);
				this.handle2.removeEventListener("keydown", this.handle2Keydown, false);

				if (this.showTooltip) {
					this.handle1.removeEventListener("focus", this.showTooltip, false);
					this.handle2.removeEventListener("focus", this.showTooltip, false);
				}
				if (this.hideTooltip) {
					this.handle1.removeEventListener("blur", this.hideTooltip, false);
					this.handle2.removeEventListener("blur", this.hideTooltip, false);
				}

				// Remove event listeners from sliderElem
				if (this.showTooltip) {
					this.sliderElem.removeEventListener("mouseenter", this.showTooltip, false);
				}
				if (this.hideTooltip) {
					this.sliderElem.removeEventListener("mouseleave", this.hideTooltip, false);
				}
				this.sliderElem.removeEventListener("touchstart", this.mousedown, false);
				this.sliderElem.removeEventListener("mousedown", this.mousedown, false);
			},
			_bindNonQueryEventHandler: function(evt, callback) {
				if(this.eventToCallbackMap[evt] === undefined) {
					this.eventToCallbackMap[evt] = [];
				}
				this.eventToCallbackMap[evt].push(callback);
			},
      _unbindNonQueryEventHandler: function(evt, callback) {
          var callbacks = this.eventToCallbackMap[evt];
          if(callbacks !== undefined) {
              for (var i = 0; i < callbacks.length; i++) {
                  if (callbacks[i] === callback) {
                      callbacks.splice(i, 1);
                      break;
                  }
              }
          }
      },
			_cleanUpEventCallbacksMap: function() {
				var eventNames = Object.keys(this.eventToCallbackMap);
				for(var i = 0; i < eventNames.length; i++) {
					var eventName = eventNames[i];
					this.eventToCallbackMap[eventName] = null;
				}
			},
			_showTooltip: function() {
				if (this.options.tooltip_split === false ){
        	this._addClass(this.tooltip, 'in');
        	this.tooltip_min.style.display = 'none';
        	this.tooltip_max.style.display = 'none';
		    } else {
          this._addClass(this.tooltip_min, 'in');
          this._addClass(this.tooltip_max, 'in');
          this.tooltip.style.display = 'none';
		    }
				this._state.over = true;
			},
			_hideTooltip: function() {
				if (this._state.inDrag === false && this.alwaysShowTooltip !== true) {
					this._removeClass(this.tooltip, 'in');
					this._removeClass(this.tooltip_min, 'in');
					this._removeClass(this.tooltip_max, 'in');
				}
				this._state.over = false;
			},
			_layout: function() {
				var positionPercentages;

				if(this.options.reversed) {
					positionPercentages = [ 100 - this._state.percentage[0], this.options.range ? 100 - this._state.percentage[1] : this._state.percentage[1]];
				}
				else {
					positionPercentages = [ this._state.percentage[0], this._state.percentage[1] ];
				}

				this.handle1.style[this.stylePos] = positionPercentages[0]+'%';
				this.handle1.setAttribute('aria-valuenow', this._state.value[0]);

				this.handle2.style[this.stylePos] = positionPercentages[1]+'%';
				this.handle2.setAttribute('aria-valuenow', this._state.value[1]);

				/* Position ticks and labels */
				if (Array.isArray(this.options.ticks) && this.options.ticks.length > 0) {

					var styleSize = this.options.orientation === 'vertical' ? 'height' : 'width';
					var styleMargin = this.options.orientation === 'vertical' ? 'marginTop' : 'marginLeft';
					var labelSize = this._state.size / (this.options.ticks.length - 1);

					if (this.tickLabelContainer) {
						var extraMargin = 0;
						if (this.options.ticks_positions.length === 0) {
							if (this.options.orientation !== 'vertical') {
								this.tickLabelContainer.style[styleMargin] = -labelSize/2 + 'px';
							}

							extraMargin = this.tickLabelContainer.offsetHeight;
						} else {
							/* Chidren are position absolute, calculate height by finding the max offsetHeight of a child */
							for (i = 0 ; i < this.tickLabelContainer.childNodes.length; i++) {
								if (this.tickLabelContainer.childNodes[i].offsetHeight > extraMargin) {
									extraMargin = this.tickLabelContainer.childNodes[i].offsetHeight;
								}
							}
						}
						if (this.options.orientation === 'horizontal') {
							this.sliderElem.style.marginBottom = extraMargin + 'px';
						}
					}
					for (var i = 0; i < this.options.ticks.length; i++) {

						var percentage = this.options.ticks_positions[i] || this._toPercentage(this.options.ticks[i]);

						if (this.options.reversed) {
							percentage = 100 - percentage;
						}

						this.ticks[i].style[this.stylePos] = percentage + '%';

						/* Set class labels to denote whether ticks are in the selection */
						this._removeClass(this.ticks[i], 'in-selection');
						if (!this.options.range) {
							if (this.options.selection === 'after' && percentage >= positionPercentages[0]){
								this._addClass(this.ticks[i], 'in-selection');
							} else if (this.options.selection === 'before' && percentage <= positionPercentages[0]) {
								this._addClass(this.ticks[i], 'in-selection');
							}
						} else if (percentage >= positionPercentages[0] && percentage <= positionPercentages[1]) {
							this._addClass(this.ticks[i], 'in-selection');
						}

						if (this.tickLabels[i]) {
							this.tickLabels[i].style[styleSize] = labelSize + 'px';

							if (this.options.orientation !== 'vertical' && this.options.ticks_positions[i] !== undefined) {
								this.tickLabels[i].style.position = 'absolute';
								this.tickLabels[i].style[this.stylePos] = percentage + '%';
								this.tickLabels[i].style[styleMargin] = -labelSize/2 + 'px';
							} else if (this.options.orientation === 'vertical') {
								this.tickLabels[i].style['marginLeft'] =  this.sliderElem.offsetWidth + 'px';
								this.tickLabelContainer.style['marginTop'] = this.sliderElem.offsetWidth / 2 * -1 + 'px';
							}
						}
					}
				}

				var formattedTooltipVal;

				if (this.options.range) {
					formattedTooltipVal = this.options.formatter(this._state.value);
					this._setText(this.tooltipInner, formattedTooltipVal);
					this.tooltip.style[this.stylePos] = (positionPercentages[1] + positionPercentages[0])/2 + '%';

					if (this.options.orientation === 'vertical') {
						this._css(this.tooltip, 'margin-top', -this.tooltip.offsetHeight / 2 + 'px');
					} else {
						this._css(this.tooltip, 'margin-left', -this.tooltip.offsetWidth / 2 + 'px');
					}

					if (this.options.orientation === 'vertical') {
						this._css(this.tooltip, 'margin-top', -this.tooltip.offsetHeight / 2 + 'px');
					} else {
						this._css(this.tooltip, 'margin-left', -this.tooltip.offsetWidth / 2 + 'px');
					}

					var innerTooltipMinText = this.options.formatter(this._state.value[0]);
					this._setText(this.tooltipInner_min, innerTooltipMinText);

					var innerTooltipMaxText = this.options.formatter(this._state.value[1]);
					this._setText(this.tooltipInner_max, innerTooltipMaxText);

					this.tooltip_min.style[this.stylePos] = positionPercentages[0] + '%';

					if (this.options.orientation === 'vertical') {
						this._css(this.tooltip_min, 'margin-top', -this.tooltip_min.offsetHeight / 2 + 'px');
					} else {
						this._css(this.tooltip_min, 'margin-left', -this.tooltip_min.offsetWidth / 2 + 'px');
					}

					this.tooltip_max.style[this.stylePos] = positionPercentages[1] + '%';

					if (this.options.orientation === 'vertical') {
						this._css(this.tooltip_max, 'margin-top', -this.tooltip_max.offsetHeight / 2 + 'px');
					} else {
						this._css(this.tooltip_max, 'margin-left', -this.tooltip_max.offsetWidth / 2 + 'px');
					}
				} else {
					formattedTooltipVal = this.options.formatter(this._state.value[0]);
					this._setText(this.tooltipInner, formattedTooltipVal);

					this.tooltip.style[this.stylePos] = positionPercentages[0] + '%';
					if (this.options.orientation === 'vertical') {
						this._css(this.tooltip, 'margin-top', -this.tooltip.offsetHeight / 2 + 'px');
					} else {
						this._css(this.tooltip, 'margin-left', -this.tooltip.offsetWidth / 2 + 'px');
					}
				}

				if (this.options.orientation === 'vertical') {
					this.trackLow.style.top = '0';
					this.trackLow.style.height = Math.min(positionPercentages[0], positionPercentages[1]) +'%';

					this.trackSelection.style.top = Math.min(positionPercentages[0], positionPercentages[1]) +'%';
					this.trackSelection.style.height = Math.abs(positionPercentages[0] - positionPercentages[1]) +'%';

					this.trackHigh.style.bottom = '0';
					this.trackHigh.style.height = (100 - Math.min(positionPercentages[0], positionPercentages[1]) - Math.abs(positionPercentages[0] - positionPercentages[1])) +'%';
				}
				else {
					this.trackLow.style.left = '0';
					this.trackLow.style.width = Math.min(positionPercentages[0], positionPercentages[1]) +'%';

					this.trackSelection.style.left = Math.min(positionPercentages[0], positionPercentages[1]) +'%';
					this.trackSelection.style.width = Math.abs(positionPercentages[0] - positionPercentages[1]) +'%';

					this.trackHigh.style.right = '0';
					this.trackHigh.style.width = (100 - Math.min(positionPercentages[0], positionPercentages[1]) - Math.abs(positionPercentages[0] - positionPercentages[1])) +'%';

			        var offset_min = this.tooltip_min.getBoundingClientRect();
			        var offset_max = this.tooltip_max.getBoundingClientRect();

			        if (offset_min.right > offset_max.left) {
			            this._removeClass(this.tooltip_max, 'top');
			            this._addClass(this.tooltip_max, 'bottom');
			            this.tooltip_max.style.top = 18 + 'px';
			        } else {
			            this._removeClass(this.tooltip_max, 'bottom');
			            this._addClass(this.tooltip_max, 'top');
			            this.tooltip_max.style.top = this.tooltip_min.style.top;
			        }
				}
			},
			_removeProperty: function(element, prop) {
				if (element.style.removeProperty) {
				    element.style.removeProperty(prop);
				} else {
				    element.style.removeAttribute(prop);
				}
			},
			_mousedown: function(ev) {
				if(!this._state.enabled) {
					return false;
				}

				this._state.offset = this._offset(this.sliderElem);
				this._state.size = this.sliderElem[this.sizePos];

				var percentage = this._getPercentage(ev);

				if (this.options.range) {
					var diff1 = Math.abs(this._state.percentage[0] - percentage);
					var diff2 = Math.abs(this._state.percentage[1] - percentage);
					this._state.dragged = (diff1 < diff2) ? 0 : 1;
				} else {
					this._state.dragged = 0;
				}

				this._state.percentage[this._state.dragged] = percentage;
				this._layout();

				if (this.touchCapable) {
					document.removeEventListener("touchmove", this.mousemove, false);
					document.removeEventListener("touchend", this.mouseup, false);
				}

				if(this.mousemove){
					document.removeEventListener("mousemove", this.mousemove, false);
				}
				if(this.mouseup){
					document.removeEventListener("mouseup", this.mouseup, false);
				}

				this.mousemove = this._mousemove.bind(this);
				this.mouseup = this._mouseup.bind(this);

				if (this.touchCapable) {
					// Touch: Bind touch events:
					document.addEventListener("touchmove", this.mousemove, false);
					document.addEventListener("touchend", this.mouseup, false);
				}
				// Bind mouse events:
				document.addEventListener("mousemove", this.mousemove, false);
				document.addEventListener("mouseup", this.mouseup, false);

				this._state.inDrag = true;
				var newValue = this._calculateValue();

				this._trigger('slideStart', newValue);

				this._setDataVal(newValue);
				this.setValue(newValue, false, true);

				this._pauseEvent(ev);

				if (this.options.focus) {
					this._triggerFocusOnHandle(this._state.dragged);
				}

				return true;
			},
			_triggerFocusOnHandle: function(handleIdx) {
				if(handleIdx === 0) {
					this.handle1.focus();
				}
				if(handleIdx === 1) {
					this.handle2.focus();
				}
			},
			_keydown: function(handleIdx, ev) {
				if(!this._state.enabled) {
					return false;
				}

				var dir;
				switch (ev.keyCode) {
					case 37: // left
					case 40: // down
						dir = -1;
						break;
					case 39: // right
					case 38: // up
						dir = 1;
						break;
				}
				if (!dir) {
					return;
				}

				// use natural arrow keys instead of from min to max
				if (this.options.natural_arrow_keys) {
					var ifVerticalAndNotReversed = (this.options.orientation === 'vertical' && !this.options.reversed);
					var ifHorizontalAndReversed = (this.options.orientation === 'horizontal' && this.options.reversed);

					if (ifVerticalAndNotReversed || ifHorizontalAndReversed) {
						dir = -dir;
					}
				}

				var val = this._state.value[handleIdx] + dir * this.options.step;
				if (this.options.range) {
					val = [ (!handleIdx) ? val : this._state.value[0],
						    ( handleIdx) ? val : this._state.value[1]];
				}

				this._trigger('slideStart', val);
				this._setDataVal(val);
				this.setValue(val, true, true);

				this._setDataVal(val);
				this._trigger('slideStop', val);
				this._layout();

				this._pauseEvent(ev);

				return false;
			},
			_pauseEvent: function(ev) {
				if(ev.stopPropagation) {
					ev.stopPropagation();
				}
			    if(ev.preventDefault) {
			    	ev.preventDefault();
			    }
			    ev.cancelBubble=true;
			    ev.returnValue=false;
			},
			_mousemove: function(ev) {
				if(!this._state.enabled) {
					return false;
				}

				var percentage = this._getPercentage(ev);
				this._adjustPercentageForRangeSliders(percentage);
				this._state.percentage[this._state.dragged] = percentage;
				this._layout();

				var val = this._calculateValue(true);
				this.setValue(val, true, true);

				return false;
			},
			_adjustPercentageForRangeSliders: function(percentage) {
				if (this.options.range) {
					var precision = this._getNumDigitsAfterDecimalPlace(percentage);
					precision = precision ? precision - 1 : 0;
					var percentageWithAdjustedPrecision = this._applyToFixedAndParseFloat(percentage, precision);
					if (this._state.dragged === 0 && this._applyToFixedAndParseFloat(this._state.percentage[1], precision) < percentageWithAdjustedPrecision) {
						this._state.percentage[0] = this._state.percentage[1];
						this._state.dragged = 1;
					} else if (this._state.dragged === 1 && this._applyToFixedAndParseFloat(this._state.percentage[0], precision) > percentageWithAdjustedPrecision) {
						this._state.percentage[1] = this._state.percentage[0];
						this._state.dragged = 0;
					}
				}
			},
			_mouseup: function() {
				if(!this._state.enabled) {
					return false;
				}
				if (this.touchCapable) {
					// Touch: Unbind touch event handlers:
					document.removeEventListener("touchmove", this.mousemove, false);
					document.removeEventListener("touchend", this.mouseup, false);
				}
                // Unbind mouse event handlers:
                document.removeEventListener("mousemove", this.mousemove, false);
                document.removeEventListener("mouseup", this.mouseup, false);

				this._state.inDrag = false;
				if (this._state.over === false) {
					this._hideTooltip();
				}
				var val = this._calculateValue(true);

				this._layout();
				this._setDataVal(val);
				this._trigger('slideStop', val);

				return false;
			},
			_calculateValue: function(snapToClosestTick) {
				var val;
				if (this.options.range) {
					val = [this.options.min,this.options.max];
			        if (this._state.percentage[0] !== 0){
			            val[0] = this._toValue(this._state.percentage[0]);
			            val[0] = this._applyPrecision(val[0]);
			        }
			        if (this._state.percentage[1] !== 100){
			            val[1] = this._toValue(this._state.percentage[1]);
			            val[1] = this._applyPrecision(val[1]);
			        }
				} else {
		            val = this._toValue(this._state.percentage[0]);
					val = parseFloat(val);
					val = this._applyPrecision(val);
				}

				if (snapToClosestTick) {
					var min = [val, Infinity];
					for (var i = 0; i < this.options.ticks.length; i++) {
						var diff = Math.abs(this.options.ticks[i] - val);
						if (diff <= min[1]) {
							min = [this.options.ticks[i], diff];
						}
					}
					if (min[1] <= this.options.ticks_snap_bounds) {
						return min[0];
					}
				}

				return val;
			},
			_applyPrecision: function(val) {
				var precision = this.options.precision || this._getNumDigitsAfterDecimalPlace(this.options.step);
				return this._applyToFixedAndParseFloat(val, precision);
			},
			_getNumDigitsAfterDecimalPlace: function(num) {
				var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
				if (!match) { return 0; }
				return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
			},
			_applyToFixedAndParseFloat: function(num, toFixedInput) {
				var truncatedNum = num.toFixed(toFixedInput);
				return parseFloat(truncatedNum);
			},
			/*
				Credits to Mike Samuel for the following method!
				Source: http://stackoverflow.com/questions/10454518/javascript-how-to-retrieve-the-number-of-decimals-of-a-string-number
			*/
			_getPercentage: function(ev) {
				if (this.touchCapable && (ev.type === 'touchstart' || ev.type === 'touchmove')) {
					ev = ev.touches[0];
				}

				var eventPosition = ev[this.mousePos];
				var sliderOffset = this._state.offset[this.stylePos];
				var distanceToSlide = eventPosition - sliderOffset;
				// Calculate what percent of the length the slider handle has slid
				var percentage = (distanceToSlide / this._state.size) * 100;
				percentage = Math.round(percentage / this._state.percentage[2]) * this._state.percentage[2];
				if (this.options.reversed) {
					percentage = 100 - percentage;
				}

				// Make sure the percent is within the bounds of the slider.
				// 0% corresponds to the 'min' value of the slide
				// 100% corresponds to the 'max' value of the slide
				return Math.max(0, Math.min(100, percentage));
			},
			_validateInputValue: function(val) {
				if (typeof val === 'number') {
					return val;
				} else if (Array.isArray(val)) {
					this._validateArray(val);
					return val;
				} else {
					throw new Error( ErrorMsgs.formatInvalidInputErrorMsg(val) );
				}
			},
			_validateArray: function(val) {
				for(var i = 0; i < val.length; i++) {
					var input =  val[i];
					if (typeof input !== 'number') { throw new Error( ErrorMsgs.formatInvalidInputErrorMsg(input) ); }
				}
			},
			_setDataVal: function(val) {
				this.element.setAttribute('data-value', val);
				this.element.setAttribute('value', val);
        this.element.value = val;
			},
			_trigger: function(evt, val) {
				val = (val || val === 0) ? val : undefined;

				var callbackFnArray = this.eventToCallbackMap[evt];
				if(callbackFnArray && callbackFnArray.length) {
					for(var i = 0; i < callbackFnArray.length; i++) {
						var callbackFn = callbackFnArray[i];
						callbackFn(val);
					}
				}

				/* If JQuery exists, trigger JQuery events */
				if($) {
					this._triggerJQueryEvent(evt, val);
				}
			},
			_triggerJQueryEvent: function(evt, val) {
				var eventData = {
					type: evt,
					value: val
				};
				this.$element.trigger(eventData);
				this.$sliderElem.trigger(eventData);
			},
			_unbindJQueryEventHandlers: function() {
				this.$element.off();
				this.$sliderElem.off();
			},
			_setText: function(element, text) {
				if(typeof element.innerText !== "undefined") {
			 		element.innerText = text;
			 	} else if(typeof element.textContent !== "undefined") {
			 		element.textContent = text;
			 	}
			},
			_removeClass: function(element, classString) {
				var classes = classString.split(" ");
				var newClasses = element.className;

				for(var i = 0; i < classes.length; i++) {
					var classTag = classes[i];
					var regex = new RegExp("(?:\\s|^)" + classTag + "(?:\\s|$)");
					newClasses = newClasses.replace(regex, " ");
				}

				element.className = newClasses.trim();
			},
			_addClass: function(element, classString) {
				var classes = classString.split(" ");
				var newClasses = element.className;

				for(var i = 0; i < classes.length; i++) {
					var classTag = classes[i];
					var regex = new RegExp("(?:\\s|^)" + classTag + "(?:\\s|$)");
					var ifClassExists = regex.test(newClasses);

					if(!ifClassExists) {
						newClasses += " " + classTag;
					}
				}

				element.className = newClasses.trim();
			},
			_offsetLeft: function(obj){
				return obj.getBoundingClientRect().left;
			},
			_offsetTop: function(obj){
				var offsetTop = obj.offsetTop;
				while((obj = obj.offsetParent) && !isNaN(obj.offsetTop)){
					offsetTop += obj.offsetTop;
				}
				return offsetTop;
			},
		    _offset: function (obj) {
				return {
					left: this._offsetLeft(obj),
					top: this._offsetTop(obj)
				};
		    },
			_css: function(elementRef, styleName, value) {
                if ($) {
                    $.style(elementRef, styleName, value);
                } else {
                    var style = styleName.replace(/^-ms-/, "ms-").replace(/-([\da-z])/gi, function (all, letter) {
                        return letter.toUpperCase();
                    });
                    elementRef.style[style] = value;
                }
			},
			_toValue: function(percentage) {
				return this.options.scale.toValue.apply(this, [percentage]);
			},
			_toPercentage: function(value) {
				return this.options.scale.toPercentage.apply(this, [value]);
			},
			_setTooltipPosition: function(){
				var tooltips = [this.tooltip, this.tooltip_min, this.tooltip_max];
				if (this.options.orientation === 'vertical'){
					var tooltipPos = this.options.tooltip_position || 'right';
					var oppositeSide = (tooltipPos === 'left') ? 'right' : 'left';
					tooltips.forEach(function(tooltip){
						this._addClass(tooltip, tooltipPos);
						tooltip.style[oppositeSide] = '100%';
					}.bind(this));
				} else if(this.options.tooltip_position === 'bottom') {
					tooltips.forEach(function(tooltip){
						this._addClass(tooltip, 'bottom');
						tooltip.style.top = 22 + 'px';
					}.bind(this));
				} else {
					tooltips.forEach(function(tooltip){
						this._addClass(tooltip, 'top');
						tooltip.style.top = -this.tooltip.outerHeight - 14 + 'px';
					}.bind(this));
				}
			}
		};

		/*********************************

			Attach to global namespace

		*********************************/
		if($) {
			var namespace = $.fn.slider ? 'bootstrapSlider' : 'slider';
			$.bridget(namespace, Slider);
		}

	})( $ );

	return Slider;
}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJvb3RzdHJhcC1zbGlkZXIuanMiXSwibmFtZXMiOlsicm9vdCIsImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJtb2R1bGUiLCJleHBvcnRzIiwialF1ZXJ5IiwicmVxdWlyZSIsImVyciIsIlNsaWRlciIsInRoaXMiLCIkIiwibm9vcCIsImRlZmluZUJyaWRnZXQiLCJhZGRPcHRpb25NZXRob2QiLCJQbHVnaW5DbGFzcyIsInByb3RvdHlwZSIsIm9wdGlvbiIsIm9wdHMiLCJpc1BsYWluT2JqZWN0Iiwib3B0aW9ucyIsImV4dGVuZCIsImJyaWRnZSIsIm5hbWVzcGFjZSIsImZuIiwiYXJncyIsInNsaWNlIiwiY2FsbCIsImFyZ3VtZW50cyIsImkiLCJsZW4iLCJsZW5ndGgiLCJlbGVtIiwiaW5zdGFuY2UiLCJkYXRhIiwiaXNGdW5jdGlvbiIsImNoYXJBdCIsInJldHVyblZhbHVlIiwiYXBwbHkiLCJ1bmRlZmluZWQiLCJsb2dFcnJvciIsIm9iamVjdHMiLCJtYXAiLCJfaW5pdCIsImNvbnNvbGUiLCJtZXNzYWdlIiwiZXJyb3IiLCJicmlkZ2V0IiwiQXJyYXkiLCJjcmVhdGVOZXdTbGlkZXIiLCJlbGVtZW50IiwiZ2V0RGF0YUF0dHJpYiIsIm9wdE5hbWUiLCJkYXRhTmFtZSIsInJlcGxhY2UiLCJkYXRhVmFsU3RyaW5nIiwiZ2V0QXR0cmlidXRlIiwiSlNPTiIsInBhcnNlIiwiX3N0YXRlIiwidmFsdWUiLCJlbmFibGVkIiwib2Zmc2V0Iiwic2l6ZSIsInBlcmNlbnRhZ2UiLCJpbkRyYWciLCJvdmVyIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yIiwiSFRNTEVsZW1lbnQiLCJvcHRpb25UeXBlcyIsIk9iamVjdCIsImtleXMiLCJkZWZhdWx0T3B0aW9ucyIsInZhbCIsIm9yaWVudGF0aW9uIiwidG9vbHRpcF9wb3NpdGlvbiIsInNsaWRlclRyYWNrU2VsZWN0aW9uIiwic2xpZGVyVHJhY2tMb3ciLCJzbGlkZXJUcmFja0hpZ2giLCJzbGlkZXJNaW5IYW5kbGUiLCJzbGlkZXJNYXhIYW5kbGUiLCJvcmlnV2lkdGgiLCJzdHlsZSIsIndpZHRoIiwidXBkYXRlU2xpZGVyIiwicGFyZW50IiwicGFyZW50Tm9kZSIsInNsaWRlckVsZW0iLCJjcmVhdGVFbGVtZW50IiwiY2xhc3NOYW1lIiwic2xpZGVyVHJhY2siLCJzZXRBdHRyaWJ1dGUiLCJtaW4iLCJtYXgiLCJhcHBlbmRDaGlsZCIsImlzTGFiZWxsZWRieUFycmF5IiwiaXNBcnJheSIsImxhYmVsbGVkYnkiLCJ0aWNrcyIsInRpY2siLCJwdXNoIiwidGlja0xhYmVscyIsInRpY2tzX2xhYmVscyIsInRpY2tMYWJlbENvbnRhaW5lciIsImxhYmVsIiwibm9UaWNrUG9zaXRpb25zU3BlY2lmaWVkIiwidGlja3NfcG9zaXRpb25zIiwidGlja0xhYmVsc0luZGV4IiwicmV2ZXJzZWQiLCJpbm5lckhUTUwiLCJjcmVhdGVBbmRBcHBlbmRUb29sdGlwU3ViRWxlbWVudHMiLCJ0b29sdGlwRWxlbSIsImFycm93IiwiaW5uZXIiLCJzbGlkZXJUb29sdGlwIiwic2xpZGVyVG9vbHRpcE1pbiIsInNsaWRlclRvb2x0aXBNYXgiLCJpbnNlcnRCZWZvcmUiLCJkaXNwbGF5IiwiJGVsZW1lbnQiLCIkc2xpZGVyRWxlbSIsImV2ZW50VG9DYWxsYmFja01hcCIsImlkIiwidG91Y2hDYXBhYmxlIiwid2luZG93IiwiRG9jdW1lbnRUb3VjaCIsInRvb2x0aXAiLCJ0b29sdGlwSW5uZXIiLCJ0b29sdGlwX21pbiIsInRvb2x0aXBJbm5lcl9taW4iLCJ0b29sdGlwX21heCIsInRvb2x0aXBJbm5lcl9tYXgiLCJTbGlkZXJTY2FsZSIsInNjYWxlIiwiX3JlbW92ZUNsYXNzIiwiZm9yRWFjaCIsInByb3AiLCJfcmVtb3ZlUHJvcGVydHkiLCJ0cmFja0xvdyIsInRyYWNrU2VsZWN0aW9uIiwidHJhY2tIaWdoIiwiaGFuZGxlMSIsImhhbmRsZTIiLCJoYW5kbGUiLCJfYWRkQ2xhc3MiLCJzdHlsZVBvcyIsIm1vdXNlUG9zIiwic2l6ZVBvcyIsIl9zZXRUb29sdGlwUG9zaXRpb24iLCJNYXRoIiwicmFuZ2UiLCJzZWxlY3Rpb24iLCJhdmFpbGFibGVIYW5kbGVNb2RpZmllcnMiLCJpc1ZhbGlkSGFuZGxlVHlwZSIsImluZGV4T2YiLCJfb2Zmc2V0Iiwic2V0VmFsdWUiLCJoYW5kbGUxS2V5ZG93biIsIl9rZXlkb3duIiwiYmluZCIsImFkZEV2ZW50TGlzdGVuZXIiLCJoYW5kbGUyS2V5ZG93biIsIm1vdXNlZG93biIsIl9tb3VzZWRvd24iLCJfc2hvd1Rvb2x0aXAiLCJfYWx3YXlzU2hvd1Rvb2x0aXAiLCJzaG93VG9vbHRpcCIsImhpZGVUb29sdGlwIiwiX2hpZGVUb29sdGlwIiwiZW5hYmxlIiwiZGlzYWJsZSIsIkVycm9yTXNncyIsImZvcm1hdEludmFsaWRJbnB1dEVycm9yTXNnIiwiaW5wdXQiLCJjYWxsaW5nQ29udGV4dE5vdFNsaWRlckluc3RhbmNlIiwibGluZWFyIiwidG9WYWx1ZSIsInJhd1ZhbHVlIiwibWludiIsIm1heHYiLCJtaW5wIiwibWF4cCIsInBhcnRpYWxQZXJjZW50YWdlIiwicm91bmQiLCJzdGVwIiwidG9QZXJjZW50YWdlIiwibG9nYXJpdGhtaWMiLCJsb2ciLCJleHAiLCJ2IiwiY29uc3RydWN0b3IiLCJwcmVjaXNpb24iLCJ0b29sdGlwX3NwbGl0IiwiZm9ybWF0dGVyIiwibmF0dXJhbF9hcnJvd19rZXlzIiwidGlja3Nfc25hcF9ib3VuZHMiLCJmb2N1cyIsImdldEVsZW1lbnQiLCJnZXRWYWx1ZSIsInRyaWdnZXJTbGlkZUV2ZW50IiwidHJpZ2dlckNoYW5nZUV2ZW50Iiwib2xkVmFsdWUiLCJfdmFsaWRhdGVJbnB1dFZhbHVlIiwiYXBwbHlQcmVjaXNpb24iLCJfYXBwbHlQcmVjaXNpb24iLCJfdG9QZXJjZW50YWdlIiwiX2xheW91dCIsIm5ld1ZhbHVlIiwiX3RyaWdnZXIiLCJfc2V0RGF0YVZhbCIsImRlc3Ryb3kiLCJfcmVtb3ZlU2xpZGVyRXZlbnRIYW5kbGVycyIsInJlbW92ZUNoaWxkIiwiX2NsZWFuVXBFdmVudENhbGxiYWNrc01hcCIsInJlbW92ZUF0dHJpYnV0ZSIsIl91bmJpbmRKUXVlcnlFdmVudEhhbmRsZXJzIiwicmVtb3ZlRGF0YSIsInRvZ2dsZSIsImlzRW5hYmxlZCIsIm9uIiwiZXZ0IiwiY2FsbGJhY2siLCJfYmluZE5vblF1ZXJ5RXZlbnRIYW5kbGVyIiwib2ZmIiwiX3VuYmluZE5vblF1ZXJ5RXZlbnRIYW5kbGVyIiwiYXR0cmlidXRlIiwicmVmcmVzaCIsInJlbGF5b3V0IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImNhbGxiYWNrcyIsInNwbGljZSIsImV2ZW50TmFtZXMiLCJldmVudE5hbWUiLCJhbHdheXNTaG93VG9vbHRpcCIsInBvc2l0aW9uUGVyY2VudGFnZXMiLCJzdHlsZVNpemUiLCJzdHlsZU1hcmdpbiIsImxhYmVsU2l6ZSIsImV4dHJhTWFyZ2luIiwib2Zmc2V0SGVpZ2h0IiwiY2hpbGROb2RlcyIsIm1hcmdpbkJvdHRvbSIsInBvc2l0aW9uIiwib2Zmc2V0V2lkdGgiLCJmb3JtYXR0ZWRUb29sdGlwVmFsIiwiX3NldFRleHQiLCJfY3NzIiwiaW5uZXJUb29sdGlwTWluVGV4dCIsImlubmVyVG9vbHRpcE1heFRleHQiLCJ0b3AiLCJoZWlnaHQiLCJhYnMiLCJib3R0b20iLCJsZWZ0IiwicmlnaHQiLCJvZmZzZXRfbWluIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwib2Zmc2V0X21heCIsInJlbW92ZVByb3BlcnR5IiwiZXYiLCJfZ2V0UGVyY2VudGFnZSIsImRpZmYxIiwiZGlmZjIiLCJkcmFnZ2VkIiwibW91c2Vtb3ZlIiwibW91c2V1cCIsIl9tb3VzZW1vdmUiLCJfbW91c2V1cCIsIl9jYWxjdWxhdGVWYWx1ZSIsIl9wYXVzZUV2ZW50IiwiX3RyaWdnZXJGb2N1c09uSGFuZGxlIiwiaGFuZGxlSWR4IiwiZGlyIiwia2V5Q29kZSIsImlmVmVydGljYWxBbmROb3RSZXZlcnNlZCIsImlmSG9yaXpvbnRhbEFuZFJldmVyc2VkIiwic3RvcFByb3BhZ2F0aW9uIiwicHJldmVudERlZmF1bHQiLCJjYW5jZWxCdWJibGUiLCJfYWRqdXN0UGVyY2VudGFnZUZvclJhbmdlU2xpZGVycyIsIl9nZXROdW1EaWdpdHNBZnRlckRlY2ltYWxQbGFjZSIsInBlcmNlbnRhZ2VXaXRoQWRqdXN0ZWRQcmVjaXNpb24iLCJfYXBwbHlUb0ZpeGVkQW5kUGFyc2VGbG9hdCIsInNuYXBUb0Nsb3Nlc3RUaWNrIiwiX3RvVmFsdWUiLCJwYXJzZUZsb2F0IiwiSW5maW5pdHkiLCJkaWZmIiwibnVtIiwibWF0Y2giLCJ0b0ZpeGVkSW5wdXQiLCJ0cnVuY2F0ZWROdW0iLCJ0b0ZpeGVkIiwidHlwZSIsInRvdWNoZXMiLCJldmVudFBvc2l0aW9uIiwic2xpZGVyT2Zmc2V0IiwiZGlzdGFuY2VUb1NsaWRlIiwiX3ZhbGlkYXRlQXJyYXkiLCJFcnJvciIsImNhbGxiYWNrRm5BcnJheSIsImNhbGxiYWNrRm4iLCJfdHJpZ2dlckpRdWVyeUV2ZW50IiwiZXZlbnREYXRhIiwidHJpZ2dlciIsInRleHQiLCJpbm5lclRleHQiLCJ0ZXh0Q29udGVudCIsImNsYXNzU3RyaW5nIiwiY2xhc3NlcyIsInNwbGl0IiwibmV3Q2xhc3NlcyIsImNsYXNzVGFnIiwicmVnZXgiLCJSZWdFeHAiLCJ0cmltIiwiaWZDbGFzc0V4aXN0cyIsInRlc3QiLCJfb2Zmc2V0TGVmdCIsIm9iaiIsIl9vZmZzZXRUb3AiLCJvZmZzZXRUb3AiLCJvZmZzZXRQYXJlbnQiLCJpc05hTiIsImVsZW1lbnRSZWYiLCJzdHlsZU5hbWUiLCJhbGwiLCJsZXR0ZXIiLCJ0b1VwcGVyQ2FzZSIsInRvb2x0aXBzIiwidG9vbHRpcFBvcyIsIm9wcG9zaXRlU2lkZSIsIm91dGVySGVpZ2h0Iiwic2xpZGVyIl0sIm1hcHBpbmdzIjoiQ0FpQ0MsU0FBU0EsRUFBTUMsR0FDZixHQUFxQixrQkFBWEMsU0FBeUJBLE9BQU9DLElBQ3pDRCxRQUFRLFVBQVdELE9BRWYsSUFBcUIsZ0JBQVhHLFNBQXVCQSxPQUFPQyxRQUFTLENBQ3JELEdBQUlDLEVBQ0os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R0FBZ0IsUUFDN0I1SyxLQUFLdEosV0FDb0MsV0FBbENBLEtBQUtVLFFBQVF3RCxpQkFDdEI4UCxFQUFTbE0sUUFBUSxTQUFTVCxHQUN6QnJILEtBQUt1SSxVQUFVbEIsRUFBUyxVQUN4QkEsRUFBUTVDLE1BQU11SyxJQUFNLFFBQ25CMUYsS0FBS3RKLE9BRVBnVSxFQUFTbE0sUUFBUSxTQUFTVCxHQUN6QnJILEtBQUt1SSxVQUFVbEIsRUFBUyxPQUN4QkEsRUFBUTVDLE1BQU11SyxLQUFPaFAsS0FBS3FILFFBQVE4TSxZQUFjLEdBQUssTUFDcEQ3SyxLQUFLdEosU0FVUEMsRUFBRyxDQUNMLEdBQUlZLEdBQVlaLEVBQUVhLEdBQUdzVCxPQUFTLGtCQUFvQixRQUNsRG5VLEdBQUVvQyxRQUFReEIsRUFBV2QsS0FHbkJFLEdBRUdGIiwiZmlsZSI6ImJvb3RzdHJhcC1zbGlkZXItZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiEgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBib290c3RyYXAtc2xpZGVyLmpzXG4gKlxuICogTWFpbnRhaW5lcnM6XG4gKlx0XHRLeWxlIEtlbXBcbiAqXHRcdFx0LSBUd2l0dGVyOiBAc2VpeXJpYVxuICpcdFx0XHQtIEdpdGh1YjogIHNlaXlyaWFcbiAqXHRcdFJvaGl0IEthbGt1clxuICpcdFx0XHQtIFR3aXR0ZXI6IEBSb3ZvbHV0aW9uYXJ5XG4gKlx0XHRcdC0gR2l0aHViOiAgcm92b2x1dGlvblxuICpcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cblxuLyoqXG4gKiBCcmlkZ2V0IG1ha2VzIGpRdWVyeSB3aWRnZXRzXG4gKiB2MS4wLjFcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoW1wianF1ZXJ5XCJdLCBmYWN0b3J5KTtcblx0fVxuXHRlbHNlIGlmKHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHR2YXIgalF1ZXJ5O1xuXHRcdHRyeSB7XG5cdFx0XHRqUXVlcnkgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xuXHRcdH1cblx0XHRjYXRjaCAoZXJyKSB7XG5cdFx0XHRqUXVlcnkgPSBudWxsO1xuXHRcdH1cblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoalF1ZXJ5KTtcblx0fVxuXHRlbHNlIHtcblx0XHRyb290LlNsaWRlciA9IGZhY3Rvcnkocm9vdC5qUXVlcnkpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uKCQpIHtcblx0Ly8gUmVmZXJlbmNlIHRvIFNsaWRlciBjb25zdHJ1Y3RvclxuXHR2YXIgU2xpZGVyO1xuXG5cblx0KGZ1bmN0aW9uKCAkICkge1xuXG5cdFx0J3VzZSBzdHJpY3QnO1xuXG5cdFx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gdXRpbHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuXHRcdHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuXHRcdGZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5cdFx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZGVmaW5pdGlvbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5cdFx0ZnVuY3Rpb24gZGVmaW5lQnJpZGdldCggJCApIHtcblxuXHRcdFx0Ly8gYmFpbCBpZiBubyBqUXVlcnlcblx0XHRcdGlmICggISQgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYWRkT3B0aW9uTWV0aG9kIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblx0XHRcdC8qKlxuXHRcdFx0ICogYWRkcyBvcHRpb24gbWV0aG9kIC0+ICQoKS5wbHVnaW4oJ29wdGlvbicsIHsuLi59KVxuXHRcdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gUGx1Z2luQ2xhc3MgLSBjb25zdHJ1Y3RvciBjbGFzc1xuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBhZGRPcHRpb25NZXRob2QoIFBsdWdpbkNsYXNzICkge1xuXHRcdFx0XHQvLyBkb24ndCBvdmVyd3JpdGUgb3JpZ2luYWwgb3B0aW9uIG1ldGhvZFxuXHRcdFx0XHRpZiAoIFBsdWdpbkNsYXNzLnByb3RvdHlwZS5vcHRpb24gKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdCAgLy8gb3B0aW9uIHNldHRlclxuXHRcdFx0ICBQbHVnaW5DbGFzcy5wcm90b3R5cGUub3B0aW9uID0gZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0XHQgICAgLy8gYmFpbCBvdXQgaWYgbm90IGFuIG9iamVjdFxuXHRcdFx0ICAgIGlmICggISQuaXNQbGFpbk9iamVjdCggb3B0cyApICl7XG5cdFx0XHQgICAgICByZXR1cm47XG5cdFx0XHQgICAgfVxuXHRcdFx0ICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKCB0cnVlLCB0aGlzLm9wdGlvbnMsIG9wdHMgKTtcblx0XHRcdCAgfTtcblx0XHRcdH1cblxuXG5cdFx0XHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBwbHVnaW4gYnJpZGdlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblx0XHRcdC8vIGhlbHBlciBmdW5jdGlvbiBmb3IgbG9nZ2luZyBlcnJvcnNcblx0XHRcdC8vICQuZXJyb3IgYnJlYWtzIGpRdWVyeSBjaGFpbmluZ1xuXHRcdFx0dmFyIGxvZ0Vycm9yID0gdHlwZW9mIGNvbnNvbGUgPT09ICd1bmRlZmluZWQnID8gbm9vcCA6XG5cdFx0XHQgIGZ1bmN0aW9uKCBtZXNzYWdlICkge1xuXHRcdFx0ICAgIGNvbnNvbGUuZXJyb3IoIG1lc3NhZ2UgKTtcblx0XHRcdCAgfTtcblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBqUXVlcnkgcGx1Z2luIGJyaWRnZSwgYWNjZXNzIG1ldGhvZHMgbGlrZSAkZWxlbS5wbHVnaW4oJ21ldGhvZCcpXG5cdFx0XHQgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIC0gcGx1Z2luIG5hbWVcblx0XHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IFBsdWdpbkNsYXNzIC0gY29uc3RydWN0b3IgY2xhc3Ncblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gYnJpZGdlKCBuYW1lc3BhY2UsIFBsdWdpbkNsYXNzICkge1xuXHRcdFx0ICAvLyBhZGQgdG8galF1ZXJ5IGZuIG5hbWVzcGFjZVxuXHRcdFx0ICAkLmZuWyBuYW1lc3BhY2UgXSA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuXHRcdFx0ICAgIGlmICggdHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnICkge1xuXHRcdFx0ICAgICAgLy8gY2FsbCBwbHVnaW4gbWV0aG9kIHdoZW4gZmlyc3QgYXJndW1lbnQgaXMgYSBzdHJpbmdcblx0XHRcdCAgICAgIC8vIGdldCBhcmd1bWVudHMgZm9yIG1ldGhvZFxuXHRcdFx0ICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKCBhcmd1bWVudHMsIDEgKTtcblxuXHRcdFx0ICAgICAgZm9yICggdmFyIGk9MCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdCAgICAgICAgdmFyIGVsZW0gPSB0aGlzW2ldO1xuXHRcdFx0ICAgICAgICB2YXIgaW5zdGFuY2UgPSAkLmRhdGEoIGVsZW0sIG5hbWVzcGFjZSApO1xuXHRcdFx0ICAgICAgICBpZiAoICFpbnN0YW5jZSApIHtcblx0XHRcdCAgICAgICAgICBsb2dFcnJvciggXCJjYW5ub3QgY2FsbCBtZXRob2RzIG9uIFwiICsgbmFtZXNwYWNlICsgXCIgcHJpb3IgdG8gaW5pdGlhbGl6YXRpb247IFwiICtcblx0XHRcdCAgICAgICAgICAgIFwiYXR0ZW1wdGVkIHRvIGNhbGwgJ1wiICsgb3B0aW9ucyArIFwiJ1wiICk7XG5cdFx0XHQgICAgICAgICAgY29udGludWU7XG5cdFx0XHQgICAgICAgIH1cblx0XHRcdCAgICAgICAgaWYgKCAhJC5pc0Z1bmN0aW9uKCBpbnN0YW5jZVtvcHRpb25zXSApIHx8IG9wdGlvbnMuY2hhckF0KDApID09PSAnXycgKSB7XG5cdFx0XHQgICAgICAgICAgbG9nRXJyb3IoIFwibm8gc3VjaCBtZXRob2QgJ1wiICsgb3B0aW9ucyArIFwiJyBmb3IgXCIgKyBuYW1lc3BhY2UgKyBcIiBpbnN0YW5jZVwiICk7XG5cdFx0XHQgICAgICAgICAgY29udGludWU7XG5cdFx0XHQgICAgICAgIH1cblxuXHRcdFx0ICAgICAgICAvLyB0cmlnZ2VyIG1ldGhvZCB3aXRoIGFyZ3VtZW50c1xuXHRcdFx0ICAgICAgICB2YXIgcmV0dXJuVmFsdWUgPSBpbnN0YW5jZVsgb3B0aW9ucyBdLmFwcGx5KCBpbnN0YW5jZSwgYXJncyk7XG5cblx0XHRcdCAgICAgICAgLy8gYnJlYWsgbG9vayBhbmQgcmV0dXJuIGZpcnN0IHZhbHVlIGlmIHByb3ZpZGVkXG5cdFx0XHQgICAgICAgIGlmICggcmV0dXJuVmFsdWUgIT09IHVuZGVmaW5lZCAmJiByZXR1cm5WYWx1ZSAhPT0gaW5zdGFuY2UpIHtcblx0XHRcdCAgICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWU7XG5cdFx0XHQgICAgICAgIH1cblx0XHRcdCAgICAgIH1cblx0XHRcdCAgICAgIC8vIHJldHVybiB0aGlzIGlmIG5vIHJldHVybiB2YWx1ZVxuXHRcdFx0ICAgICAgcmV0dXJuIHRoaXM7XG5cdFx0XHQgICAgfSBlbHNlIHtcblx0XHRcdCAgICAgIHZhciBvYmplY3RzID0gdGhpcy5tYXAoIGZ1bmN0aW9uKCkge1xuXHRcdFx0ICAgICAgICB2YXIgaW5zdGFuY2UgPSAkLmRhdGEoIHRoaXMsIG5hbWVzcGFjZSApO1xuXHRcdFx0ICAgICAgICBpZiAoIGluc3RhbmNlICkge1xuXHRcdFx0ICAgICAgICAgIC8vIGFwcGx5IG9wdGlvbnMgJiBpbml0XG5cdFx0XHQgICAgICAgICAgaW5zdGFuY2Uub3B0aW9uKCBvcHRpb25zICk7XG5cdFx0XHQgICAgICAgICAgaW5zdGFuY2UuX2luaXQoKTtcblx0XHRcdCAgICAgICAgfSBlbHNlIHtcblx0XHRcdCAgICAgICAgICAvLyBpbml0aWFsaXplIG5ldyBpbnN0YW5jZVxuXHRcdFx0ICAgICAgICAgIGluc3RhbmNlID0gbmV3IFBsdWdpbkNsYXNzKCB0aGlzLCBvcHRpb25zICk7XG5cdFx0XHQgICAgICAgICAgJC5kYXRhKCB0aGlzLCBuYW1lc3BhY2UsIGluc3RhbmNlICk7XG5cdFx0XHQgICAgICAgIH1cblx0XHRcdCAgICAgICAgcmV0dXJuICQodGhpcyk7XG5cdFx0XHQgICAgICB9KTtcblxuXHRcdFx0ICAgICAgaWYoIW9iamVjdHMgfHwgb2JqZWN0cy5sZW5ndGggPiAxKSB7XG5cdFx0XHQgICAgICBcdHJldHVybiBvYmplY3RzO1xuXHRcdFx0ICAgICAgfSBlbHNlIHtcblx0XHRcdCAgICAgIFx0cmV0dXJuIG9iamVjdHNbMF07XG5cdFx0XHQgICAgICB9XG5cdFx0XHQgICAgfVxuXHRcdFx0ICB9O1xuXG5cdFx0XHR9XG5cblx0XHRcdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJyaWRnZXQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBjb252ZXJ0cyBhIFByb3RvdHlwaWNhbCBjbGFzcyBpbnRvIGEgcHJvcGVyIGpRdWVyeSBwbHVnaW5cblx0XHRcdCAqICAgdGhlIGNsYXNzIG11c3QgaGF2ZSBhIC5faW5pdCBtZXRob2Rcblx0XHRcdCAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2UgLSBwbHVnaW4gbmFtZSwgdXNlZCBpbiAkKCkucGx1Z2luTmFtZVxuXHRcdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gUGx1Z2luQ2xhc3MgLSBjb25zdHJ1Y3RvciBjbGFzc1xuXHRcdFx0ICovXG5cdFx0XHQkLmJyaWRnZXQgPSBmdW5jdGlvbiggbmFtZXNwYWNlLCBQbHVnaW5DbGFzcyApIHtcblx0XHRcdCAgYWRkT3B0aW9uTWV0aG9kKCBQbHVnaW5DbGFzcyApO1xuXHRcdFx0ICBicmlkZ2UoIG5hbWVzcGFjZSwgUGx1Z2luQ2xhc3MgKTtcblx0XHRcdH07XG5cblx0XHRcdHJldHVybiAkLmJyaWRnZXQ7XG5cblx0XHR9XG5cblx0ICBcdC8vIGdldCBqcXVlcnkgZnJvbSBicm93c2VyIGdsb2JhbFxuXHQgIFx0ZGVmaW5lQnJpZGdldCggJCApO1xuXG5cdH0pKCAkICk7XG5cblxuXHQvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG5cdFx0XHRCT09UU1RSQVAtU0xJREVSIFNPVVJDRSBDT0RFXG5cblx0KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0KGZ1bmN0aW9uKCQpIHtcblxuXHRcdHZhciBFcnJvck1zZ3MgPSB7XG5cdFx0XHRmb3JtYXRJbnZhbGlkSW5wdXRFcnJvck1zZyA6IGZ1bmN0aW9uKGlucHV0KSB7XG5cdFx0XHRcdHJldHVybiBcIkludmFsaWQgaW5wdXQgdmFsdWUgJ1wiICsgaW5wdXQgKyBcIicgcGFzc2VkIGluXCI7XG5cdFx0XHR9LFxuXHRcdFx0Y2FsbGluZ0NvbnRleHROb3RTbGlkZXJJbnN0YW5jZSA6IFwiQ2FsbGluZyBjb250ZXh0IGVsZW1lbnQgZG9lcyBub3QgaGF2ZSBpbnN0YW5jZSBvZiBTbGlkZXIgYm91bmQgdG8gaXQuIENoZWNrIHlvdXIgY29kZSB0byBtYWtlIHN1cmUgdGhlIEpRdWVyeSBvYmplY3QgcmV0dXJuZWQgZnJvbSB0aGUgY2FsbCB0byB0aGUgc2xpZGVyKCkgaW5pdGlhbGl6ZXIgaXMgY2FsbGluZyB0aGUgbWV0aG9kXCJcblx0XHR9O1xuXG5cdFx0dmFyIFNsaWRlclNjYWxlID0ge1xuXHRcdFx0bGluZWFyOiB7XG5cdFx0XHRcdHRvVmFsdWU6IGZ1bmN0aW9uKHBlcmNlbnRhZ2UpIHtcblx0XHRcdFx0XHR2YXIgcmF3VmFsdWUgPSBwZXJjZW50YWdlLzEwMCAqICh0aGlzLm9wdGlvbnMubWF4IC0gdGhpcy5vcHRpb25zLm1pbik7XG5cdFx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy50aWNrc19wb3NpdGlvbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdFx0dmFyIG1pbnYsIG1heHYsIG1pbnAsIG1heHAgPSAwO1xuXHRcdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMudGlja3NfcG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChwZXJjZW50YWdlIDw9IHRoaXMub3B0aW9ucy50aWNrc19wb3NpdGlvbnNbaV0pIHtcblx0XHRcdFx0XHRcdFx0XHRtaW52ID0gKGkgPiAwKSA/IHRoaXMub3B0aW9ucy50aWNrc1tpLTFdIDogMDtcblx0XHRcdFx0XHRcdFx0XHRtaW5wID0gKGkgPiAwKSA/IHRoaXMub3B0aW9ucy50aWNrc19wb3NpdGlvbnNbaS0xXSA6IDA7XG5cdFx0XHRcdFx0XHRcdFx0bWF4diA9IHRoaXMub3B0aW9ucy50aWNrc1tpXTtcblx0XHRcdFx0XHRcdFx0XHRtYXhwID0gdGhpcy5vcHRpb25zLnRpY2tzX3Bvc2l0aW9uc1tpXTtcblxuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAoaSA+IDApIHtcblx0XHRcdFx0XHRcdFx0dmFyIHBhcnRpYWxQZXJjZW50YWdlID0gKHBlcmNlbnRhZ2UgLSBtaW5wKSAvIChtYXhwIC0gbWlucCk7XG5cdFx0XHRcdFx0XHRcdHJhd1ZhbHVlID0gbWludiArIHBhcnRpYWxQZXJjZW50YWdlICogKG1heHYgLSBtaW52KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR2YXIgdmFsdWUgPSB0aGlzLm9wdGlvbnMubWluICsgTWF0aC5yb3VuZChyYXdWYWx1ZSAvIHRoaXMub3B0aW9ucy5zdGVwKSAqIHRoaXMub3B0aW9ucy5zdGVwO1xuXHRcdFx0XHRcdGlmICh2YWx1ZSA8IHRoaXMub3B0aW9ucy5taW4pIHtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLm9wdGlvbnMubWluO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAodmFsdWUgPiB0aGlzLm9wdGlvbnMubWF4KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25zLm1heDtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0dG9QZXJjZW50YWdlOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRcdGlmICh0aGlzLm9wdGlvbnMubWF4ID09PSB0aGlzLm9wdGlvbnMubWluKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLnRpY2tzX3Bvc2l0aW9ucy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHR2YXIgbWludiwgbWF4diwgbWlucCwgbWF4cCA9IDA7XG5cdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy50aWNrcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRpZiAodmFsdWUgIDw9IHRoaXMub3B0aW9ucy50aWNrc1tpXSkge1xuXHRcdFx0XHRcdFx0XHRcdG1pbnYgPSAoaSA+IDApID8gdGhpcy5vcHRpb25zLnRpY2tzW2ktMV0gOiAwO1xuXHRcdFx0XHRcdFx0XHRcdG1pbnAgPSAoaSA+IDApID8gdGhpcy5vcHRpb25zLnRpY2tzX3Bvc2l0aW9uc1tpLTFdIDogMDtcblx0XHRcdFx0XHRcdFx0XHRtYXh2ID0gdGhpcy5vcHRpb25zLnRpY2tzW2ldO1xuXHRcdFx0XHRcdFx0XHRcdG1heHAgPSB0aGlzLm9wdGlvbnMudGlja3NfcG9zaXRpb25zW2ldO1xuXG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGlmIChpID4gMCkge1xuXHRcdFx0XHRcdFx0XHR2YXIgcGFydGlhbFBlcmNlbnRhZ2UgPSAodmFsdWUgLSBtaW52KSAvIChtYXh2IC0gbWludik7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBtaW5wICsgcGFydGlhbFBlcmNlbnRhZ2UgKiAobWF4cCAtIG1pbnApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiAxMDAgKiAodmFsdWUgLSB0aGlzLm9wdGlvbnMubWluKSAvICh0aGlzLm9wdGlvbnMubWF4IC0gdGhpcy5vcHRpb25zLm1pbik7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdGxvZ2FyaXRobWljOiB7XG5cdFx0XHRcdC8qIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvODQ2MjIxL2xvZ2FyaXRobWljLXNsaWRlciAqL1xuXHRcdFx0XHR0b1ZhbHVlOiBmdW5jdGlvbihwZXJjZW50YWdlKSB7XG5cdFx0XHRcdFx0dmFyIG1pbiA9ICh0aGlzLm9wdGlvbnMubWluID09PSAwKSA/IDAgOiBNYXRoLmxvZyh0aGlzLm9wdGlvbnMubWluKTtcblx0XHRcdFx0XHR2YXIgbWF4ID0gTWF0aC5sb2codGhpcy5vcHRpb25zLm1heCk7XG5cdFx0XHRcdFx0dmFyIHZhbHVlID0gTWF0aC5leHAobWluICsgKG1heCAtIG1pbikgKiBwZXJjZW50YWdlIC8gMTAwKTtcblx0XHRcdFx0XHR2YWx1ZSA9IHRoaXMub3B0aW9ucy5taW4gKyBNYXRoLnJvdW5kKCh2YWx1ZSAtIHRoaXMub3B0aW9ucy5taW4pIC8gdGhpcy5vcHRpb25zLnN0ZXApICogdGhpcy5vcHRpb25zLnN0ZXA7XG5cdFx0XHRcdFx0LyogUm91bmRpbmcgdG8gdGhlIG5lYXJlc3Qgc3RlcCBjb3VsZCBleGNlZWQgdGhlIG1pbiBvclxuXHRcdFx0XHRcdCAqIG1heCwgc28gY2xpcCB0byB0aG9zZSB2YWx1ZXMuICovXG5cdFx0XHRcdFx0aWYgKHZhbHVlIDwgdGhpcy5vcHRpb25zLm1pbikge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMub3B0aW9ucy5taW47XG5cdFx0XHRcdFx0fSBlbHNlIGlmICh2YWx1ZSA+IHRoaXMub3B0aW9ucy5tYXgpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLm9wdGlvbnMubWF4O1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHR0b1BlcmNlbnRhZ2U6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy5tYXggPT09IHRoaXMub3B0aW9ucy5taW4pIHtcblx0XHRcdFx0XHRcdHJldHVybiAwO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR2YXIgbWF4ID0gTWF0aC5sb2codGhpcy5vcHRpb25zLm1heCk7XG5cdFx0XHRcdFx0XHR2YXIgbWluID0gdGhpcy5vcHRpb25zLm1pbiA9PT0gMCA/IDAgOiBNYXRoLmxvZyh0aGlzLm9wdGlvbnMubWluKTtcblx0XHRcdFx0XHRcdHZhciB2ID0gdmFsdWUgPT09IDAgPyAwIDogTWF0aC5sb2codmFsdWUpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIDEwMCAqICh2IC0gbWluKSAvIChtYXggLSBtaW4pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cblx0XHRcdFx0XHRcdFx0Q09OU1RSVUNUT1JcblxuXHRcdCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXHRcdFNsaWRlciA9IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcblx0XHRcdGNyZWF0ZU5ld1NsaWRlci5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fTtcblxuXHRcdGZ1bmN0aW9uIGNyZWF0ZU5ld1NsaWRlcihlbGVtZW50LCBvcHRpb25zKSB7XG5cblx0XHRcdC8qXG5cdFx0XHRcdFRoZSBpbnRlcm5hbCBzdGF0ZSBvYmplY3QgaXMgdXNlZCB0byBzdG9yZSBkYXRhIGFib3V0IHRoZSBjdXJyZW50ICdzdGF0ZScgb2Ygc2xpZGVyLlxuXG5cdFx0XHRcdFRoaXMgaW5jbHVkZXMgdmFsdWVzIHN1Y2ggYXMgdGhlIGB2YWx1ZWAsIGBlbmFibGVkYCwgZXRjLi4uXG5cdFx0XHQqL1xuXHRcdFx0dGhpcy5fc3RhdGUgPSB7XG5cdFx0XHRcdHZhbHVlOiBudWxsLFxuXHRcdFx0XHRlbmFibGVkOiBudWxsLFxuXHRcdFx0XHRvZmZzZXQ6IG51bGwsXG5cdFx0XHRcdHNpemU6IG51bGwsXG5cdFx0XHRcdHBlcmNlbnRhZ2U6IG51bGwsXG5cdFx0XHRcdGluRHJhZzogZmFsc2UsXG5cdFx0XHRcdG92ZXI6IGZhbHNlXG5cdFx0XHR9O1xuXG5cblx0XHRcdGlmKHR5cGVvZiBlbGVtZW50ID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRcdHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudCk7XG5cdFx0XHR9IGVsc2UgaWYoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG5cdFx0XHRcdHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cdFx0XHR9XG5cblx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cblx0XHRcdFx0XHRcdFx0UHJvY2VzcyBPcHRpb25zXG5cblx0XHRcdCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXHRcdFx0b3B0aW9ucyA9IG9wdGlvbnMgPyBvcHRpb25zIDoge307XG5cdFx0XHR2YXIgb3B0aW9uVHlwZXMgPSBPYmplY3Qua2V5cyh0aGlzLmRlZmF1bHRPcHRpb25zKTtcblxuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IG9wdGlvblR5cGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBvcHROYW1lID0gb3B0aW9uVHlwZXNbaV07XG5cblx0XHRcdFx0Ly8gRmlyc3QgY2hlY2sgaWYgYW4gb3B0aW9uIHdhcyBwYXNzZWQgaW4gdmlhIHRoZSBjb25zdHJ1Y3RvclxuXHRcdFx0XHR2YXIgdmFsID0gb3B0aW9uc1tvcHROYW1lXTtcblx0XHRcdFx0Ly8gSWYgbm8gZGF0YSBhdHRyaWIsIHRoZW4gY2hlY2sgZGF0YSBhdHJyaWJ1dGVzXG5cdFx0XHRcdHZhbCA9ICh0eXBlb2YgdmFsICE9PSAndW5kZWZpbmVkJykgPyB2YWwgOiBnZXREYXRhQXR0cmliKHRoaXMuZWxlbWVudCwgb3B0TmFtZSk7XG5cdFx0XHRcdC8vIEZpbmFsbHksIGlmIG5vdGhpbmcgd2FzIHNwZWNpZmllZCwgdXNlIHRoZSBkZWZhdWx0c1xuXHRcdFx0XHR2YWwgPSAodmFsICE9PSBudWxsKSA/IHZhbCA6IHRoaXMuZGVmYXVsdE9wdGlvbnNbb3B0TmFtZV07XG5cblx0XHRcdFx0Ly8gU2V0IGFsbCBvcHRpb25zIG9uIHRoZSBpbnN0YW5jZSBvZiB0aGUgU2xpZGVyXG5cdFx0XHRcdGlmKCF0aGlzLm9wdGlvbnMpIHtcblx0XHRcdFx0XHR0aGlzLm9wdGlvbnMgPSB7fTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLm9wdGlvbnNbb3B0TmFtZV0gPSB2YWw7XG5cdFx0XHR9XG5cblx0XHRcdC8qXG5cdFx0XHRcdFZhbGlkYXRlIGB0b29sdGlwX3Bvc2l0aW9uYCBhZ2FpbnN0ICdvcmllbnRhdGlvbmBcblx0XHRcdFx0LSBpZiBgdG9vbHRpcF9wb3NpdGlvbmAgaXMgaW5jb21wYXRpYmxlIHdpdGggb3JpZW50YXRpb24sIHN3aXRoIGl0IHRvIGEgZGVmYXVsdCBjb21wYXRpYmxlIHdpdGggc3BlY2lmaWVkIGBvcmllbnRhdGlvbmBcblx0XHRcdFx0XHQtLSBkZWZhdWx0IGZvciBcInZlcnRpY2FsXCIgLT4gXCJyaWdodFwiXG5cdFx0XHRcdFx0LS0gZGVmYXVsdCBmb3IgXCJob3Jpem9udGFsXCIgLT4gXCJsZWZ0XCJcblx0XHRcdCovXG5cdFx0XHRpZih0aGlzLm9wdGlvbnMub3JpZW50YXRpb24gPT09IFwidmVydGljYWxcIiAmJiAodGhpcy5vcHRpb25zLnRvb2x0aXBfcG9zaXRpb24gPT09IFwidG9wXCIgfHwgdGhpcy5vcHRpb25zLnRvb2x0aXBfcG9zaXRpb24gPT09IFwiYm90dG9tXCIpKSB7XG5cblx0XHRcdFx0dGhpcy5vcHRpb25zLnRvb2x0aXBfcG9zaXRpb25cdD0gXCJyaWdodFwiO1xuXG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKHRoaXMub3B0aW9ucy5vcmllbnRhdGlvbiA9PT0gXCJob3Jpem9udGFsXCIgJiYgKHRoaXMub3B0aW9ucy50b29sdGlwX3Bvc2l0aW9uID09PSBcImxlZnRcIiB8fCB0aGlzLm9wdGlvbnMudG9vbHRpcF9wb3NpdGlvbiA9PT0gXCJyaWdodFwiKSkge1xuXG5cdFx0XHRcdHRoaXMub3B0aW9ucy50b29sdGlwX3Bvc2l0aW9uXHQ9IFwidG9wXCI7XG5cblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gZ2V0RGF0YUF0dHJpYihlbGVtZW50LCBvcHROYW1lKSB7XG5cdFx0XHRcdHZhciBkYXRhTmFtZSA9IFwiZGF0YS1zbGlkZXItXCIgKyBvcHROYW1lLnJlcGxhY2UoL18vZywgJy0nKTtcblx0XHRcdFx0dmFyIGRhdGFWYWxTdHJpbmcgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShkYXRhTmFtZSk7XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRyZXR1cm4gSlNPTi5wYXJzZShkYXRhVmFsU3RyaW5nKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXRjaChlcnIpIHtcblx0XHRcdFx0XHRyZXR1cm4gZGF0YVZhbFN0cmluZztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG5cdFx0XHRcdFx0XHRcdENyZWF0ZSBNYXJrdXBcblxuXHRcdFx0KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdHZhciBvcmlnV2lkdGggPSB0aGlzLmVsZW1lbnQuc3R5bGUud2lkdGg7XG5cdFx0XHR2YXIgdXBkYXRlU2xpZGVyID0gZmFsc2U7XG5cdFx0XHR2YXIgcGFyZW50ID0gdGhpcy5lbGVtZW50LnBhcmVudE5vZGU7XG5cdFx0XHR2YXIgc2xpZGVyVHJhY2tTZWxlY3Rpb247XG5cdFx0XHR2YXIgc2xpZGVyVHJhY2tMb3csIHNsaWRlclRyYWNrSGlnaDtcblx0XHRcdHZhciBzbGlkZXJNaW5IYW5kbGU7XG5cdFx0XHR2YXIgc2xpZGVyTWF4SGFuZGxlO1xuXG5cdFx0XHRpZiAodGhpcy5zbGlkZXJFbGVtKSB7XG5cdFx0XHRcdHVwZGF0ZVNsaWRlciA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvKiBDcmVhdGUgZWxlbWVudHMgbmVlZGVkIGZvciBzbGlkZXIgKi9cblx0XHRcdFx0dGhpcy5zbGlkZXJFbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdFx0dGhpcy5zbGlkZXJFbGVtLmNsYXNzTmFtZSA9IFwic2xpZGVyXCI7XG5cblx0XHRcdFx0LyogQ3JlYXRlIHNsaWRlciB0cmFjayBlbGVtZW50cyAqL1xuXHRcdFx0XHR2YXIgc2xpZGVyVHJhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0XHRzbGlkZXJUcmFjay5jbGFzc05hbWUgPSBcInNsaWRlci10cmFja1wiO1xuXG5cdFx0XHRcdHNsaWRlclRyYWNrTG93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdFx0c2xpZGVyVHJhY2tMb3cuY2xhc3NOYW1lID0gXCJzbGlkZXItdHJhY2stbG93XCI7XG5cblx0XHRcdFx0c2xpZGVyVHJhY2tTZWxlY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0XHRzbGlkZXJUcmFja1NlbGVjdGlvbi5jbGFzc05hbWUgPSBcInNsaWRlci1zZWxlY3Rpb25cIjtcblxuXHRcdFx0XHRzbGlkZXJUcmFja0hpZ2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0XHRzbGlkZXJUcmFja0hpZ2guY2xhc3NOYW1lID0gXCJzbGlkZXItdHJhY2staGlnaFwiO1xuXG5cdFx0XHRcdHNsaWRlck1pbkhhbmRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRcdHNsaWRlck1pbkhhbmRsZS5jbGFzc05hbWUgPSBcInNsaWRlci1oYW5kbGUgbWluLXNsaWRlci1oYW5kbGVcIjtcblx0XHRcdFx0c2xpZGVyTWluSGFuZGxlLnNldEF0dHJpYnV0ZSgncm9sZScsICdzbGlkZXInKTtcblx0XHRcdFx0c2xpZGVyTWluSGFuZGxlLnNldEF0dHJpYnV0ZSgnYXJpYS12YWx1ZW1pbicsIHRoaXMub3B0aW9ucy5taW4pO1xuXHRcdFx0XHRzbGlkZXJNaW5IYW5kbGUuc2V0QXR0cmlidXRlKCdhcmlhLXZhbHVlbWF4JywgdGhpcy5vcHRpb25zLm1heCk7XG5cblx0XHRcdFx0c2xpZGVyTWF4SGFuZGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdFx0c2xpZGVyTWF4SGFuZGxlLmNsYXNzTmFtZSA9IFwic2xpZGVyLWhhbmRsZSBtYXgtc2xpZGVyLWhhbmRsZVwiO1xuXHRcdFx0XHRzbGlkZXJNYXhIYW5kbGUuc2V0QXR0cmlidXRlKCdyb2xlJywgJ3NsaWRlcicpO1xuXHRcdFx0XHRzbGlkZXJNYXhIYW5kbGUuc2V0QXR0cmlidXRlKCdhcmlhLXZhbHVlbWluJywgdGhpcy5vcHRpb25zLm1pbik7XG5cdFx0XHRcdHNsaWRlck1heEhhbmRsZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtdmFsdWVtYXgnLCB0aGlzLm9wdGlvbnMubWF4KTtcblxuXHRcdFx0XHRzbGlkZXJUcmFjay5hcHBlbmRDaGlsZChzbGlkZXJUcmFja0xvdyk7XG5cdFx0XHRcdHNsaWRlclRyYWNrLmFwcGVuZENoaWxkKHNsaWRlclRyYWNrU2VsZWN0aW9uKTtcblx0XHRcdFx0c2xpZGVyVHJhY2suYXBwZW5kQ2hpbGQoc2xpZGVyVHJhY2tIaWdoKTtcblxuXHRcdFx0XHQvKiBBZGQgYXJpYS1sYWJlbGxlZGJ5IHRvIGhhbmRsZSdzICovXG5cdFx0XHRcdHZhciBpc0xhYmVsbGVkYnlBcnJheSA9IEFycmF5LmlzQXJyYXkodGhpcy5vcHRpb25zLmxhYmVsbGVkYnkpO1xuXHRcdFx0XHRpZiAoaXNMYWJlbGxlZGJ5QXJyYXkgJiYgdGhpcy5vcHRpb25zLmxhYmVsbGVkYnlbMF0pIHtcblx0XHRcdFx0XHRzbGlkZXJNaW5IYW5kbGUuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsbGVkYnknLCB0aGlzLm9wdGlvbnMubGFiZWxsZWRieVswXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlzTGFiZWxsZWRieUFycmF5ICYmIHRoaXMub3B0aW9ucy5sYWJlbGxlZGJ5WzFdKSB7XG5cdFx0XHRcdFx0c2xpZGVyTWF4SGFuZGxlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbGxlZGJ5JywgdGhpcy5vcHRpb25zLmxhYmVsbGVkYnlbMV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghaXNMYWJlbGxlZGJ5QXJyYXkgJiYgdGhpcy5vcHRpb25zLmxhYmVsbGVkYnkpIHtcblx0XHRcdFx0XHRzbGlkZXJNaW5IYW5kbGUuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsbGVkYnknLCB0aGlzLm9wdGlvbnMubGFiZWxsZWRieSk7XG5cdFx0XHRcdFx0c2xpZGVyTWF4SGFuZGxlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbGxlZGJ5JywgdGhpcy5vcHRpb25zLmxhYmVsbGVkYnkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0LyogQ3JlYXRlIHRpY2tzICovXG5cdFx0XHRcdHRoaXMudGlja3MgPSBbXTtcblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodGhpcy5vcHRpb25zLnRpY2tzKSAmJiB0aGlzLm9wdGlvbnMudGlja3MubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdGZvciAoaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMudGlja3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHZhciB0aWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHRcdFx0XHR0aWNrLmNsYXNzTmFtZSA9ICdzbGlkZXItdGljayc7XG5cblx0XHRcdFx0XHRcdHRoaXMudGlja3MucHVzaCh0aWNrKTtcblx0XHRcdFx0XHRcdHNsaWRlclRyYWNrLmFwcGVuZENoaWxkKHRpY2spO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHNsaWRlclRyYWNrU2VsZWN0aW9uLmNsYXNzTmFtZSArPSBcIiB0aWNrLXNsaWRlci1zZWxlY3Rpb25cIjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHNsaWRlclRyYWNrLmFwcGVuZENoaWxkKHNsaWRlck1pbkhhbmRsZSk7XG5cdFx0XHRcdHNsaWRlclRyYWNrLmFwcGVuZENoaWxkKHNsaWRlck1heEhhbmRsZSk7XG5cblx0XHRcdFx0dGhpcy50aWNrTGFiZWxzID0gW107XG5cdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHRoaXMub3B0aW9ucy50aWNrc19sYWJlbHMpICYmIHRoaXMub3B0aW9ucy50aWNrc19sYWJlbHMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdHRoaXMudGlja0xhYmVsQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHRcdFx0dGhpcy50aWNrTGFiZWxDb250YWluZXIuY2xhc3NOYW1lID0gJ3NsaWRlci10aWNrLWxhYmVsLWNvbnRhaW5lcic7XG5cblx0XHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLnRpY2tzX2xhYmVscy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0dmFyIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHRcdFx0XHR2YXIgbm9UaWNrUG9zaXRpb25zU3BlY2lmaWVkID0gdGhpcy5vcHRpb25zLnRpY2tzX3Bvc2l0aW9ucy5sZW5ndGggPT09IDA7XG5cdFx0XHRcdFx0XHR2YXIgdGlja0xhYmVsc0luZGV4ID0gKHRoaXMub3B0aW9ucy5yZXZlcnNlZCAmJiBub1RpY2tQb3NpdGlvbnNTcGVjaWZpZWQpID8gKHRoaXMub3B0aW9ucy50aWNrc19sYWJlbHMubGVuZ3RoIC0gKGkgKyAxKSkgOiBpO1xuXHRcdFx0XHRcdFx0bGFiZWwuY2xhc3NOYW1lID0gJ3NsaWRlci10aWNrLWxhYmVsJztcblx0XHRcdFx0XHRcdGxhYmVsLmlubmVySFRNTCA9IHRoaXMub3B0aW9ucy50aWNrc19sYWJlbHNbdGlja0xhYmVsc0luZGV4XTtcblxuXHRcdFx0XHRcdFx0dGhpcy50aWNrTGFiZWxzLnB1c2gobGFiZWwpO1xuXHRcdFx0XHRcdFx0dGhpcy50aWNrTGFiZWxDb250YWluZXIuYXBwZW5kQ2hpbGQobGFiZWwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cblx0XHRcdFx0dmFyIGNyZWF0ZUFuZEFwcGVuZFRvb2x0aXBTdWJFbGVtZW50cyA9IGZ1bmN0aW9uKHRvb2x0aXBFbGVtKSB7XG5cdFx0XHRcdFx0dmFyIGFycm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblx0XHRcdFx0XHRhcnJvdy5jbGFzc05hbWUgPSBcInRvb2x0aXAtYXJyb3dcIjtcblxuXHRcdFx0XHRcdHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRcdFx0aW5uZXIuY2xhc3NOYW1lID0gXCJ0b29sdGlwLWlubmVyXCI7XG5cblx0XHRcdFx0XHR0b29sdGlwRWxlbS5hcHBlbmRDaGlsZChhcnJvdyk7XG5cdFx0XHRcdFx0dG9vbHRpcEVsZW0uYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0LyogQ3JlYXRlIHRvb2x0aXAgZWxlbWVudHMgKi9cblx0XHRcdFx0dmFyIHNsaWRlclRvb2x0aXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0XHRzbGlkZXJUb29sdGlwLmNsYXNzTmFtZSA9IFwidG9vbHRpcCB0b29sdGlwLW1haW5cIjtcblx0XHRcdFx0c2xpZGVyVG9vbHRpcC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAncHJlc2VudGF0aW9uJyk7XG5cdFx0XHRcdGNyZWF0ZUFuZEFwcGVuZFRvb2x0aXBTdWJFbGVtZW50cyhzbGlkZXJUb29sdGlwKTtcblxuXHRcdFx0XHR2YXIgc2xpZGVyVG9vbHRpcE1pbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cdFx0XHRcdHNsaWRlclRvb2x0aXBNaW4uY2xhc3NOYW1lID0gXCJ0b29sdGlwIHRvb2x0aXAtbWluXCI7XG5cdFx0XHRcdHNsaWRlclRvb2x0aXBNaW4uc2V0QXR0cmlidXRlKCdyb2xlJywgJ3ByZXNlbnRhdGlvbicpO1xuXHRcdFx0XHRjcmVhdGVBbmRBcHBlbmRUb29sdGlwU3ViRWxlbWVudHMoc2xpZGVyVG9vbHRpcE1pbik7XG5cblx0XHRcdFx0dmFyIHNsaWRlclRvb2x0aXBNYXggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXHRcdFx0XHRzbGlkZXJUb29sdGlwTWF4LmNsYXNzTmFtZSA9IFwidG9vbHRpcCB0b29sdGlwLW1heFwiO1xuXHRcdFx0XHRzbGlkZXJUb29sdGlwTWF4LnNldEF0dHJpYnV0ZSgncm9sZScsICdwcmVzZW50YXRpb24nKTtcblx0XHRcdFx0Y3JlYXRlQW5kQXBwZW5kVG9vbHRpcFN1YkVsZW1lbnRzKHNsaWRlclRvb2x0aXBNYXgpO1xuXG5cblx0XHRcdFx0LyogQXBwZW5kIGNvbXBvbmVudHMgdG8gc2xpZGVyRWxlbSAqL1xuXHRcdFx0XHR0aGlzLnNsaWRlckVsZW0uYXBwZW5kQ2hpbGQoc2xpZGVyVHJhY2spO1xuXHRcdFx0XHR0aGlzLnNsaWRlckVsZW0uYXBwZW5kQ2hpbGQoc2xpZGVyVG9vbHRpcCk7XG5cdFx0XHRcdHRoaXMuc2xpZGVyRWxlbS5hcHBlbmRDaGlsZChzbGlkZXJUb29sdGlwTWluKTtcblx0XHRcdFx0dGhpcy5zbGlkZXJFbGVtLmFwcGVuZENoaWxkKHNsaWRlclRvb2x0aXBNYXgpO1xuXG5cdFx0XHRcdGlmICh0aGlzLnRpY2tMYWJlbENvbnRhaW5lcikge1xuXHRcdFx0XHRcdHRoaXMuc2xpZGVyRWxlbS5hcHBlbmRDaGlsZCh0aGlzLnRpY2tMYWJlbENvbnRhaW5lcik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKiBBcHBlbmQgc2xpZGVyIGVsZW1lbnQgdG8gcGFyZW50IGNvbnRhaW5lciwgcmlnaHQgYmVmb3JlIHRoZSBvcmlnaW5hbCA8aW5wdXQ+IGVsZW1lbnQgKi9cblx0XHRcdFx0cGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLnNsaWRlckVsZW0sIHRoaXMuZWxlbWVudCk7XG5cblx0XHRcdFx0LyogSGlkZSBvcmlnaW5hbCA8aW5wdXQ+IGVsZW1lbnQgKi9cblx0XHRcdFx0dGhpcy5lbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcblx0XHRcdH1cblx0XHRcdC8qIElmIEpRdWVyeSBleGlzdHMsIGNhY2hlIEpRIHJlZmVyZW5jZXMgKi9cblx0XHRcdGlmKCQpIHtcblx0XHRcdFx0dGhpcy4kZWxlbWVudCA9ICQodGhpcy5lbGVtZW50KTtcblx0XHRcdFx0dGhpcy4kc2xpZGVyRWxlbSA9ICQodGhpcy5zbGlkZXJFbGVtKTtcblx0XHRcdH1cblxuXHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuXHRcdFx0XHRcdFx0XHRcdFNldHVwXG5cblx0XHRcdCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXHRcdFx0dGhpcy5ldmVudFRvQ2FsbGJhY2tNYXAgPSB7fTtcblx0XHRcdHRoaXMuc2xpZGVyRWxlbS5pZCA9IHRoaXMub3B0aW9ucy5pZDtcblxuXHRcdFx0dGhpcy50b3VjaENhcGFibGUgPSAnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cgfHwgKHdpbmRvdy5Eb2N1bWVudFRvdWNoICYmIGRvY3VtZW50IGluc3RhbmNlb2Ygd2luZG93LkRvY3VtZW50VG91Y2gpO1xuXG5cdFx0XHR0aGlzLnRvb2x0aXAgPSB0aGlzLnNsaWRlckVsZW0ucXVlcnlTZWxlY3RvcignLnRvb2x0aXAtbWFpbicpO1xuXHRcdFx0dGhpcy50b29sdGlwSW5uZXIgPSB0aGlzLnRvb2x0aXAucXVlcnlTZWxlY3RvcignLnRvb2x0aXAtaW5uZXInKTtcblxuXHRcdFx0dGhpcy50b29sdGlwX21pbiA9IHRoaXMuc2xpZGVyRWxlbS5xdWVyeVNlbGVjdG9yKCcudG9vbHRpcC1taW4nKTtcblx0XHRcdHRoaXMudG9vbHRpcElubmVyX21pbiA9IHRoaXMudG9vbHRpcF9taW4ucXVlcnlTZWxlY3RvcignLnRvb2x0aXAtaW5uZXInKTtcblxuXHRcdFx0dGhpcy50b29sdGlwX21heCA9IHRoaXMuc2xpZGVyRWxlbS5xdWVyeVNlbGVjdG9yKCcudG9vbHRpcC1tYXgnKTtcblx0XHRcdHRoaXMudG9vbHRpcElubmVyX21heD0gdGhpcy50b29sdGlwX21heC5xdWVyeVNlbGVjdG9yKCcudG9vbHRpcC1pbm5lcicpO1xuXG5cdFx0XHRpZiAoU2xpZGVyU2NhbGVbdGhpcy5vcHRpb25zLnNjYWxlXSkge1xuXHRcdFx0XHR0aGlzLm9wdGlvbnMuc2NhbGUgPSBTbGlkZXJTY2FsZVt0aGlzLm9wdGlvbnMuc2NhbGVdO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodXBkYXRlU2xpZGVyID09PSB0cnVlKSB7XG5cdFx0XHRcdC8vIFJlc2V0IGNsYXNzZXNcblx0XHRcdFx0dGhpcy5fcmVtb3ZlQ2xhc3ModGhpcy5zbGlkZXJFbGVtLCAnc2xpZGVyLWhvcml6b250YWwnKTtcblx0XHRcdFx0dGhpcy5fcmVtb3ZlQ2xhc3ModGhpcy5zbGlkZXJFbGVtLCAnc2xpZGVyLXZlcnRpY2FsJyk7XG5cdFx0XHRcdHRoaXMuX3JlbW92ZUNsYXNzKHRoaXMudG9vbHRpcCwgJ2hpZGUnKTtcblx0XHRcdFx0dGhpcy5fcmVtb3ZlQ2xhc3ModGhpcy50b29sdGlwX21pbiwgJ2hpZGUnKTtcblx0XHRcdFx0dGhpcy5fcmVtb3ZlQ2xhc3ModGhpcy50b29sdGlwX21heCwgJ2hpZGUnKTtcblxuXHRcdFx0XHQvLyBVbmRvIGV4aXN0aW5nIGlubGluZSBzdHlsZXMgZm9yIHRyYWNrXG5cdFx0XHRcdFtcImxlZnRcIiwgXCJ0b3BcIiwgXCJ3aWR0aFwiLCBcImhlaWdodFwiXS5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcblx0XHRcdFx0XHR0aGlzLl9yZW1vdmVQcm9wZXJ0eSh0aGlzLnRyYWNrTG93LCBwcm9wKTtcblx0XHRcdFx0XHR0aGlzLl9yZW1vdmVQcm9wZXJ0eSh0aGlzLnRyYWNrU2VsZWN0aW9uLCBwcm9wKTtcblx0XHRcdFx0XHR0aGlzLl9yZW1vdmVQcm9wZXJ0eSh0aGlzLnRyYWNrSGlnaCwgcHJvcCk7XG5cdFx0XHRcdH0sIHRoaXMpO1xuXG5cdFx0XHRcdC8vIFVuZG8gaW5saW5lIHN0eWxlcyBvbiBoYW5kbGVzXG5cdFx0XHRcdFt0aGlzLmhhbmRsZTEsIHRoaXMuaGFuZGxlMl0uZm9yRWFjaChmdW5jdGlvbihoYW5kbGUpIHtcblx0XHRcdFx0XHR0aGlzLl9yZW1vdmVQcm9wZXJ0eShoYW5kbGUsICdsZWZ0Jyk7XG5cdFx0XHRcdFx0dGhpcy5fcmVtb3ZlUHJvcGVydHkoaGFuZGxlLCAndG9wJyk7XG5cdFx0XHRcdH0sIHRoaXMpO1xuXG5cdFx0XHRcdC8vIFVuZG8gaW5saW5lIHN0eWxlcyBhbmQgY2xhc3NlcyBvbiB0b29sdGlwc1xuXHRcdFx0XHRbdGhpcy50b29sdGlwLCB0aGlzLnRvb2x0aXBfbWluLCB0aGlzLnRvb2x0aXBfbWF4XS5mb3JFYWNoKGZ1bmN0aW9uKHRvb2x0aXApIHtcblx0XHRcdFx0XHR0aGlzLl9yZW1vdmVQcm9wZXJ0eSh0b29sdGlwLCAnbGVmdCcpO1xuXHRcdFx0XHRcdHRoaXMuX3JlbW92ZVByb3BlcnR5KHRvb2x0aXAsICd0b3AnKTtcblx0XHRcdFx0XHR0aGlzLl9yZW1vdmVQcm9wZXJ0eSh0b29sdGlwLCAnbWFyZ2luLWxlZnQnKTtcblx0XHRcdFx0XHR0aGlzLl9yZW1vdmVQcm9wZXJ0eSh0b29sdGlwLCAnbWFyZ2luLXRvcCcpO1xuXG5cdFx0XHRcdFx0dGhpcy5fcmVtb3ZlQ2xhc3ModG9vbHRpcCwgJ3JpZ2h0Jyk7XG5cdFx0XHRcdFx0dGhpcy5fcmVtb3ZlQ2xhc3ModG9vbHRpcCwgJ3RvcCcpO1xuXHRcdFx0XHR9LCB0aGlzKTtcblx0XHRcdH1cblxuXHRcdFx0aWYodGhpcy5vcHRpb25zLm9yaWVudGF0aW9uID09PSAndmVydGljYWwnKSB7XG5cdFx0XHRcdHRoaXMuX2FkZENsYXNzKHRoaXMuc2xpZGVyRWxlbSwnc2xpZGVyLXZlcnRpY2FsJyk7XG5cdFx0XHRcdHRoaXMuc3R5bGVQb3MgPSAndG9wJztcblx0XHRcdFx0dGhpcy5tb3VzZVBvcyA9ICdwYWdlWSc7XG5cdFx0XHRcdHRoaXMuc2l6ZVBvcyA9ICdvZmZzZXRIZWlnaHQnO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5fYWRkQ2xhc3ModGhpcy5zbGlkZXJFbGVtLCAnc2xpZGVyLWhvcml6b250YWwnKTtcblx0XHRcdFx0dGhpcy5zbGlkZXJFbGVtLnN0eWxlLndpZHRoID0gb3JpZ1dpZHRoO1xuXHRcdFx0XHR0aGlzLm9wdGlvbnMub3JpZW50YXRpb24gPSAnaG9yaXpvbnRhbCc7XG5cdFx0XHRcdHRoaXMuc3R5bGVQb3MgPSAnbGVmdCc7XG5cdFx0XHRcdHRoaXMubW91c2VQb3MgPSAncGFnZVgnO1xuXHRcdFx0XHR0aGlzLnNpemVQb3MgPSAnb2Zmc2V0V2lkdGgnO1xuXG5cdFx0XHR9XG5cdFx0XHR0aGlzLl9zZXRUb29sdGlwUG9zaXRpb24oKTtcblx0XHRcdC8qIEluIGNhc2UgdGlja3MgYXJlIHNwZWNpZmllZCwgb3ZlcndyaXRlIHRoZSBtaW4gYW5kIG1heCBib3VuZHMgKi9cblx0XHRcdGlmIChBcnJheS5pc0FycmF5KHRoaXMub3B0aW9ucy50aWNrcykgJiYgdGhpcy5vcHRpb25zLnRpY2tzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHR0aGlzLm9wdGlvbnMubWF4ID0gTWF0aC5tYXguYXBwbHkoTWF0aCwgdGhpcy5vcHRpb25zLnRpY2tzKTtcblx0XHRcdFx0XHR0aGlzLm9wdGlvbnMubWluID0gTWF0aC5taW4uYXBwbHkoTWF0aCwgdGhpcy5vcHRpb25zLnRpY2tzKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodGhpcy5vcHRpb25zLnZhbHVlKSkge1xuXHRcdFx0XHR0aGlzLm9wdGlvbnMucmFuZ2UgPSB0cnVlO1xuXHRcdFx0XHR0aGlzLl9zdGF0ZS52YWx1ZSA9IHRoaXMub3B0aW9ucy52YWx1ZTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKHRoaXMub3B0aW9ucy5yYW5nZSkge1xuXHRcdFx0XHQvLyBVc2VyIHdhbnRzIGEgcmFuZ2UsIGJ1dCB2YWx1ZSBpcyBub3QgYW4gYXJyYXlcblx0XHRcdFx0dGhpcy5fc3RhdGUudmFsdWUgPSBbdGhpcy5vcHRpb25zLnZhbHVlLCB0aGlzLm9wdGlvbnMubWF4XTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0aGlzLl9zdGF0ZS52YWx1ZSA9IHRoaXMub3B0aW9ucy52YWx1ZTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy50cmFja0xvdyA9IHNsaWRlclRyYWNrTG93IHx8IHRoaXMudHJhY2tMb3c7XG5cdFx0XHR0aGlzLnRyYWNrU2VsZWN0aW9uID0gc2xpZGVyVHJhY2tTZWxlY3Rpb24gfHwgdGhpcy50cmFja1NlbGVjdGlvbjtcblx0XHRcdHRoaXMudHJhY2tIaWdoID0gc2xpZGVyVHJhY2tIaWdoIHx8IHRoaXMudHJhY2tIaWdoO1xuXG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLnNlbGVjdGlvbiA9PT0gJ25vbmUnKSB7XG5cdFx0XHRcdHRoaXMuX2FkZENsYXNzKHRoaXMudHJhY2tMb3csICdoaWRlJyk7XG5cdFx0XHRcdHRoaXMuX2FkZENsYXNzKHRoaXMudHJhY2tTZWxlY3Rpb24sICdoaWRlJyk7XG5cdFx0XHRcdHRoaXMuX2FkZENsYXNzKHRoaXMudHJhY2tIaWdoLCAnaGlkZScpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmhhbmRsZTEgPSBzbGlkZXJNaW5IYW5kbGUgfHwgdGhpcy5oYW5kbGUxO1xuXHRcdFx0dGhpcy5oYW5kbGUyID0gc2xpZGVyTWF4SGFuZGxlIHx8IHRoaXMuaGFuZGxlMjtcblxuXHRcdFx0aWYgKHVwZGF0ZVNsaWRlciA9PT0gdHJ1ZSkge1xuXHRcdFx0XHQvLyBSZXNldCBjbGFzc2VzXG5cdFx0XHRcdHRoaXMuX3JlbW92ZUNsYXNzKHRoaXMuaGFuZGxlMSwgJ3JvdW5kIHRyaWFuZ2xlJyk7XG5cdFx0XHRcdHRoaXMuX3JlbW92ZUNsYXNzKHRoaXMuaGFuZGxlMiwgJ3JvdW5kIHRyaWFuZ2xlIGhpZGUnKTtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgdGhpcy50aWNrcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHRoaXMuX3JlbW92ZUNsYXNzKHRoaXMudGlja3NbaV0sICdyb3VuZCB0cmlhbmdsZSBoaWRlJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dmFyIGF2YWlsYWJsZUhhbmRsZU1vZGlmaWVycyA9IFsncm91bmQnLCAndHJpYW5nbGUnLCAnY3VzdG9tJ107XG5cdFx0XHR2YXIgaXNWYWxpZEhhbmRsZVR5cGUgPSBhdmFpbGFibGVIYW5kbGVNb2RpZmllcnMuaW5kZXhPZih0aGlzLm9wdGlvbnMuaGFuZGxlKSAhPT0gLTE7XG5cdFx0XHRpZiAoaXNWYWxpZEhhbmRsZVR5cGUpIHtcblx0XHRcdFx0dGhpcy5fYWRkQ2xhc3ModGhpcy5oYW5kbGUxLCB0aGlzLm9wdGlvbnMuaGFuZGxlKTtcblx0XHRcdFx0dGhpcy5fYWRkQ2xhc3ModGhpcy5oYW5kbGUyLCB0aGlzLm9wdGlvbnMuaGFuZGxlKTtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgdGhpcy50aWNrcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHRoaXMuX2FkZENsYXNzKHRoaXMudGlja3NbaV0sIHRoaXMub3B0aW9ucy5oYW5kbGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX3N0YXRlLm9mZnNldCA9IHRoaXMuX29mZnNldCh0aGlzLnNsaWRlckVsZW0pO1xuXHRcdFx0dGhpcy5fc3RhdGUuc2l6ZSA9IHRoaXMuc2xpZGVyRWxlbVt0aGlzLnNpemVQb3NdO1xuXHRcdFx0dGhpcy5zZXRWYWx1ZSh0aGlzLl9zdGF0ZS52YWx1ZSk7XG5cblx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuXHRcdFx0XHRcdFx0QmluZCBFdmVudCBMaXN0ZW5lcnNcblxuXHRcdFx0KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHQvLyBCaW5kIGtleWJvYXJkIGhhbmRsZXJzXG5cdFx0XHR0aGlzLmhhbmRsZTFLZXlkb3duID0gdGhpcy5fa2V5ZG93bi5iaW5kKHRoaXMsIDApO1xuXHRcdFx0dGhpcy5oYW5kbGUxLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuaGFuZGxlMUtleWRvd24sIGZhbHNlKTtcblxuXHRcdFx0dGhpcy5oYW5kbGUyS2V5ZG93biA9IHRoaXMuX2tleWRvd24uYmluZCh0aGlzLCAxKTtcblx0XHRcdHRoaXMuaGFuZGxlMi5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZTJLZXlkb3duLCBmYWxzZSk7XG5cblx0XHRcdHRoaXMubW91c2Vkb3duID0gdGhpcy5fbW91c2Vkb3duLmJpbmQodGhpcyk7XG5cdFx0XHRpZiAodGhpcy50b3VjaENhcGFibGUpIHtcblx0XHRcdFx0Ly8gQmluZCB0b3VjaCBoYW5kbGVyc1xuXHRcdFx0XHR0aGlzLnNsaWRlckVsZW0uYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgdGhpcy5tb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuc2xpZGVyRWxlbS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMubW91c2Vkb3duLCBmYWxzZSk7XG5cblxuXHRcdFx0Ly8gQmluZCB0b29sdGlwLXJlbGF0ZWQgaGFuZGxlcnNcblx0XHRcdGlmKHRoaXMub3B0aW9ucy50b29sdGlwID09PSAnaGlkZScpIHtcblx0XHRcdFx0dGhpcy5fYWRkQ2xhc3ModGhpcy50b29sdGlwLCAnaGlkZScpO1xuXHRcdFx0XHR0aGlzLl9hZGRDbGFzcyh0aGlzLnRvb2x0aXBfbWluLCAnaGlkZScpO1xuXHRcdFx0XHR0aGlzLl9hZGRDbGFzcyh0aGlzLnRvb2x0aXBfbWF4LCAnaGlkZScpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZih0aGlzLm9wdGlvbnMudG9vbHRpcCA9PT0gJ2Fsd2F5cycpIHtcblx0XHRcdFx0dGhpcy5fc2hvd1Rvb2x0aXAoKTtcblx0XHRcdFx0dGhpcy5fYWx3YXlzU2hvd1Rvb2x0aXAgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHRoaXMuc2hvd1Rvb2x0aXAgPSB0aGlzLl9zaG93VG9vbHRpcC5iaW5kKHRoaXMpO1xuXHRcdFx0XHR0aGlzLmhpZGVUb29sdGlwID0gdGhpcy5faGlkZVRvb2x0aXAuYmluZCh0aGlzKTtcblxuXHRcdFx0XHR0aGlzLnNsaWRlckVsZW0uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZW50ZXJcIiwgdGhpcy5zaG93VG9vbHRpcCwgZmFsc2UpO1xuXHRcdFx0XHR0aGlzLnNsaWRlckVsZW0uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbGVhdmVcIiwgdGhpcy5oaWRlVG9vbHRpcCwgZmFsc2UpO1xuXG5cdFx0XHRcdHRoaXMuaGFuZGxlMS5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgdGhpcy5zaG93VG9vbHRpcCwgZmFsc2UpO1xuXHRcdFx0XHR0aGlzLmhhbmRsZTEuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgdGhpcy5oaWRlVG9vbHRpcCwgZmFsc2UpO1xuXG5cdFx0XHRcdHRoaXMuaGFuZGxlMi5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgdGhpcy5zaG93VG9vbHRpcCwgZmFsc2UpO1xuXHRcdFx0XHR0aGlzLmhhbmRsZTIuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgdGhpcy5oaWRlVG9vbHRpcCwgZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZih0aGlzLm9wdGlvbnMuZW5hYmxlZCkge1xuXHRcdFx0XHR0aGlzLmVuYWJsZSgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5kaXNhYmxlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblxuXHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cblx0XHRcdFx0XHRJTlNUQU5DRSBQUk9QRVJUSUVTL01FVEhPRFNcblxuXHRcdC0gQW55IG1ldGhvZHMgYm91bmQgdG8gdGhlIHByb3RvdHlwZSBhcmUgY29uc2lkZXJlZFxuXHRcdHBhcnQgb2YgdGhlIHBsdWdpbidzIGBwdWJsaWNgIGludGVyZmFjZVxuXG5cdFx0KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cdFx0U2xpZGVyLnByb3RvdHlwZSA9IHtcblx0XHRcdF9pbml0OiBmdW5jdGlvbigpIHt9LCAvLyBOT1RFOiBNdXN0IGV4aXN0IHRvIHN1cHBvcnQgYnJpZGdldFxuXG5cdFx0XHRjb25zdHJ1Y3RvcjogU2xpZGVyLFxuXG5cdFx0XHRkZWZhdWx0T3B0aW9uczoge1xuXHRcdFx0XHRpZDogXCJcIixcblx0XHRcdCAgbWluOiAwLFxuXHRcdFx0XHRtYXg6IDEwLFxuXHRcdFx0XHRzdGVwOiAxLFxuXHRcdFx0XHRwcmVjaXNpb246IDAsXG5cdFx0XHRcdG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcsXG5cdFx0XHRcdHZhbHVlOiA1LFxuXHRcdFx0XHRyYW5nZTogZmFsc2UsXG5cdFx0XHRcdHNlbGVjdGlvbjogJ2JlZm9yZScsXG5cdFx0XHRcdHRvb2x0aXA6ICdzaG93Jyxcblx0XHRcdFx0dG9vbHRpcF9zcGxpdDogZmFsc2UsXG5cdFx0XHRcdGhhbmRsZTogJ3JvdW5kJyxcblx0XHRcdFx0cmV2ZXJzZWQ6IGZhbHNlLFxuXHRcdFx0XHRlbmFibGVkOiB0cnVlLFxuXHRcdFx0XHRmb3JtYXR0ZXI6IGZ1bmN0aW9uKHZhbCkge1xuXHRcdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcblx0XHRcdFx0XHRcdHJldHVybiB2YWxbMF0gKyBcIiA6IFwiICsgdmFsWzFdO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdmFsO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0bmF0dXJhbF9hcnJvd19rZXlzOiBmYWxzZSxcblx0XHRcdFx0dGlja3M6IFtdLFxuXHRcdFx0XHR0aWNrc19wb3NpdGlvbnM6IFtdLFxuXHRcdFx0XHR0aWNrc19sYWJlbHM6IFtdLFxuXHRcdFx0XHR0aWNrc19zbmFwX2JvdW5kczogMCxcblx0XHRcdFx0c2NhbGU6ICdsaW5lYXInLFxuXHRcdFx0XHRmb2N1czogZmFsc2UsXG5cdFx0XHRcdHRvb2x0aXBfcG9zaXRpb246IG51bGwsXG5cdFx0XHRcdGxhYmVsbGVkYnk6IG51bGxcblx0XHRcdH0sXG5cblx0XHRcdGdldEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5zbGlkZXJFbGVtO1xuXHRcdFx0fSxcblxuXHRcdFx0Z2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLnJhbmdlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuX3N0YXRlLnZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9zdGF0ZS52YWx1ZVswXTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0c2V0VmFsdWU6IGZ1bmN0aW9uKHZhbCwgdHJpZ2dlclNsaWRlRXZlbnQsIHRyaWdnZXJDaGFuZ2VFdmVudCkge1xuXHRcdFx0XHRpZiAoIXZhbCkge1xuXHRcdFx0XHRcdHZhbCA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIG9sZFZhbHVlID0gdGhpcy5nZXRWYWx1ZSgpO1xuXHRcdFx0XHR0aGlzLl9zdGF0ZS52YWx1ZSA9IHRoaXMuX3ZhbGlkYXRlSW5wdXRWYWx1ZSh2YWwpO1xuXHRcdFx0XHR2YXIgYXBwbHlQcmVjaXNpb24gPSB0aGlzLl9hcHBseVByZWNpc2lvbi5iaW5kKHRoaXMpO1xuXG5cdFx0XHRcdGlmICh0aGlzLm9wdGlvbnMucmFuZ2UpIHtcblx0XHRcdFx0XHR0aGlzLl9zdGF0ZS52YWx1ZVswXSA9IGFwcGx5UHJlY2lzaW9uKHRoaXMuX3N0YXRlLnZhbHVlWzBdKTtcblx0XHRcdFx0XHR0aGlzLl9zdGF0ZS52YWx1ZVsxXSA9IGFwcGx5UHJlY2lzaW9uKHRoaXMuX3N0YXRlLnZhbHVlWzFdKTtcblxuXHRcdFx0XHRcdHRoaXMuX3N0YXRlLnZhbHVlWzBdID0gTWF0aC5tYXgodGhpcy5vcHRpb25zLm1pbiwgTWF0aC5taW4odGhpcy5vcHRpb25zLm1heCwgdGhpcy5fc3RhdGUudmFsdWVbMF0pKTtcblx0XHRcdFx0XHR0aGlzLl9zdGF0ZS52YWx1ZVsxXSA9IE1hdGgubWF4KHRoaXMub3B0aW9ucy5taW4sIE1hdGgubWluKHRoaXMub3B0aW9ucy5tYXgsIHRoaXMuX3N0YXRlLnZhbHVlWzFdKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5fc3RhdGUudmFsdWUgPSBhcHBseVByZWNpc2lvbih0aGlzLl9zdGF0ZS52YWx1ZSk7XG5cdFx0XHRcdFx0dGhpcy5fc3RhdGUudmFsdWUgPSBbIE1hdGgubWF4KHRoaXMub3B0aW9ucy5taW4sIE1hdGgubWluKHRoaXMub3B0aW9ucy5tYXgsIHRoaXMuX3N0YXRlLnZhbHVlKSldO1xuXHRcdFx0XHRcdHRoaXMuX2FkZENsYXNzKHRoaXMuaGFuZGxlMiwgJ2hpZGUnKTtcblx0XHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLnNlbGVjdGlvbiA9PT0gJ2FmdGVyJykge1xuXHRcdFx0XHRcdFx0dGhpcy5fc3RhdGUudmFsdWVbMV0gPSB0aGlzLm9wdGlvbnMubWF4O1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9zdGF0ZS52YWx1ZVsxXSA9IHRoaXMub3B0aW9ucy5taW47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy5tYXggPiB0aGlzLm9wdGlvbnMubWluKSB7XG5cdFx0XHRcdFx0dGhpcy5fc3RhdGUucGVyY2VudGFnZSA9IFtcblx0XHRcdFx0XHRcdHRoaXMuX3RvUGVyY2VudGFnZSh0aGlzLl9zdGF0ZS52YWx1ZVswXSksXG5cdFx0XHRcdFx0XHR0aGlzLl90b1BlcmNlbnRhZ2UodGhpcy5fc3RhdGUudmFsdWVbMV0pLFxuXHRcdFx0XHRcdFx0dGhpcy5vcHRpb25zLnN0ZXAgKiAxMDAgLyAodGhpcy5vcHRpb25zLm1heCAtIHRoaXMub3B0aW9ucy5taW4pXG5cdFx0XHRcdFx0XTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLl9zdGF0ZS5wZXJjZW50YWdlID0gWzAsIDAsIDEwMF07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLl9sYXlvdXQoKTtcblx0XHRcdFx0dmFyIG5ld1ZhbHVlID0gdGhpcy5vcHRpb25zLnJhbmdlID8gdGhpcy5fc3RhdGUudmFsdWUgOiB0aGlzLl9zdGF0ZS52YWx1ZVswXTtcblxuXHRcdFx0XHRpZih0cmlnZ2VyU2xpZGVFdmVudCA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdHRoaXMuX3RyaWdnZXIoJ3NsaWRlJywgbmV3VmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKCAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKSAmJiAodHJpZ2dlckNoYW5nZUV2ZW50ID09PSB0cnVlKSApIHtcblx0XHRcdFx0XHR0aGlzLl90cmlnZ2VyKCdjaGFuZ2UnLCB7XG5cdFx0XHRcdFx0XHRvbGRWYWx1ZTogb2xkVmFsdWUsXG5cdFx0XHRcdFx0XHRuZXdWYWx1ZTogbmV3VmFsdWVcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLl9zZXREYXRhVmFsKG5ld1ZhbHVlKTtcblxuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH0sXG5cblx0XHRcdGRlc3Ryb3k6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdC8vIFJlbW92ZSBldmVudCBoYW5kbGVycyBvbiBzbGlkZXIgZWxlbWVudHNcblx0XHRcdFx0dGhpcy5fcmVtb3ZlU2xpZGVyRXZlbnRIYW5kbGVycygpO1xuXG5cdFx0XHRcdC8vIFJlbW92ZSB0aGUgc2xpZGVyIGZyb20gdGhlIERPTVxuXHRcdFx0XHR0aGlzLnNsaWRlckVsZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnNsaWRlckVsZW0pO1xuXHRcdFx0XHQvKiBTaG93IG9yaWdpbmFsIDxpbnB1dD4gZWxlbWVudCAqL1xuXHRcdFx0XHR0aGlzLmVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG5cblx0XHRcdFx0Ly8gQ2xlYXIgb3V0IGN1c3RvbSBldmVudCBiaW5kaW5nc1xuXHRcdFx0XHR0aGlzLl9jbGVhblVwRXZlbnRDYWxsYmFja3NNYXAoKTtcblxuXHRcdFx0XHQvLyBSZW1vdmUgZGF0YSB2YWx1ZXNcblx0XHRcdFx0dGhpcy5lbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcImRhdGFcIik7XG5cblx0XHRcdFx0Ly8gUmVtb3ZlIEpRdWVyeSBoYW5kbGVycy9kYXRhXG5cdFx0XHRcdGlmKCQpIHtcblx0XHRcdFx0XHR0aGlzLl91bmJpbmRKUXVlcnlFdmVudEhhbmRsZXJzKCk7XG5cdFx0XHRcdFx0dGhpcy4kZWxlbWVudC5yZW1vdmVEYXRhKCdzbGlkZXInKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0ZGlzYWJsZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRoaXMuX3N0YXRlLmVuYWJsZWQgPSBmYWxzZTtcblx0XHRcdFx0dGhpcy5oYW5kbGUxLnJlbW92ZUF0dHJpYnV0ZShcInRhYmluZGV4XCIpO1xuXHRcdFx0XHR0aGlzLmhhbmRsZTIucmVtb3ZlQXR0cmlidXRlKFwidGFiaW5kZXhcIik7XG5cdFx0XHRcdHRoaXMuX2FkZENsYXNzKHRoaXMuc2xpZGVyRWxlbSwgJ3NsaWRlci1kaXNhYmxlZCcpO1xuXHRcdFx0XHR0aGlzLl90cmlnZ2VyKCdzbGlkZURpc2FibGVkJyk7XG5cblx0XHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0XHR9LFxuXG5cdFx0XHRlbmFibGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLl9zdGF0ZS5lbmFibGVkID0gdHJ1ZTtcblx0XHRcdFx0dGhpcy5oYW5kbGUxLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIDApO1xuXHRcdFx0XHR0aGlzLmhhbmRsZTIuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgMCk7XG5cdFx0XHRcdHRoaXMuX3JlbW92ZUNsYXNzKHRoaXMuc2xpZGVyRWxlbSwgJ3NsaWRlci1kaXNhYmxlZCcpO1xuXHRcdFx0XHR0aGlzLl90cmlnZ2VyKCdzbGlkZUVuYWJsZWQnKTtcblxuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH0sXG5cblx0XHRcdHRvZ2dsZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmKHRoaXMuX3N0YXRlLmVuYWJsZWQpIHtcblx0XHRcdFx0XHR0aGlzLmRpc2FibGUoKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmVuYWJsZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0aGlzO1xuXHRcdFx0fSxcblxuXHRcdFx0aXNFbmFibGVkOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuX3N0YXRlLmVuYWJsZWQ7XG5cdFx0XHR9LFxuXG5cdFx0XHRvbjogZnVuY3Rpb24oZXZ0LCBjYWxsYmFjaykge1xuXHRcdFx0XHR0aGlzLl9iaW5kTm9uUXVlcnlFdmVudEhhbmRsZXIoZXZ0LCBjYWxsYmFjayk7XG5cdFx0XHRcdHJldHVybiB0aGlzO1xuXHRcdFx0fSxcblxuICAgICAgb2ZmOiBmdW5jdGlvbihldnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgaWYoJCkge1xuICAgICAgICAgICAgICB0aGlzLiRlbGVtZW50Lm9mZihldnQsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgdGhpcy4kc2xpZGVyRWxlbS5vZmYoZXZ0LCBjYWxsYmFjayk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fdW5iaW5kTm9uUXVlcnlFdmVudEhhbmRsZXIoZXZ0LCBjYWxsYmFjayk7XG4gICAgICAgICAgfVxuICAgICAgfSxcblxuXHRcdFx0Z2V0QXR0cmlidXRlOiBmdW5jdGlvbihhdHRyaWJ1dGUpIHtcblx0XHRcdFx0aWYoYXR0cmlidXRlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uc1thdHRyaWJ1dGVdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLm9wdGlvbnM7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdHNldEF0dHJpYnV0ZTogZnVuY3Rpb24oYXR0cmlidXRlLCB2YWx1ZSkge1xuXHRcdFx0XHR0aGlzLm9wdGlvbnNbYXR0cmlidXRlXSA9IHZhbHVlO1xuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH0sXG5cblx0XHRcdHJlZnJlc2g6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLl9yZW1vdmVTbGlkZXJFdmVudEhhbmRsZXJzKCk7XG5cdFx0XHRcdGNyZWF0ZU5ld1NsaWRlci5jYWxsKHRoaXMsIHRoaXMuZWxlbWVudCwgdGhpcy5vcHRpb25zKTtcblx0XHRcdFx0aWYoJCkge1xuXHRcdFx0XHRcdC8vIEJpbmQgbmV3IGluc3RhbmNlIG9mIHNsaWRlciB0byB0aGUgZWxlbWVudFxuXHRcdFx0XHRcdCQuZGF0YSh0aGlzLmVsZW1lbnQsICdzbGlkZXInLCB0aGlzKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH0sXG5cblx0XHRcdHJlbGF5b3V0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5fbGF5b3V0KCk7XG5cdFx0XHRcdHJldHVybiB0aGlzO1xuXHRcdFx0fSxcblxuXHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKitcblxuXHRcdFx0XHRcdFx0SEVMUEVSU1xuXG5cdFx0XHQtIEFueSBtZXRob2QgdGhhdCBpcyBub3QgcGFydCBvZiB0aGUgcHVibGljIGludGVyZmFjZS5cblx0XHRcdC0gUGxhY2UgaXQgdW5kZXJuZWF0aCB0aGlzIGNvbW1lbnQgYmxvY2sgYW5kIHdyaXRlIGl0cyBzaWduYXR1cmUgbGlrZSBzbzpcblxuXHRcdFx0ICBcdFx0XHRcdFx0X2ZuTmFtZSA6IGZ1bmN0aW9uKCkgey4uLn1cblxuXHRcdFx0KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cdFx0XHRfcmVtb3ZlU2xpZGVyRXZlbnRIYW5kbGVyczogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vIFJlbW92ZSBrZXlkb3duIGV2ZW50IGxpc3RlbmVyc1xuXHRcdFx0XHR0aGlzLmhhbmRsZTEucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGUxS2V5ZG93biwgZmFsc2UpO1xuXHRcdFx0XHR0aGlzLmhhbmRsZTIucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGUyS2V5ZG93biwgZmFsc2UpO1xuXG5cdFx0XHRcdGlmICh0aGlzLnNob3dUb29sdGlwKSB7XG5cdFx0XHRcdFx0dGhpcy5oYW5kbGUxLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCB0aGlzLnNob3dUb29sdGlwLCBmYWxzZSk7XG5cdFx0XHRcdFx0dGhpcy5oYW5kbGUyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCB0aGlzLnNob3dUb29sdGlwLCBmYWxzZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMuaGlkZVRvb2x0aXApIHtcblx0XHRcdFx0XHR0aGlzLmhhbmRsZTEucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgdGhpcy5oaWRlVG9vbHRpcCwgZmFsc2UpO1xuXHRcdFx0XHRcdHRoaXMuaGFuZGxlMi5yZW1vdmVFdmVudExpc3RlbmVyKFwiYmx1clwiLCB0aGlzLmhpZGVUb29sdGlwLCBmYWxzZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzIGZyb20gc2xpZGVyRWxlbVxuXHRcdFx0XHRpZiAodGhpcy5zaG93VG9vbHRpcCkge1xuXHRcdFx0XHRcdHRoaXMuc2xpZGVyRWxlbS5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2VlbnRlclwiLCB0aGlzLnNob3dUb29sdGlwLCBmYWxzZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMuaGlkZVRvb2x0aXApIHtcblx0XHRcdFx0XHR0aGlzLnNsaWRlckVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbGVhdmVcIiwgdGhpcy5oaWRlVG9vbHRpcCwgZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuc2xpZGVyRWxlbS5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0aGlzLm1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0XHR0aGlzLnNsaWRlckVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLm1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0fSxcblx0XHRcdF9iaW5kTm9uUXVlcnlFdmVudEhhbmRsZXI6IGZ1bmN0aW9uKGV2dCwgY2FsbGJhY2spIHtcblx0XHRcdFx0aWYodGhpcy5ldmVudFRvQ2FsbGJhY2tNYXBbZXZ0XSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0dGhpcy5ldmVudFRvQ2FsbGJhY2tNYXBbZXZ0XSA9IFtdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuZXZlbnRUb0NhbGxiYWNrTWFwW2V2dF0ucHVzaChjYWxsYmFjayk7XG5cdFx0XHR9LFxuICAgICAgX3VuYmluZE5vblF1ZXJ5RXZlbnRIYW5kbGVyOiBmdW5jdGlvbihldnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuZXZlbnRUb0NhbGxiYWNrTWFwW2V2dF07XG4gICAgICAgICAgaWYoY2FsbGJhY2tzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja3NbaV0gPT09IGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH0sXG5cdFx0XHRfY2xlYW5VcEV2ZW50Q2FsbGJhY2tzTWFwOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGV2ZW50TmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLmV2ZW50VG9DYWxsYmFja01hcCk7XG5cdFx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBldmVudE5hbWVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0dmFyIGV2ZW50TmFtZSA9IGV2ZW50TmFtZXNbaV07XG5cdFx0XHRcdFx0dGhpcy5ldmVudFRvQ2FsbGJhY2tNYXBbZXZlbnROYW1lXSA9IG51bGw7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRfc2hvd1Rvb2x0aXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLnRvb2x0aXBfc3BsaXQgPT09IGZhbHNlICl7XG4gICAgICAgIFx0dGhpcy5fYWRkQ2xhc3ModGhpcy50b29sdGlwLCAnaW4nKTtcbiAgICAgICAgXHR0aGlzLnRvb2x0aXBfbWluLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIFx0dGhpcy50b29sdGlwX21heC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdCAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX2FkZENsYXNzKHRoaXMudG9vbHRpcF9taW4sICdpbicpO1xuICAgICAgICAgIHRoaXMuX2FkZENsYXNzKHRoaXMudG9vbHRpcF9tYXgsICdpbicpO1xuICAgICAgICAgIHRoaXMudG9vbHRpcC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdCAgICB9XG5cdFx0XHRcdHRoaXMuX3N0YXRlLm92ZXIgPSB0cnVlO1xuXHRcdFx0fSxcblx0XHRcdF9oaWRlVG9vbHRpcDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICh0aGlzLl9zdGF0ZS5pbkRyYWcgPT09IGZhbHNlICYmIHRoaXMuYWx3YXlzU2hvd1Rvb2x0aXAgIT09IHRydWUpIHtcblx0XHRcdFx0XHR0aGlzLl9yZW1vdmVDbGFzcyh0aGlzLnRvb2x0aXAsICdpbicpO1xuXHRcdFx0XHRcdHRoaXMuX3JlbW92ZUNsYXNzKHRoaXMudG9vbHRpcF9taW4sICdpbicpO1xuXHRcdFx0XHRcdHRoaXMuX3JlbW92ZUNsYXNzKHRoaXMudG9vbHRpcF9tYXgsICdpbicpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuX3N0YXRlLm92ZXIgPSBmYWxzZTtcblx0XHRcdH0sXG5cdFx0XHRfbGF5b3V0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHBvc2l0aW9uUGVyY2VudGFnZXM7XG5cblx0XHRcdFx0aWYodGhpcy5vcHRpb25zLnJldmVyc2VkKSB7XG5cdFx0XHRcdFx0cG9zaXRpb25QZXJjZW50YWdlcyA9IFsgMTAwIC0gdGhpcy5fc3RhdGUucGVyY2VudGFnZVswXSwgdGhpcy5vcHRpb25zLnJhbmdlID8gMTAwIC0gdGhpcy5fc3RhdGUucGVyY2VudGFnZVsxXSA6IHRoaXMuX3N0YXRlLnBlcmNlbnRhZ2VbMV1dO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHBvc2l0aW9uUGVyY2VudGFnZXMgPSBbIHRoaXMuX3N0YXRlLnBlcmNlbnRhZ2VbMF0sIHRoaXMuX3N0YXRlLnBlcmNlbnRhZ2VbMV0gXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuaGFuZGxlMS5zdHlsZVt0aGlzLnN0eWxlUG9zXSA9IHBvc2l0aW9uUGVyY2VudGFnZXNbMF0rJyUnO1xuXHRcdFx0XHR0aGlzLmhhbmRsZTEuc2V0QXR0cmlidXRlKCdhcmlhLXZhbHVlbm93JywgdGhpcy5fc3RhdGUudmFsdWVbMF0pO1xuXG5cdFx0XHRcdHRoaXMuaGFuZGxlMi5zdHlsZVt0aGlzLnN0eWxlUG9zXSA9IHBvc2l0aW9uUGVyY2VudGFnZXNbMV0rJyUnO1xuXHRcdFx0XHR0aGlzLmhhbmRsZTIuc2V0QXR0cmlidXRlKCdhcmlhLXZhbHVlbm93JywgdGhpcy5fc3RhdGUudmFsdWVbMV0pO1xuXG5cdFx0XHRcdC8qIFBvc2l0aW9uIHRpY2tzIGFuZCBsYWJlbHMgKi9cblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodGhpcy5vcHRpb25zLnRpY2tzKSAmJiB0aGlzLm9wdGlvbnMudGlja3MubGVuZ3RoID4gMCkge1xuXG5cdFx0XHRcdFx0dmFyIHN0eWxlU2l6ZSA9IHRoaXMub3B0aW9ucy5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJyA/ICdoZWlnaHQnIDogJ3dpZHRoJztcblx0XHRcdFx0XHR2YXIgc3R5bGVNYXJnaW4gPSB0aGlzLm9wdGlvbnMub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcgPyAnbWFyZ2luVG9wJyA6ICdtYXJnaW5MZWZ0Jztcblx0XHRcdFx0XHR2YXIgbGFiZWxTaXplID0gdGhpcy5fc3RhdGUuc2l6ZSAvICh0aGlzLm9wdGlvbnMudGlja3MubGVuZ3RoIC0gMSk7XG5cblx0XHRcdFx0XHRpZiAodGhpcy50aWNrTGFiZWxDb250YWluZXIpIHtcblx0XHRcdFx0XHRcdHZhciBleHRyYU1hcmdpbiA9IDA7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLnRpY2tzX3Bvc2l0aW9ucy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy5vcmllbnRhdGlvbiAhPT0gJ3ZlcnRpY2FsJykge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMudGlja0xhYmVsQ29udGFpbmVyLnN0eWxlW3N0eWxlTWFyZ2luXSA9IC1sYWJlbFNpemUvMiArICdweCc7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRleHRyYU1hcmdpbiA9IHRoaXMudGlja0xhYmVsQ29udGFpbmVyLm9mZnNldEhlaWdodDtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdC8qIENoaWRyZW4gYXJlIHBvc2l0aW9uIGFic29sdXRlLCBjYWxjdWxhdGUgaGVpZ2h0IGJ5IGZpbmRpbmcgdGhlIG1heCBvZmZzZXRIZWlnaHQgb2YgYSBjaGlsZCAqL1xuXHRcdFx0XHRcdFx0XHRmb3IgKGkgPSAwIDsgaSA8IHRoaXMudGlja0xhYmVsQ29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAodGhpcy50aWNrTGFiZWxDb250YWluZXIuY2hpbGROb2Rlc1tpXS5vZmZzZXRIZWlnaHQgPiBleHRyYU1hcmdpbikge1xuXHRcdFx0XHRcdFx0XHRcdFx0ZXh0cmFNYXJnaW4gPSB0aGlzLnRpY2tMYWJlbENvbnRhaW5lci5jaGlsZE5vZGVzW2ldLm9mZnNldEhlaWdodDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGlmICh0aGlzLm9wdGlvbnMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJykge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnNsaWRlckVsZW0uc3R5bGUubWFyZ2luQm90dG9tID0gZXh0cmFNYXJnaW4gKyAncHgnO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy50aWNrcy5sZW5ndGg7IGkrKykge1xuXG5cdFx0XHRcdFx0XHR2YXIgcGVyY2VudGFnZSA9IHRoaXMub3B0aW9ucy50aWNrc19wb3NpdGlvbnNbaV0gfHwgdGhpcy5fdG9QZXJjZW50YWdlKHRoaXMub3B0aW9ucy50aWNrc1tpXSk7XG5cblx0XHRcdFx0XHRcdGlmICh0aGlzLm9wdGlvbnMucmV2ZXJzZWQpIHtcblx0XHRcdFx0XHRcdFx0cGVyY2VudGFnZSA9IDEwMCAtIHBlcmNlbnRhZ2U7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRoaXMudGlja3NbaV0uc3R5bGVbdGhpcy5zdHlsZVBvc10gPSBwZXJjZW50YWdlICsgJyUnO1xuXG5cdFx0XHRcdFx0XHQvKiBTZXQgY2xhc3MgbGFiZWxzIHRvIGRlbm90ZSB3aGV0aGVyIHRpY2tzIGFyZSBpbiB0aGUgc2VsZWN0aW9uICovXG5cdFx0XHRcdFx0XHR0aGlzLl9yZW1vdmVDbGFzcyh0aGlzLnRpY2tzW2ldLCAnaW4tc2VsZWN0aW9uJyk7XG5cdFx0XHRcdFx0XHRpZiAoIXRoaXMub3B0aW9ucy5yYW5nZSkge1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLnNlbGVjdGlvbiA9PT0gJ2FmdGVyJyAmJiBwZXJjZW50YWdlID49IHBvc2l0aW9uUGVyY2VudGFnZXNbMF0pe1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuX2FkZENsYXNzKHRoaXMudGlja3NbaV0sICdpbi1zZWxlY3Rpb24nKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuc2VsZWN0aW9uID09PSAnYmVmb3JlJyAmJiBwZXJjZW50YWdlIDw9IHBvc2l0aW9uUGVyY2VudGFnZXNbMF0pIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLl9hZGRDbGFzcyh0aGlzLnRpY2tzW2ldLCAnaW4tc2VsZWN0aW9uJyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAocGVyY2VudGFnZSA+PSBwb3NpdGlvblBlcmNlbnRhZ2VzWzBdICYmIHBlcmNlbnRhZ2UgPD0gcG9zaXRpb25QZXJjZW50YWdlc1sxXSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLl9hZGRDbGFzcyh0aGlzLnRpY2tzW2ldLCAnaW4tc2VsZWN0aW9uJyk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICh0aGlzLnRpY2tMYWJlbHNbaV0pIHtcblx0XHRcdFx0XHRcdFx0dGhpcy50aWNrTGFiZWxzW2ldLnN0eWxlW3N0eWxlU2l6ZV0gPSBsYWJlbFNpemUgKyAncHgnO1xuXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLm9wdGlvbnMub3JpZW50YXRpb24gIT09ICd2ZXJ0aWNhbCcgJiYgdGhpcy5vcHRpb25zLnRpY2tzX3Bvc2l0aW9uc1tpXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy50aWNrTGFiZWxzW2ldLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnRpY2tMYWJlbHNbaV0uc3R5bGVbdGhpcy5zdHlsZVBvc10gPSBwZXJjZW50YWdlICsgJyUnO1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMudGlja0xhYmVsc1tpXS5zdHlsZVtzdHlsZU1hcmdpbl0gPSAtbGFiZWxTaXplLzIgKyAncHgnO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJykge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMudGlja0xhYmVsc1tpXS5zdHlsZVsnbWFyZ2luTGVmdCddID0gIHRoaXMuc2xpZGVyRWxlbS5vZmZzZXRXaWR0aCArICdweCc7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy50aWNrTGFiZWxDb250YWluZXIuc3R5bGVbJ21hcmdpblRvcCddID0gdGhpcy5zbGlkZXJFbGVtLm9mZnNldFdpZHRoIC8gMiAqIC0xICsgJ3B4Jztcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBmb3JtYXR0ZWRUb29sdGlwVmFsO1xuXG5cdFx0XHRcdGlmICh0aGlzLm9wdGlvbnMucmFuZ2UpIHtcblx0XHRcdFx0XHRmb3JtYXR0ZWRUb29sdGlwVmFsID0gdGhpcy5vcHRpb25zLmZvcm1hdHRlcih0aGlzLl9zdGF0ZS52YWx1ZSk7XG5cdFx0XHRcdFx0dGhpcy5fc2V0VGV4dCh0aGlzLnRvb2x0aXBJbm5lciwgZm9ybWF0dGVkVG9vbHRpcFZhbCk7XG5cdFx0XHRcdFx0dGhpcy50b29sdGlwLnN0eWxlW3RoaXMuc3R5bGVQb3NdID0gKHBvc2l0aW9uUGVyY2VudGFnZXNbMV0gKyBwb3NpdGlvblBlcmNlbnRhZ2VzWzBdKS8yICsgJyUnO1xuXG5cdFx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJykge1xuXHRcdFx0XHRcdFx0dGhpcy5fY3NzKHRoaXMudG9vbHRpcCwgJ21hcmdpbi10b3AnLCAtdGhpcy50b29sdGlwLm9mZnNldEhlaWdodCAvIDIgKyAncHgnKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5fY3NzKHRoaXMudG9vbHRpcCwgJ21hcmdpbi1sZWZ0JywgLXRoaXMudG9vbHRpcC5vZmZzZXRXaWR0aCAvIDIgKyAncHgnKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLm9yaWVudGF0aW9uID09PSAndmVydGljYWwnKSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9jc3ModGhpcy50b29sdGlwLCAnbWFyZ2luLXRvcCcsIC10aGlzLnRvb2x0aXAub2Zmc2V0SGVpZ2h0IC8gMiArICdweCcpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9jc3ModGhpcy50b29sdGlwLCAnbWFyZ2luLWxlZnQnLCAtdGhpcy50b29sdGlwLm9mZnNldFdpZHRoIC8gMiArICdweCcpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHZhciBpbm5lclRvb2x0aXBNaW5UZXh0ID0gdGhpcy5vcHRpb25zLmZvcm1hdHRlcih0aGlzLl9zdGF0ZS52YWx1ZVswXSk7XG5cdFx0XHRcdFx0dGhpcy5fc2V0VGV4dCh0aGlzLnRvb2x0aXBJbm5lcl9taW4sIGlubmVyVG9vbHRpcE1pblRleHQpO1xuXG5cdFx0XHRcdFx0dmFyIGlubmVyVG9vbHRpcE1heFRleHQgPSB0aGlzLm9wdGlvbnMuZm9ybWF0dGVyKHRoaXMuX3N0YXRlLnZhbHVlWzFdKTtcblx0XHRcdFx0XHR0aGlzLl9zZXRUZXh0KHRoaXMudG9vbHRpcElubmVyX21heCwgaW5uZXJUb29sdGlwTWF4VGV4dCk7XG5cblx0XHRcdFx0XHR0aGlzLnRvb2x0aXBfbWluLnN0eWxlW3RoaXMuc3R5bGVQb3NdID0gcG9zaXRpb25QZXJjZW50YWdlc1swXSArICclJztcblxuXHRcdFx0XHRcdGlmICh0aGlzLm9wdGlvbnMub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcpIHtcblx0XHRcdFx0XHRcdHRoaXMuX2Nzcyh0aGlzLnRvb2x0aXBfbWluLCAnbWFyZ2luLXRvcCcsIC10aGlzLnRvb2x0aXBfbWluLm9mZnNldEhlaWdodCAvIDIgKyAncHgnKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5fY3NzKHRoaXMudG9vbHRpcF9taW4sICdtYXJnaW4tbGVmdCcsIC10aGlzLnRvb2x0aXBfbWluLm9mZnNldFdpZHRoIC8gMiArICdweCcpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRoaXMudG9vbHRpcF9tYXguc3R5bGVbdGhpcy5zdHlsZVBvc10gPSBwb3NpdGlvblBlcmNlbnRhZ2VzWzFdICsgJyUnO1xuXG5cdFx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJykge1xuXHRcdFx0XHRcdFx0dGhpcy5fY3NzKHRoaXMudG9vbHRpcF9tYXgsICdtYXJnaW4tdG9wJywgLXRoaXMudG9vbHRpcF9tYXgub2Zmc2V0SGVpZ2h0IC8gMiArICdweCcpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9jc3ModGhpcy50b29sdGlwX21heCwgJ21hcmdpbi1sZWZ0JywgLXRoaXMudG9vbHRpcF9tYXgub2Zmc2V0V2lkdGggLyAyICsgJ3B4Jyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZvcm1hdHRlZFRvb2x0aXBWYWwgPSB0aGlzLm9wdGlvbnMuZm9ybWF0dGVyKHRoaXMuX3N0YXRlLnZhbHVlWzBdKTtcblx0XHRcdFx0XHR0aGlzLl9zZXRUZXh0KHRoaXMudG9vbHRpcElubmVyLCBmb3JtYXR0ZWRUb29sdGlwVmFsKTtcblxuXHRcdFx0XHRcdHRoaXMudG9vbHRpcC5zdHlsZVt0aGlzLnN0eWxlUG9zXSA9IHBvc2l0aW9uUGVyY2VudGFnZXNbMF0gKyAnJSc7XG5cdFx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJykge1xuXHRcdFx0XHRcdFx0dGhpcy5fY3NzKHRoaXMudG9vbHRpcCwgJ21hcmdpbi10b3AnLCAtdGhpcy50b29sdGlwLm9mZnNldEhlaWdodCAvIDIgKyAncHgnKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5fY3NzKHRoaXMudG9vbHRpcCwgJ21hcmdpbi1sZWZ0JywgLXRoaXMudG9vbHRpcC5vZmZzZXRXaWR0aCAvIDIgKyAncHgnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLm9yaWVudGF0aW9uID09PSAndmVydGljYWwnKSB7XG5cdFx0XHRcdFx0dGhpcy50cmFja0xvdy5zdHlsZS50b3AgPSAnMCc7XG5cdFx0XHRcdFx0dGhpcy50cmFja0xvdy5zdHlsZS5oZWlnaHQgPSBNYXRoLm1pbihwb3NpdGlvblBlcmNlbnRhZ2VzWzBdLCBwb3NpdGlvblBlcmNlbnRhZ2VzWzFdKSArJyUnO1xuXG5cdFx0XHRcdFx0dGhpcy50cmFja1NlbGVjdGlvbi5zdHlsZS50b3AgPSBNYXRoLm1pbihwb3NpdGlvblBlcmNlbnRhZ2VzWzBdLCBwb3NpdGlvblBlcmNlbnRhZ2VzWzFdKSArJyUnO1xuXHRcdFx0XHRcdHRoaXMudHJhY2tTZWxlY3Rpb24uc3R5bGUuaGVpZ2h0ID0gTWF0aC5hYnMocG9zaXRpb25QZXJjZW50YWdlc1swXSAtIHBvc2l0aW9uUGVyY2VudGFnZXNbMV0pICsnJSc7XG5cblx0XHRcdFx0XHR0aGlzLnRyYWNrSGlnaC5zdHlsZS5ib3R0b20gPSAnMCc7XG5cdFx0XHRcdFx0dGhpcy50cmFja0hpZ2guc3R5bGUuaGVpZ2h0ID0gKDEwMCAtIE1hdGgubWluKHBvc2l0aW9uUGVyY2VudGFnZXNbMF0sIHBvc2l0aW9uUGVyY2VudGFnZXNbMV0pIC0gTWF0aC5hYnMocG9zaXRpb25QZXJjZW50YWdlc1swXSAtIHBvc2l0aW9uUGVyY2VudGFnZXNbMV0pKSArJyUnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMudHJhY2tMb3cuc3R5bGUubGVmdCA9ICcwJztcblx0XHRcdFx0XHR0aGlzLnRyYWNrTG93LnN0eWxlLndpZHRoID0gTWF0aC5taW4ocG9zaXRpb25QZXJjZW50YWdlc1swXSwgcG9zaXRpb25QZXJjZW50YWdlc1sxXSkgKyclJztcblxuXHRcdFx0XHRcdHRoaXMudHJhY2tTZWxlY3Rpb24uc3R5bGUubGVmdCA9IE1hdGgubWluKHBvc2l0aW9uUGVyY2VudGFnZXNbMF0sIHBvc2l0aW9uUGVyY2VudGFnZXNbMV0pICsnJSc7XG5cdFx0XHRcdFx0dGhpcy50cmFja1NlbGVjdGlvbi5zdHlsZS53aWR0aCA9IE1hdGguYWJzKHBvc2l0aW9uUGVyY2VudGFnZXNbMF0gLSBwb3NpdGlvblBlcmNlbnRhZ2VzWzFdKSArJyUnO1xuXG5cdFx0XHRcdFx0dGhpcy50cmFja0hpZ2guc3R5bGUucmlnaHQgPSAnMCc7XG5cdFx0XHRcdFx0dGhpcy50cmFja0hpZ2guc3R5bGUud2lkdGggPSAoMTAwIC0gTWF0aC5taW4ocG9zaXRpb25QZXJjZW50YWdlc1swXSwgcG9zaXRpb25QZXJjZW50YWdlc1sxXSkgLSBNYXRoLmFicyhwb3NpdGlvblBlcmNlbnRhZ2VzWzBdIC0gcG9zaXRpb25QZXJjZW50YWdlc1sxXSkpICsnJSc7XG5cblx0XHRcdCAgICAgICAgdmFyIG9mZnNldF9taW4gPSB0aGlzLnRvb2x0aXBfbWluLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0ICAgICAgICB2YXIgb2Zmc2V0X21heCA9IHRoaXMudG9vbHRpcF9tYXguZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cblx0XHRcdCAgICAgICAgaWYgKG9mZnNldF9taW4ucmlnaHQgPiBvZmZzZXRfbWF4LmxlZnQpIHtcblx0XHRcdCAgICAgICAgICAgIHRoaXMuX3JlbW92ZUNsYXNzKHRoaXMudG9vbHRpcF9tYXgsICd0b3AnKTtcblx0XHRcdCAgICAgICAgICAgIHRoaXMuX2FkZENsYXNzKHRoaXMudG9vbHRpcF9tYXgsICdib3R0b20nKTtcblx0XHRcdCAgICAgICAgICAgIHRoaXMudG9vbHRpcF9tYXguc3R5bGUudG9wID0gMTggKyAncHgnO1xuXHRcdFx0ICAgICAgICB9IGVsc2Uge1xuXHRcdFx0ICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQ2xhc3ModGhpcy50b29sdGlwX21heCwgJ2JvdHRvbScpO1xuXHRcdFx0ICAgICAgICAgICAgdGhpcy5fYWRkQ2xhc3ModGhpcy50b29sdGlwX21heCwgJ3RvcCcpO1xuXHRcdFx0ICAgICAgICAgICAgdGhpcy50b29sdGlwX21heC5zdHlsZS50b3AgPSB0aGlzLnRvb2x0aXBfbWluLnN0eWxlLnRvcDtcblx0XHRcdCAgICAgICAgfVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0X3JlbW92ZVByb3BlcnR5OiBmdW5jdGlvbihlbGVtZW50LCBwcm9wKSB7XG5cdFx0XHRcdGlmIChlbGVtZW50LnN0eWxlLnJlbW92ZVByb3BlcnR5KSB7XG5cdFx0XHRcdCAgICBlbGVtZW50LnN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQgICAgZWxlbWVudC5zdHlsZS5yZW1vdmVBdHRyaWJ1dGUocHJvcCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRfbW91c2Vkb3duOiBmdW5jdGlvbihldikge1xuXHRcdFx0XHRpZighdGhpcy5fc3RhdGUuZW5hYmxlZCkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuX3N0YXRlLm9mZnNldCA9IHRoaXMuX29mZnNldCh0aGlzLnNsaWRlckVsZW0pO1xuXHRcdFx0XHR0aGlzLl9zdGF0ZS5zaXplID0gdGhpcy5zbGlkZXJFbGVtW3RoaXMuc2l6ZVBvc107XG5cblx0XHRcdFx0dmFyIHBlcmNlbnRhZ2UgPSB0aGlzLl9nZXRQZXJjZW50YWdlKGV2KTtcblxuXHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLnJhbmdlKSB7XG5cdFx0XHRcdFx0dmFyIGRpZmYxID0gTWF0aC5hYnModGhpcy5fc3RhdGUucGVyY2VudGFnZVswXSAtIHBlcmNlbnRhZ2UpO1xuXHRcdFx0XHRcdHZhciBkaWZmMiA9IE1hdGguYWJzKHRoaXMuX3N0YXRlLnBlcmNlbnRhZ2VbMV0gLSBwZXJjZW50YWdlKTtcblx0XHRcdFx0XHR0aGlzLl9zdGF0ZS5kcmFnZ2VkID0gKGRpZmYxIDwgZGlmZjIpID8gMCA6IDE7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5fc3RhdGUuZHJhZ2dlZCA9IDA7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLl9zdGF0ZS5wZXJjZW50YWdlW3RoaXMuX3N0YXRlLmRyYWdnZWRdID0gcGVyY2VudGFnZTtcblx0XHRcdFx0dGhpcy5fbGF5b3V0KCk7XG5cblx0XHRcdFx0aWYgKHRoaXMudG91Y2hDYXBhYmxlKSB7XG5cdFx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLm1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0aGlzLm1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKHRoaXMubW91c2Vtb3ZlKXtcblx0XHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMubW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYodGhpcy5tb3VzZXVwKXtcblx0XHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLm1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMubW91c2Vtb3ZlID0gdGhpcy5fbW91c2Vtb3ZlLmJpbmQodGhpcyk7XG5cdFx0XHRcdHRoaXMubW91c2V1cCA9IHRoaXMuX21vdXNldXAuYmluZCh0aGlzKTtcblxuXHRcdFx0XHRpZiAodGhpcy50b3VjaENhcGFibGUpIHtcblx0XHRcdFx0XHQvLyBUb3VjaDogQmluZCB0b3VjaCBldmVudHM6XG5cdFx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLm1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0aGlzLm1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBCaW5kIG1vdXNlIGV2ZW50czpcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLm1vdXNldXAsIGZhbHNlKTtcblxuXHRcdFx0XHR0aGlzLl9zdGF0ZS5pbkRyYWcgPSB0cnVlO1xuXHRcdFx0XHR2YXIgbmV3VmFsdWUgPSB0aGlzLl9jYWxjdWxhdGVWYWx1ZSgpO1xuXG5cdFx0XHRcdHRoaXMuX3RyaWdnZXIoJ3NsaWRlU3RhcnQnLCBuZXdWYWx1ZSk7XG5cblx0XHRcdFx0dGhpcy5fc2V0RGF0YVZhbChuZXdWYWx1ZSk7XG5cdFx0XHRcdHRoaXMuc2V0VmFsdWUobmV3VmFsdWUsIGZhbHNlLCB0cnVlKTtcblxuXHRcdFx0XHR0aGlzLl9wYXVzZUV2ZW50KGV2KTtcblxuXHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLmZvY3VzKSB7XG5cdFx0XHRcdFx0dGhpcy5fdHJpZ2dlckZvY3VzT25IYW5kbGUodGhpcy5fc3RhdGUuZHJhZ2dlZCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH0sXG5cdFx0XHRfdHJpZ2dlckZvY3VzT25IYW5kbGU6IGZ1bmN0aW9uKGhhbmRsZUlkeCkge1xuXHRcdFx0XHRpZihoYW5kbGVJZHggPT09IDApIHtcblx0XHRcdFx0XHR0aGlzLmhhbmRsZTEuZm9jdXMoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihoYW5kbGVJZHggPT09IDEpIHtcblx0XHRcdFx0XHR0aGlzLmhhbmRsZTIuZm9jdXMoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdF9rZXlkb3duOiBmdW5jdGlvbihoYW5kbGVJZHgsIGV2KSB7XG5cdFx0XHRcdGlmKCF0aGlzLl9zdGF0ZS5lbmFibGVkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGRpcjtcblx0XHRcdFx0c3dpdGNoIChldi5rZXlDb2RlKSB7XG5cdFx0XHRcdFx0Y2FzZSAzNzogLy8gbGVmdFxuXHRcdFx0XHRcdGNhc2UgNDA6IC8vIGRvd25cblx0XHRcdFx0XHRcdGRpciA9IC0xO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAzOTogLy8gcmlnaHRcblx0XHRcdFx0XHRjYXNlIDM4OiAvLyB1cFxuXHRcdFx0XHRcdFx0ZGlyID0gMTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghZGlyKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gdXNlIG5hdHVyYWwgYXJyb3cga2V5cyBpbnN0ZWFkIG9mIGZyb20gbWluIHRvIG1heFxuXHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLm5hdHVyYWxfYXJyb3dfa2V5cykge1xuXHRcdFx0XHRcdHZhciBpZlZlcnRpY2FsQW5kTm90UmV2ZXJzZWQgPSAodGhpcy5vcHRpb25zLm9yaWVudGF0aW9uID09PSAndmVydGljYWwnICYmICF0aGlzLm9wdGlvbnMucmV2ZXJzZWQpO1xuXHRcdFx0XHRcdHZhciBpZkhvcml6b250YWxBbmRSZXZlcnNlZCA9ICh0aGlzLm9wdGlvbnMub3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyAmJiB0aGlzLm9wdGlvbnMucmV2ZXJzZWQpO1xuXG5cdFx0XHRcdFx0aWYgKGlmVmVydGljYWxBbmROb3RSZXZlcnNlZCB8fCBpZkhvcml6b250YWxBbmRSZXZlcnNlZCkge1xuXHRcdFx0XHRcdFx0ZGlyID0gLWRpcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgdmFsID0gdGhpcy5fc3RhdGUudmFsdWVbaGFuZGxlSWR4XSArIGRpciAqIHRoaXMub3B0aW9ucy5zdGVwO1xuXHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLnJhbmdlKSB7XG5cdFx0XHRcdFx0dmFsID0gWyAoIWhhbmRsZUlkeCkgPyB2YWwgOiB0aGlzLl9zdGF0ZS52YWx1ZVswXSxcblx0XHRcdFx0XHRcdCAgICAoIGhhbmRsZUlkeCkgPyB2YWwgOiB0aGlzLl9zdGF0ZS52YWx1ZVsxXV07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLl90cmlnZ2VyKCdzbGlkZVN0YXJ0JywgdmFsKTtcblx0XHRcdFx0dGhpcy5fc2V0RGF0YVZhbCh2YWwpO1xuXHRcdFx0XHR0aGlzLnNldFZhbHVlKHZhbCwgdHJ1ZSwgdHJ1ZSk7XG5cblx0XHRcdFx0dGhpcy5fc2V0RGF0YVZhbCh2YWwpO1xuXHRcdFx0XHR0aGlzLl90cmlnZ2VyKCdzbGlkZVN0b3AnLCB2YWwpO1xuXHRcdFx0XHR0aGlzLl9sYXlvdXQoKTtcblxuXHRcdFx0XHR0aGlzLl9wYXVzZUV2ZW50KGV2KTtcblxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9LFxuXHRcdFx0X3BhdXNlRXZlbnQ6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdGlmKGV2LnN0b3BQcm9wYWdhdGlvbikge1xuXHRcdFx0XHRcdGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0XHR9XG5cdFx0XHQgICAgaWYoZXYucHJldmVudERlZmF1bHQpIHtcblx0XHRcdCAgICBcdGV2LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHQgICAgfVxuXHRcdFx0ICAgIGV2LmNhbmNlbEJ1YmJsZT10cnVlO1xuXHRcdFx0ICAgIGV2LnJldHVyblZhbHVlPWZhbHNlO1xuXHRcdFx0fSxcblx0XHRcdF9tb3VzZW1vdmU6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdGlmKCF0aGlzLl9zdGF0ZS5lbmFibGVkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIHBlcmNlbnRhZ2UgPSB0aGlzLl9nZXRQZXJjZW50YWdlKGV2KTtcblx0XHRcdFx0dGhpcy5fYWRqdXN0UGVyY2VudGFnZUZvclJhbmdlU2xpZGVycyhwZXJjZW50YWdlKTtcblx0XHRcdFx0dGhpcy5fc3RhdGUucGVyY2VudGFnZVt0aGlzLl9zdGF0ZS5kcmFnZ2VkXSA9IHBlcmNlbnRhZ2U7XG5cdFx0XHRcdHRoaXMuX2xheW91dCgpO1xuXG5cdFx0XHRcdHZhciB2YWwgPSB0aGlzLl9jYWxjdWxhdGVWYWx1ZSh0cnVlKTtcblx0XHRcdFx0dGhpcy5zZXRWYWx1ZSh2YWwsIHRydWUsIHRydWUpO1xuXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH0sXG5cdFx0XHRfYWRqdXN0UGVyY2VudGFnZUZvclJhbmdlU2xpZGVyczogZnVuY3Rpb24ocGVyY2VudGFnZSkge1xuXHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLnJhbmdlKSB7XG5cdFx0XHRcdFx0dmFyIHByZWNpc2lvbiA9IHRoaXMuX2dldE51bURpZ2l0c0FmdGVyRGVjaW1hbFBsYWNlKHBlcmNlbnRhZ2UpO1xuXHRcdFx0XHRcdHByZWNpc2lvbiA9IHByZWNpc2lvbiA/IHByZWNpc2lvbiAtIDEgOiAwO1xuXHRcdFx0XHRcdHZhciBwZXJjZW50YWdlV2l0aEFkanVzdGVkUHJlY2lzaW9uID0gdGhpcy5fYXBwbHlUb0ZpeGVkQW5kUGFyc2VGbG9hdChwZXJjZW50YWdlLCBwcmVjaXNpb24pO1xuXHRcdFx0XHRcdGlmICh0aGlzLl9zdGF0ZS5kcmFnZ2VkID09PSAwICYmIHRoaXMuX2FwcGx5VG9GaXhlZEFuZFBhcnNlRmxvYXQodGhpcy5fc3RhdGUucGVyY2VudGFnZVsxXSwgcHJlY2lzaW9uKSA8IHBlcmNlbnRhZ2VXaXRoQWRqdXN0ZWRQcmVjaXNpb24pIHtcblx0XHRcdFx0XHRcdHRoaXMuX3N0YXRlLnBlcmNlbnRhZ2VbMF0gPSB0aGlzLl9zdGF0ZS5wZXJjZW50YWdlWzFdO1xuXHRcdFx0XHRcdFx0dGhpcy5fc3RhdGUuZHJhZ2dlZCA9IDE7XG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0aGlzLl9zdGF0ZS5kcmFnZ2VkID09PSAxICYmIHRoaXMuX2FwcGx5VG9GaXhlZEFuZFBhcnNlRmxvYXQodGhpcy5fc3RhdGUucGVyY2VudGFnZVswXSwgcHJlY2lzaW9uKSA+IHBlcmNlbnRhZ2VXaXRoQWRqdXN0ZWRQcmVjaXNpb24pIHtcblx0XHRcdFx0XHRcdHRoaXMuX3N0YXRlLnBlcmNlbnRhZ2VbMV0gPSB0aGlzLl9zdGF0ZS5wZXJjZW50YWdlWzBdO1xuXHRcdFx0XHRcdFx0dGhpcy5fc3RhdGUuZHJhZ2dlZCA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0X21vdXNldXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZighdGhpcy5fc3RhdGUuZW5hYmxlZCkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodGhpcy50b3VjaENhcGFibGUpIHtcblx0XHRcdFx0XHQvLyBUb3VjaDogVW5iaW5kIHRvdWNoIGV2ZW50IGhhbmRsZXJzOlxuXHRcdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy5tb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgdGhpcy5tb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdH1cbiAgICAgICAgICAgICAgICAvLyBVbmJpbmQgbW91c2UgZXZlbnQgaGFuZGxlcnM6XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm1vdXNlbW92ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIHRoaXMubW91c2V1cCwgZmFsc2UpO1xuXG5cdFx0XHRcdHRoaXMuX3N0YXRlLmluRHJhZyA9IGZhbHNlO1xuXHRcdFx0XHRpZiAodGhpcy5fc3RhdGUub3ZlciA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHR0aGlzLl9oaWRlVG9vbHRpcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciB2YWwgPSB0aGlzLl9jYWxjdWxhdGVWYWx1ZSh0cnVlKTtcblxuXHRcdFx0XHR0aGlzLl9sYXlvdXQoKTtcblx0XHRcdFx0dGhpcy5fc2V0RGF0YVZhbCh2YWwpO1xuXHRcdFx0XHR0aGlzLl90cmlnZ2VyKCdzbGlkZVN0b3AnLCB2YWwpO1xuXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH0sXG5cdFx0XHRfY2FsY3VsYXRlVmFsdWU6IGZ1bmN0aW9uKHNuYXBUb0Nsb3Nlc3RUaWNrKSB7XG5cdFx0XHRcdHZhciB2YWw7XG5cdFx0XHRcdGlmICh0aGlzLm9wdGlvbnMucmFuZ2UpIHtcblx0XHRcdFx0XHR2YWwgPSBbdGhpcy5vcHRpb25zLm1pbix0aGlzLm9wdGlvbnMubWF4XTtcblx0XHRcdCAgICAgICAgaWYgKHRoaXMuX3N0YXRlLnBlcmNlbnRhZ2VbMF0gIT09IDApe1xuXHRcdFx0ICAgICAgICAgICAgdmFsWzBdID0gdGhpcy5fdG9WYWx1ZSh0aGlzLl9zdGF0ZS5wZXJjZW50YWdlWzBdKTtcblx0XHRcdCAgICAgICAgICAgIHZhbFswXSA9IHRoaXMuX2FwcGx5UHJlY2lzaW9uKHZhbFswXSk7XG5cdFx0XHQgICAgICAgIH1cblx0XHRcdCAgICAgICAgaWYgKHRoaXMuX3N0YXRlLnBlcmNlbnRhZ2VbMV0gIT09IDEwMCl7XG5cdFx0XHQgICAgICAgICAgICB2YWxbMV0gPSB0aGlzLl90b1ZhbHVlKHRoaXMuX3N0YXRlLnBlcmNlbnRhZ2VbMV0pO1xuXHRcdFx0ICAgICAgICAgICAgdmFsWzFdID0gdGhpcy5fYXBwbHlQcmVjaXNpb24odmFsWzFdKTtcblx0XHRcdCAgICAgICAgfVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdCAgICAgICAgICAgIHZhbCA9IHRoaXMuX3RvVmFsdWUodGhpcy5fc3RhdGUucGVyY2VudGFnZVswXSk7XG5cdFx0XHRcdFx0dmFsID0gcGFyc2VGbG9hdCh2YWwpO1xuXHRcdFx0XHRcdHZhbCA9IHRoaXMuX2FwcGx5UHJlY2lzaW9uKHZhbCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoc25hcFRvQ2xvc2VzdFRpY2spIHtcblx0XHRcdFx0XHR2YXIgbWluID0gW3ZhbCwgSW5maW5pdHldO1xuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLnRpY2tzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHR2YXIgZGlmZiA9IE1hdGguYWJzKHRoaXMub3B0aW9ucy50aWNrc1tpXSAtIHZhbCk7XG5cdFx0XHRcdFx0XHRpZiAoZGlmZiA8PSBtaW5bMV0pIHtcblx0XHRcdFx0XHRcdFx0bWluID0gW3RoaXMub3B0aW9ucy50aWNrc1tpXSwgZGlmZl07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChtaW5bMV0gPD0gdGhpcy5vcHRpb25zLnRpY2tzX3NuYXBfYm91bmRzKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gbWluWzBdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB2YWw7XG5cdFx0XHR9LFxuXHRcdFx0X2FwcGx5UHJlY2lzaW9uOiBmdW5jdGlvbih2YWwpIHtcblx0XHRcdFx0dmFyIHByZWNpc2lvbiA9IHRoaXMub3B0aW9ucy5wcmVjaXNpb24gfHwgdGhpcy5fZ2V0TnVtRGlnaXRzQWZ0ZXJEZWNpbWFsUGxhY2UodGhpcy5vcHRpb25zLnN0ZXApO1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5fYXBwbHlUb0ZpeGVkQW5kUGFyc2VGbG9hdCh2YWwsIHByZWNpc2lvbik7XG5cdFx0XHR9LFxuXHRcdFx0X2dldE51bURpZ2l0c0FmdGVyRGVjaW1hbFBsYWNlOiBmdW5jdGlvbihudW0pIHtcblx0XHRcdFx0dmFyIG1hdGNoID0gKCcnK251bSkubWF0Y2goLyg/OlxcLihcXGQrKSk/KD86W2VFXShbKy1dP1xcZCspKT8kLyk7XG5cdFx0XHRcdGlmICghbWF0Y2gpIHsgcmV0dXJuIDA7IH1cblx0XHRcdFx0cmV0dXJuIE1hdGgubWF4KDAsIChtYXRjaFsxXSA/IG1hdGNoWzFdLmxlbmd0aCA6IDApIC0gKG1hdGNoWzJdID8gK21hdGNoWzJdIDogMCkpO1xuXHRcdFx0fSxcblx0XHRcdF9hcHBseVRvRml4ZWRBbmRQYXJzZUZsb2F0OiBmdW5jdGlvbihudW0sIHRvRml4ZWRJbnB1dCkge1xuXHRcdFx0XHR2YXIgdHJ1bmNhdGVkTnVtID0gbnVtLnRvRml4ZWQodG9GaXhlZElucHV0KTtcblx0XHRcdFx0cmV0dXJuIHBhcnNlRmxvYXQodHJ1bmNhdGVkTnVtKTtcblx0XHRcdH0sXG5cdFx0XHQvKlxuXHRcdFx0XHRDcmVkaXRzIHRvIE1pa2UgU2FtdWVsIGZvciB0aGUgZm9sbG93aW5nIG1ldGhvZCFcblx0XHRcdFx0U291cmNlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNDU0NTE4L2phdmFzY3JpcHQtaG93LXRvLXJldHJpZXZlLXRoZS1udW1iZXItb2YtZGVjaW1hbHMtb2YtYS1zdHJpbmctbnVtYmVyXG5cdFx0XHQqL1xuXHRcdFx0X2dldFBlcmNlbnRhZ2U6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdGlmICh0aGlzLnRvdWNoQ2FwYWJsZSAmJiAoZXYudHlwZSA9PT0gJ3RvdWNoc3RhcnQnIHx8IGV2LnR5cGUgPT09ICd0b3VjaG1vdmUnKSkge1xuXHRcdFx0XHRcdGV2ID0gZXYudG91Y2hlc1swXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBldmVudFBvc2l0aW9uID0gZXZbdGhpcy5tb3VzZVBvc107XG5cdFx0XHRcdHZhciBzbGlkZXJPZmZzZXQgPSB0aGlzLl9zdGF0ZS5vZmZzZXRbdGhpcy5zdHlsZVBvc107XG5cdFx0XHRcdHZhciBkaXN0YW5jZVRvU2xpZGUgPSBldmVudFBvc2l0aW9uIC0gc2xpZGVyT2Zmc2V0O1xuXHRcdFx0XHQvLyBDYWxjdWxhdGUgd2hhdCBwZXJjZW50IG9mIHRoZSBsZW5ndGggdGhlIHNsaWRlciBoYW5kbGUgaGFzIHNsaWRcblx0XHRcdFx0dmFyIHBlcmNlbnRhZ2UgPSAoZGlzdGFuY2VUb1NsaWRlIC8gdGhpcy5fc3RhdGUuc2l6ZSkgKiAxMDA7XG5cdFx0XHRcdHBlcmNlbnRhZ2UgPSBNYXRoLnJvdW5kKHBlcmNlbnRhZ2UgLyB0aGlzLl9zdGF0ZS5wZXJjZW50YWdlWzJdKSAqIHRoaXMuX3N0YXRlLnBlcmNlbnRhZ2VbMl07XG5cdFx0XHRcdGlmICh0aGlzLm9wdGlvbnMucmV2ZXJzZWQpIHtcblx0XHRcdFx0XHRwZXJjZW50YWdlID0gMTAwIC0gcGVyY2VudGFnZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIE1ha2Ugc3VyZSB0aGUgcGVyY2VudCBpcyB3aXRoaW4gdGhlIGJvdW5kcyBvZiB0aGUgc2xpZGVyLlxuXHRcdFx0XHQvLyAwJSBjb3JyZXNwb25kcyB0byB0aGUgJ21pbicgdmFsdWUgb2YgdGhlIHNsaWRlXG5cdFx0XHRcdC8vIDEwMCUgY29ycmVzcG9uZHMgdG8gdGhlICdtYXgnIHZhbHVlIG9mIHRoZSBzbGlkZVxuXHRcdFx0XHRyZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCBwZXJjZW50YWdlKSk7XG5cdFx0XHR9LFxuXHRcdFx0X3ZhbGlkYXRlSW5wdXRWYWx1ZTogZnVuY3Rpb24odmFsKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuXHRcdFx0XHRcdHJldHVybiB2YWw7XG5cdFx0XHRcdH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG5cdFx0XHRcdFx0dGhpcy5fdmFsaWRhdGVBcnJheSh2YWwpO1xuXHRcdFx0XHRcdHJldHVybiB2YWw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCBFcnJvck1zZ3MuZm9ybWF0SW52YWxpZElucHV0RXJyb3JNc2codmFsKSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0X3ZhbGlkYXRlQXJyYXk6IGZ1bmN0aW9uKHZhbCkge1xuXHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0dmFyIGlucHV0ID0gIHZhbFtpXTtcblx0XHRcdFx0XHRpZiAodHlwZW9mIGlucHV0ICE9PSAnbnVtYmVyJykgeyB0aHJvdyBuZXcgRXJyb3IoIEVycm9yTXNncy5mb3JtYXRJbnZhbGlkSW5wdXRFcnJvck1zZyhpbnB1dCkgKTsgfVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0X3NldERhdGFWYWw6IGZ1bmN0aW9uKHZhbCkge1xuXHRcdFx0XHR0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLXZhbHVlJywgdmFsKTtcblx0XHRcdFx0dGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWwpO1xuICAgICAgICB0aGlzLmVsZW1lbnQudmFsdWUgPSB2YWw7XG5cdFx0XHR9LFxuXHRcdFx0X3RyaWdnZXI6IGZ1bmN0aW9uKGV2dCwgdmFsKSB7XG5cdFx0XHRcdHZhbCA9ICh2YWwgfHwgdmFsID09PSAwKSA/IHZhbCA6IHVuZGVmaW5lZDtcblxuXHRcdFx0XHR2YXIgY2FsbGJhY2tGbkFycmF5ID0gdGhpcy5ldmVudFRvQ2FsbGJhY2tNYXBbZXZ0XTtcblx0XHRcdFx0aWYoY2FsbGJhY2tGbkFycmF5ICYmIGNhbGxiYWNrRm5BcnJheS5sZW5ndGgpIHtcblx0XHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tGbkFycmF5Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHR2YXIgY2FsbGJhY2tGbiA9IGNhbGxiYWNrRm5BcnJheVtpXTtcblx0XHRcdFx0XHRcdGNhbGxiYWNrRm4odmFsKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKiBJZiBKUXVlcnkgZXhpc3RzLCB0cmlnZ2VyIEpRdWVyeSBldmVudHMgKi9cblx0XHRcdFx0aWYoJCkge1xuXHRcdFx0XHRcdHRoaXMuX3RyaWdnZXJKUXVlcnlFdmVudChldnQsIHZhbCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRfdHJpZ2dlckpRdWVyeUV2ZW50OiBmdW5jdGlvbihldnQsIHZhbCkge1xuXHRcdFx0XHR2YXIgZXZlbnREYXRhID0ge1xuXHRcdFx0XHRcdHR5cGU6IGV2dCxcblx0XHRcdFx0XHR2YWx1ZTogdmFsXG5cdFx0XHRcdH07XG5cdFx0XHRcdHRoaXMuJGVsZW1lbnQudHJpZ2dlcihldmVudERhdGEpO1xuXHRcdFx0XHR0aGlzLiRzbGlkZXJFbGVtLnRyaWdnZXIoZXZlbnREYXRhKTtcblx0XHRcdH0sXG5cdFx0XHRfdW5iaW5kSlF1ZXJ5RXZlbnRIYW5kbGVyczogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRoaXMuJGVsZW1lbnQub2ZmKCk7XG5cdFx0XHRcdHRoaXMuJHNsaWRlckVsZW0ub2ZmKCk7XG5cdFx0XHR9LFxuXHRcdFx0X3NldFRleHQ6IGZ1bmN0aW9uKGVsZW1lbnQsIHRleHQpIHtcblx0XHRcdFx0aWYodHlwZW9mIGVsZW1lbnQuaW5uZXJUZXh0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHQgXHRcdGVsZW1lbnQuaW5uZXJUZXh0ID0gdGV4dDtcblx0XHRcdCBcdH0gZWxzZSBpZih0eXBlb2YgZWxlbWVudC50ZXh0Q29udGVudCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0IFx0XHRlbGVtZW50LnRleHRDb250ZW50ID0gdGV4dDtcblx0XHRcdCBcdH1cblx0XHRcdH0sXG5cdFx0XHRfcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzU3RyaW5nKSB7XG5cdFx0XHRcdHZhciBjbGFzc2VzID0gY2xhc3NTdHJpbmcuc3BsaXQoXCIgXCIpO1xuXHRcdFx0XHR2YXIgbmV3Q2xhc3NlcyA9IGVsZW1lbnQuY2xhc3NOYW1lO1xuXG5cdFx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBjbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0dmFyIGNsYXNzVGFnID0gY2xhc3Nlc1tpXTtcblx0XHRcdFx0XHR2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiKD86XFxcXHN8XilcIiArIGNsYXNzVGFnICsgXCIoPzpcXFxcc3wkKVwiKTtcblx0XHRcdFx0XHRuZXdDbGFzc2VzID0gbmV3Q2xhc3Nlcy5yZXBsYWNlKHJlZ2V4LCBcIiBcIik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlbGVtZW50LmNsYXNzTmFtZSA9IG5ld0NsYXNzZXMudHJpbSgpO1xuXHRcdFx0fSxcblx0XHRcdF9hZGRDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NTdHJpbmcpIHtcblx0XHRcdFx0dmFyIGNsYXNzZXMgPSBjbGFzc1N0cmluZy5zcGxpdChcIiBcIik7XG5cdFx0XHRcdHZhciBuZXdDbGFzc2VzID0gZWxlbWVudC5jbGFzc05hbWU7XG5cblx0XHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHR2YXIgY2xhc3NUYWcgPSBjbGFzc2VzW2ldO1xuXHRcdFx0XHRcdHZhciByZWdleCA9IG5ldyBSZWdFeHAoXCIoPzpcXFxcc3xeKVwiICsgY2xhc3NUYWcgKyBcIig/OlxcXFxzfCQpXCIpO1xuXHRcdFx0XHRcdHZhciBpZkNsYXNzRXhpc3RzID0gcmVnZXgudGVzdChuZXdDbGFzc2VzKTtcblxuXHRcdFx0XHRcdGlmKCFpZkNsYXNzRXhpc3RzKSB7XG5cdFx0XHRcdFx0XHRuZXdDbGFzc2VzICs9IFwiIFwiICsgY2xhc3NUYWc7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWxlbWVudC5jbGFzc05hbWUgPSBuZXdDbGFzc2VzLnRyaW0oKTtcblx0XHRcdH0sXG5cdFx0XHRfb2Zmc2V0TGVmdDogZnVuY3Rpb24ob2JqKXtcblx0XHRcdFx0cmV0dXJuIG9iai5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0O1xuXHRcdFx0fSxcblx0XHRcdF9vZmZzZXRUb3A6IGZ1bmN0aW9uKG9iail7XG5cdFx0XHRcdHZhciBvZmZzZXRUb3AgPSBvYmoub2Zmc2V0VG9wO1xuXHRcdFx0XHR3aGlsZSgob2JqID0gb2JqLm9mZnNldFBhcmVudCkgJiYgIWlzTmFOKG9iai5vZmZzZXRUb3ApKXtcblx0XHRcdFx0XHRvZmZzZXRUb3AgKz0gb2JqLm9mZnNldFRvcDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gb2Zmc2V0VG9wO1xuXHRcdFx0fSxcblx0XHQgICAgX29mZnNldDogZnVuY3Rpb24gKG9iaikge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGxlZnQ6IHRoaXMuX29mZnNldExlZnQob2JqKSxcblx0XHRcdFx0XHR0b3A6IHRoaXMuX29mZnNldFRvcChvYmopXG5cdFx0XHRcdH07XG5cdFx0ICAgIH0sXG5cdFx0XHRfY3NzOiBmdW5jdGlvbihlbGVtZW50UmVmLCBzdHlsZU5hbWUsIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5zdHlsZShlbGVtZW50UmVmLCBzdHlsZU5hbWUsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3R5bGUgPSBzdHlsZU5hbWUucmVwbGFjZSgvXi1tcy0vLCBcIm1zLVwiKS5yZXBsYWNlKC8tKFtcXGRhLXpdKS9naSwgZnVuY3Rpb24gKGFsbCwgbGV0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGV0dGVyLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50UmVmLnN0eWxlW3N0eWxlXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cblx0XHRcdH0sXG5cdFx0XHRfdG9WYWx1ZTogZnVuY3Rpb24ocGVyY2VudGFnZSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25zLnNjYWxlLnRvVmFsdWUuYXBwbHkodGhpcywgW3BlcmNlbnRhZ2VdKTtcblx0XHRcdH0sXG5cdFx0XHRfdG9QZXJjZW50YWdlOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25zLnNjYWxlLnRvUGVyY2VudGFnZS5hcHBseSh0aGlzLCBbdmFsdWVdKTtcblx0XHRcdH0sXG5cdFx0XHRfc2V0VG9vbHRpcFBvc2l0aW9uOiBmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgdG9vbHRpcHMgPSBbdGhpcy50b29sdGlwLCB0aGlzLnRvb2x0aXBfbWluLCB0aGlzLnRvb2x0aXBfbWF4XTtcblx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy5vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJyl7XG5cdFx0XHRcdFx0dmFyIHRvb2x0aXBQb3MgPSB0aGlzLm9wdGlvbnMudG9vbHRpcF9wb3NpdGlvbiB8fCAncmlnaHQnO1xuXHRcdFx0XHRcdHZhciBvcHBvc2l0ZVNpZGUgPSAodG9vbHRpcFBvcyA9PT0gJ2xlZnQnKSA/ICdyaWdodCcgOiAnbGVmdCc7XG5cdFx0XHRcdFx0dG9vbHRpcHMuZm9yRWFjaChmdW5jdGlvbih0b29sdGlwKXtcblx0XHRcdFx0XHRcdHRoaXMuX2FkZENsYXNzKHRvb2x0aXAsIHRvb2x0aXBQb3MpO1xuXHRcdFx0XHRcdFx0dG9vbHRpcC5zdHlsZVtvcHBvc2l0ZVNpZGVdID0gJzEwMCUnO1xuXHRcdFx0XHRcdH0uYmluZCh0aGlzKSk7XG5cdFx0XHRcdH0gZWxzZSBpZih0aGlzLm9wdGlvbnMudG9vbHRpcF9wb3NpdGlvbiA9PT0gJ2JvdHRvbScpIHtcblx0XHRcdFx0XHR0b29sdGlwcy5mb3JFYWNoKGZ1bmN0aW9uKHRvb2x0aXApe1xuXHRcdFx0XHRcdFx0dGhpcy5fYWRkQ2xhc3ModG9vbHRpcCwgJ2JvdHRvbScpO1xuXHRcdFx0XHRcdFx0dG9vbHRpcC5zdHlsZS50b3AgPSAyMiArICdweCc7XG5cdFx0XHRcdFx0fS5iaW5kKHRoaXMpKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0b29sdGlwcy5mb3JFYWNoKGZ1bmN0aW9uKHRvb2x0aXApe1xuXHRcdFx0XHRcdFx0dGhpcy5fYWRkQ2xhc3ModG9vbHRpcCwgJ3RvcCcpO1xuXHRcdFx0XHRcdFx0dG9vbHRpcC5zdHlsZS50b3AgPSAtdGhpcy50b29sdGlwLm91dGVySGVpZ2h0IC0gMTQgKyAncHgnO1xuXHRcdFx0XHRcdH0uYmluZCh0aGlzKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG5cdFx0XHRBdHRhY2ggdG8gZ2xvYmFsIG5hbWVzcGFjZVxuXG5cdFx0KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXHRcdGlmKCQpIHtcblx0XHRcdHZhciBuYW1lc3BhY2UgPSAkLmZuLnNsaWRlciA/ICdib290c3RyYXBTbGlkZXInIDogJ3NsaWRlcic7XG5cdFx0XHQkLmJyaWRnZXQobmFtZXNwYWNlLCBTbGlkZXIpO1xuXHRcdH1cblxuXHR9KSggJCApO1xuXG5cdHJldHVybiBTbGlkZXI7XG59KSk7XG4iXX0=

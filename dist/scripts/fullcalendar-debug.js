/*!
 * FullCalendar v2.2.5
 * Docs & License: http://arshaw.com/fullcalendar/
 * (c) 2013 Adam Shaw
 */

(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'jquery', 'moment' ], factory);
	}
	else {
		factory(jQuery, moment);
	}
})(function($, moment) {

    var defaults = {

	titleRangeSeparator: ' \u2014 ', // emphasized dash
	monthYearFormat: 'MMMM YYYY', // required for en. other languages rely on datepicker computable option

	defaultTimedEventDuration: '02:00:00',
	defaultAllDayEventDuration: { days: 1 },
	forceEventDuration: false,
	nextDayThreshold: '09:00:00', // 9am

	// display
	defaultView: 'month',
	aspectRatio: 1.35,
	header: {
		left: 'title',
		center: '',
		right: 'today prev,next'
	},
	weekends: true,
	weekNumbers: false,

	weekNumberTitle: 'W',
	weekNumberCalculation: 'local',
	
	//editable: false,
	
	// event ajax
	lazyFetching: true,
	startParam: 'start',
	endParam: 'end',
	timezoneParam: 'timezone',

	timezone: false,

	//allDayDefault: undefined,

	// locale
	isRTL: false,
	defaultButtonText: {
		prev: "prev",
		next: "next",
		prevYear: "prev year",
		nextYear: "next year",
		today: 'today',
		month: 'month',
		week: 'week',
		day: 'day'
	},

	buttonIcons: {
		prev: 'left-single-arrow',
		next: 'right-single-arrow',
		prevYear: 'left-double-arrow',
		nextYear: 'right-double-arrow'
	},
	
	// jquery-ui theming
	theme: false,
	themeButtonIcons: {
		prev: 'circle-triangle-w',
		next: 'circle-triangle-e',
		prevYear: 'seek-prev',
		nextYear: 'seek-next'
	},

	dragOpacity: .75,
	dragRevertDuration: 500,
	dragScroll: true,
	
	//selectable: false,
	unselectAuto: true,
	
	dropAccept: '*',

	eventLimit: false,
	eventLimitText: 'more',
	eventLimitClick: 'popover',
	dayPopoverFormat: 'LL',
	
	handleWindowResize: true,
	windowResizeDelay: 200 // milliseconds before an updateSize happens
	
};


var englishDefaults = {
	dayPopoverFormat: 'dddd, MMMM D'
};


// right-to-left defaults
var rtlDefaults = {
	header: {
		left: 'next,prev today',
		center: '',
		right: 'title'
	},
	buttonIcons: {
		prev: 'right-single-arrow',
		next: 'left-single-arrow',
		prevYear: 'right-double-arrow',
		nextYear: 'left-double-arrow'
	},
	themeButtonIcons: {
		prev: 'circle-triangle-e',
		next: 'circle-triangle-w',
		nextYear: 'seek-prev',
		prevYear: 'seek-next'
	}
};

    var fc = $.fullCalendar = { version: "2.2.5" };
var fcViews = fc.views = {};


$.fn.fullCalendar = function(options) {
	var args = Array.prototype.slice.call(arguments, 1); // for a possible method call
	var res = this; // what this function will return (this jQuery object by default)

	this.each(function(i, _element) { // loop each DOM element involved
		var element = $(_element);
		var calendar = element.data('fullCalendar'); // get the existing calendar object (if any)
		var singleRes; // the returned value of this single method call

		// a method call
		if (typeof options === 'string') {
			if (calendar && $.isFunction(calendar[options])) {
				singleRes = calendar[options].apply(calendar, args);
				if (!i) {
					res = singleRes; // record the first method call result
				}
				if (options === 'destroy') { // for the destroy method, must remove Calendar object data
					element.removeData('fullCalendar');
				}
			}
		}
		// a new calendar initialization
		else if (!calendar) { // don't initialize twice
			calendar = new Calendar(element, options);
			element.data('fullCalendar', calendar);
			calendar.render();
		}
	});
	
	return res;
};


// function for adding/overriding defaults
function setDefaults(d) {
	mergeOptions(defaults, d);
}


// Recursively combines option hash-objects.
// Better than `$.extend(true, ...)` because arrays are not traversed/copied.
//
// called like:
//     mergeOptions(target, obj1, obj2, ...)
//
function mergeOptions(target) {

	function mergeIntoTarget(name, value) {
		if ($.isPlainObject(value) && $.isPlainObject(target[name]) && !isForcedAtomicOption(name)) {
			// merge into a new object to avoid destruction
			target[name] = mergeOptions({}, target[name], value); // combine. `value` object takes precedence
		}
		else if (value !== undefined) { // only use values that are set and not undefined
			target[name] = value;
		}
	}

	for (var i=1; i<arguments.length; i++) {
		$.each(arguments[i], mergeIntoTarget);
	}

	return target;
}


// overcome sucky view-option-hash and option-merging behavior messing with options it shouldn't
function isForcedAtomicOption(name) {
	// Any option that ends in "Time" or "Duration" is probably a Duration,
	// and these will commonly be specified as plain objects, which we don't want to mess up.
	return /(Time|Duration)$/.test(name);
}
// FIX: find a different solution for view-option-hashes and have a whitelist
// for options that can be recursively merged.

    var langOptionHash = fc.langs = {}; // initialize and expose


// TODO: document the structure and ordering of a FullCalendar lang file
// TODO: rename everything "lang" to "locale", like what the moment project did


// Initialize jQuery UI datepicker translations while using some of the translations
// Will set this as the default language for datepicker.
fc.datepickerLang = function(langCode, dpLangCode, dpOptions) {

	// get the FullCalendar internal option hash for this language. create if necessary
	var fcOptions = langOptionHash[langCode] || (langOptionHash[langCode] = {});

	// transfer some simple options from datepicker to fc
	fcOptions.isRTL = dpOptions.isRTL;
	fcOptions.weekNumberTitle = dpOptions.weekHeader;

	// compute some more complex options from datepicker
	$.each(dpComputableOptions, function(name, func) {
		fcOptions[name] = func(dpOptions);
	});

	// is jQuery UI Datepicker is on the page?
	if ($.datepicker) {

		// Register the language data.
		// FullCalendar and MomentJS use language codes like "pt-br" but Datepicker
		// does it like "pt-BR" or if it doesn't have the language, maybe just "pt".
		// Make an alias so the language can be referenced either way.
		$.datepicker.regional[dpLangCode] =
			$.datepicker.regional[langCode] = // alias
				dpOptions;

		// Alias 'en' to the default language data. Do this every time.
		$.datepicker.regional.en = $.datepicker.regional[''];

		// Set as Datepicker's global defaults.
		$.datepicker.setDefaults(dpOptions);
	}
};


// Sets FullCalendar-specific translations. Will set the language as the global default.
fc.lang = function(langCode, newFcOptions) {
	var fcOptions;
	var momOptions;

	// get the FullCalendar internal option hash for this language. create if necessary
	fcOptions = langOptionHash[langCode] || (langOptionHash[langCode] = {});

	// provided new options for this language? merge them in
	if (newFcOptions) {
		mergeOptions(fcOptions, newFcOptions);
	}

	// compute language options that weren't defined.
	// always do this. newFcOptions can be undefined when initializing from i18n file,
	// so no way to tell if this is an initialization or a default-setting.
	momOptions = getMomentLocaleData(langCode); // will fall back to en
	$.each(momComputableOptions, function(name, func) {
		if (fcOptions[name] === undefined) {
			fcOptions[name] = func(momOptions, fcOptions);
		}
	});

	// set it as the default language for FullCalendar
	defaults.lang = langCode;
};


// NOTE: can't guarantee any of these computations will run because not every language has datepicker
// configs, so make sure there are English fallbacks for these in the defaults file.
var dpComputableOptions = {

	defaultButtonText: function(dpOptions) {
		return {
			// the translations sometimes wrongly contain HTML entities
			prev: stripHtmlEntities(dpOptions.prevText),
			next: stripHtmlEntities(dpOptions.nextText),
			today: stripHtmlEntities(dpOptions.currentText)
		};
	},

	// Produces format strings like "MMMM YYYY" -> "September 2014"
	monthYearFormat: function(dpOptions) {
		return dpOptions.showMonthAfterYear ?
			'YYYY[' + dpOptions.yearSuffix + '] MMMM' :
			'MMMM YYYY[' + dpOptions.yearSuffix + ']';
	}

};

var momComputableOptions = {

	// Produces format strings like "ddd MM/DD" -> "Fri 12/10"
	dayOfMonthFormat: function(momOptions, fcOptions) {
		var format = momOptions.longDateFormat('l'); // for the format like "M/D/YYYY"

		// strip the year off the edge, as well as other misc non-whitespace chars
		format = format.replace(/^Y+[^\w\s]*|[^\w\s]*Y+$/g, '');

		if (fcOptions.isRTL) {
			format += ' ddd'; // for RTL, add day-of-week to end
		}
		else {
			format = 'ddd ' + format; // for LTR, add day-of-week to beginning
		}
		return format;
	},

	// Produces format strings like "H(:mm)a" -> "6pm" or "6:30pm"
	smallTimeFormat: function(momOptions) {
		return momOptions.longDateFormat('LT')
			.replace(':mm', '(:mm)')
			.replace(/(\Wmm)$/, '($1)') // like above, but for foreign langs
			.replace(/\s*a$/i, 'a'); // convert AM/PM/am/pm to lowercase. remove any spaces beforehand
	},

	// Produces format strings like "H(:mm)t" -> "6p" or "6:30p"
	extraSmallTimeFormat: function(momOptions) {
		return momOptions.longDateFormat('LT')
			.replace(':mm', '(:mm)')
			.replace(/(\Wmm)$/, '($1)') // like above, but for foreign langs
			.replace(/\s*a$/i, 't'); // convert to AM/PM/am/pm to lowercase one-letter. remove any spaces beforehand
	},

	// Produces format strings like "H:mm" -> "6:30" (with no AM/PM)
	noMeridiemTimeFormat: function(momOptions) {
		return momOptions.longDateFormat('LT')
			.replace(/\s*a$/i, ''); // remove trailing AM/PM
	}

};


// Returns moment's internal locale data. If doesn't exist, returns English.
// Works with moment-pre-2.8
function getMomentLocaleData(langCode) {
	var func = moment.localeData || moment.langData;
	return func.call(moment, langCode) ||
		func.call(moment, 'en'); // the newer localData could return null, so fall back to en
}


// Initialize English by forcing computation of moment-derived options.
// Also, sets it as the default.
fc.lang('en', englishDefaults);

// exports
fc.intersectionToSeg = intersectionToSeg;
fc.applyAll = applyAll;
fc.debounce = debounce;


/* FullCalendar-specific DOM Utilities
----------------------------------------------------------------------------------------------------------------------*/


// Given the scrollbar widths of some other container, create borders/margins on rowEls in order to match the left
// and right space that was offset by the scrollbars. A 1-pixel border first, then margin beyond that.
function compensateScroll(rowEls, scrollbarWidths) {
	if (scrollbarWidths.left) {
		rowEls.css({
			'border-left-width': 1,
			'margin-left': scrollbarWidths.left - 1
		});
	}
	if (scrollbarWidths.right) {
		rowEls.css({
			'border-right-width': 1,
			'margin-right': scrollbarWidths.right - 1
		});
	}
}


// Undoes compensateScroll and restores all borders/margins
function uncompensateScroll(rowEls) {
	rowEls.css({
		'margin-left': '',
		'margin-right': '',
		'border-left-width': '',
		'border-right-width': ''
	});
}


// Make the mouse cursor express that an event is not allowed in the current area
function disableCursor() {
	$('body').addClass('fc-not-allowed');
}


// Returns the mouse cursor to its original look
function enableCursor() {
	$('body').removeClass('fc-not-allowed');
}


// Given a total available height to fill, have `els` (essentially child rows) expand to accomodate.
// By default, all elements that are shorter than the recommended height are expanded uniformly, not considering
// any other els that are already too tall. if `shouldRedistribute` is on, it considers these tall rows and 
// reduces the available height.
function distributeHeight(els, availableHeight, shouldRedistribute) {

	// *FLOORING NOTE*: we floor in certain places because zoom can give inaccurate floating-point dimensions,
	// and it is better to be shorter than taller, to avoid creating unnecessary scrollbars.

	var minOffset1 = Math.floor(availableHeight / els.length); // for non-last element
	var minOffset2 = Math.floor(availableHeight - minOffset1 * (els.length - 1)); // for last element *FLOORING NOTE*
	var flexEls = []; // elements that are allowed to expand. array of DOM nodes
	var flexOffsets = []; // amount of vertical space it takes up
	var flexHeights = []; // actual css height
	var usedHeight = 0;

	undistributeHeight(els); // give all elements their natural height

	// find elements that are below the recommended height (expandable).
	// important to query for heights in a single first pass (to avoid reflow oscillation).
	els.each(function(i, el) {
		var minOffset = i === els.length - 1 ? minOffset2 : minOffset1;
		var naturalOffset = $(el).outerHeight(true);

		if (naturalOffset < minOffset) {
			flexEls.push(el);
			flexOffsets.push(naturalOffset);
			flexHeights.push($(el).height());
		}
		else {
			// this element stretches past recommended height (non-expandable). mark the space as occupied.
			usedHeight += naturalOffset;
		}
	});

	// readjust the recommended height to only consider the height available to non-maxed-out rows.
	if (shouldRedistribute) {
		availableHeight -= usedHeight;
		minOffset1 = Math.floor(availableHeight / flexEls.length);
		minOffset2 = Math.floor(availableHeight - minOffset1 * (flexEls.length - 1)); // *FLOORING NOTE*
	}

	// assign heights to all expandable elements
	$(flexEls).each(function(i, el) {
		var minOffset = i === flexEls.length - 1 ? minOffset2 : minOffset1;
		var naturalOffset = flexOffsets[i];
		var naturalHeight = flexHeights[i];
		var newHeight = minOffset - (naturalOffset - naturalHeight); // subtract the margin/padding

		if (naturalOffset < minOffset) { // we check this again because redistribution might have changed things
			$(el).height(newHeight);
		}
	});
}


// Undoes distrubuteHeight, restoring all els to their natural height
function undistributeHeight(els) {
	els.height('');
}


// Given `els`, a jQuery set of <td> cells, find the cell with the largest natural width and set the widths of all the
// cells to be that width.
// PREREQUISITE: if you want a cell to take up width, it needs to have a single inner element w/ display:inline
function matchCellWidths(els) {
	var maxInnerWidth = 0;

	els.find('> *').each(function(i, innerEl) {
		var innerWidth = $(innerEl).outerWidth();
		if (innerWidth > maxInnerWidth) {
			maxInnerWidth = innerWidth;
		}
	});

	maxInnerWidth++; // sometimes not accurate of width the text needs to stay on one line. insurance

	els.width(maxInnerWidth);

	return maxInnerWidth;
}


// Turns a container element into a scroller if its contents is taller than the allotted height.
// Returns true if the element is now a scroller, false otherwise.
// NOTE: this method is best because it takes weird zooming dimensions into account
function setPotentialScroller(containerEl, height) {
	containerEl.height(height).addClass('fc-scroller');

	// are scrollbars needed?
	if (containerEl[0].scrollHeight - 1 > containerEl[0].clientHeight) { // !!! -1 because IE is often off-by-one :(
		return true;
	}

	unsetScroller(containerEl); // undo
	return false;
}


// Takes an element that might have been a scroller, and turns it back into a normal element.
function unsetScroller(containerEl) {
	containerEl.height('').removeClass('fc-scroller');
}


/* General DOM Utilities
----------------------------------------------------------------------------------------------------------------------*/


// borrowed from https://github.com/jquery/jquery-ui/blob/1.11.0/ui/core.js#L51
function getScrollParent(el) {
	var position = el.css('position'),
		scrollParent = el.parents().filter(function() {
			var parent = $(this);
			return (/(auto|scroll)/).test(
				parent.css('overflow') + parent.css('overflow-y') + parent.css('overflow-x')
			);
		}).eq(0);

	return position === 'fixed' || !scrollParent.length ? $(el[0].ownerDocument || document) : scrollParent;
}


// Given a container element, return an object with the pixel values of the left/right scrollbars.
// Left scrollbars might occur on RTL browsers (IE maybe?) but I have not tested.
// PREREQUISITE: container element must have a single child with display:block
function getScrollbarWidths(container) {
	var containerLeft = container.offset().left;
	var containerRight = containerLeft + container.width();
	var inner = container.children();
	var innerLeft = inner.offset().left;
	var innerRight = innerLeft + inner.outerWidth();

	return {
		left: innerLeft - containerLeft,
		right: containerRight - innerRight
	};
}


// Returns a boolean whether this was a left mouse click and no ctrl key (which means right click on Mac)
function isPrimaryMouseButton(ev) {
	return ev.which == 1 && !ev.ctrlKey;
}


/* FullCalendar-specific Misc Utilities
----------------------------------------------------------------------------------------------------------------------*/


// Creates a basic segment with the intersection of the two ranges. Returns undefined if no intersection.
// Expects all dates to be normalized to the same timezone beforehand.
// TODO: move to date section?
function intersectionToSeg(subjectRange, constraintRange) {
	var subjectStart = subjectRange.start;
	var subjectEnd = subjectRange.end;
	var constraintStart = constraintRange.start;
	var constraintEnd = constraintRange.end;
	var segStart, segEnd;
	var isStart, isEnd;

	if (subjectEnd > constraintStart && subjectStart < constraintEnd) { // in bounds at all?

		if (subjectStart >= constraintStart) {
			segStart = subjectStart.clone();
			isStart = true;
		}
		else {
			segStart = constraintStart.clone();
			isStart =  false;
		}

		if (subjectEnd <= constraintEnd) {
			segEnd = subjectEnd.clone();
			isEnd = true;
		}
		else {
			segEnd = constraintEnd.clone();
			isEnd = false;
		}

		return {
			start: segStart,
			end: segEnd,
			isStart: isStart,
			isEnd: isEnd
		};
	}
}


function smartProperty(obj, name) { // get a camel-cased/namespaced property of an object
	obj = obj || {};
	if (obj[name] !== undefined) {
		return obj[name];
	}
	var parts = name.split(/(?=[A-Z])/),
		i = parts.length - 1, res;
	for (; i>=0; i--) {
		res = obj[parts[i].toLowerCase()];
		if (res !== undefined) {
			return res;
		}
	}
	return obj['default'];
}


/* Date Utilities
----------------------------------------------------------------------------------------------------------------------*/

var dayIDs = [ 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat' ];
var intervalUnits = [ 'year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond' ];


// Diffs the two moments into a Duration where full-days are recorded first, then the remaining time.
// Moments will have their timezones normalized.
function diffDayTime(a, b) {
	return moment.duration({
		days: a.clone().stripTime().diff(b.clone().stripTime(), 'days'),
		ms: a.time() - b.time() // time-of-day from day start. disregards timezone
	});
}


// Diffs the two moments via their start-of-day (regardless of timezone). Produces whole-day durations.
function diffDay(a, b) {
	return moment.duration({
		days: a.clone().stripTime().diff(b.clone().stripTime(), 'days')
	});
}


// Computes the larges whole-unit period of time, as a duration object.
// For example, 48 hours will be {days:2} whereas 49 hours will be {hours:49}.
// Accepts start/end, a range object, or an original duration object.
/* (never used)
function computeIntervalDuration(start, end) {
	var durationInput = {};
	var i, unit;
	var val;

	for (i = 0; i < intervalUnits.length; i++) {
		unit = intervalUnits[i];
		val = computeIntervalAs(unit, start, end);
		if (val) {
			break;
		}
	}

	durationInput[unit] = val;
	return moment.duration(durationInput);
}
*/


// Computes the unit name of the largest whole-unit period of time.
// For example, 48 hours will be "days" wherewas 49 hours will be "hours".
// Accepts start/end, a range object, or an original duration object.
function computeIntervalUnit(start, end) {
	var i, unit;

	for (i = 0; i < intervalUnits.length; i++) {
		unit = intervalUnits[i];
		if (computeIntervalAs(unit, start, end)) {
			break;
		}
	}

	return unit; // will be "milliseconds" if nothing else matches
}


// Computes the number of units the interval is cleanly comprised of.
// If the given unit does not cleanly divide the interval a whole number of times, `false` is returned.
// Accepts start/end, a range object, or an original duration object.
function computeIntervalAs(unit, start, end) {
	var val;

	if (end != null) { // given start, end
		val = end.diff(start, unit, true);
	}
	else if (moment.isDuration(start)) { // given duration
		val = start.as(unit);
	}
	else { // given { start, end } range object
		val = start.end.diff(start.start, unit, true);
	}

	if (val >= 1 && isInt(val)) {
		return val;
	}

	return false;
}


function isNativeDate(input) {
	return  Object.prototype.toString.call(input) === '[object Date]' || input instanceof Date;
}


// Returns a boolean about whether the given input is a time string, like "06:40:00" or "06:00"
function isTimeString(str) {
	return /^\d+\:\d+(?:\:\d+\.?(?:\d{3})?)?$/.test(str);
}


/* General Utilities
----------------------------------------------------------------------------------------------------------------------*/

var hasOwnPropMethod = {}.hasOwnProperty;


// Create an object that has the given prototype. Just like Object.create
function createObject(proto) {
	var f = function() {};
	f.prototype = proto;
	return new f();
}


function copyOwnProps(src, dest) {
	for (var name in src) {
		if (hasOwnProp(src, name)) {
			dest[name] = src[name];
		}
	}
}


function hasOwnProp(obj, name) {
	return hasOwnPropMethod.call(obj, name);
}


// Is the given value a non-object non-function value?
function isAtomic(val) {
	return /undefined|null|boolean|number|string/.test($.type(val));
}


function applyAll(functions, thisObj, args) {
	if ($.isFunction(functions)) {
		functions = [ functions ];
	}
	if (functions) {
		var i;
		var ret;
		for (i=0; i<functions.length; i++) {
			ret = functions[i].apply(thisObj, args) || ret;
		}
		return ret;
	}
}


function firstDefined() {
	for (var i=0; i<arguments.length; i++) {
		if (arguments[i] !== undefined) {
			return arguments[i];
		}
	}
}


function htmlEscape(s) {
	return (s + '').replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&#039;')
		.replace(/"/g, '&quot;')
		.replace(/\n/g, '<br />');
}


function stripHtmlEntities(text) {
	return text.replace(/&.*?;/g, '');
}


function capitaliseFirstLetter(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}


function compareNumbers(a, b) { // for .sort()
	return a - b;
}


function isInt(n) {
	return n % 1 === 0;
}


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds.
// https://github.com/jashkenas/underscore/blob/1.6.0/underscore.js#L714
function debounce(func, wait) {
	var timeoutId;
	var args;
	var context;
	var timestamp; // of most recent call
	var later = function() {
		var last = +new Date() - timestamp;
		if (last < wait && last > 0) {
			timeoutId = setTimeout(later, wait - last);
		}
		else {
			timeoutId = null;
			func.apply(context, args);
			if (!timeoutId) {
				context = args = null;
			}
		}
	};

	return function() {
		context = this;
		args = arguments;
		timestamp = +new Date();
		if (!timeoutId) {
			timeoutId = setTimeout(later, wait);
		}
	};
}

    var ambigDateOfMonthRegex = /^\s*\d{4}-\d\d$/;
var ambigTimeOrZoneRegex =
	/^\s*\d{4}-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?)?$/;
var newMomentProto = moment.fn; // where we will attach our new methods
var oldMomentProto = $.extend({}, newMomentProto); // copy of original moment methods
var allowValueOptimization;
var setUTCValues; // function defined below
var setLocalValues; // function defined below


// Creating
// -------------------------------------------------------------------------------------------------

// Creates a new moment, similar to the vanilla moment(...) constructor, but with
// extra features (ambiguous time, enhanced formatting). When given an existing moment,
// it will function as a clone (and retain the zone of the moment). Anything else will
// result in a moment in the local zone.
fc.moment = function() {
	return makeMoment(arguments);
};

// Sames as fc.moment, but forces the resulting moment to be in the UTC timezone.
fc.moment.utc = function() {
	var mom = makeMoment(arguments, true);

	// Force it into UTC because makeMoment doesn't guarantee it
	// (if given a pre-existing moment for example)
	if (mom.hasTime()) { // don't give ambiguously-timed moments a UTC zone
		mom.utc();
	}

	return mom;
};

// Same as fc.moment, but when given an ISO8601 string, the timezone offset is preserved.
// ISO8601 strings with no timezone offset will become ambiguously zoned.
fc.moment.parseZone = function() {
	return makeMoment(arguments, true, true);
};

// Builds an enhanced moment from args. When given an existing moment, it clones. When given a
// native Date, or called with no arguments (the current time), the resulting moment will be local.
// Anything else needs to be "parsed" (a string or an array), and will be affected by:
//    parseAsUTC - if there is no zone information, should we parse the input in UTC?
//    parseZone - if there is zone information, should we force the zone of the moment?
function makeMoment(args, parseAsUTC, parseZone) {
	var input = args[0];
	var isSingleString = args.length == 1 && typeof input === 'string';
	var isAmbigTime;
	var isAmbigZone;
	var ambigMatch;
	var mom;

	if (moment.isMoment(input)) {
		mom = moment.apply(null, args); // clone it
		transferAmbigs(input, mom); // the ambig flags weren't transfered with the clone
	}
	else if (isNativeDate(input) || input === undefined) {
		mom = moment.apply(null, args); // will be local
	}
	else { // "parsing" is required
		isAmbigTime = false;
		isAmbigZone = false;

		if (isSingleString) {
			if (ambigDateOfMonthRegex.test(input)) {
				// accept strings like '2014-05', but convert to the first of the month
				input += '-01';
				args = [ input ]; // for when we pass it on to moment's constructor
				isAmbigTime = true;
				isAmbigZone = true;
			}
			else if ((ambigMatch = ambigTimeOrZoneRegex.exec(input))) {
				isAmbigTime = !ambigMatch[5]; // no time part?
				isAmbigZone = true;
			}
		}
		else if ($.isArray(input)) {
			// arrays have no timezone information, so assume ambiguous zone
			isAmbigZone = true;
		}
		// otherwise, probably a string with a format

		if (parseAsUTC || isAmbigTime) {
			mom = moment.utc.apply(moment, args);
		}
		else {
			mom = moment.apply(null, args);
		}

		if (isAmbigTime) {
			mom._ambigTime = true;
			mom._ambigZone = true; // ambiguous time always means ambiguous zone
		}
		else if (parseZone) { // let's record the inputted zone somehow
			if (isAmbigZone) {
				mom._ambigZone = true;
			}
			else if (isSingleString) {
				mom.zone(input); // if not a valid zone, will assign UTC
			}
		}
	}

	mom._fullCalendar = true; // flag for extended functionality

	return mom;
}


// A clone method that works with the flags related to our enhanced functionality.
// In the future, use moment.momentProperties
newMomentProto.clone = function() {
	var mom = oldMomentProto.clone.apply(this, arguments);

	// these flags weren't transfered with the clone
	transferAmbigs(this, mom);
	if (this._fullCalendar) {
		mom._fullCalendar = true;
	}

	return mom;
};


// Time-of-day
// -------------------------------------------------------------------------------------------------

// GETTER
// Returns a Duration with the hours/minutes/seconds/ms values of the moment.
// If the moment has an ambiguous time, a duration of 00:00 will be returned.
//
// SETTER
// You can supply a Duration, a Moment, or a Duration-like argument.
// When setting the time, and the moment has an ambiguous time, it then becomes unambiguous.
newMomentProto.time = function(time) {

	// Fallback to the original method (if there is one) if this moment wasn't created via FullCalendar.
	// `time` is a generic enough method name where this precaution is necessary to avoid collisions w/ other plugins.
	if (!this._fullCalendar) {
		return oldMomentProto.time.apply(this, arguments);
	}

	if (time == null) { // getter
		return moment.duration({
			hours: this.hours(),
			minutes: this.minutes(),
			seconds: this.seconds(),
			milliseconds: this.milliseconds()
		});
	}
	else { // setter

		this._ambigTime = false; // mark that the moment now has a time

		if (!moment.isDuration(time) && !moment.isMoment(time)) {
			time = moment.duration(time);
		}

		// The day value should cause overflow (so 24 hours becomes 00:00:00 of next day).
		// Only for Duration times, not Moment times.
		var dayHours = 0;
		if (moment.isDuration(time)) {
			dayHours = Math.floor(time.asDays()) * 24;
		}

		// We need to set the individual fields.
		// Can't use startOf('day') then add duration. In case of DST at start of day.
		return this.hours(dayHours + time.hours())
			.minutes(time.minutes())
			.seconds(time.seconds())
			.milliseconds(time.milliseconds());
	}
};

// Converts the moment to UTC, stripping out its time-of-day and timezone offset,
// but preserving its YMD. A moment with a stripped time will display no time
// nor timezone offset when .format() is called.
newMomentProto.stripTime = function() {
	var a;

	if (!this._ambigTime) {

		// get the values before any conversion happens
		a = this.toArray(); // array of y/m/d/h/m/s/ms

		this.utc(); // set the internal UTC flag (will clear the ambig flags)
		setUTCValues(this, a.slice(0, 3)); // set the year/month/date. time will be zero

		// Mark the time as ambiguous. This needs to happen after the .utc() call, which calls .zone(),
		// which clears all ambig flags. Same with setUTCValues with moment-timezone.
		this._ambigTime = true;
		this._ambigZone = true; // if ambiguous time, also ambiguous timezone offset
	}

	return this; // for chaining
};

// Returns if the moment has a non-ambiguous time (boolean)
newMomentProto.hasTime = function() {
	return !this._ambigTime;
};


// Timezone
// -------------------------------------------------------------------------------------------------

// Converts the moment to UTC, stripping out its timezone offset, but preserving its
// YMD and time-of-day. A moment with a stripped timezone offset will display no
// timezone offset when .format() is called.
newMomentProto.stripZone = function() {
	var a, wasAmbigTime;

	if (!this._ambigZone) {

		// get the values before any conversion happens
		a = this.toArray(); // array of y/m/d/h/m/s/ms
		wasAmbigTime = this._ambigTime;

		this.utc(); // set the internal UTC flag (will clear the ambig flags)
		setUTCValues(this, a); // will set the year/month/date/hours/minutes/seconds/ms

		if (wasAmbigTime) {
			// the above call to .utc()/.zone() unfortunately clears the ambig flags, so reassign
			this._ambigTime = true;
		}

		// Mark the zone as ambiguous. This needs to happen after the .utc() call, which calls .zone(),
		// which clears all ambig flags. Same with setUTCValues with moment-timezone.
		this._ambigZone = true;
	}

	return this; // for chaining
};

// Returns of the moment has a non-ambiguous timezone offset (boolean)
newMomentProto.hasZone = function() {
	return !this._ambigZone;
};

// this method implicitly marks a zone (will get called upon .utc() and .local())
newMomentProto.zone = function(tzo) {

	if (tzo != null) { // setter
		// these assignments needs to happen before the original zone method is called.
		// I forget why, something to do with a browser crash.
		this._ambigTime = false;
		this._ambigZone = false;
	}

	return oldMomentProto.zone.apply(this, arguments);
};

// this method implicitly marks a zone
newMomentProto.local = function() {
	var a = this.toArray(); // year,month,date,hours,minutes,seconds,ms as an array
	var wasAmbigZone = this._ambigZone;

	oldMomentProto.local.apply(this, arguments); // will clear ambig flags

	if (wasAmbigZone) {
		// If the moment was ambiguously zoned, the date fields were stored as UTC.
		// We want to preserve these, but in local time.
		setLocalValues(this, a);
	}

	return this; // for chaining
};


// Formatting
// -------------------------------------------------------------------------------------------------

newMomentProto.format = function() {
	if (this._fullCalendar && arguments[0]) { // an enhanced moment? and a format string provided?
		return formatDate(this, arguments[0]); // our extended formatting
	}
	if (this._ambigTime) {
		return oldMomentFormat(this, 'YYYY-MM-DD');
	}
	if (this._ambigZone) {
		return oldMomentFormat(this, 'YYYY-MM-DD[T]HH:mm:ss');
	}
	return oldMomentProto.format.apply(this, arguments);
};

newMomentProto.toISOString = function() {
	if (this._ambigTime) {
		return oldMomentFormat(this, 'YYYY-MM-DD');
	}
	if (this._ambigZone) {
		return oldMomentFormat(this, 'YYYY-MM-DD[T]HH:mm:ss');
	}
	return oldMomentProto.toISOString.apply(this, arguments);
};


// Querying
// -------------------------------------------------------------------------------------------------

// Is the moment within the specified range? `end` is exclusive.
// FYI, this method is not a standard Moment method, so always do our enhanced logic.
newMomentProto.isWithin = function(start, end) {
	var a = commonlyAmbiguate([ this, start, end ]);
	return a[0] >= a[1] && a[0] < a[2];
};

// When isSame is called with units, timezone ambiguity is normalized before the comparison happens.
// If no units specified, the two moments must be identically the same, with matching ambig flags.
newMomentProto.isSame = function(input, units) {
	var a;

	// only do custom logic if this is an enhanced moment
	if (!this._fullCalendar) {
		return oldMomentProto.isSame.apply(this, arguments);
	}

	if (units) {
		a = commonlyAmbiguate([ this, input ], true); // normalize timezones but don't erase times
		return oldMomentProto.isSame.call(a[0], a[1], units);
	}
	else {
		input = fc.moment.parseZone(input); // normalize input
		return oldMomentProto.isSame.call(this, input) &&
			Boolean(this._ambigTime) === Boolean(input._ambigTime) &&
			Boolean(this._ambigZone) === Boolean(input._ambigZone);
	}
};

// Make these query methods work with ambiguous moments
$.each([
	'isBefore',
	'isAfter'
], function(i, methodName) {
	newMomentProto[methodName] = function(input, units) {
		var a;

		// only do custom logic if this is an enhanced moment
		if (!this._fullCalendar) {
			return oldMomentProto[methodName].apply(this, arguments);
		}

		a = commonlyAmbiguate([ this, input ]);
		return oldMomentProto[methodName].call(a[0], a[1], units);
	};
});


// Misc Internals
// -------------------------------------------------------------------------------------------------

// given an array of moment-like inputs, return a parallel array w/ moments similarly ambiguated.
// for example, of one moment has ambig time, but not others, all moments will have their time stripped.
// set `preserveTime` to `true` to keep times, but only normalize zone ambiguity.
// returns the original moments if no modifications are necessary.
function commonlyAmbiguate(inputs, preserveTime) {
	var anyAmbigTime = false;
	var anyAmbigZone = false;
	var len = inputs.length;
	var moms = [];
	var i, mom;

	// parse inputs into real moments and query their ambig flags
	for (i = 0; i < len; i++) {
		mom = inputs[i];
		if (!moment.isMoment(mom)) {
			mom = fc.moment.parseZone(mom);
		}
		anyAmbigTime = anyAmbigTime || mom._ambigTime;
		anyAmbigZone = anyAmbigZone || mom._ambigZone;
		moms.push(mom);
	}

	// strip each moment down to lowest common ambiguity
	// use clones to avoid modifying the original moments
	for (i = 0; i < len; i++) {
		mom = moms[i];
		if (!preserveTime && anyAmbigTime && !mom._ambigTime) {
			moms[i] = mom.clone().stripTime();
		}
		else if (anyAmbigZone && !mom._ambigZone) {
			moms[i] = mom.clone().stripZone();
		}
	}

	return moms;
}

// Transfers all the flags related to ambiguous time/zone from the `src` moment to the `dest` moment
function transferAmbigs(src, dest) {
	if (src._ambigTime) {
		dest._ambigTime = true;
	}
	else if (dest._ambigTime) {
		dest._ambigTime = false;
	}

	if (src._ambigZone) {
		dest._ambigZone = true;
	}
	else if (dest._ambigZone) {
		dest._ambigZone = false;
	}
}


// Sets the year/month/date/etc values of the moment from the given array.
// Inefficient because it calls each individual setter.
function setMomentValues(mom, a) {
	mom.year(a[0] || 0)
		.month(a[1] || 0)
		.date(a[2] || 0)
		.hours(a[3] || 0)
		.minutes(a[4] || 0)
		.seconds(a[5] || 0)
		.milliseconds(a[6] || 0);
}

// Can we set the moment's internal date directly?
allowValueOptimization = '_d' in moment() && 'updateOffset' in moment;

// Utility function. Accepts a moment and an array of the UTC year/month/date/etc values to set.
// Assumes the given moment is already in UTC mode.
setUTCValues = allowValueOptimization ? function(mom, a) {
	// simlate what moment's accessors do
	mom._d.setTime(Date.UTC.apply(Date, a));
	moment.updateOffset(mom, false); // keepTime=false
} : setMomentValues;

// Utility function. Accepts a moment and an array of the local year/month/date/etc values to set.
// Assumes the given moment is already in local mode.
setLocalValues = allowValueOptimization ? function(mom, a) {
	// simlate what moment's accessors do
	mom._d.setTime(+new Date( // FYI, there is now way to apply an array of args to a constructor
		a[0] || 0,
		a[1] || 0,
		a[2] || 0,
		a[3] || 0,
		a[4] || 0,
		a[5] || 0,
		a[6] || 0
	));
	moment.updateOffset(mom, false); // keepTime=false
} : setMomentValues;

// Single Date Formatting
// -------------------------------------------------------------------------------------------------


// call this if you want Moment's original format method to be used
function oldMomentFormat(mom, formatStr) {
	return oldMomentProto.format.call(mom, formatStr); // oldMomentProto defined in moment-ext.js
}


// Formats `date` with a Moment formatting string, but allow our non-zero areas and
// additional token.
function formatDate(date, formatStr) {
	return formatDateWithChunks(date, getFormatStringChunks(formatStr));
}


function formatDateWithChunks(date, chunks) {
	var s = '';
	var i;

	for (i=0; i<chunks.length; i++) {
		s += formatDateWithChunk(date, chunks[i]);
	}

	return s;
}


// addition formatting tokens we want recognized
var tokenOverrides = {
	t: function(date) { // "a" or "p"
		return oldMomentFormat(date, 'a').charAt(0);
	},
	T: function(date) { // "A" or "P"
		return oldMomentFormat(date, 'A').charAt(0);
	}
};


function formatDateWithChunk(date, chunk) {
	var token;
	var maybeStr;

	if (typeof chunk === 'string') { // a literal string
		return chunk;
	}
	else if ((token = chunk.token)) { // a token, like "YYYY"
		if (tokenOverrides[token]) {
			return tokenOverrides[token](date); // use our custom token
		}
		return oldMomentFormat(date, token);
	}
	else if (chunk.maybe) { // a grouping of other chunks that must be non-zero
		maybeStr = formatDateWithChunks(date, chunk.maybe);
		if (maybeStr.match(/[1-9]/)) {
			return maybeStr;
		}
	}

	return '';
}


// Date Range Formatting
// -------------------------------------------------------------------------------------------------
// TODO: make it work with timezone offset

// Using a formatting string meant for a single date, generate a range string, like
// "Sep 2 - 9 2013", that intelligently inserts a separator where the dates differ.
// If the dates are the same as far as the format string is concerned, just return a single
// rendering of one date, without any separator.
function formatRange(date1, date2, formatStr, separator, isRTL) {
	var localeData;

	date1 = fc.moment.parseZone(date1);
	date2 = fc.moment.parseZone(date2);

	localeData = (date1.localeData || date1.lang).call(date1); // works with moment-pre-2.8

	// Expand localized format strings, like "LL" -> "MMMM D YYYY"
	formatStr = localeData.longDateFormat(formatStr) || formatStr;
	// BTW, this is not important for `formatDate` because it is impossible to put custom tokens
	// or non-zero areas in Moment's localized format strings.

	separator = separator || ' - ';

	return formatRangeWithChunks(
		date1,
		date2,
		getFormatStringChunks(formatStr),
		separator,
		isRTL
	);
}
fc.formatRange = formatRange; // expose


function formatRangeWithChunks(date1, date2, chunks, separator, isRTL) {
	var chunkStr; // the rendering of the chunk
	var leftI;
	var leftStr = '';
	var rightI;
	var rightStr = '';
	var middleI;
	var middleStr1 = '';
	var middleStr2 = '';
	var middleStr = '';

	// Start at the leftmost side of the formatting string and continue until you hit a token
	// that is not the same between dates.
	for (leftI=0; leftI<chunks.length; leftI++) {
		chunkStr = formatSimilarChunk(date1, date2, chunks[leftI]);
		if (chunkStr === false) {
			break;
		}
		leftStr += chunkStr;
	}

	// Similarly, start at the rightmost side of the formatting string and move left
	for (rightI=chunks.length-1; rightI>leftI; rightI--) {
		chunkStr = formatSimilarChunk(date1, date2, chunks[rightI]);
		if (chunkStr === false) {
			break;
		}
		rightStr = chunkStr + rightStr;
	}

	// The area in the middle is different for both of the dates.
	// Collect them distinctly so we can jam them together later.
	for (middleI=leftI; middleI<=rightI; middleI++) {
		middleStr1 += formatDateWithChunk(date1, chunks[middleI]);
		middleStr2 += formatDateWithChunk(date2, chunks[middleI]);
	}

	if (middleStr1 || middleStr2) {
		if (isRTL) {
			middleStr = middleStr2 + separator + middleStr1;
		}
		else {
			middleStr = middleStr1 + separator + middleStr2;
		}
	}

	return leftStr + middleStr + rightStr;
}


var similarUnitMap = {
	Y: 'year',
	M: 'month',
	D: 'day', // day of month
	d: 'day', // day of week
	// prevents a separator between anything time-related...
	A: 'second', // AM/PM
	a: 'second', // am/pm
	T: 'second', // A/P
	t: 'second', // a/p
	H: 'second', // hour (24)
	h: 'second', // hour (12)
	m: 'second', // minute
	s: 'second' // second
};
// TODO: week maybe?


// Given a formatting chunk, and given that both dates are similar in the regard the
// formatting chunk is concerned, format date1 against `chunk`. Otherwise, return `false`.
function formatSimilarChunk(date1, date2, chunk) {
	var token;
	var unit;

	if (typeof chunk === 'string') { // a literal string
		return chunk;
	}
	else if ((token = chunk.token)) {
		unit = similarUnitMap[token.charAt(0)];
		// are the dates the same for this unit of measurement?
		if (unit && date1.isSame(date2, unit)) {
			return oldMomentFormat(date1, token); // would be the same if we used `date2`
			// BTW, don't support custom tokens
		}
	}

	return false; // the chunk is NOT the same for the two dates
	// BTW, don't support splitting on non-zero areas
}


// Chunking Utils
// -------------------------------------------------------------------------------------------------


var formatStringChunkCache = {};


function getFormatStringChunks(formatStr) {
	if (formatStr in formatStringChunkCache) {
		return formatStringChunkCache[formatStr];
	}
	return (formatStringChunkCache[formatStr] = chunkFormatString(formatStr));
}


// Break the formatting string into an array of chunks
function chunkFormatString(formatStr) {
	var chunks = [];
	var chunker = /\[([^\]]*)\]|\(([^\)]*)\)|(LT|(\w)\4*o?)|([^\w\[\(]+)/g; // TODO: more descrimination
	var match;

	while ((match = chunker.exec(formatStr))) {
		if (match[1]) { // a literal string inside [ ... ]
			chunks.push(match[1]);
		}
		else if (match[2]) { // non-zero formatting inside ( ... )
			chunks.push({ maybe: chunkFormatString(match[2]) });
		}
		else if (match[3]) { // a formatting token
			chunks.push({ token: match[3] });
		}
		else if (match[5]) { // an unenclosed literal string
			chunks.push(match[5]);
		}
	}

	return chunks;
}

    fc.Class = Class; // export

// class that all other classes will inherit from
function Class() { }

// called upon a class to create a subclass
Class.extend = function(members) {
	var superClass = this;
	var subClass;

	members = members || {};

	// ensure a constructor for the subclass, forwarding all arguments to the super-constructor if it doesn't exist
	if (hasOwnProp(members, 'constructor')) {
		subClass = members.constructor;
	}
	if (typeof subClass !== 'function') {
		subClass = members.constructor = function() {
			superClass.apply(this, arguments);
		};
	}

	// build the base prototype for the subclass, which is an new object chained to the superclass's prototype
	subClass.prototype = createObject(superClass.prototype);

	// copy each member variable/method onto the the subclass's prototype
	copyOwnProps(members, subClass.prototype);

	// copy over all class variables/methods to the subclass, such as `extend` and `mixin`
	copyOwnProps(superClass, subClass);

	return subClass;
};

// adds new member variables/methods to the class's prototype.
// can be called with another class, or a plain object hash containing new members.
Class.mixin = function(members) {
	copyOwnProps(members.prototype || members, this.prototype);
};
    /* A rectangular panel that is absolutely positioned over other content
------------------------------------------------------------------------------------------------------------------------
Options:
	- className (string)
	- content (HTML string or jQuery element set)
	- parentEl
	- top
	- left
	- right (the x coord of where the right edge should be. not a "CSS" right)
	- autoHide (boolean)
	- show (callback)
	- hide (callback)
*/

var Popover = Class.extend({

	isHidden: true,
	options: null,
	el: null, // the container element for the popover. generated by this object
	documentMousedownProxy: null, // document mousedown handler bound to `this`
	margin: 10, // the space required between the popover and the edges of the scroll container


	constructor: function(options) {
		this.options = options || {};
	},


	// Shows the popover on the specified position. Renders it if not already
	show: function() {
		if (this.isHidden) {
			if (!this.el) {
				this.render();
			}
			this.el.show();
			this.position();
			this.isHidden = false;
			this.trigger('show');
		}
	},


	// Hides the popover, through CSS, but does not remove it from the DOM
	hide: function() {
		if (!this.isHidden) {
			this.el.hide();
			this.isHidden = true;
			this.trigger('hide');
		}
	},


	// Creates `this.el` and renders content inside of it
	render: function() {
		var _this = this;
		var options = this.options;

		this.el = $('<div class="fc-popover"/>')
			.addClass(options.className || '')
			.css({
				// position initially to the top left to avoid creating scrollbars
				top: 0,
				left: 0
			})
			.append(options.content)
			.appendTo(options.parentEl);

		// when a click happens on anything inside with a 'fc-close' className, hide the popover
		this.el.on('click', '.fc-close', function() {
			_this.hide();
		});

		if (options.autoHide) {
			$(document).on('mousedown', this.documentMousedownProxy = $.proxy(this, 'documentMousedown'));
		}
	},


	// Triggered when the user clicks *anywhere* in the document, for the autoHide feature
	documentMousedown: function(ev) {
		// only hide the popover if the click happened outside the popover
		if (this.el && !$(ev.target).closest(this.el).length) {
			this.hide();
		}
	},


	// Hides and unregisters any handlers
	destroy: function() {
		this.hide();

		if (this.el) {
			this.el.remove();
			this.el = null;
		}

		$(document).off('mousedown', this.documentMousedownProxy);
	},


	// Positions the popover optimally, using the top/left/right options
	position: function() {
		var options = this.options;
		var origin = this.el.offsetParent().offset();
		var width = this.el.outerWidth();
		var height = this.el.outerHeight();
		var windowEl = $(window);
		var viewportEl = getScrollParent(this.el);
		var viewportTop;
		var viewportLeft;
		var viewportOffset;
		var top; // the "position" (not "offset") values for the popover
		var left; //

		// compute top and left
		top = options.top || 0;
		if (options.left !== undefined) {
			left = options.left;
		}
		else if (options.right !== undefined) {
			left = options.right - width; // derive the left value from the right value
		}
		else {
			left = 0;
		}

		if (viewportEl.is(window) || viewportEl.is(document)) { // normalize getScrollParent's result
			viewportEl = windowEl;
			viewportTop = 0; // the window is always at the top left
			viewportLeft = 0; // (and .offset() won't work if called here)
		}
		else {
			viewportOffset = viewportEl.offset();
			viewportTop = viewportOffset.top;
			viewportLeft = viewportOffset.left;
		}

		// if the window is scrolled, it causes the visible area to be further down
		viewportTop += windowEl.scrollTop();
		viewportLeft += windowEl.scrollLeft();

		// constrain to the view port. if constrained by two edges, give precedence to top/left
		if (options.viewportConstrain !== false) {
			top = Math.min(top, viewportTop + viewportEl.outerHeight() - height - this.margin);
			top = Math.max(top, viewportTop + this.margin);
			left = Math.min(left, viewportLeft + viewportEl.outerWidth() - width - this.margin);
			left = Math.max(left, viewportLeft + this.margin);
		}

		this.el.css({
			top: top - origin.top,
			left: left - origin.left
		});
	},


	// Triggers a callback. Calls a function in the option hash of the same name.
	// Arguments beyond the first `name` are forwarded on.
	// TODO: better code reuse for this. Repeat code
	trigger: function(name) {
		if (this.options[name]) {
			this.options[name].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	}

});

    /* A "coordinate map" converts pixel coordinates into an associated cell, which has an associated date
------------------------------------------------------------------------------------------------------------------------
Common interface:

	CoordMap.prototype = {
		build: function() {},
		getCell: function(x, y) {}
	};

*/

/* Coordinate map for a grid component
----------------------------------------------------------------------------------------------------------------------*/

var GridCoordMap = Class.extend({

	grid: null, // reference to the Grid
	rowCoords: null, // array of {top,bottom} objects
	colCoords: null, // array of {left,right} objects

	containerEl: null, // container element that all coordinates are constrained to. optionally assigned
	minX: null,
	maxX: null, // exclusive
	minY: null,
	maxY: null, // exclusive


	constructor: function(grid) {
		this.grid = grid;
	},


	// Queries the grid for the coordinates of all the cells
	build: function() {
		this.rowCoords = this.grid.computeRowCoords();
		this.colCoords = this.grid.computeColCoords();
		this.computeBounds();
	},


	// Clears the coordinates data to free up memory
	clear: function() {
		this.rowCoords = null;
		this.colCoords = null;
	},


	// Given a coordinate of the document, gets the associated cell. If no cell is underneath, returns null
	getCell: function(x, y) {
		var rowCoords = this.rowCoords;
		var colCoords = this.colCoords;
		var hitRow = null;
		var hitCol = null;
		var i, coords;
		var cell;

		if (this.inBounds(x, y)) {

			for (i = 0; i < rowCoords.length; i++) {
				coords = rowCoords[i];
				if (y >= coords.top && y < coords.bottom) {
					hitRow = i;
					break;
				}
			}

			for (i = 0; i < colCoords.length; i++) {
				coords = colCoords[i];
				if (x >= coords.left && x < coords.right) {
					hitCol = i;
					break;
				}
			}

			if (hitRow !== null && hitCol !== null) {
				cell = this.grid.getCell(hitRow, hitCol);
				cell.grid = this.grid; // for DragListener's isCellsEqual. dragging between grids
				return cell;
			}
		}

		return null;
	},


	// If there is a containerEl, compute the bounds into min/max values
	computeBounds: function() {
		var containerOffset;

		if (this.containerEl) {
			containerOffset = this.containerEl.offset();
			this.minX = containerOffset.left;
			this.maxX = containerOffset.left + this.containerEl.outerWidth();
			this.minY = containerOffset.top;
			this.maxY = containerOffset.top + this.containerEl.outerHeight();
		}
	},


	// Determines if the given coordinates are in bounds. If no `containerEl`, always true
	inBounds: function(x, y) {
		if (this.containerEl) {
			return x >= this.minX && x < this.maxX && y >= this.minY && y < this.maxY;
		}
		return true;
	}

});


/* Coordinate map that is a combination of multiple other coordinate maps
----------------------------------------------------------------------------------------------------------------------*/

var ComboCoordMap = Class.extend({

	coordMaps: null, // an array of CoordMaps


	constructor: function(coordMaps) {
		this.coordMaps = coordMaps;
	},


	// Builds all coordMaps
	build: function() {
		var coordMaps = this.coordMaps;
		var i;

		for (i = 0; i < coordMaps.length; i++) {
			coordMaps[i].build();
		}
	},


	// Queries all coordMaps for the cell underneath the given coordinates, returning the first result
	getCell: function(x, y) {
		var coordMaps = this.coordMaps;
		var cell = null;
		var i;

		for (i = 0; i < coordMaps.length && !cell; i++) {
			cell = coordMaps[i].getCell(x, y);
		}

		return cell;
	},


	// Clears all coordMaps
	clear: function() {
		var coordMaps = this.coordMaps;
		var i;

		for (i = 0; i < coordMaps.length; i++) {
			coordMaps[i].clear();
		}
	}

});

    /* Tracks mouse movements over a CoordMap and raises events about which cell the mouse is over.
----------------------------------------------------------------------------------------------------------------------*/
// TODO: very useful to have a handler that gets called upon cellOut OR when dragging stops (for cleanup)

var DragListener = Class.extend({

	coordMap: null,
	options: null,

	isListening: false,
	isDragging: false,

	// the cell the mouse was over when listening started
	origCell: null,

	// the cell the mouse is over
	cell: null,

	// coordinates of the initial mousedown
	mouseX0: null,
	mouseY0: null,

	// handler attached to the document, bound to the DragListener's `this`
	mousemoveProxy: null,
	mouseupProxy: null,

	scrollEl: null,
	scrollBounds: null, // { top, bottom, left, right }
	scrollTopVel: null, // pixels per second
	scrollLeftVel: null, // pixels per second
	scrollIntervalId: null, // ID of setTimeout for scrolling animation loop
	scrollHandlerProxy: null, // this-scoped function for handling when scrollEl is scrolled

	scrollSensitivity: 30, // pixels from edge for scrolling to start
	scrollSpeed: 200, // pixels per second, at maximum speed
	scrollIntervalMs: 50, // millisecond wait between scroll increment


	constructor: function(coordMap, options) {
		this.coordMap = coordMap;
		this.options = options || {};
	},


	// Call this when the user does a mousedown. Will probably lead to startListening
	mousedown: function(ev) {
		if (isPrimaryMouseButton(ev)) {

			ev.preventDefault(); // prevents native selection in most browsers

			this.startListening(ev);

			// start the drag immediately if there is no minimum distance for a drag start
			if (!this.options.distance) {
				this.startDrag(ev);
			}
		}
	},


	// Call this to start tracking mouse movements
	startListening: function(ev) {
		var scrollParent;
		var cell;

		if (!this.isListening) {

			// grab scroll container and attach handler
			if (ev && this.options.scroll) {
				scrollParent = getScrollParent($(ev.target));
				if (!scrollParent.is(window) && !scrollParent.is(document)) {
					this.scrollEl = scrollParent;

					// scope to `this`, and use `debounce` to make sure rapid calls don't happen
					this.scrollHandlerProxy = debounce($.proxy(this, 'scrollHandler'), 100);
					this.scrollEl.on('scroll', this.scrollHandlerProxy);
				}
			}

			this.computeCoords(); // relies on `scrollEl`

			// get info on the initial cell and its coordinates
			if (ev) {
				cell = this.getCell(ev);
				this.origCell = cell;

				this.mouseX0 = ev.pageX;
				this.mouseY0 = ev.pageY;
			}

			$(document)
				.on('mousemove', this.mousemoveProxy = $.proxy(this, 'mousemove'))
				.on('mouseup', this.mouseupProxy = $.proxy(this, 'mouseup'))
				.on('selectstart', this.preventDefault); // prevents native selection in IE<=8

			this.isListening = true;
			this.trigger('listenStart', ev);
		}
	},


	// Recomputes the drag-critical positions of elements
	computeCoords: function() {
		this.coordMap.build();
		this.computeScrollBounds();
	},


	// Called when the user moves the mouse
	mousemove: function(ev) {
		var minDistance;
		var distanceSq; // current distance from mouseX0/mouseY0, squared

		if (!this.isDragging) { // if not already dragging...
			// then start the drag if the minimum distance criteria is met
			minDistance = this.options.distance || 1;
			distanceSq = Math.pow(ev.pageX - this.mouseX0, 2) + Math.pow(ev.pageY - this.mouseY0, 2);
			if (distanceSq >= minDistance * minDistance) { // use pythagorean theorem
				this.startDrag(ev);
			}
		}

		if (this.isDragging) {
			this.drag(ev); // report a drag, even if this mousemove initiated the drag
		}
	},


	// Call this to initiate a legitimate drag.
	// This function is called internally from this class, but can also be called explicitly from outside
	startDrag: function(ev) {
		var cell;

		if (!this.isListening) { // startDrag must have manually initiated
			this.startListening();
		}

		if (!this.isDragging) {
			this.isDragging = true;
			this.trigger('dragStart', ev);

			// report the initial cell the mouse is over
			// especially important if no min-distance and drag starts immediately
			cell = this.getCell(ev); // this might be different from this.origCell if the min-distance is large
			if (cell) {
				this.cellOver(cell);
			}
		}
	},


	// Called while the mouse is being moved and when we know a legitimate drag is taking place
	drag: function(ev) {
		var cell;

		if (this.isDragging) {
			cell = this.getCell(ev);

			if (!isCellsEqual(cell, this.cell)) { // a different cell than before?
				if (this.cell) {
					this.cellOut();
				}
				if (cell) {
					this.cellOver(cell);
				}
			}

			this.dragScroll(ev); // will possibly cause scrolling
		}
	},


	// Called when a the mouse has just moved over a new cell
	cellOver: function(cell) {
		this.cell = cell;
		this.trigger('cellOver', cell, isCellsEqual(cell, this.origCell));
	},


	// Called when the mouse has just moved out of a cell
	cellOut: function() {
		if (this.cell) {
			this.trigger('cellOut', this.cell);
			this.cell = null;
		}
	},


	// Called when the user does a mouseup
	mouseup: function(ev) {
		this.stopDrag(ev);
		this.stopListening(ev);
	},


	// Called when the drag is over. Will not cause listening to stop however.
	// A concluding 'cellOut' event will NOT be triggered.
	stopDrag: function(ev) {
		if (this.isDragging) {
			this.stopScrolling();
			this.trigger('dragStop', ev);
			this.isDragging = false;
		}
	},


	// Call this to stop listening to the user's mouse events
	stopListening: function(ev) {
		if (this.isListening) {

			// remove the scroll handler if there is a scrollEl
			if (this.scrollEl) {
				this.scrollEl.off('scroll', this.scrollHandlerProxy);
				this.scrollHandlerProxy = null;
			}

			$(document)
				.off('mousemove', this.mousemoveProxy)
				.off('mouseup', this.mouseupProxy)
				.off('selectstart', this.preventDefault);

			this.mousemoveProxy = null;
			this.mouseupProxy = null;

			this.isListening = false;
			this.trigger('listenStop', ev);

			this.origCell = this.cell = null;
			this.coordMap.clear();
		}
	},


	// Gets the cell underneath the coordinates for the given mouse event
	getCell: function(ev) {
		return this.coordMap.getCell(ev.pageX, ev.pageY);
	},


	// Triggers a callback. Calls a function in the option hash of the same name.
	// Arguments beyond the first `name` are forwarded on.
	trigger: function(name) {
		if (this.options[name]) {
			this.options[name].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	},


	// Stops a given mouse event from doing it's native browser action. In our case, text selection.
	preventDefault: function(ev) {
		ev.preventDefault();
	},


	/* Scrolling
	------------------------------------------------------------------------------------------------------------------*/


	// Computes and stores the bounding rectangle of scrollEl
	computeScrollBounds: function() {
		var el = this.scrollEl;
		var offset;

		if (el) {
			offset = el.offset();
			this.scrollBounds = {
				top: offset.top,
				left: offset.left,
				bottom: offset.top + el.outerHeight(),
				right: offset.left + el.outerWidth()
			};
		}
	},


	// Called when the dragging is in progress and scrolling should be updated
	dragScroll: function(ev) {
		var sensitivity = this.scrollSensitivity;
		var bounds = this.scrollBounds;
		var topCloseness, bottomCloseness;
		var leftCloseness, rightCloseness;
		var topVel = 0;
		var leftVel = 0;

		if (bounds) { // only scroll if scrollEl exists

			// compute closeness to edges. valid range is from 0.0 - 1.0
			topCloseness = (sensitivity - (ev.pageY - bounds.top)) / sensitivity;
			bottomCloseness = (sensitivity - (bounds.bottom - ev.pageY)) / sensitivity;
			leftCloseness = (sensitivity - (ev.pageX - bounds.left)) / sensitivity;
			rightCloseness = (sensitivity - (bounds.right - ev.pageX)) / sensitivity;

			// translate vertical closeness into velocity.
			// mouse must be completely in bounds for velocity to happen.
			if (topCloseness >= 0 && topCloseness <= 1) {
				topVel = topCloseness * this.scrollSpeed * -1; // negative. for scrolling up
			}
			else if (bottomCloseness >= 0 && bottomCloseness <= 1) {
				topVel = bottomCloseness * this.scrollSpeed;
			}

			// translate horizontal closeness into velocity
			if (leftCloseness >= 0 && leftCloseness <= 1) {
				leftVel = leftCloseness * this.scrollSpeed * -1; // negative. for scrolling left
			}
			else if (rightCloseness >= 0 && rightCloseness <= 1) {
				leftVel = rightCloseness * this.scrollSpeed;
			}
		}

		this.setScrollVel(topVel, leftVel);
	},


	// Sets the speed-of-scrolling for the scrollEl
	setScrollVel: function(topVel, leftVel) {

		this.scrollTopVel = topVel;
		this.scrollLeftVel = leftVel;

		this.constrainScrollVel(); // massages into realistic values

		// if there is non-zero velocity, and an animation loop hasn't already started, then START
		if ((this.scrollTopVel || this.scrollLeftVel) && !this.scrollIntervalId) {
			this.scrollIntervalId = setInterval(
				$.proxy(this, 'scrollIntervalFunc'), // scope to `this`
				this.scrollIntervalMs
			);
		}
	},


	// Forces scrollTopVel and scrollLeftVel to be zero if scrolling has already gone all the way
	constrainScrollVel: function() {
		var el = this.scrollEl;

		if (this.scrollTopVel < 0) { // scrolling up?
			if (el.scrollTop() <= 0) { // already scrolled all the way up?
				this.scrollTopVel = 0;
			}
		}
		else if (this.scrollTopVel > 0) { // scrolling down?
			if (el.scrollTop() + el[0].clientHeight >= el[0].scrollHeight) { // already scrolled all the way down?
				this.scrollTopVel = 0;
			}
		}

		if (this.scrollLeftVel < 0) { // scrolling left?
			if (el.scrollLeft() <= 0) { // already scrolled all the left?
				this.scrollLeftVel = 0;
			}
		}
		else if (this.scrollLeftVel > 0) { // scrolling right?
			if (el.scrollLeft() + el[0].clientWidth >= el[0].scrollWidth) { // already scrolled all the way right?
				this.scrollLeftVel = 0;
			}
		}
	},


	// This function gets called during every iteration of the scrolling animation loop
	scrollIntervalFunc: function() {
		var el = this.scrollEl;
		var frac = this.scrollIntervalMs / 1000; // considering animation frequency, what the vel should be mult'd by

		// change the value of scrollEl's scroll
		if (this.scrollTopVel) {
			el.scrollTop(el.scrollTop() + this.scrollTopVel * frac);
		}
		if (this.scrollLeftVel) {
			el.scrollLeft(el.scrollLeft() + this.scrollLeftVel * frac);
		}

		this.constrainScrollVel(); // since the scroll values changed, recompute the velocities

		// if scrolled all the way, which causes the vels to be zero, stop the animation loop
		if (!this.scrollTopVel && !this.scrollLeftVel) {
			this.stopScrolling();
		}
	},


	// Kills any existing scrolling animation loop
	stopScrolling: function() {
		if (this.scrollIntervalId) {
			clearInterval(this.scrollIntervalId);
			this.scrollIntervalId = null;

			// when all done with scrolling, recompute positions since they probably changed
			this.computeCoords();
		}
	},


	// Get called when the scrollEl is scrolled (NOTE: this is delayed via debounce)
	scrollHandler: function() {
		// recompute all coordinates, but *only* if this is *not* part of our scrolling animation
		if (!this.scrollIntervalId) {
			this.computeCoords();
		}
	}

});


// Returns `true` if the cells are identically equal. `false` otherwise.
// They must have the same row, col, and be from the same grid.
// Two null values will be considered equal, as two "out of the grid" states are the same.
function isCellsEqual(cell1, cell2) {

	if (!cell1 && !cell2) {
		return true;
	}

	if (cell1 && cell2) {
		return cell1.grid === cell2.grid &&
			cell1.row === cell2.row &&
			cell1.col === cell2.col;
	}

	return false;
}

    /* Creates a clone of an element and lets it track the mouse as it moves
----------------------------------------------------------------------------------------------------------------------*/

var MouseFollower = Class.extend({

	options: null,

	sourceEl: null, // the element that will be cloned and made to look like it is dragging
	el: null, // the clone of `sourceEl` that will track the mouse
	parentEl: null, // the element that `el` (the clone) will be attached to

	// the initial position of el, relative to the offset parent. made to match the initial offset of sourceEl
	top0: null,
	left0: null,

	// the initial position of the mouse
	mouseY0: null,
	mouseX0: null,

	// the number of pixels the mouse has moved from its initial position
	topDelta: null,
	leftDelta: null,

	mousemoveProxy: null, // document mousemove handler, bound to the MouseFollower's `this`

	isFollowing: false,
	isHidden: false,
	isAnimating: false, // doing the revert animation?

	constructor: function(sourceEl, options) {
		this.options = options = options || {};
		this.sourceEl = sourceEl;
		this.parentEl = options.parentEl ? $(options.parentEl) : sourceEl.parent(); // default to sourceEl's parent
	},


	// Causes the element to start following the mouse
	start: function(ev) {
		if (!this.isFollowing) {
			this.isFollowing = true;

			this.mouseY0 = ev.pageY;
			this.mouseX0 = ev.pageX;
			this.topDelta = 0;
			this.leftDelta = 0;

			if (!this.isHidden) {
				this.updatePosition();
			}

			$(document).on('mousemove', this.mousemoveProxy = $.proxy(this, 'mousemove'));
		}
	},


	// Causes the element to stop following the mouse. If shouldRevert is true, will animate back to original position.
	// `callback` gets invoked when the animation is complete. If no animation, it is invoked immediately.
	stop: function(shouldRevert, callback) {
		var _this = this;
		var revertDuration = this.options.revertDuration;

		function complete() {
			this.isAnimating = false;
			_this.destroyEl();

			this.top0 = this.left0 = null; // reset state for future updatePosition calls

			if (callback) {
				callback();
			}
		}

		if (this.isFollowing && !this.isAnimating) { // disallow more than one stop animation at a time
			this.isFollowing = false;

			$(document).off('mousemove', this.mousemoveProxy);

			if (shouldRevert && revertDuration && !this.isHidden) { // do a revert animation?
				this.isAnimating = true;
				this.el.animate({
					top: this.top0,
					left: this.left0
				}, {
					duration: revertDuration,
					complete: complete
				});
			}
			else {
				complete();
			}
		}
	},


	// Gets the tracking element. Create it if necessary
	getEl: function() {
		var el = this.el;

		if (!el) {
			this.sourceEl.width(); // hack to force IE8 to compute correct bounding box
			el = this.el = this.sourceEl.clone()
				.css({
					position: 'absolute',
					visibility: '', // in case original element was hidden (commonly through hideEvents())
					display: this.isHidden ? 'none' : '', // for when initially hidden
					margin: 0,
					right: 'auto', // erase and set width instead
					bottom: 'auto', // erase and set height instead
					width: this.sourceEl.width(), // explicit height in case there was a 'right' value
					height: this.sourceEl.height(), // explicit width in case there was a 'bottom' value
					opacity: this.options.opacity || '',
					zIndex: this.options.zIndex
				})
				.appendTo(this.parentEl);
		}

		return el;
	},


	// Removes the tracking element if it has already been created
	destroyEl: function() {
		if (this.el) {
			this.el.remove();
			this.el = null;
		}
	},


	// Update the CSS position of the tracking element
	updatePosition: function() {
		var sourceOffset;
		var origin;

		this.getEl(); // ensure this.el

		// make sure origin info was computed
		if (this.top0 === null) {
			this.sourceEl.width(); // hack to force IE8 to compute correct bounding box
			sourceOffset = this.sourceEl.offset();
			origin = this.el.offsetParent().offset();
			this.top0 = sourceOffset.top - origin.top;
			this.left0 = sourceOffset.left - origin.left;
		}

		this.el.css({
			top: this.top0 + this.topDelta,
			left: this.left0 + this.leftDelta
		});
	},


	// Gets called when the user moves the mouse
	mousemove: function(ev) {
		this.topDelta = ev.pageY - this.mouseY0;
		this.leftDelta = ev.pageX - this.mouseX0;

		if (!this.isHidden) {
			this.updatePosition();
		}
	},


	// Temporarily makes the tracking element invisible. Can be called before following starts
	hide: function() {
		if (!this.isHidden) {
			this.isHidden = true;
			if (this.el) {
				this.el.hide();
			}
		}
	},


	// Show the tracking element after it has been temporarily hidden
	show: function() {
		if (this.isHidden) {
			this.isHidden = false;
			this.updatePosition();
			this.getEl().show();
		}
	}

});

    /* A utility class for rendering <tr> rows.
----------------------------------------------------------------------------------------------------------------------*/
// It leverages methods of the subclass and the View to determine custom rendering behavior for each row "type"
// (such as highlight rows, day rows, helper rows, etc).

var RowRenderer = Class.extend({

	view: null, // a View object
	isRTL: null, // shortcut to the view's isRTL option
	cellHtml: '<td/>', // plain default HTML used for a cell when no other is available


	constructor: function(view) {
		this.view = view;
		this.isRTL = view.opt('isRTL');
	},


	// Renders the HTML for a row, leveraging custom cell-HTML-renderers based on the `rowType`.
	// Also applies the "intro" and "outro" cells, which are specified by the subclass and views.
	// `row` is an optional row number.
	rowHtml: function(rowType, row) {
		var renderCell = this.getHtmlRenderer('cell', rowType);
		var rowCellHtml = '';
		var col;
		var cell;

		row = row || 0;

		for (col = 0; col < this.colCnt; col++) {
			cell = this.getCell(row, col);
			rowCellHtml += renderCell(cell);
		}

		rowCellHtml = this.bookendCells(rowCellHtml, rowType, row); // apply intro and outro

		return '<tr>' + rowCellHtml + '</tr>';
	},


	// Applies the "intro" and "outro" HTML to the given cells.
	// Intro means the leftmost cell when the calendar is LTR and the rightmost cell when RTL. Vice-versa for outro.
	// `cells` can be an HTML string of <td>'s or a jQuery <tr> element
	// `row` is an optional row number.
	bookendCells: function(cells, rowType, row) {
		var intro = this.getHtmlRenderer('intro', rowType)(row || 0);
		var outro = this.getHtmlRenderer('outro', rowType)(row || 0);
		var prependHtml = this.isRTL ? outro : intro;
		var appendHtml = this.isRTL ? intro : outro;

		if (typeof cells === 'string') {
			return prependHtml + cells + appendHtml;
		}
		else { // a jQuery <tr> element
			return cells.prepend(prependHtml).append(appendHtml);
		}
	},


	// Returns an HTML-rendering function given a specific `rendererName` (like cell, intro, or outro) and a specific
	// `rowType` (like day, eventSkeleton, helperSkeleton), which is optional.
	// If a renderer for the specific rowType doesn't exist, it will fall back to a generic renderer.
	// We will query the View object first for any custom rendering functions, then the methods of the subclass.
	getHtmlRenderer: function(rendererName, rowType) {
		var view = this.view;
		var generalName; // like "cellHtml"
		var specificName; // like "dayCellHtml". based on rowType
		var provider; // either the View or the RowRenderer subclass, whichever provided the method
		var renderer;

		generalName = rendererName + 'Html';
		if (rowType) {
			specificName = rowType + capitaliseFirstLetter(rendererName) + 'Html';
		}

		if (specificName && (renderer = view[specificName])) {
			provider = view;
		}
		else if (specificName && (renderer = this[specificName])) {
			provider = this;
		}
		else if ((renderer = view[generalName])) {
			provider = view;
		}
		else if ((renderer = this[generalName])) {
			provider = this;
		}

		if (typeof renderer === 'function') {
			return function() {
				return renderer.apply(provider, arguments) || ''; // use correct `this` and always return a string
			};
		}

		// the rendered can be a plain string as well. if not specified, always an empty string.
		return function() {
			return renderer || '';
		};
	}

});

    /* An abstract class comprised of a "grid" of cells that each represent a specific datetime
----------------------------------------------------------------------------------------------------------------------*/

var Grid = fc.Grid = RowRenderer.extend({

	start: null, // the date of the first cell
	end: null, // the date after the last cell

	rowCnt: 0, // number of rows
	colCnt: 0, // number of cols
	rowData: null, // array of objects, holding misc data for each row
	colData: null, // array of objects, holding misc data for each column

	el: null, // the containing element
	coordMap: null, // a GridCoordMap that converts pixel values to datetimes
	elsByFill: null, // a hash of jQuery element sets used for rendering each fill. Keyed by fill name.

	documentDragStartProxy: null, // binds the Grid's scope to documentDragStart (in DayGrid.events)

	// derived from options
	colHeadFormat: null, // TODO: move to another class. not applicable to all Grids
	eventTimeFormat: null,
	displayEventEnd: null,


	constructor: function() {
		RowRenderer.apply(this, arguments); // call the super-constructor

		this.coordMap = new GridCoordMap(this);
		this.elsByFill = {};
		this.documentDragStartProxy = $.proxy(this, 'documentDragStart');
	},


	// Renders the grid into the `el` element.
	// Subclasses should override and call this super-method when done.
	render: function() {
		this.bindHandlers();
	},


	// Called when the grid's resources need to be cleaned up
	destroy: function() {
		this.unbindHandlers();
	},


	/* Options
	------------------------------------------------------------------------------------------------------------------*/


	// Generates the format string used for the text in column headers, if not explicitly defined by 'columnFormat'
	// TODO: move to another class. not applicable to all Grids
	computeColHeadFormat: function() {
		// subclasses must implement if they want to use headHtml()
	},


	// Generates the format string used for event time text, if not explicitly defined by 'timeFormat'
	computeEventTimeFormat: function() {
		return this.view.opt('smallTimeFormat');
	},


	// Determines whether events should have their end times displayed, if not explicitly defined by 'displayEventEnd'
	computeDisplayEventEnd: function() {
		return false;
	},


	/* Dates
	------------------------------------------------------------------------------------------------------------------*/


	// Tells the grid about what period of time to display. Grid will subsequently compute dates for cell system.
	setRange: function(range) {
		var view = this.view;

		this.start = range.start.clone();
		this.end = range.end.clone();

		this.rowData = [];
		this.colData = [];
		this.updateCells();

		// Populate option-derived settings. Look for override first, then compute if necessary.
		this.colHeadFormat = view.opt('columnFormat') || this.computeColHeadFormat();
		this.eventTimeFormat = view.opt('timeFormat') || this.computeEventTimeFormat();
		this.displayEventEnd = view.opt('displayEventEnd');
		if (this.displayEventEnd == null) {
			this.displayEventEnd = this.computeDisplayEventEnd();
		}
	},


	// Responsible for setting rowCnt/colCnt and any other row/col data
	updateCells: function() {
		// subclasses must implement
	},


	// Converts a range with an inclusive `start` and an exclusive `end` into an array of segment objects
	rangeToSegs: function(range) {
		// subclasses must implement
	},


	/* Cells
	------------------------------------------------------------------------------------------------------------------*/
	// NOTE: columns are ordered left-to-right


	// Gets an object containing row/col number, misc data, and range information about the cell.
	// Accepts row/col values, an object with row/col properties, or a single-number offset from the first cell.
	getCell: function(row, col) {
		var cell;

		if (col == null) {
			if (typeof row === 'number') { // a single-number offset
				col = row % this.colCnt;
				row = Math.floor(row / this.colCnt);
			}
			else { // an object with row/col properties
				col = row.col;
				row = row.row;
			}
		}

		cell = { row: row, col: col };

		$.extend(cell, this.getRowData(row), this.getColData(col));
		$.extend(cell, this.computeCellRange(cell));

		return cell;
	},


	// Given a cell object with index and misc data, generates a range object
	computeCellRange: function(cell) {
		// subclasses must implement
	},


	// Retrieves misc data about the given row
	getRowData: function(row) {
		return this.rowData[row] || {};
	},


	// Retrieves misc data baout the given column
	getColData: function(col) {
		return this.colData[col] || {};
	},


	// Retrieves the element representing the given row
	getRowEl: function(row) {
		// subclasses should implement if leveraging the default getCellDayEl() or computeRowCoords()
	},


	// Retrieves the element representing the given column
	getColEl: function(col) {
		// subclasses should implement if leveraging the default getCellDayEl() or computeColCoords()
	},


	// Given a cell object, returns the element that represents the cell's whole-day
	getCellDayEl: function(cell) {
		return this.getColEl(cell.col) || this.getRowEl(cell.row);
	},


	/* Cell Coordinates
	------------------------------------------------------------------------------------------------------------------*/


	// Computes the top/bottom coordinates of all rows.
	// By default, queries the dimensions of the element provided by getRowEl().
	computeRowCoords: function() {
		var items = [];
		var i, el;
		var item;

		for (i = 0; i < this.rowCnt; i++) {
			el = this.getRowEl(i);
			item = {
				top: el.offset().top
			};
			if (i > 0) {
				items[i - 1].bottom = item.top;
			}
			items.push(item);
		}
		item.bottom = item.top + el.outerHeight();

		return items;
	},


	// Computes the left/right coordinates of all rows.
	// By default, queries the dimensions of the element provided by getColEl().
	computeColCoords: function() {
		var items = [];
		var i, el;
		var item;

		for (i = 0; i < this.colCnt; i++) {
			el = this.getColEl(i);
			item = {
				left: el.offset().left
			};
			if (i > 0) {
				items[i - 1].right = item.left;
			}
			items.push(item);
		}
		item.right = item.left + el.outerWidth();

		return items;
	},


	/* Handlers
	------------------------------------------------------------------------------------------------------------------*/


	// Attaches handlers to DOM
	bindHandlers: function() {
		var _this = this;

		// attach a handler to the grid's root element.
		// we don't need to clean up in unbindHandlers or destroy, because when jQuery removes the element from the
		// DOM it automatically unregisters the handlers.
		this.el.on('mousedown', function(ev) {
			if (
				!$(ev.target).is('.fc-event-container *, .fc-more') && // not an an event element, or "more.." link
				!$(ev.target).closest('.fc-popover').length // not on a popover (like the "more.." events one)
			) {
				_this.dayMousedown(ev);
			}
		});

		// attach event-element-related handlers. in Grid.events
		// same garbage collection note as above.
		this.bindSegHandlers();

		$(document).on('dragstart', this.documentDragStartProxy); // jqui drag
	},


	// Unattaches handlers from the DOM
	unbindHandlers: function() {
		$(document).off('dragstart', this.documentDragStartProxy); // jqui drag
	},


	// Process a mousedown on an element that represents a day. For day clicking and selecting.
	dayMousedown: function(ev) {
		var _this = this;
		var view = this.view;
		var isSelectable = view.opt('selectable');
		var dayClickCell; // null if invalid dayClick
		var selectionRange; // null if invalid selection

		// this listener tracks a mousedown on a day element, and a subsequent drag.
		// if the drag ends on the same day, it is a 'dayClick'.
		// if 'selectable' is enabled, this listener also detects selections.
		var dragListener = new DragListener(this.coordMap, {
			//distance: 5, // needs more work if we want dayClick to fire correctly
			scroll: view.opt('dragScroll'),
			dragStart: function() {
				view.unselect(); // since we could be rendering a new selection, we want to clear any old one
			},
			cellOver: function(cell, isOrig) {
				var origCell = dragListener.origCell;
				if (origCell) { // click needs to have started on a cell
					dayClickCell = isOrig ? cell : null; // single-cell selection is a day click
					if (isSelectable) {
						selectionRange = _this.computeSelection(origCell, cell);
						if (selectionRange) {
							_this.renderSelection(selectionRange);
						}
						else {
							disableCursor();
						}
					}
				}
			},
			cellOut: function(cell) {
				dayClickCell = null;
				selectionRange = null;
				_this.destroySelection();
				enableCursor();
			},
			listenStop: function(ev) {
				if (dayClickCell) {
					view.trigger('dayClick', _this.getCellDayEl(dayClickCell), dayClickCell.start, ev);
				}
				if (selectionRange) {
					// the selection will already have been rendered. just report it
					view.reportSelection(selectionRange, ev);
				}
				enableCursor();
			}
		});

		dragListener.mousedown(ev); // start listening, which will eventually initiate a dragStart
	},


	/* Event Helper
	------------------------------------------------------------------------------------------------------------------*/
	// TODO: should probably move this to Grid.events, like we did event dragging / resizing


	// Renders a mock event over the given range.
	// The range's end can be null, in which case the mock event that is rendered will have a null end time.
	// `sourceSeg` is the internal segment object involved in the drag. If null, something external is dragging.
	renderRangeHelper: function(range, sourceSeg) {
		var fakeEvent;

		fakeEvent = sourceSeg ? createObject(sourceSeg.event) : {}; // mask the original event object if possible
		fakeEvent.start = range.start.clone();
		fakeEvent.end = range.end ? range.end.clone() : null;
		fakeEvent.allDay = null; // force it to be freshly computed by normalizeEventDateProps
		this.view.calendar.normalizeEventDateProps(fakeEvent);

		// this extra className will be useful for differentiating real events from mock events in CSS
		fakeEvent.className = (fakeEvent.className || []).concat('fc-helper');

		// if something external is being dragged in, don't render a resizer
		if (!sourceSeg) {
			fakeEvent.editable = false;
		}

		this.renderHelper(fakeEvent, sourceSeg); // do the actual rendering
	},


	// Renders a mock event
	renderHelper: function(event, sourceSeg) {
		// subclasses must implement
	},


	// Unrenders a mock event
	destroyHelper: function() {
		// subclasses must implement
	},


	/* Selection
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a visual indication of a selection. Will highlight by default but can be overridden by subclasses.
	renderSelection: function(range) {
		this.renderHighlight(range);
	},


	// Unrenders any visual indications of a selection. Will unrender a highlight by default.
	destroySelection: function() {
		this.destroyHighlight();
	},


	// Given the first and last cells of a selection, returns a range object.
	// Will return something falsy if the selection is invalid (when outside of selectionConstraint for example).
	// Subclasses can override and provide additional data in the range object. Will be passed to renderSelection().
	computeSelection: function(firstCell, lastCell) {
		var dates = [
			firstCell.start,
			firstCell.end,
			lastCell.start,
			lastCell.end
		];
		var range;

		dates.sort(compareNumbers); // sorts chronologically. works with Moments

		range = {
			start: dates[0].clone(),
			end: dates[3].clone()
		};

		if (!this.view.calendar.isSelectionRangeAllowed(range)) {
			return null;
		}

		return range;
	},


	/* Highlight
	------------------------------------------------------------------------------------------------------------------*/


	// Renders an emphasis on the given date range. `start` is inclusive. `end` is exclusive.
	renderHighlight: function(range) {
		this.renderFill('highlight', this.rangeToSegs(range));
	},


	// Unrenders the emphasis on a date range
	destroyHighlight: function() {
		this.destroyFill('highlight');
	},


	// Generates an array of classNames for rendering the highlight. Used by the fill system.
	highlightSegClasses: function() {
		return [ 'fc-highlight' ];
	},


	/* Fill System (highlight, background events, business hours)
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a set of rectangles over the given segments of time.
	// Returns a subset of segs, the segs that were actually rendered.
	// Responsible for populating this.elsByFill. TODO: better API for expressing this requirement
	renderFill: function(type, segs) {
		// subclasses must implement
	},


	// Unrenders a specific type of fill that is currently rendered on the grid
	destroyFill: function(type) {
		var el = this.elsByFill[type];

		if (el) {
			el.remove();
			delete this.elsByFill[type];
		}
	},


	// Renders and assigns an `el` property for each fill segment. Generic enough to work with different types.
	// Only returns segments that successfully rendered.
	// To be harnessed by renderFill (implemented by subclasses).
	// Analagous to renderFgSegEls.
	renderFillSegEls: function(type, segs) {
		var _this = this;
		var segElMethod = this[type + 'SegEl'];
		var html = '';
		var renderedSegs = [];
		var i;

		if (segs.length) {

			// build a large concatenation of segment HTML
			for (i = 0; i < segs.length; i++) {
				html += this.fillSegHtml(type, segs[i]);
			}

			// Grab individual elements from the combined HTML string. Use each as the default rendering.
			// Then, compute the 'el' for each segment.
			$(html).each(function(i, node) {
				var seg = segs[i];
				var el = $(node);

				// allow custom filter methods per-type
				if (segElMethod) {
					el = segElMethod.call(_this, seg, el);
				}

				if (el) { // custom filters did not cancel the render
					el = $(el); // allow custom filter to return raw DOM node

					// correct element type? (would be bad if a non-TD were inserted into a table for example)
					if (el.is(_this.fillSegTag)) {
						seg.el = el;
						renderedSegs.push(seg);
					}
				}
			});
		}

		return renderedSegs;
	},


	fillSegTag: 'div', // subclasses can override


	// Builds the HTML needed for one fill segment. Generic enought o work with different types.
	fillSegHtml: function(type, seg) {
		var classesMethod = this[type + 'SegClasses']; // custom hooks per-type
		var stylesMethod = this[type + 'SegStyles']; //
		var classes = classesMethod ? classesMethod.call(this, seg) : [];
		var styles = stylesMethod ? stylesMethod.call(this, seg) : ''; // a semi-colon separated CSS property string

		return '<' + this.fillSegTag +
			(classes.length ? ' class="' + classes.join(' ') + '"' : '') +
			(styles ? ' style="' + styles + '"' : '') +
			' />';
	},


	/* Generic rendering utilities for subclasses
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a day-of-week header row.
	// TODO: move to another class. not applicable to all Grids
	headHtml: function() {
		return '' +
			'<div class="fc-row ' + this.view.widgetHeaderClass + '">' +
				'<table>' +
					'<thead>' +
						this.rowHtml('head') + // leverages RowRenderer
					'</thead>' +
				'</table>' +
			'</div>';
	},


	// Used by the `headHtml` method, via RowRenderer, for rendering the HTML of a day-of-week header cell
	// TODO: move to another class. not applicable to all Grids
	headCellHtml: function(cell) {
		var view = this.view;
		var date = cell.start;

		return '' +
			'<th class="fc-day-header ' + view.widgetHeaderClass + ' fc-' + dayIDs[date.day()] + '">' +
				htmlEscape(date.format(this.colHeadFormat)) +
			'</th>';
	},


	// Renders the HTML for a single-day background cell
	bgCellHtml: function(cell) {
		var view = this.view;
		var date = cell.start;
		var classes = this.getDayClasses(date);

		classes.unshift('fc-day', view.widgetContentClass);

		return '<td class="' + classes.join(' ') + '"' +
			' data-date="' + date.format('YYYY-MM-DD') + '"' + // if date has a time, won't format it
			'></td>';
	},


	// Computes HTML classNames for a single-day cell
	getDayClasses: function(date) {
		var view = this.view;
		var today = view.calendar.getNow().stripTime();
		var classes = [ 'fc-' + dayIDs[date.day()] ];

		if (
			view.name === 'month' &&
			date.month() != view.intervalStart.month()
		) {
			classes.push('fc-other-month');
		}

		if (date.isSame(today, 'day')) {
			classes.push(
				'fc-today',
				view.highlightStateClass
			);
		}
		else if (date < today) {
			classes.push('fc-past');
		}
		else {
			classes.push('fc-future');
		}

		return classes;
	}

});

    /* Event-rendering and event-interaction methods for the abstract Grid class
----------------------------------------------------------------------------------------------------------------------*/

Grid.mixin({

	mousedOverSeg: null, // the segment object the user's mouse is over. null if over nothing
	isDraggingSeg: false, // is a segment being dragged? boolean
	isResizingSeg: false, // is a segment being resized? boolean
	segs: null, // the event segments currently rendered in the grid


	// Renders the given events onto the grid
	renderEvents: function(events) {
		var segs = this.eventsToSegs(events);
		var bgSegs = [];
		var fgSegs = [];
		var i, seg;

		for (i = 0; i < segs.length; i++) {
			seg = segs[i];

			if (isBgEvent(seg.event)) {
				bgSegs.push(seg);
			}
			else {
				fgSegs.push(seg);
			}
		}

		// Render each different type of segment.
		// Each function may return a subset of the segs, segs that were actually rendered.
		bgSegs = this.renderBgSegs(bgSegs) || bgSegs;
		fgSegs = this.renderFgSegs(fgSegs) || fgSegs;

		this.segs = bgSegs.concat(fgSegs);
	},


	// Unrenders all events currently rendered on the grid
	destroyEvents: function() {
		this.triggerSegMouseout(); // trigger an eventMouseout if user's mouse is over an event

		this.destroyFgSegs();
		this.destroyBgSegs();

		this.segs = null;
	},


	// Retrieves all rendered segment objects currently rendered on the grid
	getEventSegs: function() {
		return this.segs || [];
	},


	/* Foreground Segment Rendering
	------------------------------------------------------------------------------------------------------------------*/


	// Renders foreground event segments onto the grid. May return a subset of segs that were rendered.
	renderFgSegs: function(segs) {
		// subclasses must implement
	},


	// Unrenders all currently rendered foreground segments
	destroyFgSegs: function() {
		// subclasses must implement
	},


	// Renders and assigns an `el` property for each foreground event segment.
	// Only returns segments that successfully rendered.
	// A utility that subclasses may use.
	renderFgSegEls: function(segs, disableResizing) {
		var view = this.view;
		var html = '';
		var renderedSegs = [];
		var i;

		if (segs.length) { // don't build an empty html string

			// build a large concatenation of event segment HTML
			for (i = 0; i < segs.length; i++) {
				html += this.fgSegHtml(segs[i], disableResizing);
			}

			// Grab individual elements from the combined HTML string. Use each as the default rendering.
			// Then, compute the 'el' for each segment. An el might be null if the eventRender callback returned false.
			$(html).each(function(i, node) {
				var seg = segs[i];
				var el = view.resolveEventEl(seg.event, $(node));

				if (el) {
					el.data('fc-seg', seg); // used by handlers
					seg.el = el;
					renderedSegs.push(seg);
				}
			});
		}

		return renderedSegs;
	},


	// Generates the HTML for the default rendering of a foreground event segment. Used by renderFgSegEls()
	fgSegHtml: function(seg, disableResizing) {
		// subclasses should implement
	},


	/* Background Segment Rendering
	------------------------------------------------------------------------------------------------------------------*/


	// Renders the given background event segments onto the grid.
	// Returns a subset of the segs that were actually rendered.
	renderBgSegs: function(segs) {
		return this.renderFill('bgEvent', segs);
	},


	// Unrenders all the currently rendered background event segments
	destroyBgSegs: function() {
		this.destroyFill('bgEvent');
	},


	// Renders a background event element, given the default rendering. Called by the fill system.
	bgEventSegEl: function(seg, el) {
		return this.view.resolveEventEl(seg.event, el); // will filter through eventRender
	},


	// Generates an array of classNames to be used for the default rendering of a background event.
	// Called by the fill system.
	bgEventSegClasses: function(seg) {
		var event = seg.event;
		var source = event.source || {};

		return [ 'fc-bgevent' ].concat(
			event.className,
			source.className || []
		);
	},


	// Generates a semicolon-separated CSS string to be used for the default rendering of a background event.
	// Called by the fill system.
	// TODO: consolidate with getEventSkinCss?
	bgEventSegStyles: function(seg) {
		var view = this.view;
		var event = seg.event;
		var source = event.source || {};
		var eventColor = event.color;
		var sourceColor = source.color;
		var optionColor = view.opt('eventColor');
		var backgroundColor =
			event.backgroundColor ||
			eventColor ||
			source.backgroundColor ||
			sourceColor ||
			view.opt('eventBackgroundColor') ||
			optionColor;

		if (backgroundColor) {
			return 'background-color:' + backgroundColor;
		}

		return '';
	},


	// Generates an array of classNames to be used for the rendering business hours overlay. Called by the fill system.
	businessHoursSegClasses: function(seg) {
		return [ 'fc-nonbusiness', 'fc-bgevent' ];
	},


	/* Handlers
	------------------------------------------------------------------------------------------------------------------*/


	// Attaches event-element-related handlers to the container element and leverage bubbling
	bindSegHandlers: function() {
		var _this = this;
		var view = this.view;

		$.each(
			{
				mouseenter: function(seg, ev) {
					_this.triggerSegMouseover(seg, ev);
				},
				mouseleave: function(seg, ev) {
					_this.triggerSegMouseout(seg, ev);
				},
				click: function(seg, ev) {
					return view.trigger('eventClick', this, seg.event, ev); // can return `false` to cancel
				},
				mousedown: function(seg, ev) {
					if ($(ev.target).is('.fc-resizer') && view.isEventResizable(seg.event)) {
						_this.segResizeMousedown(seg, ev);
					}
					else if (view.isEventDraggable(seg.event)) {
						_this.segDragMousedown(seg, ev);
					}
				}
			},
			function(name, func) {
				// attach the handler to the container element and only listen for real event elements via bubbling
				_this.el.on(name, '.fc-event-container > *', function(ev) {
					var seg = $(this).data('fc-seg'); // grab segment data. put there by View::renderEvents

					// only call the handlers if there is not a drag/resize in progress
					if (seg && !_this.isDraggingSeg && !_this.isResizingSeg) {
						return func.call(this, seg, ev); // `this` will be the event element
					}
				});
			}
		);
	},


	// Updates internal state and triggers handlers for when an event element is moused over
	triggerSegMouseover: function(seg, ev) {
		if (!this.mousedOverSeg) {
			this.mousedOverSeg = seg;
			this.view.trigger('eventMouseover', seg.el[0], seg.event, ev);
		}
	},


	// Updates internal state and triggers handlers for when an event element is moused out.
	// Can be given no arguments, in which case it will mouseout the segment that was previously moused over.
	triggerSegMouseout: function(seg, ev) {
		ev = ev || {}; // if given no args, make a mock mouse event

		if (this.mousedOverSeg) {
			seg = seg || this.mousedOverSeg; // if given no args, use the currently moused-over segment
			this.mousedOverSeg = null;
			this.view.trigger('eventMouseout', seg.el[0], seg.event, ev);
		}
	},


	/* Event Dragging
	------------------------------------------------------------------------------------------------------------------*/


	// Called when the user does a mousedown on an event, which might lead to dragging.
	// Generic enough to work with any type of Grid.
	segDragMousedown: function(seg, ev) {
		var _this = this;
		var view = this.view;
		var el = seg.el;
		var event = seg.event;
		var dropLocation;

		// A clone of the original element that will move with the mouse
		var mouseFollower = new MouseFollower(seg.el, {
			parentEl: view.el,
			opacity: view.opt('dragOpacity'),
			revertDuration: view.opt('dragRevertDuration'),
			zIndex: 2 // one above the .fc-view
		});

		// Tracks mouse movement over the *view's* coordinate map. Allows dragging and dropping between subcomponents
		// of the view.
		var dragListener = new DragListener(view.coordMap, {
			distance: 5,
			scroll: view.opt('dragScroll'),
			listenStart: function(ev) {
				mouseFollower.hide(); // don't show until we know this is a real drag
				mouseFollower.start(ev);
			},
			dragStart: function(ev) {
				_this.triggerSegMouseout(seg, ev); // ensure a mouseout on the manipulated event has been reported
				_this.isDraggingSeg = true;
				view.hideEvent(event); // hide all event segments. our mouseFollower will take over
				view.trigger('eventDragStart', el[0], event, ev, {}); // last argument is jqui dummy
			},
			cellOver: function(cell, isOrig) {
				var origCell = seg.cell || dragListener.origCell; // starting cell could be forced (DayGrid.limit)

				dropLocation = _this.computeEventDrop(origCell, cell, event);
				if (dropLocation) {
					if (view.renderDrag(dropLocation, seg)) { // have the subclass render a visual indication
						mouseFollower.hide(); // if the subclass is already using a mock event "helper", hide our own
					}
					else {
						mouseFollower.show();
					}
					if (isOrig) {
						dropLocation = null; // needs to have moved cells to be a valid drop
					}
				}
				else {
					// have the helper follow the mouse (no snapping) with a warning-style cursor
					mouseFollower.show();
					disableCursor();
				}
			},
			cellOut: function() { // called before mouse moves to a different cell OR moved out of all cells
				dropLocation = null;
				view.destroyDrag(); // unrender whatever was done in renderDrag
				mouseFollower.show(); // show in case we are moving out of all cells
				enableCursor();
			},
			dragStop: function(ev) {
				// do revert animation if hasn't changed. calls a callback when finished (whether animation or not)
				mouseFollower.stop(!dropLocation, function() {
					_this.isDraggingSeg = false;
					view.destroyDrag();
					view.showEvent(event);
					view.trigger('eventDragStop', el[0], event, ev, {}); // last argument is jqui dummy

					if (dropLocation) {
						view.reportEventDrop(event, dropLocation, el, ev);
					}
				});
				enableCursor();
			},
			listenStop: function() {
				mouseFollower.stop(); // put in listenStop in case there was a mousedown but the drag never started
			}
		});

		dragListener.mousedown(ev); // start listening, which will eventually lead to a dragStart
	},


	// Given the cell an event drag began, and the cell event was dropped, calculates the new start/end/allDay
	// values for the event. Subclasses may override and set additional properties to be used by renderDrag.
	// A falsy returned value indicates an invalid drop.
	computeEventDrop: function(startCell, endCell, event) {
		var dragStart = startCell.start;
		var dragEnd = endCell.start;
		var delta;
		var newStart;
		var newEnd;
		var newAllDay;
		var dropLocation;

		if (dragStart.hasTime() === dragEnd.hasTime()) {
			delta = diffDayTime(dragEnd, dragStart);
			newStart = event.start.clone().add(delta);
			if (event.end === null) { // do we need to compute an end?
				newEnd = null;
			}
			else {
				newEnd = event.end.clone().add(delta);
			}
			newAllDay = event.allDay; // keep it the same
		}
		else {
			// if switching from day <-> timed, start should be reset to the dropped date, and the end cleared
			newStart = dragEnd.clone();
			newEnd = null; // end should be cleared
			newAllDay = !dragEnd.hasTime();
		}

		dropLocation = {
			start: newStart,
			end: newEnd,
			allDay: newAllDay
		};

		if (!this.view.calendar.isEventRangeAllowed(dropLocation, event)) {
			return null;
		}

		return dropLocation;
	},


	/* External Element Dragging
	------------------------------------------------------------------------------------------------------------------*/


	// Called when a jQuery UI drag is initiated anywhere in the DOM
	documentDragStart: function(ev, ui) {
		var view = this.view;
		var el;
		var accept;

		if (view.opt('droppable')) { // only listen if this setting is on
			el = $(ev.target);

			// Test that the dragged element passes the dropAccept selector or filter function.
			// FYI, the default is "*" (matches all)
			accept = view.opt('dropAccept');
			if ($.isFunction(accept) ? accept.call(el[0], el) : el.is(accept)) {

				this.startExternalDrag(el, ev, ui);
			}
		}
	},


	// Called when a jQuery UI drag starts and it needs to be monitored for cell dropping
	startExternalDrag: function(el, ev, ui) {
		var _this = this;
		var meta = getDraggedElMeta(el); // extra data about event drop, including possible event to create
		var dragListener;
		var dropLocation; // a null value signals an unsuccessful drag

		// listener that tracks mouse movement over date-associated pixel regions
		dragListener = new DragListener(this.coordMap, {
			cellOver: function(cell) {
				dropLocation = _this.computeExternalDrop(cell, meta);
				if (dropLocation) {
					_this.renderDrag(dropLocation); // called without a seg parameter
				}
				else { // invalid drop cell
					disableCursor();
				}
			},
			cellOut: function() {
				dropLocation = null; // signal unsuccessful
				_this.destroyDrag();
				enableCursor();
			}
		});

		// gets called, only once, when jqui drag is finished
		$(document).one('dragstop', function(ev, ui) {
			_this.destroyDrag();
			enableCursor();

			if (dropLocation) { // element was dropped on a valid date/time cell
				_this.view.reportExternalDrop(meta, dropLocation, el, ev, ui);
			}
		});

		dragListener.startDrag(ev); // start listening immediately
	},


	// Given a cell to be dropped upon, and misc data associated with the jqui drag (guaranteed to be a plain object),
	// returns start/end dates for the event that would result from the hypothetical drop. end might be null.
	// Returning a null value signals an invalid drop cell.
	computeExternalDrop: function(cell, meta) {
		var dropLocation = {
			start: cell.start.clone(),
			end: null
		};

		// if dropped on an all-day cell, and element's metadata specified a time, set it
		if (meta.startTime && !dropLocation.start.hasTime()) {
			dropLocation.start.time(meta.startTime);
		}

		if (meta.duration) {
			dropLocation.end = dropLocation.start.clone().add(meta.duration);
		}

		if (!this.view.calendar.isExternalDropRangeAllowed(dropLocation, meta.eventProps)) {
			return null;
		}

		return dropLocation;
	},



	/* Drag Rendering (for both events and an external elements)
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a visual indication of an event or external element being dragged.
	// `dropLocation` contains hypothetical start/end/allDay values the event would have if dropped. end can be null.
	// `seg` is the internal segment object that is being dragged. If dragging an external element, `seg` is null.
	// A truthy returned value indicates this method has rendered a helper element.
	renderDrag: function(dropLocation, seg) {
		// subclasses must implement
	},


	// Unrenders a visual indication of an event or external element being dragged
	destroyDrag: function() {
		// subclasses must implement
	},


	/* Resizing
	------------------------------------------------------------------------------------------------------------------*/


	// Called when the user does a mousedown on an event's resizer, which might lead to resizing.
	// Generic enough to work with any type of Grid.
	segResizeMousedown: function(seg, ev) {
		var _this = this;
		var view = this.view;
		var calendar = view.calendar;
		var el = seg.el;
		var event = seg.event;
		var start = event.start;
		var oldEnd = calendar.getEventEnd(event);
		var newEnd; // falsy if invalid resize
		var dragListener;

		function destroy() { // resets the rendering to show the original event
			_this.destroyEventResize();
			view.showEvent(event);
			enableCursor();
		}

		// Tracks mouse movement over the *grid's* coordinate map
		dragListener = new DragListener(this.coordMap, {
			distance: 5,
			scroll: view.opt('dragScroll'),
			dragStart: function(ev) {
				_this.triggerSegMouseout(seg, ev); // ensure a mouseout on the manipulated event has been reported
				_this.isResizingSeg = true;
				view.trigger('eventResizeStart', el[0], event, ev, {}); // last argument is jqui dummy
			},
			cellOver: function(cell) {
				newEnd = cell.end;

				if (!newEnd.isAfter(start)) { // was end moved before start?
					newEnd = start.clone().add( // make the event span a single slot
						diffDayTime(cell.end, cell.start) // assumes all slot durations are the same
					);
				}

				if (newEnd.isSame(oldEnd)) {
					newEnd = null;
				}
				else if (!calendar.isEventRangeAllowed({ start: start, end: newEnd }, event)) {
					newEnd = null;
					disableCursor();
				}
				else {
					_this.renderEventResize({ start: start, end: newEnd }, seg);
					view.hideEvent(event);
				}
			},
			cellOut: function() { // called before mouse moves to a different cell OR moved out of all cells
				newEnd = null;
				destroy();
			},
			dragStop: function(ev) {
				_this.isResizingSeg = false;
				destroy();
				view.trigger('eventResizeStop', el[0], event, ev, {}); // last argument is jqui dummy

				if (newEnd) { // valid date to resize to?
					view.reportEventResize(event, newEnd, el, ev);
				}
			}
		});

		dragListener.mousedown(ev); // start listening, which will eventually lead to a dragStart
	},


	// Renders a visual indication of an event being resized.
	// `range` has the updated dates of the event. `seg` is the original segment object involved in the drag.
	renderEventResize: function(range, seg) {
		// subclasses must implement
	},


	// Unrenders a visual indication of an event being resized.
	destroyEventResize: function() {
		// subclasses must implement
	},


	/* Rendering Utils
	------------------------------------------------------------------------------------------------------------------*/


	// Compute the text that should be displayed on an event's element.
	// `range` can be the Event object itself, or something range-like, with at least a `start`.
	// The `timeFormat` options and the grid's default format is used, but `formatStr` can override.
	getEventTimeText: function(range, formatStr) {

		formatStr = formatStr || this.eventTimeFormat;

		if (range.end && this.displayEventEnd) {
			return this.view.formatRange(range, formatStr);
		}
		else {
			return range.start.format(formatStr);
		}
	},


	// Generic utility for generating the HTML classNames for an event segment's element
	getSegClasses: function(seg, isDraggable, isResizable) {
		var event = seg.event;
		var classes = [
			'fc-event',
			seg.isStart ? 'fc-start' : 'fc-not-start',
			seg.isEnd ? 'fc-end' : 'fc-not-end'
		].concat(
			event.className,
			event.source ? event.source.className : []
		);

		if (isDraggable) {
			classes.push('fc-draggable');
		}
		if (isResizable) {
			classes.push('fc-resizable');
		}

		return classes;
	},


	// Utility for generating a CSS string with all the event skin-related properties
	getEventSkinCss: function(event) {
		var view = this.view;
		var source = event.source || {};
		var eventColor = event.color;
		var sourceColor = source.color;
		var optionColor = view.opt('eventColor');
		var backgroundColor =
			event.backgroundColor ||
			eventColor ||
			source.backgroundColor ||
			sourceColor ||
			view.opt('eventBackgroundColor') ||
			optionColor;
		var borderColor =
			event.borderColor ||
			eventColor ||
			source.borderColor ||
			sourceColor ||
			view.opt('eventBorderColor') ||
			optionColor;
		var textColor =
			event.textColor ||
			source.textColor ||
			view.opt('eventTextColor');
		var statements = [];
		if (backgroundColor) {
			statements.push('background-color:' + backgroundColor);
		}
		if (borderColor) {
			statements.push('border-color:' + borderColor);
		}
		if (textColor) {
			statements.push('color:' + textColor);
		}
		return statements.join(';');
	},


	/* Converting events -> ranges -> segs
	------------------------------------------------------------------------------------------------------------------*/


	// Converts an array of event objects into an array of event segment objects.
	// A custom `rangeToSegsFunc` may be given for arbitrarily slicing up events.
	eventsToSegs: function(events, rangeToSegsFunc) {
		var eventRanges = this.eventsToRanges(events);
		var segs = [];
		var i;

		for (i = 0; i < eventRanges.length; i++) {
			segs.push.apply(
				segs,
				this.eventRangeToSegs(eventRanges[i], rangeToSegsFunc)
			);
		}

		return segs;
	},


	// Converts an array of events into an array of "range" objects.
	// A "range" object is a plain object with start/end properties denoting the time it covers. Also an event property.
	// For "normal" events, this will be identical to the event's start/end, but for "inverse-background" events,
	// will create an array of ranges that span the time *not* covered by the given event.
	eventsToRanges: function(events) {
		var _this = this;
		var eventsById = groupEventsById(events);
		var ranges = [];

		// group by ID so that related inverse-background events can be rendered together
		$.each(eventsById, function(id, eventGroup) {
			if (eventGroup.length) {
				ranges.push.apply(
					ranges,
					isInverseBgEvent(eventGroup[0]) ?
						_this.eventsToInverseRanges(eventGroup) :
						_this.eventsToNormalRanges(eventGroup)
				);
			}
		});

		return ranges;
	},


	// Converts an array of "normal" events (not inverted rendering) into a parallel array of ranges
	eventsToNormalRanges: function(events) {
		var calendar = this.view.calendar;
		var ranges = [];
		var i, event;
		var eventStart, eventEnd;

		for (i = 0; i < events.length; i++) {
			event = events[i];

			// make copies and normalize by stripping timezone
			eventStart = event.start.clone().stripZone();
			eventEnd = calendar.getEventEnd(event).stripZone();

			ranges.push({
				event: event,
				start: eventStart,
				end: eventEnd,
				eventStartMS: +eventStart,
				eventDurationMS: eventEnd - eventStart
			});
		}

		return ranges;
	},


	// Converts an array of events, with inverse-background rendering, into an array of range objects.
	// The range objects will cover all the time NOT covered by the events.
	eventsToInverseRanges: function(events) {
		var view = this.view;
		var viewStart = view.start.clone().stripZone(); // normalize timezone
		var viewEnd = view.end.clone().stripZone(); // normalize timezone
		var normalRanges = this.eventsToNormalRanges(events); // will give us normalized dates we can use w/o copies
		var inverseRanges = [];
		var event0 = events[0]; // assign this to each range's `.event`
		var start = viewStart; // the end of the previous range. the start of the new range
		var i, normalRange;

		// ranges need to be in order. required for our date-walking algorithm
		normalRanges.sort(compareNormalRanges);

		for (i = 0; i < normalRanges.length; i++) {
			normalRange = normalRanges[i];

			// add the span of time before the event (if there is any)
			if (normalRange.start > start) { // compare millisecond time (skip any ambig logic)
				inverseRanges.push({
					event: event0,
					start: start,
					end: normalRange.start
				});
			}

			start = normalRange.end;
		}

		// add the span of time after the last event (if there is any)
		if (start < viewEnd) { // compare millisecond time (skip any ambig logic)
			inverseRanges.push({
				event: event0,
				start: start,
				end: viewEnd
			});
		}

		return inverseRanges;
	},


	// Slices the given event range into one or more segment objects.
	// A `rangeToSegsFunc` custom slicing function can be given.
	eventRangeToSegs: function(eventRange, rangeToSegsFunc) {
		var segs;
		var i, seg;

		if (rangeToSegsFunc) {
			segs = rangeToSegsFunc(eventRange);
		}
		else {
			segs = this.rangeToSegs(eventRange); // defined by the subclass
		}

		for (i = 0; i < segs.length; i++) {
			seg = segs[i];
			seg.event = eventRange.event;
			seg.eventStartMS = eventRange.eventStartMS;
			seg.eventDurationMS = eventRange.eventDurationMS;
		}

		return segs;
	}

});


/* Utilities
----------------------------------------------------------------------------------------------------------------------*/


function isBgEvent(event) { // returns true if background OR inverse-background
	var rendering = getEventRendering(event);
	return rendering === 'background' || rendering === 'inverse-background';
}


function isInverseBgEvent(event) {
	return getEventRendering(event) === 'inverse-background';
}


function getEventRendering(event) {
	return firstDefined((event.source || {}).rendering, event.rendering);
}


function groupEventsById(events) {
	var eventsById = {};
	var i, event;

	for (i = 0; i < events.length; i++) {
		event = events[i];
		(eventsById[event._id] || (eventsById[event._id] = [])).push(event);
	}

	return eventsById;
}


// A cmp function for determining which non-inverted "ranges" (see above) happen earlier
function compareNormalRanges(range1, range2) {
	return range1.eventStartMS - range2.eventStartMS; // earlier ranges go first
}


// A cmp function for determining which segments should take visual priority
// DOES NOT WORK ON INVERTED BACKGROUND EVENTS because they have no eventStartMS/eventDurationMS
function compareSegs(seg1, seg2) {
	return seg1.eventStartMS - seg2.eventStartMS || // earlier events go first
		seg2.eventDurationMS - seg1.eventDurationMS || // tie? longer events go first
		seg2.event.allDay - seg1.event.allDay || // tie? put all-day events first (booleans cast to 0/1)
		(seg1.event.title || '').localeCompare(seg2.event.title); // tie? alphabetically by title
}

fc.compareSegs = compareSegs; // export


/* External-Dragging-Element Data
----------------------------------------------------------------------------------------------------------------------*/

// Require all HTML5 data-* attributes used by FullCalendar to have this prefix.
// A value of '' will query attributes like data-event. A value of 'fc' will query attributes like data-fc-event.
fc.dataAttrPrefix = '';

// Given a jQuery element that might represent a dragged FullCalendar event, returns an intermediate data structure
// to be used for Event Object creation.
// A defined `.eventProps`, even when empty, indicates that an event should be created.
function getDraggedElMeta(el) {
	var prefix = fc.dataAttrPrefix;
	var eventProps; // properties for creating the event, not related to date/time
	var startTime; // a Duration
	var duration;
	var stick;

	if (prefix) { prefix += '-'; }
	eventProps = el.data(prefix + 'event') || null;

	if (eventProps) {
		if (typeof eventProps === 'object') {
			eventProps = $.extend({}, eventProps); // make a copy
		}
		else { // something like 1 or true. still signal event creation
			eventProps = {};
		}

		// pluck special-cased date/time properties
		startTime = eventProps.start;
		if (startTime == null) { startTime = eventProps.time; } // accept 'time' as well
		duration = eventProps.duration;
		stick = eventProps.stick;
		delete eventProps.start;
		delete eventProps.time;
		delete eventProps.duration;
		delete eventProps.stick;
	}

	// fallback to standalone attribute values for each of the date/time properties
	if (startTime == null) { startTime = el.data(prefix + 'start'); }
	if (startTime == null) { startTime = el.data(prefix + 'time'); } // accept 'time' as well
	if (duration == null) { duration = el.data(prefix + 'duration'); }
	if (stick == null) { stick = el.data(prefix + 'stick'); }

	// massage into correct data types
	startTime = startTime != null ? moment.duration(startTime) : null;
	duration = duration != null ? moment.duration(duration) : null;
	stick = Boolean(stick);

	return { eventProps: eventProps, startTime: startTime, duration: duration, stick: stick };
}


    /* A component that renders a grid of whole-days that runs horizontally. There can be multiple rows, one per week.
----------------------------------------------------------------------------------------------------------------------*/

var DayGrid = Grid.extend({

	numbersVisible: false, // should render a row for day/week numbers? set by outside view. TODO: make internal
	bottomCoordPadding: 0, // hack for extending the hit area for the last row of the coordinate grid
	breakOnWeeks: null, // should create a new row for each week? set by outside view

	cellDates: null, // flat chronological array of each cell's dates
	dayToCellOffsets: null, // maps days offsets from grid's start date, to cell offsets

	rowEls: null, // set of fake row elements
	dayEls: null, // set of whole-day elements comprising the row's background
	helperEls: null, // set of cell skeleton elements for rendering the mock event "helper"


	// Renders the rows and columns into the component's `this.el`, which should already be assigned.
	// isRigid determins whether the individual rows should ignore the contents and be a constant height.
	// Relies on the view's colCnt and rowCnt. In the future, this component should probably be self-sufficient.
	render: function(isRigid) {
		var view = this.view;
		var rowCnt = this.rowCnt;
		var colCnt = this.colCnt;
		var cellCnt = rowCnt * colCnt;
		var html = '';
		var row;
		var i, cell;

		for (row = 0; row < rowCnt; row++) {
			html += this.dayRowHtml(row, isRigid);
		}
		this.el.html(html);

		this.rowEls = this.el.find('.fc-row');
		this.dayEls = this.el.find('.fc-day');

		// trigger dayRender with each cell's element
		for (i = 0; i < cellCnt; i++) {
			cell = this.getCell(i);
			view.trigger('dayRender', null, cell.start, this.dayEls.eq(i));
		}

		Grid.prototype.render.call(this); // call the super-method
	},


	destroy: function() {
		this.destroySegPopover();
		Grid.prototype.destroy.call(this); // call the super-method
	},


	// Generates the HTML for a single row. `row` is the row number.
	dayRowHtml: function(row, isRigid) {
		var view = this.view;
		var classes = [ 'fc-row', 'fc-week', view.widgetContentClass ];

		if (isRigid) {
			classes.push('fc-rigid');
		}

		return '' +
			'<div class="' + classes.join(' ') + '">' +
				'<div class="fc-bg">' +
					'<table>' +
						this.rowHtml('day', row) + // leverages RowRenderer. calls dayCellHtml()
					'</table>' +
				'</div>' +
				'<div class="fc-content-skeleton">' +
					'<table>' +
						(this.numbersVisible ?
							'<thead>' +
								this.rowHtml('number', row) + // leverages RowRenderer. View will define render method
							'</thead>' :
							''
							) +
					'</table>' +
				'</div>' +
			'</div>';
	},


	// Renders the HTML for a whole-day cell. Will eventually end up in the day-row's background.
	// We go through a 'day' row type instead of just doing a 'bg' row type so that the View can do custom rendering
	// specifically for whole-day rows, whereas a 'bg' might also be used for other purposes (TimeGrid bg for example).
	dayCellHtml: function(cell) {
		return this.bgCellHtml(cell);
	},


	/* Options
	------------------------------------------------------------------------------------------------------------------*/


	// Computes a default column header formatting string if `colFormat` is not explicitly defined
	computeColHeadFormat: function() {
		if (this.rowCnt > 1) { // more than one week row. day numbers will be in each cell
			return 'ddd'; // "Sat"
		}
		else if (this.colCnt > 1) { // multiple days, so full single date string WON'T be in title text
			return this.view.opt('dayOfMonthFormat'); // "Sat 12/10"
		}
		else { // single day, so full single date string will probably be in title text
			return 'dddd'; // "Saturday"
		}
	},


	// Computes a default event time formatting string if `timeFormat` is not explicitly defined
	computeEventTimeFormat: function() {
		return this.view.opt('extraSmallTimeFormat'); // like "6p" or "6:30p"
	},


	// Computes a default `displayEventEnd` value if one is not expliclty defined
	computeDisplayEventEnd: function() {
		return this.colCnt == 1; // we'll likely have space if there's only one day
	},


	/* Cell System
	------------------------------------------------------------------------------------------------------------------*/


	// Initializes row/col information
	updateCells: function() {
		var cellDates;
		var firstDay;
		var rowCnt;
		var colCnt;

		this.updateCellDates(); // populates cellDates and dayToCellOffsets
		cellDates = this.cellDates;

		if (this.breakOnWeeks) {
			// count columns until the day-of-week repeats
			firstDay = cellDates[0].day();
			for (colCnt = 1; colCnt < cellDates.length; colCnt++) {
				if (cellDates[colCnt].day() == firstDay) {
					break;
				}
			}
			rowCnt = Math.ceil(cellDates.length / colCnt);
		}
		else {
			rowCnt = 1;
			colCnt = cellDates.length;
		}

		this.rowCnt = rowCnt;
		this.colCnt = colCnt;
	},


	// Populates cellDates and dayToCellOffsets
	updateCellDates: function() {
		var view = this.view;
		var date = this.start.clone();
		var dates = [];
		var offset = -1;
		var offsets = [];

		while (date.isBefore(this.end)) { // loop each day from start to end
			if (view.isHiddenDay(date)) {
				offsets.push(offset + 0.5); // mark that it's between offsets
			}
			else {
				offset++;
				offsets.push(offset);
				dates.push(date.clone());
			}
			date.add(1, 'days');
		}

		this.cellDates = dates;
		this.dayToCellOffsets = offsets;
	},


	// Given a cell object, generates a range object
	computeCellRange: function(cell) {
		var colCnt = this.colCnt;
		var index = cell.row * colCnt + (this.isRTL ? colCnt - cell.col - 1 : cell.col);
		var start = this.cellDates[index].clone();
		var end = start.clone().add(1, 'day');

		return { start: start, end: end };
	},


	// Retrieves the element representing the given row
	getRowEl: function(row) {
		return this.rowEls.eq(row);
	},


	// Retrieves the element representing the given column
	getColEl: function(col) {
		return this.dayEls.eq(col);
	},


	// Gets the whole-day element associated with the cell
	getCellDayEl: function(cell) {
		return this.dayEls.eq(cell.row * this.colCnt + cell.col);
	},


	// Overrides Grid's method for when row coordinates are computed
	computeRowCoords: function() {
		var rowCoords = Grid.prototype.computeRowCoords.call(this); // call the super-method

		// hack for extending last row (used by AgendaView)
		rowCoords[rowCoords.length - 1].bottom += this.bottomCoordPadding;

		return rowCoords;
	},


	/* Dates
	------------------------------------------------------------------------------------------------------------------*/


	// Slices up a date range by row into an array of segments
	rangeToSegs: function(range) {
		var isRTL = this.isRTL;
		var rowCnt = this.rowCnt;
		var colCnt = this.colCnt;
		var segs = [];
		var first, last; // inclusive cell-offset range for given range
		var row;
		var rowFirst, rowLast; // inclusive cell-offset range for current row
		var isStart, isEnd;
		var segFirst, segLast; // inclusive cell-offset range for segment
		var seg;

		range = this.view.computeDayRange(range); // make whole-day range, considering nextDayThreshold
		first = this.dateToCellOffset(range.start);
		last = this.dateToCellOffset(range.end.subtract(1, 'days')); // offset of inclusive end date

		for (row = 0; row < rowCnt; row++) {
			rowFirst = row * colCnt;
			rowLast = rowFirst + colCnt - 1;

			// intersect segment's offset range with the row's
			segFirst = Math.max(rowFirst, first);
			segLast = Math.min(rowLast, last);

			// deal with in-between indices
			segFirst = Math.ceil(segFirst); // in-between starts round to next cell
			segLast = Math.floor(segLast); // in-between ends round to prev cell

			if (segFirst <= segLast) { // was there any intersection with the current row?

				// must be matching integers to be the segment's start/end
				isStart = segFirst === first;
				isEnd = segLast === last;

				// translate offsets to be relative to start-of-row
				segFirst -= rowFirst;
				segLast -= rowFirst;

				seg = { row: row, isStart: isStart, isEnd: isEnd };
				if (isRTL) {
					seg.leftCol = colCnt - segLast - 1;
					seg.rightCol = colCnt - segFirst - 1;
				}
				else {
					seg.leftCol = segFirst;
					seg.rightCol = segLast;
				}
				segs.push(seg);
			}
		}

		return segs;
	},


	// Given a date, returns its chronolocial cell-offset from the first cell of the grid.
	// If the date lies between cells (because of hiddenDays), returns a floating-point value between offsets.
	// If before the first offset, returns a negative number.
	// If after the last offset, returns an offset past the last cell offset.
	// Only works for *start* dates of cells. Will not work for exclusive end dates for cells.
	dateToCellOffset: function(date) {
		var offsets = this.dayToCellOffsets;
		var day = date.diff(this.start, 'days');

		if (day < 0) {
			return offsets[0] - 1;
		}
		else if (day >= offsets.length) {
			return offsets[offsets.length - 1] + 1;
		}
		else {
			return offsets[day];
		}
	},


	/* Event Drag Visualization
	------------------------------------------------------------------------------------------------------------------*/
	// TODO: move to DayGrid.event, similar to what we did with Grid's drag methods


	// Renders a visual indication of an event or external element being dragged.
	// The dropLocation's end can be null. seg can be null. See Grid::renderDrag for more info.
	renderDrag: function(dropLocation, seg) {
		var opacity;

		// always render a highlight underneath
		this.renderHighlight(
			this.view.calendar.ensureVisibleEventRange(dropLocation) // needs to be a proper range
		);

		// if a segment from the same calendar but another component is being dragged, render a helper event
		if (seg && !seg.el.closest(this.el).length) {

			this.renderRangeHelper(dropLocation, seg);

			opacity = this.view.opt('dragOpacity');
			if (opacity !== undefined) {
				this.helperEls.css('opacity', opacity);
			}

			return true; // a helper has been rendered
		}
	},


	// Unrenders any visual indication of a hovering event
	destroyDrag: function() {
		this.destroyHighlight();
		this.destroyHelper();
	},


	/* Event Resize Visualization
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a visual indication of an event being resized
	renderEventResize: function(range, seg) {
		this.renderHighlight(range);
		this.renderRangeHelper(range, seg);
	},


	// Unrenders a visual indication of an event being resized
	destroyEventResize: function() {
		this.destroyHighlight();
		this.destroyHelper();
	},


	/* Event Helper
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a mock "helper" event. `sourceSeg` is the associated internal segment object. It can be null.
	renderHelper: function(event, sourceSeg) {
		var helperNodes = [];
		var segs = this.eventsToSegs([ event ]);
		var rowStructs;

		segs = this.renderFgSegEls(segs); // assigns each seg's el and returns a subset of segs that were rendered
		rowStructs = this.renderSegRows(segs);

		// inject each new event skeleton into each associated row
		this.rowEls.each(function(row, rowNode) {
			var rowEl = $(rowNode); // the .fc-row
			var skeletonEl = $('<div class="fc-helper-skeleton"><table/></div>'); // will be absolutely positioned
			var skeletonTop;

			// If there is an original segment, match the top position. Otherwise, put it at the row's top level
			if (sourceSeg && sourceSeg.row === row) {
				skeletonTop = sourceSeg.el.position().top;
			}
			else {
				skeletonTop = rowEl.find('.fc-content-skeleton tbody').position().top;
			}

			skeletonEl.css('top', skeletonTop)
				.find('table')
					.append(rowStructs[row].tbodyEl);

			rowEl.append(skeletonEl);
			helperNodes.push(skeletonEl[0]);
		});

		this.helperEls = $(helperNodes); // array -> jQuery set
	},


	// Unrenders any visual indication of a mock helper event
	destroyHelper: function() {
		if (this.helperEls) {
			this.helperEls.remove();
			this.helperEls = null;
		}
	},


	/* Fill System (highlight, background events, business hours)
	------------------------------------------------------------------------------------------------------------------*/


	fillSegTag: 'td', // override the default tag name


	// Renders a set of rectangles over the given segments of days.
	// Only returns segments that successfully rendered.
	renderFill: function(type, segs) {
		var nodes = [];
		var i, seg;
		var skeletonEl;

		segs = this.renderFillSegEls(type, segs); // assignes `.el` to each seg. returns successfully rendered segs

		for (i = 0; i < segs.length; i++) {
			seg = segs[i];
			skeletonEl = this.renderFillRow(type, seg);
			this.rowEls.eq(seg.row).append(skeletonEl);
			nodes.push(skeletonEl[0]);
		}

		this.elsByFill[type] = $(nodes);

		return segs;
	},


	// Generates the HTML needed for one row of a fill. Requires the seg's el to be rendered.
	renderFillRow: function(type, seg) {
		var colCnt = this.colCnt;
		var startCol = seg.leftCol;
		var endCol = seg.rightCol + 1;
		var skeletonEl;
		var trEl;

		skeletonEl = $(
			'<div class="fc-' + type.toLowerCase() + '-skeleton">' +
				'<table><tr/></table>' +
			'</div>'
		);
		trEl = skeletonEl.find('tr');

		if (startCol > 0) {
			trEl.append('<td colspan="' + startCol + '"/>');
		}

		trEl.append(
			seg.el.attr('colspan', endCol - startCol)
		);

		if (endCol < colCnt) {
			trEl.append('<td colspan="' + (colCnt - endCol) + '"/>');
		}

		this.bookendCells(trEl, type);

		return skeletonEl;
	}

});

    /* Event-rendering methods for the DayGrid class
----------------------------------------------------------------------------------------------------------------------*/

DayGrid.mixin({

	rowStructs: null, // an array of objects, each holding information about a row's foreground event-rendering


	// Unrenders all events currently rendered on the grid
	destroyEvents: function() {
		this.destroySegPopover(); // removes the "more.." events popover
		Grid.prototype.destroyEvents.apply(this, arguments); // calls the super-method
	},


	// Retrieves all rendered segment objects currently rendered on the grid
	getEventSegs: function() {
		return Grid.prototype.getEventSegs.call(this) // get the segments from the super-method
			.concat(this.popoverSegs || []); // append the segments from the "more..." popover
	},


	// Renders the given background event segments onto the grid
	renderBgSegs: function(segs) {

		// don't render timed background events
		var allDaySegs = $.grep(segs, function(seg) {
			return seg.event.allDay;
		});

		return Grid.prototype.renderBgSegs.call(this, allDaySegs); // call the super-method
	},


	// Renders the given foreground event segments onto the grid
	renderFgSegs: function(segs) {
		var rowStructs;

		// render an `.el` on each seg
		// returns a subset of the segs. segs that were actually rendered
		segs = this.renderFgSegEls(segs);

		rowStructs = this.rowStructs = this.renderSegRows(segs);

		// append to each row's content skeleton
		this.rowEls.each(function(i, rowNode) {
			$(rowNode).find('.fc-content-skeleton > table').append(
				rowStructs[i].tbodyEl
			);
		});

		return segs; // return only the segs that were actually rendered
	},


	// Unrenders all currently rendered foreground event segments
	destroyFgSegs: function() {
		var rowStructs = this.rowStructs || [];
		var rowStruct;

		while ((rowStruct = rowStructs.pop())) {
			rowStruct.tbodyEl.remove();
		}

		this.rowStructs = null;
	},


	// Uses the given events array to generate <tbody> elements that should be appended to each row's content skeleton.
	// Returns an array of rowStruct objects (see the bottom of `renderSegRow`).
	// PRECONDITION: each segment shoud already have a rendered and assigned `.el`
	renderSegRows: function(segs) {
		var rowStructs = [];
		var segRows;
		var row;

		segRows = this.groupSegRows(segs); // group into nested arrays

		// iterate each row of segment groupings
		for (row = 0; row < segRows.length; row++) {
			rowStructs.push(
				this.renderSegRow(row, segRows[row])
			);
		}

		return rowStructs;
	},


	// Builds the HTML to be used for the default element for an individual segment
	fgSegHtml: function(seg, disableResizing) {
		var view = this.view;
		var event = seg.event;
		var isDraggable = view.isEventDraggable(event);
		var isResizable = !disableResizing && event.allDay && seg.isEnd && view.isEventResizable(event);
		var classes = this.getSegClasses(seg, isDraggable, isResizable);
		var skinCss = this.getEventSkinCss(event);
		var timeHtml = '';
		var titleHtml;

		classes.unshift('fc-day-grid-event');

		// Only display a timed events time if it is the starting segment
		if (!event.allDay && seg.isStart) {
			timeHtml = '<span class="fc-time">' + htmlEscape(this.getEventTimeText(event)) + '</span>';
		}

		titleHtml =
			'<span class="fc-title">' +
				(htmlEscape(event.title || '') || '&nbsp;') + // we always want one line of height
			'</span>';
		
		return '<a class="' + classes.join(' ') + '"' +
				(event.url ?
					' href="' + htmlEscape(event.url) + '"' :
					''
					) +
				(skinCss ?
					' style="' + skinCss + '"' :
					''
					) +
			'>' +
				'<div class="fc-content">' +
					(this.isRTL ?
						titleHtml + ' ' + timeHtml : // put a natural space in between
						timeHtml + ' ' + titleHtml   //
						) +
				'</div>' +
				(isResizable ?
					'<div class="fc-resizer"/>' :
					''
					) +
			'</a>';
	},


	// Given a row # and an array of segments all in the same row, render a <tbody> element, a skeleton that contains
	// the segments. Returns object with a bunch of internal data about how the render was calculated.
	renderSegRow: function(row, rowSegs) {
		var colCnt = this.colCnt;
		var segLevels = this.buildSegLevels(rowSegs); // group into sub-arrays of levels
		var levelCnt = Math.max(1, segLevels.length); // ensure at least one level
		var tbody = $('<tbody/>');
		var segMatrix = []; // lookup for which segments are rendered into which level+col cells
		var cellMatrix = []; // lookup for all <td> elements of the level+col matrix
		var loneCellMatrix = []; // lookup for <td> elements that only take up a single column
		var i, levelSegs;
		var col;
		var tr;
		var j, seg;
		var td;

		// populates empty cells from the current column (`col`) to `endCol`
		function emptyCellsUntil(endCol) {
			while (col < endCol) {
				// try to grab a cell from the level above and extend its rowspan. otherwise, create a fresh cell
				td = (loneCellMatrix[i - 1] || [])[col];
				if (td) {
					td.attr(
						'rowspan',
						parseInt(td.attr('rowspan') || 1, 10) + 1
					);
				}
				else {
					td = $('<td/>');
					tr.append(td);
				}
				cellMatrix[i][col] = td;
				loneCellMatrix[i][col] = td;
				col++;
			}
		}

		for (i = 0; i < levelCnt; i++) { // iterate through all levels
			levelSegs = segLevels[i];
			col = 0;
			tr = $('<tr/>');

			segMatrix.push([]);
			cellMatrix.push([]);
			loneCellMatrix.push([]);

			// levelCnt might be 1 even though there are no actual levels. protect against this.
			// this single empty row is useful for styling.
			if (levelSegs) {
				for (j = 0; j < levelSegs.length; j++) { // iterate through segments in level
					seg = levelSegs[j];

					emptyCellsUntil(seg.leftCol);

					// create a container that occupies or more columns. append the event element.
					td = $('<td class="fc-event-container"/>').append(seg.el);
					if (seg.leftCol != seg.rightCol) {
						td.attr('colspan', seg.rightCol - seg.leftCol + 1);
					}
					else { // a single-column segment
						loneCellMatrix[i][col] = td;
					}

					while (col <= seg.rightCol) {
						cellMatrix[i][col] = td;
						segMatrix[i][col] = seg;
						col++;
					}

					tr.append(td);
				}
			}

			emptyCellsUntil(colCnt); // finish off the row
			this.bookendCells(tr, 'eventSkeleton');
			tbody.append(tr);
		}

		return { // a "rowStruct"
			row: row, // the row number
			tbodyEl: tbody,
			cellMatrix: cellMatrix,
			segMatrix: segMatrix,
			segLevels: segLevels,
			segs: rowSegs
		};
	},


	// Stacks a flat array of segments, which are all assumed to be in the same row, into subarrays of vertical levels.
	buildSegLevels: function(segs) {
		var levels = [];
		var i, seg;
		var j;

		// Give preference to elements with certain criteria, so they have
		// a chance to be closer to the top.
		segs.sort(compareSegs);
		
		for (i = 0; i < segs.length; i++) {
			seg = segs[i];

			// loop through levels, starting with the topmost, until the segment doesn't collide with other segments
			for (j = 0; j < levels.length; j++) {
				if (!isDaySegCollision(seg, levels[j])) {
					break;
				}
			}
			// `j` now holds the desired subrow index
			seg.level = j;

			// create new level array if needed and append segment
			(levels[j] || (levels[j] = [])).push(seg);
		}

		// order segments left-to-right. very important if calendar is RTL
		for (j = 0; j < levels.length; j++) {
			levels[j].sort(compareDaySegCols);
		}

		return levels;
	},


	// Given a flat array of segments, return an array of sub-arrays, grouped by each segment's row
	groupSegRows: function(segs) {
		var segRows = [];
		var i;

		for (i = 0; i < this.rowCnt; i++) {
			segRows.push([]);
		}

		for (i = 0; i < segs.length; i++) {
			segRows[segs[i].row].push(segs[i]);
		}

		return segRows;
	}

});


// Computes whether two segments' columns collide. They are assumed to be in the same row.
function isDaySegCollision(seg, otherSegs) {
	var i, otherSeg;

	for (i = 0; i < otherSegs.length; i++) {
		otherSeg = otherSegs[i];

		if (
			otherSeg.leftCol <= seg.rightCol &&
			otherSeg.rightCol >= seg.leftCol
		) {
			return true;
		}
	}

	return false;
}


// A cmp function for determining the leftmost event
function compareDaySegCols(a, b) {
	return a.leftCol - b.leftCol;
}

    /* Methods relate to limiting the number events for a given day on a DayGrid
----------------------------------------------------------------------------------------------------------------------*/
// NOTE: all the segs being passed around in here are foreground segs

DayGrid.mixin({

	segPopover: null, // the Popover that holds events that can't fit in a cell. null when not visible
	popoverSegs: null, // an array of segment objects that the segPopover holds. null when not visible


	destroySegPopover: function() {
		if (this.segPopover) {
			this.segPopover.hide(); // will trigger destruction of `segPopover` and `popoverSegs`
		}
	},


	// Limits the number of "levels" (vertically stacking layers of events) for each row of the grid.
	// `levelLimit` can be false (don't limit), a number, or true (should be computed).
	limitRows: function(levelLimit) {
		var rowStructs = this.rowStructs || [];
		var row; // row #
		var rowLevelLimit;

		for (row = 0; row < rowStructs.length; row++) {
			this.unlimitRow(row);

			if (!levelLimit) {
				rowLevelLimit = false;
			}
			else if (typeof levelLimit === 'number') {
				rowLevelLimit = levelLimit;
			}
			else {
				rowLevelLimit = this.computeRowLevelLimit(row);
			}

			if (rowLevelLimit !== false) {
				this.limitRow(row, rowLevelLimit);
			}
		}
	},


	// Computes the number of levels a row will accomodate without going outside its bounds.
	// Assumes the row is "rigid" (maintains a constant height regardless of what is inside).
	// `row` is the row number.
	computeRowLevelLimit: function(row) {
		var rowEl = this.rowEls.eq(row); // the containing "fake" row div
		var rowHeight = rowEl.height(); // TODO: cache somehow?
		var trEls = this.rowStructs[row].tbodyEl.children();
		var i, trEl;

		// Reveal one level <tr> at a time and stop when we find one out of bounds
		for (i = 0; i < trEls.length; i++) {
			trEl = trEls.eq(i).removeClass('fc-limited'); // get and reveal
			if (trEl.position().top + trEl.outerHeight() > rowHeight) {
				return i;
			}
		}

		return false; // should not limit at all
	},


	// Limits the given grid row to the maximum number of levels and injects "more" links if necessary.
	// `row` is the row number.
	// `levelLimit` is a number for the maximum (inclusive) number of levels allowed.
	limitRow: function(row, levelLimit) {
		var _this = this;
		var rowStruct = this.rowStructs[row];
		var moreNodes = []; // array of "more" <a> links and <td> DOM nodes
		var col = 0; // col #, left-to-right (not chronologically)
		var cell;
		var levelSegs; // array of segment objects in the last allowable level, ordered left-to-right
		var cellMatrix; // a matrix (by level, then column) of all <td> jQuery elements in the row
		var limitedNodes; // array of temporarily hidden level <tr> and segment <td> DOM nodes
		var i, seg;
		var segsBelow; // array of segment objects below `seg` in the current `col`
		var totalSegsBelow; // total number of segments below `seg` in any of the columns `seg` occupies
		var colSegsBelow; // array of segment arrays, below seg, one for each column (offset from segs's first column)
		var td, rowspan;
		var segMoreNodes; // array of "more" <td> cells that will stand-in for the current seg's cell
		var j;
		var moreTd, moreWrap, moreLink;

		// Iterates through empty level cells and places "more" links inside if need be
		function emptyCellsUntil(endCol) { // goes from current `col` to `endCol`
			while (col < endCol) {
				cell = _this.getCell(row, col);
				segsBelow = _this.getCellSegs(cell, levelLimit);
				if (segsBelow.length) {
					td = cellMatrix[levelLimit - 1][col];
					moreLink = _this.renderMoreLink(cell, segsBelow);
					moreWrap = $('<div/>').append(moreLink);
					td.append(moreWrap);
					moreNodes.push(moreWrap[0]);
				}
				col++;
			}
		}

		if (levelLimit && levelLimit < rowStruct.segLevels.length) { // is it actually over the limit?
			levelSegs = rowStruct.segLevels[levelLimit - 1];
			cellMatrix = rowStruct.cellMatrix;

			limitedNodes = rowStruct.tbodyEl.children().slice(levelLimit) // get level <tr> elements past the limit
				.addClass('fc-limited').get(); // hide elements and get a simple DOM-nodes array

			// iterate though segments in the last allowable level
			for (i = 0; i < levelSegs.length; i++) {
				seg = levelSegs[i];
				emptyCellsUntil(seg.leftCol); // process empty cells before the segment

				// determine *all* segments below `seg` that occupy the same columns
				colSegsBelow = [];
				totalSegsBelow = 0;
				while (col <= seg.rightCol) {
					cell = this.getCell(row, col);
					segsBelow = this.getCellSegs(cell, levelLimit);
					colSegsBelow.push(segsBelow);
					totalSegsBelow += segsBelow.length;
					col++;
				}

				if (totalSegsBelow) { // do we need to replace this segment with one or many "more" links?
					td = cellMatrix[levelLimit - 1][seg.leftCol]; // the segment's parent cell
					rowspan = td.attr('rowspan') || 1;
					segMoreNodes = [];

					// make a replacement <td> for each column the segment occupies. will be one for each colspan
					for (j = 0; j < colSegsBelow.length; j++) {
						moreTd = $('<td class="fc-more-cell"/>').attr('rowspan', rowspan);
						segsBelow = colSegsBelow[j];
						cell = this.getCell(row, seg.leftCol + j);
						moreLink = this.renderMoreLink(cell, [ seg ].concat(segsBelow)); // count seg as hidden too
						moreWrap = $('<div/>').append(moreLink);
						moreTd.append(moreWrap);
						segMoreNodes.push(moreTd[0]);
						moreNodes.push(moreTd[0]);
					}

					td.addClass('fc-limited').after($(segMoreNodes)); // hide original <td> and inject replacements
					limitedNodes.push(td[0]);
				}
			}

			emptyCellsUntil(this.colCnt); // finish off the level
			rowStruct.moreEls = $(moreNodes); // for easy undoing later
			rowStruct.limitedEls = $(limitedNodes); // for easy undoing later
		}
	},


	// Reveals all levels and removes all "more"-related elements for a grid's row.
	// `row` is a row number.
	unlimitRow: function(row) {
		var rowStruct = this.rowStructs[row];

		if (rowStruct.moreEls) {
			rowStruct.moreEls.remove();
			rowStruct.moreEls = null;
		}

		if (rowStruct.limitedEls) {
			rowStruct.limitedEls.removeClass('fc-limited');
			rowStruct.limitedEls = null;
		}
	},


	// Renders an <a> element that represents hidden event element for a cell.
	// Responsible for attaching click handler as well.
	renderMoreLink: function(cell, hiddenSegs) {
		var _this = this;
		var view = this.view;

		return $('<a class="fc-more"/>')
			.text(
				this.getMoreLinkText(hiddenSegs.length)
			)
			.on('click', function(ev) {
				var clickOption = view.opt('eventLimitClick');
				var date = cell.start;
				var moreEl = $(this);
				var dayEl = _this.getCellDayEl(cell);
				var allSegs = _this.getCellSegs(cell);

				// rescope the segments to be within the cell's date
				var reslicedAllSegs = _this.resliceDaySegs(allSegs, date);
				var reslicedHiddenSegs = _this.resliceDaySegs(hiddenSegs, date);

				if (typeof clickOption === 'function') {
					// the returned value can be an atomic option
					clickOption = view.trigger('eventLimitClick', null, {
						date: date,
						dayEl: dayEl,
						moreEl: moreEl,
						segs: reslicedAllSegs,
						hiddenSegs: reslicedHiddenSegs
					}, ev);
				}

				if (clickOption === 'popover') {
					_this.showSegPopover(cell, moreEl, reslicedAllSegs);
				}
				else if (typeof clickOption === 'string') { // a view name
					view.calendar.zoomTo(date, clickOption);
				}
			});
	},


	// Reveals the popover that displays all events within a cell
	showSegPopover: function(cell, moreLink, segs) {
		var _this = this;
		var view = this.view;
		var moreWrap = moreLink.parent(); // the <div> wrapper around the <a>
		var topEl; // the element we want to match the top coordinate of
		var options;

		if (this.rowCnt == 1) {
			topEl = view.el; // will cause the popover to cover any sort of header
		}
		else {
			topEl = this.rowEls.eq(cell.row); // will align with top of row
		}

		options = {
			className: 'fc-more-popover',
			content: this.renderSegPopoverContent(cell, segs),
			parentEl: this.el,
			top: topEl.offset().top,
			autoHide: true, // when the user clicks elsewhere, hide the popover
			viewportConstrain: view.opt('popoverViewportConstrain'),
			hide: function() {
				// destroy everything when the popover is hidden
				_this.segPopover.destroy();
				_this.segPopover = null;
				_this.popoverSegs = null;
			}
		};

		// Determine horizontal coordinate.
		// We use the moreWrap instead of the <td> to avoid border confusion.
		if (this.isRTL) {
			options.right = moreWrap.offset().left + moreWrap.outerWidth() + 1; // +1 to be over cell border
		}
		else {
			options.left = moreWrap.offset().left - 1; // -1 to be over cell border
		}

		this.segPopover = new Popover(options);
		this.segPopover.show();
	},


	// Builds the inner DOM contents of the segment popover
	renderSegPopoverContent: function(cell, segs) {
		var view = this.view;
		var isTheme = view.opt('theme');
		var title = cell.start.format(view.opt('dayPopoverFormat'));
		var content = $(
			'<div class="fc-header ' + view.widgetHeaderClass + '">' +
				'<span class="fc-close ' +
					(isTheme ? 'ui-icon ui-icon-closethick' : 'fc-icon fc-icon-x') +
				'"></span>' +
				'<span class="fc-title">' +
					htmlEscape(title) +
				'</span>' +
				'<div class="fc-clear"/>' +
			'</div>' +
			'<div class="fc-body ' + view.widgetContentClass + '">' +
				'<div class="fc-event-container"></div>' +
			'</div>'
		);
		var segContainer = content.find('.fc-event-container');
		var i;

		// render each seg's `el` and only return the visible segs
		segs = this.renderFgSegEls(segs, true); // disableResizing=true
		this.popoverSegs = segs;

		for (i = 0; i < segs.length; i++) {

			// because segments in the popover are not part of a grid coordinate system, provide a hint to any
			// grids that want to do drag-n-drop about which cell it came from
			segs[i].cell = cell;

			segContainer.append(segs[i].el);
		}

		return content;
	},


	// Given the events within an array of segment objects, reslice them to be in a single day
	resliceDaySegs: function(segs, dayDate) {

		// build an array of the original events
		var events = $.map(segs, function(seg) {
			return seg.event;
		});

		var dayStart = dayDate.clone().stripTime();
		var dayEnd = dayStart.clone().add(1, 'days');
		var dayRange = { start: dayStart, end: dayEnd };

		// slice the events with a custom slicing function
		return this.eventsToSegs(
			events,
			function(range) {
				var seg = intersectionToSeg(range, dayRange); // undefind if no intersection
				return seg ? [ seg ] : []; // must return an array of segments
			}
		);
	},


	// Generates the text that should be inside a "more" link, given the number of events it represents
	getMoreLinkText: function(num) {
		var opt = this.view.opt('eventLimitText');

		if (typeof opt === 'function') {
			return opt(num);
		}
		else {
			return '+' + num + ' ' + opt;
		}
	},


	// Returns segments within a given cell.
	// If `startLevel` is specified, returns only events including and below that level. Otherwise returns all segs.
	getCellSegs: function(cell, startLevel) {
		var segMatrix = this.rowStructs[cell.row].segMatrix;
		var level = startLevel || 0;
		var segs = [];
		var seg;

		while (level < segMatrix.length) {
			seg = segMatrix[level][cell.col];
			if (seg) {
				segs.push(seg);
			}
			level++;
		}

		return segs;
	}

});

    /* A component that renders one or more columns of vertical time slots
----------------------------------------------------------------------------------------------------------------------*/

var TimeGrid = Grid.extend({

	slotDuration: null, // duration of a "slot", a distinct time segment on given day, visualized by lines
	snapDuration: null, // granularity of time for dragging and selecting

	minTime: null, // Duration object that denotes the first visible time of any given day
	maxTime: null, // Duration object that denotes the exclusive visible end time of any given day

	axisFormat: null, // formatting string for times running along vertical axis

	dayEls: null, // cells elements in the day-row background
	slatEls: null, // elements running horizontally across all columns

	slatTops: null, // an array of top positions, relative to the container. last item holds bottom of last slot

	helperEl: null, // cell skeleton element for rendering the mock event "helper"

	businessHourSegs: null,


	constructor: function() {
		Grid.apply(this, arguments); // call the super-constructor
		this.processOptions();
	},


	// Renders the time grid into `this.el`, which should already be assigned.
	// Relies on the view's colCnt. In the future, this component should probably be self-sufficient.
	render: function() {
		this.el.html(this.renderHtml());
		this.dayEls = this.el.find('.fc-day');
		this.slatEls = this.el.find('.fc-slats tr');

		this.computeSlatTops();
		this.renderBusinessHours();
		Grid.prototype.render.call(this); // call the super-method
	},


	renderBusinessHours: function() {
		var events = this.view.calendar.getBusinessHoursEvents();
		this.businessHourSegs = this.renderFill('businessHours', this.eventsToSegs(events), 'bgevent');
	},


	// Renders the basic HTML skeleton for the grid
	renderHtml: function() {
		return '' +
			'<div class="fc-bg">' +
				'<table>' +
					this.rowHtml('slotBg') + // leverages RowRenderer, which will call slotBgCellHtml
				'</table>' +
			'</div>' +
			'<div class="fc-slats">' +
				'<table>' +
					this.slatRowHtml() +
				'</table>' +
			'</div>';
	},


	// Renders the HTML for a vertical background cell behind the slots.
	// This method is distinct from 'bg' because we wanted a new `rowType` so the View could customize the rendering.
	slotBgCellHtml: function(cell) {
		return this.bgCellHtml(cell);
	},


	// Generates the HTML for the horizontal "slats" that run width-wise. Has a time axis on a side. Depends on RTL.
	slatRowHtml: function() {
		var view = this.view;
		var isRTL = this.isRTL;
		var html = '';
		var slotNormal = this.slotDuration.asMinutes() % 15 === 0;
		var slotTime = moment.duration(+this.minTime); // wish there was .clone() for durations
		var slotDate; // will be on the view's first day, but we only care about its time
		var minutes;
		var axisHtml;

		// Calculate the time for each slot
		while (slotTime < this.maxTime) {
			slotDate = this.start.clone().time(slotTime); // will be in UTC but that's good. to avoid DST issues
			minutes = slotDate.minutes();

			axisHtml =
				'<td class="fc-axis fc-time ' + view.widgetContentClass + '" ' + view.axisStyleAttr() + '>' +
					((!slotNormal || !minutes) ? // if irregular slot duration, or on the hour, then display the time
						'<span>' + // for matchCellWidths
							htmlEscape(slotDate.format(this.axisFormat)) +
						'</span>' :
						''
						) +
				'</td>';

			html +=
				'<tr ' + (!minutes ? '' : 'class="fc-minor"') + '>' +
					(!isRTL ? axisHtml : '') +
					'<td class="' + view.widgetContentClass + '"/>' +
					(isRTL ? axisHtml : '') +
				"</tr>";

			slotTime.add(this.slotDuration);
		}

		return html;
	},


	/* Options
	------------------------------------------------------------------------------------------------------------------*/


	// Parses various options into properties of this object
	processOptions: function() {
		var view = this.view;
		var slotDuration = view.opt('slotDuration');
		var snapDuration = view.opt('snapDuration');

		slotDuration = moment.duration(slotDuration);
		snapDuration = snapDuration ? moment.duration(snapDuration) : slotDuration;

		this.slotDuration = slotDuration;
		this.snapDuration = snapDuration;

		this.minTime = moment.duration(view.opt('minTime'));
		this.maxTime = moment.duration(view.opt('maxTime'));

		this.axisFormat = view.opt('axisFormat') || view.opt('smallTimeFormat');
	},


	// Computes a default column header formatting string if `colFormat` is not explicitly defined
	computeColHeadFormat: function() {
		if (this.colCnt > 1) { // multiple days, so full single date string WON'T be in title text
			return this.view.opt('dayOfMonthFormat'); // "Sat 12/10"
		}
		else { // single day, so full single date string will probably be in title text
			return 'dddd'; // "Saturday"
		}
	},


	// Computes a default event time formatting string if `timeFormat` is not explicitly defined
	computeEventTimeFormat: function() {
		return this.view.opt('noMeridiemTimeFormat'); // like "6:30" (no AM/PM)
	},


	// Computes a default `displayEventEnd` value if one is not expliclty defined
	computeDisplayEventEnd: function() {
		return true;
	},


	/* Cell System
	------------------------------------------------------------------------------------------------------------------*/


	// Initializes row/col information
	updateCells: function() {
		var view = this.view;
		var colData = [];
		var date;

		date = this.start.clone();
		while (date.isBefore(this.end)) {
			colData.push({
				day: date.clone()
			});
			date.add(1, 'day');
			date = view.skipHiddenDays(date);
		}

		if (this.isRTL) {
			colData.reverse();
		}

		this.colData = colData;
		this.colCnt = colData.length;
		this.rowCnt = Math.ceil((this.maxTime - this.minTime) / this.snapDuration); // # of vertical snaps
	},


	// Given a cell object, generates a range object
	computeCellRange: function(cell) {
		var time = this.computeSnapTime(cell.row);
		var start = this.view.calendar.rezoneDate(cell.day).time(time);
		var end = start.clone().add(this.snapDuration);

		return { start: start, end: end };
	},


	// Retrieves the element representing the given column
	getColEl: function(col) {
		return this.dayEls.eq(col);
	},


	/* Dates
	------------------------------------------------------------------------------------------------------------------*/


	// Given a row number of the grid, representing a "snap", returns a time (Duration) from its start-of-day
	computeSnapTime: function(row) {
		return moment.duration(this.minTime + this.snapDuration * row);
	},


	// Slices up a date range by column into an array of segments
	rangeToSegs: function(range) {
		var colCnt = this.colCnt;
		var segs = [];
		var seg;
		var col;
		var colDate;
		var colRange;

		// normalize :(
		range = {
			start: range.start.clone().stripZone(),
			end: range.end.clone().stripZone()
		};

		for (col = 0; col < colCnt; col++) {
			colDate = this.colData[col].day; // will be ambig time/timezone
			colRange = {
				start: colDate.clone().time(this.minTime),
				end: colDate.clone().time(this.maxTime)
			};
			seg = intersectionToSeg(range, colRange); // both will be ambig timezone
			if (seg) {
				seg.col = col;
				segs.push(seg);
			}
		}

		return segs;
	},


	/* Coordinates
	------------------------------------------------------------------------------------------------------------------*/


	// Called when there is a window resize/zoom and we need to recalculate coordinates for the grid
	resize: function() {
		this.computeSlatTops();
		this.updateSegVerticals();
	},


	// Computes the top/bottom coordinates of each "snap" rows
	computeRowCoords: function() {
		var originTop = this.el.offset().top;
		var items = [];
		var i;
		var item;

		for (i = 0; i < this.rowCnt; i++) {
			item = {
				top: originTop + this.computeTimeTop(this.computeSnapTime(i))
			};
			if (i > 0) {
				items[i - 1].bottom = item.top;
			}
			items.push(item);
		}
		item.bottom = item.top + this.computeTimeTop(this.computeSnapTime(i));

		return items;
	},


	// Computes the top coordinate, relative to the bounds of the grid, of the given date.
	// A `startOfDayDate` must be given for avoiding ambiguity over how to treat midnight.
	computeDateTop: function(date, startOfDayDate) {
		return this.computeTimeTop(
			moment.duration(
				date.clone().stripZone() - startOfDayDate.clone().stripTime()
			)
		);
	},


	// Computes the top coordinate, relative to the bounds of the grid, of the given time (a Duration).
	computeTimeTop: function(time) {
		var slatCoverage = (time - this.minTime) / this.slotDuration; // floating-point value of # of slots covered
		var slatIndex;
		var slatRemainder;
		var slatTop;
		var slatBottom;

		// constrain. because minTime/maxTime might be customized
		slatCoverage = Math.max(0, slatCoverage);
		slatCoverage = Math.min(this.slatEls.length, slatCoverage);

		slatIndex = Math.floor(slatCoverage); // an integer index of the furthest whole slot
		slatRemainder = slatCoverage - slatIndex;
		slatTop = this.slatTops[slatIndex]; // the top position of the furthest whole slot

		if (slatRemainder) { // time spans part-way into the slot
			slatBottom = this.slatTops[slatIndex + 1];
			return slatTop + (slatBottom - slatTop) * slatRemainder; // part-way between slots
		}
		else {
			return slatTop;
		}
	},


	// Queries each `slatEl` for its position relative to the grid's container and stores it in `slatTops`.
	// Includes the the bottom of the last slat as the last item in the array.
	computeSlatTops: function() {
		var tops = [];
		var top;

		this.slatEls.each(function(i, node) {
			top = $(node).position().top;
			tops.push(top);
		});

		tops.push(top + this.slatEls.last().outerHeight()); // bottom of the last slat

		this.slatTops = tops;
	},


	/* Event Drag Visualization
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a visual indication of an event being dragged over the specified date(s).
	// dropLocation's end might be null, as well as `seg`. See Grid::renderDrag for more info.
	// A returned value of `true` signals that a mock "helper" event has been rendered.
	renderDrag: function(dropLocation, seg) {
		var opacity;

		if (seg) { // if there is event information for this drag, render a helper event
			this.renderRangeHelper(dropLocation, seg);

			opacity = this.view.opt('dragOpacity');
			if (opacity !== undefined) {
				this.helperEl.css('opacity', opacity);
			}

			return true; // signal that a helper has been rendered
		}
		else {
			// otherwise, just render a highlight
			this.renderHighlight(
				this.view.calendar.ensureVisibleEventRange(dropLocation) // needs to be a proper range
			);
		}
	},


	// Unrenders any visual indication of an event being dragged
	destroyDrag: function() {
		this.destroyHelper();
		this.destroyHighlight();
	},


	/* Event Resize Visualization
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a visual indication of an event being resized
	renderEventResize: function(range, seg) {
		this.renderRangeHelper(range, seg);
	},


	// Unrenders any visual indication of an event being resized
	destroyEventResize: function() {
		this.destroyHelper();
	},


	/* Event Helper
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a mock "helper" event. `sourceSeg` is the original segment object and might be null (an external drag)
	renderHelper: function(event, sourceSeg) {
		var segs = this.eventsToSegs([ event ]);
		var tableEl;
		var i, seg;
		var sourceEl;

		segs = this.renderFgSegEls(segs); // assigns each seg's el and returns a subset of segs that were rendered
		tableEl = this.renderSegTable(segs);

		// Try to make the segment that is in the same row as sourceSeg look the same
		for (i = 0; i < segs.length; i++) {
			seg = segs[i];
			if (sourceSeg && sourceSeg.col === seg.col) {
				sourceEl = sourceSeg.el;
				seg.el.css({
					left: sourceEl.css('left'),
					right: sourceEl.css('right'),
					'margin-left': sourceEl.css('margin-left'),
					'margin-right': sourceEl.css('margin-right')
				});
			}
		}

		this.helperEl = $('<div class="fc-helper-skeleton"/>')
			.append(tableEl)
				.appendTo(this.el);
	},


	// Unrenders any mock helper event
	destroyHelper: function() {
		if (this.helperEl) {
			this.helperEl.remove();
			this.helperEl = null;
		}
	},


	/* Selection
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a visual indication of a selection. Overrides the default, which was to simply render a highlight.
	renderSelection: function(range) {
		if (this.view.opt('selectHelper')) { // this setting signals that a mock helper event should be rendered
			this.renderRangeHelper(range);
		}
		else {
			this.renderHighlight(range);
		}
	},


	// Unrenders any visual indication of a selection
	destroySelection: function() {
		this.destroyHelper();
		this.destroyHighlight();
	},


	/* Fill System (highlight, background events, business hours)
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a set of rectangles over the given time segments.
	// Only returns segments that successfully rendered.
	renderFill: function(type, segs, className) {
		var segCols;
		var skeletonEl;
		var trEl;
		var col, colSegs;
		var tdEl;
		var containerEl;
		var dayDate;
		var i, seg;

		if (segs.length) {

			segs = this.renderFillSegEls(type, segs); // assignes `.el` to each seg. returns successfully rendered segs
			segCols = this.groupSegCols(segs); // group into sub-arrays, and assigns 'col' to each seg

			className = className || type.toLowerCase();
			skeletonEl = $(
				'<div class="fc-' + className + '-skeleton">' +
					'<table><tr/></table>' +
				'</div>'
			);
			trEl = skeletonEl.find('tr');

			for (col = 0; col < segCols.length; col++) {
				colSegs = segCols[col];
				tdEl = $('<td/>').appendTo(trEl);

				if (colSegs.length) {
					containerEl = $('<div class="fc-' + className + '-container"/>').appendTo(tdEl);
					dayDate = this.colData[col].day;

					for (i = 0; i < colSegs.length; i++) {
						seg = colSegs[i];
						containerEl.append(
							seg.el.css({
								top: this.computeDateTop(seg.start, dayDate),
								bottom: -this.computeDateTop(seg.end, dayDate) // the y position of the bottom edge
							})
						);
					}
				}
			}

			this.bookendCells(trEl, type);

			this.el.append(skeletonEl);
			this.elsByFill[type] = skeletonEl;
		}

		return segs;
	}

});

    /* Event-rendering methods for the TimeGrid class
----------------------------------------------------------------------------------------------------------------------*/

TimeGrid.mixin({

	eventSkeletonEl: null, // has cells with event-containers, which contain absolutely positioned event elements


	// Renders the given foreground event segments onto the grid
	renderFgSegs: function(segs) {
		segs = this.renderFgSegEls(segs); // returns a subset of the segs. segs that were actually rendered

		this.el.append(
			this.eventSkeletonEl = $('<div class="fc-content-skeleton"/>')
				.append(this.renderSegTable(segs))
		);

		return segs; // return only the segs that were actually rendered
	},


	// Unrenders all currently rendered foreground event segments
	destroyFgSegs: function(segs) {
		if (this.eventSkeletonEl) {
			this.eventSkeletonEl.remove();
			this.eventSkeletonEl = null;
		}
	},


	// Renders and returns the <table> portion of the event-skeleton.
	// Returns an object with properties 'tbodyEl' and 'segs'.
	renderSegTable: function(segs) {
		var tableEl = $('<table><tr/></table>');
		var trEl = tableEl.find('tr');
		var segCols;
		var i, seg;
		var col, colSegs;
		var containerEl;

		segCols = this.groupSegCols(segs); // group into sub-arrays, and assigns 'col' to each seg

		this.computeSegVerticals(segs); // compute and assign top/bottom

		for (col = 0; col < segCols.length; col++) { // iterate each column grouping
			colSegs = segCols[col];
			placeSlotSegs(colSegs); // compute horizontal coordinates, z-index's, and reorder the array

			containerEl = $('<div class="fc-event-container"/>');

			// assign positioning CSS and insert into container
			for (i = 0; i < colSegs.length; i++) {
				seg = colSegs[i];
				seg.el.css(this.generateSegPositionCss(seg));

				// if the height is short, add a className for alternate styling
				if (seg.bottom - seg.top < 30) {
					seg.el.addClass('fc-short');
				}

				containerEl.append(seg.el);
			}

			trEl.append($('<td/>').append(containerEl));
		}

		this.bookendCells(trEl, 'eventSkeleton');

		return tableEl;
	},


	// Refreshes the CSS top/bottom coordinates for each segment element. Probably after a window resize/zoom.
	// Repositions business hours segs too, so not just for events. Maybe shouldn't be here.
	updateSegVerticals: function() {
		var allSegs = (this.segs || []).concat(this.businessHourSegs || []);
		var i;

		this.computeSegVerticals(allSegs);

		for (i = 0; i < allSegs.length; i++) {
			allSegs[i].el.css(
				this.generateSegVerticalCss(allSegs[i])
			);
		}
	},


	// For each segment in an array, computes and assigns its top and bottom properties
	computeSegVerticals: function(segs) {
		var i, seg;

		for (i = 0; i < segs.length; i++) {
			seg = segs[i];
			seg.top = this.computeDateTop(seg.start, seg.start);
			seg.bottom = this.computeDateTop(seg.end, seg.start);
		}
	},


	// Renders the HTML for a single event segment's default rendering
	fgSegHtml: function(seg, disableResizing) {
		var view = this.view;
		var event = seg.event;
		var isDraggable = view.isEventDraggable(event);
		var isResizable = !disableResizing && seg.isEnd && view.isEventResizable(event);
		var classes = this.getSegClasses(seg, isDraggable, isResizable);
		var skinCss = this.getEventSkinCss(event);
		var timeText;
		var fullTimeText; // more verbose time text. for the print stylesheet
		var startTimeText; // just the start time text

		classes.unshift('fc-time-grid-event');

		if (view.isMultiDayEvent(event)) { // if the event appears to span more than one day...
			// Don't display time text on segments that run entirely through a day.
			// That would appear as midnight-midnight and would look dumb.
			// Otherwise, display the time text for the *segment's* times (like 6pm-midnight or midnight-10am)
			if (seg.isStart || seg.isEnd) {
				timeText = this.getEventTimeText(seg);
				fullTimeText = this.getEventTimeText(seg, 'LT');
				startTimeText = this.getEventTimeText({ start: seg.start });
			}
		} else {
			// Display the normal time text for the *event's* times
			timeText = this.getEventTimeText(event);
			fullTimeText = this.getEventTimeText(event, 'LT');
			startTimeText = this.getEventTimeText({ start: event.start });
		}

		return '<a class="' + classes.join(' ') + '"' +
			(event.url ?
				' href="' + htmlEscape(event.url) + '"' :
				''
				) +
			(skinCss ?
				' style="' + skinCss + '"' :
				''
				) +
			'>' +
				'<div class="fc-content">' +
					(timeText ?
						'<div class="fc-time"' +
						' data-start="' + htmlEscape(startTimeText) + '"' +
						' data-full="' + htmlEscape(fullTimeText) + '"' +
						'>' +
							'<span>' + htmlEscape(timeText) + '</span>' +
						'</div>' :
						''
						) +
					(event.title ?
						'<div class="fc-title">' +
							htmlEscape(event.title) +
						'</div>' :
						''
						) +
				'</div>' +
				'<div class="fc-bg"/>' +
				(isResizable ?
					'<div class="fc-resizer"/>' :
					''
					) +
			'</a>';
	},


	// Generates an object with CSS properties/values that should be applied to an event segment element.
	// Contains important positioning-related properties that should be applied to any event element, customized or not.
	generateSegPositionCss: function(seg) {
		var shouldOverlap = this.view.opt('slotEventOverlap');
		var backwardCoord = seg.backwardCoord; // the left side if LTR. the right side if RTL. floating-point
		var forwardCoord = seg.forwardCoord; // the right side if LTR. the left side if RTL. floating-point
		var props = this.generateSegVerticalCss(seg); // get top/bottom first
		var left; // amount of space from left edge, a fraction of the total width
		var right; // amount of space from right edge, a fraction of the total width

		if (shouldOverlap) {
			// double the width, but don't go beyond the maximum forward coordinate (1.0)
			forwardCoord = Math.min(1, backwardCoord + (forwardCoord - backwardCoord) * 2);
		}

		if (this.isRTL) {
			left = 1 - forwardCoord;
			right = backwardCoord;
		}
		else {
			left = backwardCoord;
			right = 1 - forwardCoord;
		}

		props.zIndex = seg.level + 1; // convert from 0-base to 1-based
		props.left = left * 100 + '%';
		props.right = right * 100 + '%';

		if (shouldOverlap && seg.forwardPressure) {
			// add padding to the edge so that forward stacked events don't cover the resizer's icon
			props[this.isRTL ? 'marginLeft' : 'marginRight'] = 10 * 2; // 10 is a guesstimate of the icon's width
		}

		return props;
	},


	// Generates an object with CSS properties for the top/bottom coordinates of a segment element
	generateSegVerticalCss: function(seg) {
		return {
			top: seg.top,
			bottom: -seg.bottom // flipped because needs to be space beyond bottom edge of event container
		};
	},


	// Given a flat array of segments, return an array of sub-arrays, grouped by each segment's col
	groupSegCols: function(segs) {
		var segCols = [];
		var i;

		for (i = 0; i < this.colCnt; i++) {
			segCols.push([]);
		}

		for (i = 0; i < segs.length; i++) {
			segCols[segs[i].col].push(segs[i]);
		}

		return segCols;
	}

});


// Given an array of segments that are all in the same column, sets the backwardCoord and forwardCoord on each.
// Also reorders the given array by date!
function placeSlotSegs(segs) {
	var levels;
	var level0;
	var i;

	segs.sort(compareSegs); // order by date
	levels = buildSlotSegLevels(segs);
	computeForwardSlotSegs(levels);

	if ((level0 = levels[0])) {

		for (i = 0; i < level0.length; i++) {
			computeSlotSegPressures(level0[i]);
		}

		for (i = 0; i < level0.length; i++) {
			computeSlotSegCoords(level0[i], 0, 0);
		}
	}
}


// Builds an array of segments "levels". The first level will be the leftmost tier of segments if the calendar is
// left-to-right, or the rightmost if the calendar is right-to-left. Assumes the segments are already ordered by date.
function buildSlotSegLevels(segs) {
	var levels = [];
	var i, seg;
	var j;

	for (i=0; i<segs.length; i++) {
		seg = segs[i];

		// go through all the levels and stop on the first level where there are no collisions
		for (j=0; j<levels.length; j++) {
			if (!computeSlotSegCollisions(seg, levels[j]).length) {
				break;
			}
		}

		seg.level = j;

		(levels[j] || (levels[j] = [])).push(seg);
	}

	return levels;
}


// For every segment, figure out the other segments that are in subsequent
// levels that also occupy the same vertical space. Accumulate in seg.forwardSegs
function computeForwardSlotSegs(levels) {
	var i, level;
	var j, seg;
	var k;

	for (i=0; i<levels.length; i++) {
		level = levels[i];

		for (j=0; j<level.length; j++) {
			seg = level[j];

			seg.forwardSegs = [];
			for (k=i+1; k<levels.length; k++) {
				computeSlotSegCollisions(seg, levels[k], seg.forwardSegs);
			}
		}
	}
}


// Figure out which path forward (via seg.forwardSegs) results in the longest path until
// the furthest edge is reached. The number of segments in this path will be seg.forwardPressure
function computeSlotSegPressures(seg) {
	var forwardSegs = seg.forwardSegs;
	var forwardPressure = 0;
	var i, forwardSeg;

	if (seg.forwardPressure === undefined) { // not already computed

		for (i=0; i<forwardSegs.length; i++) {
			forwardSeg = forwardSegs[i];

			// figure out the child's maximum forward path
			computeSlotSegPressures(forwardSeg);

			// either use the existing maximum, or use the child's forward pressure
			// plus one (for the forwardSeg itself)
			forwardPressure = Math.max(
				forwardPressure,
				1 + forwardSeg.forwardPressure
			);
		}

		seg.forwardPressure = forwardPressure;
	}
}


// Calculate seg.forwardCoord and seg.backwardCoord for the segment, where both values range
// from 0 to 1. If the calendar is left-to-right, the seg.backwardCoord maps to "left" and
// seg.forwardCoord maps to "right" (via percentage). Vice-versa if the calendar is right-to-left.
//
// The segment might be part of a "series", which means consecutive segments with the same pressure
// who's width is unknown until an edge has been hit. `seriesBackwardPressure` is the number of
// segments behind this one in the current series, and `seriesBackwardCoord` is the starting
// coordinate of the first segment in the series.
function computeSlotSegCoords(seg, seriesBackwardPressure, seriesBackwardCoord) {
	var forwardSegs = seg.forwardSegs;
	var i;

	if (seg.forwardCoord === undefined) { // not already computed

		if (!forwardSegs.length) {

			// if there are no forward segments, this segment should butt up against the edge
			seg.forwardCoord = 1;
		}
		else {

			// sort highest pressure first
			forwardSegs.sort(compareForwardSlotSegs);

			// this segment's forwardCoord will be calculated from the backwardCoord of the
			// highest-pressure forward segment.
			computeSlotSegCoords(forwardSegs[0], seriesBackwardPressure + 1, seriesBackwardCoord);
			seg.forwardCoord = forwardSegs[0].backwardCoord;
		}

		// calculate the backwardCoord from the forwardCoord. consider the series
		seg.backwardCoord = seg.forwardCoord -
			(seg.forwardCoord - seriesBackwardCoord) / // available width for series
			(seriesBackwardPressure + 1); // # of segments in the series

		// use this segment's coordinates to computed the coordinates of the less-pressurized
		// forward segments
		for (i=0; i<forwardSegs.length; i++) {
			computeSlotSegCoords(forwardSegs[i], 0, seg.forwardCoord);
		}
	}
}


// Find all the segments in `otherSegs` that vertically collide with `seg`.
// Append into an optionally-supplied `results` array and return.
function computeSlotSegCollisions(seg, otherSegs, results) {
	results = results || [];

	for (var i=0; i<otherSegs.length; i++) {
		if (isSlotSegCollision(seg, otherSegs[i])) {
			results.push(otherSegs[i]);
		}
	}

	return results;
}


// Do these segments occupy the same vertical space?
function isSlotSegCollision(seg1, seg2) {
	return seg1.bottom > seg2.top && seg1.top < seg2.bottom;
}


// A cmp function for determining which forward segment to rely on more when computing coordinates.
function compareForwardSlotSegs(seg1, seg2) {
	// put higher-pressure first
	return seg2.forwardPressure - seg1.forwardPressure ||
		// put segments that are closer to initial edge first (and favor ones with no coords yet)
		(seg1.backwardCoord || 0) - (seg2.backwardCoord || 0) ||
		// do normal sorting...
		compareSegs(seg1, seg2);
}

    /* An abstract class from which other views inherit from
----------------------------------------------------------------------------------------------------------------------*/

var View = fc.View = Class.extend({

	type: null, // subclass' view name (string)
	name: null, // deprecated. use `type` instead

	calendar: null, // owner Calendar object
	options: null, // view-specific options
	coordMap: null, // a CoordMap object for converting pixel regions to dates
	el: null, // the view's containing element. set by Calendar

	// range the view is actually displaying (moments)
	start: null,
	end: null, // exclusive

	// range the view is formally responsible for (moments)
	// may be different from start/end. for example, a month view might have 1st-31st, excluding padded dates
	intervalStart: null,
	intervalEnd: null, // exclusive

	intervalDuration: null, // the whole-unit duration that is being displayed
	intervalUnit: null, // name of largest unit being displayed, like "month" or "week"

	isSelected: false, // boolean whether a range of time is user-selected or not

	// subclasses can optionally use a scroll container
	scrollerEl: null, // the element that will most likely scroll when content is too tall
	scrollTop: null, // cached vertical scroll value

	// classNames styled by jqui themes
	widgetHeaderClass: null,
	widgetContentClass: null,
	highlightStateClass: null,

	// for date utils, computed from options
	nextDayThreshold: null,
	isHiddenDayHash: null,

	// document handlers, bound to `this` object
	documentMousedownProxy: null, // TODO: doesn't work with touch


	constructor: function(calendar, viewOptions, viewType) {
		this.calendar = calendar;
		this.options = viewOptions;
		this.type = this.name = viewType; // .name is deprecated

		this.nextDayThreshold = moment.duration(this.opt('nextDayThreshold'));
		this.initTheming();
		this.initHiddenDays();

		this.documentMousedownProxy = $.proxy(this, 'documentMousedown');

		this.initialize();
	},


	// A good place for subclasses to initialize member variables
	initialize: function() {
		// subclasses can implement
	},


	// Retrieves an option with the given name
	opt: function(name) {
		var val;

		val = this.options[name]; // look at view-specific options first
		if (val !== undefined) {
			return val;
		}

		val = this.calendar.options[name];
		if ($.isPlainObject(val) && !isForcedAtomicOption(name)) { // view-option-hashes are deprecated
			return smartProperty(val, this.type);
		}

		return val;
	},


	// Triggers handlers that are view-related. Modifies args before passing to calendar.
	trigger: function(name, thisObj) { // arguments beyond thisObj are passed along
		var calendar = this.calendar;

		return calendar.trigger.apply(
			calendar,
			[name, thisObj || this].concat(
				Array.prototype.slice.call(arguments, 2), // arguments beyond thisObj
				[ this ] // always make the last argument a reference to the view. TODO: deprecate
			)
		);
	},


	/* Dates
	------------------------------------------------------------------------------------------------------------------*/


	// Updates all internal dates to center around the given current date
	setDate: function(date) {
		this.setRange(this.computeRange(date));
	},


	// Updates all internal dates for displaying the given range.
	// Expects all values to be normalized (like what computeRange does).
	setRange: function(range) {
		$.extend(this, range);
	},


	// Given a single current date, produce information about what range to display.
	// Subclasses can override. Must return all properties.
	computeRange: function(date) {
		var intervalDuration = moment.duration(this.opt('duration') || this.constructor.duration || { days: 1 });
		var intervalUnit = computeIntervalUnit(intervalDuration);
		var intervalStart = date.clone().startOf(intervalUnit);
		var intervalEnd = intervalStart.clone().add(intervalDuration);
		var start, end;

		// normalize the range's time-ambiguity
		if (computeIntervalAs('days', intervalDuration)) { // whole-days?
			intervalStart.stripTime();
			intervalEnd.stripTime();
		}
		else { // needs to have a time?
			if (!intervalStart.hasTime()) {
				intervalStart = this.calendar.rezoneDate(intervalStart); // convert to current timezone, with 00:00
			}
			if (!intervalEnd.hasTime()) {
				intervalEnd = this.calendar.rezoneDate(intervalEnd); // convert to current timezone, with 00:00
			}
		}

		start = intervalStart.clone();
		start = this.skipHiddenDays(start);
		end = intervalEnd.clone();
		end = this.skipHiddenDays(end, -1, true); // exclusively move backwards

		return {
			intervalDuration: intervalDuration,
			intervalUnit: intervalUnit,
			intervalStart: intervalStart,
			intervalEnd: intervalEnd,
			start: start,
			end: end
		};
	},


	// Computes the new date when the user hits the prev button, given the current date
	computePrevDate: function(date) {
		return this.skipHiddenDays(
			date.clone().startOf(this.intervalUnit).subtract(this.intervalDuration), -1
		);
	},


	// Computes the new date when the user hits the next button, given the current date
	computeNextDate: function(date) {
		return this.skipHiddenDays(
			date.clone().startOf(this.intervalUnit).add(this.intervalDuration)
		);
	},


	/* Title and Date Formatting
	------------------------------------------------------------------------------------------------------------------*/


	// Computes what the title at the top of the calendar should be for this view
	computeTitle: function() {
		return this.formatRange(
			{ start: this.intervalStart, end: this.intervalEnd },
			this.opt('titleFormat') || this.computeTitleFormat(),
			this.opt('titleRangeSeparator')
		);
	},


	// Generates the format string that should be used to generate the title for the current date range.
	// Attempts to compute the most appropriate format if not explicitly specified with `titleFormat`.
	computeTitleFormat: function() {
		if (this.intervalUnit == 'year') {
			return 'YYYY';
		}
		else if (this.intervalUnit == 'month') {
			return this.opt('monthYearFormat'); // like "September 2014"
		}
		else if (this.intervalDuration.as('days') > 1) {
			return 'll'; // multi-day range. shorter, like "Sep 9 - 10 2014"
		}
		else {
			return 'LL'; // one day. longer, like "September 9 2014"
		}
	},


	// Utility for formatting a range. Accepts a range object, formatting string, and optional separator.
	// Displays all-day ranges naturally, with an inclusive end. Takes the current isRTL into account.
	formatRange: function(range, formatStr, separator) {
		var end = range.end;

		if (!end.hasTime()) { // all-day?
			end = end.clone().subtract(1); // convert to inclusive. last ms of previous day
		}

		return formatRange(range.start, end, formatStr, separator, this.opt('isRTL'));
	},


	/* Rendering
	------------------------------------------------------------------------------------------------------------------*/


	// Wraps the basic render() method with more View-specific logic. Called by the owner Calendar.
	renderView: function() {
		this.render();
		this.updateSize();
		this.initializeScroll();
		this.trigger('viewRender', this, this, this.el);

		// attach handlers to document. do it here to allow for destroy/rerender
		$(document).on('mousedown', this.documentMousedownProxy);
	},


	// Renders the view inside an already-defined `this.el`
	render: function() {
		// subclasses should implement
	},


	// Wraps the basic destroy() method with more View-specific logic. Called by the owner Calendar.
	destroyView: function() {
		this.unselect();
		this.destroyViewEvents();
		this.destroy();
		this.trigger('viewDestroy', this, this, this.el);

		$(document).off('mousedown', this.documentMousedownProxy);
	},


	// Clears the view's rendering
	destroy: function() {
		this.el.empty(); // removes inner contents but leaves the element intact
	},


	// Initializes internal variables related to theming
	initTheming: function() {
		var tm = this.opt('theme') ? 'ui' : 'fc';

		this.widgetHeaderClass = tm + '-widget-header';
		this.widgetContentClass = tm + '-widget-content';
		this.highlightStateClass = tm + '-state-highlight';
	},


	/* Dimensions
	------------------------------------------------------------------------------------------------------------------*/


	// Refreshes anything dependant upon sizing of the container element of the grid
	updateSize: function(isResize) {
		if (isResize) {
			this.recordScroll();
		}
		this.updateHeight();
		this.updateWidth();
	},


	// Refreshes the horizontal dimensions of the calendar
	updateWidth: function() {
		// subclasses should implement
	},


	// Refreshes the vertical dimensions of the calendar
	updateHeight: function() {
		var calendar = this.calendar; // we poll the calendar for height information

		this.setHeight(
			calendar.getSuggestedViewHeight(),
			calendar.isHeightAuto()
		);
	},


	// Updates the vertical dimensions of the calendar to the specified height.
	// if `isAuto` is set to true, height becomes merely a suggestion and the view should use its "natural" height.
	setHeight: function(height, isAuto) {
		// subclasses should implement
	},


	/* Scroller
	------------------------------------------------------------------------------------------------------------------*/


	// Given the total height of the view, return the number of pixels that should be used for the scroller.
	// By default, uses this.scrollerEl, but can pass this in as well.
	// Utility for subclasses.
	computeScrollerHeight: function(totalHeight, scrollerEl) {
		var both;
		var otherHeight; // cumulative height of everything that is not the scrollerEl in the view (header+borders)

		scrollerEl = scrollerEl || this.scrollerEl;
		both = this.el.add(scrollerEl);

		// fuckin IE8/9/10/11 sometimes returns 0 for dimensions. this weird hack was the only thing that worked
		both.css({
			position: 'relative', // cause a reflow, which will force fresh dimension recalculation
			left: -1 // ensure reflow in case the el was already relative. negative is less likely to cause new scroll
		});
		otherHeight = this.el.outerHeight() - scrollerEl.height(); // grab the dimensions
		both.css({ position: '', left: '' }); // undo hack

		return totalHeight - otherHeight;
	},


	// Sets the scroll value of the scroller to the initial pre-configured state prior to allowing the user to change it
	initializeScroll: function() {
	},


	// Called for remembering the current scroll value of the scroller.
	// Should be called before there is a destructive operation (like removing DOM elements) that might inadvertently
	// change the scroll of the container.
	recordScroll: function() {
		if (this.scrollerEl) {
			this.scrollTop = this.scrollerEl.scrollTop();
		}
	},


	// Set the scroll value of the scroller to the previously recorded value.
	// Should be called after we know the view's dimensions have been restored following some type of destructive
	// operation (like temporarily removing DOM elements).
	restoreScroll: function() {
		if (this.scrollTop !== null) {
			this.scrollerEl.scrollTop(this.scrollTop);
		}
	},


	/* Event Elements / Segments
	------------------------------------------------------------------------------------------------------------------*/


	// Wraps the basic renderEvents() method with more View-specific logic
	renderViewEvents: function(events) {
		this.renderEvents(events);

		this.eventSegEach(function(seg) {
			this.trigger('eventAfterRender', seg.event, seg.event, seg.el);
		});
		this.trigger('eventAfterAllRender');
	},


	// Renders the events onto the view.
	renderEvents: function() {
		// subclasses should implement
	},


	// Wraps the basic destroyEvents() method with more View-specific logic
	destroyViewEvents: function() {
		this.eventSegEach(function(seg) {
			this.trigger('eventDestroy', seg.event, seg.event, seg.el);
		});

		this.destroyEvents();
	},


	// Removes event elements from the view.
	destroyEvents: function() {
		// subclasses should implement
	},


	// Given an event and the default element used for rendering, returns the element that should actually be used.
	// Basically runs events and elements through the eventRender hook.
	resolveEventEl: function(event, el) {
		var custom = this.trigger('eventRender', event, event, el);

		if (custom === false) { // means don't render at all
			el = null;
		}
		else if (custom && custom !== true) {
			el = $(custom);
		}

		return el;
	},


	// Hides all rendered event segments linked to the given event
	showEvent: function(event) {
		this.eventSegEach(function(seg) {
			seg.el.css('visibility', '');
		}, event);
	},


	// Shows all rendered event segments linked to the given event
	hideEvent: function(event) {
		this.eventSegEach(function(seg) {
			seg.el.css('visibility', 'hidden');
		}, event);
	},


	// Iterates through event segments. Goes through all by default.
	// If the optional `event` argument is specified, only iterates through segments linked to that event.
	// The `this` value of the callback function will be the view.
	eventSegEach: function(func, event) {
		var segs = this.getEventSegs();
		var i;

		for (i = 0; i < segs.length; i++) {
			if (!event || segs[i].event._id === event._id) {
				func.call(this, segs[i]);
			}
		}
	},


	// Retrieves all the rendered segment objects for the view
	getEventSegs: function() {
		// subclasses must implement
		return [];
	},


	/* Event Drag-n-Drop
	------------------------------------------------------------------------------------------------------------------*/


	// Computes if the given event is allowed to be dragged by the user
	isEventDraggable: function(event) {
		var source = event.source || {};

		return firstDefined(
			event.startEditable,
			source.startEditable,
			this.opt('eventStartEditable'),
			event.editable,
			source.editable,
			this.opt('editable')
		);
	},


	// Must be called when an event in the view is dropped onto new location.
	// `dropLocation` is an object that contains the new start/end/allDay values for the event.
	reportEventDrop: function(event, dropLocation, el, ev) {
		var calendar = this.calendar;
		var mutateResult = calendar.mutateEvent(event, dropLocation);
		var undoFunc = function() {
			mutateResult.undo();
			calendar.reportEventChange();
		};

		this.triggerEventDrop(event, mutateResult.dateDelta, undoFunc, el, ev);
		calendar.reportEventChange(); // will rerender events
	},


	// Triggers event-drop handlers that have subscribed via the API
	triggerEventDrop: function(event, dateDelta, undoFunc, el, ev) {
		this.trigger('eventDrop', el[0], event, dateDelta, undoFunc, ev, {}); // {} = jqui dummy
	},


	/* External Element Drag-n-Drop
	------------------------------------------------------------------------------------------------------------------*/


	// Must be called when an external element, via jQuery UI, has been dropped onto the calendar.
	// `meta` is the parsed data that has been embedded into the dragging event.
	// `dropLocation` is an object that contains the new start/end/allDay values for the event.
	reportExternalDrop: function(meta, dropLocation, el, ev, ui) {
		var eventProps = meta.eventProps;
		var eventInput;
		var event;

		// Try to build an event object and render it. TODO: decouple the two
		if (eventProps) {
			eventInput = $.extend({}, eventProps, dropLocation);
			event = this.calendar.renderEvent(eventInput, meta.stick)[0]; // renderEvent returns an array
		}

		this.triggerExternalDrop(event, dropLocation, el, ev, ui);
	},


	// Triggers external-drop handlers that have subscribed via the API
	triggerExternalDrop: function(event, dropLocation, el, ev, ui) {

		// trigger 'drop' regardless of whether element represents an event
		this.trigger('drop', el[0], dropLocation.start, ev, ui);

		if (event) {
			this.trigger('eventReceive', null, event); // signal an external event landed
		}
	},


	/* Drag-n-Drop Rendering (for both events and external elements)
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a visual indication of a event or external-element drag over the given drop zone.
	// If an external-element, seg will be `null`
	renderDrag: function(dropLocation, seg) {
		// subclasses must implement
	},


	// Unrenders a visual indication of an event or external-element being dragged.
	destroyDrag: function() {
		// subclasses must implement
	},


	/* Event Resizing
	------------------------------------------------------------------------------------------------------------------*/


	// Computes if the given event is allowed to be resize by the user
	isEventResizable: function(event) {
		var source = event.source || {};

		return firstDefined(
			event.durationEditable,
			source.durationEditable,
			this.opt('eventDurationEditable'),
			event.editable,
			source.editable,
			this.opt('editable')
		);
	},


	// Must be called when an event in the view has been resized to a new length
	reportEventResize: function(event, newEnd, el, ev) {
		var calendar = this.calendar;
		var mutateResult = calendar.mutateEvent(event, { end: newEnd });
		var undoFunc = function() {
			mutateResult.undo();
			calendar.reportEventChange();
		};

		this.triggerEventResize(event, mutateResult.durationDelta, undoFunc, el, ev);
		calendar.reportEventChange(); // will rerender events
	},


	// Triggers event-resize handlers that have subscribed via the API
	triggerEventResize: function(event, durationDelta, undoFunc, el, ev) {
		this.trigger('eventResize', el[0], event, durationDelta, undoFunc, ev, {}); // {} = jqui dummy
	},


	/* Selection
	------------------------------------------------------------------------------------------------------------------*/


	// Selects a date range on the view. `start` and `end` are both Moments.
	// `ev` is the native mouse event that begin the interaction.
	select: function(range, ev) {
		this.unselect(ev);
		this.renderSelection(range);
		this.reportSelection(range, ev);
	},


	// Renders a visual indication of the selection
	renderSelection: function(range) {
		// subclasses should implement
	},


	// Called when a new selection is made. Updates internal state and triggers handlers.
	reportSelection: function(range, ev) {
		this.isSelected = true;
		this.trigger('select', null, range.start, range.end, ev);
	},


	// Undoes a selection. updates in the internal state and triggers handlers.
	// `ev` is the native mouse event that began the interaction.
	unselect: function(ev) {
		if (this.isSelected) {
			this.isSelected = false;
			this.destroySelection();
			this.trigger('unselect', null, ev);
		}
	},


	// Unrenders a visual indication of selection
	destroySelection: function() {
		// subclasses should implement
	},


	// Handler for unselecting when the user clicks something and the 'unselectAuto' setting is on
	documentMousedown: function(ev) {
		var ignore;

		// is there a selection, and has the user made a proper left click?
		if (this.isSelected && this.opt('unselectAuto') && isPrimaryMouseButton(ev)) {

			// only unselect if the clicked element is not identical to or inside of an 'unselectCancel' element
			ignore = this.opt('unselectCancel');
			if (!ignore || !$(ev.target).closest(ignore).length) {
				this.unselect(ev);
			}
		}
	},


	/* Date Utils
	------------------------------------------------------------------------------------------------------------------*/


	// Initializes internal variables related to calculating hidden days-of-week
	initHiddenDays: function() {
		var hiddenDays = this.opt('hiddenDays') || []; // array of day-of-week indices that are hidden
		var isHiddenDayHash = []; // is the day-of-week hidden? (hash with day-of-week-index -> bool)
		var dayCnt = 0;
		var i;

		if (this.opt('weekends') === false) {
			hiddenDays.push(0, 6); // 0=sunday, 6=saturday
		}

		for (i = 0; i < 7; i++) {
			if (
				!(isHiddenDayHash[i] = $.inArray(i, hiddenDays) !== -1)
			) {
				dayCnt++;
			}
		}

		if (!dayCnt) {
			throw 'invalid hiddenDays'; // all days were hidden? bad.
		}

		this.isHiddenDayHash = isHiddenDayHash;
	},


	// Is the current day hidden?
	// `day` is a day-of-week index (0-6), or a Moment
	isHiddenDay: function(day) {
		if (moment.isMoment(day)) {
			day = day.day();
		}
		return this.isHiddenDayHash[day];
	},


	// Incrementing the current day until it is no longer a hidden day, returning a copy.
	// If the initial value of `date` is not a hidden day, don't do anything.
	// Pass `isExclusive` as `true` if you are dealing with an end date.
	// `inc` defaults to `1` (increment one day forward each time)
	skipHiddenDays: function(date, inc, isExclusive) {
		var out = date.clone();
		inc = inc || 1;
		while (
			this.isHiddenDayHash[(out.day() + (isExclusive ? inc : 0) + 7) % 7]
		) {
			out.add(inc, 'days');
		}
		return out;
	},


	// Returns the date range of the full days the given range visually appears to occupy.
	// Returns a new range object.
	computeDayRange: function(range) {
		var startDay = range.start.clone().stripTime(); // the beginning of the day the range starts
		var end = range.end;
		var endDay = null;
		var endTimeMS;

		if (end) {
			endDay = end.clone().stripTime(); // the beginning of the day the range exclusively ends
			endTimeMS = +end.time(); // # of milliseconds into `endDay`

			// If the end time is actually inclusively part of the next day and is equal to or
			// beyond the next day threshold, adjust the end to be the exclusive end of `endDay`.
			// Otherwise, leaving it as inclusive will cause it to exclude `endDay`.
			if (endTimeMS && endTimeMS >= this.nextDayThreshold) {
				endDay.add(1, 'days');
			}
		}

		// If no end was specified, or if it is within `startDay` but not past nextDayThreshold,
		// assign the default duration of one day.
		if (!end || endDay <= startDay) {
			endDay = startDay.clone().add(1, 'days');
		}

		return { start: startDay, end: endDay };
	},


	// Does the given event visually appear to occupy more than one day?
	isMultiDayEvent: function(event) {
		var range = this.computeDayRange(event); // event is range-ish

		return range.end.diff(range.start, 'days') > 1;
	}

});

    function Calendar(element, instanceOptions) {
	var t = this;



	// Build options object
	// -----------------------------------------------------------------------------------
	// Precedence (lowest to highest): defaults, rtlDefaults, langOptions, instanceOptions

	instanceOptions = instanceOptions || {};

	var options = mergeOptions({}, defaults, instanceOptions);
	var langOptions;

	// determine language options
	if (options.lang in langOptionHash) {
		langOptions = langOptionHash[options.lang];
	}
	else {
		langOptions = langOptionHash[defaults.lang];
	}

	if (langOptions) { // if language options exist, rebuild...
		options = mergeOptions({}, defaults, langOptions, instanceOptions);
	}

	if (options.isRTL) { // is isRTL, rebuild...
		options = mergeOptions({}, defaults, rtlDefaults, langOptions || {}, instanceOptions);
	}


	
	// Exports
	// -----------------------------------------------------------------------------------

	t.options = options;
	t.render = render;
	t.destroy = destroy;
	t.refetchEvents = refetchEvents;
	t.reportEvents = reportEvents;
	t.reportEventChange = reportEventChange;
	t.rerenderEvents = renderEvents; // `renderEvents` serves as a rerender. an API method
	t.changeView = changeView;
	t.select = select;
	t.unselect = unselect;
	t.prev = prev;
	t.next = next;
	t.prevYear = prevYear;
	t.nextYear = nextYear;
	t.today = today;
	t.gotoDate = gotoDate;
	t.incrementDate = incrementDate;
	t.zoomTo = zoomTo;
	t.getDate = getDate;
	t.getCalendar = getCalendar;
	t.getView = getView;
	t.option = option;
	t.trigger = trigger;
	t.isValidViewType = isValidViewType;
	t.getViewButtonText = getViewButtonText;



	// Language-data Internals
	// -----------------------------------------------------------------------------------
	// Apply overrides to the current language's data


	var localeData = createObject( // make a cheap copy
		getMomentLocaleData(options.lang) // will fall back to en
	);

	if (options.monthNames) {
		localeData._months = options.monthNames;
	}
	if (options.monthNamesShort) {
		localeData._monthsShort = options.monthNamesShort;
	}
	if (options.dayNames) {
		localeData._weekdays = options.dayNames;
	}
	if (options.dayNamesShort) {
		localeData._weekdaysShort = options.dayNamesShort;
	}
	if (options.firstDay != null) {
		var _week = createObject(localeData._week); // _week: { dow: # }
		_week.dow = options.firstDay;
		localeData._week = _week;
	}



	// Calendar-specific Date Utilities
	// -----------------------------------------------------------------------------------


	t.defaultAllDayEventDuration = moment.duration(options.defaultAllDayEventDuration);
	t.defaultTimedEventDuration = moment.duration(options.defaultTimedEventDuration);


	// Builds a moment using the settings of the current calendar: timezone and language.
	// Accepts anything the vanilla moment() constructor accepts.
	t.moment = function() {
		var mom;

		if (options.timezone === 'local') {
			mom = fc.moment.apply(null, arguments);

			// Force the moment to be local, because fc.moment doesn't guarantee it.
			if (mom.hasTime()) { // don't give ambiguously-timed moments a local zone
				mom.local();
			}
		}
		else if (options.timezone === 'UTC') {
			mom = fc.moment.utc.apply(null, arguments); // process as UTC
		}
		else {
			mom = fc.moment.parseZone.apply(null, arguments); // let the input decide the zone
		}

		if ('_locale' in mom) { // moment 2.8 and above
			mom._locale = localeData;
		}
		else { // pre-moment-2.8
			mom._lang = localeData;
		}

		return mom;
	};


	// Returns a boolean about whether or not the calendar knows how to calculate
	// the timezone offset of arbitrary dates in the current timezone.
	t.getIsAmbigTimezone = function() {
		return options.timezone !== 'local' && options.timezone !== 'UTC';
	};


	// Returns a copy of the given date in the current timezone of it is ambiguously zoned.
	// This will also give the date an unambiguous time.
	t.rezoneDate = function(date) {
		return t.moment(date.toArray());
	};


	// Returns a moment for the current date, as defined by the client's computer,
	// or overridden by the `now` option.
	t.getNow = function() {
		var now = options.now;
		if (typeof now === 'function') {
			now = now();
		}
		return t.moment(now);
	};


	// Calculates the week number for a moment according to the calendar's
	// `weekNumberCalculation` setting.
	t.calculateWeekNumber = function(mom) {
		var calc = options.weekNumberCalculation;

		if (typeof calc === 'function') {
			return calc(mom);
		}
		else if (calc === 'local') {
			return mom.week();
		}
		else if (calc.toUpperCase() === 'ISO') {
			return mom.isoWeek();
		}
	};


	// Get an event's normalized end date. If not present, calculate it from the defaults.
	t.getEventEnd = function(event) {
		if (event.end) {
			return event.end.clone();
		}
		else {
			return t.getDefaultEventEnd(event.allDay, event.start);
		}
	};


	// Given an event's allDay status and start date, return swhat its fallback end date should be.
	t.getDefaultEventEnd = function(allDay, start) { // TODO: rename to computeDefaultEventEnd
		var end = start.clone();

		if (allDay) {
			end.stripTime().add(t.defaultAllDayEventDuration);
		}
		else {
			end.add(t.defaultTimedEventDuration);
		}

		if (t.getIsAmbigTimezone()) {
			end.stripZone(); // we don't know what the tzo should be
		}

		return end;
	};


	// Produces a human-readable string for the given duration.
	// Side-effect: changes the locale of the given duration.
	function humanizeDuration(duration) {
		return (duration.locale || duration.lang).call(duration, options.lang) // works moment-pre-2.8
			.humanize();
	}


	
	// Imports
	// -----------------------------------------------------------------------------------


	EventManager.call(t, options);
	var isFetchNeeded = t.isFetchNeeded;
	var fetchEvents = t.fetchEvents;



	// Locals
	// -----------------------------------------------------------------------------------


	var _element = element[0];
	var header;
	var headerElement;
	var content;
	var tm; // for making theme classes
	var viewSpecCache = {};
	var currentView;
	var suggestedViewHeight;
	var windowResizeProxy; // wraps the windowResize function
	var ignoreWindowResize = 0;
	var date;
	var events = [];
	
	
	
	// Main Rendering
	// -----------------------------------------------------------------------------------


	if (options.defaultDate != null) {
		date = t.moment(options.defaultDate);
	}
	else {
		date = t.getNow();
	}
	
	
	function render(inc) {
		if (!content) {
			initialRender();
		}
		else if (elementVisible()) {
			// mainly for the public API
			calcSize();
			renderView(inc);
		}
	}
	
	
	function initialRender() {
		tm = options.theme ? 'ui' : 'fc';
		element.addClass('fc');

		if (options.isRTL) {
			element.addClass('fc-rtl');
		}
		else {
			element.addClass('fc-ltr');
		}

		if (options.theme) {
			element.addClass('ui-widget');
		}
		else {
			element.addClass('fc-unthemed');
		}

		content = $("<div class='fc-view-container'/>").prependTo(element);

		header = new Header(t, options);
		headerElement = header.render();
		if (headerElement) {
			element.prepend(headerElement);
		}

		changeView(options.defaultView);

		if (options.handleWindowResize) {
			windowResizeProxy = debounce(windowResize, options.windowResizeDelay); // prevents rapid calls
			$(window).resize(windowResizeProxy);
		}
	}
	
	
	function destroy() {

		if (currentView) {
			currentView.destroyView();
		}

		header.destroy();
		content.remove();
		element.removeClass('fc fc-ltr fc-rtl fc-unthemed ui-widget');

		$(window).unbind('resize', windowResizeProxy);
	}
	
	
	function elementVisible() {
		return element.is(':visible');
	}
	
	

	// View Rendering
	// -----------------------------------------------------------------------------------


	function changeView(viewType) {
		renderView(0, viewType);
	}


	// Renders a view because of a date change, view-type change, or for the first time
	function renderView(delta, viewType) {
		ignoreWindowResize++;

		// if viewType is changing, destroy the old view
		if (currentView && viewType && currentView.type !== viewType) {
			header.deactivateButton(currentView.type);
			freezeContentHeight(); // prevent a scroll jump when view element is removed
			if (currentView.start) { // rendered before?
				currentView.destroyView();
			}
			currentView.el.remove();
			currentView = null;
		}

		// if viewType changed, or the view was never created, create a fresh view
		if (!currentView && viewType) {
			currentView = instantiateView(viewType);
			currentView.el =  $("<div class='fc-view fc-" + viewType + "-view' />").appendTo(content);
			header.activateButton(viewType);
		}

		if (currentView) {

			// let the view determine what the delta means
			if (delta < 0) {
				date = currentView.computePrevDate(date);
			}
			else if (delta > 0) {
				date = currentView.computeNextDate(date);
			}

			// render or rerender the view
			if (
				!currentView.start || // never rendered before
				delta || // explicit date window change
				!date.isWithin(currentView.intervalStart, currentView.intervalEnd) // implicit date window change
			) {
				if (elementVisible()) {

					freezeContentHeight();
					if (currentView.start) { // rendered before?
						currentView.destroyView();
					}
					currentView.setDate(date);
					currentView.renderView();
					unfreezeContentHeight();

					// need to do this after View::render, so dates are calculated
					updateTitle();
					updateTodayButton();

					getAndRenderEvents();
				}
			}
		}

		unfreezeContentHeight(); // undo any lone freezeContentHeight calls
		ignoreWindowResize--;
	}



	// View Instantiation
	// -----------------------------------------------------------------------------------


	// Given a view name for a custom view or a standard view, creates a ready-to-go View object
	function instantiateView(viewType) {
		var spec = getViewSpec(viewType);

		return new spec['class'](t, spec.options, viewType);
	}


	// Gets information about how to create a view
	function getViewSpec(requestedViewType) {
		var allDefaultButtonText = options.defaultButtonText || {};
		var allButtonText = options.buttonText || {};
		var hash = options.views || {}; // the `views` option object
		var viewType = requestedViewType;
		var viewOptionsChain = [];
		var viewOptions;
		var viewClass;
		var duration, unit, unitIsSingle = false;
		var buttonText;

		if (viewSpecCache[requestedViewType]) {
			return viewSpecCache[requestedViewType];
		}

		function processSpecInput(input) {
			if (typeof input === 'function') {
				viewClass = input;
			}
			else if (typeof input === 'object') {
				$.extend(viewOptions, input);
			}
		}

		// iterate up a view's spec ancestor chain util we find a class to instantiate
		while (viewType && !viewClass) {
			viewOptions = {}; // only for this specific view in the ancestry
			processSpecInput(fcViews[viewType]); // $.fullCalendar.views, lower precedence
			processSpecInput(hash[viewType]); // options at initialization, higher precedence
			viewOptionsChain.unshift(viewOptions); // record older ancestors first
			viewType = viewOptions.type;
		}

		viewOptionsChain.unshift({}); // jQuery's extend needs at least one arg
		viewOptions = $.extend.apply($, viewOptionsChain); // combine all, newer ancestors overwritting old

		if (viewClass) {

			duration = viewOptions.duration || viewClass.duration;
			if (duration) {
				duration = moment.duration(duration);
				unit = computeIntervalUnit(duration);
				unitIsSingle = computeIntervalAs(unit, duration) === 1;
			}

			// options that are specified per the view's duration, like "week" or "day"
			if (unitIsSingle && hash[unit]) {
				viewOptions = $.extend({}, hash[unit], viewOptions); // lowest priority
			}

			// compute the final text for the button representing this view
			buttonText =
				allButtonText[requestedViewType] || // init options, like "agendaWeek"
				(unitIsSingle ? allButtonText[unit] : null) || // init options, like "week"
				allDefaultButtonText[requestedViewType] || // lang data, like "agendaWeek"
				(unitIsSingle ? allDefaultButtonText[unit] : null) || // lang data, like "week"
				viewOptions.buttonText ||
				viewClass.buttonText ||
				(duration ? humanizeDuration(duration) : null) ||
				requestedViewType;

			return (viewSpecCache[requestedViewType] = {
				'class': viewClass,
				options: viewOptions,
				buttonText: buttonText
			});
		}
	}


	// Returns a boolean about whether the view is okay to instantiate at some point
	function isValidViewType(viewType) {
		return Boolean(getViewSpec(viewType));
	}


	// Gets the text that should be displayed on a view's button in the header
	function getViewButtonText(viewType) {
		var spec = getViewSpec(viewType);

		if (spec) {
			return spec.buttonText;
		}
	}
	
	

	// Resizing
	// -----------------------------------------------------------------------------------


	t.getSuggestedViewHeight = function() {
		if (suggestedViewHeight === undefined) {
			calcSize();
		}
		return suggestedViewHeight;
	};


	t.isHeightAuto = function() {
		return options.contentHeight === 'auto' || options.height === 'auto';
	};
	
	
	function updateSize(shouldRecalc) {
		if (elementVisible()) {

			if (shouldRecalc) {
				_calcSize();
			}

			ignoreWindowResize++;
			currentView.updateSize(true); // isResize=true. will poll getSuggestedViewHeight() and isHeightAuto()
			ignoreWindowResize--;

			return true; // signal success
		}
	}


	function calcSize() {
		if (elementVisible()) {
			_calcSize();
		}
	}
	
	
	function _calcSize() { // assumes elementVisible
		if (typeof options.contentHeight === 'number') { // exists and not 'auto'
			suggestedViewHeight = options.contentHeight;
		}
		else if (typeof options.height === 'number') { // exists and not 'auto'
			suggestedViewHeight = options.height - (headerElement ? headerElement.outerHeight(true) : 0);
		}
		else {
			suggestedViewHeight = Math.round(content.width() / Math.max(options.aspectRatio, .5));
		}
	}
	
	
	function windowResize(ev) {
		if (
			!ignoreWindowResize &&
			ev.target === window && // so we don't process jqui "resize" events that have bubbled up
			currentView.start // view has already been rendered
		) {
			if (updateSize(true)) {
				currentView.trigger('windowResize', _element);
			}
		}
	}
	
	
	
	/* Event Fetching/Rendering
	-----------------------------------------------------------------------------*/
	// TODO: going forward, most of this stuff should be directly handled by the view


	function refetchEvents() { // can be called as an API method
		destroyEvents(); // so that events are cleared before user starts waiting for AJAX
		fetchAndRenderEvents();
	}


	function renderEvents() { // destroys old events if previously rendered
		if (elementVisible()) {
			freezeContentHeight();
			currentView.destroyViewEvents(); // no performance cost if never rendered
			currentView.renderViewEvents(events);
			unfreezeContentHeight();
		}
	}


	function destroyEvents() {
		freezeContentHeight();
		currentView.destroyViewEvents();
		unfreezeContentHeight();
	}
	

	function getAndRenderEvents() {
		if (!options.lazyFetching || isFetchNeeded(currentView.start, currentView.end)) {
			fetchAndRenderEvents();
		}
		else {
			renderEvents();
		}
	}


	function fetchAndRenderEvents() {
		fetchEvents(currentView.start, currentView.end);
			// ... will call reportEvents
			// ... which will call renderEvents
	}

	
	// called when event data arrives
	function reportEvents(_events) {
		events = _events;
		renderEvents();
	}


	// called when a single event's data has been changed
	function reportEventChange() {
		renderEvents();
	}



	/* Header Updating
	-----------------------------------------------------------------------------*/


	function updateTitle() {
		header.updateTitle(currentView.computeTitle());
	}


	function updateTodayButton() {
		var now = t.getNow();
		if (now.isWithin(currentView.intervalStart, currentView.intervalEnd)) {
			header.disableButton('today');
		}
		else {
			header.enableButton('today');
		}
	}
	


	/* Selection
	-----------------------------------------------------------------------------*/
	

	function select(start, end) {

		start = t.moment(start);
		if (end) {
			end = t.moment(end);
		}
		else if (start.hasTime()) {
			end = start.clone().add(t.defaultTimedEventDuration);
		}
		else {
			end = start.clone().add(t.defaultAllDayEventDuration);
		}

		currentView.select({ start: start, end: end }); // accepts a range
	}
	

	function unselect() { // safe to be called before renderView
		if (currentView) {
			currentView.unselect();
		}
	}
	
	
	
	/* Date
	-----------------------------------------------------------------------------*/
	
	
	function prev() {
		renderView(-1);
	}
	
	
	function next() {
		renderView(1);
	}
	
	
	function prevYear() {
		date.add(-1, 'years');
		renderView();
	}
	
	
	function nextYear() {
		date.add(1, 'years');
		renderView();
	}
	
	
	function today() {
		date = t.getNow();
		renderView();
	}
	
	
	function gotoDate(dateInput) {
		date = t.moment(dateInput);
		renderView();
	}
	
	
	function incrementDate(delta) {
		date.add(moment.duration(delta));
		renderView();
	}


	// Forces navigation to a view for the given date.
	// `viewType` can be a specific view name or a generic one like "week" or "day".
	function zoomTo(newDate, viewType) {
		var viewStr;
		var match;

		if (!viewType || !isValidViewType(viewType)) { // a general view name, or "auto"
			viewType = viewType || 'day';
			viewStr = header.getViewsWithButtons().join(' '); // space-separated string of all the views in the header

			// try to match a general view name, like "week", against a specific one, like "agendaWeek"
			match = viewStr.match(new RegExp('\\w+' + capitaliseFirstLetter(viewType)));

			// fall back to the day view being used in the header
			if (!match) {
				match = viewStr.match(/\w+Day/);
			}

			viewType = match ? match[0] : 'agendaDay'; // fall back to agendaDay
		}

		date = newDate;
		changeView(viewType);
	}
	
	
	function getDate() {
		return date.clone();
	}



	/* Height "Freezing"
	-----------------------------------------------------------------------------*/


	function freezeContentHeight() {
		content.css({
			width: '100%',
			height: content.height(),
			overflow: 'hidden'
		});
	}


	function unfreezeContentHeight() {
		content.css({
			width: '',
			height: '',
			overflow: ''
		});
	}
	
	
	
	/* Misc
	-----------------------------------------------------------------------------*/
	

	function getCalendar() {
		return t;
	}

	
	function getView() {
		return currentView;
	}
	
	
	function option(name, value) {
		if (value === undefined) {
			return options[name];
		}
		if (name == 'height' || name == 'contentHeight' || name == 'aspectRatio') {
			options[name] = value;
			updateSize(true); // true = allow recalculation of height
		}
	}
	
	
	function trigger(name, thisObj) {
		if (options[name]) {
			return options[name].apply(
				thisObj || _element,
				Array.prototype.slice.call(arguments, 2)
			);
		}
	}

}

    /* Top toolbar area with buttons and title
----------------------------------------------------------------------------------------------------------------------*/
// TODO: rename all header-related things to "toolbar"

function Header(calendar, options) {
	var t = this;
	
	// exports
	t.render = render;
	t.destroy = destroy;
	t.updateTitle = updateTitle;
	t.activateButton = activateButton;
	t.deactivateButton = deactivateButton;
	t.disableButton = disableButton;
	t.enableButton = enableButton;
	t.getViewsWithButtons = getViewsWithButtons;
	
	// locals
	var el = $();
	var viewsWithButtons = [];
	var tm;


	function render() {
		var sections = options.header;

		tm = options.theme ? 'ui' : 'fc';

		if (sections) {
			el = $("<div class='fc-toolbar'/>")
				.append(renderSection('left'))
				.append(renderSection('right'))
				.append(renderSection('center'))
				.append('<div class="fc-clear"/>');

			return el;
		}
	}
	
	
	function destroy() {
		el.remove();
	}
	
	
	function renderSection(position) {
		var sectionEl = $('<div class="fc-' + position + '"/>');
		var buttonStr = options.header[position];

		if (buttonStr) {
			$.each(buttonStr.split(' '), function(i) {
				var groupChildren = $();
				var isOnlyButtons = true;
				var groupEl;

				$.each(this.split(','), function(j, buttonName) {
					var buttonClick;
					var themeIcon;
					var normalIcon;
					var defaultText;
					var viewText; // highest priority
					var customText;
					var innerHtml;
					var classes;
					var button;

					if (buttonName == 'title') {
						groupChildren = groupChildren.add($('<h2>&nbsp;</h2>')); // we always want it to take up height
						isOnlyButtons = false;
					}
					else {
						if (calendar[buttonName]) { // a calendar method
							buttonClick = function() {
								calendar[buttonName]();
							};
						}
						else if (calendar.isValidViewType(buttonName)) { // a view type
							buttonClick = function() {
								calendar.changeView(buttonName);
							};
							viewsWithButtons.push(buttonName);
							viewText = calendar.getViewButtonText(buttonName);
						}
						if (buttonClick) {

							// smartProperty allows different text per view button (ex: "Agenda Week" vs "Basic Week")
							themeIcon = smartProperty(options.themeButtonIcons, buttonName);
							normalIcon = smartProperty(options.buttonIcons, buttonName);
							defaultText = smartProperty(options.defaultButtonText, buttonName); // from languages
							customText = smartProperty(options.buttonText, buttonName);

							if (viewText || customText) {
								innerHtml = htmlEscape(viewText || customText);
							}
							else if (themeIcon && options.theme) {
								innerHtml = "<span class='ui-icon ui-icon-" + themeIcon + "'></span>";
							}
							else if (normalIcon && !options.theme) {
								innerHtml = "<span class='fc-icon fc-icon-" + normalIcon + "'></span>";
							}
							else {
								innerHtml = htmlEscape(defaultText || buttonName);
							}

							classes = [
								'fc-' + buttonName + '-button',
								tm + '-button',
								tm + '-state-default'
							];

							button = $( // type="button" so that it doesn't submit a form
								'<button type="button" class="' + classes.join(' ') + '">' +
									innerHtml +
								'</button>'
								)
								.click(function() {
									// don't process clicks for disabled buttons
									if (!button.hasClass(tm + '-state-disabled')) {

										buttonClick();

										// after the click action, if the button becomes the "active" tab, or disabled,
										// it should never have a hover class, so remove it now.
										if (
											button.hasClass(tm + '-state-active') ||
											button.hasClass(tm + '-state-disabled')
										) {
											button.removeClass(tm + '-state-hover');
										}
									}
								})
								.mousedown(function() {
									// the *down* effect (mouse pressed in).
									// only on buttons that are not the "active" tab, or disabled
									button
										.not('.' + tm + '-state-active')
										.not('.' + tm + '-state-disabled')
										.addClass(tm + '-state-down');
								})
								.mouseup(function() {
									// undo the *down* effect
									button.removeClass(tm + '-state-down');
								})
								.hover(
									function() {
										// the *hover* effect.
										// only on buttons that are not the "active" tab, or disabled
										button
											.not('.' + tm + '-state-active')
											.not('.' + tm + '-state-disabled')
											.addClass(tm + '-state-hover');
									},
									function() {
										// undo the *hover* effect
										button
											.removeClass(tm + '-state-hover')
											.removeClass(tm + '-state-down'); // if mouseleave happens before mouseup
									}
								);

							groupChildren = groupChildren.add(button);
						}
					}
				});

				if (isOnlyButtons) {
					groupChildren
						.first().addClass(tm + '-corner-left').end()
						.last().addClass(tm + '-corner-right').end();
				}

				if (groupChildren.length > 1) {
					groupEl = $('<div/>');
					if (isOnlyButtons) {
						groupEl.addClass('fc-button-group');
					}
					groupEl.append(groupChildren);
					sectionEl.append(groupEl);
				}
				else {
					sectionEl.append(groupChildren); // 1 or 0 children
				}
			});
		}

		return sectionEl;
	}
	
	
	function updateTitle(text) {
		el.find('h2').text(text);
	}
	
	
	function activateButton(buttonName) {
		el.find('.fc-' + buttonName + '-button')
			.addClass(tm + '-state-active');
	}
	
	
	function deactivateButton(buttonName) {
		el.find('.fc-' + buttonName + '-button')
			.removeClass(tm + '-state-active');
	}
	
	
	function disableButton(buttonName) {
		el.find('.fc-' + buttonName + '-button')
			.attr('disabled', 'disabled')
			.addClass(tm + '-state-disabled');
	}
	
	
	function enableButton(buttonName) {
		el.find('.fc-' + buttonName + '-button')
			.removeAttr('disabled')
			.removeClass(tm + '-state-disabled');
	}


	function getViewsWithButtons() {
		return viewsWithButtons;
	}

}

    fc.sourceNormalizers = [];
fc.sourceFetchers = [];

var ajaxDefaults = {
	dataType: 'json',
	cache: false
};

var eventGUID = 1;


function EventManager(options) { // assumed to be a calendar
	var t = this;
	
	
	// exports
	t.isFetchNeeded = isFetchNeeded;
	t.fetchEvents = fetchEvents;
	t.addEventSource = addEventSource;
	t.removeEventSource = removeEventSource;
	t.updateEvent = updateEvent;
	t.renderEvent = renderEvent;
	t.removeEvents = removeEvents;
	t.clientEvents = clientEvents;
	t.mutateEvent = mutateEvent;
	t.normalizeEventDateProps = normalizeEventDateProps;
	t.ensureVisibleEventRange = ensureVisibleEventRange;
	
	
	// imports
	var trigger = t.trigger;
	var getView = t.getView;
	var reportEvents = t.reportEvents;
	
	
	// locals
	var stickySource = { events: [] };
	var sources = [ stickySource ];
	var rangeStart, rangeEnd;
	var currentFetchID = 0;
	var pendingSourceCnt = 0;
	var loadingLevel = 0;
	var cache = []; // holds events that have already been expanded


	$.each(
		(options.events ? [ options.events ] : []).concat(options.eventSources || []),
		function(i, sourceInput) {
			var source = buildEventSource(sourceInput);
			if (source) {
				sources.push(source);
			}
		}
	);
	
	
	
	/* Fetching
	-----------------------------------------------------------------------------*/
	
	
	function isFetchNeeded(start, end) {
		return !rangeStart || // nothing has been fetched yet?
			// or, a part of the new range is outside of the old range? (after normalizing)
			start.clone().stripZone() < rangeStart.clone().stripZone() ||
			end.clone().stripZone() > rangeEnd.clone().stripZone();
	}
	
	
	function fetchEvents(start, end) {
		rangeStart = start;
		rangeEnd = end;
		cache = [];
		var fetchID = ++currentFetchID;
		var len = sources.length;
		pendingSourceCnt = len;
		for (var i=0; i<len; i++) {
			fetchEventSource(sources[i], fetchID);
		}
	}
	
	
	function fetchEventSource(source, fetchID) {
		_fetchEventSource(source, function(eventInputs) {
			var isArraySource = $.isArray(source.events);
			var i, eventInput;
			var abstractEvent;

			if (fetchID == currentFetchID) {

				if (eventInputs) {
					for (i = 0; i < eventInputs.length; i++) {
						eventInput = eventInputs[i];

						if (isArraySource) { // array sources have already been convert to Event Objects
							abstractEvent = eventInput;
						}
						else {
							abstractEvent = buildEventFromInput(eventInput, source);
						}

						if (abstractEvent) { // not false (an invalid event)
							cache.push.apply(
								cache,
								expandEvent(abstractEvent) // add individual expanded events to the cache
							);
						}
					}
				}

				pendingSourceCnt--;
				if (!pendingSourceCnt) {
					reportEvents(cache);
				}
			}
		});
	}
	
	
	function _fetchEventSource(source, callback) {
		var i;
		var fetchers = fc.sourceFetchers;
		var res;

		for (i=0; i<fetchers.length; i++) {
			res = fetchers[i].call(
				t, // this, the Calendar object
				source,
				rangeStart.clone(),
				rangeEnd.clone(),
				options.timezone,
				callback
			);

			if (res === true) {
				// the fetcher is in charge. made its own async request
				return;
			}
			else if (typeof res == 'object') {
				// the fetcher returned a new source. process it
				_fetchEventSource(res, callback);
				return;
			}
		}

		var events = source.events;
		if (events) {
			if ($.isFunction(events)) {
				pushLoading();
				events.call(
					t, // this, the Calendar object
					rangeStart.clone(),
					rangeEnd.clone(),
					options.timezone,
					function(events) {
						callback(events);
						popLoading();
					}
				);
			}
			else if ($.isArray(events)) {
				callback(events);
			}
			else {
				callback();
			}
		}else{
			var url = source.url;
			if (url) {
				var success = source.success;
				var error = source.error;
				var complete = source.complete;

				// retrieve any outbound GET/POST $.ajax data from the options
				var customData;
				if ($.isFunction(source.data)) {
					// supplied as a function that returns a key/value object
					customData = source.data();
				}
				else {
					// supplied as a straight key/value object
					customData = source.data;
				}

				// use a copy of the custom data so we can modify the parameters
				// and not affect the passed-in object.
				var data = $.extend({}, customData || {});

				var startParam = firstDefined(source.startParam, options.startParam);
				var endParam = firstDefined(source.endParam, options.endParam);
				var timezoneParam = firstDefined(source.timezoneParam, options.timezoneParam);

				if (startParam) {
					data[startParam] = rangeStart.format();
				}
				if (endParam) {
					data[endParam] = rangeEnd.format();
				}
				if (options.timezone && options.timezone != 'local') {
					data[timezoneParam] = options.timezone;
				}

				pushLoading();
				$.ajax($.extend({}, ajaxDefaults, source, {
					data: data,
					success: function(events) {
						events = events || [];
						var res = applyAll(success, this, arguments);
						if ($.isArray(res)) {
							events = res;
						}
						callback(events);
					},
					error: function() {
						applyAll(error, this, arguments);
						callback();
					},
					complete: function() {
						applyAll(complete, this, arguments);
						popLoading();
					}
				}));
			}else{
				callback();
			}
		}
	}
	
	
	
	/* Sources
	-----------------------------------------------------------------------------*/
	

	function addEventSource(sourceInput) {
		var source = buildEventSource(sourceInput);
		if (source) {
			sources.push(source);
			pendingSourceCnt++;
			fetchEventSource(source, currentFetchID); // will eventually call reportEvents
		}
	}


	function buildEventSource(sourceInput) { // will return undefined if invalid source
		var normalizers = fc.sourceNormalizers;
		var source;
		var i;

		if ($.isFunction(sourceInput) || $.isArray(sourceInput)) {
			source = { events: sourceInput };
		}
		else if (typeof sourceInput === 'string') {
			source = { url: sourceInput };
		}
		else if (typeof sourceInput === 'object') {
			source = $.extend({}, sourceInput); // shallow copy
		}

		if (source) {

			// TODO: repeat code, same code for event classNames
			if (source.className) {
				if (typeof source.className === 'string') {
					source.className = source.className.split(/\s+/);
				}
				// otherwise, assumed to be an array
			}
			else {
				source.className = [];
			}

			// for array sources, we convert to standard Event Objects up front
			if ($.isArray(source.events)) {
				source.origArray = source.events; // for removeEventSource
				source.events = $.map(source.events, function(eventInput) {
					return buildEventFromInput(eventInput, source);
				});
			}

			for (i=0; i<normalizers.length; i++) {
				normalizers[i].call(t, source);
			}

			return source;
		}
	}


	function removeEventSource(source) {
		sources = $.grep(sources, function(src) {
			return !isSourcesEqual(src, source);
		});
		// remove all client events from that source
		cache = $.grep(cache, function(e) {
			return !isSourcesEqual(e.source, source);
		});
		reportEvents(cache);
	}


	function isSourcesEqual(source1, source2) {
		return source1 && source2 && getSourcePrimitive(source1) == getSourcePrimitive(source2);
	}


	function getSourcePrimitive(source) {
		return (
			(typeof source === 'object') ? // a normalized event source?
				(source.origArray || source.googleCalendarId || source.url || source.events) : // get the primitive
				null
		) ||
		source; // the given argument *is* the primitive
	}
	
	
	
	/* Manipulation
	-----------------------------------------------------------------------------*/


	// Only ever called from the externally-facing API
	function updateEvent(event) {

		// massage start/end values, even if date string values
		event.start = t.moment(event.start);
		if (event.end) {
			event.end = t.moment(event.end);
		}
		else {
			event.end = null;
		}

		mutateEvent(event, getMiscEventProps(event)); // will handle start/end/allDay normalization
		reportEvents(cache); // reports event modifications (so we can redraw)
	}


	// Returns a hash of misc event properties that should be copied over to related events.
	function getMiscEventProps(event) {
		var props = {};

		$.each(event, function(name, val) {
			if (isMiscEventPropName(name)) {
				if (val !== undefined && isAtomic(val)) { // a defined non-object
					props[name] = val;
				}
			}
		});

		return props;
	}

	// non-date-related, non-id-related, non-secret
	function isMiscEventPropName(name) {
		return !/^_|^(id|allDay|start|end)$/.test(name);
	}

	
	// returns the expanded events that were created
	function renderEvent(eventInput, stick) {
		var abstractEvent = buildEventFromInput(eventInput);
		var events;
		var i, event;

		if (abstractEvent) { // not false (a valid input)
			events = expandEvent(abstractEvent);

			for (i = 0; i < events.length; i++) {
				event = events[i];

				if (!event.source) {
					if (stick) {
						stickySource.events.push(event);
						event.source = stickySource;
					}
					cache.push(event);
				}
			}

			reportEvents(cache);

			return events;
		}

		return [];
	}
	
	
	function removeEvents(filter) {
		var eventID;
		var i;

		if (filter == null) { // null or undefined. remove all events
			filter = function() { return true; }; // will always match
		}
		else if (!$.isFunction(filter)) { // an event ID
			eventID = filter + '';
			filter = function(event) {
				return event._id == eventID;
			};
		}

		// Purge event(s) from our local cache
		cache = $.grep(cache, filter, true); // inverse=true

		// Remove events from array sources.
		// This works because they have been converted to official Event Objects up front.
		// (and as a result, event._id has been calculated).
		for (i=0; i<sources.length; i++) {
			if ($.isArray(sources[i].events)) {
				sources[i].events = $.grep(sources[i].events, filter, true);
			}
		}

		reportEvents(cache);
	}
	
	
	function clientEvents(filter) {
		if ($.isFunction(filter)) {
			return $.grep(cache, filter);
		}
		else if (filter != null) { // not null, not undefined. an event ID
			filter += '';
			return $.grep(cache, function(e) {
				return e._id == filter;
			});
		}
		return cache; // else, return all
	}
	
	
	
	/* Loading State
	-----------------------------------------------------------------------------*/
	
	
	function pushLoading() {
		if (!(loadingLevel++)) {
			trigger('loading', null, true, getView());
		}
	}
	
	
	function popLoading() {
		if (!(--loadingLevel)) {
			trigger('loading', null, false, getView());
		}
	}
	
	
	
	/* Event Normalization
	-----------------------------------------------------------------------------*/


	// Given a raw object with key/value properties, returns an "abstract" Event object.
	// An "abstract" event is an event that, if recurring, will not have been expanded yet.
	// Will return `false` when input is invalid.
	// `source` is optional
	function buildEventFromInput(input, source) {
		var out = {};
		var start, end;
		var allDay;

		if (options.eventDataTransform) {
			input = options.eventDataTransform(input);
		}
		if (source && source.eventDataTransform) {
			input = source.eventDataTransform(input);
		}

		// Copy all properties over to the resulting object.
		// The special-case properties will be copied over afterwards.
		$.extend(out, input);

		if (source) {
			out.source = source;
		}

		out._id = input._id || (input.id === undefined ? '_fc' + eventGUID++ : input.id + '');

		if (input.className) {
			if (typeof input.className == 'string') {
				out.className = input.className.split(/\s+/);
			}
			else { // assumed to be an array
				out.className = input.className;
			}
		}
		else {
			out.className = [];
		}

		start = input.start || input.date; // "date" is an alias for "start"
		end = input.end;

		// parse as a time (Duration) if applicable
		if (isTimeString(start)) {
			start = moment.duration(start);
		}
		if (isTimeString(end)) {
			end = moment.duration(end);
		}

		if (input.dow || moment.isDuration(start) || moment.isDuration(end)) {

			// the event is "abstract" (recurring) so don't calculate exact start/end dates just yet
			out.start = start ? moment.duration(start) : null; // will be a Duration or null
			out.end = end ? moment.duration(end) : null; // will be a Duration or null
			out._recurring = true; // our internal marker
		}
		else {

			if (start) {
				start = t.moment(start);
				if (!start.isValid()) {
					return false;
				}
			}

			if (end) {
				end = t.moment(end);
				if (!end.isValid()) {
					end = null; // let defaults take over
				}
			}

			allDay = input.allDay;
			if (allDay === undefined) { // still undefined? fallback to default
				allDay = firstDefined(
					source ? source.allDayDefault : undefined,
					options.allDayDefault
				);
				// still undefined? normalizeEventDateProps will calculate it
			}

			assignDatesToEvent(start, end, allDay, out);
		}

		return out;
	}


	// Normalizes and assigns the given dates to the given partially-formed event object.
	// NOTE: mutates the given start/end moments. does not make a copy.
	function assignDatesToEvent(start, end, allDay, event) {
		event.start = start;
		event.end = end;
		event.allDay = allDay;
		normalizeEventDateProps(event);
		backupEventDates(event);
	}


	// Ensures the allDay property exists.
	// Ensures the start/end dates are consistent with allDay and forceEventDuration.
	// Accepts an Event object, or a plain object with event-ish properties.
	// NOTE: Will modify the given object.
	function normalizeEventDateProps(props) {

		if (props.allDay == null) {
			props.allDay = !(props.start.hasTime() || (props.end && props.end.hasTime()));
		}

		if (props.allDay) {
			props.start.stripTime();
			if (props.end) {
				props.end.stripTime();
			}
		}
		else {
			if (!props.start.hasTime()) {
				props.start = t.rezoneDate(props.start); // will also give it a 00:00 time
			}
			if (props.end && !props.end.hasTime()) {
				props.end = t.rezoneDate(props.end); // will also give it a 00:00 time
			}
		}

		if (props.end && !props.end.isAfter(props.start)) {
			props.end = null;
		}

		if (!props.end) {
			if (options.forceEventDuration) {
				props.end = t.getDefaultEventEnd(props.allDay, props.start);
			}
			else {
				props.end = null;
			}
		}
	}


	// If `range` is a proper range with a start and end, returns the original object.
	// If missing an end, computes a new range with an end, computing it as if it were an event.
	// TODO: make this a part of the event -> eventRange system
	function ensureVisibleEventRange(range) {
		var allDay;

		if (!range.end) {

			allDay = range.allDay; // range might be more event-ish than we think
			if (allDay == null) {
				allDay = !range.start.hasTime();
			}

			range = {
				start: range.start,
				end: t.getDefaultEventEnd(allDay, range.start)
			};
		}
		return range;
	}


	// If the given event is a recurring event, break it down into an array of individual instances.
	// If not a recurring event, return an array with the single original event.
	// If given a falsy input (probably because of a failed buildEventFromInput call), returns an empty array.
	// HACK: can override the recurring window by providing custom rangeStart/rangeEnd (for businessHours).
	function expandEvent(abstractEvent, _rangeStart, _rangeEnd) {
		var events = [];
		var dowHash;
		var dow;
		var i;
		var date;
		var startTime, endTime;
		var start, end;
		var event;

		_rangeStart = _rangeStart || rangeStart;
		_rangeEnd = _rangeEnd || rangeEnd;

		if (abstractEvent) {
			if (abstractEvent._recurring) {

				// make a boolean hash as to whether the event occurs on each day-of-week
				if ((dow = abstractEvent.dow)) {
					dowHash = {};
					for (i = 0; i < dow.length; i++) {
						dowHash[dow[i]] = true;
					}
				}

				// iterate through every day in the current range
				date = _rangeStart.clone().stripTime(); // holds the date of the current day
				while (date.isBefore(_rangeEnd)) {

					if (!dowHash || dowHash[date.day()]) { // if everyday, or this particular day-of-week

						startTime = abstractEvent.start; // the stored start and end properties are times (Durations)
						endTime = abstractEvent.end; // "
						start = date.clone();
						end = null;

						if (startTime) {
							start = start.time(startTime);
						}
						if (endTime) {
							end = date.clone().time(endTime);
						}

						event = $.extend({}, abstractEvent); // make a copy of the original
						assignDatesToEvent(
							start, end,
							!startTime && !endTime, // allDay?
							event
						);
						events.push(event);
					}

					date.add(1, 'days');
				}
			}
			else {
				events.push(abstractEvent); // return the original event. will be a one-item array
			}
		}

		return events;
	}



	/* Event Modification Math
	-----------------------------------------------------------------------------------------*/


	// Modifies an event and all related events by applying the given properties.
	// Special date-diffing logic is used for manipulation of dates.
	// If `props` does not contain start/end dates, the updated values are assumed to be the event's current start/end.
	// All date comparisons are done against the event's pristine _start and _end dates.
	// Returns an object with delta information and a function to undo all operations.
	//
	function mutateEvent(event, props) {
		var miscProps = {};
		var clearEnd;
		var dateDelta;
		var durationDelta;
		var undoFunc;

		props = props || {};

		// ensure new date-related values to compare against
		if (!props.start) {
			props.start = event.start.clone();
		}
		if (props.end === undefined) {
			props.end = event.end ? event.end.clone() : null;
		}
		if (props.allDay == null) { // is null or undefined?
			props.allDay = event.allDay;
		}

		normalizeEventDateProps(props); // massages start/end/allDay

		// clear the end date if explicitly changed to null
		clearEnd = event._end !== null && props.end === null;

		// compute the delta for moving the start and end dates together
		if (props.allDay) {
			dateDelta = diffDay(props.start, event._start); // whole-day diff from start-of-day
		}
		else {
			dateDelta = diffDayTime(props.start, event._start);
		}

		// compute the delta for moving the end date (after applying dateDelta)
		if (!clearEnd && props.end) {
			durationDelta = diffDayTime(
				// new duration
				props.end,
				props.start
			).subtract(diffDayTime(
				// subtract old duration
				event._end || t.getDefaultEventEnd(event._allDay, event._start),
				event._start
			));
		}

		// gather all non-date-related properties
		$.each(props, function(name, val) {
			if (isMiscEventPropName(name)) {
				if (val !== undefined) {
					miscProps[name] = val;
				}
			}
		});

		// apply the operations to the event and all related events
		undoFunc = mutateEvents(
			clientEvents(event._id), // get events with this ID
			clearEnd,
			props.allDay,
			dateDelta,
			durationDelta,
			miscProps
		);

		return {
			dateDelta: dateDelta,
			durationDelta: durationDelta,
			undo: undoFunc
		};
	}


	// Modifies an array of events in the following ways (operations are in order):
	// - clear the event's `end`
	// - convert the event to allDay
	// - add `dateDelta` to the start and end
	// - add `durationDelta` to the event's duration
	// - assign `miscProps` to the event
	//
	// Returns a function that can be called to undo all the operations.
	//
	// TODO: don't use so many closures. possible memory issues when lots of events with same ID.
	//
	function mutateEvents(events, clearEnd, allDay, dateDelta, durationDelta, miscProps) {
		var isAmbigTimezone = t.getIsAmbigTimezone();
		var undoFunctions = [];

		// normalize zero-length deltas to be null
		if (dateDelta && !dateDelta.valueOf()) { dateDelta = null; }
		if (durationDelta && !durationDelta.valueOf()) { durationDelta = null; }

		$.each(events, function(i, event) {
			var oldProps;
			var newProps;

			// build an object holding all the old values, both date-related and misc.
			// for the undo function.
			oldProps = {
				start: event.start.clone(),
				end: event.end ? event.end.clone() : null,
				allDay: event.allDay
			};
			$.each(miscProps, function(name) {
				oldProps[name] = event[name];
			});

			// new date-related properties. work off the original date snapshot.
			// ok to use references because they will be thrown away when backupEventDates is called.
			newProps = {
				start: event._start,
				end: event._end,
				allDay: event._allDay
			};

			if (clearEnd) {
				newProps.end = null;
			}

			newProps.allDay = allDay;

			normalizeEventDateProps(newProps); // massages start/end/allDay

			if (dateDelta) {
				newProps.start.add(dateDelta);
				if (newProps.end) {
					newProps.end.add(dateDelta);
				}
			}

			if (durationDelta) {
				if (!newProps.end) {
					newProps.end = t.getDefaultEventEnd(newProps.allDay, newProps.start);
				}
				newProps.end.add(durationDelta);
			}

			// if the dates have changed, and we know it is impossible to recompute the
			// timezone offsets, strip the zone.
			if (
				isAmbigTimezone &&
				!newProps.allDay &&
				(dateDelta || durationDelta)
			) {
				newProps.start.stripZone();
				if (newProps.end) {
					newProps.end.stripZone();
				}
			}

			$.extend(event, miscProps, newProps); // copy over misc props, then date-related props
			backupEventDates(event); // regenerate internal _start/_end/_allDay

			undoFunctions.push(function() {
				$.extend(event, oldProps);
				backupEventDates(event); // regenerate internal _start/_end/_allDay
			});
		});

		return function() {
			for (var i = 0; i < undoFunctions.length; i++) {
				undoFunctions[i]();
			}
		};
	}


	/* Business Hours
	-----------------------------------------------------------------------------------------*/

	t.getBusinessHoursEvents = getBusinessHoursEvents;


	// Returns an array of events as to when the business hours occur in the given view.
	// Abuse of our event system :(
	function getBusinessHoursEvents() {
		var optionVal = options.businessHours;
		var defaultVal = {
			className: 'fc-nonbusiness',
			start: '09:00',
			end: '17:00',
			dow: [ 1, 2, 3, 4, 5 ], // monday - friday
			rendering: 'inverse-background'
		};
		var view = t.getView();
		var eventInput;

		if (optionVal) {
			if (typeof optionVal === 'object') {
				// option value is an object that can override the default business hours
				eventInput = $.extend({}, defaultVal, optionVal);
			}
			else {
				// option value is `true`. use default business hours
				eventInput = defaultVal;
			}
		}

		if (eventInput) {
			return expandEvent(
				buildEventFromInput(eventInput),
				view.start,
				view.end
			);
		}

		return [];
	}


	/* Overlapping / Constraining
	-----------------------------------------------------------------------------------------*/

	t.isEventRangeAllowed = isEventRangeAllowed;
	t.isSelectionRangeAllowed = isSelectionRangeAllowed;
	t.isExternalDropRangeAllowed = isExternalDropRangeAllowed;


	function isEventRangeAllowed(range, event) {
		var source = event.source || {};
		var constraint = firstDefined(
			event.constraint,
			source.constraint,
			options.eventConstraint
		);
		var overlap = firstDefined(
			event.overlap,
			source.overlap,
			options.eventOverlap
		);

		range = ensureVisibleEventRange(range); // ensure a proper range with an end for isRangeAllowed

		return isRangeAllowed(range, constraint, overlap, event);
	}


	function isSelectionRangeAllowed(range) {
		return isRangeAllowed(range, options.selectConstraint, options.selectOverlap);
	}


	// when `eventProps` is defined, consider this an event.
	// `eventProps` can contain misc non-date-related info about the event.
	function isExternalDropRangeAllowed(range, eventProps) {
		var eventInput;
		var event;

		// note: very similar logic is in View's reportExternalDrop
		if (eventProps) {
			eventInput = $.extend({}, eventProps, range);
			event = expandEvent(buildEventFromInput(eventInput))[0];
		}

		if (event) {
			return isEventRangeAllowed(range, event);
		}
		else { // treat it as a selection

			range = ensureVisibleEventRange(range); // ensure a proper range with an end for isSelectionRangeAllowed

			return isSelectionRangeAllowed(range);
		}
	}


	// Returns true if the given range (caused by an event drop/resize or a selection) is allowed to exist
	// according to the constraint/overlap settings.
	// `event` is not required if checking a selection.
	function isRangeAllowed(range, constraint, overlap, event) {
		var constraintEvents;
		var anyContainment;
		var i, otherEvent;
		var otherOverlap;

		// normalize. fyi, we're normalizing in too many places :(
		range = {
			start: range.start.clone().stripZone(),
			end: range.end.clone().stripZone()
		};

		// the range must be fully contained by at least one of produced constraint events
		if (constraint != null) {

			// not treated as an event! intermediate data structure
			// TODO: use ranges in the future
			constraintEvents = constraintToEvents(constraint);

			anyContainment = false;
			for (i = 0; i < constraintEvents.length; i++) {
				if (eventContainsRange(constraintEvents[i], range)) {
					anyContainment = true;
					break;
				}
			}

			if (!anyContainment) {
				return false;
			}
		}

		for (i = 0; i < cache.length; i++) { // loop all events and detect overlap
			otherEvent = cache[i];

			// don't compare the event to itself or other related [repeating] events
			if (event && event._id === otherEvent._id) {
				continue;
			}

			// there needs to be an actual intersection before disallowing anything
			if (eventIntersectsRange(otherEvent, range)) {

				// evaluate overlap for the given range and short-circuit if necessary
				if (overlap === false) {
					return false;
				}
				else if (typeof overlap === 'function' && !overlap(otherEvent, event)) {
					return false;
				}

				// if we are computing if the given range is allowable for an event, consider the other event's
				// EventObject-specific or Source-specific `overlap` property
				if (event) {
					otherOverlap = firstDefined(
						otherEvent.overlap,
						(otherEvent.source || {}).overlap
						// we already considered the global `eventOverlap`
					);
					if (otherOverlap === false) {
						return false;
					}
					if (typeof otherOverlap === 'function' && !otherOverlap(event, otherEvent)) {
						return false;
					}
				}
			}
		}

		return true;
	}


	// Given an event input from the API, produces an array of event objects. Possible event inputs:
	// 'businessHours'
	// An event ID (number or string)
	// An object with specific start/end dates or a recurring event (like what businessHours accepts)
	function constraintToEvents(constraintInput) {

		if (constraintInput === 'businessHours') {
			return getBusinessHoursEvents();
		}

		if (typeof constraintInput === 'object') {
			return expandEvent(buildEventFromInput(constraintInput));
		}

		return clientEvents(constraintInput); // probably an ID
	}


	// Does the event's date range fully contain the given range?
	// start/end already assumed to have stripped zones :(
	function eventContainsRange(event, range) {
		var eventStart = event.start.clone().stripZone();
		var eventEnd = t.getEventEnd(event).stripZone();

		return range.start >= eventStart && range.end <= eventEnd;
	}


	// Does the event's date range intersect with the given range?
	// start/end already assumed to have stripped zones :(
	function eventIntersectsRange(event, range) {
		var eventStart = event.start.clone().stripZone();
		var eventEnd = t.getEventEnd(event).stripZone();

		return range.start < eventEnd && range.end > eventStart;
	}

}


// updates the "backup" properties, which are preserved in order to compute diffs later on.
function backupEventDates(event) {
	event._allDay = event.allDay;
	event._start = event.start.clone();
	event._end = event.end ? event.end.clone() : null;
}

    /* An abstract class for the "basic" views, as well as month view. Renders one or more rows of day cells.
----------------------------------------------------------------------------------------------------------------------*/
// It is a manager for a DayGrid subcomponent, which does most of the heavy lifting.
// It is responsible for managing width/height.

var BasicView = fcViews.basic = View.extend({

	dayGrid: null, // the main subcomponent that does most of the heavy lifting

	dayNumbersVisible: false, // display day numbers on each day cell?
	weekNumbersVisible: false, // display week numbers along the side?

	weekNumberWidth: null, // width of all the week-number cells running down the side

	headRowEl: null, // the fake row element of the day-of-week header


	initialize: function() {
		this.dayGrid = new DayGrid(this);
		this.coordMap = this.dayGrid.coordMap; // the view's date-to-cell mapping is identical to the subcomponent's
	},


	// Sets the display range and computes all necessary dates
	setRange: function(range) {
		View.prototype.setRange.call(this, range); // call the super-method

		this.dayGrid.breakOnWeeks = /year|month|week/.test(this.intervalUnit); // do before setRange
		this.dayGrid.setRange(range);
	},


	// Compute the value to feed into setRange. Overrides superclass.
	computeRange: function(date) {
		var range = View.prototype.computeRange.call(this, date); // get value from the super-method

		// year and month views should be aligned with weeks. this is already done for week
		if (/year|month/.test(range.intervalUnit)) {
			range.start.startOf('week');
			range.start = this.skipHiddenDays(range.start);

			// make end-of-week if not already
			if (range.end.weekday()) {
				range.end.add(1, 'week').startOf('week');
				range.end = this.skipHiddenDays(range.end, -1, true); // exclusively move backwards
			}
		}

		return range;
	},


	// Renders the view into `this.el`, which should already be assigned
	render: function() {

		this.dayNumbersVisible = this.dayGrid.rowCnt > 1; // TODO: make grid responsible
		this.weekNumbersVisible = this.opt('weekNumbers');
		this.dayGrid.numbersVisible = this.dayNumbersVisible || this.weekNumbersVisible;

		this.el.addClass('fc-basic-view').html(this.renderHtml());

		this.headRowEl = this.el.find('thead .fc-row');

		this.scrollerEl = this.el.find('.fc-day-grid-container');
		this.dayGrid.coordMap.containerEl = this.scrollerEl; // constrain clicks/etc to the dimensions of the scroller

		this.dayGrid.el = this.el.find('.fc-day-grid');
		this.dayGrid.render(this.hasRigidRows());
	},


	// Make subcomponents ready for cleanup
	destroy: function() {
		this.dayGrid.destroy();
		View.prototype.destroy.call(this); // call the super-method
	},


	// Builds the HTML skeleton for the view.
	// The day-grid component will render inside of a container defined by this HTML.
	renderHtml: function() {
		return '' +
			'<table>' +
				'<thead>' +
					'<tr>' +
						'<td class="' + this.widgetHeaderClass + '">' +
							this.dayGrid.headHtml() + // render the day-of-week headers
						'</td>' +
					'</tr>' +
				'</thead>' +
				'<tbody>' +
					'<tr>' +
						'<td class="' + this.widgetContentClass + '">' +
							'<div class="fc-day-grid-container">' +
								'<div class="fc-day-grid"/>' +
							'</div>' +
						'</td>' +
					'</tr>' +
				'</tbody>' +
			'</table>';
	},


	// Generates the HTML that will go before the day-of week header cells.
	// Queried by the DayGrid subcomponent when generating rows. Ordering depends on isRTL.
	headIntroHtml: function() {
		if (this.weekNumbersVisible) {
			return '' +
				'<th class="fc-week-number ' + this.widgetHeaderClass + '" ' + this.weekNumberStyleAttr() + '>' +
					'<span>' + // needed for matchCellWidths
						htmlEscape(this.opt('weekNumberTitle')) +
					'</span>' +
				'</th>';
		}
	},


	// Generates the HTML that will go before content-skeleton cells that display the day/week numbers.
	// Queried by the DayGrid subcomponent. Ordering depends on isRTL.
	numberIntroHtml: function(row) {
		if (this.weekNumbersVisible) {
			return '' +
				'<td class="fc-week-number" ' + this.weekNumberStyleAttr() + '>' +
					'<span>' + // needed for matchCellWidths
						this.calendar.calculateWeekNumber(this.dayGrid.getCell(row, 0).start) +
					'</span>' +
				'</td>';
		}
	},


	// Generates the HTML that goes before the day bg cells for each day-row.
	// Queried by the DayGrid subcomponent. Ordering depends on isRTL.
	dayIntroHtml: function() {
		if (this.weekNumbersVisible) {
			return '<td class="fc-week-number ' + this.widgetContentClass + '" ' +
				this.weekNumberStyleAttr() + '></td>';
		}
	},


	// Generates the HTML that goes before every other type of row generated by DayGrid. Ordering depends on isRTL.
	// Affects helper-skeleton and highlight-skeleton rows.
	introHtml: function() {
		if (this.weekNumbersVisible) {
			return '<td class="fc-week-number" ' + this.weekNumberStyleAttr() + '></td>';
		}
	},


	// Generates the HTML for the <td>s of the "number" row in the DayGrid's content skeleton.
	// The number row will only exist if either day numbers or week numbers are turned on.
	numberCellHtml: function(cell) {
		var date = cell.start;
		var classes;

		if (!this.dayNumbersVisible) { // if there are week numbers but not day numbers
			return '<td/>'; //  will create an empty space above events :(
		}

		classes = this.dayGrid.getDayClasses(date);
		classes.unshift('fc-day-number');

		return '' +
			'<td class="' + classes.join(' ') + '" data-date="' + date.format() + '">' +
				date.date() +
			'</td>';
	},


	// Generates an HTML attribute string for setting the width of the week number column, if it is known
	weekNumberStyleAttr: function() {
		if (this.weekNumberWidth !== null) {
			return 'style="width:' + this.weekNumberWidth + 'px"';
		}
		return '';
	},


	// Determines whether each row should have a constant height
	hasRigidRows: function() {
		var eventLimit = this.opt('eventLimit');
		return eventLimit && typeof eventLimit !== 'number';
	},


	/* Dimensions
	------------------------------------------------------------------------------------------------------------------*/


	// Refreshes the horizontal dimensions of the view
	updateWidth: function() {
		if (this.weekNumbersVisible) {
			// Make sure all week number cells running down the side have the same width.
			// Record the width for cells created later.
			this.weekNumberWidth = matchCellWidths(
				this.el.find('.fc-week-number')
			);
		}
	},


	// Adjusts the vertical dimensions of the view to the specified values
	setHeight: function(totalHeight, isAuto) {
		var eventLimit = this.opt('eventLimit');
		var scrollerHeight;

		// reset all heights to be natural
		unsetScroller(this.scrollerEl);
		uncompensateScroll(this.headRowEl);

		this.dayGrid.destroySegPopover(); // kill the "more" popover if displayed

		// is the event limit a constant level number?
		if (eventLimit && typeof eventLimit === 'number') {
			this.dayGrid.limitRows(eventLimit); // limit the levels first so the height can redistribute after
		}

		scrollerHeight = this.computeScrollerHeight(totalHeight);
		this.setGridHeight(scrollerHeight, isAuto);

		// is the event limit dynamically calculated?
		if (eventLimit && typeof eventLimit !== 'number') {
			this.dayGrid.limitRows(eventLimit); // limit the levels after the grid's row heights have been set
		}

		if (!isAuto && setPotentialScroller(this.scrollerEl, scrollerHeight)) { // using scrollbars?

			compensateScroll(this.headRowEl, getScrollbarWidths(this.scrollerEl));

			// doing the scrollbar compensation might have created text overflow which created more height. redo
			scrollerHeight = this.computeScrollerHeight(totalHeight);
			this.scrollerEl.height(scrollerHeight);

			this.restoreScroll();
		}
	},


	// Sets the height of just the DayGrid component in this view
	setGridHeight: function(height, isAuto) {
		if (isAuto) {
			undistributeHeight(this.dayGrid.rowEls); // let the rows be their natural height with no expanding
		}
		else {
			distributeHeight(this.dayGrid.rowEls, height, true); // true = compensate for height-hogging rows
		}
	},


	/* Events
	------------------------------------------------------------------------------------------------------------------*/


	// Renders the given events onto the view and populates the segments array
	renderEvents: function(events) {
		this.dayGrid.renderEvents(events);

		this.updateHeight(); // must compensate for events that overflow the row
	},


	// Retrieves all segment objects that are rendered in the view
	getEventSegs: function() {
		return this.dayGrid.getEventSegs();
	},


	// Unrenders all event elements and clears internal segment data
	destroyEvents: function() {
		this.recordScroll(); // removing events will reduce height and mess with the scroll, so record beforehand
		this.dayGrid.destroyEvents();

		// we DON'T need to call updateHeight() because:
		// A) a renderEvents() call always happens after this, which will eventually call updateHeight()
		// B) in IE8, this causes a flash whenever events are rerendered
	},


	/* Dragging (for both events and external elements)
	------------------------------------------------------------------------------------------------------------------*/


	// A returned value of `true` signals that a mock "helper" event has been rendered.
	renderDrag: function(dropLocation, seg) {
		return this.dayGrid.renderDrag(dropLocation, seg);
	},


	destroyDrag: function() {
		this.dayGrid.destroyDrag();
	},


	/* Selection
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a visual indication of a selection
	renderSelection: function(range) {
		this.dayGrid.renderSelection(range);
	},


	// Unrenders a visual indications of a selection
	destroySelection: function() {
		this.dayGrid.destroySelection();
	}

});

    /* A month view with day cells running in rows (one-per-week) and columns
----------------------------------------------------------------------------------------------------------------------*/

setDefaults({
	fixedWeekCount: true
});

var MonthView = fcViews.month = BasicView.extend({

	// Produces information about what range to display
	computeRange: function(date) {
		var range = BasicView.prototype.computeRange.call(this, date); // get value from super-method

		if (this.isFixedWeeks()) {
			// ensure 6 weeks
			range.end.add(
				6 - range.end.diff(range.start, 'weeks'),
				'weeks'
			);
		}

		return range;
	},


	// Overrides the default BasicView behavior to have special multi-week auto-height logic
	setGridHeight: function(height, isAuto) {

		isAuto = isAuto || this.opt('weekMode') === 'variable'; // LEGACY: weekMode is deprecated

		// if auto, make the height of each row the height that it would be if there were 6 weeks
		if (isAuto) {
			height *= this.rowCnt / 6;
		}

		distributeHeight(this.dayGrid.rowEls, height, !isAuto); // if auto, don't compensate for height-hogging rows
	},


	isFixedWeeks: function() {
		var weekMode = this.opt('weekMode'); // LEGACY: weekMode is deprecated
		if (weekMode) {
			return weekMode === 'fixed'; // if any other type of weekMode, assume NOT fixed
		}

		return this.opt('fixedWeekCount');
	}

});

MonthView.duration = { months: 1 };

    /* A week view with simple day cells running horizontally
----------------------------------------------------------------------------------------------------------------------*/

fcViews.basicWeek = {
	type: 'basic',
	duration: { weeks: 1 }
};
    /* A view with a single simple day cell
----------------------------------------------------------------------------------------------------------------------*/

fcViews.basicDay = {
	type: 'basic',
	duration: { days: 1 }
};
    /* An abstract class for all agenda-related views. Displays one more columns with time slots running vertically.
----------------------------------------------------------------------------------------------------------------------*/
// Is a manager for the TimeGrid subcomponent and possibly the DayGrid subcomponent (if allDaySlot is on).
// Responsible for managing width/height.

setDefaults({
	allDaySlot: true,
	allDayText: 'all-day',
	scrollTime: '06:00:00',
	slotDuration: '00:30:00',
	minTime: '00:00:00',
	maxTime: '24:00:00',
	slotEventOverlap: true
});

var AGENDA_ALL_DAY_EVENT_LIMIT = 5;

fcViews.agenda = View.extend({ // AgendaView

	timeGrid: null, // the main time-grid subcomponent of this view
	dayGrid: null, // the "all-day" subcomponent. if all-day is turned off, this will be null

	axisWidth: null, // the width of the time axis running down the side

	noScrollRowEls: null, // set of fake row elements that must compensate when scrollerEl has scrollbars

	// when the time-grid isn't tall enough to occupy the given height, we render an <hr> underneath
	bottomRuleEl: null,
	bottomRuleHeight: null,


	initialize: function() {
		this.timeGrid = new TimeGrid(this);

		if (this.opt('allDaySlot')) { // should we display the "all-day" area?
			this.dayGrid = new DayGrid(this); // the all-day subcomponent of this view

			// the coordinate grid will be a combination of both subcomponents' grids
			this.coordMap = new ComboCoordMap([
				this.dayGrid.coordMap,
				this.timeGrid.coordMap
			]);
		}
		else {
			this.coordMap = this.timeGrid.coordMap;
		}
	},


	/* Rendering
	------------------------------------------------------------------------------------------------------------------*/


	// Sets the display range and computes all necessary dates
	setRange: function(range) {
		View.prototype.setRange.call(this, range); // call the super-method

		this.timeGrid.setRange(range);
		if (this.dayGrid) {
			this.dayGrid.setRange(range);
		}
	},


	// Renders the view into `this.el`, which has already been assigned
	render: function() {

		this.el.addClass('fc-agenda-view').html(this.renderHtml());

		// the element that wraps the time-grid that will probably scroll
		this.scrollerEl = this.el.find('.fc-time-grid-container');
		this.timeGrid.coordMap.containerEl = this.scrollerEl; // don't accept clicks/etc outside of this

		this.timeGrid.el = this.el.find('.fc-time-grid');
		this.timeGrid.render();

		// the <hr> that sometimes displays under the time-grid
		this.bottomRuleEl = $('<hr class="' + this.widgetHeaderClass + '"/>')
			.appendTo(this.timeGrid.el); // inject it into the time-grid

		if (this.dayGrid) {
			this.dayGrid.el = this.el.find('.fc-day-grid');
			this.dayGrid.render();

			// have the day-grid extend it's coordinate area over the <hr> dividing the two grids
			this.dayGrid.bottomCoordPadding = this.dayGrid.el.next('hr').outerHeight();
		}

		this.noScrollRowEls = this.el.find('.fc-row:not(.fc-scroller *)'); // fake rows not within the scroller
	},


	// Make subcomponents ready for cleanup
	destroy: function() {
		this.timeGrid.destroy();
		if (this.dayGrid) {
			this.dayGrid.destroy();
		}
		View.prototype.destroy.call(this); // call the super-method
	},


	// Builds the HTML skeleton for the view.
	// The day-grid and time-grid components will render inside containers defined by this HTML.
	renderHtml: function() {
		return '' +
			'<table>' +
				'<thead>' +
					'<tr>' +
						'<td class="' + this.widgetHeaderClass + '">' +
							this.timeGrid.headHtml() + // render the day-of-week headers
						'</td>' +
					'</tr>' +
				'</thead>' +
				'<tbody>' +
					'<tr>' +
						'<td class="' + this.widgetContentClass + '">' +
							(this.dayGrid ?
								'<div class="fc-day-grid"/>' +
								'<hr class="' + this.widgetHeaderClass + '"/>' :
								''
								) +
							'<div class="fc-time-grid-container">' +
								'<div class="fc-time-grid"/>' +
							'</div>' +
						'</td>' +
					'</tr>' +
				'</tbody>' +
			'</table>';
	},


	// Generates the HTML that will go before the day-of week header cells.
	// Queried by the TimeGrid subcomponent when generating rows. Ordering depends on isRTL.
	headIntroHtml: function() {
		var date;
		var weekNumber;
		var weekTitle;
		var weekText;

		if (this.opt('weekNumbers')) {
			date = this.timeGrid.getCell(0).start;
			weekNumber = this.calendar.calculateWeekNumber(date);
			weekTitle = this.opt('weekNumberTitle');

			if (this.opt('isRTL')) {
				weekText = weekNumber + weekTitle;
			}
			else {
				weekText = weekTitle + weekNumber;
			}

			return '' +
				'<th class="fc-axis fc-week-number ' + this.widgetHeaderClass + '" ' + this.axisStyleAttr() + '>' +
					'<span>' + // needed for matchCellWidths
						htmlEscape(weekText) +
					'</span>' +
				'</th>';
		}
		else {
			return '<th class="fc-axis ' + this.widgetHeaderClass + '" ' + this.axisStyleAttr() + '></th>';
		}
	},


	// Generates the HTML that goes before the all-day cells.
	// Queried by the DayGrid subcomponent when generating rows. Ordering depends on isRTL.
	dayIntroHtml: function() {
		return '' +
			'<td class="fc-axis ' + this.widgetContentClass + '" ' + this.axisStyleAttr() + '>' +
				'<span>' + // needed for matchCellWidths
					(this.opt('allDayHtml') || htmlEscape(this.opt('allDayText'))) +
				'</span>' +
			'</td>';
	},


	// Generates the HTML that goes before the bg of the TimeGrid slot area. Long vertical column.
	slotBgIntroHtml: function() {
		return '<td class="fc-axis ' + this.widgetContentClass + '" ' + this.axisStyleAttr() + '></td>';
	},


	// Generates the HTML that goes before all other types of cells.
	// Affects content-skeleton, helper-skeleton, highlight-skeleton for both the time-grid and day-grid.
	// Queried by the TimeGrid and DayGrid subcomponents when generating rows. Ordering depends on isRTL.
	introHtml: function() {
		return '<td class="fc-axis" ' + this.axisStyleAttr() + '></td>';
	},


	// Generates an HTML attribute string for setting the width of the axis, if it is known
	axisStyleAttr: function() {
		if (this.axisWidth !== null) {
			 return 'style="width:' + this.axisWidth + 'px"';
		}
		return '';
	},


	/* Dimensions
	------------------------------------------------------------------------------------------------------------------*/


	updateSize: function(isResize) {
		if (isResize) {
			this.timeGrid.resize();
		}
		View.prototype.updateSize.call(this, isResize);
	},


	// Refreshes the horizontal dimensions of the view
	updateWidth: function() {
		// make all axis cells line up, and record the width so newly created axis cells will have it
		this.axisWidth = matchCellWidths(this.el.find('.fc-axis'));
	},


	// Adjusts the vertical dimensions of the view to the specified values
	setHeight: function(totalHeight, isAuto) {
		var eventLimit;
		var scrollerHeight;

		if (this.bottomRuleHeight === null) {
			// calculate the height of the rule the very first time
			this.bottomRuleHeight = this.bottomRuleEl.outerHeight();
		}
		this.bottomRuleEl.hide(); // .show() will be called later if this <hr> is necessary

		// reset all dimensions back to the original state
		this.scrollerEl.css('overflow', '');
		unsetScroller(this.scrollerEl);
		uncompensateScroll(this.noScrollRowEls);

		// limit number of events in the all-day area
		if (this.dayGrid) {
			this.dayGrid.destroySegPopover(); // kill the "more" popover if displayed

			eventLimit = this.opt('eventLimit');
			if (eventLimit && typeof eventLimit !== 'number') {
				eventLimit = AGENDA_ALL_DAY_EVENT_LIMIT; // make sure "auto" goes to a real number
			}
			if (eventLimit) {
				this.dayGrid.limitRows(eventLimit);
			}
		}

		if (!isAuto) { // should we force dimensions of the scroll container, or let the contents be natural height?

			scrollerHeight = this.computeScrollerHeight(totalHeight);
			if (setPotentialScroller(this.scrollerEl, scrollerHeight)) { // using scrollbars?

				// make the all-day and header rows lines up
				compensateScroll(this.noScrollRowEls, getScrollbarWidths(this.scrollerEl));

				// the scrollbar compensation might have changed text flow, which might affect height, so recalculate
				// and reapply the desired height to the scroller.
				scrollerHeight = this.computeScrollerHeight(totalHeight);
				this.scrollerEl.height(scrollerHeight);

				this.restoreScroll();
			}
			else { // no scrollbars
				// still, force a height and display the bottom rule (marks the end of day)
				this.scrollerEl.height(scrollerHeight).css('overflow', 'hidden'); // in case <hr> goes outside
				this.bottomRuleEl.show();
			}
		}
	},


	// Sets the scroll value of the scroller to the initial pre-configured state prior to allowing the user to change it
	initializeScroll: function() {
		var _this = this;
		var scrollTime = moment.duration(this.opt('scrollTime'));
		var top = this.timeGrid.computeTimeTop(scrollTime);

		// zoom can give weird floating-point values. rather scroll a little bit further
		top = Math.ceil(top);

		if (top) {
			top++; // to overcome top border that slots beyond the first have. looks better
		}

		function scroll() {
			_this.scrollerEl.scrollTop(top);
		}

		scroll();
		setTimeout(scroll, 0); // overrides any previous scroll state made by the browser
	},


	/* Events
	------------------------------------------------------------------------------------------------------------------*/


	// Renders events onto the view and populates the View's segment array
	renderEvents: function(events) {
		var dayEvents = [];
		var timedEvents = [];
		var daySegs = [];
		var timedSegs;
		var i;

		// separate the events into all-day and timed
		for (i = 0; i < events.length; i++) {
			if (events[i].allDay) {
				dayEvents.push(events[i]);
			}
			else {
				timedEvents.push(events[i]);
			}
		}

		// render the events in the subcomponents
		timedSegs = this.timeGrid.renderEvents(timedEvents);
		if (this.dayGrid) {
			daySegs = this.dayGrid.renderEvents(dayEvents);
		}

		// the all-day area is flexible and might have a lot of events, so shift the height
		this.updateHeight();
	},


	// Retrieves all segment objects that are rendered in the view
	getEventSegs: function() {
		return this.timeGrid.getEventSegs().concat(
			this.dayGrid ? this.dayGrid.getEventSegs() : []
		);
	},


	// Unrenders all event elements and clears internal segment data
	destroyEvents: function() {

		// if destroyEvents is being called as part of an event rerender, renderEvents will be called shortly
		// after, so remember what the scroll value was so we can restore it.
		this.recordScroll();

		// destroy the events in the subcomponents
		this.timeGrid.destroyEvents();
		if (this.dayGrid) {
			this.dayGrid.destroyEvents();
		}

		// we DON'T need to call updateHeight() because:
		// A) a renderEvents() call always happens after this, which will eventually call updateHeight()
		// B) in IE8, this causes a flash whenever events are rerendered
	},


	/* Dragging (for events and external elements)
	------------------------------------------------------------------------------------------------------------------*/


	// A returned value of `true` signals that a mock "helper" event has been rendered.
	renderDrag: function(dropLocation, seg) {
		if (dropLocation.start.hasTime()) {
			return this.timeGrid.renderDrag(dropLocation, seg);
		}
		else if (this.dayGrid) {
			return this.dayGrid.renderDrag(dropLocation, seg);
		}
	},


	destroyDrag: function() {
		this.timeGrid.destroyDrag();
		if (this.dayGrid) {
			this.dayGrid.destroyDrag();
		}
	},


	/* Selection
	------------------------------------------------------------------------------------------------------------------*/


	// Renders a visual indication of a selection
	renderSelection: function(range) {
		if (range.start.hasTime() || range.end.hasTime()) {
			this.timeGrid.renderSelection(range);
		}
		else if (this.dayGrid) {
			this.dayGrid.renderSelection(range);
		}
	},


	// Unrenders a visual indications of a selection
	destroySelection: function() {
		this.timeGrid.destroySelection();
		if (this.dayGrid) {
			this.dayGrid.destroySelection();
		}
	}

});

    /* A week view with an all-day cell area at the top, and a time grid below
----------------------------------------------------------------------------------------------------------------------*/

fcViews.agendaWeek = {
	type: 'agenda',
	duration: { weeks: 1 }
};
    /* A day view with an all-day cell area at the top, and a time grid below
----------------------------------------------------------------------------------------------------------------------*/

fcViews.agendaDay = {
	type: 'agenda',
	duration: { days: 1 }
};
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZ1bGxjYWxlbmRhci5qcyJdLCJuYW1lcyI6WyJmYWN0b3J5IiwiZGVmaW5lIiwiYW1kIiwialF1ZXJ5IiwibW9tZW50IiwiJCIsInNldERlZmF1bHRzIiwiZCIsIm1lcmdlT3B0aW9ucyIsImRlZmF1bHRzIiwidGFyZ2V0IiwibWVyZ2VJbnRvVGFyZ2V0IiwibmFtZSIsInZhbHVlIiwiaXNQbGFpbk9iamVjdCIsImlzRm9yY2VkQXRvbWljT3B0aW9uIiwidW5kZWZpbmVkIiwiaSIsImFyZ3VtZW50cyIsImxlbmd0aCIsImVhY2giLCJ0ZXN0IiwiZ2V0TW9tZW50TG9jYWxlRGF0YSIsImxhbmdDb2RlIiwiZnVuYyIsImxvY2FsZURhdGEiLCJsYW5nRGF0YSIsImNhbGwiLCJjb21wZW5zYXRlU2Nyb2xsIiwicm93RWxzIiwic2Nyb2xsYmFyV2lkdGhzIiwibGVmdCIsImNzcyIsImJvcmRlci1sZWZ0LXdpZHRoIiwibWFyZ2luLWxlZnQiLCJyaWdodCIsImJvcmRlci1yaWdodC13aWR0aCIsIm1hcmdpbi1yaWdodCIsInVuY29tcGVuc2F0ZVNjcm9sbCIsImRpc2FibGVDdXJzb3IiLCJhZGRDbGFzcyIsImVuYWJsZUN1cnNvciIsInJlbW92ZUNsYXNzIiwiZGlzdHJpYnV0ZUhlaWdodCIsImVscyIsImF2YWlsYWJsZUhlaWdodCIsInNob3VsZFJlZGlzdHJpYnV0ZSIsIm1pbk9mZnNldDEiLCJNYXRoIiwiZmxvb3IiLCJtaW5PZmZzZXQyIiwiZmxleEVscyIsImZsZXhPZmZzZXRzIiwiZmxleEhlaWdodHMiLCJ1c2VkSGVpZ2h0IiwidW5kaXN0cmlidXRlSGVpZ2h0IiwiZWwiLCJtaW5PZmZzZXQiLCJuYXR1cmFsT2Zmc2V0Iiwib3V0ZXJIZWlnaHQiLCJwdXNoIiwiaGVpZ2h0IiwibmF0dXJhbEhlaWdodCIsIm5ld0hlaWdodCIsIm1hdGNoQ2VsbFdpZHRocyIsIm1heElubmVyV2lkdGgiLCJmaW5kIiwiaW5uZXJFbCIsImlubmVyV2lkdGgiLCJvdXRlcldpZHRoIiwid2lkdGgiLCJzZXRQb3RlbnRpYWxTY3JvbGxlciIsImNvbnRhaW5lckVsIiwic2Nyb2xsSGVpZ2h0IiwiY2xpZW50SGVpZ2h0IiwidW5zZXRTY3JvbGxlciIsImdldFNjcm9sbFBhcmVudCIsInBvc2l0aW9uIiwic2Nyb2xsUGFyZW50IiwicGFyZW50cyIsImZpbHRlciIsInBhcmVudCIsInRoaXMiLCJlcSIsIm93bmVyRG9jdW1lbnQiLCJkb2N1bWVudCIsImdldFNjcm9sbGJhcldpZHRocyIsImNvbnRhaW5lciIsImNvbnRhaW5lckxlZnQiLCJvZmZzZXQiLCJjb250YWluZXJSaWdodCIsImlubmVyIiwiY2hpbGRyZW4iLCJpbm5lckxlZnQiLCJpbm5lclJpZ2h0IiwiaXNQcmltYXJ5TW91c2VCdXR0b24iLCJldiIsIndoaWNoIiwiY3RybEtleSIsImludGVyc2VjdGlvblRvU2VnIiwic3ViamVjdFJhbmdlIiwiY29uc3RyYWludFJhbmdlIiwic2VnU3RhcnQiLCJzZWdFbmQiLCJpc1N0YXJ0IiwiaXNFbmQiLCJzdWJqZWN0U3RhcnQiLCJzdGFydCIsInN1YmplY3RFbmQiLCJlbmQiLCJjb25zdHJhaW50U3RhcnQiLCJjb25zdHJhaW50RW5kIiwiY2xvbmUiLCJzbWFydFByb3BlcnR5Iiwib2JqIiwicmVzIiwicGFydHMiLCJzcGxpdCIsInRvTG93ZXJDYXNlIiwiZGlmZkRheVRpbWUiLCJhIiwiYiIsImR1cmF0aW9uIiwiZGF5cyIsInN0cmlwVGltZSIsImRpZmYiLCJtcyIsInRpbWUiLCJkaWZmRGF5IiwiY29tcHV0ZUludGVydmFsVW5pdCIsInVuaXQiLCJpbnRlcnZhbFVuaXRzIiwiY29tcHV0ZUludGVydmFsQXMiLCJ2YWwiLCJpc0R1cmF0aW9uIiwiYXMiLCJpc0ludCIsImlzTmF0aXZlRGF0ZSIsImlucHV0IiwiT2JqZWN0IiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJEYXRlIiwiaXNUaW1lU3RyaW5nIiwic3RyIiwiY3JlYXRlT2JqZWN0IiwicHJvdG8iLCJmIiwiY29weU93blByb3BzIiwic3JjIiwiZGVzdCIsImhhc093blByb3AiLCJoYXNPd25Qcm9wTWV0aG9kIiwiaXNBdG9taWMiLCJ0eXBlIiwiYXBwbHlBbGwiLCJmdW5jdGlvbnMiLCJ0aGlzT2JqIiwiYXJncyIsImlzRnVuY3Rpb24iLCJyZXQiLCJhcHBseSIsImZpcnN0RGVmaW5lZCIsImh0bWxFc2NhcGUiLCJzIiwicmVwbGFjZSIsInN0cmlwSHRtbEVudGl0aWVzIiwidGV4dCIsImNhcGl0YWxpc2VGaXJzdExldHRlciIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwic2xpY2UiLCJjb21wYXJlTnVtYmVycyIsIm4iLCJkZWJvdW5jZSIsIndhaXQiLCJ0aW1lb3V0SWQiLCJjb250ZXh0IiwidGltZXN0YW1wIiwibGF0ZXIiLCJsYXN0Iiwic2V0VGltZW91dCIsIm1ha2VNb21lbnQiLCJwYXJzZUFzVVRDIiwicGFyc2Vab25lIiwiaXNBbWJpZ1RpbWUiLCJpc0FtYmlnWm9uZSIsImFtYmlnTWF0Y2giLCJtb20iLCJpc1NpbmdsZVN0cmluZyIsImlzTW9tZW50IiwidHJhbnNmZXJBbWJpZ3MiLCJhbWJpZ0RhdGVPZk1vbnRoUmVnZXgiLCJhbWJpZ1RpbWVPclpvbmVSZWdleCIsImV4ZWMiLCJpc0FycmF5IiwidXRjIiwiX2FtYmlnVGltZSIsIl9hbWJpZ1pvbmUiLCJ6b25lIiwiX2Z1bGxDYWxlbmRhciIsImNvbW1vbmx5QW1iaWd1YXRlIiwiaW5wdXRzIiwicHJlc2VydmVUaW1lIiwiYW55QW1iaWdUaW1lIiwiYW55QW1iaWdab25lIiwibGVuIiwibW9tcyIsImZjIiwic3RyaXBab25lIiwic2V0TW9tZW50VmFsdWVzIiwieWVhciIsIm1vbnRoIiwiZGF0ZSIsImhvdXJzIiwibWludXRlcyIsInNlY29uZHMiLCJtaWxsaXNlY29uZHMiLCJvbGRNb21lbnRGb3JtYXQiLCJmb3JtYXRTdHIiLCJvbGRNb21lbnRQcm90byIsImZvcm1hdCIsImZvcm1hdERhdGUiLCJmb3JtYXREYXRlV2l0aENodW5rcyIsImdldEZvcm1hdFN0cmluZ0NodW5rcyIsImNodW5rcyIsImZvcm1hdERhdGVXaXRoQ2h1bmsiLCJjaHVuayIsInRva2VuIiwibWF5YmVTdHIiLCJ0b2tlbk92ZXJyaWRlcyIsIm1heWJlIiwibWF0Y2giLCJmb3JtYXRSYW5nZSIsImRhdGUxIiwiZGF0ZTIiLCJzZXBhcmF0b3IiLCJpc1JUTCIsImxhbmciLCJsb25nRGF0ZUZvcm1hdCIsImZvcm1hdFJhbmdlV2l0aENodW5rcyIsImNodW5rU3RyIiwibGVmdEkiLCJyaWdodEkiLCJtaWRkbGVJIiwibGVmdFN0ciIsInJpZ2h0U3RyIiwibWlkZGxlU3RyMSIsIm1pZGRsZVN0cjIiLCJtaWRkbGVTdHIiLCJmb3JtYXRTaW1pbGFyQ2h1bmsiLCJzaW1pbGFyVW5pdE1hcCIsImlzU2FtZSIsImZvcm1hdFN0cmluZ0NodW5rQ2FjaGUiLCJjaHVua0Zvcm1hdFN0cmluZyIsImNodW5rZXIiLCJDbGFzcyIsImlzQ2VsbHNFcXVhbCIsImNlbGwxIiwiY2VsbDIiLCJncmlkIiwicm93IiwiY29sIiwiaXNCZ0V2ZW50IiwiZXZlbnQiLCJyZW5kZXJpbmciLCJnZXRFdmVudFJlbmRlcmluZyIsImlzSW52ZXJzZUJnRXZlbnQiLCJzb3VyY2UiLCJncm91cEV2ZW50c0J5SWQiLCJldmVudHMiLCJldmVudHNCeUlkIiwiX2lkIiwiY29tcGFyZU5vcm1hbFJhbmdlcyIsInJhbmdlMSIsInJhbmdlMiIsImV2ZW50U3RhcnRNUyIsImNvbXBhcmVTZWdzIiwic2VnMSIsInNlZzIiLCJldmVudER1cmF0aW9uTVMiLCJhbGxEYXkiLCJ0aXRsZSIsImxvY2FsZUNvbXBhcmUiLCJnZXREcmFnZ2VkRWxNZXRhIiwiZXZlbnRQcm9wcyIsInN0YXJ0VGltZSIsInN0aWNrIiwicHJlZml4IiwiZGF0YUF0dHJQcmVmaXgiLCJkYXRhIiwiZXh0ZW5kIiwiQm9vbGVhbiIsImlzRGF5U2VnQ29sbGlzaW9uIiwic2VnIiwib3RoZXJTZWdzIiwib3RoZXJTZWciLCJsZWZ0Q29sIiwicmlnaHRDb2wiLCJjb21wYXJlRGF5U2VnQ29scyIsInBsYWNlU2xvdFNlZ3MiLCJzZWdzIiwibGV2ZWxzIiwibGV2ZWwwIiwic29ydCIsImJ1aWxkU2xvdFNlZ0xldmVscyIsImNvbXB1dGVGb3J3YXJkU2xvdFNlZ3MiLCJjb21wdXRlU2xvdFNlZ1ByZXNzdXJlcyIsImNvbXB1dGVTbG90U2VnQ29vcmRzIiwiaiIsImNvbXB1dGVTbG90U2VnQ29sbGlzaW9ucyIsImxldmVsIiwiayIsImZvcndhcmRTZWdzIiwiZm9yd2FyZFNlZyIsImZvcndhcmRQcmVzc3VyZSIsIm1heCIsInNlcmllc0JhY2t3YXJkUHJlc3N1cmUiLCJzZXJpZXNCYWNrd2FyZENvb3JkIiwiZm9yd2FyZENvb3JkIiwiY29tcGFyZUZvcndhcmRTbG90U2VncyIsImJhY2t3YXJkQ29vcmQiLCJyZXN1bHRzIiwiaXNTbG90U2VnQ29sbGlzaW9uIiwiYm90dG9tIiwidG9wIiwiQ2FsZW5kYXIiLCJlbGVtZW50IiwiaW5zdGFuY2VPcHRpb25zIiwiaHVtYW5pemVEdXJhdGlvbiIsImxvY2FsZSIsIm9wdGlvbnMiLCJodW1hbml6ZSIsInJlbmRlciIsImluYyIsImNvbnRlbnQiLCJlbGVtZW50VmlzaWJsZSIsImNhbGNTaXplIiwicmVuZGVyVmlldyIsImluaXRpYWxSZW5kZXIiLCJ0bSIsInRoZW1lIiwicHJlcGVuZFRvIiwiaGVhZGVyIiwiSGVhZGVyIiwidCIsImhlYWRlckVsZW1lbnQiLCJwcmVwZW5kIiwiY2hhbmdlVmlldyIsImRlZmF1bHRWaWV3IiwiaGFuZGxlV2luZG93UmVzaXplIiwid2luZG93UmVzaXplUHJveHkiLCJ3aW5kb3dSZXNpemUiLCJ3aW5kb3dSZXNpemVEZWxheSIsIndpbmRvdyIsInJlc2l6ZSIsImRlc3Ryb3kiLCJjdXJyZW50VmlldyIsImRlc3Ryb3lWaWV3IiwicmVtb3ZlIiwidW5iaW5kIiwiaXMiLCJ2aWV3VHlwZSIsImRlbHRhIiwiaWdub3JlV2luZG93UmVzaXplIiwiZGVhY3RpdmF0ZUJ1dHRvbiIsImZyZWV6ZUNvbnRlbnRIZWlnaHQiLCJpbnN0YW50aWF0ZVZpZXciLCJhcHBlbmRUbyIsImFjdGl2YXRlQnV0dG9uIiwiY29tcHV0ZVByZXZEYXRlIiwiY29tcHV0ZU5leHREYXRlIiwiaXNXaXRoaW4iLCJpbnRlcnZhbFN0YXJ0IiwiaW50ZXJ2YWxFbmQiLCJzZXREYXRlIiwidW5mcmVlemVDb250ZW50SGVpZ2h0IiwidXBkYXRlVGl0bGUiLCJ1cGRhdGVUb2RheUJ1dHRvbiIsImdldEFuZFJlbmRlckV2ZW50cyIsInNwZWMiLCJnZXRWaWV3U3BlYyIsInJlcXVlc3RlZFZpZXdUeXBlIiwicHJvY2Vzc1NwZWNJbnB1dCIsInZpZXdDbGFzcyIsInZpZXdPcHRpb25zIiwiYnV0dG9uVGV4dCIsImFsbERlZmF1bHRCdXR0b25UZXh0IiwiZGVmYXVsdEJ1dHRvblRleHQiLCJhbGxCdXR0b25UZXh0IiwiaGFzaCIsInZpZXdzIiwidmlld09wdGlvbnNDaGFpbiIsInVuaXRJc1NpbmdsZSIsInZpZXdTcGVjQ2FjaGUiLCJmY1ZpZXdzIiwidW5zaGlmdCIsImNsYXNzIiwiaXNWYWxpZFZpZXdUeXBlIiwiZ2V0Vmlld0J1dHRvblRleHQiLCJ1cGRhdGVTaXplIiwic2hvdWxkUmVjYWxjIiwiX2NhbGNTaXplIiwic3VnZ2VzdGVkVmlld0hlaWdodCIsImNvbnRlbnRIZWlnaHQiLCJyb3VuZCIsImFzcGVjdFJhdGlvIiwidHJpZ2dlciIsIl9lbGVtZW50IiwicmVmZXRjaEV2ZW50cyIsImRlc3Ryb3lFdmVudHMiLCJmZXRjaEFuZFJlbmRlckV2ZW50cyIsInJlbmRlckV2ZW50cyIsImRlc3Ryb3lWaWV3RXZlbnRzIiwicmVuZGVyVmlld0V2ZW50cyIsImxhenlGZXRjaGluZyIsImlzRmV0Y2hOZWVkZWQiLCJmZXRjaEV2ZW50cyIsInJlcG9ydEV2ZW50cyIsIl9ldmVudHMiLCJyZXBvcnRFdmVudENoYW5nZSIsImNvbXB1dGVUaXRsZSIsIm5vdyIsImdldE5vdyIsImRpc2FibGVCdXR0b24iLCJlbmFibGVCdXR0b24iLCJzZWxlY3QiLCJoYXNUaW1lIiwiYWRkIiwiZGVmYXVsdFRpbWVkRXZlbnREdXJhdGlvbiIsImRlZmF1bHRBbGxEYXlFdmVudER1cmF0aW9uIiwidW5zZWxlY3QiLCJwcmV2IiwibmV4dCIsInByZXZZZWFyIiwibmV4dFllYXIiLCJ0b2RheSIsImdvdG9EYXRlIiwiZGF0ZUlucHV0IiwiaW5jcmVtZW50RGF0ZSIsInpvb21UbyIsIm5ld0RhdGUiLCJ2aWV3U3RyIiwiZ2V0Vmlld3NXaXRoQnV0dG9ucyIsImpvaW4iLCJSZWdFeHAiLCJnZXREYXRlIiwib3ZlcmZsb3ciLCJnZXRDYWxlbmRhciIsImdldFZpZXciLCJvcHRpb24iLCJBcnJheSIsImxhbmdPcHRpb25zIiwibGFuZ09wdGlvbkhhc2giLCJydGxEZWZhdWx0cyIsInJlcmVuZGVyRXZlbnRzIiwibW9udGhOYW1lcyIsIl9tb250aHMiLCJtb250aE5hbWVzU2hvcnQiLCJfbW9udGhzU2hvcnQiLCJkYXlOYW1lcyIsIl93ZWVrZGF5cyIsImRheU5hbWVzU2hvcnQiLCJfd2Vla2RheXNTaG9ydCIsImZpcnN0RGF5IiwiX3dlZWsiLCJkb3ciLCJ0aW1lem9uZSIsImxvY2FsIiwiX2xvY2FsZSIsIl9sYW5nIiwiZ2V0SXNBbWJpZ1RpbWV6b25lIiwicmV6b25lRGF0ZSIsInRvQXJyYXkiLCJjYWxjdWxhdGVXZWVrTnVtYmVyIiwiY2FsYyIsIndlZWtOdW1iZXJDYWxjdWxhdGlvbiIsIndlZWsiLCJpc29XZWVrIiwiZ2V0RXZlbnRFbmQiLCJnZXREZWZhdWx0RXZlbnRFbmQiLCJFdmVudE1hbmFnZXIiLCJkZWZhdWx0RGF0ZSIsImdldFN1Z2dlc3RlZFZpZXdIZWlnaHQiLCJpc0hlaWdodEF1dG8iLCJjYWxlbmRhciIsInNlY3Rpb25zIiwiYXBwZW5kIiwicmVuZGVyU2VjdGlvbiIsInNlY3Rpb25FbCIsImJ1dHRvblN0ciIsImdyb3VwRWwiLCJncm91cENoaWxkcmVuIiwiaXNPbmx5QnV0dG9ucyIsImJ1dHRvbk5hbWUiLCJidXR0b25DbGljayIsInRoZW1lSWNvbiIsIm5vcm1hbEljb24iLCJkZWZhdWx0VGV4dCIsInZpZXdUZXh0IiwiY3VzdG9tVGV4dCIsImlubmVySHRtbCIsImNsYXNzZXMiLCJidXR0b24iLCJ2aWV3c1dpdGhCdXR0b25zIiwidGhlbWVCdXR0b25JY29ucyIsImJ1dHRvbkljb25zIiwiY2xpY2siLCJoYXNDbGFzcyIsIm1vdXNlZG93biIsIm5vdCIsIm1vdXNldXAiLCJob3ZlciIsImZpcnN0IiwiYXR0ciIsInJlbW92ZUF0dHIiLCJyYW5nZVN0YXJ0IiwicmFuZ2VFbmQiLCJjYWNoZSIsImZldGNoSUQiLCJjdXJyZW50RmV0Y2hJRCIsInNvdXJjZXMiLCJwZW5kaW5nU291cmNlQ250IiwiZmV0Y2hFdmVudFNvdXJjZSIsIl9mZXRjaEV2ZW50U291cmNlIiwiZXZlbnRJbnB1dHMiLCJldmVudElucHV0IiwiYWJzdHJhY3RFdmVudCIsImlzQXJyYXlTb3VyY2UiLCJidWlsZEV2ZW50RnJvbUlucHV0IiwiZXhwYW5kRXZlbnQiLCJjYWxsYmFjayIsImZldGNoZXJzIiwic291cmNlRmV0Y2hlcnMiLCJwdXNoTG9hZGluZyIsInBvcExvYWRpbmciLCJ1cmwiLCJjdXN0b21EYXRhIiwic3VjY2VzcyIsImVycm9yIiwiY29tcGxldGUiLCJzdGFydFBhcmFtIiwiZW5kUGFyYW0iLCJ0aW1lem9uZVBhcmFtIiwiYWpheCIsImFqYXhEZWZhdWx0cyIsImFkZEV2ZW50U291cmNlIiwic291cmNlSW5wdXQiLCJidWlsZEV2ZW50U291cmNlIiwibm9ybWFsaXplcnMiLCJzb3VyY2VOb3JtYWxpemVycyIsImNsYXNzTmFtZSIsIm9yaWdBcnJheSIsIm1hcCIsInJlbW92ZUV2ZW50U291cmNlIiwiZ3JlcCIsImlzU291cmNlc0VxdWFsIiwiZSIsInNvdXJjZTEiLCJzb3VyY2UyIiwiZ2V0U291cmNlUHJpbWl0aXZlIiwiZ29vZ2xlQ2FsZW5kYXJJZCIsInVwZGF0ZUV2ZW50IiwibXV0YXRlRXZlbnQiLCJnZXRNaXNjRXZlbnRQcm9wcyIsInByb3BzIiwiaXNNaXNjRXZlbnRQcm9wTmFtZSIsInJlbmRlckV2ZW50Iiwic3RpY2t5U291cmNlIiwicmVtb3ZlRXZlbnRzIiwiZXZlbnRJRCIsImNsaWVudEV2ZW50cyIsImxvYWRpbmdMZXZlbCIsIm91dCIsImV2ZW50RGF0YVRyYW5zZm9ybSIsImlkIiwiZXZlbnRHVUlEIiwiX3JlY3VycmluZyIsImlzVmFsaWQiLCJhbGxEYXlEZWZhdWx0IiwiYXNzaWduRGF0ZXNUb0V2ZW50Iiwibm9ybWFsaXplRXZlbnREYXRlUHJvcHMiLCJiYWNrdXBFdmVudERhdGVzIiwiaXNBZnRlciIsImZvcmNlRXZlbnREdXJhdGlvbiIsImVuc3VyZVZpc2libGVFdmVudFJhbmdlIiwicmFuZ2UiLCJfcmFuZ2VTdGFydCIsIl9yYW5nZUVuZCIsImRvd0hhc2giLCJlbmRUaW1lIiwiaXNCZWZvcmUiLCJkYXkiLCJjbGVhckVuZCIsImRhdGVEZWx0YSIsImR1cmF0aW9uRGVsdGEiLCJ1bmRvRnVuYyIsIm1pc2NQcm9wcyIsIl9lbmQiLCJfc3RhcnQiLCJzdWJ0cmFjdCIsIl9hbGxEYXkiLCJtdXRhdGVFdmVudHMiLCJ1bmRvIiwiaXNBbWJpZ1RpbWV6b25lIiwidW5kb0Z1bmN0aW9ucyIsInZhbHVlT2YiLCJvbGRQcm9wcyIsIm5ld1Byb3BzIiwiZ2V0QnVzaW5lc3NIb3Vyc0V2ZW50cyIsIm9wdGlvblZhbCIsImJ1c2luZXNzSG91cnMiLCJkZWZhdWx0VmFsIiwidmlldyIsImlzRXZlbnRSYW5nZUFsbG93ZWQiLCJjb25zdHJhaW50IiwiZXZlbnRDb25zdHJhaW50Iiwib3ZlcmxhcCIsImV2ZW50T3ZlcmxhcCIsImlzUmFuZ2VBbGxvd2VkIiwiaXNTZWxlY3Rpb25SYW5nZUFsbG93ZWQiLCJzZWxlY3RDb25zdHJhaW50Iiwic2VsZWN0T3ZlcmxhcCIsImlzRXh0ZXJuYWxEcm9wUmFuZ2VBbGxvd2VkIiwiY29uc3RyYWludEV2ZW50cyIsImFueUNvbnRhaW5tZW50Iiwib3RoZXJFdmVudCIsIm90aGVyT3ZlcmxhcCIsImNvbnN0cmFpbnRUb0V2ZW50cyIsImV2ZW50Q29udGFpbnNSYW5nZSIsImV2ZW50SW50ZXJzZWN0c1JhbmdlIiwiY29uc3RyYWludElucHV0IiwiZXZlbnRTdGFydCIsImV2ZW50RW5kIiwiY29uY2F0IiwiZXZlbnRTb3VyY2VzIiwidGl0bGVSYW5nZVNlcGFyYXRvciIsIm1vbnRoWWVhckZvcm1hdCIsIm5leHREYXlUaHJlc2hvbGQiLCJjZW50ZXIiLCJ3ZWVrZW5kcyIsIndlZWtOdW1iZXJzIiwid2Vla051bWJlclRpdGxlIiwiZHJhZ09wYWNpdHkiLCJkcmFnUmV2ZXJ0RHVyYXRpb24iLCJkcmFnU2Nyb2xsIiwidW5zZWxlY3RBdXRvIiwiZHJvcEFjY2VwdCIsImV2ZW50TGltaXQiLCJldmVudExpbWl0VGV4dCIsImV2ZW50TGltaXRDbGljayIsImRheVBvcG92ZXJGb3JtYXQiLCJlbmdsaXNoRGVmYXVsdHMiLCJmdWxsQ2FsZW5kYXIiLCJ2ZXJzaW9uIiwiZm4iLCJzaW5nbGVSZXMiLCJyZW1vdmVEYXRhIiwibGFuZ3MiLCJkYXRlcGlja2VyTGFuZyIsImRwTGFuZ0NvZGUiLCJkcE9wdGlvbnMiLCJmY09wdGlvbnMiLCJ3ZWVrSGVhZGVyIiwiZHBDb21wdXRhYmxlT3B0aW9ucyIsImRhdGVwaWNrZXIiLCJyZWdpb25hbCIsImVuIiwibmV3RmNPcHRpb25zIiwibW9tT3B0aW9ucyIsIm1vbUNvbXB1dGFibGVPcHRpb25zIiwicHJldlRleHQiLCJuZXh0VGV4dCIsImN1cnJlbnRUZXh0Iiwic2hvd01vbnRoQWZ0ZXJZZWFyIiwieWVhclN1ZmZpeCIsImRheU9mTW9udGhGb3JtYXQiLCJzbWFsbFRpbWVGb3JtYXQiLCJleHRyYVNtYWxsVGltZUZvcm1hdCIsIm5vTWVyaWRpZW1UaW1lRm9ybWF0IiwiYWxsb3dWYWx1ZU9wdGltaXphdGlvbiIsInNldFVUQ1ZhbHVlcyIsInNldExvY2FsVmFsdWVzIiwiZGF5SURzIiwiaGFzT3duUHJvcGVydHkiLCJuZXdNb21lbnRQcm90byIsImRheUhvdXJzIiwiYXNEYXlzIiwid2FzQW1iaWdUaW1lIiwiaGFzWm9uZSIsInR6byIsIndhc0FtYmlnWm9uZSIsInRvSVNPU3RyaW5nIiwidW5pdHMiLCJtZXRob2ROYW1lIiwiX2QiLCJzZXRUaW1lIiwiVVRDIiwidXBkYXRlT2Zmc2V0IiwiVCIsIlkiLCJNIiwiRCIsIkEiLCJIIiwiaCIsIm0iLCJtZW1iZXJzIiwic3ViQ2xhc3MiLCJzdXBlckNsYXNzIiwiY29uc3RydWN0b3IiLCJtaXhpbiIsIlBvcG92ZXIiLCJpc0hpZGRlbiIsImRvY3VtZW50TW91c2Vkb3duUHJveHkiLCJtYXJnaW4iLCJzaG93IiwiaGlkZSIsIl90aGlzIiwicGFyZW50RWwiLCJvbiIsImF1dG9IaWRlIiwicHJveHkiLCJkb2N1bWVudE1vdXNlZG93biIsImNsb3Nlc3QiLCJvZmYiLCJ2aWV3cG9ydFRvcCIsInZpZXdwb3J0TGVmdCIsInZpZXdwb3J0T2Zmc2V0Iiwib3JpZ2luIiwib2Zmc2V0UGFyZW50Iiwid2luZG93RWwiLCJ2aWV3cG9ydEVsIiwic2Nyb2xsVG9wIiwic2Nyb2xsTGVmdCIsInZpZXdwb3J0Q29uc3RyYWluIiwibWluIiwiR3JpZENvb3JkTWFwIiwicm93Q29vcmRzIiwiY29sQ29vcmRzIiwibWluWCIsIm1heFgiLCJtaW5ZIiwibWF4WSIsImJ1aWxkIiwiY29tcHV0ZVJvd0Nvb3JkcyIsImNvbXB1dGVDb2xDb29yZHMiLCJjb21wdXRlQm91bmRzIiwiY2xlYXIiLCJnZXRDZWxsIiwieCIsInkiLCJjb29yZHMiLCJjZWxsIiwiaGl0Um93IiwiaGl0Q29sIiwiaW5Cb3VuZHMiLCJjb250YWluZXJPZmZzZXQiLCJDb21ib0Nvb3JkTWFwIiwiY29vcmRNYXBzIiwiRHJhZ0xpc3RlbmVyIiwiY29vcmRNYXAiLCJpc0xpc3RlbmluZyIsImlzRHJhZ2dpbmciLCJvcmlnQ2VsbCIsIm1vdXNlWDAiLCJtb3VzZVkwIiwibW91c2Vtb3ZlUHJveHkiLCJtb3VzZXVwUHJveHkiLCJzY3JvbGxFbCIsInNjcm9sbEJvdW5kcyIsInNjcm9sbFRvcFZlbCIsInNjcm9sbExlZnRWZWwiLCJzY3JvbGxJbnRlcnZhbElkIiwic2Nyb2xsSGFuZGxlclByb3h5Iiwic2Nyb2xsU2Vuc2l0aXZpdHkiLCJzY3JvbGxTcGVlZCIsInNjcm9sbEludGVydmFsTXMiLCJwcmV2ZW50RGVmYXVsdCIsInN0YXJ0TGlzdGVuaW5nIiwiZGlzdGFuY2UiLCJzdGFydERyYWciLCJzY3JvbGwiLCJjb21wdXRlQ29vcmRzIiwicGFnZVgiLCJwYWdlWSIsImNvbXB1dGVTY3JvbGxCb3VuZHMiLCJtb3VzZW1vdmUiLCJtaW5EaXN0YW5jZSIsImRpc3RhbmNlU3EiLCJwb3ciLCJkcmFnIiwiY2VsbE92ZXIiLCJjZWxsT3V0Iiwic3RvcERyYWciLCJzdG9wTGlzdGVuaW5nIiwic3RvcFNjcm9sbGluZyIsInRvcENsb3NlbmVzcyIsImJvdHRvbUNsb3NlbmVzcyIsImxlZnRDbG9zZW5lc3MiLCJyaWdodENsb3NlbmVzcyIsInNlbnNpdGl2aXR5IiwiYm91bmRzIiwidG9wVmVsIiwibGVmdFZlbCIsInNldFNjcm9sbFZlbCIsImNvbnN0cmFpblNjcm9sbFZlbCIsInNldEludGVydmFsIiwiY2xpZW50V2lkdGgiLCJzY3JvbGxXaWR0aCIsInNjcm9sbEludGVydmFsRnVuYyIsImZyYWMiLCJjbGVhckludGVydmFsIiwic2Nyb2xsSGFuZGxlciIsIk1vdXNlRm9sbG93ZXIiLCJzb3VyY2VFbCIsInRvcDAiLCJsZWZ0MCIsInRvcERlbHRhIiwibGVmdERlbHRhIiwiaXNGb2xsb3dpbmciLCJpc0FuaW1hdGluZyIsInVwZGF0ZVBvc2l0aW9uIiwic3RvcCIsInNob3VsZFJldmVydCIsImRlc3Ryb3lFbCIsInJldmVydER1cmF0aW9uIiwiYW5pbWF0ZSIsImdldEVsIiwidmlzaWJpbGl0eSIsImRpc3BsYXkiLCJvcGFjaXR5IiwiekluZGV4Iiwic291cmNlT2Zmc2V0IiwiUm93UmVuZGVyZXIiLCJjZWxsSHRtbCIsIm9wdCIsInJvd0h0bWwiLCJyb3dUeXBlIiwicmVuZGVyQ2VsbCIsImdldEh0bWxSZW5kZXJlciIsInJvd0NlbGxIdG1sIiwiY29sQ250IiwiYm9va2VuZENlbGxzIiwiY2VsbHMiLCJpbnRybyIsIm91dHJvIiwicHJlcGVuZEh0bWwiLCJhcHBlbmRIdG1sIiwicmVuZGVyZXJOYW1lIiwiZ2VuZXJhbE5hbWUiLCJzcGVjaWZpY05hbWUiLCJwcm92aWRlciIsInJlbmRlcmVyIiwiR3JpZCIsInJvd0NudCIsInJvd0RhdGEiLCJjb2xEYXRhIiwiZWxzQnlGaWxsIiwiZG9jdW1lbnREcmFnU3RhcnRQcm94eSIsImNvbEhlYWRGb3JtYXQiLCJldmVudFRpbWVGb3JtYXQiLCJkaXNwbGF5RXZlbnRFbmQiLCJiaW5kSGFuZGxlcnMiLCJ1bmJpbmRIYW5kbGVycyIsImNvbXB1dGVDb2xIZWFkRm9ybWF0IiwiY29tcHV0ZUV2ZW50VGltZUZvcm1hdCIsImNvbXB1dGVEaXNwbGF5RXZlbnRFbmQiLCJzZXRSYW5nZSIsInVwZGF0ZUNlbGxzIiwicmFuZ2VUb1NlZ3MiLCJnZXRSb3dEYXRhIiwiZ2V0Q29sRGF0YSIsImNvbXB1dGVDZWxsUmFuZ2UiLCJnZXRSb3dFbCIsImdldENvbEVsIiwiZ2V0Q2VsbERheUVsIiwiaXRlbSIsIml0ZW1zIiwiZGF5TW91c2Vkb3duIiwiYmluZFNlZ0hhbmRsZXJzIiwiZGF5Q2xpY2tDZWxsIiwic2VsZWN0aW9uUmFuZ2UiLCJpc1NlbGVjdGFibGUiLCJkcmFnTGlzdGVuZXIiLCJkcmFnU3RhcnQiLCJpc09yaWciLCJjb21wdXRlU2VsZWN0aW9uIiwicmVuZGVyU2VsZWN0aW9uIiwiZGVzdHJveVNlbGVjdGlvbiIsImxpc3RlblN0b3AiLCJyZXBvcnRTZWxlY3Rpb24iLCJyZW5kZXJSYW5nZUhlbHBlciIsInNvdXJjZVNlZyIsImZha2VFdmVudCIsImVkaXRhYmxlIiwicmVuZGVySGVscGVyIiwiZGVzdHJveUhlbHBlciIsInJlbmRlckhpZ2hsaWdodCIsImRlc3Ryb3lIaWdobGlnaHQiLCJmaXJzdENlbGwiLCJsYXN0Q2VsbCIsImRhdGVzIiwicmVuZGVyRmlsbCIsImRlc3Ryb3lGaWxsIiwiaGlnaGxpZ2h0U2VnQ2xhc3NlcyIsInJlbmRlckZpbGxTZWdFbHMiLCJzZWdFbE1ldGhvZCIsImh0bWwiLCJyZW5kZXJlZFNlZ3MiLCJmaWxsU2VnSHRtbCIsIm5vZGUiLCJmaWxsU2VnVGFnIiwiY2xhc3Nlc01ldGhvZCIsInN0eWxlc01ldGhvZCIsInN0eWxlcyIsImhlYWRIdG1sIiwid2lkZ2V0SGVhZGVyQ2xhc3MiLCJoZWFkQ2VsbEh0bWwiLCJiZ0NlbGxIdG1sIiwiZ2V0RGF5Q2xhc3NlcyIsIndpZGdldENvbnRlbnRDbGFzcyIsImhpZ2hsaWdodFN0YXRlQ2xhc3MiLCJtb3VzZWRPdmVyU2VnIiwiaXNEcmFnZ2luZ1NlZyIsImlzUmVzaXppbmdTZWciLCJldmVudHNUb1NlZ3MiLCJiZ1NlZ3MiLCJmZ1NlZ3MiLCJyZW5kZXJCZ1NlZ3MiLCJyZW5kZXJGZ1NlZ3MiLCJ0cmlnZ2VyU2VnTW91c2VvdXQiLCJkZXN0cm95RmdTZWdzIiwiZGVzdHJveUJnU2VncyIsImdldEV2ZW50U2VncyIsInJlbmRlckZnU2VnRWxzIiwiZGlzYWJsZVJlc2l6aW5nIiwiZmdTZWdIdG1sIiwicmVzb2x2ZUV2ZW50RWwiLCJiZ0V2ZW50U2VnRWwiLCJiZ0V2ZW50U2VnQ2xhc3NlcyIsImJnRXZlbnRTZWdTdHlsZXMiLCJldmVudENvbG9yIiwiY29sb3IiLCJzb3VyY2VDb2xvciIsIm9wdGlvbkNvbG9yIiwiYmFja2dyb3VuZENvbG9yIiwiYnVzaW5lc3NIb3Vyc1NlZ0NsYXNzZXMiLCJtb3VzZWVudGVyIiwidHJpZ2dlclNlZ01vdXNlb3ZlciIsIm1vdXNlbGVhdmUiLCJpc0V2ZW50UmVzaXphYmxlIiwic2VnUmVzaXplTW91c2Vkb3duIiwiaXNFdmVudERyYWdnYWJsZSIsInNlZ0RyYWdNb3VzZWRvd24iLCJkcm9wTG9jYXRpb24iLCJtb3VzZUZvbGxvd2VyIiwibGlzdGVuU3RhcnQiLCJoaWRlRXZlbnQiLCJjb21wdXRlRXZlbnREcm9wIiwicmVuZGVyRHJhZyIsImRlc3Ryb3lEcmFnIiwiZHJhZ1N0b3AiLCJzaG93RXZlbnQiLCJyZXBvcnRFdmVudERyb3AiLCJzdGFydENlbGwiLCJlbmRDZWxsIiwibmV3U3RhcnQiLCJuZXdFbmQiLCJuZXdBbGxEYXkiLCJkcmFnRW5kIiwiZG9jdW1lbnREcmFnU3RhcnQiLCJ1aSIsImFjY2VwdCIsInN0YXJ0RXh0ZXJuYWxEcmFnIiwibWV0YSIsImNvbXB1dGVFeHRlcm5hbERyb3AiLCJvbmUiLCJyZXBvcnRFeHRlcm5hbERyb3AiLCJkZXN0cm95RXZlbnRSZXNpemUiLCJvbGRFbmQiLCJyZW5kZXJFdmVudFJlc2l6ZSIsInJlcG9ydEV2ZW50UmVzaXplIiwiZ2V0RXZlbnRUaW1lVGV4dCIsImdldFNlZ0NsYXNzZXMiLCJpc0RyYWdnYWJsZSIsImlzUmVzaXphYmxlIiwiZ2V0RXZlbnRTa2luQ3NzIiwiYm9yZGVyQ29sb3IiLCJ0ZXh0Q29sb3IiLCJzdGF0ZW1lbnRzIiwicmFuZ2VUb1NlZ3NGdW5jIiwiZXZlbnRSYW5nZXMiLCJldmVudHNUb1JhbmdlcyIsImV2ZW50UmFuZ2VUb1NlZ3MiLCJyYW5nZXMiLCJldmVudEdyb3VwIiwiZXZlbnRzVG9JbnZlcnNlUmFuZ2VzIiwiZXZlbnRzVG9Ob3JtYWxSYW5nZXMiLCJub3JtYWxSYW5nZSIsInZpZXdTdGFydCIsInZpZXdFbmQiLCJub3JtYWxSYW5nZXMiLCJpbnZlcnNlUmFuZ2VzIiwiZXZlbnQwIiwiZXZlbnRSYW5nZSIsIkRheUdyaWQiLCJudW1iZXJzVmlzaWJsZSIsImJvdHRvbUNvb3JkUGFkZGluZyIsImJyZWFrT25XZWVrcyIsImNlbGxEYXRlcyIsImRheVRvQ2VsbE9mZnNldHMiLCJkYXlFbHMiLCJoZWxwZXJFbHMiLCJpc1JpZ2lkIiwiY2VsbENudCIsImRheVJvd0h0bWwiLCJkZXN0cm95U2VnUG9wb3ZlciIsImRheUNlbGxIdG1sIiwidXBkYXRlQ2VsbERhdGVzIiwiY2VpbCIsIm9mZnNldHMiLCJpc0hpZGRlbkRheSIsImluZGV4Iiwicm93Rmlyc3QiLCJyb3dMYXN0Iiwic2VnRmlyc3QiLCJzZWdMYXN0IiwiY29tcHV0ZURheVJhbmdlIiwiZGF0ZVRvQ2VsbE9mZnNldCIsInJvd1N0cnVjdHMiLCJoZWxwZXJOb2RlcyIsInJlbmRlclNlZ1Jvd3MiLCJyb3dOb2RlIiwic2tlbGV0b25Ub3AiLCJyb3dFbCIsInNrZWxldG9uRWwiLCJ0Ym9keUVsIiwibm9kZXMiLCJyZW5kZXJGaWxsUm93IiwidHJFbCIsInN0YXJ0Q29sIiwiZW5kQ29sIiwicG9wb3ZlclNlZ3MiLCJhbGxEYXlTZWdzIiwicm93U3RydWN0IiwicG9wIiwic2VnUm93cyIsImdyb3VwU2VnUm93cyIsInJlbmRlclNlZ1JvdyIsInRpdGxlSHRtbCIsInNraW5Dc3MiLCJ0aW1lSHRtbCIsInJvd1NlZ3MiLCJlbXB0eUNlbGxzVW50aWwiLCJ0ZCIsImxvbmVDZWxsTWF0cml4IiwicGFyc2VJbnQiLCJ0ciIsImNlbGxNYXRyaXgiLCJsZXZlbFNlZ3MiLCJzZWdMZXZlbHMiLCJidWlsZFNlZ0xldmVscyIsImxldmVsQ250IiwidGJvZHkiLCJzZWdNYXRyaXgiLCJzZWdQb3BvdmVyIiwibGltaXRSb3dzIiwibGV2ZWxMaW1pdCIsInJvd0xldmVsTGltaXQiLCJ1bmxpbWl0Um93IiwiY29tcHV0ZVJvd0xldmVsTGltaXQiLCJsaW1pdFJvdyIsInJvd0hlaWdodCIsInRyRWxzIiwic2Vnc0JlbG93IiwiZ2V0Q2VsbFNlZ3MiLCJtb3JlTGluayIsInJlbmRlck1vcmVMaW5rIiwibW9yZVdyYXAiLCJtb3JlTm9kZXMiLCJsaW1pdGVkTm9kZXMiLCJ0b3RhbFNlZ3NCZWxvdyIsImNvbFNlZ3NCZWxvdyIsInJvd3NwYW4iLCJzZWdNb3JlTm9kZXMiLCJtb3JlVGQiLCJnZXQiLCJhZnRlciIsIm1vcmVFbHMiLCJsaW1pdGVkRWxzIiwiaGlkZGVuU2VncyIsImdldE1vcmVMaW5rVGV4dCIsImNsaWNrT3B0aW9uIiwibW9yZUVsIiwiZGF5RWwiLCJhbGxTZWdzIiwicmVzbGljZWRBbGxTZWdzIiwicmVzbGljZURheVNlZ3MiLCJyZXNsaWNlZEhpZGRlblNlZ3MiLCJzaG93U2VnUG9wb3ZlciIsInRvcEVsIiwicmVuZGVyU2VnUG9wb3ZlckNvbnRlbnQiLCJpc1RoZW1lIiwic2VnQ29udGFpbmVyIiwiZGF5RGF0ZSIsImRheVN0YXJ0IiwiZGF5RW5kIiwiZGF5UmFuZ2UiLCJudW0iLCJzdGFydExldmVsIiwiVGltZUdyaWQiLCJzbG90RHVyYXRpb24iLCJzbmFwRHVyYXRpb24iLCJtaW5UaW1lIiwibWF4VGltZSIsImF4aXNGb3JtYXQiLCJzbGF0RWxzIiwic2xhdFRvcHMiLCJoZWxwZXJFbCIsImJ1c2luZXNzSG91clNlZ3MiLCJwcm9jZXNzT3B0aW9ucyIsInJlbmRlckh0bWwiLCJjb21wdXRlU2xhdFRvcHMiLCJyZW5kZXJCdXNpbmVzc0hvdXJzIiwic2xhdFJvd0h0bWwiLCJzbG90QmdDZWxsSHRtbCIsInNsb3REYXRlIiwiYXhpc0h0bWwiLCJzbG90Tm9ybWFsIiwiYXNNaW51dGVzIiwic2xvdFRpbWUiLCJheGlzU3R5bGVBdHRyIiwic2tpcEhpZGRlbkRheXMiLCJyZXZlcnNlIiwiY29tcHV0ZVNuYXBUaW1lIiwiY29sRGF0ZSIsImNvbFJhbmdlIiwidXBkYXRlU2VnVmVydGljYWxzIiwib3JpZ2luVG9wIiwiY29tcHV0ZVRpbWVUb3AiLCJjb21wdXRlRGF0ZVRvcCIsInN0YXJ0T2ZEYXlEYXRlIiwic2xhdEluZGV4Iiwic2xhdFJlbWFpbmRlciIsInNsYXRUb3AiLCJzbGF0Qm90dG9tIiwic2xhdENvdmVyYWdlIiwidG9wcyIsInRhYmxlRWwiLCJyZW5kZXJTZWdUYWJsZSIsInNlZ0NvbHMiLCJjb2xTZWdzIiwidGRFbCIsImdyb3VwU2VnQ29scyIsImV2ZW50U2tlbGV0b25FbCIsImNvbXB1dGVTZWdWZXJ0aWNhbHMiLCJnZW5lcmF0ZVNlZ1Bvc2l0aW9uQ3NzIiwiZ2VuZXJhdGVTZWdWZXJ0aWNhbENzcyIsInRpbWVUZXh0IiwiZnVsbFRpbWVUZXh0Iiwic3RhcnRUaW1lVGV4dCIsImlzTXVsdGlEYXlFdmVudCIsInNob3VsZE92ZXJsYXAiLCJWaWV3IiwiaW50ZXJ2YWxEdXJhdGlvbiIsImludGVydmFsVW5pdCIsImlzU2VsZWN0ZWQiLCJzY3JvbGxlckVsIiwiaXNIaWRkZW5EYXlIYXNoIiwiaW5pdFRoZW1pbmciLCJpbml0SGlkZGVuRGF5cyIsImluaXRpYWxpemUiLCJjb21wdXRlUmFuZ2UiLCJzdGFydE9mIiwiY29tcHV0ZVRpdGxlRm9ybWF0IiwiaW5pdGlhbGl6ZVNjcm9sbCIsImVtcHR5IiwiaXNSZXNpemUiLCJyZWNvcmRTY3JvbGwiLCJ1cGRhdGVIZWlnaHQiLCJ1cGRhdGVXaWR0aCIsInNldEhlaWdodCIsImlzQXV0byIsImNvbXB1dGVTY3JvbGxlckhlaWdodCIsInRvdGFsSGVpZ2h0IiwiYm90aCIsIm90aGVySGVpZ2h0IiwicmVzdG9yZVNjcm9sbCIsImV2ZW50U2VnRWFjaCIsImN1c3RvbSIsInN0YXJ0RWRpdGFibGUiLCJtdXRhdGVSZXN1bHQiLCJ0cmlnZ2VyRXZlbnREcm9wIiwidHJpZ2dlckV4dGVybmFsRHJvcCIsImR1cmF0aW9uRWRpdGFibGUiLCJ0cmlnZ2VyRXZlbnRSZXNpemUiLCJpZ25vcmUiLCJoaWRkZW5EYXlzIiwiZGF5Q250IiwiaW5BcnJheSIsImlzRXhjbHVzaXZlIiwiZW5kVGltZU1TIiwic3RhcnREYXkiLCJlbmREYXkiLCJkYXRhVHlwZSIsIkJhc2ljVmlldyIsImJhc2ljIiwiZGF5R3JpZCIsImRheU51bWJlcnNWaXNpYmxlIiwid2Vla051bWJlcnNWaXNpYmxlIiwid2Vla051bWJlcldpZHRoIiwiaGVhZFJvd0VsIiwid2Vla2RheSIsImhhc1JpZ2lkUm93cyIsImhlYWRJbnRyb0h0bWwiLCJ3ZWVrTnVtYmVyU3R5bGVBdHRyIiwibnVtYmVySW50cm9IdG1sIiwiZGF5SW50cm9IdG1sIiwiaW50cm9IdG1sIiwibnVtYmVyQ2VsbEh0bWwiLCJzY3JvbGxlckhlaWdodCIsInNldEdyaWRIZWlnaHQiLCJmaXhlZFdlZWtDb3VudCIsIk1vbnRoVmlldyIsImlzRml4ZWRXZWVrcyIsIndlZWtNb2RlIiwibW9udGhzIiwiYmFzaWNXZWVrIiwid2Vla3MiLCJiYXNpY0RheSIsImFsbERheVNsb3QiLCJhbGxEYXlUZXh0Iiwic2Nyb2xsVGltZSIsInNsb3RFdmVudE92ZXJsYXAiLCJBR0VOREFfQUxMX0RBWV9FVkVOVF9MSU1JVCIsImFnZW5kYSIsInRpbWVHcmlkIiwiYXhpc1dpZHRoIiwibm9TY3JvbGxSb3dFbHMiLCJib3R0b21SdWxlRWwiLCJib3R0b21SdWxlSGVpZ2h0Iiwid2Vla051bWJlciIsIndlZWtUaXRsZSIsIndlZWtUZXh0Iiwic2xvdEJnSW50cm9IdG1sIiwidGltZWRTZWdzIiwiZGF5RXZlbnRzIiwidGltZWRFdmVudHMiLCJkYXlTZWdzIiwiYWdlbmRhV2VlayIsImFnZW5kYURheSJdLCJtYXBwaW5ncyI6IkNBTUEsU0FBVUEsR0FDYSxrQkFBWEMsU0FBeUJBLE9BQU9DLElBQzFDRCxRQUFTLFNBQVUsVUFBWUQsR0FHL0JBLEVBQVFHLE9BQVFDLFNBRWYsU0FBU0MsRUFBR0QsR0F1SmYsUUFBU0UsR0FBWUMsR0FDcEJDLEVBQWFDLEdBQVVGLEdBVXhCLFFBQVNDLEdBQWFFLEdBRXJCLFFBQVNDLEdBQWdCQyxFQUFNQyxHQUMxQlIsRUFBRVMsY0FBY0QsSUFBVVIsRUFBRVMsY0FBY0osRUFBT0UsTUFBV0csRUFBcUJILEdBRXBGRixFQUFPRSxHQUFRSixLQUFpQkUsRUFBT0UsR0FBT0MsR0FFNUJHLFNBQVZILElBQ1JILEVBQU9FLEdBQVFDLEdBSWpCLElBQUssR0FBSUksR0FBRSxFQUFHQSxFQUFFQyxVQUFVQyxPQUFRRixJQUNqQ1osRUFBRWUsS0FBS0YsVUFBVUQsR0FBSU4sRUFHdEIsT0FBT0QsR0FLUixRQUFTSyxHQUFxQkgsR0FHN0IsTUFBTyxtQkFBbUJTLEtBQUtULEdBK0loQyxRQUFTVSxHQUFvQkMsR0FDNUIsR0FBSUMsR0FBT3BCLEVBQU9xQixZQUFjckIsRUFBT3NCLFFBQ3ZDLE9BQU9GLEdBQUtHLEtBQUt2QixFQUFRbUIsSUFDeEJDLEVBQUtHLEtBQUt2QixFQUFR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QixNQUFNZ1UsVUFDZnpWLEtBQUttb0MsU0FBU3JSLFdBQVdMLEVBQWNycEIsR0FFdENwTixLQUFLc21DLFFBQ050bUMsS0FBS3NtQyxRQUFReFAsV0FBV0wsRUFBY3JwQixHQUR6QyxRQU1OMnBCLFlBQWEsV0FDWi8yQixLQUFLbW9DLFNBQVNwUixjQUNWLzJCLEtBQUtzbUMsU0FDUnRtQyxLQUFLc21DLFFBQVF2UCxlQVVmekUsZ0JBQWlCLFNBQVM5UyxHQUNyQkEsRUFBTS9kLE1BQU1nVSxXQUFhK0osRUFBTTdkLElBQUk4VCxVQUN0Q3pWLEtBQUttb0MsU0FBUzdWLGdCQUFnQjlTLEdBRXRCeGYsS0FBS3NtQyxTQUNidG1DLEtBQUtzbUMsUUFBUWhVLGdCQUFnQjlTLElBTS9CK1MsaUJBQWtCLFdBQ2pCdnlCLEtBQUttb0MsU0FBUzVWLG1CQUNWdnlCLEtBQUtzbUMsU0FDUnRtQyxLQUFLc21DLFFBQVEvVCxzQkFTaEI5ZSxHQUFRdTFCLFlBQ1B4a0MsS0FBTSxTQUNOaEMsVUFBWW1sQyxNQUFPLElBS3BCbDBCLEdBQVF3MUIsV0FDUHprQyxLQUFNLFNBQ05oQyxVQUFZQyxLQUFNIiwiZmlsZSI6ImZ1bGxjYWxlbmRhci1kZWJ1Zy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogRnVsbENhbGVuZGFyIHYyLjIuNVxuICogRG9jcyAmIExpY2Vuc2U6IGh0dHA6Ly9hcnNoYXcuY29tL2Z1bGxjYWxlbmRhci9cbiAqIChjKSAyMDEzIEFkYW0gU2hhd1xuICovXG5cbihmdW5jdGlvbihmYWN0b3J5KSB7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoWyAnanF1ZXJ5JywgJ21vbWVudCcgXSwgZmFjdG9yeSk7XG5cdH1cblx0ZWxzZSB7XG5cdFx0ZmFjdG9yeShqUXVlcnksIG1vbWVudCk7XG5cdH1cbn0pKGZ1bmN0aW9uKCQsIG1vbWVudCkge1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuXG5cdHRpdGxlUmFuZ2VTZXBhcmF0b3I6ICcgXFx1MjAxNCAnLCAvLyBlbXBoYXNpemVkIGRhc2hcblx0bW9udGhZZWFyRm9ybWF0OiAnTU1NTSBZWVlZJywgLy8gcmVxdWlyZWQgZm9yIGVuLiBvdGhlciBsYW5ndWFnZXMgcmVseSBvbiBkYXRlcGlja2VyIGNvbXB1dGFibGUgb3B0aW9uXG5cblx0ZGVmYXVsdFRpbWVkRXZlbnREdXJhdGlvbjogJzAyOjAwOjAwJyxcblx0ZGVmYXVsdEFsbERheUV2ZW50RHVyYXRpb246IHsgZGF5czogMSB9LFxuXHRmb3JjZUV2ZW50RHVyYXRpb246IGZhbHNlLFxuXHRuZXh0RGF5VGhyZXNob2xkOiAnMDk6MDA6MDAnLCAvLyA5YW1cblxuXHQvLyBkaXNwbGF5XG5cdGRlZmF1bHRWaWV3OiAnbW9udGgnLFxuXHRhc3BlY3RSYXRpbzogMS4zNSxcblx0aGVhZGVyOiB7XG5cdFx0bGVmdDogJ3RpdGxlJyxcblx0XHRjZW50ZXI6ICcnLFxuXHRcdHJpZ2h0OiAndG9kYXkgcHJldixuZXh0J1xuXHR9LFxuXHR3ZWVrZW5kczogdHJ1ZSxcblx0d2Vla051bWJlcnM6IGZhbHNlLFxuXG5cdHdlZWtOdW1iZXJUaXRsZTogJ1cnLFxuXHR3ZWVrTnVtYmVyQ2FsY3VsYXRpb246ICdsb2NhbCcsXG5cdFxuXHQvL2VkaXRhYmxlOiBmYWxzZSxcblx0XG5cdC8vIGV2ZW50IGFqYXhcblx0bGF6eUZldGNoaW5nOiB0cnVlLFxuXHRzdGFydFBhcmFtOiAnc3RhcnQnLFxuXHRlbmRQYXJhbTogJ2VuZCcsXG5cdHRpbWV6b25lUGFyYW06ICd0aW1lem9uZScsXG5cblx0dGltZXpvbmU6IGZhbHNlLFxuXG5cdC8vYWxsRGF5RGVmYXVsdDogdW5kZWZpbmVkLFxuXG5cdC8vIGxvY2FsZVxuXHRpc1JUTDogZmFsc2UsXG5cdGRlZmF1bHRCdXR0b25UZXh0OiB7XG5cdFx0cHJldjogXCJwcmV2XCIsXG5cdFx0bmV4dDogXCJuZXh0XCIsXG5cdFx0cHJldlllYXI6IFwicHJldiB5ZWFyXCIsXG5cdFx0bmV4dFllYXI6IFwibmV4dCB5ZWFyXCIsXG5cdFx0dG9kYXk6ICd0b2RheScsXG5cdFx0bW9udGg6ICdtb250aCcsXG5cdFx0d2VlazogJ3dlZWsnLFxuXHRcdGRheTogJ2RheSdcblx0fSxcblxuXHRidXR0b25JY29uczoge1xuXHRcdHByZXY6ICdsZWZ0LXNpbmdsZS1hcnJvdycsXG5cdFx0bmV4dDogJ3JpZ2h0LXNpbmdsZS1hcnJvdycsXG5cdFx0cHJldlllYXI6ICdsZWZ0LWRvdWJsZS1hcnJvdycsXG5cdFx0bmV4dFllYXI6ICdyaWdodC1kb3VibGUtYXJyb3cnXG5cdH0sXG5cdFxuXHQvLyBqcXVlcnktdWkgdGhlbWluZ1xuXHR0aGVtZTogZmFsc2UsXG5cdHRoZW1lQnV0dG9uSWNvbnM6IHtcblx0XHRwcmV2OiAnY2lyY2xlLXRyaWFuZ2xlLXcnLFxuXHRcdG5leHQ6ICdjaXJjbGUtdHJpYW5nbGUtZScsXG5cdFx0cHJldlllYXI6ICdzZWVrLXByZXYnLFxuXHRcdG5leHRZZWFyOiAnc2Vlay1uZXh0J1xuXHR9LFxuXG5cdGRyYWdPcGFjaXR5OiAuNzUsXG5cdGRyYWdSZXZlcnREdXJhdGlvbjogNTAwLFxuXHRkcmFnU2Nyb2xsOiB0cnVlLFxuXHRcblx0Ly9zZWxlY3RhYmxlOiBmYWxzZSxcblx0dW5zZWxlY3RBdXRvOiB0cnVlLFxuXHRcblx0ZHJvcEFjY2VwdDogJyonLFxuXG5cdGV2ZW50TGltaXQ6IGZhbHNlLFxuXHRldmVudExpbWl0VGV4dDogJ21vcmUnLFxuXHRldmVudExpbWl0Q2xpY2s6ICdwb3BvdmVyJyxcblx0ZGF5UG9wb3ZlckZvcm1hdDogJ0xMJyxcblx0XG5cdGhhbmRsZVdpbmRvd1Jlc2l6ZTogdHJ1ZSxcblx0d2luZG93UmVzaXplRGVsYXk6IDIwMCAvLyBtaWxsaXNlY29uZHMgYmVmb3JlIGFuIHVwZGF0ZVNpemUgaGFwcGVuc1xuXHRcbn07XG5cblxudmFyIGVuZ2xpc2hEZWZhdWx0cyA9IHtcblx0ZGF5UG9wb3ZlckZvcm1hdDogJ2RkZGQsIE1NTU0gRCdcbn07XG5cblxuLy8gcmlnaHQtdG8tbGVmdCBkZWZhdWx0c1xudmFyIHJ0bERlZmF1bHRzID0ge1xuXHRoZWFkZXI6IHtcblx0XHRsZWZ0OiAnbmV4dCxwcmV2IHRvZGF5Jyxcblx0XHRjZW50ZXI6ICcnLFxuXHRcdHJpZ2h0OiAndGl0bGUnXG5cdH0sXG5cdGJ1dHRvbkljb25zOiB7XG5cdFx0cHJldjogJ3JpZ2h0LXNpbmdsZS1hcnJvdycsXG5cdFx0bmV4dDogJ2xlZnQtc2luZ2xlLWFycm93Jyxcblx0XHRwcmV2WWVhcjogJ3JpZ2h0LWRvdWJsZS1hcnJvdycsXG5cdFx0bmV4dFllYXI6ICdsZWZ0LWRvdWJsZS1hcnJvdydcblx0fSxcblx0dGhlbWVCdXR0b25JY29uczoge1xuXHRcdHByZXY6ICdjaXJjbGUtdHJpYW5nbGUtZScsXG5cdFx0bmV4dDogJ2NpcmNsZS10cmlhbmdsZS13Jyxcblx0XHRuZXh0WWVhcjogJ3NlZWstcHJldicsXG5cdFx0cHJldlllYXI6ICdzZWVrLW5leHQnXG5cdH1cbn07XG5cbiAgICB2YXIgZmMgPSAkLmZ1bGxDYWxlbmRhciA9IHsgdmVyc2lvbjogXCIyLjIuNVwiIH07XG52YXIgZmNWaWV3cyA9IGZjLnZpZXdzID0ge307XG5cblxuJC5mbi5mdWxsQ2FsZW5kYXIgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTsgLy8gZm9yIGEgcG9zc2libGUgbWV0aG9kIGNhbGxcblx0dmFyIHJlcyA9IHRoaXM7IC8vIHdoYXQgdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiAodGhpcyBqUXVlcnkgb2JqZWN0IGJ5IGRlZmF1bHQpXG5cblx0dGhpcy5lYWNoKGZ1bmN0aW9uKGksIF9lbGVtZW50KSB7IC8vIGxvb3AgZWFjaCBET00gZWxlbWVudCBpbnZvbHZlZFxuXHRcdHZhciBlbGVtZW50ID0gJChfZWxlbWVudCk7XG5cdFx0dmFyIGNhbGVuZGFyID0gZWxlbWVudC5kYXRhKCdmdWxsQ2FsZW5kYXInKTsgLy8gZ2V0IHRoZSBleGlzdGluZyBjYWxlbmRhciBvYmplY3QgKGlmIGFueSlcblx0XHR2YXIgc2luZ2xlUmVzOyAvLyB0aGUgcmV0dXJuZWQgdmFsdWUgb2YgdGhpcyBzaW5nbGUgbWV0aG9kIGNhbGxcblxuXHRcdC8vIGEgbWV0aG9kIGNhbGxcblx0XHRpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRpZiAoY2FsZW5kYXIgJiYgJC5pc0Z1bmN0aW9uKGNhbGVuZGFyW29wdGlvbnNdKSkge1xuXHRcdFx0XHRzaW5nbGVSZXMgPSBjYWxlbmRhcltvcHRpb25zXS5hcHBseShjYWxlbmRhciwgYXJncyk7XG5cdFx0XHRcdGlmICghaSkge1xuXHRcdFx0XHRcdHJlcyA9IHNpbmdsZVJlczsgLy8gcmVjb3JkIHRoZSBmaXJzdCBtZXRob2QgY2FsbCByZXN1bHRcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAob3B0aW9ucyA9PT0gJ2Rlc3Ryb3knKSB7IC8vIGZvciB0aGUgZGVzdHJveSBtZXRob2QsIG11c3QgcmVtb3ZlIENhbGVuZGFyIG9iamVjdCBkYXRhXG5cdFx0XHRcdFx0ZWxlbWVudC5yZW1vdmVEYXRhKCdmdWxsQ2FsZW5kYXInKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBhIG5ldyBjYWxlbmRhciBpbml0aWFsaXphdGlvblxuXHRcdGVsc2UgaWYgKCFjYWxlbmRhcikgeyAvLyBkb24ndCBpbml0aWFsaXplIHR3aWNlXG5cdFx0XHRjYWxlbmRhciA9IG5ldyBDYWxlbmRhcihlbGVtZW50LCBvcHRpb25zKTtcblx0XHRcdGVsZW1lbnQuZGF0YSgnZnVsbENhbGVuZGFyJywgY2FsZW5kYXIpO1xuXHRcdFx0Y2FsZW5kYXIucmVuZGVyKCk7XG5cdFx0fVxuXHR9KTtcblx0XG5cdHJldHVybiByZXM7XG59O1xuXG5cbi8vIGZ1bmN0aW9uIGZvciBhZGRpbmcvb3ZlcnJpZGluZyBkZWZhdWx0c1xuZnVuY3Rpb24gc2V0RGVmYXVsdHMoZCkge1xuXHRtZXJnZU9wdGlvbnMoZGVmYXVsdHMsIGQpO1xufVxuXG5cbi8vIFJlY3Vyc2l2ZWx5IGNvbWJpbmVzIG9wdGlvbiBoYXNoLW9iamVjdHMuXG4vLyBCZXR0ZXIgdGhhbiBgJC5leHRlbmQodHJ1ZSwgLi4uKWAgYmVjYXVzZSBhcnJheXMgYXJlIG5vdCB0cmF2ZXJzZWQvY29waWVkLlxuLy9cbi8vIGNhbGxlZCBsaWtlOlxuLy8gICAgIG1lcmdlT3B0aW9ucyh0YXJnZXQsIG9iajEsIG9iajIsIC4uLilcbi8vXG5mdW5jdGlvbiBtZXJnZU9wdGlvbnModGFyZ2V0KSB7XG5cblx0ZnVuY3Rpb24gbWVyZ2VJbnRvVGFyZ2V0KG5hbWUsIHZhbHVlKSB7XG5cdFx0aWYgKCQuaXNQbGFpbk9iamVjdCh2YWx1ZSkgJiYgJC5pc1BsYWluT2JqZWN0KHRhcmdldFtuYW1lXSkgJiYgIWlzRm9yY2VkQXRvbWljT3B0aW9uKG5hbWUpKSB7XG5cdFx0XHQvLyBtZXJnZSBpbnRvIGEgbmV3IG9iamVjdCB0byBhdm9pZCBkZXN0cnVjdGlvblxuXHRcdFx0dGFyZ2V0W25hbWVdID0gbWVyZ2VPcHRpb25zKHt9LCB0YXJnZXRbbmFtZV0sIHZhbHVlKTsgLy8gY29tYmluZS4gYHZhbHVlYCBvYmplY3QgdGFrZXMgcHJlY2VkZW5jZVxuXHRcdH1cblx0XHRlbHNlIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7IC8vIG9ubHkgdXNlIHZhbHVlcyB0aGF0IGFyZSBzZXQgYW5kIG5vdCB1bmRlZmluZWRcblx0XHRcdHRhcmdldFtuYW1lXSA9IHZhbHVlO1xuXHRcdH1cblx0fVxuXG5cdGZvciAodmFyIGk9MTsgaTxhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHQkLmVhY2goYXJndW1lbnRzW2ldLCBtZXJnZUludG9UYXJnZXQpO1xuXHR9XG5cblx0cmV0dXJuIHRhcmdldDtcbn1cblxuXG4vLyBvdmVyY29tZSBzdWNreSB2aWV3LW9wdGlvbi1oYXNoIGFuZCBvcHRpb24tbWVyZ2luZyBiZWhhdmlvciBtZXNzaW5nIHdpdGggb3B0aW9ucyBpdCBzaG91bGRuJ3RcbmZ1bmN0aW9uIGlzRm9yY2VkQXRvbWljT3B0aW9uKG5hbWUpIHtcblx0Ly8gQW55IG9wdGlvbiB0aGF0IGVuZHMgaW4gXCJUaW1lXCIgb3IgXCJEdXJhdGlvblwiIGlzIHByb2JhYmx5IGEgRHVyYXRpb24sXG5cdC8vIGFuZCB0aGVzZSB3aWxsIGNvbW1vbmx5IGJlIHNwZWNpZmllZCBhcyBwbGFpbiBvYmplY3RzLCB3aGljaCB3ZSBkb24ndCB3YW50IHRvIG1lc3MgdXAuXG5cdHJldHVybiAvKFRpbWV8RHVyYXRpb24pJC8udGVzdChuYW1lKTtcbn1cbi8vIEZJWDogZmluZCBhIGRpZmZlcmVudCBzb2x1dGlvbiBmb3Igdmlldy1vcHRpb24taGFzaGVzIGFuZCBoYXZlIGEgd2hpdGVsaXN0XG4vLyBmb3Igb3B0aW9ucyB0aGF0IGNhbiBiZSByZWN1cnNpdmVseSBtZXJnZWQuXG5cbiAgICB2YXIgbGFuZ09wdGlvbkhhc2ggPSBmYy5sYW5ncyA9IHt9OyAvLyBpbml0aWFsaXplIGFuZCBleHBvc2VcblxuXG4vLyBUT0RPOiBkb2N1bWVudCB0aGUgc3RydWN0dXJlIGFuZCBvcmRlcmluZyBvZiBhIEZ1bGxDYWxlbmRhciBsYW5nIGZpbGVcbi8vIFRPRE86IHJlbmFtZSBldmVyeXRoaW5nIFwibGFuZ1wiIHRvIFwibG9jYWxlXCIsIGxpa2Ugd2hhdCB0aGUgbW9tZW50IHByb2plY3QgZGlkXG5cblxuLy8gSW5pdGlhbGl6ZSBqUXVlcnkgVUkgZGF0ZXBpY2tlciB0cmFuc2xhdGlvbnMgd2hpbGUgdXNpbmcgc29tZSBvZiB0aGUgdHJhbnNsYXRpb25zXG4vLyBXaWxsIHNldCB0aGlzIGFzIHRoZSBkZWZhdWx0IGxhbmd1YWdlIGZvciBkYXRlcGlja2VyLlxuZmMuZGF0ZXBpY2tlckxhbmcgPSBmdW5jdGlvbihsYW5nQ29kZSwgZHBMYW5nQ29kZSwgZHBPcHRpb25zKSB7XG5cblx0Ly8gZ2V0IHRoZSBGdWxsQ2FsZW5kYXIgaW50ZXJuYWwgb3B0aW9uIGhhc2ggZm9yIHRoaXMgbGFuZ3VhZ2UuIGNyZWF0ZSBpZiBuZWNlc3Nhcnlcblx0dmFyIGZjT3B0aW9ucyA9IGxhbmdPcHRpb25IYXNoW2xhbmdDb2RlXSB8fCAobGFuZ09wdGlvbkhhc2hbbGFuZ0NvZGVdID0ge30pO1xuXG5cdC8vIHRyYW5zZmVyIHNvbWUgc2ltcGxlIG9wdGlvbnMgZnJvbSBkYXRlcGlja2VyIHRvIGZjXG5cdGZjT3B0aW9ucy5pc1JUTCA9IGRwT3B0aW9ucy5pc1JUTDtcblx0ZmNPcHRpb25zLndlZWtOdW1iZXJUaXRsZSA9IGRwT3B0aW9ucy53ZWVrSGVhZGVyO1xuXG5cdC8vIGNvbXB1dGUgc29tZSBtb3JlIGNvbXBsZXggb3B0aW9ucyBmcm9tIGRhdGVwaWNrZXJcblx0JC5lYWNoKGRwQ29tcHV0YWJsZU9wdGlvbnMsIGZ1bmN0aW9uKG5hbWUsIGZ1bmMpIHtcblx0XHRmY09wdGlvbnNbbmFtZV0gPSBmdW5jKGRwT3B0aW9ucyk7XG5cdH0pO1xuXG5cdC8vIGlzIGpRdWVyeSBVSSBEYXRlcGlja2VyIGlzIG9uIHRoZSBwYWdlP1xuXHRpZiAoJC5kYXRlcGlja2VyKSB7XG5cblx0XHQvLyBSZWdpc3RlciB0aGUgbGFuZ3VhZ2UgZGF0YS5cblx0XHQvLyBGdWxsQ2FsZW5kYXIgYW5kIE1vbWVudEpTIHVzZSBsYW5ndWFnZSBjb2RlcyBsaWtlIFwicHQtYnJcIiBidXQgRGF0ZXBpY2tlclxuXHRcdC8vIGRvZXMgaXQgbGlrZSBcInB0LUJSXCIgb3IgaWYgaXQgZG9lc24ndCBoYXZlIHRoZSBsYW5ndWFnZSwgbWF5YmUganVzdCBcInB0XCIuXG5cdFx0Ly8gTWFrZSBhbiBhbGlhcyBzbyB0aGUgbGFuZ3VhZ2UgY2FuIGJlIHJlZmVyZW5jZWQgZWl0aGVyIHdheS5cblx0XHQkLmRhdGVwaWNrZXIucmVnaW9uYWxbZHBMYW5nQ29kZV0gPVxuXHRcdFx0JC5kYXRlcGlja2VyLnJlZ2lvbmFsW2xhbmdDb2RlXSA9IC8vIGFsaWFzXG5cdFx0XHRcdGRwT3B0aW9ucztcblxuXHRcdC8vIEFsaWFzICdlbicgdG8gdGhlIGRlZmF1bHQgbGFuZ3VhZ2UgZGF0YS4gRG8gdGhpcyBldmVyeSB0aW1lLlxuXHRcdCQuZGF0ZXBpY2tlci5yZWdpb25hbC5lbiA9ICQuZGF0ZXBpY2tlci5yZWdpb25hbFsnJ107XG5cblx0XHQvLyBTZXQgYXMgRGF0ZXBpY2tlcidzIGdsb2JhbCBkZWZhdWx0cy5cblx0XHQkLmRhdGVwaWNrZXIuc2V0RGVmYXVsdHMoZHBPcHRpb25zKTtcblx0fVxufTtcblxuXG4vLyBTZXRzIEZ1bGxDYWxlbmRhci1zcGVjaWZpYyB0cmFuc2xhdGlvbnMuIFdpbGwgc2V0IHRoZSBsYW5ndWFnZSBhcyB0aGUgZ2xvYmFsIGRlZmF1bHQuXG5mYy5sYW5nID0gZnVuY3Rpb24obGFuZ0NvZGUsIG5ld0ZjT3B0aW9ucykge1xuXHR2YXIgZmNPcHRpb25zO1xuXHR2YXIgbW9tT3B0aW9ucztcblxuXHQvLyBnZXQgdGhlIEZ1bGxDYWxlbmRhciBpbnRlcm5hbCBvcHRpb24gaGFzaCBmb3IgdGhpcyBsYW5ndWFnZS4gY3JlYXRlIGlmIG5lY2Vzc2FyeVxuXHRmY09wdGlvbnMgPSBsYW5nT3B0aW9uSGFzaFtsYW5nQ29kZV0gfHwgKGxhbmdPcHRpb25IYXNoW2xhbmdDb2RlXSA9IHt9KTtcblxuXHQvLyBwcm92aWRlZCBuZXcgb3B0aW9ucyBmb3IgdGhpcyBsYW5ndWFnZT8gbWVyZ2UgdGhlbSBpblxuXHRpZiAobmV3RmNPcHRpb25zKSB7XG5cdFx0bWVyZ2VPcHRpb25zKGZjT3B0aW9ucywgbmV3RmNPcHRpb25zKTtcblx0fVxuXG5cdC8vIGNvbXB1dGUgbGFuZ3VhZ2Ugb3B0aW9ucyB0aGF0IHdlcmVuJ3QgZGVmaW5lZC5cblx0Ly8gYWx3YXlzIGRvIHRoaXMuIG5ld0ZjT3B0aW9ucyBjYW4gYmUgdW5kZWZpbmVkIHdoZW4gaW5pdGlhbGl6aW5nIGZyb20gaTE4biBmaWxlLFxuXHQvLyBzbyBubyB3YXkgdG8gdGVsbCBpZiB0aGlzIGlzIGFuIGluaXRpYWxpemF0aW9uIG9yIGEgZGVmYXVsdC1zZXR0aW5nLlxuXHRtb21PcHRpb25zID0gZ2V0TW9tZW50TG9jYWxlRGF0YShsYW5nQ29kZSk7IC8vIHdpbGwgZmFsbCBiYWNrIHRvIGVuXG5cdCQuZWFjaChtb21Db21wdXRhYmxlT3B0aW9ucywgZnVuY3Rpb24obmFtZSwgZnVuYykge1xuXHRcdGlmIChmY09wdGlvbnNbbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0ZmNPcHRpb25zW25hbWVdID0gZnVuYyhtb21PcHRpb25zLCBmY09wdGlvbnMpO1xuXHRcdH1cblx0fSk7XG5cblx0Ly8gc2V0IGl0IGFzIHRoZSBkZWZhdWx0IGxhbmd1YWdlIGZvciBGdWxsQ2FsZW5kYXJcblx0ZGVmYXVsdHMubGFuZyA9IGxhbmdDb2RlO1xufTtcblxuXG4vLyBOT1RFOiBjYW4ndCBndWFyYW50ZWUgYW55IG9mIHRoZXNlIGNvbXB1dGF0aW9ucyB3aWxsIHJ1biBiZWNhdXNlIG5vdCBldmVyeSBsYW5ndWFnZSBoYXMgZGF0ZXBpY2tlclxuLy8gY29uZmlncywgc28gbWFrZSBzdXJlIHRoZXJlIGFyZSBFbmdsaXNoIGZhbGxiYWNrcyBmb3IgdGhlc2UgaW4gdGhlIGRlZmF1bHRzIGZpbGUuXG52YXIgZHBDb21wdXRhYmxlT3B0aW9ucyA9IHtcblxuXHRkZWZhdWx0QnV0dG9uVGV4dDogZnVuY3Rpb24oZHBPcHRpb25zKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdC8vIHRoZSB0cmFuc2xhdGlvbnMgc29tZXRpbWVzIHdyb25nbHkgY29udGFpbiBIVE1MIGVudGl0aWVzXG5cdFx0XHRwcmV2OiBzdHJpcEh0bWxFbnRpdGllcyhkcE9wdGlvbnMucHJldlRleHQpLFxuXHRcdFx0bmV4dDogc3RyaXBIdG1sRW50aXRpZXMoZHBPcHRpb25zLm5leHRUZXh0KSxcblx0XHRcdHRvZGF5OiBzdHJpcEh0bWxFbnRpdGllcyhkcE9wdGlvbnMuY3VycmVudFRleHQpXG5cdFx0fTtcblx0fSxcblxuXHQvLyBQcm9kdWNlcyBmb3JtYXQgc3RyaW5ncyBsaWtlIFwiTU1NTSBZWVlZXCIgLT4gXCJTZXB0ZW1iZXIgMjAxNFwiXG5cdG1vbnRoWWVhckZvcm1hdDogZnVuY3Rpb24oZHBPcHRpb25zKSB7XG5cdFx0cmV0dXJuIGRwT3B0aW9ucy5zaG93TW9udGhBZnRlclllYXIgP1xuXHRcdFx0J1lZWVlbJyArIGRwT3B0aW9ucy55ZWFyU3VmZml4ICsgJ10gTU1NTScgOlxuXHRcdFx0J01NTU0gWVlZWVsnICsgZHBPcHRpb25zLnllYXJTdWZmaXggKyAnXSc7XG5cdH1cblxufTtcblxudmFyIG1vbUNvbXB1dGFibGVPcHRpb25zID0ge1xuXG5cdC8vIFByb2R1Y2VzIGZvcm1hdCBzdHJpbmdzIGxpa2UgXCJkZGQgTU0vRERcIiAtPiBcIkZyaSAxMi8xMFwiXG5cdGRheU9mTW9udGhGb3JtYXQ6IGZ1bmN0aW9uKG1vbU9wdGlvbnMsIGZjT3B0aW9ucykge1xuXHRcdHZhciBmb3JtYXQgPSBtb21PcHRpb25zLmxvbmdEYXRlRm9ybWF0KCdsJyk7IC8vIGZvciB0aGUgZm9ybWF0IGxpa2UgXCJNL0QvWVlZWVwiXG5cblx0XHQvLyBzdHJpcCB0aGUgeWVhciBvZmYgdGhlIGVkZ2UsIGFzIHdlbGwgYXMgb3RoZXIgbWlzYyBub24td2hpdGVzcGFjZSBjaGFyc1xuXHRcdGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKC9eWStbXlxcd1xcc10qfFteXFx3XFxzXSpZKyQvZywgJycpO1xuXG5cdFx0aWYgKGZjT3B0aW9ucy5pc1JUTCkge1xuXHRcdFx0Zm9ybWF0ICs9ICcgZGRkJzsgLy8gZm9yIFJUTCwgYWRkIGRheS1vZi13ZWVrIHRvIGVuZFxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGZvcm1hdCA9ICdkZGQgJyArIGZvcm1hdDsgLy8gZm9yIExUUiwgYWRkIGRheS1vZi13ZWVrIHRvIGJlZ2lubmluZ1xuXHRcdH1cblx0XHRyZXR1cm4gZm9ybWF0O1xuXHR9LFxuXG5cdC8vIFByb2R1Y2VzIGZvcm1hdCBzdHJpbmdzIGxpa2UgXCJIKDptbSlhXCIgLT4gXCI2cG1cIiBvciBcIjY6MzBwbVwiXG5cdHNtYWxsVGltZUZvcm1hdDogZnVuY3Rpb24obW9tT3B0aW9ucykge1xuXHRcdHJldHVybiBtb21PcHRpb25zLmxvbmdEYXRlRm9ybWF0KCdMVCcpXG5cdFx0XHQucmVwbGFjZSgnOm1tJywgJyg6bW0pJylcblx0XHRcdC5yZXBsYWNlKC8oXFxXbW0pJC8sICcoJDEpJykgLy8gbGlrZSBhYm92ZSwgYnV0IGZvciBmb3JlaWduIGxhbmdzXG5cdFx0XHQucmVwbGFjZSgvXFxzKmEkL2ksICdhJyk7IC8vIGNvbnZlcnQgQU0vUE0vYW0vcG0gdG8gbG93ZXJjYXNlLiByZW1vdmUgYW55IHNwYWNlcyBiZWZvcmVoYW5kXG5cdH0sXG5cblx0Ly8gUHJvZHVjZXMgZm9ybWF0IHN0cmluZ3MgbGlrZSBcIkgoOm1tKXRcIiAtPiBcIjZwXCIgb3IgXCI2OjMwcFwiXG5cdGV4dHJhU21hbGxUaW1lRm9ybWF0OiBmdW5jdGlvbihtb21PcHRpb25zKSB7XG5cdFx0cmV0dXJuIG1vbU9wdGlvbnMubG9uZ0RhdGVGb3JtYXQoJ0xUJylcblx0XHRcdC5yZXBsYWNlKCc6bW0nLCAnKDptbSknKVxuXHRcdFx0LnJlcGxhY2UoLyhcXFdtbSkkLywgJygkMSknKSAvLyBsaWtlIGFib3ZlLCBidXQgZm9yIGZvcmVpZ24gbGFuZ3Ncblx0XHRcdC5yZXBsYWNlKC9cXHMqYSQvaSwgJ3QnKTsgLy8gY29udmVydCB0byBBTS9QTS9hbS9wbSB0byBsb3dlcmNhc2Ugb25lLWxldHRlci4gcmVtb3ZlIGFueSBzcGFjZXMgYmVmb3JlaGFuZFxuXHR9LFxuXG5cdC8vIFByb2R1Y2VzIGZvcm1hdCBzdHJpbmdzIGxpa2UgXCJIOm1tXCIgLT4gXCI2OjMwXCIgKHdpdGggbm8gQU0vUE0pXG5cdG5vTWVyaWRpZW1UaW1lRm9ybWF0OiBmdW5jdGlvbihtb21PcHRpb25zKSB7XG5cdFx0cmV0dXJuIG1vbU9wdGlvbnMubG9uZ0RhdGVGb3JtYXQoJ0xUJylcblx0XHRcdC5yZXBsYWNlKC9cXHMqYSQvaSwgJycpOyAvLyByZW1vdmUgdHJhaWxpbmcgQU0vUE1cblx0fVxuXG59O1xuXG5cbi8vIFJldHVybnMgbW9tZW50J3MgaW50ZXJuYWwgbG9jYWxlIGRhdGEuIElmIGRvZXNuJ3QgZXhpc3QsIHJldHVybnMgRW5nbGlzaC5cbi8vIFdvcmtzIHdpdGggbW9tZW50LXByZS0yLjhcbmZ1bmN0aW9uIGdldE1vbWVudExvY2FsZURhdGEobGFuZ0NvZGUpIHtcblx0dmFyIGZ1bmMgPSBtb21lbnQubG9jYWxlRGF0YSB8fCBtb21lbnQubGFuZ0RhdGE7XG5cdHJldHVybiBmdW5jLmNhbGwobW9tZW50LCBsYW5nQ29kZSkgfHxcblx0XHRmdW5jLmNhbGwobW9tZW50LCAnZW4nKTsgLy8gdGhlIG5ld2VyIGxvY2FsRGF0YSBjb3VsZCByZXR1cm4gbnVsbCwgc28gZmFsbCBiYWNrIHRvIGVuXG59XG5cblxuLy8gSW5pdGlhbGl6ZSBFbmdsaXNoIGJ5IGZvcmNpbmcgY29tcHV0YXRpb24gb2YgbW9tZW50LWRlcml2ZWQgb3B0aW9ucy5cbi8vIEFsc28sIHNldHMgaXQgYXMgdGhlIGRlZmF1bHQuXG5mYy5sYW5nKCdlbicsIGVuZ2xpc2hEZWZhdWx0cyk7XG5cbi8vIGV4cG9ydHNcbmZjLmludGVyc2VjdGlvblRvU2VnID0gaW50ZXJzZWN0aW9uVG9TZWc7XG5mYy5hcHBseUFsbCA9IGFwcGx5QWxsO1xuZmMuZGVib3VuY2UgPSBkZWJvdW5jZTtcblxuXG4vKiBGdWxsQ2FsZW5kYXItc3BlY2lmaWMgRE9NIFV0aWxpdGllc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuLy8gR2l2ZW4gdGhlIHNjcm9sbGJhciB3aWR0aHMgb2Ygc29tZSBvdGhlciBjb250YWluZXIsIGNyZWF0ZSBib3JkZXJzL21hcmdpbnMgb24gcm93RWxzIGluIG9yZGVyIHRvIG1hdGNoIHRoZSBsZWZ0XG4vLyBhbmQgcmlnaHQgc3BhY2UgdGhhdCB3YXMgb2Zmc2V0IGJ5IHRoZSBzY3JvbGxiYXJzLiBBIDEtcGl4ZWwgYm9yZGVyIGZpcnN0LCB0aGVuIG1hcmdpbiBiZXlvbmQgdGhhdC5cbmZ1bmN0aW9uIGNvbXBlbnNhdGVTY3JvbGwocm93RWxzLCBzY3JvbGxiYXJXaWR0aHMpIHtcblx0aWYgKHNjcm9sbGJhcldpZHRocy5sZWZ0KSB7XG5cdFx0cm93RWxzLmNzcyh7XG5cdFx0XHQnYm9yZGVyLWxlZnQtd2lkdGgnOiAxLFxuXHRcdFx0J21hcmdpbi1sZWZ0Jzogc2Nyb2xsYmFyV2lkdGhzLmxlZnQgLSAxXG5cdFx0fSk7XG5cdH1cblx0aWYgKHNjcm9sbGJhcldpZHRocy5yaWdodCkge1xuXHRcdHJvd0Vscy5jc3Moe1xuXHRcdFx0J2JvcmRlci1yaWdodC13aWR0aCc6IDEsXG5cdFx0XHQnbWFyZ2luLXJpZ2h0Jzogc2Nyb2xsYmFyV2lkdGhzLnJpZ2h0IC0gMVxuXHRcdH0pO1xuXHR9XG59XG5cblxuLy8gVW5kb2VzIGNvbXBlbnNhdGVTY3JvbGwgYW5kIHJlc3RvcmVzIGFsbCBib3JkZXJzL21hcmdpbnNcbmZ1bmN0aW9uIHVuY29tcGVuc2F0ZVNjcm9sbChyb3dFbHMpIHtcblx0cm93RWxzLmNzcyh7XG5cdFx0J21hcmdpbi1sZWZ0JzogJycsXG5cdFx0J21hcmdpbi1yaWdodCc6ICcnLFxuXHRcdCdib3JkZXItbGVmdC13aWR0aCc6ICcnLFxuXHRcdCdib3JkZXItcmlnaHQtd2lkdGgnOiAnJ1xuXHR9KTtcbn1cblxuXG4vLyBNYWtlIHRoZSBtb3VzZSBjdXJzb3IgZXhwcmVzcyB0aGF0IGFuIGV2ZW50IGlzIG5vdCBhbGxvd2VkIGluIHRoZSBjdXJyZW50IGFyZWFcbmZ1bmN0aW9uIGRpc2FibGVDdXJzb3IoKSB7XG5cdCQoJ2JvZHknKS5hZGRDbGFzcygnZmMtbm90LWFsbG93ZWQnKTtcbn1cblxuXG4vLyBSZXR1cm5zIHRoZSBtb3VzZSBjdXJzb3IgdG8gaXRzIG9yaWdpbmFsIGxvb2tcbmZ1bmN0aW9uIGVuYWJsZUN1cnNvcigpIHtcblx0JCgnYm9keScpLnJlbW92ZUNsYXNzKCdmYy1ub3QtYWxsb3dlZCcpO1xufVxuXG5cbi8vIEdpdmVuIGEgdG90YWwgYXZhaWxhYmxlIGhlaWdodCB0byBmaWxsLCBoYXZlIGBlbHNgIChlc3NlbnRpYWxseSBjaGlsZCByb3dzKSBleHBhbmQgdG8gYWNjb21vZGF0ZS5cbi8vIEJ5IGRlZmF1bHQsIGFsbCBlbGVtZW50cyB0aGF0IGFyZSBzaG9ydGVyIHRoYW4gdGhlIHJlY29tbWVuZGVkIGhlaWdodCBhcmUgZXhwYW5kZWQgdW5pZm9ybWx5LCBub3QgY29uc2lkZXJpbmdcbi8vIGFueSBvdGhlciBlbHMgdGhhdCBhcmUgYWxyZWFkeSB0b28gdGFsbC4gaWYgYHNob3VsZFJlZGlzdHJpYnV0ZWAgaXMgb24sIGl0IGNvbnNpZGVycyB0aGVzZSB0YWxsIHJvd3MgYW5kIFxuLy8gcmVkdWNlcyB0aGUgYXZhaWxhYmxlIGhlaWdodC5cbmZ1bmN0aW9uIGRpc3RyaWJ1dGVIZWlnaHQoZWxzLCBhdmFpbGFibGVIZWlnaHQsIHNob3VsZFJlZGlzdHJpYnV0ZSkge1xuXG5cdC8vICpGTE9PUklORyBOT1RFKjogd2UgZmxvb3IgaW4gY2VydGFpbiBwbGFjZXMgYmVjYXVzZSB6b29tIGNhbiBnaXZlIGluYWNjdXJhdGUgZmxvYXRpbmctcG9pbnQgZGltZW5zaW9ucyxcblx0Ly8gYW5kIGl0IGlzIGJldHRlciB0byBiZSBzaG9ydGVyIHRoYW4gdGFsbGVyLCB0byBhdm9pZCBjcmVhdGluZyB1bm5lY2Vzc2FyeSBzY3JvbGxiYXJzLlxuXG5cdHZhciBtaW5PZmZzZXQxID0gTWF0aC5mbG9vcihhdmFpbGFibGVIZWlnaHQgLyBlbHMubGVuZ3RoKTsgLy8gZm9yIG5vbi1sYXN0IGVsZW1lbnRcblx0dmFyIG1pbk9mZnNldDIgPSBNYXRoLmZsb29yKGF2YWlsYWJsZUhlaWdodCAtIG1pbk9mZnNldDEgKiAoZWxzLmxlbmd0aCAtIDEpKTsgLy8gZm9yIGxhc3QgZWxlbWVudCAqRkxPT1JJTkcgTk9URSpcblx0dmFyIGZsZXhFbHMgPSBbXTsgLy8gZWxlbWVudHMgdGhhdCBhcmUgYWxsb3dlZCB0byBleHBhbmQuIGFycmF5IG9mIERPTSBub2Rlc1xuXHR2YXIgZmxleE9mZnNldHMgPSBbXTsgLy8gYW1vdW50IG9mIHZlcnRpY2FsIHNwYWNlIGl0IHRha2VzIHVwXG5cdHZhciBmbGV4SGVpZ2h0cyA9IFtdOyAvLyBhY3R1YWwgY3NzIGhlaWdodFxuXHR2YXIgdXNlZEhlaWdodCA9IDA7XG5cblx0dW5kaXN0cmlidXRlSGVpZ2h0KGVscyk7IC8vIGdpdmUgYWxsIGVsZW1lbnRzIHRoZWlyIG5hdHVyYWwgaGVpZ2h0XG5cblx0Ly8gZmluZCBlbGVtZW50cyB0aGF0IGFyZSBiZWxvdyB0aGUgcmVjb21tZW5kZWQgaGVpZ2h0IChleHBhbmRhYmxlKS5cblx0Ly8gaW1wb3J0YW50IHRvIHF1ZXJ5IGZvciBoZWlnaHRzIGluIGEgc2luZ2xlIGZpcnN0IHBhc3MgKHRvIGF2b2lkIHJlZmxvdyBvc2NpbGxhdGlvbikuXG5cdGVscy5lYWNoKGZ1bmN0aW9uKGksIGVsKSB7XG5cdFx0dmFyIG1pbk9mZnNldCA9IGkgPT09IGVscy5sZW5ndGggLSAxID8gbWluT2Zmc2V0MiA6IG1pbk9mZnNldDE7XG5cdFx0dmFyIG5hdHVyYWxPZmZzZXQgPSAkKGVsKS5vdXRlckhlaWdodCh0cnVlKTtcblxuXHRcdGlmIChuYXR1cmFsT2Zmc2V0IDwgbWluT2Zmc2V0KSB7XG5cdFx0XHRmbGV4RWxzLnB1c2goZWwpO1xuXHRcdFx0ZmxleE9mZnNldHMucHVzaChuYXR1cmFsT2Zmc2V0KTtcblx0XHRcdGZsZXhIZWlnaHRzLnB1c2goJChlbCkuaGVpZ2h0KCkpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIHRoaXMgZWxlbWVudCBzdHJldGNoZXMgcGFzdCByZWNvbW1lbmRlZCBoZWlnaHQgKG5vbi1leHBhbmRhYmxlKS4gbWFyayB0aGUgc3BhY2UgYXMgb2NjdXBpZWQuXG5cdFx0XHR1c2VkSGVpZ2h0ICs9IG5hdHVyYWxPZmZzZXQ7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyByZWFkanVzdCB0aGUgcmVjb21tZW5kZWQgaGVpZ2h0IHRvIG9ubHkgY29uc2lkZXIgdGhlIGhlaWdodCBhdmFpbGFibGUgdG8gbm9uLW1heGVkLW91dCByb3dzLlxuXHRpZiAoc2hvdWxkUmVkaXN0cmlidXRlKSB7XG5cdFx0YXZhaWxhYmxlSGVpZ2h0IC09IHVzZWRIZWlnaHQ7XG5cdFx0bWluT2Zmc2V0MSA9IE1hdGguZmxvb3IoYXZhaWxhYmxlSGVpZ2h0IC8gZmxleEVscy5sZW5ndGgpO1xuXHRcdG1pbk9mZnNldDIgPSBNYXRoLmZsb29yKGF2YWlsYWJsZUhlaWdodCAtIG1pbk9mZnNldDEgKiAoZmxleEVscy5sZW5ndGggLSAxKSk7IC8vICpGTE9PUklORyBOT1RFKlxuXHR9XG5cblx0Ly8gYXNzaWduIGhlaWdodHMgdG8gYWxsIGV4cGFuZGFibGUgZWxlbWVudHNcblx0JChmbGV4RWxzKS5lYWNoKGZ1bmN0aW9uKGksIGVsKSB7XG5cdFx0dmFyIG1pbk9mZnNldCA9IGkgPT09IGZsZXhFbHMubGVuZ3RoIC0gMSA/IG1pbk9mZnNldDIgOiBtaW5PZmZzZXQxO1xuXHRcdHZhciBuYXR1cmFsT2Zmc2V0ID0gZmxleE9mZnNldHNbaV07XG5cdFx0dmFyIG5hdHVyYWxIZWlnaHQgPSBmbGV4SGVpZ2h0c1tpXTtcblx0XHR2YXIgbmV3SGVpZ2h0ID0gbWluT2Zmc2V0IC0gKG5hdHVyYWxPZmZzZXQgLSBuYXR1cmFsSGVpZ2h0KTsgLy8gc3VidHJhY3QgdGhlIG1hcmdpbi9wYWRkaW5nXG5cblx0XHRpZiAobmF0dXJhbE9mZnNldCA8IG1pbk9mZnNldCkgeyAvLyB3ZSBjaGVjayB0aGlzIGFnYWluIGJlY2F1c2UgcmVkaXN0cmlidXRpb24gbWlnaHQgaGF2ZSBjaGFuZ2VkIHRoaW5nc1xuXHRcdFx0JChlbCkuaGVpZ2h0KG5ld0hlaWdodCk7XG5cdFx0fVxuXHR9KTtcbn1cblxuXG4vLyBVbmRvZXMgZGlzdHJ1YnV0ZUhlaWdodCwgcmVzdG9yaW5nIGFsbCBlbHMgdG8gdGhlaXIgbmF0dXJhbCBoZWlnaHRcbmZ1bmN0aW9uIHVuZGlzdHJpYnV0ZUhlaWdodChlbHMpIHtcblx0ZWxzLmhlaWdodCgnJyk7XG59XG5cblxuLy8gR2l2ZW4gYGVsc2AsIGEgalF1ZXJ5IHNldCBvZiA8dGQ+IGNlbGxzLCBmaW5kIHRoZSBjZWxsIHdpdGggdGhlIGxhcmdlc3QgbmF0dXJhbCB3aWR0aCBhbmQgc2V0IHRoZSB3aWR0aHMgb2YgYWxsIHRoZVxuLy8gY2VsbHMgdG8gYmUgdGhhdCB3aWR0aC5cbi8vIFBSRVJFUVVJU0lURTogaWYgeW91IHdhbnQgYSBjZWxsIHRvIHRha2UgdXAgd2lkdGgsIGl0IG5lZWRzIHRvIGhhdmUgYSBzaW5nbGUgaW5uZXIgZWxlbWVudCB3LyBkaXNwbGF5OmlubGluZVxuZnVuY3Rpb24gbWF0Y2hDZWxsV2lkdGhzKGVscykge1xuXHR2YXIgbWF4SW5uZXJXaWR0aCA9IDA7XG5cblx0ZWxzLmZpbmQoJz4gKicpLmVhY2goZnVuY3Rpb24oaSwgaW5uZXJFbCkge1xuXHRcdHZhciBpbm5lcldpZHRoID0gJChpbm5lckVsKS5vdXRlcldpZHRoKCk7XG5cdFx0aWYgKGlubmVyV2lkdGggPiBtYXhJbm5lcldpZHRoKSB7XG5cdFx0XHRtYXhJbm5lcldpZHRoID0gaW5uZXJXaWR0aDtcblx0XHR9XG5cdH0pO1xuXG5cdG1heElubmVyV2lkdGgrKzsgLy8gc29tZXRpbWVzIG5vdCBhY2N1cmF0ZSBvZiB3aWR0aCB0aGUgdGV4dCBuZWVkcyB0byBzdGF5IG9uIG9uZSBsaW5lLiBpbnN1cmFuY2VcblxuXHRlbHMud2lkdGgobWF4SW5uZXJXaWR0aCk7XG5cblx0cmV0dXJuIG1heElubmVyV2lkdGg7XG59XG5cblxuLy8gVHVybnMgYSBjb250YWluZXIgZWxlbWVudCBpbnRvIGEgc2Nyb2xsZXIgaWYgaXRzIGNvbnRlbnRzIGlzIHRhbGxlciB0aGFuIHRoZSBhbGxvdHRlZCBoZWlnaHQuXG4vLyBSZXR1cm5zIHRydWUgaWYgdGhlIGVsZW1lbnQgaXMgbm93IGEgc2Nyb2xsZXIsIGZhbHNlIG90aGVyd2lzZS5cbi8vIE5PVEU6IHRoaXMgbWV0aG9kIGlzIGJlc3QgYmVjYXVzZSBpdCB0YWtlcyB3ZWlyZCB6b29taW5nIGRpbWVuc2lvbnMgaW50byBhY2NvdW50XG5mdW5jdGlvbiBzZXRQb3RlbnRpYWxTY3JvbGxlcihjb250YWluZXJFbCwgaGVpZ2h0KSB7XG5cdGNvbnRhaW5lckVsLmhlaWdodChoZWlnaHQpLmFkZENsYXNzKCdmYy1zY3JvbGxlcicpO1xuXG5cdC8vIGFyZSBzY3JvbGxiYXJzIG5lZWRlZD9cblx0aWYgKGNvbnRhaW5lckVsWzBdLnNjcm9sbEhlaWdodCAtIDEgPiBjb250YWluZXJFbFswXS5jbGllbnRIZWlnaHQpIHsgLy8gISEhIC0xIGJlY2F1c2UgSUUgaXMgb2Z0ZW4gb2ZmLWJ5LW9uZSA6KFxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0dW5zZXRTY3JvbGxlcihjb250YWluZXJFbCk7IC8vIHVuZG9cblx0cmV0dXJuIGZhbHNlO1xufVxuXG5cbi8vIFRha2VzIGFuIGVsZW1lbnQgdGhhdCBtaWdodCBoYXZlIGJlZW4gYSBzY3JvbGxlciwgYW5kIHR1cm5zIGl0IGJhY2sgaW50byBhIG5vcm1hbCBlbGVtZW50LlxuZnVuY3Rpb24gdW5zZXRTY3JvbGxlcihjb250YWluZXJFbCkge1xuXHRjb250YWluZXJFbC5oZWlnaHQoJycpLnJlbW92ZUNsYXNzKCdmYy1zY3JvbGxlcicpO1xufVxuXG5cbi8qIEdlbmVyYWwgRE9NIFV0aWxpdGllc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuLy8gYm9ycm93ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vanF1ZXJ5L2pxdWVyeS11aS9ibG9iLzEuMTEuMC91aS9jb3JlLmpzI0w1MVxuZnVuY3Rpb24gZ2V0U2Nyb2xsUGFyZW50KGVsKSB7XG5cdHZhciBwb3NpdGlvbiA9IGVsLmNzcygncG9zaXRpb24nKSxcblx0XHRzY3JvbGxQYXJlbnQgPSBlbC5wYXJlbnRzKCkuZmlsdGVyKGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHBhcmVudCA9ICQodGhpcyk7XG5cdFx0XHRyZXR1cm4gKC8oYXV0b3xzY3JvbGwpLykudGVzdChcblx0XHRcdFx0cGFyZW50LmNzcygnb3ZlcmZsb3cnKSArIHBhcmVudC5jc3MoJ292ZXJmbG93LXknKSArIHBhcmVudC5jc3MoJ292ZXJmbG93LXgnKVxuXHRcdFx0KTtcblx0XHR9KS5lcSgwKTtcblxuXHRyZXR1cm4gcG9zaXRpb24gPT09ICdmaXhlZCcgfHwgIXNjcm9sbFBhcmVudC5sZW5ndGggPyAkKGVsWzBdLm93bmVyRG9jdW1lbnQgfHwgZG9jdW1lbnQpIDogc2Nyb2xsUGFyZW50O1xufVxuXG5cbi8vIEdpdmVuIGEgY29udGFpbmVyIGVsZW1lbnQsIHJldHVybiBhbiBvYmplY3Qgd2l0aCB0aGUgcGl4ZWwgdmFsdWVzIG9mIHRoZSBsZWZ0L3JpZ2h0IHNjcm9sbGJhcnMuXG4vLyBMZWZ0IHNjcm9sbGJhcnMgbWlnaHQgb2NjdXIgb24gUlRMIGJyb3dzZXJzIChJRSBtYXliZT8pIGJ1dCBJIGhhdmUgbm90IHRlc3RlZC5cbi8vIFBSRVJFUVVJU0lURTogY29udGFpbmVyIGVsZW1lbnQgbXVzdCBoYXZlIGEgc2luZ2xlIGNoaWxkIHdpdGggZGlzcGxheTpibG9ja1xuZnVuY3Rpb24gZ2V0U2Nyb2xsYmFyV2lkdGhzKGNvbnRhaW5lcikge1xuXHR2YXIgY29udGFpbmVyTGVmdCA9IGNvbnRhaW5lci5vZmZzZXQoKS5sZWZ0O1xuXHR2YXIgY29udGFpbmVyUmlnaHQgPSBjb250YWluZXJMZWZ0ICsgY29udGFpbmVyLndpZHRoKCk7XG5cdHZhciBpbm5lciA9IGNvbnRhaW5lci5jaGlsZHJlbigpO1xuXHR2YXIgaW5uZXJMZWZ0ID0gaW5uZXIub2Zmc2V0KCkubGVmdDtcblx0dmFyIGlubmVyUmlnaHQgPSBpbm5lckxlZnQgKyBpbm5lci5vdXRlcldpZHRoKCk7XG5cblx0cmV0dXJuIHtcblx0XHRsZWZ0OiBpbm5lckxlZnQgLSBjb250YWluZXJMZWZ0LFxuXHRcdHJpZ2h0OiBjb250YWluZXJSaWdodCAtIGlubmVyUmlnaHRcblx0fTtcbn1cblxuXG4vLyBSZXR1cm5zIGEgYm9vbGVhbiB3aGV0aGVyIHRoaXMgd2FzIGEgbGVmdCBtb3VzZSBjbGljayBhbmQgbm8gY3RybCBrZXkgKHdoaWNoIG1lYW5zIHJpZ2h0IGNsaWNrIG9uIE1hYylcbmZ1bmN0aW9uIGlzUHJpbWFyeU1vdXNlQnV0dG9uKGV2KSB7XG5cdHJldHVybiBldi53aGljaCA9PSAxICYmICFldi5jdHJsS2V5O1xufVxuXG5cbi8qIEZ1bGxDYWxlbmRhci1zcGVjaWZpYyBNaXNjIFV0aWxpdGllc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuLy8gQ3JlYXRlcyBhIGJhc2ljIHNlZ21lbnQgd2l0aCB0aGUgaW50ZXJzZWN0aW9uIG9mIHRoZSB0d28gcmFuZ2VzLiBSZXR1cm5zIHVuZGVmaW5lZCBpZiBubyBpbnRlcnNlY3Rpb24uXG4vLyBFeHBlY3RzIGFsbCBkYXRlcyB0byBiZSBub3JtYWxpemVkIHRvIHRoZSBzYW1lIHRpbWV6b25lIGJlZm9yZWhhbmQuXG4vLyBUT0RPOiBtb3ZlIHRvIGRhdGUgc2VjdGlvbj9cbmZ1bmN0aW9uIGludGVyc2VjdGlvblRvU2VnKHN1YmplY3RSYW5nZSwgY29uc3RyYWludFJhbmdlKSB7XG5cdHZhciBzdWJqZWN0U3RhcnQgPSBzdWJqZWN0UmFuZ2Uuc3RhcnQ7XG5cdHZhciBzdWJqZWN0RW5kID0gc3ViamVjdFJhbmdlLmVuZDtcblx0dmFyIGNvbnN0cmFpbnRTdGFydCA9IGNvbnN0cmFpbnRSYW5nZS5zdGFydDtcblx0dmFyIGNvbnN0cmFpbnRFbmQgPSBjb25zdHJhaW50UmFuZ2UuZW5kO1xuXHR2YXIgc2VnU3RhcnQsIHNlZ0VuZDtcblx0dmFyIGlzU3RhcnQsIGlzRW5kO1xuXG5cdGlmIChzdWJqZWN0RW5kID4gY29uc3RyYWludFN0YXJ0ICYmIHN1YmplY3RTdGFydCA8IGNvbnN0cmFpbnRFbmQpIHsgLy8gaW4gYm91bmRzIGF0IGFsbD9cblxuXHRcdGlmIChzdWJqZWN0U3RhcnQgPj0gY29uc3RyYWludFN0YXJ0KSB7XG5cdFx0XHRzZWdTdGFydCA9IHN1YmplY3RTdGFydC5jbG9uZSgpO1xuXHRcdFx0aXNTdGFydCA9IHRydWU7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0c2VnU3RhcnQgPSBjb25zdHJhaW50U3RhcnQuY2xvbmUoKTtcblx0XHRcdGlzU3RhcnQgPSAgZmFsc2U7XG5cdFx0fVxuXG5cdFx0aWYgKHN1YmplY3RFbmQgPD0gY29uc3RyYWludEVuZCkge1xuXHRcdFx0c2VnRW5kID0gc3ViamVjdEVuZC5jbG9uZSgpO1xuXHRcdFx0aXNFbmQgPSB0cnVlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHNlZ0VuZCA9IGNvbnN0cmFpbnRFbmQuY2xvbmUoKTtcblx0XHRcdGlzRW5kID0gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHN0YXJ0OiBzZWdTdGFydCxcblx0XHRcdGVuZDogc2VnRW5kLFxuXHRcdFx0aXNTdGFydDogaXNTdGFydCxcblx0XHRcdGlzRW5kOiBpc0VuZFxuXHRcdH07XG5cdH1cbn1cblxuXG5mdW5jdGlvbiBzbWFydFByb3BlcnR5KG9iaiwgbmFtZSkgeyAvLyBnZXQgYSBjYW1lbC1jYXNlZC9uYW1lc3BhY2VkIHByb3BlcnR5IG9mIGFuIG9iamVjdFxuXHRvYmogPSBvYmogfHwge307XG5cdGlmIChvYmpbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBvYmpbbmFtZV07XG5cdH1cblx0dmFyIHBhcnRzID0gbmFtZS5zcGxpdCgvKD89W0EtWl0pLyksXG5cdFx0aSA9IHBhcnRzLmxlbmd0aCAtIDEsIHJlcztcblx0Zm9yICg7IGk+PTA7IGktLSkge1xuXHRcdHJlcyA9IG9ialtwYXJ0c1tpXS50b0xvd2VyQ2FzZSgpXTtcblx0XHRpZiAocmVzICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiByZXM7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBvYmpbJ2RlZmF1bHQnXTtcbn1cblxuXG4vKiBEYXRlIFV0aWxpdGllc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbnZhciBkYXlJRHMgPSBbICdzdW4nLCAnbW9uJywgJ3R1ZScsICd3ZWQnLCAndGh1JywgJ2ZyaScsICdzYXQnIF07XG52YXIgaW50ZXJ2YWxVbml0cyA9IFsgJ3llYXInLCAnbW9udGgnLCAnd2VlaycsICdkYXknLCAnaG91cicsICdtaW51dGUnLCAnc2Vjb25kJywgJ21pbGxpc2Vjb25kJyBdO1xuXG5cbi8vIERpZmZzIHRoZSB0d28gbW9tZW50cyBpbnRvIGEgRHVyYXRpb24gd2hlcmUgZnVsbC1kYXlzIGFyZSByZWNvcmRlZCBmaXJzdCwgdGhlbiB0aGUgcmVtYWluaW5nIHRpbWUuXG4vLyBNb21lbnRzIHdpbGwgaGF2ZSB0aGVpciB0aW1lem9uZXMgbm9ybWFsaXplZC5cbmZ1bmN0aW9uIGRpZmZEYXlUaW1lKGEsIGIpIHtcblx0cmV0dXJuIG1vbWVudC5kdXJhdGlvbih7XG5cdFx0ZGF5czogYS5jbG9uZSgpLnN0cmlwVGltZSgpLmRpZmYoYi5jbG9uZSgpLnN0cmlwVGltZSgpLCAnZGF5cycpLFxuXHRcdG1zOiBhLnRpbWUoKSAtIGIudGltZSgpIC8vIHRpbWUtb2YtZGF5IGZyb20gZGF5IHN0YXJ0LiBkaXNyZWdhcmRzIHRpbWV6b25lXG5cdH0pO1xufVxuXG5cbi8vIERpZmZzIHRoZSB0d28gbW9tZW50cyB2aWEgdGhlaXIgc3RhcnQtb2YtZGF5IChyZWdhcmRsZXNzIG9mIHRpbWV6b25lKS4gUHJvZHVjZXMgd2hvbGUtZGF5IGR1cmF0aW9ucy5cbmZ1bmN0aW9uIGRpZmZEYXkoYSwgYikge1xuXHRyZXR1cm4gbW9tZW50LmR1cmF0aW9uKHtcblx0XHRkYXlzOiBhLmNsb25lKCkuc3RyaXBUaW1lKCkuZGlmZihiLmNsb25lKCkuc3RyaXBUaW1lKCksICdkYXlzJylcblx0fSk7XG59XG5cblxuLy8gQ29tcHV0ZXMgdGhlIGxhcmdlcyB3aG9sZS11bml0IHBlcmlvZCBvZiB0aW1lLCBhcyBhIGR1cmF0aW9uIG9iamVjdC5cbi8vIEZvciBleGFtcGxlLCA0OCBob3VycyB3aWxsIGJlIHtkYXlzOjJ9IHdoZXJlYXMgNDkgaG91cnMgd2lsbCBiZSB7aG91cnM6NDl9LlxuLy8gQWNjZXB0cyBzdGFydC9lbmQsIGEgcmFuZ2Ugb2JqZWN0LCBvciBhbiBvcmlnaW5hbCBkdXJhdGlvbiBvYmplY3QuXG4vKiAobmV2ZXIgdXNlZClcbmZ1bmN0aW9uIGNvbXB1dGVJbnRlcnZhbER1cmF0aW9uKHN0YXJ0LCBlbmQpIHtcblx0dmFyIGR1cmF0aW9uSW5wdXQgPSB7fTtcblx0dmFyIGksIHVuaXQ7XG5cdHZhciB2YWw7XG5cblx0Zm9yIChpID0gMDsgaSA8IGludGVydmFsVW5pdHMubGVuZ3RoOyBpKyspIHtcblx0XHR1bml0ID0gaW50ZXJ2YWxVbml0c1tpXTtcblx0XHR2YWwgPSBjb21wdXRlSW50ZXJ2YWxBcyh1bml0LCBzdGFydCwgZW5kKTtcblx0XHRpZiAodmFsKSB7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdH1cblxuXHRkdXJhdGlvbklucHV0W3VuaXRdID0gdmFsO1xuXHRyZXR1cm4gbW9tZW50LmR1cmF0aW9uKGR1cmF0aW9uSW5wdXQpO1xufVxuKi9cblxuXG4vLyBDb21wdXRlcyB0aGUgdW5pdCBuYW1lIG9mIHRoZSBsYXJnZXN0IHdob2xlLXVuaXQgcGVyaW9kIG9mIHRpbWUuXG4vLyBGb3IgZXhhbXBsZSwgNDggaG91cnMgd2lsbCBiZSBcImRheXNcIiB3aGVyZXdhcyA0OSBob3VycyB3aWxsIGJlIFwiaG91cnNcIi5cbi8vIEFjY2VwdHMgc3RhcnQvZW5kLCBhIHJhbmdlIG9iamVjdCwgb3IgYW4gb3JpZ2luYWwgZHVyYXRpb24gb2JqZWN0LlxuZnVuY3Rpb24gY29tcHV0ZUludGVydmFsVW5pdChzdGFydCwgZW5kKSB7XG5cdHZhciBpLCB1bml0O1xuXG5cdGZvciAoaSA9IDA7IGkgPCBpbnRlcnZhbFVuaXRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dW5pdCA9IGludGVydmFsVW5pdHNbaV07XG5cdFx0aWYgKGNvbXB1dGVJbnRlcnZhbEFzKHVuaXQsIHN0YXJ0LCBlbmQpKSB7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdW5pdDsgLy8gd2lsbCBiZSBcIm1pbGxpc2Vjb25kc1wiIGlmIG5vdGhpbmcgZWxzZSBtYXRjaGVzXG59XG5cblxuLy8gQ29tcHV0ZXMgdGhlIG51bWJlciBvZiB1bml0cyB0aGUgaW50ZXJ2YWwgaXMgY2xlYW5seSBjb21wcmlzZWQgb2YuXG4vLyBJZiB0aGUgZ2l2ZW4gdW5pdCBkb2VzIG5vdCBjbGVhbmx5IGRpdmlkZSB0aGUgaW50ZXJ2YWwgYSB3aG9sZSBudW1iZXIgb2YgdGltZXMsIGBmYWxzZWAgaXMgcmV0dXJuZWQuXG4vLyBBY2NlcHRzIHN0YXJ0L2VuZCwgYSByYW5nZSBvYmplY3QsIG9yIGFuIG9yaWdpbmFsIGR1cmF0aW9uIG9iamVjdC5cbmZ1bmN0aW9uIGNvbXB1dGVJbnRlcnZhbEFzKHVuaXQsIHN0YXJ0LCBlbmQpIHtcblx0dmFyIHZhbDtcblxuXHRpZiAoZW5kICE9IG51bGwpIHsgLy8gZ2l2ZW4gc3RhcnQsIGVuZFxuXHRcdHZhbCA9IGVuZC5kaWZmKHN0YXJ0LCB1bml0LCB0cnVlKTtcblx0fVxuXHRlbHNlIGlmIChtb21lbnQuaXNEdXJhdGlvbihzdGFydCkpIHsgLy8gZ2l2ZW4gZHVyYXRpb25cblx0XHR2YWwgPSBzdGFydC5hcyh1bml0KTtcblx0fVxuXHRlbHNlIHsgLy8gZ2l2ZW4geyBzdGFydCwgZW5kIH0gcmFuZ2Ugb2JqZWN0XG5cdFx0dmFsID0gc3RhcnQuZW5kLmRpZmYoc3RhcnQuc3RhcnQsIHVuaXQsIHRydWUpO1xuXHR9XG5cblx0aWYgKHZhbCA+PSAxICYmIGlzSW50KHZhbCkpIHtcblx0XHRyZXR1cm4gdmFsO1xuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufVxuXG5cbmZ1bmN0aW9uIGlzTmF0aXZlRGF0ZShpbnB1dCkge1xuXHRyZXR1cm4gIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IERhdGVdJyB8fCBpbnB1dCBpbnN0YW5jZW9mIERhdGU7XG59XG5cblxuLy8gUmV0dXJucyBhIGJvb2xlYW4gYWJvdXQgd2hldGhlciB0aGUgZ2l2ZW4gaW5wdXQgaXMgYSB0aW1lIHN0cmluZywgbGlrZSBcIjA2OjQwOjAwXCIgb3IgXCIwNjowMFwiXG5mdW5jdGlvbiBpc1RpbWVTdHJpbmcoc3RyKSB7XG5cdHJldHVybiAvXlxcZCtcXDpcXGQrKD86XFw6XFxkK1xcLj8oPzpcXGR7M30pPyk/JC8udGVzdChzdHIpO1xufVxuXG5cbi8qIEdlbmVyYWwgVXRpbGl0aWVzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxudmFyIGhhc093blByb3BNZXRob2QgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuXG4vLyBDcmVhdGUgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBnaXZlbiBwcm90b3R5cGUuIEp1c3QgbGlrZSBPYmplY3QuY3JlYXRlXG5mdW5jdGlvbiBjcmVhdGVPYmplY3QocHJvdG8pIHtcblx0dmFyIGYgPSBmdW5jdGlvbigpIHt9O1xuXHRmLnByb3RvdHlwZSA9IHByb3RvO1xuXHRyZXR1cm4gbmV3IGYoKTtcbn1cblxuXG5mdW5jdGlvbiBjb3B5T3duUHJvcHMoc3JjLCBkZXN0KSB7XG5cdGZvciAodmFyIG5hbWUgaW4gc3JjKSB7XG5cdFx0aWYgKGhhc093blByb3Aoc3JjLCBuYW1lKSkge1xuXHRcdFx0ZGVzdFtuYW1lXSA9IHNyY1tuYW1lXTtcblx0XHR9XG5cdH1cbn1cblxuXG5mdW5jdGlvbiBoYXNPd25Qcm9wKG9iaiwgbmFtZSkge1xuXHRyZXR1cm4gaGFzT3duUHJvcE1ldGhvZC5jYWxsKG9iaiwgbmFtZSk7XG59XG5cblxuLy8gSXMgdGhlIGdpdmVuIHZhbHVlIGEgbm9uLW9iamVjdCBub24tZnVuY3Rpb24gdmFsdWU/XG5mdW5jdGlvbiBpc0F0b21pYyh2YWwpIHtcblx0cmV0dXJuIC91bmRlZmluZWR8bnVsbHxib29sZWFufG51bWJlcnxzdHJpbmcvLnRlc3QoJC50eXBlKHZhbCkpO1xufVxuXG5cbmZ1bmN0aW9uIGFwcGx5QWxsKGZ1bmN0aW9ucywgdGhpc09iaiwgYXJncykge1xuXHRpZiAoJC5pc0Z1bmN0aW9uKGZ1bmN0aW9ucykpIHtcblx0XHRmdW5jdGlvbnMgPSBbIGZ1bmN0aW9ucyBdO1xuXHR9XG5cdGlmIChmdW5jdGlvbnMpIHtcblx0XHR2YXIgaTtcblx0XHR2YXIgcmV0O1xuXHRcdGZvciAoaT0wOyBpPGZ1bmN0aW9ucy5sZW5ndGg7IGkrKykge1xuXHRcdFx0cmV0ID0gZnVuY3Rpb25zW2ldLmFwcGx5KHRoaXNPYmosIGFyZ3MpIHx8IHJldDtcblx0XHR9XG5cdFx0cmV0dXJuIHJldDtcblx0fVxufVxuXG5cbmZ1bmN0aW9uIGZpcnN0RGVmaW5lZCgpIHtcblx0Zm9yICh2YXIgaT0wOyBpPGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdGlmIChhcmd1bWVudHNbaV0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIGFyZ3VtZW50c1tpXTtcblx0XHR9XG5cdH1cbn1cblxuXG5mdW5jdGlvbiBodG1sRXNjYXBlKHMpIHtcblx0cmV0dXJuIChzICsgJycpLnJlcGxhY2UoLyYvZywgJyZhbXA7Jylcblx0XHQucmVwbGFjZSgvPC9nLCAnJmx0OycpXG5cdFx0LnJlcGxhY2UoLz4vZywgJyZndDsnKVxuXHRcdC5yZXBsYWNlKC8nL2csICcmIzAzOTsnKVxuXHRcdC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7Jylcblx0XHQucmVwbGFjZSgvXFxuL2csICc8YnIgLz4nKTtcbn1cblxuXG5mdW5jdGlvbiBzdHJpcEh0bWxFbnRpdGllcyh0ZXh0KSB7XG5cdHJldHVybiB0ZXh0LnJlcGxhY2UoLyYuKj87L2csICcnKTtcbn1cblxuXG5mdW5jdGlvbiBjYXBpdGFsaXNlRmlyc3RMZXR0ZXIoc3RyKSB7XG5cdHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG59XG5cblxuZnVuY3Rpb24gY29tcGFyZU51bWJlcnMoYSwgYikgeyAvLyBmb3IgLnNvcnQoKVxuXHRyZXR1cm4gYSAtIGI7XG59XG5cblxuZnVuY3Rpb24gaXNJbnQobikge1xuXHRyZXR1cm4gbiAlIDEgPT09IDA7XG59XG5cblxuLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuLy8gTiBtaWxsaXNlY29uZHMuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vamFzaGtlbmFzL3VuZGVyc2NvcmUvYmxvYi8xLjYuMC91bmRlcnNjb3JlLmpzI0w3MTRcbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQpIHtcblx0dmFyIHRpbWVvdXRJZDtcblx0dmFyIGFyZ3M7XG5cdHZhciBjb250ZXh0O1xuXHR2YXIgdGltZXN0YW1wOyAvLyBvZiBtb3N0IHJlY2VudCBjYWxsXG5cdHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsYXN0ID0gK25ldyBEYXRlKCkgLSB0aW1lc3RhbXA7XG5cdFx0aWYgKGxhc3QgPCB3YWl0ICYmIGxhc3QgPiAwKSB7XG5cdFx0XHR0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0IC0gbGFzdCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dGltZW91dElkID0gbnVsbDtcblx0XHRcdGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0XHRpZiAoIXRpbWVvdXRJZCkge1xuXHRcdFx0XHRjb250ZXh0ID0gYXJncyA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRjb250ZXh0ID0gdGhpcztcblx0XHRhcmdzID0gYXJndW1lbnRzO1xuXHRcdHRpbWVzdGFtcCA9ICtuZXcgRGF0ZSgpO1xuXHRcdGlmICghdGltZW91dElkKSB7XG5cdFx0XHR0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHR9XG5cdH07XG59XG5cbiAgICB2YXIgYW1iaWdEYXRlT2ZNb250aFJlZ2V4ID0gL15cXHMqXFxkezR9LVxcZFxcZCQvO1xudmFyIGFtYmlnVGltZU9yWm9uZVJlZ2V4ID1cblx0L15cXHMqXFxkezR9LSg/OihcXGRcXGQtXFxkXFxkKXwoV1xcZFxcZCQpfChXXFxkXFxkLVxcZCl8KFxcZFxcZFxcZCkpKChUfCApKFxcZFxcZCg6XFxkXFxkKDpcXGRcXGQoXFwuXFxkKyk/KT8pPyk/KT8kLztcbnZhciBuZXdNb21lbnRQcm90byA9IG1vbWVudC5mbjsgLy8gd2hlcmUgd2Ugd2lsbCBhdHRhY2ggb3VyIG5ldyBtZXRob2RzXG52YXIgb2xkTW9tZW50UHJvdG8gPSAkLmV4dGVuZCh7fSwgbmV3TW9tZW50UHJvdG8pOyAvLyBjb3B5IG9mIG9yaWdpbmFsIG1vbWVudCBtZXRob2RzXG52YXIgYWxsb3dWYWx1ZU9wdGltaXphdGlvbjtcbnZhciBzZXRVVENWYWx1ZXM7IC8vIGZ1bmN0aW9uIGRlZmluZWQgYmVsb3dcbnZhciBzZXRMb2NhbFZhbHVlczsgLy8gZnVuY3Rpb24gZGVmaW5lZCBiZWxvd1xuXG5cbi8vIENyZWF0aW5nXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIENyZWF0ZXMgYSBuZXcgbW9tZW50LCBzaW1pbGFyIHRvIHRoZSB2YW5pbGxhIG1vbWVudCguLi4pIGNvbnN0cnVjdG9yLCBidXQgd2l0aFxuLy8gZXh0cmEgZmVhdHVyZXMgKGFtYmlndW91cyB0aW1lLCBlbmhhbmNlZCBmb3JtYXR0aW5nKS4gV2hlbiBnaXZlbiBhbiBleGlzdGluZyBtb21lbnQsXG4vLyBpdCB3aWxsIGZ1bmN0aW9uIGFzIGEgY2xvbmUgKGFuZCByZXRhaW4gdGhlIHpvbmUgb2YgdGhlIG1vbWVudCkuIEFueXRoaW5nIGVsc2Ugd2lsbFxuLy8gcmVzdWx0IGluIGEgbW9tZW50IGluIHRoZSBsb2NhbCB6b25lLlxuZmMubW9tZW50ID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBtYWtlTW9tZW50KGFyZ3VtZW50cyk7XG59O1xuXG4vLyBTYW1lcyBhcyBmYy5tb21lbnQsIGJ1dCBmb3JjZXMgdGhlIHJlc3VsdGluZyBtb21lbnQgdG8gYmUgaW4gdGhlIFVUQyB0aW1lem9uZS5cbmZjLm1vbWVudC51dGMgPSBmdW5jdGlvbigpIHtcblx0dmFyIG1vbSA9IG1ha2VNb21lbnQoYXJndW1lbnRzLCB0cnVlKTtcblxuXHQvLyBGb3JjZSBpdCBpbnRvIFVUQyBiZWNhdXNlIG1ha2VNb21lbnQgZG9lc24ndCBndWFyYW50ZWUgaXRcblx0Ly8gKGlmIGdpdmVuIGEgcHJlLWV4aXN0aW5nIG1vbWVudCBmb3IgZXhhbXBsZSlcblx0aWYgKG1vbS5oYXNUaW1lKCkpIHsgLy8gZG9uJ3QgZ2l2ZSBhbWJpZ3VvdXNseS10aW1lZCBtb21lbnRzIGEgVVRDIHpvbmVcblx0XHRtb20udXRjKCk7XG5cdH1cblxuXHRyZXR1cm4gbW9tO1xufTtcblxuLy8gU2FtZSBhcyBmYy5tb21lbnQsIGJ1dCB3aGVuIGdpdmVuIGFuIElTTzg2MDEgc3RyaW5nLCB0aGUgdGltZXpvbmUgb2Zmc2V0IGlzIHByZXNlcnZlZC5cbi8vIElTTzg2MDEgc3RyaW5ncyB3aXRoIG5vIHRpbWV6b25lIG9mZnNldCB3aWxsIGJlY29tZSBhbWJpZ3VvdXNseSB6b25lZC5cbmZjLm1vbWVudC5wYXJzZVpvbmUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG1ha2VNb21lbnQoYXJndW1lbnRzLCB0cnVlLCB0cnVlKTtcbn07XG5cbi8vIEJ1aWxkcyBhbiBlbmhhbmNlZCBtb21lbnQgZnJvbSBhcmdzLiBXaGVuIGdpdmVuIGFuIGV4aXN0aW5nIG1vbWVudCwgaXQgY2xvbmVzLiBXaGVuIGdpdmVuIGFcbi8vIG5hdGl2ZSBEYXRlLCBvciBjYWxsZWQgd2l0aCBubyBhcmd1bWVudHMgKHRoZSBjdXJyZW50IHRpbWUpLCB0aGUgcmVzdWx0aW5nIG1vbWVudCB3aWxsIGJlIGxvY2FsLlxuLy8gQW55dGhpbmcgZWxzZSBuZWVkcyB0byBiZSBcInBhcnNlZFwiIChhIHN0cmluZyBvciBhbiBhcnJheSksIGFuZCB3aWxsIGJlIGFmZmVjdGVkIGJ5OlxuLy8gICAgcGFyc2VBc1VUQyAtIGlmIHRoZXJlIGlzIG5vIHpvbmUgaW5mb3JtYXRpb24sIHNob3VsZCB3ZSBwYXJzZSB0aGUgaW5wdXQgaW4gVVRDP1xuLy8gICAgcGFyc2Vab25lIC0gaWYgdGhlcmUgaXMgem9uZSBpbmZvcm1hdGlvbiwgc2hvdWxkIHdlIGZvcmNlIHRoZSB6b25lIG9mIHRoZSBtb21lbnQ/XG5mdW5jdGlvbiBtYWtlTW9tZW50KGFyZ3MsIHBhcnNlQXNVVEMsIHBhcnNlWm9uZSkge1xuXHR2YXIgaW5wdXQgPSBhcmdzWzBdO1xuXHR2YXIgaXNTaW5nbGVTdHJpbmcgPSBhcmdzLmxlbmd0aCA9PSAxICYmIHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZyc7XG5cdHZhciBpc0FtYmlnVGltZTtcblx0dmFyIGlzQW1iaWdab25lO1xuXHR2YXIgYW1iaWdNYXRjaDtcblx0dmFyIG1vbTtcblxuXHRpZiAobW9tZW50LmlzTW9tZW50KGlucHV0KSkge1xuXHRcdG1vbSA9IG1vbWVudC5hcHBseShudWxsLCBhcmdzKTsgLy8gY2xvbmUgaXRcblx0XHR0cmFuc2ZlckFtYmlncyhpbnB1dCwgbW9tKTsgLy8gdGhlIGFtYmlnIGZsYWdzIHdlcmVuJ3QgdHJhbnNmZXJlZCB3aXRoIHRoZSBjbG9uZVxuXHR9XG5cdGVsc2UgaWYgKGlzTmF0aXZlRGF0ZShpbnB1dCkgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuXHRcdG1vbSA9IG1vbWVudC5hcHBseShudWxsLCBhcmdzKTsgLy8gd2lsbCBiZSBsb2NhbFxuXHR9XG5cdGVsc2UgeyAvLyBcInBhcnNpbmdcIiBpcyByZXF1aXJlZFxuXHRcdGlzQW1iaWdUaW1lID0gZmFsc2U7XG5cdFx0aXNBbWJpZ1pvbmUgPSBmYWxzZTtcblxuXHRcdGlmIChpc1NpbmdsZVN0cmluZykge1xuXHRcdFx0aWYgKGFtYmlnRGF0ZU9mTW9udGhSZWdleC50ZXN0KGlucHV0KSkge1xuXHRcdFx0XHQvLyBhY2NlcHQgc3RyaW5ncyBsaWtlICcyMDE0LTA1JywgYnV0IGNvbnZlcnQgdG8gdGhlIGZpcnN0IG9mIHRoZSBtb250aFxuXHRcdFx0XHRpbnB1dCArPSAnLTAxJztcblx0XHRcdFx0YXJncyA9IFsgaW5wdXQgXTsgLy8gZm9yIHdoZW4gd2UgcGFzcyBpdCBvbiB0byBtb21lbnQncyBjb25zdHJ1Y3RvclxuXHRcdFx0XHRpc0FtYmlnVGltZSA9IHRydWU7XG5cdFx0XHRcdGlzQW1iaWdab25lID0gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKChhbWJpZ01hdGNoID0gYW1iaWdUaW1lT3Jab25lUmVnZXguZXhlYyhpbnB1dCkpKSB7XG5cdFx0XHRcdGlzQW1iaWdUaW1lID0gIWFtYmlnTWF0Y2hbNV07IC8vIG5vIHRpbWUgcGFydD9cblx0XHRcdFx0aXNBbWJpZ1pvbmUgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIGlmICgkLmlzQXJyYXkoaW5wdXQpKSB7XG5cdFx0XHQvLyBhcnJheXMgaGF2ZSBubyB0aW1lem9uZSBpbmZvcm1hdGlvbiwgc28gYXNzdW1lIGFtYmlndW91cyB6b25lXG5cdFx0XHRpc0FtYmlnWm9uZSA9IHRydWU7XG5cdFx0fVxuXHRcdC8vIG90aGVyd2lzZSwgcHJvYmFibHkgYSBzdHJpbmcgd2l0aCBhIGZvcm1hdFxuXG5cdFx0aWYgKHBhcnNlQXNVVEMgfHwgaXNBbWJpZ1RpbWUpIHtcblx0XHRcdG1vbSA9IG1vbWVudC51dGMuYXBwbHkobW9tZW50LCBhcmdzKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRtb20gPSBtb21lbnQuYXBwbHkobnVsbCwgYXJncyk7XG5cdFx0fVxuXG5cdFx0aWYgKGlzQW1iaWdUaW1lKSB7XG5cdFx0XHRtb20uX2FtYmlnVGltZSA9IHRydWU7XG5cdFx0XHRtb20uX2FtYmlnWm9uZSA9IHRydWU7IC8vIGFtYmlndW91cyB0aW1lIGFsd2F5cyBtZWFucyBhbWJpZ3VvdXMgem9uZVxuXHRcdH1cblx0XHRlbHNlIGlmIChwYXJzZVpvbmUpIHsgLy8gbGV0J3MgcmVjb3JkIHRoZSBpbnB1dHRlZCB6b25lIHNvbWVob3dcblx0XHRcdGlmIChpc0FtYmlnWm9uZSkge1xuXHRcdFx0XHRtb20uX2FtYmlnWm9uZSA9IHRydWU7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChpc1NpbmdsZVN0cmluZykge1xuXHRcdFx0XHRtb20uem9uZShpbnB1dCk7IC8vIGlmIG5vdCBhIHZhbGlkIHpvbmUsIHdpbGwgYXNzaWduIFVUQ1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdG1vbS5fZnVsbENhbGVuZGFyID0gdHJ1ZTsgLy8gZmxhZyBmb3IgZXh0ZW5kZWQgZnVuY3Rpb25hbGl0eVxuXG5cdHJldHVybiBtb207XG59XG5cblxuLy8gQSBjbG9uZSBtZXRob2QgdGhhdCB3b3JrcyB3aXRoIHRoZSBmbGFncyByZWxhdGVkIHRvIG91ciBlbmhhbmNlZCBmdW5jdGlvbmFsaXR5LlxuLy8gSW4gdGhlIGZ1dHVyZSwgdXNlIG1vbWVudC5tb21lbnRQcm9wZXJ0aWVzXG5uZXdNb21lbnRQcm90by5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgbW9tID0gb2xkTW9tZW50UHJvdG8uY2xvbmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuXHQvLyB0aGVzZSBmbGFncyB3ZXJlbid0IHRyYW5zZmVyZWQgd2l0aCB0aGUgY2xvbmVcblx0dHJhbnNmZXJBbWJpZ3ModGhpcywgbW9tKTtcblx0aWYgKHRoaXMuX2Z1bGxDYWxlbmRhcikge1xuXHRcdG1vbS5fZnVsbENhbGVuZGFyID0gdHJ1ZTtcblx0fVxuXG5cdHJldHVybiBtb207XG59O1xuXG5cbi8vIFRpbWUtb2YtZGF5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIEdFVFRFUlxuLy8gUmV0dXJucyBhIER1cmF0aW9uIHdpdGggdGhlIGhvdXJzL21pbnV0ZXMvc2Vjb25kcy9tcyB2YWx1ZXMgb2YgdGhlIG1vbWVudC5cbi8vIElmIHRoZSBtb21lbnQgaGFzIGFuIGFtYmlndW91cyB0aW1lLCBhIGR1cmF0aW9uIG9mIDAwOjAwIHdpbGwgYmUgcmV0dXJuZWQuXG4vL1xuLy8gU0VUVEVSXG4vLyBZb3UgY2FuIHN1cHBseSBhIER1cmF0aW9uLCBhIE1vbWVudCwgb3IgYSBEdXJhdGlvbi1saWtlIGFyZ3VtZW50LlxuLy8gV2hlbiBzZXR0aW5nIHRoZSB0aW1lLCBhbmQgdGhlIG1vbWVudCBoYXMgYW4gYW1iaWd1b3VzIHRpbWUsIGl0IHRoZW4gYmVjb21lcyB1bmFtYmlndW91cy5cbm5ld01vbWVudFByb3RvLnRpbWUgPSBmdW5jdGlvbih0aW1lKSB7XG5cblx0Ly8gRmFsbGJhY2sgdG8gdGhlIG9yaWdpbmFsIG1ldGhvZCAoaWYgdGhlcmUgaXMgb25lKSBpZiB0aGlzIG1vbWVudCB3YXNuJ3QgY3JlYXRlZCB2aWEgRnVsbENhbGVuZGFyLlxuXHQvLyBgdGltZWAgaXMgYSBnZW5lcmljIGVub3VnaCBtZXRob2QgbmFtZSB3aGVyZSB0aGlzIHByZWNhdXRpb24gaXMgbmVjZXNzYXJ5IHRvIGF2b2lkIGNvbGxpc2lvbnMgdy8gb3RoZXIgcGx1Z2lucy5cblx0aWYgKCF0aGlzLl9mdWxsQ2FsZW5kYXIpIHtcblx0XHRyZXR1cm4gb2xkTW9tZW50UHJvdG8udGltZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHR9XG5cblx0aWYgKHRpbWUgPT0gbnVsbCkgeyAvLyBnZXR0ZXJcblx0XHRyZXR1cm4gbW9tZW50LmR1cmF0aW9uKHtcblx0XHRcdGhvdXJzOiB0aGlzLmhvdXJzKCksXG5cdFx0XHRtaW51dGVzOiB0aGlzLm1pbnV0ZXMoKSxcblx0XHRcdHNlY29uZHM6IHRoaXMuc2Vjb25kcygpLFxuXHRcdFx0bWlsbGlzZWNvbmRzOiB0aGlzLm1pbGxpc2Vjb25kcygpXG5cdFx0fSk7XG5cdH1cblx0ZWxzZSB7IC8vIHNldHRlclxuXG5cdFx0dGhpcy5fYW1iaWdUaW1lID0gZmFsc2U7IC8vIG1hcmsgdGhhdCB0aGUgbW9tZW50IG5vdyBoYXMgYSB0aW1lXG5cblx0XHRpZiAoIW1vbWVudC5pc0R1cmF0aW9uKHRpbWUpICYmICFtb21lbnQuaXNNb21lbnQodGltZSkpIHtcblx0XHRcdHRpbWUgPSBtb21lbnQuZHVyYXRpb24odGltZSk7XG5cdFx0fVxuXG5cdFx0Ly8gVGhlIGRheSB2YWx1ZSBzaG91bGQgY2F1c2Ugb3ZlcmZsb3cgKHNvIDI0IGhvdXJzIGJlY29tZXMgMDA6MDA6MDAgb2YgbmV4dCBkYXkpLlxuXHRcdC8vIE9ubHkgZm9yIER1cmF0aW9uIHRpbWVzLCBub3QgTW9tZW50IHRpbWVzLlxuXHRcdHZhciBkYXlIb3VycyA9IDA7XG5cdFx0aWYgKG1vbWVudC5pc0R1cmF0aW9uKHRpbWUpKSB7XG5cdFx0XHRkYXlIb3VycyA9IE1hdGguZmxvb3IodGltZS5hc0RheXMoKSkgKiAyNDtcblx0XHR9XG5cblx0XHQvLyBXZSBuZWVkIHRvIHNldCB0aGUgaW5kaXZpZHVhbCBmaWVsZHMuXG5cdFx0Ly8gQ2FuJ3QgdXNlIHN0YXJ0T2YoJ2RheScpIHRoZW4gYWRkIGR1cmF0aW9uLiBJbiBjYXNlIG9mIERTVCBhdCBzdGFydCBvZiBkYXkuXG5cdFx0cmV0dXJuIHRoaXMuaG91cnMoZGF5SG91cnMgKyB0aW1lLmhvdXJzKCkpXG5cdFx0XHQubWludXRlcyh0aW1lLm1pbnV0ZXMoKSlcblx0XHRcdC5zZWNvbmRzKHRpbWUuc2Vjb25kcygpKVxuXHRcdFx0Lm1pbGxpc2Vjb25kcyh0aW1lLm1pbGxpc2Vjb25kcygpKTtcblx0fVxufTtcblxuLy8gQ29udmVydHMgdGhlIG1vbWVudCB0byBVVEMsIHN0cmlwcGluZyBvdXQgaXRzIHRpbWUtb2YtZGF5IGFuZCB0aW1lem9uZSBvZmZzZXQsXG4vLyBidXQgcHJlc2VydmluZyBpdHMgWU1ELiBBIG1vbWVudCB3aXRoIGEgc3RyaXBwZWQgdGltZSB3aWxsIGRpc3BsYXkgbm8gdGltZVxuLy8gbm9yIHRpbWV6b25lIG9mZnNldCB3aGVuIC5mb3JtYXQoKSBpcyBjYWxsZWQuXG5uZXdNb21lbnRQcm90by5zdHJpcFRpbWUgPSBmdW5jdGlvbigpIHtcblx0dmFyIGE7XG5cblx0aWYgKCF0aGlzLl9hbWJpZ1RpbWUpIHtcblxuXHRcdC8vIGdldCB0aGUgdmFsdWVzIGJlZm9yZSBhbnkgY29udmVyc2lvbiBoYXBwZW5zXG5cdFx0YSA9IHRoaXMudG9BcnJheSgpOyAvLyBhcnJheSBvZiB5L20vZC9oL20vcy9tc1xuXG5cdFx0dGhpcy51dGMoKTsgLy8gc2V0IHRoZSBpbnRlcm5hbCBVVEMgZmxhZyAod2lsbCBjbGVhciB0aGUgYW1iaWcgZmxhZ3MpXG5cdFx0c2V0VVRDVmFsdWVzKHRoaXMsIGEuc2xpY2UoMCwgMykpOyAvLyBzZXQgdGhlIHllYXIvbW9udGgvZGF0ZS4gdGltZSB3aWxsIGJlIHplcm9cblxuXHRcdC8vIE1hcmsgdGhlIHRpbWUgYXMgYW1iaWd1b3VzLiBUaGlzIG5lZWRzIHRvIGhhcHBlbiBhZnRlciB0aGUgLnV0YygpIGNhbGwsIHdoaWNoIGNhbGxzIC56b25lKCksXG5cdFx0Ly8gd2hpY2ggY2xlYXJzIGFsbCBhbWJpZyBmbGFncy4gU2FtZSB3aXRoIHNldFVUQ1ZhbHVlcyB3aXRoIG1vbWVudC10aW1lem9uZS5cblx0XHR0aGlzLl9hbWJpZ1RpbWUgPSB0cnVlO1xuXHRcdHRoaXMuX2FtYmlnWm9uZSA9IHRydWU7IC8vIGlmIGFtYmlndW91cyB0aW1lLCBhbHNvIGFtYmlndW91cyB0aW1lem9uZSBvZmZzZXRcblx0fVxuXG5cdHJldHVybiB0aGlzOyAvLyBmb3IgY2hhaW5pbmdcbn07XG5cbi8vIFJldHVybnMgaWYgdGhlIG1vbWVudCBoYXMgYSBub24tYW1iaWd1b3VzIHRpbWUgKGJvb2xlYW4pXG5uZXdNb21lbnRQcm90by5oYXNUaW1lID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiAhdGhpcy5fYW1iaWdUaW1lO1xufTtcblxuXG4vLyBUaW1lem9uZVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBDb252ZXJ0cyB0aGUgbW9tZW50IHRvIFVUQywgc3RyaXBwaW5nIG91dCBpdHMgdGltZXpvbmUgb2Zmc2V0LCBidXQgcHJlc2VydmluZyBpdHNcbi8vIFlNRCBhbmQgdGltZS1vZi1kYXkuIEEgbW9tZW50IHdpdGggYSBzdHJpcHBlZCB0aW1lem9uZSBvZmZzZXQgd2lsbCBkaXNwbGF5IG5vXG4vLyB0aW1lem9uZSBvZmZzZXQgd2hlbiAuZm9ybWF0KCkgaXMgY2FsbGVkLlxubmV3TW9tZW50UHJvdG8uc3RyaXBab25lID0gZnVuY3Rpb24oKSB7XG5cdHZhciBhLCB3YXNBbWJpZ1RpbWU7XG5cblx0aWYgKCF0aGlzLl9hbWJpZ1pvbmUpIHtcblxuXHRcdC8vIGdldCB0aGUgdmFsdWVzIGJlZm9yZSBhbnkgY29udmVyc2lvbiBoYXBwZW5zXG5cdFx0YSA9IHRoaXMudG9BcnJheSgpOyAvLyBhcnJheSBvZiB5L20vZC9oL20vcy9tc1xuXHRcdHdhc0FtYmlnVGltZSA9IHRoaXMuX2FtYmlnVGltZTtcblxuXHRcdHRoaXMudXRjKCk7IC8vIHNldCB0aGUgaW50ZXJuYWwgVVRDIGZsYWcgKHdpbGwgY2xlYXIgdGhlIGFtYmlnIGZsYWdzKVxuXHRcdHNldFVUQ1ZhbHVlcyh0aGlzLCBhKTsgLy8gd2lsbCBzZXQgdGhlIHllYXIvbW9udGgvZGF0ZS9ob3Vycy9taW51dGVzL3NlY29uZHMvbXNcblxuXHRcdGlmICh3YXNBbWJpZ1RpbWUpIHtcblx0XHRcdC8vIHRoZSBhYm92ZSBjYWxsIHRvIC51dGMoKS8uem9uZSgpIHVuZm9ydHVuYXRlbHkgY2xlYXJzIHRoZSBhbWJpZyBmbGFncywgc28gcmVhc3NpZ25cblx0XHRcdHRoaXMuX2FtYmlnVGltZSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gTWFyayB0aGUgem9uZSBhcyBhbWJpZ3VvdXMuIFRoaXMgbmVlZHMgdG8gaGFwcGVuIGFmdGVyIHRoZSAudXRjKCkgY2FsbCwgd2hpY2ggY2FsbHMgLnpvbmUoKSxcblx0XHQvLyB3aGljaCBjbGVhcnMgYWxsIGFtYmlnIGZsYWdzLiBTYW1lIHdpdGggc2V0VVRDVmFsdWVzIHdpdGggbW9tZW50LXRpbWV6b25lLlxuXHRcdHRoaXMuX2FtYmlnWm9uZSA9IHRydWU7XG5cdH1cblxuXHRyZXR1cm4gdGhpczsgLy8gZm9yIGNoYWluaW5nXG59O1xuXG4vLyBSZXR1cm5zIG9mIHRoZSBtb21lbnQgaGFzIGEgbm9uLWFtYmlndW91cyB0aW1lem9uZSBvZmZzZXQgKGJvb2xlYW4pXG5uZXdNb21lbnRQcm90by5oYXNab25lID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiAhdGhpcy5fYW1iaWdab25lO1xufTtcblxuLy8gdGhpcyBtZXRob2QgaW1wbGljaXRseSBtYXJrcyBhIHpvbmUgKHdpbGwgZ2V0IGNhbGxlZCB1cG9uIC51dGMoKSBhbmQgLmxvY2FsKCkpXG5uZXdNb21lbnRQcm90by56b25lID0gZnVuY3Rpb24odHpvKSB7XG5cblx0aWYgKHR6byAhPSBudWxsKSB7IC8vIHNldHRlclxuXHRcdC8vIHRoZXNlIGFzc2lnbm1lbnRzIG5lZWRzIHRvIGhhcHBlbiBiZWZvcmUgdGhlIG9yaWdpbmFsIHpvbmUgbWV0aG9kIGlzIGNhbGxlZC5cblx0XHQvLyBJIGZvcmdldCB3aHksIHNvbWV0aGluZyB0byBkbyB3aXRoIGEgYnJvd3NlciBjcmFzaC5cblx0XHR0aGlzLl9hbWJpZ1RpbWUgPSBmYWxzZTtcblx0XHR0aGlzLl9hbWJpZ1pvbmUgPSBmYWxzZTtcblx0fVxuXG5cdHJldHVybiBvbGRNb21lbnRQcm90by56b25lLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG4vLyB0aGlzIG1ldGhvZCBpbXBsaWNpdGx5IG1hcmtzIGEgem9uZVxubmV3TW9tZW50UHJvdG8ubG9jYWwgPSBmdW5jdGlvbigpIHtcblx0dmFyIGEgPSB0aGlzLnRvQXJyYXkoKTsgLy8geWVhcixtb250aCxkYXRlLGhvdXJzLG1pbnV0ZXMsc2Vjb25kcyxtcyBhcyBhbiBhcnJheVxuXHR2YXIgd2FzQW1iaWdab25lID0gdGhpcy5fYW1iaWdab25lO1xuXG5cdG9sZE1vbWVudFByb3RvLmxvY2FsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IC8vIHdpbGwgY2xlYXIgYW1iaWcgZmxhZ3NcblxuXHRpZiAod2FzQW1iaWdab25lKSB7XG5cdFx0Ly8gSWYgdGhlIG1vbWVudCB3YXMgYW1iaWd1b3VzbHkgem9uZWQsIHRoZSBkYXRlIGZpZWxkcyB3ZXJlIHN0b3JlZCBhcyBVVEMuXG5cdFx0Ly8gV2Ugd2FudCB0byBwcmVzZXJ2ZSB0aGVzZSwgYnV0IGluIGxvY2FsIHRpbWUuXG5cdFx0c2V0TG9jYWxWYWx1ZXModGhpcywgYSk7XG5cdH1cblxuXHRyZXR1cm4gdGhpczsgLy8gZm9yIGNoYWluaW5nXG59O1xuXG5cbi8vIEZvcm1hdHRpbmdcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubmV3TW9tZW50UHJvdG8uZm9ybWF0ID0gZnVuY3Rpb24oKSB7XG5cdGlmICh0aGlzLl9mdWxsQ2FsZW5kYXIgJiYgYXJndW1lbnRzWzBdKSB7IC8vIGFuIGVuaGFuY2VkIG1vbWVudD8gYW5kIGEgZm9ybWF0IHN0cmluZyBwcm92aWRlZD9cblx0XHRyZXR1cm4gZm9ybWF0RGF0ZSh0aGlzLCBhcmd1bWVudHNbMF0pOyAvLyBvdXIgZXh0ZW5kZWQgZm9ybWF0dGluZ1xuXHR9XG5cdGlmICh0aGlzLl9hbWJpZ1RpbWUpIHtcblx0XHRyZXR1cm4gb2xkTW9tZW50Rm9ybWF0KHRoaXMsICdZWVlZLU1NLUREJyk7XG5cdH1cblx0aWYgKHRoaXMuX2FtYmlnWm9uZSkge1xuXHRcdHJldHVybiBvbGRNb21lbnRGb3JtYXQodGhpcywgJ1lZWVktTU0tRERbVF1ISDptbTpzcycpO1xuXHR9XG5cdHJldHVybiBvbGRNb21lbnRQcm90by5mb3JtYXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbm5ld01vbWVudFByb3RvLnRvSVNPU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdGlmICh0aGlzLl9hbWJpZ1RpbWUpIHtcblx0XHRyZXR1cm4gb2xkTW9tZW50Rm9ybWF0KHRoaXMsICdZWVlZLU1NLUREJyk7XG5cdH1cblx0aWYgKHRoaXMuX2FtYmlnWm9uZSkge1xuXHRcdHJldHVybiBvbGRNb21lbnRGb3JtYXQodGhpcywgJ1lZWVktTU0tRERbVF1ISDptbTpzcycpO1xuXHR9XG5cdHJldHVybiBvbGRNb21lbnRQcm90by50b0lTT1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxuXG4vLyBRdWVyeWluZ1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBJcyB0aGUgbW9tZW50IHdpdGhpbiB0aGUgc3BlY2lmaWVkIHJhbmdlPyBgZW5kYCBpcyBleGNsdXNpdmUuXG4vLyBGWUksIHRoaXMgbWV0aG9kIGlzIG5vdCBhIHN0YW5kYXJkIE1vbWVudCBtZXRob2QsIHNvIGFsd2F5cyBkbyBvdXIgZW5oYW5jZWQgbG9naWMuXG5uZXdNb21lbnRQcm90by5pc1dpdGhpbiA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcblx0dmFyIGEgPSBjb21tb25seUFtYmlndWF0ZShbIHRoaXMsIHN0YXJ0LCBlbmQgXSk7XG5cdHJldHVybiBhWzBdID49IGFbMV0gJiYgYVswXSA8IGFbMl07XG59O1xuXG4vLyBXaGVuIGlzU2FtZSBpcyBjYWxsZWQgd2l0aCB1bml0cywgdGltZXpvbmUgYW1iaWd1aXR5IGlzIG5vcm1hbGl6ZWQgYmVmb3JlIHRoZSBjb21wYXJpc29uIGhhcHBlbnMuXG4vLyBJZiBubyB1bml0cyBzcGVjaWZpZWQsIHRoZSB0d28gbW9tZW50cyBtdXN0IGJlIGlkZW50aWNhbGx5IHRoZSBzYW1lLCB3aXRoIG1hdGNoaW5nIGFtYmlnIGZsYWdzLlxubmV3TW9tZW50UHJvdG8uaXNTYW1lID0gZnVuY3Rpb24oaW5wdXQsIHVuaXRzKSB7XG5cdHZhciBhO1xuXG5cdC8vIG9ubHkgZG8gY3VzdG9tIGxvZ2ljIGlmIHRoaXMgaXMgYW4gZW5oYW5jZWQgbW9tZW50XG5cdGlmICghdGhpcy5fZnVsbENhbGVuZGFyKSB7XG5cdFx0cmV0dXJuIG9sZE1vbWVudFByb3RvLmlzU2FtZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHR9XG5cblx0aWYgKHVuaXRzKSB7XG5cdFx0YSA9IGNvbW1vbmx5QW1iaWd1YXRlKFsgdGhpcywgaW5wdXQgXSwgdHJ1ZSk7IC8vIG5vcm1hbGl6ZSB0aW1lem9uZXMgYnV0IGRvbid0IGVyYXNlIHRpbWVzXG5cdFx0cmV0dXJuIG9sZE1vbWVudFByb3RvLmlzU2FtZS5jYWxsKGFbMF0sIGFbMV0sIHVuaXRzKTtcblx0fVxuXHRlbHNlIHtcblx0XHRpbnB1dCA9IGZjLm1vbWVudC5wYXJzZVpvbmUoaW5wdXQpOyAvLyBub3JtYWxpemUgaW5wdXRcblx0XHRyZXR1cm4gb2xkTW9tZW50UHJvdG8uaXNTYW1lLmNhbGwodGhpcywgaW5wdXQpICYmXG5cdFx0XHRCb29sZWFuKHRoaXMuX2FtYmlnVGltZSkgPT09IEJvb2xlYW4oaW5wdXQuX2FtYmlnVGltZSkgJiZcblx0XHRcdEJvb2xlYW4odGhpcy5fYW1iaWdab25lKSA9PT0gQm9vbGVhbihpbnB1dC5fYW1iaWdab25lKTtcblx0fVxufTtcblxuLy8gTWFrZSB0aGVzZSBxdWVyeSBtZXRob2RzIHdvcmsgd2l0aCBhbWJpZ3VvdXMgbW9tZW50c1xuJC5lYWNoKFtcblx0J2lzQmVmb3JlJyxcblx0J2lzQWZ0ZXInXG5dLCBmdW5jdGlvbihpLCBtZXRob2ROYW1lKSB7XG5cdG5ld01vbWVudFByb3RvW21ldGhvZE5hbWVdID0gZnVuY3Rpb24oaW5wdXQsIHVuaXRzKSB7XG5cdFx0dmFyIGE7XG5cblx0XHQvLyBvbmx5IGRvIGN1c3RvbSBsb2dpYyBpZiB0aGlzIGlzIGFuIGVuaGFuY2VkIG1vbWVudFxuXHRcdGlmICghdGhpcy5fZnVsbENhbGVuZGFyKSB7XG5cdFx0XHRyZXR1cm4gb2xkTW9tZW50UHJvdG9bbWV0aG9kTmFtZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHR9XG5cblx0XHRhID0gY29tbW9ubHlBbWJpZ3VhdGUoWyB0aGlzLCBpbnB1dCBdKTtcblx0XHRyZXR1cm4gb2xkTW9tZW50UHJvdG9bbWV0aG9kTmFtZV0uY2FsbChhWzBdLCBhWzFdLCB1bml0cyk7XG5cdH07XG59KTtcblxuXG4vLyBNaXNjIEludGVybmFsc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBnaXZlbiBhbiBhcnJheSBvZiBtb21lbnQtbGlrZSBpbnB1dHMsIHJldHVybiBhIHBhcmFsbGVsIGFycmF5IHcvIG1vbWVudHMgc2ltaWxhcmx5IGFtYmlndWF0ZWQuXG4vLyBmb3IgZXhhbXBsZSwgb2Ygb25lIG1vbWVudCBoYXMgYW1iaWcgdGltZSwgYnV0IG5vdCBvdGhlcnMsIGFsbCBtb21lbnRzIHdpbGwgaGF2ZSB0aGVpciB0aW1lIHN0cmlwcGVkLlxuLy8gc2V0IGBwcmVzZXJ2ZVRpbWVgIHRvIGB0cnVlYCB0byBrZWVwIHRpbWVzLCBidXQgb25seSBub3JtYWxpemUgem9uZSBhbWJpZ3VpdHkuXG4vLyByZXR1cm5zIHRoZSBvcmlnaW5hbCBtb21lbnRzIGlmIG5vIG1vZGlmaWNhdGlvbnMgYXJlIG5lY2Vzc2FyeS5cbmZ1bmN0aW9uIGNvbW1vbmx5QW1iaWd1YXRlKGlucHV0cywgcHJlc2VydmVUaW1lKSB7XG5cdHZhciBhbnlBbWJpZ1RpbWUgPSBmYWxzZTtcblx0dmFyIGFueUFtYmlnWm9uZSA9IGZhbHNlO1xuXHR2YXIgbGVuID0gaW5wdXRzLmxlbmd0aDtcblx0dmFyIG1vbXMgPSBbXTtcblx0dmFyIGksIG1vbTtcblxuXHQvLyBwYXJzZSBpbnB1dHMgaW50byByZWFsIG1vbWVudHMgYW5kIHF1ZXJ5IHRoZWlyIGFtYmlnIGZsYWdzXG5cdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdG1vbSA9IGlucHV0c1tpXTtcblx0XHRpZiAoIW1vbWVudC5pc01vbWVudChtb20pKSB7XG5cdFx0XHRtb20gPSBmYy5tb21lbnQucGFyc2Vab25lKG1vbSk7XG5cdFx0fVxuXHRcdGFueUFtYmlnVGltZSA9IGFueUFtYmlnVGltZSB8fCBtb20uX2FtYmlnVGltZTtcblx0XHRhbnlBbWJpZ1pvbmUgPSBhbnlBbWJpZ1pvbmUgfHwgbW9tLl9hbWJpZ1pvbmU7XG5cdFx0bW9tcy5wdXNoKG1vbSk7XG5cdH1cblxuXHQvLyBzdHJpcCBlYWNoIG1vbWVudCBkb3duIHRvIGxvd2VzdCBjb21tb24gYW1iaWd1aXR5XG5cdC8vIHVzZSBjbG9uZXMgdG8gYXZvaWQgbW9kaWZ5aW5nIHRoZSBvcmlnaW5hbCBtb21lbnRzXG5cdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdG1vbSA9IG1vbXNbaV07XG5cdFx0aWYgKCFwcmVzZXJ2ZVRpbWUgJiYgYW55QW1iaWdUaW1lICYmICFtb20uX2FtYmlnVGltZSkge1xuXHRcdFx0bW9tc1tpXSA9IG1vbS5jbG9uZSgpLnN0cmlwVGltZSgpO1xuXHRcdH1cblx0XHRlbHNlIGlmIChhbnlBbWJpZ1pvbmUgJiYgIW1vbS5fYW1iaWdab25lKSB7XG5cdFx0XHRtb21zW2ldID0gbW9tLmNsb25lKCkuc3RyaXBab25lKCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIG1vbXM7XG59XG5cbi8vIFRyYW5zZmVycyBhbGwgdGhlIGZsYWdzIHJlbGF0ZWQgdG8gYW1iaWd1b3VzIHRpbWUvem9uZSBmcm9tIHRoZSBgc3JjYCBtb21lbnQgdG8gdGhlIGBkZXN0YCBtb21lbnRcbmZ1bmN0aW9uIHRyYW5zZmVyQW1iaWdzKHNyYywgZGVzdCkge1xuXHRpZiAoc3JjLl9hbWJpZ1RpbWUpIHtcblx0XHRkZXN0Ll9hbWJpZ1RpbWUgPSB0cnVlO1xuXHR9XG5cdGVsc2UgaWYgKGRlc3QuX2FtYmlnVGltZSkge1xuXHRcdGRlc3QuX2FtYmlnVGltZSA9IGZhbHNlO1xuXHR9XG5cblx0aWYgKHNyYy5fYW1iaWdab25lKSB7XG5cdFx0ZGVzdC5fYW1iaWdab25lID0gdHJ1ZTtcblx0fVxuXHRlbHNlIGlmIChkZXN0Ll9hbWJpZ1pvbmUpIHtcblx0XHRkZXN0Ll9hbWJpZ1pvbmUgPSBmYWxzZTtcblx0fVxufVxuXG5cbi8vIFNldHMgdGhlIHllYXIvbW9udGgvZGF0ZS9ldGMgdmFsdWVzIG9mIHRoZSBtb21lbnQgZnJvbSB0aGUgZ2l2ZW4gYXJyYXkuXG4vLyBJbmVmZmljaWVudCBiZWNhdXNlIGl0IGNhbGxzIGVhY2ggaW5kaXZpZHVhbCBzZXR0ZXIuXG5mdW5jdGlvbiBzZXRNb21lbnRWYWx1ZXMobW9tLCBhKSB7XG5cdG1vbS55ZWFyKGFbMF0gfHwgMClcblx0XHQubW9udGgoYVsxXSB8fCAwKVxuXHRcdC5kYXRlKGFbMl0gfHwgMClcblx0XHQuaG91cnMoYVszXSB8fCAwKVxuXHRcdC5taW51dGVzKGFbNF0gfHwgMClcblx0XHQuc2Vjb25kcyhhWzVdIHx8IDApXG5cdFx0Lm1pbGxpc2Vjb25kcyhhWzZdIHx8IDApO1xufVxuXG4vLyBDYW4gd2Ugc2V0IHRoZSBtb21lbnQncyBpbnRlcm5hbCBkYXRlIGRpcmVjdGx5P1xuYWxsb3dWYWx1ZU9wdGltaXphdGlvbiA9ICdfZCcgaW4gbW9tZW50KCkgJiYgJ3VwZGF0ZU9mZnNldCcgaW4gbW9tZW50O1xuXG4vLyBVdGlsaXR5IGZ1bmN0aW9uLiBBY2NlcHRzIGEgbW9tZW50IGFuZCBhbiBhcnJheSBvZiB0aGUgVVRDIHllYXIvbW9udGgvZGF0ZS9ldGMgdmFsdWVzIHRvIHNldC5cbi8vIEFzc3VtZXMgdGhlIGdpdmVuIG1vbWVudCBpcyBhbHJlYWR5IGluIFVUQyBtb2RlLlxuc2V0VVRDVmFsdWVzID0gYWxsb3dWYWx1ZU9wdGltaXphdGlvbiA/IGZ1bmN0aW9uKG1vbSwgYSkge1xuXHQvLyBzaW1sYXRlIHdoYXQgbW9tZW50J3MgYWNjZXNzb3JzIGRvXG5cdG1vbS5fZC5zZXRUaW1lKERhdGUuVVRDLmFwcGx5KERhdGUsIGEpKTtcblx0bW9tZW50LnVwZGF0ZU9mZnNldChtb20sIGZhbHNlKTsgLy8ga2VlcFRpbWU9ZmFsc2Vcbn0gOiBzZXRNb21lbnRWYWx1ZXM7XG5cbi8vIFV0aWxpdHkgZnVuY3Rpb24uIEFjY2VwdHMgYSBtb21lbnQgYW5kIGFuIGFycmF5IG9mIHRoZSBsb2NhbCB5ZWFyL21vbnRoL2RhdGUvZXRjIHZhbHVlcyB0byBzZXQuXG4vLyBBc3N1bWVzIHRoZSBnaXZlbiBtb21lbnQgaXMgYWxyZWFkeSBpbiBsb2NhbCBtb2RlLlxuc2V0TG9jYWxWYWx1ZXMgPSBhbGxvd1ZhbHVlT3B0aW1pemF0aW9uID8gZnVuY3Rpb24obW9tLCBhKSB7XG5cdC8vIHNpbWxhdGUgd2hhdCBtb21lbnQncyBhY2Nlc3NvcnMgZG9cblx0bW9tLl9kLnNldFRpbWUoK25ldyBEYXRlKCAvLyBGWUksIHRoZXJlIGlzIG5vdyB3YXkgdG8gYXBwbHkgYW4gYXJyYXkgb2YgYXJncyB0byBhIGNvbnN0cnVjdG9yXG5cdFx0YVswXSB8fCAwLFxuXHRcdGFbMV0gfHwgMCxcblx0XHRhWzJdIHx8IDAsXG5cdFx0YVszXSB8fCAwLFxuXHRcdGFbNF0gfHwgMCxcblx0XHRhWzVdIHx8IDAsXG5cdFx0YVs2XSB8fCAwXG5cdCkpO1xuXHRtb21lbnQudXBkYXRlT2Zmc2V0KG1vbSwgZmFsc2UpOyAvLyBrZWVwVGltZT1mYWxzZVxufSA6IHNldE1vbWVudFZhbHVlcztcblxuLy8gU2luZ2xlIERhdGUgRm9ybWF0dGluZ1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbi8vIGNhbGwgdGhpcyBpZiB5b3Ugd2FudCBNb21lbnQncyBvcmlnaW5hbCBmb3JtYXQgbWV0aG9kIHRvIGJlIHVzZWRcbmZ1bmN0aW9uIG9sZE1vbWVudEZvcm1hdChtb20sIGZvcm1hdFN0cikge1xuXHRyZXR1cm4gb2xkTW9tZW50UHJvdG8uZm9ybWF0LmNhbGwobW9tLCBmb3JtYXRTdHIpOyAvLyBvbGRNb21lbnRQcm90byBkZWZpbmVkIGluIG1vbWVudC1leHQuanNcbn1cblxuXG4vLyBGb3JtYXRzIGBkYXRlYCB3aXRoIGEgTW9tZW50IGZvcm1hdHRpbmcgc3RyaW5nLCBidXQgYWxsb3cgb3VyIG5vbi16ZXJvIGFyZWFzIGFuZFxuLy8gYWRkaXRpb25hbCB0b2tlbi5cbmZ1bmN0aW9uIGZvcm1hdERhdGUoZGF0ZSwgZm9ybWF0U3RyKSB7XG5cdHJldHVybiBmb3JtYXREYXRlV2l0aENodW5rcyhkYXRlLCBnZXRGb3JtYXRTdHJpbmdDaHVua3MoZm9ybWF0U3RyKSk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RGF0ZVdpdGhDaHVua3MoZGF0ZSwgY2h1bmtzKSB7XG5cdHZhciBzID0gJyc7XG5cdHZhciBpO1xuXG5cdGZvciAoaT0wOyBpPGNodW5rcy5sZW5ndGg7IGkrKykge1xuXHRcdHMgKz0gZm9ybWF0RGF0ZVdpdGhDaHVuayhkYXRlLCBjaHVua3NbaV0pO1xuXHR9XG5cblx0cmV0dXJuIHM7XG59XG5cblxuLy8gYWRkaXRpb24gZm9ybWF0dGluZyB0b2tlbnMgd2Ugd2FudCByZWNvZ25pemVkXG52YXIgdG9rZW5PdmVycmlkZXMgPSB7XG5cdHQ6IGZ1bmN0aW9uKGRhdGUpIHsgLy8gXCJhXCIgb3IgXCJwXCJcblx0XHRyZXR1cm4gb2xkTW9tZW50Rm9ybWF0KGRhdGUsICdhJykuY2hhckF0KDApO1xuXHR9LFxuXHRUOiBmdW5jdGlvbihkYXRlKSB7IC8vIFwiQVwiIG9yIFwiUFwiXG5cdFx0cmV0dXJuIG9sZE1vbWVudEZvcm1hdChkYXRlLCAnQScpLmNoYXJBdCgwKTtcblx0fVxufTtcblxuXG5mdW5jdGlvbiBmb3JtYXREYXRlV2l0aENodW5rKGRhdGUsIGNodW5rKSB7XG5cdHZhciB0b2tlbjtcblx0dmFyIG1heWJlU3RyO1xuXG5cdGlmICh0eXBlb2YgY2h1bmsgPT09ICdzdHJpbmcnKSB7IC8vIGEgbGl0ZXJhbCBzdHJpbmdcblx0XHRyZXR1cm4gY2h1bms7XG5cdH1cblx0ZWxzZSBpZiAoKHRva2VuID0gY2h1bmsudG9rZW4pKSB7IC8vIGEgdG9rZW4sIGxpa2UgXCJZWVlZXCJcblx0XHRpZiAodG9rZW5PdmVycmlkZXNbdG9rZW5dKSB7XG5cdFx0XHRyZXR1cm4gdG9rZW5PdmVycmlkZXNbdG9rZW5dKGRhdGUpOyAvLyB1c2Ugb3VyIGN1c3RvbSB0b2tlblxuXHRcdH1cblx0XHRyZXR1cm4gb2xkTW9tZW50Rm9ybWF0KGRhdGUsIHRva2VuKTtcblx0fVxuXHRlbHNlIGlmIChjaHVuay5tYXliZSkgeyAvLyBhIGdyb3VwaW5nIG9mIG90aGVyIGNodW5rcyB0aGF0IG11c3QgYmUgbm9uLXplcm9cblx0XHRtYXliZVN0ciA9IGZvcm1hdERhdGVXaXRoQ2h1bmtzKGRhdGUsIGNodW5rLm1heWJlKTtcblx0XHRpZiAobWF5YmVTdHIubWF0Y2goL1sxLTldLykpIHtcblx0XHRcdHJldHVybiBtYXliZVN0cjtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gJyc7XG59XG5cblxuLy8gRGF0ZSBSYW5nZSBGb3JtYXR0aW5nXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBUT0RPOiBtYWtlIGl0IHdvcmsgd2l0aCB0aW1lem9uZSBvZmZzZXRcblxuLy8gVXNpbmcgYSBmb3JtYXR0aW5nIHN0cmluZyBtZWFudCBmb3IgYSBzaW5nbGUgZGF0ZSwgZ2VuZXJhdGUgYSByYW5nZSBzdHJpbmcsIGxpa2Vcbi8vIFwiU2VwIDIgLSA5IDIwMTNcIiwgdGhhdCBpbnRlbGxpZ2VudGx5IGluc2VydHMgYSBzZXBhcmF0b3Igd2hlcmUgdGhlIGRhdGVzIGRpZmZlci5cbi8vIElmIHRoZSBkYXRlcyBhcmUgdGhlIHNhbWUgYXMgZmFyIGFzIHRoZSBmb3JtYXQgc3RyaW5nIGlzIGNvbmNlcm5lZCwganVzdCByZXR1cm4gYSBzaW5nbGVcbi8vIHJlbmRlcmluZyBvZiBvbmUgZGF0ZSwgd2l0aG91dCBhbnkgc2VwYXJhdG9yLlxuZnVuY3Rpb24gZm9ybWF0UmFuZ2UoZGF0ZTEsIGRhdGUyLCBmb3JtYXRTdHIsIHNlcGFyYXRvciwgaXNSVEwpIHtcblx0dmFyIGxvY2FsZURhdGE7XG5cblx0ZGF0ZTEgPSBmYy5tb21lbnQucGFyc2Vab25lKGRhdGUxKTtcblx0ZGF0ZTIgPSBmYy5tb21lbnQucGFyc2Vab25lKGRhdGUyKTtcblxuXHRsb2NhbGVEYXRhID0gKGRhdGUxLmxvY2FsZURhdGEgfHwgZGF0ZTEubGFuZykuY2FsbChkYXRlMSk7IC8vIHdvcmtzIHdpdGggbW9tZW50LXByZS0yLjhcblxuXHQvLyBFeHBhbmQgbG9jYWxpemVkIGZvcm1hdCBzdHJpbmdzLCBsaWtlIFwiTExcIiAtPiBcIk1NTU0gRCBZWVlZXCJcblx0Zm9ybWF0U3RyID0gbG9jYWxlRGF0YS5sb25nRGF0ZUZvcm1hdChmb3JtYXRTdHIpIHx8IGZvcm1hdFN0cjtcblx0Ly8gQlRXLCB0aGlzIGlzIG5vdCBpbXBvcnRhbnQgZm9yIGBmb3JtYXREYXRlYCBiZWNhdXNlIGl0IGlzIGltcG9zc2libGUgdG8gcHV0IGN1c3RvbSB0b2tlbnNcblx0Ly8gb3Igbm9uLXplcm8gYXJlYXMgaW4gTW9tZW50J3MgbG9jYWxpemVkIGZvcm1hdCBzdHJpbmdzLlxuXG5cdHNlcGFyYXRvciA9IHNlcGFyYXRvciB8fCAnIC0gJztcblxuXHRyZXR1cm4gZm9ybWF0UmFuZ2VXaXRoQ2h1bmtzKFxuXHRcdGRhdGUxLFxuXHRcdGRhdGUyLFxuXHRcdGdldEZvcm1hdFN0cmluZ0NodW5rcyhmb3JtYXRTdHIpLFxuXHRcdHNlcGFyYXRvcixcblx0XHRpc1JUTFxuXHQpO1xufVxuZmMuZm9ybWF0UmFuZ2UgPSBmb3JtYXRSYW5nZTsgLy8gZXhwb3NlXG5cblxuZnVuY3Rpb24gZm9ybWF0UmFuZ2VXaXRoQ2h1bmtzKGRhdGUxLCBkYXRlMiwgY2h1bmtzLCBzZXBhcmF0b3IsIGlzUlRMKSB7XG5cdHZhciBjaHVua1N0cjsgLy8gdGhlIHJlbmRlcmluZyBvZiB0aGUgY2h1bmtcblx0dmFyIGxlZnRJO1xuXHR2YXIgbGVmdFN0ciA9ICcnO1xuXHR2YXIgcmlnaHRJO1xuXHR2YXIgcmlnaHRTdHIgPSAnJztcblx0dmFyIG1pZGRsZUk7XG5cdHZhciBtaWRkbGVTdHIxID0gJyc7XG5cdHZhciBtaWRkbGVTdHIyID0gJyc7XG5cdHZhciBtaWRkbGVTdHIgPSAnJztcblxuXHQvLyBTdGFydCBhdCB0aGUgbGVmdG1vc3Qgc2lkZSBvZiB0aGUgZm9ybWF0dGluZyBzdHJpbmcgYW5kIGNvbnRpbnVlIHVudGlsIHlvdSBoaXQgYSB0b2tlblxuXHQvLyB0aGF0IGlzIG5vdCB0aGUgc2FtZSBiZXR3ZWVuIGRhdGVzLlxuXHRmb3IgKGxlZnRJPTA7IGxlZnRJPGNodW5rcy5sZW5ndGg7IGxlZnRJKyspIHtcblx0XHRjaHVua1N0ciA9IGZvcm1hdFNpbWlsYXJDaHVuayhkYXRlMSwgZGF0ZTIsIGNodW5rc1tsZWZ0SV0pO1xuXHRcdGlmIChjaHVua1N0ciA9PT0gZmFsc2UpIHtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRsZWZ0U3RyICs9IGNodW5rU3RyO1xuXHR9XG5cblx0Ly8gU2ltaWxhcmx5LCBzdGFydCBhdCB0aGUgcmlnaHRtb3N0IHNpZGUgb2YgdGhlIGZvcm1hdHRpbmcgc3RyaW5nIGFuZCBtb3ZlIGxlZnRcblx0Zm9yIChyaWdodEk9Y2h1bmtzLmxlbmd0aC0xOyByaWdodEk+bGVmdEk7IHJpZ2h0SS0tKSB7XG5cdFx0Y2h1bmtTdHIgPSBmb3JtYXRTaW1pbGFyQ2h1bmsoZGF0ZTEsIGRhdGUyLCBjaHVua3NbcmlnaHRJXSk7XG5cdFx0aWYgKGNodW5rU3RyID09PSBmYWxzZSkge1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdHJpZ2h0U3RyID0gY2h1bmtTdHIgKyByaWdodFN0cjtcblx0fVxuXG5cdC8vIFRoZSBhcmVhIGluIHRoZSBtaWRkbGUgaXMgZGlmZmVyZW50IGZvciBib3RoIG9mIHRoZSBkYXRlcy5cblx0Ly8gQ29sbGVjdCB0aGVtIGRpc3RpbmN0bHkgc28gd2UgY2FuIGphbSB0aGVtIHRvZ2V0aGVyIGxhdGVyLlxuXHRmb3IgKG1pZGRsZUk9bGVmdEk7IG1pZGRsZUk8PXJpZ2h0STsgbWlkZGxlSSsrKSB7XG5cdFx0bWlkZGxlU3RyMSArPSBmb3JtYXREYXRlV2l0aENodW5rKGRhdGUxLCBjaHVua3NbbWlkZGxlSV0pO1xuXHRcdG1pZGRsZVN0cjIgKz0gZm9ybWF0RGF0ZVdpdGhDaHVuayhkYXRlMiwgY2h1bmtzW21pZGRsZUldKTtcblx0fVxuXG5cdGlmIChtaWRkbGVTdHIxIHx8IG1pZGRsZVN0cjIpIHtcblx0XHRpZiAoaXNSVEwpIHtcblx0XHRcdG1pZGRsZVN0ciA9IG1pZGRsZVN0cjIgKyBzZXBhcmF0b3IgKyBtaWRkbGVTdHIxO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdG1pZGRsZVN0ciA9IG1pZGRsZVN0cjEgKyBzZXBhcmF0b3IgKyBtaWRkbGVTdHIyO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBsZWZ0U3RyICsgbWlkZGxlU3RyICsgcmlnaHRTdHI7XG59XG5cblxudmFyIHNpbWlsYXJVbml0TWFwID0ge1xuXHRZOiAneWVhcicsXG5cdE06ICdtb250aCcsXG5cdEQ6ICdkYXknLCAvLyBkYXkgb2YgbW9udGhcblx0ZDogJ2RheScsIC8vIGRheSBvZiB3ZWVrXG5cdC8vIHByZXZlbnRzIGEgc2VwYXJhdG9yIGJldHdlZW4gYW55dGhpbmcgdGltZS1yZWxhdGVkLi4uXG5cdEE6ICdzZWNvbmQnLCAvLyBBTS9QTVxuXHRhOiAnc2Vjb25kJywgLy8gYW0vcG1cblx0VDogJ3NlY29uZCcsIC8vIEEvUFxuXHR0OiAnc2Vjb25kJywgLy8gYS9wXG5cdEg6ICdzZWNvbmQnLCAvLyBob3VyICgyNClcblx0aDogJ3NlY29uZCcsIC8vIGhvdXIgKDEyKVxuXHRtOiAnc2Vjb25kJywgLy8gbWludXRlXG5cdHM6ICdzZWNvbmQnIC8vIHNlY29uZFxufTtcbi8vIFRPRE86IHdlZWsgbWF5YmU/XG5cblxuLy8gR2l2ZW4gYSBmb3JtYXR0aW5nIGNodW5rLCBhbmQgZ2l2ZW4gdGhhdCBib3RoIGRhdGVzIGFyZSBzaW1pbGFyIGluIHRoZSByZWdhcmQgdGhlXG4vLyBmb3JtYXR0aW5nIGNodW5rIGlzIGNvbmNlcm5lZCwgZm9ybWF0IGRhdGUxIGFnYWluc3QgYGNodW5rYC4gT3RoZXJ3aXNlLCByZXR1cm4gYGZhbHNlYC5cbmZ1bmN0aW9uIGZvcm1hdFNpbWlsYXJDaHVuayhkYXRlMSwgZGF0ZTIsIGNodW5rKSB7XG5cdHZhciB0b2tlbjtcblx0dmFyIHVuaXQ7XG5cblx0aWYgKHR5cGVvZiBjaHVuayA9PT0gJ3N0cmluZycpIHsgLy8gYSBsaXRlcmFsIHN0cmluZ1xuXHRcdHJldHVybiBjaHVuaztcblx0fVxuXHRlbHNlIGlmICgodG9rZW4gPSBjaHVuay50b2tlbikpIHtcblx0XHR1bml0ID0gc2ltaWxhclVuaXRNYXBbdG9rZW4uY2hhckF0KDApXTtcblx0XHQvLyBhcmUgdGhlIGRhdGVzIHRoZSBzYW1lIGZvciB0aGlzIHVuaXQgb2YgbWVhc3VyZW1lbnQ/XG5cdFx0aWYgKHVuaXQgJiYgZGF0ZTEuaXNTYW1lKGRhdGUyLCB1bml0KSkge1xuXHRcdFx0cmV0dXJuIG9sZE1vbWVudEZvcm1hdChkYXRlMSwgdG9rZW4pOyAvLyB3b3VsZCBiZSB0aGUgc2FtZSBpZiB3ZSB1c2VkIGBkYXRlMmBcblx0XHRcdC8vIEJUVywgZG9uJ3Qgc3VwcG9ydCBjdXN0b20gdG9rZW5zXG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGZhbHNlOyAvLyB0aGUgY2h1bmsgaXMgTk9UIHRoZSBzYW1lIGZvciB0aGUgdHdvIGRhdGVzXG5cdC8vIEJUVywgZG9uJ3Qgc3VwcG9ydCBzcGxpdHRpbmcgb24gbm9uLXplcm8gYXJlYXNcbn1cblxuXG4vLyBDaHVua2luZyBVdGlsc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbnZhciBmb3JtYXRTdHJpbmdDaHVua0NhY2hlID0ge307XG5cblxuZnVuY3Rpb24gZ2V0Rm9ybWF0U3RyaW5nQ2h1bmtzKGZvcm1hdFN0cikge1xuXHRpZiAoZm9ybWF0U3RyIGluIGZvcm1hdFN0cmluZ0NodW5rQ2FjaGUpIHtcblx0XHRyZXR1cm4gZm9ybWF0U3RyaW5nQ2h1bmtDYWNoZVtmb3JtYXRTdHJdO1xuXHR9XG5cdHJldHVybiAoZm9ybWF0U3RyaW5nQ2h1bmtDYWNoZVtmb3JtYXRTdHJdID0gY2h1bmtGb3JtYXRTdHJpbmcoZm9ybWF0U3RyKSk7XG59XG5cblxuLy8gQnJlYWsgdGhlIGZvcm1hdHRpbmcgc3RyaW5nIGludG8gYW4gYXJyYXkgb2YgY2h1bmtzXG5mdW5jdGlvbiBjaHVua0Zvcm1hdFN0cmluZyhmb3JtYXRTdHIpIHtcblx0dmFyIGNodW5rcyA9IFtdO1xuXHR2YXIgY2h1bmtlciA9IC9cXFsoW15cXF1dKilcXF18XFwoKFteXFwpXSopXFwpfChMVHwoXFx3KVxcNCpvPyl8KFteXFx3XFxbXFwoXSspL2c7IC8vIFRPRE86IG1vcmUgZGVzY3JpbWluYXRpb25cblx0dmFyIG1hdGNoO1xuXG5cdHdoaWxlICgobWF0Y2ggPSBjaHVua2VyLmV4ZWMoZm9ybWF0U3RyKSkpIHtcblx0XHRpZiAobWF0Y2hbMV0pIHsgLy8gYSBsaXRlcmFsIHN0cmluZyBpbnNpZGUgWyAuLi4gXVxuXHRcdFx0Y2h1bmtzLnB1c2gobWF0Y2hbMV0pO1xuXHRcdH1cblx0XHRlbHNlIGlmIChtYXRjaFsyXSkgeyAvLyBub24temVybyBmb3JtYXR0aW5nIGluc2lkZSAoIC4uLiApXG5cdFx0XHRjaHVua3MucHVzaCh7IG1heWJlOiBjaHVua0Zvcm1hdFN0cmluZyhtYXRjaFsyXSkgfSk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKG1hdGNoWzNdKSB7IC8vIGEgZm9ybWF0dGluZyB0b2tlblxuXHRcdFx0Y2h1bmtzLnB1c2goeyB0b2tlbjogbWF0Y2hbM10gfSk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKG1hdGNoWzVdKSB7IC8vIGFuIHVuZW5jbG9zZWQgbGl0ZXJhbCBzdHJpbmdcblx0XHRcdGNodW5rcy5wdXNoKG1hdGNoWzVdKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gY2h1bmtzO1xufVxuXG4gICAgZmMuQ2xhc3MgPSBDbGFzczsgLy8gZXhwb3J0XG5cbi8vIGNsYXNzIHRoYXQgYWxsIG90aGVyIGNsYXNzZXMgd2lsbCBpbmhlcml0IGZyb21cbmZ1bmN0aW9uIENsYXNzKCkgeyB9XG5cbi8vIGNhbGxlZCB1cG9uIGEgY2xhc3MgdG8gY3JlYXRlIGEgc3ViY2xhc3NcbkNsYXNzLmV4dGVuZCA9IGZ1bmN0aW9uKG1lbWJlcnMpIHtcblx0dmFyIHN1cGVyQ2xhc3MgPSB0aGlzO1xuXHR2YXIgc3ViQ2xhc3M7XG5cblx0bWVtYmVycyA9IG1lbWJlcnMgfHwge307XG5cblx0Ly8gZW5zdXJlIGEgY29uc3RydWN0b3IgZm9yIHRoZSBzdWJjbGFzcywgZm9yd2FyZGluZyBhbGwgYXJndW1lbnRzIHRvIHRoZSBzdXBlci1jb25zdHJ1Y3RvciBpZiBpdCBkb2Vzbid0IGV4aXN0XG5cdGlmIChoYXNPd25Qcm9wKG1lbWJlcnMsICdjb25zdHJ1Y3RvcicpKSB7XG5cdFx0c3ViQ2xhc3MgPSBtZW1iZXJzLmNvbnN0cnVjdG9yO1xuXHR9XG5cdGlmICh0eXBlb2Ygc3ViQ2xhc3MgIT09ICdmdW5jdGlvbicpIHtcblx0XHRzdWJDbGFzcyA9IG1lbWJlcnMuY29uc3RydWN0b3IgPSBmdW5jdGlvbigpIHtcblx0XHRcdHN1cGVyQ2xhc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHR9O1xuXHR9XG5cblx0Ly8gYnVpbGQgdGhlIGJhc2UgcHJvdG90eXBlIGZvciB0aGUgc3ViY2xhc3MsIHdoaWNoIGlzIGFuIG5ldyBvYmplY3QgY2hhaW5lZCB0byB0aGUgc3VwZXJjbGFzcydzIHByb3RvdHlwZVxuXHRzdWJDbGFzcy5wcm90b3R5cGUgPSBjcmVhdGVPYmplY3Qoc3VwZXJDbGFzcy5wcm90b3R5cGUpO1xuXG5cdC8vIGNvcHkgZWFjaCBtZW1iZXIgdmFyaWFibGUvbWV0aG9kIG9udG8gdGhlIHRoZSBzdWJjbGFzcydzIHByb3RvdHlwZVxuXHRjb3B5T3duUHJvcHMobWVtYmVycywgc3ViQ2xhc3MucHJvdG90eXBlKTtcblxuXHQvLyBjb3B5IG92ZXIgYWxsIGNsYXNzIHZhcmlhYmxlcy9tZXRob2RzIHRvIHRoZSBzdWJjbGFzcywgc3VjaCBhcyBgZXh0ZW5kYCBhbmQgYG1peGluYFxuXHRjb3B5T3duUHJvcHMoc3VwZXJDbGFzcywgc3ViQ2xhc3MpO1xuXG5cdHJldHVybiBzdWJDbGFzcztcbn07XG5cbi8vIGFkZHMgbmV3IG1lbWJlciB2YXJpYWJsZXMvbWV0aG9kcyB0byB0aGUgY2xhc3MncyBwcm90b3R5cGUuXG4vLyBjYW4gYmUgY2FsbGVkIHdpdGggYW5vdGhlciBjbGFzcywgb3IgYSBwbGFpbiBvYmplY3QgaGFzaCBjb250YWluaW5nIG5ldyBtZW1iZXJzLlxuQ2xhc3MubWl4aW4gPSBmdW5jdGlvbihtZW1iZXJzKSB7XG5cdGNvcHlPd25Qcm9wcyhtZW1iZXJzLnByb3RvdHlwZSB8fCBtZW1iZXJzLCB0aGlzLnByb3RvdHlwZSk7XG59O1xuICAgIC8qIEEgcmVjdGFuZ3VsYXIgcGFuZWwgdGhhdCBpcyBhYnNvbHV0ZWx5IHBvc2l0aW9uZWQgb3ZlciBvdGhlciBjb250ZW50XG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbk9wdGlvbnM6XG5cdC0gY2xhc3NOYW1lIChzdHJpbmcpXG5cdC0gY29udGVudCAoSFRNTCBzdHJpbmcgb3IgalF1ZXJ5IGVsZW1lbnQgc2V0KVxuXHQtIHBhcmVudEVsXG5cdC0gdG9wXG5cdC0gbGVmdFxuXHQtIHJpZ2h0ICh0aGUgeCBjb29yZCBvZiB3aGVyZSB0aGUgcmlnaHQgZWRnZSBzaG91bGQgYmUuIG5vdCBhIFwiQ1NTXCIgcmlnaHQpXG5cdC0gYXV0b0hpZGUgKGJvb2xlYW4pXG5cdC0gc2hvdyAoY2FsbGJhY2spXG5cdC0gaGlkZSAoY2FsbGJhY2spXG4qL1xuXG52YXIgUG9wb3ZlciA9IENsYXNzLmV4dGVuZCh7XG5cblx0aXNIaWRkZW46IHRydWUsXG5cdG9wdGlvbnM6IG51bGwsXG5cdGVsOiBudWxsLCAvLyB0aGUgY29udGFpbmVyIGVsZW1lbnQgZm9yIHRoZSBwb3BvdmVyLiBnZW5lcmF0ZWQgYnkgdGhpcyBvYmplY3Rcblx0ZG9jdW1lbnRNb3VzZWRvd25Qcm94eTogbnVsbCwgLy8gZG9jdW1lbnQgbW91c2Vkb3duIGhhbmRsZXIgYm91bmQgdG8gYHRoaXNgXG5cdG1hcmdpbjogMTAsIC8vIHRoZSBzcGFjZSByZXF1aXJlZCBiZXR3ZWVuIHRoZSBwb3BvdmVyIGFuZCB0aGUgZWRnZXMgb2YgdGhlIHNjcm9sbCBjb250YWluZXJcblxuXG5cdGNvbnN0cnVjdG9yOiBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0dGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0fSxcblxuXG5cdC8vIFNob3dzIHRoZSBwb3BvdmVyIG9uIHRoZSBzcGVjaWZpZWQgcG9zaXRpb24uIFJlbmRlcnMgaXQgaWYgbm90IGFscmVhZHlcblx0c2hvdzogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuaXNIaWRkZW4pIHtcblx0XHRcdGlmICghdGhpcy5lbCkge1xuXHRcdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5lbC5zaG93KCk7XG5cdFx0XHR0aGlzLnBvc2l0aW9uKCk7XG5cdFx0XHR0aGlzLmlzSGlkZGVuID0gZmFsc2U7XG5cdFx0XHR0aGlzLnRyaWdnZXIoJ3Nob3cnKTtcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBIaWRlcyB0aGUgcG9wb3ZlciwgdGhyb3VnaCBDU1MsIGJ1dCBkb2VzIG5vdCByZW1vdmUgaXQgZnJvbSB0aGUgRE9NXG5cdGhpZGU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghdGhpcy5pc0hpZGRlbikge1xuXHRcdFx0dGhpcy5lbC5oaWRlKCk7XG5cdFx0XHR0aGlzLmlzSGlkZGVuID0gdHJ1ZTtcblx0XHRcdHRoaXMudHJpZ2dlcignaGlkZScpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIENyZWF0ZXMgYHRoaXMuZWxgIGFuZCByZW5kZXJzIGNvbnRlbnQgaW5zaWRlIG9mIGl0XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIF90aGlzID0gdGhpcztcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuXHRcdHRoaXMuZWwgPSAkKCc8ZGl2IGNsYXNzPVwiZmMtcG9wb3ZlclwiLz4nKVxuXHRcdFx0LmFkZENsYXNzKG9wdGlvbnMuY2xhc3NOYW1lIHx8ICcnKVxuXHRcdFx0LmNzcyh7XG5cdFx0XHRcdC8vIHBvc2l0aW9uIGluaXRpYWxseSB0byB0aGUgdG9wIGxlZnQgdG8gYXZvaWQgY3JlYXRpbmcgc2Nyb2xsYmFyc1xuXHRcdFx0XHR0b3A6IDAsXG5cdFx0XHRcdGxlZnQ6IDBcblx0XHRcdH0pXG5cdFx0XHQuYXBwZW5kKG9wdGlvbnMuY29udGVudClcblx0XHRcdC5hcHBlbmRUbyhvcHRpb25zLnBhcmVudEVsKTtcblxuXHRcdC8vIHdoZW4gYSBjbGljayBoYXBwZW5zIG9uIGFueXRoaW5nIGluc2lkZSB3aXRoIGEgJ2ZjLWNsb3NlJyBjbGFzc05hbWUsIGhpZGUgdGhlIHBvcG92ZXJcblx0XHR0aGlzLmVsLm9uKCdjbGljaycsICcuZmMtY2xvc2UnLCBmdW5jdGlvbigpIHtcblx0XHRcdF90aGlzLmhpZGUoKTtcblx0XHR9KTtcblxuXHRcdGlmIChvcHRpb25zLmF1dG9IaWRlKSB7XG5cdFx0XHQkKGRvY3VtZW50KS5vbignbW91c2Vkb3duJywgdGhpcy5kb2N1bWVudE1vdXNlZG93blByb3h5ID0gJC5wcm94eSh0aGlzLCAnZG9jdW1lbnRNb3VzZWRvd24nKSk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gVHJpZ2dlcmVkIHdoZW4gdGhlIHVzZXIgY2xpY2tzICphbnl3aGVyZSogaW4gdGhlIGRvY3VtZW50LCBmb3IgdGhlIGF1dG9IaWRlIGZlYXR1cmVcblx0ZG9jdW1lbnRNb3VzZWRvd246IGZ1bmN0aW9uKGV2KSB7XG5cdFx0Ly8gb25seSBoaWRlIHRoZSBwb3BvdmVyIGlmIHRoZSBjbGljayBoYXBwZW5lZCBvdXRzaWRlIHRoZSBwb3BvdmVyXG5cdFx0aWYgKHRoaXMuZWwgJiYgISQoZXYudGFyZ2V0KS5jbG9zZXN0KHRoaXMuZWwpLmxlbmd0aCkge1xuXHRcdFx0dGhpcy5oaWRlKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gSGlkZXMgYW5kIHVucmVnaXN0ZXJzIGFueSBoYW5kbGVyc1xuXHRkZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmhpZGUoKTtcblxuXHRcdGlmICh0aGlzLmVsKSB7XG5cdFx0XHR0aGlzLmVsLnJlbW92ZSgpO1xuXHRcdFx0dGhpcy5lbCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZWRvd24nLCB0aGlzLmRvY3VtZW50TW91c2Vkb3duUHJveHkpO1xuXHR9LFxuXG5cblx0Ly8gUG9zaXRpb25zIHRoZSBwb3BvdmVyIG9wdGltYWxseSwgdXNpbmcgdGhlIHRvcC9sZWZ0L3JpZ2h0IG9wdGlvbnNcblx0cG9zaXRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXHRcdHZhciBvcmlnaW4gPSB0aGlzLmVsLm9mZnNldFBhcmVudCgpLm9mZnNldCgpO1xuXHRcdHZhciB3aWR0aCA9IHRoaXMuZWwub3V0ZXJXaWR0aCgpO1xuXHRcdHZhciBoZWlnaHQgPSB0aGlzLmVsLm91dGVySGVpZ2h0KCk7XG5cdFx0dmFyIHdpbmRvd0VsID0gJCh3aW5kb3cpO1xuXHRcdHZhciB2aWV3cG9ydEVsID0gZ2V0U2Nyb2xsUGFyZW50KHRoaXMuZWwpO1xuXHRcdHZhciB2aWV3cG9ydFRvcDtcblx0XHR2YXIgdmlld3BvcnRMZWZ0O1xuXHRcdHZhciB2aWV3cG9ydE9mZnNldDtcblx0XHR2YXIgdG9wOyAvLyB0aGUgXCJwb3NpdGlvblwiIChub3QgXCJvZmZzZXRcIikgdmFsdWVzIGZvciB0aGUgcG9wb3ZlclxuXHRcdHZhciBsZWZ0OyAvL1xuXG5cdFx0Ly8gY29tcHV0ZSB0b3AgYW5kIGxlZnRcblx0XHR0b3AgPSBvcHRpb25zLnRvcCB8fCAwO1xuXHRcdGlmIChvcHRpb25zLmxlZnQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0bGVmdCA9IG9wdGlvbnMubGVmdDtcblx0XHR9XG5cdFx0ZWxzZSBpZiAob3B0aW9ucy5yaWdodCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRsZWZ0ID0gb3B0aW9ucy5yaWdodCAtIHdpZHRoOyAvLyBkZXJpdmUgdGhlIGxlZnQgdmFsdWUgZnJvbSB0aGUgcmlnaHQgdmFsdWVcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRsZWZ0ID0gMDtcblx0XHR9XG5cblx0XHRpZiAodmlld3BvcnRFbC5pcyh3aW5kb3cpIHx8IHZpZXdwb3J0RWwuaXMoZG9jdW1lbnQpKSB7IC8vIG5vcm1hbGl6ZSBnZXRTY3JvbGxQYXJlbnQncyByZXN1bHRcblx0XHRcdHZpZXdwb3J0RWwgPSB3aW5kb3dFbDtcblx0XHRcdHZpZXdwb3J0VG9wID0gMDsgLy8gdGhlIHdpbmRvdyBpcyBhbHdheXMgYXQgdGhlIHRvcCBsZWZ0XG5cdFx0XHR2aWV3cG9ydExlZnQgPSAwOyAvLyAoYW5kIC5vZmZzZXQoKSB3b24ndCB3b3JrIGlmIGNhbGxlZCBoZXJlKVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHZpZXdwb3J0T2Zmc2V0ID0gdmlld3BvcnRFbC5vZmZzZXQoKTtcblx0XHRcdHZpZXdwb3J0VG9wID0gdmlld3BvcnRPZmZzZXQudG9wO1xuXHRcdFx0dmlld3BvcnRMZWZ0ID0gdmlld3BvcnRPZmZzZXQubGVmdDtcblx0XHR9XG5cblx0XHQvLyBpZiB0aGUgd2luZG93IGlzIHNjcm9sbGVkLCBpdCBjYXVzZXMgdGhlIHZpc2libGUgYXJlYSB0byBiZSBmdXJ0aGVyIGRvd25cblx0XHR2aWV3cG9ydFRvcCArPSB3aW5kb3dFbC5zY3JvbGxUb3AoKTtcblx0XHR2aWV3cG9ydExlZnQgKz0gd2luZG93RWwuc2Nyb2xsTGVmdCgpO1xuXG5cdFx0Ly8gY29uc3RyYWluIHRvIHRoZSB2aWV3IHBvcnQuIGlmIGNvbnN0cmFpbmVkIGJ5IHR3byBlZGdlcywgZ2l2ZSBwcmVjZWRlbmNlIHRvIHRvcC9sZWZ0XG5cdFx0aWYgKG9wdGlvbnMudmlld3BvcnRDb25zdHJhaW4gIT09IGZhbHNlKSB7XG5cdFx0XHR0b3AgPSBNYXRoLm1pbih0b3AsIHZpZXdwb3J0VG9wICsgdmlld3BvcnRFbC5vdXRlckhlaWdodCgpIC0gaGVpZ2h0IC0gdGhpcy5tYXJnaW4pO1xuXHRcdFx0dG9wID0gTWF0aC5tYXgodG9wLCB2aWV3cG9ydFRvcCArIHRoaXMubWFyZ2luKTtcblx0XHRcdGxlZnQgPSBNYXRoLm1pbihsZWZ0LCB2aWV3cG9ydExlZnQgKyB2aWV3cG9ydEVsLm91dGVyV2lkdGgoKSAtIHdpZHRoIC0gdGhpcy5tYXJnaW4pO1xuXHRcdFx0bGVmdCA9IE1hdGgubWF4KGxlZnQsIHZpZXdwb3J0TGVmdCArIHRoaXMubWFyZ2luKTtcblx0XHR9XG5cblx0XHR0aGlzLmVsLmNzcyh7XG5cdFx0XHR0b3A6IHRvcCAtIG9yaWdpbi50b3AsXG5cdFx0XHRsZWZ0OiBsZWZ0IC0gb3JpZ2luLmxlZnRcblx0XHR9KTtcblx0fSxcblxuXG5cdC8vIFRyaWdnZXJzIGEgY2FsbGJhY2suIENhbGxzIGEgZnVuY3Rpb24gaW4gdGhlIG9wdGlvbiBoYXNoIG9mIHRoZSBzYW1lIG5hbWUuXG5cdC8vIEFyZ3VtZW50cyBiZXlvbmQgdGhlIGZpcnN0IGBuYW1lYCBhcmUgZm9yd2FyZGVkIG9uLlxuXHQvLyBUT0RPOiBiZXR0ZXIgY29kZSByZXVzZSBmb3IgdGhpcy4gUmVwZWF0IGNvZGVcblx0dHJpZ2dlcjogZnVuY3Rpb24obmFtZSkge1xuXHRcdGlmICh0aGlzLm9wdGlvbnNbbmFtZV0pIHtcblx0XHRcdHRoaXMub3B0aW9uc1tuYW1lXS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcblx0XHR9XG5cdH1cblxufSk7XG5cbiAgICAvKiBBIFwiY29vcmRpbmF0ZSBtYXBcIiBjb252ZXJ0cyBwaXhlbCBjb29yZGluYXRlcyBpbnRvIGFuIGFzc29jaWF0ZWQgY2VsbCwgd2hpY2ggaGFzIGFuIGFzc29jaWF0ZWQgZGF0ZVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5Db21tb24gaW50ZXJmYWNlOlxuXG5cdENvb3JkTWFwLnByb3RvdHlwZSA9IHtcblx0XHRidWlsZDogZnVuY3Rpb24oKSB7fSxcblx0XHRnZXRDZWxsOiBmdW5jdGlvbih4LCB5KSB7fVxuXHR9O1xuXG4qL1xuXG4vKiBDb29yZGluYXRlIG1hcCBmb3IgYSBncmlkIGNvbXBvbmVudFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbnZhciBHcmlkQ29vcmRNYXAgPSBDbGFzcy5leHRlbmQoe1xuXG5cdGdyaWQ6IG51bGwsIC8vIHJlZmVyZW5jZSB0byB0aGUgR3JpZFxuXHRyb3dDb29yZHM6IG51bGwsIC8vIGFycmF5IG9mIHt0b3AsYm90dG9tfSBvYmplY3RzXG5cdGNvbENvb3JkczogbnVsbCwgLy8gYXJyYXkgb2Yge2xlZnQscmlnaHR9IG9iamVjdHNcblxuXHRjb250YWluZXJFbDogbnVsbCwgLy8gY29udGFpbmVyIGVsZW1lbnQgdGhhdCBhbGwgY29vcmRpbmF0ZXMgYXJlIGNvbnN0cmFpbmVkIHRvLiBvcHRpb25hbGx5IGFzc2lnbmVkXG5cdG1pblg6IG51bGwsXG5cdG1heFg6IG51bGwsIC8vIGV4Y2x1c2l2ZVxuXHRtaW5ZOiBudWxsLFxuXHRtYXhZOiBudWxsLCAvLyBleGNsdXNpdmVcblxuXG5cdGNvbnN0cnVjdG9yOiBmdW5jdGlvbihncmlkKSB7XG5cdFx0dGhpcy5ncmlkID0gZ3JpZDtcblx0fSxcblxuXG5cdC8vIFF1ZXJpZXMgdGhlIGdyaWQgZm9yIHRoZSBjb29yZGluYXRlcyBvZiBhbGwgdGhlIGNlbGxzXG5cdGJ1aWxkOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnJvd0Nvb3JkcyA9IHRoaXMuZ3JpZC5jb21wdXRlUm93Q29vcmRzKCk7XG5cdFx0dGhpcy5jb2xDb29yZHMgPSB0aGlzLmdyaWQuY29tcHV0ZUNvbENvb3JkcygpO1xuXHRcdHRoaXMuY29tcHV0ZUJvdW5kcygpO1xuXHR9LFxuXG5cblx0Ly8gQ2xlYXJzIHRoZSBjb29yZGluYXRlcyBkYXRhIHRvIGZyZWUgdXAgbWVtb3J5XG5cdGNsZWFyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnJvd0Nvb3JkcyA9IG51bGw7XG5cdFx0dGhpcy5jb2xDb29yZHMgPSBudWxsO1xuXHR9LFxuXG5cblx0Ly8gR2l2ZW4gYSBjb29yZGluYXRlIG9mIHRoZSBkb2N1bWVudCwgZ2V0cyB0aGUgYXNzb2NpYXRlZCBjZWxsLiBJZiBubyBjZWxsIGlzIHVuZGVybmVhdGgsIHJldHVybnMgbnVsbFxuXHRnZXRDZWxsOiBmdW5jdGlvbih4LCB5KSB7XG5cdFx0dmFyIHJvd0Nvb3JkcyA9IHRoaXMucm93Q29vcmRzO1xuXHRcdHZhciBjb2xDb29yZHMgPSB0aGlzLmNvbENvb3Jkcztcblx0XHR2YXIgaGl0Um93ID0gbnVsbDtcblx0XHR2YXIgaGl0Q29sID0gbnVsbDtcblx0XHR2YXIgaSwgY29vcmRzO1xuXHRcdHZhciBjZWxsO1xuXG5cdFx0aWYgKHRoaXMuaW5Cb3VuZHMoeCwgeSkpIHtcblxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IHJvd0Nvb3Jkcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb29yZHMgPSByb3dDb29yZHNbaV07XG5cdFx0XHRcdGlmICh5ID49IGNvb3Jkcy50b3AgJiYgeSA8IGNvb3Jkcy5ib3R0b20pIHtcblx0XHRcdFx0XHRoaXRSb3cgPSBpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGZvciAoaSA9IDA7IGkgPCBjb2xDb29yZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29vcmRzID0gY29sQ29vcmRzW2ldO1xuXHRcdFx0XHRpZiAoeCA+PSBjb29yZHMubGVmdCAmJiB4IDwgY29vcmRzLnJpZ2h0KSB7XG5cdFx0XHRcdFx0aGl0Q29sID0gaTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoaGl0Um93ICE9PSBudWxsICYmIGhpdENvbCAhPT0gbnVsbCkge1xuXHRcdFx0XHRjZWxsID0gdGhpcy5ncmlkLmdldENlbGwoaGl0Um93LCBoaXRDb2wpO1xuXHRcdFx0XHRjZWxsLmdyaWQgPSB0aGlzLmdyaWQ7IC8vIGZvciBEcmFnTGlzdGVuZXIncyBpc0NlbGxzRXF1YWwuIGRyYWdnaW5nIGJldHdlZW4gZ3JpZHNcblx0XHRcdFx0cmV0dXJuIGNlbGw7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGw7XG5cdH0sXG5cblxuXHQvLyBJZiB0aGVyZSBpcyBhIGNvbnRhaW5lckVsLCBjb21wdXRlIHRoZSBib3VuZHMgaW50byBtaW4vbWF4IHZhbHVlc1xuXHRjb21wdXRlQm91bmRzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29udGFpbmVyT2Zmc2V0O1xuXG5cdFx0aWYgKHRoaXMuY29udGFpbmVyRWwpIHtcblx0XHRcdGNvbnRhaW5lck9mZnNldCA9IHRoaXMuY29udGFpbmVyRWwub2Zmc2V0KCk7XG5cdFx0XHR0aGlzLm1pblggPSBjb250YWluZXJPZmZzZXQubGVmdDtcblx0XHRcdHRoaXMubWF4WCA9IGNvbnRhaW5lck9mZnNldC5sZWZ0ICsgdGhpcy5jb250YWluZXJFbC5vdXRlcldpZHRoKCk7XG5cdFx0XHR0aGlzLm1pblkgPSBjb250YWluZXJPZmZzZXQudG9wO1xuXHRcdFx0dGhpcy5tYXhZID0gY29udGFpbmVyT2Zmc2V0LnRvcCArIHRoaXMuY29udGFpbmVyRWwub3V0ZXJIZWlnaHQoKTtcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBjb29yZGluYXRlcyBhcmUgaW4gYm91bmRzLiBJZiBubyBgY29udGFpbmVyRWxgLCBhbHdheXMgdHJ1ZVxuXHRpbkJvdW5kczogZnVuY3Rpb24oeCwgeSkge1xuXHRcdGlmICh0aGlzLmNvbnRhaW5lckVsKSB7XG5cdFx0XHRyZXR1cm4geCA+PSB0aGlzLm1pblggJiYgeCA8IHRoaXMubWF4WCAmJiB5ID49IHRoaXMubWluWSAmJiB5IDwgdGhpcy5tYXhZO1xuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG59KTtcblxuXG4vKiBDb29yZGluYXRlIG1hcCB0aGF0IGlzIGEgY29tYmluYXRpb24gb2YgbXVsdGlwbGUgb3RoZXIgY29vcmRpbmF0ZSBtYXBzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxudmFyIENvbWJvQ29vcmRNYXAgPSBDbGFzcy5leHRlbmQoe1xuXG5cdGNvb3JkTWFwczogbnVsbCwgLy8gYW4gYXJyYXkgb2YgQ29vcmRNYXBzXG5cblxuXHRjb25zdHJ1Y3RvcjogZnVuY3Rpb24oY29vcmRNYXBzKSB7XG5cdFx0dGhpcy5jb29yZE1hcHMgPSBjb29yZE1hcHM7XG5cdH0sXG5cblxuXHQvLyBCdWlsZHMgYWxsIGNvb3JkTWFwc1xuXHRidWlsZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvb3JkTWFwcyA9IHRoaXMuY29vcmRNYXBzO1xuXHRcdHZhciBpO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGNvb3JkTWFwcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29vcmRNYXBzW2ldLmJ1aWxkKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gUXVlcmllcyBhbGwgY29vcmRNYXBzIGZvciB0aGUgY2VsbCB1bmRlcm5lYXRoIHRoZSBnaXZlbiBjb29yZGluYXRlcywgcmV0dXJuaW5nIHRoZSBmaXJzdCByZXN1bHRcblx0Z2V0Q2VsbDogZnVuY3Rpb24oeCwgeSkge1xuXHRcdHZhciBjb29yZE1hcHMgPSB0aGlzLmNvb3JkTWFwcztcblx0XHR2YXIgY2VsbCA9IG51bGw7XG5cdFx0dmFyIGk7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgY29vcmRNYXBzLmxlbmd0aCAmJiAhY2VsbDsgaSsrKSB7XG5cdFx0XHRjZWxsID0gY29vcmRNYXBzW2ldLmdldENlbGwoeCwgeSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNlbGw7XG5cdH0sXG5cblxuXHQvLyBDbGVhcnMgYWxsIGNvb3JkTWFwc1xuXHRjbGVhcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvb3JkTWFwcyA9IHRoaXMuY29vcmRNYXBzO1xuXHRcdHZhciBpO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGNvb3JkTWFwcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29vcmRNYXBzW2ldLmNsZWFyKCk7XG5cdFx0fVxuXHR9XG5cbn0pO1xuXG4gICAgLyogVHJhY2tzIG1vdXNlIG1vdmVtZW50cyBvdmVyIGEgQ29vcmRNYXAgYW5kIHJhaXNlcyBldmVudHMgYWJvdXQgd2hpY2ggY2VsbCB0aGUgbW91c2UgaXMgb3Zlci5cbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuLy8gVE9ETzogdmVyeSB1c2VmdWwgdG8gaGF2ZSBhIGhhbmRsZXIgdGhhdCBnZXRzIGNhbGxlZCB1cG9uIGNlbGxPdXQgT1Igd2hlbiBkcmFnZ2luZyBzdG9wcyAoZm9yIGNsZWFudXApXG5cbnZhciBEcmFnTGlzdGVuZXIgPSBDbGFzcy5leHRlbmQoe1xuXG5cdGNvb3JkTWFwOiBudWxsLFxuXHRvcHRpb25zOiBudWxsLFxuXG5cdGlzTGlzdGVuaW5nOiBmYWxzZSxcblx0aXNEcmFnZ2luZzogZmFsc2UsXG5cblx0Ly8gdGhlIGNlbGwgdGhlIG1vdXNlIHdhcyBvdmVyIHdoZW4gbGlzdGVuaW5nIHN0YXJ0ZWRcblx0b3JpZ0NlbGw6IG51bGwsXG5cblx0Ly8gdGhlIGNlbGwgdGhlIG1vdXNlIGlzIG92ZXJcblx0Y2VsbDogbnVsbCxcblxuXHQvLyBjb29yZGluYXRlcyBvZiB0aGUgaW5pdGlhbCBtb3VzZWRvd25cblx0bW91c2VYMDogbnVsbCxcblx0bW91c2VZMDogbnVsbCxcblxuXHQvLyBoYW5kbGVyIGF0dGFjaGVkIHRvIHRoZSBkb2N1bWVudCwgYm91bmQgdG8gdGhlIERyYWdMaXN0ZW5lcidzIGB0aGlzYFxuXHRtb3VzZW1vdmVQcm94eTogbnVsbCxcblx0bW91c2V1cFByb3h5OiBudWxsLFxuXG5cdHNjcm9sbEVsOiBudWxsLFxuXHRzY3JvbGxCb3VuZHM6IG51bGwsIC8vIHsgdG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0IH1cblx0c2Nyb2xsVG9wVmVsOiBudWxsLCAvLyBwaXhlbHMgcGVyIHNlY29uZFxuXHRzY3JvbGxMZWZ0VmVsOiBudWxsLCAvLyBwaXhlbHMgcGVyIHNlY29uZFxuXHRzY3JvbGxJbnRlcnZhbElkOiBudWxsLCAvLyBJRCBvZiBzZXRUaW1lb3V0IGZvciBzY3JvbGxpbmcgYW5pbWF0aW9uIGxvb3Bcblx0c2Nyb2xsSGFuZGxlclByb3h5OiBudWxsLCAvLyB0aGlzLXNjb3BlZCBmdW5jdGlvbiBmb3IgaGFuZGxpbmcgd2hlbiBzY3JvbGxFbCBpcyBzY3JvbGxlZFxuXG5cdHNjcm9sbFNlbnNpdGl2aXR5OiAzMCwgLy8gcGl4ZWxzIGZyb20gZWRnZSBmb3Igc2Nyb2xsaW5nIHRvIHN0YXJ0XG5cdHNjcm9sbFNwZWVkOiAyMDAsIC8vIHBpeGVscyBwZXIgc2Vjb25kLCBhdCBtYXhpbXVtIHNwZWVkXG5cdHNjcm9sbEludGVydmFsTXM6IDUwLCAvLyBtaWxsaXNlY29uZCB3YWl0IGJldHdlZW4gc2Nyb2xsIGluY3JlbWVudFxuXG5cblx0Y29uc3RydWN0b3I6IGZ1bmN0aW9uKGNvb3JkTWFwLCBvcHRpb25zKSB7XG5cdFx0dGhpcy5jb29yZE1hcCA9IGNvb3JkTWFwO1xuXHRcdHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdH0sXG5cblxuXHQvLyBDYWxsIHRoaXMgd2hlbiB0aGUgdXNlciBkb2VzIGEgbW91c2Vkb3duLiBXaWxsIHByb2JhYmx5IGxlYWQgdG8gc3RhcnRMaXN0ZW5pbmdcblx0bW91c2Vkb3duOiBmdW5jdGlvbihldikge1xuXHRcdGlmIChpc1ByaW1hcnlNb3VzZUJ1dHRvbihldikpIHtcblxuXHRcdFx0ZXYucHJldmVudERlZmF1bHQoKTsgLy8gcHJldmVudHMgbmF0aXZlIHNlbGVjdGlvbiBpbiBtb3N0IGJyb3dzZXJzXG5cblx0XHRcdHRoaXMuc3RhcnRMaXN0ZW5pbmcoZXYpO1xuXG5cdFx0XHQvLyBzdGFydCB0aGUgZHJhZyBpbW1lZGlhdGVseSBpZiB0aGVyZSBpcyBubyBtaW5pbXVtIGRpc3RhbmNlIGZvciBhIGRyYWcgc3RhcnRcblx0XHRcdGlmICghdGhpcy5vcHRpb25zLmRpc3RhbmNlKSB7XG5cdFx0XHRcdHRoaXMuc3RhcnREcmFnKGV2KTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHQvLyBDYWxsIHRoaXMgdG8gc3RhcnQgdHJhY2tpbmcgbW91c2UgbW92ZW1lbnRzXG5cdHN0YXJ0TGlzdGVuaW5nOiBmdW5jdGlvbihldikge1xuXHRcdHZhciBzY3JvbGxQYXJlbnQ7XG5cdFx0dmFyIGNlbGw7XG5cblx0XHRpZiAoIXRoaXMuaXNMaXN0ZW5pbmcpIHtcblxuXHRcdFx0Ly8gZ3JhYiBzY3JvbGwgY29udGFpbmVyIGFuZCBhdHRhY2ggaGFuZGxlclxuXHRcdFx0aWYgKGV2ICYmIHRoaXMub3B0aW9ucy5zY3JvbGwpIHtcblx0XHRcdFx0c2Nyb2xsUGFyZW50ID0gZ2V0U2Nyb2xsUGFyZW50KCQoZXYudGFyZ2V0KSk7XG5cdFx0XHRcdGlmICghc2Nyb2xsUGFyZW50LmlzKHdpbmRvdykgJiYgIXNjcm9sbFBhcmVudC5pcyhkb2N1bWVudCkpIHtcblx0XHRcdFx0XHR0aGlzLnNjcm9sbEVsID0gc2Nyb2xsUGFyZW50O1xuXG5cdFx0XHRcdFx0Ly8gc2NvcGUgdG8gYHRoaXNgLCBhbmQgdXNlIGBkZWJvdW5jZWAgdG8gbWFrZSBzdXJlIHJhcGlkIGNhbGxzIGRvbid0IGhhcHBlblxuXHRcdFx0XHRcdHRoaXMuc2Nyb2xsSGFuZGxlclByb3h5ID0gZGVib3VuY2UoJC5wcm94eSh0aGlzLCAnc2Nyb2xsSGFuZGxlcicpLCAxMDApO1xuXHRcdFx0XHRcdHRoaXMuc2Nyb2xsRWwub24oJ3Njcm9sbCcsIHRoaXMuc2Nyb2xsSGFuZGxlclByb3h5KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmNvbXB1dGVDb29yZHMoKTsgLy8gcmVsaWVzIG9uIGBzY3JvbGxFbGBcblxuXHRcdFx0Ly8gZ2V0IGluZm8gb24gdGhlIGluaXRpYWwgY2VsbCBhbmQgaXRzIGNvb3JkaW5hdGVzXG5cdFx0XHRpZiAoZXYpIHtcblx0XHRcdFx0Y2VsbCA9IHRoaXMuZ2V0Q2VsbChldik7XG5cdFx0XHRcdHRoaXMub3JpZ0NlbGwgPSBjZWxsO1xuXG5cdFx0XHRcdHRoaXMubW91c2VYMCA9IGV2LnBhZ2VYO1xuXHRcdFx0XHR0aGlzLm1vdXNlWTAgPSBldi5wYWdlWTtcblx0XHRcdH1cblxuXHRcdFx0JChkb2N1bWVudClcblx0XHRcdFx0Lm9uKCdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlbW92ZVByb3h5ID0gJC5wcm94eSh0aGlzLCAnbW91c2Vtb3ZlJykpXG5cdFx0XHRcdC5vbignbW91c2V1cCcsIHRoaXMubW91c2V1cFByb3h5ID0gJC5wcm94eSh0aGlzLCAnbW91c2V1cCcpKVxuXHRcdFx0XHQub24oJ3NlbGVjdHN0YXJ0JywgdGhpcy5wcmV2ZW50RGVmYXVsdCk7IC8vIHByZXZlbnRzIG5hdGl2ZSBzZWxlY3Rpb24gaW4gSUU8PThcblxuXHRcdFx0dGhpcy5pc0xpc3RlbmluZyA9IHRydWU7XG5cdFx0XHR0aGlzLnRyaWdnZXIoJ2xpc3RlblN0YXJ0JywgZXYpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIFJlY29tcHV0ZXMgdGhlIGRyYWctY3JpdGljYWwgcG9zaXRpb25zIG9mIGVsZW1lbnRzXG5cdGNvbXB1dGVDb29yZHM6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY29vcmRNYXAuYnVpbGQoKTtcblx0XHR0aGlzLmNvbXB1dGVTY3JvbGxCb3VuZHMoKTtcblx0fSxcblxuXG5cdC8vIENhbGxlZCB3aGVuIHRoZSB1c2VyIG1vdmVzIHRoZSBtb3VzZVxuXHRtb3VzZW1vdmU6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0dmFyIG1pbkRpc3RhbmNlO1xuXHRcdHZhciBkaXN0YW5jZVNxOyAvLyBjdXJyZW50IGRpc3RhbmNlIGZyb20gbW91c2VYMC9tb3VzZVkwLCBzcXVhcmVkXG5cblx0XHRpZiAoIXRoaXMuaXNEcmFnZ2luZykgeyAvLyBpZiBub3QgYWxyZWFkeSBkcmFnZ2luZy4uLlxuXHRcdFx0Ly8gdGhlbiBzdGFydCB0aGUgZHJhZyBpZiB0aGUgbWluaW11bSBkaXN0YW5jZSBjcml0ZXJpYSBpcyBtZXRcblx0XHRcdG1pbkRpc3RhbmNlID0gdGhpcy5vcHRpb25zLmRpc3RhbmNlIHx8IDE7XG5cdFx0XHRkaXN0YW5jZVNxID0gTWF0aC5wb3coZXYucGFnZVggLSB0aGlzLm1vdXNlWDAsIDIpICsgTWF0aC5wb3coZXYucGFnZVkgLSB0aGlzLm1vdXNlWTAsIDIpO1xuXHRcdFx0aWYgKGRpc3RhbmNlU3EgPj0gbWluRGlzdGFuY2UgKiBtaW5EaXN0YW5jZSkgeyAvLyB1c2UgcHl0aGFnb3JlYW4gdGhlb3JlbVxuXHRcdFx0XHR0aGlzLnN0YXJ0RHJhZyhldik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuaXNEcmFnZ2luZykge1xuXHRcdFx0dGhpcy5kcmFnKGV2KTsgLy8gcmVwb3J0IGEgZHJhZywgZXZlbiBpZiB0aGlzIG1vdXNlbW92ZSBpbml0aWF0ZWQgdGhlIGRyYWdcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBDYWxsIHRoaXMgdG8gaW5pdGlhdGUgYSBsZWdpdGltYXRlIGRyYWcuXG5cdC8vIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGludGVybmFsbHkgZnJvbSB0aGlzIGNsYXNzLCBidXQgY2FuIGFsc28gYmUgY2FsbGVkIGV4cGxpY2l0bHkgZnJvbSBvdXRzaWRlXG5cdHN0YXJ0RHJhZzogZnVuY3Rpb24oZXYpIHtcblx0XHR2YXIgY2VsbDtcblxuXHRcdGlmICghdGhpcy5pc0xpc3RlbmluZykgeyAvLyBzdGFydERyYWcgbXVzdCBoYXZlIG1hbnVhbGx5IGluaXRpYXRlZFxuXHRcdFx0dGhpcy5zdGFydExpc3RlbmluZygpO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5pc0RyYWdnaW5nKSB7XG5cdFx0XHR0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xuXHRcdFx0dGhpcy50cmlnZ2VyKCdkcmFnU3RhcnQnLCBldik7XG5cblx0XHRcdC8vIHJlcG9ydCB0aGUgaW5pdGlhbCBjZWxsIHRoZSBtb3VzZSBpcyBvdmVyXG5cdFx0XHQvLyBlc3BlY2lhbGx5IGltcG9ydGFudCBpZiBubyBtaW4tZGlzdGFuY2UgYW5kIGRyYWcgc3RhcnRzIGltbWVkaWF0ZWx5XG5cdFx0XHRjZWxsID0gdGhpcy5nZXRDZWxsKGV2KTsgLy8gdGhpcyBtaWdodCBiZSBkaWZmZXJlbnQgZnJvbSB0aGlzLm9yaWdDZWxsIGlmIHRoZSBtaW4tZGlzdGFuY2UgaXMgbGFyZ2Vcblx0XHRcdGlmIChjZWxsKSB7XG5cdFx0XHRcdHRoaXMuY2VsbE92ZXIoY2VsbCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gQ2FsbGVkIHdoaWxlIHRoZSBtb3VzZSBpcyBiZWluZyBtb3ZlZCBhbmQgd2hlbiB3ZSBrbm93IGEgbGVnaXRpbWF0ZSBkcmFnIGlzIHRha2luZyBwbGFjZVxuXHRkcmFnOiBmdW5jdGlvbihldikge1xuXHRcdHZhciBjZWxsO1xuXG5cdFx0aWYgKHRoaXMuaXNEcmFnZ2luZykge1xuXHRcdFx0Y2VsbCA9IHRoaXMuZ2V0Q2VsbChldik7XG5cblx0XHRcdGlmICghaXNDZWxsc0VxdWFsKGNlbGwsIHRoaXMuY2VsbCkpIHsgLy8gYSBkaWZmZXJlbnQgY2VsbCB0aGFuIGJlZm9yZT9cblx0XHRcdFx0aWYgKHRoaXMuY2VsbCkge1xuXHRcdFx0XHRcdHRoaXMuY2VsbE91dCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChjZWxsKSB7XG5cdFx0XHRcdFx0dGhpcy5jZWxsT3ZlcihjZWxsKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmRyYWdTY3JvbGwoZXYpOyAvLyB3aWxsIHBvc3NpYmx5IGNhdXNlIHNjcm9sbGluZ1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIENhbGxlZCB3aGVuIGEgdGhlIG1vdXNlIGhhcyBqdXN0IG1vdmVkIG92ZXIgYSBuZXcgY2VsbFxuXHRjZWxsT3ZlcjogZnVuY3Rpb24oY2VsbCkge1xuXHRcdHRoaXMuY2VsbCA9IGNlbGw7XG5cdFx0dGhpcy50cmlnZ2VyKCdjZWxsT3ZlcicsIGNlbGwsIGlzQ2VsbHNFcXVhbChjZWxsLCB0aGlzLm9yaWdDZWxsKSk7XG5cdH0sXG5cblxuXHQvLyBDYWxsZWQgd2hlbiB0aGUgbW91c2UgaGFzIGp1c3QgbW92ZWQgb3V0IG9mIGEgY2VsbFxuXHRjZWxsT3V0OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5jZWxsKSB7XG5cdFx0XHR0aGlzLnRyaWdnZXIoJ2NlbGxPdXQnLCB0aGlzLmNlbGwpO1xuXHRcdFx0dGhpcy5jZWxsID0gbnVsbDtcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBDYWxsZWQgd2hlbiB0aGUgdXNlciBkb2VzIGEgbW91c2V1cFxuXHRtb3VzZXVwOiBmdW5jdGlvbihldikge1xuXHRcdHRoaXMuc3RvcERyYWcoZXYpO1xuXHRcdHRoaXMuc3RvcExpc3RlbmluZyhldik7XG5cdH0sXG5cblxuXHQvLyBDYWxsZWQgd2hlbiB0aGUgZHJhZyBpcyBvdmVyLiBXaWxsIG5vdCBjYXVzZSBsaXN0ZW5pbmcgdG8gc3RvcCBob3dldmVyLlxuXHQvLyBBIGNvbmNsdWRpbmcgJ2NlbGxPdXQnIGV2ZW50IHdpbGwgTk9UIGJlIHRyaWdnZXJlZC5cblx0c3RvcERyYWc6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0aWYgKHRoaXMuaXNEcmFnZ2luZykge1xuXHRcdFx0dGhpcy5zdG9wU2Nyb2xsaW5nKCk7XG5cdFx0XHR0aGlzLnRyaWdnZXIoJ2RyYWdTdG9wJywgZXYpO1xuXHRcdFx0dGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gQ2FsbCB0aGlzIHRvIHN0b3AgbGlzdGVuaW5nIHRvIHRoZSB1c2VyJ3MgbW91c2UgZXZlbnRzXG5cdHN0b3BMaXN0ZW5pbmc6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0aWYgKHRoaXMuaXNMaXN0ZW5pbmcpIHtcblxuXHRcdFx0Ly8gcmVtb3ZlIHRoZSBzY3JvbGwgaGFuZGxlciBpZiB0aGVyZSBpcyBhIHNjcm9sbEVsXG5cdFx0XHRpZiAodGhpcy5zY3JvbGxFbCkge1xuXHRcdFx0XHR0aGlzLnNjcm9sbEVsLm9mZignc2Nyb2xsJywgdGhpcy5zY3JvbGxIYW5kbGVyUHJveHkpO1xuXHRcdFx0XHR0aGlzLnNjcm9sbEhhbmRsZXJQcm94eSA9IG51bGw7XG5cdFx0XHR9XG5cblx0XHRcdCQoZG9jdW1lbnQpXG5cdFx0XHRcdC5vZmYoJ21vdXNlbW92ZScsIHRoaXMubW91c2Vtb3ZlUHJveHkpXG5cdFx0XHRcdC5vZmYoJ21vdXNldXAnLCB0aGlzLm1vdXNldXBQcm94eSlcblx0XHRcdFx0Lm9mZignc2VsZWN0c3RhcnQnLCB0aGlzLnByZXZlbnREZWZhdWx0KTtcblxuXHRcdFx0dGhpcy5tb3VzZW1vdmVQcm94eSA9IG51bGw7XG5cdFx0XHR0aGlzLm1vdXNldXBQcm94eSA9IG51bGw7XG5cblx0XHRcdHRoaXMuaXNMaXN0ZW5pbmcgPSBmYWxzZTtcblx0XHRcdHRoaXMudHJpZ2dlcignbGlzdGVuU3RvcCcsIGV2KTtcblxuXHRcdFx0dGhpcy5vcmlnQ2VsbCA9IHRoaXMuY2VsbCA9IG51bGw7XG5cdFx0XHR0aGlzLmNvb3JkTWFwLmNsZWFyKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gR2V0cyB0aGUgY2VsbCB1bmRlcm5lYXRoIHRoZSBjb29yZGluYXRlcyBmb3IgdGhlIGdpdmVuIG1vdXNlIGV2ZW50XG5cdGdldENlbGw6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0cmV0dXJuIHRoaXMuY29vcmRNYXAuZ2V0Q2VsbChldi5wYWdlWCwgZXYucGFnZVkpO1xuXHR9LFxuXG5cblx0Ly8gVHJpZ2dlcnMgYSBjYWxsYmFjay4gQ2FsbHMgYSBmdW5jdGlvbiBpbiB0aGUgb3B0aW9uIGhhc2ggb2YgdGhlIHNhbWUgbmFtZS5cblx0Ly8gQXJndW1lbnRzIGJleW9uZCB0aGUgZmlyc3QgYG5hbWVgIGFyZSBmb3J3YXJkZWQgb24uXG5cdHRyaWdnZXI6IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRpZiAodGhpcy5vcHRpb25zW25hbWVdKSB7XG5cdFx0XHR0aGlzLm9wdGlvbnNbbmFtZV0uYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gU3RvcHMgYSBnaXZlbiBtb3VzZSBldmVudCBmcm9tIGRvaW5nIGl0J3MgbmF0aXZlIGJyb3dzZXIgYWN0aW9uLiBJbiBvdXIgY2FzZSwgdGV4dCBzZWxlY3Rpb24uXG5cdHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbihldikge1xuXHRcdGV2LnByZXZlbnREZWZhdWx0KCk7XG5cdH0sXG5cblxuXHQvKiBTY3JvbGxpbmdcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIENvbXB1dGVzIGFuZCBzdG9yZXMgdGhlIGJvdW5kaW5nIHJlY3RhbmdsZSBvZiBzY3JvbGxFbFxuXHRjb21wdXRlU2Nyb2xsQm91bmRzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWwgPSB0aGlzLnNjcm9sbEVsO1xuXHRcdHZhciBvZmZzZXQ7XG5cblx0XHRpZiAoZWwpIHtcblx0XHRcdG9mZnNldCA9IGVsLm9mZnNldCgpO1xuXHRcdFx0dGhpcy5zY3JvbGxCb3VuZHMgPSB7XG5cdFx0XHRcdHRvcDogb2Zmc2V0LnRvcCxcblx0XHRcdFx0bGVmdDogb2Zmc2V0LmxlZnQsXG5cdFx0XHRcdGJvdHRvbTogb2Zmc2V0LnRvcCArIGVsLm91dGVySGVpZ2h0KCksXG5cdFx0XHRcdHJpZ2h0OiBvZmZzZXQubGVmdCArIGVsLm91dGVyV2lkdGgoKVxuXHRcdFx0fTtcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBDYWxsZWQgd2hlbiB0aGUgZHJhZ2dpbmcgaXMgaW4gcHJvZ3Jlc3MgYW5kIHNjcm9sbGluZyBzaG91bGQgYmUgdXBkYXRlZFxuXHRkcmFnU2Nyb2xsOiBmdW5jdGlvbihldikge1xuXHRcdHZhciBzZW5zaXRpdml0eSA9IHRoaXMuc2Nyb2xsU2Vuc2l0aXZpdHk7XG5cdFx0dmFyIGJvdW5kcyA9IHRoaXMuc2Nyb2xsQm91bmRzO1xuXHRcdHZhciB0b3BDbG9zZW5lc3MsIGJvdHRvbUNsb3NlbmVzcztcblx0XHR2YXIgbGVmdENsb3NlbmVzcywgcmlnaHRDbG9zZW5lc3M7XG5cdFx0dmFyIHRvcFZlbCA9IDA7XG5cdFx0dmFyIGxlZnRWZWwgPSAwO1xuXG5cdFx0aWYgKGJvdW5kcykgeyAvLyBvbmx5IHNjcm9sbCBpZiBzY3JvbGxFbCBleGlzdHNcblxuXHRcdFx0Ly8gY29tcHV0ZSBjbG9zZW5lc3MgdG8gZWRnZXMuIHZhbGlkIHJhbmdlIGlzIGZyb20gMC4wIC0gMS4wXG5cdFx0XHR0b3BDbG9zZW5lc3MgPSAoc2Vuc2l0aXZpdHkgLSAoZXYucGFnZVkgLSBib3VuZHMudG9wKSkgLyBzZW5zaXRpdml0eTtcblx0XHRcdGJvdHRvbUNsb3NlbmVzcyA9IChzZW5zaXRpdml0eSAtIChib3VuZHMuYm90dG9tIC0gZXYucGFnZVkpKSAvIHNlbnNpdGl2aXR5O1xuXHRcdFx0bGVmdENsb3NlbmVzcyA9IChzZW5zaXRpdml0eSAtIChldi5wYWdlWCAtIGJvdW5kcy5sZWZ0KSkgLyBzZW5zaXRpdml0eTtcblx0XHRcdHJpZ2h0Q2xvc2VuZXNzID0gKHNlbnNpdGl2aXR5IC0gKGJvdW5kcy5yaWdodCAtIGV2LnBhZ2VYKSkgLyBzZW5zaXRpdml0eTtcblxuXHRcdFx0Ly8gdHJhbnNsYXRlIHZlcnRpY2FsIGNsb3NlbmVzcyBpbnRvIHZlbG9jaXR5LlxuXHRcdFx0Ly8gbW91c2UgbXVzdCBiZSBjb21wbGV0ZWx5IGluIGJvdW5kcyBmb3IgdmVsb2NpdHkgdG8gaGFwcGVuLlxuXHRcdFx0aWYgKHRvcENsb3NlbmVzcyA+PSAwICYmIHRvcENsb3NlbmVzcyA8PSAxKSB7XG5cdFx0XHRcdHRvcFZlbCA9IHRvcENsb3NlbmVzcyAqIHRoaXMuc2Nyb2xsU3BlZWQgKiAtMTsgLy8gbmVnYXRpdmUuIGZvciBzY3JvbGxpbmcgdXBcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGJvdHRvbUNsb3NlbmVzcyA+PSAwICYmIGJvdHRvbUNsb3NlbmVzcyA8PSAxKSB7XG5cdFx0XHRcdHRvcFZlbCA9IGJvdHRvbUNsb3NlbmVzcyAqIHRoaXMuc2Nyb2xsU3BlZWQ7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHRyYW5zbGF0ZSBob3Jpem9udGFsIGNsb3NlbmVzcyBpbnRvIHZlbG9jaXR5XG5cdFx0XHRpZiAobGVmdENsb3NlbmVzcyA+PSAwICYmIGxlZnRDbG9zZW5lc3MgPD0gMSkge1xuXHRcdFx0XHRsZWZ0VmVsID0gbGVmdENsb3NlbmVzcyAqIHRoaXMuc2Nyb2xsU3BlZWQgKiAtMTsgLy8gbmVnYXRpdmUuIGZvciBzY3JvbGxpbmcgbGVmdFxuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAocmlnaHRDbG9zZW5lc3MgPj0gMCAmJiByaWdodENsb3NlbmVzcyA8PSAxKSB7XG5cdFx0XHRcdGxlZnRWZWwgPSByaWdodENsb3NlbmVzcyAqIHRoaXMuc2Nyb2xsU3BlZWQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRTY3JvbGxWZWwodG9wVmVsLCBsZWZ0VmVsKTtcblx0fSxcblxuXG5cdC8vIFNldHMgdGhlIHNwZWVkLW9mLXNjcm9sbGluZyBmb3IgdGhlIHNjcm9sbEVsXG5cdHNldFNjcm9sbFZlbDogZnVuY3Rpb24odG9wVmVsLCBsZWZ0VmVsKSB7XG5cblx0XHR0aGlzLnNjcm9sbFRvcFZlbCA9IHRvcFZlbDtcblx0XHR0aGlzLnNjcm9sbExlZnRWZWwgPSBsZWZ0VmVsO1xuXG5cdFx0dGhpcy5jb25zdHJhaW5TY3JvbGxWZWwoKTsgLy8gbWFzc2FnZXMgaW50byByZWFsaXN0aWMgdmFsdWVzXG5cblx0XHQvLyBpZiB0aGVyZSBpcyBub24temVybyB2ZWxvY2l0eSwgYW5kIGFuIGFuaW1hdGlvbiBsb29wIGhhc24ndCBhbHJlYWR5IHN0YXJ0ZWQsIHRoZW4gU1RBUlRcblx0XHRpZiAoKHRoaXMuc2Nyb2xsVG9wVmVsIHx8IHRoaXMuc2Nyb2xsTGVmdFZlbCkgJiYgIXRoaXMuc2Nyb2xsSW50ZXJ2YWxJZCkge1xuXHRcdFx0dGhpcy5zY3JvbGxJbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoXG5cdFx0XHRcdCQucHJveHkodGhpcywgJ3Njcm9sbEludGVydmFsRnVuYycpLCAvLyBzY29wZSB0byBgdGhpc2Bcblx0XHRcdFx0dGhpcy5zY3JvbGxJbnRlcnZhbE1zXG5cdFx0XHQpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIEZvcmNlcyBzY3JvbGxUb3BWZWwgYW5kIHNjcm9sbExlZnRWZWwgdG8gYmUgemVybyBpZiBzY3JvbGxpbmcgaGFzIGFscmVhZHkgZ29uZSBhbGwgdGhlIHdheVxuXHRjb25zdHJhaW5TY3JvbGxWZWw6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbCA9IHRoaXMuc2Nyb2xsRWw7XG5cblx0XHRpZiAodGhpcy5zY3JvbGxUb3BWZWwgPCAwKSB7IC8vIHNjcm9sbGluZyB1cD9cblx0XHRcdGlmIChlbC5zY3JvbGxUb3AoKSA8PSAwKSB7IC8vIGFscmVhZHkgc2Nyb2xsZWQgYWxsIHRoZSB3YXkgdXA/XG5cdFx0XHRcdHRoaXMuc2Nyb2xsVG9wVmVsID0gMDtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSBpZiAodGhpcy5zY3JvbGxUb3BWZWwgPiAwKSB7IC8vIHNjcm9sbGluZyBkb3duP1xuXHRcdFx0aWYgKGVsLnNjcm9sbFRvcCgpICsgZWxbMF0uY2xpZW50SGVpZ2h0ID49IGVsWzBdLnNjcm9sbEhlaWdodCkgeyAvLyBhbHJlYWR5IHNjcm9sbGVkIGFsbCB0aGUgd2F5IGRvd24/XG5cdFx0XHRcdHRoaXMuc2Nyb2xsVG9wVmVsID0gMDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAodGhpcy5zY3JvbGxMZWZ0VmVsIDwgMCkgeyAvLyBzY3JvbGxpbmcgbGVmdD9cblx0XHRcdGlmIChlbC5zY3JvbGxMZWZ0KCkgPD0gMCkgeyAvLyBhbHJlYWR5IHNjcm9sbGVkIGFsbCB0aGUgbGVmdD9cblx0XHRcdFx0dGhpcy5zY3JvbGxMZWZ0VmVsID0gMDtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSBpZiAodGhpcy5zY3JvbGxMZWZ0VmVsID4gMCkgeyAvLyBzY3JvbGxpbmcgcmlnaHQ/XG5cdFx0XHRpZiAoZWwuc2Nyb2xsTGVmdCgpICsgZWxbMF0uY2xpZW50V2lkdGggPj0gZWxbMF0uc2Nyb2xsV2lkdGgpIHsgLy8gYWxyZWFkeSBzY3JvbGxlZCBhbGwgdGhlIHdheSByaWdodD9cblx0XHRcdFx0dGhpcy5zY3JvbGxMZWZ0VmVsID0gMDtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHQvLyBUaGlzIGZ1bmN0aW9uIGdldHMgY2FsbGVkIGR1cmluZyBldmVyeSBpdGVyYXRpb24gb2YgdGhlIHNjcm9sbGluZyBhbmltYXRpb24gbG9vcFxuXHRzY3JvbGxJbnRlcnZhbEZ1bmM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbCA9IHRoaXMuc2Nyb2xsRWw7XG5cdFx0dmFyIGZyYWMgPSB0aGlzLnNjcm9sbEludGVydmFsTXMgLyAxMDAwOyAvLyBjb25zaWRlcmluZyBhbmltYXRpb24gZnJlcXVlbmN5LCB3aGF0IHRoZSB2ZWwgc2hvdWxkIGJlIG11bHQnZCBieVxuXG5cdFx0Ly8gY2hhbmdlIHRoZSB2YWx1ZSBvZiBzY3JvbGxFbCdzIHNjcm9sbFxuXHRcdGlmICh0aGlzLnNjcm9sbFRvcFZlbCkge1xuXHRcdFx0ZWwuc2Nyb2xsVG9wKGVsLnNjcm9sbFRvcCgpICsgdGhpcy5zY3JvbGxUb3BWZWwgKiBmcmFjKTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuc2Nyb2xsTGVmdFZlbCkge1xuXHRcdFx0ZWwuc2Nyb2xsTGVmdChlbC5zY3JvbGxMZWZ0KCkgKyB0aGlzLnNjcm9sbExlZnRWZWwgKiBmcmFjKTtcblx0XHR9XG5cblx0XHR0aGlzLmNvbnN0cmFpblNjcm9sbFZlbCgpOyAvLyBzaW5jZSB0aGUgc2Nyb2xsIHZhbHVlcyBjaGFuZ2VkLCByZWNvbXB1dGUgdGhlIHZlbG9jaXRpZXNcblxuXHRcdC8vIGlmIHNjcm9sbGVkIGFsbCB0aGUgd2F5LCB3aGljaCBjYXVzZXMgdGhlIHZlbHMgdG8gYmUgemVybywgc3RvcCB0aGUgYW5pbWF0aW9uIGxvb3Bcblx0XHRpZiAoIXRoaXMuc2Nyb2xsVG9wVmVsICYmICF0aGlzLnNjcm9sbExlZnRWZWwpIHtcblx0XHRcdHRoaXMuc3RvcFNjcm9sbGluZygpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIEtpbGxzIGFueSBleGlzdGluZyBzY3JvbGxpbmcgYW5pbWF0aW9uIGxvb3Bcblx0c3RvcFNjcm9sbGluZzogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuc2Nyb2xsSW50ZXJ2YWxJZCkge1xuXHRcdFx0Y2xlYXJJbnRlcnZhbCh0aGlzLnNjcm9sbEludGVydmFsSWQpO1xuXHRcdFx0dGhpcy5zY3JvbGxJbnRlcnZhbElkID0gbnVsbDtcblxuXHRcdFx0Ly8gd2hlbiBhbGwgZG9uZSB3aXRoIHNjcm9sbGluZywgcmVjb21wdXRlIHBvc2l0aW9ucyBzaW5jZSB0aGV5IHByb2JhYmx5IGNoYW5nZWRcblx0XHRcdHRoaXMuY29tcHV0ZUNvb3JkcygpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIEdldCBjYWxsZWQgd2hlbiB0aGUgc2Nyb2xsRWwgaXMgc2Nyb2xsZWQgKE5PVEU6IHRoaXMgaXMgZGVsYXllZCB2aWEgZGVib3VuY2UpXG5cdHNjcm9sbEhhbmRsZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHJlY29tcHV0ZSBhbGwgY29vcmRpbmF0ZXMsIGJ1dCAqb25seSogaWYgdGhpcyBpcyAqbm90KiBwYXJ0IG9mIG91ciBzY3JvbGxpbmcgYW5pbWF0aW9uXG5cdFx0aWYgKCF0aGlzLnNjcm9sbEludGVydmFsSWQpIHtcblx0XHRcdHRoaXMuY29tcHV0ZUNvb3JkcygpO1xuXHRcdH1cblx0fVxuXG59KTtcblxuXG4vLyBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgY2VsbHMgYXJlIGlkZW50aWNhbGx5IGVxdWFsLiBgZmFsc2VgIG90aGVyd2lzZS5cbi8vIFRoZXkgbXVzdCBoYXZlIHRoZSBzYW1lIHJvdywgY29sLCBhbmQgYmUgZnJvbSB0aGUgc2FtZSBncmlkLlxuLy8gVHdvIG51bGwgdmFsdWVzIHdpbGwgYmUgY29uc2lkZXJlZCBlcXVhbCwgYXMgdHdvIFwib3V0IG9mIHRoZSBncmlkXCIgc3RhdGVzIGFyZSB0aGUgc2FtZS5cbmZ1bmN0aW9uIGlzQ2VsbHNFcXVhbChjZWxsMSwgY2VsbDIpIHtcblxuXHRpZiAoIWNlbGwxICYmICFjZWxsMikge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0aWYgKGNlbGwxICYmIGNlbGwyKSB7XG5cdFx0cmV0dXJuIGNlbGwxLmdyaWQgPT09IGNlbGwyLmdyaWQgJiZcblx0XHRcdGNlbGwxLnJvdyA9PT0gY2VsbDIucm93ICYmXG5cdFx0XHRjZWxsMS5jb2wgPT09IGNlbGwyLmNvbDtcblx0fVxuXG5cdHJldHVybiBmYWxzZTtcbn1cblxuICAgIC8qIENyZWF0ZXMgYSBjbG9uZSBvZiBhbiBlbGVtZW50IGFuZCBsZXRzIGl0IHRyYWNrIHRoZSBtb3VzZSBhcyBpdCBtb3Zlc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbnZhciBNb3VzZUZvbGxvd2VyID0gQ2xhc3MuZXh0ZW5kKHtcblxuXHRvcHRpb25zOiBudWxsLFxuXG5cdHNvdXJjZUVsOiBudWxsLCAvLyB0aGUgZWxlbWVudCB0aGF0IHdpbGwgYmUgY2xvbmVkIGFuZCBtYWRlIHRvIGxvb2sgbGlrZSBpdCBpcyBkcmFnZ2luZ1xuXHRlbDogbnVsbCwgLy8gdGhlIGNsb25lIG9mIGBzb3VyY2VFbGAgdGhhdCB3aWxsIHRyYWNrIHRoZSBtb3VzZVxuXHRwYXJlbnRFbDogbnVsbCwgLy8gdGhlIGVsZW1lbnQgdGhhdCBgZWxgICh0aGUgY2xvbmUpIHdpbGwgYmUgYXR0YWNoZWQgdG9cblxuXHQvLyB0aGUgaW5pdGlhbCBwb3NpdGlvbiBvZiBlbCwgcmVsYXRpdmUgdG8gdGhlIG9mZnNldCBwYXJlbnQuIG1hZGUgdG8gbWF0Y2ggdGhlIGluaXRpYWwgb2Zmc2V0IG9mIHNvdXJjZUVsXG5cdHRvcDA6IG51bGwsXG5cdGxlZnQwOiBudWxsLFxuXG5cdC8vIHRoZSBpbml0aWFsIHBvc2l0aW9uIG9mIHRoZSBtb3VzZVxuXHRtb3VzZVkwOiBudWxsLFxuXHRtb3VzZVgwOiBudWxsLFxuXG5cdC8vIHRoZSBudW1iZXIgb2YgcGl4ZWxzIHRoZSBtb3VzZSBoYXMgbW92ZWQgZnJvbSBpdHMgaW5pdGlhbCBwb3NpdGlvblxuXHR0b3BEZWx0YTogbnVsbCxcblx0bGVmdERlbHRhOiBudWxsLFxuXG5cdG1vdXNlbW92ZVByb3h5OiBudWxsLCAvLyBkb2N1bWVudCBtb3VzZW1vdmUgaGFuZGxlciwgYm91bmQgdG8gdGhlIE1vdXNlRm9sbG93ZXIncyBgdGhpc2BcblxuXHRpc0ZvbGxvd2luZzogZmFsc2UsXG5cdGlzSGlkZGVuOiBmYWxzZSxcblx0aXNBbmltYXRpbmc6IGZhbHNlLCAvLyBkb2luZyB0aGUgcmV2ZXJ0IGFuaW1hdGlvbj9cblxuXHRjb25zdHJ1Y3RvcjogZnVuY3Rpb24oc291cmNlRWwsIG9wdGlvbnMpIHtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHR0aGlzLnNvdXJjZUVsID0gc291cmNlRWw7XG5cdFx0dGhpcy5wYXJlbnRFbCA9IG9wdGlvbnMucGFyZW50RWwgPyAkKG9wdGlvbnMucGFyZW50RWwpIDogc291cmNlRWwucGFyZW50KCk7IC8vIGRlZmF1bHQgdG8gc291cmNlRWwncyBwYXJlbnRcblx0fSxcblxuXG5cdC8vIENhdXNlcyB0aGUgZWxlbWVudCB0byBzdGFydCBmb2xsb3dpbmcgdGhlIG1vdXNlXG5cdHN0YXJ0OiBmdW5jdGlvbihldikge1xuXHRcdGlmICghdGhpcy5pc0ZvbGxvd2luZykge1xuXHRcdFx0dGhpcy5pc0ZvbGxvd2luZyA9IHRydWU7XG5cblx0XHRcdHRoaXMubW91c2VZMCA9IGV2LnBhZ2VZO1xuXHRcdFx0dGhpcy5tb3VzZVgwID0gZXYucGFnZVg7XG5cdFx0XHR0aGlzLnRvcERlbHRhID0gMDtcblx0XHRcdHRoaXMubGVmdERlbHRhID0gMDtcblxuXHRcdFx0aWYgKCF0aGlzLmlzSGlkZGVuKSB7XG5cdFx0XHRcdHRoaXMudXBkYXRlUG9zaXRpb24oKTtcblx0XHRcdH1cblxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNlbW92ZScsIHRoaXMubW91c2Vtb3ZlUHJveHkgPSAkLnByb3h5KHRoaXMsICdtb3VzZW1vdmUnKSk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gQ2F1c2VzIHRoZSBlbGVtZW50IHRvIHN0b3AgZm9sbG93aW5nIHRoZSBtb3VzZS4gSWYgc2hvdWxkUmV2ZXJ0IGlzIHRydWUsIHdpbGwgYW5pbWF0ZSBiYWNrIHRvIG9yaWdpbmFsIHBvc2l0aW9uLlxuXHQvLyBgY2FsbGJhY2tgIGdldHMgaW52b2tlZCB3aGVuIHRoZSBhbmltYXRpb24gaXMgY29tcGxldGUuIElmIG5vIGFuaW1hdGlvbiwgaXQgaXMgaW52b2tlZCBpbW1lZGlhdGVseS5cblx0c3RvcDogZnVuY3Rpb24oc2hvdWxkUmV2ZXJ0LCBjYWxsYmFjaykge1xuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cdFx0dmFyIHJldmVydER1cmF0aW9uID0gdGhpcy5vcHRpb25zLnJldmVydER1cmF0aW9uO1xuXG5cdFx0ZnVuY3Rpb24gY29tcGxldGUoKSB7XG5cdFx0XHR0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cdFx0XHRfdGhpcy5kZXN0cm95RWwoKTtcblxuXHRcdFx0dGhpcy50b3AwID0gdGhpcy5sZWZ0MCA9IG51bGw7IC8vIHJlc2V0IHN0YXRlIGZvciBmdXR1cmUgdXBkYXRlUG9zaXRpb24gY2FsbHNcblxuXHRcdFx0aWYgKGNhbGxiYWNrKSB7XG5cdFx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuaXNGb2xsb3dpbmcgJiYgIXRoaXMuaXNBbmltYXRpbmcpIHsgLy8gZGlzYWxsb3cgbW9yZSB0aGFuIG9uZSBzdG9wIGFuaW1hdGlvbiBhdCBhIHRpbWVcblx0XHRcdHRoaXMuaXNGb2xsb3dpbmcgPSBmYWxzZTtcblxuXHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlbW92ZVByb3h5KTtcblxuXHRcdFx0aWYgKHNob3VsZFJldmVydCAmJiByZXZlcnREdXJhdGlvbiAmJiAhdGhpcy5pc0hpZGRlbikgeyAvLyBkbyBhIHJldmVydCBhbmltYXRpb24/XG5cdFx0XHRcdHRoaXMuaXNBbmltYXRpbmcgPSB0cnVlO1xuXHRcdFx0XHR0aGlzLmVsLmFuaW1hdGUoe1xuXHRcdFx0XHRcdHRvcDogdGhpcy50b3AwLFxuXHRcdFx0XHRcdGxlZnQ6IHRoaXMubGVmdDBcblx0XHRcdFx0fSwge1xuXHRcdFx0XHRcdGR1cmF0aW9uOiByZXZlcnREdXJhdGlvbixcblx0XHRcdFx0XHRjb21wbGV0ZTogY29tcGxldGVcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Y29tcGxldGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHQvLyBHZXRzIHRoZSB0cmFja2luZyBlbGVtZW50LiBDcmVhdGUgaXQgaWYgbmVjZXNzYXJ5XG5cdGdldEVsOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWwgPSB0aGlzLmVsO1xuXG5cdFx0aWYgKCFlbCkge1xuXHRcdFx0dGhpcy5zb3VyY2VFbC53aWR0aCgpOyAvLyBoYWNrIHRvIGZvcmNlIElFOCB0byBjb21wdXRlIGNvcnJlY3QgYm91bmRpbmcgYm94XG5cdFx0XHRlbCA9IHRoaXMuZWwgPSB0aGlzLnNvdXJjZUVsLmNsb25lKClcblx0XHRcdFx0LmNzcyh7XG5cdFx0XHRcdFx0cG9zaXRpb246ICdhYnNvbHV0ZScsXG5cdFx0XHRcdFx0dmlzaWJpbGl0eTogJycsIC8vIGluIGNhc2Ugb3JpZ2luYWwgZWxlbWVudCB3YXMgaGlkZGVuIChjb21tb25seSB0aHJvdWdoIGhpZGVFdmVudHMoKSlcblx0XHRcdFx0XHRkaXNwbGF5OiB0aGlzLmlzSGlkZGVuID8gJ25vbmUnIDogJycsIC8vIGZvciB3aGVuIGluaXRpYWxseSBoaWRkZW5cblx0XHRcdFx0XHRtYXJnaW46IDAsXG5cdFx0XHRcdFx0cmlnaHQ6ICdhdXRvJywgLy8gZXJhc2UgYW5kIHNldCB3aWR0aCBpbnN0ZWFkXG5cdFx0XHRcdFx0Ym90dG9tOiAnYXV0bycsIC8vIGVyYXNlIGFuZCBzZXQgaGVpZ2h0IGluc3RlYWRcblx0XHRcdFx0XHR3aWR0aDogdGhpcy5zb3VyY2VFbC53aWR0aCgpLCAvLyBleHBsaWNpdCBoZWlnaHQgaW4gY2FzZSB0aGVyZSB3YXMgYSAncmlnaHQnIHZhbHVlXG5cdFx0XHRcdFx0aGVpZ2h0OiB0aGlzLnNvdXJjZUVsLmhlaWdodCgpLCAvLyBleHBsaWNpdCB3aWR0aCBpbiBjYXNlIHRoZXJlIHdhcyBhICdib3R0b20nIHZhbHVlXG5cdFx0XHRcdFx0b3BhY2l0eTogdGhpcy5vcHRpb25zLm9wYWNpdHkgfHwgJycsXG5cdFx0XHRcdFx0ekluZGV4OiB0aGlzLm9wdGlvbnMuekluZGV4XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5hcHBlbmRUbyh0aGlzLnBhcmVudEVsKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZWw7XG5cdH0sXG5cblxuXHQvLyBSZW1vdmVzIHRoZSB0cmFja2luZyBlbGVtZW50IGlmIGl0IGhhcyBhbHJlYWR5IGJlZW4gY3JlYXRlZFxuXHRkZXN0cm95RWw6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLmVsKSB7XG5cdFx0XHR0aGlzLmVsLnJlbW92ZSgpO1xuXHRcdFx0dGhpcy5lbCA9IG51bGw7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gVXBkYXRlIHRoZSBDU1MgcG9zaXRpb24gb2YgdGhlIHRyYWNraW5nIGVsZW1lbnRcblx0dXBkYXRlUG9zaXRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzb3VyY2VPZmZzZXQ7XG5cdFx0dmFyIG9yaWdpbjtcblxuXHRcdHRoaXMuZ2V0RWwoKTsgLy8gZW5zdXJlIHRoaXMuZWxcblxuXHRcdC8vIG1ha2Ugc3VyZSBvcmlnaW4gaW5mbyB3YXMgY29tcHV0ZWRcblx0XHRpZiAodGhpcy50b3AwID09PSBudWxsKSB7XG5cdFx0XHR0aGlzLnNvdXJjZUVsLndpZHRoKCk7IC8vIGhhY2sgdG8gZm9yY2UgSUU4IHRvIGNvbXB1dGUgY29ycmVjdCBib3VuZGluZyBib3hcblx0XHRcdHNvdXJjZU9mZnNldCA9IHRoaXMuc291cmNlRWwub2Zmc2V0KCk7XG5cdFx0XHRvcmlnaW4gPSB0aGlzLmVsLm9mZnNldFBhcmVudCgpLm9mZnNldCgpO1xuXHRcdFx0dGhpcy50b3AwID0gc291cmNlT2Zmc2V0LnRvcCAtIG9yaWdpbi50b3A7XG5cdFx0XHR0aGlzLmxlZnQwID0gc291cmNlT2Zmc2V0LmxlZnQgLSBvcmlnaW4ubGVmdDtcblx0XHR9XG5cblx0XHR0aGlzLmVsLmNzcyh7XG5cdFx0XHR0b3A6IHRoaXMudG9wMCArIHRoaXMudG9wRGVsdGEsXG5cdFx0XHRsZWZ0OiB0aGlzLmxlZnQwICsgdGhpcy5sZWZ0RGVsdGFcblx0XHR9KTtcblx0fSxcblxuXG5cdC8vIEdldHMgY2FsbGVkIHdoZW4gdGhlIHVzZXIgbW92ZXMgdGhlIG1vdXNlXG5cdG1vdXNlbW92ZTogZnVuY3Rpb24oZXYpIHtcblx0XHR0aGlzLnRvcERlbHRhID0gZXYucGFnZVkgLSB0aGlzLm1vdXNlWTA7XG5cdFx0dGhpcy5sZWZ0RGVsdGEgPSBldi5wYWdlWCAtIHRoaXMubW91c2VYMDtcblxuXHRcdGlmICghdGhpcy5pc0hpZGRlbikge1xuXHRcdFx0dGhpcy51cGRhdGVQb3NpdGlvbigpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIFRlbXBvcmFyaWx5IG1ha2VzIHRoZSB0cmFja2luZyBlbGVtZW50IGludmlzaWJsZS4gQ2FuIGJlIGNhbGxlZCBiZWZvcmUgZm9sbG93aW5nIHN0YXJ0c1xuXHRoaWRlOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIXRoaXMuaXNIaWRkZW4pIHtcblx0XHRcdHRoaXMuaXNIaWRkZW4gPSB0cnVlO1xuXHRcdFx0aWYgKHRoaXMuZWwpIHtcblx0XHRcdFx0dGhpcy5lbC5oaWRlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gU2hvdyB0aGUgdHJhY2tpbmcgZWxlbWVudCBhZnRlciBpdCBoYXMgYmVlbiB0ZW1wb3JhcmlseSBoaWRkZW5cblx0c2hvdzogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuaXNIaWRkZW4pIHtcblx0XHRcdHRoaXMuaXNIaWRkZW4gPSBmYWxzZTtcblx0XHRcdHRoaXMudXBkYXRlUG9zaXRpb24oKTtcblx0XHRcdHRoaXMuZ2V0RWwoKS5zaG93KCk7XG5cdFx0fVxuXHR9XG5cbn0pO1xuXG4gICAgLyogQSB1dGlsaXR5IGNsYXNzIGZvciByZW5kZXJpbmcgPHRyPiByb3dzLlxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG4vLyBJdCBsZXZlcmFnZXMgbWV0aG9kcyBvZiB0aGUgc3ViY2xhc3MgYW5kIHRoZSBWaWV3IHRvIGRldGVybWluZSBjdXN0b20gcmVuZGVyaW5nIGJlaGF2aW9yIGZvciBlYWNoIHJvdyBcInR5cGVcIlxuLy8gKHN1Y2ggYXMgaGlnaGxpZ2h0IHJvd3MsIGRheSByb3dzLCBoZWxwZXIgcm93cywgZXRjKS5cblxudmFyIFJvd1JlbmRlcmVyID0gQ2xhc3MuZXh0ZW5kKHtcblxuXHR2aWV3OiBudWxsLCAvLyBhIFZpZXcgb2JqZWN0XG5cdGlzUlRMOiBudWxsLCAvLyBzaG9ydGN1dCB0byB0aGUgdmlldydzIGlzUlRMIG9wdGlvblxuXHRjZWxsSHRtbDogJzx0ZC8+JywgLy8gcGxhaW4gZGVmYXVsdCBIVE1MIHVzZWQgZm9yIGEgY2VsbCB3aGVuIG5vIG90aGVyIGlzIGF2YWlsYWJsZVxuXG5cblx0Y29uc3RydWN0b3I6IGZ1bmN0aW9uKHZpZXcpIHtcblx0XHR0aGlzLnZpZXcgPSB2aWV3O1xuXHRcdHRoaXMuaXNSVEwgPSB2aWV3Lm9wdCgnaXNSVEwnKTtcblx0fSxcblxuXG5cdC8vIFJlbmRlcnMgdGhlIEhUTUwgZm9yIGEgcm93LCBsZXZlcmFnaW5nIGN1c3RvbSBjZWxsLUhUTUwtcmVuZGVyZXJzIGJhc2VkIG9uIHRoZSBgcm93VHlwZWAuXG5cdC8vIEFsc28gYXBwbGllcyB0aGUgXCJpbnRyb1wiIGFuZCBcIm91dHJvXCIgY2VsbHMsIHdoaWNoIGFyZSBzcGVjaWZpZWQgYnkgdGhlIHN1YmNsYXNzIGFuZCB2aWV3cy5cblx0Ly8gYHJvd2AgaXMgYW4gb3B0aW9uYWwgcm93IG51bWJlci5cblx0cm93SHRtbDogZnVuY3Rpb24ocm93VHlwZSwgcm93KSB7XG5cdFx0dmFyIHJlbmRlckNlbGwgPSB0aGlzLmdldEh0bWxSZW5kZXJlcignY2VsbCcsIHJvd1R5cGUpO1xuXHRcdHZhciByb3dDZWxsSHRtbCA9ICcnO1xuXHRcdHZhciBjb2w7XG5cdFx0dmFyIGNlbGw7XG5cblx0XHRyb3cgPSByb3cgfHwgMDtcblxuXHRcdGZvciAoY29sID0gMDsgY29sIDwgdGhpcy5jb2xDbnQ7IGNvbCsrKSB7XG5cdFx0XHRjZWxsID0gdGhpcy5nZXRDZWxsKHJvdywgY29sKTtcblx0XHRcdHJvd0NlbGxIdG1sICs9IHJlbmRlckNlbGwoY2VsbCk7XG5cdFx0fVxuXG5cdFx0cm93Q2VsbEh0bWwgPSB0aGlzLmJvb2tlbmRDZWxscyhyb3dDZWxsSHRtbCwgcm93VHlwZSwgcm93KTsgLy8gYXBwbHkgaW50cm8gYW5kIG91dHJvXG5cblx0XHRyZXR1cm4gJzx0cj4nICsgcm93Q2VsbEh0bWwgKyAnPC90cj4nO1xuXHR9LFxuXG5cblx0Ly8gQXBwbGllcyB0aGUgXCJpbnRyb1wiIGFuZCBcIm91dHJvXCIgSFRNTCB0byB0aGUgZ2l2ZW4gY2VsbHMuXG5cdC8vIEludHJvIG1lYW5zIHRoZSBsZWZ0bW9zdCBjZWxsIHdoZW4gdGhlIGNhbGVuZGFyIGlzIExUUiBhbmQgdGhlIHJpZ2h0bW9zdCBjZWxsIHdoZW4gUlRMLiBWaWNlLXZlcnNhIGZvciBvdXRyby5cblx0Ly8gYGNlbGxzYCBjYW4gYmUgYW4gSFRNTCBzdHJpbmcgb2YgPHRkPidzIG9yIGEgalF1ZXJ5IDx0cj4gZWxlbWVudFxuXHQvLyBgcm93YCBpcyBhbiBvcHRpb25hbCByb3cgbnVtYmVyLlxuXHRib29rZW5kQ2VsbHM6IGZ1bmN0aW9uKGNlbGxzLCByb3dUeXBlLCByb3cpIHtcblx0XHR2YXIgaW50cm8gPSB0aGlzLmdldEh0bWxSZW5kZXJlcignaW50cm8nLCByb3dUeXBlKShyb3cgfHwgMCk7XG5cdFx0dmFyIG91dHJvID0gdGhpcy5nZXRIdG1sUmVuZGVyZXIoJ291dHJvJywgcm93VHlwZSkocm93IHx8IDApO1xuXHRcdHZhciBwcmVwZW5kSHRtbCA9IHRoaXMuaXNSVEwgPyBvdXRybyA6IGludHJvO1xuXHRcdHZhciBhcHBlbmRIdG1sID0gdGhpcy5pc1JUTCA/IGludHJvIDogb3V0cm87XG5cblx0XHRpZiAodHlwZW9mIGNlbGxzID09PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIHByZXBlbmRIdG1sICsgY2VsbHMgKyBhcHBlbmRIdG1sO1xuXHRcdH1cblx0XHRlbHNlIHsgLy8gYSBqUXVlcnkgPHRyPiBlbGVtZW50XG5cdFx0XHRyZXR1cm4gY2VsbHMucHJlcGVuZChwcmVwZW5kSHRtbCkuYXBwZW5kKGFwcGVuZEh0bWwpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIFJldHVybnMgYW4gSFRNTC1yZW5kZXJpbmcgZnVuY3Rpb24gZ2l2ZW4gYSBzcGVjaWZpYyBgcmVuZGVyZXJOYW1lYCAobGlrZSBjZWxsLCBpbnRybywgb3Igb3V0cm8pIGFuZCBhIHNwZWNpZmljXG5cdC8vIGByb3dUeXBlYCAobGlrZSBkYXksIGV2ZW50U2tlbGV0b24sIGhlbHBlclNrZWxldG9uKSwgd2hpY2ggaXMgb3B0aW9uYWwuXG5cdC8vIElmIGEgcmVuZGVyZXIgZm9yIHRoZSBzcGVjaWZpYyByb3dUeXBlIGRvZXNuJ3QgZXhpc3QsIGl0IHdpbGwgZmFsbCBiYWNrIHRvIGEgZ2VuZXJpYyByZW5kZXJlci5cblx0Ly8gV2Ugd2lsbCBxdWVyeSB0aGUgVmlldyBvYmplY3QgZmlyc3QgZm9yIGFueSBjdXN0b20gcmVuZGVyaW5nIGZ1bmN0aW9ucywgdGhlbiB0aGUgbWV0aG9kcyBvZiB0aGUgc3ViY2xhc3MuXG5cdGdldEh0bWxSZW5kZXJlcjogZnVuY3Rpb24ocmVuZGVyZXJOYW1lLCByb3dUeXBlKSB7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLnZpZXc7XG5cdFx0dmFyIGdlbmVyYWxOYW1lOyAvLyBsaWtlIFwiY2VsbEh0bWxcIlxuXHRcdHZhciBzcGVjaWZpY05hbWU7IC8vIGxpa2UgXCJkYXlDZWxsSHRtbFwiLiBiYXNlZCBvbiByb3dUeXBlXG5cdFx0dmFyIHByb3ZpZGVyOyAvLyBlaXRoZXIgdGhlIFZpZXcgb3IgdGhlIFJvd1JlbmRlcmVyIHN1YmNsYXNzLCB3aGljaGV2ZXIgcHJvdmlkZWQgdGhlIG1ldGhvZFxuXHRcdHZhciByZW5kZXJlcjtcblxuXHRcdGdlbmVyYWxOYW1lID0gcmVuZGVyZXJOYW1lICsgJ0h0bWwnO1xuXHRcdGlmIChyb3dUeXBlKSB7XG5cdFx0XHRzcGVjaWZpY05hbWUgPSByb3dUeXBlICsgY2FwaXRhbGlzZUZpcnN0TGV0dGVyKHJlbmRlcmVyTmFtZSkgKyAnSHRtbCc7XG5cdFx0fVxuXG5cdFx0aWYgKHNwZWNpZmljTmFtZSAmJiAocmVuZGVyZXIgPSB2aWV3W3NwZWNpZmljTmFtZV0pKSB7XG5cdFx0XHRwcm92aWRlciA9IHZpZXc7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHNwZWNpZmljTmFtZSAmJiAocmVuZGVyZXIgPSB0aGlzW3NwZWNpZmljTmFtZV0pKSB7XG5cdFx0XHRwcm92aWRlciA9IHRoaXM7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKChyZW5kZXJlciA9IHZpZXdbZ2VuZXJhbE5hbWVdKSkge1xuXHRcdFx0cHJvdmlkZXIgPSB2aWV3O1xuXHRcdH1cblx0XHRlbHNlIGlmICgocmVuZGVyZXIgPSB0aGlzW2dlbmVyYWxOYW1lXSkpIHtcblx0XHRcdHByb3ZpZGVyID0gdGhpcztcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHJlbmRlcmVyID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiByZW5kZXJlci5hcHBseShwcm92aWRlciwgYXJndW1lbnRzKSB8fCAnJzsgLy8gdXNlIGNvcnJlY3QgYHRoaXNgIGFuZCBhbHdheXMgcmV0dXJuIGEgc3RyaW5nXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8vIHRoZSByZW5kZXJlZCBjYW4gYmUgYSBwbGFpbiBzdHJpbmcgYXMgd2VsbC4gaWYgbm90IHNwZWNpZmllZCwgYWx3YXlzIGFuIGVtcHR5IHN0cmluZy5cblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gcmVuZGVyZXIgfHwgJyc7XG5cdFx0fTtcblx0fVxuXG59KTtcblxuICAgIC8qIEFuIGFic3RyYWN0IGNsYXNzIGNvbXByaXNlZCBvZiBhIFwiZ3JpZFwiIG9mIGNlbGxzIHRoYXQgZWFjaCByZXByZXNlbnQgYSBzcGVjaWZpYyBkYXRldGltZVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbnZhciBHcmlkID0gZmMuR3JpZCA9IFJvd1JlbmRlcmVyLmV4dGVuZCh7XG5cblx0c3RhcnQ6IG51bGwsIC8vIHRoZSBkYXRlIG9mIHRoZSBmaXJzdCBjZWxsXG5cdGVuZDogbnVsbCwgLy8gdGhlIGRhdGUgYWZ0ZXIgdGhlIGxhc3QgY2VsbFxuXG5cdHJvd0NudDogMCwgLy8gbnVtYmVyIG9mIHJvd3Ncblx0Y29sQ250OiAwLCAvLyBudW1iZXIgb2YgY29sc1xuXHRyb3dEYXRhOiBudWxsLCAvLyBhcnJheSBvZiBvYmplY3RzLCBob2xkaW5nIG1pc2MgZGF0YSBmb3IgZWFjaCByb3dcblx0Y29sRGF0YTogbnVsbCwgLy8gYXJyYXkgb2Ygb2JqZWN0cywgaG9sZGluZyBtaXNjIGRhdGEgZm9yIGVhY2ggY29sdW1uXG5cblx0ZWw6IG51bGwsIC8vIHRoZSBjb250YWluaW5nIGVsZW1lbnRcblx0Y29vcmRNYXA6IG51bGwsIC8vIGEgR3JpZENvb3JkTWFwIHRoYXQgY29udmVydHMgcGl4ZWwgdmFsdWVzIHRvIGRhdGV0aW1lc1xuXHRlbHNCeUZpbGw6IG51bGwsIC8vIGEgaGFzaCBvZiBqUXVlcnkgZWxlbWVudCBzZXRzIHVzZWQgZm9yIHJlbmRlcmluZyBlYWNoIGZpbGwuIEtleWVkIGJ5IGZpbGwgbmFtZS5cblxuXHRkb2N1bWVudERyYWdTdGFydFByb3h5OiBudWxsLCAvLyBiaW5kcyB0aGUgR3JpZCdzIHNjb3BlIHRvIGRvY3VtZW50RHJhZ1N0YXJ0IChpbiBEYXlHcmlkLmV2ZW50cylcblxuXHQvLyBkZXJpdmVkIGZyb20gb3B0aW9uc1xuXHRjb2xIZWFkRm9ybWF0OiBudWxsLCAvLyBUT0RPOiBtb3ZlIHRvIGFub3RoZXIgY2xhc3MuIG5vdCBhcHBsaWNhYmxlIHRvIGFsbCBHcmlkc1xuXHRldmVudFRpbWVGb3JtYXQ6IG51bGwsXG5cdGRpc3BsYXlFdmVudEVuZDogbnVsbCxcblxuXG5cdGNvbnN0cnVjdG9yOiBmdW5jdGlvbigpIHtcblx0XHRSb3dSZW5kZXJlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyAvLyBjYWxsIHRoZSBzdXBlci1jb25zdHJ1Y3RvclxuXG5cdFx0dGhpcy5jb29yZE1hcCA9IG5ldyBHcmlkQ29vcmRNYXAodGhpcyk7XG5cdFx0dGhpcy5lbHNCeUZpbGwgPSB7fTtcblx0XHR0aGlzLmRvY3VtZW50RHJhZ1N0YXJ0UHJveHkgPSAkLnByb3h5KHRoaXMsICdkb2N1bWVudERyYWdTdGFydCcpO1xuXHR9LFxuXG5cblx0Ly8gUmVuZGVycyB0aGUgZ3JpZCBpbnRvIHRoZSBgZWxgIGVsZW1lbnQuXG5cdC8vIFN1YmNsYXNzZXMgc2hvdWxkIG92ZXJyaWRlIGFuZCBjYWxsIHRoaXMgc3VwZXItbWV0aG9kIHdoZW4gZG9uZS5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmJpbmRIYW5kbGVycygpO1xuXHR9LFxuXG5cblx0Ly8gQ2FsbGVkIHdoZW4gdGhlIGdyaWQncyByZXNvdXJjZXMgbmVlZCB0byBiZSBjbGVhbmVkIHVwXG5cdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudW5iaW5kSGFuZGxlcnMoKTtcblx0fSxcblxuXG5cdC8qIE9wdGlvbnNcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIEdlbmVyYXRlcyB0aGUgZm9ybWF0IHN0cmluZyB1c2VkIGZvciB0aGUgdGV4dCBpbiBjb2x1bW4gaGVhZGVycywgaWYgbm90IGV4cGxpY2l0bHkgZGVmaW5lZCBieSAnY29sdW1uRm9ybWF0J1xuXHQvLyBUT0RPOiBtb3ZlIHRvIGFub3RoZXIgY2xhc3MuIG5vdCBhcHBsaWNhYmxlIHRvIGFsbCBHcmlkc1xuXHRjb21wdXRlQ29sSGVhZEZvcm1hdDogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gc3ViY2xhc3NlcyBtdXN0IGltcGxlbWVudCBpZiB0aGV5IHdhbnQgdG8gdXNlIGhlYWRIdG1sKClcblx0fSxcblxuXG5cdC8vIEdlbmVyYXRlcyB0aGUgZm9ybWF0IHN0cmluZyB1c2VkIGZvciBldmVudCB0aW1lIHRleHQsIGlmIG5vdCBleHBsaWNpdGx5IGRlZmluZWQgYnkgJ3RpbWVGb3JtYXQnXG5cdGNvbXB1dGVFdmVudFRpbWVGb3JtYXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnZpZXcub3B0KCdzbWFsbFRpbWVGb3JtYXQnKTtcblx0fSxcblxuXG5cdC8vIERldGVybWluZXMgd2hldGhlciBldmVudHMgc2hvdWxkIGhhdmUgdGhlaXIgZW5kIHRpbWVzIGRpc3BsYXllZCwgaWYgbm90IGV4cGxpY2l0bHkgZGVmaW5lZCBieSAnZGlzcGxheUV2ZW50RW5kJ1xuXHRjb21wdXRlRGlzcGxheUV2ZW50RW5kOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblxuXHQvKiBEYXRlc1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gVGVsbHMgdGhlIGdyaWQgYWJvdXQgd2hhdCBwZXJpb2Qgb2YgdGltZSB0byBkaXNwbGF5LiBHcmlkIHdpbGwgc3Vic2VxdWVudGx5IGNvbXB1dGUgZGF0ZXMgZm9yIGNlbGwgc3lzdGVtLlxuXHRzZXRSYW5nZTogZnVuY3Rpb24ocmFuZ2UpIHtcblx0XHR2YXIgdmlldyA9IHRoaXMudmlldztcblxuXHRcdHRoaXMuc3RhcnQgPSByYW5nZS5zdGFydC5jbG9uZSgpO1xuXHRcdHRoaXMuZW5kID0gcmFuZ2UuZW5kLmNsb25lKCk7XG5cblx0XHR0aGlzLnJvd0RhdGEgPSBbXTtcblx0XHR0aGlzLmNvbERhdGEgPSBbXTtcblx0XHR0aGlzLnVwZGF0ZUNlbGxzKCk7XG5cblx0XHQvLyBQb3B1bGF0ZSBvcHRpb24tZGVyaXZlZCBzZXR0aW5ncy4gTG9vayBmb3Igb3ZlcnJpZGUgZmlyc3QsIHRoZW4gY29tcHV0ZSBpZiBuZWNlc3NhcnkuXG5cdFx0dGhpcy5jb2xIZWFkRm9ybWF0ID0gdmlldy5vcHQoJ2NvbHVtbkZvcm1hdCcpIHx8IHRoaXMuY29tcHV0ZUNvbEhlYWRGb3JtYXQoKTtcblx0XHR0aGlzLmV2ZW50VGltZUZvcm1hdCA9IHZpZXcub3B0KCd0aW1lRm9ybWF0JykgfHwgdGhpcy5jb21wdXRlRXZlbnRUaW1lRm9ybWF0KCk7XG5cdFx0dGhpcy5kaXNwbGF5RXZlbnRFbmQgPSB2aWV3Lm9wdCgnZGlzcGxheUV2ZW50RW5kJyk7XG5cdFx0aWYgKHRoaXMuZGlzcGxheUV2ZW50RW5kID09IG51bGwpIHtcblx0XHRcdHRoaXMuZGlzcGxheUV2ZW50RW5kID0gdGhpcy5jb21wdXRlRGlzcGxheUV2ZW50RW5kKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gUmVzcG9uc2libGUgZm9yIHNldHRpbmcgcm93Q250L2NvbENudCBhbmQgYW55IG90aGVyIHJvdy9jb2wgZGF0YVxuXHR1cGRhdGVDZWxsczogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gc3ViY2xhc3NlcyBtdXN0IGltcGxlbWVudFxuXHR9LFxuXG5cblx0Ly8gQ29udmVydHMgYSByYW5nZSB3aXRoIGFuIGluY2x1c2l2ZSBgc3RhcnRgIGFuZCBhbiBleGNsdXNpdmUgYGVuZGAgaW50byBhbiBhcnJheSBvZiBzZWdtZW50IG9iamVjdHNcblx0cmFuZ2VUb1NlZ3M6IGZ1bmN0aW9uKHJhbmdlKSB7XG5cdFx0Ly8gc3ViY2xhc3NlcyBtdXN0IGltcGxlbWVudFxuXHR9LFxuXG5cblx0LyogQ2VsbHNcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblx0Ly8gTk9URTogY29sdW1ucyBhcmUgb3JkZXJlZCBsZWZ0LXRvLXJpZ2h0XG5cblxuXHQvLyBHZXRzIGFuIG9iamVjdCBjb250YWluaW5nIHJvdy9jb2wgbnVtYmVyLCBtaXNjIGRhdGEsIGFuZCByYW5nZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY2VsbC5cblx0Ly8gQWNjZXB0cyByb3cvY29sIHZhbHVlcywgYW4gb2JqZWN0IHdpdGggcm93L2NvbCBwcm9wZXJ0aWVzLCBvciBhIHNpbmdsZS1udW1iZXIgb2Zmc2V0IGZyb20gdGhlIGZpcnN0IGNlbGwuXG5cdGdldENlbGw6IGZ1bmN0aW9uKHJvdywgY29sKSB7XG5cdFx0dmFyIGNlbGw7XG5cblx0XHRpZiAoY29sID09IG51bGwpIHtcblx0XHRcdGlmICh0eXBlb2Ygcm93ID09PSAnbnVtYmVyJykgeyAvLyBhIHNpbmdsZS1udW1iZXIgb2Zmc2V0XG5cdFx0XHRcdGNvbCA9IHJvdyAlIHRoaXMuY29sQ250O1xuXHRcdFx0XHRyb3cgPSBNYXRoLmZsb29yKHJvdyAvIHRoaXMuY29sQ250KTtcblx0XHRcdH1cblx0XHRcdGVsc2UgeyAvLyBhbiBvYmplY3Qgd2l0aCByb3cvY29sIHByb3BlcnRpZXNcblx0XHRcdFx0Y29sID0gcm93LmNvbDtcblx0XHRcdFx0cm93ID0gcm93LnJvdztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjZWxsID0geyByb3c6IHJvdywgY29sOiBjb2wgfTtcblxuXHRcdCQuZXh0ZW5kKGNlbGwsIHRoaXMuZ2V0Um93RGF0YShyb3cpLCB0aGlzLmdldENvbERhdGEoY29sKSk7XG5cdFx0JC5leHRlbmQoY2VsbCwgdGhpcy5jb21wdXRlQ2VsbFJhbmdlKGNlbGwpKTtcblxuXHRcdHJldHVybiBjZWxsO1xuXHR9LFxuXG5cblx0Ly8gR2l2ZW4gYSBjZWxsIG9iamVjdCB3aXRoIGluZGV4IGFuZCBtaXNjIGRhdGEsIGdlbmVyYXRlcyBhIHJhbmdlIG9iamVjdFxuXHRjb21wdXRlQ2VsbFJhbmdlOiBmdW5jdGlvbihjZWxsKSB7XG5cdFx0Ly8gc3ViY2xhc3NlcyBtdXN0IGltcGxlbWVudFxuXHR9LFxuXG5cblx0Ly8gUmV0cmlldmVzIG1pc2MgZGF0YSBhYm91dCB0aGUgZ2l2ZW4gcm93XG5cdGdldFJvd0RhdGE6IGZ1bmN0aW9uKHJvdykge1xuXHRcdHJldHVybiB0aGlzLnJvd0RhdGFbcm93XSB8fCB7fTtcblx0fSxcblxuXG5cdC8vIFJldHJpZXZlcyBtaXNjIGRhdGEgYmFvdXQgdGhlIGdpdmVuIGNvbHVtblxuXHRnZXRDb2xEYXRhOiBmdW5jdGlvbihjb2wpIHtcblx0XHRyZXR1cm4gdGhpcy5jb2xEYXRhW2NvbF0gfHwge307XG5cdH0sXG5cblxuXHQvLyBSZXRyaWV2ZXMgdGhlIGVsZW1lbnQgcmVwcmVzZW50aW5nIHRoZSBnaXZlbiByb3dcblx0Z2V0Um93RWw6IGZ1bmN0aW9uKHJvdykge1xuXHRcdC8vIHN1YmNsYXNzZXMgc2hvdWxkIGltcGxlbWVudCBpZiBsZXZlcmFnaW5nIHRoZSBkZWZhdWx0IGdldENlbGxEYXlFbCgpIG9yIGNvbXB1dGVSb3dDb29yZHMoKVxuXHR9LFxuXG5cblx0Ly8gUmV0cmlldmVzIHRoZSBlbGVtZW50IHJlcHJlc2VudGluZyB0aGUgZ2l2ZW4gY29sdW1uXG5cdGdldENvbEVsOiBmdW5jdGlvbihjb2wpIHtcblx0XHQvLyBzdWJjbGFzc2VzIHNob3VsZCBpbXBsZW1lbnQgaWYgbGV2ZXJhZ2luZyB0aGUgZGVmYXVsdCBnZXRDZWxsRGF5RWwoKSBvciBjb21wdXRlQ29sQ29vcmRzKClcblx0fSxcblxuXG5cdC8vIEdpdmVuIGEgY2VsbCBvYmplY3QsIHJldHVybnMgdGhlIGVsZW1lbnQgdGhhdCByZXByZXNlbnRzIHRoZSBjZWxsJ3Mgd2hvbGUtZGF5XG5cdGdldENlbGxEYXlFbDogZnVuY3Rpb24oY2VsbCkge1xuXHRcdHJldHVybiB0aGlzLmdldENvbEVsKGNlbGwuY29sKSB8fCB0aGlzLmdldFJvd0VsKGNlbGwucm93KTtcblx0fSxcblxuXG5cdC8qIENlbGwgQ29vcmRpbmF0ZXNcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIENvbXB1dGVzIHRoZSB0b3AvYm90dG9tIGNvb3JkaW5hdGVzIG9mIGFsbCByb3dzLlxuXHQvLyBCeSBkZWZhdWx0LCBxdWVyaWVzIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBlbGVtZW50IHByb3ZpZGVkIGJ5IGdldFJvd0VsKCkuXG5cdGNvbXB1dGVSb3dDb29yZHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBpdGVtcyA9IFtdO1xuXHRcdHZhciBpLCBlbDtcblx0XHR2YXIgaXRlbTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCB0aGlzLnJvd0NudDsgaSsrKSB7XG5cdFx0XHRlbCA9IHRoaXMuZ2V0Um93RWwoaSk7XG5cdFx0XHRpdGVtID0ge1xuXHRcdFx0XHR0b3A6IGVsLm9mZnNldCgpLnRvcFxuXHRcdFx0fTtcblx0XHRcdGlmIChpID4gMCkge1xuXHRcdFx0XHRpdGVtc1tpIC0gMV0uYm90dG9tID0gaXRlbS50b3A7XG5cdFx0XHR9XG5cdFx0XHRpdGVtcy5wdXNoKGl0ZW0pO1xuXHRcdH1cblx0XHRpdGVtLmJvdHRvbSA9IGl0ZW0udG9wICsgZWwub3V0ZXJIZWlnaHQoKTtcblxuXHRcdHJldHVybiBpdGVtcztcblx0fSxcblxuXG5cdC8vIENvbXB1dGVzIHRoZSBsZWZ0L3JpZ2h0IGNvb3JkaW5hdGVzIG9mIGFsbCByb3dzLlxuXHQvLyBCeSBkZWZhdWx0LCBxdWVyaWVzIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBlbGVtZW50IHByb3ZpZGVkIGJ5IGdldENvbEVsKCkuXG5cdGNvbXB1dGVDb2xDb29yZHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBpdGVtcyA9IFtdO1xuXHRcdHZhciBpLCBlbDtcblx0XHR2YXIgaXRlbTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCB0aGlzLmNvbENudDsgaSsrKSB7XG5cdFx0XHRlbCA9IHRoaXMuZ2V0Q29sRWwoaSk7XG5cdFx0XHRpdGVtID0ge1xuXHRcdFx0XHRsZWZ0OiBlbC5vZmZzZXQoKS5sZWZ0XG5cdFx0XHR9O1xuXHRcdFx0aWYgKGkgPiAwKSB7XG5cdFx0XHRcdGl0ZW1zW2kgLSAxXS5yaWdodCA9IGl0ZW0ubGVmdDtcblx0XHRcdH1cblx0XHRcdGl0ZW1zLnB1c2goaXRlbSk7XG5cdFx0fVxuXHRcdGl0ZW0ucmlnaHQgPSBpdGVtLmxlZnQgKyBlbC5vdXRlcldpZHRoKCk7XG5cblx0XHRyZXR1cm4gaXRlbXM7XG5cdH0sXG5cblxuXHQvKiBIYW5kbGVyc1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gQXR0YWNoZXMgaGFuZGxlcnMgdG8gRE9NXG5cdGJpbmRIYW5kbGVyczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdC8vIGF0dGFjaCBhIGhhbmRsZXIgdG8gdGhlIGdyaWQncyByb290IGVsZW1lbnQuXG5cdFx0Ly8gd2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCBpbiB1bmJpbmRIYW5kbGVycyBvciBkZXN0cm95LCBiZWNhdXNlIHdoZW4galF1ZXJ5IHJlbW92ZXMgdGhlIGVsZW1lbnQgZnJvbSB0aGVcblx0XHQvLyBET00gaXQgYXV0b21hdGljYWxseSB1bnJlZ2lzdGVycyB0aGUgaGFuZGxlcnMuXG5cdFx0dGhpcy5lbC5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZXYpIHtcblx0XHRcdGlmIChcblx0XHRcdFx0ISQoZXYudGFyZ2V0KS5pcygnLmZjLWV2ZW50LWNvbnRhaW5lciAqLCAuZmMtbW9yZScpICYmIC8vIG5vdCBhbiBhbiBldmVudCBlbGVtZW50LCBvciBcIm1vcmUuLlwiIGxpbmtcblx0XHRcdFx0ISQoZXYudGFyZ2V0KS5jbG9zZXN0KCcuZmMtcG9wb3ZlcicpLmxlbmd0aCAvLyBub3Qgb24gYSBwb3BvdmVyIChsaWtlIHRoZSBcIm1vcmUuLlwiIGV2ZW50cyBvbmUpXG5cdFx0XHQpIHtcblx0XHRcdFx0X3RoaXMuZGF5TW91c2Vkb3duKGV2KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIGF0dGFjaCBldmVudC1lbGVtZW50LXJlbGF0ZWQgaGFuZGxlcnMuIGluIEdyaWQuZXZlbnRzXG5cdFx0Ly8gc2FtZSBnYXJiYWdlIGNvbGxlY3Rpb24gbm90ZSBhcyBhYm92ZS5cblx0XHR0aGlzLmJpbmRTZWdIYW5kbGVycygpO1xuXG5cdFx0JChkb2N1bWVudCkub24oJ2RyYWdzdGFydCcsIHRoaXMuZG9jdW1lbnREcmFnU3RhcnRQcm94eSk7IC8vIGpxdWkgZHJhZ1xuXHR9LFxuXG5cblx0Ly8gVW5hdHRhY2hlcyBoYW5kbGVycyBmcm9tIHRoZSBET01cblx0dW5iaW5kSGFuZGxlcnM6IGZ1bmN0aW9uKCkge1xuXHRcdCQoZG9jdW1lbnQpLm9mZignZHJhZ3N0YXJ0JywgdGhpcy5kb2N1bWVudERyYWdTdGFydFByb3h5KTsgLy8ganF1aSBkcmFnXG5cdH0sXG5cblxuXHQvLyBQcm9jZXNzIGEgbW91c2Vkb3duIG9uIGFuIGVsZW1lbnQgdGhhdCByZXByZXNlbnRzIGEgZGF5LiBGb3IgZGF5IGNsaWNraW5nIGFuZCBzZWxlY3RpbmcuXG5cdGRheU1vdXNlZG93bjogZnVuY3Rpb24oZXYpIHtcblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXHRcdHZhciB2aWV3ID0gdGhpcy52aWV3O1xuXHRcdHZhciBpc1NlbGVjdGFibGUgPSB2aWV3Lm9wdCgnc2VsZWN0YWJsZScpO1xuXHRcdHZhciBkYXlDbGlja0NlbGw7IC8vIG51bGwgaWYgaW52YWxpZCBkYXlDbGlja1xuXHRcdHZhciBzZWxlY3Rpb25SYW5nZTsgLy8gbnVsbCBpZiBpbnZhbGlkIHNlbGVjdGlvblxuXG5cdFx0Ly8gdGhpcyBsaXN0ZW5lciB0cmFja3MgYSBtb3VzZWRvd24gb24gYSBkYXkgZWxlbWVudCwgYW5kIGEgc3Vic2VxdWVudCBkcmFnLlxuXHRcdC8vIGlmIHRoZSBkcmFnIGVuZHMgb24gdGhlIHNhbWUgZGF5LCBpdCBpcyBhICdkYXlDbGljaycuXG5cdFx0Ly8gaWYgJ3NlbGVjdGFibGUnIGlzIGVuYWJsZWQsIHRoaXMgbGlzdGVuZXIgYWxzbyBkZXRlY3RzIHNlbGVjdGlvbnMuXG5cdFx0dmFyIGRyYWdMaXN0ZW5lciA9IG5ldyBEcmFnTGlzdGVuZXIodGhpcy5jb29yZE1hcCwge1xuXHRcdFx0Ly9kaXN0YW5jZTogNSwgLy8gbmVlZHMgbW9yZSB3b3JrIGlmIHdlIHdhbnQgZGF5Q2xpY2sgdG8gZmlyZSBjb3JyZWN0bHlcblx0XHRcdHNjcm9sbDogdmlldy5vcHQoJ2RyYWdTY3JvbGwnKSxcblx0XHRcdGRyYWdTdGFydDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZpZXcudW5zZWxlY3QoKTsgLy8gc2luY2Ugd2UgY291bGQgYmUgcmVuZGVyaW5nIGEgbmV3IHNlbGVjdGlvbiwgd2Ugd2FudCB0byBjbGVhciBhbnkgb2xkIG9uZVxuXHRcdFx0fSxcblx0XHRcdGNlbGxPdmVyOiBmdW5jdGlvbihjZWxsLCBpc09yaWcpIHtcblx0XHRcdFx0dmFyIG9yaWdDZWxsID0gZHJhZ0xpc3RlbmVyLm9yaWdDZWxsO1xuXHRcdFx0XHRpZiAob3JpZ0NlbGwpIHsgLy8gY2xpY2sgbmVlZHMgdG8gaGF2ZSBzdGFydGVkIG9uIGEgY2VsbFxuXHRcdFx0XHRcdGRheUNsaWNrQ2VsbCA9IGlzT3JpZyA/IGNlbGwgOiBudWxsOyAvLyBzaW5nbGUtY2VsbCBzZWxlY3Rpb24gaXMgYSBkYXkgY2xpY2tcblx0XHRcdFx0XHRpZiAoaXNTZWxlY3RhYmxlKSB7XG5cdFx0XHRcdFx0XHRzZWxlY3Rpb25SYW5nZSA9IF90aGlzLmNvbXB1dGVTZWxlY3Rpb24ob3JpZ0NlbGwsIGNlbGwpO1xuXHRcdFx0XHRcdFx0aWYgKHNlbGVjdGlvblJhbmdlKSB7XG5cdFx0XHRcdFx0XHRcdF90aGlzLnJlbmRlclNlbGVjdGlvbihzZWxlY3Rpb25SYW5nZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0ZGlzYWJsZUN1cnNvcigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGNlbGxPdXQ6IGZ1bmN0aW9uKGNlbGwpIHtcblx0XHRcdFx0ZGF5Q2xpY2tDZWxsID0gbnVsbDtcblx0XHRcdFx0c2VsZWN0aW9uUmFuZ2UgPSBudWxsO1xuXHRcdFx0XHRfdGhpcy5kZXN0cm95U2VsZWN0aW9uKCk7XG5cdFx0XHRcdGVuYWJsZUN1cnNvcigpO1xuXHRcdFx0fSxcblx0XHRcdGxpc3RlblN0b3A6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdGlmIChkYXlDbGlja0NlbGwpIHtcblx0XHRcdFx0XHR2aWV3LnRyaWdnZXIoJ2RheUNsaWNrJywgX3RoaXMuZ2V0Q2VsbERheUVsKGRheUNsaWNrQ2VsbCksIGRheUNsaWNrQ2VsbC5zdGFydCwgZXYpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChzZWxlY3Rpb25SYW5nZSkge1xuXHRcdFx0XHRcdC8vIHRoZSBzZWxlY3Rpb24gd2lsbCBhbHJlYWR5IGhhdmUgYmVlbiByZW5kZXJlZC4ganVzdCByZXBvcnQgaXRcblx0XHRcdFx0XHR2aWV3LnJlcG9ydFNlbGVjdGlvbihzZWxlY3Rpb25SYW5nZSwgZXYpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVuYWJsZUN1cnNvcigpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZHJhZ0xpc3RlbmVyLm1vdXNlZG93bihldik7IC8vIHN0YXJ0IGxpc3RlbmluZywgd2hpY2ggd2lsbCBldmVudHVhbGx5IGluaXRpYXRlIGEgZHJhZ1N0YXJ0XG5cdH0sXG5cblxuXHQvKiBFdmVudCBIZWxwZXJcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblx0Ly8gVE9ETzogc2hvdWxkIHByb2JhYmx5IG1vdmUgdGhpcyB0byBHcmlkLmV2ZW50cywgbGlrZSB3ZSBkaWQgZXZlbnQgZHJhZ2dpbmcgLyByZXNpemluZ1xuXG5cblx0Ly8gUmVuZGVycyBhIG1vY2sgZXZlbnQgb3ZlciB0aGUgZ2l2ZW4gcmFuZ2UuXG5cdC8vIFRoZSByYW5nZSdzIGVuZCBjYW4gYmUgbnVsbCwgaW4gd2hpY2ggY2FzZSB0aGUgbW9jayBldmVudCB0aGF0IGlzIHJlbmRlcmVkIHdpbGwgaGF2ZSBhIG51bGwgZW5kIHRpbWUuXG5cdC8vIGBzb3VyY2VTZWdgIGlzIHRoZSBpbnRlcm5hbCBzZWdtZW50IG9iamVjdCBpbnZvbHZlZCBpbiB0aGUgZHJhZy4gSWYgbnVsbCwgc29tZXRoaW5nIGV4dGVybmFsIGlzIGRyYWdnaW5nLlxuXHRyZW5kZXJSYW5nZUhlbHBlcjogZnVuY3Rpb24ocmFuZ2UsIHNvdXJjZVNlZykge1xuXHRcdHZhciBmYWtlRXZlbnQ7XG5cblx0XHRmYWtlRXZlbnQgPSBzb3VyY2VTZWcgPyBjcmVhdGVPYmplY3Qoc291cmNlU2VnLmV2ZW50KSA6IHt9OyAvLyBtYXNrIHRoZSBvcmlnaW5hbCBldmVudCBvYmplY3QgaWYgcG9zc2libGVcblx0XHRmYWtlRXZlbnQuc3RhcnQgPSByYW5nZS5zdGFydC5jbG9uZSgpO1xuXHRcdGZha2VFdmVudC5lbmQgPSByYW5nZS5lbmQgPyByYW5nZS5lbmQuY2xvbmUoKSA6IG51bGw7XG5cdFx0ZmFrZUV2ZW50LmFsbERheSA9IG51bGw7IC8vIGZvcmNlIGl0IHRvIGJlIGZyZXNobHkgY29tcHV0ZWQgYnkgbm9ybWFsaXplRXZlbnREYXRlUHJvcHNcblx0XHR0aGlzLnZpZXcuY2FsZW5kYXIubm9ybWFsaXplRXZlbnREYXRlUHJvcHMoZmFrZUV2ZW50KTtcblxuXHRcdC8vIHRoaXMgZXh0cmEgY2xhc3NOYW1lIHdpbGwgYmUgdXNlZnVsIGZvciBkaWZmZXJlbnRpYXRpbmcgcmVhbCBldmVudHMgZnJvbSBtb2NrIGV2ZW50cyBpbiBDU1Ncblx0XHRmYWtlRXZlbnQuY2xhc3NOYW1lID0gKGZha2VFdmVudC5jbGFzc05hbWUgfHwgW10pLmNvbmNhdCgnZmMtaGVscGVyJyk7XG5cblx0XHQvLyBpZiBzb21ldGhpbmcgZXh0ZXJuYWwgaXMgYmVpbmcgZHJhZ2dlZCBpbiwgZG9uJ3QgcmVuZGVyIGEgcmVzaXplclxuXHRcdGlmICghc291cmNlU2VnKSB7XG5cdFx0XHRmYWtlRXZlbnQuZWRpdGFibGUgPSBmYWxzZTtcblx0XHR9XG5cblx0XHR0aGlzLnJlbmRlckhlbHBlcihmYWtlRXZlbnQsIHNvdXJjZVNlZyk7IC8vIGRvIHRoZSBhY3R1YWwgcmVuZGVyaW5nXG5cdH0sXG5cblxuXHQvLyBSZW5kZXJzIGEgbW9jayBldmVudFxuXHRyZW5kZXJIZWxwZXI6IGZ1bmN0aW9uKGV2ZW50LCBzb3VyY2VTZWcpIHtcblx0XHQvLyBzdWJjbGFzc2VzIG11c3QgaW1wbGVtZW50XG5cdH0sXG5cblxuXHQvLyBVbnJlbmRlcnMgYSBtb2NrIGV2ZW50XG5cdGRlc3Ryb3lIZWxwZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHN1YmNsYXNzZXMgbXVzdCBpbXBsZW1lbnRcblx0fSxcblxuXG5cdC8qIFNlbGVjdGlvblxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gUmVuZGVycyBhIHZpc3VhbCBpbmRpY2F0aW9uIG9mIGEgc2VsZWN0aW9uLiBXaWxsIGhpZ2hsaWdodCBieSBkZWZhdWx0IGJ1dCBjYW4gYmUgb3ZlcnJpZGRlbiBieSBzdWJjbGFzc2VzLlxuXHRyZW5kZXJTZWxlY3Rpb246IGZ1bmN0aW9uKHJhbmdlKSB7XG5cdFx0dGhpcy5yZW5kZXJIaWdobGlnaHQocmFuZ2UpO1xuXHR9LFxuXG5cblx0Ly8gVW5yZW5kZXJzIGFueSB2aXN1YWwgaW5kaWNhdGlvbnMgb2YgYSBzZWxlY3Rpb24uIFdpbGwgdW5yZW5kZXIgYSBoaWdobGlnaHQgYnkgZGVmYXVsdC5cblx0ZGVzdHJveVNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kZXN0cm95SGlnaGxpZ2h0KCk7XG5cdH0sXG5cblxuXHQvLyBHaXZlbiB0aGUgZmlyc3QgYW5kIGxhc3QgY2VsbHMgb2YgYSBzZWxlY3Rpb24sIHJldHVybnMgYSByYW5nZSBvYmplY3QuXG5cdC8vIFdpbGwgcmV0dXJuIHNvbWV0aGluZyBmYWxzeSBpZiB0aGUgc2VsZWN0aW9uIGlzIGludmFsaWQgKHdoZW4gb3V0c2lkZSBvZiBzZWxlY3Rpb25Db25zdHJhaW50IGZvciBleGFtcGxlKS5cblx0Ly8gU3ViY2xhc3NlcyBjYW4gb3ZlcnJpZGUgYW5kIHByb3ZpZGUgYWRkaXRpb25hbCBkYXRhIGluIHRoZSByYW5nZSBvYmplY3QuIFdpbGwgYmUgcGFzc2VkIHRvIHJlbmRlclNlbGVjdGlvbigpLlxuXHRjb21wdXRlU2VsZWN0aW9uOiBmdW5jdGlvbihmaXJzdENlbGwsIGxhc3RDZWxsKSB7XG5cdFx0dmFyIGRhdGVzID0gW1xuXHRcdFx0Zmlyc3RDZWxsLnN0YXJ0LFxuXHRcdFx0Zmlyc3RDZWxsLmVuZCxcblx0XHRcdGxhc3RDZWxsLnN0YXJ0LFxuXHRcdFx0bGFzdENlbGwuZW5kXG5cdFx0XTtcblx0XHR2YXIgcmFuZ2U7XG5cblx0XHRkYXRlcy5zb3J0KGNvbXBhcmVOdW1iZXJzKTsgLy8gc29ydHMgY2hyb25vbG9naWNhbGx5LiB3b3JrcyB3aXRoIE1vbWVudHNcblxuXHRcdHJhbmdlID0ge1xuXHRcdFx0c3RhcnQ6IGRhdGVzWzBdLmNsb25lKCksXG5cdFx0XHRlbmQ6IGRhdGVzWzNdLmNsb25lKClcblx0XHR9O1xuXG5cdFx0aWYgKCF0aGlzLnZpZXcuY2FsZW5kYXIuaXNTZWxlY3Rpb25SYW5nZUFsbG93ZWQocmFuZ2UpKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmFuZ2U7XG5cdH0sXG5cblxuXHQvKiBIaWdobGlnaHRcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFJlbmRlcnMgYW4gZW1waGFzaXMgb24gdGhlIGdpdmVuIGRhdGUgcmFuZ2UuIGBzdGFydGAgaXMgaW5jbHVzaXZlLiBgZW5kYCBpcyBleGNsdXNpdmUuXG5cdHJlbmRlckhpZ2hsaWdodDogZnVuY3Rpb24ocmFuZ2UpIHtcblx0XHR0aGlzLnJlbmRlckZpbGwoJ2hpZ2hsaWdodCcsIHRoaXMucmFuZ2VUb1NlZ3MocmFuZ2UpKTtcblx0fSxcblxuXG5cdC8vIFVucmVuZGVycyB0aGUgZW1waGFzaXMgb24gYSBkYXRlIHJhbmdlXG5cdGRlc3Ryb3lIaWdobGlnaHQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGVzdHJveUZpbGwoJ2hpZ2hsaWdodCcpO1xuXHR9LFxuXG5cblx0Ly8gR2VuZXJhdGVzIGFuIGFycmF5IG9mIGNsYXNzTmFtZXMgZm9yIHJlbmRlcmluZyB0aGUgaGlnaGxpZ2h0LiBVc2VkIGJ5IHRoZSBmaWxsIHN5c3RlbS5cblx0aGlnaGxpZ2h0U2VnQ2xhc3NlczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFsgJ2ZjLWhpZ2hsaWdodCcgXTtcblx0fSxcblxuXG5cdC8qIEZpbGwgU3lzdGVtIChoaWdobGlnaHQsIGJhY2tncm91bmQgZXZlbnRzLCBidXNpbmVzcyBob3Vycylcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFJlbmRlcnMgYSBzZXQgb2YgcmVjdGFuZ2xlcyBvdmVyIHRoZSBnaXZlbiBzZWdtZW50cyBvZiB0aW1lLlxuXHQvLyBSZXR1cm5zIGEgc3Vic2V0IG9mIHNlZ3MsIHRoZSBzZWdzIHRoYXQgd2VyZSBhY3R1YWxseSByZW5kZXJlZC5cblx0Ly8gUmVzcG9uc2libGUgZm9yIHBvcHVsYXRpbmcgdGhpcy5lbHNCeUZpbGwuIFRPRE86IGJldHRlciBBUEkgZm9yIGV4cHJlc3NpbmcgdGhpcyByZXF1aXJlbWVudFxuXHRyZW5kZXJGaWxsOiBmdW5jdGlvbih0eXBlLCBzZWdzKSB7XG5cdFx0Ly8gc3ViY2xhc3NlcyBtdXN0IGltcGxlbWVudFxuXHR9LFxuXG5cblx0Ly8gVW5yZW5kZXJzIGEgc3BlY2lmaWMgdHlwZSBvZiBmaWxsIHRoYXQgaXMgY3VycmVudGx5IHJlbmRlcmVkIG9uIHRoZSBncmlkXG5cdGRlc3Ryb3lGaWxsOiBmdW5jdGlvbih0eXBlKSB7XG5cdFx0dmFyIGVsID0gdGhpcy5lbHNCeUZpbGxbdHlwZV07XG5cblx0XHRpZiAoZWwpIHtcblx0XHRcdGVsLnJlbW92ZSgpO1xuXHRcdFx0ZGVsZXRlIHRoaXMuZWxzQnlGaWxsW3R5cGVdO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIFJlbmRlcnMgYW5kIGFzc2lnbnMgYW4gYGVsYCBwcm9wZXJ0eSBmb3IgZWFjaCBmaWxsIHNlZ21lbnQuIEdlbmVyaWMgZW5vdWdoIHRvIHdvcmsgd2l0aCBkaWZmZXJlbnQgdHlwZXMuXG5cdC8vIE9ubHkgcmV0dXJucyBzZWdtZW50cyB0aGF0IHN1Y2Nlc3NmdWxseSByZW5kZXJlZC5cblx0Ly8gVG8gYmUgaGFybmVzc2VkIGJ5IHJlbmRlckZpbGwgKGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXMpLlxuXHQvLyBBbmFsYWdvdXMgdG8gcmVuZGVyRmdTZWdFbHMuXG5cdHJlbmRlckZpbGxTZWdFbHM6IGZ1bmN0aW9uKHR5cGUsIHNlZ3MpIHtcblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXHRcdHZhciBzZWdFbE1ldGhvZCA9IHRoaXNbdHlwZSArICdTZWdFbCddO1xuXHRcdHZhciBodG1sID0gJyc7XG5cdFx0dmFyIHJlbmRlcmVkU2VncyA9IFtdO1xuXHRcdHZhciBpO1xuXG5cdFx0aWYgKHNlZ3MubGVuZ3RoKSB7XG5cblx0XHRcdC8vIGJ1aWxkIGEgbGFyZ2UgY29uY2F0ZW5hdGlvbiBvZiBzZWdtZW50IEhUTUxcblx0XHRcdGZvciAoaSA9IDA7IGkgPCBzZWdzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGh0bWwgKz0gdGhpcy5maWxsU2VnSHRtbCh0eXBlLCBzZWdzW2ldKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gR3JhYiBpbmRpdmlkdWFsIGVsZW1lbnRzIGZyb20gdGhlIGNvbWJpbmVkIEhUTUwgc3RyaW5nLiBVc2UgZWFjaCBhcyB0aGUgZGVmYXVsdCByZW5kZXJpbmcuXG5cdFx0XHQvLyBUaGVuLCBjb21wdXRlIHRoZSAnZWwnIGZvciBlYWNoIHNlZ21lbnQuXG5cdFx0XHQkKGh0bWwpLmVhY2goZnVuY3Rpb24oaSwgbm9kZSkge1xuXHRcdFx0XHR2YXIgc2VnID0gc2Vnc1tpXTtcblx0XHRcdFx0dmFyIGVsID0gJChub2RlKTtcblxuXHRcdFx0XHQvLyBhbGxvdyBjdXN0b20gZmlsdGVyIG1ldGhvZHMgcGVyLXR5cGVcblx0XHRcdFx0aWYgKHNlZ0VsTWV0aG9kKSB7XG5cdFx0XHRcdFx0ZWwgPSBzZWdFbE1ldGhvZC5jYWxsKF90aGlzLCBzZWcsIGVsKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChlbCkgeyAvLyBjdXN0b20gZmlsdGVycyBkaWQgbm90IGNhbmNlbCB0aGUgcmVuZGVyXG5cdFx0XHRcdFx0ZWwgPSAkKGVsKTsgLy8gYWxsb3cgY3VzdG9tIGZpbHRlciB0byByZXR1cm4gcmF3IERPTSBub2RlXG5cblx0XHRcdFx0XHQvLyBjb3JyZWN0IGVsZW1lbnQgdHlwZT8gKHdvdWxkIGJlIGJhZCBpZiBhIG5vbi1URCB3ZXJlIGluc2VydGVkIGludG8gYSB0YWJsZSBmb3IgZXhhbXBsZSlcblx0XHRcdFx0XHRpZiAoZWwuaXMoX3RoaXMuZmlsbFNlZ1RhZykpIHtcblx0XHRcdFx0XHRcdHNlZy5lbCA9IGVsO1xuXHRcdFx0XHRcdFx0cmVuZGVyZWRTZWdzLnB1c2goc2VnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiByZW5kZXJlZFNlZ3M7XG5cdH0sXG5cblxuXHRmaWxsU2VnVGFnOiAnZGl2JywgLy8gc3ViY2xhc3NlcyBjYW4gb3ZlcnJpZGVcblxuXG5cdC8vIEJ1aWxkcyB0aGUgSFRNTCBuZWVkZWQgZm9yIG9uZSBmaWxsIHNlZ21lbnQuIEdlbmVyaWMgZW5vdWdodCBvIHdvcmsgd2l0aCBkaWZmZXJlbnQgdHlwZXMuXG5cdGZpbGxTZWdIdG1sOiBmdW5jdGlvbih0eXBlLCBzZWcpIHtcblx0XHR2YXIgY2xhc3Nlc01ldGhvZCA9IHRoaXNbdHlwZSArICdTZWdDbGFzc2VzJ107IC8vIGN1c3RvbSBob29rcyBwZXItdHlwZVxuXHRcdHZhciBzdHlsZXNNZXRob2QgPSB0aGlzW3R5cGUgKyAnU2VnU3R5bGVzJ107IC8vXG5cdFx0dmFyIGNsYXNzZXMgPSBjbGFzc2VzTWV0aG9kID8gY2xhc3Nlc01ldGhvZC5jYWxsKHRoaXMsIHNlZykgOiBbXTtcblx0XHR2YXIgc3R5bGVzID0gc3R5bGVzTWV0aG9kID8gc3R5bGVzTWV0aG9kLmNhbGwodGhpcywgc2VnKSA6ICcnOyAvLyBhIHNlbWktY29sb24gc2VwYXJhdGVkIENTUyBwcm9wZXJ0eSBzdHJpbmdcblxuXHRcdHJldHVybiAnPCcgKyB0aGlzLmZpbGxTZWdUYWcgK1xuXHRcdFx0KGNsYXNzZXMubGVuZ3RoID8gJyBjbGFzcz1cIicgKyBjbGFzc2VzLmpvaW4oJyAnKSArICdcIicgOiAnJykgK1xuXHRcdFx0KHN0eWxlcyA/ICcgc3R5bGU9XCInICsgc3R5bGVzICsgJ1wiJyA6ICcnKSArXG5cdFx0XHQnIC8+Jztcblx0fSxcblxuXG5cdC8qIEdlbmVyaWMgcmVuZGVyaW5nIHV0aWxpdGllcyBmb3Igc3ViY2xhc3Nlc1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gUmVuZGVycyBhIGRheS1vZi13ZWVrIGhlYWRlciByb3cuXG5cdC8vIFRPRE86IG1vdmUgdG8gYW5vdGhlciBjbGFzcy4gbm90IGFwcGxpY2FibGUgdG8gYWxsIEdyaWRzXG5cdGhlYWRIdG1sOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJycgK1xuXHRcdFx0JzxkaXYgY2xhc3M9XCJmYy1yb3cgJyArIHRoaXMudmlldy53aWRnZXRIZWFkZXJDbGFzcyArICdcIj4nICtcblx0XHRcdFx0Jzx0YWJsZT4nICtcblx0XHRcdFx0XHQnPHRoZWFkPicgK1xuXHRcdFx0XHRcdFx0dGhpcy5yb3dIdG1sKCdoZWFkJykgKyAvLyBsZXZlcmFnZXMgUm93UmVuZGVyZXJcblx0XHRcdFx0XHQnPC90aGVhZD4nICtcblx0XHRcdFx0JzwvdGFibGU+JyArXG5cdFx0XHQnPC9kaXY+Jztcblx0fSxcblxuXG5cdC8vIFVzZWQgYnkgdGhlIGBoZWFkSHRtbGAgbWV0aG9kLCB2aWEgUm93UmVuZGVyZXIsIGZvciByZW5kZXJpbmcgdGhlIEhUTUwgb2YgYSBkYXktb2Ytd2VlayBoZWFkZXIgY2VsbFxuXHQvLyBUT0RPOiBtb3ZlIHRvIGFub3RoZXIgY2xhc3MuIG5vdCBhcHBsaWNhYmxlIHRvIGFsbCBHcmlkc1xuXHRoZWFkQ2VsbEh0bWw6IGZ1bmN0aW9uKGNlbGwpIHtcblx0XHR2YXIgdmlldyA9IHRoaXMudmlldztcblx0XHR2YXIgZGF0ZSA9IGNlbGwuc3RhcnQ7XG5cblx0XHRyZXR1cm4gJycgK1xuXHRcdFx0Jzx0aCBjbGFzcz1cImZjLWRheS1oZWFkZXIgJyArIHZpZXcud2lkZ2V0SGVhZGVyQ2xhc3MgKyAnIGZjLScgKyBkYXlJRHNbZGF0ZS5kYXkoKV0gKyAnXCI+JyArXG5cdFx0XHRcdGh0bWxFc2NhcGUoZGF0ZS5mb3JtYXQodGhpcy5jb2xIZWFkRm9ybWF0KSkgK1xuXHRcdFx0JzwvdGg+Jztcblx0fSxcblxuXG5cdC8vIFJlbmRlcnMgdGhlIEhUTUwgZm9yIGEgc2luZ2xlLWRheSBiYWNrZ3JvdW5kIGNlbGxcblx0YmdDZWxsSHRtbDogZnVuY3Rpb24oY2VsbCkge1xuXHRcdHZhciB2aWV3ID0gdGhpcy52aWV3O1xuXHRcdHZhciBkYXRlID0gY2VsbC5zdGFydDtcblx0XHR2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0RGF5Q2xhc3NlcyhkYXRlKTtcblxuXHRcdGNsYXNzZXMudW5zaGlmdCgnZmMtZGF5Jywgdmlldy53aWRnZXRDb250ZW50Q2xhc3MpO1xuXG5cdFx0cmV0dXJuICc8dGQgY2xhc3M9XCInICsgY2xhc3Nlcy5qb2luKCcgJykgKyAnXCInICtcblx0XHRcdCcgZGF0YS1kYXRlPVwiJyArIGRhdGUuZm9ybWF0KCdZWVlZLU1NLUREJykgKyAnXCInICsgLy8gaWYgZGF0ZSBoYXMgYSB0aW1lLCB3b24ndCBmb3JtYXQgaXRcblx0XHRcdCc+PC90ZD4nO1xuXHR9LFxuXG5cblx0Ly8gQ29tcHV0ZXMgSFRNTCBjbGFzc05hbWVzIGZvciBhIHNpbmdsZS1kYXkgY2VsbFxuXHRnZXREYXlDbGFzc2VzOiBmdW5jdGlvbihkYXRlKSB7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLnZpZXc7XG5cdFx0dmFyIHRvZGF5ID0gdmlldy5jYWxlbmRhci5nZXROb3coKS5zdHJpcFRpbWUoKTtcblx0XHR2YXIgY2xhc3NlcyA9IFsgJ2ZjLScgKyBkYXlJRHNbZGF0ZS5kYXkoKV0gXTtcblxuXHRcdGlmIChcblx0XHRcdHZpZXcubmFtZSA9PT0gJ21vbnRoJyAmJlxuXHRcdFx0ZGF0ZS5tb250aCgpICE9IHZpZXcuaW50ZXJ2YWxTdGFydC5tb250aCgpXG5cdFx0KSB7XG5cdFx0XHRjbGFzc2VzLnB1c2goJ2ZjLW90aGVyLW1vbnRoJyk7XG5cdFx0fVxuXG5cdFx0aWYgKGRhdGUuaXNTYW1lKHRvZGF5LCAnZGF5JykpIHtcblx0XHRcdGNsYXNzZXMucHVzaChcblx0XHRcdFx0J2ZjLXRvZGF5Jyxcblx0XHRcdFx0dmlldy5oaWdobGlnaHRTdGF0ZUNsYXNzXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRlbHNlIGlmIChkYXRlIDwgdG9kYXkpIHtcblx0XHRcdGNsYXNzZXMucHVzaCgnZmMtcGFzdCcpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGNsYXNzZXMucHVzaCgnZmMtZnV0dXJlJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNsYXNzZXM7XG5cdH1cblxufSk7XG5cbiAgICAvKiBFdmVudC1yZW5kZXJpbmcgYW5kIGV2ZW50LWludGVyYWN0aW9uIG1ldGhvZHMgZm9yIHRoZSBhYnN0cmFjdCBHcmlkIGNsYXNzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuR3JpZC5taXhpbih7XG5cblx0bW91c2VkT3ZlclNlZzogbnVsbCwgLy8gdGhlIHNlZ21lbnQgb2JqZWN0IHRoZSB1c2VyJ3MgbW91c2UgaXMgb3Zlci4gbnVsbCBpZiBvdmVyIG5vdGhpbmdcblx0aXNEcmFnZ2luZ1NlZzogZmFsc2UsIC8vIGlzIGEgc2VnbWVudCBiZWluZyBkcmFnZ2VkPyBib29sZWFuXG5cdGlzUmVzaXppbmdTZWc6IGZhbHNlLCAvLyBpcyBhIHNlZ21lbnQgYmVpbmcgcmVzaXplZD8gYm9vbGVhblxuXHRzZWdzOiBudWxsLCAvLyB0aGUgZXZlbnQgc2VnbWVudHMgY3VycmVudGx5IHJlbmRlcmVkIGluIHRoZSBncmlkXG5cblxuXHQvLyBSZW5kZXJzIHRoZSBnaXZlbiBldmVudHMgb250byB0aGUgZ3JpZFxuXHRyZW5kZXJFdmVudHM6IGZ1bmN0aW9uKGV2ZW50cykge1xuXHRcdHZhciBzZWdzID0gdGhpcy5ldmVudHNUb1NlZ3MoZXZlbnRzKTtcblx0XHR2YXIgYmdTZWdzID0gW107XG5cdFx0dmFyIGZnU2VncyA9IFtdO1xuXHRcdHZhciBpLCBzZWc7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgc2Vncy5sZW5ndGg7IGkrKykge1xuXHRcdFx0c2VnID0gc2Vnc1tpXTtcblxuXHRcdFx0aWYgKGlzQmdFdmVudChzZWcuZXZlbnQpKSB7XG5cdFx0XHRcdGJnU2Vncy5wdXNoKHNlZyk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0ZmdTZWdzLnB1c2goc2VnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBSZW5kZXIgZWFjaCBkaWZmZXJlbnQgdHlwZSBvZiBzZWdtZW50LlxuXHRcdC8vIEVhY2ggZnVuY3Rpb24gbWF5IHJldHVybiBhIHN1YnNldCBvZiB0aGUgc2Vncywgc2VncyB0aGF0IHdlcmUgYWN0dWFsbHkgcmVuZGVyZWQuXG5cdFx0YmdTZWdzID0gdGhpcy5yZW5kZXJCZ1NlZ3MoYmdTZWdzKSB8fCBiZ1NlZ3M7XG5cdFx0ZmdTZWdzID0gdGhpcy5yZW5kZXJGZ1NlZ3MoZmdTZWdzKSB8fCBmZ1NlZ3M7XG5cblx0XHR0aGlzLnNlZ3MgPSBiZ1NlZ3MuY29uY2F0KGZnU2Vncyk7XG5cdH0sXG5cblxuXHQvLyBVbnJlbmRlcnMgYWxsIGV2ZW50cyBjdXJyZW50bHkgcmVuZGVyZWQgb24gdGhlIGdyaWRcblx0ZGVzdHJveUV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50cmlnZ2VyU2VnTW91c2VvdXQoKTsgLy8gdHJpZ2dlciBhbiBldmVudE1vdXNlb3V0IGlmIHVzZXIncyBtb3VzZSBpcyBvdmVyIGFuIGV2ZW50XG5cblx0XHR0aGlzLmRlc3Ryb3lGZ1NlZ3MoKTtcblx0XHR0aGlzLmRlc3Ryb3lCZ1NlZ3MoKTtcblxuXHRcdHRoaXMuc2VncyA9IG51bGw7XG5cdH0sXG5cblxuXHQvLyBSZXRyaWV2ZXMgYWxsIHJlbmRlcmVkIHNlZ21lbnQgb2JqZWN0cyBjdXJyZW50bHkgcmVuZGVyZWQgb24gdGhlIGdyaWRcblx0Z2V0RXZlbnRTZWdzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5zZWdzIHx8IFtdO1xuXHR9LFxuXG5cblx0LyogRm9yZWdyb3VuZCBTZWdtZW50IFJlbmRlcmluZ1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gUmVuZGVycyBmb3JlZ3JvdW5kIGV2ZW50IHNlZ21lbnRzIG9udG8gdGhlIGdyaWQuIE1heSByZXR1cm4gYSBzdWJzZXQgb2Ygc2VncyB0aGF0IHdlcmUgcmVuZGVyZWQuXG5cdHJlbmRlckZnU2VnczogZnVuY3Rpb24oc2Vncykge1xuXHRcdC8vIHN1YmNsYXNzZXMgbXVzdCBpbXBsZW1lbnRcblx0fSxcblxuXG5cdC8vIFVucmVuZGVycyBhbGwgY3VycmVudGx5IHJlbmRlcmVkIGZvcmVncm91bmQgc2VnbWVudHNcblx0ZGVzdHJveUZnU2VnczogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gc3ViY2xhc3NlcyBtdXN0IGltcGxlbWVudFxuXHR9LFxuXG5cblx0Ly8gUmVuZGVycyBhbmQgYXNzaWducyBhbiBgZWxgIHByb3BlcnR5IGZvciBlYWNoIGZvcmVncm91bmQgZXZlbnQgc2VnbWVudC5cblx0Ly8gT25seSByZXR1cm5zIHNlZ21lbnRzIHRoYXQgc3VjY2Vzc2Z1bGx5IHJlbmRlcmVkLlxuXHQvLyBBIHV0aWxpdHkgdGhhdCBzdWJjbGFzc2VzIG1heSB1c2UuXG5cdHJlbmRlckZnU2VnRWxzOiBmdW5jdGlvbihzZWdzLCBkaXNhYmxlUmVzaXppbmcpIHtcblx0XHR2YXIgdmlldyA9IHRoaXMudmlldztcblx0XHR2YXIgaHRtbCA9ICcnO1xuXHRcdHZhciByZW5kZXJlZFNlZ3MgPSBbXTtcblx0XHR2YXIgaTtcblxuXHRcdGlmIChzZWdzLmxlbmd0aCkgeyAvLyBkb24ndCBidWlsZCBhbiBlbXB0eSBodG1sIHN0cmluZ1xuXG5cdFx0XHQvLyBidWlsZCBhIGxhcmdlIGNvbmNhdGVuYXRpb24gb2YgZXZlbnQgc2VnbWVudCBIVE1MXG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgc2Vncy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRodG1sICs9IHRoaXMuZmdTZWdIdG1sKHNlZ3NbaV0sIGRpc2FibGVSZXNpemluZyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEdyYWIgaW5kaXZpZHVhbCBlbGVtZW50cyBmcm9tIHRoZSBjb21iaW5lZCBIVE1MIHN0cmluZy4gVXNlIGVhY2ggYXMgdGhlIGRlZmF1bHQgcmVuZGVyaW5nLlxuXHRcdFx0Ly8gVGhlbiwgY29tcHV0ZSB0aGUgJ2VsJyBmb3IgZWFjaCBzZWdtZW50LiBBbiBlbCBtaWdodCBiZSBudWxsIGlmIHRoZSBldmVudFJlbmRlciBjYWxsYmFjayByZXR1cm5lZCBmYWxzZS5cblx0XHRcdCQoaHRtbCkuZWFjaChmdW5jdGlvbihpLCBub2RlKSB7XG5cdFx0XHRcdHZhciBzZWcgPSBzZWdzW2ldO1xuXHRcdFx0XHR2YXIgZWwgPSB2aWV3LnJlc29sdmVFdmVudEVsKHNlZy5ldmVudCwgJChub2RlKSk7XG5cblx0XHRcdFx0aWYgKGVsKSB7XG5cdFx0XHRcdFx0ZWwuZGF0YSgnZmMtc2VnJywgc2VnKTsgLy8gdXNlZCBieSBoYW5kbGVyc1xuXHRcdFx0XHRcdHNlZy5lbCA9IGVsO1xuXHRcdFx0XHRcdHJlbmRlcmVkU2Vncy5wdXNoKHNlZyk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiByZW5kZXJlZFNlZ3M7XG5cdH0sXG5cblxuXHQvLyBHZW5lcmF0ZXMgdGhlIEhUTUwgZm9yIHRoZSBkZWZhdWx0IHJlbmRlcmluZyBvZiBhIGZvcmVncm91bmQgZXZlbnQgc2VnbWVudC4gVXNlZCBieSByZW5kZXJGZ1NlZ0VscygpXG5cdGZnU2VnSHRtbDogZnVuY3Rpb24oc2VnLCBkaXNhYmxlUmVzaXppbmcpIHtcblx0XHQvLyBzdWJjbGFzc2VzIHNob3VsZCBpbXBsZW1lbnRcblx0fSxcblxuXG5cdC8qIEJhY2tncm91bmQgU2VnbWVudCBSZW5kZXJpbmdcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFJlbmRlcnMgdGhlIGdpdmVuIGJhY2tncm91bmQgZXZlbnQgc2VnbWVudHMgb250byB0aGUgZ3JpZC5cblx0Ly8gUmV0dXJucyBhIHN1YnNldCBvZiB0aGUgc2VncyB0aGF0IHdlcmUgYWN0dWFsbHkgcmVuZGVyZWQuXG5cdHJlbmRlckJnU2VnczogZnVuY3Rpb24oc2Vncykge1xuXHRcdHJldHVybiB0aGlzLnJlbmRlckZpbGwoJ2JnRXZlbnQnLCBzZWdzKTtcblx0fSxcblxuXG5cdC8vIFVucmVuZGVycyBhbGwgdGhlIGN1cnJlbnRseSByZW5kZXJlZCBiYWNrZ3JvdW5kIGV2ZW50IHNlZ21lbnRzXG5cdGRlc3Ryb3lCZ1NlZ3M6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGVzdHJveUZpbGwoJ2JnRXZlbnQnKTtcblx0fSxcblxuXG5cdC8vIFJlbmRlcnMgYSBiYWNrZ3JvdW5kIGV2ZW50IGVsZW1lbnQsIGdpdmVuIHRoZSBkZWZhdWx0IHJlbmRlcmluZy4gQ2FsbGVkIGJ5IHRoZSBmaWxsIHN5c3RlbS5cblx0YmdFdmVudFNlZ0VsOiBmdW5jdGlvbihzZWcsIGVsKSB7XG5cdFx0cmV0dXJuIHRoaXMudmlldy5yZXNvbHZlRXZlbnRFbChzZWcuZXZlbnQsIGVsKTsgLy8gd2lsbCBmaWx0ZXIgdGhyb3VnaCBldmVudFJlbmRlclxuXHR9LFxuXG5cblx0Ly8gR2VuZXJhdGVzIGFuIGFycmF5IG9mIGNsYXNzTmFtZXMgdG8gYmUgdXNlZCBmb3IgdGhlIGRlZmF1bHQgcmVuZGVyaW5nIG9mIGEgYmFja2dyb3VuZCBldmVudC5cblx0Ly8gQ2FsbGVkIGJ5IHRoZSBmaWxsIHN5c3RlbS5cblx0YmdFdmVudFNlZ0NsYXNzZXM6IGZ1bmN0aW9uKHNlZykge1xuXHRcdHZhciBldmVudCA9IHNlZy5ldmVudDtcblx0XHR2YXIgc291cmNlID0gZXZlbnQuc291cmNlIHx8IHt9O1xuXG5cdFx0cmV0dXJuIFsgJ2ZjLWJnZXZlbnQnIF0uY29uY2F0KFxuXHRcdFx0ZXZlbnQuY2xhc3NOYW1lLFxuXHRcdFx0c291cmNlLmNsYXNzTmFtZSB8fCBbXVxuXHRcdCk7XG5cdH0sXG5cblxuXHQvLyBHZW5lcmF0ZXMgYSBzZW1pY29sb24tc2VwYXJhdGVkIENTUyBzdHJpbmcgdG8gYmUgdXNlZCBmb3IgdGhlIGRlZmF1bHQgcmVuZGVyaW5nIG9mIGEgYmFja2dyb3VuZCBldmVudC5cblx0Ly8gQ2FsbGVkIGJ5IHRoZSBmaWxsIHN5c3RlbS5cblx0Ly8gVE9ETzogY29uc29saWRhdGUgd2l0aCBnZXRFdmVudFNraW5Dc3M/XG5cdGJnRXZlbnRTZWdTdHlsZXM6IGZ1bmN0aW9uKHNlZykge1xuXHRcdHZhciB2aWV3ID0gdGhpcy52aWV3O1xuXHRcdHZhciBldmVudCA9IHNlZy5ldmVudDtcblx0XHR2YXIgc291cmNlID0gZXZlbnQuc291cmNlIHx8IHt9O1xuXHRcdHZhciBldmVudENvbG9yID0gZXZlbnQuY29sb3I7XG5cdFx0dmFyIHNvdXJjZUNvbG9yID0gc291cmNlLmNvbG9yO1xuXHRcdHZhciBvcHRpb25Db2xvciA9IHZpZXcub3B0KCdldmVudENvbG9yJyk7XG5cdFx0dmFyIGJhY2tncm91bmRDb2xvciA9XG5cdFx0XHRldmVudC5iYWNrZ3JvdW5kQ29sb3IgfHxcblx0XHRcdGV2ZW50Q29sb3IgfHxcblx0XHRcdHNvdXJjZS5iYWNrZ3JvdW5kQ29sb3IgfHxcblx0XHRcdHNvdXJjZUNvbG9yIHx8XG5cdFx0XHR2aWV3Lm9wdCgnZXZlbnRCYWNrZ3JvdW5kQ29sb3InKSB8fFxuXHRcdFx0b3B0aW9uQ29sb3I7XG5cblx0XHRpZiAoYmFja2dyb3VuZENvbG9yKSB7XG5cdFx0XHRyZXR1cm4gJ2JhY2tncm91bmQtY29sb3I6JyArIGJhY2tncm91bmRDb2xvcjtcblx0XHR9XG5cblx0XHRyZXR1cm4gJyc7XG5cdH0sXG5cblxuXHQvLyBHZW5lcmF0ZXMgYW4gYXJyYXkgb2YgY2xhc3NOYW1lcyB0byBiZSB1c2VkIGZvciB0aGUgcmVuZGVyaW5nIGJ1c2luZXNzIGhvdXJzIG92ZXJsYXkuIENhbGxlZCBieSB0aGUgZmlsbCBzeXN0ZW0uXG5cdGJ1c2luZXNzSG91cnNTZWdDbGFzc2VzOiBmdW5jdGlvbihzZWcpIHtcblx0XHRyZXR1cm4gWyAnZmMtbm9uYnVzaW5lc3MnLCAnZmMtYmdldmVudCcgXTtcblx0fSxcblxuXG5cdC8qIEhhbmRsZXJzXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuXHQvLyBBdHRhY2hlcyBldmVudC1lbGVtZW50LXJlbGF0ZWQgaGFuZGxlcnMgdG8gdGhlIGNvbnRhaW5lciBlbGVtZW50IGFuZCBsZXZlcmFnZSBidWJibGluZ1xuXHRiaW5kU2VnSGFuZGxlcnM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLnZpZXc7XG5cblx0XHQkLmVhY2goXG5cdFx0XHR7XG5cdFx0XHRcdG1vdXNlZW50ZXI6IGZ1bmN0aW9uKHNlZywgZXYpIHtcblx0XHRcdFx0XHRfdGhpcy50cmlnZ2VyU2VnTW91c2VvdmVyKHNlZywgZXYpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRtb3VzZWxlYXZlOiBmdW5jdGlvbihzZWcsIGV2KSB7XG5cdFx0XHRcdFx0X3RoaXMudHJpZ2dlclNlZ01vdXNlb3V0KHNlZywgZXYpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRjbGljazogZnVuY3Rpb24oc2VnLCBldikge1xuXHRcdFx0XHRcdHJldHVybiB2aWV3LnRyaWdnZXIoJ2V2ZW50Q2xpY2snLCB0aGlzLCBzZWcuZXZlbnQsIGV2KTsgLy8gY2FuIHJldHVybiBgZmFsc2VgIHRvIGNhbmNlbFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtb3VzZWRvd246IGZ1bmN0aW9uKHNlZywgZXYpIHtcblx0XHRcdFx0XHRpZiAoJChldi50YXJnZXQpLmlzKCcuZmMtcmVzaXplcicpICYmIHZpZXcuaXNFdmVudFJlc2l6YWJsZShzZWcuZXZlbnQpKSB7XG5cdFx0XHRcdFx0XHRfdGhpcy5zZWdSZXNpemVNb3VzZWRvd24oc2VnLCBldik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKHZpZXcuaXNFdmVudERyYWdnYWJsZShzZWcuZXZlbnQpKSB7XG5cdFx0XHRcdFx0XHRfdGhpcy5zZWdEcmFnTW91c2Vkb3duKHNlZywgZXYpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGZ1bmN0aW9uKG5hbWUsIGZ1bmMpIHtcblx0XHRcdFx0Ly8gYXR0YWNoIHRoZSBoYW5kbGVyIHRvIHRoZSBjb250YWluZXIgZWxlbWVudCBhbmQgb25seSBsaXN0ZW4gZm9yIHJlYWwgZXZlbnQgZWxlbWVudHMgdmlhIGJ1YmJsaW5nXG5cdFx0XHRcdF90aGlzLmVsLm9uKG5hbWUsICcuZmMtZXZlbnQtY29udGFpbmVyID4gKicsIGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0dmFyIHNlZyA9ICQodGhpcykuZGF0YSgnZmMtc2VnJyk7IC8vIGdyYWIgc2VnbWVudCBkYXRhLiBwdXQgdGhlcmUgYnkgVmlldzo6cmVuZGVyRXZlbnRzXG5cblx0XHRcdFx0XHQvLyBvbmx5IGNhbGwgdGhlIGhhbmRsZXJzIGlmIHRoZXJlIGlzIG5vdCBhIGRyYWcvcmVzaXplIGluIHByb2dyZXNzXG5cdFx0XHRcdFx0aWYgKHNlZyAmJiAhX3RoaXMuaXNEcmFnZ2luZ1NlZyAmJiAhX3RoaXMuaXNSZXNpemluZ1NlZykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBzZWcsIGV2KTsgLy8gYHRoaXNgIHdpbGwgYmUgdGhlIGV2ZW50IGVsZW1lbnRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdCk7XG5cdH0sXG5cblxuXHQvLyBVcGRhdGVzIGludGVybmFsIHN0YXRlIGFuZCB0cmlnZ2VycyBoYW5kbGVycyBmb3Igd2hlbiBhbiBldmVudCBlbGVtZW50IGlzIG1vdXNlZCBvdmVyXG5cdHRyaWdnZXJTZWdNb3VzZW92ZXI6IGZ1bmN0aW9uKHNlZywgZXYpIHtcblx0XHRpZiAoIXRoaXMubW91c2VkT3ZlclNlZykge1xuXHRcdFx0dGhpcy5tb3VzZWRPdmVyU2VnID0gc2VnO1xuXHRcdFx0dGhpcy52aWV3LnRyaWdnZXIoJ2V2ZW50TW91c2VvdmVyJywgc2VnLmVsWzBdLCBzZWcuZXZlbnQsIGV2KTtcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBVcGRhdGVzIGludGVybmFsIHN0YXRlIGFuZCB0cmlnZ2VycyBoYW5kbGVycyBmb3Igd2hlbiBhbiBldmVudCBlbGVtZW50IGlzIG1vdXNlZCBvdXQuXG5cdC8vIENhbiBiZSBnaXZlbiBubyBhcmd1bWVudHMsIGluIHdoaWNoIGNhc2UgaXQgd2lsbCBtb3VzZW91dCB0aGUgc2VnbWVudCB0aGF0IHdhcyBwcmV2aW91c2x5IG1vdXNlZCBvdmVyLlxuXHR0cmlnZ2VyU2VnTW91c2VvdXQ6IGZ1bmN0aW9uKHNlZywgZXYpIHtcblx0XHRldiA9IGV2IHx8IHt9OyAvLyBpZiBnaXZlbiBubyBhcmdzLCBtYWtlIGEgbW9jayBtb3VzZSBldmVudFxuXG5cdFx0aWYgKHRoaXMubW91c2VkT3ZlclNlZykge1xuXHRcdFx0c2VnID0gc2VnIHx8IHRoaXMubW91c2VkT3ZlclNlZzsgLy8gaWYgZ2l2ZW4gbm8gYXJncywgdXNlIHRoZSBjdXJyZW50bHkgbW91c2VkLW92ZXIgc2VnbWVudFxuXHRcdFx0dGhpcy5tb3VzZWRPdmVyU2VnID0gbnVsbDtcblx0XHRcdHRoaXMudmlldy50cmlnZ2VyKCdldmVudE1vdXNlb3V0Jywgc2VnLmVsWzBdLCBzZWcuZXZlbnQsIGV2KTtcblx0XHR9XG5cdH0sXG5cblxuXHQvKiBFdmVudCBEcmFnZ2luZ1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gQ2FsbGVkIHdoZW4gdGhlIHVzZXIgZG9lcyBhIG1vdXNlZG93biBvbiBhbiBldmVudCwgd2hpY2ggbWlnaHQgbGVhZCB0byBkcmFnZ2luZy5cblx0Ly8gR2VuZXJpYyBlbm91Z2ggdG8gd29yayB3aXRoIGFueSB0eXBlIG9mIEdyaWQuXG5cdHNlZ0RyYWdNb3VzZWRvd246IGZ1bmN0aW9uKHNlZywgZXYpIHtcblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXHRcdHZhciB2aWV3ID0gdGhpcy52aWV3O1xuXHRcdHZhciBlbCA9IHNlZy5lbDtcblx0XHR2YXIgZXZlbnQgPSBzZWcuZXZlbnQ7XG5cdFx0dmFyIGRyb3BMb2NhdGlvbjtcblxuXHRcdC8vIEEgY2xvbmUgb2YgdGhlIG9yaWdpbmFsIGVsZW1lbnQgdGhhdCB3aWxsIG1vdmUgd2l0aCB0aGUgbW91c2Vcblx0XHR2YXIgbW91c2VGb2xsb3dlciA9IG5ldyBNb3VzZUZvbGxvd2VyKHNlZy5lbCwge1xuXHRcdFx0cGFyZW50RWw6IHZpZXcuZWwsXG5cdFx0XHRvcGFjaXR5OiB2aWV3Lm9wdCgnZHJhZ09wYWNpdHknKSxcblx0XHRcdHJldmVydER1cmF0aW9uOiB2aWV3Lm9wdCgnZHJhZ1JldmVydER1cmF0aW9uJyksXG5cdFx0XHR6SW5kZXg6IDIgLy8gb25lIGFib3ZlIHRoZSAuZmMtdmlld1xuXHRcdH0pO1xuXG5cdFx0Ly8gVHJhY2tzIG1vdXNlIG1vdmVtZW50IG92ZXIgdGhlICp2aWV3J3MqIGNvb3JkaW5hdGUgbWFwLiBBbGxvd3MgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nIGJldHdlZW4gc3ViY29tcG9uZW50c1xuXHRcdC8vIG9mIHRoZSB2aWV3LlxuXHRcdHZhciBkcmFnTGlzdGVuZXIgPSBuZXcgRHJhZ0xpc3RlbmVyKHZpZXcuY29vcmRNYXAsIHtcblx0XHRcdGRpc3RhbmNlOiA1LFxuXHRcdFx0c2Nyb2xsOiB2aWV3Lm9wdCgnZHJhZ1Njcm9sbCcpLFxuXHRcdFx0bGlzdGVuU3RhcnQ6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdG1vdXNlRm9sbG93ZXIuaGlkZSgpOyAvLyBkb24ndCBzaG93IHVudGlsIHdlIGtub3cgdGhpcyBpcyBhIHJlYWwgZHJhZ1xuXHRcdFx0XHRtb3VzZUZvbGxvd2VyLnN0YXJ0KGV2KTtcblx0XHRcdH0sXG5cdFx0XHRkcmFnU3RhcnQ6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdF90aGlzLnRyaWdnZXJTZWdNb3VzZW91dChzZWcsIGV2KTsgLy8gZW5zdXJlIGEgbW91c2VvdXQgb24gdGhlIG1hbmlwdWxhdGVkIGV2ZW50IGhhcyBiZWVuIHJlcG9ydGVkXG5cdFx0XHRcdF90aGlzLmlzRHJhZ2dpbmdTZWcgPSB0cnVlO1xuXHRcdFx0XHR2aWV3LmhpZGVFdmVudChldmVudCk7IC8vIGhpZGUgYWxsIGV2ZW50IHNlZ21lbnRzLiBvdXIgbW91c2VGb2xsb3dlciB3aWxsIHRha2Ugb3ZlclxuXHRcdFx0XHR2aWV3LnRyaWdnZXIoJ2V2ZW50RHJhZ1N0YXJ0JywgZWxbMF0sIGV2ZW50LCBldiwge30pOyAvLyBsYXN0IGFyZ3VtZW50IGlzIGpxdWkgZHVtbXlcblx0XHRcdH0sXG5cdFx0XHRjZWxsT3ZlcjogZnVuY3Rpb24oY2VsbCwgaXNPcmlnKSB7XG5cdFx0XHRcdHZhciBvcmlnQ2VsbCA9IHNlZy5jZWxsIHx8IGRyYWdMaXN0ZW5lci5vcmlnQ2VsbDsgLy8gc3RhcnRpbmcgY2VsbCBjb3VsZCBiZSBmb3JjZWQgKERheUdyaWQubGltaXQpXG5cblx0XHRcdFx0ZHJvcExvY2F0aW9uID0gX3RoaXMuY29tcHV0ZUV2ZW50RHJvcChvcmlnQ2VsbCwgY2VsbCwgZXZlbnQpO1xuXHRcdFx0XHRpZiAoZHJvcExvY2F0aW9uKSB7XG5cdFx0XHRcdFx0aWYgKHZpZXcucmVuZGVyRHJhZyhkcm9wTG9jYXRpb24sIHNlZykpIHsgLy8gaGF2ZSB0aGUgc3ViY2xhc3MgcmVuZGVyIGEgdmlzdWFsIGluZGljYXRpb25cblx0XHRcdFx0XHRcdG1vdXNlRm9sbG93ZXIuaGlkZSgpOyAvLyBpZiB0aGUgc3ViY2xhc3MgaXMgYWxyZWFkeSB1c2luZyBhIG1vY2sgZXZlbnQgXCJoZWxwZXJcIiwgaGlkZSBvdXIgb3duXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0bW91c2VGb2xsb3dlci5zaG93KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChpc09yaWcpIHtcblx0XHRcdFx0XHRcdGRyb3BMb2NhdGlvbiA9IG51bGw7IC8vIG5lZWRzIHRvIGhhdmUgbW92ZWQgY2VsbHMgdG8gYmUgYSB2YWxpZCBkcm9wXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdC8vIGhhdmUgdGhlIGhlbHBlciBmb2xsb3cgdGhlIG1vdXNlIChubyBzbmFwcGluZykgd2l0aCBhIHdhcm5pbmctc3R5bGUgY3Vyc29yXG5cdFx0XHRcdFx0bW91c2VGb2xsb3dlci5zaG93KCk7XG5cdFx0XHRcdFx0ZGlzYWJsZUN1cnNvcigpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0Y2VsbE91dDogZnVuY3Rpb24oKSB7IC8vIGNhbGxlZCBiZWZvcmUgbW91c2UgbW92ZXMgdG8gYSBkaWZmZXJlbnQgY2VsbCBPUiBtb3ZlZCBvdXQgb2YgYWxsIGNlbGxzXG5cdFx0XHRcdGRyb3BMb2NhdGlvbiA9IG51bGw7XG5cdFx0XHRcdHZpZXcuZGVzdHJveURyYWcoKTsgLy8gdW5yZW5kZXIgd2hhdGV2ZXIgd2FzIGRvbmUgaW4gcmVuZGVyRHJhZ1xuXHRcdFx0XHRtb3VzZUZvbGxvd2VyLnNob3coKTsgLy8gc2hvdyBpbiBjYXNlIHdlIGFyZSBtb3Zpbmcgb3V0IG9mIGFsbCBjZWxsc1xuXHRcdFx0XHRlbmFibGVDdXJzb3IoKTtcblx0XHRcdH0sXG5cdFx0XHRkcmFnU3RvcDogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0Ly8gZG8gcmV2ZXJ0IGFuaW1hdGlvbiBpZiBoYXNuJ3QgY2hhbmdlZC4gY2FsbHMgYSBjYWxsYmFjayB3aGVuIGZpbmlzaGVkICh3aGV0aGVyIGFuaW1hdGlvbiBvciBub3QpXG5cdFx0XHRcdG1vdXNlRm9sbG93ZXIuc3RvcCghZHJvcExvY2F0aW9uLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRfdGhpcy5pc0RyYWdnaW5nU2VnID0gZmFsc2U7XG5cdFx0XHRcdFx0dmlldy5kZXN0cm95RHJhZygpO1xuXHRcdFx0XHRcdHZpZXcuc2hvd0V2ZW50KGV2ZW50KTtcblx0XHRcdFx0XHR2aWV3LnRyaWdnZXIoJ2V2ZW50RHJhZ1N0b3AnLCBlbFswXSwgZXZlbnQsIGV2LCB7fSk7IC8vIGxhc3QgYXJndW1lbnQgaXMganF1aSBkdW1teVxuXG5cdFx0XHRcdFx0aWYgKGRyb3BMb2NhdGlvbikge1xuXHRcdFx0XHRcdFx0dmlldy5yZXBvcnRFdmVudERyb3AoZXZlbnQsIGRyb3BMb2NhdGlvbiwgZWwsIGV2KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRlbmFibGVDdXJzb3IoKTtcblx0XHRcdH0sXG5cdFx0XHRsaXN0ZW5TdG9wOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0bW91c2VGb2xsb3dlci5zdG9wKCk7IC8vIHB1dCBpbiBsaXN0ZW5TdG9wIGluIGNhc2UgdGhlcmUgd2FzIGEgbW91c2Vkb3duIGJ1dCB0aGUgZHJhZyBuZXZlciBzdGFydGVkXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRkcmFnTGlzdGVuZXIubW91c2Vkb3duKGV2KTsgLy8gc3RhcnQgbGlzdGVuaW5nLCB3aGljaCB3aWxsIGV2ZW50dWFsbHkgbGVhZCB0byBhIGRyYWdTdGFydFxuXHR9LFxuXG5cblx0Ly8gR2l2ZW4gdGhlIGNlbGwgYW4gZXZlbnQgZHJhZyBiZWdhbiwgYW5kIHRoZSBjZWxsIGV2ZW50IHdhcyBkcm9wcGVkLCBjYWxjdWxhdGVzIHRoZSBuZXcgc3RhcnQvZW5kL2FsbERheVxuXHQvLyB2YWx1ZXMgZm9yIHRoZSBldmVudC4gU3ViY2xhc3NlcyBtYXkgb3ZlcnJpZGUgYW5kIHNldCBhZGRpdGlvbmFsIHByb3BlcnRpZXMgdG8gYmUgdXNlZCBieSByZW5kZXJEcmFnLlxuXHQvLyBBIGZhbHN5IHJldHVybmVkIHZhbHVlIGluZGljYXRlcyBhbiBpbnZhbGlkIGRyb3AuXG5cdGNvbXB1dGVFdmVudERyb3A6IGZ1bmN0aW9uKHN0YXJ0Q2VsbCwgZW5kQ2VsbCwgZXZlbnQpIHtcblx0XHR2YXIgZHJhZ1N0YXJ0ID0gc3RhcnRDZWxsLnN0YXJ0O1xuXHRcdHZhciBkcmFnRW5kID0gZW5kQ2VsbC5zdGFydDtcblx0XHR2YXIgZGVsdGE7XG5cdFx0dmFyIG5ld1N0YXJ0O1xuXHRcdHZhciBuZXdFbmQ7XG5cdFx0dmFyIG5ld0FsbERheTtcblx0XHR2YXIgZHJvcExvY2F0aW9uO1xuXG5cdFx0aWYgKGRyYWdTdGFydC5oYXNUaW1lKCkgPT09IGRyYWdFbmQuaGFzVGltZSgpKSB7XG5cdFx0XHRkZWx0YSA9IGRpZmZEYXlUaW1lKGRyYWdFbmQsIGRyYWdTdGFydCk7XG5cdFx0XHRuZXdTdGFydCA9IGV2ZW50LnN0YXJ0LmNsb25lKCkuYWRkKGRlbHRhKTtcblx0XHRcdGlmIChldmVudC5lbmQgPT09IG51bGwpIHsgLy8gZG8gd2UgbmVlZCB0byBjb21wdXRlIGFuIGVuZD9cblx0XHRcdFx0bmV3RW5kID0gbnVsbDtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRuZXdFbmQgPSBldmVudC5lbmQuY2xvbmUoKS5hZGQoZGVsdGEpO1xuXHRcdFx0fVxuXHRcdFx0bmV3QWxsRGF5ID0gZXZlbnQuYWxsRGF5OyAvLyBrZWVwIGl0IHRoZSBzYW1lXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gaWYgc3dpdGNoaW5nIGZyb20gZGF5IDwtPiB0aW1lZCwgc3RhcnQgc2hvdWxkIGJlIHJlc2V0IHRvIHRoZSBkcm9wcGVkIGRhdGUsIGFuZCB0aGUgZW5kIGNsZWFyZWRcblx0XHRcdG5ld1N0YXJ0ID0gZHJhZ0VuZC5jbG9uZSgpO1xuXHRcdFx0bmV3RW5kID0gbnVsbDsgLy8gZW5kIHNob3VsZCBiZSBjbGVhcmVkXG5cdFx0XHRuZXdBbGxEYXkgPSAhZHJhZ0VuZC5oYXNUaW1lKCk7XG5cdFx0fVxuXG5cdFx0ZHJvcExvY2F0aW9uID0ge1xuXHRcdFx0c3RhcnQ6IG5ld1N0YXJ0LFxuXHRcdFx0ZW5kOiBuZXdFbmQsXG5cdFx0XHRhbGxEYXk6IG5ld0FsbERheVxuXHRcdH07XG5cblx0XHRpZiAoIXRoaXMudmlldy5jYWxlbmRhci5pc0V2ZW50UmFuZ2VBbGxvd2VkKGRyb3BMb2NhdGlvbiwgZXZlbnQpKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cblx0XHRyZXR1cm4gZHJvcExvY2F0aW9uO1xuXHR9LFxuXG5cblx0LyogRXh0ZXJuYWwgRWxlbWVudCBEcmFnZ2luZ1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gQ2FsbGVkIHdoZW4gYSBqUXVlcnkgVUkgZHJhZyBpcyBpbml0aWF0ZWQgYW55d2hlcmUgaW4gdGhlIERPTVxuXHRkb2N1bWVudERyYWdTdGFydDogZnVuY3Rpb24oZXYsIHVpKSB7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLnZpZXc7XG5cdFx0dmFyIGVsO1xuXHRcdHZhciBhY2NlcHQ7XG5cblx0XHRpZiAodmlldy5vcHQoJ2Ryb3BwYWJsZScpKSB7IC8vIG9ubHkgbGlzdGVuIGlmIHRoaXMgc2V0dGluZyBpcyBvblxuXHRcdFx0ZWwgPSAkKGV2LnRhcmdldCk7XG5cblx0XHRcdC8vIFRlc3QgdGhhdCB0aGUgZHJhZ2dlZCBlbGVtZW50IHBhc3NlcyB0aGUgZHJvcEFjY2VwdCBzZWxlY3RvciBvciBmaWx0ZXIgZnVuY3Rpb24uXG5cdFx0XHQvLyBGWUksIHRoZSBkZWZhdWx0IGlzIFwiKlwiIChtYXRjaGVzIGFsbClcblx0XHRcdGFjY2VwdCA9IHZpZXcub3B0KCdkcm9wQWNjZXB0Jyk7XG5cdFx0XHRpZiAoJC5pc0Z1bmN0aW9uKGFjY2VwdCkgPyBhY2NlcHQuY2FsbChlbFswXSwgZWwpIDogZWwuaXMoYWNjZXB0KSkge1xuXG5cdFx0XHRcdHRoaXMuc3RhcnRFeHRlcm5hbERyYWcoZWwsIGV2LCB1aSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gQ2FsbGVkIHdoZW4gYSBqUXVlcnkgVUkgZHJhZyBzdGFydHMgYW5kIGl0IG5lZWRzIHRvIGJlIG1vbml0b3JlZCBmb3IgY2VsbCBkcm9wcGluZ1xuXHRzdGFydEV4dGVybmFsRHJhZzogZnVuY3Rpb24oZWwsIGV2LCB1aSkge1xuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cdFx0dmFyIG1ldGEgPSBnZXREcmFnZ2VkRWxNZXRhKGVsKTsgLy8gZXh0cmEgZGF0YSBhYm91dCBldmVudCBkcm9wLCBpbmNsdWRpbmcgcG9zc2libGUgZXZlbnQgdG8gY3JlYXRlXG5cdFx0dmFyIGRyYWdMaXN0ZW5lcjtcblx0XHR2YXIgZHJvcExvY2F0aW9uOyAvLyBhIG51bGwgdmFsdWUgc2lnbmFscyBhbiB1bnN1Y2Nlc3NmdWwgZHJhZ1xuXG5cdFx0Ly8gbGlzdGVuZXIgdGhhdCB0cmFja3MgbW91c2UgbW92ZW1lbnQgb3ZlciBkYXRlLWFzc29jaWF0ZWQgcGl4ZWwgcmVnaW9uc1xuXHRcdGRyYWdMaXN0ZW5lciA9IG5ldyBEcmFnTGlzdGVuZXIodGhpcy5jb29yZE1hcCwge1xuXHRcdFx0Y2VsbE92ZXI6IGZ1bmN0aW9uKGNlbGwpIHtcblx0XHRcdFx0ZHJvcExvY2F0aW9uID0gX3RoaXMuY29tcHV0ZUV4dGVybmFsRHJvcChjZWxsLCBtZXRhKTtcblx0XHRcdFx0aWYgKGRyb3BMb2NhdGlvbikge1xuXHRcdFx0XHRcdF90aGlzLnJlbmRlckRyYWcoZHJvcExvY2F0aW9uKTsgLy8gY2FsbGVkIHdpdGhvdXQgYSBzZWcgcGFyYW1ldGVyXG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7IC8vIGludmFsaWQgZHJvcCBjZWxsXG5cdFx0XHRcdFx0ZGlzYWJsZUN1cnNvcigpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0Y2VsbE91dDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGRyb3BMb2NhdGlvbiA9IG51bGw7IC8vIHNpZ25hbCB1bnN1Y2Nlc3NmdWxcblx0XHRcdFx0X3RoaXMuZGVzdHJveURyYWcoKTtcblx0XHRcdFx0ZW5hYmxlQ3Vyc29yKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBnZXRzIGNhbGxlZCwgb25seSBvbmNlLCB3aGVuIGpxdWkgZHJhZyBpcyBmaW5pc2hlZFxuXHRcdCQoZG9jdW1lbnQpLm9uZSgnZHJhZ3N0b3AnLCBmdW5jdGlvbihldiwgdWkpIHtcblx0XHRcdF90aGlzLmRlc3Ryb3lEcmFnKCk7XG5cdFx0XHRlbmFibGVDdXJzb3IoKTtcblxuXHRcdFx0aWYgKGRyb3BMb2NhdGlvbikgeyAvLyBlbGVtZW50IHdhcyBkcm9wcGVkIG9uIGEgdmFsaWQgZGF0ZS90aW1lIGNlbGxcblx0XHRcdFx0X3RoaXMudmlldy5yZXBvcnRFeHRlcm5hbERyb3AobWV0YSwgZHJvcExvY2F0aW9uLCBlbCwgZXYsIHVpKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGRyYWdMaXN0ZW5lci5zdGFydERyYWcoZXYpOyAvLyBzdGFydCBsaXN0ZW5pbmcgaW1tZWRpYXRlbHlcblx0fSxcblxuXG5cdC8vIEdpdmVuIGEgY2VsbCB0byBiZSBkcm9wcGVkIHVwb24sIGFuZCBtaXNjIGRhdGEgYXNzb2NpYXRlZCB3aXRoIHRoZSBqcXVpIGRyYWcgKGd1YXJhbnRlZWQgdG8gYmUgYSBwbGFpbiBvYmplY3QpLFxuXHQvLyByZXR1cm5zIHN0YXJ0L2VuZCBkYXRlcyBmb3IgdGhlIGV2ZW50IHRoYXQgd291bGQgcmVzdWx0IGZyb20gdGhlIGh5cG90aGV0aWNhbCBkcm9wLiBlbmQgbWlnaHQgYmUgbnVsbC5cblx0Ly8gUmV0dXJuaW5nIGEgbnVsbCB2YWx1ZSBzaWduYWxzIGFuIGludmFsaWQgZHJvcCBjZWxsLlxuXHRjb21wdXRlRXh0ZXJuYWxEcm9wOiBmdW5jdGlvbihjZWxsLCBtZXRhKSB7XG5cdFx0dmFyIGRyb3BMb2NhdGlvbiA9IHtcblx0XHRcdHN0YXJ0OiBjZWxsLnN0YXJ0LmNsb25lKCksXG5cdFx0XHRlbmQ6IG51bGxcblx0XHR9O1xuXG5cdFx0Ly8gaWYgZHJvcHBlZCBvbiBhbiBhbGwtZGF5IGNlbGwsIGFuZCBlbGVtZW50J3MgbWV0YWRhdGEgc3BlY2lmaWVkIGEgdGltZSwgc2V0IGl0XG5cdFx0aWYgKG1ldGEuc3RhcnRUaW1lICYmICFkcm9wTG9jYXRpb24uc3RhcnQuaGFzVGltZSgpKSB7XG5cdFx0XHRkcm9wTG9jYXRpb24uc3RhcnQudGltZShtZXRhLnN0YXJ0VGltZSk7XG5cdFx0fVxuXG5cdFx0aWYgKG1ldGEuZHVyYXRpb24pIHtcblx0XHRcdGRyb3BMb2NhdGlvbi5lbmQgPSBkcm9wTG9jYXRpb24uc3RhcnQuY2xvbmUoKS5hZGQobWV0YS5kdXJhdGlvbik7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLnZpZXcuY2FsZW5kYXIuaXNFeHRlcm5hbERyb3BSYW5nZUFsbG93ZWQoZHJvcExvY2F0aW9uLCBtZXRhLmV2ZW50UHJvcHMpKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cblx0XHRyZXR1cm4gZHJvcExvY2F0aW9uO1xuXHR9LFxuXG5cblxuXHQvKiBEcmFnIFJlbmRlcmluZyAoZm9yIGJvdGggZXZlbnRzIGFuZCBhbiBleHRlcm5hbCBlbGVtZW50cylcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFJlbmRlcnMgYSB2aXN1YWwgaW5kaWNhdGlvbiBvZiBhbiBldmVudCBvciBleHRlcm5hbCBlbGVtZW50IGJlaW5nIGRyYWdnZWQuXG5cdC8vIGBkcm9wTG9jYXRpb25gIGNvbnRhaW5zIGh5cG90aGV0aWNhbCBzdGFydC9lbmQvYWxsRGF5IHZhbHVlcyB0aGUgZXZlbnQgd291bGQgaGF2ZSBpZiBkcm9wcGVkLiBlbmQgY2FuIGJlIG51bGwuXG5cdC8vIGBzZWdgIGlzIHRoZSBpbnRlcm5hbCBzZWdtZW50IG9iamVjdCB0aGF0IGlzIGJlaW5nIGRyYWdnZWQuIElmIGRyYWdnaW5nIGFuIGV4dGVybmFsIGVsZW1lbnQsIGBzZWdgIGlzIG51bGwuXG5cdC8vIEEgdHJ1dGh5IHJldHVybmVkIHZhbHVlIGluZGljYXRlcyB0aGlzIG1ldGhvZCBoYXMgcmVuZGVyZWQgYSBoZWxwZXIgZWxlbWVudC5cblx0cmVuZGVyRHJhZzogZnVuY3Rpb24oZHJvcExvY2F0aW9uLCBzZWcpIHtcblx0XHQvLyBzdWJjbGFzc2VzIG11c3QgaW1wbGVtZW50XG5cdH0sXG5cblxuXHQvLyBVbnJlbmRlcnMgYSB2aXN1YWwgaW5kaWNhdGlvbiBvZiBhbiBldmVudCBvciBleHRlcm5hbCBlbGVtZW50IGJlaW5nIGRyYWdnZWRcblx0ZGVzdHJveURyYWc6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHN1YmNsYXNzZXMgbXVzdCBpbXBsZW1lbnRcblx0fSxcblxuXG5cdC8qIFJlc2l6aW5nXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuXHQvLyBDYWxsZWQgd2hlbiB0aGUgdXNlciBkb2VzIGEgbW91c2Vkb3duIG9uIGFuIGV2ZW50J3MgcmVzaXplciwgd2hpY2ggbWlnaHQgbGVhZCB0byByZXNpemluZy5cblx0Ly8gR2VuZXJpYyBlbm91Z2ggdG8gd29yayB3aXRoIGFueSB0eXBlIG9mIEdyaWQuXG5cdHNlZ1Jlc2l6ZU1vdXNlZG93bjogZnVuY3Rpb24oc2VnLCBldikge1xuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLnZpZXc7XG5cdFx0dmFyIGNhbGVuZGFyID0gdmlldy5jYWxlbmRhcjtcblx0XHR2YXIgZWwgPSBzZWcuZWw7XG5cdFx0dmFyIGV2ZW50ID0gc2VnLmV2ZW50O1xuXHRcdHZhciBzdGFydCA9IGV2ZW50LnN0YXJ0O1xuXHRcdHZhciBvbGRFbmQgPSBjYWxlbmRhci5nZXRFdmVudEVuZChldmVudCk7XG5cdFx0dmFyIG5ld0VuZDsgLy8gZmFsc3kgaWYgaW52YWxpZCByZXNpemVcblx0XHR2YXIgZHJhZ0xpc3RlbmVyO1xuXG5cdFx0ZnVuY3Rpb24gZGVzdHJveSgpIHsgLy8gcmVzZXRzIHRoZSByZW5kZXJpbmcgdG8gc2hvdyB0aGUgb3JpZ2luYWwgZXZlbnRcblx0XHRcdF90aGlzLmRlc3Ryb3lFdmVudFJlc2l6ZSgpO1xuXHRcdFx0dmlldy5zaG93RXZlbnQoZXZlbnQpO1xuXHRcdFx0ZW5hYmxlQ3Vyc29yKCk7XG5cdFx0fVxuXG5cdFx0Ly8gVHJhY2tzIG1vdXNlIG1vdmVtZW50IG92ZXIgdGhlICpncmlkJ3MqIGNvb3JkaW5hdGUgbWFwXG5cdFx0ZHJhZ0xpc3RlbmVyID0gbmV3IERyYWdMaXN0ZW5lcih0aGlzLmNvb3JkTWFwLCB7XG5cdFx0XHRkaXN0YW5jZTogNSxcblx0XHRcdHNjcm9sbDogdmlldy5vcHQoJ2RyYWdTY3JvbGwnKSxcblx0XHRcdGRyYWdTdGFydDogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0X3RoaXMudHJpZ2dlclNlZ01vdXNlb3V0KHNlZywgZXYpOyAvLyBlbnN1cmUgYSBtb3VzZW91dCBvbiB0aGUgbWFuaXB1bGF0ZWQgZXZlbnQgaGFzIGJlZW4gcmVwb3J0ZWRcblx0XHRcdFx0X3RoaXMuaXNSZXNpemluZ1NlZyA9IHRydWU7XG5cdFx0XHRcdHZpZXcudHJpZ2dlcignZXZlbnRSZXNpemVTdGFydCcsIGVsWzBdLCBldmVudCwgZXYsIHt9KTsgLy8gbGFzdCBhcmd1bWVudCBpcyBqcXVpIGR1bW15XG5cdFx0XHR9LFxuXHRcdFx0Y2VsbE92ZXI6IGZ1bmN0aW9uKGNlbGwpIHtcblx0XHRcdFx0bmV3RW5kID0gY2VsbC5lbmQ7XG5cblx0XHRcdFx0aWYgKCFuZXdFbmQuaXNBZnRlcihzdGFydCkpIHsgLy8gd2FzIGVuZCBtb3ZlZCBiZWZvcmUgc3RhcnQ/XG5cdFx0XHRcdFx0bmV3RW5kID0gc3RhcnQuY2xvbmUoKS5hZGQoIC8vIG1ha2UgdGhlIGV2ZW50IHNwYW4gYSBzaW5nbGUgc2xvdFxuXHRcdFx0XHRcdFx0ZGlmZkRheVRpbWUoY2VsbC5lbmQsIGNlbGwuc3RhcnQpIC8vIGFzc3VtZXMgYWxsIHNsb3QgZHVyYXRpb25zIGFyZSB0aGUgc2FtZVxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAobmV3RW5kLmlzU2FtZShvbGRFbmQpKSB7XG5cdFx0XHRcdFx0bmV3RW5kID0gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICghY2FsZW5kYXIuaXNFdmVudFJhbmdlQWxsb3dlZCh7IHN0YXJ0OiBzdGFydCwgZW5kOiBuZXdFbmQgfSwgZXZlbnQpKSB7XG5cdFx0XHRcdFx0bmV3RW5kID0gbnVsbDtcblx0XHRcdFx0XHRkaXNhYmxlQ3Vyc29yKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0X3RoaXMucmVuZGVyRXZlbnRSZXNpemUoeyBzdGFydDogc3RhcnQsIGVuZDogbmV3RW5kIH0sIHNlZyk7XG5cdFx0XHRcdFx0dmlldy5oaWRlRXZlbnQoZXZlbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0Y2VsbE91dDogZnVuY3Rpb24oKSB7IC8vIGNhbGxlZCBiZWZvcmUgbW91c2UgbW92ZXMgdG8gYSBkaWZmZXJlbnQgY2VsbCBPUiBtb3ZlZCBvdXQgb2YgYWxsIGNlbGxzXG5cdFx0XHRcdG5ld0VuZCA9IG51bGw7XG5cdFx0XHRcdGRlc3Ryb3koKTtcblx0XHRcdH0sXG5cdFx0XHRkcmFnU3RvcDogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0X3RoaXMuaXNSZXNpemluZ1NlZyA9IGZhbHNlO1xuXHRcdFx0XHRkZXN0cm95KCk7XG5cdFx0XHRcdHZpZXcudHJpZ2dlcignZXZlbnRSZXNpemVTdG9wJywgZWxbMF0sIGV2ZW50LCBldiwge30pOyAvLyBsYXN0IGFyZ3VtZW50IGlzIGpxdWkgZHVtbXlcblxuXHRcdFx0XHRpZiAobmV3RW5kKSB7IC8vIHZhbGlkIGRhdGUgdG8gcmVzaXplIHRvP1xuXHRcdFx0XHRcdHZpZXcucmVwb3J0RXZlbnRSZXNpemUoZXZlbnQsIG5ld0VuZCwgZWwsIGV2KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZHJhZ0xpc3RlbmVyLm1vdXNlZG93bihldik7IC8vIHN0YXJ0IGxpc3RlbmluZywgd2hpY2ggd2lsbCBldmVudHVhbGx5IGxlYWQgdG8gYSBkcmFnU3RhcnRcblx0fSxcblxuXG5cdC8vIFJlbmRlcnMgYSB2aXN1YWwgaW5kaWNhdGlvbiBvZiBhbiBldmVudCBiZWluZyByZXNpemVkLlxuXHQvLyBgcmFuZ2VgIGhhcyB0aGUgdXBkYXRlZCBkYXRlcyBvZiB0aGUgZXZlbnQuIGBzZWdgIGlzIHRoZSBvcmlnaW5hbCBzZWdtZW50IG9iamVjdCBpbnZvbHZlZCBpbiB0aGUgZHJhZy5cblx0cmVuZGVyRXZlbnRSZXNpemU6IGZ1bmN0aW9uKHJhbmdlLCBzZWcpIHtcblx0XHQvLyBzdWJjbGFzc2VzIG11c3QgaW1wbGVtZW50XG5cdH0sXG5cblxuXHQvLyBVbnJlbmRlcnMgYSB2aXN1YWwgaW5kaWNhdGlvbiBvZiBhbiBldmVudCBiZWluZyByZXNpemVkLlxuXHRkZXN0cm95RXZlbnRSZXNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHN1YmNsYXNzZXMgbXVzdCBpbXBsZW1lbnRcblx0fSxcblxuXG5cdC8qIFJlbmRlcmluZyBVdGlsc1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gQ29tcHV0ZSB0aGUgdGV4dCB0aGF0IHNob3VsZCBiZSBkaXNwbGF5ZWQgb24gYW4gZXZlbnQncyBlbGVtZW50LlxuXHQvLyBgcmFuZ2VgIGNhbiBiZSB0aGUgRXZlbnQgb2JqZWN0IGl0c2VsZiwgb3Igc29tZXRoaW5nIHJhbmdlLWxpa2UsIHdpdGggYXQgbGVhc3QgYSBgc3RhcnRgLlxuXHQvLyBUaGUgYHRpbWVGb3JtYXRgIG9wdGlvbnMgYW5kIHRoZSBncmlkJ3MgZGVmYXVsdCBmb3JtYXQgaXMgdXNlZCwgYnV0IGBmb3JtYXRTdHJgIGNhbiBvdmVycmlkZS5cblx0Z2V0RXZlbnRUaW1lVGV4dDogZnVuY3Rpb24ocmFuZ2UsIGZvcm1hdFN0cikge1xuXG5cdFx0Zm9ybWF0U3RyID0gZm9ybWF0U3RyIHx8IHRoaXMuZXZlbnRUaW1lRm9ybWF0O1xuXG5cdFx0aWYgKHJhbmdlLmVuZCAmJiB0aGlzLmRpc3BsYXlFdmVudEVuZCkge1xuXHRcdFx0cmV0dXJuIHRoaXMudmlldy5mb3JtYXRSYW5nZShyYW5nZSwgZm9ybWF0U3RyKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gcmFuZ2Uuc3RhcnQuZm9ybWF0KGZvcm1hdFN0cik7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gR2VuZXJpYyB1dGlsaXR5IGZvciBnZW5lcmF0aW5nIHRoZSBIVE1MIGNsYXNzTmFtZXMgZm9yIGFuIGV2ZW50IHNlZ21lbnQncyBlbGVtZW50XG5cdGdldFNlZ0NsYXNzZXM6IGZ1bmN0aW9uKHNlZywgaXNEcmFnZ2FibGUsIGlzUmVzaXphYmxlKSB7XG5cdFx0dmFyIGV2ZW50ID0gc2VnLmV2ZW50O1xuXHRcdHZhciBjbGFzc2VzID0gW1xuXHRcdFx0J2ZjLWV2ZW50Jyxcblx0XHRcdHNlZy5pc1N0YXJ0ID8gJ2ZjLXN0YXJ0JyA6ICdmYy1ub3Qtc3RhcnQnLFxuXHRcdFx0c2VnLmlzRW5kID8gJ2ZjLWVuZCcgOiAnZmMtbm90LWVuZCdcblx0XHRdLmNvbmNhdChcblx0XHRcdGV2ZW50LmNsYXNzTmFtZSxcblx0XHRcdGV2ZW50LnNvdXJjZSA/IGV2ZW50LnNvdXJjZS5jbGFzc05hbWUgOiBbXVxuXHRcdCk7XG5cblx0XHRpZiAoaXNEcmFnZ2FibGUpIHtcblx0XHRcdGNsYXNzZXMucHVzaCgnZmMtZHJhZ2dhYmxlJyk7XG5cdFx0fVxuXHRcdGlmIChpc1Jlc2l6YWJsZSkge1xuXHRcdFx0Y2xhc3Nlcy5wdXNoKCdmYy1yZXNpemFibGUnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gY2xhc3Nlcztcblx0fSxcblxuXG5cdC8vIFV0aWxpdHkgZm9yIGdlbmVyYXRpbmcgYSBDU1Mgc3RyaW5nIHdpdGggYWxsIHRoZSBldmVudCBza2luLXJlbGF0ZWQgcHJvcGVydGllc1xuXHRnZXRFdmVudFNraW5Dc3M6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLnZpZXc7XG5cdFx0dmFyIHNvdXJjZSA9IGV2ZW50LnNvdXJjZSB8fCB7fTtcblx0XHR2YXIgZXZlbnRDb2xvciA9IGV2ZW50LmNvbG9yO1xuXHRcdHZhciBzb3VyY2VDb2xvciA9IHNvdXJjZS5jb2xvcjtcblx0XHR2YXIgb3B0aW9uQ29sb3IgPSB2aWV3Lm9wdCgnZXZlbnRDb2xvcicpO1xuXHRcdHZhciBiYWNrZ3JvdW5kQ29sb3IgPVxuXHRcdFx0ZXZlbnQuYmFja2dyb3VuZENvbG9yIHx8XG5cdFx0XHRldmVudENvbG9yIHx8XG5cdFx0XHRzb3VyY2UuYmFja2dyb3VuZENvbG9yIHx8XG5cdFx0XHRzb3VyY2VDb2xvciB8fFxuXHRcdFx0dmlldy5vcHQoJ2V2ZW50QmFja2dyb3VuZENvbG9yJykgfHxcblx0XHRcdG9wdGlvbkNvbG9yO1xuXHRcdHZhciBib3JkZXJDb2xvciA9XG5cdFx0XHRldmVudC5ib3JkZXJDb2xvciB8fFxuXHRcdFx0ZXZlbnRDb2xvciB8fFxuXHRcdFx0c291cmNlLmJvcmRlckNvbG9yIHx8XG5cdFx0XHRzb3VyY2VDb2xvciB8fFxuXHRcdFx0dmlldy5vcHQoJ2V2ZW50Qm9yZGVyQ29sb3InKSB8fFxuXHRcdFx0b3B0aW9uQ29sb3I7XG5cdFx0dmFyIHRleHRDb2xvciA9XG5cdFx0XHRldmVudC50ZXh0Q29sb3IgfHxcblx0XHRcdHNvdXJjZS50ZXh0Q29sb3IgfHxcblx0XHRcdHZpZXcub3B0KCdldmVudFRleHRDb2xvcicpO1xuXHRcdHZhciBzdGF0ZW1lbnRzID0gW107XG5cdFx0aWYgKGJhY2tncm91bmRDb2xvcikge1xuXHRcdFx0c3RhdGVtZW50cy5wdXNoKCdiYWNrZ3JvdW5kLWNvbG9yOicgKyBiYWNrZ3JvdW5kQ29sb3IpO1xuXHRcdH1cblx0XHRpZiAoYm9yZGVyQ29sb3IpIHtcblx0XHRcdHN0YXRlbWVudHMucHVzaCgnYm9yZGVyLWNvbG9yOicgKyBib3JkZXJDb2xvcik7XG5cdFx0fVxuXHRcdGlmICh0ZXh0Q29sb3IpIHtcblx0XHRcdHN0YXRlbWVudHMucHVzaCgnY29sb3I6JyArIHRleHRDb2xvcik7XG5cdFx0fVxuXHRcdHJldHVybiBzdGF0ZW1lbnRzLmpvaW4oJzsnKTtcblx0fSxcblxuXG5cdC8qIENvbnZlcnRpbmcgZXZlbnRzIC0+IHJhbmdlcyAtPiBzZWdzXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuXHQvLyBDb252ZXJ0cyBhbiBhcnJheSBvZiBldmVudCBvYmplY3RzIGludG8gYW4gYXJyYXkgb2YgZXZlbnQgc2VnbWVudCBvYmplY3RzLlxuXHQvLyBBIGN1c3RvbSBgcmFuZ2VUb1NlZ3NGdW5jYCBtYXkgYmUgZ2l2ZW4gZm9yIGFyYml0cmFyaWx5IHNsaWNpbmcgdXAgZXZlbnRzLlxuXHRldmVudHNUb1NlZ3M6IGZ1bmN0aW9uKGV2ZW50cywgcmFuZ2VUb1NlZ3NGdW5jKSB7XG5cdFx0dmFyIGV2ZW50UmFuZ2VzID0gdGhpcy5ldmVudHNUb1JhbmdlcyhldmVudHMpO1xuXHRcdHZhciBzZWdzID0gW107XG5cdFx0dmFyIGk7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgZXZlbnRSYW5nZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHNlZ3MucHVzaC5hcHBseShcblx0XHRcdFx0c2Vncyxcblx0XHRcdFx0dGhpcy5ldmVudFJhbmdlVG9TZWdzKGV2ZW50UmFuZ2VzW2ldLCByYW5nZVRvU2Vnc0Z1bmMpXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBzZWdzO1xuXHR9LFxuXG5cblx0Ly8gQ29udmVydHMgYW4gYXJyYXkgb2YgZXZlbnRzIGludG8gYW4gYXJyYXkgb2YgXCJyYW5nZVwiIG9iamVjdHMuXG5cdC8vIEEgXCJyYW5nZVwiIG9iamVjdCBpcyBhIHBsYWluIG9iamVjdCB3aXRoIHN0YXJ0L2VuZCBwcm9wZXJ0aWVzIGRlbm90aW5nIHRoZSB0aW1lIGl0IGNvdmVycy4gQWxzbyBhbiBldmVudCBwcm9wZXJ0eS5cblx0Ly8gRm9yIFwibm9ybWFsXCIgZXZlbnRzLCB0aGlzIHdpbGwgYmUgaWRlbnRpY2FsIHRvIHRoZSBldmVudCdzIHN0YXJ0L2VuZCwgYnV0IGZvciBcImludmVyc2UtYmFja2dyb3VuZFwiIGV2ZW50cyxcblx0Ly8gd2lsbCBjcmVhdGUgYW4gYXJyYXkgb2YgcmFuZ2VzIHRoYXQgc3BhbiB0aGUgdGltZSAqbm90KiBjb3ZlcmVkIGJ5IHRoZSBnaXZlbiBldmVudC5cblx0ZXZlbnRzVG9SYW5nZXM6IGZ1bmN0aW9uKGV2ZW50cykge1xuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cdFx0dmFyIGV2ZW50c0J5SWQgPSBncm91cEV2ZW50c0J5SWQoZXZlbnRzKTtcblx0XHR2YXIgcmFuZ2VzID0gW107XG5cblx0XHQvLyBncm91cCBieSBJRCBzbyB0aGF0IHJlbGF0ZWQgaW52ZXJzZS1iYWNrZ3JvdW5kIGV2ZW50cyBjYW4gYmUgcmVuZGVyZWQgdG9nZXRoZXJcblx0XHQkLmVhY2goZXZlbnRzQnlJZCwgZnVuY3Rpb24oaWQsIGV2ZW50R3JvdXApIHtcblx0XHRcdGlmIChldmVudEdyb3VwLmxlbmd0aCkge1xuXHRcdFx0XHRyYW5nZXMucHVzaC5hcHBseShcblx0XHRcdFx0XHRyYW5nZXMsXG5cdFx0XHRcdFx0aXNJbnZlcnNlQmdFdmVudChldmVudEdyb3VwWzBdKSA/XG5cdFx0XHRcdFx0XHRfdGhpcy5ldmVudHNUb0ludmVyc2VSYW5nZXMoZXZlbnRHcm91cCkgOlxuXHRcdFx0XHRcdFx0X3RoaXMuZXZlbnRzVG9Ob3JtYWxSYW5nZXMoZXZlbnRHcm91cClcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiByYW5nZXM7XG5cdH0sXG5cblxuXHQvLyBDb252ZXJ0cyBhbiBhcnJheSBvZiBcIm5vcm1hbFwiIGV2ZW50cyAobm90IGludmVydGVkIHJlbmRlcmluZykgaW50byBhIHBhcmFsbGVsIGFycmF5IG9mIHJhbmdlc1xuXHRldmVudHNUb05vcm1hbFJhbmdlczogZnVuY3Rpb24oZXZlbnRzKSB7XG5cdFx0dmFyIGNhbGVuZGFyID0gdGhpcy52aWV3LmNhbGVuZGFyO1xuXHRcdHZhciByYW5nZXMgPSBbXTtcblx0XHR2YXIgaSwgZXZlbnQ7XG5cdFx0dmFyIGV2ZW50U3RhcnQsIGV2ZW50RW5kO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGV2ZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0ZXZlbnQgPSBldmVudHNbaV07XG5cblx0XHRcdC8vIG1ha2UgY29waWVzIGFuZCBub3JtYWxpemUgYnkgc3RyaXBwaW5nIHRpbWV6b25lXG5cdFx0XHRldmVudFN0YXJ0ID0gZXZlbnQuc3RhcnQuY2xvbmUoKS5zdHJpcFpvbmUoKTtcblx0XHRcdGV2ZW50RW5kID0gY2FsZW5kYXIuZ2V0RXZlbnRFbmQoZXZlbnQpLnN0cmlwWm9uZSgpO1xuXG5cdFx0XHRyYW5nZXMucHVzaCh7XG5cdFx0XHRcdGV2ZW50OiBldmVudCxcblx0XHRcdFx0c3RhcnQ6IGV2ZW50U3RhcnQsXG5cdFx0XHRcdGVuZDogZXZlbnRFbmQsXG5cdFx0XHRcdGV2ZW50U3RhcnRNUzogK2V2ZW50U3RhcnQsXG5cdFx0XHRcdGV2ZW50RHVyYXRpb25NUzogZXZlbnRFbmQgLSBldmVudFN0YXJ0XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmFuZ2VzO1xuXHR9LFxuXG5cblx0Ly8gQ29udmVydHMgYW4gYXJyYXkgb2YgZXZlbnRzLCB3aXRoIGludmVyc2UtYmFja2dyb3VuZCByZW5kZXJpbmcsIGludG8gYW4gYXJyYXkgb2YgcmFuZ2Ugb2JqZWN0cy5cblx0Ly8gVGhlIHJhbmdlIG9iamVjdHMgd2lsbCBjb3ZlciBhbGwgdGhlIHRpbWUgTk9UIGNvdmVyZWQgYnkgdGhlIGV2ZW50cy5cblx0ZXZlbnRzVG9JbnZlcnNlUmFuZ2VzOiBmdW5jdGlvbihldmVudHMpIHtcblx0XHR2YXIgdmlldyA9IHRoaXMudmlldztcblx0XHR2YXIgdmlld1N0YXJ0ID0gdmlldy5zdGFydC5jbG9uZSgpLnN0cmlwWm9uZSgpOyAvLyBub3JtYWxpemUgdGltZXpvbmVcblx0XHR2YXIgdmlld0VuZCA9IHZpZXcuZW5kLmNsb25lKCkuc3RyaXBab25lKCk7IC8vIG5vcm1hbGl6ZSB0aW1lem9uZVxuXHRcdHZhciBub3JtYWxSYW5nZXMgPSB0aGlzLmV2ZW50c1RvTm9ybWFsUmFuZ2VzKGV2ZW50cyk7IC8vIHdpbGwgZ2l2ZSB1cyBub3JtYWxpemVkIGRhdGVzIHdlIGNhbiB1c2Ugdy9vIGNvcGllc1xuXHRcdHZhciBpbnZlcnNlUmFuZ2VzID0gW107XG5cdFx0dmFyIGV2ZW50MCA9IGV2ZW50c1swXTsgLy8gYXNzaWduIHRoaXMgdG8gZWFjaCByYW5nZSdzIGAuZXZlbnRgXG5cdFx0dmFyIHN0YXJ0ID0gdmlld1N0YXJ0OyAvLyB0aGUgZW5kIG9mIHRoZSBwcmV2aW91cyByYW5nZS4gdGhlIHN0YXJ0IG9mIHRoZSBuZXcgcmFuZ2Vcblx0XHR2YXIgaSwgbm9ybWFsUmFuZ2U7XG5cblx0XHQvLyByYW5nZXMgbmVlZCB0byBiZSBpbiBvcmRlci4gcmVxdWlyZWQgZm9yIG91ciBkYXRlLXdhbGtpbmcgYWxnb3JpdGhtXG5cdFx0bm9ybWFsUmFuZ2VzLnNvcnQoY29tcGFyZU5vcm1hbFJhbmdlcyk7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgbm9ybWFsUmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRub3JtYWxSYW5nZSA9IG5vcm1hbFJhbmdlc1tpXTtcblxuXHRcdFx0Ly8gYWRkIHRoZSBzcGFuIG9mIHRpbWUgYmVmb3JlIHRoZSBldmVudCAoaWYgdGhlcmUgaXMgYW55KVxuXHRcdFx0aWYgKG5vcm1hbFJhbmdlLnN0YXJ0ID4gc3RhcnQpIHsgLy8gY29tcGFyZSBtaWxsaXNlY29uZCB0aW1lIChza2lwIGFueSBhbWJpZyBsb2dpYylcblx0XHRcdFx0aW52ZXJzZVJhbmdlcy5wdXNoKHtcblx0XHRcdFx0XHRldmVudDogZXZlbnQwLFxuXHRcdFx0XHRcdHN0YXJ0OiBzdGFydCxcblx0XHRcdFx0XHRlbmQ6IG5vcm1hbFJhbmdlLnN0YXJ0XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRzdGFydCA9IG5vcm1hbFJhbmdlLmVuZDtcblx0XHR9XG5cblx0XHQvLyBhZGQgdGhlIHNwYW4gb2YgdGltZSBhZnRlciB0aGUgbGFzdCBldmVudCAoaWYgdGhlcmUgaXMgYW55KVxuXHRcdGlmIChzdGFydCA8IHZpZXdFbmQpIHsgLy8gY29tcGFyZSBtaWxsaXNlY29uZCB0aW1lIChza2lwIGFueSBhbWJpZyBsb2dpYylcblx0XHRcdGludmVyc2VSYW5nZXMucHVzaCh7XG5cdFx0XHRcdGV2ZW50OiBldmVudDAsXG5cdFx0XHRcdHN0YXJ0OiBzdGFydCxcblx0XHRcdFx0ZW5kOiB2aWV3RW5kXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gaW52ZXJzZVJhbmdlcztcblx0fSxcblxuXG5cdC8vIFNsaWNlcyB0aGUgZ2l2ZW4gZXZlbnQgcmFuZ2UgaW50byBvbmUgb3IgbW9yZSBzZWdtZW50IG9iamVjdHMuXG5cdC8vIEEgYHJhbmdlVG9TZWdzRnVuY2AgY3VzdG9tIHNsaWNpbmcgZnVuY3Rpb24gY2FuIGJlIGdpdmVuLlxuXHRldmVudFJhbmdlVG9TZWdzOiBmdW5jdGlvbihldmVudFJhbmdlLCByYW5nZVRvU2Vnc0Z1bmMpIHtcblx0XHR2YXIgc2Vncztcblx0XHR2YXIgaSwgc2VnO1xuXG5cdFx0aWYgKHJhbmdlVG9TZWdzRnVuYykge1xuXHRcdFx0c2VncyA9IHJhbmdlVG9TZWdzRnVuYyhldmVudFJhbmdlKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRzZWdzID0gdGhpcy5yYW5nZVRvU2VncyhldmVudFJhbmdlKTsgLy8gZGVmaW5lZCBieSB0aGUgc3ViY2xhc3Ncblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgc2Vncy5sZW5ndGg7IGkrKykge1xuXHRcdFx0c2VnID0gc2Vnc1tpXTtcblx0XHRcdHNlZy5ldmVudCA9IGV2ZW50UmFuZ2UuZXZlbnQ7XG5cdFx0XHRzZWcuZXZlbnRTdGFydE1TID0gZXZlbnRSYW5nZS5ldmVudFN0YXJ0TVM7XG5cdFx0XHRzZWcuZXZlbnREdXJhdGlvbk1TID0gZXZlbnRSYW5nZS5ldmVudER1cmF0aW9uTVM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNlZ3M7XG5cdH1cblxufSk7XG5cblxuLyogVXRpbGl0aWVzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5mdW5jdGlvbiBpc0JnRXZlbnQoZXZlbnQpIHsgLy8gcmV0dXJucyB0cnVlIGlmIGJhY2tncm91bmQgT1IgaW52ZXJzZS1iYWNrZ3JvdW5kXG5cdHZhciByZW5kZXJpbmcgPSBnZXRFdmVudFJlbmRlcmluZyhldmVudCk7XG5cdHJldHVybiByZW5kZXJpbmcgPT09ICdiYWNrZ3JvdW5kJyB8fCByZW5kZXJpbmcgPT09ICdpbnZlcnNlLWJhY2tncm91bmQnO1xufVxuXG5cbmZ1bmN0aW9uIGlzSW52ZXJzZUJnRXZlbnQoZXZlbnQpIHtcblx0cmV0dXJuIGdldEV2ZW50UmVuZGVyaW5nKGV2ZW50KSA9PT0gJ2ludmVyc2UtYmFja2dyb3VuZCc7XG59XG5cblxuZnVuY3Rpb24gZ2V0RXZlbnRSZW5kZXJpbmcoZXZlbnQpIHtcblx0cmV0dXJuIGZpcnN0RGVmaW5lZCgoZXZlbnQuc291cmNlIHx8IHt9KS5yZW5kZXJpbmcsIGV2ZW50LnJlbmRlcmluZyk7XG59XG5cblxuZnVuY3Rpb24gZ3JvdXBFdmVudHNCeUlkKGV2ZW50cykge1xuXHR2YXIgZXZlbnRzQnlJZCA9IHt9O1xuXHR2YXIgaSwgZXZlbnQ7XG5cblx0Zm9yIChpID0gMDsgaSA8IGV2ZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdGV2ZW50ID0gZXZlbnRzW2ldO1xuXHRcdChldmVudHNCeUlkW2V2ZW50Ll9pZF0gfHwgKGV2ZW50c0J5SWRbZXZlbnQuX2lkXSA9IFtdKSkucHVzaChldmVudCk7XG5cdH1cblxuXHRyZXR1cm4gZXZlbnRzQnlJZDtcbn1cblxuXG4vLyBBIGNtcCBmdW5jdGlvbiBmb3IgZGV0ZXJtaW5pbmcgd2hpY2ggbm9uLWludmVydGVkIFwicmFuZ2VzXCIgKHNlZSBhYm92ZSkgaGFwcGVuIGVhcmxpZXJcbmZ1bmN0aW9uIGNvbXBhcmVOb3JtYWxSYW5nZXMocmFuZ2UxLCByYW5nZTIpIHtcblx0cmV0dXJuIHJhbmdlMS5ldmVudFN0YXJ0TVMgLSByYW5nZTIuZXZlbnRTdGFydE1TOyAvLyBlYXJsaWVyIHJhbmdlcyBnbyBmaXJzdFxufVxuXG5cbi8vIEEgY21wIGZ1bmN0aW9uIGZvciBkZXRlcm1pbmluZyB3aGljaCBzZWdtZW50cyBzaG91bGQgdGFrZSB2aXN1YWwgcHJpb3JpdHlcbi8vIERPRVMgTk9UIFdPUksgT04gSU5WRVJURUQgQkFDS0dST1VORCBFVkVOVFMgYmVjYXVzZSB0aGV5IGhhdmUgbm8gZXZlbnRTdGFydE1TL2V2ZW50RHVyYXRpb25NU1xuZnVuY3Rpb24gY29tcGFyZVNlZ3Moc2VnMSwgc2VnMikge1xuXHRyZXR1cm4gc2VnMS5ldmVudFN0YXJ0TVMgLSBzZWcyLmV2ZW50U3RhcnRNUyB8fCAvLyBlYXJsaWVyIGV2ZW50cyBnbyBmaXJzdFxuXHRcdHNlZzIuZXZlbnREdXJhdGlvbk1TIC0gc2VnMS5ldmVudER1cmF0aW9uTVMgfHwgLy8gdGllPyBsb25nZXIgZXZlbnRzIGdvIGZpcnN0XG5cdFx0c2VnMi5ldmVudC5hbGxEYXkgLSBzZWcxLmV2ZW50LmFsbERheSB8fCAvLyB0aWU/IHB1dCBhbGwtZGF5IGV2ZW50cyBmaXJzdCAoYm9vbGVhbnMgY2FzdCB0byAwLzEpXG5cdFx0KHNlZzEuZXZlbnQudGl0bGUgfHwgJycpLmxvY2FsZUNvbXBhcmUoc2VnMi5ldmVudC50aXRsZSk7IC8vIHRpZT8gYWxwaGFiZXRpY2FsbHkgYnkgdGl0bGVcbn1cblxuZmMuY29tcGFyZVNlZ3MgPSBjb21wYXJlU2VnczsgLy8gZXhwb3J0XG5cblxuLyogRXh0ZXJuYWwtRHJhZ2dpbmctRWxlbWVudCBEYXRhXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuLy8gUmVxdWlyZSBhbGwgSFRNTDUgZGF0YS0qIGF0dHJpYnV0ZXMgdXNlZCBieSBGdWxsQ2FsZW5kYXIgdG8gaGF2ZSB0aGlzIHByZWZpeC5cbi8vIEEgdmFsdWUgb2YgJycgd2lsbCBxdWVyeSBhdHRyaWJ1dGVzIGxpa2UgZGF0YS1ldmVudC4gQSB2YWx1ZSBvZiAnZmMnIHdpbGwgcXVlcnkgYXR0cmlidXRlcyBsaWtlIGRhdGEtZmMtZXZlbnQuXG5mYy5kYXRhQXR0clByZWZpeCA9ICcnO1xuXG4vLyBHaXZlbiBhIGpRdWVyeSBlbGVtZW50IHRoYXQgbWlnaHQgcmVwcmVzZW50IGEgZHJhZ2dlZCBGdWxsQ2FsZW5kYXIgZXZlbnQsIHJldHVybnMgYW4gaW50ZXJtZWRpYXRlIGRhdGEgc3RydWN0dXJlXG4vLyB0byBiZSB1c2VkIGZvciBFdmVudCBPYmplY3QgY3JlYXRpb24uXG4vLyBBIGRlZmluZWQgYC5ldmVudFByb3BzYCwgZXZlbiB3aGVuIGVtcHR5LCBpbmRpY2F0ZXMgdGhhdCBhbiBldmVudCBzaG91bGQgYmUgY3JlYXRlZC5cbmZ1bmN0aW9uIGdldERyYWdnZWRFbE1ldGEoZWwpIHtcblx0dmFyIHByZWZpeCA9IGZjLmRhdGFBdHRyUHJlZml4O1xuXHR2YXIgZXZlbnRQcm9wczsgLy8gcHJvcGVydGllcyBmb3IgY3JlYXRpbmcgdGhlIGV2ZW50LCBub3QgcmVsYXRlZCB0byBkYXRlL3RpbWVcblx0dmFyIHN0YXJ0VGltZTsgLy8gYSBEdXJhdGlvblxuXHR2YXIgZHVyYXRpb247XG5cdHZhciBzdGljaztcblxuXHRpZiAocHJlZml4KSB7IHByZWZpeCArPSAnLSc7IH1cblx0ZXZlbnRQcm9wcyA9IGVsLmRhdGEocHJlZml4ICsgJ2V2ZW50JykgfHwgbnVsbDtcblxuXHRpZiAoZXZlbnRQcm9wcykge1xuXHRcdGlmICh0eXBlb2YgZXZlbnRQcm9wcyA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGV2ZW50UHJvcHMgPSAkLmV4dGVuZCh7fSwgZXZlbnRQcm9wcyk7IC8vIG1ha2UgYSBjb3B5XG5cdFx0fVxuXHRcdGVsc2UgeyAvLyBzb21ldGhpbmcgbGlrZSAxIG9yIHRydWUuIHN0aWxsIHNpZ25hbCBldmVudCBjcmVhdGlvblxuXHRcdFx0ZXZlbnRQcm9wcyA9IHt9O1xuXHRcdH1cblxuXHRcdC8vIHBsdWNrIHNwZWNpYWwtY2FzZWQgZGF0ZS90aW1lIHByb3BlcnRpZXNcblx0XHRzdGFydFRpbWUgPSBldmVudFByb3BzLnN0YXJ0O1xuXHRcdGlmIChzdGFydFRpbWUgPT0gbnVsbCkgeyBzdGFydFRpbWUgPSBldmVudFByb3BzLnRpbWU7IH0gLy8gYWNjZXB0ICd0aW1lJyBhcyB3ZWxsXG5cdFx0ZHVyYXRpb24gPSBldmVudFByb3BzLmR1cmF0aW9uO1xuXHRcdHN0aWNrID0gZXZlbnRQcm9wcy5zdGljaztcblx0XHRkZWxldGUgZXZlbnRQcm9wcy5zdGFydDtcblx0XHRkZWxldGUgZXZlbnRQcm9wcy50aW1lO1xuXHRcdGRlbGV0ZSBldmVudFByb3BzLmR1cmF0aW9uO1xuXHRcdGRlbGV0ZSBldmVudFByb3BzLnN0aWNrO1xuXHR9XG5cblx0Ly8gZmFsbGJhY2sgdG8gc3RhbmRhbG9uZSBhdHRyaWJ1dGUgdmFsdWVzIGZvciBlYWNoIG9mIHRoZSBkYXRlL3RpbWUgcHJvcGVydGllc1xuXHRpZiAoc3RhcnRUaW1lID09IG51bGwpIHsgc3RhcnRUaW1lID0gZWwuZGF0YShwcmVmaXggKyAnc3RhcnQnKTsgfVxuXHRpZiAoc3RhcnRUaW1lID09IG51bGwpIHsgc3RhcnRUaW1lID0gZWwuZGF0YShwcmVmaXggKyAndGltZScpOyB9IC8vIGFjY2VwdCAndGltZScgYXMgd2VsbFxuXHRpZiAoZHVyYXRpb24gPT0gbnVsbCkgeyBkdXJhdGlvbiA9IGVsLmRhdGEocHJlZml4ICsgJ2R1cmF0aW9uJyk7IH1cblx0aWYgKHN0aWNrID09IG51bGwpIHsgc3RpY2sgPSBlbC5kYXRhKHByZWZpeCArICdzdGljaycpOyB9XG5cblx0Ly8gbWFzc2FnZSBpbnRvIGNvcnJlY3QgZGF0YSB0eXBlc1xuXHRzdGFydFRpbWUgPSBzdGFydFRpbWUgIT0gbnVsbCA/IG1vbWVudC5kdXJhdGlvbihzdGFydFRpbWUpIDogbnVsbDtcblx0ZHVyYXRpb24gPSBkdXJhdGlvbiAhPSBudWxsID8gbW9tZW50LmR1cmF0aW9uKGR1cmF0aW9uKSA6IG51bGw7XG5cdHN0aWNrID0gQm9vbGVhbihzdGljayk7XG5cblx0cmV0dXJuIHsgZXZlbnRQcm9wczogZXZlbnRQcm9wcywgc3RhcnRUaW1lOiBzdGFydFRpbWUsIGR1cmF0aW9uOiBkdXJhdGlvbiwgc3RpY2s6IHN0aWNrIH07XG59XG5cblxuICAgIC8qIEEgY29tcG9uZW50IHRoYXQgcmVuZGVycyBhIGdyaWQgb2Ygd2hvbGUtZGF5cyB0aGF0IHJ1bnMgaG9yaXpvbnRhbGx5LiBUaGVyZSBjYW4gYmUgbXVsdGlwbGUgcm93cywgb25lIHBlciB3ZWVrLlxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbnZhciBEYXlHcmlkID0gR3JpZC5leHRlbmQoe1xuXG5cdG51bWJlcnNWaXNpYmxlOiBmYWxzZSwgLy8gc2hvdWxkIHJlbmRlciBhIHJvdyBmb3IgZGF5L3dlZWsgbnVtYmVycz8gc2V0IGJ5IG91dHNpZGUgdmlldy4gVE9ETzogbWFrZSBpbnRlcm5hbFxuXHRib3R0b21Db29yZFBhZGRpbmc6IDAsIC8vIGhhY2sgZm9yIGV4dGVuZGluZyB0aGUgaGl0IGFyZWEgZm9yIHRoZSBsYXN0IHJvdyBvZiB0aGUgY29vcmRpbmF0ZSBncmlkXG5cdGJyZWFrT25XZWVrczogbnVsbCwgLy8gc2hvdWxkIGNyZWF0ZSBhIG5ldyByb3cgZm9yIGVhY2ggd2Vlaz8gc2V0IGJ5IG91dHNpZGUgdmlld1xuXG5cdGNlbGxEYXRlczogbnVsbCwgLy8gZmxhdCBjaHJvbm9sb2dpY2FsIGFycmF5IG9mIGVhY2ggY2VsbCdzIGRhdGVzXG5cdGRheVRvQ2VsbE9mZnNldHM6IG51bGwsIC8vIG1hcHMgZGF5cyBvZmZzZXRzIGZyb20gZ3JpZCdzIHN0YXJ0IGRhdGUsIHRvIGNlbGwgb2Zmc2V0c1xuXG5cdHJvd0VsczogbnVsbCwgLy8gc2V0IG9mIGZha2Ugcm93IGVsZW1lbnRzXG5cdGRheUVsczogbnVsbCwgLy8gc2V0IG9mIHdob2xlLWRheSBlbGVtZW50cyBjb21wcmlzaW5nIHRoZSByb3cncyBiYWNrZ3JvdW5kXG5cdGhlbHBlckVsczogbnVsbCwgLy8gc2V0IG9mIGNlbGwgc2tlbGV0b24gZWxlbWVudHMgZm9yIHJlbmRlcmluZyB0aGUgbW9jayBldmVudCBcImhlbHBlclwiXG5cblxuXHQvLyBSZW5kZXJzIHRoZSByb3dzIGFuZCBjb2x1bW5zIGludG8gdGhlIGNvbXBvbmVudCdzIGB0aGlzLmVsYCwgd2hpY2ggc2hvdWxkIGFscmVhZHkgYmUgYXNzaWduZWQuXG5cdC8vIGlzUmlnaWQgZGV0ZXJtaW5zIHdoZXRoZXIgdGhlIGluZGl2aWR1YWwgcm93cyBzaG91bGQgaWdub3JlIHRoZSBjb250ZW50cyBhbmQgYmUgYSBjb25zdGFudCBoZWlnaHQuXG5cdC8vIFJlbGllcyBvbiB0aGUgdmlldydzIGNvbENudCBhbmQgcm93Q250LiBJbiB0aGUgZnV0dXJlLCB0aGlzIGNvbXBvbmVudCBzaG91bGQgcHJvYmFibHkgYmUgc2VsZi1zdWZmaWNpZW50LlxuXHRyZW5kZXI6IGZ1bmN0aW9uKGlzUmlnaWQpIHtcblx0XHR2YXIgdmlldyA9IHRoaXMudmlldztcblx0XHR2YXIgcm93Q250ID0gdGhpcy5yb3dDbnQ7XG5cdFx0dmFyIGNvbENudCA9IHRoaXMuY29sQ250O1xuXHRcdHZhciBjZWxsQ250ID0gcm93Q250ICogY29sQ250O1xuXHRcdHZhciBodG1sID0gJyc7XG5cdFx0dmFyIHJvdztcblx0XHR2YXIgaSwgY2VsbDtcblxuXHRcdGZvciAocm93ID0gMDsgcm93IDwgcm93Q250OyByb3crKykge1xuXHRcdFx0aHRtbCArPSB0aGlzLmRheVJvd0h0bWwocm93LCBpc1JpZ2lkKTtcblx0XHR9XG5cdFx0dGhpcy5lbC5odG1sKGh0bWwpO1xuXG5cdFx0dGhpcy5yb3dFbHMgPSB0aGlzLmVsLmZpbmQoJy5mYy1yb3cnKTtcblx0XHR0aGlzLmRheUVscyA9IHRoaXMuZWwuZmluZCgnLmZjLWRheScpO1xuXG5cdFx0Ly8gdHJpZ2dlciBkYXlSZW5kZXIgd2l0aCBlYWNoIGNlbGwncyBlbGVtZW50XG5cdFx0Zm9yIChpID0gMDsgaSA8IGNlbGxDbnQ7IGkrKykge1xuXHRcdFx0Y2VsbCA9IHRoaXMuZ2V0Q2VsbChpKTtcblx0XHRcdHZpZXcudHJpZ2dlcignZGF5UmVuZGVyJywgbnVsbCwgY2VsbC5zdGFydCwgdGhpcy5kYXlFbHMuZXEoaSkpO1xuXHRcdH1cblxuXHRcdEdyaWQucHJvdG90eXBlLnJlbmRlci5jYWxsKHRoaXMpOyAvLyBjYWxsIHRoZSBzdXBlci1tZXRob2Rcblx0fSxcblxuXG5cdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGVzdHJveVNlZ1BvcG92ZXIoKTtcblx0XHRHcmlkLnByb3RvdHlwZS5kZXN0cm95LmNhbGwodGhpcyk7IC8vIGNhbGwgdGhlIHN1cGVyLW1ldGhvZFxuXHR9LFxuXG5cblx0Ly8gR2VuZXJhdGVzIHRoZSBIVE1MIGZvciBhIHNpbmdsZSByb3cuIGByb3dgIGlzIHRoZSByb3cgbnVtYmVyLlxuXHRkYXlSb3dIdG1sOiBmdW5jdGlvbihyb3csIGlzUmlnaWQpIHtcblx0XHR2YXIgdmlldyA9IHRoaXMudmlldztcblx0XHR2YXIgY2xhc3NlcyA9IFsgJ2ZjLXJvdycsICdmYy13ZWVrJywgdmlldy53aWRnZXRDb250ZW50Q2xhc3MgXTtcblxuXHRcdGlmIChpc1JpZ2lkKSB7XG5cdFx0XHRjbGFzc2VzLnB1c2goJ2ZjLXJpZ2lkJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICcnICtcblx0XHRcdCc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMuam9pbignICcpICsgJ1wiPicgK1xuXHRcdFx0XHQnPGRpdiBjbGFzcz1cImZjLWJnXCI+JyArXG5cdFx0XHRcdFx0Jzx0YWJsZT4nICtcblx0XHRcdFx0XHRcdHRoaXMucm93SHRtbCgnZGF5Jywgcm93KSArIC8vIGxldmVyYWdlcyBSb3dSZW5kZXJlci4gY2FsbHMgZGF5Q2VsbEh0bWwoKVxuXHRcdFx0XHRcdCc8L3RhYmxlPicgK1xuXHRcdFx0XHQnPC9kaXY+JyArXG5cdFx0XHRcdCc8ZGl2IGNsYXNzPVwiZmMtY29udGVudC1za2VsZXRvblwiPicgK1xuXHRcdFx0XHRcdCc8dGFibGU+JyArXG5cdFx0XHRcdFx0XHQodGhpcy5udW1iZXJzVmlzaWJsZSA/XG5cdFx0XHRcdFx0XHRcdCc8dGhlYWQ+JyArXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5yb3dIdG1sKCdudW1iZXInLCByb3cpICsgLy8gbGV2ZXJhZ2VzIFJvd1JlbmRlcmVyLiBWaWV3IHdpbGwgZGVmaW5lIHJlbmRlciBtZXRob2Rcblx0XHRcdFx0XHRcdFx0JzwvdGhlYWQ+JyA6XG5cdFx0XHRcdFx0XHRcdCcnXG5cdFx0XHRcdFx0XHRcdCkgK1xuXHRcdFx0XHRcdCc8L3RhYmxlPicgK1xuXHRcdFx0XHQnPC9kaXY+JyArXG5cdFx0XHQnPC9kaXY+Jztcblx0fSxcblxuXG5cdC8vIFJlbmRlcnMgdGhlIEhUTUwgZm9yIGEgd2hvbGUtZGF5IGNlbGwuIFdpbGwgZXZlbnR1YWxseSBlbmQgdXAgaW4gdGhlIGRheS1yb3cncyBiYWNrZ3JvdW5kLlxuXHQvLyBXZSBnbyB0aHJvdWdoIGEgJ2RheScgcm93IHR5cGUgaW5zdGVhZCBvZiBqdXN0IGRvaW5nIGEgJ2JnJyByb3cgdHlwZSBzbyB0aGF0IHRoZSBWaWV3IGNhbiBkbyBjdXN0b20gcmVuZGVyaW5nXG5cdC8vIHNwZWNpZmljYWxseSBmb3Igd2hvbGUtZGF5IHJvd3MsIHdoZXJlYXMgYSAnYmcnIG1pZ2h0IGFsc28gYmUgdXNlZCBmb3Igb3RoZXIgcHVycG9zZXMgKFRpbWVHcmlkIGJnIGZvciBleGFtcGxlKS5cblx0ZGF5Q2VsbEh0bWw6IGZ1bmN0aW9uKGNlbGwpIHtcblx0XHRyZXR1cm4gdGhpcy5iZ0NlbGxIdG1sKGNlbGwpO1xuXHR9LFxuXG5cblx0LyogT3B0aW9uc1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gQ29tcHV0ZXMgYSBkZWZhdWx0IGNvbHVtbiBoZWFkZXIgZm9ybWF0dGluZyBzdHJpbmcgaWYgYGNvbEZvcm1hdGAgaXMgbm90IGV4cGxpY2l0bHkgZGVmaW5lZFxuXHRjb21wdXRlQ29sSGVhZEZvcm1hdDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMucm93Q250ID4gMSkgeyAvLyBtb3JlIHRoYW4gb25lIHdlZWsgcm93LiBkYXkgbnVtYmVycyB3aWxsIGJlIGluIGVhY2ggY2VsbFxuXHRcdFx0cmV0dXJuICdkZGQnOyAvLyBcIlNhdFwiXG5cdFx0fVxuXHRcdGVsc2UgaWYgKHRoaXMuY29sQ250ID4gMSkgeyAvLyBtdWx0aXBsZSBkYXlzLCBzbyBmdWxsIHNpbmdsZSBkYXRlIHN0cmluZyBXT04nVCBiZSBpbiB0aXRsZSB0ZXh0XG5cdFx0XHRyZXR1cm4gdGhpcy52aWV3Lm9wdCgnZGF5T2ZNb250aEZvcm1hdCcpOyAvLyBcIlNhdCAxMi8xMFwiXG5cdFx0fVxuXHRcdGVsc2UgeyAvLyBzaW5nbGUgZGF5LCBzbyBmdWxsIHNpbmdsZSBkYXRlIHN0cmluZyB3aWxsIHByb2JhYmx5IGJlIGluIHRpdGxlIHRleHRcblx0XHRcdHJldHVybiAnZGRkZCc7IC8vIFwiU2F0dXJkYXlcIlxuXHRcdH1cblx0fSxcblxuXG5cdC8vIENvbXB1dGVzIGEgZGVmYXVsdCBldmVudCB0aW1lIGZvcm1hdHRpbmcgc3RyaW5nIGlmIGB0aW1lRm9ybWF0YCBpcyBub3QgZXhwbGljaXRseSBkZWZpbmVkXG5cdGNvbXB1dGVFdmVudFRpbWVGb3JtYXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnZpZXcub3B0KCdleHRyYVNtYWxsVGltZUZvcm1hdCcpOyAvLyBsaWtlIFwiNnBcIiBvciBcIjY6MzBwXCJcblx0fSxcblxuXG5cdC8vIENvbXB1dGVzIGEgZGVmYXVsdCBgZGlzcGxheUV2ZW50RW5kYCB2YWx1ZSBpZiBvbmUgaXMgbm90IGV4cGxpY2x0eSBkZWZpbmVkXG5cdGNvbXB1dGVEaXNwbGF5RXZlbnRFbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmNvbENudCA9PSAxOyAvLyB3ZSdsbCBsaWtlbHkgaGF2ZSBzcGFjZSBpZiB0aGVyZSdzIG9ubHkgb25lIGRheVxuXHR9LFxuXG5cblx0LyogQ2VsbCBTeXN0ZW1cblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIEluaXRpYWxpemVzIHJvdy9jb2wgaW5mb3JtYXRpb25cblx0dXBkYXRlQ2VsbHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjZWxsRGF0ZXM7XG5cdFx0dmFyIGZpcnN0RGF5O1xuXHRcdHZhciByb3dDbnQ7XG5cdFx0dmFyIGNvbENudDtcblxuXHRcdHRoaXMudXBkYXRlQ2VsbERhdGVzKCk7IC8vIHBvcHVsYXRlcyBjZWxsRGF0ZXMgYW5kIGRheVRvQ2VsbE9mZnNldHNcblx0XHRjZWxsRGF0ZXMgPSB0aGlzLmNlbGxEYXRlcztcblxuXHRcdGlmICh0aGlzLmJyZWFrT25XZWVrcykge1xuXHRcdFx0Ly8gY291bnQgY29sdW1ucyB1bnRpbCB0aGUgZGF5LW9mLXdlZWsgcmVwZWF0c1xuXHRcdFx0Zmlyc3REYXkgPSBjZWxsRGF0ZXNbMF0uZGF5KCk7XG5cdFx0XHRmb3IgKGNvbENudCA9IDE7IGNvbENudCA8IGNlbGxEYXRlcy5sZW5ndGg7IGNvbENudCsrKSB7XG5cdFx0XHRcdGlmIChjZWxsRGF0ZXNbY29sQ250XS5kYXkoKSA9PSBmaXJzdERheSkge1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyb3dDbnQgPSBNYXRoLmNlaWwoY2VsbERhdGVzLmxlbmd0aCAvIGNvbENudCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cm93Q250ID0gMTtcblx0XHRcdGNvbENudCA9IGNlbGxEYXRlcy5sZW5ndGg7XG5cdFx0fVxuXG5cdFx0dGhpcy5yb3dDbnQgPSByb3dDbnQ7XG5cdFx0dGhpcy5jb2xDbnQgPSBjb2xDbnQ7XG5cdH0sXG5cblxuXHQvLyBQb3B1bGF0ZXMgY2VsbERhdGVzIGFuZCBkYXlUb0NlbGxPZmZzZXRzXG5cdHVwZGF0ZUNlbGxEYXRlczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHZpZXcgPSB0aGlzLnZpZXc7XG5cdFx0dmFyIGRhdGUgPSB0aGlzLnN0YXJ0LmNsb25lKCk7XG5cdFx0dmFyIGRhdGVzID0gW107XG5cdFx0dmFyIG9mZnNldCA9IC0xO1xuXHRcdHZhciBvZmZzZXRzID0gW107XG5cblx0XHR3aGlsZSAoZGF0ZS5pc0JlZm9yZSh0aGlzLmVuZCkpIHsgLy8gbG9vcCBlYWNoIGRheSBmcm9tIHN0YXJ0IHRvIGVuZFxuXHRcdFx0aWYgKHZpZXcuaXNIaWRkZW5EYXkoZGF0ZSkpIHtcblx0XHRcdFx0b2Zmc2V0cy5wdXNoKG9mZnNldCArIDAuNSk7IC8vIG1hcmsgdGhhdCBpdCdzIGJldHdlZW4gb2Zmc2V0c1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdG9mZnNldCsrO1xuXHRcdFx0XHRvZmZzZXRzLnB1c2gob2Zmc2V0KTtcblx0XHRcdFx0ZGF0ZXMucHVzaChkYXRlLmNsb25lKCkpO1xuXHRcdFx0fVxuXHRcdFx0ZGF0ZS5hZGQoMSwgJ2RheXMnKTtcblx0XHR9XG5cblx0XHR0aGlzLmNlbGxEYXRlcyA9IGRhdGVzO1xuXHRcdHRoaXMuZGF5VG9DZWxsT2Zmc2V0cyA9IG9mZnNldHM7XG5cdH0sXG5cblxuXHQvLyBHaXZlbiBhIGNlbGwgb2JqZWN0LCBnZW5lcmF0ZXMgYSByYW5nZSBvYmplY3Rcblx0Y29tcHV0ZUNlbGxSYW5nZTogZnVuY3Rpb24oY2VsbCkge1xuXHRcdHZhciBjb2xDbnQgPSB0aGlzLmNvbENudDtcblx0XHR2YXIgaW5kZXggPSBjZWxsLnJvdyAqIGNvbENudCArICh0aGlzLmlzUlRMID8gY29sQ250IC0gY2VsbC5jb2wgLSAxIDogY2VsbC5jb2wpO1xuXHRcdHZhciBzdGFydCA9IHRoaXMuY2VsbERhdGVzW2luZGV4XS5jbG9uZSgpO1xuXHRcdHZhciBlbmQgPSBzdGFydC5jbG9uZSgpLmFkZCgxLCAnZGF5Jyk7XG5cblx0XHRyZXR1cm4geyBzdGFydDogc3RhcnQsIGVuZDogZW5kIH07XG5cdH0sXG5cblxuXHQvLyBSZXRyaWV2ZXMgdGhlIGVsZW1lbnQgcmVwcmVzZW50aW5nIHRoZSBnaXZlbiByb3dcblx0Z2V0Um93RWw6IGZ1bmN0aW9uKHJvdykge1xuXHRcdHJldHVybiB0aGlzLnJvd0Vscy5lcShyb3cpO1xuXHR9LFxuXG5cblx0Ly8gUmV0cmlldmVzIHRoZSBlbGVtZW50IHJlcHJlc2VudGluZyB0aGUgZ2l2ZW4gY29sdW1uXG5cdGdldENvbEVsOiBmdW5jdGlvbihjb2wpIHtcblx0XHRyZXR1cm4gdGhpcy5kYXlFbHMuZXEoY29sKTtcblx0fSxcblxuXG5cdC8vIEdldHMgdGhlIHdob2xlLWRheSBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgY2VsbFxuXHRnZXRDZWxsRGF5RWw6IGZ1bmN0aW9uKGNlbGwpIHtcblx0XHRyZXR1cm4gdGhpcy5kYXlFbHMuZXEoY2VsbC5yb3cgKiB0aGlzLmNvbENudCArIGNlbGwuY29sKTtcblx0fSxcblxuXG5cdC8vIE92ZXJyaWRlcyBHcmlkJ3MgbWV0aG9kIGZvciB3aGVuIHJvdyBjb29yZGluYXRlcyBhcmUgY29tcHV0ZWRcblx0Y29tcHV0ZVJvd0Nvb3JkczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJvd0Nvb3JkcyA9IEdyaWQucHJvdG90eXBlLmNvbXB1dGVSb3dDb29yZHMuY2FsbCh0aGlzKTsgLy8gY2FsbCB0aGUgc3VwZXItbWV0aG9kXG5cblx0XHQvLyBoYWNrIGZvciBleHRlbmRpbmcgbGFzdCByb3cgKHVzZWQgYnkgQWdlbmRhVmlldylcblx0XHRyb3dDb29yZHNbcm93Q29vcmRzLmxlbmd0aCAtIDFdLmJvdHRvbSArPSB0aGlzLmJvdHRvbUNvb3JkUGFkZGluZztcblxuXHRcdHJldHVybiByb3dDb29yZHM7XG5cdH0sXG5cblxuXHQvKiBEYXRlc1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gU2xpY2VzIHVwIGEgZGF0ZSByYW5nZSBieSByb3cgaW50byBhbiBhcnJheSBvZiBzZWdtZW50c1xuXHRyYW5nZVRvU2VnczogZnVuY3Rpb24ocmFuZ2UpIHtcblx0XHR2YXIgaXNSVEwgPSB0aGlzLmlzUlRMO1xuXHRcdHZhciByb3dDbnQgPSB0aGlzLnJvd0NudDtcblx0XHR2YXIgY29sQ250ID0gdGhpcy5jb2xDbnQ7XG5cdFx0dmFyIHNlZ3MgPSBbXTtcblx0XHR2YXIgZmlyc3QsIGxhc3Q7IC8vIGluY2x1c2l2ZSBjZWxsLW9mZnNldCByYW5nZSBmb3IgZ2l2ZW4gcmFuZ2Vcblx0XHR2YXIgcm93O1xuXHRcdHZhciByb3dGaXJzdCwgcm93TGFzdDsgLy8gaW5jbHVzaXZlIGNlbGwtb2Zmc2V0IHJhbmdlIGZvciBjdXJyZW50IHJvd1xuXHRcdHZhciBpc1N0YXJ0LCBpc0VuZDtcblx0XHR2YXIgc2VnRmlyc3QsIHNlZ0xhc3Q7IC8vIGluY2x1c2l2ZSBjZWxsLW9mZnNldCByYW5nZSBmb3Igc2VnbWVudFxuXHRcdHZhciBzZWc7XG5cblx0XHRyYW5nZSA9IHRoaXMudmlldy5jb21wdXRlRGF5UmFuZ2UocmFuZ2UpOyAvLyBtYWtlIHdob2xlLWRheSByYW5nZSwgY29uc2lkZXJpbmcgbmV4dERheVRocmVzaG9sZFxuXHRcdGZpcnN0ID0gdGhpcy5kYXRlVG9DZWxsT2Zmc2V0KHJhbmdlLnN0YXJ0KTtcblx0XHRsYXN0ID0gdGhpcy5kYXRlVG9DZWxsT2Zmc2V0KHJhbmdlLmVuZC5zdWJ0cmFjdCgxLCAnZGF5cycpKTsgLy8gb2Zmc2V0IG9mIGluY2x1c2l2ZSBlbmQgZGF0ZVxuXG5cdFx0Zm9yIChyb3cgPSAwOyByb3cgPCByb3dDbnQ7IHJvdysrKSB7XG5cdFx0XHRyb3dGaXJzdCA9IHJvdyAqIGNvbENudDtcblx0XHRcdHJvd0xhc3QgPSByb3dGaXJzdCArIGNvbENudCAtIDE7XG5cblx0XHRcdC8vIGludGVyc2VjdCBzZWdtZW50J3Mgb2Zmc2V0IHJhbmdlIHdpdGggdGhlIHJvdydzXG5cdFx0XHRzZWdGaXJzdCA9IE1hdGgubWF4KHJvd0ZpcnN0LCBmaXJzdCk7XG5cdFx0XHRzZWdMYXN0ID0gTWF0aC5taW4ocm93TGFzdCwgbGFzdCk7XG5cblx0XHRcdC8vIGRlYWwgd2l0aCBpbi1iZXR3ZWVuIGluZGljZXNcblx0XHRcdHNlZ0ZpcnN0ID0gTWF0aC5jZWlsKHNlZ0ZpcnN0KTsgLy8gaW4tYmV0d2VlbiBzdGFydHMgcm91bmQgdG8gbmV4dCBjZWxsXG5cdFx0XHRzZWdMYXN0ID0gTWF0aC5mbG9vcihzZWdMYXN0KTsgLy8gaW4tYmV0d2VlbiBlbmRzIHJvdW5kIHRvIHByZXYgY2VsbFxuXG5cdFx0XHRpZiAoc2VnRmlyc3QgPD0gc2VnTGFzdCkgeyAvLyB3YXMgdGhlcmUgYW55IGludGVyc2VjdGlvbiB3aXRoIHRoZSBjdXJyZW50IHJvdz9cblxuXHRcdFx0XHQvLyBtdXN0IGJlIG1hdGNoaW5nIGludGVnZXJzIHRvIGJlIHRoZSBzZWdtZW50J3Mgc3RhcnQvZW5kXG5cdFx0XHRcdGlzU3RhcnQgPSBzZWdGaXJzdCA9PT0gZmlyc3Q7XG5cdFx0XHRcdGlzRW5kID0gc2VnTGFzdCA9PT0gbGFzdDtcblxuXHRcdFx0XHQvLyB0cmFuc2xhdGUgb2Zmc2V0cyB0byBiZSByZWxhdGl2ZSB0byBzdGFydC1vZi1yb3dcblx0XHRcdFx0c2VnRmlyc3QgLT0gcm93Rmlyc3Q7XG5cdFx0XHRcdHNlZ0xhc3QgLT0gcm93Rmlyc3Q7XG5cblx0XHRcdFx0c2VnID0geyByb3c6IHJvdywgaXNTdGFydDogaXNTdGFydCwgaXNFbmQ6IGlzRW5kIH07XG5cdFx0XHRcdGlmIChpc1JUTCkge1xuXHRcdFx0XHRcdHNlZy5sZWZ0Q29sID0gY29sQ250IC0gc2VnTGFzdCAtIDE7XG5cdFx0XHRcdFx0c2VnLnJpZ2h0Q29sID0gY29sQ250IC0gc2VnRmlyc3QgLSAxO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHNlZy5sZWZ0Q29sID0gc2VnRmlyc3Q7XG5cdFx0XHRcdFx0c2VnLnJpZ2h0Q29sID0gc2VnTGFzdDtcblx0XHRcdFx0fVxuXHRcdFx0XHRzZWdzLnB1c2goc2VnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gc2Vncztcblx0fSxcblxuXG5cdC8vIEdpdmVuIGEgZGF0ZSwgcmV0dXJucyBpdHMgY2hyb25vbG9jaWFsIGNlbGwtb2Zmc2V0IGZyb20gdGhlIGZpcnN0IGNlbGwgb2YgdGhlIGdyaWQuXG5cdC8vIElmIHRoZSBkYXRlIGxpZXMgYmV0d2VlbiBjZWxscyAoYmVjYXVzZSBvZiBoaWRkZW5EYXlzKSwgcmV0dXJucyBhIGZsb2F0aW5nLXBvaW50IHZhbHVlIGJldHdlZW4gb2Zmc2V0cy5cblx0Ly8gSWYgYmVmb3JlIHRoZSBmaXJzdCBvZmZzZXQsIHJldHVybnMgYSBuZWdhdGl2ZSBudW1iZXIuXG5cdC8vIElmIGFmdGVyIHRoZSBsYXN0IG9mZnNldCwgcmV0dXJucyBhbiBvZmZzZXQgcGFzdCB0aGUgbGFzdCBjZWxsIG9mZnNldC5cblx0Ly8gT25seSB3b3JrcyBmb3IgKnN0YXJ0KiBkYXRlcyBvZiBjZWxscy4gV2lsbCBub3Qgd29yayBmb3IgZXhjbHVzaXZlIGVuZCBkYXRlcyBmb3IgY2VsbHMuXG5cdGRhdGVUb0NlbGxPZmZzZXQ6IGZ1bmN0aW9uKGRhdGUpIHtcblx0XHR2YXIgb2Zmc2V0cyA9IHRoaXMuZGF5VG9DZWxsT2Zmc2V0cztcblx0XHR2YXIgZGF5ID0gZGF0ZS5kaWZmKHRoaXMuc3RhcnQsICdkYXlzJyk7XG5cblx0XHRpZiAoZGF5IDwgMCkge1xuXHRcdFx0cmV0dXJuIG9mZnNldHNbMF0gLSAxO1xuXHRcdH1cblx0XHRlbHNlIGlmIChkYXkgPj0gb2Zmc2V0cy5sZW5ndGgpIHtcblx0XHRcdHJldHVybiBvZmZzZXRzW29mZnNldHMubGVuZ3RoIC0gMV0gKyAxO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiBvZmZzZXRzW2RheV07XG5cdFx0fVxuXHR9LFxuXG5cblx0LyogRXZlbnQgRHJhZyBWaXN1YWxpemF0aW9uXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cdC8vIFRPRE86IG1vdmUgdG8gRGF5R3JpZC5ldmVudCwgc2ltaWxhciB0byB3aGF0IHdlIGRpZCB3aXRoIEdyaWQncyBkcmFnIG1ldGhvZHNcblxuXG5cdC8vIFJlbmRlcnMgYSB2aXN1YWwgaW5kaWNhdGlvbiBvZiBhbiBldmVudCBvciBleHRlcm5hbCBlbGVtZW50IGJlaW5nIGRyYWdnZWQuXG5cdC8vIFRoZSBkcm9wTG9jYXRpb24ncyBlbmQgY2FuIGJlIG51bGwuIHNlZyBjYW4gYmUgbnVsbC4gU2VlIEdyaWQ6OnJlbmRlckRyYWcgZm9yIG1vcmUgaW5mby5cblx0cmVuZGVyRHJhZzogZnVuY3Rpb24oZHJvcExvY2F0aW9uLCBzZWcpIHtcblx0XHR2YXIgb3BhY2l0eTtcblxuXHRcdC8vIGFsd2F5cyByZW5kZXIgYSBoaWdobGlnaHQgdW5kZXJuZWF0aFxuXHRcdHRoaXMucmVuZGVySGlnaGxpZ2h0KFxuXHRcdFx0dGhpcy52aWV3LmNhbGVuZGFyLmVuc3VyZVZpc2libGVFdmVudFJhbmdlKGRyb3BMb2NhdGlvbikgLy8gbmVlZHMgdG8gYmUgYSBwcm9wZXIgcmFuZ2Vcblx0XHQpO1xuXG5cdFx0Ly8gaWYgYSBzZWdtZW50IGZyb20gdGhlIHNhbWUgY2FsZW5kYXIgYnV0IGFub3RoZXIgY29tcG9uZW50IGlzIGJlaW5nIGRyYWdnZWQsIHJlbmRlciBhIGhlbHBlciBldmVudFxuXHRcdGlmIChzZWcgJiYgIXNlZy5lbC5jbG9zZXN0KHRoaXMuZWwpLmxlbmd0aCkge1xuXG5cdFx0XHR0aGlzLnJlbmRlclJhbmdlSGVscGVyKGRyb3BMb2NhdGlvbiwgc2VnKTtcblxuXHRcdFx0b3BhY2l0eSA9IHRoaXMudmlldy5vcHQoJ2RyYWdPcGFjaXR5Jyk7XG5cdFx0XHRpZiAob3BhY2l0eSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHRoaXMuaGVscGVyRWxzLmNzcygnb3BhY2l0eScsIG9wYWNpdHkpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTsgLy8gYSBoZWxwZXIgaGFzIGJlZW4gcmVuZGVyZWRcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBVbnJlbmRlcnMgYW55IHZpc3VhbCBpbmRpY2F0aW9uIG9mIGEgaG92ZXJpbmcgZXZlbnRcblx0ZGVzdHJveURyYWc6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGVzdHJveUhpZ2hsaWdodCgpO1xuXHRcdHRoaXMuZGVzdHJveUhlbHBlcigpO1xuXHR9LFxuXG5cblx0LyogRXZlbnQgUmVzaXplIFZpc3VhbGl6YXRpb25cblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFJlbmRlcnMgYSB2aXN1YWwgaW5kaWNhdGlvbiBvZiBhbiBldmVudCBiZWluZyByZXNpemVkXG5cdHJlbmRlckV2ZW50UmVzaXplOiBmdW5jdGlvbihyYW5nZSwgc2VnKSB7XG5cdFx0dGhpcy5yZW5kZXJIaWdobGlnaHQocmFuZ2UpO1xuXHRcdHRoaXMucmVuZGVyUmFuZ2VIZWxwZXIocmFuZ2UsIHNlZyk7XG5cdH0sXG5cblxuXHQvLyBVbnJlbmRlcnMgYSB2aXN1YWwgaW5kaWNhdGlvbiBvZiBhbiBldmVudCBiZWluZyByZXNpemVkXG5cdGRlc3Ryb3lFdmVudFJlc2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kZXN0cm95SGlnaGxpZ2h0KCk7XG5cdFx0dGhpcy5kZXN0cm95SGVscGVyKCk7XG5cdH0sXG5cblxuXHQvKiBFdmVudCBIZWxwZXJcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFJlbmRlcnMgYSBtb2NrIFwiaGVscGVyXCIgZXZlbnQuIGBzb3VyY2VTZWdgIGlzIHRoZSBhc3NvY2lhdGVkIGludGVybmFsIHNlZ21lbnQgb2JqZWN0LiBJdCBjYW4gYmUgbnVsbC5cblx0cmVuZGVySGVscGVyOiBmdW5jdGlvbihldmVudCwgc291cmNlU2VnKSB7XG5cdFx0dmFyIGhlbHBlck5vZGVzID0gW107XG5cdFx0dmFyIHNlZ3MgPSB0aGlzLmV2ZW50c1RvU2VncyhbIGV2ZW50IF0pO1xuXHRcdHZhciByb3dTdHJ1Y3RzO1xuXG5cdFx0c2VncyA9IHRoaXMucmVuZGVyRmdTZWdFbHMoc2Vncyk7IC8vIGFzc2lnbnMgZWFjaCBzZWcncyBlbCBhbmQgcmV0dXJucyBhIHN1YnNldCBvZiBzZWdzIHRoYXQgd2VyZSByZW5kZXJlZFxuXHRcdHJvd1N0cnVjdHMgPSB0aGlzLnJlbmRlclNlZ1Jvd3Moc2Vncyk7XG5cblx0XHQvLyBpbmplY3QgZWFjaCBuZXcgZXZlbnQgc2tlbGV0b24gaW50byBlYWNoIGFzc29jaWF0ZWQgcm93XG5cdFx0dGhpcy5yb3dFbHMuZWFjaChmdW5jdGlvbihyb3csIHJvd05vZGUpIHtcblx0XHRcdHZhciByb3dFbCA9ICQocm93Tm9kZSk7IC8vIHRoZSAuZmMtcm93XG5cdFx0XHR2YXIgc2tlbGV0b25FbCA9ICQoJzxkaXYgY2xhc3M9XCJmYy1oZWxwZXItc2tlbGV0b25cIj48dGFibGUvPjwvZGl2PicpOyAvLyB3aWxsIGJlIGFic29sdXRlbHkgcG9zaXRpb25lZFxuXHRcdFx0dmFyIHNrZWxldG9uVG9wO1xuXG5cdFx0XHQvLyBJZiB0aGVyZSBpcyBhbiBvcmlnaW5hbCBzZWdtZW50LCBtYXRjaCB0aGUgdG9wIHBvc2l0aW9uLiBPdGhlcndpc2UsIHB1dCBpdCBhdCB0aGUgcm93J3MgdG9wIGxldmVsXG5cdFx0XHRpZiAoc291cmNlU2VnICYmIHNvdXJjZVNlZy5yb3cgPT09IHJvdykge1xuXHRcdFx0XHRza2VsZXRvblRvcCA9IHNvdXJjZVNlZy5lbC5wb3NpdGlvbigpLnRvcDtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRza2VsZXRvblRvcCA9IHJvd0VsLmZpbmQoJy5mYy1jb250ZW50LXNrZWxldG9uIHRib2R5JykucG9zaXRpb24oKS50b3A7XG5cdFx0XHR9XG5cblx0XHRcdHNrZWxldG9uRWwuY3NzKCd0b3AnLCBza2VsZXRvblRvcClcblx0XHRcdFx0LmZpbmQoJ3RhYmxlJylcblx0XHRcdFx0XHQuYXBwZW5kKHJvd1N0cnVjdHNbcm93XS50Ym9keUVsKTtcblxuXHRcdFx0cm93RWwuYXBwZW5kKHNrZWxldG9uRWwpO1xuXHRcdFx0aGVscGVyTm9kZXMucHVzaChza2VsZXRvbkVsWzBdKTtcblx0XHR9KTtcblxuXHRcdHRoaXMuaGVscGVyRWxzID0gJChoZWxwZXJOb2Rlcyk7IC8vIGFycmF5IC0+IGpRdWVyeSBzZXRcblx0fSxcblxuXG5cdC8vIFVucmVuZGVycyBhbnkgdmlzdWFsIGluZGljYXRpb24gb2YgYSBtb2NrIGhlbHBlciBldmVudFxuXHRkZXN0cm95SGVscGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5oZWxwZXJFbHMpIHtcblx0XHRcdHRoaXMuaGVscGVyRWxzLnJlbW92ZSgpO1xuXHRcdFx0dGhpcy5oZWxwZXJFbHMgPSBudWxsO1xuXHRcdH1cblx0fSxcblxuXG5cdC8qIEZpbGwgU3lzdGVtIChoaWdobGlnaHQsIGJhY2tncm91bmQgZXZlbnRzLCBidXNpbmVzcyBob3Vycylcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdGZpbGxTZWdUYWc6ICd0ZCcsIC8vIG92ZXJyaWRlIHRoZSBkZWZhdWx0IHRhZyBuYW1lXG5cblxuXHQvLyBSZW5kZXJzIGEgc2V0IG9mIHJlY3RhbmdsZXMgb3ZlciB0aGUgZ2l2ZW4gc2VnbWVudHMgb2YgZGF5cy5cblx0Ly8gT25seSByZXR1cm5zIHNlZ21lbnRzIHRoYXQgc3VjY2Vzc2Z1bGx5IHJlbmRlcmVkLlxuXHRyZW5kZXJGaWxsOiBmdW5jdGlvbih0eXBlLCBzZWdzKSB7XG5cdFx0dmFyIG5vZGVzID0gW107XG5cdFx0dmFyIGksIHNlZztcblx0XHR2YXIgc2tlbGV0b25FbDtcblxuXHRcdHNlZ3MgPSB0aGlzLnJlbmRlckZpbGxTZWdFbHModHlwZSwgc2Vncyk7IC8vIGFzc2lnbmVzIGAuZWxgIHRvIGVhY2ggc2VnLiByZXR1cm5zIHN1Y2Nlc3NmdWxseSByZW5kZXJlZCBzZWdzXG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgc2Vncy5sZW5ndGg7IGkrKykge1xuXHRcdFx0c2VnID0gc2Vnc1tpXTtcblx0XHRcdHNrZWxldG9uRWwgPSB0aGlzLnJlbmRlckZpbGxSb3codHlwZSwgc2VnKTtcblx0XHRcdHRoaXMucm93RWxzLmVxKHNlZy5yb3cpLmFwcGVuZChza2VsZXRvbkVsKTtcblx0XHRcdG5vZGVzLnB1c2goc2tlbGV0b25FbFswXSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5lbHNCeUZpbGxbdHlwZV0gPSAkKG5vZGVzKTtcblxuXHRcdHJldHVybiBzZWdzO1xuXHR9LFxuXG5cblx0Ly8gR2VuZXJhdGVzIHRoZSBIVE1MIG5lZWRlZCBmb3Igb25lIHJvdyBvZiBhIGZpbGwuIFJlcXVpcmVzIHRoZSBzZWcncyBlbCB0byBiZSByZW5kZXJlZC5cblx0cmVuZGVyRmlsbFJvdzogZnVuY3Rpb24odHlwZSwgc2VnKSB7XG5cdFx0dmFyIGNvbENudCA9IHRoaXMuY29sQ250O1xuXHRcdHZhciBzdGFydENvbCA9IHNlZy5sZWZ0Q29sO1xuXHRcdHZhciBlbmRDb2wgPSBzZWcucmlnaHRDb2wgKyAxO1xuXHRcdHZhciBza2VsZXRvbkVsO1xuXHRcdHZhciB0ckVsO1xuXG5cdFx0c2tlbGV0b25FbCA9ICQoXG5cdFx0XHQnPGRpdiBjbGFzcz1cImZjLScgKyB0eXBlLnRvTG93ZXJDYXNlKCkgKyAnLXNrZWxldG9uXCI+JyArXG5cdFx0XHRcdCc8dGFibGU+PHRyLz48L3RhYmxlPicgK1xuXHRcdFx0JzwvZGl2Pidcblx0XHQpO1xuXHRcdHRyRWwgPSBza2VsZXRvbkVsLmZpbmQoJ3RyJyk7XG5cblx0XHRpZiAoc3RhcnRDb2wgPiAwKSB7XG5cdFx0XHR0ckVsLmFwcGVuZCgnPHRkIGNvbHNwYW49XCInICsgc3RhcnRDb2wgKyAnXCIvPicpO1xuXHRcdH1cblxuXHRcdHRyRWwuYXBwZW5kKFxuXHRcdFx0c2VnLmVsLmF0dHIoJ2NvbHNwYW4nLCBlbmRDb2wgLSBzdGFydENvbClcblx0XHQpO1xuXG5cdFx0aWYgKGVuZENvbCA8IGNvbENudCkge1xuXHRcdFx0dHJFbC5hcHBlbmQoJzx0ZCBjb2xzcGFuPVwiJyArIChjb2xDbnQgLSBlbmRDb2wpICsgJ1wiLz4nKTtcblx0XHR9XG5cblx0XHR0aGlzLmJvb2tlbmRDZWxscyh0ckVsLCB0eXBlKTtcblxuXHRcdHJldHVybiBza2VsZXRvbkVsO1xuXHR9XG5cbn0pO1xuXG4gICAgLyogRXZlbnQtcmVuZGVyaW5nIG1ldGhvZHMgZm9yIHRoZSBEYXlHcmlkIGNsYXNzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuRGF5R3JpZC5taXhpbih7XG5cblx0cm93U3RydWN0czogbnVsbCwgLy8gYW4gYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBob2xkaW5nIGluZm9ybWF0aW9uIGFib3V0IGEgcm93J3MgZm9yZWdyb3VuZCBldmVudC1yZW5kZXJpbmdcblxuXG5cdC8vIFVucmVuZGVycyBhbGwgZXZlbnRzIGN1cnJlbnRseSByZW5kZXJlZCBvbiB0aGUgZ3JpZFxuXHRkZXN0cm95RXZlbnRzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmRlc3Ryb3lTZWdQb3BvdmVyKCk7IC8vIHJlbW92ZXMgdGhlIFwibW9yZS4uXCIgZXZlbnRzIHBvcG92ZXJcblx0XHRHcmlkLnByb3RvdHlwZS5kZXN0cm95RXZlbnRzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IC8vIGNhbGxzIHRoZSBzdXBlci1tZXRob2Rcblx0fSxcblxuXG5cdC8vIFJldHJpZXZlcyBhbGwgcmVuZGVyZWQgc2VnbWVudCBvYmplY3RzIGN1cnJlbnRseSByZW5kZXJlZCBvbiB0aGUgZ3JpZFxuXHRnZXRFdmVudFNlZ3M6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBHcmlkLnByb3RvdHlwZS5nZXRFdmVudFNlZ3MuY2FsbCh0aGlzKSAvLyBnZXQgdGhlIHNlZ21lbnRzIGZyb20gdGhlIHN1cGVyLW1ldGhvZFxuXHRcdFx0LmNvbmNhdCh0aGlzLnBvcG92ZXJTZWdzIHx8IFtdKTsgLy8gYXBwZW5kIHRoZSBzZWdtZW50cyBmcm9tIHRoZSBcIm1vcmUuLi5cIiBwb3BvdmVyXG5cdH0sXG5cblxuXHQvLyBSZW5kZXJzIHRoZSBnaXZlbiBiYWNrZ3JvdW5kIGV2ZW50IHNlZ21lbnRzIG9udG8gdGhlIGdyaWRcblx0cmVuZGVyQmdTZWdzOiBmdW5jdGlvbihzZWdzKSB7XG5cblx0XHQvLyBkb24ndCByZW5kZXIgdGltZWQgYmFja2dyb3VuZCBldmVudHNcblx0XHR2YXIgYWxsRGF5U2VncyA9ICQuZ3JlcChzZWdzLCBmdW5jdGlvbihzZWcpIHtcblx0XHRcdHJldHVybiBzZWcuZXZlbnQuYWxsRGF5O1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIEdyaWQucHJvdG90eXBlLnJlbmRlckJnU2Vncy5jYWxsKHRoaXMsIGFsbERheVNlZ3MpOyAvLyBjYWxsIHRoZSBzdXBlci1tZXRob2Rcblx0fSxcblxuXG5cdC8vIFJlbmRlcnMgdGhlIGdpdmVuIGZvcmVncm91bmQgZXZlbnQgc2VnbWVudHMgb250byB0aGUgZ3JpZFxuXHRyZW5kZXJGZ1NlZ3M6IGZ1bmN0aW9uKHNlZ3MpIHtcblx0XHR2YXIgcm93U3RydWN0cztcblxuXHRcdC8vIHJlbmRlciBhbiBgLmVsYCBvbiBlYWNoIHNlZ1xuXHRcdC8vIHJldHVybnMgYSBzdWJzZXQgb2YgdGhlIHNlZ3MuIHNlZ3MgdGhhdCB3ZXJlIGFjdHVhbGx5IHJlbmRlcmVkXG5cdFx0c2VncyA9IHRoaXMucmVuZGVyRmdTZWdFbHMoc2Vncyk7XG5cblx0XHRyb3dTdHJ1Y3RzID0gdGhpcy5yb3dTdHJ1Y3RzID0gdGhpcy5yZW5kZXJTZWdSb3dzKHNlZ3MpO1xuXG5cdFx0Ly8gYXBwZW5kIHRvIGVhY2ggcm93J3MgY29udGVudCBza2VsZXRvblxuXHRcdHRoaXMucm93RWxzLmVhY2goZnVuY3Rpb24oaSwgcm93Tm9kZSkge1xuXHRcdFx0JChyb3dOb2RlKS5maW5kKCcuZmMtY29udGVudC1za2VsZXRvbiA+IHRhYmxlJykuYXBwZW5kKFxuXHRcdFx0XHRyb3dTdHJ1Y3RzW2ldLnRib2R5RWxcblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gc2VnczsgLy8gcmV0dXJuIG9ubHkgdGhlIHNlZ3MgdGhhdCB3ZXJlIGFjdHVhbGx5IHJlbmRlcmVkXG5cdH0sXG5cblxuXHQvLyBVbnJlbmRlcnMgYWxsIGN1cnJlbnRseSByZW5kZXJlZCBmb3JlZ3JvdW5kIGV2ZW50IHNlZ21lbnRzXG5cdGRlc3Ryb3lGZ1NlZ3M6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciByb3dTdHJ1Y3RzID0gdGhpcy5yb3dTdHJ1Y3RzIHx8IFtdO1xuXHRcdHZhciByb3dTdHJ1Y3Q7XG5cblx0XHR3aGlsZSAoKHJvd1N0cnVjdCA9IHJvd1N0cnVjdHMucG9wKCkpKSB7XG5cdFx0XHRyb3dTdHJ1Y3QudGJvZHlFbC5yZW1vdmUoKTtcblx0XHR9XG5cblx0XHR0aGlzLnJvd1N0cnVjdHMgPSBudWxsO1xuXHR9LFxuXG5cblx0Ly8gVXNlcyB0aGUgZ2l2ZW4gZXZlbnRzIGFycmF5IHRvIGdlbmVyYXRlIDx0Ym9keT4gZWxlbWVudHMgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWQgdG8gZWFjaCByb3cncyBjb250ZW50IHNrZWxldG9uLlxuXHQvLyBSZXR1cm5zIGFuIGFycmF5IG9mIHJvd1N0cnVjdCBvYmplY3RzIChzZWUgdGhlIGJvdHRvbSBvZiBgcmVuZGVyU2VnUm93YCkuXG5cdC8vIFBSRUNPTkRJVElPTjogZWFjaCBzZWdtZW50IHNob3VkIGFscmVhZHkgaGF2ZSBhIHJlbmRlcmVkIGFuZCBhc3NpZ25lZCBgLmVsYFxuXHRyZW5kZXJTZWdSb3dzOiBmdW5jdGlvbihzZWdzKSB7XG5cdFx0dmFyIHJvd1N0cnVjdHMgPSBbXTtcblx0XHR2YXIgc2VnUm93cztcblx0XHR2YXIgcm93O1xuXG5cdFx0c2VnUm93cyA9IHRoaXMuZ3JvdXBTZWdSb3dzKHNlZ3MpOyAvLyBncm91cCBpbnRvIG5lc3RlZCBhcnJheXNcblxuXHRcdC8vIGl0ZXJhdGUgZWFjaCByb3cgb2Ygc2VnbWVudCBncm91cGluZ3Ncblx0XHRmb3IgKHJvdyA9IDA7IHJvdyA8IHNlZ1Jvd3MubGVuZ3RoOyByb3crKykge1xuXHRcdFx0cm93U3RydWN0cy5wdXNoKFxuXHRcdFx0XHR0aGlzLnJlbmRlclNlZ1Jvdyhyb3csIHNlZ1Jvd3Nbcm93XSlcblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJvd1N0cnVjdHM7XG5cdH0sXG5cblxuXHQvLyBCdWlsZHMgdGhlIEhUTUwgdG8gYmUgdXNlZCBmb3IgdGhlIGRlZmF1bHQgZWxlbWVudCBmb3IgYW4gaW5kaXZpZHVhbCBzZWdtZW50XG5cdGZnU2VnSHRtbDogZnVuY3Rpb24oc2VnLCBkaXNhYmxlUmVzaXppbmcpIHtcblx0XHR2YXIgdmlldyA9IHRoaXMudmlldztcblx0XHR2YXIgZXZlbnQgPSBzZWcuZXZlbnQ7XG5cdFx0dmFyIGlzRHJhZ2dhYmxlID0gdmlldy5pc0V2ZW50RHJhZ2dhYmxlKGV2ZW50KTtcblx0XHR2YXIgaXNSZXNpemFibGUgPSAhZGlzYWJsZVJlc2l6aW5nICYmIGV2ZW50LmFsbERheSAmJiBzZWcuaXNFbmQgJiYgdmlldy5pc0V2ZW50UmVzaXphYmxlKGV2ZW50KTtcblx0XHR2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0U2VnQ2xhc3NlcyhzZWcsIGlzRHJhZ2dhYmxlLCBpc1Jlc2l6YWJsZSk7XG5cdFx0dmFyIHNraW5Dc3MgPSB0aGlzLmdldEV2ZW50U2tpbkNzcyhldmVudCk7XG5cdFx0dmFyIHRpbWVIdG1sID0gJyc7XG5cdFx0dmFyIHRpdGxlSHRtbDtcblxuXHRcdGNsYXNzZXMudW5zaGlmdCgnZmMtZGF5LWdyaWQtZXZlbnQnKTtcblxuXHRcdC8vIE9ubHkgZGlzcGxheSBhIHRpbWVkIGV2ZW50cyB0aW1lIGlmIGl0IGlzIHRoZSBzdGFydGluZyBzZWdtZW50XG5cdFx0aWYgKCFldmVudC5hbGxEYXkgJiYgc2VnLmlzU3RhcnQpIHtcblx0XHRcdHRpbWVIdG1sID0gJzxzcGFuIGNsYXNzPVwiZmMtdGltZVwiPicgKyBodG1sRXNjYXBlKHRoaXMuZ2V0RXZlbnRUaW1lVGV4dChldmVudCkpICsgJzwvc3Bhbj4nO1xuXHRcdH1cblxuXHRcdHRpdGxlSHRtbCA9XG5cdFx0XHQnPHNwYW4gY2xhc3M9XCJmYy10aXRsZVwiPicgK1xuXHRcdFx0XHQoaHRtbEVzY2FwZShldmVudC50aXRsZSB8fCAnJykgfHwgJyZuYnNwOycpICsgLy8gd2UgYWx3YXlzIHdhbnQgb25lIGxpbmUgb2YgaGVpZ2h0XG5cdFx0XHQnPC9zcGFuPic7XG5cdFx0XG5cdFx0cmV0dXJuICc8YSBjbGFzcz1cIicgKyBjbGFzc2VzLmpvaW4oJyAnKSArICdcIicgK1xuXHRcdFx0XHQoZXZlbnQudXJsID9cblx0XHRcdFx0XHQnIGhyZWY9XCInICsgaHRtbEVzY2FwZShldmVudC51cmwpICsgJ1wiJyA6XG5cdFx0XHRcdFx0Jydcblx0XHRcdFx0XHQpICtcblx0XHRcdFx0KHNraW5Dc3MgP1xuXHRcdFx0XHRcdCcgc3R5bGU9XCInICsgc2tpbkNzcyArICdcIicgOlxuXHRcdFx0XHRcdCcnXG5cdFx0XHRcdFx0KSArXG5cdFx0XHQnPicgK1xuXHRcdFx0XHQnPGRpdiBjbGFzcz1cImZjLWNvbnRlbnRcIj4nICtcblx0XHRcdFx0XHQodGhpcy5pc1JUTCA/XG5cdFx0XHRcdFx0XHR0aXRsZUh0bWwgKyAnICcgKyB0aW1lSHRtbCA6IC8vIHB1dCBhIG5hdHVyYWwgc3BhY2UgaW4gYmV0d2VlblxuXHRcdFx0XHRcdFx0dGltZUh0bWwgKyAnICcgKyB0aXRsZUh0bWwgICAvL1xuXHRcdFx0XHRcdFx0KSArXG5cdFx0XHRcdCc8L2Rpdj4nICtcblx0XHRcdFx0KGlzUmVzaXphYmxlID9cblx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImZjLXJlc2l6ZXJcIi8+JyA6XG5cdFx0XHRcdFx0Jydcblx0XHRcdFx0XHQpICtcblx0XHRcdCc8L2E+Jztcblx0fSxcblxuXG5cdC8vIEdpdmVuIGEgcm93ICMgYW5kIGFuIGFycmF5IG9mIHNlZ21lbnRzIGFsbCBpbiB0aGUgc2FtZSByb3csIHJlbmRlciBhIDx0Ym9keT4gZWxlbWVudCwgYSBza2VsZXRvbiB0aGF0IGNvbnRhaW5zXG5cdC8vIHRoZSBzZWdtZW50cy4gUmV0dXJucyBvYmplY3Qgd2l0aCBhIGJ1bmNoIG9mIGludGVybmFsIGRhdGEgYWJvdXQgaG93IHRoZSByZW5kZXIgd2FzIGNhbGN1bGF0ZWQuXG5cdHJlbmRlclNlZ1JvdzogZnVuY3Rpb24ocm93LCByb3dTZWdzKSB7XG5cdFx0dmFyIGNvbENudCA9IHRoaXMuY29sQ250O1xuXHRcdHZhciBzZWdMZXZlbHMgPSB0aGlzLmJ1aWxkU2VnTGV2ZWxzKHJvd1NlZ3MpOyAvLyBncm91cCBpbnRvIHN1Yi1hcnJheXMgb2YgbGV2ZWxzXG5cdFx0dmFyIGxldmVsQ250ID0gTWF0aC5tYXgoMSwgc2VnTGV2ZWxzLmxlbmd0aCk7IC8vIGVuc3VyZSBhdCBsZWFzdCBvbmUgbGV2ZWxcblx0XHR2YXIgdGJvZHkgPSAkKCc8dGJvZHkvPicpO1xuXHRcdHZhciBzZWdNYXRyaXggPSBbXTsgLy8gbG9va3VwIGZvciB3aGljaCBzZWdtZW50cyBhcmUgcmVuZGVyZWQgaW50byB3aGljaCBsZXZlbCtjb2wgY2VsbHNcblx0XHR2YXIgY2VsbE1hdHJpeCA9IFtdOyAvLyBsb29rdXAgZm9yIGFsbCA8dGQ+IGVsZW1lbnRzIG9mIHRoZSBsZXZlbCtjb2wgbWF0cml4XG5cdFx0dmFyIGxvbmVDZWxsTWF0cml4ID0gW107IC8vIGxvb2t1cCBmb3IgPHRkPiBlbGVtZW50cyB0aGF0IG9ubHkgdGFrZSB1cCBhIHNpbmdsZSBjb2x1bW5cblx0XHR2YXIgaSwgbGV2ZWxTZWdzO1xuXHRcdHZhciBjb2w7XG5cdFx0dmFyIHRyO1xuXHRcdHZhciBqLCBzZWc7XG5cdFx0dmFyIHRkO1xuXG5cdFx0Ly8gcG9wdWxhdGVzIGVtcHR5IGNlbGxzIGZyb20gdGhlIGN1cnJlbnQgY29sdW1uIChgY29sYCkgdG8gYGVuZENvbGBcblx0XHRmdW5jdGlvbiBlbXB0eUNlbGxzVW50aWwoZW5kQ29sKSB7XG5cdFx0XHR3aGlsZSAoY29sIDwgZW5kQ29sKSB7XG5cdFx0XHRcdC8vIHRyeSB0byBncmFiIGEgY2VsbCBmcm9tIHRoZSBsZXZlbCBhYm92ZSBhbmQgZXh0ZW5kIGl0cyByb3dzcGFuLiBvdGhlcndpc2UsIGNyZWF0ZSBhIGZyZXNoIGNlbGxcblx0XHRcdFx0dGQgPSAobG9uZUNlbGxNYXRyaXhbaSAtIDFdIHx8IFtdKVtjb2xdO1xuXHRcdFx0XHRpZiAodGQpIHtcblx0XHRcdFx0XHR0ZC5hdHRyKFxuXHRcdFx0XHRcdFx0J3Jvd3NwYW4nLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQodGQuYXR0cigncm93c3BhbicpIHx8IDEsIDEwKSArIDFcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHRkID0gJCgnPHRkLz4nKTtcblx0XHRcdFx0XHR0ci5hcHBlbmQodGQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNlbGxNYXRyaXhbaV1bY29sXSA9IHRkO1xuXHRcdFx0XHRsb25lQ2VsbE1hdHJpeFtpXVtjb2xdID0gdGQ7XG5cdFx0XHRcdGNvbCsrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsZXZlbENudDsgaSsrKSB7IC8vIGl0ZXJhdGUgdGhyb3VnaCBhbGwgbGV2ZWxzXG5cdFx0XHRsZXZlbFNlZ3MgPSBzZWdMZXZlbHNbaV07XG5cdFx0XHRjb2wgPSAwO1xuXHRcdFx0dHIgPSAkKCc8dHIvPicpO1xuXG5cdFx0XHRzZWdNYXRyaXgucHVzaChbXSk7XG5cdFx0XHRjZWxsTWF0cml4LnB1c2goW10pO1xuXHRcdFx0bG9uZUNlbGxNYXRyaXgucHVzaChbXSk7XG5cblx0XHRcdC8vIGxldmVsQ250IG1pZ2h0IGJlIDEgZXZlbiB0aG91Z2ggdGhlcmUgYXJlIG5vIGFjdHVhbCBsZXZlbHMuIHByb3RlY3QgYWdhaW5zdCB0aGlzLlxuXHRcdFx0Ly8gdGhpcyBzaW5nbGUgZW1wdHkgcm93IGlzIHVzZWZ1bCBmb3Igc3R5bGluZy5cblx0XHRcdGlmIChsZXZlbFNlZ3MpIHtcblx0XHRcdFx0Zm9yIChqID0gMDsgaiA8IGxldmVsU2Vncy5sZW5ndGg7IGorKykgeyAvLyBpdGVyYXRlIHRocm91Z2ggc2VnbWVudHMgaW4gbGV2ZWxcblx0XHRcdFx0XHRzZWcgPSBsZXZlbFNlZ3Nbal07XG5cblx0XHRcdFx0XHRlbXB0eUNlbGxzVW50aWwoc2VnLmxlZnRDb2wpO1xuXG5cdFx0XHRcdFx0Ly8gY3JlYXRlIGEgY29udGFpbmVyIHRoYXQgb2NjdXBpZXMgb3IgbW9yZSBjb2x1bW5zLiBhcHBlbmQgdGhlIGV2ZW50IGVsZW1lbnQuXG5cdFx0XHRcdFx0dGQgPSAkKCc8dGQgY2xhc3M9XCJmYy1ldmVudC1jb250YWluZXJcIi8+JykuYXBwZW5kKHNlZy5lbCk7XG5cdFx0XHRcdFx0aWYgKHNlZy5sZWZ0Q29sICE9IHNlZy5yaWdodENvbCkge1xuXHRcdFx0XHRcdFx0dGQuYXR0cignY29sc3BhbicsIHNlZy5yaWdodENvbCAtIHNlZy5sZWZ0Q29sICsgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgeyAvLyBhIHNpbmdsZS1jb2x1bW4gc2VnbWVudFxuXHRcdFx0XHRcdFx0bG9uZUNlbGxNYXRyaXhbaV1bY29sXSA9IHRkO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHdoaWxlIChjb2wgPD0gc2VnLnJpZ2h0Q29sKSB7XG5cdFx0XHRcdFx0XHRjZWxsTWF0cml4W2ldW2NvbF0gPSB0ZDtcblx0XHRcdFx0XHRcdHNlZ01hdHJpeFtpXVtjb2xdID0gc2VnO1xuXHRcdFx0XHRcdFx0Y29sKys7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dHIuYXBwZW5kKHRkKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRlbXB0eUNlbGxzVW50aWwoY29sQ250KTsgLy8gZmluaXNoIG9mZiB0aGUgcm93XG5cdFx0XHR0aGlzLmJvb2tlbmRDZWxscyh0ciwgJ2V2ZW50U2tlbGV0b24nKTtcblx0XHRcdHRib2R5LmFwcGVuZCh0cik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgLy8gYSBcInJvd1N0cnVjdFwiXG5cdFx0XHRyb3c6IHJvdywgLy8gdGhlIHJvdyBudW1iZXJcblx0XHRcdHRib2R5RWw6IHRib2R5LFxuXHRcdFx0Y2VsbE1hdHJpeDogY2VsbE1hdHJpeCxcblx0XHRcdHNlZ01hdHJpeDogc2VnTWF0cml4LFxuXHRcdFx0c2VnTGV2ZWxzOiBzZWdMZXZlbHMsXG5cdFx0XHRzZWdzOiByb3dTZWdzXG5cdFx0fTtcblx0fSxcblxuXG5cdC8vIFN0YWNrcyBhIGZsYXQgYXJyYXkgb2Ygc2VnbWVudHMsIHdoaWNoIGFyZSBhbGwgYXNzdW1lZCB0byBiZSBpbiB0aGUgc2FtZSByb3csIGludG8gc3ViYXJyYXlzIG9mIHZlcnRpY2FsIGxldmVscy5cblx0YnVpbGRTZWdMZXZlbHM6IGZ1bmN0aW9uKHNlZ3MpIHtcblx0XHR2YXIgbGV2ZWxzID0gW107XG5cdFx0dmFyIGksIHNlZztcblx0XHR2YXIgajtcblxuXHRcdC8vIEdpdmUgcHJlZmVyZW5jZSB0byBlbGVtZW50cyB3aXRoIGNlcnRhaW4gY3JpdGVyaWEsIHNvIHRoZXkgaGF2ZVxuXHRcdC8vIGEgY2hhbmNlIHRvIGJlIGNsb3NlciB0byB0aGUgdG9wLlxuXHRcdHNlZ3Muc29ydChjb21wYXJlU2Vncyk7XG5cdFx0XG5cdFx0Zm9yIChpID0gMDsgaSA8IHNlZ3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdHNlZyA9IHNlZ3NbaV07XG5cblx0XHRcdC8vIGxvb3AgdGhyb3VnaCBsZXZlbHMsIHN0YXJ0aW5nIHdpdGggdGhlIHRvcG1vc3QsIHVudGlsIHRoZSBzZWdtZW50IGRvZXNuJ3QgY29sbGlkZSB3aXRoIG90aGVyIHNlZ21lbnRzXG5cdFx0XHRmb3IgKGogPSAwOyBqIDwgbGV2ZWxzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmICghaXNEYXlTZWdDb2xsaXNpb24oc2VnLCBsZXZlbHNbal0pKSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdC8vIGBqYCBub3cgaG9sZHMgdGhlIGRlc2lyZWQgc3Vicm93IGluZGV4XG5cdFx0XHRzZWcubGV2ZWwgPSBqO1xuXG5cdFx0XHQvLyBjcmVhdGUgbmV3IGxldmVsIGFycmF5IGlmIG5lZWRlZCBhbmQgYXBwZW5kIHNlZ21lbnRcblx0XHRcdChsZXZlbHNbal0gfHwgKGxldmVsc1tqXSA9IFtdKSkucHVzaChzZWcpO1xuXHRcdH1cblxuXHRcdC8vIG9yZGVyIHNlZ21lbnRzIGxlZnQtdG8tcmlnaHQuIHZlcnkgaW1wb3J0YW50IGlmIGNhbGVuZGFyIGlzIFJUTFxuXHRcdGZvciAoaiA9IDA7IGogPCBsZXZlbHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdGxldmVsc1tqXS5zb3J0KGNvbXBhcmVEYXlTZWdDb2xzKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbGV2ZWxzO1xuXHR9LFxuXG5cblx0Ly8gR2l2ZW4gYSBmbGF0IGFycmF5IG9mIHNlZ21lbnRzLCByZXR1cm4gYW4gYXJyYXkgb2Ygc3ViLWFycmF5cywgZ3JvdXBlZCBieSBlYWNoIHNlZ21lbnQncyByb3dcblx0Z3JvdXBTZWdSb3dzOiBmdW5jdGlvbihzZWdzKSB7XG5cdFx0dmFyIHNlZ1Jvd3MgPSBbXTtcblx0XHR2YXIgaTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCB0aGlzLnJvd0NudDsgaSsrKSB7XG5cdFx0XHRzZWdSb3dzLnB1c2goW10pO1xuXHRcdH1cblxuXHRcdGZvciAoaSA9IDA7IGkgPCBzZWdzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRzZWdSb3dzW3NlZ3NbaV0ucm93XS5wdXNoKHNlZ3NbaV0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBzZWdSb3dzO1xuXHR9XG5cbn0pO1xuXG5cbi8vIENvbXB1dGVzIHdoZXRoZXIgdHdvIHNlZ21lbnRzJyBjb2x1bW5zIGNvbGxpZGUuIFRoZXkgYXJlIGFzc3VtZWQgdG8gYmUgaW4gdGhlIHNhbWUgcm93LlxuZnVuY3Rpb24gaXNEYXlTZWdDb2xsaXNpb24oc2VnLCBvdGhlclNlZ3MpIHtcblx0dmFyIGksIG90aGVyU2VnO1xuXG5cdGZvciAoaSA9IDA7IGkgPCBvdGhlclNlZ3MubGVuZ3RoOyBpKyspIHtcblx0XHRvdGhlclNlZyA9IG90aGVyU2Vnc1tpXTtcblxuXHRcdGlmIChcblx0XHRcdG90aGVyU2VnLmxlZnRDb2wgPD0gc2VnLnJpZ2h0Q29sICYmXG5cdFx0XHRvdGhlclNlZy5yaWdodENvbCA+PSBzZWcubGVmdENvbFxuXHRcdCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufVxuXG5cbi8vIEEgY21wIGZ1bmN0aW9uIGZvciBkZXRlcm1pbmluZyB0aGUgbGVmdG1vc3QgZXZlbnRcbmZ1bmN0aW9uIGNvbXBhcmVEYXlTZWdDb2xzKGEsIGIpIHtcblx0cmV0dXJuIGEubGVmdENvbCAtIGIubGVmdENvbDtcbn1cblxuICAgIC8qIE1ldGhvZHMgcmVsYXRlIHRvIGxpbWl0aW5nIHRoZSBudW1iZXIgZXZlbnRzIGZvciBhIGdpdmVuIGRheSBvbiBhIERheUdyaWRcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuLy8gTk9URTogYWxsIHRoZSBzZWdzIGJlaW5nIHBhc3NlZCBhcm91bmQgaW4gaGVyZSBhcmUgZm9yZWdyb3VuZCBzZWdzXG5cbkRheUdyaWQubWl4aW4oe1xuXG5cdHNlZ1BvcG92ZXI6IG51bGwsIC8vIHRoZSBQb3BvdmVyIHRoYXQgaG9sZHMgZXZlbnRzIHRoYXQgY2FuJ3QgZml0IGluIGEgY2VsbC4gbnVsbCB3aGVuIG5vdCB2aXNpYmxlXG5cdHBvcG92ZXJTZWdzOiBudWxsLCAvLyBhbiBhcnJheSBvZiBzZWdtZW50IG9iamVjdHMgdGhhdCB0aGUgc2VnUG9wb3ZlciBob2xkcy4gbnVsbCB3aGVuIG5vdCB2aXNpYmxlXG5cblxuXHRkZXN0cm95U2VnUG9wb3ZlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuc2VnUG9wb3Zlcikge1xuXHRcdFx0dGhpcy5zZWdQb3BvdmVyLmhpZGUoKTsgLy8gd2lsbCB0cmlnZ2VyIGRlc3RydWN0aW9uIG9mIGBzZWdQb3BvdmVyYCBhbmQgYHBvcG92ZXJTZWdzYFxuXHRcdH1cblx0fSxcblxuXG5cdC8vIExpbWl0cyB0aGUgbnVtYmVyIG9mIFwibGV2ZWxzXCIgKHZlcnRpY2FsbHkgc3RhY2tpbmcgbGF5ZXJzIG9mIGV2ZW50cykgZm9yIGVhY2ggcm93IG9mIHRoZSBncmlkLlxuXHQvLyBgbGV2ZWxMaW1pdGAgY2FuIGJlIGZhbHNlIChkb24ndCBsaW1pdCksIGEgbnVtYmVyLCBvciB0cnVlIChzaG91bGQgYmUgY29tcHV0ZWQpLlxuXHRsaW1pdFJvd3M6IGZ1bmN0aW9uKGxldmVsTGltaXQpIHtcblx0XHR2YXIgcm93U3RydWN0cyA9IHRoaXMucm93U3RydWN0cyB8fCBbXTtcblx0XHR2YXIgcm93OyAvLyByb3cgI1xuXHRcdHZhciByb3dMZXZlbExpbWl0O1xuXG5cdFx0Zm9yIChyb3cgPSAwOyByb3cgPCByb3dTdHJ1Y3RzLmxlbmd0aDsgcm93KyspIHtcblx0XHRcdHRoaXMudW5saW1pdFJvdyhyb3cpO1xuXG5cdFx0XHRpZiAoIWxldmVsTGltaXQpIHtcblx0XHRcdFx0cm93TGV2ZWxMaW1pdCA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAodHlwZW9mIGxldmVsTGltaXQgPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdHJvd0xldmVsTGltaXQgPSBsZXZlbExpbWl0O1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHJvd0xldmVsTGltaXQgPSB0aGlzLmNvbXB1dGVSb3dMZXZlbExpbWl0KHJvdyk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChyb3dMZXZlbExpbWl0ICE9PSBmYWxzZSkge1xuXHRcdFx0XHR0aGlzLmxpbWl0Um93KHJvdywgcm93TGV2ZWxMaW1pdCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gQ29tcHV0ZXMgdGhlIG51bWJlciBvZiBsZXZlbHMgYSByb3cgd2lsbCBhY2NvbW9kYXRlIHdpdGhvdXQgZ29pbmcgb3V0c2lkZSBpdHMgYm91bmRzLlxuXHQvLyBBc3N1bWVzIHRoZSByb3cgaXMgXCJyaWdpZFwiIChtYWludGFpbnMgYSBjb25zdGFudCBoZWlnaHQgcmVnYXJkbGVzcyBvZiB3aGF0IGlzIGluc2lkZSkuXG5cdC8vIGByb3dgIGlzIHRoZSByb3cgbnVtYmVyLlxuXHRjb21wdXRlUm93TGV2ZWxMaW1pdDogZnVuY3Rpb24ocm93KSB7XG5cdFx0dmFyIHJvd0VsID0gdGhpcy5yb3dFbHMuZXEocm93KTsgLy8gdGhlIGNvbnRhaW5pbmcgXCJmYWtlXCIgcm93IGRpdlxuXHRcdHZhciByb3dIZWlnaHQgPSByb3dFbC5oZWlnaHQoKTsgLy8gVE9ETzogY2FjaGUgc29tZWhvdz9cblx0XHR2YXIgdHJFbHMgPSB0aGlzLnJvd1N0cnVjdHNbcm93XS50Ym9keUVsLmNoaWxkcmVuKCk7XG5cdFx0dmFyIGksIHRyRWw7XG5cblx0XHQvLyBSZXZlYWwgb25lIGxldmVsIDx0cj4gYXQgYSB0aW1lIGFuZCBzdG9wIHdoZW4gd2UgZmluZCBvbmUgb3V0IG9mIGJvdW5kc1xuXHRcdGZvciAoaSA9IDA7IGkgPCB0ckVscy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dHJFbCA9IHRyRWxzLmVxKGkpLnJlbW92ZUNsYXNzKCdmYy1saW1pdGVkJyk7IC8vIGdldCBhbmQgcmV2ZWFsXG5cdFx0XHRpZiAodHJFbC5wb3NpdGlvbigpLnRvcCArIHRyRWwub3V0ZXJIZWlnaHQoKSA+IHJvd0hlaWdodCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7IC8vIHNob3VsZCBub3QgbGltaXQgYXQgYWxsXG5cdH0sXG5cblxuXHQvLyBMaW1pdHMgdGhlIGdpdmVuIGdyaWQgcm93IHRvIHRoZSBtYXhpbXVtIG51bWJlciBvZiBsZXZlbHMgYW5kIGluamVjdHMgXCJtb3JlXCIgbGlua3MgaWYgbmVjZXNzYXJ5LlxuXHQvLyBgcm93YCBpcyB0aGUgcm93IG51bWJlci5cblx0Ly8gYGxldmVsTGltaXRgIGlzIGEgbnVtYmVyIGZvciB0aGUgbWF4aW11bSAoaW5jbHVzaXZlKSBudW1iZXIgb2YgbGV2ZWxzIGFsbG93ZWQuXG5cdGxpbWl0Um93OiBmdW5jdGlvbihyb3csIGxldmVsTGltaXQpIHtcblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXHRcdHZhciByb3dTdHJ1Y3QgPSB0aGlzLnJvd1N0cnVjdHNbcm93XTtcblx0XHR2YXIgbW9yZU5vZGVzID0gW107IC8vIGFycmF5IG9mIFwibW9yZVwiIDxhPiBsaW5rcyBhbmQgPHRkPiBET00gbm9kZXNcblx0XHR2YXIgY29sID0gMDsgLy8gY29sICMsIGxlZnQtdG8tcmlnaHQgKG5vdCBjaHJvbm9sb2dpY2FsbHkpXG5cdFx0dmFyIGNlbGw7XG5cdFx0dmFyIGxldmVsU2VnczsgLy8gYXJyYXkgb2Ygc2VnbWVudCBvYmplY3RzIGluIHRoZSBsYXN0IGFsbG93YWJsZSBsZXZlbCwgb3JkZXJlZCBsZWZ0LXRvLXJpZ2h0XG5cdFx0dmFyIGNlbGxNYXRyaXg7IC8vIGEgbWF0cml4IChieSBsZXZlbCwgdGhlbiBjb2x1bW4pIG9mIGFsbCA8dGQ+IGpRdWVyeSBlbGVtZW50cyBpbiB0aGUgcm93XG5cdFx0dmFyIGxpbWl0ZWROb2RlczsgLy8gYXJyYXkgb2YgdGVtcG9yYXJpbHkgaGlkZGVuIGxldmVsIDx0cj4gYW5kIHNlZ21lbnQgPHRkPiBET00gbm9kZXNcblx0XHR2YXIgaSwgc2VnO1xuXHRcdHZhciBzZWdzQmVsb3c7IC8vIGFycmF5IG9mIHNlZ21lbnQgb2JqZWN0cyBiZWxvdyBgc2VnYCBpbiB0aGUgY3VycmVudCBgY29sYFxuXHRcdHZhciB0b3RhbFNlZ3NCZWxvdzsgLy8gdG90YWwgbnVtYmVyIG9mIHNlZ21lbnRzIGJlbG93IGBzZWdgIGluIGFueSBvZiB0aGUgY29sdW1ucyBgc2VnYCBvY2N1cGllc1xuXHRcdHZhciBjb2xTZWdzQmVsb3c7IC8vIGFycmF5IG9mIHNlZ21lbnQgYXJyYXlzLCBiZWxvdyBzZWcsIG9uZSBmb3IgZWFjaCBjb2x1bW4gKG9mZnNldCBmcm9tIHNlZ3MncyBmaXJzdCBjb2x1bW4pXG5cdFx0dmFyIHRkLCByb3dzcGFuO1xuXHRcdHZhciBzZWdNb3JlTm9kZXM7IC8vIGFycmF5IG9mIFwibW9yZVwiIDx0ZD4gY2VsbHMgdGhhdCB3aWxsIHN0YW5kLWluIGZvciB0aGUgY3VycmVudCBzZWcncyBjZWxsXG5cdFx0dmFyIGo7XG5cdFx0dmFyIG1vcmVUZCwgbW9yZVdyYXAsIG1vcmVMaW5rO1xuXG5cdFx0Ly8gSXRlcmF0ZXMgdGhyb3VnaCBlbXB0eSBsZXZlbCBjZWxscyBhbmQgcGxhY2VzIFwibW9yZVwiIGxpbmtzIGluc2lkZSBpZiBuZWVkIGJlXG5cdFx0ZnVuY3Rpb24gZW1wdHlDZWxsc1VudGlsKGVuZENvbCkgeyAvLyBnb2VzIGZyb20gY3VycmVudCBgY29sYCB0byBgZW5kQ29sYFxuXHRcdFx0d2hpbGUgKGNvbCA8IGVuZENvbCkge1xuXHRcdFx0XHRjZWxsID0gX3RoaXMuZ2V0Q2VsbChyb3csIGNvbCk7XG5cdFx0XHRcdHNlZ3NCZWxvdyA9IF90aGlzLmdldENlbGxTZWdzKGNlbGwsIGxldmVsTGltaXQpO1xuXHRcdFx0XHRpZiAoc2Vnc0JlbG93Lmxlbmd0aCkge1xuXHRcdFx0XHRcdHRkID0gY2VsbE1hdHJpeFtsZXZlbExpbWl0IC0gMV1bY29sXTtcblx0XHRcdFx0XHRtb3JlTGluayA9IF90aGlzLnJlbmRlck1vcmVMaW5rKGNlbGwsIHNlZ3NCZWxvdyk7XG5cdFx0XHRcdFx0bW9yZVdyYXAgPSAkKCc8ZGl2Lz4nKS5hcHBlbmQobW9yZUxpbmspO1xuXHRcdFx0XHRcdHRkLmFwcGVuZChtb3JlV3JhcCk7XG5cdFx0XHRcdFx0bW9yZU5vZGVzLnB1c2gobW9yZVdyYXBbMF0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbCsrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChsZXZlbExpbWl0ICYmIGxldmVsTGltaXQgPCByb3dTdHJ1Y3Quc2VnTGV2ZWxzLmxlbmd0aCkgeyAvLyBpcyBpdCBhY3R1YWxseSBvdmVyIHRoZSBsaW1pdD9cblx0XHRcdGxldmVsU2VncyA9IHJvd1N0cnVjdC5zZWdMZXZlbHNbbGV2ZWxMaW1pdCAtIDFdO1xuXHRcdFx0Y2VsbE1hdHJpeCA9IHJvd1N0cnVjdC5jZWxsTWF0cml4O1xuXG5cdFx0XHRsaW1pdGVkTm9kZXMgPSByb3dTdHJ1Y3QudGJvZHlFbC5jaGlsZHJlbigpLnNsaWNlKGxldmVsTGltaXQpIC8vIGdldCBsZXZlbCA8dHI+IGVsZW1lbnRzIHBhc3QgdGhlIGxpbWl0XG5cdFx0XHRcdC5hZGRDbGFzcygnZmMtbGltaXRlZCcpLmdldCgpOyAvLyBoaWRlIGVsZW1lbnRzIGFuZCBnZXQgYSBzaW1wbGUgRE9NLW5vZGVzIGFycmF5XG5cblx0XHRcdC8vIGl0ZXJhdGUgdGhvdWdoIHNlZ21lbnRzIGluIHRoZSBsYXN0IGFsbG93YWJsZSBsZXZlbFxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGxldmVsU2Vncy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRzZWcgPSBsZXZlbFNlZ3NbaV07XG5cdFx0XHRcdGVtcHR5Q2VsbHNVbnRpbChzZWcubGVmdENvbCk7IC8vIHByb2Nlc3MgZW1wdHkgY2VsbHMgYmVmb3JlIHRoZSBzZWdtZW50XG5cblx0XHRcdFx0Ly8gZGV0ZXJtaW5lICphbGwqIHNlZ21lbnRzIGJlbG93IGBzZWdgIHRoYXQgb2NjdXB5IHRoZSBzYW1lIGNvbHVtbnNcblx0XHRcdFx0Y29sU2Vnc0JlbG93ID0gW107XG5cdFx0XHRcdHRvdGFsU2Vnc0JlbG93ID0gMDtcblx0XHRcdFx0d2hpbGUgKGNvbCA8PSBzZWcucmlnaHRDb2wpIHtcblx0XHRcdFx0XHRjZWxsID0gdGhpcy5nZXRDZWxsKHJvdywgY29sKTtcblx0XHRcdFx0XHRzZWdzQmVsb3cgPSB0aGlzLmdldENlbGxTZWdzKGNlbGwsIGxldmVsTGltaXQpO1xuXHRcdFx0XHRcdGNvbFNlZ3NCZWxvdy5wdXNoKHNlZ3NCZWxvdyk7XG5cdFx0XHRcdFx0dG90YWxTZWdzQmVsb3cgKz0gc2Vnc0JlbG93Lmxlbmd0aDtcblx0XHRcdFx0XHRjb2wrKztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0b3RhbFNlZ3NCZWxvdykgeyAvLyBkbyB3ZSBuZWVkIHRvIHJlcGxhY2UgdGhpcyBzZWdtZW50IHdpdGggb25lIG9yIG1hbnkgXCJtb3JlXCIgbGlua3M/XG5cdFx0XHRcdFx0dGQgPSBjZWxsTWF0cml4W2xldmVsTGltaXQgLSAxXVtzZWcubGVmdENvbF07IC8vIHRoZSBzZWdtZW50J3MgcGFyZW50IGNlbGxcblx0XHRcdFx0XHRyb3dzcGFuID0gdGQuYXR0cigncm93c3BhbicpIHx8IDE7XG5cdFx0XHRcdFx0c2VnTW9yZU5vZGVzID0gW107XG5cblx0XHRcdFx0XHQvLyBtYWtlIGEgcmVwbGFjZW1lbnQgPHRkPiBmb3IgZWFjaCBjb2x1bW4gdGhlIHNlZ21lbnQgb2NjdXBpZXMuIHdpbGwgYmUgb25lIGZvciBlYWNoIGNvbHNwYW5cblx0XHRcdFx0XHRmb3IgKGogPSAwOyBqIDwgY29sU2Vnc0JlbG93Lmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0XHRtb3JlVGQgPSAkKCc8dGQgY2xhc3M9XCJmYy1tb3JlLWNlbGxcIi8+JykuYXR0cigncm93c3BhbicsIHJvd3NwYW4pO1xuXHRcdFx0XHRcdFx0c2Vnc0JlbG93ID0gY29sU2Vnc0JlbG93W2pdO1xuXHRcdFx0XHRcdFx0Y2VsbCA9IHRoaXMuZ2V0Q2VsbChyb3csIHNlZy5sZWZ0Q29sICsgaik7XG5cdFx0XHRcdFx0XHRtb3JlTGluayA9IHRoaXMucmVuZGVyTW9yZUxpbmsoY2VsbCwgWyBzZWcgXS5jb25jYXQoc2Vnc0JlbG93KSk7IC8vIGNvdW50IHNlZyBhcyBoaWRkZW4gdG9vXG5cdFx0XHRcdFx0XHRtb3JlV3JhcCA9ICQoJzxkaXYvPicpLmFwcGVuZChtb3JlTGluayk7XG5cdFx0XHRcdFx0XHRtb3JlVGQuYXBwZW5kKG1vcmVXcmFwKTtcblx0XHRcdFx0XHRcdHNlZ01vcmVOb2Rlcy5wdXNoKG1vcmVUZFswXSk7XG5cdFx0XHRcdFx0XHRtb3JlTm9kZXMucHVzaChtb3JlVGRbMF0pO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRkLmFkZENsYXNzKCdmYy1saW1pdGVkJykuYWZ0ZXIoJChzZWdNb3JlTm9kZXMpKTsgLy8gaGlkZSBvcmlnaW5hbCA8dGQ+IGFuZCBpbmplY3QgcmVwbGFjZW1lbnRzXG5cdFx0XHRcdFx0bGltaXRlZE5vZGVzLnB1c2godGRbMF0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGVtcHR5Q2VsbHNVbnRpbCh0aGlzLmNvbENudCk7IC8vIGZpbmlzaCBvZmYgdGhlIGxldmVsXG5cdFx0XHRyb3dTdHJ1Y3QubW9yZUVscyA9ICQobW9yZU5vZGVzKTsgLy8gZm9yIGVhc3kgdW5kb2luZyBsYXRlclxuXHRcdFx0cm93U3RydWN0LmxpbWl0ZWRFbHMgPSAkKGxpbWl0ZWROb2Rlcyk7IC8vIGZvciBlYXN5IHVuZG9pbmcgbGF0ZXJcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBSZXZlYWxzIGFsbCBsZXZlbHMgYW5kIHJlbW92ZXMgYWxsIFwibW9yZVwiLXJlbGF0ZWQgZWxlbWVudHMgZm9yIGEgZ3JpZCdzIHJvdy5cblx0Ly8gYHJvd2AgaXMgYSByb3cgbnVtYmVyLlxuXHR1bmxpbWl0Um93OiBmdW5jdGlvbihyb3cpIHtcblx0XHR2YXIgcm93U3RydWN0ID0gdGhpcy5yb3dTdHJ1Y3RzW3Jvd107XG5cblx0XHRpZiAocm93U3RydWN0Lm1vcmVFbHMpIHtcblx0XHRcdHJvd1N0cnVjdC5tb3JlRWxzLnJlbW92ZSgpO1xuXHRcdFx0cm93U3RydWN0Lm1vcmVFbHMgPSBudWxsO1xuXHRcdH1cblxuXHRcdGlmIChyb3dTdHJ1Y3QubGltaXRlZEVscykge1xuXHRcdFx0cm93U3RydWN0LmxpbWl0ZWRFbHMucmVtb3ZlQ2xhc3MoJ2ZjLWxpbWl0ZWQnKTtcblx0XHRcdHJvd1N0cnVjdC5saW1pdGVkRWxzID0gbnVsbDtcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBSZW5kZXJzIGFuIDxhPiBlbGVtZW50IHRoYXQgcmVwcmVzZW50cyBoaWRkZW4gZXZlbnQgZWxlbWVudCBmb3IgYSBjZWxsLlxuXHQvLyBSZXNwb25zaWJsZSBmb3IgYXR0YWNoaW5nIGNsaWNrIGhhbmRsZXIgYXMgd2VsbC5cblx0cmVuZGVyTW9yZUxpbms6IGZ1bmN0aW9uKGNlbGwsIGhpZGRlblNlZ3MpIHtcblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXHRcdHZhciB2aWV3ID0gdGhpcy52aWV3O1xuXG5cdFx0cmV0dXJuICQoJzxhIGNsYXNzPVwiZmMtbW9yZVwiLz4nKVxuXHRcdFx0LnRleHQoXG5cdFx0XHRcdHRoaXMuZ2V0TW9yZUxpbmtUZXh0KGhpZGRlblNlZ3MubGVuZ3RoKVxuXHRcdFx0KVxuXHRcdFx0Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdHZhciBjbGlja09wdGlvbiA9IHZpZXcub3B0KCdldmVudExpbWl0Q2xpY2snKTtcblx0XHRcdFx0dmFyIGRhdGUgPSBjZWxsLnN0YXJ0O1xuXHRcdFx0XHR2YXIgbW9yZUVsID0gJCh0aGlzKTtcblx0XHRcdFx0dmFyIGRheUVsID0gX3RoaXMuZ2V0Q2VsbERheUVsKGNlbGwpO1xuXHRcdFx0XHR2YXIgYWxsU2VncyA9IF90aGlzLmdldENlbGxTZWdzKGNlbGwpO1xuXG5cdFx0XHRcdC8vIHJlc2NvcGUgdGhlIHNlZ21lbnRzIHRvIGJlIHdpdGhpbiB0aGUgY2VsbCdzIGRhdGVcblx0XHRcdFx0dmFyIHJlc2xpY2VkQWxsU2VncyA9IF90aGlzLnJlc2xpY2VEYXlTZWdzKGFsbFNlZ3MsIGRhdGUpO1xuXHRcdFx0XHR2YXIgcmVzbGljZWRIaWRkZW5TZWdzID0gX3RoaXMucmVzbGljZURheVNlZ3MoaGlkZGVuU2VncywgZGF0ZSk7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBjbGlja09wdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdC8vIHRoZSByZXR1cm5lZCB2YWx1ZSBjYW4gYmUgYW4gYXRvbWljIG9wdGlvblxuXHRcdFx0XHRcdGNsaWNrT3B0aW9uID0gdmlldy50cmlnZ2VyKCdldmVudExpbWl0Q2xpY2snLCBudWxsLCB7XG5cdFx0XHRcdFx0XHRkYXRlOiBkYXRlLFxuXHRcdFx0XHRcdFx0ZGF5RWw6IGRheUVsLFxuXHRcdFx0XHRcdFx0bW9yZUVsOiBtb3JlRWwsXG5cdFx0XHRcdFx0XHRzZWdzOiByZXNsaWNlZEFsbFNlZ3MsXG5cdFx0XHRcdFx0XHRoaWRkZW5TZWdzOiByZXNsaWNlZEhpZGRlblNlZ3Ncblx0XHRcdFx0XHR9LCBldik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY2xpY2tPcHRpb24gPT09ICdwb3BvdmVyJykge1xuXHRcdFx0XHRcdF90aGlzLnNob3dTZWdQb3BvdmVyKGNlbGwsIG1vcmVFbCwgcmVzbGljZWRBbGxTZWdzKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICh0eXBlb2YgY2xpY2tPcHRpb24gPT09ICdzdHJpbmcnKSB7IC8vIGEgdmlldyBuYW1lXG5cdFx0XHRcdFx0dmlldy5jYWxlbmRhci56b29tVG8oZGF0ZSwgY2xpY2tPcHRpb24pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0fSxcblxuXG5cdC8vIFJldmVhbHMgdGhlIHBvcG92ZXIgdGhhdCBkaXNwbGF5cyBhbGwgZXZlbnRzIHdpdGhpbiBhIGNlbGxcblx0c2hvd1NlZ1BvcG92ZXI6IGZ1bmN0aW9uKGNlbGwsIG1vcmVMaW5rLCBzZWdzKSB7XG5cdFx0dmFyIF90aGlzID0gdGhpcztcblx0XHR2YXIgdmlldyA9IHRoaXMudmlldztcblx0XHR2YXIgbW9yZVdyYXAgPSBtb3JlTGluay5wYXJlbnQoKTsgLy8gdGhlIDxkaXY+IHdyYXBwZXIgYXJvdW5kIHRoZSA8YT5cblx0XHR2YXIgdG9wRWw7IC8vIHRoZSBlbGVtZW50IHdlIHdhbnQgdG8gbWF0Y2ggdGhlIHRvcCBjb29yZGluYXRlIG9mXG5cdFx0dmFyIG9wdGlvbnM7XG5cblx0XHRpZiAodGhpcy5yb3dDbnQgPT0gMSkge1xuXHRcdFx0dG9wRWwgPSB2aWV3LmVsOyAvLyB3aWxsIGNhdXNlIHRoZSBwb3BvdmVyIHRvIGNvdmVyIGFueSBzb3J0IG9mIGhlYWRlclxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRvcEVsID0gdGhpcy5yb3dFbHMuZXEoY2VsbC5yb3cpOyAvLyB3aWxsIGFsaWduIHdpdGggdG9wIG9mIHJvd1xuXHRcdH1cblxuXHRcdG9wdGlvbnMgPSB7XG5cdFx0XHRjbGFzc05hbWU6ICdmYy1tb3JlLXBvcG92ZXInLFxuXHRcdFx0Y29udGVudDogdGhpcy5yZW5kZXJTZWdQb3BvdmVyQ29udGVudChjZWxsLCBzZWdzKSxcblx0XHRcdHBhcmVudEVsOiB0aGlzLmVsLFxuXHRcdFx0dG9wOiB0b3BFbC5vZmZzZXQoKS50b3AsXG5cdFx0XHRhdXRvSGlkZTogdHJ1ZSwgLy8gd2hlbiB0aGUgdXNlciBjbGlja3MgZWxzZXdoZXJlLCBoaWRlIHRoZSBwb3BvdmVyXG5cdFx0XHR2aWV3cG9ydENvbnN0cmFpbjogdmlldy5vcHQoJ3BvcG92ZXJWaWV3cG9ydENvbnN0cmFpbicpLFxuXHRcdFx0aGlkZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vIGRlc3Ryb3kgZXZlcnl0aGluZyB3aGVuIHRoZSBwb3BvdmVyIGlzIGhpZGRlblxuXHRcdFx0XHRfdGhpcy5zZWdQb3BvdmVyLmRlc3Ryb3koKTtcblx0XHRcdFx0X3RoaXMuc2VnUG9wb3ZlciA9IG51bGw7XG5cdFx0XHRcdF90aGlzLnBvcG92ZXJTZWdzID0gbnVsbDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gRGV0ZXJtaW5lIGhvcml6b250YWwgY29vcmRpbmF0ZS5cblx0XHQvLyBXZSB1c2UgdGhlIG1vcmVXcmFwIGluc3RlYWQgb2YgdGhlIDx0ZD4gdG8gYXZvaWQgYm9yZGVyIGNvbmZ1c2lvbi5cblx0XHRpZiAodGhpcy5pc1JUTCkge1xuXHRcdFx0b3B0aW9ucy5yaWdodCA9IG1vcmVXcmFwLm9mZnNldCgpLmxlZnQgKyBtb3JlV3JhcC5vdXRlcldpZHRoKCkgKyAxOyAvLyArMSB0byBiZSBvdmVyIGNlbGwgYm9yZGVyXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0b3B0aW9ucy5sZWZ0ID0gbW9yZVdyYXAub2Zmc2V0KCkubGVmdCAtIDE7IC8vIC0xIHRvIGJlIG92ZXIgY2VsbCBib3JkZXJcblx0XHR9XG5cblx0XHR0aGlzLnNlZ1BvcG92ZXIgPSBuZXcgUG9wb3ZlcihvcHRpb25zKTtcblx0XHR0aGlzLnNlZ1BvcG92ZXIuc2hvdygpO1xuXHR9LFxuXG5cblx0Ly8gQnVpbGRzIHRoZSBpbm5lciBET00gY29udGVudHMgb2YgdGhlIHNlZ21lbnQgcG9wb3ZlclxuXHRyZW5kZXJTZWdQb3BvdmVyQ29udGVudDogZnVuY3Rpb24oY2VsbCwgc2Vncykge1xuXHRcdHZhciB2aWV3ID0gdGhpcy52aWV3O1xuXHRcdHZhciBpc1RoZW1lID0gdmlldy5vcHQoJ3RoZW1lJyk7XG5cdFx0dmFyIHRpdGxlID0gY2VsbC5zdGFydC5mb3JtYXQodmlldy5vcHQoJ2RheVBvcG92ZXJGb3JtYXQnKSk7XG5cdFx0dmFyIGNvbnRlbnQgPSAkKFxuXHRcdFx0JzxkaXYgY2xhc3M9XCJmYy1oZWFkZXIgJyArIHZpZXcud2lkZ2V0SGVhZGVyQ2xhc3MgKyAnXCI+JyArXG5cdFx0XHRcdCc8c3BhbiBjbGFzcz1cImZjLWNsb3NlICcgK1xuXHRcdFx0XHRcdChpc1RoZW1lID8gJ3VpLWljb24gdWktaWNvbi1jbG9zZXRoaWNrJyA6ICdmYy1pY29uIGZjLWljb24teCcpICtcblx0XHRcdFx0J1wiPjwvc3Bhbj4nICtcblx0XHRcdFx0JzxzcGFuIGNsYXNzPVwiZmMtdGl0bGVcIj4nICtcblx0XHRcdFx0XHRodG1sRXNjYXBlKHRpdGxlKSArXG5cdFx0XHRcdCc8L3NwYW4+JyArXG5cdFx0XHRcdCc8ZGl2IGNsYXNzPVwiZmMtY2xlYXJcIi8+JyArXG5cdFx0XHQnPC9kaXY+JyArXG5cdFx0XHQnPGRpdiBjbGFzcz1cImZjLWJvZHkgJyArIHZpZXcud2lkZ2V0Q29udGVudENsYXNzICsgJ1wiPicgK1xuXHRcdFx0XHQnPGRpdiBjbGFzcz1cImZjLWV2ZW50LWNvbnRhaW5lclwiPjwvZGl2PicgK1xuXHRcdFx0JzwvZGl2Pidcblx0XHQpO1xuXHRcdHZhciBzZWdDb250YWluZXIgPSBjb250ZW50LmZpbmQoJy5mYy1ldmVudC1jb250YWluZXInKTtcblx0XHR2YXIgaTtcblxuXHRcdC8vIHJlbmRlciBlYWNoIHNlZydzIGBlbGAgYW5kIG9ubHkgcmV0dXJuIHRoZSB2aXNpYmxlIHNlZ3Ncblx0XHRzZWdzID0gdGhpcy5yZW5kZXJGZ1NlZ0VscyhzZWdzLCB0cnVlKTsgLy8gZGlzYWJsZVJlc2l6aW5nPXRydWVcblx0XHR0aGlzLnBvcG92ZXJTZWdzID0gc2VncztcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBzZWdzLmxlbmd0aDsgaSsrKSB7XG5cblx0XHRcdC8vIGJlY2F1c2Ugc2VnbWVudHMgaW4gdGhlIHBvcG92ZXIgYXJlIG5vdCBwYXJ0IG9mIGEgZ3JpZCBjb29yZGluYXRlIHN5c3RlbSwgcHJvdmlkZSBhIGhpbnQgdG8gYW55XG5cdFx0XHQvLyBncmlkcyB0aGF0IHdhbnQgdG8gZG8gZHJhZy1uLWRyb3AgYWJvdXQgd2hpY2ggY2VsbCBpdCBjYW1lIGZyb21cblx0XHRcdHNlZ3NbaV0uY2VsbCA9IGNlbGw7XG5cblx0XHRcdHNlZ0NvbnRhaW5lci5hcHBlbmQoc2Vnc1tpXS5lbCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvbnRlbnQ7XG5cdH0sXG5cblxuXHQvLyBHaXZlbiB0aGUgZXZlbnRzIHdpdGhpbiBhbiBhcnJheSBvZiBzZWdtZW50IG9iamVjdHMsIHJlc2xpY2UgdGhlbSB0byBiZSBpbiBhIHNpbmdsZSBkYXlcblx0cmVzbGljZURheVNlZ3M6IGZ1bmN0aW9uKHNlZ3MsIGRheURhdGUpIHtcblxuXHRcdC8vIGJ1aWxkIGFuIGFycmF5IG9mIHRoZSBvcmlnaW5hbCBldmVudHNcblx0XHR2YXIgZXZlbnRzID0gJC5tYXAoc2VncywgZnVuY3Rpb24oc2VnKSB7XG5cdFx0XHRyZXR1cm4gc2VnLmV2ZW50O1xuXHRcdH0pO1xuXG5cdFx0dmFyIGRheVN0YXJ0ID0gZGF5RGF0ZS5jbG9uZSgpLnN0cmlwVGltZSgpO1xuXHRcdHZhciBkYXlFbmQgPSBkYXlTdGFydC5jbG9uZSgpLmFkZCgxLCAnZGF5cycpO1xuXHRcdHZhciBkYXlSYW5nZSA9IHsgc3RhcnQ6IGRheVN0YXJ0LCBlbmQ6IGRheUVuZCB9O1xuXG5cdFx0Ly8gc2xpY2UgdGhlIGV2ZW50cyB3aXRoIGEgY3VzdG9tIHNsaWNpbmcgZnVuY3Rpb25cblx0XHRyZXR1cm4gdGhpcy5ldmVudHNUb1NlZ3MoXG5cdFx0XHRldmVudHMsXG5cdFx0XHRmdW5jdGlvbihyYW5nZSkge1xuXHRcdFx0XHR2YXIgc2VnID0gaW50ZXJzZWN0aW9uVG9TZWcocmFuZ2UsIGRheVJhbmdlKTsgLy8gdW5kZWZpbmQgaWYgbm8gaW50ZXJzZWN0aW9uXG5cdFx0XHRcdHJldHVybiBzZWcgPyBbIHNlZyBdIDogW107IC8vIG11c3QgcmV0dXJuIGFuIGFycmF5IG9mIHNlZ21lbnRzXG5cdFx0XHR9XG5cdFx0KTtcblx0fSxcblxuXG5cdC8vIEdlbmVyYXRlcyB0aGUgdGV4dCB0aGF0IHNob3VsZCBiZSBpbnNpZGUgYSBcIm1vcmVcIiBsaW5rLCBnaXZlbiB0aGUgbnVtYmVyIG9mIGV2ZW50cyBpdCByZXByZXNlbnRzXG5cdGdldE1vcmVMaW5rVGV4dDogZnVuY3Rpb24obnVtKSB7XG5cdFx0dmFyIG9wdCA9IHRoaXMudmlldy5vcHQoJ2V2ZW50TGltaXRUZXh0Jyk7XG5cblx0XHRpZiAodHlwZW9mIG9wdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0cmV0dXJuIG9wdChudW0pO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiAnKycgKyBudW0gKyAnICcgKyBvcHQ7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gUmV0dXJucyBzZWdtZW50cyB3aXRoaW4gYSBnaXZlbiBjZWxsLlxuXHQvLyBJZiBgc3RhcnRMZXZlbGAgaXMgc3BlY2lmaWVkLCByZXR1cm5zIG9ubHkgZXZlbnRzIGluY2x1ZGluZyBhbmQgYmVsb3cgdGhhdCBsZXZlbC4gT3RoZXJ3aXNlIHJldHVybnMgYWxsIHNlZ3MuXG5cdGdldENlbGxTZWdzOiBmdW5jdGlvbihjZWxsLCBzdGFydExldmVsKSB7XG5cdFx0dmFyIHNlZ01hdHJpeCA9IHRoaXMucm93U3RydWN0c1tjZWxsLnJvd10uc2VnTWF0cml4O1xuXHRcdHZhciBsZXZlbCA9IHN0YXJ0TGV2ZWwgfHwgMDtcblx0XHR2YXIgc2VncyA9IFtdO1xuXHRcdHZhciBzZWc7XG5cblx0XHR3aGlsZSAobGV2ZWwgPCBzZWdNYXRyaXgubGVuZ3RoKSB7XG5cdFx0XHRzZWcgPSBzZWdNYXRyaXhbbGV2ZWxdW2NlbGwuY29sXTtcblx0XHRcdGlmIChzZWcpIHtcblx0XHRcdFx0c2Vncy5wdXNoKHNlZyk7XG5cdFx0XHR9XG5cdFx0XHRsZXZlbCsrO1xuXHRcdH1cblxuXHRcdHJldHVybiBzZWdzO1xuXHR9XG5cbn0pO1xuXG4gICAgLyogQSBjb21wb25lbnQgdGhhdCByZW5kZXJzIG9uZSBvciBtb3JlIGNvbHVtbnMgb2YgdmVydGljYWwgdGltZSBzbG90c1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbnZhciBUaW1lR3JpZCA9IEdyaWQuZXh0ZW5kKHtcblxuXHRzbG90RHVyYXRpb246IG51bGwsIC8vIGR1cmF0aW9uIG9mIGEgXCJzbG90XCIsIGEgZGlzdGluY3QgdGltZSBzZWdtZW50IG9uIGdpdmVuIGRheSwgdmlzdWFsaXplZCBieSBsaW5lc1xuXHRzbmFwRHVyYXRpb246IG51bGwsIC8vIGdyYW51bGFyaXR5IG9mIHRpbWUgZm9yIGRyYWdnaW5nIGFuZCBzZWxlY3RpbmdcblxuXHRtaW5UaW1lOiBudWxsLCAvLyBEdXJhdGlvbiBvYmplY3QgdGhhdCBkZW5vdGVzIHRoZSBmaXJzdCB2aXNpYmxlIHRpbWUgb2YgYW55IGdpdmVuIGRheVxuXHRtYXhUaW1lOiBudWxsLCAvLyBEdXJhdGlvbiBvYmplY3QgdGhhdCBkZW5vdGVzIHRoZSBleGNsdXNpdmUgdmlzaWJsZSBlbmQgdGltZSBvZiBhbnkgZ2l2ZW4gZGF5XG5cblx0YXhpc0Zvcm1hdDogbnVsbCwgLy8gZm9ybWF0dGluZyBzdHJpbmcgZm9yIHRpbWVzIHJ1bm5pbmcgYWxvbmcgdmVydGljYWwgYXhpc1xuXG5cdGRheUVsczogbnVsbCwgLy8gY2VsbHMgZWxlbWVudHMgaW4gdGhlIGRheS1yb3cgYmFja2dyb3VuZFxuXHRzbGF0RWxzOiBudWxsLCAvLyBlbGVtZW50cyBydW5uaW5nIGhvcml6b250YWxseSBhY3Jvc3MgYWxsIGNvbHVtbnNcblxuXHRzbGF0VG9wczogbnVsbCwgLy8gYW4gYXJyYXkgb2YgdG9wIHBvc2l0aW9ucywgcmVsYXRpdmUgdG8gdGhlIGNvbnRhaW5lci4gbGFzdCBpdGVtIGhvbGRzIGJvdHRvbSBvZiBsYXN0IHNsb3RcblxuXHRoZWxwZXJFbDogbnVsbCwgLy8gY2VsbCBza2VsZXRvbiBlbGVtZW50IGZvciByZW5kZXJpbmcgdGhlIG1vY2sgZXZlbnQgXCJoZWxwZXJcIlxuXG5cdGJ1c2luZXNzSG91clNlZ3M6IG51bGwsXG5cblxuXHRjb25zdHJ1Y3RvcjogZnVuY3Rpb24oKSB7XG5cdFx0R3JpZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyAvLyBjYWxsIHRoZSBzdXBlci1jb25zdHJ1Y3RvclxuXHRcdHRoaXMucHJvY2Vzc09wdGlvbnMoKTtcblx0fSxcblxuXG5cdC8vIFJlbmRlcnMgdGhlIHRpbWUgZ3JpZCBpbnRvIGB0aGlzLmVsYCwgd2hpY2ggc2hvdWxkIGFscmVhZHkgYmUgYXNzaWduZWQuXG5cdC8vIFJlbGllcyBvbiB0aGUgdmlldydzIGNvbENudC4gSW4gdGhlIGZ1dHVyZSwgdGhpcyBjb21wb25lbnQgc2hvdWxkIHByb2JhYmx5IGJlIHNlbGYtc3VmZmljaWVudC5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVsLmh0bWwodGhpcy5yZW5kZXJIdG1sKCkpO1xuXHRcdHRoaXMuZGF5RWxzID0gdGhpcy5lbC5maW5kKCcuZmMtZGF5Jyk7XG5cdFx0dGhpcy5zbGF0RWxzID0gdGhpcy5lbC5maW5kKCcuZmMtc2xhdHMgdHInKTtcblxuXHRcdHRoaXMuY29tcHV0ZVNsYXRUb3BzKCk7XG5cdFx0dGhpcy5yZW5kZXJCdXNpbmVzc0hvdXJzKCk7XG5cdFx0R3JpZC5wcm90b3R5cGUucmVuZGVyLmNhbGwodGhpcyk7IC8vIGNhbGwgdGhlIHN1cGVyLW1ldGhvZFxuXHR9LFxuXG5cblx0cmVuZGVyQnVzaW5lc3NIb3VyczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGV2ZW50cyA9IHRoaXMudmlldy5jYWxlbmRhci5nZXRCdXNpbmVzc0hvdXJzRXZlbnRzKCk7XG5cdFx0dGhpcy5idXNpbmVzc0hvdXJTZWdzID0gdGhpcy5yZW5kZXJGaWxsKCdidXNpbmVzc0hvdXJzJywgdGhpcy5ldmVudHNUb1NlZ3MoZXZlbnRzKSwgJ2JnZXZlbnQnKTtcblx0fSxcblxuXG5cdC8vIFJlbmRlcnMgdGhlIGJhc2ljIEhUTUwgc2tlbGV0b24gZm9yIHRoZSBncmlkXG5cdHJlbmRlckh0bWw6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnJyArXG5cdFx0XHQnPGRpdiBjbGFzcz1cImZjLWJnXCI+JyArXG5cdFx0XHRcdCc8dGFibGU+JyArXG5cdFx0XHRcdFx0dGhpcy5yb3dIdG1sKCdzbG90QmcnKSArIC8vIGxldmVyYWdlcyBSb3dSZW5kZXJlciwgd2hpY2ggd2lsbCBjYWxsIHNsb3RCZ0NlbGxIdG1sXG5cdFx0XHRcdCc8L3RhYmxlPicgK1xuXHRcdFx0JzwvZGl2PicgK1xuXHRcdFx0JzxkaXYgY2xhc3M9XCJmYy1zbGF0c1wiPicgK1xuXHRcdFx0XHQnPHRhYmxlPicgK1xuXHRcdFx0XHRcdHRoaXMuc2xhdFJvd0h0bWwoKSArXG5cdFx0XHRcdCc8L3RhYmxlPicgK1xuXHRcdFx0JzwvZGl2Pic7XG5cdH0sXG5cblxuXHQvLyBSZW5kZXJzIHRoZSBIVE1MIGZvciBhIHZlcnRpY2FsIGJhY2tncm91bmQgY2VsbCBiZWhpbmQgdGhlIHNsb3RzLlxuXHQvLyBUaGlzIG1ldGhvZCBpcyBkaXN0aW5jdCBmcm9tICdiZycgYmVjYXVzZSB3ZSB3YW50ZWQgYSBuZXcgYHJvd1R5cGVgIHNvIHRoZSBWaWV3IGNvdWxkIGN1c3RvbWl6ZSB0aGUgcmVuZGVyaW5nLlxuXHRzbG90QmdDZWxsSHRtbDogZnVuY3Rpb24oY2VsbCkge1xuXHRcdHJldHVybiB0aGlzLmJnQ2VsbEh0bWwoY2VsbCk7XG5cdH0sXG5cblxuXHQvLyBHZW5lcmF0ZXMgdGhlIEhUTUwgZm9yIHRoZSBob3Jpem9udGFsIFwic2xhdHNcIiB0aGF0IHJ1biB3aWR0aC13aXNlLiBIYXMgYSB0aW1lIGF4aXMgb24gYSBzaWRlLiBEZXBlbmRzIG9uIFJUTC5cblx0c2xhdFJvd0h0bWw6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB2aWV3ID0gdGhpcy52aWV3O1xuXHRcdHZhciBpc1JUTCA9IHRoaXMuaXNSVEw7XG5cdFx0dmFyIGh0bWwgPSAnJztcblx0XHR2YXIgc2xvdE5vcm1hbCA9IHRoaXMuc2xvdER1cmF0aW9uLmFzTWludXRlcygpICUgMTUgPT09IDA7XG5cdFx0dmFyIHNsb3RUaW1lID0gbW9tZW50LmR1cmF0aW9uKCt0aGlzLm1pblRpbWUpOyAvLyB3aXNoIHRoZXJlIHdhcyAuY2xvbmUoKSBmb3IgZHVyYXRpb25zXG5cdFx0dmFyIHNsb3REYXRlOyAvLyB3aWxsIGJlIG9uIHRoZSB2aWV3J3MgZmlyc3QgZGF5LCBidXQgd2Ugb25seSBjYXJlIGFib3V0IGl0cyB0aW1lXG5cdFx0dmFyIG1pbnV0ZXM7XG5cdFx0dmFyIGF4aXNIdG1sO1xuXG5cdFx0Ly8gQ2FsY3VsYXRlIHRoZSB0aW1lIGZvciBlYWNoIHNsb3Rcblx0XHR3aGlsZSAoc2xvdFRpbWUgPCB0aGlzLm1heFRpbWUpIHtcblx0XHRcdHNsb3REYXRlID0gdGhpcy5zdGFydC5jbG9uZSgpLnRpbWUoc2xvdFRpbWUpOyAvLyB3aWxsIGJlIGluIFVUQyBidXQgdGhhdCdzIGdvb2QuIHRvIGF2b2lkIERTVCBpc3N1ZXNcblx0XHRcdG1pbnV0ZXMgPSBzbG90RGF0ZS5taW51dGVzKCk7XG5cblx0XHRcdGF4aXNIdG1sID1cblx0XHRcdFx0Jzx0ZCBjbGFzcz1cImZjLWF4aXMgZmMtdGltZSAnICsgdmlldy53aWRnZXRDb250ZW50Q2xhc3MgKyAnXCIgJyArIHZpZXcuYXhpc1N0eWxlQXR0cigpICsgJz4nICtcblx0XHRcdFx0XHQoKCFzbG90Tm9ybWFsIHx8ICFtaW51dGVzKSA/IC8vIGlmIGlycmVndWxhciBzbG90IGR1cmF0aW9uLCBvciBvbiB0aGUgaG91ciwgdGhlbiBkaXNwbGF5IHRoZSB0aW1lXG5cdFx0XHRcdFx0XHQnPHNwYW4+JyArIC8vIGZvciBtYXRjaENlbGxXaWR0aHNcblx0XHRcdFx0XHRcdFx0aHRtbEVzY2FwZShzbG90RGF0ZS5mb3JtYXQodGhpcy5heGlzRm9ybWF0KSkgK1xuXHRcdFx0XHRcdFx0Jzwvc3Bhbj4nIDpcblx0XHRcdFx0XHRcdCcnXG5cdFx0XHRcdFx0XHQpICtcblx0XHRcdFx0JzwvdGQ+JztcblxuXHRcdFx0aHRtbCArPVxuXHRcdFx0XHQnPHRyICcgKyAoIW1pbnV0ZXMgPyAnJyA6ICdjbGFzcz1cImZjLW1pbm9yXCInKSArICc+JyArXG5cdFx0XHRcdFx0KCFpc1JUTCA/IGF4aXNIdG1sIDogJycpICtcblx0XHRcdFx0XHQnPHRkIGNsYXNzPVwiJyArIHZpZXcud2lkZ2V0Q29udGVudENsYXNzICsgJ1wiLz4nICtcblx0XHRcdFx0XHQoaXNSVEwgPyBheGlzSHRtbCA6ICcnKSArXG5cdFx0XHRcdFwiPC90cj5cIjtcblxuXHRcdFx0c2xvdFRpbWUuYWRkKHRoaXMuc2xvdER1cmF0aW9uKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gaHRtbDtcblx0fSxcblxuXG5cdC8qIE9wdGlvbnNcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFBhcnNlcyB2YXJpb3VzIG9wdGlvbnMgaW50byBwcm9wZXJ0aWVzIG9mIHRoaXMgb2JqZWN0XG5cdHByb2Nlc3NPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdmlldyA9IHRoaXMudmlldztcblx0XHR2YXIgc2xvdER1cmF0aW9uID0gdmlldy5vcHQoJ3Nsb3REdXJhdGlvbicpO1xuXHRcdHZhciBzbmFwRHVyYXRpb24gPSB2aWV3Lm9wdCgnc25hcER1cmF0aW9uJyk7XG5cblx0XHRzbG90RHVyYXRpb24gPSBtb21lbnQuZHVyYXRpb24oc2xvdER1cmF0aW9uKTtcblx0XHRzbmFwRHVyYXRpb24gPSBzbmFwRHVyYXRpb24gPyBtb21lbnQuZHVyYXRpb24oc25hcER1cmF0aW9uKSA6IHNsb3REdXJhdGlvbjtcblxuXHRcdHRoaXMuc2xvdER1cmF0aW9uID0gc2xvdER1cmF0aW9uO1xuXHRcdHRoaXMuc25hcER1cmF0aW9uID0gc25hcER1cmF0aW9uO1xuXG5cdFx0dGhpcy5taW5UaW1lID0gbW9tZW50LmR1cmF0aW9uKHZpZXcub3B0KCdtaW5UaW1lJykpO1xuXHRcdHRoaXMubWF4VGltZSA9IG1vbWVudC5kdXJhdGlvbih2aWV3Lm9wdCgnbWF4VGltZScpKTtcblxuXHRcdHRoaXMuYXhpc0Zvcm1hdCA9IHZpZXcub3B0KCdheGlzRm9ybWF0JykgfHwgdmlldy5vcHQoJ3NtYWxsVGltZUZvcm1hdCcpO1xuXHR9LFxuXG5cblx0Ly8gQ29tcHV0ZXMgYSBkZWZhdWx0IGNvbHVtbiBoZWFkZXIgZm9ybWF0dGluZyBzdHJpbmcgaWYgYGNvbEZvcm1hdGAgaXMgbm90IGV4cGxpY2l0bHkgZGVmaW5lZFxuXHRjb21wdXRlQ29sSGVhZEZvcm1hdDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuY29sQ250ID4gMSkgeyAvLyBtdWx0aXBsZSBkYXlzLCBzbyBmdWxsIHNpbmdsZSBkYXRlIHN0cmluZyBXT04nVCBiZSBpbiB0aXRsZSB0ZXh0XG5cdFx0XHRyZXR1cm4gdGhpcy52aWV3Lm9wdCgnZGF5T2ZNb250aEZvcm1hdCcpOyAvLyBcIlNhdCAxMi8xMFwiXG5cdFx0fVxuXHRcdGVsc2UgeyAvLyBzaW5nbGUgZGF5LCBzbyBmdWxsIHNpbmdsZSBkYXRlIHN0cmluZyB3aWxsIHByb2JhYmx5IGJlIGluIHRpdGxlIHRleHRcblx0XHRcdHJldHVybiAnZGRkZCc7IC8vIFwiU2F0dXJkYXlcIlxuXHRcdH1cblx0fSxcblxuXG5cdC8vIENvbXB1dGVzIGEgZGVmYXVsdCBldmVudCB0aW1lIGZvcm1hdHRpbmcgc3RyaW5nIGlmIGB0aW1lRm9ybWF0YCBpcyBub3QgZXhwbGljaXRseSBkZWZpbmVkXG5cdGNvbXB1dGVFdmVudFRpbWVGb3JtYXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnZpZXcub3B0KCdub01lcmlkaWVtVGltZUZvcm1hdCcpOyAvLyBsaWtlIFwiNjozMFwiIChubyBBTS9QTSlcblx0fSxcblxuXG5cdC8vIENvbXB1dGVzIGEgZGVmYXVsdCBgZGlzcGxheUV2ZW50RW5kYCB2YWx1ZSBpZiBvbmUgaXMgbm90IGV4cGxpY2x0eSBkZWZpbmVkXG5cdGNvbXB1dGVEaXNwbGF5RXZlbnRFbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9LFxuXG5cblx0LyogQ2VsbCBTeXN0ZW1cblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIEluaXRpYWxpemVzIHJvdy9jb2wgaW5mb3JtYXRpb25cblx0dXBkYXRlQ2VsbHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB2aWV3ID0gdGhpcy52aWV3O1xuXHRcdHZhciBjb2xEYXRhID0gW107XG5cdFx0dmFyIGRhdGU7XG5cblx0XHRkYXRlID0gdGhpcy5zdGFydC5jbG9uZSgpO1xuXHRcdHdoaWxlIChkYXRlLmlzQmVmb3JlKHRoaXMuZW5kKSkge1xuXHRcdFx0Y29sRGF0YS5wdXNoKHtcblx0XHRcdFx0ZGF5OiBkYXRlLmNsb25lKClcblx0XHRcdH0pO1xuXHRcdFx0ZGF0ZS5hZGQoMSwgJ2RheScpO1xuXHRcdFx0ZGF0ZSA9IHZpZXcuc2tpcEhpZGRlbkRheXMoZGF0ZSk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuaXNSVEwpIHtcblx0XHRcdGNvbERhdGEucmV2ZXJzZSgpO1xuXHRcdH1cblxuXHRcdHRoaXMuY29sRGF0YSA9IGNvbERhdGE7XG5cdFx0dGhpcy5jb2xDbnQgPSBjb2xEYXRhLmxlbmd0aDtcblx0XHR0aGlzLnJvd0NudCA9IE1hdGguY2VpbCgodGhpcy5tYXhUaW1lIC0gdGhpcy5taW5UaW1lKSAvIHRoaXMuc25hcER1cmF0aW9uKTsgLy8gIyBvZiB2ZXJ0aWNhbCBzbmFwc1xuXHR9LFxuXG5cblx0Ly8gR2l2ZW4gYSBjZWxsIG9iamVjdCwgZ2VuZXJhdGVzIGEgcmFuZ2Ugb2JqZWN0XG5cdGNvbXB1dGVDZWxsUmFuZ2U6IGZ1bmN0aW9uKGNlbGwpIHtcblx0XHR2YXIgdGltZSA9IHRoaXMuY29tcHV0ZVNuYXBUaW1lKGNlbGwucm93KTtcblx0XHR2YXIgc3RhcnQgPSB0aGlzLnZpZXcuY2FsZW5kYXIucmV6b25lRGF0ZShjZWxsLmRheSkudGltZSh0aW1lKTtcblx0XHR2YXIgZW5kID0gc3RhcnQuY2xvbmUoKS5hZGQodGhpcy5zbmFwRHVyYXRpb24pO1xuXG5cdFx0cmV0dXJuIHsgc3RhcnQ6IHN0YXJ0LCBlbmQ6IGVuZCB9O1xuXHR9LFxuXG5cblx0Ly8gUmV0cmlldmVzIHRoZSBlbGVtZW50IHJlcHJlc2VudGluZyB0aGUgZ2l2ZW4gY29sdW1uXG5cdGdldENvbEVsOiBmdW5jdGlvbihjb2wpIHtcblx0XHRyZXR1cm4gdGhpcy5kYXlFbHMuZXEoY29sKTtcblx0fSxcblxuXG5cdC8qIERhdGVzXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuXHQvLyBHaXZlbiBhIHJvdyBudW1iZXIgb2YgdGhlIGdyaWQsIHJlcHJlc2VudGluZyBhIFwic25hcFwiLCByZXR1cm5zIGEgdGltZSAoRHVyYXRpb24pIGZyb20gaXRzIHN0YXJ0LW9mLWRheVxuXHRjb21wdXRlU25hcFRpbWU6IGZ1bmN0aW9uKHJvdykge1xuXHRcdHJldHVybiBtb21lbnQuZHVyYXRpb24odGhpcy5taW5UaW1lICsgdGhpcy5zbmFwRHVyYXRpb24gKiByb3cpO1xuXHR9LFxuXG5cblx0Ly8gU2xpY2VzIHVwIGEgZGF0ZSByYW5nZSBieSBjb2x1bW4gaW50byBhbiBhcnJheSBvZiBzZWdtZW50c1xuXHRyYW5nZVRvU2VnczogZnVuY3Rpb24ocmFuZ2UpIHtcblx0XHR2YXIgY29sQ250ID0gdGhpcy5jb2xDbnQ7XG5cdFx0dmFyIHNlZ3MgPSBbXTtcblx0XHR2YXIgc2VnO1xuXHRcdHZhciBjb2w7XG5cdFx0dmFyIGNvbERhdGU7XG5cdFx0dmFyIGNvbFJhbmdlO1xuXG5cdFx0Ly8gbm9ybWFsaXplIDooXG5cdFx0cmFuZ2UgPSB7XG5cdFx0XHRzdGFydDogcmFuZ2Uuc3RhcnQuY2xvbmUoKS5zdHJpcFpvbmUoKSxcblx0XHRcdGVuZDogcmFuZ2UuZW5kLmNsb25lKCkuc3RyaXBab25lKClcblx0XHR9O1xuXG5cdFx0Zm9yIChjb2wgPSAwOyBjb2wgPCBjb2xDbnQ7IGNvbCsrKSB7XG5cdFx0XHRjb2xEYXRlID0gdGhpcy5jb2xEYXRhW2NvbF0uZGF5OyAvLyB3aWxsIGJlIGFtYmlnIHRpbWUvdGltZXpvbmVcblx0XHRcdGNvbFJhbmdlID0ge1xuXHRcdFx0XHRzdGFydDogY29sRGF0ZS5jbG9uZSgpLnRpbWUodGhpcy5taW5UaW1lKSxcblx0XHRcdFx0ZW5kOiBjb2xEYXRlLmNsb25lKCkudGltZSh0aGlzLm1heFRpbWUpXG5cdFx0XHR9O1xuXHRcdFx0c2VnID0gaW50ZXJzZWN0aW9uVG9TZWcocmFuZ2UsIGNvbFJhbmdlKTsgLy8gYm90aCB3aWxsIGJlIGFtYmlnIHRpbWV6b25lXG5cdFx0XHRpZiAoc2VnKSB7XG5cdFx0XHRcdHNlZy5jb2wgPSBjb2w7XG5cdFx0XHRcdHNlZ3MucHVzaChzZWcpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBzZWdzO1xuXHR9LFxuXG5cblx0LyogQ29vcmRpbmF0ZXNcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIENhbGxlZCB3aGVuIHRoZXJlIGlzIGEgd2luZG93IHJlc2l6ZS96b29tIGFuZCB3ZSBuZWVkIHRvIHJlY2FsY3VsYXRlIGNvb3JkaW5hdGVzIGZvciB0aGUgZ3JpZFxuXHRyZXNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY29tcHV0ZVNsYXRUb3BzKCk7XG5cdFx0dGhpcy51cGRhdGVTZWdWZXJ0aWNhbHMoKTtcblx0fSxcblxuXG5cdC8vIENvbXB1dGVzIHRoZSB0b3AvYm90dG9tIGNvb3JkaW5hdGVzIG9mIGVhY2ggXCJzbmFwXCIgcm93c1xuXHRjb21wdXRlUm93Q29vcmRzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3JpZ2luVG9wID0gdGhpcy5lbC5vZmZzZXQoKS50b3A7XG5cdFx0dmFyIGl0ZW1zID0gW107XG5cdFx0dmFyIGk7XG5cdFx0dmFyIGl0ZW07XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgdGhpcy5yb3dDbnQ7IGkrKykge1xuXHRcdFx0aXRlbSA9IHtcblx0XHRcdFx0dG9wOiBvcmlnaW5Ub3AgKyB0aGlzLmNvbXB1dGVUaW1lVG9wKHRoaXMuY29tcHV0ZVNuYXBUaW1lKGkpKVxuXHRcdFx0fTtcblx0XHRcdGlmIChpID4gMCkge1xuXHRcdFx0XHRpdGVtc1tpIC0gMV0uYm90dG9tID0gaXRlbS50b3A7XG5cdFx0XHR9XG5cdFx0XHRpdGVtcy5wdXNoKGl0ZW0pO1xuXHRcdH1cblx0XHRpdGVtLmJvdHRvbSA9IGl0ZW0udG9wICsgdGhpcy5jb21wdXRlVGltZVRvcCh0aGlzLmNvbXB1dGVTbmFwVGltZShpKSk7XG5cblx0XHRyZXR1cm4gaXRlbXM7XG5cdH0sXG5cblxuXHQvLyBDb21wdXRlcyB0aGUgdG9wIGNvb3JkaW5hdGUsIHJlbGF0aXZlIHRvIHRoZSBib3VuZHMgb2YgdGhlIGdyaWQsIG9mIHRoZSBnaXZlbiBkYXRlLlxuXHQvLyBBIGBzdGFydE9mRGF5RGF0ZWAgbXVzdCBiZSBnaXZlbiBmb3IgYXZvaWRpbmcgYW1iaWd1aXR5IG92ZXIgaG93IHRvIHRyZWF0IG1pZG5pZ2h0LlxuXHRjb21wdXRlRGF0ZVRvcDogZnVuY3Rpb24oZGF0ZSwgc3RhcnRPZkRheURhdGUpIHtcblx0XHRyZXR1cm4gdGhpcy5jb21wdXRlVGltZVRvcChcblx0XHRcdG1vbWVudC5kdXJhdGlvbihcblx0XHRcdFx0ZGF0ZS5jbG9uZSgpLnN0cmlwWm9uZSgpIC0gc3RhcnRPZkRheURhdGUuY2xvbmUoKS5zdHJpcFRpbWUoKVxuXHRcdFx0KVxuXHRcdCk7XG5cdH0sXG5cblxuXHQvLyBDb21wdXRlcyB0aGUgdG9wIGNvb3JkaW5hdGUsIHJlbGF0aXZlIHRvIHRoZSBib3VuZHMgb2YgdGhlIGdyaWQsIG9mIHRoZSBnaXZlbiB0aW1lIChhIER1cmF0aW9uKS5cblx0Y29tcHV0ZVRpbWVUb3A6IGZ1bmN0aW9uKHRpbWUpIHtcblx0XHR2YXIgc2xhdENvdmVyYWdlID0gKHRpbWUgLSB0aGlzLm1pblRpbWUpIC8gdGhpcy5zbG90RHVyYXRpb247IC8vIGZsb2F0aW5nLXBvaW50IHZhbHVlIG9mICMgb2Ygc2xvdHMgY292ZXJlZFxuXHRcdHZhciBzbGF0SW5kZXg7XG5cdFx0dmFyIHNsYXRSZW1haW5kZXI7XG5cdFx0dmFyIHNsYXRUb3A7XG5cdFx0dmFyIHNsYXRCb3R0b207XG5cblx0XHQvLyBjb25zdHJhaW4uIGJlY2F1c2UgbWluVGltZS9tYXhUaW1lIG1pZ2h0IGJlIGN1c3RvbWl6ZWRcblx0XHRzbGF0Q292ZXJhZ2UgPSBNYXRoLm1heCgwLCBzbGF0Q292ZXJhZ2UpO1xuXHRcdHNsYXRDb3ZlcmFnZSA9IE1hdGgubWluKHRoaXMuc2xhdEVscy5sZW5ndGgsIHNsYXRDb3ZlcmFnZSk7XG5cblx0XHRzbGF0SW5kZXggPSBNYXRoLmZsb29yKHNsYXRDb3ZlcmFnZSk7IC8vIGFuIGludGVnZXIgaW5kZXggb2YgdGhlIGZ1cnRoZXN0IHdob2xlIHNsb3Rcblx0XHRzbGF0UmVtYWluZGVyID0gc2xhdENvdmVyYWdlIC0gc2xhdEluZGV4O1xuXHRcdHNsYXRUb3AgPSB0aGlzLnNsYXRUb3BzW3NsYXRJbmRleF07IC8vIHRoZSB0b3AgcG9zaXRpb24gb2YgdGhlIGZ1cnRoZXN0IHdob2xlIHNsb3RcblxuXHRcdGlmIChzbGF0UmVtYWluZGVyKSB7IC8vIHRpbWUgc3BhbnMgcGFydC13YXkgaW50byB0aGUgc2xvdFxuXHRcdFx0c2xhdEJvdHRvbSA9IHRoaXMuc2xhdFRvcHNbc2xhdEluZGV4ICsgMV07XG5cdFx0XHRyZXR1cm4gc2xhdFRvcCArIChzbGF0Qm90dG9tIC0gc2xhdFRvcCkgKiBzbGF0UmVtYWluZGVyOyAvLyBwYXJ0LXdheSBiZXR3ZWVuIHNsb3RzXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHNsYXRUb3A7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gUXVlcmllcyBlYWNoIGBzbGF0RWxgIGZvciBpdHMgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIGdyaWQncyBjb250YWluZXIgYW5kIHN0b3JlcyBpdCBpbiBgc2xhdFRvcHNgLlxuXHQvLyBJbmNsdWRlcyB0aGUgdGhlIGJvdHRvbSBvZiB0aGUgbGFzdCBzbGF0IGFzIHRoZSBsYXN0IGl0ZW0gaW4gdGhlIGFycmF5LlxuXHRjb21wdXRlU2xhdFRvcHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0b3BzID0gW107XG5cdFx0dmFyIHRvcDtcblxuXHRcdHRoaXMuc2xhdEVscy5lYWNoKGZ1bmN0aW9uKGksIG5vZGUpIHtcblx0XHRcdHRvcCA9ICQobm9kZSkucG9zaXRpb24oKS50b3A7XG5cdFx0XHR0b3BzLnB1c2godG9wKTtcblx0XHR9KTtcblxuXHRcdHRvcHMucHVzaCh0b3AgKyB0aGlzLnNsYXRFbHMubGFzdCgpLm91dGVySGVpZ2h0KCkpOyAvLyBib3R0b20gb2YgdGhlIGxhc3Qgc2xhdFxuXG5cdFx0dGhpcy5zbGF0VG9wcyA9IHRvcHM7XG5cdH0sXG5cblxuXHQvKiBFdmVudCBEcmFnIFZpc3VhbGl6YXRpb25cblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFJlbmRlcnMgYSB2aXN1YWwgaW5kaWNhdGlvbiBvZiBhbiBldmVudCBiZWluZyBkcmFnZ2VkIG92ZXIgdGhlIHNwZWNpZmllZCBkYXRlKHMpLlxuXHQvLyBkcm9wTG9jYXRpb24ncyBlbmQgbWlnaHQgYmUgbnVsbCwgYXMgd2VsbCBhcyBgc2VnYC4gU2VlIEdyaWQ6OnJlbmRlckRyYWcgZm9yIG1vcmUgaW5mby5cblx0Ly8gQSByZXR1cm5lZCB2YWx1ZSBvZiBgdHJ1ZWAgc2lnbmFscyB0aGF0IGEgbW9jayBcImhlbHBlclwiIGV2ZW50IGhhcyBiZWVuIHJlbmRlcmVkLlxuXHRyZW5kZXJEcmFnOiBmdW5jdGlvbihkcm9wTG9jYXRpb24sIHNlZykge1xuXHRcdHZhciBvcGFjaXR5O1xuXG5cdFx0aWYgKHNlZykgeyAvLyBpZiB0aGVyZSBpcyBldmVudCBpbmZvcm1hdGlvbiBmb3IgdGhpcyBkcmFnLCByZW5kZXIgYSBoZWxwZXIgZXZlbnRcblx0XHRcdHRoaXMucmVuZGVyUmFuZ2VIZWxwZXIoZHJvcExvY2F0aW9uLCBzZWcpO1xuXG5cdFx0XHRvcGFjaXR5ID0gdGhpcy52aWV3Lm9wdCgnZHJhZ09wYWNpdHknKTtcblx0XHRcdGlmIChvcGFjaXR5ICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0dGhpcy5oZWxwZXJFbC5jc3MoJ29wYWNpdHknLCBvcGFjaXR5KTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRydWU7IC8vIHNpZ25hbCB0aGF0IGEgaGVscGVyIGhhcyBiZWVuIHJlbmRlcmVkXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gb3RoZXJ3aXNlLCBqdXN0IHJlbmRlciBhIGhpZ2hsaWdodFxuXHRcdFx0dGhpcy5yZW5kZXJIaWdobGlnaHQoXG5cdFx0XHRcdHRoaXMudmlldy5jYWxlbmRhci5lbnN1cmVWaXNpYmxlRXZlbnRSYW5nZShkcm9wTG9jYXRpb24pIC8vIG5lZWRzIHRvIGJlIGEgcHJvcGVyIHJhbmdlXG5cdFx0XHQpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIFVucmVuZGVycyBhbnkgdmlzdWFsIGluZGljYXRpb24gb2YgYW4gZXZlbnQgYmVpbmcgZHJhZ2dlZFxuXHRkZXN0cm95RHJhZzogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kZXN0cm95SGVscGVyKCk7XG5cdFx0dGhpcy5kZXN0cm95SGlnaGxpZ2h0KCk7XG5cdH0sXG5cblxuXHQvKiBFdmVudCBSZXNpemUgVmlzdWFsaXphdGlvblxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gUmVuZGVycyBhIHZpc3VhbCBpbmRpY2F0aW9uIG9mIGFuIGV2ZW50IGJlaW5nIHJlc2l6ZWRcblx0cmVuZGVyRXZlbnRSZXNpemU6IGZ1bmN0aW9uKHJhbmdlLCBzZWcpIHtcblx0XHR0aGlzLnJlbmRlclJhbmdlSGVscGVyKHJhbmdlLCBzZWcpO1xuXHR9LFxuXG5cblx0Ly8gVW5yZW5kZXJzIGFueSB2aXN1YWwgaW5kaWNhdGlvbiBvZiBhbiBldmVudCBiZWluZyByZXNpemVkXG5cdGRlc3Ryb3lFdmVudFJlc2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kZXN0cm95SGVscGVyKCk7XG5cdH0sXG5cblxuXHQvKiBFdmVudCBIZWxwZXJcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFJlbmRlcnMgYSBtb2NrIFwiaGVscGVyXCIgZXZlbnQuIGBzb3VyY2VTZWdgIGlzIHRoZSBvcmlnaW5hbCBzZWdtZW50IG9iamVjdCBhbmQgbWlnaHQgYmUgbnVsbCAoYW4gZXh0ZXJuYWwgZHJhZylcblx0cmVuZGVySGVscGVyOiBmdW5jdGlvbihldmVudCwgc291cmNlU2VnKSB7XG5cdFx0dmFyIHNlZ3MgPSB0aGlzLmV2ZW50c1RvU2VncyhbIGV2ZW50IF0pO1xuXHRcdHZhciB0YWJsZUVsO1xuXHRcdHZhciBpLCBzZWc7XG5cdFx0dmFyIHNvdXJjZUVsO1xuXG5cdFx0c2VncyA9IHRoaXMucmVuZGVyRmdTZWdFbHMoc2Vncyk7IC8vIGFzc2lnbnMgZWFjaCBzZWcncyBlbCBhbmQgcmV0dXJucyBhIHN1YnNldCBvZiBzZWdzIHRoYXQgd2VyZSByZW5kZXJlZFxuXHRcdHRhYmxlRWwgPSB0aGlzLnJlbmRlclNlZ1RhYmxlKHNlZ3MpO1xuXG5cdFx0Ly8gVHJ5IHRvIG1ha2UgdGhlIHNlZ21lbnQgdGhhdCBpcyBpbiB0aGUgc2FtZSByb3cgYXMgc291cmNlU2VnIGxvb2sgdGhlIHNhbWVcblx0XHRmb3IgKGkgPSAwOyBpIDwgc2Vncy5sZW5ndGg7IGkrKykge1xuXHRcdFx0c2VnID0gc2Vnc1tpXTtcblx0XHRcdGlmIChzb3VyY2VTZWcgJiYgc291cmNlU2VnLmNvbCA9PT0gc2VnLmNvbCkge1xuXHRcdFx0XHRzb3VyY2VFbCA9IHNvdXJjZVNlZy5lbDtcblx0XHRcdFx0c2VnLmVsLmNzcyh7XG5cdFx0XHRcdFx0bGVmdDogc291cmNlRWwuY3NzKCdsZWZ0JyksXG5cdFx0XHRcdFx0cmlnaHQ6IHNvdXJjZUVsLmNzcygncmlnaHQnKSxcblx0XHRcdFx0XHQnbWFyZ2luLWxlZnQnOiBzb3VyY2VFbC5jc3MoJ21hcmdpbi1sZWZ0JyksXG5cdFx0XHRcdFx0J21hcmdpbi1yaWdodCc6IHNvdXJjZUVsLmNzcygnbWFyZ2luLXJpZ2h0Jylcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5oZWxwZXJFbCA9ICQoJzxkaXYgY2xhc3M9XCJmYy1oZWxwZXItc2tlbGV0b25cIi8+Jylcblx0XHRcdC5hcHBlbmQodGFibGVFbClcblx0XHRcdFx0LmFwcGVuZFRvKHRoaXMuZWwpO1xuXHR9LFxuXG5cblx0Ly8gVW5yZW5kZXJzIGFueSBtb2NrIGhlbHBlciBldmVudFxuXHRkZXN0cm95SGVscGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5oZWxwZXJFbCkge1xuXHRcdFx0dGhpcy5oZWxwZXJFbC5yZW1vdmUoKTtcblx0XHRcdHRoaXMuaGVscGVyRWwgPSBudWxsO1xuXHRcdH1cblx0fSxcblxuXG5cdC8qIFNlbGVjdGlvblxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gUmVuZGVycyBhIHZpc3VhbCBpbmRpY2F0aW9uIG9mIGEgc2VsZWN0aW9uLiBPdmVycmlkZXMgdGhlIGRlZmF1bHQsIHdoaWNoIHdhcyB0byBzaW1wbHkgcmVuZGVyIGEgaGlnaGxpZ2h0LlxuXHRyZW5kZXJTZWxlY3Rpb246IGZ1bmN0aW9uKHJhbmdlKSB7XG5cdFx0aWYgKHRoaXMudmlldy5vcHQoJ3NlbGVjdEhlbHBlcicpKSB7IC8vIHRoaXMgc2V0dGluZyBzaWduYWxzIHRoYXQgYSBtb2NrIGhlbHBlciBldmVudCBzaG91bGQgYmUgcmVuZGVyZWRcblx0XHRcdHRoaXMucmVuZGVyUmFuZ2VIZWxwZXIocmFuZ2UpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMucmVuZGVySGlnaGxpZ2h0KHJhbmdlKTtcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBVbnJlbmRlcnMgYW55IHZpc3VhbCBpbmRpY2F0aW9uIG9mIGEgc2VsZWN0aW9uXG5cdGRlc3Ryb3lTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGVzdHJveUhlbHBlcigpO1xuXHRcdHRoaXMuZGVzdHJveUhpZ2hsaWdodCgpO1xuXHR9LFxuXG5cblx0LyogRmlsbCBTeXN0ZW0gKGhpZ2hsaWdodCwgYmFja2dyb3VuZCBldmVudHMsIGJ1c2luZXNzIGhvdXJzKVxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gUmVuZGVycyBhIHNldCBvZiByZWN0YW5nbGVzIG92ZXIgdGhlIGdpdmVuIHRpbWUgc2VnbWVudHMuXG5cdC8vIE9ubHkgcmV0dXJucyBzZWdtZW50cyB0aGF0IHN1Y2Nlc3NmdWxseSByZW5kZXJlZC5cblx0cmVuZGVyRmlsbDogZnVuY3Rpb24odHlwZSwgc2VncywgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIHNlZ0NvbHM7XG5cdFx0dmFyIHNrZWxldG9uRWw7XG5cdFx0dmFyIHRyRWw7XG5cdFx0dmFyIGNvbCwgY29sU2Vncztcblx0XHR2YXIgdGRFbDtcblx0XHR2YXIgY29udGFpbmVyRWw7XG5cdFx0dmFyIGRheURhdGU7XG5cdFx0dmFyIGksIHNlZztcblxuXHRcdGlmIChzZWdzLmxlbmd0aCkge1xuXG5cdFx0XHRzZWdzID0gdGhpcy5yZW5kZXJGaWxsU2VnRWxzKHR5cGUsIHNlZ3MpOyAvLyBhc3NpZ25lcyBgLmVsYCB0byBlYWNoIHNlZy4gcmV0dXJucyBzdWNjZXNzZnVsbHkgcmVuZGVyZWQgc2Vnc1xuXHRcdFx0c2VnQ29scyA9IHRoaXMuZ3JvdXBTZWdDb2xzKHNlZ3MpOyAvLyBncm91cCBpbnRvIHN1Yi1hcnJheXMsIGFuZCBhc3NpZ25zICdjb2wnIHRvIGVhY2ggc2VnXG5cblx0XHRcdGNsYXNzTmFtZSA9IGNsYXNzTmFtZSB8fCB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRza2VsZXRvbkVsID0gJChcblx0XHRcdFx0JzxkaXYgY2xhc3M9XCJmYy0nICsgY2xhc3NOYW1lICsgJy1za2VsZXRvblwiPicgK1xuXHRcdFx0XHRcdCc8dGFibGU+PHRyLz48L3RhYmxlPicgK1xuXHRcdFx0XHQnPC9kaXY+J1xuXHRcdFx0KTtcblx0XHRcdHRyRWwgPSBza2VsZXRvbkVsLmZpbmQoJ3RyJyk7XG5cblx0XHRcdGZvciAoY29sID0gMDsgY29sIDwgc2VnQ29scy5sZW5ndGg7IGNvbCsrKSB7XG5cdFx0XHRcdGNvbFNlZ3MgPSBzZWdDb2xzW2NvbF07XG5cdFx0XHRcdHRkRWwgPSAkKCc8dGQvPicpLmFwcGVuZFRvKHRyRWwpO1xuXG5cdFx0XHRcdGlmIChjb2xTZWdzLmxlbmd0aCkge1xuXHRcdFx0XHRcdGNvbnRhaW5lckVsID0gJCgnPGRpdiBjbGFzcz1cImZjLScgKyBjbGFzc05hbWUgKyAnLWNvbnRhaW5lclwiLz4nKS5hcHBlbmRUbyh0ZEVsKTtcblx0XHRcdFx0XHRkYXlEYXRlID0gdGhpcy5jb2xEYXRhW2NvbF0uZGF5O1xuXG5cdFx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGNvbFNlZ3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHNlZyA9IGNvbFNlZ3NbaV07XG5cdFx0XHRcdFx0XHRjb250YWluZXJFbC5hcHBlbmQoXG5cdFx0XHRcdFx0XHRcdHNlZy5lbC5jc3Moe1xuXHRcdFx0XHRcdFx0XHRcdHRvcDogdGhpcy5jb21wdXRlRGF0ZVRvcChzZWcuc3RhcnQsIGRheURhdGUpLFxuXHRcdFx0XHRcdFx0XHRcdGJvdHRvbTogLXRoaXMuY29tcHV0ZURhdGVUb3Aoc2VnLmVuZCwgZGF5RGF0ZSkgLy8gdGhlIHkgcG9zaXRpb24gb2YgdGhlIGJvdHRvbSBlZGdlXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmJvb2tlbmRDZWxscyh0ckVsLCB0eXBlKTtcblxuXHRcdFx0dGhpcy5lbC5hcHBlbmQoc2tlbGV0b25FbCk7XG5cdFx0XHR0aGlzLmVsc0J5RmlsbFt0eXBlXSA9IHNrZWxldG9uRWw7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNlZ3M7XG5cdH1cblxufSk7XG5cbiAgICAvKiBFdmVudC1yZW5kZXJpbmcgbWV0aG9kcyBmb3IgdGhlIFRpbWVHcmlkIGNsYXNzXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuVGltZUdyaWQubWl4aW4oe1xuXG5cdGV2ZW50U2tlbGV0b25FbDogbnVsbCwgLy8gaGFzIGNlbGxzIHdpdGggZXZlbnQtY29udGFpbmVycywgd2hpY2ggY29udGFpbiBhYnNvbHV0ZWx5IHBvc2l0aW9uZWQgZXZlbnQgZWxlbWVudHNcblxuXG5cdC8vIFJlbmRlcnMgdGhlIGdpdmVuIGZvcmVncm91bmQgZXZlbnQgc2VnbWVudHMgb250byB0aGUgZ3JpZFxuXHRyZW5kZXJGZ1NlZ3M6IGZ1bmN0aW9uKHNlZ3MpIHtcblx0XHRzZWdzID0gdGhpcy5yZW5kZXJGZ1NlZ0VscyhzZWdzKTsgLy8gcmV0dXJucyBhIHN1YnNldCBvZiB0aGUgc2Vncy4gc2VncyB0aGF0IHdlcmUgYWN0dWFsbHkgcmVuZGVyZWRcblxuXHRcdHRoaXMuZWwuYXBwZW5kKFxuXHRcdFx0dGhpcy5ldmVudFNrZWxldG9uRWwgPSAkKCc8ZGl2IGNsYXNzPVwiZmMtY29udGVudC1za2VsZXRvblwiLz4nKVxuXHRcdFx0XHQuYXBwZW5kKHRoaXMucmVuZGVyU2VnVGFibGUoc2VncykpXG5cdFx0KTtcblxuXHRcdHJldHVybiBzZWdzOyAvLyByZXR1cm4gb25seSB0aGUgc2VncyB0aGF0IHdlcmUgYWN0dWFsbHkgcmVuZGVyZWRcblx0fSxcblxuXG5cdC8vIFVucmVuZGVycyBhbGwgY3VycmVudGx5IHJlbmRlcmVkIGZvcmVncm91bmQgZXZlbnQgc2VnbWVudHNcblx0ZGVzdHJveUZnU2VnczogZnVuY3Rpb24oc2Vncykge1xuXHRcdGlmICh0aGlzLmV2ZW50U2tlbGV0b25FbCkge1xuXHRcdFx0dGhpcy5ldmVudFNrZWxldG9uRWwucmVtb3ZlKCk7XG5cdFx0XHR0aGlzLmV2ZW50U2tlbGV0b25FbCA9IG51bGw7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gUmVuZGVycyBhbmQgcmV0dXJucyB0aGUgPHRhYmxlPiBwb3J0aW9uIG9mIHRoZSBldmVudC1za2VsZXRvbi5cblx0Ly8gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzICd0Ym9keUVsJyBhbmQgJ3NlZ3MnLlxuXHRyZW5kZXJTZWdUYWJsZTogZnVuY3Rpb24oc2Vncykge1xuXHRcdHZhciB0YWJsZUVsID0gJCgnPHRhYmxlPjx0ci8+PC90YWJsZT4nKTtcblx0XHR2YXIgdHJFbCA9IHRhYmxlRWwuZmluZCgndHInKTtcblx0XHR2YXIgc2VnQ29scztcblx0XHR2YXIgaSwgc2VnO1xuXHRcdHZhciBjb2wsIGNvbFNlZ3M7XG5cdFx0dmFyIGNvbnRhaW5lckVsO1xuXG5cdFx0c2VnQ29scyA9IHRoaXMuZ3JvdXBTZWdDb2xzKHNlZ3MpOyAvLyBncm91cCBpbnRvIHN1Yi1hcnJheXMsIGFuZCBhc3NpZ25zICdjb2wnIHRvIGVhY2ggc2VnXG5cblx0XHR0aGlzLmNvbXB1dGVTZWdWZXJ0aWNhbHMoc2Vncyk7IC8vIGNvbXB1dGUgYW5kIGFzc2lnbiB0b3AvYm90dG9tXG5cblx0XHRmb3IgKGNvbCA9IDA7IGNvbCA8IHNlZ0NvbHMubGVuZ3RoOyBjb2wrKykgeyAvLyBpdGVyYXRlIGVhY2ggY29sdW1uIGdyb3VwaW5nXG5cdFx0XHRjb2xTZWdzID0gc2VnQ29sc1tjb2xdO1xuXHRcdFx0cGxhY2VTbG90U2Vncyhjb2xTZWdzKTsgLy8gY29tcHV0ZSBob3Jpem9udGFsIGNvb3JkaW5hdGVzLCB6LWluZGV4J3MsIGFuZCByZW9yZGVyIHRoZSBhcnJheVxuXG5cdFx0XHRjb250YWluZXJFbCA9ICQoJzxkaXYgY2xhc3M9XCJmYy1ldmVudC1jb250YWluZXJcIi8+Jyk7XG5cblx0XHRcdC8vIGFzc2lnbiBwb3NpdGlvbmluZyBDU1MgYW5kIGluc2VydCBpbnRvIGNvbnRhaW5lclxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IGNvbFNlZ3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0c2VnID0gY29sU2Vnc1tpXTtcblx0XHRcdFx0c2VnLmVsLmNzcyh0aGlzLmdlbmVyYXRlU2VnUG9zaXRpb25Dc3Moc2VnKSk7XG5cblx0XHRcdFx0Ly8gaWYgdGhlIGhlaWdodCBpcyBzaG9ydCwgYWRkIGEgY2xhc3NOYW1lIGZvciBhbHRlcm5hdGUgc3R5bGluZ1xuXHRcdFx0XHRpZiAoc2VnLmJvdHRvbSAtIHNlZy50b3AgPCAzMCkge1xuXHRcdFx0XHRcdHNlZy5lbC5hZGRDbGFzcygnZmMtc2hvcnQnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnRhaW5lckVsLmFwcGVuZChzZWcuZWwpO1xuXHRcdFx0fVxuXG5cdFx0XHR0ckVsLmFwcGVuZCgkKCc8dGQvPicpLmFwcGVuZChjb250YWluZXJFbCkpO1xuXHRcdH1cblxuXHRcdHRoaXMuYm9va2VuZENlbGxzKHRyRWwsICdldmVudFNrZWxldG9uJyk7XG5cblx0XHRyZXR1cm4gdGFibGVFbDtcblx0fSxcblxuXG5cdC8vIFJlZnJlc2hlcyB0aGUgQ1NTIHRvcC9ib3R0b20gY29vcmRpbmF0ZXMgZm9yIGVhY2ggc2VnbWVudCBlbGVtZW50LiBQcm9iYWJseSBhZnRlciBhIHdpbmRvdyByZXNpemUvem9vbS5cblx0Ly8gUmVwb3NpdGlvbnMgYnVzaW5lc3MgaG91cnMgc2VncyB0b28sIHNvIG5vdCBqdXN0IGZvciBldmVudHMuIE1heWJlIHNob3VsZG4ndCBiZSBoZXJlLlxuXHR1cGRhdGVTZWdWZXJ0aWNhbHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhbGxTZWdzID0gKHRoaXMuc2VncyB8fCBbXSkuY29uY2F0KHRoaXMuYnVzaW5lc3NIb3VyU2VncyB8fCBbXSk7XG5cdFx0dmFyIGk7XG5cblx0XHR0aGlzLmNvbXB1dGVTZWdWZXJ0aWNhbHMoYWxsU2Vncyk7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgYWxsU2Vncy5sZW5ndGg7IGkrKykge1xuXHRcdFx0YWxsU2Vnc1tpXS5lbC5jc3MoXG5cdFx0XHRcdHRoaXMuZ2VuZXJhdGVTZWdWZXJ0aWNhbENzcyhhbGxTZWdzW2ldKVxuXHRcdFx0KTtcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBGb3IgZWFjaCBzZWdtZW50IGluIGFuIGFycmF5LCBjb21wdXRlcyBhbmQgYXNzaWducyBpdHMgdG9wIGFuZCBib3R0b20gcHJvcGVydGllc1xuXHRjb21wdXRlU2VnVmVydGljYWxzOiBmdW5jdGlvbihzZWdzKSB7XG5cdFx0dmFyIGksIHNlZztcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBzZWdzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRzZWcgPSBzZWdzW2ldO1xuXHRcdFx0c2VnLnRvcCA9IHRoaXMuY29tcHV0ZURhdGVUb3Aoc2VnLnN0YXJ0LCBzZWcuc3RhcnQpO1xuXHRcdFx0c2VnLmJvdHRvbSA9IHRoaXMuY29tcHV0ZURhdGVUb3Aoc2VnLmVuZCwgc2VnLnN0YXJ0KTtcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBSZW5kZXJzIHRoZSBIVE1MIGZvciBhIHNpbmdsZSBldmVudCBzZWdtZW50J3MgZGVmYXVsdCByZW5kZXJpbmdcblx0ZmdTZWdIdG1sOiBmdW5jdGlvbihzZWcsIGRpc2FibGVSZXNpemluZykge1xuXHRcdHZhciB2aWV3ID0gdGhpcy52aWV3O1xuXHRcdHZhciBldmVudCA9IHNlZy5ldmVudDtcblx0XHR2YXIgaXNEcmFnZ2FibGUgPSB2aWV3LmlzRXZlbnREcmFnZ2FibGUoZXZlbnQpO1xuXHRcdHZhciBpc1Jlc2l6YWJsZSA9ICFkaXNhYmxlUmVzaXppbmcgJiYgc2VnLmlzRW5kICYmIHZpZXcuaXNFdmVudFJlc2l6YWJsZShldmVudCk7XG5cdFx0dmFyIGNsYXNzZXMgPSB0aGlzLmdldFNlZ0NsYXNzZXMoc2VnLCBpc0RyYWdnYWJsZSwgaXNSZXNpemFibGUpO1xuXHRcdHZhciBza2luQ3NzID0gdGhpcy5nZXRFdmVudFNraW5Dc3MoZXZlbnQpO1xuXHRcdHZhciB0aW1lVGV4dDtcblx0XHR2YXIgZnVsbFRpbWVUZXh0OyAvLyBtb3JlIHZlcmJvc2UgdGltZSB0ZXh0LiBmb3IgdGhlIHByaW50IHN0eWxlc2hlZXRcblx0XHR2YXIgc3RhcnRUaW1lVGV4dDsgLy8ganVzdCB0aGUgc3RhcnQgdGltZSB0ZXh0XG5cblx0XHRjbGFzc2VzLnVuc2hpZnQoJ2ZjLXRpbWUtZ3JpZC1ldmVudCcpO1xuXG5cdFx0aWYgKHZpZXcuaXNNdWx0aURheUV2ZW50KGV2ZW50KSkgeyAvLyBpZiB0aGUgZXZlbnQgYXBwZWFycyB0byBzcGFuIG1vcmUgdGhhbiBvbmUgZGF5Li4uXG5cdFx0XHQvLyBEb24ndCBkaXNwbGF5IHRpbWUgdGV4dCBvbiBzZWdtZW50cyB0aGF0IHJ1biBlbnRpcmVseSB0aHJvdWdoIGEgZGF5LlxuXHRcdFx0Ly8gVGhhdCB3b3VsZCBhcHBlYXIgYXMgbWlkbmlnaHQtbWlkbmlnaHQgYW5kIHdvdWxkIGxvb2sgZHVtYi5cblx0XHRcdC8vIE90aGVyd2lzZSwgZGlzcGxheSB0aGUgdGltZSB0ZXh0IGZvciB0aGUgKnNlZ21lbnQncyogdGltZXMgKGxpa2UgNnBtLW1pZG5pZ2h0IG9yIG1pZG5pZ2h0LTEwYW0pXG5cdFx0XHRpZiAoc2VnLmlzU3RhcnQgfHwgc2VnLmlzRW5kKSB7XG5cdFx0XHRcdHRpbWVUZXh0ID0gdGhpcy5nZXRFdmVudFRpbWVUZXh0KHNlZyk7XG5cdFx0XHRcdGZ1bGxUaW1lVGV4dCA9IHRoaXMuZ2V0RXZlbnRUaW1lVGV4dChzZWcsICdMVCcpO1xuXHRcdFx0XHRzdGFydFRpbWVUZXh0ID0gdGhpcy5nZXRFdmVudFRpbWVUZXh0KHsgc3RhcnQ6IHNlZy5zdGFydCB9KTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gRGlzcGxheSB0aGUgbm9ybWFsIHRpbWUgdGV4dCBmb3IgdGhlICpldmVudCdzKiB0aW1lc1xuXHRcdFx0dGltZVRleHQgPSB0aGlzLmdldEV2ZW50VGltZVRleHQoZXZlbnQpO1xuXHRcdFx0ZnVsbFRpbWVUZXh0ID0gdGhpcy5nZXRFdmVudFRpbWVUZXh0KGV2ZW50LCAnTFQnKTtcblx0XHRcdHN0YXJ0VGltZVRleHQgPSB0aGlzLmdldEV2ZW50VGltZVRleHQoeyBzdGFydDogZXZlbnQuc3RhcnQgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICc8YSBjbGFzcz1cIicgKyBjbGFzc2VzLmpvaW4oJyAnKSArICdcIicgK1xuXHRcdFx0KGV2ZW50LnVybCA/XG5cdFx0XHRcdCcgaHJlZj1cIicgKyBodG1sRXNjYXBlKGV2ZW50LnVybCkgKyAnXCInIDpcblx0XHRcdFx0Jydcblx0XHRcdFx0KSArXG5cdFx0XHQoc2tpbkNzcyA/XG5cdFx0XHRcdCcgc3R5bGU9XCInICsgc2tpbkNzcyArICdcIicgOlxuXHRcdFx0XHQnJ1xuXHRcdFx0XHQpICtcblx0XHRcdCc+JyArXG5cdFx0XHRcdCc8ZGl2IGNsYXNzPVwiZmMtY29udGVudFwiPicgK1xuXHRcdFx0XHRcdCh0aW1lVGV4dCA/XG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImZjLXRpbWVcIicgK1xuXHRcdFx0XHRcdFx0JyBkYXRhLXN0YXJ0PVwiJyArIGh0bWxFc2NhcGUoc3RhcnRUaW1lVGV4dCkgKyAnXCInICtcblx0XHRcdFx0XHRcdCcgZGF0YS1mdWxsPVwiJyArIGh0bWxFc2NhcGUoZnVsbFRpbWVUZXh0KSArICdcIicgK1xuXHRcdFx0XHRcdFx0Jz4nICtcblx0XHRcdFx0XHRcdFx0JzxzcGFuPicgKyBodG1sRXNjYXBlKHRpbWVUZXh0KSArICc8L3NwYW4+JyArXG5cdFx0XHRcdFx0XHQnPC9kaXY+JyA6XG5cdFx0XHRcdFx0XHQnJ1xuXHRcdFx0XHRcdFx0KSArXG5cdFx0XHRcdFx0KGV2ZW50LnRpdGxlID9cblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiZmMtdGl0bGVcIj4nICtcblx0XHRcdFx0XHRcdFx0aHRtbEVzY2FwZShldmVudC50aXRsZSkgK1xuXHRcdFx0XHRcdFx0JzwvZGl2PicgOlxuXHRcdFx0XHRcdFx0Jydcblx0XHRcdFx0XHRcdCkgK1xuXHRcdFx0XHQnPC9kaXY+JyArXG5cdFx0XHRcdCc8ZGl2IGNsYXNzPVwiZmMtYmdcIi8+JyArXG5cdFx0XHRcdChpc1Jlc2l6YWJsZSA/XG5cdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJmYy1yZXNpemVyXCIvPicgOlxuXHRcdFx0XHRcdCcnXG5cdFx0XHRcdFx0KSArXG5cdFx0XHQnPC9hPic7XG5cdH0sXG5cblxuXHQvLyBHZW5lcmF0ZXMgYW4gb2JqZWN0IHdpdGggQ1NTIHByb3BlcnRpZXMvdmFsdWVzIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gYW4gZXZlbnQgc2VnbWVudCBlbGVtZW50LlxuXHQvLyBDb250YWlucyBpbXBvcnRhbnQgcG9zaXRpb25pbmctcmVsYXRlZCBwcm9wZXJ0aWVzIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gYW55IGV2ZW50IGVsZW1lbnQsIGN1c3RvbWl6ZWQgb3Igbm90LlxuXHRnZW5lcmF0ZVNlZ1Bvc2l0aW9uQ3NzOiBmdW5jdGlvbihzZWcpIHtcblx0XHR2YXIgc2hvdWxkT3ZlcmxhcCA9IHRoaXMudmlldy5vcHQoJ3Nsb3RFdmVudE92ZXJsYXAnKTtcblx0XHR2YXIgYmFja3dhcmRDb29yZCA9IHNlZy5iYWNrd2FyZENvb3JkOyAvLyB0aGUgbGVmdCBzaWRlIGlmIExUUi4gdGhlIHJpZ2h0IHNpZGUgaWYgUlRMLiBmbG9hdGluZy1wb2ludFxuXHRcdHZhciBmb3J3YXJkQ29vcmQgPSBzZWcuZm9yd2FyZENvb3JkOyAvLyB0aGUgcmlnaHQgc2lkZSBpZiBMVFIuIHRoZSBsZWZ0IHNpZGUgaWYgUlRMLiBmbG9hdGluZy1wb2ludFxuXHRcdHZhciBwcm9wcyA9IHRoaXMuZ2VuZXJhdGVTZWdWZXJ0aWNhbENzcyhzZWcpOyAvLyBnZXQgdG9wL2JvdHRvbSBmaXJzdFxuXHRcdHZhciBsZWZ0OyAvLyBhbW91bnQgb2Ygc3BhY2UgZnJvbSBsZWZ0IGVkZ2UsIGEgZnJhY3Rpb24gb2YgdGhlIHRvdGFsIHdpZHRoXG5cdFx0dmFyIHJpZ2h0OyAvLyBhbW91bnQgb2Ygc3BhY2UgZnJvbSByaWdodCBlZGdlLCBhIGZyYWN0aW9uIG9mIHRoZSB0b3RhbCB3aWR0aFxuXG5cdFx0aWYgKHNob3VsZE92ZXJsYXApIHtcblx0XHRcdC8vIGRvdWJsZSB0aGUgd2lkdGgsIGJ1dCBkb24ndCBnbyBiZXlvbmQgdGhlIG1heGltdW0gZm9yd2FyZCBjb29yZGluYXRlICgxLjApXG5cdFx0XHRmb3J3YXJkQ29vcmQgPSBNYXRoLm1pbigxLCBiYWNrd2FyZENvb3JkICsgKGZvcndhcmRDb29yZCAtIGJhY2t3YXJkQ29vcmQpICogMik7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuaXNSVEwpIHtcblx0XHRcdGxlZnQgPSAxIC0gZm9yd2FyZENvb3JkO1xuXHRcdFx0cmlnaHQgPSBiYWNrd2FyZENvb3JkO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGxlZnQgPSBiYWNrd2FyZENvb3JkO1xuXHRcdFx0cmlnaHQgPSAxIC0gZm9yd2FyZENvb3JkO1xuXHRcdH1cblxuXHRcdHByb3BzLnpJbmRleCA9IHNlZy5sZXZlbCArIDE7IC8vIGNvbnZlcnQgZnJvbSAwLWJhc2UgdG8gMS1iYXNlZFxuXHRcdHByb3BzLmxlZnQgPSBsZWZ0ICogMTAwICsgJyUnO1xuXHRcdHByb3BzLnJpZ2h0ID0gcmlnaHQgKiAxMDAgKyAnJSc7XG5cblx0XHRpZiAoc2hvdWxkT3ZlcmxhcCAmJiBzZWcuZm9yd2FyZFByZXNzdXJlKSB7XG5cdFx0XHQvLyBhZGQgcGFkZGluZyB0byB0aGUgZWRnZSBzbyB0aGF0IGZvcndhcmQgc3RhY2tlZCBldmVudHMgZG9uJ3QgY292ZXIgdGhlIHJlc2l6ZXIncyBpY29uXG5cdFx0XHRwcm9wc1t0aGlzLmlzUlRMID8gJ21hcmdpbkxlZnQnIDogJ21hcmdpblJpZ2h0J10gPSAxMCAqIDI7IC8vIDEwIGlzIGEgZ3Vlc3N0aW1hdGUgb2YgdGhlIGljb24ncyB3aWR0aFxuXHRcdH1cblxuXHRcdHJldHVybiBwcm9wcztcblx0fSxcblxuXG5cdC8vIEdlbmVyYXRlcyBhbiBvYmplY3Qgd2l0aCBDU1MgcHJvcGVydGllcyBmb3IgdGhlIHRvcC9ib3R0b20gY29vcmRpbmF0ZXMgb2YgYSBzZWdtZW50IGVsZW1lbnRcblx0Z2VuZXJhdGVTZWdWZXJ0aWNhbENzczogZnVuY3Rpb24oc2VnKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHRvcDogc2VnLnRvcCxcblx0XHRcdGJvdHRvbTogLXNlZy5ib3R0b20gLy8gZmxpcHBlZCBiZWNhdXNlIG5lZWRzIHRvIGJlIHNwYWNlIGJleW9uZCBib3R0b20gZWRnZSBvZiBldmVudCBjb250YWluZXJcblx0XHR9O1xuXHR9LFxuXG5cblx0Ly8gR2l2ZW4gYSBmbGF0IGFycmF5IG9mIHNlZ21lbnRzLCByZXR1cm4gYW4gYXJyYXkgb2Ygc3ViLWFycmF5cywgZ3JvdXBlZCBieSBlYWNoIHNlZ21lbnQncyBjb2xcblx0Z3JvdXBTZWdDb2xzOiBmdW5jdGlvbihzZWdzKSB7XG5cdFx0dmFyIHNlZ0NvbHMgPSBbXTtcblx0XHR2YXIgaTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCB0aGlzLmNvbENudDsgaSsrKSB7XG5cdFx0XHRzZWdDb2xzLnB1c2goW10pO1xuXHRcdH1cblxuXHRcdGZvciAoaSA9IDA7IGkgPCBzZWdzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRzZWdDb2xzW3NlZ3NbaV0uY29sXS5wdXNoKHNlZ3NbaV0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBzZWdDb2xzO1xuXHR9XG5cbn0pO1xuXG5cbi8vIEdpdmVuIGFuIGFycmF5IG9mIHNlZ21lbnRzIHRoYXQgYXJlIGFsbCBpbiB0aGUgc2FtZSBjb2x1bW4sIHNldHMgdGhlIGJhY2t3YXJkQ29vcmQgYW5kIGZvcndhcmRDb29yZCBvbiBlYWNoLlxuLy8gQWxzbyByZW9yZGVycyB0aGUgZ2l2ZW4gYXJyYXkgYnkgZGF0ZSFcbmZ1bmN0aW9uIHBsYWNlU2xvdFNlZ3Moc2Vncykge1xuXHR2YXIgbGV2ZWxzO1xuXHR2YXIgbGV2ZWwwO1xuXHR2YXIgaTtcblxuXHRzZWdzLnNvcnQoY29tcGFyZVNlZ3MpOyAvLyBvcmRlciBieSBkYXRlXG5cdGxldmVscyA9IGJ1aWxkU2xvdFNlZ0xldmVscyhzZWdzKTtcblx0Y29tcHV0ZUZvcndhcmRTbG90U2VncyhsZXZlbHMpO1xuXG5cdGlmICgobGV2ZWwwID0gbGV2ZWxzWzBdKSkge1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxldmVsMC5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29tcHV0ZVNsb3RTZWdQcmVzc3VyZXMobGV2ZWwwW2ldKTtcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgbGV2ZWwwLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb21wdXRlU2xvdFNlZ0Nvb3JkcyhsZXZlbDBbaV0sIDAsIDApO1xuXHRcdH1cblx0fVxufVxuXG5cbi8vIEJ1aWxkcyBhbiBhcnJheSBvZiBzZWdtZW50cyBcImxldmVsc1wiLiBUaGUgZmlyc3QgbGV2ZWwgd2lsbCBiZSB0aGUgbGVmdG1vc3QgdGllciBvZiBzZWdtZW50cyBpZiB0aGUgY2FsZW5kYXIgaXNcbi8vIGxlZnQtdG8tcmlnaHQsIG9yIHRoZSByaWdodG1vc3QgaWYgdGhlIGNhbGVuZGFyIGlzIHJpZ2h0LXRvLWxlZnQuIEFzc3VtZXMgdGhlIHNlZ21lbnRzIGFyZSBhbHJlYWR5IG9yZGVyZWQgYnkgZGF0ZS5cbmZ1bmN0aW9uIGJ1aWxkU2xvdFNlZ0xldmVscyhzZWdzKSB7XG5cdHZhciBsZXZlbHMgPSBbXTtcblx0dmFyIGksIHNlZztcblx0dmFyIGo7XG5cblx0Zm9yIChpPTA7IGk8c2Vncy5sZW5ndGg7IGkrKykge1xuXHRcdHNlZyA9IHNlZ3NbaV07XG5cblx0XHQvLyBnbyB0aHJvdWdoIGFsbCB0aGUgbGV2ZWxzIGFuZCBzdG9wIG9uIHRoZSBmaXJzdCBsZXZlbCB3aGVyZSB0aGVyZSBhcmUgbm8gY29sbGlzaW9uc1xuXHRcdGZvciAoaj0wOyBqPGxldmVscy5sZW5ndGg7IGorKykge1xuXHRcdFx0aWYgKCFjb21wdXRlU2xvdFNlZ0NvbGxpc2lvbnMoc2VnLCBsZXZlbHNbal0pLmxlbmd0aCkge1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRzZWcubGV2ZWwgPSBqO1xuXG5cdFx0KGxldmVsc1tqXSB8fCAobGV2ZWxzW2pdID0gW10pKS5wdXNoKHNlZyk7XG5cdH1cblxuXHRyZXR1cm4gbGV2ZWxzO1xufVxuXG5cbi8vIEZvciBldmVyeSBzZWdtZW50LCBmaWd1cmUgb3V0IHRoZSBvdGhlciBzZWdtZW50cyB0aGF0IGFyZSBpbiBzdWJzZXF1ZW50XG4vLyBsZXZlbHMgdGhhdCBhbHNvIG9jY3VweSB0aGUgc2FtZSB2ZXJ0aWNhbCBzcGFjZS4gQWNjdW11bGF0ZSBpbiBzZWcuZm9yd2FyZFNlZ3NcbmZ1bmN0aW9uIGNvbXB1dGVGb3J3YXJkU2xvdFNlZ3MobGV2ZWxzKSB7XG5cdHZhciBpLCBsZXZlbDtcblx0dmFyIGosIHNlZztcblx0dmFyIGs7XG5cblx0Zm9yIChpPTA7IGk8bGV2ZWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV2ZWwgPSBsZXZlbHNbaV07XG5cblx0XHRmb3IgKGo9MDsgajxsZXZlbC5sZW5ndGg7IGorKykge1xuXHRcdFx0c2VnID0gbGV2ZWxbal07XG5cblx0XHRcdHNlZy5mb3J3YXJkU2VncyA9IFtdO1xuXHRcdFx0Zm9yIChrPWkrMTsgazxsZXZlbHMubGVuZ3RoOyBrKyspIHtcblx0XHRcdFx0Y29tcHV0ZVNsb3RTZWdDb2xsaXNpb25zKHNlZywgbGV2ZWxzW2tdLCBzZWcuZm9yd2FyZFNlZ3MpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuXG5cbi8vIEZpZ3VyZSBvdXQgd2hpY2ggcGF0aCBmb3J3YXJkICh2aWEgc2VnLmZvcndhcmRTZWdzKSByZXN1bHRzIGluIHRoZSBsb25nZXN0IHBhdGggdW50aWxcbi8vIHRoZSBmdXJ0aGVzdCBlZGdlIGlzIHJlYWNoZWQuIFRoZSBudW1iZXIgb2Ygc2VnbWVudHMgaW4gdGhpcyBwYXRoIHdpbGwgYmUgc2VnLmZvcndhcmRQcmVzc3VyZVxuZnVuY3Rpb24gY29tcHV0ZVNsb3RTZWdQcmVzc3VyZXMoc2VnKSB7XG5cdHZhciBmb3J3YXJkU2VncyA9IHNlZy5mb3J3YXJkU2Vncztcblx0dmFyIGZvcndhcmRQcmVzc3VyZSA9IDA7XG5cdHZhciBpLCBmb3J3YXJkU2VnO1xuXG5cdGlmIChzZWcuZm9yd2FyZFByZXNzdXJlID09PSB1bmRlZmluZWQpIHsgLy8gbm90IGFscmVhZHkgY29tcHV0ZWRcblxuXHRcdGZvciAoaT0wOyBpPGZvcndhcmRTZWdzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRmb3J3YXJkU2VnID0gZm9yd2FyZFNlZ3NbaV07XG5cblx0XHRcdC8vIGZpZ3VyZSBvdXQgdGhlIGNoaWxkJ3MgbWF4aW11bSBmb3J3YXJkIHBhdGhcblx0XHRcdGNvbXB1dGVTbG90U2VnUHJlc3N1cmVzKGZvcndhcmRTZWcpO1xuXG5cdFx0XHQvLyBlaXRoZXIgdXNlIHRoZSBleGlzdGluZyBtYXhpbXVtLCBvciB1c2UgdGhlIGNoaWxkJ3MgZm9yd2FyZCBwcmVzc3VyZVxuXHRcdFx0Ly8gcGx1cyBvbmUgKGZvciB0aGUgZm9yd2FyZFNlZyBpdHNlbGYpXG5cdFx0XHRmb3J3YXJkUHJlc3N1cmUgPSBNYXRoLm1heChcblx0XHRcdFx0Zm9yd2FyZFByZXNzdXJlLFxuXHRcdFx0XHQxICsgZm9yd2FyZFNlZy5mb3J3YXJkUHJlc3N1cmVcblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0c2VnLmZvcndhcmRQcmVzc3VyZSA9IGZvcndhcmRQcmVzc3VyZTtcblx0fVxufVxuXG5cbi8vIENhbGN1bGF0ZSBzZWcuZm9yd2FyZENvb3JkIGFuZCBzZWcuYmFja3dhcmRDb29yZCBmb3IgdGhlIHNlZ21lbnQsIHdoZXJlIGJvdGggdmFsdWVzIHJhbmdlXG4vLyBmcm9tIDAgdG8gMS4gSWYgdGhlIGNhbGVuZGFyIGlzIGxlZnQtdG8tcmlnaHQsIHRoZSBzZWcuYmFja3dhcmRDb29yZCBtYXBzIHRvIFwibGVmdFwiIGFuZFxuLy8gc2VnLmZvcndhcmRDb29yZCBtYXBzIHRvIFwicmlnaHRcIiAodmlhIHBlcmNlbnRhZ2UpLiBWaWNlLXZlcnNhIGlmIHRoZSBjYWxlbmRhciBpcyByaWdodC10by1sZWZ0LlxuLy9cbi8vIFRoZSBzZWdtZW50IG1pZ2h0IGJlIHBhcnQgb2YgYSBcInNlcmllc1wiLCB3aGljaCBtZWFucyBjb25zZWN1dGl2ZSBzZWdtZW50cyB3aXRoIHRoZSBzYW1lIHByZXNzdXJlXG4vLyB3aG8ncyB3aWR0aCBpcyB1bmtub3duIHVudGlsIGFuIGVkZ2UgaGFzIGJlZW4gaGl0LiBgc2VyaWVzQmFja3dhcmRQcmVzc3VyZWAgaXMgdGhlIG51bWJlciBvZlxuLy8gc2VnbWVudHMgYmVoaW5kIHRoaXMgb25lIGluIHRoZSBjdXJyZW50IHNlcmllcywgYW5kIGBzZXJpZXNCYWNrd2FyZENvb3JkYCBpcyB0aGUgc3RhcnRpbmdcbi8vIGNvb3JkaW5hdGUgb2YgdGhlIGZpcnN0IHNlZ21lbnQgaW4gdGhlIHNlcmllcy5cbmZ1bmN0aW9uIGNvbXB1dGVTbG90U2VnQ29vcmRzKHNlZywgc2VyaWVzQmFja3dhcmRQcmVzc3VyZSwgc2VyaWVzQmFja3dhcmRDb29yZCkge1xuXHR2YXIgZm9yd2FyZFNlZ3MgPSBzZWcuZm9yd2FyZFNlZ3M7XG5cdHZhciBpO1xuXG5cdGlmIChzZWcuZm9yd2FyZENvb3JkID09PSB1bmRlZmluZWQpIHsgLy8gbm90IGFscmVhZHkgY29tcHV0ZWRcblxuXHRcdGlmICghZm9yd2FyZFNlZ3MubGVuZ3RoKSB7XG5cblx0XHRcdC8vIGlmIHRoZXJlIGFyZSBubyBmb3J3YXJkIHNlZ21lbnRzLCB0aGlzIHNlZ21lbnQgc2hvdWxkIGJ1dHQgdXAgYWdhaW5zdCB0aGUgZWRnZVxuXHRcdFx0c2VnLmZvcndhcmRDb29yZCA9IDE7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXG5cdFx0XHQvLyBzb3J0IGhpZ2hlc3QgcHJlc3N1cmUgZmlyc3Rcblx0XHRcdGZvcndhcmRTZWdzLnNvcnQoY29tcGFyZUZvcndhcmRTbG90U2Vncyk7XG5cblx0XHRcdC8vIHRoaXMgc2VnbWVudCdzIGZvcndhcmRDb29yZCB3aWxsIGJlIGNhbGN1bGF0ZWQgZnJvbSB0aGUgYmFja3dhcmRDb29yZCBvZiB0aGVcblx0XHRcdC8vIGhpZ2hlc3QtcHJlc3N1cmUgZm9yd2FyZCBzZWdtZW50LlxuXHRcdFx0Y29tcHV0ZVNsb3RTZWdDb29yZHMoZm9yd2FyZFNlZ3NbMF0sIHNlcmllc0JhY2t3YXJkUHJlc3N1cmUgKyAxLCBzZXJpZXNCYWNrd2FyZENvb3JkKTtcblx0XHRcdHNlZy5mb3J3YXJkQ29vcmQgPSBmb3J3YXJkU2Vnc1swXS5iYWNrd2FyZENvb3JkO1xuXHRcdH1cblxuXHRcdC8vIGNhbGN1bGF0ZSB0aGUgYmFja3dhcmRDb29yZCBmcm9tIHRoZSBmb3J3YXJkQ29vcmQuIGNvbnNpZGVyIHRoZSBzZXJpZXNcblx0XHRzZWcuYmFja3dhcmRDb29yZCA9IHNlZy5mb3J3YXJkQ29vcmQgLVxuXHRcdFx0KHNlZy5mb3J3YXJkQ29vcmQgLSBzZXJpZXNCYWNrd2FyZENvb3JkKSAvIC8vIGF2YWlsYWJsZSB3aWR0aCBmb3Igc2VyaWVzXG5cdFx0XHQoc2VyaWVzQmFja3dhcmRQcmVzc3VyZSArIDEpOyAvLyAjIG9mIHNlZ21lbnRzIGluIHRoZSBzZXJpZXNcblxuXHRcdC8vIHVzZSB0aGlzIHNlZ21lbnQncyBjb29yZGluYXRlcyB0byBjb21wdXRlZCB0aGUgY29vcmRpbmF0ZXMgb2YgdGhlIGxlc3MtcHJlc3N1cml6ZWRcblx0XHQvLyBmb3J3YXJkIHNlZ21lbnRzXG5cdFx0Zm9yIChpPTA7IGk8Zm9yd2FyZFNlZ3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbXB1dGVTbG90U2VnQ29vcmRzKGZvcndhcmRTZWdzW2ldLCAwLCBzZWcuZm9yd2FyZENvb3JkKTtcblx0XHR9XG5cdH1cbn1cblxuXG4vLyBGaW5kIGFsbCB0aGUgc2VnbWVudHMgaW4gYG90aGVyU2Vnc2AgdGhhdCB2ZXJ0aWNhbGx5IGNvbGxpZGUgd2l0aCBgc2VnYC5cbi8vIEFwcGVuZCBpbnRvIGFuIG9wdGlvbmFsbHktc3VwcGxpZWQgYHJlc3VsdHNgIGFycmF5IGFuZCByZXR1cm4uXG5mdW5jdGlvbiBjb21wdXRlU2xvdFNlZ0NvbGxpc2lvbnMoc2VnLCBvdGhlclNlZ3MsIHJlc3VsdHMpIHtcblx0cmVzdWx0cyA9IHJlc3VsdHMgfHwgW107XG5cblx0Zm9yICh2YXIgaT0wOyBpPG90aGVyU2Vncy5sZW5ndGg7IGkrKykge1xuXHRcdGlmIChpc1Nsb3RTZWdDb2xsaXNpb24oc2VnLCBvdGhlclNlZ3NbaV0pKSB7XG5cdFx0XHRyZXN1bHRzLnB1c2gob3RoZXJTZWdzW2ldKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0cztcbn1cblxuXG4vLyBEbyB0aGVzZSBzZWdtZW50cyBvY2N1cHkgdGhlIHNhbWUgdmVydGljYWwgc3BhY2U/XG5mdW5jdGlvbiBpc1Nsb3RTZWdDb2xsaXNpb24oc2VnMSwgc2VnMikge1xuXHRyZXR1cm4gc2VnMS5ib3R0b20gPiBzZWcyLnRvcCAmJiBzZWcxLnRvcCA8IHNlZzIuYm90dG9tO1xufVxuXG5cbi8vIEEgY21wIGZ1bmN0aW9uIGZvciBkZXRlcm1pbmluZyB3aGljaCBmb3J3YXJkIHNlZ21lbnQgdG8gcmVseSBvbiBtb3JlIHdoZW4gY29tcHV0aW5nIGNvb3JkaW5hdGVzLlxuZnVuY3Rpb24gY29tcGFyZUZvcndhcmRTbG90U2VncyhzZWcxLCBzZWcyKSB7XG5cdC8vIHB1dCBoaWdoZXItcHJlc3N1cmUgZmlyc3Rcblx0cmV0dXJuIHNlZzIuZm9yd2FyZFByZXNzdXJlIC0gc2VnMS5mb3J3YXJkUHJlc3N1cmUgfHxcblx0XHQvLyBwdXQgc2VnbWVudHMgdGhhdCBhcmUgY2xvc2VyIHRvIGluaXRpYWwgZWRnZSBmaXJzdCAoYW5kIGZhdm9yIG9uZXMgd2l0aCBubyBjb29yZHMgeWV0KVxuXHRcdChzZWcxLmJhY2t3YXJkQ29vcmQgfHwgMCkgLSAoc2VnMi5iYWNrd2FyZENvb3JkIHx8IDApIHx8XG5cdFx0Ly8gZG8gbm9ybWFsIHNvcnRpbmcuLi5cblx0XHRjb21wYXJlU2VncyhzZWcxLCBzZWcyKTtcbn1cblxuICAgIC8qIEFuIGFic3RyYWN0IGNsYXNzIGZyb20gd2hpY2ggb3RoZXIgdmlld3MgaW5oZXJpdCBmcm9tXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxudmFyIFZpZXcgPSBmYy5WaWV3ID0gQ2xhc3MuZXh0ZW5kKHtcblxuXHR0eXBlOiBudWxsLCAvLyBzdWJjbGFzcycgdmlldyBuYW1lIChzdHJpbmcpXG5cdG5hbWU6IG51bGwsIC8vIGRlcHJlY2F0ZWQuIHVzZSBgdHlwZWAgaW5zdGVhZFxuXG5cdGNhbGVuZGFyOiBudWxsLCAvLyBvd25lciBDYWxlbmRhciBvYmplY3Rcblx0b3B0aW9uczogbnVsbCwgLy8gdmlldy1zcGVjaWZpYyBvcHRpb25zXG5cdGNvb3JkTWFwOiBudWxsLCAvLyBhIENvb3JkTWFwIG9iamVjdCBmb3IgY29udmVydGluZyBwaXhlbCByZWdpb25zIHRvIGRhdGVzXG5cdGVsOiBudWxsLCAvLyB0aGUgdmlldydzIGNvbnRhaW5pbmcgZWxlbWVudC4gc2V0IGJ5IENhbGVuZGFyXG5cblx0Ly8gcmFuZ2UgdGhlIHZpZXcgaXMgYWN0dWFsbHkgZGlzcGxheWluZyAobW9tZW50cylcblx0c3RhcnQ6IG51bGwsXG5cdGVuZDogbnVsbCwgLy8gZXhjbHVzaXZlXG5cblx0Ly8gcmFuZ2UgdGhlIHZpZXcgaXMgZm9ybWFsbHkgcmVzcG9uc2libGUgZm9yIChtb21lbnRzKVxuXHQvLyBtYXkgYmUgZGlmZmVyZW50IGZyb20gc3RhcnQvZW5kLiBmb3IgZXhhbXBsZSwgYSBtb250aCB2aWV3IG1pZ2h0IGhhdmUgMXN0LTMxc3QsIGV4Y2x1ZGluZyBwYWRkZWQgZGF0ZXNcblx0aW50ZXJ2YWxTdGFydDogbnVsbCxcblx0aW50ZXJ2YWxFbmQ6IG51bGwsIC8vIGV4Y2x1c2l2ZVxuXG5cdGludGVydmFsRHVyYXRpb246IG51bGwsIC8vIHRoZSB3aG9sZS11bml0IGR1cmF0aW9uIHRoYXQgaXMgYmVpbmcgZGlzcGxheWVkXG5cdGludGVydmFsVW5pdDogbnVsbCwgLy8gbmFtZSBvZiBsYXJnZXN0IHVuaXQgYmVpbmcgZGlzcGxheWVkLCBsaWtlIFwibW9udGhcIiBvciBcIndlZWtcIlxuXG5cdGlzU2VsZWN0ZWQ6IGZhbHNlLCAvLyBib29sZWFuIHdoZXRoZXIgYSByYW5nZSBvZiB0aW1lIGlzIHVzZXItc2VsZWN0ZWQgb3Igbm90XG5cblx0Ly8gc3ViY2xhc3NlcyBjYW4gb3B0aW9uYWxseSB1c2UgYSBzY3JvbGwgY29udGFpbmVyXG5cdHNjcm9sbGVyRWw6IG51bGwsIC8vIHRoZSBlbGVtZW50IHRoYXQgd2lsbCBtb3N0IGxpa2VseSBzY3JvbGwgd2hlbiBjb250ZW50IGlzIHRvbyB0YWxsXG5cdHNjcm9sbFRvcDogbnVsbCwgLy8gY2FjaGVkIHZlcnRpY2FsIHNjcm9sbCB2YWx1ZVxuXG5cdC8vIGNsYXNzTmFtZXMgc3R5bGVkIGJ5IGpxdWkgdGhlbWVzXG5cdHdpZGdldEhlYWRlckNsYXNzOiBudWxsLFxuXHR3aWRnZXRDb250ZW50Q2xhc3M6IG51bGwsXG5cdGhpZ2hsaWdodFN0YXRlQ2xhc3M6IG51bGwsXG5cblx0Ly8gZm9yIGRhdGUgdXRpbHMsIGNvbXB1dGVkIGZyb20gb3B0aW9uc1xuXHRuZXh0RGF5VGhyZXNob2xkOiBudWxsLFxuXHRpc0hpZGRlbkRheUhhc2g6IG51bGwsXG5cblx0Ly8gZG9jdW1lbnQgaGFuZGxlcnMsIGJvdW5kIHRvIGB0aGlzYCBvYmplY3Rcblx0ZG9jdW1lbnRNb3VzZWRvd25Qcm94eTogbnVsbCwgLy8gVE9ETzogZG9lc24ndCB3b3JrIHdpdGggdG91Y2hcblxuXG5cdGNvbnN0cnVjdG9yOiBmdW5jdGlvbihjYWxlbmRhciwgdmlld09wdGlvbnMsIHZpZXdUeXBlKSB7XG5cdFx0dGhpcy5jYWxlbmRhciA9IGNhbGVuZGFyO1xuXHRcdHRoaXMub3B0aW9ucyA9IHZpZXdPcHRpb25zO1xuXHRcdHRoaXMudHlwZSA9IHRoaXMubmFtZSA9IHZpZXdUeXBlOyAvLyAubmFtZSBpcyBkZXByZWNhdGVkXG5cblx0XHR0aGlzLm5leHREYXlUaHJlc2hvbGQgPSBtb21lbnQuZHVyYXRpb24odGhpcy5vcHQoJ25leHREYXlUaHJlc2hvbGQnKSk7XG5cdFx0dGhpcy5pbml0VGhlbWluZygpO1xuXHRcdHRoaXMuaW5pdEhpZGRlbkRheXMoKTtcblxuXHRcdHRoaXMuZG9jdW1lbnRNb3VzZWRvd25Qcm94eSA9ICQucHJveHkodGhpcywgJ2RvY3VtZW50TW91c2Vkb3duJyk7XG5cblx0XHR0aGlzLmluaXRpYWxpemUoKTtcblx0fSxcblxuXG5cdC8vIEEgZ29vZCBwbGFjZSBmb3Igc3ViY2xhc3NlcyB0byBpbml0aWFsaXplIG1lbWJlciB2YXJpYWJsZXNcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gc3ViY2xhc3NlcyBjYW4gaW1wbGVtZW50XG5cdH0sXG5cblxuXHQvLyBSZXRyaWV2ZXMgYW4gb3B0aW9uIHdpdGggdGhlIGdpdmVuIG5hbWVcblx0b3B0OiBmdW5jdGlvbihuYW1lKSB7XG5cdFx0dmFyIHZhbDtcblxuXHRcdHZhbCA9IHRoaXMub3B0aW9uc1tuYW1lXTsgLy8gbG9vayBhdCB2aWV3LXNwZWNpZmljIG9wdGlvbnMgZmlyc3Rcblx0XHRpZiAodmFsICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiB2YWw7XG5cdFx0fVxuXG5cdFx0dmFsID0gdGhpcy5jYWxlbmRhci5vcHRpb25zW25hbWVdO1xuXHRcdGlmICgkLmlzUGxhaW5PYmplY3QodmFsKSAmJiAhaXNGb3JjZWRBdG9taWNPcHRpb24obmFtZSkpIHsgLy8gdmlldy1vcHRpb24taGFzaGVzIGFyZSBkZXByZWNhdGVkXG5cdFx0XHRyZXR1cm4gc21hcnRQcm9wZXJ0eSh2YWwsIHRoaXMudHlwZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHZhbDtcblx0fSxcblxuXG5cdC8vIFRyaWdnZXJzIGhhbmRsZXJzIHRoYXQgYXJlIHZpZXctcmVsYXRlZC4gTW9kaWZpZXMgYXJncyBiZWZvcmUgcGFzc2luZyB0byBjYWxlbmRhci5cblx0dHJpZ2dlcjogZnVuY3Rpb24obmFtZSwgdGhpc09iaikgeyAvLyBhcmd1bWVudHMgYmV5b25kIHRoaXNPYmogYXJlIHBhc3NlZCBhbG9uZ1xuXHRcdHZhciBjYWxlbmRhciA9IHRoaXMuY2FsZW5kYXI7XG5cblx0XHRyZXR1cm4gY2FsZW5kYXIudHJpZ2dlci5hcHBseShcblx0XHRcdGNhbGVuZGFyLFxuXHRcdFx0W25hbWUsIHRoaXNPYmogfHwgdGhpc10uY29uY2F0KFxuXHRcdFx0XHRBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpLCAvLyBhcmd1bWVudHMgYmV5b25kIHRoaXNPYmpcblx0XHRcdFx0WyB0aGlzIF0gLy8gYWx3YXlzIG1ha2UgdGhlIGxhc3QgYXJndW1lbnQgYSByZWZlcmVuY2UgdG8gdGhlIHZpZXcuIFRPRE86IGRlcHJlY2F0ZVxuXHRcdFx0KVxuXHRcdCk7XG5cdH0sXG5cblxuXHQvKiBEYXRlc1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gVXBkYXRlcyBhbGwgaW50ZXJuYWwgZGF0ZXMgdG8gY2VudGVyIGFyb3VuZCB0aGUgZ2l2ZW4gY3VycmVudCBkYXRlXG5cdHNldERhdGU6IGZ1bmN0aW9uKGRhdGUpIHtcblx0XHR0aGlzLnNldFJhbmdlKHRoaXMuY29tcHV0ZVJhbmdlKGRhdGUpKTtcblx0fSxcblxuXG5cdC8vIFVwZGF0ZXMgYWxsIGludGVybmFsIGRhdGVzIGZvciBkaXNwbGF5aW5nIHRoZSBnaXZlbiByYW5nZS5cblx0Ly8gRXhwZWN0cyBhbGwgdmFsdWVzIHRvIGJlIG5vcm1hbGl6ZWQgKGxpa2Ugd2hhdCBjb21wdXRlUmFuZ2UgZG9lcykuXG5cdHNldFJhbmdlOiBmdW5jdGlvbihyYW5nZSkge1xuXHRcdCQuZXh0ZW5kKHRoaXMsIHJhbmdlKTtcblx0fSxcblxuXG5cdC8vIEdpdmVuIGEgc2luZ2xlIGN1cnJlbnQgZGF0ZSwgcHJvZHVjZSBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IHJhbmdlIHRvIGRpc3BsYXkuXG5cdC8vIFN1YmNsYXNzZXMgY2FuIG92ZXJyaWRlLiBNdXN0IHJldHVybiBhbGwgcHJvcGVydGllcy5cblx0Y29tcHV0ZVJhbmdlOiBmdW5jdGlvbihkYXRlKSB7XG5cdFx0dmFyIGludGVydmFsRHVyYXRpb24gPSBtb21lbnQuZHVyYXRpb24odGhpcy5vcHQoJ2R1cmF0aW9uJykgfHwgdGhpcy5jb25zdHJ1Y3Rvci5kdXJhdGlvbiB8fCB7IGRheXM6IDEgfSk7XG5cdFx0dmFyIGludGVydmFsVW5pdCA9IGNvbXB1dGVJbnRlcnZhbFVuaXQoaW50ZXJ2YWxEdXJhdGlvbik7XG5cdFx0dmFyIGludGVydmFsU3RhcnQgPSBkYXRlLmNsb25lKCkuc3RhcnRPZihpbnRlcnZhbFVuaXQpO1xuXHRcdHZhciBpbnRlcnZhbEVuZCA9IGludGVydmFsU3RhcnQuY2xvbmUoKS5hZGQoaW50ZXJ2YWxEdXJhdGlvbik7XG5cdFx0dmFyIHN0YXJ0LCBlbmQ7XG5cblx0XHQvLyBub3JtYWxpemUgdGhlIHJhbmdlJ3MgdGltZS1hbWJpZ3VpdHlcblx0XHRpZiAoY29tcHV0ZUludGVydmFsQXMoJ2RheXMnLCBpbnRlcnZhbER1cmF0aW9uKSkgeyAvLyB3aG9sZS1kYXlzP1xuXHRcdFx0aW50ZXJ2YWxTdGFydC5zdHJpcFRpbWUoKTtcblx0XHRcdGludGVydmFsRW5kLnN0cmlwVGltZSgpO1xuXHRcdH1cblx0XHRlbHNlIHsgLy8gbmVlZHMgdG8gaGF2ZSBhIHRpbWU/XG5cdFx0XHRpZiAoIWludGVydmFsU3RhcnQuaGFzVGltZSgpKSB7XG5cdFx0XHRcdGludGVydmFsU3RhcnQgPSB0aGlzLmNhbGVuZGFyLnJlem9uZURhdGUoaW50ZXJ2YWxTdGFydCk7IC8vIGNvbnZlcnQgdG8gY3VycmVudCB0aW1lem9uZSwgd2l0aCAwMDowMFxuXHRcdFx0fVxuXHRcdFx0aWYgKCFpbnRlcnZhbEVuZC5oYXNUaW1lKCkpIHtcblx0XHRcdFx0aW50ZXJ2YWxFbmQgPSB0aGlzLmNhbGVuZGFyLnJlem9uZURhdGUoaW50ZXJ2YWxFbmQpOyAvLyBjb252ZXJ0IHRvIGN1cnJlbnQgdGltZXpvbmUsIHdpdGggMDA6MDBcblx0XHRcdH1cblx0XHR9XG5cblx0XHRzdGFydCA9IGludGVydmFsU3RhcnQuY2xvbmUoKTtcblx0XHRzdGFydCA9IHRoaXMuc2tpcEhpZGRlbkRheXMoc3RhcnQpO1xuXHRcdGVuZCA9IGludGVydmFsRW5kLmNsb25lKCk7XG5cdFx0ZW5kID0gdGhpcy5za2lwSGlkZGVuRGF5cyhlbmQsIC0xLCB0cnVlKTsgLy8gZXhjbHVzaXZlbHkgbW92ZSBiYWNrd2FyZHNcblxuXHRcdHJldHVybiB7XG5cdFx0XHRpbnRlcnZhbER1cmF0aW9uOiBpbnRlcnZhbER1cmF0aW9uLFxuXHRcdFx0aW50ZXJ2YWxVbml0OiBpbnRlcnZhbFVuaXQsXG5cdFx0XHRpbnRlcnZhbFN0YXJ0OiBpbnRlcnZhbFN0YXJ0LFxuXHRcdFx0aW50ZXJ2YWxFbmQ6IGludGVydmFsRW5kLFxuXHRcdFx0c3RhcnQ6IHN0YXJ0LFxuXHRcdFx0ZW5kOiBlbmRcblx0XHR9O1xuXHR9LFxuXG5cblx0Ly8gQ29tcHV0ZXMgdGhlIG5ldyBkYXRlIHdoZW4gdGhlIHVzZXIgaGl0cyB0aGUgcHJldiBidXR0b24sIGdpdmVuIHRoZSBjdXJyZW50IGRhdGVcblx0Y29tcHV0ZVByZXZEYXRlOiBmdW5jdGlvbihkYXRlKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2tpcEhpZGRlbkRheXMoXG5cdFx0XHRkYXRlLmNsb25lKCkuc3RhcnRPZih0aGlzLmludGVydmFsVW5pdCkuc3VidHJhY3QodGhpcy5pbnRlcnZhbER1cmF0aW9uKSwgLTFcblx0XHQpO1xuXHR9LFxuXG5cblx0Ly8gQ29tcHV0ZXMgdGhlIG5ldyBkYXRlIHdoZW4gdGhlIHVzZXIgaGl0cyB0aGUgbmV4dCBidXR0b24sIGdpdmVuIHRoZSBjdXJyZW50IGRhdGVcblx0Y29tcHV0ZU5leHREYXRlOiBmdW5jdGlvbihkYXRlKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2tpcEhpZGRlbkRheXMoXG5cdFx0XHRkYXRlLmNsb25lKCkuc3RhcnRPZih0aGlzLmludGVydmFsVW5pdCkuYWRkKHRoaXMuaW50ZXJ2YWxEdXJhdGlvbilcblx0XHQpO1xuXHR9LFxuXG5cblx0LyogVGl0bGUgYW5kIERhdGUgRm9ybWF0dGluZ1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gQ29tcHV0ZXMgd2hhdCB0aGUgdGl0bGUgYXQgdGhlIHRvcCBvZiB0aGUgY2FsZW5kYXIgc2hvdWxkIGJlIGZvciB0aGlzIHZpZXdcblx0Y29tcHV0ZVRpdGxlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5mb3JtYXRSYW5nZShcblx0XHRcdHsgc3RhcnQ6IHRoaXMuaW50ZXJ2YWxTdGFydCwgZW5kOiB0aGlzLmludGVydmFsRW5kIH0sXG5cdFx0XHR0aGlzLm9wdCgndGl0bGVGb3JtYXQnKSB8fCB0aGlzLmNvbXB1dGVUaXRsZUZvcm1hdCgpLFxuXHRcdFx0dGhpcy5vcHQoJ3RpdGxlUmFuZ2VTZXBhcmF0b3InKVxuXHRcdCk7XG5cdH0sXG5cblxuXHQvLyBHZW5lcmF0ZXMgdGhlIGZvcm1hdCBzdHJpbmcgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBnZW5lcmF0ZSB0aGUgdGl0bGUgZm9yIHRoZSBjdXJyZW50IGRhdGUgcmFuZ2UuXG5cdC8vIEF0dGVtcHRzIHRvIGNvbXB1dGUgdGhlIG1vc3QgYXBwcm9wcmlhdGUgZm9ybWF0IGlmIG5vdCBleHBsaWNpdGx5IHNwZWNpZmllZCB3aXRoIGB0aXRsZUZvcm1hdGAuXG5cdGNvbXB1dGVUaXRsZUZvcm1hdDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuaW50ZXJ2YWxVbml0ID09ICd5ZWFyJykge1xuXHRcdFx0cmV0dXJuICdZWVlZJztcblx0XHR9XG5cdFx0ZWxzZSBpZiAodGhpcy5pbnRlcnZhbFVuaXQgPT0gJ21vbnRoJykge1xuXHRcdFx0cmV0dXJuIHRoaXMub3B0KCdtb250aFllYXJGb3JtYXQnKTsgLy8gbGlrZSBcIlNlcHRlbWJlciAyMDE0XCJcblx0XHR9XG5cdFx0ZWxzZSBpZiAodGhpcy5pbnRlcnZhbER1cmF0aW9uLmFzKCdkYXlzJykgPiAxKSB7XG5cdFx0XHRyZXR1cm4gJ2xsJzsgLy8gbXVsdGktZGF5IHJhbmdlLiBzaG9ydGVyLCBsaWtlIFwiU2VwIDkgLSAxMCAyMDE0XCJcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gJ0xMJzsgLy8gb25lIGRheS4gbG9uZ2VyLCBsaWtlIFwiU2VwdGVtYmVyIDkgMjAxNFwiXG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gVXRpbGl0eSBmb3IgZm9ybWF0dGluZyBhIHJhbmdlLiBBY2NlcHRzIGEgcmFuZ2Ugb2JqZWN0LCBmb3JtYXR0aW5nIHN0cmluZywgYW5kIG9wdGlvbmFsIHNlcGFyYXRvci5cblx0Ly8gRGlzcGxheXMgYWxsLWRheSByYW5nZXMgbmF0dXJhbGx5LCB3aXRoIGFuIGluY2x1c2l2ZSBlbmQuIFRha2VzIHRoZSBjdXJyZW50IGlzUlRMIGludG8gYWNjb3VudC5cblx0Zm9ybWF0UmFuZ2U6IGZ1bmN0aW9uKHJhbmdlLCBmb3JtYXRTdHIsIHNlcGFyYXRvcikge1xuXHRcdHZhciBlbmQgPSByYW5nZS5lbmQ7XG5cblx0XHRpZiAoIWVuZC5oYXNUaW1lKCkpIHsgLy8gYWxsLWRheT9cblx0XHRcdGVuZCA9IGVuZC5jbG9uZSgpLnN1YnRyYWN0KDEpOyAvLyBjb252ZXJ0IHRvIGluY2x1c2l2ZS4gbGFzdCBtcyBvZiBwcmV2aW91cyBkYXlcblx0XHR9XG5cblx0XHRyZXR1cm4gZm9ybWF0UmFuZ2UocmFuZ2Uuc3RhcnQsIGVuZCwgZm9ybWF0U3RyLCBzZXBhcmF0b3IsIHRoaXMub3B0KCdpc1JUTCcpKTtcblx0fSxcblxuXG5cdC8qIFJlbmRlcmluZ1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gV3JhcHMgdGhlIGJhc2ljIHJlbmRlcigpIG1ldGhvZCB3aXRoIG1vcmUgVmlldy1zcGVjaWZpYyBsb2dpYy4gQ2FsbGVkIGJ5IHRoZSBvd25lciBDYWxlbmRhci5cblx0cmVuZGVyVmlldzogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcblx0XHR0aGlzLmluaXRpYWxpemVTY3JvbGwoKTtcblx0XHR0aGlzLnRyaWdnZXIoJ3ZpZXdSZW5kZXInLCB0aGlzLCB0aGlzLCB0aGlzLmVsKTtcblxuXHRcdC8vIGF0dGFjaCBoYW5kbGVycyB0byBkb2N1bWVudC4gZG8gaXQgaGVyZSB0byBhbGxvdyBmb3IgZGVzdHJveS9yZXJlbmRlclxuXHRcdCQoZG9jdW1lbnQpLm9uKCdtb3VzZWRvd24nLCB0aGlzLmRvY3VtZW50TW91c2Vkb3duUHJveHkpO1xuXHR9LFxuXG5cblx0Ly8gUmVuZGVycyB0aGUgdmlldyBpbnNpZGUgYW4gYWxyZWFkeS1kZWZpbmVkIGB0aGlzLmVsYFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHN1YmNsYXNzZXMgc2hvdWxkIGltcGxlbWVudFxuXHR9LFxuXG5cblx0Ly8gV3JhcHMgdGhlIGJhc2ljIGRlc3Ryb3koKSBtZXRob2Qgd2l0aCBtb3JlIFZpZXctc3BlY2lmaWMgbG9naWMuIENhbGxlZCBieSB0aGUgb3duZXIgQ2FsZW5kYXIuXG5cdGRlc3Ryb3lWaWV3OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVuc2VsZWN0KCk7XG5cdFx0dGhpcy5kZXN0cm95Vmlld0V2ZW50cygpO1xuXHRcdHRoaXMuZGVzdHJveSgpO1xuXHRcdHRoaXMudHJpZ2dlcigndmlld0Rlc3Ryb3knLCB0aGlzLCB0aGlzLCB0aGlzLmVsKTtcblxuXHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2Vkb3duJywgdGhpcy5kb2N1bWVudE1vdXNlZG93blByb3h5KTtcblx0fSxcblxuXG5cdC8vIENsZWFycyB0aGUgdmlldydzIHJlbmRlcmluZ1xuXHRkZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVsLmVtcHR5KCk7IC8vIHJlbW92ZXMgaW5uZXIgY29udGVudHMgYnV0IGxlYXZlcyB0aGUgZWxlbWVudCBpbnRhY3Rcblx0fSxcblxuXG5cdC8vIEluaXRpYWxpemVzIGludGVybmFsIHZhcmlhYmxlcyByZWxhdGVkIHRvIHRoZW1pbmdcblx0aW5pdFRoZW1pbmc6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0bSA9IHRoaXMub3B0KCd0aGVtZScpID8gJ3VpJyA6ICdmYyc7XG5cblx0XHR0aGlzLndpZGdldEhlYWRlckNsYXNzID0gdG0gKyAnLXdpZGdldC1oZWFkZXInO1xuXHRcdHRoaXMud2lkZ2V0Q29udGVudENsYXNzID0gdG0gKyAnLXdpZGdldC1jb250ZW50Jztcblx0XHR0aGlzLmhpZ2hsaWdodFN0YXRlQ2xhc3MgPSB0bSArICctc3RhdGUtaGlnaGxpZ2h0Jztcblx0fSxcblxuXG5cdC8qIERpbWVuc2lvbnNcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFJlZnJlc2hlcyBhbnl0aGluZyBkZXBlbmRhbnQgdXBvbiBzaXppbmcgb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50IG9mIHRoZSBncmlkXG5cdHVwZGF0ZVNpemU6IGZ1bmN0aW9uKGlzUmVzaXplKSB7XG5cdFx0aWYgKGlzUmVzaXplKSB7XG5cdFx0XHR0aGlzLnJlY29yZFNjcm9sbCgpO1xuXHRcdH1cblx0XHR0aGlzLnVwZGF0ZUhlaWdodCgpO1xuXHRcdHRoaXMudXBkYXRlV2lkdGgoKTtcblx0fSxcblxuXG5cdC8vIFJlZnJlc2hlcyB0aGUgaG9yaXpvbnRhbCBkaW1lbnNpb25zIG9mIHRoZSBjYWxlbmRhclxuXHR1cGRhdGVXaWR0aDogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gc3ViY2xhc3NlcyBzaG91bGQgaW1wbGVtZW50XG5cdH0sXG5cblxuXHQvLyBSZWZyZXNoZXMgdGhlIHZlcnRpY2FsIGRpbWVuc2lvbnMgb2YgdGhlIGNhbGVuZGFyXG5cdHVwZGF0ZUhlaWdodDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNhbGVuZGFyID0gdGhpcy5jYWxlbmRhcjsgLy8gd2UgcG9sbCB0aGUgY2FsZW5kYXIgZm9yIGhlaWdodCBpbmZvcm1hdGlvblxuXG5cdFx0dGhpcy5zZXRIZWlnaHQoXG5cdFx0XHRjYWxlbmRhci5nZXRTdWdnZXN0ZWRWaWV3SGVpZ2h0KCksXG5cdFx0XHRjYWxlbmRhci5pc0hlaWdodEF1dG8oKVxuXHRcdCk7XG5cdH0sXG5cblxuXHQvLyBVcGRhdGVzIHRoZSB2ZXJ0aWNhbCBkaW1lbnNpb25zIG9mIHRoZSBjYWxlbmRhciB0byB0aGUgc3BlY2lmaWVkIGhlaWdodC5cblx0Ly8gaWYgYGlzQXV0b2AgaXMgc2V0IHRvIHRydWUsIGhlaWdodCBiZWNvbWVzIG1lcmVseSBhIHN1Z2dlc3Rpb24gYW5kIHRoZSB2aWV3IHNob3VsZCB1c2UgaXRzIFwibmF0dXJhbFwiIGhlaWdodC5cblx0c2V0SGVpZ2h0OiBmdW5jdGlvbihoZWlnaHQsIGlzQXV0bykge1xuXHRcdC8vIHN1YmNsYXNzZXMgc2hvdWxkIGltcGxlbWVudFxuXHR9LFxuXG5cblx0LyogU2Nyb2xsZXJcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIEdpdmVuIHRoZSB0b3RhbCBoZWlnaHQgb2YgdGhlIHZpZXcsIHJldHVybiB0aGUgbnVtYmVyIG9mIHBpeGVscyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0aGUgc2Nyb2xsZXIuXG5cdC8vIEJ5IGRlZmF1bHQsIHVzZXMgdGhpcy5zY3JvbGxlckVsLCBidXQgY2FuIHBhc3MgdGhpcyBpbiBhcyB3ZWxsLlxuXHQvLyBVdGlsaXR5IGZvciBzdWJjbGFzc2VzLlxuXHRjb21wdXRlU2Nyb2xsZXJIZWlnaHQ6IGZ1bmN0aW9uKHRvdGFsSGVpZ2h0LCBzY3JvbGxlckVsKSB7XG5cdFx0dmFyIGJvdGg7XG5cdFx0dmFyIG90aGVySGVpZ2h0OyAvLyBjdW11bGF0aXZlIGhlaWdodCBvZiBldmVyeXRoaW5nIHRoYXQgaXMgbm90IHRoZSBzY3JvbGxlckVsIGluIHRoZSB2aWV3IChoZWFkZXIrYm9yZGVycylcblxuXHRcdHNjcm9sbGVyRWwgPSBzY3JvbGxlckVsIHx8IHRoaXMuc2Nyb2xsZXJFbDtcblx0XHRib3RoID0gdGhpcy5lbC5hZGQoc2Nyb2xsZXJFbCk7XG5cblx0XHQvLyBmdWNraW4gSUU4LzkvMTAvMTEgc29tZXRpbWVzIHJldHVybnMgMCBmb3IgZGltZW5zaW9ucy4gdGhpcyB3ZWlyZCBoYWNrIHdhcyB0aGUgb25seSB0aGluZyB0aGF0IHdvcmtlZFxuXHRcdGJvdGguY3NzKHtcblx0XHRcdHBvc2l0aW9uOiAncmVsYXRpdmUnLCAvLyBjYXVzZSBhIHJlZmxvdywgd2hpY2ggd2lsbCBmb3JjZSBmcmVzaCBkaW1lbnNpb24gcmVjYWxjdWxhdGlvblxuXHRcdFx0bGVmdDogLTEgLy8gZW5zdXJlIHJlZmxvdyBpbiBjYXNlIHRoZSBlbCB3YXMgYWxyZWFkeSByZWxhdGl2ZS4gbmVnYXRpdmUgaXMgbGVzcyBsaWtlbHkgdG8gY2F1c2UgbmV3IHNjcm9sbFxuXHRcdH0pO1xuXHRcdG90aGVySGVpZ2h0ID0gdGhpcy5lbC5vdXRlckhlaWdodCgpIC0gc2Nyb2xsZXJFbC5oZWlnaHQoKTsgLy8gZ3JhYiB0aGUgZGltZW5zaW9uc1xuXHRcdGJvdGguY3NzKHsgcG9zaXRpb246ICcnLCBsZWZ0OiAnJyB9KTsgLy8gdW5kbyBoYWNrXG5cblx0XHRyZXR1cm4gdG90YWxIZWlnaHQgLSBvdGhlckhlaWdodDtcblx0fSxcblxuXG5cdC8vIFNldHMgdGhlIHNjcm9sbCB2YWx1ZSBvZiB0aGUgc2Nyb2xsZXIgdG8gdGhlIGluaXRpYWwgcHJlLWNvbmZpZ3VyZWQgc3RhdGUgcHJpb3IgdG8gYWxsb3dpbmcgdGhlIHVzZXIgdG8gY2hhbmdlIGl0XG5cdGluaXRpYWxpemVTY3JvbGw6IGZ1bmN0aW9uKCkge1xuXHR9LFxuXG5cblx0Ly8gQ2FsbGVkIGZvciByZW1lbWJlcmluZyB0aGUgY3VycmVudCBzY3JvbGwgdmFsdWUgb2YgdGhlIHNjcm9sbGVyLlxuXHQvLyBTaG91bGQgYmUgY2FsbGVkIGJlZm9yZSB0aGVyZSBpcyBhIGRlc3RydWN0aXZlIG9wZXJhdGlvbiAobGlrZSByZW1vdmluZyBET00gZWxlbWVudHMpIHRoYXQgbWlnaHQgaW5hZHZlcnRlbnRseVxuXHQvLyBjaGFuZ2UgdGhlIHNjcm9sbCBvZiB0aGUgY29udGFpbmVyLlxuXHRyZWNvcmRTY3JvbGw6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLnNjcm9sbGVyRWwpIHtcblx0XHRcdHRoaXMuc2Nyb2xsVG9wID0gdGhpcy5zY3JvbGxlckVsLnNjcm9sbFRvcCgpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIFNldCB0aGUgc2Nyb2xsIHZhbHVlIG9mIHRoZSBzY3JvbGxlciB0byB0aGUgcHJldmlvdXNseSByZWNvcmRlZCB2YWx1ZS5cblx0Ly8gU2hvdWxkIGJlIGNhbGxlZCBhZnRlciB3ZSBrbm93IHRoZSB2aWV3J3MgZGltZW5zaW9ucyBoYXZlIGJlZW4gcmVzdG9yZWQgZm9sbG93aW5nIHNvbWUgdHlwZSBvZiBkZXN0cnVjdGl2ZVxuXHQvLyBvcGVyYXRpb24gKGxpa2UgdGVtcG9yYXJpbHkgcmVtb3ZpbmcgRE9NIGVsZW1lbnRzKS5cblx0cmVzdG9yZVNjcm9sbDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuc2Nyb2xsVG9wICE9PSBudWxsKSB7XG5cdFx0XHR0aGlzLnNjcm9sbGVyRWwuc2Nyb2xsVG9wKHRoaXMuc2Nyb2xsVG9wKTtcblx0XHR9XG5cdH0sXG5cblxuXHQvKiBFdmVudCBFbGVtZW50cyAvIFNlZ21lbnRzXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuXHQvLyBXcmFwcyB0aGUgYmFzaWMgcmVuZGVyRXZlbnRzKCkgbWV0aG9kIHdpdGggbW9yZSBWaWV3LXNwZWNpZmljIGxvZ2ljXG5cdHJlbmRlclZpZXdFdmVudHM6IGZ1bmN0aW9uKGV2ZW50cykge1xuXHRcdHRoaXMucmVuZGVyRXZlbnRzKGV2ZW50cyk7XG5cblx0XHR0aGlzLmV2ZW50U2VnRWFjaChmdW5jdGlvbihzZWcpIHtcblx0XHRcdHRoaXMudHJpZ2dlcignZXZlbnRBZnRlclJlbmRlcicsIHNlZy5ldmVudCwgc2VnLmV2ZW50LCBzZWcuZWwpO1xuXHRcdH0pO1xuXHRcdHRoaXMudHJpZ2dlcignZXZlbnRBZnRlckFsbFJlbmRlcicpO1xuXHR9LFxuXG5cblx0Ly8gUmVuZGVycyB0aGUgZXZlbnRzIG9udG8gdGhlIHZpZXcuXG5cdHJlbmRlckV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gc3ViY2xhc3NlcyBzaG91bGQgaW1wbGVtZW50XG5cdH0sXG5cblxuXHQvLyBXcmFwcyB0aGUgYmFzaWMgZGVzdHJveUV2ZW50cygpIG1ldGhvZCB3aXRoIG1vcmUgVmlldy1zcGVjaWZpYyBsb2dpY1xuXHRkZXN0cm95Vmlld0V2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5ldmVudFNlZ0VhY2goZnVuY3Rpb24oc2VnKSB7XG5cdFx0XHR0aGlzLnRyaWdnZXIoJ2V2ZW50RGVzdHJveScsIHNlZy5ldmVudCwgc2VnLmV2ZW50LCBzZWcuZWwpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5kZXN0cm95RXZlbnRzKCk7XG5cdH0sXG5cblxuXHQvLyBSZW1vdmVzIGV2ZW50IGVsZW1lbnRzIGZyb20gdGhlIHZpZXcuXG5cdGRlc3Ryb3lFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHN1YmNsYXNzZXMgc2hvdWxkIGltcGxlbWVudFxuXHR9LFxuXG5cblx0Ly8gR2l2ZW4gYW4gZXZlbnQgYW5kIHRoZSBkZWZhdWx0IGVsZW1lbnQgdXNlZCBmb3IgcmVuZGVyaW5nLCByZXR1cm5zIHRoZSBlbGVtZW50IHRoYXQgc2hvdWxkIGFjdHVhbGx5IGJlIHVzZWQuXG5cdC8vIEJhc2ljYWxseSBydW5zIGV2ZW50cyBhbmQgZWxlbWVudHMgdGhyb3VnaCB0aGUgZXZlbnRSZW5kZXIgaG9vay5cblx0cmVzb2x2ZUV2ZW50RWw6IGZ1bmN0aW9uKGV2ZW50LCBlbCkge1xuXHRcdHZhciBjdXN0b20gPSB0aGlzLnRyaWdnZXIoJ2V2ZW50UmVuZGVyJywgZXZlbnQsIGV2ZW50LCBlbCk7XG5cblx0XHRpZiAoY3VzdG9tID09PSBmYWxzZSkgeyAvLyBtZWFucyBkb24ndCByZW5kZXIgYXQgYWxsXG5cdFx0XHRlbCA9IG51bGw7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKGN1c3RvbSAmJiBjdXN0b20gIT09IHRydWUpIHtcblx0XHRcdGVsID0gJChjdXN0b20pO1xuXHRcdH1cblxuXHRcdHJldHVybiBlbDtcblx0fSxcblxuXG5cdC8vIEhpZGVzIGFsbCByZW5kZXJlZCBldmVudCBzZWdtZW50cyBsaW5rZWQgdG8gdGhlIGdpdmVuIGV2ZW50XG5cdHNob3dFdmVudDogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR0aGlzLmV2ZW50U2VnRWFjaChmdW5jdGlvbihzZWcpIHtcblx0XHRcdHNlZy5lbC5jc3MoJ3Zpc2liaWxpdHknLCAnJyk7XG5cdFx0fSwgZXZlbnQpO1xuXHR9LFxuXG5cblx0Ly8gU2hvd3MgYWxsIHJlbmRlcmVkIGV2ZW50IHNlZ21lbnRzIGxpbmtlZCB0byB0aGUgZ2l2ZW4gZXZlbnRcblx0aGlkZUV2ZW50OiBmdW5jdGlvbihldmVudCkge1xuXHRcdHRoaXMuZXZlbnRTZWdFYWNoKGZ1bmN0aW9uKHNlZykge1xuXHRcdFx0c2VnLmVsLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcblx0XHR9LCBldmVudCk7XG5cdH0sXG5cblxuXHQvLyBJdGVyYXRlcyB0aHJvdWdoIGV2ZW50IHNlZ21lbnRzLiBHb2VzIHRocm91Z2ggYWxsIGJ5IGRlZmF1bHQuXG5cdC8vIElmIHRoZSBvcHRpb25hbCBgZXZlbnRgIGFyZ3VtZW50IGlzIHNwZWNpZmllZCwgb25seSBpdGVyYXRlcyB0aHJvdWdoIHNlZ21lbnRzIGxpbmtlZCB0byB0aGF0IGV2ZW50LlxuXHQvLyBUaGUgYHRoaXNgIHZhbHVlIG9mIHRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aWxsIGJlIHRoZSB2aWV3LlxuXHRldmVudFNlZ0VhY2g6IGZ1bmN0aW9uKGZ1bmMsIGV2ZW50KSB7XG5cdFx0dmFyIHNlZ3MgPSB0aGlzLmdldEV2ZW50U2VncygpO1xuXHRcdHZhciBpO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IHNlZ3MubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICghZXZlbnQgfHwgc2Vnc1tpXS5ldmVudC5faWQgPT09IGV2ZW50Ll9pZCkge1xuXHRcdFx0XHRmdW5jLmNhbGwodGhpcywgc2Vnc1tpXSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gUmV0cmlldmVzIGFsbCB0aGUgcmVuZGVyZWQgc2VnbWVudCBvYmplY3RzIGZvciB0aGUgdmlld1xuXHRnZXRFdmVudFNlZ3M6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHN1YmNsYXNzZXMgbXVzdCBpbXBsZW1lbnRcblx0XHRyZXR1cm4gW107XG5cdH0sXG5cblxuXHQvKiBFdmVudCBEcmFnLW4tRHJvcFxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gQ29tcHV0ZXMgaWYgdGhlIGdpdmVuIGV2ZW50IGlzIGFsbG93ZWQgdG8gYmUgZHJhZ2dlZCBieSB0aGUgdXNlclxuXHRpc0V2ZW50RHJhZ2dhYmxlOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciBzb3VyY2UgPSBldmVudC5zb3VyY2UgfHwge307XG5cblx0XHRyZXR1cm4gZmlyc3REZWZpbmVkKFxuXHRcdFx0ZXZlbnQuc3RhcnRFZGl0YWJsZSxcblx0XHRcdHNvdXJjZS5zdGFydEVkaXRhYmxlLFxuXHRcdFx0dGhpcy5vcHQoJ2V2ZW50U3RhcnRFZGl0YWJsZScpLFxuXHRcdFx0ZXZlbnQuZWRpdGFibGUsXG5cdFx0XHRzb3VyY2UuZWRpdGFibGUsXG5cdFx0XHR0aGlzLm9wdCgnZWRpdGFibGUnKVxuXHRcdCk7XG5cdH0sXG5cblxuXHQvLyBNdXN0IGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGluIHRoZSB2aWV3IGlzIGRyb3BwZWQgb250byBuZXcgbG9jYXRpb24uXG5cdC8vIGBkcm9wTG9jYXRpb25gIGlzIGFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIHRoZSBuZXcgc3RhcnQvZW5kL2FsbERheSB2YWx1ZXMgZm9yIHRoZSBldmVudC5cblx0cmVwb3J0RXZlbnREcm9wOiBmdW5jdGlvbihldmVudCwgZHJvcExvY2F0aW9uLCBlbCwgZXYpIHtcblx0XHR2YXIgY2FsZW5kYXIgPSB0aGlzLmNhbGVuZGFyO1xuXHRcdHZhciBtdXRhdGVSZXN1bHQgPSBjYWxlbmRhci5tdXRhdGVFdmVudChldmVudCwgZHJvcExvY2F0aW9uKTtcblx0XHR2YXIgdW5kb0Z1bmMgPSBmdW5jdGlvbigpIHtcblx0XHRcdG11dGF0ZVJlc3VsdC51bmRvKCk7XG5cdFx0XHRjYWxlbmRhci5yZXBvcnRFdmVudENoYW5nZSgpO1xuXHRcdH07XG5cblx0XHR0aGlzLnRyaWdnZXJFdmVudERyb3AoZXZlbnQsIG11dGF0ZVJlc3VsdC5kYXRlRGVsdGEsIHVuZG9GdW5jLCBlbCwgZXYpO1xuXHRcdGNhbGVuZGFyLnJlcG9ydEV2ZW50Q2hhbmdlKCk7IC8vIHdpbGwgcmVyZW5kZXIgZXZlbnRzXG5cdH0sXG5cblxuXHQvLyBUcmlnZ2VycyBldmVudC1kcm9wIGhhbmRsZXJzIHRoYXQgaGF2ZSBzdWJzY3JpYmVkIHZpYSB0aGUgQVBJXG5cdHRyaWdnZXJFdmVudERyb3A6IGZ1bmN0aW9uKGV2ZW50LCBkYXRlRGVsdGEsIHVuZG9GdW5jLCBlbCwgZXYpIHtcblx0XHR0aGlzLnRyaWdnZXIoJ2V2ZW50RHJvcCcsIGVsWzBdLCBldmVudCwgZGF0ZURlbHRhLCB1bmRvRnVuYywgZXYsIHt9KTsgLy8ge30gPSBqcXVpIGR1bW15XG5cdH0sXG5cblxuXHQvKiBFeHRlcm5hbCBFbGVtZW50IERyYWctbi1Ecm9wXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuXHQvLyBNdXN0IGJlIGNhbGxlZCB3aGVuIGFuIGV4dGVybmFsIGVsZW1lbnQsIHZpYSBqUXVlcnkgVUksIGhhcyBiZWVuIGRyb3BwZWQgb250byB0aGUgY2FsZW5kYXIuXG5cdC8vIGBtZXRhYCBpcyB0aGUgcGFyc2VkIGRhdGEgdGhhdCBoYXMgYmVlbiBlbWJlZGRlZCBpbnRvIHRoZSBkcmFnZ2luZyBldmVudC5cblx0Ly8gYGRyb3BMb2NhdGlvbmAgaXMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlIG5ldyBzdGFydC9lbmQvYWxsRGF5IHZhbHVlcyBmb3IgdGhlIGV2ZW50LlxuXHRyZXBvcnRFeHRlcm5hbERyb3A6IGZ1bmN0aW9uKG1ldGEsIGRyb3BMb2NhdGlvbiwgZWwsIGV2LCB1aSkge1xuXHRcdHZhciBldmVudFByb3BzID0gbWV0YS5ldmVudFByb3BzO1xuXHRcdHZhciBldmVudElucHV0O1xuXHRcdHZhciBldmVudDtcblxuXHRcdC8vIFRyeSB0byBidWlsZCBhbiBldmVudCBvYmplY3QgYW5kIHJlbmRlciBpdC4gVE9ETzogZGVjb3VwbGUgdGhlIHR3b1xuXHRcdGlmIChldmVudFByb3BzKSB7XG5cdFx0XHRldmVudElucHV0ID0gJC5leHRlbmQoe30sIGV2ZW50UHJvcHMsIGRyb3BMb2NhdGlvbik7XG5cdFx0XHRldmVudCA9IHRoaXMuY2FsZW5kYXIucmVuZGVyRXZlbnQoZXZlbnRJbnB1dCwgbWV0YS5zdGljaylbMF07IC8vIHJlbmRlckV2ZW50IHJldHVybnMgYW4gYXJyYXlcblx0XHR9XG5cblx0XHR0aGlzLnRyaWdnZXJFeHRlcm5hbERyb3AoZXZlbnQsIGRyb3BMb2NhdGlvbiwgZWwsIGV2LCB1aSk7XG5cdH0sXG5cblxuXHQvLyBUcmlnZ2VycyBleHRlcm5hbC1kcm9wIGhhbmRsZXJzIHRoYXQgaGF2ZSBzdWJzY3JpYmVkIHZpYSB0aGUgQVBJXG5cdHRyaWdnZXJFeHRlcm5hbERyb3A6IGZ1bmN0aW9uKGV2ZW50LCBkcm9wTG9jYXRpb24sIGVsLCBldiwgdWkpIHtcblxuXHRcdC8vIHRyaWdnZXIgJ2Ryb3AnIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciBlbGVtZW50IHJlcHJlc2VudHMgYW4gZXZlbnRcblx0XHR0aGlzLnRyaWdnZXIoJ2Ryb3AnLCBlbFswXSwgZHJvcExvY2F0aW9uLnN0YXJ0LCBldiwgdWkpO1xuXG5cdFx0aWYgKGV2ZW50KSB7XG5cdFx0XHR0aGlzLnRyaWdnZXIoJ2V2ZW50UmVjZWl2ZScsIG51bGwsIGV2ZW50KTsgLy8gc2lnbmFsIGFuIGV4dGVybmFsIGV2ZW50IGxhbmRlZFxuXHRcdH1cblx0fSxcblxuXG5cdC8qIERyYWctbi1Ecm9wIFJlbmRlcmluZyAoZm9yIGJvdGggZXZlbnRzIGFuZCBleHRlcm5hbCBlbGVtZW50cylcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFJlbmRlcnMgYSB2aXN1YWwgaW5kaWNhdGlvbiBvZiBhIGV2ZW50IG9yIGV4dGVybmFsLWVsZW1lbnQgZHJhZyBvdmVyIHRoZSBnaXZlbiBkcm9wIHpvbmUuXG5cdC8vIElmIGFuIGV4dGVybmFsLWVsZW1lbnQsIHNlZyB3aWxsIGJlIGBudWxsYFxuXHRyZW5kZXJEcmFnOiBmdW5jdGlvbihkcm9wTG9jYXRpb24sIHNlZykge1xuXHRcdC8vIHN1YmNsYXNzZXMgbXVzdCBpbXBsZW1lbnRcblx0fSxcblxuXG5cdC8vIFVucmVuZGVycyBhIHZpc3VhbCBpbmRpY2F0aW9uIG9mIGFuIGV2ZW50IG9yIGV4dGVybmFsLWVsZW1lbnQgYmVpbmcgZHJhZ2dlZC5cblx0ZGVzdHJveURyYWc6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHN1YmNsYXNzZXMgbXVzdCBpbXBsZW1lbnRcblx0fSxcblxuXG5cdC8qIEV2ZW50IFJlc2l6aW5nXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuXHQvLyBDb21wdXRlcyBpZiB0aGUgZ2l2ZW4gZXZlbnQgaXMgYWxsb3dlZCB0byBiZSByZXNpemUgYnkgdGhlIHVzZXJcblx0aXNFdmVudFJlc2l6YWJsZTogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgc291cmNlID0gZXZlbnQuc291cmNlIHx8IHt9O1xuXG5cdFx0cmV0dXJuIGZpcnN0RGVmaW5lZChcblx0XHRcdGV2ZW50LmR1cmF0aW9uRWRpdGFibGUsXG5cdFx0XHRzb3VyY2UuZHVyYXRpb25FZGl0YWJsZSxcblx0XHRcdHRoaXMub3B0KCdldmVudER1cmF0aW9uRWRpdGFibGUnKSxcblx0XHRcdGV2ZW50LmVkaXRhYmxlLFxuXHRcdFx0c291cmNlLmVkaXRhYmxlLFxuXHRcdFx0dGhpcy5vcHQoJ2VkaXRhYmxlJylcblx0XHQpO1xuXHR9LFxuXG5cblx0Ly8gTXVzdCBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpbiB0aGUgdmlldyBoYXMgYmVlbiByZXNpemVkIHRvIGEgbmV3IGxlbmd0aFxuXHRyZXBvcnRFdmVudFJlc2l6ZTogZnVuY3Rpb24oZXZlbnQsIG5ld0VuZCwgZWwsIGV2KSB7XG5cdFx0dmFyIGNhbGVuZGFyID0gdGhpcy5jYWxlbmRhcjtcblx0XHR2YXIgbXV0YXRlUmVzdWx0ID0gY2FsZW5kYXIubXV0YXRlRXZlbnQoZXZlbnQsIHsgZW5kOiBuZXdFbmQgfSk7XG5cdFx0dmFyIHVuZG9GdW5jID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRtdXRhdGVSZXN1bHQudW5kbygpO1xuXHRcdFx0Y2FsZW5kYXIucmVwb3J0RXZlbnRDaGFuZ2UoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy50cmlnZ2VyRXZlbnRSZXNpemUoZXZlbnQsIG11dGF0ZVJlc3VsdC5kdXJhdGlvbkRlbHRhLCB1bmRvRnVuYywgZWwsIGV2KTtcblx0XHRjYWxlbmRhci5yZXBvcnRFdmVudENoYW5nZSgpOyAvLyB3aWxsIHJlcmVuZGVyIGV2ZW50c1xuXHR9LFxuXG5cblx0Ly8gVHJpZ2dlcnMgZXZlbnQtcmVzaXplIGhhbmRsZXJzIHRoYXQgaGF2ZSBzdWJzY3JpYmVkIHZpYSB0aGUgQVBJXG5cdHRyaWdnZXJFdmVudFJlc2l6ZTogZnVuY3Rpb24oZXZlbnQsIGR1cmF0aW9uRGVsdGEsIHVuZG9GdW5jLCBlbCwgZXYpIHtcblx0XHR0aGlzLnRyaWdnZXIoJ2V2ZW50UmVzaXplJywgZWxbMF0sIGV2ZW50LCBkdXJhdGlvbkRlbHRhLCB1bmRvRnVuYywgZXYsIHt9KTsgLy8ge30gPSBqcXVpIGR1bW15XG5cdH0sXG5cblxuXHQvKiBTZWxlY3Rpb25cblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFNlbGVjdHMgYSBkYXRlIHJhbmdlIG9uIHRoZSB2aWV3LiBgc3RhcnRgIGFuZCBgZW5kYCBhcmUgYm90aCBNb21lbnRzLlxuXHQvLyBgZXZgIGlzIHRoZSBuYXRpdmUgbW91c2UgZXZlbnQgdGhhdCBiZWdpbiB0aGUgaW50ZXJhY3Rpb24uXG5cdHNlbGVjdDogZnVuY3Rpb24ocmFuZ2UsIGV2KSB7XG5cdFx0dGhpcy51bnNlbGVjdChldik7XG5cdFx0dGhpcy5yZW5kZXJTZWxlY3Rpb24ocmFuZ2UpO1xuXHRcdHRoaXMucmVwb3J0U2VsZWN0aW9uKHJhbmdlLCBldik7XG5cdH0sXG5cblxuXHQvLyBSZW5kZXJzIGEgdmlzdWFsIGluZGljYXRpb24gb2YgdGhlIHNlbGVjdGlvblxuXHRyZW5kZXJTZWxlY3Rpb246IGZ1bmN0aW9uKHJhbmdlKSB7XG5cdFx0Ly8gc3ViY2xhc3NlcyBzaG91bGQgaW1wbGVtZW50XG5cdH0sXG5cblxuXHQvLyBDYWxsZWQgd2hlbiBhIG5ldyBzZWxlY3Rpb24gaXMgbWFkZS4gVXBkYXRlcyBpbnRlcm5hbCBzdGF0ZSBhbmQgdHJpZ2dlcnMgaGFuZGxlcnMuXG5cdHJlcG9ydFNlbGVjdGlvbjogZnVuY3Rpb24ocmFuZ2UsIGV2KSB7XG5cdFx0dGhpcy5pc1NlbGVjdGVkID0gdHJ1ZTtcblx0XHR0aGlzLnRyaWdnZXIoJ3NlbGVjdCcsIG51bGwsIHJhbmdlLnN0YXJ0LCByYW5nZS5lbmQsIGV2KTtcblx0fSxcblxuXG5cdC8vIFVuZG9lcyBhIHNlbGVjdGlvbi4gdXBkYXRlcyBpbiB0aGUgaW50ZXJuYWwgc3RhdGUgYW5kIHRyaWdnZXJzIGhhbmRsZXJzLlxuXHQvLyBgZXZgIGlzIHRoZSBuYXRpdmUgbW91c2UgZXZlbnQgdGhhdCBiZWdhbiB0aGUgaW50ZXJhY3Rpb24uXG5cdHVuc2VsZWN0OiBmdW5jdGlvbihldikge1xuXHRcdGlmICh0aGlzLmlzU2VsZWN0ZWQpIHtcblx0XHRcdHRoaXMuaXNTZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0dGhpcy5kZXN0cm95U2VsZWN0aW9uKCk7XG5cdFx0XHR0aGlzLnRyaWdnZXIoJ3Vuc2VsZWN0JywgbnVsbCwgZXYpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIFVucmVuZGVycyBhIHZpc3VhbCBpbmRpY2F0aW9uIG9mIHNlbGVjdGlvblxuXHRkZXN0cm95U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcblx0XHQvLyBzdWJjbGFzc2VzIHNob3VsZCBpbXBsZW1lbnRcblx0fSxcblxuXG5cdC8vIEhhbmRsZXIgZm9yIHVuc2VsZWN0aW5nIHdoZW4gdGhlIHVzZXIgY2xpY2tzIHNvbWV0aGluZyBhbmQgdGhlICd1bnNlbGVjdEF1dG8nIHNldHRpbmcgaXMgb25cblx0ZG9jdW1lbnRNb3VzZWRvd246IGZ1bmN0aW9uKGV2KSB7XG5cdFx0dmFyIGlnbm9yZTtcblxuXHRcdC8vIGlzIHRoZXJlIGEgc2VsZWN0aW9uLCBhbmQgaGFzIHRoZSB1c2VyIG1hZGUgYSBwcm9wZXIgbGVmdCBjbGljaz9cblx0XHRpZiAodGhpcy5pc1NlbGVjdGVkICYmIHRoaXMub3B0KCd1bnNlbGVjdEF1dG8nKSAmJiBpc1ByaW1hcnlNb3VzZUJ1dHRvbihldikpIHtcblxuXHRcdFx0Ly8gb25seSB1bnNlbGVjdCBpZiB0aGUgY2xpY2tlZCBlbGVtZW50IGlzIG5vdCBpZGVudGljYWwgdG8gb3IgaW5zaWRlIG9mIGFuICd1bnNlbGVjdENhbmNlbCcgZWxlbWVudFxuXHRcdFx0aWdub3JlID0gdGhpcy5vcHQoJ3Vuc2VsZWN0Q2FuY2VsJyk7XG5cdFx0XHRpZiAoIWlnbm9yZSB8fCAhJChldi50YXJnZXQpLmNsb3Nlc3QoaWdub3JlKS5sZW5ndGgpIHtcblx0XHRcdFx0dGhpcy51bnNlbGVjdChldik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0LyogRGF0ZSBVdGlsc1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gSW5pdGlhbGl6ZXMgaW50ZXJuYWwgdmFyaWFibGVzIHJlbGF0ZWQgdG8gY2FsY3VsYXRpbmcgaGlkZGVuIGRheXMtb2Ytd2Vla1xuXHRpbml0SGlkZGVuRGF5czogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGhpZGRlbkRheXMgPSB0aGlzLm9wdCgnaGlkZGVuRGF5cycpIHx8IFtdOyAvLyBhcnJheSBvZiBkYXktb2Ytd2VlayBpbmRpY2VzIHRoYXQgYXJlIGhpZGRlblxuXHRcdHZhciBpc0hpZGRlbkRheUhhc2ggPSBbXTsgLy8gaXMgdGhlIGRheS1vZi13ZWVrIGhpZGRlbj8gKGhhc2ggd2l0aCBkYXktb2Ytd2Vlay1pbmRleCAtPiBib29sKVxuXHRcdHZhciBkYXlDbnQgPSAwO1xuXHRcdHZhciBpO1xuXG5cdFx0aWYgKHRoaXMub3B0KCd3ZWVrZW5kcycpID09PSBmYWxzZSkge1xuXHRcdFx0aGlkZGVuRGF5cy5wdXNoKDAsIDYpOyAvLyAwPXN1bmRheSwgNj1zYXR1cmRheVxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcblx0XHRcdGlmIChcblx0XHRcdFx0IShpc0hpZGRlbkRheUhhc2hbaV0gPSAkLmluQXJyYXkoaSwgaGlkZGVuRGF5cykgIT09IC0xKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGRheUNudCsrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICghZGF5Q250KSB7XG5cdFx0XHR0aHJvdyAnaW52YWxpZCBoaWRkZW5EYXlzJzsgLy8gYWxsIGRheXMgd2VyZSBoaWRkZW4/IGJhZC5cblx0XHR9XG5cblx0XHR0aGlzLmlzSGlkZGVuRGF5SGFzaCA9IGlzSGlkZGVuRGF5SGFzaDtcblx0fSxcblxuXG5cdC8vIElzIHRoZSBjdXJyZW50IGRheSBoaWRkZW4/XG5cdC8vIGBkYXlgIGlzIGEgZGF5LW9mLXdlZWsgaW5kZXggKDAtNiksIG9yIGEgTW9tZW50XG5cdGlzSGlkZGVuRGF5OiBmdW5jdGlvbihkYXkpIHtcblx0XHRpZiAobW9tZW50LmlzTW9tZW50KGRheSkpIHtcblx0XHRcdGRheSA9IGRheS5kYXkoKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuaXNIaWRkZW5EYXlIYXNoW2RheV07XG5cdH0sXG5cblxuXHQvLyBJbmNyZW1lbnRpbmcgdGhlIGN1cnJlbnQgZGF5IHVudGlsIGl0IGlzIG5vIGxvbmdlciBhIGhpZGRlbiBkYXksIHJldHVybmluZyBhIGNvcHkuXG5cdC8vIElmIHRoZSBpbml0aWFsIHZhbHVlIG9mIGBkYXRlYCBpcyBub3QgYSBoaWRkZW4gZGF5LCBkb24ndCBkbyBhbnl0aGluZy5cblx0Ly8gUGFzcyBgaXNFeGNsdXNpdmVgIGFzIGB0cnVlYCBpZiB5b3UgYXJlIGRlYWxpbmcgd2l0aCBhbiBlbmQgZGF0ZS5cblx0Ly8gYGluY2AgZGVmYXVsdHMgdG8gYDFgIChpbmNyZW1lbnQgb25lIGRheSBmb3J3YXJkIGVhY2ggdGltZSlcblx0c2tpcEhpZGRlbkRheXM6IGZ1bmN0aW9uKGRhdGUsIGluYywgaXNFeGNsdXNpdmUpIHtcblx0XHR2YXIgb3V0ID0gZGF0ZS5jbG9uZSgpO1xuXHRcdGluYyA9IGluYyB8fCAxO1xuXHRcdHdoaWxlIChcblx0XHRcdHRoaXMuaXNIaWRkZW5EYXlIYXNoWyhvdXQuZGF5KCkgKyAoaXNFeGNsdXNpdmUgPyBpbmMgOiAwKSArIDcpICUgN11cblx0XHQpIHtcblx0XHRcdG91dC5hZGQoaW5jLCAnZGF5cycpO1xuXHRcdH1cblx0XHRyZXR1cm4gb3V0O1xuXHR9LFxuXG5cblx0Ly8gUmV0dXJucyB0aGUgZGF0ZSByYW5nZSBvZiB0aGUgZnVsbCBkYXlzIHRoZSBnaXZlbiByYW5nZSB2aXN1YWxseSBhcHBlYXJzIHRvIG9jY3VweS5cblx0Ly8gUmV0dXJucyBhIG5ldyByYW5nZSBvYmplY3QuXG5cdGNvbXB1dGVEYXlSYW5nZTogZnVuY3Rpb24ocmFuZ2UpIHtcblx0XHR2YXIgc3RhcnREYXkgPSByYW5nZS5zdGFydC5jbG9uZSgpLnN0cmlwVGltZSgpOyAvLyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBkYXkgdGhlIHJhbmdlIHN0YXJ0c1xuXHRcdHZhciBlbmQgPSByYW5nZS5lbmQ7XG5cdFx0dmFyIGVuZERheSA9IG51bGw7XG5cdFx0dmFyIGVuZFRpbWVNUztcblxuXHRcdGlmIChlbmQpIHtcblx0XHRcdGVuZERheSA9IGVuZC5jbG9uZSgpLnN0cmlwVGltZSgpOyAvLyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBkYXkgdGhlIHJhbmdlIGV4Y2x1c2l2ZWx5IGVuZHNcblx0XHRcdGVuZFRpbWVNUyA9ICtlbmQudGltZSgpOyAvLyAjIG9mIG1pbGxpc2Vjb25kcyBpbnRvIGBlbmREYXlgXG5cblx0XHRcdC8vIElmIHRoZSBlbmQgdGltZSBpcyBhY3R1YWxseSBpbmNsdXNpdmVseSBwYXJ0IG9mIHRoZSBuZXh0IGRheSBhbmQgaXMgZXF1YWwgdG8gb3Jcblx0XHRcdC8vIGJleW9uZCB0aGUgbmV4dCBkYXkgdGhyZXNob2xkLCBhZGp1c3QgdGhlIGVuZCB0byBiZSB0aGUgZXhjbHVzaXZlIGVuZCBvZiBgZW5kRGF5YC5cblx0XHRcdC8vIE90aGVyd2lzZSwgbGVhdmluZyBpdCBhcyBpbmNsdXNpdmUgd2lsbCBjYXVzZSBpdCB0byBleGNsdWRlIGBlbmREYXlgLlxuXHRcdFx0aWYgKGVuZFRpbWVNUyAmJiBlbmRUaW1lTVMgPj0gdGhpcy5uZXh0RGF5VGhyZXNob2xkKSB7XG5cdFx0XHRcdGVuZERheS5hZGQoMSwgJ2RheXMnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJZiBubyBlbmQgd2FzIHNwZWNpZmllZCwgb3IgaWYgaXQgaXMgd2l0aGluIGBzdGFydERheWAgYnV0IG5vdCBwYXN0IG5leHREYXlUaHJlc2hvbGQsXG5cdFx0Ly8gYXNzaWduIHRoZSBkZWZhdWx0IGR1cmF0aW9uIG9mIG9uZSBkYXkuXG5cdFx0aWYgKCFlbmQgfHwgZW5kRGF5IDw9IHN0YXJ0RGF5KSB7XG5cdFx0XHRlbmREYXkgPSBzdGFydERheS5jbG9uZSgpLmFkZCgxLCAnZGF5cycpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7IHN0YXJ0OiBzdGFydERheSwgZW5kOiBlbmREYXkgfTtcblx0fSxcblxuXG5cdC8vIERvZXMgdGhlIGdpdmVuIGV2ZW50IHZpc3VhbGx5IGFwcGVhciB0byBvY2N1cHkgbW9yZSB0aGFuIG9uZSBkYXk/XG5cdGlzTXVsdGlEYXlFdmVudDogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgcmFuZ2UgPSB0aGlzLmNvbXB1dGVEYXlSYW5nZShldmVudCk7IC8vIGV2ZW50IGlzIHJhbmdlLWlzaFxuXG5cdFx0cmV0dXJuIHJhbmdlLmVuZC5kaWZmKHJhbmdlLnN0YXJ0LCAnZGF5cycpID4gMTtcblx0fVxuXG59KTtcblxuICAgIGZ1bmN0aW9uIENhbGVuZGFyKGVsZW1lbnQsIGluc3RhbmNlT3B0aW9ucykge1xuXHR2YXIgdCA9IHRoaXM7XG5cblxuXG5cdC8vIEJ1aWxkIG9wdGlvbnMgb2JqZWN0XG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdC8vIFByZWNlZGVuY2UgKGxvd2VzdCB0byBoaWdoZXN0KTogZGVmYXVsdHMsIHJ0bERlZmF1bHRzLCBsYW5nT3B0aW9ucywgaW5zdGFuY2VPcHRpb25zXG5cblx0aW5zdGFuY2VPcHRpb25zID0gaW5zdGFuY2VPcHRpb25zIHx8IHt9O1xuXG5cdHZhciBvcHRpb25zID0gbWVyZ2VPcHRpb25zKHt9LCBkZWZhdWx0cywgaW5zdGFuY2VPcHRpb25zKTtcblx0dmFyIGxhbmdPcHRpb25zO1xuXG5cdC8vIGRldGVybWluZSBsYW5ndWFnZSBvcHRpb25zXG5cdGlmIChvcHRpb25zLmxhbmcgaW4gbGFuZ09wdGlvbkhhc2gpIHtcblx0XHRsYW5nT3B0aW9ucyA9IGxhbmdPcHRpb25IYXNoW29wdGlvbnMubGFuZ107XG5cdH1cblx0ZWxzZSB7XG5cdFx0bGFuZ09wdGlvbnMgPSBsYW5nT3B0aW9uSGFzaFtkZWZhdWx0cy5sYW5nXTtcblx0fVxuXG5cdGlmIChsYW5nT3B0aW9ucykgeyAvLyBpZiBsYW5ndWFnZSBvcHRpb25zIGV4aXN0LCByZWJ1aWxkLi4uXG5cdFx0b3B0aW9ucyA9IG1lcmdlT3B0aW9ucyh7fSwgZGVmYXVsdHMsIGxhbmdPcHRpb25zLCBpbnN0YW5jZU9wdGlvbnMpO1xuXHR9XG5cblx0aWYgKG9wdGlvbnMuaXNSVEwpIHsgLy8gaXMgaXNSVEwsIHJlYnVpbGQuLi5cblx0XHRvcHRpb25zID0gbWVyZ2VPcHRpb25zKHt9LCBkZWZhdWx0cywgcnRsRGVmYXVsdHMsIGxhbmdPcHRpb25zIHx8IHt9LCBpbnN0YW5jZU9wdGlvbnMpO1xuXHR9XG5cblxuXHRcblx0Ly8gRXhwb3J0c1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdHQub3B0aW9ucyA9IG9wdGlvbnM7XG5cdHQucmVuZGVyID0gcmVuZGVyO1xuXHR0LmRlc3Ryb3kgPSBkZXN0cm95O1xuXHR0LnJlZmV0Y2hFdmVudHMgPSByZWZldGNoRXZlbnRzO1xuXHR0LnJlcG9ydEV2ZW50cyA9IHJlcG9ydEV2ZW50cztcblx0dC5yZXBvcnRFdmVudENoYW5nZSA9IHJlcG9ydEV2ZW50Q2hhbmdlO1xuXHR0LnJlcmVuZGVyRXZlbnRzID0gcmVuZGVyRXZlbnRzOyAvLyBgcmVuZGVyRXZlbnRzYCBzZXJ2ZXMgYXMgYSByZXJlbmRlci4gYW4gQVBJIG1ldGhvZFxuXHR0LmNoYW5nZVZpZXcgPSBjaGFuZ2VWaWV3O1xuXHR0LnNlbGVjdCA9IHNlbGVjdDtcblx0dC51bnNlbGVjdCA9IHVuc2VsZWN0O1xuXHR0LnByZXYgPSBwcmV2O1xuXHR0Lm5leHQgPSBuZXh0O1xuXHR0LnByZXZZZWFyID0gcHJldlllYXI7XG5cdHQubmV4dFllYXIgPSBuZXh0WWVhcjtcblx0dC50b2RheSA9IHRvZGF5O1xuXHR0LmdvdG9EYXRlID0gZ290b0RhdGU7XG5cdHQuaW5jcmVtZW50RGF0ZSA9IGluY3JlbWVudERhdGU7XG5cdHQuem9vbVRvID0gem9vbVRvO1xuXHR0LmdldERhdGUgPSBnZXREYXRlO1xuXHR0LmdldENhbGVuZGFyID0gZ2V0Q2FsZW5kYXI7XG5cdHQuZ2V0VmlldyA9IGdldFZpZXc7XG5cdHQub3B0aW9uID0gb3B0aW9uO1xuXHR0LnRyaWdnZXIgPSB0cmlnZ2VyO1xuXHR0LmlzVmFsaWRWaWV3VHlwZSA9IGlzVmFsaWRWaWV3VHlwZTtcblx0dC5nZXRWaWV3QnV0dG9uVGV4dCA9IGdldFZpZXdCdXR0b25UZXh0O1xuXG5cblxuXHQvLyBMYW5ndWFnZS1kYXRhIEludGVybmFsc1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQvLyBBcHBseSBvdmVycmlkZXMgdG8gdGhlIGN1cnJlbnQgbGFuZ3VhZ2UncyBkYXRhXG5cblxuXHR2YXIgbG9jYWxlRGF0YSA9IGNyZWF0ZU9iamVjdCggLy8gbWFrZSBhIGNoZWFwIGNvcHlcblx0XHRnZXRNb21lbnRMb2NhbGVEYXRhKG9wdGlvbnMubGFuZykgLy8gd2lsbCBmYWxsIGJhY2sgdG8gZW5cblx0KTtcblxuXHRpZiAob3B0aW9ucy5tb250aE5hbWVzKSB7XG5cdFx0bG9jYWxlRGF0YS5fbW9udGhzID0gb3B0aW9ucy5tb250aE5hbWVzO1xuXHR9XG5cdGlmIChvcHRpb25zLm1vbnRoTmFtZXNTaG9ydCkge1xuXHRcdGxvY2FsZURhdGEuX21vbnRoc1Nob3J0ID0gb3B0aW9ucy5tb250aE5hbWVzU2hvcnQ7XG5cdH1cblx0aWYgKG9wdGlvbnMuZGF5TmFtZXMpIHtcblx0XHRsb2NhbGVEYXRhLl93ZWVrZGF5cyA9IG9wdGlvbnMuZGF5TmFtZXM7XG5cdH1cblx0aWYgKG9wdGlvbnMuZGF5TmFtZXNTaG9ydCkge1xuXHRcdGxvY2FsZURhdGEuX3dlZWtkYXlzU2hvcnQgPSBvcHRpb25zLmRheU5hbWVzU2hvcnQ7XG5cdH1cblx0aWYgKG9wdGlvbnMuZmlyc3REYXkgIT0gbnVsbCkge1xuXHRcdHZhciBfd2VlayA9IGNyZWF0ZU9iamVjdChsb2NhbGVEYXRhLl93ZWVrKTsgLy8gX3dlZWs6IHsgZG93OiAjIH1cblx0XHRfd2Vlay5kb3cgPSBvcHRpb25zLmZpcnN0RGF5O1xuXHRcdGxvY2FsZURhdGEuX3dlZWsgPSBfd2Vlaztcblx0fVxuXG5cblxuXHQvLyBDYWxlbmRhci1zcGVjaWZpYyBEYXRlIFV0aWxpdGllc1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cblx0dC5kZWZhdWx0QWxsRGF5RXZlbnREdXJhdGlvbiA9IG1vbWVudC5kdXJhdGlvbihvcHRpb25zLmRlZmF1bHRBbGxEYXlFdmVudER1cmF0aW9uKTtcblx0dC5kZWZhdWx0VGltZWRFdmVudER1cmF0aW9uID0gbW9tZW50LmR1cmF0aW9uKG9wdGlvbnMuZGVmYXVsdFRpbWVkRXZlbnREdXJhdGlvbik7XG5cblxuXHQvLyBCdWlsZHMgYSBtb21lbnQgdXNpbmcgdGhlIHNldHRpbmdzIG9mIHRoZSBjdXJyZW50IGNhbGVuZGFyOiB0aW1lem9uZSBhbmQgbGFuZ3VhZ2UuXG5cdC8vIEFjY2VwdHMgYW55dGhpbmcgdGhlIHZhbmlsbGEgbW9tZW50KCkgY29uc3RydWN0b3IgYWNjZXB0cy5cblx0dC5tb21lbnQgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbW9tO1xuXG5cdFx0aWYgKG9wdGlvbnMudGltZXpvbmUgPT09ICdsb2NhbCcpIHtcblx0XHRcdG1vbSA9IGZjLm1vbWVudC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuXG5cdFx0XHQvLyBGb3JjZSB0aGUgbW9tZW50IHRvIGJlIGxvY2FsLCBiZWNhdXNlIGZjLm1vbWVudCBkb2Vzbid0IGd1YXJhbnRlZSBpdC5cblx0XHRcdGlmIChtb20uaGFzVGltZSgpKSB7IC8vIGRvbid0IGdpdmUgYW1iaWd1b3VzbHktdGltZWQgbW9tZW50cyBhIGxvY2FsIHpvbmVcblx0XHRcdFx0bW9tLmxvY2FsKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2UgaWYgKG9wdGlvbnMudGltZXpvbmUgPT09ICdVVEMnKSB7XG5cdFx0XHRtb20gPSBmYy5tb21lbnQudXRjLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7IC8vIHByb2Nlc3MgYXMgVVRDXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0bW9tID0gZmMubW9tZW50LnBhcnNlWm9uZS5hcHBseShudWxsLCBhcmd1bWVudHMpOyAvLyBsZXQgdGhlIGlucHV0IGRlY2lkZSB0aGUgem9uZVxuXHRcdH1cblxuXHRcdGlmICgnX2xvY2FsZScgaW4gbW9tKSB7IC8vIG1vbWVudCAyLjggYW5kIGFib3ZlXG5cdFx0XHRtb20uX2xvY2FsZSA9IGxvY2FsZURhdGE7XG5cdFx0fVxuXHRcdGVsc2UgeyAvLyBwcmUtbW9tZW50LTIuOFxuXHRcdFx0bW9tLl9sYW5nID0gbG9jYWxlRGF0YTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbW9tO1xuXHR9O1xuXG5cblx0Ly8gUmV0dXJucyBhIGJvb2xlYW4gYWJvdXQgd2hldGhlciBvciBub3QgdGhlIGNhbGVuZGFyIGtub3dzIGhvdyB0byBjYWxjdWxhdGVcblx0Ly8gdGhlIHRpbWV6b25lIG9mZnNldCBvZiBhcmJpdHJhcnkgZGF0ZXMgaW4gdGhlIGN1cnJlbnQgdGltZXpvbmUuXG5cdHQuZ2V0SXNBbWJpZ1RpbWV6b25lID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIG9wdGlvbnMudGltZXpvbmUgIT09ICdsb2NhbCcgJiYgb3B0aW9ucy50aW1lem9uZSAhPT0gJ1VUQyc7XG5cdH07XG5cblxuXHQvLyBSZXR1cm5zIGEgY29weSBvZiB0aGUgZ2l2ZW4gZGF0ZSBpbiB0aGUgY3VycmVudCB0aW1lem9uZSBvZiBpdCBpcyBhbWJpZ3VvdXNseSB6b25lZC5cblx0Ly8gVGhpcyB3aWxsIGFsc28gZ2l2ZSB0aGUgZGF0ZSBhbiB1bmFtYmlndW91cyB0aW1lLlxuXHR0LnJlem9uZURhdGUgPSBmdW5jdGlvbihkYXRlKSB7XG5cdFx0cmV0dXJuIHQubW9tZW50KGRhdGUudG9BcnJheSgpKTtcblx0fTtcblxuXG5cdC8vIFJldHVybnMgYSBtb21lbnQgZm9yIHRoZSBjdXJyZW50IGRhdGUsIGFzIGRlZmluZWQgYnkgdGhlIGNsaWVudCdzIGNvbXB1dGVyLFxuXHQvLyBvciBvdmVycmlkZGVuIGJ5IHRoZSBgbm93YCBvcHRpb24uXG5cdHQuZ2V0Tm93ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG5vdyA9IG9wdGlvbnMubm93O1xuXHRcdGlmICh0eXBlb2Ygbm93ID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRub3cgPSBub3coKTtcblx0XHR9XG5cdFx0cmV0dXJuIHQubW9tZW50KG5vdyk7XG5cdH07XG5cblxuXHQvLyBDYWxjdWxhdGVzIHRoZSB3ZWVrIG51bWJlciBmb3IgYSBtb21lbnQgYWNjb3JkaW5nIHRvIHRoZSBjYWxlbmRhcidzXG5cdC8vIGB3ZWVrTnVtYmVyQ2FsY3VsYXRpb25gIHNldHRpbmcuXG5cdHQuY2FsY3VsYXRlV2Vla051bWJlciA9IGZ1bmN0aW9uKG1vbSkge1xuXHRcdHZhciBjYWxjID0gb3B0aW9ucy53ZWVrTnVtYmVyQ2FsY3VsYXRpb247XG5cblx0XHRpZiAodHlwZW9mIGNhbGMgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHJldHVybiBjYWxjKG1vbSk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKGNhbGMgPT09ICdsb2NhbCcpIHtcblx0XHRcdHJldHVybiBtb20ud2VlaygpO1xuXHRcdH1cblx0XHRlbHNlIGlmIChjYWxjLnRvVXBwZXJDYXNlKCkgPT09ICdJU08nKSB7XG5cdFx0XHRyZXR1cm4gbW9tLmlzb1dlZWsoKTtcblx0XHR9XG5cdH07XG5cblxuXHQvLyBHZXQgYW4gZXZlbnQncyBub3JtYWxpemVkIGVuZCBkYXRlLiBJZiBub3QgcHJlc2VudCwgY2FsY3VsYXRlIGl0IGZyb20gdGhlIGRlZmF1bHRzLlxuXHR0LmdldEV2ZW50RW5kID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRpZiAoZXZlbnQuZW5kKSB7XG5cdFx0XHRyZXR1cm4gZXZlbnQuZW5kLmNsb25lKCk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHQuZ2V0RGVmYXVsdEV2ZW50RW5kKGV2ZW50LmFsbERheSwgZXZlbnQuc3RhcnQpO1xuXHRcdH1cblx0fTtcblxuXG5cdC8vIEdpdmVuIGFuIGV2ZW50J3MgYWxsRGF5IHN0YXR1cyBhbmQgc3RhcnQgZGF0ZSwgcmV0dXJuIHN3aGF0IGl0cyBmYWxsYmFjayBlbmQgZGF0ZSBzaG91bGQgYmUuXG5cdHQuZ2V0RGVmYXVsdEV2ZW50RW5kID0gZnVuY3Rpb24oYWxsRGF5LCBzdGFydCkgeyAvLyBUT0RPOiByZW5hbWUgdG8gY29tcHV0ZURlZmF1bHRFdmVudEVuZFxuXHRcdHZhciBlbmQgPSBzdGFydC5jbG9uZSgpO1xuXG5cdFx0aWYgKGFsbERheSkge1xuXHRcdFx0ZW5kLnN0cmlwVGltZSgpLmFkZCh0LmRlZmF1bHRBbGxEYXlFdmVudER1cmF0aW9uKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRlbmQuYWRkKHQuZGVmYXVsdFRpbWVkRXZlbnREdXJhdGlvbik7XG5cdFx0fVxuXG5cdFx0aWYgKHQuZ2V0SXNBbWJpZ1RpbWV6b25lKCkpIHtcblx0XHRcdGVuZC5zdHJpcFpvbmUoKTsgLy8gd2UgZG9uJ3Qga25vdyB3aGF0IHRoZSB0em8gc2hvdWxkIGJlXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGVuZDtcblx0fTtcblxuXG5cdC8vIFByb2R1Y2VzIGEgaHVtYW4tcmVhZGFibGUgc3RyaW5nIGZvciB0aGUgZ2l2ZW4gZHVyYXRpb24uXG5cdC8vIFNpZGUtZWZmZWN0OiBjaGFuZ2VzIHRoZSBsb2NhbGUgb2YgdGhlIGdpdmVuIGR1cmF0aW9uLlxuXHRmdW5jdGlvbiBodW1hbml6ZUR1cmF0aW9uKGR1cmF0aW9uKSB7XG5cdFx0cmV0dXJuIChkdXJhdGlvbi5sb2NhbGUgfHwgZHVyYXRpb24ubGFuZykuY2FsbChkdXJhdGlvbiwgb3B0aW9ucy5sYW5nKSAvLyB3b3JrcyBtb21lbnQtcHJlLTIuOFxuXHRcdFx0Lmh1bWFuaXplKCk7XG5cdH1cblxuXG5cdFxuXHQvLyBJbXBvcnRzXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuXHRFdmVudE1hbmFnZXIuY2FsbCh0LCBvcHRpb25zKTtcblx0dmFyIGlzRmV0Y2hOZWVkZWQgPSB0LmlzRmV0Y2hOZWVkZWQ7XG5cdHZhciBmZXRjaEV2ZW50cyA9IHQuZmV0Y2hFdmVudHM7XG5cblxuXG5cdC8vIExvY2Fsc1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cblx0dmFyIF9lbGVtZW50ID0gZWxlbWVudFswXTtcblx0dmFyIGhlYWRlcjtcblx0dmFyIGhlYWRlckVsZW1lbnQ7XG5cdHZhciBjb250ZW50O1xuXHR2YXIgdG07IC8vIGZvciBtYWtpbmcgdGhlbWUgY2xhc3Nlc1xuXHR2YXIgdmlld1NwZWNDYWNoZSA9IHt9O1xuXHR2YXIgY3VycmVudFZpZXc7XG5cdHZhciBzdWdnZXN0ZWRWaWV3SGVpZ2h0O1xuXHR2YXIgd2luZG93UmVzaXplUHJveHk7IC8vIHdyYXBzIHRoZSB3aW5kb3dSZXNpemUgZnVuY3Rpb25cblx0dmFyIGlnbm9yZVdpbmRvd1Jlc2l6ZSA9IDA7XG5cdHZhciBkYXRlO1xuXHR2YXIgZXZlbnRzID0gW107XG5cdFxuXHRcblx0XG5cdC8vIE1haW4gUmVuZGVyaW5nXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuXHRpZiAob3B0aW9ucy5kZWZhdWx0RGF0ZSAhPSBudWxsKSB7XG5cdFx0ZGF0ZSA9IHQubW9tZW50KG9wdGlvbnMuZGVmYXVsdERhdGUpO1xuXHR9XG5cdGVsc2Uge1xuXHRcdGRhdGUgPSB0LmdldE5vdygpO1xuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gcmVuZGVyKGluYykge1xuXHRcdGlmICghY29udGVudCkge1xuXHRcdFx0aW5pdGlhbFJlbmRlcigpO1xuXHRcdH1cblx0XHRlbHNlIGlmIChlbGVtZW50VmlzaWJsZSgpKSB7XG5cdFx0XHQvLyBtYWlubHkgZm9yIHRoZSBwdWJsaWMgQVBJXG5cdFx0XHRjYWxjU2l6ZSgpO1xuXHRcdFx0cmVuZGVyVmlldyhpbmMpO1xuXHRcdH1cblx0fVxuXHRcblx0XG5cdGZ1bmN0aW9uIGluaXRpYWxSZW5kZXIoKSB7XG5cdFx0dG0gPSBvcHRpb25zLnRoZW1lID8gJ3VpJyA6ICdmYyc7XG5cdFx0ZWxlbWVudC5hZGRDbGFzcygnZmMnKTtcblxuXHRcdGlmIChvcHRpb25zLmlzUlRMKSB7XG5cdFx0XHRlbGVtZW50LmFkZENsYXNzKCdmYy1ydGwnKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRlbGVtZW50LmFkZENsYXNzKCdmYy1sdHInKTtcblx0XHR9XG5cblx0XHRpZiAob3B0aW9ucy50aGVtZSkge1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcygndWktd2lkZ2V0Jyk7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcygnZmMtdW50aGVtZWQnKTtcblx0XHR9XG5cblx0XHRjb250ZW50ID0gJChcIjxkaXYgY2xhc3M9J2ZjLXZpZXctY29udGFpbmVyJy8+XCIpLnByZXBlbmRUbyhlbGVtZW50KTtcblxuXHRcdGhlYWRlciA9IG5ldyBIZWFkZXIodCwgb3B0aW9ucyk7XG5cdFx0aGVhZGVyRWxlbWVudCA9IGhlYWRlci5yZW5kZXIoKTtcblx0XHRpZiAoaGVhZGVyRWxlbWVudCkge1xuXHRcdFx0ZWxlbWVudC5wcmVwZW5kKGhlYWRlckVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdGNoYW5nZVZpZXcob3B0aW9ucy5kZWZhdWx0Vmlldyk7XG5cblx0XHRpZiAob3B0aW9ucy5oYW5kbGVXaW5kb3dSZXNpemUpIHtcblx0XHRcdHdpbmRvd1Jlc2l6ZVByb3h5ID0gZGVib3VuY2Uod2luZG93UmVzaXplLCBvcHRpb25zLndpbmRvd1Jlc2l6ZURlbGF5KTsgLy8gcHJldmVudHMgcmFwaWQgY2FsbHNcblx0XHRcdCQod2luZG93KS5yZXNpemUod2luZG93UmVzaXplUHJveHkpO1xuXHRcdH1cblx0fVxuXHRcblx0XG5cdGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG5cblx0XHRpZiAoY3VycmVudFZpZXcpIHtcblx0XHRcdGN1cnJlbnRWaWV3LmRlc3Ryb3lWaWV3KCk7XG5cdFx0fVxuXG5cdFx0aGVhZGVyLmRlc3Ryb3koKTtcblx0XHRjb250ZW50LnJlbW92ZSgpO1xuXHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2ZjIGZjLWx0ciBmYy1ydGwgZmMtdW50aGVtZWQgdWktd2lkZ2V0Jyk7XG5cblx0XHQkKHdpbmRvdykudW5iaW5kKCdyZXNpemUnLCB3aW5kb3dSZXNpemVQcm94eSk7XG5cdH1cblx0XG5cdFxuXHRmdW5jdGlvbiBlbGVtZW50VmlzaWJsZSgpIHtcblx0XHRyZXR1cm4gZWxlbWVudC5pcygnOnZpc2libGUnKTtcblx0fVxuXHRcblx0XG5cblx0Ly8gVmlldyBSZW5kZXJpbmdcblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG5cdGZ1bmN0aW9uIGNoYW5nZVZpZXcodmlld1R5cGUpIHtcblx0XHRyZW5kZXJWaWV3KDAsIHZpZXdUeXBlKTtcblx0fVxuXG5cblx0Ly8gUmVuZGVycyBhIHZpZXcgYmVjYXVzZSBvZiBhIGRhdGUgY2hhbmdlLCB2aWV3LXR5cGUgY2hhbmdlLCBvciBmb3IgdGhlIGZpcnN0IHRpbWVcblx0ZnVuY3Rpb24gcmVuZGVyVmlldyhkZWx0YSwgdmlld1R5cGUpIHtcblx0XHRpZ25vcmVXaW5kb3dSZXNpemUrKztcblxuXHRcdC8vIGlmIHZpZXdUeXBlIGlzIGNoYW5naW5nLCBkZXN0cm95IHRoZSBvbGQgdmlld1xuXHRcdGlmIChjdXJyZW50VmlldyAmJiB2aWV3VHlwZSAmJiBjdXJyZW50Vmlldy50eXBlICE9PSB2aWV3VHlwZSkge1xuXHRcdFx0aGVhZGVyLmRlYWN0aXZhdGVCdXR0b24oY3VycmVudFZpZXcudHlwZSk7XG5cdFx0XHRmcmVlemVDb250ZW50SGVpZ2h0KCk7IC8vIHByZXZlbnQgYSBzY3JvbGwganVtcCB3aGVuIHZpZXcgZWxlbWVudCBpcyByZW1vdmVkXG5cdFx0XHRpZiAoY3VycmVudFZpZXcuc3RhcnQpIHsgLy8gcmVuZGVyZWQgYmVmb3JlP1xuXHRcdFx0XHRjdXJyZW50Vmlldy5kZXN0cm95VmlldygpO1xuXHRcdFx0fVxuXHRcdFx0Y3VycmVudFZpZXcuZWwucmVtb3ZlKCk7XG5cdFx0XHRjdXJyZW50VmlldyA9IG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gaWYgdmlld1R5cGUgY2hhbmdlZCwgb3IgdGhlIHZpZXcgd2FzIG5ldmVyIGNyZWF0ZWQsIGNyZWF0ZSBhIGZyZXNoIHZpZXdcblx0XHRpZiAoIWN1cnJlbnRWaWV3ICYmIHZpZXdUeXBlKSB7XG5cdFx0XHRjdXJyZW50VmlldyA9IGluc3RhbnRpYXRlVmlldyh2aWV3VHlwZSk7XG5cdFx0XHRjdXJyZW50Vmlldy5lbCA9ICAkKFwiPGRpdiBjbGFzcz0nZmMtdmlldyBmYy1cIiArIHZpZXdUeXBlICsgXCItdmlldycgLz5cIikuYXBwZW5kVG8oY29udGVudCk7XG5cdFx0XHRoZWFkZXIuYWN0aXZhdGVCdXR0b24odmlld1R5cGUpO1xuXHRcdH1cblxuXHRcdGlmIChjdXJyZW50Vmlldykge1xuXG5cdFx0XHQvLyBsZXQgdGhlIHZpZXcgZGV0ZXJtaW5lIHdoYXQgdGhlIGRlbHRhIG1lYW5zXG5cdFx0XHRpZiAoZGVsdGEgPCAwKSB7XG5cdFx0XHRcdGRhdGUgPSBjdXJyZW50Vmlldy5jb21wdXRlUHJldkRhdGUoZGF0ZSk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChkZWx0YSA+IDApIHtcblx0XHRcdFx0ZGF0ZSA9IGN1cnJlbnRWaWV3LmNvbXB1dGVOZXh0RGF0ZShkYXRlKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gcmVuZGVyIG9yIHJlcmVuZGVyIHRoZSB2aWV3XG5cdFx0XHRpZiAoXG5cdFx0XHRcdCFjdXJyZW50Vmlldy5zdGFydCB8fCAvLyBuZXZlciByZW5kZXJlZCBiZWZvcmVcblx0XHRcdFx0ZGVsdGEgfHwgLy8gZXhwbGljaXQgZGF0ZSB3aW5kb3cgY2hhbmdlXG5cdFx0XHRcdCFkYXRlLmlzV2l0aGluKGN1cnJlbnRWaWV3LmludGVydmFsU3RhcnQsIGN1cnJlbnRWaWV3LmludGVydmFsRW5kKSAvLyBpbXBsaWNpdCBkYXRlIHdpbmRvdyBjaGFuZ2Vcblx0XHRcdCkge1xuXHRcdFx0XHRpZiAoZWxlbWVudFZpc2libGUoKSkge1xuXG5cdFx0XHRcdFx0ZnJlZXplQ29udGVudEhlaWdodCgpO1xuXHRcdFx0XHRcdGlmIChjdXJyZW50Vmlldy5zdGFydCkgeyAvLyByZW5kZXJlZCBiZWZvcmU/XG5cdFx0XHRcdFx0XHRjdXJyZW50Vmlldy5kZXN0cm95VmlldygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjdXJyZW50Vmlldy5zZXREYXRlKGRhdGUpO1xuXHRcdFx0XHRcdGN1cnJlbnRWaWV3LnJlbmRlclZpZXcoKTtcblx0XHRcdFx0XHR1bmZyZWV6ZUNvbnRlbnRIZWlnaHQoKTtcblxuXHRcdFx0XHRcdC8vIG5lZWQgdG8gZG8gdGhpcyBhZnRlciBWaWV3OjpyZW5kZXIsIHNvIGRhdGVzIGFyZSBjYWxjdWxhdGVkXG5cdFx0XHRcdFx0dXBkYXRlVGl0bGUoKTtcblx0XHRcdFx0XHR1cGRhdGVUb2RheUJ1dHRvbigpO1xuXG5cdFx0XHRcdFx0Z2V0QW5kUmVuZGVyRXZlbnRzKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHR1bmZyZWV6ZUNvbnRlbnRIZWlnaHQoKTsgLy8gdW5kbyBhbnkgbG9uZSBmcmVlemVDb250ZW50SGVpZ2h0IGNhbGxzXG5cdFx0aWdub3JlV2luZG93UmVzaXplLS07XG5cdH1cblxuXG5cblx0Ly8gVmlldyBJbnN0YW50aWF0aW9uXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuXHQvLyBHaXZlbiBhIHZpZXcgbmFtZSBmb3IgYSBjdXN0b20gdmlldyBvciBhIHN0YW5kYXJkIHZpZXcsIGNyZWF0ZXMgYSByZWFkeS10by1nbyBWaWV3IG9iamVjdFxuXHRmdW5jdGlvbiBpbnN0YW50aWF0ZVZpZXcodmlld1R5cGUpIHtcblx0XHR2YXIgc3BlYyA9IGdldFZpZXdTcGVjKHZpZXdUeXBlKTtcblxuXHRcdHJldHVybiBuZXcgc3BlY1snY2xhc3MnXSh0LCBzcGVjLm9wdGlvbnMsIHZpZXdUeXBlKTtcblx0fVxuXG5cblx0Ly8gR2V0cyBpbmZvcm1hdGlvbiBhYm91dCBob3cgdG8gY3JlYXRlIGEgdmlld1xuXHRmdW5jdGlvbiBnZXRWaWV3U3BlYyhyZXF1ZXN0ZWRWaWV3VHlwZSkge1xuXHRcdHZhciBhbGxEZWZhdWx0QnV0dG9uVGV4dCA9IG9wdGlvbnMuZGVmYXVsdEJ1dHRvblRleHQgfHwge307XG5cdFx0dmFyIGFsbEJ1dHRvblRleHQgPSBvcHRpb25zLmJ1dHRvblRleHQgfHwge307XG5cdFx0dmFyIGhhc2ggPSBvcHRpb25zLnZpZXdzIHx8IHt9OyAvLyB0aGUgYHZpZXdzYCBvcHRpb24gb2JqZWN0XG5cdFx0dmFyIHZpZXdUeXBlID0gcmVxdWVzdGVkVmlld1R5cGU7XG5cdFx0dmFyIHZpZXdPcHRpb25zQ2hhaW4gPSBbXTtcblx0XHR2YXIgdmlld09wdGlvbnM7XG5cdFx0dmFyIHZpZXdDbGFzcztcblx0XHR2YXIgZHVyYXRpb24sIHVuaXQsIHVuaXRJc1NpbmdsZSA9IGZhbHNlO1xuXHRcdHZhciBidXR0b25UZXh0O1xuXG5cdFx0aWYgKHZpZXdTcGVjQ2FjaGVbcmVxdWVzdGVkVmlld1R5cGVdKSB7XG5cdFx0XHRyZXR1cm4gdmlld1NwZWNDYWNoZVtyZXF1ZXN0ZWRWaWV3VHlwZV07XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gcHJvY2Vzc1NwZWNJbnB1dChpbnB1dCkge1xuXHRcdFx0aWYgKHR5cGVvZiBpbnB1dCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHR2aWV3Q2xhc3MgPSBpbnB1dDtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0JC5leHRlbmQodmlld09wdGlvbnMsIGlucHV0KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBpdGVyYXRlIHVwIGEgdmlldydzIHNwZWMgYW5jZXN0b3IgY2hhaW4gdXRpbCB3ZSBmaW5kIGEgY2xhc3MgdG8gaW5zdGFudGlhdGVcblx0XHR3aGlsZSAodmlld1R5cGUgJiYgIXZpZXdDbGFzcykge1xuXHRcdFx0dmlld09wdGlvbnMgPSB7fTsgLy8gb25seSBmb3IgdGhpcyBzcGVjaWZpYyB2aWV3IGluIHRoZSBhbmNlc3RyeVxuXHRcdFx0cHJvY2Vzc1NwZWNJbnB1dChmY1ZpZXdzW3ZpZXdUeXBlXSk7IC8vICQuZnVsbENhbGVuZGFyLnZpZXdzLCBsb3dlciBwcmVjZWRlbmNlXG5cdFx0XHRwcm9jZXNzU3BlY0lucHV0KGhhc2hbdmlld1R5cGVdKTsgLy8gb3B0aW9ucyBhdCBpbml0aWFsaXphdGlvbiwgaGlnaGVyIHByZWNlZGVuY2Vcblx0XHRcdHZpZXdPcHRpb25zQ2hhaW4udW5zaGlmdCh2aWV3T3B0aW9ucyk7IC8vIHJlY29yZCBvbGRlciBhbmNlc3RvcnMgZmlyc3Rcblx0XHRcdHZpZXdUeXBlID0gdmlld09wdGlvbnMudHlwZTtcblx0XHR9XG5cblx0XHR2aWV3T3B0aW9uc0NoYWluLnVuc2hpZnQoe30pOyAvLyBqUXVlcnkncyBleHRlbmQgbmVlZHMgYXQgbGVhc3Qgb25lIGFyZ1xuXHRcdHZpZXdPcHRpb25zID0gJC5leHRlbmQuYXBwbHkoJCwgdmlld09wdGlvbnNDaGFpbik7IC8vIGNvbWJpbmUgYWxsLCBuZXdlciBhbmNlc3RvcnMgb3ZlcndyaXR0aW5nIG9sZFxuXG5cdFx0aWYgKHZpZXdDbGFzcykge1xuXG5cdFx0XHRkdXJhdGlvbiA9IHZpZXdPcHRpb25zLmR1cmF0aW9uIHx8IHZpZXdDbGFzcy5kdXJhdGlvbjtcblx0XHRcdGlmIChkdXJhdGlvbikge1xuXHRcdFx0XHRkdXJhdGlvbiA9IG1vbWVudC5kdXJhdGlvbihkdXJhdGlvbik7XG5cdFx0XHRcdHVuaXQgPSBjb21wdXRlSW50ZXJ2YWxVbml0KGR1cmF0aW9uKTtcblx0XHRcdFx0dW5pdElzU2luZ2xlID0gY29tcHV0ZUludGVydmFsQXModW5pdCwgZHVyYXRpb24pID09PSAxO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBvcHRpb25zIHRoYXQgYXJlIHNwZWNpZmllZCBwZXIgdGhlIHZpZXcncyBkdXJhdGlvbiwgbGlrZSBcIndlZWtcIiBvciBcImRheVwiXG5cdFx0XHRpZiAodW5pdElzU2luZ2xlICYmIGhhc2hbdW5pdF0pIHtcblx0XHRcdFx0dmlld09wdGlvbnMgPSAkLmV4dGVuZCh7fSwgaGFzaFt1bml0XSwgdmlld09wdGlvbnMpOyAvLyBsb3dlc3QgcHJpb3JpdHlcblx0XHRcdH1cblxuXHRcdFx0Ly8gY29tcHV0ZSB0aGUgZmluYWwgdGV4dCBmb3IgdGhlIGJ1dHRvbiByZXByZXNlbnRpbmcgdGhpcyB2aWV3XG5cdFx0XHRidXR0b25UZXh0ID1cblx0XHRcdFx0YWxsQnV0dG9uVGV4dFtyZXF1ZXN0ZWRWaWV3VHlwZV0gfHwgLy8gaW5pdCBvcHRpb25zLCBsaWtlIFwiYWdlbmRhV2Vla1wiXG5cdFx0XHRcdCh1bml0SXNTaW5nbGUgPyBhbGxCdXR0b25UZXh0W3VuaXRdIDogbnVsbCkgfHwgLy8gaW5pdCBvcHRpb25zLCBsaWtlIFwid2Vla1wiXG5cdFx0XHRcdGFsbERlZmF1bHRCdXR0b25UZXh0W3JlcXVlc3RlZFZpZXdUeXBlXSB8fCAvLyBsYW5nIGRhdGEsIGxpa2UgXCJhZ2VuZGFXZWVrXCJcblx0XHRcdFx0KHVuaXRJc1NpbmdsZSA/IGFsbERlZmF1bHRCdXR0b25UZXh0W3VuaXRdIDogbnVsbCkgfHwgLy8gbGFuZyBkYXRhLCBsaWtlIFwid2Vla1wiXG5cdFx0XHRcdHZpZXdPcHRpb25zLmJ1dHRvblRleHQgfHxcblx0XHRcdFx0dmlld0NsYXNzLmJ1dHRvblRleHQgfHxcblx0XHRcdFx0KGR1cmF0aW9uID8gaHVtYW5pemVEdXJhdGlvbihkdXJhdGlvbikgOiBudWxsKSB8fFxuXHRcdFx0XHRyZXF1ZXN0ZWRWaWV3VHlwZTtcblxuXHRcdFx0cmV0dXJuICh2aWV3U3BlY0NhY2hlW3JlcXVlc3RlZFZpZXdUeXBlXSA9IHtcblx0XHRcdFx0J2NsYXNzJzogdmlld0NsYXNzLFxuXHRcdFx0XHRvcHRpb25zOiB2aWV3T3B0aW9ucyxcblx0XHRcdFx0YnV0dG9uVGV4dDogYnV0dG9uVGV4dFxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblxuXHQvLyBSZXR1cm5zIGEgYm9vbGVhbiBhYm91dCB3aGV0aGVyIHRoZSB2aWV3IGlzIG9rYXkgdG8gaW5zdGFudGlhdGUgYXQgc29tZSBwb2ludFxuXHRmdW5jdGlvbiBpc1ZhbGlkVmlld1R5cGUodmlld1R5cGUpIHtcblx0XHRyZXR1cm4gQm9vbGVhbihnZXRWaWV3U3BlYyh2aWV3VHlwZSkpO1xuXHR9XG5cblxuXHQvLyBHZXRzIHRoZSB0ZXh0IHRoYXQgc2hvdWxkIGJlIGRpc3BsYXllZCBvbiBhIHZpZXcncyBidXR0b24gaW4gdGhlIGhlYWRlclxuXHRmdW5jdGlvbiBnZXRWaWV3QnV0dG9uVGV4dCh2aWV3VHlwZSkge1xuXHRcdHZhciBzcGVjID0gZ2V0Vmlld1NwZWModmlld1R5cGUpO1xuXG5cdFx0aWYgKHNwZWMpIHtcblx0XHRcdHJldHVybiBzcGVjLmJ1dHRvblRleHQ7XG5cdFx0fVxuXHR9XG5cdFxuXHRcblxuXHQvLyBSZXNpemluZ1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cblx0dC5nZXRTdWdnZXN0ZWRWaWV3SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHN1Z2dlc3RlZFZpZXdIZWlnaHQgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y2FsY1NpemUoKTtcblx0XHR9XG5cdFx0cmV0dXJuIHN1Z2dlc3RlZFZpZXdIZWlnaHQ7XG5cdH07XG5cblxuXHR0LmlzSGVpZ2h0QXV0byA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBvcHRpb25zLmNvbnRlbnRIZWlnaHQgPT09ICdhdXRvJyB8fCBvcHRpb25zLmhlaWdodCA9PT0gJ2F1dG8nO1xuXHR9O1xuXHRcblx0XG5cdGZ1bmN0aW9uIHVwZGF0ZVNpemUoc2hvdWxkUmVjYWxjKSB7XG5cdFx0aWYgKGVsZW1lbnRWaXNpYmxlKCkpIHtcblxuXHRcdFx0aWYgKHNob3VsZFJlY2FsYykge1xuXHRcdFx0XHRfY2FsY1NpemUoKTtcblx0XHRcdH1cblxuXHRcdFx0aWdub3JlV2luZG93UmVzaXplKys7XG5cdFx0XHRjdXJyZW50Vmlldy51cGRhdGVTaXplKHRydWUpOyAvLyBpc1Jlc2l6ZT10cnVlLiB3aWxsIHBvbGwgZ2V0U3VnZ2VzdGVkVmlld0hlaWdodCgpIGFuZCBpc0hlaWdodEF1dG8oKVxuXHRcdFx0aWdub3JlV2luZG93UmVzaXplLS07XG5cblx0XHRcdHJldHVybiB0cnVlOyAvLyBzaWduYWwgc3VjY2Vzc1xuXHRcdH1cblx0fVxuXG5cblx0ZnVuY3Rpb24gY2FsY1NpemUoKSB7XG5cdFx0aWYgKGVsZW1lbnRWaXNpYmxlKCkpIHtcblx0XHRcdF9jYWxjU2l6ZSgpO1xuXHRcdH1cblx0fVxuXHRcblx0XG5cdGZ1bmN0aW9uIF9jYWxjU2l6ZSgpIHsgLy8gYXNzdW1lcyBlbGVtZW50VmlzaWJsZVxuXHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5jb250ZW50SGVpZ2h0ID09PSAnbnVtYmVyJykgeyAvLyBleGlzdHMgYW5kIG5vdCAnYXV0bydcblx0XHRcdHN1Z2dlc3RlZFZpZXdIZWlnaHQgPSBvcHRpb25zLmNvbnRlbnRIZWlnaHQ7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmhlaWdodCA9PT0gJ251bWJlcicpIHsgLy8gZXhpc3RzIGFuZCBub3QgJ2F1dG8nXG5cdFx0XHRzdWdnZXN0ZWRWaWV3SGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgLSAoaGVhZGVyRWxlbWVudCA/IGhlYWRlckVsZW1lbnQub3V0ZXJIZWlnaHQodHJ1ZSkgOiAwKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRzdWdnZXN0ZWRWaWV3SGVpZ2h0ID0gTWF0aC5yb3VuZChjb250ZW50LndpZHRoKCkgLyBNYXRoLm1heChvcHRpb25zLmFzcGVjdFJhdGlvLCAuNSkpO1xuXHRcdH1cblx0fVxuXHRcblx0XG5cdGZ1bmN0aW9uIHdpbmRvd1Jlc2l6ZShldikge1xuXHRcdGlmIChcblx0XHRcdCFpZ25vcmVXaW5kb3dSZXNpemUgJiZcblx0XHRcdGV2LnRhcmdldCA9PT0gd2luZG93ICYmIC8vIHNvIHdlIGRvbid0IHByb2Nlc3MganF1aSBcInJlc2l6ZVwiIGV2ZW50cyB0aGF0IGhhdmUgYnViYmxlZCB1cFxuXHRcdFx0Y3VycmVudFZpZXcuc3RhcnQgLy8gdmlldyBoYXMgYWxyZWFkeSBiZWVuIHJlbmRlcmVkXG5cdFx0KSB7XG5cdFx0XHRpZiAodXBkYXRlU2l6ZSh0cnVlKSkge1xuXHRcdFx0XHRjdXJyZW50Vmlldy50cmlnZ2VyKCd3aW5kb3dSZXNpemUnLCBfZWxlbWVudCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdFxuXHRcblx0XG5cdC8qIEV2ZW50IEZldGNoaW5nL1JlbmRlcmluZ1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cdC8vIFRPRE86IGdvaW5nIGZvcndhcmQsIG1vc3Qgb2YgdGhpcyBzdHVmZiBzaG91bGQgYmUgZGlyZWN0bHkgaGFuZGxlZCBieSB0aGUgdmlld1xuXG5cblx0ZnVuY3Rpb24gcmVmZXRjaEV2ZW50cygpIHsgLy8gY2FuIGJlIGNhbGxlZCBhcyBhbiBBUEkgbWV0aG9kXG5cdFx0ZGVzdHJveUV2ZW50cygpOyAvLyBzbyB0aGF0IGV2ZW50cyBhcmUgY2xlYXJlZCBiZWZvcmUgdXNlciBzdGFydHMgd2FpdGluZyBmb3IgQUpBWFxuXHRcdGZldGNoQW5kUmVuZGVyRXZlbnRzKCk7XG5cdH1cblxuXG5cdGZ1bmN0aW9uIHJlbmRlckV2ZW50cygpIHsgLy8gZGVzdHJveXMgb2xkIGV2ZW50cyBpZiBwcmV2aW91c2x5IHJlbmRlcmVkXG5cdFx0aWYgKGVsZW1lbnRWaXNpYmxlKCkpIHtcblx0XHRcdGZyZWV6ZUNvbnRlbnRIZWlnaHQoKTtcblx0XHRcdGN1cnJlbnRWaWV3LmRlc3Ryb3lWaWV3RXZlbnRzKCk7IC8vIG5vIHBlcmZvcm1hbmNlIGNvc3QgaWYgbmV2ZXIgcmVuZGVyZWRcblx0XHRcdGN1cnJlbnRWaWV3LnJlbmRlclZpZXdFdmVudHMoZXZlbnRzKTtcblx0XHRcdHVuZnJlZXplQ29udGVudEhlaWdodCgpO1xuXHRcdH1cblx0fVxuXG5cblx0ZnVuY3Rpb24gZGVzdHJveUV2ZW50cygpIHtcblx0XHRmcmVlemVDb250ZW50SGVpZ2h0KCk7XG5cdFx0Y3VycmVudFZpZXcuZGVzdHJveVZpZXdFdmVudHMoKTtcblx0XHR1bmZyZWV6ZUNvbnRlbnRIZWlnaHQoKTtcblx0fVxuXHRcblxuXHRmdW5jdGlvbiBnZXRBbmRSZW5kZXJFdmVudHMoKSB7XG5cdFx0aWYgKCFvcHRpb25zLmxhenlGZXRjaGluZyB8fCBpc0ZldGNoTmVlZGVkKGN1cnJlbnRWaWV3LnN0YXJ0LCBjdXJyZW50Vmlldy5lbmQpKSB7XG5cdFx0XHRmZXRjaEFuZFJlbmRlckV2ZW50cygpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJlbmRlckV2ZW50cygpO1xuXHRcdH1cblx0fVxuXG5cblx0ZnVuY3Rpb24gZmV0Y2hBbmRSZW5kZXJFdmVudHMoKSB7XG5cdFx0ZmV0Y2hFdmVudHMoY3VycmVudFZpZXcuc3RhcnQsIGN1cnJlbnRWaWV3LmVuZCk7XG5cdFx0XHQvLyAuLi4gd2lsbCBjYWxsIHJlcG9ydEV2ZW50c1xuXHRcdFx0Ly8gLi4uIHdoaWNoIHdpbGwgY2FsbCByZW5kZXJFdmVudHNcblx0fVxuXG5cdFxuXHQvLyBjYWxsZWQgd2hlbiBldmVudCBkYXRhIGFycml2ZXNcblx0ZnVuY3Rpb24gcmVwb3J0RXZlbnRzKF9ldmVudHMpIHtcblx0XHRldmVudHMgPSBfZXZlbnRzO1xuXHRcdHJlbmRlckV2ZW50cygpO1xuXHR9XG5cblxuXHQvLyBjYWxsZWQgd2hlbiBhIHNpbmdsZSBldmVudCdzIGRhdGEgaGFzIGJlZW4gY2hhbmdlZFxuXHRmdW5jdGlvbiByZXBvcnRFdmVudENoYW5nZSgpIHtcblx0XHRyZW5kZXJFdmVudHMoKTtcblx0fVxuXG5cblxuXHQvKiBIZWFkZXIgVXBkYXRpbmdcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0ZnVuY3Rpb24gdXBkYXRlVGl0bGUoKSB7XG5cdFx0aGVhZGVyLnVwZGF0ZVRpdGxlKGN1cnJlbnRWaWV3LmNvbXB1dGVUaXRsZSgpKTtcblx0fVxuXG5cblx0ZnVuY3Rpb24gdXBkYXRlVG9kYXlCdXR0b24oKSB7XG5cdFx0dmFyIG5vdyA9IHQuZ2V0Tm93KCk7XG5cdFx0aWYgKG5vdy5pc1dpdGhpbihjdXJyZW50Vmlldy5pbnRlcnZhbFN0YXJ0LCBjdXJyZW50Vmlldy5pbnRlcnZhbEVuZCkpIHtcblx0XHRcdGhlYWRlci5kaXNhYmxlQnV0dG9uKCd0b2RheScpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGhlYWRlci5lbmFibGVCdXR0b24oJ3RvZGF5Jyk7XG5cdFx0fVxuXHR9XG5cdFxuXG5cblx0LyogU2VsZWN0aW9uXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblx0XG5cblx0ZnVuY3Rpb24gc2VsZWN0KHN0YXJ0LCBlbmQpIHtcblxuXHRcdHN0YXJ0ID0gdC5tb21lbnQoc3RhcnQpO1xuXHRcdGlmIChlbmQpIHtcblx0XHRcdGVuZCA9IHQubW9tZW50KGVuZCk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHN0YXJ0Lmhhc1RpbWUoKSkge1xuXHRcdFx0ZW5kID0gc3RhcnQuY2xvbmUoKS5hZGQodC5kZWZhdWx0VGltZWRFdmVudER1cmF0aW9uKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRlbmQgPSBzdGFydC5jbG9uZSgpLmFkZCh0LmRlZmF1bHRBbGxEYXlFdmVudER1cmF0aW9uKTtcblx0XHR9XG5cblx0XHRjdXJyZW50Vmlldy5zZWxlY3QoeyBzdGFydDogc3RhcnQsIGVuZDogZW5kIH0pOyAvLyBhY2NlcHRzIGEgcmFuZ2Vcblx0fVxuXHRcblxuXHRmdW5jdGlvbiB1bnNlbGVjdCgpIHsgLy8gc2FmZSB0byBiZSBjYWxsZWQgYmVmb3JlIHJlbmRlclZpZXdcblx0XHRpZiAoY3VycmVudFZpZXcpIHtcblx0XHRcdGN1cnJlbnRWaWV3LnVuc2VsZWN0KCk7XG5cdFx0fVxuXHR9XG5cdFxuXHRcblx0XG5cdC8qIERhdGVcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXHRcblx0XG5cdGZ1bmN0aW9uIHByZXYoKSB7XG5cdFx0cmVuZGVyVmlldygtMSk7XG5cdH1cblx0XG5cdFxuXHRmdW5jdGlvbiBuZXh0KCkge1xuXHRcdHJlbmRlclZpZXcoMSk7XG5cdH1cblx0XG5cdFxuXHRmdW5jdGlvbiBwcmV2WWVhcigpIHtcblx0XHRkYXRlLmFkZCgtMSwgJ3llYXJzJyk7XG5cdFx0cmVuZGVyVmlldygpO1xuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gbmV4dFllYXIoKSB7XG5cdFx0ZGF0ZS5hZGQoMSwgJ3llYXJzJyk7XG5cdFx0cmVuZGVyVmlldygpO1xuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gdG9kYXkoKSB7XG5cdFx0ZGF0ZSA9IHQuZ2V0Tm93KCk7XG5cdFx0cmVuZGVyVmlldygpO1xuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gZ290b0RhdGUoZGF0ZUlucHV0KSB7XG5cdFx0ZGF0ZSA9IHQubW9tZW50KGRhdGVJbnB1dCk7XG5cdFx0cmVuZGVyVmlldygpO1xuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gaW5jcmVtZW50RGF0ZShkZWx0YSkge1xuXHRcdGRhdGUuYWRkKG1vbWVudC5kdXJhdGlvbihkZWx0YSkpO1xuXHRcdHJlbmRlclZpZXcoKTtcblx0fVxuXG5cblx0Ly8gRm9yY2VzIG5hdmlnYXRpb24gdG8gYSB2aWV3IGZvciB0aGUgZ2l2ZW4gZGF0ZS5cblx0Ly8gYHZpZXdUeXBlYCBjYW4gYmUgYSBzcGVjaWZpYyB2aWV3IG5hbWUgb3IgYSBnZW5lcmljIG9uZSBsaWtlIFwid2Vla1wiIG9yIFwiZGF5XCIuXG5cdGZ1bmN0aW9uIHpvb21UbyhuZXdEYXRlLCB2aWV3VHlwZSkge1xuXHRcdHZhciB2aWV3U3RyO1xuXHRcdHZhciBtYXRjaDtcblxuXHRcdGlmICghdmlld1R5cGUgfHwgIWlzVmFsaWRWaWV3VHlwZSh2aWV3VHlwZSkpIHsgLy8gYSBnZW5lcmFsIHZpZXcgbmFtZSwgb3IgXCJhdXRvXCJcblx0XHRcdHZpZXdUeXBlID0gdmlld1R5cGUgfHwgJ2RheSc7XG5cdFx0XHR2aWV3U3RyID0gaGVhZGVyLmdldFZpZXdzV2l0aEJ1dHRvbnMoKS5qb2luKCcgJyk7IC8vIHNwYWNlLXNlcGFyYXRlZCBzdHJpbmcgb2YgYWxsIHRoZSB2aWV3cyBpbiB0aGUgaGVhZGVyXG5cblx0XHRcdC8vIHRyeSB0byBtYXRjaCBhIGdlbmVyYWwgdmlldyBuYW1lLCBsaWtlIFwid2Vla1wiLCBhZ2FpbnN0IGEgc3BlY2lmaWMgb25lLCBsaWtlIFwiYWdlbmRhV2Vla1wiXG5cdFx0XHRtYXRjaCA9IHZpZXdTdHIubWF0Y2gobmV3IFJlZ0V4cCgnXFxcXHcrJyArIGNhcGl0YWxpc2VGaXJzdExldHRlcih2aWV3VHlwZSkpKTtcblxuXHRcdFx0Ly8gZmFsbCBiYWNrIHRvIHRoZSBkYXkgdmlldyBiZWluZyB1c2VkIGluIHRoZSBoZWFkZXJcblx0XHRcdGlmICghbWF0Y2gpIHtcblx0XHRcdFx0bWF0Y2ggPSB2aWV3U3RyLm1hdGNoKC9cXHcrRGF5Lyk7XG5cdFx0XHR9XG5cblx0XHRcdHZpZXdUeXBlID0gbWF0Y2ggPyBtYXRjaFswXSA6ICdhZ2VuZGFEYXknOyAvLyBmYWxsIGJhY2sgdG8gYWdlbmRhRGF5XG5cdFx0fVxuXG5cdFx0ZGF0ZSA9IG5ld0RhdGU7XG5cdFx0Y2hhbmdlVmlldyh2aWV3VHlwZSk7XG5cdH1cblx0XG5cdFxuXHRmdW5jdGlvbiBnZXREYXRlKCkge1xuXHRcdHJldHVybiBkYXRlLmNsb25lKCk7XG5cdH1cblxuXG5cblx0LyogSGVpZ2h0IFwiRnJlZXppbmdcIlxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuXHRmdW5jdGlvbiBmcmVlemVDb250ZW50SGVpZ2h0KCkge1xuXHRcdGNvbnRlbnQuY3NzKHtcblx0XHRcdHdpZHRoOiAnMTAwJScsXG5cdFx0XHRoZWlnaHQ6IGNvbnRlbnQuaGVpZ2h0KCksXG5cdFx0XHRvdmVyZmxvdzogJ2hpZGRlbidcblx0XHR9KTtcblx0fVxuXG5cblx0ZnVuY3Rpb24gdW5mcmVlemVDb250ZW50SGVpZ2h0KCkge1xuXHRcdGNvbnRlbnQuY3NzKHtcblx0XHRcdHdpZHRoOiAnJyxcblx0XHRcdGhlaWdodDogJycsXG5cdFx0XHRvdmVyZmxvdzogJydcblx0XHR9KTtcblx0fVxuXHRcblx0XG5cdFxuXHQvKiBNaXNjXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblx0XG5cblx0ZnVuY3Rpb24gZ2V0Q2FsZW5kYXIoKSB7XG5cdFx0cmV0dXJuIHQ7XG5cdH1cblxuXHRcblx0ZnVuY3Rpb24gZ2V0VmlldygpIHtcblx0XHRyZXR1cm4gY3VycmVudFZpZXc7XG5cdH1cblx0XG5cdFxuXHRmdW5jdGlvbiBvcHRpb24obmFtZSwgdmFsdWUpIHtcblx0XHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIG9wdGlvbnNbbmFtZV07XG5cdFx0fVxuXHRcdGlmIChuYW1lID09ICdoZWlnaHQnIHx8IG5hbWUgPT0gJ2NvbnRlbnRIZWlnaHQnIHx8IG5hbWUgPT0gJ2FzcGVjdFJhdGlvJykge1xuXHRcdFx0b3B0aW9uc1tuYW1lXSA9IHZhbHVlO1xuXHRcdFx0dXBkYXRlU2l6ZSh0cnVlKTsgLy8gdHJ1ZSA9IGFsbG93IHJlY2FsY3VsYXRpb24gb2YgaGVpZ2h0XG5cdFx0fVxuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gdHJpZ2dlcihuYW1lLCB0aGlzT2JqKSB7XG5cdFx0aWYgKG9wdGlvbnNbbmFtZV0pIHtcblx0XHRcdHJldHVybiBvcHRpb25zW25hbWVdLmFwcGx5KFxuXHRcdFx0XHR0aGlzT2JqIHx8IF9lbGVtZW50LFxuXHRcdFx0XHRBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG59XG5cbiAgICAvKiBUb3AgdG9vbGJhciBhcmVhIHdpdGggYnV0dG9ucyBhbmQgdGl0bGVcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuLy8gVE9ETzogcmVuYW1lIGFsbCBoZWFkZXItcmVsYXRlZCB0aGluZ3MgdG8gXCJ0b29sYmFyXCJcblxuZnVuY3Rpb24gSGVhZGVyKGNhbGVuZGFyLCBvcHRpb25zKSB7XG5cdHZhciB0ID0gdGhpcztcblx0XG5cdC8vIGV4cG9ydHNcblx0dC5yZW5kZXIgPSByZW5kZXI7XG5cdHQuZGVzdHJveSA9IGRlc3Ryb3k7XG5cdHQudXBkYXRlVGl0bGUgPSB1cGRhdGVUaXRsZTtcblx0dC5hY3RpdmF0ZUJ1dHRvbiA9IGFjdGl2YXRlQnV0dG9uO1xuXHR0LmRlYWN0aXZhdGVCdXR0b24gPSBkZWFjdGl2YXRlQnV0dG9uO1xuXHR0LmRpc2FibGVCdXR0b24gPSBkaXNhYmxlQnV0dG9uO1xuXHR0LmVuYWJsZUJ1dHRvbiA9IGVuYWJsZUJ1dHRvbjtcblx0dC5nZXRWaWV3c1dpdGhCdXR0b25zID0gZ2V0Vmlld3NXaXRoQnV0dG9ucztcblx0XG5cdC8vIGxvY2Fsc1xuXHR2YXIgZWwgPSAkKCk7XG5cdHZhciB2aWV3c1dpdGhCdXR0b25zID0gW107XG5cdHZhciB0bTtcblxuXG5cdGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgc2VjdGlvbnMgPSBvcHRpb25zLmhlYWRlcjtcblxuXHRcdHRtID0gb3B0aW9ucy50aGVtZSA/ICd1aScgOiAnZmMnO1xuXG5cdFx0aWYgKHNlY3Rpb25zKSB7XG5cdFx0XHRlbCA9ICQoXCI8ZGl2IGNsYXNzPSdmYy10b29sYmFyJy8+XCIpXG5cdFx0XHRcdC5hcHBlbmQocmVuZGVyU2VjdGlvbignbGVmdCcpKVxuXHRcdFx0XHQuYXBwZW5kKHJlbmRlclNlY3Rpb24oJ3JpZ2h0JykpXG5cdFx0XHRcdC5hcHBlbmQocmVuZGVyU2VjdGlvbignY2VudGVyJykpXG5cdFx0XHRcdC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJmYy1jbGVhclwiLz4nKTtcblxuXHRcdFx0cmV0dXJuIGVsO1xuXHRcdH1cblx0fVxuXHRcblx0XG5cdGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG5cdFx0ZWwucmVtb3ZlKCk7XG5cdH1cblx0XG5cdFxuXHRmdW5jdGlvbiByZW5kZXJTZWN0aW9uKHBvc2l0aW9uKSB7XG5cdFx0dmFyIHNlY3Rpb25FbCA9ICQoJzxkaXYgY2xhc3M9XCJmYy0nICsgcG9zaXRpb24gKyAnXCIvPicpO1xuXHRcdHZhciBidXR0b25TdHIgPSBvcHRpb25zLmhlYWRlcltwb3NpdGlvbl07XG5cblx0XHRpZiAoYnV0dG9uU3RyKSB7XG5cdFx0XHQkLmVhY2goYnV0dG9uU3RyLnNwbGl0KCcgJyksIGZ1bmN0aW9uKGkpIHtcblx0XHRcdFx0dmFyIGdyb3VwQ2hpbGRyZW4gPSAkKCk7XG5cdFx0XHRcdHZhciBpc09ubHlCdXR0b25zID0gdHJ1ZTtcblx0XHRcdFx0dmFyIGdyb3VwRWw7XG5cblx0XHRcdFx0JC5lYWNoKHRoaXMuc3BsaXQoJywnKSwgZnVuY3Rpb24oaiwgYnV0dG9uTmFtZSkge1xuXHRcdFx0XHRcdHZhciBidXR0b25DbGljaztcblx0XHRcdFx0XHR2YXIgdGhlbWVJY29uO1xuXHRcdFx0XHRcdHZhciBub3JtYWxJY29uO1xuXHRcdFx0XHRcdHZhciBkZWZhdWx0VGV4dDtcblx0XHRcdFx0XHR2YXIgdmlld1RleHQ7IC8vIGhpZ2hlc3QgcHJpb3JpdHlcblx0XHRcdFx0XHR2YXIgY3VzdG9tVGV4dDtcblx0XHRcdFx0XHR2YXIgaW5uZXJIdG1sO1xuXHRcdFx0XHRcdHZhciBjbGFzc2VzO1xuXHRcdFx0XHRcdHZhciBidXR0b247XG5cblx0XHRcdFx0XHRpZiAoYnV0dG9uTmFtZSA9PSAndGl0bGUnKSB7XG5cdFx0XHRcdFx0XHRncm91cENoaWxkcmVuID0gZ3JvdXBDaGlsZHJlbi5hZGQoJCgnPGgyPiZuYnNwOzwvaDI+JykpOyAvLyB3ZSBhbHdheXMgd2FudCBpdCB0byB0YWtlIHVwIGhlaWdodFxuXHRcdFx0XHRcdFx0aXNPbmx5QnV0dG9ucyA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGlmIChjYWxlbmRhcltidXR0b25OYW1lXSkgeyAvLyBhIGNhbGVuZGFyIG1ldGhvZFxuXHRcdFx0XHRcdFx0XHRidXR0b25DbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdGNhbGVuZGFyW2J1dHRvbk5hbWVdKCk7XG5cdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIGlmIChjYWxlbmRhci5pc1ZhbGlkVmlld1R5cGUoYnV0dG9uTmFtZSkpIHsgLy8gYSB2aWV3IHR5cGVcblx0XHRcdFx0XHRcdFx0YnV0dG9uQ2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0XHRjYWxlbmRhci5jaGFuZ2VWaWV3KGJ1dHRvbk5hbWUpO1xuXHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHR2aWV3c1dpdGhCdXR0b25zLnB1c2goYnV0dG9uTmFtZSk7XG5cdFx0XHRcdFx0XHRcdHZpZXdUZXh0ID0gY2FsZW5kYXIuZ2V0Vmlld0J1dHRvblRleHQoYnV0dG9uTmFtZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAoYnV0dG9uQ2xpY2spIHtcblxuXHRcdFx0XHRcdFx0XHQvLyBzbWFydFByb3BlcnR5IGFsbG93cyBkaWZmZXJlbnQgdGV4dCBwZXIgdmlldyBidXR0b24gKGV4OiBcIkFnZW5kYSBXZWVrXCIgdnMgXCJCYXNpYyBXZWVrXCIpXG5cdFx0XHRcdFx0XHRcdHRoZW1lSWNvbiA9IHNtYXJ0UHJvcGVydHkob3B0aW9ucy50aGVtZUJ1dHRvbkljb25zLCBidXR0b25OYW1lKTtcblx0XHRcdFx0XHRcdFx0bm9ybWFsSWNvbiA9IHNtYXJ0UHJvcGVydHkob3B0aW9ucy5idXR0b25JY29ucywgYnV0dG9uTmFtZSk7XG5cdFx0XHRcdFx0XHRcdGRlZmF1bHRUZXh0ID0gc21hcnRQcm9wZXJ0eShvcHRpb25zLmRlZmF1bHRCdXR0b25UZXh0LCBidXR0b25OYW1lKTsgLy8gZnJvbSBsYW5ndWFnZXNcblx0XHRcdFx0XHRcdFx0Y3VzdG9tVGV4dCA9IHNtYXJ0UHJvcGVydHkob3B0aW9ucy5idXR0b25UZXh0LCBidXR0b25OYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAodmlld1RleHQgfHwgY3VzdG9tVGV4dCkge1xuXHRcdFx0XHRcdFx0XHRcdGlubmVySHRtbCA9IGh0bWxFc2NhcGUodmlld1RleHQgfHwgY3VzdG9tVGV4dCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ZWxzZSBpZiAodGhlbWVJY29uICYmIG9wdGlvbnMudGhlbWUpIHtcblx0XHRcdFx0XHRcdFx0XHRpbm5lckh0bWwgPSBcIjxzcGFuIGNsYXNzPSd1aS1pY29uIHVpLWljb24tXCIgKyB0aGVtZUljb24gKyBcIic+PC9zcGFuPlwiO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2UgaWYgKG5vcm1hbEljb24gJiYgIW9wdGlvbnMudGhlbWUpIHtcblx0XHRcdFx0XHRcdFx0XHRpbm5lckh0bWwgPSBcIjxzcGFuIGNsYXNzPSdmYy1pY29uIGZjLWljb24tXCIgKyBub3JtYWxJY29uICsgXCInPjwvc3Bhbj5cIjtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRpbm5lckh0bWwgPSBodG1sRXNjYXBlKGRlZmF1bHRUZXh0IHx8IGJ1dHRvbk5hbWUpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0Y2xhc3NlcyA9IFtcblx0XHRcdFx0XHRcdFx0XHQnZmMtJyArIGJ1dHRvbk5hbWUgKyAnLWJ1dHRvbicsXG5cdFx0XHRcdFx0XHRcdFx0dG0gKyAnLWJ1dHRvbicsXG5cdFx0XHRcdFx0XHRcdFx0dG0gKyAnLXN0YXRlLWRlZmF1bHQnXG5cdFx0XHRcdFx0XHRcdF07XG5cblx0XHRcdFx0XHRcdFx0YnV0dG9uID0gJCggLy8gdHlwZT1cImJ1dHRvblwiIHNvIHRoYXQgaXQgZG9lc24ndCBzdWJtaXQgYSBmb3JtXG5cdFx0XHRcdFx0XHRcdFx0JzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiJyArIGNsYXNzZXMuam9pbignICcpICsgJ1wiPicgK1xuXHRcdFx0XHRcdFx0XHRcdFx0aW5uZXJIdG1sICtcblx0XHRcdFx0XHRcdFx0XHQnPC9idXR0b24+J1xuXHRcdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdFx0XHQuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBkb24ndCBwcm9jZXNzIGNsaWNrcyBmb3IgZGlzYWJsZWQgYnV0dG9uc1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKCFidXR0b24uaGFzQ2xhc3ModG0gKyAnLXN0YXRlLWRpc2FibGVkJykpIHtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRidXR0b25DbGljaygpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIGFmdGVyIHRoZSBjbGljayBhY3Rpb24sIGlmIHRoZSBidXR0b24gYmVjb21lcyB0aGUgXCJhY3RpdmVcIiB0YWIsIG9yIGRpc2FibGVkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBpdCBzaG91bGQgbmV2ZXIgaGF2ZSBhIGhvdmVyIGNsYXNzLCBzbyByZW1vdmUgaXQgbm93LlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnV0dG9uLmhhc0NsYXNzKHRtICsgJy1zdGF0ZS1hY3RpdmUnKSB8fFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJ1dHRvbi5oYXNDbGFzcyh0bSArICctc3RhdGUtZGlzYWJsZWQnKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRidXR0b24ucmVtb3ZlQ2xhc3ModG0gKyAnLXN0YXRlLWhvdmVyJyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdC5tb3VzZWRvd24oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyB0aGUgKmRvd24qIGVmZmVjdCAobW91c2UgcHJlc3NlZCBpbikuXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBvbmx5IG9uIGJ1dHRvbnMgdGhhdCBhcmUgbm90IHRoZSBcImFjdGl2ZVwiIHRhYiwgb3IgZGlzYWJsZWRcblx0XHRcdFx0XHRcdFx0XHRcdGJ1dHRvblxuXHRcdFx0XHRcdFx0XHRcdFx0XHQubm90KCcuJyArIHRtICsgJy1zdGF0ZS1hY3RpdmUnKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQubm90KCcuJyArIHRtICsgJy1zdGF0ZS1kaXNhYmxlZCcpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC5hZGRDbGFzcyh0bSArICctc3RhdGUtZG93bicpO1xuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0Lm1vdXNldXAoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyB1bmRvIHRoZSAqZG93biogZWZmZWN0XG5cdFx0XHRcdFx0XHRcdFx0XHRidXR0b24ucmVtb3ZlQ2xhc3ModG0gKyAnLXN0YXRlLWRvd24nKTtcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdC5ob3Zlcihcblx0XHRcdFx0XHRcdFx0XHRcdGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyB0aGUgKmhvdmVyKiBlZmZlY3QuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIG9ubHkgb24gYnV0dG9ucyB0aGF0IGFyZSBub3QgdGhlIFwiYWN0aXZlXCIgdGFiLCBvciBkaXNhYmxlZFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRidXR0b25cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQubm90KCcuJyArIHRtICsgJy1zdGF0ZS1hY3RpdmUnKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5ub3QoJy4nICsgdG0gKyAnLXN0YXRlLWRpc2FibGVkJylcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuYWRkQ2xhc3ModG0gKyAnLXN0YXRlLWhvdmVyJyk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0ZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIHVuZG8gdGhlICpob3ZlciogZWZmZWN0XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGJ1dHRvblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5yZW1vdmVDbGFzcyh0bSArICctc3RhdGUtaG92ZXInKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5yZW1vdmVDbGFzcyh0bSArICctc3RhdGUtZG93bicpOyAvLyBpZiBtb3VzZWxlYXZlIGhhcHBlbnMgYmVmb3JlIG1vdXNldXBcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0XHRcdGdyb3VwQ2hpbGRyZW4gPSBncm91cENoaWxkcmVuLmFkZChidXR0b24pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aWYgKGlzT25seUJ1dHRvbnMpIHtcblx0XHRcdFx0XHRncm91cENoaWxkcmVuXG5cdFx0XHRcdFx0XHQuZmlyc3QoKS5hZGRDbGFzcyh0bSArICctY29ybmVyLWxlZnQnKS5lbmQoKVxuXHRcdFx0XHRcdFx0Lmxhc3QoKS5hZGRDbGFzcyh0bSArICctY29ybmVyLXJpZ2h0JykuZW5kKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoZ3JvdXBDaGlsZHJlbi5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdFx0Z3JvdXBFbCA9ICQoJzxkaXYvPicpO1xuXHRcdFx0XHRcdGlmIChpc09ubHlCdXR0b25zKSB7XG5cdFx0XHRcdFx0XHRncm91cEVsLmFkZENsYXNzKCdmYy1idXR0b24tZ3JvdXAnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Z3JvdXBFbC5hcHBlbmQoZ3JvdXBDaGlsZHJlbik7XG5cdFx0XHRcdFx0c2VjdGlvbkVsLmFwcGVuZChncm91cEVsKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRzZWN0aW9uRWwuYXBwZW5kKGdyb3VwQ2hpbGRyZW4pOyAvLyAxIG9yIDAgY2hpbGRyZW5cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNlY3Rpb25FbDtcblx0fVxuXHRcblx0XG5cdGZ1bmN0aW9uIHVwZGF0ZVRpdGxlKHRleHQpIHtcblx0XHRlbC5maW5kKCdoMicpLnRleHQodGV4dCk7XG5cdH1cblx0XG5cdFxuXHRmdW5jdGlvbiBhY3RpdmF0ZUJ1dHRvbihidXR0b25OYW1lKSB7XG5cdFx0ZWwuZmluZCgnLmZjLScgKyBidXR0b25OYW1lICsgJy1idXR0b24nKVxuXHRcdFx0LmFkZENsYXNzKHRtICsgJy1zdGF0ZS1hY3RpdmUnKTtcblx0fVxuXHRcblx0XG5cdGZ1bmN0aW9uIGRlYWN0aXZhdGVCdXR0b24oYnV0dG9uTmFtZSkge1xuXHRcdGVsLmZpbmQoJy5mYy0nICsgYnV0dG9uTmFtZSArICctYnV0dG9uJylcblx0XHRcdC5yZW1vdmVDbGFzcyh0bSArICctc3RhdGUtYWN0aXZlJyk7XG5cdH1cblx0XG5cdFxuXHRmdW5jdGlvbiBkaXNhYmxlQnV0dG9uKGJ1dHRvbk5hbWUpIHtcblx0XHRlbC5maW5kKCcuZmMtJyArIGJ1dHRvbk5hbWUgKyAnLWJ1dHRvbicpXG5cdFx0XHQuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKVxuXHRcdFx0LmFkZENsYXNzKHRtICsgJy1zdGF0ZS1kaXNhYmxlZCcpO1xuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gZW5hYmxlQnV0dG9uKGJ1dHRvbk5hbWUpIHtcblx0XHRlbC5maW5kKCcuZmMtJyArIGJ1dHRvbk5hbWUgKyAnLWJ1dHRvbicpXG5cdFx0XHQucmVtb3ZlQXR0cignZGlzYWJsZWQnKVxuXHRcdFx0LnJlbW92ZUNsYXNzKHRtICsgJy1zdGF0ZS1kaXNhYmxlZCcpO1xuXHR9XG5cblxuXHRmdW5jdGlvbiBnZXRWaWV3c1dpdGhCdXR0b25zKCkge1xuXHRcdHJldHVybiB2aWV3c1dpdGhCdXR0b25zO1xuXHR9XG5cbn1cblxuICAgIGZjLnNvdXJjZU5vcm1hbGl6ZXJzID0gW107XG5mYy5zb3VyY2VGZXRjaGVycyA9IFtdO1xuXG52YXIgYWpheERlZmF1bHRzID0ge1xuXHRkYXRhVHlwZTogJ2pzb24nLFxuXHRjYWNoZTogZmFsc2Vcbn07XG5cbnZhciBldmVudEdVSUQgPSAxO1xuXG5cbmZ1bmN0aW9uIEV2ZW50TWFuYWdlcihvcHRpb25zKSB7IC8vIGFzc3VtZWQgdG8gYmUgYSBjYWxlbmRhclxuXHR2YXIgdCA9IHRoaXM7XG5cdFxuXHRcblx0Ly8gZXhwb3J0c1xuXHR0LmlzRmV0Y2hOZWVkZWQgPSBpc0ZldGNoTmVlZGVkO1xuXHR0LmZldGNoRXZlbnRzID0gZmV0Y2hFdmVudHM7XG5cdHQuYWRkRXZlbnRTb3VyY2UgPSBhZGRFdmVudFNvdXJjZTtcblx0dC5yZW1vdmVFdmVudFNvdXJjZSA9IHJlbW92ZUV2ZW50U291cmNlO1xuXHR0LnVwZGF0ZUV2ZW50ID0gdXBkYXRlRXZlbnQ7XG5cdHQucmVuZGVyRXZlbnQgPSByZW5kZXJFdmVudDtcblx0dC5yZW1vdmVFdmVudHMgPSByZW1vdmVFdmVudHM7XG5cdHQuY2xpZW50RXZlbnRzID0gY2xpZW50RXZlbnRzO1xuXHR0Lm11dGF0ZUV2ZW50ID0gbXV0YXRlRXZlbnQ7XG5cdHQubm9ybWFsaXplRXZlbnREYXRlUHJvcHMgPSBub3JtYWxpemVFdmVudERhdGVQcm9wcztcblx0dC5lbnN1cmVWaXNpYmxlRXZlbnRSYW5nZSA9IGVuc3VyZVZpc2libGVFdmVudFJhbmdlO1xuXHRcblx0XG5cdC8vIGltcG9ydHNcblx0dmFyIHRyaWdnZXIgPSB0LnRyaWdnZXI7XG5cdHZhciBnZXRWaWV3ID0gdC5nZXRWaWV3O1xuXHR2YXIgcmVwb3J0RXZlbnRzID0gdC5yZXBvcnRFdmVudHM7XG5cdFxuXHRcblx0Ly8gbG9jYWxzXG5cdHZhciBzdGlja3lTb3VyY2UgPSB7IGV2ZW50czogW10gfTtcblx0dmFyIHNvdXJjZXMgPSBbIHN0aWNreVNvdXJjZSBdO1xuXHR2YXIgcmFuZ2VTdGFydCwgcmFuZ2VFbmQ7XG5cdHZhciBjdXJyZW50RmV0Y2hJRCA9IDA7XG5cdHZhciBwZW5kaW5nU291cmNlQ250ID0gMDtcblx0dmFyIGxvYWRpbmdMZXZlbCA9IDA7XG5cdHZhciBjYWNoZSA9IFtdOyAvLyBob2xkcyBldmVudHMgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiBleHBhbmRlZFxuXG5cblx0JC5lYWNoKFxuXHRcdChvcHRpb25zLmV2ZW50cyA/IFsgb3B0aW9ucy5ldmVudHMgXSA6IFtdKS5jb25jYXQob3B0aW9ucy5ldmVudFNvdXJjZXMgfHwgW10pLFxuXHRcdGZ1bmN0aW9uKGksIHNvdXJjZUlucHV0KSB7XG5cdFx0XHR2YXIgc291cmNlID0gYnVpbGRFdmVudFNvdXJjZShzb3VyY2VJbnB1dCk7XG5cdFx0XHRpZiAoc291cmNlKSB7XG5cdFx0XHRcdHNvdXJjZXMucHVzaChzb3VyY2UpO1xuXHRcdFx0fVxuXHRcdH1cblx0KTtcblx0XG5cdFxuXHRcblx0LyogRmV0Y2hpbmdcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXHRcblx0XG5cdGZ1bmN0aW9uIGlzRmV0Y2hOZWVkZWQoc3RhcnQsIGVuZCkge1xuXHRcdHJldHVybiAhcmFuZ2VTdGFydCB8fCAvLyBub3RoaW5nIGhhcyBiZWVuIGZldGNoZWQgeWV0P1xuXHRcdFx0Ly8gb3IsIGEgcGFydCBvZiB0aGUgbmV3IHJhbmdlIGlzIG91dHNpZGUgb2YgdGhlIG9sZCByYW5nZT8gKGFmdGVyIG5vcm1hbGl6aW5nKVxuXHRcdFx0c3RhcnQuY2xvbmUoKS5zdHJpcFpvbmUoKSA8IHJhbmdlU3RhcnQuY2xvbmUoKS5zdHJpcFpvbmUoKSB8fFxuXHRcdFx0ZW5kLmNsb25lKCkuc3RyaXBab25lKCkgPiByYW5nZUVuZC5jbG9uZSgpLnN0cmlwWm9uZSgpO1xuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gZmV0Y2hFdmVudHMoc3RhcnQsIGVuZCkge1xuXHRcdHJhbmdlU3RhcnQgPSBzdGFydDtcblx0XHRyYW5nZUVuZCA9IGVuZDtcblx0XHRjYWNoZSA9IFtdO1xuXHRcdHZhciBmZXRjaElEID0gKytjdXJyZW50RmV0Y2hJRDtcblx0XHR2YXIgbGVuID0gc291cmNlcy5sZW5ndGg7XG5cdFx0cGVuZGluZ1NvdXJjZUNudCA9IGxlbjtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGVuOyBpKyspIHtcblx0XHRcdGZldGNoRXZlbnRTb3VyY2Uoc291cmNlc1tpXSwgZmV0Y2hJRCk7XG5cdFx0fVxuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gZmV0Y2hFdmVudFNvdXJjZShzb3VyY2UsIGZldGNoSUQpIHtcblx0XHRfZmV0Y2hFdmVudFNvdXJjZShzb3VyY2UsIGZ1bmN0aW9uKGV2ZW50SW5wdXRzKSB7XG5cdFx0XHR2YXIgaXNBcnJheVNvdXJjZSA9ICQuaXNBcnJheShzb3VyY2UuZXZlbnRzKTtcblx0XHRcdHZhciBpLCBldmVudElucHV0O1xuXHRcdFx0dmFyIGFic3RyYWN0RXZlbnQ7XG5cblx0XHRcdGlmIChmZXRjaElEID09IGN1cnJlbnRGZXRjaElEKSB7XG5cblx0XHRcdFx0aWYgKGV2ZW50SW5wdXRzKSB7XG5cdFx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGV2ZW50SW5wdXRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRldmVudElucHV0ID0gZXZlbnRJbnB1dHNbaV07XG5cblx0XHRcdFx0XHRcdGlmIChpc0FycmF5U291cmNlKSB7IC8vIGFycmF5IHNvdXJjZXMgaGF2ZSBhbHJlYWR5IGJlZW4gY29udmVydCB0byBFdmVudCBPYmplY3RzXG5cdFx0XHRcdFx0XHRcdGFic3RyYWN0RXZlbnQgPSBldmVudElucHV0O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGFic3RyYWN0RXZlbnQgPSBidWlsZEV2ZW50RnJvbUlucHV0KGV2ZW50SW5wdXQsIHNvdXJjZSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChhYnN0cmFjdEV2ZW50KSB7IC8vIG5vdCBmYWxzZSAoYW4gaW52YWxpZCBldmVudClcblx0XHRcdFx0XHRcdFx0Y2FjaGUucHVzaC5hcHBseShcblx0XHRcdFx0XHRcdFx0XHRjYWNoZSxcblx0XHRcdFx0XHRcdFx0XHRleHBhbmRFdmVudChhYnN0cmFjdEV2ZW50KSAvLyBhZGQgaW5kaXZpZHVhbCBleHBhbmRlZCBldmVudHMgdG8gdGhlIGNhY2hlXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cGVuZGluZ1NvdXJjZUNudC0tO1xuXHRcdFx0XHRpZiAoIXBlbmRpbmdTb3VyY2VDbnQpIHtcblx0XHRcdFx0XHRyZXBvcnRFdmVudHMoY2FjaGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblx0XG5cdFxuXHRmdW5jdGlvbiBfZmV0Y2hFdmVudFNvdXJjZShzb3VyY2UsIGNhbGxiYWNrKSB7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIGZldGNoZXJzID0gZmMuc291cmNlRmV0Y2hlcnM7XG5cdFx0dmFyIHJlcztcblxuXHRcdGZvciAoaT0wOyBpPGZldGNoZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRyZXMgPSBmZXRjaGVyc1tpXS5jYWxsKFxuXHRcdFx0XHR0LCAvLyB0aGlzLCB0aGUgQ2FsZW5kYXIgb2JqZWN0XG5cdFx0XHRcdHNvdXJjZSxcblx0XHRcdFx0cmFuZ2VTdGFydC5jbG9uZSgpLFxuXHRcdFx0XHRyYW5nZUVuZC5jbG9uZSgpLFxuXHRcdFx0XHRvcHRpb25zLnRpbWV6b25lLFxuXHRcdFx0XHRjYWxsYmFja1xuXHRcdFx0KTtcblxuXHRcdFx0aWYgKHJlcyA9PT0gdHJ1ZSkge1xuXHRcdFx0XHQvLyB0aGUgZmV0Y2hlciBpcyBpbiBjaGFyZ2UuIG1hZGUgaXRzIG93biBhc3luYyByZXF1ZXN0XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKHR5cGVvZiByZXMgPT0gJ29iamVjdCcpIHtcblx0XHRcdFx0Ly8gdGhlIGZldGNoZXIgcmV0dXJuZWQgYSBuZXcgc291cmNlLiBwcm9jZXNzIGl0XG5cdFx0XHRcdF9mZXRjaEV2ZW50U291cmNlKHJlcywgY2FsbGJhY2spO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dmFyIGV2ZW50cyA9IHNvdXJjZS5ldmVudHM7XG5cdFx0aWYgKGV2ZW50cykge1xuXHRcdFx0aWYgKCQuaXNGdW5jdGlvbihldmVudHMpKSB7XG5cdFx0XHRcdHB1c2hMb2FkaW5nKCk7XG5cdFx0XHRcdGV2ZW50cy5jYWxsKFxuXHRcdFx0XHRcdHQsIC8vIHRoaXMsIHRoZSBDYWxlbmRhciBvYmplY3Rcblx0XHRcdFx0XHRyYW5nZVN0YXJ0LmNsb25lKCksXG5cdFx0XHRcdFx0cmFuZ2VFbmQuY2xvbmUoKSxcblx0XHRcdFx0XHRvcHRpb25zLnRpbWV6b25lLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKGV2ZW50cykge1xuXHRcdFx0XHRcdFx0Y2FsbGJhY2soZXZlbnRzKTtcblx0XHRcdFx0XHRcdHBvcExvYWRpbmcoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICgkLmlzQXJyYXkoZXZlbnRzKSkge1xuXHRcdFx0XHRjYWxsYmFjayhldmVudHMpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHR9XG5cdFx0fWVsc2V7XG5cdFx0XHR2YXIgdXJsID0gc291cmNlLnVybDtcblx0XHRcdGlmICh1cmwpIHtcblx0XHRcdFx0dmFyIHN1Y2Nlc3MgPSBzb3VyY2Uuc3VjY2Vzcztcblx0XHRcdFx0dmFyIGVycm9yID0gc291cmNlLmVycm9yO1xuXHRcdFx0XHR2YXIgY29tcGxldGUgPSBzb3VyY2UuY29tcGxldGU7XG5cblx0XHRcdFx0Ly8gcmV0cmlldmUgYW55IG91dGJvdW5kIEdFVC9QT1NUICQuYWpheCBkYXRhIGZyb20gdGhlIG9wdGlvbnNcblx0XHRcdFx0dmFyIGN1c3RvbURhdGE7XG5cdFx0XHRcdGlmICgkLmlzRnVuY3Rpb24oc291cmNlLmRhdGEpKSB7XG5cdFx0XHRcdFx0Ly8gc3VwcGxpZWQgYXMgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBrZXkvdmFsdWUgb2JqZWN0XG5cdFx0XHRcdFx0Y3VzdG9tRGF0YSA9IHNvdXJjZS5kYXRhKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0Ly8gc3VwcGxpZWQgYXMgYSBzdHJhaWdodCBrZXkvdmFsdWUgb2JqZWN0XG5cdFx0XHRcdFx0Y3VzdG9tRGF0YSA9IHNvdXJjZS5kYXRhO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gdXNlIGEgY29weSBvZiB0aGUgY3VzdG9tIGRhdGEgc28gd2UgY2FuIG1vZGlmeSB0aGUgcGFyYW1ldGVyc1xuXHRcdFx0XHQvLyBhbmQgbm90IGFmZmVjdCB0aGUgcGFzc2VkLWluIG9iamVjdC5cblx0XHRcdFx0dmFyIGRhdGEgPSAkLmV4dGVuZCh7fSwgY3VzdG9tRGF0YSB8fCB7fSk7XG5cblx0XHRcdFx0dmFyIHN0YXJ0UGFyYW0gPSBmaXJzdERlZmluZWQoc291cmNlLnN0YXJ0UGFyYW0sIG9wdGlvbnMuc3RhcnRQYXJhbSk7XG5cdFx0XHRcdHZhciBlbmRQYXJhbSA9IGZpcnN0RGVmaW5lZChzb3VyY2UuZW5kUGFyYW0sIG9wdGlvbnMuZW5kUGFyYW0pO1xuXHRcdFx0XHR2YXIgdGltZXpvbmVQYXJhbSA9IGZpcnN0RGVmaW5lZChzb3VyY2UudGltZXpvbmVQYXJhbSwgb3B0aW9ucy50aW1lem9uZVBhcmFtKTtcblxuXHRcdFx0XHRpZiAoc3RhcnRQYXJhbSkge1xuXHRcdFx0XHRcdGRhdGFbc3RhcnRQYXJhbV0gPSByYW5nZVN0YXJ0LmZvcm1hdCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChlbmRQYXJhbSkge1xuXHRcdFx0XHRcdGRhdGFbZW5kUGFyYW1dID0gcmFuZ2VFbmQuZm9ybWF0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKG9wdGlvbnMudGltZXpvbmUgJiYgb3B0aW9ucy50aW1lem9uZSAhPSAnbG9jYWwnKSB7XG5cdFx0XHRcdFx0ZGF0YVt0aW1lem9uZVBhcmFtXSA9IG9wdGlvbnMudGltZXpvbmU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRwdXNoTG9hZGluZygpO1xuXHRcdFx0XHQkLmFqYXgoJC5leHRlbmQoe30sIGFqYXhEZWZhdWx0cywgc291cmNlLCB7XG5cdFx0XHRcdFx0ZGF0YTogZGF0YSxcblx0XHRcdFx0XHRzdWNjZXNzOiBmdW5jdGlvbihldmVudHMpIHtcblx0XHRcdFx0XHRcdGV2ZW50cyA9IGV2ZW50cyB8fCBbXTtcblx0XHRcdFx0XHRcdHZhciByZXMgPSBhcHBseUFsbChzdWNjZXNzLCB0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0XHRcdFx0aWYgKCQuaXNBcnJheShyZXMpKSB7XG5cdFx0XHRcdFx0XHRcdGV2ZW50cyA9IHJlcztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNhbGxiYWNrKGV2ZW50cyk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRlcnJvcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRhcHBseUFsbChlcnJvciwgdGhpcywgYXJndW1lbnRzKTtcblx0XHRcdFx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRjb21wbGV0ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRhcHBseUFsbChjb21wbGV0ZSwgdGhpcywgYXJndW1lbnRzKTtcblx0XHRcdFx0XHRcdHBvcExvYWRpbmcoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pKTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRcblx0XG5cdFxuXHQvKiBTb3VyY2VzXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblx0XG5cblx0ZnVuY3Rpb24gYWRkRXZlbnRTb3VyY2Uoc291cmNlSW5wdXQpIHtcblx0XHR2YXIgc291cmNlID0gYnVpbGRFdmVudFNvdXJjZShzb3VyY2VJbnB1dCk7XG5cdFx0aWYgKHNvdXJjZSkge1xuXHRcdFx0c291cmNlcy5wdXNoKHNvdXJjZSk7XG5cdFx0XHRwZW5kaW5nU291cmNlQ250Kys7XG5cdFx0XHRmZXRjaEV2ZW50U291cmNlKHNvdXJjZSwgY3VycmVudEZldGNoSUQpOyAvLyB3aWxsIGV2ZW50dWFsbHkgY2FsbCByZXBvcnRFdmVudHNcblx0XHR9XG5cdH1cblxuXG5cdGZ1bmN0aW9uIGJ1aWxkRXZlbnRTb3VyY2Uoc291cmNlSW5wdXQpIHsgLy8gd2lsbCByZXR1cm4gdW5kZWZpbmVkIGlmIGludmFsaWQgc291cmNlXG5cdFx0dmFyIG5vcm1hbGl6ZXJzID0gZmMuc291cmNlTm9ybWFsaXplcnM7XG5cdFx0dmFyIHNvdXJjZTtcblx0XHR2YXIgaTtcblxuXHRcdGlmICgkLmlzRnVuY3Rpb24oc291cmNlSW5wdXQpIHx8ICQuaXNBcnJheShzb3VyY2VJbnB1dCkpIHtcblx0XHRcdHNvdXJjZSA9IHsgZXZlbnRzOiBzb3VyY2VJbnB1dCB9O1xuXHRcdH1cblx0XHRlbHNlIGlmICh0eXBlb2Ygc291cmNlSW5wdXQgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRzb3VyY2UgPSB7IHVybDogc291cmNlSW5wdXQgfTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodHlwZW9mIHNvdXJjZUlucHV0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0c291cmNlID0gJC5leHRlbmQoe30sIHNvdXJjZUlucHV0KTsgLy8gc2hhbGxvdyBjb3B5XG5cdFx0fVxuXG5cdFx0aWYgKHNvdXJjZSkge1xuXG5cdFx0XHQvLyBUT0RPOiByZXBlYXQgY29kZSwgc2FtZSBjb2RlIGZvciBldmVudCBjbGFzc05hbWVzXG5cdFx0XHRpZiAoc291cmNlLmNsYXNzTmFtZSkge1xuXHRcdFx0XHRpZiAodHlwZW9mIHNvdXJjZS5jbGFzc05hbWUgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0c291cmNlLmNsYXNzTmFtZSA9IHNvdXJjZS5jbGFzc05hbWUuc3BsaXQoL1xccysvKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBvdGhlcndpc2UsIGFzc3VtZWQgdG8gYmUgYW4gYXJyYXlcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRzb3VyY2UuY2xhc3NOYW1lID0gW107XG5cdFx0XHR9XG5cblx0XHRcdC8vIGZvciBhcnJheSBzb3VyY2VzLCB3ZSBjb252ZXJ0IHRvIHN0YW5kYXJkIEV2ZW50IE9iamVjdHMgdXAgZnJvbnRcblx0XHRcdGlmICgkLmlzQXJyYXkoc291cmNlLmV2ZW50cykpIHtcblx0XHRcdFx0c291cmNlLm9yaWdBcnJheSA9IHNvdXJjZS5ldmVudHM7IC8vIGZvciByZW1vdmVFdmVudFNvdXJjZVxuXHRcdFx0XHRzb3VyY2UuZXZlbnRzID0gJC5tYXAoc291cmNlLmV2ZW50cywgZnVuY3Rpb24oZXZlbnRJbnB1dCkge1xuXHRcdFx0XHRcdHJldHVybiBidWlsZEV2ZW50RnJvbUlucHV0KGV2ZW50SW5wdXQsIHNvdXJjZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKGk9MDsgaTxub3JtYWxpemVycy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRub3JtYWxpemVyc1tpXS5jYWxsKHQsIHNvdXJjZSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBzb3VyY2U7XG5cdFx0fVxuXHR9XG5cblxuXHRmdW5jdGlvbiByZW1vdmVFdmVudFNvdXJjZShzb3VyY2UpIHtcblx0XHRzb3VyY2VzID0gJC5ncmVwKHNvdXJjZXMsIGZ1bmN0aW9uKHNyYykge1xuXHRcdFx0cmV0dXJuICFpc1NvdXJjZXNFcXVhbChzcmMsIHNvdXJjZSk7XG5cdFx0fSk7XG5cdFx0Ly8gcmVtb3ZlIGFsbCBjbGllbnQgZXZlbnRzIGZyb20gdGhhdCBzb3VyY2Vcblx0XHRjYWNoZSA9ICQuZ3JlcChjYWNoZSwgZnVuY3Rpb24oZSkge1xuXHRcdFx0cmV0dXJuICFpc1NvdXJjZXNFcXVhbChlLnNvdXJjZSwgc291cmNlKTtcblx0XHR9KTtcblx0XHRyZXBvcnRFdmVudHMoY2FjaGUpO1xuXHR9XG5cblxuXHRmdW5jdGlvbiBpc1NvdXJjZXNFcXVhbChzb3VyY2UxLCBzb3VyY2UyKSB7XG5cdFx0cmV0dXJuIHNvdXJjZTEgJiYgc291cmNlMiAmJiBnZXRTb3VyY2VQcmltaXRpdmUoc291cmNlMSkgPT0gZ2V0U291cmNlUHJpbWl0aXZlKHNvdXJjZTIpO1xuXHR9XG5cblxuXHRmdW5jdGlvbiBnZXRTb3VyY2VQcmltaXRpdmUoc291cmNlKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdCh0eXBlb2Ygc291cmNlID09PSAnb2JqZWN0JykgPyAvLyBhIG5vcm1hbGl6ZWQgZXZlbnQgc291cmNlP1xuXHRcdFx0XHQoc291cmNlLm9yaWdBcnJheSB8fCBzb3VyY2UuZ29vZ2xlQ2FsZW5kYXJJZCB8fCBzb3VyY2UudXJsIHx8IHNvdXJjZS5ldmVudHMpIDogLy8gZ2V0IHRoZSBwcmltaXRpdmVcblx0XHRcdFx0bnVsbFxuXHRcdCkgfHxcblx0XHRzb3VyY2U7IC8vIHRoZSBnaXZlbiBhcmd1bWVudCAqaXMqIHRoZSBwcmltaXRpdmVcblx0fVxuXHRcblx0XG5cdFxuXHQvKiBNYW5pcHVsYXRpb25cblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gT25seSBldmVyIGNhbGxlZCBmcm9tIHRoZSBleHRlcm5hbGx5LWZhY2luZyBBUElcblx0ZnVuY3Rpb24gdXBkYXRlRXZlbnQoZXZlbnQpIHtcblxuXHRcdC8vIG1hc3NhZ2Ugc3RhcnQvZW5kIHZhbHVlcywgZXZlbiBpZiBkYXRlIHN0cmluZyB2YWx1ZXNcblx0XHRldmVudC5zdGFydCA9IHQubW9tZW50KGV2ZW50LnN0YXJ0KTtcblx0XHRpZiAoZXZlbnQuZW5kKSB7XG5cdFx0XHRldmVudC5lbmQgPSB0Lm1vbWVudChldmVudC5lbmQpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGV2ZW50LmVuZCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0bXV0YXRlRXZlbnQoZXZlbnQsIGdldE1pc2NFdmVudFByb3BzKGV2ZW50KSk7IC8vIHdpbGwgaGFuZGxlIHN0YXJ0L2VuZC9hbGxEYXkgbm9ybWFsaXphdGlvblxuXHRcdHJlcG9ydEV2ZW50cyhjYWNoZSk7IC8vIHJlcG9ydHMgZXZlbnQgbW9kaWZpY2F0aW9ucyAoc28gd2UgY2FuIHJlZHJhdylcblx0fVxuXG5cblx0Ly8gUmV0dXJucyBhIGhhc2ggb2YgbWlzYyBldmVudCBwcm9wZXJ0aWVzIHRoYXQgc2hvdWxkIGJlIGNvcGllZCBvdmVyIHRvIHJlbGF0ZWQgZXZlbnRzLlxuXHRmdW5jdGlvbiBnZXRNaXNjRXZlbnRQcm9wcyhldmVudCkge1xuXHRcdHZhciBwcm9wcyA9IHt9O1xuXG5cdFx0JC5lYWNoKGV2ZW50LCBmdW5jdGlvbihuYW1lLCB2YWwpIHtcblx0XHRcdGlmIChpc01pc2NFdmVudFByb3BOYW1lKG5hbWUpKSB7XG5cdFx0XHRcdGlmICh2YWwgIT09IHVuZGVmaW5lZCAmJiBpc0F0b21pYyh2YWwpKSB7IC8vIGEgZGVmaW5lZCBub24tb2JqZWN0XG5cdFx0XHRcdFx0cHJvcHNbbmFtZV0gPSB2YWw7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBwcm9wcztcblx0fVxuXG5cdC8vIG5vbi1kYXRlLXJlbGF0ZWQsIG5vbi1pZC1yZWxhdGVkLCBub24tc2VjcmV0XG5cdGZ1bmN0aW9uIGlzTWlzY0V2ZW50UHJvcE5hbWUobmFtZSkge1xuXHRcdHJldHVybiAhL15ffF4oaWR8YWxsRGF5fHN0YXJ0fGVuZCkkLy50ZXN0KG5hbWUpO1xuXHR9XG5cblx0XG5cdC8vIHJldHVybnMgdGhlIGV4cGFuZGVkIGV2ZW50cyB0aGF0IHdlcmUgY3JlYXRlZFxuXHRmdW5jdGlvbiByZW5kZXJFdmVudChldmVudElucHV0LCBzdGljaykge1xuXHRcdHZhciBhYnN0cmFjdEV2ZW50ID0gYnVpbGRFdmVudEZyb21JbnB1dChldmVudElucHV0KTtcblx0XHR2YXIgZXZlbnRzO1xuXHRcdHZhciBpLCBldmVudDtcblxuXHRcdGlmIChhYnN0cmFjdEV2ZW50KSB7IC8vIG5vdCBmYWxzZSAoYSB2YWxpZCBpbnB1dClcblx0XHRcdGV2ZW50cyA9IGV4cGFuZEV2ZW50KGFic3RyYWN0RXZlbnQpO1xuXG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGV2ZW50ID0gZXZlbnRzW2ldO1xuXG5cdFx0XHRcdGlmICghZXZlbnQuc291cmNlKSB7XG5cdFx0XHRcdFx0aWYgKHN0aWNrKSB7XG5cdFx0XHRcdFx0XHRzdGlja3lTb3VyY2UuZXZlbnRzLnB1c2goZXZlbnQpO1xuXHRcdFx0XHRcdFx0ZXZlbnQuc291cmNlID0gc3RpY2t5U291cmNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjYWNoZS5wdXNoKGV2ZW50KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXBvcnRFdmVudHMoY2FjaGUpO1xuXG5cdFx0XHRyZXR1cm4gZXZlbnRzO1xuXHRcdH1cblxuXHRcdHJldHVybiBbXTtcblx0fVxuXHRcblx0XG5cdGZ1bmN0aW9uIHJlbW92ZUV2ZW50cyhmaWx0ZXIpIHtcblx0XHR2YXIgZXZlbnRJRDtcblx0XHR2YXIgaTtcblxuXHRcdGlmIChmaWx0ZXIgPT0gbnVsbCkgeyAvLyBudWxsIG9yIHVuZGVmaW5lZC4gcmVtb3ZlIGFsbCBldmVudHNcblx0XHRcdGZpbHRlciA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJ1ZTsgfTsgLy8gd2lsbCBhbHdheXMgbWF0Y2hcblx0XHR9XG5cdFx0ZWxzZSBpZiAoISQuaXNGdW5jdGlvbihmaWx0ZXIpKSB7IC8vIGFuIGV2ZW50IElEXG5cdFx0XHRldmVudElEID0gZmlsdGVyICsgJyc7XG5cdFx0XHRmaWx0ZXIgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRyZXR1cm4gZXZlbnQuX2lkID09IGV2ZW50SUQ7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8vIFB1cmdlIGV2ZW50KHMpIGZyb20gb3VyIGxvY2FsIGNhY2hlXG5cdFx0Y2FjaGUgPSAkLmdyZXAoY2FjaGUsIGZpbHRlciwgdHJ1ZSk7IC8vIGludmVyc2U9dHJ1ZVxuXG5cdFx0Ly8gUmVtb3ZlIGV2ZW50cyBmcm9tIGFycmF5IHNvdXJjZXMuXG5cdFx0Ly8gVGhpcyB3b3JrcyBiZWNhdXNlIHRoZXkgaGF2ZSBiZWVuIGNvbnZlcnRlZCB0byBvZmZpY2lhbCBFdmVudCBPYmplY3RzIHVwIGZyb250LlxuXHRcdC8vIChhbmQgYXMgYSByZXN1bHQsIGV2ZW50Ll9pZCBoYXMgYmVlbiBjYWxjdWxhdGVkKS5cblx0XHRmb3IgKGk9MDsgaTxzb3VyY2VzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoJC5pc0FycmF5KHNvdXJjZXNbaV0uZXZlbnRzKSkge1xuXHRcdFx0XHRzb3VyY2VzW2ldLmV2ZW50cyA9ICQuZ3JlcChzb3VyY2VzW2ldLmV2ZW50cywgZmlsdGVyLCB0cnVlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXBvcnRFdmVudHMoY2FjaGUpO1xuXHR9XG5cdFxuXHRcblx0ZnVuY3Rpb24gY2xpZW50RXZlbnRzKGZpbHRlcikge1xuXHRcdGlmICgkLmlzRnVuY3Rpb24oZmlsdGVyKSkge1xuXHRcdFx0cmV0dXJuICQuZ3JlcChjYWNoZSwgZmlsdGVyKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoZmlsdGVyICE9IG51bGwpIHsgLy8gbm90IG51bGwsIG5vdCB1bmRlZmluZWQuIGFuIGV2ZW50IElEXG5cdFx0XHRmaWx0ZXIgKz0gJyc7XG5cdFx0XHRyZXR1cm4gJC5ncmVwKGNhY2hlLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdHJldHVybiBlLl9pZCA9PSBmaWx0ZXI7XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0cmV0dXJuIGNhY2hlOyAvLyBlbHNlLCByZXR1cm4gYWxsXG5cdH1cblx0XG5cdFxuXHRcblx0LyogTG9hZGluZyBTdGF0ZVxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cdFxuXHRcblx0ZnVuY3Rpb24gcHVzaExvYWRpbmcoKSB7XG5cdFx0aWYgKCEobG9hZGluZ0xldmVsKyspKSB7XG5cdFx0XHR0cmlnZ2VyKCdsb2FkaW5nJywgbnVsbCwgdHJ1ZSwgZ2V0VmlldygpKTtcblx0XHR9XG5cdH1cblx0XG5cdFxuXHRmdW5jdGlvbiBwb3BMb2FkaW5nKCkge1xuXHRcdGlmICghKC0tbG9hZGluZ0xldmVsKSkge1xuXHRcdFx0dHJpZ2dlcignbG9hZGluZycsIG51bGwsIGZhbHNlLCBnZXRWaWV3KCkpO1xuXHRcdH1cblx0fVxuXHRcblx0XG5cdFxuXHQvKiBFdmVudCBOb3JtYWxpemF0aW9uXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIEdpdmVuIGEgcmF3IG9iamVjdCB3aXRoIGtleS92YWx1ZSBwcm9wZXJ0aWVzLCByZXR1cm5zIGFuIFwiYWJzdHJhY3RcIiBFdmVudCBvYmplY3QuXG5cdC8vIEFuIFwiYWJzdHJhY3RcIiBldmVudCBpcyBhbiBldmVudCB0aGF0LCBpZiByZWN1cnJpbmcsIHdpbGwgbm90IGhhdmUgYmVlbiBleHBhbmRlZCB5ZXQuXG5cdC8vIFdpbGwgcmV0dXJuIGBmYWxzZWAgd2hlbiBpbnB1dCBpcyBpbnZhbGlkLlxuXHQvLyBgc291cmNlYCBpcyBvcHRpb25hbFxuXHRmdW5jdGlvbiBidWlsZEV2ZW50RnJvbUlucHV0KGlucHV0LCBzb3VyY2UpIHtcblx0XHR2YXIgb3V0ID0ge307XG5cdFx0dmFyIHN0YXJ0LCBlbmQ7XG5cdFx0dmFyIGFsbERheTtcblxuXHRcdGlmIChvcHRpb25zLmV2ZW50RGF0YVRyYW5zZm9ybSkge1xuXHRcdFx0aW5wdXQgPSBvcHRpb25zLmV2ZW50RGF0YVRyYW5zZm9ybShpbnB1dCk7XG5cdFx0fVxuXHRcdGlmIChzb3VyY2UgJiYgc291cmNlLmV2ZW50RGF0YVRyYW5zZm9ybSkge1xuXHRcdFx0aW5wdXQgPSBzb3VyY2UuZXZlbnREYXRhVHJhbnNmb3JtKGlucHV0KTtcblx0XHR9XG5cblx0XHQvLyBDb3B5IGFsbCBwcm9wZXJ0aWVzIG92ZXIgdG8gdGhlIHJlc3VsdGluZyBvYmplY3QuXG5cdFx0Ly8gVGhlIHNwZWNpYWwtY2FzZSBwcm9wZXJ0aWVzIHdpbGwgYmUgY29waWVkIG92ZXIgYWZ0ZXJ3YXJkcy5cblx0XHQkLmV4dGVuZChvdXQsIGlucHV0KTtcblxuXHRcdGlmIChzb3VyY2UpIHtcblx0XHRcdG91dC5zb3VyY2UgPSBzb3VyY2U7XG5cdFx0fVxuXG5cdFx0b3V0Ll9pZCA9IGlucHV0Ll9pZCB8fCAoaW5wdXQuaWQgPT09IHVuZGVmaW5lZCA/ICdfZmMnICsgZXZlbnRHVUlEKysgOiBpbnB1dC5pZCArICcnKTtcblxuXHRcdGlmIChpbnB1dC5jbGFzc05hbWUpIHtcblx0XHRcdGlmICh0eXBlb2YgaW5wdXQuY2xhc3NOYW1lID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdG91dC5jbGFzc05hbWUgPSBpbnB1dC5jbGFzc05hbWUuc3BsaXQoL1xccysvKTtcblx0XHRcdH1cblx0XHRcdGVsc2UgeyAvLyBhc3N1bWVkIHRvIGJlIGFuIGFycmF5XG5cdFx0XHRcdG91dC5jbGFzc05hbWUgPSBpbnB1dC5jbGFzc05hbWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0b3V0LmNsYXNzTmFtZSA9IFtdO1xuXHRcdH1cblxuXHRcdHN0YXJ0ID0gaW5wdXQuc3RhcnQgfHwgaW5wdXQuZGF0ZTsgLy8gXCJkYXRlXCIgaXMgYW4gYWxpYXMgZm9yIFwic3RhcnRcIlxuXHRcdGVuZCA9IGlucHV0LmVuZDtcblxuXHRcdC8vIHBhcnNlIGFzIGEgdGltZSAoRHVyYXRpb24pIGlmIGFwcGxpY2FibGVcblx0XHRpZiAoaXNUaW1lU3RyaW5nKHN0YXJ0KSkge1xuXHRcdFx0c3RhcnQgPSBtb21lbnQuZHVyYXRpb24oc3RhcnQpO1xuXHRcdH1cblx0XHRpZiAoaXNUaW1lU3RyaW5nKGVuZCkpIHtcblx0XHRcdGVuZCA9IG1vbWVudC5kdXJhdGlvbihlbmQpO1xuXHRcdH1cblxuXHRcdGlmIChpbnB1dC5kb3cgfHwgbW9tZW50LmlzRHVyYXRpb24oc3RhcnQpIHx8IG1vbWVudC5pc0R1cmF0aW9uKGVuZCkpIHtcblxuXHRcdFx0Ly8gdGhlIGV2ZW50IGlzIFwiYWJzdHJhY3RcIiAocmVjdXJyaW5nKSBzbyBkb24ndCBjYWxjdWxhdGUgZXhhY3Qgc3RhcnQvZW5kIGRhdGVzIGp1c3QgeWV0XG5cdFx0XHRvdXQuc3RhcnQgPSBzdGFydCA/IG1vbWVudC5kdXJhdGlvbihzdGFydCkgOiBudWxsOyAvLyB3aWxsIGJlIGEgRHVyYXRpb24gb3IgbnVsbFxuXHRcdFx0b3V0LmVuZCA9IGVuZCA/IG1vbWVudC5kdXJhdGlvbihlbmQpIDogbnVsbDsgLy8gd2lsbCBiZSBhIER1cmF0aW9uIG9yIG51bGxcblx0XHRcdG91dC5fcmVjdXJyaW5nID0gdHJ1ZTsgLy8gb3VyIGludGVybmFsIG1hcmtlclxuXHRcdH1cblx0XHRlbHNlIHtcblxuXHRcdFx0aWYgKHN0YXJ0KSB7XG5cdFx0XHRcdHN0YXJ0ID0gdC5tb21lbnQoc3RhcnQpO1xuXHRcdFx0XHRpZiAoIXN0YXJ0LmlzVmFsaWQoKSkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZW5kKSB7XG5cdFx0XHRcdGVuZCA9IHQubW9tZW50KGVuZCk7XG5cdFx0XHRcdGlmICghZW5kLmlzVmFsaWQoKSkge1xuXHRcdFx0XHRcdGVuZCA9IG51bGw7IC8vIGxldCBkZWZhdWx0cyB0YWtlIG92ZXJcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRhbGxEYXkgPSBpbnB1dC5hbGxEYXk7XG5cdFx0XHRpZiAoYWxsRGF5ID09PSB1bmRlZmluZWQpIHsgLy8gc3RpbGwgdW5kZWZpbmVkPyBmYWxsYmFjayB0byBkZWZhdWx0XG5cdFx0XHRcdGFsbERheSA9IGZpcnN0RGVmaW5lZChcblx0XHRcdFx0XHRzb3VyY2UgPyBzb3VyY2UuYWxsRGF5RGVmYXVsdCA6IHVuZGVmaW5lZCxcblx0XHRcdFx0XHRvcHRpb25zLmFsbERheURlZmF1bHRcblx0XHRcdFx0KTtcblx0XHRcdFx0Ly8gc3RpbGwgdW5kZWZpbmVkPyBub3JtYWxpemVFdmVudERhdGVQcm9wcyB3aWxsIGNhbGN1bGF0ZSBpdFxuXHRcdFx0fVxuXG5cdFx0XHRhc3NpZ25EYXRlc1RvRXZlbnQoc3RhcnQsIGVuZCwgYWxsRGF5LCBvdXQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXQ7XG5cdH1cblxuXG5cdC8vIE5vcm1hbGl6ZXMgYW5kIGFzc2lnbnMgdGhlIGdpdmVuIGRhdGVzIHRvIHRoZSBnaXZlbiBwYXJ0aWFsbHktZm9ybWVkIGV2ZW50IG9iamVjdC5cblx0Ly8gTk9URTogbXV0YXRlcyB0aGUgZ2l2ZW4gc3RhcnQvZW5kIG1vbWVudHMuIGRvZXMgbm90IG1ha2UgYSBjb3B5LlxuXHRmdW5jdGlvbiBhc3NpZ25EYXRlc1RvRXZlbnQoc3RhcnQsIGVuZCwgYWxsRGF5LCBldmVudCkge1xuXHRcdGV2ZW50LnN0YXJ0ID0gc3RhcnQ7XG5cdFx0ZXZlbnQuZW5kID0gZW5kO1xuXHRcdGV2ZW50LmFsbERheSA9IGFsbERheTtcblx0XHRub3JtYWxpemVFdmVudERhdGVQcm9wcyhldmVudCk7XG5cdFx0YmFja3VwRXZlbnREYXRlcyhldmVudCk7XG5cdH1cblxuXG5cdC8vIEVuc3VyZXMgdGhlIGFsbERheSBwcm9wZXJ0eSBleGlzdHMuXG5cdC8vIEVuc3VyZXMgdGhlIHN0YXJ0L2VuZCBkYXRlcyBhcmUgY29uc2lzdGVudCB3aXRoIGFsbERheSBhbmQgZm9yY2VFdmVudER1cmF0aW9uLlxuXHQvLyBBY2NlcHRzIGFuIEV2ZW50IG9iamVjdCwgb3IgYSBwbGFpbiBvYmplY3Qgd2l0aCBldmVudC1pc2ggcHJvcGVydGllcy5cblx0Ly8gTk9URTogV2lsbCBtb2RpZnkgdGhlIGdpdmVuIG9iamVjdC5cblx0ZnVuY3Rpb24gbm9ybWFsaXplRXZlbnREYXRlUHJvcHMocHJvcHMpIHtcblxuXHRcdGlmIChwcm9wcy5hbGxEYXkgPT0gbnVsbCkge1xuXHRcdFx0cHJvcHMuYWxsRGF5ID0gIShwcm9wcy5zdGFydC5oYXNUaW1lKCkgfHwgKHByb3BzLmVuZCAmJiBwcm9wcy5lbmQuaGFzVGltZSgpKSk7XG5cdFx0fVxuXG5cdFx0aWYgKHByb3BzLmFsbERheSkge1xuXHRcdFx0cHJvcHMuc3RhcnQuc3RyaXBUaW1lKCk7XG5cdFx0XHRpZiAocHJvcHMuZW5kKSB7XG5cdFx0XHRcdHByb3BzLmVuZC5zdHJpcFRpbWUoKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAoIXByb3BzLnN0YXJ0Lmhhc1RpbWUoKSkge1xuXHRcdFx0XHRwcm9wcy5zdGFydCA9IHQucmV6b25lRGF0ZShwcm9wcy5zdGFydCk7IC8vIHdpbGwgYWxzbyBnaXZlIGl0IGEgMDA6MDAgdGltZVxuXHRcdFx0fVxuXHRcdFx0aWYgKHByb3BzLmVuZCAmJiAhcHJvcHMuZW5kLmhhc1RpbWUoKSkge1xuXHRcdFx0XHRwcm9wcy5lbmQgPSB0LnJlem9uZURhdGUocHJvcHMuZW5kKTsgLy8gd2lsbCBhbHNvIGdpdmUgaXQgYSAwMDowMCB0aW1lXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHByb3BzLmVuZCAmJiAhcHJvcHMuZW5kLmlzQWZ0ZXIocHJvcHMuc3RhcnQpKSB7XG5cdFx0XHRwcm9wcy5lbmQgPSBudWxsO1xuXHRcdH1cblxuXHRcdGlmICghcHJvcHMuZW5kKSB7XG5cdFx0XHRpZiAob3B0aW9ucy5mb3JjZUV2ZW50RHVyYXRpb24pIHtcblx0XHRcdFx0cHJvcHMuZW5kID0gdC5nZXREZWZhdWx0RXZlbnRFbmQocHJvcHMuYWxsRGF5LCBwcm9wcy5zdGFydCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0cHJvcHMuZW5kID0gbnVsbDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXG5cdC8vIElmIGByYW5nZWAgaXMgYSBwcm9wZXIgcmFuZ2Ugd2l0aCBhIHN0YXJ0IGFuZCBlbmQsIHJldHVybnMgdGhlIG9yaWdpbmFsIG9iamVjdC5cblx0Ly8gSWYgbWlzc2luZyBhbiBlbmQsIGNvbXB1dGVzIGEgbmV3IHJhbmdlIHdpdGggYW4gZW5kLCBjb21wdXRpbmcgaXQgYXMgaWYgaXQgd2VyZSBhbiBldmVudC5cblx0Ly8gVE9ETzogbWFrZSB0aGlzIGEgcGFydCBvZiB0aGUgZXZlbnQgLT4gZXZlbnRSYW5nZSBzeXN0ZW1cblx0ZnVuY3Rpb24gZW5zdXJlVmlzaWJsZUV2ZW50UmFuZ2UocmFuZ2UpIHtcblx0XHR2YXIgYWxsRGF5O1xuXG5cdFx0aWYgKCFyYW5nZS5lbmQpIHtcblxuXHRcdFx0YWxsRGF5ID0gcmFuZ2UuYWxsRGF5OyAvLyByYW5nZSBtaWdodCBiZSBtb3JlIGV2ZW50LWlzaCB0aGFuIHdlIHRoaW5rXG5cdFx0XHRpZiAoYWxsRGF5ID09IG51bGwpIHtcblx0XHRcdFx0YWxsRGF5ID0gIXJhbmdlLnN0YXJ0Lmhhc1RpbWUoKTtcblx0XHRcdH1cblxuXHRcdFx0cmFuZ2UgPSB7XG5cdFx0XHRcdHN0YXJ0OiByYW5nZS5zdGFydCxcblx0XHRcdFx0ZW5kOiB0LmdldERlZmF1bHRFdmVudEVuZChhbGxEYXksIHJhbmdlLnN0YXJ0KVxuXHRcdFx0fTtcblx0XHR9XG5cdFx0cmV0dXJuIHJhbmdlO1xuXHR9XG5cblxuXHQvLyBJZiB0aGUgZ2l2ZW4gZXZlbnQgaXMgYSByZWN1cnJpbmcgZXZlbnQsIGJyZWFrIGl0IGRvd24gaW50byBhbiBhcnJheSBvZiBpbmRpdmlkdWFsIGluc3RhbmNlcy5cblx0Ly8gSWYgbm90IGEgcmVjdXJyaW5nIGV2ZW50LCByZXR1cm4gYW4gYXJyYXkgd2l0aCB0aGUgc2luZ2xlIG9yaWdpbmFsIGV2ZW50LlxuXHQvLyBJZiBnaXZlbiBhIGZhbHN5IGlucHV0IChwcm9iYWJseSBiZWNhdXNlIG9mIGEgZmFpbGVkIGJ1aWxkRXZlbnRGcm9tSW5wdXQgY2FsbCksIHJldHVybnMgYW4gZW1wdHkgYXJyYXkuXG5cdC8vIEhBQ0s6IGNhbiBvdmVycmlkZSB0aGUgcmVjdXJyaW5nIHdpbmRvdyBieSBwcm92aWRpbmcgY3VzdG9tIHJhbmdlU3RhcnQvcmFuZ2VFbmQgKGZvciBidXNpbmVzc0hvdXJzKS5cblx0ZnVuY3Rpb24gZXhwYW5kRXZlbnQoYWJzdHJhY3RFdmVudCwgX3JhbmdlU3RhcnQsIF9yYW5nZUVuZCkge1xuXHRcdHZhciBldmVudHMgPSBbXTtcblx0XHR2YXIgZG93SGFzaDtcblx0XHR2YXIgZG93O1xuXHRcdHZhciBpO1xuXHRcdHZhciBkYXRlO1xuXHRcdHZhciBzdGFydFRpbWUsIGVuZFRpbWU7XG5cdFx0dmFyIHN0YXJ0LCBlbmQ7XG5cdFx0dmFyIGV2ZW50O1xuXG5cdFx0X3JhbmdlU3RhcnQgPSBfcmFuZ2VTdGFydCB8fCByYW5nZVN0YXJ0O1xuXHRcdF9yYW5nZUVuZCA9IF9yYW5nZUVuZCB8fCByYW5nZUVuZDtcblxuXHRcdGlmIChhYnN0cmFjdEV2ZW50KSB7XG5cdFx0XHRpZiAoYWJzdHJhY3RFdmVudC5fcmVjdXJyaW5nKSB7XG5cblx0XHRcdFx0Ly8gbWFrZSBhIGJvb2xlYW4gaGFzaCBhcyB0byB3aGV0aGVyIHRoZSBldmVudCBvY2N1cnMgb24gZWFjaCBkYXktb2Ytd2Vla1xuXHRcdFx0XHRpZiAoKGRvdyA9IGFic3RyYWN0RXZlbnQuZG93KSkge1xuXHRcdFx0XHRcdGRvd0hhc2ggPSB7fTtcblx0XHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgZG93Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRkb3dIYXNoW2Rvd1tpXV0gPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIGl0ZXJhdGUgdGhyb3VnaCBldmVyeSBkYXkgaW4gdGhlIGN1cnJlbnQgcmFuZ2Vcblx0XHRcdFx0ZGF0ZSA9IF9yYW5nZVN0YXJ0LmNsb25lKCkuc3RyaXBUaW1lKCk7IC8vIGhvbGRzIHRoZSBkYXRlIG9mIHRoZSBjdXJyZW50IGRheVxuXHRcdFx0XHR3aGlsZSAoZGF0ZS5pc0JlZm9yZShfcmFuZ2VFbmQpKSB7XG5cblx0XHRcdFx0XHRpZiAoIWRvd0hhc2ggfHwgZG93SGFzaFtkYXRlLmRheSgpXSkgeyAvLyBpZiBldmVyeWRheSwgb3IgdGhpcyBwYXJ0aWN1bGFyIGRheS1vZi13ZWVrXG5cblx0XHRcdFx0XHRcdHN0YXJ0VGltZSA9IGFic3RyYWN0RXZlbnQuc3RhcnQ7IC8vIHRoZSBzdG9yZWQgc3RhcnQgYW5kIGVuZCBwcm9wZXJ0aWVzIGFyZSB0aW1lcyAoRHVyYXRpb25zKVxuXHRcdFx0XHRcdFx0ZW5kVGltZSA9IGFic3RyYWN0RXZlbnQuZW5kOyAvLyBcIlxuXHRcdFx0XHRcdFx0c3RhcnQgPSBkYXRlLmNsb25lKCk7XG5cdFx0XHRcdFx0XHRlbmQgPSBudWxsO1xuXG5cdFx0XHRcdFx0XHRpZiAoc3RhcnRUaW1lKSB7XG5cdFx0XHRcdFx0XHRcdHN0YXJ0ID0gc3RhcnQudGltZShzdGFydFRpbWUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYgKGVuZFRpbWUpIHtcblx0XHRcdFx0XHRcdFx0ZW5kID0gZGF0ZS5jbG9uZSgpLnRpbWUoZW5kVGltZSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGV2ZW50ID0gJC5leHRlbmQoe30sIGFic3RyYWN0RXZlbnQpOyAvLyBtYWtlIGEgY29weSBvZiB0aGUgb3JpZ2luYWxcblx0XHRcdFx0XHRcdGFzc2lnbkRhdGVzVG9FdmVudChcblx0XHRcdFx0XHRcdFx0c3RhcnQsIGVuZCxcblx0XHRcdFx0XHRcdFx0IXN0YXJ0VGltZSAmJiAhZW5kVGltZSwgLy8gYWxsRGF5P1xuXHRcdFx0XHRcdFx0XHRldmVudFxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdGV2ZW50cy5wdXNoKGV2ZW50KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRkYXRlLmFkZCgxLCAnZGF5cycpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0ZXZlbnRzLnB1c2goYWJzdHJhY3RFdmVudCk7IC8vIHJldHVybiB0aGUgb3JpZ2luYWwgZXZlbnQuIHdpbGwgYmUgYSBvbmUtaXRlbSBhcnJheVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBldmVudHM7XG5cdH1cblxuXG5cblx0LyogRXZlbnQgTW9kaWZpY2F0aW9uIE1hdGhcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gTW9kaWZpZXMgYW4gZXZlbnQgYW5kIGFsbCByZWxhdGVkIGV2ZW50cyBieSBhcHBseWluZyB0aGUgZ2l2ZW4gcHJvcGVydGllcy5cblx0Ly8gU3BlY2lhbCBkYXRlLWRpZmZpbmcgbG9naWMgaXMgdXNlZCBmb3IgbWFuaXB1bGF0aW9uIG9mIGRhdGVzLlxuXHQvLyBJZiBgcHJvcHNgIGRvZXMgbm90IGNvbnRhaW4gc3RhcnQvZW5kIGRhdGVzLCB0aGUgdXBkYXRlZCB2YWx1ZXMgYXJlIGFzc3VtZWQgdG8gYmUgdGhlIGV2ZW50J3MgY3VycmVudCBzdGFydC9lbmQuXG5cdC8vIEFsbCBkYXRlIGNvbXBhcmlzb25zIGFyZSBkb25lIGFnYWluc3QgdGhlIGV2ZW50J3MgcHJpc3RpbmUgX3N0YXJ0IGFuZCBfZW5kIGRhdGVzLlxuXHQvLyBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGRlbHRhIGluZm9ybWF0aW9uIGFuZCBhIGZ1bmN0aW9uIHRvIHVuZG8gYWxsIG9wZXJhdGlvbnMuXG5cdC8vXG5cdGZ1bmN0aW9uIG11dGF0ZUV2ZW50KGV2ZW50LCBwcm9wcykge1xuXHRcdHZhciBtaXNjUHJvcHMgPSB7fTtcblx0XHR2YXIgY2xlYXJFbmQ7XG5cdFx0dmFyIGRhdGVEZWx0YTtcblx0XHR2YXIgZHVyYXRpb25EZWx0YTtcblx0XHR2YXIgdW5kb0Z1bmM7XG5cblx0XHRwcm9wcyA9IHByb3BzIHx8IHt9O1xuXG5cdFx0Ly8gZW5zdXJlIG5ldyBkYXRlLXJlbGF0ZWQgdmFsdWVzIHRvIGNvbXBhcmUgYWdhaW5zdFxuXHRcdGlmICghcHJvcHMuc3RhcnQpIHtcblx0XHRcdHByb3BzLnN0YXJ0ID0gZXZlbnQuc3RhcnQuY2xvbmUoKTtcblx0XHR9XG5cdFx0aWYgKHByb3BzLmVuZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRwcm9wcy5lbmQgPSBldmVudC5lbmQgPyBldmVudC5lbmQuY2xvbmUoKSA6IG51bGw7XG5cdFx0fVxuXHRcdGlmIChwcm9wcy5hbGxEYXkgPT0gbnVsbCkgeyAvLyBpcyBudWxsIG9yIHVuZGVmaW5lZD9cblx0XHRcdHByb3BzLmFsbERheSA9IGV2ZW50LmFsbERheTtcblx0XHR9XG5cblx0XHRub3JtYWxpemVFdmVudERhdGVQcm9wcyhwcm9wcyk7IC8vIG1hc3NhZ2VzIHN0YXJ0L2VuZC9hbGxEYXlcblxuXHRcdC8vIGNsZWFyIHRoZSBlbmQgZGF0ZSBpZiBleHBsaWNpdGx5IGNoYW5nZWQgdG8gbnVsbFxuXHRcdGNsZWFyRW5kID0gZXZlbnQuX2VuZCAhPT0gbnVsbCAmJiBwcm9wcy5lbmQgPT09IG51bGw7XG5cblx0XHQvLyBjb21wdXRlIHRoZSBkZWx0YSBmb3IgbW92aW5nIHRoZSBzdGFydCBhbmQgZW5kIGRhdGVzIHRvZ2V0aGVyXG5cdFx0aWYgKHByb3BzLmFsbERheSkge1xuXHRcdFx0ZGF0ZURlbHRhID0gZGlmZkRheShwcm9wcy5zdGFydCwgZXZlbnQuX3N0YXJ0KTsgLy8gd2hvbGUtZGF5IGRpZmYgZnJvbSBzdGFydC1vZi1kYXlcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRkYXRlRGVsdGEgPSBkaWZmRGF5VGltZShwcm9wcy5zdGFydCwgZXZlbnQuX3N0YXJ0KTtcblx0XHR9XG5cblx0XHQvLyBjb21wdXRlIHRoZSBkZWx0YSBmb3IgbW92aW5nIHRoZSBlbmQgZGF0ZSAoYWZ0ZXIgYXBwbHlpbmcgZGF0ZURlbHRhKVxuXHRcdGlmICghY2xlYXJFbmQgJiYgcHJvcHMuZW5kKSB7XG5cdFx0XHRkdXJhdGlvbkRlbHRhID0gZGlmZkRheVRpbWUoXG5cdFx0XHRcdC8vIG5ldyBkdXJhdGlvblxuXHRcdFx0XHRwcm9wcy5lbmQsXG5cdFx0XHRcdHByb3BzLnN0YXJ0XG5cdFx0XHQpLnN1YnRyYWN0KGRpZmZEYXlUaW1lKFxuXHRcdFx0XHQvLyBzdWJ0cmFjdCBvbGQgZHVyYXRpb25cblx0XHRcdFx0ZXZlbnQuX2VuZCB8fCB0LmdldERlZmF1bHRFdmVudEVuZChldmVudC5fYWxsRGF5LCBldmVudC5fc3RhcnQpLFxuXHRcdFx0XHRldmVudC5fc3RhcnRcblx0XHRcdCkpO1xuXHRcdH1cblxuXHRcdC8vIGdhdGhlciBhbGwgbm9uLWRhdGUtcmVsYXRlZCBwcm9wZXJ0aWVzXG5cdFx0JC5lYWNoKHByb3BzLCBmdW5jdGlvbihuYW1lLCB2YWwpIHtcblx0XHRcdGlmIChpc01pc2NFdmVudFByb3BOYW1lKG5hbWUpKSB7XG5cdFx0XHRcdGlmICh2YWwgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdG1pc2NQcm9wc1tuYW1lXSA9IHZhbDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gYXBwbHkgdGhlIG9wZXJhdGlvbnMgdG8gdGhlIGV2ZW50IGFuZCBhbGwgcmVsYXRlZCBldmVudHNcblx0XHR1bmRvRnVuYyA9IG11dGF0ZUV2ZW50cyhcblx0XHRcdGNsaWVudEV2ZW50cyhldmVudC5faWQpLCAvLyBnZXQgZXZlbnRzIHdpdGggdGhpcyBJRFxuXHRcdFx0Y2xlYXJFbmQsXG5cdFx0XHRwcm9wcy5hbGxEYXksXG5cdFx0XHRkYXRlRGVsdGEsXG5cdFx0XHRkdXJhdGlvbkRlbHRhLFxuXHRcdFx0bWlzY1Byb3BzXG5cdFx0KTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRkYXRlRGVsdGE6IGRhdGVEZWx0YSxcblx0XHRcdGR1cmF0aW9uRGVsdGE6IGR1cmF0aW9uRGVsdGEsXG5cdFx0XHR1bmRvOiB1bmRvRnVuY1xuXHRcdH07XG5cdH1cblxuXG5cdC8vIE1vZGlmaWVzIGFuIGFycmF5IG9mIGV2ZW50cyBpbiB0aGUgZm9sbG93aW5nIHdheXMgKG9wZXJhdGlvbnMgYXJlIGluIG9yZGVyKTpcblx0Ly8gLSBjbGVhciB0aGUgZXZlbnQncyBgZW5kYFxuXHQvLyAtIGNvbnZlcnQgdGhlIGV2ZW50IHRvIGFsbERheVxuXHQvLyAtIGFkZCBgZGF0ZURlbHRhYCB0byB0aGUgc3RhcnQgYW5kIGVuZFxuXHQvLyAtIGFkZCBgZHVyYXRpb25EZWx0YWAgdG8gdGhlIGV2ZW50J3MgZHVyYXRpb25cblx0Ly8gLSBhc3NpZ24gYG1pc2NQcm9wc2AgdG8gdGhlIGV2ZW50XG5cdC8vXG5cdC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGNhbiBiZSBjYWxsZWQgdG8gdW5kbyBhbGwgdGhlIG9wZXJhdGlvbnMuXG5cdC8vXG5cdC8vIFRPRE86IGRvbid0IHVzZSBzbyBtYW55IGNsb3N1cmVzLiBwb3NzaWJsZSBtZW1vcnkgaXNzdWVzIHdoZW4gbG90cyBvZiBldmVudHMgd2l0aCBzYW1lIElELlxuXHQvL1xuXHRmdW5jdGlvbiBtdXRhdGVFdmVudHMoZXZlbnRzLCBjbGVhckVuZCwgYWxsRGF5LCBkYXRlRGVsdGEsIGR1cmF0aW9uRGVsdGEsIG1pc2NQcm9wcykge1xuXHRcdHZhciBpc0FtYmlnVGltZXpvbmUgPSB0LmdldElzQW1iaWdUaW1lem9uZSgpO1xuXHRcdHZhciB1bmRvRnVuY3Rpb25zID0gW107XG5cblx0XHQvLyBub3JtYWxpemUgemVyby1sZW5ndGggZGVsdGFzIHRvIGJlIG51bGxcblx0XHRpZiAoZGF0ZURlbHRhICYmICFkYXRlRGVsdGEudmFsdWVPZigpKSB7IGRhdGVEZWx0YSA9IG51bGw7IH1cblx0XHRpZiAoZHVyYXRpb25EZWx0YSAmJiAhZHVyYXRpb25EZWx0YS52YWx1ZU9mKCkpIHsgZHVyYXRpb25EZWx0YSA9IG51bGw7IH1cblxuXHRcdCQuZWFjaChldmVudHMsIGZ1bmN0aW9uKGksIGV2ZW50KSB7XG5cdFx0XHR2YXIgb2xkUHJvcHM7XG5cdFx0XHR2YXIgbmV3UHJvcHM7XG5cblx0XHRcdC8vIGJ1aWxkIGFuIG9iamVjdCBob2xkaW5nIGFsbCB0aGUgb2xkIHZhbHVlcywgYm90aCBkYXRlLXJlbGF0ZWQgYW5kIG1pc2MuXG5cdFx0XHQvLyBmb3IgdGhlIHVuZG8gZnVuY3Rpb24uXG5cdFx0XHRvbGRQcm9wcyA9IHtcblx0XHRcdFx0c3RhcnQ6IGV2ZW50LnN0YXJ0LmNsb25lKCksXG5cdFx0XHRcdGVuZDogZXZlbnQuZW5kID8gZXZlbnQuZW5kLmNsb25lKCkgOiBudWxsLFxuXHRcdFx0XHRhbGxEYXk6IGV2ZW50LmFsbERheVxuXHRcdFx0fTtcblx0XHRcdCQuZWFjaChtaXNjUHJvcHMsIGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRcdFx0b2xkUHJvcHNbbmFtZV0gPSBldmVudFtuYW1lXTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBuZXcgZGF0ZS1yZWxhdGVkIHByb3BlcnRpZXMuIHdvcmsgb2ZmIHRoZSBvcmlnaW5hbCBkYXRlIHNuYXBzaG90LlxuXHRcdFx0Ly8gb2sgdG8gdXNlIHJlZmVyZW5jZXMgYmVjYXVzZSB0aGV5IHdpbGwgYmUgdGhyb3duIGF3YXkgd2hlbiBiYWNrdXBFdmVudERhdGVzIGlzIGNhbGxlZC5cblx0XHRcdG5ld1Byb3BzID0ge1xuXHRcdFx0XHRzdGFydDogZXZlbnQuX3N0YXJ0LFxuXHRcdFx0XHRlbmQ6IGV2ZW50Ll9lbmQsXG5cdFx0XHRcdGFsbERheTogZXZlbnQuX2FsbERheVxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKGNsZWFyRW5kKSB7XG5cdFx0XHRcdG5ld1Byb3BzLmVuZCA9IG51bGw7XG5cdFx0XHR9XG5cblx0XHRcdG5ld1Byb3BzLmFsbERheSA9IGFsbERheTtcblxuXHRcdFx0bm9ybWFsaXplRXZlbnREYXRlUHJvcHMobmV3UHJvcHMpOyAvLyBtYXNzYWdlcyBzdGFydC9lbmQvYWxsRGF5XG5cblx0XHRcdGlmIChkYXRlRGVsdGEpIHtcblx0XHRcdFx0bmV3UHJvcHMuc3RhcnQuYWRkKGRhdGVEZWx0YSk7XG5cdFx0XHRcdGlmIChuZXdQcm9wcy5lbmQpIHtcblx0XHRcdFx0XHRuZXdQcm9wcy5lbmQuYWRkKGRhdGVEZWx0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKGR1cmF0aW9uRGVsdGEpIHtcblx0XHRcdFx0aWYgKCFuZXdQcm9wcy5lbmQpIHtcblx0XHRcdFx0XHRuZXdQcm9wcy5lbmQgPSB0LmdldERlZmF1bHRFdmVudEVuZChuZXdQcm9wcy5hbGxEYXksIG5ld1Byb3BzLnN0YXJ0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRuZXdQcm9wcy5lbmQuYWRkKGR1cmF0aW9uRGVsdGEpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBpZiB0aGUgZGF0ZXMgaGF2ZSBjaGFuZ2VkLCBhbmQgd2Uga25vdyBpdCBpcyBpbXBvc3NpYmxlIHRvIHJlY29tcHV0ZSB0aGVcblx0XHRcdC8vIHRpbWV6b25lIG9mZnNldHMsIHN0cmlwIHRoZSB6b25lLlxuXHRcdFx0aWYgKFxuXHRcdFx0XHRpc0FtYmlnVGltZXpvbmUgJiZcblx0XHRcdFx0IW5ld1Byb3BzLmFsbERheSAmJlxuXHRcdFx0XHQoZGF0ZURlbHRhIHx8IGR1cmF0aW9uRGVsdGEpXG5cdFx0XHQpIHtcblx0XHRcdFx0bmV3UHJvcHMuc3RhcnQuc3RyaXBab25lKCk7XG5cdFx0XHRcdGlmIChuZXdQcm9wcy5lbmQpIHtcblx0XHRcdFx0XHRuZXdQcm9wcy5lbmQuc3RyaXBab25lKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0JC5leHRlbmQoZXZlbnQsIG1pc2NQcm9wcywgbmV3UHJvcHMpOyAvLyBjb3B5IG92ZXIgbWlzYyBwcm9wcywgdGhlbiBkYXRlLXJlbGF0ZWQgcHJvcHNcblx0XHRcdGJhY2t1cEV2ZW50RGF0ZXMoZXZlbnQpOyAvLyByZWdlbmVyYXRlIGludGVybmFsIF9zdGFydC9fZW5kL19hbGxEYXlcblxuXHRcdFx0dW5kb0Z1bmN0aW9ucy5wdXNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkLmV4dGVuZChldmVudCwgb2xkUHJvcHMpO1xuXHRcdFx0XHRiYWNrdXBFdmVudERhdGVzKGV2ZW50KTsgLy8gcmVnZW5lcmF0ZSBpbnRlcm5hbCBfc3RhcnQvX2VuZC9fYWxsRGF5XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdW5kb0Z1bmN0aW9ucy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR1bmRvRnVuY3Rpb25zW2ldKCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuXG5cblx0LyogQnVzaW5lc3MgSG91cnNcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cdHQuZ2V0QnVzaW5lc3NIb3Vyc0V2ZW50cyA9IGdldEJ1c2luZXNzSG91cnNFdmVudHM7XG5cblxuXHQvLyBSZXR1cm5zIGFuIGFycmF5IG9mIGV2ZW50cyBhcyB0byB3aGVuIHRoZSBidXNpbmVzcyBob3VycyBvY2N1ciBpbiB0aGUgZ2l2ZW4gdmlldy5cblx0Ly8gQWJ1c2Ugb2Ygb3VyIGV2ZW50IHN5c3RlbSA6KFxuXHRmdW5jdGlvbiBnZXRCdXNpbmVzc0hvdXJzRXZlbnRzKCkge1xuXHRcdHZhciBvcHRpb25WYWwgPSBvcHRpb25zLmJ1c2luZXNzSG91cnM7XG5cdFx0dmFyIGRlZmF1bHRWYWwgPSB7XG5cdFx0XHRjbGFzc05hbWU6ICdmYy1ub25idXNpbmVzcycsXG5cdFx0XHRzdGFydDogJzA5OjAwJyxcblx0XHRcdGVuZDogJzE3OjAwJyxcblx0XHRcdGRvdzogWyAxLCAyLCAzLCA0LCA1IF0sIC8vIG1vbmRheSAtIGZyaWRheVxuXHRcdFx0cmVuZGVyaW5nOiAnaW52ZXJzZS1iYWNrZ3JvdW5kJ1xuXHRcdH07XG5cdFx0dmFyIHZpZXcgPSB0LmdldFZpZXcoKTtcblx0XHR2YXIgZXZlbnRJbnB1dDtcblxuXHRcdGlmIChvcHRpb25WYWwpIHtcblx0XHRcdGlmICh0eXBlb2Ygb3B0aW9uVmFsID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHQvLyBvcHRpb24gdmFsdWUgaXMgYW4gb2JqZWN0IHRoYXQgY2FuIG92ZXJyaWRlIHRoZSBkZWZhdWx0IGJ1c2luZXNzIGhvdXJzXG5cdFx0XHRcdGV2ZW50SW5wdXQgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdFZhbCwgb3B0aW9uVmFsKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHQvLyBvcHRpb24gdmFsdWUgaXMgYHRydWVgLiB1c2UgZGVmYXVsdCBidXNpbmVzcyBob3Vyc1xuXHRcdFx0XHRldmVudElucHV0ID0gZGVmYXVsdFZhbDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZXZlbnRJbnB1dCkge1xuXHRcdFx0cmV0dXJuIGV4cGFuZEV2ZW50KFxuXHRcdFx0XHRidWlsZEV2ZW50RnJvbUlucHV0KGV2ZW50SW5wdXQpLFxuXHRcdFx0XHR2aWV3LnN0YXJ0LFxuXHRcdFx0XHR2aWV3LmVuZFxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gW107XG5cdH1cblxuXG5cdC8qIE92ZXJsYXBwaW5nIC8gQ29uc3RyYWluaW5nXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXHR0LmlzRXZlbnRSYW5nZUFsbG93ZWQgPSBpc0V2ZW50UmFuZ2VBbGxvd2VkO1xuXHR0LmlzU2VsZWN0aW9uUmFuZ2VBbGxvd2VkID0gaXNTZWxlY3Rpb25SYW5nZUFsbG93ZWQ7XG5cdHQuaXNFeHRlcm5hbERyb3BSYW5nZUFsbG93ZWQgPSBpc0V4dGVybmFsRHJvcFJhbmdlQWxsb3dlZDtcblxuXG5cdGZ1bmN0aW9uIGlzRXZlbnRSYW5nZUFsbG93ZWQocmFuZ2UsIGV2ZW50KSB7XG5cdFx0dmFyIHNvdXJjZSA9IGV2ZW50LnNvdXJjZSB8fCB7fTtcblx0XHR2YXIgY29uc3RyYWludCA9IGZpcnN0RGVmaW5lZChcblx0XHRcdGV2ZW50LmNvbnN0cmFpbnQsXG5cdFx0XHRzb3VyY2UuY29uc3RyYWludCxcblx0XHRcdG9wdGlvbnMuZXZlbnRDb25zdHJhaW50XG5cdFx0KTtcblx0XHR2YXIgb3ZlcmxhcCA9IGZpcnN0RGVmaW5lZChcblx0XHRcdGV2ZW50Lm92ZXJsYXAsXG5cdFx0XHRzb3VyY2Uub3ZlcmxhcCxcblx0XHRcdG9wdGlvbnMuZXZlbnRPdmVybGFwXG5cdFx0KTtcblxuXHRcdHJhbmdlID0gZW5zdXJlVmlzaWJsZUV2ZW50UmFuZ2UocmFuZ2UpOyAvLyBlbnN1cmUgYSBwcm9wZXIgcmFuZ2Ugd2l0aCBhbiBlbmQgZm9yIGlzUmFuZ2VBbGxvd2VkXG5cblx0XHRyZXR1cm4gaXNSYW5nZUFsbG93ZWQocmFuZ2UsIGNvbnN0cmFpbnQsIG92ZXJsYXAsIGV2ZW50KTtcblx0fVxuXG5cblx0ZnVuY3Rpb24gaXNTZWxlY3Rpb25SYW5nZUFsbG93ZWQocmFuZ2UpIHtcblx0XHRyZXR1cm4gaXNSYW5nZUFsbG93ZWQocmFuZ2UsIG9wdGlvbnMuc2VsZWN0Q29uc3RyYWludCwgb3B0aW9ucy5zZWxlY3RPdmVybGFwKTtcblx0fVxuXG5cblx0Ly8gd2hlbiBgZXZlbnRQcm9wc2AgaXMgZGVmaW5lZCwgY29uc2lkZXIgdGhpcyBhbiBldmVudC5cblx0Ly8gYGV2ZW50UHJvcHNgIGNhbiBjb250YWluIG1pc2Mgbm9uLWRhdGUtcmVsYXRlZCBpbmZvIGFib3V0IHRoZSBldmVudC5cblx0ZnVuY3Rpb24gaXNFeHRlcm5hbERyb3BSYW5nZUFsbG93ZWQocmFuZ2UsIGV2ZW50UHJvcHMpIHtcblx0XHR2YXIgZXZlbnRJbnB1dDtcblx0XHR2YXIgZXZlbnQ7XG5cblx0XHQvLyBub3RlOiB2ZXJ5IHNpbWlsYXIgbG9naWMgaXMgaW4gVmlldydzIHJlcG9ydEV4dGVybmFsRHJvcFxuXHRcdGlmIChldmVudFByb3BzKSB7XG5cdFx0XHRldmVudElucHV0ID0gJC5leHRlbmQoe30sIGV2ZW50UHJvcHMsIHJhbmdlKTtcblx0XHRcdGV2ZW50ID0gZXhwYW5kRXZlbnQoYnVpbGRFdmVudEZyb21JbnB1dChldmVudElucHV0KSlbMF07XG5cdFx0fVxuXG5cdFx0aWYgKGV2ZW50KSB7XG5cdFx0XHRyZXR1cm4gaXNFdmVudFJhbmdlQWxsb3dlZChyYW5nZSwgZXZlbnQpO1xuXHRcdH1cblx0XHRlbHNlIHsgLy8gdHJlYXQgaXQgYXMgYSBzZWxlY3Rpb25cblxuXHRcdFx0cmFuZ2UgPSBlbnN1cmVWaXNpYmxlRXZlbnRSYW5nZShyYW5nZSk7IC8vIGVuc3VyZSBhIHByb3BlciByYW5nZSB3aXRoIGFuIGVuZCBmb3IgaXNTZWxlY3Rpb25SYW5nZUFsbG93ZWRcblxuXHRcdFx0cmV0dXJuIGlzU2VsZWN0aW9uUmFuZ2VBbGxvd2VkKHJhbmdlKTtcblx0XHR9XG5cdH1cblxuXG5cdC8vIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gcmFuZ2UgKGNhdXNlZCBieSBhbiBldmVudCBkcm9wL3Jlc2l6ZSBvciBhIHNlbGVjdGlvbikgaXMgYWxsb3dlZCB0byBleGlzdFxuXHQvLyBhY2NvcmRpbmcgdG8gdGhlIGNvbnN0cmFpbnQvb3ZlcmxhcCBzZXR0aW5ncy5cblx0Ly8gYGV2ZW50YCBpcyBub3QgcmVxdWlyZWQgaWYgY2hlY2tpbmcgYSBzZWxlY3Rpb24uXG5cdGZ1bmN0aW9uIGlzUmFuZ2VBbGxvd2VkKHJhbmdlLCBjb25zdHJhaW50LCBvdmVybGFwLCBldmVudCkge1xuXHRcdHZhciBjb25zdHJhaW50RXZlbnRzO1xuXHRcdHZhciBhbnlDb250YWlubWVudDtcblx0XHR2YXIgaSwgb3RoZXJFdmVudDtcblx0XHR2YXIgb3RoZXJPdmVybGFwO1xuXG5cdFx0Ly8gbm9ybWFsaXplLiBmeWksIHdlJ3JlIG5vcm1hbGl6aW5nIGluIHRvbyBtYW55IHBsYWNlcyA6KFxuXHRcdHJhbmdlID0ge1xuXHRcdFx0c3RhcnQ6IHJhbmdlLnN0YXJ0LmNsb25lKCkuc3RyaXBab25lKCksXG5cdFx0XHRlbmQ6IHJhbmdlLmVuZC5jbG9uZSgpLnN0cmlwWm9uZSgpXG5cdFx0fTtcblxuXHRcdC8vIHRoZSByYW5nZSBtdXN0IGJlIGZ1bGx5IGNvbnRhaW5lZCBieSBhdCBsZWFzdCBvbmUgb2YgcHJvZHVjZWQgY29uc3RyYWludCBldmVudHNcblx0XHRpZiAoY29uc3RyYWludCAhPSBudWxsKSB7XG5cblx0XHRcdC8vIG5vdCB0cmVhdGVkIGFzIGFuIGV2ZW50ISBpbnRlcm1lZGlhdGUgZGF0YSBzdHJ1Y3R1cmVcblx0XHRcdC8vIFRPRE86IHVzZSByYW5nZXMgaW4gdGhlIGZ1dHVyZVxuXHRcdFx0Y29uc3RyYWludEV2ZW50cyA9IGNvbnN0cmFpbnRUb0V2ZW50cyhjb25zdHJhaW50KTtcblxuXHRcdFx0YW55Q29udGFpbm1lbnQgPSBmYWxzZTtcblx0XHRcdGZvciAoaSA9IDA7IGkgPCBjb25zdHJhaW50RXZlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChldmVudENvbnRhaW5zUmFuZ2UoY29uc3RyYWludEV2ZW50c1tpXSwgcmFuZ2UpKSB7XG5cdFx0XHRcdFx0YW55Q29udGFpbm1lbnQgPSB0cnVlO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICghYW55Q29udGFpbm1lbnQpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDA7IGkgPCBjYWNoZS5sZW5ndGg7IGkrKykgeyAvLyBsb29wIGFsbCBldmVudHMgYW5kIGRldGVjdCBvdmVybGFwXG5cdFx0XHRvdGhlckV2ZW50ID0gY2FjaGVbaV07XG5cblx0XHRcdC8vIGRvbid0IGNvbXBhcmUgdGhlIGV2ZW50IHRvIGl0c2VsZiBvciBvdGhlciByZWxhdGVkIFtyZXBlYXRpbmddIGV2ZW50c1xuXHRcdFx0aWYgKGV2ZW50ICYmIGV2ZW50Ll9pZCA9PT0gb3RoZXJFdmVudC5faWQpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHRoZXJlIG5lZWRzIHRvIGJlIGFuIGFjdHVhbCBpbnRlcnNlY3Rpb24gYmVmb3JlIGRpc2FsbG93aW5nIGFueXRoaW5nXG5cdFx0XHRpZiAoZXZlbnRJbnRlcnNlY3RzUmFuZ2Uob3RoZXJFdmVudCwgcmFuZ2UpKSB7XG5cblx0XHRcdFx0Ly8gZXZhbHVhdGUgb3ZlcmxhcCBmb3IgdGhlIGdpdmVuIHJhbmdlIGFuZCBzaG9ydC1jaXJjdWl0IGlmIG5lY2Vzc2FyeVxuXHRcdFx0XHRpZiAob3ZlcmxhcCA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIG92ZXJsYXAgPT09ICdmdW5jdGlvbicgJiYgIW92ZXJsYXAob3RoZXJFdmVudCwgZXZlbnQpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gaWYgd2UgYXJlIGNvbXB1dGluZyBpZiB0aGUgZ2l2ZW4gcmFuZ2UgaXMgYWxsb3dhYmxlIGZvciBhbiBldmVudCwgY29uc2lkZXIgdGhlIG90aGVyIGV2ZW50J3Ncblx0XHRcdFx0Ly8gRXZlbnRPYmplY3Qtc3BlY2lmaWMgb3IgU291cmNlLXNwZWNpZmljIGBvdmVybGFwYCBwcm9wZXJ0eVxuXHRcdFx0XHRpZiAoZXZlbnQpIHtcblx0XHRcdFx0XHRvdGhlck92ZXJsYXAgPSBmaXJzdERlZmluZWQoXG5cdFx0XHRcdFx0XHRvdGhlckV2ZW50Lm92ZXJsYXAsXG5cdFx0XHRcdFx0XHQob3RoZXJFdmVudC5zb3VyY2UgfHwge30pLm92ZXJsYXBcblx0XHRcdFx0XHRcdC8vIHdlIGFscmVhZHkgY29uc2lkZXJlZCB0aGUgZ2xvYmFsIGBldmVudE92ZXJsYXBgXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRpZiAob3RoZXJPdmVybGFwID09PSBmYWxzZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAodHlwZW9mIG90aGVyT3ZlcmxhcCA9PT0gJ2Z1bmN0aW9uJyAmJiAhb3RoZXJPdmVybGFwKGV2ZW50LCBvdGhlckV2ZW50KSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblxuXHQvLyBHaXZlbiBhbiBldmVudCBpbnB1dCBmcm9tIHRoZSBBUEksIHByb2R1Y2VzIGFuIGFycmF5IG9mIGV2ZW50IG9iamVjdHMuIFBvc3NpYmxlIGV2ZW50IGlucHV0czpcblx0Ly8gJ2J1c2luZXNzSG91cnMnXG5cdC8vIEFuIGV2ZW50IElEIChudW1iZXIgb3Igc3RyaW5nKVxuXHQvLyBBbiBvYmplY3Qgd2l0aCBzcGVjaWZpYyBzdGFydC9lbmQgZGF0ZXMgb3IgYSByZWN1cnJpbmcgZXZlbnQgKGxpa2Ugd2hhdCBidXNpbmVzc0hvdXJzIGFjY2VwdHMpXG5cdGZ1bmN0aW9uIGNvbnN0cmFpbnRUb0V2ZW50cyhjb25zdHJhaW50SW5wdXQpIHtcblxuXHRcdGlmIChjb25zdHJhaW50SW5wdXQgPT09ICdidXNpbmVzc0hvdXJzJykge1xuXHRcdFx0cmV0dXJuIGdldEJ1c2luZXNzSG91cnNFdmVudHMoKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGNvbnN0cmFpbnRJbnB1dCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdHJldHVybiBleHBhbmRFdmVudChidWlsZEV2ZW50RnJvbUlucHV0KGNvbnN0cmFpbnRJbnB1dCkpO1xuXHRcdH1cblxuXHRcdHJldHVybiBjbGllbnRFdmVudHMoY29uc3RyYWludElucHV0KTsgLy8gcHJvYmFibHkgYW4gSURcblx0fVxuXG5cblx0Ly8gRG9lcyB0aGUgZXZlbnQncyBkYXRlIHJhbmdlIGZ1bGx5IGNvbnRhaW4gdGhlIGdpdmVuIHJhbmdlP1xuXHQvLyBzdGFydC9lbmQgYWxyZWFkeSBhc3N1bWVkIHRvIGhhdmUgc3RyaXBwZWQgem9uZXMgOihcblx0ZnVuY3Rpb24gZXZlbnRDb250YWluc1JhbmdlKGV2ZW50LCByYW5nZSkge1xuXHRcdHZhciBldmVudFN0YXJ0ID0gZXZlbnQuc3RhcnQuY2xvbmUoKS5zdHJpcFpvbmUoKTtcblx0XHR2YXIgZXZlbnRFbmQgPSB0LmdldEV2ZW50RW5kKGV2ZW50KS5zdHJpcFpvbmUoKTtcblxuXHRcdHJldHVybiByYW5nZS5zdGFydCA+PSBldmVudFN0YXJ0ICYmIHJhbmdlLmVuZCA8PSBldmVudEVuZDtcblx0fVxuXG5cblx0Ly8gRG9lcyB0aGUgZXZlbnQncyBkYXRlIHJhbmdlIGludGVyc2VjdCB3aXRoIHRoZSBnaXZlbiByYW5nZT9cblx0Ly8gc3RhcnQvZW5kIGFscmVhZHkgYXNzdW1lZCB0byBoYXZlIHN0cmlwcGVkIHpvbmVzIDooXG5cdGZ1bmN0aW9uIGV2ZW50SW50ZXJzZWN0c1JhbmdlKGV2ZW50LCByYW5nZSkge1xuXHRcdHZhciBldmVudFN0YXJ0ID0gZXZlbnQuc3RhcnQuY2xvbmUoKS5zdHJpcFpvbmUoKTtcblx0XHR2YXIgZXZlbnRFbmQgPSB0LmdldEV2ZW50RW5kKGV2ZW50KS5zdHJpcFpvbmUoKTtcblxuXHRcdHJldHVybiByYW5nZS5zdGFydCA8IGV2ZW50RW5kICYmIHJhbmdlLmVuZCA+IGV2ZW50U3RhcnQ7XG5cdH1cblxufVxuXG5cbi8vIHVwZGF0ZXMgdGhlIFwiYmFja3VwXCIgcHJvcGVydGllcywgd2hpY2ggYXJlIHByZXNlcnZlZCBpbiBvcmRlciB0byBjb21wdXRlIGRpZmZzIGxhdGVyIG9uLlxuZnVuY3Rpb24gYmFja3VwRXZlbnREYXRlcyhldmVudCkge1xuXHRldmVudC5fYWxsRGF5ID0gZXZlbnQuYWxsRGF5O1xuXHRldmVudC5fc3RhcnQgPSBldmVudC5zdGFydC5jbG9uZSgpO1xuXHRldmVudC5fZW5kID0gZXZlbnQuZW5kID8gZXZlbnQuZW5kLmNsb25lKCkgOiBudWxsO1xufVxuXG4gICAgLyogQW4gYWJzdHJhY3QgY2xhc3MgZm9yIHRoZSBcImJhc2ljXCIgdmlld3MsIGFzIHdlbGwgYXMgbW9udGggdmlldy4gUmVuZGVycyBvbmUgb3IgbW9yZSByb3dzIG9mIGRheSBjZWxscy5cbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuLy8gSXQgaXMgYSBtYW5hZ2VyIGZvciBhIERheUdyaWQgc3ViY29tcG9uZW50LCB3aGljaCBkb2VzIG1vc3Qgb2YgdGhlIGhlYXZ5IGxpZnRpbmcuXG4vLyBJdCBpcyByZXNwb25zaWJsZSBmb3IgbWFuYWdpbmcgd2lkdGgvaGVpZ2h0LlxuXG52YXIgQmFzaWNWaWV3ID0gZmNWaWV3cy5iYXNpYyA9IFZpZXcuZXh0ZW5kKHtcblxuXHRkYXlHcmlkOiBudWxsLCAvLyB0aGUgbWFpbiBzdWJjb21wb25lbnQgdGhhdCBkb2VzIG1vc3Qgb2YgdGhlIGhlYXZ5IGxpZnRpbmdcblxuXHRkYXlOdW1iZXJzVmlzaWJsZTogZmFsc2UsIC8vIGRpc3BsYXkgZGF5IG51bWJlcnMgb24gZWFjaCBkYXkgY2VsbD9cblx0d2Vla051bWJlcnNWaXNpYmxlOiBmYWxzZSwgLy8gZGlzcGxheSB3ZWVrIG51bWJlcnMgYWxvbmcgdGhlIHNpZGU/XG5cblx0d2Vla051bWJlcldpZHRoOiBudWxsLCAvLyB3aWR0aCBvZiBhbGwgdGhlIHdlZWstbnVtYmVyIGNlbGxzIHJ1bm5pbmcgZG93biB0aGUgc2lkZVxuXG5cdGhlYWRSb3dFbDogbnVsbCwgLy8gdGhlIGZha2Ugcm93IGVsZW1lbnQgb2YgdGhlIGRheS1vZi13ZWVrIGhlYWRlclxuXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kYXlHcmlkID0gbmV3IERheUdyaWQodGhpcyk7XG5cdFx0dGhpcy5jb29yZE1hcCA9IHRoaXMuZGF5R3JpZC5jb29yZE1hcDsgLy8gdGhlIHZpZXcncyBkYXRlLXRvLWNlbGwgbWFwcGluZyBpcyBpZGVudGljYWwgdG8gdGhlIHN1YmNvbXBvbmVudCdzXG5cdH0sXG5cblxuXHQvLyBTZXRzIHRoZSBkaXNwbGF5IHJhbmdlIGFuZCBjb21wdXRlcyBhbGwgbmVjZXNzYXJ5IGRhdGVzXG5cdHNldFJhbmdlOiBmdW5jdGlvbihyYW5nZSkge1xuXHRcdFZpZXcucHJvdG90eXBlLnNldFJhbmdlLmNhbGwodGhpcywgcmFuZ2UpOyAvLyBjYWxsIHRoZSBzdXBlci1tZXRob2RcblxuXHRcdHRoaXMuZGF5R3JpZC5icmVha09uV2Vla3MgPSAveWVhcnxtb250aHx3ZWVrLy50ZXN0KHRoaXMuaW50ZXJ2YWxVbml0KTsgLy8gZG8gYmVmb3JlIHNldFJhbmdlXG5cdFx0dGhpcy5kYXlHcmlkLnNldFJhbmdlKHJhbmdlKTtcblx0fSxcblxuXG5cdC8vIENvbXB1dGUgdGhlIHZhbHVlIHRvIGZlZWQgaW50byBzZXRSYW5nZS4gT3ZlcnJpZGVzIHN1cGVyY2xhc3MuXG5cdGNvbXB1dGVSYW5nZTogZnVuY3Rpb24oZGF0ZSkge1xuXHRcdHZhciByYW5nZSA9IFZpZXcucHJvdG90eXBlLmNvbXB1dGVSYW5nZS5jYWxsKHRoaXMsIGRhdGUpOyAvLyBnZXQgdmFsdWUgZnJvbSB0aGUgc3VwZXItbWV0aG9kXG5cblx0XHQvLyB5ZWFyIGFuZCBtb250aCB2aWV3cyBzaG91bGQgYmUgYWxpZ25lZCB3aXRoIHdlZWtzLiB0aGlzIGlzIGFscmVhZHkgZG9uZSBmb3Igd2Vla1xuXHRcdGlmICgveWVhcnxtb250aC8udGVzdChyYW5nZS5pbnRlcnZhbFVuaXQpKSB7XG5cdFx0XHRyYW5nZS5zdGFydC5zdGFydE9mKCd3ZWVrJyk7XG5cdFx0XHRyYW5nZS5zdGFydCA9IHRoaXMuc2tpcEhpZGRlbkRheXMocmFuZ2Uuc3RhcnQpO1xuXG5cdFx0XHQvLyBtYWtlIGVuZC1vZi13ZWVrIGlmIG5vdCBhbHJlYWR5XG5cdFx0XHRpZiAocmFuZ2UuZW5kLndlZWtkYXkoKSkge1xuXHRcdFx0XHRyYW5nZS5lbmQuYWRkKDEsICd3ZWVrJykuc3RhcnRPZignd2VlaycpO1xuXHRcdFx0XHRyYW5nZS5lbmQgPSB0aGlzLnNraXBIaWRkZW5EYXlzKHJhbmdlLmVuZCwgLTEsIHRydWUpOyAvLyBleGNsdXNpdmVseSBtb3ZlIGJhY2t3YXJkc1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiByYW5nZTtcblx0fSxcblxuXG5cdC8vIFJlbmRlcnMgdGhlIHZpZXcgaW50byBgdGhpcy5lbGAsIHdoaWNoIHNob3VsZCBhbHJlYWR5IGJlIGFzc2lnbmVkXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cblx0XHR0aGlzLmRheU51bWJlcnNWaXNpYmxlID0gdGhpcy5kYXlHcmlkLnJvd0NudCA+IDE7IC8vIFRPRE86IG1ha2UgZ3JpZCByZXNwb25zaWJsZVxuXHRcdHRoaXMud2Vla051bWJlcnNWaXNpYmxlID0gdGhpcy5vcHQoJ3dlZWtOdW1iZXJzJyk7XG5cdFx0dGhpcy5kYXlHcmlkLm51bWJlcnNWaXNpYmxlID0gdGhpcy5kYXlOdW1iZXJzVmlzaWJsZSB8fCB0aGlzLndlZWtOdW1iZXJzVmlzaWJsZTtcblxuXHRcdHRoaXMuZWwuYWRkQ2xhc3MoJ2ZjLWJhc2ljLXZpZXcnKS5odG1sKHRoaXMucmVuZGVySHRtbCgpKTtcblxuXHRcdHRoaXMuaGVhZFJvd0VsID0gdGhpcy5lbC5maW5kKCd0aGVhZCAuZmMtcm93Jyk7XG5cblx0XHR0aGlzLnNjcm9sbGVyRWwgPSB0aGlzLmVsLmZpbmQoJy5mYy1kYXktZ3JpZC1jb250YWluZXInKTtcblx0XHR0aGlzLmRheUdyaWQuY29vcmRNYXAuY29udGFpbmVyRWwgPSB0aGlzLnNjcm9sbGVyRWw7IC8vIGNvbnN0cmFpbiBjbGlja3MvZXRjIHRvIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBzY3JvbGxlclxuXG5cdFx0dGhpcy5kYXlHcmlkLmVsID0gdGhpcy5lbC5maW5kKCcuZmMtZGF5LWdyaWQnKTtcblx0XHR0aGlzLmRheUdyaWQucmVuZGVyKHRoaXMuaGFzUmlnaWRSb3dzKCkpO1xuXHR9LFxuXG5cblx0Ly8gTWFrZSBzdWJjb21wb25lbnRzIHJlYWR5IGZvciBjbGVhbnVwXG5cdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZGF5R3JpZC5kZXN0cm95KCk7XG5cdFx0Vmlldy5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMpOyAvLyBjYWxsIHRoZSBzdXBlci1tZXRob2Rcblx0fSxcblxuXG5cdC8vIEJ1aWxkcyB0aGUgSFRNTCBza2VsZXRvbiBmb3IgdGhlIHZpZXcuXG5cdC8vIFRoZSBkYXktZ3JpZCBjb21wb25lbnQgd2lsbCByZW5kZXIgaW5zaWRlIG9mIGEgY29udGFpbmVyIGRlZmluZWQgYnkgdGhpcyBIVE1MLlxuXHRyZW5kZXJIdG1sOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJycgK1xuXHRcdFx0Jzx0YWJsZT4nICtcblx0XHRcdFx0Jzx0aGVhZD4nICtcblx0XHRcdFx0XHQnPHRyPicgK1xuXHRcdFx0XHRcdFx0Jzx0ZCBjbGFzcz1cIicgKyB0aGlzLndpZGdldEhlYWRlckNsYXNzICsgJ1wiPicgK1xuXHRcdFx0XHRcdFx0XHR0aGlzLmRheUdyaWQuaGVhZEh0bWwoKSArIC8vIHJlbmRlciB0aGUgZGF5LW9mLXdlZWsgaGVhZGVyc1xuXHRcdFx0XHRcdFx0JzwvdGQ+JyArXG5cdFx0XHRcdFx0JzwvdHI+JyArXG5cdFx0XHRcdCc8L3RoZWFkPicgK1xuXHRcdFx0XHQnPHRib2R5PicgK1xuXHRcdFx0XHRcdCc8dHI+JyArXG5cdFx0XHRcdFx0XHQnPHRkIGNsYXNzPVwiJyArIHRoaXMud2lkZ2V0Q29udGVudENsYXNzICsgJ1wiPicgK1xuXHRcdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImZjLWRheS1ncmlkLWNvbnRhaW5lclwiPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiZmMtZGF5LWdyaWRcIi8+JyArXG5cdFx0XHRcdFx0XHRcdCc8L2Rpdj4nICtcblx0XHRcdFx0XHRcdCc8L3RkPicgK1xuXHRcdFx0XHRcdCc8L3RyPicgK1xuXHRcdFx0XHQnPC90Ym9keT4nICtcblx0XHRcdCc8L3RhYmxlPic7XG5cdH0sXG5cblxuXHQvLyBHZW5lcmF0ZXMgdGhlIEhUTUwgdGhhdCB3aWxsIGdvIGJlZm9yZSB0aGUgZGF5LW9mIHdlZWsgaGVhZGVyIGNlbGxzLlxuXHQvLyBRdWVyaWVkIGJ5IHRoZSBEYXlHcmlkIHN1YmNvbXBvbmVudCB3aGVuIGdlbmVyYXRpbmcgcm93cy4gT3JkZXJpbmcgZGVwZW5kcyBvbiBpc1JUTC5cblx0aGVhZEludHJvSHRtbDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMud2Vla051bWJlcnNWaXNpYmxlKSB7XG5cdFx0XHRyZXR1cm4gJycgK1xuXHRcdFx0XHQnPHRoIGNsYXNzPVwiZmMtd2Vlay1udW1iZXIgJyArIHRoaXMud2lkZ2V0SGVhZGVyQ2xhc3MgKyAnXCIgJyArIHRoaXMud2Vla051bWJlclN0eWxlQXR0cigpICsgJz4nICtcblx0XHRcdFx0XHQnPHNwYW4+JyArIC8vIG5lZWRlZCBmb3IgbWF0Y2hDZWxsV2lkdGhzXG5cdFx0XHRcdFx0XHRodG1sRXNjYXBlKHRoaXMub3B0KCd3ZWVrTnVtYmVyVGl0bGUnKSkgK1xuXHRcdFx0XHRcdCc8L3NwYW4+JyArXG5cdFx0XHRcdCc8L3RoPic7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gR2VuZXJhdGVzIHRoZSBIVE1MIHRoYXQgd2lsbCBnbyBiZWZvcmUgY29udGVudC1za2VsZXRvbiBjZWxscyB0aGF0IGRpc3BsYXkgdGhlIGRheS93ZWVrIG51bWJlcnMuXG5cdC8vIFF1ZXJpZWQgYnkgdGhlIERheUdyaWQgc3ViY29tcG9uZW50LiBPcmRlcmluZyBkZXBlbmRzIG9uIGlzUlRMLlxuXHRudW1iZXJJbnRyb0h0bWw6IGZ1bmN0aW9uKHJvdykge1xuXHRcdGlmICh0aGlzLndlZWtOdW1iZXJzVmlzaWJsZSkge1xuXHRcdFx0cmV0dXJuICcnICtcblx0XHRcdFx0Jzx0ZCBjbGFzcz1cImZjLXdlZWstbnVtYmVyXCIgJyArIHRoaXMud2Vla051bWJlclN0eWxlQXR0cigpICsgJz4nICtcblx0XHRcdFx0XHQnPHNwYW4+JyArIC8vIG5lZWRlZCBmb3IgbWF0Y2hDZWxsV2lkdGhzXG5cdFx0XHRcdFx0XHR0aGlzLmNhbGVuZGFyLmNhbGN1bGF0ZVdlZWtOdW1iZXIodGhpcy5kYXlHcmlkLmdldENlbGwocm93LCAwKS5zdGFydCkgK1xuXHRcdFx0XHRcdCc8L3NwYW4+JyArXG5cdFx0XHRcdCc8L3RkPic7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gR2VuZXJhdGVzIHRoZSBIVE1MIHRoYXQgZ29lcyBiZWZvcmUgdGhlIGRheSBiZyBjZWxscyBmb3IgZWFjaCBkYXktcm93LlxuXHQvLyBRdWVyaWVkIGJ5IHRoZSBEYXlHcmlkIHN1YmNvbXBvbmVudC4gT3JkZXJpbmcgZGVwZW5kcyBvbiBpc1JUTC5cblx0ZGF5SW50cm9IdG1sOiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy53ZWVrTnVtYmVyc1Zpc2libGUpIHtcblx0XHRcdHJldHVybiAnPHRkIGNsYXNzPVwiZmMtd2Vlay1udW1iZXIgJyArIHRoaXMud2lkZ2V0Q29udGVudENsYXNzICsgJ1wiICcgK1xuXHRcdFx0XHR0aGlzLndlZWtOdW1iZXJTdHlsZUF0dHIoKSArICc+PC90ZD4nO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIEdlbmVyYXRlcyB0aGUgSFRNTCB0aGF0IGdvZXMgYmVmb3JlIGV2ZXJ5IG90aGVyIHR5cGUgb2Ygcm93IGdlbmVyYXRlZCBieSBEYXlHcmlkLiBPcmRlcmluZyBkZXBlbmRzIG9uIGlzUlRMLlxuXHQvLyBBZmZlY3RzIGhlbHBlci1za2VsZXRvbiBhbmQgaGlnaGxpZ2h0LXNrZWxldG9uIHJvd3MuXG5cdGludHJvSHRtbDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMud2Vla051bWJlcnNWaXNpYmxlKSB7XG5cdFx0XHRyZXR1cm4gJzx0ZCBjbGFzcz1cImZjLXdlZWstbnVtYmVyXCIgJyArIHRoaXMud2Vla051bWJlclN0eWxlQXR0cigpICsgJz48L3RkPic7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gR2VuZXJhdGVzIHRoZSBIVE1MIGZvciB0aGUgPHRkPnMgb2YgdGhlIFwibnVtYmVyXCIgcm93IGluIHRoZSBEYXlHcmlkJ3MgY29udGVudCBza2VsZXRvbi5cblx0Ly8gVGhlIG51bWJlciByb3cgd2lsbCBvbmx5IGV4aXN0IGlmIGVpdGhlciBkYXkgbnVtYmVycyBvciB3ZWVrIG51bWJlcnMgYXJlIHR1cm5lZCBvbi5cblx0bnVtYmVyQ2VsbEh0bWw6IGZ1bmN0aW9uKGNlbGwpIHtcblx0XHR2YXIgZGF0ZSA9IGNlbGwuc3RhcnQ7XG5cdFx0dmFyIGNsYXNzZXM7XG5cblx0XHRpZiAoIXRoaXMuZGF5TnVtYmVyc1Zpc2libGUpIHsgLy8gaWYgdGhlcmUgYXJlIHdlZWsgbnVtYmVycyBidXQgbm90IGRheSBudW1iZXJzXG5cdFx0XHRyZXR1cm4gJzx0ZC8+JzsgLy8gIHdpbGwgY3JlYXRlIGFuIGVtcHR5IHNwYWNlIGFib3ZlIGV2ZW50cyA6KFxuXHRcdH1cblxuXHRcdGNsYXNzZXMgPSB0aGlzLmRheUdyaWQuZ2V0RGF5Q2xhc3NlcyhkYXRlKTtcblx0XHRjbGFzc2VzLnVuc2hpZnQoJ2ZjLWRheS1udW1iZXInKTtcblxuXHRcdHJldHVybiAnJyArXG5cdFx0XHQnPHRkIGNsYXNzPVwiJyArIGNsYXNzZXMuam9pbignICcpICsgJ1wiIGRhdGEtZGF0ZT1cIicgKyBkYXRlLmZvcm1hdCgpICsgJ1wiPicgK1xuXHRcdFx0XHRkYXRlLmRhdGUoKSArXG5cdFx0XHQnPC90ZD4nO1xuXHR9LFxuXG5cblx0Ly8gR2VuZXJhdGVzIGFuIEhUTUwgYXR0cmlidXRlIHN0cmluZyBmb3Igc2V0dGluZyB0aGUgd2lkdGggb2YgdGhlIHdlZWsgbnVtYmVyIGNvbHVtbiwgaWYgaXQgaXMga25vd25cblx0d2Vla051bWJlclN0eWxlQXR0cjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMud2Vla051bWJlcldpZHRoICE9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gJ3N0eWxlPVwid2lkdGg6JyArIHRoaXMud2Vla051bWJlcldpZHRoICsgJ3B4XCInO1xuXHRcdH1cblx0XHRyZXR1cm4gJyc7XG5cdH0sXG5cblxuXHQvLyBEZXRlcm1pbmVzIHdoZXRoZXIgZWFjaCByb3cgc2hvdWxkIGhhdmUgYSBjb25zdGFudCBoZWlnaHRcblx0aGFzUmlnaWRSb3dzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZXZlbnRMaW1pdCA9IHRoaXMub3B0KCdldmVudExpbWl0Jyk7XG5cdFx0cmV0dXJuIGV2ZW50TGltaXQgJiYgdHlwZW9mIGV2ZW50TGltaXQgIT09ICdudW1iZXInO1xuXHR9LFxuXG5cblx0LyogRGltZW5zaW9uc1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gUmVmcmVzaGVzIHRoZSBob3Jpem9udGFsIGRpbWVuc2lvbnMgb2YgdGhlIHZpZXdcblx0dXBkYXRlV2lkdGg6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLndlZWtOdW1iZXJzVmlzaWJsZSkge1xuXHRcdFx0Ly8gTWFrZSBzdXJlIGFsbCB3ZWVrIG51bWJlciBjZWxscyBydW5uaW5nIGRvd24gdGhlIHNpZGUgaGF2ZSB0aGUgc2FtZSB3aWR0aC5cblx0XHRcdC8vIFJlY29yZCB0aGUgd2lkdGggZm9yIGNlbGxzIGNyZWF0ZWQgbGF0ZXIuXG5cdFx0XHR0aGlzLndlZWtOdW1iZXJXaWR0aCA9IG1hdGNoQ2VsbFdpZHRocyhcblx0XHRcdFx0dGhpcy5lbC5maW5kKCcuZmMtd2Vlay1udW1iZXInKVxuXHRcdFx0KTtcblx0XHR9XG5cdH0sXG5cblxuXHQvLyBBZGp1c3RzIHRoZSB2ZXJ0aWNhbCBkaW1lbnNpb25zIG9mIHRoZSB2aWV3IHRvIHRoZSBzcGVjaWZpZWQgdmFsdWVzXG5cdHNldEhlaWdodDogZnVuY3Rpb24odG90YWxIZWlnaHQsIGlzQXV0bykge1xuXHRcdHZhciBldmVudExpbWl0ID0gdGhpcy5vcHQoJ2V2ZW50TGltaXQnKTtcblx0XHR2YXIgc2Nyb2xsZXJIZWlnaHQ7XG5cblx0XHQvLyByZXNldCBhbGwgaGVpZ2h0cyB0byBiZSBuYXR1cmFsXG5cdFx0dW5zZXRTY3JvbGxlcih0aGlzLnNjcm9sbGVyRWwpO1xuXHRcdHVuY29tcGVuc2F0ZVNjcm9sbCh0aGlzLmhlYWRSb3dFbCk7XG5cblx0XHR0aGlzLmRheUdyaWQuZGVzdHJveVNlZ1BvcG92ZXIoKTsgLy8ga2lsbCB0aGUgXCJtb3JlXCIgcG9wb3ZlciBpZiBkaXNwbGF5ZWRcblxuXHRcdC8vIGlzIHRoZSBldmVudCBsaW1pdCBhIGNvbnN0YW50IGxldmVsIG51bWJlcj9cblx0XHRpZiAoZXZlbnRMaW1pdCAmJiB0eXBlb2YgZXZlbnRMaW1pdCA9PT0gJ251bWJlcicpIHtcblx0XHRcdHRoaXMuZGF5R3JpZC5saW1pdFJvd3MoZXZlbnRMaW1pdCk7IC8vIGxpbWl0IHRoZSBsZXZlbHMgZmlyc3Qgc28gdGhlIGhlaWdodCBjYW4gcmVkaXN0cmlidXRlIGFmdGVyXG5cdFx0fVxuXG5cdFx0c2Nyb2xsZXJIZWlnaHQgPSB0aGlzLmNvbXB1dGVTY3JvbGxlckhlaWdodCh0b3RhbEhlaWdodCk7XG5cdFx0dGhpcy5zZXRHcmlkSGVpZ2h0KHNjcm9sbGVySGVpZ2h0LCBpc0F1dG8pO1xuXG5cdFx0Ly8gaXMgdGhlIGV2ZW50IGxpbWl0IGR5bmFtaWNhbGx5IGNhbGN1bGF0ZWQ/XG5cdFx0aWYgKGV2ZW50TGltaXQgJiYgdHlwZW9mIGV2ZW50TGltaXQgIT09ICdudW1iZXInKSB7XG5cdFx0XHR0aGlzLmRheUdyaWQubGltaXRSb3dzKGV2ZW50TGltaXQpOyAvLyBsaW1pdCB0aGUgbGV2ZWxzIGFmdGVyIHRoZSBncmlkJ3Mgcm93IGhlaWdodHMgaGF2ZSBiZWVuIHNldFxuXHRcdH1cblxuXHRcdGlmICghaXNBdXRvICYmIHNldFBvdGVudGlhbFNjcm9sbGVyKHRoaXMuc2Nyb2xsZXJFbCwgc2Nyb2xsZXJIZWlnaHQpKSB7IC8vIHVzaW5nIHNjcm9sbGJhcnM/XG5cblx0XHRcdGNvbXBlbnNhdGVTY3JvbGwodGhpcy5oZWFkUm93RWwsIGdldFNjcm9sbGJhcldpZHRocyh0aGlzLnNjcm9sbGVyRWwpKTtcblxuXHRcdFx0Ly8gZG9pbmcgdGhlIHNjcm9sbGJhciBjb21wZW5zYXRpb24gbWlnaHQgaGF2ZSBjcmVhdGVkIHRleHQgb3ZlcmZsb3cgd2hpY2ggY3JlYXRlZCBtb3JlIGhlaWdodC4gcmVkb1xuXHRcdFx0c2Nyb2xsZXJIZWlnaHQgPSB0aGlzLmNvbXB1dGVTY3JvbGxlckhlaWdodCh0b3RhbEhlaWdodCk7XG5cdFx0XHR0aGlzLnNjcm9sbGVyRWwuaGVpZ2h0KHNjcm9sbGVySGVpZ2h0KTtcblxuXHRcdFx0dGhpcy5yZXN0b3JlU2Nyb2xsKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gU2V0cyB0aGUgaGVpZ2h0IG9mIGp1c3QgdGhlIERheUdyaWQgY29tcG9uZW50IGluIHRoaXMgdmlld1xuXHRzZXRHcmlkSGVpZ2h0OiBmdW5jdGlvbihoZWlnaHQsIGlzQXV0bykge1xuXHRcdGlmIChpc0F1dG8pIHtcblx0XHRcdHVuZGlzdHJpYnV0ZUhlaWdodCh0aGlzLmRheUdyaWQucm93RWxzKTsgLy8gbGV0IHRoZSByb3dzIGJlIHRoZWlyIG5hdHVyYWwgaGVpZ2h0IHdpdGggbm8gZXhwYW5kaW5nXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0ZGlzdHJpYnV0ZUhlaWdodCh0aGlzLmRheUdyaWQucm93RWxzLCBoZWlnaHQsIHRydWUpOyAvLyB0cnVlID0gY29tcGVuc2F0ZSBmb3IgaGVpZ2h0LWhvZ2dpbmcgcm93c1xuXHRcdH1cblx0fSxcblxuXG5cdC8qIEV2ZW50c1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gUmVuZGVycyB0aGUgZ2l2ZW4gZXZlbnRzIG9udG8gdGhlIHZpZXcgYW5kIHBvcHVsYXRlcyB0aGUgc2VnbWVudHMgYXJyYXlcblx0cmVuZGVyRXZlbnRzOiBmdW5jdGlvbihldmVudHMpIHtcblx0XHR0aGlzLmRheUdyaWQucmVuZGVyRXZlbnRzKGV2ZW50cyk7XG5cblx0XHR0aGlzLnVwZGF0ZUhlaWdodCgpOyAvLyBtdXN0IGNvbXBlbnNhdGUgZm9yIGV2ZW50cyB0aGF0IG92ZXJmbG93IHRoZSByb3dcblx0fSxcblxuXG5cdC8vIFJldHJpZXZlcyBhbGwgc2VnbWVudCBvYmplY3RzIHRoYXQgYXJlIHJlbmRlcmVkIGluIHRoZSB2aWV3XG5cdGdldEV2ZW50U2VnczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF5R3JpZC5nZXRFdmVudFNlZ3MoKTtcblx0fSxcblxuXG5cdC8vIFVucmVuZGVycyBhbGwgZXZlbnQgZWxlbWVudHMgYW5kIGNsZWFycyBpbnRlcm5hbCBzZWdtZW50IGRhdGFcblx0ZGVzdHJveUV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5yZWNvcmRTY3JvbGwoKTsgLy8gcmVtb3ZpbmcgZXZlbnRzIHdpbGwgcmVkdWNlIGhlaWdodCBhbmQgbWVzcyB3aXRoIHRoZSBzY3JvbGwsIHNvIHJlY29yZCBiZWZvcmVoYW5kXG5cdFx0dGhpcy5kYXlHcmlkLmRlc3Ryb3lFdmVudHMoKTtcblxuXHRcdC8vIHdlIERPTidUIG5lZWQgdG8gY2FsbCB1cGRhdGVIZWlnaHQoKSBiZWNhdXNlOlxuXHRcdC8vIEEpIGEgcmVuZGVyRXZlbnRzKCkgY2FsbCBhbHdheXMgaGFwcGVucyBhZnRlciB0aGlzLCB3aGljaCB3aWxsIGV2ZW50dWFsbHkgY2FsbCB1cGRhdGVIZWlnaHQoKVxuXHRcdC8vIEIpIGluIElFOCwgdGhpcyBjYXVzZXMgYSBmbGFzaCB3aGVuZXZlciBldmVudHMgYXJlIHJlcmVuZGVyZWRcblx0fSxcblxuXG5cdC8qIERyYWdnaW5nIChmb3IgYm90aCBldmVudHMgYW5kIGV4dGVybmFsIGVsZW1lbnRzKVxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gQSByZXR1cm5lZCB2YWx1ZSBvZiBgdHJ1ZWAgc2lnbmFscyB0aGF0IGEgbW9jayBcImhlbHBlclwiIGV2ZW50IGhhcyBiZWVuIHJlbmRlcmVkLlxuXHRyZW5kZXJEcmFnOiBmdW5jdGlvbihkcm9wTG9jYXRpb24sIHNlZykge1xuXHRcdHJldHVybiB0aGlzLmRheUdyaWQucmVuZGVyRHJhZyhkcm9wTG9jYXRpb24sIHNlZyk7XG5cdH0sXG5cblxuXHRkZXN0cm95RHJhZzogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kYXlHcmlkLmRlc3Ryb3lEcmFnKCk7XG5cdH0sXG5cblxuXHQvKiBTZWxlY3Rpb25cblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXG5cdC8vIFJlbmRlcnMgYSB2aXN1YWwgaW5kaWNhdGlvbiBvZiBhIHNlbGVjdGlvblxuXHRyZW5kZXJTZWxlY3Rpb246IGZ1bmN0aW9uKHJhbmdlKSB7XG5cdFx0dGhpcy5kYXlHcmlkLnJlbmRlclNlbGVjdGlvbihyYW5nZSk7XG5cdH0sXG5cblxuXHQvLyBVbnJlbmRlcnMgYSB2aXN1YWwgaW5kaWNhdGlvbnMgb2YgYSBzZWxlY3Rpb25cblx0ZGVzdHJveVNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kYXlHcmlkLmRlc3Ryb3lTZWxlY3Rpb24oKTtcblx0fVxuXG59KTtcblxuICAgIC8qIEEgbW9udGggdmlldyB3aXRoIGRheSBjZWxscyBydW5uaW5nIGluIHJvd3MgKG9uZS1wZXItd2VlaykgYW5kIGNvbHVtbnNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5zZXREZWZhdWx0cyh7XG5cdGZpeGVkV2Vla0NvdW50OiB0cnVlXG59KTtcblxudmFyIE1vbnRoVmlldyA9IGZjVmlld3MubW9udGggPSBCYXNpY1ZpZXcuZXh0ZW5kKHtcblxuXHQvLyBQcm9kdWNlcyBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IHJhbmdlIHRvIGRpc3BsYXlcblx0Y29tcHV0ZVJhbmdlOiBmdW5jdGlvbihkYXRlKSB7XG5cdFx0dmFyIHJhbmdlID0gQmFzaWNWaWV3LnByb3RvdHlwZS5jb21wdXRlUmFuZ2UuY2FsbCh0aGlzLCBkYXRlKTsgLy8gZ2V0IHZhbHVlIGZyb20gc3VwZXItbWV0aG9kXG5cblx0XHRpZiAodGhpcy5pc0ZpeGVkV2Vla3MoKSkge1xuXHRcdFx0Ly8gZW5zdXJlIDYgd2Vla3Ncblx0XHRcdHJhbmdlLmVuZC5hZGQoXG5cdFx0XHRcdDYgLSByYW5nZS5lbmQuZGlmZihyYW5nZS5zdGFydCwgJ3dlZWtzJyksXG5cdFx0XHRcdCd3ZWVrcydcblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJhbmdlO1xuXHR9LFxuXG5cblx0Ly8gT3ZlcnJpZGVzIHRoZSBkZWZhdWx0IEJhc2ljVmlldyBiZWhhdmlvciB0byBoYXZlIHNwZWNpYWwgbXVsdGktd2VlayBhdXRvLWhlaWdodCBsb2dpY1xuXHRzZXRHcmlkSGVpZ2h0OiBmdW5jdGlvbihoZWlnaHQsIGlzQXV0bykge1xuXG5cdFx0aXNBdXRvID0gaXNBdXRvIHx8IHRoaXMub3B0KCd3ZWVrTW9kZScpID09PSAndmFyaWFibGUnOyAvLyBMRUdBQ1k6IHdlZWtNb2RlIGlzIGRlcHJlY2F0ZWRcblxuXHRcdC8vIGlmIGF1dG8sIG1ha2UgdGhlIGhlaWdodCBvZiBlYWNoIHJvdyB0aGUgaGVpZ2h0IHRoYXQgaXQgd291bGQgYmUgaWYgdGhlcmUgd2VyZSA2IHdlZWtzXG5cdFx0aWYgKGlzQXV0bykge1xuXHRcdFx0aGVpZ2h0ICo9IHRoaXMucm93Q250IC8gNjtcblx0XHR9XG5cblx0XHRkaXN0cmlidXRlSGVpZ2h0KHRoaXMuZGF5R3JpZC5yb3dFbHMsIGhlaWdodCwgIWlzQXV0byk7IC8vIGlmIGF1dG8sIGRvbid0IGNvbXBlbnNhdGUgZm9yIGhlaWdodC1ob2dnaW5nIHJvd3Ncblx0fSxcblxuXG5cdGlzRml4ZWRXZWVrczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHdlZWtNb2RlID0gdGhpcy5vcHQoJ3dlZWtNb2RlJyk7IC8vIExFR0FDWTogd2Vla01vZGUgaXMgZGVwcmVjYXRlZFxuXHRcdGlmICh3ZWVrTW9kZSkge1xuXHRcdFx0cmV0dXJuIHdlZWtNb2RlID09PSAnZml4ZWQnOyAvLyBpZiBhbnkgb3RoZXIgdHlwZSBvZiB3ZWVrTW9kZSwgYXNzdW1lIE5PVCBmaXhlZFxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLm9wdCgnZml4ZWRXZWVrQ291bnQnKTtcblx0fVxuXG59KTtcblxuTW9udGhWaWV3LmR1cmF0aW9uID0geyBtb250aHM6IDEgfTtcblxuICAgIC8qIEEgd2VlayB2aWV3IHdpdGggc2ltcGxlIGRheSBjZWxscyBydW5uaW5nIGhvcml6b250YWxseVxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmZjVmlld3MuYmFzaWNXZWVrID0ge1xuXHR0eXBlOiAnYmFzaWMnLFxuXHRkdXJhdGlvbjogeyB3ZWVrczogMSB9XG59O1xuICAgIC8qIEEgdmlldyB3aXRoIGEgc2luZ2xlIHNpbXBsZSBkYXkgY2VsbFxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbmZjVmlld3MuYmFzaWNEYXkgPSB7XG5cdHR5cGU6ICdiYXNpYycsXG5cdGR1cmF0aW9uOiB7IGRheXM6IDEgfVxufTtcbiAgICAvKiBBbiBhYnN0cmFjdCBjbGFzcyBmb3IgYWxsIGFnZW5kYS1yZWxhdGVkIHZpZXdzLiBEaXNwbGF5cyBvbmUgbW9yZSBjb2x1bW5zIHdpdGggdGltZSBzbG90cyBydW5uaW5nIHZlcnRpY2FsbHkuXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cbi8vIElzIGEgbWFuYWdlciBmb3IgdGhlIFRpbWVHcmlkIHN1YmNvbXBvbmVudCBhbmQgcG9zc2libHkgdGhlIERheUdyaWQgc3ViY29tcG9uZW50IChpZiBhbGxEYXlTbG90IGlzIG9uKS5cbi8vIFJlc3BvbnNpYmxlIGZvciBtYW5hZ2luZyB3aWR0aC9oZWlnaHQuXG5cbnNldERlZmF1bHRzKHtcblx0YWxsRGF5U2xvdDogdHJ1ZSxcblx0YWxsRGF5VGV4dDogJ2FsbC1kYXknLFxuXHRzY3JvbGxUaW1lOiAnMDY6MDA6MDAnLFxuXHRzbG90RHVyYXRpb246ICcwMDozMDowMCcsXG5cdG1pblRpbWU6ICcwMDowMDowMCcsXG5cdG1heFRpbWU6ICcyNDowMDowMCcsXG5cdHNsb3RFdmVudE92ZXJsYXA6IHRydWVcbn0pO1xuXG52YXIgQUdFTkRBX0FMTF9EQVlfRVZFTlRfTElNSVQgPSA1O1xuXG5mY1ZpZXdzLmFnZW5kYSA9IFZpZXcuZXh0ZW5kKHsgLy8gQWdlbmRhVmlld1xuXG5cdHRpbWVHcmlkOiBudWxsLCAvLyB0aGUgbWFpbiB0aW1lLWdyaWQgc3ViY29tcG9uZW50IG9mIHRoaXMgdmlld1xuXHRkYXlHcmlkOiBudWxsLCAvLyB0aGUgXCJhbGwtZGF5XCIgc3ViY29tcG9uZW50LiBpZiBhbGwtZGF5IGlzIHR1cm5lZCBvZmYsIHRoaXMgd2lsbCBiZSBudWxsXG5cblx0YXhpc1dpZHRoOiBudWxsLCAvLyB0aGUgd2lkdGggb2YgdGhlIHRpbWUgYXhpcyBydW5uaW5nIGRvd24gdGhlIHNpZGVcblxuXHRub1Njcm9sbFJvd0VsczogbnVsbCwgLy8gc2V0IG9mIGZha2Ugcm93IGVsZW1lbnRzIHRoYXQgbXVzdCBjb21wZW5zYXRlIHdoZW4gc2Nyb2xsZXJFbCBoYXMgc2Nyb2xsYmFyc1xuXG5cdC8vIHdoZW4gdGhlIHRpbWUtZ3JpZCBpc24ndCB0YWxsIGVub3VnaCB0byBvY2N1cHkgdGhlIGdpdmVuIGhlaWdodCwgd2UgcmVuZGVyIGFuIDxocj4gdW5kZXJuZWF0aFxuXHRib3R0b21SdWxlRWw6IG51bGwsXG5cdGJvdHRvbVJ1bGVIZWlnaHQ6IG51bGwsXG5cblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRpbWVHcmlkID0gbmV3IFRpbWVHcmlkKHRoaXMpO1xuXG5cdFx0aWYgKHRoaXMub3B0KCdhbGxEYXlTbG90JykpIHsgLy8gc2hvdWxkIHdlIGRpc3BsYXkgdGhlIFwiYWxsLWRheVwiIGFyZWE/XG5cdFx0XHR0aGlzLmRheUdyaWQgPSBuZXcgRGF5R3JpZCh0aGlzKTsgLy8gdGhlIGFsbC1kYXkgc3ViY29tcG9uZW50IG9mIHRoaXMgdmlld1xuXG5cdFx0XHQvLyB0aGUgY29vcmRpbmF0ZSBncmlkIHdpbGwgYmUgYSBjb21iaW5hdGlvbiBvZiBib3RoIHN1YmNvbXBvbmVudHMnIGdyaWRzXG5cdFx0XHR0aGlzLmNvb3JkTWFwID0gbmV3IENvbWJvQ29vcmRNYXAoW1xuXHRcdFx0XHR0aGlzLmRheUdyaWQuY29vcmRNYXAsXG5cdFx0XHRcdHRoaXMudGltZUdyaWQuY29vcmRNYXBcblx0XHRcdF0pO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMuY29vcmRNYXAgPSB0aGlzLnRpbWVHcmlkLmNvb3JkTWFwO1xuXHRcdH1cblx0fSxcblxuXG5cdC8qIFJlbmRlcmluZ1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gU2V0cyB0aGUgZGlzcGxheSByYW5nZSBhbmQgY29tcHV0ZXMgYWxsIG5lY2Vzc2FyeSBkYXRlc1xuXHRzZXRSYW5nZTogZnVuY3Rpb24ocmFuZ2UpIHtcblx0XHRWaWV3LnByb3RvdHlwZS5zZXRSYW5nZS5jYWxsKHRoaXMsIHJhbmdlKTsgLy8gY2FsbCB0aGUgc3VwZXItbWV0aG9kXG5cblx0XHR0aGlzLnRpbWVHcmlkLnNldFJhbmdlKHJhbmdlKTtcblx0XHRpZiAodGhpcy5kYXlHcmlkKSB7XG5cdFx0XHR0aGlzLmRheUdyaWQuc2V0UmFuZ2UocmFuZ2UpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIFJlbmRlcnMgdGhlIHZpZXcgaW50byBgdGhpcy5lbGAsIHdoaWNoIGhhcyBhbHJlYWR5IGJlZW4gYXNzaWduZWRcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblxuXHRcdHRoaXMuZWwuYWRkQ2xhc3MoJ2ZjLWFnZW5kYS12aWV3JykuaHRtbCh0aGlzLnJlbmRlckh0bWwoKSk7XG5cblx0XHQvLyB0aGUgZWxlbWVudCB0aGF0IHdyYXBzIHRoZSB0aW1lLWdyaWQgdGhhdCB3aWxsIHByb2JhYmx5IHNjcm9sbFxuXHRcdHRoaXMuc2Nyb2xsZXJFbCA9IHRoaXMuZWwuZmluZCgnLmZjLXRpbWUtZ3JpZC1jb250YWluZXInKTtcblx0XHR0aGlzLnRpbWVHcmlkLmNvb3JkTWFwLmNvbnRhaW5lckVsID0gdGhpcy5zY3JvbGxlckVsOyAvLyBkb24ndCBhY2NlcHQgY2xpY2tzL2V0YyBvdXRzaWRlIG9mIHRoaXNcblxuXHRcdHRoaXMudGltZUdyaWQuZWwgPSB0aGlzLmVsLmZpbmQoJy5mYy10aW1lLWdyaWQnKTtcblx0XHR0aGlzLnRpbWVHcmlkLnJlbmRlcigpO1xuXG5cdFx0Ly8gdGhlIDxocj4gdGhhdCBzb21ldGltZXMgZGlzcGxheXMgdW5kZXIgdGhlIHRpbWUtZ3JpZFxuXHRcdHRoaXMuYm90dG9tUnVsZUVsID0gJCgnPGhyIGNsYXNzPVwiJyArIHRoaXMud2lkZ2V0SGVhZGVyQ2xhc3MgKyAnXCIvPicpXG5cdFx0XHQuYXBwZW5kVG8odGhpcy50aW1lR3JpZC5lbCk7IC8vIGluamVjdCBpdCBpbnRvIHRoZSB0aW1lLWdyaWRcblxuXHRcdGlmICh0aGlzLmRheUdyaWQpIHtcblx0XHRcdHRoaXMuZGF5R3JpZC5lbCA9IHRoaXMuZWwuZmluZCgnLmZjLWRheS1ncmlkJyk7XG5cdFx0XHR0aGlzLmRheUdyaWQucmVuZGVyKCk7XG5cblx0XHRcdC8vIGhhdmUgdGhlIGRheS1ncmlkIGV4dGVuZCBpdCdzIGNvb3JkaW5hdGUgYXJlYSBvdmVyIHRoZSA8aHI+IGRpdmlkaW5nIHRoZSB0d28gZ3JpZHNcblx0XHRcdHRoaXMuZGF5R3JpZC5ib3R0b21Db29yZFBhZGRpbmcgPSB0aGlzLmRheUdyaWQuZWwubmV4dCgnaHInKS5vdXRlckhlaWdodCgpO1xuXHRcdH1cblxuXHRcdHRoaXMubm9TY3JvbGxSb3dFbHMgPSB0aGlzLmVsLmZpbmQoJy5mYy1yb3c6bm90KC5mYy1zY3JvbGxlciAqKScpOyAvLyBmYWtlIHJvd3Mgbm90IHdpdGhpbiB0aGUgc2Nyb2xsZXJcblx0fSxcblxuXG5cdC8vIE1ha2Ugc3ViY29tcG9uZW50cyByZWFkeSBmb3IgY2xlYW51cFxuXHRkZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRpbWVHcmlkLmRlc3Ryb3koKTtcblx0XHRpZiAodGhpcy5kYXlHcmlkKSB7XG5cdFx0XHR0aGlzLmRheUdyaWQuZGVzdHJveSgpO1xuXHRcdH1cblx0XHRWaWV3LnByb3RvdHlwZS5kZXN0cm95LmNhbGwodGhpcyk7IC8vIGNhbGwgdGhlIHN1cGVyLW1ldGhvZFxuXHR9LFxuXG5cblx0Ly8gQnVpbGRzIHRoZSBIVE1MIHNrZWxldG9uIGZvciB0aGUgdmlldy5cblx0Ly8gVGhlIGRheS1ncmlkIGFuZCB0aW1lLWdyaWQgY29tcG9uZW50cyB3aWxsIHJlbmRlciBpbnNpZGUgY29udGFpbmVycyBkZWZpbmVkIGJ5IHRoaXMgSFRNTC5cblx0cmVuZGVySHRtbDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICcnICtcblx0XHRcdCc8dGFibGU+JyArXG5cdFx0XHRcdCc8dGhlYWQ+JyArXG5cdFx0XHRcdFx0Jzx0cj4nICtcblx0XHRcdFx0XHRcdCc8dGQgY2xhc3M9XCInICsgdGhpcy53aWRnZXRIZWFkZXJDbGFzcyArICdcIj4nICtcblx0XHRcdFx0XHRcdFx0dGhpcy50aW1lR3JpZC5oZWFkSHRtbCgpICsgLy8gcmVuZGVyIHRoZSBkYXktb2Ytd2VlayBoZWFkZXJzXG5cdFx0XHRcdFx0XHQnPC90ZD4nICtcblx0XHRcdFx0XHQnPC90cj4nICtcblx0XHRcdFx0JzwvdGhlYWQ+JyArXG5cdFx0XHRcdCc8dGJvZHk+JyArXG5cdFx0XHRcdFx0Jzx0cj4nICtcblx0XHRcdFx0XHRcdCc8dGQgY2xhc3M9XCInICsgdGhpcy53aWRnZXRDb250ZW50Q2xhc3MgKyAnXCI+JyArXG5cdFx0XHRcdFx0XHRcdCh0aGlzLmRheUdyaWQgP1xuXHRcdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiZmMtZGF5LWdyaWRcIi8+JyArXG5cdFx0XHRcdFx0XHRcdFx0JzxociBjbGFzcz1cIicgKyB0aGlzLndpZGdldEhlYWRlckNsYXNzICsgJ1wiLz4nIDpcblx0XHRcdFx0XHRcdFx0XHQnJ1xuXHRcdFx0XHRcdFx0XHRcdCkgK1xuXHRcdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImZjLXRpbWUtZ3JpZC1jb250YWluZXJcIj4nICtcblx0XHRcdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImZjLXRpbWUtZ3JpZFwiLz4nICtcblx0XHRcdFx0XHRcdFx0JzwvZGl2PicgK1xuXHRcdFx0XHRcdFx0JzwvdGQ+JyArXG5cdFx0XHRcdFx0JzwvdHI+JyArXG5cdFx0XHRcdCc8L3Rib2R5PicgK1xuXHRcdFx0JzwvdGFibGU+Jztcblx0fSxcblxuXG5cdC8vIEdlbmVyYXRlcyB0aGUgSFRNTCB0aGF0IHdpbGwgZ28gYmVmb3JlIHRoZSBkYXktb2Ygd2VlayBoZWFkZXIgY2VsbHMuXG5cdC8vIFF1ZXJpZWQgYnkgdGhlIFRpbWVHcmlkIHN1YmNvbXBvbmVudCB3aGVuIGdlbmVyYXRpbmcgcm93cy4gT3JkZXJpbmcgZGVwZW5kcyBvbiBpc1JUTC5cblx0aGVhZEludHJvSHRtbDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRhdGU7XG5cdFx0dmFyIHdlZWtOdW1iZXI7XG5cdFx0dmFyIHdlZWtUaXRsZTtcblx0XHR2YXIgd2Vla1RleHQ7XG5cblx0XHRpZiAodGhpcy5vcHQoJ3dlZWtOdW1iZXJzJykpIHtcblx0XHRcdGRhdGUgPSB0aGlzLnRpbWVHcmlkLmdldENlbGwoMCkuc3RhcnQ7XG5cdFx0XHR3ZWVrTnVtYmVyID0gdGhpcy5jYWxlbmRhci5jYWxjdWxhdGVXZWVrTnVtYmVyKGRhdGUpO1xuXHRcdFx0d2Vla1RpdGxlID0gdGhpcy5vcHQoJ3dlZWtOdW1iZXJUaXRsZScpO1xuXG5cdFx0XHRpZiAodGhpcy5vcHQoJ2lzUlRMJykpIHtcblx0XHRcdFx0d2Vla1RleHQgPSB3ZWVrTnVtYmVyICsgd2Vla1RpdGxlO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHdlZWtUZXh0ID0gd2Vla1RpdGxlICsgd2Vla051bWJlcjtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuICcnICtcblx0XHRcdFx0Jzx0aCBjbGFzcz1cImZjLWF4aXMgZmMtd2Vlay1udW1iZXIgJyArIHRoaXMud2lkZ2V0SGVhZGVyQ2xhc3MgKyAnXCIgJyArIHRoaXMuYXhpc1N0eWxlQXR0cigpICsgJz4nICtcblx0XHRcdFx0XHQnPHNwYW4+JyArIC8vIG5lZWRlZCBmb3IgbWF0Y2hDZWxsV2lkdGhzXG5cdFx0XHRcdFx0XHRodG1sRXNjYXBlKHdlZWtUZXh0KSArXG5cdFx0XHRcdFx0Jzwvc3Bhbj4nICtcblx0XHRcdFx0JzwvdGg+Jztcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gJzx0aCBjbGFzcz1cImZjLWF4aXMgJyArIHRoaXMud2lkZ2V0SGVhZGVyQ2xhc3MgKyAnXCIgJyArIHRoaXMuYXhpc1N0eWxlQXR0cigpICsgJz48L3RoPic7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gR2VuZXJhdGVzIHRoZSBIVE1MIHRoYXQgZ29lcyBiZWZvcmUgdGhlIGFsbC1kYXkgY2VsbHMuXG5cdC8vIFF1ZXJpZWQgYnkgdGhlIERheUdyaWQgc3ViY29tcG9uZW50IHdoZW4gZ2VuZXJhdGluZyByb3dzLiBPcmRlcmluZyBkZXBlbmRzIG9uIGlzUlRMLlxuXHRkYXlJbnRyb0h0bWw6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnJyArXG5cdFx0XHQnPHRkIGNsYXNzPVwiZmMtYXhpcyAnICsgdGhpcy53aWRnZXRDb250ZW50Q2xhc3MgKyAnXCIgJyArIHRoaXMuYXhpc1N0eWxlQXR0cigpICsgJz4nICtcblx0XHRcdFx0JzxzcGFuPicgKyAvLyBuZWVkZWQgZm9yIG1hdGNoQ2VsbFdpZHRoc1xuXHRcdFx0XHRcdCh0aGlzLm9wdCgnYWxsRGF5SHRtbCcpIHx8IGh0bWxFc2NhcGUodGhpcy5vcHQoJ2FsbERheVRleHQnKSkpICtcblx0XHRcdFx0Jzwvc3Bhbj4nICtcblx0XHRcdCc8L3RkPic7XG5cdH0sXG5cblxuXHQvLyBHZW5lcmF0ZXMgdGhlIEhUTUwgdGhhdCBnb2VzIGJlZm9yZSB0aGUgYmcgb2YgdGhlIFRpbWVHcmlkIHNsb3QgYXJlYS4gTG9uZyB2ZXJ0aWNhbCBjb2x1bW4uXG5cdHNsb3RCZ0ludHJvSHRtbDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICc8dGQgY2xhc3M9XCJmYy1heGlzICcgKyB0aGlzLndpZGdldENvbnRlbnRDbGFzcyArICdcIiAnICsgdGhpcy5heGlzU3R5bGVBdHRyKCkgKyAnPjwvdGQ+Jztcblx0fSxcblxuXG5cdC8vIEdlbmVyYXRlcyB0aGUgSFRNTCB0aGF0IGdvZXMgYmVmb3JlIGFsbCBvdGhlciB0eXBlcyBvZiBjZWxscy5cblx0Ly8gQWZmZWN0cyBjb250ZW50LXNrZWxldG9uLCBoZWxwZXItc2tlbGV0b24sIGhpZ2hsaWdodC1za2VsZXRvbiBmb3IgYm90aCB0aGUgdGltZS1ncmlkIGFuZCBkYXktZ3JpZC5cblx0Ly8gUXVlcmllZCBieSB0aGUgVGltZUdyaWQgYW5kIERheUdyaWQgc3ViY29tcG9uZW50cyB3aGVuIGdlbmVyYXRpbmcgcm93cy4gT3JkZXJpbmcgZGVwZW5kcyBvbiBpc1JUTC5cblx0aW50cm9IdG1sOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJzx0ZCBjbGFzcz1cImZjLWF4aXNcIiAnICsgdGhpcy5heGlzU3R5bGVBdHRyKCkgKyAnPjwvdGQ+Jztcblx0fSxcblxuXG5cdC8vIEdlbmVyYXRlcyBhbiBIVE1MIGF0dHJpYnV0ZSBzdHJpbmcgZm9yIHNldHRpbmcgdGhlIHdpZHRoIG9mIHRoZSBheGlzLCBpZiBpdCBpcyBrbm93blxuXHRheGlzU3R5bGVBdHRyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5heGlzV2lkdGggIT09IG51bGwpIHtcblx0XHRcdCByZXR1cm4gJ3N0eWxlPVwid2lkdGg6JyArIHRoaXMuYXhpc1dpZHRoICsgJ3B4XCInO1xuXHRcdH1cblx0XHRyZXR1cm4gJyc7XG5cdH0sXG5cblxuXHQvKiBEaW1lbnNpb25zXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuXHR1cGRhdGVTaXplOiBmdW5jdGlvbihpc1Jlc2l6ZSkge1xuXHRcdGlmIChpc1Jlc2l6ZSkge1xuXHRcdFx0dGhpcy50aW1lR3JpZC5yZXNpemUoKTtcblx0XHR9XG5cdFx0Vmlldy5wcm90b3R5cGUudXBkYXRlU2l6ZS5jYWxsKHRoaXMsIGlzUmVzaXplKTtcblx0fSxcblxuXG5cdC8vIFJlZnJlc2hlcyB0aGUgaG9yaXpvbnRhbCBkaW1lbnNpb25zIG9mIHRoZSB2aWV3XG5cdHVwZGF0ZVdpZHRoOiBmdW5jdGlvbigpIHtcblx0XHQvLyBtYWtlIGFsbCBheGlzIGNlbGxzIGxpbmUgdXAsIGFuZCByZWNvcmQgdGhlIHdpZHRoIHNvIG5ld2x5IGNyZWF0ZWQgYXhpcyBjZWxscyB3aWxsIGhhdmUgaXRcblx0XHR0aGlzLmF4aXNXaWR0aCA9IG1hdGNoQ2VsbFdpZHRocyh0aGlzLmVsLmZpbmQoJy5mYy1heGlzJykpO1xuXHR9LFxuXG5cblx0Ly8gQWRqdXN0cyB0aGUgdmVydGljYWwgZGltZW5zaW9ucyBvZiB0aGUgdmlldyB0byB0aGUgc3BlY2lmaWVkIHZhbHVlc1xuXHRzZXRIZWlnaHQ6IGZ1bmN0aW9uKHRvdGFsSGVpZ2h0LCBpc0F1dG8pIHtcblx0XHR2YXIgZXZlbnRMaW1pdDtcblx0XHR2YXIgc2Nyb2xsZXJIZWlnaHQ7XG5cblx0XHRpZiAodGhpcy5ib3R0b21SdWxlSGVpZ2h0ID09PSBudWxsKSB7XG5cdFx0XHQvLyBjYWxjdWxhdGUgdGhlIGhlaWdodCBvZiB0aGUgcnVsZSB0aGUgdmVyeSBmaXJzdCB0aW1lXG5cdFx0XHR0aGlzLmJvdHRvbVJ1bGVIZWlnaHQgPSB0aGlzLmJvdHRvbVJ1bGVFbC5vdXRlckhlaWdodCgpO1xuXHRcdH1cblx0XHR0aGlzLmJvdHRvbVJ1bGVFbC5oaWRlKCk7IC8vIC5zaG93KCkgd2lsbCBiZSBjYWxsZWQgbGF0ZXIgaWYgdGhpcyA8aHI+IGlzIG5lY2Vzc2FyeVxuXG5cdFx0Ly8gcmVzZXQgYWxsIGRpbWVuc2lvbnMgYmFjayB0byB0aGUgb3JpZ2luYWwgc3RhdGVcblx0XHR0aGlzLnNjcm9sbGVyRWwuY3NzKCdvdmVyZmxvdycsICcnKTtcblx0XHR1bnNldFNjcm9sbGVyKHRoaXMuc2Nyb2xsZXJFbCk7XG5cdFx0dW5jb21wZW5zYXRlU2Nyb2xsKHRoaXMubm9TY3JvbGxSb3dFbHMpO1xuXG5cdFx0Ly8gbGltaXQgbnVtYmVyIG9mIGV2ZW50cyBpbiB0aGUgYWxsLWRheSBhcmVhXG5cdFx0aWYgKHRoaXMuZGF5R3JpZCkge1xuXHRcdFx0dGhpcy5kYXlHcmlkLmRlc3Ryb3lTZWdQb3BvdmVyKCk7IC8vIGtpbGwgdGhlIFwibW9yZVwiIHBvcG92ZXIgaWYgZGlzcGxheWVkXG5cblx0XHRcdGV2ZW50TGltaXQgPSB0aGlzLm9wdCgnZXZlbnRMaW1pdCcpO1xuXHRcdFx0aWYgKGV2ZW50TGltaXQgJiYgdHlwZW9mIGV2ZW50TGltaXQgIT09ICdudW1iZXInKSB7XG5cdFx0XHRcdGV2ZW50TGltaXQgPSBBR0VOREFfQUxMX0RBWV9FVkVOVF9MSU1JVDsgLy8gbWFrZSBzdXJlIFwiYXV0b1wiIGdvZXMgdG8gYSByZWFsIG51bWJlclxuXHRcdFx0fVxuXHRcdFx0aWYgKGV2ZW50TGltaXQpIHtcblx0XHRcdFx0dGhpcy5kYXlHcmlkLmxpbWl0Um93cyhldmVudExpbWl0KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoIWlzQXV0bykgeyAvLyBzaG91bGQgd2UgZm9yY2UgZGltZW5zaW9ucyBvZiB0aGUgc2Nyb2xsIGNvbnRhaW5lciwgb3IgbGV0IHRoZSBjb250ZW50cyBiZSBuYXR1cmFsIGhlaWdodD9cblxuXHRcdFx0c2Nyb2xsZXJIZWlnaHQgPSB0aGlzLmNvbXB1dGVTY3JvbGxlckhlaWdodCh0b3RhbEhlaWdodCk7XG5cdFx0XHRpZiAoc2V0UG90ZW50aWFsU2Nyb2xsZXIodGhpcy5zY3JvbGxlckVsLCBzY3JvbGxlckhlaWdodCkpIHsgLy8gdXNpbmcgc2Nyb2xsYmFycz9cblxuXHRcdFx0XHQvLyBtYWtlIHRoZSBhbGwtZGF5IGFuZCBoZWFkZXIgcm93cyBsaW5lcyB1cFxuXHRcdFx0XHRjb21wZW5zYXRlU2Nyb2xsKHRoaXMubm9TY3JvbGxSb3dFbHMsIGdldFNjcm9sbGJhcldpZHRocyh0aGlzLnNjcm9sbGVyRWwpKTtcblxuXHRcdFx0XHQvLyB0aGUgc2Nyb2xsYmFyIGNvbXBlbnNhdGlvbiBtaWdodCBoYXZlIGNoYW5nZWQgdGV4dCBmbG93LCB3aGljaCBtaWdodCBhZmZlY3QgaGVpZ2h0LCBzbyByZWNhbGN1bGF0ZVxuXHRcdFx0XHQvLyBhbmQgcmVhcHBseSB0aGUgZGVzaXJlZCBoZWlnaHQgdG8gdGhlIHNjcm9sbGVyLlxuXHRcdFx0XHRzY3JvbGxlckhlaWdodCA9IHRoaXMuY29tcHV0ZVNjcm9sbGVySGVpZ2h0KHRvdGFsSGVpZ2h0KTtcblx0XHRcdFx0dGhpcy5zY3JvbGxlckVsLmhlaWdodChzY3JvbGxlckhlaWdodCk7XG5cblx0XHRcdFx0dGhpcy5yZXN0b3JlU2Nyb2xsKCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHsgLy8gbm8gc2Nyb2xsYmFyc1xuXHRcdFx0XHQvLyBzdGlsbCwgZm9yY2UgYSBoZWlnaHQgYW5kIGRpc3BsYXkgdGhlIGJvdHRvbSBydWxlIChtYXJrcyB0aGUgZW5kIG9mIGRheSlcblx0XHRcdFx0dGhpcy5zY3JvbGxlckVsLmhlaWdodChzY3JvbGxlckhlaWdodCkuY3NzKCdvdmVyZmxvdycsICdoaWRkZW4nKTsgLy8gaW4gY2FzZSA8aHI+IGdvZXMgb3V0c2lkZVxuXHRcdFx0XHR0aGlzLmJvdHRvbVJ1bGVFbC5zaG93KCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gU2V0cyB0aGUgc2Nyb2xsIHZhbHVlIG9mIHRoZSBzY3JvbGxlciB0byB0aGUgaW5pdGlhbCBwcmUtY29uZmlndXJlZCBzdGF0ZSBwcmlvciB0byBhbGxvd2luZyB0aGUgdXNlciB0byBjaGFuZ2UgaXRcblx0aW5pdGlhbGl6ZVNjcm9sbDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIF90aGlzID0gdGhpcztcblx0XHR2YXIgc2Nyb2xsVGltZSA9IG1vbWVudC5kdXJhdGlvbih0aGlzLm9wdCgnc2Nyb2xsVGltZScpKTtcblx0XHR2YXIgdG9wID0gdGhpcy50aW1lR3JpZC5jb21wdXRlVGltZVRvcChzY3JvbGxUaW1lKTtcblxuXHRcdC8vIHpvb20gY2FuIGdpdmUgd2VpcmQgZmxvYXRpbmctcG9pbnQgdmFsdWVzLiByYXRoZXIgc2Nyb2xsIGEgbGl0dGxlIGJpdCBmdXJ0aGVyXG5cdFx0dG9wID0gTWF0aC5jZWlsKHRvcCk7XG5cblx0XHRpZiAodG9wKSB7XG5cdFx0XHR0b3ArKzsgLy8gdG8gb3ZlcmNvbWUgdG9wIGJvcmRlciB0aGF0IHNsb3RzIGJleW9uZCB0aGUgZmlyc3QgaGF2ZS4gbG9va3MgYmV0dGVyXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gc2Nyb2xsKCkge1xuXHRcdFx0X3RoaXMuc2Nyb2xsZXJFbC5zY3JvbGxUb3AodG9wKTtcblx0XHR9XG5cblx0XHRzY3JvbGwoKTtcblx0XHRzZXRUaW1lb3V0KHNjcm9sbCwgMCk7IC8vIG92ZXJyaWRlcyBhbnkgcHJldmlvdXMgc2Nyb2xsIHN0YXRlIG1hZGUgYnkgdGhlIGJyb3dzZXJcblx0fSxcblxuXG5cdC8qIEV2ZW50c1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gUmVuZGVycyBldmVudHMgb250byB0aGUgdmlldyBhbmQgcG9wdWxhdGVzIHRoZSBWaWV3J3Mgc2VnbWVudCBhcnJheVxuXHRyZW5kZXJFdmVudHM6IGZ1bmN0aW9uKGV2ZW50cykge1xuXHRcdHZhciBkYXlFdmVudHMgPSBbXTtcblx0XHR2YXIgdGltZWRFdmVudHMgPSBbXTtcblx0XHR2YXIgZGF5U2VncyA9IFtdO1xuXHRcdHZhciB0aW1lZFNlZ3M7XG5cdFx0dmFyIGk7XG5cblx0XHQvLyBzZXBhcmF0ZSB0aGUgZXZlbnRzIGludG8gYWxsLWRheSBhbmQgdGltZWRcblx0XHRmb3IgKGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoZXZlbnRzW2ldLmFsbERheSkge1xuXHRcdFx0XHRkYXlFdmVudHMucHVzaChldmVudHNbaV0pO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHRpbWVkRXZlbnRzLnB1c2goZXZlbnRzW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyByZW5kZXIgdGhlIGV2ZW50cyBpbiB0aGUgc3ViY29tcG9uZW50c1xuXHRcdHRpbWVkU2VncyA9IHRoaXMudGltZUdyaWQucmVuZGVyRXZlbnRzKHRpbWVkRXZlbnRzKTtcblx0XHRpZiAodGhpcy5kYXlHcmlkKSB7XG5cdFx0XHRkYXlTZWdzID0gdGhpcy5kYXlHcmlkLnJlbmRlckV2ZW50cyhkYXlFdmVudHMpO1xuXHRcdH1cblxuXHRcdC8vIHRoZSBhbGwtZGF5IGFyZWEgaXMgZmxleGlibGUgYW5kIG1pZ2h0IGhhdmUgYSBsb3Qgb2YgZXZlbnRzLCBzbyBzaGlmdCB0aGUgaGVpZ2h0XG5cdFx0dGhpcy51cGRhdGVIZWlnaHQoKTtcblx0fSxcblxuXG5cdC8vIFJldHJpZXZlcyBhbGwgc2VnbWVudCBvYmplY3RzIHRoYXQgYXJlIHJlbmRlcmVkIGluIHRoZSB2aWV3XG5cdGdldEV2ZW50U2VnczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMudGltZUdyaWQuZ2V0RXZlbnRTZWdzKCkuY29uY2F0KFxuXHRcdFx0dGhpcy5kYXlHcmlkID8gdGhpcy5kYXlHcmlkLmdldEV2ZW50U2VncygpIDogW11cblx0XHQpO1xuXHR9LFxuXG5cblx0Ly8gVW5yZW5kZXJzIGFsbCBldmVudCBlbGVtZW50cyBhbmQgY2xlYXJzIGludGVybmFsIHNlZ21lbnQgZGF0YVxuXHRkZXN0cm95RXZlbnRzOiBmdW5jdGlvbigpIHtcblxuXHRcdC8vIGlmIGRlc3Ryb3lFdmVudHMgaXMgYmVpbmcgY2FsbGVkIGFzIHBhcnQgb2YgYW4gZXZlbnQgcmVyZW5kZXIsIHJlbmRlckV2ZW50cyB3aWxsIGJlIGNhbGxlZCBzaG9ydGx5XG5cdFx0Ly8gYWZ0ZXIsIHNvIHJlbWVtYmVyIHdoYXQgdGhlIHNjcm9sbCB2YWx1ZSB3YXMgc28gd2UgY2FuIHJlc3RvcmUgaXQuXG5cdFx0dGhpcy5yZWNvcmRTY3JvbGwoKTtcblxuXHRcdC8vIGRlc3Ryb3kgdGhlIGV2ZW50cyBpbiB0aGUgc3ViY29tcG9uZW50c1xuXHRcdHRoaXMudGltZUdyaWQuZGVzdHJveUV2ZW50cygpO1xuXHRcdGlmICh0aGlzLmRheUdyaWQpIHtcblx0XHRcdHRoaXMuZGF5R3JpZC5kZXN0cm95RXZlbnRzKCk7XG5cdFx0fVxuXG5cdFx0Ly8gd2UgRE9OJ1QgbmVlZCB0byBjYWxsIHVwZGF0ZUhlaWdodCgpIGJlY2F1c2U6XG5cdFx0Ly8gQSkgYSByZW5kZXJFdmVudHMoKSBjYWxsIGFsd2F5cyBoYXBwZW5zIGFmdGVyIHRoaXMsIHdoaWNoIHdpbGwgZXZlbnR1YWxseSBjYWxsIHVwZGF0ZUhlaWdodCgpXG5cdFx0Ly8gQikgaW4gSUU4LCB0aGlzIGNhdXNlcyBhIGZsYXNoIHdoZW5ldmVyIGV2ZW50cyBhcmUgcmVyZW5kZXJlZFxuXHR9LFxuXG5cblx0LyogRHJhZ2dpbmcgKGZvciBldmVudHMgYW5kIGV4dGVybmFsIGVsZW1lbnRzKVxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cblx0Ly8gQSByZXR1cm5lZCB2YWx1ZSBvZiBgdHJ1ZWAgc2lnbmFscyB0aGF0IGEgbW9jayBcImhlbHBlclwiIGV2ZW50IGhhcyBiZWVuIHJlbmRlcmVkLlxuXHRyZW5kZXJEcmFnOiBmdW5jdGlvbihkcm9wTG9jYXRpb24sIHNlZykge1xuXHRcdGlmIChkcm9wTG9jYXRpb24uc3RhcnQuaGFzVGltZSgpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy50aW1lR3JpZC5yZW5kZXJEcmFnKGRyb3BMb2NhdGlvbiwgc2VnKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodGhpcy5kYXlHcmlkKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5kYXlHcmlkLnJlbmRlckRyYWcoZHJvcExvY2F0aW9uLCBzZWcpO1xuXHRcdH1cblx0fSxcblxuXG5cdGRlc3Ryb3lEcmFnOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRpbWVHcmlkLmRlc3Ryb3lEcmFnKCk7XG5cdFx0aWYgKHRoaXMuZGF5R3JpZCkge1xuXHRcdFx0dGhpcy5kYXlHcmlkLmRlc3Ryb3lEcmFnKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0LyogU2VsZWN0aW9uXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblxuXHQvLyBSZW5kZXJzIGEgdmlzdWFsIGluZGljYXRpb24gb2YgYSBzZWxlY3Rpb25cblx0cmVuZGVyU2VsZWN0aW9uOiBmdW5jdGlvbihyYW5nZSkge1xuXHRcdGlmIChyYW5nZS5zdGFydC5oYXNUaW1lKCkgfHwgcmFuZ2UuZW5kLmhhc1RpbWUoKSkge1xuXHRcdFx0dGhpcy50aW1lR3JpZC5yZW5kZXJTZWxlY3Rpb24ocmFuZ2UpO1xuXHRcdH1cblx0XHRlbHNlIGlmICh0aGlzLmRheUdyaWQpIHtcblx0XHRcdHRoaXMuZGF5R3JpZC5yZW5kZXJTZWxlY3Rpb24ocmFuZ2UpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8vIFVucmVuZGVycyBhIHZpc3VhbCBpbmRpY2F0aW9ucyBvZiBhIHNlbGVjdGlvblxuXHRkZXN0cm95U2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRpbWVHcmlkLmRlc3Ryb3lTZWxlY3Rpb24oKTtcblx0XHRpZiAodGhpcy5kYXlHcmlkKSB7XG5cdFx0XHR0aGlzLmRheUdyaWQuZGVzdHJveVNlbGVjdGlvbigpO1xuXHRcdH1cblx0fVxuXG59KTtcblxuICAgIC8qIEEgd2VlayB2aWV3IHdpdGggYW4gYWxsLWRheSBjZWxsIGFyZWEgYXQgdGhlIHRvcCwgYW5kIGEgdGltZSBncmlkIGJlbG93XG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZmNWaWV3cy5hZ2VuZGFXZWVrID0ge1xuXHR0eXBlOiAnYWdlbmRhJyxcblx0ZHVyYXRpb246IHsgd2Vla3M6IDEgfVxufTtcbiAgICAvKiBBIGRheSB2aWV3IHdpdGggYW4gYWxsLWRheSBjZWxsIGFyZWEgYXQgdGhlIHRvcCwgYW5kIGEgdGltZSBncmlkIGJlbG93XG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuZmNWaWV3cy5hZ2VuZGFEYXkgPSB7XG5cdHR5cGU6ICdhZ2VuZGEnLFxuXHRkdXJhdGlvbjogeyBkYXlzOiAxIH1cbn07XG59KTsiXX0=

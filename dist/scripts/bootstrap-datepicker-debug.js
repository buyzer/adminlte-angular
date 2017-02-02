/* =========================================================
 * bootstrap-datepicker.js
 * Repo: https://github.com/eternicode/bootstrap-datepicker/
 * Demo: http://eternicode.github.io/bootstrap-datepicker/
 * Docs: http://bootstrap-datepicker.readthedocs.org/
 * Forked from http://www.eyecon.ro/bootstrap-datepicker
 * =========================================================
 * Started by Stefan Petre; improvements by Andrew Rowls + contributors
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

(function($, undefined){

	var $window = $(window);

	function UTCDate(){
		return new Date(Date.UTC.apply(Date, arguments));
	}
	function UTCToday(){
		var today = new Date();
		return UTCDate(today.getFullYear(), today.getMonth(), today.getDate());
	}
	function alias(method){
		return function(){
			return this[method].apply(this, arguments);
		};
	}

	var DateArray = (function(){
		var extras = {
			get: function(i){
				return this.slice(i)[0];
			},
			contains: function(d){
				// Array.indexOf is not cross-browser;
				// $.inArray doesn't work with Dates
				var val = d && d.valueOf();
				for (var i=0, l=this.length; i < l; i++)
					if (this[i].valueOf() === val)
						return i;
				return -1;
			},
			remove: function(i){
				this.splice(i,1);
			},
			replace: function(new_array){
				if (!new_array)
					return;
				if (!$.isArray(new_array))
					new_array = [new_array];
				this.clear();
				this.push.apply(this, new_array);
			},
			clear: function(){
				this.splice(0);
			},
			copy: function(){
				var a = new DateArray();
				a.replace(this);
				return a;
			}
		};

		return function(){
			var a = [];
			a.push.apply(a, arguments);
			$.extend(a, extras);
			return a;
		};
	})();


	// Picker object

	var Datepicker = function(element, options){
		this.dates = new DateArray();
		this.viewDate = UTCToday();
		this.focusDate = null;

		this._process_options(options);

		this.element = $(element);
		this.isInline = false;
		this.isInput = this.element.is('input');
		this.component = this.element.is('.date') ? this.element.find('.add-on, .input-group-addon, .btn') : false;
		this.hasInput = this.component && this.element.find('input').length;
		if (this.component && this.component.length === 0)
			this.component = false;

		this.picker = $(DPGlobal.template);
		this._buildEvents();
		this._attachEvents();

		if (this.isInline){
			this.picker.addClass('datepicker-inline').appendTo(this.element);
		}
		else {
			this.picker.addClass('datepicker-dropdown dropdown-menu');
		}

		if (this.o.rtl){
			this.picker.addClass('datepicker-rtl');
		}

		this.viewMode = this.o.startView;

		if (this.o.calendarWeeks)
			this.picker.find('tfoot th.today')
						.attr('colspan', function(i, val){
							return parseInt(val) + 1;
						});

		this._allow_update = false;

		this.setStartDate(this._o.startDate);
		this.setEndDate(this._o.endDate);
		this.setDaysOfWeekDisabled(this.o.daysOfWeekDisabled);

		this.fillDow();
		this.fillMonths();

		this._allow_update = true;

		this.update();
		this.showMode();

		if (this.isInline){
			this.show();
		}
	};

	Datepicker.prototype = {
		constructor: Datepicker,

		_process_options: function(opts){
			// Store raw options for reference
			this._o = $.extend({}, this._o, opts);
			// Processed options
			var o = this.o = $.extend({}, this._o);

			// Check if "de-DE" style date is available, if not language should
			// fallback to 2 letter code eg "de"
			var lang = o.language;
			if (!dates[lang]){
				lang = lang.split('-')[0];
				if (!dates[lang])
					lang = defaults.language;
			}
			o.language = lang;

			switch (o.startView){
				case 2:
				case 'decade':
					o.startView = 2;
					break;
				case 1:
				case 'year':
					o.startView = 1;
					break;
				default:
					o.startView = 0;
			}

			switch (o.minViewMode){
				case 1:
				case 'months':
					o.minViewMode = 1;
					break;
				case 2:
				case 'years':
					o.minViewMode = 2;
					break;
				default:
					o.minViewMode = 0;
			}

			o.startView = Math.max(o.startView, o.minViewMode);

			// true, false, or Number > 0
			if (o.multidate !== true){
				o.multidate = Number(o.multidate) || false;
				if (o.multidate !== false)
					o.multidate = Math.max(0, o.multidate);
				else
					o.multidate = 1;
			}
			o.multidateSeparator = String(o.multidateSeparator);

			o.weekStart %= 7;
			o.weekEnd = ((o.weekStart + 6) % 7);

			var format = DPGlobal.parseFormat(o.format);
			if (o.startDate !== -Infinity){
				if (!!o.startDate){
					if (o.startDate instanceof Date)
						o.startDate = this._local_to_utc(this._zero_time(o.startDate));
					else
						o.startDate = DPGlobal.parseDate(o.startDate, format, o.language);
				}
				else {
					o.startDate = -Infinity;
				}
			}
			if (o.endDate !== Infinity){
				if (!!o.endDate){
					if (o.endDate instanceof Date)
						o.endDate = this._local_to_utc(this._zero_time(o.endDate));
					else
						o.endDate = DPGlobal.parseDate(o.endDate, format, o.language);
				}
				else {
					o.endDate = Infinity;
				}
			}

			o.daysOfWeekDisabled = o.daysOfWeekDisabled||[];
			if (!$.isArray(o.daysOfWeekDisabled))
				o.daysOfWeekDisabled = o.daysOfWeekDisabled.split(/[,\s]*/);
			o.daysOfWeekDisabled = $.map(o.daysOfWeekDisabled, function(d){
				return parseInt(d, 10);
			});

			var plc = String(o.orientation).toLowerCase().split(/\s+/g),
				_plc = o.orientation.toLowerCase();
			plc = $.grep(plc, function(word){
				return (/^auto|left|right|top|bottom$/).test(word);
			});
			o.orientation = {x: 'auto', y: 'auto'};
			if (!_plc || _plc === 'auto')
				; // no action
			else if (plc.length === 1){
				switch (plc[0]){
					case 'top':
					case 'bottom':
						o.orientation.y = plc[0];
						break;
					case 'left':
					case 'right':
						o.orientation.x = plc[0];
						break;
				}
			}
			else {
				_plc = $.grep(plc, function(word){
					return (/^left|right$/).test(word);
				});
				o.orientation.x = _plc[0] || 'auto';

				_plc = $.grep(plc, function(word){
					return (/^top|bottom$/).test(word);
				});
				o.orientation.y = _plc[0] || 'auto';
			}
		},
		_events: [],
		_secondaryEvents: [],
		_applyEvents: function(evs){
			for (var i=0, el, ch, ev; i < evs.length; i++){
				el = evs[i][0];
				if (evs[i].length === 2){
					ch = undefined;
					ev = evs[i][1];
				}
				else if (evs[i].length === 3){
					ch = evs[i][1];
					ev = evs[i][2];
				}
				el.on(ev, ch);
			}
		},
		_unapplyEvents: function(evs){
			for (var i=0, el, ev, ch; i < evs.length; i++){
				el = evs[i][0];
				if (evs[i].length === 2){
					ch = undefined;
					ev = evs[i][1];
				}
				else if (evs[i].length === 3){
					ch = evs[i][1];
					ev = evs[i][2];
				}
				el.off(ev, ch);
			}
		},
		_buildEvents: function(){
			if (this.isInput){ // single input
				this._events = [
					[this.element, {
						focus: $.proxy(this.show, this),
						keyup: $.proxy(function(e){
							if ($.inArray(e.keyCode, [27,37,39,38,40,32,13,9]) === -1)
								this.update();
						}, this),
						keydown: $.proxy(this.keydown, this)
					}]
				];
			}
			else if (this.component && this.hasInput){ // component: input + button
				this._events = [
					// For components that are not readonly, allow keyboard nav
					[this.element.find('input'), {
						focus: $.proxy(this.show, this),
						keyup: $.proxy(function(e){
							if ($.inArray(e.keyCode, [27,37,39,38,40,32,13,9]) === -1)
								this.update();
						}, this),
						keydown: $.proxy(this.keydown, this)
					}],
					[this.component, {
						click: $.proxy(this.show, this)
					}]
				];
			}
			else if (this.element.is('div')){  // inline datepicker
				this.isInline = true;
			}
			else {
				this._events = [
					[this.element, {
						click: $.proxy(this.show, this)
					}]
				];
			}
			this._events.push(
				// Component: listen for blur on element descendants
				[this.element, '*', {
					blur: $.proxy(function(e){
						this._focused_from = e.target;
					}, this)
				}],
				// Input: listen for blur on element
				[this.element, {
					blur: $.proxy(function(e){
						this._focused_from = e.target;
					}, this)
				}]
			);

			this._secondaryEvents = [
				[this.picker, {
					click: $.proxy(this.click, this)
				}],
				[$(window), {
					resize: $.proxy(this.place, this)
				}],
				[$(document), {
					'mousedown touchstart': $.proxy(function(e){
						// Clicked outside the datepicker, hide it
						if (!(
							this.element.is(e.target) ||
							this.element.find(e.target).length ||
							this.picker.is(e.target) ||
							this.picker.find(e.target).length
						)){
							this.hide();
						}
					}, this)
				}]
			];
		},
		_attachEvents: function(){
			this._detachEvents();
			this._applyEvents(this._events);
		},
		_detachEvents: function(){
			this._unapplyEvents(this._events);
		},
		_attachSecondaryEvents: function(){
			this._detachSecondaryEvents();
			this._applyEvents(this._secondaryEvents);
		},
		_detachSecondaryEvents: function(){
			this._unapplyEvents(this._secondaryEvents);
		},
		_trigger: function(event, altdate){
			var date = altdate || this.dates.get(-1),
				local_date = this._utc_to_local(date);

			this.element.trigger({
				type: event,
				date: local_date,
				dates: $.map(this.dates, this._utc_to_local),
				format: $.proxy(function(ix, format){
					if (arguments.length === 0){
						ix = this.dates.length - 1;
						format = this.o.format;
					}
					else if (typeof ix === 'string'){
						format = ix;
						ix = this.dates.length - 1;
					}
					format = format || this.o.format;
					var date = this.dates.get(ix);
					return DPGlobal.formatDate(date, format, this.o.language);
				}, this)
			});
		},

		show: function(){
			if (!this.isInline)
				this.picker.appendTo('body');
			this.picker.show();
			this.place();
			this._attachSecondaryEvents();
			this._trigger('show');
		},

		hide: function(){
			if (this.isInline)
				return;
			if (!this.picker.is(':visible'))
				return;
			this.focusDate = null;
			this.picker.hide().detach();
			this._detachSecondaryEvents();
			this.viewMode = this.o.startView;
			this.showMode();

			if (
				this.o.forceParse &&
				(
					this.isInput && this.element.val() ||
					this.hasInput && this.element.find('input').val()
				)
			)
				this.setValue();
			this._trigger('hide');
		},

		remove: function(){
			this.hide();
			this._detachEvents();
			this._detachSecondaryEvents();
			this.picker.remove();
			delete this.element.data().datepicker;
			if (!this.isInput){
				delete this.element.data().date;
			}
		},

		_utc_to_local: function(utc){
			return utc && new Date(utc.getTime() + (utc.getTimezoneOffset()*60000));
		},
		_local_to_utc: function(local){
			return local && new Date(local.getTime() - (local.getTimezoneOffset()*60000));
		},
		_zero_time: function(local){
			return local && new Date(local.getFullYear(), local.getMonth(), local.getDate());
		},
		_zero_utc_time: function(utc){
			return utc && new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate()));
		},

		getDates: function(){
			return $.map(this.dates, this._utc_to_local);
		},

		getUTCDates: function(){
			return $.map(this.dates, function(d){
				return new Date(d);
			});
		},

		getDate: function(){
			return this._utc_to_local(this.getUTCDate());
		},

		getUTCDate: function(){
			return new Date(this.dates.get(-1));
		},

		setDates: function(){
			var args = $.isArray(arguments[0]) ? arguments[0] : arguments;
			this.update.apply(this, args);
			this._trigger('changeDate');
			this.setValue();
		},

		setUTCDates: function(){
			var args = $.isArray(arguments[0]) ? arguments[0] : arguments;
			this.update.apply(this, $.map(args, this._utc_to_local));
			this._trigger('changeDate');
			this.setValue();
		},

		setDate: alias('setDates'),
		setUTCDate: alias('setUTCDates'),

		setValue: function(){
			var formatted = this.getFormattedDate();
			if (!this.isInput){
				if (this.component){
					this.element.find('input').val(formatted).change();
				}
			}
			else {
				this.element.val(formatted).change();
			}
		},

		getFormattedDate: function(format){
			if (format === undefined)
				format = this.o.format;

			var lang = this.o.language;
			return $.map(this.dates, function(d){
				return DPGlobal.formatDate(d, format, lang);
			}).join(this.o.multidateSeparator);
		},

		setStartDate: function(startDate){
			this._process_options({startDate: startDate});
			this.update();
			this.updateNavArrows();
		},

		setEndDate: function(endDate){
			this._process_options({endDate: endDate});
			this.update();
			this.updateNavArrows();
		},

		setDaysOfWeekDisabled: function(daysOfWeekDisabled){
			this._process_options({daysOfWeekDisabled: daysOfWeekDisabled});
			this.update();
			this.updateNavArrows();
		},

		place: function(){
			if (this.isInline)
				return;
			var calendarWidth = this.picker.outerWidth(),
				calendarHeight = this.picker.outerHeight(),
				visualPadding = 10,
				windowWidth = $window.width(),
				windowHeight = $window.height(),
				scrollTop = $window.scrollTop();

			var zIndex = parseInt(this.element.parents().filter(function(){
					return $(this).css('z-index') !== 'auto';
				}).first().css('z-index'))+10;
			var offset = this.component ? this.component.parent().offset() : this.element.offset();
			var height = this.component ? this.component.outerHeight(true) : this.element.outerHeight(false);
			var width = this.component ? this.component.outerWidth(true) : this.element.outerWidth(false);
			var left = offset.left,
				top = offset.top;

			this.picker.removeClass(
				'datepicker-orient-top datepicker-orient-bottom '+
				'datepicker-orient-right datepicker-orient-left'
			);

			if (this.o.orientation.x !== 'auto'){
				this.picker.addClass('datepicker-orient-' + this.o.orientation.x);
				if (this.o.orientation.x === 'right')
					left -= calendarWidth - width;
			}
			// auto x orientation is best-placement: if it crosses a window
			// edge, fudge it sideways
			else {
				// Default to left
				this.picker.addClass('datepicker-orient-left');
				if (offset.left < 0)
					left -= offset.left - visualPadding;
				else if (offset.left + calendarWidth > windowWidth)
					left = windowWidth - calendarWidth - visualPadding;
			}

			// auto y orientation is best-situation: top or bottom, no fudging,
			// decision based on which shows more of the calendar
			var yorient = this.o.orientation.y,
				top_overflow, bottom_overflow;
			if (yorient === 'auto'){
				top_overflow = -scrollTop + offset.top - calendarHeight;
				bottom_overflow = scrollTop + windowHeight - (offset.top + height + calendarHeight);
				if (Math.max(top_overflow, bottom_overflow) === bottom_overflow)
					yorient = 'top';
				else
					yorient = 'bottom';
			}
			this.picker.addClass('datepicker-orient-' + yorient);
			if (yorient === 'top')
				top += height;
			else
				top -= calendarHeight + parseInt(this.picker.css('padding-top'));

			this.picker.css({
				top: top,
				left: left,
				zIndex: zIndex
			});
		},

		_allow_update: true,
		update: function(){
			if (!this._allow_update)
				return;

			var oldDates = this.dates.copy(),
				dates = [],
				fromArgs = false;
			if (arguments.length){
				$.each(arguments, $.proxy(function(i, date){
					if (date instanceof Date)
						date = this._local_to_utc(date);
					dates.push(date);
				}, this));
				fromArgs = true;
			}
			else {
				dates = this.isInput
						? this.element.val()
						: this.element.data('date') || this.element.find('input').val();
				if (dates && this.o.multidate)
					dates = dates.split(this.o.multidateSeparator);
				else
					dates = [dates];
				delete this.element.data().date;
			}

			dates = $.map(dates, $.proxy(function(date){
				return DPGlobal.parseDate(date, this.o.format, this.o.language);
			}, this));
			dates = $.grep(dates, $.proxy(function(date){
				return (
					date < this.o.startDate ||
					date > this.o.endDate ||
					!date
				);
			}, this), true);
			this.dates.replace(dates);

			if (this.dates.length)
				this.viewDate = new Date(this.dates.get(-1));
			else if (this.viewDate < this.o.startDate)
				this.viewDate = new Date(this.o.startDate);
			else if (this.viewDate > this.o.endDate)
				this.viewDate = new Date(this.o.endDate);

			if (fromArgs){
				// setting date by clicking
				this.setValue();
			}
			else if (dates.length){
				// setting date by typing
				if (String(oldDates) !== String(this.dates))
					this._trigger('changeDate');
			}
			if (!this.dates.length && oldDates.length)
				this._trigger('clearDate');

			this.fill();
		},

		fillDow: function(){
			var dowCnt = this.o.weekStart,
				html = '<tr>';
			if (this.o.calendarWeeks){
				var cell = '<th class="cw">&nbsp;</th>';
				html += cell;
				this.picker.find('.datepicker-days thead tr:first-child').prepend(cell);
			}
			while (dowCnt < this.o.weekStart + 7){
				html += '<th class="dow">'+dates[this.o.language].daysMin[(dowCnt++)%7]+'</th>';
			}
			html += '</tr>';
			this.picker.find('.datepicker-days thead').append(html);
		},

		fillMonths: function(){
			var html = '',
			i = 0;
			while (i < 12){
				html += '<span class="month">'+dates[this.o.language].monthsShort[i++]+'</span>';
			}
			this.picker.find('.datepicker-months td').html(html);
		},

		setRange: function(range){
			if (!range || !range.length)
				delete this.range;
			else
				this.range = $.map(range, function(d){
					return d.valueOf();
				});
			this.fill();
		},

		getClassNames: function(date){
			var cls = [],
				year = this.viewDate.getUTCFullYear(),
				month = this.viewDate.getUTCMonth(),
				today = new Date();
			if (date.getUTCFullYear() < year || (date.getUTCFullYear() === year && date.getUTCMonth() < month)){
				cls.push('old');
			}
			else if (date.getUTCFullYear() > year || (date.getUTCFullYear() === year && date.getUTCMonth() > month)){
				cls.push('new');
			}
			if (this.focusDate && date.valueOf() === this.focusDate.valueOf())
				cls.push('focused');
			// Compare internal UTC date with local today, not UTC today
			if (this.o.todayHighlight &&
				date.getUTCFullYear() === today.getFullYear() &&
				date.getUTCMonth() === today.getMonth() &&
				date.getUTCDate() === today.getDate()){
				cls.push('today');
			}
			if (this.dates.contains(date) !== -1)
				cls.push('active');
			if (date.valueOf() < this.o.startDate || date.valueOf() > this.o.endDate ||
				$.inArray(date.getUTCDay(), this.o.daysOfWeekDisabled) !== -1){
				cls.push('disabled');
			}
			if (this.range){
				if (date > this.range[0] && date < this.range[this.range.length-1]){
					cls.push('range');
				}
				if ($.inArray(date.valueOf(), this.range) !== -1){
					cls.push('selected');
				}
			}
			return cls;
		},

		fill: function(){
			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth(),
				startYear = this.o.startDate !== -Infinity ? this.o.startDate.getUTCFullYear() : -Infinity,
				startMonth = this.o.startDate !== -Infinity ? this.o.startDate.getUTCMonth() : -Infinity,
				endYear = this.o.endDate !== Infinity ? this.o.endDate.getUTCFullYear() : Infinity,
				endMonth = this.o.endDate !== Infinity ? this.o.endDate.getUTCMonth() : Infinity,
				todaytxt = dates[this.o.language].today || dates['en'].today || '',
				cleartxt = dates[this.o.language].clear || dates['en'].clear || '',
				tooltip;
			this.picker.find('.datepicker-days thead th.datepicker-switch')
						.text(dates[this.o.language].months[month]+' '+year);
			this.picker.find('tfoot th.today')
						.text(todaytxt)
						.toggle(this.o.todayBtn !== false);
			this.picker.find('tfoot th.clear')
						.text(cleartxt)
						.toggle(this.o.clearBtn !== false);
			this.updateNavArrows();
			this.fillMonths();
			var prevMonth = UTCDate(year, month-1, 28),
				day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
			prevMonth.setUTCDate(day);
			prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.o.weekStart + 7)%7);
			var nextMonth = new Date(prevMonth);
			nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
			nextMonth = nextMonth.valueOf();
			var html = [];
			var clsName;
			while (prevMonth.valueOf() < nextMonth){
				if (prevMonth.getUTCDay() === this.o.weekStart){
					html.push('<tr>');
					if (this.o.calendarWeeks){
						// ISO 8601: First week contains first thursday.
						// ISO also states week starts on Monday, but we can be more abstract here.
						var
							// Start of current week: based on weekstart/current date
							ws = new Date(+prevMonth + (this.o.weekStart - prevMonth.getUTCDay() - 7) % 7 * 864e5),
							// Thursday of this week
							th = new Date(Number(ws) + (7 + 4 - ws.getUTCDay()) % 7 * 864e5),
							// First Thursday of year, year from thursday
							yth = new Date(Number(yth = UTCDate(th.getUTCFullYear(), 0, 1)) + (7 + 4 - yth.getUTCDay())%7*864e5),
							// Calendar week: ms between thursdays, div ms per day, div 7 days
							calWeek =  (th - yth) / 864e5 / 7 + 1;
						html.push('<td class="cw">'+ calWeek +'</td>');

					}
				}
				clsName = this.getClassNames(prevMonth);
				clsName.push('day');

				if (this.o.beforeShowDay !== $.noop){
					var before = this.o.beforeShowDay(this._utc_to_local(prevMonth));
					if (before === undefined)
						before = {};
					else if (typeof(before) === 'boolean')
						before = {enabled: before};
					else if (typeof(before) === 'string')
						before = {classes: before};
					if (before.enabled === false)
						clsName.push('disabled');
					if (before.classes)
						clsName = clsName.concat(before.classes.split(/\s+/));
					if (before.tooltip)
						tooltip = before.tooltip;
				}

				clsName = $.unique(clsName);
				html.push('<td class="'+clsName.join(' ')+'"' + (tooltip ? ' title="'+tooltip+'"' : '') + '>'+prevMonth.getUTCDate() + '</td>');
				if (prevMonth.getUTCDay() === this.o.weekEnd){
					html.push('</tr>');
				}
				prevMonth.setUTCDate(prevMonth.getUTCDate()+1);
			}
			this.picker.find('.datepicker-days tbody').empty().append(html.join(''));

			var months = this.picker.find('.datepicker-months')
						.find('th:eq(1)')
							.text(year)
							.end()
						.find('span').removeClass('active');

			$.each(this.dates, function(i, d){
				if (d.getUTCFullYear() === year)
					months.eq(d.getUTCMonth()).addClass('active');
			});

			if (year < startYear || year > endYear){
				months.addClass('disabled');
			}
			if (year === startYear){
				months.slice(0, startMonth).addClass('disabled');
			}
			if (year === endYear){
				months.slice(endMonth+1).addClass('disabled');
			}

			html = '';
			year = parseInt(year/10, 10) * 10;
			var yearCont = this.picker.find('.datepicker-years')
								.find('th:eq(1)')
									.text(year + '-' + (year + 9))
									.end()
								.find('td');
			year -= 1;
			var years = $.map(this.dates, function(d){
					return d.getUTCFullYear();
				}),
				classes;
			for (var i = -1; i < 11; i++){
				classes = ['year'];
				if (i === -1)
					classes.push('old');
				else if (i === 10)
					classes.push('new');
				if ($.inArray(year, years) !== -1)
					classes.push('active');
				if (year < startYear || year > endYear)
					classes.push('disabled');
				html += '<span class="' + classes.join(' ') + '">'+year+'</span>';
				year += 1;
			}
			yearCont.html(html);
		},

		updateNavArrows: function(){
			if (!this._allow_update)
				return;

			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth();
			switch (this.viewMode){
				case 0:
					if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear() && month <= this.o.startDate.getUTCMonth()){
						this.picker.find('.prev').css({visibility: 'hidden'});
					}
					else {
						this.picker.find('.prev').css({visibility: 'visible'});
					}
					if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear() && month >= this.o.endDate.getUTCMonth()){
						this.picker.find('.next').css({visibility: 'hidden'});
					}
					else {
						this.picker.find('.next').css({visibility: 'visible'});
					}
					break;
				case 1:
				case 2:
					if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear()){
						this.picker.find('.prev').css({visibility: 'hidden'});
					}
					else {
						this.picker.find('.prev').css({visibility: 'visible'});
					}
					if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear()){
						this.picker.find('.next').css({visibility: 'hidden'});
					}
					else {
						this.picker.find('.next').css({visibility: 'visible'});
					}
					break;
			}
		},

		click: function(e){
			e.preventDefault();
			var target = $(e.target).closest('span, td, th'),
				year, month, day;
			if (target.length === 1){
				switch (target[0].nodeName.toLowerCase()){
					case 'th':
						switch (target[0].className){
							case 'datepicker-switch':
								this.showMode(1);
								break;
							case 'prev':
							case 'next':
								var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className === 'prev' ? -1 : 1);
								switch (this.viewMode){
									case 0:
										this.viewDate = this.moveMonth(this.viewDate, dir);
										this._trigger('changeMonth', this.viewDate);
										break;
									case 1:
									case 2:
										this.viewDate = this.moveYear(this.viewDate, dir);
										if (this.viewMode === 1)
											this._trigger('changeYear', this.viewDate);
										break;
								}
								this.fill();
								break;
							case 'today':
								var date = new Date();
								date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

								this.showMode(-2);
								var which = this.o.todayBtn === 'linked' ? null : 'view';
								this._setDate(date, which);
								break;
							case 'clear':
								var element;
								if (this.isInput)
									element = this.element;
								else if (this.component)
									element = this.element.find('input');
								if (element)
									element.val("").change();
								this.update();
								this._trigger('changeDate');
								if (this.o.autoclose)
									this.hide();
								break;
						}
						break;
					case 'span':
						if (!target.is('.disabled')){
							this.viewDate.setUTCDate(1);
							if (target.is('.month')){
								day = 1;
								month = target.parent().find('span').index(target);
								year = this.viewDate.getUTCFullYear();
								this.viewDate.setUTCMonth(month);
								this._trigger('changeMonth', this.viewDate);
								if (this.o.minViewMode === 1){
									this._setDate(UTCDate(year, month, day));
								}
							}
							else {
								day = 1;
								month = 0;
								year = parseInt(target.text(), 10)||0;
								this.viewDate.setUTCFullYear(year);
								this._trigger('changeYear', this.viewDate);
								if (this.o.minViewMode === 2){
									this._setDate(UTCDate(year, month, day));
								}
							}
							this.showMode(-1);
							this.fill();
						}
						break;
					case 'td':
						if (target.is('.day') && !target.is('.disabled')){
							day = parseInt(target.text(), 10)||1;
							year = this.viewDate.getUTCFullYear();
							month = this.viewDate.getUTCMonth();
							if (target.is('.old')){
								if (month === 0){
									month = 11;
									year -= 1;
								}
								else {
									month -= 1;
								}
							}
							else if (target.is('.new')){
								if (month === 11){
									month = 0;
									year += 1;
								}
								else {
									month += 1;
								}
							}
							this._setDate(UTCDate(year, month, day));
						}
						break;
				}
			}
			if (this.picker.is(':visible') && this._focused_from){
				$(this._focused_from).focus();
			}
			delete this._focused_from;
		},

		_toggle_multidate: function(date){
			var ix = this.dates.contains(date);
			if (!date){
				this.dates.clear();
			}
			else if (ix !== -1){
				this.dates.remove(ix);
			}
			else {
				this.dates.push(date);
			}
			if (typeof this.o.multidate === 'number')
				while (this.dates.length > this.o.multidate)
					this.dates.remove(0);
		},

		_setDate: function(date, which){
			if (!which || which === 'date')
				this._toggle_multidate(date && new Date(date));
			if (!which || which  === 'view')
				this.viewDate = date && new Date(date);

			this.fill();
			this.setValue();
			this._trigger('changeDate');
			var element;
			if (this.isInput){
				element = this.element;
			}
			else if (this.component){
				element = this.element.find('input');
			}
			if (element){
				element.change();
			}
			if (this.o.autoclose && (!which || which === 'date')){
				this.hide();
			}
		},

		moveMonth: function(date, dir){
			if (!date)
				return undefined;
			if (!dir)
				return date;
			var new_date = new Date(date.valueOf()),
				day = new_date.getUTCDate(),
				month = new_date.getUTCMonth(),
				mag = Math.abs(dir),
				new_month, test;
			dir = dir > 0 ? 1 : -1;
			if (mag === 1){
				test = dir === -1
					// If going back one month, make sure month is not current month
					// (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
					? function(){
						return new_date.getUTCMonth() === month;
					}
					// If going forward one month, make sure month is as expected
					// (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
					: function(){
						return new_date.getUTCMonth() !== new_month;
					};
				new_month = month + dir;
				new_date.setUTCMonth(new_month);
				// Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
				if (new_month < 0 || new_month > 11)
					new_month = (new_month + 12) % 12;
			}
			else {
				// For magnitudes >1, move one month at a time...
				for (var i=0; i < mag; i++)
					// ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
					new_date = this.moveMonth(new_date, dir);
				// ...then reset the day, keeping it in the new month
				new_month = new_date.getUTCMonth();
				new_date.setUTCDate(day);
				test = function(){
					return new_month !== new_date.getUTCMonth();
				};
			}
			// Common date-resetting loop -- if date is beyond end of month, make it
			// end of month
			while (test()){
				new_date.setUTCDate(--day);
				new_date.setUTCMonth(new_month);
			}
			return new_date;
		},

		moveYear: function(date, dir){
			return this.moveMonth(date, dir*12);
		},

		dateWithinRange: function(date){
			return date >= this.o.startDate && date <= this.o.endDate;
		},

		keydown: function(e){
			if (this.picker.is(':not(:visible)')){
				if (e.keyCode === 27) // allow escape to hide and re-show picker
					this.show();
				return;
			}
			var dateChanged = false,
				dir, newDate, newViewDate,
				focusDate = this.focusDate || this.viewDate;
			switch (e.keyCode){
				case 27: // escape
					if (this.focusDate){
						this.focusDate = null;
						this.viewDate = this.dates.get(-1) || this.viewDate;
						this.fill();
					}
					else
						this.hide();
					e.preventDefault();
					break;
				case 37: // left
				case 39: // right
					if (!this.o.keyboardNavigation)
						break;
					dir = e.keyCode === 37 ? -1 : 1;
					if (e.ctrlKey){
						newDate = this.moveYear(this.dates.get(-1) || UTCToday(), dir);
						newViewDate = this.moveYear(focusDate, dir);
						this._trigger('changeYear', this.viewDate);
					}
					else if (e.shiftKey){
						newDate = this.moveMonth(this.dates.get(-1) || UTCToday(), dir);
						newViewDate = this.moveMonth(focusDate, dir);
						this._trigger('changeMonth', this.viewDate);
					}
					else {
						newDate = new Date(this.dates.get(-1) || UTCToday());
						newDate.setUTCDate(newDate.getUTCDate() + dir);
						newViewDate = new Date(focusDate);
						newViewDate.setUTCDate(focusDate.getUTCDate() + dir);
					}
					if (this.dateWithinRange(newDate)){
						this.focusDate = this.viewDate = newViewDate;
						this.setValue();
						this.fill();
						e.preventDefault();
					}
					break;
				case 38: // up
				case 40: // down
					if (!this.o.keyboardNavigation)
						break;
					dir = e.keyCode === 38 ? -1 : 1;
					if (e.ctrlKey){
						newDate = this.moveYear(this.dates.get(-1) || UTCToday(), dir);
						newViewDate = this.moveYear(focusDate, dir);
						this._trigger('changeYear', this.viewDate);
					}
					else if (e.shiftKey){
						newDate = this.moveMonth(this.dates.get(-1) || UTCToday(), dir);
						newViewDate = this.moveMonth(focusDate, dir);
						this._trigger('changeMonth', this.viewDate);
					}
					else {
						newDate = new Date(this.dates.get(-1) || UTCToday());
						newDate.setUTCDate(newDate.getUTCDate() + dir * 7);
						newViewDate = new Date(focusDate);
						newViewDate.setUTCDate(focusDate.getUTCDate() + dir * 7);
					}
					if (this.dateWithinRange(newDate)){
						this.focusDate = this.viewDate = newViewDate;
						this.setValue();
						this.fill();
						e.preventDefault();
					}
					break;
				case 32: // spacebar
					// Spacebar is used in manually typing dates in some formats.
					// As such, its behavior should not be hijacked.
					break;
				case 13: // enter
					focusDate = this.focusDate || this.dates.get(-1) || this.viewDate;
					this._toggle_multidate(focusDate);
					dateChanged = true;
					this.focusDate = null;
					this.viewDate = this.dates.get(-1) || this.viewDate;
					this.setValue();
					this.fill();
					if (this.picker.is(':visible')){
						e.preventDefault();
						if (this.o.autoclose)
							this.hide();
					}
					break;
				case 9: // tab
					this.focusDate = null;
					this.viewDate = this.dates.get(-1) || this.viewDate;
					this.fill();
					this.hide();
					break;
			}
			if (dateChanged){
				if (this.dates.length)
					this._trigger('changeDate');
				else
					this._trigger('clearDate');
				var element;
				if (this.isInput){
					element = this.element;
				}
				else if (this.component){
					element = this.element.find('input');
				}
				if (element){
					element.change();
				}
			}
		},

		showMode: function(dir){
			if (dir){
				this.viewMode = Math.max(this.o.minViewMode, Math.min(2, this.viewMode + dir));
			}
			this.picker
				.find('>div')
				.hide()
				.filter('.datepicker-'+DPGlobal.modes[this.viewMode].clsName)
					.css('display', 'block');
			this.updateNavArrows();
		}
	};

	var DateRangePicker = function(element, options){
		this.element = $(element);
		this.inputs = $.map(options.inputs, function(i){
			return i.jquery ? i[0] : i;
		});
		delete options.inputs;

		$(this.inputs)
			.datepicker(options)
			.bind('changeDate', $.proxy(this.dateUpdated, this));

		this.pickers = $.map(this.inputs, function(i){
			return $(i).data('datepicker');
		});
		this.updateDates();
	};
	DateRangePicker.prototype = {
		updateDates: function(){
			this.dates = $.map(this.pickers, function(i){
				return i.getUTCDate();
			});
			this.updateRanges();
		},
		updateRanges: function(){
			var range = $.map(this.dates, function(d){
				return d.valueOf();
			});
			$.each(this.pickers, function(i, p){
				p.setRange(range);
			});
		},
		dateUpdated: function(e){
			// `this.updating` is a workaround for preventing infinite recursion
			// between `changeDate` triggering and `setUTCDate` calling.  Until
			// there is a better mechanism.
			if (this.updating)
				return;
			this.updating = true;

			var dp = $(e.target).data('datepicker'),
				new_date = dp.getUTCDate(),
				i = $.inArray(e.target, this.inputs),
				l = this.inputs.length;
			if (i === -1)
				return;

			$.each(this.pickers, function(i, p){
				if (!p.getUTCDate())
					p.setUTCDate(new_date);
			});

			if (new_date < this.dates[i]){
				// Date being moved earlier/left
				while (i >= 0 && new_date < this.dates[i]){
					this.pickers[i--].setUTCDate(new_date);
				}
			}
			else if (new_date > this.dates[i]){
				// Date being moved later/right
				while (i < l && new_date > this.dates[i]){
					this.pickers[i++].setUTCDate(new_date);
				}
			}
			this.updateDates();

			delete this.updating;
		},
		remove: function(){
			$.map(this.pickers, function(p){ p.remove(); });
			delete this.element.data().datepicker;
		}
	};

	function opts_from_el(el, prefix){
		// Derive options from element data-attrs
		var data = $(el).data(),
			out = {}, inkey,
			replace = new RegExp('^' + prefix.toLowerCase() + '([A-Z])');
		prefix = new RegExp('^' + prefix.toLowerCase());
		function re_lower(_,a){
			return a.toLowerCase();
		}
		for (var key in data)
			if (prefix.test(key)){
				inkey = key.replace(replace, re_lower);
				out[inkey] = data[key];
			}
		return out;
	}

	function opts_from_locale(lang){
		// Derive options from locale plugins
		var out = {};
		// Check if "de-DE" style date is available, if not language should
		// fallback to 2 letter code eg "de"
		if (!dates[lang]){
			lang = lang.split('-')[0];
			if (!dates[lang])
				return;
		}
		var d = dates[lang];
		$.each(locale_opts, function(i,k){
			if (k in d)
				out[k] = d[k];
		});
		return out;
	}

	var old = $.fn.datepicker;
	$.fn.datepicker = function(option){
		var args = Array.apply(null, arguments);
		args.shift();
		var internal_return;
		this.each(function(){
			var $this = $(this),
				data = $this.data('datepicker'),
				options = typeof option === 'object' && option;
			if (!data){
				var elopts = opts_from_el(this, 'date'),
					// Preliminary otions
					xopts = $.extend({}, defaults, elopts, options),
					locopts = opts_from_locale(xopts.language),
					// Options priority: js args, data-attrs, locales, defaults
					opts = $.extend({}, defaults, locopts, elopts, options);
				if ($this.is('.input-daterange') || opts.inputs){
					var ropts = {
						inputs: opts.inputs || $this.find('input').toArray()
					};
					$this.data('datepicker', (data = new DateRangePicker(this, $.extend(opts, ropts))));
				}
				else {
					$this.data('datepicker', (data = new Datepicker(this, opts)));
				}
			}
			if (typeof option === 'string' && typeof data[option] === 'function'){
				internal_return = data[option].apply(data, args);
				if (internal_return !== undefined)
					return false;
			}
		});
		if (internal_return !== undefined)
			return internal_return;
		else
			return this;
	};

	var defaults = $.fn.datepicker.defaults = {
		autoclose: false,
		beforeShowDay: $.noop,
		calendarWeeks: false,
		clearBtn: false,
		daysOfWeekDisabled: [],
		endDate: Infinity,
		forceParse: true,
		format: 'mm/dd/yyyy',
		keyboardNavigation: true,
		language: 'en',
		minViewMode: 0,
		multidate: false,
		multidateSeparator: ',',
		orientation: "auto",
		rtl: false,
		startDate: -Infinity,
		startView: 0,
		todayBtn: false,
		todayHighlight: false,
		weekStart: 0
	};
	var locale_opts = $.fn.datepicker.locale_opts = [
		'format',
		'rtl',
		'weekStart'
	];
	$.fn.datepicker.Constructor = Datepicker;
	var dates = $.fn.datepicker.dates = {
		en: {
			days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
			months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			today: "Today",
			clear: "Clear"
		}
	};

	var DPGlobal = {
		modes: [
			{
				clsName: 'days',
				navFnc: 'Month',
				navStep: 1
			},
			{
				clsName: 'months',
				navFnc: 'FullYear',
				navStep: 1
			},
			{
				clsName: 'years',
				navFnc: 'FullYear',
				navStep: 10
		}],
		isLeapYear: function(year){
			return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
		},
		getDaysInMonth: function(year, month){
			return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
		},
		validParts: /dd?|DD?|mm?|MM?|yy(?:yy)?/g,
		nonpunctuation: /[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,
		parseFormat: function(format){
			// IE treats \0 as a string end in inputs (truncating the value),
			// so it's a bad format delimiter, anyway
			var separators = format.replace(this.validParts, '\0').split('\0'),
				parts = format.match(this.validParts);
			if (!separators || !separators.length || !parts || parts.length === 0){
				throw new Error("Invalid date format.");
			}
			return {separators: separators, parts: parts};
		},
		parseDate: function(date, format, language){
			if (!date)
				return undefined;
			if (date instanceof Date)
				return date;
			if (typeof format === 'string')
				format = DPGlobal.parseFormat(format);
			var part_re = /([\-+]\d+)([dmwy])/,
				parts = date.match(/([\-+]\d+)([dmwy])/g),
				part, dir, i;
			if (/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(date)){
				date = new Date();
				for (i=0; i < parts.length; i++){
					part = part_re.exec(parts[i]);
					dir = parseInt(part[1]);
					switch (part[2]){
						case 'd':
							date.setUTCDate(date.getUTCDate() + dir);
							break;
						case 'm':
							date = Datepicker.prototype.moveMonth.call(Datepicker.prototype, date, dir);
							break;
						case 'w':
							date.setUTCDate(date.getUTCDate() + dir * 7);
							break;
						case 'y':
							date = Datepicker.prototype.moveYear.call(Datepicker.prototype, date, dir);
							break;
					}
				}
				return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
			}
			parts = date && date.match(this.nonpunctuation) || [];
			date = new Date();
			var parsed = {},
				setters_order = ['yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'd', 'dd'],
				setters_map = {
					yyyy: function(d,v){
						return d.setUTCFullYear(v);
					},
					yy: function(d,v){
						return d.setUTCFullYear(2000+v);
					},
					m: function(d,v){
						if (isNaN(d))
							return d;
						v -= 1;
						while (v < 0) v += 12;
						v %= 12;
						d.setUTCMonth(v);
						while (d.getUTCMonth() !== v)
							d.setUTCDate(d.getUTCDate()-1);
						return d;
					},
					d: function(d,v){
						return d.setUTCDate(v);
					}
				},
				val, filtered;
			setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
			setters_map['dd'] = setters_map['d'];
			date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
			var fparts = format.parts.slice();
			// Remove noop parts
			if (parts.length !== fparts.length){
				fparts = $(fparts).filter(function(i,p){
					return $.inArray(p, setters_order) !== -1;
				}).toArray();
			}
			// Process remainder
			function match_part(){
				var m = this.slice(0, parts[i].length),
					p = parts[i].slice(0, m.length);
				return m === p;
			}
			if (parts.length === fparts.length){
				var cnt;
				for (i=0, cnt = fparts.length; i < cnt; i++){
					val = parseInt(parts[i], 10);
					part = fparts[i];
					if (isNaN(val)){
						switch (part){
							case 'MM':
								filtered = $(dates[language].months).filter(match_part);
								val = $.inArray(filtered[0], dates[language].months) + 1;
								break;
							case 'M':
								filtered = $(dates[language].monthsShort).filter(match_part);
								val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
								break;
						}
					}
					parsed[part] = val;
				}
				var _date, s;
				for (i=0; i < setters_order.length; i++){
					s = setters_order[i];
					if (s in parsed && !isNaN(parsed[s])){
						_date = new Date(date);
						setters_map[s](_date, parsed[s]);
						if (!isNaN(_date))
							date = _date;
					}
				}
			}
			return date;
		},
		formatDate: function(date, format, language){
			if (!date)
				return '';
			if (typeof format === 'string')
				format = DPGlobal.parseFormat(format);
			var val = {
				d: date.getUTCDate(),
				D: dates[language].daysShort[date.getUTCDay()],
				DD: dates[language].days[date.getUTCDay()],
				m: date.getUTCMonth() + 1,
				M: dates[language].monthsShort[date.getUTCMonth()],
				MM: dates[language].months[date.getUTCMonth()],
				yy: date.getUTCFullYear().toString().substring(2),
				yyyy: date.getUTCFullYear()
			};
			val.dd = (val.d < 10 ? '0' : '') + val.d;
			val.mm = (val.m < 10 ? '0' : '') + val.m;
			date = [];
			var seps = $.extend([], format.separators);
			for (var i=0, cnt = format.parts.length; i <= cnt; i++){
				if (seps.length)
					date.push(seps.shift());
				date.push(val[format.parts[i]]);
			}
			return date.join('');
		},
		headTemplate: '<thead>'+
							'<tr>'+
								'<th class="prev">&laquo;</th>'+
								'<th colspan="5" class="datepicker-switch"></th>'+
								'<th class="next">&raquo;</th>'+
							'</tr>'+
						'</thead>',
		contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
		footTemplate: '<tfoot>'+
							'<tr>'+
								'<th colspan="7" class="today"></th>'+
							'</tr>'+
							'<tr>'+
								'<th colspan="7" class="clear"></th>'+
							'</tr>'+
						'</tfoot>'
	};
	DPGlobal.template = '<div class="datepicker">'+
							'<div class="datepicker-days">'+
								'<table class="table table-condensed">'+
									DPGlobal.headTemplate+
									'<tbody></tbody>'+
									DPGlobal.footTemplate+
								'</table>'+
							'</div>'+
							'<div class="datepicker-months">'+
								'<table class="table table-condensed">'+
									DPGlobal.headTemplate+
									DPGlobal.contTemplate+
									DPGlobal.footTemplate+
								'</table>'+
							'</div>'+
							'<div class="datepicker-years">'+
								'<table class="table table-condensed">'+
									DPGlobal.headTemplate+
									DPGlobal.contTemplate+
									DPGlobal.footTemplate+
								'</table>'+
							'</div>'+
						'</div>';

	$.fn.datepicker.DPGlobal = DPGlobal;


	/* DATEPICKER NO CONFLICT
	* =================== */

	$.fn.datepicker.noConflict = function(){
		$.fn.datepicker = old;
		return this;
	};


	/* DATEPICKER DATA-API
	* ================== */

	$(document).on(
		'focus.datepicker.data-api click.datepicker.data-api',
		'[data-provide="datepicker"]',
		function(e){
			var $this = $(this);
			if ($this.data('datepicker'))
				return;
			e.preventDefault();
			// component click requires us to explicitly show it
			$this.datepicker('show');
		}
	);
	$(function(){
		$('[data-provide="datepicker-inline"]').datepicker();
	});

}(window.jQuery));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJvb3RzdHJhcC1kYXRlcGlja2VyLmpzIl0sIm5hbWVzIjpbIiQiLCJ1bmRlZmluZWQiLCJVVENEYXRlIiwiRGF0ZSIsIlVUQyIsImFwcGx5IiwiYXJndW1lbnRzIiwiVVRDVG9kYXkiLCJ0b2RheSIsImdldEZ1bGxZZWFyIiwiZ2V0TW9udGgiLCJnZXREYXRlIiwiYWxpYXMiLCJtZXRob2QiLCJ0aGlzIiwib3B0c19mcm9tX2VsIiwiZWwiLCJwcmVmaXgiLCJyZV9sb3dlciIsIl8iLCJhIiwidG9Mb3dlckNhc2UiLCJpbmtleSIsImRhdGEiLCJvdXQiLCJyZXBsYWNlIiwiUmVnRXhwIiwia2V5IiwidGVzdCIsIm9wdHNfZnJvbV9sb2NhbGUiLCJsYW5nIiwiZGF0ZXMiLCJzcGxpdCIsImQiLCJlYWNoIiwibG9jYWxlX29wdHMiLCJpIiwiayIsIiR3aW5kb3ciLCJ3aW5kb3ciLCJEYXRlQXJyYXkiLCJleHRyYXMiLCJnZXQiLCJzbGljZSIsImNvbnRhaW5zIiwidmFsIiwidmFsdWVPZiIsImwiLCJsZW5ndGgiLCJyZW1vdmUiLCJzcGxpY2UiLCJuZXdfYXJyYXkiLCJpc0FycmF5IiwiY2xlYXIiLCJwdXNoIiwiY29weSIsImV4dGVuZCIsIkRhdGVwaWNrZXIiLCJlbGVtZW50Iiwib3B0aW9ucyIsInZpZXdEYXRlIiwiZm9jdXNEYXRlIiwiX3Byb2Nlc3Nfb3B0aW9ucyIsImlzSW5saW5lIiwiaXNJbnB1dCIsImlzIiwiY29tcG9uZW50IiwiZmluZCIsImhhc0lucHV0IiwicGlja2VyIiwiRFBHbG9iYWwiLCJ0ZW1wbGF0ZSIsIl9idWlsZEV2ZW50cyIsIl9hdHRhY2hFdmVudHMiLCJhZGRDbGFzcyIsImFwcGVuZFRvIiwibyIsInJ0bCIsInZpZXdNb2RlIiwic3RhcnRWaWV3IiwiY2FsZW5kYXJXZWVrcyIsImF0dHIiLCJwYXJzZUludCIsIl9hbGxvd191cGRhdGUiLCJzZXRTdGFydERhdGUiLCJfbyIsInN0YXJ0RGF0ZSIsInNldEVuZERhdGUiLCJlbmREYXRlIiwic2V0RGF5c09mV2Vla0Rpc2FibGVkIiwiZGF5c09mV2Vla0Rpc2FibGVkIiwiZmlsbERvdyIsImZpbGxNb250aHMiLCJ1cGRhdGUiLCJzaG93TW9kZSIsInNob3ciLCJwcm90b3R5cGUiLCJjb25zdHJ1Y3RvciIsIm9wdHMiLCJsYW5ndWFnZSIsImRlZmF1bHRzIiwibWluVmlld01vZGUiLCJNYXRoIiwibWF4IiwibXVsdGlkYXRlIiwiTnVtYmVyIiwibXVsdGlkYXRlU2VwYXJhdG9yIiwiU3RyaW5nIiwid2Vla1N0YXJ0Iiwid2Vla0VuZCIsImZvcm1hdCIsInBhcnNlRm9ybWF0IiwiSW5maW5pdHkiLCJfbG9jYWxfdG9fdXRjIiwiX3plcm9fdGltZSIsInBhcnNlRGF0ZSIsIm1hcCIsInBsYyIsIm9yaWVudGF0aW9uIiwiX3BsYyIsImdyZXAiLCJ3b3JkIiwieCIsInkiLCJfZXZlbnRzIiwiX3NlY29uZGFyeUV2ZW50cyIsIl9hcHBseUV2ZW50cyIsImV2cyIsImNoIiwiZXYiLCJvbiIsIl91bmFwcGx5RXZlbnRzIiwib2ZmIiwiZm9jdXMiLCJwcm94eSIsImtleXVwIiwiZSIsImluQXJyYXkiLCJrZXlDb2RlIiwia2V5ZG93biIsImNsaWNrIiwiYmx1ciIsIl9mb2N1c2VkX2Zyb20iLCJ0YXJnZXQiLCJyZXNpemUiLCJwbGFjZSIsImRvY3VtZW50IiwibW91c2Vkb3duIHRvdWNoc3RhcnQiLCJoaWRlIiwiX2RldGFjaEV2ZW50cyIsIl9hdHRhY2hTZWNvbmRhcnlFdmVudHMiLCJfZGV0YWNoU2Vjb25kYXJ5RXZlbnRzIiwiX3RyaWdnZXIiLCJldmVudCIsImFsdGRhdGUiLCJkYXRlIiwibG9jYWxfZGF0ZSIsIl91dGNfdG9fbG9jYWwiLCJ0cmlnZ2VyIiwidHlwZSIsIml4IiwiZm9ybWF0RGF0ZSIsImRldGFjaCIsImZvcmNlUGFyc2UiLCJzZXRWYWx1ZSIsImRhdGVwaWNrZXIiLCJ1dGMiLCJnZXRUaW1lIiwiZ2V0VGltZXpvbmVPZmZzZXQiLCJsb2NhbCIsIl96ZXJvX3V0Y190aW1lIiwiZ2V0VVRDRnVsbFllYXIiLCJnZXRVVENNb250aCIsImdldFVUQ0RhdGUiLCJnZXREYXRlcyIsImdldFVUQ0RhdGVzIiwic2V0RGF0ZXMiLCJhcmdzIiwic2V0VVRDRGF0ZXMiLCJzZXREYXRlIiwic2V0VVRDRGF0ZSIsImZvcm1hdHRlZCIsImdldEZvcm1hdHRlZERhdGUiLCJjaGFuZ2UiLCJqb2luIiwidXBkYXRlTmF2QXJyb3dzIiwiY2FsZW5kYXJXaWR0aCIsIm91dGVyV2lkdGgiLCJjYWxlbmRhckhlaWdodCIsIm91dGVySGVpZ2h0IiwidmlzdWFsUGFkZGluZyIsIndpbmRvd1dpZHRoIiwid2lkdGgiLCJ3aW5kb3dIZWlnaHQiLCJoZWlnaHQiLCJzY3JvbGxUb3AiLCJ6SW5kZXgiLCJwYXJlbnRzIiwiZmlsdGVyIiwiY3NzIiwiZmlyc3QiLCJvZmZzZXQiLCJwYXJlbnQiLCJsZWZ0IiwidG9wIiwicmVtb3ZlQ2xhc3MiLCJ0b3Bfb3ZlcmZsb3ciLCJib3R0b21fb3ZlcmZsb3ciLCJ5b3JpZW50Iiwib2xkRGF0ZXMiLCJmcm9tQXJncyIsImZpbGwiLCJkb3dDbnQiLCJodG1sIiwiY2VsbCIsInByZXBlbmQiLCJkYXlzTWluIiwiYXBwZW5kIiwibW9udGhzU2hvcnQiLCJzZXRSYW5nZSIsInJhbmdlIiwiZ2V0Q2xhc3NOYW1lcyIsImNscyIsInllYXIiLCJtb250aCIsInRvZGF5SGlnaGxpZ2h0IiwiZ2V0VVRDRGF5IiwidG9vbHRpcCIsInN0YXJ0WWVhciIsInN0YXJ0TW9udGgiLCJlbmRZZWFyIiwiZW5kTW9udGgiLCJ0b2RheXR4dCIsImNsZWFydHh0IiwidGV4dCIsIm1vbnRocyIsInRvZ2dsZSIsInRvZGF5QnRuIiwiY2xlYXJCdG4iLCJwcmV2TW9udGgiLCJkYXkiLCJnZXREYXlzSW5Nb250aCIsIm5leHRNb250aCIsImNsc05hbWUiLCJ3cyIsInRoIiwieXRoIiwiY2FsV2VlayIsImJlZm9yZVNob3dEYXkiLCJub29wIiwiYmVmb3JlIiwiZW5hYmxlZCIsImNsYXNzZXMiLCJjb25jYXQiLCJ1bmlxdWUiLCJlbXB0eSIsImVuZCIsImVxIiwieWVhckNvbnQiLCJ5ZWFycyIsInZpc2liaWxpdHkiLCJwcmV2ZW50RGVmYXVsdCIsImNsb3Nlc3QiLCJub2RlTmFtZSIsImNsYXNzTmFtZSIsImRpciIsIm1vZGVzIiwibmF2U3RlcCIsIm1vdmVNb250aCIsIm1vdmVZZWFyIiwid2hpY2giLCJfc2V0RGF0ZSIsImF1dG9jbG9zZSIsImluZGV4Iiwic2V0VVRDTW9udGgiLCJzZXRVVENGdWxsWWVhciIsIl90b2dnbGVfbXVsdGlkYXRlIiwibmV3X21vbnRoIiwibmV3X2RhdGUiLCJtYWciLCJhYnMiLCJkYXRlV2l0aGluUmFuZ2UiLCJuZXdEYXRlIiwibmV3Vmlld0RhdGUiLCJkYXRlQ2hhbmdlZCIsImtleWJvYXJkTmF2aWdhdGlvbiIsImN0cmxLZXkiLCJzaGlmdEtleSIsIm1pbiIsIkRhdGVSYW5nZVBpY2tlciIsImlucHV0cyIsImpxdWVyeSIsImJpbmQiLCJkYXRlVXBkYXRlZCIsInBpY2tlcnMiLCJ1cGRhdGVEYXRlcyIsInVwZGF0ZVJhbmdlcyIsInAiLCJ1cGRhdGluZyIsImRwIiwib2xkIiwiZm4iLCJvcHRpb24iLCJBcnJheSIsInNoaWZ0IiwiaW50ZXJuYWxfcmV0dXJuIiwiJHRoaXMiLCJlbG9wdHMiLCJ4b3B0cyIsImxvY29wdHMiLCJyb3B0cyIsInRvQXJyYXkiLCJDb25zdHJ1Y3RvciIsImVuIiwiZGF5cyIsImRheXNTaG9ydCIsIm5hdkZuYyIsImlzTGVhcFllYXIiLCJ2YWxpZFBhcnRzIiwibm9ucHVuY3R1YXRpb24iLCJzZXBhcmF0b3JzIiwicGFydHMiLCJtYXRjaCIsIkVycm9yIiwibWF0Y2hfcGFydCIsIm0iLCJwYXJ0IiwicGFydF9yZSIsImV4ZWMiLCJjYWxsIiwiZmlsdGVyZWQiLCJwYXJzZWQiLCJzZXR0ZXJzX29yZGVyIiwic2V0dGVyc19tYXAiLCJ5eXl5IiwidiIsInl5IiwiaXNOYU4iLCJmcGFydHMiLCJjbnQiLCJfZGF0ZSIsInMiLCJEIiwiREQiLCJNIiwiTU0iLCJ0b1N0cmluZyIsInN1YnN0cmluZyIsImRkIiwibW0iLCJzZXBzIiwiaGVhZFRlbXBsYXRlIiwiY29udFRlbXBsYXRlIiwiZm9vdFRlbXBsYXRlIiwibm9Db25mbGljdCIsImpRdWVyeSJdLCJtYXBwaW5ncyI6IkNBc0JDLFNBQVNBLEVBQUdDLEdBSVosUUFBU0MsS0FDUixNQUFPLElBQUlDLE1BQUtBLEtBQUtDLElBQUlDLE1BQU1GLEtBQU1HLFlBRXRDLFFBQVNDLEtBQ1IsR0FBSUMsR0FBUSxHQUFJTCxLQUNoQixPQUFPRCxHQUFRTSxFQUFNQyxjQUFlRCxFQUFNRSxXQUFZRixFQUFNRyxXQUU3RCxRQUFTQyxHQUFNQyxHQUNkLE1BQU8sWUFDTixNQUFPQyxNQUFLRCxHQUFRUixNQUFNUyxLQUFNUixZQWt3Q2xDLFFBQVNTLEdBQWFDLEVBQUlDLEdBTXpCLFFBQVNDLEdBQVNDLEVBQUVDLEdBQ25CLE1BQU9BLEdBQUVDLGNBTFYsR0FDV0MsR0FEUEMsRUFBT3ZCLEVBQUVnQixHQUFJTyxPQUNoQkMsS0FDQUMsRUFBVSxHQUFJQyxRQUFPLElBQU1ULEVBQU9JLGNBQWdCLFVBQ25ESixHQUFTLEdBQUlTLFFBQU8sSUFBTVQsRUFBT0ksY0FJakMsS0FBSyxHQUFJTSxLQUFPSixHQUNYTixFQUFPVyxLQUFLRCxLQUNmTCxFQUFRSyxFQUFJRixRQUFRQSxFQUFTUCxHQUM3Qk0sRUFBSUYsR0FBU0MsRUFBS0ksR0FFcEIsT0FBT0gsR0FHUixRQUFTSyxHQUFpQkMsR0FFekIsR0FBSU4sS0FHSixJQUFLTyxFQUFNRCxLQUNWQSxFQUFPQSxFQUFLRSxNQUFNLEtBQUssR0FDbEJELEVBQU1ELElBRlosQ0FLQSxHQUFJRyxHQUFJRixFQUFNRCxFQUtkLE9BSkE5QixHQUFFa0MsS0FBS0MsRUFBYSxTQUFTQyxFQUFFQyxHQUMxQkEsSUFBS0osS0FDUlQsRUFBSWEsR0FBS0osRUFBRUksTUFFTmIsR0E3eUNSLEdBQUljLEdBQVV0QyxFQUFFdUMsUUFlWkMsRUFBWSxXQUNmLEdBQUlDLElBQ0hDLElB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RyxLQUFLd1MsRUFBSzlDLFNBQ2hCckosRUFBS3JHLEtBQUtULEVBQUlpRSxFQUFPbU4sTUFBTTdSLElBRTVCLE9BQU91SCxHQUFLNkIsS0FBSyxLQUVsQnVLLGFBQWMsb0lBT2RDLGFBQWMsZ0RBQ2RDLGFBQWMsMEdBU2YzUixHQUFTQyxTQUFXLDZGQUdaRCxFQUFTeVIsYUFDVCxrQkFDQXpSLEVBQVMyUixhQUNWLHFGQUlDM1IsRUFBU3lSLGFBQ1R6UixFQUFTMFIsYUFDVDFSLEVBQVMyUixhQUNWLG9GQUlDM1IsRUFBU3lSLGFBQ1R6UixFQUFTMFIsYUFDVDFSLEVBQVMyUixhQUNWLHVCQUlQalcsRUFBRTZTLEdBQUd4SSxXQUFXL0YsU0FBV0EsRUFNM0J0RSxFQUFFNlMsR0FBR3hJLFdBQVc2TCxXQUFhLFdBRTVCLE1BREFsVyxHQUFFNlMsR0FBR3hJLFdBQWF1SSxFQUNYOVIsTUFPUmQsRUFBRWtKLFVBQVVoQixHQUNYLHNEQUNBLDhCQUNBLFNBQVNNLEdBQ1IsR0FBSTBLLEdBQVFsVCxFQUFFYyxLQUNWb1MsR0FBTTNSLEtBQUssZ0JBRWZpSCxFQUFFNkgsaUJBRUY2QyxFQUFNN0ksV0FBVyxXQUduQnJLLEVBQUUsV0FDREEsRUFBRSxzQ0FBc0NxSyxnQkFHeEM5SCxPQUFPNFQiLCJmaWxlIjoiYm9vdHN0cmFwLWRhdGVwaWNrZXItZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIGJvb3RzdHJhcC1kYXRlcGlja2VyLmpzXG4gKiBSZXBvOiBodHRwczovL2dpdGh1Yi5jb20vZXRlcm5pY29kZS9ib290c3RyYXAtZGF0ZXBpY2tlci9cbiAqIERlbW86IGh0dHA6Ly9ldGVybmljb2RlLmdpdGh1Yi5pby9ib290c3RyYXAtZGF0ZXBpY2tlci9cbiAqIERvY3M6IGh0dHA6Ly9ib290c3RyYXAtZGF0ZXBpY2tlci5yZWFkdGhlZG9jcy5vcmcvXG4gKiBGb3JrZWQgZnJvbSBodHRwOi8vd3d3LmV5ZWNvbi5yby9ib290c3RyYXAtZGF0ZXBpY2tlclxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBTdGFydGVkIGJ5IFN0ZWZhbiBQZXRyZTsgaW1wcm92ZW1lbnRzIGJ5IEFuZHJldyBSb3dscyArIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cbihmdW5jdGlvbigkLCB1bmRlZmluZWQpe1xuXG5cdHZhciAkd2luZG93ID0gJCh3aW5kb3cpO1xuXG5cdGZ1bmN0aW9uIFVUQ0RhdGUoKXtcblx0XHRyZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMuYXBwbHkoRGF0ZSwgYXJndW1lbnRzKSk7XG5cdH1cblx0ZnVuY3Rpb24gVVRDVG9kYXkoKXtcblx0XHR2YXIgdG9kYXkgPSBuZXcgRGF0ZSgpO1xuXHRcdHJldHVybiBVVENEYXRlKHRvZGF5LmdldEZ1bGxZZWFyKCksIHRvZGF5LmdldE1vbnRoKCksIHRvZGF5LmdldERhdGUoKSk7XG5cdH1cblx0ZnVuY3Rpb24gYWxpYXMobWV0aG9kKXtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiB0aGlzW21ldGhvZF0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHR9O1xuXHR9XG5cblx0dmFyIERhdGVBcnJheSA9IChmdW5jdGlvbigpe1xuXHRcdHZhciBleHRyYXMgPSB7XG5cdFx0XHRnZXQ6IGZ1bmN0aW9uKGkpe1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5zbGljZShpKVswXTtcblx0XHRcdH0sXG5cdFx0XHRjb250YWluczogZnVuY3Rpb24oZCl7XG5cdFx0XHRcdC8vIEFycmF5LmluZGV4T2YgaXMgbm90IGNyb3NzLWJyb3dzZXI7XG5cdFx0XHRcdC8vICQuaW5BcnJheSBkb2Vzbid0IHdvcmsgd2l0aCBEYXRlc1xuXHRcdFx0XHR2YXIgdmFsID0gZCAmJiBkLnZhbHVlT2YoKTtcblx0XHRcdFx0Zm9yICh2YXIgaT0wLCBsPXRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKVxuXHRcdFx0XHRcdGlmICh0aGlzW2ldLnZhbHVlT2YoKSA9PT0gdmFsKVxuXHRcdFx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHRcdHJldHVybiAtMTtcblx0XHRcdH0sXG5cdFx0XHRyZW1vdmU6IGZ1bmN0aW9uKGkpe1xuXHRcdFx0XHR0aGlzLnNwbGljZShpLDEpO1xuXHRcdFx0fSxcblx0XHRcdHJlcGxhY2U6IGZ1bmN0aW9uKG5ld19hcnJheSl7XG5cdFx0XHRcdGlmICghbmV3X2FycmF5KVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0aWYgKCEkLmlzQXJyYXkobmV3X2FycmF5KSlcblx0XHRcdFx0XHRuZXdfYXJyYXkgPSBbbmV3X2FycmF5XTtcblx0XHRcdFx0dGhpcy5jbGVhcigpO1xuXHRcdFx0XHR0aGlzLnB1c2guYXBwbHkodGhpcywgbmV3X2FycmF5KTtcblx0XHRcdH0sXG5cdFx0XHRjbGVhcjogZnVuY3Rpb24oKXtcblx0XHRcdFx0dGhpcy5zcGxpY2UoMCk7XG5cdFx0XHR9LFxuXHRcdFx0Y29weTogZnVuY3Rpb24oKXtcblx0XHRcdFx0dmFyIGEgPSBuZXcgRGF0ZUFycmF5KCk7XG5cdFx0XHRcdGEucmVwbGFjZSh0aGlzKTtcblx0XHRcdFx0cmV0dXJuIGE7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIGEgPSBbXTtcblx0XHRcdGEucHVzaC5hcHBseShhLCBhcmd1bWVudHMpO1xuXHRcdFx0JC5leHRlbmQoYSwgZXh0cmFzKTtcblx0XHRcdHJldHVybiBhO1xuXHRcdH07XG5cdH0pKCk7XG5cblxuXHQvLyBQaWNrZXIgb2JqZWN0XG5cblx0dmFyIERhdGVwaWNrZXIgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKXtcblx0XHR0aGlzLmRhdGVzID0gbmV3IERhdGVBcnJheSgpO1xuXHRcdHRoaXMudmlld0RhdGUgPSBVVENUb2RheSgpO1xuXHRcdHRoaXMuZm9jdXNEYXRlID0gbnVsbDtcblxuXHRcdHRoaXMuX3Byb2Nlc3Nfb3B0aW9ucyhvcHRpb25zKTtcblxuXHRcdHRoaXMuZWxlbWVudCA9ICQoZWxlbWVudCk7XG5cdFx0dGhpcy5pc0lubGluZSA9IGZhbHNlO1xuXHRcdHRoaXMuaXNJbnB1dCA9IHRoaXMuZWxlbWVudC5pcygnaW5wdXQnKTtcblx0XHR0aGlzLmNvbXBvbmVudCA9IHRoaXMuZWxlbWVudC5pcygnLmRhdGUnKSA/IHRoaXMuZWxlbWVudC5maW5kKCcuYWRkLW9uLCAuaW5wdXQtZ3JvdXAtYWRkb24sIC5idG4nKSA6IGZhbHNlO1xuXHRcdHRoaXMuaGFzSW5wdXQgPSB0aGlzLmNvbXBvbmVudCAmJiB0aGlzLmVsZW1lbnQuZmluZCgnaW5wdXQnKS5sZW5ndGg7XG5cdFx0aWYgKHRoaXMuY29tcG9uZW50ICYmIHRoaXMuY29tcG9uZW50Lmxlbmd0aCA9PT0gMClcblx0XHRcdHRoaXMuY29tcG9uZW50ID0gZmFsc2U7XG5cblx0XHR0aGlzLnBpY2tlciA9ICQoRFBHbG9iYWwudGVtcGxhdGUpO1xuXHRcdHRoaXMuX2J1aWxkRXZlbnRzKCk7XG5cdFx0dGhpcy5fYXR0YWNoRXZlbnRzKCk7XG5cblx0XHRpZiAodGhpcy5pc0lubGluZSl7XG5cdFx0XHR0aGlzLnBpY2tlci5hZGRDbGFzcygnZGF0ZXBpY2tlci1pbmxpbmUnKS5hcHBlbmRUbyh0aGlzLmVsZW1lbnQpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHRoaXMucGlja2VyLmFkZENsYXNzKCdkYXRlcGlja2VyLWRyb3Bkb3duIGRyb3Bkb3duLW1lbnUnKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5vLnJ0bCl7XG5cdFx0XHR0aGlzLnBpY2tlci5hZGRDbGFzcygnZGF0ZXBpY2tlci1ydGwnKTtcblx0XHR9XG5cblx0XHR0aGlzLnZpZXdNb2RlID0gdGhpcy5vLnN0YXJ0VmlldztcblxuXHRcdGlmICh0aGlzLm8uY2FsZW5kYXJXZWVrcylcblx0XHRcdHRoaXMucGlja2VyLmZpbmQoJ3Rmb290IHRoLnRvZGF5Jylcblx0XHRcdFx0XHRcdC5hdHRyKCdjb2xzcGFuJywgZnVuY3Rpb24oaSwgdmFsKXtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHBhcnNlSW50KHZhbCkgKyAxO1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHR0aGlzLl9hbGxvd191cGRhdGUgPSBmYWxzZTtcblxuXHRcdHRoaXMuc2V0U3RhcnREYXRlKHRoaXMuX28uc3RhcnREYXRlKTtcblx0XHR0aGlzLnNldEVuZERhdGUodGhpcy5fby5lbmREYXRlKTtcblx0XHR0aGlzLnNldERheXNPZldlZWtEaXNhYmxlZCh0aGlzLm8uZGF5c09mV2Vla0Rpc2FibGVkKTtcblxuXHRcdHRoaXMuZmlsbERvdygpO1xuXHRcdHRoaXMuZmlsbE1vbnRocygpO1xuXG5cdFx0dGhpcy5fYWxsb3dfdXBkYXRlID0gdHJ1ZTtcblxuXHRcdHRoaXMudXBkYXRlKCk7XG5cdFx0dGhpcy5zaG93TW9kZSgpO1xuXG5cdFx0aWYgKHRoaXMuaXNJbmxpbmUpe1xuXHRcdFx0dGhpcy5zaG93KCk7XG5cdFx0fVxuXHR9O1xuXG5cdERhdGVwaWNrZXIucHJvdG90eXBlID0ge1xuXHRcdGNvbnN0cnVjdG9yOiBEYXRlcGlja2VyLFxuXG5cdFx0X3Byb2Nlc3Nfb3B0aW9uczogZnVuY3Rpb24ob3B0cyl7XG5cdFx0XHQvLyBTdG9yZSByYXcgb3B0aW9ucyBmb3IgcmVmZXJlbmNlXG5cdFx0XHR0aGlzLl9vID0gJC5leHRlbmQoe30sIHRoaXMuX28sIG9wdHMpO1xuXHRcdFx0Ly8gUHJvY2Vzc2VkIG9wdGlvbnNcblx0XHRcdHZhciBvID0gdGhpcy5vID0gJC5leHRlbmQoe30sIHRoaXMuX28pO1xuXG5cdFx0XHQvLyBDaGVjayBpZiBcImRlLURFXCIgc3R5bGUgZGF0ZSBpcyBhdmFpbGFibGUsIGlmIG5vdCBsYW5ndWFnZSBzaG91bGRcblx0XHRcdC8vIGZhbGxiYWNrIHRvIDIgbGV0dGVyIGNvZGUgZWcgXCJkZVwiXG5cdFx0XHR2YXIgbGFuZyA9IG8ubGFuZ3VhZ2U7XG5cdFx0XHRpZiAoIWRhdGVzW2xhbmddKXtcblx0XHRcdFx0bGFuZyA9IGxhbmcuc3BsaXQoJy0nKVswXTtcblx0XHRcdFx0aWYgKCFkYXRlc1tsYW5nXSlcblx0XHRcdFx0XHRsYW5nID0gZGVmYXVsdHMubGFuZ3VhZ2U7XG5cdFx0XHR9XG5cdFx0XHRvLmxhbmd1YWdlID0gbGFuZztcblxuXHRcdFx0c3dpdGNoIChvLnN0YXJ0Vmlldyl7XG5cdFx0XHRcdGNhc2UgMjpcblx0XHRcdFx0Y2FzZSAnZGVjYWRlJzpcblx0XHRcdFx0XHRvLnN0YXJ0VmlldyA9IDI7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgMTpcblx0XHRcdFx0Y2FzZSAneWVhcic6XG5cdFx0XHRcdFx0by5zdGFydFZpZXcgPSAxO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdG8uc3RhcnRWaWV3ID0gMDtcblx0XHRcdH1cblxuXHRcdFx0c3dpdGNoIChvLm1pblZpZXdNb2RlKXtcblx0XHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHRjYXNlICdtb250aHMnOlxuXHRcdFx0XHRcdG8ubWluVmlld01vZGUgPSAxO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDI6XG5cdFx0XHRcdGNhc2UgJ3llYXJzJzpcblx0XHRcdFx0XHRvLm1pblZpZXdNb2RlID0gMjtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRvLm1pblZpZXdNb2RlID0gMDtcblx0XHRcdH1cblxuXHRcdFx0by5zdGFydFZpZXcgPSBNYXRoLm1heChvLnN0YXJ0Vmlldywgby5taW5WaWV3TW9kZSk7XG5cblx0XHRcdC8vIHRydWUsIGZhbHNlLCBvciBOdW1iZXIgPiAwXG5cdFx0XHRpZiAoby5tdWx0aWRhdGUgIT09IHRydWUpe1xuXHRcdFx0XHRvLm11bHRpZGF0ZSA9IE51bWJlcihvLm11bHRpZGF0ZSkgfHwgZmFsc2U7XG5cdFx0XHRcdGlmIChvLm11bHRpZGF0ZSAhPT0gZmFsc2UpXG5cdFx0XHRcdFx0by5tdWx0aWRhdGUgPSBNYXRoLm1heCgwLCBvLm11bHRpZGF0ZSk7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRvLm11bHRpZGF0ZSA9IDE7XG5cdFx0XHR9XG5cdFx0XHRvLm11bHRpZGF0ZVNlcGFyYXRvciA9IFN0cmluZyhvLm11bHRpZGF0ZVNlcGFyYXRvcik7XG5cblx0XHRcdG8ud2Vla1N0YXJ0ICU9IDc7XG5cdFx0XHRvLndlZWtFbmQgPSAoKG8ud2Vla1N0YXJ0ICsgNikgJSA3KTtcblxuXHRcdFx0dmFyIGZvcm1hdCA9IERQR2xvYmFsLnBhcnNlRm9ybWF0KG8uZm9ybWF0KTtcblx0XHRcdGlmIChvLnN0YXJ0RGF0ZSAhPT0gLUluZmluaXR5KXtcblx0XHRcdFx0aWYgKCEhby5zdGFydERhdGUpe1xuXHRcdFx0XHRcdGlmIChvLnN0YXJ0RGF0ZSBpbnN0YW5jZW9mIERhdGUpXG5cdFx0XHRcdFx0XHRvLnN0YXJ0RGF0ZSA9IHRoaXMuX2xvY2FsX3RvX3V0Yyh0aGlzLl96ZXJvX3RpbWUoby5zdGFydERhdGUpKTtcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRvLnN0YXJ0RGF0ZSA9IERQR2xvYmFsLnBhcnNlRGF0ZShvLnN0YXJ0RGF0ZSwgZm9ybWF0LCBvLmxhbmd1YWdlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRvLnN0YXJ0RGF0ZSA9IC1JbmZpbml0eTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKG8uZW5kRGF0ZSAhPT0gSW5maW5pdHkpe1xuXHRcdFx0XHRpZiAoISFvLmVuZERhdGUpe1xuXHRcdFx0XHRcdGlmIChvLmVuZERhdGUgaW5zdGFuY2VvZiBEYXRlKVxuXHRcdFx0XHRcdFx0by5lbmREYXRlID0gdGhpcy5fbG9jYWxfdG9fdXRjKHRoaXMuX3plcm9fdGltZShvLmVuZERhdGUpKTtcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRvLmVuZERhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUoby5lbmREYXRlLCBmb3JtYXQsIG8ubGFuZ3VhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdG8uZW5kRGF0ZSA9IEluZmluaXR5O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdG8uZGF5c09mV2Vla0Rpc2FibGVkID0gby5kYXlzT2ZXZWVrRGlzYWJsZWR8fFtdO1xuXHRcdFx0aWYgKCEkLmlzQXJyYXkoby5kYXlzT2ZXZWVrRGlzYWJsZWQpKVxuXHRcdFx0XHRvLmRheXNPZldlZWtEaXNhYmxlZCA9IG8uZGF5c09mV2Vla0Rpc2FibGVkLnNwbGl0KC9bLFxcc10qLyk7XG5cdFx0XHRvLmRheXNPZldlZWtEaXNhYmxlZCA9ICQubWFwKG8uZGF5c09mV2Vla0Rpc2FibGVkLCBmdW5jdGlvbihkKXtcblx0XHRcdFx0cmV0dXJuIHBhcnNlSW50KGQsIDEwKTtcblx0XHRcdH0pO1xuXG5cdFx0XHR2YXIgcGxjID0gU3RyaW5nKG8ub3JpZW50YXRpb24pLnRvTG93ZXJDYXNlKCkuc3BsaXQoL1xccysvZyksXG5cdFx0XHRcdF9wbGMgPSBvLm9yaWVudGF0aW9uLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRwbGMgPSAkLmdyZXAocGxjLCBmdW5jdGlvbih3b3JkKXtcblx0XHRcdFx0cmV0dXJuICgvXmF1dG98bGVmdHxyaWdodHx0b3B8Ym90dG9tJC8pLnRlc3Qod29yZCk7XG5cdFx0XHR9KTtcblx0XHRcdG8ub3JpZW50YXRpb24gPSB7eDogJ2F1dG8nLCB5OiAnYXV0byd9O1xuXHRcdFx0aWYgKCFfcGxjIHx8IF9wbGMgPT09ICdhdXRvJylcblx0XHRcdFx0OyAvLyBubyBhY3Rpb25cblx0XHRcdGVsc2UgaWYgKHBsYy5sZW5ndGggPT09IDEpe1xuXHRcdFx0XHRzd2l0Y2ggKHBsY1swXSl7XG5cdFx0XHRcdFx0Y2FzZSAndG9wJzpcblx0XHRcdFx0XHRjYXNlICdib3R0b20nOlxuXHRcdFx0XHRcdFx0by5vcmllbnRhdGlvbi55ID0gcGxjWzBdO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnbGVmdCc6XG5cdFx0XHRcdFx0Y2FzZSAncmlnaHQnOlxuXHRcdFx0XHRcdFx0by5vcmllbnRhdGlvbi54ID0gcGxjWzBdO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRfcGxjID0gJC5ncmVwKHBsYywgZnVuY3Rpb24od29yZCl7XG5cdFx0XHRcdFx0cmV0dXJuICgvXmxlZnR8cmlnaHQkLykudGVzdCh3b3JkKTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdG8ub3JpZW50YXRpb24ueCA9IF9wbGNbMF0gfHwgJ2F1dG8nO1xuXG5cdFx0XHRcdF9wbGMgPSAkLmdyZXAocGxjLCBmdW5jdGlvbih3b3JkKXtcblx0XHRcdFx0XHRyZXR1cm4gKC9edG9wfGJvdHRvbSQvKS50ZXN0KHdvcmQpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0by5vcmllbnRhdGlvbi55ID0gX3BsY1swXSB8fCAnYXV0byc7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRfZXZlbnRzOiBbXSxcblx0XHRfc2Vjb25kYXJ5RXZlbnRzOiBbXSxcblx0XHRfYXBwbHlFdmVudHM6IGZ1bmN0aW9uKGV2cyl7XG5cdFx0XHRmb3IgKHZhciBpPTAsIGVsLCBjaCwgZXY7IGkgPCBldnMubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRlbCA9IGV2c1tpXVswXTtcblx0XHRcdFx0aWYgKGV2c1tpXS5sZW5ndGggPT09IDIpe1xuXHRcdFx0XHRcdGNoID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdGV2ID0gZXZzW2ldWzFdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGV2c1tpXS5sZW5ndGggPT09IDMpe1xuXHRcdFx0XHRcdGNoID0gZXZzW2ldWzFdO1xuXHRcdFx0XHRcdGV2ID0gZXZzW2ldWzJdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsLm9uKGV2LCBjaCk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRfdW5hcHBseUV2ZW50czogZnVuY3Rpb24oZXZzKXtcblx0XHRcdGZvciAodmFyIGk9MCwgZWwsIGV2LCBjaDsgaSA8IGV2cy5sZW5ndGg7IGkrKyl7XG5cdFx0XHRcdGVsID0gZXZzW2ldWzBdO1xuXHRcdFx0XHRpZiAoZXZzW2ldLmxlbmd0aCA9PT0gMil7XG5cdFx0XHRcdFx0Y2ggPSB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0ZXYgPSBldnNbaV1bMV07XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoZXZzW2ldLmxlbmd0aCA9PT0gMyl7XG5cdFx0XHRcdFx0Y2ggPSBldnNbaV1bMV07XG5cdFx0XHRcdFx0ZXYgPSBldnNbaV1bMl07XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWwub2ZmKGV2LCBjaCk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRfYnVpbGRFdmVudHM6IGZ1bmN0aW9uKCl7XG5cdFx0XHRpZiAodGhpcy5pc0lucHV0KXsgLy8gc2luZ2xlIGlucHV0XG5cdFx0XHRcdHRoaXMuX2V2ZW50cyA9IFtcblx0XHRcdFx0XHRbdGhpcy5lbGVtZW50LCB7XG5cdFx0XHRcdFx0XHRmb2N1czogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpLFxuXHRcdFx0XHRcdFx0a2V5dXA6ICQucHJveHkoZnVuY3Rpb24oZSl7XG5cdFx0XHRcdFx0XHRcdGlmICgkLmluQXJyYXkoZS5rZXlDb2RlLCBbMjcsMzcsMzksMzgsNDAsMzIsMTMsOV0pID09PSAtMSlcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdFx0XHRcdFx0fSwgdGhpcyksXG5cdFx0XHRcdFx0XHRrZXlkb3duOiAkLnByb3h5KHRoaXMua2V5ZG93biwgdGhpcylcblx0XHRcdFx0XHR9XVxuXHRcdFx0XHRdO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAodGhpcy5jb21wb25lbnQgJiYgdGhpcy5oYXNJbnB1dCl7IC8vIGNvbXBvbmVudDogaW5wdXQgKyBidXR0b25cblx0XHRcdFx0dGhpcy5fZXZlbnRzID0gW1xuXHRcdFx0XHRcdC8vIEZvciBjb21wb25lbnRzIHRoYXQgYXJlIG5vdCByZWFkb25seSwgYWxsb3cga2V5Ym9hcmQgbmF2XG5cdFx0XHRcdFx0W3RoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpLCB7XG5cdFx0XHRcdFx0XHRmb2N1czogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpLFxuXHRcdFx0XHRcdFx0a2V5dXA6ICQucHJveHkoZnVuY3Rpb24oZSl7XG5cdFx0XHRcdFx0XHRcdGlmICgkLmluQXJyYXkoZS5rZXlDb2RlLCBbMjcsMzcsMzksMzgsNDAsMzIsMTMsOV0pID09PSAtMSlcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdFx0XHRcdFx0fSwgdGhpcyksXG5cdFx0XHRcdFx0XHRrZXlkb3duOiAkLnByb3h5KHRoaXMua2V5ZG93biwgdGhpcylcblx0XHRcdFx0XHR9XSxcblx0XHRcdFx0XHRbdGhpcy5jb21wb25lbnQsIHtcblx0XHRcdFx0XHRcdGNsaWNrOiAkLnByb3h5KHRoaXMuc2hvdywgdGhpcylcblx0XHRcdFx0XHR9XVxuXHRcdFx0XHRdO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAodGhpcy5lbGVtZW50LmlzKCdkaXYnKSl7ICAvLyBpbmxpbmUgZGF0ZXBpY2tlclxuXHRcdFx0XHR0aGlzLmlzSW5saW5lID0gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0aGlzLl9ldmVudHMgPSBbXG5cdFx0XHRcdFx0W3RoaXMuZWxlbWVudCwge1xuXHRcdFx0XHRcdFx0Y2xpY2s6ICQucHJveHkodGhpcy5zaG93LCB0aGlzKVxuXHRcdFx0XHRcdH1dXG5cdFx0XHRcdF07XG5cdFx0XHR9XG5cdFx0XHR0aGlzLl9ldmVudHMucHVzaChcblx0XHRcdFx0Ly8gQ29tcG9uZW50OiBsaXN0ZW4gZm9yIGJsdXIgb24gZWxlbWVudCBkZXNjZW5kYW50c1xuXHRcdFx0XHRbdGhpcy5lbGVtZW50LCAnKicsIHtcblx0XHRcdFx0XHRibHVyOiAkLnByb3h5KGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRcdFx0dGhpcy5fZm9jdXNlZF9mcm9tID0gZS50YXJnZXQ7XG5cdFx0XHRcdFx0fSwgdGhpcylcblx0XHRcdFx0fV0sXG5cdFx0XHRcdC8vIElucHV0OiBsaXN0ZW4gZm9yIGJsdXIgb24gZWxlbWVudFxuXHRcdFx0XHRbdGhpcy5lbGVtZW50LCB7XG5cdFx0XHRcdFx0Ymx1cjogJC5wcm94eShmdW5jdGlvbihlKXtcblx0XHRcdFx0XHRcdHRoaXMuX2ZvY3VzZWRfZnJvbSA9IGUudGFyZ2V0O1xuXHRcdFx0XHRcdH0sIHRoaXMpXG5cdFx0XHRcdH1dXG5cdFx0XHQpO1xuXG5cdFx0XHR0aGlzLl9zZWNvbmRhcnlFdmVudHMgPSBbXG5cdFx0XHRcdFt0aGlzLnBpY2tlciwge1xuXHRcdFx0XHRcdGNsaWNrOiAkLnByb3h5KHRoaXMuY2xpY2ssIHRoaXMpXG5cdFx0XHRcdH1dLFxuXHRcdFx0XHRbJCh3aW5kb3cpLCB7XG5cdFx0XHRcdFx0cmVzaXplOiAkLnByb3h5KHRoaXMucGxhY2UsIHRoaXMpXG5cdFx0XHRcdH1dLFxuXHRcdFx0XHRbJChkb2N1bWVudCksIHtcblx0XHRcdFx0XHQnbW91c2Vkb3duIHRvdWNoc3RhcnQnOiAkLnByb3h5KGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRcdFx0Ly8gQ2xpY2tlZCBvdXRzaWRlIHRoZSBkYXRlcGlja2VyLCBoaWRlIGl0XG5cdFx0XHRcdFx0XHRpZiAoIShcblx0XHRcdFx0XHRcdFx0dGhpcy5lbGVtZW50LmlzKGUudGFyZ2V0KSB8fFxuXHRcdFx0XHRcdFx0XHR0aGlzLmVsZW1lbnQuZmluZChlLnRhcmdldCkubGVuZ3RoIHx8XG5cdFx0XHRcdFx0XHRcdHRoaXMucGlja2VyLmlzKGUudGFyZ2V0KSB8fFxuXHRcdFx0XHRcdFx0XHR0aGlzLnBpY2tlci5maW5kKGUudGFyZ2V0KS5sZW5ndGhcblx0XHRcdFx0XHRcdCkpe1xuXHRcdFx0XHRcdFx0XHR0aGlzLmhpZGUoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LCB0aGlzKVxuXHRcdFx0XHR9XVxuXHRcdFx0XTtcblx0XHR9LFxuXHRcdF9hdHRhY2hFdmVudHM6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLl9kZXRhY2hFdmVudHMoKTtcblx0XHRcdHRoaXMuX2FwcGx5RXZlbnRzKHRoaXMuX2V2ZW50cyk7XG5cdFx0fSxcblx0XHRfZGV0YWNoRXZlbnRzOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5fdW5hcHBseUV2ZW50cyh0aGlzLl9ldmVudHMpO1xuXHRcdH0sXG5cdFx0X2F0dGFjaFNlY29uZGFyeUV2ZW50czogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuX2RldGFjaFNlY29uZGFyeUV2ZW50cygpO1xuXHRcdFx0dGhpcy5fYXBwbHlFdmVudHModGhpcy5fc2Vjb25kYXJ5RXZlbnRzKTtcblx0XHR9LFxuXHRcdF9kZXRhY2hTZWNvbmRhcnlFdmVudHM6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLl91bmFwcGx5RXZlbnRzKHRoaXMuX3NlY29uZGFyeUV2ZW50cyk7XG5cdFx0fSxcblx0XHRfdHJpZ2dlcjogZnVuY3Rpb24oZXZlbnQsIGFsdGRhdGUpe1xuXHRcdFx0dmFyIGRhdGUgPSBhbHRkYXRlIHx8IHRoaXMuZGF0ZXMuZ2V0KC0xKSxcblx0XHRcdFx0bG9jYWxfZGF0ZSA9IHRoaXMuX3V0Y190b19sb2NhbChkYXRlKTtcblxuXHRcdFx0dGhpcy5lbGVtZW50LnRyaWdnZXIoe1xuXHRcdFx0XHR0eXBlOiBldmVudCxcblx0XHRcdFx0ZGF0ZTogbG9jYWxfZGF0ZSxcblx0XHRcdFx0ZGF0ZXM6ICQubWFwKHRoaXMuZGF0ZXMsIHRoaXMuX3V0Y190b19sb2NhbCksXG5cdFx0XHRcdGZvcm1hdDogJC5wcm94eShmdW5jdGlvbihpeCwgZm9ybWF0KXtcblx0XHRcdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCl7XG5cdFx0XHRcdFx0XHRpeCA9IHRoaXMuZGF0ZXMubGVuZ3RoIC0gMTtcblx0XHRcdFx0XHRcdGZvcm1hdCA9IHRoaXMuby5mb3JtYXQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKHR5cGVvZiBpeCA9PT0gJ3N0cmluZycpe1xuXHRcdFx0XHRcdFx0Zm9ybWF0ID0gaXg7XG5cdFx0XHRcdFx0XHRpeCA9IHRoaXMuZGF0ZXMubGVuZ3RoIC0gMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Zm9ybWF0ID0gZm9ybWF0IHx8IHRoaXMuby5mb3JtYXQ7XG5cdFx0XHRcdFx0dmFyIGRhdGUgPSB0aGlzLmRhdGVzLmdldChpeCk7XG5cdFx0XHRcdFx0cmV0dXJuIERQR2xvYmFsLmZvcm1hdERhdGUoZGF0ZSwgZm9ybWF0LCB0aGlzLm8ubGFuZ3VhZ2UpO1xuXHRcdFx0XHR9LCB0aGlzKVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdHNob3c6IGZ1bmN0aW9uKCl7XG5cdFx0XHRpZiAoIXRoaXMuaXNJbmxpbmUpXG5cdFx0XHRcdHRoaXMucGlja2VyLmFwcGVuZFRvKCdib2R5Jyk7XG5cdFx0XHR0aGlzLnBpY2tlci5zaG93KCk7XG5cdFx0XHR0aGlzLnBsYWNlKCk7XG5cdFx0XHR0aGlzLl9hdHRhY2hTZWNvbmRhcnlFdmVudHMoKTtcblx0XHRcdHRoaXMuX3RyaWdnZXIoJ3Nob3cnKTtcblx0XHR9LFxuXG5cdFx0aGlkZTogZnVuY3Rpb24oKXtcblx0XHRcdGlmICh0aGlzLmlzSW5saW5lKVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRpZiAoIXRoaXMucGlja2VyLmlzKCc6dmlzaWJsZScpKVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR0aGlzLmZvY3VzRGF0ZSA9IG51bGw7XG5cdFx0XHR0aGlzLnBpY2tlci5oaWRlKCkuZGV0YWNoKCk7XG5cdFx0XHR0aGlzLl9kZXRhY2hTZWNvbmRhcnlFdmVudHMoKTtcblx0XHRcdHRoaXMudmlld01vZGUgPSB0aGlzLm8uc3RhcnRWaWV3O1xuXHRcdFx0dGhpcy5zaG93TW9kZSgpO1xuXG5cdFx0XHRpZiAoXG5cdFx0XHRcdHRoaXMuby5mb3JjZVBhcnNlICYmXG5cdFx0XHRcdChcblx0XHRcdFx0XHR0aGlzLmlzSW5wdXQgJiYgdGhpcy5lbGVtZW50LnZhbCgpIHx8XG5cdFx0XHRcdFx0dGhpcy5oYXNJbnB1dCAmJiB0aGlzLmVsZW1lbnQuZmluZCgnaW5wdXQnKS52YWwoKVxuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0XHRcdHRoaXMuc2V0VmFsdWUoKTtcblx0XHRcdHRoaXMuX3RyaWdnZXIoJ2hpZGUnKTtcblx0XHR9LFxuXG5cdFx0cmVtb3ZlOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5oaWRlKCk7XG5cdFx0XHR0aGlzLl9kZXRhY2hFdmVudHMoKTtcblx0XHRcdHRoaXMuX2RldGFjaFNlY29uZGFyeUV2ZW50cygpO1xuXHRcdFx0dGhpcy5waWNrZXIucmVtb3ZlKCk7XG5cdFx0XHRkZWxldGUgdGhpcy5lbGVtZW50LmRhdGEoKS5kYXRlcGlja2VyO1xuXHRcdFx0aWYgKCF0aGlzLmlzSW5wdXQpe1xuXHRcdFx0XHRkZWxldGUgdGhpcy5lbGVtZW50LmRhdGEoKS5kYXRlO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRfdXRjX3RvX2xvY2FsOiBmdW5jdGlvbih1dGMpe1xuXHRcdFx0cmV0dXJuIHV0YyAmJiBuZXcgRGF0ZSh1dGMuZ2V0VGltZSgpICsgKHV0Yy5nZXRUaW1lem9uZU9mZnNldCgpKjYwMDAwKSk7XG5cdFx0fSxcblx0XHRfbG9jYWxfdG9fdXRjOiBmdW5jdGlvbihsb2NhbCl7XG5cdFx0XHRyZXR1cm4gbG9jYWwgJiYgbmV3IERhdGUobG9jYWwuZ2V0VGltZSgpIC0gKGxvY2FsLmdldFRpbWV6b25lT2Zmc2V0KCkqNjAwMDApKTtcblx0XHR9LFxuXHRcdF96ZXJvX3RpbWU6IGZ1bmN0aW9uKGxvY2FsKXtcblx0XHRcdHJldHVybiBsb2NhbCAmJiBuZXcgRGF0ZShsb2NhbC5nZXRGdWxsWWVhcigpLCBsb2NhbC5nZXRNb250aCgpLCBsb2NhbC5nZXREYXRlKCkpO1xuXHRcdH0sXG5cdFx0X3plcm9fdXRjX3RpbWU6IGZ1bmN0aW9uKHV0Yyl7XG5cdFx0XHRyZXR1cm4gdXRjICYmIG5ldyBEYXRlKERhdGUuVVRDKHV0Yy5nZXRVVENGdWxsWWVhcigpLCB1dGMuZ2V0VVRDTW9udGgoKSwgdXRjLmdldFVUQ0RhdGUoKSkpO1xuXHRcdH0sXG5cblx0XHRnZXREYXRlczogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiAkLm1hcCh0aGlzLmRhdGVzLCB0aGlzLl91dGNfdG9fbG9jYWwpO1xuXHRcdH0sXG5cblx0XHRnZXRVVENEYXRlczogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiAkLm1hcCh0aGlzLmRhdGVzLCBmdW5jdGlvbihkKXtcblx0XHRcdFx0cmV0dXJuIG5ldyBEYXRlKGQpO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGdldERhdGU6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gdGhpcy5fdXRjX3RvX2xvY2FsKHRoaXMuZ2V0VVRDRGF0ZSgpKTtcblx0XHR9LFxuXG5cdFx0Z2V0VVRDRGF0ZTogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBuZXcgRGF0ZSh0aGlzLmRhdGVzLmdldCgtMSkpO1xuXHRcdH0sXG5cblx0XHRzZXREYXRlczogZnVuY3Rpb24oKXtcblx0XHRcdHZhciBhcmdzID0gJC5pc0FycmF5KGFyZ3VtZW50c1swXSkgPyBhcmd1bWVudHNbMF0gOiBhcmd1bWVudHM7XG5cdFx0XHR0aGlzLnVwZGF0ZS5hcHBseSh0aGlzLCBhcmdzKTtcblx0XHRcdHRoaXMuX3RyaWdnZXIoJ2NoYW5nZURhdGUnKTtcblx0XHRcdHRoaXMuc2V0VmFsdWUoKTtcblx0XHR9LFxuXG5cdFx0c2V0VVRDRGF0ZXM6IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgYXJncyA9ICQuaXNBcnJheShhcmd1bWVudHNbMF0pID8gYXJndW1lbnRzWzBdIDogYXJndW1lbnRzO1xuXHRcdFx0dGhpcy51cGRhdGUuYXBwbHkodGhpcywgJC5tYXAoYXJncywgdGhpcy5fdXRjX3RvX2xvY2FsKSk7XG5cdFx0XHR0aGlzLl90cmlnZ2VyKCdjaGFuZ2VEYXRlJyk7XG5cdFx0XHR0aGlzLnNldFZhbHVlKCk7XG5cdFx0fSxcblxuXHRcdHNldERhdGU6IGFsaWFzKCdzZXREYXRlcycpLFxuXHRcdHNldFVUQ0RhdGU6IGFsaWFzKCdzZXRVVENEYXRlcycpLFxuXG5cdFx0c2V0VmFsdWU6IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgZm9ybWF0dGVkID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKCk7XG5cdFx0XHRpZiAoIXRoaXMuaXNJbnB1dCl7XG5cdFx0XHRcdGlmICh0aGlzLmNvbXBvbmVudCl7XG5cdFx0XHRcdFx0dGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0JykudmFsKGZvcm1hdHRlZCkuY2hhbmdlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHR0aGlzLmVsZW1lbnQudmFsKGZvcm1hdHRlZCkuY2hhbmdlKCk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdGdldEZvcm1hdHRlZERhdGU6IGZ1bmN0aW9uKGZvcm1hdCl7XG5cdFx0XHRpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpXG5cdFx0XHRcdGZvcm1hdCA9IHRoaXMuby5mb3JtYXQ7XG5cblx0XHRcdHZhciBsYW5nID0gdGhpcy5vLmxhbmd1YWdlO1xuXHRcdFx0cmV0dXJuICQubWFwKHRoaXMuZGF0ZXMsIGZ1bmN0aW9uKGQpe1xuXHRcdFx0XHRyZXR1cm4gRFBHbG9iYWwuZm9ybWF0RGF0ZShkLCBmb3JtYXQsIGxhbmcpO1xuXHRcdFx0fSkuam9pbih0aGlzLm8ubXVsdGlkYXRlU2VwYXJhdG9yKTtcblx0XHR9LFxuXG5cdFx0c2V0U3RhcnREYXRlOiBmdW5jdGlvbihzdGFydERhdGUpe1xuXHRcdFx0dGhpcy5fcHJvY2Vzc19vcHRpb25zKHtzdGFydERhdGU6IHN0YXJ0RGF0ZX0pO1xuXHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHRcdHRoaXMudXBkYXRlTmF2QXJyb3dzKCk7XG5cdFx0fSxcblxuXHRcdHNldEVuZERhdGU6IGZ1bmN0aW9uKGVuZERhdGUpe1xuXHRcdFx0dGhpcy5fcHJvY2Vzc19vcHRpb25zKHtlbmREYXRlOiBlbmREYXRlfSk7XG5cdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdFx0dGhpcy51cGRhdGVOYXZBcnJvd3MoKTtcblx0XHR9LFxuXG5cdFx0c2V0RGF5c09mV2Vla0Rpc2FibGVkOiBmdW5jdGlvbihkYXlzT2ZXZWVrRGlzYWJsZWQpe1xuXHRcdFx0dGhpcy5fcHJvY2Vzc19vcHRpb25zKHtkYXlzT2ZXZWVrRGlzYWJsZWQ6IGRheXNPZldlZWtEaXNhYmxlZH0pO1xuXHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHRcdHRoaXMudXBkYXRlTmF2QXJyb3dzKCk7XG5cdFx0fSxcblxuXHRcdHBsYWNlOiBmdW5jdGlvbigpe1xuXHRcdFx0aWYgKHRoaXMuaXNJbmxpbmUpXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdHZhciBjYWxlbmRhcldpZHRoID0gdGhpcy5waWNrZXIub3V0ZXJXaWR0aCgpLFxuXHRcdFx0XHRjYWxlbmRhckhlaWdodCA9IHRoaXMucGlja2VyLm91dGVySGVpZ2h0KCksXG5cdFx0XHRcdHZpc3VhbFBhZGRpbmcgPSAxMCxcblx0XHRcdFx0d2luZG93V2lkdGggPSAkd2luZG93LndpZHRoKCksXG5cdFx0XHRcdHdpbmRvd0hlaWdodCA9ICR3aW5kb3cuaGVpZ2h0KCksXG5cdFx0XHRcdHNjcm9sbFRvcCA9ICR3aW5kb3cuc2Nyb2xsVG9wKCk7XG5cblx0XHRcdHZhciB6SW5kZXggPSBwYXJzZUludCh0aGlzLmVsZW1lbnQucGFyZW50cygpLmZpbHRlcihmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiAkKHRoaXMpLmNzcygnei1pbmRleCcpICE9PSAnYXV0byc7XG5cdFx0XHRcdH0pLmZpcnN0KCkuY3NzKCd6LWluZGV4JykpKzEwO1xuXHRcdFx0dmFyIG9mZnNldCA9IHRoaXMuY29tcG9uZW50ID8gdGhpcy5jb21wb25lbnQucGFyZW50KCkub2Zmc2V0KCkgOiB0aGlzLmVsZW1lbnQub2Zmc2V0KCk7XG5cdFx0XHR2YXIgaGVpZ2h0ID0gdGhpcy5jb21wb25lbnQgPyB0aGlzLmNvbXBvbmVudC5vdXRlckhlaWdodCh0cnVlKSA6IHRoaXMuZWxlbWVudC5vdXRlckhlaWdodChmYWxzZSk7XG5cdFx0XHR2YXIgd2lkdGggPSB0aGlzLmNvbXBvbmVudCA/IHRoaXMuY29tcG9uZW50Lm91dGVyV2lkdGgodHJ1ZSkgOiB0aGlzLmVsZW1lbnQub3V0ZXJXaWR0aChmYWxzZSk7XG5cdFx0XHR2YXIgbGVmdCA9IG9mZnNldC5sZWZ0LFxuXHRcdFx0XHR0b3AgPSBvZmZzZXQudG9wO1xuXG5cdFx0XHR0aGlzLnBpY2tlci5yZW1vdmVDbGFzcyhcblx0XHRcdFx0J2RhdGVwaWNrZXItb3JpZW50LXRvcCBkYXRlcGlja2VyLW9yaWVudC1ib3R0b20gJytcblx0XHRcdFx0J2RhdGVwaWNrZXItb3JpZW50LXJpZ2h0IGRhdGVwaWNrZXItb3JpZW50LWxlZnQnXG5cdFx0XHQpO1xuXG5cdFx0XHRpZiAodGhpcy5vLm9yaWVudGF0aW9uLnggIT09ICdhdXRvJyl7XG5cdFx0XHRcdHRoaXMucGlja2VyLmFkZENsYXNzKCdkYXRlcGlja2VyLW9yaWVudC0nICsgdGhpcy5vLm9yaWVudGF0aW9uLngpO1xuXHRcdFx0XHRpZiAodGhpcy5vLm9yaWVudGF0aW9uLnggPT09ICdyaWdodCcpXG5cdFx0XHRcdFx0bGVmdCAtPSBjYWxlbmRhcldpZHRoIC0gd2lkdGg7XG5cdFx0XHR9XG5cdFx0XHQvLyBhdXRvIHggb3JpZW50YXRpb24gaXMgYmVzdC1wbGFjZW1lbnQ6IGlmIGl0IGNyb3NzZXMgYSB3aW5kb3dcblx0XHRcdC8vIGVkZ2UsIGZ1ZGdlIGl0IHNpZGV3YXlzXG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Ly8gRGVmYXVsdCB0byBsZWZ0XG5cdFx0XHRcdHRoaXMucGlja2VyLmFkZENsYXNzKCdkYXRlcGlja2VyLW9yaWVudC1sZWZ0Jyk7XG5cdFx0XHRcdGlmIChvZmZzZXQubGVmdCA8IDApXG5cdFx0XHRcdFx0bGVmdCAtPSBvZmZzZXQubGVmdCAtIHZpc3VhbFBhZGRpbmc7XG5cdFx0XHRcdGVsc2UgaWYgKG9mZnNldC5sZWZ0ICsgY2FsZW5kYXJXaWR0aCA+IHdpbmRvd1dpZHRoKVxuXHRcdFx0XHRcdGxlZnQgPSB3aW5kb3dXaWR0aCAtIGNhbGVuZGFyV2lkdGggLSB2aXN1YWxQYWRkaW5nO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBhdXRvIHkgb3JpZW50YXRpb24gaXMgYmVzdC1zaXR1YXRpb246IHRvcCBvciBib3R0b20sIG5vIGZ1ZGdpbmcsXG5cdFx0XHQvLyBkZWNpc2lvbiBiYXNlZCBvbiB3aGljaCBzaG93cyBtb3JlIG9mIHRoZSBjYWxlbmRhclxuXHRcdFx0dmFyIHlvcmllbnQgPSB0aGlzLm8ub3JpZW50YXRpb24ueSxcblx0XHRcdFx0dG9wX292ZXJmbG93LCBib3R0b21fb3ZlcmZsb3c7XG5cdFx0XHRpZiAoeW9yaWVudCA9PT0gJ2F1dG8nKXtcblx0XHRcdFx0dG9wX292ZXJmbG93ID0gLXNjcm9sbFRvcCArIG9mZnNldC50b3AgLSBjYWxlbmRhckhlaWdodDtcblx0XHRcdFx0Ym90dG9tX292ZXJmbG93ID0gc2Nyb2xsVG9wICsgd2luZG93SGVpZ2h0IC0gKG9mZnNldC50b3AgKyBoZWlnaHQgKyBjYWxlbmRhckhlaWdodCk7XG5cdFx0XHRcdGlmIChNYXRoLm1heCh0b3Bfb3ZlcmZsb3csIGJvdHRvbV9vdmVyZmxvdykgPT09IGJvdHRvbV9vdmVyZmxvdylcblx0XHRcdFx0XHR5b3JpZW50ID0gJ3RvcCc7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR5b3JpZW50ID0gJ2JvdHRvbSc7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnBpY2tlci5hZGRDbGFzcygnZGF0ZXBpY2tlci1vcmllbnQtJyArIHlvcmllbnQpO1xuXHRcdFx0aWYgKHlvcmllbnQgPT09ICd0b3AnKVxuXHRcdFx0XHR0b3AgKz0gaGVpZ2h0O1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHR0b3AgLT0gY2FsZW5kYXJIZWlnaHQgKyBwYXJzZUludCh0aGlzLnBpY2tlci5jc3MoJ3BhZGRpbmctdG9wJykpO1xuXG5cdFx0XHR0aGlzLnBpY2tlci5jc3Moe1xuXHRcdFx0XHR0b3A6IHRvcCxcblx0XHRcdFx0bGVmdDogbGVmdCxcblx0XHRcdFx0ekluZGV4OiB6SW5kZXhcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRfYWxsb3dfdXBkYXRlOiB0cnVlLFxuXHRcdHVwZGF0ZTogZnVuY3Rpb24oKXtcblx0XHRcdGlmICghdGhpcy5fYWxsb3dfdXBkYXRlKVxuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdHZhciBvbGREYXRlcyA9IHRoaXMuZGF0ZXMuY29weSgpLFxuXHRcdFx0XHRkYXRlcyA9IFtdLFxuXHRcdFx0XHRmcm9tQXJncyA9IGZhbHNlO1xuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGgpe1xuXHRcdFx0XHQkLmVhY2goYXJndW1lbnRzLCAkLnByb3h5KGZ1bmN0aW9uKGksIGRhdGUpe1xuXHRcdFx0XHRcdGlmIChkYXRlIGluc3RhbmNlb2YgRGF0ZSlcblx0XHRcdFx0XHRcdGRhdGUgPSB0aGlzLl9sb2NhbF90b191dGMoZGF0ZSk7XG5cdFx0XHRcdFx0ZGF0ZXMucHVzaChkYXRlKTtcblx0XHRcdFx0fSwgdGhpcykpO1xuXHRcdFx0XHRmcm9tQXJncyA9IHRydWU7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0ZGF0ZXMgPSB0aGlzLmlzSW5wdXRcblx0XHRcdFx0XHRcdD8gdGhpcy5lbGVtZW50LnZhbCgpXG5cdFx0XHRcdFx0XHQ6IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJykgfHwgdGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0JykudmFsKCk7XG5cdFx0XHRcdGlmIChkYXRlcyAmJiB0aGlzLm8ubXVsdGlkYXRlKVxuXHRcdFx0XHRcdGRhdGVzID0gZGF0ZXMuc3BsaXQodGhpcy5vLm11bHRpZGF0ZVNlcGFyYXRvcik7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRkYXRlcyA9IFtkYXRlc107XG5cdFx0XHRcdGRlbGV0ZSB0aGlzLmVsZW1lbnQuZGF0YSgpLmRhdGU7XG5cdFx0XHR9XG5cblx0XHRcdGRhdGVzID0gJC5tYXAoZGF0ZXMsICQucHJveHkoZnVuY3Rpb24oZGF0ZSl7XG5cdFx0XHRcdHJldHVybiBEUEdsb2JhbC5wYXJzZURhdGUoZGF0ZSwgdGhpcy5vLmZvcm1hdCwgdGhpcy5vLmxhbmd1YWdlKTtcblx0XHRcdH0sIHRoaXMpKTtcblx0XHRcdGRhdGVzID0gJC5ncmVwKGRhdGVzLCAkLnByb3h5KGZ1bmN0aW9uKGRhdGUpe1xuXHRcdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHRcdGRhdGUgPCB0aGlzLm8uc3RhcnREYXRlIHx8XG5cdFx0XHRcdFx0ZGF0ZSA+IHRoaXMuby5lbmREYXRlIHx8XG5cdFx0XHRcdFx0IWRhdGVcblx0XHRcdFx0KTtcblx0XHRcdH0sIHRoaXMpLCB0cnVlKTtcblx0XHRcdHRoaXMuZGF0ZXMucmVwbGFjZShkYXRlcyk7XG5cblx0XHRcdGlmICh0aGlzLmRhdGVzLmxlbmd0aClcblx0XHRcdFx0dGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZGF0ZXMuZ2V0KC0xKSk7XG5cdFx0XHRlbHNlIGlmICh0aGlzLnZpZXdEYXRlIDwgdGhpcy5vLnN0YXJ0RGF0ZSlcblx0XHRcdFx0dGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuby5zdGFydERhdGUpO1xuXHRcdFx0ZWxzZSBpZiAodGhpcy52aWV3RGF0ZSA+IHRoaXMuby5lbmREYXRlKVxuXHRcdFx0XHR0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUodGhpcy5vLmVuZERhdGUpO1xuXG5cdFx0XHRpZiAoZnJvbUFyZ3Mpe1xuXHRcdFx0XHQvLyBzZXR0aW5nIGRhdGUgYnkgY2xpY2tpbmdcblx0XHRcdFx0dGhpcy5zZXRWYWx1ZSgpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoZGF0ZXMubGVuZ3RoKXtcblx0XHRcdFx0Ly8gc2V0dGluZyBkYXRlIGJ5IHR5cGluZ1xuXHRcdFx0XHRpZiAoU3RyaW5nKG9sZERhdGVzKSAhPT0gU3RyaW5nKHRoaXMuZGF0ZXMpKVxuXHRcdFx0XHRcdHRoaXMuX3RyaWdnZXIoJ2NoYW5nZURhdGUnKTtcblx0XHRcdH1cblx0XHRcdGlmICghdGhpcy5kYXRlcy5sZW5ndGggJiYgb2xkRGF0ZXMubGVuZ3RoKVxuXHRcdFx0XHR0aGlzLl90cmlnZ2VyKCdjbGVhckRhdGUnKTtcblxuXHRcdFx0dGhpcy5maWxsKCk7XG5cdFx0fSxcblxuXHRcdGZpbGxEb3c6IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgZG93Q250ID0gdGhpcy5vLndlZWtTdGFydCxcblx0XHRcdFx0aHRtbCA9ICc8dHI+Jztcblx0XHRcdGlmICh0aGlzLm8uY2FsZW5kYXJXZWVrcyl7XG5cdFx0XHRcdHZhciBjZWxsID0gJzx0aCBjbGFzcz1cImN3XCI+Jm5ic3A7PC90aD4nO1xuXHRcdFx0XHRodG1sICs9IGNlbGw7XG5cdFx0XHRcdHRoaXMucGlja2VyLmZpbmQoJy5kYXRlcGlja2VyLWRheXMgdGhlYWQgdHI6Zmlyc3QtY2hpbGQnKS5wcmVwZW5kKGNlbGwpO1xuXHRcdFx0fVxuXHRcdFx0d2hpbGUgKGRvd0NudCA8IHRoaXMuby53ZWVrU3RhcnQgKyA3KXtcblx0XHRcdFx0aHRtbCArPSAnPHRoIGNsYXNzPVwiZG93XCI+JytkYXRlc1t0aGlzLm8ubGFuZ3VhZ2VdLmRheXNNaW5bKGRvd0NudCsrKSU3XSsnPC90aD4nO1xuXHRcdFx0fVxuXHRcdFx0aHRtbCArPSAnPC90cj4nO1xuXHRcdFx0dGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItZGF5cyB0aGVhZCcpLmFwcGVuZChodG1sKTtcblx0XHR9LFxuXG5cdFx0ZmlsbE1vbnRoczogZnVuY3Rpb24oKXtcblx0XHRcdHZhciBodG1sID0gJycsXG5cdFx0XHRpID0gMDtcblx0XHRcdHdoaWxlIChpIDwgMTIpe1xuXHRcdFx0XHRodG1sICs9ICc8c3BhbiBjbGFzcz1cIm1vbnRoXCI+JytkYXRlc1t0aGlzLm8ubGFuZ3VhZ2VdLm1vbnRoc1Nob3J0W2krK10rJzwvc3Bhbj4nO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItbW9udGhzIHRkJykuaHRtbChodG1sKTtcblx0XHR9LFxuXG5cdFx0c2V0UmFuZ2U6IGZ1bmN0aW9uKHJhbmdlKXtcblx0XHRcdGlmICghcmFuZ2UgfHwgIXJhbmdlLmxlbmd0aClcblx0XHRcdFx0ZGVsZXRlIHRoaXMucmFuZ2U7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRoaXMucmFuZ2UgPSAkLm1hcChyYW5nZSwgZnVuY3Rpb24oZCl7XG5cdFx0XHRcdFx0cmV0dXJuIGQudmFsdWVPZigpO1xuXHRcdFx0XHR9KTtcblx0XHRcdHRoaXMuZmlsbCgpO1xuXHRcdH0sXG5cblx0XHRnZXRDbGFzc05hbWVzOiBmdW5jdGlvbihkYXRlKXtcblx0XHRcdHZhciBjbHMgPSBbXSxcblx0XHRcdFx0eWVhciA9IHRoaXMudmlld0RhdGUuZ2V0VVRDRnVsbFllYXIoKSxcblx0XHRcdFx0bW9udGggPSB0aGlzLnZpZXdEYXRlLmdldFVUQ01vbnRoKCksXG5cdFx0XHRcdHRvZGF5ID0gbmV3IERhdGUoKTtcblx0XHRcdGlmIChkYXRlLmdldFVUQ0Z1bGxZZWFyKCkgPCB5ZWFyIHx8IChkYXRlLmdldFVUQ0Z1bGxZZWFyKCkgPT09IHllYXIgJiYgZGF0ZS5nZXRVVENNb250aCgpIDwgbW9udGgpKXtcblx0XHRcdFx0Y2xzLnB1c2goJ29sZCcpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoZGF0ZS5nZXRVVENGdWxsWWVhcigpID4geWVhciB8fCAoZGF0ZS5nZXRVVENGdWxsWWVhcigpID09PSB5ZWFyICYmIGRhdGUuZ2V0VVRDTW9udGgoKSA+IG1vbnRoKSl7XG5cdFx0XHRcdGNscy5wdXNoKCduZXcnKTtcblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLmZvY3VzRGF0ZSAmJiBkYXRlLnZhbHVlT2YoKSA9PT0gdGhpcy5mb2N1c0RhdGUudmFsdWVPZigpKVxuXHRcdFx0XHRjbHMucHVzaCgnZm9jdXNlZCcpO1xuXHRcdFx0Ly8gQ29tcGFyZSBpbnRlcm5hbCBVVEMgZGF0ZSB3aXRoIGxvY2FsIHRvZGF5LCBub3QgVVRDIHRvZGF5XG5cdFx0XHRpZiAodGhpcy5vLnRvZGF5SGlnaGxpZ2h0ICYmXG5cdFx0XHRcdGRhdGUuZ2V0VVRDRnVsbFllYXIoKSA9PT0gdG9kYXkuZ2V0RnVsbFllYXIoKSAmJlxuXHRcdFx0XHRkYXRlLmdldFVUQ01vbnRoKCkgPT09IHRvZGF5LmdldE1vbnRoKCkgJiZcblx0XHRcdFx0ZGF0ZS5nZXRVVENEYXRlKCkgPT09IHRvZGF5LmdldERhdGUoKSl7XG5cdFx0XHRcdGNscy5wdXNoKCd0b2RheScpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHRoaXMuZGF0ZXMuY29udGFpbnMoZGF0ZSkgIT09IC0xKVxuXHRcdFx0XHRjbHMucHVzaCgnYWN0aXZlJyk7XG5cdFx0XHRpZiAoZGF0ZS52YWx1ZU9mKCkgPCB0aGlzLm8uc3RhcnREYXRlIHx8IGRhdGUudmFsdWVPZigpID4gdGhpcy5vLmVuZERhdGUgfHxcblx0XHRcdFx0JC5pbkFycmF5KGRhdGUuZ2V0VVRDRGF5KCksIHRoaXMuby5kYXlzT2ZXZWVrRGlzYWJsZWQpICE9PSAtMSl7XG5cdFx0XHRcdGNscy5wdXNoKCdkaXNhYmxlZCcpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHRoaXMucmFuZ2Upe1xuXHRcdFx0XHRpZiAoZGF0ZSA+IHRoaXMucmFuZ2VbMF0gJiYgZGF0ZSA8IHRoaXMucmFuZ2VbdGhpcy5yYW5nZS5sZW5ndGgtMV0pe1xuXHRcdFx0XHRcdGNscy5wdXNoKCdyYW5nZScpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICgkLmluQXJyYXkoZGF0ZS52YWx1ZU9mKCksIHRoaXMucmFuZ2UpICE9PSAtMSl7XG5cdFx0XHRcdFx0Y2xzLnB1c2goJ3NlbGVjdGVkJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBjbHM7XG5cdFx0fSxcblxuXHRcdGZpbGw6IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgZCA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpLFxuXHRcdFx0XHR5ZWFyID0gZC5nZXRVVENGdWxsWWVhcigpLFxuXHRcdFx0XHRtb250aCA9IGQuZ2V0VVRDTW9udGgoKSxcblx0XHRcdFx0c3RhcnRZZWFyID0gdGhpcy5vLnN0YXJ0RGF0ZSAhPT0gLUluZmluaXR5ID8gdGhpcy5vLnN0YXJ0RGF0ZS5nZXRVVENGdWxsWWVhcigpIDogLUluZmluaXR5LFxuXHRcdFx0XHRzdGFydE1vbnRoID0gdGhpcy5vLnN0YXJ0RGF0ZSAhPT0gLUluZmluaXR5ID8gdGhpcy5vLnN0YXJ0RGF0ZS5nZXRVVENNb250aCgpIDogLUluZmluaXR5LFxuXHRcdFx0XHRlbmRZZWFyID0gdGhpcy5vLmVuZERhdGUgIT09IEluZmluaXR5ID8gdGhpcy5vLmVuZERhdGUuZ2V0VVRDRnVsbFllYXIoKSA6IEluZmluaXR5LFxuXHRcdFx0XHRlbmRNb250aCA9IHRoaXMuby5lbmREYXRlICE9PSBJbmZpbml0eSA/IHRoaXMuby5lbmREYXRlLmdldFVUQ01vbnRoKCkgOiBJbmZpbml0eSxcblx0XHRcdFx0dG9kYXl0eHQgPSBkYXRlc1t0aGlzLm8ubGFuZ3VhZ2VdLnRvZGF5IHx8IGRhdGVzWydlbiddLnRvZGF5IHx8ICcnLFxuXHRcdFx0XHRjbGVhcnR4dCA9IGRhdGVzW3RoaXMuby5sYW5ndWFnZV0uY2xlYXIgfHwgZGF0ZXNbJ2VuJ10uY2xlYXIgfHwgJycsXG5cdFx0XHRcdHRvb2x0aXA7XG5cdFx0XHR0aGlzLnBpY2tlci5maW5kKCcuZGF0ZXBpY2tlci1kYXlzIHRoZWFkIHRoLmRhdGVwaWNrZXItc3dpdGNoJylcblx0XHRcdFx0XHRcdC50ZXh0KGRhdGVzW3RoaXMuby5sYW5ndWFnZV0ubW9udGhzW21vbnRoXSsnICcreWVhcik7XG5cdFx0XHR0aGlzLnBpY2tlci5maW5kKCd0Zm9vdCB0aC50b2RheScpXG5cdFx0XHRcdFx0XHQudGV4dCh0b2RheXR4dClcblx0XHRcdFx0XHRcdC50b2dnbGUodGhpcy5vLnRvZGF5QnRuICE9PSBmYWxzZSk7XG5cdFx0XHR0aGlzLnBpY2tlci5maW5kKCd0Zm9vdCB0aC5jbGVhcicpXG5cdFx0XHRcdFx0XHQudGV4dChjbGVhcnR4dClcblx0XHRcdFx0XHRcdC50b2dnbGUodGhpcy5vLmNsZWFyQnRuICE9PSBmYWxzZSk7XG5cdFx0XHR0aGlzLnVwZGF0ZU5hdkFycm93cygpO1xuXHRcdFx0dGhpcy5maWxsTW9udGhzKCk7XG5cdFx0XHR2YXIgcHJldk1vbnRoID0gVVRDRGF0ZSh5ZWFyLCBtb250aC0xLCAyOCksXG5cdFx0XHRcdGRheSA9IERQR2xvYmFsLmdldERheXNJbk1vbnRoKHByZXZNb250aC5nZXRVVENGdWxsWWVhcigpLCBwcmV2TW9udGguZ2V0VVRDTW9udGgoKSk7XG5cdFx0XHRwcmV2TW9udGguc2V0VVRDRGF0ZShkYXkpO1xuXHRcdFx0cHJldk1vbnRoLnNldFVUQ0RhdGUoZGF5IC0gKHByZXZNb250aC5nZXRVVENEYXkoKSAtIHRoaXMuby53ZWVrU3RhcnQgKyA3KSU3KTtcblx0XHRcdHZhciBuZXh0TW9udGggPSBuZXcgRGF0ZShwcmV2TW9udGgpO1xuXHRcdFx0bmV4dE1vbnRoLnNldFVUQ0RhdGUobmV4dE1vbnRoLmdldFVUQ0RhdGUoKSArIDQyKTtcblx0XHRcdG5leHRNb250aCA9IG5leHRNb250aC52YWx1ZU9mKCk7XG5cdFx0XHR2YXIgaHRtbCA9IFtdO1xuXHRcdFx0dmFyIGNsc05hbWU7XG5cdFx0XHR3aGlsZSAocHJldk1vbnRoLnZhbHVlT2YoKSA8IG5leHRNb250aCl7XG5cdFx0XHRcdGlmIChwcmV2TW9udGguZ2V0VVRDRGF5KCkgPT09IHRoaXMuby53ZWVrU3RhcnQpe1xuXHRcdFx0XHRcdGh0bWwucHVzaCgnPHRyPicpO1xuXHRcdFx0XHRcdGlmICh0aGlzLm8uY2FsZW5kYXJXZWVrcyl7XG5cdFx0XHRcdFx0XHQvLyBJU08gODYwMTogRmlyc3Qgd2VlayBjb250YWlucyBmaXJzdCB0aHVyc2RheS5cblx0XHRcdFx0XHRcdC8vIElTTyBhbHNvIHN0YXRlcyB3ZWVrIHN0YXJ0cyBvbiBNb25kYXksIGJ1dCB3ZSBjYW4gYmUgbW9yZSBhYnN0cmFjdCBoZXJlLlxuXHRcdFx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0XHRcdC8vIFN0YXJ0IG9mIGN1cnJlbnQgd2VlazogYmFzZWQgb24gd2Vla3N0YXJ0L2N1cnJlbnQgZGF0ZVxuXHRcdFx0XHRcdFx0XHR3cyA9IG5ldyBEYXRlKCtwcmV2TW9udGggKyAodGhpcy5vLndlZWtTdGFydCAtIHByZXZNb250aC5nZXRVVENEYXkoKSAtIDcpICUgNyAqIDg2NGU1KSxcblx0XHRcdFx0XHRcdFx0Ly8gVGh1cnNkYXkgb2YgdGhpcyB3ZWVrXG5cdFx0XHRcdFx0XHRcdHRoID0gbmV3IERhdGUoTnVtYmVyKHdzKSArICg3ICsgNCAtIHdzLmdldFVUQ0RheSgpKSAlIDcgKiA4NjRlNSksXG5cdFx0XHRcdFx0XHRcdC8vIEZpcnN0IFRodXJzZGF5IG9mIHllYXIsIHllYXIgZnJvbSB0aHVyc2RheVxuXHRcdFx0XHRcdFx0XHR5dGggPSBuZXcgRGF0ZShOdW1iZXIoeXRoID0gVVRDRGF0ZSh0aC5nZXRVVENGdWxsWWVhcigpLCAwLCAxKSkgKyAoNyArIDQgLSB5dGguZ2V0VVRDRGF5KCkpJTcqODY0ZTUpLFxuXHRcdFx0XHRcdFx0XHQvLyBDYWxlbmRhciB3ZWVrOiBtcyBiZXR3ZWVuIHRodXJzZGF5cywgZGl2IG1zIHBlciBkYXksIGRpdiA3IGRheXNcblx0XHRcdFx0XHRcdFx0Y2FsV2VlayA9ICAodGggLSB5dGgpIC8gODY0ZTUgLyA3ICsgMTtcblx0XHRcdFx0XHRcdGh0bWwucHVzaCgnPHRkIGNsYXNzPVwiY3dcIj4nKyBjYWxXZWVrICsnPC90ZD4nKTtcblxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRjbHNOYW1lID0gdGhpcy5nZXRDbGFzc05hbWVzKHByZXZNb250aCk7XG5cdFx0XHRcdGNsc05hbWUucHVzaCgnZGF5Jyk7XG5cblx0XHRcdFx0aWYgKHRoaXMuby5iZWZvcmVTaG93RGF5ICE9PSAkLm5vb3Ape1xuXHRcdFx0XHRcdHZhciBiZWZvcmUgPSB0aGlzLm8uYmVmb3JlU2hvd0RheSh0aGlzLl91dGNfdG9fbG9jYWwocHJldk1vbnRoKSk7XG5cdFx0XHRcdFx0aWYgKGJlZm9yZSA9PT0gdW5kZWZpbmVkKVxuXHRcdFx0XHRcdFx0YmVmb3JlID0ge307XG5cdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mKGJlZm9yZSkgPT09ICdib29sZWFuJylcblx0XHRcdFx0XHRcdGJlZm9yZSA9IHtlbmFibGVkOiBiZWZvcmV9O1xuXHRcdFx0XHRcdGVsc2UgaWYgKHR5cGVvZihiZWZvcmUpID09PSAnc3RyaW5nJylcblx0XHRcdFx0XHRcdGJlZm9yZSA9IHtjbGFzc2VzOiBiZWZvcmV9O1xuXHRcdFx0XHRcdGlmIChiZWZvcmUuZW5hYmxlZCA9PT0gZmFsc2UpXG5cdFx0XHRcdFx0XHRjbHNOYW1lLnB1c2goJ2Rpc2FibGVkJyk7XG5cdFx0XHRcdFx0aWYgKGJlZm9yZS5jbGFzc2VzKVxuXHRcdFx0XHRcdFx0Y2xzTmFtZSA9IGNsc05hbWUuY29uY2F0KGJlZm9yZS5jbGFzc2VzLnNwbGl0KC9cXHMrLykpO1xuXHRcdFx0XHRcdGlmIChiZWZvcmUudG9vbHRpcClcblx0XHRcdFx0XHRcdHRvb2x0aXAgPSBiZWZvcmUudG9vbHRpcDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNsc05hbWUgPSAkLnVuaXF1ZShjbHNOYW1lKTtcblx0XHRcdFx0aHRtbC5wdXNoKCc8dGQgY2xhc3M9XCInK2Nsc05hbWUuam9pbignICcpKydcIicgKyAodG9vbHRpcCA/ICcgdGl0bGU9XCInK3Rvb2x0aXArJ1wiJyA6ICcnKSArICc+JytwcmV2TW9udGguZ2V0VVRDRGF0ZSgpICsgJzwvdGQ+Jyk7XG5cdFx0XHRcdGlmIChwcmV2TW9udGguZ2V0VVRDRGF5KCkgPT09IHRoaXMuby53ZWVrRW5kKXtcblx0XHRcdFx0XHRodG1sLnB1c2goJzwvdHI+Jyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cHJldk1vbnRoLnNldFVUQ0RhdGUocHJldk1vbnRoLmdldFVUQ0RhdGUoKSsxKTtcblx0XHRcdH1cblx0XHRcdHRoaXMucGlja2VyLmZpbmQoJy5kYXRlcGlja2VyLWRheXMgdGJvZHknKS5lbXB0eSgpLmFwcGVuZChodG1sLmpvaW4oJycpKTtcblxuXHRcdFx0dmFyIG1vbnRocyA9IHRoaXMucGlja2VyLmZpbmQoJy5kYXRlcGlja2VyLW1vbnRocycpXG5cdFx0XHRcdFx0XHQuZmluZCgndGg6ZXEoMSknKVxuXHRcdFx0XHRcdFx0XHQudGV4dCh5ZWFyKVxuXHRcdFx0XHRcdFx0XHQuZW5kKClcblx0XHRcdFx0XHRcdC5maW5kKCdzcGFuJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuXG5cdFx0XHQkLmVhY2godGhpcy5kYXRlcywgZnVuY3Rpb24oaSwgZCl7XG5cdFx0XHRcdGlmIChkLmdldFVUQ0Z1bGxZZWFyKCkgPT09IHllYXIpXG5cdFx0XHRcdFx0bW9udGhzLmVxKGQuZ2V0VVRDTW9udGgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICh5ZWFyIDwgc3RhcnRZZWFyIHx8IHllYXIgPiBlbmRZZWFyKXtcblx0XHRcdFx0bW9udGhzLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHllYXIgPT09IHN0YXJ0WWVhcil7XG5cdFx0XHRcdG1vbnRocy5zbGljZSgwLCBzdGFydE1vbnRoKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcblx0XHRcdH1cblx0XHRcdGlmICh5ZWFyID09PSBlbmRZZWFyKXtcblx0XHRcdFx0bW9udGhzLnNsaWNlKGVuZE1vbnRoKzEpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXHRcdFx0fVxuXG5cdFx0XHRodG1sID0gJyc7XG5cdFx0XHR5ZWFyID0gcGFyc2VJbnQoeWVhci8xMCwgMTApICogMTA7XG5cdFx0XHR2YXIgeWVhckNvbnQgPSB0aGlzLnBpY2tlci5maW5kKCcuZGF0ZXBpY2tlci15ZWFycycpXG5cdFx0XHRcdFx0XHRcdFx0LmZpbmQoJ3RoOmVxKDEpJylcblx0XHRcdFx0XHRcdFx0XHRcdC50ZXh0KHllYXIgKyAnLScgKyAoeWVhciArIDkpKVxuXHRcdFx0XHRcdFx0XHRcdFx0LmVuZCgpXG5cdFx0XHRcdFx0XHRcdFx0LmZpbmQoJ3RkJyk7XG5cdFx0XHR5ZWFyIC09IDE7XG5cdFx0XHR2YXIgeWVhcnMgPSAkLm1hcCh0aGlzLmRhdGVzLCBmdW5jdGlvbihkKXtcblx0XHRcdFx0XHRyZXR1cm4gZC5nZXRVVENGdWxsWWVhcigpO1xuXHRcdFx0XHR9KSxcblx0XHRcdFx0Y2xhc3Nlcztcblx0XHRcdGZvciAodmFyIGkgPSAtMTsgaSA8IDExOyBpKyspe1xuXHRcdFx0XHRjbGFzc2VzID0gWyd5ZWFyJ107XG5cdFx0XHRcdGlmIChpID09PSAtMSlcblx0XHRcdFx0XHRjbGFzc2VzLnB1c2goJ29sZCcpO1xuXHRcdFx0XHRlbHNlIGlmIChpID09PSAxMClcblx0XHRcdFx0XHRjbGFzc2VzLnB1c2goJ25ldycpO1xuXHRcdFx0XHRpZiAoJC5pbkFycmF5KHllYXIsIHllYXJzKSAhPT0gLTEpXG5cdFx0XHRcdFx0Y2xhc3Nlcy5wdXNoKCdhY3RpdmUnKTtcblx0XHRcdFx0aWYgKHllYXIgPCBzdGFydFllYXIgfHwgeWVhciA+IGVuZFllYXIpXG5cdFx0XHRcdFx0Y2xhc3Nlcy5wdXNoKCdkaXNhYmxlZCcpO1xuXHRcdFx0XHRodG1sICs9ICc8c3BhbiBjbGFzcz1cIicgKyBjbGFzc2VzLmpvaW4oJyAnKSArICdcIj4nK3llYXIrJzwvc3Bhbj4nO1xuXHRcdFx0XHR5ZWFyICs9IDE7XG5cdFx0XHR9XG5cdFx0XHR5ZWFyQ29udC5odG1sKGh0bWwpO1xuXHRcdH0sXG5cblx0XHR1cGRhdGVOYXZBcnJvd3M6IGZ1bmN0aW9uKCl7XG5cdFx0XHRpZiAoIXRoaXMuX2FsbG93X3VwZGF0ZSlcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHR2YXIgZCA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpLFxuXHRcdFx0XHR5ZWFyID0gZC5nZXRVVENGdWxsWWVhcigpLFxuXHRcdFx0XHRtb250aCA9IGQuZ2V0VVRDTW9udGgoKTtcblx0XHRcdHN3aXRjaCAodGhpcy52aWV3TW9kZSl7XG5cdFx0XHRcdGNhc2UgMDpcblx0XHRcdFx0XHRpZiAodGhpcy5vLnN0YXJ0RGF0ZSAhPT0gLUluZmluaXR5ICYmIHllYXIgPD0gdGhpcy5vLnN0YXJ0RGF0ZS5nZXRVVENGdWxsWWVhcigpICYmIG1vbnRoIDw9IHRoaXMuby5zdGFydERhdGUuZ2V0VVRDTW9udGgoKSl7XG5cdFx0XHRcdFx0XHR0aGlzLnBpY2tlci5maW5kKCcucHJldicpLmNzcyh7dmlzaWJpbGl0eTogJ2hpZGRlbid9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLnBpY2tlci5maW5kKCcucHJldicpLmNzcyh7dmlzaWJpbGl0eTogJ3Zpc2libGUnfSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICh0aGlzLm8uZW5kRGF0ZSAhPT0gSW5maW5pdHkgJiYgeWVhciA+PSB0aGlzLm8uZW5kRGF0ZS5nZXRVVENGdWxsWWVhcigpICYmIG1vbnRoID49IHRoaXMuby5lbmREYXRlLmdldFVUQ01vbnRoKCkpe1xuXHRcdFx0XHRcdFx0dGhpcy5waWNrZXIuZmluZCgnLm5leHQnKS5jc3Moe3Zpc2liaWxpdHk6ICdoaWRkZW4nfSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5waWNrZXIuZmluZCgnLm5leHQnKS5jc3Moe3Zpc2liaWxpdHk6ICd2aXNpYmxlJ30pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHRjYXNlIDI6XG5cdFx0XHRcdFx0aWYgKHRoaXMuby5zdGFydERhdGUgIT09IC1JbmZpbml0eSAmJiB5ZWFyIDw9IHRoaXMuby5zdGFydERhdGUuZ2V0VVRDRnVsbFllYXIoKSl7XG5cdFx0XHRcdFx0XHR0aGlzLnBpY2tlci5maW5kKCcucHJldicpLmNzcyh7dmlzaWJpbGl0eTogJ2hpZGRlbid9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLnBpY2tlci5maW5kKCcucHJldicpLmNzcyh7dmlzaWJpbGl0eTogJ3Zpc2libGUnfSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICh0aGlzLm8uZW5kRGF0ZSAhPT0gSW5maW5pdHkgJiYgeWVhciA+PSB0aGlzLm8uZW5kRGF0ZS5nZXRVVENGdWxsWWVhcigpKXtcblx0XHRcdFx0XHRcdHRoaXMucGlja2VyLmZpbmQoJy5uZXh0JykuY3NzKHt2aXNpYmlsaXR5OiAnaGlkZGVuJ30pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdHRoaXMucGlja2VyLmZpbmQoJy5uZXh0JykuY3NzKHt2aXNpYmlsaXR5OiAndmlzaWJsZSd9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdGNsaWNrOiBmdW5jdGlvbihlKXtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHZhciB0YXJnZXQgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCdzcGFuLCB0ZCwgdGgnKSxcblx0XHRcdFx0eWVhciwgbW9udGgsIGRheTtcblx0XHRcdGlmICh0YXJnZXQubGVuZ3RoID09PSAxKXtcblx0XHRcdFx0c3dpdGNoICh0YXJnZXRbMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSl7XG5cdFx0XHRcdFx0Y2FzZSAndGgnOlxuXHRcdFx0XHRcdFx0c3dpdGNoICh0YXJnZXRbMF0uY2xhc3NOYW1lKXtcblx0XHRcdFx0XHRcdFx0Y2FzZSAnZGF0ZXBpY2tlci1zd2l0Y2gnOlxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc2hvd01vZGUoMSk7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGNhc2UgJ3ByZXYnOlxuXHRcdFx0XHRcdFx0XHRjYXNlICduZXh0Jzpcblx0XHRcdFx0XHRcdFx0XHR2YXIgZGlyID0gRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0ubmF2U3RlcCAqICh0YXJnZXRbMF0uY2xhc3NOYW1lID09PSAncHJldicgPyAtMSA6IDEpO1xuXHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAodGhpcy52aWV3TW9kZSl7XG5cdFx0XHRcdFx0XHRcdFx0XHRjYXNlIDA6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMudmlld0RhdGUgPSB0aGlzLm1vdmVNb250aCh0aGlzLnZpZXdEYXRlLCBkaXIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLl90cmlnZ2VyKCdjaGFuZ2VNb250aCcsIHRoaXMudmlld0RhdGUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgMTpcblx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgMjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy52aWV3RGF0ZSA9IHRoaXMubW92ZVllYXIodGhpcy52aWV3RGF0ZSwgZGlyKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMudmlld01vZGUgPT09IDEpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5fdHJpZ2dlcignY2hhbmdlWWVhcicsIHRoaXMudmlld0RhdGUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5maWxsKCk7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGNhc2UgJ3RvZGF5Jzpcblx0XHRcdFx0XHRcdFx0XHR2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG5cdFx0XHRcdFx0XHRcdFx0ZGF0ZSA9IFVUQ0RhdGUoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIGRhdGUuZ2V0RGF0ZSgpLCAwLCAwLCAwKTtcblxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc2hvd01vZGUoLTIpO1xuXHRcdFx0XHRcdFx0XHRcdHZhciB3aGljaCA9IHRoaXMuby50b2RheUJ0biA9PT0gJ2xpbmtlZCcgPyBudWxsIDogJ3ZpZXcnO1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuX3NldERhdGUoZGF0ZSwgd2hpY2gpO1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRjYXNlICdjbGVhcic6XG5cdFx0XHRcdFx0XHRcdFx0dmFyIGVsZW1lbnQ7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuaXNJbnB1dClcblx0XHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQ7XG5cdFx0XHRcdFx0XHRcdFx0ZWxzZSBpZiAodGhpcy5jb21wb25lbnQpXG5cdFx0XHRcdFx0XHRcdFx0XHRlbGVtZW50ID0gdGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0Jyk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGVsZW1lbnQpXG5cdFx0XHRcdFx0XHRcdFx0XHRlbGVtZW50LnZhbChcIlwiKS5jaGFuZ2UoKTtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuX3RyaWdnZXIoJ2NoYW5nZURhdGUnKTtcblx0XHRcdFx0XHRcdFx0XHRpZiAodGhpcy5vLmF1dG9jbG9zZSlcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuaGlkZSgpO1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnc3Bhbic6XG5cdFx0XHRcdFx0XHRpZiAoIXRhcmdldC5pcygnLmRpc2FibGVkJykpe1xuXHRcdFx0XHRcdFx0XHR0aGlzLnZpZXdEYXRlLnNldFVUQ0RhdGUoMSk7XG5cdFx0XHRcdFx0XHRcdGlmICh0YXJnZXQuaXMoJy5tb250aCcpKXtcblx0XHRcdFx0XHRcdFx0XHRkYXkgPSAxO1xuXHRcdFx0XHRcdFx0XHRcdG1vbnRoID0gdGFyZ2V0LnBhcmVudCgpLmZpbmQoJ3NwYW4nKS5pbmRleCh0YXJnZXQpO1xuXHRcdFx0XHRcdFx0XHRcdHllYXIgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ0Z1bGxZZWFyKCk7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy52aWV3RGF0ZS5zZXRVVENNb250aChtb250aCk7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5fdHJpZ2dlcignY2hhbmdlTW9udGgnLCB0aGlzLnZpZXdEYXRlKTtcblx0XHRcdFx0XHRcdFx0XHRpZiAodGhpcy5vLm1pblZpZXdNb2RlID09PSAxKXtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuX3NldERhdGUoVVRDRGF0ZSh5ZWFyLCBtb250aCwgZGF5KSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdGRheSA9IDE7XG5cdFx0XHRcdFx0XHRcdFx0bW9udGggPSAwO1xuXHRcdFx0XHRcdFx0XHRcdHllYXIgPSBwYXJzZUludCh0YXJnZXQudGV4dCgpLCAxMCl8fDA7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy52aWV3RGF0ZS5zZXRVVENGdWxsWWVhcih5ZWFyKTtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLl90cmlnZ2VyKCdjaGFuZ2VZZWFyJywgdGhpcy52aWV3RGF0ZSk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuby5taW5WaWV3TW9kZSA9PT0gMil7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLl9zZXREYXRlKFVUQ0RhdGUoeWVhciwgbW9udGgsIGRheSkpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR0aGlzLnNob3dNb2RlKC0xKTtcblx0XHRcdFx0XHRcdFx0dGhpcy5maWxsKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICd0ZCc6XG5cdFx0XHRcdFx0XHRpZiAodGFyZ2V0LmlzKCcuZGF5JykgJiYgIXRhcmdldC5pcygnLmRpc2FibGVkJykpe1xuXHRcdFx0XHRcdFx0XHRkYXkgPSBwYXJzZUludCh0YXJnZXQudGV4dCgpLCAxMCl8fDE7XG5cdFx0XHRcdFx0XHRcdHllYXIgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ0Z1bGxZZWFyKCk7XG5cdFx0XHRcdFx0XHRcdG1vbnRoID0gdGhpcy52aWV3RGF0ZS5nZXRVVENNb250aCgpO1xuXHRcdFx0XHRcdFx0XHRpZiAodGFyZ2V0LmlzKCcub2xkJykpe1xuXHRcdFx0XHRcdFx0XHRcdGlmIChtb250aCA9PT0gMCl7XG5cdFx0XHRcdFx0XHRcdFx0XHRtb250aCA9IDExO1xuXHRcdFx0XHRcdFx0XHRcdFx0eWVhciAtPSAxO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdG1vbnRoIC09IDE7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGVsc2UgaWYgKHRhcmdldC5pcygnLm5ldycpKXtcblx0XHRcdFx0XHRcdFx0XHRpZiAobW9udGggPT09IDExKXtcblx0XHRcdFx0XHRcdFx0XHRcdG1vbnRoID0gMDtcblx0XHRcdFx0XHRcdFx0XHRcdHllYXIgKz0gMTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRtb250aCArPSAxO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR0aGlzLl9zZXREYXRlKFVUQ0RhdGUoeWVhciwgbW9udGgsIGRheSkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLnBpY2tlci5pcygnOnZpc2libGUnKSAmJiB0aGlzLl9mb2N1c2VkX2Zyb20pe1xuXHRcdFx0XHQkKHRoaXMuX2ZvY3VzZWRfZnJvbSkuZm9jdXMoKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0ZSB0aGlzLl9mb2N1c2VkX2Zyb207XG5cdFx0fSxcblxuXHRcdF90b2dnbGVfbXVsdGlkYXRlOiBmdW5jdGlvbihkYXRlKXtcblx0XHRcdHZhciBpeCA9IHRoaXMuZGF0ZXMuY29udGFpbnMoZGF0ZSk7XG5cdFx0XHRpZiAoIWRhdGUpe1xuXHRcdFx0XHR0aGlzLmRhdGVzLmNsZWFyKCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChpeCAhPT0gLTEpe1xuXHRcdFx0XHR0aGlzLmRhdGVzLnJlbW92ZShpeCk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0dGhpcy5kYXRlcy5wdXNoKGRhdGUpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHR5cGVvZiB0aGlzLm8ubXVsdGlkYXRlID09PSAnbnVtYmVyJylcblx0XHRcdFx0d2hpbGUgKHRoaXMuZGF0ZXMubGVuZ3RoID4gdGhpcy5vLm11bHRpZGF0ZSlcblx0XHRcdFx0XHR0aGlzLmRhdGVzLnJlbW92ZSgwKTtcblx0XHR9LFxuXG5cdFx0X3NldERhdGU6IGZ1bmN0aW9uKGRhdGUsIHdoaWNoKXtcblx0XHRcdGlmICghd2hpY2ggfHwgd2hpY2ggPT09ICdkYXRlJylcblx0XHRcdFx0dGhpcy5fdG9nZ2xlX211bHRpZGF0ZShkYXRlICYmIG5ldyBEYXRlKGRhdGUpKTtcblx0XHRcdGlmICghd2hpY2ggfHwgd2hpY2ggID09PSAndmlldycpXG5cdFx0XHRcdHRoaXMudmlld0RhdGUgPSBkYXRlICYmIG5ldyBEYXRlKGRhdGUpO1xuXG5cdFx0XHR0aGlzLmZpbGwoKTtcblx0XHRcdHRoaXMuc2V0VmFsdWUoKTtcblx0XHRcdHRoaXMuX3RyaWdnZXIoJ2NoYW5nZURhdGUnKTtcblx0XHRcdHZhciBlbGVtZW50O1xuXHRcdFx0aWYgKHRoaXMuaXNJbnB1dCl7XG5cdFx0XHRcdGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQ7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICh0aGlzLmNvbXBvbmVudCl7XG5cdFx0XHRcdGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZmluZCgnaW5wdXQnKTtcblx0XHRcdH1cblx0XHRcdGlmIChlbGVtZW50KXtcblx0XHRcdFx0ZWxlbWVudC5jaGFuZ2UoKTtcblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLm8uYXV0b2Nsb3NlICYmICghd2hpY2ggfHwgd2hpY2ggPT09ICdkYXRlJykpe1xuXHRcdFx0XHR0aGlzLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0bW92ZU1vbnRoOiBmdW5jdGlvbihkYXRlLCBkaXIpe1xuXHRcdFx0aWYgKCFkYXRlKVxuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0aWYgKCFkaXIpXG5cdFx0XHRcdHJldHVybiBkYXRlO1xuXHRcdFx0dmFyIG5ld19kYXRlID0gbmV3IERhdGUoZGF0ZS52YWx1ZU9mKCkpLFxuXHRcdFx0XHRkYXkgPSBuZXdfZGF0ZS5nZXRVVENEYXRlKCksXG5cdFx0XHRcdG1vbnRoID0gbmV3X2RhdGUuZ2V0VVRDTW9udGgoKSxcblx0XHRcdFx0bWFnID0gTWF0aC5hYnMoZGlyKSxcblx0XHRcdFx0bmV3X21vbnRoLCB0ZXN0O1xuXHRcdFx0ZGlyID0gZGlyID4gMCA/IDEgOiAtMTtcblx0XHRcdGlmIChtYWcgPT09IDEpe1xuXHRcdFx0XHR0ZXN0ID0gZGlyID09PSAtMVxuXHRcdFx0XHRcdC8vIElmIGdvaW5nIGJhY2sgb25lIG1vbnRoLCBtYWtlIHN1cmUgbW9udGggaXMgbm90IGN1cnJlbnQgbW9udGhcblx0XHRcdFx0XHQvLyAoZWcsIE1hciAzMSAtPiBGZWIgMzEgPT0gRmViIDI4LCBub3QgTWFyIDAyKVxuXHRcdFx0XHRcdD8gZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRcdHJldHVybiBuZXdfZGF0ZS5nZXRVVENNb250aCgpID09PSBtb250aDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gSWYgZ29pbmcgZm9yd2FyZCBvbmUgbW9udGgsIG1ha2Ugc3VyZSBtb250aCBpcyBhcyBleHBlY3RlZFxuXHRcdFx0XHRcdC8vIChlZywgSmFuIDMxIC0+IEZlYiAzMSA9PSBGZWIgMjgsIG5vdCBNYXIgMDIpXG5cdFx0XHRcdFx0OiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0cmV0dXJuIG5ld19kYXRlLmdldFVUQ01vbnRoKCkgIT09IG5ld19tb250aDtcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHRuZXdfbW9udGggPSBtb250aCArIGRpcjtcblx0XHRcdFx0bmV3X2RhdGUuc2V0VVRDTW9udGgobmV3X21vbnRoKTtcblx0XHRcdFx0Ly8gRGVjIC0+IEphbiAoMTIpIG9yIEphbiAtPiBEZWMgKC0xKSAtLSBsaW1pdCBleHBlY3RlZCBkYXRlIHRvIDAtMTFcblx0XHRcdFx0aWYgKG5ld19tb250aCA8IDAgfHwgbmV3X21vbnRoID4gMTEpXG5cdFx0XHRcdFx0bmV3X21vbnRoID0gKG5ld19tb250aCArIDEyKSAlIDEyO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdC8vIEZvciBtYWduaXR1ZGVzID4xLCBtb3ZlIG9uZSBtb250aCBhdCBhIHRpbWUuLi5cblx0XHRcdFx0Zm9yICh2YXIgaT0wOyBpIDwgbWFnOyBpKyspXG5cdFx0XHRcdFx0Ly8gLi4ud2hpY2ggbWlnaHQgZGVjcmVhc2UgdGhlIGRheSAoZWcsIEphbiAzMSB0byBGZWIgMjgsIGV0YykuLi5cblx0XHRcdFx0XHRuZXdfZGF0ZSA9IHRoaXMubW92ZU1vbnRoKG5ld19kYXRlLCBkaXIpO1xuXHRcdFx0XHQvLyAuLi50aGVuIHJlc2V0IHRoZSBkYXksIGtlZXBpbmcgaXQgaW4gdGhlIG5ldyBtb250aFxuXHRcdFx0XHRuZXdfbW9udGggPSBuZXdfZGF0ZS5nZXRVVENNb250aCgpO1xuXHRcdFx0XHRuZXdfZGF0ZS5zZXRVVENEYXRlKGRheSk7XG5cdFx0XHRcdHRlc3QgPSBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiBuZXdfbW9udGggIT09IG5ld19kYXRlLmdldFVUQ01vbnRoKCk7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHQvLyBDb21tb24gZGF0ZS1yZXNldHRpbmcgbG9vcCAtLSBpZiBkYXRlIGlzIGJleW9uZCBlbmQgb2YgbW9udGgsIG1ha2UgaXRcblx0XHRcdC8vIGVuZCBvZiBtb250aFxuXHRcdFx0d2hpbGUgKHRlc3QoKSl7XG5cdFx0XHRcdG5ld19kYXRlLnNldFVUQ0RhdGUoLS1kYXkpO1xuXHRcdFx0XHRuZXdfZGF0ZS5zZXRVVENNb250aChuZXdfbW9udGgpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG5ld19kYXRlO1xuXHRcdH0sXG5cblx0XHRtb3ZlWWVhcjogZnVuY3Rpb24oZGF0ZSwgZGlyKXtcblx0XHRcdHJldHVybiB0aGlzLm1vdmVNb250aChkYXRlLCBkaXIqMTIpO1xuXHRcdH0sXG5cblx0XHRkYXRlV2l0aGluUmFuZ2U6IGZ1bmN0aW9uKGRhdGUpe1xuXHRcdFx0cmV0dXJuIGRhdGUgPj0gdGhpcy5vLnN0YXJ0RGF0ZSAmJiBkYXRlIDw9IHRoaXMuby5lbmREYXRlO1xuXHRcdH0sXG5cblx0XHRrZXlkb3duOiBmdW5jdGlvbihlKXtcblx0XHRcdGlmICh0aGlzLnBpY2tlci5pcygnOm5vdCg6dmlzaWJsZSknKSl7XG5cdFx0XHRcdGlmIChlLmtleUNvZGUgPT09IDI3KSAvLyBhbGxvdyBlc2NhcGUgdG8gaGlkZSBhbmQgcmUtc2hvdyBwaWNrZXJcblx0XHRcdFx0XHR0aGlzLnNob3coKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGRhdGVDaGFuZ2VkID0gZmFsc2UsXG5cdFx0XHRcdGRpciwgbmV3RGF0ZSwgbmV3Vmlld0RhdGUsXG5cdFx0XHRcdGZvY3VzRGF0ZSA9IHRoaXMuZm9jdXNEYXRlIHx8IHRoaXMudmlld0RhdGU7XG5cdFx0XHRzd2l0Y2ggKGUua2V5Q29kZSl7XG5cdFx0XHRcdGNhc2UgMjc6IC8vIGVzY2FwZVxuXHRcdFx0XHRcdGlmICh0aGlzLmZvY3VzRGF0ZSl7XG5cdFx0XHRcdFx0XHR0aGlzLmZvY3VzRGF0ZSA9IG51bGw7XG5cdFx0XHRcdFx0XHR0aGlzLnZpZXdEYXRlID0gdGhpcy5kYXRlcy5nZXQoLTEpIHx8IHRoaXMudmlld0RhdGU7XG5cdFx0XHRcdFx0XHR0aGlzLmZpbGwoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0dGhpcy5oaWRlKCk7XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDM3OiAvLyBsZWZ0XG5cdFx0XHRcdGNhc2UgMzk6IC8vIHJpZ2h0XG5cdFx0XHRcdFx0aWYgKCF0aGlzLm8ua2V5Ym9hcmROYXZpZ2F0aW9uKVxuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0ZGlyID0gZS5rZXlDb2RlID09PSAzNyA/IC0xIDogMTtcblx0XHRcdFx0XHRpZiAoZS5jdHJsS2V5KXtcblx0XHRcdFx0XHRcdG5ld0RhdGUgPSB0aGlzLm1vdmVZZWFyKHRoaXMuZGF0ZXMuZ2V0KC0xKSB8fCBVVENUb2RheSgpLCBkaXIpO1xuXHRcdFx0XHRcdFx0bmV3Vmlld0RhdGUgPSB0aGlzLm1vdmVZZWFyKGZvY3VzRGF0ZSwgZGlyKTtcblx0XHRcdFx0XHRcdHRoaXMuX3RyaWdnZXIoJ2NoYW5nZVllYXInLCB0aGlzLnZpZXdEYXRlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoZS5zaGlmdEtleSl7XG5cdFx0XHRcdFx0XHRuZXdEYXRlID0gdGhpcy5tb3ZlTW9udGgodGhpcy5kYXRlcy5nZXQoLTEpIHx8IFVUQ1RvZGF5KCksIGRpcik7XG5cdFx0XHRcdFx0XHRuZXdWaWV3RGF0ZSA9IHRoaXMubW92ZU1vbnRoKGZvY3VzRGF0ZSwgZGlyKTtcblx0XHRcdFx0XHRcdHRoaXMuX3RyaWdnZXIoJ2NoYW5nZU1vbnRoJywgdGhpcy52aWV3RGF0ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0bmV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZGF0ZXMuZ2V0KC0xKSB8fCBVVENUb2RheSgpKTtcblx0XHRcdFx0XHRcdG5ld0RhdGUuc2V0VVRDRGF0ZShuZXdEYXRlLmdldFVUQ0RhdGUoKSArIGRpcik7XG5cdFx0XHRcdFx0XHRuZXdWaWV3RGF0ZSA9IG5ldyBEYXRlKGZvY3VzRGF0ZSk7XG5cdFx0XHRcdFx0XHRuZXdWaWV3RGF0ZS5zZXRVVENEYXRlKGZvY3VzRGF0ZS5nZXRVVENEYXRlKCkgKyBkaXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAodGhpcy5kYXRlV2l0aGluUmFuZ2UobmV3RGF0ZSkpe1xuXHRcdFx0XHRcdFx0dGhpcy5mb2N1c0RhdGUgPSB0aGlzLnZpZXdEYXRlID0gbmV3Vmlld0RhdGU7XG5cdFx0XHRcdFx0XHR0aGlzLnNldFZhbHVlKCk7XG5cdFx0XHRcdFx0XHR0aGlzLmZpbGwoKTtcblx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgMzg6IC8vIHVwXG5cdFx0XHRcdGNhc2UgNDA6IC8vIGRvd25cblx0XHRcdFx0XHRpZiAoIXRoaXMuby5rZXlib2FyZE5hdmlnYXRpb24pXG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRkaXIgPSBlLmtleUNvZGUgPT09IDM4ID8gLTEgOiAxO1xuXHRcdFx0XHRcdGlmIChlLmN0cmxLZXkpe1xuXHRcdFx0XHRcdFx0bmV3RGF0ZSA9IHRoaXMubW92ZVllYXIodGhpcy5kYXRlcy5nZXQoLTEpIHx8IFVUQ1RvZGF5KCksIGRpcik7XG5cdFx0XHRcdFx0XHRuZXdWaWV3RGF0ZSA9IHRoaXMubW92ZVllYXIoZm9jdXNEYXRlLCBkaXIpO1xuXHRcdFx0XHRcdFx0dGhpcy5fdHJpZ2dlcignY2hhbmdlWWVhcicsIHRoaXMudmlld0RhdGUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmIChlLnNoaWZ0S2V5KXtcblx0XHRcdFx0XHRcdG5ld0RhdGUgPSB0aGlzLm1vdmVNb250aCh0aGlzLmRhdGVzLmdldCgtMSkgfHwgVVRDVG9kYXkoKSwgZGlyKTtcblx0XHRcdFx0XHRcdG5ld1ZpZXdEYXRlID0gdGhpcy5tb3ZlTW9udGgoZm9jdXNEYXRlLCBkaXIpO1xuXHRcdFx0XHRcdFx0dGhpcy5fdHJpZ2dlcignY2hhbmdlTW9udGgnLCB0aGlzLnZpZXdEYXRlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRuZXdEYXRlID0gbmV3IERhdGUodGhpcy5kYXRlcy5nZXQoLTEpIHx8IFVUQ1RvZGF5KCkpO1xuXHRcdFx0XHRcdFx0bmV3RGF0ZS5zZXRVVENEYXRlKG5ld0RhdGUuZ2V0VVRDRGF0ZSgpICsgZGlyICogNyk7XG5cdFx0XHRcdFx0XHRuZXdWaWV3RGF0ZSA9IG5ldyBEYXRlKGZvY3VzRGF0ZSk7XG5cdFx0XHRcdFx0XHRuZXdWaWV3RGF0ZS5zZXRVVENEYXRlKGZvY3VzRGF0ZS5nZXRVVENEYXRlKCkgKyBkaXIgKiA3KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHRoaXMuZGF0ZVdpdGhpblJhbmdlKG5ld0RhdGUpKXtcblx0XHRcdFx0XHRcdHRoaXMuZm9jdXNEYXRlID0gdGhpcy52aWV3RGF0ZSA9IG5ld1ZpZXdEYXRlO1xuXHRcdFx0XHRcdFx0dGhpcy5zZXRWYWx1ZSgpO1xuXHRcdFx0XHRcdFx0dGhpcy5maWxsKCk7XG5cdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDMyOiAvLyBzcGFjZWJhclxuXHRcdFx0XHRcdC8vIFNwYWNlYmFyIGlzIHVzZWQgaW4gbWFudWFsbHkgdHlwaW5nIGRhdGVzIGluIHNvbWUgZm9ybWF0cy5cblx0XHRcdFx0XHQvLyBBcyBzdWNoLCBpdHMgYmVoYXZpb3Igc2hvdWxkIG5vdCBiZSBoaWphY2tlZC5cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAxMzogLy8gZW50ZXJcblx0XHRcdFx0XHRmb2N1c0RhdGUgPSB0aGlzLmZvY3VzRGF0ZSB8fCB0aGlzLmRhdGVzLmdldCgtMSkgfHwgdGhpcy52aWV3RGF0ZTtcblx0XHRcdFx0XHR0aGlzLl90b2dnbGVfbXVsdGlkYXRlKGZvY3VzRGF0ZSk7XG5cdFx0XHRcdFx0ZGF0ZUNoYW5nZWQgPSB0cnVlO1xuXHRcdFx0XHRcdHRoaXMuZm9jdXNEYXRlID0gbnVsbDtcblx0XHRcdFx0XHR0aGlzLnZpZXdEYXRlID0gdGhpcy5kYXRlcy5nZXQoLTEpIHx8IHRoaXMudmlld0RhdGU7XG5cdFx0XHRcdFx0dGhpcy5zZXRWYWx1ZSgpO1xuXHRcdFx0XHRcdHRoaXMuZmlsbCgpO1xuXHRcdFx0XHRcdGlmICh0aGlzLnBpY2tlci5pcygnOnZpc2libGUnKSl7XG5cdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5vLmF1dG9jbG9zZSlcblx0XHRcdFx0XHRcdFx0dGhpcy5oaWRlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDk6IC8vIHRhYlxuXHRcdFx0XHRcdHRoaXMuZm9jdXNEYXRlID0gbnVsbDtcblx0XHRcdFx0XHR0aGlzLnZpZXdEYXRlID0gdGhpcy5kYXRlcy5nZXQoLTEpIHx8IHRoaXMudmlld0RhdGU7XG5cdFx0XHRcdFx0dGhpcy5maWxsKCk7XG5cdFx0XHRcdFx0dGhpcy5oaWRlKCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZGF0ZUNoYW5nZWQpe1xuXHRcdFx0XHRpZiAodGhpcy5kYXRlcy5sZW5ndGgpXG5cdFx0XHRcdFx0dGhpcy5fdHJpZ2dlcignY2hhbmdlRGF0ZScpO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0dGhpcy5fdHJpZ2dlcignY2xlYXJEYXRlJyk7XG5cdFx0XHRcdHZhciBlbGVtZW50O1xuXHRcdFx0XHRpZiAodGhpcy5pc0lucHV0KXtcblx0XHRcdFx0XHRlbGVtZW50ID0gdGhpcy5lbGVtZW50O1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKHRoaXMuY29tcG9uZW50KXtcblx0XHRcdFx0XHRlbGVtZW50ID0gdGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0Jyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGVsZW1lbnQpe1xuXHRcdFx0XHRcdGVsZW1lbnQuY2hhbmdlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0c2hvd01vZGU6IGZ1bmN0aW9uKGRpcil7XG5cdFx0XHRpZiAoZGlyKXtcblx0XHRcdFx0dGhpcy52aWV3TW9kZSA9IE1hdGgubWF4KHRoaXMuby5taW5WaWV3TW9kZSwgTWF0aC5taW4oMiwgdGhpcy52aWV3TW9kZSArIGRpcikpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5waWNrZXJcblx0XHRcdFx0LmZpbmQoJz5kaXYnKVxuXHRcdFx0XHQuaGlkZSgpXG5cdFx0XHRcdC5maWx0ZXIoJy5kYXRlcGlja2VyLScrRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZSlcblx0XHRcdFx0XHQuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG5cdFx0XHR0aGlzLnVwZGF0ZU5hdkFycm93cygpO1xuXHRcdH1cblx0fTtcblxuXHR2YXIgRGF0ZVJhbmdlUGlja2VyID0gZnVuY3Rpb24oZWxlbWVudCwgb3B0aW9ucyl7XG5cdFx0dGhpcy5lbGVtZW50ID0gJChlbGVtZW50KTtcblx0XHR0aGlzLmlucHV0cyA9ICQubWFwKG9wdGlvbnMuaW5wdXRzLCBmdW5jdGlvbihpKXtcblx0XHRcdHJldHVybiBpLmpxdWVyeSA/IGlbMF0gOiBpO1xuXHRcdH0pO1xuXHRcdGRlbGV0ZSBvcHRpb25zLmlucHV0cztcblxuXHRcdCQodGhpcy5pbnB1dHMpXG5cdFx0XHQuZGF0ZXBpY2tlcihvcHRpb25zKVxuXHRcdFx0LmJpbmQoJ2NoYW5nZURhdGUnLCAkLnByb3h5KHRoaXMuZGF0ZVVwZGF0ZWQsIHRoaXMpKTtcblxuXHRcdHRoaXMucGlja2VycyA9ICQubWFwKHRoaXMuaW5wdXRzLCBmdW5jdGlvbihpKXtcblx0XHRcdHJldHVybiAkKGkpLmRhdGEoJ2RhdGVwaWNrZXInKTtcblx0XHR9KTtcblx0XHR0aGlzLnVwZGF0ZURhdGVzKCk7XG5cdH07XG5cdERhdGVSYW5nZVBpY2tlci5wcm90b3R5cGUgPSB7XG5cdFx0dXBkYXRlRGF0ZXM6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLmRhdGVzID0gJC5tYXAodGhpcy5waWNrZXJzLCBmdW5jdGlvbihpKXtcblx0XHRcdFx0cmV0dXJuIGkuZ2V0VVRDRGF0ZSgpO1xuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLnVwZGF0ZVJhbmdlcygpO1xuXHRcdH0sXG5cdFx0dXBkYXRlUmFuZ2VzOiBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIHJhbmdlID0gJC5tYXAodGhpcy5kYXRlcywgZnVuY3Rpb24oZCl7XG5cdFx0XHRcdHJldHVybiBkLnZhbHVlT2YoKTtcblx0XHRcdH0pO1xuXHRcdFx0JC5lYWNoKHRoaXMucGlja2VycywgZnVuY3Rpb24oaSwgcCl7XG5cdFx0XHRcdHAuc2V0UmFuZ2UocmFuZ2UpO1xuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRkYXRlVXBkYXRlZDogZnVuY3Rpb24oZSl7XG5cdFx0XHQvLyBgdGhpcy51cGRhdGluZ2AgaXMgYSB3b3JrYXJvdW5kIGZvciBwcmV2ZW50aW5nIGluZmluaXRlIHJlY3Vyc2lvblxuXHRcdFx0Ly8gYmV0d2VlbiBgY2hhbmdlRGF0ZWAgdHJpZ2dlcmluZyBhbmQgYHNldFVUQ0RhdGVgIGNhbGxpbmcuICBVbnRpbFxuXHRcdFx0Ly8gdGhlcmUgaXMgYSBiZXR0ZXIgbWVjaGFuaXNtLlxuXHRcdFx0aWYgKHRoaXMudXBkYXRpbmcpXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdHRoaXMudXBkYXRpbmcgPSB0cnVlO1xuXG5cdFx0XHR2YXIgZHAgPSAkKGUudGFyZ2V0KS5kYXRhKCdkYXRlcGlja2VyJyksXG5cdFx0XHRcdG5ld19kYXRlID0gZHAuZ2V0VVRDRGF0ZSgpLFxuXHRcdFx0XHRpID0gJC5pbkFycmF5KGUudGFyZ2V0LCB0aGlzLmlucHV0cyksXG5cdFx0XHRcdGwgPSB0aGlzLmlucHV0cy5sZW5ndGg7XG5cdFx0XHRpZiAoaSA9PT0gLTEpXG5cdFx0XHRcdHJldHVybjtcblxuXHRcdFx0JC5lYWNoKHRoaXMucGlja2VycywgZnVuY3Rpb24oaSwgcCl7XG5cdFx0XHRcdGlmICghcC5nZXRVVENEYXRlKCkpXG5cdFx0XHRcdFx0cC5zZXRVVENEYXRlKG5ld19kYXRlKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAobmV3X2RhdGUgPCB0aGlzLmRhdGVzW2ldKXtcblx0XHRcdFx0Ly8gRGF0ZSBiZWluZyBtb3ZlZCBlYXJsaWVyL2xlZnRcblx0XHRcdFx0d2hpbGUgKGkgPj0gMCAmJiBuZXdfZGF0ZSA8IHRoaXMuZGF0ZXNbaV0pe1xuXHRcdFx0XHRcdHRoaXMucGlja2Vyc1tpLS1dLnNldFVUQ0RhdGUobmV3X2RhdGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChuZXdfZGF0ZSA+IHRoaXMuZGF0ZXNbaV0pe1xuXHRcdFx0XHQvLyBEYXRlIGJlaW5nIG1vdmVkIGxhdGVyL3JpZ2h0XG5cdFx0XHRcdHdoaWxlIChpIDwgbCAmJiBuZXdfZGF0ZSA+IHRoaXMuZGF0ZXNbaV0pe1xuXHRcdFx0XHRcdHRoaXMucGlja2Vyc1tpKytdLnNldFVUQ0RhdGUobmV3X2RhdGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnVwZGF0ZURhdGVzKCk7XG5cblx0XHRcdGRlbGV0ZSB0aGlzLnVwZGF0aW5nO1xuXHRcdH0sXG5cdFx0cmVtb3ZlOiBmdW5jdGlvbigpe1xuXHRcdFx0JC5tYXAodGhpcy5waWNrZXJzLCBmdW5jdGlvbihwKXsgcC5yZW1vdmUoKTsgfSk7XG5cdFx0XHRkZWxldGUgdGhpcy5lbGVtZW50LmRhdGEoKS5kYXRlcGlja2VyO1xuXHRcdH1cblx0fTtcblxuXHRmdW5jdGlvbiBvcHRzX2Zyb21fZWwoZWwsIHByZWZpeCl7XG5cdFx0Ly8gRGVyaXZlIG9wdGlvbnMgZnJvbSBlbGVtZW50IGRhdGEtYXR0cnNcblx0XHR2YXIgZGF0YSA9ICQoZWwpLmRhdGEoKSxcblx0XHRcdG91dCA9IHt9LCBpbmtleSxcblx0XHRcdHJlcGxhY2UgPSBuZXcgUmVnRXhwKCdeJyArIHByZWZpeC50b0xvd2VyQ2FzZSgpICsgJyhbQS1aXSknKTtcblx0XHRwcmVmaXggPSBuZXcgUmVnRXhwKCdeJyArIHByZWZpeC50b0xvd2VyQ2FzZSgpKTtcblx0XHRmdW5jdGlvbiByZV9sb3dlcihfLGEpe1xuXHRcdFx0cmV0dXJuIGEudG9Mb3dlckNhc2UoKTtcblx0XHR9XG5cdFx0Zm9yICh2YXIga2V5IGluIGRhdGEpXG5cdFx0XHRpZiAocHJlZml4LnRlc3Qoa2V5KSl7XG5cdFx0XHRcdGlua2V5ID0ga2V5LnJlcGxhY2UocmVwbGFjZSwgcmVfbG93ZXIpO1xuXHRcdFx0XHRvdXRbaW5rZXldID0gZGF0YVtrZXldO1xuXHRcdFx0fVxuXHRcdHJldHVybiBvdXQ7XG5cdH1cblxuXHRmdW5jdGlvbiBvcHRzX2Zyb21fbG9jYWxlKGxhbmcpe1xuXHRcdC8vIERlcml2ZSBvcHRpb25zIGZyb20gbG9jYWxlIHBsdWdpbnNcblx0XHR2YXIgb3V0ID0ge307XG5cdFx0Ly8gQ2hlY2sgaWYgXCJkZS1ERVwiIHN0eWxlIGRhdGUgaXMgYXZhaWxhYmxlLCBpZiBub3QgbGFuZ3VhZ2Ugc2hvdWxkXG5cdFx0Ly8gZmFsbGJhY2sgdG8gMiBsZXR0ZXIgY29kZSBlZyBcImRlXCJcblx0XHRpZiAoIWRhdGVzW2xhbmddKXtcblx0XHRcdGxhbmcgPSBsYW5nLnNwbGl0KCctJylbMF07XG5cdFx0XHRpZiAoIWRhdGVzW2xhbmddKVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHZhciBkID0gZGF0ZXNbbGFuZ107XG5cdFx0JC5lYWNoKGxvY2FsZV9vcHRzLCBmdW5jdGlvbihpLGspe1xuXHRcdFx0aWYgKGsgaW4gZClcblx0XHRcdFx0b3V0W2tdID0gZFtrXTtcblx0XHR9KTtcblx0XHRyZXR1cm4gb3V0O1xuXHR9XG5cblx0dmFyIG9sZCA9ICQuZm4uZGF0ZXBpY2tlcjtcblx0JC5mbi5kYXRlcGlja2VyID0gZnVuY3Rpb24ob3B0aW9uKXtcblx0XHR2YXIgYXJncyA9IEFycmF5LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG5cdFx0YXJncy5zaGlmdCgpO1xuXHRcdHZhciBpbnRlcm5hbF9yZXR1cm47XG5cdFx0dGhpcy5lYWNoKGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgJHRoaXMgPSAkKHRoaXMpLFxuXHRcdFx0XHRkYXRhID0gJHRoaXMuZGF0YSgnZGF0ZXBpY2tlcicpLFxuXHRcdFx0XHRvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PT0gJ29iamVjdCcgJiYgb3B0aW9uO1xuXHRcdFx0aWYgKCFkYXRhKXtcblx0XHRcdFx0dmFyIGVsb3B0cyA9IG9wdHNfZnJvbV9lbCh0aGlzLCAnZGF0ZScpLFxuXHRcdFx0XHRcdC8vIFByZWxpbWluYXJ5IG90aW9uc1xuXHRcdFx0XHRcdHhvcHRzID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBlbG9wdHMsIG9wdGlvbnMpLFxuXHRcdFx0XHRcdGxvY29wdHMgPSBvcHRzX2Zyb21fbG9jYWxlKHhvcHRzLmxhbmd1YWdlKSxcblx0XHRcdFx0XHQvLyBPcHRpb25zIHByaW9yaXR5OiBqcyBhcmdzLCBkYXRhLWF0dHJzLCBsb2NhbGVzLCBkZWZhdWx0c1xuXHRcdFx0XHRcdG9wdHMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGxvY29wdHMsIGVsb3B0cywgb3B0aW9ucyk7XG5cdFx0XHRcdGlmICgkdGhpcy5pcygnLmlucHV0LWRhdGVyYW5nZScpIHx8IG9wdHMuaW5wdXRzKXtcblx0XHRcdFx0XHR2YXIgcm9wdHMgPSB7XG5cdFx0XHRcdFx0XHRpbnB1dHM6IG9wdHMuaW5wdXRzIHx8ICR0aGlzLmZpbmQoJ2lucHV0JykudG9BcnJheSgpXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHQkdGhpcy5kYXRhKCdkYXRlcGlja2VyJywgKGRhdGEgPSBuZXcgRGF0ZVJhbmdlUGlja2VyKHRoaXMsICQuZXh0ZW5kKG9wdHMsIHJvcHRzKSkpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHQkdGhpcy5kYXRhKCdkYXRlcGlja2VyJywgKGRhdGEgPSBuZXcgRGF0ZXBpY2tlcih0aGlzLCBvcHRzKSkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIGRhdGFbb3B0aW9uXSA9PT0gJ2Z1bmN0aW9uJyl7XG5cdFx0XHRcdGludGVybmFsX3JldHVybiA9IGRhdGFbb3B0aW9uXS5hcHBseShkYXRhLCBhcmdzKTtcblx0XHRcdFx0aWYgKGludGVybmFsX3JldHVybiAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRpZiAoaW50ZXJuYWxfcmV0dXJuICE9PSB1bmRlZmluZWQpXG5cdFx0XHRyZXR1cm4gaW50ZXJuYWxfcmV0dXJuO1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdHZhciBkZWZhdWx0cyA9ICQuZm4uZGF0ZXBpY2tlci5kZWZhdWx0cyA9IHtcblx0XHRhdXRvY2xvc2U6IGZhbHNlLFxuXHRcdGJlZm9yZVNob3dEYXk6ICQubm9vcCxcblx0XHRjYWxlbmRhcldlZWtzOiBmYWxzZSxcblx0XHRjbGVhckJ0bjogZmFsc2UsXG5cdFx0ZGF5c09mV2Vla0Rpc2FibGVkOiBbXSxcblx0XHRlbmREYXRlOiBJbmZpbml0eSxcblx0XHRmb3JjZVBhcnNlOiB0cnVlLFxuXHRcdGZvcm1hdDogJ21tL2RkL3l5eXknLFxuXHRcdGtleWJvYXJkTmF2aWdhdGlvbjogdHJ1ZSxcblx0XHRsYW5ndWFnZTogJ2VuJyxcblx0XHRtaW5WaWV3TW9kZTogMCxcblx0XHRtdWx0aWRhdGU6IGZhbHNlLFxuXHRcdG11bHRpZGF0ZVNlcGFyYXRvcjogJywnLFxuXHRcdG9yaWVudGF0aW9uOiBcImF1dG9cIixcblx0XHRydGw6IGZhbHNlLFxuXHRcdHN0YXJ0RGF0ZTogLUluZmluaXR5LFxuXHRcdHN0YXJ0VmlldzogMCxcblx0XHR0b2RheUJ0bjogZmFsc2UsXG5cdFx0dG9kYXlIaWdobGlnaHQ6IGZhbHNlLFxuXHRcdHdlZWtTdGFydDogMFxuXHR9O1xuXHR2YXIgbG9jYWxlX29wdHMgPSAkLmZuLmRhdGVwaWNrZXIubG9jYWxlX29wdHMgPSBbXG5cdFx0J2Zvcm1hdCcsXG5cdFx0J3J0bCcsXG5cdFx0J3dlZWtTdGFydCdcblx0XTtcblx0JC5mbi5kYXRlcGlja2VyLkNvbnN0cnVjdG9yID0gRGF0ZXBpY2tlcjtcblx0dmFyIGRhdGVzID0gJC5mbi5kYXRlcGlja2VyLmRhdGVzID0ge1xuXHRcdGVuOiB7XG5cdFx0XHRkYXlzOiBbXCJTdW5kYXlcIiwgXCJNb25kYXlcIiwgXCJUdWVzZGF5XCIsIFwiV2VkbmVzZGF5XCIsIFwiVGh1cnNkYXlcIiwgXCJGcmlkYXlcIiwgXCJTYXR1cmRheVwiLCBcIlN1bmRheVwiXSxcblx0XHRcdGRheXNTaG9ydDogW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCIsIFwiU3VuXCJdLFxuXHRcdFx0ZGF5c01pbjogW1wiU3VcIiwgXCJNb1wiLCBcIlR1XCIsIFwiV2VcIiwgXCJUaFwiLCBcIkZyXCIsIFwiU2FcIiwgXCJTdVwiXSxcblx0XHRcdG1vbnRoczogW1wiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCIsIFwiQXVndXN0XCIsIFwiU2VwdGVtYmVyXCIsIFwiT2N0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIl0sXG5cdFx0XHRtb250aHNTaG9ydDogW1wiSmFuXCIsIFwiRmViXCIsIFwiTWFyXCIsIFwiQXByXCIsIFwiTWF5XCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2N0XCIsIFwiTm92XCIsIFwiRGVjXCJdLFxuXHRcdFx0dG9kYXk6IFwiVG9kYXlcIixcblx0XHRcdGNsZWFyOiBcIkNsZWFyXCJcblx0XHR9XG5cdH07XG5cblx0dmFyIERQR2xvYmFsID0ge1xuXHRcdG1vZGVzOiBbXG5cdFx0XHR7XG5cdFx0XHRcdGNsc05hbWU6ICdkYXlzJyxcblx0XHRcdFx0bmF2Rm5jOiAnTW9udGgnLFxuXHRcdFx0XHRuYXZTdGVwOiAxXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRjbHNOYW1lOiAnbW9udGhzJyxcblx0XHRcdFx0bmF2Rm5jOiAnRnVsbFllYXInLFxuXHRcdFx0XHRuYXZTdGVwOiAxXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRjbHNOYW1lOiAneWVhcnMnLFxuXHRcdFx0XHRuYXZGbmM6ICdGdWxsWWVhcicsXG5cdFx0XHRcdG5hdlN0ZXA6IDEwXG5cdFx0fV0sXG5cdFx0aXNMZWFwWWVhcjogZnVuY3Rpb24oeWVhcil7XG5cdFx0XHRyZXR1cm4gKCgoeWVhciAlIDQgPT09IDApICYmICh5ZWFyICUgMTAwICE9PSAwKSkgfHwgKHllYXIgJSA0MDAgPT09IDApKTtcblx0XHR9LFxuXHRcdGdldERheXNJbk1vbnRoOiBmdW5jdGlvbih5ZWFyLCBtb250aCl7XG5cdFx0XHRyZXR1cm4gWzMxLCAoRFBHbG9iYWwuaXNMZWFwWWVhcih5ZWFyKSA/IDI5IDogMjgpLCAzMSwgMzAsIDMxLCAzMCwgMzEsIDMxLCAzMCwgMzEsIDMwLCAzMV1bbW9udGhdO1xuXHRcdH0sXG5cdFx0dmFsaWRQYXJ0czogL2RkP3xERD98bW0/fE1NP3x5eSg/Onl5KT8vZyxcblx0XHRub25wdW5jdHVhdGlvbjogL1teIC1cXC86LUBcXFtcXHUzNDAwLVxcdTlmZmYtYHstflxcdFxcblxccl0rL2csXG5cdFx0cGFyc2VGb3JtYXQ6IGZ1bmN0aW9uKGZvcm1hdCl7XG5cdFx0XHQvLyBJRSB0cmVhdHMgXFwwIGFzIGEgc3RyaW5nIGVuZCBpbiBpbnB1dHMgKHRydW5jYXRpbmcgdGhlIHZhbHVlKSxcblx0XHRcdC8vIHNvIGl0J3MgYSBiYWQgZm9ybWF0IGRlbGltaXRlciwgYW55d2F5XG5cdFx0XHR2YXIgc2VwYXJhdG9ycyA9IGZvcm1hdC5yZXBsYWNlKHRoaXMudmFsaWRQYXJ0cywgJ1xcMCcpLnNwbGl0KCdcXDAnKSxcblx0XHRcdFx0cGFydHMgPSBmb3JtYXQubWF0Y2godGhpcy52YWxpZFBhcnRzKTtcblx0XHRcdGlmICghc2VwYXJhdG9ycyB8fCAhc2VwYXJhdG9ycy5sZW5ndGggfHwgIXBhcnRzIHx8IHBhcnRzLmxlbmd0aCA9PT0gMCl7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZGF0ZSBmb3JtYXQuXCIpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHtzZXBhcmF0b3JzOiBzZXBhcmF0b3JzLCBwYXJ0czogcGFydHN9O1xuXHRcdH0sXG5cdFx0cGFyc2VEYXRlOiBmdW5jdGlvbihkYXRlLCBmb3JtYXQsIGxhbmd1YWdlKXtcblx0XHRcdGlmICghZGF0ZSlcblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdGlmIChkYXRlIGluc3RhbmNlb2YgRGF0ZSlcblx0XHRcdFx0cmV0dXJuIGRhdGU7XG5cdFx0XHRpZiAodHlwZW9mIGZvcm1hdCA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdGZvcm1hdCA9IERQR2xvYmFsLnBhcnNlRm9ybWF0KGZvcm1hdCk7XG5cdFx0XHR2YXIgcGFydF9yZSA9IC8oW1xcLStdXFxkKykoW2Rtd3ldKS8sXG5cdFx0XHRcdHBhcnRzID0gZGF0ZS5tYXRjaCgvKFtcXC0rXVxcZCspKFtkbXd5XSkvZyksXG5cdFx0XHRcdHBhcnQsIGRpciwgaTtcblx0XHRcdGlmICgvXltcXC0rXVxcZCtbZG13eV0oW1xccyxdK1tcXC0rXVxcZCtbZG13eV0pKiQvLnRlc3QoZGF0ZSkpe1xuXHRcdFx0XHRkYXRlID0gbmV3IERhdGUoKTtcblx0XHRcdFx0Zm9yIChpPTA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKyl7XG5cdFx0XHRcdFx0cGFydCA9IHBhcnRfcmUuZXhlYyhwYXJ0c1tpXSk7XG5cdFx0XHRcdFx0ZGlyID0gcGFyc2VJbnQocGFydFsxXSk7XG5cdFx0XHRcdFx0c3dpdGNoIChwYXJ0WzJdKXtcblx0XHRcdFx0XHRcdGNhc2UgJ2QnOlxuXHRcdFx0XHRcdFx0XHRkYXRlLnNldFVUQ0RhdGUoZGF0ZS5nZXRVVENEYXRlKCkgKyBkaXIpO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGNhc2UgJ20nOlxuXHRcdFx0XHRcdFx0XHRkYXRlID0gRGF0ZXBpY2tlci5wcm90b3R5cGUubW92ZU1vbnRoLmNhbGwoRGF0ZXBpY2tlci5wcm90b3R5cGUsIGRhdGUsIGRpcik7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0Y2FzZSAndyc6XG5cdFx0XHRcdFx0XHRcdGRhdGUuc2V0VVRDRGF0ZShkYXRlLmdldFVUQ0RhdGUoKSArIGRpciAqIDcpO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGNhc2UgJ3knOlxuXHRcdFx0XHRcdFx0XHRkYXRlID0gRGF0ZXBpY2tlci5wcm90b3R5cGUubW92ZVllYXIuY2FsbChEYXRlcGlja2VyLnByb3RvdHlwZSwgZGF0ZSwgZGlyKTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBVVENEYXRlKGRhdGUuZ2V0VVRDRnVsbFllYXIoKSwgZGF0ZS5nZXRVVENNb250aCgpLCBkYXRlLmdldFVUQ0RhdGUoKSwgMCwgMCwgMCk7XG5cdFx0XHR9XG5cdFx0XHRwYXJ0cyA9IGRhdGUgJiYgZGF0ZS5tYXRjaCh0aGlzLm5vbnB1bmN0dWF0aW9uKSB8fCBbXTtcblx0XHRcdGRhdGUgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0dmFyIHBhcnNlZCA9IHt9LFxuXHRcdFx0XHRzZXR0ZXJzX29yZGVyID0gWyd5eXl5JywgJ3l5JywgJ00nLCAnTU0nLCAnbScsICdtbScsICdkJywgJ2RkJ10sXG5cdFx0XHRcdHNldHRlcnNfbWFwID0ge1xuXHRcdFx0XHRcdHl5eXk6IGZ1bmN0aW9uKGQsdil7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZC5zZXRVVENGdWxsWWVhcih2KTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHl5OiBmdW5jdGlvbihkLHYpe1xuXHRcdFx0XHRcdFx0cmV0dXJuIGQuc2V0VVRDRnVsbFllYXIoMjAwMCt2KTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG06IGZ1bmN0aW9uKGQsdil7XG5cdFx0XHRcdFx0XHRpZiAoaXNOYU4oZCkpXG5cdFx0XHRcdFx0XHRcdHJldHVybiBkO1xuXHRcdFx0XHRcdFx0diAtPSAxO1xuXHRcdFx0XHRcdFx0d2hpbGUgKHYgPCAwKSB2ICs9IDEyO1xuXHRcdFx0XHRcdFx0diAlPSAxMjtcblx0XHRcdFx0XHRcdGQuc2V0VVRDTW9udGgodik7XG5cdFx0XHRcdFx0XHR3aGlsZSAoZC5nZXRVVENNb250aCgpICE9PSB2KVxuXHRcdFx0XHRcdFx0XHRkLnNldFVUQ0RhdGUoZC5nZXRVVENEYXRlKCktMSk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZDtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGQ6IGZ1bmN0aW9uKGQsdil7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZC5zZXRVVENEYXRlKHYpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0dmFsLCBmaWx0ZXJlZDtcblx0XHRcdHNldHRlcnNfbWFwWydNJ10gPSBzZXR0ZXJzX21hcFsnTU0nXSA9IHNldHRlcnNfbWFwWydtbSddID0gc2V0dGVyc19tYXBbJ20nXTtcblx0XHRcdHNldHRlcnNfbWFwWydkZCddID0gc2V0dGVyc19tYXBbJ2QnXTtcblx0XHRcdGRhdGUgPSBVVENEYXRlKGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF0ZS5nZXRNb250aCgpLCBkYXRlLmdldERhdGUoKSwgMCwgMCwgMCk7XG5cdFx0XHR2YXIgZnBhcnRzID0gZm9ybWF0LnBhcnRzLnNsaWNlKCk7XG5cdFx0XHQvLyBSZW1vdmUgbm9vcCBwYXJ0c1xuXHRcdFx0aWYgKHBhcnRzLmxlbmd0aCAhPT0gZnBhcnRzLmxlbmd0aCl7XG5cdFx0XHRcdGZwYXJ0cyA9ICQoZnBhcnRzKS5maWx0ZXIoZnVuY3Rpb24oaSxwKXtcblx0XHRcdFx0XHRyZXR1cm4gJC5pbkFycmF5KHAsIHNldHRlcnNfb3JkZXIpICE9PSAtMTtcblx0XHRcdFx0fSkudG9BcnJheSgpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gUHJvY2VzcyByZW1haW5kZXJcblx0XHRcdGZ1bmN0aW9uIG1hdGNoX3BhcnQoKXtcblx0XHRcdFx0dmFyIG0gPSB0aGlzLnNsaWNlKDAsIHBhcnRzW2ldLmxlbmd0aCksXG5cdFx0XHRcdFx0cCA9IHBhcnRzW2ldLnNsaWNlKDAsIG0ubGVuZ3RoKTtcblx0XHRcdFx0cmV0dXJuIG0gPT09IHA7XG5cdFx0XHR9XG5cdFx0XHRpZiAocGFydHMubGVuZ3RoID09PSBmcGFydHMubGVuZ3RoKXtcblx0XHRcdFx0dmFyIGNudDtcblx0XHRcdFx0Zm9yIChpPTAsIGNudCA9IGZwYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKyl7XG5cdFx0XHRcdFx0dmFsID0gcGFyc2VJbnQocGFydHNbaV0sIDEwKTtcblx0XHRcdFx0XHRwYXJ0ID0gZnBhcnRzW2ldO1xuXHRcdFx0XHRcdGlmIChpc05hTih2YWwpKXtcblx0XHRcdFx0XHRcdHN3aXRjaCAocGFydCl7XG5cdFx0XHRcdFx0XHRcdGNhc2UgJ01NJzpcblx0XHRcdFx0XHRcdFx0XHRmaWx0ZXJlZCA9ICQoZGF0ZXNbbGFuZ3VhZ2VdLm1vbnRocykuZmlsdGVyKG1hdGNoX3BhcnQpO1xuXHRcdFx0XHRcdFx0XHRcdHZhbCA9ICQuaW5BcnJheShmaWx0ZXJlZFswXSwgZGF0ZXNbbGFuZ3VhZ2VdLm1vbnRocykgKyAxO1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRjYXNlICdNJzpcblx0XHRcdFx0XHRcdFx0XHRmaWx0ZXJlZCA9ICQoZGF0ZXNbbGFuZ3VhZ2VdLm1vbnRoc1Nob3J0KS5maWx0ZXIobWF0Y2hfcGFydCk7XG5cdFx0XHRcdFx0XHRcdFx0dmFsID0gJC5pbkFycmF5KGZpbHRlcmVkWzBdLCBkYXRlc1tsYW5ndWFnZV0ubW9udGhzU2hvcnQpICsgMTtcblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cGFyc2VkW3BhcnRdID0gdmFsO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBfZGF0ZSwgcztcblx0XHRcdFx0Zm9yIChpPTA7IGkgPCBzZXR0ZXJzX29yZGVyLmxlbmd0aDsgaSsrKXtcblx0XHRcdFx0XHRzID0gc2V0dGVyc19vcmRlcltpXTtcblx0XHRcdFx0XHRpZiAocyBpbiBwYXJzZWQgJiYgIWlzTmFOKHBhcnNlZFtzXSkpe1xuXHRcdFx0XHRcdFx0X2RhdGUgPSBuZXcgRGF0ZShkYXRlKTtcblx0XHRcdFx0XHRcdHNldHRlcnNfbWFwW3NdKF9kYXRlLCBwYXJzZWRbc10pO1xuXHRcdFx0XHRcdFx0aWYgKCFpc05hTihfZGF0ZSkpXG5cdFx0XHRcdFx0XHRcdGRhdGUgPSBfZGF0ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBkYXRlO1xuXHRcdH0sXG5cdFx0Zm9ybWF0RGF0ZTogZnVuY3Rpb24oZGF0ZSwgZm9ybWF0LCBsYW5ndWFnZSl7XG5cdFx0XHRpZiAoIWRhdGUpXG5cdFx0XHRcdHJldHVybiAnJztcblx0XHRcdGlmICh0eXBlb2YgZm9ybWF0ID09PSAnc3RyaW5nJylcblx0XHRcdFx0Zm9ybWF0ID0gRFBHbG9iYWwucGFyc2VGb3JtYXQoZm9ybWF0KTtcblx0XHRcdHZhciB2YWwgPSB7XG5cdFx0XHRcdGQ6IGRhdGUuZ2V0VVRDRGF0ZSgpLFxuXHRcdFx0XHREOiBkYXRlc1tsYW5ndWFnZV0uZGF5c1Nob3J0W2RhdGUuZ2V0VVRDRGF5KCldLFxuXHRcdFx0XHRERDogZGF0ZXNbbGFuZ3VhZ2VdLmRheXNbZGF0ZS5nZXRVVENEYXkoKV0sXG5cdFx0XHRcdG06IGRhdGUuZ2V0VVRDTW9udGgoKSArIDEsXG5cdFx0XHRcdE06IGRhdGVzW2xhbmd1YWdlXS5tb250aHNTaG9ydFtkYXRlLmdldFVUQ01vbnRoKCldLFxuXHRcdFx0XHRNTTogZGF0ZXNbbGFuZ3VhZ2VdLm1vbnRoc1tkYXRlLmdldFVUQ01vbnRoKCldLFxuXHRcdFx0XHR5eTogZGF0ZS5nZXRVVENGdWxsWWVhcigpLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDIpLFxuXHRcdFx0XHR5eXl5OiBkYXRlLmdldFVUQ0Z1bGxZZWFyKClcblx0XHRcdH07XG5cdFx0XHR2YWwuZGQgPSAodmFsLmQgPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5kO1xuXHRcdFx0dmFsLm1tID0gKHZhbC5tIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwubTtcblx0XHRcdGRhdGUgPSBbXTtcblx0XHRcdHZhciBzZXBzID0gJC5leHRlbmQoW10sIGZvcm1hdC5zZXBhcmF0b3JzKTtcblx0XHRcdGZvciAodmFyIGk9MCwgY250ID0gZm9ybWF0LnBhcnRzLmxlbmd0aDsgaSA8PSBjbnQ7IGkrKyl7XG5cdFx0XHRcdGlmIChzZXBzLmxlbmd0aClcblx0XHRcdFx0XHRkYXRlLnB1c2goc2Vwcy5zaGlmdCgpKTtcblx0XHRcdFx0ZGF0ZS5wdXNoKHZhbFtmb3JtYXQucGFydHNbaV1dKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBkYXRlLmpvaW4oJycpO1xuXHRcdH0sXG5cdFx0aGVhZFRlbXBsYXRlOiAnPHRoZWFkPicrXG5cdFx0XHRcdFx0XHRcdCc8dHI+Jytcblx0XHRcdFx0XHRcdFx0XHQnPHRoIGNsYXNzPVwicHJldlwiPiZsYXF1bzs8L3RoPicrXG5cdFx0XHRcdFx0XHRcdFx0Jzx0aCBjb2xzcGFuPVwiNVwiIGNsYXNzPVwiZGF0ZXBpY2tlci1zd2l0Y2hcIj48L3RoPicrXG5cdFx0XHRcdFx0XHRcdFx0Jzx0aCBjbGFzcz1cIm5leHRcIj4mcmFxdW87PC90aD4nK1xuXHRcdFx0XHRcdFx0XHQnPC90cj4nK1xuXHRcdFx0XHRcdFx0JzwvdGhlYWQ+Jyxcblx0XHRjb250VGVtcGxhdGU6ICc8dGJvZHk+PHRyPjx0ZCBjb2xzcGFuPVwiN1wiPjwvdGQ+PC90cj48L3Rib2R5PicsXG5cdFx0Zm9vdFRlbXBsYXRlOiAnPHRmb290PicrXG5cdFx0XHRcdFx0XHRcdCc8dHI+Jytcblx0XHRcdFx0XHRcdFx0XHQnPHRoIGNvbHNwYW49XCI3XCIgY2xhc3M9XCJ0b2RheVwiPjwvdGg+Jytcblx0XHRcdFx0XHRcdFx0JzwvdHI+Jytcblx0XHRcdFx0XHRcdFx0Jzx0cj4nK1xuXHRcdFx0XHRcdFx0XHRcdCc8dGggY29sc3Bhbj1cIjdcIiBjbGFzcz1cImNsZWFyXCI+PC90aD4nK1xuXHRcdFx0XHRcdFx0XHQnPC90cj4nK1xuXHRcdFx0XHRcdFx0JzwvdGZvb3Q+J1xuXHR9O1xuXHREUEdsb2JhbC50ZW1wbGF0ZSA9ICc8ZGl2IGNsYXNzPVwiZGF0ZXBpY2tlclwiPicrXG5cdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiZGF0ZXBpY2tlci1kYXlzXCI+Jytcblx0XHRcdFx0XHRcdFx0XHQnPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtY29uZGVuc2VkXCI+Jytcblx0XHRcdFx0XHRcdFx0XHRcdERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcblx0XHRcdFx0XHRcdFx0XHRcdCc8dGJvZHk+PC90Ym9keT4nK1xuXHRcdFx0XHRcdFx0XHRcdFx0RFBHbG9iYWwuZm9vdFRlbXBsYXRlK1xuXHRcdFx0XHRcdFx0XHRcdCc8L3RhYmxlPicrXG5cdFx0XHRcdFx0XHRcdCc8L2Rpdj4nK1xuXHRcdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImRhdGVwaWNrZXItbW9udGhzXCI+Jytcblx0XHRcdFx0XHRcdFx0XHQnPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtY29uZGVuc2VkXCI+Jytcblx0XHRcdFx0XHRcdFx0XHRcdERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcblx0XHRcdFx0XHRcdFx0XHRcdERQR2xvYmFsLmNvbnRUZW1wbGF0ZStcblx0XHRcdFx0XHRcdFx0XHRcdERQR2xvYmFsLmZvb3RUZW1wbGF0ZStcblx0XHRcdFx0XHRcdFx0XHQnPC90YWJsZT4nK1xuXHRcdFx0XHRcdFx0XHQnPC9kaXY+Jytcblx0XHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJkYXRlcGlja2VyLXllYXJzXCI+Jytcblx0XHRcdFx0XHRcdFx0XHQnPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtY29uZGVuc2VkXCI+Jytcblx0XHRcdFx0XHRcdFx0XHRcdERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcblx0XHRcdFx0XHRcdFx0XHRcdERQR2xvYmFsLmNvbnRUZW1wbGF0ZStcblx0XHRcdFx0XHRcdFx0XHRcdERQR2xvYmFsLmZvb3RUZW1wbGF0ZStcblx0XHRcdFx0XHRcdFx0XHQnPC90YWJsZT4nK1xuXHRcdFx0XHRcdFx0XHQnPC9kaXY+Jytcblx0XHRcdFx0XHRcdCc8L2Rpdj4nO1xuXG5cdCQuZm4uZGF0ZXBpY2tlci5EUEdsb2JhbCA9IERQR2xvYmFsO1xuXG5cblx0LyogREFURVBJQ0tFUiBOTyBDT05GTElDVFxuXHQqID09PT09PT09PT09PT09PT09PT0gKi9cblxuXHQkLmZuLmRhdGVwaWNrZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uKCl7XG5cdFx0JC5mbi5kYXRlcGlja2VyID0gb2xkO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cblx0LyogREFURVBJQ0tFUiBEQVRBLUFQSVxuXHQqID09PT09PT09PT09PT09PT09PSAqL1xuXG5cdCQoZG9jdW1lbnQpLm9uKFxuXHRcdCdmb2N1cy5kYXRlcGlja2VyLmRhdGEtYXBpIGNsaWNrLmRhdGVwaWNrZXIuZGF0YS1hcGknLFxuXHRcdCdbZGF0YS1wcm92aWRlPVwiZGF0ZXBpY2tlclwiXScsXG5cdFx0ZnVuY3Rpb24oZSl7XG5cdFx0XHR2YXIgJHRoaXMgPSAkKHRoaXMpO1xuXHRcdFx0aWYgKCR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInKSlcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0Ly8gY29tcG9uZW50IGNsaWNrIHJlcXVpcmVzIHVzIHRvIGV4cGxpY2l0bHkgc2hvdyBpdFxuXHRcdFx0JHRoaXMuZGF0ZXBpY2tlcignc2hvdycpO1xuXHRcdH1cblx0KTtcblx0JChmdW5jdGlvbigpe1xuXHRcdCQoJ1tkYXRhLXByb3ZpZGU9XCJkYXRlcGlja2VyLWlubGluZVwiXScpLmRhdGVwaWNrZXIoKTtcblx0fSk7XG5cbn0od2luZG93LmpRdWVyeSkpO1xuIl19

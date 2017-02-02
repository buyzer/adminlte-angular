/**
* @version: 2.1.19
* @author: Dan Grossman http://www.dangrossman.info/
* @copyright: Copyright (c) 2012-2015 Dan Grossman. All rights reserved.
* @license: Licensed under the MIT license. See http://www.opensource.org/licenses/mit-license.php
* @website: https://www.improvely.com/
*/

(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['moment', 'jquery', 'exports'], function(momentjs, $, exports) {
      root.daterangepicker = factory(root, exports, momentjs, $);
    });

  } else if (typeof exports !== 'undefined') {
      var momentjs = require('moment');
      var jQuery = (typeof window != 'undefined') ? window.jQuery : undefined;  //isomorphic issue
      if (!jQuery) {
          try {
              jQuery = require('jquery');
              if (!jQuery.fn) jQuery.fn = {}; //isomorphic issue
          } catch (err) {
              if (!jQuery) throw new Error('jQuery dependency not found');
          }
      }

    factory(root, exports, momentjs, jQuery);

  // Finally, as a browser global.
  } else {
    root.daterangepicker = factory(root, {}, root.moment || moment, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this || {}, function(root, daterangepicker, moment, $) { // 'this' doesn't exist on a server

    var DateRangePicker = function(element, options, cb) {

        //default settings for options
        this.parentEl = 'body';
        this.element = $(element);
        this.startDate = moment().startOf('day');
        this.endDate = moment().endOf('day');
        this.minDate = false;
        this.maxDate = false;
        this.dateLimit = false;
        this.autoApply = false;
        this.singleDatePicker = false;
        this.showDropdowns = false;
        this.showWeekNumbers = false;
        this.showISOWeekNumbers = false;
        this.timePicker = false;
        this.timePicker24Hour = false;
        this.timePickerIncrement = 1;
        this.timePickerSeconds = false;
        this.linkedCalendars = true;
        this.autoUpdateInput = true;
        this.alwaysShowCalendars = false;
        this.ranges = {};

        this.opens = 'right';
        if (this.element.hasClass('pull-right'))
            this.opens = 'left';

        this.drops = 'down';
        if (this.element.hasClass('dropup'))
            this.drops = 'up';

        this.buttonClasses = 'btn btn-sm';
        this.applyClass = 'btn-success';
        this.cancelClass = 'btn-default';

        this.locale = {
            format: 'MM/DD/YYYY',
            separator: ' - ',
            applyLabel: 'Apply',
            cancelLabel: 'Cancel',
            weekLabel: 'W',
            customRangeLabel: 'Custom Range',
            daysOfWeek: moment.weekdaysMin(),
            monthNames: moment.monthsShort(),
            firstDay: moment.localeData().firstDayOfWeek()
        };

        this.callback = function() { };

        //some state information
        this.isShowing = false;
        this.leftCalendar = {};
        this.rightCalendar = {};

        //custom options from user
        if (typeof options !== 'object' || options === null)
            options = {};

        //allow setting options with data attributes
        //data-api options will be overwritten with custom javascript options
        options = $.extend(this.element.data(), options);

        //html template for the picker UI
        if (typeof options.template !== 'string' && !(options.template instanceof $))
            options.template = '<div class="daterangepicker dropdown-menu">' +
                '<div class="calendar left">' +
                    '<div class="daterangepicker_input">' +
                      '<input class="input-mini" type="text" name="daterangepicker_start" value="" />' +
                      '<i class="fa fa-calendar glyphicon glyphicon-calendar"></i>' +
                      '<div class="calendar-time">' +
                        '<div></div>' +
                        '<i class="fa fa-clock-o glyphicon glyphicon-time"></i>' +
                      '</div>' +
                    '</div>' +
                    '<div class="calendar-table"></div>' +
                '</div>' +
                '<div class="calendar right">' +
                    '<div class="daterangepicker_input">' +
                      '<input class="input-mini" type="text" name="daterangepicker_end" value="" />' +
                      '<i class="fa fa-calendar glyphicon glyphicon-calendar"></i>' +
                      '<div class="calendar-time">' +
                        '<div></div>' +
                        '<i class="fa fa-clock-o glyphicon glyphicon-time"></i>' +
                      '</div>' +
                    '</div>' +
                    '<div class="calendar-table"></div>' +
                '</div>' +
                '<div class="ranges">' +
                    '<div class="range_inputs">' +
                        '<button class="applyBtn" disabled="disabled" type="button"></button> ' +
                        '<button class="cancelBtn" type="button"></button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        this.parentEl = (options.parentEl && $(options.parentEl).length) ? $(options.parentEl) : $(this.parentEl);
        this.container = $(options.template).appendTo(this.parentEl);

        //
        // handle all the possible options overriding defaults
        //

        if (typeof options.locale === 'object') {

            if (typeof options.locale.format === 'string')
                this.locale.format = options.locale.format;

            if (typeof options.locale.separator === 'string')
                this.locale.separator = options.locale.separator;

            if (typeof options.locale.daysOfWeek === 'object')
                this.locale.daysOfWeek = options.locale.daysOfWeek.slice();

            if (typeof options.locale.monthNames === 'object')
              this.locale.monthNames = options.locale.monthNames.slice();

            if (typeof options.locale.firstDay === 'number')
              this.locale.firstDay = options.locale.firstDay;

            if (typeof options.locale.applyLabel === 'string')
              this.locale.applyLabel = options.locale.applyLabel;

            if (typeof options.locale.cancelLabel === 'string')
              this.locale.cancelLabel = options.locale.cancelLabel;

            if (typeof options.locale.weekLabel === 'string')
              this.locale.weekLabel = options.locale.weekLabel;

            if (typeof options.locale.customRangeLabel === 'string')
              this.locale.customRangeLabel = options.locale.customRangeLabel;

        }

        if (typeof options.startDate === 'string')
            this.startDate = moment(options.startDate, this.locale.format);

        if (typeof options.endDate === 'string')
            this.endDate = moment(options.endDate, this.locale.format);

        if (typeof options.minDate === 'string')
            this.minDate = moment(options.minDate, this.locale.format);

        if (typeof options.maxDate === 'string')
            this.maxDate = moment(options.maxDate, this.locale.format);

        if (typeof options.startDate === 'object')
            this.startDate = moment(options.startDate);

        if (typeof options.endDate === 'object')
            this.endDate = moment(options.endDate);

        if (typeof options.minDate === 'object')
            this.minDate = moment(options.minDate);

        if (typeof options.maxDate === 'object')
            this.maxDate = moment(options.maxDate);

        // sanity check for bad options
        if (this.minDate && this.startDate.isBefore(this.minDate))
            this.startDate = this.minDate.clone();

        // sanity check for bad options
        if (this.maxDate && this.endDate.isAfter(this.maxDate))
            this.endDate = this.maxDate.clone();

        if (typeof options.applyClass === 'string')
            this.applyClass = options.applyClass;

        if (typeof options.cancelClass === 'string')
            this.cancelClass = options.cancelClass;

        if (typeof options.dateLimit === 'object')
            this.dateLimit = options.dateLimit;

        if (typeof options.opens === 'string')
            this.opens = options.opens;

        if (typeof options.drops === 'string')
            this.drops = options.drops;

        if (typeof options.showWeekNumbers === 'boolean')
            this.showWeekNumbers = options.showWeekNumbers;

        if (typeof options.showISOWeekNumbers === 'boolean')
            this.showISOWeekNumbers = options.showISOWeekNumbers;

        if (typeof options.buttonClasses === 'string')
            this.buttonClasses = options.buttonClasses;

        if (typeof options.buttonClasses === 'object')
            this.buttonClasses = options.buttonClasses.join(' ');

        if (typeof options.showDropdowns === 'boolean')
            this.showDropdowns = options.showDropdowns;

        if (typeof options.singleDatePicker === 'boolean') {
            this.singleDatePicker = options.singleDatePicker;
            if (this.singleDatePicker)
                this.endDate = this.startDate.clone();
        }

        if (typeof options.timePicker === 'boolean')
            this.timePicker = options.timePicker;

        if (typeof options.timePickerSeconds === 'boolean')
            this.timePickerSeconds = options.timePickerSeconds;

        if (typeof options.timePickerIncrement === 'number')
            this.timePickerIncrement = options.timePickerIncrement;

        if (typeof options.timePicker24Hour === 'boolean')
            this.timePicker24Hour = options.timePicker24Hour;

        if (typeof options.autoApply === 'boolean')
            this.autoApply = options.autoApply;

        if (typeof options.autoUpdateInput === 'boolean')
            this.autoUpdateInput = options.autoUpdateInput;

        if (typeof options.linkedCalendars === 'boolean')
            this.linkedCalendars = options.linkedCalendars;

        if (typeof options.isInvalidDate === 'function')
            this.isInvalidDate = options.isInvalidDate;

        if (typeof options.alwaysShowCalendars === 'boolean')
            this.alwaysShowCalendars = options.alwaysShowCalendars;

        // update day names order to firstDay
        if (this.locale.firstDay != 0) {
            var iterator = this.locale.firstDay;
            while (iterator > 0) {
                this.locale.daysOfWeek.push(this.locale.daysOfWeek.shift());
                iterator--;
            }
        }

        var start, end, range;

        //if no start/end dates set, check if an input element contains initial values
        if (typeof options.startDate === 'undefined' && typeof options.endDate === 'undefined') {
            if ($(this.element).is('input[type=text]')) {
                var val = $(this.element).val(),
                    split = val.split(this.locale.separator);

                start = end = null;

                if (split.length == 2) {
                    start = moment(split[0], this.locale.format);
                    end = moment(split[1], this.locale.format);
                } else if (this.singleDatePicker && val !== "") {
                    start = moment(val, this.locale.format);
                    end = moment(val, this.locale.format);
                }
                if (start !== null && end !== null) {
                    this.setStartDate(start);
                    this.setEndDate(end);
                }
            }
        }

        if (typeof options.ranges === 'object') {
            for (range in options.ranges) {

                if (typeof options.ranges[range][0] === 'string')
                    start = moment(options.ranges[range][0], this.locale.format);
                else
                    start = moment(options.ranges[range][0]);

                if (typeof options.ranges[range][1] === 'string')
                    end = moment(options.ranges[range][1], this.locale.format);
                else
                    end = moment(options.ranges[range][1]);

                // If the start or end date exceed those allowed by the minDate or dateLimit
                // options, shorten the range to the allowable period.
                if (this.minDate && start.isBefore(this.minDate))
                    start = this.minDate.clone();

                var maxDate = this.maxDate;
                if (this.dateLimit && start.clone().add(this.dateLimit).isAfter(maxDate))
                    maxDate = start.clone().add(this.dateLimit);
                if (maxDate && end.isAfter(maxDate))
                    end = maxDate.clone();

                // If the end of the range is before the minimum or the start of the range is
                // after the maximum, don't display this range option at all.
                if ((this.minDate && end.isBefore(this.minDate)) || (maxDate && start.isAfter(maxDate)))
                    continue;
                
                //Support unicode chars in the range names.
                var elem = document.createElement('textarea');
                elem.innerHTML = range;
                var rangeHtml = elem.value;

                this.ranges[rangeHtml] = [start, end];
            }

            var list = '<ul>';
            for (range in this.ranges) {
                list += '<li>' + range + '</li>';
            }
            list += '<li>' + this.locale.customRangeLabel + '</li>';
            list += '</ul>';
            this.container.find('.ranges').prepend(list);
        }

        if (typeof cb === 'function') {
            this.callback = cb;
        }

        if (!this.timePicker) {
            this.startDate = this.startDate.startOf('day');
            this.endDate = this.endDate.endOf('day');
            this.container.find('.calendar-time').hide();
        }

        //can't be used together for now
        if (this.timePicker && this.autoApply)
            this.autoApply = false;

        if (this.autoApply && typeof options.ranges !== 'object') {
            this.container.find('.ranges').hide();
        } else if (this.autoApply) {
            this.container.find('.applyBtn, .cancelBtn').addClass('hide');
        }

        if (this.singleDatePicker) {
            this.container.addClass('single');
            this.container.find('.calendar.left').addClass('single');
            this.container.find('.calendar.left').show();
            this.container.find('.calendar.right').hide();
            this.container.find('.daterangepicker_input input, .daterangepicker_input i').hide();
            if (!this.timePicker) {
                this.container.find('.ranges').hide();
            }
        }

        if ((typeof options.ranges === 'undefined' && !this.singleDatePicker) || this.alwaysShowCalendars) {
            this.container.addClass('show-calendar');
        }

        this.container.addClass('opens' + this.opens);

        //swap the position of the predefined ranges if opens right
        if (typeof options.ranges !== 'undefined' && this.opens == 'right') {
            var ranges = this.container.find('.ranges');
            var html = ranges.clone();
            ranges.remove();
            this.container.find('.calendar.left').parent().prepend(html);
        }

        //apply CSS classes and labels to buttons
        this.container.find('.applyBtn, .cancelBtn').addClass(this.buttonClasses);
        if (this.applyClass.length)
            this.container.find('.applyBtn').addClass(this.applyClass);
        if (this.cancelClass.length)
            this.container.find('.cancelBtn').addClass(this.cancelClass);
        this.container.find('.applyBtn').html(this.locale.applyLabel);
        this.container.find('.cancelBtn').html(this.locale.cancelLabel);

        //
        // event listeners
        //

        this.container.find('.calendar')
            .on('click.daterangepicker', '.prev', $.proxy(this.clickPrev, this))
            .on('click.daterangepicker', '.next', $.proxy(this.clickNext, this))
            .on('click.daterangepicker', 'td.available', $.proxy(this.clickDate, this))
            .on('mouseenter.daterangepicker', 'td.available', $.proxy(this.hoverDate, this))
            .on('mouseleave.daterangepicker', 'td.available', $.proxy(this.updateFormInputs, this))
            .on('change.daterangepicker', 'select.yearselect', $.proxy(this.monthOrYearChanged, this))
            .on('change.daterangepicker', 'select.monthselect', $.proxy(this.monthOrYearChanged, this))
            .on('change.daterangepicker', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', $.proxy(this.timeChanged, this))
            .on('click.daterangepicker', '.daterangepicker_input input', $.proxy(this.showCalendars, this))
            //.on('keyup.daterangepicker', '.daterangepicker_input input', $.proxy(this.formInputsChanged, this))
            .on('change.daterangepicker', '.daterangepicker_input input', $.proxy(this.formInputsChanged, this));

        this.container.find('.ranges')
            .on('click.daterangepicker', 'button.applyBtn', $.proxy(this.clickApply, this))
            .on('click.daterangepicker', 'button.cancelBtn', $.proxy(this.clickCancel, this))
            .on('click.daterangepicker', 'li', $.proxy(this.clickRange, this))
            .on('mouseenter.daterangepicker', 'li', $.proxy(this.hoverRange, this))
            .on('mouseleave.daterangepicker', 'li', $.proxy(this.updateFormInputs, this));

        if (this.element.is('input')) {
            this.element.on({
                'click.daterangepicker': $.proxy(this.show, this),
                'focus.daterangepicker': $.proxy(this.show, this),
                'keyup.daterangepicker': $.proxy(this.elementChanged, this),
                'keydown.daterangepicker': $.proxy(this.keydown, this)
            });
        } else {
            this.element.on('click.daterangepicker', $.proxy(this.toggle, this));
        }

        //
        // if attached to a text input, set the initial value
        //

        if (this.element.is('input') && !this.singleDatePicker && this.autoUpdateInput) {
            this.element.val(this.startDate.format(this.locale.format) + this.locale.separator + this.endDate.format(this.locale.format));
            this.element.trigger('change');
        } else if (this.element.is('input') && this.autoUpdateInput) {
            this.element.val(this.startDate.format(this.locale.format));
            this.element.trigger('change');
        }

    };

    DateRangePicker.prototype = {

        constructor: DateRangePicker,

        setStartDate: function(startDate) {
            if (typeof startDate === 'string')
                this.startDate = moment(startDate, this.locale.format);

            if (typeof startDate === 'object')
                this.startDate = moment(startDate);

            if (!this.timePicker)
                this.startDate = this.startDate.startOf('day');

            if (this.timePicker && this.timePickerIncrement)
                this.startDate.minute(Math.round(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);

            if (this.minDate && this.startDate.isBefore(this.minDate))
                this.startDate = this.minDate;

            if (this.maxDate && this.startDate.isAfter(this.maxDate))
                this.startDate = this.maxDate;

            if (!this.isShowing)
                this.updateElement();

            this.updateMonthsInView();
        },

        setEndDate: function(endDate) {
            if (typeof endDate === 'string')
                this.endDate = moment(endDate, this.locale.format);

            if (typeof endDate === 'object')
                this.endDate = moment(endDate);

            if (!this.timePicker)
                this.endDate = this.endDate.endOf('day');

            if (this.timePicker && this.timePickerIncrement)
                this.endDate.minute(Math.round(this.endDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);

            if (this.endDate.isBefore(this.startDate))
                this.endDate = this.startDate.clone();

            if (this.maxDate && this.endDate.isAfter(this.maxDate))
                this.endDate = this.maxDate;

            if (this.dateLimit && this.startDate.clone().add(this.dateLimit).isBefore(this.endDate))
                this.endDate = this.startDate.clone().add(this.dateLimit);

            this.previousRightTime = this.endDate.clone();

            if (!this.isShowing)
                this.updateElement();

            this.updateMonthsInView();
        },

        isInvalidDate: function() {
            return false;
        },

        updateView: function() {
            if (this.timePicker) {
                this.renderTimePicker('left');
                this.renderTimePicker('right');
                if (!this.endDate) {
                    this.container.find('.right .calendar-time select').attr('disabled', 'disabled').addClass('disabled');
                } else {
                    this.container.find('.right .calendar-time select').removeAttr('disabled').removeClass('disabled');
                }
            }
            if (this.endDate) {
                this.container.find('input[name="daterangepicker_end"]').removeClass('active');
                this.container.find('input[name="daterangepicker_start"]').addClass('active');
            } else {
                this.container.find('input[name="daterangepicker_end"]').addClass('active');
                this.container.find('input[name="daterangepicker_start"]').removeClass('active');
            }
            this.updateMonthsInView();
            this.updateCalendars();
            this.updateFormInputs();
        },

        updateMonthsInView: function() {
            if (this.endDate) {

                //if both dates are visible already, do nothing
                if (!this.singleDatePicker && this.leftCalendar.month && this.rightCalendar.month &&
                    (this.startDate.format('YYYY-MM') == this.leftCalendar.month.format('YYYY-MM') || this.startDate.format('YYYY-MM') == this.rightCalendar.month.format('YYYY-MM'))
                    &&
                    (this.endDate.format('YYYY-MM') == this.leftCalendar.month.format('YYYY-MM') || this.endDate.format('YYYY-MM') == this.rightCalendar.month.format('YYYY-MM'))
                    ) {
                    return;
                }

                this.leftCalendar.month = this.startDate.clone().date(2);
                if (!this.linkedCalendars && (this.endDate.month() != this.startDate.month() || this.endDate.year() != this.startDate.year())) {
                    this.rightCalendar.month = this.endDate.clone().date(2);
                } else {
                    this.rightCalendar.month = this.startDate.clone().date(2).add(1, 'month');
                }
                
            } else {
                if (this.leftCalendar.month.format('YYYY-MM') != this.startDate.format('YYYY-MM') && this.rightCalendar.month.format('YYYY-MM') != this.startDate.format('YYYY-MM')) {
                    this.leftCalendar.month = this.startDate.clone().date(2);
                    this.rightCalendar.month = this.startDate.clone().date(2).add(1, 'month');
                }
            }
        },

        updateCalendars: function() {

            if (this.timePicker) {
                var hour, minute, second;
                if (this.endDate) {
                    hour = parseInt(this.container.find('.left .hourselect').val(), 10);
                    minute = parseInt(this.container.find('.left .minuteselect').val(), 10);
                    second = this.timePickerSeconds ? parseInt(this.container.find('.left .secondselect').val(), 10) : 0;
                    if (!this.timePicker24Hour) {
                        var ampm = this.container.find('.left .ampmselect').val();
                        if (ampm === 'PM' && hour < 12)
                            hour += 12;
                        if (ampm === 'AM' && hour === 12)
                            hour = 0;
                    }
                } else {
                    hour = parseInt(this.container.find('.right .hourselect').val(), 10);
                    minute = parseInt(this.container.find('.right .minuteselect').val(), 10);
                    second = this.timePickerSeconds ? parseInt(this.container.find('.right .secondselect').val(), 10) : 0;
                    if (!this.timePicker24Hour) {
                        var ampm = this.container.find('.right .ampmselect').val();
                        if (ampm === 'PM' && hour < 12)
                            hour += 12;
                        if (ampm === 'AM' && hour === 12)
                            hour = 0;
                    }
                }
                this.leftCalendar.month.hour(hour).minute(minute).second(second);
                this.rightCalendar.month.hour(hour).minute(minute).second(second);
            }

            this.renderCalendar('left');
            this.renderCalendar('right');

            //highlight any predefined range matching the current start and end dates
            this.container.find('.ranges li').removeClass('active');
            if (this.endDate == null) return;

            this.calculateChosenLabel();
        },

        renderCalendar: function(side) {

            //
            // Build the matrix of dates that will populate the calendar
            //

            var calendar = side == 'left' ? this.leftCalendar : this.rightCalendar;
            var month = calendar.month.month();
            var year = calendar.month.year();
            var hour = calendar.month.hour();
            var minute = calendar.month.minute();
            var second = calendar.month.second();
            var daysInMonth = moment([year, month]).daysInMonth();
            var firstDay = moment([year, month, 1]);
            var lastDay = moment([year, month, daysInMonth]);
            var lastMonth = moment(firstDay).subtract(1, 'month').month();
            var lastYear = moment(firstDay).subtract(1, 'month').year();
            var daysInLastMonth = moment([lastYear, lastMonth]).daysInMonth();
            var dayOfWeek = firstDay.day();

            //initialize a 6 rows x 7 columns array for the calendar
            var calendar = [];
            calendar.firstDay = firstDay;
            calendar.lastDay = lastDay;

            for (var i = 0; i < 6; i++) {
                calendar[i] = [];
            }

            //populate the calendar with date objects
            var startDay = daysInLastMonth - dayOfWeek + this.locale.firstDay + 1;
            if (startDay > daysInLastMonth)
                startDay -= 7;

            if (dayOfWeek == this.locale.firstDay)
                startDay = daysInLastMonth - 6;

            var curDate = moment([lastYear, lastMonth, startDay, 12, minute, second]);

            var col, row;
            for (var i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = moment(curDate).add(24, 'hour')) {
                if (i > 0 && col % 7 === 0) {
                    col = 0;
                    row++;
                }
                calendar[row][col] = curDate.clone().hour(hour).minute(minute).second(second);
                curDate.hour(12);

                if (this.minDate && calendar[row][col].format('YYYY-MM-DD') == this.minDate.format('YYYY-MM-DD') && calendar[row][col].isBefore(this.minDate) && side == 'left') {
                    calendar[row][col] = this.minDate.clone();
                }

                if (this.maxDate && calendar[row][col].format('YYYY-MM-DD') == this.maxDate.format('YYYY-MM-DD') && calendar[row][col].isAfter(this.maxDate) && side == 'right') {
                    calendar[row][col] = this.maxDate.clone();
                }

            }

            //make the calendar object available to hoverDate/clickDate
            if (side == 'left') {
                this.leftCalendar.calendar = calendar;
            } else {
                this.rightCalendar.calendar = calendar;
            }

            //
            // Display the calendar
            //

            var minDate = side == 'left' ? this.minDate : this.startDate;
            var maxDate = this.maxDate;
            var selected = side == 'left' ? this.startDate : this.endDate;

            var html = '<table class="table-condensed">';
            html += '<thead>';
            html += '<tr>';

            // add empty cell for week number
            if (this.showWeekNumbers || this.showISOWeekNumbers)
                html += '<th></th>';

            if ((!minDate || minDate.isBefore(calendar.firstDay)) && (!this.linkedCalendars || side == 'left')) {
                html += '<th class="prev available"><i class="fa fa-chevron-left glyphicon glyphicon-chevron-left"></i></th>';
            } else {
                html += '<th></th>';
            }

            var dateHtml = this.locale.monthNames[calendar[1][1].month()] + calendar[1][1].format(" YYYY");

            if (this.showDropdowns) {
                var currentMonth = calendar[1][1].month();
                var currentYear = calendar[1][1].year();
                var maxYear = (maxDate && maxDate.year()) || (currentYear + 5);
                var minYear = (minDate && minDate.year()) || (currentYear - 50);
                var inMinYear = currentYear == minYear;
                var inMaxYear = currentYear == maxYear;

                var monthHtml = '<select class="monthselect">';
                for (var m = 0; m < 12; m++) {
                    if ((!inMinYear || m >= minDate.month()) && (!inMaxYear || m <= maxDate.month())) {
                        monthHtml += "<option value='" + m + "'" +
                            (m === currentMonth ? " selected='selected'" : "") +
                            ">" + this.locale.monthNames[m] + "</option>";
                    } else {
                        monthHtml += "<option value='" + m + "'" +
                            (m === currentMonth ? " selected='selected'" : "") +
                            " disabled='disabled'>" + this.locale.monthNames[m] + "</option>";
                    }
                }
                monthHtml += "</select>";

                var yearHtml = '<select class="yearselect">';
                for (var y = minYear; y <= maxYear; y++) {
                    yearHtml += '<option value="' + y + '"' +
                        (y === currentYear ? ' selected="selected"' : '') +
                        '>' + y + '</option>';
                }
                yearHtml += '</select>';

                dateHtml = monthHtml + yearHtml;
            }

            html += '<th colspan="5" class="month">' + dateHtml + '</th>';
            if ((!maxDate || maxDate.isAfter(calendar.lastDay)) && (!this.linkedCalendars || side == 'right' || this.singleDatePicker)) {
                html += '<th class="next available"><i class="fa fa-chevron-right glyphicon glyphicon-chevron-right"></i></th>';
            } else {
                html += '<th></th>';
            }

            html += '</tr>';
            html += '<tr>';

            // add week number label
            if (this.showWeekNumbers || this.showISOWeekNumbers)
                html += '<th class="week">' + this.locale.weekLabel + '</th>';

            $.each(this.locale.daysOfWeek, function(index, dayOfWeek) {
                html += '<th>' + dayOfWeek + '</th>';
            });

            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';

            //adjust maxDate to reflect the dateLimit setting in order to
            //grey out end dates beyond the dateLimit
            if (this.endDate == null && this.dateLimit) {
                var maxLimit = this.startDate.clone().add(this.dateLimit).endOf('day');
                if (!maxDate || maxLimit.isBefore(maxDate)) {
                    maxDate = maxLimit;
                }
            }

            for (var row = 0; row < 6; row++) {
                html += '<tr>';

                // add week number
                if (this.showWeekNumbers)
                    html += '<td class="week">' + calendar[row][0].week() + '</td>';
                else if (this.showISOWeekNumbers)
                    html += '<td class="week">' + calendar[row][0].isoWeek() + '</td>';

                for (var col = 0; col < 7; col++) {

                    var classes = [];

                    //highlight today's date
                    if (calendar[row][col].isSame(new Date(), "day"))
                        classes.push('today');

                    //highlight weekends
                    if (calendar[row][col].isoWeekday() > 5)
                        classes.push('weekend');

                    //grey out the dates in other months displayed at beginning and end of this calendar
                    if (calendar[row][col].month() != calendar[1][1].month())
                        classes.push('off');

                    //don't allow selection of dates before the minimum date
                    if (this.minDate && calendar[row][col].isBefore(this.minDate, 'day'))
                        classes.push('off', 'disabled');

                    //don't allow selection of dates after the maximum date
                    if (maxDate && calendar[row][col].isAfter(maxDate, 'day'))
                        classes.push('off', 'disabled');

                    //don't allow selection of date if a custom function decides it's invalid
                    if (this.isInvalidDate(calendar[row][col]))
                        classes.push('off', 'disabled');

                    //highlight the currently selected start date
                    if (calendar[row][col].format('YYYY-MM-DD') == this.startDate.format('YYYY-MM-DD'))
                        classes.push('active', 'start-date');

                    //highlight the currently selected end date
                    if (this.endDate != null && calendar[row][col].format('YYYY-MM-DD') == this.endDate.format('YYYY-MM-DD'))
                        classes.push('active', 'end-date');

                    //highlight dates in-between the selected dates
                    if (this.endDate != null && calendar[row][col] > this.startDate && calendar[row][col] < this.endDate)
                        classes.push('in-range');

                    var cname = '', disabled = false;
                    for (var i = 0; i < classes.length; i++) {
                        cname += classes[i] + ' ';
                        if (classes[i] == 'disabled')
                            disabled = true;
                    }
                    if (!disabled)
                        cname += 'available';

                    html += '<td class="' + cname.replace(/^\s+|\s+$/g, '') + '" data-title="' + 'r' + row + 'c' + col + '">' + calendar[row][col].date() + '</td>';

                }
                html += '</tr>';
            }

            html += '</tbody>';
            html += '</table>';

            this.container.find('.calendar.' + side + ' .calendar-table').html(html);

        },

        renderTimePicker: function(side) {

            var html, selected, minDate, maxDate = this.maxDate;

            if (this.dateLimit && (!this.maxDate || this.startDate.clone().add(this.dateLimit).isAfter(this.maxDate)))
                maxDate = this.startDate.clone().add(this.dateLimit);

            if (side == 'left') {
                selected = this.startDate.clone();
                minDate = this.minDate;
            } else if (side == 'right') {
                selected = this.endDate ? this.endDate.clone() : this.previousRightTime.clone();
                minDate = this.startDate;

                //Preserve the time already selected
                var timeSelector = this.container.find('.calendar.right .calendar-time div');
                if (timeSelector.html() != '') {

                    selected.hour(timeSelector.find('.hourselect option:selected').val() || selected.hour());
                    selected.minute(timeSelector.find('.minuteselect option:selected').val() || selected.minute());
                    selected.second(timeSelector.find('.secondselect option:selected').val() || selected.second());

                    if (!this.timePicker24Hour) {
                        var ampm = timeSelector.find('.ampmselect option:selected').val();
                        if (ampm === 'PM' && selected.hour() < 12)
                            selected.hour(selected.hour() + 12);
                        if (ampm === 'AM' && selected.hour() === 12)
                            selected.hour(0);
                    }

                    if (selected.isBefore(this.startDate))
                        selected = this.startDate.clone();

                    if (selected.isAfter(maxDate))
                        selected = maxDate.clone();

                }
            }

            //
            // hours
            //

            html = '<select class="hourselect">';

            var start = this.timePicker24Hour ? 0 : 1;
            var end = this.timePicker24Hour ? 23 : 12;

            for (var i = start; i <= end; i++) {
                var i_in_24 = i;
                if (!this.timePicker24Hour)
                    i_in_24 = selected.hour() >= 12 ? (i == 12 ? 12 : i + 12) : (i == 12 ? 0 : i);

                var time = selected.clone().hour(i_in_24);
                var disabled = false;
                if (minDate && time.minute(59).isBefore(minDate))
                    disabled = true;
                if (maxDate && time.minute(0).isAfter(maxDate))
                    disabled = true;

                if (i_in_24 == selected.hour() && !disabled) {
                    html += '<option value="' + i + '" selected="selected">' + i + '</option>';
                } else if (disabled) {
                    html += '<option value="' + i + '" disabled="disabled" class="disabled">' + i + '</option>';
                } else {
                    html += '<option value="' + i + '">' + i + '</option>';
                }
            }

            html += '</select> ';

            //
            // minutes
            //

            html += ': <select class="minuteselect">';

            for (var i = 0; i < 60; i += this.timePickerIncrement) {
                var padded = i < 10 ? '0' + i : i;
                var time = selected.clone().minute(i);

                var disabled = false;
                if (minDate && time.second(59).isBefore(minDate))
                    disabled = true;
                if (maxDate && time.second(0).isAfter(maxDate))
                    disabled = true;

                if (selected.minute() == i && !disabled) {
                    html += '<option value="' + i + '" selected="selected">' + padded + '</option>';
                } else if (disabled) {
                    html += '<option value="' + i + '" disabled="disabled" class="disabled">' + padded + '</option>';
                } else {
                    html += '<option value="' + i + '">' + padded + '</option>';
                }
            }

            html += '</select> ';

            //
            // seconds
            //

            if (this.timePickerSeconds) {
                html += ': <select class="secondselect">';

                for (var i = 0; i < 60; i++) {
                    var padded = i < 10 ? '0' + i : i;
                    var time = selected.clone().second(i);

                    var disabled = false;
                    if (minDate && time.isBefore(minDate))
                        disabled = true;
                    if (maxDate && time.isAfter(maxDate))
                        disabled = true;

                    if (selected.second() == i && !disabled) {
                        html += '<option value="' + i + '" selected="selected">' + padded + '</option>';
                    } else if (disabled) {
                        html += '<option value="' + i + '" disabled="disabled" class="disabled">' + padded + '</option>';
                    } else {
                        html += '<option value="' + i + '">' + padded + '</option>';
                    }
                }

                html += '</select> ';
            }

            //
            // AM/PM
            //

            if (!this.timePicker24Hour) {
                html += '<select class="ampmselect">';

                var am_html = '';
                var pm_html = '';

                if (minDate && selected.clone().hour(12).minute(0).second(0).isBefore(minDate))
                    am_html = ' disabled="disabled" class="disabled"';

                if (maxDate && selected.clone().hour(0).minute(0).second(0).isAfter(maxDate))
                    pm_html = ' disabled="disabled" class="disabled"';

                if (selected.hour() >= 12) {
                    html += '<option value="AM"' + am_html + '>AM</option><option value="PM" selected="selected"' + pm_html + '>PM</option>';
                } else {
                    html += '<option value="AM" selected="selected"' + am_html + '>AM</option><option value="PM"' + pm_html + '>PM</option>';
                }

                html += '</select>';
            }

            this.container.find('.calendar.' + side + ' .calendar-time div').html(html);

        },

        updateFormInputs: function() {

            //ignore mouse movements while an above-calendar text input has focus
            if (this.container.find('input[name=daterangepicker_start]').is(":focus") || this.container.find('input[name=daterangepicker_end]').is(":focus"))
                return;

            this.container.find('input[name=daterangepicker_start]').val(this.startDate.format(this.locale.format));
            if (this.endDate)
                this.container.find('input[name=daterangepicker_end]').val(this.endDate.format(this.locale.format));

            if (this.singleDatePicker || (this.endDate && (this.startDate.isBefore(this.endDate) || this.startDate.isSame(this.endDate)))) {
                this.container.find('button.applyBtn').removeAttr('disabled');
            } else {
                this.container.find('button.applyBtn').attr('disabled', 'disabled');
            }

        },

        move: function() {
            var parentOffset = { top: 0, left: 0 },
                containerTop;
            var parentRightEdge = $(window).width();
            if (!this.parentEl.is('body')) {
                parentOffset = {
                    top: this.parentEl.offset().top - this.parentEl.scrollTop(),
                    left: this.parentEl.offset().left - this.parentEl.scrollLeft()
                };
                parentRightEdge = this.parentEl[0].clientWidth + this.parentEl.offset().left;
            }

            if (this.drops == 'up')
                containerTop = this.element.offset().top - this.container.outerHeight() - parentOffset.top;
            else
                containerTop = this.element.offset().top + this.element.outerHeight() - parentOffset.top;
            this.container[this.drops == 'up' ? 'addClass' : 'removeClass']('dropup');

            if (this.opens == 'left') {
                this.container.css({
                    top: containerTop,
                    right: parentRightEdge - this.element.offset().left - this.element.outerWidth(),
                    left: 'auto'
                });
                if (this.container.offset().left < 0) {
                    this.container.css({
                        right: 'auto',
                        left: 9
                    });
                }
            } else if (this.opens == 'center') {
                this.container.css({
                    top: containerTop,
                    left: this.element.offset().left - parentOffset.left + this.element.outerWidth() / 2
                            - this.container.outerWidth() / 2,
                    right: 'auto'
                });
                if (this.container.offset().left < 0) {
                    this.container.css({
                        right: 'auto',
                        left: 9
                    });
                }
            } else {
                this.container.css({
                    top: containerTop,
                    left: this.element.offset().left - parentOffset.left,
                    right: 'auto'
                });
                if (this.container.offset().left + this.container.outerWidth() > $(window).width()) {
                    this.container.css({
                        left: 'auto',
                        right: 0
                    });
                }
            }
        },

        show: function(e) {
            if (this.isShowing) return;

            // Create a click proxy that is private to this instance of datepicker, for unbinding
            this._outsideClickProxy = $.proxy(function(e) { this.outsideClick(e); }, this);

            // Bind global datepicker mousedown for hiding and
            $(document)
              .on('mousedown.daterangepicker', this._outsideClickProxy)
              // also support mobile devices
              .on('touchend.daterangepicker', this._outsideClickProxy)
              // also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
              .on('click.daterangepicker', '[data-toggle=dropdown]', this._outsideClickProxy)
              // and also close when focus changes to outside the picker (eg. tabbing between controls)
              .on('focusin.daterangepicker', this._outsideClickProxy);

            // Reposition the picker if the window is resized while it's open
            $(window).on('resize.daterangepicker', $.proxy(function(e) { this.move(e); }, this));

            this.oldStartDate = this.startDate.clone();
            this.oldEndDate = this.endDate.clone();
            this.previousRightTime = this.endDate.clone();

            this.updateView();
            this.container.show();
            this.move();
            this.element.trigger('show.daterangepicker', this);
            this.isShowing = true;
        },

        hide: function(e) {
            if (!this.isShowing) return;

            //incomplete date selection, revert to last values
            if (!this.endDate) {
                this.startDate = this.oldStartDate.clone();
                this.endDate = this.oldEndDate.clone();
            }

            //if a new date range was selected, invoke the user callback function
            if (!this.startDate.isSame(this.oldStartDate) || !this.endDate.isSame(this.oldEndDate))
                this.callback(this.startDate, this.endDate, this.chosenLabel);

            //if picker is attached to a text input, update it
            this.updateElement();

            $(document).off('.daterangepicker');
            $(window).off('.daterangepicker');
            this.container.hide();
            this.element.trigger('hide.daterangepicker', this);
            this.isShowing = false;
        },

        toggle: function(e) {
            if (this.isShowing) {
                this.hide();
            } else {
                this.show();
            }
        },

        outsideClick: function(e) {
            var target = $(e.target);
            // if the page is clicked anywhere except within the daterangerpicker/button
            // itself then call this.hide()
            if (
                // ie modal dialog fix
                e.type == "focusin" ||
                target.closest(this.element).length ||
                target.closest(this.container).length ||
                target.closest('.calendar-table').length
                ) return;
            this.hide();
        },

        showCalendars: function() {
            this.container.addClass('show-calendar');
            this.move();
            this.element.trigger('showCalendar.daterangepicker', this);
        },

        hideCalendars: function() {
            this.container.removeClass('show-calendar');
            this.element.trigger('hideCalendar.daterangepicker', this);
        },

        hoverRange: function(e) {

            //ignore mouse movements while an above-calendar text input has focus
            if (this.container.find('input[name=daterangepicker_start]').is(":focus") || this.container.find('input[name=daterangepicker_end]').is(":focus"))
                return;

            var label = e.target.innerHTML;
            if (label == this.locale.customRangeLabel) {
                this.updateView();
            } else {
                var dates = this.ranges[label];
                this.container.find('input[name=daterangepicker_start]').val(dates[0].format(this.locale.format));
                this.container.find('input[name=daterangepicker_end]').val(dates[1].format(this.locale.format));
            }
            
        },

        clickRange: function(e) {
            var label = e.target.innerHTML;
            this.chosenLabel = label;
            if (label == this.locale.customRangeLabel) {
                this.showCalendars();
            } else {
                var dates = this.ranges[label];
                this.startDate = dates[0];
                this.endDate = dates[1];

                if (!this.timePicker) {
                    this.startDate.startOf('day');
                    this.endDate.endOf('day');
                }

                if (!this.alwaysShowCalendars)
                    this.hideCalendars();
                this.clickApply();
            }
        },

        clickPrev: function(e) {
            var cal = $(e.target).parents('.calendar');
            if (cal.hasClass('left')) {
                this.leftCalendar.month.subtract(1, 'month');
                if (this.linkedCalendars)
                    this.rightCalendar.month.subtract(1, 'month');
            } else {
                this.rightCalendar.month.subtract(1, 'month');
            }
            this.updateCalendars();
        },

        clickNext: function(e) {
            var cal = $(e.target).parents('.calendar');
            if (cal.hasClass('left')) {
                this.leftCalendar.month.add(1, 'month');
            } else {
                this.rightCalendar.month.add(1, 'month');
                if (this.linkedCalendars)
                    this.leftCalendar.month.add(1, 'month');
            }
            this.updateCalendars();
        },

        hoverDate: function(e) {

            //ignore mouse movements while an above-calendar text input has focus
            if (this.container.find('input[name=daterangepicker_start]').is(":focus") || this.container.find('input[name=daterangepicker_end]').is(":focus"))
                return;

            //ignore dates that can't be selected
            if (!$(e.target).hasClass('available')) return;

            //have the text inputs above calendars reflect the date being hovered over
            var title = $(e.target).attr('data-title');
            var row = title.substr(1, 1);
            var col = title.substr(3, 1);
            var cal = $(e.target).parents('.calendar');
            var date = cal.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

            if (this.endDate) {
                this.container.find('input[name=daterangepicker_start]').val(date.format(this.locale.format));
            } else {
                this.container.find('input[name=daterangepicker_end]').val(date.format(this.locale.format));
            }

            //highlight the dates between the start date and the date being hovered as a potential end date
            var leftCalendar = this.leftCalendar;
            var rightCalendar = this.rightCalendar;
            var startDate = this.startDate;
            if (!this.endDate) {
                this.container.find('.calendar td').each(function(index, el) {

                    //skip week numbers, only look at dates
                    if ($(el).hasClass('week')) return;

                    var title = $(el).attr('data-title');
                    var row = title.substr(1, 1);
                    var col = title.substr(3, 1);
                    var cal = $(el).parents('.calendar');
                    var dt = cal.hasClass('left') ? leftCalendar.calendar[row][col] : rightCalendar.calendar[row][col];

                    if (dt.isAfter(startDate) && dt.isBefore(date)) {
                        $(el).addClass('in-range');
                    } else {
                        $(el).removeClass('in-range');
                    }

                });
            }

        },

        clickDate: function(e) {

            if (!$(e.target).hasClass('available')) return;

            var title = $(e.target).attr('data-title');
            var row = title.substr(1, 1);
            var col = title.substr(3, 1);
            var cal = $(e.target).parents('.calendar');
            var date = cal.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

            //
            // this function needs to do a few things:
            // * alternate between selecting a start and end date for the range,
            // * if the time picker is enabled, apply the hour/minute/second from the select boxes to the clicked date
            // * if autoapply is enabled, and an end date was chosen, apply the selection
            // * if single date picker mode, and time picker isn't enabled, apply the selection immediately
            //

            if (this.endDate || date.isBefore(this.startDate, 'day')) {
                if (this.timePicker) {
                    var hour = parseInt(this.container.find('.left .hourselect').val(), 10);
                    if (!this.timePicker24Hour) {
                        var ampm = this.container.find('.left .ampmselect').val();
                        if (ampm === 'PM' && hour < 12)
                            hour += 12;
                        if (ampm === 'AM' && hour === 12)
                            hour = 0;
                    }
                    var minute = parseInt(this.container.find('.left .minuteselect').val(), 10);
                    var second = this.timePickerSeconds ? parseInt(this.container.find('.left .secondselect').val(), 10) : 0;
                    date = date.clone().hour(hour).minute(minute).second(second);
                }
                this.endDate = null;
                this.setStartDate(date.clone());
            } else if (!this.endDate && date.isBefore(this.startDate)) {
                //special case: clicking the same date for start/end, 
                //but the time of the end date is before the start date
                this.setEndDate(this.startDate.clone());
            } else {
                if (this.timePicker) {
                    var hour = parseInt(this.container.find('.right .hourselect').val(), 10);
                    if (!this.timePicker24Hour) {
                        var ampm = this.container.find('.right .ampmselect').val();
                        if (ampm === 'PM' && hour < 12)
                            hour += 12;
                        if (ampm === 'AM' && hour === 12)
                            hour = 0;
                    }
                    var minute = parseInt(this.container.find('.right .minuteselect').val(), 10);
                    var second = this.timePickerSeconds ? parseInt(this.container.find('.right .secondselect').val(), 10) : 0;
                    date = date.clone().hour(hour).minute(minute).second(second);
                }
                this.setEndDate(date.clone());
                if (this.autoApply) {
                  this.calculateChosenLabel();
                  this.clickApply();
                }
            }

            if (this.singleDatePicker) {
                this.setEndDate(this.startDate);
                if (!this.timePicker)
                    this.clickApply();
            }

            this.updateView();

        },

        calculateChosenLabel: function() {
          var customRange = true;
          var i = 0;
          for (var range in this.ranges) {
              if (this.timePicker) {
                  if (this.startDate.isSame(this.ranges[range][0]) && this.endDate.isSame(this.ranges[range][1])) {
                      customRange = false;
                      this.chosenLabel = this.container.find('.ranges li:eq(' + i + ')').addClass('active').html();
                      break;
                  }
              } else {
                  //ignore times when comparing dates if time picker is not enabled
                  if (this.startDate.format('YYYY-MM-DD') == this.ranges[range][0].format('YYYY-MM-DD') && this.endDate.format('YYYY-MM-DD') == this.ranges[range][1].format('YYYY-MM-DD')) {
                      customRange = false;
                      this.chosenLabel = this.container.find('.ranges li:eq(' + i + ')').addClass('active').html();
                      break;
                  }
              }
              i++;
          }
          if (customRange) {
              this.chosenLabel = this.container.find('.ranges li:last').addClass('active').html();
              this.showCalendars();
          }
        },

        clickApply: function(e) {
            this.hide();
            this.element.trigger('apply.daterangepicker', this);
        },

        clickCancel: function(e) {
            this.startDate = this.oldStartDate;
            this.endDate = this.oldEndDate;
            this.hide();
            this.element.trigger('cancel.daterangepicker', this);
        },

        monthOrYearChanged: function(e) {
            var isLeft = $(e.target).closest('.calendar').hasClass('left'),
                leftOrRight = isLeft ? 'left' : 'right',
                cal = this.container.find('.calendar.'+leftOrRight);

            // Month must be Number for new moment versions
            var month = parseInt(cal.find('.monthselect').val(), 10);
            var year = cal.find('.yearselect').val();

            if (!isLeft) {
                if (year < this.startDate.year() || (year == this.startDate.year() && month < this.startDate.month())) {
                    month = this.startDate.month();
                    year = this.startDate.year();
                }
            }

            if (this.minDate) {
                if (year < this.minDate.year() || (year == this.minDate.year() && month < this.minDate.month())) {
                    month = this.minDate.month();
                    year = this.minDate.year();
                }
            }

            if (this.maxDate) {
                if (year > this.maxDate.year() || (year == this.maxDate.year() && month > this.maxDate.month())) {
                    month = this.maxDate.month();
                    year = this.maxDate.year();
                }
            }

            if (isLeft) {
                this.leftCalendar.month.month(month).year(year);
                if (this.linkedCalendars)
                    this.rightCalendar.month = this.leftCalendar.month.clone().add(1, 'month');
            } else {
                this.rightCalendar.month.month(month).year(year);
                if (this.linkedCalendars)
                    this.leftCalendar.month = this.rightCalendar.month.clone().subtract(1, 'month');
            }
            this.updateCalendars();
        },

        timeChanged: function(e) {

            var cal = $(e.target).closest('.calendar'),
                isLeft = cal.hasClass('left');

            var hour = parseInt(cal.find('.hourselect').val(), 10);
            var minute = parseInt(cal.find('.minuteselect').val(), 10);
            var second = this.timePickerSeconds ? parseInt(cal.find('.secondselect').val(), 10) : 0;

            if (!this.timePicker24Hour) {
                var ampm = cal.find('.ampmselect').val();
                if (ampm === 'PM' && hour < 12)
                    hour += 12;
                if (ampm === 'AM' && hour === 12)
                    hour = 0;
            }

            if (isLeft) {
                var start = this.startDate.clone();
                start.hour(hour);
                start.minute(minute);
                start.second(second);
                this.setStartDate(start);
                if (this.singleDatePicker) {
                    this.endDate = this.startDate.clone();
                } else if (this.endDate && this.endDate.format('YYYY-MM-DD') == start.format('YYYY-MM-DD') && this.endDate.isBefore(start)) {
                    this.setEndDate(start.clone());
                }
            } else if (this.endDate) {
                var end = this.endDate.clone();
                end.hour(hour);
                end.minute(minute);
                end.second(second);
                this.setEndDate(end);
            }

            //update the calendars so all clickable dates reflect the new time component
            this.updateCalendars();

            //update the form inputs above the calendars with the new time
            this.updateFormInputs();

            //re-render the time pickers because changing one selection can affect what's enabled in another
            this.renderTimePicker('left');
            this.renderTimePicker('right');

        },

        formInputsChanged: function(e) {
            var isRight = $(e.target).closest('.calendar').hasClass('right');
            var start = moment(this.container.find('input[name="daterangepicker_start"]').val(), this.locale.format);
            var end = moment(this.container.find('input[name="daterangepicker_end"]').val(), this.locale.format);

            if (start.isValid() && end.isValid()) {

                if (isRight && end.isBefore(start))
                    start = end.clone();

                this.setStartDate(start);
                this.setEndDate(end);

                if (isRight) {
                    this.container.find('input[name="daterangepicker_start"]').val(this.startDate.format(this.locale.format));
                } else {
                    this.container.find('input[name="daterangepicker_end"]').val(this.endDate.format(this.locale.format));
                }

            }

            this.updateCalendars();
            if (this.timePicker) {
                this.renderTimePicker('left');
                this.renderTimePicker('right');
            }
        },

        elementChanged: function() {
            if (!this.element.is('input')) return;
            if (!this.element.val().length) return;
            if (this.element.val().length < this.locale.format.length) return;

            var dateString = this.element.val().split(this.locale.separator),
                start = null,
                end = null;

            if (dateString.length === 2) {
                start = moment(dateString[0], this.locale.format);
                end = moment(dateString[1], this.locale.format);
            }

            if (this.singleDatePicker || start === null || end === null) {
                start = moment(this.element.val(), this.locale.format);
                end = start;
            }

            if (!start.isValid() || !end.isValid()) return;

            this.setStartDate(start);
            this.setEndDate(end);
            this.updateView();
        },

        keydown: function(e) {
            //hide on tab or enter
            if ((e.keyCode === 9) || (e.keyCode === 13)) {
                this.hide();
            }
        },

        updateElement: function() {
            if (this.element.is('input') && !this.singleDatePicker && this.autoUpdateInput) {
                this.element.val(this.startDate.format(this.locale.format) + this.locale.separator + this.endDate.format(this.locale.format));
                this.element.trigger('change');
            } else if (this.element.is('input') && this.autoUpdateInput) {
                this.element.val(this.startDate.format(this.locale.format));
                this.element.trigger('change');
            }
        },

        remove: function() {
            this.container.remove();
            this.element.off('.daterangepicker');
            this.element.removeData();
        }

    };

    $.fn.daterangepicker = function(options, callback) {
        this.each(function() {
            var el = $(this);
            if (el.data('daterangepicker'))
                el.data('daterangepicker').remove();
            el.data('daterangepicker', new DateRangePicker(el, options, callback));
        });
        return this;
    };
    
    return DateRangePicker;

}));

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRhdGVyYW5nZXBpY2tlci5qcyJdLCJuYW1lcyI6WyJyb290IiwiZmFjdG9yeSIsImRlZmluZSIsImFtZCIsIm1vbWVudGpzIiwiJCIsImV4cG9ydHMiLCJkYXRlcmFuZ2VwaWNrZXIiLCJyZXF1aXJlIiwialF1ZXJ5Iiwid2luZG93IiwidW5kZWZpbmVkIiwiZm4iLCJlcnIiLCJFcnJvciIsIm1vbWVudCIsIlplcHRvIiwiZW5kZXIiLCJ0aGlzIiwiRGF0ZVJhbmdlUGlja2VyIiwiZWxlbWVudCIsIm9wdGlvbnMiLCJjYiIsInBhcmVudEVsIiwic3RhcnREYXRlIiwic3RhcnRPZiIsImVuZERhdGUiLCJlbmRPZiIsIm1pbkRhdGUiLCJtYXhEYXRlIiwiZGF0ZUxpbWl0IiwiYXV0b0FwcGx5Iiwic2luZ2xlRGF0ZVBpY2tlciIsInNob3dEcm9wZG93bnMiLCJzaG93V2Vla051bWJlcnMiLCJzaG93SVNPV2Vla051bWJlcnMiLCJ0aW1lUGlja2VyIiwidGltZVBpY2tlcjI0SG91ciIsInRpbWVQaWNrZXJJbmNyZW1lbnQiLCJ0aW1lUGlja2VyU2Vjb25kcyIsImxpbmtlZENhbGVuZGFycyIsImF1dG9VcGRhdGVJbnB1dCIsImFsd2F5c1Nob3dDYWxlbmRhcnMiLCJyYW5nZXMiLCJvcGVucyIsImhhc0NsYXNzIiwiZHJvcHMiLCJidXR0b25DbGFzc2VzIiwiYXBwbHlDbGFzcyIsImNhbmNlbENsYXNzIiwibG9jYWxlIiwiZm9ybWF0Iiwic2VwYXJhdG9yIiwiYXBwbHlMYWJlbCIsImNhbmNlbExhYmVsIiwid2Vla0xhYmVsIiwiY3VzdG9tUmFuZ2VMYWJlbCIsImRheXNPZldlZWsiLCJ3ZWVrZGF5c01pbiIsIm1vbnRoTmFtZXMiLCJtb250aHNTaG9ydCIsImZpcnN0RGF5IiwibG9jYWxlRGF0YSIsImZpcnN0RGF5T2ZXZWVrIiwiY2FsbGJhY2siLCJpc1Nob3dpbmciLCJsZWZ0Q2FsZW5kYXIiLCJyaWdodENhbGVuZGFyIiwiZXh0ZW5kIiwiZGF0YSIsInRlbXBsYXRlIiwibGVuZ3RoIiwiY29udGFpbmVyIiwiYXBwZW5kVG8iLCJzbGljZSIsImlzQmVmb3JlIiwiY2xvbmUiLCJpc0FmdGVyIiwiam9pbiIsImlzSW52YWxpZERhdGUiLCJpdGVyYXRvciIsInB1c2giLCJzaGlmdCIsInN0YXJ0IiwiZW5kIiwicmFuZ2UiLCJpcyIsInZhbCIsInNwbGl0Iiwic2V0U3RhcnREYXRlIiwic2V0RW5kRGF0ZSIsImFkZCIsImVsZW0iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJyYW5nZUh0bWwiLCJ2YWx1ZSIsImxpc3QiLCJmaW5kIiwicHJlcGVuZCIsImhpZGUiLCJhZGRDbGFzcyIsInNob3ciLCJodG1sIiwicmVtb3ZlIiwicGFyZW50Iiwib24iLCJwcm94eSIsImNsaWNrUHJldiIsImNsaWNrTmV4dCIsImNsaWNrRGF0ZSIsImhvdmVyRGF0ZSIsInVwZGF0ZUZvcm1JbnB1dHMiLCJtb250aE9yWWVhckNoYW5nZWQiLCJ0aW1lQ2hhbmdlZCIsInNob3dDYWxlbmRhcnMiLCJmb3JtSW5wdXRzQ2hhbmdlZCIsImNsaWNrQXBwbHkiLCJjbGlja0NhbmNlbCIsImNsaWNrUmFuZ2UiLCJob3ZlclJhbmdlIiwiY2xpY2suZGF0ZXJhbmdlcGlja2VyIiwiZm9jdXMuZGF0ZXJhbmdlcGlja2VyIiwia2V5dXAuZGF0ZXJhbmdlcGlja2VyIiwiZWxlbWVudENoYW5nZWQiLCJrZXlkb3duLmRhdGVyYW5nZXBpY2tlciIsImtleWRvd24iLCJ0b2dnbGUiLCJ0cmlnZ2VyIiwicHJvdG90eXBlIiwiY29uc3RydWN0b3IiLCJtaW51dGUiLCJNYXRoIiwicm91bmQiLCJ1cGRhdGVFbGVtZW50IiwidXBkYXRlTW9udGhzSW5WaWV3IiwicHJldmlvdXNSaWdodFRpbWUiLCJ1cGRhdGVWaWV3IiwicmVuZGVyVGltZVBpY2tlciIsInJlbW92ZUF0dHIiLCJyZW1vdmVDbGFzcyIsImF0dHIiLCJ1cGRhdGVDYWxlbmRhcnMiLCJtb250aCIsImRhdGUiLCJ5ZWFyIiwiaG91ciIsInNlY29uZCIsInBhcnNlSW50IiwiYW1wbSIsInJlbmRlckNhbGVuZGFyIiwiY2FsY3VsYXRlQ2hvc2VuTGFiZWwiLCJzaWRlIiwiY2FsZW5kYXIiLCJkYXlzSW5Nb250aCIsImxhc3REYXkiLCJsYXN0TW9udGgiLCJzdWJ0cmFjdCIsImxhc3RZZWFyIiwiZGF5c0luTGFzdE1vbnRoIiwiZGF5T2ZXZWVrIiwiZGF5IiwiaSIsInN0YXJ0RGF5IiwiY29sIiwicm93IiwiY3VyRGF0ZSIsImRhdGVIdG1sIiwiY3VycmVudE1vbnRoIiwiY3VycmVudFllYXIiLCJtYXhZZWFyIiwibWluWWVhciIsImluTWluWWVhciIsImluTWF4WWVhciIsIm1vbnRoSHRtbCIsIm0iLCJ5ZWFySHRtbCIsInkiLCJlYWNoIiwiaW5kZXgiLCJtYXhMaW1pdCIsIndlZWsiLCJpc29XZWVrIiwiY2xhc3NlcyIsImlzU2FtZSIsIkRhdGUiLCJpc29XZWVrZGF5IiwiY25hbWUiLCJkaXNhYmxlZCIsInJlcGxhY2UiLCJzZWxlY3RlZCIsInRpbWVTZWxlY3RvciIsImlfaW5fMjQiLCJ0aW1lIiwicGFkZGVkIiwiYW1faHRtbCIsInBtX2h0bWwiLCJtb3ZlIiwiY29udGFpbmVyVG9wIiwicGFyZW50T2Zmc2V0IiwidG9wIiwibGVmdCIsInBhcmVudFJpZ2h0RWRnZSIsIndpZHRoIiwib2Zmc2V0Iiwic2Nyb2xsVG9wIiwic2Nyb2xsTGVmdCIsImNsaWVudFdpZHRoIiwib3V0ZXJIZWlnaHQiLCJjc3MiLCJyaWdodCIsIm91dGVyV2lkdGgiLCJlIiwiX291dHNpZGVDbGlja1Byb3h5Iiwib3V0c2lkZUNsaWNrIiwib2xkU3RhcnREYXRlIiwib2xkRW5kRGF0ZSIsImNob3NlbkxhYmVsIiwib2ZmIiwidGFyZ2V0IiwidHlwZSIsImNsb3Nlc3QiLCJoaWRlQ2FsZW5kYXJzIiwibGFiZWwiLCJkYXRlcyIsImNhbCIsInBhcmVudHMiLCJ0aXRsZSIsInN1YnN0ciIsImVsIiwiZHQiLCJjdXN0b21SYW5nZSIsImlzTGVmdCIsImxlZnRPclJpZ2h0IiwiaXNSaWdodCIsImlzVmFsaWQiLCJkYXRlU3RyaW5nIiwia2V5Q29kZSIsInJlbW92ZURhdGEiXSwibWFwcGluZ3MiOiJDQVFDLFNBQVNBLEVBQU1DLEdBRWQsR0FBc0Isa0JBQVhDLFNBQXlCQSxPQUFPQyxJQUN6Q0QsUUFBUSxTQUFVLFNBQVUsV0FBWSxTQUFTRSxFQUFVQyxFQUFHQyxHQUM1RE4sRUFBS08sZ0JBQWtCTixFQUFRRCxFQUFNTSxFQUFTRixFQUFVQyxTQUdyRCxJQUF1QixtQkFBWkMsU0FBeUIsQ0FDdkMsR0FBSUYsR0FBV0ksUUFBUSxVQUNuQkMsRUFBMkIsbUJBQVZDLFFBQXlCQSxPQUFPRCxPQUFTRSxNQUM5RCxLQUFLRixFQUNELElBQ0lBLEVBQVNELFFBQVEsVUFDWkMsRUFBT0csS0FBSUgsRUFBT0csT0FDekIsTUFBT0MsR0FDTCxJQUFLSixFQUFRLEtBQU0sSUFBSUssT0FBTSwrQkFJdkNiLEVBQVFELEVBQU1NLFFBQVNGLEVBQVVLLE9BSWpDVCxHQUFLTyxnQkFBa0JOLEVBQVFELEtBQVVBLEVBQUtlLFFBQVVBLE9BQVNmLEVBQUtTLFFBQVVULEVBQUtnQixPQUFTaEIsRUFBS2lCLE9BQVNqQixFQUFLSyxJQUduSGEsU0FBWSxTQUFTbEIsRUFBTU8sRUFBaUJRLEVBQVFWLEdBRWxELEdBQUljLEdBQWtCLFNBQVNDLEVBQVNDLEVBQVNDLEdBc083QyxHQW5PQUosS0FBS0ssU0FBVyxPQUNoQkwsS0FBS0UsUUFBVWYsRUFBRWUsR0FDakJGLEtBQUtNLFVBQVlULElBQVNVLFFBQVEsT0FDbENQLEtBQUtRLFFBQVVYLElBQVNZLE1BQU0sT0FDOUJULEtBQUtVLFNBQVUsRUFDZlYsS0FBS1csU0FBVSxFQUNmWCxLQUFLWSxXQUFZLEVBQ2pCWixLQUFLYSxXQUFZLEVBQ2pCYixLQUFLYyxrQkFBbUIsRUFDeEJkLEtBQUtlLGVBQWdCLEVBQ3JCZixLQUFLZ0IsaUJBQWtCLEVBQ3ZCaEIsS0FBS2lCLG9CQUFxQixFQUMxQmpCLEtBQUtrQixZQUFhLEVBQ2xCbEIsS0FBS21CLGtCQUFtQixFQUN4Qm5CLEtBQUtvQixvQkFBc0IsRUFDM0JwQixLQUFLcUIsbUJBQW9CLEVBQ3pCckIsS0FBS3NCLGlCQUFrQixFQUN2QnRCLEtBQUt1QixpQkFBa0IsRUFDdkJ2QixLQUFLd0IscUJBQXNCLEVBQzNCeEIsS0FBS3lCLFVBRUx6QixLQUFLMEIsTUFBUSxRQUNUMUIsS0FBS0UsUUFBUXlCLFNBQVMsZ0JBQ3RCM0IsS0FBSzBCLE1BQVEsUUFFakIxQixLQUFLNEIsTUFBUSxPQUNUNUIsS0FBS0UsUUFBUXlCLFNBQVMsWUFDdEIzQixLQUFLNEIsTUFBUSxNQUVqQjVCLEtBQUs2QixjQUFnQixhQUNyQjdCLEtBQUs4QixXQUFhLGNBQ2xCOUIsS0FBSytCLFlBQWMsY0FFbkIvQixLQUFLZ0MsUUFDREMsT0FBUSxhQUNSQyxVQUFXLE1BQ1hDLFdBQVksUUFDWkMsWUFBYSxTQUNiQyxVQUFXLElBQ1hDLGlCQUFrQixlQUNsQkMsV0FBWTFDLEVBQU8yQyxjQUNuQkMsV0FBWTVDLEVBQU82QyxjQUNuQkMsU0FBVTlDLEVBQU8rQyxhQUFhQyxrQkFHbEM3QyxLQUFLOEMsU0FBVyxhQUdoQjlDLEtBQUsrQyxXQUFZLEVBQ2pCL0MsS0FBS2dELGdCQUNMaEQsS0FBS2lELGlCQUdrQixnQkFBWjlDLElBQW9DLE9BQVpBLElBQy9CQSxNQUlKQSxFQUFVaEIsRUFBRStELE9BQU9sRCxLQUFLRSxRQUFRaUQsT0FBUWhELEdBR1IsZ0JBQXJCQSxHQUFRaUQsVUFBMkJqRCxFQUFRaUQsbUJBQW9CakUsS0FDdEVnQixFQUFRaUQsU0FBVyxrNUJBK0J2QnBELEtBQUtLLFNBQThEbEIsRUFBbERnQixFQUFRRSxVQUFZbEIsRUFBRWdCLEVBQVFFLFVBQVVnRCxPQUFZbEQsRUFBUUUsU0FBY0wsS0FBS0ssVUFDaEdMLEtBQUtzRCxVQUFZbkUsRUFBRWdCLEVBQVFpRCxVQUFVRyxTQUFTdkQsS0FBS0ssVUFNckIsZ0JBQW5CRixHQUFRNkIsU0FFc0IsZ0JBQTFCN0IsR0FBUTZCLE9BQU9DLFNBQ3RCakMsS0FBS2dDLE9BQU9DLE9BQVM5QixFQUFRNkIsT0FBT0MsUUFFQSxnQkFBN0I5QixHQUFRNkIsT0FBT0UsWUFDdEJsQyxLQUFLZ0MsT0FBT0UsVUFBWS9CLEVBQVE2QixPQUFPRSxXQUVGLGdCQUE5Qi9CLEdBQVE2QixPQUFPTyxhQUN0QnZDLEtBQUtnQyxPQUFPTyxXQUFhcEMsRUFBUTZCLE9BQU9PLFdBQVdpQixTQUVkLGdCQUE5QnJELEdBQVE2QixPQUFPUyxhQUN4QnpDLEtBQUtnQyxPQUFPUyxXQUFhdEMsRUFBUTZCLE9BQU9TLFdBQVdlLFNBRWQsZ0JBQTVCckQsR0FBUTZCLE9BQU9XLFdBQ3hCM0MsS0FBS2dDLE9BQU9XLFNBQVd4QyxFQUFRNkIsT0FBT1csVUFFQyxnQkFBOUJ4QyxHQUFRNkIsT0FBT0csYUFDeEJuQyxLQUFLZ0MsT0FBT0csV0FBYWhDLEVBQVE2QixPQUFPRyxZQUVBLGdCQUEvQmhDLEdBQVE2QixPQUFPSSxjQUN4QnBDLEtBQUtnQyxPQUFPSSxZQUFjakMsRUFBUTZCLE9BQU9JLGFBRUgsZ0JBQTdCakMsR0FBUTZCLE9BQU9LLFlBQ3hCckMsS0FBS2dDLE9BQU9LLFVBQVlsQyxFQUFRNkIsT0FBT0ssV0FFTSxnQkFBcENsQyxHQUFRNkIsT0FBT00sbUJBQ3hCdEMsS0FBS2dDLE9BQU9NLGlCQUFtQm5DLEVBQVE2QixPQUFPTSxtQkFJbkIsZ0JBQXRCbkMsR0FBUUcsWUFDZk4sS0FBS00sVUFBWVQsRUFBT00sRUFBUUcsVUFBV04sS0FBS2dDLE9BQU9DLFNBRTVCLGdCQUFwQjlCLEdBQVFLLFVBQ2ZSLEtBQUtRLFFBQVVYLEVBQU9NLEVBQVFLLFFBQVNSLEtBQUtnQyxPQUFPQyxTQUV4QixnQkFBcEI5QixHQUFRTyxVQUNmVixLQUFLVSxRQUFVYixFQUFPTSxFQUFRTyxRQUFTVixLQUFLZ0MsT0FBT0MsU0FFeEIsZ0JBQXBCOUIsR0FBUVEsVUFDZlgsS0FBS1csUUFBVWQsRUFBT00sRUFBUVEsUUFBU1gsS0FBS2dDLE9BQU9DLFNBRXRCLGdCQUF0QjlCLEdBQVFHLFlBQ2ZOLEtBQUtNLFVBQVlULEVBQU9NLEVBQVFHLFlBRUwsZ0JBQXBCSCxHQUFRSyxVQUNmUixLQUFLUSxRQUFVWCxFQUFPTSxFQUFRSyxVQUVILGdCQUFwQkwsR0FBUU8sVUFDZlYsS0FBS1UsUUFBVWIsRUFBT00sRUFBUU8sVUFFSCxnQkFBcEJQLEdBQVFRLFVBQ2ZYLEtBQUtXLFFBQVVkLEVBQU9NLEVBQVFRLFVBRzlCWCxLQUFLVSxTQUFXVixLQUFLTSxVQUFVbUQsU0FBU3pELEtBQUtVLFdBQzdDVixLQUFLTSxVQUFZTixLQUFLVSxRQUFRZ0QsU0FHOUIxRCxLQUFLVyxTQUFXWCxLQUFLUSxRQUFRbUQsUUFBUTNELEtBQUtXLFdBQzFDWCxLQUFLUSxRQUFVUixLQUFLVyxRQUFRK0MsU0FFRSxnQkFBdkJ2RCxHQUFRMkIsYUFDZjlCLEtBQUs4QixXQUFhM0IsRUFBUTJCLFlBRUssZ0JBQXhCM0IsR0FBUTRCLGNBQ2YvQixLQUFLK0IsWUFBYzVCLEVBQVE0QixhQUVFLGdCQUF0QjVCLEdBQVFTLFlBQ2ZaLEtBQUtZLFVBQVlULEVBQVFTLFdBRUEsZ0JBQWxCVCxHQUFRdUIsUUFDZjFCLEtBQUswQixNQUFRdkIsRUFBUXVCLE9BRUksZ0JBQWxCdkIsR0FBUXlCLFFBQ2Y1QixLQUFLNEIsTUFBUXpCLEVBQVF5QixPQUVjLGlCQUE1QnpCLEdBQVFhLGtCQUNmaEIsS0FBS2dCLGdCQUFrQmIsRUFBUWEsaUJBRU8saUJBQS9CYixHQUFRYyxxQkFDZmpCLEtBQUtpQixtQkFBcUJkLEVBQVFjLG9CQUVELGdCQUExQmQsR0FBUTBCLGdCQUNmN0IsS0FBSzZCLGNBQWdCMUIsRUFBUTBCLGVBRUksZ0JBQTFCMUIsR0FBUTBCLGdCQUNmN0IsS0FBSzZCLGNBQWdCMUIsRUFBUTBCLGNBQWMrQixLQUFLLE1BRWYsaUJBQTFCekQsR0FBUVksZ0JBQ2ZmLEtBQUtlLGNBQWdCWixFQUFRWSxlQUVPLGlCQUE3QlosR0FBUVcsbUJBQ2ZkLEtBQUtjLGlCQUFtQlgsRUFBUVcsaUJBQzVCZCxLQUFLYyxtQkFDTGQsS0FBS1EsUUFBVVIsS0FBS00sVUFBVW9ELFVBR0osaUJBQXZCdkQsR0FBUWUsYUFDZmxCLEtBQUtrQixXQUFhZixFQUFRZSxZQUVXLGlCQUE5QmYsR0FBUWtCLG9CQUNmckIsS0FBS3FCLGtCQUFvQmxCLEVBQVFrQixtQkFFTSxnQkFBaENsQixHQUFRaUIsc0JBQ2ZwQixLQUFLb0Isb0JBQXNCakIsRUFBUWlCLHFCQUVDLGlCQUE3QmpCLEdBQVFnQixtQkFDZm5CLEtBQUttQixpQkFBbUJoQixFQUFRZ0Isa0JBRUgsaUJBQXRCaEIsR0FBUVUsWUFDZmIsS0FBS2EsVUFBWVYsRUFBUVUsV0FFVSxpQkFBNUJWLEdBQVFvQixrQkFDZnZCLEtBQUt1QixnQkFBa0JwQixFQUFRb0IsaUJBRUksaUJBQTVCcEIsR0FBUW1CLGtCQUNmdEIsS0FBS3NCLGdCQUFrQm5CLEVBQVFtQixpQkFFRSxrQkFBMUJuQixHQUFRMEQsZ0JBQ2Y3RCxLQUFLNkQsY0FBZ0IxRCxFQUFRMEQsZUFFVSxpQkFBaEMxRCxHQUFRcUIsc0JBQ2Z4QixLQUFLd0Isb0JBQXNCckIsRUFBUXFCLHFCQUdYLEdBQXhCeEIsS0FBS2dDLE9BQU9XLFNBRVosSUFEQSxHQUFJbUIsR0FBVzlELEtBQUtnQyxPQUFPVyxTQUNwQm1CLEVBQVcsR0FDZDlELEtBQUtnQyxPQUFPTyxXQUFXd0IsS0FBSy9ELEtBQUtnQyxPQUFPTyxXQUFXeUIsU0FDbkRGLEdBSVIsSUFBSUcsR0FBT0MsRUFBS0MsQ0FHaEIsSUFBaUMsbUJBQXRCaEUsR0FBUUcsV0FBd0QsbUJBQXBCSCxHQUFRSyxTQUN2RHJCLEVBQUVhLEtBQUtFLFNBQVNrRSxHQUFHLG9CQUFxQixDQUN4QyxHQUFJQyxHQUFNbEYsRUFBRWEsS0FBS0UsU0FBU21FLE1BQ3RCQyxFQUFRRCxFQUFJQyxNQUFNdEUsS0FBS2dDLE9BQU9FLFVBRWxDK0IsR0FBUUMsRUFBTSxLQUVNLEdBQWhCSSxFQUFNakIsUUFDTlksRUFBUXBFLEVBQU95RSxFQUFNLEdBQUl0RSxLQUFLZ0MsT0FBT0MsUUFDckNpQyxFQUFNckUsRUFBT3lFLEVBQU0sR0FBSXRFLEtBQUtnQyxPQUFPQyxTQUM1QmpDLEtBQUtjLGtCQUE0QixLQUFSdUQsSUFDaENKLEVBQVFwRSxFQUFPd0UsRUFBS3JFLEtBQUtnQyxPQUFPQyxRQUNoQ2lDLEVBQU1yRSxFQUFPd0UsRUFBS3JFLEtBQUtnQyxPQUFPQyxTQUVwQixPQUFWZ0MsR0FBMEIsT0FBUkMsSUFDbEJsRSxLQUFLdUUsYUFBYU4sR0FDbEJqRSxLQUFLd0UsV0FBV04sSUFLNUIsR0FBOEIsZ0JBQW5CL0QsR0FBUXNCLE9BQXFCLENBQ3BDLElBQUswQyxJQUFTaEUsR0FBUXNCLE9BQVEsQ0FHdEJ3QyxFQURvQyxnQkFBN0I5RCxHQUFRc0IsT0FBTzBDLEdBQU8sR0FDckJ0RSxFQUFPTSxFQUFRc0IsT0FBTzBDLEdBQU8sR0FBSW5FLEtBQUtnQyxPQUFPQyxRQUU3Q3BDLEVBQU9NLEVBQVFzQixPQUFPMEMsR0FBTyxJQUdyQ0QsRUFEb0MsZ0JBQTdCL0QsR0FBUXNCLE9BQU8wQyxHQUFPLEdBQ3ZCdEUsRUFBT00sRUFBUXNCLE9BQU8wQyxHQUFPLEdBQUluRSxLQUFLZ0MsT0FBT0MsUUFFN0NwQyxFQUFPTSxFQUFRc0IsT0FBTzBDLEdBQU8sSUFJbkNuRSxLQUFLVSxTQUFXdUQsRUFBTVIsU0FBU3pELEtBQUtVLFdBQ3BDdUQsRUFBUWpFLEtBQUtVLFFBQVFnRCxRQUV6QixJQUFJL0MsR0FBVVgsS0FBS1csT0FRbkIsSUFQSVgsS0FBS1ksV0FBYXFELEVBQU1QLFFBQVFlLElBQUl6RSxLQUFLWSxXQUFXK0MsUUFBUWhELEtBQzVEQSxFQUFVc0QsRUFBTVAsUUFBUWUsSUFBSXpFLEtBQUtZLFlBQ2pDRCxHQUFXdUQsRUFBSVAsUUFBUWhELEtBQ3ZCdUQsRUFBTXZELEVBQVErQyxXQUliMUQsS0FBS1UsU0FBV3dELEVBQUlULFNBQVN6RCxLQUFLVSxVQUFjQyxHQUFXc0QsRUFBTU4sUUFBUWhELElBQTlFLENBSUEsR0FBSStELEdBQU9DLFNBQVNDLGNBQWMsV0FDbENGLEdBQUtHLFVBQVlWLENBQ2pCLElBQUlXLEdBQVlKLEVBQUtLLEtBRXJCL0UsTUFBS3lCLE9BQU9xRCxJQUFjYixFQUFPQyxJQUdyQyxHQUFJYyxHQUFPLE1BQ1gsS0FBS2IsSUFBU25FLE1BQUt5QixPQUNmdUQsR0FBUSxPQUFTYixFQUFRLE9BRTdCYSxJQUFRLE9BQVNoRixLQUFLZ0MsT0FBT00saUJBQW1CLFFBQ2hEMEMsR0FBUSxRQUNSaEYsS0FBS3NELFVBQVUyQixLQUFLLFdBQVdDLFFBQVFGLEdBeUMzQyxHQXRDa0Isa0JBQVA1RSxLQUNQSixLQUFLOEMsU0FBVzFDLEdBR2ZKLEtBQUtrQixhQUNObEIsS0FBS00sVUFBWU4sS0FBS00sVUFBVUMsUUFBUSxPQUN4Q1AsS0FBS1EsUUFBVVIsS0FBS1EsUUFBUUMsTUFBTSxPQUNsQ1QsS0FBS3NELFVBQVUyQixLQUFLLGtCQUFrQkUsUUFJdENuRixLQUFLa0IsWUFBY2xCLEtBQUthLFlBQ3hCYixLQUFLYSxXQUFZLEdBRWpCYixLQUFLYSxXQUF1QyxnQkFBbkJWLEdBQVFzQixPQUNqQ3pCLEtBQUtzRCxVQUFVMkIsS0FBSyxXQUFXRSxPQUN4Qm5GLEtBQUthLFdBQ1piLEtBQUtzRCxVQUFVMkIsS0FBSyx5QkFBeUJHLFNBQVMsUUFHdERwRixLQUFLYyxtQkFDTGQsS0FBS3NELFVBQVU4QixTQUFTLFVBQ3hCcEYsS0FBS3NELFVBQVUyQixLQUFLLGtCQUFrQkcsU0FBUyxVQUMvQ3BGLEtBQUtzRCxVQUFVMkIsS0FBSyxrQkFBa0JJLE9BQ3RDckYsS0FBS3NELFVBQVUyQixLQUFLLG1CQUFtQkUsT0FDdkNuRixLQUFLc0QsVUFBVTJCLEtBQUssMERBQTBERSxPQUN6RW5GLEtBQUtrQixZQUNObEIsS0FBS3NELFVBQVUyQixLQUFLLFdBQVdFLFNBSVIsbUJBQW5CaEYsR0FBUXNCLFNBQTJCekIsS0FBS2Msa0JBQXFCZCxLQUFLd0Isc0JBQzFFeEIsS0FBS3NELFVBQVU4QixTQUFTLGlCQUc1QnBGLEtBQUtzRCxVQUFVOEIsU0FBUyxRQUFVcEYsS0FBSzBCLE9BR1QsbUJBQW5CdkIsR0FBUXNCLFFBQXdDLFNBQWR6QixLQUFLMEIsTUFBa0IsQ0FDaEUsR0FBSUQsR0FBU3pCLEtBQUtzRCxVQUFVMkIsS0FBSyxXQUM3QkssRUFBTzdELEVBQU9pQyxPQUNsQmpDLEdBQU84RCxTQUNQdkYsS0FBS3NELFVBQVUyQixLQUFLLGtCQUFrQk8sU0FBU04sUUFBUUksR0FJM0R0RixLQUFLc0QsVUFBVTJCLEtBQUsseUJBQXlCRyxTQUFTcEYsS0FBSzZCLGVBQ3ZEN0IsS0FBSzhCLFdBQVd1QixRQUNoQnJELEtBQUtzRCxVQUFVMkIsS0FBSyxhQUFhRyxTQUFTcEYsS0FBSzhCLFlBQy9DOUIsS0FBSytCLFlBQVlzQixRQUNqQnJELEtBQUtzRCxVQUFVMkIsS0FBSyxjQUFjRyxTQUFTcEYsS0FBSytCLGFBQ3BEL0IsS0FBS3NELFVBQVUyQixLQUFLLGFBQWFLLEtBQUt0RixLQUFLZ0MsT0FBT0csWUFDbERuQyxLQUFLc0QsVUFBVTJCLEtBQUssY0FBY0ssS0FBS3RGLEtBQUtnQyxPQUFPSSxhQU1uRHBDLEtBQUtzRCxVQUFVMkIsS0FBSyxhQUNmUSxHQUFHLHdCQUF5QixRQUFTdEcsRUFBRXVHLE1BQU0xRixLQUFLMkYsVUFBVzNGLE9BQzdEeUYsR0FBRyx3QkFBeUIsUUFBU3RHLEVBQUV1RyxNQUFNMUYsS0FBSzRGLFVBQVc1RixPQUM3RHlGLEdBQUcsd0JBQXlCLGVBQWdCdEcsRUFBRXVHLE1BQU0xRixLQUFLNkYsVUFBVzdGLE9BQ3BFeUYsR0FBRyw2QkFBOEIsZUFBZ0J0RyxFQUFFdUcsTUFBTTFGLEtBQUs4RixVQUFXOUYsT0FDekV5RixHQUFHLDZCQUE4QixlQUFnQnRHLEVBQUV1RyxNQUFNMUYsS0FBSytGLGlCQUFrQi9GLE9BQ2hGeUYsR0FBRyx5QkFBMEIsb0JBQXFCdEcsRUFBRXVHLE1BQU0xRixLQUFLZ0csbUJBQW9CaEcsT0FDbkZ5RixHQUFHLHlCQUEwQixxQkFBc0J0RyxFQUFFdUcsTUFBTTFGLEtBQUtnRyxtQkFBb0JoRyxPQUNwRnlGLEdBQUcseUJBQTBCLDhFQUErRXRHLEVBQUV1RyxNQUFNMUYsS0FBS2lHLFlBQWFqRyxPQUN0SXlGLEdBQUcsd0JBQXlCLCtCQUFnQ3RHLEVBQUV1RyxNQUFNMUYsS0FBS2tHLGNBQWVsRyxPQUV4RnlGLEdBQUcseUJBQTBCLCtCQUFnQ3RHLEVBQUV1RyxNQUFNMUYsS0FBS21HLGtCQUFtQm5HLE9BRWxHQSxLQUFLc0QsVUFBVTJCLEtBQUssV0FDZlEsR0FBRyx3QkFBeUIsa0JBQW1CdEcsRUFBRXVHLE1BQU0xRixLQUFLb0csV0FBWXBHLE9BQ3hFeUYsR0FBRyx3QkFBeUIsbUJBQW9CdEcsRUFBRXVHLE1BQU0xRixLQUFLcUcsWUFBYXJHLE9BQzFFeUYsR0FBRyx3QkFBeUIsS0FBTXRHLEVBQUV1RyxNQUFNMUYsS0FBS3NHLFdBQVl0RyxPQUMzRHlGLEdBQUcsNkJBQThCLEtBQU10RyxFQUFFdUcsTUFBTTFGLEtBQUt1RyxXQUFZdkcsT0FDaEV5RixHQUFHLDZCQUE4QixLQUFNdEcsRUFBRXVHLE1BQU0xRixLQUFLK0YsaUJBQWtCL0YsT0FFdkVBLEtBQUtFLFFBQVFrRSxHQUFHLFNBQ2hCcEUsS0FBS0UsUUFBUXVGLElBQ1RlLHdCQUF5QnJILEVBQUV1RyxNQUFNMUYsS0FBS3FGLEtBQU1yRixNQUM1Q3lHLHdCQUF5QnRILEVBQUV1RyxNQUFNMUYsS0FBS3FGLEtBQU1yRixNQUM1QzBHLHdCQUF5QnZILEVBQUV1RyxNQUFNMUYsS0FBSzJHLGVBQWdCM0csTUFDdEQ0RywwQkFBMkJ6SCxFQUFFdUcsTUFBTTFGLEtBQUs2RyxRQUFTN0csUUFHckRBLEtBQUtFLFFBQVF1RixHQUFHLHdCQUF5QnRHLEVBQUV1RyxNQUFNMUYsS0FBSzhHLE9BQVE5RyxPQU85REEsS0FBS0UsUUFBUWtFLEdBQUcsV0FBYXBFLEtBQUtjLGtCQUFvQmQsS0FBS3VCLGlCQUMzRHZCLEtBQUtFLFFBQVFtRSxJQUFJckUsS0FBS00sVUFBVTJCLE9BQU9qQyxLQUFLZ0MsT0FBT0MsUUFBVWpDLEtBQUtnQyxPQUFPRSxVQUFZbEMsS0FBS1EsUUFBUXlCLE9BQU9qQyxLQUFLZ0MsT0FBT0MsU0FDckhqQyxLQUFLRSxRQUFRNkcsUUFBUSxXQUNkL0csS0FBS0UsUUFBUWtFLEdBQUcsVUFBWXBFLEtBQUt1QixrQkFDeEN2QixLQUFLRSxRQUFRbUUsSUFBSXJFLEtBQUtNLFVBQVUyQixPQUFPakMsS0FBS2dDLE9BQU9DLFNBQ25EakMsS0FBS0UsUUFBUTZHLFFBQVEsV0F5a0M3QixPQXBrQ0E5RyxHQUFnQitHLFdBRVpDLFlBQWFoSCxFQUVic0UsYUFBYyxTQUFTakUsR0FDTSxnQkFBZEEsS0FDUE4sS0FBS00sVUFBWVQsRUFBT1MsRUFBV04sS0FBS2dDLE9BQU9DLFNBRTFCLGdCQUFkM0IsS0FDUE4sS0FBS00sVUFBWVQsRUFBT1MsSUFFdkJOLEtBQUtrQixhQUNObEIsS0FBS00sVUFBWU4sS0FBS00sVUFBVUMsUUFBUSxRQUV4Q1AsS0FBS2tCLFlBQWNsQixLQUFLb0IscUJBQ3hCcEIsS0FBS00sVUFBVTRHLE9BQU9DLEtBQUtDLE1BQU1wSCxLQUFLTSxVQUFVNEcsU0FBV2xILEtBQUtvQixxQkFBdUJwQixLQUFLb0IscUJBRTVGcEIsS0FBS1UsU0FBV1YsS0FBS00sVUFBVW1ELFNBQVN6RCxLQUFLVSxXQUM3Q1YsS0FBS00sVUFBWU4sS0FBS1UsU0FFdEJWLEtBQUtXLFNBQVdYLEtBQUtNLFVBQVVxRCxRQUFRM0QsS0FBS1csV0FDNUNYLEtBQUtNLFVBQVlOLEtBQUtXLFNBRXJCWCxLQUFLK0MsV0FDTi9DLEtBQUtxSCxnQkFFVHJILEtBQUtzSCxzQkFHVDlDLFdBQVksU0FBU2hFLEdBQ00sZ0JBQVpBLEtBQ1BSLEtBQUtRLFFBQVVYLEVBQU9XLEVBQVNSLEtBQUtnQyxPQUFPQyxTQUV4QixnQkFBWnpCLEtBQ1BSLEtBQUtRLFFBQVVYLEVBQU9XLElBRXJCUixLQUFLa0IsYUFDTmxCLEtBQUtRLFFBQVVSLEtBQUtRLFFBQVFDLE1BQU0sUUFFbENULEtBQUtrQixZQUFjbEIsS0FBS29CLHFCQUN4QnBCLEtBQUtRLFFBQVEwRyxPQUFPQyxLQUFLQyxNQUFNcEgsS0FBS1EsUUFBUTBHLFNBQVdsSCxLQUFLb0IscUJBQXVCcEIsS0FBS29CLHFCQUV4RnBCLEtBQUtRLFFBQVFpRCxTQUFTekQsS0FBS00sYUFDM0JOLEtBQUtRLFFBQVVSLEtBQUtNLFVBQVVvRCxTQUU5QjFELEtBQUtXLFNBQVdYLEtBQUtRLFFBQVFtRCxRQUFRM0QsS0FBS1csV0FDMUNYLEtBQUtRLFFBQVVSLEtBQUtXLFNBRXBCWCxLQUFLWSxXQUFhWixLQUFLTSxVQUFVb0QsUUFBUWUsSUFBSXpFLEtBQUtZLFdBQVc2QyxTQUFTekQsS0FBS1EsV0FDM0VSLEtBQUtRLFFBQVVSLEtBQUtNLFVBQVVvRCxRQUFRZSxJQUFJekUsS0FBS1ksWUFFbkRaLEtBQUt1SCxrQkFBb0J2SCxLQUFLUSxRQUFRa0QsUUFFakMxRCxLQUFLK0MsV0FDTi9DLEtBQUtxSCxnQkFFVHJILEtBQUtzSCxzQkFHVHpELGNBQWUsV0FDWCxPQUFPLEdBR1gyRCxXQUFZLFdBQ0p4SCxLQUFLa0IsYUFDTGxCLEtBQUt5SCxpQkFBaUIsUUFDdEJ6SCxLQUFLeUgsaUJBQWlCLFNBQ2pCekgsS0FBS1EsUUFHTlIsS0FBS3NELFVBQVUyQixLQUFLLGdDQUFnQ3lDLFdBQVcsWUFBWUMsWUFBWSxZQUZ2RjNILEtBQUtzRCxVQUFVMkIsS0FBSyxnQ0FBZ0MyQyxLQUFLLFdBQVksWUFBWXhDLFNBQVMsYUFLOUZwRixLQUFLUSxTQUNMUixLQUFLc0QsVUFBVTJCLEtBQUsscUNBQXFDMEMsWUFBWSxVQUNyRTNILEtBQUtzRCxVQUFVMkIsS0FBSyx1Q0FBdUNHLFNBQVMsWUFFcEVwRixLQUFLc0QsVUFBVTJCLEtBQUsscUNBQXFDRyxTQUFTLFVBQ2xFcEYsS0FBS3NELFVBQVUyQixLQUFLLHVDQUF1QzBDLFlBQVksV0FFM0UzSCxLQUFLc0gscUJBQ0x0SCxLQUFLNkgsa0JBQ0w3SCxLQUFLK0Ysb0JBR1R1QixtQkFBb0IsV0FDaEIsR0FBSXRILEtBQUtRLFFBQVMsQ0FHZCxJQUFLUixLQUFLYyxrQkFBb0JkLEtBQUtnRCxhQUFhOEUsT0FBUzlILEtBQUtpRCxjQUFjNkUsUUFDdkU5SCxLQUFLTSxVQUFVMkIsT0FBTyxZQUFjakMsS0FBS2dELGFBQWE4RSxNQUFNN0YsT0FBTyxZQUFjakMsS0FBS00sVUFBVTJCLE9BQU8sWUFBY2pDLEtBQUtpRCxjQUFjNkUsTUFBTTdGLE9BQU8sY0FFckpqQyxLQUFLUSxRQUFReUIsT0FBTyxZQUFjakMsS0FBS2dELGFBQWE4RSxNQUFNN0YsT0FBTyxZQUFjakMsS0FBS1EsUUFBUXlCLE9BQU8sWUFBY2pDLEtBQUtpRCxjQUFjNkUsTUFBTTdGLE9BQU8sWUFFbEosTUFHSmpDLE1BQUtnRCxhQUFhOEUsTUFBUTlILEtBQUtNLFVBQVVvRCxRQUFRcUUsS0FBSyxHQUNqRC9ILEtBQUtzQixpQkFBb0J0QixLQUFLUSxRQUFRc0gsU0FBVzlILEtBQUtNLFVBQVV3SCxTQUFXOUgsS0FBS1EsUUFBUXdILFFBQVVoSSxLQUFLTSxVQUFVMEgsT0FHbEhoSSxLQUFLaUQsY0FBYzZFLE1BQVE5SCxLQUFLTSxVQUFVb0QsUUFBUXFFLEtBQUssR0FBR3RELElBQUksRUFBRyxTQUZqRXpFLEtBQUtpRCxjQUFjNkUsTUFBUTlILEtBQUtRLFFBQVFrRCxRQUFRcUUsS0FBSyxPQU1yRC9ILE1BQUtnRCxhQUFhOEUsTUFBTTdGLE9BQU8sWUFBY2pDLEtBQUtNLFVBQVUyQixPQUFPLFlBQWNqQyxLQUFLaUQsY0FBYzZFLE1BQU03RixPQUFPLFlBQWNqQyxLQUFLTSxVQUFVMkIsT0FBTyxhQUNySmpDLEtBQUtnRCxhQUFhOEUsTUFBUTlILEtBQUtNLFVBQVVvRCxRQUFRcUUsS0FBSyxHQUN0RC9ILEtBQUtpRCxjQUFjNkUsTUFBUTlILEtBQUtNLFVBQVVvRCxRQUFRcUUsS0FBSyxHQUFHdEQsSUFBSSxFQUFHLFdBSzdFb0QsZ0JBQWlCLFdBRWIsR0FBSTdILEtBQUtrQixXQUFZLENBQ2pCLEdBQUkrRyxHQUFNZixFQUFRZ0IsQ0FDbEIsSUFBSWxJLEtBQUtRLFNBSUwsR0FIQXlILEVBQU9FLFNBQVNuSSxLQUFLc0QsVUFBVTJCLEtBQUsscUJBQXFCWixNQUFPLElBQ2hFNkMsRUFBU2lCLFNBQVNuSSxLQUFLc0QsVUFBVTJCLEtBQUssdUJBQXVCWixNQUFPLElBQ3BFNkQsRUFBU2xJLEtBQUtxQixrQkFBb0I4RyxTQUFTbkksS0FBS3NELFVBQVUyQixLQUFLLHVCQUF1QlosTUFBTyxJQUFNLEdBQzlGckUsS0FBS21CLGlCQUFrQixDQUN4QixHQUFJaUgsR0FBT3BJLEtBQUtzRCxVQUFVMkIsS0FBSyxxQkFBcUJaLEtBQ3ZDLFFBQVQrRCxHQUFpQkgsRUFBTyxLQUN4QkEsR0FBUSxJQUNDLE9BQVRHLEdBQTBCLEtBQVRILElBQ2pCQSxFQUFPLFFBTWYsSUFIQUEsRUFBT0UsU0FBU25JLEtBQUtzRCxVQUFVMkIsS0FBSyxzQkFBc0JaLE1BQU8sSUFDakU2QyxFQUFTaUIsU0FBU25JLEtBQUtzRCxVQUFVMkIsS0FBSyx3QkFBd0JaLE1BQU8sSUFDckU2RCxFQUFTbEksS0FBS3FCLGtCQUFvQjhHLFNBQVNuSSxLQUFLc0QsVUFBVTJCLEtBQUssd0JBQXdCWixNQUFPLElBQU0sR0FDL0ZyRSxLQUFLbUIsaUJBQWtCLENBQ3hCLEdBQUlpSCxHQUFPcEksS0FBS3NELFVBQVUyQixLQUFLLHNCQUFzQlosS0FDeEMsUUFBVCtELEdBQWlCSCxFQUFPLEtBQ3hCQSxHQUFRLElBQ0MsT0FBVEcsR0FBMEIsS0FBVEgsSUFDakJBLEVBQU8sR0FHbkJqSSxLQUFLZ0QsYUFBYThFLE1BQU1HLEtBQUtBLEdBQU1mLE9BQU9BLEdBQVFnQixPQUFPQSxHQUN6RGxJLEtBQUtpRCxjQUFjNkUsTUFBTUcsS0FBS0EsR0FBTWYsT0FBT0EsR0FBUWdCLE9BQU9BLEdBRzlEbEksS0FBS3FJLGVBQWUsUUFDcEJySSxLQUFLcUksZUFBZSxTQUdwQnJJLEtBQUtzRCxVQUFVMkIsS0FBSyxjQUFjMEMsWUFBWSxVQUMxQixNQUFoQjNILEtBQUtRLFNBRVRSLEtBQUtzSSx3QkFHVEQsZUFBZ0IsU0FBU0UsR0FNckIsR0FBSUMsR0FBbUIsUUFBUkQsRUFBaUJ2SSxLQUFLZ0QsYUFBZWhELEtBQUtpRCxjQUNyRDZFLEVBQVFVLEVBQVNWLE1BQU1BLFFBQ3ZCRSxFQUFPUSxFQUFTVixNQUFNRSxPQUN0QkMsRUFBT08sRUFBU1YsTUFBTUcsT0FDdEJmLEVBQVNzQixFQUFTVixNQUFNWixTQUN4QmdCLEVBQVNNLEVBQVNWLE1BQU1JLFNBQ3hCTyxFQUFjNUksR0FBUW1JLEVBQU1GLElBQVFXLGNBQ3BDOUYsRUFBVzlDLEdBQVFtSSxFQUFNRixFQUFPLElBQ2hDWSxFQUFVN0ksR0FBUW1JLEVBQU1GLEVBQU9XLElBQy9CRSxFQUFZOUksRUFBTzhDLEdBQVVpRyxTQUFTLEVBQUcsU0FBU2QsUUFDbERlLEVBQVdoSixFQUFPOEMsR0FBVWlHLFNBQVMsRUFBRyxTQUFTWixPQUNqRGMsRUFBa0JqSixHQUFRZ0osRUFBVUYsSUFBWUYsY0FDaERNLEVBQVlwRyxFQUFTcUcsTUFHckJSLElBQ0pBLEdBQVM3RixTQUFXQSxFQUNwQjZGLEVBQVNFLFFBQVVBLENBRW5CLEtBQUssR0FBSU8sR0FBSSxFQUFHQSxFQUFJLEVBQUdBLElBQ25CVCxFQUFTUyxLQUliLElBQUlDLEdBQVdKLEVBQWtCQyxFQUFZL0ksS0FBS2dDLE9BQU9XLFNBQVcsQ0FDaEV1RyxHQUFXSixJQUNYSSxHQUFZLEdBRVpILEdBQWEvSSxLQUFLZ0MsT0FBT1csV0FDekJ1RyxFQUFXSixFQUFrQixFQUtqQyxLQUFLLEdBRERLLEdBQUtDLEVBRkxDLEVBQVV4SixHQUFRZ0osRUFBVUYsRUFBV08sRUFBVSxHQUFJaEMsRUFBUWdCLElBR3hEZSxFQUFJLEVBQUdFLEVBQU0sRUFBR0MsRUFBTSxFQUFHSCxFQUFJLEdBQUlBLElBQUtFLElBQU9FLEVBQVV4SixFQUFPd0osR0FBUzVFLElBQUksR0FBSSxRQUNoRndFLEVBQUksR0FBS0UsRUFBTSxJQUFNLElBQ3JCQSxFQUFNLEVBQ05DLEtBRUpaLEVBQVNZLEdBQUtELEdBQU9FLEVBQVEzRixRQUFRdUUsS0FBS0EsR0FBTWYsT0FBT0EsR0FBUWdCLE9BQU9BLEdBQ3RFbUIsRUFBUXBCLEtBQUssSUFFVGpJLEtBQUtVLFNBQVc4SCxFQUFTWSxHQUFLRCxHQUFLbEgsT0FBTyxlQUFpQmpDLEtBQUtVLFFBQVF1QixPQUFPLGVBQWlCdUcsRUFBU1ksR0FBS0QsR0FBSzFGLFNBQVN6RCxLQUFLVSxVQUFvQixRQUFSNkgsSUFDN0lDLEVBQVNZLEdBQUtELEdBQU9uSixLQUFLVSxRQUFRZ0QsU0FHbEMxRCxLQUFLVyxTQUFXNkgsRUFBU1ksR0FBS0QsR0FBS2xILE9BQU8sZUFBaUJqQyxLQUFLVyxRQUFRc0IsT0FBTyxlQUFpQnVHLEVBQVNZLEdBQUtELEdBQUt4RixRQUFRM0QsS0FBS1csVUFBb0IsU0FBUjRILElBQzVJQyxFQUFTWSxHQUFLRCxHQUFPbkosS0FBS1csUUFBUStDLFFBTTlCLFNBQVI2RSxFQUNBdkksS0FBS2dELGFBQWF3RixTQUFXQSxFQUU3QnhJLEtBQUtpRCxjQUFjdUYsU0FBV0EsQ0FPbEMsSUFBSTlILEdBQWtCLFFBQVI2SCxFQUFpQnZJLEtBQUtVLFFBQVVWLEtBQUtNLFVBQy9DSyxFQUFVWCxLQUFLVyxRQUdmMkUsR0FGbUIsUUFBUmlELEVBQWlCdkksS0FBS00sVUFBWU4sS0FBS1EsUUFFM0Msa0NBQ1g4RSxJQUFRLFVBQ1JBLEdBQVEsUUFHSnRGLEtBQUtnQixpQkFBbUJoQixLQUFLaUIsc0JBQzdCcUUsR0FBUSxhQUtSQSxHQUhFNUUsSUFBV0EsRUFBUStDLFNBQVMrRSxFQUFTN0YsV0FBZ0IzQyxLQUFLc0IsaUJBQTJCLFFBQVJpSCxFQUd2RSxZQUZBLHFHQUtaLElBQUllLEdBQVd0SixLQUFLZ0MsT0FBT1MsV0FBVytGLEVBQVMsR0FBRyxHQUFHVixTQUFXVSxFQUFTLEdBQUcsR0FBR3ZHLE9BQU8sUUFFdEYsSUFBSWpDLEtBQUtlLGNBQWUsQ0FTcEIsSUFBSyxHQVJEd0ksR0FBZWYsRUFBUyxHQUFHLEdBQUdWLFFBQzlCMEIsRUFBY2hCLEVBQVMsR0FBRyxHQUFHUixPQUM3QnlCLEVBQVc5SSxHQUFXQSxFQUFRcUgsUUFBWXdCLEVBQWMsRUFDeERFLEVBQVdoSixHQUFXQSxFQUFRc0gsUUFBWXdCLEVBQWMsR0FDeERHLEVBQVlILEdBQWVFLEVBQzNCRSxFQUFZSixHQUFlQyxFQUUzQkksRUFBWSwrQkFDUEMsRUFBSSxFQUFHQSxFQUFJLEdBQUlBLElBRWhCRCxLQURFRixHQUFhRyxHQUFLcEosRUFBUW9ILFlBQWM4QixHQUFhRSxHQUFLbkosRUFBUW1ILFNBQ3ZELGtCQUFvQmdDLEVBQUksS0FDaENBLElBQU1QLEVBQWUsdUJBQXlCLElBQy9DLElBQU12SixLQUFLZ0MsT0FBT1MsV0FBV3FILEdBQUssWUFFekIsa0JBQW9CQSxFQUFJLEtBQ2hDQSxJQUFNUCxFQUFlLHVCQUF5QixJQUMvQyx3QkFBMEJ2SixLQUFLZ0MsT0FBT1MsV0FBV3FILEdBQUssV0FHbEVELElBQWEsV0FHYixLQUFLLEdBRERFLEdBQVcsOEJBQ05DLEVBQUlOLEVBQVNNLEdBQUtQLEVBQVNPLElBQ2hDRCxHQUFZLGtCQUFvQkMsRUFBSSxLQUMvQkEsSUFBTVIsRUFBYyx1QkFBeUIsSUFDOUMsSUFBTVEsRUFBSSxXQUVsQkQsSUFBWSxZQUVaVCxFQUFXTyxFQUFZRSxFQTJCM0IsR0F4QkF6RSxHQUFRLGlDQUFtQ2dFLEVBQVcsUUFJbERoRSxHQUhFM0UsSUFBV0EsRUFBUWdELFFBQVE2RSxFQUFTRSxVQUFlMUksS0FBS3NCLGlCQUEyQixTQUFSaUgsSUFBbUJ2SSxLQUFLYyxpQkFHN0YsWUFGQSx3R0FLWndFLEdBQVEsUUFDUkEsR0FBUSxRQUdKdEYsS0FBS2dCLGlCQUFtQmhCLEtBQUtpQixzQkFDN0JxRSxHQUFRLG9CQUFzQnRGLEtBQUtnQyxPQUFPSyxVQUFZLFNBRTFEbEQsRUFBRThLLEtBQUtqSyxLQUFLZ0MsT0FBT08sV0FBWSxTQUFTMkgsRUFBT25CLEdBQzNDekQsR0FBUSxPQUFTeUQsRUFBWSxVQUdqQ3pELEdBQVEsUUFDUkEsR0FBUSxXQUNSQSxHQUFRLFVBSVksTUFBaEJ0RixLQUFLUSxTQUFtQlIsS0FBS1ksVUFBVyxDQUN4QyxHQUFJdUosR0FBV25LLEtBQUtNLFVBQVVvRCxRQUFRZSxJQUFJekUsS0FBS1ksV0FBV0gsTUFBTSxNQUMzREUsS0FBV3dKLEVBQVMxRyxTQUFTOUMsS0FDOUJBLEVBQVV3SixHQUlsQixJQUFLLEdBQUlmLEdBQU0sRUFBR0EsRUFBTSxFQUFHQSxJQUFPLENBQzlCOUQsR0FBUSxPQUdKdEYsS0FBS2dCLGdCQUNMc0UsR0FBUSxvQkFBc0JrRCxFQUFTWSxHQUFLLEdBQUdnQixPQUFTLFFBQ25EcEssS0FBS2lCLHFCQUNWcUUsR0FBUSxvQkFBc0JrRCxFQUFTWSxHQUFLLEdBQUdpQixVQUFZLFFBRS9ELEtBQUssR0FBSWxCLEdBQU0sRUFBR0EsRUFBTSxFQUFHQSxJQUFPLENBRTlCLEdBQUltQixLQUdBOUIsR0FBU1ksR0FBS0QsR0FBS29CLE9BQU8sR0FBSUMsTUFBUSxRQUN0Q0YsRUFBUXZHLEtBQUssU0FHYnlFLEVBQVNZLEdBQUtELEdBQUtzQixhQUFlLEdBQ2xDSCxFQUFRdkcsS0FBSyxXQUdieUUsRUFBU1ksR0FBS0QsR0FBS3JCLFNBQVdVLEVBQVMsR0FBRyxHQUFHVixTQUM3Q3dDLEVBQVF2RyxLQUFLLE9BR2IvRCxLQUFLVSxTQUFXOEgsRUFBU1ksR0FBS0QsR0FBSzFGLFNBQVN6RCxLQUFLVSxRQUFTLFFBQzFENEosRUFBUXZHLEtBQUssTUFBTyxZQUdwQnBELEdBQVc2SCxFQUFTWSxHQUFLRCxHQUFLeEYsUUFBUWhELEVBQVMsUUFDL0MySixFQUFRdkcsS0FBSyxNQUFPLFlBR3BCL0QsS0FBSzZELGNBQWMyRSxFQUFTWSxHQUFLRCxLQUNqQ21CLEVBQVF2RyxLQUFLLE1BQU8sWUFHcEJ5RSxFQUFTWSxHQUFLRCxHQUFLbEgsT0FBTyxlQUFpQmpDLEtBQUtNLFVBQVUyQixPQUFPLGVBQ2pFcUksRUFBUXZHLEtBQUssU0FBVSxjQUdQLE1BQWhCL0QsS0FBS1EsU0FBbUJnSSxFQUFTWSxHQUFLRCxHQUFLbEgsT0FBTyxlQUFpQmpDLEtBQUtRLFFBQVF5QixPQUFPLGVBQ3ZGcUksRUFBUXZHLEtBQUssU0FBVSxZQUdQLE1BQWhCL0QsS0FBS1EsU0FBbUJnSSxFQUFTWSxHQUFLRCxHQUFPbkosS0FBS00sV0FBYWtJLEVBQVNZLEdBQUtELEdBQU9uSixLQUFLUSxTQUN6RjhKLEVBQVF2RyxLQUFLLFdBR2pCLEtBQUssR0FERDJHLEdBQVEsR0FBSUMsR0FBVyxFQUNsQjFCLEVBQUksRUFBR0EsRUFBSXFCLEVBQVFqSCxPQUFRNEYsSUFDaEN5QixHQUFTSixFQUFRckIsR0FBSyxJQUNKLFlBQWRxQixFQUFRckIsS0FDUjBCLEdBQVcsRUFFZEEsS0FDREQsR0FBUyxhQUVicEYsR0FBUSxjQUFnQm9GLEVBQU1FLFFBQVEsYUFBYyxJQUFNLGtCQUF5QnhCLEVBQU0sSUFBTUQsRUFBTSxLQUFPWCxFQUFTWSxHQUFLRCxHQUFLcEIsT0FBUyxRQUc1SXpDLEdBQVEsUUFHWkEsR0FBUSxXQUNSQSxHQUFRLFdBRVJ0RixLQUFLc0QsVUFBVTJCLEtBQUssYUFBZXNELEVBQU8sb0JBQW9CakQsS0FBS0EsSUFJdkVtQyxpQkFBa0IsU0FBU2MsR0FFdkIsR0FBSWpELEdBQU11RixFQUFVbkssRUFBU0MsRUFBVVgsS0FBS1csT0FLNUMsS0FISVgsS0FBS1ksV0FBZVosS0FBS1csVUFBV1gsS0FBS00sVUFBVW9ELFFBQVFlLElBQUl6RSxLQUFLWSxXQUFXK0MsUUFBUTNELEtBQUtXLFdBQzVGQSxFQUFVWCxLQUFLTSxVQUFVb0QsUUFBUWUsSUFBSXpFLEtBQUtZLFlBRWxDLFFBQVIySCxFQUNBc0MsRUFBVzdLLEtBQUtNLFVBQVVvRCxRQUMxQmhELEVBQVVWLEtBQUtVLFlBQ1osSUFBWSxTQUFSNkgsRUFBaUIsQ0FDeEJzQyxFQUFXN0ssS0FBS1EsUUFBVVIsS0FBS1EsUUFBUWtELFFBQVUxRCxLQUFLdUgsa0JBQWtCN0QsUUFDeEVoRCxFQUFVVixLQUFLTSxTQUdmLElBQUl3SyxHQUFlOUssS0FBS3NELFVBQVUyQixLQUFLLHFDQUN2QyxJQUEyQixJQUF2QjZGLEVBQWF4RixPQUFjLENBTTNCLEdBSkF1RixFQUFTNUMsS0FBSzZDLEVBQWE3RixLQUFLLCtCQUErQlosT0FBU3dHLEVBQVM1QyxRQUNqRjRDLEVBQVMzRCxPQUFPNEQsRUFBYTdGLEtBQUssaUNBQWlDWixPQUFTd0csRUFBUzNELFVBQ3JGMkQsRUFBUzNDLE9BQU80QyxFQUFhN0YsS0FBSyxpQ0FBaUNaLE9BQVN3RyxFQUFTM0MsV0FFaEZsSSxLQUFLbUIsaUJBQWtCLENBQ3hCLEdBQUlpSCxHQUFPMEMsRUFBYTdGLEtBQUssK0JBQStCWixLQUMvQyxRQUFUK0QsR0FBaUJ5QyxFQUFTNUMsT0FBUyxJQUNuQzRDLEVBQVM1QyxLQUFLNEMsRUFBUzVDLE9BQVMsSUFDdkIsT0FBVEcsR0FBcUMsS0FBcEJ5QyxFQUFTNUMsUUFDMUI0QyxFQUFTNUMsS0FBSyxHQUdsQjRDLEVBQVNwSCxTQUFTekQsS0FBS00sYUFDdkJ1SyxFQUFXN0ssS0FBS00sVUFBVW9ELFNBRTFCbUgsRUFBU2xILFFBQVFoRCxLQUNqQmtLLEVBQVdsSyxFQUFRK0MsVUFTL0I0QixFQUFPLDZCQUtQLEtBQUssR0FIRHJCLEdBQVFqRSxLQUFLbUIsaUJBQW1CLEVBQUksRUFDcEMrQyxFQUFNbEUsS0FBS21CLGlCQUFtQixHQUFLLEdBRTlCOEgsRUFBSWhGLEVBQU9nRixHQUFLL0UsRUFBSytFLElBQUssQ0FDL0IsR0FBSThCLEdBQVU5QixDQUNUakosTUFBS21CLG1CQUNONEosRUFBVUYsRUFBUzVDLFFBQVUsR0FBVyxJQUFMZ0IsRUFBVSxHQUFLQSxFQUFJLEdBQVksSUFBTEEsRUFBVSxFQUFJQSxFQUUvRSxJQUFJK0IsR0FBT0gsRUFBU25ILFFBQVF1RSxLQUFLOEMsR0FDN0JKLEdBQVcsQ0FDWGpLLElBQVdzSyxFQUFLOUQsT0FBTyxJQUFJekQsU0FBUy9DLEtBQ3BDaUssR0FBVyxHQUNYaEssR0FBV3FLLEVBQUs5RCxPQUFPLEdBQUd2RCxRQUFRaEQsS0FDbENnSyxHQUFXLEdBS1hyRixHQUhBeUYsR0FBV0YsRUFBUzVDLFFBQVcwQyxFQUV4QkEsRUFDQyxrQkFBb0IxQixFQUFJLDBDQUE0Q0EsRUFBSSxZQUV4RSxrQkFBb0JBLEVBQUksS0FBT0EsRUFBSSxZQUpuQyxrQkFBb0JBLEVBQUkseUJBQTJCQSxFQUFJLFlBUXZFM0QsR0FBUSxhQU1SQSxHQUFRLGlDQUVSLEtBQUssR0FBSTJELEdBQUksRUFBR0EsRUFBSSxHQUFJQSxHQUFLakosS0FBS29CLG9CQUFxQixDQUNuRCxHQUFJNkosR0FBU2hDLEVBQUksR0FBSyxJQUFNQSxFQUFJQSxFQUM1QitCLEVBQU9ILEVBQVNuSCxRQUFRd0QsT0FBTytCLEdBRS9CMEIsR0FBVyxDQUNYakssSUFBV3NLLEVBQUs5QyxPQUFPLElBQUl6RSxTQUFTL0MsS0FDcENpSyxHQUFXLEdBQ1hoSyxHQUFXcUssRUFBSzlDLE9BQU8sR0FBR3ZFLFFBQVFoRCxLQUNsQ2dLLEdBQVcsR0FLWHJGLEdBSEF1RixFQUFTM0QsVUFBWStCLEdBQU0wQixFQUVwQkEsRUFDQyxrQkFBb0IxQixFQUFJLDBDQUE0Q2dDLEVBQVMsWUFFN0Usa0JBQW9CaEMsRUFBSSxLQUFPZ0MsRUFBUyxZQUp4QyxrQkFBb0JoQyxFQUFJLHlCQUEyQmdDLEVBQVMsWUFjNUUsR0FOQTNGLEdBQVEsYUFNSnRGLEtBQUtxQixrQkFBbUIsQ0FDeEJpRSxHQUFRLGlDQUVSLEtBQUssR0FBSTJELEdBQUksRUFBR0EsRUFBSSxHQUFJQSxJQUFLLENBQ3pCLEdBQUlnQyxHQUFTaEMsRUFBSSxHQUFLLElBQU1BLEVBQUlBLEVBQzVCK0IsRUFBT0gsRUFBU25ILFFBQVF3RSxPQUFPZSxHQUUvQjBCLEdBQVcsQ0FDWGpLLElBQVdzSyxFQUFLdkgsU0FBUy9DLEtBQ3pCaUssR0FBVyxHQUNYaEssR0FBV3FLLEVBQUtySCxRQUFRaEQsS0FDeEJnSyxHQUFXLEdBS1hyRixHQUhBdUYsRUFBUzNDLFVBQVllLEdBQU0wQixFQUVwQkEsRUFDQyxrQkFBb0IxQixFQUFJLDBDQUE0Q2dDLEVBQVMsWUFFN0Usa0JBQW9CaEMsRUFBSSxLQUFPZ0MsRUFBUyxZQUp4QyxrQkFBb0JoQyxFQUFJLHlCQUEyQmdDLEVBQVMsWUFRNUUzRixHQUFRLGFBT1osSUFBS3RGLEtBQUttQixpQkFBa0IsQ0FDeEJtRSxHQUFRLDZCQUVSLElBQUk0RixHQUFVLEdBQ1ZDLEVBQVUsRUFFVnpLLElBQVdtSyxFQUFTbkgsUUFBUXVFLEtBQUssSUFBSWYsT0FBTyxHQUFHZ0IsT0FBTyxHQUFHekUsU0FBUy9DLEtBQ2xFd0ssRUFBVSx5Q0FFVnZLLEdBQVdrSyxFQUFTbkgsUUFBUXVFLEtBQUssR0FBR2YsT0FBTyxHQUFHZ0IsT0FBTyxHQUFHdkUsUUFBUWhELEtBQ2hFd0ssRUFBVSx5Q0FHVjdGLEdBREF1RixFQUFTNUMsUUFBVSxHQUNYLHFCQUF1QmlELEVBQVUscURBQXVEQyxFQUFVLGVBRWxHLHlDQUEyQ0QsRUFBVSxpQ0FBbUNDLEVBQVUsZUFHOUc3RixHQUFRLFlBR1p0RixLQUFLc0QsVUFBVTJCLEtBQUssYUFBZXNELEVBQU8sdUJBQXVCakQsS0FBS0EsSUFJMUVTLGlCQUFrQixXQUdWL0YsS0FBS3NELFVBQVUyQixLQUFLLHFDQUFxQ2IsR0FBRyxXQUFhcEUsS0FBS3NELFVBQVUyQixLQUFLLG1DQUFtQ2IsR0FBRyxZQUd2SXBFLEtBQUtzRCxVQUFVMkIsS0FBSyxxQ0FBcUNaLElBQUlyRSxLQUFLTSxVQUFVMkIsT0FBT2pDLEtBQUtnQyxPQUFPQyxTQUMzRmpDLEtBQUtRLFNBQ0xSLEtBQUtzRCxVQUFVMkIsS0FBSyxtQ0FBbUNaLElBQUlyRSxLQUFLUSxRQUFReUIsT0FBT2pDLEtBQUtnQyxPQUFPQyxTQUUzRmpDLEtBQUtjLGtCQUFxQmQsS0FBS1EsVUFBWVIsS0FBS00sVUFBVW1ELFNBQVN6RCxLQUFLUSxVQUFZUixLQUFLTSxVQUFVaUssT0FBT3ZLLEtBQUtRLFVBQy9HUixLQUFLc0QsVUFBVTJCLEtBQUssbUJBQW1CeUMsV0FBVyxZQUVsRDFILEtBQUtzRCxVQUFVMkIsS0FBSyxtQkFBbUIyQyxLQUFLLFdBQVksY0FLaEV3RCxLQUFNLFdBQ0YsR0FDSUMsR0FEQUMsR0FBaUJDLElBQUssRUFBR0MsS0FBTSxHQUUvQkMsRUFBa0J0TSxFQUFFSyxRQUFRa00sT0FDM0IxTCxNQUFLSyxTQUFTK0QsR0FBRyxVQUNsQmtILEdBQ0lDLElBQUt2TCxLQUFLSyxTQUFTc0wsU0FBU0osSUFBTXZMLEtBQUtLLFNBQVN1TCxZQUNoREosS0FBTXhMLEtBQUtLLFNBQVNzTCxTQUFTSCxLQUFPeEwsS0FBS0ssU0FBU3dMLGNBRXRESixFQUFrQnpMLEtBQUtLLFNBQVMsR0FBR3lMLFlBQWM5TCxLQUFLSyxTQUFTc0wsU0FBU0gsTUFJeEVILEVBRGMsTUFBZHJMLEtBQUs0QixNQUNVNUIsS0FBS0UsUUFBUXlMLFNBQVNKLElBQU12TCxLQUFLc0QsVUFBVXlJLGNBQWdCVCxFQUFhQyxJQUV4RXZMLEtBQUtFLFFBQVF5TCxTQUFTSixJQUFNdkwsS0FBS0UsUUFBUTZMLGNBQWdCVCxFQUFhQyxJQUN6RnZMLEtBQUtzRCxVQUF3QixNQUFkdEQsS0FBSzRCLE1BQWdCLFdBQWEsZUFBZSxVQUU5QyxRQUFkNUIsS0FBSzBCLE9BQ0wxQixLQUFLc0QsVUFBVTBJLEtBQ1hULElBQUtGLEVBQ0xZLE1BQU9SLEVBQWtCekwsS0FBS0UsUUFBUXlMLFNBQVNILEtBQU94TCxLQUFLRSxRQUFRZ00sYUFDbkVWLEtBQU0sU0FFTnhMLEtBQUtzRCxVQUFVcUksU0FBU0gsS0FBTyxHQUMvQnhMLEtBQUtzRCxVQUFVMEksS0FDWEMsTUFBTyxPQUNQVCxLQUFNLEtBR08sVUFBZHhMLEtBQUswQixPQUNaMUIsS0FBS3NELFVBQVUwSSxLQUNYVCxJQUFLRixFQUNMRyxLQUFNeEwsS0FBS0UsUUFBUXlMLFNBQVNILEtBQU9GLEVBQWFFLEtBQU94TCxLQUFLRSxRQUFRZ00sYUFBZSxFQUN6RWxNLEtBQUtzRCxVQUFVNEksYUFBZSxFQUN4Q0QsTUFBTyxTQUVQak0sS0FBS3NELFVBQVVxSSxTQUFTSCxLQUFPLEdBQy9CeEwsS0FBS3NELFVBQVUwSSxLQUNYQyxNQUFPLE9BQ1BULEtBQU0sTUFJZHhMLEtBQUtzRCxVQUFVMEksS0FDWFQsSUFBS0YsRUFDTEcsS0FBTXhMLEtBQUtFLFFBQVF5TCxTQUFTSCxLQUFPRixFQUFhRSxLQUNoRFMsTUFBTyxTQUVQak0sS0FBS3NELFVBQVVxSSxTQUFTSCxLQUFPeEwsS0FBS3NELFVBQVU0SSxhQUFlL00sRUFBRUssUUFBUWtNLFNBQ3ZFMUwsS0FBS3NELFVBQVUwSSxLQUNYUixLQUFNLE9BQ05TLE1BQU8sTUFNdkI1RyxLQUFNLFNBQVM4RyxHQUNQbk0sS0FBSytDLFlBR1QvQyxLQUFLb00sbUJBQXFCak4sRUFBRXVHLE1BQU0sU0FBU3lHLEdBQUtuTSxLQUFLcU0sYUFBYUYsSUFBT25NLE1BR3pFYixFQUFFd0YsVUFDQ2MsR0FBRyw0QkFBNkJ6RixLQUFLb00sb0JBRXJDM0csR0FBRywyQkFBNEJ6RixLQUFLb00sb0JBRXBDM0csR0FBRyx3QkFBeUIseUJBQTBCekYsS0FBS29NLG9CQUUzRDNHLEdBQUcsMEJBQTJCekYsS0FBS29NLG9CQUd0Q2pOLEVBQUVLLFFBQVFpRyxHQUFHLHlCQUEwQnRHLEVBQUV1RyxNQUFNLFNBQVN5RyxHQUFLbk0sS0FBS29MLEtBQUtlLElBQU9uTSxPQUU5RUEsS0FBS3NNLGFBQWV0TSxLQUFLTSxVQUFVb0QsUUFDbkMxRCxLQUFLdU0sV0FBYXZNLEtBQUtRLFFBQVFrRCxRQUMvQjFELEtBQUt1SCxrQkFBb0J2SCxLQUFLUSxRQUFRa0QsUUFFdEMxRCxLQUFLd0gsYUFDTHhILEtBQUtzRCxVQUFVK0IsT0FDZnJGLEtBQUtvTCxPQUNMcEwsS0FBS0UsUUFBUTZHLFFBQVEsdUJBQXdCL0csTUFDN0NBLEtBQUsrQyxXQUFZLElBR3JCb0MsS0FBTSxTQUFTZ0gsR0FDTm5NLEtBQUsrQyxZQUdML0MsS0FBS1EsVUFDTlIsS0FBS00sVUFBWU4sS0FBS3NNLGFBQWE1SSxRQUNuQzFELEtBQUtRLFFBQVVSLEtBQUt1TSxXQUFXN0ksU0FJOUIxRCxLQUFLTSxVQUFVaUssT0FBT3ZLLEtBQUtzTSxlQUFrQnRNLEtBQUtRLFFBQVErSixPQUFPdkssS0FBS3VNLGFBQ3ZFdk0sS0FBSzhDLFNBQVM5QyxLQUFLTSxVQUFXTixLQUFLUSxRQUFTUixLQUFLd00sYUFHckR4TSxLQUFLcUgsZ0JBRUxsSSxFQUFFd0YsVUFBVThILElBQUksb0JBQ2hCdE4sRUFBRUssUUFBUWlOLElBQUksb0JBQ2R6TSxLQUFLc0QsVUFBVTZCLE9BQ2ZuRixLQUFLRSxRQUFRNkcsUUFBUSx1QkFBd0IvRyxNQUM3Q0EsS0FBSytDLFdBQVksSUFHckIrRCxPQUFRLFNBQVNxRixHQUNUbk0sS0FBSytDLFVBQ0wvQyxLQUFLbUYsT0FFTG5GLEtBQUtxRixRQUliZ0gsYUFBYyxTQUFTRixHQUNuQixHQUFJTyxHQUFTdk4sRUFBRWdOLEVBQUVPLE9BS0gsWUFBVlAsRUFBRVEsTUFDRkQsRUFBT0UsUUFBUTVNLEtBQUtFLFNBQVNtRCxRQUM3QnFKLEVBQU9FLFFBQVE1TSxLQUFLc0QsV0FBV0QsUUFDL0JxSixFQUFPRSxRQUFRLG1CQUFtQnZKLFFBRXRDckQsS0FBS21GLFFBR1RlLGNBQWUsV0FDWGxHLEtBQUtzRCxVQUFVOEIsU0FBUyxpQkFDeEJwRixLQUFLb0wsT0FDTHBMLEtBQUtFLFFBQVE2RyxRQUFRLCtCQUFnQy9HLE9BR3pENk0sY0FBZSxXQUNYN00sS0FBS3NELFVBQVVxRSxZQUFZLGlCQUMzQjNILEtBQUtFLFFBQVE2RyxRQUFRLCtCQUFnQy9HLE9BR3pEdUcsV0FBWSxTQUFTNEYsR0FHakIsSUFBSW5NLEtBQUtzRCxVQUFVMkIsS0FBSyxxQ0FBcUNiLEdBQUcsWUFBYXBFLEtBQUtzRCxVQUFVMkIsS0FBSyxtQ0FBbUNiLEdBQUcsVUFBdkksQ0FHQSxHQUFJMEksR0FBUVgsRUFBRU8sT0FBTzdILFNBQ3JCLElBQUlpSSxHQUFTOU0sS0FBS2dDLE9BQU9NLGlCQUNyQnRDLEtBQUt3SCxpQkFDRixDQUNILEdBQUl1RixHQUFRL00sS0FBS3lCLE9BQU9xTCxFQUN4QjlNLE1BQUtzRCxVQUFVMkIsS0FBSyxxQ0FBcUNaLElBQUkwSSxFQUFNLEdBQUc5SyxPQUFPakMsS0FBS2dDLE9BQU9DLFNBQ3pGakMsS0FBS3NELFVBQVUyQixLQUFLLG1DQUFtQ1osSUFBSTBJLEVBQU0sR0FBRzlLLE9BQU9qQyxLQUFLZ0MsT0FBT0MsWUFLL0ZxRSxXQUFZLFNBQVM2RixHQUNqQixHQUFJVyxHQUFRWCxFQUFFTyxPQUFPN0gsU0FFckIsSUFEQTdFLEtBQUt3TSxZQUFjTSxFQUNmQSxHQUFTOU0sS0FBS2dDLE9BQU9NLGlCQUNyQnRDLEtBQUtrRyxvQkFDRixDQUNILEdBQUk2RyxHQUFRL00sS0FBS3lCLE9BQU9xTCxFQUN4QjlNLE1BQUtNLFVBQVl5TSxFQUFNLEdBQ3ZCL00sS0FBS1EsUUFBVXVNLEVBQU0sR0FFaEIvTSxLQUFLa0IsYUFDTmxCLEtBQUtNLFVBQVVDLFFBQVEsT0FDdkJQLEtBQUtRLFFBQVFDLE1BQU0sUUFHbEJULEtBQUt3QixxQkFDTnhCLEtBQUs2TSxnQkFDVDdNLEtBQUtvRyxlQUliVCxVQUFXLFNBQVN3RyxHQUNoQixHQUFJYSxHQUFNN04sRUFBRWdOLEVBQUVPLFFBQVFPLFFBQVEsWUFDMUJELEdBQUlyTCxTQUFTLFNBQ2IzQixLQUFLZ0QsYUFBYThFLE1BQU1jLFNBQVMsRUFBRyxTQUNoQzVJLEtBQUtzQixpQkFDTHRCLEtBQUtpRCxjQUFjNkUsTUFBTWMsU0FBUyxFQUFHLFVBRXpDNUksS0FBS2lELGNBQWM2RSxNQUFNYyxTQUFTLEVBQUcsU0FFekM1SSxLQUFLNkgsbUJBR1RqQyxVQUFXLFNBQVN1RyxHQUNoQixHQUFJYSxHQUFNN04sRUFBRWdOLEVBQUVPLFFBQVFPLFFBQVEsWUFDMUJELEdBQUlyTCxTQUFTLFFBQ2IzQixLQUFLZ0QsYUFBYThFLE1BQU1yRCxJQUFJLEVBQUcsVUFFL0J6RSxLQUFLaUQsY0FBYzZFLE1BQU1yRCxJQUFJLEVBQUcsU0FDNUJ6RSxLQUFLc0IsaUJBQ0x0QixLQUFLZ0QsYUFBYThFLE1BQU1yRCxJQUFJLEVBQUcsVUFFdkN6RSxLQUFLNkgsbUJBR1QvQixVQUFXLFNBQVNxRyxHQUdoQixJQUFJbk0sS0FBS3NELFVBQVUyQixLQUFLLHFDQUFxQ2IsR0FBRyxZQUFhcEUsS0FBS3NELFVBQVUyQixLQUFLLG1DQUFtQ2IsR0FBRyxXQUlsSWpGLEVBQUVnTixFQUFFTyxRQUFRL0ssU0FBUyxhQUExQixDQUdBLEdBQUl1TCxHQUFRL04sRUFBRWdOLEVBQUVPLFFBQVE5RSxLQUFLLGNBQ3pCd0IsRUFBTThELEVBQU1DLE9BQU8sRUFBRyxHQUN0QmhFLEVBQU0rRCxFQUFNQyxPQUFPLEVBQUcsR0FDdEJILEVBQU03TixFQUFFZ04sRUFBRU8sUUFBUU8sUUFBUSxhQUMxQmxGLEVBQU9pRixFQUFJckwsU0FBUyxRQUFVM0IsS0FBS2dELGFBQWF3RixTQUFTWSxHQUFLRCxHQUFPbkosS0FBS2lELGNBQWN1RixTQUFTWSxHQUFLRCxFQUV0R25KLE1BQUtRLFFBQ0xSLEtBQUtzRCxVQUFVMkIsS0FBSyxxQ0FBcUNaLElBQUkwRCxFQUFLOUYsT0FBT2pDLEtBQUtnQyxPQUFPQyxTQUVyRmpDLEtBQUtzRCxVQUFVMkIsS0FBSyxtQ0FBbUNaLElBQUkwRCxFQUFLOUYsT0FBT2pDLEtBQUtnQyxPQUFPQyxRQUl2RixJQUFJZSxHQUFlaEQsS0FBS2dELGFBQ3BCQyxFQUFnQmpELEtBQUtpRCxjQUNyQjNDLEVBQVlOLEtBQUtNLFNBQ2hCTixNQUFLUSxTQUNOUixLQUFLc0QsVUFBVTJCLEtBQUssZ0JBQWdCZ0YsS0FBSyxTQUFTQyxFQUFPa0QsR0FHckQsSUFBSWpPLEVBQUVpTyxHQUFJekwsU0FBUyxRQUFuQixDQUVBLEdBQUl1TCxHQUFRL04sRUFBRWlPLEdBQUl4RixLQUFLLGNBQ25Cd0IsRUFBTThELEVBQU1DLE9BQU8sRUFBRyxHQUN0QmhFLEVBQU0rRCxFQUFNQyxPQUFPLEVBQUcsR0FDdEJILEVBQU03TixFQUFFaU8sR0FBSUgsUUFBUSxhQUNwQkksRUFBS0wsRUFBSXJMLFNBQVMsUUFBVXFCLEVBQWF3RixTQUFTWSxHQUFLRCxHQUFPbEcsRUFBY3VGLFNBQVNZLEdBQUtELEVBRTFGa0UsR0FBRzFKLFFBQVFyRCxJQUFjK00sRUFBRzVKLFNBQVNzRSxHQUNyQzVJLEVBQUVpTyxHQUFJaEksU0FBUyxZQUVmakcsRUFBRWlPLEdBQUl6RixZQUFZLGlCQVFsQzlCLFVBQVcsU0FBU3NHLEdBRWhCLEdBQUtoTixFQUFFZ04sRUFBRU8sUUFBUS9LLFNBQVMsYUFBMUIsQ0FFQSxHQUFJdUwsR0FBUS9OLEVBQUVnTixFQUFFTyxRQUFROUUsS0FBSyxjQUN6QndCLEVBQU04RCxFQUFNQyxPQUFPLEVBQUcsR0FDdEJoRSxFQUFNK0QsRUFBTUMsT0FBTyxFQUFHLEdBQ3RCSCxFQUFNN04sRUFBRWdOLEVBQUVPLFFBQVFPLFFBQVEsYUFDMUJsRixFQUFPaUYsRUFBSXJMLFNBQVMsUUFBVTNCLEtBQUtnRCxhQUFhd0YsU0FBU1ksR0FBS0QsR0FBT25KLEtBQUtpRCxjQUFjdUYsU0FBU1ksR0FBS0QsRUFVMUcsSUFBSW5KLEtBQUtRLFNBQVd1SCxFQUFLdEUsU0FBU3pELEtBQUtNLFVBQVcsT0FBUSxDQUN0RCxHQUFJTixLQUFLa0IsV0FBWSxDQUNqQixHQUFJK0csR0FBT0UsU0FBU25JLEtBQUtzRCxVQUFVMkIsS0FBSyxxQkFBcUJaLE1BQU8sR0FDcEUsS0FBS3JFLEtBQUttQixpQkFBa0IsQ0FDeEIsR0FBSWlILEdBQU9wSSxLQUFLc0QsVUFBVTJCLEtBQUsscUJBQXFCWixLQUN2QyxRQUFUK0QsR0FBaUJILEVBQU8sS0FDeEJBLEdBQVEsSUFDQyxPQUFURyxHQUEwQixLQUFUSCxJQUNqQkEsRUFBTyxHQUVmLEdBQUlmLEdBQVNpQixTQUFTbkksS0FBS3NELFVBQVUyQixLQUFLLHVCQUF1QlosTUFBTyxJQUNwRTZELEVBQVNsSSxLQUFLcUIsa0JBQW9COEcsU0FBU25JLEtBQUtzRCxVQUFVMkIsS0FBSyx1QkFBdUJaLE1BQU8sSUFBTSxDQUN2RzBELEdBQU9BLEVBQUtyRSxRQUFRdUUsS0FBS0EsR0FBTWYsT0FBT0EsR0FBUWdCLE9BQU9BLEdBRXpEbEksS0FBS1EsUUFBVSxLQUNmUixLQUFLdUUsYUFBYXdELEVBQUtyRSxhQUNwQixLQUFLMUQsS0FBS1EsU0FBV3VILEVBQUt0RSxTQUFTekQsS0FBS00sV0FHM0NOLEtBQUt3RSxXQUFXeEUsS0FBS00sVUFBVW9ELGFBQzVCLENBQ0gsR0FBSTFELEtBQUtrQixXQUFZLENBQ2pCLEdBQUkrRyxHQUFPRSxTQUFTbkksS0FBS3NELFVBQVUyQixLQUFLLHNCQUFzQlosTUFBTyxHQUNyRSxLQUFLckUsS0FBS21CLGlCQUFrQixDQUN4QixHQUFJaUgsR0FBT3BJLEtBQUtzRCxVQUFVMkIsS0FBSyxzQkFBc0JaLEtBQ3hDLFFBQVQrRCxHQUFpQkgsRUFBTyxLQUN4QkEsR0FBUSxJQUNDLE9BQVRHLEdBQTBCLEtBQVRILElBQ2pCQSxFQUFPLEdBRWYsR0FBSWYsR0FBU2lCLFNBQVNuSSxLQUFLc0QsVUFBVTJCLEtBQUssd0JBQXdCWixNQUFPLElBQ3JFNkQsRUFBU2xJLEtBQUtxQixrQkFBb0I4RyxTQUFTbkksS0FBS3NELFVBQVUyQixLQUFLLHdCQUF3QlosTUFBTyxJQUFNLENBQ3hHMEQsR0FBT0EsRUFBS3JFLFFBQVF1RSxLQUFLQSxHQUFNZixPQUFPQSxHQUFRZ0IsT0FBT0EsR0FFekRsSSxLQUFLd0UsV0FBV3VELEVBQUtyRSxTQUNqQjFELEtBQUthLFlBQ1BiLEtBQUtzSSx1QkFDTHRJLEtBQUtvRyxjQUlQcEcsS0FBS2MsbUJBQ0xkLEtBQUt3RSxXQUFXeEUsS0FBS00sV0FDaEJOLEtBQUtrQixZQUNObEIsS0FBS29HLGNBR2JwRyxLQUFLd0gsZUFJVGMscUJBQXNCLFdBQ3BCLEdBQUlnRixJQUFjLEVBQ2RyRSxFQUFJLENBQ1IsS0FBSyxHQUFJOUUsS0FBU25FLE1BQUt5QixPQUFRLENBQzNCLEdBQUl6QixLQUFLa0IsWUFDTCxHQUFJbEIsS0FBS00sVUFBVWlLLE9BQU92SyxLQUFLeUIsT0FBTzBDLEdBQU8sS0FBT25FLEtBQUtRLFFBQVErSixPQUFPdkssS0FBS3lCLE9BQU8wQyxHQUFPLElBQUssQ0FDNUZtSixHQUFjLEVBQ2R0TixLQUFLd00sWUFBY3hNLEtBQUtzRCxVQUFVMkIsS0FBSyxpQkFBbUJnRSxFQUFJLEtBQUs3RCxTQUFTLFVBQVVFLE1BQ3RGLFlBSUosSUFBSXRGLEtBQUtNLFVBQVUyQixPQUFPLGVBQWlCakMsS0FBS3lCLE9BQU8wQyxHQUFPLEdBQUdsQyxPQUFPLGVBQWlCakMsS0FBS1EsUUFBUXlCLE9BQU8sZUFBaUJqQyxLQUFLeUIsT0FBTzBDLEdBQU8sR0FBR2xDLE9BQU8sY0FBZSxDQUN0S3FMLEdBQWMsRUFDZHROLEtBQUt3TSxZQUFjeE0sS0FBS3NELFVBQVUyQixLQUFLLGlCQUFtQmdFLEVBQUksS0FBSzdELFNBQVMsVUFBVUUsTUFDdEYsT0FHUjJELElBRUFxRSxJQUNBdE4sS0FBS3dNLFlBQWN4TSxLQUFLc0QsVUFBVTJCLEtBQUssbUJBQW1CRyxTQUFTLFVBQVVFLE9BQzdFdEYsS0FBS2tHLGtCQUlYRSxXQUFZLFNBQVMrRixHQUNqQm5NLEtBQUttRixPQUNMbkYsS0FBS0UsUUFBUTZHLFFBQVEsd0JBQXlCL0csT0FHbERxRyxZQUFhLFNBQVM4RixHQUNsQm5NLEtBQUtNLFVBQVlOLEtBQUtzTSxhQUN0QnRNLEtBQUtRLFFBQVVSLEtBQUt1TSxXQUNwQnZNLEtBQUttRixPQUNMbkYsS0FBS0UsUUFBUTZHLFFBQVEseUJBQTBCL0csT0FHbkRnRyxtQkFBb0IsU0FBU21HLEdBQ3pCLEdBQUlvQixHQUFTcE8sRUFBRWdOLEVBQUVPLFFBQVFFLFFBQVEsYUFBYWpMLFNBQVMsUUFDbkQ2TCxFQUFjRCxFQUFTLE9BQVMsUUFDaENQLEVBQU1oTixLQUFLc0QsVUFBVTJCLEtBQUssYUFBYXVJLEdBR3ZDMUYsRUFBUUssU0FBUzZFLEVBQUkvSCxLQUFLLGdCQUFnQlosTUFBTyxJQUNqRDJELEVBQU9nRixFQUFJL0gsS0FBSyxlQUFlWixLQUU5QmtKLEtBQ0d2RixFQUFPaEksS0FBS00sVUFBVTBILFFBQVdBLEdBQVFoSSxLQUFLTSxVQUFVMEgsUUFBVUYsRUFBUTlILEtBQUtNLFVBQVV3SCxXQUN6RkEsRUFBUTlILEtBQUtNLFVBQVV3SCxRQUN2QkUsRUFBT2hJLEtBQUtNLFVBQVUwSCxRQUkxQmhJLEtBQUtVLFVBQ0RzSCxFQUFPaEksS0FBS1UsUUFBUXNILFFBQVdBLEdBQVFoSSxLQUFLVSxRQUFRc0gsUUFBVUYsRUFBUTlILEtBQUtVLFFBQVFvSCxXQUNuRkEsRUFBUTlILEtBQUtVLFFBQVFvSCxRQUNyQkUsRUFBT2hJLEtBQUtVLFFBQVFzSCxRQUl4QmhJLEtBQUtXLFVBQ0RxSCxFQUFPaEksS0FBS1csUUFBUXFILFFBQVdBLEdBQVFoSSxLQUFLVyxRQUFRcUgsUUFBVUYsRUFBUTlILEtBQUtXLFFBQVFtSCxXQUNuRkEsRUFBUTlILEtBQUtXLFFBQVFtSCxRQUNyQkUsRUFBT2hJLEtBQUtXLFFBQVFxSCxRQUl4QnVGLEdBQ0F2TixLQUFLZ0QsYUFBYThFLE1BQU1BLE1BQU1BLEdBQU9FLEtBQUtBLEdBQ3RDaEksS0FBS3NCLGtCQUNMdEIsS0FBS2lELGNBQWM2RSxNQUFROUgsS0FBS2dELGFBQWE4RSxNQUFNcEUsUUFBUWUsSUFBSSxFQUFHLFlBRXRFekUsS0FBS2lELGNBQWM2RSxNQUFNQSxNQUFNQSxHQUFPRSxLQUFLQSxHQUN2Q2hJLEtBQUtzQixrQkFDTHRCLEtBQUtnRCxhQUFhOEUsTUFBUTlILEtBQUtpRCxjQUFjNkUsTUFBTXBFLFFBQVFrRixTQUFTLEVBQUcsV0FFL0U1SSxLQUFLNkgsbUJBR1Q1QixZQUFhLFNBQVNrRyxHQUVsQixHQUFJYSxHQUFNN04sRUFBRWdOLEVBQUVPLFFBQVFFLFFBQVEsYUFDMUJXLEVBQVNQLEVBQUlyTCxTQUFTLFFBRXRCc0csRUFBT0UsU0FBUzZFLEVBQUkvSCxLQUFLLGVBQWVaLE1BQU8sSUFDL0M2QyxFQUFTaUIsU0FBUzZFLEVBQUkvSCxLQUFLLGlCQUFpQlosTUFBTyxJQUNuRDZELEVBQVNsSSxLQUFLcUIsa0JBQW9COEcsU0FBUzZFLEVBQUkvSCxLQUFLLGlCQUFpQlosTUFBTyxJQUFNLENBRXRGLEtBQUtyRSxLQUFLbUIsaUJBQWtCLENBQ3hCLEdBQUlpSCxHQUFPNEUsRUFBSS9ILEtBQUssZUFBZVosS0FDdEIsUUFBVCtELEdBQWlCSCxFQUFPLEtBQ3hCQSxHQUFRLElBQ0MsT0FBVEcsR0FBMEIsS0FBVEgsSUFDakJBLEVBQU8sR0FHZixHQUFJc0YsRUFBUSxDQUNSLEdBQUl0SixHQUFRakUsS0FBS00sVUFBVW9ELE9BQzNCTyxHQUFNZ0UsS0FBS0EsR0FDWGhFLEVBQU1pRCxPQUFPQSxHQUNiakQsRUFBTWlFLE9BQU9BLEdBQ2JsSSxLQUFLdUUsYUFBYU4sR0FDZGpFLEtBQUtjLGlCQUNMZCxLQUFLUSxRQUFVUixLQUFLTSxVQUFVb0QsUUFDdkIxRCxLQUFLUSxTQUFXUixLQUFLUSxRQUFReUIsT0FBTyxlQUFpQmdDLEVBQU1oQyxPQUFPLGVBQWlCakMsS0FBS1EsUUFBUWlELFNBQVNRLElBQ2hIakUsS0FBS3dFLFdBQVdQLEVBQU1QLGFBRXZCLElBQUkxRCxLQUFLUSxRQUFTLENBQ3JCLEdBQUkwRCxHQUFNbEUsS0FBS1EsUUFBUWtELE9BQ3ZCUSxHQUFJK0QsS0FBS0EsR0FDVC9ELEVBQUlnRCxPQUFPQSxHQUNYaEQsRUFBSWdFLE9BQU9BLEdBQ1hsSSxLQUFLd0UsV0FBV04sR0FJcEJsRSxLQUFLNkgsa0JBR0w3SCxLQUFLK0YsbUJBR0wvRixLQUFLeUgsaUJBQWlCLFFBQ3RCekgsS0FBS3lILGlCQUFpQixVQUkxQnRCLGtCQUFtQixTQUFTZ0csR0FDeEIsR0FBSXNCLEdBQVV0TyxFQUFFZ04sRUFBRU8sUUFBUUUsUUFBUSxhQUFhakwsU0FBUyxTQUNwRHNDLEVBQVFwRSxFQUFPRyxLQUFLc0QsVUFBVTJCLEtBQUssdUNBQXVDWixNQUFPckUsS0FBS2dDLE9BQU9DLFFBQzdGaUMsRUFBTXJFLEVBQU9HLEtBQUtzRCxVQUFVMkIsS0FBSyxxQ0FBcUNaLE1BQU9yRSxLQUFLZ0MsT0FBT0MsT0FFekZnQyxHQUFNeUosV0FBYXhKLEVBQUl3SixZQUVuQkQsR0FBV3ZKLEVBQUlULFNBQVNRLEtBQ3hCQSxFQUFRQyxFQUFJUixTQUVoQjFELEtBQUt1RSxhQUFhTixHQUNsQmpFLEtBQUt3RSxXQUFXTixHQUVadUosRUFDQXpOLEtBQUtzRCxVQUFVMkIsS0FBSyx1Q0FBdUNaLElBQUlyRSxLQUFLTSxVQUFVMkIsT0FBT2pDLEtBQUtnQyxPQUFPQyxTQUVqR2pDLEtBQUtzRCxVQUFVMkIsS0FBSyxxQ0FBcUNaLElBQUlyRSxLQUFLUSxRQUFReUIsT0FBT2pDLEtBQUtnQyxPQUFPQyxVQUtyR2pDLEtBQUs2SCxrQkFDRDdILEtBQUtrQixhQUNMbEIsS0FBS3lILGlCQUFpQixRQUN0QnpILEtBQUt5SCxpQkFBaUIsV0FJOUJkLGVBQWdCLFdBQ1osR0FBSzNHLEtBQUtFLFFBQVFrRSxHQUFHLFVBQ2hCcEUsS0FBS0UsUUFBUW1FLE1BQU1oQixVQUNwQnJELEtBQUtFLFFBQVFtRSxNQUFNaEIsT0FBU3JELEtBQUtnQyxPQUFPQyxPQUFPb0IsUUFBbkQsQ0FFQSxHQUFJc0ssR0FBYTNOLEtBQUtFLFFBQVFtRSxNQUFNQyxNQUFNdEUsS0FBS2dDLE9BQU9FLFdBQ2xEK0IsRUFBUSxLQUNSQyxFQUFNLElBRWdCLEtBQXRCeUosRUFBV3RLLFNBQ1hZLEVBQVFwRSxFQUFPOE4sRUFBVyxHQUFJM04sS0FBS2dDLE9BQU9DLFFBQzFDaUMsRUFBTXJFLEVBQU84TixFQUFXLEdBQUkzTixLQUFLZ0MsT0FBT0MsVUFHeENqQyxLQUFLYyxrQkFBOEIsT0FBVm1ELEdBQTBCLE9BQVJDLEtBQzNDRCxFQUFRcEUsRUFBT0csS0FBS0UsUUFBUW1FLE1BQU9yRSxLQUFLZ0MsT0FBT0MsUUFDL0NpQyxFQUFNRCxHQUdMQSxFQUFNeUosV0FBY3hKLEVBQUl3SixZQUU3QjFOLEtBQUt1RSxhQUFhTixHQUNsQmpFLEtBQUt3RSxXQUFXTixHQUNoQmxFLEtBQUt3SCxnQkFHVFgsUUFBUyxTQUFTc0Y7QUFFSyxJQUFkQSxFQUFFeUIsU0FBaUMsS0FBZHpCLEVBQUV5QixTQUN4QjVOLEtBQUttRixRQUlia0MsY0FBZSxXQUNQckgsS0FBS0UsUUFBUWtFLEdBQUcsV0FBYXBFLEtBQUtjLGtCQUFvQmQsS0FBS3VCLGlCQUMzRHZCLEtBQUtFLFFBQVFtRSxJQUFJckUsS0FBS00sVUFBVTJCLE9BQU9qQyxLQUFLZ0MsT0FBT0MsUUFBVWpDLEtBQUtnQyxPQUFPRSxVQUFZbEMsS0FBS1EsUUFBUXlCLE9BQU9qQyxLQUFLZ0MsT0FBT0MsU0FDckhqQyxLQUFLRSxRQUFRNkcsUUFBUSxXQUNkL0csS0FBS0UsUUFBUWtFLEdBQUcsVUFBWXBFLEtBQUt1QixrQkFDeEN2QixLQUFLRSxRQUFRbUUsSUFBSXJFLEtBQUtNLFVBQVUyQixPQUFPakMsS0FBS2dDLE9BQU9DLFNBQ25EakMsS0FBS0UsUUFBUTZHLFFBQVEsWUFJN0J4QixPQUFRLFdBQ0p2RixLQUFLc0QsVUFBVWlDLFNBQ2Z2RixLQUFLRSxRQUFRdU0sSUFBSSxvQkFDakJ6TSxLQUFLRSxRQUFRMk4sZUFLckIxTyxFQUFFTyxHQUFHTCxnQkFBa0IsU0FBU2MsRUFBUzJDLEdBT3JDLE1BTkE5QyxNQUFLaUssS0FBSyxXQUNOLEdBQUltRCxHQUFLak8sRUFBRWEsS0FDUG9OLEdBQUdqSyxLQUFLLG9CQUNSaUssRUFBR2pLLEtBQUssbUJBQW1Cb0MsU0FDL0I2SCxFQUFHakssS0FBSyxrQkFBbUIsR0FBSWxELEdBQWdCbU4sRUFBSWpOLEVBQVMyQyxNQUV6RDlDLE1BR0pDIiwiZmlsZSI6ImRhdGVyYW5nZXBpY2tlci1kZWJ1Zy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAdmVyc2lvbjogMi4xLjE5XG4qIEBhdXRob3I6IERhbiBHcm9zc21hbiBodHRwOi8vd3d3LmRhbmdyb3NzbWFuLmluZm8vXG4qIEBjb3B5cmlnaHQ6IENvcHlyaWdodCAoYykgMjAxMi0yMDE1IERhbiBHcm9zc21hbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiogQGxpY2Vuc2U6IExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS4gU2VlIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG4qIEB3ZWJzaXRlOiBodHRwczovL3d3dy5pbXByb3ZlbHkuY29tL1xuKi9cblxuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFsnbW9tZW50JywgJ2pxdWVyeScsICdleHBvcnRzJ10sIGZ1bmN0aW9uKG1vbWVudGpzLCAkLCBleHBvcnRzKSB7XG4gICAgICByb290LmRhdGVyYW5nZXBpY2tlciA9IGZhY3Rvcnkocm9vdCwgZXhwb3J0cywgbW9tZW50anMsICQpO1xuICAgIH0pO1xuXG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YXIgbW9tZW50anMgPSByZXF1aXJlKCdtb21lbnQnKTtcbiAgICAgIHZhciBqUXVlcnkgPSAodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJykgPyB3aW5kb3cualF1ZXJ5IDogdW5kZWZpbmVkOyAgLy9pc29tb3JwaGljIGlzc3VlXG4gICAgICBpZiAoIWpRdWVyeSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xuICAgICAgICAgICAgICBpZiAoIWpRdWVyeS5mbikgalF1ZXJ5LmZuID0ge307IC8vaXNvbW9ycGhpYyBpc3N1ZVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICBpZiAoIWpRdWVyeSkgdGhyb3cgbmV3IEVycm9yKCdqUXVlcnkgZGVwZW5kZW5jeSBub3QgZm91bmQnKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICBmYWN0b3J5KHJvb3QsIGV4cG9ydHMsIG1vbWVudGpzLCBqUXVlcnkpO1xuXG4gIC8vIEZpbmFsbHksIGFzIGEgYnJvd3NlciBnbG9iYWwuXG4gIH0gZWxzZSB7XG4gICAgcm9vdC5kYXRlcmFuZ2VwaWNrZXIgPSBmYWN0b3J5KHJvb3QsIHt9LCByb290Lm1vbWVudCB8fCBtb21lbnQsIChyb290LmpRdWVyeSB8fCByb290LlplcHRvIHx8IHJvb3QuZW5kZXIgfHwgcm9vdC4kKSk7XG4gIH1cblxufSh0aGlzIHx8IHt9LCBmdW5jdGlvbihyb290LCBkYXRlcmFuZ2VwaWNrZXIsIG1vbWVudCwgJCkgeyAvLyAndGhpcycgZG9lc24ndCBleGlzdCBvbiBhIHNlcnZlclxuXG4gICAgdmFyIERhdGVSYW5nZVBpY2tlciA9IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMsIGNiKSB7XG5cbiAgICAgICAgLy9kZWZhdWx0IHNldHRpbmdzIGZvciBvcHRpb25zXG4gICAgICAgIHRoaXMucGFyZW50RWwgPSAnYm9keSc7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIHRoaXMuc3RhcnREYXRlID0gbW9tZW50KCkuc3RhcnRPZignZGF5Jyk7XG4gICAgICAgIHRoaXMuZW5kRGF0ZSA9IG1vbWVudCgpLmVuZE9mKCdkYXknKTtcbiAgICAgICAgdGhpcy5taW5EYXRlID0gZmFsc2U7XG4gICAgICAgIHRoaXMubWF4RGF0ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRhdGVMaW1pdCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmF1dG9BcHBseSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNpbmdsZURhdGVQaWNrZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zaG93RHJvcGRvd25zID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2hvd1dlZWtOdW1iZXJzID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2hvd0lTT1dlZWtOdW1iZXJzID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGltZVBpY2tlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpbWVQaWNrZXIyNEhvdXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aW1lUGlja2VySW5jcmVtZW50ID0gMTtcbiAgICAgICAgdGhpcy50aW1lUGlja2VyU2Vjb25kcyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmxpbmtlZENhbGVuZGFycyA9IHRydWU7XG4gICAgICAgIHRoaXMuYXV0b1VwZGF0ZUlucHV0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5hbHdheXNTaG93Q2FsZW5kYXJzID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmFuZ2VzID0ge307XG5cbiAgICAgICAgdGhpcy5vcGVucyA9ICdyaWdodCc7XG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnQuaGFzQ2xhc3MoJ3B1bGwtcmlnaHQnKSlcbiAgICAgICAgICAgIHRoaXMub3BlbnMgPSAnbGVmdCc7XG5cbiAgICAgICAgdGhpcy5kcm9wcyA9ICdkb3duJztcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5oYXNDbGFzcygnZHJvcHVwJykpXG4gICAgICAgICAgICB0aGlzLmRyb3BzID0gJ3VwJztcblxuICAgICAgICB0aGlzLmJ1dHRvbkNsYXNzZXMgPSAnYnRuIGJ0bi1zbSc7XG4gICAgICAgIHRoaXMuYXBwbHlDbGFzcyA9ICdidG4tc3VjY2Vzcyc7XG4gICAgICAgIHRoaXMuY2FuY2VsQ2xhc3MgPSAnYnRuLWRlZmF1bHQnO1xuXG4gICAgICAgIHRoaXMubG9jYWxlID0ge1xuICAgICAgICAgICAgZm9ybWF0OiAnTU0vREQvWVlZWScsXG4gICAgICAgICAgICBzZXBhcmF0b3I6ICcgLSAnLFxuICAgICAgICAgICAgYXBwbHlMYWJlbDogJ0FwcGx5JyxcbiAgICAgICAgICAgIGNhbmNlbExhYmVsOiAnQ2FuY2VsJyxcbiAgICAgICAgICAgIHdlZWtMYWJlbDogJ1cnLFxuICAgICAgICAgICAgY3VzdG9tUmFuZ2VMYWJlbDogJ0N1c3RvbSBSYW5nZScsXG4gICAgICAgICAgICBkYXlzT2ZXZWVrOiBtb21lbnQud2Vla2RheXNNaW4oKSxcbiAgICAgICAgICAgIG1vbnRoTmFtZXM6IG1vbWVudC5tb250aHNTaG9ydCgpLFxuICAgICAgICAgICAgZmlyc3REYXk6IG1vbWVudC5sb2NhbGVEYXRhKCkuZmlyc3REYXlPZldlZWsoKVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBmdW5jdGlvbigpIHsgfTtcblxuICAgICAgICAvL3NvbWUgc3RhdGUgaW5mb3JtYXRpb25cbiAgICAgICAgdGhpcy5pc1Nob3dpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5sZWZ0Q2FsZW5kYXIgPSB7fTtcbiAgICAgICAgdGhpcy5yaWdodENhbGVuZGFyID0ge307XG5cbiAgICAgICAgLy9jdXN0b20gb3B0aW9ucyBmcm9tIHVzZXJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JyB8fCBvcHRpb25zID09PSBudWxsKVxuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuXG4gICAgICAgIC8vYWxsb3cgc2V0dGluZyBvcHRpb25zIHdpdGggZGF0YSBhdHRyaWJ1dGVzXG4gICAgICAgIC8vZGF0YS1hcGkgb3B0aW9ucyB3aWxsIGJlIG92ZXJ3cml0dGVuIHdpdGggY3VzdG9tIGphdmFzY3JpcHQgb3B0aW9uc1xuICAgICAgICBvcHRpb25zID0gJC5leHRlbmQodGhpcy5lbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICAgICAgLy9odG1sIHRlbXBsYXRlIGZvciB0aGUgcGlja2VyIFVJXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50ZW1wbGF0ZSAhPT0gJ3N0cmluZycgJiYgIShvcHRpb25zLnRlbXBsYXRlIGluc3RhbmNlb2YgJCkpXG4gICAgICAgICAgICBvcHRpb25zLnRlbXBsYXRlID0gJzxkaXYgY2xhc3M9XCJkYXRlcmFuZ2VwaWNrZXIgZHJvcGRvd24tbWVudVwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY2FsZW5kYXIgbGVmdFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImRhdGVyYW5nZXBpY2tlcl9pbnB1dFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgY2xhc3M9XCJpbnB1dC1taW5pXCIgdHlwZT1cInRleHRcIiBuYW1lPVwiZGF0ZXJhbmdlcGlja2VyX3N0YXJ0XCIgdmFsdWU9XCJcIiAvPicgK1xuICAgICAgICAgICAgICAgICAgICAgICc8aSBjbGFzcz1cImZhIGZhLWNhbGVuZGFyIGdseXBoaWNvbiBnbHlwaGljb24tY2FsZW5kYXJcIj48L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjYWxlbmRhci10aW1lXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdj48L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aSBjbGFzcz1cImZhIGZhLWNsb2NrLW8gZ2x5cGhpY29uIGdseXBoaWNvbi10aW1lXCI+PC9pPicgK1xuICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNhbGVuZGFyLXRhYmxlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY2FsZW5kYXIgcmlnaHRcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJkYXRlcmFuZ2VwaWNrZXJfaW5wdXRcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IGNsYXNzPVwiaW5wdXQtbWluaVwiIHR5cGU9XCJ0ZXh0XCIgbmFtZT1cImRhdGVyYW5nZXBpY2tlcl9lbmRcIiB2YWx1ZT1cIlwiIC8+JyArXG4gICAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiZmEgZmEtY2FsZW5kYXIgZ2x5cGhpY29uIGdseXBoaWNvbi1jYWxlbmRhclwiPjwvaT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNhbGVuZGFyLXRpbWVcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2PjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiZmEgZmEtY2xvY2stbyBnbHlwaGljb24gZ2x5cGhpY29uLXRpbWVcIj48L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY2FsZW5kYXItdGFibGVcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJyYW5nZXNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJyYW5nZV9pbnB1dHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPVwiYXBwbHlCdG5cIiBkaXNhYmxlZD1cImRpc2FibGVkXCIgdHlwZT1cImJ1dHRvblwiPjwvYnV0dG9uPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPVwiY2FuY2VsQnRuXCIgdHlwZT1cImJ1dHRvblwiPjwvYnV0dG9uPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZGl2Pic7XG5cbiAgICAgICAgdGhpcy5wYXJlbnRFbCA9IChvcHRpb25zLnBhcmVudEVsICYmICQob3B0aW9ucy5wYXJlbnRFbCkubGVuZ3RoKSA/ICQob3B0aW9ucy5wYXJlbnRFbCkgOiAkKHRoaXMucGFyZW50RWwpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9ICQob3B0aW9ucy50ZW1wbGF0ZSkuYXBwZW5kVG8odGhpcy5wYXJlbnRFbCk7XG5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gaGFuZGxlIGFsbCB0aGUgcG9zc2libGUgb3B0aW9ucyBvdmVycmlkaW5nIGRlZmF1bHRzXG4gICAgICAgIC8vXG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxvY2FsZSA9PT0gJ29iamVjdCcpIHtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxvY2FsZS5mb3JtYXQgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgICAgIHRoaXMubG9jYWxlLmZvcm1hdCA9IG9wdGlvbnMubG9jYWxlLmZvcm1hdDtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxvY2FsZS5zZXBhcmF0b3IgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgICAgIHRoaXMubG9jYWxlLnNlcGFyYXRvciA9IG9wdGlvbnMubG9jYWxlLnNlcGFyYXRvcjtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxvY2FsZS5kYXlzT2ZXZWVrID09PSAnb2JqZWN0JylcbiAgICAgICAgICAgICAgICB0aGlzLmxvY2FsZS5kYXlzT2ZXZWVrID0gb3B0aW9ucy5sb2NhbGUuZGF5c09mV2Vlay5zbGljZSgpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubG9jYWxlLm1vbnRoTmFtZXMgPT09ICdvYmplY3QnKVxuICAgICAgICAgICAgICB0aGlzLmxvY2FsZS5tb250aE5hbWVzID0gb3B0aW9ucy5sb2NhbGUubW9udGhOYW1lcy5zbGljZSgpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubG9jYWxlLmZpcnN0RGF5ID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgICAgdGhpcy5sb2NhbGUuZmlyc3REYXkgPSBvcHRpb25zLmxvY2FsZS5maXJzdERheTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxvY2FsZS5hcHBseUxhYmVsID09PSAnc3RyaW5nJylcbiAgICAgICAgICAgICAgdGhpcy5sb2NhbGUuYXBwbHlMYWJlbCA9IG9wdGlvbnMubG9jYWxlLmFwcGx5TGFiZWw7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5sb2NhbGUuY2FuY2VsTGFiZWwgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgICB0aGlzLmxvY2FsZS5jYW5jZWxMYWJlbCA9IG9wdGlvbnMubG9jYWxlLmNhbmNlbExhYmVsO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubG9jYWxlLndlZWtMYWJlbCA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICAgIHRoaXMubG9jYWxlLndlZWtMYWJlbCA9IG9wdGlvbnMubG9jYWxlLndlZWtMYWJlbDtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxvY2FsZS5jdXN0b21SYW5nZUxhYmVsID09PSAnc3RyaW5nJylcbiAgICAgICAgICAgICAgdGhpcy5sb2NhbGUuY3VzdG9tUmFuZ2VMYWJlbCA9IG9wdGlvbnMubG9jYWxlLmN1c3RvbVJhbmdlTGFiZWw7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zdGFydERhdGUgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgdGhpcy5zdGFydERhdGUgPSBtb21lbnQob3B0aW9ucy5zdGFydERhdGUsIHRoaXMubG9jYWxlLmZvcm1hdCk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmVuZERhdGUgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgdGhpcy5lbmREYXRlID0gbW9tZW50KG9wdGlvbnMuZW5kRGF0ZSwgdGhpcy5sb2NhbGUuZm9ybWF0KTtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubWluRGF0ZSA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICB0aGlzLm1pbkRhdGUgPSBtb21lbnQob3B0aW9ucy5taW5EYXRlLCB0aGlzLmxvY2FsZS5mb3JtYXQpO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5tYXhEYXRlID09PSAnc3RyaW5nJylcbiAgICAgICAgICAgIHRoaXMubWF4RGF0ZSA9IG1vbWVudChvcHRpb25zLm1heERhdGUsIHRoaXMubG9jYWxlLmZvcm1hdCk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnN0YXJ0RGF0ZSA9PT0gJ29iamVjdCcpXG4gICAgICAgICAgICB0aGlzLnN0YXJ0RGF0ZSA9IG1vbWVudChvcHRpb25zLnN0YXJ0RGF0ZSk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmVuZERhdGUgPT09ICdvYmplY3QnKVxuICAgICAgICAgICAgdGhpcy5lbmREYXRlID0gbW9tZW50KG9wdGlvbnMuZW5kRGF0ZSk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm1pbkRhdGUgPT09ICdvYmplY3QnKVxuICAgICAgICAgICAgdGhpcy5taW5EYXRlID0gbW9tZW50KG9wdGlvbnMubWluRGF0ZSk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm1heERhdGUgPT09ICdvYmplY3QnKVxuICAgICAgICAgICAgdGhpcy5tYXhEYXRlID0gbW9tZW50KG9wdGlvbnMubWF4RGF0ZSk7XG5cbiAgICAgICAgLy8gc2FuaXR5IGNoZWNrIGZvciBiYWQgb3B0aW9uc1xuICAgICAgICBpZiAodGhpcy5taW5EYXRlICYmIHRoaXMuc3RhcnREYXRlLmlzQmVmb3JlKHRoaXMubWluRGF0ZSkpXG4gICAgICAgICAgICB0aGlzLnN0YXJ0RGF0ZSA9IHRoaXMubWluRGF0ZS5jbG9uZSgpO1xuXG4gICAgICAgIC8vIHNhbml0eSBjaGVjayBmb3IgYmFkIG9wdGlvbnNcbiAgICAgICAgaWYgKHRoaXMubWF4RGF0ZSAmJiB0aGlzLmVuZERhdGUuaXNBZnRlcih0aGlzLm1heERhdGUpKVxuICAgICAgICAgICAgdGhpcy5lbmREYXRlID0gdGhpcy5tYXhEYXRlLmNsb25lKCk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmFwcGx5Q2xhc3MgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgdGhpcy5hcHBseUNsYXNzID0gb3B0aW9ucy5hcHBseUNsYXNzO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5jYW5jZWxDbGFzcyA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICB0aGlzLmNhbmNlbENsYXNzID0gb3B0aW9ucy5jYW5jZWxDbGFzcztcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuZGF0ZUxpbWl0ID09PSAnb2JqZWN0JylcbiAgICAgICAgICAgIHRoaXMuZGF0ZUxpbWl0ID0gb3B0aW9ucy5kYXRlTGltaXQ7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9wZW5zID09PSAnc3RyaW5nJylcbiAgICAgICAgICAgIHRoaXMub3BlbnMgPSBvcHRpb25zLm9wZW5zO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5kcm9wcyA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICB0aGlzLmRyb3BzID0gb3B0aW9ucy5kcm9wcztcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc2hvd1dlZWtOdW1iZXJzID09PSAnYm9vbGVhbicpXG4gICAgICAgICAgICB0aGlzLnNob3dXZWVrTnVtYmVycyA9IG9wdGlvbnMuc2hvd1dlZWtOdW1iZXJzO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zaG93SVNPV2Vla051bWJlcnMgPT09ICdib29sZWFuJylcbiAgICAgICAgICAgIHRoaXMuc2hvd0lTT1dlZWtOdW1iZXJzID0gb3B0aW9ucy5zaG93SVNPV2Vla051bWJlcnM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmJ1dHRvbkNsYXNzZXMgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgdGhpcy5idXR0b25DbGFzc2VzID0gb3B0aW9ucy5idXR0b25DbGFzc2VzO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5idXR0b25DbGFzc2VzID09PSAnb2JqZWN0JylcbiAgICAgICAgICAgIHRoaXMuYnV0dG9uQ2xhc3NlcyA9IG9wdGlvbnMuYnV0dG9uQ2xhc3Nlcy5qb2luKCcgJyk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnNob3dEcm9wZG93bnMgPT09ICdib29sZWFuJylcbiAgICAgICAgICAgIHRoaXMuc2hvd0Ryb3Bkb3ducyA9IG9wdGlvbnMuc2hvd0Ryb3Bkb3ducztcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc2luZ2xlRGF0ZVBpY2tlciA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICB0aGlzLnNpbmdsZURhdGVQaWNrZXIgPSBvcHRpb25zLnNpbmdsZURhdGVQaWNrZXI7XG4gICAgICAgICAgICBpZiAodGhpcy5zaW5nbGVEYXRlUGlja2VyKVxuICAgICAgICAgICAgICAgIHRoaXMuZW5kRGF0ZSA9IHRoaXMuc3RhcnREYXRlLmNsb25lKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudGltZVBpY2tlciA9PT0gJ2Jvb2xlYW4nKVxuICAgICAgICAgICAgdGhpcy50aW1lUGlja2VyID0gb3B0aW9ucy50aW1lUGlja2VyO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50aW1lUGlja2VyU2Vjb25kcyA9PT0gJ2Jvb2xlYW4nKVxuICAgICAgICAgICAgdGhpcy50aW1lUGlja2VyU2Vjb25kcyA9IG9wdGlvbnMudGltZVBpY2tlclNlY29uZHM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRpbWVQaWNrZXJJbmNyZW1lbnQgPT09ICdudW1iZXInKVxuICAgICAgICAgICAgdGhpcy50aW1lUGlja2VySW5jcmVtZW50ID0gb3B0aW9ucy50aW1lUGlja2VySW5jcmVtZW50O1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50aW1lUGlja2VyMjRIb3VyID09PSAnYm9vbGVhbicpXG4gICAgICAgICAgICB0aGlzLnRpbWVQaWNrZXIyNEhvdXIgPSBvcHRpb25zLnRpbWVQaWNrZXIyNEhvdXI7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmF1dG9BcHBseSA9PT0gJ2Jvb2xlYW4nKVxuICAgICAgICAgICAgdGhpcy5hdXRvQXBwbHkgPSBvcHRpb25zLmF1dG9BcHBseTtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuYXV0b1VwZGF0ZUlucHV0ID09PSAnYm9vbGVhbicpXG4gICAgICAgICAgICB0aGlzLmF1dG9VcGRhdGVJbnB1dCA9IG9wdGlvbnMuYXV0b1VwZGF0ZUlucHV0O1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5saW5rZWRDYWxlbmRhcnMgPT09ICdib29sZWFuJylcbiAgICAgICAgICAgIHRoaXMubGlua2VkQ2FsZW5kYXJzID0gb3B0aW9ucy5saW5rZWRDYWxlbmRhcnM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmlzSW52YWxpZERhdGUgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICB0aGlzLmlzSW52YWxpZERhdGUgPSBvcHRpb25zLmlzSW52YWxpZERhdGU7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmFsd2F5c1Nob3dDYWxlbmRhcnMgPT09ICdib29sZWFuJylcbiAgICAgICAgICAgIHRoaXMuYWx3YXlzU2hvd0NhbGVuZGFycyA9IG9wdGlvbnMuYWx3YXlzU2hvd0NhbGVuZGFycztcblxuICAgICAgICAvLyB1cGRhdGUgZGF5IG5hbWVzIG9yZGVyIHRvIGZpcnN0RGF5XG4gICAgICAgIGlmICh0aGlzLmxvY2FsZS5maXJzdERheSAhPSAwKSB7XG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSB0aGlzLmxvY2FsZS5maXJzdERheTtcbiAgICAgICAgICAgIHdoaWxlIChpdGVyYXRvciA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvY2FsZS5kYXlzT2ZXZWVrLnB1c2godGhpcy5sb2NhbGUuZGF5c09mV2Vlay5zaGlmdCgpKTtcbiAgICAgICAgICAgICAgICBpdGVyYXRvci0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0YXJ0LCBlbmQsIHJhbmdlO1xuXG4gICAgICAgIC8vaWYgbm8gc3RhcnQvZW5kIGRhdGVzIHNldCwgY2hlY2sgaWYgYW4gaW5wdXQgZWxlbWVudCBjb250YWlucyBpbml0aWFsIHZhbHVlc1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc3RhcnREYXRlID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygb3B0aW9ucy5lbmREYXRlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKCQodGhpcy5lbGVtZW50KS5pcygnaW5wdXRbdHlwZT10ZXh0XScpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9ICQodGhpcy5lbGVtZW50KS52YWwoKSxcbiAgICAgICAgICAgICAgICAgICAgc3BsaXQgPSB2YWwuc3BsaXQodGhpcy5sb2NhbGUuc2VwYXJhdG9yKTtcblxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gZW5kID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIGlmIChzcGxpdC5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IG1vbWVudChzcGxpdFswXSwgdGhpcy5sb2NhbGUuZm9ybWF0KTtcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gbW9tZW50KHNwbGl0WzFdLCB0aGlzLmxvY2FsZS5mb3JtYXQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zaW5nbGVEYXRlUGlja2VyICYmIHZhbCAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IG1vbWVudCh2YWwsIHRoaXMubG9jYWxlLmZvcm1hdCk7XG4gICAgICAgICAgICAgICAgICAgIGVuZCA9IG1vbWVudCh2YWwsIHRoaXMubG9jYWxlLmZvcm1hdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzdGFydCAhPT0gbnVsbCAmJiBlbmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGFydERhdGUoc3RhcnQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEVuZERhdGUoZW5kKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMucmFuZ2VzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZm9yIChyYW5nZSBpbiBvcHRpb25zLnJhbmdlcykge1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJhbmdlc1tyYW5nZV1bMF0gPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IG1vbWVudChvcHRpb25zLnJhbmdlc1tyYW5nZV1bMF0sIHRoaXMubG9jYWxlLmZvcm1hdCk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IG1vbWVudChvcHRpb25zLnJhbmdlc1tyYW5nZV1bMF0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJhbmdlc1tyYW5nZV1bMV0gPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgICAgICAgICBlbmQgPSBtb21lbnQob3B0aW9ucy5yYW5nZXNbcmFuZ2VdWzFdLCB0aGlzLmxvY2FsZS5mb3JtYXQpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gbW9tZW50KG9wdGlvbnMucmFuZ2VzW3JhbmdlXVsxXSk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgc3RhcnQgb3IgZW5kIGRhdGUgZXhjZWVkIHRob3NlIGFsbG93ZWQgYnkgdGhlIG1pbkRhdGUgb3IgZGF0ZUxpbWl0XG4gICAgICAgICAgICAgICAgLy8gb3B0aW9ucywgc2hvcnRlbiB0aGUgcmFuZ2UgdG8gdGhlIGFsbG93YWJsZSBwZXJpb2QuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWluRGF0ZSAmJiBzdGFydC5pc0JlZm9yZSh0aGlzLm1pbkRhdGUpKVxuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IHRoaXMubWluRGF0ZS5jbG9uZSgpO1xuXG4gICAgICAgICAgICAgICAgdmFyIG1heERhdGUgPSB0aGlzLm1heERhdGU7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZGF0ZUxpbWl0ICYmIHN0YXJ0LmNsb25lKCkuYWRkKHRoaXMuZGF0ZUxpbWl0KS5pc0FmdGVyKG1heERhdGUpKVxuICAgICAgICAgICAgICAgICAgICBtYXhEYXRlID0gc3RhcnQuY2xvbmUoKS5hZGQodGhpcy5kYXRlTGltaXQpO1xuICAgICAgICAgICAgICAgIGlmIChtYXhEYXRlICYmIGVuZC5pc0FmdGVyKG1heERhdGUpKVxuICAgICAgICAgICAgICAgICAgICBlbmQgPSBtYXhEYXRlLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgZW5kIG9mIHRoZSByYW5nZSBpcyBiZWZvcmUgdGhlIG1pbmltdW0gb3IgdGhlIHN0YXJ0IG9mIHRoZSByYW5nZSBpc1xuICAgICAgICAgICAgICAgIC8vIGFmdGVyIHRoZSBtYXhpbXVtLCBkb24ndCBkaXNwbGF5IHRoaXMgcmFuZ2Ugb3B0aW9uIGF0IGFsbC5cbiAgICAgICAgICAgICAgICBpZiAoKHRoaXMubWluRGF0ZSAmJiBlbmQuaXNCZWZvcmUodGhpcy5taW5EYXRlKSkgfHwgKG1heERhdGUgJiYgc3RhcnQuaXNBZnRlcihtYXhEYXRlKSkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vU3VwcG9ydCB1bmljb2RlIGNoYXJzIGluIHRoZSByYW5nZSBuYW1lcy5cbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSByYW5nZTtcbiAgICAgICAgICAgICAgICB2YXIgcmFuZ2VIdG1sID0gZWxlbS52YWx1ZTtcblxuICAgICAgICAgICAgICAgIHRoaXMucmFuZ2VzW3JhbmdlSHRtbF0gPSBbc3RhcnQsIGVuZF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBsaXN0ID0gJzx1bD4nO1xuICAgICAgICAgICAgZm9yIChyYW5nZSBpbiB0aGlzLnJhbmdlcykge1xuICAgICAgICAgICAgICAgIGxpc3QgKz0gJzxsaT4nICsgcmFuZ2UgKyAnPC9saT4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGlzdCArPSAnPGxpPicgKyB0aGlzLmxvY2FsZS5jdXN0b21SYW5nZUxhYmVsICsgJzwvbGk+JztcbiAgICAgICAgICAgIGxpc3QgKz0gJzwvdWw+JztcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJy5yYW5nZXMnKS5wcmVwZW5kKGxpc3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnRpbWVQaWNrZXIpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnREYXRlID0gdGhpcy5zdGFydERhdGUuc3RhcnRPZignZGF5Jyk7XG4gICAgICAgICAgICB0aGlzLmVuZERhdGUgPSB0aGlzLmVuZERhdGUuZW5kT2YoJ2RheScpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnLmNhbGVuZGFyLXRpbWUnKS5oaWRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2Nhbid0IGJlIHVzZWQgdG9nZXRoZXIgZm9yIG5vd1xuICAgICAgICBpZiAodGhpcy50aW1lUGlja2VyICYmIHRoaXMuYXV0b0FwcGx5KVxuICAgICAgICAgICAgdGhpcy5hdXRvQXBwbHkgPSBmYWxzZTtcblxuICAgICAgICBpZiAodGhpcy5hdXRvQXBwbHkgJiYgdHlwZW9mIG9wdGlvbnMucmFuZ2VzICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnLnJhbmdlcycpLmhpZGUoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmF1dG9BcHBseSkge1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnLmFwcGx5QnRuLCAuY2FuY2VsQnRuJykuYWRkQ2xhc3MoJ2hpZGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNpbmdsZURhdGVQaWNrZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZENsYXNzKCdzaW5nbGUnKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJy5jYWxlbmRhci5sZWZ0JykuYWRkQ2xhc3MoJ3NpbmdsZScpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnLmNhbGVuZGFyLmxlZnQnKS5zaG93KCk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5maW5kKCcuY2FsZW5kYXIucmlnaHQnKS5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5maW5kKCcuZGF0ZXJhbmdlcGlja2VyX2lucHV0IGlucHV0LCAuZGF0ZXJhbmdlcGlja2VyX2lucHV0IGknKS5oaWRlKCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMudGltZVBpY2tlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJy5yYW5nZXMnKS5oaWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKHR5cGVvZiBvcHRpb25zLnJhbmdlcyA9PT0gJ3VuZGVmaW5lZCcgJiYgIXRoaXMuc2luZ2xlRGF0ZVBpY2tlcikgfHwgdGhpcy5hbHdheXNTaG93Q2FsZW5kYXJzKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcygnc2hvdy1jYWxlbmRhcicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250YWluZXIuYWRkQ2xhc3MoJ29wZW5zJyArIHRoaXMub3BlbnMpO1xuXG4gICAgICAgIC8vc3dhcCB0aGUgcG9zaXRpb24gb2YgdGhlIHByZWRlZmluZWQgcmFuZ2VzIGlmIG9wZW5zIHJpZ2h0XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yYW5nZXMgIT09ICd1bmRlZmluZWQnICYmIHRoaXMub3BlbnMgPT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgdmFyIHJhbmdlcyA9IHRoaXMuY29udGFpbmVyLmZpbmQoJy5yYW5nZXMnKTtcbiAgICAgICAgICAgIHZhciBodG1sID0gcmFuZ2VzLmNsb25lKCk7XG4gICAgICAgICAgICByYW5nZXMucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5maW5kKCcuY2FsZW5kYXIubGVmdCcpLnBhcmVudCgpLnByZXBlbmQoaHRtbCk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2FwcGx5IENTUyBjbGFzc2VzIGFuZCBsYWJlbHMgdG8gYnV0dG9uc1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5maW5kKCcuYXBwbHlCdG4sIC5jYW5jZWxCdG4nKS5hZGRDbGFzcyh0aGlzLmJ1dHRvbkNsYXNzZXMpO1xuICAgICAgICBpZiAodGhpcy5hcHBseUNsYXNzLmxlbmd0aClcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJy5hcHBseUJ0bicpLmFkZENsYXNzKHRoaXMuYXBwbHlDbGFzcyk7XG4gICAgICAgIGlmICh0aGlzLmNhbmNlbENsYXNzLmxlbmd0aClcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJy5jYW5jZWxCdG4nKS5hZGRDbGFzcyh0aGlzLmNhbmNlbENsYXNzKTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnLmFwcGx5QnRuJykuaHRtbCh0aGlzLmxvY2FsZS5hcHBseUxhYmVsKTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnLmNhbmNlbEJ0bicpLmh0bWwodGhpcy5sb2NhbGUuY2FuY2VsTGFiZWwpO1xuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIGV2ZW50IGxpc3RlbmVyc1xuICAgICAgICAvL1xuXG4gICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJy5jYWxlbmRhcicpXG4gICAgICAgICAgICAub24oJ2NsaWNrLmRhdGVyYW5nZXBpY2tlcicsICcucHJldicsICQucHJveHkodGhpcy5jbGlja1ByZXYsIHRoaXMpKVxuICAgICAgICAgICAgLm9uKCdjbGljay5kYXRlcmFuZ2VwaWNrZXInLCAnLm5leHQnLCAkLnByb3h5KHRoaXMuY2xpY2tOZXh0LCB0aGlzKSlcbiAgICAgICAgICAgIC5vbignY2xpY2suZGF0ZXJhbmdlcGlja2VyJywgJ3RkLmF2YWlsYWJsZScsICQucHJveHkodGhpcy5jbGlja0RhdGUsIHRoaXMpKVxuICAgICAgICAgICAgLm9uKCdtb3VzZWVudGVyLmRhdGVyYW5nZXBpY2tlcicsICd0ZC5hdmFpbGFibGUnLCAkLnByb3h5KHRoaXMuaG92ZXJEYXRlLCB0aGlzKSlcbiAgICAgICAgICAgIC5vbignbW91c2VsZWF2ZS5kYXRlcmFuZ2VwaWNrZXInLCAndGQuYXZhaWxhYmxlJywgJC5wcm94eSh0aGlzLnVwZGF0ZUZvcm1JbnB1dHMsIHRoaXMpKVxuICAgICAgICAgICAgLm9uKCdjaGFuZ2UuZGF0ZXJhbmdlcGlja2VyJywgJ3NlbGVjdC55ZWFyc2VsZWN0JywgJC5wcm94eSh0aGlzLm1vbnRoT3JZZWFyQ2hhbmdlZCwgdGhpcykpXG4gICAgICAgICAgICAub24oJ2NoYW5nZS5kYXRlcmFuZ2VwaWNrZXInLCAnc2VsZWN0Lm1vbnRoc2VsZWN0JywgJC5wcm94eSh0aGlzLm1vbnRoT3JZZWFyQ2hhbmdlZCwgdGhpcykpXG4gICAgICAgICAgICAub24oJ2NoYW5nZS5kYXRlcmFuZ2VwaWNrZXInLCAnc2VsZWN0LmhvdXJzZWxlY3Qsc2VsZWN0Lm1pbnV0ZXNlbGVjdCxzZWxlY3Quc2Vjb25kc2VsZWN0LHNlbGVjdC5hbXBtc2VsZWN0JywgJC5wcm94eSh0aGlzLnRpbWVDaGFuZ2VkLCB0aGlzKSlcbiAgICAgICAgICAgIC5vbignY2xpY2suZGF0ZXJhbmdlcGlja2VyJywgJy5kYXRlcmFuZ2VwaWNrZXJfaW5wdXQgaW5wdXQnLCAkLnByb3h5KHRoaXMuc2hvd0NhbGVuZGFycywgdGhpcykpXG4gICAgICAgICAgICAvLy5vbigna2V5dXAuZGF0ZXJhbmdlcGlja2VyJywgJy5kYXRlcmFuZ2VwaWNrZXJfaW5wdXQgaW5wdXQnLCAkLnByb3h5KHRoaXMuZm9ybUlucHV0c0NoYW5nZWQsIHRoaXMpKVxuICAgICAgICAgICAgLm9uKCdjaGFuZ2UuZGF0ZXJhbmdlcGlja2VyJywgJy5kYXRlcmFuZ2VwaWNrZXJfaW5wdXQgaW5wdXQnLCAkLnByb3h5KHRoaXMuZm9ybUlucHV0c0NoYW5nZWQsIHRoaXMpKTtcblxuICAgICAgICB0aGlzLmNvbnRhaW5lci5maW5kKCcucmFuZ2VzJylcbiAgICAgICAgICAgIC5vbignY2xpY2suZGF0ZXJhbmdlcGlja2VyJywgJ2J1dHRvbi5hcHBseUJ0bicsICQucHJveHkodGhpcy5jbGlja0FwcGx5LCB0aGlzKSlcbiAgICAgICAgICAgIC5vbignY2xpY2suZGF0ZXJhbmdlcGlja2VyJywgJ2J1dHRvbi5jYW5jZWxCdG4nLCAkLnByb3h5KHRoaXMuY2xpY2tDYW5jZWwsIHRoaXMpKVxuICAgICAgICAgICAgLm9uKCdjbGljay5kYXRlcmFuZ2VwaWNrZXInLCAnbGknLCAkLnByb3h5KHRoaXMuY2xpY2tSYW5nZSwgdGhpcykpXG4gICAgICAgICAgICAub24oJ21vdXNlZW50ZXIuZGF0ZXJhbmdlcGlja2VyJywgJ2xpJywgJC5wcm94eSh0aGlzLmhvdmVyUmFuZ2UsIHRoaXMpKVxuICAgICAgICAgICAgLm9uKCdtb3VzZWxlYXZlLmRhdGVyYW5nZXBpY2tlcicsICdsaScsICQucHJveHkodGhpcy51cGRhdGVGb3JtSW5wdXRzLCB0aGlzKSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5pcygnaW5wdXQnKSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm9uKHtcbiAgICAgICAgICAgICAgICAnY2xpY2suZGF0ZXJhbmdlcGlja2VyJzogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpLFxuICAgICAgICAgICAgICAgICdmb2N1cy5kYXRlcmFuZ2VwaWNrZXInOiAkLnByb3h5KHRoaXMuc2hvdywgdGhpcyksXG4gICAgICAgICAgICAgICAgJ2tleXVwLmRhdGVyYW5nZXBpY2tlcic6ICQucHJveHkodGhpcy5lbGVtZW50Q2hhbmdlZCwgdGhpcyksXG4gICAgICAgICAgICAgICAgJ2tleWRvd24uZGF0ZXJhbmdlcGlja2VyJzogJC5wcm94eSh0aGlzLmtleWRvd24sIHRoaXMpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vbignY2xpY2suZGF0ZXJhbmdlcGlja2VyJywgJC5wcm94eSh0aGlzLnRvZ2dsZSwgdGhpcykpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gaWYgYXR0YWNoZWQgdG8gYSB0ZXh0IGlucHV0LCBzZXQgdGhlIGluaXRpYWwgdmFsdWVcbiAgICAgICAgLy9cblxuICAgICAgICBpZiAodGhpcy5lbGVtZW50LmlzKCdpbnB1dCcpICYmICF0aGlzLnNpbmdsZURhdGVQaWNrZXIgJiYgdGhpcy5hdXRvVXBkYXRlSW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC52YWwodGhpcy5zdGFydERhdGUuZm9ybWF0KHRoaXMubG9jYWxlLmZvcm1hdCkgKyB0aGlzLmxvY2FsZS5zZXBhcmF0b3IgKyB0aGlzLmVuZERhdGUuZm9ybWF0KHRoaXMubG9jYWxlLmZvcm1hdCkpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoJ2NoYW5nZScpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZWxlbWVudC5pcygnaW5wdXQnKSAmJiB0aGlzLmF1dG9VcGRhdGVJbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnZhbCh0aGlzLnN0YXJ0RGF0ZS5mb3JtYXQodGhpcy5sb2NhbGUuZm9ybWF0KSk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBEYXRlUmFuZ2VQaWNrZXIucHJvdG90eXBlID0ge1xuXG4gICAgICAgIGNvbnN0cnVjdG9yOiBEYXRlUmFuZ2VQaWNrZXIsXG5cbiAgICAgICAgc2V0U3RhcnREYXRlOiBmdW5jdGlvbihzdGFydERhdGUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhcnREYXRlID09PSAnc3RyaW5nJylcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0RGF0ZSA9IG1vbWVudChzdGFydERhdGUsIHRoaXMubG9jYWxlLmZvcm1hdCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhcnREYXRlID09PSAnb2JqZWN0JylcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0RGF0ZSA9IG1vbWVudChzdGFydERhdGUpO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMudGltZVBpY2tlcilcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0RGF0ZSA9IHRoaXMuc3RhcnREYXRlLnN0YXJ0T2YoJ2RheScpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy50aW1lUGlja2VyICYmIHRoaXMudGltZVBpY2tlckluY3JlbWVudClcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0RGF0ZS5taW51dGUoTWF0aC5yb3VuZCh0aGlzLnN0YXJ0RGF0ZS5taW51dGUoKSAvIHRoaXMudGltZVBpY2tlckluY3JlbWVudCkgKiB0aGlzLnRpbWVQaWNrZXJJbmNyZW1lbnQpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5taW5EYXRlICYmIHRoaXMuc3RhcnREYXRlLmlzQmVmb3JlKHRoaXMubWluRGF0ZSkpXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydERhdGUgPSB0aGlzLm1pbkRhdGU7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm1heERhdGUgJiYgdGhpcy5zdGFydERhdGUuaXNBZnRlcih0aGlzLm1heERhdGUpKVxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnREYXRlID0gdGhpcy5tYXhEYXRlO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNTaG93aW5nKVxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRWxlbWVudCgpO1xuXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1vbnRoc0luVmlldygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldEVuZERhdGU6IGZ1bmN0aW9uKGVuZERhdGUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZW5kRGF0ZSA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICAgICAgdGhpcy5lbmREYXRlID0gbW9tZW50KGVuZERhdGUsIHRoaXMubG9jYWxlLmZvcm1hdCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZW5kRGF0ZSA9PT0gJ29iamVjdCcpXG4gICAgICAgICAgICAgICAgdGhpcy5lbmREYXRlID0gbW9tZW50KGVuZERhdGUpO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMudGltZVBpY2tlcilcbiAgICAgICAgICAgICAgICB0aGlzLmVuZERhdGUgPSB0aGlzLmVuZERhdGUuZW5kT2YoJ2RheScpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy50aW1lUGlja2VyICYmIHRoaXMudGltZVBpY2tlckluY3JlbWVudClcbiAgICAgICAgICAgICAgICB0aGlzLmVuZERhdGUubWludXRlKE1hdGgucm91bmQodGhpcy5lbmREYXRlLm1pbnV0ZSgpIC8gdGhpcy50aW1lUGlja2VySW5jcmVtZW50KSAqIHRoaXMudGltZVBpY2tlckluY3JlbWVudCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmVuZERhdGUuaXNCZWZvcmUodGhpcy5zdGFydERhdGUpKVxuICAgICAgICAgICAgICAgIHRoaXMuZW5kRGF0ZSA9IHRoaXMuc3RhcnREYXRlLmNsb25lKCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm1heERhdGUgJiYgdGhpcy5lbmREYXRlLmlzQWZ0ZXIodGhpcy5tYXhEYXRlKSlcbiAgICAgICAgICAgICAgICB0aGlzLmVuZERhdGUgPSB0aGlzLm1heERhdGU7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGVMaW1pdCAmJiB0aGlzLnN0YXJ0RGF0ZS5jbG9uZSgpLmFkZCh0aGlzLmRhdGVMaW1pdCkuaXNCZWZvcmUodGhpcy5lbmREYXRlKSlcbiAgICAgICAgICAgICAgICB0aGlzLmVuZERhdGUgPSB0aGlzLnN0YXJ0RGF0ZS5jbG9uZSgpLmFkZCh0aGlzLmRhdGVMaW1pdCk7XG5cbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNSaWdodFRpbWUgPSB0aGlzLmVuZERhdGUuY2xvbmUoKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzU2hvd2luZylcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUVsZW1lbnQoKTtcblxuICAgICAgICAgICAgdGhpcy51cGRhdGVNb250aHNJblZpZXcoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0ludmFsaWREYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVWaWV3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVQaWNrZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlclRpbWVQaWNrZXIoJ2xlZnQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlclRpbWVQaWNrZXIoJ3JpZ2h0Jyk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmVuZERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnLnJpZ2h0IC5jYWxlbmRhci10aW1lIHNlbGVjdCcpLmF0dHIoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnLnJpZ2h0IC5jYWxlbmRhci10aW1lIHNlbGVjdCcpLnJlbW92ZUF0dHIoJ2Rpc2FibGVkJykucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZW5kRGF0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJ2lucHV0W25hbWU9XCJkYXRlcmFuZ2VwaWNrZXJfZW5kXCJdJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJ2lucHV0W25hbWU9XCJkYXRlcmFuZ2VwaWNrZXJfc3RhcnRcIl0nKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJ2lucHV0W25hbWU9XCJkYXRlcmFuZ2VwaWNrZXJfZW5kXCJdJykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJ2lucHV0W25hbWU9XCJkYXRlcmFuZ2VwaWNrZXJfc3RhcnRcIl0nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1vbnRoc0luVmlldygpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDYWxlbmRhcnMoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRm9ybUlucHV0cygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZU1vbnRoc0luVmlldzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbmREYXRlKSB7XG5cbiAgICAgICAgICAgICAgICAvL2lmIGJvdGggZGF0ZXMgYXJlIHZpc2libGUgYWxyZWFkeSwgZG8gbm90aGluZ1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5zaW5nbGVEYXRlUGlja2VyICYmIHRoaXMubGVmdENhbGVuZGFyLm1vbnRoICYmIHRoaXMucmlnaHRDYWxlbmRhci5tb250aCAmJlxuICAgICAgICAgICAgICAgICAgICAodGhpcy5zdGFydERhdGUuZm9ybWF0KCdZWVlZLU1NJykgPT0gdGhpcy5sZWZ0Q2FsZW5kYXIubW9udGguZm9ybWF0KCdZWVlZLU1NJykgfHwgdGhpcy5zdGFydERhdGUuZm9ybWF0KCdZWVlZLU1NJykgPT0gdGhpcy5yaWdodENhbGVuZGFyLm1vbnRoLmZvcm1hdCgnWVlZWS1NTScpKVxuICAgICAgICAgICAgICAgICAgICAmJlxuICAgICAgICAgICAgICAgICAgICAodGhpcy5lbmREYXRlLmZvcm1hdCgnWVlZWS1NTScpID09IHRoaXMubGVmdENhbGVuZGFyLm1vbnRoLmZvcm1hdCgnWVlZWS1NTScpIHx8IHRoaXMuZW5kRGF0ZS5mb3JtYXQoJ1lZWVktTU0nKSA9PSB0aGlzLnJpZ2h0Q2FsZW5kYXIubW9udGguZm9ybWF0KCdZWVlZLU1NJykpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5sZWZ0Q2FsZW5kYXIubW9udGggPSB0aGlzLnN0YXJ0RGF0ZS5jbG9uZSgpLmRhdGUoMik7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxpbmtlZENhbGVuZGFycyAmJiAodGhpcy5lbmREYXRlLm1vbnRoKCkgIT0gdGhpcy5zdGFydERhdGUubW9udGgoKSB8fCB0aGlzLmVuZERhdGUueWVhcigpICE9IHRoaXMuc3RhcnREYXRlLnllYXIoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yaWdodENhbGVuZGFyLm1vbnRoID0gdGhpcy5lbmREYXRlLmNsb25lKCkuZGF0ZSgyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJpZ2h0Q2FsZW5kYXIubW9udGggPSB0aGlzLnN0YXJ0RGF0ZS5jbG9uZSgpLmRhdGUoMikuYWRkKDEsICdtb250aCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGVmdENhbGVuZGFyLm1vbnRoLmZvcm1hdCgnWVlZWS1NTScpICE9IHRoaXMuc3RhcnREYXRlLmZvcm1hdCgnWVlZWS1NTScpICYmIHRoaXMucmlnaHRDYWxlbmRhci5tb250aC5mb3JtYXQoJ1lZWVktTU0nKSAhPSB0aGlzLnN0YXJ0RGF0ZS5mb3JtYXQoJ1lZWVktTU0nKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxlZnRDYWxlbmRhci5tb250aCA9IHRoaXMuc3RhcnREYXRlLmNsb25lKCkuZGF0ZSgyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yaWdodENhbGVuZGFyLm1vbnRoID0gdGhpcy5zdGFydERhdGUuY2xvbmUoKS5kYXRlKDIpLmFkZCgxLCAnbW9udGgnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlQ2FsZW5kYXJzOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgaWYgKHRoaXMudGltZVBpY2tlcikge1xuICAgICAgICAgICAgICAgIHZhciBob3VyLCBtaW51dGUsIHNlY29uZDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbmREYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvdXIgPSBwYXJzZUludCh0aGlzLmNvbnRhaW5lci5maW5kKCcubGVmdCAuaG91cnNlbGVjdCcpLnZhbCgpLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIG1pbnV0ZSA9IHBhcnNlSW50KHRoaXMuY29udGFpbmVyLmZpbmQoJy5sZWZ0IC5taW51dGVzZWxlY3QnKS52YWwoKSwgMTApO1xuICAgICAgICAgICAgICAgICAgICBzZWNvbmQgPSB0aGlzLnRpbWVQaWNrZXJTZWNvbmRzID8gcGFyc2VJbnQodGhpcy5jb250YWluZXIuZmluZCgnLmxlZnQgLnNlY29uZHNlbGVjdCcpLnZhbCgpLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudGltZVBpY2tlcjI0SG91cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFtcG0gPSB0aGlzLmNvbnRhaW5lci5maW5kKCcubGVmdCAuYW1wbXNlbGVjdCcpLnZhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFtcG0gPT09ICdQTScgJiYgaG91ciA8IDEyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdXIgKz0gMTI7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW1wbSA9PT0gJ0FNJyAmJiBob3VyID09PSAxMilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3VyID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhvdXIgPSBwYXJzZUludCh0aGlzLmNvbnRhaW5lci5maW5kKCcucmlnaHQgLmhvdXJzZWxlY3QnKS52YWwoKSwgMTApO1xuICAgICAgICAgICAgICAgICAgICBtaW51dGUgPSBwYXJzZUludCh0aGlzLmNvbnRhaW5lci5maW5kKCcucmlnaHQgLm1pbnV0ZXNlbGVjdCcpLnZhbCgpLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZCA9IHRoaXMudGltZVBpY2tlclNlY29uZHMgPyBwYXJzZUludCh0aGlzLmNvbnRhaW5lci5maW5kKCcucmlnaHQgLnNlY29uZHNlbGVjdCcpLnZhbCgpLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudGltZVBpY2tlcjI0SG91cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFtcG0gPSB0aGlzLmNvbnRhaW5lci5maW5kKCcucmlnaHQgLmFtcG1zZWxlY3QnKS52YWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbXBtID09PSAnUE0nICYmIGhvdXIgPCAxMilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3VyICs9IDEyO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFtcG0gPT09ICdBTScgJiYgaG91ciA9PT0gMTIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG91ciA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5sZWZ0Q2FsZW5kYXIubW9udGguaG91cihob3VyKS5taW51dGUobWludXRlKS5zZWNvbmQoc2Vjb25kKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJpZ2h0Q2FsZW5kYXIubW9udGguaG91cihob3VyKS5taW51dGUobWludXRlKS5zZWNvbmQoc2Vjb25kKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZW5kZXJDYWxlbmRhcignbGVmdCcpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJDYWxlbmRhcigncmlnaHQnKTtcblxuICAgICAgICAgICAgLy9oaWdobGlnaHQgYW55IHByZWRlZmluZWQgcmFuZ2UgbWF0Y2hpbmcgdGhlIGN1cnJlbnQgc3RhcnQgYW5kIGVuZCBkYXRlc1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnLnJhbmdlcyBsaScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmVuZERhdGUgPT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgICAgICAgICB0aGlzLmNhbGN1bGF0ZUNob3NlbkxhYmVsKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVuZGVyQ2FsZW5kYXI6IGZ1bmN0aW9uKHNpZGUpIHtcblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEJ1aWxkIHRoZSBtYXRyaXggb2YgZGF0ZXMgdGhhdCB3aWxsIHBvcHVsYXRlIHRoZSBjYWxlbmRhclxuICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgdmFyIGNhbGVuZGFyID0gc2lkZSA9PSAnbGVmdCcgPyB0aGlzLmxlZnRDYWxlbmRhciA6IHRoaXMucmlnaHRDYWxlbmRhcjtcbiAgICAgICAgICAgIHZhciBtb250aCA9IGNhbGVuZGFyLm1vbnRoLm1vbnRoKCk7XG4gICAgICAgICAgICB2YXIgeWVhciA9IGNhbGVuZGFyLm1vbnRoLnllYXIoKTtcbiAgICAgICAgICAgIHZhciBob3VyID0gY2FsZW5kYXIubW9udGguaG91cigpO1xuICAgICAgICAgICAgdmFyIG1pbnV0ZSA9IGNhbGVuZGFyLm1vbnRoLm1pbnV0ZSgpO1xuICAgICAgICAgICAgdmFyIHNlY29uZCA9IGNhbGVuZGFyLm1vbnRoLnNlY29uZCgpO1xuICAgICAgICAgICAgdmFyIGRheXNJbk1vbnRoID0gbW9tZW50KFt5ZWFyLCBtb250aF0pLmRheXNJbk1vbnRoKCk7XG4gICAgICAgICAgICB2YXIgZmlyc3REYXkgPSBtb21lbnQoW3llYXIsIG1vbnRoLCAxXSk7XG4gICAgICAgICAgICB2YXIgbGFzdERheSA9IG1vbWVudChbeWVhciwgbW9udGgsIGRheXNJbk1vbnRoXSk7XG4gICAgICAgICAgICB2YXIgbGFzdE1vbnRoID0gbW9tZW50KGZpcnN0RGF5KS5zdWJ0cmFjdCgxLCAnbW9udGgnKS5tb250aCgpO1xuICAgICAgICAgICAgdmFyIGxhc3RZZWFyID0gbW9tZW50KGZpcnN0RGF5KS5zdWJ0cmFjdCgxLCAnbW9udGgnKS55ZWFyKCk7XG4gICAgICAgICAgICB2YXIgZGF5c0luTGFzdE1vbnRoID0gbW9tZW50KFtsYXN0WWVhciwgbGFzdE1vbnRoXSkuZGF5c0luTW9udGgoKTtcbiAgICAgICAgICAgIHZhciBkYXlPZldlZWsgPSBmaXJzdERheS5kYXkoKTtcblxuICAgICAgICAgICAgLy9pbml0aWFsaXplIGEgNiByb3dzIHggNyBjb2x1bW5zIGFycmF5IGZvciB0aGUgY2FsZW5kYXJcbiAgICAgICAgICAgIHZhciBjYWxlbmRhciA9IFtdO1xuICAgICAgICAgICAgY2FsZW5kYXIuZmlyc3REYXkgPSBmaXJzdERheTtcbiAgICAgICAgICAgIGNhbGVuZGFyLmxhc3REYXkgPSBsYXN0RGF5O1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDY7IGkrKykge1xuICAgICAgICAgICAgICAgIGNhbGVuZGFyW2ldID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vcG9wdWxhdGUgdGhlIGNhbGVuZGFyIHdpdGggZGF0ZSBvYmplY3RzXG4gICAgICAgICAgICB2YXIgc3RhcnREYXkgPSBkYXlzSW5MYXN0TW9udGggLSBkYXlPZldlZWsgKyB0aGlzLmxvY2FsZS5maXJzdERheSArIDE7XG4gICAgICAgICAgICBpZiAoc3RhcnREYXkgPiBkYXlzSW5MYXN0TW9udGgpXG4gICAgICAgICAgICAgICAgc3RhcnREYXkgLT0gNztcblxuICAgICAgICAgICAgaWYgKGRheU9mV2VlayA9PSB0aGlzLmxvY2FsZS5maXJzdERheSlcbiAgICAgICAgICAgICAgICBzdGFydERheSA9IGRheXNJbkxhc3RNb250aCAtIDY7XG5cbiAgICAgICAgICAgIHZhciBjdXJEYXRlID0gbW9tZW50KFtsYXN0WWVhciwgbGFzdE1vbnRoLCBzdGFydERheSwgMTIsIG1pbnV0ZSwgc2Vjb25kXSk7XG5cbiAgICAgICAgICAgIHZhciBjb2wsIHJvdztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBjb2wgPSAwLCByb3cgPSAwOyBpIDwgNDI7IGkrKywgY29sKyssIGN1ckRhdGUgPSBtb21lbnQoY3VyRGF0ZSkuYWRkKDI0LCAnaG91cicpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgPiAwICYmIGNvbCAlIDcgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29sID0gMDtcbiAgICAgICAgICAgICAgICAgICAgcm93Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbGVuZGFyW3Jvd11bY29sXSA9IGN1ckRhdGUuY2xvbmUoKS5ob3VyKGhvdXIpLm1pbnV0ZShtaW51dGUpLnNlY29uZChzZWNvbmQpO1xuICAgICAgICAgICAgICAgIGN1ckRhdGUuaG91cigxMik7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5taW5EYXRlICYmIGNhbGVuZGFyW3Jvd11bY29sXS5mb3JtYXQoJ1lZWVktTU0tREQnKSA9PSB0aGlzLm1pbkRhdGUuZm9ybWF0KCdZWVlZLU1NLUREJykgJiYgY2FsZW5kYXJbcm93XVtjb2xdLmlzQmVmb3JlKHRoaXMubWluRGF0ZSkgJiYgc2lkZSA9PSAnbGVmdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsZW5kYXJbcm93XVtjb2xdID0gdGhpcy5taW5EYXRlLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWF4RGF0ZSAmJiBjYWxlbmRhcltyb3ddW2NvbF0uZm9ybWF0KCdZWVlZLU1NLUREJykgPT0gdGhpcy5tYXhEYXRlLmZvcm1hdCgnWVlZWS1NTS1ERCcpICYmIGNhbGVuZGFyW3Jvd11bY29sXS5pc0FmdGVyKHRoaXMubWF4RGF0ZSkgJiYgc2lkZSA9PSAncmlnaHQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGVuZGFyW3Jvd11bY29sXSA9IHRoaXMubWF4RGF0ZS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL21ha2UgdGhlIGNhbGVuZGFyIG9iamVjdCBhdmFpbGFibGUgdG8gaG92ZXJEYXRlL2NsaWNrRGF0ZVxuICAgICAgICAgICAgaWYgKHNpZGUgPT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sZWZ0Q2FsZW5kYXIuY2FsZW5kYXIgPSBjYWxlbmRhcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yaWdodENhbGVuZGFyLmNhbGVuZGFyID0gY2FsZW5kYXI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBEaXNwbGF5IHRoZSBjYWxlbmRhclxuICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgdmFyIG1pbkRhdGUgPSBzaWRlID09ICdsZWZ0JyA/IHRoaXMubWluRGF0ZSA6IHRoaXMuc3RhcnREYXRlO1xuICAgICAgICAgICAgdmFyIG1heERhdGUgPSB0aGlzLm1heERhdGU7XG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSBzaWRlID09ICdsZWZ0JyA/IHRoaXMuc3RhcnREYXRlIDogdGhpcy5lbmREYXRlO1xuXG4gICAgICAgICAgICB2YXIgaHRtbCA9ICc8dGFibGUgY2xhc3M9XCJ0YWJsZS1jb25kZW5zZWRcIj4nO1xuICAgICAgICAgICAgaHRtbCArPSAnPHRoZWFkPic7XG4gICAgICAgICAgICBodG1sICs9ICc8dHI+JztcblxuICAgICAgICAgICAgLy8gYWRkIGVtcHR5IGNlbGwgZm9yIHdlZWsgbnVtYmVyXG4gICAgICAgICAgICBpZiAodGhpcy5zaG93V2Vla051bWJlcnMgfHwgdGhpcy5zaG93SVNPV2Vla051bWJlcnMpXG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPHRoPjwvdGg+JztcblxuICAgICAgICAgICAgaWYgKCghbWluRGF0ZSB8fCBtaW5EYXRlLmlzQmVmb3JlKGNhbGVuZGFyLmZpcnN0RGF5KSkgJiYgKCF0aGlzLmxpbmtlZENhbGVuZGFycyB8fCBzaWRlID09ICdsZWZ0JykpIHtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8dGggY2xhc3M9XCJwcmV2IGF2YWlsYWJsZVwiPjxpIGNsYXNzPVwiZmEgZmEtY2hldnJvbi1sZWZ0IGdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1sZWZ0XCI+PC9pPjwvdGg+JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPHRoPjwvdGg+JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGRhdGVIdG1sID0gdGhpcy5sb2NhbGUubW9udGhOYW1lc1tjYWxlbmRhclsxXVsxXS5tb250aCgpXSArIGNhbGVuZGFyWzFdWzFdLmZvcm1hdChcIiBZWVlZXCIpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zaG93RHJvcGRvd25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRNb250aCA9IGNhbGVuZGFyWzFdWzFdLm1vbnRoKCk7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRZZWFyID0gY2FsZW5kYXJbMV1bMV0ueWVhcigpO1xuICAgICAgICAgICAgICAgIHZhciBtYXhZZWFyID0gKG1heERhdGUgJiYgbWF4RGF0ZS55ZWFyKCkpIHx8IChjdXJyZW50WWVhciArIDUpO1xuICAgICAgICAgICAgICAgIHZhciBtaW5ZZWFyID0gKG1pbkRhdGUgJiYgbWluRGF0ZS55ZWFyKCkpIHx8IChjdXJyZW50WWVhciAtIDUwKTtcbiAgICAgICAgICAgICAgICB2YXIgaW5NaW5ZZWFyID0gY3VycmVudFllYXIgPT0gbWluWWVhcjtcbiAgICAgICAgICAgICAgICB2YXIgaW5NYXhZZWFyID0gY3VycmVudFllYXIgPT0gbWF4WWVhcjtcblxuICAgICAgICAgICAgICAgIHZhciBtb250aEh0bWwgPSAnPHNlbGVjdCBjbGFzcz1cIm1vbnRoc2VsZWN0XCI+JztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBtID0gMDsgbSA8IDEyOyBtKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCghaW5NaW5ZZWFyIHx8IG0gPj0gbWluRGF0ZS5tb250aCgpKSAmJiAoIWluTWF4WWVhciB8fCBtIDw9IG1heERhdGUubW9udGgoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoSHRtbCArPSBcIjxvcHRpb24gdmFsdWU9J1wiICsgbSArIFwiJ1wiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAobSA9PT0gY3VycmVudE1vbnRoID8gXCIgc2VsZWN0ZWQ9J3NlbGVjdGVkJ1wiIDogXCJcIikgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPlwiICsgdGhpcy5sb2NhbGUubW9udGhOYW1lc1ttXSArIFwiPC9vcHRpb24+XCI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb250aEh0bWwgKz0gXCI8b3B0aW9uIHZhbHVlPSdcIiArIG0gKyBcIidcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKG0gPT09IGN1cnJlbnRNb250aCA/IFwiIHNlbGVjdGVkPSdzZWxlY3RlZCdcIiA6IFwiXCIpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBkaXNhYmxlZD0nZGlzYWJsZWQnPlwiICsgdGhpcy5sb2NhbGUubW9udGhOYW1lc1ttXSArIFwiPC9vcHRpb24+XCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbW9udGhIdG1sICs9IFwiPC9zZWxlY3Q+XCI7XG5cbiAgICAgICAgICAgICAgICB2YXIgeWVhckh0bWwgPSAnPHNlbGVjdCBjbGFzcz1cInllYXJzZWxlY3RcIj4nO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHkgPSBtaW5ZZWFyOyB5IDw9IG1heFllYXI7IHkrKykge1xuICAgICAgICAgICAgICAgICAgICB5ZWFySHRtbCArPSAnPG9wdGlvbiB2YWx1ZT1cIicgKyB5ICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAoeSA9PT0gY3VycmVudFllYXIgPyAnIHNlbGVjdGVkPVwic2VsZWN0ZWRcIicgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJz4nICsgeSArICc8L29wdGlvbj4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB5ZWFySHRtbCArPSAnPC9zZWxlY3Q+JztcblxuICAgICAgICAgICAgICAgIGRhdGVIdG1sID0gbW9udGhIdG1sICsgeWVhckh0bWw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGh0bWwgKz0gJzx0aCBjb2xzcGFuPVwiNVwiIGNsYXNzPVwibW9udGhcIj4nICsgZGF0ZUh0bWwgKyAnPC90aD4nO1xuICAgICAgICAgICAgaWYgKCghbWF4RGF0ZSB8fCBtYXhEYXRlLmlzQWZ0ZXIoY2FsZW5kYXIubGFzdERheSkpICYmICghdGhpcy5saW5rZWRDYWxlbmRhcnMgfHwgc2lkZSA9PSAncmlnaHQnIHx8IHRoaXMuc2luZ2xlRGF0ZVBpY2tlcikpIHtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8dGggY2xhc3M9XCJuZXh0IGF2YWlsYWJsZVwiPjxpIGNsYXNzPVwiZmEgZmEtY2hldnJvbi1yaWdodCBnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHRcIj48L2k+PC90aD4nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8dGg+PC90aD4nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBodG1sICs9ICc8L3RyPic7XG4gICAgICAgICAgICBodG1sICs9ICc8dHI+JztcblxuICAgICAgICAgICAgLy8gYWRkIHdlZWsgbnVtYmVyIGxhYmVsXG4gICAgICAgICAgICBpZiAodGhpcy5zaG93V2Vla051bWJlcnMgfHwgdGhpcy5zaG93SVNPV2Vla051bWJlcnMpXG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPHRoIGNsYXNzPVwid2Vla1wiPicgKyB0aGlzLmxvY2FsZS53ZWVrTGFiZWwgKyAnPC90aD4nO1xuXG4gICAgICAgICAgICAkLmVhY2godGhpcy5sb2NhbGUuZGF5c09mV2VlaywgZnVuY3Rpb24oaW5kZXgsIGRheU9mV2Vlaykge1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzx0aD4nICsgZGF5T2ZXZWVrICsgJzwvdGg+JztcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBodG1sICs9ICc8L3RyPic7XG4gICAgICAgICAgICBodG1sICs9ICc8L3RoZWFkPic7XG4gICAgICAgICAgICBodG1sICs9ICc8dGJvZHk+JztcblxuICAgICAgICAgICAgLy9hZGp1c3QgbWF4RGF0ZSB0byByZWZsZWN0IHRoZSBkYXRlTGltaXQgc2V0dGluZyBpbiBvcmRlciB0b1xuICAgICAgICAgICAgLy9ncmV5IG91dCBlbmQgZGF0ZXMgYmV5b25kIHRoZSBkYXRlTGltaXRcbiAgICAgICAgICAgIGlmICh0aGlzLmVuZERhdGUgPT0gbnVsbCAmJiB0aGlzLmRhdGVMaW1pdCkge1xuICAgICAgICAgICAgICAgIHZhciBtYXhMaW1pdCA9IHRoaXMuc3RhcnREYXRlLmNsb25lKCkuYWRkKHRoaXMuZGF0ZUxpbWl0KS5lbmRPZignZGF5Jyk7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXhEYXRlIHx8IG1heExpbWl0LmlzQmVmb3JlKG1heERhdGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIG1heERhdGUgPSBtYXhMaW1pdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIHJvdyA9IDA7IHJvdyA8IDY7IHJvdysrKSB7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPHRyPic7XG5cbiAgICAgICAgICAgICAgICAvLyBhZGQgd2VlayBudW1iZXJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zaG93V2Vla051bWJlcnMpXG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gJzx0ZCBjbGFzcz1cIndlZWtcIj4nICsgY2FsZW5kYXJbcm93XVswXS53ZWVrKCkgKyAnPC90ZD4nO1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuc2hvd0lTT1dlZWtOdW1iZXJzKVxuICAgICAgICAgICAgICAgICAgICBodG1sICs9ICc8dGQgY2xhc3M9XCJ3ZWVrXCI+JyArIGNhbGVuZGFyW3Jvd11bMF0uaXNvV2VlaygpICsgJzwvdGQ+JztcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGNvbCA9IDA7IGNvbCA8IDc7IGNvbCsrKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNsYXNzZXMgPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAvL2hpZ2hsaWdodCB0b2RheSdzIGRhdGVcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGVuZGFyW3Jvd11bY29sXS5pc1NhbWUobmV3IERhdGUoKSwgXCJkYXlcIikpXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2goJ3RvZGF5Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9oaWdobGlnaHQgd2Vla2VuZHNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGVuZGFyW3Jvd11bY29sXS5pc29XZWVrZGF5KCkgPiA1KVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKCd3ZWVrZW5kJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9ncmV5IG91dCB0aGUgZGF0ZXMgaW4gb3RoZXIgbW9udGhzIGRpc3BsYXllZCBhdCBiZWdpbm5pbmcgYW5kIGVuZCBvZiB0aGlzIGNhbGVuZGFyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxlbmRhcltyb3ddW2NvbF0ubW9udGgoKSAhPSBjYWxlbmRhclsxXVsxXS5tb250aCgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKCdvZmYnKTtcblxuICAgICAgICAgICAgICAgICAgICAvL2Rvbid0IGFsbG93IHNlbGVjdGlvbiBvZiBkYXRlcyBiZWZvcmUgdGhlIG1pbmltdW0gZGF0ZVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5taW5EYXRlICYmIGNhbGVuZGFyW3Jvd11bY29sXS5pc0JlZm9yZSh0aGlzLm1pbkRhdGUsICdkYXknKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaCgnb2ZmJywgJ2Rpc2FibGVkJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9kb24ndCBhbGxvdyBzZWxlY3Rpb24gb2YgZGF0ZXMgYWZ0ZXIgdGhlIG1heGltdW0gZGF0ZVxuICAgICAgICAgICAgICAgICAgICBpZiAobWF4RGF0ZSAmJiBjYWxlbmRhcltyb3ddW2NvbF0uaXNBZnRlcihtYXhEYXRlLCAnZGF5JykpXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2goJ29mZicsICdkaXNhYmxlZCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vZG9uJ3QgYWxsb3cgc2VsZWN0aW9uIG9mIGRhdGUgaWYgYSBjdXN0b20gZnVuY3Rpb24gZGVjaWRlcyBpdCdzIGludmFsaWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNJbnZhbGlkRGF0ZShjYWxlbmRhcltyb3ddW2NvbF0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKCdvZmYnLCAnZGlzYWJsZWQnKTtcblxuICAgICAgICAgICAgICAgICAgICAvL2hpZ2hsaWdodCB0aGUgY3VycmVudGx5IHNlbGVjdGVkIHN0YXJ0IGRhdGVcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGVuZGFyW3Jvd11bY29sXS5mb3JtYXQoJ1lZWVktTU0tREQnKSA9PSB0aGlzLnN0YXJ0RGF0ZS5mb3JtYXQoJ1lZWVktTU0tREQnKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaCgnYWN0aXZlJywgJ3N0YXJ0LWRhdGUnKTtcblxuICAgICAgICAgICAgICAgICAgICAvL2hpZ2hsaWdodCB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGVuZCBkYXRlXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVuZERhdGUgIT0gbnVsbCAmJiBjYWxlbmRhcltyb3ddW2NvbF0uZm9ybWF0KCdZWVlZLU1NLUREJykgPT0gdGhpcy5lbmREYXRlLmZvcm1hdCgnWVlZWS1NTS1ERCcpKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKCdhY3RpdmUnLCAnZW5kLWRhdGUnKTtcblxuICAgICAgICAgICAgICAgICAgICAvL2hpZ2hsaWdodCBkYXRlcyBpbi1iZXR3ZWVuIHRoZSBzZWxlY3RlZCBkYXRlc1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lbmREYXRlICE9IG51bGwgJiYgY2FsZW5kYXJbcm93XVtjb2xdID4gdGhpcy5zdGFydERhdGUgJiYgY2FsZW5kYXJbcm93XVtjb2xdIDwgdGhpcy5lbmREYXRlKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKCdpbi1yYW5nZScpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbmFtZSA9ICcnLCBkaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNuYW1lICs9IGNsYXNzZXNbaV0gKyAnICc7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xhc3Nlc1tpXSA9PSAnZGlzYWJsZWQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWRpc2FibGVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgY25hbWUgKz0gJ2F2YWlsYWJsZSc7XG5cbiAgICAgICAgICAgICAgICAgICAgaHRtbCArPSAnPHRkIGNsYXNzPVwiJyArIGNuYW1lLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKSArICdcIiBkYXRhLXRpdGxlPVwiJyArICdyJyArIHJvdyArICdjJyArIGNvbCArICdcIj4nICsgY2FsZW5kYXJbcm93XVtjb2xdLmRhdGUoKSArICc8L3RkPic7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPC90cj4nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBodG1sICs9ICc8L3Rib2R5Pic7XG4gICAgICAgICAgICBodG1sICs9ICc8L3RhYmxlPic7XG5cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJy5jYWxlbmRhci4nICsgc2lkZSArICcgLmNhbGVuZGFyLXRhYmxlJykuaHRtbChodG1sKTtcblxuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlclRpbWVQaWNrZXI6IGZ1bmN0aW9uKHNpZGUpIHtcblxuICAgICAgICAgICAgdmFyIGh0bWwsIHNlbGVjdGVkLCBtaW5EYXRlLCBtYXhEYXRlID0gdGhpcy5tYXhEYXRlO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5kYXRlTGltaXQgJiYgKCF0aGlzLm1heERhdGUgfHwgdGhpcy5zdGFydERhdGUuY2xvbmUoKS5hZGQodGhpcy5kYXRlTGltaXQpLmlzQWZ0ZXIodGhpcy5tYXhEYXRlKSkpXG4gICAgICAgICAgICAgICAgbWF4RGF0ZSA9IHRoaXMuc3RhcnREYXRlLmNsb25lKCkuYWRkKHRoaXMuZGF0ZUxpbWl0KTtcblxuICAgICAgICAgICAgaWYgKHNpZGUgPT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWQgPSB0aGlzLnN0YXJ0RGF0ZS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgIG1pbkRhdGUgPSB0aGlzLm1pbkRhdGU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNpZGUgPT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkID0gdGhpcy5lbmREYXRlID8gdGhpcy5lbmREYXRlLmNsb25lKCkgOiB0aGlzLnByZXZpb3VzUmlnaHRUaW1lLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgbWluRGF0ZSA9IHRoaXMuc3RhcnREYXRlO1xuXG4gICAgICAgICAgICAgICAgLy9QcmVzZXJ2ZSB0aGUgdGltZSBhbHJlYWR5IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgdmFyIHRpbWVTZWxlY3RvciA9IHRoaXMuY29udGFpbmVyLmZpbmQoJy5jYWxlbmRhci5yaWdodCAuY2FsZW5kYXItdGltZSBkaXYnKTtcbiAgICAgICAgICAgICAgICBpZiAodGltZVNlbGVjdG9yLmh0bWwoKSAhPSAnJykge1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkLmhvdXIodGltZVNlbGVjdG9yLmZpbmQoJy5ob3Vyc2VsZWN0IG9wdGlvbjpzZWxlY3RlZCcpLnZhbCgpIHx8IHNlbGVjdGVkLmhvdXIoKSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkLm1pbnV0ZSh0aW1lU2VsZWN0b3IuZmluZCgnLm1pbnV0ZXNlbGVjdCBvcHRpb246c2VsZWN0ZWQnKS52YWwoKSB8fCBzZWxlY3RlZC5taW51dGUoKSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkLnNlY29uZCh0aW1lU2VsZWN0b3IuZmluZCgnLnNlY29uZHNlbGVjdCBvcHRpb246c2VsZWN0ZWQnKS52YWwoKSB8fCBzZWxlY3RlZC5zZWNvbmQoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnRpbWVQaWNrZXIyNEhvdXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbXBtID0gdGltZVNlbGVjdG9yLmZpbmQoJy5hbXBtc2VsZWN0IG9wdGlvbjpzZWxlY3RlZCcpLnZhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFtcG0gPT09ICdQTScgJiYgc2VsZWN0ZWQuaG91cigpIDwgMTIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQuaG91cihzZWxlY3RlZC5ob3VyKCkgKyAxMik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW1wbSA9PT0gJ0FNJyAmJiBzZWxlY3RlZC5ob3VyKCkgPT09IDEyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkLmhvdXIoMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWQuaXNCZWZvcmUodGhpcy5zdGFydERhdGUpKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQgPSB0aGlzLnN0YXJ0RGF0ZS5jbG9uZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZC5pc0FmdGVyKG1heERhdGUpKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQgPSBtYXhEYXRlLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBob3Vyc1xuICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgaHRtbCA9ICc8c2VsZWN0IGNsYXNzPVwiaG91cnNlbGVjdFwiPic7XG5cbiAgICAgICAgICAgIHZhciBzdGFydCA9IHRoaXMudGltZVBpY2tlcjI0SG91ciA/IDAgOiAxO1xuICAgICAgICAgICAgdmFyIGVuZCA9IHRoaXMudGltZVBpY2tlcjI0SG91ciA/IDIzIDogMTI7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBzdGFydDsgaSA8PSBlbmQ7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBpX2luXzI0ID0gaTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudGltZVBpY2tlcjI0SG91cilcbiAgICAgICAgICAgICAgICAgICAgaV9pbl8yNCA9IHNlbGVjdGVkLmhvdXIoKSA+PSAxMiA/IChpID09IDEyID8gMTIgOiBpICsgMTIpIDogKGkgPT0gMTIgPyAwIDogaSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgdGltZSA9IHNlbGVjdGVkLmNsb25lKCkuaG91cihpX2luXzI0KTtcbiAgICAgICAgICAgICAgICB2YXIgZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAobWluRGF0ZSAmJiB0aW1lLm1pbnV0ZSg1OSkuaXNCZWZvcmUobWluRGF0ZSkpXG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAobWF4RGF0ZSAmJiB0aW1lLm1pbnV0ZSgwKS5pc0FmdGVyKG1heERhdGUpKVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBpZiAoaV9pbl8yNCA9PSBzZWxlY3RlZC5ob3VyKCkgJiYgIWRpc2FibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxvcHRpb24gdmFsdWU9XCInICsgaSArICdcIiBzZWxlY3RlZD1cInNlbGVjdGVkXCI+JyArIGkgKyAnPC9vcHRpb24+JztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRpc2FibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxvcHRpb24gdmFsdWU9XCInICsgaSArICdcIiBkaXNhYmxlZD1cImRpc2FibGVkXCIgY2xhc3M9XCJkaXNhYmxlZFwiPicgKyBpICsgJzwvb3B0aW9uPic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT1cIicgKyBpICsgJ1wiPicgKyBpICsgJzwvb3B0aW9uPic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBodG1sICs9ICc8L3NlbGVjdD4gJztcblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIG1pbnV0ZXNcbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIGh0bWwgKz0gJzogPHNlbGVjdCBjbGFzcz1cIm1pbnV0ZXNlbGVjdFwiPic7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNjA7IGkgKz0gdGhpcy50aW1lUGlja2VySW5jcmVtZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhZGRlZCA9IGkgPCAxMCA/ICcwJyArIGkgOiBpO1xuICAgICAgICAgICAgICAgIHZhciB0aW1lID0gc2VsZWN0ZWQuY2xvbmUoKS5taW51dGUoaSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAobWluRGF0ZSAmJiB0aW1lLnNlY29uZCg1OSkuaXNCZWZvcmUobWluRGF0ZSkpXG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAobWF4RGF0ZSAmJiB0aW1lLnNlY29uZCgwKS5pc0FmdGVyKG1heERhdGUpKVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWQubWludXRlKCkgPT0gaSAmJiAhZGlzYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT1cIicgKyBpICsgJ1wiIHNlbGVjdGVkPVwic2VsZWN0ZWRcIj4nICsgcGFkZGVkICsgJzwvb3B0aW9uPic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkaXNhYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICBodG1sICs9ICc8b3B0aW9uIHZhbHVlPVwiJyArIGkgKyAnXCIgZGlzYWJsZWQ9XCJkaXNhYmxlZFwiIGNsYXNzPVwiZGlzYWJsZWRcIj4nICsgcGFkZGVkICsgJzwvb3B0aW9uPic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT1cIicgKyBpICsgJ1wiPicgKyBwYWRkZWQgKyAnPC9vcHRpb24+JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGh0bWwgKz0gJzwvc2VsZWN0PiAnO1xuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gc2Vjb25kc1xuICAgICAgICAgICAgLy9cblxuICAgICAgICAgICAgaWYgKHRoaXMudGltZVBpY2tlclNlY29uZHMpIHtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc6IDxzZWxlY3QgY2xhc3M9XCJzZWNvbmRzZWxlY3RcIj4nO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA2MDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYWRkZWQgPSBpIDwgMTAgPyAnMCcgKyBpIDogaTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRpbWUgPSBzZWxlY3RlZC5jbG9uZSgpLnNlY29uZChpKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pbkRhdGUgJiYgdGltZS5pc0JlZm9yZShtaW5EYXRlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1heERhdGUgJiYgdGltZS5pc0FmdGVyKG1heERhdGUpKVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZC5zZWNvbmQoKSA9PSBpICYmICFkaXNhYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT1cIicgKyBpICsgJ1wiIHNlbGVjdGVkPVwic2VsZWN0ZWRcIj4nICsgcGFkZGVkICsgJzwvb3B0aW9uPic7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGlzYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxvcHRpb24gdmFsdWU9XCInICsgaSArICdcIiBkaXNhYmxlZD1cImRpc2FibGVkXCIgY2xhc3M9XCJkaXNhYmxlZFwiPicgKyBwYWRkZWQgKyAnPC9vcHRpb24+JztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxvcHRpb24gdmFsdWU9XCInICsgaSArICdcIj4nICsgcGFkZGVkICsgJzwvb3B0aW9uPic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBodG1sICs9ICc8L3NlbGVjdD4gJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFNL1BNXG4gICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMudGltZVBpY2tlcjI0SG91cikge1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxzZWxlY3QgY2xhc3M9XCJhbXBtc2VsZWN0XCI+JztcblxuICAgICAgICAgICAgICAgIHZhciBhbV9odG1sID0gJyc7XG4gICAgICAgICAgICAgICAgdmFyIHBtX2h0bWwgPSAnJztcblxuICAgICAgICAgICAgICAgIGlmIChtaW5EYXRlICYmIHNlbGVjdGVkLmNsb25lKCkuaG91cigxMikubWludXRlKDApLnNlY29uZCgwKS5pc0JlZm9yZShtaW5EYXRlKSlcbiAgICAgICAgICAgICAgICAgICAgYW1faHRtbCA9ICcgZGlzYWJsZWQ9XCJkaXNhYmxlZFwiIGNsYXNzPVwiZGlzYWJsZWRcIic7XG5cbiAgICAgICAgICAgICAgICBpZiAobWF4RGF0ZSAmJiBzZWxlY3RlZC5jbG9uZSgpLmhvdXIoMCkubWludXRlKDApLnNlY29uZCgwKS5pc0FmdGVyKG1heERhdGUpKVxuICAgICAgICAgICAgICAgICAgICBwbV9odG1sID0gJyBkaXNhYmxlZD1cImRpc2FibGVkXCIgY2xhc3M9XCJkaXNhYmxlZFwiJztcblxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZC5ob3VyKCkgPj0gMTIpIHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT1cIkFNXCInICsgYW1faHRtbCArICc+QU08L29wdGlvbj48b3B0aW9uIHZhbHVlPVwiUE1cIiBzZWxlY3RlZD1cInNlbGVjdGVkXCInICsgcG1faHRtbCArICc+UE08L29wdGlvbj4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxvcHRpb24gdmFsdWU9XCJBTVwiIHNlbGVjdGVkPVwic2VsZWN0ZWRcIicgKyBhbV9odG1sICsgJz5BTTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XCJQTVwiJyArIHBtX2h0bWwgKyAnPlBNPC9vcHRpb24+JztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBodG1sICs9ICc8L3NlbGVjdD4nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5maW5kKCcuY2FsZW5kYXIuJyArIHNpZGUgKyAnIC5jYWxlbmRhci10aW1lIGRpdicpLmh0bWwoaHRtbCk7XG5cbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVGb3JtSW5wdXRzOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgLy9pZ25vcmUgbW91c2UgbW92ZW1lbnRzIHdoaWxlIGFuIGFib3ZlLWNhbGVuZGFyIHRleHQgaW5wdXQgaGFzIGZvY3VzXG4gICAgICAgICAgICBpZiAodGhpcy5jb250YWluZXIuZmluZCgnaW5wdXRbbmFtZT1kYXRlcmFuZ2VwaWNrZXJfc3RhcnRdJykuaXMoXCI6Zm9jdXNcIikgfHwgdGhpcy5jb250YWluZXIuZmluZCgnaW5wdXRbbmFtZT1kYXRlcmFuZ2VwaWNrZXJfZW5kXScpLmlzKFwiOmZvY3VzXCIpKVxuICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnaW5wdXRbbmFtZT1kYXRlcmFuZ2VwaWNrZXJfc3RhcnRdJykudmFsKHRoaXMuc3RhcnREYXRlLmZvcm1hdCh0aGlzLmxvY2FsZS5mb3JtYXQpKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmVuZERhdGUpXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnaW5wdXRbbmFtZT1kYXRlcmFuZ2VwaWNrZXJfZW5kXScpLnZhbCh0aGlzLmVuZERhdGUuZm9ybWF0KHRoaXMubG9jYWxlLmZvcm1hdCkpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zaW5nbGVEYXRlUGlja2VyIHx8ICh0aGlzLmVuZERhdGUgJiYgKHRoaXMuc3RhcnREYXRlLmlzQmVmb3JlKHRoaXMuZW5kRGF0ZSkgfHwgdGhpcy5zdGFydERhdGUuaXNTYW1lKHRoaXMuZW5kRGF0ZSkpKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJ2J1dHRvbi5hcHBseUJ0bicpLnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJ2J1dHRvbi5hcHBseUJ0bicpLmF0dHIoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSxcblxuICAgICAgICBtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRPZmZzZXQgPSB7IHRvcDogMCwgbGVmdDogMCB9LFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lclRvcDtcbiAgICAgICAgICAgIHZhciBwYXJlbnRSaWdodEVkZ2UgPSAkKHdpbmRvdykud2lkdGgoKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5wYXJlbnRFbC5pcygnYm9keScpKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50T2Zmc2V0ID0ge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IHRoaXMucGFyZW50RWwub2Zmc2V0KCkudG9wIC0gdGhpcy5wYXJlbnRFbC5zY3JvbGxUb3AoKSxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogdGhpcy5wYXJlbnRFbC5vZmZzZXQoKS5sZWZ0IC0gdGhpcy5wYXJlbnRFbC5zY3JvbGxMZWZ0KClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHBhcmVudFJpZ2h0RWRnZSA9IHRoaXMucGFyZW50RWxbMF0uY2xpZW50V2lkdGggKyB0aGlzLnBhcmVudEVsLm9mZnNldCgpLmxlZnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmRyb3BzID09ICd1cCcpXG4gICAgICAgICAgICAgICAgY29udGFpbmVyVG9wID0gdGhpcy5lbGVtZW50Lm9mZnNldCgpLnRvcCAtIHRoaXMuY29udGFpbmVyLm91dGVySGVpZ2h0KCkgLSBwYXJlbnRPZmZzZXQudG9wO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNvbnRhaW5lclRvcCA9IHRoaXMuZWxlbWVudC5vZmZzZXQoKS50b3AgKyB0aGlzLmVsZW1lbnQub3V0ZXJIZWlnaHQoKSAtIHBhcmVudE9mZnNldC50b3A7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lclt0aGlzLmRyb3BzID09ICd1cCcgPyAnYWRkQ2xhc3MnIDogJ3JlbW92ZUNsYXNzJ10oJ2Ryb3B1cCcpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5vcGVucyA9PSAnbGVmdCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jc3Moe1xuICAgICAgICAgICAgICAgICAgICB0b3A6IGNvbnRhaW5lclRvcCxcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IHBhcmVudFJpZ2h0RWRnZSAtIHRoaXMuZWxlbWVudC5vZmZzZXQoKS5sZWZ0IC0gdGhpcy5lbGVtZW50Lm91dGVyV2lkdGgoKSxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogJ2F1dG8nXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyLm9mZnNldCgpLmxlZnQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodDogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogOVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3BlbnMgPT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jc3Moe1xuICAgICAgICAgICAgICAgICAgICB0b3A6IGNvbnRhaW5lclRvcCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogdGhpcy5lbGVtZW50Lm9mZnNldCgpLmxlZnQgLSBwYXJlbnRPZmZzZXQubGVmdCArIHRoaXMuZWxlbWVudC5vdXRlcldpZHRoKCkgLyAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLSB0aGlzLmNvbnRhaW5lci5vdXRlcldpZHRoKCkgLyAyLFxuICAgICAgICAgICAgICAgICAgICByaWdodDogJ2F1dG8nXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyLm9mZnNldCgpLmxlZnQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodDogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogOVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogY29udGFpbmVyVG9wLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiB0aGlzLmVsZW1lbnQub2Zmc2V0KCkubGVmdCAtIHBhcmVudE9mZnNldC5sZWZ0LFxuICAgICAgICAgICAgICAgICAgICByaWdodDogJ2F1dG8nXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyLm9mZnNldCgpLmxlZnQgKyB0aGlzLmNvbnRhaW5lci5vdXRlcldpZHRoKCkgPiAkKHdpbmRvdykud2lkdGgoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogJ2F1dG8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IDBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHNob3c6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzU2hvd2luZykgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBjbGljayBwcm94eSB0aGF0IGlzIHByaXZhdGUgdG8gdGhpcyBpbnN0YW5jZSBvZiBkYXRlcGlja2VyLCBmb3IgdW5iaW5kaW5nXG4gICAgICAgICAgICB0aGlzLl9vdXRzaWRlQ2xpY2tQcm94eSA9ICQucHJveHkoZnVuY3Rpb24oZSkgeyB0aGlzLm91dHNpZGVDbGljayhlKTsgfSwgdGhpcyk7XG5cbiAgICAgICAgICAgIC8vIEJpbmQgZ2xvYmFsIGRhdGVwaWNrZXIgbW91c2Vkb3duIGZvciBoaWRpbmcgYW5kXG4gICAgICAgICAgICAkKGRvY3VtZW50KVxuICAgICAgICAgICAgICAub24oJ21vdXNlZG93bi5kYXRlcmFuZ2VwaWNrZXInLCB0aGlzLl9vdXRzaWRlQ2xpY2tQcm94eSlcbiAgICAgICAgICAgICAgLy8gYWxzbyBzdXBwb3J0IG1vYmlsZSBkZXZpY2VzXG4gICAgICAgICAgICAgIC5vbigndG91Y2hlbmQuZGF0ZXJhbmdlcGlja2VyJywgdGhpcy5fb3V0c2lkZUNsaWNrUHJveHkpXG4gICAgICAgICAgICAgIC8vIGFsc28gZXhwbGljaXRseSBwbGF5IG5pY2Ugd2l0aCBCb290c3RyYXAgZHJvcGRvd25zLCB3aGljaCBzdG9wUHJvcGFnYXRpb24gd2hlbiBjbGlja2luZyB0aGVtXG4gICAgICAgICAgICAgIC5vbignY2xpY2suZGF0ZXJhbmdlcGlja2VyJywgJ1tkYXRhLXRvZ2dsZT1kcm9wZG93bl0nLCB0aGlzLl9vdXRzaWRlQ2xpY2tQcm94eSlcbiAgICAgICAgICAgICAgLy8gYW5kIGFsc28gY2xvc2Ugd2hlbiBmb2N1cyBjaGFuZ2VzIHRvIG91dHNpZGUgdGhlIHBpY2tlciAoZWcuIHRhYmJpbmcgYmV0d2VlbiBjb250cm9scylcbiAgICAgICAgICAgICAgLm9uKCdmb2N1c2luLmRhdGVyYW5nZXBpY2tlcicsIHRoaXMuX291dHNpZGVDbGlja1Byb3h5KTtcblxuICAgICAgICAgICAgLy8gUmVwb3NpdGlvbiB0aGUgcGlja2VyIGlmIHRoZSB3aW5kb3cgaXMgcmVzaXplZCB3aGlsZSBpdCdzIG9wZW5cbiAgICAgICAgICAgICQod2luZG93KS5vbigncmVzaXplLmRhdGVyYW5nZXBpY2tlcicsICQucHJveHkoZnVuY3Rpb24oZSkgeyB0aGlzLm1vdmUoZSk7IH0sIHRoaXMpKTtcblxuICAgICAgICAgICAgdGhpcy5vbGRTdGFydERhdGUgPSB0aGlzLnN0YXJ0RGF0ZS5jbG9uZSgpO1xuICAgICAgICAgICAgdGhpcy5vbGRFbmREYXRlID0gdGhpcy5lbmREYXRlLmNsb25lKCk7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzUmlnaHRUaW1lID0gdGhpcy5lbmREYXRlLmNsb25lKCk7XG5cbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmlldygpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuc2hvdygpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcignc2hvdy5kYXRlcmFuZ2VwaWNrZXInLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuaXNTaG93aW5nID0gdHJ1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBoaWRlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNTaG93aW5nKSByZXR1cm47XG5cbiAgICAgICAgICAgIC8vaW5jb21wbGV0ZSBkYXRlIHNlbGVjdGlvbiwgcmV2ZXJ0IHRvIGxhc3QgdmFsdWVzXG4gICAgICAgICAgICBpZiAoIXRoaXMuZW5kRGF0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnREYXRlID0gdGhpcy5vbGRTdGFydERhdGUuY2xvbmUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVuZERhdGUgPSB0aGlzLm9sZEVuZERhdGUuY2xvbmUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9pZiBhIG5ldyBkYXRlIHJhbmdlIHdhcyBzZWxlY3RlZCwgaW52b2tlIHRoZSB1c2VyIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhcnREYXRlLmlzU2FtZSh0aGlzLm9sZFN0YXJ0RGF0ZSkgfHwgIXRoaXMuZW5kRGF0ZS5pc1NhbWUodGhpcy5vbGRFbmREYXRlKSlcbiAgICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMuc3RhcnREYXRlLCB0aGlzLmVuZERhdGUsIHRoaXMuY2hvc2VuTGFiZWwpO1xuXG4gICAgICAgICAgICAvL2lmIHBpY2tlciBpcyBhdHRhY2hlZCB0byBhIHRleHQgaW5wdXQsIHVwZGF0ZSBpdFxuICAgICAgICAgICAgdGhpcy51cGRhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignLmRhdGVyYW5nZXBpY2tlcicpO1xuICAgICAgICAgICAgJCh3aW5kb3cpLm9mZignLmRhdGVyYW5nZXBpY2tlcicpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuaGlkZSgpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoJ2hpZGUuZGF0ZXJhbmdlcGlja2VyJywgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLmlzU2hvd2luZyA9IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNTaG93aW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG91dHNpZGVDbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS50YXJnZXQpO1xuICAgICAgICAgICAgLy8gaWYgdGhlIHBhZ2UgaXMgY2xpY2tlZCBhbnl3aGVyZSBleGNlcHQgd2l0aGluIHRoZSBkYXRlcmFuZ2VycGlja2VyL2J1dHRvblxuICAgICAgICAgICAgLy8gaXRzZWxmIHRoZW4gY2FsbCB0aGlzLmhpZGUoKVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIC8vIGllIG1vZGFsIGRpYWxvZyBmaXhcbiAgICAgICAgICAgICAgICBlLnR5cGUgPT0gXCJmb2N1c2luXCIgfHxcbiAgICAgICAgICAgICAgICB0YXJnZXQuY2xvc2VzdCh0aGlzLmVsZW1lbnQpLmxlbmd0aCB8fFxuICAgICAgICAgICAgICAgIHRhcmdldC5jbG9zZXN0KHRoaXMuY29udGFpbmVyKS5sZW5ndGggfHxcbiAgICAgICAgICAgICAgICB0YXJnZXQuY2xvc2VzdCgnLmNhbGVuZGFyLXRhYmxlJykubGVuZ3RoXG4gICAgICAgICAgICAgICAgKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzaG93Q2FsZW5kYXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZENsYXNzKCdzaG93LWNhbGVuZGFyJyk7XG4gICAgICAgICAgICB0aGlzLm1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKCdzaG93Q2FsZW5kYXIuZGF0ZXJhbmdlcGlja2VyJywgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGlkZUNhbGVuZGFyczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5yZW1vdmVDbGFzcygnc2hvdy1jYWxlbmRhcicpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoJ2hpZGVDYWxlbmRhci5kYXRlcmFuZ2VwaWNrZXInLCB0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBob3ZlclJhbmdlOiBmdW5jdGlvbihlKSB7XG5cbiAgICAgICAgICAgIC8vaWdub3JlIG1vdXNlIG1vdmVtZW50cyB3aGlsZSBhbiBhYm92ZS1jYWxlbmRhciB0ZXh0IGlucHV0IGhhcyBmb2N1c1xuICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyLmZpbmQoJ2lucHV0W25hbWU9ZGF0ZXJhbmdlcGlja2VyX3N0YXJ0XScpLmlzKFwiOmZvY3VzXCIpIHx8IHRoaXMuY29udGFpbmVyLmZpbmQoJ2lucHV0W25hbWU9ZGF0ZXJhbmdlcGlja2VyX2VuZF0nKS5pcyhcIjpmb2N1c1wiKSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciBsYWJlbCA9IGUudGFyZ2V0LmlubmVySFRNTDtcbiAgICAgICAgICAgIGlmIChsYWJlbCA9PSB0aGlzLmxvY2FsZS5jdXN0b21SYW5nZUxhYmVsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBkYXRlcyA9IHRoaXMucmFuZ2VzW2xhYmVsXTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5maW5kKCdpbnB1dFtuYW1lPWRhdGVyYW5nZXBpY2tlcl9zdGFydF0nKS52YWwoZGF0ZXNbMF0uZm9ybWF0KHRoaXMubG9jYWxlLmZvcm1hdCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJ2lucHV0W25hbWU9ZGF0ZXJhbmdlcGlja2VyX2VuZF0nKS52YWwoZGF0ZXNbMV0uZm9ybWF0KHRoaXMubG9jYWxlLmZvcm1hdCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xpY2tSYW5nZTogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gZS50YXJnZXQuaW5uZXJIVE1MO1xuICAgICAgICAgICAgdGhpcy5jaG9zZW5MYWJlbCA9IGxhYmVsO1xuICAgICAgICAgICAgaWYgKGxhYmVsID09IHRoaXMubG9jYWxlLmN1c3RvbVJhbmdlTGFiZWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dDYWxlbmRhcnMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGVzID0gdGhpcy5yYW5nZXNbbGFiZWxdO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnREYXRlID0gZGF0ZXNbMF07XG4gICAgICAgICAgICAgICAgdGhpcy5lbmREYXRlID0gZGF0ZXNbMV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudGltZVBpY2tlcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0RGF0ZS5zdGFydE9mKCdkYXknKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbmREYXRlLmVuZE9mKCdkYXknKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuYWx3YXlzU2hvd0NhbGVuZGFycylcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlQ2FsZW5kYXJzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja0FwcGx5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xpY2tQcmV2OiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgY2FsID0gJChlLnRhcmdldCkucGFyZW50cygnLmNhbGVuZGFyJyk7XG4gICAgICAgICAgICBpZiAoY2FsLmhhc0NsYXNzKCdsZWZ0JykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxlZnRDYWxlbmRhci5tb250aC5zdWJ0cmFjdCgxLCAnbW9udGgnKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5saW5rZWRDYWxlbmRhcnMpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmlnaHRDYWxlbmRhci5tb250aC5zdWJ0cmFjdCgxLCAnbW9udGgnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yaWdodENhbGVuZGFyLm1vbnRoLnN1YnRyYWN0KDEsICdtb250aCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy51cGRhdGVDYWxlbmRhcnMoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGlja05leHQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBjYWwgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcuY2FsZW5kYXInKTtcbiAgICAgICAgICAgIGlmIChjYWwuaGFzQ2xhc3MoJ2xlZnQnKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubGVmdENhbGVuZGFyLm1vbnRoLmFkZCgxLCAnbW9udGgnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yaWdodENhbGVuZGFyLm1vbnRoLmFkZCgxLCAnbW9udGgnKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5saW5rZWRDYWxlbmRhcnMpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGVmdENhbGVuZGFyLm1vbnRoLmFkZCgxLCAnbW9udGgnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ2FsZW5kYXJzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaG92ZXJEYXRlOiBmdW5jdGlvbihlKSB7XG5cbiAgICAgICAgICAgIC8vaWdub3JlIG1vdXNlIG1vdmVtZW50cyB3aGlsZSBhbiBhYm92ZS1jYWxlbmRhciB0ZXh0IGlucHV0IGhhcyBmb2N1c1xuICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyLmZpbmQoJ2lucHV0W25hbWU9ZGF0ZXJhbmdlcGlja2VyX3N0YXJ0XScpLmlzKFwiOmZvY3VzXCIpIHx8IHRoaXMuY29udGFpbmVyLmZpbmQoJ2lucHV0W25hbWU9ZGF0ZXJhbmdlcGlja2VyX2VuZF0nKS5pcyhcIjpmb2N1c1wiKSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vaWdub3JlIGRhdGVzIHRoYXQgY2FuJ3QgYmUgc2VsZWN0ZWRcbiAgICAgICAgICAgIGlmICghJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2F2YWlsYWJsZScpKSByZXR1cm47XG5cbiAgICAgICAgICAgIC8vaGF2ZSB0aGUgdGV4dCBpbnB1dHMgYWJvdmUgY2FsZW5kYXJzIHJlZmxlY3QgdGhlIGRhdGUgYmVpbmcgaG92ZXJlZCBvdmVyXG4gICAgICAgICAgICB2YXIgdGl0bGUgPSAkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLXRpdGxlJyk7XG4gICAgICAgICAgICB2YXIgcm93ID0gdGl0bGUuc3Vic3RyKDEsIDEpO1xuICAgICAgICAgICAgdmFyIGNvbCA9IHRpdGxlLnN1YnN0cigzLCAxKTtcbiAgICAgICAgICAgIHZhciBjYWwgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcuY2FsZW5kYXInKTtcbiAgICAgICAgICAgIHZhciBkYXRlID0gY2FsLmhhc0NsYXNzKCdsZWZ0JykgPyB0aGlzLmxlZnRDYWxlbmRhci5jYWxlbmRhcltyb3ddW2NvbF0gOiB0aGlzLnJpZ2h0Q2FsZW5kYXIuY2FsZW5kYXJbcm93XVtjb2xdO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5lbmREYXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnaW5wdXRbbmFtZT1kYXRlcmFuZ2VwaWNrZXJfc3RhcnRdJykudmFsKGRhdGUuZm9ybWF0KHRoaXMubG9jYWxlLmZvcm1hdCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5maW5kKCdpbnB1dFtuYW1lPWRhdGVyYW5nZXBpY2tlcl9lbmRdJykudmFsKGRhdGUuZm9ybWF0KHRoaXMubG9jYWxlLmZvcm1hdCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL2hpZ2hsaWdodCB0aGUgZGF0ZXMgYmV0d2VlbiB0aGUgc3RhcnQgZGF0ZSBhbmQgdGhlIGRhdGUgYmVpbmcgaG92ZXJlZCBhcyBhIHBvdGVudGlhbCBlbmQgZGF0ZVxuICAgICAgICAgICAgdmFyIGxlZnRDYWxlbmRhciA9IHRoaXMubGVmdENhbGVuZGFyO1xuICAgICAgICAgICAgdmFyIHJpZ2h0Q2FsZW5kYXIgPSB0aGlzLnJpZ2h0Q2FsZW5kYXI7XG4gICAgICAgICAgICB2YXIgc3RhcnREYXRlID0gdGhpcy5zdGFydERhdGU7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZW5kRGF0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmZpbmQoJy5jYWxlbmRhciB0ZCcpLmVhY2goZnVuY3Rpb24oaW5kZXgsIGVsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9za2lwIHdlZWsgbnVtYmVycywgb25seSBsb29rIGF0IGRhdGVzXG4gICAgICAgICAgICAgICAgICAgIGlmICgkKGVsKS5oYXNDbGFzcygnd2VlaycpKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRpdGxlID0gJChlbCkuYXR0cignZGF0YS10aXRsZScpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcm93ID0gdGl0bGUuc3Vic3RyKDEsIDEpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29sID0gdGl0bGUuc3Vic3RyKDMsIDEpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FsID0gJChlbCkucGFyZW50cygnLmNhbGVuZGFyJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkdCA9IGNhbC5oYXNDbGFzcygnbGVmdCcpID8gbGVmdENhbGVuZGFyLmNhbGVuZGFyW3Jvd11bY29sXSA6IHJpZ2h0Q2FsZW5kYXIuY2FsZW5kYXJbcm93XVtjb2xdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChkdC5pc0FmdGVyKHN0YXJ0RGF0ZSkgJiYgZHQuaXNCZWZvcmUoZGF0ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoZWwpLmFkZENsYXNzKCdpbi1yYW5nZScpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJChlbCkucmVtb3ZlQ2xhc3MoJ2luLXJhbmdlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xpY2tEYXRlOiBmdW5jdGlvbihlKSB7XG5cbiAgICAgICAgICAgIGlmICghJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2F2YWlsYWJsZScpKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciB0aXRsZSA9ICQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtdGl0bGUnKTtcbiAgICAgICAgICAgIHZhciByb3cgPSB0aXRsZS5zdWJzdHIoMSwgMSk7XG4gICAgICAgICAgICB2YXIgY29sID0gdGl0bGUuc3Vic3RyKDMsIDEpO1xuICAgICAgICAgICAgdmFyIGNhbCA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5jYWxlbmRhcicpO1xuICAgICAgICAgICAgdmFyIGRhdGUgPSBjYWwuaGFzQ2xhc3MoJ2xlZnQnKSA/IHRoaXMubGVmdENhbGVuZGFyLmNhbGVuZGFyW3Jvd11bY29sXSA6IHRoaXMucmlnaHRDYWxlbmRhci5jYWxlbmRhcltyb3ddW2NvbF07XG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGRvIGEgZmV3IHRoaW5nczpcbiAgICAgICAgICAgIC8vICogYWx0ZXJuYXRlIGJldHdlZW4gc2VsZWN0aW5nIGEgc3RhcnQgYW5kIGVuZCBkYXRlIGZvciB0aGUgcmFuZ2UsXG4gICAgICAgICAgICAvLyAqIGlmIHRoZSB0aW1lIHBpY2tlciBpcyBlbmFibGVkLCBhcHBseSB0aGUgaG91ci9taW51dGUvc2Vjb25kIGZyb20gdGhlIHNlbGVjdCBib3hlcyB0byB0aGUgY2xpY2tlZCBkYXRlXG4gICAgICAgICAgICAvLyAqIGlmIGF1dG9hcHBseSBpcyBlbmFibGVkLCBhbmQgYW4gZW5kIGRhdGUgd2FzIGNob3NlbiwgYXBwbHkgdGhlIHNlbGVjdGlvblxuICAgICAgICAgICAgLy8gKiBpZiBzaW5nbGUgZGF0ZSBwaWNrZXIgbW9kZSwgYW5kIHRpbWUgcGlja2VyIGlzbid0IGVuYWJsZWQsIGFwcGx5IHRoZSBzZWxlY3Rpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmVuZERhdGUgfHwgZGF0ZS5pc0JlZm9yZSh0aGlzLnN0YXJ0RGF0ZSwgJ2RheScpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudGltZVBpY2tlcikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaG91ciA9IHBhcnNlSW50KHRoaXMuY29udGFpbmVyLmZpbmQoJy5sZWZ0IC5ob3Vyc2VsZWN0JykudmFsKCksIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnRpbWVQaWNrZXIyNEhvdXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbXBtID0gdGhpcy5jb250YWluZXIuZmluZCgnLmxlZnQgLmFtcG1zZWxlY3QnKS52YWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbXBtID09PSAnUE0nICYmIGhvdXIgPCAxMilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3VyICs9IDEyO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFtcG0gPT09ICdBTScgJiYgaG91ciA9PT0gMTIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG91ciA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1pbnV0ZSA9IHBhcnNlSW50KHRoaXMuY29udGFpbmVyLmZpbmQoJy5sZWZ0IC5taW51dGVzZWxlY3QnKS52YWwoKSwgMTApO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2Vjb25kID0gdGhpcy50aW1lUGlja2VyU2Vjb25kcyA/IHBhcnNlSW50KHRoaXMuY29udGFpbmVyLmZpbmQoJy5sZWZ0IC5zZWNvbmRzZWxlY3QnKS52YWwoKSwgMTApIDogMDtcbiAgICAgICAgICAgICAgICAgICAgZGF0ZSA9IGRhdGUuY2xvbmUoKS5ob3VyKGhvdXIpLm1pbnV0ZShtaW51dGUpLnNlY29uZChzZWNvbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmVuZERhdGUgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhcnREYXRlKGRhdGUuY2xvbmUoKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLmVuZERhdGUgJiYgZGF0ZS5pc0JlZm9yZSh0aGlzLnN0YXJ0RGF0ZSkpIHtcbiAgICAgICAgICAgICAgICAvL3NwZWNpYWwgY2FzZTogY2xpY2tpbmcgdGhlIHNhbWUgZGF0ZSBmb3Igc3RhcnQvZW5kLCBcbiAgICAgICAgICAgICAgICAvL2J1dCB0aGUgdGltZSBvZiB0aGUgZW5kIGRhdGUgaXMgYmVmb3JlIHRoZSBzdGFydCBkYXRlXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRFbmREYXRlKHRoaXMuc3RhcnREYXRlLmNsb25lKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50aW1lUGlja2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBob3VyID0gcGFyc2VJbnQodGhpcy5jb250YWluZXIuZmluZCgnLnJpZ2h0IC5ob3Vyc2VsZWN0JykudmFsKCksIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnRpbWVQaWNrZXIyNEhvdXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbXBtID0gdGhpcy5jb250YWluZXIuZmluZCgnLnJpZ2h0IC5hbXBtc2VsZWN0JykudmFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW1wbSA9PT0gJ1BNJyAmJiBob3VyIDwgMTIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG91ciArPSAxMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbXBtID09PSAnQU0nICYmIGhvdXIgPT09IDEyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdXIgPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBtaW51dGUgPSBwYXJzZUludCh0aGlzLmNvbnRhaW5lci5maW5kKCcucmlnaHQgLm1pbnV0ZXNlbGVjdCcpLnZhbCgpLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWNvbmQgPSB0aGlzLnRpbWVQaWNrZXJTZWNvbmRzID8gcGFyc2VJbnQodGhpcy5jb250YWluZXIuZmluZCgnLnJpZ2h0IC5zZWNvbmRzZWxlY3QnKS52YWwoKSwgMTApIDogMDtcbiAgICAgICAgICAgICAgICAgICAgZGF0ZSA9IGRhdGUuY2xvbmUoKS5ob3VyKGhvdXIpLm1pbnV0ZShtaW51dGUpLnNlY29uZChzZWNvbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNldEVuZERhdGUoZGF0ZS5jbG9uZSgpKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hdXRvQXBwbHkpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlQ2hvc2VuTGFiZWwoKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tBcHBseSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuc2luZ2xlRGF0ZVBpY2tlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RW5kRGF0ZSh0aGlzLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnRpbWVQaWNrZXIpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tBcHBseSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcblxuICAgICAgICB9LFxuXG4gICAgICAgIGNhbGN1bGF0ZUNob3NlbkxhYmVsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgY3VzdG9tUmFuZ2UgPSB0cnVlO1xuICAgICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgICBmb3IgKHZhciByYW5nZSBpbiB0aGlzLnJhbmdlcykge1xuICAgICAgICAgICAgICBpZiAodGhpcy50aW1lUGlja2VyKSB7XG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGFydERhdGUuaXNTYW1lKHRoaXMucmFuZ2VzW3JhbmdlXVswXSkgJiYgdGhpcy5lbmREYXRlLmlzU2FtZSh0aGlzLnJhbmdlc1tyYW5nZV1bMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY3VzdG9tUmFuZ2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNob3NlbkxhYmVsID0gdGhpcy5jb250YWluZXIuZmluZCgnLnJhbmdlcyBsaTplcSgnICsgaSArICcpJykuYWRkQ2xhc3MoJ2FjdGl2ZScpLmh0bWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vaWdub3JlIHRpbWVzIHdoZW4gY29tcGFyaW5nIGRhdGVzIGlmIHRpbWUgcGlja2VyIGlzIG5vdCBlbmFibGVkXG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGFydERhdGUuZm9ybWF0KCdZWVlZLU1NLUREJykgPT0gdGhpcy5yYW5nZXNbcmFuZ2VdWzBdLmZvcm1hdCgnWVlZWS1NTS1ERCcpICYmIHRoaXMuZW5kRGF0ZS5mb3JtYXQoJ1lZWVktTU0tREQnKSA9PSB0aGlzLnJhbmdlc1tyYW5nZV1bMV0uZm9ybWF0KCdZWVlZLU1NLUREJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjdXN0b21SYW5nZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvc2VuTGFiZWwgPSB0aGlzLmNvbnRhaW5lci5maW5kKCcucmFuZ2VzIGxpOmVxKCcgKyBpICsgJyknKS5hZGRDbGFzcygnYWN0aXZlJykuaHRtbCgpO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGN1c3RvbVJhbmdlKSB7XG4gICAgICAgICAgICAgIHRoaXMuY2hvc2VuTGFiZWwgPSB0aGlzLmNvbnRhaW5lci5maW5kKCcucmFuZ2VzIGxpOmxhc3QnKS5hZGRDbGFzcygnYWN0aXZlJykuaHRtbCgpO1xuICAgICAgICAgICAgICB0aGlzLnNob3dDYWxlbmRhcnMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xpY2tBcHBseTogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcignYXBwbHkuZGF0ZXJhbmdlcGlja2VyJywgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xpY2tDYW5jZWw6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnREYXRlID0gdGhpcy5vbGRTdGFydERhdGU7XG4gICAgICAgICAgICB0aGlzLmVuZERhdGUgPSB0aGlzLm9sZEVuZERhdGU7XG4gICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKCdjYW5jZWwuZGF0ZXJhbmdlcGlja2VyJywgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW9udGhPclllYXJDaGFuZ2VkOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgaXNMZWZ0ID0gJChlLnRhcmdldCkuY2xvc2VzdCgnLmNhbGVuZGFyJykuaGFzQ2xhc3MoJ2xlZnQnKSxcbiAgICAgICAgICAgICAgICBsZWZ0T3JSaWdodCA9IGlzTGVmdCA/ICdsZWZ0JyA6ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgY2FsID0gdGhpcy5jb250YWluZXIuZmluZCgnLmNhbGVuZGFyLicrbGVmdE9yUmlnaHQpO1xuXG4gICAgICAgICAgICAvLyBNb250aCBtdXN0IGJlIE51bWJlciBmb3IgbmV3IG1vbWVudCB2ZXJzaW9uc1xuICAgICAgICAgICAgdmFyIG1vbnRoID0gcGFyc2VJbnQoY2FsLmZpbmQoJy5tb250aHNlbGVjdCcpLnZhbCgpLCAxMCk7XG4gICAgICAgICAgICB2YXIgeWVhciA9IGNhbC5maW5kKCcueWVhcnNlbGVjdCcpLnZhbCgpO1xuXG4gICAgICAgICAgICBpZiAoIWlzTGVmdCkge1xuICAgICAgICAgICAgICAgIGlmICh5ZWFyIDwgdGhpcy5zdGFydERhdGUueWVhcigpIHx8ICh5ZWFyID09IHRoaXMuc3RhcnREYXRlLnllYXIoKSAmJiBtb250aCA8IHRoaXMuc3RhcnREYXRlLm1vbnRoKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdGhpcy5zdGFydERhdGUubW9udGgoKTtcbiAgICAgICAgICAgICAgICAgICAgeWVhciA9IHRoaXMuc3RhcnREYXRlLnllYXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm1pbkRhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoeWVhciA8IHRoaXMubWluRGF0ZS55ZWFyKCkgfHwgKHllYXIgPT0gdGhpcy5taW5EYXRlLnllYXIoKSAmJiBtb250aCA8IHRoaXMubWluRGF0ZS5tb250aCgpKSkge1xuICAgICAgICAgICAgICAgICAgICBtb250aCA9IHRoaXMubWluRGF0ZS5tb250aCgpO1xuICAgICAgICAgICAgICAgICAgICB5ZWFyID0gdGhpcy5taW5EYXRlLnllYXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm1heERhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoeWVhciA+IHRoaXMubWF4RGF0ZS55ZWFyKCkgfHwgKHllYXIgPT0gdGhpcy5tYXhEYXRlLnllYXIoKSAmJiBtb250aCA+IHRoaXMubWF4RGF0ZS5tb250aCgpKSkge1xuICAgICAgICAgICAgICAgICAgICBtb250aCA9IHRoaXMubWF4RGF0ZS5tb250aCgpO1xuICAgICAgICAgICAgICAgICAgICB5ZWFyID0gdGhpcy5tYXhEYXRlLnllYXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpc0xlZnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxlZnRDYWxlbmRhci5tb250aC5tb250aChtb250aCkueWVhcih5ZWFyKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5saW5rZWRDYWxlbmRhcnMpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmlnaHRDYWxlbmRhci5tb250aCA9IHRoaXMubGVmdENhbGVuZGFyLm1vbnRoLmNsb25lKCkuYWRkKDEsICdtb250aCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJpZ2h0Q2FsZW5kYXIubW9udGgubW9udGgobW9udGgpLnllYXIoeWVhcik7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGlua2VkQ2FsZW5kYXJzKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxlZnRDYWxlbmRhci5tb250aCA9IHRoaXMucmlnaHRDYWxlbmRhci5tb250aC5jbG9uZSgpLnN1YnRyYWN0KDEsICdtb250aCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy51cGRhdGVDYWxlbmRhcnMoKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0aW1lQ2hhbmdlZDogZnVuY3Rpb24oZSkge1xuXG4gICAgICAgICAgICB2YXIgY2FsID0gJChlLnRhcmdldCkuY2xvc2VzdCgnLmNhbGVuZGFyJyksXG4gICAgICAgICAgICAgICAgaXNMZWZ0ID0gY2FsLmhhc0NsYXNzKCdsZWZ0Jyk7XG5cbiAgICAgICAgICAgIHZhciBob3VyID0gcGFyc2VJbnQoY2FsLmZpbmQoJy5ob3Vyc2VsZWN0JykudmFsKCksIDEwKTtcbiAgICAgICAgICAgIHZhciBtaW51dGUgPSBwYXJzZUludChjYWwuZmluZCgnLm1pbnV0ZXNlbGVjdCcpLnZhbCgpLCAxMCk7XG4gICAgICAgICAgICB2YXIgc2Vjb25kID0gdGhpcy50aW1lUGlja2VyU2Vjb25kcyA/IHBhcnNlSW50KGNhbC5maW5kKCcuc2Vjb25kc2VsZWN0JykudmFsKCksIDEwKSA6IDA7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy50aW1lUGlja2VyMjRIb3VyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFtcG0gPSBjYWwuZmluZCgnLmFtcG1zZWxlY3QnKS52YWwoKTtcbiAgICAgICAgICAgICAgICBpZiAoYW1wbSA9PT0gJ1BNJyAmJiBob3VyIDwgMTIpXG4gICAgICAgICAgICAgICAgICAgIGhvdXIgKz0gMTI7XG4gICAgICAgICAgICAgICAgaWYgKGFtcG0gPT09ICdBTScgJiYgaG91ciA9PT0gMTIpXG4gICAgICAgICAgICAgICAgICAgIGhvdXIgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaXNMZWZ0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gdGhpcy5zdGFydERhdGUuY2xvbmUoKTtcbiAgICAgICAgICAgICAgICBzdGFydC5ob3VyKGhvdXIpO1xuICAgICAgICAgICAgICAgIHN0YXJ0Lm1pbnV0ZShtaW51dGUpO1xuICAgICAgICAgICAgICAgIHN0YXJ0LnNlY29uZChzZWNvbmQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhcnREYXRlKHN0YXJ0KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zaW5nbGVEYXRlUGlja2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW5kRGF0ZSA9IHRoaXMuc3RhcnREYXRlLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmVuZERhdGUgJiYgdGhpcy5lbmREYXRlLmZvcm1hdCgnWVlZWS1NTS1ERCcpID09IHN0YXJ0LmZvcm1hdCgnWVlZWS1NTS1ERCcpICYmIHRoaXMuZW5kRGF0ZS5pc0JlZm9yZShzdGFydCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRFbmREYXRlKHN0YXJ0LmNsb25lKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5lbmREYXRlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVuZCA9IHRoaXMuZW5kRGF0ZS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgIGVuZC5ob3VyKGhvdXIpO1xuICAgICAgICAgICAgICAgIGVuZC5taW51dGUobWludXRlKTtcbiAgICAgICAgICAgICAgICBlbmQuc2Vjb25kKHNlY29uZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRFbmREYXRlKGVuZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vdXBkYXRlIHRoZSBjYWxlbmRhcnMgc28gYWxsIGNsaWNrYWJsZSBkYXRlcyByZWZsZWN0IHRoZSBuZXcgdGltZSBjb21wb25lbnRcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ2FsZW5kYXJzKCk7XG5cbiAgICAgICAgICAgIC8vdXBkYXRlIHRoZSBmb3JtIGlucHV0cyBhYm92ZSB0aGUgY2FsZW5kYXJzIHdpdGggdGhlIG5ldyB0aW1lXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUZvcm1JbnB1dHMoKTtcblxuICAgICAgICAgICAgLy9yZS1yZW5kZXIgdGhlIHRpbWUgcGlja2VycyBiZWNhdXNlIGNoYW5naW5nIG9uZSBzZWxlY3Rpb24gY2FuIGFmZmVjdCB3aGF0J3MgZW5hYmxlZCBpbiBhbm90aGVyXG4gICAgICAgICAgICB0aGlzLnJlbmRlclRpbWVQaWNrZXIoJ2xlZnQnKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyVGltZVBpY2tlcigncmlnaHQnKTtcblxuICAgICAgICB9LFxuXG4gICAgICAgIGZvcm1JbnB1dHNDaGFuZ2VkOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgaXNSaWdodCA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5jYWxlbmRhcicpLmhhc0NsYXNzKCdyaWdodCcpO1xuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gbW9tZW50KHRoaXMuY29udGFpbmVyLmZpbmQoJ2lucHV0W25hbWU9XCJkYXRlcmFuZ2VwaWNrZXJfc3RhcnRcIl0nKS52YWwoKSwgdGhpcy5sb2NhbGUuZm9ybWF0KTtcbiAgICAgICAgICAgIHZhciBlbmQgPSBtb21lbnQodGhpcy5jb250YWluZXIuZmluZCgnaW5wdXRbbmFtZT1cImRhdGVyYW5nZXBpY2tlcl9lbmRcIl0nKS52YWwoKSwgdGhpcy5sb2NhbGUuZm9ybWF0KTtcblxuICAgICAgICAgICAgaWYgKHN0YXJ0LmlzVmFsaWQoKSAmJiBlbmQuaXNWYWxpZCgpKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNSaWdodCAmJiBlbmQuaXNCZWZvcmUoc3RhcnQpKVxuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IGVuZC5jbG9uZSgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGFydERhdGUoc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RW5kRGF0ZShlbmQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzUmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnaW5wdXRbbmFtZT1cImRhdGVyYW5nZXBpY2tlcl9zdGFydFwiXScpLnZhbCh0aGlzLnN0YXJ0RGF0ZS5mb3JtYXQodGhpcy5sb2NhbGUuZm9ybWF0KSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuZmluZCgnaW5wdXRbbmFtZT1cImRhdGVyYW5nZXBpY2tlcl9lbmRcIl0nKS52YWwodGhpcy5lbmREYXRlLmZvcm1hdCh0aGlzLmxvY2FsZS5mb3JtYXQpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy51cGRhdGVDYWxlbmRhcnMoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVQaWNrZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlclRpbWVQaWNrZXIoJ2xlZnQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlclRpbWVQaWNrZXIoJ3JpZ2h0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZWxlbWVudENoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmVsZW1lbnQuaXMoJ2lucHV0JykpIHJldHVybjtcbiAgICAgICAgICAgIGlmICghdGhpcy5lbGVtZW50LnZhbCgpLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudC52YWwoKS5sZW5ndGggPCB0aGlzLmxvY2FsZS5mb3JtYXQubGVuZ3RoKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciBkYXRlU3RyaW5nID0gdGhpcy5lbGVtZW50LnZhbCgpLnNwbGl0KHRoaXMubG9jYWxlLnNlcGFyYXRvciksXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBudWxsLFxuICAgICAgICAgICAgICAgIGVuZCA9IG51bGw7XG5cbiAgICAgICAgICAgIGlmIChkYXRlU3RyaW5nLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgIHN0YXJ0ID0gbW9tZW50KGRhdGVTdHJpbmdbMF0sIHRoaXMubG9jYWxlLmZvcm1hdCk7XG4gICAgICAgICAgICAgICAgZW5kID0gbW9tZW50KGRhdGVTdHJpbmdbMV0sIHRoaXMubG9jYWxlLmZvcm1hdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNpbmdsZURhdGVQaWNrZXIgfHwgc3RhcnQgPT09IG51bGwgfHwgZW5kID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc3RhcnQgPSBtb21lbnQodGhpcy5lbGVtZW50LnZhbCgpLCB0aGlzLmxvY2FsZS5mb3JtYXQpO1xuICAgICAgICAgICAgICAgIGVuZCA9IHN0YXJ0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXN0YXJ0LmlzVmFsaWQoKSB8fCAhZW5kLmlzVmFsaWQoKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICB0aGlzLnNldFN0YXJ0RGF0ZShzdGFydCk7XG4gICAgICAgICAgICB0aGlzLnNldEVuZERhdGUoZW5kKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmlldygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGtleWRvd246IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIC8vaGlkZSBvbiB0YWIgb3IgZW50ZXJcbiAgICAgICAgICAgIGlmICgoZS5rZXlDb2RlID09PSA5KSB8fCAoZS5rZXlDb2RlID09PSAxMykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVFbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnQuaXMoJ2lucHV0JykgJiYgIXRoaXMuc2luZ2xlRGF0ZVBpY2tlciAmJiB0aGlzLmF1dG9VcGRhdGVJbnB1dCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC52YWwodGhpcy5zdGFydERhdGUuZm9ybWF0KHRoaXMubG9jYWxlLmZvcm1hdCkgKyB0aGlzLmxvY2FsZS5zZXBhcmF0b3IgKyB0aGlzLmVuZERhdGUuZm9ybWF0KHRoaXMubG9jYWxlLmZvcm1hdCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5lbGVtZW50LmlzKCdpbnB1dCcpICYmIHRoaXMuYXV0b1VwZGF0ZUlucHV0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnZhbCh0aGlzLnN0YXJ0RGF0ZS5mb3JtYXQodGhpcy5sb2NhbGUuZm9ybWF0KSk7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoJ2NoYW5nZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vZmYoJy5kYXRlcmFuZ2VwaWNrZXInKTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVEYXRhKCk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAkLmZuLmRhdGVyYW5nZXBpY2tlciA9IGZ1bmN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbCA9ICQodGhpcyk7XG4gICAgICAgICAgICBpZiAoZWwuZGF0YSgnZGF0ZXJhbmdlcGlja2VyJykpXG4gICAgICAgICAgICAgICAgZWwuZGF0YSgnZGF0ZXJhbmdlcGlja2VyJykucmVtb3ZlKCk7XG4gICAgICAgICAgICBlbC5kYXRhKCdkYXRlcmFuZ2VwaWNrZXInLCBuZXcgRGF0ZVJhbmdlUGlja2VyKGVsLCBvcHRpb25zLCBjYWxsYmFjaykpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBcbiAgICByZXR1cm4gRGF0ZVJhbmdlUGlja2VyO1xuXG59KSk7XG4iXX0=

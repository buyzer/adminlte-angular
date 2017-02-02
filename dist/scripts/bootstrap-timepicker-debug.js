//TODO: move arrow styles and button click code into configurable items, with defaults matching the existing code

/*!
* Timepicker Component for Twitter Bootstrap
*
* Copyright 2013 Joris de Wit
*
* Contributors https://github.com/jdewit/bootstrap-timepicker/graphs/contributors
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/
(function($, window, document, undefined) {
  'use strict';

  // TIMEPICKER PUBLIC CLASS DEFINITION
  var Timepicker = function(element, options) {
    this.widget = '';
    this.$element = $(element);
    this.defaultTime = options.defaultTime;
    this.disableFocus = options.disableFocus;
    this.isOpen = options.isOpen;
    this.minuteStep = options.minuteStep;
    this.modalBackdrop = options.modalBackdrop;
    this.secondStep = options.secondStep;
    this.showInputs = options.showInputs;
    this.showMeridian = options.showMeridian;
    this.showSeconds = options.showSeconds;
    this.template = options.template;
    this.appendWidgetTo = options.appendWidgetTo;
	this.upArrowStyle = options.upArrowStyle;
	this.downArrowStyle = options.downArrowStyle;
	this.containerClass = options.containerClass;

    this._init();
  };

  Timepicker.prototype = {

    constructor: Timepicker,

    _init: function() {
      var self = this;

      if (this.$element.parent().hasClass('input-append') || this.$element.parent().hasClass('input-prepend')) {
		if (this.$element.parent('.input-append, .input-prepend').find('.add-on').length) {
			this.$element.parent('.input-append, .input-prepend').find('.add-on').on({
			  'click.timepicker': $.proxy(this.showWidget, this)
			});		
		} else {
			this.$element.closest(this.containerClass).find('.add-on').on({
			  'click.timepicker': $.proxy(this.showWidget, this)
			});		
		}
		
        this.$element.on({
          'focus.timepicker': $.proxy(this.highlightUnit, this),
          'click.timepicker': $.proxy(this.highlightUnit, this),
          'keydown.timepicker': $.proxy(this.elementKeydown, this),
          'blur.timepicker': $.proxy(this.blurElement, this)
        });
      } else {
        if (this.template) {
          this.$element.on({
            'focus.timepicker': $.proxy(this.showWidget, this),
            'click.timepicker': $.proxy(this.showWidget, this),
            'blur.timepicker': $.proxy(this.blurElement, this)
          });
        } else {
          this.$element.on({
            'focus.timepicker': $.proxy(this.highlightUnit, this),
            'click.timepicker': $.proxy(this.highlightUnit, this),
            'keydown.timepicker': $.proxy(this.elementKeydown, this),
            'blur.timepicker': $.proxy(this.blurElement, this)
          });
        }
      }

      if (this.template !== false) {
        this.$widget = $(this.getTemplate()).prependTo(this.$element.parents(this.appendWidgetTo)).on('click', $.proxy(this.widgetClick, this));
      } else {
        this.$widget = false;
      }

      if (this.showInputs && this.$widget !== false) {
        this.$widget.find('input').each(function() {
          $(this).on({
            'click.timepicker': function() { $(this).select(); },
            'keydown.timepicker': $.proxy(self.widgetKeydown, self)
          });
        });
      }

      this.setDefaultTime(this.defaultTime);
    },

    blurElement: function() {
      this.highlightedUnit = undefined;
      this.updateFromElementVal();
    },

    decrementHour: function() {
      if (this.showMeridian) {
        if (this.hour === 1) {
          this.hour = 12;
        } else if (this.hour === 12) {
          this.hour--;

          return this.toggleMeridian();
        } else if (this.hour === 0) {
          this.hour = 11;

          return this.toggleMeridian();
        } else {
          this.hour--;
        }
      } else {
        if (this.hour === 0) {
          this.hour = 23;
        } else {
          this.hour--;
        }
      }
      this.update();
    },

    decrementMinute: function(step) {
      var newVal;

      if (step) {
        newVal = this.minute - step;
      } else {
        newVal = this.minute - this.minuteStep;
      }

      if (newVal < 0) {
        this.decrementHour();
        this.minute = newVal + 60;
      } else {
        this.minute = newVal;
      }
      this.update();
    },

    decrementSecond: function() {
      var newVal = this.second - this.secondStep;

      if (newVal < 0) {
        this.decrementMinute(true);
        this.second = newVal + 60;
      } else {
        this.second = newVal;
      }
      this.update();
    },

    elementKeydown: function(e) {
      switch (e.keyCode) {
      case 9: //tab
        this.updateFromElementVal();

        switch (this.highlightedUnit) {
        case 'hour':
          e.preventDefault();
          this.highlightNextUnit();
          break;
        case 'minute':
          if (this.showMeridian || this.showSeconds) {
            e.preventDefault();
            this.highlightNextUnit();
          }
          break;
        case 'second':
          if (this.showMeridian) {
            e.preventDefault();
            this.highlightNextUnit();
          }
          break;
        }
        break;
      case 27: // escape
        this.updateFromElementVal();
        break;
      case 37: // left arrow
        e.preventDefault();
        this.highlightPrevUnit();
        this.updateFromElementVal();
        break;
      case 38: // up arrow
        e.preventDefault();
        switch (this.highlightedUnit) {
        case 'hour':
          this.incrementHour();
          this.highlightHour();
          break;
        case 'minute':
          this.incrementMinute();
          this.highlightMinute();
          break;
        case 'second':
          this.incrementSecond();
          this.highlightSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          this.highlightMeridian();
          break;
        }
        break;
      case 39: // right arrow
        e.preventDefault();
        this.updateFromElementVal();
        this.highlightNextUnit();
        break;
      case 40: // down arrow
        e.preventDefault();
        switch (this.highlightedUnit) {
        case 'hour':
          this.decrementHour();
          this.highlightHour();
          break;
        case 'minute':
          this.decrementMinute();
          this.highlightMinute();
          break;
        case 'second':
          this.decrementSecond();
          this.highlightSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          this.highlightMeridian();
          break;
        }
        break;
      }
    },

    formatTime: function(hour, minute, second, meridian) {
      hour = hour < 10 ? '0' + hour : hour;
      minute = minute < 10 ? '0' + minute : minute;
      second = second < 10 ? '0' + second : second;

      return hour + ':' + minute + (this.showSeconds ? ':' + second : '') + (this.showMeridian ? ' ' + meridian : '');
    },

    getCursorPosition: function() {
      var input = this.$element.get(0);

      if ('selectionStart' in input) {// Standard-compliant browsers

        return input.selectionStart;
      } else if (document.selection) {// IE fix
        input.focus();
        var sel = document.selection.createRange(),
          selLen = document.selection.createRange().text.length;

        sel.moveStart('character', - input.value.length);

        return sel.text.length - selLen;
      }
    },

    getTemplate: function() {
      var template,
        hourTemplate,
        minuteTemplate,
        secondTemplate,
        meridianTemplate,
        templateContent;

      if (this.showInputs) {
        hourTemplate = '<input type="text" name="hour" class="bootstrap-timepicker-hour form-control" maxlength="2"/>';
        minuteTemplate = '<input type="text" name="minute" class="bootstrap-timepicker-minute form-control" maxlength="2"/>';
        secondTemplate = '<input type="text" name="second" class="bootstrap-timepicker-second form-control" maxlength="2"/>';
        meridianTemplate = '<input type="text" name="meridian" class="bootstrap-timepicker-meridian form-control" maxlength="2"/>';
      } else {
        hourTemplate = '<span class="bootstrap-timepicker-hour"></span>';
        minuteTemplate = '<span class="bootstrap-timepicker-minute"></span>';
        secondTemplate = '<span class="bootstrap-timepicker-second"></span>';
        meridianTemplate = '<span class="bootstrap-timepicker-meridian"></span>';
      }

      templateContent = '<table>'+
         '<tr>'+
           '<td><a href="#" data-action="incrementHour"><i class="' + this.upArrowStyle + '"></i></a></td>'+
           '<td class="separator">&nbsp;</td>'+
           '<td><a href="#" data-action="incrementMinute"><i class="' + this.upArrowStyle + '"></i></a></td>'+
           (this.showSeconds ?
             '<td class="separator">&nbsp;</td>'+
             '<td><a href="#" data-action="incrementSecond"><i class="' + this.upArrowStyle + '"></i></a></td>'
           : '') +
           (this.showMeridian ?
             '<td class="separator">&nbsp;</td>'+
             '<td class="meridian-column"><a href="#" data-action="toggleMeridian"><i class="' + this.upArrowStyle + '"></i></a></td>'
           : '') +
         '</tr>'+
         '<tr>'+
           '<td>'+ hourTemplate +'</td> '+
           '<td class="separator">:</td>'+
           '<td>'+ minuteTemplate +'</td> '+
           (this.showSeconds ?
            '<td class="separator">:</td>'+
            '<td>'+ secondTemplate +'</td>'
           : '') +
           (this.showMeridian ?
            '<td class="separator">&nbsp;</td>'+
            '<td>'+ meridianTemplate +'</td>'
           : '') +
         '</tr>'+
         '<tr>'+
           '<td><a href="#" data-action="decrementHour"><i class="' + this.downArrowStyle + '"></i></a></td>'+
           '<td class="separator"></td>'+
           '<td><a href="#" data-action="decrementMinute"><i class="' + this.downArrowStyle + '"></i></a></td>'+
           (this.showSeconds ?
            '<td class="separator">&nbsp;</td>'+
            '<td><a href="#" data-action="decrementSecond"><i class="' + this.downArrowStyle + '"></i></a></td>'
           : '') +
           (this.showMeridian ?
            '<td class="separator">&nbsp;</td>'+
            '<td><a href="#" data-action="toggleMeridian"><i class="' + this.downArrowStyle + '"></i></a></td>'
           : '') +
         '</tr>'+
       '</table>';

      switch(this.template) {
      case 'modal':
        template = '<div class="bootstrap-timepicker-widget modal hide fade in" data-backdrop="'+ (this.modalBackdrop ? 'true' : 'false') +'">'+
          '<div class="modal-header">'+
            '<a href="#" class="close" data-dismiss="modal">×</a>'+
            '<h3>Pick a Time</h3>'+
          '</div>'+
          '<div class="modal-content">'+
            templateContent +
          '</div>'+
          '<div class="modal-footer">'+
            '<a href="#" class="btn btn-primary" data-dismiss="modal">OK</a>'+
          '</div>'+
        '</div>';
        break;
      case 'dropdown':
        template = '<div class="bootstrap-timepicker-widget dropdown-menu">'+ templateContent +'</div>';
        break;
      }

      return template;
    },

    getTime: function() {
      return this.formatTime(this.hour, this.minute, this.second, this.meridian);
    },

    hideWidget: function() {
      if (this.isOpen === false) {
        return;
      }

                        if (this.showInputs) {
                                this.updateFromWidgetInputs();
                        }

      this.$element.trigger({
        'type': 'hide.timepicker',
        'time': {
          'value': this.getTime(),
          'hours': this.hour,
          'minutes': this.minute,
          'seconds': this.second,
          'meridian': this.meridian
        }
      });

      if (this.template === 'modal' && this.$widget.modal) {
        this.$widget.modal('hide');
      } else {
        this.$widget.removeClass('open');
      }

      $(document).off('mousedown.timepicker');

      this.isOpen = false;
    },

    highlightUnit: function() {
      this.position = this.getCursorPosition();
      if (this.position >= 0 && this.position <= 2) {
        this.highlightHour();
      } else if (this.position >= 3 && this.position <= 5) {
        this.highlightMinute();
      } else if (this.position >= 6 && this.position <= 8) {
        if (this.showSeconds) {
          this.highlightSecond();
        } else {
          this.highlightMeridian();
        }
      } else if (this.position >= 9 && this.position <= 11) {
        this.highlightMeridian();
      }
    },

    highlightNextUnit: function() {
      switch (this.highlightedUnit) {
      case 'hour':
        this.highlightMinute();
        break;
      case 'minute':
        if (this.showSeconds) {
          this.highlightSecond();
        } else if (this.showMeridian){
          this.highlightMeridian();
        } else {
          this.highlightHour();
        }
        break;
      case 'second':
        if (this.showMeridian) {
          this.highlightMeridian();
        } else {
          this.highlightHour();
        }
        break;
      case 'meridian':
        this.highlightHour();
        break;
      }
    },

    highlightPrevUnit: function() {
      switch (this.highlightedUnit) {
      case 'hour':
        this.highlightMeridian();
        break;
      case 'minute':
        this.highlightHour();
        break;
      case 'second':
        this.highlightMinute();
        break;
      case 'meridian':
        if (this.showSeconds) {
          this.highlightSecond();
        } else {
          this.highlightMinute();
        }
        break;
      }
    },

    highlightHour: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'hour';

                        if ($element.setSelectionRange) {
                                setTimeout(function() {
                                        $element.setSelectionRange(0,2);
                                }, 0);
                        }
    },

    highlightMinute: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'minute';

                        if ($element.setSelectionRange) {
                                setTimeout(function() {
                                        $element.setSelectionRange(3,5);
                                }, 0);
                        }
    },

    highlightSecond: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'second';

                        if ($element.setSelectionRange) {
                                setTimeout(function() {
                                        $element.setSelectionRange(6,8);
                                }, 0);
                        }
    },

    highlightMeridian: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'meridian';

                        if ($element.setSelectionRange) {
                                if (this.showSeconds) {
                                        setTimeout(function() {
                                                $element.setSelectionRange(9,11);
                                        }, 0);
                                } else {
                                        setTimeout(function() {
                                                $element.setSelectionRange(6,8);
                                        }, 0);
                                }
                        }
    },

    incrementHour: function() {
      if (this.showMeridian) {
        if (this.hour === 11) {
          this.hour++;
          return this.toggleMeridian();
        } else if (this.hour === 12) {
          this.hour = 0;
        }
      }
      if (this.hour === 23) {
        this.hour = 0;

        return;
      }
      this.hour++;
      this.update();
    },

    incrementMinute: function(step) {
      var newVal;

      if (step) {
        newVal = this.minute + step;
      } else {
        newVal = this.minute + this.minuteStep - (this.minute % this.minuteStep);
      }

      if (newVal > 59) {
        this.incrementHour();
        this.minute = newVal - 60;
      } else {
        this.minute = newVal;
      }
      this.update();
    },

    incrementSecond: function() {
      var newVal = this.second + this.secondStep - (this.second % this.secondStep);

      if (newVal > 59) {
        this.incrementMinute(true);
        this.second = newVal - 60;
      } else {
        this.second = newVal;
      }
      this.update();
    },

    remove: function() {
      $('document').off('.timepicker');
      if (this.$widget) {
        this.$widget.remove();
      }
      delete this.$element.data().timepicker;
    },

    setDefaultTime: function(defaultTime){
      if (!this.$element.val()) {
        if (defaultTime === 'current') {
          var dTime = new Date(),
            hours = dTime.getHours(),
            minutes = Math.floor(dTime.getMinutes() / this.minuteStep) * this.minuteStep,
            seconds = Math.floor(dTime.getSeconds() / this.secondStep) * this.secondStep,
            meridian = 'AM';

          if (this.showMeridian) {
            if (hours === 0) {
              hours = 12;
            } else if (hours >= 12) {
              if (hours > 12) {
                hours = hours - 12;
              }
              meridian = 'PM';
            } else {
              meridian = 'AM';
            }
          }

          this.hour = hours;
          this.minute = minutes;
          this.second = seconds;
          this.meridian = meridian;

          this.update();

        } else if (defaultTime === false) {
          this.hour = 0;
          this.minute = 0;
          this.second = 0;
          this.meridian = 'AM';
        } else {
          this.setTime(defaultTime);
        }
      } else {
        this.updateFromElementVal();
      }
    },

    setTime: function(time) {
      var arr,
        timeArray;

      if (this.showMeridian) {
        arr = time.split(' ');
        timeArray = arr[0].split(':');
        this.meridian = arr[1];
      } else {
        timeArray = time.split(':');
      }

      this.hour = parseInt(timeArray[0], 10);
      this.minute = parseInt(timeArray[1], 10);
      this.second = parseInt(timeArray[2], 10);

      if (isNaN(this.hour)) {
        this.hour = 0;
      }
      if (isNaN(this.minute)) {
        this.minute = 0;
      }

      if (this.showMeridian) {
        if (this.hour > 12) {
          this.hour = 12;
        } else if (this.hour < 1) {
          this.hour = 12;
        }

        if (this.meridian === 'am' || this.meridian === 'a') {
          this.meridian = 'AM';
        } else if (this.meridian === 'pm' || this.meridian === 'p') {
          this.meridian = 'PM';
        }

        if (this.meridian !== 'AM' && this.meridian !== 'PM') {
          this.meridian = 'AM';
        }
      } else {
        if (this.hour >= 24) {
          this.hour = 23;
        } else if (this.hour < 0) {
          this.hour = 0;
        }
      }

      if (this.minute < 0) {
        this.minute = 0;
      } else if (this.minute >= 60) {
        this.minute = 59;
      }

      if (this.showSeconds) {
        if (isNaN(this.second)) {
          this.second = 0;
        } else if (this.second < 0) {
          this.second = 0;
        } else if (this.second >= 60) {
          this.second = 59;
        }
      }

      this.update();
    },

    showWidget: function() {
      if (this.isOpen) {
        return;
      }

      if (this.$element.is(':disabled')) {
        return;
      }

      var self = this;
      $(document).on('mousedown.timepicker', function (e) {
        // Clicked outside the timepicker, hide it
        if ($(e.target).closest('.bootstrap-timepicker-widget').length === 0) {
          self.hideWidget();
        }
      });

      this.$element.trigger({
        'type': 'show.timepicker',
        'time': {
          'value': this.getTime(),
          'hours': this.hour,
          'minutes': this.minute,
          'seconds': this.second,
          'meridian': this.meridian
        }
      });

      if (this.disableFocus) {
        this.$element.blur();
      }

      this.updateFromElementVal();

      if (this.template === 'modal' && this.$widget.modal) {
        this.$widget.modal('show').on('hidden', $.proxy(this.hideWidget, this));
      } else {
        if (this.isOpen === false) {
          this.$widget.addClass('open');
        }
      }

      this.isOpen = true;
    },

    toggleMeridian: function() {
      this.meridian = this.meridian === 'AM' ? 'PM' : 'AM';
      this.update();
    },

    update: function() {
      this.$element.trigger({
        'type': 'changeTime.timepicker',
        'time': {
          'value': this.getTime(),
          'hours': this.hour,
          'minutes': this.minute,
          'seconds': this.second,
          'meridian': this.meridian
        }
      });

      this.updateElement();
      this.updateWidget();
    },

    updateElement: function() {
      this.$element.val(this.getTime()).change();
    },

    updateFromElementVal: function() {
                        var val = this.$element.val();

                        if (val) {
                                this.setTime(val);
                        }
    },

    updateWidget: function() {
      if (this.$widget === false) {
        return;
      }

      var hour = this.hour < 10 ? '0' + this.hour : this.hour,
          minute = this.minute < 10 ? '0' + this.minute : this.minute,
          second = this.second < 10 ? '0' + this.second : this.second;

      if (this.showInputs) {
        this.$widget.find('input.bootstrap-timepicker-hour').val(hour);
        this.$widget.find('input.bootstrap-timepicker-minute').val(minute);

        if (this.showSeconds) {
          this.$widget.find('input.bootstrap-timepicker-second').val(second);
        }
        if (this.showMeridian) {
          this.$widget.find('input.bootstrap-timepicker-meridian').val(this.meridian);
        }
      } else {
        this.$widget.find('span.bootstrap-timepicker-hour').text(hour);
        this.$widget.find('span.bootstrap-timepicker-minute').text(minute);

        if (this.showSeconds) {
          this.$widget.find('span.bootstrap-timepicker-second').text(second);
        }
        if (this.showMeridian) {
          this.$widget.find('span.bootstrap-timepicker-meridian').text(this.meridian);
        }
      }
    },

    updateFromWidgetInputs: function() {
      if (this.$widget === false) {
        return;
      }
      var time = $('input.bootstrap-timepicker-hour', this.$widget).val() + ':' +
        $('input.bootstrap-timepicker-minute', this.$widget).val() +
        (this.showSeconds ? ':' + $('input.bootstrap-timepicker-second', this.$widget).val() : '') +
        (this.showMeridian ? ' ' + $('input.bootstrap-timepicker-meridian', this.$widget).val() : '');

      this.setTime(time);
    },

    widgetClick: function(e) {
      e.stopPropagation();
      e.preventDefault();

      var action = $(e.target).closest('a').data('action');
      if (action) {
        this[action]();
      }
    },

    widgetKeydown: function(e) {
      var $input = $(e.target).closest('input'),
          name = $input.attr('name');

      switch (e.keyCode) {
      case 9: //tab
        if (this.showMeridian) {
          if (name === 'meridian') {
            return this.hideWidget();
          }
        } else {
          if (this.showSeconds) {
            if (name === 'second') {
              return this.hideWidget();
            }
          } else {
            if (name === 'minute') {
              return this.hideWidget();
            }
          }
        }

        this.updateFromWidgetInputs();
        break;
      case 27: // escape
        this.hideWidget();
        break;
      case 38: // up arrow
        e.preventDefault();
        switch (name) {
        case 'hour':
          this.incrementHour();
          break;
        case 'minute':
          this.incrementMinute();
          break;
        case 'second':
          this.incrementSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          break;
        }
        break;
      case 40: // down arrow
        e.preventDefault();
        switch (name) {
        case 'hour':
          this.decrementHour();
          break;
        case 'minute':
          this.decrementMinute();
          break;
        case 'second':
          this.decrementSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          break;
        }
        break;
      }
    }
  };


  //TIMEPICKER PLUGIN DEFINITION
  $.fn.timepicker = function(option) {
    var args = Array.apply(null, arguments);
    args.shift();
    return this.each(function() {
      var $this = $(this),
        data = $this.data('timepicker'),
        options = typeof option === 'object' && option;

      if (!data) {
        $this.data('timepicker', (data = new Timepicker(this, $.extend({}, $.fn.timepicker.defaults, options, $(this).data()))));
      }

      if (typeof option === 'string') {
        data[option].apply(data, args);
      }
    });
  };

  $.fn.timepicker.defaults = {
    defaultTime: 'current',
    disableFocus: false,
    isOpen: false,
    minuteStep: 15,
    modalBackdrop: false,
    secondStep: 15,
    showSeconds: false,
    showInputs: true,
    showMeridian: true,
    template: 'dropdown',
    appendWidgetTo: '.bootstrap-timepicker',
	upArrowStyle: 'glyphicon glyphicon-chevron-up',
	downArrowStyle: 'glyphicon glyphicon-chevron-down',
	containerClass: 'bootstrap-timepicker'
  };

  $.fn.timepicker.Constructor = Timepicker;

})(jQuery, window, document);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJvb3RzdHJhcC10aW1lcGlja2VyLmpzIl0sIm5hbWVzIjpbIiQiLCJ3aW5kb3ciLCJkb2N1bWVudCIsInVuZGVmaW5lZCIsIlRpbWVwaWNrZXIiLCJlbGVtZW50Iiwib3B0aW9ucyIsInRoaXMiLCJ3aWRnZXQiLCIkZWxlbWVudCIsImRlZmF1bHRUaW1lIiwiZGlzYWJsZUZvY3VzIiwiaXNPcGVuIiwibWludXRlU3RlcCIsIm1vZGFsQmFja2Ryb3AiLCJzZWNvbmRTdGVwIiwic2hvd0lucHV0cyIsInNob3dNZXJpZGlhbiIsInNob3dTZWNvbmRzIiwidGVtcGxhdGUiLCJhcHBlbmRXaWRnZXRUbyIsInVwQXJyb3dTdHlsZSIsImRvd25BcnJvd1N0eWxlIiwiY29udGFpbmVyQ2xhc3MiLCJfaW5pdCIsInByb3RvdHlwZSIsImNvbnN0cnVjdG9yIiwic2VsZiIsInBhcmVudCIsImhhc0NsYXNzIiwiZmluZCIsImxlbmd0aCIsIm9uIiwiY2xpY2sudGltZXBpY2tlciIsInByb3h5Iiwic2hvd1dpZGdldCIsImNsb3Nlc3QiLCJmb2N1cy50aW1lcGlja2VyIiwiaGlnaGxpZ2h0VW5pdCIsImtleWRvd24udGltZXBpY2tlciIsImVsZW1lbnRLZXlkb3duIiwiYmx1ci50aW1lcGlja2VyIiwiYmx1ckVsZW1lbnQiLCIkd2lkZ2V0IiwiZ2V0VGVtcGxhdGUiLCJwcmVwZW5kVG8iLCJwYXJlbnRzIiwid2lkZ2V0Q2xpY2siLCJlYWNoIiwic2VsZWN0Iiwid2lkZ2V0S2V5ZG93biIsInNldERlZmF1bHRUaW1lIiwiaGlnaGxpZ2h0ZWRVbml0IiwidXBkYXRlRnJvbUVsZW1lbnRWYWwiLCJkZWNyZW1lbnRIb3VyIiwiaG91ciIsInRvZ2dsZU1lcmlkaWFuIiwidXBkYXRlIiwiZGVjcmVtZW50TWludXRlIiwic3RlcCIsIm5ld1ZhbCIsIm1pbnV0ZSIsImRlY3JlbWVudFNlY29uZCIsInNlY29uZCIsImUiLCJrZXlDb2RlIiwicHJldmVudERlZmF1bHQiLCJoaWdobGlnaHROZXh0VW5pdCIsImhpZ2hsaWdodFByZXZVbml0IiwiaW5jcmVtZW50SG91ciIsImhpZ2hsaWdodEhvdXIiLCJpbmNyZW1lbnRNaW51dGUiLCJoaWdobGlnaHRNaW51dGUiLCJpbmNyZW1lbnRTZWNvbmQiLCJoaWdobGlnaHRTZWNvbmQiLCJoaWdobGlnaHRNZXJpZGlhbiIsImZvcm1hdFRpbWUiLCJtZXJpZGlhbiIsImdldEN1cnNvclBvc2l0aW9uIiwiaW5wdXQiLCJnZXQiLCJzZWxlY3Rpb25TdGFydCIsInNlbGVjdGlvbiIsImZvY3VzIiwic2VsIiwiY3JlYXRlUmFuZ2UiLCJzZWxMZW4iLCJ0ZXh0IiwibW92ZVN0YXJ0IiwidmFsdWUiLCJob3VyVGVtcGxhdGUiLCJtaW51dGVUZW1wbGF0ZSIsInNlY29uZFRlbXBsYXRlIiwibWVyaWRpYW5UZW1wbGF0ZSIsInRlbXBsYXRlQ29udGVudCIsImdldFRpbWUiLCJoaWRlV2lkZ2V0IiwidXBkYXRlRnJvbVdpZGdldElucHV0cyIsInRyaWdnZXIiLCJ0eXBlIiwidGltZSIsImhvdXJzIiwibWludXRlcyIsInNlY29uZHMiLCJtb2RhbCIsInJlbW92ZUNsYXNzIiwib2ZmIiwicG9zaXRpb24iLCJzZXRTZWxlY3Rpb25SYW5nZSIsInNldFRpbWVvdXQiLCJyZW1vdmUiLCJkYXRhIiwidGltZXBpY2tlciIsInZhbCIsImRUaW1lIiwiRGF0ZSIsImdldEhvdXJzIiwiTWF0aCIsImZsb29yIiwiZ2V0TWludXRlcyIsImdldFNlY29uZHMiLCJzZXRUaW1lIiwiYXJyIiwidGltZUFycmF5Iiwic3BsaXQiLCJwYXJzZUludCIsImlzTmFOIiwiaXMiLCJ0YXJnZXQiLCJibHVyIiwiYWRkQ2xhc3MiLCJ1cGRhdGVFbGVtZW50IiwidXBkYXRlV2lkZ2V0IiwiY2hhbmdlIiwic3RvcFByb3BhZ2F0aW9uIiwiYWN0aW9uIiwiJGlucHV0IiwibmFtZSIsImF0dHIiLCJmbiIsIm9wdGlvbiIsImFyZ3MiLCJBcnJheSIsImFwcGx5IiwiYXJndW1lbnRzIiwic2hpZnQi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LEtBQ0YsS0FBSyxJQUVILE9BREFRLEVBQUVFLGlCQUNNdUUsR0FDUixJQUFLLE9BQ0hsSSxLQUFLK0MsZUFDTCxNQUNGLEtBQUssU0FDSC9DLEtBQUttRCxpQkFDTCxNQUNGLEtBQUssU0FDSG5ELEtBQUt1RCxpQkFDTCxNQUNGLEtBQUssV0FDSHZELEtBQUtpRCxxQkFVYnhELEVBQUUySSxHQUFHM0IsV0FBYSxTQUFTNEIsR0FDekIsR0FBSUMsR0FBT0MsTUFBTUMsTUFBTSxLQUFNQyxVQUU3QixPQURBSCxHQUFLSSxRQUNFMUksS0FBS3lDLEtBQUssV0FDZixHQUFJa0csR0FBUWxKLEVBQUVPLE1BQ1p3RyxFQUFPbUMsRUFBTW5DLEtBQUssY0FDbEJ6RyxFQUE0QixnQkFBWHNJLElBQXVCQSxDQUVyQzdCLElBQ0htQyxFQUFNbkMsS0FBSyxhQUFlQSxFQUFPLEdBQUkzRyxHQUFXRyxLQUFNUCxFQUFFbUosVUFBV25KLEVBQUUySSxHQUFHM0IsV0FBV29DLFNBQVU5SSxFQUFTTixFQUFFTyxNQUFNd0csVUFHMUYsZ0JBQVg2QixJQUNUN0IsRUFBSzZCLEdBQVFHLE1BQU1oQyxFQUFNOEIsTUFLL0I3SSxFQUFFMkksR0FBRzNCLFdBQVdvQyxVQUNkMUksWUFBYSxVQUNiQyxjQUFjLEVBQ2RDLFFBQVEsRUFDUkMsV0FBWSxHQUNaQyxlQUFlLEVBQ2ZDLFdBQVksR0FDWkcsYUFBYSxFQUNiRixZQUFZLEVBQ1pDLGNBQWMsRUFDZEUsU0FBVSxXQUNWQyxlQUFnQix3QkFDbkJDLGFBQWMsaUNBQ2RDLGVBQWdCLG1DQUNoQkMsZUFBZ0Isd0JBR2Z2QixFQUFFMkksR0FBRzNCLFdBQVdxQyxZQUFjakosR0FFN0JrSixPQUFRckosT0FBUUMiLCJmaWxlIjoiYm9vdHN0cmFwLXRpbWVwaWNrZXItZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvL1RPRE86IG1vdmUgYXJyb3cgc3R5bGVzIGFuZCBidXR0b24gY2xpY2sgY29kZSBpbnRvIGNvbmZpZ3VyYWJsZSBpdGVtcywgd2l0aCBkZWZhdWx0cyBtYXRjaGluZyB0aGUgZXhpc3RpbmcgY29kZVxuXG4vKiFcbiogVGltZXBpY2tlciBDb21wb25lbnQgZm9yIFR3aXR0ZXIgQm9vdHN0cmFwXG4qXG4qIENvcHlyaWdodCAyMDEzIEpvcmlzIGRlIFdpdFxuKlxuKiBDb250cmlidXRvcnMgaHR0cHM6Ly9naXRodWIuY29tL2pkZXdpdC9ib290c3RyYXAtdGltZXBpY2tlci9ncmFwaHMvY29udHJpYnV0b3JzXG4qXG4qIEZvciB0aGUgZnVsbCBjb3B5cmlnaHQgYW5kIGxpY2Vuc2UgaW5mb3JtYXRpb24sIHBsZWFzZSB2aWV3IHRoZSBMSUNFTlNFXG4qIGZpbGUgdGhhdCB3YXMgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHNvdXJjZSBjb2RlLlxuKi9cbihmdW5jdGlvbigkLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIFRJTUVQSUNLRVIgUFVCTElDIENMQVNTIERFRklOSVRJT05cbiAgdmFyIFRpbWVwaWNrZXIgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy53aWRnZXQgPSAnJztcbiAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICB0aGlzLmRlZmF1bHRUaW1lID0gb3B0aW9ucy5kZWZhdWx0VGltZTtcbiAgICB0aGlzLmRpc2FibGVGb2N1cyA9IG9wdGlvbnMuZGlzYWJsZUZvY3VzO1xuICAgIHRoaXMuaXNPcGVuID0gb3B0aW9ucy5pc09wZW47XG4gICAgdGhpcy5taW51dGVTdGVwID0gb3B0aW9ucy5taW51dGVTdGVwO1xuICAgIHRoaXMubW9kYWxCYWNrZHJvcCA9IG9wdGlvbnMubW9kYWxCYWNrZHJvcDtcbiAgICB0aGlzLnNlY29uZFN0ZXAgPSBvcHRpb25zLnNlY29uZFN0ZXA7XG4gICAgdGhpcy5zaG93SW5wdXRzID0gb3B0aW9ucy5zaG93SW5wdXRzO1xuICAgIHRoaXMuc2hvd01lcmlkaWFuID0gb3B0aW9ucy5zaG93TWVyaWRpYW47XG4gICAgdGhpcy5zaG93U2Vjb25kcyA9IG9wdGlvbnMuc2hvd1NlY29uZHM7XG4gICAgdGhpcy50ZW1wbGF0ZSA9IG9wdGlvbnMudGVtcGxhdGU7XG4gICAgdGhpcy5hcHBlbmRXaWRnZXRUbyA9IG9wdGlvbnMuYXBwZW5kV2lkZ2V0VG87XG5cdHRoaXMudXBBcnJvd1N0eWxlID0gb3B0aW9ucy51cEFycm93U3R5bGU7XG5cdHRoaXMuZG93bkFycm93U3R5bGUgPSBvcHRpb25zLmRvd25BcnJvd1N0eWxlO1xuXHR0aGlzLmNvbnRhaW5lckNsYXNzID0gb3B0aW9ucy5jb250YWluZXJDbGFzcztcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgfTtcblxuICBUaW1lcGlja2VyLnByb3RvdHlwZSA9IHtcblxuICAgIGNvbnN0cnVjdG9yOiBUaW1lcGlja2VyLFxuXG4gICAgX2luaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBpZiAodGhpcy4kZWxlbWVudC5wYXJlbnQoKS5oYXNDbGFzcygnaW5wdXQtYXBwZW5kJykgfHwgdGhpcy4kZWxlbWVudC5wYXJlbnQoKS5oYXNDbGFzcygnaW5wdXQtcHJlcGVuZCcpKSB7XG5cdFx0aWYgKHRoaXMuJGVsZW1lbnQucGFyZW50KCcuaW5wdXQtYXBwZW5kLCAuaW5wdXQtcHJlcGVuZCcpLmZpbmQoJy5hZGQtb24nKS5sZW5ndGgpIHtcblx0XHRcdHRoaXMuJGVsZW1lbnQucGFyZW50KCcuaW5wdXQtYXBwZW5kLCAuaW5wdXQtcHJlcGVuZCcpLmZpbmQoJy5hZGQtb24nKS5vbih7XG5cdFx0XHQgICdjbGljay50aW1lcGlja2VyJzogJC5wcm94eSh0aGlzLnNob3dXaWRnZXQsIHRoaXMpXG5cdFx0XHR9KTtcdFx0XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsZW1lbnQuY2xvc2VzdCh0aGlzLmNvbnRhaW5lckNsYXNzKS5maW5kKCcuYWRkLW9uJykub24oe1xuXHRcdFx0ICAnY2xpY2sudGltZXBpY2tlcic6ICQucHJveHkodGhpcy5zaG93V2lkZ2V0LCB0aGlzKVxuXHRcdFx0fSk7XHRcdFxuXHRcdH1cblx0XHRcbiAgICAgICAgdGhpcy4kZWxlbWVudC5vbih7XG4gICAgICAgICAgJ2ZvY3VzLnRpbWVwaWNrZXInOiAkLnByb3h5KHRoaXMuaGlnaGxpZ2h0VW5pdCwgdGhpcyksXG4gICAgICAgICAgJ2NsaWNrLnRpbWVwaWNrZXInOiAkLnByb3h5KHRoaXMuaGlnaGxpZ2h0VW5pdCwgdGhpcyksXG4gICAgICAgICAgJ2tleWRvd24udGltZXBpY2tlcic6ICQucHJveHkodGhpcy5lbGVtZW50S2V5ZG93biwgdGhpcyksXG4gICAgICAgICAgJ2JsdXIudGltZXBpY2tlcic6ICQucHJveHkodGhpcy5ibHVyRWxlbWVudCwgdGhpcylcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy50ZW1wbGF0ZSkge1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgICAgICAgJ2ZvY3VzLnRpbWVwaWNrZXInOiAkLnByb3h5KHRoaXMuc2hvd1dpZGdldCwgdGhpcyksXG4gICAgICAgICAgICAnY2xpY2sudGltZXBpY2tlcic6ICQucHJveHkodGhpcy5zaG93V2lkZ2V0LCB0aGlzKSxcbiAgICAgICAgICAgICdibHVyLnRpbWVwaWNrZXInOiAkLnByb3h5KHRoaXMuYmx1ckVsZW1lbnQsIHRoaXMpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5vbih7XG4gICAgICAgICAgICAnZm9jdXMudGltZXBpY2tlcic6ICQucHJveHkodGhpcy5oaWdobGlnaHRVbml0LCB0aGlzKSxcbiAgICAgICAgICAgICdjbGljay50aW1lcGlja2VyJzogJC5wcm94eSh0aGlzLmhpZ2hsaWdodFVuaXQsIHRoaXMpLFxuICAgICAgICAgICAgJ2tleWRvd24udGltZXBpY2tlcic6ICQucHJveHkodGhpcy5lbGVtZW50S2V5ZG93biwgdGhpcyksXG4gICAgICAgICAgICAnYmx1ci50aW1lcGlja2VyJzogJC5wcm94eSh0aGlzLmJsdXJFbGVtZW50LCB0aGlzKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnRlbXBsYXRlICE9PSBmYWxzZSkge1xuICAgICAgICB0aGlzLiR3aWRnZXQgPSAkKHRoaXMuZ2V0VGVtcGxhdGUoKSkucHJlcGVuZFRvKHRoaXMuJGVsZW1lbnQucGFyZW50cyh0aGlzLmFwcGVuZFdpZGdldFRvKSkub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLndpZGdldENsaWNrLCB0aGlzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiR3aWRnZXQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc2hvd0lucHV0cyAmJiB0aGlzLiR3aWRnZXQgIT09IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuJHdpZGdldC5maW5kKCdpbnB1dCcpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJCh0aGlzKS5vbih7XG4gICAgICAgICAgICAnY2xpY2sudGltZXBpY2tlcic6IGZ1bmN0aW9uKCkgeyAkKHRoaXMpLnNlbGVjdCgpOyB9LFxuICAgICAgICAgICAgJ2tleWRvd24udGltZXBpY2tlcic6ICQucHJveHkoc2VsZi53aWRnZXRLZXlkb3duLCBzZWxmKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zZXREZWZhdWx0VGltZSh0aGlzLmRlZmF1bHRUaW1lKTtcbiAgICB9LFxuXG4gICAgYmx1ckVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5oaWdobGlnaHRlZFVuaXQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLnVwZGF0ZUZyb21FbGVtZW50VmFsKCk7XG4gICAgfSxcblxuICAgIGRlY3JlbWVudEhvdXI6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc2hvd01lcmlkaWFuKSB7XG4gICAgICAgIGlmICh0aGlzLmhvdXIgPT09IDEpIHtcbiAgICAgICAgICB0aGlzLmhvdXIgPSAxMjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhvdXIgPT09IDEyKSB7XG4gICAgICAgICAgdGhpcy5ob3VyLS07XG5cbiAgICAgICAgICByZXR1cm4gdGhpcy50b2dnbGVNZXJpZGlhbigpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaG91ciA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuaG91ciA9IDExO1xuXG4gICAgICAgICAgcmV0dXJuIHRoaXMudG9nZ2xlTWVyaWRpYW4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmhvdXItLTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuaG91ciA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuaG91ciA9IDIzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaG91ci0tO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICBkZWNyZW1lbnRNaW51dGU6IGZ1bmN0aW9uKHN0ZXApIHtcbiAgICAgIHZhciBuZXdWYWw7XG5cbiAgICAgIGlmIChzdGVwKSB7XG4gICAgICAgIG5ld1ZhbCA9IHRoaXMubWludXRlIC0gc3RlcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld1ZhbCA9IHRoaXMubWludXRlIC0gdGhpcy5taW51dGVTdGVwO1xuICAgICAgfVxuXG4gICAgICBpZiAobmV3VmFsIDwgMCkge1xuICAgICAgICB0aGlzLmRlY3JlbWVudEhvdXIoKTtcbiAgICAgICAgdGhpcy5taW51dGUgPSBuZXdWYWwgKyA2MDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubWludXRlID0gbmV3VmFsO1xuICAgICAgfVxuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9LFxuXG4gICAgZGVjcmVtZW50U2Vjb25kOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBuZXdWYWwgPSB0aGlzLnNlY29uZCAtIHRoaXMuc2Vjb25kU3RlcDtcblxuICAgICAgaWYgKG5ld1ZhbCA8IDApIHtcbiAgICAgICAgdGhpcy5kZWNyZW1lbnRNaW51dGUodHJ1ZSk7XG4gICAgICAgIHRoaXMuc2Vjb25kID0gbmV3VmFsICsgNjA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNlY29uZCA9IG5ld1ZhbDtcbiAgICAgIH1cbiAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgfSxcblxuICAgIGVsZW1lbnRLZXlkb3duOiBmdW5jdGlvbihlKSB7XG4gICAgICBzd2l0Y2ggKGUua2V5Q29kZSkge1xuICAgICAgY2FzZSA5OiAvL3RhYlxuICAgICAgICB0aGlzLnVwZGF0ZUZyb21FbGVtZW50VmFsKCk7XG5cbiAgICAgICAgc3dpdGNoICh0aGlzLmhpZ2hsaWdodGVkVW5pdCkge1xuICAgICAgICBjYXNlICdob3VyJzpcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy5oaWdobGlnaHROZXh0VW5pdCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtaW51dGUnOlxuICAgICAgICAgIGlmICh0aGlzLnNob3dNZXJpZGlhbiB8fCB0aGlzLnNob3dTZWNvbmRzKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLmhpZ2hsaWdodE5leHRVbml0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzZWNvbmQnOlxuICAgICAgICAgIGlmICh0aGlzLnNob3dNZXJpZGlhbikge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5oaWdobGlnaHROZXh0VW5pdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjc6IC8vIGVzY2FwZVxuICAgICAgICB0aGlzLnVwZGF0ZUZyb21FbGVtZW50VmFsKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzNzogLy8gbGVmdCBhcnJvd1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0UHJldlVuaXQoKTtcbiAgICAgICAgdGhpcy51cGRhdGVGcm9tRWxlbWVudFZhbCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzg6IC8vIHVwIGFycm93XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc3dpdGNoICh0aGlzLmhpZ2hsaWdodGVkVW5pdCkge1xuICAgICAgICBjYXNlICdob3VyJzpcbiAgICAgICAgICB0aGlzLmluY3JlbWVudEhvdXIoKTtcbiAgICAgICAgICB0aGlzLmhpZ2hsaWdodEhvdXIoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbWludXRlJzpcbiAgICAgICAgICB0aGlzLmluY3JlbWVudE1pbnV0ZSgpO1xuICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0TWludXRlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgICAgICAgdGhpcy5pbmNyZW1lbnRTZWNvbmQoKTtcbiAgICAgICAgICB0aGlzLmhpZ2hsaWdodFNlY29uZCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtZXJpZGlhbic6XG4gICAgICAgICAgdGhpcy50b2dnbGVNZXJpZGlhbigpO1xuICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0TWVyaWRpYW4oKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0IGFycm93XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy51cGRhdGVGcm9tRWxlbWVudFZhbCgpO1xuICAgICAgICB0aGlzLmhpZ2hsaWdodE5leHRVbml0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0MDogLy8gZG93biBhcnJvd1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHN3aXRjaCAodGhpcy5oaWdobGlnaHRlZFVuaXQpIHtcbiAgICAgICAgY2FzZSAnaG91cic6XG4gICAgICAgICAgdGhpcy5kZWNyZW1lbnRIb3VyKCk7XG4gICAgICAgICAgdGhpcy5oaWdobGlnaHRIb3VyKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgICAgICAgdGhpcy5kZWNyZW1lbnRNaW51dGUoKTtcbiAgICAgICAgICB0aGlzLmhpZ2hsaWdodE1pbnV0ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzZWNvbmQnOlxuICAgICAgICAgIHRoaXMuZGVjcmVtZW50U2Vjb25kKCk7XG4gICAgICAgICAgdGhpcy5oaWdobGlnaHRTZWNvbmQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbWVyaWRpYW4nOlxuICAgICAgICAgIHRoaXMudG9nZ2xlTWVyaWRpYW4oKTtcbiAgICAgICAgICB0aGlzLmhpZ2hsaWdodE1lcmlkaWFuKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGZvcm1hdFRpbWU6IGZ1bmN0aW9uKGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtZXJpZGlhbikge1xuICAgICAgaG91ciA9IGhvdXIgPCAxMCA/ICcwJyArIGhvdXIgOiBob3VyO1xuICAgICAgbWludXRlID0gbWludXRlIDwgMTAgPyAnMCcgKyBtaW51dGUgOiBtaW51dGU7XG4gICAgICBzZWNvbmQgPSBzZWNvbmQgPCAxMCA/ICcwJyArIHNlY29uZCA6IHNlY29uZDtcblxuICAgICAgcmV0dXJuIGhvdXIgKyAnOicgKyBtaW51dGUgKyAodGhpcy5zaG93U2Vjb25kcyA/ICc6JyArIHNlY29uZCA6ICcnKSArICh0aGlzLnNob3dNZXJpZGlhbiA/ICcgJyArIG1lcmlkaWFuIDogJycpO1xuICAgIH0sXG5cbiAgICBnZXRDdXJzb3JQb3NpdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaW5wdXQgPSB0aGlzLiRlbGVtZW50LmdldCgwKTtcblxuICAgICAgaWYgKCdzZWxlY3Rpb25TdGFydCcgaW4gaW5wdXQpIHsvLyBTdGFuZGFyZC1jb21wbGlhbnQgYnJvd3NlcnNcblxuICAgICAgICByZXR1cm4gaW5wdXQuc2VsZWN0aW9uU3RhcnQ7XG4gICAgICB9IGVsc2UgaWYgKGRvY3VtZW50LnNlbGVjdGlvbikgey8vIElFIGZpeFxuICAgICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgICB2YXIgc2VsID0gZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCksXG4gICAgICAgICAgc2VsTGVuID0gZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKCkudGV4dC5sZW5ndGg7XG5cbiAgICAgICAgc2VsLm1vdmVTdGFydCgnY2hhcmFjdGVyJywgLSBpbnB1dC52YWx1ZS5sZW5ndGgpO1xuXG4gICAgICAgIHJldHVybiBzZWwudGV4dC5sZW5ndGggLSBzZWxMZW47XG4gICAgICB9XG4gICAgfSxcblxuICAgIGdldFRlbXBsYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0ZW1wbGF0ZSxcbiAgICAgICAgaG91clRlbXBsYXRlLFxuICAgICAgICBtaW51dGVUZW1wbGF0ZSxcbiAgICAgICAgc2Vjb25kVGVtcGxhdGUsXG4gICAgICAgIG1lcmlkaWFuVGVtcGxhdGUsXG4gICAgICAgIHRlbXBsYXRlQ29udGVudDtcblxuICAgICAgaWYgKHRoaXMuc2hvd0lucHV0cykge1xuICAgICAgICBob3VyVGVtcGxhdGUgPSAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgbmFtZT1cImhvdXJcIiBjbGFzcz1cImJvb3RzdHJhcC10aW1lcGlja2VyLWhvdXIgZm9ybS1jb250cm9sXCIgbWF4bGVuZ3RoPVwiMlwiLz4nO1xuICAgICAgICBtaW51dGVUZW1wbGF0ZSA9ICc8aW5wdXQgdHlwZT1cInRleHRcIiBuYW1lPVwibWludXRlXCIgY2xhc3M9XCJib290c3RyYXAtdGltZXBpY2tlci1taW51dGUgZm9ybS1jb250cm9sXCIgbWF4bGVuZ3RoPVwiMlwiLz4nO1xuICAgICAgICBzZWNvbmRUZW1wbGF0ZSA9ICc8aW5wdXQgdHlwZT1cInRleHRcIiBuYW1lPVwic2Vjb25kXCIgY2xhc3M9XCJib290c3RyYXAtdGltZXBpY2tlci1zZWNvbmQgZm9ybS1jb250cm9sXCIgbWF4bGVuZ3RoPVwiMlwiLz4nO1xuICAgICAgICBtZXJpZGlhblRlbXBsYXRlID0gJzxpbnB1dCB0eXBlPVwidGV4dFwiIG5hbWU9XCJtZXJpZGlhblwiIGNsYXNzPVwiYm9vdHN0cmFwLXRpbWVwaWNrZXItbWVyaWRpYW4gZm9ybS1jb250cm9sXCIgbWF4bGVuZ3RoPVwiMlwiLz4nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaG91clRlbXBsYXRlID0gJzxzcGFuIGNsYXNzPVwiYm9vdHN0cmFwLXRpbWVwaWNrZXItaG91clwiPjwvc3Bhbj4nO1xuICAgICAgICBtaW51dGVUZW1wbGF0ZSA9ICc8c3BhbiBjbGFzcz1cImJvb3RzdHJhcC10aW1lcGlja2VyLW1pbnV0ZVwiPjwvc3Bhbj4nO1xuICAgICAgICBzZWNvbmRUZW1wbGF0ZSA9ICc8c3BhbiBjbGFzcz1cImJvb3RzdHJhcC10aW1lcGlja2VyLXNlY29uZFwiPjwvc3Bhbj4nO1xuICAgICAgICBtZXJpZGlhblRlbXBsYXRlID0gJzxzcGFuIGNsYXNzPVwiYm9vdHN0cmFwLXRpbWVwaWNrZXItbWVyaWRpYW5cIj48L3NwYW4+JztcbiAgICAgIH1cblxuICAgICAgdGVtcGxhdGVDb250ZW50ID0gJzx0YWJsZT4nK1xuICAgICAgICAgJzx0cj4nK1xuICAgICAgICAgICAnPHRkPjxhIGhyZWY9XCIjXCIgZGF0YS1hY3Rpb249XCJpbmNyZW1lbnRIb3VyXCI+PGkgY2xhc3M9XCInICsgdGhpcy51cEFycm93U3R5bGUgKyAnXCI+PC9pPjwvYT48L3RkPicrXG4gICAgICAgICAgICc8dGQgY2xhc3M9XCJzZXBhcmF0b3JcIj4mbmJzcDs8L3RkPicrXG4gICAgICAgICAgICc8dGQ+PGEgaHJlZj1cIiNcIiBkYXRhLWFjdGlvbj1cImluY3JlbWVudE1pbnV0ZVwiPjxpIGNsYXNzPVwiJyArIHRoaXMudXBBcnJvd1N0eWxlICsgJ1wiPjwvaT48L2E+PC90ZD4nK1xuICAgICAgICAgICAodGhpcy5zaG93U2Vjb25kcyA/XG4gICAgICAgICAgICAgJzx0ZCBjbGFzcz1cInNlcGFyYXRvclwiPiZuYnNwOzwvdGQ+JytcbiAgICAgICAgICAgICAnPHRkPjxhIGhyZWY9XCIjXCIgZGF0YS1hY3Rpb249XCJpbmNyZW1lbnRTZWNvbmRcIj48aSBjbGFzcz1cIicgKyB0aGlzLnVwQXJyb3dTdHlsZSArICdcIj48L2k+PC9hPjwvdGQ+J1xuICAgICAgICAgICA6ICcnKSArXG4gICAgICAgICAgICh0aGlzLnNob3dNZXJpZGlhbiA/XG4gICAgICAgICAgICAgJzx0ZCBjbGFzcz1cInNlcGFyYXRvclwiPiZuYnNwOzwvdGQ+JytcbiAgICAgICAgICAgICAnPHRkIGNsYXNzPVwibWVyaWRpYW4tY29sdW1uXCI+PGEgaHJlZj1cIiNcIiBkYXRhLWFjdGlvbj1cInRvZ2dsZU1lcmlkaWFuXCI+PGkgY2xhc3M9XCInICsgdGhpcy51cEFycm93U3R5bGUgKyAnXCI+PC9pPjwvYT48L3RkPidcbiAgICAgICAgICAgOiAnJykgK1xuICAgICAgICAgJzwvdHI+JytcbiAgICAgICAgICc8dHI+JytcbiAgICAgICAgICAgJzx0ZD4nKyBob3VyVGVtcGxhdGUgKyc8L3RkPiAnK1xuICAgICAgICAgICAnPHRkIGNsYXNzPVwic2VwYXJhdG9yXCI+OjwvdGQ+JytcbiAgICAgICAgICAgJzx0ZD4nKyBtaW51dGVUZW1wbGF0ZSArJzwvdGQ+ICcrXG4gICAgICAgICAgICh0aGlzLnNob3dTZWNvbmRzID9cbiAgICAgICAgICAgICc8dGQgY2xhc3M9XCJzZXBhcmF0b3JcIj46PC90ZD4nK1xuICAgICAgICAgICAgJzx0ZD4nKyBzZWNvbmRUZW1wbGF0ZSArJzwvdGQ+J1xuICAgICAgICAgICA6ICcnKSArXG4gICAgICAgICAgICh0aGlzLnNob3dNZXJpZGlhbiA/XG4gICAgICAgICAgICAnPHRkIGNsYXNzPVwic2VwYXJhdG9yXCI+Jm5ic3A7PC90ZD4nK1xuICAgICAgICAgICAgJzx0ZD4nKyBtZXJpZGlhblRlbXBsYXRlICsnPC90ZD4nXG4gICAgICAgICAgIDogJycpICtcbiAgICAgICAgICc8L3RyPicrXG4gICAgICAgICAnPHRyPicrXG4gICAgICAgICAgICc8dGQ+PGEgaHJlZj1cIiNcIiBkYXRhLWFjdGlvbj1cImRlY3JlbWVudEhvdXJcIj48aSBjbGFzcz1cIicgKyB0aGlzLmRvd25BcnJvd1N0eWxlICsgJ1wiPjwvaT48L2E+PC90ZD4nK1xuICAgICAgICAgICAnPHRkIGNsYXNzPVwic2VwYXJhdG9yXCI+PC90ZD4nK1xuICAgICAgICAgICAnPHRkPjxhIGhyZWY9XCIjXCIgZGF0YS1hY3Rpb249XCJkZWNyZW1lbnRNaW51dGVcIj48aSBjbGFzcz1cIicgKyB0aGlzLmRvd25BcnJvd1N0eWxlICsgJ1wiPjwvaT48L2E+PC90ZD4nK1xuICAgICAgICAgICAodGhpcy5zaG93U2Vjb25kcyA/XG4gICAgICAgICAgICAnPHRkIGNsYXNzPVwic2VwYXJhdG9yXCI+Jm5ic3A7PC90ZD4nK1xuICAgICAgICAgICAgJzx0ZD48YSBocmVmPVwiI1wiIGRhdGEtYWN0aW9uPVwiZGVjcmVtZW50U2Vjb25kXCI+PGkgY2xhc3M9XCInICsgdGhpcy5kb3duQXJyb3dTdHlsZSArICdcIj48L2k+PC9hPjwvdGQ+J1xuICAgICAgICAgICA6ICcnKSArXG4gICAgICAgICAgICh0aGlzLnNob3dNZXJpZGlhbiA/XG4gICAgICAgICAgICAnPHRkIGNsYXNzPVwic2VwYXJhdG9yXCI+Jm5ic3A7PC90ZD4nK1xuICAgICAgICAgICAgJzx0ZD48YSBocmVmPVwiI1wiIGRhdGEtYWN0aW9uPVwidG9nZ2xlTWVyaWRpYW5cIj48aSBjbGFzcz1cIicgKyB0aGlzLmRvd25BcnJvd1N0eWxlICsgJ1wiPjwvaT48L2E+PC90ZD4nXG4gICAgICAgICAgIDogJycpICtcbiAgICAgICAgICc8L3RyPicrXG4gICAgICAgJzwvdGFibGU+JztcblxuICAgICAgc3dpdGNoKHRoaXMudGVtcGxhdGUpIHtcbiAgICAgIGNhc2UgJ21vZGFsJzpcbiAgICAgICAgdGVtcGxhdGUgPSAnPGRpdiBjbGFzcz1cImJvb3RzdHJhcC10aW1lcGlja2VyLXdpZGdldCBtb2RhbCBoaWRlIGZhZGUgaW5cIiBkYXRhLWJhY2tkcm9wPVwiJysgKHRoaXMubW9kYWxCYWNrZHJvcCA/ICd0cnVlJyA6ICdmYWxzZScpICsnXCI+JytcbiAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1vZGFsLWhlYWRlclwiPicrXG4gICAgICAgICAgICAnPGEgaHJlZj1cIiNcIiBjbGFzcz1cImNsb3NlXCIgZGF0YS1kaXNtaXNzPVwibW9kYWxcIj7DlzwvYT4nK1xuICAgICAgICAgICAgJzxoMz5QaWNrIGEgVGltZTwvaDM+JytcbiAgICAgICAgICAnPC9kaXY+JytcbiAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1vZGFsLWNvbnRlbnRcIj4nK1xuICAgICAgICAgICAgdGVtcGxhdGVDb250ZW50ICtcbiAgICAgICAgICAnPC9kaXY+JytcbiAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1vZGFsLWZvb3RlclwiPicrXG4gICAgICAgICAgICAnPGEgaHJlZj1cIiNcIiBjbGFzcz1cImJ0biBidG4tcHJpbWFyeVwiIGRhdGEtZGlzbWlzcz1cIm1vZGFsXCI+T0s8L2E+JytcbiAgICAgICAgICAnPC9kaXY+JytcbiAgICAgICAgJzwvZGl2Pic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZHJvcGRvd24nOlxuICAgICAgICB0ZW1wbGF0ZSA9ICc8ZGl2IGNsYXNzPVwiYm9vdHN0cmFwLXRpbWVwaWNrZXItd2lkZ2V0IGRyb3Bkb3duLW1lbnVcIj4nKyB0ZW1wbGF0ZUNvbnRlbnQgKyc8L2Rpdj4nO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH0sXG5cbiAgICBnZXRUaW1lOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmZvcm1hdFRpbWUodGhpcy5ob3VyLCB0aGlzLm1pbnV0ZSwgdGhpcy5zZWNvbmQsIHRoaXMubWVyaWRpYW4pO1xuICAgIH0sXG5cbiAgICBoaWRlV2lkZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmlzT3BlbiA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zaG93SW5wdXRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRnJvbVdpZGdldElucHV0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAndHlwZSc6ICdoaWRlLnRpbWVwaWNrZXInLFxuICAgICAgICAndGltZSc6IHtcbiAgICAgICAgICAndmFsdWUnOiB0aGlzLmdldFRpbWUoKSxcbiAgICAgICAgICAnaG91cnMnOiB0aGlzLmhvdXIsXG4gICAgICAgICAgJ21pbnV0ZXMnOiB0aGlzLm1pbnV0ZSxcbiAgICAgICAgICAnc2Vjb25kcyc6IHRoaXMuc2Vjb25kLFxuICAgICAgICAgICdtZXJpZGlhbic6IHRoaXMubWVyaWRpYW5cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLnRlbXBsYXRlID09PSAnbW9kYWwnICYmIHRoaXMuJHdpZGdldC5tb2RhbCkge1xuICAgICAgICB0aGlzLiR3aWRnZXQubW9kYWwoJ2hpZGUnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJHdpZGdldC5yZW1vdmVDbGFzcygnb3BlbicpO1xuICAgICAgfVxuXG4gICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlZG93bi50aW1lcGlja2VyJyk7XG5cbiAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgfSxcblxuICAgIGhpZ2hsaWdodFVuaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb24oKTtcbiAgICAgIGlmICh0aGlzLnBvc2l0aW9uID49IDAgJiYgdGhpcy5wb3NpdGlvbiA8PSAyKSB7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0SG91cigpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnBvc2l0aW9uID49IDMgJiYgdGhpcy5wb3NpdGlvbiA8PSA1KSB7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0TWludXRlKCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMucG9zaXRpb24gPj0gNiAmJiB0aGlzLnBvc2l0aW9uIDw9IDgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2hvd1NlY29uZHMpIHtcbiAgICAgICAgICB0aGlzLmhpZ2hsaWdodFNlY29uZCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0TWVyaWRpYW4oKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLnBvc2l0aW9uID49IDkgJiYgdGhpcy5wb3NpdGlvbiA8PSAxMSkge1xuICAgICAgICB0aGlzLmhpZ2hsaWdodE1lcmlkaWFuKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGhpZ2hsaWdodE5leHRVbml0OiBmdW5jdGlvbigpIHtcbiAgICAgIHN3aXRjaCAodGhpcy5oaWdobGlnaHRlZFVuaXQpIHtcbiAgICAgIGNhc2UgJ2hvdXInOlxuICAgICAgICB0aGlzLmhpZ2hsaWdodE1pbnV0ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgICAgIGlmICh0aGlzLnNob3dTZWNvbmRzKSB7XG4gICAgICAgICAgdGhpcy5oaWdobGlnaHRTZWNvbmQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnNob3dNZXJpZGlhbil7XG4gICAgICAgICAgdGhpcy5oaWdobGlnaHRNZXJpZGlhbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0SG91cigpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc2Vjb25kJzpcbiAgICAgICAgaWYgKHRoaXMuc2hvd01lcmlkaWFuKSB7XG4gICAgICAgICAgdGhpcy5oaWdobGlnaHRNZXJpZGlhbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0SG91cigpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbWVyaWRpYW4nOlxuICAgICAgICB0aGlzLmhpZ2hsaWdodEhvdXIoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGhpZ2hsaWdodFByZXZVbml0OiBmdW5jdGlvbigpIHtcbiAgICAgIHN3aXRjaCAodGhpcy5oaWdobGlnaHRlZFVuaXQpIHtcbiAgICAgIGNhc2UgJ2hvdXInOlxuICAgICAgICB0aGlzLmhpZ2hsaWdodE1lcmlkaWFuKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbWludXRlJzpcbiAgICAgICAgdGhpcy5oaWdobGlnaHRIb3VyKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc2Vjb25kJzpcbiAgICAgICAgdGhpcy5oaWdobGlnaHRNaW51dGUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtZXJpZGlhbic6XG4gICAgICAgIGlmICh0aGlzLnNob3dTZWNvbmRzKSB7XG4gICAgICAgICAgdGhpcy5oaWdobGlnaHRTZWNvbmQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmhpZ2hsaWdodE1pbnV0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBoaWdobGlnaHRIb3VyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkZWxlbWVudCA9IHRoaXMuJGVsZW1lbnQuZ2V0KDApO1xuXG4gICAgICB0aGlzLmhpZ2hsaWdodGVkVW5pdCA9ICdob3VyJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRlbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UoMCwyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgfSxcblxuICAgIGhpZ2hsaWdodE1pbnV0ZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzLiRlbGVtZW50LmdldCgwKTtcblxuICAgICAgdGhpcy5oaWdobGlnaHRlZFVuaXQgPSAnbWludXRlJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRlbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UoMyw1KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgfSxcblxuICAgIGhpZ2hsaWdodFNlY29uZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJGVsZW1lbnQgPSB0aGlzLiRlbGVtZW50LmdldCgwKTtcblxuICAgICAgdGhpcy5oaWdobGlnaHRlZFVuaXQgPSAnc2Vjb25kJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRlbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UoNiw4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgfSxcblxuICAgIGhpZ2hsaWdodE1lcmlkaWFuOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkZWxlbWVudCA9IHRoaXMuJGVsZW1lbnQuZ2V0KDApO1xuXG4gICAgICB0aGlzLmhpZ2hsaWdodGVkVW5pdCA9ICdtZXJpZGlhbic7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkZWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zaG93U2Vjb25kcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZSg5LDExKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UoNiw4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbmNyZW1lbnRIb3VyOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnNob3dNZXJpZGlhbikge1xuICAgICAgICBpZiAodGhpcy5ob3VyID09PSAxMSkge1xuICAgICAgICAgIHRoaXMuaG91cisrO1xuICAgICAgICAgIHJldHVybiB0aGlzLnRvZ2dsZU1lcmlkaWFuKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ob3VyID09PSAxMikge1xuICAgICAgICAgIHRoaXMuaG91ciA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmhvdXIgPT09IDIzKSB7XG4gICAgICAgIHRoaXMuaG91ciA9IDA7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5ob3VyKys7XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICBpbmNyZW1lbnRNaW51dGU6IGZ1bmN0aW9uKHN0ZXApIHtcbiAgICAgIHZhciBuZXdWYWw7XG5cbiAgICAgIGlmIChzdGVwKSB7XG4gICAgICAgIG5ld1ZhbCA9IHRoaXMubWludXRlICsgc3RlcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld1ZhbCA9IHRoaXMubWludXRlICsgdGhpcy5taW51dGVTdGVwIC0gKHRoaXMubWludXRlICUgdGhpcy5taW51dGVTdGVwKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5ld1ZhbCA+IDU5KSB7XG4gICAgICAgIHRoaXMuaW5jcmVtZW50SG91cigpO1xuICAgICAgICB0aGlzLm1pbnV0ZSA9IG5ld1ZhbCAtIDYwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5taW51dGUgPSBuZXdWYWw7XG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICBpbmNyZW1lbnRTZWNvbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5ld1ZhbCA9IHRoaXMuc2Vjb25kICsgdGhpcy5zZWNvbmRTdGVwIC0gKHRoaXMuc2Vjb25kICUgdGhpcy5zZWNvbmRTdGVwKTtcblxuICAgICAgaWYgKG5ld1ZhbCA+IDU5KSB7XG4gICAgICAgIHRoaXMuaW5jcmVtZW50TWludXRlKHRydWUpO1xuICAgICAgICB0aGlzLnNlY29uZCA9IG5ld1ZhbCAtIDYwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZWNvbmQgPSBuZXdWYWw7XG4gICAgICB9XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgJCgnZG9jdW1lbnQnKS5vZmYoJy50aW1lcGlja2VyJyk7XG4gICAgICBpZiAodGhpcy4kd2lkZ2V0KSB7XG4gICAgICAgIHRoaXMuJHdpZGdldC5yZW1vdmUoKTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSB0aGlzLiRlbGVtZW50LmRhdGEoKS50aW1lcGlja2VyO1xuICAgIH0sXG5cbiAgICBzZXREZWZhdWx0VGltZTogZnVuY3Rpb24oZGVmYXVsdFRpbWUpe1xuICAgICAgaWYgKCF0aGlzLiRlbGVtZW50LnZhbCgpKSB7XG4gICAgICAgIGlmIChkZWZhdWx0VGltZSA9PT0gJ2N1cnJlbnQnKSB7XG4gICAgICAgICAgdmFyIGRUaW1lID0gbmV3IERhdGUoKSxcbiAgICAgICAgICAgIGhvdXJzID0gZFRpbWUuZ2V0SG91cnMoKSxcbiAgICAgICAgICAgIG1pbnV0ZXMgPSBNYXRoLmZsb29yKGRUaW1lLmdldE1pbnV0ZXMoKSAvIHRoaXMubWludXRlU3RlcCkgKiB0aGlzLm1pbnV0ZVN0ZXAsXG4gICAgICAgICAgICBzZWNvbmRzID0gTWF0aC5mbG9vcihkVGltZS5nZXRTZWNvbmRzKCkgLyB0aGlzLnNlY29uZFN0ZXApICogdGhpcy5zZWNvbmRTdGVwLFxuICAgICAgICAgICAgbWVyaWRpYW4gPSAnQU0nO1xuXG4gICAgICAgICAgaWYgKHRoaXMuc2hvd01lcmlkaWFuKSB7XG4gICAgICAgICAgICBpZiAoaG91cnMgPT09IDApIHtcbiAgICAgICAgICAgICAgaG91cnMgPSAxMjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaG91cnMgPj0gMTIpIHtcbiAgICAgICAgICAgICAgaWYgKGhvdXJzID4gMTIpIHtcbiAgICAgICAgICAgICAgICBob3VycyA9IGhvdXJzIC0gMTI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbWVyaWRpYW4gPSAnUE0nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbWVyaWRpYW4gPSAnQU0nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuaG91ciA9IGhvdXJzO1xuICAgICAgICAgIHRoaXMubWludXRlID0gbWludXRlcztcbiAgICAgICAgICB0aGlzLnNlY29uZCA9IHNlY29uZHM7XG4gICAgICAgICAgdGhpcy5tZXJpZGlhbiA9IG1lcmlkaWFuO1xuXG4gICAgICAgICAgdGhpcy51cGRhdGUoKTtcblxuICAgICAgICB9IGVsc2UgaWYgKGRlZmF1bHRUaW1lID09PSBmYWxzZSkge1xuICAgICAgICAgIHRoaXMuaG91ciA9IDA7XG4gICAgICAgICAgdGhpcy5taW51dGUgPSAwO1xuICAgICAgICAgIHRoaXMuc2Vjb25kID0gMDtcbiAgICAgICAgICB0aGlzLm1lcmlkaWFuID0gJ0FNJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnNldFRpbWUoZGVmYXVsdFRpbWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwZGF0ZUZyb21FbGVtZW50VmFsKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHNldFRpbWU6IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgIHZhciBhcnIsXG4gICAgICAgIHRpbWVBcnJheTtcblxuICAgICAgaWYgKHRoaXMuc2hvd01lcmlkaWFuKSB7XG4gICAgICAgIGFyciA9IHRpbWUuc3BsaXQoJyAnKTtcbiAgICAgICAgdGltZUFycmF5ID0gYXJyWzBdLnNwbGl0KCc6Jyk7XG4gICAgICAgIHRoaXMubWVyaWRpYW4gPSBhcnJbMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aW1lQXJyYXkgPSB0aW1lLnNwbGl0KCc6Jyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuaG91ciA9IHBhcnNlSW50KHRpbWVBcnJheVswXSwgMTApO1xuICAgICAgdGhpcy5taW51dGUgPSBwYXJzZUludCh0aW1lQXJyYXlbMV0sIDEwKTtcbiAgICAgIHRoaXMuc2Vjb25kID0gcGFyc2VJbnQodGltZUFycmF5WzJdLCAxMCk7XG5cbiAgICAgIGlmIChpc05hTih0aGlzLmhvdXIpKSB7XG4gICAgICAgIHRoaXMuaG91ciA9IDA7XG4gICAgICB9XG4gICAgICBpZiAoaXNOYU4odGhpcy5taW51dGUpKSB7XG4gICAgICAgIHRoaXMubWludXRlID0gMDtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc2hvd01lcmlkaWFuKSB7XG4gICAgICAgIGlmICh0aGlzLmhvdXIgPiAxMikge1xuICAgICAgICAgIHRoaXMuaG91ciA9IDEyO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaG91ciA8IDEpIHtcbiAgICAgICAgICB0aGlzLmhvdXIgPSAxMjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm1lcmlkaWFuID09PSAnYW0nIHx8IHRoaXMubWVyaWRpYW4gPT09ICdhJykge1xuICAgICAgICAgIHRoaXMubWVyaWRpYW4gPSAnQU0nO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubWVyaWRpYW4gPT09ICdwbScgfHwgdGhpcy5tZXJpZGlhbiA9PT0gJ3AnKSB7XG4gICAgICAgICAgdGhpcy5tZXJpZGlhbiA9ICdQTSc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5tZXJpZGlhbiAhPT0gJ0FNJyAmJiB0aGlzLm1lcmlkaWFuICE9PSAnUE0nKSB7XG4gICAgICAgICAgdGhpcy5tZXJpZGlhbiA9ICdBTSc7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLmhvdXIgPj0gMjQpIHtcbiAgICAgICAgICB0aGlzLmhvdXIgPSAyMztcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhvdXIgPCAwKSB7XG4gICAgICAgICAgdGhpcy5ob3VyID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5taW51dGUgPCAwKSB7XG4gICAgICAgIHRoaXMubWludXRlID0gMDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5taW51dGUgPj0gNjApIHtcbiAgICAgICAgdGhpcy5taW51dGUgPSA1OTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc2hvd1NlY29uZHMpIHtcbiAgICAgICAgaWYgKGlzTmFOKHRoaXMuc2Vjb25kKSkge1xuICAgICAgICAgIHRoaXMuc2Vjb25kID0gMDtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnNlY29uZCA8IDApIHtcbiAgICAgICAgICB0aGlzLnNlY29uZCA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zZWNvbmQgPj0gNjApIHtcbiAgICAgICAgICB0aGlzLnNlY29uZCA9IDU5O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgfSxcblxuICAgIHNob3dXaWRnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuJGVsZW1lbnQuaXMoJzpkaXNhYmxlZCcpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgJChkb2N1bWVudCkub24oJ21vdXNlZG93bi50aW1lcGlja2VyJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgLy8gQ2xpY2tlZCBvdXRzaWRlIHRoZSB0aW1lcGlja2VyLCBoaWRlIGl0XG4gICAgICAgIGlmICgkKGUudGFyZ2V0KS5jbG9zZXN0KCcuYm9vdHN0cmFwLXRpbWVwaWNrZXItd2lkZ2V0JykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgc2VsZi5oaWRlV2lkZ2V0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAndHlwZSc6ICdzaG93LnRpbWVwaWNrZXInLFxuICAgICAgICAndGltZSc6IHtcbiAgICAgICAgICAndmFsdWUnOiB0aGlzLmdldFRpbWUoKSxcbiAgICAgICAgICAnaG91cnMnOiB0aGlzLmhvdXIsXG4gICAgICAgICAgJ21pbnV0ZXMnOiB0aGlzLm1pbnV0ZSxcbiAgICAgICAgICAnc2Vjb25kcyc6IHRoaXMuc2Vjb25kLFxuICAgICAgICAgICdtZXJpZGlhbic6IHRoaXMubWVyaWRpYW5cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLmRpc2FibGVGb2N1cykge1xuICAgICAgICB0aGlzLiRlbGVtZW50LmJsdXIoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy51cGRhdGVGcm9tRWxlbWVudFZhbCgpO1xuXG4gICAgICBpZiAodGhpcy50ZW1wbGF0ZSA9PT0gJ21vZGFsJyAmJiB0aGlzLiR3aWRnZXQubW9kYWwpIHtcbiAgICAgICAgdGhpcy4kd2lkZ2V0Lm1vZGFsKCdzaG93Jykub24oJ2hpZGRlbicsICQucHJveHkodGhpcy5oaWRlV2lkZ2V0LCB0aGlzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5pc09wZW4gPT09IGZhbHNlKSB7XG4gICAgICAgICAgdGhpcy4kd2lkZ2V0LmFkZENsYXNzKCdvcGVuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xuICAgIH0sXG5cbiAgICB0b2dnbGVNZXJpZGlhbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLm1lcmlkaWFuID0gdGhpcy5tZXJpZGlhbiA9PT0gJ0FNJyA/ICdQTScgOiAnQU0nO1xuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcih7XG4gICAgICAgICd0eXBlJzogJ2NoYW5nZVRpbWUudGltZXBpY2tlcicsXG4gICAgICAgICd0aW1lJzoge1xuICAgICAgICAgICd2YWx1ZSc6IHRoaXMuZ2V0VGltZSgpLFxuICAgICAgICAgICdob3Vycyc6IHRoaXMuaG91cixcbiAgICAgICAgICAnbWludXRlcyc6IHRoaXMubWludXRlLFxuICAgICAgICAgICdzZWNvbmRzJzogdGhpcy5zZWNvbmQsXG4gICAgICAgICAgJ21lcmlkaWFuJzogdGhpcy5tZXJpZGlhblxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdGhpcy51cGRhdGVFbGVtZW50KCk7XG4gICAgICB0aGlzLnVwZGF0ZVdpZGdldCgpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVFbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQudmFsKHRoaXMuZ2V0VGltZSgpKS5jaGFuZ2UoKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlRnJvbUVsZW1lbnRWYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IHRoaXMuJGVsZW1lbnQudmFsKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRUaW1lKHZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgfSxcblxuICAgIHVwZGF0ZVdpZGdldDogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy4kd2lkZ2V0ID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBob3VyID0gdGhpcy5ob3VyIDwgMTAgPyAnMCcgKyB0aGlzLmhvdXIgOiB0aGlzLmhvdXIsXG4gICAgICAgICAgbWludXRlID0gdGhpcy5taW51dGUgPCAxMCA/ICcwJyArIHRoaXMubWludXRlIDogdGhpcy5taW51dGUsXG4gICAgICAgICAgc2Vjb25kID0gdGhpcy5zZWNvbmQgPCAxMCA/ICcwJyArIHRoaXMuc2Vjb25kIDogdGhpcy5zZWNvbmQ7XG5cbiAgICAgIGlmICh0aGlzLnNob3dJbnB1dHMpIHtcbiAgICAgICAgdGhpcy4kd2lkZ2V0LmZpbmQoJ2lucHV0LmJvb3RzdHJhcC10aW1lcGlja2VyLWhvdXInKS52YWwoaG91cik7XG4gICAgICAgIHRoaXMuJHdpZGdldC5maW5kKCdpbnB1dC5ib290c3RyYXAtdGltZXBpY2tlci1taW51dGUnKS52YWwobWludXRlKTtcblxuICAgICAgICBpZiAodGhpcy5zaG93U2Vjb25kcykge1xuICAgICAgICAgIHRoaXMuJHdpZGdldC5maW5kKCdpbnB1dC5ib290c3RyYXAtdGltZXBpY2tlci1zZWNvbmQnKS52YWwoc2Vjb25kKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zaG93TWVyaWRpYW4pIHtcbiAgICAgICAgICB0aGlzLiR3aWRnZXQuZmluZCgnaW5wdXQuYm9vdHN0cmFwLXRpbWVwaWNrZXItbWVyaWRpYW4nKS52YWwodGhpcy5tZXJpZGlhbik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJHdpZGdldC5maW5kKCdzcGFuLmJvb3RzdHJhcC10aW1lcGlja2VyLWhvdXInKS50ZXh0KGhvdXIpO1xuICAgICAgICB0aGlzLiR3aWRnZXQuZmluZCgnc3Bhbi5ib290c3RyYXAtdGltZXBpY2tlci1taW51dGUnKS50ZXh0KG1pbnV0ZSk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2hvd1NlY29uZHMpIHtcbiAgICAgICAgICB0aGlzLiR3aWRnZXQuZmluZCgnc3Bhbi5ib290c3RyYXAtdGltZXBpY2tlci1zZWNvbmQnKS50ZXh0KHNlY29uZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc2hvd01lcmlkaWFuKSB7XG4gICAgICAgICAgdGhpcy4kd2lkZ2V0LmZpbmQoJ3NwYW4uYm9vdHN0cmFwLXRpbWVwaWNrZXItbWVyaWRpYW4nKS50ZXh0KHRoaXMubWVyaWRpYW4pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIHVwZGF0ZUZyb21XaWRnZXRJbnB1dHM6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuJHdpZGdldCA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIHRpbWUgPSAkKCdpbnB1dC5ib290c3RyYXAtdGltZXBpY2tlci1ob3VyJywgdGhpcy4kd2lkZ2V0KS52YWwoKSArICc6JyArXG4gICAgICAgICQoJ2lucHV0LmJvb3RzdHJhcC10aW1lcGlja2VyLW1pbnV0ZScsIHRoaXMuJHdpZGdldCkudmFsKCkgK1xuICAgICAgICAodGhpcy5zaG93U2Vjb25kcyA/ICc6JyArICQoJ2lucHV0LmJvb3RzdHJhcC10aW1lcGlja2VyLXNlY29uZCcsIHRoaXMuJHdpZGdldCkudmFsKCkgOiAnJykgK1xuICAgICAgICAodGhpcy5zaG93TWVyaWRpYW4gPyAnICcgKyAkKCdpbnB1dC5ib290c3RyYXAtdGltZXBpY2tlci1tZXJpZGlhbicsIHRoaXMuJHdpZGdldCkudmFsKCkgOiAnJyk7XG5cbiAgICAgIHRoaXMuc2V0VGltZSh0aW1lKTtcbiAgICB9LFxuXG4gICAgd2lkZ2V0Q2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIHZhciBhY3Rpb24gPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCdhJykuZGF0YSgnYWN0aW9uJyk7XG4gICAgICBpZiAoYWN0aW9uKSB7XG4gICAgICAgIHRoaXNbYWN0aW9uXSgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB3aWRnZXRLZXlkb3duOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJGlucHV0ID0gJChlLnRhcmdldCkuY2xvc2VzdCgnaW5wdXQnKSxcbiAgICAgICAgICBuYW1lID0gJGlucHV0LmF0dHIoJ25hbWUnKTtcblxuICAgICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICAgIGNhc2UgOTogLy90YWJcbiAgICAgICAgaWYgKHRoaXMuc2hvd01lcmlkaWFuKSB7XG4gICAgICAgICAgaWYgKG5hbWUgPT09ICdtZXJpZGlhbicpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhpZGVXaWRnZXQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHRoaXMuc2hvd1NlY29uZHMpIHtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSAnc2Vjb25kJykge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oaWRlV2lkZ2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSAnbWludXRlJykge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oaWRlV2lkZ2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVGcm9tV2lkZ2V0SW5wdXRzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyNzogLy8gZXNjYXBlXG4gICAgICAgIHRoaXMuaGlkZVdpZGdldCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzg6IC8vIHVwIGFycm93XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ2hvdXInOlxuICAgICAgICAgIHRoaXMuaW5jcmVtZW50SG91cigpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtaW51dGUnOlxuICAgICAgICAgIHRoaXMuaW5jcmVtZW50TWludXRlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgICAgICAgdGhpcy5pbmNyZW1lbnRTZWNvbmQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbWVyaWRpYW4nOlxuICAgICAgICAgIHRoaXMudG9nZ2xlTWVyaWRpYW4oKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNDA6IC8vIGRvd24gYXJyb3dcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgY2FzZSAnaG91cic6XG4gICAgICAgICAgdGhpcy5kZWNyZW1lbnRIb3VyKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgICAgICAgdGhpcy5kZWNyZW1lbnRNaW51dGUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc2Vjb25kJzpcbiAgICAgICAgICB0aGlzLmRlY3JlbWVudFNlY29uZCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtZXJpZGlhbic6XG4gICAgICAgICAgdGhpcy50b2dnbGVNZXJpZGlhbigpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuXG4gIC8vVElNRVBJQ0tFUiBQTFVHSU4gREVGSU5JVElPTlxuICAkLmZuLnRpbWVwaWNrZXIgPSBmdW5jdGlvbihvcHRpb24pIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgYXJncy5zaGlmdCgpO1xuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxuICAgICAgICBkYXRhID0gJHRoaXMuZGF0YSgndGltZXBpY2tlcicpLFxuICAgICAgICBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PT0gJ29iamVjdCcgJiYgb3B0aW9uO1xuXG4gICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgJHRoaXMuZGF0YSgndGltZXBpY2tlcicsIChkYXRhID0gbmV3IFRpbWVwaWNrZXIodGhpcywgJC5leHRlbmQoe30sICQuZm4udGltZXBpY2tlci5kZWZhdWx0cywgb3B0aW9ucywgJCh0aGlzKS5kYXRhKCkpKSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZGF0YVtvcHRpb25dLmFwcGx5KGRhdGEsIGFyZ3MpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gICQuZm4udGltZXBpY2tlci5kZWZhdWx0cyA9IHtcbiAgICBkZWZhdWx0VGltZTogJ2N1cnJlbnQnLFxuICAgIGRpc2FibGVGb2N1czogZmFsc2UsXG4gICAgaXNPcGVuOiBmYWxzZSxcbiAgICBtaW51dGVTdGVwOiAxNSxcbiAgICBtb2RhbEJhY2tkcm9wOiBmYWxzZSxcbiAgICBzZWNvbmRTdGVwOiAxNSxcbiAgICBzaG93U2Vjb25kczogZmFsc2UsXG4gICAgc2hvd0lucHV0czogdHJ1ZSxcbiAgICBzaG93TWVyaWRpYW46IHRydWUsXG4gICAgdGVtcGxhdGU6ICdkcm9wZG93bicsXG4gICAgYXBwZW5kV2lkZ2V0VG86ICcuYm9vdHN0cmFwLXRpbWVwaWNrZXInLFxuXHR1cEFycm93U3R5bGU6ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tdXAnLFxuXHRkb3duQXJyb3dTdHlsZTogJ2dseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1kb3duJyxcblx0Y29udGFpbmVyQ2xhc3M6ICdib290c3RyYXAtdGltZXBpY2tlcidcbiAgfTtcblxuICAkLmZuLnRpbWVwaWNrZXIuQ29uc3RydWN0b3IgPSBUaW1lcGlja2VyO1xuXG59KShqUXVlcnksIHdpbmRvdywgZG9jdW1lbnQpO1xuIl19

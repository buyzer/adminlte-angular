/*!
 * iCheck v1.0.1, http://git.io/arlzeA
 * =================================
 * Powerful jQuery and Zepto plugin for checkboxes and radio buttons customization
 *
 * (c) 2013 Damir Sultanov, http://fronteed.com
 * MIT Licensed
 */

(function($) {

  // Cached vars
  var _iCheck = 'iCheck',
    _iCheckHelper = _iCheck + '-helper',
    _checkbox = 'checkbox',
    _radio = 'radio',
    _checked = 'checked',
    _unchecked = 'un' + _checked,
    _disabled = 'disabled',
    _determinate = 'determinate',
    _indeterminate = 'in' + _determinate,
    _update = 'update',
    _type = 'type',
    _click = 'click',
    _touch = 'touchbegin.i touchend.i',
    _add = 'addClass',
    _remove = 'removeClass',
    _callback = 'trigger',
    _label = 'label',
    _cursor = 'cursor',
    _mobile = /ipad|iphone|ipod|android|blackberry|windows phone|opera mini|silk/i.test(navigator.userAgent);

  // Plugin init
  $.fn[_iCheck] = function(options, fire) {

    // Walker
    var handle = 'input[type="' + _checkbox + '"], input[type="' + _radio + '"]',
      stack = $(),
      walker = function(object) {
        object.each(function() {
          var self = $(this);

          if (self.is(handle)) {
            stack = stack.add(self);
          } else {
            stack = stack.add(self.find(handle));
          }
        });
      };

    // Check if we should operate with some method
    if (/^(check|uncheck|toggle|indeterminate|determinate|disable|enable|update|destroy)$/i.test(options)) {

      // Normalize method's name
      options = options.toLowerCase();

      // Find checkboxes and radio buttons
      walker(this);

      return stack.each(function() {
        var self = $(this);

        if (options == 'destroy') {
          tidy(self, 'ifDestroyed');
        } else {
          operate(self, true, options);
        }
          // Fire method's callback
        if ($.isFunction(fire)) {
          fire();
        }
      });

    // Customization
    } else if (typeof options == 'object' || !options) {

      // Check if any options were passed
      var settings = $.extend({
          checkedClass: _checked,
          disabledClass: _disabled,
          indeterminateClass: _indeterminate,
          labelHover: true,
          aria: false
        }, options),

        selector = settings.handle,
        hoverClass = settings.hoverClass || 'hover',
        focusClass = settings.focusClass || 'focus',
        activeClass = settings.activeClass || 'active',
        labelHover = !!settings.labelHover,
        labelHoverClass = settings.labelHoverClass || 'hover',

        // Setup clickable area
        area = ('' + settings.increaseArea).replace('%', '') | 0;

      // Selector limit
      if (selector == _checkbox || selector == _radio) {
        handle = 'input[type="' + selector + '"]';
      }
        // Clickable area limit
      if (area < -50) {
        area = -50;
      }
        // Walk around the selector
      walker(this);

      return stack.each(function() {
        var self = $(this);

        // If already customized
        tidy(self);

        var node = this,
          id = node.id,

          // Layer styles
          offset = -area + '%',
          size = 100 + (area * 2) + '%',
          layer = {
            position: 'absolute',
            top: offset,
            left: offset,
            display: 'block',
            width: size,
            height: size,
            margin: 0,
            padding: 0,
            background: '#fff',
            border: 0,
            opacity: 0
          },

          // Choose how to hide input
          hide = _mobile ? {
            position: 'absolute',
            visibility: 'hidden'
          } : area ? layer : {
            position: 'absolute',
            opacity: 0
          },

          // Get proper class
          className = node[_type] == _checkbox ? settings.checkboxClass || 'i' + _checkbox : settings.radioClass || 'i' + _radio,

          // Find assigned labels
          label = $(_label + '[for="' + id + '"]').add(self.closest(_label)),

          // Check ARIA option
          aria = !!settings.aria,

          // Set ARIA placeholder
          ariaID = _iCheck + '-' + Math.random().toString(36).replace('0.', ''),

          // Parent & helper
          parent = '<div class="' + className + '" ' + (aria ? 'role="' + node[_type] + '" ' : ''),
          helper;

        // Set ARIA "labelledby"
        if (label.length && aria) {
          label.each(function() {
            parent += 'aria-labelledby="';

            if (this.id) {
              parent += this.id;
            } else {
              this.id = ariaID;
              parent += ariaID;
            }

            parent += '"';
          });
        }
          // Wrap input
        parent = self.wrap(parent + '/>')[_callback]('ifCreated').parent().append(settings.insert);

        // Layer addition
        helper = $('<ins class="' + _iCheckHelper + '"/>').css(layer).appendTo(parent);

        // Finalize customization
        self.data(_iCheck, {o: settings, s: self.attr('style')}).css(hide);
        !!settings.inheritClass && parent[_add](node.className || '');
        !!settings.inheritID && id && parent.attr('id', _iCheck + '-' + id);
        parent.css('position') == 'static' && parent.css('position', 'relative');
        operate(self, true, _update);

        // Label events
        if (label.length) {
          label.on(_click + '.i mouseover.i mouseout.i ' + _touch, function(event) {
            var type = event[_type],
              item = $(this);

            // Do nothing if input is disabled
            if (!node[_disabled]) {

              // Click
              if (type == _click) {
                if ($(event.target).is('a')) {
                  return;
                }
                operate(self, false, true);

              // Hover state
              } else if (labelHover) {

                // mouseout|touchend
                if (/ut|nd/.test(type)) {
                  parent[_remove](hoverClass);
                  item[_remove](labelHoverClass);
                } else {
                  parent[_add](hoverClass);
                  item[_add](labelHoverClass);
                }
              }
                if (_mobile) {
                event.stopPropagation();
              } else {
                return false;
              }
            }
          });
        }
          // Input events
        self.on(_click + '.i focus.i blur.i keyup.i keydown.i keypress.i', function(event) {
          var type = event[_type],
            key = event.keyCode;

          // Click
          if (type == _click) {
            return false;

          // Keydown
          } else if (type == 'keydown' && key == 32) {
            if (!(node[_type] == _radio && node[_checked])) {
              if (node[_checked]) {
                off(self, _checked);
              } else {
                on(self, _checked);
              }
            }
              return false;

          // Keyup
          } else if (type == 'keyup' && node[_type] == _radio) {
            !node[_checked] && on(self, _checked);

          // Focus/blur
          } else if (/us|ur/.test(type)) {
            parent[type == 'blur' ? _remove : _add](focusClass);
          }
        });

        // Helper events
        helper.on(_click + ' mousedown mouseup mouseover mouseout ' + _touch, function(event) {
          var type = event[_type],

            // mousedown|mouseup
            toggle = /wn|up/.test(type) ? activeClass : hoverClass;

          // Do nothing if input is disabled
          if (!node[_disabled]) {

            // Click
            if (type == _click) {
              operate(self, false, true);

            // Active and hover states
            } else {

              // State is on
              if (/wn|er|in/.test(type)) {

                // mousedown|mouseover|touchbegin
                parent[_add](toggle);

              // State is off
              } else {
                parent[_remove](toggle + ' ' + activeClass);
              }
                // Label hover
              if (label.length && labelHover && toggle == hoverClass) {

                // mouseout|touchend
                label[/ut|nd/.test(type) ? _remove : _add](labelHoverClass);
              }
            }
              if (_mobile) {
              event.stopPropagation();
            } else {
              return false;
            }
          }
        });
      });
    } else {
      return this;
    }
  };

  // Do something with inputs
  function operate(input, direct, method) {
    var node = input[0],
      state = /er/.test(method) ? _indeterminate : /bl/.test(method) ? _disabled : _checked,
      active = method == _update ? {
        checked: node[_checked],
        disabled: node[_disabled],
        indeterminate: input.attr(_indeterminate) == 'true' || input.attr(_determinate) == 'false'
      } : node[state];

    // Check, disable or indeterminate
    if (/^(ch|di|in)/.test(method) && !active) {
      on(input, state);

    // Uncheck, enable or determinate
    } else if (/^(un|en|de)/.test(method) && active) {
      off(input, state);

    // Update
    } else if (method == _update) {

      // Handle states
      for (var state in active) {
        if (active[state]) {
          on(input, state, true);
        } else {
          off(input, state, true);
        }
      }
    } else if (!direct || method == 'toggle') {

      // Helper or label was clicked
      if (!direct) {
        input[_callback]('ifClicked');
      }
        // Toggle checked state
      if (active) {
        if (node[_type] !== _radio) {
          off(input, state);
        }
      } else {
        on(input, state);
      }
    }
  }
    // Add checked, disabled or indeterminate state
  function on(input, state, keep) {
    var node = input[0],
      parent = input.parent(),
      checked = state == _checked,
      indeterminate = state == _indeterminate,
      disabled = state == _disabled,
      callback = indeterminate ? _determinate : checked ? _unchecked : 'enabled',
      regular = option(input, callback + capitalize(node[_type])),
      specific = option(input, state + capitalize(node[_type]));

    // Prevent unnecessary actions
    if (node[state] !== true) {

      // Toggle assigned radio buttons
      if (!keep && state == _checked && node[_type] == _radio && node.name) {
        var form = input.closest('form'),
          inputs = 'input[name="' + node.name + '"]';

        inputs = form.length ? form.find(inputs) : $(inputs);

        inputs.each(function() {
          if (this !== node && $(this).data(_iCheck)) {
            off($(this), state);
          }
        });
      }
        // Indeterminate state
      if (indeterminate) {

        // Add indeterminate state
        node[state] = true;

        // Remove checked state
        if (node[_checked]) {
          off(input, _checked, 'force');
        }
          // Checked or disabled state
      } else {

        // Add checked or disabled state
        if (!keep) {
          node[state] = true;
        }
          // Remove indeterminate state
        if (checked && node[_indeterminate]) {
          off(input, _indeterminate, false);
        }
      }
        // Trigger callbacks
      callbacks(input, checked, state, keep);
    }
      // Add proper cursor
    if (node[_disabled] && !!option(input, _cursor, true)) {
      parent.find('.' + _iCheckHelper).css(_cursor, 'default');
    }
      // Add state class
    parent[_add](specific || option(input, state) || '');

    // Set ARIA attribute
    disabled ? parent.attr('aria-disabled', 'true') : parent.attr('aria-checked', indeterminate ? 'mixed' : 'true');

    // Remove regular state class
    parent[_remove](regular || option(input, callback) || '');
  }
    // Remove checked, disabled or indeterminate state
  function off(input, state, keep) {
    var node = input[0],
      parent = input.parent(),
      checked = state == _checked,
      indeterminate = state == _indeterminate,
      disabled = state == _disabled,
      callback = indeterminate ? _determinate : checked ? _unchecked : 'enabled',
      regular = option(input, callback + capitalize(node[_type])),
      specific = option(input, state + capitalize(node[_type]));

    // Prevent unnecessary actions
    if (node[state] !== false) {

      // Toggle state
      if (indeterminate || !keep || keep == 'force') {
        node[state] = false;
      }
        // Trigger callbacks
      callbacks(input, checked, callback, keep);
    }
      // Add proper cursor
    if (!node[_disabled] && !!option(input, _cursor, true)) {
      parent.find('.' + _iCheckHelper).css(_cursor, 'pointer');
    }
      // Remove state class
    parent[_remove](specific || option(input, state) || '');

    // Set ARIA attribute
    disabled ? parent.attr('aria-disabled', 'false') : parent.attr('aria-checked', 'false');

    // Add regular state class
    parent[_add](regular || option(input, callback) || '');
  }
    // Remove all traces
  function tidy(input, callback) {
    if (input.data(_iCheck)) {

      // Remove everything except input
      input.parent().html(input.attr('style', input.data(_iCheck).s || ''));

      // Callback
      if (callback) {
        input[_callback](callback);
      }
        // Unbind events
      input.off('.i').unwrap();
      $(_label + '[for="' + input[0].id + '"]').add(input.closest(_label)).off('.i');
    }
  }
    // Get some option
  function option(input, state, regular) {
    if (input.data(_iCheck)) {
      return input.data(_iCheck).o[state + (regular ? '' : 'Class')];
    }
  }
    // Capitalize some string
  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
    // Executable handlers
  function callbacks(input, checked, callback, keep) {
    if (!keep) {
      if (checked) {
        input[_callback]('ifToggled');
      }
        input[_callback]('ifChanged')[_callback]('if' + capitalize(callback));
    }
  }
})(window.jQuery || window.Zepto);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImljaGVjay5qcyJdLCJuYW1lcyI6WyIkIiwib3BlcmF0ZSIsImlucHV0IiwiZGlyZWN0IiwibWV0aG9kIiwibm9kZSIsInN0YXRlIiwidGVzdCIsIl9pbmRldGVybWluYXRlIiwiX2Rpc2FibGVkIiwiX2NoZWNrZWQiLCJhY3RpdmUiLCJfdXBkYXRlIiwiY2hlY2tlZCIsImRpc2FibGVkIiwiaW5kZXRlcm1pbmF0ZSIsImF0dHIiLCJfZGV0ZXJtaW5hdGUiLCJvbiIsIm9mZiIsIl9jYWxsYmFjayIsIl90eXBlIiwiX3JhZGlvIiwia2VlcCIsInBhcmVudCIsImNhbGxiYWNrIiwiX3VuY2hlY2tlZCIsInJlZ3VsYXIiLCJvcHRpb24iLCJjYXBpdGFsaXplIiwic3BlY2lmaWMiLCJuYW1lIiwiZm9ybSIsImNsb3Nlc3QiLCJpbnB1dHMiLCJsZW5ndGgiLCJmaW5kIiwiZWFjaCIsInRoaXMiLCJkYXRhIiwiX2lDaGVjayIsImNhbGxiYWNrcyIsIl9jdXJzb3IiLCJfaUNoZWNrSGVscGVyIiwiY3NzIiwiX2FkZCIsIl9yZW1vdmUiLCJ0aWR5IiwiaHRtbCIsInMiLCJ1bndyYXAiLCJfbGFiZWwiLCJpZCIsImFkZCIsIm8iLCJzdHJpbmciLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwiX2NoZWNrYm94IiwiX2NsaWNrIiwiX3RvdWNoIiwiX21vYmlsZSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsImZuIiwib3B0aW9ucyIsImZpcmUiLCJoYW5kbGUiLCJzdGFjayIsIndhbGtlciIsIm9iamVjdCIsInNlbGYiLCJpcyIsInRvTG93ZXJDYXNlIiwiaXNGdW5jdGlvbiIsInNldHRpbmdzIiwiZXh0ZW5kIiwiY2hlY2tlZENsYXNzIiwiZGlzYWJsZWRDbGFzcyIsImluZGV0ZXJtaW5hdGVDbGFzcyIsImxhYmVsSG92ZXIiLCJhcmlhIiwic2VsZWN0b3IiLCJob3ZlckNsYXNzIiwiZm9jdXNDbGFzcyIsImFjdGl2ZUNsYXNzIiwibGFiZWxIb3ZlckNsYXNzIiwiYXJlYSIsImluY3JlYXNlQXJlYSIsInJlcGxhY2UiLCJoZWxwZXIiLCJvZmZzZXQiLCJzaXplIiwibGF5ZXIiLCJwb3NpdGlvbiIsInRvcCIsImxlZnQiLCJkaXNwbGF5Iiwid2lkdGgiLCJoZWlnaHQiLCJtYXJnaW4iLCJwYWRkaW5nIiwiYmFja2dyb3VuZCIsImJvcmRlciIsIm9wYWNpdHkiLCJoaWRlIiwidmlzaWJpbGl0eSIsImNsYXNzTmFtZSIsImNoZWNrYm94Q2xhc3MiLCJyYWRpb0NsYXNzIiwibGFiZWwiLCJhcmlhSUQiLCJNYXRoIiwicmFuZG9tIiwidG9TdHJpbmciLCJ3cmFwIiwiYXBwZW5kIiwiaW5zZXJ0IiwiYXBwZW5kVG8iLCJpbmhlcml0Q2xhc3MiLCJpbmhlcml0SUQiLCJldmVudCIsInR5cGUiLCJpdGVtIiwidGFyZ2V0Iiwic3RvcFByb3BhZ2F0aW9uIiwia2V5Iiwia2V5Q29kZSIsInRvZ2dsZSIsIndpbmRvdyIsImpRdWVyeSIsIlplcHRvIl0sIm1hcHBpbmdzIjoiQ0FTQSxTQUFVQSxHQWtTUixRQUFTQyxHQUFRQyxFQUFPQyxFQUFRQyxHQUM5QixHQUFJQyxHQUFPSCxFQUFNLEdBQ2ZJLEVBQVEsS0FBS0MsS0FBS0gsR0FBVUksRUFBaUIsS0FBS0QsS0FBS0gsR0FBVUssRUFBWUMsRUFDN0VDLEVBQVNQLEdBQVVRLEdBQ2pCQyxRQUFTUixFQUFLSyxHQUNkSSxTQUFVVCxFQUFLSSxHQUNmTSxjQUE2QyxRQUE5QmIsRUFBTWMsS0FBS1IsSUFBeUQsU0FBNUJOLEVBQU1jLEtBQUtDLElBQ2hFWixFQUFLQyxFQUdYLElBQUksY0FBY0MsS0FBS0gsS0FBWU8sRUFDakNPLEVBQUdoQixFQUFPSSxPQUdMLElBQUksY0FBY0MsS0FBS0gsSUFBV08sRUFDdkNRLEVBQUlqQixFQUFPSSxPQUdOLElBQUlGLEdBQVVRLEVBR25CLElBQUssR0FBSU4sS0FBU0ssR0FDWkEsRUFBT0wsR0FDVFksRUFBR2hCLEVBQU9JLEdBQU8sR0FFakJhLEVBQUlqQixFQUFPSSxHQUFPLE9BR1pI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R0FHbEJuRyxFQUFPcUIsR0FBTW9GLEdBSWJ6RyxFQUFPc0IsR0FBU21GLEVBQVMsSUFBTTNDLEdBRzdCeUIsRUFBTTVFLFFBQVU4QyxHQUFjZ0QsR0FBVTdDLEdBRzFDMkIsRUFBTSxRQUFReEcsS0FBS29ILEdBQVE3RSxFQUFVRCxHQUFNMEMsS0FHekN6QixFQUdKLE9BQU8sQ0FGUDRELEdBQU1JLHlCQStMakJJLE9BQU9DLFFBQVVELE9BQU9FIiwiZmlsZSI6ImljaGVjay1kZWJ1Zy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogaUNoZWNrIHYxLjAuMSwgaHR0cDovL2dpdC5pby9hcmx6ZUFcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogUG93ZXJmdWwgalF1ZXJ5IGFuZCBaZXB0byBwbHVnaW4gZm9yIGNoZWNrYm94ZXMgYW5kIHJhZGlvIGJ1dHRvbnMgY3VzdG9taXphdGlvblxuICpcbiAqIChjKSAyMDEzIERhbWlyIFN1bHRhbm92LCBodHRwOi8vZnJvbnRlZWQuY29tXG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG4oZnVuY3Rpb24oJCkge1xuXG4gIC8vIENhY2hlZCB2YXJzXG4gIHZhciBfaUNoZWNrID0gJ2lDaGVjaycsXG4gICAgX2lDaGVja0hlbHBlciA9IF9pQ2hlY2sgKyAnLWhlbHBlcicsXG4gICAgX2NoZWNrYm94ID0gJ2NoZWNrYm94JyxcbiAgICBfcmFkaW8gPSAncmFkaW8nLFxuICAgIF9jaGVja2VkID0gJ2NoZWNrZWQnLFxuICAgIF91bmNoZWNrZWQgPSAndW4nICsgX2NoZWNrZWQsXG4gICAgX2Rpc2FibGVkID0gJ2Rpc2FibGVkJyxcbiAgICBfZGV0ZXJtaW5hdGUgPSAnZGV0ZXJtaW5hdGUnLFxuICAgIF9pbmRldGVybWluYXRlID0gJ2luJyArIF9kZXRlcm1pbmF0ZSxcbiAgICBfdXBkYXRlID0gJ3VwZGF0ZScsXG4gICAgX3R5cGUgPSAndHlwZScsXG4gICAgX2NsaWNrID0gJ2NsaWNrJyxcbiAgICBfdG91Y2ggPSAndG91Y2hiZWdpbi5pIHRvdWNoZW5kLmknLFxuICAgIF9hZGQgPSAnYWRkQ2xhc3MnLFxuICAgIF9yZW1vdmUgPSAncmVtb3ZlQ2xhc3MnLFxuICAgIF9jYWxsYmFjayA9ICd0cmlnZ2VyJyxcbiAgICBfbGFiZWwgPSAnbGFiZWwnLFxuICAgIF9jdXJzb3IgPSAnY3Vyc29yJyxcbiAgICBfbW9iaWxlID0gL2lwYWR8aXBob25lfGlwb2R8YW5kcm9pZHxibGFja2JlcnJ5fHdpbmRvd3MgcGhvbmV8b3BlcmEgbWluaXxzaWxrL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuICAvLyBQbHVnaW4gaW5pdFxuICAkLmZuW19pQ2hlY2tdID0gZnVuY3Rpb24ob3B0aW9ucywgZmlyZSkge1xuXG4gICAgLy8gV2Fsa2VyXG4gICAgdmFyIGhhbmRsZSA9ICdpbnB1dFt0eXBlPVwiJyArIF9jaGVja2JveCArICdcIl0sIGlucHV0W3R5cGU9XCInICsgX3JhZGlvICsgJ1wiXScsXG4gICAgICBzdGFjayA9ICQoKSxcbiAgICAgIHdhbGtlciA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICBvYmplY3QuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgc2VsZiA9ICQodGhpcyk7XG5cbiAgICAgICAgICBpZiAoc2VsZi5pcyhoYW5kbGUpKSB7XG4gICAgICAgICAgICBzdGFjayA9IHN0YWNrLmFkZChzZWxmKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhY2sgPSBzdGFjay5hZGQoc2VsZi5maW5kKGhhbmRsZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgLy8gQ2hlY2sgaWYgd2Ugc2hvdWxkIG9wZXJhdGUgd2l0aCBzb21lIG1ldGhvZFxuICAgIGlmICgvXihjaGVja3x1bmNoZWNrfHRvZ2dsZXxpbmRldGVybWluYXRlfGRldGVybWluYXRlfGRpc2FibGV8ZW5hYmxlfHVwZGF0ZXxkZXN0cm95KSQvaS50ZXN0KG9wdGlvbnMpKSB7XG5cbiAgICAgIC8vIE5vcm1hbGl6ZSBtZXRob2QncyBuYW1lXG4gICAgICBvcHRpb25zID0gb3B0aW9ucy50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAvLyBGaW5kIGNoZWNrYm94ZXMgYW5kIHJhZGlvIGJ1dHRvbnNcbiAgICAgIHdhbGtlcih0aGlzKTtcblxuICAgICAgcmV0dXJuIHN0YWNrLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gJCh0aGlzKTtcblxuICAgICAgICBpZiAob3B0aW9ucyA9PSAnZGVzdHJveScpIHtcbiAgICAgICAgICB0aWR5KHNlbGYsICdpZkRlc3Ryb3llZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9wZXJhdGUoc2VsZiwgdHJ1ZSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgICAvLyBGaXJlIG1ldGhvZCdzIGNhbGxiYWNrXG4gICAgICAgIGlmICgkLmlzRnVuY3Rpb24oZmlyZSkpIHtcbiAgICAgICAgICBmaXJlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgLy8gQ3VzdG9taXphdGlvblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMgPT0gJ29iamVjdCcgfHwgIW9wdGlvbnMpIHtcblxuICAgICAgLy8gQ2hlY2sgaWYgYW55IG9wdGlvbnMgd2VyZSBwYXNzZWRcbiAgICAgIHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHtcbiAgICAgICAgICBjaGVja2VkQ2xhc3M6IF9jaGVja2VkLFxuICAgICAgICAgIGRpc2FibGVkQ2xhc3M6IF9kaXNhYmxlZCxcbiAgICAgICAgICBpbmRldGVybWluYXRlQ2xhc3M6IF9pbmRldGVybWluYXRlLFxuICAgICAgICAgIGxhYmVsSG92ZXI6IHRydWUsXG4gICAgICAgICAgYXJpYTogZmFsc2VcbiAgICAgICAgfSwgb3B0aW9ucyksXG5cbiAgICAgICAgc2VsZWN0b3IgPSBzZXR0aW5ncy5oYW5kbGUsXG4gICAgICAgIGhvdmVyQ2xhc3MgPSBzZXR0aW5ncy5ob3ZlckNsYXNzIHx8ICdob3ZlcicsXG4gICAgICAgIGZvY3VzQ2xhc3MgPSBzZXR0aW5ncy5mb2N1c0NsYXNzIHx8ICdmb2N1cycsXG4gICAgICAgIGFjdGl2ZUNsYXNzID0gc2V0dGluZ3MuYWN0aXZlQ2xhc3MgfHwgJ2FjdGl2ZScsXG4gICAgICAgIGxhYmVsSG92ZXIgPSAhIXNldHRpbmdzLmxhYmVsSG92ZXIsXG4gICAgICAgIGxhYmVsSG92ZXJDbGFzcyA9IHNldHRpbmdzLmxhYmVsSG92ZXJDbGFzcyB8fCAnaG92ZXInLFxuXG4gICAgICAgIC8vIFNldHVwIGNsaWNrYWJsZSBhcmVhXG4gICAgICAgIGFyZWEgPSAoJycgKyBzZXR0aW5ncy5pbmNyZWFzZUFyZWEpLnJlcGxhY2UoJyUnLCAnJykgfCAwO1xuXG4gICAgICAvLyBTZWxlY3RvciBsaW1pdFxuICAgICAgaWYgKHNlbGVjdG9yID09IF9jaGVja2JveCB8fCBzZWxlY3RvciA9PSBfcmFkaW8pIHtcbiAgICAgICAgaGFuZGxlID0gJ2lucHV0W3R5cGU9XCInICsgc2VsZWN0b3IgKyAnXCJdJztcbiAgICAgIH1cbiAgICAgICAgLy8gQ2xpY2thYmxlIGFyZWEgbGltaXRcbiAgICAgIGlmIChhcmVhIDwgLTUwKSB7XG4gICAgICAgIGFyZWEgPSAtNTA7XG4gICAgICB9XG4gICAgICAgIC8vIFdhbGsgYXJvdW5kIHRoZSBzZWxlY3RvclxuICAgICAgd2Fsa2VyKHRoaXMpO1xuXG4gICAgICByZXR1cm4gc3RhY2suZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSAkKHRoaXMpO1xuXG4gICAgICAgIC8vIElmIGFscmVhZHkgY3VzdG9taXplZFxuICAgICAgICB0aWR5KHNlbGYpO1xuXG4gICAgICAgIHZhciBub2RlID0gdGhpcyxcbiAgICAgICAgICBpZCA9IG5vZGUuaWQsXG5cbiAgICAgICAgICAvLyBMYXllciBzdHlsZXNcbiAgICAgICAgICBvZmZzZXQgPSAtYXJlYSArICclJyxcbiAgICAgICAgICBzaXplID0gMTAwICsgKGFyZWEgKiAyKSArICclJyxcbiAgICAgICAgICBsYXllciA9IHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgdG9wOiBvZmZzZXQsXG4gICAgICAgICAgICBsZWZ0OiBvZmZzZXQsXG4gICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICAgICAgd2lkdGg6IHNpemUsXG4gICAgICAgICAgICBoZWlnaHQ6IHNpemUsXG4gICAgICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgICAgICBwYWRkaW5nOiAwLFxuICAgICAgICAgICAgYmFja2dyb3VuZDogJyNmZmYnLFxuICAgICAgICAgICAgYm9yZGVyOiAwLFxuICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICAvLyBDaG9vc2UgaG93IHRvIGhpZGUgaW5wdXRcbiAgICAgICAgICBoaWRlID0gX21vYmlsZSA/IHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgdmlzaWJpbGl0eTogJ2hpZGRlbidcbiAgICAgICAgICB9IDogYXJlYSA/IGxheWVyIDoge1xuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIC8vIEdldCBwcm9wZXIgY2xhc3NcbiAgICAgICAgICBjbGFzc05hbWUgPSBub2RlW190eXBlXSA9PSBfY2hlY2tib3ggPyBzZXR0aW5ncy5jaGVja2JveENsYXNzIHx8ICdpJyArIF9jaGVja2JveCA6IHNldHRpbmdzLnJhZGlvQ2xhc3MgfHwgJ2knICsgX3JhZGlvLFxuXG4gICAgICAgICAgLy8gRmluZCBhc3NpZ25lZCBsYWJlbHNcbiAgICAgICAgICBsYWJlbCA9ICQoX2xhYmVsICsgJ1tmb3I9XCInICsgaWQgKyAnXCJdJykuYWRkKHNlbGYuY2xvc2VzdChfbGFiZWwpKSxcblxuICAgICAgICAgIC8vIENoZWNrIEFSSUEgb3B0aW9uXG4gICAgICAgICAgYXJpYSA9ICEhc2V0dGluZ3MuYXJpYSxcblxuICAgICAgICAgIC8vIFNldCBBUklBIHBsYWNlaG9sZGVyXG4gICAgICAgICAgYXJpYUlEID0gX2lDaGVjayArICctJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnJlcGxhY2UoJzAuJywgJycpLFxuXG4gICAgICAgICAgLy8gUGFyZW50ICYgaGVscGVyXG4gICAgICAgICAgcGFyZW50ID0gJzxkaXYgY2xhc3M9XCInICsgY2xhc3NOYW1lICsgJ1wiICcgKyAoYXJpYSA/ICdyb2xlPVwiJyArIG5vZGVbX3R5cGVdICsgJ1wiICcgOiAnJyksXG4gICAgICAgICAgaGVscGVyO1xuXG4gICAgICAgIC8vIFNldCBBUklBIFwibGFiZWxsZWRieVwiXG4gICAgICAgIGlmIChsYWJlbC5sZW5ndGggJiYgYXJpYSkge1xuICAgICAgICAgIGxhYmVsLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwYXJlbnQgKz0gJ2FyaWEtbGFiZWxsZWRieT1cIic7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlkKSB7XG4gICAgICAgICAgICAgIHBhcmVudCArPSB0aGlzLmlkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5pZCA9IGFyaWFJRDtcbiAgICAgICAgICAgICAgcGFyZW50ICs9IGFyaWFJRDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFyZW50ICs9ICdcIic7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgICAvLyBXcmFwIGlucHV0XG4gICAgICAgIHBhcmVudCA9IHNlbGYud3JhcChwYXJlbnQgKyAnLz4nKVtfY2FsbGJhY2tdKCdpZkNyZWF0ZWQnKS5wYXJlbnQoKS5hcHBlbmQoc2V0dGluZ3MuaW5zZXJ0KTtcblxuICAgICAgICAvLyBMYXllciBhZGRpdGlvblxuICAgICAgICBoZWxwZXIgPSAkKCc8aW5zIGNsYXNzPVwiJyArIF9pQ2hlY2tIZWxwZXIgKyAnXCIvPicpLmNzcyhsYXllcikuYXBwZW5kVG8ocGFyZW50KTtcblxuICAgICAgICAvLyBGaW5hbGl6ZSBjdXN0b21pemF0aW9uXG4gICAgICAgIHNlbGYuZGF0YShfaUNoZWNrLCB7bzogc2V0dGluZ3MsIHM6IHNlbGYuYXR0cignc3R5bGUnKX0pLmNzcyhoaWRlKTtcbiAgICAgICAgISFzZXR0aW5ncy5pbmhlcml0Q2xhc3MgJiYgcGFyZW50W19hZGRdKG5vZGUuY2xhc3NOYW1lIHx8ICcnKTtcbiAgICAgICAgISFzZXR0aW5ncy5pbmhlcml0SUQgJiYgaWQgJiYgcGFyZW50LmF0dHIoJ2lkJywgX2lDaGVjayArICctJyArIGlkKTtcbiAgICAgICAgcGFyZW50LmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJyAmJiBwYXJlbnQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xuICAgICAgICBvcGVyYXRlKHNlbGYsIHRydWUsIF91cGRhdGUpO1xuXG4gICAgICAgIC8vIExhYmVsIGV2ZW50c1xuICAgICAgICBpZiAobGFiZWwubGVuZ3RoKSB7XG4gICAgICAgICAgbGFiZWwub24oX2NsaWNrICsgJy5pIG1vdXNlb3Zlci5pIG1vdXNlb3V0LmkgJyArIF90b3VjaCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciB0eXBlID0gZXZlbnRbX3R5cGVdLFxuICAgICAgICAgICAgICBpdGVtID0gJCh0aGlzKTtcblxuICAgICAgICAgICAgLy8gRG8gbm90aGluZyBpZiBpbnB1dCBpcyBkaXNhYmxlZFxuICAgICAgICAgICAgaWYgKCFub2RlW19kaXNhYmxlZF0pIHtcblxuICAgICAgICAgICAgICAvLyBDbGlja1xuICAgICAgICAgICAgICBpZiAodHlwZSA9PSBfY2xpY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoJChldmVudC50YXJnZXQpLmlzKCdhJykpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3BlcmF0ZShzZWxmLCBmYWxzZSwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgLy8gSG92ZXIgc3RhdGVcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYWJlbEhvdmVyKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBtb3VzZW91dHx0b3VjaGVuZFxuICAgICAgICAgICAgICAgIGlmICgvdXR8bmQvLnRlc3QodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgIHBhcmVudFtfcmVtb3ZlXShob3ZlckNsYXNzKTtcbiAgICAgICAgICAgICAgICAgIGl0ZW1bX3JlbW92ZV0obGFiZWxIb3ZlckNsYXNzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcGFyZW50W19hZGRdKGhvdmVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgICAgaXRlbVtfYWRkXShsYWJlbEhvdmVyQ2xhc3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChfbW9iaWxlKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgICAvLyBJbnB1dCBldmVudHNcbiAgICAgICAgc2VsZi5vbihfY2xpY2sgKyAnLmkgZm9jdXMuaSBibHVyLmkga2V5dXAuaSBrZXlkb3duLmkga2V5cHJlc3MuaScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgdmFyIHR5cGUgPSBldmVudFtfdHlwZV0sXG4gICAgICAgICAgICBrZXkgPSBldmVudC5rZXlDb2RlO1xuXG4gICAgICAgICAgLy8gQ2xpY2tcbiAgICAgICAgICBpZiAodHlwZSA9PSBfY2xpY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgIC8vIEtleWRvd25cbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gJ2tleWRvd24nICYmIGtleSA9PSAzMikge1xuICAgICAgICAgICAgaWYgKCEobm9kZVtfdHlwZV0gPT0gX3JhZGlvICYmIG5vZGVbX2NoZWNrZWRdKSkge1xuICAgICAgICAgICAgICBpZiAobm9kZVtfY2hlY2tlZF0pIHtcbiAgICAgICAgICAgICAgICBvZmYoc2VsZiwgX2NoZWNrZWQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG9uKHNlbGYsIF9jaGVja2VkKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAvLyBLZXl1cFxuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSAna2V5dXAnICYmIG5vZGVbX3R5cGVdID09IF9yYWRpbykge1xuICAgICAgICAgICAgIW5vZGVbX2NoZWNrZWRdICYmIG9uKHNlbGYsIF9jaGVja2VkKTtcblxuICAgICAgICAgIC8vIEZvY3VzL2JsdXJcbiAgICAgICAgICB9IGVsc2UgaWYgKC91c3x1ci8udGVzdCh0eXBlKSkge1xuICAgICAgICAgICAgcGFyZW50W3R5cGUgPT0gJ2JsdXInID8gX3JlbW92ZSA6IF9hZGRdKGZvY3VzQ2xhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSGVscGVyIGV2ZW50c1xuICAgICAgICBoZWxwZXIub24oX2NsaWNrICsgJyBtb3VzZWRvd24gbW91c2V1cCBtb3VzZW92ZXIgbW91c2VvdXQgJyArIF90b3VjaCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICB2YXIgdHlwZSA9IGV2ZW50W190eXBlXSxcblxuICAgICAgICAgICAgLy8gbW91c2Vkb3dufG1vdXNldXBcbiAgICAgICAgICAgIHRvZ2dsZSA9IC93bnx1cC8udGVzdCh0eXBlKSA/IGFjdGl2ZUNsYXNzIDogaG92ZXJDbGFzcztcblxuICAgICAgICAgIC8vIERvIG5vdGhpbmcgaWYgaW5wdXQgaXMgZGlzYWJsZWRcbiAgICAgICAgICBpZiAoIW5vZGVbX2Rpc2FibGVkXSkge1xuXG4gICAgICAgICAgICAvLyBDbGlja1xuICAgICAgICAgICAgaWYgKHR5cGUgPT0gX2NsaWNrKSB7XG4gICAgICAgICAgICAgIG9wZXJhdGUoc2VsZiwgZmFsc2UsIHRydWUpO1xuXG4gICAgICAgICAgICAvLyBBY3RpdmUgYW5kIGhvdmVyIHN0YXRlc1xuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAvLyBTdGF0ZSBpcyBvblxuICAgICAgICAgICAgICBpZiAoL3dufGVyfGluLy50ZXN0KHR5cGUpKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBtb3VzZWRvd258bW91c2VvdmVyfHRvdWNoYmVnaW5cbiAgICAgICAgICAgICAgICBwYXJlbnRbX2FkZF0odG9nZ2xlKTtcblxuICAgICAgICAgICAgICAvLyBTdGF0ZSBpcyBvZmZcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRbX3JlbW92ZV0odG9nZ2xlICsgJyAnICsgYWN0aXZlQ2xhc3MpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gTGFiZWwgaG92ZXJcbiAgICAgICAgICAgICAgaWYgKGxhYmVsLmxlbmd0aCAmJiBsYWJlbEhvdmVyICYmIHRvZ2dsZSA9PSBob3ZlckNsYXNzKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBtb3VzZW91dHx0b3VjaGVuZFxuICAgICAgICAgICAgICAgIGxhYmVsWy91dHxuZC8udGVzdCh0eXBlKSA/IF9yZW1vdmUgOiBfYWRkXShsYWJlbEhvdmVyQ2xhc3MpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChfbW9iaWxlKSB7XG4gICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIC8vIERvIHNvbWV0aGluZyB3aXRoIGlucHV0c1xuICBmdW5jdGlvbiBvcGVyYXRlKGlucHV0LCBkaXJlY3QsIG1ldGhvZCkge1xuICAgIHZhciBub2RlID0gaW5wdXRbMF0sXG4gICAgICBzdGF0ZSA9IC9lci8udGVzdChtZXRob2QpID8gX2luZGV0ZXJtaW5hdGUgOiAvYmwvLnRlc3QobWV0aG9kKSA/IF9kaXNhYmxlZCA6IF9jaGVja2VkLFxuICAgICAgYWN0aXZlID0gbWV0aG9kID09IF91cGRhdGUgPyB7XG4gICAgICAgIGNoZWNrZWQ6IG5vZGVbX2NoZWNrZWRdLFxuICAgICAgICBkaXNhYmxlZDogbm9kZVtfZGlzYWJsZWRdLFxuICAgICAgICBpbmRldGVybWluYXRlOiBpbnB1dC5hdHRyKF9pbmRldGVybWluYXRlKSA9PSAndHJ1ZScgfHwgaW5wdXQuYXR0cihfZGV0ZXJtaW5hdGUpID09ICdmYWxzZSdcbiAgICAgIH0gOiBub2RlW3N0YXRlXTtcblxuICAgIC8vIENoZWNrLCBkaXNhYmxlIG9yIGluZGV0ZXJtaW5hdGVcbiAgICBpZiAoL14oY2h8ZGl8aW4pLy50ZXN0KG1ldGhvZCkgJiYgIWFjdGl2ZSkge1xuICAgICAgb24oaW5wdXQsIHN0YXRlKTtcblxuICAgIC8vIFVuY2hlY2ssIGVuYWJsZSBvciBkZXRlcm1pbmF0ZVxuICAgIH0gZWxzZSBpZiAoL14odW58ZW58ZGUpLy50ZXN0KG1ldGhvZCkgJiYgYWN0aXZlKSB7XG4gICAgICBvZmYoaW5wdXQsIHN0YXRlKTtcblxuICAgIC8vIFVwZGF0ZVxuICAgIH0gZWxzZSBpZiAobWV0aG9kID09IF91cGRhdGUpIHtcblxuICAgICAgLy8gSGFuZGxlIHN0YXRlc1xuICAgICAgZm9yICh2YXIgc3RhdGUgaW4gYWN0aXZlKSB7XG4gICAgICAgIGlmIChhY3RpdmVbc3RhdGVdKSB7XG4gICAgICAgICAgb24oaW5wdXQsIHN0YXRlLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvZmYoaW5wdXQsIHN0YXRlLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWRpcmVjdCB8fCBtZXRob2QgPT0gJ3RvZ2dsZScpIHtcblxuICAgICAgLy8gSGVscGVyIG9yIGxhYmVsIHdhcyBjbGlja2VkXG4gICAgICBpZiAoIWRpcmVjdCkge1xuICAgICAgICBpbnB1dFtfY2FsbGJhY2tdKCdpZkNsaWNrZWQnKTtcbiAgICAgIH1cbiAgICAgICAgLy8gVG9nZ2xlIGNoZWNrZWQgc3RhdGVcbiAgICAgIGlmIChhY3RpdmUpIHtcbiAgICAgICAgaWYgKG5vZGVbX3R5cGVdICE9PSBfcmFkaW8pIHtcbiAgICAgICAgICBvZmYoaW5wdXQsIHN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb24oaW5wdXQsIHN0YXRlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgICAvLyBBZGQgY2hlY2tlZCwgZGlzYWJsZWQgb3IgaW5kZXRlcm1pbmF0ZSBzdGF0ZVxuICBmdW5jdGlvbiBvbihpbnB1dCwgc3RhdGUsIGtlZXApIHtcbiAgICB2YXIgbm9kZSA9IGlucHV0WzBdLFxuICAgICAgcGFyZW50ID0gaW5wdXQucGFyZW50KCksXG4gICAgICBjaGVja2VkID0gc3RhdGUgPT0gX2NoZWNrZWQsXG4gICAgICBpbmRldGVybWluYXRlID0gc3RhdGUgPT0gX2luZGV0ZXJtaW5hdGUsXG4gICAgICBkaXNhYmxlZCA9IHN0YXRlID09IF9kaXNhYmxlZCxcbiAgICAgIGNhbGxiYWNrID0gaW5kZXRlcm1pbmF0ZSA/IF9kZXRlcm1pbmF0ZSA6IGNoZWNrZWQgPyBfdW5jaGVja2VkIDogJ2VuYWJsZWQnLFxuICAgICAgcmVndWxhciA9IG9wdGlvbihpbnB1dCwgY2FsbGJhY2sgKyBjYXBpdGFsaXplKG5vZGVbX3R5cGVdKSksXG4gICAgICBzcGVjaWZpYyA9IG9wdGlvbihpbnB1dCwgc3RhdGUgKyBjYXBpdGFsaXplKG5vZGVbX3R5cGVdKSk7XG5cbiAgICAvLyBQcmV2ZW50IHVubmVjZXNzYXJ5IGFjdGlvbnNcbiAgICBpZiAobm9kZVtzdGF0ZV0gIT09IHRydWUpIHtcblxuICAgICAgLy8gVG9nZ2xlIGFzc2lnbmVkIHJhZGlvIGJ1dHRvbnNcbiAgICAgIGlmICgha2VlcCAmJiBzdGF0ZSA9PSBfY2hlY2tlZCAmJiBub2RlW190eXBlXSA9PSBfcmFkaW8gJiYgbm9kZS5uYW1lKSB7XG4gICAgICAgIHZhciBmb3JtID0gaW5wdXQuY2xvc2VzdCgnZm9ybScpLFxuICAgICAgICAgIGlucHV0cyA9ICdpbnB1dFtuYW1lPVwiJyArIG5vZGUubmFtZSArICdcIl0nO1xuXG4gICAgICAgIGlucHV0cyA9IGZvcm0ubGVuZ3RoID8gZm9ybS5maW5kKGlucHV0cykgOiAkKGlucHV0cyk7XG5cbiAgICAgICAgaW5wdXRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKHRoaXMgIT09IG5vZGUgJiYgJCh0aGlzKS5kYXRhKF9pQ2hlY2spKSB7XG4gICAgICAgICAgICBvZmYoJCh0aGlzKSwgc3RhdGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAgIC8vIEluZGV0ZXJtaW5hdGUgc3RhdGVcbiAgICAgIGlmIChpbmRldGVybWluYXRlKSB7XG5cbiAgICAgICAgLy8gQWRkIGluZGV0ZXJtaW5hdGUgc3RhdGVcbiAgICAgICAgbm9kZVtzdGF0ZV0gPSB0cnVlO1xuXG4gICAgICAgIC8vIFJlbW92ZSBjaGVja2VkIHN0YXRlXG4gICAgICAgIGlmIChub2RlW19jaGVja2VkXSkge1xuICAgICAgICAgIG9mZihpbnB1dCwgX2NoZWNrZWQsICdmb3JjZScpO1xuICAgICAgICB9XG4gICAgICAgICAgLy8gQ2hlY2tlZCBvciBkaXNhYmxlZCBzdGF0ZVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAvLyBBZGQgY2hlY2tlZCBvciBkaXNhYmxlZCBzdGF0ZVxuICAgICAgICBpZiAoIWtlZXApIHtcbiAgICAgICAgICBub2RlW3N0YXRlXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgICAvLyBSZW1vdmUgaW5kZXRlcm1pbmF0ZSBzdGF0ZVxuICAgICAgICBpZiAoY2hlY2tlZCAmJiBub2RlW19pbmRldGVybWluYXRlXSkge1xuICAgICAgICAgIG9mZihpbnB1dCwgX2luZGV0ZXJtaW5hdGUsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgICAvLyBUcmlnZ2VyIGNhbGxiYWNrc1xuICAgICAgY2FsbGJhY2tzKGlucHV0LCBjaGVja2VkLCBzdGF0ZSwga2VlcCk7XG4gICAgfVxuICAgICAgLy8gQWRkIHByb3BlciBjdXJzb3JcbiAgICBpZiAobm9kZVtfZGlzYWJsZWRdICYmICEhb3B0aW9uKGlucHV0LCBfY3Vyc29yLCB0cnVlKSkge1xuICAgICAgcGFyZW50LmZpbmQoJy4nICsgX2lDaGVja0hlbHBlcikuY3NzKF9jdXJzb3IsICdkZWZhdWx0Jyk7XG4gICAgfVxuICAgICAgLy8gQWRkIHN0YXRlIGNsYXNzXG4gICAgcGFyZW50W19hZGRdKHNwZWNpZmljIHx8IG9wdGlvbihpbnB1dCwgc3RhdGUpIHx8ICcnKTtcblxuICAgIC8vIFNldCBBUklBIGF0dHJpYnV0ZVxuICAgIGRpc2FibGVkID8gcGFyZW50LmF0dHIoJ2FyaWEtZGlzYWJsZWQnLCAndHJ1ZScpIDogcGFyZW50LmF0dHIoJ2FyaWEtY2hlY2tlZCcsIGluZGV0ZXJtaW5hdGUgPyAnbWl4ZWQnIDogJ3RydWUnKTtcblxuICAgIC8vIFJlbW92ZSByZWd1bGFyIHN0YXRlIGNsYXNzXG4gICAgcGFyZW50W19yZW1vdmVdKHJlZ3VsYXIgfHwgb3B0aW9uKGlucHV0LCBjYWxsYmFjaykgfHwgJycpO1xuICB9XG4gICAgLy8gUmVtb3ZlIGNoZWNrZWQsIGRpc2FibGVkIG9yIGluZGV0ZXJtaW5hdGUgc3RhdGVcbiAgZnVuY3Rpb24gb2ZmKGlucHV0LCBzdGF0ZSwga2VlcCkge1xuICAgIHZhciBub2RlID0gaW5wdXRbMF0sXG4gICAgICBwYXJlbnQgPSBpbnB1dC5wYXJlbnQoKSxcbiAgICAgIGNoZWNrZWQgPSBzdGF0ZSA9PSBfY2hlY2tlZCxcbiAgICAgIGluZGV0ZXJtaW5hdGUgPSBzdGF0ZSA9PSBfaW5kZXRlcm1pbmF0ZSxcbiAgICAgIGRpc2FibGVkID0gc3RhdGUgPT0gX2Rpc2FibGVkLFxuICAgICAgY2FsbGJhY2sgPSBpbmRldGVybWluYXRlID8gX2RldGVybWluYXRlIDogY2hlY2tlZCA/IF91bmNoZWNrZWQgOiAnZW5hYmxlZCcsXG4gICAgICByZWd1bGFyID0gb3B0aW9uKGlucHV0LCBjYWxsYmFjayArIGNhcGl0YWxpemUobm9kZVtfdHlwZV0pKSxcbiAgICAgIHNwZWNpZmljID0gb3B0aW9uKGlucHV0LCBzdGF0ZSArIGNhcGl0YWxpemUobm9kZVtfdHlwZV0pKTtcblxuICAgIC8vIFByZXZlbnQgdW5uZWNlc3NhcnkgYWN0aW9uc1xuICAgIGlmIChub2RlW3N0YXRlXSAhPT0gZmFsc2UpIHtcblxuICAgICAgLy8gVG9nZ2xlIHN0YXRlXG4gICAgICBpZiAoaW5kZXRlcm1pbmF0ZSB8fCAha2VlcCB8fCBrZWVwID09ICdmb3JjZScpIHtcbiAgICAgICAgbm9kZVtzdGF0ZV0gPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgICAgLy8gVHJpZ2dlciBjYWxsYmFja3NcbiAgICAgIGNhbGxiYWNrcyhpbnB1dCwgY2hlY2tlZCwgY2FsbGJhY2ssIGtlZXApO1xuICAgIH1cbiAgICAgIC8vIEFkZCBwcm9wZXIgY3Vyc29yXG4gICAgaWYgKCFub2RlW19kaXNhYmxlZF0gJiYgISFvcHRpb24oaW5wdXQsIF9jdXJzb3IsIHRydWUpKSB7XG4gICAgICBwYXJlbnQuZmluZCgnLicgKyBfaUNoZWNrSGVscGVyKS5jc3MoX2N1cnNvciwgJ3BvaW50ZXInKTtcbiAgICB9XG4gICAgICAvLyBSZW1vdmUgc3RhdGUgY2xhc3NcbiAgICBwYXJlbnRbX3JlbW92ZV0oc3BlY2lmaWMgfHwgb3B0aW9uKGlucHV0LCBzdGF0ZSkgfHwgJycpO1xuXG4gICAgLy8gU2V0IEFSSUEgYXR0cmlidXRlXG4gICAgZGlzYWJsZWQgPyBwYXJlbnQuYXR0cignYXJpYS1kaXNhYmxlZCcsICdmYWxzZScpIDogcGFyZW50LmF0dHIoJ2FyaWEtY2hlY2tlZCcsICdmYWxzZScpO1xuXG4gICAgLy8gQWRkIHJlZ3VsYXIgc3RhdGUgY2xhc3NcbiAgICBwYXJlbnRbX2FkZF0ocmVndWxhciB8fCBvcHRpb24oaW5wdXQsIGNhbGxiYWNrKSB8fCAnJyk7XG4gIH1cbiAgICAvLyBSZW1vdmUgYWxsIHRyYWNlc1xuICBmdW5jdGlvbiB0aWR5KGlucHV0LCBjYWxsYmFjaykge1xuICAgIGlmIChpbnB1dC5kYXRhKF9pQ2hlY2spKSB7XG5cbiAgICAgIC8vIFJlbW92ZSBldmVyeXRoaW5nIGV4Y2VwdCBpbnB1dFxuICAgICAgaW5wdXQucGFyZW50KCkuaHRtbChpbnB1dC5hdHRyKCdzdHlsZScsIGlucHV0LmRhdGEoX2lDaGVjaykucyB8fCAnJykpO1xuXG4gICAgICAvLyBDYWxsYmFja1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGlucHV0W19jYWxsYmFja10oY2FsbGJhY2spO1xuICAgICAgfVxuICAgICAgICAvLyBVbmJpbmQgZXZlbnRzXG4gICAgICBpbnB1dC5vZmYoJy5pJykudW53cmFwKCk7XG4gICAgICAkKF9sYWJlbCArICdbZm9yPVwiJyArIGlucHV0WzBdLmlkICsgJ1wiXScpLmFkZChpbnB1dC5jbG9zZXN0KF9sYWJlbCkpLm9mZignLmknKTtcbiAgICB9XG4gIH1cbiAgICAvLyBHZXQgc29tZSBvcHRpb25cbiAgZnVuY3Rpb24gb3B0aW9uKGlucHV0LCBzdGF0ZSwgcmVndWxhcikge1xuICAgIGlmIChpbnB1dC5kYXRhKF9pQ2hlY2spKSB7XG4gICAgICByZXR1cm4gaW5wdXQuZGF0YShfaUNoZWNrKS5vW3N0YXRlICsgKHJlZ3VsYXIgPyAnJyA6ICdDbGFzcycpXTtcbiAgICB9XG4gIH1cbiAgICAvLyBDYXBpdGFsaXplIHNvbWUgc3RyaW5nXG4gIGZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zbGljZSgxKTtcbiAgfVxuICAgIC8vIEV4ZWN1dGFibGUgaGFuZGxlcnNcbiAgZnVuY3Rpb24gY2FsbGJhY2tzKGlucHV0LCBjaGVja2VkLCBjYWxsYmFjaywga2VlcCkge1xuICAgIGlmICgha2VlcCkge1xuICAgICAgaWYgKGNoZWNrZWQpIHtcbiAgICAgICAgaW5wdXRbX2NhbGxiYWNrXSgnaWZUb2dnbGVkJyk7XG4gICAgICB9XG4gICAgICAgIGlucHV0W19jYWxsYmFja10oJ2lmQ2hhbmdlZCcpW19jYWxsYmFja10oJ2lmJyArIGNhcGl0YWxpemUoY2FsbGJhY2spKTtcbiAgICB9XG4gIH1cbn0pKHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvKTtcbiJdfQ==

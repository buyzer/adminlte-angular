/*! Copyright (c) 2011 Piotr Rochala (http://rocha.la)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Version: 1.3.8
 *
 */
(function($) {

  $.fn.extend({
    slimScroll: function(options) {

      var defaults = {

        // width in pixels of the visible scroll area
        width : 'auto',

        // height in pixels of the visible scroll area
        height : '250px',

        // width in pixels of the scrollbar and rail
        size : '7px',

        // scrollbar color, accepts any hex/color value
        color: '#000',

        // scrollbar position - left/right
        position : 'right',

        // distance in pixels between the side edge and the scrollbar
        distance : '1px',

        // default scroll position on load - top / bottom / $('selector')
        start : 'top',

        // sets scrollbar opacity
        opacity : .4,

        // enables always-on mode for the scrollbar
        alwaysVisible : false,

        // check if we should hide the scrollbar when user is hovering over
        disableFadeOut : false,

        // sets visibility of the rail
        railVisible : false,

        // sets rail color
        railColor : '#333',

        // sets rail opacity
        railOpacity : .2,

        // whether  we should use jQuery UI Draggable to enable bar dragging
        railDraggable : true,

        // defautlt CSS class of the slimscroll rail
        railClass : 'slimScrollRail',

        // defautlt CSS class of the slimscroll bar
        barClass : 'slimScrollBar',

        // defautlt CSS class of the slimscroll wrapper
        wrapperClass : 'slimScrollDiv',

        // check if mousewheel should scroll the window if we reach top/bottom
        allowPageScroll : false,

        // scroll amount applied to each mouse wheel step
        wheelStep : 20,

        // scroll amount applied when user is using gestures
        touchScrollStep : 200,

        // sets border radius
        borderRadius: '7px',

        // sets border radius of the rail
        railBorderRadius : '7px'
      };

      var o = $.extend(defaults, options);

      // do it for every element that matches selector
      this.each(function(){

      var isOverPanel, isOverBar, isDragg, queueHide, touchDif,
        barHeight, percentScroll, lastScroll,
        divS = '<div></div>',
        minBarHeight = 30,
        releaseScroll = false;

        // used in event handlers and for better minification
        var me = $(this);

        // ensure we are not binding it again
        if (me.parent().hasClass(o.wrapperClass))
        {
            // start from last bar position
            var offset = me.scrollTop();

            // find bar and rail
            bar = me.siblings('.' + o.barClass);
            rail = me.siblings('.' + o.railClass);

            getBarHeight();

            // check if we should scroll existing instance
            if ($.isPlainObject(options))
            {
              // Pass height: auto to an existing slimscroll object to force a resize after contents have changed
              if ( 'height' in options && options.height == 'auto' ) {
                me.parent().css('height', 'auto');
                me.css('height', 'auto');
                var height = me.parent().parent().height();
                me.parent().css('height', height);
                me.css('height', height);
              } else if ('height' in options) {
                var h = options.height;
                me.parent().css('height', h);
                me.css('height', h);
              }

              if ('scrollTo' in options)
              {
                // jump to a static point
                offset = parseInt(o.scrollTo);
              }
              else if ('scrollBy' in options)
              {
                // jump by value pixels
                offset += parseInt(o.scrollBy);
              }
              else if ('destroy' in options)
              {
                // remove slimscroll elements
                bar.remove();
                rail.remove();
                me.unwrap();
                return;
              }

              // scroll content by the given offset
              scrollContent(offset, false, true);
            }

            return;
        }
        else if ($.isPlainObject(options))
        {
            if ('destroy' in options)
            {
            	return;
            }
        }

        // optionally set height to the parent's height
        o.height = (o.height == 'auto') ? me.parent().height() : o.height;

        // wrap content
        var wrapper = $(divS)
          .addClass(o.wrapperClass)
          .css({
            position: 'relative',
            overflow: 'hidden',
            width: o.width,
            height: o.height
          });

        // update style for the div
        me.css({
          overflow: 'hidden',
          width: o.width,
          height: o.height
        });

        // create scrollbar rail
        var rail = $(divS)
          .addClass(o.railClass)
          .css({
            width: o.size,
            height: '100%',
            position: 'absolute',
            top: 0,
            display: (o.alwaysVisible && o.railVisible) ? 'block' : 'none',
            'border-radius': o.railBorderRadius,
            background: o.railColor,
            opacity: o.railOpacity,
            zIndex: 90
          });

        // create scrollbar
        var bar = $(divS)
          .addClass(o.barClass)
          .css({
            background: o.color,
            width: o.size,
            position: 'absolute',
            top: 0,
            opacity: o.opacity,
            display: o.alwaysVisible ? 'block' : 'none',
            'border-radius' : o.borderRadius,
            BorderRadius: o.borderRadius,
            MozBorderRadius: o.borderRadius,
            WebkitBorderRadius: o.borderRadius,
            zIndex: 99
          });

        // set position
        var posCss = (o.position == 'right') ? { right: o.distance } : { left: o.distance };
        rail.css(posCss);
        bar.css(posCss);

        // wrap it
        me.wrap(wrapper);

        // append to parent div
        me.parent().append(bar);
        me.parent().append(rail);

        // make it draggable and no longer dependent on the jqueryUI
        if (o.railDraggable){
          bar.bind("mousedown", function(e) {
            var $doc = $(document);
            isDragg = true;
            t = parseFloat(bar.css('top'));
            pageY = e.pageY;

            $doc.bind("mousemove.slimscroll", function(e){
              currTop = t + e.pageY - pageY;
              bar.css('top', currTop);
              scrollContent(0, bar.position().top, false);// scroll content
            });

            $doc.bind("mouseup.slimscroll", function(e) {
              isDragg = false;hideBar();
              $doc.unbind('.slimscroll');
            });
            return false;
          }).bind("selectstart.slimscroll", function(e){
            e.stopPropagation();
            e.preventDefault();
            return false;
          });
        }

        // on rail over
        rail.hover(function(){
          showBar();
        }, function(){
          hideBar();
        });

        // on bar over
        bar.hover(function(){
          isOverBar = true;
        }, function(){
          isOverBar = false;
        });

        // show on parent mouseover
        me.hover(function(){
          isOverPanel = true;
          showBar();
          hideBar();
        }, function(){
          isOverPanel = false;
          hideBar();
        });

        // support for mobile
        me.bind('touchstart', function(e,b){
          if (e.originalEvent.touches.length)
          {
            // record where touch started
            touchDif = e.originalEvent.touches[0].pageY;
          }
        });

        me.bind('touchmove', function(e){
          // prevent scrolling the page if necessary
          if(!releaseScroll)
          {
  		      e.originalEvent.preventDefault();
		      }
          if (e.originalEvent.touches.length)
          {
            // see how far user swiped
            var diff = (touchDif - e.originalEvent.touches[0].pageY) / o.touchScrollStep;
            // scroll content
            scrollContent(diff, true);
            touchDif = e.originalEvent.touches[0].pageY;
          }
        });

        // set up initial height
        getBarHeight();

        // check start position
        if (o.start === 'bottom')
        {
          // scroll content to bottom
          bar.css({ top: me.outerHeight() - bar.outerHeight() });
          scrollContent(0, true);
        }
        else if (o.start !== 'top')
        {
          // assume jQuery selector
          scrollContent($(o.start).position().top, null, true);

          // make sure bar stays hidden
          if (!o.alwaysVisible) { bar.hide(); }
        }

        // attach scroll events
        attachWheel(this);

        function _onWheel(e)
        {
          // use mouse wheel only when mouse is over
          if (!isOverPanel) { return; }

          var e = e || window.event;

          var delta = 0;
          if (e.wheelDelta) { delta = -e.wheelDelta/120; }
          if (e.detail) { delta = e.detail / 3; }

          var target = e.target || e.srcTarget || e.srcElement;
          if ($(target).closest('.' + o.wrapperClass).is(me.parent())) {
            // scroll content
            scrollContent(delta, true);
          }

          // stop window scroll
          if (e.preventDefault && !releaseScroll) { e.preventDefault(); }
          if (!releaseScroll) { e.returnValue = false; }
        }

        function scrollContent(y, isWheel, isJump)
        {
          releaseScroll = false;
          var delta = y;
          var maxTop = me.outerHeight() - bar.outerHeight();

          if (isWheel)
          {
            // move bar with mouse wheel
            delta = parseInt(bar.css('top')) + y * parseInt(o.wheelStep) / 100 * bar.outerHeight();

            // move bar, make sure it doesn't go out
            delta = Math.min(Math.max(delta, 0), maxTop);

            // if scrolling down, make sure a fractional change to the
            // scroll position isn't rounded away when the scrollbar's CSS is set
            // this flooring of delta would happened automatically when
            // bar.css is set below, but we floor here for clarity
            delta = (y > 0) ? Math.ceil(delta) : Math.floor(delta);

            // scroll the scrollbar
            bar.css({ top: delta + 'px' });
          }

          // calculate actual scroll amount
          percentScroll = parseInt(bar.css('top')) / (me.outerHeight() - bar.outerHeight());
          delta = percentScroll * (me[0].scrollHeight - me.outerHeight());

          if (isJump)
          {
            delta = y;
            var offsetTop = delta / me[0].scrollHeight * me.outerHeight();
            offsetTop = Math.min(Math.max(offsetTop, 0), maxTop);
            bar.css({ top: offsetTop + 'px' });
          }

          // scroll content
          me.scrollTop(delta);

          // fire scrolling event
          me.trigger('slimscrolling', ~~delta);

          // ensure bar is visible
          showBar();

          // trigger hide when scroll is stopped
          hideBar();
        }

        function attachWheel(target)
        {
          if (window.addEventListener)
          {
            target.addEventListener('DOMMouseScroll', _onWheel, false );
            target.addEventListener('mousewheel', _onWheel, false );
          }
          else
          {
            document.attachEvent("onmousewheel", _onWheel)
          }
        }

        function getBarHeight()
        {
          // calculate scrollbar height and make sure it is not too small
          barHeight = Math.max((me.outerHeight() / me[0].scrollHeight) * me.outerHeight(), minBarHeight);
          bar.css({ height: barHeight + 'px' });

          // hide scrollbar if content is not long enough
          var display = barHeight == me.outerHeight() ? 'none' : 'block';
          bar.css({ display: display });
        }

        function showBar()
        {
          // recalculate bar height
          getBarHeight();
          clearTimeout(queueHide);

          // when bar reached top or bottom
          if (percentScroll == ~~percentScroll)
          {
            //release wheel
            releaseScroll = o.allowPageScroll;

            // publish approporiate event
            if (lastScroll != percentScroll)
            {
                var msg = (~~percentScroll == 0) ? 'top' : 'bottom';
                me.trigger('slimscroll', msg);
            }
          }
          else
          {
            releaseScroll = false;
          }
          lastScroll = percentScroll;

          // show only when required
          if(barHeight >= me.outerHeight()) {
            //allow window scroll
            releaseScroll = true;
            return;
          }
          bar.stop(true,true).fadeIn('fast');
          if (o.railVisible) { rail.stop(true,true).fadeIn('fast'); }
        }

        function hideBar()
        {
          // only hide when options allow it
          if (!o.alwaysVisible)
          {
            queueHide = setTimeout(function(){
              if (!(o.disableFadeOut && isOverPanel) && !isOverBar && !isDragg)
              {
                bar.fadeOut('slow');
                rail.fadeOut('slow');
              }
            }, 1000);
          }
        }

      });

      // maintain chainability
      return this;
    }
  });

  $.fn.extend({
    slimscroll: $.fn.slimScroll
  });

})(jQuery);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS5zbGltc2Nyb2xsLmpzIl0sIm5hbWVzIjpbIiQiLCJmbiIsImV4dGVuZCIsInNsaW1TY3JvbGwiLCJvcHRpb25zIiwiZGVmYXVsdHMiLCJ3aWR0aCIsImhlaWdodCIsInNpemUiLCJjb2xvciIsInBvc2l0aW9uIiwiZGlzdGFuY2UiLCJzdGFydCIsIm9wYWNpdHkiLCJhbHdheXNWaXNpYmxlIiwiZGlzYWJsZUZhZGVPdXQiLCJyYWlsVmlzaWJsZSIsInJhaWxDb2xvciIsInJhaWxPcGFjaXR5IiwicmFpbERyYWdnYWJsZSIsInJhaWxDbGFzcyIsImJhckNsYXNzIiwid3JhcHBlckNsYXNzIiwiYWxsb3dQYWdlU2Nyb2xsIiwid2hlZWxTdGVwIiwidG91Y2hTY3JvbGxTdGVwIiwiYm9yZGVyUmFkaXVzIiwicmFpbEJvcmRlclJhZGl1cyIsIm8iLCJ0aGlzIiwiZWFjaCIsIl9vbldoZWVsIiwiZSIsImlzT3ZlclBhbmVsIiwid2luZG93IiwiZXZlbnQiLCJkZWx0YSIsIndoZWVsRGVsdGEiLCJkZXRhaWwiLCJ0YXJnZXQiLCJzcmNUYXJnZXQiLCJzcmNFbGVtZW50IiwiY2xvc2VzdCIsImlzIiwibWUiLCJwYXJlbnQiLCJzY3JvbGxDb250ZW50IiwicHJldmVudERlZmF1bHQiLCJyZWxlYXNlU2Nyb2xsIiwicmV0dXJuVmFsdWUiLCJ5IiwiaXNXaGVlbCIsImlzSnVtcCIsIm1heFRvcCIsIm91dGVySGVpZ2h0IiwiYmFyIiwicGFyc2VJbnQiLCJjc3MiLCJNYXRoIiwibWluIiwibWF4IiwiY2VpbCIsImZsb29yIiwidG9wIiwicGVyY2VudFNjcm9sbCIsInNjcm9sbEhlaWdodCIsIm9mZnNldFRvcCIsInNjcm9sbFRvcCIsInRyaWdnZXIiLCJzaG93QmFyIiwiaGlkZUJhciIsImF0dGFjaFdoZWVsIiwiYWRkRXZlbnRMaXN0ZW5lciIsImRvY3VtZW50IiwiYXR0YWNoRXZlbnQiLCJnZXRCYXJIZWlnaHQiLCJiYXJIZWlnaHQiLCJtaW5CYXJIZWlnaHQiLCJkaXNwbGF5IiwiY2xlYXJUaW1lb3V0IiwicXVldWVIaWRlIiwibGFzdFNjcm9sbCIsIm1zZyIsInN0b3AiLCJmYWRlSW4iLCJyYWlsIiwic2V0VGltZW91dCIsImlzT3ZlckJhciIsImlzRHJhZ2ciLCJmYWRlT3V0IiwidG91Y2hEaWYiLCJkaXZTIiwiaGFzQ2xhc3MiLCJvZmZzZXQiLCJzaWJsaW5ncyIsImlzUGxhaW5PYmplY3QiLCJoIiwic2Nyb2xsVG8iLCJzY3JvbGxCeSIsInJlbW92ZSIsInVud3JhcCIsIndyYXBwZXIiLCJhZGRDbGFzcyIsIm92ZXJmbG93IiwiYm9yZGVyLXJhZGl1cyIsImJhY2tncm91bmQiLCJ6SW5kZXgiLCJCb3JkZXJSYWRpdXMiLCJNb3pCb3JkZXJSYWRpdXMiLCJXZWJraXRCb3JkZXJSYWRpdXMiLCJwb3NDc3MiLCJyaWdodCIsImxlZnQiLCJ3cmFwIiwiYXBwZW5kIiwiYmluZCIsIiRkb2MiLCJ0IiwicGFyc2VGbG9hdCIsInBhZ2VZIiwiY3VyclRvcCIsInVuYmluZCIsInN0b3BQcm9wYWdhdGlvbiIsImhvdmVyIiwiYiIsIm9yaWdpbmFsRXZlbnQiLCJ0b3VjaGVzIiwibGVuZ3RoIiwiZGlmZiIsImhpZGUiLCJzbGltc2Nyb2xsIiwialF1ZXJ5Il0sIm1hcHBpbmdzIjoiQ0FPQSxTQUFVQSxHQUVSQSxFQUFFQyxHQUFHQyxRQUNIQyxXQUFZLFNBQVNDLEdBRW5CLEdBQUlDLElBR0ZDLE1BQVEsT0FHUkMsT0FBUyxRQUdUQyxLQUFPLE1BR1BDLE1BQU8sT0FHUEMsU0FBVyxRQUdYQyxTQUFXLE1BR1hDLE1BQVEsTUFHUkMsUUFBVSxHQUdWQyxlQUFnQixFQUdoQkMsZ0JBQWlCLEVBR2pCQyxhQUFjLEVBR2RDLFVBQVksT0FHWkMsWUFBYyxHQUdkQyxlQUFnQixFQUdoQkMsVUFBWSxpQkFHWkMsU0FBVyxnQkFHWEMsYUFBZSxnQkFHZkMsaUJBQWtCLEVBR2xCQyxVQUFZLEdBR1pDLGdCQUFrQixJQUdsQkMsYUFBYyxNQUdkQyxpQkFBbUIsT0FHakJDLEVB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QUFabEIsRUFBRWhCLFFBR1RrQyxFQUFjOUMsRUFBRTRCLEVBQUVoQixPQUFPRixXQUFXcUQsSUFBSyxNQUFNLEdBRzFDbkMsRUFBRWQsZUFBaUJ5QyxFQUFJMEUsUUFJOUIxRCxFQUFZMUMsU0FzSlBBLFFBSVg3QixFQUFFQyxHQUFHQyxRQUNIZ0ksV0FBWWxJLEVBQUVDLEdBQUdFLGNBR2xCZ0kiLCJmaWxlIjoianF1ZXJ5LnNsaW1zY3JvbGwtZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiEgQ29weXJpZ2h0IChjKSAyMDExIFBpb3RyIFJvY2hhbGEgKGh0dHA6Ly9yb2NoYS5sYSlcbiAqIER1YWwgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHApXG4gKiBhbmQgR1BMIChodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL2dwbC1saWNlbnNlLnBocCkgbGljZW5zZXMuXG4gKlxuICogVmVyc2lvbjogMS4zLjhcbiAqXG4gKi9cbihmdW5jdGlvbigkKSB7XG5cbiAgJC5mbi5leHRlbmQoe1xuICAgIHNsaW1TY3JvbGw6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgICAgdmFyIGRlZmF1bHRzID0ge1xuXG4gICAgICAgIC8vIHdpZHRoIGluIHBpeGVscyBvZiB0aGUgdmlzaWJsZSBzY3JvbGwgYXJlYVxuICAgICAgICB3aWR0aCA6ICdhdXRvJyxcblxuICAgICAgICAvLyBoZWlnaHQgaW4gcGl4ZWxzIG9mIHRoZSB2aXNpYmxlIHNjcm9sbCBhcmVhXG4gICAgICAgIGhlaWdodCA6ICcyNTBweCcsXG5cbiAgICAgICAgLy8gd2lkdGggaW4gcGl4ZWxzIG9mIHRoZSBzY3JvbGxiYXIgYW5kIHJhaWxcbiAgICAgICAgc2l6ZSA6ICc3cHgnLFxuXG4gICAgICAgIC8vIHNjcm9sbGJhciBjb2xvciwgYWNjZXB0cyBhbnkgaGV4L2NvbG9yIHZhbHVlXG4gICAgICAgIGNvbG9yOiAnIzAwMCcsXG5cbiAgICAgICAgLy8gc2Nyb2xsYmFyIHBvc2l0aW9uIC0gbGVmdC9yaWdodFxuICAgICAgICBwb3NpdGlvbiA6ICdyaWdodCcsXG5cbiAgICAgICAgLy8gZGlzdGFuY2UgaW4gcGl4ZWxzIGJldHdlZW4gdGhlIHNpZGUgZWRnZSBhbmQgdGhlIHNjcm9sbGJhclxuICAgICAgICBkaXN0YW5jZSA6ICcxcHgnLFxuXG4gICAgICAgIC8vIGRlZmF1bHQgc2Nyb2xsIHBvc2l0aW9uIG9uIGxvYWQgLSB0b3AgLyBib3R0b20gLyAkKCdzZWxlY3RvcicpXG4gICAgICAgIHN0YXJ0IDogJ3RvcCcsXG5cbiAgICAgICAgLy8gc2V0cyBzY3JvbGxiYXIgb3BhY2l0eVxuICAgICAgICBvcGFjaXR5IDogLjQsXG5cbiAgICAgICAgLy8gZW5hYmxlcyBhbHdheXMtb24gbW9kZSBmb3IgdGhlIHNjcm9sbGJhclxuICAgICAgICBhbHdheXNWaXNpYmxlIDogZmFsc2UsXG5cbiAgICAgICAgLy8gY2hlY2sgaWYgd2Ugc2hvdWxkIGhpZGUgdGhlIHNjcm9sbGJhciB3aGVuIHVzZXIgaXMgaG92ZXJpbmcgb3ZlclxuICAgICAgICBkaXNhYmxlRmFkZU91dCA6IGZhbHNlLFxuXG4gICAgICAgIC8vIHNldHMgdmlzaWJpbGl0eSBvZiB0aGUgcmFpbFxuICAgICAgICByYWlsVmlzaWJsZSA6IGZhbHNlLFxuXG4gICAgICAgIC8vIHNldHMgcmFpbCBjb2xvclxuICAgICAgICByYWlsQ29sb3IgOiAnIzMzMycsXG5cbiAgICAgICAgLy8gc2V0cyByYWlsIG9wYWNpdHlcbiAgICAgICAgcmFpbE9wYWNpdHkgOiAuMixcblxuICAgICAgICAvLyB3aGV0aGVyICB3ZSBzaG91bGQgdXNlIGpRdWVyeSBVSSBEcmFnZ2FibGUgdG8gZW5hYmxlIGJhciBkcmFnZ2luZ1xuICAgICAgICByYWlsRHJhZ2dhYmxlIDogdHJ1ZSxcblxuICAgICAgICAvLyBkZWZhdXRsdCBDU1MgY2xhc3Mgb2YgdGhlIHNsaW1zY3JvbGwgcmFpbFxuICAgICAgICByYWlsQ2xhc3MgOiAnc2xpbVNjcm9sbFJhaWwnLFxuXG4gICAgICAgIC8vIGRlZmF1dGx0IENTUyBjbGFzcyBvZiB0aGUgc2xpbXNjcm9sbCBiYXJcbiAgICAgICAgYmFyQ2xhc3MgOiAnc2xpbVNjcm9sbEJhcicsXG5cbiAgICAgICAgLy8gZGVmYXV0bHQgQ1NTIGNsYXNzIG9mIHRoZSBzbGltc2Nyb2xsIHdyYXBwZXJcbiAgICAgICAgd3JhcHBlckNsYXNzIDogJ3NsaW1TY3JvbGxEaXYnLFxuXG4gICAgICAgIC8vIGNoZWNrIGlmIG1vdXNld2hlZWwgc2hvdWxkIHNjcm9sbCB0aGUgd2luZG93IGlmIHdlIHJlYWNoIHRvcC9ib3R0b21cbiAgICAgICAgYWxsb3dQYWdlU2Nyb2xsIDogZmFsc2UsXG5cbiAgICAgICAgLy8gc2Nyb2xsIGFtb3VudCBhcHBsaWVkIHRvIGVhY2ggbW91c2Ugd2hlZWwgc3RlcFxuICAgICAgICB3aGVlbFN0ZXAgOiAyMCxcblxuICAgICAgICAvLyBzY3JvbGwgYW1vdW50IGFwcGxpZWQgd2hlbiB1c2VyIGlzIHVzaW5nIGdlc3R1cmVzXG4gICAgICAgIHRvdWNoU2Nyb2xsU3RlcCA6IDIwMCxcblxuICAgICAgICAvLyBzZXRzIGJvcmRlciByYWRpdXNcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAnN3B4JyxcblxuICAgICAgICAvLyBzZXRzIGJvcmRlciByYWRpdXMgb2YgdGhlIHJhaWxcbiAgICAgICAgcmFpbEJvcmRlclJhZGl1cyA6ICc3cHgnXG4gICAgICB9O1xuXG4gICAgICB2YXIgbyA9ICQuZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgICAgLy8gZG8gaXQgZm9yIGV2ZXJ5IGVsZW1lbnQgdGhhdCBtYXRjaGVzIHNlbGVjdG9yXG4gICAgICB0aGlzLmVhY2goZnVuY3Rpb24oKXtcblxuICAgICAgdmFyIGlzT3ZlclBhbmVsLCBpc092ZXJCYXIsIGlzRHJhZ2csIHF1ZXVlSGlkZSwgdG91Y2hEaWYsXG4gICAgICAgIGJhckhlaWdodCwgcGVyY2VudFNjcm9sbCwgbGFzdFNjcm9sbCxcbiAgICAgICAgZGl2UyA9ICc8ZGl2PjwvZGl2PicsXG4gICAgICAgIG1pbkJhckhlaWdodCA9IDMwLFxuICAgICAgICByZWxlYXNlU2Nyb2xsID0gZmFsc2U7XG5cbiAgICAgICAgLy8gdXNlZCBpbiBldmVudCBoYW5kbGVycyBhbmQgZm9yIGJldHRlciBtaW5pZmljYXRpb25cbiAgICAgICAgdmFyIG1lID0gJCh0aGlzKTtcblxuICAgICAgICAvLyBlbnN1cmUgd2UgYXJlIG5vdCBiaW5kaW5nIGl0IGFnYWluXG4gICAgICAgIGlmIChtZS5wYXJlbnQoKS5oYXNDbGFzcyhvLndyYXBwZXJDbGFzcykpXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIHN0YXJ0IGZyb20gbGFzdCBiYXIgcG9zaXRpb25cbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSBtZS5zY3JvbGxUb3AoKTtcblxuICAgICAgICAgICAgLy8gZmluZCBiYXIgYW5kIHJhaWxcbiAgICAgICAgICAgIGJhciA9IG1lLnNpYmxpbmdzKCcuJyArIG8uYmFyQ2xhc3MpO1xuICAgICAgICAgICAgcmFpbCA9IG1lLnNpYmxpbmdzKCcuJyArIG8ucmFpbENsYXNzKTtcblxuICAgICAgICAgICAgZ2V0QmFySGVpZ2h0KCk7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHdlIHNob3VsZCBzY3JvbGwgZXhpc3RpbmcgaW5zdGFuY2VcbiAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3Qob3B0aW9ucykpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIC8vIFBhc3MgaGVpZ2h0OiBhdXRvIHRvIGFuIGV4aXN0aW5nIHNsaW1zY3JvbGwgb2JqZWN0IHRvIGZvcmNlIGEgcmVzaXplIGFmdGVyIGNvbnRlbnRzIGhhdmUgY2hhbmdlZFxuICAgICAgICAgICAgICBpZiAoICdoZWlnaHQnIGluIG9wdGlvbnMgJiYgb3B0aW9ucy5oZWlnaHQgPT0gJ2F1dG8nICkge1xuICAgICAgICAgICAgICAgIG1lLnBhcmVudCgpLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcbiAgICAgICAgICAgICAgICBtZS5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XG4gICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IG1lLnBhcmVudCgpLnBhcmVudCgpLmhlaWdodCgpO1xuICAgICAgICAgICAgICAgIG1lLnBhcmVudCgpLmNzcygnaGVpZ2h0JywgaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBtZS5jc3MoJ2hlaWdodCcsIGhlaWdodCk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoJ2hlaWdodCcgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBoID0gb3B0aW9ucy5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgbWUucGFyZW50KCkuY3NzKCdoZWlnaHQnLCBoKTtcbiAgICAgICAgICAgICAgICBtZS5jc3MoJ2hlaWdodCcsIGgpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKCdzY3JvbGxUbycgaW4gb3B0aW9ucylcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIGp1bXAgdG8gYSBzdGF0aWMgcG9pbnRcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUludChvLnNjcm9sbFRvKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIGlmICgnc2Nyb2xsQnknIGluIG9wdGlvbnMpXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAvLyBqdW1wIGJ5IHZhbHVlIHBpeGVsc1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSBwYXJzZUludChvLnNjcm9sbEJ5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIGlmICgnZGVzdHJveScgaW4gb3B0aW9ucylcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBzbGltc2Nyb2xsIGVsZW1lbnRzXG4gICAgICAgICAgICAgICAgYmFyLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHJhaWwucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgbWUudW53cmFwKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gc2Nyb2xsIGNvbnRlbnQgYnkgdGhlIGdpdmVuIG9mZnNldFxuICAgICAgICAgICAgICBzY3JvbGxDb250ZW50KG9mZnNldCwgZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoJC5pc1BsYWluT2JqZWN0KG9wdGlvbnMpKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAoJ2Rlc3Ryb3knIGluIG9wdGlvbnMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICBcdHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG9wdGlvbmFsbHkgc2V0IGhlaWdodCB0byB0aGUgcGFyZW50J3MgaGVpZ2h0XG4gICAgICAgIG8uaGVpZ2h0ID0gKG8uaGVpZ2h0ID09ICdhdXRvJykgPyBtZS5wYXJlbnQoKS5oZWlnaHQoKSA6IG8uaGVpZ2h0O1xuXG4gICAgICAgIC8vIHdyYXAgY29udGVudFxuICAgICAgICB2YXIgd3JhcHBlciA9ICQoZGl2UylcbiAgICAgICAgICAuYWRkQ2xhc3Moby53cmFwcGVyQ2xhc3MpXG4gICAgICAgICAgLmNzcyh7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgICAgICAgIHdpZHRoOiBvLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBvLmhlaWdodFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHVwZGF0ZSBzdHlsZSBmb3IgdGhlIGRpdlxuICAgICAgICBtZS5jc3Moe1xuICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgICAgICB3aWR0aDogby53aWR0aCxcbiAgICAgICAgICBoZWlnaHQ6IG8uaGVpZ2h0XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBzY3JvbGxiYXIgcmFpbFxuICAgICAgICB2YXIgcmFpbCA9ICQoZGl2UylcbiAgICAgICAgICAuYWRkQ2xhc3Moby5yYWlsQ2xhc3MpXG4gICAgICAgICAgLmNzcyh7XG4gICAgICAgICAgICB3aWR0aDogby5zaXplLFxuICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIGRpc3BsYXk6IChvLmFsd2F5c1Zpc2libGUgJiYgby5yYWlsVmlzaWJsZSkgPyAnYmxvY2snIDogJ25vbmUnLFxuICAgICAgICAgICAgJ2JvcmRlci1yYWRpdXMnOiBvLnJhaWxCb3JkZXJSYWRpdXMsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiBvLnJhaWxDb2xvcixcbiAgICAgICAgICAgIG9wYWNpdHk6IG8ucmFpbE9wYWNpdHksXG4gICAgICAgICAgICB6SW5kZXg6IDkwXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gY3JlYXRlIHNjcm9sbGJhclxuICAgICAgICB2YXIgYmFyID0gJChkaXZTKVxuICAgICAgICAgIC5hZGRDbGFzcyhvLmJhckNsYXNzKVxuICAgICAgICAgIC5jc3Moe1xuICAgICAgICAgICAgYmFja2dyb3VuZDogby5jb2xvcixcbiAgICAgICAgICAgIHdpZHRoOiBvLnNpemUsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIG9wYWNpdHk6IG8ub3BhY2l0eSxcbiAgICAgICAgICAgIGRpc3BsYXk6IG8uYWx3YXlzVmlzaWJsZSA/ICdibG9jaycgOiAnbm9uZScsXG4gICAgICAgICAgICAnYm9yZGVyLXJhZGl1cycgOiBvLmJvcmRlclJhZGl1cyxcbiAgICAgICAgICAgIEJvcmRlclJhZGl1czogby5ib3JkZXJSYWRpdXMsXG4gICAgICAgICAgICBNb3pCb3JkZXJSYWRpdXM6IG8uYm9yZGVyUmFkaXVzLFxuICAgICAgICAgICAgV2Via2l0Qm9yZGVyUmFkaXVzOiBvLmJvcmRlclJhZGl1cyxcbiAgICAgICAgICAgIHpJbmRleDogOTlcbiAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBzZXQgcG9zaXRpb25cbiAgICAgICAgdmFyIHBvc0NzcyA9IChvLnBvc2l0aW9uID09ICdyaWdodCcpID8geyByaWdodDogby5kaXN0YW5jZSB9IDogeyBsZWZ0OiBvLmRpc3RhbmNlIH07XG4gICAgICAgIHJhaWwuY3NzKHBvc0Nzcyk7XG4gICAgICAgIGJhci5jc3MocG9zQ3NzKTtcblxuICAgICAgICAvLyB3cmFwIGl0XG4gICAgICAgIG1lLndyYXAod3JhcHBlcik7XG5cbiAgICAgICAgLy8gYXBwZW5kIHRvIHBhcmVudCBkaXZcbiAgICAgICAgbWUucGFyZW50KCkuYXBwZW5kKGJhcik7XG4gICAgICAgIG1lLnBhcmVudCgpLmFwcGVuZChyYWlsKTtcblxuICAgICAgICAvLyBtYWtlIGl0IGRyYWdnYWJsZSBhbmQgbm8gbG9uZ2VyIGRlcGVuZGVudCBvbiB0aGUganF1ZXJ5VUlcbiAgICAgICAgaWYgKG8ucmFpbERyYWdnYWJsZSl7XG4gICAgICAgICAgYmFyLmJpbmQoXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyICRkb2MgPSAkKGRvY3VtZW50KTtcbiAgICAgICAgICAgIGlzRHJhZ2cgPSB0cnVlO1xuICAgICAgICAgICAgdCA9IHBhcnNlRmxvYXQoYmFyLmNzcygndG9wJykpO1xuICAgICAgICAgICAgcGFnZVkgPSBlLnBhZ2VZO1xuXG4gICAgICAgICAgICAkZG9jLmJpbmQoXCJtb3VzZW1vdmUuc2xpbXNjcm9sbFwiLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgY3VyclRvcCA9IHQgKyBlLnBhZ2VZIC0gcGFnZVk7XG4gICAgICAgICAgICAgIGJhci5jc3MoJ3RvcCcsIGN1cnJUb3ApO1xuICAgICAgICAgICAgICBzY3JvbGxDb250ZW50KDAsIGJhci5wb3NpdGlvbigpLnRvcCwgZmFsc2UpOy8vIHNjcm9sbCBjb250ZW50XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJGRvYy5iaW5kKFwibW91c2V1cC5zbGltc2Nyb2xsXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgaXNEcmFnZyA9IGZhbHNlO2hpZGVCYXIoKTtcbiAgICAgICAgICAgICAgJGRvYy51bmJpbmQoJy5zbGltc2Nyb2xsJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9KS5iaW5kKFwic2VsZWN0c3RhcnQuc2xpbXNjcm9sbFwiLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBvbiByYWlsIG92ZXJcbiAgICAgICAgcmFpbC5ob3ZlcihmdW5jdGlvbigpe1xuICAgICAgICAgIHNob3dCYXIoKTtcbiAgICAgICAgfSwgZnVuY3Rpb24oKXtcbiAgICAgICAgICBoaWRlQmFyKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIG9uIGJhciBvdmVyXG4gICAgICAgIGJhci5ob3ZlcihmdW5jdGlvbigpe1xuICAgICAgICAgIGlzT3ZlckJhciA9IHRydWU7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgaXNPdmVyQmFyID0gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHNob3cgb24gcGFyZW50IG1vdXNlb3ZlclxuICAgICAgICBtZS5ob3ZlcihmdW5jdGlvbigpe1xuICAgICAgICAgIGlzT3ZlclBhbmVsID0gdHJ1ZTtcbiAgICAgICAgICBzaG93QmFyKCk7XG4gICAgICAgICAgaGlkZUJhcigpO1xuICAgICAgICB9LCBmdW5jdGlvbigpe1xuICAgICAgICAgIGlzT3ZlclBhbmVsID0gZmFsc2U7XG4gICAgICAgICAgaGlkZUJhcigpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBzdXBwb3J0IGZvciBtb2JpbGVcbiAgICAgICAgbWUuYmluZCgndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGUsYil7XG4gICAgICAgICAgaWYgKGUub3JpZ2luYWxFdmVudC50b3VjaGVzLmxlbmd0aClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAvLyByZWNvcmQgd2hlcmUgdG91Y2ggc3RhcnRlZFxuICAgICAgICAgICAgdG91Y2hEaWYgPSBlLm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXS5wYWdlWTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1lLmJpbmQoJ3RvdWNobW92ZScsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIC8vIHByZXZlbnQgc2Nyb2xsaW5nIHRoZSBwYWdlIGlmIG5lY2Vzc2FyeVxuICAgICAgICAgIGlmKCFyZWxlYXNlU2Nyb2xsKVxuICAgICAgICAgIHtcbiAgXHRcdCAgICAgIGUub3JpZ2luYWxFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdCAgICAgIH1cbiAgICAgICAgICBpZiAoZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXMubGVuZ3RoKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIC8vIHNlZSBob3cgZmFyIHVzZXIgc3dpcGVkXG4gICAgICAgICAgICB2YXIgZGlmZiA9ICh0b3VjaERpZiAtIGUub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdLnBhZ2VZKSAvIG8udG91Y2hTY3JvbGxTdGVwO1xuICAgICAgICAgICAgLy8gc2Nyb2xsIGNvbnRlbnRcbiAgICAgICAgICAgIHNjcm9sbENvbnRlbnQoZGlmZiwgdHJ1ZSk7XG4gICAgICAgICAgICB0b3VjaERpZiA9IGUub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc2V0IHVwIGluaXRpYWwgaGVpZ2h0XG4gICAgICAgIGdldEJhckhlaWdodCgpO1xuXG4gICAgICAgIC8vIGNoZWNrIHN0YXJ0IHBvc2l0aW9uXG4gICAgICAgIGlmIChvLnN0YXJ0ID09PSAnYm90dG9tJylcbiAgICAgICAge1xuICAgICAgICAgIC8vIHNjcm9sbCBjb250ZW50IHRvIGJvdHRvbVxuICAgICAgICAgIGJhci5jc3MoeyB0b3A6IG1lLm91dGVySGVpZ2h0KCkgLSBiYXIub3V0ZXJIZWlnaHQoKSB9KTtcbiAgICAgICAgICBzY3JvbGxDb250ZW50KDAsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG8uc3RhcnQgIT09ICd0b3AnKVxuICAgICAgICB7XG4gICAgICAgICAgLy8gYXNzdW1lIGpRdWVyeSBzZWxlY3RvclxuICAgICAgICAgIHNjcm9sbENvbnRlbnQoJChvLnN0YXJ0KS5wb3NpdGlvbigpLnRvcCwgbnVsbCwgdHJ1ZSk7XG5cbiAgICAgICAgICAvLyBtYWtlIHN1cmUgYmFyIHN0YXlzIGhpZGRlblxuICAgICAgICAgIGlmICghby5hbHdheXNWaXNpYmxlKSB7IGJhci5oaWRlKCk7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGF0dGFjaCBzY3JvbGwgZXZlbnRzXG4gICAgICAgIGF0dGFjaFdoZWVsKHRoaXMpO1xuXG4gICAgICAgIGZ1bmN0aW9uIF9vbldoZWVsKGUpXG4gICAgICAgIHtcbiAgICAgICAgICAvLyB1c2UgbW91c2Ugd2hlZWwgb25seSB3aGVuIG1vdXNlIGlzIG92ZXJcbiAgICAgICAgICBpZiAoIWlzT3ZlclBhbmVsKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgdmFyIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcblxuICAgICAgICAgIHZhciBkZWx0YSA9IDA7XG4gICAgICAgICAgaWYgKGUud2hlZWxEZWx0YSkgeyBkZWx0YSA9IC1lLndoZWVsRGVsdGEvMTIwOyB9XG4gICAgICAgICAgaWYgKGUuZGV0YWlsKSB7IGRlbHRhID0gZS5kZXRhaWwgLyAzOyB9XG5cbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNUYXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgICAgICAgIGlmICgkKHRhcmdldCkuY2xvc2VzdCgnLicgKyBvLndyYXBwZXJDbGFzcykuaXMobWUucGFyZW50KCkpKSB7XG4gICAgICAgICAgICAvLyBzY3JvbGwgY29udGVudFxuICAgICAgICAgICAgc2Nyb2xsQ29udGVudChkZWx0YSwgdHJ1ZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gc3RvcCB3aW5kb3cgc2Nyb2xsXG4gICAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQgJiYgIXJlbGVhc2VTY3JvbGwpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyB9XG4gICAgICAgICAgaWYgKCFyZWxlYXNlU2Nyb2xsKSB7IGUucmV0dXJuVmFsdWUgPSBmYWxzZTsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2Nyb2xsQ29udGVudCh5LCBpc1doZWVsLCBpc0p1bXApXG4gICAgICAgIHtcbiAgICAgICAgICByZWxlYXNlU2Nyb2xsID0gZmFsc2U7XG4gICAgICAgICAgdmFyIGRlbHRhID0geTtcbiAgICAgICAgICB2YXIgbWF4VG9wID0gbWUub3V0ZXJIZWlnaHQoKSAtIGJhci5vdXRlckhlaWdodCgpO1xuXG4gICAgICAgICAgaWYgKGlzV2hlZWwpXG4gICAgICAgICAge1xuICAgICAgICAgICAgLy8gbW92ZSBiYXIgd2l0aCBtb3VzZSB3aGVlbFxuICAgICAgICAgICAgZGVsdGEgPSBwYXJzZUludChiYXIuY3NzKCd0b3AnKSkgKyB5ICogcGFyc2VJbnQoby53aGVlbFN0ZXApIC8gMTAwICogYmFyLm91dGVySGVpZ2h0KCk7XG5cbiAgICAgICAgICAgIC8vIG1vdmUgYmFyLCBtYWtlIHN1cmUgaXQgZG9lc24ndCBnbyBvdXRcbiAgICAgICAgICAgIGRlbHRhID0gTWF0aC5taW4oTWF0aC5tYXgoZGVsdGEsIDApLCBtYXhUb3ApO1xuXG4gICAgICAgICAgICAvLyBpZiBzY3JvbGxpbmcgZG93biwgbWFrZSBzdXJlIGEgZnJhY3Rpb25hbCBjaGFuZ2UgdG8gdGhlXG4gICAgICAgICAgICAvLyBzY3JvbGwgcG9zaXRpb24gaXNuJ3Qgcm91bmRlZCBhd2F5IHdoZW4gdGhlIHNjcm9sbGJhcidzIENTUyBpcyBzZXRcbiAgICAgICAgICAgIC8vIHRoaXMgZmxvb3Jpbmcgb2YgZGVsdGEgd291bGQgaGFwcGVuZWQgYXV0b21hdGljYWxseSB3aGVuXG4gICAgICAgICAgICAvLyBiYXIuY3NzIGlzIHNldCBiZWxvdywgYnV0IHdlIGZsb29yIGhlcmUgZm9yIGNsYXJpdHlcbiAgICAgICAgICAgIGRlbHRhID0gKHkgPiAwKSA/IE1hdGguY2VpbChkZWx0YSkgOiBNYXRoLmZsb29yKGRlbHRhKTtcblxuICAgICAgICAgICAgLy8gc2Nyb2xsIHRoZSBzY3JvbGxiYXJcbiAgICAgICAgICAgIGJhci5jc3MoeyB0b3A6IGRlbHRhICsgJ3B4JyB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBjYWxjdWxhdGUgYWN0dWFsIHNjcm9sbCBhbW91bnRcbiAgICAgICAgICBwZXJjZW50U2Nyb2xsID0gcGFyc2VJbnQoYmFyLmNzcygndG9wJykpIC8gKG1lLm91dGVySGVpZ2h0KCkgLSBiYXIub3V0ZXJIZWlnaHQoKSk7XG4gICAgICAgICAgZGVsdGEgPSBwZXJjZW50U2Nyb2xsICogKG1lWzBdLnNjcm9sbEhlaWdodCAtIG1lLm91dGVySGVpZ2h0KCkpO1xuXG4gICAgICAgICAgaWYgKGlzSnVtcClcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkZWx0YSA9IHk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0VG9wID0gZGVsdGEgLyBtZVswXS5zY3JvbGxIZWlnaHQgKiBtZS5vdXRlckhlaWdodCgpO1xuICAgICAgICAgICAgb2Zmc2V0VG9wID0gTWF0aC5taW4oTWF0aC5tYXgob2Zmc2V0VG9wLCAwKSwgbWF4VG9wKTtcbiAgICAgICAgICAgIGJhci5jc3MoeyB0b3A6IG9mZnNldFRvcCArICdweCcgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gc2Nyb2xsIGNvbnRlbnRcbiAgICAgICAgICBtZS5zY3JvbGxUb3AoZGVsdGEpO1xuXG4gICAgICAgICAgLy8gZmlyZSBzY3JvbGxpbmcgZXZlbnRcbiAgICAgICAgICBtZS50cmlnZ2VyKCdzbGltc2Nyb2xsaW5nJywgfn5kZWx0YSk7XG5cbiAgICAgICAgICAvLyBlbnN1cmUgYmFyIGlzIHZpc2libGVcbiAgICAgICAgICBzaG93QmFyKCk7XG5cbiAgICAgICAgICAvLyB0cmlnZ2VyIGhpZGUgd2hlbiBzY3JvbGwgaXMgc3RvcHBlZFxuICAgICAgICAgIGhpZGVCYXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGF0dGFjaFdoZWVsKHRhcmdldClcbiAgICAgICAge1xuICAgICAgICAgIGlmICh3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcilcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcignRE9NTW91c2VTY3JvbGwnLCBfb25XaGVlbCwgZmFsc2UgKTtcbiAgICAgICAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJywgX29uV2hlZWwsIGZhbHNlICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkb2N1bWVudC5hdHRhY2hFdmVudChcIm9ubW91c2V3aGVlbFwiLCBfb25XaGVlbClcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRCYXJIZWlnaHQoKVxuICAgICAgICB7XG4gICAgICAgICAgLy8gY2FsY3VsYXRlIHNjcm9sbGJhciBoZWlnaHQgYW5kIG1ha2Ugc3VyZSBpdCBpcyBub3QgdG9vIHNtYWxsXG4gICAgICAgICAgYmFySGVpZ2h0ID0gTWF0aC5tYXgoKG1lLm91dGVySGVpZ2h0KCkgLyBtZVswXS5zY3JvbGxIZWlnaHQpICogbWUub3V0ZXJIZWlnaHQoKSwgbWluQmFySGVpZ2h0KTtcbiAgICAgICAgICBiYXIuY3NzKHsgaGVpZ2h0OiBiYXJIZWlnaHQgKyAncHgnIH0pO1xuXG4gICAgICAgICAgLy8gaGlkZSBzY3JvbGxiYXIgaWYgY29udGVudCBpcyBub3QgbG9uZyBlbm91Z2hcbiAgICAgICAgICB2YXIgZGlzcGxheSA9IGJhckhlaWdodCA9PSBtZS5vdXRlckhlaWdodCgpID8gJ25vbmUnIDogJ2Jsb2NrJztcbiAgICAgICAgICBiYXIuY3NzKHsgZGlzcGxheTogZGlzcGxheSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNob3dCYXIoKVxuICAgICAgICB7XG4gICAgICAgICAgLy8gcmVjYWxjdWxhdGUgYmFyIGhlaWdodFxuICAgICAgICAgIGdldEJhckhlaWdodCgpO1xuICAgICAgICAgIGNsZWFyVGltZW91dChxdWV1ZUhpZGUpO1xuXG4gICAgICAgICAgLy8gd2hlbiBiYXIgcmVhY2hlZCB0b3Agb3IgYm90dG9tXG4gICAgICAgICAgaWYgKHBlcmNlbnRTY3JvbGwgPT0gfn5wZXJjZW50U2Nyb2xsKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIC8vcmVsZWFzZSB3aGVlbFxuICAgICAgICAgICAgcmVsZWFzZVNjcm9sbCA9IG8uYWxsb3dQYWdlU2Nyb2xsO1xuXG4gICAgICAgICAgICAvLyBwdWJsaXNoIGFwcHJvcG9yaWF0ZSBldmVudFxuICAgICAgICAgICAgaWYgKGxhc3RTY3JvbGwgIT0gcGVyY2VudFNjcm9sbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gKH5+cGVyY2VudFNjcm9sbCA9PSAwKSA/ICd0b3AnIDogJ2JvdHRvbSc7XG4gICAgICAgICAgICAgICAgbWUudHJpZ2dlcignc2xpbXNjcm9sbCcsIG1zZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWxlYXNlU2Nyb2xsID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxhc3RTY3JvbGwgPSBwZXJjZW50U2Nyb2xsO1xuXG4gICAgICAgICAgLy8gc2hvdyBvbmx5IHdoZW4gcmVxdWlyZWRcbiAgICAgICAgICBpZihiYXJIZWlnaHQgPj0gbWUub3V0ZXJIZWlnaHQoKSkge1xuICAgICAgICAgICAgLy9hbGxvdyB3aW5kb3cgc2Nyb2xsXG4gICAgICAgICAgICByZWxlYXNlU2Nyb2xsID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYmFyLnN0b3AodHJ1ZSx0cnVlKS5mYWRlSW4oJ2Zhc3QnKTtcbiAgICAgICAgICBpZiAoby5yYWlsVmlzaWJsZSkgeyByYWlsLnN0b3AodHJ1ZSx0cnVlKS5mYWRlSW4oJ2Zhc3QnKTsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaGlkZUJhcigpXG4gICAgICAgIHtcbiAgICAgICAgICAvLyBvbmx5IGhpZGUgd2hlbiBvcHRpb25zIGFsbG93IGl0XG4gICAgICAgICAgaWYgKCFvLmFsd2F5c1Zpc2libGUpXG4gICAgICAgICAge1xuICAgICAgICAgICAgcXVldWVIaWRlID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBpZiAoIShvLmRpc2FibGVGYWRlT3V0ICYmIGlzT3ZlclBhbmVsKSAmJiAhaXNPdmVyQmFyICYmICFpc0RyYWdnKVxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYmFyLmZhZGVPdXQoJ3Nsb3cnKTtcbiAgICAgICAgICAgICAgICByYWlsLmZhZGVPdXQoJ3Nsb3cnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIH0pO1xuXG4gICAgICAvLyBtYWludGFpbiBjaGFpbmFiaWxpdHlcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSk7XG5cbiAgJC5mbi5leHRlbmQoe1xuICAgIHNsaW1zY3JvbGw6ICQuZm4uc2xpbVNjcm9sbFxuICB9KTtcblxufSkoalF1ZXJ5KTtcbiJdfQ==
